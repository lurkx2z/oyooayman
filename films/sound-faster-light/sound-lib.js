/* =====================================================================
   SOUND · LIB — the noise and filter generators the ambience and effects share (the gravity films' sound kit, via the
   light films and the magnets film) and where the camera is. Every function here is listed
   in SF_SOUND_FNS at the end, so the baked soundtrack's fingerprint sees a change to any of them.
   ===================================================================== */

// ---- shared generators -------------------------------------------------------------------------------------------
// noise of a colour: 'white' | 'pink' | 'brown'
function sfNoise(fx, n, colour = 'white') {
  const y = fx.white(n);
  if (colour === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < n; i++) { const w = y[i]; b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898; y[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926; }
  } else if (colour === 'brown') {
    let b = 0; for (let i = 0; i < n; i++) { b = (b + 0.02 * y[i]) / 1.02; y[i] = b * 3.5; }
  }
  return y;
}
// a tone with harmonics (hum, engine, motor): f(t) the pitch over the event (t from 0), harm [[k, a]], env(u, t)
function sfTone(K, t0, d, f, harm, env, o = {}) {
  const { fx, sr } = K, n = Math.ceil(d * sr), y = fx.arr(d);
  const F = typeof f === 'function' ? f : () => f, ph = harm.map(() => fx.r.range(0, 6.283));
  for (let i = 0; i < n; i++) {
    const t = i / sr, fr = F(t), e = env ? env(t / d, t) : Math.min(1, t / 0.05, (d - t) / 0.05);
    let v = 0; for (let k = 0; k < harm.length; k++) { ph[k] += 2 * Math.PI * fr * harm[k][0] / sr; v += harm[k][1] * Math.sin(ph[k]); }
    y[i] = v * e;
  }
  for (const fl of (o.f || [])) SFX.bq(y, fl[0], fl[1], fl[2] || 0.7, sr, fl[3] || 0);
  return K.put(y, t0, { vol: o.vol, norm: o.norm ?? true, pan: o.pan || 0, room: o.room, wet: o.wet });
}
// play x at t through a filter whose frequency follows curve (Hz, evenly spaced over x's length). The filter runs
// here (a biquad whose coefficients follow the curve every 32 samples), so the level is set from what comes OUT of it
function sfSweep(x, sr, type, q, curve) {
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

const sfEv = (t, a, b) => MathX.smooth(t, a, b);                                       // 0 → 1 from a to b
const sfWn = (t, a, b, fi = 0.3, fo = 0.3) => sfEv(t, a - fi, a) * (1 - sfEv(t, b, b + fo));   // 1 inside [a, b]
// a level curve sampled once (200 Hz) and read back by linear interpolation: the beds read their envelopes per sample
function sfCurve(f, hz = 200) {
  const t0 = -2, n = Math.ceil((SF.end + 6 - t0) * hz), y = new Float32Array(n + 1);
  for (let i = 0; i <= n; i++) y[i] = f(t0 + i / hz);
  return (t) => { const x = MathX.clamp((t - t0) * hz, 0, n - 1e-6), i = Math.floor(x); return y[i] + (y[i + 1] - y[i]) * (x - i); };
}

// ---- how the slowed stretches sound: the world's own sounds drop and stretch with the picture, but only part of the
// way (k: 0.5 for the beds, 0.6 for the effects), so a 3× slower second is a darker, longer one, not a growl
const sfWorldRate = (t, k = 0.5) => Math.pow(MathX.clamp(sfRateAt(t + 1e-3), 0.2, 1), k);

// ---- where the camera is: set by sound-amb.js (SF_PLACE, sfWhereShot); sfPlaces / sfPlaceAt read it
function sfPlaces() {
  if (sfPlaces._c) return sfPlaces._c;
  return (sfPlaces._c = SF_SHOTS.map((sh) => ({ t0: Math.max(-2, sh.t0), t1: Math.min(sh.t1, SF.end + 5), where: sfWhereShot(sh), shot: sh })));
}
// 0…1 over the shots at a place, with a short crossfade at each cut
function sfPlaceAt(where, xf = 0.05) {
  const W = sfPlaces().filter((p) => p.where === where).map((p) => [p.t0, p.t1]);
  return (t) => { let v = 0; for (const [a, b] of W) v += sfWn(t, a, b, xf, xf); return Math.min(1, v); };
}

// a bed whose filters follow the world's speed (sfWorldRate, or o.rate): slowed, the same noise sinks and darkens, and
// its flutter slows with it. o.f: [[type, f, q]] (f at real speed), env(u, t) absolute level (t = film time), vol
// (peak), fi/fo fades, room/wet, mono+pan
function sfBedW(K, t0, t1, o = {}) {
  const { fx, sr } = K, d = t1 - t0; if (d <= 0.02) return;
  const n = Math.ceil(d * sr), fi = o.fi ?? 0.04, fo = o.fo ?? 0.04, rate = o.rate || sfWorldRate, N = Math.ceil(d * 25) + 2;
  const R = Array.from({ length: N }, (_, i) => rate(t0 + d * i / (N - 1)));
  const mk = () => {
    let y = sfNoise(fx, n, o.colour || 'pink');
    for (const f of (o.f || [])) y = sfSweep(y, sr, f[0], f[2] || 0.7, R.map((r) => Math.max(20, f[1] * r)));
    const w = fx.wander(o.wr || 0.35); let tau = 0;
    for (let i = 0; i < n; i++) { const t = i / sr; tau += R[Math.floor(i / n * (N - 1))] / sr; y[i] *= (o.env ? o.env(t / d, t0 + t) : 1) * Math.min(1, t / fi, (d - t) / fo) * (1 + (o.am || 0) * w(tau)); }
    return y;
  };
  let eMax = 1; if (o.env) { eMax = 0; for (let k = 0; k <= Math.ceil(d * 50); k++) { const u = Math.min(1, k / (d * 50)); eMax = Math.max(eMax, o.env(u, t0 + u * d)); } }
  if (eMax < 1e-4) return;
  const vol = (o.vol ?? 1) * eMax;
  if (o.mono) return K.put(mk(), t0, { vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
  return K.putLR(mk(), mk(), t0, { vol, norm: true, room: o.room, wet: o.wet });
}
// a voice (a gasp, a radio's garble): glottal pulses at f0(u) through formants [[f, q, a]] (all scaled by k), with
// breath; env(u)
function sfVoice(fx, d, o = {}) {
  const sr = fx.sr, n = Math.ceil(d * sr), r = fx.r, src = new Float32Array(n), k = o.k || 1, f0 = o.f0 || (() => 300), wv = fx.wander(3);
  let ph = 0; for (let i = 0; i < n; i++) { const u = i / n; ph += f0(u) * k * (1 + 0.025 * wv(i / sr)) / sr; if (ph >= 1) { ph -= 1; src[i] = 1; } src[i] += (r.next() * 2 - 1) * (o.breath ?? 0.08); }
  const y = new Float32Array(n), F = o.formants || [[800, 5, 1], [1250, 6, 0.6], [2700, 7, 0.3]];
  for (const [f, q, a] of F) { const z = Float32Array.from(src); SFX.bq(z, 'bp', f * k, q, sr); for (let i = 0; i < n; i++) y[i] += z[i] * a; }
  const env = o.env || ((u) => Math.min(1, u / 0.15) * Math.pow(1 - u, 0.8));
  for (let i = 0; i < n; i++) y[i] *= env(i / n);
  return y;
}
// footfalls of a mover (SFY.M, SFG.M: legs with dist) between story times s0 and s1: one every `stride` metres
// (half a gait cycle), at the story moment it lands → [{ s, v }] (v = the speed then)
function sfFootfalls(M, s0, s1, stride, off = 0.25) {
  const out = [];
  for (const g of M.legs) {
    const a = Math.max(s0, g.s0), b = Math.min(s1, g.s1); if (b <= a) continue;
    let prev = Math.floor(M.dist(a) / stride + off);
    for (let s = a + 0.01; s <= b + 0.2; s += 0.01) { const i = Math.floor(M.dist(s) / stride + off); if (i > prev) { out.push({ s, v: M.speed(s) }); prev = i; } }
  }
  return out;
}
// ---- the lake's own voices ----------------------------------------------------------------------------------------
// a voice calling out in the dark: two syllables ("hal-lo?", "hjel-p!"), the second higher (a question) or lower (a
// shout); o.f0 (Hz), o.d (s), o.up (the second syllable's pitch over the first), o.v1/o.v2 the vowels' formants
const SF_VOWEL = { a: [[730, 6, 1], [1150, 7, 0.55], [2650, 8, 0.25]], o: [[470, 6, 1], [820, 7, 0.5], [2600, 8, 0.15]], e: [[520, 6, 1], [1800, 7, 0.5], [2500, 8, 0.3]], u: [[320, 6, 1], [800, 7, 0.4], [2400, 8, 0.12]] };
function sfCall(fx, o = {}) {
  const sr = fx.sr, d = o.d || 0.75, f0 = o.f0 || 220, up = o.up ?? 1.2, k = o.k || 1, d1 = d * 0.42, d2 = d * 0.58, gap = Math.round(0.03 * sr);
  const fm = (V) => V.map(([f, q, a]) => [f * k, q, a]);
  const a = sfVoice(fx, d1, { f0: (u) => f0 * (1 + 0.04 * u), formants: fm(SF_VOWEL[o.v1 || 'a']), breath: 0.1, env: (u) => Math.min(1, u / 0.12) * Math.pow(1 - u, 0.5) });
  const b = sfVoice(fx, d2, { f0: (u) => f0 * up * (1 + (up > 1 ? 0.06 : -0.08) * u), formants: fm(SF_VOWEL[o.v2 || 'o']), breath: 0.12, env: (u) => Math.min(1, u / 0.1) * Math.pow(1 - u, 0.9) });
  const y = new Float32Array(a.length + gap + b.length); y.set(a, 0); y.set(b, a.length + gap);
  return y;
}
// a scream: a high, wavering 'a', o.f0 (Hz), o.d (s)
function sfScream(fx, o = {}) {
  const f0 = o.f0 || 620, d = o.d || 1.1, wv = fx.wander(6);
  return sfVoice(fx, d, { f0: (u) => f0 * (1 + 0.12 * Math.sin(Math.PI * Math.min(1, u * 1.4)) - 0.25 * u * u) * (1 + 0.02 * wv(u * d)), formants: [[950, 5, 1], [1500, 6, 0.7], [3000, 7, 0.35]], breath: 0.25, env: (u) => Math.min(1, u / 0.06) * Math.pow(1 - u, 0.7) });
}
// lake ice "singing": a crack runs through the sheet and its sound arrives high notes first (the ice is a dispersive
// waveguide), a falling whistle — pew — with a dull thump under it. o.f0 → o.f1 (Hz) over o.d (s), o.thump
function sfPew(fx, o = {}) {
  const sr = fx.sr, d = o.d || 0.5, n = Math.ceil((d + 0.25) * sr), y = new Float32Array(n), f0 = o.f0 || 3200, f1 = o.f1 || 260, r = fx.r;
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr, u = Math.min(1, t / d), f = f0 * Math.pow(f1 / f0, Math.pow(u, 0.55));
    ph += 2 * Math.PI * f / sr;
    const e = Math.min(1, t / 0.004) * Math.exp(-t / (d * 0.45));
    y[i] = (Math.sin(ph) + 0.3 * Math.sin(2 * ph + 0.5) + 0.25 * (r.next() * 2 - 1) * Math.exp(-t / 0.02)) * e;
  }
  if (o.thump) { const z = fx.hit([[62, 0.12, 1], [101, 0.08, 0.6], [167, 0.05, 0.4]], { width: 0.003, amp: o.thump, noise: 0.3, nlen: 0.02, nhp: 300, len: 0.6 }); for (let i = 0; i < z.length && i < n; i++) y[i] += z[i]; }
  SFX.bq(y, 'hp', 60, 0.7, sr);
  return y;
}
// a fire's crackle: sparse pops (resin, sap boiling out) and the occasional snap; d (s), o.rate (pops per second)
function sfCrackle(fx, d, o = {}) {
  const sr = fx.sr, n = Math.ceil(d * sr), y = new Float32Array(n), r = fx.r, rate = o.rate || 9;
  for (let t = r.range(0, 0.1); t < d - 0.05; t += -Math.log(1 - r.next() * 0.999) / rate) {
    const i0 = Math.round(t * sr), big = r.next() < 0.12, len = Math.round((big ? 0.02 : 0.006) * sr), a = (big ? 1 : 0.35) * r.range(0.4, 1), f = r.range(1800, 5200);
    for (let i = 0; i < len && i0 + i < n; i++) y[i0 + i] += a * (r.next() * 2 - 1) * Math.exp(-i / (len * 0.3)) * (0.6 + 0.4 * Math.sin(2 * Math.PI * f * i / sr));
  }
  SFX.bq(y, 'hp', 700, 0.7, sr);
  return y;
}
// an engine idling or pulling: a four-cylinder's firing pulses at rpm/30 Hz through an intake/exhaust body
function sfEngine(fx, d, rpm, o = {}) {
  const sr = fx.sr, n = Math.ceil(d * sr), y = new Float32Array(n), w = fx.white(n), R = typeof rpm === 'function' ? rpm : () => rpm;
  let ph = 0, rr = R(0);
  for (let i = 0; i < n; i++) {
    if ((i & 63) === 0) rr = R(i / sr);
    const f = rr / 30 * (o.cyl ? o.cyl / 4 : 1); ph += f / sr; const p = ph - Math.floor(ph), load = MathX.clamp((rr - 800) / 3000, 0, 1);
    y[i] = (Math.exp(-p * 7) - 0.14) * (0.7 + 0.3 * load) + w[i] * 0.08 * Math.exp(-p * 4) * (0.5 + load) + 0.25 * Math.sin(2 * Math.PI * ph * 0.5);
  }
  SFX.bq(y, 'lp', o.lp || 700, 0.8, sr); SFX.bq(y, 'hp', 28, 0.7, sr);
  for (let i = 0; i < n; i++) y[i] *= Math.min(1, i / (0.05 * sr), (n - i) / (0.05 * sr));
  return y;
}
// a car horn: two reed tones (a major third apart), square-ish, d (s)
function sfHorn(fx, d, f = 420) {
  const sr = fx.sr, n = Math.ceil(d * sr), y = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / sr, e = Math.min(1, t / 0.015, (d - t) / 0.03); let v = 0; for (const [ff, a] of [[f, 1], [f * 1.26, 0.8]]) for (let h = 1; h <= 7; h += 2) v += a * Math.sin(2 * Math.PI * ff * h * t) / h; y[i] = Math.tanh(1.6 * v) * e; }
  SFX.bq(y, 'bp', 1100, 0.6, sr);
  return y;
}
const SF_SOUND_FNS = [sfNoise, sfTone, sfSweep, sfEv, sfWn, sfCurve, sfWorldRate, sfPlaces, sfPlaceAt, sfBedW, sfVoice, sfFootfalls, sfCall, sfScream, sfPew, sfCrackle, sfEngine, sfHorn];
