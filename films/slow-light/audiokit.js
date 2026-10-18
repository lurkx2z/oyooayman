/* =====================================================================
   AUDIOKIT — the sample-level DSP (SLX) and the synthesised sound generators (SlFx) of the gravity films' sound design,
   copied from the Shrinking film (itself from films/gravity-doubled-3min/audio.js), renamed sl*, so this film reuses them without touching
   that film. Everything is seeded and deterministic. audio.js builds this film's soundtrack on top.
   ===================================================================== */
function slMidi(n) {
  if (typeof n === 'number') return n;
  const m = /^([A-G])(b|#)?(-?\d)$/.exec(n);
  return 12 * (+m[3] + 1) + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === 'b' ? -1 : m[2] === '#' ? 1 : 0);
}
const slHz = (n) => 440 * Math.pow(2, (slMidi(n) - 69) / 12);

// ---------------------------------------------------------------------------------------------------------------------
// sample-level DSP (everything deterministic)
// ---------------------------------------------------------------------------------------------------------------------
const SLX = {
  // RBJ biquad, in place
  bq(x, type, f, q, sr, db = 0) {
    const w = 2 * Math.PI * Math.min(f, sr * 0.45) / sr, cs = Math.cos(w), sn = Math.sin(w), al = sn / (2 * q), A = Math.pow(10, db / 40);
    let b0, b1, b2, a0, a1, a2;
    if (type === 'lp') { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = b0; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
    else if (type === 'hp') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = b0; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
    else if (type === 'bp') { b0 = al; b1 = 0; b2 = -al; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
    else { b0 = 1 + al * A; b1 = -2 * cs; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * cs; a2 = 1 - al / A; }   // peaking
    b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0;
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) { const xi = x[i], y = b0 * xi + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = xi; y2 = y1; y1 = y; x[i] = y; }
    return x;
  },
  // a bank of decaying modes [f, tau, amp] driven by the excitation e (added into y). A unit impulse rings at `amp`.
  res(y, e, modes, sr) {
    for (const [f, tau, amp] of modes) {
      if (f >= sr * 0.45 || f <= 0 || !amp) continue;
      const w = 2 * Math.PI * f / sr, r = Math.exp(-1 / (tau * sr)), c1 = 2 * r * Math.cos(w), c2 = -r * r, k = amp * Math.sin(w);
      let y1 = 0, y2 = 0;
      const n = Math.min(y.length, e.length + Math.ceil(tau * sr * 7));
      for (let i = 0; i < n; i++) { const v = c1 * y1 + c2 * y2 + (i < e.length ? k * e[i] : 0); y[i] += v; y2 = y1; y1 = v; }
    }
    return y;
  },
  // one contact: a half-sine force pulse W samples wide (wider = softer) with area A, ringing the modes, written at i0
  strike(y, i0, W, A, modes, sr) {
    W = Math.max(2, W | 0);
    const e = new Float32Array(W);
    for (let k = 0; k < W; k++) e[k] = A * (Math.PI / (2 * W)) * Math.sin(Math.PI * k / W);
    for (const [f, tau, amp] of modes) {
      if (f >= sr * 0.45 || f <= 0 || !amp) continue;
      const w = 2 * Math.PI * f / sr, r = Math.exp(-1 / (tau * sr)), c1 = 2 * r * Math.cos(w), c2 = -r * r, k = amp * Math.sin(w);
      let y1 = 0, y2 = 0;
      const n = Math.min(y.length - i0, W + Math.ceil(tau * sr * 7));
      for (let i = 0; i < n; i++) { const v = c1 * y1 + c2 * y2 + (i < W ? k * e[i] : 0); y[i0 + i] += v; y2 = y1; y1 = v; }
    }
  },
  peak(x, xr) { let p = 0; for (let i = 0; i < x.length; i++) p = Math.max(p, Math.abs(x[i])); if (xr) for (let i = 0; i < xr.length; i++) p = Math.max(p, Math.abs(xr[i])); return p; },
  // add a mono array into a stereo pair at sample i0 with an equal-power pan
  mixIn(L, R, x, i0, gain, pan) {
    const a = (Math.max(-1, Math.min(1, pan)) + 1) * Math.PI / 4, gl = Math.cos(a) * gain, gr = Math.sin(a) * gain;
    const n = Math.min(x.length, L.length - i0);
    for (let i = Math.max(0, -i0); i < n; i++) { L[i0 + i] += x[i] * gl; R[i0 + i] += x[i] * gr; }
  },
};

class SlFx {
  constructor(ctx, seed) { this.ctx = ctx; this.sr = ctx.sampleRate; this.r = new RNG(seed); this.cache = {}; }
  arr(sec) { return new Float32Array(Math.max(8, Math.ceil(sec * this.sr))); }
  white(n) { const r = this.r, x = new Float32Array(n); for (let i = 0; i < n; i++) x[i] = r.next() * 2 - 1; return x; }
  // a smooth random curve (≈ −1…1): a few slow sines with seeded rates and phases
  wander(rate = 1) {
    const r = this.r, P = [0, 1, 2].map((k) => [r.range(0.6, 1.4) * rate * (1 + k * 1.7), r.range(0, 6.283), 1 / (k + 1)]);
    return (t) => (Math.sin(6.283 * P[0][0] * t + P[0][1]) + 0.5 * Math.sin(6.283 * P[1][0] * t + P[1][1]) + 0.33 * Math.sin(6.283 * P[2][0] * t + P[2][1])) / 1.83;
  }
  // schedule an array (mono, or stereo with o.xr) at film time t. o: vol, pan, rate, offset, stop, fade, fadeIn
  play(x, t, dest, o = {}) {
    const ctx = this.ctx, st = !!o.xr, b = ctx.createBuffer(st ? 2 : 1, x.length, this.sr);
    b.getChannelData(0).set(x); if (st) b.getChannelData(1).set(o.xr);
    const s = ctx.createBufferSource(), g = ctx.createGain(), t0 = Math.max(0, t);
    let v = o.vol == null ? 1 : o.vol;
    if (o.norm) { const pk = o.norm === true ? SLX.peak(x, o.xr) : o.norm; if (pk > 1e-9) v /= pk; }   // vol = the sound's peak
    s.buffer = b; if (o.rate) s.playbackRate.value = o.rate;
    s.connect(g);
    if (st) g.connect(dest); else { const p = ctx.createStereoPanner(); p.pan.value = o.pan || 0; g.connect(p); p.connect(dest); }
    g.gain.setValueAtTime(o.fadeIn ? 0 : v, t0);
    if (o.fadeIn) g.gain.linearRampToValueAtTime(v, t0 + o.fadeIn);
    s.start(t0, (o.offset || 0) + Math.max(0, -t));
    if (o.stop != null) { const f = o.fade || 0.05; g.gain.setValueAtTime(v, Math.max(t0 + (o.fadeIn || 0) + 0.001, o.stop - f)); g.gain.linearRampToValueAtTime(0, o.stop); s.stop(o.stop + 0.02); }
    return g;
  }
  // a stereo impulse response: a decaying noise tail that darkens as it decays, plus optional early reflections
  ir(sec, o = {}) {
    const sr = this.sr, n = Math.ceil(sec * sr), b = this.ctx.createBuffer(2, n, sr), r = new RNG(o.seed || 77);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c); let lp = 0;
      for (let i = 0; i < n; i++) {
        const u = i / n, k = Math.max(0.025, (o.bright || 0.6) * Math.exp(-u * (o.damp || 3)));
        lp += (r.next() * 2 - 1 - lp) * k;
        d[i] = i < (o.pre || 0) * sr ? 0 : lp * Math.pow(1 - u, o.shape || 2.2) / Math.sqrt(k);
      }
      for (const [dt, a] of (o.early || [])) { const i = Math.round(dt * sr * (c ? 1.09 : 1)); if (i < n) d[i] += a * (c ? 0.85 : 1); }
    }
    const cv = this.ctx.createConvolver(); cv.buffer = b; return cv;
  }

  // ---- mode sets (seeded variation, so no two cups ring the same)
  cupModes(s = 1) { const r = this.r, b = r.range(1750, 2050) * s; return [[1, 0.24, 1], [1.47, 0.17, 0.65], [2.31, 0.12, 0.5], [2.94, 0.09, 0.4], [3.83, 0.06, 0.28], [4.95, 0.04, 0.18], [6.2, 0.03, 0.1]].map(([k, tau, a]) => [b * k * r.range(0.99, 1.01), tau, a * r.range(0.8, 1.2)]); }
  saucerModes(s = 1) { const r = this.r, b = r.range(1150, 1290) * s; return [[1, 0.4, 1], [1.63, 0.28, 0.7], [2.41, 0.18, 0.55], [2.77, 0.14, 0.45], [3.92, 0.08, 0.3], [5.1, 0.05, 0.18]].map(([k, tau, a]) => [b * k * r.range(0.99, 1.01), tau, a * r.range(0.8, 1.2)]); }
  woodModes(b = 190, damp = 1) { const r = this.r; return [[1, 0.05, 1], [2.2, 0.035, 0.7], [3.8, 0.02, 0.45], [6.7, 0.012, 0.25], [11, 0.007, 0.12]].map(([k, tau, a]) => [b * k * r.range(0.97, 1.03), tau * damp, a]); }
  stoneModes(s = 1) { return [[95 * s, 0.035, 1], [210 * s, 0.025, 0.6], [470 * s, 0.015, 0.35], [1100 * s, 0.008, 0.18], [2600 * s, 0.004, 0.08]]; }
  metalModes(b, damp = 1) { return [[b, 0.25 * damp, 1], [b * 2.76, 0.12 * damp, 0.6], [b * 5.4, 0.06 * damp, 0.4], [b * 8.93, 0.035 * damp, 0.25]]; }
  panelModes(damp = 1) { return [[132, 0.09, 1], [221, 0.08, 0.75], [347, 0.06, 0.6], [512, 0.045, 0.45], [790, 0.03, 0.3], [1260, 0.02, 0.18], [2100, 0.012, 0.1]].map(([f, tau, a]) => [f, tau * damp, a]); }
  glassModes() { return [[310, 0.06, 1], [520, 0.05, 0.7], [870, 0.03, 0.5], [1450, 0.02, 0.3]]; }

  // ---- generators (each returns a mono Float32Array starting at the event, unless it says stereo)
  // one hit: o.width (s, the contact time), o.amp, o.noise (a click of noise), o.nhp, o.len, o.extra [[dt, width, amp]]
  hit(modes, o = {}) {
    const sr = this.sr, len = o.len || Math.min(4, Math.max(...modes.map((m) => m[1])) * 6 + 0.03 + Math.max(0, ...(o.extra || []).map((e) => e[0])));
    const y = this.arr(len);
    SLX.strike(y, 0, Math.round((o.width || 0.0004) * sr), o.amp == null ? 1 : o.amp, modes, sr);
    for (const [dt, w, a] of (o.extra || [])) SLX.strike(y, Math.round(dt * sr), Math.round(w * sr), a, modes, sr);
    if (o.noise) {
      const n = Math.round((o.nlen || 0.004) * sr), z = this.white(n);
      for (let i = 0; i < n; i++) z[i] *= Math.exp(-i / (n * 0.25));
      SLX.bq(z, 'hp', o.nhp || 2000, 0.7, sr);
      for (let i = 0; i < n; i++) y[i] += z[i] * o.noise;
    }
    return y;
  }
  // stick-slip friction (creaks, squeaks, groans): pulses at a wandering rate (Hz) through resonant modes.
  // o.env(u, t) shapes it over its length (u = 0…1); o.rate [lo, hi]; o.jit = pulse-to-pulse randomness
  creak(dur, modes, o = {}) {
    const sr = this.sr, r = this.r, n = Math.ceil(dur * sr), e = new Float32Array(n), wv = this.wander(o.wrate || 1.6), [lo, hi] = o.rate || [25, 70];
    let ph = r.next();
    for (let i = 0; i < n; i++) {
      const t = i / sr, u = t / dur, a = o.env ? o.env(u, t) : Math.pow(Math.sin(Math.PI * u), 0.7);
      ph += (lo + (hi - lo) * (0.5 + 0.5 * wv(t))) * (1 + (o.jit || 0.25) * (r.next() - 0.5)) / sr;
      if (ph >= 1) { ph -= 1; if (a > 0.002) e[i] = a * (0.55 + 0.45 * r.next()); }
    }
    return SLX.res(this.arr(dur + 0.12), e, modes, sr);
  }
  // fabric / paper / plastic: grains of noise over a smooth rub, filtered; o.env(u), o.density (grains/s), o.lo, o.hi
  rustle(dur, o = {}) {
    const sr = this.sr, r = this.r, n = Math.ceil(dur * sr), y = this.arr(dur + 0.03), dec = Math.exp(-1 / ((o.grain || 0.012) * sr));
    let g = 0;
    for (let i = 0; i < n; i++) {
      const u = i / n, a = o.env ? o.env(u) : Math.pow(Math.sin(Math.PI * u), 0.8);
      if (r.next() < (o.density || 220) * a / sr) g = Math.max(g, r.range(0.4, 1.0) * a);
      g *= dec;
      y[i] = (r.next() * 2 - 1) * ((o.rub == null ? 0.3 : o.rub) * a + g);
    }
    SLX.bq(y, 'hp', o.lo || 700, 0.7, sr); SLX.bq(y, 'lp', o.hi || 6500, 0.7, sr);
    if (o.peak) SLX.bq(y, 'peak', o.peak, 1.0, sr, 5);
    return y;
  }
  // breath: noise through mouth/throat formants, optional voiced effort (a strained hum under the air), o.env(u)
  breath(dur, o = {}) {
    const sr = this.sr, r = this.r, n = Math.ceil(dur * sr), src = this.white(n), y = this.arr(dur + 0.02);
    const F = o.inhale ? [[1150, 2.2, 0.8], [2400, 3, 0.55], [3900, 3.5, 0.3]] : o.teeth ? [[2600, 2, 0.5], [4300, 2.5, 0.6], [6200, 3, 0.3]] : [[640, 1.8, 1], [1250, 2.4, 0.6], [2600, 3, 0.35]];
    for (const [f, q, a] of F) { const z = Float32Array.from(src); SLX.bq(z, 'bp', f * r.range(0.95, 1.05), q, sr); for (let i = 0; i < n; i++) y[i] += z[i] * a; }
    if (o.voice) {   // glottal pulses with jitter through an "uh"/"nn" vocal tract
      const v = new Float32Array(n), f0 = o.f0 || 120, wv = this.wander(2.2);
      let ph = 0;
      for (let i = 0; i < n; i++) { ph += f0 * (1 + 0.03 * wv(i / sr) + 0.02 * (r.next() - 0.5)) / sr; if (ph >= 1) { ph -= 1; v[i] = 1; } }
      const V = o.nasal ? [[260, 4, 1], [1100, 5, 0.25], [2300, 6, 0.2]] : [[620, 4, 1], [1180, 5, 0.6], [2450, 6, 0.3]];
      for (const [f, q, a] of V) { const z = Float32Array.from(v); SLX.bq(z, 'bp', f, q, sr); for (let i = 0; i < n; i++) y[i] += z[i] * a * o.voice * 1.8; }   // (v3: less buzz)
    }
    const env = o.env || (o.inhale ? (u) => Math.pow(Math.sin(Math.PI * Math.min(1, u / 0.8) * 0.5), 1.5) * (1 - Math.pow(Math.max(0, (u - 0.8) / 0.2), 2)) : (u) => Math.min(1, u / 0.08) * Math.pow(1 - u, 1.3));
    // v3: real breath is turbulent: the airflow flutters irregularly (≈8–40 Hz), it never holds a steady hiss
    const fl = this.wander(9);
    for (let i = 0; i < n; i++) y[i] *= env(i / n) * (1 + 0.28 * fl(i / sr));
    return y;
  }
  // a footstep on stone: heel (low knock + grit), toe, an optional scuff; o.weight scales the knock
  step(o = {}) {
    const sr = this.sr, r = this.r, w = o.weight || 0.6, y = this.arr(0.6);
    SLX.strike(y, 0, Math.round(0.0016 * sr), 0.9 * w, this.stoneModes(o.s || 1), sr);
    for (let i = 0; i < 0.4 * sr; i++) y[i] += 0.5 * w * Math.sin(2 * Math.PI * (o.body || 78) * i / sr) * Math.exp(-i / ((o.decay || 0.035) * sr)) * Math.min(1, i / (0.002 * sr));
    const grit = this.rustle(0.08, { density: 900, rub: 0.1, lo: 2500, hi: 9000, grain: 0.003, env: (u) => Math.exp(-u * 4) });
    for (let i = 0; i < grit.length; i++) y[i] += grit[i] * 0.35 * w;
    SLX.strike(y, Math.round(r.range(0.08, 0.12) * sr), Math.round(0.001 * sr), 0.35 * w, this.stoneModes(1.3), sr);
    if (o.scuff) { const sc = this.rustle(0.22, { density: 500, rub: 0.5, lo: 900, hi: 4500, grain: 0.006 }); const i0 = Math.round(0.04 * sr); for (let i = 0; i < sc.length && i0 + i < y.length; i++) y[i0 + i] += sc[i] * o.scuff; }
    return y;
  }
  // a hand landing on a surface: skin slap + the surface's own ring (a soft, wide contact)
  slap(modes, o = {}) {
    const sr = this.sr, y = this.arr(o.len || 0.5);
    SLX.strike(y, 0, Math.round((o.width || 0.003) * sr), o.amp || 0.8, modes, sr);
    const n = Math.round(0.018 * sr), z = this.white(n);
    for (let i = 0; i < n; i++) z[i] *= Math.exp(-i / (n * 0.22));
    SLX.bq(z, 'bp', 1800, 0.8, sr);
    for (let i = 0; i < n; i++) y[i] += z[i] * (o.skin == null ? 0.6 : o.skin);
    return y;
  }
  // bubbles (Minnaert: a sine whose pitch rises as it decays) added into L/R
  bubble(L, R, i0, f, tau, amp, pan) {
    const sr = this.sr, n = Math.ceil(tau * 6 * sr), a = (pan + 1) * Math.PI / 4, gl = Math.cos(a) * amp, gr = Math.sin(a) * amp;
    let ph = 0;
    for (let i = 0; i < n && i0 + i < L.length; i++) {
      const t = i / sr; ph += 2 * Math.PI * f * (1 + 0.6 * t / tau * 0.25) / sr;
      const v = Math.sin(ph) * Math.exp(-t / tau) * Math.min(1, i / (0.0008 * sr));
      L[i0 + i] += v * gl; R[i0 + i] += v * gr;
    }
  }
  // coffee moving in the cup: a low swirl that follows env(t), with a few small bubbles
  liquid(dur, env, o = {}) {
    const sr = this.sr, r = this.r, n = Math.ceil(dur * sr), y = this.white(n);
    SLX.bq(y, 'bp', o.f || 520, 1.2, sr); SLX.bq(y, 'lp', 1400, 0.7, sr);
    for (let i = 0; i < n; i++) y[i] *= env(i / sr);
    const L = new Float32Array(n), R = new Float32Array(n);
    for (let t = 0; t < dur; t += r.range(0.02, 0.09)) { const a = env(t); if (a > 0.05 && r.chance(0.6)) this.bubble(L, R, Math.round(t * sr), r.range(500, 1300), r.range(0.006, 0.014), 0.25 * a, 0); }
    for (let i = 0; i < n; i++) y[i] += L[i] + R[i];
    return y;
  }
  // the ceramic smash (stereo { L, R }): crack, the shatter ring, the cup's own body, the floor, then every shard bouncing
  // at its own lane's gravity. o.v impact speed (m/s), o.g (m/s²), o.pan, o.slow (time stretch), o.pitch
  smash(o) {
    const sr = this.sr, r = this.r, slow = o.slow || 1, P = o.pitch || 1, len = (o.len || 2.2) * slow;
    const L = this.arr(len), R = this.arr(len), vr = o.v / 4.43, pan = o.pan || 0;
    const mono = this.arr(Math.min(len, 1.2 * slow));
    // the crack: a very short broadband burst
    { const n = Math.round(0.008 * slow * sr), z = this.white(n); for (let i = 0; i < n; i++) z[i] *= Math.exp(-i / (0.0015 * slow * sr)); SLX.bq(z, 'hp', 1200 * P, 0.7, sr); for (let i = 0; i < n; i++) mono[i] += z[i] * 0.5 * vr; }
    // the shatter: dozens of high, short modes, excited by the impact and a few fracture clicks right after it
    const sh = [];
    for (let k = 0; k < 36; k++) { const f = Math.exp(r.range(Math.log(1800), Math.log(9500))) * P; sh.push([f, r.range(0.02, 0.16) * Math.pow(2000 / f * P, 0.3) * Math.pow(slow, 0.7), r.range(0.2, 1) * Math.pow(2000 * P / f, 0.5)]); }
    SLX.strike(mono, 0, Math.round(0.00015 * slow * sr), 0.16 * vr, sh, sr);
    for (let k = 0; k < 9; k++) SLX.strike(mono, Math.round(r.range(0.001, 0.014) * slow * sr), Math.round(0.0001 * slow * sr), r.range(0.05, 0.14) * vr, sh.filter(() => r.chance(0.4)), sr);
    // v3: the crunch — a dense burst of micro-fractures in the first ≈60 ms as the material gives way, each a tiny high
    //     ring, thinning out exponentially; a harder impact makes more of them
    { const nCr = Math.round(40 + 50 * vr * vr);
      for (let k = 0; k < nCr; k++) {
        const tt = -Math.log(1 - r.next() * 0.995) * 0.018 * slow, f = Math.exp(r.range(Math.log(2400), Math.log(10500))) * P;
        const x = this.arr(0.03 * slow); SLX.strike(x, 0, Math.round(0.00008 * slow * sr), 1, [[f, r.range(0.002, 0.007) * Math.pow(slow, 0.7), 1], [f * r.range(1.4, 1.8), 0.003 * Math.pow(slow, 0.7), 0.5]], sr);
        SLX.mixIn(L, R, x, Math.round(tt * sr), 0.06 * vr * r.range(0.3, 1) * Math.exp(-tt / (0.03 * slow)), pan + r.range(-0.3, 0.3));
      } }
    // the cup's own body (a short "thock" as it lands, cut short by the break) and the floor taking the hit
    SLX.strike(mono, 0, Math.round(0.0006 * slow * sr), 0.55 * vr, this.cupModes(P).map(([f, tau, a]) => [f, tau * 0.3 * Math.pow(slow, 0.7), a]), sr);
    SLX.strike(mono, 0, Math.round(0.0015 * slow * sr), 0.5 * vr, this.stoneModes(P * 1.4).map(([f, tau, a]) => [f, tau * Math.pow(slow, 0.7), a]), sr);
    SLX.mixIn(L, R, mono, 0, 1, pan);
    // the shards: each piece flies up and bounces with restitution, every landing a tiny clink; harder impact → more pieces
    const pieces = Math.round(18 + 14 * vr * vr);
    for (let p = 0; p < pieces; p++) {
      const s = r.range(0.3, 1), b = r.range(2800, 7500) / Math.sqrt(s) * P, modes = [[b, r.range(0.012, 0.04) * Math.pow(slow, 0.7), 1], [b * r.range(1.6, 1.9), 0.02 * Math.pow(slow, 0.7), 0.6], [b * r.range(2.7, 3.1), 0.012 * Math.pow(slow, 0.7), 0.35]];
      let t = r.range(0, 0.01), vUp = o.v * r.range(0.06, 0.26) * (1.2 - 0.5 * s);
      const ppan = pan + r.range(-0.35, 0.35), x = this.arr(0.06 * slow), amp0 = 0.5 * s;
      SLX.strike(x, 0, Math.round(0.00012 * slow * sr), 1, modes, sr);
      for (let k = 0; k < 8; k++) {
        t += 2 * vUp / o.g;
        if (t * slow > len - 0.1 || 2 * vUp / o.g < 0.008) break;
        SLX.mixIn(L, R, x, Math.round(t * slow * sr), amp0 * Math.sqrt(vUp / o.v) * 1.6, ppan);
        vUp *= r.range(0.3, 0.45);
      }
      if (r.chance(0.4)) {   // it slides to a stop
        const sk = this.rustle(r.range(0.04, 0.12) * slow, { density: 700 / slow, rub: 0.15, lo: 2800 * P, hi: 8000 * P, grain: 0.003 * slow, env: (u) => 1 - u });
        SLX.mixIn(L, R, sk, Math.round(Math.min(t * slow, len - 0.2) * sr), 0.06 * s * vr, ppan);
      }
    }
    return { L, R };
  }
  // a spring-loaded release clamp: the catch clicks, the jaw clacks open against its stop, the spring rings briefly
  clamp(o = {}) {
    const sr = this.sr, slow = o.slow || 1, P = o.pitch || 1, y = this.arr(0.6 * slow);
    const s = (m) => m.map(([f, tau, a]) => [f * P, tau * Math.pow(slow, 0.7), a]);
    SLX.strike(y, 0, Math.round(0.00008 * slow * sr), 0.7, s(this.metalModes(2650, 0.4)), sr);
    SLX.strike(y, Math.round(0.012 * slow * sr), Math.round(0.00015 * slow * sr), 0.5, s(this.metalModes(1780, 0.5)), sr);
    SLX.strike(y, Math.round(0.014 * slow * sr), Math.round(0.0005 * slow * sr), 0.2, s([[742, 0.3, 1], [1488, 0.16, 0.4], [2230, 0.08, 0.2]]), sr);
    return y;
  }
  // a felt piano note (additive, two slightly detuned strings, a soft hammer), cached per pitch
  pianoBuf(m) {
    const key = 'p' + m; if (this.cache[key]) return this.cache[key];
    const sr = this.sr, f = 440 * Math.pow(2, (m - 69) / 12), dur = Math.min(7, 2.5 + 3.5 * Math.pow(2, -(m - 48) / 24)), n = Math.ceil(dur * sr), y = new Float32Array(n);
    const r = new RNG(1000 + m), B = 0.0003 * Math.pow(2, (m - 60) / 18);
    for (let k = 1; k <= 10; k++) {
      const fk = f * k * Math.sqrt(1 + B * k * k); if (fk > 7500) break;
      const a = Math.pow(k, -1.2) * Math.exp(-0.25 * (k - 1)), tl = (1.6 + 3.2 * Math.pow(2, -(m - 48) / 18)) / (1 + 0.45 * (k - 1)), ts = 0.12 + 0.25 / k;
      for (const [df, w] of [[0, 1], [fk * 0.00045, 0.7]]) {
        const wv = 2 * Math.PI * (fk + df) / sr, c = Math.cos(wv), s = Math.sin(wv), ph = r.range(0, 6.283), dl = Math.exp(-1 / (tl * sr)), ds = Math.exp(-1 / (ts * sr));
        let x = Math.cos(ph), z = Math.sin(ph), el = 0.55 * a * w, es = 0.45 * a * w;
        for (let i = 0; i < n; i++) { const nx = x * c - z * s; z = x * s + z * c; x = nx; y[i] += (el + es) * z; el *= dl; es *= ds; }
      }
    }
    const on = Math.round(0.005 * sr); for (let i = 0; i < on; i++) y[i] *= i / on;
    let pk = 0; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(y[i]));
    for (let i = 0; i < n; i++) y[i] /= pk;
    return (this.cache[key] = y);
  }
  // a small bell / celesta bar (modal), cached per pitch
  bellBuf(m) {
    const key = 'b' + m; if (this.cache[key]) return this.cache[key];
    const f = slHz(m), y = this.hit([[f, 1.6, 1], [f * 2.76, 0.6, 0.45], [f * 5.4, 0.3, 0.25], [f * 8.93, 0.15, 0.12]], { width: 0.0007, len: 5 });
    let pk = 0; for (let i = 0; i < y.length; i++) pk = Math.max(pk, Math.abs(y[i]));
    for (let i = 0; i < y.length; i++) y[i] /= pk;
    return (this.cache[key] = y);
  }
}

