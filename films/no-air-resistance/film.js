/* =====================================================================
   FILM — "What if air resistance suddenly disappeared?"
   Builds the avenue, its people, the wind, the traffic, the airliner and
   the debris, and the skydiver's separate scene (shown through view());
   your hands with the sheet of paper and the ball; the HUD (aerodynamic
   force, wind, live tags pinned to things) and the grade.
   ===================================================================== */

// camera space, right hand (mirrored for the left). Held out in front while you look down at the pavement (pitch −48°)
const NR_HAND_POSES = {
  holdPaperR: { p: [0.13, 0.03, -0.47], F: [-0.12, 0.74, -0.67], N: [-0.25, -0.66, -0.72], curl: [0.3, 0.42, 0.55, 0.62], thumb: [0.18, 0.42] },
  holdBallL: { p: [0.14, 0.02, -0.46], F: [-0.1, 0.74, -0.67], N: [-0.15, -0.66, -0.73], curl: [0.62, 0.68, 0.74, 0.8], thumb: [0.42, 0.55] },
  openR: { p: [0.135, 0.035, -0.47], F: [-0.12, 0.76, -0.64], N: [-0.25, -0.64, -0.73], curl: [0.05, 0.06, 0.08, 0.1], thumb: [0.7, 0.06] },
  openL: { p: [0.145, 0.025, -0.46], F: [-0.1, 0.76, -0.64], N: [-0.15, -0.64, -0.74], curl: [0.05, 0.06, 0.08, 0.1], thumb: [0.75, 0.06] },
  runR: { p: [0.2, -0.36, -0.34], F: [-0.1, 0.9, -0.45], N: [-1, 0, 0], curl: [1.2, 1.25, 1.3, 1.35], thumb: [0.3, 0.9] },
  runL: { p: [0.19, -0.4, -0.3], F: [-0.1, 0.9, -0.45], N: [-1, 0, 0], curl: [1.2, 1.25, 1.3, 1.35], thumb: [0.3, 0.9] },
  shieldR: { p: [0.15, -0.1, -0.33], F: [-0.35, 0.92, -0.15], N: [0.1, 0.1, -1], curl: [0.3, 0.35, 0.4, 0.45], thumb: [0.4, 0.25] },
};
const NR_HAND_BLEND = { holdPaperR: 0.45, holdBallL: 0.45, openR: 0.07, openL: 0.07, runR: 0.3, runL: 0.3, shieldR: 0.18, hidden: 0.5 };

