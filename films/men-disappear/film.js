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
  doorR: { p: [0.2, -0.2, -0.45], F: [0, 0, -1], N: [1, 0, 0], curl: [1.15, 1.25, 1.3, 1.35], thumb: [0.2, 0.6], aim: [0, 0.05, 0.03], trem: 0.002 },
  doorL: { p: [0.2, -0.2, -0.45], F: [0, 0, -1], N: [1, 0, 0], curl: [1.15, 1.25, 1.3, 1.35], thumb: [0.2, 0.6], aim: [0, 0.05, 0.03], trem: 0.002 },
};
const MD_HAND_BLEND = { poleR: 0.16, doorR: 0.35, doorL: 0.4 };
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
function mdLocal(t, x, y, z, out) { return out.set(x, MD_G.floorY + y, mdNoseZ(t) + z); }
// a point on the ship (ship-local metres) → world
function mdShipPt(t, x, y, z, out) { const w = mdShipWorld(t, x, y, z); return out.set(w[0], w[1], w[2]); }

// where your eyes go: [t0, t1, target, fov, blend in, blend out]. Entries are applied in order, each easing the
// head from wherever the previous ones left it, so overlapping windows cross-fade. Target: { l: train-local } |
// { w: world } | function (t, out) → world.
const MD_LOOK = [
  // the car, the nose ahead (people on both benches, the harbour in the right-hand windows)
  [0.0, 2.2, { l: [0.45, 1.1, 0.0] }, 64, 0.01, 0.4],
  // the coffee cup falls out of nobody's hand
  [1.95, 4.7, { l: [0.62, 0.42, 3.9] }, 60, 0.4, 0.45],
  // the brake: the cab door's window (the driver's seat is empty, the handle has sprung up)
  [4.5, 9.5, { l: [0.05, 1.25, 1.0] }, 50, 0.35, 0.6],
  // the road below the left-hand windows: the cars coast, one doesn't
  [9.3, 16.7, (t, o) => o.set(MD_G.roadX + 0.5, MD_G.quay + 0.4, 44.0 + 14 * (1 - MathX.smooth(t, 9.3, 13.6))), 46, 0.9, 0.7],
  // the harbour: the ship crossing toward the viaduct
  [16.3, 20.8, (t, o) => mdShipPt(t, 46, 13, 0, o), 50, 0.9, 0.4],
  // telephoto: its wheelhouse, lit, empty
  [20.4, 24.0, (t, o) => mdShipPt(t, 146.5, 28.5, 0, o), (t) => MathX.lerp(50, 7.5, Ease.inOutSine(MathX.clamp((t - 20.4) / 0.9, 0, 1))), 0.4, 0.01],
  // back on the train: the bow is much closer
  [31.69, 34.6, (t, o) => mdShipPt(t, 34, 12, 0, o), 58, 0.01, 0.5],
  // a glance back: the women take the children to the back of the car
  [34.2, 35.6, { l: [0.2, 1.3, 15.5] }, 64, 0.4, 0.5],
  // the cab door: the track ahead, the pier and the bow coming for it
  [36.0, 49.3, (t, o) => { const b = mdShipBow(t), k = MathX.smooth(t, MD.turn, MD.hit); return o.set(MathX.lerp((b[0] + 6 - 2.1) / 2, 0.6, k), 23.0, -60); }, 60, 0.6, 0.01],
  // the cab, after: the rails end in the air; the span lies across the bow
  [54.39, 67.0, (t, o) => o.set(0.4, MathX.lerp(24.5, 21.0, MathX.smooth(t, 55, 58)), MathX.lerp(-14, -40, MathX.smooth(t, MD.line[0] - 1, MD.line[1]))), 58, 0.01, 0.01],
];

