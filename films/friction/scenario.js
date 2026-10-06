/* =====================================================================
   SCENARIO — who and what is where, how fast, and what the drivers do.
   Everything that moves in the friction film is a body in SlideWorld
   (slide.js); this file only sets starting conditions, driver inputs and
   the few scripted holds (you on the lamp post, the man hugging his pole).
   Hero moments come out of the simulation — retune them here
   (node tools in the scratchpad print the event times).
   Coordinates: the avenue runs along z (you walk toward −Z), x ±7 is the
   kerb, the cross street is z −37…−23, the hill climbs from z −44.
   ===================================================================== */

// vehicle dimensions (match js/world/vehicles.js CAR_PROFILES; 'truck' is the film's box truck)
const FR_DIMS = { sedan: [4.72, 1.82], hatch: [4.12, 1.78], suv: [4.78, 1.92], van: [5.3, 2.02], taxi: [4.72, 1.82], pickup: [5.5, 1.98], ev: [4.72, 1.88], truck: [7.6, 2.45] };
const FR_MASS = { sedan: 1450, hatch: 1250, suv: 2050, van: 2300, taxi: 1500, pickup: 2100, ev: 1900, truck: 7800 };
const FR_CDA = { sedan: 0.65, hatch: 0.66, suv: 0.95, van: 1.1, taxi: 0.66, pickup: 1.0, ev: 0.58, truck: 4.8 };
const FR_WHEEL_R = { sedan: 0.33, hatch: 0.31, suv: 0.37, van: 0.36, taxi: 0.33, pickup: 0.39, ev: 0.34, truck: 0.5 };

const FR_POLE = { x: 7.38, z: -16.4 };           // the sign pole you end up hugging (near the kerb)
const FR_HOLD = { x: 7.12, z: -16.1 };           // where you end up: arms round the pole, swung a little toward the road, a foot jammed against the kerb
const FR_WALK = { x: 7.29, z0: -9.4, v: 1.35 };  // your walk before 3.0 s (along the kerb, straight at the sign pole)

// fixed things on the street, shared by the simulation (posts) and the city (geometry)
const FR_STATIC = (() => {
  const S = { lampsR: [], lampsL: [], treesR: [], treesL: [] };
  for (let z = 40; z > -430; z -= 30) if (z < -40 || z > 0) S.lampsR.push(z);
  for (let z = 25; z > -430; z -= 30) if (z < -40 || z > -26) S.lampsL.push(z);
  for (let z = 52; z > -430; z -= 9.5) {
    if (!(z < -12 && z > -62) && !(z < 26 && z > -2)) S.treesR.push(z + ((Math.round(z * 7) % 5) - 2) * 0.25);
    const zl = z + 3;
    if (!(zl < -14 && zl > -60) && !(zl < -1 && zl > -12)) S.treesL.push(zl + ((Math.round(z * 3) % 5) - 2) * 0.2);
  }
  S.masts = [[7.9, -38.2], [-7.9, -21.8], [-9.1, -37.5], [9.1, -22.5]];
  S.bench = { x: 9.3, z: -12.6 };
  S.shelter = { x: -10.2, z: -7.5 };
  return S;
})();

// lane helpers: start (x, z) facing yaw, speed v0, acceleration a from tStart; kinematic until friction goes
function frLane(x, z, yawDeg, v0, a = 0, tStart = 0, vx = 0) {
  const yaw = yawDeg * Math.PI / 180, hx = -Math.sin(yaw), hz = -Math.cos(yaw);
  return (t) => {
    if (t >= FR.tLoss0) return null;
    const τ = Math.max(0, t - tStart), s = v0 * τ + 0.5 * a * τ * τ, v = τ > 0 || v0 ? v0 + a * τ : 0;
    return { x: x + hx * s + vx * t, z: z + hz * s, yaw, vx: hx * v + vx, vz: hz * v, w: 0 };
  };
}

