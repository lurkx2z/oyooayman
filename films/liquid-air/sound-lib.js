/* =====================================================================
   SOUND · LIB — the noise and filter generators the ambience and effects share (from the gravity films' sound kit,
   renamed la*), and where the camera is: in your room ('in'), outdoors in the deluge ('out'), under the surface
   ('under'), or above it after 3:10 ('vac': a vacuum, where nothing carries sound at all). Every function here is
   listed in LA_SOUND_FNS at the end, so the baked soundtrack's fingerprint sees a change to any of them.
   ===================================================================== */

// ---- shared generators -------------------------------------------------------------------------------------------
// noise of a colour: 'white' | 'pink' | 'brown'
function laNoise(fx, n, colour = 'white') {
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
function laBed(K, t0, t1, o = {}) {
  const { fx, sr } = K, d = t1 - t0; if (d <= 0.02) return;
  const n = Math.ceil(d * sr), fi = o.fi ?? 0.04, fo = o.fo ?? 0.04;
  const mk = () => {
    const y = laNoise(fx, n, o.colour || 'pink');
    for (const f of (o.f || [])) LAX.bq(y, f[0], f[1], f[2] || 0.7, sr, f[3] || 0);
    const w = fx.wander(o.wr || 0.35);
    for (let i = 0; i < n; i++) { const t = i / sr; y[i] *= (o.env ? o.env(t / d, t0 + t) : 1) * Math.min(1, t / fi, (d - t) / fo) * (1 + (o.am || 0) * w(t)); }
    return y;
  };
  if (o.mono) return K.put(mk(), t0, { vol: o.vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
  return K.putLR(mk(), mk(), t0, { vol: o.vol, norm: true, room: o.room, wet: o.wet });
}
// a tone with harmonics (hum, horn, motor): f(t) the pitch over the event (t from 0), harm [[k, a]], env(u)
function laTone(K, t0, d, f, harm, env, o = {}) {
  const { fx, sr } = K, n = Math.ceil(d * sr), y = fx.arr(d);
  const F = typeof f === 'function' ? f : () => f, ph = harm.map(() => fx.r.range(0, 6.283));
  for (let i = 0; i < n; i++) {
    const t = i / sr, fr = F(t), e = env ? env(t / d, t) : Math.min(1, t / 0.05, (d - t) / 0.05);
    let v = 0; for (let k = 0; k < harm.length; k++) { ph[k] += 2 * Math.PI * fr * harm[k][0] / sr; v += harm[k][1] * Math.sin(ph[k]); }
    y[i] = v * e;
  }
  for (const fl of (o.f || [])) LAX.bq(y, fl[0], fl[1], fl[2] || 0.7, sr, fl[3] || 0);
  return K.put(y, t0, { vol: o.vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
}
// a bird: a quick chirp phrase (FM sine sweeps), o.f0 base pitch, o.n notes
function laChirp(fx, o = {}) {
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
function laCrackle(fx, d, o = {}) {
  const sr = fx.sr, r = fx.r, y = fx.arr(d + 0.02), n = Math.ceil(d * sr);
  for (let i = 0; i < n; i++) { const u = i / n; if (r.next() < (o.rate || 300) * (o.env ? o.env(u) : 1) / sr) { const a = Math.pow(r.next(), 3), L = r.int(8, 60); for (let k = 0; k < L && i + k < y.length; k++) y[i + k] += a * (r.next() * 2 - 1) * Math.exp(-k / (L * 0.3)); } }
  LAX.bq(y, 'hp', o.hp || 1500, 0.7, sr);
  return y;
}

// play x at t through a filter whose frequency follows curve (Hz, evenly spaced over x's length). The filter runs
// here (a biquad whose coefficients follow the curve every 32 samples), so the level is set from what comes OUT of it
function laSweep(x, sr, type, q, curve) {
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
function laSweepPut(K, x, t, type, q, curve, o = {}) {
  return K.put(laSweep(x, K.sr, type, q, curve), t, { vol: (o.vol ?? 1) * (o.gain || 1), norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
}

const laEv = (t, a, b) => MathX.smooth(t, a, b);                                       // 0 → 1 from a to b
const laWn = (t, a, b, fi = 0.3, fo = 0.3) => laEv(t, a - fi, a) * (1 - laEv(t, b, b + fo));   // 1 inside [a, b]
function laAddAt(dst, src, t, g, sr) { const i0 = Math.round(t * sr); for (let i = 0; i < src.length && i0 + i < dst.length; i++) if (i0 + i >= 0) dst[i0 + i] += src[i] * g; }
// a level curve sampled once (200 Hz) and read back by linear interpolation: the beds read their envelopes per sample
function laCurve(f, hz = 200) {
  const t0 = -2, n = Math.ceil((LA.end + 6 - t0) * hz), y = new Float32Array(n + 1);
  for (let i = 0; i <= n; i++) y[i] = f(t0 + i / hz);
  return (t) => { const x = MathX.clamp((t - t0) * hz, 0, n - 1e-6), i = Math.floor(x); return y[i] + (y[i + 1] - y[i]) * (x - i); };
}

// ---- where the camera is ----------------------------------------------------------------------------------------
const LA_PLACE = {
  in: ['title', 'drops', 'room1', 'real', 'dark', 'floor', 'ears', 'packet', 'go'],
  out: ['weight', 'stairs', 'street', 'lamps', 'cars', 'light', 'rising', 'ball', 'chin', 'last'],
  vac: ['flat', 'glass', 'bell'],
};
function laWhereShot(sh) { for (const k in LA_PLACE) if (LA_PLACE[k].includes(sh.mode)) return k; return 'under'; }
// the film as places: [{ t0, t1, where, shot }] in order
function laPlaces() {
  if (laPlaces._c) return laPlaces._c;
  return (laPlaces._c = LA_SHOTS.map((sh) => ({ t0: Math.max(-2, sh.t0), t1: Math.min(sh.t1, LA.end + 5), where: laWhereShot(sh), shot: sh })));
}
// 0…1 over the shots at a place, with a short crossfade at each cut
function laAt(where, xf = 0.05) {
  const W = laPlaces().filter((p) => p.where === where).map((p) => [p.t0, p.t1]);
  return (t) => { let v = 0; for (const [a, b] of W) v += laWn(t, a, b, xf, xf); return Math.min(1, v); };
}

// ---- this film's sounds ------------------------------------------------------------------------------------------
// one drop landing on something hard (a table, a sill, a floor): a tiny bright tick with a short ring
function laPlink(fx, o = {}) {
  const sr = fx.sr, r = fx.r, d = 0.09, y = fx.arr(d), f = o.f || r.range(1800, 4200);
  for (let i = 0; i < d * sr; i++) { const t = i / sr; y[i] = (Math.sin(2 * Math.PI * f * t * (1 + 0.25 * Math.exp(-t / 0.004))) * Math.exp(-t / 0.012) + (r.next() * 2 - 1) * 0.5 * Math.exp(-t / 0.002)); }
  return y;
}
// a stream of bubbles (a breath out under it): many small resonant blips rising in pitch as they go
function laBubbleSnd(fx, d, o = {}) {
  const sr = fx.sr, r = fx.r, L = fx.arr(d + 0.3), R = fx.arr(d + 0.3), n = Math.round((o.rate || 40) * d);
  for (let k = 0; k < n; k++) { const u = r.next(), i0 = Math.round(u * d * sr), env = o.env ? o.env(u) : 1; if (r.next() > env) continue;
    fx.bubble(L, R, i0, r.range(o.f0 || 300, o.f1 || 1400), r.range(0.01, 0.04), r.range(0.3, 1), r.range(-0.6, 0.6)); }
  return [L, R];
}
const LA_SOUND_FNS = [laNoise, laBed, laTone, laChirp, laCrackle, laSweep, laSweepPut, laAddAt, laAt, laCurve, laWhereShot, laPlaces, laPlink, laBubbleSnd, laEv, laWn];
