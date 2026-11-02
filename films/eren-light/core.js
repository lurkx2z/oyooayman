/* =====================================================================
   CORE — "Would Eren and Light agree?" A 1920×1080 film, a pure function of time t (seconds): SIM.renderAt(t).
   THE LOOK ("living manga"): every frame is painted in Canvas 2D (sets, figures, light), then passed through one
   WebGL ink shader that turns it into a printed manga page in motion:
     · tones become screentone dots on a fixed 45° grid (dark = big dots, near-black = solid ink, light = paper);
     · hard shape edges become ink lines (a Sobel pass);
     · only two colours survive at full strength: Light's crimson and Eren's green (saturated pixels are kept);
     · the rest gets a faint watercolour wash of its own hue, on warm paper with fibres;
     · "impact frames": on the biggest beats the page flips to stark negative for a few frames.
   Captions and cards are drawn after the shader, crisp. Keys: Space play/pause, R restart, ←/→ step, F, M.
   ===================================================================== */
// a guard for a render that must never stop: a negative radius (say, a ripple a frame before it starts) draws nothing
(() => { for (const C of [window.CanvasRenderingContext2D, window.OffscreenCanvasRenderingContext2D]) { if (!C) continue; const P = C.prototype, e = P.ellipse, a = P.arc, rg = P.createRadialGradient;
  P.ellipse = function (x, y, rx, ry, ...r) { return e.call(this, x, y, Math.max(0, rx), Math.max(0, ry), ...r); };
  P.arc = function (x, y, rr, ...r) { return a.call(this, x, y, Math.max(0, rr), ...r); };
  P.createRadialGradient = function (x0, y0, r0, x1, y1, r1) { return rg.call(this, x0, y0, Math.max(0, r0), x1, y1, Math.max(0, r1)); }; } })();

const W = 1920, H = 1080, FPS = 30;
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
const PAL = { ink: '#141218', paper: '#f1ebdd', cream: '#f6f1e7', amber: '#ffcf8a', red: '#d8262c', green: '#22d184', gold: '#f2b632', inkRim: '#ffe0b0' };

function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function glow(g, x, y, r, col, a = 1) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = a; g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); g.globalAlpha = 1; }
function vgrad(g, x, y, w, h, stops) { const gr = g.createLinearGradient(0, y, 0, y + h); stops.forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(x, y, w, h); }
function txt(g, s, x, y, font, col, align = 'center', a = 1) { g.globalAlpha = a; g.font = font; g.fillStyle = col; g.textAlign = align; g.textBaseline = 'alphabetic'; g.fillText(s, x, y); g.globalAlpha = 1; }
function shadowOn(g, blur = 30, col = 'rgba(0,0,0,0.6)', oy = 6) { g.shadowColor = col; g.shadowBlur = blur; g.shadowOffsetY = oy; }
function shadowOff(g) { g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetY = 0; }

// ---------- painted layers: drawn once into an offscreen canvas, then reused every frame ----------
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
function putL(g, c, x = 0, y = 0) { g.drawImage(c, x, y, c.sw, c.sh); }

// parallax camera. C = { x, y, z, rot, shake, drift }: the actor-plane point at the view centre, zoom; k = layer depth.
// VIEW = the viewport the camera centres on (the full frame, or one manga panel while panels() draws it).
const VIEW = { x: W / 2, y: H / 2, s: 1 };
function camK(g, C, k = 1, t = 0) {
  const z = (1 + (C.z - 1) * k) * VIEW.s;
  const dr = C.drift ?? 1, sk = C.shake || 0;
  const dx = (noise(t * 0.45, 3) * 6 * dr + noise(t * 23, 7) * 26 * sk), dy = (noise(t * 0.4, 4) * 4 * dr + noise(t * 21, 8) * 20 * sk);
  const cx = 960 + (C.x - 960) * k + dx * k, cy = 540 + (C.y - 540) * k + dy * k;
  const r = C.rot || 0;
  if (r) { const c = Math.cos(r) * z, s = Math.sin(r) * z; g.setTransform(c, s, -s, c, VIEW.x - (c * cx - s * cy), VIEW.y - (s * cx + c * cy)); }
  else g.setTransform(z, 0, 0, z, VIEW.x - cx * z, VIEW.y - cy * z);
}

