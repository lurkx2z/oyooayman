/* =====================================================================
   FILM — "What weed-induced depersonalization can feel like"
   The film-specific half of the engine (see js/main.js): builds the flat,
   the friends, your first-person hands and legs, the HUD and the sound,
   and drives the "detachment" grade: colour drains, the picture flattens,
   edges soften, the vignette closes in and focus breathes — all subtle.
   ===================================================================== */

// first-person hands (an adult's, grey hoodie sleeves). Poses are in camera space (wrist p, finger direction F, palm normal N);
// poses with `aim` are re-aimed every frame so a point in the hand lands on a point in the world (Fw / Nw: world directions).
const DP_HAND_POSES = {
  restThigh: { p: [0.1, -0.5, -0.3], F: [0, 0, -1], N: [0, -1, 0], Fw: [0, -0.22, -1], Nw: [0.05, -1, 0.18], curl: [0.32, 0.38, 0.44, 0.5], thumb: [0.42, 0.3], aim: [0, 0.06, 0.022] },
  // (relaxed thumbs: they sit at the base of the palm, never sticking out sideways)
  palmUp:    { p: [0.1, -0.17, -0.42], F: [-0.35, 0.55, -0.75], N: [0.2, 0.75, 0.6], curl: [0.3, 0.35, 0.42, 0.5], thumb: [0.45, 0.3] },
  palmUpL:   { p: [0.11, -0.18, -0.43], F: [-0.3, 0.5, -0.8], N: [0.25, 0.72, 0.6], curl: [0.4, 0.46, 0.52, 0.6], thumb: [0.4, 0.38] },
  palmDown:  { p: [0.1, -0.15, -0.44], F: [-0.3, 0.45, -0.85], N: [0.05, -0.85, -0.5], curl: [0.25, 0.3, 0.35, 0.4], thumb: [0.4, 0.25] },
  flexIn:    { p: [0.1, -0.152, -0.435], F: [-0.3, 0.43, -0.85], N: [0.05, -0.85, -0.5], curl: [0.85, 0.95, 1.0, 1.05], thumb: [0.32, 0.65] },
  flexInL:   { p: [0.105, -0.155, -0.44], F: [-0.28, 0.42, -0.86], N: [0.05, -0.85, -0.5], curl: [0.7, 0.9, 1.05, 1.1], thumb: [0.3, 0.6] },
  flexOut:   { p: [0.1, -0.15, -0.44], F: [-0.3, 0.47, -0.85], N: [0.05, -0.85, -0.5], curl: [0.12, 0.18, 0.24, 0.3], thumb: [0.5, 0.12] },
  // "they just don't feel like yours": the hands seem to drift away from you while they keep flexing
  farIn:     { p: [0.13, -0.17, -0.6], F: [-0.3, 0.43, -0.85], N: [0.05, -0.85, -0.5], curl: [0.85, 0.95, 1.0, 1.05], thumb: [0.32, 0.65] },
  farInL:    { p: [0.135, -0.175, -0.61], F: [-0.28, 0.42, -0.86], N: [0.05, -0.85, -0.5], curl: [0.7, 0.9, 1.05, 1.1], thumb: [0.3, 0.6] },
  farOut:    { p: [0.13, -0.165, -0.61], F: [-0.3, 0.47, -0.85], N: [0.05, -0.85, -0.5], curl: [0.12, 0.18, 0.24, 0.3], thumb: [0.5, 0.12] },
};
DP_HAND_POSES.restThighL = Object.assign({}, DP_HAND_POSES.restThigh, { p: DP_HAND_POSES.restThigh.p.slice() });   // the left hand's own copy
const DP_HAND_BLEND = { restThigh: 0.5, restThighL: 0.5, palmUp: 0.75, palmDown: 0.85, flexIn: 0.6, flexInL: 0.7, flexOut: 0.6, farIn: 0.65, farInL: 0.7, farOut: 0.75, palmUpL: 0.85, hidden: 0.5 };

