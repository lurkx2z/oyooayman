/* =====================================================================
   PHYSICS — "What if days kept getting shorter and couldn't stop?" Every number on screen comes from here (PLAN.md § 2).
   Story time s = seconds after Sunday 12:00:00 noon, when the rule starts. Pure functions of s, no state.

   THE RULE: every hour, the day (noon to noon) gets 10 minutes shorter: P(s) = 86400 − s/6 seconds. It would reach zero
   at s = 518,400 (144 h: the next Sunday noon). The one impossible thing: nothing could spin a planet up like this.
   Everything else follows:
   - the sun's hour angle H(s) = 2π ∫ ds/P = 12π ln(T/(T − s)) (T = 518,400 s): sunrise at H = −90°, sunset at +90°
     (an equinox week: the sun on the equator, so day and night are equal);
   - the spin's push (centrifugal) grows with ω²: only the EXTRA push matters (the ground's shape already allows for
     today's spin): Δ = (ω² − ω0²) R. It points away from Earth's axis. In your town, at latitude φ = 35.26°, its part
     against gravity is Δ cos²φ = ⅔ Δ and its part along the ground, towards the equator (south), is Δ cos φ sin φ =
     0.471 Δ. So "down" leans south by θ = atan(0.471 Δ / (g − ⅔ Δ)); a scale reads (g − ⅔ Δ)/g of what it did;
   - the sea and the air settle on the new level surface (the geoid), which rises at the equator and falls at the poles
     as (cos²φ − ⅔): it is unchanged at cos²φ = ⅔, i.e. φ = 35.26° (sin φ = 1/√3). That's why your town is there.
   Rigid Earth (the elastic ground would follow part of it; real rock would break: see PLAN.md, honest limits).
   ===================================================================== */

const DSP = {
  T: 518400,                                  // s: when the day would reach zero length (next Sunday noon)
  P0: 86400,                                  // s: the day at the start (noon to noon)
  R: 6.371e6, g: 9.80,                        // m, m/s² (your town's g)
  lat: Math.asin(1 / Math.sqrt(3)),           // 35.26° N: the latitude where the sea level and the air don't change
  orbit: 2 * Math.PI / (365.2422 * 86400),    // rad/s: Earth round the sun (so a turn against the stars is a bit shorter)
};
DSP.w0 = 2 * Math.PI / DSP.P0 + DSP.orbit;    // today's spin (rad/s): 7.292e-5
DSP.c2 = 2 / 3;                               // cos²φ
DSP.cs = Math.sqrt(2) / 3;                    // cos φ sin φ
const dsSm = (x, a, b) => { const u = MathX.clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };

// the day's length (noon to noon), s
const dsDay = (s) => DSP.P0 * (1 - Math.max(0, s) / DSP.T);
// the sun's hour angle (rad; 0 = noon, +π/2 = sunset), growing without end
const dsH = (s) => (s <= 0 ? 2 * Math.PI * s / DSP.P0 : 12 * Math.PI * Math.log(DSP.T / (DSP.T - Math.min(s, DSP.T - 1))));
// story time at which the hour angle reaches h (inverse of dsH)
const dsSAtH = (h) => (h <= 0 ? h * DSP.P0 / (2 * Math.PI) : DSP.T * (1 - Math.exp(-h / (12 * Math.PI))));
// the spin (rad/s, against the stars) and the extra push Δ (m/s²)
const dsW = (s) => 2 * Math.PI / dsDay(s) + DSP.orbit;
const dsDelta = (s) => (dsW(s) ** 2 - DSP.w0 ** 2) * DSP.R;
// your town: gravity's part against the ground (what a scale reads), the push along the ground (south), the lean of down
const dsVert = (s) => DSP.g - DSP.c2 * dsDelta(s);
const dsHor = (s) => DSP.cs * dsDelta(s);
const dsTilt = (s) => Math.atan2(dsHor(s), dsVert(s));                   // rad, towards the equator (−z)
const dsTiltDeg = (s) => dsTilt(s) * 180 / Math.PI;
const dsGEff = (s) => Math.hypot(dsVert(s), dsHor(s));
const dsScale = (s) => dsVert(s) / DSP.g;                                // a kitchen scale's reading / what it read
// the equator: what things weigh there (fraction)
const dsEqWeight = (s) => Math.max(0, 1 - (dsW(s) ** 2 * DSP.R - DSP.w0 ** 2 * DSP.R) / 9.78);
// the moment down points sideways in your town (gravity's part against the ground reaches zero): bisect
const DS_LIFT = (() => { let a = 0, b = DSP.T - 1; for (let k = 0; k < 80; k++) { const m = (a + b) / 2; if (dsVert(m) > 0) a = m; else b = m; } return (a + b) / 2; })();
// story time when down leans by a given angle (deg)
function dsSAtTilt(deg) { let a = 0, b = DS_LIFT; for (let k = 0; k < 70; k++) { const m = (a + b) / 2; if (dsTiltDeg(m) < deg) a = m; else b = m; } return (a + b) / 2; }

