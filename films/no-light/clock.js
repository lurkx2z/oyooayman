/* =====================================================================
   CLOCK — the caption beats and the story clock of "What if there was no light in the universe?".
   ★ The edit is built AROUND THE CAPTIONS (window.NLT, written by build-timing.cjs from CAPTIONS.md). Story time s is
   seconds after 2:40:00 PM on Sunday 10 January 2027, when every photon of visible light stops existing. ONE clock for
   the whole film (NL_CLOCK): it only ever runs forward (the owner's rule of 2026-10-29: no replays; a new angle or
   place moves the clock on). It runs at real speed, and jumps forward only at a cut (the HUD says how far): while the
   world beat starts, while you crawl, and before the ice cracks under your hands. Everything that moves (physics.js)
   is placed on story time from these caption times, so changing a caption's timing moves the story with it.
   ===================================================================== */

const NLT_ID = Object.fromEntries(NLT.groups.map((g) => [g.id, g]));
const nlS = (id) => NLT_ID[id].first;         // the beat's first caption appears (film s)
const nlE = (id) => NLT_ID[id].end;           // its last caption goes
const nlCap = (id, k) => NLT_ID[id].caps[k];  // a caption: { text, show, hide, words }
const nlC = (id, k) => NLT_ID[id].caps[k].show;
const nlB = (id, d = 0.6) => nlS(id) - d;     // a cut just before beat id's first caption

const NL = {};
NL.title = [-0.4, nlE('title') + 0.25];
NL.end = NLT.duration;
NL.tOn = nlE('title') + 0.2;                   // ★ (film) 2:40:00 PM: the light stops (s = 0)
NL.jumps = { world: 40, crawl: 352, edge: 120 };

// [film t where a segment starts, story s there (null = carry on), how it runs]: real speed, or a jump of d seconds
const NL_CLOCK = (() => {
  const B = nlB, J = NL.jumps;
  const S = [[-2, -2 - NL.tOn, 'real'], [B('world'), null, 'jump', J.world], [B('crawl'), null, 'jump', J.crawl], [B('edge'), null, 'jump', J.edge]];
  const out = [];
  S.forEach((g, i) => {
    const t0 = g[0], nx = S[i + 1], t1 = nx ? nx[0] : NL.end + 5, pv = out[i - 1];
    let s0 = g[1];
    if (pv) s0 = pv.s1 + (g[2] === 'jump' ? g[3] : 0);
    out.push({ t0, t1, s0, s1: s0 + (t1 - t0), rate: 1, mode: 'run' });
  });
  out.forEach((g, i) => { if (i && g.s0 < out[i - 1].s1 - 1e-6) throw new Error(`NL_CLOCK: segment ${i} runs backwards`); });
  return out;
})();
function nlSegAt(t) { const K = NL_CLOCK; let i = 0; while (i < K.length - 1 && t >= K[i + 1].t0) i++; return K[i]; }
function nlStoryAt(t) { const g = nlSegAt(t); return g.s0 + g.rate * (t - g.t0); }
const nlRateAt = (t) => nlSegAt(t).rate;                  // story seconds per film second (1 = real speed)
// the clock's jumps (film times where the story skips ahead), for the HUD's "+40 s"
const NL_JUMPS = NL_CLOCK.slice(1).map((g, i) => ({ t: g.t0, ds: g.s0 - NL_CLOCK[i].s1 })).filter((j) => j.ds > 0.5);
// the film time at which story time s is on screen (the clock is monotonic: bisect)
function nlFilmAt(s) { let a = -2, b = NL.end + 1; for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (nlStoryAt(m) < s) a = m; else b = m; } return (a + b) / 2; }
// story time at a caption's appearance (+ d film seconds)
const nlSC = (id, k, d = 0) => nlStoryAt(nlC(id, k) + d);

// the wall clock: s = 0 is 2:40:00.000 PM on Sunday 10 January 2027
const NL_T0 = 14 * 3600 + 40 * 60;
function nlClockParts(s) {
  const x = NL_T0 + s, h24 = Math.floor(x / 3600), m = Math.floor((x % 3600) / 60), sec = Math.floor(x % 60), ms = Math.floor(((x % 1) + 1) % 1 * 1000);
  return { day: 'SUN 10 JAN', h: ((h24 + 11) % 12) + 1, m, sec, ms, pm: h24 >= 12 };
}
