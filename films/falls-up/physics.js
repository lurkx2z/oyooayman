/* =====================================================================
   PHYSICS — "What if everything you dropped fell up for 10 minutes?" Every number on screen comes from here (PLAN.md
   § 2). Story time s = seconds after Saturday 3:00:00 PM, when the rule starts. Pure functions of s, no state; the
   flights are integrated once at load (fixed steps), so they are the same tables every time.

   THE RULE: from 3:00:00 PM to 3:10:00 PM, anything that leaves a hand, a shelf or the ground (anything that loses its
   support) falls UP instead of down, with gravity's full strength, 9.81 m/s² (less with height, as gravity is), and it
   keeps falling up until something stops it. What it lands on (a ceiling, the underside of a branch) holds it there.
   Anything still held or standing on something is untouched; so is the air (it keeps its weight: otherwise the sky would
   leave). At 3:10:00 everything goes back to normal: whatever is up there starts to fall back down.
   The one impossible thing: gravity only ever attracts. Nothing in physics can make it push.
   Everything else follows:
   - every dropped thing accelerates up at the same rate (Galileo's rule, upside down): a spoon and a grape land on the
     ceiling together;
   - air drag limits each thing to its terminal speed (the speed at which it would fall), and the air thins with height
     (US Standard Atmosphere), so up high nothing slows it: an apple let go of at 3:01:30 is in space (100 km) by 3:09:40;
   - running is a series of small jumps (both feet off the ground in every stride): a runner falls up.
   ===================================================================== */

const FUP = {
  g: 9.81,                       // m/s² at the ground
  R: 6.371e6,                    // m, Earth's radius
  T: 600,                        // s: the ten minutes end (3:10:00 PM)
  ceil: 2.6,                     // m: your kitchen's ceiling (floor to ceiling)
};
const fuSm = (x, a, b) => { const u = MathX.clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
const fuUp = (s) => s >= 0 && s < FUP.T;                                      // are dropped things falling up now?
const fuGh = (h) => FUP.g * (FUP.R / (FUP.R + Math.max(0, h))) ** 2;         // gravity's strength at height h (m)

// ---- the air: US Standard Atmosphere 1976, density (kg/m³) and temperature (°C) by height (km), log-interpolated
const FU_ATM = {
  km: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150, 200, 300],
  rho: [1.225, 1.112, 1.007, 0.9093, 0.8194, 0.7364, 0.6601, 0.59, 0.5258, 0.4671, 0.4135, 0.3648, 0.3119, 0.2666, 0.2279, 0.1948, 0.1665, 0.1423, 0.1216, 0.104, 0.08891,
    0.04008, 0.01841, 0.003996, 0.001027, 3.097e-4, 8.283e-5, 1.846e-5, 3.416e-6, 5.604e-7, 2.222e-8, 2.076e-9, 2.541e-10, 1.916e-11],
  tc: [15, 8.5, 2, -4.5, -11, -17.5, -24, -30.5, -37, -43.5, -50, -56.5, -56.5, -56.5, -56.5, -56.5, -56.5, -56.5, -56.5, -56.5, -56.5, -51.6, -46.6, -22.8, -2.5, -26.1,
    -53.6, -74.5, -86.3, -78.1, 87, 360, 581, 703],
};
function fuAtm(h, key) {
  const A = FU_ATM, k = Math.max(0, h / 1000), Y = A[key];
  if (k >= A.km[A.km.length - 1]) return Y[Y.length - 1];
  let i = 0; while (A.km[i + 1] < k) i++;
  const f = (k - A.km[i]) / (A.km[i + 1] - A.km[i]);
  return key === 'rho' ? Math.exp(Math.log(Y[i]) * (1 - f) + Math.log(Y[i + 1]) * f) : Y[i] + (Y[i + 1] - Y[i]) * f;
}
const fuRho = (h) => fuAtm(h, 'rho');
const fuTempC = (h) => fuAtm(h, 'tc');

