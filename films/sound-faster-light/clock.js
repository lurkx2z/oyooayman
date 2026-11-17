/* =====================================================================
   CLOCK — the caption beats and the story clock of "What if sound travelled faster than light?".
   ★ The edit is built AROUND THE CAPTIONS (window.SFT, written by build-timing.cjs from CAPTIONS.md). Story time s is
   seconds after 8:52:00 PM on Saturday 24 July 2027, when sound starts travelling at 1,000,000 km/s. ONE clock for the
   whole film (SF_CLOCK): it only ever runs forward (the owner's rule of 2026-10-29: no replays; a new angle or place
   moves the clock on). It runs at real speed and jumps forward once, at a cut (the HUD says how far): as you run into
   the corn. Everything that moves (physics.js) is placed on story time from these caption times, so changing a
   caption's timing moves the story with it.
   ===================================================================== */

const SFT_ID = Object.fromEntries(SFT.groups.map((g) => [g.id, g]));
const sfS = (id) => SFT_ID[id].first;         // the beat's first caption appears (film s)
const sfE = (id) => SFT_ID[id].end;           // its last caption goes
const sfCap = (id, k) => SFT_ID[id].caps[k];  // a caption: { text, show, hide, words }
const sfC = (id, k) => SFT_ID[id].caps[k].show;
const sfB = (id, d = 0.6) => sfS(id) - d;     // a cut just before beat id's first caption

const SF = {};
SF.title = [-0.4, sfE('title') + 0.25];
SF.end = SFT.duration;
SF.tOn = sfE('title') + 0.2;                   // ★ (film) 8:52:00 PM: sound goes faster than light (s = 0)
SF.jumps = { corn: 25 };

// [film t where a segment starts, story s there (null = carry on), how it runs]: real speed, or a jump of d seconds
const SF_CLOCK = (() => {
  const B = sfB, J = SF.jumps;
  const S = [[-2, -2 - SF.tOn, 'real'], [B('corn'), null, 'jump', J.corn]];
  const out = [];
  S.forEach((g, i) => {
    const t0 = g[0], nx = S[i + 1], t1 = nx ? nx[0] : SF.end + 5, pv = out[i - 1];
    let s0 = g[1];
    if (pv) s0 = pv.s1 + (g[2] === 'jump' ? g[3] : 0);
    out.push({ t0, t1, s0, s1: s0 + (t1 - t0), rate: 1, mode: 'run' });
  });
  out.forEach((g, i) => { if (i && g.s0 < out[i - 1].s1 - 1e-6) throw new Error(`SF_CLOCK: segment ${i} runs backwards`); });
  return out;
})();
function sfSegAt(t) { const K = SF_CLOCK; let i = 0; while (i < K.length - 1 && t >= K[i + 1].t0) i++; return K[i]; }
function sfStoryAt(t) { const g = sfSegAt(t); return g.s0 + g.rate * (t - g.t0); }
const sfRateAt = (t) => sfSegAt(t).rate;
// the clock's jumps (film times where the story skips ahead), for the HUD's "+25 s"
const SF_JUMPS = SF_CLOCK.slice(1).map((g, i) => ({ t: g.t0, ds: g.s0 - SF_CLOCK[i].s1 })).filter((j) => j.ds > 0.5);
// the film time at which story time s is on screen (the clock is monotonic: bisect)
function sfFilmAt(s) { let a = -2, b = SF.end + 1; for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (sfStoryAt(m) < s) a = m; else b = m; } return (a + b) / 2; }
// is story moment s on screen (the clock doesn't skip it)? → its film time, or null
function sfSeen(s) { const t = sfFilmAt(s); return Math.abs(sfStoryAt(t) - s) < 0.05 ? t : null; }
// story time at a caption's appearance (+ d film seconds)
const sfSC = (id, k, d = 0) => sfStoryAt(sfC(id, k) + d);

// the wall clock: s = 0 is 8:52:00.000 PM on Saturday 24 July 2027 (CDT)
const SF_T0 = 20 * 3600 + 52 * 60;
function sfClockParts(s) {
  const x = SF_T0 + s, h24 = Math.floor(x / 3600), m = Math.floor((x % 3600) / 60), sec = Math.floor(x % 60), ms = Math.floor(((x % 1) + 1) % 1 * 1000);
  return { day: 'SAT 24 JUL', h: ((h24 + 11) % 12) + 1, m, sec, ms, pm: h24 >= 12 };
}