const FILM = {
  build(app) {
    const { scene, camera, renderer, rng } = app;
    FILM._app = app;
    camera.near = 0.03; camera.far = 24000; camera.updateProjectionMatrix();
    app.env = new NrCity(scene, renderer, rng); app.env.camera = camera; app.env.build();
    app.people = new NrPeople(scene);
    app.pigeons = new NrPigeons(scene);
    app.traffic = new NrTraffic(scene);
    app.balloon = new NrBalloon(scene, app.people);
    app.wind = new NrWind(app);
    app.board = new NrBoard(scene);
    Look.apply(scene, camera);
    app.plane = new NrPlane(scene);
    app.impact = new NrImpact(scene);
    app.debris = new NrDebris(scene, app);
    app.aerial = new NrAerial(app);
    app.hands = new ViewerHands(camera, { scale: 1.0, skin: '#c99a7c', nail: '#dcbcae', sleeve: '#3d4a5a', cuff: '#2c3542', watch: true, poses: NR_HAND_POSES, blends: NR_HAND_BLEND });
    this._props(app);
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    const hud = document.getElementById('hud');
    const mk = (cls, html = '') => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; d.style.opacity = '0'; hud.appendChild(d); return d; };
    app.ui = {
      aero: mk('readout story-readout nr-aero', '<div class="label">AERODYNAMIC FORCE</div><div class="value"><span class="v">100%</span></div><div class="sub">ON EVERY SOLID OBJECT</div>'),
      wind: mk('readout story-readout nr-wind', '<div class="label">WIND</div><div class="value"><span class="v">40 KM/H</span></div><div class="sub">THE AIR IS STILL MOVING</div>'),
      speed: mk('readout story-readout nr-speed', '<div class="label">HIS SPEED</div><div class="value"><span class="v">0 KM/H</span></div><div class="sub">NORMAL TOP SPEED ≈ 200 KM/H</div>'),
      alt: mk('readout story-readout nr-alt', '<div class="label">ALTITUDE</div><div class="value"><span class="v">0 M</span></div>'),
      tagA: mk('nr-tag'), tagB: mk('nr-tag'), tagC: mk('nr-tag ghost'), tagD: mk('nr-tag ghost'),
      line: mk('nr-line'),
      meanwhile: mk('nr-meanwhile', 'MEANWHILE, 2 KM ABOVE THE CITY'),
    };
    app.audio = typeof NrAudio !== 'undefined' ? new NrAudio(app.tl, app) : new AudioEngine(app.tl);
  },

  // the sheet of paper (right hand) and the tennis ball (left hand); free copies take over at the release
  _props(app) {
    const pg = new THREE.PlaneGeometry(0.21, 0.297, 6, 8), pa = pg.attributes.position;
    for (let i = 0; i < pa.count; i++) { const y = pa.getY(i) + 0.1485; pa.setZ(i, 0.35 * (y / 0.297) ** 2 * 0.06); }
    pg.translate(0, 0.1485, 0); pg.computeVertexNormals();
    const pm = new THREE.MeshStandardMaterial({ color: '#f7f5ef', roughness: 0.85, side: THREE.DoubleSide });
    const c = Tex.canvas(128, 128), x = c.getContext('2d'); x.fillStyle = '#d4e157'; x.fillRect(0, 0, 128, 128); x.strokeStyle = '#f6f6ee'; x.lineWidth = 7; x.beginPath(); x.arc(0, 64, 44, -1.2, 1.2); x.stroke(); x.beginPath(); x.arc(128, 64, 44, Math.PI - 1.2, Math.PI + 1.2); x.stroke();
    const bm = new THREE.MeshStandardMaterial({ map: Tex.tex(c), roughness: 0.95 }), bg = new THREE.SphereGeometry(0.033, 18, 12);
    const H = app.hands;
    const heldP = new THREE.Mesh(pg, pm); heldP.position.set(0.004, 0.105, 0.012); heldP.rotation.x = 0.06; H.right.g.add(heldP);
    const heldB = new THREE.Mesh(bg, bm); heldB.position.set(0, 0.07, 0.042); H.left.g.add(heldB);
    for (const m of [heldP, heldB]) m.frustumCulled = false;
    const freeP = new THREE.Mesh(pg, pm), freeB = new THREE.Mesh(bg, bm); freeP.castShadow = freeB.castShadow = true; app.scene.add(freeP, freeB);
    // the normal-air ghost of the sheet
    const gm = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    const ghost = new THREE.Mesh(pg, gm), ge = new THREE.LineSegments(new THREE.EdgesGeometry(pg), new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 })); ghost.add(ge); app.scene.add(ghost);
    app.props = { heldP, heldB, freeP, freeB, ghost, ge, rel: null };
  },

  // where the props were at the release (evaluated once at that exact moment, so every frame agrees)
  _release(app) {
    const P = app.props;
    if (P.rel) return P.rel;
    const t = NR.drop.rel;
    app.cam.update(t); app.hands.update(t); app.camera.updateMatrixWorld(true);
    const r = { p: P.heldP.getWorldPosition(new THREE.Vector3()), q: P.heldP.getWorldQuaternion(new THREE.Quaternion()), b: P.heldB.getWorldPosition(new THREE.Vector3()) };
    r.yaw = new THREE.Euler().setFromQuaternion(r.q, 'YXZ').y;
    P.rel = r; return r;
  },

  // a tennis ball dropped from rest: bounces (restitution 0.72), rolls a little
  _ball(u, y0, out) {
    const g = NR_G, e = 0.72, floor = LAYOUT.curbH + 0.033;
    let h = y0 - floor, t = u, v = 0, y;
    const t1 = Math.sqrt(2 * h / g);
    if (t < t1) return out.set(0, y0 - 0.5 * g * t * t, t * 0.05);
    t -= t1; v = e * g * t1;
    for (let k = 0; k < 8; k++) { const T = 2 * v / g; if (t < T) { y = floor + v * t - 0.5 * g * t * t; return out.set(0, y, 0.05 * t1 + 0.12 * (u - t1)); } t -= T; v *= e; }
    return out.set(0, floor, 0.05 * t1 + 0.12 * Math.min(u - t1, 2.4) * (1 - Math.min(u - t1, 2.4) / 4.8));
  },

  update(app, S) {
    const cam = app.camera;
    app.S = S;
    app.env.update(S, S);
    app.people.update(S);
    app.pigeons.update(S);
    app.traffic.update(S);
    app.balloon.update(S);
    app.wind.update(S, S, cam);
    app.board.update(S);
    app.plane.update(S, cam);
    app.impact.update(S);
    app.debris.update(S, cam);
    if (S >= NR.sky[0] && S < NR.sky[1]) app.aerial.update(S);
    // the drop
    const P = app.props, u = S - NR.drop.rel;
    P.heldP.visible = u < 0 && S > NR.drop.up - 0.2; P.heldB.visible = P.heldP.visible;
    P.freeP.visible = P.freeB.visible = u >= 0 && S < 12.4; P.ghost.visible = u >= 0 && S < 12.4;
    if (u >= 0 && S < 12.4) {
      const fresh = !P.rel, r = this._release(app), floor = LAYOUT.curbH + 0.004, tl = Math.sqrt(2 * (r.p.y - floor) / NR_G);
      if (fresh) app.cam.update(S);
      P.freeP.position.set(r.p.x, Math.max(floor, r.p.y - NR_DROP.fall(u)), r.p.z);
      if (u < tl) P.freeP.quaternion.copy(r.q); else P.freeP.rotation.set(-Math.PI / 2, 0, r.yaw, 'YXZ');
      const b = this._ball(u, r.b.y, this._bv || (this._bv = new THREE.Vector3()));
      P.freeB.position.set(r.b.x + b.z * 0.4, b.y, r.b.z - b.z); P.freeB.rotation.set(-b.z / 0.033, 0, 0);
      const gh = NR_DROP.ghost(u), ga = 0.3 * MathX.smooth(u, 0.05, 0.3) * (1 - MathX.smooth(S, 10.4, 10.9));
      P.ghost.position.set(r.p.x - 0.1 * Math.min(u * 2, 1) + gh[1], Math.max(floor + 0.002, r.p.y - gh[0]), r.p.z - 0.03); P.ghost.quaternion.copy(r.q); P.ghost.rotateX(gh[2]); P.ghost.rotateZ(0.4 * gh[2]);
      P.ghost.material.opacity = ga; P.ge.material.opacity = Math.min(1, ga * 3);
    }
    app.hands.update(S);
    this._overlays(app, S);
  },

  view(app, S) { return S >= NR.sky[0] && S < NR.sky[1] ? [app.aerial.scene, app.aerial.cam] : [app.scene, app.camera]; },

  // a screen position (design px) for a world point; null if behind the camera
  _proj(cam, p) { const v = this._pv || (this._pv = new THREE.Vector3()); v.copy(p).project(cam); if (v.z > 1) return null; return [(v.x + 1) * 540, (1 - v.y) * 960]; },
  _tag(el, xy, html, on, side = '') {
    if (el._side !== side) { el.classList.toggle('left', side === 'left'); el.classList.toggle('right', side === 'right'); el._side = side; }
    if (!on || !xy || xy[0] < 40 || xy[0] > 1040 || xy[1] < 290 || xy[1] > 1700) { if (el._o !== '0') { el.style.opacity = '0'; el._o = '0'; } return; }
    if (el._h !== html) { el.innerHTML = html; el._h = html; }
    el.style.opacity = '1'; el._o = '1';
    el.style.left = `calc(var(--u) * ${MathX.clamp(xy[0], 150, 930).toFixed(1)})`; el.style.top = `calc(var(--u) * ${MathX.clamp(xy[1], 240, 1680).toFixed(1)})`;
  },

  _overlays(app, S) {
    const U = app.ui, W = StoryHUD.win, set = (el, k, v) => { if (el['_' + k] !== v) { el.style[k] = v; el['_' + k] = v; } }, html = (el, v) => { if (el._hh !== v) { el.innerHTML = v; el._hh = v; } };
    const sky = S >= NR.sky[0] && S < NR.sky[1], end = S >= NR.look + 0.4, cam = sky ? app.aerial.cam : app.camera;
    // AERODYNAMIC FORCE 100 % → 0 % (and, at the end, AIR RESISTANCE 0 %)
    const a = Math.round(nrAero(S) * 100);
    set(U.aero, 'opacity', (sky ? 0 : end ? W(S, NR.look + 0.4, NR.black, 0.5, 0.05) : S < 10.9 ? 1 : W(S, 20.6, NR.look, 0.4, 0.3) * 0.85).toFixed(3));
    html(U.aero.querySelector('.label'), end ? 'AIR RESISTANCE' : 'AERODYNAMIC FORCE');
    html(U.aero.querySelector('.v'), `${a}%`);
    set(U.aero.querySelector('.sub'), 'opacity', (end ? 0 : MathX.smooth(S, NR.loss + 0.3, NR.loss + 0.7)).toFixed(2));
    U.aero.classList.toggle('small', S > 10.9 && !end);
    U.aero.classList.toggle('zero', S > NR.loss + 0.2);
    // WIND: once it has been shown to still blow, and when it rises
    set(U.wind, 'opacity', (W(S, 3.0, 10.9, 0.4, 0.05) + W(S, 40.2, 44.5, 0.4, 0.3)).toFixed(3));
    html(U.wind.querySelector('.v'), `${Math.round(nrWindKmh(S) / 5) * 5} KM/H`);
    // the sky: his speed and height
    set(U.speed, 'opacity', (sky ? MathX.smooth(S, 12.6, 13.0) : 0).toFixed(3)); set(U.alt, 'opacity', (sky ? MathX.smooth(S, 12.7, 13.1) : 0).toFixed(3));
    html(U.speed.querySelector('.v'), `${Math.round(NR_JUMP.speed(S) * 3.6)} KM/H`);
    html(U.alt.querySelector('.v'), `${(Math.round(NR_JUMP.alt(S) / 10) * 10).toLocaleString('en-US')} M`);
    set(U.meanwhile, 'opacity', W(S, NR.sky[0], 14.4, 0.05, 0.4).toFixed(3));
    // tags pinned to things
    const V = this._tv || (this._tv = new THREE.Vector3()), P = app.props;
    let A = null, B = null, C = null, D = null, line = '';
    if (S > NR.drop.rel + 0.55 && S < 10.6 && P.rel) A = [this._proj(cam, V.copy(P.rel.b).setY(0.5)), 'BOTH LAND IN <b>0.52 S</b>'];
    if (S > NR.drop.rel + 0.15 && S < 10.5 && P.ghost.visible) C = [this._proj(cam, V.copy(P.ghost.position).add({ x: 0.05, y: 0.25, z: 0 })), 'NORMAL AIR'];
    if (sky) {
      if (S > 12.7 && S < 14.4) A = [this._proj(cam, app.aerial.plane.position), 'AIRLINER · 10.8 KM UP'];
      if (S > NR.deploy + 1.1 && S < 20.3) B = [this._proj(cam, V.copy(app.aerial.canopy.position).add({ x: 0, y: 1.2, z: 0 })), 'DRAG <b>0 N</b>'];
    }
    if (!sky && S > 20.5 && S < 28.2) {
      const T = app.traffic, hz = T.heroZ(S), gz = T.ghostZ(S);
      A = [this._proj(cam, V.set(1.75, S > 24 ? 1.0 : 2.0, hz)), `COASTING · <b>${Math.round(NR_CAR.speed(S) * 3.6)}</b> KM/H`, S > 24 ? 'right' : ''];
      if (S > 23.0) D = [this._proj(cam, V.set(-1.75, 1.0, gz)), `NORMAL AIR · ${Math.round(NR_CAR.speed(S, true) * 3.6)} KM/H`, 'left'];
      if (S > NR.car.toss + 0.05 && S < 23.2) { const s0 = T.sheets[4].m.position; C = [this._proj(cam, V.copy(s0).add({ x: 0, y: 0.5, z: 0 })), `LEAFLETS · ${Math.round(NR_CAR.speed(NR.car.toss) * 3.6)} KM/H`]; }
      if (S > 24.8) line = 'COASTING FROM 90 KM/H: <b>2.7 KM</b> · NORMAL AIR 1.7 KM';
    }
    if (S > NR.ledge + 0.05 && S < NR.ledge + 1.2) B = [this._proj(cam, V.copy(app.pigeons.ledge.g.position).add({ x: 0, y: 0.35, z: 0 })), 'LIFT <b>0 N</b>'];
    if (S > 35.3 && S < 40.3) { const p = app.plane.g.position; A = [this._proj(cam, V.copy(p).add({ x: 0, y: 60, z: 0 })), `LIFT 0 N · <b>${(Math.round(NR_PLANE.alt(S) / 10) * 10).toLocaleString('en-US')} M</b> · ${Math.round(NR_PLANE.kmh(S) / 10) * 10} KM/H`]; }
    if (S > 36.0 && S < 40.3) line = 'FALLING SINCE THE AIR LET GO';
    if (S > NR.balloon + 0.3 && S < 46.7) B = [this._proj(cam, V.copy(app.balloon.b.position).add({ x: 0, y: 0.5, z: 0 })), `BUOYANCY, NO DRAG · <b>${Math.round(app.balloon.speed(S) * 3.6)}</b> KM/H`];
    if (S > 48.1 && S < 49.3) A = [this._proj(cam, V.copy(app.plane.g.position).add({ x: 0, y: 70, z: 0 })), `LIFT 0 N · <b>${(Math.round(NR_PLANE.kmh(S) / 10) * 10).toLocaleString('en-US')}</b> KM/H`];
    // the impact is 2.1 km away: you see it at once, its sound takes 6 s (the air still carries sound)
    if (S > NR.impact + 0.9 && S < NR.boom) line = `${(NR.impactDist / 1000).toFixed(1)} KM AWAY · ITS SOUND ARRIVES IN <b>${Math.ceil(NR.boom - S)} S</b>`;
    if (S > 58.9 && S < 60.3) { const k = this._debrisKmh || (this._debrisKmh = Math.round(app.debris.list.filter((d) => d.near).reduce((a, d) => a + d.P.kmh, 0) / app.debris.list.filter((d) => d.near).length / 10) * 10); line = `THROWN ${(NR.impactDist / 1000).toFixed(1)} KM · ARRIVING AT <b>≈ ${k} KM/H</b>`; }
    if (S > NR.board + 0.1 && S < app.board.landT + 0.4) {
      A = [this._proj(cam, V.copy(app.board.g.position).add({ x: 0, y: 1.1, z: 0 })), `SIGN BOARD · NO DRAG · <b>${Math.round(app.board.speed(S) * 3.6)}</b> KM/H`, 'right'];
      if (app.board.ghost.visible) D = [this._proj(cam, V.copy(app.board.ghost.position).add({ x: 0, y: 1.1, z: 0 })), 'NORMAL AIR', 'left'];
    }
    for (const [el, T] of [[U.tagA, A], [U.tagB, B], [U.tagC, C], [U.tagD, D]]) this._tag(el, T && T[0], T && T[1], !!T, (T && T[2]) || '');
    html(U.line, line); set(U.line, 'opacity', line ? '1' : '0');
  },

  grade(S, p) {
    const app = FILM._app, sky = S >= NR.sky[0] && S < NR.sky[1], storm = MathX.smooth(S, NR.storm[0], NR.storm[1] + 2);
    p.flash = 0; p.fade = 0; p.chroma = 0; p.ao = 0.7; p.flashColor.setRGB(1, 1, 1);
    p.exposure = 1.12 - 0.04 * storm; p.saturation = 1.12 - 0.08 * storm; p.contrast = 1.07 + 0.04 * storm; p.warmth = 0.04 - 0.05 * storm; p.blackLift = 0.01;
    p.vignette = 0.5 + 0.1 * storm; p.soft = 0.04; p.bloom = 0.16; p.bloomThreshold = 1.3; p.grain = 0.022;
    p.tunnel = 1.25; p.tunnelSoft = 0.5; p.tunnelDark = 0; p.edgeBlur = 0; p.smear.set(0, 0);
    if (sky) { p.exposure = 1.08; p.saturation = 1.0; p.contrast = 1.04; p.warmth = 0.02; p.vignette = 0.55; p.ao = 0.4; }
    // a motion smear when your head turns fast
    if (app && app.cam && !sky) {
      const C = app.cam, dt = 1 / 30, vf = C.tfov.value(S), hfov = 2 * Math.atan(Math.tan(MathX.deg(vf) / 2) * 9 / 16) * 180 / Math.PI;
      const yr = (C.tyaw.value(S) - C.tyaw.value(S - dt)) / dt, pr = (C.tpitch.value(S) - C.tpitch.value(S - dt)) / dt;
      p.smear.set(MathX.clamp(yr / hfov * 0.005, -0.02, 0.02), MathX.clamp(-pr / vf * 0.005, -0.02, 0.02));
    }
    // the impact (far away): a pale flash; the sign board hitting the pavement near you
    p.flash = 0.18 * MathX.impulse(S, NR.impact, 0.25);
    if (app && app.board) p.flash += 0.12 * MathX.impulse(S, app.board.landT, 0.08);
    // the last look up: a touch darker so the closing lines read against the sky
    const endK = MathX.smooth(S, NR.look, NR.line[0] + 0.4); p.exposure -= 0.14 * endK; p.vignette += 0.22 * endK; p.contrast += 0.03 * endK;
    if (S >= NR.black) p.fade = 1;
  },

  anchor() { return null; },
  debug(app, t) { const S = Edit.story(t); return `S ${S.toFixed(2)} · aero ${(nrAero(S) * 100).toFixed(0)}% · wind ${nrWindKmh(S).toFixed(0)} km/h · plane ${NR_PLANE.alt(S).toFixed(0)} m`; },
};
