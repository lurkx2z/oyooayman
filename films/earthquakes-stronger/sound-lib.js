/* =====================================================================
   SOUND · LIB — the noise and filter generators the ambience, the effects and the score share (the ocean-rising
   film's kit, renamed), when things happen, and where the camera is. Every function here is listed in
   EQ_SOUND_FNS at the end, so the baked soundtrack's fingerprint sees a change to any of them.
   ===================================================================== */

// noise of a colour: 'white' | 'pink' | 'brown'
function eqNoise(fx, n, colour = 'white') {
  const y = fx.white(n);
  if (colour === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < n; i++) { const w = y[i]; b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898; y[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926; }
  } else if (colour === 'brown') {
    let b = 0; for (let i = 0; i < n; i++) { b = (b + 0.02 * y[i]) / 1.02; y[i] = b * 3.5; }
  }
  return y;
}
// x through a filter whose frequency follows `curve` (Hz, evenly spaced over x); coefficients updated every 32 samples
function eqSweep(x, sr, type, q, curve) {
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
const eqEv = (t, a, b) => MathX.smooth(t, a, b);                                       // 0 → 1 from a to b
const eqWn = (t, a, b, fi = 0.3, fo = 0.3) => eqEv(t, a - fi, a) * (1 - eqEv(t, b, b + fo));   // 1 inside [a, b]
// a level curve sampled once (200 Hz) and read back by linear interpolation
function eqCurve(f, hz = 200) {
  const t0 = -2, n = Math.ceil((EQ.end + 6 - t0) * hz), y = new Float32Array(n + 1);
  for (let i = 0; i <= n; i++) y[i] = f(t0 + i / hz);
  return (t) => { const x = MathX.clamp((t - t0) * hz, 0, n - 1e-6), i = Math.floor(x); return y[i] + (y[i + 1] - y[i]) * (x - i); };
}
// a noise bed from t0 to t1 through a band (lo…hi Hz), its level following lvl(t) (sampled every 10 ms); stereo
function eqBed(fx, t0, t1, colour, lo, hi, lvl, o = {}) {
  const sr = fx.sr, n = Math.max(8, Math.ceil((t1 - t0) * sr)), L = eqNoise(fx, n, colour), R = eqNoise(fx, n, colour);
  for (const x of [L, R]) { if (lo) { EQX.bq(x, 'hp', lo, 0.7, sr); EQX.bq(x, 'hp', lo, 0.7, sr); } if (hi) { EQX.bq(x, 'lp', hi, 0.7, sr); EQX.bq(x, 'lp', hi, 0.7, sr); } }
  const wv = o.wobble ? fx.wander(o.wobble) : null;
  let a = 0;
  for (let i = 0; i < n; i++) {
    if (i % 441 === 0) a = lvl(t0 + i / sr) * (wv ? 1 + (o.depth || 0.35) * wv(t0 + i / sr) : 1);
    L[i] *= a; R[i] *= a;
  }
  return [L, R];
}
// a whoosh: noise through a band-pass that rises then falls (f0 → f1 → f2) over d s, shaped by env(u); stereo with a
// pan sweep (p0 → p1)
function eqWhoosh(fx, d, f0, f1, f2, o = {}) {
  const sr = fx.sr, n = Math.ceil(d * sr), x = eqNoise(fx, n, o.colour || 'pink'), pk = o.peak ?? 0.55;
  const curve = []; for (let k = 0; k <= 32; k++) { const u = k / 32; curve.push(u < pk ? f0 * Math.pow(f1 / f0, u / pk) : f1 * Math.pow(f2 / f1, (u - pk) / (1 - pk))); }
  const y = eqSweep(x, sr, 'bandpass', o.q || 1.1, curve), L = new Float32Array(n), R = new Float32Array(n);
  const env = o.env || ((u) => Math.pow(Math.sin(Math.PI * Math.pow(u, Math.log(0.5) / Math.log(pk))), 1.6));
  for (let i = 0; i < n; i++) { const u = i / n, p = (o.p0 || 0) + ((o.p1 || 0) - (o.p0 || 0)) * u, a = (p + 1) * Math.PI / 4, e = env(u) * 2.2; L[i] = y[i] * e * Math.cos(a); R[i] = y[i] * e * Math.sin(a); }
  return [L, R];
}
// a low thump: a sine falling from f0 to f1 over its decay, with a click on top
function eqThump(fx, f0, f1, dk, o = {}) {
  const sr = fx.sr, n = Math.ceil(dk * 6 * sr), y = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / sr, f = f1 + (f0 - f1) * Math.exp(-t / (dk * 0.6)); ph += 2 * Math.PI * f / sr; y[i] = Math.sin(ph) * Math.exp(-t / dk) * Math.min(1, t / 0.003); }
  if (o.click) { const c = fx.white(Math.round(0.012 * sr)); EQX.bq(c, 'lp', o.clickHz || 2500, 0.7, sr); for (let i = 0; i < c.length; i++) y[i] += c[i] * o.click * Math.exp(-i / (0.003 * sr)); }
  return y;
}
// a sonic boom heard from the ground: the N-wave's two sharp cracks (a gap apart), then the rumble of the street
function eqBoom(fx, o = {}) {
  const sr = fx.sr, len = o.len || 4.5, L = fx.arr(len), R = fx.arr(len), gap = o.gap || 0.12;
  for (const [t0, a] of [[0, 1], [gap, 0.85]]) {
    const n = Math.round(0.05 * sr), z = eqNoise(fx, n, 'pink');
    for (let i = 0; i < n; i++) z[i] *= Math.exp(-i / (0.008 * sr));
    const th = eqThump(fx, 70, 32, 0.18);
    for (let i = 0; i < n; i++) th[i] += z[i] * 1.4;
    EQX.mixIn(L, R, th, Math.round(t0 * sr), a, 0);
  }
  const [rl, rr] = eqBed(fx, 0, len, 'brown', 25, 260, (t) => Math.exp(-t / (o.tail || 1.1)) * Math.min(1, t / 0.02) * 1.6);
  for (let i = 0; i < rl.length; i++) { L[i] += rl[i]; R[i] += rr[i]; }
  return [L, R];
}
// a crowd gasping (a handful of people, staggered); o.n people, o.spread s
function eqGasp(fx, o = {}) {
  const sr = fx.sr, n = o.n || 6, len = (o.spread || 0.35) + 1.2, L = fx.arr(len), R = fx.arr(len), r = fx.r;
  for (let k = 0; k < n; k++) {
    const g = fx.breath(r.range(0.35, 0.6), { inhale: true, voice: r.range(0.2, 0.5), f0: r.range(170, 300) });
    EQX.mixIn(L, R, g, Math.round(r.range(0, o.spread || 0.35) * sr), r.range(0.5, 1), r.range(-0.8, 0.8));
  }
  return [L, R];
}
// a car alarm: two tones alternating (or a whoop), for d s
function eqAlarm(fx, d, o = {}) {
  const sr = fx.sr, n = Math.ceil(d * sr), y = new Float32Array(n), f1 = o.f1 || 900, f2 = o.f2 || 1250, per = o.per || 0.42;
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr, k = Math.floor(t / per) % 2, f = o.whoop ? f1 + (f2 - f1) * ((t % per) / per) : k ? f2 : f1;
    ph += 2 * Math.PI * f / sr; y[i] = (Math.sin(ph) > 0 ? 1 : -1) * 0.5 + Math.sin(ph) * 0.5;
  }
  EQX.bq(y, 'lp', 3200, 0.7, sr); EQX.bq(y, 'hp', 400, 0.7, sr);
  for (let i = 0; i < n; i++) y[i] *= Math.min(1, i / (0.02 * sr), (n - i) / (0.05 * sr));
  return y;
}
const eqMidiN = (n) => eqMidi(n);

