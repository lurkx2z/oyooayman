/* =====================================================================
   RENDER FRAMES — one worker of the final render. Renders frames [from..to] of a film
   to <outdir>/f_00000.jpg … (frame i = film time i / fps). Skips frames that already
   exist, so a killed worker (or a container restart) can simply be re-run.

     NODE_PATH=$(npm root -g) node tools/render-frames.cjs slip.html 0 429 /tmp/full 1080 1920 30
   Normally started 4 at a time by tools/render-parallel.sh. JPEG q95 is visually lossless for the
   final H.264 and ~1 s per frame faster than PNG. Expect ~0.3–0.6 frames/s per worker at 1080×1920
   on software WebGL (a 60 s film ≈ 1–2.5 h with 4 workers).
   ===================================================================== */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const [page0, a, b, out] = process.argv.slice(2);
  const W = +(process.argv[6] || 540), H = +(process.argv[7] || 960), FPS = +(process.argv[8] || 30);
  if (!page0 || a === undefined || b === undefined || !out) { console.log('usage: render-frames.cjs page from to outdir [w h fps]'); process.exit(1); }
  const ROOT = path.resolve(__dirname, '..');
  fs.mkdirSync(out, { recursive: true });
  const br = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await br.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await p.goto('file://' + path.join(ROOT, page0) + `?capture&w=${W}&h=${H}`, { timeout: 300000 });
  await p.waitForFunction(() => window.SIM_READY === true, null, { timeout: 900000 });
  // warm-up: force shader compilation / first readback before timing frames
  await p.evaluate(() => { window.SIM.renderAt(0); const gl = window.SIM.renderer.getContext(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4)); });
  const stage = await p.$('#stage'), t0 = Date.now();
  for (let i = +a; i <= +b; i++) {
    const f = path.join(out, `f_${String(i).padStart(5, '0')}.jpg`);
    if (fs.existsSync(f)) continue;
    await p.evaluate((tt) => window.SIM.captureFrame(tt), i / FPS);
    await stage.screenshot({ path: f, type: 'jpeg', quality: 95, timeout: 900000 });
    if (i % 30 === 0) console.log(`frame ${i} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  console.log('DONE', a, b, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  await br.close();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