const _dpAim = { y: new THREE.Vector3(), z: new THREE.Vector3(), x: new THREE.Vector3(), c: new THREE.Vector3(), q: new THREE.Quaternion() };
function dpAimHand(name, camera, world, side = 1, scale = 1) {
  const P = DP_HAND_POSES[name], A = _dpAim;
  A.q.copy(camera.quaternion).invert();
  if (P.Fw) { A.y.set(...P.Fw).normalize().applyQuaternion(A.q); A.y.x *= side; P.F = [A.y.x, A.y.y, A.y.z]; }
  if (P.Nw) { A.z.set(...P.Nw).normalize().applyQuaternion(A.q); A.z.x *= side; P.N = [A.z.x, A.z.y, A.z.z]; }
  A.y.set(...P.F).normalize();
  A.z.set(...P.N); A.z.addScaledVector(A.y, -A.z.dot(A.y)).normalize();
  A.x.crossVectors(A.y, A.z);
  A.c.copy(world).applyMatrix4(camera.matrixWorldInverse);
  A.c.x *= side;                          // the left hand's poses are written as right-hand poses and mirrored
  const l = P.aim;
  for (let i = 0; i < 3; i++) P.p[i] = A.c.getComponent(i) - (A.x.getComponent(i) * l[0] + A.y.getComponent(i) * l[1] + A.z.getComponent(i) * l[2]) * scale;
}

