/* =====================================================================
   RENDER WAV — the film's soundtrack, rendered fresh from the current code (already cut to
   the film when the film has CONFIG.edit), as a WAV for muxing with the frames.

     NODE_PATH=$(npm root -g) node tools/render-wav.cjs slip.html /tmp/slip.wav
   Takes 30 s – 4 min depending on the film. Same audio the page plays (and that
   tools/bake-soundtrack.cjs stores), so the final video and the page always match.
   ===================================================================== */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const [page0, out] = process.argv.slice(2);
  if (!page0 || !out) { console.log('usage: render-wav.cjs page out.wav'); process.exit(1); }
  const ROOT = path.resolve(__dirname, '..');
  const br = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await br.newPage({ viewport: { width: 270, height: 480 } });
  p.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await p.goto('file://' + path.join(ROOT, page0) + '?capture&w=270&h=480', { timeout: 300000 });
  await p.waitForFunction(() => window.SIM_READY === true, null, { timeout: 900000 });
  const t0 = Date.now();
  const b64 = await p.evaluate(() => window.SIM.audioWavBase64(true));
  fs.writeFileSync(out, Buffer.from(b64, 'base64'));
  console.log('wrote', out, 'in', ((Date.now() - t0) / 1000).toFixed(0) + 's');
  await br.close();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
