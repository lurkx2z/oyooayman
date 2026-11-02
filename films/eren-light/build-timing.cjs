/* Lays every voice clip (narrator, Light, Eren) on the film's timeline and writes timing.js (window.KET).
     node films/eren-light/build-timing.cjs [-v]
   Gaps (seconds before each clip, between spoken words) are action beats. The countdown is exact: the name is finished
   writing at T.written (2.6 s after n_write ends), and the narrator's "Forty" lands at T.written + 40.0. */
const fs = require('fs'), path = require('path');
const D = __dirname;
const SEQ = [
  ['n', 'n_open', 0.0], ['n', 'n_open2', 0.8], ['n', 'n_two', 0.7], ['n', 'n_title', 0.8],
  ['n', 'n_station', 1.7], ['n', 'n_light', 0.6], ['n', 'n_eren', 0.9], ['l', 'l_late', 0.6], ['e', 'e_knew', 0.45], ['n', 'n_future', 0.6], ['n', 'n_rules', 0.7],
  ['n', 'n_r1', 1.0], ['l', 'l_rotten', 0.5], ['e', 'e_cage', 0.7], ['n', 'n_r1b', 0.8], ['n', 'n_agree1', 0.5],
  ['n', 'n_r2', 1.3], ['l', 'l_guilty', 0.5], ['n', 'n_r2b', 0.7], ['e', 'e_eighty', 0.9], ['n', 'n_eighty', 0.8], ['l', 'l_monster', 0.7], ['n', 'n_bag', 0.4],
  ['e', 'e_agents', 0.5], ['l', 'l_inway', 0.45], ['e', 'e_mine', 0.5], ['n', 'n_same', 0.9],
  ['n', 'n_r3', 1.3], ['l', 'l_god', 0.5], ['n', 'n_r3b', 0.6], ['e', 'e_wall', 0.5], ['l', 'l_burn', 0.5], ['e', 'e_free', 0.45], ['n', 'n_break', 0.7],
  ['n', 'n_r4', 1.3], ['l', 'l_win', 0.5], ['e', 'e_lose', 0.7], ['n', 'n_r4b', 0.8], ['n', 'n_verdict', 0.9],
  ['n', 'n_click', 1.5], ['n', 'n_write', 0.7],
  ['l', 'l_forty', 'WRITTEN+0.7'], ['n', 'n_forty', 0.5], ['e', 'e_seen', 0.7], ['n', 'n_collide', 0.7],
  ['n', 'n_zero', 'FORTY'], ['n', 'n_end', 1.4], ['n', 'n_cta', 1.4],
];
const TAIL = 3.0, WRITE_AFTER = 2.6;
const VD = path.join(D, 'voices');
const out = { clips: {}, order: [], T: {} };
let t = 0.35;
for (const [who, id, gap] of SEQ) {
  let hit = null;
  for (const role of fs.readdirSync(VD)) { const dir = path.join(VD, role); if (!fs.statSync(dir).isDirectory()) continue; const f = fs.readdirSync(dir).find((x) => x.endsWith('-' + id + '.align.json')); if (f) { hit = [role, f]; break; } }
  if (!hit) throw new Error('no clip for ' + id);
  const j = JSON.parse(fs.readFileSync(path.join(VD, hit[0], hit[1]), 'utf8'));
  const w0 = j.words[0].start, w1 = j.words[j.words.length - 1].end;
  let at;
  if (gap === 'WRITTEN+0.7') { t = out.T.written + 0.7; at = t - w0; }
  else if (gap === 'FORTY') { const fw = j.words.find((w) => /^forty/i.test(w.text)); at = out.T.written + 40 - fw.start; t = at + w0; }
  else { t += gap; at = t - w0; }
  const mp3 = path.join('voices', hit[0], hit[1].replace('.align.json', '.mp3'));
  out.clips[id] = { who, at: +at.toFixed(3), start: +(at + w0).toFixed(3), end: +(at + w1).toFixed(3), mp3, words: j.words.map((w) => ({ w: w.text, s: +(at + w.start).toFixed(3), e: +(at + w.end).toFixed(3) })) };
  out.order.push(id);
  t = at + w1;
  if (id === 'n_write') out.T.written = +(t + WRITE_AFTER).toFixed(3);
}
out.duration = +(t + TAIL).toFixed(3);
fs.writeFileSync(path.join(D, 'timing.js'), '/* written by build-timing.cjs from the voice clips: do not edit */\nwindow.KET = ' + JSON.stringify(out) + ';\n');
console.log('duration', out.duration.toFixed(2), 's', 'written at', out.T.written, 'silence before n_zero', (out.clips.n_zero.start - out.clips.n_collide.end).toFixed(2));
if (process.argv.includes('-v')) for (const id of out.order) console.log(id.padEnd(10), out.clips[id].start.toFixed(2), out.clips[id].end.toFixed(2), (out.clips[id].end - out.clips[id].start).toFixed(2), out.clips[id].words.map((w) => w.w).join(' ').slice(0, 70));