const FILM = {
  build(app) {
    const { scene, camera, renderer } = app;
    FILM._app = app;
    camera.near = 0.03; camera.updateProjectionMatrix();
    app.apt = new Apartment(scene);
    app.apt.build();
    app.hemi = new THREE.HemisphereLight('#a8acc0', '#4a3a2e', 0.34); scene.add(app.hemi);
    app.hands = new ViewerHands(camera, { scale: 1.0, skin: '#c99a7c', nail: '#dcbcae', sleeve: '#5f6267', cuff: '#54575c', watch: false, poses: DP_HAND_POSES, blends: DP_HAND_BLEND });
    // the friends, each on their own clock (see DP_WARP in cast.js)
    app.kids = new ChildrenSystem(scene);
    for (const p of app.kids.people) {
      const w = DP_WARP[p.spec.id];
      if (w) { const up = p.update.bind(p); p.update = (t) => up(w(t)); }
    }
    // Mia's phone, in her right hand, screen glowing
    const mia = app.kids.byId.mia;
    if (mia) {
      const ph = new THREE.Group();
      ph.add(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.008, 0.145), new THREE.MeshStandardMaterial({ color: '#1c1d20', roughness: 0.4 })));
      const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.064, 0.136), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.75, 0.8, 0.95) })); sc.rotation.x = -Math.PI / 2; sc.position.y = 0.0045; ph.add(sc);
      ph.position.set(0, -0.07, 0.05); ph.rotation.set(-1.1, 0, 0); mia.j.ra.hand.add(ph);
      app.miaGlow = new THREE.PointLight('#c8d4ff', 0.35, 1.0, 1.6); sc.add(app.miaGlow); app.miaGlow.position.set(0, 0.0, 0.1);
    }
    // Jay: a can in his hand on the armrest
    const jay = app.kids.byId.jay;
    if (jay) { const cn = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.12, 14), new THREE.MeshStandardMaterial({ color: '#2f7a5a', roughness: 0.35, metalness: 0.7 })); cn.position.set(0, -0.08, 0.035); jay.j.la.hand.add(cn); }
    // a last breath of smoke drifting from Jay at the start (the evening is implied, never featured)
    app.smoke = new BillboardSystem(scene, 64, false);
    // the shared material rule: matte rooms, controlled highlights on metal and glass
    const skip = new Set(); camera.traverse((o) => skip.add(o));
    scene.traverse((o) => { if (o.isMesh && !skip.has(o)) for (const m of [].concat(o.material)) if (m && m.isMeshStandardMaterial && !/person/.test(o.parent && o.parent.name || '')) Look.surface(m, false); });
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    app.audio = new DPAudio(app.tl, app.kids, app);
  },

  update(app, t, tl) {
    app.camera.updateMatrixWorld();
    // your hands rest on your thighs until you lift them
    dpAimHand('restThigh', app.camera, app.apt.thighSpot(1, _dpAim.c.clone()), 1);
    dpAimHand('restThighL', app.camera, app.apt.thighSpot(-1, _dpAim.c.clone()), -1);
    app.hands.update(t);
    app.apt.update(t, app.camera);
    app.kids.update(t, true);
    app.scene.environmentIntensity = 0.1;
    // the smoke: a few soft puffs leaving his mouth just before the film starts, rising and thinning
    const S = app.smoke; S.begin(app.scene.fog);
    if (t < 2.2 && app.kids.byId.jay) {
      const head = app.kids.byId.jay.worldOf('head', _dpAim.x), fx = 0.669, fz = 0.743;     // (Jay faces you)
      for (let i = 0; i < 12; i++) {
        const born = -0.7 + i * 0.07, age = t - born;
        if (age < 0 || age > 2.0) continue;
        const k = age / 2.0, h = hash1(i * 7.3), d = 0.16 + 0.2 * age, j = (h - 0.5) * 0.12 * age;
        S.push(head.x + fx * d - fz * j, head.y - 0.035 + 0.2 * age + 0.03 * Math.sin(age * 3 + i), head.z + fz * d + fx * j,
          0.05 + 0.26 * k, h * 6, 0.11 * (1 - k) * (1 - k) * Math.min(1, age * 5), 0.85, 0.82, 0.84, 0.88);
      }
    }
    S.end();
  },

  grade(t, p) {
    const dp = SCRIPT_TRACKS.dp.value(t);
    p.flash = 0; p.fade = 0;            // no fade-in: the first frame is the thumbnail
    p.ao = 0.4;                         // gentle contact shading (no halos round the hands)
    p.exposure = 1.3 + 0.05 * dp;
    p.saturation = 1.1 - 0.45 * dp;                // colour drains…
    p.warmth = 0.08 - 0.32 * dp;                   // …and cools: the lamp light stops feeling warm
    p.contrast = 1.08 - 0.12 * dp;                 // the picture flattens, "behind glass"
    p.blackLift = 0.008 + 0.05 * dp;               // filmy, lifted blacks rather than a dark smear
    p.vignette = 1.0 + 0.25 * dp;
    p.soft = 0.06 + 0.07 * dp + 0.05 * dp * (0.5 + 0.5 * Math.sin(t * 1.15));   // focus breathes
    p.edgeBlur = 0.3 * dp; p.tunnel = 1.3; p.tunnelSoft = 0.6; p.tunnelDark = 0;
    p.chroma = 0.004 * dp; p.grain = 0.022; p.bloom = 0.26;
    // the picture trailing behind your head turns for a moment (lag seconds × how fast the view is moving)
    const app = FILM._app, lag = SCRIPT_TRACKS.lag.value(t);
    if (app && lag > 0) {
      const C = app.cam, dt = 1 / 30, vf = C.tfov.value(t);
      const hfov = 2 * Math.atan(Math.tan(MathX.deg(vf) / 2) * 9 / 16) * 180 / Math.PI;
      const yr = (C.tyaw.value(t) - C.tyaw.value(t - dt)) / dt, pr = (C.tpitch.value(t) - C.tpitch.value(t - dt)) / dt;
      p.smear.set(MathX.clamp(yr / hfov * lag, -0.12, 0.12), MathX.clamp(-pr / vf * lag, -0.12, 0.12));
    } else p.smear.set(0, 0);
  },

  debug(app, t) { return `dp ${SCRIPT_TRACKS.dp.value(t).toFixed(2)} · people ${app.kids.people.length}`; },
};