// the two outside angles after the impact
const MD_DRONE = [
  // low over the water off the right side: the far end of the span drops onto the bow, the near end follows
  { t0: MD.drone[0], t1: 51.9, pos: [74, 7.5, -6], at: [-4, 17, -38], drift: [-1.6, 0.4, -1.2], fov: 54 },
  // high behind the train: it stopped four metres short of the gap
  { t0: 51.9, t1: MD.drone[1], pos: [-17, 47, 33], at: [0, 16, -30], drift: [0.6, -0.5, -1.4], fov: 52 },
];
const MD_MONTAGE_LABEL = { cockpit: ['ABOVE THE ATLANTIC', 'FLIGHT 288 · BOTH SEATS EMPTY'], fire: ['A FIRE STATION', 'A CALL COMES IN'], ward: ['A HOSPITAL WARD', 'THE NIGHT SHIFT'] };

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
    // you: a woman's hands, a plum wool coat, skin-tone nails
    app.hands = new ViewerHands(camera, { scale: 0.96, skin: '#c99b80', nail: '#bf8f7c', sleeve: '#5a3a48', cuff: '#4a2f3b', watch: false, sleeveLen: 1.1, sleeveFit: 0.74,
      poses: MD_HAND_POSES, blends: MD_HAND_BLEND });
    app.puffs = new BillboardSystem(scene, 900, false);
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    const ch = document.createElement('div'); ch.className = 'md-chyron'; ch.style.opacity = '0'; document.getElementById('hud').appendChild(ch); app.chyron = ch;
    app.audio = new MdAudio(app.tl, app);
    FILM._v = { a: new THREE.Vector3(), b: new THREE.Vector3(), f: new THREE.Vector3(), n: new THREE.Vector3() };
  },

  update(app, t) {
    const cam = app.camera, V = FILM._v;
    // the train carries you: script positions are train-local
    app.train.update(t);
    cam.position.z += mdNoseZ(t);
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
    if (D || shot) { app.hands.right.g.visible = false; app.hands.left.g.visible = false; }
    // the world
    app.env.update(t);
    app.ship.update(t);
    app.bridge.update(t);
    app.cast.update(t);
    app.road.update(t);
    this._water(app, t);
    this._focus(app, t, D);
    this._fx(app, t);
    this._chyron(app, t, shot);
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
      if (typeof T === 'function') T(t, tg); else if (T.l) mdLocal(t, T.l[0], T.l[1], T.l[2], tg); else tg.set(...T.w);
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
    const u = t - D.t0, x = D.pos[0] + D.drift[0] * u, y = D.pos[1] + D.drift[1] * u, z = D.pos[2] + D.drift[2] * u;
    const dx = D.at[0] - x, dy = D.at[1] - y, dz = D.at[2] - z;
    // the big hits shake even the outside camera a little
    const sh = 0.004 * (MathX.impulse(t, MD_FALL.tLand, 0.6) + (MD_FALL_B.tWater ? MathX.impulse(t, MD_FALL_B.tWater, 0.8) : 0));
    return { x, y, z, yaw: Math.atan2(-dx, -dz) + sh * Math.sin(t * 41), pitch: Math.atan2(dy, Math.hypot(dx, dz)) + sh * Math.sin(t * 53), fov: D.fov };
  },

  // the right hand on the door-bay pole; both hands on the cab door's frame
  _aimHands(app, t) {
    const cam = app.camera, V = FILM._v;
    // pole (train-local x 0, z 6.1): grip at chest height, fingers wrapping round it from your side
    mdLocal(t, 0.0 + 0.03, 1.28, MD_CAR.doors[0] + 0.04, V.a);
    V.f.set(-0.3, -0.1, -1); V.n.set(-1, 0, 0.2);
    mdAimHand('poleR', cam, V.a, V.f, V.n, 1);
    // the cab door's frame: one hand each side, fingers curling round the edge toward the cab
    const F = app.train.doorFrame;
    for (const [name, side] of [['doorR', 1], ['doorL', -1]]) {
      mdLocal(t, side * (F.x[1] + 0.02), 1.36 + (side > 0 ? -0.06 : 0), F.z + 0.05, V.a);
      V.f.set(-side * 0.25, 0.05, -1); V.n.set(-side, 0, 0.15);
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
  },

  // the sun's shadow box: around you in the car; around the pier and the bow outside
  _focus(app, t, D) {
    const cam = app.camera, f = FILM._v.f;
    if (D) { app.env.focus(10, 14, -42, 95); return; }
    cam.getWorldDirection(f);
    const far = t > MD.cab - 0.5 || (t > MD.harbour && t < MD.montage[0]) || (t > MD.back && t < MD.cab) ? 1 : 0;
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
        const al = 0.75 * Math.min(1, ds / 0.1) * Math.exp(-ds / 1.8);
        P.push(x, y + h3 * 2, z, 2.4 + ds * 2.2 + 2 * h3, h1 * 6, al, 0.98, 0.95, 0.97, 0.98);
      }
    }
    P.end();
  },

  // MEANWHILE · where we are
  _chyron(app, t, shot) {
    const ch = app.chyron;
    if (!shot) { if (ch._o !== 0) { ch.style.opacity = '0'; ch._o = 0; } return; }
    const id = shot === app.montage.cockpit ? 'cockpit' : shot === app.montage.fire ? 'fire' : 'ward';
    const t0 = id === 'cockpit' ? MD.cockpit : id === 'fire' ? MD.fire : MD.ward, t1 = id === 'cockpit' ? MD.fire : id === 'fire' ? MD.ward : MD.montage[1];
    if (ch._id !== id) { const L = MD_MONTAGE_LABEL[id]; ch.innerHTML = `<span class="mw">MEANWHILE</span><span class="mt">${L[0]}</span><span class="mr">${L[1]}</span>`; ch._id = id; }
    const k = StoryHUD.win(t, t0, t1, 0.12, 0.15); ch.style.opacity = k.toFixed(3); ch._o = k;
  },

  grade(t, p) {
    const T = MD;
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
    // the closing minutes tighten the frame as the bow comes in
    const close = MathX.smooth(t, T.turn, T.hit) * (1 - MathX.smooth(t, T.hit, T.hit + 0.2));
    p.vignette += 0.35 * close; p.tunnelDark = 0.2 * close;
    // the impact: a hit of chroma, no whiteout
    p.flash = 0.25 * MathX.impulse(t, T.hit, 0.06);
    p.chroma += 0.007 * MathX.impulse(t, T.hit, 0.35);
    // the end line: the colour drains a little; black at the very end
    const end = MathX.smooth(t, T.line[0] - 0.5, T.line[0] + 1.5);
    p.saturation -= 0.1 * end; p.exposure -= 0.06 * end;
    p.fade = MathX.smooth(t, T.end - 0.7, T.end);
  },

  debug(app, t) {
    const b = mdShipBow(t);
    return `train ${mdTrainKmh(t)} km/h · nose z ${mdNoseZ(t).toFixed(1)} · stop ${MD.stop.toFixed(2)} s<br>bow ${b[0].toFixed(1)}, ${b[1].toFixed(1)} · gap ${mdShipGap(t).toFixed(1)} m · span land ${MD_FALL.tLand.toFixed(2)} water ${(MD_FALL_B.tWater || 0).toFixed(2)}`;
  },
};
