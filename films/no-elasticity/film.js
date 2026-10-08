/* =====================================================================
   FILM — "What if everything lost its elasticity?"
   Builds the street, the props, the traffic and the people; each frame it
   poses everything for STORY time t and, for the cinematic inserts (the
   racket, the shoe, the cushion, the wheel, the crash, the wreck), puts
   the camera on its own shot. Also the world-pinned labels, the montage
   label, the footbridge's original-deck line and the grade.
   ===================================================================== */

// your hands: only for the rubber band (index fingers up inside the band, palms facing, the other fingers curled)
const NE_HAND_POSES = Object.assign({}, HAND_POSES, {
  bandIn:  { p: [0.04, -0.24, -0.5], F: [0, 1, -0.22], N: [-1, 0, 0], curl: [0.04, 1.35, 1.42, 1.48], thumb: [0.05, 0.9] },
  bandOut: { p: [0.13, -0.24, -0.5], F: [0, 1, -0.22], N: [-1, 0, 0], curl: [0.04, 1.35, 1.42, 1.48], thumb: [0.05, 0.9], trem: 0.0025 },
});
const NE_HAND_BLEND = Object.assign({}, HAND_BLEND, { bandIn: 0.5, bandOut: 0.5 });
for (const k of Object.keys(NE_HAND_POSES)) { if (k.endsWith('!')) continue; NE_HAND_POSES[k + '!'] = NE_HAND_POSES[k]; NE_HAND_BLEND[k + '!'] = 0.02; }

