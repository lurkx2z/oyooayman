#!/usr/bin/env node
/*
  Project Immortal: generate the dialogue, sound effects and music listed in immortal/audio/AUDIO_SPEC.json with
  ElevenLabs. Runs on GitHub Actions (workflow .github/workflows/immortal-audio.yml) because the cloud coding
  container cannot reach api.elevenlabs.io. The key comes from the environment (ELEVENLABS_API_KEY) and is never
  printed or written anywhere.

  What it does, in order (each step skips work that already exists, so re-runs cost nothing):
    1. Cast voices: designs 3 candidate voices per character from the written description (Voice Design), measures
       each candidate's pitch, keeps the one closest to the character's target pitch, saves it to the account and
       records its voice_id in immortal/audio/voices.json. All candidate previews are kept for listening.
    2. Dialogue: two takes per line (plain text, and with emotion tags) with word timestamps, verified by
       transcription (speech-to-text) so a take that read a tag out loud is rejected.
    3. Sound effects and music from text prompts.
  Writes immortal/audio/generated/** and immortal/audio/generated/manifest.json, plus a summary for the run page.

  Usage: node immortal/tools/elevenlabs-assets.cjs [--force] [--summary <file>] [--only voices,lines,sfx,music]
*/
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SPEC = path.join(ROOT, 'audio', 'AUDIO_SPEC.json');
const OUT = path.join(ROOT, 'audio', 'generated');
const VOICES = path.join(ROOT, 'audio', 'voices.json');
const API = process.env.ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io';
const KEY = process.env.ELEVENLABS_API_KEY;

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const SUMMARY = args.includes('--summary') ? args[args.indexOf('--summary') + 1] : null;
const ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : ['voices', 'lines', 'sfx', 'music'];

const log = [];
function note(s) { console.log(s); log.push(s); }
function hash(o) { return crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex').slice(0, 12); }
function readJSON(f, d) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (_) { return d; } }
function writeJSON(f, o) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 2) + '\n'); }

async function call(method, route, body, { form = false, binary = false } = {}) {
  const headers = { 'xi-api-key': KEY };
  let payload;
  if (form) payload = body;
  else if (body) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  const res = await fetch(API + route, { method, headers, body: payload });
  if (!res.ok) {
    let t = ''; try { t = (await res.text()).slice(0, 300); } catch (_) {}
    const e = new Error(`HTTP ${res.status} on ${route}: ${t}`); e.status = res.status; throw e;
  }
  return binary ? Buffer.from(await res.arrayBuffer()) : res.json();
}

// ---- audio checks -------------------------------------------------------------------------------------------
function pcm(file, rate = 16000) {
  const buf = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(rate), '-f', 's16le', '-'], { maxBuffer: 1 << 28 });
  const a = new Float32Array(buf.length / 2);
  for (let i = 0; i < a.length; i++) a[i] = buf.readInt16LE(i * 2) / 32768;
  return a;
}
function stats(file) {
  const a = pcm(file);
  let peak = 0, sum = 0;
  for (const v of a) { peak = Math.max(peak, Math.abs(v)); sum += v * v; }
  return { seconds: +(a.length / 16000).toFixed(3), peak_db: +(20 * Math.log10(peak + 1e-9)).toFixed(1), rms_db: +(10 * Math.log10(sum / a.length + 1e-12)).toFixed(1) };
}
// median fundamental frequency of the voiced frames (simple normalised autocorrelation)
function medianF0(file) {
  const a = pcm(file), sr = 16000, win = 640, hop = 320, lo = Math.floor(sr / 420), hi = Math.floor(sr / 70);
  const f0s = [];
  let maxE = 0;
  for (let s = 0; s + win + hi < a.length; s += hop) { let e = 0; for (let i = 0; i < win; i++) e += a[s + i] ** 2; maxE = Math.max(maxE, e); }
  for (let s = 0; s + win + hi < a.length; s += hop) {
    let e0 = 0; for (let i = 0; i < win; i++) e0 += a[s + i] ** 2;
    if (e0 < maxE * 0.05) continue;
    let best = 0, bestLag = 0;
    for (let lag = lo; lag <= hi; lag++) {
      let c = 0, e1 = 0;
      for (let i = 0; i < win; i++) { c += a[s + i] * a[s + i + lag]; e1 += a[s + i + lag] ** 2; }
      const r = c / Math.sqrt(e0 * e1 + 1e-12);
      if (r > best) { best = r; bestLag = lag; }
    }
    if (best > 0.6) f0s.push(sr / bestLag);
  }
  f0s.sort((x, y) => x - y);
  return f0s.length ? Math.round(f0s[Math.floor(f0s.length / 2)]) : 0;
}
function words(s) { return s.toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(Boolean); }

