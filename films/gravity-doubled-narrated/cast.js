/* =====================================================================
   CAST — who does what, when (pure functions of t).
   Inside: the hero at his breakfast (the steaming cup; the heavy lift: reach → grip → pull → hold → set down),
           the waiter behind the counter.
   Outside: the man on the bench (two attempts to stand; the second braced on the parked car's wing, then a slow
           step), a second passer-by fighting to stay upright, a jogger resting on the ground, pigeons.
   Feet: gbPlant() solves the pelvis height and position from the leg angles so the soles stay on the ground
   (the bench man rises over his planted feet instead of sliding).
   ===================================================================== */

// walk cycle overrides for a phase (0…1 per stride pair) — kept from the prototype for background people
function gbCycle(phase, kind = 'walk') {
  const a = Math.sin(phase * Math.PI * 2), b = Math.cos(phase * Math.PI * 2), jog = kind === 'jog';
  const hip = jog ? 34 : 22, kn = jog ? 70 : 38, arm = jog ? 32 : 18;
  return {
    LHipX: -hip * a - (jog ? 10 : 2), RHipX: hip * a - (jog ? 10 : 2),
    LKnX: Math.max(0, -b) * kn + 6, RKnX: Math.max(0, b) * kn + 6,
    LAnX: 8 * a, RAnX: -8 * a,
    LShX: arm * a, RShX: -arm * a, LElX: jog ? -85 : -20, RElX: jog ? -85 : -20, LShAbd: 8, RShAbd: 8,
    rootY: -Math.abs(b) * (jog ? 0.05 : 0.02), spX: jog ? 8 : 3, chY: 6 * a, pelY: -5 * a, hdX: jog ? -4 : 0,
    LFing: 0.5, RFing: 0.5,
  };
}

// keyed scalar helper: [[t, v, ease?], …] → Track (cached)
const _gbTr = new Map();
function gbTrack(id, keys) { if (!_gbTr.has(id)) _gbTr.set(id, new Track(keys)); return _gbTr.get(id); }

// plant the feet: set rootY / rootZ so the chosen sole(s) sit on the ground at local z = footZ.
// Leg chain (rig.js): hip 0.02 below the pelvis joint, thigh 0.41, shin 0.395, sole 0.072 below the ankle.
function gbFoot(P, s) {
  const d = Math.PI / 180, a = ((P.pelX || 0) + (P[s + 'HipX'] || 0)) * d, b = a + (P[s + 'KnX'] || 0) * d;
  return { y: -0.02 - 0.41 * Math.cos(a) - 0.395 * Math.cos(b), z: -0.41 * Math.sin(a) - 0.395 * Math.sin(b) };
}
function gbPlant(P, footZ, side = 'both', footZR) {
  const L = gbFoot(P, 'L'), R = gbFoot(P, 'R');
  let y, z;
  if (side === 'L') { y = L.y; z = L.z; } else if (side === 'R') { y = R.y; z = R.z; footZ = footZR ?? footZ; } else { y = Math.min(L.y, R.y); z = (L.z + R.z) / 2; }
  P.rootY = (0.072 - y) - 0.86;
  P.rootZ = footZ - z;
  return P;
}

