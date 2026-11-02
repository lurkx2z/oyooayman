/* =====================================================================
   BUILD-TIMING — the caption half of the master timeline for "What if every sound vanished except yours?"
     node films/sound-only-yours/build-timing.cjs
   Reads CAPTIONS.md and places every caption at reading pace: PAUSE[k] = the empty screen before beat k's first
   caption; inside a beat each caption holds for hold(chars) and the next follows after GAP. A caption that starts with
   {id} is one of your spoken lines: it holds for exactly the clip's length (voices/you/manifest.json) plus a breath,
   and the clip starts VO_LEAD s after it appears. Every beat in script.js keys off these captions, and so does the story
   clock, so changing a pause or a line here re-times the whole film. Writes timing.js (window.SOT). Pure data.
   ===================================================================== */
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const VO = (() => { const p = path.join(DIR, 'voices/you/manifest.json'); const m = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : { clips: [] };
  return Object.fromEntries(m.clips.map((c) => [c.id.replace(/^\d+-/, ''), { file: c.file, seconds: c.seconds }])); })();
// empty screen before each beat's first caption (s); default 0.8
const PAUSE = {
  title: 0.05, what: 0.15, start: 0.3, hello: 0.6, text: 0.7, room: 1.6, clap: 0.8, rule: 0.5, body: 1.2, mum: 1.4, window: 2.6, faces: 1.4,
  stairs: 2.4, behind: 1.6, street: 2.4, car: 1.6, warn: 1.6, heads: 1.8, storm: 2.0, park: 2.2, shout: 1.6, far: 1.2, coming: 2.4, hide: 2.6, echo: 2.4, who: 1.6, question: 2.7,
};
// extra empty screen before one caption inside a beat: 'beat:index' → s (where the picture itself is the reveal)
const EXTRA = {
  'start:1': 0.4, 'room:1': 1.4, 'body:1': 1.6, 'mum:1': 0.6, 'mum:2': 1.4, 'window:1': 0.6, 'window:2': 1.4, 'window:3': 0.3,
  'faces:1': 2.6, 'stairs:1': 0.4, 'stairs:2': 0.4, 'stairs:3': 1.0, 'behind:1': 2.2, 'behind:2': 0.6, 'behind:3': 0.6, 'street:1': 1.0, 'car:1': 3.4,
  'heads:1': 0.6, 'heads:2': 1.2, 'storm:2': 0.5, 'storm:3': 1.6, 'park:1': 0.4, 'shout:1': 0.2, 'shout:2': 0.8, 'shout:3': 0.8, 'far:1': 0.8, 'coming:1': 1.4,
  'hide:1': 0.5, 'hide:2': 2.6, 'warn:1': 0.6, 'warn:2': 0.6, 'coming:2': 0.6, 'echo:1': 0.4, 'echo:2': 1.0, 'echo:3': 1.6, 'echo:4': 1.4, 'echo:5': 1.2, 'who:1': 1.0, 'who:2': 1.0, 'who:3': 0.3,
};
const SECTION_OF = { title: 1, stairs: 2, street: 3, park: 4, hide: 5 };
const GAP = 0.6;                     // between captions inside a beat
const TAIL = -0.3;                   // a hard cut while the question is still on screen (nothing signals the end)
const VO_LEAD = 0.12;                // a spoken line starts this long after its caption appears
const VO_TAIL = 0.45;                // ...and its caption stays this long after the line ends
const hold = (s) => Math.min(4.4, Math.max(1.6, 1.0 + 0.052 * s.length));
const TITLE_HOLD = 3.4;
const LAST_HOLD = 3.6;                // the last question stays up long enough to sit with it
const r3 = (x) => Math.round(x * 1000) / 1000;

const text = fs.readFileSync(path.join(DIR, 'CAPTIONS.md'), 'utf8').replace(/^---[\s\S]*?\n---\n/, '');
const beats = text.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => /^\[[\w-]+\]/.test(p))
  .map((p, k) => { const m = /^\[([\w-]+)\]\s*([\s\S]*)$/.exec(p); return { id: m[1], n: k + 1, caps: m[2].replace(/\s+/g, ' ').trim().split(' / ') }; });
for (const k of Object.keys(PAUSE)) if (!beats.find((b) => b.id === k)) throw new Error('PAUSE: no beat ' + k);
for (const k of Object.keys(EXTRA)) { const [id, i] = k.split(':'); const B = beats.find((b) => b.id === id); if (!B || !B.caps[+i]) throw new Error('EXTRA: no caption ' + k); }
let sec = 0; const SECTION = beats.map((b) => (sec = SECTION_OF[b.id] || sec));

const groups = [];
let t = 0;
beats.forEach((B, k) => {
  let c0 = r3(t + (PAUSE[B.id] ?? 0.8));
  const caps = B.caps.map((s0, i) => {
    c0 = r3(c0 + (EXTRA[B.id + ':' + i] || 0));
    const vm = /^\{(\w+)\}\s*(.*)$/.exec(s0), s = vm ? vm[2] : s0;
    let d, voice = null;
    if (vm) { const v = VO[vm[1]]; const sec = v ? v.seconds : Math.max(1.0, 0.075 * s.length); voice = { id: vm[1], file: v ? v.file : null, start: r3(c0 + VO_LEAD), seconds: sec }; d = Math.max(1.2, VO_LEAD + sec + VO_TAIL); }
    else d = B.id === 'title' ? TITLE_HOLD : k === beats.length - 1 && i === B.caps.length - 1 ? LAST_HOLD : hold(s);
    const ws = s.split(' ');
    const cap = { text: s, show: c0, hide: r3(c0 + d), words: ws.map((w, j) => ({ text: w, start: r3(c0 + 0.7 * d * j / ws.length) })) };
    if (voice) cap.voice = voice;
    c0 = r3(c0 + d + GAP);
    return cap;
  });
  const g = { id: B.id, n: B.n, section: SECTION[k], title: B.id === 'title', first: caps[0].show, end: caps[caps.length - 1].hide, caps };
  groups.push(g);
  t = g.end;
});
const SOT = { duration: r3(t + TAIL), groups };
fs.writeFileSync(path.join(DIR, 'timing.js'), `/* Caption timing for "What if every sound vanished except yours?", generated by build-timing.cjs from CAPTIONS.md.
   Do not edit by hand: change the captions or PAUSE/GAP/TAIL there and re-run it. */
window.SOT = ${JSON.stringify(SOT)};
`);
const mmss = (x) => `${Math.floor(x / 60)}:${(x % 60).toFixed(1).padStart(4, '0')}`;
for (const g of groups) console.log(`${String(g.n).padStart(2)} ${mmss(g.first).padStart(7)} → ${mmss(g.end).padStart(7)}  [${g.id}] ${g.caps.map((c) => (c.voice ? '🗣' : '') + c.text).join(' / ')}`);
console.log(`${groups.reduce((n, g) => n + g.caps.length, 0)} captions · film ${SOT.duration} s (${Math.floor(SOT.duration / 60)}:${String(Math.round(SOT.duration % 60)).padStart(2, '0')})`);
