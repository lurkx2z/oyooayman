/* =====================================================================
   LIGHTS — how bright every kind of light is at story time s (pure; physics.js gives the laws). 1 = as at 8:59 PM.
     lfGrid(s, d)      anything on the mains: the hum-flicker as the transformers' iron saturates (from ×1.085, s 8.2),
                       then out when the grid trips (d: this place's delay after 14.0 s, its protection's timing)
     lfHospital(s)     the mains, then the backup generators' try (they're magnets too): a weak flicker, then out
     lfEmerg(s, d)     battery LED lights: on when the mains go, dimming as LEDs lose out (LFP.led)
     lfPhone(s, on)    a phone's screen or torch (LED): from when it was switched on
     lfFire(s)         a fire at the same heat (Planck: 1/k²), flickering
     lfHead(s, i)      a car's halogen headlights on its battery (relativity in the lead: V(k)); engines cut at ×1.3
     lfBio(s)          the plankton in the waves (spontaneous emission against fixed losses, like an LED)
     lfAdapt(s)        how far your eyes open up (the grade's exposure, so the film stays watchable): a partial
                       compensation, never a full one
     lfSat(s)          colour left (dyes and your eyes catch less light: absorption ∝ 1/k)
   ===================================================================== */

const lfSm = (x, a, b) => { const u = MathX.clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
// a seeded flicker in [0, 1] (fast), pure in s
const lfFlick = (s, seed, rate = 23) => 0.5 + 0.5 * noise1(s * rate, seed);

function lfGrid(s, d = 0) {
  const s0 = LFP.sTrans, s1 = LFP.sGrid + d;
  if (s < s0) return 1;
  if (s >= s1 + 0.12) return 0;
  // saturation: the voltage sags and hums (dips deepen towards the trip)
  const u = MathX.clamp((s - s0) / (s1 - s0), 0, 1), dip = (0.08 + 0.4 * u * u) * Math.pow(lfFlick(s, 11 + d * 7, 9), 3);
  let v = 1 - dip - 0.15 * u;
  if (s > s1) v *= Math.max(0, 1 - (s - s1) / 0.12) * (0.6 + 0.4 * lfFlick(s, 3, 60));
  return Math.max(0, v);
}
function lfHospital(s) {
  const g = lfGrid(s, 0.15);
  // the backup generators start at 15.5 s and can't hold their voltage (their field is a magnet): two weak surges
  const gen = s > 15.45 && s < 16.0 ? (0.32 * lfSm(s, 15.45, 15.55) * (1 - lfSm(s, 15.85, 16.0))) * (0.55 + 0.45 * lfFlick(s, 21, 40)) : 0;
  return Math.max(g, gen);
}
function lfEmerg(s, d = 0) { const on = lfSm(s, LFP.sGrid + d + 0.15, LFP.sGrid + d + 0.4); return on * LFP.led(LFP.k(s)); }
function lfPhone(s, t0 = -1e9) { return lfSm(s, t0, t0 + 0.3) * LFP.led(LFP.k(s)); }
function lfFire(s, seed = 1) { return LFP.glow(LFP.k(s)) * (0.82 + 0.18 * lfFlick(s, seed, 7) + 0.08 * lfFlick(s, seed + 3, 31)); }
function lfHead(s, i = 0) {
  const k = LFP.k(s), v = LFP.battery(k) / LFP.battery(1), cut = LFP.sSpark + 1.6 * (lfRs2(i) - 0.5);
  // halogen: light ∝ V^3.4; after the engine cuts, the alternator stops: the battery alone (a little lower still)
  return Math.pow(v * (s > cut ? 0.94 : 1), 3.4);
}
function lfBio(s) { return LFP.led(LFP.k(s)); }
function lfAdapt(s) { const k = LFP.k(s); return Math.pow(1 / (LFP.eye(k) * LFP.glow(k)), 0.28); }
function lfSat(s) { const k = LFP.k(s); return 1 / (1 + Math.pow(Math.max(0, k - 1) / 5, 1.6)); }
const lfRs2 = (i) => hash1(i * 7919 + 4421);