// ---- the sun, the stars, the Moon (world axes: x WEST, y up, z NORTH: right-handed, so the sky turns the right way;
// the park is south of your street, at −z; the street runs east (−x) – west (+x): the sun rises down it at the east
// end and sets down it at the west end, past the church: an equinox week)
const DS_LAT = DSP.lat, DS_SL = Math.sin(DS_LAT), DS_CL = Math.cos(DS_LAT);
// a body on the celestial equator at hour angle h → world direction
const dsSky = (h) => [Math.sin(h), DS_CL * Math.cos(h), -DS_SL * Math.cos(h)];
const dsSunDir = (s) => dsSky(dsH(s));
const dsSunAlt = (s) => Math.asin(MathX.clamp(DS_CL * Math.cos(dsH(s)), -1, 1));     // rad
// the stars turn with the spin against the stars (a bit more than the sun's turn): angle about the pole
const dsStarAngle = (s) => dsH(s) + DSP.orbit * s;
const DS_POLE = [0, DS_SL, DS_CL];                                         // the Pole Star: 35° up, due north
// the Moon: a waxing gibbous, 110° east of the sun on Sunday; it creeps east 12.2° a (real) day
const dsMoonH = (s) => dsH(s) - (110 * Math.PI / 180 + 2 * Math.PI * s / (29.53 * 86400));
// sunrises and sunsets: the k-th (k = 0, 1, …) after noon on Sunday
const dsSunset = (k) => dsSAtH(Math.PI / 2 + 2 * Math.PI * k);
const dsSunrise = (k) => dsSAtH(3 * Math.PI / 2 + 2 * Math.PI * k);
// the next sunset / sunrise after s
function dsNext(s, rise) { const h = dsH(s), base = rise ? 1.5 * Math.PI : 0.5 * Math.PI, k = Math.max(0, Math.ceil((h - base) / (2 * Math.PI) + 1e-9)); return dsSAtH(base + 2 * Math.PI * k); }
// which day it is by the sun (sunrises since Sunday noon) — the HUD's day count
const dsSunrises = (s) => Math.max(0, Math.floor((dsH(s) - 1.5 * Math.PI) / (2 * Math.PI)) + 1);
// light: 0 at night, 1 in full day, through twilight (the sun's altitude, deg)
const dsDaylight = (s) => dsSm(dsSunAlt(s) * 180 / Math.PI, -7, 6);
const dsTwilight = (s) => { const a = dsSunAlt(s) * 180 / Math.PI; return Math.max(0, 1 - Math.abs(a - 1) / 9); };   // the low warm light of a sunrise/sunset

// the oceans and the air (equilibrium, for the diagram): the level surface's change at latitude φ (m), with the elastic
// Earth's 0.7 (1 + k − h), for a global ocean
const dsGeoid = (s, phi) => 0.7 * (dsW(s) ** 2 - DSP.w0 ** 2) * DSP.R ** 2 / (2 * DSP.g) * (Math.cos(phi) ** 2 - 2 / 3);

// the clock (12-hour) and the weekday: s → { day, h, m, sec, pm }
const DS_DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
function dsClockParts(s) {
  const S = Math.floor(s + 12 * 3600 + 1e-6), d = Math.floor(S / 86400), r = ((S % 86400) + 86400) % 86400, H = Math.floor(r / 3600);
  return { day: DS_DAYS[Math.max(0, d)], h: H % 12 === 0 ? 12 : H % 12, h24: H, m: Math.floor(r / 60) % 60, sec: r % 60, pm: H >= 12 };
}
const dsHM = (s) => { const c = dsClockParts(s); return `${c.h}:${String(c.m).padStart(2, '0')} ${c.pm ? 'PM' : 'AM'}`; };
// a duration (s) as "20 h 19 min" / "84 min" / "9 s"
function dsDur(x) { x = Math.max(0, x); if (x >= 3600) { const h = Math.floor(x / 3600), m = Math.floor(x / 60) % 60; return `${h} h ${String(m).padStart(2, '0')} min`; } if (x >= 60) return `${Math.floor(x / 60)} min ${String(Math.floor(x % 60)).padStart(2, '0')} s`; return `${Math.floor(x)} s`; }

// how long a sunset takes (the disc, 0.53°, crossing the horizon on its tilted path), s
const dsSunsetLen = (s) => 0.53 / (dsW(s) * 180 / Math.PI * Math.sin(Math.PI / 2 - DS_LAT));

// things that slide or roll once down leans past their angle: distance along the ground (south, m) at s. It breaks loose
// when tan θ reaches the static friction mu (or rolling resistance), then slides on kinetic friction 0.8 mu:
// a = k g_eff (sin θ − 0.8 mu cos θ), k = 5/7 for a rolling ball. Integrated once at build time in 0.25 s steps over
// `span` story seconds from the moment it breaks loose (pure: the same table every time); after that it is far away.
function dsSlider(mu, k = 1, span = 900, kin = 0.8) {
  const s0 = dsSAtTilt(Math.atan(mu) * 180 / Math.PI), n = Math.round(span / 0.25), ds = span / n, X = new Float64Array(n + 1);
  let v = 0, x = 0;
  for (let i = 0; i < n; i++) { const s = s0 + (i + 0.5) * ds, th = dsTilt(Math.min(s, DS_LIFT)), ge = dsGEff(Math.min(s, DS_LIFT)), a = Math.max(-v / ds, k * ge * (Math.sin(th) - kin * mu * Math.cos(th))); v += a * ds; x += v * ds; X[i + 1] = x; }
  const f = (s) => { if (s <= s0) return 0; if (s >= s0 + span) return X[n] + 1e3; const u = (s - s0) / ds, i = Math.floor(u); return X[i] + (X[i + 1] - X[i]) * (u - i); };
  f.s0 = s0; return f;
}
