/* =====================================================================
   BUILD-TIMING — the caption half of the master timeline for "What if the universe got cut in half?" (voiceless,
   like the Slower light film: captions and sound only).
     node films/universe-cut/build-timing.cjs
   Reads CAPTIONS.md and places every caption at reading pace: PAUSE[k] = the empty screen before beat k's first
   caption; inside a beat each caption holds for hold(chars) and the next follows after GAP. Every beat in script.js
   keys off these captions' words (each word gets an anchor time inside its caption), so changing a pause or a line
   here re-times the whole film. Writes timing.js (window.HVT). Pure data: no clock, no randomness.
   ★ From the "10:00:00." caption to the shock (10:03:42.5) the film runs in REAL TIME. Beats in STORY_AT are pinned to
   the story second they describe (physics.js computes those seconds; PLAN.md § 2), counted from the "10:00:00."
   caption. (The slowed-down replay of the Moon and the space shots are cutaways inside those minutes: the story clock
   keeps running behind them.)
   Retention (the owner's note, 2026-10-25): short pauses, a new thing to see every few seconds; the long pauses are
   only where the picture itself is the reveal.
   ===================================================================== */
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
// empty screen before each beat's first caption (s); default 1.0
const PAUSE = {
  open: 0.5, title: 0.9, before: 0.9, rule: 0.7, vanish: 2.2, line: 0.6, moon: 0.9, nothing: 1.0, why: 0.8, gone: 1.0, face: 0.9, blow: 0.8, shock: 1.0,
  calls: 2.5, tv: 1.3, front: 1.4, edge: 1.4, moonedge: 1.5, others: 1.6, tea: 1.3, saturn: 1.6, sun: 1.2, cat: 2.0, bath: 1.0, ears: 1.0, alarms: 1.0,
  fall: 2.0, moonaway: 1.2, orbit: 1.2, forever: 1.2, real: 1.8, real2: 0.7, real3: 0.8, real4: 0.8, real5: 1.0, question: 1.6,
};
// the real-time beats: the story second (after 10:00:00) at which the beat's first caption appears
const STORY_AT = { heavier: 180.0, paris: 204.4, count: 217.1, hit: 229.1 };
// extra empty screen before one caption inside a beat: 'beat:index' → s (where the picture itself is the reveal)
const EXTRA = {
  'open:1': 0.4, 'open:2': 0.3, 'line:1': 0.3, 'moon:1': 0.6, 'moon:2': 0.4, 'nothing:1': 0.8, 'why:1': 0.4, 'gone:1': 0.4, 'gone:2': 0.3,
  'face:1': 0.3, 'face:2': 0.3, 'shock:1': 0.3, 'shock:2': 0.4, 'tv:1': 0.3, 'front:1': 0.8, 'front:2': 0.7, 'edge:1': 0.6, 'edge:2': 0.9,
  'moonedge:1': 0.9, 'others:1': 0.8, 'tea:1': 0.3, 'saturn:1': 1.0, 'sun:1': 0.4, 'heavier:1': 0.6, 'bath:1': 0.3, 'ears:1': 0.2, 'alarms:1': 0.3,
  'fall:1': 0.6, 'fall:2': 0.6, 'moonaway:1': 0.4, 'moonaway:2': 0.5, 'orbit:1': 0.4, 'forever:1': 0.8, 'real2:1': 0.3, 'real3:1': 0.3, 'real4:1': 0.3,
};
const SECTION_OF = { open: 1, title: 1, before: 2, vanish: 3, hit: 4, fall: 5, real: 6 };
const GAP = 0.6;                     // between captions inside a beat
const TAIL = 4.0;                     // the question held, then the cut
const hold = (s) => Math.min(4.2, Math.max(1.5, 1.0 + 0.05 * s.length));
const TITLE_HOLD = 3.4;
const r3 = (x) => Math.round(x * 1000) / 1000;

const text = fs.readFileSync(path.join(DIR, 'CAPTIONS.md'), 'utf8').replace(/^---[\s\S]*?\n---\n/, '');
const beats = text.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => /^\[[\w-]+\]/.test(p))
  .map((p, k) => { const m = /^\[([\w-]+)\]\s*([\s\S]*)$/.exec(p); return { id: m[1], n: k + 1, caps: m[2].replace(/\s+/g, ' ').trim().split(' / ') }; });
for (const k of Object.keys(PAUSE)) if (!beats.find((b) => b.id === k)) throw new Error('PAUSE: no beat ' + k);
for (const k of Object.keys(STORY_AT)) if (!beats.find((b) => b.id === k)) throw new Error('STORY_AT: no beat ' + k);
for (const k of Object.keys(EXTRA)) { const [id, i] = k.split(':'); const B = beats.find((b) => b.id === id); if (!B || !B.caps[+i]) throw new Error('EXTRA: no caption ' + k); }
let sec = 0; const SECTION = beats.map((b) => (sec = SECTION_OF[b.id] || sec));

const groups = [];
let t = 0, t0 = null;
beats.forEach((B, k) => {
  let c0 = r3(t + (PAUSE[B.id] ?? 1.0));
  if (STORY_AT[B.id] != null) {
    const want = r3(t0 + STORY_AT[B.id]);
    if (want < t + 0.3) throw new Error(`STORY_AT ${B.id}: wants ${want.toFixed(2)} but the previous beat ends at ${t.toFixed(2)} (shorten something before it)`);
    c0 = want;
  }
  const caps = B.caps.map((s, i) => {
    c0 = r3(c0 + (EXTRA[B.id + ':' + i] || 0));
    const d = B.id === 'title' ? TITLE_HOLD : hold(s), ws = s.split(' ');
    const cap = { text: s, show: c0, hide: r3(c0 + d), words: ws.map((w, j) => ({ text: w, start: r3(c0 + 0.7 * d * j / ws.length) })) };
    c0 = r3(c0 + d + GAP);
    return cap;
  });
  const g = { id: B.id, n: B.n, section: SECTION[k], title: B.id === 'title', first: caps[0].show, end: caps[caps.length - 1].hide, caps };
  groups.push(g);
  if (B.id === 'vanish') t0 = g.first;
  t = g.end;
});
const HVT = { duration: r3(t + TAIL), groups, t0 };
fs.writeFileSync(path.join(DIR, 'timing.js'), `/* Caption timing for "What if the universe got cut in half?", generated by build-timing.cjs from CAPTIONS.md.
   Do not edit by hand: change the captions or PAUSE/GAP/TAIL there and re-run it. */
window.HVT = ${JSON.stringify(HVT)};
`);
const S = (x) => x - t0;
for (const g of groups) console.log(`${String(g.n).padStart(2)} ${g.first.toFixed(2).padStart(7)} → ${g.end.toFixed(2).padStart(7)}${g.section === 3 || g.id === 'hit' ? ' (story ' + S(g.first).toFixed(1).padStart(5) + ' s)' : '               '}  [${g.id}] ${g.caps.map((c) => c.text).join(' / ')}`);
console.log(`${groups.reduce((n, g) => n + g.caps.length, 0)} captions · film ${HVT.duration} s (${Math.floor(HVT.duration / 60)}:${String(Math.round(HVT.duration % 60)).padStart(2, '0')})`);
