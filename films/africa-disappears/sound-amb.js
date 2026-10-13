/* =====================================================================
   SOUND · AMBIENCE — the places, one bed per shot (hard cuts with the picture, a few ms of fade against clicks):
   space, the veld at the mine (and the wind of the void after it), the car plant, the dead hall, the trade map,
   the airport, the port, the supermarket, the roar of the oceans pouring in, the storm, the dawn rainforest, the
   savanna at dusk, the high winds, the briefing room, the night kitchen, the drying coast.
   Generators shared with sound-sfx.js are defined here (this file loads first).
   ===================================================================== */

// ---- shared generators -------------------------------------------------------------------------------------------
// noise of a colour: 'white' | 'pink' | 'brown'
function afNoise(fx, n, colour = 'white') {
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
function afBed(K, t0, t1, o = {}) {
  const { fx, sr } = K, d = t1 - t0; if (d <= 0.02) return;
  const n = Math.ceil(d * sr), fi = o.fi ?? 0.04, fo = o.fo ?? 0.04;
  const mk = () => {
    const y = afNoise(fx, n, o.colour || 'pink');
    for (const f of (o.f || [])) GBX.bq(y, f[0], f[1], f[2] || 0.7, sr, f[3] || 0);
    const w = fx.wander(o.wr || 0.35);
    for (let i = 0; i < n; i++) { const t = i / sr; y[i] *= (o.env ? o.env(t / d, t0 + t) : 1) * Math.min(1, t / fi, (d - t) / fo) * (1 + (o.am || 0) * w(t)); }
    return y;
  };
  if (o.mono) return K.put(mk(), t0, { vol: o.vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
  return K.putLR(mk(), mk(), t0, { vol: o.vol, norm: true, room: o.room, wet: o.wet });
}
// a tone with harmonics (hum, horn, motor): f(t) the pitch over the event (t from 0), harm [[k, a]], env(u)
function afTone(K, t0, d, f, harm, env, o = {}) {
  const { fx, sr } = K, n = Math.ceil(d * sr), y = fx.arr(d);
  const F = typeof f === 'function' ? f : () => f, ph = harm.map(() => fx.r.range(0, 6.283));
  for (let i = 0; i < n; i++) {
    const t = i / sr, fr = F(t), e = env ? env(t / d, t) : Math.min(1, t / 0.05, (d - t) / 0.05);
    let v = 0; for (let k = 0; k < harm.length; k++) { ph[k] += 2 * Math.PI * fr * harm[k][0] / sr; v += harm[k][1] * Math.sin(ph[k]); }
    y[i] = v * e;
  }
  for (const fl of (o.f || [])) GBX.bq(y, fl[0], fl[1], fl[2] || 0.7, sr, fl[3] || 0);
  return K.put(y, t0, { vol: o.vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
}
// a bird: a quick chirp phrase (FM sine sweeps), o.f0 base pitch, o.n notes
function afChirp(fx, o = {}) {
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
function afGull(fx) {
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
  GBX.bq(y, 'peak', 1600, 1.4, sr, 9); GBX.bq(y, 'bp', 1700, 0.8, sr); GBX.bq(y, 'lp', 4500, 0.7, sr);
  return y;
}
// an electric fizz: dense crackle with random sizes, o.env(u) shapes it, o.rate (clicks/s), o.hp
function afCrackle(fx, d, o = {}) {
  const sr = fx.sr, r = fx.r, y = fx.arr(d + 0.02), n = Math.ceil(d * sr);
  for (let i = 0; i < n; i++) { const u = i / n; if (r.next() < (o.rate || 300) * (o.env ? o.env(u) : 1) / sr) { const a = Math.pow(r.next(), 3), L = r.int(8, 60); for (let k = 0; k < L && i + k < y.length; k++) y[i + k] += a * (r.next() * 2 - 1) * Math.exp(-k / (L * 0.3)); } }
  GBX.bq(y, 'hp', o.hp || 1500, 0.7, sr);
  return y;
}

// play x at t through a filter whose frequency follows curve (Hz, evenly spaced over x's length). The filter runs
// here (a biquad whose coefficients follow the curve every 32 samples), so the level is set from what comes OUT of it
function afSweep(x, sr, type, q, curve) {
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
function afSweepPut(K, x, t, type, q, curve, o = {}) {
  return K.put(afSweep(x, K.sr, type, q, curve), t, { vol: (o.vol ?? 1) * (o.gain || 1), norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
}

// ---- the beds ------------------------------------------------------------------------------------------------------
afSound('amb', 'places', function (ctx, bus, K) {
  const { fx, sr, r } = K, A = AF, STOP = A.goneW + 0.1;
  const hall = K.verb('hall', 2.8, { bright: 0.45, damp: 3, wet: 0.5, seed: 31 }), big = K.verb('big', 4.5, { bright: 0.4, damp: 2.4, wet: 0.55, seed: 33 });
  // ---- space (the planet shots): a low, airless hum
  const space = (t0, t1, v = 0.07) => { afBed(K, t0, t1, { colour: 'brown', f: [['lp', 140]], vol: v, am: 0.3, fi: 0.6, fo: 0.05 }); afBed(K, t0, t1, { colour: 'pink', f: [['bp', 2600, 0.6]], vol: v * 0.12, fi: 0.6, fo: 0.05 }); };
  space(0, A.mine, 0.08);
  // ---- the mine: dry wind over the veld, cicadas, haul trucks grinding; cut as the seam passes us; then the void
  const seamAt = A.mineGo + 1.45;
  afBed(K, A.mine, seamAt, { colour: 'pink', f: [['bp', 520, 0.5], ['lp', 1800]], vol: 0.16, am: 0.5, wr: 0.25, fo: 0.08 });
  {
    const d = seamAt - A.mine, n = Math.ceil(d * sr), y = afNoise(fx, n, 'white');
    GBX.bq(y, 'bp', 5400, 5, sr); GBX.bq(y, 'bp', 5400, 3, sr);
    for (let i = 0; i < n; i++) { const t = i / sr; y[i] *= (0.6 + 0.4 * Math.sin(2 * Math.PI * 0.4 * t)) * (0.5 + 0.5 * Math.sign(Math.sin(2 * Math.PI * 190 * t))) * Math.min(1, t / 0.05, (d - t) / 0.06); }
    K.put(y, A.mine, { vol: 0.035, norm: true, pan: 0.4 });
  }
  afTone(K, A.mine, seamAt - A.mine, (t) => 31 + 3 * Math.sin(t * 0.9), [[1, 1], [2, 0.6], [3, 0.4], [4, 0.25], [6, 0.12]], (u, t) => (0.7 + 0.3 * Math.sin(t * 6.2)) * Math.min(1, t / 0.05, (seamAt - A.mine - t) / 0.06), { f: [['lp', 380]], vol: 0.1, pan: -0.2 });
  // the void: air pouring down into 4 km of nothing (a deep, slow roar)
  afBed(K, seamAt - 0.1, A.platinum, { colour: 'brown', f: [['lp', 320], ['peak', 90, 0.8, 5]], vol: 0.3, am: 0.45, wr: 0.5, fi: 0.35, env: (u) => 0.75 + 0.25 * Math.sin(u * 3) });
  // ---- the car plant: the hall's roar, mains hum, servo whines, weld crackle, air; the cell line's rattle
  afBed(K, A.platinum, STOP + 0.2, { colour: 'brown', f: [['lp', 500]], vol: 0.12, am: 0.15, room: hall, wet: 0.4 });
  afTone(K, A.platinum, STOP + 0.2 - A.platinum, 100, [[1, 1], [2, 0.5], [3, 0.35], [5, 0.15]], null, { vol: 0.018 });
  for (let t = A.platinum + 0.2; t < A.battery; t += r.range(0.35, 0.75)) {
    afTone(K, t, 0.45, (s) => 640 + 520 * Math.sin(Math.min(1, s / 0.45) * Math.PI * 0.5), [[1, 1], [2, 0.3], [3, 0.12]], (u) => Math.sin(Math.PI * u), { vol: r.range(0.012, 0.03), pan: r.range(-0.6, 0.6), room: hall, wet: 0.5 });
    if (r.chance(0.7)) K.put(afCrackle(fx, r.range(0.3, 0.6), { rate: 700, hp: 2200, env: (u) => Math.sin(Math.PI * u) }), t + 0.2, { vol: r.range(0.04, 0.08), norm: true, pan: r.range(-0.5, 0.5), room: hall, wet: 0.3 });
  }
  for (let t = A.platinum + 0.9; t < A.battery; t += r.range(1.4, 2.2)) afBed(K, t, t + 0.35, { colour: 'white', f: [['hp', 2600]], vol: 0.03, mono: true, pan: r.range(-0.6, 0.6), fi: 0.005, fo: 0.25, room: hall, wet: 0.5 });
  { // the cell line: thousands of small cans clicking along the rollers, a motor's whine
    const d = A.gone - A.battery, y = fx.arr(d), n = Math.ceil(d * sr);
    for (let i = 0; i < n; i += Math.round(sr / r.range(70, 110))) GBX.strike(y, i, 3, r.range(0.3, 1), [[r.range(3800, 5200), 0.004, 1], [r.range(6800, 8400), 0.003, 0.5]], sr);
    for (let i = 0; i < n; i++) y[i] *= Math.min(1, i / (0.03 * sr), (n - i) / (0.03 * sr));
    K.put(y, A.battery, { vol: 0.05, norm: true, pan: 0.15 });
    afTone(K, A.battery, d, 228, [[1, 1], [2, 0.4], [3, 0.2]], null, { vol: 0.012 });
  }
  // after the stop: the hall, empty, ventilation only
  afBed(K, STOP + 0.15, A.trade, { colour: 'pink', f: [['bp', 300, 0.6]], vol: 0.03, fi: 0.8, room: big, wet: 0.6 });
  // ---- the trade map: a quiet data hum
  space(A.trade, A.board, 0.06);
  afTone(K, A.trade, A.board - A.trade, 55, [[1, 1], [2, 0.3], [3, 0.15]], (u, t) => Math.min(1, t / 0.6) * (0.85 + 0.15 * Math.sin(t * 1.3)), { vol: 0.02 });
  // ---- the airport: a hall full of murmur, the announcement chime
  {
    const d = A.port - A.board, n = Math.ceil(d * sr), y = fx.arr(d);
    for (let v = 0; v < 14; v++) {
      const z = afNoise(fx, n, 'pink'), f = r.range(380, 900), rate = r.range(3.5, 6), ph = r.range(0, 6.3);
      GBX.bq(z, 'bp', f, 2.5, sr); GBX.bq(z, 'bp', f * 2.4, 1.5, sr);
      for (let i = 0; i < n; i++) { const t = i / sr; y[i] += z[i] * Math.max(0, Math.sin(2 * Math.PI * rate * t + ph + 1.5 * Math.sin(t * 1.7 + v))) * (0.6 + 0.4 * Math.sin(t * 0.8 + v)); }
    }
    GBX.bq(y, 'lp', 2400, 0.7, sr);
    for (let i = 0; i < n; i++) y[i] *= Math.min(1, i / (0.04 * sr), (n - i) / (0.04 * sr));
    K.put(y, A.board, { vol: 0.07, norm: true, room: big, wet: 1.2 });
    afBed(K, A.board, A.port, { colour: 'brown', f: [['lp', 300]], vol: 0.05, room: big, wet: 0.5 });
  }
  // ---- the port: wind, slap of water on the quay, gulls, a ship's horn far out
  afBed(K, A.port, A.prices, { colour: 'pink', f: [['bp', 650, 0.5]], vol: 0.12, am: 0.5, wr: 0.8 });
  afBed(K, A.port, A.prices, { colour: 'pink', f: [['lp', 700]], vol: 0.06, env: (u, t) => 0.6 + 0.4 * Math.sin(t * 4.2) * Math.sin(t * 1.3) });
  [[0.25, -0.5], [1.4, 0.4], [2.2, -0.2]].forEach(([o, p]) => K.put(afGull(fx), A.port + o, { vol: 0.03, norm: true, pan: p, room: big, wet: 0.3 }));
  afTone(K, A.port + 0.5, 2.6, 86, [[1, 1], [2, 0.8], [3, 0.55], [4, 0.3], [5, 0.2], [6, 0.1]], (u) => Math.min(1, u * 8) * Math.min(1, (1 - u) * 3), { f: [['lp', 900]], vol: 0.06, pan: 0.5, room: big, wet: 0.8 });
  // ---- the supermarket: fridge hum, the store's low murmur
  afTone(K, A.prices, A.oceans - A.prices, 100, [[1, 1], [2, 0.6], [3, 0.2]], null, { vol: 0.02, pan: -0.4 });
  afBed(K, A.prices, A.oceans, { colour: 'pink', f: [['bp', 500, 0.8], ['lp', 1600]], vol: 0.04, am: 0.4, room: hall, wet: 0.6 });
  // ---- the oceans: the roar of the Atlantic falling 4 km; then the fronts crossing the floor
  afBed(K, A.oceans, A.surge, { colour: 'brown', f: [['lp', 900], ['peak', 140, 0.7, 4]], vol: 0.36, am: 0.25, wr: 1.4, fi: 0.9, env: (u) => 0.35 + 0.65 * u });
  afBed(K, A.oceans + 0.3, A.surge, { colour: 'pink', f: [['bp', 1300, 0.7]], vol: 0.09, am: 0.5, wr: 3, fi: 1.0, env: (u) => u });
  afBed(K, A.surge, A.ship, { colour: 'brown', f: [['lp', 700]], vol: 0.2, am: 0.35, wr: 0.9, fi: 0.08 });
  afBed(K, A.surge, A.ship, { colour: 'pink', f: [['bp', 900, 0.6]], vol: 0.07, am: 0.6, wr: 2 });
  // ---- the storm: the sea's roar, the wind howling in the rigging, spindrift hissing off the crests
  {
    const d = A.forest - A.ship, n = Math.ceil(d * sr);
    afBed(K, A.ship, A.forest, { colour: 'brown', f: [['lp', 600]], vol: 0.2, am: 0.3, wr: 0.4, env: (u, t) => 0.8 + 0.2 * MathX.clamp(afShipSlam(t), 0, 1) });
    for (let k = 0; k < 2; k++) {
      // a howl: a narrow band whose centre glides with the gusts
      const y = afNoise(fx, n, 'pink'), w = fx.wander(0.22), fq = [520, 820][k];
      for (let i = 0; i < n; i++) y[i] *= (0.55 + 0.45 * w(i / sr + 3 * k)) * Math.min(1, i / (0.05 * sr), (n - i) / (0.05 * sr));
      const curve = new Float32Array(Math.ceil(d * 50)); for (let j = 0; j < curve.length; j++) curve[j] = fq * (1 + 0.45 * w(j / 50 + 3 * k));
      afSweepPut(K, y, A.ship, 'bandpass', 4, curve, { vol: 0.045, pan: k ? 0.5 : -0.5 });
    }
    afBed(K, A.ship, A.forest, { colour: 'white', f: [['hp', 1800], ['lp', 9000]], vol: 0.08, am: 0.2 });
  }
  // ---- the rainforest at dawn: insects, birds near and far, a drip; all of it gone with the seam; then the void
  const fSeam = A.forestGo + 0.8;
  afBed(K, A.forest, fSeam, { colour: 'white', f: [['bp', 6200, 4], ['bp', 6200, 3]], vol: 0.025, env: (u, t) => 0.6 + 0.4 * Math.sin(t * 9), fo: 0.12 });
  afBed(K, A.forest, fSeam, { colour: 'pink', f: [['bp', 900, 0.5]], vol: 0.03, fo: 0.12 });
  for (let t = A.forest + 0.1; t < fSeam - 0.25; t += r.range(0.15, 0.5)) K.put(afChirp(fx, { f0: r.range(2000, 5200) }), t, { vol: r.range(0.015, 0.05), norm: true, pan: r.range(-0.8, 0.8), room: big, wet: 0.35 });
  afTone(K, A.forest + 1.2, 1.4, (s) => 420 + 160 * Math.sin(s * 9) * (1 - s / 1.4), [[1, 1], [2, 0.3]], (u) => Math.pow(Math.sin(Math.PI * u), 2) * (0.6 + 0.4 * Math.sin(u * 40)), { vol: 0.012, pan: -0.6, room: big, wet: 1.2 });
  afBed(K, fSeam - 0.1, A.wild, { colour: 'brown', f: [['lp', 300]], vol: 0.24, am: 0.4, fi: 0.3 });
  // ---- the savanna at dusk: crickets, a soft wind, the elephants' low rumble; gone with the seam
  const vSeam = A.savGo + 0.7;
  {
    const d = vSeam - A.wild, n = Math.ceil(d * sr), y = afNoise(fx, n, 'white');
    GBX.bq(y, 'bp', 4600, 6, sr);
    for (let i = 0; i < n; i++) { const t = i / sr; y[i] *= (Math.sin(2 * Math.PI * 2.1 * t) > 0.2 ? 1 : 0) * (0.5 + 0.5 * Math.sign(Math.sin(2 * Math.PI * 48 * t))) * Math.min(1, t / 0.05, (d - t) / 0.08); }
    K.put(y, A.wild, { vol: 0.03, norm: true, pan: -0.3 });
    afBed(K, A.wild, vSeam, { colour: 'pink', f: [['bp', 400, 0.5]], vol: 0.05, fo: 0.08 });
    afTone(K, A.wild + 0.3, 1.6, (s) => 24 + 5 * Math.sin(s * 2), [[1, 1], [2, 0.8], [3, 0.5], [4, 0.35], [5, 0.2]], (u) => Math.pow(Math.sin(Math.PI * u), 1.5), { f: [['lp', 220]], vol: 0.1 });
  }
  afBed(K, vSeam - 0.1, A.flow, { colour: 'brown', f: [['lp', 300]], vol: 0.22, am: 0.4, fi: 0.3 });
  // ---- the high winds over the turning planet
  afBed(K, A.flow, A.room, { colour: 'pink', f: [['bp', 700, 0.6]], vol: 0.06, am: 0.6, wr: 0.3, fi: 0.4 });
  space(A.flow, A.room, 0.05);
  // ---- the briefing room: air handling, a low murmur, a keyboard, paper
  afBed(K, A.room, A.halt, { colour: 'pink', f: [['lp', 1100]], vol: 0.03 });
  afBed(K, A.room, A.halt, { colour: 'pink', f: [['bp', 420, 1.5], ['lp', 1200]], vol: 0.018, am: 0.7, wr: 2.5, room: hall, wet: 0.5 });
  for (let t = A.room + 0.6; t < A.halt - 0.3; t += r.range(0.08, 0.3)) K.put(fx.hit([[r.range(2200, 3000), 0.006, 1], [r.range(4500, 5500), 0.004, 0.5]], { width: 0.0006 }), t, { vol: r.range(0.006, 0.014), norm: true, pan: -0.45 });
  K.put(fx.rustle(0.6, { density: 300, rub: 0.4, lo: 1200, hi: 6000, grain: 0.01 }), A.room + 2.1, { vol: 0.02, norm: true, pan: 0.3, room: hall, wet: 0.3 });
  // ---- the dead factory: wind through the hall, a slow drip far away, the board's buzz
  afBed(K, A.halt, A.phone, { colour: 'pink', f: [['bp', 260, 0.7]], vol: 0.06, am: 0.5, wr: 0.3, room: big, wet: 0.7 });
  for (let t = A.halt + 0.5; t < A.phone - 0.2; t += 1.25) K.put(fx.hit([[r.range(1400, 1700), 0.03, 1], [2900, 0.012, 0.3]], { width: 0.0008 }), t, { vol: 0.025, norm: true, pan: 0.35, room: big, wet: 2.2 });
  afTone(K, A.halt, A.phone - A.halt, 100, [[1, 0.6], [2, 1], [3, 0.4], [4, 0.3]], null, { vol: 0.012, pan: 0.1 });
  // ---- the kitchen at night: the fridge, the clock, a car passing far off
  afTone(K, A.phone, A.coast - A.phone, 50, [[1, 0.3], [2, 1], [4, 0.3]], null, { vol: 0.016, pan: -0.5 });
  for (let t = Math.ceil(A.phone); t < A.coast - 0.2; t += 1) K.put(fx.hit([[3100, 0.006, 1], [5200, 0.004, 0.5], [1400, 0.01, 0.4]], { width: 0.0003 }), t, { vol: 0.03, norm: true, pan: 0.45 });
  afBed(K, A.phone + 2.5, A.phone + 6.5, { colour: 'pink', f: [['bp', 450, 0.6], ['lp', 900]], vol: 0.02, env: (u) => Math.pow(Math.sin(Math.PI * u), 2), mono: true, pan: 0.6 });
  afBed(K, A.phone, A.coast + 0.1, { colour: 'pink', f: [['lp', 900], ['hp', 90]], vol: 0.07, fi: 0.3, fo: 0.1 });   // the room itself
  // ---- the coast: wind, gulls, the surf getting farther each day; the mud ticking as it dries
  afBed(K, A.coast - 0.8, A.earth, { colour: 'pink', f: [['bp', 700, 0.5]], vol: 0.09, am: 0.5, wr: 0.5, fi: 0.8 });   // (in before the cut)
  afBed(K, A.coast, A.earth, { colour: 'brown', f: [['lp', 650]], vol: 0.12, env: (u, t) => (1 - 0.7 * u) * (0.7 + 0.3 * Math.sin(t * 0.9)) });
  [[0.8, -0.4], [2.6, 0.5], [5.1, -0.1], [7.4, 0.3]].forEach(([o, p]) => K.put(afGull(fx), A.coast + o, { vol: 0.021, norm: true, pan: p, room: big, wet: 0.4 }));
  K.put(afCrackle(fx, A.earth - A.coast - 1, { rate: 60, hp: 3000, env: (u) => u }), A.coast + 1, { vol: 0.02, norm: true });
  // ---- the new Earth
  space(A.earth, A.end + 0.5, 0.07);
});
