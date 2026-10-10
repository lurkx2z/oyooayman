/* =====================================================================
   FILM — "What if men suddenly disappeared from the world?"
   The film-specific half of the engine (see js/main.js): builds the harbour, the viaduct, the ship, the train
   (you are in its front car), the passengers, the road below, the montage sets and the sound; then each frame it
   puts your head where the script says inside the moving train, turns it toward whatever you are looking at
   (MD_LOOK), and poses everything for time t. The montage and the two outside angles take the camera.
   ===================================================================== */

// first-person hands (a woman's: slim, a plum wool coat). Poses with `aim` are re-aimed every frame so a point in
// the palm lands on a point in the world (the pole, the cab door's frame).
const MD_HAND_POSES = {
  poleR: { p: [0.2, -0.2, -0.45], F: [0, 0, -1], N: [1, 0, 0], curl: [1.3, 1.35, 1.4, 1.4], thumb: [0.12, 0.75], aim: [0, 0.05, 0.03], trem: 0.0015 },
  // both hands on the front edge of the driver's desk, fingers over it, leaning in to see out
  deskR: { p: [0.2, -0.2, -0.45], F: [0, 0, -1], N: [0, -1, 0], curl: [0.9, 1.0, 1.05, 1.1], thumb: [0.35, 0.3], aim: [0, 0.04, 0.025], trem: 0.0015 },
  deskL: { p: [0.2, -0.2, -0.45], F: [0, 0, -1], N: [0, -1, 0], curl: [0.9, 1.0, 1.05, 1.1], thumb: [0.35, 0.3], aim: [0, 0.04, 0.025], trem: 0.0015 },
};
const MD_HAND_BLEND = { poleR: 0.16, deskR: 0.45, deskL: 0.5 };
for (const k of Object.keys(MD_HAND_POSES)) { MD_HAND_POSES[k + '!'] = MD_HAND_POSES[k]; MD_HAND_BLEND[k + '!'] = 0.02; }
MD_HAND_POSES['hidden!'] = HAND_POSES.hidden; MD_HAND_BLEND['hidden!'] = 0.02;

