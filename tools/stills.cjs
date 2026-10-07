/* =====================================================================
   STILLS — render single frames of a film (the everyday look-dev / review tool).

     NODE_PATH=$(npm root -g) node tools/stills.cjs --page slip.html --t 1,5.5,12 --out /tmp/stills
   Options:
     --page  the film's page (default index.html)
     --t     comma-separated times (FILM seconds = what the viewer sees, default) …
     --story … or pass --story to give STORY seconds (only differs when the film has CONFIG.edit)
     --w --h output size (default 540×960; 1080×1920 for final-quality checks)
     --eval  JavaScript run in the page after boot, before any frame (e.g. to tweak a value)
     --nohud hide the HTML HUD (title/captions/readouts) to judge the 3D image alone
   Writes <out>/t_<time>.jpg and prints page errors. Software WebGL (SwiftShader): 1–10 s per frame.
   ===================================================================== */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));
const ROOT = path.resolve(__dirname, '..');
const PAGE = args.page || 'index.html';
const W = parseInt(args.w || '540', 10), H = parseInt(args.h || '960', 10);
const OUT = path.resolve(args.out || path.join(ROOT, 'renders', 'stills'));
const TIMES = String(args.t || '0').split(',').map(Number);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const br = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await br.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => console.log('[pageerror]', e.message));
  // (three's "texture format / sampler type" GL warnings are a known, harmless pre-existing message)
  p.on('console', (m) => { if (m.type() === 'error' && !/Mismatch between texture|GL_INVALID|too many errors/.test(m.text())) console.log('[console]', m.text().slice(0, 300)); });
  const t0 = Date.now();
  await p.goto('file://' + path.join(ROOT, PAGE) + `?capture&w=${W}&h=${H}`, { timeout: 300000 });
  await p.waitForFunction(() => window.SIM_READY === true || (document.getElementById('errorBox') || {}).textContent, null, { timeout: 900000 });
  const err = await p.evaluate(() => document.getElementById('errorBox').textContent);
  if (err) { console.log('ERRORBOX:', err); await br.close(); process.exit(1); }
  console.log('ready in', ((Date.now() - t0) / 1000).toFixed(0) + 's', '· film length', await p.evaluate(() => Edit.duration().toFixed(2)) + 's');
  if (args.eval) await p.evaluate(args.eval);
  if (args.nohud) await p.addStyleTag({ content: '#hud{display:none!important}' });
  const stage = await p.$('#stage');
  for (const t of TIMES) {
    const ft = await p.evaluate(([tt, story]) => { const f = story ? Edit.film(tt) : tt; window.SIM.captureFrame(f); return f; }, [t, !!args.story]);
    const f = path.join(OUT, `t_${t.toFixed(2).padStart(6, '0')}.jpg`);
    await stage.screenshot({ path: f, type: 'jpeg', quality: 90, timeout: 900000 });
    console.log(`t ${t}${args.story ? ' (story) → film ' + ft.toFixed(2) : ''} → ${path.relative(process.cwd(), f)}`);
  }
  await br.close();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
