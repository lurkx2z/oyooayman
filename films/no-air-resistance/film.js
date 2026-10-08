/* =====================================================================
   FILM — "What if air resistance suddenly disappeared?"
   Builds the avenue, the party's roof and its guests, the traffic, the
   storm (rain, confetti, the cloud's ice), the balloons, and the
   cut-away's separate scene up in the storm cloud (shown through view());
   your hands with the sheet of paper and the ball; the HUD (aerodynamic
   force, wind, the ice's speed and height, live tags pinned to things)
   and the grade.
   ===================================================================== */

// camera space, right hand (mirrored for the left). Held out over the parapet while you look down at the pavement
const NR_HAND_POSES = {
  holdPaperR: { p: [0.13, 0.03, -0.47], F: [-0.12, 0.74, -0.67], N: [-0.25, -0.66, -0.72], curl: [0.3, 0.42, 0.55, 0.62], thumb: [0.18, 0.42] },
  holdBallL: { p: [0.14, 0.02, -0.46], F: [-0.1, 0.74, -0.67], N: [-0.15, -0.66, -0.73], curl: [0.62, 0.68, 0.74, 0.8], thumb: [0.42, 0.55] },
  openR: { p: [0.135, 0.035, -0.47], F: [-0.12, 0.76, -0.64], N: [-0.25, -0.64, -0.73], curl: [0.05, 0.06, 0.08, 0.1], thumb: [0.7, 0.06] },
  openL: { p: [0.145, 0.025, -0.46], F: [-0.1, 0.76, -0.64], N: [-0.15, -0.64, -0.74], curl: [0.05, 0.06, 0.08, 0.1], thumb: [0.75, 0.06] },
  shieldR: { p: [0.15, -0.1, -0.33], F: [-0.35, 0.92, -0.15], N: [0.1, 0.1, -1], curl: [0.3, 0.35, 0.4, 0.45], thumb: [0.4, 0.25] },
  frameL: { p: [0.2, -0.12, -0.34], F: [-0.05, 0.98, -0.2], N: [-1, 0, -0.1], curl: [0.25, 0.3, 0.35, 0.4], thumb: [0.5, 0.2] },
};
const NR_HAND_BLEND = { holdPaperR: 0.45, holdBallL: 0.45, openR: 0.07, openL: 0.07, shieldR: 0.18, frameL: 0.3, hidden: 0.5 };

