/* =====================================================================
   SOUND · LIB — the noise and filter generators the ambience and effects share (from the Africa, Tesla and Shrinking films, renamed sl*).
   ===================================================================== */

// ---- shared generators -------------------------------------------------------------------------------------------
// noise of a colour: 'white' | 'pink' | 'brown'
function slNoise(fx, n, colour = 'white') {
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
function slBed(K, t0, t1, o = {}) {
  const { fx, sr } = K, d = t1 - t0; if (d <= 0.02) return;
  const n = Math.ceil(d * sr), fi = o.fi ?? 0.04, fo = o.fo ?? 0.04;
  const mk = () => {
    const y = slNoise(fx, n, o.colour || 'pink');
    for (const f of (o.f || [])) SLX.bq(y, f[0], f[1], f[2] || 0.7, sr, f[3] || 0);
    const w = fx.wander(o.wr || 0.35);
    for (let i = 0; i < n; i++) { const t = i / sr; y[i] *= (o.env ? o.env(t / d, t0 + t) : 1) * Math.min(1, t / fi, (d - t) / fo) * (1 + (o.am || 0) * w(t)); }
    return y;
  };
  if (o.mono) return K.put(mk(), t0, { vol: o.vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
  return K.putLR(mk(), mk(), t0, { vol: o.vol, norm: true, room: o.room, wet: o.wet });
}
// a tone with harmonics (hum, horn, motor): f(t) the pitch over the event (t from 0), harm [[k, a]], env(u)
function slTone(K, t0, d, f, harm, env, o = {}) {
  const { fx, sr } = K, n = Math.ceil(d * sr), y = fx.arr(d);
  const F = typeof f === 'function' ? f : () => f, ph = harm.map(() => fx.r.range(0, 6.283));
  for (let i = 0; i < n; i++) {
    const t = i / sr, fr = F(t), e = env ? env(t / d, t) : Math.min(1, t / 0.05, (d - t) / 0.05);
    let v = 0; for (let k = 0; k < harm.length; k++) { ph[k] += 2 * Math.PI * fr * harm[k][0] / sr; v += harm[k][1] * Math.sin(ph[k]); }
    y[i] = v * e;
  }
  for (const fl of (o.f || [])) SLX.bq(y, fl[0], fl[1], fl[2] || 0.7, sr, fl[3] || 0);
  return K.put(y, t0, { vol: o.vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
}
// a bird: a quick chirp phrase (FM sine sweeps), o.f0 base pitch, o.n notes
function slChirp(fx, o = {}) {
  const sr = fx.sr, r = fx.r, notes = o.n || r.int(2, 6), f0 = o.f0 || r.range(2400, 4200), gap = o.gap || r.range(0.05, 0.12), nd = o.nd || r.range(0.04, 0.09);
  const y = fx.arr(notes * (nd + gap) + 0.05); let ph = 0;
  const shape = r.int(0, 2);
  for (let k = 0; k < notes; k++) {
    const i0 = Math.round(k * (nd + gap) * sr), n = Math.round(nd * sr), fa = f0 * r.range(0.9, 1.15), fb = fa * (shape === 0 ? 1.4 : shape === 1 ? 0.7 : r.range(0.85, 1.3));
    for (let i = 0; i < n; i++) { const u = i / n, f = fa + (fb - fa) * u + 120 * Math.sin(2 * Math.PI * 38 * i / sr); ph += 2 * Math.PI * f / sr; y[i0 + i] += Math.sin(ph) * Math.sin(Math.PI * u) * (0.8 + 0.2 * Math.sin(ph * 2)); }
  }
  return y;
}
// a gull's cry: a falling series of short, raspy "kyow" notes (a saw, roughened at ~50 Hz, through a formant)
function slGull(fx) {
  const sr = fx.sr, r = fx.r, notes = r.int(3, 5), y = fx.arr(notes * 0.36 + 0.1); let ph = 0;
  const f0 = r.range(1100, 1350);
  for (let k = 0, o = 0; k < notes; k++) {
    const d = r.range(0.2, 0.3), n = Math.round(d * sr), i0 = Math.round(o * sr), fa = f0 * Math.pow(0.93, k) * r.range(0.97, 1.03);
    for (let i = 0; i < n; i++) {
      const u = i / n, f = fa * (u < 0.25 ? 0.8 + 0.8 * u : 1.0 - 0.32 * (u - 0.25)), rough = 1 + 0.5 * Math.sin(2 * Math.PI * 50 * i / sr + 2 * Math.sin(2 * Math.PI * 7 * i / sr));
      ph += 2 * Math.PI * f / sr;
      const saw = 2 * ((ph / (2 * Math.PI)) % 1) - 1;
      y[i0 + i] += (saw * rough + 0.25 * (r.next() - 0.5)) * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.15)), 0.7) * (1 - 0.15 * k);
    }
    o += d + r.range(0.04, 0.08);
  }
  SLX.bq(y, 'peak', 1600, 1.4, sr, 9); SLX.bq(y, 'bp', 1700, 0.8, sr); SLX.bq(y, 'lp', 4500, 0.7, sr);
  return y;
}
// an electric fizz: dense crackle with random sizes, o.env(u) shapes it, o.rate (clicks/s), o.hp
function slCrackle(fx, d, o = {}) {
  const sr = fx.sr, r = fx.r, y = fx.arr(d + 0.02), n = Math.ceil(d * sr);
  for (let i = 0; i < n; i++) { const u = i / n; if (r.next() < (o.rate || 300) * (o.env ? o.env(u) : 1) / sr) { const a = Math.pow(r.next(), 3), L = r.int(8, 60); for (let k = 0; k < L && i + k < y.length; k++) y[i + k] += a * (r.next() * 2 - 1) * Math.exp(-k / (L * 0.3)); } }
  SLX.bq(y, 'hp', o.hp || 1500, 0.7, sr);
  return y;
}

// play x at t through a filter whose frequency follows curve (Hz, evenly spaced over x's length). The filter runs
// here (a biquad whose coefficients follow the curve every 32 samples), so the level is set from what comes OUT of it
function slSweep(x, sr, type, q, curve) {
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
function slSweepPut(K, x, t, type, q, curve, o = {}) {
  return K.put(slSweep(x, K.sr, type, q, curve), t, { vol: (o.vol ?? 1) * (o.gain || 1), norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
}


// =====================================================================================================================
// this film's own generators (all deterministic). Every function here is listed in SL_SOUND_FNS at the end, so the
// baked soundtrack's fingerprint sees a change to any of them.
// =====================================================================================================================
const slEv = (t, a, b) => MathX.smooth(t, a, b);                                       // 0 → 1 from a to b
const slWn = (t, a, b, fi = 0.3, fo = 0.3) => slEv(t, a - fi, a) * (1 - slEv(t, b, b + fo));   // 1 inside [a, b]

// ---- a voice whose words you can't make out. The film has no narrator and no dialogue: what you hear is the shape
// of speech (through a phone, or through a wall). The text only drives the rhythm: vowels are vowels (formants),
// consonants are bursts, hisses and hums, spaces are word gaps, , . ? ! end phrases (? rises).
// o: f0 (Hz), fs (formant scale: 1 a man, ≈1.15 a woman), rate (×), breathy (0…1), hold (× vowel length), rise
const SL_VOW = { a: [760, 1250, 2600], e: [520, 1850, 2550], i: [330, 2250, 2950], o: [520, 900, 2450], u: [360, 950, 2350], y: [340, 2100, 2800] };
function slVoice(fx, text, o = {}) {
  const sr = fx.sr, r = fx.r, fs = o.fs || 1, rate = o.rate || 1, hold = o.hold || 1, low = text.toLowerCase();
  const S = []; let stress = true, ph0 = 0;
  const nextV = (i) => { const m = low.slice(i + 1).match(/[aeiouy]/); return SL_VOW[m ? m[0] : 'a']; };
  for (let i = 0; i < low.length; i++) {
    const ch = low[i];
    if (SL_VOW[ch]) {
      let d = (stress ? 0.15 : 0.1) * hold;
      while (low[i + 1] === ch) { d += 0.08 * hold; i++; }
      S.push({ k: 'v', d: d / rate * r.range(0.85, 1.15), F: SL_VOW[ch], v: stress ? 1 : 0.78, st: stress ? 1 : 0 }); stress = false;
    } else if (ch === ' ') { S.push({ k: 'g', d: r.range(0.015, 0.05) / rate }); stress = r.chance(0.7); }
    else if (',.?!;'.includes(ch)) { S.push({ k: 'p', d: (ch === ',' ? 0.16 : 0.3) / rate, q: ch === '?', ph: ph0 }); ph0 = S.length; stress = true; }
    else if ('ptkbdgcq'.includes(ch)) S.push({ k: 'b', d: 0.065 / rate, f: 'pb'.includes(ch) ? 1100 : 'td'.includes(ch) ? 3800 : 2200, vz: 'bdg'.includes(ch), F: nextV(i) });
    else if ('szx'.includes(ch)) S.push({ k: 'f', d: 0.09 / rate, f: 6000, a: 0.55, vz: ch === 'z', F: nextV(i) });
    else if ('fv'.includes(ch)) S.push({ k: 'f', d: 0.075 / rate, f: 4200, a: 0.25, vz: ch === 'v', F: nextV(i) });
    else if (ch === 'h') S.push({ k: 'h', d: 0.07 / rate, F: nextV(i) });
    else if ('mn'.includes(ch)) S.push({ k: 'n', d: 0.07 / rate, F: [280, ch === 'm' ? 1000 : 1500, 2400] });
    else if ('lrwj'.includes(ch)) S.push({ k: 'l', d: 0.06 / rate, F: ch === 'w' ? [320, 750, 2300] : ch === 'r' ? [450, 1200, 1700] : ch === 'j' ? [300, 2200, 2900] : [380, 1100, 2700] });
  }
  if (!S.length || S[S.length - 1].k !== 'p') S.push({ k: 'p', d: 0.2, q: false, ph: ph0 });
  // per-sample targets
  const D = S.reduce((s, x) => s + x.d, 0) + 0.25, n = Math.ceil(D * sr);
  const F1 = new Float32Array(n), F2 = new Float32Array(n), F3 = new Float32Array(n), Av = new Float32Array(n), Ah = new Float32Array(n), Af = new Float32Array(n), Ff = new Float32Array(n), P = new Float32Array(n);
  let i0 = 0, last = SL_VOW.e, phStart = 0;
  const phraseEnds = []; { let tt = 0; for (const s of S) { tt += s.d; if (s.k === 'p') phraseEnds.push([tt - s.d, s.q]); } }
  let pe = 0;
  for (const s of S) {
    const m = Math.round(s.d * sr), F = s.F || last;
    while (pe < phraseEnds.length - 1 && i0 / sr > phraseEnds[pe][0]) { phStart = phraseEnds[pe][0]; pe++; }
    for (let k = 0; k < m && i0 + k < n; k++) {
      const j = i0 + k, u = k / m, t = j / sr, end = phraseEnds[pe] ? phraseEnds[pe][0] : D, up = MathX.clamp((t - phStart) / Math.max(0.2, end - phStart), 0, 1);
      F1[j] = F[0]; F2[j] = F[1]; F3[j] = F[2];
      let pit = 1.07 - 0.17 * up;                                                       // declination over the phrase
      if (phraseEnds[pe] && phraseEnds[pe][1]) pit *= 1 + 0.38 * slEv(t, end - 0.35, end);   // a question rises
      if (s.k === 'v') { Av[j] = s.v; Ah[j] = 0.06 + 0.25 * (o.breathy || 0); pit *= 1 + 0.09 * s.st * Math.sin(Math.PI * u); }
      else if (s.k === 'h') { Ah[j] = 0.9; }
      else if (s.k === 'n') { Av[j] = 0.42; }
      else if (s.k === 'l') { Av[j] = 0.7; }
      else if (s.k === 'f') { Af[j] = s.a; Ff[j] = s.f; Av[j] = s.vz ? 0.3 : 0; }
      else if (s.k === 'b') { const burst = u > 0.72 && u < 0.86; Af[j] = burst ? 0.9 : 0; Ff[j] = s.f; Av[j] = s.vz && u < 0.72 ? 0.18 : 0; }
      P[j] = pit;
    }
    if (s.F) last = F;
    i0 += m;
  }
  // smooth the targets (formants glide, voicing fades), then synthesise: a glottal pulse train (with jitter and
  // shimmer) and breath noise through three formant resonators in cascade; hisses and bursts added on top
  const y = new Float32Array(n), sm = (x, tau) => { const a = 1 - Math.exp(-1 / (tau * sr)); let v = x[0]; for (let j = 0; j < x.length; j++) { v += (x[j] - v) * a; x[j] = v; } };
  sm(F1, 0.022); sm(F2, 0.03); sm(F3, 0.03); sm(Av, 0.008); sm(Ah, 0.006); sm(Af, 0.004); sm(P, 0.04);
  const res = [0, 1, 2].map(() => ({ y1: 0, y2: 0, a1: 0, a2: 0, g: 1 })), BW = [90, 120, 170].map((b) => b * (1 + 0.6 * (o.breathy || 0)));
  const fr = { y1: 0, y2: 0, a1: 0, a2: 0, b: 0 }, wv = fx.wander(0.8);
  let ph = 0, amp = 1, f0 = o.f0 || 130, gp = 0;
  for (let j = 0; j < n; j++) {
    if (j % 16 === 0) {
      const Fs = [F1[j], F2[j], F3[j]];
      for (let k = 0; k < 3; k++) { const R = res[k], rr = Math.exp(-Math.PI * BW[k] / sr), th = 2 * Math.PI * Math.min(Fs[k] * fs, sr * 0.45) / sr; R.a1 = 2 * rr * Math.cos(th); R.a2 = -rr * rr; R.g = 1 - R.a1 - R.a2; }
      const rf = Math.exp(-Math.PI * 2500 / sr), tf = 2 * Math.PI * Math.min(Ff[j] || 4000, sr * 0.45) / sr; fr.a1 = 2 * rf * Math.cos(tf); fr.a2 = -rf * rf; fr.b = (1 - rf);
    }
    const f = f0 * P[j] * (1 + 0.012 * wv(j / sr) + 0.006 * Math.sin(2 * Math.PI * 5.2 * j / sr));
    ph += f / sr;
    if (ph >= 1) { ph -= 1; amp = 0.92 + 0.16 * r.next(); f0 = (o.f0 || 130) * (1 + 0.012 * (r.next() - 0.5)); }
    const g = ph < 0.45 ? 0.5 - 0.5 * Math.cos(Math.PI * ph / 0.45) : ph < 0.66 ? Math.cos(0.5 * Math.PI * (ph - 0.45) / 0.21) : 0;
    const src = (g - gp) * amp * Av[j] * 18 + (r.next() * 2 - 1) * Ah[j] * 0.35; gp = g;
    let x = src;
    for (let k = 0; k < 3; k++) { const R = res[k], v = R.g * x + R.a1 * R.y1 + R.a2 * R.y2; R.y2 = R.y1; R.y1 = v; x = v; }
    const nz = (r.next() * 2 - 1) * Af[j], fv = fr.b * nz + fr.a1 * fr.y1 + fr.a2 * fr.y2; fr.y2 = fr.y1; fr.y1 = fv;
    y[j] = x + fv * 0.6;
  }
  SLX.bq(y, 'hp', 70, 0.7, sr);
  return y;
}
// a phone's little speaker and its codec: 300 Hz–3.4 kHz, a bit of honk, gently saturated. o.drop: the share of 20 ms
// packets lost (they're filled with a frozen, buzzy copy of the last one, the way a call breaks up)
function slPhone(y, sr, o = {}) {
  SLX.bq(y, 'hp', 340, 0.7, sr); SLX.bq(y, 'hp', 340, 0.7, sr); SLX.bq(y, 'lp', 3300, 0.7, sr); SLX.bq(y, 'lp', 3300, 0.7, sr); SLX.bq(y, 'peak', 1700, 1.2, sr, 4);
  const pk = SLX.peak(y) || 1;
  for (let i = 0; i < y.length; i++) y[i] = Math.tanh(1.8 * y[i] / pk) / Math.tanh(1.8);
  if (o.drop) {
    const P = Math.round(0.02 * sr), r = new RNG(o.seed || 5);
    for (let p = P; p + P < y.length; p += P) if (r.next() < o.drop(p / sr)) for (let k = 0; k < P; k++) y[p + k] = y[p - P + (k % Math.round(P / 4))] * 0.6;
  }
  return y;
}
// play a mono source made in someone else's time (τ) at film time: out(t) = src(τ(t) − srcT0). tauOf(t) must not run
// backwards. Used for Gran: what you hear left her one cable delay ago, so as the delay grows her voice drags.
function slWarpPut(K, src, srcT0, tauOf, t0, t1, o = {}) {
  const sr = K.sr, n = Math.ceil((t1 - t0) * sr), y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const u = (tauOf(t0 + i / sr) - srcT0) * sr, j = Math.floor(u), w = u - j;
    if (j >= 0 && j + 1 < src.length) y[i] = src[j] * (1 - w) + src[j + 1] * w;
  }
  return K.put(y, t0, Object.assign({ norm: false }, o));
}
// add src into dst (mono) at time t (s, relative to dst's start), scaled by g
function slAddAt(dst, src, t, g, sr) { const i0 = Math.round(t * sr); for (let i = 0; i < src.length && i0 + i < dst.length; i++) if (i0 + i >= 0) dst[i0 + i] += src[i] * g; }

// ---- a crowd's "ooh" (people on the promenade seeing a burst): many voices on one long vowel, each its own pitch,
// starting a little apart; o.n voices, o.vowel, o.len (s), o.rise (the pitch swoop), returns stereo { L, R }
function slCrowdOoh(fx, o = {}) {
  const sr = fx.sr, r = fx.r, len = o.len || 1.6, L = fx.arr(len + 0.8), R = fx.arr(len + 0.8);
  for (let k = 0; k < (o.n || 18); k++) {
    const woman = r.chance(0.5), vow = o.vowel || r.pick(['oooo', 'ooo', 'aaaa', 'oooh']);
    const y = slVoice(fx, vow, { f0: (woman ? 215 : 118) * r.range(0.85, 1.2), fs: woman ? 1.15 : 1, hold: len * r.range(0.6, 1.0) / 0.4, breathy: 0.4 });
    // the swoop: up then down (applied as an amplitude shape; the pitch already falls)
    const t0 = r.range(0, 0.35) * (o.spread || 1);
    for (let i = 0; i < y.length; i++) { const u = i / y.length; y[i] *= Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.1)), 0.8); }
    SLX.mixIn(L, R, y, Math.round(t0 * sr), r.range(0.4, 1) / Math.sqrt(o.n || 18), r.range(-0.8, 0.8));
  }
  return { L, R };
}
// applause: many hands, each clapping at its own rate for a while
function slClaps(fx, d, o = {}) {
  const sr = fx.sr, r = fx.r, L = fx.arr(d + 0.3), R = fx.arr(d + 0.3);
  for (let k = 0; k < (o.n || 30); k++) {
    const rate = r.range(3.5, 6), pan = r.range(-0.9, 0.9), f = r.range(900, 2200), stop = d * r.range(0.5, 1), a0 = r.range(0.3, 1);
    for (let t = r.range(0, 0.4); t < stop; t += 1 / rate * r.range(0.9, 1.1)) {
      const z = fx.white(Math.round(0.012 * sr)); for (let i = 0; i < z.length; i++) z[i] *= Math.exp(-i / (0.0025 * sr));
      SLX.bq(z, 'bp', f, 1.2, sr);
      SLX.mixIn(L, R, z, Math.round(t * sr), a0 * (1 - 0.6 * t / d) * r.range(0.7, 1), pan);
    }
  }
  return { L, R };
}

// ---- a firework heard from 2 km: the air has taken the crack out of it. A deep thump, a softer double, then the
// harbour's echo rolling round the far shore and the hills for seconds; big ones crackle after. Stereo { L, R }
function slBang(fx, o = {}) {
  const sr = fx.sr, r = fx.r, size = o.size || 1, len = 5.5 + 2 * size, L = fx.arr(len), R = fx.arr(len);
  const thump = (amp, lp, dk) => {
    const y = fx.arr(1.4), nz = fx.white(Math.round(0.06 * sr));
    for (let i = 0; i < nz.length; i++) nz[i] *= Math.exp(-i / (0.012 * sr));
    SLX.bq(nz, 'lp', lp, 0.7, sr); SLX.bq(nz, 'lp', lp * 1.4, 0.7, sr);
    for (let i = 0; i < nz.length; i++) y[i] += nz[i] * 2.2;
    for (let i = 0; i < 1.2 * sr; i++) { const t = i / sr; y[i] += Math.sin(2 * Math.PI * (38 + 30 * Math.exp(-t / 0.04)) * t) * Math.exp(-t / (0.22 * dk)) * Math.min(1, t / 0.003) * 0.9; }
    for (let i = 0; i < y.length; i++) y[i] *= amp;
    return y;
  };
  const main = thump(1, 650 + 250 * size, 1 + 0.4 * size);
  SLX.mixIn(L, R, main, 0, 1, o.pan || 0);
  if (size > 1.2) SLX.mixIn(L, R, thump(0.6, 900, 1.2), Math.round(0.11 * sr), 1, (o.pan || 0) + 0.1);
  // the echoes: copies, later, darker, smeared, from either side
  for (let k = 0; k < 14 + 6 * size; k++) {
    const dt = 0.25 + Math.pow(r.next(), 0.8) * (3.2 + size), a = 0.42 * Math.exp(-dt / (1.5 + 0.5 * size)) * r.range(0.5, 1), e = thump(a, r.range(250, 480), r.range(1.5, 3));
    SLX.bq(e, 'lp', 300, 0.6, sr);
    SLX.mixIn(L, R, e, Math.round(dt * sr), 1, r.range(-0.9, 0.9));
  }
  // the crackle of the stars (it arrives with the bang, so it's as late as the bang is)
  if (o.crackle) {
    const d = 1.6 + size, c = (k) => { const y = slCrackle(fx, d, { rate: 140 * o.crackle, env: (u) => Math.pow(1 - u, 1.5) * Math.min(1, u * 8), hp: 600 }); SLX.bq(y, 'lp', 2600, 0.7, sr); return y; };
    SLX.mixIn(L, R, c(0), Math.round(0.7 * sr), 0.5, -0.3); SLX.mixIn(L, R, c(1), Math.round(0.75 * sr), 0.5, 0.3);
  }
  return { L, R };
}

// ---- a car you hear: its engine and its tyres on the wet road, made in the car's own time, then carried to you at
// the speed of sound (so the pitch shifts as it passes, and it is a little late), quieter and duller with distance.
// o: x(te) its centre along the road, v(te) speed, rpm(te), load(te) (0…1, the throttle), eye, lane, t0/t1 (film time
// you hear it), pan(x, t) where it sits in the stereo picture (−1 left … 1 right). Returns nothing: it is played.
function slCarHeard(K, o) {
  const { fx, sr } = K, r = fx.r, c = SL_VSOUND, E = o.eye, b = Math.hypot(E[2] - o.lane, E[1] - 0.5);
  const te0 = o.t0 - 2, te1 = o.t1 + 0.1, n = Math.ceil((te1 - te0) * sr);
  // the source, in the car's time
  const eng = new Float32Array(n), tyre = slNoise(fx, n, 'pink'), spray = fx.white(n), rasp = fx.white(n);
  SLX.bq(tyre, 'bp', 850, 0.55, sr); SLX.bq(tyre, 'lp', 3200, 0.7, sr);
  SLX.bq(spray, 'hp', 2600, 0.7, sr); SLX.bq(spray, 'lp', 9000, 0.7, sr);
  let ph = 0, a = 1, la = 0; const wv = fx.wander(0.6);
  for (let i = 0; i < n; i++) {
    const te = te0 + i / sr, rpm = o.rpm(te), ff = rpm / 30, v = o.v(te), ld = o.load ? o.load(te) : 0.4;
    ph += ff / sr; if (ph >= 1) { ph -= 1; a = 0.75 + 0.5 * r.next(); }
    la += (ld - la) * 0.0005;
    const p = 2 * Math.PI * ph, pulse = Math.pow(0.5 + 0.5 * Math.cos(p), 3);
    eng[i] = (0.5 * Math.sin(p / 2 + 0.4) + Math.sin(p) + 0.5 * Math.sin(2 * p + 0.3) + 0.3 * Math.sin(3 * p + 1.1)) * (0.6 + 0.4 * a) * (0.35 + 0.65 * la) + rasp[i] * pulse * (0.15 + 0.5 * la);
    const sv = v / 7;
    tyre[i] *= 1.6 * Math.pow(sv, 1.4) * (1 + 0.08 * wv(te));
    spray[i] *= 0.5 * sv * sv;
  }
  SLX.bq(eng, 'lp', 900, 0.7, sr); SLX.bq(eng, 'lp', 1400, 0.7, sr);
  const src = new Float32Array(n); for (let i = 0; i < n; i++) src[i] = eng[i] * (o.engine ?? 0.55) + tyre[i] + spray[i];
  // carried to you
  const m = Math.ceil((o.t1 - o.t0) * sr), L = new Float32Array(m), R = new Float32Array(m);
  let te = o.t0 - b / c, lp = 0, lp2 = 0;
  for (let i = 0; i < m; i++) {
    const t = o.t0 + i / sr;
    for (let it = 0; it < 3; it++) { const x = o.x(te) - E[0], rr = Math.hypot(x, b), dr = x * -o.v(te) / rr; te -= (te + rr / c - t) / (1 + dr / c); }
    const x = o.x(te) - E[0], rr = Math.hypot(x, b), u = (te - te0) * sr, j = Math.floor(u), w = u - j;
    let s = j >= 0 && j + 1 < n ? src[j] * (1 - w) + src[j + 1] * w : 0;
    const fc = Math.min(16000, 9000 / (1 + rr / 25) + 1200), al = 1 - Math.exp(-2 * Math.PI * fc / sr);
    lp += (s - lp) * al; lp2 += (lp - lp2) * al; s = lp2 / Math.pow(Math.max(rr, 2.5), 0.75);   // (gentler than 1/r: a film mix, so a far car still reads)
    const pn = MathX.clamp(o.pan(o.x(te), t), -1, 1), an = (pn + 1) * Math.PI / 4;
    L[i] = s * Math.cos(an); R[i] = s * Math.sin(an);
  }
  return K.putLR(L, R, o.t0, { vol: o.vol || 1, fadeIn: 0.8, stop: o.t1, fade: 0.8 });
}

// a key ring shaken: a handful of small metal pieces knocking together over d seconds
function slKeys(fx, d, o = {}) {
  const sr = fx.sr, r = fx.r, y = fx.arr(d + 0.4);
  for (let t = 0; t < d; t += r.range(0.012, 0.07)) {
    const b = r.range(2400, 5200), x = fx.hit([[b, r.range(0.04, 0.12), 1], [b * r.range(2.4, 2.9), 0.04, 0.5], [b * r.range(4.8, 5.6), 0.02, 0.3]], { width: 0.00012 });
    slAddAt(y, x, t, r.range(0.2, 1) * Math.pow(Math.sin(Math.PI * Math.min(1, t / d)), 0.5), sr);
  }
  return y;
}
// a light switch (a rocker): the snap of the spring, the plate's knock
function slSwitch(fx, o = {}) {
  const sr = fx.sr, y = fx.hit([[o.f || 2100, 0.012, 1], [(o.f || 2100) * 1.9, 0.008, 0.6], [4800, 0.004, 0.4]], { width: 0.00015, noise: 0.5, nhp: 3500 });
  SLX.strike(y, 0, Math.round(0.0008 * sr), 0.5, [[310, 0.02, 1], [620, 0.012, 0.5]], sr);
  SLX.strike(y, Math.round(0.006 * sr), Math.round(0.0002 * sr), 0.35, [[3300, 0.006, 1]], sr);
  return y;
}

// where you are: t → 0…1, 1 while test(shot) holds (shots.js), with linear cross-fades `fade` s wide at the cuts
function slPlace(test, fade = 0.12) {
  const N = Math.ceil((SL.end + 3) * 100) + 2, a = new Float32Array(N + 1), w = Math.max(1, Math.round(fade * 100));
  for (let i = 0; i < N; i++) a[i + 1] = a[i] + (test(slShotAt(i / 100)) ? 1 : 0);
  const b = new Float32Array(N);
  for (let i = 0; i < N; i++) { const lo = Math.max(0, i - (w >> 1)), hi = Math.min(N, lo + w); b[i] = (a[hi] - a[lo]) / (hi - lo); }
  return (t) => { const u = MathX.clamp(t * 100, 0, N - 1.001), j = Math.floor(u), f = u - j; return b[j] * (1 - f) + b[j + 1] * f; };
}
// a few words of somebody else's conversation (random syllables), for crowds and the pub
function slChatter(r, nWords) {
  const S = ['ba', 'la', 'to', 'mi', 'ne', 'so', 'ka', 're', 'wo', 'di', 'fa', 'hu', 'ye', 'po', 'sha', 'tin', 'mar', 'lo', 'ven', 'de'];
  let s = ''; for (let k = 0; k < nWords; k++) { s += S[r.int(0, S.length - 1)] + (r.chance(0.4) ? S[r.int(0, S.length - 1)] : '') + (k === nWords - 1 ? r.pick(['.', '?', '!']) : r.chance(0.15) ? ', ' : ' '); }
  return s;
}

const SL_SOUND_FNS = [slEv, slWn, slVoice, slPhone, slWarpPut, slAddAt, slCrowdOoh, slClaps, slBang, slCarHeard, slKeys, slSwitch, slPlace, slChatter];