// the cinematic shots: camera position / look-at / fov as functions of story time (null fields keep your own view)
const NE_BALL_A0 = 76;   // where the ball inserts look from (degrees round the ball): mostly clear of his legs
const NE_SHOTS = [
  // low on the paving beside the dead ball: a dashed ring shows its round shape; the flat spot keeps it lower, and when
  // his hand presses on it nothing changes back
  { id: 'ball', t0: NE.ballShot[0], t1: NE.ballShot[1],
    cam: (t, app) => { const [bx, bz] = app.ball.spot(app.cast), u = Ease.inOutSine((t - NE.ballShot[0]) / (NE.ballShot[1] - NE.ballShot[0])), d = 1.0 - 0.14 * u, a = MathX.deg(NE_BALL_A0 - 14 * u);
      return { p: [bx + Math.cos(a) * d, NE_BALL.ground + 0.06, bz + Math.sin(a) * d], at: [bx, NE_BALL.ground + 0.1, bz], fov: 40, focus: [bx, bz, 4] }; } },
  { id: 'racket', t0: NE.mont[0][0], t1: NE.mont[0][1], label: 'TENNIS RACKETS', line: 'The strings stretch… and stay stretched.',
    cam: (t) => { const R = NE_RACKET.p, u = t - NE.mont[0][0]; return { p: [R[0] - 0.62 + 0.03 * u, R[1] + 0.07, R[2] + 0.58 - 0.03 * u], at: [R[0], R[1] - 0.01, R[2]], fov: 36, focus: [R[0], R[2], 6] }; } },
  { id: 'shoe', t0: NE.mont[1][0], t1: NE.mont[1][1], label: 'RUNNING SHOES', line: 'The foam gets crushed… and mostly stays crushed.',
    cam: (t) => { const S = NE_SHOE.p, u = t - NE.mont[1][0]; return { p: [S[0] + 0.14, S[1] + 0.09, S[2] + 1.0 - 0.04 * u], at: [S[0] + 0.14, S[1] + 0.06, S[2]], fov: 36, focus: [S[0], S[2], 5] }; } },
  { id: 'cushion', t0: NE.mont[2][0], t1: NE.mont[2][1], label: 'CUSHIONS', line: 'Sit down once. The dent stays.',
    cam: (t) => { const B = NE_CITY.bench, u = t - NE.mont[2][0]; return { p: [B.x - 1.6 + 0.05 * u, 1.5, B.z - 1.55 + 0.04 * u], at: [B.x - 0.06, 0.58, B.z - 0.52], fov: 34, focus: [B.x, B.z, 6] }; } },
  { id: 'band', t0: NE.mont[3][0], t1: NE.mont[3][1], label: 'RUBBER BANDS', line: 'Stretch it once. It stays stretched.', cam: null },
  // low beside the red hatch, rolling along with its front wheel over the speed table (front axle, then rear, up and
  // down): the dashed line on its side is where the lower edge of its paint rode before the rule
  { id: 'wheel', t0: NE.wheelShot[0], t1: NE.wheelShot[1],
    cam: (t, app) => { const w = app.heroWheel(t), u = (t - NE.wheelShot[0]) / (NE.wheelShot[1] - NE.wheelShot[0]);
      return { p: [w.x + 4.2 - 0.2 * u, 0.5, w.z + 0.5], at: [w.x, 0.62, w.z - 0.2], fov: 44, focus: [w.x, w.z, 7] }; } },
  // side-on and low beside the box truck's rear axle as it crosses the table: the gap between the tyres and the box closes
  { id: 'truck', t0: NE.truckShot[0], t1: NE.truckShot[1],
    cam: (t, app) => { const zr = app.truckRear(t), u = (t - NE.truckShot[0]) / (NE.truckShot[1] - NE.truckShot[0]);
      return { p: [8.6, 0.78, zr + 2.4 - 0.5 * u], at: [1.75, 0.95, zr - 0.7], fov: 46, focus: [1.75, zr, 9] }; } },
  // the footbridge, face-on from high over the avenue (over the street trees): the whole span and both stair towers in
  // frame, so the dip has its ends to compare against; a running club crosses, the deck keeps the dip (drawn ×NE_SAG_DRAW)
  { id: 'bridge', t0: NE.bridge[0], t1: NE.bridge[1],
    cam: (t) => { const u = Ease.inOutSine((t - NE.bridge[0]) / (NE.bridge[1] - NE.bridge[0])), B = NE_CITY.bridge;
      return { p: [1.5 - 0.5 * u, 12.5 - 1.0 * u, B.z + 38 - 4.0 * u], at: [0, B.deck - 4.2, B.z], fov: 54, focus: [0, B.z, 22] }; } },
  // the crash from high behind the SUV (5.5 m up, looking down on the T-bone): the SUV runs the red into the crossing
  // sedan's flank, they lock and slide off as one; the camera pans with them. 1/3 speed
  { id: 'crash', t0: NE.crashShot[0], t1: NE.crashShot[1],
    cam: (t) => { const u = (t - NE.crashShot[0]) / (NE.crashShot[1] - NE.crashShot[0]), k = MathX.smooth(t, NE.crash, NE_CRASH.tv + 0.4);
      return { p: [-8.5 + 0.3 * u, 5.5, -55.0 + 0.4 * u], at: [-1.1 + 1.4 * k, 0.4, -45.8 + 1.8 * k], fov: 40, focus: [-1.0, -46, 14] }; } },
  // the locked wreck: a slow, high arc round it, starting from the side the van comes in (all three stay jammed together)
  { id: 'wreck', t0: NE.wreckShot[0], t1: NE.wreckShot[1],
    cam: (t) => { const c = [0.05, -44.4], u = Ease.inOutSine((t - NE.wreckShot[0]) / (NE.wreckShot[1] - NE.wreckShot[0])), a = MathX.deg(-70 + 90 * u), r = 13.5 - 0.5 * u;
      return { p: [c[0] + Math.sin(a) * r, 7.0 + 0.4 * u, c[1] + Math.cos(a) * r], at: [c[0] - 0.4, 0.4, c[1] - 1.0], fov: 40, focus: [c[0], c[1], 12] }; } },
  // the tap, side-on at the van's tail: the late hatch comes up the lane, brakes, meets the van at walking pace, backs off;
  // the camera pushes in on the bumper that stays pushed in (a dashed line where its front was)
  { id: 'tap', t0: NE.tapShot[0], t1: NE.tapShot[1],
    cam: (t, app) => { const T = NE_TAP, f = T.zc + CAR_PROFILES.hatch.L / 2, ps = app.traffic.q1.spec.pose(t), qf = ps ? ps.z + CAR_PROFILES.hatch.L / 2 : f - 9;
      const k = MathX.smooth(t, NE.tapBack[0], NE.tapBack[1] + 0.4), az = MathX.clamp(qf, f - 6.5, f - 0.1) * (1 - k) + (f - 0.55) * k;
      return { p: [5.2 - 3.7 * k, 1.5 - 0.75 * k, f - 1.2 + 0.8 * k], at: [T.x + 0.2, 0.62 - 0.12 * k, az], fov: 46 - 15 * k, focus: [T.x, f, 8] }; } },
  // the end: the opening insert again (the loop), low beside the flat ball, its old top drawn over it; a slow push
  { id: 'end', t0: NE.endShot, t1: NE.end + 1,
    cam: (t, app) => { const [bx, bz] = app.ball.spot(app.cast), u = Ease.outSine(MathX.clamp((t - NE.endShot) / (NE.end - NE.endShot), 0, 1)), d = 1.0 - 0.14 * u, a = MathX.deg(NE_BALL_A0 - 14);
      return { p: [bx + Math.cos(a) * d, NE_BALL.ground + 0.06, bz + Math.sin(a) * d], at: [bx, NE_BALL.ground + 0.1, bz], fov: 40, focus: [bx, bz, 4] }; } },
];

