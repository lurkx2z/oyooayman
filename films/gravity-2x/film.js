/* =====================================================================
   FILM — "What if gravity became twice as strong?"
   The film-specific half of the engine (see js/main.js): builds the sunny
   avenue, the building site (crane, scaffold, awning, water tank), the traffic,
   the people, the airliner, the effects, your hands and your shopping bag;
   each frame it turns your head toward what matters (GV_LOOK), poses
   everything for story time t, and grades the picture.
   ===================================================================== */

// your hands (camera space; right-hand poses, mirrored for the left). Poses with `aim` are re-aimed every frame so a point
// in the palm lands on a point in the world (gvAimHand).
const GV_HAND_POSES = Object.assign({}, HAND_POSES, {
  // the shopping bag hooked on your fingers, forearm forward (the bag hangs below the frame, its top just in view)
  bagR:     { p: [0.095, -0.15, -0.42], F: [-0.12, -0.2, -0.97], N: [-0.25, -0.95, 0.1], curl: [1.45, 1.5, 1.5, 1.45], thumb: [0.25, 0.45] },
  // gravity doubles: the bag yanks your hand down
  bagDropR: { p: [0.13, -0.42, -0.34], F: [-0.05, -0.75, -0.65], N: [-0.4, -0.6, 0.6], curl: [1.5, 1.55, 1.55, 1.5], thumb: [0.2, 0.5], trem: 0.004 },
  // lowering it to the pavement (aimed at the handles of the bag where it will rest)
  bagLowR:  { p: [0.1, -0.3, -0.4], F: [0, -1, 0], N: [-1, 0, 0], curl: [1.5, 1.55, 1.55, 1.5], thumb: [0.2, 0.5], aim: [0, 0.09, 0.02], trem: 0.003 },
  // going down: hands thrown out toward the ground, fingers spread
  catchR:   { p: [0.14, -0.2, -0.38], F: [0.1, -0.35, -0.93], N: [0, -0.95, 0.3], curl: [0.1, 0.08, 0.12, 0.16], thumb: [0.7, 0.05] },
  // palms flat on the pavement (aimed); then pushing up, arms shaking
  plantR:   { p: [0.2, -0.4, -0.4], F: [0, 0, -1], N: [0, -1, 0], curl: [0.05, 0.04, 0.06, 0.1], thumb: [0.55, 0.12], aim: [0, 0.07, 0.012] },
  pushR:    { p: [0.2, -0.4, -0.4], F: [0, 0, -1], N: [0, -1, 0], curl: [0.08, 0.06, 0.08, 0.12], thumb: [0.55, 0.12], aim: [0, 0.07, 0.012], trem: 0.0035 },
  // a hand on your knee to get the rest of the way up
  kneeR:    { p: [0.1, -0.36, -0.26], F: [-0.1, -0.85, -0.5], N: [-0.2, -0.45, 0.87], curl: [0.4, 0.45, 0.5, 0.55], thumb: [0.5, 0.2], trem: 0.003 },
});
for (const k of ['catch', 'plant', 'push']) GV_HAND_POSES[k + 'L'] = Object.assign({}, GV_HAND_POSES[k + 'R'], { p: GV_HAND_POSES[k + 'R'].p.slice(), F: GV_HAND_POSES[k + 'R'].F.slice(), N: GV_HAND_POSES[k + 'R'].N.slice() });
const GV_HAND_BLEND = Object.assign({}, HAND_BLEND, { bagR: 0.4, bagDropR: 0.22, bagLowR: 0.6, catchR: 0.14, catchL: 0.14, plantR: 0.12, plantL: 0.12, pushR: 0.5, pushL: 0.5, kneeR: 0.5 });
for (const k of Object.keys(GV_HAND_POSES)) { if (k.endsWith('!')) continue; GV_HAND_POSES[k + '!'] = GV_HAND_POSES[k]; GV_HAND_BLEND[k + '!'] = 0.02; }

