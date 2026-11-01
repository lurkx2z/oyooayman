/* Lays every voice clip (the narrator + eight characters) out on the film's timeline and writes timing.js
   (window.KET). The picture is placed from these times, so the edit follows the real voices.
     node films/know-everything/build-timing.cjs
   Gaps (seconds before each clip, measured between spoken words) are action beats with no talking. */
const fs = require('fs'), path = require('path');
const D = __dirname;
const SEQ = [
  // [who, id, gap before]
  ['n', 'n_wake', 0.0],      // the alarm is already ringing
  ['n', 'n_room', 0.7],      // the tags burst out
  ['n', 'n_toast', 1.3],     // the phone buzzes; downstairs
  ['y', 'y_toast', 0.45],
  ['m', 'm_what', 0.3],
  ['m', 'm_how', 1.5],       // pop: burnt
  ['n', 'n_maya', 0.6],
  ['y', 'y_party', 0.45],
  ['m', 'm_party', 0.55],    // Maya freezes
  ['s', 's_kill', 0.35],
  ['n', 'n_lesson', 0.7],
  ['n', 'n_title2', 0.9],
  ['n', 'n_walk', 1.7],      // the title holds
  ['n', 'n_space', 0.5],
  ['n', 'n_hole', 0.7],
  ['n', 'n_dice', 0.8],
  ['n', 'n_mirror', 0.9],    // the can lands
  ['n', 'n_test', 1.8],      // hold on the question mark
  ['t', 't_problem', 1.0],   // the pencil goes down
  ['y', 'y_seven', 0.45],
  ['n', 'n_lunch', 2.0],     // the teacher checks the key
  ['k', 'k_emma', 0.5],
  ['y', 'y_ask', 0.55],
  ['n', 'n_learn', 0.5],
  ['n', 'n_dig', 1.0],
  ['s', 's_what', 0.6],
  ['n', 'n_tin', 0.5],
  ['s', 's_real', 0.7],      // the lid comes off
  ['y', 'y_real', 0.4],
  ['n', 'n_viral', 0.7],
  ['n', 'n_wed', 1.0],
  ['a', 'a_news', 0.5],
  ['n', 'n_thu', 0.9],
  ['p', 'p_dark', 0.45],
  ['n', 'n_marker', 0.5],
  ['p', 'p_simple', 0.7],
  ['n', 'n_fri', 0.9],
  ['n', 'n_price', 0.8],
  ['s', 's_open', 0.5],
  ['y', 'y_wow', 1.0],       // the paper comes off
  ['s', 's_knew', 0.7],
  ['s', 's_any', 0.6],
  ['n', 'n_night', 1.2],
  ['n', 'n_car', 1.2],
  ['g', 'g_codes', 1.2],     // the agent walks up, the door opens
  ['g', 'g_tonight', 0.5],
  ['n', 'n_know', 0.6],
  ['n', 'n_odds', 1.0],
  ['n', 'n_forget', 0.6],
  ['n', 'n_comp', 0.7],
  ['n', 'n_first2', 0.7],
  ['n', 'n_sun', 10.0],      // ★ the silence: the clock reaches midnight, the tags fade one by one
  ['n', 'n_burn', 0.6],
  ['s', 's_hand', 0.9],
  ['y', 'y_idea', 0.45],
  ['s', 's_good', 0.6],
  ['n', 'n_gone', 0.9],
  ['n', 'n_note', 0.9],
  ['n', 'n_cta2', 1.3],
];
const TAIL = 3.0;
const VD = path.join(D, 'voices');
const out = { clips: {}, order: [] };
let t = 0.6;
for (const [who, id, gap] of SEQ) {
  let hit = null;
  for (const role of fs.readdirSync(VD)) { const f = fs.readdirSync(path.join(VD, role)).find((x) => x.endsWith('-' + id + '.align.json')); if (f) { hit = [role, f]; break; } }
  if (!hit) throw new Error('no clip for ' + id);
  const j = JSON.parse(fs.readFileSync(path.join(VD, hit[0], hit[1]), 'utf8'));
  const w0 = j.words[0].start, w1 = j.words[j.words.length - 1].end;
  t += gap; const at = t - w0;            // where the mp3 starts so that its first word lands at t
  const mp3 = path.join('voices', hit[0], hit[1].replace('.align.json', '.mp3'));
  out.clips[id] = { who, at: +at.toFixed(3), start: +t.toFixed(3), end: +(at + w1).toFixed(3), mp3, words: j.words.map((w) => ({ w: w.text, s: +(at + w.start).toFixed(3), e: +(at + w.end).toFixed(3) })) };
  out.order.push(id);
  t = at + w1;
}
out.duration = +(t + TAIL).toFixed(3);
fs.writeFileSync(path.join(D, 'timing.js'), '/* written by build-timing.cjs from the voice clips: do not edit */\nwindow.KET = ' + JSON.stringify(out) + ';\n');
console.log('duration', out.duration.toFixed(2), 's');
if (process.argv.includes('-v')) for (const id of out.order) console.log(id.padEnd(10), out.clips[id].start.toFixed(2), out.clips[id].end.toFixed(2), (out.clips[id].end - out.clips[id].start).toFixed(2));
