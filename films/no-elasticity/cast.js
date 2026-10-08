/* =====================================================================
   CAST — people on the shared rig (js/world/people.js). Bodies are
   unchanged by the rule (living tissue keeps its elasticity): it is their
   things that fail. The teenager's ball dies; the kid's trampoline mat
   stays stretched; the café sitter's cushion keeps the dent; a running
   club on the footbridge leaves it lower.
   A spec may carry y(t) (feet height) and at(t) (an [x, z] override) for
   people who ride on something that moves (the trampoline mat, the
   sagging footbridge). Every film action is prefixed ne….
   ===================================================================== */

// the story time, for actions keyed to it rather than to their own start (the dribble follows the ball)
let neNow = 0;

Object.assign(LOOKS, {
  neKid:  { skin: 1, build: 'slim', shirt: '#e2a321', sleeves: 'short', pants: '#3d5f8f', shoes: '#d9483b', sole: '#f2efe8', hair: '#5b3a22' },
  neTeen: { skin: 4, build: 'slim', shirt: '#b8412f', sleeves: 'short', pants: '#2e3440', shoes: '#f0ede6', sole: '#e8e4dc', hair: '#111', hat: { type: 'cap', color: '#20252b' } },
  neCafe: { skin: 2, build: 'avg', shirt: '#cdbd9f', sleeves: 'short', pants: '#4a4f5a', shoes: '#3a2c22', sole: '#1c1712', hair: '#3a2618', hairStyle: 'bun', shoulderBag: '#7a5338' },
});

