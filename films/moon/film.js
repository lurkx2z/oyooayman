/* =====================================================================
   FILM — "What if the Moon crashed into Earth?"
   Builds the Moon and the sky, the coastal city, the sea, the people and
   the HUD; each frame maps film time onto the story clock, places the Moon,
   raises and lowers the sea, shakes the ground, lights the world by the
   Moon, and grades the picture.
   ===================================================================== */

// your hands (left-hand poses are written as right-hand poses and mirrored); aimed poses are re-aimed every frame
const MN_HAND_POSES = {
  railL:  { p: [0.2, -0.3, -0.4], F: [0, 0, -1], N: [0, -1, 0], curl: [1.15, 1.2, 1.25, 1.25], thumb: [0.2, 0.7], aim: [0, 0.06, 0.03] },
  railR:  { p: [0.2, -0.3, -0.4], F: [0, 0, -1], N: [0, -1, 0], curl: [1.1, 1.18, 1.22, 1.25], thumb: [0.2, 0.7], aim: [0, 0.06, 0.03] },
  pointR: { p: [0.09, -0.15, -0.42], F: [0, 0.3, -1], N: [0, -1, 0], curl: [0.02, 1.35, 1.4, 1.4], thumb: [0.35, 0.65] },
  pushL:  { p: [0.24, -0.52, -0.42], F: [0.1, -0.35, -0.93], N: [0.15, -0.95, 0.1], curl: [0.25, 0.3, 0.35, 0.4], thumb: [0.45, 0.2] },
  pushR:  { p: [0.25, -0.5, -0.44], F: [0.08, -0.3, -0.95], N: [0.15, -0.95, 0.1], curl: [0.2, 0.28, 0.33, 0.38], thumb: [0.45, 0.2] },
  balL:   { p: [0.36, -0.32, -0.36], F: [0.7, 0.05, -0.7], N: [0.05, -1, 0], curl: [0.35, 0.4, 0.45, 0.5], thumb: [0.4, 0.3] },
  balR:   { p: [0.37, -0.3, -0.37], F: [0.7, 0.05, -0.7], N: [0.05, -1, 0], curl: [0.3, 0.38, 0.43, 0.48], thumb: [0.4, 0.3] },
  shieldL:{ p: [0.13, -0.08, -0.3], F: [-0.25, 0.96, -0.1], N: [0.1, 0.1, -1], curl: [0.15, 0.18, 0.22, 0.28], thumb: [0.4, 0.15] },
  shieldR:{ p: [0.12, -0.02, -0.28], F: [-0.2, 0.97, -0.12], N: [0.1, 0.1, -1], curl: [0.12, 0.16, 0.2, 0.25], thumb: [0.4, 0.15] },
};
const MN_HAND_BLEND = { railL: 0.5, railR: 0.5, pointR: 0.45, pushL: 0.4, pushR: 0.4, balL: 0.3, balR: 0.3, shieldL: 0.35, shieldR: 0.3, hidden: 0.5 };
const _mnAim = { y: new THREE.Vector3(), z: new THREE.Vector3(), x: new THREE.Vector3(), c: new THREE.Vector3(), q: new THREE.Quaternion() };
function mnAimHand(name, camera, world, Fw, Nw, side = 1) {
  const P = MN_HAND_POSES[name], A = _mnAim;
  A.q.copy(camera.quaternion).invert();
  A.y.copy(Fw).normalize().applyQuaternion(A.q); A.y.x *= side; P.F = [A.y.x, A.y.y, A.y.z];
  A.z.copy(Nw).normalize().applyQuaternion(A.q); A.z.x *= side; P.N = [A.z.x, A.z.y, A.z.z];
  if (!world) return;
  A.y.set(...P.F).normalize(); A.z.set(...P.N); A.z.addScaledVector(A.y, -A.z.dot(A.y)).normalize(); A.x.crossVectors(A.y, A.z);
  A.c.copy(world).applyMatrix4(camera.matrixWorldInverse); A.c.x *= side;
  const l = P.aim; for (let i = 0; i < 3; i++) P.p[i] = A.c.getComponent(i) - (A.x.getComponent(i) * l[0] + A.y.getComponent(i) * l[1] + A.z.getComponent(i) * l[2]);
}

