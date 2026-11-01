/* Render the 2D film to MP4 (any machine; no GPU needed): canvas frames → JPEG → ffmpeg, in parallel segments.
     NODE_PATH=$(npm root -g) node films/strong-bones/v2/render.cjs --out renders/strong-bones [--workers 4] [--w 1920] [--from 0 --to 300]
   Writes <out>/strong-bones_final_1080p.mp4 (H.264 CRF 18, 30 fps + sound/out/mix.m4a copied). Resumable by segment. */
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs'); const { spawn, spawnSync } = require('child_process');
const A = process.argv.slice(2).reduce((o, a, i, r) => { if (a.startsWith('--')) o[a.slice(2)] = (r[i + 1] && !r[i + 1].startsWith('--')) ? r[i + 1] : true; return o; }, {});
const ROOT = path.resolve(__dirname, '../../..'), OUT = path.resolve(ROOT, A.out || 'renders/strong-bones'), SEG = path.join(OUT, 'seg');
fs.mkdirSync(SEG, { recursive: true });
const FPS = 30, Wd = +(A.w || 1920), Hd = Math.round(Wd * 9 / 16), WORKERS = +(A.workers || 4), SEGF = 150;
(async () => {
  const b0 = await chromium.launch(); const p0 = await b0.newPage(); await p0.goto('file://' + path.join(ROOT, 'strong-bones.html') + '?capture');
  await p0.waitForFunction(() => window.SIM_READY === true); const dur = await p0.evaluate(() => SIM.dur); await b0.close();
  const total = Math.round(dur * FPS), from = +(A.from || 0), to = Math.min(total - 1, +(A.to || total - 1));
  const segs = []; for (let s = Math.floor(from / SEGF) * SEGF; s <= to; s += SEGF) segs.push([s, Math.min(to, s + SEGF - 1)]);
  let next = 0; const t0 = Date.now();
  async function worker() {
    const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1920, height: 1080 } });
    await p.goto('file://' + path.join(ROOT, 'strong-bones.html') + '?capture'); await p.waitForFunction(() => window.SIM_READY === true);
    while (next < segs.length) {
      const [a, z] = segs[next++]; const f = path.join(SEG, `s_${String(a).padStart(5, '0')}.mp4`);
      if (fs.existsSync(f)) continue;
      const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', f + '.part.mp4']);
      for (let i = a; i <= z; i++) {
        const d = await p.evaluate(([t, w, h]) => { SIM.renderAt(t); let c = SIM.canvas; if (w !== 1920) { const k = document.createElement('canvas'); k.width = w; k.height = h; k.getContext('2d').drawImage(c, 0, 0, w, h); c = k; } return c.toDataURL('image/jpeg', 0.94); }, [i / FPS, Wd, Hd]);
        if (!ff.stdin.write(Buffer.from(d.slice(d.indexOf(',') + 1), 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
      }
      ff.stdin.end(); await new Promise((r) => ff.on('close', r)); fs.renameSync(f + '.part.mp4', f);
      console.log(`segment ${a}-${z} done (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
    }
    await br.close();
  }
  await Promise.all(Array.from({ length: WORKERS }, worker));
  if (A['no-final']) return;
  const list = path.join(SEG, 'list.txt'); fs.writeFileSync(list, segs.map(([a]) => `file 's_${String(a).padStart(5, '0')}.mp4'`).join('\n'));
  const name = Wd === 1920 ? 'strong-bones_final_1080p.mp4' : `strong-bones_preview_${Hd}p.mp4`;
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-i', path.join(__dirname, 'sound/out/mix.m4a'), '-map', '0:v', '-map', '1:a', '-c', 'copy', '-t', String(dur), '-movflags', '+faststart', path.join(OUT, name)], { stdio: 'inherit' });
  console.log(r.status === 0 ? 'WROTE ' + path.join(OUT, name) : 'concat failed');
})();
