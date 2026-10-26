/* =====================================================================
   BUILD-TIMING — the caption half of the master timeline for "What if light started moving backward?" (voiceless,
   like the Slower light film: captions and sound only).
     node films/light-backward/build-timing.cjs
   Reads CAPTIONS.md and places every caption at reading pace: PAUSE[k] = the empty screen before beat k's first
   caption; inside a beat each caption holds for hold(chars) and the next follows after GAP. Every beat in script.js
   keys off these captions' words (each word gets an anchor time inside its caption), so changing a pause or a line
   here re-times the whole film. Writes timing.js (window.LBT). Pure data: no clock, no randomness.
   ★ The first 80 seconds after 10:00:00 run in REAL TIME (the vanish → the second Sun switching on). Beats in STORY_AT
   are pinned to the story second they describe (physics.js computes those seconds; PLAN.md § 2), counted from the
   "10:00:00." caption. (The slowed-down replay of the lantern is a cutaway inside that minute: the story clock keeps
   running behind it.)
   Retention (the owner's note, 2026-10-25): short pauses, a new thing to see every few seconds; the long pauses are
   only where the picture itself is the reveal.
   ===================================================================== */
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
// empty screen before each beat's first caption (s); default 1.0
const PAUSE = {
  open: 0.5, title: 0.9, before: 0.9, rule: 0.9, vanish: 2.6, crescent: 0.4, old: 0.8, mirror: 0.9, replay: 1.0,
  day: 2.4, why: 1.2, shadow: 0.7, wave: 1.1, moonwhy: 0.9, project: 1.3, past: 1.0,
  hawaii: 1.6, black: 1.4, half: 1.0, wait: 1.0, voyager: 1.3, return: 1.6, double: 1.4, full: 1.4, three: 1.0,
  midnight: 2.0, sunrise: 2.0, noon: 1.4, never: 1.6, space: 1.8, summer: 1.2, heat: 0.9, boil: 1.2, birth: 1.6,
  real: 2.2, real2: 0.7, real3: 0.8, real4: 0.9, real5: 0.9, question: 1.6,
};
// the real-time beats: the story second (after 10:00:00) at which the beat's first caption appears
const STORY_AT = { sirius: 20.7, canopus: 57.7, north: 66.4, switch: 80.7 };
// extra empty screen before one caption inside a beat: 'beat:index' → s (where the picture itself is the reveal)
const EXTRA = {
  'open:1': 0.4, 'mirror:2': 0.3, 'canopus:1': 0.4,
  'north:1': 0.6, 'switch:1': 0.25, 'day:1': 0.8, 'day:2': 1.0, 'why:2': 0.5, 'project:1': 1.2, 'project:2': 0.4,
  'shadow:2': 0.3, 'wave:1': 0.3, 'wave:2': 0.4, 'half:1': 0.4, 'voyager:2': 0.5,
  'black:1': 1.0, 'black:2': 0.6, 'return:1': 1.6, 'double:1': 0.6, 'double:2': 0.3, 'double:3': 0.3, 'full:1': 0.6,
  'midnight:2': 0.6, 'sunrise:1': 0.6, 'sunrise:2': 1.0, 'never:1': 0.6, 'never:2': 0.8, 'space:1': 0.6, 'summer:2': 0.6, 'heat:2': 0.5, 'boil:1': 0.4, 'boil:2': 0.6,
  'birth:1': 0.8, 'birth:2': 1.0, 'real3:1': 0.3,
};
const SECTION_OF = { open: 1, title: 1, before: 2, vanish: 3, switch: 4, hawaii: 5, full: 6, space: 7, real: 8 };
const GAP = 0.65;                     // between captions inside a beat
const TAIL = 4.4;                     // the question held, then the cut
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
const LBT = { duration: r3(t + TAIL), groups, t0 };
fs.writeFileSync(path.join(DIR, 'timing.js'), `/* Caption timing for "What if light started moving backward?", generated by build-timing.cjs from CAPTIONS.md.
   Do not edit by hand: change the captions or PAUSE/GAP/TAIL there and re-run it. */
window.LBT = ${JSON.stringify(LBT)};
`);
const S = (x) => x - t0;
for (const g of groups) console.log(`${String(g.n).padStart(2)} ${g.first.toFixed(2).padStart(7)} → ${g.end.toFixed(2).padStart(7)}${g.section === 3 || g.id === 'switch' ? ' (story ' + S(g.first).toFixed(1).padStart(5) + ' s)' : '               '}  [${g.id}] ${g.caps.map((c) => c.text).join(' / ')}`);
console.log(`${groups.reduce((n, g) => n + g.caps.length, 0)} captions · film ${LBT.duration} s (${Math.floor(LBT.duration / 60)}:${String(Math.round(LBT.duration % 60)).padStart(2, '0')})`);
