/* =====================================================================
   FILM — "What if friction disappeared for 60 seconds?"
   The film-specific half of the engine (see js/main.js): runs the slide
   simulation once, builds the city, the traffic, the cast, the props,
   your hands and the sound, then each frame puts the camera where the
   simulation says you are and poses everything for time t.
   ===================================================================== */

// first-person hands (an adult's, denim-jacket sleeves). Poses are in camera space (wrist p, finger direction F,
// palm normal N); poses with `aim` are re-aimed every frame so a point in the palm lands on a point in the world.
const FR_HAND_POSES = {
  // the phone in your left hand, screen toward you (left-hand poses are written as right-hand poses and mirrored)
  phoneL:   { p: [0.1, -0.265, -0.37], F: [-0.85, 0.38, -0.3], N: [0.0, 0.36, 1], curl: [0.95, 0.9, 0.88, 0.9], thumb: [0.95, 0.4] },
  // the slip: hands thrown up and out, fingers spread
  flailL:   { p: [0.25, -0.02, -0.33], F: [0.35, 1, -0.15], N: [-0.2, 0.1, -1], curl: [0.08, 0.06, 0.1, 0.14], thumb: [0.7, 0.05] },
  flailR:   { p: [0.27, 0.0, -0.34], F: [0.4, 1, -0.2], N: [-0.15, 0.1, -1], curl: [0.1, 0.08, 0.1, 0.12], thumb: [0.7, 0.05] },
  // arms out for balance (hands low in the corners, palms down)
  balanceL: { p: [0.27, -0.26, -0.38], F: [0.55, 0.25, -0.8], N: [0.05, -1, 0.15], curl: [0.18, 0.2, 0.25, 0.3], thumb: [0.5, 0.12] },
  balanceR: { p: [0.28, -0.25, -0.37], F: [0.55, 0.28, -0.8], N: [0.05, -1, 0.15], curl: [0.2, 0.22, 0.25, 0.3], thumb: [0.5, 0.12] },
  // reaching for the pole, then gripping it (aimed at the pole every frame)
  reachL:   { p: [0.2, -0.1, -0.45], F: [0, 0, -1], N: [1, 0, 0], curl: [0.3, 0.32, 0.36, 0.4], thumb: [0.55, 0.15], aim: [0, 0.05, 0.03] },
  gripL:    { p: [0.2, -0.1, -0.45], F: [0, 0, -1], N: [1, 0, 0], curl: [1.25, 1.3, 1.3, 1.3], thumb: [0.15, 0.7], aim: [0, 0.05, 0.03], trem: 0.0022 },
  gripR:    { p: [0.2, -0.2, -0.45], F: [0, 0, -1], N: [1, 0, 0], curl: [1.25, 1.3, 1.35, 1.35], thumb: [0.15, 0.7], aim: [0, 0.05, 0.03], trem: 0.0022 },
};
const FR_HAND_BLEND = { phoneL: 0.4, flailL: 0.12, flailR: 0.14, balanceL: 0.35, balanceR: 0.35, reachL: 0.5, gripL: 0.12, gripR: 0.35 };
for (const k of Object.keys(FR_HAND_POSES)) { FR_HAND_POSES[k + '!'] = FR_HAND_POSES[k]; FR_HAND_BLEND[k + '!'] = 0.02; }

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

