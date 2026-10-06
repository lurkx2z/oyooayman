/* =====================================================================
   FILM — "What if friction disappeared for 60 seconds?"
   The film-specific half of the engine (see js/main.js): runs the slide
   simulation once, builds the city, the traffic, the cast, the props,
   your hands and legs, the montage sets and the sound; then each frame it
   puts the camera where the simulation says you are (or on a montage /
   "drone" shot), and poses everything for the simulation time — which runs
   3× slower for the moment friction comes back (frSimT in script.js).
   ===================================================================== */

// first-person hands (an adult's, denim-jacket sleeves). Poses are in camera space (wrist p, finger direction F,
// palm normal N); poses with `aim` are re-aimed every frame so a point in the palm lands on a point in the world.
const FR_HAND_POSES = {
  // the phone held by its edges in your left hand, thumb on the screen (left-hand poses are written as right-hand poses and mirrored)
  phoneL:   { p: [0.12, -0.27, -0.36], F: [-0.55, 0.62, -0.56], N: [0.05, 0.62, 0.78], curl: [1.05, 1.15, 1.2, 1.25], thumb: [0.2, 0.25] },
  // the slip: hands thrown up and out, fingers spread
  flailL:   { p: [0.25, -0.04, -0.33], F: [0.35, 1, -0.15], N: [-0.2, 0.1, -1], curl: [0.08, 0.06, 0.1, 0.14], thumb: [0.7, 0.05] },
  flailR:   { p: [0.27, -0.02, -0.34], F: [0.4, 1, -0.2], N: [-0.15, 0.1, -1], curl: [0.1, 0.08, 0.1, 0.12], thumb: [0.7, 0.05] },
  // arms out for balance (hands low in the corners, palms down)
  balanceL: { p: [0.27, -0.26, -0.38], F: [0.55, 0.25, -0.8], N: [0.05, -1, 0.15], curl: [0.18, 0.2, 0.25, 0.3], thumb: [0.5, 0.12] },
  balanceR: { p: [0.28, -0.25, -0.37], F: [0.55, 0.28, -0.8], N: [0.05, -1, 0.15], curl: [0.2, 0.22, 0.25, 0.3], thumb: [0.5, 0.12] },
  // reaching for the pole, then both arms round it (aimed at the pole every frame)
  reachL:   { p: [0.2, -0.1, -0.45], F: [0, 0, -1], N: [1, 0, 0], curl: [0.3, 0.32, 0.36, 0.4], thumb: [0.55, 0.15], aim: [0, 0.05, 0.03] },
  reachR:   { p: [0.2, -0.1, -0.45], F: [0, 0, -1], N: [1, 0, 0], curl: [0.3, 0.32, 0.36, 0.4], thumb: [0.55, 0.15], aim: [0, 0.05, 0.03] },
  gripL:    { p: [0.2, -0.1, -0.45], F: [0, 0, -1], N: [1, 0, 0], curl: [1.3, 1.35, 1.35, 1.35], thumb: [0.12, 0.75], aim: [0, 0.05, 0.03], trem: 0.002 },
  gripR:    { p: [0.2, -0.2, -0.45], F: [0, 0, -1], N: [1, 0, 0], curl: [1.3, 1.35, 1.4, 1.4], thumb: [0.12, 0.75], aim: [0, 0.05, 0.03], trem: 0.002 },
  // sitting on the ground: hands planted beside you (only seen when you look down); pushing up to stand
  braceL:   { p: [0.3, -0.6, -0.2], F: [0.1, -0.2, -1], N: [0, -1, 0.2], curl: [0.25, 0.3, 0.35, 0.4], thumb: [0.5, 0.15] },
  braceR:   { p: [0.3, -0.6, -0.2], F: [0.1, -0.2, -1], N: [0, -1, 0.2], curl: [0.25, 0.3, 0.35, 0.4], thumb: [0.5, 0.15] },
  pushL:    { p: [0.26, -0.42, -0.34], F: [0.15, -0.35, -0.92], N: [0, -1, 0.3], curl: [0.15, 0.2, 0.25, 0.3], thumb: [0.55, 0.1] },
  pushR:    { p: [0.27, -0.41, -0.33], F: [0.15, -0.35, -0.92], N: [0, -1, 0.3], curl: [0.15, 0.2, 0.25, 0.3], thumb: [0.55, 0.1] },
};
const FR_HAND_BLEND = { phoneL: 0.4, flailL: 0.12, flailR: 0.14, balanceL: 0.35, balanceR: 0.35, reachL: 0.3, reachR: 0.3, gripL: 0.1, gripR: 0.1, braceL: 0.45, braceR: 0.45, pushL: 0.4, pushR: 0.4 };
for (const k of Object.keys(FR_HAND_POSES)) { FR_HAND_POSES[k + '!'] = FR_HAND_POSES[k]; FR_HAND_BLEND[k + '!'] = 0.02; }
FR_HAND_POSES['hidden!'] = HAND_POSES.hidden; FR_HAND_BLEND['hidden!'] = 0.02;

