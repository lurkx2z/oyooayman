/* v2: lays every voice clip (narrator + six characters) out on the film's timeline and writes v2/timing.js (window.SBT).
   The picture is placed from these times, so the edit follows the real voices.
     node films/strong-bones/v2/build-timing.cjs
   Gaps (seconds before each clip) are action beats with no talking: the jar and the mug, the scaffold, the choice. */
const fs = require('fs'), path = require('path');
const D = __dirname;
const ROLE = { n: 'narrator', y: 'you', s: 'sister', d: 'doctor', c: 'coach', a: 'announcer', w: 'worker' };
const SEQ = [
  // [who, id, gap before]
  ['n', 'n_wake', 0.15],
  ['s', 's_handle', 2.7],    // the jar, then the mug
  ['y', 'y_touch', 0.08],
  ['y', 'y_ow', 0.35],
  ['n', 'n_memo', 0.2],
  ['n', 'n_title', 0.5],
  ['d', 'd_cracks', 0.7],
  ['d', 'd_brake', 0.35],
  ['c', 'c_slow', 0.7],
  ['a', 'a_record', 1.5],    // the careful lift, then the record
  ['n', 'n_nick', 0.45],
  ['a', 'a_final', 0.6],
  ['s', 's_phone', 0.5],
  ['w', 'w_going', 1.0],     // the scaffold groans and starts to lean
  ['y', 'y_maya', 0.1],
  ['n', 'n_cost', 0.3],
  ['c', 'c_dare', 0.2],
  ['a', 'a_tv', 5.4],        // ★ the choice: let go, run, catch, crack, a breath of silence
  ['s', 's_idiot', 0.5],
  ['s', 's_thanks', 0.9],
  ['y', 'y_jar', 0.6],
  ['n', 'n_cta', 0.9],
];
const TAIL = 2.2;
const out = { clips: {}, order: [] };
let t = 0.35;
for (const [who, id, gap] of SEQ) {
  const dir = path.join(D, 'voices', ROLE[who]);
  const f = fs.readdirSync(dir).find((x) => x.endsWith('-' + id + '.align.json'));
  if (!f) throw new Error('no clip for ' + id);
  const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  // gaps are measured between spoken words (the clips' own leading/trailing silence is ignored)
  const w0 = j.words[0].start, w1 = j.words[j.words.length - 1].end;
  t += gap; const at = t - w0;            // where the mp3 starts so that its first word lands at t
  const mp3 = path.join('voices', ROLE[who], f.replace('.align.json', '.mp3'));
  out.clips[id] = { who, at: +at.toFixed(3), start: +t.toFixed(3), end: +(at + w1).toFixed(3), mp3, words: j.words.map((w) => ({ w: w.text, s: +(at + w.start).toFixed(3), e: +(at + w.end).toFixed(3) })) };
  out.order.push(id);
  t = at + w1;
}
out.duration = +(t + TAIL).toFixed(3);
fs.writeFileSync(path.join(D, 'timing.js'), '/* written by build-timing.cjs from the voice clips: do not edit */\nwindow.SBT = ' + JSON.stringify(out) + ';\n');
console.log('duration', out.duration.toFixed(2), 's');
for (const id of out.order) console.log(id.padEnd(10), out.clips[id].start.toFixed(2), out.clips[id].end.toFixed(2), (out.clips[id].end - out.clips[id].start).toFixed(2));