// a car: [id, type, colour, x, z, yawDeg, v0, { a, tStart, actions, steer, horns, vx, kicks, lights }]
const FR_CARS = [
  // the queue at the light beside you: K never gets going — its wheels spin in place from 3.5 s
  ['K', 'ev', '#2f7f86', 5.25, -15.5, 0, 0, { actions: [[0, 'roll'], [3.55, 'gas'], [8.6, 'coast'], [10.2, 'gas'], [13.0, 'coast'], [21.6, 'gas'], [24.4, 'coast'], [25.0, 'gas'], [29.2, 'coast'], [64, 'brake']], horns: [[26.2, 1.4], [29.6, 0.5]] }],
  // the red sedan: comes up behind you at 9 m/s, brakes from 9.5 s (wheels locked) and slides past at 12.6 s, through the junction and up the hill
  ['B1', 'sedan', '#b3261e', 1.75, -16.2 + 9 * 12.6, 0, 9, { actions: [[0, 'roll'], [9.5, 'brake'], [64, 'brake']], horns: [[11.3, 0.9]], steer: [[0, 0], [12.2, 0], [12.8, -0.3], [15, -0.3], [16, 0]] }],
  // the SUV rolling down the hill: brakes and steers hard right from 9 s, goes straight
  ['B2', 'suv', '#2b3138', -1.75, -122, 180, 2.2, { actions: [[0, 'roll'], [3.6, 'brake'], [64, 'brake']], steer: [[0, 0], [8.8, 0], [9.6, 0.55], [17, 0.55], [18, 0.1]], horns: [[13.4, 0.6]] }],
  // the taxi on the cross street: was slowing for its red, slides through it
  ['C1', 'taxi', '#e8b419', -85.3, -28.25, -90, 6, { actions: [[0, 'roll'], [3.4, 'brake'], [64, 'brake']], steer: [[0, 0], [12.5, 0], [13.2, -0.5], [20, -0.5]] }],
  // the box truck: just through the junction at 0 s, climbing at 15 m/s with a slight drift right (lane change)
  ['T', 'truck', '#d9d6cc', 2.1, -35, 0, 17, { vx: 0.13, actions: [[0, 'roll'], [3.5, 'brake'], [64, 'brake']], horns: [[14.8, 1.2]] }],
  // a car from behind in the inside lane, coasting at 8 m/s since 3 s: glides past stuck K at ~25 s
  ['B4', 'ev', '#5b6f8f', 1.75, -16.8 + 8 * 22, 0, 8, { actions: [[0, 'roll'], [3.6, 'coast'], [20.5, 'brake'], [64, 'brake']], horns: [[23.6, 0.8]] }],
];

// parked cars on the hill: right lane heading uphill (rear to the bollards), left lane heading downhill (front to the bollards)
const FR_PARKED = (() => {
  const out = [], types = ['sedan', 'hatch', 'suv', 'sedan', 'ev', 'hatch', 'van'], cols = ['#8a8f96', '#3d5a80', '#ece9e2', '#6b2d2d', '#1f2a36', '#a9a37e', '#d0d3d6'];
  let z = -49.1;
  for (let i = 0; i < 7; i++) { const ty = types[i], L = FR_DIMS[ty][0]; out.push(['P' + (i + 1), ty, cols[i], 5.82, z - L / 2, 0]); z -= L + 0.9 + (i % 3) * 0.35; }
  const tl = ['hatch', 'sedan', 'pickup', 'ev', 'sedan'], cl = ['#c3c6c8', '#2d4d3f', '#7b8088', '#f2f0ea', '#4b3f6b'];
  z = -49.1;
  for (let i = 0; i < 5; i++) { const ty = tl[i], L = FR_DIMS[ty][0]; out.push(['Q' + (i + 1), ty, cl[i], -5.82, z - L / 2, 180]); z -= L + 1.0 + (i % 2) * 0.4; }
  return out;
})();

// people: [id, look, x, z, faceDeg, speed, { stateful details are in cast.js }]
const FR_PEOPLE = [
  ['W1', 'casual6', 9.65, -12.4, 0, 1.45],        // walking ahead of you; slips onto her back at 3.15 and glides on
  ['W2', 'casual2', 10.55, -25.2, 180, 1.3],      // walking toward you; windmills, drops to his knees at 3.4 and slides past
  ['W3', 'casual4', 8.66, -22.1, -48, 0],        // waiting at the corner by the signal mast; tries a step at 6.2, slides down the mast
  ['J', 'casual3', -10.15, -2.0, 0, 3.1],         // jogging across the road; goes down at 3.3 and slides into the junction
  ['W5', 'casual1', -11.7, -15.4, 0, 0],          // standing across the road by the shops; tries to walk at 9.0
  ['W6', 'casual8', -8.45, -22.0, -110, 0],       // the far corner, holding the signal mast
  ['W7', 'casual7', 11.2, -1.5, 180, 0],          // behind you near the shops (seen later)
];