const FILM = {
  build(app) {
    const { scene, camera, renderer } = app;
    FILM._app = app;
    camera.near = 0.03; camera.far = 2600; camera.updateProjectionMatrix();
    // the physics, once (≈ 4 s)
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
    // the shared material treatment, with a lighter hand on the grime (a clean, sunny street)
    { const skip = new Set(); camera.traverse((o) => skip.add(o));
      scene.traverse((o) => {
        if (!o.isMesh || skip.has(o)) return;
        let q = o, person = false, veh = false; while (q) { if (q.name && q.name.startsWith('person:')) person = true; if (q.name && q.name.startsWith('veh:')) veh = true; q = q.parent; }
        if (person) return;
        for (const m of [].concat(o.material)) if (m && m.isMeshStandardMaterial && m.userData.grime === undefined && m.onBeforeCompile === THREE.Material.prototype.onBeforeCompile) { Look.surface(m, veh); if (!/glass/i.test(m.name || '')) Look.grime(m, veh ? 0.3 : 0.5); }
      }); }
    // you
    app.hands = new ViewerHands(camera, { scale: 1.0, skin: '#c99a7c', nail: '#dcbcae', sleeve: '#3d5a7a', cuff: '#33496a', watch: true, poses: FR_HAND_POSES, blends: FR_HAND_BLEND });
    app.phone = this._phone(app.hands);
    // effects: exhaust and dust puffs, glass glints
    app.puffs = new BillboardSystem(scene, 400, false);
    app.glints = new StreakSystem(scene, 400);
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    app.audio = new FRAudio(app.tl, app);
    // the big hits between cars (for glass and dust)
    app.hits = app.world.events.filter((e) => e.dv > 3 && app.traffic.byId[e.a] && (e.b === null || app.traffic.byId[e.b]));
  },

  _phone(hands) {
    const ph = new THREE.Group();
    ph.add(new THREE.Mesh(new THREE.RoundedBoxGeometry(0.072, 0.152, 0.0085, 3, 0.008), new THREE.MeshStandardMaterial({ color: '#22252b', roughness: 0.35, metalness: 0.4 })));
    const cv = Tex.canvas(270, 576), c = cv.getContext('2d');
    const bg = c.createLinearGradient(0, 0, 0, 576); bg.addColorStop(0, '#f5f2ea'); bg.addColorStop(1, '#e6e1d6'); c.fillStyle = bg; c.fillRect(0, 0, 270, 576);
    // a map app: your blue dot walking toward the junction
    c.strokeStyle = '#ffffff'; c.lineWidth = 34; c.beginPath(); c.moveTo(135, 600); c.lineTo(135, -20); c.moveTo(-20, 210); c.lineTo(300, 210); c.stroke();
    c.strokeStyle = '#d8d2c4'; c.lineWidth = 2; c.strokeRect(10, 10, 250, 556);
    c.fillStyle = '#4285f4'; c.beginPath(); c.arc(150, 380, 12, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 4; c.stroke();
    c.fillStyle = '#202124'; c.font = '600 22px Inter, Arial, sans-serif'; c.fillText('4 min · 300 m', 20, 520);
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.1446), new THREE.MeshBasicMaterial({ map: Tex.tex(cv, { repeat: false }) }));
    sc.position.z = 0.0044; ph.add(sc);
    ph.position.set(0.034, 0.074, 0.024); ph.rotation.set(0, 0, -Math.PI / 2); ph.scale.setScalar(1 / hands.o.scale);
    hands.left.g.add(ph);
    return ph;
  },

  update(app, t, tl) {
    const cam = app.camera, W = app.world;
    // you: after 3.0 s your body goes where the simulation takes it (the camera track only holds the walk)
    const me = W.sample('me', t, FILM._me || (FILM._me = {}));
    if (t > FR.tLoss) { cam.position.x += me.x - FR_CAM.x; cam.position.z += me.z - FR_CAM.z3; }
    cam.updateMatrixWorld(true);
    this._aimHands(app, t);
    app.hands.update(t);
    this._handVisibility(app);
    app.phone.visible = t < 3.04;
    app.city.update(t);
    app.traffic.update(t);
    app.cast.update(t);
    app.props.update(t);
    this._fx(app, t);
  },

  // both hands on the pole in a handshake grip: thumbs up, palms facing sideways, fingers pointing at the pole and wrapping
  // round it, forearms coming back toward you; the right hand below the left. They slip down when you try to step.
  _aimHands(app, t) {
    const cam = app.camera, P = FR_POLE, V = FILM._v || (FILM._v = { up: new THREE.Vector3(0, 1, 0), f: new THREE.Vector3(), n: new THREE.Vector3(), w: new THREE.Vector3() });
    const dx = P.x - cam.position.x, dz = P.z - cam.position.z, d = Math.hypot(dx, dz) || 1, fx = dx / d, fz = dz / d;   // toward the pole
    const rx = -fz, rz = fx, r = 0.05;                                                                                        // right of that line
    const slip = MathX.smooth(t, 6.3, 6.75) * (1 - MathX.smooth(t, 7.0, 7.6)) * 0.26;
    const reach = 1 - MathX.smooth(t, 4.55, 5.15);
    for (const [name, side, y] of [['gripL', -1, 1.42], ['reachL', -1, 1.45], ['gripR', 1, 1.14]]) {
      const back = name === 'reachL' ? 0.12 * reach : 0;
      V.w.set(P.x + rx * side * (r + 0.025) - fx * back, 0.15 + y - slip, P.z + rz * side * (r + 0.025) - fz * back);
      V.f.set(fx, -0.12, fz);                          // fingers toward the pole, a little down
      V.n.set(-rx * side, 0, -rz * side);              // palm faces the pole from its side
      frAimHand(name, cam, V.w, V.f, V.n, side);
    }
  },

  // a hand whose wrist is far outside the picture (you looked away from the pole) is simply not drawn
  _handVisibility(app) {
    for (const h of [app.hands.right, app.hands.left]) {
      const p = h.g.position;
      if (p.z > -0.12 || Math.abs(p.x) > -p.z * 1.05 || p.y > -p.z * 1.3) h.g.visible = false;
    }
  },

  _fx(app, t) {
    const P = app.puffs, G = app.glints, W = app.world, s = {};
    P.begin(app.scene.fog); G.begin();
    // exhaust from the stuck car while it's floored
    for (const c of app.traffic.cars) {
      if (!c.o.actions || c.parked) continue;
      W.sample(c.id, t, s);
      const ex = c.v.exhaust, cy = Math.cos(s.yaw), sy = Math.sin(s.yaw);
      const wx = s.x - sy * ex.x + cy * ex.z, wz = s.z - cy * ex.x - sy * ex.z, wy = FrGround.h(s.x, s.z) + ex.y;
      for (let i = 0; i < 40; i++) {
        const born = Math.floor(t * 8 - i) / 8, age = t - born;
        if (age < 0 || age > 1.6) continue;
        let gas = 0; for (const k of c.actions) if (k[0] <= born) gas = k[1] === 'gas' ? 1 : 0;
        if (!gas || born < FR.tLoss) continue;
        const h = hash1(Math.floor(born * 8) * 13 + c.id.length * 7);
        P.push(wx + sy * age * 0.9 + (h - 0.5) * 0.3 * age, wy + 0.05 + age * 0.35, wz + cy * age * 0.9, 0.18 + age * 0.55, h * 6, 0.22 * (1 - age / 1.6), 0.55, 0.85, 0.86, 0.88);
      }
    }
    // car hits: a puff of road dust and a spray of glass glints
    for (const e of app.hits) {
      const age = t - e.t;
      if (age < 0 || age > 1.4) continue;
      const k = Math.min(1, e.dv / 8), y0 = FrGround.road(e.z);
      for (let i = 0; i < 6; i++) { const h = hash1(i * 7 + Math.floor(e.t * 100)); P.push(e.x + (h - 0.5) * 1.2, y0 + 0.4 + age * 0.4, e.z + (hash1(i * 3 + 1) - 0.5) * 1.2, 0.6 + age * 1.6 * k, h * 6, 0.3 * k * (1 - age / 1.4), 0.75, 0.86, 0.82, 0.76); }
      for (let i = 0; i < 26; i++) {
        const h1 = hash1(i * 11 + Math.floor(e.t * 97)), h2 = hash1(i * 17 + 3), h3 = hash1(i * 5 + 9);
        const a = h1 * Math.PI * 2, sp = (1.5 + 3.5 * h2) * k, vy = 1.5 + 2.5 * h3, tt = Math.min(age, 0.9);
        const x = e.x + Math.cos(a) * sp * tt, z = e.z + Math.sin(a) * sp * tt, y = Math.max(y0 + 0.02, y0 + 0.9 + vy * tt - 4.9 * tt * tt);
        const tw = 0.5 + 0.5 * Math.sin(age * 40 + i);
        G.push(x, y, z, x + Math.cos(a) * 0.04, y + 0.02, z + Math.sin(a) * 0.04, 1, 1, 1, 0.8 * tw * (1 - age / 1.4), 0.012);
      }
    }
    P.end(); G.end();
  },

  grade(t, p) {
    p.flash = 0; p.fade = 0;
    p.ao = 0.55;
    p.exposure = 1.22; p.saturation = 1.14; p.contrast = 1.08; p.warmth = 0.07; p.blackLift = 0.004;
    p.vignette = 0.85; p.soft = 0.02; p.bloom = 0.24; p.bloomThreshold = 1.4; p.grain = 0.02;
    p.tunnel = 1.25; p.tunnelSoft = 0.5; p.tunnelDark = 0; p.edgeBlur = 0;
    // the instant friction goes: a jolt of chroma; whip pans drag a little (camera-lag trail)
    p.chroma = 0.006 * MathX.impulse(t, 3.0, 0.25) + 0.004 * MathX.impulse(t, 5.2, 0.2);
    const app = FILM._app;
    if (app && app.cam) {
      const C = app.cam, dt = 1 / 30, vf = C.tfov.value(t);
      const hfov = 2 * Math.atan(Math.tan(MathX.deg(vf) / 2) * 9 / 16) * 180 / Math.PI;
      const yr = (C.tyaw.value(t) - C.tyaw.value(t - dt)) / dt, pr = (C.tpitch.value(t) - C.tpitch.value(t - dt)) / dt;
      p.smear.set(MathX.clamp(yr / hfov * 0.02, -0.06, 0.06), MathX.clamp(-pr / vf * 0.02, -0.06, 0.06));
    }
  },

  debug(app, t) { const s = app.world.sample('me', t); return `you ${s.x.toFixed(2)}, ${s.z.toFixed(2)} · contacts ${app.world.events.length}`; },
};
