/* =====================================================================
   PHYSICS — "What if sound kept getting slower and couldn't stop?" Every number on screen comes from here (PLAN.md § 2).
   THE RULE: from 7:00:00 on a Saturday, the speed of sound in air halves every hour, everywhere at once, and nothing
   else about the air changes. h = hours after 7:00 (story time).
     c(h)        = 343 m/s × 2^−h at the ground (20 °C); 295 m/s × 2^−h at an airliner's 11 km (−56 °C)
     D(h0, h1)   = how far a sound made at h0 has travelled by h1 (sound already flying slows down with the rest):
                   ∫ c dt = c0 · τ · (2^−h0 − 2^−h1), τ = 3600 s / ln 2 = 5,194 s
     H(h)        = D(h, ∞) = c(h) · τ: the farthest a sound made at h can ever travel (the "sound horizon")
     arrival     = solve D(h0, h1) = d for h1
   Doppler (a source moving at v along the line to you; you still): f' = f / (1 − v_r/c), v_r its speed towards you.
   A source faster than sound reaches you only once its cone has passed, and then from two emission times at once:
   the sounds it made coming towards you arrive in reverse order. All of that falls out of solving, for each moment
   you hear, which emission times' sound is just reaching you (ssHeardFrom), which the sound and the rings both use.
   ===================================================================== */

const SSP = {
  c0: 343,                    // m/s at 20 °C, sea level
  cAlt0: 295,                 // m/s at 11 km in the standard atmosphere (−56.5 °C)
  tau: 3600 / Math.LN2,       // s: the e-folding time of a halving every hour
  plane: 250,                 // m/s: an airliner cruising (Mach 0.85 at 11 km)
  car: 13.41,                 // m/s: 30 mph in town
  motorway: 31.3,             // m/s: 70 mph
  box: 3.0,                   // m: the music box to your ears (22:00)
};
const ssC = (h) => SSP.c0 * Math.pow(2, -h);
const ssCAlt = (h) => SSP.cAlt0 * Math.pow(2, -h);
const ssDist = (h0, h1) => (h1 <= h0 ? 0 : SSP.c0 * SSP.tau * (Math.pow(2, -h0) - Math.pow(2, -h1)));
const ssHorizon = (h) => SSP.c0 * SSP.tau * Math.pow(2, -h);
// the story hour at which a sound made at h0 has gone d metres (Infinity if it never gets there)
function ssArriveH(h0, d) { const x = Math.pow(2, -h0) - d / (SSP.c0 * SSP.tau); return x <= 0 ? Infinity : -Math.log2(x); }
// the hour when the speed of sound falls to v (m/s)
const ssHourAt = (v) => Math.log2(SSP.c0 / v);
// the clock: hours after 7:00 → "7:14 AM" (or with seconds)
function ssClockParts(h) {
  const s = Math.round((7 + h) * 3600 * 1000) / 1000, H = Math.floor(s / 3600) % 24, M = Math.floor(s / 60) % 60, S = Math.floor(s % 60);
  return { H, h12: ((H + 11) % 12) + 1, m: M, s: S, pm: H >= 12 };
}
function ssClockText(h, secs = false) {
  const c = ssClockParts(h);
  return `${c.h12}:${String(c.m).padStart(2, '0')}${secs ? ':' + String(c.s).padStart(2, '0') : ''}`;
}
const ssAmPm = (h) => (ssClockParts(h).pm ? 'PM' : 'AM');
// a story clock time → h
const ssAtClock = (H, M = 0, S = 0) => (H * 3600 + M * 60 + S) / 3600 - 7;

