/* =====================================================================
   BUILD-TIMING — the master timeline of "What If Every Step You Took Was Twice as Long?" (16:9, long-form):
     node films/twice-as-long/build-timing.cjs
   Reads narration/manifest.json + every clip's MP3 and forced-alignment word times (ElevenLabs, made by the
   "Narrate twice-as-long" GitHub workflow, never regenerated here), measures each clip's real length, pauses and
   loudness, and places the clips: PAUSE[id] = the silence between the previous clip's last word and this clip's
   first word. The voice is never cut or sped up: the picture is built on it. Writes:
     narration-timing.js   window.TWN: clips (absolute word times, gain), the film's length
     narration-audio.js    window.TWN_VO: the clips as base64 MP3
   Pure data: no clock, no randomness.
   (From the Tesla Roadster film's build-timing.cjs.)
   ===================================================================== */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const DIR = __dirname, NAR = path.join(DIR, 'narration');
// silence before each clip's first word (s); 0.9 when not listed. The long ones are where the picture and the sound
// carry the story: the bus (before "home"), the sonic boom (before "boom"), the crater, the lift-off, the Moon going
// by, the poster, the Milky Way, the Sun dying, and the end.
const PAUSE = {
  open: 0.2, one: 1.0, late: 1.7, two: 0.8, three: 0.9, four: 0.9, back: 1.5, five: 1.1, home: 3,
  rule: 1.4, sum: 0.8, loop: 0.8, work: 1.2, six: 1.3, seven: 1.1, crack: 0.9, phones: 0.9, eight: 1.0, nine: 1.0,
  warn: 1.3, ten: 1.0, boom: 4.4, eleven: 1.3, twelve: 1.0, squeeze: 1.0, thirteen: 1.0, safe: 3.2, fourteen: 1.1, passed: 2,
  fifteen: 1.3, curve: 1.0, meteor: 4.5, boston: 1.1, space: 3.4, push: 1.0, station: 2.5, ninemin: 0.8, radius: 1.5, across: 1.5,
  look: 2.6, fifty: 2.7, moon: 1.2, problem: 3, thirty: 0.9, nothing: 1.0, give: 1.4, clock: 1.0, earth: 1.0, real: 2.1,
  mars: 3.4, marstime: 0.8, sun: 3.3, jupiter: 3, saturn: 2.5, pluto: 2, voyager: 2.8, day: 1.5, star: 2.2, month: 2.3,
  poster: 0.9, ninemonths: 3, proxima: 2.8, sixyears: 1.0, turn: 2.1, eleven_years: 0.8, keep: 2.6, sixty: 3.4, sixtyfour: 3,
  climb: 2.8, seventy: 4.5, humans: 3.4, andromeda: 3.5, dust: 3.5, web: 2.8, sundies: 3.7, ninety: 3.6, last: 2.5, or: 1.6, question: 2,
};
const TAIL = 1.7;          // after "Which way would you step?": you, between two steps, then the cut
const VO_LUFS = -21;

const r3 = (x) => Math.round(x * 1000) / 1000;
const run = (cmd, args) => spawnSync(cmd, args, { maxBuffer: 1 << 26 });
function silences(file) {
  const s = String(run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'silencedetect=n=-45dB:d=0.1', '-f', 'null', '-']).stderr), out = [];
  const re = /silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g; let m;
  while ((m = re.exec(s))) out.push([+m[1], +m[2]]);
  return out;
}
function loudness(file) {
  const m = String(run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128', '-f', 'null', '-']).stderr).match(/I:\s+(-?[\d.]+) LUFS\s*\n\s*Threshold/);
  if (!m) throw new Error('no loudness for ' + file);
  return +m[1];
}
function duration(file) { return +String(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).stdout).trim(); }

const man = JSON.parse(fs.readFileSync(path.join(NAR, 'manifest.json'), 'utf8'));
const clips = [];
let t = 0;
man.clips.forEach((c, k) => {
  const id = c.id.replace(/^\d+-/, '');
  const al = JSON.parse(fs.readFileSync(path.join(NAR, c.align), 'utf8'));
  const file = path.join(NAR, c.file), dur = duration(file), sil = silences(file);
  const words = al.words.map((w) => {
    let end = w.end;
    for (const [a] of sil) if (a > w.start + 0.05 && a < end) end = a;   // the aligner stretches a word over the pause after it
    return { text: w.text, start: w.start, end };
  });
  const lastSil = sil.find(([, b]) => b >= dur - 0.12);
  const speechEnd = Math.min(words[words.length - 1].end, lastSil ? lastSil[0] : dur);
  words[words.length - 1].end = speechEnd;
  const first = words[0].start, pause = PAUSE[id] ?? 0.9;
  const t0 = r3(t + pause - first);                       // clip start so its first word lands `pause` after the last one
  const abs = words.map((w) => ({ text: w.text, start: r3(t0 + w.start), end: r3(t0 + w.end) }));
  const lufs = loudness(file);
  clips.push({ id, n: k + 1, file: c.file, hash: c.hash, start: t0, seconds: r3(dur), end: r3(t0 + dur),
    first: abs[0].start, speechEnd: r3(t0 + speechEnd), lufs, gainDb: Math.round((VO_LUFS - lufs) * 10) / 10, text: c.text, words: abs });
  t = r3(t0 + speechEnd);
});
for (const id of Object.keys(PAUSE)) if (!clips.some((c) => c.id === id)) throw new Error('PAUSE names a clip that does not exist: ' + id);
const TWN = { voice: man.voice, model: man.model, duration: r3(t + TAIL), clips };
fs.writeFileSync(path.join(DIR, 'narration-timing.js'), `/* Narration timing for "What If Every Step You Took Was Twice as Long?", generated by build-timing.cjs from the real
   ElevenLabs clips. Do not edit by hand: change PAUSE/TAIL in build-timing.cjs and re-run it. */
window.TWN = ${JSON.stringify(TWN)};
`);
const vo = Object.fromEntries(clips.map((c) => [c.id, fs.readFileSync(path.join(NAR, c.file)).toString('base64')]));
fs.writeFileSync(path.join(DIR, 'narration-audio.js'), `/* The ${clips.length} narration clips (ElevenLabs, voice ${man.voice}) as base64 MP3, written by build-timing.cjs. Do not edit by hand. */
window.TWN_VO = ${JSON.stringify(vo)};
`);
for (const c of clips) console.log(`${String(c.n).padStart(2)} ${c.first.toFixed(2).padStart(7)} → ${c.speechEnd.toFixed(2).padStart(7)}  ${c.lufs} LUFS  [${c.id}] ${c.text}`);
console.log(`film ${TWN.duration} s (${Math.floor(TWN.duration / 60)}:${String(Math.round(TWN.duration % 60)).padStart(2, '0')})`);
