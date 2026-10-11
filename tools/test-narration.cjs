/* =====================================================================
   TEST NARRATION — proves ElevenLabs voice generation works end to end:
   sends one short sentence, saves the MP3, then checks the file is a real,
   playable, non-silent MP3. Exit code 0 only if every check passes.

     node tools/test-narration.cjs                       (writes renders/narration-test/sample.mp3)
     node tools/test-narration.cjs --out my-test.mp3 --voice <id> --model <id> --text "Your own sentence."
     node tools/test-narration.cjs --selftest            (offline: checks the MP3 verifier itself, no API call)

   Needs ELEVENLABS_API_KEY set as an environment variable (docs/NARRATION.md). Costs about 70 characters.
   ===================================================================== */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const N = require('./narrate.cjs');

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));
const SENTENCE = (typeof args.text === 'string' && args.text.trim()) || 'What if gravity doubled at breakfast? Your coffee cup would suddenly weigh twice as much.';

function printReport(v) {
  const r = v.report || {};
  console.log(`  file:        ${r.file}`);
  console.log(`  size:        ${r.bytes} bytes`);
  console.log(`  MP3 frames:  ${r.frames} at ${r.sampleRate} Hz`);
  console.log(`  duration:    ${r.seconds} s`);
  if (r.decoded) console.log(`  loudness:    mean ${r.meanDb} dB, peak ${r.peakDb} dB (full decode with ffmpeg: no errors)`);
  else console.log('  ffmpeg not found: frame check only (install ffmpeg for the full decode check)');
}

async function selftest() {
  // Offline check of the verifier: a real MP3 must pass, silence and garbage must fail.
  if (!N.hasFfmpeg()) { console.error('selftest needs ffmpeg'); process.exit(1); }
  const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'narr-selftest-'));
  const tone = path.join(dir, 'tone.mp3'), quiet = path.join(dir, 'quiet.mp3'), junk = path.join(dir, 'junk.mp3');
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'sine=f=220:d=2', '-c:a', 'libmp3lame', '-b:a', '128k', tone]);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', '2', '-c:a', 'libmp3lame', quiet]);
  fs.writeFileSync(junk, JSON.stringify({ detail: { status: 'invalid_api_key' } }).repeat(50));
  const cases = [[tone, true], [quiet, false], [junk, false], [path.join(dir, 'missing.mp3'), false]];
  let bad = 0;
  for (const [f, expect] of cases) {
    const v = N.verifyMp3(f);
    const pass = v.ok === expect;
    if (!pass) bad++;
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${path.basename(f)} -> ${v.ok ? 'accepted' : 'rejected (' + v.problems[0] + ')'}`);
  }
  const p = N.parseScript('---\nstatus: approved\nvoice: abc\n---\n# comment\n[intro] Line one\ncontinues.\n\nLine two.\n');
  const parseOk = p.meta.status === 'approved' && p.meta.voice === 'abc' && p.clips.length === 2
    && p.clips[0].id === '01-intro' && p.clips[0].text === 'Line one continues.' && p.clips[1].id === '02';
  console.log(`${parseOk ? 'PASS' : 'FAIL'}  script parsing`);
  if (!parseOk) bad++;
  process.exit(bad ? 1 : 0);
}

async function main() {
  if (args.selftest) return selftest();
  const apiKey = N.requireKey();
  const out = path.resolve(args.out || 'renders/narration-test/sample.mp3');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  if (fs.existsSync(out)) fs.unlinkSync(out);   // never let an old file pass as this run's result
  const voice = args.voice || N.DEFAULT_VOICE, model = args.model || N.DEFAULT_MODEL;

  console.log(`1/3 Sending ${SENTENCE.length} characters to ElevenLabs (voice ${voice}, model ${model})…`);
  const r = await N.synthesize({ text: SENTENCE, voice, model, format: N.DEFAULT_FORMAT, apiKey });
  fs.writeFileSync(out, r.audio);
  console.log(`2/3 Saved ${r.audio.length} bytes (characters billed: ${r.characters ?? 'not reported'}).`);

  console.log('3/3 Verifying the MP3…');
  const v = N.verifyMp3(out, { minSeconds: Math.min(2, SENTENCE.length / 40) });   // speech runs ~15 characters/s, so N/40 s is a safe floor; the default sentence takes ~5 s
  printReport(v);
  if (!v.ok) {
    console.error('\nTEST FAILED:\n  - ' + v.problems.join('\n  - '));
    process.exit(1);
  }
  console.log(`\nTEST PASSED. Listen to it: ${out}`);
  if (args.summary) {   // a small markdown report (GitHub Actions shows it on the run page)
    const r = v.report;
    fs.appendFileSync(args.summary, `## Narration test passed\n\n| Check | Result |\n|---|---|\n| Text | ${SENTENCE.replace(/\|/g, '/')} |\n`
      + `| Voice / model | ${voice} / ${model} |\n| File | sample.mp3, ${r.bytes} bytes |\n| MP3 frames | ${r.frames} at ${r.sampleRate} Hz |\n`
      + `| Duration | ${r.seconds} s |\n| Full decode (ffmpeg) | ${r.decoded ? 'no errors' : 'not run'} |\n| Loudness | mean ${r.meanDb} dB, peak ${r.peakDb} dB |\n\n`
      + 'Download it from **Artifacts** at the bottom of this page.\n');
  }
}

main().catch((e) => { console.error('TEST FAILED: ' + e.message); process.exit(1); });
