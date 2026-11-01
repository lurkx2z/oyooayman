/* =====================================================================
   CORE (2D) — "What if you suddenly knew everything?" A 1920×1080 Canvas 2D film, a pure function of time t (seconds):
   SIM.renderAt(t) draws frame t. Built on the strong-bones v2 core (cached painted layers LAYER, parallax cameras camK,
   bloom and a colour grade). Sound: one mixed soundtrack (sound/mix.py → soundtrack.js) played in sync by an <audio>
   element. Keys: Space play/pause, R restart, ←/→ step, F fullscreen, M mute.
   ===================================================================== */

const W = 1920, H = 1080, FPS = 30;
const KE2 = { t: 0, playing: false };
const sbc = { clamp: (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)) };
const cl = sbc.clamp;
const lerp = (a, b, u) => a + (b - a) * u;
const sm = (t, a, b) => { const u = cl((t - a) / (b - a)); return u * u * (3 - 2 * u); };
const eOut = (u) => 1 - Math.pow(1 - cl(u), 3);
const eIn = (u) => Math.pow(cl(u), 2.4);
const eIO = (u) => { u = cl(u); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = Math.imul(n, 9); n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15; return (n >>> 0) / 4294967296; }
function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function noise(x, seed = 0) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); const a = hash(i * 374761 + seed * 668265), b = hash((i + 1) * 374761 + seed * 668265); return (a + (b - a) * u) * 2 - 1; }

const SERIF = '"Lora", Georgia, serif', SANS = '"Inter", "Helvetica Neue", Arial, sans-serif', COND = '"Oswald", "Inter", sans-serif';
const PAL = {
  ink: '#191a26', inkRim: '#ffb36b', hero: '#2fa79a', heroDk: '#1f7a70', sis: '#f2c230', sisDk: '#c99b1c', pants: '#2b3047', shoe: '#e9e4da',
  cream: '#f6f1e7', amber: '#ffcf8a', red: '#e0483e',
};

// shapes
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function glow(g, x, y, r, col, a = 1) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = a; g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); g.globalAlpha = 1; }
function vgrad(g, x, y, w, h, stops) { const gr = g.createLinearGradient(0, y, 0, y + h); stops.forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(x, y, w, h); }
function txt(g, s, x, y, font, col, align = 'center', a = 1) { g.globalAlpha = a; g.font = font; g.fillStyle = col; g.textAlign = align; g.textBaseline = 'alphabetic'; g.fillText(s, x, y); g.globalAlpha = 1; }
function shadowOn(g, blur = 30, col = 'rgba(0,0,0,0.6)', oy = 6) { g.shadowColor = col; g.shadowBlur = blur; g.shadowOffsetY = oy; }
function shadowOff(g) { g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetY = 0; }

// grain: a few pre-made noise tiles, one picked per frame (deterministic)
const GRAIN = [];
function makeGrain() {
  for (let k = 0; k < 6; k++) {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), d = g.createImageData(256, 256), r = rng(900 + k);
    for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    g.putImageData(d, 0, 0); GRAIN.push(c);
  }
}


// ---------- painted layers: drawn once into an offscreen canvas, then reused every frame (fast, deterministic) ----------
// key: a unique name; w,h: size in set pixels; fn(g) paints it; opt.blur (px), opt.res (0.5 = half resolution)
const LAYERS = new Map();
function LAYER(key, w, h, fn, opt = {}) {
  let c = LAYERS.get(key); if (c) return c;
  const res = opt.res || 1;
  const raw = document.createElement('canvas'); raw.width = Math.ceil(w * res); raw.height = Math.ceil(h * res);
  const g = raw.getContext('2d'); g.scale(res, res); g.lineCap = 'round'; g.lineJoin = 'round'; fn(g, w, h);
  if (opt.blur) { c = document.createElement('canvas'); c.width = raw.width; c.height = raw.height; const g2 = c.getContext('2d'); g2.filter = `blur(${opt.blur * res}px)`; g2.drawImage(raw, 0, 0); }
  else c = raw;
  c.sw = w; c.sh = h; LAYERS.set(key, c); return c;
}
// draw a layer at set position (x, y) in the current transform
function putL(g, c, x = 0, y = 0) { g.drawImage(c, x, y, c.sw, c.sh); }

// parallax camera. C = { x, y, z } is the point of the actor plane at screen centre and the zoom; k = layer depth factor
// (1 actor plane, <1 far away, >1 foreground). Small handheld drift scaled by C.shake / C.drift.
function camK(g, C, k = 1, t = 0) {
  const z = 1 + (C.z - 1) * k;
  const dr = C.drift ?? 1, sk = C.shake || 0;
  const dx = (noise(t * 0.45, 3) * 6 * dr + noise(t * 23, 7) * 26 * sk), dy = (noise(t * 0.4, 4) * 4 * dr + noise(t * 21, 8) * 20 * sk);
  const cx = 960 + (C.x - 960) * k + dx * k, cy = 540 + (C.y - 540) * k + dy * k;
  const r = C.rot || 0;
  if (r) { const c = Math.cos(r) * z, s = Math.sin(r) * z; g.setTransform(c, s, -s, c, W / 2 - (c * cx - s * cy), H / 2 - (s * cx + c * cy)); }
  else g.setTransform(z, 0, 0, z, W / 2 - cx * z, H / 2 - cy * z);
}

