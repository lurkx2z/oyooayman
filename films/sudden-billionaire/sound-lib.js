/* =====================================================================
   SOUND · LIB — the noise and filter generators the ambience and effects share (from the Slower light film, renamed
   sb*), and this film's own helpers. Every function here is listed in SB_SOUND_FNS at the end, so the baked
   soundtrack's fingerprint sees a change to any of them.
   ===================================================================== */

// ---- shared generators -------------------------------------------------------------------------------------------
// noise of a colour: 'white' | 'pink' | 'brown'
function sbNoise(fx, n, colour = 'white') {
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
function sbBed(K, t0, t1, o = {}) {
  const { fx, sr } = K, d = t1 - t0; if (d <= 0.02) return;
  const n = Math.ceil(d * sr), fi = o.fi ?? 0.04, fo = o.fo ?? 0.04;
  const mk = () => {
    const y = sbNoise(fx, n, o.colour || 'pink');
    for (const f of (o.f || [])) SBX.bq(y, f[0], f[1], f[2] || 0.7, sr, f[3] || 0);
    const w = fx.wander(o.wr || 0.35);
    for (let i = 0; i < n; i++) { const t = i / sr; y[i] *= (o.env ? o.env(t / d, t0 + t) : 1) * Math.min(1, t / fi, (d - t) / fo) * (1 + (o.am || 0) * w(t)); }
    return y;
  };
  if (o.mono) return K.put(mk(), t0, { vol: o.vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
  return K.putLR(mk(), mk(), t0, { vol: o.vol, norm: true, room: o.room, wet: o.wet });
}
// a tone with harmonics (hum, horn, motor): f(t) the pitch over the event (t from 0), harm [[k, a]], env(u)
function sbTone(K, t0, d, f, harm, env, o = {}) {
  const { fx, sr } = K, n = Math.ceil(d * sr), y = fx.arr(d);
  const F = typeof f === 'function' ? f : () => f, ph = harm.map(() => fx.r.range(0, 6.283));
  for (let i = 0; i < n; i++) {
    const t = i / sr, fr = F(t), e = env ? env(t / d, t) : Math.min(1, t / 0.05, (d - t) / 0.05);
    let v = 0; for (let k = 0; k < harm.length; k++) { ph[k] += 2 * Math.PI * fr * harm[k][0] / sr; v += harm[k][1] * Math.sin(ph[k]); }
    y[i] = v * e;
  }
  for (const fl of (o.f || [])) SBX.bq(y, fl[0], fl[1], fl[2] || 0.7, sr, fl[3] || 0);
  return K.put(y, t0, { vol: o.vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
}
// a bird: a quick chirp phrase (FM sine sweeps), o.f0 base pitch, o.n notes
function sbChirp(fx, o = {}) {
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
function sbCrackle(fx, d, o = {}) {
  const sr = fx.sr, r = fx.r, y = fx.arr(d + 0.02), n = Math.ceil(d * sr);
  for (let i = 0; i < n; i++) { const u = i / n; if (r.next() < (o.rate || 300) * (o.env ? o.env(u) : 1) / sr) { const a = Math.pow(r.next(), 3), L = r.int(8, 60); for (let k = 0; k < L && i + k < y.length; k++) y[i + k] += a * (r.next() * 2 - 1) * Math.exp(-k / (L * 0.3)); } }
  SBX.bq(y, 'hp', o.hp || 1500, 0.7, sr);
  return y;
}

// play x at t through a filter whose frequency follows curve (Hz, evenly spaced over x's length). The filter runs
// here (a biquad whose coefficients follow the curve every 32 samples), so the level is set from what comes OUT of it
function sbSweep(x, sr, type, q, curve) {
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
function sbSweepPut(K, x, t, type, q, curve, o = {}) {
  return K.put(sbSweep(x, K.sr, type, q, curve), t, { vol: (o.vol ?? 1) * (o.gain || 1), norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
}

const sbEv = (t, a, b) => MathX.smooth(t, a, b);                                       // 0 → 1 from a to b
const sbWn = (t, a, b, fi = 0.3, fo = 0.3) => sbEv(t, a - fi, a) * (1 - sbEv(t, b, b + fo));   // 1 inside [a, b]
function sbAddAt(dst, src, t, g, sr) { const i0 = Math.round(t * sr); for (let i = 0; i < src.length && i0 + i < dst.length; i++) if (i0 + i >= 0) dst[i0 + i] += src[i] * g; }

// ---- this film's own ------------------------------------------------------------------------------------------
// where the picture is: 0…1 over the shots that match pred (s → bool), with a short crossfade at each cut
function sbPlace(pred, xf = 0.06) {
  const W = SB_SHOTS.filter(pred).map((s) => [Math.max(-2, s.t0), Math.min(s.t1, SB.end + 5)]);
  return (t) => { let v = 0; for (const [a, b] of W) v += sbWn(t, a, b, xf, xf); return Math.min(1, v); };
}
// a level curve sampled once (200 Hz) and read back by linear interpolation: the beds read their envelopes per sample
function sbCurve(f, hz = 200) {
  const t0 = -2, n = Math.ceil((SB.end + 6 - t0) * hz), y = new Float32Array(n + 1);
  for (let i = 0; i <= n; i++) y[i] = f(t0 + i / hz);
  return (t) => { const x = MathX.clamp((t - t0) * hz, 0, n - 1e-6), i = Math.floor(x); return y[i] + (y[i + 1] - y[i]) * (x - i); };
}
// a cricket's chirp: three to five quick pulses of a ~4.6 kHz tone (o.f, o.n, o.pd pulse length, o.gap)
function sbCricket(fx, o = {}) {
  const sr = fx.sr, r = fx.r, f = o.f || r.range(4300, 4900), N = o.n || r.int(3, 5), pd = o.pd || 0.016, gap = o.gap || 0.011;
  const y = fx.arr(N * (pd + gap) + 0.03); let ph = 0;
  for (let k = 0; k < N; k++) { const i0 = Math.round(k * (pd + gap) * sr), n = Math.round(pd * sr); for (let i = 0; i < n; i++) { const u = i / n; ph += 2 * Math.PI * f * (1 + 0.01 * u) / sr; y[i0 + i] += Math.sin(ph) * Math.pow(Math.sin(Math.PI * u), 0.7) * (1 + 0.25 * Math.sin(ph * 2)); } }
  return y;
}
// a cat's voice ("mrrp", "miaow"): glottal pulses at f0(u) through two formants that open and close (o.d length,
// o.f0 [start, peak, end], o.open: how wide the mouth gets, o.thin: a little more breath than voice)
function sbMeow(fx, o = {}) {
  const sr = fx.sr, r = fx.r, d = o.d || 0.7, n = Math.ceil(d * sr), F = o.f0 || [480, 720, 420], src = new Float32Array(n);
  let ph = 0; const wv = fx.wander(6);
  for (let i = 0; i < n; i++) { const u = i / n, f = u < 0.35 ? F[0] + (F[1] - F[0]) * Math.sin(u / 0.35 * Math.PI / 2) : F[1] + (F[2] - F[1]) * Math.pow((u - 0.35) / 0.65, 1.3); ph += f * (1 + 0.015 * wv(i / sr)) / sr; if (ph >= 1) { ph -= 1; src[i] = 1; } src[i] += (o.thin || 0.08) * (r.next() * 2 - 1); }
  const op = o.open || 1, mouth = (u) => Math.sin(Math.PI * Math.min(1, u * 1.15)) * op;
  const a = sbSweep(src, sr, 'bandpass', 5, Array.from({ length: 16 }, (_, k) => 650 + 900 * mouth(k / 15)));
  const b = sbSweep(src, sr, 'bandpass', 7, Array.from({ length: 16 }, (_, k) => 1700 + 1300 * mouth(k / 15)));
  const y = fx.arr(d + 0.02); for (let i = 0; i < n; i++) { const u = i / n; y[i] = (a[i] + 0.6 * b[i]) * Math.min(1, u / 0.06) * Math.pow(1 - u, 0.6); }
  return y;
}

// ---- from the Slower light film (renamed): gulls, voices you can't make out, a phone's speaker, crowds, keys, switches
// a gull's cry: a falling series of short, raspy "kyow" notes (a saw, roughened at ~50 Hz, through a formant)
function sbGull(fx) {
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
  SBX.bq(y, 'peak', 1600, 1.4, sr, 9); SBX.bq(y, 'bp', 1700, 0.8, sr); SBX.bq(y, 'lp', 4500, 0.7, sr);
  return y;
}
// ---- a voice whose words you can't make out. The film has no narrator and no dialogue: what you hear is the shape
// of speech (through a phone, or through a wall). The text only drives the rhythm: vowels are vowels (formants),
// consonants are bursts, hisses and hums, spaces are word gaps, , . ? ! end phrases (? rises).
// o: f0 (Hz), fs (formant scale: 1 a man, ≈1.15 a woman), rate (×), breathy (0…1), hold (× vowel length), rise
const SB_VOW = { a: [760, 1250, 2600], e: [520, 1850, 2550], i: [330, 2250, 2950], o: [520, 900, 2450], u: [360, 950, 2350], y: [340, 2100, 2800] };
function sbVoice(fx, text, o = {}) {
  const sr = fx.sr, r = fx.r, fs = o.fs || 1, rate = o.rate || 1, hold = o.hold || 1, low = text.toLowerCase();
  const S = []; let stress = true, ph0 = 0;
  const nextV = (i) => { const m = low.slice(i + 1).match(/[aeiouy]/); return SB_VOW[m ? m[0] : 'a']; };
  for (let i = 0; i < low.length; i++) {
    const ch = low[i];
    if (SB_VOW[ch]) {
      let d = (stress ? 0.15 : 0.1) * hold;
      while (low[i + 1] === ch) { d += 0.08 * hold; i++; }
      S.push({ k: 'v', d: d / rate * r.range(0.85, 1.15), F: SB_VOW[ch], v: stress ? 1 : 0.78, st: stress ? 1 : 0 }); stress = false;
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
  let i0 = 0, last = SB_VOW.e, phStart = 0;
  const phraseEnds = []; { let tt = 0; for (const s of S) { tt += s.d; if (s.k === 'p') phraseEnds.push([tt - s.d, s.q]); } }
  let pe = 0;
  for (const s of S) {
    const m = Math.round(s.d * sr), F = s.F || last;
    while (pe < phraseEnds.length - 1 && i0 / sr > phraseEnds[pe][0]) { phStart = phraseEnds[pe][0]; pe++; }
    for (let k = 0; k < m && i0 + k < n; k++) {
      const j = i0 + k, u = k / m, t = j / sr, end = phraseEnds[pe] ? phraseEnds[pe][0] : D, up = MathX.clamp((t - phStart) / Math.max(0.2, end - phStart), 0, 1);
      F1[j] = F[0]; F2[j] = F[1]; F3[j] = F[2];
      let pit = 1.07 - 0.17 * up;                                                       // declination over the phrase
      if (phraseEnds[pe] && phraseEnds[pe][1]) pit *= 1 + 0.38 * sbEv(t, end - 0.35, end);   // a question rises
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
  SBX.bq(y, 'hp', 70, 0.7, sr);
  return y;
}
// a phone's little speaker and its codec: 300 Hz–3.4 kHz, a bit of honk, gently saturated. o.drop: the share of 20 ms
// packets lost (they're filled with a frozen, buzzy copy of the last one, the way a call breaks up)
function sbSpeaker(y, sr, o = {}) {
  SBX.bq(y, 'hp', 340, 0.7, sr); SBX.bq(y, 'hp', 340, 0.7, sr); SBX.bq(y, 'lp', 3300, 0.7, sr); SBX.bq(y, 'lp', 3300, 0.7, sr); SBX.bq(y, 'peak', 1700, 1.2, sr, 4);
  const pk = SBX.peak(y) || 1;
  for (let i = 0; i < y.length; i++) y[i] = Math.tanh(1.8 * y[i] / pk) / Math.tanh(1.8);
  if (o.drop) {
    const P = Math.round(0.02 * sr), r = new RNG(o.seed || 5);
    for (let p = P; p + P < y.length; p += P) if (r.next() < o.drop(p / sr)) for (let k = 0; k < P; k++) y[p + k] = y[p - P + (k % Math.round(P / 4))] * 0.6;
  }
  return y;
}
// ---- a crowd's "ooh" (people on the promenade seeing a burst): many voices on one long vowel, each its own pitch,
// starting a little apart; o.n voices, o.vowel, o.len (s), o.rise (the pitch swoop), returns stereo { L, R }
function sbCrowdOoh(fx, o = {}) {
  const sr = fx.sr, r = fx.r, len = o.len || 1.6, L = fx.arr(len + 0.8), R = fx.arr(len + 0.8);
  for (let k = 0; k < (o.n || 18); k++) {
    const woman = r.chance(0.5), vow = o.vowel || r.pick(['oooo', 'ooo', 'aaaa', 'oooh']);
    const y = sbVoice(fx, vow, { f0: (woman ? 215 : 118) * r.range(0.85, 1.2), fs: woman ? 1.15 : 1, hold: len * r.range(0.6, 1.0) / 0.4, breathy: 0.4 });
    // the swoop: up then down (applied as an amplitude shape; the pitch already falls)
    const t0 = r.range(0, 0.35) * (o.spread || 1);
    for (let i = 0; i < y.length; i++) { const u = i / y.length; y[i] *= Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.1)), 0.8); }
    SBX.mixIn(L, R, y, Math.round(t0 * sr), r.range(0.4, 1) / Math.sqrt(o.n || 18), r.range(-0.8, 0.8));
  }
  return { L, R };
}
// applause: many hands, each clapping at its own rate for a while
function sbClaps(fx, d, o = {}) {
  const sr = fx.sr, r = fx.r, L = fx.arr(d + 0.3), R = fx.arr(d + 0.3);
  for (let k = 0; k < (o.n || 30); k++) {
    const rate = r.range(3.5, 6), pan = r.range(-0.9, 0.9), f = r.range(900, 2200), stop = d * r.range(0.5, 1), a0 = r.range(0.3, 1);
    for (let t = r.range(0, 0.4); t < stop; t += 1 / rate * r.range(0.9, 1.1)) {
      const z = fx.white(Math.round(0.012 * sr)); for (let i = 0; i < z.length; i++) z[i] *= Math.exp(-i / (0.0025 * sr));
      SBX.bq(z, 'bp', f, 1.2, sr);
      SBX.mixIn(L, R, z, Math.round(t * sr), a0 * (1 - 0.6 * t / d) * r.range(0.7, 1), pan);
    }
  }
  return { L, R };
}
// a key ring shaken: a handful of small metal pieces knocking together over d seconds
function sbKeys(fx, d, o = {}) {
  const sr = fx.sr, r = fx.r, y = fx.arr(d + 0.4);
  for (let t = 0; t < d; t += r.range(0.012, 0.07)) {
    const b = r.range(2400, 5200), x = fx.hit([[b, r.range(0.04, 0.12), 1], [b * r.range(2.4, 2.9), 0.04, 0.5], [b * r.range(4.8, 5.6), 0.02, 0.3]], { width: 0.00012 });
    sbAddAt(y, x, t, r.range(0.2, 1) * Math.pow(Math.sin(Math.PI * Math.min(1, t / d)), 0.5), sr);
  }
  return y;
}
// a light switch (a rocker): the snap of the spring, the plate's knock
function sbSwitch(fx, o = {}) {
  const sr = fx.sr, y = fx.hit([[o.f || 2100, 0.012, 1], [(o.f || 2100) * 1.9, 0.008, 0.6], [4800, 0.004, 0.4]], { width: 0.00015, noise: 0.5, nhp: 3500 });
  SBX.strike(y, 0, Math.round(0.0008 * sr), 0.5, [[310, 0.02, 1], [620, 0.012, 0.5]], sr);
  SBX.strike(y, Math.round(0.006 * sr), Math.round(0.0002 * sr), 0.35, [[3300, 0.006, 1]], sr);
  return y;
}
// a few words of somebody else's conversation (random syllables), for crowds and the pub
function sbChatter(r, nWords) {
  const S = ['ba', 'la', 'to', 'mi', 'ne', 'so', 'ka', 're', 'wo', 'di', 'fa', 'hu', 'ye', 'po', 'sha', 'tin', 'mar', 'lo', 'ven', 'de'];
  let s = ''; for (let k = 0; k < nWords; k++) { s += S[r.int(0, S.length - 1)] + (r.chance(0.4) ? S[r.int(0, S.length - 1)] : '') + (k === nWords - 1 ? r.pick(['.', '?', '!']) : r.chance(0.15) ? ', ' : ' '); }
  return s;
}

const SB_SOUND_FNS = [sbNoise, sbBed, sbTone, sbChirp, sbCrackle, sbSweep, sbSweepPut, sbEv, sbWn, sbAddAt, sbPlace, sbCurve, sbCricket, sbMeow,
  sbGull, sbVoice, sbSpeaker, sbCrowdOoh, sbClaps, sbKeys, sbSwitch, sbChatter];
