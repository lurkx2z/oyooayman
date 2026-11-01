/* Stills of the 2D film: node films/strong-bones/2d/stills.cjs --t 1,5,10 --out /tmp/s [--w 960] */
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const A = process.argv.slice(2).reduce((o, a, i, r) => { if (a.startsWith('--')) o[a.slice(2)] = r[i + 1]; return o; }, {});
(async () => {
  const out = A.out || '/tmp/sb-stills'; fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + path.resolve(__dirname, '../../../strong-bones.html') + '?capture');
  await p.waitForFunction(() => window.SIM_READY === true, null, { timeout: 60000 }).catch(() => {});
  if (errs.length) console.log('ERRORS', errs);
  const w = +(A.w || 960);
  for (const t of (A.t || '1').split(',').map(Number)) {
    const d = await p.evaluate(([tt, ww]) => { SIM.renderAt(tt); const c = document.createElement('canvas'); c.width = ww; c.height = ww * 9 / 16; c.getContext('2d').drawImage(SIM.canvas, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.9); }, [t, w]);
    fs.writeFileSync(path.join(out, `t${t.toFixed(2).padStart(6, '0')}.jpg`), Buffer.from(d.split(',')[1], 'base64'));
  }
  if (errs.length) console.log('ERRORS', errs);
  await b.close();
})();