// loose things: [id, kind, x, z, opts]
const FR_PROPS = [
  // café chairs high on the right-hand sidewalk: free, they start down the hill at 3.0 s
  ['ch1', 'chair', 9.2, -101.0], ['ch2', 'chair', 9.9, -102.4], ['ch3', 'chair', 8.7, -103.6], ['ch4', 'chair', 9.6, -105.1],
  // the cart corral (front rail holds them), the bike rack (holds the bikes), bins chained to posts, pipes behind a fence
  ['ca1', 'cart', 10.9, -57.6], ['ca2', 'cart', 10.9, -58.5], ['ca3', 'cart', 10.9, -59.4], ['ca4', 'cart', 11.75, -57.6], ['ca5', 'cart', 11.75, -58.5],
  ['bk1', 'bike', 11.6, -64.2], ['bk2', 'bike', 11.6, -65.1], ['bk3', 'bike', 11.6, -66.0],
  ['bn1', 'bin', 7.95, -70.3], ['bn2', 'bin', 7.95, -88.3], ['bn3', 'bin', -7.95, -60.3],
  ['pp1', 'pipe', 10.6, -78.4], ['pp2', 'pipe', 11.25, -78.4], ['pp3', 'pipe', 10.92, -78.9],
  // cargo inside the truck (behind its roll-up door)
  ['rc1', 'cage', 0, 0, { cargo: [-2.6, 0.2], kick: [0.9, 0.6] }],
  ['bx1', 'box', 0, 0, { cargo: [-2.0, -0.55] }], ['bx2', 'box', 0, 0, { cargo: [-2.0, 0.55] }], ['bx3', 'box', 0, 0, { cargo: [-2.85, -0.5] }], ['bx4', 'box', 0, 0, { cargo: [-2.85, 0.5] }], ['bx5', 'box', 0, 0, { cargo: [-1.15, 0.0] }],
  // your phone: in your left hand until 3.05 s
  ['phone', 'phone', 0, 0],
];
const FR_PROP_SPEC = {
  chair: { m: 4.5, r: 0.28, CdA: 0.24, e: 0.25 },
  cart: { m: 24, r: 0.42, CdA: 0.32, e: 0.2 },
  bike: { m: 14, circles: [[0.45, 0, 0.32], [-0.45, 0, 0.32]], CdA: 0.4, e: 0.2 },
  bin: { m: 16, r: 0.32, CdA: 0.42, e: 0.2 },
  pipe: { m: 70, circles: [[1.6, 0, 0.16], [0.55, 0, 0.16], [-0.55, 0, 0.16], [-1.6, 0, 0.16]], CdA: 0.3, e: 0.15 },
  box: { m: 22, r: 0.36, CdA: 0.36, e: 0.12 },
  phone: { m: 0.2, r: 0.07, CdA: 0.006, e: 0.3 },
  cage: { m: 95, r: 0.42, CdA: 0.6, e: 0.15 },
};

// what the truck's hit at ~31 s shakes loose on the hill sidewalk: id → [time, dvx, dvz, dw]
const FR_RELEASE = {
  ca2: [31.55, -0.2, 0.9, 0.4], ca3: [31.7, 0.1, 0.7, -0.3], ca4: [31.62, -0.4, 1.1, 0.6], ca5: [31.85, -0.1, 0.8, 0.2],
  bk1: [31.5, -0.3, 0.6, 0.8], bk2: [31.65, -0.2, 0.5, -0.6], bk3: [31.8, -0.4, 0.7, 0.5],
  pp1: [31.75, -0.2, 0.5, 0.1], pp2: [31.9, -0.1, 0.4, -0.08], pp3: [32.05, -0.3, 0.6, 0.15],
  bn1: [31.6, -0.6, 0.4, 0.3], bn2: [32.2, -0.5, 0.5, -0.2], bn3: [32.6, 0.6, 0.5, 0.2],
};
// (authoring clock) a little extra turn for some of the sliders from their late bumps: id → rad/s
const FR_SPIN = { P1: -0.139, P2: 0.155, B4: 0.152, P7: -0.109, Q4: 0.144, Q3: -0.133, P6: 0.149 };
// the hero cart that knocks you loose: [t, x, z, vx, vz] waypoints (Hermite), released at the end into the simulation
const FR_KNOCK = { id: 'ca1', path: [
  [31.4, 10.9, -57.6, -0.3, 1.2], [35.3, 9.5, -44.0, -0.5, 5.2], [37.9, 7.6, -30.0, -0.5, 5.6],
  [39.4, 6.62, -22.0, -0.12, 5.0], [40.7, 6.52, -17.2, 0.3, 4.2]] };