const _frAim = { y: new THREE.Vector3(), z: new THREE.Vector3(), x: new THREE.Vector3(), c: new THREE.Vector3(), q: new THREE.Quaternion() };
// re-aim pose `name` so its palm point lands on `world`, oriented by world directions Fw (fingers) and Nw (palm normal)
function frAimHand(name, camera, world, Fw, Nw, side = 1) {
  const P = FR_HAND_POSES[name], A = _frAim;
  A.q.copy(camera.quaternion).invert();
  A.y.copy(Fw).normalize().applyQuaternion(A.q); A.y.x *= side; P.F = [A.y.x, A.y.y, A.y.z];
  A.z.copy(Nw).normalize().applyQuaternion(A.q); A.z.x *= side; P.N = [A.z.x, A.z.y, A.z.z];
  A.y.set(...P.F).normalize();
  A.z.set(...P.N); A.z.addScaledVector(A.y, -A.z.dot(A.y)).normalize();
  A.x.crossVectors(A.y, A.z);
  A.c.copy(world).applyMatrix4(camera.matrixWorldInverse);
  A.c.x *= side;
  const l = P.aim;
  for (let i = 0; i < 3; i++) P.p[i] = A.c.getComponent(i) - (A.x.getComponent(i) * l[0] + A.y.getComponent(i) * l[1] + A.z.getComponent(i) * l[2]);
}

// "drone" shots (the 30 % spectacle): film-time windows where the camera leaves you to show the sliding pack down the avenue
const FR_DRONE = [
  // the spinning car still sliding down the avenue, nobody steering (riding along with it)
  { t0: 56.6, t1: 58.4, ids: ['B4'], follow: true, off: [3.6, 1.9, 9.5], look: [0, 0.8, 0], fov: 50 },
  // friction back, slow motion: the truck across from you trips onto two wheels (seen from in front of its cab)…
  { t0: 61.65, t1: 63.05, ids: ['T'], follow: false, off: [10.5, 2.6, 9.0], look: [0, 1.3, 0], fov: 46 },
  // …and the spinning car, caught sideways, barrel-rolls (seen end-on)
  { t0: 63.05, t1: 64.6, ids: ['B4'], follow: false, off: [-8.2, 2.0, 3.6], look: [0, 0.9, 0], fov: 54 },
];