// a speed, said the way a person would (m/s → "343 m/s", "67 cm/s", "2.6 mm/s")
function ssFmtSpeed(c) {
  if (c >= 200) return Math.round(c) + ' m/s';
  if (c >= 100) return c.toFixed(1) + ' m/s';
  if (c >= 10) return c.toFixed(1) + ' m/s';
  if (c >= 1) return c.toFixed(2) + ' m/s';
  if (c >= 0.1) return Math.round(c * 100) + ' cm/s';
  if (c >= 0.01) return (c * 100).toFixed(1) + ' cm/s';
  if (c >= 0.001) return (c * 1000).toFixed(1) + ' mm/s';
  if (c >= 1e-4) return (c * 1000).toFixed(2) + ' mm/s';
  return (c * 1e6).toFixed(0) + ' µm/s';
}
// a distance (m) → "1,781 km", "870 m", "14 m", "21 cm"
function ssFmtDist(d) {
  if (!isFinite(d)) return 'NEVER';
  if (d >= 10000) return Math.round(d / 1000).toLocaleString('en-GB') + ' km';
  if (d >= 1000) return (d / 1000).toFixed(1) + ' km';
  if (d >= 10) return Math.round(d) + ' m';
  if (d >= 1) return d.toFixed(1) + ' m';
  if (d >= 0.01) return Math.round(d * 100) + ' cm';
  return (d * 1000).toFixed(1) + ' mm';
}
// what the speed is as fast as (for the readout's comparison line)
const SS_LIKE = [
  [300, 'FASTER THAN AN AIRLINER'], [200, 'AS FAST AS AN AIRLINER'], [110, 'A RACING PLANE'], [70, 'A BULLET TRAIN'],
  [35, 'A CAR ON THE MOTORWAY'], [17, 'A CAR IN TOWN'], [9, 'A CYCLIST SPRINTING'], [5.5, 'A MODERATE BREEZE'], [3.4, 'A GENTLE BREEZE'], [2, 'SOMEONE JOGGING'],
  [1, 'SOMEONE WALKING'], [0.45, 'A SLOW STROLL'], [0.2, 'A CAT CREEPING'], [0.06, 'SLOWER THAN A TORTOISE'], [0.015, 'A BEETLE'],
  [0.0045, 'AN ANT CARRYING A LEAF'], [0.0024, 'A CHAMPION RACING SNAIL'], [0.0008, 'A GARDEN SNAIL'], [0, 'SLOWER THAN A SNAIL'],
];
function ssLike(c) { for (const [v, w] of SS_LIKE) if (c >= v) return w; return SS_LIKE[SS_LIKE.length - 1][1]; }
// the landmarks the readout looks ahead to: [h, what]
const SS_NEXT = [];
SS_NEXT.push(
  [Math.log2(SSP.cAlt0 / SSP.plane), 'AIRLINERS BREAK THE SOUND BARRIER'],
  [ssHourAt(SSP.plane), 'THEIR BOOMS REACH THE GROUND'],
  [1, 'HALF SPEED'],
  [ssHourAt(85), 'SLOWER THAN A BULLET TRAIN'],
  [ssHourAt(SSP.motorway), 'MOTORWAY CARS BREAK THE SOUND BARRIER'],
  [ssHourAt(SSP.car), 'TOWN CARS BREAK THE SOUND BARRIER'],
  [ssHourAt(25), 'KICKED BALLS BREAK THE SOUND BARRIER'],
  [ssHourAt(5.5), 'A BREEZE OUTRUNS SOUND'],
  [ssHourAt(2.7), 'JOGGERS BREAK THE SOUND BARRIER'],
  [ssHourAt(1.35), 'WALKERS BREAK THE SOUND BARRIER'],
  [ssHourAt(0.72), 'CATS OUTRUN THEIR MEOWS'],
  [ssHourAt(0.06), 'SLOWER THAN A TORTOISE'],
  [ssHourAt(0.011), '1 CENTIMETRE A SECOND'],
  [ssHourAt(0.0028), 'SNAIL SPEED'],
  [23, 'DAWN'],
);
SS_NEXT.sort((a, b) => a[0] - b[0]);
function ssNextAt(h) { for (const [hh, w] of SS_NEXT) if (hh > h + 1e-6) return { h: hh, what: w }; return null; }

// ---------------------------------------------------------------------------------------------------------------------
// RECEPTION: which emission times are reaching a listener right now. A source path src(te) → [x, y, z] (story h from
// film time via ssH, see script.js), listener at L. Returns the emission film times te < t with D(h(te), h(t)) =
// |src(te) − L|, found by scanning te backwards over `look` seconds in `steps` steps (every root: a supersonic
// source gives two). Used by the rings (which shells have reached you) and the soundtrack (what you hear).
// ---------------------------------------------------------------------------------------------------------------------
function ssHeardFrom(src, L, t, look = 10, steps = 400) {
  const out = [], ht = ssH(t);
  let prev = null, prevTe = 0;
  for (let i = 0; i <= steps; i++) {
    const te = t - look * i / steps, p = src(te);
    const g = ssDist(ssH(te), ht) - Math.hypot(p[0] - L[0], p[1] - L[1], p[2] - L[2]);
    if (prev !== null && (g > 0) !== (prev > 0)) out.push(te + (prevTe - te) * (g / (g - prev)));
    prev = g; prevTe = te;
  }
  return out;
}
