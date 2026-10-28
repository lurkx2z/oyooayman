/* =====================================================================
   SOUND · LIB — the noise and filter generators the ambience and effects share (from the Slower sound film, renamed
   lb*), and a few creatures (a cricket, a tawny owl, the cat, the birds). Every function here is listed in
   FZ_SOUND_FNS at the end, so the baked soundtrack's fingerprint sees a change to any of them.
   ===================================================================== */

// ---- shared generators -------------------------------------------------------------------------------------------
// noise of a colour: 'white' | 'pink' | 'brown'
function fzNoise(fx, n, colour = 'white') {
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
function fzBed(K, t0, t1, o = {}) {
  const { fx, sr } = K, d = t1 - t0; if (d <= 0.02) return;
  const n = Math.ceil(d * sr), fi = o.fi ?? 0.04, fo = o.fo ?? 0.04;
  const mk = () => {
    const y = fzNoise(fx, n, o.colour || 'pink');
    for (const f of (o.f || [])) FZX.bq(y, f[0], f[1], f[2] || 0.7, sr, f[3] || 0);
    const w = fx.wander(o.wr || 0.35);
    for (let i = 0; i < n; i++) { const t = i / sr; y[i] *= (o.env ? o.env(t / d, t0 + t) : 1) * Math.min(1, t / fi, (d - t) / fo) * (1 + (o.am || 0) * w(t)); }
    return y;
  };
  if (o.mono) return K.put(mk(), t0, { vol: o.vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
  return K.putLR(mk(), mk(), t0, { vol: o.vol, norm: true, room: o.room, wet: o.wet });
}
// a tone with harmonics (hum, horn, motor): f(t) the pitch over the event (t from 0), harm [[k, a]], env(u)
function fzTone(K, t0, d, f, harm, env, o = {}) {
  const { fx, sr } = K, n = Math.ceil(d * sr), y = fx.arr(d);
  const F = typeof f === 'function' ? f : () => f, ph = harm.map(() => fx.r.range(0, 6.283));
  for (let i = 0; i < n; i++) {
    const t = i / sr, fr = F(t), e = env ? env(t / d, t) : Math.min(1, t / 0.05, (d - t) / 0.05);
    let v = 0; for (let k = 0; k < harm.length; k++) { ph[k] += 2 * Math.PI * fr * harm[k][0] / sr; v += harm[k][1] * Math.sin(ph[k]); }
    y[i] = v * e;
  }
  for (const fl of (o.f || [])) FZX.bq(y, fl[0], fl[1], fl[2] || 0.7, sr, fl[3] || 0);
  return K.put(y, t0, { vol: o.vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
}
// a bird: a quick chirp phrase (FM sine sweeps), o.f0 base pitch, o.n notes
function fzChirp(fx, o = {}) {
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
function fzCrackle(fx, d, o = {}) {
  const sr = fx.sr, r = fx.r, y = fx.arr(d + 0.02), n = Math.ceil(d * sr);
  for (let i = 0; i < n; i++) { const u = i / n; if (r.next() < (o.rate || 300) * (o.env ? o.env(u) : 1) / sr) { const a = Math.pow(r.next(), 3), L = r.int(8, 60); for (let k = 0; k < L && i + k < y.length; k++) y[i + k] += a * (r.next() * 2 - 1) * Math.exp(-k / (L * 0.3)); } }
  FZX.bq(y, 'hp', o.hp || 1500, 0.7, sr);
  return y;
}

// play x at t through a filter whose frequency follows curve (Hz, evenly spaced over x's length). The filter runs
// here (a biquad whose coefficients follow the curve every 32 samples), so the level is set from what comes OUT of it
function fzSweep(x, sr, type, q, curve) {
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
function fzSweepPut(K, x, t, type, q, curve, o = {}) {
  return K.put(fzSweep(x, K.sr, type, q, curve), t, { vol: (o.vol ?? 1) * (o.gain || 1), norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
}

const fzEv = (t, a, b) => MathX.smooth(t, a, b);                                       // 0 → 1 from a to b
const fzWn = (t, a, b, fi = 0.3, fo = 0.3) => fzEv(t, a - fi, a) * (1 - fzEv(t, b, b + fo));   // 1 inside [a, b]
function fzAddAt(dst, src, t, g, sr) { const i0 = Math.round(t * sr); for (let i = 0; i < src.length && i0 + i < dst.length; i++) if (i0 + i >= 0) dst[i0 + i] += src[i] * g; }

// ---- this film's own ------------------------------------------------------------------------------------------
// where the picture is: 0…1 over the shots that match pred (s → bool), with a short crossfade at each cut
function fzPlace(pred, xf = 0.06) {
  const W = FZ_SHOTS.filter(pred).map((s) => [Math.max(-2, s.t0), Math.min(s.t1, FZ.end + 5)]);
  return (t) => { let v = 0; for (const [a, b] of W) v += fzWn(t, a, b, xf, xf); return Math.min(1, v); };
}
// a level curve sampled once (200 Hz) and read back by linear interpolation: the beds read their envelopes per sample
function fzCurve(f, hz = 200) {
  const t0 = -2, n = Math.ceil((FZ.end + 6 - t0) * hz), y = new Float32Array(n + 1);
  for (let i = 0; i <= n; i++) y[i] = f(t0 + i / hz);
  return (t) => { const x = MathX.clamp((t - t0) * hz, 0, n - 1e-6), i = Math.floor(x); return y[i] + (y[i + 1] - y[i]) * (x - i); };
}
// a cricket's chirp: three to five quick pulses of a ~4.6 kHz tone (o.f, o.n, o.pd pulse length, o.gap)
function fzCricket(fx, o = {}) {
  const sr = fx.sr, r = fx.r, f = o.f || r.range(4300, 4900), N = o.n || r.int(3, 5), pd = o.pd || 0.016, gap = o.gap || 0.011;
  const y = fx.arr(N * (pd + gap) + 0.03); let ph = 0;
  for (let k = 0; k < N; k++) { const i0 = Math.round(k * (pd + gap) * sr), n = Math.round(pd * sr); for (let i = 0; i < n; i++) { const u = i / n; ph += 2 * Math.PI * f * (1 + 0.01 * u) / sr; y[i0 + i] += Math.sin(ph) * Math.pow(Math.sin(Math.PI * u), 0.7) * (1 + 0.25 * Math.sin(ph * 2)); } }
  return y;
}
// a tawny owl's hoot: "hoo … hoo-hoo-hoooo", a breathy, wavering low whistle (o.f around 600 Hz)
function fzOwl(fx, o = {}) {
  const sr = fx.sr, r = fx.r, f0 = o.f || r.range(560, 640), parts = [[0, 0.55, 1], [1.4, 0.12, 0.6], [1.62, 0.12, 0.65], [1.85, 1.1, 0.9]];
  const y = fx.arr(3.2), air = fzNoise(fx, y.length, 'pink'); FZX.bq(air, 'bp', f0 * 1.1, 2.5, sr);
  for (const [t0, d, a] of parts) { const i0 = Math.round(t0 * sr), n = Math.round(d * sr); let ph = r.range(0, 6); for (let i = 0; i < n; i++) { const u = i / n, f = f0 * (1 + 0.04 * Math.sin(Math.PI * u) - 0.06 * u + 0.012 * Math.sin(2 * Math.PI * 7 * i / sr)); ph += 2 * Math.PI * f / sr; const e = Math.min(1, u / 0.15) * Math.pow(1 - u, 0.8); y[i0 + i] += a * e * (Math.sin(ph) + 0.12 * Math.sin(2 * ph) + 0.6 * air[i0 + i]); } }
  return y;
}
// a cat's voice ("mrrp", "miaow"): glottal pulses at f0(u) through two formants that open and close (o.d length,
// o.f0 [start, peak, end], o.open: how wide the mouth gets, o.thin: a little more breath than voice)
function fzMeow(fx, o = {}) {
  const sr = fx.sr, r = fx.r, d = o.d || 0.7, n = Math.ceil(d * sr), F = o.f0 || [480, 720, 420], src = new Float32Array(n);
  let ph = 0; const wv = fx.wander(6);
  for (let i = 0; i < n; i++) { const u = i / n, f = u < 0.35 ? F[0] + (F[1] - F[0]) * Math.sin(u / 0.35 * Math.PI / 2) : F[1] + (F[2] - F[1]) * Math.pow((u - 0.35) / 0.65, 1.3); ph += f * (1 + 0.015 * wv(i / sr)) / sr; if (ph >= 1) { ph -= 1; src[i] = 1; } src[i] += (o.thin || 0.08) * (r.next() * 2 - 1); }
  const op = o.open || 1, mouth = (u) => Math.sin(Math.PI * Math.min(1, u * 1.15)) * op;
  const a = fzSweep(src, sr, 'bandpass', 5, Array.from({ length: 16 }, (_, k) => 650 + 900 * mouth(k / 15)));
  const b = fzSweep(src, sr, 'bandpass', 7, Array.from({ length: 16 }, (_, k) => 1700 + 1300 * mouth(k / 15)));
  const y = fx.arr(d + 0.02); for (let i = 0; i < n; i++) { const u = i / n; y[i] = (a[i] + 0.6 * b[i]) * Math.min(1, u / 0.06) * Math.pow(1 - u, 0.6); }
  return y;
}


// ---- this film's creatures and crowd -----------------------------------------------------------------------------
// a robin's song: a thin, liquid, quick phrase of 8–15 notes leaping about between ~2.6 and 7 kHz, some of them trilled
function fzRobinSong(fx, o = {}) {
  const sr = fx.sr, r = fx.r, N = o.n || r.int(8, 15), y = fx.arr(N * 0.17 + 0.1); let t = 0, ph = 0;
  for (let k = 0; k < N; k++) {
    const nd = r.range(0.035, 0.11), fa = r.range(2600, 7000) * (o.p || 1), fb = fa * r.range(0.75, 1.3), tr = r.next() < 0.35 ? r.range(40, 90) : 0;
    const i0 = Math.round(t * sr), n = Math.round(nd * sr);
    for (let i = 0; i < n && i0 + i < y.length; i++) { const u = i / n, w = tr ? Math.sin(2 * Math.PI * tr * i / sr) : 0, f = fa + (fb - fa) * u + 400 * w; ph += 2 * Math.PI * f / sr; y[i0 + i] += Math.sin(ph) * Math.sin(Math.PI * u) * (tr ? 0.6 + 0.4 * w : 1); }
    t += nd + r.range(0.015, 0.06);
  }
  return y;
}
// a wave breaking and running up the sand (stereo [L, R], d seconds): a swell of low noise, the crash, the hiss back
function fzSurf(fx, d, o = {}) {
  const sr = fx.sr, n = Math.ceil(d * sr), out = [];
  for (let c = 0; c < 2; c++) {
    const lo = fzNoise(fx, n, 'brown'), hi = fzNoise(fx, n, 'pink'); FZX.bq(lo, 'lp', 420, 0.7, sr); FZX.bq(hi, 'bp', 2200, 0.6, sr);
    const y = new Float32Array(n), pk = (o.peak || 0.25) * d;
    for (let i = 0; i < n; i++) { const t = i / sr, a = t < pk ? Math.pow(t / pk, 2) : Math.exp(-(t - pk) / (0.35 * d)), b = t < pk ? 0 : Math.exp(-(t - pk) / (0.5 * d)) * Math.min(1, (t - pk) / 0.15); y[i] = lo[i] * 2.2 * a + hi[i] * 0.8 * b; }
    out.push(y);
  }
  return out;
}
// a crowd's gasp: many short in-breaths at once (o.n people, spread over o.spread s), [L, R]
function fzGasp(fx, o = {}) {
  const sr = fx.sr, r = fx.r, d = (o.spread || 0.35) + 0.8, L = fx.arr(d), R = fx.arr(d);
  for (let k = 0; k < (o.n || 14); k++) { const b = fx.breath(r.range(0.25, 0.55), { inhale: true }), i0 = Math.round(r.range(0, o.spread || 0.35) * sr), pan = r.range(-0.9, 0.9), a = (pan + 1) * Math.PI / 4, g = r.range(0.5, 1); for (let i = 0; i < b.length && i0 + i < L.length; i++) { L[i0 + i] += b[i] * Math.cos(a) * g; R[i0 + i] += b[i] * Math.sin(a) * g; } }
  return [L, R];
}
// applause and cheering-ish noise: o.n clappers for d seconds, each clap a 6 ms burst through a hand's resonance
function fzClaps(fx, d, o = {}) {
  const sr = fx.sr, r = fx.r, L = fx.arr(d + 0.1), R = fx.arr(d + 0.1);
  for (let k = 0; k < (o.n || 30); k++) {
    const rate = r.range(3.5, 6), pan = r.range(-1, 1), a = (pan + 1) * Math.PI / 4, f = r.range(900, 2400), g = r.range(0.4, 1);
    for (let t = r.range(0, 0.4); t < d; t += 1 / rate * r.range(0.85, 1.15)) {
      const env = o.env ? o.env(t / d) : 1, i0 = Math.round(t * sr), n = Math.round(0.012 * sr), z = fx.white(n); FZX.bq(z, 'bp', f, 1.5, sr);
      for (let i = 0; i < n && i0 + i < L.length; i++) { const v = z[i] * Math.exp(-i / (0.0025 * sr)) * g * env; L[i0 + i] += v * Math.cos(a); R[i0 + i] += v * Math.sin(a); }
    }
  }
  return [L, R];
}
// a short click (a relay, a phone's shutter, a clock's tick): o.f its ring, o.len, o.hp
function fzClick(fx, o = {}) {
  const sr = fx.sr, y = fx.hit([[o.f || 2400, o.tau || 0.006, 1], [(o.f || 2400) * 1.7, (o.tau || 0.006) * 0.6, 0.5], [(o.f || 2400) * 0.45, (o.tau || 0.006) * 1.5, 0.4]], { width: 0.0003, len: o.len || 0.06 });
  if (o.hp) FZX.bq(y, 'hp', o.hp, 0.7, sr);
  return y;
}

const FZ_SOUND_FNS = [fzNoise, fzBed, fzTone, fzChirp, fzCrackle, fzSweep, fzSweepPut, fzEv, fzWn, fzAddAt, fzPlace, fzCurve, fzCricket, fzOwl, fzMeow, fzRobinSong, fzSurf, fzGasp, fzClaps, fzClick];
