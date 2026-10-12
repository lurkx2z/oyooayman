/* =====================================================================
   BUILD-TIMING — the narration half of the master timeline, made from the REAL voice clips.
     node films/gravity-doubled-3min/build-timing.cjs
   Reads narration/<id>.mp3 + <id>.align.json (ElevenLabs word timestamps), measures every clip's real
   duration and its pauses (ffmpeg silencedetect), places each clip at its film time (PLACE below, the
   only hand-set numbers) and writes:
     narration-timing.js   window.GN: clips (absolute word times, loudness gain) + subtitle phrases, read by script.js
     narration-audio.js    window.GN_VO: the seven MP3s as base64, so the page mixes the real voice into its soundtrack
                           (works from file://, no server; audio.js decodes them before the offline render)
   Re-run after regenerating any clip. Pure data: no clock, no randomness.
   ===================================================================== */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const DIR = __dirname, NAR = path.join(DIR, 'narration');

// film second at which each clip starts (the edit is built around these; see PLAN.md § Timeline)
const PLACE = { 's01-moment': 0.4, 's03-mass': 25.2, 's04-experiment': 40.4, 's06-body': 71.6, 's08-city': 100.8, 's10-question': 139.2, 's12-final': 170.0 };
// subtitle phrases: words per phrase, and display tokens where the spoken words become numerals
const PHRASES = {
  's01-moment': [{ n: 6, title: true }, { n: 4 }, { n: 4 }, { n: 5 }, { n: 4 }],
  's03-mass': [{ n: 4 }, { n: 4 }, { n: 4 }, { n: 6 }, { n: 6 }, { n: 7 }, { n: 3 }],
  's04-experiment': [{ n: 6 }, { n: 4 }, { n: 6 },
    { n: 7, show: [['takes', 0], ['about', 1], ['0.45', 2, 5], ['seconds.', 6]] },
    { n: 4 },
    { n: 8, show: [['that', 0], ['drops', 1], ['to', 2], ['just', 3], ['0.32.', 4, 7]] },
    { n: 3 }, { n: 4 }, { n: 6 }],
  's06-body': [{ n: 7 }, { n: 2 }, { n: 5 }, { n: 4 }, { n: 5 }, { n: 4 }, { n: 5 }, { n: 4 }, { n: 6 }],
  's08-city': [{ n: 5 }, { n: 4 }, { n: 6 }, { n: 6 }, { n: 7 }, { n: 4 }, { n: 7 }, { n: 6 }, { n: 4 }, { n: 5 }, { n: 3 }],
  's10-question': [{ n: 6 }, { n: 3 }, { n: 5 }, { n: 5 }, { n: 3 }, { n: 7 }, { n: 5 }, { n: 7 }, { n: 8 }],
  's12-final': [{ n: 5 }, { n: 4 }, { n: 8 }, { n: 2 }],
};

function silences(file) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'silencedetect=n=-45dB:d=0.1', '-f', 'null', '-']);
  const s = String(r.stderr), out = [];
  const re = /silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g; let m;
  while ((m = re.exec(s))) out.push([+m[1], +m[2]]);
  return out;
}
// integrated loudness (EBU R128) → the gain that brings every clip to the same level in the mix
const VO_LUFS = -22;
function loudness(file) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128', '-f', 'null', '-']);
  const m = String(r.stderr).match(/I:\s+(-?[\d.]+) LUFS\s*\n\s*Threshold/);
  if (!m) throw new Error('no loudness for ' + file);
  return +m[1];
}
function duration(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]);
  return +String(r.stdout).trim();
}
const r3 = (x) => Math.round(x * 1000) / 1000;

const manifest = JSON.parse(fs.readFileSync(path.join(NAR, 'manifest.json'), 'utf8'));
const clips = [], phrases = [];
for (const c of manifest.clips) {
  const key = c.id.replace(/^\d+-/, '');
  const al = JSON.parse(fs.readFileSync(path.join(NAR, c.align), 'utf8'));
  const file = path.join(NAR, c.file), dur = duration(file), sil = silences(file);
  const t0 = PLACE[key];
  if (t0 === undefined) throw new Error('no placement for ' + key);
  // the aligner stretches a word's end over the pause after it; the real end is where the silence begins
  const words = al.words.map((w) => {
    let end = w.end;
    for (const [a] of sil) if (a > w.start + 0.05 && a < end) end = a;
    return { text: w.text, start: r3(t0 + w.start), end: r3(t0 + end) };
  });
  const lastSil = sil.find(([a, b]) => b >= dur - 0.12);
  const speechEnd = r3(t0 + (lastSil ? lastSil[0] : dur));
  const lufs = loudness(file);
  clips.push({ id: key, file: c.file, hash: c.hash, start: t0, seconds: r3(dur), end: r3(t0 + dur), speechEnd, lufs, gainDb: Math.round((VO_LUFS - lufs) * 10) / 10, text: c.text, words });
  let i = 0;
  for (const P of PHRASES[key]) {
    const ws = words.slice(i, i + P.n); i += P.n;
    const tokens = P.show ? P.show.map(([text, a, b]) => ({ text, start: ws[a].start, end: ws[b ?? a].end })) : ws.map((w) => ({ text: w.text, start: w.start, end: w.end }));
    phrases.push({ clip: key, title: !!P.title, start: ws[0].start, end: ws[ws.length - 1].end, tokens });
  }
  if (i !== words.length) throw new Error(`${key}: phrases cover ${i} of ${words.length} words`);
}
// subtitles hold a little after the last word, never into the next phrase; short gaps inside a clip bridge
for (let k = 0; k < phrases.length; k++) {
  const p = phrases[k], n = phrases[k + 1];
  p.show = r3(p.start - 0.06);
  p.hide = r3(p.end + 0.3);
  if (n && n.clip === p.clip) p.hide = r3(Math.min(p.hide, n.start - 0.06));
}
// sanity: clips never overlap
for (let k = 1; k < clips.length; k++) if (clips[k].start < clips[k - 1].end + 0.3) throw new Error(`${clips[k].id} overlaps ${clips[k - 1].id}`);

const js = `/* Narration timing for "What If Gravity Doubled? Episode 01 (3 min)", generated by build-timing.cjs from the real ElevenLabs clips
   (voice ${manifest.voice}, ${manifest.model}). Do not edit by hand: change PLACE in build-timing.cjs and re-run it. */
window.GN = ${JSON.stringify({ voice: manifest.voice, model: manifest.model, clips, phrases }, null, 1)};
`;
fs.writeFileSync(path.join(DIR, 'narration-timing.js'), js);
const vo = Object.fromEntries(clips.map((c) => [c.id, fs.readFileSync(path.join(NAR, c.file)).toString('base64')]));
fs.writeFileSync(path.join(DIR, 'narration-audio.js'), `/* The seven narration clips (ElevenLabs, voice ${manifest.voice}) as base64 MP3, written by build-timing.cjs.
   audio.js decodes them and places each at its GN start time in the soundtrack. Do not edit by hand. */
window.GN_VO = ${JSON.stringify(vo)};
`);
for (const c of clips) console.log(`${c.id.padEnd(10)} ${c.start.toFixed(2)} → ${c.end.toFixed(2)} (speech ends ${c.speechEnd.toFixed(2)})  ${c.seconds} s  ${c.lufs} LUFS → ${c.gainDb > 0 ? '+' : ''}${c.gainDb} dB`);
console.log(`${phrases.length} subtitle phrases → narration-timing.js`);
