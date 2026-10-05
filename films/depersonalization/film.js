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
  restThigh: { p: [0.1, -0.5, -0.3], F: [0, 0, -1], N: [0, -1, 0], Fw: [0, -0.22, -1], Nw: [0.05, -1, 0.18], curl: [0.32, 0.38, 0.44, 0.5], thumb: [0.7, 0.25], aim: [0, 0.06, 0.022] },
  palmUp:    { p: [0.1, -0.17, -0.42], F: [-0.35, 0.55, -0.75], N: [0.2, 0.75, 0.6], curl: [0.3, 0.35, 0.42, 0.5], thumb: [0.9, 0.25] },
  palmDown:  { p: [0.1, -0.15, -0.44], F: [-0.3, 0.45, -0.85], N: [0.05, -0.85, -0.5], curl: [0.25, 0.3, 0.35, 0.4], thumb: [0.85, 0.15] },
  flexIn:    { p: [0.1, -0.152, -0.435], F: [-0.3, 0.43, -0.85], N: [0.05, -0.85, -0.5], curl: [1.0, 1.1, 1.15, 1.2], thumb: [0.55, 0.85] },
  flexOut:   { p: [0.1, -0.15, -0.44], F: [-0.3, 0.47, -0.85], N: [0.05, -0.85, -0.5], curl: [0.12, 0.18, 0.24, 0.3], thumb: [1.0, 0.05] },
  // "they just don't feel like yours": the hands seem to drift away from you while they keep flexing
  farIn:     { p: [0.13, -0.17, -0.6], F: [-0.3, 0.43, -0.85], N: [0.05, -0.85, -0.5], curl: [1.0, 1.1, 1.15, 1.2], thumb: [0.55, 0.85] },
  farOut:    { p: [0.13, -0.165, -0.61], F: [-0.3, 0.47, -0.85], N: [0.05, -0.85, -0.5], curl: [0.12, 0.18, 0.24, 0.3], thumb: [1.0, 0.05] },
};
DP_HAND_POSES.restThighL = Object.assign({}, DP_HAND_POSES.restThigh, { p: DP_HAND_POSES.restThigh.p.slice() });   // the left hand's own copy
const DP_HAND_BLEND = { restThigh: 0.5, restThighL: 0.5, palmUp: 0.75, palmDown: 0.85, flexIn: 0.55, flexOut: 0.55, farIn: 0.6, farOut: 0.7, hidden: 0.5 };

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
      app.miaGlow = new THREE.PointLight('#c8d4ff', 0.25, 0.9, 1.6); sc.add(app.miaGlow); app.miaGlow.position.set(0, 0.0, 0.1);
    }
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
  },

  grade(t, p) {
    const dp = SCRIPT_TRACKS.dp.value(t);
    p.flash = 0; p.fade = 0;            // no fade-in: the first frame is the thumbnail
    p.exposure = 1.32 - 0.06 * dp;
    p.saturation = 1.12 - 0.42 * dp;               // colour drains
    p.contrast = 1.08 - 0.1 * dp;                  // the picture flattens ("too flat")
    p.warmth = 0.1 - 0.16 * dp;                    // the lamp light stops feeling warm
    p.vignette = 1.05 + 0.55 * dp;
    p.soft = 0.08 + 0.1 * dp + 0.06 * dp * (0.5 + 0.5 * Math.sin(t * 1.15));   // focus breathes
    p.edgeBlur = 0.6 * dp; p.tunnel = 1.2 - 0.3 * dp; p.tunnelSoft = 0.6; p.tunnelDark = 0.22 * dp;
    p.chroma = 0.0025 * dp; p.grain = 0.02; p.bloom = 0.28;
  },

  debug(app, t) { return `dp ${SCRIPT_TRACKS.dp.value(t).toFixed(2)} · people ${app.kids.people.length}`; },
};