// ---------- bloom on the painted frame (before the ink pass) ----------
let BLOOM = null;
function bloom(g, amt) {
  if (amt <= 0) return;
  if (!BLOOM) { const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }; BLOOM = { a: mk(480, 270), b: mk(480, 270) }; }
  const a = BLOOM.a.getContext('2d'), b = BLOOM.b.getContext('2d');
  a.globalCompositeOperation = 'source-over'; a.filter = 'none'; a.globalAlpha = 1; a.drawImage(g.canvas, 0, 0, 480, 270);
  a.globalCompositeOperation = 'multiply'; a.drawImage(BLOOM.a, 0, 0); a.drawImage(BLOOM.a, 0, 0);
  a.globalCompositeOperation = 'source-over';
  b.clearRect(0, 0, 480, 270); b.filter = 'blur(9px)'; b.drawImage(BLOOM.a, 0, 0); b.filter = 'none';
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter'; g.globalAlpha = amt; g.drawImage(BLOOM.b, 0, 0, W, H);
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}

/* ---------- the ink shader ---------- */
const INK_VS = `#version 300 es
in vec2 p; out vec2 uv; void main(){ uv = p * 0.5 + 0.5; uv.y = 1.0 - uv.y; gl_Position = vec4(p, 0.0, 1.0); }`;
const INK_FS = `#version 300 es
precision highp float;
uniform sampler2D tex; uniform vec2 res; uniform vec3 ink, paper, tone;
uniform float pitch, edgeAmt, accent, wash, impact, toneLo, toneHi, paperAmt;
in vec2 uv; out vec4 o;
float lum(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1,0)), f.x), mix(h21(i + vec2(0,1)), h21(i + vec2(1,1)), f.x), f.y); }
void main(){
  vec2 px = uv * res;
  vec3 c = texture(tex, uv).rgb;
  float L = lum(c);
  // ink lines from hard edges (Sobel on luminance)
  vec2 d = vec2(1.3) / res;
  float a00 = lum(texture(tex, uv + d * vec2(-1,-1)).rgb), a10 = lum(texture(tex, uv + d * vec2(0,-1)).rgb), a20 = lum(texture(tex, uv + d * vec2(1,-1)).rgb);
  float a01 = lum(texture(tex, uv + d * vec2(-1, 0)).rgb), a21 = lum(texture(tex, uv + d * vec2(1, 0)).rgb);
  float a02 = lum(texture(tex, uv + d * vec2(-1, 1)).rgb), a12 = lum(texture(tex, uv + d * vec2(0, 1)).rgb), a22 = lum(texture(tex, uv + d * vec2(1, 1)).rgb);
  float gx = (a20 + 2.0 * a21 + a22) - (a00 + 2.0 * a01 + a02), gy = (a02 + 2.0 * a12 + a22) - (a00 + 2.0 * a10 + a20);
  float edge = smoothstep(0.22, 0.6, length(vec2(gx, gy))) * edgeAmt;
  // screentone: a fixed 45-degree dot grid; dot area follows darkness
  vec2 q = mat2(0.7071, -0.7071, 0.7071, 0.7071) * px / pitch;
  float dist = length(fract(q) - 0.5);
  float dark = clamp((toneHi - L) / (toneHi - toneLo), 0.0, 1.0);
  float rad = sqrt(dark) * 0.74;
  float aa = 0.9 / pitch;
  float dotm = (1.0 - smoothstep(rad - aa, rad + aa, dist)) * step(0.004, dark);
  float solid = smoothstep(toneLo + 0.02, toneLo - 0.06, L);
  float tt = max(dotm, solid);
  vec3 hue = c / max(L, 0.06);
  vec3 pap = mix(paper, paper * clamp(hue * 0.55 + 0.45, 0.0, 1.4), wash);
  vec3 mono = mix(pap, mix(tone, ink, solid), tt);
  // the two colours that survive: saturated pixels keep their colour (shaded by the dots)
  float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b));
  float sat = (mx - mn) / (mx + 0.001);
  float acc = smoothstep(0.42, 0.62, sat) * smoothstep(0.12, 0.3, mx) * accent;
  vec3 accCol = mix(min(c * 1.12, vec3(1.0)), c * 0.45, dotm * 0.6);
  vec3 col = mix(mono, accCol, acc);
  col = mix(col, ink, edge * (1.0 - acc * 0.7));
  // paper: fibres and soft blotches (fixed to the page)
  float pn = vn(px * 0.008) * 0.55 + vn(px * 0.06) * 0.3 + h21(floor(px)) * 0.15;
  col *= mix(1.0, 0.9 + 0.1 * pn, paperAmt);
  // impact frame: stark negative
  float neg = step(0.5, L);
  col = mix(col, mix(paper, ink, neg), impact);
  o = vec4(col, 1.0);
}`;
function hexRGB(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }
const INK = {
  init() {
    const c = this.c = document.createElement('canvas'); c.width = W; c.height = H;
    const gl = this.gl = c.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false });
    if (!gl) { this.ok = false; return; }
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const pr = this.pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, INK_VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, INK_FS)); gl.linkProgram(pr); gl.useProgram(pr);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.u = {}; for (const n of ['tex', 'res', 'ink', 'paper', 'tone', 'pitch', 'edgeAmt', 'accent', 'wash', 'impact', 'toneLo', 'toneHi', 'paperAmt']) this.u[n] = gl.getUniformLocation(pr, n);
    gl.viewport(0, 0, W, H); this.ok = true;
  },
  run(src, P) {
    const gl = this.gl, u = this.u;
    gl.bindTexture(gl.TEXTURE_2D, this.tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.uniform1i(u.tex, 0); gl.uniform2f(u.res, W, H);
    gl.uniform3fv(u.ink, hexRGB(P.ink || '#141218')); gl.uniform3fv(u.paper, hexRGB(P.paper || '#f1ebdd')); gl.uniform3fv(u.tone, hexRGB(P.tone || P.ink || '#141218'));
    gl.uniform1f(u.pitch, P.pitch ?? 7); gl.uniform1f(u.edgeAmt, P.edge ?? 0.9); gl.uniform1f(u.accent, P.accent ?? 1); gl.uniform1f(u.wash, P.wash ?? 0.35);
    gl.uniform1f(u.impact, P.impact || 0); gl.uniform1f(u.toneLo, P.toneLo ?? 0.14); gl.uniform1f(u.toneHi, P.toneHi ?? 0.9); gl.uniform1f(u.paperAmt, P.paperAmt ?? 1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return this.c;
  },
};

/* ---------- the player ---------- */
const SIM = {
  init() {
    this.canvas = document.getElementById('c'); this.out = this.canvas.getContext('2d');
    this.canvas.width = W; this.canvas.height = H;
    this.sc = document.createElement('canvas'); this.sc.width = W; this.sc.height = H; this.g = this.sc.getContext('2d');
    INK.init();
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
    const ov = document.getElementById('startOverlay'); if (ov) ov.addEventListener('click', (e) => { e.stopPropagation(); ov.style.display = 'none'; this.toggle(); });
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
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; shadowOff(g); g.filter = 'none';
    KEF.draw(g, t);
    g.setTransform(1, 0, 0, 1, 0, 0);
    const P = KEF.post(t);
    bloom(g, P.bloom ?? 0.35);
    const vg = g.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 1.0); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${P.vignette ?? 0.45})`); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    if (P.flash > 0) { g.fillStyle = `rgba(255,255,255,${P.flash})`; g.fillRect(0, 0, W, H); }
    const o = this.out; o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; o.globalCompositeOperation = 'source-over';
    if (INK.ok && P.ink !== false) o.drawImage(INK.run(this.sc, P), 0, 0); else o.drawImage(this.sc, 0, 0);
    if (KEF.over) KEF.over(o, t);
    KEF.hud(o, t);
    if (P.fade > 0) { o.setTransform(1, 0, 0, 1, 0, 0); o.fillStyle = `rgba(0,0,0,${P.fade})`; o.fillRect(0, 0, W, H); }
    return true;
  },
  captureFrame(t) { this.renderAt(t); return true; },
};
window.SIM = SIM;
window.addEventListener('load', () => { (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { SIM.init(); window.SIM_READY = true; }); });
