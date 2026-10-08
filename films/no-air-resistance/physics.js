/* =====================================================================
   PHYSICS — "What if air resistance suddenly disappeared?"
   One rule: from story NR.loss, solids feel no aerodynamic force (drag 0,
   lift 0). Gravity, buoyancy, tyres and liquids are unchanged. Every hero
   motion below comes from these formulas (integrated once at load where
   needed), so every playback is identical and can be scrubbed.
   Numbers and their checks: films/no-air-resistance/PLAN.md §1.
   ===================================================================== */

const NR_G = 9.81, NR_RHO = 1.225;

// the share of normal aerodynamic force still acting (1 → 0 at the change)
function nrAero(S) { return 1 - MathX.smooth(S, NR.loss, NR.loss + 0.35); }

// the wind (km/h; the air keeps moving after the change) and its gusts
function nrWindKmh(S) {
  if (S < NR.storm[0]) return 40;
  return MathX.lerp(40, 100, MathX.smooth(S, NR.storm[0], NR.storm[1]));
}
function nrGust(S, z = 0) { const s = S + z * 0.012; return 1 + 0.18 * noise1(s * 0.9, 41) + 0.07 * noise1(s * 3.1, 42); }
// how far the air itself has moved (m): clouds, steam and spray ride it
const NR_WIND_DIST = (() => { const tab = [0]; let d = 0; for (let i = 1; i <= 80 * 30; i++) { d += nrWindKmh(i / 30) / 3.6 / 30; tab.push(d); } return tab; })();
function nrWindDist(S) { const f = MathX.clamp(S * 30, 0, NR_WIND_DIST.length - 1.001), k = Math.floor(f); return NR_WIND_DIST[k] + (NR_WIND_DIST[k + 1] - NR_WIND_DIST[k]) * (f - k); }
// how hard the wind pushes solids, relative to a 40 km/h breeze in normal air (0 after the change)
function nrLoad(S, z = 0) { const U = nrWindKmh(S) / 40 * nrGust(S, z); return U * U * nrAero(S); }
// the push at the moment of the change (what bent things spring back from)
function nrLoadAtLoss(z = 0) { const U = nrWindKmh(NR.loss) / 40 * nrGust(NR.loss, z); return U * U; }

// a bent thing (tree, sign, flag pole) released at the change: a lightly damped spring around upright.
// before: follows the push; after: rings down from where it was (no air damping now, only its own)
function nrSpring(S, z, freq = 0.55, damp = 0.12) {
  const L0 = nrLoadAtLoss(z);
  if (S < NR.loss) return nrLoad(S, z);
  const u = S - NR.loss, w = 2 * Math.PI * freq;
  return L0 * Math.exp(-damp * w * u) * Math.cos(w * u) * (1 - nrAero(S)) + nrLoad(S, z);
}

// integrate dv/dt with a 1 ms step; store every 1/60 s
function nrTable(T, step, init) {
  const dt = 1 / 960, every = 16, rows = [];   // a row every 1/60 s exactly
  let s = init(), i = 0;
  for (let t = 0; t <= T + 1e-9; t += dt, i++) { if (i % every === 0) rows.push(Object.assign({ t }, s)); s = step(s, dt, t); }
  return { rows, at(t) { const f = MathX.clamp(t * 60, 0, rows.length - 1.001), k = Math.floor(f), u = f - k, a = rows[k], b = rows[k + 1] || a, o = {}; for (const key in a) o[key] = a[key] + (b[key] - a[key]) * u; return o; } };
}

/* ---------------- the drop: a sheet of paper and a tennis ball, side by side, released together ---------------- */
// without air: both fall ½gt² (from ~1.3 m: 0.52 s). The ghost: what a sheet does in normal air (≈ 0.9 m/s, fluttering)
const NR_DROP = {
  fall(u) { return u <= 0 ? 0 : 0.5 * NR_G * u * u; },
  ghost(u) {      // [down, side, rot] for the normal-air sheet: a falling-leaf flutter, ~0.55 m/s down on average
    if (u <= 0) return [0, 0, 0];
    const down = Math.min(1.25, 0.5 * NR_G * Math.min(u, 0.12) ** 2 + 0.55 * Math.max(0, u - 0.12) + 0.06 * Math.sin(u * 5.2));
    return [down, 0.16 * Math.sin(u * 2.6) + 0.04 * u, 0.9 * Math.sin(u * 2.6 + 0.6)];
  },
};

/* ---------------- the skydiver: freefall at 55 m/s (normal top speed) when the air lets go at 3,100 m ---------------- */
const NR_JUMP = {
  A0: 3100, v0: 55,
  alt(S) { const t = Math.max(0, S - NR.loss); return this.A0 - this.v0 * t - 0.5 * NR_G * t * t; },
  speed(S) { return this.v0 + NR_G * Math.max(0, S - NR.loss); },
};