const FILM = {
  build(app) {
    const { scene, camera, renderer } = app;
    FILM._app = app;
    camera.near = 0.03; camera.far = 2600; camera.updateProjectionMatrix();
    // the physics, once (a few seconds)
    const t0 = performance.now();
    app.world = frBuildWorld().run();
    console.log('[friction] simulation', Math.round(performance.now() - t0), 'ms,', app.world.events.length, 'contacts');
    // the street
    app.city = new FrictionCity(scene, renderer, app.rng);
    app.city.camera = camera;
    app.city.build();
    app.traffic = new FrTraffic(scene, app.world);
    app.cast = new FrictionCast(scene, app.world);
    app.props = new FrProps(scene, app.world);
    app.montage = new FrMontage(scene, app.traffic.factory);
    // the shared material treatment, with a lighter hand on the grime (a clean, sunny street)
    { const skip = new Set(); camera.traverse((o) => skip.add(o));
      scene.traverse((o) => {
        if (!o.isMesh || skip.has(o)) return;
        let q = o, person = false, veh = false; while (q) { if (q.name && q.name.startsWith('person:')) person = true; if (q.name && q.name.startsWith('veh:')) veh = true; q = q.parent; }
        if (person) return;
        for (const m of [].concat(o.material)) if (m && m.isMeshStandardMaterial && m.userData.grime === undefined && m.onBeforeCompile === THREE.Material.prototype.onBeforeCompile) { Look.surface(m, veh); if (!/glass/i.test(m.name || '')) Look.grime(m, veh ? 0.3 : 0.5); }
      }); }
    // you: hands, the phone, your legs (seen when you look down)
    app.hands = new ViewerHands(camera, { scale: 1.08, skin: '#d2a487', nail: '#e6cbbf', sleeve: '#3d5a7a', cuff: '#2f4560', watch: true, sleeveLen: 1.1, sleeveFit: 0.78, poses: FR_HAND_POSES, blends: FR_HAND_BLEND });
    app.phone = this._phone(app.hands);
    app.legs = new FrLegs(scene);
    // effects
    app.puffs = new BillboardSystem(scene, 500, false);
    app.glints = new StreakSystem(scene, 700);
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    const mk = (cls) => { const d = document.createElement('div'); d.className = cls; d.style.opacity = '0'; document.getElementById('hud').appendChild(d); return d; };
    app.chyron = mk('fr-chyron'); app.count = mk('fr-count');
    app.audio = new FRAudio(app.tl, app);
    // the big hits between cars (glass and debris)
    app.hits = app.world.events.filter((e) => e.dv > 3 && app.traffic.byId[e.a] && (e.b === null || app.traffic.byId[e.b]));
  },

  _phone(hands) {
    const ph = new THREE.Group();
    ph.add(new THREE.Mesh(new THREE.RoundedBoxGeometry(0.072, 0.152, 0.0085, 3, 0.008), new THREE.MeshStandardMaterial({ color: '#22252b', roughness: 0.35, metalness: 0.4 })));
    const cv = Tex.canvas(270, 576), c = cv.getContext('2d');
    const bg = c.createLinearGradient(0, 0, 0, 576); bg.addColorStop(0, '#eef0ea'); bg.addColorStop(1, '#e2e6dc'); c.fillStyle = bg; c.fillRect(0, 0, 270, 576);
    // a map: the street you're on, your blue dot heading for the junction
    c.fillStyle = '#c9dfc0'; c.fillRect(0, 0, 100, 576); c.fillRect(170, 0, 100, 250);
    c.strokeStyle = '#ffffff'; c.lineWidth = 40; c.beginPath(); c.moveTo(135, 600); c.lineTo(135, -20); c.moveTo(-20, 220); c.lineTo(300, 220); c.stroke();
    c.strokeStyle = '#4285f4'; c.lineWidth = 8; c.beginPath(); c.moveTo(135, 420); c.lineTo(135, 220); c.lineTo(290, 220); c.stroke();
    c.fillStyle = '#4285f4'; c.beginPath(); c.arc(135, 420, 15, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 5; c.stroke();
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.1446), new THREE.MeshBasicMaterial({ map: Tex.tex(cv, { repeat: false }) }));
    sc.position.z = 0.0044; ph.add(sc);
    ph.position.set(0.0, 0.07, 0.024); ph.rotation.set(0, 0, 0); ph.scale.setScalar(1 / hands.o.scale);
    hands.left.g.add(ph);
    return ph;
  },

  update(app, t, tl) {
    const cam = app.camera, W = app.world, st = frSimT(t);
    const me = W.sample('me', st, FILM._me || (FILM._me = {}));
    // you: after friction goes your body is where the simulation takes it (the camera track only holds the walk); the ground under you
    if (t > FR.tLoss) { cam.position.x += me.x - FR_CAM.x; cam.position.z += me.z - FR_CAM.z3; }
    cam.position.y += FrGround.h(me.x, me.z) - 0.15;
    // your eyes lock onto things now and then (FR_LOOK): turn the head to them, maybe narrow the view
    const L = FR_LOOK.find((l) => t >= l[0] && t < l[1]);
    if (L) {
      const w = MathX.smooth(t, L[0], L[0] + 0.3) * (1 - MathX.smooth(t, L[1] - 0.3, L[1])), tg = FILM._tg || (FILM._tg = new THREE.Vector3());
      // (offsets are in the body's frame: [right, up, forward])
      if (L[2].id) { const b = W.sample(L[2].id, st), o = L[2].off || [0, 0, 0], c = Math.cos(b.yaw), sn = Math.sin(b.yaw); tg.set(b.x + c * o[0] - sn * o[2], FrGround.h(b.x, b.z) + o[1], b.z - sn * o[0] - c * o[2]); }
      else tg.set(...L[2].p);
      const dx = tg.x - cam.position.x, dy = tg.y - cam.position.y, dz = tg.z - cam.position.z;
      let yaw = Math.atan2(-dx, -dz); const pitch = Math.atan2(dy, Math.hypot(dx, dz));
      while (yaw - cam.rotation.y > Math.PI) yaw -= Math.PI * 2; while (yaw - cam.rotation.y < -Math.PI) yaw += Math.PI * 2;
      cam.rotation.y = MathX.lerp(cam.rotation.y, yaw, w); cam.rotation.x = MathX.lerp(cam.rotation.x, pitch, w);
      const f = typeof L[3] === 'function' ? L[3](t) : L[3];
      if (f) { cam.fov = MathX.lerp(cam.fov, f, w); cam.updateProjectionMatrix(); }
    }
    // the montage and the drone shots take the camera
    const shot = app.montage.update(t, cam), drone = this._drone(app, t);
    const over = shot || drone;
    if (over) { cam.position.set(over.x, over.y, over.z); cam.rotation.set(MathX.deg(over.pitch), MathX.deg(over.yaw), MathX.deg(over.roll || 0), 'YXZ'); if (Math.abs(cam.fov - over.fov) > 1e-3) { cam.fov = over.fov; cam.updateProjectionMatrix(); } }
    cam.updateMatrixWorld(true);
    this._shadowFocus(app);
    this._aimHands(app, t);
    app.hands.update(t);
    this._handVisibility(app);
    if (over) { app.hands.right.g.visible = false; app.hands.left.g.visible = false; }
    app.phone.visible = t < FR.tLoss + 0.06;
    app.legs.update(t, cam, !over);
    app.city.update(t);
    app.traffic.update(st);
    app.cast.update(st);
    app.props.update(st);
    this._fx(app, st, t);
    this._overlays(app, t, shot);
  },

  // the sun's shadow box follows what you're looking at
  _shadowFocus(app) {
    const cam = app.camera, c = app.city, f = FILM._f || (FILM._f = new THREE.Vector3());
    cam.getWorldDirection(f); f.y = 0; if (f.lengthSq() < 1e-6) f.set(0, 0, -1); f.normalize();
    const fx = cam.position.x + f.x * 45, fz = cam.position.z + f.z * 45, fy = FrGround.road(fz);
    c.sun.target.position.set(fx, fy, fz); c.sun.target.updateMatrixWorld();
    c.sun.position.copy(c.sunDir).multiplyScalar(170).add(c.sun.target.position);
  },

  // a camera riding with (or waiting for) the sliding pack down the avenue
  _drone(app, t) {
    const D = FR_DRONE.find((d) => t >= d.t0 && t < d.t1);
    if (!D) return null;
    const W = app.world, ref = D.follow ? frSimT(t) : frSimT(D.t0), c = { x: 0, z: 0 }, s = {};
    for (const id of D.ids) { W.sample(id, ref, s); c.x += s.x / D.ids.length; c.z += s.z / D.ids.length; }
    const u = t - D.t0, x = c.x + D.off[0] - u * 0.3, z = c.z + D.off[2] + (D.follow ? 0 : -u * 0.6), y = FrGround.h(x, z) + D.off[1];
    const lx = c.x + D.look[0], lz = c.z + D.look[2], ly = FrGround.h(lx, lz) + D.look[1];
    const yaw = Math.atan2(-(lx - x), -(lz - z)) * 180 / Math.PI, pitch = Math.atan2(ly - y, Math.hypot(lx - x, lz - z)) * 180 / Math.PI;
    const sh = t > 61.5 ? Math.exp(-(t - 61.65) / 0.6) : 0;
    return { x, y, z, yaw: yaw + sh * Math.sin(t * 40) * 0.6, pitch: pitch + sh * Math.sin(t * 47) * 0.6, fov: D.fov };
  },

  // both arms round the sign pole: one hand each side of it, fingers wrapping behind; they slip down when you try to step.
  // Before that, they reach for it.
  _aimHands(app, t) {
    const cam = app.camera, P = FR_POLE, V = FILM._v || (FILM._v = { f: new THREE.Vector3(), n: new THREE.Vector3(), w: new THREE.Vector3() });
    const dx = P.x - cam.position.x, dz = P.z - cam.position.z, d = Math.hypot(dx, dz) || 1, fx = dx / d, fz = dz / d;   // toward the pole
    const rx = -fz, rz = fx, r = 0.05;                                                                                        // right of that line
    const slip = MathX.smooth(t, 4.5, 4.7) * (1 - MathX.smooth(t, 5.0, 5.6)) * 0.3;
    const reach = 1 - MathX.smooth(t, 3.25, 3.56);
    for (const [name, side, y] of [['gripL', -1, 1.36], ['reachL', -1, 1.4], ['gripR', 1, 1.2], ['reachR', 1, 1.22]]) {
      const back = name.startsWith('reach') ? 0.25 * reach : 0;
      V.w.set(P.x + rx * side * (r + 0.02) - fx * back, 0.15 + y - slip, P.z + rz * side * (r + 0.02) - fz * back);
      V.f.set(fx, -0.15, fz);                          // fingers toward the pole, a little down
      V.n.set(-rx * side, 0, -rz * side);              // palm faces the pole from its side
      frAimHand(name, cam, V.w, V.f, V.n, side);
    }
  },

  // a hand whose wrist is far outside the picture (you looked away from the pole) is simply not drawn
  _handVisibility(app) {
    for (const h of [app.hands.right, app.hands.left]) {
      const p = h.g.position;
      if (p.z > -0.1 || Math.abs(p.x) > -p.z * 1.1 || p.y > -p.z * 1.3) h.g.visible = false;
    }
  },

  // the montage label and the 3-2-1
  _overlays(app, t, shot) {
    const ch = app.chyron, k = shot ? StoryHUD.win(t, shot.t0, shot.t1, 0.12, 0.15) : 0;
    if (shot && ch._id !== shot.id) { ch.innerHTML = `<span class="mw">MEANWHILE</span><span class="mt">${shot.label}</span>`; ch._id = shot.id; }
    ch.style.opacity = k.toFixed(3);
    const n = t >= 58.5 && t < 61.5 ? 3 - Math.floor(t - 58.5) : 0, c = app.count;
    if (n) { if (c._n !== n) { c.textContent = String(n); c._n = n; } const u = (t - 58.5) % 1; c.style.opacity = (Math.min(1, u / 0.08) * (1 - MathX.smooth(u, 0.75, 1))).toFixed(3); c.style.transform = `translate(-50%, -50%) scale(${(1.25 - 0.25 * Math.min(1, u / 0.25)).toFixed(3)})`; }
    else c.style.opacity = '0';
  },

  _fx(app, st, t) {
    const P = app.puffs, G = app.glints, W = app.world, s = {};
    P.begin(app.scene.fog); G.begin();
    // car hits: a spray of glass glints and dark debris (no dust or smoke: nothing is scraping)
    for (const e of app.hits) {
      const age = st - e.t;
      if (age < 0 || age > 1.6) continue;
      const k = Math.min(1, e.dv / 8), y0 = FrGround.road(e.z);
      for (let i = 0; i < 34; i++) {
        const h1 = hash1(i * 11 + Math.floor(e.t * 97)), h2 = hash1(i * 17 + 3), h3 = hash1(i * 5 + 9);
        const a = h1 * Math.PI * 2, sp = (1.5 + 4 * h2) * k, vy = 1.2 + 3 * h3, tt = Math.min(age, 1.0);
        const x = e.x + Math.cos(a) * sp * tt, z = e.z + Math.sin(a) * sp * tt, y = Math.max(y0 + 0.02, y0 + 0.8 + vy * tt - 4.9 * tt * tt);
        if (i % 3 === 0) P.push(x, y, z, 0.05 + 0.05 * h3, h1 * 6, 0.95 * (1 - age / 1.6), 0.18, 0.4, 0.4, 0.42);        // plastic and metal bits
        else { const tw = 0.5 + 0.5 * Math.sin(age * 40 + i); G.push(x, y, z, x + Math.cos(a) * 0.05, y + 0.02, z + Math.sin(a) * 0.05, 1, 1, 1, 0.85 * tw * (1 - age / 1.6), 0.013); }
      }
    }
    // friction is back: smoke from every skidding tyre, sparks from anything sliding on its roof or side, dust where things land
    if (st > FR.tBack) for (const c of app.traffic.cars) {
      const R = c.ret; if (!R) continue;
      const a = st - FR.tBack;
      W.sample(c.id, st, s);
      if (R.skid && a < R.skid) for (let i = 0; i < 4; i++) { const h = hash1(i * 13 + c.id.charCodeAt(0) * 7 + Math.floor(st * 20)), ss = Math.sin(s.yaw), cs = Math.cos(s.yaw), lx = (i < 2 ? 1 : -1) * c.v.L * 0.3, lz = (i % 2 ? 1 : -1) * c.v.W * 0.45;
        P.push(s.x - ss * lx + cs * lz + (h - 0.5) * 0.4, FrGround.h(s.x, s.z) + 0.2 + h * 0.4, s.z - cs * lx - ss * lz, 0.6 + a * 1.2, h * 6, 0.32 * (1 - a / R.skid), 0.92, 0.9, 0.9, 0.92); }
      if (R.roll && a < R.dur + 0.4 && s.speed > 0.6) for (let i = 0; i < 10; i++) { const h1 = hash1(i * 7 + c.id.length * 31 + Math.floor(st * 30)), h2 = hash1(i * 3 + 5 + Math.floor(st * 30)), dir = Math.atan2(-s.vx, -s.vz) + (h1 - 0.5) * 1.2, len = 0.3 + 0.5 * h2;
        const x = s.x + (h2 - 0.5) * c.v.L * 0.6, z = s.z + (h1 - 0.5) * c.v.L * 0.6, y = FrGround.h(x, z) + 0.05;
        G.push(x, y, z, x + Math.sin(dir) * -len, y + 0.15 * h1, z + Math.cos(dir) * -len, 1, 0.75, 0.35, 0.9, 0.018); }
      if (R.roll) for (const [tl, str] of R.lands) { const age = st - tl; if (age < 0 || age > 1.8) continue; for (let i = 0; i < 6; i++) { const h = hash1(i * 5 + Math.floor(tl * 50)); P.push(s.x + (h - 0.5) * 2.2, FrGround.h(s.x, s.z) + 0.3 + age * 0.5, s.z + (hash1(i * 9) - 0.5) * 2.2, 1.0 + age * 2.2 * str, h * 6, 0.35 * str * (1 - age / 1.8), 0.8, 0.86, 0.8, 0.72); } }
    }
    P.end(); G.end();
  },

  grade(t, p) {
    p.flash = 0; p.fade = 0;
    p.ao = 0.55;
    p.exposure = 1.12; p.saturation = 1.26; p.contrast = 1.1; p.warmth = 0.08; p.blackLift = 0.0;
    p.vignette = 0.45; p.soft = 0.015; p.bloom = 0.24; p.bloomThreshold = 1.4; p.grain = 0.02;
    p.tunnel = 1.25; p.tunnelSoft = 0.5; p.tunnelDark = 0; p.edgeBlur = 0;
    // jolts of chroma at the slip and the hits on you
    p.chroma = 0.006 * MathX.impulse(t, 1.5, 0.25) + 0.004 * MathX.impulse(t, 3.56, 0.2) + 0.006 * MathX.impulse(t, 39.67, 0.3) + 0.004 * MathX.impulse(t, 42.03, 0.25);
    // the countdown closes in: the edges darken and blur, colour drains a little; the return is a white flash and a hit of contrast
    const cd = MathX.smooth(t, 54.6, 61.4) * (1 - MathX.smooth(t, 61.5, 61.7));
    p.vignette += 0.7 * cd; p.tunnel = 1.25 - 0.45 * cd; p.tunnelDark = 0.35 * cd; p.edgeBlur = 0.35 * cd; p.saturation -= 0.3 * cd;
    if (t >= 58.5 && t < 61.5) { const u = (t - 58.5) % 1; p.vignette += 0.25 * Math.exp(-u / 0.15); }   // a heartbeat on each number
    p.flash = 0.55 * MathX.impulse(t, 61.5, 0.12);
    const slow = t > FR_SLOW.t0 && t < FR_SLOW.t1 ? 1 : 0;
    p.saturation -= 0.12 * slow; p.contrast += 0.08 * slow;
    // the aftermath: a little haze of settling dust, then a warm, quiet end; black at the very end
    p.fade = MathX.smooth(t, 74.6, 75.4);
    // whip pans drag a little (camera-lag trail)
    const app = FILM._app;
    if (app && app.cam) {
      const C = app.cam, dt = 1 / 30, vf = C.tfov.value(t);
      const hfov = 2 * Math.atan(Math.tan(MathX.deg(vf) / 2) * 9 / 16) * 180 / Math.PI;
      const yr = (C.tyaw.value(t) - C.tyaw.value(t - dt)) / dt, pr = (C.tpitch.value(t) - C.tpitch.value(t - dt)) / dt;
      const cut = Math.abs(yr) > 1500 ? 0 : 1;
      p.smear.set(cut * MathX.clamp(yr / hfov * 0.008, -0.025, 0.025), cut * MathX.clamp(-pr / vf * 0.008, -0.025, 0.025));
    }
  },

  debug(app, t) { const s = app.world.sample('me', frSimT(t)); return `you ${s.x.toFixed(2)}, ${s.z.toFixed(2)} · sim ${frSimT(t).toFixed(2)} · contacts ${app.world.events.length}`; },
};

