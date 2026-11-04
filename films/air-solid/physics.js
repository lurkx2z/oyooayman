/* =====================================================================
   PHYSICS — "What if air became solid for 3 seconds?" Every number on screen comes from here (PLAN.md § 2). Story
   time s = seconds after Sunday 2:00:00.000 PM, when the air sets. Pure functions of s, no state.

   THE RULE: from 2:00:00 PM to 2:00:03 PM, all the air on Earth (every gas in the atmosphere) is rigid where it
   stands: nothing can push it, bend it or flow through it. It keeps its weight, its temperature and its transparency.
   At 2:00:03 it is ordinary air again.
   The one impossible thing: real air freezes only at about −210 °C, and shrinks about 800 times when it does. This air
   sets warm, where it stands.
   Everything else follows:
   - anything moving through the air is stopped dead where it is (every part of it that touches the air at once), and
     whatever is held by air (a falling leaf, a jumping child, a pigeon) stays where it is;
   - being stopped dead from speed v hits like a belly flop from the height v²/2g (the same speed, stopped on the same
     soft give of your own body): walking 5 km/h → 10 cm; cycling 20 km/h → 1.6 m; a car at 50 km/h → 9.8 m;
   - nothing that touches the air can move: no breath, no blink, no sound (sound is air moving); engines stall (the air
     in their cylinders is solid); a clock's hand sticks while its motor keeps pushing;
   - water under a locked surface can still flow (it is not air): a carp swims on;
   - every wind stops at once: the winds' spin (their angular momentum, ~1.5 × 10²⁶ kg m²/s, eastward on balance) goes
     into the solid Earth, which spins a little faster: the day is ~2 ms shorter (the same relation that makes the day
     ~1 ms longer or shorter with the seasons' winds);
   - at 2:00:03 every held thing starts falling FROM REST (it lost its speed for good); the sound waves that were in
     the air at 2:00:00 (a pressure pattern with no motion) go on as two halves, one each way (d'Alembert).
   ===================================================================== */

const SAP = {
  g: 9.81,                       // m/s²
  T: 3.0,                        // s: the air lets go (2:00:03.000 PM)
  c: 338,                        // m/s: the speed of sound at 12 °C (the afternoon's air)
  ceil: 2.6,                     // m: your kitchen's ceiling
};
const saSm = (x, a, b) => { const u = MathX.clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
const saLocked = (s) => s >= 0 && s < SAP.T;                                  // is the air solid now?
// "effective" time for anything that is held by the air: it stops at 0 and only starts again (from rest) at T
const saFrz = (s) => (s < 0 ? s : 0);                                         // time since the lock (≤ 0 before; 0 while held)
const saRel = (s) => Math.max(0, s - SAP.T);                                  // time since the air let go

// ---- stopped dead from v (m/s): the same hit as a belly flop from h = v²/2g
const saFlatH = (v) => v * v / (2 * SAP.g);
const saKmh = (v) => v * 3.6;
// the speeds in the film (km/h) and what they come to; [key, label, km/h]. The ladder (hud.js) shows them in order
const SA_SPEEDS = [
  ['walk', 'WALKING', 5], ['cat', 'YOUR CAT', 3 * 3.6], ['run', 'RUNNING', 11], ['bike', 'CYCLING', 20], ['car', 'THE CAR', 30], ['pigeon', 'A PIGEON', 36],
  ['road', 'MAIN ROAD', 50], ['motorway', 'MOTORWAY', 110], ['plane', 'AIRLINER', 900],
].map(([k, l, kmh]) => ({ k, l, kmh, v: kmh / 3.6, h: saFlatH(kmh / 3.6) }));
const SA_SPD = Object.fromEntries(SA_SPEEDS.map((x) => [x.k, x]));
// a height in words: "10 cm" / "1.6 m" / "48 m" / "3.2 km"
const saHt = (h) => (h < 1 ? `${Math.round(h * 100)} cm` : h < 10 ? `${h.toFixed(1)} m` : h < 1000 ? `${Math.round(h)} m` : `${(h / 1000).toFixed(1)} km`);

// ---- falling from rest at T from height y0 (above its rest y1): height at s
function saDropFrom(y0, y1, s, t0 = SAP.T) { const u = Math.max(0, s - t0), tf = Math.sqrt(2 * Math.max(0, y0 - y1) / SAP.g); return { y: u >= tf ? y1 : y0 - 0.5 * SAP.g * u * u, land: t0 + tf, v: Math.min(u, tf) * SAP.g }; }
// a ballistic path (no drag) from p0 with velocity v0, from s0: frozen at the lock, falling from rest after T
function saBallistic(p0, v0, s0, s) {
  const at = (u) => [p0[0] + v0[0] * u, p0[1] + v0[1] * u - 0.5 * SAP.g * u * u, p0[2] + v0[2] * u];
  if (s < 0) return { p: at(Math.max(0, s - s0)), v: [v0[0], v0[1] - SAP.g * Math.max(0, s - s0), v0[2]] };
  const L = at(-s0), r = saRel(s);
  return { p: [L[0], L[1] - 0.5 * SAP.g * r * r, L[2]], v: [0, -SAP.g * r, 0], lock: L, vLock: [v0[0], v0[1] + SAP.g * s0, v0[2]] };
}
// an inverted pendulum (the cyclist, the runner) tipping from a small lean th0 (rad), length L (m), from t0
function saTip(th0, L, t0, s, max = 1.45) { const u = Math.max(0, s - t0), w = Math.sqrt(SAP.g / L); return Math.min(max, th0 * Math.cosh(w * u)); }

// ---- the bell in the church tower: it strikes two; its first stroke at s = −0.12 is caught in the air on its way to
// you (SA_BELL.d from the tower to your window); the rest of the way it comes at T + (d − c·0.12)/c, half as loud
const SA_BELL = { s1: -0.12, s2: 9.4 };          // (its hammer, stuck in the air of the belfry, falls for the 2nd stroke late)

// ---- the clock: story s → { day, h, m, sec, ms, pm }; Sunday 2:00:00.000 PM at s = 0
function saClockParts(s) {
  const S = 14 * 3600 + s, Si = Math.floor(S + 1e-9), H = Math.floor(Si / 3600) % 24, ms = Math.floor((S - Si) * 1000 + 1e-6);
  return { day: 'SUNDAY', h: H % 12 === 0 ? 12 : H % 12, h24: H, m: Math.floor(Si / 60) % 60, sec: ((Si % 60) + 60) % 60, ms: Math.min(999, Math.max(0, ms)), pm: H >= 12 };
}
const saHMS = (s) => { const c = saClockParts(s); return `${c.h}:${String(c.m).padStart(2, '0')}:${String(c.sec).padStart(2, '0')}`; };

// ---- the sun: Sunday, late October, 2 PM, 35° N: south-south-west, 36° up (world axes: x WEST, y up, z NORTH)
const SA_SUN = (() => { const alt = 36 * Math.PI / 180, az = 30 * Math.PI / 180; return [Math.cos(alt) * Math.sin(az), Math.sin(alt), -Math.cos(alt) * Math.cos(az)]; })();
