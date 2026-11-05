/* =====================================================================
   SOUND · LIB — the noise and filter generators the ambience and effects share (the gravity films' sound kit, via the
   Air solid film, renamed mg*), and where the camera is: in your car, on the viaduct's deck, down by the river, beside
   flight 2207 in the air, in its cockpit or cabin, in the control tower, on the airfield, in the town, in the maternity
   ward. Every function here is listed in MG_SOUND_FNS at the end, so the baked soundtrack's fingerprint sees a change to
   any of them.
   ===================================================================== */

// ---- shared generators -------------------------------------------------------------------------------------------
// noise of a colour: 'white' | 'pink' | 'brown'
function mgNoise(fx, n, colour = 'white') {
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
function mgBed(K, t0, t1, o = {}) {
  const { fx, sr } = K, d = t1 - t0; if (d <= 0.02) return;
  const n = Math.ceil(d * sr), fi = o.fi ?? 0.04, fo = o.fo ?? 0.04;
  const mk = () => {
    const y = mgNoise(fx, n, o.colour || 'pink');
    for (const f of (o.f || [])) MGX.bq(y, f[0], f[1], f[2] || 0.7, sr, f[3] || 0);
    const w = fx.wander(o.wr || 0.35);
    for (let i = 0; i < n; i++) { const t = i / sr; y[i] *= (o.env ? o.env(t / d, t0 + t) : 1) * Math.min(1, t / fi, (d - t) / fo) * (1 + (o.am || 0) * w(t)); }
    return y;
  };
  if (o.mono) return K.put(mk(), t0, { vol: o.vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
  return K.putLR(mk(), mk(), t0, { vol: o.vol, norm: true, room: o.room, wet: o.wet });
}
// a tone with harmonics (hum, horn, motor): f(t) the pitch over the event (t from 0), harm [[k, a]], env(u)
function mgTone(K, t0, d, f, harm, env, o = {}) {
  const { fx, sr } = K, n = Math.ceil(d * sr), y = fx.arr(d);
  const F = typeof f === 'function' ? f : () => f, ph = harm.map(() => fx.r.range(0, 6.283));
  for (let i = 0; i < n; i++) {
    const t = i / sr, fr = F(t), e = env ? env(t / d, t) : Math.min(1, t / 0.05, (d - t) / 0.05);
    let v = 0; for (let k = 0; k < harm.length; k++) { ph[k] += 2 * Math.PI * fr * harm[k][0] / sr; v += harm[k][1] * Math.sin(ph[k]); }
    y[i] = v * e;
  }
  for (const fl of (o.f || [])) MGX.bq(y, fl[0], fl[1], fl[2] || 0.7, sr, fl[3] || 0);
  return K.put(y, t0, { vol: o.vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
}
// a bird: a quick chirp phrase (FM sine sweeps), o.f0 base pitch, o.n notes
function mgChirp(fx, o = {}) {
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
function mgCrackle(fx, d, o = {}) {
  const sr = fx.sr, r = fx.r, y = fx.arr(d + 0.02), n = Math.ceil(d * sr);
  for (let i = 0; i < n; i++) { const u = i / n; if (r.next() < (o.rate || 300) * (o.env ? o.env(u) : 1) / sr) { const a = Math.pow(r.next(), 3), L = r.int(8, 60); for (let k = 0; k < L && i + k < y.length; k++) y[i + k] += a * (r.next() * 2 - 1) * Math.exp(-k / (L * 0.3)); } }
  MGX.bq(y, 'hp', o.hp || 1500, 0.7, sr);
  return y;
}

// play x at t through a filter whose frequency follows curve (Hz, evenly spaced over x's length). The filter runs
// here (a biquad whose coefficients follow the curve every 32 samples), so the level is set from what comes OUT of it
function mgSweep(x, sr, type, q, curve) {
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
function mgSweepPut(K, x, t, type, q, curve, o = {}) {
  return K.put(mgSweep(x, K.sr, type, q, curve), t, { vol: (o.vol ?? 1) * (o.gain || 1), norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
}

const mgEv = (t, a, b) => MathX.smooth(t, a, b);                                       // 0 → 1 from a to b
const mgWn = (t, a, b, fi = 0.3, fo = 0.3) => mgEv(t, a - fi, a) * (1 - mgEv(t, b, b + fo));   // 1 inside [a, b]
function mgAddAt(dst, src, t, g, sr) { const i0 = Math.round(t * sr); for (let i = 0; i < src.length && i0 + i < dst.length; i++) if (i0 + i >= 0) dst[i0 + i] += src[i] * g; }
// a level curve sampled once (200 Hz) and read back by linear interpolation: the beds read their envelopes per sample
function mgCurve(f, hz = 200) {
  const t0 = -2, n = Math.ceil((MG.end + 6 - t0) * hz), y = new Float32Array(n + 1);
  for (let i = 0; i <= n; i++) y[i] = f(t0 + i / hz);
  return (t) => { const x = MathX.clamp((t - t0) * hz, 0, n - 1e-6), i = Math.floor(x); return y[i] + (y[i + 1] - y[i]) * (x - i); };
}

// ---- where the camera is ----------------------------------------------------------------------------------------
const MG_PLACE = {
  car: ['title', 'empty', 'cluster', 'grab', 'hands', 'epb', 'lorryPOV', 'stopPOV', 'radio', 'phone'],
  deck: ['ext1', 'lorryExt', 'cabIn', 'cabWide', 'carsWide', 'carsNew', 'carsOld', 'gantry', 'skyUp', 'walkDeck', 'walkLong', 'walkPOV', 'alertPhone', 'alertRead', 'finalVia', 'question'],
  river: ['trainHigh', 'trainCab', 'barge', 'bargeHit', 'leaders'],
  high: ['planeExt', 'planeMap', 'hold'],
  cockpit: ['cockpit', 'seats', 'cockpitDoor', 'fuel', 'cockpitApp', 'flaps', 'land3', 'finalCock'],
  cabin: ['cabinAisle', 'keypad', 'cabinPax', 'doorWait', 'cabinHalf'],
  tower: ['towerIn', 'radar', 'ctl', 'towerRead', 'finalTower'],
  field: ['towerExt', 'stack', 'touchdown'],
  town: ['town', 'house', 'townHigh', 'hospital'],
  ward: ['wardIn', 'birth', 'baby', 'wardWin'],
};
function mgWhereShot(sh) { if (sh.where) return sh.where; for (const [k, v] of Object.entries(MG_PLACE)) if (v.includes(sh.mode)) return k; return 'deck'; }
// the film as places: [{ t0, t1, where, shot }] in order
function mgPlaces() {
  if (mgPlaces._c) return mgPlaces._c;
  return (mgPlaces._c = MG_SHOTS.map((sh) => ({ t0: Math.max(-2, sh.t0), t1: Math.min(sh.t1, MG.end + 5), where: mgWhereShot(sh), shot: sh })));
}
// 0…1 over the shots at a place (or a list of modes), with a short crossfade at each cut
function mgPlaceAt(where, xf = 0.05) {
  const W = mgPlaces().filter((p) => (Array.isArray(where) ? where.includes(p.shot.mode) : p.where === where)).map((p) => [p.t0, p.t1]);
  return (t) => { let v = 0; for (const [a, b] of W) v += mgWn(t, a, b, xf, xf); return Math.min(1, v); };
}
// is story moment s on screen (the clock doesn't skip it), and when
function mgSeen(s) { const t = mgFilmAt(s); return Math.abs(mgStoryAt(t) - s) < 0.5 ? t : null; }
// how much an event is stretched (and lowered) while the clock runs slowly: 1 at real speed, 4× at most
const mgSlowK = (t) => Math.min(4, 1 / Math.max(0.25, mgRateAt(t + 1e-3)));

// ---- this film's sounds ------------------------------------------------------------------------------------------
// a roll (a marble on floorboards, tyres on asphalt): low rumbling noise whose level and brightness follow v(u) (0…1),
// with a tick at every seam (o.seam: seams per unit of distance)
function mgRoll(fx, d, o = {}) {
  const sr = fx.sr, n = Math.ceil(d * sr), y = mgNoise(fx, n, 'brown'), w = fx.white(n), v = o.v || (() => 1);
  let x = 0, next = 0.3;
  for (let i = 0; i < n; i++) { const u = i / n, vv = v(u); y[i] = y[i] * vv * (0.6 + 0.4 * Math.sin(i / sr * 30 * (1 + vv))) + w[i] * 0.05 * vv * vv; x += vv / sr * (o.seam || 4);
    if (x > next && o.seam) { next += 1; for (let k = 0; k < 300 && i + k < n; k++) y[i + k] += 0.6 * vv * Math.sin(2 * Math.PI * (o.tick || 900) * k / sr) * Math.exp(-k / 60); } }
  MGX.bq(y, 'lp', o.lp || 1600, 0.7, sr); if (o.hp) MGX.bq(y, 'hp', o.hp, 0.7, sr);
  return y;
}
// a scrape (heavy furniture across a floor, a tyre dragged sideways): stick-slip bursts, o.f the band (Hz), o.rate (Hz)
function mgScrape(fx, d, o = {}) {
  const sr = fx.sr, n = Math.ceil(d * sr), y = mgNoise(fx, n, 'pink'), r = fx.r, env = o.env || ((u) => Math.min(1, u * 8) * Math.min(1, (1 - u) * 6));
  let ph = 0, rate = o.rate || 18;
  for (let i = 0; i < n; i++) { ph += (rate * (0.8 + 0.4 * r.next())) / sr; const g = 0.35 + 0.65 * Math.pow(Math.abs(Math.sin(Math.PI * ph)), 6); y[i] *= g * env(i / n); }
  MGX.bq(y, 'bp', o.f || 700, o.q || 0.9, sr); MGX.bq(y, 'lp', (o.f || 700) * 3.5, 0.7, sr);
  return y;
}
// a car alarm: two tones swapping (o.f1, o.f2), on a pulse
function mgAlarm(fx, d, o = {}) {
  const sr = fx.sr, n = Math.ceil(d * sr), y = new Float32Array(n), f1 = o.f1 || 960, f2 = o.f2 || 760, per = o.per || 0.36;
  let ph = 0; for (let i = 0; i < n; i++) { const t = i / sr, k = Math.floor(t / per) % 2, f = k ? f1 : f2; ph += 2 * Math.PI * f / sr; y[i] = (Math.sin(ph) + 0.3 * Math.sin(3 * ph)) * Math.min(1, t / 0.05, (d - t) / 0.2) * (0.85 + 0.15 * Math.sin(2 * Math.PI * t / per)); }
  MGX.bq(y, 'bp', 1100, 0.6, sr); return y;
}
// a crack (stone, masonry): a broadband snap, a splintering crackle, a ringing body
function mgCrack(fx, o = {}) {
  const sr = fx.sr, d = o.len || 1.6, y = fx.arr(d), r = fx.r;
  for (let i = 0; i < d * sr; i++) { const t = i / sr; y[i] = (r.next() * 2 - 1) * (Math.exp(-t / 0.006) + 0.25 * Math.exp(-t / 0.15) * (r.next() < 0.08 ? 1 : 0.2)); }
  const b = fx.hit(fx.stoneModes(o.s || 0.7), { width: 0.002, amp: 0.8, noise: 0.2, nlen: 0.05, nhp: 300, len: d }); for (let i = 0; i < Math.min(b.length, y.length); i++) y[i] += b[i] * 0.8;
  return y;
}
// the car radio's song: a bright little pop song (F C Dm Bb at 104 bpm: kick, snare, hats, bass, off-beat chords, a
// tune) through the car's speakers. rate(t) is the song's speed at film time t (1 at real speed; slowed with the
// picture like tape in the slow minutes: pitch and tempo together). t0: the film time of sample 0; off: song time then
function mgRadioSong(fx, d, t0, rate, off = 0) {
  const sr = fx.sr, n = Math.ceil(d * sr), y = new Float32Array(n), beat = 60 / 104, bar = 4 * beat, r = new RNG(91);
  const prog = [[53, 60, 65, 69], [48, 55, 60, 64], [50, 57, 62, 65], [46, 53, 58, 62]];
  const mel = [72, 74, 76, 77, 76, 74, 72, 69, 67, 69, 72, 74, 72, 69, 67, 65, 69, 72, 74, 72, 74, 76, 74, 72, 70, 69, 67, 69, 65, 67, 69, 72];
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  let tau = off, pb = 0, pm = 0, pc = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    const k = rate(t0 + i / sr); tau += k / sr;
    const t = tau, b = Math.floor(t / bar) % 4, inBar = t % bar, e8 = t % (beat / 2), ch = prog[b];
    let v = 0;
    const kb = inBar % (2 * beat); if (kb < 0.25) v += 0.8 * Math.sin(2 * Math.PI * (52 * kb + 70 / 12 * (1 - Math.exp(-kb * 12)))) * Math.exp(-kb * 14);
    const sb = (inBar + beat) % (2 * beat); if (sb < 0.2) v += 0.3 * (r.next() * 2 - 1) * Math.exp(-sb * 25);
    if (e8 < 0.05) v += 0.1 * (r.next() * 2 - 1) * Math.exp(-e8 * 90);
    pb += 2 * Math.PI * hz(ch[0] - 12) * k / sr; v += 0.32 * Math.sin(pb) * Math.exp(-e8 * 5);
    const ob = (t + beat / 2) % beat; if (ob < 0.2) ch.slice(1).forEach((m, j) => { pc[j] += 2 * Math.PI * hz(m) * k / sr; v += 0.06 * (Math.sin(pc[j]) + 0.4 * Math.sin(3 * pc[j])) * Math.exp(-ob * 12); });
    const mi = Math.floor(t / beat) % 32, mt = t % beat; pm += 2 * Math.PI * hz(mel[mi]) * k / sr; v += 0.18 * (Math.sin(pm) + 0.25 * Math.sin(2 * pm)) * Math.min(1, mt / 0.012) * Math.exp(-mt * 2.2);
    y[i] = v;
  }
  MGX.bq(y, 'hp', 110, 0.7, sr); MGX.bq(y, 'lp', 5200, 0.7, sr); MGX.bq(y, 'pk', 900, 0.9, sr, 3);
  for (let i = 0; i < n; i++) y[i] = Math.tanh(1.3 * y[i]);
  return y;
}
// a voice on the radio, its words not made out: syllables (a pulse train through two vowel formants, a consonant's hiss
// before some), a pitch line that falls at the end of a phrase, band-limited to the radio's 300–3,000 Hz, a little
// distortion and hiss, the squelch's rush at the end. o.f0: pitch (Hz); o.syl: syllables per second
function mgRadioVoice(fx, d, o = {}) {
  const sr = fx.sr, r = fx.r, n = Math.ceil((d + 0.2) * sr), y = new Float32Array(n), f0 = o.f0 || 210, rate = o.syl || 5.2;
  const V = [[750, 1250], [420, 2100], [330, 900], [600, 1750], [520, 1050], [300, 2300], [680, 1500]];
  let t = 0.04, ph = 0;
  while (t < d - 0.12) {
    const L = r.range(0.7, 1.3) / rate, m = Math.round(L * sr), i0 = Math.round(t * sr), [F1, F2] = V[r.int(0, V.length - 1)], u0 = t / d;
    const z = new Float32Array(m);
    for (let i = 0; i < m; i++) { const u = i / m, f = f0 * (1 + 0.12 * Math.sin(Math.PI * u) - 0.18 * u0 * u0 + 0.03 * Math.sin(i / sr * 31)); ph += f / sr; z[i] = ((ph % 1) * 2 - 1) * Math.sin(Math.PI * Math.min(1, u * 1.25)) ** 0.7; }
    const a = Float32Array.from(z), b = Float32Array.from(z); MGX.bq(a, 'bp', F1, 4, sr); MGX.bq(b, 'bp', F2, 5, sr);
    for (let i = 0; i < m && i0 + i < n; i++) y[i0 + i] += a[i] + 0.7 * b[i];
    if (r.next() < 0.45) { const c = Math.round(0.04 * sr), w = fx.white(c); MGX.bq(w, 'hp', 2600, 0.7, sr); for (let i = 0; i < c && i0 + i < n; i++) y[i0 + i] += 0.35 * w[i] * Math.sin(Math.PI * i / c); }
    t += L + (r.next() < 0.18 ? r.range(0.12, 0.3) : 0.01);
  }
  const hiss = fx.white(n); for (let i = 0; i < n; i++) { const tt = i / sr; y[i] += 0.05 * hiss[i] + (tt > d ? 0.5 * hiss[i] * Math.exp(-(tt - d) / 0.06) : 0); }
  MGX.bq(y, 'hp', 340, 0.7, sr); MGX.bq(y, 'lp', 2900, 0.7, sr); MGX.bq(y, 'pk', 1700, 1, sr, 4);
  let pk = 0; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(y[i])); for (let i = 0; i < n; i++) y[i] = Math.tanh(2.2 * y[i] / pk);
  const on = Math.round(0.006 * sr); for (let i = 0; i < on; i++) y[i] *= i / on;
  return y;
}
// a newborn's cry: breaths of crying (a bright harmonic voice near 450 Hz, its pitch arching up and down, a fast
// vibrato, a little roughness) with short catches of breath between them. Soft: he is a minute old
function mgCry(fx, d, o = {}) {
  const sr = fx.sr, r = fx.r, n = Math.ceil(d * sr), y = new Float32Array(n);
  let t = o.delay || 0.1;
  while (t < d - 0.5) {
    const L = Math.min(d - t - 0.1, r.range(0.75, 1.25)), m = Math.round(L * sr), i0 = Math.round(t * sr), f0 = r.range(420, 500), z = new Float32Array(m), ph = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < m; i++) { const u = i / m, f = f0 * (1 + 0.16 * Math.sin(Math.PI * Math.pow(u, 0.7)) - 0.1 * u) * (1 + 0.025 * Math.sin(2 * Math.PI * 7.3 * i / sr)), e = Math.min(1, u / 0.08) * Math.min(1, (1 - u) / 0.15);
      let v = 0; for (let k = 0; k < 10; k++) { ph[k] += 2 * Math.PI * f * (k + 1) / sr; v += Math.sin(ph[k]) / (k + 1) ** 0.8; }
      z[i] = v * e * (0.85 + 0.15 * Math.sin(2 * Math.PI * f * 0.5 * i / sr)); }
    const a = Float32Array.from(z); MGX.bq(z, 'bp', 1150, 1.6, sr); MGX.bq(a, 'bp', 3200, 2.2, sr);
    for (let i = 0; i < m && i0 + i < n; i++) y[i0 + i] += z[i] + 0.5 * a[i];
    // the catch of breath
    const bi = i0 + m, bm = Math.round(0.28 * sr), w = fx.white(bm); MGX.bq(w, 'bp', 1800, 1.2, sr);
    for (let i = 0; i < bm && bi + i < n; i++) y[bi + i] += 0.12 * w[i] * Math.sin(Math.PI * i / bm);
    t += L + r.range(0.35, 0.55);
  }
  return y;
}
// an airliner going past a listener: its roar (rumble behind it, a broad hiss), its fans' whine (heard more ahead of
// it), each delayed by the sound's travel time, Doppler-shifted, quieter and duller with distance. at(s) → the plane's
// position [x, y, z] at story time s; L the listener; t0…t1 film time; o.glass: through a window (duller, quieter)
function mgJetBy(K, t0, t1, at, L, o = {}) {
  const { fx, sr } = K, d = t1 - t0, n = Math.ceil(d * sr), C = 343, hz = 200, m = Math.ceil(d * hz) + 2;
  const G = new Float32Array(m), W = new Float32Array(m), R = new Float32Array(m), D = new Float32Array(m), F = new Float32Array(m);
  for (let j = 0; j < m; j++) {
    const s = mgStoryAt(t0 + j / hz); let te = s;
    for (let k = 0; k < 3; k++) { const p = at(te); te = s - Math.hypot(p[0] - L[0], p[1] - L[1], p[2] - L[2]) / C; }
    const p = at(te), q = at(te + 0.05), dist = Math.max(25, Math.hypot(p[0] - L[0], p[1] - L[1], p[2] - L[2]));
    const ux = (L[0] - p[0]) / dist, uy = (L[1] - p[1]) / dist, uz = (L[2] - p[2]) / dist, vr = ((q[0] - p[0]) * ux + (q[1] - p[1]) * uy + (q[2] - p[2]) * uz) / 0.05;
    const g = Math.min(1, 70 / dist) * (o.gain || 1);
    G[j] = g; D[j] = C / Math.max(80, C - vr); W[j] = g * (vr > 0 ? 1 : 0.35); R[j] = g * (vr > 0 ? 0.55 : 1); F[j] = Math.min(9000, 700 + 7000 * Math.min(1, 220 / dist)) * (o.glass ? 0.25 : 1);
  }
  const at2 = (A, i) => { const x = i / sr * hz, j = Math.min(m - 2, Math.floor(x)); return A[j] + (A[j + 1] - A[j]) * (x - j); };
  const roar = mgNoise(fx, n, 'pink'), rum = mgNoise(fx, n, 'brown'), y = new Float32Array(n);
  const curve = []; for (let j = 0; j < m; j += 4) curve.push(F[j]);
  const rf = mgSweep(roar, sr, 'lowpass', 0.7, curve); MGX.bq(rum, 'lp', 140, 0.7, sr);
  let p1 = 0, p2 = 0;
  for (let i = 0; i < n; i++) {
    const g = at2(G, i), w = at2(W, i), rr = at2(R, i), dd = at2(D, i); p1 += 2 * Math.PI * 2380 * dd / sr; p2 += 2 * Math.PI * 1190 * dd / sr;
    const e = Math.min(1, i / (0.08 * sr), (n - i) / (0.08 * sr));
    y[i] = e * (0.55 * g * rf[i] + 1.1 * rr * rum[i] + 0.06 * w * (Math.sin(p1) + 0.6 * Math.sin(p2) + 0.3 * Math.sin(1.5 * p1)));
  }
  if (o.glass) { MGX.bq(y, 'lp', 900, 0.7, sr); }
  return K.put(y, t0, { vol: o.vol ?? 0.5, norm: o.norm ?? 1, pan: o.pan || 0, room: o.room, wet: o.wet });
}
const MG_SOUND_FNS = [mgRadioSong, mgRadioVoice, mgCry, mgJetBy, mgNoise, mgBed, mgTone, mgChirp, mgCrackle, mgSweep, mgSweepPut, mgAddAt, mgPlaceAt, mgSeen, mgSlowK, mgCurve, mgWhereShot, mgPlaces, mgRoll, mgScrape, mgAlarm, mgCrack, mgEv, mgWn];
