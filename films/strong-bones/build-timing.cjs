/* Lays the narration clips (narrator + sister) out on the film's timeline and writes timing.js (window.SBT).
   Every beat of the picture is placed from these times, so the edit follows the real voice.
     node films/strong-bones/build-timing.cjs
   Gaps (seconds of silence before each clip) are the edit's breathing room; the long one before "after" is the choice. */
const fs = require('fs'), path = require('path');
const D = __dirname;
const SEQ = [
  // [who, id, gap before]
  ['n', 'jar', 0.45],
  ['n', 'mug', 0.75],
  ['s', 'sis1', 0.2],
  ['n', 'title', 0.55],
  ['n', 'rule', 0.55],
  ['n', 'nuance', 0.45],
  ['n', 'record', 0.8],
  ['n', 'nick', 0.5],
  ['n', 'final', 0.85],
  ['n', 'scaffold', 0.5],
  ['n', 'cost', 0.3],
  ['n', 'after', 7.2],      // ★ the choice: no voice, then the run and the catch
  ['s', 'sis2', 0.45],
  ['n', 'letter', 0.7],
  ['n', 'cta', 0.6],
];
const TAIL = 1.9;
const dirOf = (who) => path.join(D, who === 'n' ? 'narration' : 'narration-sister');
const out = { clips: {}, order: [] };
let t = 0;
for (const [who, id, gap] of SEQ) {
  const dir = dirOf(who);
  const f = fs.readdirSync(dir).find((x) => x.endsWith('-' + id + '.align.json'));
  if (!f) throw new Error('no clip for ' + id);
  const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  t += gap;
  const mp3 = path.join(path.basename(dir), f.replace('.align.json', '.mp3'));
  out.clips[id] = { who, start: +t.toFixed(3), end: +(t + j.seconds).toFixed(3), mp3, words: j.words.map((w) => ({ w: w.text, s: +(t + w.start).toFixed(3), e: +(t + w.end).toFixed(3) })) };
  out.order.push(id);
  t += j.seconds;
}
out.duration = +(t + TAIL).toFixed(3);
fs.writeFileSync(path.join(D, 'timing.js'), '/* written by build-timing.cjs from the narration clips: do not edit */\nwindow.SBT = ' + JSON.stringify(out) + ';\n');
console.log('duration', out.duration.toFixed(2), 's');
for (const id of out.order) console.log(id.padEnd(9), out.clips[id].start.toFixed(2), out.clips[id].end.toFixed(2));
