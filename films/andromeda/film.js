/* =====================================================================
   FILM — "What if Andromeda collided with the Milky Way overnight?"
   Builds the merger simulation, the sky, the lookout and town, the people,
   your hands and the HUD; each frame maps the night onto the simulation,
   points your eyes, lights the world by the sky, and grades the picture.
   ===================================================================== */

// your hands (left-hand poses are written as right-hand poses and mirrored). Aimed poses are re-aimed every frame.
const AM_HAND_POSES = {
  railL:  { p: [0.2, -0.3, -0.4], F: [0, 0, -1], N: [0, -1, 0], curl: [1.15, 1.2, 1.25, 1.25], thumb: [0.2, 0.7], aim: [0, 0.06, 0.03] },
  railR:  { p: [0.2, -0.3, -0.4], F: [0, 0, -1], N: [0, -1, 0], curl: [1.1, 1.18, 1.22, 1.25], thumb: [0.2, 0.7], aim: [0, 0.06, 0.03] },
  pointR: { p: [0.08, -0.15, -0.42], F: [0, 0.3, -1], N: [0, -1, 0], curl: [0.02, 1.35, 1.4, 1.4], thumb: [0.35, 0.65] },
  shieldR:{ p: [0.17, 0.21, -0.36], F: [-0.92, 0.12, -0.36], N: [0.05, -0.97, 0.22], curl: [0.18, 0.16, 0.2, 0.26], thumb: [0.45, 0.25] },
  phoneL: { p: [0.07, -0.14, -0.4], F: [-0.45, 0.8, -0.4], N: [0.05, 0.4, 0.92], curl: [1.05, 1.12, 1.18, 1.22], thumb: [0.25, 0.25] },
  aweL:   { p: [0.15, -0.33, -0.44], F: [-0.18, 0.2, -0.96], N: [0.1, 0.96, 0.22], curl: [0.38, 0.44, 0.5, 0.58], thumb: [0.55, 0.2] },
  aweR:   { p: [0.15, -0.32, -0.45], F: [-0.16, 0.22, -0.96], N: [0.1, 0.96, 0.22], curl: [0.34, 0.4, 0.46, 0.54], thumb: [0.55, 0.2] },
};
const AM_HAND_BLEND = { railL: 0.5, railR: 0.5, pointR: 0.45, shieldR: 0.35, phoneL: 0.55, aweL: 0.8, aweR: 0.8, hidden: 0.6 };
const _amAim = { y: new THREE.Vector3(), z: new THREE.Vector3(), x: new THREE.Vector3(), c: new THREE.Vector3(), q: new THREE.Quaternion() };
function amAimHand(name, camera, world, Fw, Nw, side = 1) {
  const P = AM_HAND_POSES[name], A = _amAim;
  A.q.copy(camera.quaternion).invert();
  A.y.copy(Fw).normalize().applyQuaternion(A.q); A.y.x *= side; P.F = [A.y.x, A.y.y, A.y.z];
  A.z.copy(Nw).normalize().applyQuaternion(A.q); A.z.x *= side; P.N = [A.z.x, A.z.y, A.z.z];
  if (!world) return;
  A.y.set(...P.F).normalize(); A.z.set(...P.N); A.z.addScaledVector(A.y, -A.z.dot(A.y)).normalize(); A.x.crossVectors(A.y, A.z);
  A.c.copy(world).applyMatrix4(camera.matrixWorldInverse); A.c.x *= side;
  const l = P.aim; for (let i = 0; i < 3; i++) P.p[i] = A.c.getComponent(i) - (A.x.getComponent(i) * l[0] + A.y.getComponent(i) * l[1] + A.z.getComponent(i) * l[2]);
}

// how bright the sky lights the world (0 = moonlight only)
const AM_SKYLIGHT = new Track([[0, 0.04], [12, 0.1], [20, 0.2], [29, 0.32], [39, 0.5], [44, 0.62], [49, 0.48], [55, 0.3], [57, 0.24], [61, 0.3], [65, 0.55], [70, 0.8], [75, 0.9], [80, 0.85]], 'inOutSine');

