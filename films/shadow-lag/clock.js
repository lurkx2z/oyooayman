/* =====================================================================
   CLOCK — the caption beats and the story clock of "What if your shadow lagged 1 second behind you?".
   ★ The edit is built AROUND THE CAPTIONS (window.SHT, written by build-timing.cjs from CAPTIONS.md). Story time s is
   seconds after the moment your shadow falls 1 second behind you. ONE clock for the whole film (SH_CLOCK): it only ever
   runs forward (the owner's rule of 2026-10-29: no replays; a new angle or place moves the clock on). It runs at real
   speed except where a single second is the whole point (the step out of the door, the hand, the stop, the turn, the
   jump, the pillar, the torch, the start of the run: three or four times slower, and the HUD says so), and it jumps
   forward only at a cut (to level 2, to the exit; the HUD says how far). Everything that moves (physics.js) is placed
   on story time from these caption times, so changing a caption's timing moves the story with it.
   The wall clock: SH_T0 is chosen so that the lamps' night mode (half of them off) lands exactly on 12:00:00 AM.
   ===================================================================== */

const SHT_ID = Object.fromEntries(SHT.groups.map((g) => [g.id, g]));
const shS = (id) => SHT_ID[id].first;         // the beat's first caption appears (film s)
const shE = (id) => SHT_ID[id].end;           // its last caption goes
const shCap = (id, k) => SHT_ID[id].caps[k];  // a caption: { text, show, hide, words }
const shC = (id, k) => SHT_ID[id].caps[k].show;
const shB = (id, d = 0.6) => shS(id) - d;     // a cut just before beat id's first caption

const SH = {};
SH.title = [-0.4, shE('title') + 0.25];
SH.end = SHT.duration;
SH.tOn = 3.0;                                  // ★ (film) your shadow falls 1 second behind you (s = 0)