const _gvAim = { y: new THREE.Vector3(), z: new THREE.Vector3(), x: new THREE.Vector3(), c: new THREE.Vector3(), q: new THREE.Quaternion() };
// re-aim pose `name` so its palm point lands on `world`, oriented by world directions Fw (fingers) and Nw (palm normal)
function gvAimHand(name, camera, world, Fw, Nw, side = 1) {
  const P = GV_HAND_POSES[name], A = _gvAim;
  A.q.copy(camera.quaternion).invert();
  A.y.copy(Fw).normalize().applyQuaternion(A.q); A.y.x *= side; P.F = [A.y.x, A.y.y, A.y.z];
  A.z.copy(Nw).normalize().applyQuaternion(A.q); A.z.x *= side; P.N = [A.z.x, A.z.y, A.z.z];
  A.y.set(...P.F).normalize();
  A.z.set(...P.N); A.z.addScaledVector(A.y, -A.z.dot(A.y)).normalize();
  A.x.crossVectors(A.y, A.z);
  A.c.copy(world).applyMatrix4(camera.matrixWorldInverse);
  A.c.x *= side;
  const l = P.aim, s = 1.04;                                              // (the hands' scale)
  for (let i = 0; i < 3; i++) P.p[i] = A.c.getComponent(i) - s * (A.x.getComponent(i) * l[0] + A.y.getComponent(i) * l[1] + A.z.getComponent(i) * l[2]);
}

// where the bag ends up: on the pavement just in front of your right foot (its handles' top)
const GV_BAG = { x: 9.6, z: 0.92, h: 0.34 };
// where your hands land when you go down
const GV_PLANT = { x: GV_ME.x, z: GV_ME.zTrip - 0.46, w: 0.24 };

