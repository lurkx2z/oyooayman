/* =====================================================================
   PHYSICS — "What if every sound vanished except yours?" Every number on screen comes from here (PLAN.md § 2).
   Story time s = seconds after Thursday 9:41:00 PM, when the rule starts. Pure functions, no state.

   THE RULE: from 9:41:00 PM every sound wave that you did not start dies the instant it starts: voices, rain, engines,
   speakers, animals, alarms. Yours stay: your voice, your breath, your heartbeat, your steps, your clap, anything your
   body strikes, and every echo of them (a reflection of your sound is still your sound). Light, motion and everything
   else carry on as normal. Sound is air being pushed: your pushes still travel at 343 m/s, spread and fade as always.
   What follows (and is drawn):
   - with no other sound to mask it, a quiet sound carries much further: a level L (dB at 1 m) falls 6 dB per doubling
     of distance (spreading) and about 2 dB per km (air absorption, speech frequencies); it is heard until it drops to
     the threshold of hearing (≈ 5 dB at speech frequencies). Normal voice 60 dB → ~500 m; a shout 89 dB → ~5 km;
   - everyone inside that circle hears you, and nothing else (5,000 people per km², a big city's average);
   - echoes come back at 343 m/s, there and back, from every wall in reach: from the middle of the park the tower
     block (170 m) answers in 0.99 s;
   - every warning made of sound fails (sirens, horns, alarms); silent cars are why EVs must hum below 20 km/h (EU
     Regulation 540/2014: new types from July 2019, every new EV from July 2021);
   - bats and echolocating people: clicks and their echoes; a person 7 m away answers in 41 ms.
   ===================================================================== */

const SOP = {
  c: 343,                        // m/s, the speed of sound (20 °C)
  thr: 5,                        // dB: the quietest sound you can hear at speech frequencies (no masking)
  alpha: 0.002,                  // dB per metre: air absorption at ~500 Hz (ISO 9613-1, 10 °C, 80 % humidity)
  density: 5000,                 // people per km² (a big city's average)
  // your sounds (dB SPL at 1 m)
  L: { breath: 10, heart: 0, step: 55, stepWet: 52, clap: 84, voice: 60, call: 66, shout: 89, click: 72, whisper: 30 },
  quietRoom: -20.35,             // dBA: Microsoft's anechoic chamber, Guinness record 2015
  ring: [1953, 94, 80],          // Heller & Bergman, 1953: 94 % of 80 people with normal hearing heard sounds in a soundproof booth
  evLaw: 20,                     // km/h: EU AVAS rule (EVs must make a sound below it)
  bolt: 2060,                    // m: the lightning you count to six (6 × 343)
};
const soSm = (x, a, b) => { const u = MathX.clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
// the distance at which a sound of level L (dB at 1 m) falls to the threshold of hearing (spreading + absorption)
function soHeard(L) {
  if (L <= SOP.thr) return 1;
  let r = 1;
  for (let k = 0; k < 60; k++) { const f = L - 20 * Math.log10(r) - SOP.alpha * r - SOP.thr, d = -20 / (r * Math.LN10) - SOP.alpha; r = Math.max(1, r - f / d); }
  return r;
}
const soPeople = (r) => Math.PI * (r / 1000) ** 2 * SOP.density;     // people within r metres
// a count rounded for the HUD: 4,000 / 400,000
const soRound = (n) => { if (n < 20) return String(Math.round(n)); const p = Math.pow(10, Math.floor(Math.log10(n)) - 1); return (Math.round(n / p) * p).toLocaleString('en-US'); };
const soDist = (r) => (r < 1000 ? `${Math.round(r / 10) * 10} m` : `${(r / 1000).toFixed(1)} km`);
// the numbers the captions say (checked against the formula at load: PLAN.md § 2)
const SO_NUM = (() => {
  const v = soHeard(SOP.L.voice), sh = soHeard(SOP.L.shout);
  return { voiceR: v, voiceN: soPeople(v), shoutR: sh, shoutN: soPeople(sh), clapR: soHeard(SOP.L.clap), stepR: soHeard(SOP.L.step), breathR: soHeard(SOP.L.breath) };
})();

// the walls that answer your shout from the middle of the park: [name, distance m] → the echo's delay (there and back)
const SO_ECHO = [['YOUR BLOCK', 50.0, 0.5], ['THE FLATS ACROSS', 56.0, -0.6], ['THE CHURCH', 69.0, 0.85], ['THE TOWER BLOCK', 170.0, -0.1], ['THE TERRACES', 262.0, -0.9]]
  .map(([name, d, pan]) => ({ name, d, pan, dt: 2 * d / SOP.c }));
// an echo's level under the direct sound (dB): spreading over 2d (from 1 m) and absorption over 2d; a flat wall sends
// back most of it (−3 dB). (Drawn louder than this in the mix so it can be heard on a phone: PLAN.md § 4.)
const soEchoDb = (d) => -(20 * Math.log10(2 * d) + SOP.alpha * 2 * d + 3);

// ---- the clock: story s → { h, m, sec, pm }; 9:41:00 PM at s = 0
function soClockParts(s) {
  const S = Math.floor(21 * 3600 + 41 * 60 + s + 1e-6), H = Math.floor(S / 3600) % 24;
  return { day: 'THURSDAY', h: H % 12 === 0 ? 12 : H % 12, h24: H, m: Math.floor(S / 60) % 60, sec: ((S % 60) + 60) % 60, pm: H >= 12 };
}
const soHMS = (s) => { const c = soClockParts(s); return `${c.h}:${String(c.m).padStart(2, '0')}:${String(c.sec).padStart(2, '0')}`; };
// minutes since the sounds stopped, at story s
const soMinsSince = (s) => Math.floor(Math.max(0, s) / 60);

if (typeof module !== 'undefined') module.exports = { SOP, soHeard, soPeople, SO_NUM, SO_ECHO, soEchoDb };
