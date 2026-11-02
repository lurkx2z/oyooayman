/* =====================================================================
   VOICE LINES — a character's short lines (not narration) through ElevenLabs text-to-speech, one MP3 per line.
     node tools/voice-lines.cjs --script films/<slug>/VO-<role>.md --out films/<slug>/voices/<role> [--force]
   Same approved-script format as tools/narrate.cjs (front matter + `[id] text` paragraphs; it reuses its parser and
   MP3 check). Differences: no request stitching (each line stands alone, and eleven_v3 refuses it), so delivery tags
   like [whispers] / [shouting] work on eleven_v3; and `fallback_model:` in the front matter: if the main model is
   refused, the line is made again with that model and its [tags] removed (written to the manifest as such).
   The key is read ONLY from ELEVENLABS_API_KEY and never printed. Runs on GitHub Actions (the cloud container can't
   reach api.elevenlabs.io).
   ===================================================================== */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const N = require('./narrate.cjs');

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => { if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]); return acc; }, []));

async function main() {
  if (!args.script || !args.out) { console.log('usage: node tools/voice-lines.cjs --script films/<slug>/VO-<role>.md --out <dir> [--force] [--dry-run]'); process.exit(1); }
  const { meta, clips } = N.parseScript(fs.readFileSync(args.script, 'utf8'));
  if ((meta.status || '').toLowerCase() !== 'approved') { console.error(`${args.script} is not approved`); process.exit(3); }
  const voice = meta.voice || N.BACKUP_VOICE, model = meta.model || N.DEFAULT_MODEL, format = meta.format || N.DEFAULT_FORMAT;
  const vs = { stability: parseFloat(meta.stability ?? 0.5), similarity_boost: parseFloat(meta.similarity ?? 0.75) };
  if (meta.style != null) vs.style = parseFloat(meta.style);
  console.log(`${clips.length} line(s), ${clips.reduce((n, c) => n + c.text.length, 0)} characters, voice ${voice}, model ${model} (fallback ${meta.fallback_model || 'none'})`);
  if (args['dry-run']) { clips.forEach((c) => console.log(`  [${c.id}] ${c.text}`)); return; }
  const apiKey = N.requireKey();
  fs.mkdirSync(args.out, { recursive: true });
  const mPath = path.join(args.out, 'manifest.json');
  const old = fs.existsSync(mPath) ? JSON.parse(fs.readFileSync(mPath, 'utf8')) : { clips: [] };
  const manifest = { voice, model, format, voice_settings: vs, clips: [] };
  let failed = 0;
  for (const c of clips) {
    const file = path.join(args.out, `${c.id}.mp3`);
    const hash = crypto.createHash('sha256').update([voice, model, format, JSON.stringify(vs), c.text].join('\u0000')).digest('hex').slice(0, 16);
    const prev = old.clips.find((o) => o.id === c.id);
    if (!args.force && prev && prev.hash === hash && fs.existsSync(file) && N.verifyMp3(file).ok) { console.log(`  [${c.id}] unchanged, kept`); manifest.clips.push(prev); continue; }
    process.stdout.write(`  [${c.id}] `);
    let used = model, text = c.text, r;
    try { r = await N.synthesize({ text, voice, model, format, voiceSettings: vs, apiKey }); }
    catch (e) {
      if (!meta.fallback_model) throw e;
      console.log(`${model} refused (${e.message.slice(0, 200)}); trying ${meta.fallback_model} without tags`);
      used = meta.fallback_model; text = c.text.replace(/\[[^\]]*\]\s*/g, '').trim();
      r = await N.synthesize({ text, voice, model: used, format, voiceSettings: { stability: 0.4, similarity_boost: 0.75 }, apiKey });
    }
    fs.writeFileSync(file, r.audio);
    const v = N.verifyMp3(file, { minSeconds: 0.2 });
    if (!v.ok) { failed++; console.log(`FAILED: ${v.problems.join('; ')}`); } else console.log(`ok, ${v.report.seconds} s (${used})`);
    manifest.clips.push({ id: c.id, text: c.text, sent: text, model: used, file: path.basename(file), seconds: v.report.seconds, hash, verified: v.ok });
  }
  fs.writeFileSync(mPath, JSON.stringify(manifest, null, 2) + '\n');
  if (failed) { console.error(`${failed} line(s) failed verification`); process.exit(4); }
  if (args.summary) fs.appendFileSync(args.summary, ['| line | seconds | model |', '|---|---|---|', ...manifest.clips.map((c) => `| ${c.id} | ${c.seconds} | ${c.model} |`)].join('\n') + '\n');
}
main().catch((e) => { console.error('voice-lines failed: ' + e.message); process.exit(1); });
