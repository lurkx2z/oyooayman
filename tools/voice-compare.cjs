/* =====================================================================
   VOICE COMPARE — says the same line with several ElevenLabs voices, models
   and quality settings, so the owner can pick the narrator by ear.

     node tools/voice-compare.cjs --out out/voices [--set natural|narrator] [--text "Your line."] [--summary file.md]

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
const SET = typeof args.set === 'string' ? args.set : 'natural';
const DEFAULT_LINES = {
  narrator: "What if gravity doubled at breakfast? Your coffee cup would suddenly weigh twice as much... and that's only the beginning.",
  // written the way people talk: contractions, a question, a small aside
  natural: "Imagine you're having breakfast, and gravity suddenly doubles. Your coffee cup? It now weighs twice as much. And honestly, that's the least of your problems.",
};
if (!DEFAULT_LINES[SET]) { console.error(`unknown --set ${SET} (use natural or narrator)`); process.exit(1); }
const TEXT = (typeof args.text === 'string' && args.text.trim()) || DEFAULT_LINES[SET];

// Voice ids are ElevenLabs' premade voices. One that isn't available to the account is skipped and reported.
const CONVERSATIONAL = { stability: 0.4, similarity_boost: 0.75 };   // the official skill's "conversational" preset
const SETS = {};
SETS.natural = [
  { file: '1-chris', label: 'Chris (male, casual, American)', voice: 'iP95p4xoKVk53GoZ742B' },
  { file: '2-eric', label: 'Eric (male, friendly, American)', voice: 'cjVigY5qzO86Huf0OWal' },
  { file: '3-will', label: 'Will (male, young, relaxed, American)', voice: 'bIHbv24MWmeRgasZH58o' },
  { file: '4-liam', label: 'Liam (male, young, clear, American)', voice: 'TX3LPaxmHKxFdv7VOQHJ' },
  { file: '5-roger', label: 'Roger (male, laid-back, American)', voice: 'CwhRBWXzGAHq8TQ4Fs17' },
  { file: '6-charlie', label: 'Charlie (male, natural, Australian)', voice: 'IKne3meq5aSn9XLyUdCD' },
  { file: '7-jessica', label: 'Jessica (female, expressive, conversational)', voice: 'cgSgspJ2msm6clMCkdW9' },
  { file: '8-sarah', label: 'Sarah (female, soft, young)', voice: 'EXAVITQu4vr4xnSDxMaL' },
  { file: '9-george-reference', label: 'George (the first voice you heard), same natural settings, for reference', voice: 'JBFqnCBsd6RMkjVDRZzb' },
].map((v) => ({ model: 'eleven_v4', format: 'mp3_44100_128', settings: CONVERSATIONAL, ...v }));
SETS.narrator = [
  { file: '1-george-v4-128k-current', label: 'George, eleven_v4, 128 kbps (what you heard)', voice: 'JBFqnCBsd6RMkjVDRZzb', model: 'eleven_v4', format: 'mp3_44100_128' },
  { file: '2-george-v4-192k', label: 'George, eleven_v4, 192 kbps (higher bitrate; Creator plan or above)', voice: 'JBFqnCBsd6RMkjVDRZzb', model: 'eleven_v4', format: 'mp3_44100_192' },
  { file: '3-george-v4-narration-settings', label: 'George, eleven_v4, narration settings (stability 0.7, similarity 0.5)', voice: 'JBFqnCBsd6RMkjVDRZzb', model: 'eleven_v4', format: 'mp3_44100_128', settings: { stability: 0.7, similarity_boost: 0.5 } },
  { file: '4-george-multilingual-v2', label: 'George, eleven_multilingual_v2 + speaker boost (older, very stable model)', voice: 'JBFqnCBsd6RMkjVDRZzb', model: 'eleven_multilingual_v2', format: 'mp3_44100_128', settings: { stability: 0.5, similarity_boost: 0.75, style: 0.2, use_speaker_boost: true } },
  { file: '5-brian-v4', label: 'Brian (deep, resonant narrator), eleven_v4', voice: 'nPczCjzI2devNBz1zQrb', model: 'eleven_v4', format: 'mp3_44100_128' },
  { file: '6-daniel-v4', label: 'Daniel (authoritative, news-style), eleven_v4', voice: 'onwK4e9ZLuTAKqWW03F9', model: 'eleven_v4', format: 'mp3_44100_128' },
  { file: '7-adam-v4', label: 'Adam (deep, documentary), eleven_v4', voice: 'pNInz6obpgDQGcFmaJgB', model: 'eleven_v4', format: 'mp3_44100_128' },
];
const VARIANTS = SETS[SET];

// The voices this account can use, with ElevenLabs' own labels (needs the key's "Voices: read" permission; optional).
async function listVoices(apiKey) {
  const base = process.env.ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io';
  try {
    const res = await fetch(`${base}/v1/voices`, { headers: { 'xi-api-key': apiKey } });
    if (!res.ok) return { error: `HTTP ${res.status} (the key may not have the "Voices: read" permission; that's fine)` };
    const voices = ((await res.json()).voices || []).map((v) => {
      const l = v.labels || {};
      return `${v.name} | ${v.voice_id} | ${[l.gender, l.age, l.accent, l.descriptive || l.description, l.use_case].filter(Boolean).join(', ')} | ${v.category || ''}`;
    });
    return { voices };
  } catch (e) { return { error: e.message }; }
}

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
  console.log(`Set: ${SET}, ${VARIANTS.length} variants. Line (${TEXT.length} characters): ${TEXT}\n`);

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

  const list = await listVoices(apiKey);
  fs.writeFileSync(path.join(out, 'available-voices.txt'),
    (list.voices ? ['name | voice id | labels | category', ...list.voices] : [`Could not list voices: ${list.error}`]).join('\r\n') + '\r\n');
  console.log(list.voices ? `${list.voices.length} voices available to this account (available-voices.txt)` : `voice list skipped: ${list.error}`);

  const good = rows.filter((r) => !r.error);
  const guide = ['VOICE COMPARISON', '', `Line: ${TEXT}`, '',
    'Listen to the .wav files in this folder (all matched to the same loudness, so compare the voice, not the volume).',
    'originals/ holds the MP3s exactly as ElevenLabs sent them.', '',
    ...rows.map((r) => `${r.file}: ${r.label}${r.error ? `  -> NOT MADE: ${r.error}` : ''}`), ''].join('\n');
  fs.writeFileSync(path.join(out, 'READ ME FIRST.txt'), guide.replace(/\n/g, '\r\n'));   // Windows line endings for Notepad

  if (args.summary) {
    fs.appendFileSync(args.summary, `## Voice comparison\n\nLine: *${TEXT}*\n\n| File | Variant | Length | Original loudness | Result |\n|---|---|---|---|---|\n`
      + rows.map((r) => `| ${r.file}.wav | ${r.label} | ${r.seconds ? r.seconds + ' s' : ''} | ${r.lufs !== undefined ? `${r.lufs} LUFS, peak ${r.tp} dBFS` : ''} | ${r.error ? 'not made: ' + r.error.replace(/\|/g, '/') : 'ok'} |`).join('\n')
      + `\n\nSet: ${SET}. Download **voice-comparison** under Artifacts. The .wav files are loudness-matched (-16 LUFS).\n`);
  }
  console.log(`\n${good.length}/${rows.length} variants made.`);
  if (!good.length) process.exit(1);
}

main().catch((e) => { console.error('voice-compare failed: ' + e.message); process.exit(1); });