// where your eyes go: [start turning, arrived, target, fov]. A target is a world point or (t, app) → [x, y, z]
// (moving things are followed); fov null = the default 66°.
const GV_LOOK = [
  [-1, -1, [6.2, 4.2, -40], null],                                                      // down the avenue: the crane, the scaffold, the kid
  [GV.g0 + 0.15, GV.g0 + 0.7, [10.2, 0.9, -6.7], 50],                                   // the weight hits: the kid and his mum buckle
  [GV.bagDown[0] - 0.5, GV.bagDown[0] + 0.3, [GV_BAG.x - 0.02, 0.05, GV_BAG.z - 0.25], null],   // the bag, to the pavement
  [GV.bagDown[1] + 0.15, GV.bagDown[1] + 1.0, [9.75, 0.55, -6.3], 44],                  // the kid, trying again
  [GV.kidJump + 1.2, GV.kidJump + 2.0, [11.7, 0.95, -2.0], 44],                         // the old man on the bench
  [GV.oldMan[1] - 0.2, GV.oldMan[1] + 0.5, [9.8, 11.5, -15.2], 52],                     // up: the loading bay creaks
  [GV.bay.drop + 0.05, GV.bay.drop + 0.35, (t, a) => { const p = a.site.scaffold.pallet; p.updateWorldMatrix(true, false); const v = p.getWorldPosition(_gvTmp); return [v.x, Math.max(v.y, 1.6), v.z]; }, 58],
  [GV_FALL.pallet.hit + 0.5, GV_FALL.pallet.hit + 1.3, [9.1, 1.2, -15.3], 54],           // the wreck
  [GV.coupe - 1.4, GV.coupe - 0.7, (t, a) => { const c = a.traffic.coupe; return [c.x, 0.5, Math.min(c.zt.value(t) - 1.5, -2)]; }, 60],
  [GV.truck - 0.4, GV.truck + 0.3, (t, a) => { const c = a.traffic.truck; return [c.x, 1.4, Math.min(c.zt.value(t) - 1, -3)]; }, 56],
  [GV.outrigger - 0.9, GV.outrigger - 0.3, [-0.9, 0.9, -28.2], 30],                     // the crane's outrigger pad
  [GV.outrigger + 1.0, GV.outrigger + 2.0, (t, a) => { const l = a.site.crane.load.position; return [l.x, l.y + 2.5, l.z]; }, 46],   // the load swinging
  [GV.scaffold.bow - 0.8, GV.scaffold.bow - 0.1, [11.6, 7.0, -18.5], 56],               // the scaffold bows…
  [GV.scaffold.fold + 0.2, GV.scaffold.fold + 1.0, [7.5, 2.0, -18.5], 62],             // …and folds into the street
  [GV.awning - 1.4, GV.awning - 0.8, [11.6, 3.0, -6.6], 54],                            // the old awning
  [GV.tank - 1.3, GV.tank - 0.6, [-16.5, 19.5, -3.0], 50],                              // the water tank across the street
  [GV.tank + 1.2, GV.tank + 2.0, [-12.0, 7.0, -3.0], 56],                               // the water coming down
  [GV.plane[0] + 0.1, GV.plane[0] + 1.0, [7.5, 200, -30], 66],                           // the roar: you look up
  [GV.plane[0] + 1.6, GV.plane[0] + 2.4, (t, a) => { const p = a.plane.position(t, _gvTmp); return [p.x, p.y, Math.min(p.z, a.camera.position.z - 25)]; }, 56],
  [GV.plane[0] + 4.2, GV.plane[0] + 5.6, (t, a) => { const p = a.plane.position(t, _gvTmp); return [p.x, p.y, p.z]; }, 34],
  [GV.limit - 0.4, GV.limit + 0.4, (t, a) => { const p = a.cast.byId.medA.root.position; return [p.x - 0.6, 0.95, p.z - 1.2]; }, 54],   // the paramedics
  [GV.trip - 0.1, GV.trip + 0.38, [GV_PLANT.x, 0.0, GV_PLANT.z - 0.35], 66],            // you go down
  [GV.up[0] + 1.2, GV.up[1] - 0.2, [7.0, 2.5, -16], 62],                                 // getting up, eyes up the street
  // the load, held still in frame so you see each slip of the brake drop it; then wide and locked for the fall: the load at
  // the top of the frame, the flatbed at the bottom; then down to the wreck, and the dust over the street
  [GV.slips[0] - 0.7, GV.slips[0] - 0.1, (t, a) => { const f = a.site.crane._fallXZ; return [f[0], GV_FALL.load.base + GV_FALL.load.h + 0.4, f[1]]; }, 36],
  [GV.drop - 0.05, GV.drop + 0.35, (t, a) => { const f = a.site.crane._fallXZ; return [f[0], 10, f[1]]; }, 66],
  [GV_FALL.load.hit + 1.3, GV_FALL.load.hit + 2.3, (t, a) => { const f = a.site.crane._fallXZ; return [f[0], 2.5, f[1]]; }, 58],
  [GV.hudBack + 0.4, GV.hudBack + 2.6, [3.5, 3.0, -26], 62],                              // the dust settling over the street
];
const _gvTmp = new THREE.Vector3();

