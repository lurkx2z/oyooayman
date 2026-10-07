/* =====================================================================
   FILM — "What happens if you slip and fall?"
   Builds the wet avenue and the seafront (one scene), the underground and
   the fault (their own scenes), the planet; picks which one each moment
   shows (slSeg), poses your hands and legs, shakes the ground in the quake,
   renders the wet-street reflection, grades every segment and handles the
   cuts (a dip to black into the ground, white shocks out of it, the impact).
   ===================================================================== */

// your hands (left-hand poses are written as right-hand poses and mirrored); aimed poses are re-aimed every frame
const SL_HAND_POSES = {
  flailR: { p: [0.2, 0.02, -0.4], F: [0.2, 0.92, -0.3], N: [0.1, 0.25, -1], curl: [0.08, 0.1, 0.14, 0.2], thumb: [0.65, 0.08] },
  flailL: { p: [0.24, 0.1, -0.42], F: [0.3, 0.9, -0.25], N: [0.1, 0.2, -1], curl: [0.12, 0.14, 0.18, 0.24], thumb: [0.6, 0.1] },
  groundR: { p: [0.3, -0.5, -0.45], F: [0, -0.3, -1], N: [0, -1, 0], curl: [0.15, 0.12, 0.15, 0.2], thumb: [0.5, 0.15], aim: [0, 0.07, 0.035] },
  groundL: { p: [0.3, -0.5, -0.45], F: [0, -0.3, -1], N: [0, -1, 0], curl: [0.18, 0.15, 0.18, 0.22], thumb: [0.5, 0.15], aim: [0, 0.07, 0.035] },
  railR: { p: [0.2, -0.3, -0.4], F: [0, 0, -1], N: [0, -1, 0], curl: [1.1, 1.18, 1.22, 1.25], thumb: [0.2, 0.7], aim: [0, 0.06, 0.03] },
  railL: { p: [0.2, -0.3, -0.4], F: [0, 0, -1], N: [0, -1, 0], curl: [1.15, 1.2, 1.25, 1.25], thumb: [0.2, 0.7], aim: [0, 0.06, 0.03] },
  runR: { p: [0.2, -0.42, -0.34], F: [-0.25, 0.6, -0.75], N: [-0.9, 0, -0.3], curl: [1.2, 1.3, 1.35, 1.4], thumb: [0.3, 0.9] },
  runL: { p: [0.2, -0.42, -0.34], F: [-0.25, 0.6, -0.75], N: [-0.9, 0, -0.3], curl: [1.25, 1.32, 1.38, 1.4], thumb: [0.3, 0.9] },
  shieldR: { p: [0.12, -0.04, -0.3], F: [-0.25, 0.96, -0.1], N: [0.1, 0.1, -1], curl: [0.12, 0.16, 0.2, 0.25], thumb: [0.4, 0.15] },
  shieldL: { p: [0.14, -0.1, -0.32], F: [-0.25, 0.96, -0.1], N: [0.1, 0.1, -1], curl: [0.15, 0.18, 0.22, 0.28], thumb: [0.4, 0.15] },
};
const SL_HAND_BLEND = { flailR: 0.14, flailL: 0.16, groundR: 0.35, groundL: 0.35, railR: 0.4, railL: 0.4, runR: 0.25, runL: 0.25, shieldR: 0.25, shieldL: 0.25, hidden: 0.3 };
const _slAim = { y: new THREE.Vector3(), z: new THREE.Vector3(), x: new THREE.Vector3(), c: new THREE.Vector3(), q: new THREE.Quaternion() };
function slAimHand(name, camera, world, Fw, Nw, side = 1) {
  const P = SL_HAND_POSES[name], A = _slAim;
  A.q.copy(camera.quaternion).invert();
  A.y.copy(Fw).normalize().applyQuaternion(A.q); A.y.x *= side; P.F = [A.y.x, A.y.y, A.y.z];
  A.z.copy(Nw).normalize().applyQuaternion(A.q); A.z.x *= side; P.N = [A.z.x, A.z.y, A.z.z];
  if (!world) return;
  A.y.set(...P.F).normalize(); A.z.set(...P.N); A.z.addScaledVector(A.y, -A.z.dot(A.y)).normalize(); A.x.crossVectors(A.y, A.z);
  A.c.copy(world).applyMatrix4(camera.matrixWorldInverse); A.c.x *= side;
  const l = P.aim; for (let i = 0; i < 3; i++) P.p[i] = A.c.getComponent(i) - (A.x.getComponent(i) * l[0] + A.y.getComponent(i) * l[1] + A.z.getComponent(i) * l[2]);
}

