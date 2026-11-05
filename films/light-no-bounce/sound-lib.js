/* =====================================================================
   SOUND · LIB — the noise and filter generators the ambience and effects share (the gravity films' sound kit, via the
   Air solid film), where the camera is (the fair, the fence over the valley, a car, the motorway's verge, a flight deck,
   the control tower, beside the plane, the rollercoaster, the space station), and how fast the world's own sounds run. Every function here is listed in NB_SOUND_FNS at the end,
   so the baked soundtrack's fingerprint sees a change to any of them.
   ===================================================================== */

// ---- shared generators -------------------------------------------------------------------------------------------
// noise of a colour: 'white' | 'pink' | 'brown'
function nbNoise(fx, n, colour = 'white') {
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
function nbBed(K, t0, t1, o = {}) {
  const { fx, sr } = K, d = t1 - t0; if (d <= 0.02) return;
  const n = Math.ceil(d * sr), fi = o.fi ?? 0.04, fo = o.fo ?? 0.04;
  const mk = () => {
    const y = nbNoise(fx, n, o.colour || 'pink');
    for (const f of (o.f || [])) NBX.bq(y, f[0], f[1], f[2] || 0.7, sr, f[3] || 0);
    const w = fx.wander(o.wr || 0.35);
    for (let i = 0; i < n; i++) { const t = i / sr; y[i] *= (o.env ? o.env(t / d, t0 + t) : 1) * Math.min(1, t / fi, (d - t) / fo) * (1 + (o.am || 0) * w(t)); }
    return y;
  };
  if (o.mono) return K.put(mk(), t0, { vol: o.vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
  return K.putLR(mk(), mk(), t0, { vol: o.vol, norm: true, room: o.room, wet: o.wet });
}
// a tone with harmonics (hum, horn, motor): f(t) the pitch over the event (t from 0), harm [[k, a]], env(u)
function nbTone(K, t0, d, f, harm, env, o = {}) {
  const { fx, sr } = K, n = Math.ceil(d * sr), y = fx.arr(d);
  const F = typeof f === 'function' ? f : () => f, ph = harm.map(() => fx.r.range(0, 6.283));
  for (let i = 0; i < n; i++) {
    const t = i / sr, fr = F(t), e = env ? env(t / d, t) : Math.min(1, t / 0.05, (d - t) / 0.05);
    let v = 0; for (let k = 0; k < harm.length; k++) { ph[k] += 2 * Math.PI * fr * harm[k][0] / sr; v += harm[k][1] * Math.sin(ph[k]); }
    y[i] = v * e;
  }
  for (const fl of (o.f || [])) NBX.bq(y, fl[0], fl[1], fl[2] || 0.7, sr, fl[3] || 0);
  return K.put(y, t0, { vol: o.vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
}
// a bird: a quick chirp phrase (FM sine sweeps), o.f0 base pitch, o.n notes
function nbChirp(fx, o = {}) {
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
function nbCrackle(fx, d, o = {}) {
  const sr = fx.sr, r = fx.r, y = fx.arr(d + 0.02), n = Math.ceil(d * sr);
  for (let i = 0; i < n; i++) { const u = i / n; if (r.next() < (o.rate || 300) * (o.env ? o.env(u) : 1) / sr) { const a = Math.pow(r.next(), 3), L = r.int(8, 60); for (let k = 0; k < L && i + k < y.length; k++) y[i + k] += a * (r.next() * 2 - 1) * Math.exp(-k / (L * 0.3)); } }
  NBX.bq(y, 'hp', o.hp || 1500, 0.7, sr);
  return y;
}

// play x at t through a filter whose frequency follows curve (Hz, evenly spaced over x's length). The filter runs
// here (a biquad whose coefficients follow the curve every 32 samples), so the level is set from what comes OUT of it
function nbSweep(x, sr, type, q, curve) {
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
function nbSweepPut(K, x, t, type, q, curve, o = {}) {
  return K.put(nbSweep(x, K.sr, type, q, curve), t, { vol: (o.vol ?? 1) * (o.gain || 1), norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
}

const nbEv = (t, a, b) => MathX.smooth(t, a, b);                                       // 0 → 1 from a to b
const nbWn = (t, a, b, fi = 0.3, fo = 0.3) => nbEv(t, a - fi, a) * (1 - nbEv(t, b, b + fo));   // 1 inside [a, b]
function nbAddAt(dst, src, t, g, sr) { const i0 = Math.round(t * sr); for (let i = 0; i < src.length && i0 + i < dst.length; i++) if (i0 + i >= 0) dst[i0 + i] += src[i] * g; }
// a level curve sampled once (200 Hz) and read back by linear interpolation: the beds read their envelopes per sample
function nbCurve(f, hz = 200) {
  const t0 = -2, n = Math.ceil((NB.end + 6 - t0) * hz), y = new Float32Array(n + 1);
  for (let i = 0; i <= n; i++) y[i] = f(t0 + i / hz);
  return (t) => { const x = MathX.clamp((t - t0) * hz, 0, n - 1e-6), i = Math.floor(x); return y[i] + (y[i + 1] - y[i]) * (x - i); };
}

// ---- where the camera is ----------------------------------------------------------------------------------------
const NB_PLACE = {
  edge: ['moon', 'moongone', 'valley', 'netWide', 'saturn', 'moonback', 'crash', 'echo', 'echoSat', 'planeHill'],   // the fence over the valley
  car: ['driver'], verge: ['verge'], cockpit: ['approach'], tower: ['tower'], sky: ['planeSide'], ride: ['coasterPOV'], space: ['space'],
};
function nbWhereShot(sh) { if (sh.where) return sh.where; for (const [k, v] of Object.entries(NB_PLACE)) if (v.includes(sh.mode)) return k; return 'fair'; }
// the film as places: [{ t0, t1, where, shot }] in order
function nbPlaces() {
  if (nbPlaces._c) return nbPlaces._c;
  return (nbPlaces._c = NB_SHOTS.map((sh) => ({ t0: Math.max(-2, sh.t0), t1: Math.min(sh.t1, NB.end + 5), where: nbWhereShot(sh), shot: sh })));
}
// 0…1 over the shots at a place (or a list of modes), with a short crossfade at each cut
function nbPlaceAt(where, xf = 0.05) {
  const W = nbPlaces().filter((p) => (Array.isArray(where) ? where.includes(p.shot.mode) : p.where === where)).map((p) => [p.t0, p.t1]);
  return (t) => { let v = 0; for (const [a, b] of W) v += nbWn(t, a, b, xf, xf); return Math.min(1, v); };
}
// is story moment s on screen (the clock doesn't skip it), and when
function nbSeen(s) { const t = nbFilmAt(s); return Math.abs(nbStoryAt(t) - s) < 0.5 ? t : null; }
// how much an event is stretched (and lowered) while the clock runs slowly: 1 at real speed, 4× at most
const nbSlowK = (t) => Math.min(4, 1 / Math.max(0.25, nbRateAt(t + 1e-3)));

// ---- this film's sounds ------------------------------------------------------------------------------------------
// a roll (a marble on floorboards, tyres on asphalt): low rumbling noise whose level and brightness follow v(u) (0…1),
// with a tick at every seam (o.seam: seams per unit of distance)
function nbRoll(fx, d, o = {}) {
  const sr = fx.sr, n = Math.ceil(d * sr), y = nbNoise(fx, n, 'brown'), w = fx.white(n), v = o.v || (() => 1);
  let x = 0, next = 0.3;
  for (let i = 0; i < n; i++) { const u = i / n, vv = v(u); y[i] = y[i] * vv * (0.6 + 0.4 * Math.sin(i / sr * 30 * (1 + vv))) + w[i] * 0.05 * vv * vv; x += vv / sr * (o.seam || 4);
    if (x > next && o.seam) { next += 1; for (let k = 0; k < 300 && i + k < n; k++) y[i + k] += 0.6 * vv * Math.sin(2 * Math.PI * (o.tick || 900) * k / sr) * Math.exp(-k / 60); } }
  NBX.bq(y, 'lp', o.lp || 1600, 0.7, sr); if (o.hp) NBX.bq(y, 'hp', o.hp, 0.7, sr);
  return y;
}
// a scrape (heavy furniture across a floor, a tyre dragged sideways): stick-slip bursts, o.f the band (Hz), o.rate (Hz)
function nbScrape(fx, d, o = {}) {
  const sr = fx.sr, n = Math.ceil(d * sr), y = nbNoise(fx, n, 'pink'), r = fx.r, env = o.env || ((u) => Math.min(1, u * 8) * Math.min(1, (1 - u) * 6));
  let ph = 0, rate = o.rate || 18;
  for (let i = 0; i < n; i++) { ph += (rate * (0.8 + 0.4 * r.next())) / sr; const g = 0.35 + 0.65 * Math.pow(Math.abs(Math.sin(Math.PI * ph)), 6); y[i] *= g * env(i / n); }
  NBX.bq(y, 'bp', o.f || 700, o.q || 0.9, sr); NBX.bq(y, 'lp', (o.f || 700) * 3.5, 0.7, sr);
  return y;
}
// a car alarm: two tones swapping (o.f1, o.f2), on a pulse
function nbAlarm(fx, d, o = {}) {
  const sr = fx.sr, n = Math.ceil(d * sr), y = new Float32Array(n), f1 = o.f1 || 960, f2 = o.f2 || 760, per = o.per || 0.36;
  let ph = 0; for (let i = 0; i < n; i++) { const t = i / sr, k = Math.floor(t / per) % 2, f = k ? f1 : f2; ph += 2 * Math.PI * f / sr; y[i] = (Math.sin(ph) + 0.3 * Math.sin(3 * ph)) * Math.min(1, t / 0.05, (d - t) / 0.2) * (0.85 + 0.15 * Math.sin(2 * Math.PI * t / per)); }
  NBX.bq(y, 'bp', 1100, 0.6, sr); return y;
}
// a crack (stone, masonry): a broadband snap, a splintering crackle, a ringing body
function nbCrack(fx, o = {}) {
  const sr = fx.sr, d = o.len || 1.6, y = fx.arr(d), r = fx.r;
  for (let i = 0; i < d * sr; i++) { const t = i / sr; y[i] = (r.next() * 2 - 1) * (Math.exp(-t / 0.006) + 0.25 * Math.exp(-t / 0.15) * (r.next() < 0.08 ? 1 : 0.2)); }
  const b = fx.hit(fx.stoneModes(o.s || 0.7), { width: 0.002, amp: 0.8, noise: 0.2, nlen: 0.05, nhp: 300, len: d }); for (let i = 0; i < Math.min(b.length, y.length); i++) y[i] += b[i] * 0.8;
  return y;
}
// the beach party's song: a little pop song (G D Em C at 112 bpm: kick, snare, hats, bass, off-beat chords, a tune),
// through a small speaker. o.offset: where in the song it starts (s)
function nbPartySong(fx, d, o = {}) {
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
  NBX.bq(y, 'hp', 320, 0.7, sr); NBX.bq(y, 'lp', 3600, 0.7, sr); NBX.bq(y, 'pk', 1400, 1.0, sr, 4);
  for (let i = 0; i < n; i++) y[i] = Math.tanh(1.6 * y[i]);
  return y;
}

// ---- how fast the world's own sounds run (the picture's slow motion, made audible): 1 at real speed; a quarter while
// nothing bounces (any slower and they would sink below hearing); rising through the count; snapping back at 3:30:10
function nbWorldRate(t) {
  const T0 = NB.tLock, tc = nbB('count'), tb = nbFilmAt(NBP.T);
  if (t < T0) return 1;
  if (t < T0 + 1.6) return 1 - 0.75 * MathX.smooth(t, T0, T0 + 1.6);
  if (t < tc) return 0.25;
  if (t < tb) return 0.25 + 0.17 * (t - tc) / (tb - tc);
  if (t < tb + 0.4) return 0.42 + 0.58 * MathX.smooth(t, tb, tb + 0.4);
  return 1;
}
// a reed pipe's wave (one period, 2048 samples): odd harmonics strong, even ones softer (a fairground organ)
const NB_REED = (() => { const n = 2048, y = new Float32Array(n); for (let i = 0; i < n; i++) { const p = 2 * Math.PI * i / n; let v = 0; for (let k = 1; k <= 12; k++) v += (k % 2 ? 1 : 0.45) * Math.sin(k * p) / Math.pow(k, 0.95); y[i] = v * 0.5; } return y; })();
// the carousel's band organ: a waltz in C at 168 bpm (an oom-pah-pah bass, reedy chords, a pipe melody, a glockenspiel
// on the first beat), its clock running at rate(t): slowed, the waltz drags and sinks like a tape running down
function nbOrgan(fx, t0, t1, rate, o = {}) {
  const sr = fx.sr, n = Math.ceil((t1 - t0) * sr), L = new Float32Array(n), R = new Float32Array(n), W = NB_REED, WN = W.length;
  const beat = 60 / 168, prog = [[36, 52, 55, 60], [36, 52, 55, 60], [43, 50, 53, 59], [43, 50, 53, 59], [41, 53, 57, 60], [41, 53, 57, 60], [43, 50, 53, 59], [36, 52, 55, 60]];
  const mel = [67, 72, 76, 79, 76, 72, 74, 71, 67, 65, 67, 71, 69, 72, 77, 81, 77, 72, 74, 71, 67, 72, 67, 64];   // one note a beat, 8 bars
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12), ph = new Float64Array(6);
  let u = (o.offset || 0), r = rate(t0), glk = 0, gph = 0;
  for (let i = 0; i < n; i++) {
    if ((i & 63) === 0) r = rate(t0 + i / sr);
    u += r / sr;
    const b = Math.floor(u / beat), w = (u - b * beat) / beat, bar = Math.floor(b / 3) % 8, bb = b % 3, ch = prog[bar];
    let l = 0, rr = 0;
    // the bass on one, the chord on two and three ("pah"), short and bright
    { const f = hz(ch[0] - 12) * r; ph[0] = (ph[0] + f * WN / sr) % WN; const e = bb === 0 ? Math.exp(-w * 2.2) : 0; const v = W[ph[0] | 0] * e * 0.55; l += v; rr += v; }
    if (bb > 0) { const e = Math.min(1, w * 40) * Math.exp(-w * 5); for (let k = 1; k < 4; k++) { const f = hz(ch[k]) * r; ph[k] = (ph[k] + f * WN / sr) % WN; const v = W[ph[k] | 0] * e * 0.16; l += v * (k === 1 ? 1.2 : 0.8); rr += v * (k === 3 ? 1.2 : 0.8); } }
    // the melody (a pipe with a slow tremolo), legato
    { const m = mel[b % 24], f = hz(m) * r; ph[4] = (ph[4] + f * (1 + 0.004 * Math.sin(u * 37)) * WN / sr) % WN; const e = Math.min(1, w * 25) * (0.75 + 0.25 * Math.exp(-w * 3)); const v = W[ph[4] | 0] * e * 0.3; l += v * 0.9; rr += v * 1.1; }
    // a glockenspiel strike on each bar's first beat
    if (bb === 0 && w < 0.004) { glk = 1; gph = 0; }
    if (glk > 0.001) { gph += 2 * Math.PI * hz(mel[b % 24] + 12) * r / sr; const v = Math.sin(gph) * glk * 0.22; l += v; rr += v; glk *= Math.exp(-4 * r / sr); }
    L[i] = l; R[i] = rr;
  }
  NBX.bq(L, 'lp', o.lp || 5200, 0.7, sr); NBX.bq(R, 'lp', o.lp || 5200, 0.7, sr);
  return [L, R];
}
// a voice (a cry, a gasp, a groan): glottal pulses at f0(u) through formants [[f, q, a]] (all scaled by k: a slowed
// voice drops in pitch), with breath; env(u)
function nbVoice(fx, d, o = {}) {
  const sr = fx.sr, n = Math.ceil(d * sr), r = fx.r, src = new Float32Array(n), k = o.k || 1, f0 = o.f0 || (() => 300), wv = fx.wander(3);
  let ph = 0; for (let i = 0; i < n; i++) { const u = i / n; ph += f0(u) * k * (1 + 0.025 * wv(i / sr)) / sr; if (ph >= 1) { ph -= 1; src[i] = 1; } src[i] += (r.next() * 2 - 1) * (o.breath ?? 0.08); }
  const y = new Float32Array(n), F = o.formants || [[800, 5, 1], [1250, 6, 0.6], [2700, 7, 0.3]];
  for (const [f, q, a] of F) { const z = Float32Array.from(src); NBX.bq(z, 'bp', f * k, q, sr); for (let i = 0; i < n; i++) y[i] += z[i] * a; }
  const env = o.env || ((u) => Math.min(1, u / 0.15) * Math.pow(1 - u, 0.8));
  for (let i = 0; i < n; i++) y[i] *= env(i / n);
  return y;
}
// a crowd crying out: many voices, staggered, of every pitch (k < 1: slowed), spread across the stereo field
function nbCrowdCry(K, t, o = {}) {
  const fx = K.fx, r = fx.r, k = o.k || 1, N = o.n || 16, d = (o.d || 1.6) / k, Ls = fx.arr(d + (o.spread || 0.8) / k + 0.1), Rs = fx.arr(d + (o.spread || 0.8) / k + 0.1);
  for (let v = 0; v < N; v++) {
    const f = r.range(o.lo || 260, o.hi || 640), dd = d * r.range(0.6, 1.1), on = r.range(0, (o.spread || 0.8) / k), fm = r.range(0.9, 1.2);
    const y = nbVoice(fx, dd, { k, f0: (u) => f * (1 + 0.18 * Math.sin(Math.PI * u) * fm - 0.1 * u), formants: [[r.range(700, 950), 5, 1], [r.range(1100, 1500), 6, 0.6], [r.range(2500, 3000), 7, 0.25]], breath: 0.15,
      env: (u) => Math.min(1, u / 0.12) * Math.pow(1 - u, 1.1) });
    const pan = r.range(-0.8, 0.8), gL = Math.cos((pan + 1) * Math.PI / 4), gR = Math.sin((pan + 1) * Math.PI / 4), i0 = Math.round(on * fx.sr), a = r.range(0.4, 1);
    for (let i = 0; i < y.length && i0 + i < Ls.length; i++) { Ls[i0 + i] += y[i] * gL * a; Rs[i0 + i] += y[i] * gR * a; }
  }
  return K.putLR(Ls, Rs, t, { vol: o.vol ?? 0.5, norm: true, room: o.room, wet: o.wet });
}
const NB_SOUND_FNS = [nbWorldRate, nbOrgan, nbVoice, nbCrowdCry, nbPartySong, nbNoise, nbBed, nbTone, nbChirp, nbCrackle, nbSweep, nbSweepPut, nbAddAt, nbPlaceAt, nbSeen, nbSlowK, nbCurve, nbWhereShot, nbPlaces, nbRoll, nbScrape, nbAlarm, nbCrack, nbEv, nbWn];
