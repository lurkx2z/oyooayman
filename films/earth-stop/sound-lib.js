/* =====================================================================
   SOUND · LIB — the noise and filter generators the ambience and effects share (the gravity films' sound kit, via the
   light films), where the camera is (the platform, beside your train, inside it, the hill, the harbour, high up, the
   airliner's cabin), and how fast the world's own sounds run. Every function here is listed in ES_SOUND_FNS at the
   end, so the baked soundtrack's fingerprint sees a change to any of them.
   ===================================================================== */

// ---- shared generators -------------------------------------------------------------------------------------------
// noise of a colour: 'white' | 'pink' | 'brown'
function esNoise(fx, n, colour = 'white') {
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
function esBed(K, t0, t1, o = {}) {
  const { fx, sr } = K, d = t1 - t0; if (d <= 0.02) return;
  const n = Math.ceil(d * sr), fi = o.fi ?? 0.04, fo = o.fo ?? 0.04;
  const mk = () => {
    const y = esNoise(fx, n, o.colour || 'pink');
    for (const f of (o.f || [])) ESX.bq(y, f[0], f[1], f[2] || 0.7, sr, f[3] || 0);
    const w = fx.wander(o.wr || 0.35);
    for (let i = 0; i < n; i++) { const t = i / sr; y[i] *= (o.env ? o.env(t / d, t0 + t) : 1) * Math.min(1, t / fi, (d - t) / fo) * (1 + (o.am || 0) * w(t)); }
    return y;
  };
  if (o.mono) return K.put(mk(), t0, { vol: o.vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
  return K.putLR(mk(), mk(), t0, { vol: o.vol, norm: true, room: o.room, wet: o.wet });
}
// a tone with harmonics (hum, horn, motor): f(t) the pitch over the event (t from 0), harm [[k, a]], env(u)
function esTone(K, t0, d, f, harm, env, o = {}) {
  const { fx, sr } = K, n = Math.ceil(d * sr), y = fx.arr(d);
  const F = typeof f === 'function' ? f : () => f, ph = harm.map(() => fx.r.range(0, 6.283));
  for (let i = 0; i < n; i++) {
    const t = i / sr, fr = F(t), e = env ? env(t / d, t) : Math.min(1, t / 0.05, (d - t) / 0.05);
    let v = 0; for (let k = 0; k < harm.length; k++) { ph[k] += 2 * Math.PI * fr * harm[k][0] / sr; v += harm[k][1] * Math.sin(ph[k]); }
    y[i] = v * e;
  }
  for (const fl of (o.f || [])) ESX.bq(y, fl[0], fl[1], fl[2] || 0.7, sr, fl[3] || 0);
  return K.put(y, t0, { vol: o.vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
}
// a bird: a quick chirp phrase (FM sine sweeps), o.f0 base pitch, o.n notes
function esChirp(fx, o = {}) {
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
function esCrackle(fx, d, o = {}) {
  const sr = fx.sr, r = fx.r, y = fx.arr(d + 0.02), n = Math.ceil(d * sr);
  for (let i = 0; i < n; i++) { const u = i / n; if (r.next() < (o.rate || 300) * (o.env ? o.env(u) : 1) / sr) { const a = Math.pow(r.next(), 3), L = r.int(8, 60); for (let k = 0; k < L && i + k < y.length; k++) y[i + k] += a * (r.next() * 2 - 1) * Math.exp(-k / (L * 0.3)); } }
  ESX.bq(y, 'hp', o.hp || 1500, 0.7, sr);
  return y;
}

// play x at t through a filter whose frequency follows curve (Hz, evenly spaced over x's length). The filter runs
// here (a biquad whose coefficients follow the curve every 32 samples), so the level is set from what comes OUT of it
function esSweep(x, sr, type, q, curve) {
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
function esSweepPut(K, x, t, type, q, curve, o = {}) {
  return K.put(esSweep(x, K.sr, type, q, curve), t, { vol: (o.vol ?? 1) * (o.gain || 1), norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
}

const esEv = (t, a, b) => MathX.smooth(t, a, b);                                       // 0 → 1 from a to b
const esWn = (t, a, b, fi = 0.3, fo = 0.3) => esEv(t, a - fi, a) * (1 - esEv(t, b, b + fo));   // 1 inside [a, b]
function esAddAt(dst, src, t, g, sr) { const i0 = Math.round(t * sr); for (let i = 0; i < src.length && i0 + i < dst.length; i++) if (i0 + i >= 0) dst[i0 + i] += src[i] * g; }
// a level curve sampled once (200 Hz) and read back by linear interpolation: the beds read their envelopes per sample
function esCurve(f, hz = 200) {
  const t0 = -2, n = Math.ceil((ES.end + 6 - t0) * hz), y = new Float32Array(n + 1);
  for (let i = 0; i <= n; i++) y[i] = f(t0 + i / hz);
  return (t) => { const x = MathX.clamp((t - t0) * hz, 0, n - 1e-6), i = Math.floor(x); return y[i] + (y[i + 1] - y[i]) * (x - i); };
}

// ---- where the camera is ----------------------------------------------------------------------------------------
const ES_PLACE = {
  inside: ['inside', 'question'], train: ['wheels', 'pass', 'energy', 'ahead', 'count', 'cab', 'still', 'grip', 'reach', 'short'],
  hill: ['first', 'firstB', 'hill', 'shed', 'siding', 'wagons', 'impact', 'impact2', 'wind', 'heat', 'over', 'mouth', 'twist', 'sweep'],
  sea: ['quay', 'foot', 'ferry', 'up'],
};
function esWhereShot(sh) { if (sh.where) return sh.where; if (sh.set === 'sky') return 'cabin'; for (const [k, v] of Object.entries(ES_PLACE)) if (v.includes(sh.mode)) return k; return 'station'; }
// the film as places: [{ t0, t1, where, shot }] in order
function esPlaces() {
  if (esPlaces._c) return esPlaces._c;
  return (esPlaces._c = ES_SHOTS.map((sh) => ({ t0: Math.max(-2, sh.t0), t1: Math.min(sh.t1, ES.tHit), where: esWhereShot(sh), shot: sh })));
}
// 0…1 over the shots at a place (or a list of modes), with a short crossfade at each cut
function esPlaceAt(where, xf = 0.05) {
  const W = esPlaces().filter((p) => (Array.isArray(where) ? where.includes(p.shot.mode) : p.where === where)).map((p) => [p.t0, p.t1]);
  return (t) => { let v = 0; for (const [a, b] of W) v += esWn(t, a, b, xf, xf); return Math.min(1, v); };
}
// is story moment s on screen (the clock doesn't skip it), and when
function esSeen(s) { const t = esFilmAt(s); return Math.abs(esStoryAt(t) - s) < 0.5 ? t : null; }
// how much an event is stretched (and lowered) while the clock runs slowly: 1 at real speed, 4× at most
const esSlowK = (t) => Math.min(4, 1 / Math.max(0.25, esRateAt(t + 1e-3)));

// ---- this film's sounds ------------------------------------------------------------------------------------------
// a roll (a marble on floorboards, tyres on asphalt): low rumbling noise whose level and brightness follow v(u) (0…1),
// with a tick at every seam (o.seam: seams per unit of distance)
function esRoll(fx, d, o = {}) {
  const sr = fx.sr, n = Math.ceil(d * sr), y = esNoise(fx, n, 'brown'), w = fx.white(n), v = o.v || (() => 1);
  let x = 0, next = 0.3;
  for (let i = 0; i < n; i++) { const u = i / n, vv = v(u); y[i] = y[i] * vv * (0.6 + 0.4 * Math.sin(i / sr * 30 * (1 + vv))) + w[i] * 0.05 * vv * vv; x += vv / sr * (o.seam || 4);
    if (x > next && o.seam) { next += 1; for (let k = 0; k < 300 && i + k < n; k++) y[i + k] += 0.6 * vv * Math.sin(2 * Math.PI * (o.tick || 900) * k / sr) * Math.exp(-k / 60); } }
  ESX.bq(y, 'lp', o.lp || 1600, 0.7, sr); if (o.hp) ESX.bq(y, 'hp', o.hp, 0.7, sr);
  return y;
}
// a scrape (heavy furniture across a floor, a tyre dragged sideways): stick-slip bursts, o.f the band (Hz), o.rate (Hz)
function esScrape(fx, d, o = {}) {
  const sr = fx.sr, n = Math.ceil(d * sr), y = esNoise(fx, n, 'pink'), r = fx.r, env = o.env || ((u) => Math.min(1, u * 8) * Math.min(1, (1 - u) * 6));
  let ph = 0, rate = o.rate || 18;
  for (let i = 0; i < n; i++) { ph += (rate * (0.8 + 0.4 * r.next())) / sr; const g = 0.35 + 0.65 * Math.pow(Math.abs(Math.sin(Math.PI * ph)), 6); y[i] *= g * env(i / n); }
  ESX.bq(y, 'bp', o.f || 700, o.q || 0.9, sr); ESX.bq(y, 'lp', (o.f || 700) * 3.5, 0.7, sr);
  return y;
}
// a crack (stone, masonry): a broadband snap, a splintering crackle, a ringing body
function esCrack(fx, o = {}) {
  const sr = fx.sr, d = o.len || 1.6, y = fx.arr(d), r = fx.r;
  for (let i = 0; i < d * sr; i++) { const t = i / sr; y[i] = (r.next() * 2 - 1) * (Math.exp(-t / 0.006) + 0.25 * Math.exp(-t / 0.15) * (r.next() < 0.08 ? 1 : 0.2)); }
  const b = fx.hit(fx.stoneModes(o.s || 0.7), { width: 0.002, amp: 0.8, noise: 0.2, nlen: 0.05, nhp: 300, len: d }); for (let i = 0; i < Math.min(b.length, y.length); i++) y[i] += b[i] * 0.8;
  return y;
}
// ---- how fast the world's own sounds run (the picture's slow motion, made audible): 1 at real speed before 5:42:00;
// from then on the film runs hundreds of times slower than life, and a sound that slow would sink far below hearing,
// so the world's sounds play at three tenths of their speed (1.7 octaves down, three times longer) to the last frame
function esWorldRate(t) {
  const T0 = ES.tOn;
  if (t < T0) return 1;
  if (t < T0 + 0.8) return 1 - 0.7 * MathX.smooth(t, T0, T0 + 0.8);
  return 0.3;
}
// a blast (a wagon of fuel meeting rock, a hull meeting a quay, the ground stopping): a thump that falls from o.f0 to
// o.f1, a burst of dark noise whose brightness closes (o.bright Hz at the start), a crack on top; o.len, o.tau
function esBoom(fx, o = {}) {
  const sr = fx.sr, d = o.len || 5, n = Math.ceil(d * sr), y = new Float32Array(n), f0 = o.f0 || 62, f1 = o.f1 || 24, tau = o.tau || d * 0.22;
  let ph = 0; for (let i = 0; i < n; i++) { const t = i / sr, f = f1 + (f0 - f1) * Math.exp(-t / 0.18); ph += 2 * Math.PI * f / sr; y[i] = Math.sin(ph) * Math.exp(-t / tau) * Math.min(1, t / 0.004); }
  const b = o.bright || 2600, z = esSweep(esNoise(fx, n, 'brown'), sr, 'lp', 0.7, [b, b * 0.35, b * 0.15, 200, 120, 90]), pz = ESX.peak(z) || 1;
  for (let i = 0; i < n; i++) { const t = i / sr; y[i] += (o.noise ?? 0.9) * z[i] / pz * (Math.exp(-t / (tau * 0.6)) + 0.35 * Math.exp(-t / (tau * 2))) * Math.min(1, t / 0.002) * Math.min(1, (d - t) / 0.3); }
  if (o.crack !== 0) { const c = fx.white(Math.ceil(0.06 * sr)); ESX.bq(c, 'hp', 500, 0.7, sr); for (let i = 0; i < c.length; i++) y[i] += (o.crack ?? 0.6) * c[i] * Math.exp(-i / (0.007 * sr)); }
  return y;
}
// steel skidding on steel: noise chopped by stick-slip (o.rate Hz, wandering) through a few narrow inharmonic
// resonances on o.f (Hz); o.env(u) its level, o.bend(u) its pitch (1 = o.f)
function esScreech(fx, d, o = {}) {
  const sr = fx.sr, n = Math.ceil(d * sr), src = esNoise(fx, n, 'pink'), y = new Float32Array(n), w = fx.wander(o.wr || 0.5), f = o.f || 900, env = o.env || (() => 1);
  let ph = 0; for (let i = 0; i < n; i++) { ph += (o.rate || 60) * (1 + 0.3 * w(i / sr)) / sr; src[i] *= 0.3 + 0.7 * Math.pow(Math.abs(Math.sin(Math.PI * ph)), 3); }
  const N = 24, bend = o.bend || (() => 1);
  for (const [k, q, a] of (o.modes || [[1, 28, 1], [1.37, 36, 0.7], [2.09, 40, 0.5], [2.93, 44, 0.35], [4.2, 36, 0.2]])) {
    const z = esSweep(src, sr, 'bp', q, Array.from({ length: N }, (_, j) => f * k * bend(j / (N - 1))));
    for (let i = 0; i < n; i++) y[i] += z[i] * a;
  }
  for (let i = 0; i < n; i++) y[i] *= env(i / n) * Math.min(1, i / (0.03 * sr), (n - i) / (0.03 * sr));
  return y;
}
// something huge going by (your train, a wall of air): band noise whose band and level rise and fall, crossing from
// one side to the other. Stereo [L, R]; o.f [f at the start, at the middle, at the end], o.from/o.to pans
function esPassBy(fx, d, o = {}) {
  const sr = fx.sr, n = Math.ceil(d * sr), f = o.f || [220, 700, 240], N = 32;
  const cv = Array.from({ length: N }, (_, j) => { const u = j / (N - 1); return u < 0.5 ? f[0] + (f[1] - f[0]) * MathX.smooth(u, 0, 0.5) : f[1] + (f[2] - f[1]) * MathX.smooth(u, 0.5, 1); });
  const x = esSweep(esNoise(fx, n, o.colour || 'pink'), sr, 'bp', o.q || 0.8, cv), L = new Float32Array(n), R = new Float32Array(n), a = o.from ?? -0.8, b = o.to ?? 0.8, pk = o.peak ?? 0.5;
  for (let i = 0; i < n; i++) { const u = i / n, e = Math.exp(-Math.pow((u - pk) / (o.w || 0.22), 2)), pan = a + (b - a) * MathX.smooth(u, pk - 0.25, pk + 0.25), th = (pan + 1) * Math.PI / 4; L[i] = x[i] * e * Math.cos(th); R[i] = x[i] * e * Math.sin(th); }
  return [L, R];
}
// a bed whose filters follow the world's speed (esWorldRate, or o.rate): slowed, the same noise sinks and darkens, and
// its flutter slows with it. o.f: [[type, f, q]] (f at real speed), the rest as esBed
function esBedW(K, t0, t1, o = {}) {
  const { fx, sr } = K, d = t1 - t0; if (d <= 0.02) return;
  const n = Math.ceil(d * sr), fi = o.fi ?? 0.04, fo = o.fo ?? 0.04, rate = o.rate || esWorldRate, N = Math.ceil(d * 25) + 2;
  const R = Array.from({ length: N }, (_, i) => rate(t0 + d * i / (N - 1)));
  const mk = () => {
    let y = esNoise(fx, n, o.colour || 'pink');
    for (const f of (o.f || [])) y = esSweep(y, sr, f[0], f[2] || 0.7, R.map((r) => Math.max(20, f[1] * r)));
    const w = fx.wander(o.wr || 0.35); let tau = 0;
    for (let i = 0; i < n; i++) { const t = i / sr; tau += R[Math.floor(i / n * (N - 1))] / sr; y[i] *= (o.env ? o.env(t / d, t0 + t) : 1) * Math.min(1, t / fi, (d - t) / fo) * (1 + (o.am || 0) * w(tau)); }
    return y;
  };
  // (env is absolute here: the bed's peak is vol × env's largest value, so a quiet stretch stays quiet)
  let eMax = 1; if (o.env) { eMax = 0; for (let k = 0; k <= Math.ceil(d * 50); k++) { const u = Math.min(1, k / (d * 50)); eMax = Math.max(eMax, o.env(u, t0 + u * d)); } }
  if (eMax < 1e-4) return;
  const vol = (o.vol ?? 1) * eMax;
  if (o.mono) return K.put(mk(), t0, { vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
  return K.putLR(mk(), mk(), t0, { vol, norm: true, room: o.room, wet: o.wet });
}
const ES_SOUND_FNS = [esBedW, esWorldRate, esBoom, esScreech, esPassBy, esNoise, esBed, esTone, esChirp, esCrackle, esSweep, esSweepPut, esAddAt, esPlaceAt, esSeen, esSlowK, esCurve, esWhereShot, esPlaces, esRoll, esScrape, esCrack, esEv, esWn];
