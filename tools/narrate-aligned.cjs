/* =====================================================================
   NARRATE-ALIGNED — like tools/narrate.cjs, but every clip also gets word
   timestamps, so subtitles and scene timing can follow the real voice.

     node tools/narrate-aligned.cjs --script films/<slug>/NARRATION.md [--out dir] [--force] [--dry-run]

   Per clip it writes <id>.mp3 and <id>.align.json:
     { text, seconds, source, words: [{ text, start, end }], characters: [{ text, start, end }] }
   plus manifest.json (voice, model, settings, every clip's measured duration).

   Timing source, in order:
     1. ElevenLabs "text-to-speech with timestamps" (audio + character alignment in one call);
     2. if that endpoint refuses the model, plain text-to-speech + ElevenLabs forced alignment
        of the finished audio.
   Same approved-script format, voice defaults (Charlie, eleven_v4, 0.4 / 0.75), request
   stitching and MP3 verification as tools/narrate.cjs (reused from it, not copied).

   The key is read ONLY from ELEVENLABS_API_KEY and never printed or written.
   Runs on GitHub Actions (.github/workflows/narrate-episode.yml); the cloud coding
   container cannot reach api.elevenlabs.io. Does not touch the engine or any page.
   ===================================================================== */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const N = require('./narrate.cjs');

const API_BASE = process.env.ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io';

function parseArgs(argv) {
  return Object.fromEntries(argv.reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
    return acc;
  }, []));
}

async function apiError(res) {
  let detail = '';
  try { detail = (await res.text()).slice(0, 400); } catch (_) {}
  return new Error(`ElevenLabs returned HTTP ${res.status}: ${detail}`);
}

