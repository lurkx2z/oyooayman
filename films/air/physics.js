/* =====================================================================
   PHYSICS — the aerodynamic model for "What if air became 10× denser?"
   One rule: drag and wind load are ½ ρ C_d A v². Everything that moves
   because of it is integrated here once, at load, into tables (so every
   playback is identical and can be scrubbed):
     the throw (and its normal-air ghost), the cyclist (250 W, flat out),
     the coasting car, the clamp and the plywood sheet, the wind's pressure.
   Numbers and their checks: films/air/PLAN.md §2.
   ===================================================================== */

const AIR = { rho0: 1.225, k: 10, g: 9.81 };

// integrate dv/dt = f(v) with a 1 ms step; store every 1/60 s
function airTable(T, step, init) {
  const dt = 0.001, every = Math.round(1 / 60 / dt), rows = [];
  let s = init(), i = 0;
  for (let t = 0; t <= T + 1e-9; t += dt, i++) { if (i % every === 0) rows.push(Object.assign({ t }, s)); s = step(s, dt, t); }
  return { rows, at(t) { const f = MathX.clamp(t * 60, 0, rows.length - 1.001), k = Math.floor(f), u = f - k, a = rows[k], b = rows[k + 1] || a, o = {}; for (const key in a) o[key] = a[key] + (b[key] - a[key]) * u; return o; } };
}

// the throw: a 0.27 kg ball (r 10.5 cm, C_d 0.47) leaves the hand at 15 m/s, 32° up, 1.8 m above the pavement
const AIR_BALL = (() => {
  const m = 0.27, r = 0.105, A = Math.PI * r * r, Cd = 0.47, v0 = 15, a0 = MathX.deg(32), h0 = 1.75, ground = 0.15 + r;
  const make = (rho) => airTable(3.2, (s, dt) => {
    if (s.y <= ground && s.vy < 0) {                                             // bounce (a low, lossy one) then roll
      s = Object.assign({}, s, { y: ground, vy: Math.abs(s.vy) * 0.45 < 0.6 ? 0 : -s.vy * 0.45, vx: s.vx * 0.7 });
      if (s.vy === 0) s.rolling = 1;
    }
    const k = 0.5 * rho * Cd * A / m, v = Math.hypot(s.vx, s.vy);
    let ax = -k * v * s.vx, ay = s.rolling ? 0 : -AIR.g - k * v * s.vy;
    if (s.rolling) ax -= Math.sign(s.vx) * 0.6;
    const vx = s.rolling && Math.abs(s.vx) < 0.05 ? 0 : s.vx + ax * dt;
    return { x: s.x + vx * dt, y: s.rolling ? ground : s.y + s.vy * dt, vx, vy: s.rolling ? 0 : s.vy + ay * dt, rolling: s.rolling || 0, spin: s.spin + v * dt / r };
  }, () => ({ x: 0, y: h0, vx: v0 * Math.cos(a0), vy: v0 * Math.sin(a0), rolling: 0, spin: 0 }));
  return { dense: make(AIR.rho0 * AIR.k), normal: make(AIR.rho0), r };
})();

// the cyclist: 85 kg with the bike, 250 W flat out (traction-limited below ~1 m/s), C_dA 0.40 m², rolling 0.005
const AIR_CYCLIST = airTable(12, (s, dt) => {
  const m = 85, P = 250, rho = AIR.rho0 * AIR.k, F = Math.min(P / Math.max(s.v, 0.5), 220);
  const a = (F - 0.5 * rho * 0.4 * s.v * s.v - 0.005 * m * AIR.g) / m;
  return { v: s.v + a * dt, d: s.d + s.v * dt };
}, () => ({ v: 12 / 3.6, d: 0 }));

// the car: 1500 kg, C_dA 0.65 m², rolling 0.01. 90 km/h, lifts off (coasts) for COAST seconds, then 75 kW
const AIR_CAR = (() => {
  const COAST = 3.6, m = 1500, rho = AIR.rho0 * AIR.k;
  const tab = airTable(14, (s, dt, t) => {
    const drag = 0.5 * rho * 0.65 * s.v * s.v + 0.01 * m * AIR.g, F = t < COAST ? 0 : Math.min(75000 / Math.max(s.v, 3), 6000);
    return { v: s.v + (F - drag) / m * dt, d: s.d + s.v * dt };
  }, () => ({ v: 25, d: 0 }));
  return Object.assign(tab, { COAST });
})();

// falls from the scaffold's top deck (12 m): a steel clamp, and a plywood sheet that tumbles and sways
const AIR_FALL = (() => {
  const rho = AIR.rho0 * AIR.k;
  const fall = (m, CdA) => airTable(5, (s, dt) => (s.y <= 0 ? s : { y: s.y - s.v * dt, v: s.v + (AIR.g - 0.5 * rho * CdA * s.v * s.v / m) * dt }), () => ({ y: 12, v: 0 }));
  return { clamp: fall(1.2, 0.006), sheet: fall(18, 0.9 * 2.88) };
})();

// the wind: km/h over story time, with gusts; and its push relative to the 60 km/h gale (pressure ∝ U²)
function airWindKmh(S) {
  const base = S < 25.6 ? 6 : S < 26.4 ? MathX.lerp(6, 30, MathX.smooth(S, 25.6, 26.4)) : S < 27.4 ? 30 : S < 28.4 ? MathX.lerp(30, 50, MathX.smooth(S, 27.4, 28.4)) : S < 29.0 ? 50 : MathX.lerp(50, 60, MathX.smooth(S, 29.0, 29.6));
  return base;
}
// gusts: ±15 % around the mean once the wind is up (same everywhere along the street, with a little delay with distance)
function airGust(S, z = 0) { const s = S + z * 0.012; return 1 + 0.15 * noise1(s * 0.9, 41) + 0.06 * noise1(s * 3.1, 42); }
// how hard the wind pushes now, as a fraction of the 60 km/h gale in 10× air (1 = 1701 Pa)
function airLoad(S, z = 0) { const U = airWindKmh(S) * airGust(S, z); return (U * U) / (60 * 60) * airDensity(S) / AIR.k; }
// density factor over story time: 1 → 2 → 5 → 10
function airDensity(S) {
  const K = [[4.9, 1], [5.9, 2], [6.6, 5], [7.3, 10]];
  if (S <= K[0][0]) return 1;
  for (let i = 1; i < K.length; i++) if (S < K[i][0]) return K[i - 1][1] + (K[i][1] - K[i - 1][1]) * MathX.smooth(S, K[i][0] - 0.35, K[i][0]);
  return 10;
}
