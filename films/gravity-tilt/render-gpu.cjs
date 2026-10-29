/* =====================================================================
   RENDER ON A PC WITH A GRAPHICS CARD — the whole final film in one command, Windows, macOS or Linux.
   Same frames as the cloud render (tools/render-frames.cjs: SIM.captureFrame(t), JPEG q95), but the browser draws
   on the GPU, and the frames go straight into H.264 segments instead of 15,000 files on disk.

     npm install --no-save playwright && npx playwright install chromium        (once; ffmpeg must be on PATH)
     node films/gravity-tilt/render-gpu.cjs

   Writes to renders/gravity-tilt/:
     gravity-tilt_final_1080p.mp4   1920×1080 30 fps, H.264 CRF 18 + the mastered soundtrack (AAC 256k, copied)
     gravity-tilt_final_small.mp4   only with --small: 1280×720 two-pass, under 30 MiB (for a phone), AAC 128k copied
     check.jpg                            8 frames across the film
   Resumable: re-run the same command and finished 15-second segments are kept.
   Options: --workers 4  --out <dir>  --gpu auto|headless|headed|software  --channel msedge|chrome  --from <frame> --to <frame>  --w 1920 --h 1080
            --ffmpeg <path to ffmpeg>  --no-final (segments only)  --to 119 --final (a quick test of the whole chain)
            --small-only (only swap the small copy's soundtrack for small-soundtrack.m4a)
   ===================================================================== */
const path = require('path');
const fs = require('fs');
const { spawn, spawnSync } = require('child_process');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) {
  console.error('Playwright is missing. In the repo folder run:  npm install --no-save playwright  then  npx playwright install chromium');
  process.exit(1);
}

const ARGS = process.argv.slice(2).reduce((o, a, i, arr) => {
  if (a.startsWith('--')) { const k = a.slice(2); const v = arr[i + 1]; o[k] = (v === undefined || v.startsWith('--')) ? true : v; }
  return o;
}, {});
const ROOT = path.resolve(__dirname, '../..');
const PAGE = path.join(ROOT, 'gravity-tilt.html');
const SOUND = path.join(__dirname, 'final-soundtrack.m4a');         // AAC 256k (loudness: EPISODE_REPORT.md)
const SMALL_SOUND = path.join(__dirname, 'small-soundtrack.m4a');   // AAC 128k (measured; low-bitrate
                                                                    // AAC adds peaks, so it is encoded once and copied)