// ---- extra generators for this film
Object.assign(SlFx.prototype, {
  // a footstep on wooden boards or a stair tread: a soft heel knock through the board's modes, a creak if it is loaded
  woodStep(o = {}) {
    const sr = this.sr, r = this.r, w = o.weight || 0.6, y = this.arr(0.7);
    SLX.strike(y, 0, Math.round(0.003 * sr), 0.9 * w, this.woodModes(o.f || r.range(95, 130), 1.6), sr);
    for (let i = 0; i < 0.3 * sr; i++) y[i] += 0.45 * w * Math.sin(2 * Math.PI * (o.body || 72) * i / sr) * Math.exp(-i / (0.05 * sr)) * Math.min(1, i / (0.003 * sr));
    SLX.strike(y, Math.round(r.range(0.07, 0.1) * sr), Math.round(0.0015 * sr), 0.3 * w, this.woodModes(r.range(170, 220)), sr);
    if (o.creak) { const c = this.creak(r.range(0.25, 0.45), [[r.range(150, 190), 0.02, 1], [r.range(380, 430), 0.012, 0.6], [r.range(760, 860), 0.008, 0.3]], { rate: [14, 40] }); for (let i = 0; i < c.length && i + 0.04 * sr < y.length; i++) y[i + Math.round(0.04 * sr)] += c[i] * o.creak; }
    if (o.scuff) { const sc = this.rustle(0.2, { density: 500, rub: 0.5, lo: 800, hi: 4000, grain: 0.006 }); for (let i = 0; i < sc.length; i++) y[i] += sc[i] * o.scuff; }
    return y;
  },
  // the ceramic ball landing on its rubber pad (over a steel plate): a dull "dok" of the pad and plate, the glazed ball's
  // own short ring, a little rubber squeak. o.v impact speed (m/s); o.slow stretches it for the replay (and lowers it)
  ballHit(o = {}) {
    const sr = this.sr, slow = o.slow || 1, P = o.pitch || 1, vr = o.v / 4.43, y = this.arr(0.9 * slow);
    const st = (m) => m.map(([f, tau, a]) => [f * P, tau * Math.pow(slow, 0.7), a]);
    SLX.strike(y, 0, Math.round(0.0012 * slow * sr), 0.9 * vr, st([[165, 0.06, 1], [260, 0.045, 0.6], [410, 0.03, 0.4], [690, 0.018, 0.25]]), sr);   // pad + plate
    SLX.strike(y, 0, Math.round(0.0005 * slow * sr), 0.28 * vr, st([[3420, 0.05, 1], [5100, 0.035, 0.55], [7900, 0.02, 0.35]]), sr);                    // the ball rings
    SLX.strike(y, 0, Math.round(0.0025 * slow * sr), 0.5 * vr, st(this.metalModes(520, 0.35)), sr);                                                // the stand's base plate
    for (let i = 0; i < 0.12 * slow * sr; i++) y[i] += 0.5 * vr * Math.sin(2 * Math.PI * 58 * P * i / sr) * Math.exp(-i / (0.04 * slow * sr)) * Math.min(1, i / (0.002 * sr));
    return y;
  },
  // a short synthetic shimmer (the hologram): high partials fading in and out, gently detuned
  shimmer(dur, f0, o = {}) {
    const sr = this.sr, n = Math.ceil(dur * sr), y = this.arr(dur), r = this.r;
    for (const k of [1, 1.5, 2, 3, 4]) {
      const f = f0 * k * r.range(0.997, 1.003), a = 1 / k;
      for (let i = 0; i < n; i++) { const t = i / sr, u = t / dur; y[i] += a * Math.sin(2 * Math.PI * f * t + 2 * Math.sin(2 * Math.PI * 5.3 * t)) * Math.sin(Math.PI * Math.pow(u, o.skew || 0.6)) * (0.7 + 0.3 * Math.sin(2 * Math.PI * (7 + k) * t)); }
    }
    return y;
  },
  beep(f, dur) { const sr = this.sr, y = this.arr(dur + 0.02); for (let i = 0; i < dur * sr; i++) { const t = i / sr; y[i] = Math.sin(2 * Math.PI * f * t) * Math.min(1, t / 0.004, (dur - t) / 0.01); } return y; },
});