// ---------- finishing: bloom (bright parts glow) and a colour grade ----------
let BLOOM = null;
function bloom(g, amt) {
  if (amt <= 0) return;
  if (!BLOOM) { const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }; BLOOM = { a: mk(480, 270), b: mk(480, 270) }; }
  const a = BLOOM.a.getContext('2d'), b = BLOOM.b.getContext('2d');
  a.globalCompositeOperation = 'source-over'; a.filter = 'none'; a.globalAlpha = 1; a.drawImage(g.canvas, 0, 0, 480, 270);
  a.globalCompositeOperation = 'multiply'; a.drawImage(BLOOM.a, 0, 0); a.drawImage(BLOOM.a, 0, 0);   // ≈ x⁴: keeps only the bright parts
  a.globalCompositeOperation = 'source-over';
  b.clearRect(0, 0, 480, 270); b.filter = 'blur(9px)'; b.drawImage(BLOOM.a, 0, 0); b.filter = 'none';
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter'; g.globalAlpha = amt; g.drawImage(BLOOM.b, 0, 0, W, H);
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}
// grade: shadows lifted toward violet, highlights warmed (soft-light wash), per-shot tint
function grade(g, P) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (P.wash) { g.globalCompositeOperation = 'soft-light'; g.globalAlpha = P.washA ?? 0.35; vgrad(g, 0, 0, W, H, [[0, P.wash[0]], [1, P.wash[1]]]); }
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
}

/* ---------- the player ---------- */
const SIM = {
  init() {
    this.canvas = document.getElementById('c'); this.g = this.canvas.getContext('2d');
    this.canvas.width = W; this.canvas.height = H;
    makeGrain();
    this.audio = document.getElementById('snd');
    if (window.FILM_SOUNDTRACK && FILM_SOUNDTRACK.b64) this.audio.src = 'data:' + FILM_SOUNDTRACK.mime + ';base64,' + FILM_SOUNDTRACK.b64;
    else if (window.FILM_SOUNDTRACK_URL) this.audio.src = FILM_SOUNDTRACK_URL;
    this.dur = KEF.duration;
    this.scrub = document.getElementById('scrub'); this.scrub.max = this.dur;
    this.scrub.addEventListener('input', () => this.seek(+this.scrub.value));
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') { e.preventDefault(); this.toggle(); }
      else if (e.key === 'r' || e.key === 'R') this.seek(0);
      else if (e.key === 'ArrowRight') this.seek(this.t + 1 / FPS);
      else if (e.key === 'ArrowLeft') this.seek(this.t - 1 / FPS);
      else if (e.key === 'f' || e.key === 'F') document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
      else if (e.key === 'm' || e.key === 'M') this.audio.muted = !this.audio.muted;
    });
    this.canvas.addEventListener('click', () => this.toggle());
    const ov = document.getElementById('startOverlay'); if (ov) ov.addEventListener('click', () => { ov.style.display = 'none'; this.toggle(); });
    this.t = 0; this.renderAt(0);
    const loop = () => { requestAnimationFrame(loop); if (this.playing) { this.t = this.audio.currentTime || this.t; if (this.t >= this.dur) { this.t = this.dur; this.pause(); } this.renderAt(this.t); this.scrub.value = this.t; } };
    if (!/capture/.test(location.search)) requestAnimationFrame(loop);
  },
  toggle() { const ov = document.getElementById('startOverlay'); if (ov) ov.style.display = 'none'; this.playing ? this.pause() : this.play(); },
  play() { if (this.t >= this.dur - 0.05) this.t = 0; this.audio.currentTime = this.t; this.audio.play().catch(() => {}); this.playing = true; },
  pause() { this.audio.pause(); this.playing = false; },
  seek(t) { this.t = cl(t, 0, this.dur); this.audio.currentTime = this.t; this.renderAt(this.t); this.scrub.value = this.t; },
  renderAt(t) {
    const g = this.g;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; shadowOff(g);
    KEF.draw(g, t);
    // finish: vignette, grain, fades
    g.setTransform(1, 0, 0, 1, 0, 0);
    const P = KEF.post(t);
    bloom(g, P.bloom ?? 0.5);
    grade(g, P);
    const vg = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(4,3,10,${P.vignette})`); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    if (P.flash > 0) { g.fillStyle = `rgba(255,250,240,${P.flash})`; g.fillRect(0, 0, W, H); }
    g.globalAlpha = 0.055; g.globalCompositeOperation = 'overlay';
    const tile = GRAIN[Math.floor(t * FPS) % GRAIN.length]; for (let y = 0; y < H; y += 256) for (let x = 0; x < W; x += 256) g.drawImage(tile, x, y);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    KEF.hud(g, t);
    if (P.fade > 0) { g.fillStyle = `rgba(0,0,0,${P.fade})`; g.fillRect(0, 0, W, H); }
    return true;
  },
  captureFrame(t) { this.renderAt(t); return true; },
};
window.SIM = SIM;
window.addEventListener('load', () => { (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { SIM.init(); window.SIM_READY = true; }); });