const OUT = path.resolve(ROOT, ARGS.out || 'renders/gravity-tilt');
const SEGDIR = path.join(OUT, 'segments');
const W = +(ARGS.w || 1920), H = +(ARGS.h || 1080), FPS = 30, SEG = +(ARGS.seg || 450);
const WORKERS = Math.max(1, +(ARGS.workers || 4));
const FFMPEG = ARGS.ffmpeg || process.env.FFMPEG || 'ffmpeg';
const FINAL = path.join(OUT, 'gravity-tilt_final_1080p.mp4');
const SMALL = path.join(OUT, 'gravity-tilt_final_small.mp4');
const url = pathToFileURL(PAGE).href + `?capture&w=${W}&h=${H}`;
const hms = (s) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 3600)}h${String(Math.floor(s / 60) % 60).padStart(2, '0')}m`; };

function ff(args, label) {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-y', ...args], { stdio: ['ignore', 'ignore', 'pipe'], maxBuffer: 1 << 28 });
  if (r.error) throw new Error(`ffmpeg not found (${r.error.message}). Install it and make sure "ffmpeg -version" works.`);
  if (r.status !== 0) { console.error(String(r.stderr).slice(-3000)); throw new Error(`ffmpeg failed: ${label}`); }
  return String(r.stderr);
}
function loudness(file) {
  const e = ff(['-nostats', '-i', file, '-vn', '-af', 'ebur128=peak=true', '-f', 'null', '-'], 'loudness');
  const sum = e.slice(e.lastIndexOf('Summary:'));
  return `${(sum.match(/I:\s+(-?[\d.]+) LUFS/) || [])[1] || '?'} LUFS, true peak ${(sum.match(/Peak:\s+(-?[\d.]+) dBFS/) || [])[1] || '?'} dBTP`;
}

// Open the page in a browser that really uses the GPU (headless first, then a visible window).
async function openPage(mode) {
  // --channel msedge|chrome uses the Edge or Chrome already installed on the PC instead of Playwright's own browser
  const ch = ARGS.channel && ARGS.channel !== true ? ARGS.channel : null;
  const tries = mode === 'software' ? [{ software: true }]
    : ch ? (mode === 'headed' ? [{ headless: false, channel: ch }] : [{ headless: true, channel: ch }, { headless: false, channel: ch }])
    : mode === 'headed' ? [{ headless: false }]
    : mode === 'headless' ? [{ headless: true, channel: 'chromium' }]
    : [{ headless: true, channel: 'chromium' }, { headless: true }, { headless: false },
      { headless: true, channel: 'msedge' }, { headless: true, channel: 'chrome' }];
  const why = [];
  for (const t of tries) {
    let br;
    try {
      br = await chromium.launch(t.software
        ? { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }
        : { headless: t.headless, ...(t.channel ? { channel: t.channel } : {}), args: ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows'] });
      const p = await br.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
      p.on('pageerror', (e) => console.log('[pageerror]', e.message));
      await p.goto(url, { timeout: 300000 });
      await p.waitForFunction(() => window.SIM_READY === true, null, { timeout: 900000 });
      const gpu = await p.evaluate(() => {
        const gl = window.SIM.renderer.getContext(); const x = gl.getExtension('WEBGL_debug_renderer_info');
        return x ? gl.getParameter(x.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      });
      const soft = /swiftshader|llvmpipe|software|basic render/i.test(gpu);
      if (soft && !t.software) { why.push(`${t.channel || 'playwright'} ${t.headless ? 'headless' : 'window'}: only software graphics (${gpu})`); await br.close(); continue; }
      return { br, p, gpu, how: t.software ? 'software' : `${t.channel || 'playwright'} ${t.headless ? 'headless' : 'window'}` };
    } catch (e) { why.push(`${t.channel || 'playwright'} ${t.headless ? 'headless' : 'window'}: ${e.message.split('\n')[0]}`); if (br) await br.close().catch(() => {}); }
  }
  throw new Error(`no GPU browser (${why.join('; ')}). Update the graphics driver, or run with --gpu software (very slow).`);
}

(async () => {
  fs.mkdirSync(SEGDIR, { recursive: true });
  if (!fs.existsSync(SOUND)) throw new Error('missing ' + SOUND + ' (pull the branch again)');
  ff(['-version'], 'version');
  if (ARGS['small-only']) {
    // swap the small copy's soundtrack for small-soundtrack.m4a (the picture is copied, nothing is re-rendered)
    if (!fs.existsSync(SMALL)) throw new Error('no small copy yet at ' + SMALL);
    const tmp = SMALL.replace(/\.mp4$/, '.new.mp4');
    ff(['-loglevel', 'error', '-i', SMALL, '-i', SMALL_SOUND, '-map', '0:v', '-map', '1:a', '-c', 'copy', '-shortest', '-movflags', '+faststart', tmp], 'small soundtrack');
    fs.renameSync(tmp, SMALL);
    console.log(`wrote ${SMALL} (${(fs.statSync(SMALL).size / 1048576).toFixed(1)} MiB), ${loudness(SMALL)}`);
    return;
  }
  const first = await openPage(ARGS.gpu || 'auto');
  console.log(`browser: ${first.how}, graphics: ${first.gpu}`);
  const dur = await first.p.evaluate(() => Edit.duration());
  const LAST = Math.round(dur * FPS);
  const A = +(ARGS.from || 0), B = Math.min(LAST, ARGS.to !== undefined ? +ARGS.to : LAST);
  const segs = [];
  for (let s = Math.floor(A / SEG) * SEG; s <= B; s += SEG) {
    const a = Math.max(A, s), b = Math.min(B, s + SEG - 1);
    segs.push({ a, b, file: path.join(SEGDIR, `seg_${String(a).padStart(5, '0')}_${String(b).padStart(5, '0')}.mp4`) });
  }
  const todo = segs.filter((s) => !fs.existsSync(s.file));
  const total = todo.reduce((n, s) => n + s.b - s.a + 1, 0);
  console.log(`film ${dur} s → frames ${A}..${B} at ${W}×${H}; ${segs.length} segments, ${todo.length} to render (${total} frames), ${WORKERS} workers`);

  const pages = [first];
  for (let k = 1; k < Math.min(WORKERS, todo.length); k++) {
    const ctx = await first.br.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => console.log('[pageerror]', e.message));
    await p.goto(url, { timeout: 300000 });
    await p.waitForFunction(() => window.SIM_READY === true, null, { timeout: 900000 });
    pages.push({ p });
  }
  for (const w of pages) await w.p.evaluate(() => { window.SIM.renderAt(0); const gl = window.SIM.renderer.getContext(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4)); });

  let done = 0, next = 0; const t0 = Date.now();
  const tick = setInterval(() => {
    const s = (Date.now() - t0) / 1000, r = done / s;
    console.log(`${done} / ${total} frames, ${r.toFixed(2)} frames/s, about ${hms((total - done) / Math.max(r, 1e-6))} left`);
  }, 60000);
  async function worker(w) {
    const stage = await w.p.$('#stage');
    while (next < todo.length) {
      const s = todo[next++], part = s.file + '.part.mp4';
      const enc = spawn(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-g', '60', '-r', String(FPS), '-an', part], { stdio: ['pipe', 'inherit', 'inherit'] });
      const closed = new Promise((res, rej) => { enc.on('error', rej); enc.on('close', (c) => (c === 0 ? res() : rej(new Error('encoder exit ' + c)))); });
      for (let i = s.a; i <= s.b; i++) {
        await w.p.evaluate((tt) => window.SIM.captureFrame(tt), i / FPS);
        const jpg = await stage.screenshot({ type: 'jpeg', quality: 95, timeout: 900000 });
        if (!enc.stdin.write(jpg)) await new Promise((r) => enc.stdin.once('drain', r));
        done++;
      }
      enc.stdin.end(); await closed;
      fs.renameSync(part, s.file);
      console.log(`segment ${path.basename(s.file)} done (frames ${s.a}..${s.b})`);
    }
  }
  await Promise.all(pages.map(worker));
  clearInterval(tick);
  await first.br.close();
  console.log(`frames done in ${hms((Date.now() - t0) / 1000)}`);
  if (ARGS['no-final'] || A !== 0 || (B !== LAST && !ARGS.final)) { console.log('segments only (partial range or --no-final)'); return; }
  const DUR = B === LAST ? dur : (B + 1) / FPS;   // --to N --final: a short test of the whole chain

  // join the segments, add the mastered soundtrack (copied, already mastered)
  const list = path.join(OUT, 'segments.txt');
  fs.writeFileSync(list, segs.map((s) => `file '${s.file.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n') + '\n');
  ff(['-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-i', SOUND, '-map', '0:v', '-map', '1:a', '-c', 'copy', '-t', String(DUR), '-movflags', '+faststart', FINAL], 'final');
  console.log(`wrote ${FINAL} (${(fs.statSync(FINAL).size / 1048576).toFixed(0)} MiB), ${loudness(FINAL)}`);

  // the small copy (only with --small): 720p two-pass sized to 27 MiB, with the small soundtrack copied
  if (ARGS.small) {
  const vk = Math.floor((27 * 1048576 * 8 / DUR - 128000 - 30000) / 1000);
  const log = path.join(OUT, 'x264pass');
  const NUL = process.platform === 'win32' ? 'NUL' : '/dev/null';
  ff(['-loglevel', 'error', '-i', FINAL, '-vf', 'scale=1280:720:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-b:v', vk + 'k', '-pix_fmt', 'yuv420p', '-pass', '1', '-passlogfile', log, '-an', '-f', 'mp4', NUL], 'small pass 1');
  ff(['-loglevel', 'error', '-i', FINAL, '-i', SMALL_SOUND, '-map', '0:v', '-map', '1:a', '-vf', 'scale=1280:720:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-b:v', vk + 'k', '-pix_fmt', 'yuv420p',
    '-pass', '2', '-passlogfile', log, '-c:a', 'copy', '-t', String(DUR), '-movflags', '+faststart', SMALL], 'small pass 2');
  for (const f of fs.readdirSync(OUT)) if (f.startsWith('x264pass')) fs.rmSync(path.join(OUT, f));
  console.log(`wrote ${SMALL} (${(fs.statSync(SMALL).size / 1048576).toFixed(1)} MiB), ${loudness(SMALL)}`);
  } else console.log('no small copy (add --small for one)');

  const n = B + 1, sel = Array.from({ length: 8 }, (_, k) => `eq(n\\,${Math.floor(n * (k + 0.5) / 8)})`).join('+');
  ff(['-loglevel', 'error', '-i', FINAL, '-vf', `select='${sel}',scale=320:-1,tile=8x1`, '-frames:v', '1', path.join(OUT, 'check.jpg')], 'check strip');
  console.log('ALL DONE. The film is ' + FINAL);
})().catch((e) => { console.error('FAIL', e.message || e); process.exit(1); });