// the hero's extra seated poses (built on the prototype's 'sit')
(function () {
  const S = GB_POSES.sit, P = (o) => Object.assign({}, S, o);
  Object.assign(GB_POSES, {
    sitRest: P({ spX: 2, chX: 2, nkX: 0, hdX: 6, hdY: 4, LShX: -36, LElX: -62, LShAbd: 12, RShX: -30, RElX: -66, RShAbd: 10 }),
    sitSettle: P({ rootY: -0.372, pelX: 3, spX: 7, chX: 5, nkX: 2, hdX: 8, hdY: 2, LShX: -32, LElX: -58, LShAbd: 10, RShX: -27, RElX: -62, LShrug: -0.012, RShrug: -0.012 }),
    sitHold: P({ rootY: -0.38, pelX: 1, spX: 6, chX: -4, nkX: 4, hdX: 8, hdZ: -2, LShX: -38, LElX: -48, RShX: -26, LShrug: 0.024, RShrug: 0.03 }),
    sitLower: P({ rootY: -0.383, pelX: 3, spX: 10, chX: 4, nkX: 5, hdX: 12, LShX: -38, LElX: -50, RShX: -28, LShrug: 0.015, RShrug: 0.018 }),
    sitRelief: P({ rootY: -0.38, pelX: 2, spX: 4, chX: -2, nkX: 0, hdX: 2, hdY: 4, LShX: -34, LElX: -60, LShAbd: 12, RShX: -28, RElX: -64, LShrug: -0.018, RShrug: -0.02 }),
  });
  // the bench man (seated on a 0.48 m bench: thighs slope slightly down, shins vertical)
  const B = { LHipX: -76, RHipX: -74, LKnX: 77, RKnX: 75, LAnX: -2, RAnX: -1, LHipAbd: 7, RHipAbd: 6, LFing: 0.4, RFing: 0.4, LThumb: 0.3, RThumb: 0.3 };
  Object.assign(GB_POSES, {
    benchSit: Object.assign({}, B, { pelX: -4, spX: 10, chX: 12, nkX: 6, hdX: 8, LShX: -34, RShX: -32, LShAbd: 8, RShAbd: 8, LElX: -40, RElX: -42, LShrug: -0.02, RShrug: -0.02 }),
    // lean forward over the feet, hands on the knees (pelvis tips forward; the thighs stay on the seat)
    benchLean: Object.assign({}, B, { pelX: 18, LHipX: -94, RHipX: -92, spX: 18, chX: 14, nkX: -6, hdX: -8, LShX: -40, RShX: -40, LShAbd: 6, RShAbd: 6, LElX: -16, RElX: -16, LShrug: 0.01, RShrug: 0.01 }),
    // the push: hips just off the seat, knees deeply bent, torso far forward (the hardest instant)
    benchPush: Object.assign({}, B, { pelX: 30, LHipX: -92, RHipX: -90, LKnX: 92, RKnX: 90, LAnX: -14, RAnX: -13, spX: 22, chX: 16, nkX: -12, hdX: -10, LShX: -34, RShX: -34, LElX: -12, RElX: -12, LShrug: 0.03, RShrug: 0.03 }),
    // half up (attempt 2): thighs at ~45°, torso still forward, right arm out to the car
    benchHalf: Object.assign({}, B, { pelX: 26, LHipX: -66, RHipX: -64, LKnX: 70, RKnX: 68, LAnX: -10, RAnX: -10, spX: 18, chX: 10, nkX: -10, hdX: -8, LShX: -30, LElX: -14, RShX: -62, RElX: -18, LShrug: 0.03, RShrug: 0.025 }),
    // up, but heavy: knees soft, shoulders down, a hand still on the car
    standBrace: { pelX: 10, LHipX: -18, RHipX: -16, LKnX: 22, RKnX: 20, LAnX: -6, RAnX: -6, LHipAbd: 7, RHipAbd: 6, spX: 12, chX: 8, nkX: -2, hdX: 2, LShX: -12, LShAbd: 8, LElX: -16, RShX: -44, RElX: -16, LShrug: -0.015, RShrug: 0.01, LFing: 0.35, RFing: 0.2, LThumb: 0.3, RThumb: 0.2 },
    standHeavy: { pelX: 6, LHipX: -12, RHipX: -12, LKnX: 16, RKnX: 16, LAnX: -4, RAnX: -4, LHipAbd: 8, RHipAbd: 8, spX: 9, chX: 8, nkX: 2, hdX: 6, LShX: -8, LShAbd: 9, LElX: -18, RShX: -8, RShAbd: 9, RElX: -18, LShrug: -0.025, RShrug: -0.025, LFing: 0.4, RFing: 0.4, LThumb: 0.3, RThumb: 0.3 },
    // the passer-by: feet wide, knees bent, a bag dragging her left arm down, the right arm out for balance
    shopBrace: { pelX: 8, LHipX: -20, RHipX: -16, LKnX: 26, RKnX: 22, LAnX: -6, RAnX: -6, LHipAbd: 13, RHipAbd: 13, spX: 12, chX: 8, nkX: -4, hdX: 4, LShX: 4, LShAbd: 4, LElX: -6, RShX: -30, RShAbd: 42, RElX: -24, LShrug: -0.03, RShrug: 0.0, LFing: 0.8, RFing: 0.3, LThumb: 0.7, RThumb: 0.3 },
    shopDip: { pelX: 14, LHipX: -34, RHipX: -26, LKnX: 46, RKnX: 36, LAnX: -12, RAnX: -10, LHipAbd: 14, RHipAbd: 14, spX: 18, chX: 12, nkX: -8, hdX: -2, hdZ: 6, LShX: 6, LShAbd: 6, LElX: -4, RShX: -52, RShAbd: 58, RElX: -14, LShrug: -0.035, RShrug: 0.01, LFing: 0.85, RFing: 0.15, LThumb: 0.75, RThumb: 0.2 },
    counterLean: Object.assign({}, GB_POSES.stand, { spX: 8, chX: 6, hdX: 6, LShX: -40, RShX: -38, LElX: -34, RElX: -36, LShAbd: 12, RShAbd: 12 }),
    counterSag: Object.assign({}, GB_POSES.stand, { rootY: -0.03, pelX: 4, spX: 14, chX: 10, hdX: 10, LKnX: 12, RKnX: 12, LHipX: -8, RHipX: -8, LShX: -44, RShX: -42, LElX: -26, RElX: -28, LShAbd: 14, RShAbd: 14, LShrug: -0.02, RShrug: -0.02 }),
  });
})();