(() => {
  const P0 = () => basePose();
  const arms = (p, l, r, le, re) => { p.lSh = l; p.rSh = r; p.lEl = le; p.rEl = re; };
  const D = NE.dribble;
  Object.assign(ACTIONS, {
    // dribbling with the right hand: the hand meets the ball at the top of each bounce and pushes it down
    neDribble(τ, c) {
      const p = P0(), u = (((neNow - D.t0) / D.P) % 1 + 1) % 1, k = u < 0.45 ? Math.sin(Math.PI * u / 0.45) : 0;
      p.lKnee = p.rKnee = 0.32; p.lHip = [0.28, 0.1]; p.rHip = [0.22, 0.1]; p.hipY = 0.88; p.spine = 0.22; p.neck = 0.2;
      arms(p, [0.5, 0.35], [0.82 - 0.38 * k, 0.12], 0.7, 0.7 - 0.45 * k);
      p.spineRoll = 0.04 * k; p.headYaw = -0.1;
      return p;
    },
    // the bounce doesn't come back up to the hand: reaching down after it
    neReach(τ, c) {
      const p = P0(), k = MathX.smooth(τ, 0, 0.35);
      p.lKnee = p.rKnee = 0.32; p.lHip = [0.28, 0.1]; p.rHip = [0.22, 0.1]; arms(p, [0.5, 0.35], [0.82, 0.12], 0.7, 0.7);
      p.rSh = [0.82 - 0.3 * k, 0.12]; p.rEl = 0.25; p.spine = 0.22 + 0.25 * k; p.neck = 0.2 + 0.25 * k; p.hipY = 0.88 - 0.05 * k;
      return p;
    },
    // standing over the dead ball, staring at it
    neStare(τ, c) {
      const p = P0(), w = Math.sin(τ * 1.2 + c.seed * 4);
      p.spine = 0.2; p.neck = 0.55 + 0.03 * w; p.lKnee = p.rKnee = 0.12;
      arms(p, [0.15, 0.18], [0.25, 0.14], 0.45, 0.6); p.headYaw = 0.12 * w;
      return p;
    },
    // crouched next to the ball, forearms on the knees
    neCrouch(τ, c) {
      const p = P0(), w = Math.sin(τ * 1.4 + c.seed * 3);
      p.hipY = 0.48; p.lHip = [1.75, 0.2]; p.rHip = [1.65, 0.16]; p.lKnee = 2.2; p.rKnee = 2.15; p.lFoot = 0.35; p.rFoot = 0.4;
      p.spine = 0.5 + 0.02 * w; p.neck = 0.5; arms(p, [0.85, 0.15], [0.9, 0.1], 0.9, 0.85);
      return p;
    },
    // a finger pressed into the top of the ball (the dent stays)
    nePoke(τ, c) {
      const p = ACTIONS.neCrouch(τ, c), k = MathX.smooth(τ, 0, 0.18) * (1 - MathX.smooth(τ, 0.55, 0.9));
      p.rSh = [0.9 + 0.35 * k, 0.12 - 0.05 * k]; p.rEl = 0.85 - 0.65 * k; p.spine = 0.5 + 0.18 * k; p.neck = 0.5 + 0.1 * k;
      return p;
    },
    // the kid on the trampoline: ready on the frame, the crouch, the jump, the landing that keeps going down
    neKidReady(τ, c) {
      const p = P0(), w = Math.sin(τ * 3.1 + c.seed * 5);
      p.lKnee = p.rKnee = 0.3 + 0.08 * w; p.lHip = [0.25, 0.1]; p.rHip = [0.25, 0.1]; p.hipY = 0.88 - 0.02 * w; p.spine = 0.18; p.neck = 0.35;
      arms(p, [0.2 + 0.1 * w, 0.3], [0.2 + 0.1 * w, 0.3], 0.5, 0.5);
      return p;
    },
    neKidPrep(τ, c) {
      const p = P0(), k = MathX.smooth(τ, 0, 0.25);
      p.lKnee = p.rKnee = 0.3 + 0.75 * k; p.lHip = [0.25 + 0.6 * k, 0.1]; p.rHip = [0.25 + 0.6 * k, 0.1]; p.hipY = 0.88 - 0.16 * k;
      p.spine = 0.18 + 0.32 * k; p.neck = 0.2; arms(p, [-0.6 * k, 0.15], [-0.6 * k, 0.15], 0.3, 0.3);
      return p;
    },
    neKidAir(τ, c) {
      const p = P0(), k = MathX.smooth(τ, 0, 0.12), tk = Math.sin(Math.PI * MathX.clamp(τ / 0.5, 0, 1));
      p.lKnee = 0.1 + 0.6 * tk; p.rKnee = 0.12 + 0.55 * tk; p.lHip = [0.05 + 0.35 * tk, 0.12]; p.rHip = [0.05 + 0.3 * tk, 0.12];
      p.spine = 0.05; p.neck = -0.05 + 0.3 * tk; arms(p, [2.4 * k, 0.35], [2.5 * k, 0.3], 0.25, 0.25);
      return p;
    },
    // landing: the knees take it, the mat keeps going down under the feet, arms fly forward for balance
    neKidLand(τ, c) {
      const p = P0(), k = Math.sin(Math.PI * MathX.clamp(τ / 0.6, 0, 1)), s = MathX.smooth(τ, 0.3, 0.8);
      p.lKnee = p.rKnee = 0.35 + 0.9 * k; p.lHip = [0.3 + 0.7 * k, 0.15]; p.rHip = [0.3 + 0.65 * k, 0.15]; p.hipY = 0.86 - 0.2 * k;
      p.spine = 0.2 + 0.3 * k; p.neck = 0.3 + 0.25 * s; arms(p, [1.1 * k + 0.4 * s, 0.6], [1.0 * k + 0.4 * s, 0.6], 0.4, 0.4);
      p.headYaw = 0.25 * s * Math.sin(τ * 2.2);
      return p;
    },
    // sitting in the pit the mat has become
    neKidSit(τ, c) {
      const p = ACTIONS.sitGround(τ + 4, c); p.neck = 0.35 + 0.05 * Math.sin(τ * 0.9); p.headYaw = 0.3 * Math.sin(τ * 0.5);
      return p;
    },
    // standing up from the café bench
    neStandUp(τ, c) {
      const k = MathX.smooth(τ, 0, 0.6), p = lerpPose(ACTIONS.sit(0, c), P0(), k), f = Math.sin(Math.PI * k);
      p.spine += 0.45 * f; p.neck += 0.2 * f;
      return p;
    },
    // flinching at the crash, then hands to the head
    neFlinch(τ, c) {
      const p = ACTIONS.recoil(τ, c), k = MathX.smooth(τ, 0.6, 1.2);
      p.rSh = [0.7 + 1.4 * k, 0.25 - 0.1 * k]; p.rEl = 1.5 + 0.6 * k; p.neck = 0.1 * k;
      return p;
    },
  });
  Object.assign(BLEND, { neDribble: 0.2, neReach: 0.15, neStare: 0.5, neCrouch: 0.6, nePoke: 0.12, neKidReady: 0.4, neKidPrep: 0.12, neKidAir: 0.06, neKidLand: 0.05, neKidSit: 0.8,
    neStandUp: 0.1, neFlinch: 0.06 });
})();

