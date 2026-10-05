/* =====================================================================
   OPTIONAL: frame-exact offline renderer.
   Renders every frame deterministically (no dropped frames, exact 30 fps)
   with the HUD included, plus the synced soundtrack, into an MP4.

   Needs: Node.js, Playwright (npm i -D playwright) and ffmpeg on PATH.
     node tools/render-preview.cjs --w 1080 --h 1920 --out renders/what-if-oxygen.mp4
     node tools/render-preview.cjs --shots 0,2.5,3.3,6,8.6,12 --w 540 --h 960   (stills only)
     node tools/render-preview.cjs --page before-screens.html --to 15 --out renders/before-screens.mp4
   ===================================================================== */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));
const W = parseInt(args.w || '540', 10), H = parseInt(args.h || '960', 10);
const FPS = parseInt(args.fps || '30', 10);
const FROM = parseFloat(args.from || '0'), TO = parseFloat(args.to || '90');
const OUT = args.out || 'renders/preview.mp4';
const PAGE = args.page || 'index.html';   // which film to render, e.g. --page before-screens.html
const ROOT = path.resolve(__dirname, '..');
const frameDir = path.resolve(args.frames || path.join(ROOT, 'renders', 'frames'));

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
  });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) console.log('[page]', m.type(), m.text()); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  const url = 'file://' + path.join(ROOT, PAGE) + `?capture&w=${W}&h=${H}`;
  await page.goto(url);
  await page.waitForFunction(() => window.SIM_READY === true, null, { timeout: 180000 });
  const stage = await page.$('#stage');
  fs.mkdirSync(frameDir, { recursive: true });

  if (args.shots) {
    const shots = String(args.shots).split(',').map(Number);
    for (const t of shots) {
      await page.evaluate((tt) => window.SIM.captureFrame(tt), t);
      const f = path.join(frameDir, `shot_${t.toFixed(2).padStart(6, '0')}.png`);
      await stage.screenshot({ path: f });
      console.log('shot', f);
    }
    await browser.close();
    return;
  }

  for (const f of fs.readdirSync(frameDir)) if (f.startsWith('f_')) fs.unlinkSync(path.join(frameDir, f));
  const n = Math.round((TO - FROM) * FPS);
  const t0 = Date.now();
  for (let i = 0; i <= n; i++) {
    const t = FROM + i / FPS;
    await page.evaluate((tt) => window.SIM.captureFrame(tt), t);
    await stage.screenshot({ path: path.join(frameDir, `f_${String(i).padStart(5, '0')}.png`) });
    if (i % 15 === 0) console.log(`frame ${i}/${n}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  const wavB64 = await page.evaluate(() => window.SIM.audioWavBase64());
  const wav = path.join(frameDir, 'audio.wav');
  fs.writeFileSync(wav, Buffer.from(wavB64, 'base64'));
  await browser.close();
  fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
  execFileSync('ffmpeg', ['-y', '-framerate', String(FPS), '-i', path.join(frameDir, 'f_%05d.png'), '-ss', String(FROM), '-i', wav,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-c:a', 'aac', '-b:a', '192k', '-shortest', path.resolve(OUT)], { stdio: 'inherit' });
  console.log('wrote', OUT);
})().catch((e) => { console.error(e); process.exit(1); });
