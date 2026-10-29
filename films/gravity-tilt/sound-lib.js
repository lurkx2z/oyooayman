/* =====================================================================
   SOUND · LIB — the noise and filter generators the ambience and effects share (from the Friction 10s film, renamed
   gt*), the cat and the birds, metal, and this film's own: where the picture is (the bedroom, the street, the river),
   and when a story second is on screen (gtWhen, gtSpan). The film has ONE clock that only runs forward, so every
   event is heard once, at the film time its second comes round, or not at all when it falls in a jump. Every function
   here is listed in GT_SOUND_FNS at the end, so the baked soundtrack's fingerprint sees a change to any of them.
   ===================================================================== */

// ---- shared generators -------------------------------------------------------------------------------------------
// noise of a colour: 'white' | 'pink' | 'brown'
function gtNoise(fx, n, colour = 'white') {
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
function gtBed(K, t0, t1, o = {}) {
  const { fx, sr } = K, d = t1 - t0; if (d <= 0.02) return;
  const n = Math.ceil(d * sr), fi = o.fi ?? 0.04, fo = o.fo ?? 0.04;
  const mk = () => {
    const y = gtNoise(fx, n, o.colour || 'pink');
    for (const f of (o.f || [])) GTX.bq(y, f[0], f[1], f[2] || 0.7, sr, f[3] || 0);
    const w = fx.wander(o.wr || 0.35);
    for (let i = 0; i < n; i++) { const t = i / sr; y[i] *= (o.env ? o.env(t / d, t0 + t) : 1) * Math.min(1, t / fi, (d - t) / fo) * (1 + (o.am || 0) * w(t)); }
    return y;
  };
  if (o.mono) return K.put(mk(), t0, { vol: o.vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
  return K.putLR(mk(), mk(), t0, { vol: o.vol, norm: true, room: o.room, wet: o.wet });
}
// a tone with harmonics (hum, horn, motor): f(t) the pitch over the event (t from 0), harm [[k, a]], env(u)
function gtTone(K, t0, d, f, harm, env, o = {}) {
  const { fx, sr } = K, n = Math.ceil(d * sr), y = fx.arr(d);
  const F = typeof f === 'function' ? f : () => f, ph = harm.map(() => fx.r.range(0, 6.283));
  for (let i = 0; i < n; i++) {
    const t = i / sr, fr = F(t), e = env ? env(t / d, t) : Math.min(1, t / 0.05, (d - t) / 0.05);
    let v = 0; for (let k = 0; k < harm.length; k++) { ph[k] += 2 * Math.PI * fr * harm[k][0] / sr; v += harm[k][1] * Math.sin(ph[k]); }
    y[i] = v * e;
  }
  for (const fl of (o.f || [])) GTX.bq(y, fl[0], fl[1], fl[2] || 0.7, sr, fl[3] || 0);
  return K.put(y, t0, { vol: o.vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
}
// a bird: a quick chirp phrase (FM sine sweeps), o.f0 base pitch, o.n notes
function gtChirp(fx, o = {}) {
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
function gtCrackle(fx, d, o = {}) {
  const sr = fx.sr, r = fx.r, y = fx.arr(d + 0.02), n = Math.ceil(d * sr);
  for (let i = 0; i < n; i++) { const u = i / n; if (r.next() < (o.rate || 300) * (o.env ? o.env(u) : 1) / sr) { const a = Math.pow(r.next(), 3), L = r.int(8, 60); for (let k = 0; k < L && i + k < y.length; k++) y[i + k] += a * (r.next() * 2 - 1) * Math.exp(-k / (L * 0.3)); } }
  GTX.bq(y, 'hp', o.hp || 1500, 0.7, sr);
  return y;
}

// play x at t through a filter whose frequency follows curve (Hz, evenly spaced over x's length). The filter runs
// here (a biquad whose coefficients follow the curve every 32 samples), so the level is set from what comes OUT of it
function gtSweep(x, sr, type, q, curve) {
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
function gtSweepPut(K, x, t, type, q, curve, o = {}) {
  return K.put(gtSweep(x, K.sr, type, q, curve), t, { vol: (o.vol ?? 1) * (o.gain || 1), norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
}

const gtEv = (t, a, b) => MathX.smooth(t, a, b);                                       // 0 → 1 from a to b
const gtWn = (t, a, b, fi = 0.3, fo = 0.3) => gtEv(t, a - fi, a) * (1 - gtEv(t, b, b + fo));   // 1 inside [a, b]
function gtAddAt(dst, src, t, g, sr) { const i0 = Math.round(t * sr); for (let i = 0; i < src.length && i0 + i < dst.length; i++) if (i0 + i >= 0) dst[i0 + i] += src[i] * g; }

// ---- shared helpers ----------------------------------------------------------------------------------------------
// where the picture is: 0…1 over the shots whose place (gtWhere: 'in' | 'out' | 'river') matches, with a short
// crossfade at each cut (the count down's quick cuts are their own places)
function gtAt(where, xf = 0.06) {
  const W = gtPlaces().filter((p) => p.where === where).map((p) => [p.t0, p.t1]);
  return (t) => { let v = 0; for (const [a, b] of W) v += gtWn(t, a, b, xf, xf); return Math.min(1, v); };
}
// a level curve sampled once (200 Hz) and read back by linear interpolation: the beds read their envelopes per sample
function gtCurve(f, hz = 200) {
  const t0 = -2, n = Math.ceil((GT.end + 6 - t0) * hz), y = new Float32Array(n + 1);
  for (let i = 0; i <= n; i++) y[i] = f(t0 + i / hz);
  return (t) => { const x = MathX.clamp((t - t0) * hz, 0, n - 1e-6), i = Math.floor(x); return y[i] + (y[i + 1] - y[i]) * (x - i); };
}
// a cat's voice ("mrrp", "miaow"): glottal pulses at f0(u) through two formants that open and close (o.d length,
// o.f0 [start, peak, end], o.open: how wide the mouth gets, o.thin: a little more breath than voice)
function gtMeow(fx, o = {}) {
  const sr = fx.sr, r = fx.r, d = o.d || 0.7, n = Math.ceil(d * sr), F = o.f0 || [480, 720, 420], src = new Float32Array(n);
  let ph = 0; const wv = fx.wander(6);
  for (let i = 0; i < n; i++) { const u = i / n, f = u < 0.35 ? F[0] + (F[1] - F[0]) * Math.sin(u / 0.35 * Math.PI / 2) : F[1] + (F[2] - F[1]) * Math.pow((u - 0.35) / 0.65, 1.3); ph += f * (1 + 0.015 * wv(i / sr)) / sr; if (ph >= 1) { ph -= 1; src[i] = 1; } src[i] += (o.thin || 0.08) * (r.next() * 2 - 1); }
  const op = o.open || 1, mouth = (u) => Math.sin(Math.PI * Math.min(1, u * 1.15)) * op;
  const a = gtSweep(src, sr, 'bandpass', 5, Array.from({ length: 16 }, (_, k) => 650 + 900 * mouth(k / 15)));
  const b = gtSweep(src, sr, 'bandpass', 7, Array.from({ length: 16 }, (_, k) => 1700 + 1300 * mouth(k / 15)));
  const y = fx.arr(d + 0.02); for (let i = 0; i < n; i++) { const u = i / n; y[i] = (a[i] + 0.6 * b[i]) * Math.min(1, u / 0.06) * Math.pow(1 - u, 0.6); }
  return y;
}


// ---- this film's creatures and crowd -----------------------------------------------------------------------------
// a robin's song: a thin, liquid, quick phrase of 8–15 notes leaping about between ~2.6 and 7 kHz, some of them trilled
function gtRobinSong(fx, o = {}) {
  const sr = fx.sr, r = fx.r, N = o.n || r.int(8, 15), y = fx.arr(N * 0.17 + 0.1); let t = 0, ph = 0;
  for (let k = 0; k < N; k++) {
    const nd = r.range(0.035, 0.11), fa = r.range(2600, 7000) * (o.p || 1), fb = fa * r.range(0.75, 1.3), tr = r.next() < 0.35 ? r.range(40, 90) : 0;
    const i0 = Math.round(t * sr), n = Math.round(nd * sr);
    for (let i = 0; i < n && i0 + i < y.length; i++) { const u = i / n, w = tr ? Math.sin(2 * Math.PI * tr * i / sr) : 0, f = fa + (fb - fa) * u + 400 * w; ph += 2 * Math.PI * f / sr; y[i0 + i] += Math.sin(ph) * Math.sin(Math.PI * u) * (tr ? 0.6 + 0.4 * w : 1); }
    t += nd + r.range(0.015, 0.06);
  }
  return y;
}
// a short click (a relay, a phone's shutter, a clock's tick): o.f its ring, o.len, o.hp
function gtClick(fx, o = {}) {
  const sr = fx.sr, y = fx.hit([[o.f || 2400, o.tau || 0.006, 1], [(o.f || 2400) * 1.7, (o.tau || 0.006) * 0.6, 0.5], [(o.f || 2400) * 0.45, (o.tau || 0.006) * 1.5, 0.4]], { width: 0.0003, len: o.len || 0.06 });
  if (o.hp) GTX.bq(y, 'hp', o.hp, 0.7, sr);
  return y;
}

// ---- the story clock in the sound ------------------------------------------------------------------------------
// the bedroom's shots (and the ones looking out through its window from inside); everything else in the world set is
// the street; the river set is the river. The count down's six quick cuts: 1, 2, 4 inside
const GT_IN_MODES = ['pov0', 'room0', 'povglass', 'crawl', 'roomroll', 'pit', 'sick', 'cat', 'bath', 'phone', 'rainwin', 'creak', 'pool', 'glassclose', 'ready', 'lastin', 'back', 'question'];
function gtWhereShot(sh, sub = 0) { if (sh.set === 'river') return 'river'; if (sh.mode === 'count') return [1, 2, 4].includes(sub) ? 'in' : 'out'; return GT_IN_MODES.includes(sh.mode) ? 'in' : 'out'; }
function gtWhere(t) { const sh = gtShotAt(t); return gtWhereShot(sh, sh.mode === 'count' ? GT.subCuts.filter((c) => t >= c).length : 0); }
// the film as places: [{ t0, t1, where, shot }] in order (the count down split at its quick cuts)
function gtPlaces() {
  if (gtPlaces._c) return gtPlaces._c;
  const out = [];
  for (const sh of GT_SHOTS) {
    const a = Math.max(-2, sh.t0), b = Math.min(sh.t1, GT.end + 5);
    if (sh.mode !== 'count') { out.push({ t0: a, t1: b, where: gtWhereShot(sh), shot: sh }); continue; }
    const cuts = [a, ...GT.subCuts, b];
    for (let i = 0; i + 1 < cuts.length; i++) out.push({ t0: cuts[i], t1: cuts[i + 1], where: gtWhereShot(sh, i), shot: sh });
  }
  return (gtPlaces._c = out);
}
// the film time at which the picture passes story second sE, or null when that second falls in a jump of the clock (or
// outside the film): { t, rate, shot, where }
function gtWhen(sE) {
  for (const g of GT_CLOCK) if (sE >= g.s0 && sE < g.s1) { const t = g.t0 + (sE - g.s0) / g.rate; if (t < -2 || t > GT.end + 1) return null; return { t, rate: g.rate, shot: gtShotAt(t), where: gtWhere(t) }; }
  return null;
}
// every stretch of film showing story seconds sA … sB, split at the cuts: [{ tA, tB, sA, sB, rate, shot, where }]
function gtSpan(sA, sB) {
  const out = [];
  for (const g of GT_CLOCK) {
    const a = Math.max(sA, g.s0), b = Math.min(sB, g.s1); if (!(b > a)) continue;
    const tA = g.t0 + (a - g.s0) / g.rate, tB = g.t0 + (b - g.s0) / g.rate;
    for (const p of gtPlaces()) {
      const x = Math.max(tA, p.t0), y = Math.min(tB, p.t1); if (!(y > x)) continue;
      out.push({ tA: x, tB: y, sA: gtStoryAt(x), sB: gtStoryAt(y), rate: g.rate, shot: p.shot, where: p.where });
    }
  }
  return out;
}

// ---- this film's sounds --------------------------------------------------------------------------------------
// a tyre screeching (stick-slip: the rubber grabbing and letting go ~600 times a second, ringing the tyre's wall and
// the wheel well) with the road's roar under it; d seconds, o.f its pitch, o.env(u)
function gtScreech(fx, d, o = {}) {
  const sr = fx.sr, f = o.f || 1;
  const y = fx.creak(d, [[1180 * f, 0.012, 1], [2350 * f, 0.009, 0.65], [3520 * f, 0.006, 0.35], [780 * f, 0.014, 0.45]], { rate: [540 * f, 660 * f], jit: 0.06, wrate: 3.2, env: (u) => (o.env ? o.env(u) : Math.min(1, u / 0.04)) });
  const n = Math.ceil(d * sr), z = gtNoise(fx, n, 'pink'); GTX.bq(z, 'bp', 700 * f, 0.6, sr); GTX.bq(z, 'lp', 3000, 0.7, sr);
  const zp = GTX.peak(z) || 1, yp = GTX.peak(y) || 1;
  for (let i = 0; i < n; i++) { const u = i / n; y[i] = y[i] / yp + 0.35 * z[i] / zp * (o.env ? o.env(u) : Math.min(1, u / 0.04)); }
  return y;
}
// a big diesel idling (the bus): firing pulses at f Hz through the body's resonances, a rattle; d seconds (o.low < 1:
// the body's resonances lowered too, for the slowed-down street)
function gtDiesel(fx, d, o = {}) {
  const sr = fx.sr, r = fx.r, n = Math.ceil(d * sr), y = fx.arr(d), f = o.f || 11.5, wv = fx.wander(0.4);
  let ph = 0;
  for (let i = 0; i < n; i++) { ph += f * (1 + 0.03 * wv(i / sr)) / sr; if (ph >= 1) { ph -= 1; y[i] = r.range(0.7, 1); } }
  const lo = o.low || 1, out = GTX.res(fx.arr(d + 0.2), y, [[42, 0.05, 1], [86, 0.03, 0.7], [131, 0.02, 0.45], [260, 0.012, 0.3], [520, 0.006, 0.15]].map(([ff, tau, a]) => [ff * lo, tau / lo, a]), sr);
  const z = gtNoise(fx, out.length, 'brown'); GTX.bq(z, 'lp', 160, 0.7, sr);
  const op = GTX.peak(out) || 1, zp = GTX.peak(z) || 1;
  for (let i = 0; i < out.length; i++) out[i] = out[i] / op + 0.4 * z[i] / zp;
  return out;
}
// metal: a crash of panels (a car hitting the bus, the bus landing): a deep thump, the panels' modes, glass, a scrape
function gtCrunch(fx, o = {}) {
  const sr = fx.sr, r = fx.r, d = o.len || 2.2, y = fx.arr(d), big = o.big || 1;
  for (let k = 0; k < 6; k++) GTX.strike(y, Math.round(r.range(0, 0.06) * sr), Math.round(r.range(0.002, 0.006) * sr), r.range(0.4, 1), fx.metalModes(r.range(180, 520) / big, r.range(0.4, 0.9)), sr);
  GTX.strike(y, 0, Math.round(0.006 * sr), 1.2, fx.panelModes(1.4).map(([ff, tau, a]) => [ff / big, tau, a]), sr);
  for (let i = 0; i < 0.6 * sr; i++) y[i] += 1.1 * Math.sin(2 * Math.PI * (44 / Math.sqrt(big)) * i / sr) * Math.exp(-i / (0.16 * sr)) * Math.min(1, i / (0.003 * sr));
  const sc = fx.rustle(d * 0.7, { density: 900, rub: 0.6, lo: 500, hi: 5000, grain: 0.004, env: (u) => Math.exp(-u * 3) }); gtAddAt(y, sc, 0.02, 0.5 * (o.scrape ?? 1), sr);
  return y;
}

// ---- where the camera is (for how far away a sound is) ----------------------------------------------------------
// each outside shot's camera, roughly (world x along the street, height y: world.js has the exact ones); inside, the
// bedroom (behind its walls). The chair shot falls with the chair; the count down's quick cuts each have their own
const GT_CAMXY = { master: [2, 4.5], bottom: [260, 16], front: [5, 1.7], tipped: [11.5, 6], dust: [171, 2.6], dust2: [262, 3.2], town: [-130, 155],
  jogger: [25.3, 1.9], climb: [23.2, 2.4], house: [15, 4.3], trees: [198, 2.6], sun: [-2.8, 9.5], terrace: [66, 1.3], dpc: [13.2, 0.4], slip: [13.6, 0.2],
  rainfront: [93, 1.7], rainjog: [23, 1.0], bow: [59, 2.6], wood: [15.5, 5.1], creep: [-0.2, 0.3], going: [42, 1.0], still: [12.8, 0.5], release: [7.5, 14.4],
  impact: [266, 20], cloud: [153, 6], glassgo: [16, 3.2], jogdown: [25.6, 1.3], bolt: [-0.5, 0.2], lurch: [17.8, 3.2], last: [-1, 10.5],
  backstreet: [30.5, 1.8], rainfall: [44, 0.55], after: [20.5, 2.1] };
function gtCamAt(t) {
  const sh = gtShotAt(t), w = gtWhere(t);
  if (w !== 'out') return { x: -1.6, y: 4.5, where: w, mode: sh.mode };
  if (sh.mode === 'chair') { const F = GT_FALLERS.find((f) => f.k === 'gchair'); return { x: gtFaller(F, gtStoryAt(t)).x - 0.4, y: 2.5, where: w, mode: 'chair' }; }
  if (sh.mode === 'count') { const n = GT.subCuts.filter((c) => t >= c).length; const p = n === 0 ? [25.4, 1.6] : n === 3 ? [150, 3.5] : [-1.5, 10.4]; return { x: p[0], y: p[1], where: w, mode: 'count' }; }
  const p = GT_CAMXY[sh.mode] || [20, 2]; return { x: p[0], y: p[1], where: w, mode: sh.mode };
}
// how loud a sound at street x (height y) is from the camera at film time t (1 within ~12 m; inside, through the walls,
// a fixed fraction): { g, lp } (lp: the air and the walls take the top off far sounds)
function gtNear(t, x, y = 1, o = {}) {
  const c = gtCamAt(t);
  if (c.where === 'river') return { g: 0, lp: 0 };
  if (c.where === 'in') { const d = Math.hypot(x + 1.6, y - 4.5) + 4; return { g: (o.wall ?? 0.35) * Math.min(1, Math.pow(12 / d, 0.75)), lp: 500 }; }
  const d = Math.hypot(c.x - x, c.y - y) + 1;
  return { g: Math.min(1, Math.pow(12 / d, o.k ?? 0.75)), lp: d < 40 ? 0 : MathX.clamp(9000 * Math.pow(40 / d, 1.2), 900, 9000) };
}
// how hard it is raining where the camera is (0…1): the front of the falling river (9.5 m/s east) reaches each x at
// its own time and the rain thickens over the 60 m behind it; and how near the front is (its roar, coming down the
// street). At the return the rain falls out of the air onto the ground for ~12 s (drops from up to 100 m)
function gtRainAt(t) {
  const s = gtStoryAt(t), c = gtCamAt(t), x = c.where === 'in' ? 0 : c.x;
  if (c.where === 'river') return { k: 0, near: 0, ground: 0 };
  if (s >= GTP.tBack) return { k: 0, near: 0, ground: gtSm(s, GTP.tBack + 0.15, GTP.tBack + 0.8) * (1 - gtSm(s, GTP.tBack + 10.5, GTP.tBack + 12.6)) };
  const front = -GT_RIVER.dist + GT_RIVER.vDrop * (s - GT_RIVER.leave), wob = 0.85 + 0.15 * Math.sin(s * 0.013);
  return { k: gtSm(front - x, 0, 60) * wob, near: front < x ? Math.pow(MathX.clamp(1 - (x - front) / 300, 0, 1), 2) : 0, ground: 0 };
}
const GT_SOUND_FNS = [gtCamAt, gtNear, gtRainAt, gtNoise, gtBed, gtTone, gtChirp, gtCrackle, gtSweep, gtSweepPut, gtAddAt, gtAt, gtCurve, gtMeow, gtRobinSong, gtClick, gtWhereShot, gtWhere, gtPlaces, gtWhen, gtSpan, gtScreech, gtDiesel, gtCrunch, gtEv, gtWn];
