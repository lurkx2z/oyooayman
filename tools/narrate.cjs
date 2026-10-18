/* =====================================================================
   NARRATE — turns an approved narration script into voice-over MP3s with
   ElevenLabs text-to-speech. One clip per paragraph, plus one joined file
   and a manifest with every clip's duration (for timing captions and beats).

     node tools/narrate.cjs --script films/<slug>/NARRATION.md
     node tools/narrate.cjs --text "What if gravity doubled?" --out renders/line.mp3
   Options:
     --out <dir|file>  where to write (default: films/<slug>/narration/ next to the script)
     --voice <id>      ElevenLabs voice id (default: the script's `voice:`, else Charlie; Liam is the backup)
     --model <id>      model id (default: the script's `model:`, else eleven_v4)
     --format <fmt>    output format (default mp3_44100_128)
     --stability <0-1> --similarity <0-1>   voice settings (default 0.4 / 0.75, natural; also `stability:` / `similarity:` in the script)
     --dry-run         show what would be sent and the character count; calls nothing
     --force           regenerate clips even if their text has not changed

   The script must start with a front-matter block containing `status: approved`,
   so a draft never costs credits by accident. Paragraphs (separated by blank lines)
   become clips; an optional `[id]` at the start of a paragraph names the clip.
   Lines starting with `#` are comments. See docs/NARRATION.md.

   The API key is read ONLY from the ELEVENLABS_API_KEY environment variable. It is
   never printed, written to disk, or put in a page. Needs Node 18+ (built-in fetch);
   ffmpeg/ffprobe on PATH is used for the playback check and the joined file.
   This tool does not touch the engine or any film page.
   ===================================================================== */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync, spawnSync } = require('child_process');

const API_BASE = process.env.ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io';   // override only for local tests
const DEFAULT_VOICE = 'IKne3meq5aSn9XLyUdCD';   // Charlie (male, natural, Australian): the owner's pick, 2026-10-11
const BACKUP_VOICE = 'TX3LPaxmHKxFdv7VOQHJ';    // Liam (male, young, clear): the owner's second choice
// The official skill's "conversational" preset; the owner wants a normal, natural voice, not an announcer.
const DEFAULT_SETTINGS = { stability: 0.4, similarity_boost: 0.75 };
const DEFAULT_MODEL = 'eleven_v4';
const DEFAULT_FORMAT = 'mp3_44100_128';

function parseArgs(argv) {
  return Object.fromEntries(argv.reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
    return acc;
  }, []));
}

/* ---------- script parsing ---------- */
function parseScript(src) {
  const meta = {};
  let body = src.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const fm = body.match(/^---\n([\s\S]*?)\n---\n?/);
  if (fm) {
    for (const line of fm[1].split('\n')) {
      const m = line.match(/^\s*([A-Za-z_]+)\s*:\s*(.*?)\s*$/);
      if (m) meta[m[1].toLowerCase()] = m[2];
    }
    body = body.slice(fm[0].length);
  }
  const lines = body.split('\n').filter((l) => !/^\s*#/.test(l));
  const paras = lines.join('\n').split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
  const clips = paras.map((p, i) => {
    const m = p.match(/^\[([A-Za-z0-9_-]+)\]\s*(.*)$/);
    const n = String(i + 1).padStart(2, '0');
    return m ? { id: `${n}-${m[1]}`, text: m[2] } : { id: n, text: p };
  }).filter((c) => c.text);
  return { meta, clips };
}

/* ---------- the API call ---------- */
async function synthesize({ text, voice, model, format, previousText, nextText, voiceSettings, apiKey }) {
  const url = `${API_BASE}/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=${encodeURIComponent(format)}`;
  const body = { text, model_id: model };
  if (previousText) body.previous_text = previousText;   // request stitching: keeps tone continuous across clips
  if (nextText) body.next_text = nextText;
  if (voiceSettings) body.voice_settings = voiceSettings;   // stability, similarity_boost (+ style, use_speaker_boost on v2/v3)
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error(`could not reach ${API_BASE} (${e.cause?.code || e.message}). Check your internet connection.`);
  }
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.text()).slice(0, 400); } catch (_) {}
    const hint = { 401: 'the API key is missing, wrong or revoked', 402: 'not enough credits / plan limit', 422: 'bad voice id, model id or text', 429: 'rate limited, wait and retry' }[res.status] || '';
    throw new Error(`ElevenLabs returned HTTP ${res.status}${hint ? ` (${hint})` : ''}: ${detail}`);
  }
  return { audio: Buffer.from(await res.arrayBuffer()), characters: res.headers.get('x-character-count'), requestId: res.headers.get('request-id') };
}