function frPathAt(P, t, yaw0) {
  let i = 0; while (i < P.length - 2 && t > P[i + 1][0]) i++;
  const a = P[i], b = P[i + 1], T = b[0] - a[0], u = Math.max(0, Math.min(1, (t - a[0]) / T)), u2 = u * u, u3 = u2 * u;
  const h = (p, q, vp, vq) => (2 * u3 - 3 * u2 + 1) * p + (u3 - 2 * u2 + u) * T * vp + (-2 * u3 + 3 * u2) * q + (u3 - u2) * T * vq;
  return { x: h(a[1], b[1], a[3], b[3]), z: h(a[2], b[2], a[4], b[4]), yaw: yaw0 + 0.55 * (t - P[0][0]) };
}

/* --------------------------------------------------------------------- */
function frBuildWorld() {
  const W = new SlideWorld({ end: FR.end });
  const G = FrGround, H = G.half, F = G.front, J0 = G.junction[0], J1 = G.junction[1];
  // ---- kerbs (one-way for loose things, solid for cars) and building fronts ----
  for (const s of [-1, 1]) {
    W.wall('kerbNear' + s, s * H, 260, s * H, J1, { oneWay: true, toward: [-s, 0] });
    W.wall('kerbHill' + s, s * H, J0, s * H, -420, { oneWay: true, toward: [-s, 0] });
    W.wall('kerbX1' + s, s * H, J1, s * 220, J1, { oneWay: true, toward: [0, -1] });
    W.wall('kerbX0' + s, s * 220, J0, s * H, J0, { oneWay: true, toward: [0, 1] });
    W.wall('frontNear' + s, s * F, 260, s * F, J1 + 5.5);
    W.wall('frontHill' + s, s * F, J0 - 5.5, s * F, -420);
    W.wall('frontX1' + s, s * F, J1 + 5.5, s * 220, J1 + 5.5, { toward: [0, -1] });
    W.wall('frontX0' + s, s * 220, J0 - 5.5, s * F, J0 - 5.5, { toward: [0, 1] });
  }
  // ---- posts: lamp posts, the pole you hold, signal poles, trees, bollards (breakable), chain posts ----
  W.post('pole', FR_POLE.x, FR_POLE.z, 0.05);
  for (const [x, z] of FR_STATIC.masts) W.post('mast' + x + z, x, z, 0.19);
  // (lamp posts on your block snap if a car hits them hard; the hill's are heavier, set in concrete)
  for (const z of FR_STATIC.lampsR) W.post('lampR' + z, 7.45, z, 0.1, z > -40 ? { breakJ: 9000 } : {});
  for (const z of FR_STATIC.lampsL) W.post('lampL' + z, -7.45, z, 0.1, z > -40 ? { breakJ: 9000 } : {});
  for (const z of FR_STATIC.treesR) W.post('treeR' + z, 8.15, z, 0.16);
  for (const z of FR_STATIC.treesL) W.post('treeL' + z, -8.15, z, 0.16);
  // the bollards at the foot of each parking lane: two posts, joined by a bar the cars rest on (they break together)
  for (const s of [-1, 1]) {
    // (the truck's hit shears the right-hand ones: the shock runs down the stack)
    W.wall('bollards' + s, s * 4.62, -48.45, s * 7.0, -48.45, s > 0 ? { breakIf: (w, t) => w.byId.T.bigHit + 0.2 <= t } : {});
  }
  // the bench behind you, the bus shelter across the road, newspaper boxes (bolted)
  { const b = FR_STATIC.bench, o = { cars: false, e: 0 }; W.wall('bench', b.x - 0.25, b.z - 0.95, b.x - 0.25, b.z + 0.95, o); W.wall('benchB', b.x - 0.25, b.z + 0.95, b.x + 0.25, b.z + 0.95, o); W.wall('benchF', b.x + 0.25, b.z - 0.95, b.x - 0.25, b.z - 0.95, o); W.wall('benchR', b.x + 0.25, b.z + 0.95, b.x + 0.25, b.z - 0.95, o); }

  // ---- cars ----
  const car = (id, ty, x, z, yawDeg, v0, o = {}) => {
    const [L, Wd] = FR_DIMS[ty];
    return W.add({ id, kind: 'car', m: FR_MASS[ty], L, W: Wd, CdA: FR_CDA[ty], e: 0.15, curbs: ty === 'truck' ? 'none' : 'both',
      x, z, yaw: yawDeg * Math.PI / 180, drive: v0 || o.a ? frLane(x, z, yawDeg, v0, o.a || 0, o.tStart || 0, o.vx || 0) : null,
      wheels: { r: FR_WHEEL_R[ty], actions: o.actions || [[0, 'roll']], gasRate: 50 }, kicks: o.kicks || [], stopAfterReturn: o.stopAfterReturn });
  };
  for (const [id, ty, , x, z, yaw, v0, o] of FR_CARS) car(id, ty, x, z, yaw, v0, o);
  for (const [id, ty, , x, z, yaw] of FR_PARKED) car(id, ty, x, z, yaw, 0, { actions: [[0, 'brake']] });

  // ---- people ----
  for (const [id, , x, z, face, v] of FR_PEOPLE) {
    const o = { id, kind: 'person', m: 72, r: 0.3, CdA: 0.55, e: 0.12, x, z, yaw: face * Math.PI / 180 };
    if (v) o.drive = frLane(x, z, face, v);
    W.add(o);
  }
  // slips change speed a little (feet shooting out), and the man at the corner and the woman across hold their poles
  W.byId.W1.kicks.push([3.15, 0, 0.15]);
  W.byId.W2.kicks.push([3.4, 0, -0.32]);
  W.byId.J.kicks.push([3.3, 0.15, 0.25]);
  W.byId.W3.hold.push([6.2, 80, () => ({ x: 8.66, z: -22.1, yaw: -48 * Math.PI / 180 }), { breakJ: 300 }]);
  W.byId.W6.hold.push([3.4, 80, () => ({ x: -8.45, z: -22.0, yaw: -110 * Math.PI / 180 })]);

  // the late knocks between sliders far down the avenue leave several of them turning slowly — sideways when friction returns
  for (const [id, dw] of Object.entries(FR_SPIN)) if (W.byId[id]) W.byId[id].kicks.push([51.5, 0, 0, dw]);

  // ---- you ----
  const me = W.add({ id: 'me', kind: 'pov', m: 75, r: 0.3, CdA: 0.6, e: 0.1, x: FR_WALK.x, z: FR_WALK.z0, yaw: 0, drive: frLane(FR_WALK.x, FR_WALK.z0, 0, FR_WALK.v) });
  me.kicks.push([3.0, 0, 0.1]);                  // the slip costs a little speed
  // ~5.06 s (authoring clock): you glide chest-first into the sign pole, almost head-on, and wrap your arms round it. The small
  // offset leaves you turning slowly round the pole toward the road until your foot jams against the kerb face (~0.6 s later).
  const tc = 5.06, pc = { x: FR_WALK.x, z: FR_POLE.z + 0.38 }, P0 = FR_POLE;
  const ang = (p) => Math.atan2(p.x - P0.x, p.z - P0.z), rad = (p) => Math.hypot(p.x - P0.x, p.z - P0.z);
  const a0 = ang({ x: pc.x, z: pc.z - 0.07 }), a1 = ang(FR_HOLD), r0 = rad({ x: pc.x, z: pc.z - 0.07 }), r1 = rad(FR_HOLD);
  // (your grip holds against bumps; a real hit tears you loose)
  me.hold.push([tc, 80, (t) => {
    if (t < tc + 0.1) { const u = (t - tc) / 0.1; return { x: pc.x, z: pc.z - 0.07 * (2 * u - u * u), yaw: 0 }; }   // the chest takes the hit
    const u = Math.min(1, (t - tc - 0.1) / 0.6), e = 1 - (1 - u) * (1 - u), A = a0 + (a1 - a0) * e, R = r0 + (r1 - r0) * e;
    return { x: P0.x + Math.sin(A) * R, z: P0.z + Math.cos(A) * R, yaw: (A - a0) };
  }, { breakJ: 60 }]);

  // ---- props ----
  const T = W.byId.T;
  T.bigHitJ = 9000;                               // the hit that bursts the roll-up door
  for (const [id, kind, x, z, o = {}] of FR_PROPS) {
    const S = FR_PROP_SPEC[kind];
    const spec = Object.assign({ id, kind: kind === 'phone' ? 'disc' : 'disc', x, z, yaw: kind === 'bike' ? Math.PI / 2 : kind === 'pipe' ? 0 : 0 }, S);
    if (o.cargo) {
      // rides in the truck (held by the closed door) until the door bursts open
      const [lx, lz] = o.cargo;
      spec.drive = null; spec.ride = { body: 'T', lx, lz };
      spec.hold = [[0, 80, (t) => { const s = frTruckAt(W, t); return { x: s.x - Math.sin(s.yaw) * lx + Math.cos(s.yaw) * lz, z: s.z - Math.cos(s.yaw) * lx - Math.sin(s.yaw) * lz, yaw: s.yaw }; },
        { until: (w, t) => w.byId.T.bigHit + 0.12 <= t, kick: o.kick }]];
      // inside the truck they touch nothing; once the door bursts they slide out the back
      spec.ghostSim = true;            // (this ghost reads the simulation's own clock)
      spec.ghost = (t, other) => { const h = W.byId.T.bigHit; return !(h + 0.12 <= t) ? true : (other.id === 'T' && t < h + 1.6) || ((other.id.startsWith('bx') || other.id === 'rc1') && t < h + 0.5); };
    }
    // chained, racked, corralled or fenced: held in place until something hits them hard enough
    const tether = { bin: 1500, bike: 1100, cart: 1400, pipe: 4500 }[kind];
    if (tether) {
      // held until the truck's hit shakes the hill loose (the corral rail, the rack, the chains, the fence give way), or something hits them
      const rel = FR_RELEASE[id];
      spec.hold = [[0, rel ? rel[0] : 80, () => ({ x, z, yaw: spec.yaw }), { breakJ: tether }]];
      if (rel) spec.kicks = [[rel[0], rel[1], rel[2], rel[3] || 0]];
    }
    if (id === FR_KNOCK.id) {
      // the hero cart: out of the corral, down the hill sidewalk, across the junction, over your kerb and into you —
      // a scripted path (it touches nothing else on the way), then the simulation takes over for the hit
      const K = FR_KNOCK;
      spec.hold = [[0, K.path[0][0], () => ({ x, z, yaw: spec.yaw })], [K.path[0][0], K.path[K.path.length - 1][0], (t) => frPathAt(K.path, t, spec.yaw)]];
      spec.kicks = [];
      spec.ghost = (t, other) => t > K.path[0][0] - 0.01 && t < K.path[K.path.length - 1][0] && other.id !== 'me';
    }
    if (kind === 'phone') {
      // in your hand until 3.05 s, then it squirts forward out of your grip
      spec.drive = (t) => (t < 3.05 ? { x: FR_WALK.x - 0.22, z: FR_WALK.z0 - FR_WALK.v * t - 0.35, yaw: 0, vx: 0, vz: -FR_WALK.v, w: 0 } : null);
      spec.kicks = [[3.05, -0.32, -0.75, 3.0]];
      spec.ghost = (t, other) => other.id === 'me';
    }
    W.add(spec);
  }
  void T;
  // everything above is written on the authoring clock (friction gone at FR.tLoss0); the film runs FR.shift earlier
  const SH = FR.shift;
  for (const b of W.bodies) {
    if (b.drive) { const d = b.drive; b.drive = (t) => d(t + SH); }
    b.kicks = b.kicks.map(([t, ...r]) => [t - SH, ...r]);
    b.hold = b.hold.map(([t0, t1, fn, o]) => [t0 - SH, t1 - SH, (t) => fn(t + SH), o]);
    if (b.wheels) b.wheels.actions = b.wheels.actions.map(([t, a]) => [t - SH, a]);
    if (b.ghost && !b.ghostSim) { const g = b.ghost; b.ghost = (t, o) => g(t + SH, o); }
  }
  return W;
}

// where the truck is (used by its cargo while the door is shut): the simulation's own current state
function frTruckAt(W, t) { const b = W.byId.T; return { x: b.x, z: b.z, yaw: b.yaw }; }

if (typeof module !== 'undefined') module.exports = { FR_KNOCK, FR_RELEASE, FR_STATIC, FR_DIMS, FR_CARS, FR_PARKED, FR_PEOPLE, FR_PROPS, FR_PROP_SPEC, FR_POLE, FR_HOLD, FR_WALK, frBuildWorld, frLane };
