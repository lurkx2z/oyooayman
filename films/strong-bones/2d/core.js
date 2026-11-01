/* =====================================================================
   CORE (2D) — the stickman version of "What if you were 10× stronger, but your bones weren't?".
   A 1920×1080 Canvas 2D film, a pure function of time t (seconds): SIM.renderAt(t) draws frame t. No WebGL, so it
   renders fast anywhere (the cloud included). Sound: one mixed soundtrack (sound/mix.py → soundtrack.js), played in
   sync by an <audio> element. Keys: Space play/pause, R restart, ←/→ step, F fullscreen, M mute.
   ===================================================================== */

const W = 1920, H = 1080, FPS = 30;
const SB2 = { t: 0, playing: false };
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

/* ---------- the player ---------- */
const SIM = {
  init() {
    this.canvas = document.getElementById('c'); this.g = this.canvas.getContext('2d');
    this.canvas.width = W; this.canvas.height = H;
    makeGrain();
    this.audio = document.getElementById('snd');
    if (window.FILM_SOUNDTRACK && FILM_SOUNDTRACK.b64) this.audio.src = 'data:' + FILM_SOUNDTRACK.mime + ';base64,' + FILM_SOUNDTRACK.b64;
    else if (window.FILM_SOUNDTRACK_URL) this.audio.src = FILM_SOUNDTRACK_URL;
    this.dur = FILM2.duration;
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
    FILM2.draw(g, t);
    // finish: vignette, grain, fades
    g.setTransform(1, 0, 0, 1, 0, 0);
    const P = FILM2.post(t);
    const vg = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(4,3,10,${P.vignette})`); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    if (P.flash > 0) { g.fillStyle = `rgba(255,250,240,${P.flash})`; g.fillRect(0, 0, W, H); }
    g.globalAlpha = 0.055; g.globalCompositeOperation = 'overlay';
    const tile = GRAIN[Math.floor(t * FPS) % GRAIN.length]; for (let y = 0; y < H; y += 256) for (let x = 0; x < W; x += 256) g.drawImage(tile, x, y);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    FILM2.hud(g, t);
    if (P.fade > 0) { g.fillStyle = `rgba(0,0,0,${P.fade})`; g.fillRect(0, 0, W, H); }
    return true;
  },
  captureFrame(t) { this.renderAt(t); return true; },
};
window.SIM = SIM;
window.addEventListener('load', () => { (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { SIM.init(); window.SIM_READY = true; }); });