const FILM = {
  build(app) {
    const { scene, camera, renderer } = app;
    FILM._app = app;
    camera.near = 0.03; camera.far = 9000; camera.updateProjectionMatrix();
    scene.fog = new THREE.FogExp2('#1c2536', 0.00026);
    app.sim = new MergerSim().build();
    app.sky = new AmSky(app, app.sim);
    app.ov = new Overlook(scene, app.rng);
    app.cast = new AmCast(scene);
    // light: moonlight from the south-west (shadows), the sky's own light, the lookout lamp
    app.hemi = new THREE.HemisphereLight('#3a4c70', '#0e1014', 0.4); scene.add(app.hemi);
    app.moon = new THREE.DirectionalLight('#9fb4dc', 0.55);
    app.moon.position.set(-60, 26, 50); app.moon.castShadow = true;
    const sc = app.moon.shadow.camera; sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22; sc.near = 1; sc.far = 200; app.moon.shadow.mapSize.set(CONFIG.render.shadowMapSize, CONFIG.render.shadowMapSize); app.moon.shadow.bias = -0.0006;
    scene.add(app.moon); scene.add(app.moon.target);
    app.galLight = new THREE.DirectionalLight('#ffe9cc', 0); scene.add(app.galLight); scene.add(app.galLight.target);
    app.lamp = new THREE.PointLight('#ffcf94', 6, 16, 1.6); app.lamp.position.set(...app.ov.lampPos); scene.add(app.lamp);
    // you
    app.hands = new ViewerHands(camera, { scale: 1.04, skin: '#c9997a', nail: '#dcbcae', sleeve: '#2c3644', cuff: '#232b36', watch: true, sleeveLen: 1.1, sleeveFit: 0.8, poses: AM_HAND_POSES, blends: AM_HAND_BLEND });
    app.phone = this._phone(app);
    // HUD, the end card, sound
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; document.getElementById('hud').appendChild(d); return d; };
    app.card = mk('am-card', '<div class="row"><span class="k">REAL MERGER TIMESCALE</span><span class="v">BILLIONS OF YEARS</span></div><div class="row"><span class="k">OUR SIMULATION</span><span class="v">ONE NIGHT</span></div>');
    app.audio = new AmAudio(app.tl, app);
  },

  // the phone in your left hand, its screen showing the sky (the far-light render) under a recording overlay
  _phone(app) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.RoundedBoxGeometry(0.074, 0.156, 0.009, 3, 0.008), new THREE.MeshStandardMaterial({ color: '#202328', roughness: 0.35, metalness: 0.4 })));
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.068, 0.148), new THREE.MeshBasicMaterial({ map: app.sky.farRT.texture, toneMapped: false, fog: false }));
    scr.position.z = 0.0048; g.add(scr);
    const cv = Tex.canvas(136, 296), c = cv.getContext('2d');
    c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 2; c.strokeRect(10, 40, 116, 200);
    c.fillStyle = '#ff3b30'; c.beginPath(); c.arc(68, 270, 13, 0, 7); c.fill(); c.fillStyle = '#fff'; c.font = 'bold 15px sans-serif'; c.fillText('● REC 0:07', 10, 26);
    const ui = new THREE.Mesh(new THREE.PlaneGeometry(0.068, 0.148), new THREE.MeshBasicMaterial({ map: Tex.tex(cv, { repeat: false }), transparent: true, toneMapped: false, fog: false }));
    ui.position.z = 0.0052; g.add(ui);
    g.position.set(0.0, 0.07, 0.024); g.scale.setScalar(1 / app.hands.o.scale);
    app.hands.left.g.add(g);
    return g;
  },

  _skyDir(app, which, st, out) {
    const sim = app.sim, o = sim.observer(st), R = app.sky.R;
    const dir = (g) => { const c = sim.centre(g, st); return new THREE.Vector3(c[0] - o[0], c[1] - o[1], c[2] - o[2]).applyMatrix3(R).normalize(); };
    if (which === 'm31') out.copy(dir(1)); else if (which === 'gc') out.copy(dir(0)); else out.copy(dir(0)).add(dir(1)).normalize();
    return out;
  },

  update(app, t, tl) {
    const cam = app.camera, st = amSimT(t), sky = app.sky, K = AM_SKY_TRACKS;
    // the sky's settings for this moment of the night
    sky.band = K.band.value(t); sky.warp = K.warp.value(t); sky.mwNear = K.mwNear.value(t); sky.m31Near = K.m31Near.value(t); sky.arms = [K.armsMW.value(t), K.armsM31.value(t)]; sky.sf = K.sf.value(t); sky.dustAmp = K.dust.value(t);
    sky.gain = [K.gainMW.value(t) * Math.max(K.mwFar.value(t), 0.0001), K.gainM31.value(t)];
    sky.compMat.uniforms.uBulge && (sky.compMat.uniforms.uBulge.value = 1 - K.mwFar.value(t));
    // where your eyes go
    const L = AM_LOOK.find((l) => t >= l[0] && t < l[1]);
    if (L) {
      const w = MathX.smooth(t, L[0], L[0] + 0.6) * (1 - MathX.smooth(t, L[1] - 0.6, L[1])), d = FILM._d || (FILM._d = new THREE.Vector3());
      if (typeof L[2] === 'string') this._skyDir(app, L[2], st, d);
      else if (L[2].sky) { const a = MathX.deg(L[2].sky[0]), z = MathX.deg(L[2].sky[1]); d.set(-Math.sin(z) * Math.cos(a), Math.sin(a), -Math.cos(z) * Math.cos(a)); }
      else d.set(L[2].p[0] - cam.position.x, L[2].p[1] - cam.position.y, L[2].p[2] - cam.position.z).normalize();
      const off = (L[4] && L[4].off) || [0, 0];
      let yaw = Math.atan2(-d.x, -d.z) + MathX.deg(off[0]); const pitch = MathX.clamp(Math.asin(d.y) + MathX.deg(off[1]), MathX.deg(-25), MathX.deg(80));
      while (yaw - cam.rotation.y > Math.PI) yaw -= Math.PI * 2; while (yaw - cam.rotation.y < -Math.PI) yaw += Math.PI * 2;
      cam.rotation.y = MathX.lerp(cam.rotation.y, yaw, w); cam.rotation.x = MathX.lerp(cam.rotation.x, pitch, w);
      if (L[3]) { cam.fov = MathX.lerp(cam.fov, L[3], w); cam.updateProjectionMatrix(); }
    }
    cam.updateMatrixWorld(true);
    // the sky
    sky.update(t, st, cam);
    sky.render(cam);
    // the world lit by the sky: brighter, cooler-white fill; a warm key from the brightest core
    const sl = AM_SKYLIGHT.value(t);
    app.hemi.intensity = 0.36 + 0.3 * sl; app.hemi.color.setRGB(0.23 + 0.4 * sl, 0.3 + 0.36 * sl, 0.44 + 0.3 * sl);
    const kd = this._skyDir(app, t < 48 || (t > 59 && t < 65) ? 'm31' : 'gc', st, FILM._kd || (FILM._kd = new THREE.Vector3()));
    app.galLight.intensity = 0.5 * sl * MathX.smooth(kd.y, -0.05, 0.25);
    app.galLight.position.copy(cam.position).addScaledVector(kd, 100); app.galLight.target.position.copy(cam.position); app.galLight.target.updateMatrixWorld();
    sky.compMat.uniforms.uGlow.value.set(0.01, 0.012, 0.018).multiplyScalar(1 + 1.2 * sl);
    app.moon.target.position.set(cam.position.x, 0, cam.position.z); app.moon.position.set(cam.position.x - 60, 26, cam.position.z + 50); app.moon.target.updateMatrixWorld();
    // the world
    app.ov.update(t);
    app.ov.lightMat.uniforms.uPx.value = app.renderer.getDrawingBufferSize(FILM._sz || (FILM._sz = new THREE.Vector2())).y / 1920 * 2.0;
    app.cast.update(t);
    // your hands on the railing, pointing at the core
    this._aimHands(app, t, st);
    app.hands.update(t);
    this._handVisibility(app);
    app.phone.visible = t > 15.6 && t < 20.8;
    this._overlays(app, t);
  },

  _aimHands(app, t, st) {
    const cam = app.camera, V = FILM._v || (FILM._v = { w: new THREE.Vector3(), f: new THREE.Vector3(), n: new THREE.Vector3(), d: new THREE.Vector3() });
    // on the rail, a shoulder's width apart
    for (const [name, side, dx] of [['railL', -1, -0.27], ['railR', 1, 0.29]]) {
      V.w.set(cam.position.x + dx, 1.07, OV.railZ + 0.02);
      V.f.set(0, -0.35, -1); V.n.set(0, -1, 0.25);
      amAimHand(name, cam, V.w, V.f, V.n, side);
    }
    // pointing: the finger toward the core
    this._skyDir(app, 'm31', st, V.d); V.n.set(0, -1, 0);
    amAimHand('pointR', cam, null, V.d, V.n, 1);
  },

  _handVisibility(app) {
    for (const h of [app.hands.right, app.hands.left]) {
      const p = h.g.position;
      if (p.z > -0.08 || Math.abs(p.x) > -p.z * 1.2 || p.y > -p.z * 1.4 || p.y < p.z * 1.6) h.g.visible = false;
    }
  },

  _overlays(app, t) {
    const c = app.card, k = StoryHUD.win(t, 78.0, 80.0, 0.35, 0.35);
    c.style.opacity = k.toFixed(3);
  },

  grade(t, p) {
    p.flash = 0; p.fade = 0; p.chroma = 0;
    p.ao = 0.4;
    // night: a cool, contrasty grade; brighter and a touch warmer as the galaxies light the sky, then settling
    const sl = AM_SKYLIGHT.value(t);
    p.exposure = 1.25 - 0.28 * sl; p.saturation = 1.18; p.contrast = 1.1; p.warmth = -0.02 + 0.06 * sl; p.blackLift = 0.012;
    p.vignette = 0.42; p.soft = 0.01; p.bloom = 0.32; p.bloomThreshold = 0.95; p.grain = 0.025;
    p.tunnel = 1.25; p.tunnelSoft = 0.5; p.tunnelDark = 0; p.edgeBlur = 0;
    p.fade = MathX.smooth(t, 79.55, 80.0);
    const app = FILM._app;
    if (app && app.cam) {
      const C = app.cam, dt = 1 / 30, vf = C.tfov.value(t), hfov = 2 * Math.atan(Math.tan(MathX.deg(vf) / 2) * 9 / 16) * 180 / Math.PI;
      const yr = (C.tyaw.value(t) - C.tyaw.value(t - dt)) / dt, pr = (C.tpitch.value(t) - C.tpitch.value(t - dt)) / dt;
      p.smear.set(MathX.clamp(yr / hfov * 0.006, -0.02, 0.02), MathX.clamp(-pr / vf * 0.006, -0.02, 0.02));
    }
  },

  debug(app, t) { const st = amSimT(t); return `sim ${st.toFixed(3)} · separation ${app.sim.separation(st).toFixed(1)} kpc · progress ${amProgress(t)}%`; },
};
