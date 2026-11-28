/* =====================================================================
   BUILD-TIMING — the master timeline of "What If Earthquakes Got 1 Magnitude Stronger Every Minute?" (16:9):
     node films/earthquakes-stronger/build-timing.cjs
   Reads narration/manifest.json + every clip's MP3 and forced-alignment word times (ElevenLabs, made by the
   "Narrate earthquakes-stronger" GitHub workflow, never regenerated here), measures each clip's real length,
   pauses and loudness, and places the clips on the film's REAL-TIME clock: the film runs one story second per film
   second from the first tick (TICK0, film seconds), and every minute the magnitude goes up by one. AT[id] is the story
   second (seconds after TICK0) where the clip's first word lands; the cold open's clip sits on film time OPEN.
   The voice is never cut or sped up. Throws if two clips would overlap. Writes:
     narration-timing.js   window.EQN: clips (absolute word times, gain), TICK0, the film's length
     narration-audio.js    window.EQN_VO: the clips as base64 MP3
   Pure data: no clock, no randomness.
   (From the twice-as-long film's build-timing.cjs.)
   ===================================================================== */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const DIR = __dirname, NAR = path.join(DIR, 'narration');
const TICK0 = 2.6;         // film time of minute one (magnitude three)
const OPEN = 0.25;         // the cold open's "This is magnitude twelve." first word
// story seconds (after TICK0) of each clip's first word. Minute k starts at 60 (k − 1); the clip naming it lands 0.3 s
// after its tick. The gaps are where the picture and the sound carry the story.
const AT = {
  // (minute one, after the reviews: the rule comes straight after the first jolt, then the lightning)
  m1: 0.3, sat: 3.6, felt: 10.6, but: 16.4, rule: 18.9, lightning: 24.0, x32: 30.0, realtime: 41.0, cup: 50.4,
  m2: 60.3, truck: 65.0, long: 71.0, faults: 79.0, moab: 88.0, birds: 96.5, tour: 101.0, pilot: 108.0,
  m3: 120.3, everyone: 124.5, alert: 127.5, tnt: 132.5, crowd: 139.0, drop: 144.0, never: 151.0, run: 155.5, ferry: 160.0,
  m4: 180.3, hiro: 184.5, smash: 189.5, streetcar: 197.5, in: 203.0, start: 206.0, mud: 215.0, sink: 225.0,
  m5: 240.3, haiti: 244.5, brick: 250.5, split: 256.0, pier: 261.0, lift: 266.5, sky: 271.0, baybridge: 279.0,
  m6: 300.3, y1906: 304.5, fires: 312.0, bravo: 316.0, pyramid: 324.0, golden: 333.0, phone: 341.5, notjust: 349.0,
  m7: 360.3, japan: 364.5, tsar: 370.0, calm: 375.0, empty: 381.0, back: 391.0, cafe: 395.5, la: 402.0, mexico: 408.0,
  m8: 420.3, never2: 424.5, fault: 434.5, gravity: 441.5, month: 447.5, dam: 453.0, needle: 459.5, crack: 465.0,
  m9: 480.3, years: 485.0, air: 491.5, tokyo: 496.0, dubai: 502.5, istanbul: 509.0, dozens: 515.5, fuel: 524.0, nowhere: 530.0,
  m10: 540.3, sun: 545.0, cracking: 552.0, melt: 558.0, dino: 565.5, seven: 572.0, last: 578.5, question: 585.0,
};
const TAIL = 2.6;          // after "Who would you call?": your face, the phone, the cut
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
  const first = words[0].start;
  const at = id === 'open' ? OPEN : AT[id] !== undefined ? TICK0 + AT[id] : null;
  if (at === null) throw new Error('no AT for clip ' + id);
  const t0 = r3(at - first);
  const abs = words.map((w) => ({ text: w.text, start: r3(t0 + w.start), end: r3(t0 + w.end) }));
  const lufs = loudness(file);
  clips.push({ id, n: k + 1, file: c.file, hash: c.hash, start: t0, seconds: r3(dur), end: r3(t0 + dur),
    first: abs[0].start, speechEnd: r3(t0 + speechEnd), lufs, gainDb: Math.round((VO_LUFS - lufs) * 10) / 10, text: c.text, words: abs });
});
for (const id of Object.keys(AT)) if (!clips.some((c) => c.id === id)) throw new Error('AT names a clip that does not exist: ' + id);
clips.sort((a, b) => a.first - b.first);   // (the film's order, which AT may change from the script's)
for (let i = 1; i < clips.length; i++) {
  const a = clips[i - 1], b = clips[i];
  if (b.first < a.speechEnd + 0.45) throw new Error(`clips overlap: ${a.id} ends ${a.speechEnd} → ${b.id} starts ${b.first}`);
}
// every minute's clips stay inside that minute
for (const c of clips) {
  if (c.id === 'open') { if (c.speechEnd > TICK0 - 0.2) throw new Error('the open runs into minute one'); continue; }
  const s0 = c.first - TICK0, s1 = c.speechEnd - TICK0;
  if (Math.floor(s0 / 60) !== Math.floor((s1 + 0.4) / 60)) throw new Error(`${c.id} runs over a minute tick (${s0.toFixed(1)} → ${s1.toFixed(1)})`);
}
const last = clips[clips.length - 1];
const EQN = { voice: man.voice, model: man.model, tick0: TICK0, duration: r3(last.speechEnd + TAIL), clips };
fs.writeFileSync(path.join(DIR, 'narration-timing.js'), `/* Narration timing for "What If Earthquakes Got 1 Magnitude Stronger Every Minute?", generated by build-timing.cjs from
   the real ElevenLabs clips. Do not edit by hand: change AT/TAIL in build-timing.cjs and re-run it. */
window.EQN = ${JSON.stringify(EQN)};
`);
const vo = Object.fromEntries(clips.map((c) => [c.id, fs.readFileSync(path.join(NAR, c.file)).toString('base64')]));
fs.writeFileSync(path.join(DIR, 'narration-audio.js'), `/* The ${clips.length} narration clips (ElevenLabs, voice ${man.voice}) as base64 MP3, written by build-timing.cjs. Do not edit by hand. */
window.EQN_VO = ${JSON.stringify(vo)};
`);
for (const c of clips) console.log(`${String(c.n).padStart(2)} ${c.first.toFixed(2).padStart(7)} → ${c.speechEnd.toFixed(2).padStart(7)}  s ${(c.first - TICK0).toFixed(1).padStart(6)}  ${c.lufs} LUFS  [${c.id}] ${c.text}`);
console.log(`film ${EQN.duration} s (${Math.floor(EQN.duration / 60)}:${String(Math.round(EQN.duration % 60)).padStart(2, '0')})`);
