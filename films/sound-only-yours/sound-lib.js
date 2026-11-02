/* =====================================================================
   SOUND · LIB — the noise and filter generators the ambience and effects share (from the gravity films' sound kit),
   where you are (your kitchen, at the open window, the stairwell, the street, the park, the dark under the trees: each
   has its own acoustics, and only your sounds light them up), and your voice lines (voices.js) as sample arrays.
   Every function here is listed in SO_SOUND_FNS at the end, so the baked soundtrack's fingerprint sees a change.
   ===================================================================== */

// ---- shared generators -------------------------------------------------------------------------------------------
// noise of a colour: 'white' | 'pink' | 'brown'
function soNoise(fx, n, colour = 'white') {
  const y = fx.white(n);
  if (colour === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < n; i++) { const w = y[i]; b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898; y[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926; }
  } else if (colour === 'brown') {
    let b = 0; for (let i = 0; i < n; i++) { b = (b + 0.02 * y[i]) / 1.02; y[i] = b * 3.5; }
  }
  return y;
}
// a stereo bed of filtered noise from t0 to t1. o: colour, f: [[type, f, q, db]], env(u, t) level (t = film time),
// am: depth of a slow random flutter (wr its rate), vol (peak), fi/fo fades, room/wet, mono+pan
function soBed(K, t0, t1, o = {}) {
  const { fx, sr } = K, d = t1 - t0; if (d <= 0.02) return;
  const n = Math.ceil(d * sr), fi = o.fi ?? 0.04, fo = o.fo ?? 0.04;
  const mk = () => {
    const y = soNoise(fx, n, o.colour || 'pink');
    for (const f of (o.f || [])) SOX.bq(y, f[0], f[1], f[2] || 0.7, sr, f[3] || 0);
    const w = fx.wander(o.wr || 0.35);
    for (let i = 0; i < n; i++) { const t = i / sr; y[i] *= (o.env ? o.env(t / d, t0 + t) : 1) * Math.min(1, t / fi, (d - t) / fo) * (1 + (o.am || 0) * w(t)); }
    return y;
  };
  if (o.mono) return K.put(mk(), t0, { vol: o.vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
  return K.putLR(mk(), mk(), t0, { vol: o.vol, norm: true, room: o.room, wet: o.wet });
}
// a tone with harmonics (hum, horn, motor): f(t) the pitch over the event (t from 0), harm [[k, a]], env(u)
function soTone(K, t0, d, f, harm, env, o = {}) {
  const { fx, sr } = K, n = Math.ceil(d * sr), y = fx.arr(d);
  const F = typeof f === 'function' ? f : () => f, ph = harm.map(() => fx.r.range(0, 6.283));
  for (let i = 0; i < n; i++) {
    const t = i / sr, fr = F(t), e = env ? env(t / d, t) : Math.min(1, t / 0.05, (d - t) / 0.05);
    let v = 0; for (let k = 0; k < harm.length; k++) { ph[k] += 2 * Math.PI * fr * harm[k][0] / sr; v += harm[k][1] * Math.sin(ph[k]); }
    y[i] = v * e;
  }
  for (const fl of (o.f || [])) SOX.bq(y, fl[0], fl[1], fl[2] || 0.7, sr, fl[3] || 0);
  return K.put(y, t0, { vol: o.vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
}
// an electric fizz: dense crackle with random sizes, o.env(u) shapes it, o.rate (clicks/s), o.hp
function soCrackle(fx, d, o = {}) {
  const sr = fx.sr, r = fx.r, y = fx.arr(d + 0.02), n = Math.ceil(d * sr);
  for (let i = 0; i < n; i++) { const u = i / n; if (r.next() < (o.rate || 300) * (o.env ? o.env(u) : 1) / sr) { const a = Math.pow(r.next(), 3), L = r.int(8, 60); for (let k = 0; k < L && i + k < y.length; k++) y[i + k] += a * (r.next() * 2 - 1) * Math.exp(-k / (L * 0.3)); } }
  SOX.bq(y, 'hp', o.hp || 1500, 0.7, sr);
  return y;
}

// play x at t through a filter whose frequency follows curve (Hz, evenly spaced over x's length). The filter runs
// here (a biquad whose coefficients follow the curve every 32 samples), so the level is set from what comes OUT of it
function soSweep(x, sr, type, q, curve) {
  const y = new Float32Array(x.length), B = 32, T = { lowpass: 'lp', highpass: 'hp', bandpass: 'bp' }[type] || type;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0, b0, b1, b2, a1, a2;
  for (let i0 = 0; i0 < x.length; i0 += B) {
    const u = i0 / Math.max(1, x.length - 1) * (curve.length - 1), j = Math.min(curve.length - 2, Math.floor(u)), f = curve[j] + (curve[j + 1] - curve[j]) * (u - j);
    const w = 2 * Math.PI * Math.min(f, sr * 0.45) / sr, cs = Math.cos(w), al = Math.sin(w) / (2 * q), a0 = 1 + al;
    if (T === 'lp') { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = b0; } else if (T === 'hp') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = b0; } else { b0 = al; b1 = 0; b2 = -al; }
    b0 /= a0; b1 /= a0; b2 /= a0; a1 = -2 * cs / a0; a2 = (1 - al) / a0;
    for (let i = i0; i < Math.min(x.length, i0 + B); i++) { const xi = x[i], v = b0 * xi + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = xi; y2 = y1; y1 = v; y[i] = v; }
  }
  return y;
}
function soSweepPut(K, x, t, type, q, curve, o = {}) {
  return K.put(soSweep(x, K.sr, type, q, curve), t, { vol: (o.vol ?? 1) * (o.gain || 1), norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
}

const soEv = (t, a, b) => MathX.smooth(t, a, b);                                       // 0 → 1 from a to b
const soWn = (t, a, b, fi = 0.3, fo = 0.3) => soEv(t, a - fi, a) * (1 - soEv(t, b, b + fo));   // 1 inside [a, b]
function soAddAt(dst, src, t, g, sr) { const i0 = Math.round(t * sr); for (let i = 0; i < src.length && i0 + i < dst.length; i++) if (i0 + i >= 0) dst[i0 + i] += src[i] * g; }
// a level curve sampled once (200 Hz) and read back by linear interpolation: the beds read their envelopes per sample
function soCurve(f, hz = 200) {
  const t0 = -2, n = Math.ceil((SO.end + 6 - t0) * hz), y = new Float32Array(n + 1);
  for (let i = 0; i <= n; i++) y[i] = f(t0 + i / hz);
  return (t) => { const x = MathX.clamp((t - t0) * hz, 0, n - 1e-6), i = Math.floor(x); return y[i] + (y[i + 1] - y[i]) * (x - i); };
}

// ---- where you are ------------------------------------------------------------------------------------------------
const SO_PLACE = {
  in: ['title', 'what', 'start', 'hello', 'room', 'clap', 'rule', 'body', 'ring', 'mum', 'text'],
  win: ['window', 'faces'],
  stair: ['stairs', 'behind'],
  street: ['street', 'car', 'warn', 'heads', 'storm'],
  park: ['park', 'bats', 'shout', 'far', 'coming'],
  dark: ['hide', 'dog', 'echo', 'who', 'question'],
};
function soWhereShot(sh) { if (sh.where) return sh.where; for (const [k, L] of Object.entries(SO_PLACE)) if (L.includes(sh.mode)) return k; throw new Error('SO_PLACE: no place for ' + sh.mode); }
// the film as places: [{ t0, t1, where, shot }] in order
function soPlaces() {
  if (soPlaces._c) return soPlaces._c;
  return (soPlaces._c = SO_SHOTS.map((sh) => ({ t0: Math.max(-2, sh.t0), t1: Math.min(sh.t1, SO.end + 5), where: soWhereShot(sh), shot: sh })));
}
const soPlaceOf = (t) => soWhereShot(soShotAt(t));
// 0…1 over the shots at a place, with a short crossfade at each cut
function soPlaceAt(where, xf = 0.05) {
  const W = soPlaces().filter((p) => p.where === where).map((p) => [p.t0, p.t1]);
  return (t) => { let v = 0; for (const [a, b] of W) v += soWn(t, a, b, xf, xf); return Math.min(1, v); };
}

// ---- a pre-mixer for one-shot sounds ------------------------------------------------------------------------------
// Thousands of tiny events (steps, breaths, heartbeats, echoes) as separate Web Audio nodes make the offline render
// crawl (every node is visited every 128 samples). So they are mixed here, in plain arrays, into 4-second stereo
// chunks per destination (the stem's bus, or a room's reverb input), and each chunk is played by one node. Same maths
// as the kit's put: o.vol (with o.norm: the sound's peak), o.pan (equal power, as a StereoPannerNode), o.lp / o.hp
// (a 2nd-order filter), o.room + o.wet (a send to that room's reverb).
function soMixer(K) {
  const sr = K.sr, CH = Math.round(4 * sr), dests = new Map();
  const chunk = (node, k) => { let D = dests.get(node); if (!D) dests.set(node, (D = new Map())); let c = D.get(k); if (!c) D.set(k, (c = [new Float32Array(CH), new Float32Array(CH)])); return c; };
  const add = (node, x, i0, gL, gR) => { let i = Math.max(0, -i0); while (i < x.length) { const j = i0 + i, k = Math.floor(j / CH), c = chunk(node, k), o = j - k * CH, n = Math.min(x.length - i, CH - o);
    const L = c[0], R = c[1]; for (let q = 0; q < n; q++) { const v = x[i + q]; L[o + q] += v * gL; R[o + q] += v * gR; } i += n; } };
  return {
    put(x, t, o = {}) {
      let v = o.vol == null ? 1 : o.vol;
      if (o.norm) { const pk = SOX.peak(x); if (pk > 1e-9) v /= pk; }
      if (o.lp || o.hp) { x = Float32Array.from(x); if (o.lp) SOX.bq(x, 'lp', o.lp, 0.707, sr); if (o.hp) SOX.bq(x, 'hp', o.hp, 0.707, sr); }
      const u = ((o.pan || 0) + 1) / 2, gL = Math.cos(u * Math.PI / 2) * v, gR = Math.sin(u * Math.PI / 2) * v, i0 = Math.round(t * sr);
      add(K.bus, x, i0, gL, gR);
      if (o.room) add(o.room, x, i0, gL * (o.wet ?? 1), gR * (o.wet ?? 1));
    },
    flush() {
      for (const [node, D] of dests) for (const [k, c] of D) {
        const b = K.ctx.createBuffer(2, CH, sr); b.getChannelData(0).set(c[0]); b.getChannelData(1).set(c[1]);
        const s = K.ctx.createBufferSource(); s.buffer = b; s.connect(node); s.start(k * CH / sr);
      }
      dests.clear();
    },
  };
}

// ---- your voice ---------------------------------------------------------------------------------------------------
// a line from voices.js as samples at the context's rate: 16-bit PCM decoded, brought to its loudness target (g dB),
// resampled from 24 kHz by a windowed sinc (16 taps a side), so the result doesn't depend on a browser's resampler
function soVoiceBuf(fx, id) {
  const key = 'voice:' + id; if (fx.cache[key]) return fx.cache[key];
  const V = (window.SO_VOICES || {})[id]; if (!V) throw new Error('voices.js has no line ' + id);
  const bin = atob(V.b64), n = V.n, x = new Float32Array(n), gain = Math.pow(10, V.g / 20);
  for (let i = 0; i < n; i++) { let v = bin.charCodeAt(2 * i) | (bin.charCodeAt(2 * i + 1) << 8); if (v >= 32768) v -= 65536; x[i] = v / 32768 * gain; }
  const sr = fx.sr, ratio = V.sr / sr, m = Math.ceil(n / ratio), y = new Float32Array(m), T = 16, fc = Math.min(1, 1 / ratio) * 0.94;
  for (let j = 0; j < m; j++) {
    const p = j * ratio, i0 = Math.floor(p); let v = 0;
    for (let k = i0 - T + 1; k <= i0 + T; k++) { if (k < 0 || k >= n) continue; const d = p - k, a = Math.PI * d * fc, s = Math.abs(a) < 1e-9 ? 1 : Math.sin(a) / a, w = 0.5 + 0.5 * Math.cos(Math.PI * d / T); v += x[k] * s * w * fc; }
    y[j] = v;
  }
  return (fx.cache[key] = y);
}
const SO_SOUND_FNS = [soMixer, soNoise, soBed, soTone, soCrackle, soSweep, soSweepPut, soAddAt, soPlaceAt, soPlaceOf, soCurve, soWhereShot, soPlaces, soVoiceBuf, soEv, soWn];