// 1. audio + character alignment in one request
async function synthWithTimestamps({ text, voice, model, format, voiceSettings, previousText, nextText, apiKey }) {
  const url = `${API_BASE}/v1/text-to-speech/${encodeURIComponent(voice)}/with-timestamps?output_format=${encodeURIComponent(format)}`;
  const body = { text, model_id: model, voice_settings: voiceSettings };
  if (previousText) body.previous_text = previousText;
  if (nextText) body.next_text = nextText;
  const res = await fetch(url, { method: 'POST', headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw await apiError(res);
  const j = await res.json();
  const al = j.alignment || j.normalized_alignment;
  if (!j.audio_base64 || !al) throw new Error('with-timestamps response had no audio or alignment');
  const characters = al.characters.map((c, i) => ({ text: c, start: al.character_start_times_seconds[i], end: al.character_end_times_seconds[i] }));
  return { audio: Buffer.from(j.audio_base64, 'base64'), characters };
}

// 2. forced alignment of finished audio against its text
async function forcedAlign({ file, text, apiKey }) {
  const fd = new FormData();
  fd.append('file', new Blob([fs.readFileSync(file)], { type: 'audio/mpeg' }), path.basename(file));
  fd.append('text', text);
  const res = await fetch(`${API_BASE}/v1/forced-alignment`, { method: 'POST', headers: { 'xi-api-key': apiKey }, body: fd });
  if (!res.ok) throw await apiError(res);
  const j = await res.json();
  return {
    characters: (j.characters || []).map((c) => ({ text: c.text, start: c.start, end: c.end })),
    words: (j.words || []).filter((w) => w.text.trim()).map((w) => ({ text: w.text.trim(), start: w.start, end: w.end })),
  };
}

// group character timings into words (spaces split words; punctuation stays on its word)
function wordsFromChars(chars) {
  const words = []; let cur = null;
  for (const c of chars) {
    if (/\s/.test(c.text)) { if (cur) { words.push(cur); cur = null; } continue; }
    if (!cur) cur = { text: '', start: c.start, end: c.end };
    cur.text += c.text; cur.end = c.end;
  }
  if (cur) words.push(cur);
  return words.map((w) => ({ text: w.text, start: +w.start.toFixed(3), end: +w.end.toFixed(3) }));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.script) { console.log('usage: node tools/narrate-aligned.cjs --script films/<slug>/NARRATION.md [--out dir] [--force] [--dry-run]'); process.exit(1); }
  const scriptPath = path.resolve(args.script);
  const { meta, clips } = N.parseScript(fs.readFileSync(scriptPath, 'utf8'));
  if ((meta.status || '').toLowerCase() !== 'approved') { console.error(`${args.script} is not approved (status: ${meta.status || '(missing)'})`); process.exit(3); }
  const outDir = path.resolve(args.out || path.join(path.dirname(scriptPath), 'narration'));
  const voice = args.voice || meta.voice || N.DEFAULT_VOICE;
  const model = args.model || meta.model || N.DEFAULT_MODEL;
  const format = args.format || meta.format || N.DEFAULT_FORMAT;
  const voiceSettings = {
    stability: parseFloat(args.stability ?? meta.stability ?? N.DEFAULT_SETTINGS.stability),
    similarity_boost: parseFloat(args.similarity ?? meta.similarity ?? N.DEFAULT_SETTINGS.similarity_boost),
  };
  console.log(`${clips.length} clip(s), ${clips.reduce((n, c) => n + c.text.length, 0)} characters, voice ${voice}, model ${model}, ${format}, stability ${voiceSettings.stability}, similarity ${voiceSettings.similarity_boost}`);
  if (args['dry-run']) { clips.forEach((c) => console.log(`  [${c.id}] ${c.text}`)); console.log('dry run: nothing sent.'); return; }
  const apiKey = N.requireKey();
  fs.mkdirSync(outDir, { recursive: true });
  const manifestPath = path.join(outDir, 'manifest.json');
  const old = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : { clips: [] };
  const manifest = { voice, model, format, voice_settings: voiceSettings, clips: [] };
  let failed = 0;

  for (let k = 0; k < clips.length; k++) {
    const c = clips[k];
    const file = path.join(outDir, `${c.id}.mp3`), alignFile = path.join(outDir, `${c.id}.align.json`);
    const hash = crypto.createHash('sha256').update([voice, model, format, JSON.stringify(voiceSettings), clips[k - 1]?.text || '', c.text, clips[k + 1]?.text || ''].join('\u0000')).digest('hex').slice(0, 16);
    const prev = old.clips.find((o) => o.id === c.id);
    if (!args.force && prev && prev.hash === hash && fs.existsSync(file) && fs.existsSync(alignFile) && N.verifyMp3(file).ok) {
      console.log(`  [${c.id}] unchanged, kept (${prev.seconds} s)`); manifest.clips.push(prev); continue;
    }
    process.stdout.write(`  [${c.id}] `);
    const req = { text: c.text, voice, model, format, voiceSettings, apiKey, previousText: clips[k - 1]?.text, nextText: clips[k + 1]?.text };
    let characters, words, source;
    try {
      const r = await synthWithTimestamps(req);
      fs.writeFileSync(file, r.audio);
      characters = r.characters; words = wordsFromChars(characters); source = 'tts-with-timestamps';
    } catch (e) {
      console.log(`with-timestamps unavailable (${e.message.slice(0, 160)}); falling back to TTS + forced alignment`);
      const r = await N.synthesize(req);
      fs.writeFileSync(file, r.audio);
      const fa = await forcedAlign({ file, text: c.text, apiKey });
      characters = fa.characters; words = fa.words.length ? fa.words : wordsFromChars(fa.characters); source = 'forced-alignment';
    }
    const v = N.verifyMp3(file);
    if (!v.ok) { failed++; console.log(`FAILED: ${v.problems.join('; ')}`); }
    else console.log(`ok, ${v.report.seconds} s, ${words.length} words timed (${source}), mean ${v.report.meanDb} dB`);
    fs.writeFileSync(alignFile, JSON.stringify({ id: c.id, text: c.text, seconds: v.report.seconds, source, words, characters }, null, 1) + '\n');
    manifest.clips.push({ id: c.id, text: c.text, file: path.basename(file), align: path.basename(alignFile), seconds: v.report.seconds,
      speech_start: words[0]?.start ?? null, speech_end: words[words.length - 1]?.end ?? null, hash, verified: v.ok, timing: source });
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  if (failed) { console.error(`${failed} clip(s) failed verification. Do not use them.`); process.exit(4); }
  console.log('all clips verified and timed.');
  if (args.summary) {
    fs.appendFileSync(args.summary, ['| clip | seconds | words | timing |', '|---|---|---|---|',
      ...manifest.clips.map((c) => `| ${c.id} | ${c.seconds} | ${JSON.parse(fs.readFileSync(path.join(outDir, c.align))).words.length} | ${c.timing} |`)].join('\n') + '\n');
  }
}

module.exports = { wordsFromChars };
if (require.main === module) main().catch((e) => { console.error('narrate-aligned failed: ' + e.message); process.exit(1); });