// labels pinned to things in the world: [t0, t1, point(t, app) → [x, y, z], text]
const NE_TAGS = [
  { t0: 3.55, t1: 5.45, at: (t, app) => { const [bx, bz] = app.ball.spot(app.cast); return [bx, NE_BALL.ground + 2 * NE_BALL.r + 0.004, bz]; }, text: 'WHERE ITS TOP USED TO BE', cls: 'ne-tag line' },
  { t0: 16.15, t1: 17.35, at: () => [NE_TRAMP.x - 1.2, 1.35, NE_TRAMP.z + 1.2], text: 'SPRINGS STRETCHED · MAT STAYS DOWN' },
  { t0: 23.9, t1: 25.4, at: (t, app) => { const w = app.heroWheel(t); return [w.x + 0.15, 0.62, w.z - 0.75]; }, text: 'WHERE THE BODY USED TO SIT', cls: 'ne-tag line' },
  { t0: 25.8, t1: 26.85, at: (t, app) => { const w = app.heroWheel(t); return [w.x, 0.98, w.z]; }, text: 'SPRING STAYS SQUASHED', cls: 'ne-tag line' },
  { t0: 36.7, t1: 37.9, at: (t, app) => [2.95, 1.25, app.truckRear(t) - 0.6], text: 'WHERE THE BOX USED TO SIT', cls: 'ne-tag line' },
  { t0: 38.95, t1: 39.6, at: (t, app) => [2.9, 0.98, app.truckRear(t)], text: 'REAR SPRINGS · ON THE STOPS' },
  { t0: NE.bridge[0] + 0.3, t1: 45.6, at: () => [-6.5, NE_CITY.bridge.deck - 0.05, NE_CITY.bridge.z + NE_CITY.bridge.w / 2 + 0.35], text: 'WHERE THE DECK WAS', cls: 'ne-tag line' },
  { t0: NE.bridge[0] + 0.3, t1: NE.bridge[1] - 0.2, at: (t) => [0, NE_CITY.bridge.deck - 0.6 - neSag(t), NE_CITY.bridge.z + NE_CITY.bridge.w / 2], text: `SAG DRAWN ${NE_SAG_DRAW}× LARGER` },
  { t0: 61.3, t1: 63.3, at: (t, app) => { const ps = app.traffic.q1.spec.pose(t); return [ps.x, 0.8, ps.z + CAR_PROFILES.hatch.L / 2 - NE_TAP.dent]; }, text: 'BUMPER PUSHED IN · STAYS IN' },
];