// ---- a flight: something let go of at story time s0 (height h0 above the ground, moving up at v0), with terminal speed
// vt (m/s, in sea-level air). Up at gravity's strength until 3:10, then down, with drag (½ρv²CdA, written through vt),
// until it lands. Integrated once (dt 0.02 s) into a table. f(s) → height (m); f.v(s) speed (m/s, + up); f.sLand,
// f.hTop (its highest), f.sTop; f.cross(h) the story time it passes height h on the way up (or null)
function fuFlight(s0, vt, o = {}) {
  const dt = o.dt || 0.02, h0 = o.h0 || 0, H = [h0], V = [o.v0 || 0];
  let h = h0, v = o.v0 || 0, s = s0, hTop = h, sTop = s;
  const k0 = FUP.g / (vt * vt * FUP.ref);
  for (let i = 0; i < 400000; i++) {
    const up = fuUp(s + dt / 2), dir = up ? 1 : -1, a = dir * fuGh(h) - k0 * fuRho(h) * v * Math.abs(v);
    v += a * dt; h += v * dt; s += dt;
    if (h > hTop) { hTop = h; sTop = s; }
    if (!up && h <= 0) { h = 0; H.push(h); V.push(v); break; }
    H.push(h); V.push(v);
    if (o.until && s > o.until) break;
  }
  const n = H.length - 1, sEnd = s0 + n * dt;
  const at = (A, x) => { if (x <= s0) return A[0]; if (x >= sEnd) return A[n]; const u = (x - s0) / dt, i = Math.floor(u); return A[i] + (A[i + 1] - A[i]) * (u - i); };
  const f = (x) => at(H, x);
  f.v = (x) => (x <= s0 ? 0 : x >= sEnd ? 0 : at(V, x));
  f.s0 = s0; f.sLand = sEnd; f.hTop = hTop; f.sTop = sTop; f.vt = vt;
  f.cross = (hh) => { for (let i = 1; i <= n; i++) if (H[i] >= hh && H[i - 1] < hh) return s0 + (i - 1 + (hh - H[i - 1]) / (H[i] - H[i - 1])) * dt; return null; };
  return f;
}
FUP.ref = 1.225;                                            // (sea-level density: vt is quoted there)

// ---- short flights indoors (no drag over a metre or two): let go at s0 at height y0 moving up at v0 → height at s, until
// it reaches the ceiling (stop = ceiling height − its own top above its centre). Returns { y, hit (story s it lands up
// there), v (its speed then) }. After 3:10 everything on the ceiling falls back: see fuDropBack
function fuHop(s0, y0, stop, v0 = 0) {
  const d = stop - y0, g = FUP.g, t = (-v0 + Math.sqrt(v0 * v0 + 2 * g * Math.max(0, d))) / g;
  return { s0, y0, stop, v0, hit: s0 + t, vHit: v0 + g * t, y: (s) => (s <= s0 ? y0 : s >= s0 + t ? stop : y0 + v0 * (s - s0) + 0.5 * g * (s - s0) ** 2) };
}
// at 3:10:00, from height top down to rest (floor or table) at `rest`: height at s (no drag over 2 m)
function fuDropBack(top, rest) { const T = FUP.T, tf = Math.sqrt(2 * Math.max(0, top - rest) / FUP.g); return { land: T + tf, y: (s) => (s <= T ? top : s >= T + tf ? rest : top - 0.5 * FUP.g * (s - T) ** 2) }; }