const FILM = {
  build(app) {
    const { scene, camera } = app;
    FILM._app = app;
    camera.near = 0.05; camera.far = 24000; camera.updateProjectionMatrix();
    scene.fog = new THREE.FogExp2('#0d1420', 0.00018);
    app.moonSky = new MoonSky(app);
    // light: a little sky fill, the Moon (a directional key whose strength grows with its size), the city's warm bounce
    app.hemi = new THREE.HemisphereLight('#3b4f78', '#120f0c', 0.35); scene.add(app.hemi);
    app.moonLight = new THREE.DirectionalLight('#c9d6ee', 0.2);
    app.moonLight.castShadow = true;
    const sc = app.moonLight.shadow.camera; sc.left = -40; sc.right = 40; sc.top = 40; sc.bottom = -40; sc.near = 1; sc.far = 400;
    app.moonLight.shadow.mapSize.set(CONFIG.render.shadowMapSize, CONFIG.render.shadowMapSize); app.moonLight.shadow.bias = -0.0005;
    scene.add(app.moonLight); scene.add(app.moonLight.target);
    if (typeof MnWorld !== 'undefined') { app.world = new MnWorld(app); app.fx = new MnFx(app, app.world); }
    else {
      const g = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#202428' }));
      g.position.set(0, 2, 1000); scene.add(g);
    }
    app.hands = new ViewerHands(camera, { scale: 1.04, skin: '#c9997a', nail: '#dcbcae', sleeve: '#2b3038', cuff: '#20242b', watch: true, sleeveLen: 1.1, sleeveFit: 0.8, poses: MN_HAND_POSES, blends: MN_HAND_BLEND });
    camera.layers.enable(2); for (const h of [app.hands.left, app.hands.right]) h.g.traverse((o) => o.layers.set(2));   // (never in the water's reflection)
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; d.style.opacity = '0'; document.getElementById('hud').appendChild(d); return d; };
    app.rewindText = mk('mn-rewind', '24 HOURS EARLIER');
    app.endCard = mk('mn-end', '<div class="a">EARTH WOULD NOT SURVIVE<br>A LITERAL MOON IMPACT.</div><div class="b">TIMELINE DRAMATICALLY ACCELERATED FOR THIS SIMULATION.</div>');
    app.audio = typeof MnAudio !== 'undefined' ? new MnAudio(app.tl, app) : new AudioEngine(app.tl);
  },

  // the Moon's place in your sky for story time S
  moonAt(S, out) {
    const e = MathX.deg(MN_MOON_C.elev(S)), a = MathX.deg(MN_MOON_C.az(S));
    return out.set(-Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e));
  },

  update(app, t, tl) {
    let S = mnStory(t); const cam = app.camera, M = app.moonSky;
    // (look-dev: window.MN_LOOK = { S, yaw, pitch, fov, x, y, z } overrides the story time and the camera)
    const LK = window.MN_LOOK;
    if (LK) {
      if (LK.S !== undefined) S = LK.S;
      if (LK.x !== undefined) cam.position.set(LK.x, LK.y, LK.z);
      if (LK.yaw !== undefined) cam.rotation.set(MathX.deg(LK.pitch), MathX.deg(LK.yaw), 0, 'YXZ');
      if (LK.fov) { cam.fov = LK.fov; cam.updateProjectionMatrix(); }
    }
    app.S = S;
    // the ground shakes: noise on the camera, growing with the tremor
    const q = (mnQuake(S) + 1.6 * MathX.smooth(S, MN.impact + 0.2, MN.impact + 1.0)) * (t < MN.black ? 1 : 0);
    if (q > 0.001) {
      const D = MathX.deg, k = q * q;
      cam.rotation.x += noise1(t * 23, 51) * D(0.7) * k; cam.rotation.y += noise1(t * 19, 52) * D(0.6) * k; cam.rotation.z += noise1(t * 21, 53) * D(0.9) * k;
      cam.position.y += noise1(t * 25, 54) * 0.03 * k;
    }
    if (app.world && app.world.groundAt) cam.position.y += app.world.groundAt(cam.position.x, cam.position.z);
    cam.updateMatrixWorld(true);
    // the Moon
    this.moonAt(S, M.dir);
    M.distKm = mnDist(S);
    M.radius = Math.asin(Math.min(0.999, MOON_R_KM / M.obsKm()));
    M.roll = MathX.deg(MN_MOON_C.roll(S)); M.face = [MN_MOON_C.faceLat(S), MN_MOON_C.faceLon(S)];
    // the impact's light comes from just below the Moon's lower limb, on the horizon
    M.flash = MathX.smooth(S, MN.impact - 0.1, MN.impact + 0.6) * 4.0;
    M.flashDir = (M.flashDir || new THREE.Vector3()).set(M.dir.x, 0, M.dir.z).normalize().setY(-0.03).normalize();
    M.update(t, cam);
    // moonlight on the world: from the Moon's direction, its strength from its lit area; the sky fills in with it
    const il = M.illum(), ml = MathX.clamp(Math.log10(1 + il) / 4, 0, 1);
    const fl = MathX.smooth(S, MN.impact, MN.impact + 0.8);
    app.moonLight.intensity = 0.12 + 2.4 * ml * ml + 30 * fl; app.moonLight.color.setRGB(0.79 + 0.21 * fl, 0.84 - 0.04 * fl, 0.93 - 0.3 * fl);
    app.moonLight.position.copy(cam.position).addScaledVector(M.dir, 200); app.moonLight.target.position.copy(cam.position); app.moonLight.target.updateMatrixWorld();
    app.hemi.intensity = 0.3 + 0.9 * ml * ml + 6 * fl; app.hemi.color.setRGB(0.22 + 0.35 * ml, 0.3 + 0.38 * ml, 0.47 + 0.4 * ml);
    M.skyMat.uniforms.uMoonLight.value = ml * ml * ml * 0.6;
    M.moonMat.uniforms.uHaze.value.set(0.05, 0.075, 0.12).multiplyScalar(ml * ml * ml * 0.6 * 0.5);   // (the lit air in front of the Moon)
    M.starMat.uniforms.uFade.value = 1 - 0.85 * ml;
    M.moonMat.uniforms.uBright.value = 2.2;
    if (app.world) {
      app.world.update(t, S);
      app.fx.update(t, S, cam);
      app.world.water.U.uLight.value.setRGB(0.05 + 0.5 * ml * ml, 0.06 + 0.55 * ml * ml, 0.09 + 0.6 * ml * ml);
      app.world.water.render(app.renderer, app.scene, cam);
    }
    this._hands(app, t, S);
    this._overlays(app, t);
  },

  _hands(app, t, S) {
    const cam = app.camera, V = FILM._hv || (FILM._hv = { w: new THREE.Vector3(), f: new THREE.Vector3(), n: new THREE.Vector3() });
    for (const [name, side, dx] of [['railL', -1, -0.27], ['railR', 1, 0.29]]) {
      V.w.set(cam.position.x + dx, MN_CITY.quayY + 1.05, MN_CITY.quayZ + 0.37); V.f.set(0, -0.35, -1); V.n.set(0, -1, 0.25);
      mnAimHand(name, cam, V.w, V.f, V.n, side);
    }
    V.n.set(0, -1, 0); mnAimHand('pointR', cam, null, app.moonSky.dir, V.n, 1);
    app.hands.update(t);
    for (const h of [app.hands.right, app.hands.left]) { const p = h.g.position; if (p.z > -0.08 || Math.abs(p.x) > -p.z * 1.3 || p.y < p.z * 1.8) h.g.visible = false; }
  },

  _overlays(app, t) {
    app.rewindText.style.opacity = StoryHUD.win(t, 4.45, 6.7, 0.2, 0.45).toFixed(3);
    app.endCard.style.opacity = StoryHUD.win(t, 76.7, 80.2, 0.5, 0.01).toFixed(3);
  },

  grade(t, p) {
    const S = mnStory(t), app = FILM._app;
    p.flash = 0; p.fade = 0; p.chroma = 0; p.ao = 0.4;
    p.exposure = 1.15; p.saturation = 1.08; p.contrast = 1.1; p.warmth = -0.03; p.blackLift = 0.01;
    p.vignette = 0.4; p.soft = 0.01; p.bloom = 0.3; p.bloomThreshold = 0.9; p.grain = 0.03;
    p.tunnel = 1.25; p.tunnelSoft = 0.5; p.tunnelDark = 0; p.edgeBlur = 0;
    // the rewind: a fast smear and a little colour fringing
    const rw = StoryHUD.win(t, MN.rewind[0], MN.rewind[1], 0.15, 0.35);
    p.chroma = 0.6 * rw; p.edgeBlur = 0.6 * rw;
    if (app && app.cam) {
      const C = app.cam, dt = 1 / 30, vf = C.tfov.value(t), hfov = 2 * Math.atan(Math.tan(MathX.deg(vf) / 2) * 9 / 16) * 180 / Math.PI;
      const yr = (C.tyaw.value(t) - C.tyaw.value(t - dt)) / dt, pr = (C.tpitch.value(t) - C.tpitch.value(t - dt)) / dt;
      p.smear.set(MathX.clamp(yr / hfov * 0.006, -0.02, 0.02), MathX.clamp(-pr / vf * 0.006, -0.02, 0.02) + 0.02 * rw);
    }
    // the impact: light floods in, the image burns out, then black
    const k = MathX.smooth(t, MN.impact, MN.impact + 1.1);
    p.exposure += 6 * k; p.bloom += 1.5 * k; p.flash = MathX.smooth(t, MN.impact + 0.7, MN.impact + 1.5) * (1 - MathX.smooth(t, MN.black - 0.05, MN.black));
    p.flashColor.setRGB(1.0, 0.96, 0.9);
    p.fade = t >= MN.black ? 1 : 0;
  },

  debug(app, t) { const S = mnStory(t), M = app.moonSky; return `story ${S.toFixed(2)} · ${mnHours(S).toFixed(1)} h · ${mnFmt(mnKm(S))} km · radius ${(M.radius * 57.3).toFixed(2)}° · sea ${mnSea(S).toFixed(2)} m`; },
};