// ---------------------------------------------------------------------------------------------------------------------
// who is where
// ---------------------------------------------------------------------------------------------------------------------
// the teenager dribbles at x, z (the ball stays where it died); during the montage they move aside to `aside`, facing the ball
const NE_TEEN = { x: 13.2, z: -5.9, face: 135, aside: [11.75, -6.25], asideFace: -114 };
const NE_KID = { pad: [1.7, 0.2], mid: [0.05, -0.03] };        // trampoline-local stand points (on the pad → the middle)

// the footbridge: a few people walking across, then a running club (16 runners in one bunch) crosses from the left tower
// to the right one at 3.6–4.0 m/s and is gone before the insert ends. A runner's footfalls load the deck harder than
// walking does (taken here as 1.8× their weight on average). Everyone keeps right; paths are straight, speeds constant.
const NE_WALKERS = (() => {
  const B = NE_CITY.bridge, rng = new RNG(4242), out = [], L = B.half + 1.2, T0 = NE.bridge[0];
  const push = (id, look, dir, v, dz, tm, run) => out.push({ id, look, dir, v, dz, tm, t0: tm - L / v, t1: tm + L / v, run, f: run ? 1.8 : 1 });
  // walkers: where they are along the deck when the insert starts
  [[-6.5, 1, 1.25], [3.5, -1, 1.35], [8.0, -1, 1.2], [-9.5, -1, 1.3]].forEach(([x0, dir, v], i) => push(`W${i}`, `casual${1 + i * 3}`, dir, v, dir > 0 ? 0.75 : -0.75, T0 - x0 / (dir * v), false));
  // the runners: in at the left tower between T0 and T0 + 1.1, left to right
  for (let i = 0; i < 16; i++) {
    const te = T0 + 1.1 * (i / 15) + rng.range(-0.08, 0.08), v = rng.range(3.6, 4.0), dz = rng.range(-0.95, 0.95);
    push(`R${i}`, `casual${1 + (i * 5) % 8}`, 1, v, dz, te + L / v, true);
  }
  return out;
})();
// where walker w is along the deck at time t (x), or null when off it
function neWalkerX(w, t) { if (t < w.t0 || t > w.t1) return null; return w.dir * (t - w.tm) * w.v; }
// the load on the deck as midspan deflection (m, real, unexaggerated): about 0.23 mm per person standing at midspan
function neBridgeLoad(t) {
  const H = NE_CITY.bridge.half; let d = 0;
  for (const w of NE_WALKERS) { const x = neWalkerX(w, t); if (x !== null && Math.abs(x) < H) d += 0.00023 * w.f * (1 - (x / H) ** 2); }
  return d;
}
function neBridgeWalker(w) {
  const B = NE_CITY.bridge, L = B.half + 1.2;
  return { id: w.id, look: w.look, path: [[w.t0, -w.dir * L, B.z + w.dz], [w.t1, w.dir * L, B.z + w.dz]], states: [[0, w.run ? 'jog' : 'walk']], stride: w.run ? 2.3 : 1.2 + 0.3 * (w.v - 1.2),
    y: (t, p) => B.deck - neSag(t) * (1 - Math.min(1, (p.x / B.half) ** 2)), show: (t, p) => t > w.t0 && t < w.t1 && Math.abs(p.x) < B.half + 0.3 };
}

