/* =====================================================================
   SOUND · LIB — the noise and filter generators the ambience and effects share (from the Slower light film, renamed
   uc*), and a few creatures. Every function here is listed in SS_SOUND_FNS at the end, so the baked
   soundtrack's fingerprint sees a change to any of them.
   ===================================================================== */

// ---- shared generators -------------------------------------------------------------------------------------------
// noise of a colour: 'white' | 'pink' | 'brown'
function ssNoise(fx, n, colour = 'white') {
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
function ssBed(K, t0, t1, o = {}) {
  const { fx, sr } = K, d = t1 - t0; if (d <= 0.02) return;
  const n = Math.ceil(d * sr), fi = o.fi ?? 0.04, fo = o.fo ?? 0.04;
  const mk = () => {
    const y = ssNoise(fx, n, o.colour || 'pink');
    for (const f of (o.f || [])) SSX.bq(y, f[0], f[1], f[2] || 0.7, sr, f[3] || 0);
    const w = fx.wander(o.wr || 0.35);
    for (let i = 0; i < n; i++) { const t = i / sr; y[i] *= (o.env ? o.env(t / d, t0 + t) : 1) * Math.min(1, t / fi, (d - t) / fo) * (1 + (o.am || 0) * w(t)); }
    return y;
  };
  if (o.mono) return K.put(mk(), t0, { vol: o.vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
  return K.putLR(mk(), mk(), t0, { vol: o.vol, norm: true, room: o.room, wet: o.wet });
}
// a tone with harmonics (hum, horn, motor): f(t) the pitch over the event (t from 0), harm [[k, a]], env(u)
function ssTone(K, t0, d, f, harm, env, o = {}) {
  const { fx, sr } = K, n = Math.ceil(d * sr), y = fx.arr(d);
  const F = typeof f === 'function' ? f : () => f, ph = harm.map(() => fx.r.range(0, 6.283));
  for (let i = 0; i < n; i++) {
    const t = i / sr, fr = F(t), e = env ? env(t / d, t) : Math.min(1, t / 0.05, (d - t) / 0.05);
    let v = 0; for (let k = 0; k < harm.length; k++) { ph[k] += 2 * Math.PI * fr * harm[k][0] / sr; v += harm[k][1] * Math.sin(ph[k]); }
    y[i] = v * e;
  }
  for (const fl of (o.f || [])) SSX.bq(y, fl[0], fl[1], fl[2] || 0.7, sr, fl[3] || 0);
  return K.put(y, t0, { vol: o.vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
}
// a bird: a quick chirp phrase (FM sine sweeps), o.f0 base pitch, o.n notes
function ssChirp(fx, o = {}) {
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
function ssCrackle(fx, d, o = {}) {
  const sr = fx.sr, r = fx.r, y = fx.arr(d + 0.02), n = Math.ceil(d * sr);
  for (let i = 0; i < n; i++) { const u = i / n; if (r.next() < (o.rate || 300) * (o.env ? o.env(u) : 1) / sr) { const a = Math.pow(r.next(), 3), L = r.int(8, 60); for (let k = 0; k < L && i + k < y.length; k++) y[i + k] += a * (r.next() * 2 - 1) * Math.exp(-k / (L * 0.3)); } }
  SSX.bq(y, 'hp', o.hp || 1500, 0.7, sr);
  return y;
}

// play x at t through a filter whose frequency follows curve (Hz, evenly spaced over x's length). The filter runs
// here (a biquad whose coefficients follow the curve every 32 samples), so the level is set from what comes OUT of it
function ssSweep(x, sr, type, q, curve) {
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
function ssSweepPut(K, x, t, type, q, curve, o = {}) {
  return K.put(ssSweep(x, K.sr, type, q, curve), t, { vol: (o.vol ?? 1) * (o.gain || 1), norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
}

const ssEv = (t, a, b) => MathX.smooth(t, a, b);                                       // 0 → 1 from a to b
const ssWn = (t, a, b, fi = 0.3, fo = 0.3) => ssEv(t, a - fi, a) * (1 - ssEv(t, b, b + fo));   // 1 inside [a, b]
function ssAddAt(dst, src, t, g, sr) { const i0 = Math.round(t * sr); for (let i = 0; i < src.length && i0 + i < dst.length; i++) if (i0 + i >= 0) dst[i0 + i] += src[i] * g; }

// ---- this film's own ------------------------------------------------------------------------------------------
// where the picture is: 0…1 over the shots that match pred (s → bool), with a short crossfade at each cut
function ssPlace(pred, xf = 0.06) {
  const W = SS_SHOTS.filter(pred).map((s) => [Math.max(-2, s.t0), Math.min(s.t1, SS.end + 5)]);
  return (t) => { let v = 0; for (const [a, b] of W) v += ssWn(t, a, b, xf, xf); return Math.min(1, v); };
}
// a level curve sampled once (200 Hz) and read back by linear interpolation: the beds read their envelopes per sample
function ssCurve(f, hz = 200) {
  const t0 = -2, n = Math.ceil((SS.end + 6 - t0) * hz), y = new Float32Array(n + 1);
  for (let i = 0; i <= n; i++) y[i] = f(t0 + i / hz);
  return (t) => { const x = MathX.clamp((t - t0) * hz, 0, n - 1e-6), i = Math.floor(x); return y[i] + (y[i + 1] - y[i]) * (x - i); };
}
// a cricket's chirp: three to five quick pulses of a ~4.6 kHz tone (o.f, o.n, o.pd pulse length, o.gap)
function ssCricket(fx, o = {}) {
  const sr = fx.sr, r = fx.r, f = o.f || r.range(4300, 4900), N = o.n || r.int(3, 5), pd = o.pd || 0.016, gap = o.gap || 0.011;
  const y = fx.arr(N * (pd + gap) + 0.03); let ph = 0;
  for (let k = 0; k < N; k++) { const i0 = Math.round(k * (pd + gap) * sr), n = Math.round(pd * sr); for (let i = 0; i < n; i++) { const u = i / n; ph += 2 * Math.PI * f * (1 + 0.01 * u) / sr; y[i0 + i] += Math.sin(ph) * Math.pow(Math.sin(Math.PI * u), 0.7) * (1 + 0.25 * Math.sin(ph * 2)); } }
  return y;
}
// a tawny owl's hoot: "hoo … hoo-hoo-hoooo", a breathy, wavering low whistle (o.f around 600 Hz)
function ssOwl(fx, o = {}) {
  const sr = fx.sr, r = fx.r, f0 = o.f || r.range(560, 640), parts = [[0, 0.55, 1], [1.4, 0.12, 0.6], [1.62, 0.12, 0.65], [1.85, 1.1, 0.9]];
  const y = fx.arr(3.2), air = ssNoise(fx, y.length, 'pink'); SSX.bq(air, 'bp', f0 * 1.1, 2.5, sr);
  for (const [t0, d, a] of parts) { const i0 = Math.round(t0 * sr), n = Math.round(d * sr); let ph = r.range(0, 6); for (let i = 0; i < n; i++) { const u = i / n, f = f0 * (1 + 0.04 * Math.sin(Math.PI * u) - 0.06 * u + 0.012 * Math.sin(2 * Math.PI * 7 * i / sr)); ph += 2 * Math.PI * f / sr; const e = Math.min(1, u / 0.15) * Math.pow(1 - u, 0.8); y[i0 + i] += a * e * (Math.sin(ph) + 0.12 * Math.sin(2 * ph) + 0.6 * air[i0 + i]); } }
  return y;
}
// a cat's voice ("mrrp", "miaow"): glottal pulses at f0(u) through two formants that open and close (o.d length,
// o.f0 [start, peak, end], o.open: how wide the mouth gets, o.thin: a little more breath than voice)
function ssMeow(fx, o = {}) {
  const sr = fx.sr, r = fx.r, d = o.d || 0.7, n = Math.ceil(d * sr), F = o.f0 || [480, 720, 420], src = new Float32Array(n);
  let ph = 0; const wv = fx.wander(6);
  for (let i = 0; i < n; i++) { const u = i / n, f = u < 0.35 ? F[0] + (F[1] - F[0]) * Math.sin(u / 0.35 * Math.PI / 2) : F[1] + (F[2] - F[1]) * Math.pow((u - 0.35) / 0.65, 1.3); ph += f * (1 + 0.015 * wv(i / sr)) / sr; if (ph >= 1) { ph -= 1; src[i] = 1; } src[i] += (o.thin || 0.08) * (r.next() * 2 - 1); }
  const op = o.open || 1, mouth = (u) => Math.sin(Math.PI * Math.min(1, u * 1.15)) * op;
  const a = ssSweep(src, sr, 'bandpass', 5, Array.from({ length: 16 }, (_, k) => 650 + 900 * mouth(k / 15)));
  const b = ssSweep(src, sr, 'bandpass', 7, Array.from({ length: 16 }, (_, k) => 1700 + 1300 * mouth(k / 15)));
  const y = fx.arr(d + 0.02); for (let i = 0; i < n; i++) { const u = i / n; y[i] = (a[i] + 0.6 * b[i]) * Math.min(1, u / 0.06) * Math.pow(1 - u, 0.6); }
  return y;
}


// ---- this film: sound that really travels -----------------------------------------------------------------------
// the film time at which the story clock reads h (bisection between the title and the real section, where the clock
// only ever runs forwards)
function ssFilmAtH(h, a = SS.titleShot, b = SS.real) {
  let lo = a, hi = b; for (let i = 0; i < 64; i++) { const m = 0.5 * (lo + hi); if (ssH(m) < h) lo = m; else hi = m; } return 0.5 * (lo + hi);
}
// a still source: a sound x made at film time te, d metres from you, reaches you when its front has gone d metres (the
// air slowing all the way); it arrives lower by c(arrival)/c(made) (the wave pattern in the air is frozen, the speed
// that carries it past you is not). Played only if it lands in real time (not inside a time-lapse) and inside [w0, w1].
// Returns the film time it arrives (or null).
function ssHeardStill(K, x, te, d, o = {}) {
  const h0 = ssH(te), h1 = ssArriveH(h0, d); if (!isFinite(h1)) return null;
  const ta = o.t !== undefined ? o.t : (te >= SS.titleShot ? ssFilmAtH(h1, Math.max(SS.titleShot, te - 0.5)) : te + (h1 - h0) * 3600);
  if (o.w0 !== undefined && (ta < o.w0 || ta > o.w1)) return null;
  if (!o.lapseOk && ssLapsing(ta + 0.05)) return null;
  const rate = ssC(h1) / ssC(h0);
  K.put(x, ta, Object.assign({}, o.put || {}, { rate: Math.abs(rate - 1) > 1e-4 ? rate : undefined }));
  return ta;
}
// a value-noise sample at time te (seeded, continuous): for engines and rumbles defined by emission time
function ssTNoise(te, rate, seed = 1) { const u = te * rate, i = Math.floor(u), f = u - i, a = hash1(i * 7919 + seed * 104729), b = hash1((i + 1) * 7919 + seed * 104729), s = f * f * (3 - 2 * f); return (a + (b - a) * s) * 2 - 1; }
// a sonic crack: a sharp N-wave (up, a straight fall, back up) with a little hiss, o.len (s)
function ssCrack(fx, o = {}) {
  const sr = fx.sr, L = Math.max(8, Math.round((o.len || 0.004) * sr)), y = fx.arr((o.len || 0.004) + (o.tail || 0.25));
  for (let i = 0; i < L; i++) y[i] = 1 - 2 * i / L;
  const z = fx.white(y.length); SSX.bq(z, 'hp', o.hp || 1800, 0.7, sr);
  for (let i = 0; i < y.length; i++) y[i] += z[i] * 0.25 * Math.exp(-i / (0.01 * sr));
  for (let i = 0; i < y.length; i++) y[i] += 0.3 * Math.sin(2 * Math.PI * (o.body || 90) * i / sr) * Math.exp(-i / ((o.decay || 0.05) * sr));
  return y;
}
// a MOVING source, exactly: for every moment you hear (t0…t1), which moments of the source's sound are reaching you
// (ssHeardFrom: one, or for a source faster than sound two or none), read from x (the sound as it was made, starting at
// film time xt0). The pitch shift, the order (backwards for a supersonic approach) and the silence ahead of the cone
// all fall out of that. Gain: the compression of emission time (dte/dt, capped) over the distance. When the cone
// reaches you (two arrivals appear where there were none) a crack. o: look (s), steps, jmax, dmin, vol, crack (level),
// right [x, z] (the listener's right, for panning), L(t) the listener (default a fixed point o.at)
function ssMoving(K, t0, t1, src, x, xt0, o = {}) {
  const { fx, sr } = K, n = Math.ceil((t1 - t0) * sr), Lb = new Float32Array(n), Rb = new Float32Array(n);
  const cr = o.cr || 200, nc = Math.ceil((t1 - t0) * cr), look = o.look || 12, steps = o.steps || 600, Lf = o.L || (() => o.at), right = o.right || [1, 0];
  const xs = (te) => { const u = (te - xt0) * sr, i = Math.floor(u); if (i < 0 || i + 1 >= x.length) return 0; return x[i] + (x[i + 1] - x[i]) * (u - i); };
  const ctl = [];
  for (let c = 0; c <= nc; c++) { const t = t0 + c / cr, L = Lf(t); ctl.push({ t, L, r: ssHeardFrom(src, L, t, look, steps).sort((a, b) => b - a) }); }
  const crack = ssCrack(fx, { len: o.crackLen || 0.004 });
  for (let c = 0; c < nc; c++) {
    const A = ctl[c], B = ctl[c + 1];
    if (B.r.length > A.r.length && A.r.length === 0 && o.crack) { const i0 = Math.round((B.t - t0) * sr); SSX.mixIn(Lb, Rb, crack, i0, o.crack, 0); }
    if (A.r.length !== B.r.length) continue;
    for (let k = 0; k < A.r.length; k++) {
      const ta = A.r[k], tb = B.r[k], J = Math.min(o.jmax || 4, Math.abs(tb - ta) * cr), p = src(ta), L = A.L;
      const dx = p[0] - L[0], dy = p[1] - L[1], dz = p[2] - L[2], d = Math.hypot(dx, dy, dz), g = (o.vol ?? 1) * J / Math.max(d, o.dmin || 1);
      const pan = MathX.clamp((dx * right[0] + dz * right[1]) / Math.max(d, 0.5), -1, 1) * 0.8, a = (pan + 1) * Math.PI / 4, gl = Math.cos(a) * g, gr = Math.sin(a) * g;
      const i0 = Math.round((A.t - t0) * sr), i1 = Math.min(n, Math.round((B.t - t0) * sr));
      for (let i = i0; i < i1; i++) { const u = (i - i0) / Math.max(1, i1 - i0), v = xs(ta + (tb - ta) * u); Lb[i] += v * gl; Rb[i] += v * gr; }
    }
  }
  return K.putLR(Lb, Rb, t0, { vol: o.out || 1, room: o.room, wet: o.wet });
}
// a voice: glottal pulses at f0 through the vowel resonances of a throat, the resonances × scale (the speed of sound
// over today's: 0.5 an octave down, 1/8 three octaves). env(te) the syllables (0…1), vowel(te) 0…4 which vowel
function ssVoice(fx, d, o = {}) {
  const sr = fx.sr, r = fx.r, n = Math.ceil(d * sr), src = new Float32Array(n), wv = fx.wander(2.5), sc = o.scale || 1;
  let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / sr, f0 = (o.f0 || 120) * (1 + 0.06 * wv(t) + (o.glide ? o.glide(t) : 0)); ph += f0 / sr; if (ph >= 1) { ph -= 1; src[i] = 1; } }
  const V = [[[730, 1090, 2440]], [[530, 1840, 2480]], [[270, 2290, 3010]], [[570, 840, 2410]], [[300, 870, 2240]]];
  const y = fx.arr(d + 0.05), seg = 0.05, ns = Math.ceil(d / seg);
  for (let k = 0; k < 3; k++) {
    const curve = Array.from({ length: ns + 1 }, (_, j) => Math.max(40, V[Math.floor((o.vowel ? o.vowel(j * seg) : j * 0.3) % 5)][0][k] * sc));
    const z = ssSweep(src, sr, 'bandpass', [6, 8, 10][k], curve);
    for (let i = 0; i < n; i++) y[i] += z[i] * [1, 0.6, 0.3][k];
  }
  const br = fx.white(n); SSX.bq(br, 'bp', 1500 * Math.max(0.25, sc), 1, sr);
  for (let i = 0; i < n; i++) { const t = i / sr; y[i] = (y[i] + 0.04 * br[i]) * (o.env ? o.env(t) : 1); }
  return y;
}

const SS_SOUND_FNS = [ssFilmAtH, ssHeardStill, ssTNoise, ssCrack, ssMoving, ssVoice, ssNoise, ssBed, ssTone, ssChirp, ssCrackle, ssSweep, ssSweepPut, ssEv, ssWn, ssAddAt, ssPlace, ssCurve, ssCricket, ssOwl, ssMeow];
