/* =====================================================================
   SOUND · LIB — the noise and filter generators the ambience and effects share (from the Slower light film, renamed
   tf*), and this film's own helpers. Every function here is listed in TF_SOUND_FNS at the end, so the baked
   soundtrack's fingerprint sees a change to any of them.
   ===================================================================== */

// ---- shared generators -------------------------------------------------------------------------------------------
// noise of a colour: 'white' | 'pink' | 'brown'
function tfNoise(fx, n, colour = 'white') {
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
function tfBed(K, t0, t1, o = {}) {
  const { fx, sr } = K, d = t1 - t0; if (d <= 0.02) return;
  const n = Math.ceil(d * sr), fi = o.fi ?? 0.04, fo = o.fo ?? 0.04;
  const mk = () => {
    const y = tfNoise(fx, n, o.colour || 'pink');
    for (const f of (o.f || [])) TFX.bq(y, f[0], f[1], f[2] || 0.7, sr, f[3] || 0);
    const w = fx.wander(o.wr || 0.35);
    for (let i = 0; i < n; i++) { const t = i / sr; y[i] *= (o.env ? o.env(t / d, t0 + t) : 1) * Math.min(1, t / fi, (d - t) / fo) * (1 + (o.am || 0) * w(t)); }
    return y;
  };
  if (o.mono) return K.put(mk(), t0, { vol: o.vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
  return K.putLR(mk(), mk(), t0, { vol: o.vol, norm: true, room: o.room, wet: o.wet });
}
// a tone with harmonics (hum, horn, motor): f(t) the pitch over the event (t from 0), harm [[k, a]], env(u)
function tfTone(K, t0, d, f, harm, env, o = {}) {
  const { fx, sr } = K, n = Math.ceil(d * sr), y = fx.arr(d);
  const F = typeof f === 'function' ? f : () => f, ph = harm.map(() => fx.r.range(0, 6.283));
  for (let i = 0; i < n; i++) {
    const t = i / sr, fr = F(t), e = env ? env(t / d, t) : Math.min(1, t / 0.05, (d - t) / 0.05);
    let v = 0; for (let k = 0; k < harm.length; k++) { ph[k] += 2 * Math.PI * fr * harm[k][0] / sr; v += harm[k][1] * Math.sin(ph[k]); }
    y[i] = v * e;
  }
  for (const fl of (o.f || [])) TFX.bq(y, fl[0], fl[1], fl[2] || 0.7, sr, fl[3] || 0);
  return K.put(y, t0, { vol: o.vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
}
// a bird: a quick chirp phrase (FM sine sweeps), o.f0 base pitch, o.n notes
function tfChirp(fx, o = {}) {
  const sr = fx.sr, r = fx.r, notes = o.n || r.int(2, 6), f0 = o.f0 || r.range(2400, 4200), gap = o.gap || r.range(0.05, 0.12), nd = o.nd || r.range(0.04, 0.09);
  const y = fx.arr(notes * (nd + gap) + 0.05); let ph = 0;
  const shape = r.int(0, 2);
  for (let k = 0; k < notes; k++) {
    const i0 = Math.round(k * (nd + gap) * sr), n = Math.round(nd * sr), fa = f0 * r.range(0.9, 1.15), fb = fa * (shape === 0 ? 1.4 : shape === 1 ? 0.7 : r.range(0.85, 1.3));
    for (let i = 0; i < n; i++) { const u = i / n, f = fa + (fb - fa) * u + 120 * Math.sin(2 * Math.PI * 38 * i / sr); ph += 2 * Math.PI * f / sr; y[i0 + i] += Math.sin(ph) * Math.sin(Math.PI * u) * (0.8 + 0.2 * Math.sin(ph * 2)); }
  }
  return y;
}
// an electric fizz: dense crackle with random sizes, o.env(u) shapes it, o.rate (clicks/s), o.hp
function tfCrackle(fx, d, o = {}) {
  const sr = fx.sr, r = fx.r, y = fx.arr(d + 0.02), n = Math.ceil(d * sr);
  for (let i = 0; i < n; i++) { const u = i / n; if (r.next() < (o.rate || 300) * (o.env ? o.env(u) : 1) / sr) { const a = Math.pow(r.next(), 3), L = r.int(8, 60); for (let k = 0; k < L && i + k < y.length; k++) y[i + k] += a * (r.next() * 2 - 1) * Math.exp(-k / (L * 0.3)); } }
  TFX.bq(y, 'hp', o.hp || 1500, 0.7, sr);
  return y;
}

// play x at t through a filter whose frequency follows curve (Hz, evenly spaced over x's length). The filter runs
// here (a biquad whose coefficients follow the curve every 32 samples), so the level is set from what comes OUT of it
function tfSweep(x, sr, type, q, curve) {
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
function tfSweepPut(K, x, t, type, q, curve, o = {}) {
  return K.put(tfSweep(x, K.sr, type, q, curve), t, { vol: (o.vol ?? 1) * (o.gain || 1), norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
}

const tfEv = (t, a, b) => MathX.smooth(t, a, b);                                       // 0 → 1 from a to b
const tfWn = (t, a, b, fi = 0.3, fo = 0.3) => tfEv(t, a - fi, a) * (1 - tfEv(t, b, b + fo));   // 1 inside [a, b]
function tfAddAt(dst, src, t, g, sr) { const i0 = Math.round(t * sr); for (let i = 0; i < src.length && i0 + i < dst.length; i++) if (i0 + i >= 0) dst[i0 + i] += src[i] * g; }

// ---- this film's own ------------------------------------------------------------------------------------------
// where the picture is: 0…1 over the shots that match pred (s → bool), with a short crossfade at each cut
function tfPlace(pred, xf = 0.06) {
  const W = TF_SHOTS.filter(pred).map((s) => [Math.max(-2, s.t0), Math.min(s.t1, TF.end + 5)]);
  return (t) => { let v = 0; for (const [a, b] of W) v += tfWn(t, a, b, xf, xf); return Math.min(1, v); };
}
// a level curve sampled once (200 Hz) and read back by linear interpolation: the beds read their envelopes per sample
function tfCurve(f, hz = 200) {
  const t0 = -2, n = Math.ceil((TF.end + 6 - t0) * hz), y = new Float32Array(n + 1);
  for (let i = 0; i <= n; i++) y[i] = f(t0 + i / hz);
  return (t) => { const x = MathX.clamp((t - t0) * hz, 0, n - 1e-6), i = Math.floor(x); return y[i] + (y[i + 1] - y[i]) * (x - i); };
}
// a cricket's chirp: three to five quick pulses of a ~4.6 kHz tone (o.f, o.n, o.pd pulse length, o.gap)
function tfCricket(fx, o = {}) {
  const sr = fx.sr, r = fx.r, f = o.f || r.range(4300, 4900), N = o.n || r.int(3, 5), pd = o.pd || 0.016, gap = o.gap || 0.011;
  const y = fx.arr(N * (pd + gap) + 0.03); let ph = 0;
  for (let k = 0; k < N; k++) { const i0 = Math.round(k * (pd + gap) * sr), n = Math.round(pd * sr); for (let i = 0; i < n; i++) { const u = i / n; ph += 2 * Math.PI * f * (1 + 0.01 * u) / sr; y[i0 + i] += Math.sin(ph) * Math.pow(Math.sin(Math.PI * u), 0.7) * (1 + 0.25 * Math.sin(ph * 2)); } }
  return y;
}
// a cat's voice ("mrrp", "miaow"): glottal pulses at f0(u) through two formants that open and close (o.d length,
// o.f0 [start, peak, end], o.open: how wide the mouth gets, o.thin: a little more breath than voice)
function tfMeow(fx, o = {}) {
  const sr = fx.sr, r = fx.r, d = o.d || 0.7, n = Math.ceil(d * sr), F = o.f0 || [480, 720, 420], src = new Float32Array(n);
  let ph = 0; const wv = fx.wander(6);
  for (let i = 0; i < n; i++) { const u = i / n, f = u < 0.35 ? F[0] + (F[1] - F[0]) * Math.sin(u / 0.35 * Math.PI / 2) : F[1] + (F[2] - F[1]) * Math.pow((u - 0.35) / 0.65, 1.3); ph += f * (1 + 0.015 * wv(i / sr)) / sr; if (ph >= 1) { ph -= 1; src[i] = 1; } src[i] += (o.thin || 0.08) * (r.next() * 2 - 1); }
  const op = o.open || 1, mouth = (u) => Math.sin(Math.PI * Math.min(1, u * 1.15)) * op;
  const a = tfSweep(src, sr, 'bandpass', 5, Array.from({ length: 16 }, (_, k) => 650 + 900 * mouth(k / 15)));
  const b = tfSweep(src, sr, 'bandpass', 7, Array.from({ length: 16 }, (_, k) => 1700 + 1300 * mouth(k / 15)));
  const y = fx.arr(d + 0.02); for (let i = 0; i < n; i++) { const u = i / n; y[i] = (a[i] + 0.6 * b[i]) * Math.min(1, u / 0.06) * Math.pow(1 - u, 0.6); }
  return y;
}

const TF_SOUND_FNS = [tfNoise, tfBed, tfTone, tfChirp, tfCrackle, tfSweep, tfSweepPut, tfEv, tfWn, tfAddAt, tfPlace, tfCurve, tfCricket, tfMeow];