const GB_HERO_POSES = () => [
  [0, 'sitRest', 0.01],
  [GB.g, 'sitSettle', 0.35, 'outQuad'],              // he feels it: a slight settle, nothing dramatic
  [GB.reach[0] - 0.35, 'sitBrace', 0.6],              // left palm to the table, leans in for the cup
  [GB.lift - 0.28, 'sitBraceDip', 0.24],             // anticipation: a small dip
  [GB.lift + 0.12, 'sitLift1', 0.7, 'outQuad'],      // the pull: leans back against the cup's weight
  [GB.top - 0.3, 'sitHold', 0.5],                     // holding it up, shoulders hunched
  [GB.lower, 'sitLower', 0.9, 'inOutSine'],           // follows it down with his whole upper body
  [GB.down + 0.15, 'sitHeavy', 0.45],
  [GB.letGo + 0.25, 'sitRelief', 0.8],
];
const GB_HERO_FACES = () => [
  [0, 'content', 0.01],
  [GB.g + 0.03, 'surprise', 0.12, 'outQuad'],
  [GB.g + 0.7, 'worried', 0.5],
  [GB.room + 0.8, 'neutral', 0.6],
  [GB.reach[0] - 0.2, 'brace', 0.4],
  [GB.lift, 'strain', 0.3], [GB.lift + 0.6, 'strainHard', 0.6],
  [GB.top + 0.4, 'strain', 0.5],
  [GB.lower + 0.5, 'brace', 0.5],
  [GB.down, 'exhausted', 0.25],
  [GB.letGo + 0.3, 'relief', 0.5],
];
const GB_GRIP_WRIST = new THREE.Vector3(-0.095, 0.04, 0.092);   // wrist in the cup's frame when the fingers are through the handle

class GbCast {
  constructor(app, cafe) {
    this.app = app; this.cafe = cafe;
    const S = app.scene;
    this.hero = new GbCharacter(S, 'hero');
    this.waiter = new GbCharacter(S, 'waiter');
    this.benchMan = new GbCharacter(S, 'sitter');
    this.shopper = new GbCharacter(S, 'shopper');
    this.jogger = new GbCharacter(S, 'jogger');
    this.outside = [this.benchMan, this.shopper, this.jogger];
    this._props();
    this._pigeons();
    this.car = new GbCar(S, { color: '#7fa392' });
    this.car.place(...GB_SET.car);
    this.tmp = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  }

  // ------------------------------------------------------------------------------------------ props
  _cup(china, coffee) {
    const g = new THREE.Group();
    gbAdd(g, gbLathe([[0, 0.0], [0.034, 0.0], [0.04, 0.006], [0.044, 0.04], [0.046, 0.082], [0.042, 0.084], [0.039, 0.05], [0.036, 0.012], [0, 0.012]], 32), china);
    gbAdd(g, new THREE.TorusGeometry(0.022, 0.0065, 8, 18, Math.PI * 1.25), china, 0, 0.045, 0.048, { rz: -Math.PI * 0.62, ry: Math.PI / 2 });
    const surf = gbAdd(g, new THREE.CircleGeometry(0.039, 24), coffee, 0, 0.066, 0, { rx: -Math.PI / 2, cast: false });
    g.userData.surf = surf;
    return g;
  }

  _props() {
    const S = this.app.scene;
    this.china = gbMat('#cbc1b2', { rough: 0.62, name: 'gbChina', env: 0.3 });
    const coffee = gbMat('#3a2014', { rough: 0.15, name: 'gbCoffee', env: 1.0 });
    this.cup = this._cup(this.china, coffee); S.add(this.cup);
    // steam: soft billboards rising off the coffee (normal blending, warm white)
    this.steam = new BillboardSystem(S, 48, false);
    this.steam.uniforms.uLight.value = 1.0;
    // a little bag for the passer-by
    const bagM = gbMat('#c9a06a', { rough: 0.9, rim: 0.2, name: 'gbBag' });
    this.bag = new THREE.Group(); S.add(this.bag);
    gbAdd(this.bag, gbRoundBox(0.26, 0.3, 0.12, 0.03, 2), bagM, 0, -0.17, 0);
    for (const sx of [-1, 1]) gbAdd(this.bag, new THREE.TorusGeometry(0.06, 0.006, 6, 16, Math.PI), gbMat('#7a5636', { rough: 0.8 }), sx * 0.045, -0.02, 0, { rz: 0 });
    gbAdd(this.bag, new THREE.SphereGeometry(0.07, 10, 8), gbMat('#d9c45a', { rough: 0.6 }), 0.05, -0.02, 0.0);    // a loaf / fruit peeking out
    gbAdd(this.bag, gbCapsule(0.035, 0.16, 4, 8), gbMat('#c8874a', { rough: 0.7 }), -0.06, 0.02, 0, { rz: 0.3 });
  }