function neCastSpecs() {
  const K = NE, TR = NE_TRAMP;
  return [
    // the teenager with the ball (stands still; the ball is beside the right hand)
    { id: 'teen', look: 'neTeen', y: 0.15, path: [[0, NE_TEEN.x, NE_TEEN.z], [5.7, NE_TEEN.x, NE_TEEN.z], [7.4, ...NE_TEEN.aside]], face: NE_TEEN.face,
      faceAt: (t) => (t < 5.7 ? NE_TEEN.face : NE_TEEN.asideFace),
      states: [[-5, 'neDribble'], [1.15, 'neReach'], [1.7, 'neStare'], [2.6, 'neCrouch'], [K.poke, 'nePoke'], [4.5, 'neCrouch'], [5.7, 'walk'], [7.4, 'neCrouch'], [14.6, 'neStare'], [19.0, 'sitGround']] },
    // the kid: beside the trampoline with a parent, then up on its frame, the jump, the landing, a second try, sitting in the pit
    { id: 'kid', look: 'neKid', scale: 0.7, y: 0.15, path: [[0, TR.x + 2.1, TR.z + 1.9]], face: 52,
      states: [[0, 'idle'], [13.0, 'neKidReady'], [K.jump - 0.3, 'neKidPrep'], [K.jump, 'neKidAir'], [K.land, 'neKidLand'], [16.35, 'neKidPrep'], [K.jump2, 'neKidAir'], [K.land2, 'neKidLand'], [17.45, 'neKidSit']],
      at: (t) => {
        if (t < 13.0) return null;
        const [ax, az] = NE_KID.pad, [bx, bz] = NE_KID.mid, k = MathX.clamp((t - K.jump) / (K.land - K.jump), 0, 1);
        return [TR.x + ax + (bx - ax) * k, TR.z + az + (bz - az) * k];
      },
      faceAt: (t) => (t < 13.0 ? 52 : 90),
      y: (t, p, app) => {
        if (t < 13.0) return 0.15;
        const lx = p.x - TR.x, lz = p.z - TR.z, M = app.tramp, pad = M.padTop;
        if (t < K.jump) return pad;
        if (t < K.land) { const T = K.land - K.jump, τ = t - K.jump, y1 = M.surfaceY(NE_KID.mid[0], NE_KID.mid[1], K.land), v0 = (y1 - pad + 0.5 * NE_G * T * T) / T; return pad + v0 * τ - 0.5 * NE_G * τ * τ; }
        const base = M.surfaceY(lx, lz, t);
        if (t > K.jump2 && t < K.land2) { const T = K.land2 - K.jump2, τ = t - K.jump2; return base + (0.5 * NE_G * T) * τ - 0.5 * NE_G * τ * τ; }
        return base;
      } },
    // the parent watching from beside the frame
    { id: 'parent', look: 'casual6', y: 0.15, path: [[0, TR.x + 2.6, TR.z + 2.0]], face: 52,
      states: [[0, 'idle'], [16.05, 'neFlinch'], [17.4, 'handHead'], [19.5, 'look']] },
    // the café sitter: sits on the left cushion, gets up during the insert, walks off along the café front
    { id: 'cafe', look: 'neCafe', y: 0.15, seat: 0.47, face: 90, faceUntil: 10.4, path: [[0, NE_CITY.bench.x - 0.06, NE_CITY.bench.z - 0.52], [9.85, NE_CITY.bench.x - 0.06, NE_CITY.bench.z - 0.52], [10.4, NE_CITY.bench.x - 0.42, NE_CITY.bench.z - 0.52], [11.2, 11.2, 3.5], [20, 11.0, 15]],
      states: [[0, 'sit'], [9.85, 'neStandUp'], [10.4, 'walk']] },
    // the footbridge walkers and runners
    ...NE_WALKERS.map(neBridgeWalker),
    // life around: the far sidewalk, the bus stop, the corners of the junction (they flinch at the crash)
    { id: 'E1', look: 'casual5', y: 0.15, path: [[0, 26.6, -32], [40, 26.6, -3]], states: [[0, 'walk']] },
    { id: 'E2', look: 'casual8', y: 0.15, path: [[0, -9.4, -4], [60, -9.4, -80]], states: [[0, 'walk']] },
    { id: 'E3', look: 'casual7', y: 0.15, path: [[0, -10.4, -70], [70, -10.4, 10]], states: [[0, 'walk']] },
    { id: 'E4', look: 'casual1', y: 0.15, path: [[0, -10.9, -23.2]], face: -90, states: [[0, 'phone'], [53.7, 'neFlinch']] },
    { id: 'E5', look: 'casual2', y: 0.15, path: [[0, 9.3, -60], [46, 9.3, -40.6]], states: [[0, 'walk'], [46, 'idle'], [53.65, 'neFlinch'], [56, 'look']] },
    { id: 'E6', look: 'casual4', y: 0.15, path: [[0, 9.9, -38.8]], face: 80, states: [[0, 'phone'], [53.7, 'neFlinch'], [56.2, 'look']] },
    { id: 'E7', look: 'casual6', y: 0.15, path: [[0, -9.6, -38.6]], face: -80, states: [[0, 'idle'], [53.7, 'neFlinch'], [56.4, 'handHead']] },
  ];
}

