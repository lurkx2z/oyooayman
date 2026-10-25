/* =====================================================================
   SOUND · LIB — the noise and filter generators the ambience and effects share (from the Slower light film, renamed
   nt*), and this film's own generators. Every function here is listed in NT_SOUND_FNS at the end, so the baked
   soundtrack's fingerprint sees a change to any of them.
   ===================================================================== */

// ---- shared generators -------------------------------------------------------------------------------------------
// noise of a colour: 'white' | 'pink' | 'brown'
function ntNoise(fx, n, colour = 'white') {
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
function ntBed(K, t0, t1, o = {}) {
  const { fx, sr } = K, d = t1 - t0; if (d <= 0.02) return;
  const n = Math.ceil(d * sr), fi = o.fi ?? 0.04, fo = o.fo ?? 0.04;
  const mk = () => {
    const y = ntNoise(fx, n, o.colour || 'pink');
    for (const f of (o.f || [])) NTX.bq(y, f[0], f[1], f[2] || 0.7, sr, f[3] || 0);
    const w = fx.wander(o.wr || 0.35);
    for (let i = 0; i < n; i++) { const t = i / sr; y[i] *= (o.env ? o.env(t / d, t0 + t) : 1) * Math.min(1, t / fi, (d - t) / fo) * (1 + (o.am || 0) * w(t)); }
    return y;
  };
  if (o.mono) return K.put(mk(), t0, { vol: o.vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
  return K.putLR(mk(), mk(), t0, { vol: o.vol, norm: true, room: o.room, wet: o.wet });
}
// a tone with harmonics (hum, horn, motor): f(t) the pitch over the event (t from 0), harm [[k, a]], env(u)
function ntTone(K, t0, d, f, harm, env, o = {}) {
  const { fx, sr } = K, n = Math.ceil(d * sr), y = fx.arr(d);
  const F = typeof f === 'function' ? f : () => f, ph = harm.map(() => fx.r.range(0, 6.283));
  for (let i = 0; i < n; i++) {
    const t = i / sr, fr = F(t), e = env ? env(t / d, t) : Math.min(1, t / 0.05, (d - t) / 0.05);
    let v = 0; for (let k = 0; k < harm.length; k++) { ph[k] += 2 * Math.PI * fr * harm[k][0] / sr; v += harm[k][1] * Math.sin(ph[k]); }
    y[i] = v * e;
  }
  for (const fl of (o.f || [])) NTX.bq(y, fl[0], fl[1], fl[2] || 0.7, sr, fl[3] || 0);
  return K.put(y, t0, { vol: o.vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
}
// a bird: a quick chirp phrase (FM sine sweeps), o.f0 base pitch, o.n notes
function ntChirp(fx, o = {}) {
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
function ntCrackle(fx, d, o = {}) {
  const sr = fx.sr, r = fx.r, y = fx.arr(d + 0.02), n = Math.ceil(d * sr);
  for (let i = 0; i < n; i++) { const u = i / n; if (r.next() < (o.rate || 300) * (o.env ? o.env(u) : 1) / sr) { const a = Math.pow(r.next(), 3), L = r.int(8, 60); for (let k = 0; k < L && i + k < y.length; k++) y[i + k] += a * (r.next() * 2 - 1) * Math.exp(-k / (L * 0.3)); } }
  NTX.bq(y, 'hp', o.hp || 1500, 0.7, sr);
  return y;
}

// play x at t through a filter whose frequency follows curve (Hz, evenly spaced over x's length). The filter runs
// here (a biquad whose coefficients follow the curve every 32 samples), so the level is set from what comes OUT of it
function ntSweep(x, sr, type, q, curve) {
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
function ntSweepPut(K, x, t, type, q, curve, o = {}) {
  return K.put(ntSweep(x, K.sr, type, q, curve), t, { vol: (o.vol ?? 1) * (o.gain || 1), norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
}

const ntEv = (t, a, b) => MathX.smooth(t, a, b);                                       // 0 → 1 from a to b
const ntWn = (t, a, b, fi = 0.3, fo = 0.3) => ntEv(t, a - fi, a) * (1 - ntEv(t, b, b + fo));   // 1 inside [a, b]
function ntAddAt(dst, src, t, g, sr) { const i0 = Math.round(t * sr); for (let i = 0; i < src.length && i0 + i < dst.length; i++) if (i0 + i >= 0) dst[i0 + i] += src[i] * g; }

// ---- this film's own ------------------------------------------------------------------------------------------
// where the picture is: 0…1 over the shots that match pred (s → bool), with a short crossfade at each cut
function ntWhere(pred, xf = 0.06) {
  const W = NT_SHOTS.filter(pred).map((s) => [Math.max(-2, s.t0), Math.min(s.t1, NT.end + 5)]);
  return (t) => { let v = 0; for (const [a, b] of W) v += ntWn(t, a, b, xf, xf); return Math.min(1, v); };
}
// a level curve sampled once (200 Hz) and read back by linear interpolation: the beds read their envelopes per sample
function ntCurve(f, hz = 200) {
  const t0 = -2, n = Math.ceil((NT.end + 6 - t0) * hz), y = new Float32Array(n + 1);
  for (let i = 0; i <= n; i++) y[i] = f(t0 + i / hz);
  return (t) => { const x = MathX.clamp((t - t0) * hz, 0, n - 1e-6), i = Math.floor(x); return y[i] + (y[i + 1] - y[i]) * (x - i); };
}

// people talking low, no words (stereo { L, R }): each voice a glottal buzz with a little breath, through the formants of a
// vowel that changes every syllable; phrases with pauses. o.voices, o.f0 [lo, hi], o.talk (0…1 how much of the time
// each voice is talking), o.env(t) the crowd's level over the clip (t from 0, s)
function ntBabble(fx, dur, o = {}) {
  const sr = fx.sr, r = fx.r, n = Math.ceil(dur * sr), L = new Float32Array(n), R = new Float32Array(n), V = o.voices || 6, [fa, fb] = o.f0 || [95, 230];
  const VOW = [[730, 1090, 2440], [270, 2290, 3010], [530, 1840, 2480], [570, 840, 2410], [440, 1020, 2240], [300, 870, 2240], [660, 1720, 2410], [490, 1350, 1690]];
  for (let v = 0; v < V; v++) {
    const f0 = r.range(fa, fb), pan = r.range(-0.8, 0.8), gl = Math.cos((pan + 1) * Math.PI / 4), gr = Math.sin((pan + 1) * Math.PI / 4), amp = r.range(0.5, 1);
    let t = r.range(0, 1.5);
    while (t < dur - 0.2) {
      // a phrase: a few syllables, then a pause
      const ns = r.int(3, 11);
      for (let k = 0; k < ns && t < dur - 0.2; k++) {
        const sd = r.range(0.11, 0.3), m = Math.ceil((sd + 0.04) * sr), seg = new Float32Array(m), vw = VOW[r.int(0, VOW.length - 1)], ff = f0 * r.range(0.9, 1.15) * (k === ns - 1 ? 0.88 : 1);
        let ph = r.next();
        for (let i = 0; i < m; i++) { ph += ff * (1 + 0.02 * (r.next() - 0.5)) / sr; if (ph >= 1) { ph -= 1; seg[i] = 1; } seg[i] += 0.06 * (r.next() * 2 - 1); }
        const out = new Float32Array(m);
        vw.forEach((f, j) => { const z = Float32Array.from(seg); NTX.bq(z, 'bp', f * r.range(0.95, 1.05), 5 + j, sr); for (let i = 0; i < m; i++) out[i] += z[i] * [1, 0.6, 0.25][j]; });
        const i0 = Math.round(t * sr), a = amp * r.range(0.6, 1) * (o.env ? o.env(t) : 1);
        for (let i = 0; i < m && i0 + i < n; i++) { const u = i / m, e = Math.pow(Math.sin(Math.PI * u), 0.6) * a; L[i0 + i] += out[i] * e * gl; R[i0 + i] += out[i] * e * gr; }
        t += sd * r.range(0.8, 1.0);
      }
      t += r.range(0.4, 2.2) / Math.max(0.15, o.talk || 0.6);
    }
  }
  return { L, R };
}
// a siren (an emergency vehicle somewhere in the streets): o.kind 'wail' (a slow rise and fall) or 'yelp' (fast), its
// pitch range [lo, hi], o.dist (0 near … 1 far: quieter, duller), env(u) over the clip; mono
function ntSiren(fx, dur, o = {}) {
  const sr = fx.sr, r = fx.r, n = Math.ceil(dur * sr), y = new Float32Array(n), [lo, hi] = o.range || [650, 1500];
  const per = o.kind === 'yelp' ? r.range(0.28, 0.4) : r.range(3.8, 5.5), p0 = r.next();
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr, c = ((t / per + p0) % 1), sh = o.kind === 'yelp' ? (c < 0.5 ? c * 2 : 2 - c * 2) : 0.5 - 0.5 * Math.cos(2 * Math.PI * c);
    ph += 2 * Math.PI * (lo + (hi - lo) * sh) / sr;
    y[i] = (Math.sin(ph) + 0.35 * Math.sin(2 * ph) + 0.18 * Math.sin(3 * ph) + 0.08 * Math.sin(5 * ph)) * (o.env ? o.env(t / dur) : Math.min(1, t / 1.5, (dur - t) / 1.5));
  }
  NTX.bq(y, 'lp', 5500 - 4200 * (o.dist || 0), 0.7, sr);
  return y;
}
// a car alarm far off: a two-tone beep pattern; mono
function ntCarAlarm(fx, dur, o = {}) {
  const sr = fx.sr, n = Math.ceil(dur * sr), y = new Float32Array(n), per = o.per || 0.5;
  for (let i = 0; i < n; i++) { const t = i / sr, c = (t % per) / per, f = (Math.floor(t / per) % 2) ? 1320 : 990; y[i] = (c < 0.55 ? 1 : 0) * Math.sin(2 * Math.PI * f * t) * Math.min(1, t / 0.5, (dur - t) / 0.5); }
  NTX.bq(y, 'lp', 2500, 0.7, sr);
  return y;
}
// a deep, long roar (a tower coming down, heard from blocks away): a rumble that swells over `rise` s and holds, with
// crackle (steel), slow thunderous surges, and a wind-like rush on top; stereo { L, R }. o.dist dulls it.
function ntRoar(fx, dur, o = {}) {
  const sr = fx.sr, r = fx.r, n = Math.ceil(dur * sr), rise = o.rise || 2.5, hold = o.hold || 8, dist = o.dist || 0;
  const env = (t) => Math.min(1, Math.pow(t / rise, 1.6)) * (t < rise + hold ? 1 : Math.exp(-(t - rise - hold) / (o.tail || 4)));
  const mk = (seed) => {
    const y = new Float32Array(n), br = ntNoise(fx, n, 'brown'), pk = ntNoise(fx, n, 'pink'), w1 = fx.wander(0.35), w2 = fx.wander(1.3);
    NTX.bq(pk, 'lp', 900 - 600 * dist, 0.7, sr);
    for (let i = 0; i < n; i++) { const t = i / sr, e = env(t), surge = 1 + 0.45 * w1(t) + 0.25 * w2(t); y[i] = (br[i] * 1.0 + pk[i] * 0.55) * e * surge; }
    NTX.bq(y, 'lp', 1600 - 1200 * dist, 0.7, sr);
    // the crackle: steel giving way, thick in the first seconds
    const cr = ntCrackle(fx, dur, { rate: 160, hp: 700, env: (u) => env(u * dur) * Math.exp(-u * dur / (rise + hold * 0.7)) });
    NTX.bq(cr, 'lp', 4000 - 3000 * dist, 0.7, sr);
    for (let i = 0; i < n; i++) y[i] += cr[i] * 0.5;
    // thuds inside it
    for (let t = 0.3; t < rise + hold; t += r.range(0.25, 0.9)) { const a = env(t) * r.range(0.3, 1), i0 = Math.round(t * sr), f = r.range(28, 55); for (let i = 0; i < 0.6 * sr && i0 + i < n; i++) y[i0 + i] += a * 0.9 * Math.sin(2 * Math.PI * f * i / sr) * Math.exp(-i / (0.18 * sr)) * Math.min(1, i / (0.01 * sr)); }
    return y;
  };
  return { L: mk(1), R: mk(2) };
}

const NT_SOUND_FNS = [ntNoise, ntBed, ntTone, ntChirp, ntCrackle, ntSweep, ntSweepPut, ntEv, ntWn, ntAddAt, ntWhere, ntCurve, ntBabble, ntSiren, ntCarAlarm, ntRoar];