  _pigeons() {
    const S = this.app.scene, body = gbMat('#7f8296', { rough: 0.8, rim: 0.6, name: 'gbPigeon' }), dark = gbMat('#4b4d5e', { rough: 0.8, rim: 0.5 }), beak = gbMat('#d9a05a', { rough: 0.6 });
    const wingG = (() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(0.2, -0.03); s.lineTo(0.27, -0.09); s.lineTo(0.1, -0.11); s.lineTo(0, -0.08); return new THREE.ShapeGeometry(s); })();
    this.pigeons = [];
    for (let i = 0; i < 7; i++) {
      const g = new THREE.Group(); S.add(g);
      gbAdd(g, new THREE.SphereGeometry(1, 12, 8), body, 0, 0, 0, { s: [0.075, 0.075, 0.13] });
      gbAdd(g, new THREE.SphereGeometry(1, 10, 8), dark, 0, 0.07, 0.1, { s: [0.045, 0.045, 0.05] });
      gbAdd(g, new THREE.ConeGeometry(0.012, 0.03, 6), beak, 0, 0.065, 0.155, { rx: Math.PI / 2 });
      gbAdd(g, new THREE.ConeGeometry(0.05, 0.12, 6), dark, 0, 0.01, -0.15, { rx: -Math.PI / 2, s: [1, 1, 0.4] });
      const wl = new THREE.Group(), wr = new THREE.Group(); g.add(wl, wr);
      gbAdd(wl, wingG, dark, 0, 0, 0, { rx: Math.PI / 2 }).material = gbMat('#5e6174', { rough: 0.8, rim: 0.5, side: THREE.DoubleSide });
      gbAdd(wr, wingG, dark, 0, 0, 0, { rx: Math.PI / 2, s: [-1, 1, 1] }).material = gbMat('#5e6174', { rough: 0.8, rim: 0.5, side: THREE.DoubleSide });
      wl.position.set(0.04, 0.03, 0.03); wr.position.set(-0.04, 0.03, 0.03);
      this.pigeons.push({ g, wl, wr, i });
    }
  }

  // ------------------------------------------------------------------------------------------ hero
  _mouthPoint(out) {
    const hc = this.hero.face.hc; hc.updateMatrixWorld(true);
    return out.set(0, -0.066, 0.165).applyMatrix4(hc.matrixWorld);
  }

  // the cup's world position at t; held = the hand's weight on it (0…1), clasp = fingers closed (0…1)
  cupState(t, restP) {
    const out = { p: new THREE.Vector3().copy(restP), tilt: 0, held: 0, slosh: 0, clasp: 0, h: 0 };
    const tr = (amp, k = 1) => amp * (0.55 * Math.sin(t * 57 * k) + 0.45 * Math.sin(t * 83 * k + 1));
    // the hand: travels in (reach), closes (grip) BEFORE the cup moves, opens after the set-down, lifts away
    out.held = Ease.inOutSine(MathX.ramp(t, GB.reach[0], GB.reach[1])) * (1 - Ease.inOutSine(MathX.ramp(t, GB.letGo, GB.letGo + 0.55)));
    out.clasp = MathX.smooth(t, GB.grip, GB.grip + 0.2) * (1 - MathX.smooth(t, GB.letGo - 0.05, GB.letGo + 0.15));
    // the lift: it sticks for a beat (the pull builds, the saucer rattles), breaks free, rises slowly to 10 cm,
    // trembling more the longer he holds it; then a careful, slow descent and a soft touch-down
    const H = 0.1;
    let h = 0;
    if (t >= GB.lift + 0.35 && t < GB.top) h = H * Ease.outSine(MathX.ramp(t, GB.lift + 0.35, GB.top));
    else if (t >= GB.top && t < GB.lower) h = H - 0.006 * Math.sin(Math.PI * MathX.ramp(t, GB.top, GB.lower));   // a small sag mid-hold
    else if (t >= GB.lower && t < GB.down) h = H * (1 - Ease.inOutSine(MathX.ramp(t, GB.lower, GB.down)));
    const grow = MathX.ramp(t, GB.lift, GB.top) * 0.6 + 0.4 * MathX.ramp(t, GB.top, GB.lower);
    const fade = 1 - MathX.smooth(t, GB.down - 0.35, GB.down);
    const trem = h > 0.001 ? (0.0018 + 0.0042 * grow) * Math.max(0.35, fade) : 0;
    out.p.y += h + tr(trem);
    out.p.x += h > 0.001 ? tr(trem * 0.7, 1.13) : 0;
    // the stick: the saucer rattles under the pull before it lets go
    if (t >= GB.lift && t < GB.lift + 0.35) out.p.y += 0.0009 * Math.max(0, Math.sin(t * 90));
    // after the set-down a tiny settle (a ceramic clink) and the coffee sloshes
    if (t >= GB.down) out.p.y += Math.abs(Math.sin((t - GB.down) * 40)) * 0.0015 * Math.exp(-(t - GB.down) * 16);
    out.tilt = h > 0.001 ? 0.04 * Math.sin(t * 7) * grow : 0;
    out.slosh = (h > 0.001 ? 0.45 * Math.sin(t * 9) * grow : 0) + (t > GB.down ? 0.6 * Math.exp(-(t - GB.down) * 3) * Math.sin((t - GB.down) * 15) : 0);
    out.h = h;
    return out;
  }

  updateHero(t, show) {
    const H = this.hero, [cx, cz] = GB_SET.heroChair, sink = this.cafe.heroChair.seat.position.y - 0.46;
    H.root.visible = show; this.cup.visible = show;
    if (!show) { this.steam.begin(); this.steam.end(); return null; }
    H.place(cx, sink, cz, Math.PI / 2);
    const P = gbEvalTrack(GB_HERO_POSES(), GB_POSES, t);
    // breathing: slow before; deeper and a little faster after the doubling (his chest now weighs twice as much)
    const after = MathX.smooth(t, GB.g, GB.g + 0.6);
    const br = Math.sin(t * Math.PI * 2 * (0.24 + 0.08 * after)) * (1.0 + 0.9 * after);
    P.chX = (P.chX || 0) - br * 0.8; P.hdX = (P.hdX || 0) + br * 0.4; P.LShrug = (P.LShrug || 0) + br * 0.002; P.RShrug = (P.RShrug || 0) + br * 0.002;
    // the doubling: a small sink into the chair (springs, not a collapse)
    P.spX += gbSpring(t, GB.g + 0.02, 2.5, 2.4, 4.5); P.hdX += gbSpring(t, GB.g + 0.06, 3.5, 2.2, 3.6);
    P.rootY += -gbSpring(t, GB.g, 0.008, 4, 5);
    // effort tremble through the arms and shoulders while the cup is up
    const eff = MathX.window(t, GB.lift, GB.down, 0.3, 0.3);
    for (const k of ['RShX', 'RElX', 'LShX', 'spX', 'hdZ']) P[k] = (P[k] || 0) + eff * (1.0 * Math.sin(t * 53 + k.length) + 0.7 * Math.sin(t * 71 + k.length * 2));
    // the reach leans him in; the pull hunches the right shoulder; the bracing arm pushes down (left shoulder up)
    const rch = MathX.window(t, GB.reach[0], GB.lift + 0.2, 0.35, 0.3);
    P.chX += 3 * rch; P.hdX += 3 * rch;
    P.RShrug += 0.016 * eff; P.LShrug += 0.01 * eff;
    // relief: the shoulders drop on the exhale after the cup is down
    const rel = MathX.window(t, GB.down + 0.1, GB.exp + 0.5, 0.4, 0.3);
    P.LShrug -= 0.012 * rel; P.RShrug -= 0.012 * rel; P.hdX += 3 * rel;
    H.applyPose(P);
    // the cup and the hands (IK): the right hand on the handle when held; the left hand rests, then braces flat
    const v = this.tmp, [tx, tz] = GB_SET.heroTable, rest = v[0].set(tx - 0.22, GB_SET.tableH + 0.008, tz + 0.12);
    const C = this.cupState(t, rest);
    this.cup.position.copy(C.p);
    this.cup.rotation.set(0, -0.3, 0);
    this.cup.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), C.tilt);
    this.cup.userData.surf.rotation.set(-Math.PI / 2 + C.slosh * 0.2, 0, C.slosh * 0.1);
    this.cup.updateMatrixWorld(true);
    const cq = this.cup.getWorldQuaternion(new THREE.Quaternion());
    const gripW = v[3].copy(GB_GRIP_WRIST).applyMatrix4(this.cup.matrixWorld);
    const Fg = new THREE.Vector3(1, 0, 0).applyQuaternion(cq), Ng = new THREE.Vector3(0, 0, -1).applyQuaternion(cq);
    const hdir = new THREE.Vector3(0, 0, 1).applyQuaternion(cq);
    const restR = new THREE.Vector3(tx - 0.3, GB_SET.tableH + 0.05, tz + 0.2);
    const w = C.held;
    const pre = gripW.clone().addScaledVector(hdir, 0.05).add(new THREE.Vector3(0, 0.035, 0));
    let wristT;
    if (w < 0.72) { const k = w / 0.72, mid = restR.clone().lerp(pre, 0.5).add(new THREE.Vector3(0, 0.08, 0));
      wristT = new THREE.Vector3().copy(restR).multiplyScalar((1 - k) * (1 - k)).addScaledVector(mid, 2 * k * (1 - k)).addScaledVector(pre, k * k); }
    else wristT = pre.clone().lerp(gripW, Ease.outCubic((w - 0.72) / 0.28));
    const Lrest = new THREE.Vector3(tx - 0.2, GB_SET.tableH + 0.045, tz - 0.18);
    const wB = MathX.smooth(t, GB.reach[0] - 0.3, GB.reach[0] + 0.1) * (1 - MathX.smooth(t, GB.letGo + 0.2, GB.letGo + 0.8));
    const FB = new THREE.Vector3(1, 0, -0.25).normalize(), NB = new THREE.Vector3(0, -1, 0);
    const press = 0.004 * eff;
    const Lb = new THREE.Vector3(tx - 0.22, GB_SET.tableH + 0.03 - press, tz - 0.05).addScaledVector(FB, -0.05);
    const Lw = Lrest.clone().lerp(Lb, wB);
    H.solveArm('R', wristT, new THREE.Vector3(-0.35, -1, 0.45).normalize(), 1);
    H.solveArm('L', Lw, new THREE.Vector3(0.2, -1, -0.8 + 0.6 * wB).normalize(), 0.85 + 0.15 * wB);
    const open = MathX.smooth(w, 0.05, 0.4), clasp = C.clasp;
    const curl = MathX.lerp(MathX.lerp(0.35, 0.04, open), 0.66, clasp), thumb = MathX.lerp(MathX.lerp(0.3, 0.05, open), 0.62, clasp);
    // fingers whiten their grip while the cup is up (a little more curl)
    const curl2 = curl + 0.05 * eff;
    H.handR.fingers.forEach(([f1, f2], i) => { const k = curl2 * (1 + i * 0.06); f1.rotation.z = -H.handR.pn * k * 1.45; f2.rotation.z = -H.handR.pn * k * 1.5; });
    H.handR.t1.rotation.set(0.2, 0, -H.handR.pn * (0.35 + thumb * 0.6)); H.handR.t2.rotation.z = -H.handR.pn * thumb * 0.9;
    H.J.RWr.rotation.set(0.15, 0, 0.2);
    H.orientHand('R', Fg, Ng, MathX.smooth(w, 0.25, 0.9));
    H.J.LWr.rotation.set(0.25, -0.2, -0.15);
    if (wB > 0.001) H.orientHand('L', FB, NB, wB);
    H.handL.fingers.forEach(([f1, f2], i) => { const k = (0.35 - 0.3 * wB) * (1 + i * 0.06); f1.rotation.z = -H.handL.pn * k * 1.45; f2.rotation.z = -H.handL.pn * k * 1.5; });
    // face + eyes: on the cup from the reach; up at nothing in particular before
    const F = gbEvalTrack(GB_HERO_FACES(), GB_FACES, t);
    const blinks = [1.6, GB.g + 0.55, GB.room + 1.2, GB.reach[0] - 0.4, GB.down + 0.15, GB.letGo + 0.7];
    F.blink = blinks.reduce((m, b) => Math.max(m, MathX.window(t, b, b + 0.16, 0.06, 0.08)), 0);
    F.glassesDrop = -0.004 * gbSettle(t, GB.g + 0.03, 0.35, 0.4, 3);
    const look = t < GB.reach[0] - 0.6 ? { x: 0.35 - 0.3 * MathX.smooth(t, GB.g, GB.g + 0.4), y: -0.45 + 0.25 * MathX.window(t, GB.room, GB.room + 1.6, 0.4, 0.4) } : H.lookAt(this.cup.position);
    H.applyFace(F, look);
    // steam: thin wisps rising and curling off the coffee (lifted by buoyancy, so they rise a touch faster in 2 g)
    const St = this.steam, sp = this.cup.userData.surf.getWorldPosition(v[1]);
    St.begin(this.app.scene.fog);
    const rate = 1 + 0.4 * MathX.smooth(t, GB.g, GB.g + 1.0);
    for (let i = 0; i < 40; i++) {
      const life = 2.2, ph = ((t * rate) / life + hash1(i * 7)) % 1;
      const yy = ph * 0.2, sw = 0.008 + 0.028 * ph;
      const x = sp.x + Math.sin(t * 1.3 + i * 2.1 + ph * 5) * sw + 0.015 * ph, z = sp.z + Math.cos(t * 1.1 + i * 1.7 + ph * 4) * sw;
      // thin and low: wisps, never a cloud in front of his face (fades out by 20 cm; almost gone while the cup is up)
      const a = 0.085 * Math.sin(Math.PI * ph) * (0.5 + 0.5 * hash1(i * 3)) * (1 - 0.8 * Math.min(1, C.h * 20));
      St.push(x, sp.y + 0.01 + yy, z, 0.016 + 0.045 * ph, hash1(i) * 6 + t * 0.4, a, 1, 1.0, 0.95, 0.9);
    }
    St.end();
    return C;
  }

  // ------------------------------------------------------------------------------------------ waiter (behind the counter)
  updateWaiter(t, show) {
    const W = this.waiter; W.root.visible = show;
    if (!show) return;
    W.place(4.62, 0, 0.35, -Math.PI / 2);
    const P = gbEvalTrack([[0, 'counterLean', 0.01], [GB.g + 0.05, 'counterSag', 0.45, 'outQuad']], GB_POSES, t);
    P.spX += gbSpring(t, GB.g + 0.08, 4, 2.2, 4);
    P.chX = (P.chX || 0) + Math.sin(t * 1.4) * 1.2;
    W.applyPose(P);
    W.applyFace(gbEvalTrack([[0, 'content', 0.01], [GB.g + 0.1, 'surprise', 0.12], [GB.g + 0.8, 'worried', 0.5]], GB_FACES, t), { x: 0.2, y: -0.2 });
  }

  // ------------------------------------------------------------------------------------------ outside
  // the bench man's pose at t (and where his right hand is aiming on the car)
  _benchPose(t) {
    const R1 = GB.rise1, R2 = GB.rise2, ST = GB.step;
    const keys = [
      [0, 'benchSit', 0.01],
      [R1[0] - 0.6, 'benchLean', 0.6, 'inOutSine'],
      [R1[0], 'benchPush', 0.7, 'inOutCubic'],          // attempt 1: hips come up a few cm…
      [R1[0] + 1.25, 'benchLean', 0.45, 'inQuad'],       // …and drop back onto the seat
      [R1[1] - 0.5, 'benchSit', 0.9, 'inOutSine'],
      [R2[0] - 0.7, 'benchLean', 0.6, 'inOutSine'],      // attempt 2: lean, the right hand goes out to the car's wing
      [R2[0], 'benchPush', 0.55, 'inOutCubic'],
      [R2[0] + 0.7, 'benchHalf', 0.9, 'inOutSine'],      // pushing on the car, he comes up over his feet
      [R2[0] + 1.6, 'standBrace', 0.9, 'inOutSine'],
      [ST[0] - 0.3, 'standHeavy', 0.6, 'inOutSine'],     // lets go of the car
    ];
    const P = gbEvalTrack(keys, GB_POSES, t);
    // effort tremble while pushing; a heave of the chest after each attempt
    const eff = MathX.window(t, R1[0], R1[0] + 1.4, 0.3, 0.2) + MathX.window(t, R2[0], R2[1] + 0.4, 0.3, 0.4);
    for (const k of ['LKnX', 'RKnX', 'spX', 'RShX', 'LShX']) P[k] = (P[k] || 0) + eff * 1.3 * Math.sin(t * 47 + k.length * 3);
    const br = Math.sin(t * Math.PI * 2 * 0.42) * (1.2 + 1.6 * MathX.window(t, R1[0] + 1.2, R2[0], 0.3, 0.5));
    P.chX = (P.chX || 0) - br; P.hdX = (P.hdX || 0) + br * 0.5;
    // the sit-back thump at the end of attempt 1
    P.spX += gbSpring(t, R1[0] + 1.6, 4, 2.4, 5);
    // the step: the right leg swings forward 30 cm (left foot planted), then the weight moves over it
    const sw = MathX.ramp(t, ST[0], ST[0] + 0.85), wt = Ease.inOutSine(MathX.ramp(t, ST[0] + 0.7, ST[1]));
    const swing = Math.sin(Math.PI * sw);
    P.RHipX += -26 * Ease.inOutSine(sw) + 6 * wt; P.RKnX += 34 * swing; P.RAnX += -10 * swing;
    P.LHipX += 12 * wt; P.LKnX += 4 * swing;
    P.LShX += 10 * swing; P.RShX -= 8 * swing;
    const footZ = 0.43;
    if (t < ST[0]) gbPlant(P, footZ);
    else {
      // left foot stays; the right lands 0.3 m ahead; after landing the pelvis moves over both feet
      const A = gbPlant(Object.assign({}, P), footZ, 'L'), B = gbPlant(Object.assign({}, P), footZ + 0.3, 'R');
      P.rootY = Math.max(A.rootY, B.rootY * wt + A.rootY * (1 - wt)); P.rootZ = A.rootZ * (1 - wt * 0.5) + B.rootZ * wt * 0.5;
      // the swing foot lifts: keep the planted foot's height
      P.rootY = A.rootY + (B.rootY - A.rootY) * wt;
    }
    return P;
  }

  updateOutside(t, show) {
    for (const p of this.outside) p.root.visible = show;
    for (const pg of this.pigeons) pg.g.visible = show;
    this.car.g.visible = show; this.bag.visible = show;
    if (!show) return;
    const after = MathX.smooth(t, GB.g, GB.g + 0.3), v = this.tmp;
    // ---- the car: the push on its front wing while he stands (≈900 N peak: half his doubled weight), then let go
    const R2 = GB.rise2, ST = GB.step;
    const pushSteps = [[R2[0] - 0.05, 650, 0.35], [R2[0] + 0.6, 250, 0.4], [R2[0] + 1.6, -500, 0.6], [ST[0] - 0.3, -400, 0.25]];
    this.carState = this.car.update(t, { pushSteps, refAlpha: this.carRef || 0 });
    // ---- the bench man
    const M = this.benchMan, [bx, bz, by] = GB_SET.bench;
    M.place(bx, 0.0, bz, by);
    const P = this._benchPose(t);
    M.applyPose(P);
    // his right hand on the car's front wing (IK) during attempt 2; both hands on the knees while seated
    this.car.g.updateMatrixWorld(true); this.car.body.updateMatrixWorld(true);
    const wing = v[0].set(GB_CAR.wheelX - 0.02, this.car.belt - 0.04, GB_CAR.W / 2 - 0.12).applyMatrix4(this.car.body.matrixWorld);
    this.wingP = wing.clone();
    const onCar = MathX.smooth(t, R2[0] - 0.55, R2[0] - 0.1) * (1 - MathX.smooth(t, ST[0] - 0.35, ST[0] + 0.05));
    M.root.updateMatrixWorld(true);
    const knee = (s) => M.J[s + 'Kn'].getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.07, 0));
    const seatedHands = 1 - MathX.smooth(t, R2[0] + 0.4, R2[0] + 1.3);
    const onKnee = MathX.window(t, GB.rise1[0] - 0.7, GB.rise1[1], 0.5, 0.5) + MathX.smooth(t, R2[0] - 0.8, R2[0] - 0.3) * seatedHands;
    if (onKnee > 0.01) M.solveArm('L', knee('L'), new THREE.Vector3(0.3, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), by), Math.min(1, onKnee) * 0.9);
    if (onCar > 0.01) M.solveArm('R', wing.clone().add(new THREE.Vector3(0, 0.07, 0)), new THREE.Vector3(-1, -0.6, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), by), onCar);
    else if (onKnee > 0.01) M.solveArm('R', knee('R'), new THREE.Vector3(-0.3, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), by), Math.min(1, onKnee) * 0.9);
    if (onCar > 0.01) M.orientHand('R', new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), GB_SET.car[2] + Math.PI / 2), new THREE.Vector3(0, -1, 0), onCar);
    const MF = gbEvalTrack([[0, 'exhausted', 0.01], [GB.rise1[0], 'strainHard', 0.4], [GB.rise1[0] + 1.3, 'exhausted', 0.4], [R2[0] - 0.3, 'brace', 0.4], [R2[0] + 0.2, 'strainHard', 0.4], [R2[1], 'strain', 0.5], [ST[1] + 0.3, 'worried', 0.6]], GB_FACES, t);
    MF.blink = [GB.out + 1.0, GB.rise1[1] - 0.2, R2[1] + 0.3, ST[1] + 1.2].reduce((m, b) => Math.max(m, MathX.window(t, b, b + 0.16, 0.06, 0.08)), 0);
    M.applyFace(MF, { x: 0, y: -0.3 });
    // ---- the passer-by: feet wide, knees bending and catching, the bag dragging one arm, a step to stay up
    const W = this.shopper, [wx, wz, wy] = GB_SET.shopper || [0.8, -10.6, 2.6];
    W.place(wx, 0, wz, wy);
    const dipT = [GB.world + 1.2, GB.wide2 + 0.9, GB.pull + 1.4];
    const WP = gbEvalTrack([[0, 'shopBrace', 0.01], ...dipT.flatMap((d) => [[d, 'shopDip', 0.55, 'inQuad'], [d + 0.65, 'shopBrace', 0.9, 'outBack']])], GB_POSES, t);
    WP.pelZ = (WP.pelZ || 0) + 4 * Math.sin(t * 1.3); WP.spZ = (WP.spZ || 0) - 3 * Math.sin(t * 1.3 + 0.4);
    WP.RShAbd += 8 * Math.sin(t * 2.1);
    for (const k of ['LKnX', 'RKnX']) WP[k] += 1.5 * Math.sin(t * 41 + k.length);
    gbPlant(WP, 0.0);
    W.applyPose(WP);
    W.applyFace(gbEvalTrack([[0, 'strain', 0.01], ...dipT.flatMap((d) => [[d, 'shock', 0.2], [d + 0.7, 'strain', 0.5]])], GB_FACES, t), { x: 0.2, y: -0.2 });
    // the bag hangs from her left hand
    const hand = W.worldOf('LWr', v[1]);
    this.bag.position.copy(hand).add(new THREE.Vector3(0, -0.07, 0)); this.bag.rotation.set(0.05 * Math.sin(t * 2), wy, 0.06 * Math.sin(t * 1.7));
    // ---- the jogger: sitting on the ground in the background, catching her breath
    const J = this.jogger;
    J.place(...(GB_SET.jogger || [-4.6, -12.0, 0.8]));
    const JP = Object.assign({}, GB_POSES.jogKneel);
    JP.chX += Math.sin(t * Math.PI * 2 * 0.55) * 3;
    J.applyPose(JP);
    J.applyFace(GB_FACES.exhausted, { x: 0, y: -0.4 });
    // ---- pigeons: flattened on the paving; two labour across low and sink
    for (const Pg of this.pigeons) {
      const i = Pg.i, fly = i < 2;
      if (!fly) {
        const px = -2.5 + i * 0.9 + Math.sin(i * 3) * 0.6, pz = -8.6 - (i % 3) * 0.7;
        Pg.g.position.set(px, 0.09 - 0.03 * after, pz); Pg.g.rotation.set(0.15 * after + 0.1 * Math.max(0, Math.sin(t * 0.7 + i * 2)), i * 1.3, 0); Pg.g.scale.set(1 + 0.12 * after, 1 - 0.18 * after, 1);
        Pg.wl.rotation.z = 0.05; Pg.wr.rotation.z = -0.05;
      } else {
        const u = ((t - GB.out + i * 4.5) % 9);
        const x0 = -9 + i * 2, y = 2.4 + i * 0.5 - 0.2 * u - 0.012 * u * u;
        Pg.g.position.set(x0 + 1.9 * u, Math.max(0.4, y) + 0.06 * Math.sin(t * 30), -12.5 - i * 1.5);
        Pg.g.rotation.set(0.2, Math.PI / 2, 0); Pg.g.scale.set(1, 1, 1);
        const fl = Math.sin(t * 34 + i) * 1.1;
        Pg.wl.rotation.z = fl; Pg.wr.rotation.z = -fl;
      }
    }
  }

  update(t, opts) {
    this.updateHero(t, !opts.outside && !opts.exp);
    this.updateWaiter(t, !opts.outside && !opts.exp);
    this.updateOutside(t, opts.outside);
  }
}
