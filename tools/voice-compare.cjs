/* =====================================================================
   VOICE COMPARE — says the same line with several ElevenLabs voices, models
   and quality settings, so the owner can pick the narrator by ear.

     node tools/voice-compare.cjs --out out/voices [--text "Your line."] [--summary file.md]

   For each variant it saves the MP3 exactly as ElevenLabs sent it (originals/),
   then a loudness-matched WAV (-16 LUFS, lossless) so no take sounds "better"
   only because it is louder. Every file goes through the same checks as the
   narration test. A variant the account's plan can't use (e.g. 192 kbps needs
   the Creator plan) is reported and skipped; the rest still run.
   Costs about (text length x number of variants) characters, ~900 by default.
   ===================================================================== */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const N = require('./narrate.cjs');

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));
const TEXT = (typeof args.text === 'string' && args.text.trim())
  || "What if gravity doubled at breakfast? Your coffee cup would suddenly weigh twice as much... and that's only the beginning.";

// Voice ids are ElevenLabs' premade voices (the same ids the official skill lists, plus Brian and Adam).
const VARIANTS = [
  { file: '1-george-v4-128k-current', label: 'George, eleven_v4, 128 kbps (what you heard)', voice: 'JBFqnCBsd6RMkjVDRZzb', model: 'eleven_v4', format: 'mp3_44100_128' },
  { file: '2-george-v4-192k', label: 'George, eleven_v4, 192 kbps (higher bitrate; Creator plan or above)', voice: 'JBFqnCBsd6RMkjVDRZzb', model: 'eleven_v4', format: 'mp3_44100_192' },
  { file: '3-george-v4-narration-settings', label: 'George, eleven_v4, narration settings (stability 0.7, similarity 0.5)', voice: 'JBFqnCBsd6RMkjVDRZzb', model: 'eleven_v4', format: 'mp3_44100_128', settings: { stability: 0.7, similarity_boost: 0.5 } },
  { file: '4-george-multilingual-v2', label: 'George, eleven_multilingual_v2 + speaker boost (older, very stable model)', voice: 'JBFqnCBsd6RMkjVDRZzb', model: 'eleven_multilingual_v2', format: 'mp3_44100_128', settings: { stability: 0.5, similarity_boost: 0.75, style: 0.2, use_speaker_boost: true } },
  { file: '5-brian-v4', label: 'Brian (deep, resonant narrator), eleven_v4', voice: 'nPczCjzI2devNBz1zQrb', model: 'eleven_v4', format: 'mp3_44100_128' },
  { file: '6-daniel-v4', label: 'Daniel (authoritative, news-style), eleven_v4', voice: 'onwK4e9ZLuTAKqWW03F9', model: 'eleven_v4', format: 'mp3_44100_128' },
  { file: '7-adam-v4', label: 'Adam (deep, documentary), eleven_v4', voice: 'pNInz6obpgDQGcFmaJgB', model: 'eleven_v4', format: 'mp3_44100_128' },
];

function loudness(file) {
  const s = String(spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr || '');
  const tail = s.slice(s.lastIndexOf('Summary:'));
  return { lufs: parseFloat((tail.match(/I:\s*(-?[\d.]+) LUFS/) || [])[1]), tp: parseFloat((tail.match(/Peak:\s*(-?[\d.]+) dBFS/) || [])[1]) };
}

async function main() {
  const apiKey = N.requireKey();
  if (!N.hasFfmpeg()) { console.error('voice-compare needs ffmpeg'); process.exit(1); }
  const out = path.resolve(args.out || 'renders/voice-compare');
  const orig = path.join(out, 'originals');
  fs.mkdirSync(orig, { recursive: true });
  console.log(`Line (${TEXT.length} characters): ${TEXT}\n`);

  const rows = [];
  for (const v of VARIANTS) {
    const mp3 = path.join(orig, v.file + '.mp3');
    try {
      const r = await N.synthesize({ text: TEXT, voice: v.voice, model: v.model, format: v.format, voiceSettings: v.settings, apiKey });
      fs.writeFileSync(mp3, r.audio);
    } catch (e) {
      console.log(`SKIPPED ${v.file}: ${e.message}`);
      rows.push({ ...v, error: e.message.replace(/\s+/g, ' ').slice(0, 160) });
      continue;
    }
    const check = N.verifyMp3(mp3, { minSeconds: 2 });
    if (!check.ok) { console.log(`FAILED ${v.file}: ${check.problems.join('; ')}`); rows.push({ ...v, error: 'failed checks: ' + check.problems.join('; ') }); continue; }
    const before = loudness(mp3);
    // loudness-matched lossless copy: -16 LUFS integrated, true peak <= -1.5 dBTP
    const wav = path.join(out, v.file + '.wav');
    const norm = spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', mp3, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11,aresample=44100', '-c:a', 'pcm_s16le', wav]);
    if (norm.status !== 0) { rows.push({ ...v, error: 'loudness match failed' }); continue; }
    const after = loudness(wav);
    rows.push({ ...v, seconds: check.report.seconds, kb: Math.round(check.report.bytes / 1024), lufs: before.lufs, tp: before.tp, lufsAfter: after.lufs });
    console.log(`ok      ${v.file}: ${check.report.seconds} s, ${Math.round(check.report.bytes / 1024)} KiB, original ${before.lufs} LUFS (peak ${before.tp} dBFS) -> matched ${after.lufs} LUFS`);
  }

  const good = rows.filter((r) => !r.error);
  const guide = ['VOICE COMPARISON', '', `Line: ${TEXT}`, '',
    'Listen to the .wav files in this folder (all matched to the same loudness, so compare the voice, not the volume).',
    'originals/ holds the MP3s exactly as ElevenLabs sent them.', '',
    ...rows.map((r) => `${r.file}: ${r.label}${r.error ? `  -> NOT MADE: ${r.error}` : ''}`), ''].join('\n');
  fs.writeFileSync(path.join(out, 'READ ME FIRST.txt'), guide.replace(/\n/g, '\r\n'));   // Windows line endings for Notepad

  if (args.summary) {
    fs.appendFileSync(args.summary, `## Voice comparison\n\nLine: *${TEXT}*\n\n| File | Variant | Length | Original loudness | Result |\n|---|---|---|---|---|\n`
      + rows.map((r) => `| ${r.file}.wav | ${r.label} | ${r.seconds ? r.seconds + ' s' : ''} | ${r.lufs !== undefined ? `${r.lufs} LUFS, peak ${r.tp} dBFS` : ''} | ${r.error ? 'not made: ' + r.error.replace(/\|/g, '/') : 'ok'} |`).join('\n')
      + '\n\nDownload **voice-comparison** under Artifacts. The .wav files are loudness-matched (-16 LUFS).\n');
  }
  console.log(`\n${good.length}/${rows.length} variants made.`);
  if (!good.length) process.exit(1);
}

main().catch((e) => { console.error('voice-compare failed: ' + e.message); process.exit(1); });
