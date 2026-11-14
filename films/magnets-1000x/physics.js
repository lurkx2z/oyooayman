/* =====================================================================
   PHYSICS — "What if magnets got 1,000 times stronger for 10 seconds?" Every number on screen comes from here.
   STORY time s: seconds after Saturday 28 November 2026, 10:42:00.000 AM, on a river in a northern English town
   (layout.js). THE RULE: from s = 0 to s = 10 every magnet (every permanent magnet and every electromagnet) makes a
   field 1,000 times stronger, as if its magnetism were 1,000 times bigger. Nothing else changes: steel is still steel
   (it can only carry so much magnetism of its own: it saturates), water still pushes back very weakly, and the Earth's
   own field is left alone (1,000 times stronger it would drive huge currents through every long power line).
   THE ONE IMPOSSIBLE THING: the magnets don't destroy themselves. At 1,000 tesla a magnet's two ends squeeze each other
   with B²/2μ₀ ≈ 400 GPa (4 million atmospheres, more than at the centre of the Earth): no material survives that.
   The models (all rough, all stated on screen where they are used):
     the lifting magnet   an electromagnet 1.8 m across, 1 tesla at its face. Its field along its axis (and, as a model,
                          in every direction): B(r) = K·B₀ / (1 + (r/a)²)^1.5 (a = 0.9 m): far away 1/r³, the cube law
     steel                pulled with M·∂B/∂r per kilogram; M = 1.7 MA/m ÷ 7,850 kg/m³ = 216 A·m²/kg once the field is
                          over about 0.25 T (saturated), proportionally less below it (rough)
     your phone           its magnets (speakers, vibration motor, camera lenses, charging ring) together ≈ 0.5 A·m²
                          (rough), 1,000 times = 500: pulled with m·∂B/∂r (it is a magnet itself, not just steel)
     the hospital's MRI   3 tesla in its bore; shielded: far from it the field is ≈ 0.032/r³ T (at 4 m 0.5 mT, the
                          usual "5 gauss line"); the largest B·∇B a patient meets ≈ 7.5 T²/m (a 3 T scanner's safety
                          sheet, rough); water is pushed away with χ·B∇B/μ₀ (χ = −9.05 × 10⁻⁶): it floats at 1,362 T²/m
     the boat             12 t of steel hull (16 t afloat), pulled plate by plate; held back only by the water (side drag,
                          C ≈ 1.2 on 10.4 m² of hull side, plus the water it drags with it); your mum's engine pushes
                          about 1.5 kN away
     the ball             everything steel within reach hits the magnet and stays: a ball packed 45% full, growing from
                          the mass that has arrived. What lands first hits fastest: the bare magnet's face is at
                          1,000 T (608 m/s, 2,200 km/h); the grown ball's surface (2.4 m out) at about 40 T (130 m/s)
     heat                 all the impact energy stays in the steel (460 J/kg·K): the first layer +400 °C, the whole
                          ball about +25 °C on average (rough)
     explosive welding    steel driven together at 200–500 m/s welds (how much of the ball's core welds: a guess)
   ===================================================================== */

const MGP = (() => {
  const P = {
    K: 1000, T: 10, g: 9.81, mu0: 4e-7 * Math.PI,
    a: 0.9, B0: 1.0,                        // the lifting magnet: radius (m), field at its face (T)
    Msat: 1.7e6, rho: 7850, Bs: 0.25,        // steel: saturation magnetisation (A/m), density, the field that saturates it (rough)
    face: 0.3,                               // the magnet's face, from its centre (m)
    tnt: 4.184e6, cSteel: 460, sound: 343,   // J/kg; J/(kg·K); m/s
    phoneM: 0.5, phoneKg: 0.2, phoneGrip: 5, // your phone: its magnets' moment (A·m², rough), its mass; your grip (× its weight)
    mriB0: 3, mriFar: 0.032, mriBdB: 7.5, chiWater: -9.05e-6, frogT: 16, fridge: 0.005,
    boatKg: 16000, boatSteel: 12000, thrust: 1500,
    carKg: 1000, carSteel: 0.6,
    pack: 0.45,                              // how full of steel the ball is
    wharfT: 40,                              // what the wharf was built to carry (t, rough)
    rpm: 14, bladeKg: 10000,                 // the wind turbines
    evV: 22.4, evDecel: 0.75,                // the bridge: 50 mph; locked wheels skid at about 0.75 g
    weldV: 200,                              // m/s: faster impacts weld (explosive welding: 200–500 m/s)
  };
  P.Mk = P.Msat / P.rho;                                             // 216.6 A·m² per kg of steel
  // the lifting magnet's field (T) at distance r (m), and its gradient (T/m); k = how many times stronger
  P.B = (r, k = P.K) => k * P.B0 / Math.pow(1 + (r / P.a) * (r / P.a), 1.5);
  P.G = (r, k = P.K) => 3 * k * P.B0 * r / (P.a * P.a * Math.pow(1 + (r / P.a) * (r / P.a), 2.5));
  // pull on steel, N per kg (saturating)
  P.pull = (r, k = P.K) => P.Mk * Math.min(1, P.B(r, k) / P.Bs) * P.G(r, k);
  // the energy a kilogram of steel gains falling in from far away to distance r (J/kg; saturated: M·B)
  P.potKg = (r, k = P.K) => P.Mk * P.B(r, k);
  P.reach = (gs, k = P.K) => { let lo = 0.3, hi = 80; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (P.pull(m, k) > gs * P.g) lo = m; else hi = m; } return lo; };
  P.reach1 = P.reach(1, 1); P.reachK = P.reach(1);                  // 1.8 m → 14.6 m (where steel is pulled up at 1 g)
  P.vFace = Math.sqrt(2 * P.potKg(P.face));                          // 608 m/s: the first steel onto the bare magnet
  P.kmhFace = P.vFace * 3.6;
  P.tntFace = P.potKg(P.face) / P.tnt * 1000;                       // grams of TNT per kilogram
  P.pressure = Math.pow(P.K * P.B0, 2) / (2 * P.mu0);                // Pa: the magnet's ends squeezing each other
  P.atm = P.pressure / 101325;                                       // ≈ 3.9 million
  P.earthCore = 360e9;
  // the MRI
  P.mriB = P.mriB0 * P.K;                                            // 3,000 T
  P.mriFarB = (r, k = P.K) => k * P.mriFar / (r * r * r);
  P.mriFarG = (r, k = P.K) => 3 * k * P.mriFar / Math.pow(r, 4);
  P.mriPull = (r, k = P.K) => P.Mk * Math.min(1, P.mriFarB(r, k) / P.Bs) * P.mriFarG(r, k);
  P.mriReach = (() => { let lo = 1, hi = 40; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (P.mriPull(m) > P.g) lo = m; else hi = m; } return lo; })();
  P.waterFloat = P.mu0 * 1000 * P.g / -P.chiWater;                   // 1,362 T²/m floats water
  P.patientG = P.mriBdB * P.K * P.K / P.waterFloat;                  // ≈ 5,500 g at the bore's ends
  P.waitR = 10;                                                      // the waiting room's phones, from the bore (m)
  P.waitG = P.phoneM * P.K * P.mriFarG(P.waitR) / P.phoneKg / P.g;  // ≈ 2.4 g
  return P;
})();

