/* =====================================================================
   CHECK PAGE — boots a film page the way a viewer would (not capture mode) and reports:
   boot errors (the red error box), console errors, and whether the sound becomes ready.
   Run it before every commit that touches a film, and on an unzipped delivery folder.

     NODE_PATH=$(npm root -g) node tools/check-page.cjs slip.html
     NODE_PATH=$(npm root -g) node tools/check-page.cjs /abs/path/to/unzipped/slip.html
   "sound: SOUND READY" within a few seconds means the baked soundtrack matches the code.
   If it sits on PREPARING SOUND… for minutes, the baked copy is stale: re-run tools/bake-soundtrack.cjs.
   ===================================================================== */
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const arg = process.argv[2] || 'index.html';
  const file = path.isAbsolute(arg) ? arg : path.join(path.resolve(__dirname, '..'), arg);
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 540, height: 960 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/Mismatch between texture|GL_INVALID|too many errors/.test(m.text())) errs.push(m.text().slice(0, 300)); if (m.type() === 'warning' && /soundtrack/.test(m.text())) errs.push('warning: ' + m.text().slice(0, 300)); });
  const t0 = Date.now();
  await p.goto('file://' + file, { timeout: 300000 });
  await p.waitForFunction(() => window.SIM_READY === true || (document.getElementById('errorBox') || {}).textContent, null, { timeout: 900000 });
  const box = await p.evaluate(() => document.getElementById('errorBox').textContent);
  console.log('booted in', ((Date.now() - t0) / 1000).toFixed(0) + 's', box ? '· ERRORBOX: ' + box : '· no boot errors');
  const t1 = Date.now();
  await p.waitForFunction(() => /READY|COULD NOT/.test((document.getElementById('soundStatus') || {}).textContent || ''), null, { timeout: 600000 }).catch(() => null);
  console.log('sound:', await p.evaluate(() => (document.getElementById('soundStatus') || {}).textContent), 'after', ((Date.now() - t1) / 1000).toFixed(0) + 's');
  console.log(errs.length ? 'errors:\n  ' + errs.join('\n  ') : 'no console errors');
  await b.close();
  process.exit(box || errs.some((e) => e.startsWith('pageerror')) ? 1 : 0);
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
