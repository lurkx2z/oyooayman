/* =====================================================================
   BAKE SOUNDTRACK — renders a film's soundtrack once and stores it (as MP3,
   inside a small JS file) next to the film, so the page can play sound the
   moment it opens. Without it the page synthesises the whole soundtrack
   when it loads, which can take minutes on a laptop.

   The baked copy carries a fingerprint of the script and the sound code it was
   made from; if either changes, the page ignores the stale copy and renders
   the sound live again (and says so in the console). Re-run this to refresh it.

     node tools/bake-soundtrack.cjs --page before-screens.html --out films/before-screens/soundtrack.js
   Options:
     --wav file.wav   use a WAV already rendered from the current code (SIM.audioWavBase64) instead of rendering again
     --kbps 160       MP3 bitrate
   Needs: Node.js, Playwright (npm i -D playwright) and ffmpeg (with libmp3lame) on PATH.
   ===================================================================== */
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));
const ROOT = path.resolve(__dirname, '..');
const PAGE = args.page || 'before-screens.html';
const OUT = path.resolve(args.out || path.join(ROOT, 'films', 'before-screens', 'soundtrack.js'));
const KBPS = parseInt(args.kbps || '160', 10);

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 270, height: 480 } });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto('file://' + path.join(ROOT, PAGE) + '?capture&w=270&h=480', { timeout: 300000 });   // (a long simulation can hold up the load event)
  await page.waitForFunction(() => window.SIM_READY === true, null, { timeout: 600000 });
  const fingerprint = await page.evaluate(() => window.SIM.audio.fingerprint());
  console.log('fingerprint', fingerprint);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bake-'));
  let wav = args.wav ? path.resolve(args.wav) : path.join(tmp, 'soundtrack.wav');
  if (!args.wav) {
    console.log('rendering the soundtrack (this takes a few minutes)…');
    const t0 = Date.now();
    const b64 = await page.evaluate(() => window.SIM.audioWavBase64(true));
    fs.writeFileSync(wav, Buffer.from(b64, 'base64'));
    console.log('rendered in', ((Date.now() - t0) / 1000).toFixed(0), 's');
  }
  await browser.close();
  const mp3 = path.join(tmp, 'soundtrack.mp3');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-codec:a', 'libmp3lame', '-b:a', `${KBPS}k`, '-ar', '48000', mp3]);
  const data = fs.readFileSync(mp3).toString('base64');
  const js = `/* The pre-rendered soundtrack for ${PAGE} (MP3, ${KBPS} kbps), written by tools/bake-soundtrack.cjs.
   It lets the page play sound at once instead of synthesising it on load. If the film's script or sound code
   changes, the fingerprint stops matching and the page renders the sound live instead; re-run the tool to refresh. */
window.FILM_SOUNDTRACK = { fingerprint: '${fingerprint}', mime: 'audio/mpeg', b64: '${data}' };
`;
  fs.writeFileSync(OUT, js);
  console.log('wrote', path.relative(ROOT, OUT), (js.length / 1e6).toFixed(2), 'MB');
})().catch((e) => { console.error(e); process.exit(1); });