// ---- 1. voices -----------------------------------------------------------------------------------------------
async function designVoice(id, c, voices) {
  const key = hash({ d: c.description, t: c.preview_text });
  if (!FORCE && voices[id] && voices[id].voice_id && voices[id].key === key) { note(`voice ${id}: kept ${voices[id].voice_id}`); return; }
  let r, model;
  for (const m of ['eleven_ttv_v3', 'eleven_multilingual_ttv_v2']) {
    try { r = await call('POST', '/v1/text-to-voice/design', { voice_description: c.description, model_id: m, text: c.preview_text }); model = m; break; }
    catch (e) { note(`voice ${id}: design with ${m} failed (${e.message.slice(0, 160)})`); }
  }
  if (!r) {
    r = await call('POST', '/v1/text-to-voice/create-previews', { voice_description: c.description, text: c.preview_text });
    model = 'create-previews';
  }
  const dir = path.join(OUT, 'voices');
  fs.mkdirSync(dir, { recursive: true });
  const cands = [];
  (r.previews || []).forEach((p, i) => {
    const f = path.join(dir, `${id}-candidate-${i + 1}.mp3`);
    fs.writeFileSync(f, Buffer.from(p.audio_base_64, 'base64'));
    const f0 = medianF0(f);
    cands.push({ file: path.relative(ROOT, f), generated_voice_id: p.generated_voice_id, f0_hz: f0, ...stats(f) });
  });
  if (!cands.length) throw new Error(`voice ${id}: no previews returned`);
  cands.sort((x, y) => Math.abs(x.f0_hz - c.target_f0_hz) - Math.abs(y.f0_hz - c.target_f0_hz));
  const pick = cands[0];
  let saved;
  try {
    saved = await call('POST', '/v1/text-to-voice', { voice_name: c.name, voice_description: c.description, generated_voice_id: pick.generated_voice_id });
  } catch (e) {
    note(`voice ${id}: /v1/text-to-voice failed (${e.message.slice(0, 160)}), trying the older route`);
    saved = await call('POST', '/v1/text-to-voice/create-voice-from-preview', { voice_name: c.name, voice_description: c.description, generated_voice_id: pick.generated_voice_id });
  }
  voices[id] = { voice_id: saved.voice_id, name: c.name, key, design_model: model, picked: pick.file, f0_hz: pick.f0_hz, target_f0_hz: c.target_f0_hz, candidates: cands };
  writeJSON(VOICES, voices);
  note(`voice ${id}: designed (${model}), candidates f0 ${cands.map((x) => x.f0_hz).join('/')} Hz, picked ${pick.f0_hz} Hz -> ${saved.voice_id}`);
}