// the quake's strength on your street (0..1)
const slQuake = slCurve([[0, 0], [24.5, 0], [24.6, 1.0], [25.4, 0.8], [26.4, 0.95], [27.6, 0.75], [28.8, 0.9], [30.2, 0.7], [31.6, 0.6], [32, 0.5]]);

const FILM = {
  build(app) {
    const { scene, camera } = app;
    FILM._app = app;
    camera.near = 0.04; camera.far = 9000; camera.updateProjectionMatrix();
    app.street = new SlStreet(scene, app.renderer, app.rng); app.street.camera = camera; app.street.build();
    if (typeof SlSea !== 'undefined') app.sea = new SlSea(app);
    if (typeof SlCast !== 'undefined') app.cast = new SlCast(scene);
    app.legs = new SlLegs(scene);
    app.under = new SlUnder(app);
    app.fault = new SlFault();
    if (typeof SlEarth !== 'undefined') app.globe = new SlEarth();
    app.hands = new ViewerHands(camera, { scale: 1.02, skin: '#c99a7c', nail: '#dcbcae', sleeve: '#2b3038', cuff: '#20242b', watch: true, sleeveLen: 1.1, sleeveFit: 0.85, poses: SL_HAND_POSES, blends: SL_HAND_BLEND });
    camera.layers.enable(2); for (const h of [app.hands.left, app.hands.right]) h.g.traverse((o) => o.layers.set(2));   // (never in the reflections)
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; document.getElementById('hud').appendChild(d); return d; };
    app.card = mk('sl-card', '<div class="k">CAUSE OF GLOBAL CATASTROPHE:</div><div class="v">SLIPPED ON WET SIDEWALK</div>');
    app.meta = mk('sl-meta', '<div class="m">yes. somehow it became a tsunami again.</div><div class="n">SATIRICAL SIMULATION · NO, SLIPPING CANNOT ACTUALLY CAUSE THIS.</div>');
    app.audio = typeof SlAudio !== 'undefined' ? new SlAudio(app.tl, app) : new AudioEngine(app.tl);
    app._Q = new THREE.Vector3();
  },

  view(app, t) {
    const s = slSeg(t);
    if (s === 'under') return [app.under.scene, app.under.camera];
    if (s === 'fault') return [app.fault.scene, app.fault.camera];
    if (s === 'earth' && app.globe) return [app.globe.scene, app.globe.camera];
    return [app.scene, app.camera];
  },

  update(app, t) {
    const seg = slSeg(t), cam = app.camera;
    app.scene.fog.density = seg === 'coast' ? 0.00042 : 0.0026;
    // (look-dev: window.SL_LOOK = { x, y, z, yaw, pitch, fov } overrides the street camera)
    const LK = window.SL_LOOK;
    if (LK) {
      if (LK.x !== undefined) cam.position.set(LK.x, LK.y, LK.z);
      if (LK.yaw !== undefined) cam.rotation.set(MathX.deg(LK.pitch), MathX.deg(LK.yaw), 0, 'YXZ');
      if (LK.fov) { cam.fov = LK.fov; cam.updateProjectionMatrix(); }
    }
    // the ground shakes: the camera (and you) ride it
    const q = seg === 'street' ? slQuake(t) : 0, Q = app._Q.set(0, 0, 0);
    if (q > 0.001) {
      const D = MathX.deg, k = q;
      Q.set(noise1(t * 9, 61) * 0.05 * k, noise1(t * 11, 62) * 0.03 * k, noise1(t * 8, 63) * 0.05 * k);
      cam.position.add(Q);
      cam.rotation.x += noise1(t * 19, 64) * D(2.2) * k; cam.rotation.y += noise1(t * 17, 65) * D(1.8) * k; cam.rotation.z += noise1(t * 21, 66) * D(2.6) * k;
    }
    cam.updateMatrixWorld(true);
    if (seg === 'street' || seg === 'coast') {
      app.street.update(t, cam, q, Q);
      if (app.sea) app.sea.update(t, cam);
      if (app.cast) app.cast.update(t, q);
      // the ring from your fall spreading through the puddle in front of you
      SL_WET_U.uSlRing.value.set(9.27, 1.47, 0.05 + Math.max(0, t - 6.2) * 0.42, 0.6 * MathX.smooth(t, 6.2, 6.5) * (t < SL.under ? 1 : 0));
      app.legs.update(app, t, t < 6.35);
      this._hands(app, t);
      app.street.renderMirror(app.renderer, cam);
    } else {
      app.legs.update(app, t, false);
      app.hands.update(t); app.hands.left.g.visible = app.hands.right.g.visible = false;
      if (seg === 'under') app.under.update(t);
      if (seg === 'fault') app.fault.update(t);
      if (seg === 'earth' && app.globe) app.globe.update(t);
    }
    this._overlays(app, t);
  },

  _hands(app, t) {
    const cam = app.camera, V = FILM._hv || (FILM._hv = { w: new THREE.Vector3(), f: new THREE.Vector3(), n: new THREE.Vector3(), e: new THREE.Euler() });
    // (the hands stay where your body is, facing down the street, wherever you turn your head)
    const fx = 0, fz = -1, rx = 1, rz = 0;
    // on the ground: beside your knees while you sit, under your shoulders on hands and knees (riding the quake)
    const gy = LAYOUT.curbH + 0.01, sit = t < SL.under, fwd = sit ? 0.5 : 0.18, wide = sit ? 0.36 : 0.27;
    for (const [name, side] of [['groundL', -1], ['groundR', 1]]) {
      V.w.set(cam.position.x + fx * fwd + rx * wide * side, gy, cam.position.z + fz * fwd + rz * wide * side).add(app._Q);
      V.f.set(fx + rx * 0.25 * side, 0, fz + rz * 0.25 * side); V.n.set(0, -1, 0);
      slAimHand(name, cam, V.w, V.f, V.n, side);
    }
    // the railing at the seafront
    for (const [name, side] of [['railL', -1], ['railR', 1]]) {
      V.w.set(cam.position.x + side * 0.3, LAYOUT.curbH + 1.08, SL_FRONT.wallZ + 0.22 + 0.04); V.f.set(0, -0.35, -1); V.n.set(0, -1, 0.25);
      slAimHand(name, cam, V.w, V.f, V.n, side);
    }
    // running: the arms pump with your stride
    const ph = app.cam.walked(t) / 1.6 * Math.PI;
    for (const [name, sgn] of [['runR', 1], ['runL', -1]]) { const P = SL_HAND_POSES[name], sw = Math.sin(ph) * sgn; P.p[1] = -0.44 + 0.1 * sw; P.p[2] = -0.32 - 0.1 * sw; }
    app.hands.update(t);
    for (const h of [app.hands.right, app.hands.left]) { const p = h.g.position; if (p.z > -0.08 || Math.abs(p.x) > -p.z * 1.3 || p.y < p.z * 1.9) h.g.visible = false; }
  },

  _overlays(app, t) {
    app.card.style.opacity = StoryHUD.win(t, SL.card[0], SL.end + 1, 0.5, 0.01).toFixed(3);
    app.meta.style.opacity = StoryHUD.win(t, SL.meta[0], SL.end + 1, 0.4, 0.01).toFixed(3);
  },

  grade(t, p) {
    const app = FILM._app, seg = slSeg(t);
    p.flash = 0; p.fade = 0; p.chroma = 0; p.ao = 0.45; p.edgeBlur = 0;
    p.exposure = 1.12; p.saturation = 0.86; p.contrast = 1.12; p.warmth = -0.05; p.blackLift = 0.012;
    p.vignette = 0.42; p.soft = 0.012; p.bloom = 0.32; p.bloomThreshold = 0.85; p.grain = 0.035;
    p.tunnel = 1.25; p.tunnelSoft = 0.5; p.tunnelDark = 0;
    p.flashColor.setRGB(1, 1, 1);
    if (seg === 'under' || seg === 'fault') { p.exposure = 1.0; p.saturation = 1.05; p.contrast = 1.16; p.warmth = -0.02; p.vignette = 0.6; p.bloom = 0.35; p.bloomThreshold = 0.75; }
    if (seg === 'earth') { p.exposure = 1.1; p.saturation = 1.0; p.contrast = 1.08; p.warmth = 0; p.vignette = 0.3; p.bloom = 0.4; p.grain = 0.025; }
    if (seg === 'coast') { p.saturation = 0.84; p.warmth = -0.06; }
    // the thud: the picture jolts dark for a moment
    p.exposure *= 1 - 0.35 * MathX.impulse(t, SL.thud, 0.12);
    // into the ground: dip to black and back
    p.fade = Math.max(MathX.smooth(t, SL.dive[1] - 0.18, SL.dive[1]) * (t < SL.under ? 1 : 0), (1 - MathX.smooth(t, SL.under, SL.under + 0.22)) * (t >= SL.under ? 1 : 0));
    // the pull-back out of the macro: a smear; the shocks out of the ground and out to the planet: white
    p.edgeBlur = 0.8 * StoryHUD.win(t, 16.95, 17.75, 0.3, 0.35) + 0.7 * StoryHUD.win(t, 31.7, 32.5, 0.25, 0.3) + 0.8 * StoryHUD.win(t, 38.7, 39.5, 0.3, 0.3);
    p.flash = 0.7 * MathX.impulse(t, SL.quake, 0.18) + 0.55 * MathX.impulse(t, SL.earth, 0.22) + 0.6 * MathX.impulse(t, SL.coast, 0.25) + 0.25 * MathX.impulse(t, SL.fault, 0.15);
    if (app && app.cam && (seg === 'street' || seg === 'coast')) {
      const C = app.cam, dt = 1 / 30, vf = C.tfov.value(t), hfov = 2 * Math.atan(Math.tan(MathX.deg(vf) / 2) * 9 / 16) * 180 / Math.PI;
      const yr = (C.tyaw.value(t) - C.tyaw.value(t - dt)) / dt, pr = (C.tpitch.value(t) - C.tpitch.value(t - dt)) / dt;
      p.smear.set(MathX.clamp(yr / hfov * 0.006, -0.02, 0.02), MathX.clamp(-pr / vf * 0.006, -0.02, 0.02));
    }
    // the impact: the whitewater takes the light, then black; the end card on black
    const k = MathX.smooth(t, SL.impact - 0.1, SL.impact + 0.5);
    if (t >= SL.impact - 0.2) { p.flash = Math.max(p.flash, 0.85 * k * (1 - MathX.smooth(t, SL.black - 0.3, SL.black))); p.flashColor.setRGB(0.78, 0.9, 0.92); }
    if (t >= SL.black) p.fade = 1;
  },

  debug(app, t) { return `seg ${slSeg(t)} · quake ${slQuake(t).toFixed(2)} · drain ${slDrain(t).toFixed(1)} m · wave z ${slWaveZ(t).toFixed(0)} h ${slWaveH(t).toFixed(0)}`; },
};
