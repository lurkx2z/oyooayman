/* =====================================================================
   SOUND · LIB — the noise and filter generators the ambience and effects share (the gravity films' sound kit, via the
   Air solid film, renamed lf*), and where the camera is: in the train, beside it, on the hospital's floors, in the
   stadium, on the mountain, on the road, or on the beach. Every function here is listed in LF_SOUND_FNS at the end,
   so the baked soundtrack's fingerprint sees a change to any of them.
   ===================================================================== */

// ---- shared generators -------------------------------------------------------------------------------------------
// noise of a colour: 'white' | 'pink' | 'brown'
function lfNoise(fx, n, colour = 'white') {
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
function lfBed(K, t0, t1, o = {}) {
  const { fx, sr } = K, d = t1 - t0; if (d <= 0.02) return;
  const n = Math.ceil(d * sr), fi = o.fi ?? 0.04, fo = o.fo ?? 0.04;
  const mk = () => {
    const y = lfNoise(fx, n, o.colour || 'pink');
    for (const f of (o.f || [])) LFX.bq(y, f[0], f[1], f[2] || 0.7, sr, f[3] || 0);
    const w = fx.wander(o.wr || 0.35);
    for (let i = 0; i < n; i++) { const t = i / sr; y[i] *= (o.env ? o.env(t / d, t0 + t) : 1) * Math.min(1, t / fi, (d - t) / fo) * (1 + (o.am || 0) * w(t)); }
    return y;
  };
  if (o.mono) return K.put(mk(), t0, { vol: o.vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
  return K.putLR(mk(), mk(), t0, { vol: o.vol, norm: true, room: o.room, wet: o.wet });
}
// a tone with harmonics (hum, horn, motor): f(t) the pitch over the event (t from 0), harm [[k, a]], env(u)
function lfTone(K, t0, d, f, harm, env, o = {}) {
  const { fx, sr } = K, n = Math.ceil(d * sr), y = fx.arr(d);
  const F = typeof f === 'function' ? f : () => f, ph = harm.map(() => fx.r.range(0, 6.283));
  for (let i = 0; i < n; i++) {
    const t = i / sr, fr = F(t), e = env ? env(t / d, t) : Math.min(1, t / 0.05, (d - t) / 0.05);
    let v = 0; for (let k = 0; k < harm.length; k++) { ph[k] += 2 * Math.PI * fr * harm[k][0] / sr; v += harm[k][1] * Math.sin(ph[k]); }
    y[i] = v * e;
  }
  for (const fl of (o.f || [])) LFX.bq(y, fl[0], fl[1], fl[2] || 0.7, sr, fl[3] || 0);
  return K.put(y, t0, { vol: o.vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
}
// a bird: a quick chirp phrase (FM sine sweeps), o.f0 base pitch, o.n notes
function lfChirp(fx, o = {}) {
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
function lfCrackle(fx, d, o = {}) {
  const sr = fx.sr, r = fx.r, y = fx.arr(d + 0.02), n = Math.ceil(d * sr);
  for (let i = 0; i < n; i++) { const u = i / n; if (r.next() < (o.rate || 300) * (o.env ? o.env(u) : 1) / sr) { const a = Math.pow(r.next(), 3), L = r.int(8, 60); for (let k = 0; k < L && i + k < y.length; k++) y[i + k] += a * (r.next() * 2 - 1) * Math.exp(-k / (L * 0.3)); } }
  LFX.bq(y, 'hp', o.hp || 1500, 0.7, sr);
  return y;
}

// play x at t through a filter whose frequency follows curve (Hz, evenly spaced over x's length). The filter runs
// here (a biquad whose coefficients follow the curve every 32 samples), so the level is set from what comes OUT of it
function lfSweep(x, sr, type, q, curve) {
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
function lfSweepPut(K, x, t, type, q, curve, o = {}) {
  return K.put(lfSweep(x, K.sr, type, q, curve), t, { vol: (o.vol ?? 1) * (o.gain || 1), norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
}

const lfEv = (t, a, b) => MathX.smooth(t, a, b);                                       // 0 → 1 from a to b
const lfWn = (t, a, b, fi = 0.3, fo = 0.3) => lfEv(t, a - fi, a) * (1 - lfEv(t, b, b + fo));   // 1 inside [a, b]
function lfAddAt(dst, src, t, g, sr) { const i0 = Math.round(t * sr); for (let i = 0; i < src.length && i0 + i < dst.length; i++) if (i0 + i >= 0) dst[i0 + i] += src[i] * g; }
// a level curve sampled once (200 Hz) and read back by linear interpolation: the beds read their envelopes per sample
function lfCurve(f, hz = 200) {
  const t0 = -2, n = Math.ceil((LF.end + 6 - t0) * hz), y = new Float32Array(n + 1);
  for (let i = 0; i <= n; i++) y[i] = f(t0 + i / hz);
  return (t) => { const x = MathX.clamp((t - t0) * hz, 0, n - 1e-6), i = Math.floor(x); return y[i] + (y[i + 1] - y[i]) * (x - i); };
}

// ---- where the camera is ----------------------------------------------------------------------------------------
const LF_PLACE = {
  trainIn: ['win', 'phone', 'bay', 'emerg', 'ring', 'winBeach'],
  trainOut: ['title', 'ext2', 'ext3', 'panto', 'flicker', 'brakeX'],
  bay: ['bayOut', 'roof'],
  hospital: ['mriA', 'mriB', 'quench', 'gen', 'corridor', 'board'],
  stadium: ['stadA', 'stadB', 'stadC'],
  obs: ['obsOut', 'baro', 'scope', 'eyepiece'],
  road: ['road', 'roadCar'],
};
function lfWhereShot(sh) { if (sh.where) return sh.where; for (const [k, v] of Object.entries(LF_PLACE)) if (v.includes(sh.mode)) return k; return 'beach'; }
// the film as places: [{ t0, t1, where, shot }] in order
function lfPlaces() {
  if (lfPlaces._c) return lfPlaces._c;
  return (lfPlaces._c = LF_SHOTS.map((sh) => ({ t0: Math.max(-2, sh.t0), t1: Math.min(sh.t1, LF.end + 5), where: lfWhereShot(sh), shot: sh })));
}
// 0…1 over the shots at a place (or a list of modes), with a short crossfade at each cut
function lfPlaceAt(where, xf = 0.05) {
  const W = lfPlaces().filter((p) => (Array.isArray(where) ? where.includes(p.shot.mode) : p.where === where)).map((p) => [p.t0, p.t1]);
  return (t) => { let v = 0; for (const [a, b] of W) v += lfWn(t, a, b, xf, xf); return Math.min(1, v); };
}
// is story moment s on screen (the clock doesn't skip it), and when
function lfSeen(s) { const t = lfFilmAt(s); return Math.abs(lfStoryAt(t) - s) < 0.5 ? t : null; }
// how much an event is stretched (and lowered) while the clock runs slowly: 1 at real speed, 4× at most
const lfSlowK = (t) => Math.min(4, 1 / Math.max(0.25, lfRateAt(t + 1e-3)));

// ---- this film's sounds ------------------------------------------------------------------------------------------
// a roll (a marble on floorboards, tyres on asphalt): low rumbling noise whose level and brightness follow v(u) (0…1),
// with a tick at every seam (o.seam: seams per unit of distance)
function lfRoll(fx, d, o = {}) {
  const sr = fx.sr, n = Math.ceil(d * sr), y = lfNoise(fx, n, 'brown'), w = fx.white(n), v = o.v || (() => 1);
  let x = 0, next = 0.3;
  for (let i = 0; i < n; i++) { const u = i / n, vv = v(u); y[i] = y[i] * vv * (0.6 + 0.4 * Math.sin(i / sr * 30 * (1 + vv))) + w[i] * 0.05 * vv * vv; x += vv / sr * (o.seam || 4);
    if (x > next && o.seam) { next += 1; for (let k = 0; k < 300 && i + k < n; k++) y[i + k] += 0.6 * vv * Math.sin(2 * Math.PI * (o.tick || 900) * k / sr) * Math.exp(-k / 60); } }
  LFX.bq(y, 'lp', o.lp || 1600, 0.7, sr); if (o.hp) LFX.bq(y, 'hp', o.hp, 0.7, sr);
  return y;
}
// a scrape (heavy furniture across a floor, a tyre dragged sideways): stick-slip bursts, o.f the band (Hz), o.rate (Hz)
function lfScrape(fx, d, o = {}) {
  const sr = fx.sr, n = Math.ceil(d * sr), y = lfNoise(fx, n, 'pink'), r = fx.r, env = o.env || ((u) => Math.min(1, u * 8) * Math.min(1, (1 - u) * 6));
  let ph = 0, rate = o.rate || 18;
  for (let i = 0; i < n; i++) { ph += (rate * (0.8 + 0.4 * r.next())) / sr; const g = 0.35 + 0.65 * Math.pow(Math.abs(Math.sin(Math.PI * ph)), 6); y[i] *= g * env(i / n); }
  LFX.bq(y, 'bp', o.f || 700, o.q || 0.9, sr); LFX.bq(y, 'lp', (o.f || 700) * 3.5, 0.7, sr);
  return y;
}
// a car alarm: two tones swapping (o.f1, o.f2), on a pulse
function lfAlarm(fx, d, o = {}) {
  const sr = fx.sr, n = Math.ceil(d * sr), y = new Float32Array(n), f1 = o.f1 || 960, f2 = o.f2 || 760, per = o.per || 0.36;
  let ph = 0; for (let i = 0; i < n; i++) { const t = i / sr, k = Math.floor(t / per) % 2, f = k ? f1 : f2; ph += 2 * Math.PI * f / sr; y[i] = (Math.sin(ph) + 0.3 * Math.sin(3 * ph)) * Math.min(1, t / 0.05, (d - t) / 0.2) * (0.85 + 0.15 * Math.sin(2 * Math.PI * t / per)); }
  LFX.bq(y, 'bp', 1100, 0.6, sr); return y;
}
// a crack (stone, masonry): a broadband snap, a splintering crackle, a ringing body
function lfCrack(fx, o = {}) {
  const sr = fx.sr, d = o.len || 1.6, y = fx.arr(d), r = fx.r;
  for (let i = 0; i < d * sr; i++) { const t = i / sr; y[i] = (r.next() * 2 - 1) * (Math.exp(-t / 0.006) + 0.25 * Math.exp(-t / 0.15) * (r.next() < 0.08 ? 1 : 0.2)); }
  const b = fx.hit(fx.stoneModes(o.s || 0.7), { width: 0.002, amp: 0.8, noise: 0.2, nlen: 0.05, nhp: 300, len: d }); for (let i = 0; i < Math.min(b.length, y.length); i++) y[i] += b[i] * 0.8;
  return y;
}
// the beach party's song: a little pop song (G D Em C at 112 bpm: kick, snare, hats, bass, off-beat chords, a tune),
// through a small speaker. o.offset: where in the song it starts (s)
function lfPartySong(fx, d, o = {}) {
  const sr = fx.sr, n = Math.ceil(d * sr), y = new Float32Array(n), beat = 60 / 112, bar = 4 * beat, t0 = o.offset || 0, r = new RNG(77);
  const prog = [[55, 62, 67, 71], [50, 57, 62, 66], [52, 59, 64, 67], [48, 55, 60, 64]];
  const mel = [71, 74, 76, 74, 71, 69, 67, 69, 66, 69, 71, 69, 66, 64, 62, 64, 67, 71, 74, 71, 67, 66, 64, 66, 64, 67, 72, 71, 69, 67, 64, 62];
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  let pb = 0, pm = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr + t0, b = Math.floor(t / bar) % 4, inBar = t % bar, e8 = t % (beat / 2), ch = prog[b];
    let v = 0;
    const kb = inBar % (2 * beat); if (kb < 0.25) v += 0.9 * Math.sin(2 * Math.PI * (50 * kb + 70 / 12 * (1 - Math.exp(-kb * 12)))) * Math.exp(-kb * 14);
    const sb = (inBar + beat) % (2 * beat); if (sb < 0.2) v += 0.35 * (r.next() * 2 - 1) * Math.exp(-sb * 25);
    if (e8 < 0.05) v += 0.12 * (r.next() * 2 - 1) * Math.exp(-e8 * 90);
    pb += 2 * Math.PI * hz(ch[0] - 12) / sr; v += 0.35 * Math.sin(pb) * Math.exp(-e8 * 6);
    const ob = (t + beat / 2) % beat; if (ob < 0.18) for (const m of ch.slice(1)) v += 0.07 * Math.sign(Math.sin(2 * Math.PI * hz(m) * t)) * Math.exp(-ob * 16);
    const mi = Math.floor(t / beat) % 32, mt = t % beat; pm += 2 * Math.PI * hz(mel[mi]) / sr; v += 0.2 * (Math.sin(pm) + 0.3 * Math.sin(2 * pm)) * Math.min(1, mt / 0.01) * Math.exp(-mt * 2.5);
    y[i] = v;
  }
  LFX.bq(y, 'hp', 320, 0.7, sr); LFX.bq(y, 'lp', 3600, 0.7, sr); LFX.bq(y, 'pk', 1400, 1.0, sr, 4);
  for (let i = 0; i < n; i++) y[i] = Math.tanh(1.6 * y[i]);
  return y;
}
const LF_SOUND_FNS = [lfPartySong, lfNoise, lfBed, lfTone, lfChirp, lfCrackle, lfSweep, lfSweepPut, lfAddAt, lfPlaceAt, lfSeen, lfSlowK, lfCurve, lfWhereShot, lfPlaces, lfRoll, lfScrape, lfAlarm, lfCrack, lfEv, lfWn];