// [film t where a segment starts, story s there (at least), how it runs]
//   'real'      real speed; ['rate', r] a steady rate; 'to' reaches the next segment's s exactly when it starts.
//   The next segment starts at max(where this one got to, its own s): a jump forward, always at a cut (shots.js checks)
const SH_CLOCK = (() => {
  const C = shC, B = shB;
  const slow = (t0, t1, k) => [[t0, null, ['rate', 1 / k]], [t1, null, 'real']];   // k times slower from t0 to t1
  const S = [
    [-2, -5, 'real'],
    [SH.tOn, 0, 'to'],                                     // ★ the step out of the door: 4× slower…
    [C('start', 1) - 0.3, 1.32, 'to'],                     // …until your shadow follows, as "1 second later, it followed you"
    [C('start', 1) + 2.6, 2.7, 'real'],
    ...slow(C('hand', 0) + 0.3, C('hand', 2) + 1.4, 3.5),  // the hand rises; its shadow waits; then copies you
    ...slow(C('stop', 0) - 0.2, C('stop', 1) + 1.6, 3),    // the shadow walks into you
    ...slow(C('turn', 0) - 0.2, shCap('turn', 0).hide + 0.6, 3),   // it still faces the other way
    ...slow(C('jump', 0) + 0.2, C('jump', 1) + 2.2, 3),    // it jumps after you've landed
    ...slow(C('hide', 0) + 0.8, C('hide', 1) + 2.4, 3),    // your shadow out in the open
    ...slow(C('guard', 2) - 0.4, C('guard', 2) + 3.6, 3),  // you shield your eyes; your shadow does it a second later
    [C('run', 0) + 0.4, null, ['rate', 1 / 4]],             // you run; your shadow just stands there (4× slower)…
    [C('run', 1) + 1.8, null, ['rate', 1 / 2.5]],           // …then runs too
    [C('run', 2) + 1.0, null, 'real'],
    ...slow(C('car', 1) - 2.9, shE('car') + 0.3, 2.5),     // your car pulls away; your seated shadow a second behind it
    ...slow(C('speed', 0) - 0.5, shE('speed') + 0.3, 5),   // the ramp at 25 km/h (5× slower: 7 m behind, on the wall)
    [B('cctv'), null, 'jumpTo', 34],                       // the ramps down: +34 s at the cut to level 2
    ...slow(C('cctv', 0) + 0.5, C('cctv', 1) + 2.2, 3),    // camera 7: your car, then your shadow
    [B('exit'), null, 'jumpTo', 27],                       // the exit lane: +27 s at the cut
    ...slow(C('exit', 0) + 0.6, C('exit', 1) + 0.7, 2),    // you stop; your shadow stops a second later
  ];
  // resolve: a 'rate'/'real' segment with s = null continues from where the last one got to; 'jumpTo' d → +d s
  const out = [];
  S.forEach((g, i) => {
    const t0 = g[0], nx = S[i + 1], t1 = nx ? nx[0] : SH.end + 5, pv = out[i - 1];
    let s0 = g[1], mode = g[2];
    if (pv) { const reach = pv.s1; if (s0 == null) s0 = reach; else if (pv.mode !== 'to') s0 = Math.max(s0, reach); }
    if (mode === 'jumpTo') { s0 = pv.s1 + g[3]; mode = 'real'; }
    const rate = mode === 'real' ? 1 : mode === 'to' ? (nx[1] - s0) / (t1 - t0) : mode[1];
    out.push({ t0, t1, s0, s1: s0 + rate * (t1 - t0), rate, mode: mode === 'to' ? 'to' : 'run' });
  });
  out.forEach((g, i) => {
    if (!(g.t1 > g.t0) || g.rate <= 0) throw new Error(`SH_CLOCK: segment ${i} (t ${g.t0.toFixed(2)}–${g.t1.toFixed(2)}) runs backwards`);
    if (i && g.s0 < out[i - 1].s1 - 1e-6) throw new Error(`SH_CLOCK: segment ${i} starts before the last one ended (s ${g.s0.toFixed(3)} < ${out[i - 1].s1.toFixed(3)})`);
  });
  return out;
})();
function shSegAt(t) { const K = SH_CLOCK; let i = 0; while (i < K.length - 1 && t >= K[i + 1].t0) i++; return K[i]; }
function shStoryAt(t) { const g = shSegAt(t); return g.s0 + g.rate * (t - g.t0); }
const shRateAt = (t) => shSegAt(t).rate;                  // story seconds per film second (1 = real speed)
// the clock's jumps (film times where the story skips ahead), for the HUD's "+34 s"
const SH_JUMPS = SH_CLOCK.slice(1).map((g, i) => ({ t: g.t0, ds: g.s0 - SH_CLOCK[i].s1 })).filter((j) => j.ds > 0.5);
// the film time at which story time s is on screen (the clock is monotonic: bisect)
function shFilmAt(s) { let a = -2, b = SH.end + 1; for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (shStoryAt(m) < s) a = m; else b = m; } return (a + b) / 2; }
// story time at a caption's appearance (+ d film seconds)
const shSC = (id, k, d = 0) => shStoryAt(shC(id, k) + d);

// the wall clock: midnight (the lamps' night mode) falls 0.8 s before "12:00 AM" comes up
const SH_MIDNIGHT_S = shSC('midnight', 0, -0.8);
const SH_T0 = 24 * 3600 - SH_MIDNIGHT_S;                  // seconds after midnight on Friday 13 Nov at s = 0 (23:57:xx)
function shClockParts(s) {
  let x = SH_T0 + s; const sat = x >= 24 * 3600; if (sat) x -= 24 * 3600;
  const h24 = Math.floor(x / 3600), m = Math.floor((x % 3600) / 60), sec = Math.floor(x % 60), ms = Math.floor((x % 1) * 1000);
  return { day: sat ? 'SAT 14 NOV' : 'FRI 13 NOV', h: ((h24 + 11) % 12) + 1, m, sec, ms, pm: h24 >= 12 };
}
