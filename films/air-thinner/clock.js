/* =====================================================================
   CLOCK — the caption beats and the story clock of "What if the air got 1% thinner every minute?".
   ★ The edit is built AROUND THE CAPTIONS (window.ATT, written by build-timing.cjs from CAPTIONS.md). Story time s is
   seconds after 10:00:00 AM ship's time on Saturday 13 November 2027, when the first 1% of the air stops existing.
   ONE clock for the whole film (AT_CLOCK): it only ever runs forward (the owner's rule of 2026-10-29: no replays; a new
   angle or place moves the clock on). It runs at real speed, and jumps forward only at a cut (the HUD says how far).
   Each jump is anchored to a caption: "this caption comes up at that story second" (AT_ANCHORS), so a caption that
   says "10:15" is on screen at 10:15, whatever the timing does. Everything that moves (physics.js) is placed on story
   time, so changing a caption's timing moves the story with it.
   ===================================================================== */

const ATT_ID = Object.fromEntries(ATT.groups.map((g) => [g.id, g]));
const atS = (id) => ATT_ID[id].first;         // the beat's first caption appears (film s)
const atE = (id) => ATT_ID[id].end;           // its last caption goes
const atCap = (id, k) => ATT_ID[id].caps[k];  // a caption: { text, show, hide, words }
const atC = (id, k) => ATT_ID[id].caps[k].show;
const atB = (id, d = 0.6) => atS(id) - d;     // a cut just before beat id's first caption

const AT = {};
AT.title = [-0.4, atE('title') + 0.25];
AT.end = ATT.duration;
AT.tOn = atE('title') + 0.2;                   // ★ (film) 10:00:00 AM: the first 1% goes (s = 0)
const atHMS = (h, m, sec = 0) => (h - 10) * 3600 + m * 60 + sec;   // story s of a ship's-time clock reading (24 h)

// [beat, caption, story s when that caption comes up, lead]: the clock jumps at a cut `lead` film seconds before the
// caption (0.6 = the beat's own first cut, atB), so the caption's own words are true when they show
const AT_ANCHORS = [
  ['boil', 0, atHMS(10, 0, 54)],            // so the second step (10:01) lands while the boil beat is up
  ['ears', 0, atHMS(10, 10, 52)],           // so the 10:11 step lands while her balloon is on screen
  ['storm', 0, atHMS(10, 15, 0.4), 2.0],    // the 10:15 step on screen, then the caption: 863 hPa
  ['cabin', 0, atHMS(10, 29, 50)],          // her balloon bursts on the 10:30 step, just before "Her balloon just burst"
  ['fizz', 0, atHMS(10, 35, 6)],
  ['stairs', 0, atHMS(10, 44, 12)],
  ['tanks', 0, atHMS(10, 46, 2)],
  ['down', 0, atHMS(10, 52, 10)],
  ['engines', 0, atHMS(11, 8, 1.2), 2.2],   // the 11:08 step on screen: under half (49.98 %)
  ['engines', 1, atHMS(11, 13, 1.0), 3.2],  // the power fails on the 11:13 step (the screen is seen lit for 2 s first)
  ['marina', 0, atHMS(11, 20, 8)],
  ['dive', 0, atHMS(11, 23, 20)],
  ['under', 0, atHMS(11, 25, 40)],
  ['everest', 0, atHMS(11, 56, 1.0), 1.6],
  ['shark', 0, atHMS(12, 30, 10)],
  ['oxygen', 0, atHMS(13, 11, 2)],
  ['rise', 0, atHMS(13, 19, 0)],
  ['sky', 0, atHMS(13, 40, 8)],
  ['tubs', 0, atHMS(14, 26, 1.5), 2.6],     // the hot tubs start to boil on screen
  ['tubs', 1, atHMS(14, 37, 1.0), 0.5],
  ['stars', 0, atHMS(15, 0, 6)],
  ['sea', 0, atHMS(15, 27, 1.4), 2.4],      // the pool starts to boil on screen
  ['sea', 1, atHMS(15, 39, 0.8), 2.4],      // the ocean starts to boil on screen
];

// [film t where a segment starts, story s there]: real speed inside each segment
const AT_CLOCK = (() => {
  const out = [{ t0: -2, s0: -2 - AT.tOn }];
  for (const [id, k, s, lead = 0.6] of AT_ANCHORS) { const t = atC(id, k) - lead; out.push({ t0: t, s0: s - lead, id: id + ':' + k }); }
  out.forEach((g, i) => { g.t1 = out[i + 1] ? out[i + 1].t0 : AT.end + 5; g.s1 = g.s0 + (g.t1 - g.t0); g.rate = 1; });
  out.forEach((g, i) => { if (i && g.s0 < out[i - 1].s1 - 1e-6) throw new Error(`AT_CLOCK: the clock would run backwards at ${g.id} (${(g.s0 - out[i - 1].s1).toFixed(1)} s)`); if (i && !(g.t0 > out[i - 1].t0)) throw new Error('AT_CLOCK: anchors out of order at ' + g.id); });
  return out;
})();
function atSegAt(t) { const K = AT_CLOCK; let i = 0; while (i < K.length - 1 && t >= K[i + 1].t0) i++; return K[i]; }
function atStoryAt(t) { const g = atSegAt(t); return g.s0 + g.rate * (t - g.t0); }
const atRateAt = (t) => atSegAt(t).rate;                  // story seconds per film second (1 = real speed)
// the clock's jumps (film times where the story skips ahead), for the HUD's "+9 MIN LATER"
const AT_JUMPS = AT_CLOCK.slice(1).map((g, i) => ({ t: g.t0, ds: g.s0 - AT_CLOCK[i].s1 })).filter((j) => j.ds > 0.5);
// the film time at which story time s is on screen (the clock is monotonic: bisect)
function atFilmAt(s) { let a = -2, b = AT.end + 1; for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (atStoryAt(m) < s) a = m; else b = m; } return (a + b) / 2; }
// story time at a caption's appearance (+ d film seconds)
const atSC = (id, k, d = 0) => atStoryAt(atC(id, k) + d);

// the wall clock: s = 0 is 10:00:00.000 AM on Saturday 13 November 2027 (ship's time)
const AT_T0 = 10 * 3600;
function atClockParts(s) {
  const x = AT_T0 + s, h24 = Math.floor(x / 3600), m = Math.floor((x % 3600) / 60), sec = Math.floor(x % 60), ms = Math.floor(((x % 1) + 1) % 1 * 1000);
  return { day: 'SAT 13 NOV', h: ((h24 + 11) % 12) + 1, m, sec, ms, pm: h24 >= 12 };
}