/* ---------------- the car: 1,500 kg, C_dA 0.65 m², rolling 0.012; throttle off at 90 km/h (story NR.car.coast) ---------------- */
// it passes you at NR.car.pass. Without drag it slows only on its tyres (0.12 m/s²): from 90 km/h it would roll 2.65 km
// (normal air: 1.66 km). The "normal air" ghost leaves from the same point at the same moment.
const NR_CAR = (() => {
  const m = 1500, CdA = 0.65, rr = 0.012 * NR_G, v0 = 25;
  const make = (rho) => nrTable(24, (s, dt) => { const a = rr + 0.5 * rho * CdA * s.v * s.v / m; const v = Math.max(0, s.v - a * dt); return { v, d: s.d + v * dt }; }, () => ({ v: v0, d: 0 }));
  const C = { now: make(0), normal: make(NR_RHO), v0, stop: v0 * v0 / (2 * rr), stopNormal: m / (NR_RHO * CdA) * Math.log((rr + 0.5 * NR_RHO * CdA * v0 * v0 / m) / rr) };
  // distance along the road (−z) from where you stand; before the throttle comes off it holds 90 km/h
  C.dist = (S, normal = false) => {
    const T = normal ? C.normal : C.now, u = S - NR.car.coast, at = (x) => (x < 0 ? v0 * x : T.at(x).d);
    return at(u) - C.now.at(NR.car.pass - NR.car.coast).d;
  };
  C.speed = (S, normal = false) => { const u = S - NR.car.coast; return u < 0 ? v0 : (normal ? C.normal : C.now).at(u).v; };
  return C;
})();
// the leaflets a passenger tosses out of the window: they keep the car's speed (no drag), drop 1.1 m, then slide on the road (μ ≈ 0.4)
const NR_SHEETS = {
  mu: 0.4,
  at(u, v0, vx, vy, h0, out) {     // → out { s (m along the road), x (m sideways), y (m), air }
    const tf = (vy + Math.sqrt(vy * vy + 2 * NR_G * h0)) / NR_G;
    if (u < tf) { out.s = v0 * u; out.x = vx * u; out.y = h0 + vy * u - 0.5 * NR_G * u * u; out.air = 1; return out; }
    const w = u - tf, a = this.mu * NR_G, ts = v0 / a, ww = Math.min(w, ts), k = 1 - ww / ts;
    out.s = v0 * tf + v0 * ww - 0.5 * a * ww * ww; out.x = vx * tf + vx * 0.3 * ww * (1 - 0.5 * ww / ts); out.y = 0; out.air = 0; out.k = k; return out;
  },
};

/* ---------------- the airliner: cruising level at 11,400 m and 240 m/s; zero lift from NR.loss ---------------- */
// a ballistic arc: it keeps its speed over the ground (no drag) and falls ½gt². It flies up the line of the avenue
// towards you and comes down 2.1 km away, beyond the end of the avenue, at NR_PLANE.imp.
const NR_PLANE = {
  H: 11400, v: 240, imp: NR.planeImp, dir: [0, 1],   // dir: its heading on the ground (x, z): straight up the avenue, towards you
  tImpact() { return NR.loss + Math.sqrt(2 * this.H / NR_G); },
  pos(S, out) {   // world position (m)
    const t = Math.max(0, S - NR.loss), T = Math.sqrt(2 * this.H / NR_G), back = this.v * (T - Math.min(t, T) + (S < NR.loss ? NR.loss - S : 0));
    return out.set(this.imp[0] - this.dir[0] * back, Math.max(0, this.H - 0.5 * NR_G * t * t), this.imp[1] - this.dir[1] * back);
  },
  alt(S) { const t = Math.max(0, S - NR.loss); return Math.max(0, this.H - 0.5 * NR_G * t * t); },
  vz(S) { return NR_G * Math.max(0, S - NR.loss); },
  kmh(S) { return Math.hypot(this.v, this.vz(S)) * 3.6; },
};

/* ---------------- the balloon: 30 cm, helium; buoyancy kept, drag gone ---------------- */
const NR_BALLOON = (() => {
  const V = 4 / 3 * Math.PI * 0.15 ** 3, mAir = NR_RHO * V, mHe = 0.17 * V, mRub = 0.003, a = (mAir - mHe - mRub) * NR_G / (mHe + mRub);
  return { a, rise(u) { return u <= 0 ? 0 : 0.5 * a * u * u; } };       // a ≈ 21 m/s² (≈ 2 g)
})();

/* ---------------- the debris from the impact: thrown ~2 km, landing in the street ---------------- */
// each piece is aimed at a point (x, y, z) and arrives T s after the impact: horizontal speed R / T, launch speed up
// (y + ½gT²) / T. For T ≈ 10 s that is ≈ 200 m/s at ~14° up: it climbs ~120 m and arrives at ~740 km/h, nearly level.
function nrDebrisPiece(tx, ty, tz, T) {
  const I = NR_PLANE.imp, dx = tx - I[0], dz = tz - I[1], R = Math.hypot(dx, dz), vh = R / T, vy = (ty + 0.5 * NR_G * T * T) / T;
  return { T, vh, vy, kmh: Math.hypot(vh, vy - NR_G * T) * 3.6, dir: [dx / R, dz / R],
    at(u, out) { const k = MathX.clamp(u, 0, T); return out.set(I[0] + dx * k / T, vy * k - 0.5 * NR_G * k * k, I[1] + dz * k / T); } };
}

/* ---------------- the sign board knocked off the building beside you: 12 m up, no drag ---------------- */
// it drops in 1.55 s and hits at ≈ 55 km/h; in normal air a light board like this sails down at ~4–5 m/s
const NR_BOARD = {
  y0: 12.0,
  fall(u) { return u <= 0 ? 0 : 0.5 * NR_G * u * u; },
  ghost(u) { if (u <= 0) return [0, 0, 0]; const d = Math.min(0.5 * NR_G * Math.min(u, 0.35) ** 2, 0.6) + 4.2 * Math.max(0, u - 0.35); return [d, 0.9 * Math.sin(u * 1.9), 0.55 * Math.sin(u * 2.4 + 0.4)]; },
};

/* ---------------- a pigeon's jump: legs only (≈ 2 m/s up, ~20 cm), wings flapping uselessly ---------------- */
function nrHop(u, v = 2.0) { const T = 2 * v / NR_G, k = ((u % (T + 0.12)) + T + 0.12) % (T + 0.12); return k < T ? v * k - 0.5 * NR_G * k * k : 0; }