const FILM = {
  build(app) {
    const { scene, camera, renderer, rng } = app;
    FILM._app = app;
    camera.near = 0.03; camera.far = 24000; camera.updateProjectionMatrix();
    app.env = new NrCity(scene, renderer, rng); app.env.camera = camera; app.env.build();
    app.people = new NrPeople(scene);
    app.traffic = new NrTraffic(scene);
    app.wind = new NrWind(app);
    app.roof = new NrRoof(app);
    app.storm = new NrStorm(app);
    app.balloons = new NrBalloons(scene, app.people);
    Look.apply(scene, camera);
    // a faint fill from below, so undersides aren't pure black when you look up
    const fill = new THREE.DirectionalLight('#c9d2da', 0.45); fill.position.set(0.2, -1, 0.35); scene.add(fill, fill.target);
    app.aerial = new NrAerial(app);
    app.hands = new ViewerHands(camera, { scale: 1.0, skin: '#c99a7c', nail: '#dcbcae', sleeve: '#3d4a5a', cuff: '#2c3542', watch: true, poses: NR_HAND_POSES, blends: NR_HAND_BLEND });
    this._props(app);
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    const hud = document.getElementById('hud');
    const mk = (cls, html = '') => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; d.style.opacity = '0'; hud.appendChild(d); return d; };
    app.ui = {
      aero: mk('readout story-readout nr-aero', '<div class="label">AERODYNAMIC FORCE</div><div class="value"><span class="v">100%</span></div><div class="sub">NO DRAG · NO LIFT · ON ANY SOLID</div>'),
      wind: mk('readout story-readout nr-wind', '<div class="label">WIND</div><div class="value"><span class="v">50 KM/H</span></div><div class="sub">THE AIR IS STILL MOVING</div>'),
      clock: mk('readout story-readout nr-clock', '<div class="label">THE CLOUD’S ICE LANDS IN</div><div class="value"><span class="v">16 S</span></div>'),
      ice: mk('readout story-readout nr-ice', '<div class="label">ICE LANDING NOW</div><div class="value"><span class="v">0 KM/H</span></div><div class="sub">FELL 6.0 KM</div>'),
      tagA: mk('nr-tag'), tagB: mk('nr-tag'), tagC: mk('nr-tag ghost'), tagD: mk('nr-tag ghost'),
      line: mk('nr-line'),
      meanwhile: mk('nr-meanwhile', '<span>9 KM ABOVE THE PARTY</span>'),
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

  // the haze: the storm's rain thickens it a little; the ice's white-out thickens it a lot (it clears when the ice is down)
  _fog(app, S) {
    const f = app.scene.fog, k = app.env.storm(S), w = MathX.smooth(NR_ICE.flux(S), 0.05, 0.9);
    f.density = 0.0011 + 0.0007 * k + 0.007 * w;
    f.color.copy(app.env.fogColor).lerp(this._fogStorm || (this._fogStorm = new THREE.Color('#8f979f')), k).lerp(this._fogIce || (this._fogIce = new THREE.Color('#8e969e')), w);
  },

  update(app, S) {
    const cam = app.camera;
    app.S = S;
    this._fog(app, S);
    app.env.update(S, S);
    app.people.update(S);
    app.traffic.update(S);
    app.wind.update(S, S, cam);
    app.roof.update(S, cam);
    app.balloons.update(S);
    app.storm.update(S, cam);
    if (S >= NR.sky[0] && S < NR.sky[1]) app.aerial.update(S);
    // the drop
    const P = app.props, u = S - NR.drop.rel;
    P.heldP.visible = u < 0 && S > NR.drop.up - 0.2; P.heldB.visible = P.heldP.visible;
    P.freeP.visible = P.freeB.visible = u >= 0 && S < NR.sky[0]; P.ghost.visible = u >= 0 && S < NR.sky[0];
    if (u >= 0 && S < NR.sky[0]) {
      const fresh = !P.rel, r = this._release(app), floor = LAYOUT.curbH + 0.004, tl = Math.sqrt(2 * (r.p.y - floor) / NR_G);
      if (fresh) { app.cam.update(S); app.hands.update(S); }
      P.freeP.position.set(r.p.x, Math.max(floor, r.p.y - NR_DROP.fall(u)), r.p.z);
      if (u < tl) P.freeP.quaternion.copy(r.q); else P.freeP.rotation.set(-Math.PI / 2, 0, r.yaw, 'YXZ');
      const b = this._ball(u, r.b.y, this._bv || (this._bv = new THREE.Vector3()));
      P.freeB.position.set(r.b.x - b.z * 0.6, b.y, r.b.z - b.z * 0.4); P.freeB.rotation.set(-b.z / 0.033, 0, 0);
      // the ghost: the same sheet in normal (still) air flutters down at a walking pace
      const gh = NR_DROP.ghost(u), ga = 0.5 * MathX.smooth(u, 0.0, 0.12);
      P.ghost.position.set(r.p.x + gh[1], Math.max(floor + 0.002, r.p.y - gh[0]), r.p.z + gh[2]); P.ghost.quaternion.copy(r.q); P.ghost.rotateX(0.5 + 0.4 * gh[3]); P.ghost.rotateZ(0.5 * gh[3]);
      P.ghost.material.opacity = ga; P.ge.material.opacity = Math.min(1, ga * 3);
    }
    app.hands.update(S);
    this._overlays(app, S);
  },

  view(app, S) { return S >= NR.sky[0] && S < NR.sky[1] ? [app.aerial.scene, app.aerial.cam] : [app.scene, app.camera]; },

  // a screen position (design px) for a world point; null if behind the camera
  _proj(cam, p) { const v = this._pv || (this._pv = new THREE.Vector3()); v.copy(p).project(cam); if (v.z > 1) return null; return [(v.x + 1) * 540, (1 - v.y) * 960]; },
  // a tag pinned to a thing: hidden when the thing is off screen; kept inside the safe area (8 % in from the left, clear of
  // the button rail on the right (18 %), above the description zone (75 % down))
  _tag(el, xy, html, on, side = '') {
    if (el._side !== side) { el.classList.toggle('left', side === 'left'); el.classList.toggle('right', side === 'right'); el._side = side; }
    if (!on || !xy || xy[0] < 10 || xy[0] > 1070 || xy[1] < 120 || xy[1] > 1720) { if (el._o !== '0') { el.style.opacity = '0'; el._o = '0'; } return; }
    if (el._h !== html) { el.innerHTML = html; el._h = html; }
    el.style.opacity = '1'; el._o = '1';
    const w = el.offsetWidth / (parseFloat(document.documentElement.style.getPropertyValue('--u')) || 0.5) || 420;   // its width (design px)
    const [x0, x1] = side === 'right' ? [86, 886 - w * 1.04] : side === 'left' ? [86 + w * 1.04, 886] : [86 + w / 2, 886 - w / 2];
    el.style.left = `calc(var(--u) * ${MathX.clamp(xy[0], x0, Math.max(x0, x1)).toFixed(1)})`; el.style.top = `calc(var(--u) * ${MathX.clamp(xy[1], side ? 400 : 450, 1440).toFixed(1)})`;
  },

  _overlays(app, S) {
    const U = app.ui, W = StoryHUD.win, set = (el, k, v) => { if (el['_' + k] !== v) { el.style[k] = v; el['_' + k] = v; } }, html = (el, v) => { if (el._hh !== v) { el.innerHTML = v; el._hh = v; } };
    const sky = S >= NR.sky[0] && S < NR.sky[1], cam = sky ? app.aerial.cam : app.camera;
    // AERODYNAMIC FORCE 100 % → 0 % (big in the opening, small in the corner later)
    const a = Math.round(nrAero(S) * 100);
    set(U.aero, 'opacity', (S < NR.walk[1] ? W(S, NR.title[1] - 1.9, NR.walk[1], 0.3, 0.05) : 0).toFixed(3));
    html(U.aero.querySelector('.v'), `${a}%`);
    set(U.aero.querySelector('.sub'), 'opacity', MathX.smooth(S, NR.loss + 0.3, NR.loss + 0.7).toFixed(2));
    U.aero.classList.toggle('small', S > NR.cut0);
    U.aero.classList.toggle('zero', S > NR.loss + 0.2);
    // WIND: once it has been shown to still blow, and when the storm brings more of it
    set(U.wind, 'opacity', (W(S, NR.title[1], NR.walk[1], 0.4, 0.1) + W(S, NR.gale[0] - 0.2, 27.4, 0.3, 0.3)).toFixed(3));
    html(U.wind.querySelector('.v'), `${Math.round(nrWindKmh(S) / 5) * 5} KM/H`);
    // back on the roof: the clock to the cloud's first ice (the ice readout takes its place)
    set(U.clock, 'opacity', W(S, NR.sky[1] + 0.4, NR_ICE.first - 0.04, 0.4, 0.06).toFixed(3));
    html(U.clock.querySelector('.v'), `${Math.max(1, Math.ceil(NR_ICE.first - S))} S`);
    set(U.meanwhile, 'opacity', W(S, NR.sky[0], NR.sky[0] + 1.7, 0.05, 0.35).toFixed(3));
    // the ice: how fast what is landing now is going, and how far it fell
    const ip = MathX.clamp(S, NR_ICE.first, NR_ICE.last);
    set(U.ice, 'opacity', W(S, NR_ICE.first - 0.05, NR.quiet + 0.15, 0.15, 0.35).toFixed(3));
    html(U.ice.querySelector('.v'), `${Math.round(NR_ICE.kmh(ip)).toLocaleString('en-US')} KM/H`);
    html(U.ice.querySelector('.sub'), `FELL ${(NR_ICE.h(ip) / 1000).toFixed(1)} KM · THE AIR DIDN’T SLOW IT`);
    // tags pinned to things
    const V = this._tv || (this._tv = new THREE.Vector3()), P = app.props, St = app.storm;
    let A = null, B = null, C = null, D = null, line = '';
    // (the kite has gone over the edge into the street: the tag is on its flyer's hands, still holding the string)
    if (S > 3.7 && S < NR.walk[1] - 0.1 && app.people && app.people.byId.K) A = [this._proj(cam, app.people.byId.K.handWorld(-1, V).add({ x: 0, y: 0.2, z: 0 })), 'KITE · <b>FELL INTO THE STREET</b>', 'left'];
    if (S > NR.walk[1] + 0.15 && S < NR.drop.rel - 0.1) A = [[600, 1330], 'GROUND FLOOR · <b>22 M DOWN</b>'];
    if (S > NR.drop.rel + 0.5 && S < NR.cut0 && P.rel) { const tl = Math.sqrt(2 * (P.rel.p.y - LAYOUT.curbH - 0.004) / NR_G); A = [this._proj(cam, V.copy(P.rel.b).setY(0.8).add({ x: 0.4, y: 0, z: 0.15 })), `BOTH LAND IN <b>${tl.toFixed(2)} S</b>`, 'right']; }
    if (S > NR.drop.rel + 0.1 && S < NR.cut0 && P.ghost.visible) C = [this._proj(cam, V.copy(P.ghost.position).add({ x: 0, y: 0.3, z: 0 })), 'NORMAL AIR', 'left'];
    if (sky) {
      // the piece of ice you are falling with; the cloud (water: it stays up with the air) streaming up past
      if (S > NR.sky[0] + 0.25 && S < 15.9) A = [this._proj(cam, V.set(0, 0.03, 0)), `THIS ICE · <b>${Math.round(NR_STONE.speed(S) * 3.6)} KM/H</b>`, 'right'];
      if (S > 17.3 && S < 19.9) B = [[560, 600], 'CLOUD DROPLETS · <b>STILL HELD UP</b>'];
    }
    // the confetti: one clump (and its normal-air ghost blowing away)
    // the confetti (one clump) and the toy paratrooper fired with it (its canopy can't open), and the toy's normal-air ghost
    if (S > NR.pop + 0.3 && S < NR.pop + 1.2) { const q = this._proj(cam, St.clump(S, V)); if (q) A = [[q[0] + 70, q[1] - 20], 'CONFETTI · <b>NO DRAG</b>', 'right']; }     // (beside the clump, not over it)
    if (S > NR.pop + 1.3 && S < NR.pop + 2.8 && St.toy.visible) { const q = this._proj(cam, St.toyAt(S, V)); if (q) B = [[q[0] - 70, q[1] + 40], 'PARACHUTE · <b>CAN’T OPEN</b>', 'left']; }
    if (S > NR.pop + 0.45 && S < NR.pop + 1.9) { const q = this._proj(cam, St.toyGhostAt(S, V).add({ x: 0, y: 0.9, z: 0 })); if (q && q[1] > 430 && q[0] > 60 && q[0] < 1020) D = [q, 'NORMAL AIR', 'left']; }     // (only while the ghost is in frame)
    // the storm: the rain (water) is still blown; the sheets aren't; soot falls while steam blows
    if (S > NR.gale[0] + 0.7 && S < 25.9) B = [this._proj(cam, V.set(0.5, 0.1, -3).applyMatrix4(cam.matrixWorld)), 'RAIN IS WATER · <b>STILL BLOWN</b>'];
    if (S > 26.0 && S < 27.9 && app.roof.ghostSheet.m.visible) D = [this._proj(cam, V.copy(app.roof.sheets[0].m.position).add({ x: -0.4, y: 0.25, z: -1.0 })), 'NORMAL AIR', 'left'];
    // after the ice: the one sheet left hangs dead still in the storm, shot to lace, while the rain flies past it
    if (S > NR.out + 0.2 && S < NR.line[0] - 0.1) { const Lt = app.roof.lineT; A = [this._proj(cam, V.copy(app.roof.sheets[2].m.position).add({ x: Lt[0] * 0.9, y: 0.3, z: Lt[1] * 0.9 })), 'IN A 110 KM/H WIND · <b>BARELY MOVES</b>', 'right']; }
    if (S > NR.balloon + 0.12 && S < NR.balloon + 1.2) B = [this._proj(cam, app.balloons.centre(S, V).add({ x: 0, y: 0.6, z: 0 })), `BUOYANCY, NO DRAG · <b>${Math.round(app.balloons.speed(S) * 3.6)}</b> KM/H`];
    if (S > NR.drop.rel - 0.05 && S < NR.drop.rel + 2.2) line = 'SLOW MOTION ×0.6';
    if (S > NR.slow[0] && S < NR.slow[1]) line = 'SLOW MOTION ×0.5';
    if (S > NR.inDoor - 1.0 && S < 40.0) line = 'ICE: <b>STRAIGHT DOWN</b> · RAIN: BLOWN';
    for (const [el, T] of [[U.tagA, A], [U.tagB, B], [U.tagC, C], [U.tagD, D]]) this._tag(el, T && T[0], T && T[1], !!T, (T && T[2]) || '');
    html(U.line, line ? `<span>${line}</span>` : ''); set(U.line, 'opacity', line ? '1' : '0');
    set(U.line, 'top', S > NR.drop.up && S < NR.cut0 ? 'calc(var(--u) * 1720)' : '');   // (in the drop: low, below the ball)
  },

  grade(S, p) {
    const app = FILM._app, sky = S >= NR.sky[0] && S < NR.sky[1], storm = app && app.env ? app.env.storm(S) : 0, ice = MathX.smooth(NR_ICE.flux(S), 0.05, 0.9);
    p.flash = 0; p.fade = 0; p.chroma = 0; p.ao = 0.7; p.flashColor.setRGB(1, 1, 1);
    p.exposure = 1.12 - 0.1 * storm - 0.03 * ice; p.saturation = 1.12 - 0.14 * storm - 0.1 * ice; p.contrast = 1.07 + 0.05 * storm + 0.04 * ice; p.warmth = 0.04 - 0.07 * storm; p.blackLift = 0.01 + 0.01 * ice;
    p.vignette = 0.5 + 0.12 * storm; p.soft = 0.04; p.bloom = 0.16 + 0.12 * ice; p.bloomThreshold = 1.3 - 0.25 * ice; p.grain = 0.022;
    p.tunnel = 1.25; p.tunnelSoft = 0.5; p.tunnelDark = 0; p.edgeBlur = 0; p.smear.set(0, 0);
    if (sky) {
      const inK = MathX.smooth(app.aerial.depth(S), -12, 30), bolt = app.aerial.bolt || 0;
      p.exposure = 1.06 - 0.06 * inK; p.saturation = 1.08 - 0.25 * inK; p.contrast = 1.08 - 0.04 * inK; p.warmth = 0.03 - 0.06 * inK; p.vignette = 0.5 + 0.1 * inK; p.ao = 0.4; p.bloom = 0.18 + 0.2 * bolt; p.bloomThreshold = 1.25; p.blackLift = 0.01;
      p.flash = 0.12 * bolt * inK; p.flashColor.setRGB(0.9, 0.94, 1.0);
    }
    // a motion smear when your head turns fast
    if (app && app.cam && !sky) {
      const C = app.cam, dt = 1 / 30, vf = C.tfov.value(S), hfov = 2 * Math.atan(Math.tan(MathX.deg(vf) / 2) * 9 / 16) * 180 / Math.PI;
      const yr = (C.tyaw.value(S) - C.tyaw.value(S - dt)) / dt, pr = (C.tpitch.value(S) - C.tpitch.value(S - dt)) / dt;
      p.smear.set(MathX.clamp(yr / hfov * 0.005, -0.02, 0.02), MathX.clamp(-pr / vf * 0.005, -0.02, 0.02));
    }
    // a flicker of white when something breaks near you
    for (const t of [NR_ROOF_HITS.bottles, NR_ROOF_HITS.cake, NR_ROOF_HITS.pot, NR_ROOF_HITS.table]) p.flash += 0.05 * MathX.impulse(S, t, 0.05);
    p.flash += 0.07 * MathX.impulse(S, NR_ROOF_HITS.table + 0.37, 0.06);     // (the table top landing)
    NR_ROOF_HITS.first.forEach(([t], k) => { p.flash += (k === 0 ? 0.14 : 0.05) * MathX.impulse(S, t, 0.06); });
    p.flash += 0.08 * MathX.impulse(S, NR.roofHit, 0.06);
    // under the holed roof: less bloom, so the holes stay holes (not glowing puffs)
    const hutK = MathX.smooth(S, NR.roofHit - 0.3, NR.roofHit + 0.3) * (1 - MathX.smooth(S, NR.out - 0.3, NR.out + 0.6));
    p.bloom *= 1 - 0.65 * hutK; p.bloomThreshold += 0.35 * hutK;
    // (deep in the doorway the lintel and the ceiling are a hand's breadth from your eyes: the screen-space AO bands and
    // flickers on them, so it is faded out in there)
    if (app && app.camera) p.ao *= 1 - MathX.smooth(app.camera.position.x, 26.9, 27.6);
    // the end: a touch darker so the closing lines read
    const endK = MathX.smooth(S, NR.line[0] - 0.4, NR.line[0] + 0.6); p.exposure -= 0.12 * endK; p.vignette += 0.2 * endK;
    p.fade = S >= NR.black ? 1 : MathX.smooth(S, NR.fade[0], NR.fade[1]);
  },

  anchor() { return null; },
  debug(app, t) { const S = Edit.story(t); return `S ${S.toFixed(2)} · aero ${(nrAero(S) * 100).toFixed(0)}% · wind ${nrWindKmh(S).toFixed(0)} km/h · ice ${(NR_ICE.flux(S) * 100).toFixed(0)}% · landed ${(NR_ICE.landed(S) * 100).toFixed(0)}%`; },
};
