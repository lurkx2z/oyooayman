/* =====================================================================
   STEPS — the rule and the master clock of "What If Every Step You Took Was Twice as Long?" (classic script: globals).
   The film is built on the narration (window.TWN, written by build-timing.cjs from the real ElevenLabs clips): every
   step is pinned to a word, and every shot (shots.js) to a step or a word.
     the rule     step n is 0.75 m × 2^(n−1) long and takes one second of your own time
     on Earth     steps 1–14 are leaps along the ground (you stand still between some of them); 15 breaks away
     in space     the steps come one after another; from step 30 a step can't be shorter than light allows, so
                  Earth's clock reads √(1 + (L/c)²) seconds while yours reads one (the step's spacetime interval is
                  one second: time dilation). Step 29 is 56% of light speed; step 30 takes 1.7 s on Earth.
   Everything is a pure function of film time t.
   ===================================================================== */

const TW_C = 299792.458e3;                      // the speed of light (m/s)
const TW_LY = 9.4607e15;                        // a light year (m)
const twL = (n) => 0.75 * Math.pow(2, n - 1);   // step n's length (m)
const twSum = (n) => 0.75 * (Math.pow(2, n) - 1);   // steps 1…n put together (m)

// the clips: their first word, a word, their last word
const TWN_ID = Object.fromEntries(TWN.clips.map((c) => [c.id, c]));
function twClip(id) { const c = TWN_ID[id]; if (!c) throw new Error('no narration clip ' + id); return c; }
const twW = (id, k = 0) => { const c = twClip(id); return c.words[Math.min(k, c.words.length - 1)].start; };   // word k starts
const twWE = (id, k) => { const c = twClip(id); return c.words[Math.min(k, c.words.length - 1)].end; };       // word k ends
const twE = (id) => twClip(id).speechEnd;                                                                         // the last word ends
// a word by its text (the i-th match), so shots can sit on "bus", "Moon"…
function twWord(id, text, i = 0) { const c = twClip(id), m = c.words.filter((w) => w.text.toLowerCase().replace(/[^a-z0-9']/g, '') === text.toLowerCase()); if (!m[i]) throw new Error(`no word "${text}" in ${id}`); return m[i]; }

const TW = { end: TWN.duration, N: 91 };

// ---------------------------------------------------------------------------------------------------------------------
// THE STEP SCHEDULE: step n starts (your foot pushes off) at film time TW_T[n]. Anchored steps sit on a word; the
// rest share the time between their anchors evenly. D[n]: how long the stride lasts on screen (film seconds) for the
// steps on the ground (1 s of your time; some are slowed down); in space a stride lasts until the next one.
// ---------------------------------------------------------------------------------------------------------------------
const TW_ANCHOR = {
  1: () => twE('one') + 0.25, 2: () => twW('two') + 0.05, 3: () => twW('three') + 0.05, 4: () => twW('four') + 0.1,
  5: () => twW('five') + 0.1, 6: () => twW('six') + 0.05, 7: () => twW('seven') + 0.05, 8: () => twW('eight') + 0.05,
  9: () => twW('nine') + 0.05, 10: () => twW('ten') + 0.0, 11: () => twW('eleven') + 0.05, 12: () => twW('twelve') + 0.05,
  13: () => twW('thirteen') + 0.05, 14: () => twW('fourteen') + 0.05, 15: () => twW('fifteen') + 0.05,
  16: () => twW('meteor') - 1.4, 18: () => twW('boston') - 0.4, 20: () => twW('space') - 1.0, 21: () => twW('space') + 0.05,
  22: () => twW('station') + 0.05, 24: () => twW('radius') + 0.05, 25: () => twW('across') + 0.05, 26: () => twE('look') + 0.5,
  27: () => twW('fifty') + 0.05, 28: () => twE('fifty') + 0.3, 29: () => twW('moon') + 0.05,
  30: () => twW('earth') - 0.9, 31: () => twW('real') - 0.4, 37: () => twW('mars') + 0.05, 38: () => twE('marstime') + 0.2,
  39: () => twW('sun') + 0.05, 41: () => twW('jupiter') + 0.05, 42: () => twW('saturn') + 0.05, 43: () => twW('pluto') - 0.9,
  44: () => twW('pluto') + 0.05, 45: () => twW('voyager') + 0.05, 46: () => twW('day') + 0.05, 50: () => twW('month') + 0.05,
  53: () => twW('ninemonths') + 0.05, 56: () => twW('proxima') + 0.05, 57: () => twE('keep') + 0.15, 60: () => twW('sixty') + 0.05,
  64: () => twW('sixtyfour') + 0.05, 67: () => twW('climb') + 0.05, 70: () => twW('seventy') + 0.05, 72: () => twW('humans') + 0.05,
  75: () => twW('andromeda') + 0.05, 80: () => twW('dust') + 0.05, 84: () => twW('web') + 0.05, 86: () => twW('sundies') + 0.05,
  90: () => twW('ninety') + 0.05,
};
const TW_T = [], TW_D = [], TW_STRIDE = 3.2;
{
  const a = Object.keys(TW_ANCHOR).map(Number).sort((x, y) => x - y);
  for (const n of a) TW_T[n] = TW_ANCHOR[n]();
  for (let i = 0; i < a.length - 1; i++) for (let n = a[i] + 1; n < a[i + 1]; n++) TW_T[n] = TW_T[a[i]] + (TW_T[a[i + 1]] - TW_T[a[i]]) * (n - a[i]) / (a[i + 1] - a[i]);
  TW_T[91] = TW.end + 30;                         // (never taken)
  // on screen: the ground steps last one second, a few slowed down; in space a stride runs into the next one
  const slow = { 1: 0.9, 2: 1.0, 3: 1.0, 4: 1.1, 5: 2.6, 6: 3.9, 7: 2.2, 8: 2.6, 9: 3.2, 10: 6.6, 11: 1.6, 12: 5.0, 13: 6.2, 14: 3.2 };
  // in space (from step 21) a stride lasts at most TW_STRIDE film seconds: when the narration holds a step for
  // longer, you take it and then wait (the story pauses with you)
  for (let n = 1; n <= 90; n++) TW_D[n] = slow[n] || (n >= 21 ? Math.min(TW_STRIDE, TW_T[n + 1] - TW_T[n]) : TW_T[n + 1] - TW_T[n]);
  for (let n = 2; n <= 90; n++) if (!(TW_T[n] > TW_T[n - 1] + 0.3)) throw new Error(`steps.js: step ${n} at ${TW_T[n].toFixed(2)} is not after step ${n - 1} (${TW_T[n - 1].toFixed(2)})`);
  for (let n = 1; n <= 14; n++) if (!(TW_T[n] + TW_D[n] <= TW_T[n + 1] + 1e-6)) throw new Error(`steps.js: step ${n} has not landed before step ${n + 1}`);
}
// the step you're on at film time t: { n, u (0…1 through it), on (in the air / mid-stride) }. n = 0 before the first.
function twStepAt(t) {
  let n = 0; while (n < 90 && t >= TW_T[n + 1]) n++;
  if (n === 0) return { n: 0, u: 0, on: false, k: 0 };
  const u = (t - TW_T[n]) / TW_D[n];
  return { n, u: MathX.clamp(u, 0, 1), on: u < 1, k: MathX.clamp(u, 0, 1) };
}
// how far you are along your path (m), as a smooth function of t (a stride's distance eases in and out on the ground,
// runs at an even speed in space)
function twDist(t) {
  const s = twStepAt(t);
  if (s.n === 0) return 0;
  const n = s.n, ground = n <= 14, held = n >= 21 && TW_D[n] < TW_T[n + 1] - TW_T[n] - 1e-6;
  const f = ground || held ? Ease.inOutSine(s.u) : s.u;
  return twSum(n - 1) + twL(n) * f;
}
// THE STREET'S CLOCK (story seconds): a slowed stride plays 1 s of the world over D film seconds (slow motion: the
// traffic, the people, the glass all slow down with it); between strides the world runs at film speed.
function twStory(t) {
  let s = t;
  for (let n = 1; n <= 14; n++) { const a = TW_T[n], d = TW_D[n], k = MathX.clamp(t - a, 0, d); s -= k * (1 - 1 / d); }
  return s;
}
// the story time a film time maps to, inverted (for events placed in story time): film time of story second s
function twFilmOf(s) { let lo = -5, hi = TW_T[15] + 5; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (twStory(m) < s) lo = m; else hi = m; } return (lo + hi) / 2; }
// how fast you're going at film time t, as a fraction of light (0 while you wait between held strides)
function twBetaAt(t) {
  const s = twStepAt(t); if (s.n < 15) return 0;
  const held = s.n >= 21 && TW_D[s.n] < TW_T[s.n + 1] - TW_T[s.n] - 1e-6;
  return held ? twBeta(s.n) * Math.pow(Math.sin(Math.PI * s.u), 0.6) * (s.u < 1 ? 1 : 0) : twBeta(s.n);
}
// the counter's number (the step you're taking or have just taken)
const twCounter = (t) => twStepAt(t).n;

// ---------------------------------------------------------------------------------------------------------------------
// EARTH'S CLOCK: every step is one second of your time. On Earth it lasts √(1 + (L/c)²) s (the interval between
// your push-off and your landing is one second of proper time: c²τ² = c²T² − L²). Barely more than 1 s for the
// early steps, 1.7 s for step thirty, and ≈ L/c from then on.
// ---------------------------------------------------------------------------------------------------------------------
const twStepEarthS = (n) => Math.hypot(1, twL(n) / TW_C);
const TW_ET = [0];
for (let n = 1; n <= 92; n++) TW_ET[n] = TW_ET[n - 1] + twStepEarthS(n);
function twEarthS(t) { const s = twStepAt(t); if (!s.n) return 0; return TW_ET[s.n - 1] + twStepEarthS(s.n) * s.u; }
// Earth time in words: '1.3 SECONDS', '3 MINUTES', '6 YEARS', '98 BILLION YEARS'
function twSpan(sec) {
  const Y = 365.25 * 86400, fmt = (v, u) => `${v < 10 && v % 1 ? v.toFixed(1) : Math.round(v).toLocaleString('en-US')} ${u}${Math.round(v * 10) / 10 === 1 ? '' : 'S'}`;
  if (sec < 60) return fmt(sec, 'SECOND');
  if (sec < 3600) return fmt(sec / 60, 'MINUTE');
  if (sec < 86400 * 1.5) return fmt(sec / 3600, 'HOUR');
  if (sec < 86400 * 60) return fmt(sec / 86400, 'DAY');
  if (sec < Y * 1.5) return fmt(sec / (Y / 12), 'MONTH');
  const y = sec / Y;
  if (y < 1e6) return fmt(y, 'YEAR');
  if (y < 1e9) return `${(y / 1e6).toFixed(y < 1e7 ? 1 : 0)} MILLION YEARS`;
  return `${(y / 1e9).toFixed(y < 1e10 ? 1 : 0)} BILLION YEARS`;
}
// your speed during step n (m/s, Earth's frame: the step's length over its Earth time) and as a fraction of light
const twSpeed = (n) => twL(n) / twStepEarthS(n);
const twBeta = (n) => twSpeed(n) / TW_C;
const twMach = (n) => twL(n) / 343;

// ---------------------------------------------------------------------------------------------------------------------
// THE STATUS WORD under the counter: what matters about the step you're on. [film time, text, tone] in order; the
// last one at or before t is shown. tone: '' white · 'hot' red · 'cold' blue · 'time' amber
// ---------------------------------------------------------------------------------------------------------------------
const TW_STATUS = [];
{
  const S = (t, txt, tone = '') => TW_STATUS.push([t, txt, tone]);
  S(-1, '', ''); S(TW_T[1], '75 CM', ''); S(TW_T[2], '1.5 M', ''); S(TW_T[3], '3 M', ''); S(TW_T[4], '6 M', ''); S(TW_T[5], '12 M', '');
  S(twW('rule'), '', ''); S(TW_T[6], '86 KM/H', ''); S(TW_T[7], '173 KM/H', ''); S(TW_T[8], '346 KM/H', 'hot'); S(TW_T[9], '691 KM/H', 'hot');
  S(TW_T[10] + 0.22 * TW_D[10], 'MACH 1', 'hot'); S(TW_T[11], 'MACH 2', 'hot'); S(TW_T[12], 'MACH 4', 'hot'); S(TW_T[13], 'MACH 9', 'hot'); S(TW_T[14], 'MACH 18', 'hot');
  S(TW_T[15], 'ESCAPE VELOCITY', 'hot'); S(TW_T[21], 'SPACE', 'cold'); S(TW_T[27], '⅙ LIGHT SPEED', 'cold'); S(TW_T[29], '56% LIGHT SPEED', 'cold');
  S(TW_T[30], '80% LIGHT SPEED', 'cold');
  // from step 30 on: Earth's clock
  S(twW('earth') - 0.1, 'EARTH: +1.7 SECONDS', 'time');
}
function twStatusAt(t) {
  let k = 0; for (let i = 0; i < TW_STATUS.length; i++) if (TW_STATUS[i][0] <= t) k = i;
  const s = TW_STATUS[k];
  // after Earth's clock appears, it counts with the steps (rounded to what a person would say)
  if (s[2] === 'time') { const e = twEarthS(t); return [`EARTH: +${twSpan(e)}`, 'time', s[0]]; }
  return [s[1], s[2], s[0]];
}

if (typeof module !== 'undefined') module.exports = { twL, twSum, twSpan, TW_ET };