// ---- 2. dialogue ---------------------------------------------------------------------------------------------
async function tts(voice, text, models, stability) {
  let last;
  for (const m of models) {
    try {
      const j = await call('POST', `/v1/text-to-speech/${voice}/with-timestamps?output_format=${spec.format}`, { text, model_id: m, voice_settings: { stability, similarity_boost: 0.75 } });
      const al = j.alignment || j.normalized_alignment;
      return { model: m, audio: Buffer.from(j.audio_base64, 'base64'), chars: al ? al.characters.map((ch, i) => ({ c: ch, s: al.character_start_times_seconds[i], e: al.character_end_times_seconds[i] })) : [] };
    } catch (e) { last = e; note(`  tts with ${m} failed (${e.message.slice(0, 140)})`); }
  }
  throw last;
}
async function transcribe(file) {
  const fd = new FormData();
  fd.append('model_id', 'scribe_v1');
  fd.append('file', new Blob([fs.readFileSync(file)], { type: 'audio/mpeg' }), path.basename(file));
  try { const j = await call('POST', '/v1/speech-to-text', fd, { form: true }); return j.text || ''; }
  catch (e) { note(`  transcription unavailable (${e.message.slice(0, 120)})`); return null; }
}
function wordTimes(chars) {
  const out = []; let cur = null;
  for (const ch of chars) {
    if (/[A-Za-z']/.test(ch.c)) { if (!cur) cur = { w: '', s: ch.s, e: ch.e }; cur.w += ch.c; cur.e = ch.e; }
    else if (cur) { out.push(cur); cur = null; }
  }
  if (cur) out.push(cur);
  return out;
}
async function lines(voices, manifest) {
  const models = [spec.model, ...(spec.fallback_models || [])];
  for (const L of spec.lines) {
    const v = voices[L.cast] && voices[L.cast].voice_id;
    if (!v) { note(`line ${L.id}: no voice for ${L.cast}, skipped`); continue; }
    for (const [take, text] of [['a', L.text], ['b', L.tagged]]) {
      if (!text) continue;
      const tid = `${L.id}_${take}`;
      const key = hash({ v, text, st: L.stability, m: models });
      const f = path.join(OUT, 'dialogue', `${tid}.mp3`);
      if (!FORCE && manifest.lines[tid] && manifest.lines[tid].key === key && fs.existsSync(f)) { note(`line ${tid}: kept`); continue; }
      const r = await tts(v, text, models, L.stability ?? 0.4);
      fs.mkdirSync(path.dirname(f), { recursive: true });
      fs.writeFileSync(f, r.audio);
      const heard = await transcribe(f);
      const want = words(L.text), got = heard == null ? null : words(heard);
      const ok = got == null ? null : want.every((w) => got.includes(w)) && got.length <= want.length + 1;
      manifest.lines[tid] = { key, cast: L.cast, text: L.text, sent: text, model: r.model, file: path.relative(ROOT, f), heard, transcript_ok: ok, f0_hz: medianF0(f), words: wordTimes(r.chars), ...stats(f) };
      note(`line ${tid}: ${r.model}, ${manifest.lines[tid].seconds}s, heard "${heard}" ${ok === false ? 'MISMATCH' : ok ? 'ok' : '(unchecked)'}`);
      writeJSON(path.join(OUT, 'manifest.json'), manifest);
    }
  }
}

// ---- 3. sound effects and music ------------------------------------------------------------------------------
async function sfx(manifest) {
  for (const S of spec.sfx) {
    const key = hash(S), f = path.join(OUT, 'sfx', `${S.id}.mp3`);
    if (!FORCE && manifest.sfx[S.id] && manifest.sfx[S.id].key === key && fs.existsSync(f)) { note(`sfx ${S.id}: kept`); continue; }
    try {
      const body = { text: S.prompt, duration_seconds: S.seconds, prompt_influence: 0.5 };
      if (S.loop) body.loop = true;
      let audio;
      try { audio = await call('POST', `/v1/sound-generation?output_format=${spec.format}`, body, { binary: true }); }
      catch (e) { if (!S.loop) throw e; delete body.loop; audio = await call('POST', `/v1/sound-generation?output_format=${spec.format}`, body, { binary: true }); }
      fs.mkdirSync(path.dirname(f), { recursive: true });
      fs.writeFileSync(f, audio);
      manifest.sfx[S.id] = { key, prompt: S.prompt, file: path.relative(ROOT, f), ...stats(f) };
      note(`sfx ${S.id}: ${manifest.sfx[S.id].seconds}s`);
    } catch (e) { note(`sfx ${S.id}: FAILED (${e.message.slice(0, 160)})`); }
    writeJSON(path.join(OUT, 'manifest.json'), manifest);
  }
}
async function music(manifest) {
  for (const M of spec.music) {
    const key = hash(M), f = path.join(OUT, 'music', `${M.id}.mp3`);
    if (!FORCE && manifest.music[M.id] && manifest.music[M.id].key === key && fs.existsSync(f)) { note(`music ${M.id}: kept`); continue; }
    try {
      const audio = await call('POST', `/v1/music?output_format=${spec.format}`, { prompt: M.prompt, music_length_ms: Math.round(M.seconds * 1000), force_instrumental: true }, { binary: true });
      fs.mkdirSync(path.dirname(f), { recursive: true });
      fs.writeFileSync(f, audio);
      manifest.music[M.id] = { key, prompt: M.prompt, file: path.relative(ROOT, f), ...stats(f) };
      note(`music ${M.id}: ${manifest.music[M.id].seconds}s`);
    } catch (e) { note(`music ${M.id}: FAILED (${e.message.slice(0, 200)}); the mix falls back to the synthesized score`); }
    writeJSON(path.join(OUT, 'manifest.json'), manifest);
  }
}

const spec = readJSON(SPEC);
module.exports = { medianF0, stats, wordTimes };
if (require.main === module) (async () => {
  if (!KEY) { console.error('ELEVENLABS_API_KEY is not set'); process.exit(1); }
  const voices = readJSON(VOICES, {});
  const manifest = readJSON(path.join(OUT, 'manifest.json'), { lines: {}, sfx: {}, music: {} });
  let failed = false;
  if (ONLY.includes('voices')) for (const [id, c] of Object.entries(spec.cast)) {
    try { await designVoice(id, c, voices); } catch (e) { failed = true; note(`voice ${id}: FAILED (${e.message.slice(0, 200)})`); }
  }
  if (ONLY.includes('lines')) { try { await lines(voices, manifest); } catch (e) { failed = true; note(`lines: FAILED (${e.message.slice(0, 200)})`); } }
  if (ONLY.includes('sfx')) await sfx(manifest);
  if (ONLY.includes('music')) await music(manifest);
  writeJSON(path.join(OUT, 'manifest.json'), manifest);
  if (SUMMARY) fs.appendFileSync(SUMMARY, '## Project Immortal audio\n\n```\n' + log.join('\n') + '\n```\n');
  process.exit(failed ? 1 : 0);
})();
