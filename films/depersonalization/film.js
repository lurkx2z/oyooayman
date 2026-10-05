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
Object.assign(DP_HAND_POSES, {
  // the mirror: raise your right hand, palm to the glass; then touch your face with the left
  raiseHand: { p: [0.15, -0.07, -0.38], F: [-0.05, 1, 0.12], N: [0.05, 0.08, -1], curl: [0.12, 0.12, 0.16, 0.2], thumb: [0.45, 0.1] },
  touchFace: { p: [0.075, -0.11, -0.21], F: [-0.25, 0.85, 0.45], N: [-0.95, 0.15, 0.25], curl: [0.3, 0.35, 0.4, 0.45], thumb: [0.4, 0.2] },
  // the phone in your right hand, screen toward you
  phone:     { p: [0.06, -0.16, -0.33], F: [-0.9, 0.22, -0.18], N: [0.02, 0.28, 1], curl: [0.62, 0.68, 0.72, 0.78], thumb: [0.95, 0.42] },
  // trembling hands while you check them
  palmUpT:   { p: [0.1, -0.17, -0.42], F: [-0.35, 0.55, -0.75], N: [0.2, 0.75, 0.6], curl: [0.3, 0.35, 0.42, 0.5], thumb: [0.45, 0.3], trem: 0.006 },
  palmUpTL:  { p: [0.11, -0.18, -0.43], F: [-0.3, 0.5, -0.8], N: [0.25, 0.72, 0.6], curl: [0.4, 0.46, 0.52, 0.6], thumb: [0.4, 0.38], trem: 0.006 },
  palmDownT: { p: [0.1, -0.15, -0.44], F: [-0.3, 0.45, -0.85], N: [0.05, -0.85, -0.5], curl: [0.25, 0.3, 0.35, 0.4], thumb: [0.4, 0.25], trem: 0.006 },
  // aimed every frame: a hand on your chest, a palm on the door frame, both hands gripping the counter edge
  chest:     { p: [0.03, -0.36, -0.12], F: [0, 1, 0], N: [0, 0, 1], Fw: [0, 1, 0], Nw: [0, 0, 1], curl: [0.25, 0.3, 0.35, 0.4], thumb: [0.4, 0.2], aim: [0, 0.06, 0.02], trem: 0.003 },
  wallTouch: { p: [0.2, -0.1, -0.4], F: [0, 1, 0], N: [1, 0, 0], Fw: [0, 1, 0.1], Nw: [1, 0, 0], curl: [0.15, 0.18, 0.22, 0.26], thumb: [0.5, 0.1], aim: [0, 0.06, 0.02] },
  gripR:     { p: [0.15, -0.4, -0.35], F: [0, 0, -1], N: [0, -1, 0], Fw: [0, -0.45, -1], Nw: [0, -1, 0.3], curl: [0.95, 1.0, 1.05, 1.1], thumb: [0.35, 0.5], aim: [0, 0.07, 0.02], trem: 0.004 },
  gripL:     { p: [0.15, -0.4, -0.35], F: [0, 0, -1], N: [0, -1, 0], Fw: [0, -0.45, -1], Nw: [0, -1, 0.3], curl: [0.9, 1.0, 1.08, 1.1], thumb: [0.35, 0.5], aim: [0, 0.07, 0.02], trem: 0.004 },
});
const DP_HAND_BLEND = { raiseHand: 0.6, touchFace: 0.55, phone: 0.4, palmUpT: 0.5, palmUpTL: 0.6, palmDownT: 0.5, chest: 0.5, wallTouch: 0.6, gripR: 0.25, gripL: 0.3, restThigh: 0.5, restThighL: 0.5, palmUp: 0.75, palmDown: 0.85, flexIn: 0.6, flexInL: 0.7, flexOut: 0.6, farIn: 0.65, farInL: 0.7, farOut: 0.75, palmUpL: 0.85, hidden: 0.5 };