// ---- the things that fell up outdoors, and how high they get (PLAN.md § 2: terminal speeds)
const FU_FLY = {};
{
  const F = FU_FLY;
  F.apple = fuFlight(90.0, 38, { h0: 13.4, v0: 0 });       // 3:01:30, out of your 5th-floor window (13.4 m up); 200 g, 7.5 cm: vt ≈ 38 m/s
  F.keys = fuFlight(131.5, 22, { h0: 1.1 });                // a bunch of keys, 3:02:11
  F.phone = fuFlight(135.0, 30, { h0: 1.3 });               // a phone, 3:02:15
  F.ball = fuFlight(220.0, 27, { h0: 0.3, v0: 9 });         // the kicked football (it leaves the boot at ~9 m/s upward)
  F.drop = fuFlight(0, 8, { h0: 1.8, v0: 6 });              // the fountain's first water (3:00:00): 3 mm drops, vt ≈ 8 m/s
  F.leaf = fuFlight(0, 1.3, { h0: 8 });                     // an autumn leaf (vt ≈ 1.3 m/s, fluttering)
  F.jogger = fuFlight(258.0, 55, { h0: 1.0, v0: 0.8 });     // the runner, if she had not caught the branch (vt ≈ 55 m/s)
  F.coat = fuFlight(309.0, 9, { h0: 1.6, v0: 7 });          // the coat thrown up to her (it opens: vt ≈ 9 m/s)
  F.fish = fuFlight(211.0, 25, { h0: -0.1, v0: 3.2 });      // the carp (1 kg: vt ≈ 25 m/s)
  F.scoop = fuFlight(225.6, 12, { h0: 1.0, v0: 0.2 });      // a scoop of ice cream (vt ≈ 12 m/s)
  F.stick = fuFlight(328.6, 14, { h0: 1.3, v0: 3.0 });      // the dog's stick
  F.coffee = fuFlight(133.0, 9, { h0: 1.2 });               // the coffee (it breaks into drops: vt ≈ 9 m/s); its cup, 7 m/s
  F.cup = fuFlight(133.0, 7, { h0: 1.2 });
}
// the apple crosses 100 km (space, the Kármán line) at FU.sSpace; the jogger would have
const FU_SPACE_S = FU_FLY.apple.cross(100000);

// a flight's height for any thing that left at s0 with terminal speed vt from the ground (the fountain's later water,
// leaves let go later): the same physics, tabulated by start time in 10 s steps and interpolated (pure, built once)
const FU_STREAM = (() => {
  const out = {};
  for (const [k, vt, h0, v0] of [['water', 8, 1.8, 6], ['leaf', 1.3, 8, 0]]) {
    const L = []; for (let s0 = 0; s0 <= 600; s0 += 10) L.push(fuFlight(s0, vt, { h0, v0, dt: 0.05 }));
    out[k] = (s0, s) => { const x = MathX.clamp(s0 / 10, 0, L.length - 1.001), i = Math.floor(x), f = x - i; return L[i](s - (s0 - i * 10)) * (1 - f) + L[i + 1](s - (s0 - (i + 1) * 10)) * f; };
    out[k].L = L;
  }
  return out;
})();

// ---- the clock: story s → { h, m, sec, pm }; 3:00:00 PM at s = 0
function fuClockParts(s) {
  const S = Math.floor(15 * 3600 + s + 1e-6), H = Math.floor(S / 3600) % 24;
  return { day: 'SATURDAY', h: H % 12 === 0 ? 12 : H % 12, h24: H, m: Math.floor(S / 60) % 60, sec: ((S % 60) + 60) % 60, pm: H >= 12 };
}
const fuHMS = (s) => { const c = fuClockParts(s); return `${c.h}:${String(c.m).padStart(2, '0')}:${String(c.sec).padStart(2, '0')}`; };
// time left (s) as m:ss
const fuMS = (x) => { x = Math.max(0, Math.ceil(x - 1e-6)); return `${Math.floor(x / 60)}:${String(x % 60).padStart(2, '0')}`; };
// a height in words: "38 m" / "1.6 km" / "101 km"
const fuHt = (h) => (h < 1000 ? `${Math.round(h)} m` : h < 10000 ? `${(h / 1000).toFixed(1)} km` : `${Math.round(h / 1000)} km`);

// ---- the sun: Saturday, late October, 3 PM, 35° N: south-west, 30° up (world axes: x WEST, y up, z NORTH)
const FU_SUN = (() => { const alt = 30 * Math.PI / 180, az = 42 * Math.PI / 180; return [Math.cos(alt) * Math.sin(az), Math.sin(alt), -Math.cos(alt) * Math.cos(az)]; })();