// ---- where the camera is ------------------------------------------------------------------------------------------
//   street   on your street and the streets near it (A1 … N7)
//   fast     over New York at speed (P1 … V4): the wind of your wake
//   sky      the meteor, New England, the climb (the sky set)
//   boston   the Esplanade in Boston
//   space    the space set
//   home     back on Earth, later: the evening, the posters, the future street (Z8, ZF, AB)
//   deep     the deep set
function eqWhere(sh) {
  if (sh.set === 'space') return 'space';
  if (sh.set === 'deep') return 'deep';
  if (sh.set === 'sky') return 'sky';
  if (sh.set === 'bos') return 'boston';
  if (['evening', 'poster', 'future'].includes(sh.mode)) return 'home';
  const i = EQ_SHOTS.findIndex((s) => s.id === 'P1'), j = EQ_SHOTS.indexOf(sh);
  return j >= i ? 'fast' : 'street';
}
function eqPlaces() {
  if (eqPlaces._c) return eqPlaces._c;
  return (eqPlaces._c = EQ_SHOTS.map((sh) => ({ t0: Math.max(-2, sh.t0), t1: Math.min(sh.t1, EQ.end + 5), where: eqWhere(sh), shot: sh })));
}
// 0…1 over the shots at the given places, with a short crossfade at each cut
function eqPlaceAt(where, xf = 0.05) {
  const ws = [].concat(where), W = eqPlaces().filter((p) => ws.includes(p.where)).map((p) => [p.t0, p.t1]);
  return (t) => { let v = 0; for (const [a, b] of W) v += eqWn(t, a, b, xf, xf); return Math.min(1, v); };
}
const eqShotOf = (mode) => EQ_SHOTS.find((s) => s.mode === mode);
// when you pass things in space (the space set's EQ_ON), and Andromeda
const eqPassOf = (k) => eqPassT(EQ_ON[k][0]);

const EQ_SOUND_FNS = [eqEv, eqWn, eqNoise, eqSweep, eqCurve, eqBed, eqWhoosh, eqThump, eqBoom, eqGasp, eqAlarm, eqMidiN, eqWhere, eqPlaces, eqPlaceAt, eqShotOf, eqPassOf];