// the clock, h:m:s (s = 0 is 10:42:00.000 AM)
function mgClockParts(s) {
  const T = 10 * 3600 + 42 * 60 + s, ms = Math.floor((((T % 1) + 1) % 1) * 1000 + 1e-6), sec = Math.floor(T) % 60, mi = Math.floor(T / 60) % 60, h24 = Math.floor(T / 3600) % 24;
  return { day: 'SATURDAY', h: ((h24 + 11) % 12) + 1, m: mi, sec, ms, pm: h24 >= 12 };
}

const MG_DS = 0.0025;                         // story seconds between stored samples
// a small seeded generator (this file also runs in node, for the numbers)
function mgRand(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// =====================================================================================================================
// THE BOAT: 17.4 m of steel hull, pulled sideways towards the ball; the water holds it back; your mum steers away
// =====================================================================================================================
const MGB = (() => {
  const F = (typeof MG_F !== 'undefined') ? MG_F : require('./layout.js').MG_F;
  const P = MGP, Bt = F.boat, M = F.ballC, n = 12, L = Bt.L, mSeg = P.boatSteel / n;
  // the pull on the hull at (x, z) (centreline), plate by plate (each at the near side's chine, 0.3 m above the water)
  function force(x, z, lift = 0) {
    const Fo = [0, 0, 0];
    for (let i = 0; i < n; i++) {
      for (const [side, w] of [[-1, 0.62], [1, 0.38]]) {
        const px = x - L / 2 + L * (i + 0.5) / n, pz = z + side * Bt.B / 2, py = 0.3 + lift;
        const d = [M[0] - px, M[1] - py, M[2] - pz], r = Math.hypot(d[0], d[1], d[2]), f = P.pull(r) * mSeg * w;
        Fo[0] += f * d[0] / r; Fo[1] += f * d[1] / r; Fo[2] += f * d[2] / r;
      }
    }
    return Fo;
  }
  const mSide = P.boatKg + 14000, mFwd = P.boatKg + 1600, wpA = L * Bt.B * 0.9;   // (with the water it drags along)
  const minZ = F.wharf.z + Bt.B / 2 + 0.25;
  const out = [];
  let x = Bt.x0, z = Bt.z0, vx = Bt.v0, vz = 0, s = 0, heave = 0, vh = 0;
  const dt = 0.0005, thr0 = 0.5 * 1000 * 0.12 * 1.25 * Bt.v0 * Bt.v0;
  let next = 0, maxF = 0, B_hit = null, B_vHit = 0;
  while (s <= P.T + 8) {
    const on = s < P.T, Fo = on ? force(x, z, heave) : [0, 0, 0];
    const drS = 0.5 * 1000 * 1.2 * 10.4 * vz * Math.abs(vz), drF = 0.5 * 1000 * 0.12 * 1.25 * vx * Math.abs(vx);
    // your mum: from 10:42:01 she steers hard away (the engine's full push, sideways at the stern)
    const away = s > 1.0 ? P.thrust * Math.min(1, (s - 1.0) / 0.8) : 0;
    // pinned against the wharf's steel wall: friction (μ ≈ 0.5 on the pull pressing it there) stops it sliding along
    const pinned = on && z <= minZ + 1e-6, fr = pinned ? Math.min(Math.abs(vx) * mFwd / dt, 0.5 * Math.abs(Fo[2])) * Math.sign(vx) : 0;
    vz += (Fo[2] - drS + away) / mSide * dt; vx += (Fo[0] + thr0 - drF - fr - (pinned ? Fo[0] : 0)) / mFwd * dt;
    x += vx * dt; z += vz * dt;
    if (z < minZ) { if (B_hit == null) { B_hit = s; B_vHit = -vz; } z = minZ; vz = Math.max(0, vz); }
    // heave: the vertical pull takes weight off the water (the boat floats higher: 1 kN lifts it 3 mm); a light damping
    const target = Math.min(0.62, Fo[1] / (1000 * P.g * wpA));
    vh += ((target - heave) * 30 - vh * 7) * dt; heave += vh * dt;
    maxF = Math.max(maxF, Math.hypot(Fo[0], Fo[2]));
    while (next <= s + 1e-9) { out.push(x, z, heave, Fo[0], Fo[1], Fo[2], vz); next += MG_DS; }
    s += dt;
  }
  const A = new Float32Array(out), W = 7;
  const at = (s, k) => { if (s <= 0) return [Bt.x0 + Bt.v0 * s, Bt.z0, 0, 0, 0, 0, 0][k]; const q = s / MG_DS, i = Math.floor(q), f = q - i, nn = A.length / W - 1, i0 = Math.min(i, nn), i1 = Math.min(i + 1, nn); return A[i0 * W + k] + (A[i1 * W + k] - A[i0 * W + k]) * f; };
  const B = {
    x: (s) => at(s, 0), z: (s) => at(s, 1), heave: (s) => at(s, 2), Fx: (s) => at(s, 3), Fy: (s) => at(s, 4), Fz: (s) => at(s, 5), vz: (s) => at(s, 6),
    gap: (s) => at(s, 1) - Bt.B / 2 - F.wharf.z,           // the boat's near side to the wharf (m)
    dist: (s) => Math.hypot(at(s, 0) - M[0], at(s, 1) - Bt.B / 2 - M[2]),
    // the heel (rad, + = the near (north) side up): the vertical pull on the near side lifts it (rough)
    heel: (s) => MathXc(at(s, 4) / (P.boatKg * P.g) * 0.16, -0.05, 0.12),
    maxF, hit: B_hit, vHit: B_vHit,
  };
  return B;
})();
function MathXc(x, a, b) { return Math.max(a, Math.min(b, x)); }

// =====================================================================================================================
// THE YARD: everything steel is a body pulled towards the magnet; it hits the ball and stays (until 10:42:10)
// =====================================================================================================================
const MGY = (() => {
  const F = (typeof MG_F !== 'undefined') ? MG_F : require('./layout.js').MG_F;
  const P = MGP, M0 = F.mag0, MB = F.ballC, Y0 = F.wharf.top, rnd = mgRand(20261128);
  // the magnet: it hangs from the crane until the pile below grabs it (the rope parts at s = 0.012); it is dragged down
  // into the pile (it and the pile pull each other: the pile is 20 times heavier) and comes to rest by s = 0.09
  const S0 = 0.012, S1 = 0.09;
  const magAt = (s) => { if (s <= S0) return M0; const u = Math.min(1, (s - S0) / (S1 - S0)), e = u * u; return [M0[0] + (MB[0] - M0[0]) * e, M0[1] + (MB[1] - M0[1]) * e, M0[2] + (MB[2] - M0[2]) * e]; };
  // ---- the bodies. kind: 0 slab (a crushed car) 1 beam 2 pipe 3 sheet 4 drum 5 wheel 6 chunk 7 skip 8 car 9 office 10 trolley-cage
  const KIND = [
    { kg: 420, size: [2.0, 0.5, 1.3], steel: 0.85 }, { kg: 110, size: [3.0, 0.2, 0.2], steel: 1 }, { kg: 55, size: [2.4, 0.2, 0.2], steel: 1 },
    { kg: 38, size: [1.4, 0.05, 1.0], steel: 1 }, { kg: 22, size: [0.6, 0.9, 0.6], steel: 1 }, { kg: 12, size: [0.62, 0.22, 0.62], steel: 1 },
    { kg: 18, size: [0.45, 0.35, 0.4], steel: 1 }, { kg: 1400, size: [3.6, 1.6, 1.8], steel: 1 }, { kg: 1000, size: [4.1, 1.45, 1.75], steel: P.carSteel },
    { kg: 2400, size: [6.0, 2.6, 2.4], steel: 0.9 },
  ];
  const B = [];
  const add = (kind, p, o = {}) => { const K = KIND[kind]; B.push(Object.assign({ kind, p0: p.slice(), kg: K.kg * (o.km || 1), steel: K.steel, size: K.size, rs: 0.35 * Math.min(K.size[0], K.size[2]) + 0.1, mu: 0.6, drag: 0.004, yaw: rnd() * 6.283, spin: [rnd() - 0.5, rnd() - 0.5, rnd() - 0.5], seed: B.length + 1 }, o)); };
  // the pile: a low cone of scrap
  const PC = F.pile.c, PR = F.pile.R, PH = F.pile.h;
  const pick = (u) => (u < 0.13 ? 0 : u < 0.28 ? 1 : u < 0.38 ? 2 : u < 0.58 ? 3 : u < 0.66 ? 4 : u < 0.77 ? 5 : 6);
  for (let i = 0; i < 1500; i++) {
    const k = pick(rnd()), r = PR * Math.sqrt(rnd()) * 0.97, th = rnd() * 6.283, hMax = PH * (1 - r / PR), y = Y0 + 0.15 + rnd() * Math.max(0.1, hMax - 0.2);
    add(k, [PC[0] + r * Math.cos(th), y, PC[2] + r * Math.sin(th)], { km: 0.75 + 0.5 * rnd(), pile: true });
  }
  // the car on the magnet at 10:42:00 (it was being lifted): it goes first
  add(0, [M0[0], M0[1] - 0.95, M0[2]], { km: 2.2, onMag: true, size: [3.9, 1.2, 1.7] });
  // scrap around the yard, 7–17 m from the pile (not in the river, not under the cars, the crane or the office)
  for (let i = 0; i < 300; i++) {
    let x, z, ok = false;
    for (let t = 0; t < 40 && !ok; t++) {
      const r = 7.5 + 9.5 * Math.pow(rnd(), 0.8), th = rnd() * 6.283; x = PC[0] + r * Math.cos(th); z = PC[2] + r * Math.sin(th);
      ok = z < F.wharf.z - 0.8 && !(x > 12 && x < 27 && z < -26 && z > -40) && Math.hypot(x - F.crane.base[0], z - F.crane.base[2]) > 6.5 && !(Math.abs(x - F.office[0]) < 4.5 && Math.abs(z - F.office[2]) < 2.8);
    }
    if (!ok) continue;
    const k = [1, 2, 3, 4, 4, 5, 5, 6, 6, 6][Math.floor(rnd() * 10)], K = KIND[k];
    add(k, [x, Y0 + K.size[1] / 2, z], { km: 0.7 + 0.6 * rnd(), scatter: true, mu: 0.55 });
  }
  // three skips
  for (const [x, z] of [[-10.5, -33.0], [-12.5, -24.2], [9.5, -40.5]]) add(7, [x, Y0 + 0.8, z], { mu: 0.5, yaw: Math.atan2(z - PC[2], x - PC[0]), spin: [0, 0, 0], rs: 1.0 });
  // the old cars, on their wheels (rolling resistance 0.013, their handbrakes long gone): the near ones fly, the rest roll
  F.cars.forEach(([x, z], i) => add(8, [x, Y0 + 0.72, z], { car: i, mu: 0.013, roll: true, yaw: -Math.PI / 2 + (rnd() - 0.5) * 0.3, spin: [0, 0, 0], rs: 1.25, drag: 0.0008 }));
  // the site office
  add(9, [F.office[0], Y0 + 1.3, F.office[2]], { office: true, mu: 0.5, yaw: 0.05, spin: [0, 0, 0], rs: 1.6, drag: 0.0006 });
  const N = B.length;

  // ---- one body: pulled by the magnet (until s = 10), gravity, the ground (the yard at 2.2 m; the river beyond the
  // wharf's edge), friction (rolling, for cars on their wheels), air drag; it sticks when it touches the ball (track 1 runs
  // until then). At 10:42:10 the ball lets go: everything on it falls (track 2, from s = 10) onto the heap it leaves
  const T = P.T, HEAP = { h: 2.5, R: 5.2 };
  function groundY(x, z) { return z < F.wharf.z ? Y0 : F.river.bed; }
  const heapY = (x, z) => { const d = Math.hypot(x - MB[0], z - MB[2]); return Y0 + HEAP.h * Math.max(0, 1 - Math.pow(d / HEAP.R, 1.4)); };
  function step(b, p, v, s, dt, pull, gfn) {
    const h0 = b.size[1] / 2;
    let a = [0, -P.g, 0];
    if (pull) { const M = magAt(s), d = [M[0] - p[0], M[1] - p[1], M[2] - p[2]], r = Math.hypot(d[0], d[1], d[2]) || 1e-6, f = P.pull(r) * b.steel; a = [f * d[0] / r, f * d[1] / r - P.g, f * d[2] / r]; }
    const sp = Math.hypot(v[0], v[1], v[2]), inWater = p[1] < 0, dk = (inWater ? 0.6 : b.drag) * sp;
    a[0] -= dk * v[0]; a[1] -= dk * v[1]; a[2] -= dk * v[2];
    const gy = gfn(p[0], p[2]) + h0;
    if (p[1] <= gy + 1e-4 && a[1] < 0 && !inWater) {
      // on the ground: the normal force carries the weight that the pull doesn't; friction acts against the slide
      const Nf = -a[1]; a[1] = 0; if (v[1] < 0) v[1] = 0;
      const vh = Math.hypot(v[0], v[2]), fh = Math.hypot(a[0], a[2]), mu = b.mu;
      if (vh < 1e-3 && fh <= mu * Nf) { a[0] = a[2] = 0; v[0] = v[2] = 0; }
      else if (vh < 1e-3) { a[0] -= mu * Nf * a[0] / fh; a[2] -= mu * Nf * a[2] / fh; }
      else { const dv = mu * Nf * dt; if (dv >= vh) { v[0] = v[2] = 0; a[0] = a[2] = 0; } else { a[0] -= mu * Nf * v[0] / vh; a[2] -= mu * Nf * v[2] / vh; } }
    }
    v[0] += a[0] * dt; v[1] += a[1] * dt; v[2] += a[2] * dt;
    p[0] += v[0] * dt; p[1] += v[1] * dt; p[2] += v[2] * dt;
    const gy2 = gfn(p[0], p[2]) + h0;
    if (p[1] < gy2) { p[1] = gy2; if (v[1] < 0) v[1] = -0.12 * v[1]; v[0] *= 0.97; v[2] *= 0.97; }
    return Math.hypot(v[0], v[1], v[2]);
  }
  function sim(b, Rof) {
    const out = [], p = b.p0.slice(), v = [0, 0, 0];
    let s = 0, next = 0, still = 0;
    b.firstHit = null; b.vHit = 0; b.off = null; b.track2 = null;
    // track 1: until it hits the ball (or, if it never does, until it has been still for good after 10:42:10)
    while (s < T + 6) {
      const on = s < T;
      if (on) {
        const M = magAt(s), d = [M[0] - p[0], M[1] - p[1], M[2] - p[2]], r = Math.hypot(d[0], d[1], d[2]) || 1e-6, R = Rof(s);
        if (r <= R + b.rs || b.onMag) {
          b.firstHit = s; b.vHit = Math.hypot(v[0], v[1], v[2]); b.rHit = R; const dep = Math.max(0.15, b.rs * 0.6);
          b.off = b.onMag ? [p[0] - M[0], p[1] - M[1], p[2] - M[2]] : [-d[0] / r * (R + b.rs - dep), -d[1] / r * (R + b.rs - dep), -d[2] / r * (R + b.rs - dep)];
          out.push(M[0] + b.off[0], M[1] + b.off[1], M[2] + b.off[2]);
          break;
        }
      }
      const sp = Math.hypot(v[0], v[1], v[2]), f = on ? P.pull(Math.hypot(magAt(s)[0] - p[0], magAt(s)[1] - p[1], magAt(s)[2] - p[2])) : 0;
      const dt = Math.min(0.002, 0.05 / Math.max(1, sp), 0.02 / Math.max(1, Math.sqrt(f) * 0.05));
      const sp2 = step(b, p, v, s, dt, on, on ? groundY : (x, z) => Math.max(groundY(x, z), heapY(x, z) - 0.3));
      s += dt;
      while (next <= s + 1e-9) { out.push(p[0], p[1], p[2]); next += MG_DS; }
      if (!on) { still = sp2 < 0.03 ? still + dt : 0; if (still > 0.3) break; }
      else if (sp2 === 0 && s > 0.05) {
        // resting with the pull too weak to move it: it never will (the field doesn't change)
        const M = magAt(s), r = Math.hypot(M[0] - p[0], M[1] - p[1], M[2] - p[2]);
        if (P.pull(r) * b.steel < b.mu * P.g * 0.98 && s > 0.2) { b.static = true; break; }
      }
    }
    b.track = new Float32Array(out); b.tEnd = (out.length / 3 - 1) * MG_DS;
    return b;
  }
  // track 2: after 10:42:10, the ball lets go. Squeezed by its own magnetism, it springs apart a little (1–3 m/s
  // outward) and falls into a heap (what lands beyond the wharf's edge falls into the river)
  function release(b) {
    if (b.firstHit == null || b.static) return;
    const M = magAt(T), p = [M[0] + b.off[0], M[1] + b.off[1], M[2] + b.off[2]], u = Math.hypot(...b.off) || 1, rr = mgRand(b.seed * 31 + 7);
    const k = 1.0 + 2.2 * rr(), v = [b.off[0] / u * k, Math.max(-0.5, b.off[1] / u * k), b.off[2] / u * k];
    const out = [p[0], p[1], p[2]]; let s = 0, next = MG_DS, still = 0;
    const jit = (rr() - 0.5) * 0.5, onBoat = (x, z, q) => Math.abs(x - MGB.x(T + q)) < F.boat.L / 2 - 0.3 && Math.abs(z - MGB.z(T + q)) < F.boat.B / 2 - 0.05;
    let sNow = 0; const gfn = (x, z) => (z < F.wharf.z ? Math.max(Y0, heapY(x, z) + jit) : onBoat(x, z, sNow) ? 2.1 + MGB.heave(T + sNow) : F.river.bed);
    while (s < 6) { const dt = 0.002; sNow = s; const sp = step(b, p, v, T + s, dt, false, gfn); s += dt; while (next <= s + 1e-9) { out.push(p[0], p[1], p[2]); next += MG_DS; } still = sp < 0.03 ? still + dt : 0; if (still > 0.3 && s > 0.4) break; }
    b.track2 = new Float32Array(out); b.t2End = (out.length / 3 - 1) * MG_DS;
  }
  // ---- the ball's radius from the mass that has arrived (two passes: guess, then the real arrivals)
  const R0 = 1.15;    // the magnet with the car it was lifting
  const radiusFrom = (kg) => Math.cbrt(R0 * R0 * R0 + 3 * kg / (4 * Math.PI * P.rho * P.pack));
  let arr = null;
  const Rof = (s) => {
    if (!arr) return radiusFrom(165000 * Math.min(1, Math.pow(s / 0.35, 0.7)));
    let lo = 0, hi = arr.t.length; while (lo < hi) { const m = (lo + hi) >> 1; if (arr.t[m] <= s) lo = m + 1; else hi = m; }
    return radiusFrom(lo ? arr.m[lo - 1] : 0);
  };
  const run = () => { for (const b of B) sim(b, Rof); };
  const tally = () => {
    const ev = B.filter((b) => b.firstHit != null && !b.onMag).map((b) => [b.firstHit, b.kg * b.steel + b.kg * (1 - b.steel) * 0.5]).sort((a, b) => a[0] - b[0]);
    let m = 0; arr = { t: ev.map((e) => e[0]), m: ev.map((e) => (m += e[1])) };
  };
  run(); tally(); run(); tally();
  for (const b of B) release(b);
  const Rnow = Rof;
  const massAt = (s) => { let lo = 0, hi = arr.t.length; while (lo < hi) { const m = (lo + hi) >> 1; if (arr.t[m] <= s) lo = m + 1; else hi = m; } return (lo ? arr.m[lo - 1] : 0) + 8000 + 900; };
  // heat: each kilogram's impact energy (½v²) stays in it
  let eSum = 0, mSum = 0;
  for (const b of B) if (b.firstHit != null) { const e = 0.5 * b.vHit * b.vHit, m = b.kg * b.steel; eSum += e * m; mSum += m; }
  const Y = {
    N, bodies: B, magAt, S0, S1, R: Rnow, R0, massAt, rest: MB, HEAP, heapY,
    mass10: massAt(T), dTavg: eSum / mSum / P.cSteel, vMax: B.reduce((a, b) => Math.max(a, b.vHit || 0), 0),
    // a body's position at story s (before s = 0, where it started; stuck: on the ball; after 10:42:10, falling)
    pos(b, s) {
      if (s <= 0) return b.p0;
      const tr = (A, q, end) => { const k = Math.min(end, q) / MG_DS, i = Math.floor(k), f = k - i, n = A.length / 3 - 1, i0 = Math.min(i, n), i1 = Math.min(i + 1, n);
        return [A[i0 * 3] + (A[i1 * 3] - A[i0 * 3]) * f, A[i0 * 3 + 1] + (A[i1 * 3 + 1] - A[i0 * 3 + 1]) * f, A[i0 * 3 + 2] + (A[i1 * 3 + 2] - A[i0 * 3 + 2]) * f]; };
      if (b.firstHit == null || s < b.firstHit) return tr(b.track, s, b.tEnd);
      if (s < P.T || !b.track2) { const M = magAt(Math.min(s, P.T)); return [M[0] + b.off[0], M[1] + b.off[1], M[2] + b.off[2]]; }
      return tr(b.track2, s - P.T, b.t2End);
    },
    stuck(b, s) { return b.firstHit != null && s >= b.firstHit && s < P.T; },
  };
  Y.cars = B.filter((b) => b.kind === 8);
  Y.office = B.find((b) => b.office);
  return Y;
})();


// =====================================================================================================================
// SMALL THINGS: your phone, the bike on the roof, the MRI's oxygen cylinder and the waiting room's phones
// =====================================================================================================================
// a point flying in a pulling field: f(r) = acceleration towards the target (m/s²), from p0 with v0; returns its track
function mgFly(p0, v0, target, f, o = {}) {
  const out = [], p = p0.slice(), v = v0.slice(); let s = o.s0 || 0, hit = null, vHit = 0, next = 0;
  const dt = 0.0002, Rof = o.R || (() => 0.3);
  while (s < (o.until || MGP.T)) {
    const tg = typeof target === 'function' ? target(s) : target, d = [tg[0] - p[0], tg[1] - p[1], tg[2] - p[2]], r = Math.hypot(d[0], d[1], d[2]);
    if (r <= Rof(s)) { hit = s; vHit = Math.hypot(v[0], v[1], v[2]); break; }
    const a = s < (o.release || 0) ? 0 : f(r, s), gy = o.noGravity ? 0 : MGP.g;
    if (s >= (o.release || 0)) { v[0] += a * d[0] / r * dt; v[1] += (a * d[1] / r - gy) * dt; v[2] += a * d[2] / r * dt; }
    else if (o.carry) { const c = o.carry(s); p[0] = c[0]; p[1] = c[1]; p[2] = c[2]; const c2 = o.carry(s + 0.01); v[0] = (c2[0] - c[0]) / 0.01; v[1] = (c2[1] - c[1]) / 0.01; v[2] = (c2[2] - c[2]) / 0.01; }
    p[0] += v[0] * dt; p[1] += v[1] * dt; p[2] += v[2] * dt;
    s += dt;
    while (next <= s + 1e-9) { out.push(p[0], p[1], p[2]); next += MG_DS; }
  }
  const A = new Float32Array(out);
  return { hit, vHit, A, at(s) { if (s <= 0) return p0; const q = s / MG_DS, i = Math.floor(q), f = q - i, n = A.length / 3 - 1, i0 = Math.min(i, n), i1 = Math.min(i + 1, n); return [A[i0 * 3] + (A[i1 * 3] - A[i0 * 3]) * f, A[i0 * 3 + 1] + (A[i1 * 3 + 1] - A[i0 * 3 + 1]) * f, A[i0 * 3 + 2] + (A[i1 * 3 + 2] - A[i0 * 3 + 2]) * f]; } };
}
// a point on the boat (its local x forward, y up from the water, z to the right: the boat goes east, so local z = world z)
function mgOnBoat(s, lx, ly, lz) { return [MGB.x(s) + lx, ly + MGB.heave(s), MGB.z(s) + lz]; }
const MG_SMALL = (() => {
  const F = (typeof MG_F !== 'undefined') ? MG_F : require('./layout.js').MG_F;
  const P = MGP, ball = (s) => MGY.magAt(s);
  // your phone: in your hand at the stern. From 10:42:00 it's pulled towards the yard at 2.4 times its weight (from 20 m
  // it would only fall in the river): you hold on, with about 10 N (5 times its weight), until the pull beats that as
  // the boat is drawn in; then it's ripped away and flies over the wall into the ball
  const hand = [-7.45, 1.62, -0.62], fPh = (r) => P.phoneM * P.K * P.G(r) / P.phoneKg;
  let prel = P.T; for (let s = 0.05; s < P.T; s += 0.002) { const p = mgOnBoat(s, ...hand), M = ball(s); if (fPh(Math.hypot(M[0] - p[0], M[1] - p[1], M[2] - p[2])) > P.phoneGrip * P.g) { prel = s; break; } }
  const phone = mgFly(mgOnBoat(0, ...hand), [F.boat.v0, 0, 0], ball, fPh, { R: (s) => MGY.R(s) + 0.05, release: prel, carry: (s) => mgOnBoat(s, ...hand) });
  phone.rel = prel;
  // the bike on the roof (12 kg, 90% steel): its straps hold until the pull reaches 1.5 times its weight
  const bikeLocal = [1.2, 2.25, -0.25];
  let rel = P.T; for (let s = 0; s < P.T; s += 0.002) { const p = mgOnBoat(s, ...bikeLocal), M = ball(s), r = Math.hypot(M[0] - p[0], M[1] - p[1], M[2] - p[2]); if (P.pull(r) * 0.9 > 1.5 * P.g) { rel = s; break; } }
  const bike = mgFly(mgOnBoat(0, ...bikeLocal), [F.boat.v0, 0, 0], ball, (r) => P.pull(r) * 0.9, { R: (s) => MGY.R(s) + 0.5, release: rel, carry: (s) => mgOnBoat(s, ...bikeLocal) });
  // the MRI's oxygen cylinder (15 kg of steel on a trolley in the corridor, 4.6 m from the bore's centre): it slides,
  // breaks through the stud wall (losing a third of its speed) and flies into the bore
  const cylFar = (r) => P.mriPull(Math.max(r, 0.95)) * 0.92;
  const cyl = (() => {
    const out = []; let r = 4.6, v = 0, s = 0, next = 0, wall = null; const dt = 0.0001;
    while (s < P.T && r > 0.45) { const a = cylFar(r) - (v < 0.01 && cylFar(r) < 0.05 * P.g ? cylFar(r) : 0.05 * P.g); v += a * dt; r -= v * dt; if (wall == null && r <= 3.55) { wall = s; v *= 0.66; } s += dt; while (next <= s + 1e-9) { out.push(r); next += MG_DS; } }
    const A = new Float32Array(out); return { hit: s, vHit: v, wall, at: (q) => (q <= 0 ? 4.6 : A[Math.min(A.length - 1, Math.floor(q / MG_DS))]) };
  })();
  // the waiting room's phones, in people's hands 9.6–12.4 m from the bore; they fly to the wall at 6.2 m
  const wait = [9.8, 10.4, 11.1, 11.8, 12.4, 10.0].map((r0, i) => {
    const out = []; let r = r0, v = 0, s = 0, next = 0, hit = null; const dt = 0.0002, grip = 0.035 + 0.025 * i;
    while (s < 3) { const a = s < grip ? 0 : P.phoneM * P.K * P.mriFarG(r) / P.phoneKg; v += a * dt; r -= v * dt; if (r <= 6.2) { r = 6.2; if (hit == null) hit = s; v = 0; } s += dt; while (next <= s + 1e-9) { out.push(r); next += MG_DS; } }
    const A = new Float32Array(out); return { r0, hit, grip, at: (q) => (q <= 0 ? r0 : q >= 3 ? 6.2 : A[Math.min(A.length - 1, Math.floor(q / MG_DS))]) };
  });
  return { phone, bike, bikeRel: rel, cyl, wait, hand, bikeLocal };
})();

// =====================================================================================================================
// FAR AWAY: the wind turbines (their blades snap off when the generators lock), the bridge's cars (the electric ones skid)
// =====================================================================================================================
const MGT_FAR = (() => {
  const F = (typeof MG_F !== 'undefined') ? MG_F : require('./layout.js').MG_F;
  const P = MGP, w = P.rpm * 2 * Math.PI / 60;
  // each blade: its root snaps at s = 0.03 + a little; it flies off with the speed it had (its centre of mass 15 m out),
  // tumbling, slowed by the air; it lands on the hillside
  const blades = [];
  F.turbines.forEach((tb, ti) => {
    for (let k = 0; k < 3; k++) {
      const ph0 = ti * 1.9 + k * 2 * Math.PI / 3 + 0.4, snap = 0.03 + 0.012 * k + 0.008 * ti, ph = ph0 + w * snap;
      // rotor plane: facing the wind from the south-west; blade direction in that plane
      const yawT = 0.75 + 0.1 * ti, ux = Math.cos(yawT), uz = Math.sin(yawT);
      const dir = [ux * Math.sin(ph), Math.cos(ph), uz * Math.sin(ph)], tan = [ux * Math.cos(ph), -Math.sin(ph), uz * Math.cos(ph)];
      const rc = 15, v0 = [tan[0] * w * rc, tan[1] * w * rc, tan[2] * w * rc];
      blades.push({ ti, k, ph0, snap, dir, tan, v0, yawT, spinRate: w * (0.6 + 0.2 * k) });
    }
  });
  const hubAt = (ti) => { const t = F.turbines[ti]; return [t[0], t[1] + F.hub, t[2]]; };
  // the blade at story s: its centre of mass and its angle in the rotor plane (it keeps tumbling in it until it lands)
  function blade(bl, s, groundY) {
    const H = hubAt(bl.ti), w0 = P.rpm * 2 * Math.PI / 60;
    if (s <= bl.snap) { const ph = bl.ph0 + w0 * Math.max(-30, s); const ux = Math.cos(bl.yawT), uz = Math.sin(bl.yawT); const d = [ux * Math.sin(ph), Math.cos(ph), uz * Math.sin(ph)]; return { c: [H[0] + d[0] * 15, H[1] + d[1] * 15, H[2] + d[2] * 15], ang: ph, landed: false }; }
    // flight with air drag (k = 0.08/s on its speed) and gravity, sampled at 0.01 s
    const u = s - bl.snap, k = 0.08, e = Math.exp(-k * u), dx = (1 - e) / k;
    const c0 = [H[0] + bl.dir[0] * 15, H[1] + bl.dir[1] * 15, H[2] + bl.dir[2] * 15];
    let c = [c0[0] + bl.v0[0] * dx, c0[1] + bl.v0[1] * dx - P.g / k * (u - dx), c0[2] + bl.v0[2] * dx];
    let ang = bl.ph0 + w0 * bl.snap + bl.spinRate * (1 - Math.exp(-0.15 * u)) / 0.15;
    const gy = groundY ? groundY(c[0], c[2]) + 1.5 : H[1] - F.hub + 1.5;
    let landed = false;
    if (c[1] < gy) {
      // landed: find when (bisect) and freeze there, lying on its side
      let a = 0, b = u; for (let i = 0; i < 30; i++) { const m = (a + b) / 2, em = Math.exp(-k * m), dm = (1 - em) / k, y = c0[1] + bl.v0[1] * dm - P.g / k * (m - dm); if (y > gy) a = m; else b = m; }
      const em = Math.exp(-k * a), dm = (1 - em) / k; c = [c0[0] + bl.v0[0] * dm, gy, c0[2] + bl.v0[2] * dm]; ang = bl.ph0 + w0 * bl.snap + bl.spinRate * (1 - Math.exp(-0.15 * a)) / 0.15; landed = a;
    }
    return { c, ang, landed };
  }
  // the bridge: two lanes each way (x = bridge, cars go north–south). Electric cars (their wheels lock at s = 0.02) skid
  // at 0.75 g; the others brake when their drivers see it (s = 1.3) at 0.6 g
  const cars = [];
  const r = mgRand(77);
  const lanes = [[-5.2, 1], [-1.8, 1], [1.8, -1], [5.2, -1]];
  for (let i = 0; i < 14; i++) {
    const [lx, dir] = lanes[i % 4], ev = [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1][i] === 1, z0 = -dir * (12 + 22 * Math.floor(i / 4) + 9 * r());
    cars.push({ lx, dir, ev, z0, v0: P.evV * (0.92 + 0.12 * r()), type: ['ev', 'hatch', 'ev', 'suv', 'sedan', 'ev', 'van', 'ev', 'ev', 'pickup', 'ev', 'sedan', 'ev', 'ev'][i], color: ['#e8e8ea', '#2a3a5a', '#b81c1c', '#1a1a1c', '#8a8f96', '#2d5a8a', '#f2f2f0', '#3a3d42', '#d8d0c0', '#5a2a1a', '#1c2a3c', '#e8c818', '#b0b4ba', '#7a1a28'][i], yawK: (r() - 0.5) * 0.5 });
  }
  function car(c, s) {
    const s0 = c.ev ? 0.02 : 1.3, dec = (c.ev ? P.evDecel : 0.6) * P.g, tStop = c.v0 / dec;
    let d, v;
    if (s <= s0) { d = c.v0 * s; v = c.v0; }
    else { const u = Math.min(s - s0, tStop); d = c.v0 * s0 + c.v0 * u - 0.5 * dec * u * u; v = Math.max(0, c.v0 - dec * (s - s0)); }
    // a locked skid wanders sideways and turns the car a little
    const sk = c.ev && s > s0 ? Math.min(1, (s - s0) / tStop) : 0;
    return { d, z: c.z0 + c.dir * d, x: c.lx + c.yawK * 1.2 * sk * sk, yaw: c.yawK * 0.6 * sk * sk, v, skid: c.ev && s > s0 && v > 0.3, braking: !c.ev && s > s0 && v > 0.3 };
  }
  return { blades, blade, hubAt, cars, car, w };
})();

// numbers for the captions and the HUD (computed once)
MGP.phoneHit = MG_SMALL.phone.hit;                                   // story s when your phone hits the ball
MGP.phoneKmh = MG_SMALL.phone.vHit * 3.6;
MGP.bikeRel = MG_SMALL.bikeRel;
MGP.ballKg = MGY.mass10;
MGP.ballR = MGY.R(MGP.T);
MGP.escapeKmh = Math.sqrt(2 * MGP.potKg(MGP.ballR)) * 3.6;          // the speed to get away from its surface
MGP.dTavg = MGY.dTavg; MGP.vMaxKmh = MGY.vMax * 3.6;
MGP.boatPull = (s) => Math.hypot(MGB.Fx(s), MGB.Fz(s));

if (typeof module !== 'undefined') module.exports = { MGP, MGY, MGB, MG_SMALL, MGT_FAR, mgClockParts };