const FILM = {
  build(app) {
    const { scene, camera } = app;
    FILM._app = app;
    camera.near = 0.03; camera.far = 2600; camera.updateProjectionMatrix();
    app.env = new GvCity(scene, app.renderer, app.rng);
    app.env.camera = camera;
    app.env.build();
    app.site = { crane: new GvCrane(scene), scaffold: new GvScaffold(scene), awning: new GvAwning(scene), tank: new GvTank(scene) };
    app.traffic = new GvTraffic(scene);
    app.site.flatbed = new GvFlatbed(scene, app.traffic.factory);
    app.cast = new GvCast(app);
    app.plane = new GvAirliner(scene);
    app.fx = new GvFx(app);
    app.bag = this._bag(scene);
    // you: muted sleeves, skin-tone nails (docs/STYLE_BIBLE.md § 11)
    app.handShadows = new BlobShadows(scene, 4);       // your palms on the pavement
    app.hands = new ViewerHands(camera, { scale: 1.04, sleeve: '#3a4552', cuff: '#2c343e', nail: '#c99c84', sleeveLen: 1.1, sleeveFit: 0.78, poses: GV_HAND_POSES, blends: GV_HAND_BLEND });
    Look.apply(scene, camera);                          // selective gloss + world-space grime (after the world is built)
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    app.audio = new GvAudio(app.tl, app);
    this._look = GV_LOOK.map((L) => ({ t0: L[0], t1: L[1], at: L[2], fov: L[3] }));
  },

  // a paper grocery bag: open at the top, a baguette and leeks poking out (origin at the top of its handles)
  _bag(scene) {
    const g = new THREE.Group(); g.name = 'bag'; scene.add(g);
    const paper = Mat.std('#c39a64', { roughness: 0.92 }), inner = Mat.std('#8d6a40', { roughness: 0.95 }), H = GV_BAG.h, W = 0.28, D = 0.16, y0 = -0.06 - H / 2;
    for (const s of [-1, 1]) {                                                 // the walls (outside paper, darker inside), the bottom
      gvBox(W, H, 0.006, paper, g, 0, y0, s * D / 2); gvBox(W - 0.01, H - 0.01, 0.004, inner, g, 0, y0 + 0.005, s * (D / 2 - 0.005), 0, 0, 0, false);
      gvBox(0.006, H, D, paper, g, s * W / 2, y0, 0); gvBox(0.004, H - 0.01, D - 0.01, inner, g, s * (W / 2 - 0.005), y0 + 0.005, 0, 0, 0, false);
    }
    gvBox(W, 0.006, D, inner, g, 0, -0.06 - H + 0.003, 0, 0, 0, 0, false);
    for (const s of [-1, 1]) { gvBox(W + 0.008, 0.028, 0.01, Mat.std('#b08552', { roughness: 0.92 }), g, 0, -0.074, s * (D / 2 + 0.002), 0, 0, 0, false); }
    // a baguette leaning out at the far end, three leeks, a red packet and a carton just showing
    gvMesh(new THREE.CapsuleGeometry(0.028, 0.3, 4, 8), Mat.std('#d39a52', { roughness: 0.8 }), g, -0.085, -0.12, 0.02, 0, 0, 0.5, false);
    for (let i = 0; i < 3; i++) {                                              // (leaning away from your hand)
      const x = 0.075 + i * 0.02, z = -0.035 + i * 0.03, r = -0.22 - i * 0.07, ax = -Math.sin(r), ay = Math.cos(r);
      gvMesh(new THREE.CylinderGeometry(0.012, 0.014, 0.3, 6), Mat.std('#e6ead2', { roughness: 0.8 }), g, x, -0.16, z, 0, 0, r, false);
      gvMesh(new THREE.CylinderGeometry(0.022, 0.012, 0.16, 6), Mat.std('#4f7a2e', { roughness: 0.8 }), g, x + ax * 0.22, -0.16 + ay * 0.22, z, 0, 0, r, false);
    }
    gvBox(0.1, 0.11, 0.07, Mat.std('#c23a2a', { roughness: 0.6 }), g, -0.0, -0.1, 0.03, 0, 0.3, 0, false);
    gvBox(0.08, 0.13, 0.08, Mat.std('#ece6d4', { roughness: 0.7 }), g, 0.02, -0.11, -0.035, 0, -0.2, 0.06, false);
    for (const s of [-1, 1]) gvMesh(new THREE.TorusGeometry(0.045, 0.006, 4, 10, Math.PI), Mat.std('#a47e50', { roughness: 0.9 }), g, 0, -0.055, s * 0.05, 0, 0, 0, false);
    return g;
  },

  update(app, t) {
    const cam = app.camera;
    // the world first (it doesn't depend on where you look; some looks follow things in it)
    app.env.update(t);
    for (const k of ['crane', 'flatbed', 'scaffold', 'awning', 'tank']) app.site[k].update(t);
    app.traffic.update(t);
    app.cast.update(t);
    app.plane.update(t);
    this._lookAt(app, t);
    cam.updateMatrixWorld(true);
    // you
    this._aimHands(app, t);
    app.hands.update(t);
    this._handVisibility(app);
    this._bagUpdate(app, t);
    this._handShadows(app, t);
    app.fx.update(t);
    this._shadowFocus(app);
    // the dust of the last impact hangs over the street: hazier sky and air
    const hz = app.fx.haze || 0, fog = app.scene.fog;
    fog.density = 0.0011 + 0.0007 * hz;
    fog.color.copy(app.env.fogColor).lerp(_gvDustCol, 0.4 * hz);
    app.env.skyUniforms.uDust.value = 0.35 * hz;
  },

  // turn your head toward the next thing (blend between consecutive looks; moving targets are followed)
  _lookAt(app, t) {
    const cam = app.camera, L = this._look;
    let i = 0; while (i + 1 < L.length && L[i + 1].t0 <= t) i++;
    const cur = L[i], prev = L[Math.max(0, i - 1)];
    const ang = (E) => { const p = typeof E.at === 'function' ? E.at(t, app) : E.at, dx = p[0] - cam.position.x, dy = p[1] - cam.position.y, dz = p[2] - cam.position.z;
      return [Math.atan2(-dx, -dz), Math.atan2(dy, Math.hypot(dx, dz)), E.fov || CONFIG.camera.fov]; };
    const b = ang(cur), w = i > 0 ? Ease.inOutSine(MathX.clamp((t - cur.t0) / Math.max(0.01, cur.t1 - cur.t0), 0, 1)) : 1;
    let yaw = b[0], pitch = b[1], fov = b[2];
    if (w < 1) {
      const a = ang(prev);
      while (b[0] - a[0] > Math.PI) a[0] += Math.PI * 2; while (b[0] - a[0] < -Math.PI) a[0] -= Math.PI * 2;
      yaw = MathX.lerp(a[0], b[0], w); pitch = MathX.lerp(a[1], b[1], w); fov = MathX.lerp(a[2], b[2], w);
    }
    // (the camera's own layers — bob, breathing, startles, shakes, tilt — stay on top: SCRIPT yaw / pitch are 0)
    cam.rotation.y += yaw; cam.rotation.x = MathX.clamp(cam.rotation.x + pitch, -1.5, 1.5);
    if (Math.abs(cam.fov - fov) > 1e-3) { cam.fov = fov; cam.updateProjectionMatrix(); }
  },

  // the bag-lowering hand reaches for the bag's resting handles; your palms land flat on the pavement
  _aimHands(app, t) {
    const cam = app.camera, V = FILM._v || (FILM._v = { w: new THREE.Vector3(), f: new THREE.Vector3(), n: new THREE.Vector3() });
    V.w.set(GV_BAG.x, LAYOUT.curbH + GV_BAG.h + 0.075, GV_BAG.z); V.f.set(0.05, -1, -0.15); V.n.set(-1, 0, 0);
    gvAimHand('bagLowR', cam, V.w, V.f, V.n, 1);
    for (const [side, names] of [[1, ['plantR', 'pushR']], [-1, ['plantL', 'pushL']]]) {
      V.w.set(GV_PLANT.x + side * GV_PLANT.w, LAYOUT.curbH + 0.012, GV_PLANT.z); V.f.set(side * 0.25, 0, -1); V.n.set(0, -1, 0);
      for (const n of names) gvAimHand(n, cam, V.w, V.f, V.n, side);
    }
  },

  _handVisibility(app) {
    for (const h of [app.hands.right, app.hands.left]) {
      const p = h.g.position;
      if (p.z > -0.08 || Math.abs(p.x) > -p.z * 1.2 || p.y > -p.z * 1.4) h.g.visible = false;
    }
  },

  // soft contact shadows under your palms while they are flat on the pavement
  _handShadows(app, t) {
    const S = app.handShadows, k = MathX.smooth(t, GV.trip + 0.3, GV.trip + 0.45) * (1 - MathX.smooth(t, GV.up[0] + 1.2, GV.up[0] + 1.6));
    S.begin();
    if (k > 0.01) for (const side of [1, -1]) S.push(GV_PLANT.x + side * GV_PLANT.w, LAYOUT.curbH + 0.004, GV_PLANT.z - 0.02, 0.15, 0.3 * k, 0.2);
    S.end();
  },

  // the bag: hangs from your fingers (swinging a little as you walk), then rests where you put it
  _bagUpdate(app, t) {
    const g = app.bag, h = app.hands.right.g, cam = app.camera;
    if (t < GV.bagDown[1]) {
      h.updateWorldMatrix(true, false);
      g.position.set(0, 0.09, 0.02).applyMatrix4(h.matrixWorld);
      g.position.y = Math.max(g.position.y, LAYOUT.curbH + GV_BAG.h + 0.075);
      const sw = t < GV.g0 ? 0.07 * Math.sin(t * 5.4) : 0.03 * Math.exp(-(t - GV.g0) / 0.6) * Math.sin((t - GV.g0) * 7);
      g.rotation.set(sw, cam.rotation.y, 0.05 * Math.sin(t * 2.7));
    } else { g.position.set(GV_BAG.x, LAYOUT.curbH + GV_BAG.h + 0.075, GV_BAG.z); g.rotation.set(0, 0.25, 0.02); }
  },

  // the sun's shadow box follows what you're looking at
  _shadowFocus(app) {
    const cam = app.camera, e = app.env, f = FILM._f || (FILM._f = new THREE.Vector3());
    cam.getWorldDirection(f); f.y = 0; if (f.lengthSq() < 1e-6) f.set(0, 0, -1); f.normalize();
    const d = 30;
    e.sun.target.position.set(cam.position.x + f.x * d, 0, cam.position.z + f.z * d); e.sun.target.updateMatrixWorld();
    e.sun.position.copy(e.sunDir).multiplyScalar(170).add(e.sun.target.position);
  },

  grade(t, p) {
    const T = GV, PH = GV_FALL.pallet.hit, LH = GV_FALL.load.hit;
    // sunny "ordinary day goes wrong" look (Friction's family): set everything every frame
    p.flash = 0; p.fade = 0; p.ao = 0.55; p.edgeBlur = 0;
    p.exposure = 1.1; p.saturation = 1.2; p.contrast = 1.08; p.warmth = 0.07; p.blackLift = 0.0;
    p.vignette = 0.45; p.soft = 0.015; p.bloom = 0.22; p.bloomThreshold = 1.4; p.grain = 0.02;
    p.tunnel = 1.25; p.tunnelSoft = 0.5; p.tunnelDark = 0;
    p.flashColor.setRGB(1, 1, 1);
    if (p.smear) p.smear.set(0, 0);
    // the change: a jolt of chroma; after it the light goes a touch flatter (colour as storytelling)
    p.chroma = 0.006 * MathX.impulse(t, T.g0 + 0.05, 0.3) + 0.003 * MathX.impulse(t, PH, 0.2) + 0.004 * MathX.impulse(t, T.trip + 0.33, 0.25) + 0.006 * MathX.impulse(t, LH, 0.35);
    const changed = MathX.smooth(t, T.g0, T.g0 + 2);
    p.saturation -= 0.06 * changed; p.contrast += 0.03 * changed;
    // the hits: two or three frames of white
    p.flash = 0.22 * MathX.impulse(t, PH, 0.05) + (t >= LH ? 0.8 * (1 - MathX.smooth(t, LH + 0.04, LH + 0.13)) : 0);
    // down on the pavement: the edges close in while you get your breath
    const down = MathX.smooth(t, T.trip + 0.2, T.trip + 0.8) * (1 - MathX.smooth(t, T.up[1] - 0.5, T.up[1] + 0.8));
    p.vignette += 0.3 * down; p.tunnel -= 0.25 * down; p.tunnelDark = 0.25 * down; p.edgeBlur = 0.2 * down;
    // the dust after the last impact: lower contrast, warmer
    const dust = MathX.smooth(t, LH, LH + 2.5);
    p.contrast -= 0.06 * dust; p.warmth += 0.04 * dust; p.saturation -= 0.08 * dust;
    p.exposure -= 0.1 * dust; p.vignette += 0.12 * dust;           // (a little darker, so the closing lines read over the dust)
    // black at the very end
    p.fade = MathX.smooth(t, T.end - 0.6, T.end);
  },

  debug(app, t) { return `g ${gvG(t).toFixed(2)} · pallet hit ${GV_FALL.pallet.hit.toFixed(2)} · load hit ${GV_FALL.load.hit.toFixed(2)}`; },
};
const _gvDustCol = new THREE.Color('#cbbfa8');