/* ---------- verification: is this really a playable MP3? ---------- */
// Walks the MPEG audio frames in pure JS (no ffmpeg needed) and returns frame count and duration.
function scanMp3(buf) {
  let i = 0;
  if (buf.length >= 10 && buf.toString('latin1', 0, 3) === 'ID3') {   // skip an ID3v2 tag
    i = 10 + ((buf[6] & 0x7f) << 21 | (buf[7] & 0x7f) << 14 | (buf[8] & 0x7f) << 7 | (buf[9] & 0x7f));
  }
  const BR = { 1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320], 2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160] };
  const SR = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };
  let frames = 0, seconds = 0, sampleRate = 0, bad = 0;
  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xff || (buf[i + 1] & 0xe0) !== 0xe0) { i++; bad++; continue; }
    const ver = (buf[i + 1] >> 3) & 3, layer = (buf[i + 1] >> 1) & 3;
    const bri = buf[i + 2] >> 4, sri = (buf[i + 2] >> 2) & 3, pad = (buf[i + 2] >> 1) & 1;
    if (ver === 1 || layer !== 1 || bri === 0 || bri === 15 || sri === 3) { i++; bad++; continue; }   // Layer III only
    const kbps = BR[ver === 3 ? 1 : 2][bri], sr = SR[ver][sri];
    const spf = ver === 3 ? 1152 : 576;
    const len = Math.floor((spf / 8) * kbps * 1000 / sr) + pad;
    if (len < 4) { i++; bad++; continue; }
    frames++; seconds += spf / sr; sampleRate = sr; i += len;
  }
  return { frames, seconds, sampleRate, junkBytes: bad };
}

function hasFfmpeg() {
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; } catch (_) { return false; }
}

// Full check: the file exists, is MP3, has real duration, decodes end to end, and is not silent.
function verifyMp3(file, { minSeconds = 0.3 } = {}) {
  const problems = [];
  if (!fs.existsSync(file)) return { ok: false, problems: ['file was not created'] };
  const buf = fs.readFileSync(file);
  const scan = scanMp3(buf);
  const report = { file, bytes: buf.length, frames: scan.frames, seconds: +scan.seconds.toFixed(2), sampleRate: scan.sampleRate };
  if (buf.length < 1000) problems.push(`file is only ${buf.length} bytes`);
  if (scan.frames < 10) problems.push('no valid MP3 frames found (the API may have returned an error page instead of audio)');
  if (scan.seconds < minSeconds) problems.push(`audio is only ${scan.seconds.toFixed(2)} s long`);
  if (hasFfmpeg()) {
    const dec = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'null', '-']);
    const err = String(dec.stderr || '').trim();
    if (dec.status !== 0) problems.push('ffmpeg could not decode the file: ' + err.slice(0, 200));
    else if (err) problems.push('decoder reported errors: ' + err.slice(0, 200));
    // volumedetect prints to stderr, which execFileSync only returns on failure, so capture it via spawnSync
    const s = String(spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-af', 'volumedetect', '-f', 'null', '-']).stderr || '');
    const mean = parseFloat((s.match(/mean_volume:\s*(-?[\d.]+)/) || [])[1]);
    const max = parseFloat((s.match(/max_volume:\s*(-?[\d.]+)/) || [])[1]);
    report.meanDb = mean; report.peakDb = max;
    if (!(mean > -45)) problems.push(`audio is (nearly) silent: mean ${mean} dB`);
    report.decoded = true;
  } else {
    report.decoded = false;   // frame scan only; install ffmpeg for the full decode + silence check
  }
  return { ok: problems.length === 0, problems, report };
}

function requireKey() {
  const key = (process.env.ELEVENLABS_API_KEY || '').trim();
  if (!key) {
    console.error('ELEVENLABS_API_KEY is not set in this terminal.\n'
      + 'Set it as an environment variable (see docs/NARRATION.md, "Set up the API key"), then open a NEW terminal and run this again.\n'
      + 'Never paste the key into chat, a file in this repo, or a page.');
    process.exit(2);
  }
  return key;
}

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);

