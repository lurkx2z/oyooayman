/* =====================================================================
   FILM — "What if gravity became twice as strong?" (v3: the leisure centre)
   The film-specific half of the engine (see js/main.js): builds the leisure centre (centre.js), the things that
   move or measure (props.js), the people (cast.js), the water effects (fx.js) and your hands; each frame it turns
   your head toward what matters (GV_LOOK), puts your feet on the floor under you (the stair, the deck) or your
   head on the water, switches to the under-water look when you go under, and grades the picture.
   ===================================================================== */

// your hands (camera space; right-hand poses, mirrored for the left). Poses with `aim` are re-aimed every frame so a point
// in the palm lands on a point in the world (gvAimHand).
const GV_HAND_POSES = Object.assign({}, HAND_POSES, {
  // on the scale's grips (aimed): fingers wrapped round the upright handles, thumbs on top
  gripR:  { p: [0.2, -0.4, -0.45], F: [0, 0, -1], N: [-1, 0, 0], curl: [1.35, 1.4, 1.45, 1.5], thumb: [0.3, 0.9], aim: [0, 0.075, 0.022] },
  gripL:  { p: [0.2, -0.4, -0.45], F: [0, 0, -1], N: [-1, 0, 0], curl: [1.35, 1.4, 1.45, 1.5], thumb: [0.3, 0.9], aim: [0, 0.075, 0.022] },
  // sliding down the stair's handrail (aimed)
  railR:  { p: [0.2, -0.3, -0.5], F: [0, -0.5, -0.85], N: [0, -0.85, 0.5], curl: [0.75, 0.8, 0.85, 0.9], thumb: [0.35, 0.6], aim: [0, 0.07, 0.02] },
  // palms on the pool's edge either side of you (aimed)
  edgeR:  { p: [0.25, -0.5, -0.5], F: [0, 0, -1], N: [0, -1, 0], curl: [0.25, 0.25, 0.3, 0.35], thumb: [0.5, 0.15], aim: [0, 0.07, 0.012] },
  edgeL:  { p: [0.25, -0.5, -0.5], F: [0, 0, -1], N: [0, -1, 0], curl: [0.25, 0.25, 0.3, 0.35], thumb: [0.5, 0.15], aim: [0, 0.07, 0.012] },
  // on the pull-up bar (aimed): overhand, fingers over the top; the left one peeling open before you drop
  barR:   { p: [0.2, 0.3, -0.4], F: [0, 1, 0], N: [0, 0, -1], curl: [1.3, 1.35, 1.4, 1.45], thumb: [0.35, 1.0], aim: [0, 0.075, 0.024] },
  barL:   { p: [0.2, 0.3, -0.4], F: [0, 1, 0], N: [0, 0, -1], curl: [1.3, 1.35, 1.4, 1.45], thumb: [0.35, 1.0], aim: [0, 0.075, 0.024] },
  barSlipL: { p: [0.2, 0.3, -0.4], F: [0, 1, 0], N: [0, 0, -1], curl: [0.55, 0.6, 0.7, 0.75], thumb: [0.4, 0.4], aim: [0, 0.06, 0.03] },
  // palms flat on the deck at the end of the pool, pressing yourself up (aimed)
  pushR:  { p: [0.25, -0.5, -0.5], F: [0, 0, -1], N: [0, -1, 0], curl: [0.2, 0.2, 0.25, 0.3], thumb: [0.55, 0.1], aim: [0, 0.07, 0.012] },
  pushL:  { p: [0.25, -0.5, -0.5], F: [0, 0, -1], N: [0, -1, 0], curl: [0.2, 0.2, 0.25, 0.3], thumb: [0.55, 0.1], aim: [0, 0.07, 0.012] },
  // floating: sculling just under the surface, low in the frame
  scullR: { p: [0.17, -0.27, -0.42], F: [-0.25, -0.15, -1], N: [-0.15, -1, 0.1], curl: [0.15, 0.15, 0.2, 0.25], thumb: [0.4, 0.1] },
});
for (const k of ['scull']) GV_HAND_POSES[k + 'L'] = Object.assign({}, GV_HAND_POSES[k + 'R']);
const GV_HAND_BLEND = Object.assign({}, HAND_BLEND, { gripR: 0.4, gripL: 0.4, railR: 0.45, edgeR: 0.35, edgeL: 0.35, scullR: 0.6, scullL: 0.6,
  barR: 0.3, barL: 0.3, barSlipL: 0.35, pushR: 0.35, pushL: 0.35 });
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

