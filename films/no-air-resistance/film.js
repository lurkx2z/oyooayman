/* =====================================================================
   FILM — "What if air resistance suddenly disappeared?"
   Builds the avenue, the party's roof and its guests, the traffic, the
   storm (rain, confetti, the cloud's ice), the balloons, and the
   skydiver's separate scene (shown through view()); your hands with the
   sheet of paper and the ball; the HUD (aerodynamic force, wind, the ice's
   speed, a side view of the cloud's ice, live tags pinned to things) and
   the grade.
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
      speed: mk('readout story-readout nr-speed', '<div class="label">HIS SPEED</div><div class="value"><span class="v">0 KM/H</span></div><div class="sub">NORMAL TOP SPEED ≈ 200 KM/H</div>'),
      alt: mk('readout story-readout nr-alt', '<div class="label">ALTITUDE</div><div class="value"><span class="v">0 M</span></div>'),
      ice: mk('readout story-readout nr-ice', '<div class="label">ICE LANDING NOW</div><div class="value"><span class="v">0 KM/H</span></div><div class="sub">FELL 6.0 KM</div>'),
      tagA: mk('nr-tag'), tagB: mk('nr-tag'), tagC: mk('nr-tag ghost'), tagD: mk('nr-tag ghost'),
      line: mk('nr-line'),
      meanwhile: mk('nr-meanwhile', 'MEANWHILE, 3 KM UP'),
      count: mk('nr-count', '<div class="lab">THE FIRST ICE LANDS IN</div><div class="num">3</div>'),
      inset: mk('nr-inset', FILM._insetSvg()),
    };
    app.ui.countNum = app.ui.count.querySelector('.num');
    app.ui.block = app.ui.inset.querySelector('.block'); app.ui.blockT = app.ui.inset.querySelector('.bt'); app.ui.blockB = app.ui.inset.querySelector('.bb');
    app.audio = typeof NrAudio !== 'undefined' ? new NrAudio(app.tl, app) : new AudioEngine(app.tl);
  },

  // a side view of the storm cloud: its ice (6–13 km up) falling as one block since the change
  _iy(km) { return 262 - km / 14 * 196; },
  _insetSvg() {
    const y = (k) => this._iy(k).toFixed(1), base = y(1.6), top = y(13);
    return `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="nrDots" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.6" class="ice"/><circle cx="6.5" cy="6.5" r="1.6" class="ice"/></pattern>
        <clipPath id="nrClip"><rect x="0" y="0" width="400" height="262"/></clipPath></defs>
      <text x="10" y="24" class="t">THE CLOUD’S ICE, SIDE VIEW</text><text x="10" y="50" class="s">IT ALL FALLS AT ONCE</text>
      <path d="M118,${base} L118,${y(9)} Q140,${y(12.6)} 180,${top} L372,${top} Q392,${y(12.4)} 352,${y(11.6)} L352,${base} Z" class="cloud"/>
      <rect x="150" y="${y(13)}" width="170" height="${(this._iy(6) - this._iy(13)).toFixed(1)}" class="was"/>
      <text x="146" y="${y(6.2)}" class="s" text-anchor="end">ICE · 6–13 KM</text>
      <g clip-path="url(#nrClip)"><rect x="150" y="0" width="170" height="10" class="block" fill="url(#nrDots)"/></g>
      <line x1="150" y1="0" x2="320" y2="0" class="bb"/><line x1="150" y1="0" x2="320" y2="0" class="bt"/>
      <line x1="6" y1="262" x2="394" y2="262" class="ground"/>
      <rect x="226" y="246" width="7" height="16" rx="3" class="you"/><text x="242" y="284" class="s">YOU</text>
      <text x="10" y="${(+base + 6).toFixed(1)}" class="s">CLOUD BASE 1.6 KM</text>
    </svg>`;
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
    f.density = 0.0011 + 0.0007 * k + 0.012 * w;
    f.color.copy(app.env.fogColor).lerp(this._fogStorm || (this._fogStorm = new THREE.Color('#9aa3ab')), k).lerp(this._fogIce || (this._fogIce = new THREE.Color('#c7ced5')), w);
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
      // the ghost: the same sheet in normal air sails off with the wind
      const gh = NR_DROP.ghost(u), ga = 0.5 * MathX.smooth(u, 0.0, 0.12), D = NR_WIND_DIR;
      P.ghost.position.set(r.p.x + D.x * gh[1] - 0.12 * Math.min(u * 3, 1), Math.max(floor + 0.002, r.p.y - gh[0]), r.p.z + D.z * gh[1]); P.ghost.quaternion.copy(r.q); P.ghost.rotateX(gh[2]); P.ghost.rotateZ(0.4 * gh[2]);
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
    if (!on || !xy || xy[0] < 10 || xy[0] > 1070 || xy[1] < 120 || xy[1] > 1700) { if (el._o !== '0') { el.style.opacity = '0'; el._o = '0'; } return; }
    if (el._h !== html) { el.innerHTML = html; el._h = html; }
    el.style.opacity = '1'; el._o = '1';
    const w = el.offsetWidth / (parseFloat(document.documentElement.style.getPropertyValue('--u')) || 0.5) || 420;   // its width (design px)
    const [x0, x1] = side === 'right' ? [86, 886 - w * 1.04] : side === 'left' ? [86 + w * 1.04, 886] : [86 + w / 2, 886 - w / 2];
    el.style.left = `calc(var(--u) * ${MathX.clamp(xy[0], x0, Math.max(x0, x1)).toFixed(1)})`; el.style.top = `calc(var(--u) * ${MathX.clamp(xy[1], 250, 1440).toFixed(1)})`;
  },

  _overlays(app, S) {
    const U = app.ui, W = StoryHUD.win, set = (el, k, v) => { if (el['_' + k] !== v) { el.style[k] = v; el['_' + k] = v; } }, html = (el, v) => { if (el._hh !== v) { el.innerHTML = v; el._hh = v; } };
    const sky = S >= NR.sky[0] && S < NR.sky[1], cam = sky ? app.aerial.cam : app.camera;
    // AERODYNAMIC FORCE 100 % → 0 % (big in the opening, small in the corner later)
    const a = Math.round(nrAero(S) * 100);
    set(U.aero, 'opacity', (sky ? 0 : S < NR.cut0 ? W(S, NR.title[1] - 1.9, NR.cut0, 0.3, 0.05) : W(S, 20.6, NR_ICE.first - 0.1, 0.4, 0.15) * 0.85).toFixed(3));   // (the ice readout takes its place)
    html(U.aero.querySelector('.v'), `${a}%`);
    set(U.aero.querySelector('.sub'), 'opacity', MathX.smooth(S, NR.loss + 0.3, NR.loss + 0.7).toFixed(2));
    U.aero.classList.toggle('small', S > NR.cut0);
    U.aero.classList.toggle('zero', S > NR.loss + 0.2);
    // WIND: once it has been shown to still blow, and when the storm brings more of it
    set(U.wind, 'opacity', (W(S, NR.title[1], NR.drop.up, 0.4, 0.3) + W(S, NR.gale[0] - 0.2, 27.4, 0.3, 0.3)).toFixed(3));
    html(U.wind.querySelector('.v'), `${Math.round(nrWindKmh(S) / 5) * 5} KM/H`);
    // the sky: his speed and height
    set(U.speed, 'opacity', (sky ? MathX.smooth(S, 12.6, 13.0) : 0).toFixed(3)); set(U.alt, 'opacity', (sky ? MathX.smooth(S, 12.7, 13.1) : 0).toFixed(3));
    html(U.speed.querySelector('.v'), `${Math.round(NR_JUMP.speed(S) * 3.6)} KM/H`);
    html(U.alt.querySelector('.v'), `${(Math.round(NR_JUMP.alt(S) / 10) * 10).toLocaleString('en-US')} M`);
    set(U.meanwhile, 'opacity', W(S, NR.sky[0], 14.4, 0.05, 0.4).toFixed(3));
    // the ice: how fast what is landing now is going, and how far it fell
    const ip = MathX.clamp(S, NR_ICE.first, NR_ICE.last);
    set(U.ice, 'opacity', W(S, NR_ICE.first - 0.05, NR.quiet + 1.0, 0.15, 0.6).toFixed(3));
    html(U.ice.querySelector('.v'), `${Math.round(NR_ICE.kmh(ip)).toLocaleString('en-US')} KM/H`);
    html(U.ice.querySelector('.sub'), `FELL ${(NR_ICE.h(ip) / 1000).toFixed(1)} KM · NOTHING SLOWED IT`);
    // the side view of the cloud's ice, and the count to the first of it
    const ins = W(S, NR.cloud + 0.5, NR_ICE.first + 0.5, 0.3, 0.3);
    set(U.inset, 'opacity', ins.toFixed(3));
    if (ins > 0) {
      const hk = NR_ICE.h(S) / 1000, yb = this._iy(NR_ICE.base / 1000 - hk), yt = this._iy(NR_ICE.top / 1000 - hk);
      U.block.setAttribute('y', yt.toFixed(1)); U.block.setAttribute('height', Math.max(0, yb - yt).toFixed(1));
      for (const [el, yy] of [[U.blockT, yt], [U.blockB, Math.min(262, yb)]]) { el.setAttribute('y1', yy.toFixed(1)); el.setAttribute('y2', yy.toFixed(1)); }
    }
    const cnt = S > NR_ICE.first - 3 && S < NR_ICE.first - 0.02;
    set(U.count, 'opacity', cnt ? '1' : '0');
    if (cnt) html(U.countNum, `${Math.ceil(NR_ICE.first - S)}`);
    // tags pinned to things
    const V = this._tv || (this._tv = new THREE.Vector3()), P = app.props, St = app.storm;
    let A = null, B = null, C = null, D = null, line = '';
    if (S > NR.walk[0] + 0.05 && S < 5.4 && app.roof.kiteG.visible) A = [this._proj(cam, V.copy(app.roof.kiteG.position).add({ x: 0, y: 0.5, z: 0 })), 'KITE · <b>NO LIFT</b>', 'right'];
    if (S > NR.drop.rel + 0.5 && S < NR.cut0 && P.rel) { const tl = Math.sqrt(2 * (P.rel.p.y - LAYOUT.curbH - 0.004) / NR_G); A = [this._proj(cam, V.copy(P.rel.b).setY(0.8)), `BOTH LAND IN <b>${tl.toFixed(2)} S</b>`, 'right']; }
    if (S > NR.drop.rel + 0.1 && S < NR.cut0 && P.ghost.visible) C = [this._proj(cam, V.copy(P.ghost.position).add({ x: 0, y: 0.3, z: 0 })), 'NORMAL AIR', 'left'];
    if (sky) {
      const Ae = app.aerial;
      if (S > NR.deploy + 1.0 && S < 20.3) B = [this._proj(cam, V.copy(Ae.wad.m.position).add({ x: 0.3, y: 0.7, z: 0 })), '<b>NO DRAG</b>', 'right'];
      if (S > NR.deploy + 0.5 && S < NR.deploy + 1.9 && Ae.ghost.g.visible) C = [this._proj(cam, V.copy(Ae.ghost.g.position).add({ x: 0, y: 1.0, z: 0 })), 'NORMAL AIR'];
    }
    // the confetti: one clump (and its normal-air ghost blowing away)
    if (S > NR.pop + 0.35 && S < NR.pop + 2.6) A = [this._proj(cam, St.clump(S, V).add({ x: 0, y: 0.5, z: 0 })), '<b>NO DRAG</b> · ONE CLUMP', 'right'];
    if (S > NR.pop + 0.3 && S < NR.pop + 1.5) C = [this._proj(cam, St.ghostAt(S, V).add({ x: 0, y: 0.4, z: 0 })), 'NORMAL AIR', 'left'];
    // the storm: the rain (water) is still blown; the sheets aren't; soot falls while steam blows
    if (S > NR.gale[0] + 0.7 && S < 27.4) B = [this._proj(cam, V.set(cam.position.x - 3.2, cam.position.y + 0.3, cam.position.z - 1.4)), 'RAIN IS WATER · <b>STILL BLOWN</b>'];
    if (S > NR.gale[0] + 1.3 && S < 27.9 && app.roof.ghostSheet.m.visible) D = [this._proj(cam, V.copy(app.roof.sheets[0].m.position).add({ x: -0.4, y: 0.25, z: -1.0 })), 'NORMAL AIR', 'left'];
    if (S > 27.5 && S < 29.9) A = [this._proj(cam, V.copy(app.roof.flue).add({ x: 0, y: 0.6, z: 0 })), 'SOOT FALLS · <b>STEAM BLOWS</b>', 'right'];
    if (S > NR.balloon + 0.3 && S < NR.cloud - 0.2) B = [this._proj(cam, app.balloons.centre(S, V).add({ x: 0, y: 0.6, z: 0 })), `BUOYANCY, NO DRAG · <b>${Math.round(app.balloons.speed(S) * 3.6)}</b> KM/H`];
    if (S > NR.drop.rel - 0.05 && S < NR.drop.rel + 0.55) line = 'SLOW MOTION ×0.6';
    if (S > NR.inDoor - 1.0 && S < 40.45) line = 'ICE: <b>STRAIGHT DOWN</b> · RAIN: BLOWN';
    for (const [el, T] of [[U.tagA, A], [U.tagB, B], [U.tagC, C], [U.tagD, D]]) this._tag(el, T && T[0], T && T[1], !!T, (T && T[2]) || '');
    html(U.line, line ? `<span>${line}</span>` : ''); set(U.line, 'opacity', line ? '1' : '0');
    set(U.line, 'top', S > NR.drop.up && S < NR.cut0 ? 'calc(var(--u) * 1720)' : '');   // (in the drop: low, below the ball)
  },

  grade(S, p) {
    const app = FILM._app, sky = S >= NR.sky[0] && S < NR.sky[1], storm = app && app.env ? app.env.storm(S) : 0, ice = MathX.smooth(NR_ICE.flux(S), 0.05, 0.9);
    p.flash = 0; p.fade = 0; p.chroma = 0; p.ao = 0.7; p.flashColor.setRGB(1, 1, 1);
    p.exposure = 1.12 - 0.1 * storm + 0.04 * ice; p.saturation = 1.12 - 0.14 * storm - 0.1 * ice; p.contrast = 1.07 + 0.05 * storm; p.warmth = 0.04 - 0.07 * storm; p.blackLift = 0.01 + 0.01 * ice;
    p.vignette = 0.5 + 0.12 * storm; p.soft = 0.04; p.bloom = 0.16 + 0.12 * ice; p.bloomThreshold = 1.3 - 0.25 * ice; p.grain = 0.022;
    p.tunnel = 1.25; p.tunnelSoft = 0.5; p.tunnelDark = 0; p.edgeBlur = 0; p.smear.set(0, 0);
    if (sky) { p.exposure = 1.08; p.saturation = 1.0; p.contrast = 1.04; p.warmth = 0.02; p.vignette = 0.55; p.ao = 0.4; p.bloom = 0.16; p.bloomThreshold = 1.3; p.blackLift = 0.01; }
    // a motion smear when your head turns fast
    if (app && app.cam && !sky) {
      const C = app.cam, dt = 1 / 30, vf = C.tfov.value(S), hfov = 2 * Math.atan(Math.tan(MathX.deg(vf) / 2) * 9 / 16) * 180 / Math.PI;
      const yr = (C.tyaw.value(S) - C.tyaw.value(S - dt)) / dt, pr = (C.tpitch.value(S) - C.tpitch.value(S - dt)) / dt;
      p.smear.set(MathX.clamp(yr / hfov * 0.005, -0.02, 0.02), MathX.clamp(-pr / vf * 0.005, -0.02, 0.02));
    }
    // a flicker of white when something breaks near you
    for (const t of [NR_ROOF_HITS.bottles, NR_ROOF_HITS.cake, NR_ROOF_HITS.pot]) p.flash += 0.05 * MathX.impulse(S, t, 0.05);
    // the end: a touch darker so the closing lines read
    const endK = MathX.smooth(S, NR.line[0] - 0.4, NR.line[0] + 0.6); p.exposure -= 0.12 * endK; p.vignette += 0.2 * endK;
    if (S >= NR.black) p.fade = 1;
  },

  anchor() { return null; },
  debug(app, t) { const S = Edit.story(t); return `S ${S.toFixed(2)} · aero ${(nrAero(S) * 100).toFixed(0)}% · wind ${nrWindKmh(S).toFixed(0)} km/h · ice ${(NR_ICE.flux(S) * 100).toFixed(0)}% · landed ${(NR_ICE.landed(S) * 100).toFixed(0)}%`; },
};