// snap variants for cuts: 'name!' is the same pose with no blend
for (const k of Object.keys(DP_HAND_POSES)) { DP_HAND_POSES[k + '!'] = DP_HAND_POSES[k]; DP_HAND_BLEND[k + '!'] = 0.02; }
DP_HAND_POSES['hidden!'] = HAND_POSES.hidden; DP_HAND_BLEND['hidden!'] = 0.02;
// which hand pose is active (name, previous name, blend) — for props that ride in a hand and for your reflection
function dpHandAt(which, t) {
  const S = SCRIPT.hands[which]; let i = 0;
  while (i + 1 < S.length && S[i + 1][0] <= t) i++;
  const cur = S[i][1], prev = i > 0 ? S[i - 1][1] : cur, b = DP_HAND_BLEND[cur] || 0.35;
  return { cur: cur.replace('!', ''), prev: prev.replace('!', ''), w: i > 0 ? Ease.inOutSine(MathX.clamp((t - S[i][0]) / b, 0, 1)) : 1 };
}

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
    // the friends, each on their own clock (DP_SLOW / warpOf in script.js)
    app.kids = new ChildrenSystem(scene);
    for (const p of app.kids.people) {
      if (DP_SLOW[p.spec.id]) { const up = p.update.bind(p), id = p.spec.id; p.update = (t) => up(warpOf(id, t)); }
    }
    // your first-person hands never appear in reflections (layer 2); your body appears ONLY in reflections (layer 1)
    camera.layers.enable(2);
    app.hands.root.traverse((o) => o.layers.set(2));
    app.self = new Child({ id: 'self', look: 'self' }, scene);
    app.self.root.traverse((o) => { o.layers.set(1); if (o.isMesh) o.castShadow = false; });
    app.self.root.visible = false;
    // the bathroom mirror
    const MR = app.apt.mirrorRect;
    app.mirror = new Mirror(MR.w, MR.h, { resolution: 720, tint: '#e2e6e8' });
    app.mirror.mesh.position.set(MR.x + 0.006, MR.y, MR.z); app.mirror.mesh.rotation.y = Math.PI / 2;
    scene.add(app.mirror.mesh);
    // the phone in your right hand (lock screen: it is 11:47 and it stays 11:47)
    app.phone = this._phone(app.hands);
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

  _phone(hands) {
    const ph = new THREE.Group();
    ph.add(new THREE.Mesh(new THREE.RoundedBoxGeometry(0.072, 0.152, 0.0085, 3, 0.008), new THREE.MeshStandardMaterial({ color: '#3a3e46', roughness: 0.4, metalness: 0.3 })));
    const cv = Tex.canvas(270, 576), c = cv.getContext('2d');
    const bg = c.createLinearGradient(0, 0, 270, 576); bg.addColorStop(0, '#1d2a4a'); bg.addColorStop(1, '#3a2048'); c.fillStyle = bg; c.fillRect(0, 0, 270, 576);
    const gl = c.createRadialGradient(80, 420, 10, 80, 420, 260); gl.addColorStop(0, 'rgba(90,140,200,0.5)'); gl.addColorStop(1, 'rgba(90,140,200,0)'); c.fillStyle = gl; c.fillRect(0, 0, 270, 576);
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ffffff';
    c.font = '600 72px Inter, Arial, sans-serif'; c.fillText('11:47', 135, 130);
    c.font = '500 17px Inter, Arial, sans-serif'; c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillText('Saturday, 12 October', 135, 182);
    c.fillStyle = 'rgba(245,245,250,0.82)'; c.beginPath(); c.roundRect(14, 230, 242, 60, 14); c.fill();
    c.fillStyle = '#34c759'; c.beginPath(); c.roundRect(24, 242, 36, 36, 9); c.fill();
    c.textAlign = 'left'; c.fillStyle = '#1c1c1e'; c.font = '600 14px Inter, Arial, sans-serif'; c.fillText('Group chat', 70, 252);
    c.fillStyle = '#3a3a3c'; c.font = '400 13px Inter, Arial, sans-serif'; c.fillText('lol where did you go', 70, 272);
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.1446), new THREE.MeshBasicMaterial({ map: Tex.tex(cv, { repeat: false }), name: 'phoneScreen' }));
    sc.position.z = 0.0044; ph.add(sc);
    const glow = new THREE.PointLight('#cfe0ff', 0.2, 0.9, 1.5); glow.position.set(0, 0, 0.12); ph.add(glow);
    ph.position.set(0.034, 0.074, 0.024); ph.rotation.set(0, 0, -Math.PI / 2); ph.scale.setScalar(1 / hands.o.scale);
    hands.right.g.add(ph);
    ph.traverse((o) => o.layers.set(2));
    ph.visible = false;
    return ph;
  },

  update(app, t, tl) {
    app.camera.updateMatrixWorld();
    // your hands rest on your thighs until you lift them; later: a palm on the door frame, both hands on the counter, a hand on your chest
    const V = (x, y, z) => new THREE.Vector3(x, y, z), cam = app.camera;
    dpAimHand('restThigh', cam, app.apt.thighSpot(1, V()), 1);
    dpAimHand('restThighL', cam, app.apt.thighSpot(-1, V()), -1);
    dpAimHand('wallTouch', cam, V(APT.living.x0 - 0.075, 1.32, APT.door.z1 + 0.0), 1);
    const K = app.apt.kitchen;
    dpAimHand('gripR', cam, V(POS.counter[0] + 0.21, K.top - 0.005, K.z + 0.31), 1);
    dpAimHand('gripL', cam, V(POS.counter[0] - 0.21, K.top - 0.005, K.z + 0.31), -1);
    { const y = cam.rotation.y, f = V(-Math.sin(y), 0, -Math.cos(y)), r = V(Math.cos(y), 0, -Math.sin(y));
      const P = DP_HAND_POSES.chest; P.Nw = [-f.x, -0.2, -f.z]; P.Fw = [-r.x * 0.7, 0.7, -r.z * 0.7];
      dpAimHand('chest', cam, V(cam.position.x + f.x * 0.16 + r.x * 0.04, cam.position.y - 0.42, cam.position.z + f.z * 0.16 + r.z * 0.04), 1); }
    app.hands.update(t);
    { const R = dpHandAt('right', t); app.phone.visible = R.cur === 'phone' || (R.prev === 'phone' && R.w < 0.5); }
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
    // the bathroom: your reflection (a body that exists only in the mirror, posed like you), and the mirror itself
    const inBath = cam.position.x < APT.hall.x0 + 0.1;
    app.self.root.visible = inBath; app.mirror.mesh.visible = true;
    if (inBath) { this._poseSelf(app, t); app.mirror.render(app.renderer, app.scene, cam); }
  },

  // your reflection: stands where you stand, faces where you face, its head follows your gaze, its arms follow your hands
  _poseSelf(app, t) {
    const cam = app.camera, me = app.self, y = cam.rotation.y, pitch = cam.rotation.x;
    me.root.position.set(cam.position.x + Math.sin(y) * 0.07, 0.1, cam.position.z + Math.cos(y) * 0.07);   // (eyes level with yours; the counter hides the feet)
    me.root.rotation.y = y + Math.PI;
    const P = basePose();
    P.neck = MathX.clamp(-pitch, -0.5, 0.6); P.spine = 0.02 + 0.01 * Math.sin(t * 1.4);
    const arm = (name, side) => name === 'raiseHand' && side > 0 ? { sh: [1.45, 0.5], el: 1.8 } : name === 'touchFace' && side < 0 ? { sh: [1.2, -0.25], el: 2.35 } : { sh: [0.06, 0.08], el: 0.2 };
    for (const [which, side] of [['right', 1], ['left', -1]]) {
      const H = dpHandAt(which, t), a = arm(H.prev, side), b = arm(H.cur, side), k = H.w;
      const sh = [MathX.lerp(a.sh[0], b.sh[0], k), MathX.lerp(a.sh[1], b.sh[1], k)], el = MathX.lerp(a.el, b.el, k);
      if (side > 0) { P.rSh = sh; P.rEl = el; } else { P.lSh = sh; P.lEl = el; }
    }
    me.apply(P);
    me.root.updateMatrixWorld(true);
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
    const panic = SCRIPT_TRACKS.panic.value(t);
    p.vignette += 0.45 * panic;
    p.edgeBlur = 0.3 * dp + 0.15 * panic; p.tunnel = 1.3 - 0.35 * panic; p.tunnelSoft = 0.6; p.tunnelDark = 0.3 * panic;
    p.fade = SCRIPT_TRACKS.dim.value(t);
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