const FILM = {
  build(app) {
    const { scene, camera, renderer } = app;
    FILM._app = app;
    camera.near = 0.03; camera.far = 2800; camera.updateProjectionMatrix();
    app.env = new NeCity(scene, renderer, app.rng);
    app.env.camera = camera;                       // (haze cards need it before build)
    app.env.build();
    app.traffic = new NeTraffic(scene);
    app.tramp = new NeTramp(scene);
    app.ball = new NeBall(scene);
    app.racket = new NeRacket(scene);
    app.shoe = new NeShoe(scene);
    app.cushions = new NeCushions(scene);
    app.cast = new NeCast(app);
    app.deckLine = this._deckLine(scene);
    app.sillLine = this._sillLine(app.traffic.H);
    app.boxLine = this._boxLine(app.traffic.truck);
    app.noseLine = this._noseLine(app.traffic.q1);
    // the shared material treatment, lighter on the grime (a clean, sunny street); people and the bending materials skip it
    Look.surface(app.env.m.sidewalk, false); Look.grime(app.env.m.sidewalk, 0.2);
    { const skip = new Set(); camera.traverse((o) => skip.add(o));
      scene.traverse((o) => {
        if (!o.isMesh || skip.has(o)) return;
        let q = o, person = false, veh = false; while (q) { if (q.name && q.name.startsWith('person:')) person = true; if (q.name && q.name.startsWith('veh:')) veh = true; q = q.parent; }
        if (person) return;
        for (const m of [].concat(o.material)) if (m && m.isMeshStandardMaterial && m.userData.grime === undefined && m.onBeforeCompile === THREE.Material.prototype.onBeforeCompile) { Look.surface(m, veh); if (!/glass|tire/i.test(m.name || '')) Look.grime(m, veh ? 0.3 : 0.5); }
      }); }
    // your hands (a grey hoodie sleeve) and the rubber band between them
    app.hands = new ViewerHands(camera, { scale: 1.04, skin: '#c99a7c', nail: '#d9b4a2', sleeve: '#5a6068', cuff: '#474c53', watch: false, sleeveLen: 1.1, sleeveFit: 0.78,
      poses: NE_HAND_POSES, blends: NE_HAND_BLEND });
    app.band = new NeBand(scene, app.hands);
    // the hero car's front-right wheel (the wheel shot follows it)
    const H = app.traffic.H, fw = H.wheels.find((w) => w.axle === 1 && w.side === 1);
    const wv = new THREE.Vector3();
    app.heroWheel = (t) => { const ps = H.spec.pose(t), c = Math.cos(ps.yaw + Math.PI / 2), s = Math.sin(ps.yaw + Math.PI / 2), lx = fw.m.position.x, lz = fw.m.position.z;
      return wv.set(ps.x + c * lx + s * lz, 0, ps.z - s * lx + c * lz); };
    // the truck's rear axle (z): the truck insert follows it
    { const TR = app.traffic.truck; app.truckRear = (t) => TR._axleZ(TR.spec.pose(t), 0); }
    // where the wreck ends up (the wreck shot circles it)
    { const C = NE_CRASH, w = C.slide(C.c2, C.V2, C.w2, C.tv, 30); app.wreckC = [w.x, w.z]; }
    // HUD + overlays
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    const hud = document.getElementById('hud');
    const mk = (cls) => { const d = document.createElement('div'); d.className = cls; d.style.opacity = '0'; hud.appendChild(d); return d; };
    app.chyron = mk('ne-chyron');
    app.tags = [mk('ne-tag'), mk('ne-tag')];
    app.audio = new NeAudio(app.tl, app);
    this._v = new THREE.Vector3(); this._f = new THREE.Vector3();
  },

  // a dashed yellow line where the footbridge deck used to be (on the near face of the deck)
  _deckLine(scene) {
    const B = NE_CITY.bridge, g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: '#ffd23e', fog: false, depthTest: true });
    for (let x = -B.half - 1.3; x < B.half + 1.1; x += 1.0) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.09, 0.04), mat); m.position.set(x + 0.275, B.deck - 0.04, B.z + B.w / 2 + 0.35); g.add(m); }
    g.visible = false; scene.add(g); return g;
  },

  // a dashed yellow line along the red hatch's right side where the lower edge of its paint rode before the rule (wheel shot
  // only); it runs on past both bumpers and across the wheels so the drop reads against it
  _sillLine(H) {
    const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: '#ffd23e', fog: false });
    for (let x = -H.L / 2 - 0.55; x < H.L / 2 + 0.5; x += 0.3) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.012), mat); m.position.set(x + 0.08, 0, H.W / 2 + 0.06); g.add(m);
    }
    g.visible = false; H.g.add(g); return g;
  },

  // the same along the truck's right side, at the healthy height of the box floor over the rear axle (truck shot only)
  _boxLine(TR) {
    const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: '#ffd23e', fog: false });
    for (let x = -TR.L / 2 - 0.6; x < 0.6; x += 0.3) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.012), mat); m.position.set(x + 0.08, 0, TR.W / 2 + 0.07); g.add(m); }
    g.visible = false; TR.g.add(g); return g;
  },

  // a vertical dashed line at the late hatch's original front (its near corner), for the tap
  _noseLine(Q) {
    const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: '#ffd23e', fog: false });
    for (let y = 0.2; y < 0.95; y += 0.06) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.032, 0.012), mat); m.position.set(Q.L / 2 + 0.01, y, -Q.W / 2 - 0.02); g.add(m); }
    g.visible = false; Q.g.add(g); return g;
  },

  shotAt(t) { return NE_SHOTS.find((s) => t >= s.t0 && t < s.t1) || null; },

  update(app, t) {
    const cam = app.camera, shot = this.shotAt(t), sh = shot && shot.cam ? shot.cam(t, app) : null;
    if (sh) {
      cam.position.set(...sh.p);
      const [ax, ay, az] = sh.at, dx = ax - sh.p[0], dy = ay - sh.p[1], dz = az - sh.p[2];
      cam.rotation.set(Math.atan2(dy, Math.hypot(dx, dz)), Math.atan2(-dx, -dz), sh.roll || 0, 'YXZ');
      if (Math.abs(cam.fov - sh.fov) > 1e-3) { cam.fov = sh.fov; cam.updateProjectionMatrix(); }
      // the crash: the camera takes the hit too (a short, decaying shake)
      if (shot.id === 'crash') { const k = MathX.impulse(t, NE.crash, 0.18); cam.rotation.x += 0.012 * k * Math.sin(t * 190); cam.rotation.y += 0.009 * k * Math.sin(t * 157); }
    }
    cam.updateMatrixWorld(true);
    // the sun's shadow box follows what you are looking at
    if (sh && sh.focus) app.env.focus(...sh.focus);
    else {
      const f = cam.getWorldDirection(this._f); f.y = 0; f.normalize();
      const d = cam.fov < 30 ? 50 : 20, r = cam.fov < 30 ? 46 : 30;
      app.env.focus(cam.position.x + f.x * d, cam.position.z + f.z * d, r);
    }
    app.env.update(t);
    app.traffic.update(t, cam, app.scene.fog);
    app.cast.update(t);
    app.ball.update(t, app.cast);
    app.tramp.update(t);
    app.racket.update(t);
    app.shoe.update(t);
    app.cushions.update(t);
    app.hands.update(t);
    if (sh) { app.hands.right.g.visible = false; app.hands.left.g.visible = false; }
    app.band.update(t, cam);
    app.deckLine.visible = t > NE.bridge[0] - 0.5 && t < NE.bridge[1];
    app.noseLine.visible = !!(shot && shot.id === 'tap') && t > NE.tap + 0.15;
    // the ball's old outline, turned to the low camera
    { const on = !!(shot && (shot.id === 'ball' || shot.id === 'end')), R = app.ball.ring; R.visible = on;
      if (on) { const [bx, bz] = app.ball.spot(app.cast); R.position.set(bx, NE_BALL.ground + NE_BALL.r, bz); R.lookAt(app.camera.position.x, NE_BALL.ground + NE_BALL.r, app.camera.position.z); } }
    // the line sits at the healthy height of the red paint's lower edge (0.46 m above the road under the car)
    { const H = app.traffic.H, ps = H.spec.pose(t), on = shot && shot.id === 'wheel';
      app.sillLine.visible = !!on;
      if (on) { const r0 = neRoadY(H._axleZ(ps, 0)), r1 = neRoadY(H._axleZ(ps, 1));
        app.sillLine.rotation.z = Math.atan2(r1 - r0, H.axles[1] - H.axles[0]); app.sillLine.position.y = (r0 + r1) / 2 + 0.46; } }
    { const TR = app.traffic.truck, ps = TR.spec.pose(t), on = shot && shot.id === 'truck';
      app.boxLine.visible = !!on;
      if (on) { const r0 = neRoadY(TR._axleZ(ps, 0)), r1 = neRoadY(TR._axleZ(ps, 1)), wb = TR.axles[1] - TR.axles[0];
        app.boxLine.rotation.z = Math.atan2(r1 - r0, wb); app.boxLine.position.y = (r0 + r1) / 2 + 1.22; } }
    this._overlays(app, t, shot);
  },

  _overlays(app, t, shot) {
    // the montage label (what you're looking at, and what happened to it)
    const ch = app.chyron, k = shot && shot.label ? StoryHUD.win(t, shot.t0, shot.t1, 0.12, 0.15) : 0;
    if (shot && shot.label && ch._id !== shot.id) { ch.innerHTML = `<span class="mt">${shot.label}</span><span class="mr">${shot.line}</span>`; ch._id = shot.id; }
    ch.style.opacity = k.toFixed(3);
    // labels pinned to the world (at most two at once)
    const live = NE_TAGS.filter((g) => t >= g.t0 && t < g.t1), v = this._v;
    app.tags.forEach((el, i) => {
      const T = live[i];
      if (!T) { el.style.opacity = '0'; return; }
      v.set(...T.at(t, app)).project(app.camera);
      const vis = v.z < 1 && Math.abs(v.x) < 0.9 && v.y < 0.93 && v.y > -0.9;
      if (el._t !== T.text) { el.textContent = T.text; el._t = T.text; el.className = T.cls || 'ne-tag'; }
      // keep the whole label on screen and clear of the readout (the tick still points at the thing)
      const W = el.parentNode.clientWidth, Hh = el.parentNode.clientHeight, u = W / 1080, hw = el.offsetWidth / 2;
      const x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * Hh, cx = MathX.clamp(x, hw + 44 * u, 0.86 * W - hw), cy = Math.max(y, 430 * u + el.offsetHeight + 26 * u);
      el.style.left = `${cx.toFixed(1)}px`; el.style.top = `${cy.toFixed(1)}px`; el.style.setProperty('--tick', `${(x - cx).toFixed(1)}px`);
      el.style.opacity = vis ? StoryHUD.win(t, T.t0, T.t1, 0.15, 0.15).toFixed(3) : '0';
    });
  },

  grade(t, p) {
    const tired = MathX.smooth(t, NE.rule[1], 60);
    p.flash = 0; p.fade = 0; p.ao = 0.55;
    p.exposure = 1.12; p.saturation = 1.24; p.contrast = 1.1; p.warmth = 0.08; p.blackLift = 0.0;
    p.vignette = 0.45; p.soft = 0.015; p.bloom = 0.24; p.bloomThreshold = 1.4; p.grain = 0.02;
    p.tunnel = 1.25; p.tunnelSoft = 0.5; p.tunnelDark = 0; p.edgeBlur = 0; p.chroma = 0;
    p.flashColor.setRGB(1, 1, 1);
    // the day goes a little flatter and cooler as everything gives up (colour as storytelling)
    p.saturation -= 0.12 * tired; p.warmth -= 0.06 * tired; p.contrast -= 0.03 * tired;
    // the rule bites: a small jolt of chroma under the title
    p.chroma += 0.004 * MathX.impulse(t, NE.rule[0] + 0.15, 0.3);
    // the crash: a hit of chroma (no white flash: it hid the contact); the slow motion is a touch harder
    p.chroma += 0.007 * MathX.impulse(t, NE.crash, 0.12) + 0.005 * MathX.impulse(t, NE_CRASH.tv, 0.2);
    if (t > NE.crashSlow[0] && t < NE.crashSlow[1]) { p.contrast += 0.06; p.saturation -= 0.08; p.vignette += 0.15; }
    // the footbridge sits in the avenue's deep shade: lift it so it doesn't drop out of the film's look
    if (t >= NE.bridge[0] && t < NE.bridge[1]) p.exposure += 0.14;
    p.fade = MathX.smooth(t, NE.end - 0.45, NE.end);
    // whip pans drag a little (camera-lag trail)
    const app = FILM._app;
    if (app && app.cam && !this.shotAt(t) && !this.shotAt(t - 1 / 30)) {
      const C = app.cam, dt = 1 / 30, vf = C.tfov.value(t);
      const hfov = 2 * Math.atan(Math.tan(MathX.deg(vf) / 2) * 9 / 16) * 180 / Math.PI;
      const yr = (C.tyaw.value(t) - C.tyaw.value(t - dt)) / dt, pr = (C.tpitch.value(t) - C.tpitch.value(t - dt)) / dt;
      const cut = Math.abs(yr) > 1500 || Math.abs(pr) > 1500 ? 0 : 1;
      p.smear.set(cut * MathX.clamp(yr / hfov * 0.008, -0.025, 0.025), cut * MathX.clamp(-pr / vf * 0.008, -0.025, 0.025));
    } else p.smear.set(0, 0);
  },

  debug(app, t) {
    const H = app.traffic.H;
    return `rule ${neRule(t).toFixed(2)} · ride −${app.traffic.heroRide(t)} cm · sag ${neSagText(t)} · crash ti ${NE_CRASH.ti.toFixed(2)} tv ${NE_CRASH.tv.toFixed(2)} · H z ${H.spec.pose(t).z.toFixed(1)}`;
  },
};
