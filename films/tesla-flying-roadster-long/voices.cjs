/* =====================================================================
   FRESH VOICES — the long-form's stall line said by voices the owner hasn't heard yet (plus Charlie for reference),
   loudness-matched to −16 LUFS so the voice is compared, not the volume. Run by .github/workflows/voice-compare-tesla.yml.
     node films/tesla-flying-roadster-long/voices.cjs --out <dir>
   ===================================================================== */
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const N = require('../../tools/narrate.cjs');
const TEXT = "Until the air can't follow the wing any more. It tears away. That's a stall, and the lift collapses. So a wing can never just hang there. It needs speed, all the time.";
const S = { stability: 0.4, similarity_boost: 0.75 };
const VOICES = [
  ['1-mark', 'Mark (male, young, natural conversations, American)', 'UgBBYS2sOqTuMpoF3BR0'],
  ['2-brian', 'Brian (male, deep, resonant, comforting, American)', 'nPczCjzI2devNBz1zQrb'],
  ['3-michael', 'Michael C. Vincent (male, confident storyteller, American)', 'uju3wxzG5OhpWcoi3SMy'],
  ['4-quentin', 'Quentin (male, deep narrator and educator, American)', 'Aa6nEBJJMKJwJkCx8VU2'],
  ['5-river', 'River (neutral, calm, informative, American)', 'SAz9YHcvj6GT2YYXdXww'],
  ['6-daniel', 'Daniel (male, steady broadcaster, British)', 'onwK4e9ZLuTAKqWW03F9'],
  ['7-alice', 'Alice (female, clear educator, British)', 'Xb7hH8MSUJpSbSDYk0k2'],
  ['8-matilda', 'Matilda (female, upbeat, knowledgeable, American)', 'XrExE9yKIg1WjnnlVkGX'],
  ['9-bill', 'Bill (male, older, wise, American)', 'pqHfZKP75CvOlQylNhV4'],
  ['10-charlie-current', 'Charlie (the current voice, for reference)', 'IKne3meq5aSn9XLyUdCD'],
];
(async () => {
  const out = path.resolve(process.argv[process.argv.indexOf('--out') + 1]), apiKey = N.requireKey();
  fs.mkdirSync(out, { recursive: true });
  const lines = ['FRESH VOICES', '', 'Line: ' + TEXT, '', 'All matched to the same loudness. Pick one by number.', ''];
  for (const [file, label, voice] of VOICES) {
    try {
      const r = await N.synthesize({ text: TEXT, voice, model: 'eleven_v4', format: 'mp3_44100_128', voiceSettings: S, apiKey });
      const raw = path.join(out, file + '-raw.mp3'); fs.writeFileSync(raw, r.audio);
      const ok = N.verifyMp3(raw, { minSeconds: 2 }); if (!ok.ok) throw new Error(ok.problems.join('; '));
      const n = spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', raw, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11,aresample=44100', '-c:a', 'libmp3lame', '-b:a', '192k', path.join(out, file + '.mp3')]);
      fs.unlinkSync(raw); if (n.status !== 0) throw new Error('loudness match failed');
      lines.push(`${file}: ${label}`); console.log('ok', file);
    } catch (e) { lines.push(`${file}: ${label}  -> NOT MADE: ${e.message.slice(0, 120)}`); console.log('SKIPPED', file, e.message); }
  }
  fs.writeFileSync(path.join(out, 'READ ME FIRST.txt'), lines.join('\r\n') + '\r\n');
})().catch((e) => { console.error(e.message); process.exit(1); });