// the stair's right handrail at z (it runs from the gym's floor to the deck)
const GV_RAIL = { x: GV_C.stair.x1 + 0.05, h: 0.95 };
function gvRailY(z) { const S = GV_C.stair, L = S.n * S.run; return GV_RAIL.h - S.rise * S.n * MathX.clamp((S.z0 - z) / L, 0, 1); }

// pressing yourself out of the water: up as your arms straighten (gvOutK); when they give, back down at 2 G, under for a
// moment, and up to float again
function gvOutLift(t) {
  const O = GV.out;
  if (t < O.push) return 0;
  if (t < O.give) return gvOutK(t);
  const h0 = gvOutK(O.give - 1e-4), a = t - O.give, under = 0.5, tf = Math.sqrt(2 * (h0 + under) / GV_G);
  if (a < tf) return h0 - 0.5 * GV_G * a * a;
  const b = a - tf;
  return -under * Math.exp(-b / 0.32) * Math.cos(b * 3.2);
}

const _gvT = new THREE.Vector3(), _gvDv = { x: 0, y: 0, z: 0, mode: 0 };
const gvDiverP = (dy) => (t) => { const d = gvDiverAt(t, _gvDv); return [d.x, d.y + dy, d.z]; };
// where your eyes go: [start turning, arrived, target, fov]. A target is a world point or (t, app) → [x, y, z]
// (moving things are followed); fov null = the default.
const GV_LOOK = [
  [-1, -1, [0.6, 0.6, -1.3], 66],                                                        // the scale's screen low in the frame, the gym beyond
  [GV.g0, GV.g0 + 0.3, [0.6, 1.2, -1.2], 62],                                            // the weight hits: knees give; the screen stays under the title
  [GV.title[1] - 0.3, GV.title[1] + 0.4, [0.6, 1.0, 0.75], 56],                         // the title's gone: the screen fills the frame
  [GV.scale[1] - 0.6, GV.tread.look + 0.1, (t, a) => { const p = a.cast.byId.runner.root.position; return [p.x + 0.2, 0.75, p.z]; }, 40],   // the runner
  [GV.offScale + 0.3, GV.bench.look + 0.4, [GV_C.bench.x - 0.05, 0.72, GV_C.bench.barZ + 0.2], 46],    // the bench, from beside the lifter's feet
  [GV.bench.drop + 0.9, GV.bench.drop + 1.9, [GV_C.court.hoop.x, 2.1, GV_C.court.hoop.z + 2.0], 62],    // through the glass: the court
  [GV.hang.go + 0.1, GV.hang.go + 0.9, [GV_C.pullup.x + 0.6, 1.9, GV_C.pullup.z], 64],           // the pull-up bar (the court behind it)
  [GV.hang.at - 0.1, GV.hang.grab + 0.35, [GV_C.pullup.x + 1.4, 2.95, GV_C.pullup.z], 74],       // up at your hands on it, the court beyond
  [GV.hang.drop - 0.02, GV.hang.drop + 0.35, [GV_C.pullup.x + 1.6, 0.35, GV_C.pullup.z], 66],    // you drop
  [22.0, 23.0, [3.6, -3.4, -14.5], 64],                                                   // (cut) down the stair
  [GV.stair[0] + 1.3, GV.stair[0] + 2.1, [3.3, -1.5, -8.4], 54],                          // the man resting halfway up
  [GV.stair[0] + 3.9, GV.stair[0] + 4.8, [-3.0, -3.7, -13.0], 56],                        // the swimmers
  [32.0, 33.0, [GV_C.ladder.x - 0.3, -3.0, GV_C.ladder.z], 40],                           // (cut) the man at the ladder
  [GV.slide + 0.6, GV.float, [-3.2, -2.6, -27.5], 64],                                    // (cut) floating: the deep end, the tower
  [GV.diver.stand - 0.6, GV.diver.stand + 0.3, [-4.5, 6.9, -29.6], 50],                   // up at the platform
  [GV.diver.step - 0.15, GV.diver.step + 0.2, gvDiverP(0.9), 40],                          // she steps off: follow her down, close
  [GV_FALL.hit - 0.1, GV_FALL.hit + 0.15, [GV_ENTRY.x, -2.1, GV_ENTRY.z], 60],            // the splash
  [GV.under + 0.1, GV.under + 0.7, (t) => { const d = gvDiverAt(t, _gvDv); return [d.x, Math.min(d.y + 0.6, GV_WATER - 1.2), d.z]; }, 64],   // under: her plume, her rising
  [GV.surface - 0.1, GV.surface + 0.7, (t) => { const d = gvDiverAt(t, _gvDv); return [d.x, GV_WATER + 0.3, d.z]; }, 58],   // up beside her: she floats
  [GV.out.turn, GV.out.turn + 0.9, [GV_ME.wall[0], -2.9, -32.0], 64],                     // turn to the wall
  [GV.out.wall - 0.3, GV.out.push + 0.2, (t, a) => [GV_ME.wall[0], a.camera.position.y - 0.3 - 0.8 * gvOutK(t), -31.6], 72],   // hands on the deck: press
  [GV.out.give + 0.02, GV.out.give + 0.3, [GV_ME.wall[0] + 0.25, GV_LOW + 0.85, -32.5], 70],   // sinking back: the edge (and him) rise away
  [GV.out.give + 0.6, GV.out.give + 1.9, (t) => { const d = gvDiverAt(t, _gvDv); return [d.x - 0.6, GV_WATER + 1.4, d.z + 1.4]; }, 60],   // back in, floating: her, the pool
];