class NeCast {
  constructor(app) {
    this.app = app;
    this.people = neCastSpecs().map((s) => { const p = new Person(s, app.scene); if (s.scale) p.root.scale.setScalar(s.scale); return p; });
    this.byId = {}; for (const p of this.people) this.byId[p.spec.id] = p;
    this.teen = this.byId.teen; this.kid = this.byId.kid;
    this.shadows = new BlobShadows(app.scene, this.people.length * 3 + 40);
    this._v = new THREE.Vector3();
  }

  update(t) {
    const app = this.app, B = this.shadows, v = this._v;
    neNow = t;
    B.begin();
    for (const p of this.people) {
      const S = p.spec;
      p.update(t);
      const at = S.at ? S.at(t) : null;
      if (at) p.root.position.x = at[0], p.root.position.z = at[1];
      if (S.faceAt) p.root.rotation.y = Math.PI + MathX.deg(S.faceAt(t));
      if (typeof S.y === 'function') p.root.position.y = S.y(t, p.root.position, app);
      p.root.visible = S.show ? S.show(t, p.root.position) : true;
      p.root.updateMatrixWorld(true);
      if (!p.root.visible) continue;
      // soft contact shadows under pelvis, chest and head (on whatever the feet stand on)
      const gy = p.root.position.y;
      for (const [part, r] of [['hips', 0.42], ['neck', 0.34], ['head', 0.22]]) {
        const w = p.worldOf(part, v), k = MathX.clamp(1 - Math.max(0, w.y - gy) / 1.4, 0, 1);
        if (k > 0.02) B.push(w.x, gy + 0.012, w.z, r * (1.4 - k * 0.5) * (S.scale || 1), 0.5 * k);
      }
    }
    // cars: a soft dark patch under each body (grounds them outside the sun's shadow box)
    for (const c of app.traffic.cars) {
      if (!c.g.visible) continue;
      const ps = c.spec.pose(t);
      B.push(ps.x, neRoadY(ps.z) + 0.015, ps.z, c.W * 1.15, 0.55, c.L * 1.02, ps.yaw);
    }
    B.end();
  }
}
