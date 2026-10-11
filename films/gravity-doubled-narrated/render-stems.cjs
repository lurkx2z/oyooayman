/* =====================================================================
   RENDER STEMS — renders each stem of the v2 soundtrack ON ITS OWN (audio-v2.js `solo`), ducked as in the film but at
   0 dB stem gain, and writes them as 32-bit float WAVs (48 kHz stereo). mix-v2.py measures, levels, sums and masters them.
     NODE_PATH=$(npm root -g) node films/gravity-doubled-narrated/render-stems.cjs <out_dir> [voice,music,amb,foley,sfx] [--raw]
   --raw renders without the ducking (for the before/after analysis). "mix" renders the page's own live mix.
   ===================================================================== */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const OUT = path.resolve(process.argv[2] || '.');
const STEMS = (process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : 'voice,music,amb,foley,sfx').split(',');
const RAW = process.argv.includes('--raw');
const ROOT = path.resolve(__dirname, '..', '..');
const PAGE = 'gravity-doubled-narrated-v2.html';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const br = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await br.newPage({ viewport: { width: 270, height: 480 } });
  p.on('pageerror', (e) => console.log('[pageerror]', e.message));
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[' + m.type() + ']', m.text().slice(0, 300)); });
  await p.goto('file://' + path.join(ROOT, PAGE) + '?capture&w=270&h=480', { timeout: 300000 });
  await p.waitForFunction(() => window.SIM_READY === true, null, { timeout: 900000 });
  for (const s of STEMS) {
    const t0 = Date.now();
    const b64 = await p.evaluate(async ([s, raw]) => {
      const A = SIM.audio; A.solo = s === 'mix' ? null : s; A.noDuck = raw;
      const buf = await A.renderOffline();
      A.solo = null; A.noDuck = false;
      const L = buf.getChannelData(0), R = buf.getChannelData(1), n = L.length, f = new Float32Array(n * 2);
      for (let i = 0; i < n; i++) { f[2 * i] = L[i]; f[2 * i + 1] = R[i]; }
      const u8 = new Uint8Array(f.buffer); let out = '';
      for (let i = 0; i < u8.length; i += 0x8000) out += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
      return btoa(out);
    }, [s, RAW]);
    const raw = path.join(OUT, s + '.f32'), wav = path.join(OUT, s + (RAW ? '_raw' : '') + '.wav');
    fs.writeFileSync(raw, Buffer.from(b64, 'base64'));
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'f32le', '-ar', '48000', '-ac', '2', '-i', raw, '-c:a', 'pcm_f32le', wav]);
    fs.unlinkSync(raw);
    console.log(s, '→', path.relative(process.cwd(), wav), ((Date.now() - t0) / 1000).toFixed(1) + 's');
  }
  await br.close();
})().catch((e) => { console.error(e); process.exit(1); });