const FILM = {
  build(app) {
    const { scene, camera } = app;
    FILM._app = app;
    camera.near = 0.03; camera.far = 2600; camera.updateProjectionMatrix();
    app.env = new GvCentre(scene, app.renderer, app.rng);
    app.env.camera = camera;
    app.env.build();
    app.props = { scale: new GvScale(scene), tread: new GvTreadmills(scene), bench: new GvBench(scene), hoop: new GvHoop(scene), pullup: new GvPullUp(scene) };
    app.water = new GvWater(scene);
    app.cast = new GvCast(app);
    app.fx = new GvFx(app);
    // you: bare forearms (a T-shirt's sleeves are above the frame), a sports watch
    app.hands = new ViewerHands(camera, { scale: 1.04, skin: '#b98a70', sleeve: '#b3846a', cuff: '#b3846a', nail: '#c99c84', sleeveLen: 1.1, sleeveFit: 0.62, poses: GV_HAND_POSES, blends: GV_HAND_BLEND });
    for (const m of Object.values(app.hands.mats)) gvSubmerge(m);
    Look.apply(scene, camera);                          // selective gloss + world-space grime (after the world is built)
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    app.audio = new GvAudio(app.tl, app);
    this._look = GV_LOOK.map((L) => ({ t0: L[0], t1: L[1], at: L[2], fov: L[3] }));
    this._air = { color: scene.fog.color.clone(), density: scene.fog.density, bg: scene.background.clone() };
    this._uw = { color: new THREE.Color('#1d6a74'), bg: new THREE.Color('#1a5a64') };
  },

  update(app, t) {
    const cam = app.camera;
    // the world first (it doesn't depend on where you look; some looks follow things in it)
    app.env.update(t);
    const P = app.props;
    P.scale.update(t); P.tread.update(t); P.bench.update(t);
    app.cast.update(t);
    P.hoop.update(t, app.cast.hands);
    GV_CAU.uCauTime.value = t;
    // your body: the floor under your feet (the scale, the stair, the deck) or, once you're in, the water
    this._body(app, t);
    this._lookAt(app, t);
    cam.updateMatrixWorld(true);
    // under the water: the fog and the background turn to the water's colour
    const under = cam.position.y < app.water.height(cam.position.x, cam.position.z, t) - 0.01 ? 1 : 0;
    this.under = under;
    const fog = app.scene.fog;
    if (under) { fog.color.copy(this._uw.color); fog.density = 0.115; app.scene.background.copy(this._uw.bg); }
    else { fog.color.copy(this._air.color); fog.density = this._air.density; app.scene.background.copy(this._air.bg); }
    // you
    this._aimHands(app, t);
    app.hands.update(t);
    this._handVisibility(app);
    app.fx.update(t, under);
    const bobs = app.cast.bobs.slice(0, GV_BOBS - 1);
    if (t > GV.float - 0.5 && !under) bobs.push([cam.position.x, cam.position.z - 0.25, 0.006, 0]);
    app.water.update(t, app.scene, bobs, app.fx.foam);
    this._shadowFocus(app);
  },

  // the eye's height: the controller gives it above the floor; add the floor (or the water) under you
  _body(app, t) {
    const cam = app.camera, x = cam.position.x, z = cam.position.z, H = SCRIPT.camera;
    const tr = this._ht || (this._ht = new Track(H.height));
    const extra = cam.position.y - (H.baseY + tr.value(t));            // the controller's own layers (bob, breath, startles)
    const fl = gvFloorY(x, z);
    let y = fl + tr.value(t) + extra;
    // each step down the stair lands with a jolt
    const S = GV_C.stair, u = (S.z0 - z) / S.run;
    if (u > 0 && u < S.n + 0.6 && t > GV.stair[0] - 0.5 && t < GV.stair[1] + 0.5) {
      const f = u - Math.floor(u), land = f > 0.5 ? Math.exp(-(f - 0.5) / 0.12) : 0;
      y -= 0.025 * land; cam.rotation.x -= 0.018 * land;
    }
    if (t > GV.slide) {
      // in: down under the surface for a moment, up to float with your eyes just above the water; under; up again
      const wy = app.water.height(x, z, t) + 0.07;
      const dip = -0.55 * MathX.smooth(t, GV.slide + 0.15, GV.slide + 0.45) * (1 - MathX.smooth(t, GV.slide + 0.55, GV.float + 0.2));
      const dive = -1.15 * MathX.smooth(t, GV.under, GV.under + 0.7) * (1 - MathX.smooth(t, GV.surface - 0.7, GV.surface)) - 0.35 * MathX.smooth(t, GV.under + 1.2, GV.under + 2.6) * (1 - MathX.smooth(t, GV.surface - 1.5, GV.surface - 0.7));
      const sitY = fl + tr.value(t) + extra;
      y = MathX.lerp(sitY, wy + dip + dive + gvOutLift(t) + 0.6 * extra, MathX.smooth(t, GV.slide, GV.slide + 0.32));
      // and the ring from the dive rocks you
    }
    cam.position.y = y;
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

  // aimed hands: on the scale's grips, sliding down the handrail, on the pool's edge
  _aimHands(app, t) {
    const cam = app.camera, V = FILM._v || (FILM._v = { w: new THREE.Vector3(), f: new THREE.Vector3(), n: new THREE.Vector3() });
    const G = app.props.scale.grips;
    for (const [side, name, g] of [[1, 'gripR', G[1]], [-1, 'gripL', G[0]]]) {
      const sq = 0.012 * MathX.smooth(t, GV.g0, GV.g0 + 0.15);                      // squeezing harder, pulled down a little
      V.w.set(g.x + side * 0.022, g.y - sq, g.z); V.f.set(-side * 0.25, 0, -1); V.n.set(-side, 0, 0);
      gvAimHand(name, cam, V.w, V.f, V.n, side);
    }
    const zr = Math.min(cam.position.z - 0.42, GV_C.stair.z0 - 0.1);
    V.w.set(GV_RAIL.x, gvRailY(zr) + 0.035, zr); V.f.set(0, -0.58, -0.81); V.n.set(0, -0.81, 0.58);
    gvAimHand('railR', cam, V.w, V.f, V.n, 1);
    // the pull-up bar: fingers up and over the top, palms facing away
    const B = GV_C.pullup;
    for (const [side, name] of [[1, 'barR'], [-1, 'barL'], [-1, 'barSlipL']]) {
      const slip = name === 'barSlipL' ? 0.035 : 0;
      V.w.set(B.x - 0.004 - slip * 0.5, B.y - slip, B.z + side * B.grip); V.f.set(0.25, 1, side * 0.1); V.n.set(1, -0.25, 0);
      gvAimHand(name, cam, V.w, V.f, V.n, side);
    }
    // palms on the deck at the end of the pool
    for (const [side, name] of [[1, 'pushR'], [-1, 'pushL']]) {
      V.w.set(GV_ME.wall[0] + side * 0.3, GV_LOW + 0.012, GV_C.pool.z0 - 0.14); V.f.set(side * 0.2, -0.04, -1); V.n.set(0, -1, 0);
      gvAimHand(name, cam, V.w, V.f, V.n, side);
    }
    for (const [side, name] of [[1, 'edgeR'], [-1, 'edgeL']]) {
      V.w.set(GV_C.pool.x1 + 0.12, GV_LOW + 0.012, cam.position.z - side * 0.26); V.f.set(-1, -0.05, -side * 0.15); V.n.set(0, -1, 0);
      gvAimHand(name, cam, V.w, V.f, V.n, side);
    }
  },

  _handVisibility(app) {
    for (const h of [app.hands.right, app.hands.left]) {
      const p = h.g.position;
      if (p.z > -0.08 || Math.abs(p.x) > -p.z * 1.2 || p.y > -p.z * 1.4) h.g.visible = false;
    }
  },

  // the sun's shadow box follows what you're looking at
  _shadowFocus(app) {
    const cam = app.camera, e = app.env, f = FILM._f || (FILM._f = new THREE.Vector3());
    cam.getWorldDirection(f); f.y = 0; if (f.lengthSq() < 1e-6) f.set(0, 0, -1); f.normalize();
    const d = 14;
    e.sun.target.position.set(cam.position.x + f.x * d, cam.position.y - 2, cam.position.z + f.z * d); e.sun.target.updateMatrixWorld();
    e.sun.position.copy(e.sunDir).multiplyScalar(80).add(e.sun.target.position);
  },

  grade(t, p) {
    const T = GV, H = GV_FALL.hit, U = this.under || 0;
    // bright, warm interior (the sunny "ordinary day goes wrong" family): set everything every frame
    p.flash = 0; p.fade = 0; p.ao = 0.55; p.edgeBlur = 0;
    p.exposure = 1.08; p.saturation = 1.16; p.contrast = 1.07; p.warmth = 0.06; p.blackLift = 0.0;
    p.vignette = 0.42; p.soft = 0.015; p.bloom = 0.24; p.bloomThreshold = 1.3; p.grain = 0.02;
    p.tunnel = 1.25; p.tunnelSoft = 0.5; p.tunnelDark = 0;
    p.flashColor.setRGB(1, 1, 1);
    if (p.smear) p.smear.set(0, 0);
    // the change: a jolt of chroma; the bar's crash; your slide in; the diver's hit
    p.chroma = 0.006 * MathX.impulse(t, T.g0 + 0.05, 0.3) + 0.003 * MathX.impulse(t, T.bench.drop, 0.2) + 0.003 * MathX.impulse(t, T.slide + 0.35, 0.25) + 0.004 * MathX.impulse(t, H, 0.3);
    const changed = MathX.smooth(t, T.g0, T.g0 + 2);
    p.saturation -= 0.04 * changed; p.contrast += 0.02 * changed;
    // the stair under double weight: the edges close in a little
    const stair = MathX.smooth(t, T.stair[0] + 1, T.stair[0] + 3) * (1 - MathX.smooth(t, T.stair[1] - 0.5, T.stair[1] + 1.5));
    p.vignette += 0.12 * stair; p.tunnelDark = 0.1 * stair;
    // in the water: calmer, cooler
    const wet = MathX.smooth(t, T.float, T.float + 1.5);
    p.warmth -= 0.03 * wet;
    // under water: teal, softer, darker edges
    if (U) { p.saturation = 0.95; p.contrast = 0.96; p.warmth = -0.12; p.exposure = 1.12; p.vignette = 0.62; p.edgeBlur = 0.18; p.bloom = 0.35; p.bloomThreshold = 1.1; p.tunnelDark = 0.15; }
    // the closing lines: a touch darker so they read over the water
    const end = MathX.smooth(t, T.lineA[0] - 0.5, T.lineA[0] + 1.5);
    p.exposure -= 0.08 * end; p.vignette += 0.1 * end;
    // black at the very end
    p.fade = MathX.smooth(t, T.end - 0.6, T.end);
  },

  debug(app, t) { return `g ${gvG(t).toFixed(2)} · scale ${gvScaleKg(t).toFixed(1)} kg · dive hit ${GV_FALL.hit.toFixed(2)} · under ${this.under || 0}`; },
};