/* ---------------------------------------------------------------------
   Your legs: jeans and white trainers under the camera, seen when you look
   down — walking, a foot shooting out at the slip, braced at the pole,
   stretched out while you sit and slide, folding to stand, one step that grips.
   --------------------------------------------------------------------- */
class FrLegs {
  constructor(scene) {
    const jeans = Mat.std('#34465e', { roughness: 0.85 }), shoe = Mat.std('#eeeeea', { roughness: 0.6 }), sole = Mat.std('#c9c4b8', { roughness: 0.8 });
    this.root = new THREE.Group(); scene.add(this.root);
    const leg = (side) => {
      const hip = new THREE.Group(); hip.position.set(side * 0.1, 0, 0); this.root.add(hip);
      const th = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.062, 0.46, 10), jeans); th.position.y = -0.23; hip.add(th);
      const knee = new THREE.Group(); knee.position.y = -0.46; hip.add(knee);
      const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.05, 0.44, 10), jeans); sh.position.y = -0.22; knee.add(sh);
      const ank = new THREE.Group(); ank.position.y = -0.44; knee.add(ank);
      const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.075, 0.27), shoe); s1.position.set(0, -0.03, -0.07); ank.add(s1);
      const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.025, 0.28), sole); s2.position.set(0, -0.075, -0.07); ank.add(s2);
      for (const m of [th, sh, s1, s2]) { m.castShadow = true; m.receiveShadow = true; }
      return { hip, knee, ank };
    };
    this.L = leg(-1); this.R = leg(1);
  }

  // hip / knee / ankle angles (radians, + swings the leg forward) for each moment
  _pose(t) {
    const walk = (ph, a) => [Math.sin(ph) * a, Math.max(0, -Math.cos(ph)) * a * 1.4, 0];
    if (t < FR.tLoss) { const ph = t * 1.72 * 1.35 * Math.PI; return { L: walk(ph, 0.35), R: walk(ph + Math.PI, 0.35), sit: 0 }; }
    if (t < 3.56) { const k = MathX.smooth(t, 1.5, 1.66) * (1 - MathX.smooth(t, 2.0, 2.6)); return { L: [-0.15 * k, 0.15, 0], R: [1.1 * k, 0.1, -0.3 * k], sit: 0 }; }   // the right foot shoots forward
    if (t < 39.67) { const k = MathX.smooth(t, 4.5, 4.62) * (1 - MathX.smooth(t, 4.9, 5.5)); return { L: [0.05 - 0.2 * k, 0.12, 0], R: [0.15 + 0.7 * k, 0.1, 0], sit: 0 }; }
    if (t < 67.4) { const w = 0.05 * Math.sin(t * 1.3); return { L: [1.45 + w, 0.15, 0.2], R: [1.35 - w, 0.5, 0.25], sit: 1 }; }                                     // sitting, legs out in front
    const up = MathX.smooth(t, 67.6, 69.6), step = MathX.smooth(t, 70.4, 70.9) * (1 - MathX.smooth(t, 71.6, 72.4));
    return { L: [MathX.lerp(1.45, 0.0, up), MathX.lerp(0.15, 0.05, up) + 1.4 * Math.sin(up * Math.PI) * 0.6, 0], R: [MathX.lerp(1.35, 0.0, up) + 0.8 * step, MathX.lerp(0.5, 0.05, up) + 0.9 * Math.sin(up * Math.PI) * 0.6 + 0.2 * step, -0.2 * step], sit: 1 - up };
  }

  update(t, cam, show) {
    this.root.visible = show && t < 74.9;
    if (!this.root.visible) return;
    const P = this._pose(t), yaw = cam.rotation.y, eye = cam.position.y, ground = FrGround.h(cam.position.x, cam.position.z) - 0.0;
    // the hips sit under and a little behind your eyes (on the ground when you sit)
    const hipY = MathX.lerp(ground + 0.92, ground + 0.12, P.sit), back = 0.12;
    this.root.position.set(cam.position.x + Math.sin(yaw) * back, Math.min(hipY, eye - 0.55), cam.position.z + Math.cos(yaw) * back);
    this.root.rotation.set(0, yaw, 0);
    for (const [leg, a] of [[this.L, P.L], [this.R, P.R]]) { leg.hip.rotation.x = a[0]; leg.knee.rotation.x = -a[1]; leg.ank.rotation.x = a[2]; }
    // (keep the legs out of the very near plane)
    this.root.updateMatrixWorld(true);
  }
}