const _mdAim = { y: new THREE.Vector3(), z: new THREE.Vector3(), x: new THREE.Vector3(), c: new THREE.Vector3(), q: new THREE.Quaternion() };
// re-aim pose `name` so its palm point lands on `world`, oriented by world directions Fw (fingers) and Nw (palm normal)
function mdAimHand(name, camera, world, Fw, Nw, side = 1) {
  const P = MD_HAND_POSES[name], A = _mdAim;
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

// train-local → world (the car's tiny pitch and roll are ignored for aiming)
function mdLocal(t, x, y, z, out) { return out.set(MD_G.trackX + x, MD_G.floorY + y, mdNoseZ(t) + z); }
// a point on the ship (ship-local metres) → world
function mdShipPt(t, x, y, z, out) { const w = mdShipWorld(t, x, y, z); return out.set(w[0], w[1], w[2]); }

// where your eyes go: [t0, t1, target, fov, blend in, blend out]. Entries are applied in order, each easing the
// head from wherever the previous ones left it, so overlapping windows cross-fade. Target: { l: train-local } |
// { w: world } | function (t, out) → world.
const MD_LOOK = [
  // the car, the nose ahead (people on both benches, the harbour in the right-hand windows)
  [0.0, 2.2, { l: [0.45, 0.8, 0.0] }, 64, 0.01, 0.4],
  // the coffee cup falls out of nobody's hand
  [1.95, 4.7, { l: [0.62, 0.42, 3.9] }, 60, 0.4, 0.45],
  // the brake: the cab door's window (the driver's seat is empty, the handle has sprung up)
  [4.5, 9.5, { l: [0.05, 1.25, 1.0] }, (t) => MathX.lerp(50, 34, MathX.smooth(t, 5.4, 7.2)), 0.35, 0.6],
  // the road below the left-hand windows, looking back over the viaduct's edge: the cars coast; the SUV doesn't
  [9.3, 15.6, (t, o, c) => { const k = MD_CARS[0], m = mdCarMotion(k, Math.min(t, MD.cruise + 0.3)); return o.set(MD_G.roadX + 3.5, MD_G.quay + 0.6, Math.max(k[4] + m.d - 4, c.z + 14)); }, (t) => MathX.lerp(40, 31, MathX.smooth(t, 12.3, 13.6)), 0.9, 0.01],
  // the right-hand window: the airliner coming over low, then where it went in
  [15.58, 21.6, (t, o) => { if (t < MD.planeHit - 0.15) { FILM._app.cascade.plane.position(Math.min(t + 0.25, MD.planeHit), o); return o; } return o.set(MD_PLANE_HIT[0] - 10, 6, MD_PLANE_HIT[2]); },
    (t) => MathX.lerp(52, 30, MathX.smooth(t, 16.2, MD.planeHit - 0.4)), 0.01, 0.5],
  // the ship, close now
  [21.3, 26.9, (t, o) => mdShipPt(t, 46, 12, 0, o), (t) => MathX.lerp(52, 40, MathX.smooth(t, 21.5, 23.3)), 0.6, 0.01],
  // telephoto: its wheelhouse, lit, empty
  [23.3, 26.9, (t, o) => mdShipPt(t, 148.5, 30.2, 0, o), (t) => MathX.lerp(40, 9, Ease.inOutSine(MathX.clamp((t - 23.3) / 0.9, 0, 1))), 0.5, 0.01],
];

// outside cameras (from MD.wheel on, every shot): pos/at in world metres (or ship-local with ship: true), drift per
// second; hand: a small hand-held sway (you, standing on the stopped train's deck)
const MD_DRONE = [
  // inside the empty wheelhouse: the wheel making the autopilot's small corrections, the bridge coming up ahead
  { t0: MD.wheel[0], t1: MD.wheel[1], ship: true, pos: [152.6, 30.25, 0.7], at: [0, 15, -3], drift: [-0.35, 0, 0], fov: 58 },
  // off the pier at cap height: the bow (stacks behind it) slides in and hits; the column breaks
  { t0: MD.wheel[1], t1: 32.2, pos: [38, 13, -22], at: [2, 12.5, -62], drift: [-0.7, 0, -0.5], fov: 60 },
  // high behind the train: the span falls four metres in front of it
  { t0: 32.2, t1: MD.fires[0], pos: [24, 40, -40], at: [-4, 18, 0], drift: [0, -0.5, 0.8], fov: 52 },
  // +20 MIN: on the viaduct's deck by the last car, looking down at the waterfront: the crashes burn; so do the blocks
  { t0: MD.fires[0], t1: MD.grid[0], pos: [-6.5, 26.4, 60], at: [-42, 12, 170], drift: [0, 0, 0.45], atDrift: [-0.5, 0.6, 2.0], fov: 56, hand: 1 },
  // +6 HOURS: dusk over the city; then the blackout
  { t0: MD.grid[0], t1: MD.water[0], pos: [-8.0, 31.0, 8], at: [-150, 14, 250], drift: [0, 0.15, 0.3], atDrift: [-3, 0, 4], fov: 52, hand: 0.6 },
  // +2 DAYS: over the railing, down at the basin: the outfall
  { t0: MD.water[0], t1: MD.food[0], pos: [-16.0, 19.0, 44], at: [-34, 0, 4], drift: [0, -0.15, -0.35], atDrift: [-0.8, 0, -1.4], fov: 54, hand: 0.8 },
  // +2 WEEKS: across the harbour, the power station (a long lens from the deck)
  { t0: MD.nuke[0], t1: MD.end[0], pos: [2.6, 26.8, 36], at: [1262, 62, 720], drift: [0, 0, 0], atDrift: [0, 4, 0], fov: 12, hand: 0.25 },
  // the close: rising over the broken bridge and the dark city
  { t0: MD.end[0], t1: MD.fin, pos: [60, 90, -160], at: [-120, 10, 150], drift: [2, 3, -2], atDrift: [-4, 0, 6], fov: 50 },
];
// labels pinned to things in the world: [t0, t1, point(t, out), text(t)]
const MD_TAGS = [
  [11.4, 15.3, (t, o) => { const k = MD_CARS[0], m = mdCarMotion(k, t), dk = MathX.smooth(t, MD.vanish + 3, MD.cruise); return o.set(k[3] + k[7] * dk, MD_G.quay + 2.4, k[4] + m.d); },
    (t) => (t < MD.cruise ? `NO DRIVER · CRUISE CONTROL · ${Math.round(mdCarKmh('cruise', t))} km/h` : 'NO DRIVER · CRUISE CONTROL')],
  [16.2, MD.planeHit - 0.3, (t, o) => FILM._app.cascade.plane.position(t, o).add(FILM._tv2.set(0, 6, 0)), () => 'FLIGHT 288 · NOBODY AT THE CONTROLS'],
  [24.0, 26.7, (t, o) => mdShipPt(t, 147, 32.2, 0, o), () => 'WHEELHOUSE · NOBODY ON WATCH'],
  [MD.nuke[0] + 0.4, MD.nukeBang - 0.2, (t, o) => FILM._app.cascade._nukePt(-60, 80, 60, o), () => 'REACTOR 1 · COOLING ON DIESEL'],
];
// the cards: time jumps and the inserts
const MD_CARDS = [
  [MD.fires[0], MD.fires[0] + 1.7, 'LATER', '+20 MINUTES', 'ALL OVER THE WORLD'],
  [MD.fireSt[0], MD.fireSt[1], 'MEANWHILE', 'A FIRE STATION', 'ALARM RINGING FOR 19 MINUTES'],
  [MD.gov[0], MD.gov[0] + 1.8, '+1 HOUR', 'THE GOVERNMENT', 'EMERGENCY SESSION'],
  [MD.grid[0], MD.grid[0] + 1.7, 'LATER', '+6 HOURS', 'DUSK'],
  [MD.queue[0], MD.queue[0] + 1.6, 'MEANWHILE', 'A STREET TAP', 'THE LINE SINCE DAWN'],
  [MD.gridRoom[0], MD.gridRoom[1], 'MEANWHILE', 'GRID CONTROL', 'DISPATCH DESKS · UNSTAFFED'],
  [MD.water[0], MD.water[0] + 1.7, 'LATER', '+2 DAYS', 'NO POWER, ANYWHERE'],
  [MD.earth[0], MD.earth[1], 'SEEN FROM SPACE', 'THE NIGHT SIDE', 'CITY LIGHTS, GOING OUT'],
  [MD.births[0], MD.births[1], 'BIRTHS PER DAY, WORLDWIDE', '≈ 360,000', 'IN ~9 MONTHS: ALMOST NONE'],
  [MD.food[0], MD.food[1], '+2 WEEKS', 'A SUPERMARKET', 'NO DELIVERY FOR 13 DAYS'],
];

const FILM = {
  build(app) {
    const { scene, camera, renderer } = app;
    FILM._app = app;
    camera.near = 0.03; camera.far = 4000; camera.updateProjectionMatrix();
    // the static world first, so the shared material treatment (world-space grime) only lands on things that never move
    app.env = new MdHarbour(scene, renderer, app.rng);
    app.env.camera = camera;
    app.env.build();
    app.bridge = new MdBridge(scene, app.env);
    Look.apply(scene, camera);
    // things that move (no world-space grime: it would swim across them)
    app.ship = new MdShip(scene);
    app.train = new MdTrain(scene);
    app.cast = new MdCast(app, app.train);
    app.road = new MdRoad(scene);
    app.montage = new MdMontage();
    app.cascade = new MdCascade(app);
    // you: a woman's hands, a plum wool coat, skin-tone nails
    app.hands = new ViewerHands(camera, { scale: 0.96, skin: '#c99b80', nail: '#bf8f7c', sleeve: '#5a3a48', cuff: '#4a2f3b', watch: false, sleeveLen: 1.1, sleeveFit: 0.74,
      poses: MD_HAND_POSES, blends: MD_HAND_BLEND });
    app.puffs = new BillboardSystem(scene, 900, false);
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    const tg = document.createElement('div'); tg.className = 'md-tag'; tg.style.opacity = '0'; document.getElementById('hud').appendChild(tg); app.tag = tg;
    const ch = document.createElement('div'); ch.className = 'md-chyron'; ch.style.opacity = '0'; document.getElementById('hud').appendChild(ch); app.chyron = ch;
    const ck = document.createElement('div'); ck.className = 'md-clock'; ck.style.opacity = '0'; document.getElementById('hud').appendChild(ck); app.clock = ck;
    FILM._tv2 = new THREE.Vector3();
    app.audio = new MdAudio(app.tl, app);
    FILM._v = { a: new THREE.Vector3(), b: new THREE.Vector3(), f: new THREE.Vector3(), n: new THREE.Vector3() };
  },

  update(app, t) {
    const cam = app.camera, V = FILM._v;
    // the train carries you: script positions are train-local
    app.train.update(t);
    cam.position.x += MD_G.trackX; cam.position.z += mdNoseZ(t);
    // the brake throws you toward the nose a little
    const surge = mdSurge(t);
    cam.position.z -= 0.07 * surge; cam.rotation.x -= 0.025 * surge;
    this._look(app, t);
    // the outside angles take the camera
    const D = this._drone(t);
    if (D) { cam.position.set(D.x, D.y, D.z); cam.rotation.set(D.pitch, D.yaw, 0, 'YXZ'); if (cam.fov !== D.fov) { cam.fov = D.fov; cam.updateProjectionMatrix(); } }
    cam.updateMatrixWorld(true);
    this._aimHands(app, t);
    app.hands.update(t);
    this._handVis(app);
    const shot = app.montage.update(t);
    // the hands' sway reacts to the camera's jump on a cut back into the car: keep them out of the first frames
    const cutBack = MD_DRONE.some((d) => t >= d.t1 && t < d.t1 + 0.25) || (t >= MD.road[1] && t < MD.road[1] + 0.3);
    if (D || shot || cutBack) { app.hands.right.g.visible = false; app.hands.left.g.visible = false; }
    // the world
    app.env.update(t);
    this._daylight(app, t);
    app.cascade.update(t, cam);
    app.ship.update(t);
    app.bridge.update(t);
    app.cast.update(t);
    app.road.update(t);
    this._water(app, t);
    this._focus(app, t, D);
    this._fx(app, t);
    this._chyron(app, t);
    this._clock(app, t);
    this._tag(app, t);
    void V;
  },

  view(app, t) {
    const shot = app.montage.shotAt(t);
    return shot ? [shot.scene, shot.camera] : [app.scene, app.camera];
  },

  // turn the head toward the current look targets (on top of the camera's own small motions)
  _look(app, t) {
    const cam = app.camera, tg = FILM._tg || (FILM._tg = new THREE.Vector3());
    let yaw = 0, pitch = 0, fov = cam.fov;
    for (const L of MD_LOOK) {
      if (t < L[0] || t > L[1]) continue;
      const w = MathX.smooth(t, L[0], L[0] + L[4]) * (1 - MathX.smooth(t, L[1] - L[5], L[1]));
      if (w <= 0) continue;
      const T = L[2];
      if (typeof T === 'function') T(t, tg, cam.position); else if (T.l) mdLocal(t, T.l[0], T.l[1], T.l[2], tg); else tg.set(...T.w);
      const dx = tg.x - cam.position.x, dy = tg.y - cam.position.y, dz = tg.z - cam.position.z;
      let y = Math.atan2(-dx, -dz); const p = Math.atan2(dy, Math.hypot(dx, dz));
      while (y - yaw > Math.PI) y -= Math.PI * 2; while (y - yaw < -Math.PI) y += Math.PI * 2;
      yaw = MathX.lerp(yaw, y, w); pitch = MathX.lerp(pitch, p, w);
      const f = typeof L[3] === 'function' ? L[3](t) : L[3];
      fov = MathX.lerp(fov, f, w);
    }
    cam.rotation.y += yaw; cam.rotation.x += pitch;
    if (Math.abs(cam.fov - fov) > 1e-4) { cam.fov = fov; cam.updateProjectionMatrix(); }
  },

  _drone(t) {
    const D = MD_DRONE.find((d) => t >= d.t0 && t < d.t1);
    if (!D) return null;
    const u = t - D.t0;
    const ad = D.atDrift || [0, 0, 0];
    let x = D.pos[0] + D.drift[0] * u, y = D.pos[1] + D.drift[1] * u, z = D.pos[2] + D.drift[2] * u, ax = D.at[0] + ad[0] * u, ay = D.at[1] + ad[1] * u, az = D.at[2] + ad[2] * u;
    // a camera riding in the ship (ship-local metres)
    if (D.ship) { const p = mdShipWorld(t, x, y, z), a = mdShipWorld(t, ax, ay, az); [x, y, z] = p; [ax, ay, az] = a; }
    const dx = ax - x, dy = ay - y, dz = az - z;
    // the big hits shake even the outside camera a little
    const sh = 0.004 * (MathX.impulse(t, MD_FALL.tLand, 0.6) + (MD_FALL_B.tWater ? MathX.impulse(t, MD_FALL_B.tWater, 0.8) : 0));
    // hand-held: a slow drift of the aim and a little breathing (pure functions of time)
    const hd = D.hand ? D.hand * (0.006 * noise1(t * 0.6, 3) + 0.0025 * Math.sin(t * 1.3)) : 0, hp = D.hand ? D.hand * (0.004 * noise1(t * 0.5 + 9, 3) + 0.002 * Math.sin(t * 2.1)) : 0;
    const by = D.hand ? D.hand * 0.012 * Math.sin(t * 1.4) : 0;
    return { x, y: y + by, z, yaw: Math.atan2(-dx, -dz) + sh * Math.sin(t * 41) + hd, pitch: Math.atan2(dy, Math.hypot(dx, dz)) + sh * Math.sin(t * 53) + hp, fov: D.fov };
  },

  // the right hand on the door-bay pole; both hands on the cab door's frame
  _aimHands(app, t) {
    const cam = app.camera, V = FILM._v;
    // pole (train-local x 0, z 6.1): grip at chest height, fingers wrapping round it from your side
    mdLocal(t, 0.0 + 0.03, 1.28, MD_CAR.doors[0] + 0.04, V.a);
    V.f.set(-0.3, -0.1, -1); V.n.set(-1, 0, 0.2);
    mdAimHand('poleR', cam, V.a, V.f, V.n, 1);
    // the desk's front edge (train-local z 1.0, top at y 1.08): one hand each side of you, fingers curling over it
    for (const [name, side] of [['deskR', 1], ['deskL', -1]]) {
      mdLocal(t, 0.3 + side * 0.24, 1.1, 1.02, V.a);
      V.f.set(-side * 0.1, -0.35, -1); V.n.set(0, -1, 0.3);
      mdAimHand(name, cam, V.a, V.f, V.n, side);
    }
  },

  // a hand whose wrist is far outside the picture is simply not drawn
  _handVis(app) {
    for (const h of [app.hands.right, app.hands.left]) {
      const p = h.g.position;
      if (p.z > -0.08 || Math.abs(p.x) > -p.z * 1.2 || p.y > -p.z * 1.4) h.g.visible = false;
    }
  },

  // the ship's wake and the impact's splashes in the water shader
  _water(app, t) {
    const U = app.env.WU, b = mdShipBow(t);
    U.uShip.value.set(b[0], b[1], MD_SHIP.head, mdShipSpeed(t));
    U.uHit.value.set(-2.1, MD_G.pierHit, MD.hit + 0.3, 0.9);
    U.uSplash.value.set(-2.1, -2.0, MD_FALL_B.tWater || 1e4, 26);
    // sewage: from the third day, a brown plume out of the outfall into the basin (and on)
    const sew = t >= MD.water[0] ? (t < MD.food[0] ? 1 : 0.5) : 0, sr = t < MD.water[0] ? 0 : t < MD.food[0] ? 9 + (t - MD.water[0]) * 4.2 : 120;
    U.uSewage.value.set(MD_OUTFALL[0], MD_G.shoreZ - 2 - 0.45 * sr, sr, sew * 0.9);
    // the fuel burning on the water where the plane went in
    const pf = t < MD.planeHit ? 0 : (t < MD.fires[0] ? 1 : t < MD.water[0] ? 0.6 : 0.25) * MathX.smooth(t, MD.planeHit, MD.planeHit + 0.3);
    U.uGlowW.value.set(MD_PLANE_HIT[0], MD_PLANE_HIT[2], 40, pf * (0.25 + 0.6 * mdSky(t).night));
  },

  // the sun's shadow box: around you in the car; around the pier and the bow outside
  _focus(app, t, D) {
    const cam = app.camera, f = FILM._v.f;
    if (D && t < MD.fires[0]) { app.env.focus(10, 14, -42, 95); return; }
    if (D) { app.env.focus(D.x + f.x * 0 - 20, 12, D.z + 40, 110); return; }
    cam.getWorldDirection(f);
    const far = t > MD.plane[0] + 0.5 ? 1 : 0;
    if (far) app.env.focus(cam.position.x + f.x * 40, 22, cam.position.z + f.z * 40, 70);
    else app.env.focus(cam.position.x + f.x * 6, MD_G.floorY, cam.position.z + f.z * 6, 34);
  },

  _fx(app, t) {
    const P = app.puffs;
    P.begin(app.scene.fog);
    const d = t - MD.hit;
    if (d > -0.05 && d < 14) {
      // the pier bursts: a cloud of concrete dust that rolls out and drifts downwind (+x, slowly)
      for (let i = 0; i < 70; i++) {
        const h1 = hash1(i * 3.7 + 1), h2 = hash1(i * 5.3 + 2), h3 = hash1(i * 7.1 + 3), u = Math.max(0, d - h3 * 0.5);
        if (u <= 0) continue;
        const a = h1 * Math.PI * 2, r = (2 + 9 * h2) * (1 - Math.exp(-u / 0.9)) + u * 0.4;
        const x = -2.1 + Math.cos(a) * r * 0.8 + u * 0.7, z = MD_G.pierHit + Math.sin(a) * r * 0.6, y = 6 + 20 * h3 - u * 0.35 * (1 - h3);
        const al = 0.42 * Math.min(1, u / 0.25) * Math.exp(-u / 5.5);
        P.push(x, y, z, 3.5 + u * 1.6 + 3 * h1, h2 * 6, al, 0.78, 0.82, 0.79, 0.74);
      }
      // the column's blocks hitting the water
      for (const c of app.bridge.chunks) {
        const vy = c.v[1], y0 = c.p0[1], disc = vy * vy + 2 * 9.81 * y0;
        if (disc < 0) continue;
        const tu = (vy + Math.sqrt(disc)) / 9.81, tw = MD.hit + c.delay + tu, age = t - tw;
        if (age < 0 || age > 3) continue;
        const x = c.p0[0] + c.v[0] * tu - 3.0 * c.delay, z = c.p0[2] + c.v[2] * tu;
        for (let i = 0; i < 6; i++) { const h = hash1(i * 11 + c.p0[1] * 3), up = (4 + 5 * h) * age - 4.9 * age * age; if (up < 0) continue; P.push(x + (h - 0.5) * 2, up, z + (hash1(i * 7 + 1) - 0.5) * 2, 1.6 + age * 1.5, h * 6, 0.6 * (1 - age / 3), 0.95, 0.94, 0.96, 0.97); }
      }
    }
    // the far end lands on the bow: grit and dust over the forecastle
    const dl = t - MD_FALL.tLand;
    if (dl > 0 && dl < 6) {
      const b = mdShipBow(t);
      for (let i = 0; i < 30; i++) { const h1 = hash1(i * 9.1 + 4), h2 = hash1(i * 2.9 + 5), a = h1 * 6.283, r = (1.5 + 6 * h2) * (1 - Math.exp(-dl / 0.5));
        P.push(b[0] - 3 + Math.cos(a) * r, MD_FALL.land + 1 + h2 * 4 + dl * 0.5, -59.5 + Math.sin(a) * r, 2.2 + dl * 1.4, h1 * 6, 0.4 * Math.exp(-dl / 2.2) * Math.min(1, dl / 0.15), 0.72, 0.76, 0.73, 0.68); }
    }
    // the near end hits the water: a wall of spray along the span
    const tw = MD_FALL_B.tWater, ds = tw ? t - tw : -1;
    if (ds > 0 && ds < 7) {
      for (let i = 0; i < 90; i++) {
        const h1 = hash1(i * 4.3 + 7), h2 = hash1(i * 6.1 + 8), h3 = hash1(i * 8.7 + 9);
        const z = -2.5 - 24 * h1 * h1, side = h2 < 0.5 ? -1 : 1, vy = 6 + 14 * h3 * (1 - h1 * 0.6), vx = side * (2 + 6 * h2);
        const tt = Math.min(ds, 2.6), y = Math.max(0.4, vy * tt - 4.9 * tt * tt), x = -2.1 + side * 3 + vx * tt;
        const al = 0.4 * Math.min(1, ds / 0.1) * Math.exp(-ds / 0.9);
        P.push(x, y + h3 * 2, z, 1.8 + ds * 1.5 + 1.5 * h3, h1 * 6, al, 0.98, 0.95, 0.97, 0.98);
      }
    }
    P.end();
  },

  _tag(app, t) {
    const tg = app.tag, T = MD_TAGS.find((g) => t >= g[0] && t < g[1]), v = FILM._tv || (FILM._tv = new THREE.Vector3());
    if (!T) { if (tg._o !== 0) { tg.style.opacity = '0'; tg._o = 0; } return; }
    T[2](t, v); v.project(app.camera);
    const vis = v.z < 1 && Math.abs(v.x) < 0.95 && v.y < 0.92 && v.y > -0.9;
    const txt = T[3](t); if (tg._t !== txt) { tg.textContent = txt; tg._t = txt; }
    tg.style.left = `${MathX.clamp((v.x + 1) / 2 * 100, 34, 66).toFixed(2)}%`; tg.style.top = `${((1 - v.y) / 2 * 100).toFixed(2)}%`;
    const o = vis ? StoryHUD.win(t, T[0], T[1], 0.2, 0.2) : 0; tg.style.opacity = o.toFixed(3); tg._o = o;
  },

  // the cards: LATER · +6 HOURS, MEANWHILE · GRID CONTROL
  _chyron(app, t) {
    const ch = app.chyron, C = MD_CARDS.find((c) => t >= c[0] && t < c[1]);
    if (!C) { if (ch._o !== 0) { ch.style.opacity = '0'; ch._o = 0; } return; }
    if (ch._id !== C[3]) { ch.innerHTML = `<span class="mw">${C[2]}</span><span class="mt">${C[3]}</span>` + (C[4] ? `<span class="mr">${C[4]}</span>` : ''); ch._id = C[3]; }
    const k = StoryHUD.win(t, C[0], C[1], 0.1, 0.2); ch.style.opacity = k.toFixed(3); ch._o = k;
  },

  // the clock top right: time since the vanish (it ticks; on the jumps it shows the new time)
  _clock(app, t) {
    const ck = app.clock, on = t > MD.vanish + 0.4 && t < MD.end[0] - 0.2;
    if (!on) { if (ck._o !== 0) { ck.style.opacity = '0'; ck._o = 0; } return; }
    const m = mdWorldMin(t);
    let txt;
    if (m < 60) txt = `${String(Math.floor(m)).padStart(2, '0')}:${String(Math.floor((m * 60) % 60)).padStart(2, '0')}`;
    else if (m < 48 * 60) txt = `${Math.floor(m / 60)} H ${String(Math.floor(m % 60)).padStart(2, '0')} MIN`;
    else txt = `DAY ${Math.floor(m / 1440)}`;
    const html = `<span class="cl">SINCE THE VANISH</span><span class="cv">${txt}</span>`;
    if (ck._t !== html) { ck.innerHTML = html; ck._t = html; }
    const k = StoryHUD.win(t, MD.vanish + 0.4, MD.end[0] - 0.2, 0.3, 0.3); ck.style.opacity = k.toFixed(3); ck._o = k;
  },

  // the light of the day: the sky, the sun, the haze and the water follow mdSky
  _daylight(app, t) {
    const E = app.env, S = mdSky(t), U = E.skyUniforms, W = E.WU, C = FILM._dc || (FILM._dc = {
      z: new THREE.Color('#4f6378'), h: new THREE.Color('#b9b6a8'), f: new THREE.Color('#9a9d96'), sun: new THREE.Color('#ffd09a'),
      zN: new THREE.Color('#0a0e15'), hN: new THREE.Color('#2a2422'), fN: new THREE.Color('#15151a'), sunN: new THREE.Color('#ff7a3a'),
      zG: new THREE.Color('#5d6166'), hG: new THREE.Color('#8f8d86'), fG: new THREE.Color('#7f7d78'),
      wH: new THREE.Color('#b4b5aa'), wZ: new THREE.Color('#5d7186'), wD: new THREE.Color('#1b2a2c'), tmp: new THREE.Color() });
    if (FILM._fogD === undefined) FILM._fogD = app.scene.fog.density;
    const n = S.night, g = S.grey;
    U.uZenith.value.copy(C.z).lerp(C.zG, g).lerp(C.zN, n);
    U.uHorizon.value.copy(C.h).lerp(C.hG, g).lerp(C.hN, n);
    U.uSunColor.value.copy(C.sun).lerp(C.sunN, MathX.smooth(n, 0.3, 0.6)).multiplyScalar((1 - g * 0.85) * (1 - MathX.smooth(n, 0.6, 0.85)));
    U.uCloud.value = 1 - 0.85 * n - 0.1 * g;
    app.scene.fog.color.copy(C.f).lerp(C.fG, g).lerp(C.fN, n);
    app.scene.background.copy(U.uHorizon.value);
    // haze from the smoke (thinner for the long lenses)
    const thin = Math.max(MathX.smooth(t, 23.3, 24.0) * (1 - MathX.smooth(t, 26.75, 26.8)), t >= MD.nuke[0] && t < MD.end[0] ? 0.96 : 0);
    app.scene.fog.density = FILM._fogD * (1 + 0.7 * S.haze) * (1 - 0.7 * thin);
    // the blackout: the same three steps as the city's windows; the street level goes dark with them
    const db = t - MD.blackout, bo = t >= MD.grid[0] && t < MD.water[0] && db >= 0 ? (db < 0.55 ? 0.35 : db < 1.1 ? 0.6 : 0.8) : 0;
    E.sun.intensity = 2.7 * (1 - n) * (1 - 0.7 * g) * (1 - bo);
    E.hemi.intensity = 1.05 * (1 - 0.8 * n) * (1 + 0.1 * g) * (1 - bo);
    if (E.shopMats) for (const m of E.shopMats) m.emissiveIntensity = t >= MD.blackout ? 0 : 0.55;   // no power from here on
    W.uSkyH.value.copy(C.wH).lerp(C.fG, g).lerp(C.hN, n);
    W.uSkyZ.value.copy(C.wZ).lerp(C.zG, g).lerp(C.zN, n);
    W.uDeep.value.copy(C.wD).multiplyScalar(1 - 0.75 * n);
    W.uSun.value.copy(U.uSunColor.value);
  },

  grade(t, p) {
    const T = MD, S = mdSky(t);
    p.flash = 0; p.fade = 0; p.chroma = 0; p.edgeBlur = 0; p.ao = 0.6;
    // late afternoon: warm, clear, a touch of haze (docs/STYLE_BIBLE.md)
    p.exposure = 1.08; p.saturation = 1.14; p.contrast = 1.08; p.warmth = 0.07; p.blackLift = 0.01;
    p.vignette = 0.5; p.soft = 0.03; p.bloom = 0.24; p.bloomThreshold = 1.35; p.grain = 0.022;
    p.tunnel = 1.25; p.tunnelSoft = 0.5; p.tunnelDark = 0;
    p.flashColor.setRGB(1, 1, 1);
    // after the vanish the world cools a little (colour as storytelling)
    const after = MathX.smooth(t, T.vanish, T.vanish + 2.5);
    p.warmth -= 0.05 * after; p.saturation -= 0.06 * after;
    // the vanish: a single-frame dip, a little chroma
    p.chroma += 0.005 * MathX.impulse(t, T.vanish, 0.2);
    p.exposure -= 0.12 * MathX.impulse(t, T.vanish, 0.12);
    // the plane: a flash of fire on the water
    p.flash += 0.18 * MathX.impulse(t, T.planeHit, 0.08); p.flashColor.setRGB(1, 0.8, 0.6);
    // the bow closing, then the impact
    const close = MathX.smooth(t, T.hit - 3, T.hit) * (1 - MathX.smooth(t, T.hit, T.hit + 0.2));
    p.vignette += 0.3 * close;
    p.flash += 0.25 * MathX.impulse(t, T.hit, 0.06);
    p.chroma += 0.007 * MathX.impulse(t, T.hit, 0.35);
    // later: smoke, grey days, the night (kept readable on a phone), the fires' warmth in the dark
    p.saturation -= 0.18 * S.grey + 0.1 * S.haze;
    p.contrast += 0.06 * S.night;
    p.exposure += 0.35 * S.night;
    p.warmth += 0.06 * S.glow * S.night;
    p.bloom += 0.35 * S.night; p.bloomThreshold -= 0.5 * S.night;
    p.vignette += 0.2 * S.night;
    // the reactor building: a white flash on the long lens
    p.flash += 0.22 * MathX.impulse(t, T.nukeBang, 0.1);
    // the jumps in time: a quick dip to black between the eras
    for (const [tj] of MD_JUMPS) p.exposure -= 0.9 * MathX.impulse(t, tj, 0.12) * (t >= tj ? 1 : 0);
    // the end line: darker so the white line reads on a phone; black at the very end
    const end = MathX.smooth(t, T.line[0] - 0.5, T.line[0] + 1.5);
    p.exposure -= 0.1 * end; p.vignette += 0.2 * end;
    p.fade = MathX.smooth(t, T.fin - 0.8, T.fin);
  },

  debug(app, t) {
    const b = mdShipBow(t);
    return `train ${mdTrainKmh(t)} km/h · nose z ${mdNoseZ(t).toFixed(1)} · stop ${MD.stop.toFixed(2)} s<br>bow ${b[0].toFixed(1)}, ${b[1].toFixed(1)} · gap ${mdShipGap(t).toFixed(1)} m · span land ${MD_FALL.tLand.toFixed(2)} water ${(MD_FALL_B.tWater || 0).toFixed(2)}`;
  },
};
