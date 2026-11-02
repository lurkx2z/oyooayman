#!/usr/bin/env node
/* =====================================================================
   MAKE VOICES — packs the character's voice lines (voices/you/*.mp3, made with ElevenLabs by the "Voices
   sound-only-yours" GitHub Action) into voices.js, so the page can build its soundtrack offline and from file://
   (no fetch): 24 kHz mono 16-bit PCM, base64, with a gain per line that brings each one to its loudness target.
     node films/sound-only-yours/make-voices.cjs
   Needs ffmpeg. Re-run after the Action regenerates a line (then re-bake the soundtrack).
   ===================================================================== */
const fs = require('fs'), path = require('path'), { execFileSync, spawnSync } = require('child_process'), crypto = require('crypto');
const DIR = __dirname, SR = 24000;
const man = JSON.parse(fs.readFileSync(path.join(DIR, 'voices/you/manifest.json'), 'utf8'));
// loudness targets (LUFS, integrated, per line): a normal line −20; the breathy and counted ones a little under; the
// whisper well under; the shout at the top
const TARGET = { y_what: -20, y_hello: -20.5, y_mum: -20.5, y_window: -19.5, y_okay: -24, y_scared: -19, y_street: -19.5, y_count: -22, y_shout: -15, y_who: -25 };
const out = {};
for (const c of man.clips) {
  const id = c.id.replace(/^\d+-/, ''), f = path.join(DIR, 'voices/you', c.file);
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', f, '-af', 'ebur128', '-f', 'null', '-'], { encoding: 'utf8' });
  const m = /I:\s+(-?[\d.]+) LUFS\s*\n\s*Threshold/.exec(r.stderr) || /I:\s+(-?[\d.]+) LUFS/.exec(r.stderr);
  const I = m ? parseFloat(m[1]) : -23, g = +((TARGET[id] ?? -20) - I).toFixed(2);
  const pcm = execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', f, '-ac', '1', '-ar', String(SR), '-f', 's16le', '-'], { maxBuffer: 64 << 20 });
  const h = crypto.createHash('sha1').update(pcm).digest('hex').slice(0, 12);
  out[id] = { sr: SR, n: pcm.length / 2, h, g, lufs: I, b64: pcm.toString('base64') };
  console.log(`${id.padEnd(9)} ${(pcm.length / 2 / SR).toFixed(2)} s · ${I.toFixed(1)} LUFS → gain ${g >= 0 ? '+' : ''}${g} dB`);
}
const head = `/* The character's voice lines for sound-only-yours.html (ElevenLabs, made by the "Voices sound-only-yours" GitHub
   Action; packed by make-voices.cjs): 24 kHz mono 16-bit PCM, base64; g = the gain (dB) to each line's loudness target. */\n`;
fs.writeFileSync(path.join(DIR, 'voices.js'), head + 'window.SO_VOICES = ' + JSON.stringify(out) + ';\n');
console.log('voices.js', (fs.statSync(path.join(DIR, 'voices.js')).size / 1e6).toFixed(2), 'MB');