/* ---------- main ---------- */
async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.script && !args.text) {
    console.log('usage: node tools/narrate.cjs --script films/<slug>/NARRATION.md [--out dir] [--voice id] [--model id] [--dry-run] [--force]\n'
      + '       node tools/narrate.cjs --text "One sentence." --out renders/line.mp3');
    process.exit(1);
  }

  let meta = {}, clips, outDir, single = null;
  if (args.script) {
    const scriptPath = path.resolve(args.script);
    ({ meta, clips } = parseScript(fs.readFileSync(scriptPath, 'utf8')));
    if ((meta.status || '').toLowerCase() !== 'approved') {
      console.error(`${args.script} is not approved (front matter says status: ${meta.status || '(missing)'}). Set "status: approved" once the script is final.`);
      process.exit(3);
    }
    if (!clips.length) { console.error('the script has no narration paragraphs'); process.exit(3); }
    outDir = path.resolve(args.out || path.join(path.dirname(scriptPath), 'narration'));
  } else {
    clips = [{ id: 'line', text: String(args.text) }];
    const out = path.resolve(args.out || 'renders/narration/line.mp3');
    outDir = path.dirname(out); single = out;
  }
  const voice = args.voice || meta.voice || DEFAULT_VOICE;
  const voiceSettings = {
    stability: parseFloat(args.stability ?? meta.stability ?? DEFAULT_SETTINGS.stability),
    similarity_boost: parseFloat(args.similarity ?? meta.similarity ?? DEFAULT_SETTINGS.similarity_boost),
  };
  const model = args.model || meta.model || DEFAULT_MODEL;
  const format = args.format || meta.format || DEFAULT_FORMAT;
  if (!format.startsWith('mp3')) { console.error('only mp3_* output formats are supported by this tool'); process.exit(1); }

  const chars = clips.reduce((n, c) => n + c.text.length, 0);
  console.log(`${clips.length} clip(s), ${chars} characters, voice ${voice}, model ${model}, format ${format}, stability ${voiceSettings.stability}, similarity ${voiceSettings.similarity_boost}`);
  console.log(`output: ${path.relative(process.cwd(), single || outDir) || '.'}`);
  if (args['dry-run']) {
    clips.forEach((c) => console.log(`  [${c.id}] ${c.text}`));
    console.log('dry run: nothing was sent to ElevenLabs.');
    return;
  }
  const apiKey = requireKey();
  fs.mkdirSync(outDir, { recursive: true });

  const manifestPath = path.join(outDir, 'manifest.json');
  const old = !single && fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : { clips: [] };
  const manifest = { voice, model, format, generated: null, clips: [] };
  let failed = 0, spent = 0;

  for (let k = 0; k < clips.length; k++) {
    const c = clips[k];
    const file = single || path.join(outDir, `${c.id}.mp3`);
    const key = sha([voice, model, format, JSON.stringify(voiceSettings), clips[k - 1]?.text || '', c.text, clips[k + 1]?.text || ''].join('\u0000'));
    const prev = old.clips.find((o) => o.id === c.id);
    if (!args.force && prev && prev.hash === key && fs.existsSync(file) && verifyMp3(file).ok) {
      console.log(`  [${c.id}] unchanged, kept (${prev.seconds} s)`);
      manifest.clips.push(prev);
      continue;
    }
    process.stdout.write(`  [${c.id}] generating… `);
    const r = await synthesize({ text: c.text, voice, model, format, voiceSettings, apiKey, previousText: clips[k - 1]?.text, nextText: clips[k + 1]?.text });
    fs.writeFileSync(file, r.audio);
    spent += Number(r.characters) || c.text.length;
    const v = verifyMp3(file);
    if (!v.ok) { failed++; console.log(`FAILED: ${v.problems.join('; ')}`); }
    else console.log(`ok, ${v.report.seconds} s, ${(v.report.bytes / 1024).toFixed(0)} KiB${v.report.decoded ? `, mean ${v.report.meanDb} dB` : ''}`);
    manifest.clips.push({ id: c.id, text: c.text, file: path.basename(file), seconds: v.report.seconds, hash: key, verified: v.ok });
  }

  if (!single) {
    // joined file: clips back to back with a short gap; timing per clip is in the manifest
    let t = 0; const gap = parseFloat(args.gap || meta.gap || '0.35');
    manifest.clips.forEach((c) => { c.start = +t.toFixed(2); t += c.seconds + gap; });
    if (hasFfmpeg() && !failed) {
      const list = path.join(outDir, '.concat.txt');
      const silence = path.join(outDir, '.gap.mp3');
      const sr = String(scanMp3(fs.readFileSync(path.join(outDir, manifest.clips[0].file))).sampleRate || 44100);
      execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', `anullsrc=r=${sr}:cl=mono`, '-t', String(gap), '-c:a', 'libmp3lame', '-b:a', '128k', silence]);
      fs.writeFileSync(list, manifest.clips.map((c, i) => `file '${c.file}'` + (i < manifest.clips.length - 1 ? `\nfile '.gap.mp3'` : '')).join('\n') + '\n');
      const joined = path.join(outDir, 'narration.mp3');
      execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '128k', joined]);
      fs.unlinkSync(list); fs.unlinkSync(silence);
      const v = verifyMp3(joined);
      manifest.joined = { file: 'narration.mp3', seconds: v.report.seconds, verified: v.ok };
      console.log(`joined: narration.mp3, ${v.report.seconds} s ${v.ok ? 'ok' : 'FAILED: ' + v.problems.join('; ')}`);
      if (!v.ok) failed++;
    }
    manifest.generated = new Date().toISOString();   // bookkeeping only; nothing in a film reads this
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  }
  console.log(`characters billed this run: ~${spent}`);
  if (failed) { console.error(`${failed} file(s) failed verification. Do not use them.`); process.exit(4); }
  console.log('all narration files verified.');
}

module.exports = { parseScript, synthesize, scanMp3, verifyMp3, hasFfmpeg, requireKey, DEFAULT_VOICE, BACKUP_VOICE, DEFAULT_SETTINGS, DEFAULT_MODEL, DEFAULT_FORMAT };
if (require.main === module) main().catch((e) => { console.error('narrate failed: ' + e.message); process.exit(1); });
