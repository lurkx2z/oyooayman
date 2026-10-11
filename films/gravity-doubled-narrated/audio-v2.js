/* =====================================================================
   AUDIO v2 — "What If Gravity Doubled?" — the cinematic mix (gravity-doubled-narrated-v2.html). The picture is the
   same film as v1; only the sound changes. js/audio/audioEngine.js is unchanged (this is a subclass).
   FIVE STEMS, kept separate until the final export (mix-v2.py renders each one alone with `audio.solo = '<stem>'`):
     voice  the five ElevenLabs clips (never regenerated), levelled per clip, a presence lift, an even compressor
     music  an original score in F: felt piano, string pads, pizzicato, a few bells and a felt drum, scored to the action
     amb    the café (room tone, the espresso machine, the square through the glass) and the plaza (wind, the fountain,
            birds, pigeons, a distant murmur)
     foley  character movement: clothes, breath and effort, hands, shoes, the passer-by's bag, the jogger
     sfx    physics and impacts: ceramic (modal synthesis), chairs, the bench, the car's springs, the drop and its shards
   Ducking is driven by the real word times (window.GN): each stem dips by its own amount under every spoken window with
   a smooth attack (≈0.22 s, starting just before the first word) and release (≈0.8 s after the last). Levels and duck
   depths live in mix-v2.js. Every sound is synthesised from seeded noise and maths: a pure function of time.
   ===================================================================== */

const GB_STEMS = ['voice', 'music', 'amb', 'foley', 'sfx'];

// the spoken windows: every word of every clip, merged when the gap between words is shorter than `merge`
function gnSpeechWindows(merge) {
  const ws = [];
  for (const c of GN.clips) c.words.forEach((w, i) => ws.push([w.start, i === c.words.length - 1 ? Math.max(w.end, c.speechEnd) : w.end]));
  ws.sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const [a, b] of ws) { const L = out[out.length - 1]; if (L && a - L[1] < merge) L[1] = Math.max(L[1], b); else out.push([a, b]); }
  return out;
}

// the duck in dB at film time t (0 away from speech, `depth` under it; raised-cosine attack and release)
function gbDuckDb(t, depth, M, wins) {
  let d = 0;
  for (const [a, b] of wins) {
    const a1 = a - M.lead, a0 = a1 - M.attack, r0 = b + M.hold, r1 = r0 + M.release;
    let k = 0;
    if (t >= a1 && t <= r0) k = 1;
    else if (t < a1 && t > a0) k = a < 1.0 ? 1 : 0.5 - 0.5 * Math.cos(Math.PI * (t - a0) / (a1 - a0));   // the first line: ducked from frame 1
    else if (t < a1 && a < 1.0) k = 1;
    else if (t > r0 && t < r1) k = 0.5 + 0.5 * Math.cos(Math.PI * (t - r0) / (r1 - r0));
    d = Math.min(d, depth * k);
  }
  return d;
}
function gbDuckCurve(depth, M, wins, end, rate) {
  const n = Math.ceil(end * rate) + 1, c = new Float32Array(n);
  for (let i = 0; i < n; i++) c[i] = Math.pow(10, gbDuckDb(i / rate, depth, M, wins) / 20);
  return c;
}
function gbMidi(n) {
  if (typeof n === 'number') return n;
  const m = /^([A-G])(b|#)?(-?\d)$/.exec(n);
  return 12 * (+m[3] + 1) + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === 'b' ? -1 : m[2] === '#' ? 1 : 0);
}
const gbHz = (n) => 440 * Math.pow(2, (gbMidi(n) - 69) / 12);

// ---------------------------------------------------------------------------------------------------------------------
// sample-level DSP (everything deterministic)
// ---------------------------------------------------------------------------------------------------------------------
const GBX = {
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

class GbFx {
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
    if (o.norm) { const pk = o.norm === true ? GBX.peak(x, o.xr) : o.norm; if (pk > 1e-9) v /= pk; }   // vol = the sound's peak
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
    GBX.strike(y, 0, Math.round((o.width || 0.0004) * sr), o.amp == null ? 1 : o.amp, modes, sr);
    for (const [dt, w, a] of (o.extra || [])) GBX.strike(y, Math.round(dt * sr), Math.round(w * sr), a, modes, sr);
    if (o.noise) {
      const n = Math.round((o.nlen || 0.004) * sr), z = this.white(n);
      for (let i = 0; i < n; i++) z[i] *= Math.exp(-i / (n * 0.25));
      GBX.bq(z, 'hp', o.nhp || 2000, 0.7, sr);
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
    return GBX.res(this.arr(dur + 0.12), e, modes, sr);
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
    GBX.bq(y, 'hp', o.lo || 700, 0.7, sr); GBX.bq(y, 'lp', o.hi || 6500, 0.7, sr);
    if (o.peak) GBX.bq(y, 'peak', o.peak, 1.0, sr, 5);
    return y;
  }
  // breath: noise through mouth/throat formants, optional voiced effort (a strained hum under the air), o.env(u)
  breath(dur, o = {}) {
    const sr = this.sr, r = this.r, n = Math.ceil(dur * sr), src = this.white(n), y = this.arr(dur + 0.02);
    const F = o.inhale ? [[1150, 2.2, 0.8], [2400, 3, 0.55], [3900, 3.5, 0.3]] : o.teeth ? [[2600, 2, 0.5], [4300, 2.5, 0.6], [6200, 3, 0.3]] : [[640, 1.8, 1], [1250, 2.4, 0.6], [2600, 3, 0.35]];
    for (const [f, q, a] of F) { const z = Float32Array.from(src); GBX.bq(z, 'bp', f * r.range(0.95, 1.05), q, sr); for (let i = 0; i < n; i++) y[i] += z[i] * a; }
    if (o.voice) {   // glottal pulses with jitter through an "uh"/"nn" vocal tract
      const v = new Float32Array(n), f0 = o.f0 || 120, wv = this.wander(2.2);
      let ph = 0;
      for (let i = 0; i < n; i++) { ph += f0 * (1 + 0.03 * wv(i / sr) + 0.02 * (r.next() - 0.5)) / sr; if (ph >= 1) { ph -= 1; v[i] = 1; } }
      const V = o.nasal ? [[260, 4, 1], [1100, 5, 0.25], [2300, 6, 0.2]] : [[620, 4, 1], [1180, 5, 0.6], [2450, 6, 0.3]];
      for (const [f, q, a] of V) { const z = Float32Array.from(v); GBX.bq(z, 'bp', f, q, sr); for (let i = 0; i < n; i++) y[i] += z[i] * a * o.voice * 3; }
    }
    const env = o.env || (o.inhale ? (u) => Math.pow(Math.sin(Math.PI * Math.min(1, u / 0.8) * 0.5), 1.5) * (1 - Math.pow(Math.max(0, (u - 0.8) / 0.2), 2)) : (u) => Math.min(1, u / 0.08) * Math.pow(1 - u, 1.3));
    for (let i = 0; i < n; i++) y[i] *= env(i / n);
    return y;
  }
  // a footstep on stone: heel (low knock + grit), toe, an optional scuff; o.weight scales the knock
  step(o = {}) {
    const sr = this.sr, r = this.r, w = o.weight || 0.6, y = this.arr(0.6);
    GBX.strike(y, 0, Math.round(0.0016 * sr), 0.9 * w, this.stoneModes(o.s || 1), sr);
    for (let i = 0; i < 0.4 * sr; i++) y[i] += 0.5 * w * Math.sin(2 * Math.PI * (o.body || 78) * i / sr) * Math.exp(-i / ((o.decay || 0.035) * sr)) * Math.min(1, i / (0.002 * sr));
    const grit = this.rustle(0.08, { density: 900, rub: 0.1, lo: 2500, hi: 9000, grain: 0.003, env: (u) => Math.exp(-u * 4) });
    for (let i = 0; i < grit.length; i++) y[i] += grit[i] * 0.35 * w;
    GBX.strike(y, Math.round(r.range(0.08, 0.12) * sr), Math.round(0.001 * sr), 0.35 * w, this.stoneModes(1.3), sr);
    if (o.scuff) { const sc = this.rustle(0.22, { density: 500, rub: 0.5, lo: 900, hi: 4500, grain: 0.006 }); const i0 = Math.round(0.04 * sr); for (let i = 0; i < sc.length && i0 + i < y.length; i++) y[i0 + i] += sc[i] * o.scuff; }
    return y;
  }
  // a hand landing on a surface: skin slap + the surface's own ring (a soft, wide contact)
  slap(modes, o = {}) {
    const sr = this.sr, y = this.arr(o.len || 0.5);
    GBX.strike(y, 0, Math.round((o.width || 0.003) * sr), o.amp || 0.8, modes, sr);
    const n = Math.round(0.018 * sr), z = this.white(n);
    for (let i = 0; i < n; i++) z[i] *= Math.exp(-i / (n * 0.22));
    GBX.bq(z, 'bp', 1800, 0.8, sr);
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
    GBX.bq(y, 'bp', o.f || 520, 1.2, sr); GBX.bq(y, 'lp', 1400, 0.7, sr);
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
    { const n = Math.round(0.008 * slow * sr), z = this.white(n); for (let i = 0; i < n; i++) z[i] *= Math.exp(-i / (0.0015 * slow * sr)); GBX.bq(z, 'hp', 1200 * P, 0.7, sr); for (let i = 0; i < n; i++) mono[i] += z[i] * 0.5 * vr; }
    // the shatter: dozens of high, short modes, excited by the impact and a few fracture clicks right after it
    const sh = [];
    for (let k = 0; k < 36; k++) { const f = Math.exp(r.range(Math.log(1800), Math.log(9500))) * P; sh.push([f, r.range(0.02, 0.16) * Math.pow(2000 / f * P, 0.3) * Math.pow(slow, 0.7), r.range(0.2, 1) * Math.pow(2000 * P / f, 0.5)]); }
    GBX.strike(mono, 0, Math.round(0.00015 * slow * sr), 0.16 * vr, sh, sr);
    for (let k = 0; k < 9; k++) GBX.strike(mono, Math.round(r.range(0.001, 0.014) * slow * sr), Math.round(0.0001 * slow * sr), r.range(0.05, 0.14) * vr, sh.filter(() => r.chance(0.4)), sr);
    // the cup's own body (a short "thock" as it lands, cut short by the break) and the floor taking the hit
    GBX.strike(mono, 0, Math.round(0.0006 * slow * sr), 0.55 * vr, this.cupModes(P).map(([f, tau, a]) => [f, tau * 0.3 * Math.pow(slow, 0.7), a]), sr);
    GBX.strike(mono, 0, Math.round(0.0015 * slow * sr), 0.5 * vr, this.stoneModes(P * 1.4).map(([f, tau, a]) => [f, tau * Math.pow(slow, 0.7), a]), sr);
    GBX.mixIn(L, R, mono, 0, 1, pan);
    // the shards: each piece flies up and bounces with restitution, every landing a tiny clink; harder impact → more pieces
    const pieces = Math.round(18 + 14 * vr * vr);
    for (let p = 0; p < pieces; p++) {
      const s = r.range(0.3, 1), b = r.range(2800, 7500) / Math.sqrt(s) * P, modes = [[b, r.range(0.012, 0.04) * Math.pow(slow, 0.7), 1], [b * r.range(1.6, 1.9), 0.02 * Math.pow(slow, 0.7), 0.6], [b * r.range(2.7, 3.1), 0.012 * Math.pow(slow, 0.7), 0.35]];
      let t = r.range(0, 0.01), vUp = o.v * r.range(0.06, 0.26) * (1.2 - 0.5 * s);
      const ppan = pan + r.range(-0.35, 0.35), x = this.arr(0.06 * slow), amp0 = 0.5 * s;
      GBX.strike(x, 0, Math.round(0.00012 * slow * sr), 1, modes, sr);
      for (let k = 0; k < 8; k++) {
        t += 2 * vUp / o.g;
        if (t * slow > len - 0.1 || 2 * vUp / o.g < 0.008) break;
        GBX.mixIn(L, R, x, Math.round(t * slow * sr), amp0 * Math.sqrt(vUp / o.v) * 1.6, ppan);
        vUp *= r.range(0.3, 0.45);
      }
      if (r.chance(0.4)) {   // it slides to a stop
        const sk = this.rustle(r.range(0.04, 0.12) * slow, { density: 700 / slow, rub: 0.15, lo: 2800 * P, hi: 8000 * P, grain: 0.003 * slow, env: (u) => 1 - u });
        GBX.mixIn(L, R, sk, Math.round(Math.min(t * slow, len - 0.2) * sr), 0.06 * s * vr, ppan);
      }
    }
    return { L, R };
  }
  // a spring-loaded release clamp: the catch clicks, the jaw clacks open against its stop, the spring rings briefly
  clamp(o = {}) {
    const sr = this.sr, slow = o.slow || 1, P = o.pitch || 1, y = this.arr(0.6 * slow);
    const s = (m) => m.map(([f, tau, a]) => [f * P, tau * Math.pow(slow, 0.7), a]);
    GBX.strike(y, 0, Math.round(0.00008 * slow * sr), 0.7, s(this.metalModes(2650, 0.4)), sr);
    GBX.strike(y, Math.round(0.012 * slow * sr), Math.round(0.00015 * slow * sr), 0.5, s(this.metalModes(1780, 0.5)), sr);
    GBX.strike(y, Math.round(0.014 * slow * sr), Math.round(0.0005 * slow * sr), 0.2, s([[742, 0.3, 1], [1488, 0.16, 0.4], [2230, 0.08, 0.2]]), sr);
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
    const f = gbHz(m), y = this.hit([[f, 1.6, 1], [f * 2.76, 0.6, 0.45], [f * 5.4, 0.3, 0.25], [f * 8.93, 0.15, 0.12]], { width: 0.0007, len: 5 });
    let pk = 0; for (let i = 0; i < y.length; i++) pk = Math.max(pk, Math.abs(y[i]));
    for (let i = 0; i < y.length; i++) y[i] /= pk;
    return (this.cache[key] = y);
  }
}

class GbAudio extends AudioEngine {
  constructor(tl, app) { super(tl); this.app = app; this.wavName = 'gravity-doubled-narrated-v2-soundtrack.wav'; this.solo = null; this.noDuck = false; }
  fingerprintData() {
    return [GB, GB_CUES, GN.clips.map((c) => [c.id, c.hash, c.start, c.seconds, c.gainDb]), GB_CAR, GB_DROP, window.GB_MIX,
      GbFx.toString(), Object.values(GBX).map(String).join(''), gnSpeechWindows.toString(), gbDuckDb.toString()];
  }

  // the voice clips are MP3s: decode them before the offline render schedules them (not needed for the other stems alone)
  async renderOffline() {
    this.vo = {};
    if (window.GN_VO && (!this.solo || this.solo === 'voice')) {
      const dc = new OfflineAudioContext(2, 1, this.sampleRate);
      for (const c of GN.clips) {
        const b64 = GN_VO[c.id]; if (!b64) { console.warn('narration: no audio for', c.id); continue; }
        const bin = atob(b64), u8 = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        this.vo[c.id] = await dc.decodeAudioData(u8.buffer);
      }
    } else if (!window.GN_VO) console.warn('narration: narration-audio.js not loaded; the soundtrack has no voice');
    return super.renderOffline();
  }

  _build(ctx) {
    const M = window.GB_MIX, END = CONFIG.duration + 1.5, only = this.solo;
    const master = ctx.createGain();
    if (only) master.connect(ctx.destination);
    else {   // the live fallback's master: a gentle glue compressor and a safety limiter (the export is mastered by mix-v2.py)
      const glue = ctx.createDynamicsCompressor(); glue.threshold.value = -20; glue.knee.value = 6; glue.ratio.value = 1.8; glue.attack.value = 0.03; glue.release.value = 0.25;
      const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.1;
      master.connect(glue); glue.connect(lim); lim.connect(ctx.destination);
    }
    const wins = gnSpeechWindows(M.merge);
    for (const id of GB_STEMS) {
      if (only && only !== id) continue;
      const st = M.stems[id], bus = ctx.createGain();
      let node = bus;
      if (st.hp) for (let k = 0; k < 2; k++) { const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = st.hp; f.Q.value = 0.707; node.connect(f); node = f; }
      const trim = ctx.createGain(), duck = ctx.createGain();
      trim.gain.value = only ? 1 : Math.pow(10, st.gain / 20);
      node.connect(trim); trim.connect(duck); duck.connect(master);
      if (st.duck && !this.noDuck) duck.gain.setValueCurveAtTime(gbDuckCurve(st.duck, M, wins, END, 100), 0, END);
      this['_' + id](ctx, bus, END);
    }
  }

  // ===================================================================================================== VOICE
  _voice(ctx, dest) {
    const C = window.GB_MIX.voiceComp;
    const low = ctx.createBiquadFilter(); low.type = 'lowshelf'; low.frequency.value = 180; low.gain.value = -1.5;
    const pres = ctx.createBiquadFilter(); pres.type = 'peaking'; pres.frequency.value = 3200; pres.Q.value = 0.9; pres.gain.value = 2;
    const vc = ctx.createDynamicsCompressor(); vc.threshold.value = C.threshold; vc.knee.value = C.knee; vc.ratio.value = C.ratio; vc.attack.value = C.attack; vc.release.value = C.release;
    const mk = ctx.createGain(); mk.gain.value = Math.pow(10, 4 / 20);
    low.connect(pres); pres.connect(vc); vc.connect(mk); mk.connect(dest);
    for (const c of GN.clips) {
      const buf = this.vo && this.vo[c.id]; if (!buf) continue;
      const src = ctx.createBufferSource(), g = ctx.createGain(), v = Math.pow(10, (c.gainDb + ((window.GB_MIX.voiceTrim || {})[c.id] || 0)) / 20), f1 = Math.min(c.start + buf.duration, c.speechEnd + 0.4);
      src.buffer = buf; src.connect(g); g.connect(low); src.start(c.start);
      // every word plays whole; only the silent tail after the last word is faded (clip B's file ends on a click)
      g.gain.setValueAtTime(v, c.start); g.gain.setValueAtTime(v, f1 - 0.15); g.gain.linearRampToValueAtTime(0, f1);
    }
  }

  // ===================================================================================================== MUSIC
  _music(ctx, dest, END) {
    const fx = new GbFx(ctx, CONFIG.seed + 101), S = new SoundKit(ctx, CONFIG.seed + 102), r = new RNG(CONFIG.seed + 103), T = GB;
    const bus = ctx.createGain(); bus.connect(dest);
    const hall = fx.ir(3.4, { bright: 0.5, damp: 3.5, shape: 2.0, pre: 0.02, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.42;
    bus.connect(hall); hall.connect(wet); wet.connect(dest);
    const piano = (t, n, vel, dur = 2.5, pan = 0, fade = 0.4) => fx.play(fx.pianoBuf(gbMidi(n)), t, bus, { vol: vel * 0.34, pan, stop: Math.min(END, t + dur + fade), fade });
    const bell = (t, n, vol, pan = 0) => fx.play(fx.bellBuf(gbMidi(n)), t, bus, { vol: vol * 0.25, pan });
    const pizz = (t, n, vol, pan = 0, bright = 0.35) => S.pluck(t, gbHz(n), vol * 0.32, pan, bus, 1.4, bright);
    const tick = (t, f, vol, pan = 0) => fx.play(fx.hit([[f, 0.035, 1], [f * 2.68, 0.018, 0.45], [f * 4.1, 0.01, 0.2]], { width: 0.0006 }), t, bus, { vol: vol * 0.3, pan });
    const drum = (t, n, vol) => { const f = gbHz(n); fx.play(fx.hit([[f, 0.5, 1], [f * 1.5, 0.3, 0.55], [f * 1.99, 0.22, 0.4], [f * 2.44, 0.15, 0.25], [f * 2.9, 0.1, 0.12]], { width: 0.003, len: 2.2, noise: 0.15, nhp: 400, nlen: 0.01 }), t, bus, { vol: vol * 0.5 }); };
    // string section: three players per note a few cents apart (left / centre / right), sawtooth through a soft lowpass
    // o: att, rel, cut, cutTo (filter opens over the note), keys [[t, level 0…1]] (crescendo shape), pan
    const strings = (t0, t1, notes, vol, o = {}) => {
      const att = o.att || 1.0, rel = o.rel || 1.2, g = ctx.createGain();
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol * 0.11 * (o.keys ? o.keys[0][1] : 1), t0 + att);
      for (const [t, v] of (o.keys || [])) if (t > t0 + att && t < t1 - rel) g.gain.linearRampToValueAtTime(vol * 0.11 * v, t);
      const vEnd = o.keys ? o.keys[o.keys.length - 1][1] : 1;
      g.gain.linearRampToValueAtTime(vol * 0.11 * vEnd, Math.max(t0 + att + 0.01, t1 - rel)); g.gain.linearRampToValueAtTime(0, t1);
      g.connect(bus);
      const lanes = [-0.55, 0, 0.55].map((p) => {
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.6; lp.frequency.setValueAtTime(o.cut || 1700, t0);
        if (o.cutTo) lp.frequency.linearRampToValueAtTime(o.cutTo, t1 - rel * 0.5);
        const pn = ctx.createStereoPanner(); pn.pan.value = Math.max(-1, Math.min(1, p + (o.pan || 0))); lp.connect(pn); pn.connect(g); return lp;
      });
      for (const nn of notes) {
        const f = gbHz(nn);
        [-7, 1, 6].forEach((d, k) => {
          const osc = ctx.createOscillator(), og = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
          osc.type = o.wave || 'sawtooth'; osc.frequency.value = f; osc.detune.value = d + r.range(-2, 2);
          lfo.frequency.value = r.range(4.4, 5.4); lg.gain.setValueAtTime(0, t0); lg.gain.linearRampToValueAtTime(o.vib == null ? 7 : o.vib, t0 + Math.min(1.5, (t1 - t0) * 0.6));
          lfo.connect(lg); lg.connect(osc.detune);
          og.gain.value = 1 / Math.sqrt(notes.length); osc.connect(og); og.connect(lanes[k]);
          osc.start(t0); osc.stop(t1 + 0.05); lfo.start(t0); lfo.stop(t1 + 0.05);
        });
      }
    };

    // ---- S1: a warm felt-piano figure in F over a soft pad; a short swell on "suddenly doubled"; everything stops dead at g
    const figA = ['F4', 'C5', 'A4', 'E5', 'G4', 'C5', 'A4', 'D5'];
    for (let i = 0; 0.1 + i * 0.36 < T.g - 0.12; i++) piano(0.1 + i * 0.36, figA[i % 8], 0.4 + 0.08 * (i % 2 ? 0 : 1), Math.min(1.2, T.g - 0.04 - 0.1 - i * 0.36), i % 2 ? 0.25 : -0.25, 0.06);
    piano(0.1, 'F2', 0.55, T.g - 0.14, 0, 0.06); piano(0.1, 'C3', 0.35, T.g - 0.14, 0, 0.06);
    strings(0.0, T.g + 0.05, ['F3', 'A3', 'C4', 'E4'], 0.45, { att: 0.8, rel: 0.06, cut: 1500 });
    strings(T.g - 0.9, T.g + 0.03, ['C3', 'G3', 'Db4'], 0.55, { att: 0.85, rel: 0.03, cut: 900, cutTo: 1800 });
    // ---- after the doubling: a low, uneasy D (cellos), a thin high E creeping in; a single low piano note for the weight
    piano(T.g + 0.42, 'D2', 0.7, 2.4); drum(T.g + 0.42, 'D2', 0.55);
    strings(T.g + 0.35, T.room + 0.7, ['D2', 'A2', 'D3'], 1.6, { att: 0.9, rel: 0.9, cut: 750 });
    strings(T.g + 0.8, T.room + 0.5, ['E5'], 0.35, { att: 1.3, rel: 0.6, cut: 4000, vib: 4 });
    // ---- under line B: Dm9 → Bbmaj7, sparse piano
    strings(T.room, T.reachCut + 0.2, ['D3', 'F3', 'A3', 'E4'], 0.5, { att: 1.0, rel: 0.5, cut: 1300 });
    strings(T.reachCut, T.lift + 0.1, ['Bb2', 'D3', 'F3', 'A3'], 0.5, { att: 0.5, rel: 0.4, cut: 1300 });
    for (const [t, n] of [[T.room + 0.2, 'A4'], [T.room + 1.7, 'F4'], [T.reachCut + 0.1, 'D5'], [T.grip, 'C5'], [T.lift - 0.6, 'A4']]) piano(t, n, 0.36, 1.6, 0.15);
    // ---- the cup (no narration): a low A pulse that tightens while he lifts and holds, slows while he lowers it,
    //      high strings rubbing a semitone, a thin held note before the set-down, then F major and four soft plucks
    { let t = T.grip + 0.1, k = 0;
      while (t < T.lower + 1.6) {
        const v = t < T.lift ? 0.15 + 0.25 * (t - T.grip) / (T.lift - T.grip) : t < T.top ? 0.5 + 0.35 * (t - T.lift) / (T.top - T.lift) : t < T.lower ? 0.85 : 0.85 - 0.5 * (t - T.lower) / 1.6;
        pizz(t, k % 2 ? 'E3' : 'A2', v, k % 2 ? 0.2 : -0.2, 0.3);
        if (t > T.lift && k % 4 === 0) pizz(t, 'A3', v * 0.5, 0.35, 0.4);
        t += t < T.lower ? 0.3 : t < T.lower + 0.9 ? 0.42 : 0.6; k++;
      } }
    strings(T.lift - 0.2, T.down - 0.05, ['A2', 'E3'], 0.9, { att: 1.5, rel: 0.35, cut: 800, keys: [[T.lift + 1.3, 0.6], [T.top, 1.0], [T.lower, 1.0], [T.down - 0.4, 0.55]] });
    strings(T.lift + 0.4, T.lower + 1.0, ['E5', 'F5'], 0.45, { att: 1.8, rel: 0.5, cut: 3500, keys: [[T.lift + 2.2, 0.5], [T.top + 0.8, 1.0], [T.lower + 0.5, 0.7]], vib: 3 });
    strings(T.lower + 0.7, T.down + 0.05, ['A5'], 0.3, { att: 0.6, rel: 0.05, cut: 5000, vib: 2 });
    piano(T.down + 0.03, 'F2', 0.55, 3.5); piano(T.down + 0.05, 'C4', 0.4, 3.5); piano(T.down + 0.06, 'F4', 0.4, 3.5); piano(T.down + 0.08, 'A4', 0.45, 3.5);
    strings(T.down, T.exp + 0.5, ['F3', 'A3', 'C4', 'E4'], 0.75, { att: 0.45, rel: 0.7, cut: 1600 });
    ['C5', 'A4', 'F4', 'C4'].forEach((n, i) => pizz(T.down + 0.22 + i * 0.36, n, 0.5, i % 2 ? 0.3 : -0.3, 0.55));
    // ---- the experiment (line C): a soft tick-tock pulse and a slow chord walk; a bell as each predicted time lights
    for (let t = T.exp + 0.5, k = 0; t < NC.speechEnd - 0.25; t += 0.5, k++) tick(t, k % 2 ? 1310 : 1750, k % 2 ? 0.8 : 1.0, 0.1);
    strings(T.exp + 0.1, T.wideExp + 0.9, ['A2', 'E3', 'G3', 'C4'], 0.75, { att: 0.8, rel: 0.6, cut: 1200 });
    strings(T.wideExp + 0.7, T.lane1[0] + 1.4, ['F2', 'C3', 'E3', 'A3'], 0.75, { att: 0.6, rel: 0.6, cut: 1200 });
    strings(T.lane1[0] + 1.2, T.lane2[0], ['E2', 'C3', 'G3', 'E4'], 0.75, { att: 0.6, rel: 0.5, cut: 1200 });
    strings(T.lane2[0] - 0.1, NC.speechEnd + 0.3, ['D2', 'A2', 'F3', 'C4'], 0.75, { att: 0.6, rel: 0.5, cut: 1200 });
    piano(NC.start + 0.15, 'E4', 0.4, 1.5, 0.1); piano(T.oneM[0], 'C5', 0.4, 1.5, 0.1);
    bell(T.lane1[0] + 0.05, 'C6', 0.55, -0.35); bell(T.lane2[0] + 0.05, 'E6', 0.55, 0.35);
    // ---- the hold before the drop: the pulse stops, a thin high note and a low swell opening up, cut just before the clamps
    strings(NC.speechEnd - 0.2, T.drop - 0.04, ['A5', 'E6'], 0.35, { att: 0.5, rel: 0.04, cut: 6000, vib: 2 });
    strings(NC.speechEnd, T.drop - 0.04, ['D2', 'A2', 'D3'], 1.0, { att: 1.1, rel: 0.04, cut: 400, cutTo: 1600 });
    // ---- the result (after both impacts): a small bell chord and an F add9 swell; the replay sits on a low Bb with a
    //      reverse swell sucked into the slowed 2 g hit; then Bb → Csus4 into the cut outside
    const tRes = T.drop + 0.75;
    ['F5', 'A5', 'C6'].forEach((n, i) => bell(tRes + i * 0.035, n, 0.6, [-0.3, 0, 0.3][i]));
    piano(tRes, 'F2', 0.5, 1.5); piano(tRes + 0.02, 'C4', 0.35, 1.5);
    strings(tRes - 0.05, T.replay + 0.3, ['F3', 'C4', 'G4', 'A4'], 0.6, { att: 0.3, rel: 0.5, cut: 2200 });
    const sl = (te) => T.replay + (te - T.replayFrom) / T.replayRate, land2 = Math.min(...this.app.drop.lanes.map((o) => o.landT));
    strings(T.replay - 0.1, T.replayEnd + 0.3, ['Bb1', 'F2', 'Bb2', 'F3'], 1.3, { att: 1.0, rel: 0.5, cut: 700 });
    strings(T.replay + 0.4, T.replayEnd + 0.2, ['D6'], 0.2, { att: 1.0, rel: 0.4, cut: 6000, vib: 2 });
    strings(sl(land2) - 1.1, sl(land2) + 0.02, ['Bb3', 'C4', 'D4', 'F4'], 0.9, { att: 1.05, rel: 0.02, cut: 700, cutTo: 2600 });
    piano(T.replayEnd + 0.05, 'Bb2', 0.5, 2.0); piano(T.replayEnd + 0.07, 'D4', 0.4, 2.0); piano(T.replayEnd + 0.09, 'F4', 0.35, 2.0); piano(T.replayEnd + 0.4, 'C5', 0.4, 1.6, 0.2);
    strings(T.replayEnd, T.out - 0.7, ['Bb2', 'F3', 'D4'], 0.65, { att: 0.5, rel: 0.4, cut: 1500 });
    strings(T.out - 0.85, T.out + 0.35, ['C3', 'F3', 'G3', 'C4'], 0.65, { att: 0.4, rel: 0.3, cut: 1500 });
    // ---- outside (line D): Dm → Bb → Gm7, the piano figure slower and lower
    strings(T.out - 0.05, T.carCU + 0.2, ['D3', 'F3', 'A3'], 0.48, { att: 0.6, rel: 0.5, cut: 1300 });
    strings(T.carCU, ND.speechEnd - 1.2, ['Bb2', 'F3', 'D4'], 0.48, { att: 0.6, rel: 0.4, cut: 1300 });
    strings(ND.speechEnd - 1.4, T.world - 0.05, ['G2', 'D3', 'F3', 'Bb3'], 0.5, { att: 0.5, rel: 0.3, cut: 1300 });
    ['D4', 'A4', 'F4', 'E4', 'D4', 'C4', 'A3', 'Bb3'].forEach((n, i) => piano(T.out + 0.55 + i * 0.85, n, 0.38, 1.6, i % 2 ? 0.25 : -0.25));
    // ---- he stands (no narration — the score takes the room): the chords climb with each stage of the effort, a felt drum
    //      on every push, the pizzicato labouring under it; C major lands with his step; F opens out on the wide
    const R2 = T.rise2, ST = T.step, land = ST[0] + 0.85;
    const walk = [[T.world - 0.1, R2[0] + 0.75, ['Bb2', 'D3', 'F3', 'Bb3'], 0.75], [R2[0] + 0.7, R2[0] + 1.65, ['A2', 'C3', 'F3', 'A3', 'C4'], 0.8],
      [R2[0] + 1.6, ST[0] - 0.25, ['G2', 'D3', 'F3', 'Bb3'], 0.85], [ST[0] - 0.3, land + 0.05, ['C3', 'F3', 'G3', 'C4'], 0.85],
      [land, T.wide2 + 0.1, ['C3', 'E3', 'G3', 'C4', 'E4'], 0.85], [T.wide2, T.wide2 + 1.75, ['F2', 'C3', 'F3', 'A3', 'C4', 'F4'], 1.0],
      [T.wide2 + 1.7, T.pull + 0.1, ['D3', 'F3', 'A3', 'D4'], 0.9], [T.pull, NE.start + 0.9, ['Bb2', 'F3', 'D4'], 0.65]];
    for (const [a, b, notes, v] of walk) strings(a, b, notes, v, { att: Math.min(0.6, (b - a) * 0.4), rel: 0.25, cut: 1500 + 300 * v });
    strings(R2[0], T.wide2 + 1.8, ['F5', 'C6'], 0.25, { att: 2.0, rel: 0.6, cut: 5000, keys: [[land, 0.6], [T.wide2 + 0.2, 1.0]], vib: 4 });
    for (const [t, n, v] of [[R2[0], 'F2', 0.7], [R2[0] + 0.7, 'F2', 0.6], [R2[0] + 1.6, 'G2', 0.65], [land, 'C2', 0.7], [T.wide2 + 0.05, 'F2', 0.6]]) drum(t, n, v);
    { const roots = (t) => t < R2[0] + 0.7 ? 'Bb2' : t < R2[0] + 1.6 ? 'A2' : t < ST[0] - 0.3 ? 'G2' : 'C3';
      for (let t = T.world + 0.1, k = 0; t < ST[0] - 0.3; t += 0.38, k++) pizz(t, roots(t), 0.45 + 0.35 * (t - T.world) / (ST[0] - T.world), k % 2 ? 0.25 : -0.25, 0.3);
      for (let t = land + 0.05, k = 0; t < T.pull - 0.2; t += 0.4, k++) pizz(t, t < T.wide2 ? (k % 2 ? 'G2' : 'C2') : t < T.wide2 + 1.7 ? (k % 2 ? 'C3' : 'F2') : (k % 2 ? 'A2' : 'D2'), 0.5, k % 2 ? 0.25 : -0.25, 0.4); }
    [[T.world + 0.1, 'F4'], [R2[0] + 0.4, 'A4'], [R2[0] + 1.25, 'G4'], [R2[0] + 2.1, 'Bb4'], [ST[0] + 0.1, 'C5'], [land, 'E5'], [T.wide2 + 0.05, 'F5'], [T.wide2 + 0.85, 'C5'], [T.wide2 + 1.7, 'A4'], [T.pull - 0.4, 'D5']]
      .forEach(([t, n], i) => piano(t, n, 0.55, 1.8, i % 2 ? 0.25 : -0.25));
    // ---- the ending (line E): Dm → Bb → C → F; the last chord opens into Fmaj9 and decays to the final frame
    strings(NE.start + 0.7, gnW('e-ending', 7).start + 0.1, ['Bb2', 'F3', 'D4'], 0.55, { att: 0.6, rel: 0.4, cut: 1400 });
    strings(gnW('e-ending', 7).start, gnW('e-ending', 14).start, ['C3', 'G3', 'E4'], 0.55, { att: 0.5, rel: 0.3, cut: 1400 });
    strings(gnW('e-ending', 14).start - 0.1, T.end + 0.05, ['F2', 'C3', 'A3', 'E4', 'G4'], 0.85, { att: 0.8, rel: 2.2, cut: 1500, keys: [[NE.speechEnd + 0.3, 1.0], [T.end - 2.3, 0.9]] });
    [[NE.start + 0.1, 'A4'], [gnW('e-ending', 7).start, 'F4'], [gnW('e-ending', 14).start, 'G4']].forEach(([t, n]) => piano(t, n, 0.4, 1.6, 0.15));
    piano(NE.speechEnd + 0.15, 'F2', 0.55, 2.4); piano(NE.speechEnd + 0.17, 'C4', 0.45, 2.4); piano(NE.speechEnd + 0.2, 'A4', 0.5, 2.4);
    piano(NE.speechEnd + 1.0, 'C5', 0.45, 1.6, 0.2); bell(T.end - 1.4, 'F6', 0.35, 0);
  }

  // ===================================================================================================== AMBIENCE
  _amb(ctx, dest, END) {
    const fx = new GbFx(ctx, CONFIG.seed + 201), r = fx.r, sr = fx.sr, T = GB;
    const inside = ctx.createGain(), outside = ctx.createGain(); inside.connect(dest); outside.connect(dest);
    // the café is the café (room tone, machine, the square through the glass); the experiment shots lower it a little
    inside.gain.setValueAtTime(1, 0); inside.gain.setValueAtTime(1, T.exp - 0.3); inside.gain.linearRampToValueAtTime(0.7, T.exp + 0.3);
    inside.gain.setValueAtTime(0.7, T.out - 0.04); inside.gain.linearRampToValueAtTime(0, T.out);
    outside.gain.setValueAtTime(0, 0); outside.gain.setValueAtTime(0, T.out - 0.04); outside.gain.linearRampToValueAtTime(1, T.out);
    // ---- the café bed (stereo)
    const ci = T.out + 0.3, L = fx.arr(ci), R = fx.arr(ci), n = L.length;
    { // room tone: a low, soft air (no sub rumble) + a little high air
      for (const [X, seedOff] of [[L, 0], [R, 1]]) {
        const w = fx.white(n), h = fx.white(n); GBX.bq(w, 'lp', 380, 0.6, sr); GBX.bq(w, 'hp', 70, 0.7, sr); GBX.bq(h, 'bp', 1900, 0.4, sr);
        for (let i = 0; i < n; i++) X[i] += w[i] * 0.16 + h[i] * 0.012;
      } }
    { // the espresso machine: a faint boiler hiss and a gurgle now and then (panned right, behind the counter)
      const h = fx.white(n); GBX.bq(h, 'bp', 3900, 3, sr);
      GBX.mixIn(L, R, h, 0, 0.012, 0.6);
      for (const t0 of [1.4, 9.6, 23.2, 33.4]) for (let t = t0; t < t0 + 0.5; t += r.range(0.015, 0.05)) fx.bubble(L, R, Math.round(t * sr), r.range(160, 520), r.range(0.01, 0.03), 0.05, 0.6);
    }
    { // the square through the glass: a distant murmur of people, the fountain, the odd bird (all muffled)
      const m = new Float32Array(n);
      for (let v = 0; v < 4; v++) {
        const f0 = r.range(105, 220), wv = fx.wander(0.7); let ph = 0, syl = 0, a = 0, tgt = 0;
        for (let i = 0; i < n; i++) {
          if (i >= syl) { syl = i + Math.round(r.range(0.09, 0.28) * sr); tgt = r.chance(0.7) ? r.range(0.4, 1) : 0; }
          a += (tgt - a) * 0.0015; ph += f0 * (1 + 0.12 * wv(i / sr)) / sr; if (ph >= 1) { ph -= 1; m[i] += a; }
        }
      }
      const m2 = Float32Array.from(m); GBX.bq(m, 'bp', 520, 1.2, sr); GBX.bq(m2, 'bp', 1350, 1.6, sr);
      for (let i = 0; i < n; i++) m[i] += m2[i] * 0.5;
      GBX.bq(m, 'lp', 850, 0.7, sr);
      GBX.mixIn(L, R, m, 0, 0.05, -0.35);
      const fo = fx.white(n); GBX.bq(fo, 'bp', 1500, 0.8, sr); GBX.bq(fo, 'lp', 2400, 0.7, sr);
      GBX.mixIn(L, R, fo, 0, 0.012, -0.5);
      for (let t = 0.8; t < T.exp; t += r.range(1.6, 3.4)) { const c = this._chirpArr(fx, r.range(2600, 3600), r.int(1, 3)); GBX.bq(c, 'lp', 2200, 0.7, sr); GBX.mixIn(L, R, c, Math.round(t * sr), 0.025, r.range(-0.8, -0.2)); }
    }
    { // the waiter's cups at the counter: light clinks before the doubling, a heavy one after
      for (const [t, v] of [[0.35, 0.05], [1.25, 0.04], [2.05, 0.05]]) GBX.mixIn(L, R, fx.hit(fx.cupModes().concat(fx.saucerModes()), { width: 0.0003, amp: 1 }), Math.round(t * sr), v, 0.55);
      for (const [t, v] of [[T.g + 0.95, 0.08], [T.room + 1.3, 0.06]]) {
        const y = fx.hit(fx.cupModes().concat(fx.saucerModes()), { width: 0.0006, amp: 1 });
        GBX.strike(y, 0, Math.round(0.002 * sr), 0.6, fx.woodModes(170), sr);
        GBX.mixIn(L, R, y, Math.round(t * sr), v, 0.55);
      }
    }
    fx.play(L, 0, inside, { xr: R, vol: 1.8 });
    // ---- the plaza (stereo): gusting wind, the fountain (lower and heavier at 2 g), birds, pigeons, a distant murmur
    const t0 = T.out - 0.05, D = END - t0, oL = fx.arr(D), oR = fx.arr(D), m = oL.length;
    { const gust = fx.wander(0.11), gust2 = fx.wander(0.23);
      for (const [X, ph] of [[oL, 0], [oR, 0.7]]) {
        const w = fx.white(m); let lp = 0, lp2 = 0;
        for (let i = 0; i < m; i++) {
          const t = i / sr + ph, g = Math.max(0, 0.55 + 0.45 * gust(t) + 0.2 * gust2(t)), fc = 260 + 700 * g, k = 1 - Math.exp(-2 * Math.PI * fc / sr);
          lp += (w[i] - lp) * k; lp2 += (lp - lp2) * k;
          X[i] += lp2 * (0.25 + 0.75 * g) * 0.55;
        }
        GBX.bq(X, 'hp', 110, 0.7, sr);
      } }
    { // the fountain: a spray bed + many bubbles + the heavier splash of the falling water
      const bed = fx.white(m), sp = fx.white(m); GBX.bq(bed, 'hp', 700, 0.7, sr); GBX.bq(bed, 'lp', 6500, 0.7, sr); GBX.bq(sp, 'bp', 420, 0.9, sr);
      const wv = fx.wander(0.5);
      for (let i = 0; i < m; i++) { const a = 1 + 0.15 * wv(i / sr); oL[i] += (bed[i] * 0.03 + sp[i] * 0.05) * a; oR[i] += (bed[(i + 5003) % m] * 0.03 + sp[(i + 7919) % m] * 0.05) * a; }
      for (let t = 0; t < D; t += r.range(0.002, 0.012)) fx.bubble(oL, oR, Math.round(t * sr), Math.exp(r.range(Math.log(350), Math.log(2600))), r.range(0.004, 0.02), r.range(0.006, 0.035), r.range(-0.2, 0.7));
    }
    { // a distant murmur of the square (very low, unintelligible)
      const mm = new Float32Array(m);
      for (let v = 0; v < 3; v++) {
        const f0 = r.range(110, 230), wv = fx.wander(0.6); let ph = 0, syl = 0, a = 0, tgt = 0;
        for (let i = 0; i < m; i++) {
          if (i >= syl) { syl = i + Math.round(r.range(0.1, 0.3) * sr); tgt = r.chance(0.6) ? r.range(0.3, 1) : 0; }
          a += (tgt - a) * 0.0015; ph += f0 * (1 + 0.12 * wv(i / sr)) / sr; if (ph >= 1) { ph -= 1; mm[i] += a; }
        }
      }
      GBX.bq(mm, 'bp', 600, 1.0, sr); GBX.bq(mm, 'lp', 1300, 0.7, sr);
      GBX.mixIn(oL, oR, mm, 0, 0.03, 0.3);
    }
    { // sparrows in the trees (short twitter runs), pigeon coos, the two low-flying pigeons' wings
      for (let t = 0.6; t < D - 0.5; t += r.range(1.4, 3.2)) GBX.mixIn(oL, oR, this._chirpArr(fx, r.range(3200, 4800), r.int(2, 6)), Math.round(t * sr), r.range(0.03, 0.06), r.range(-0.8, 0.8));
      for (const t of [T.out + 1.5, T.out + 5.8, T.world + 2.4, T.wide2 + 2.0, T.pull + 3.0, T.end - 1.9]) {
        const y = fx.arr(1.1), f0 = r.range(330, 390); let ph = 0;
        for (let i = 0; i < y.length; i++) {
          const u = i / y.length, lobes = Math.max(0, Math.sin(Math.PI * Math.min(1, u * 3.2))) * (u < 0.32 ? 0.7 : 0) + Math.max(0, Math.sin(Math.PI * (u - 0.35) / 0.55)) * (u > 0.35 && u < 0.9 ? 1 : 0);
          const f = f0 * (u < 0.32 ? 1.0 : 1.12 - 0.2 * (u - 0.35)) * (1 + 0.012 * Math.sin(2 * Math.PI * 26 * i / sr));
          ph += 2 * Math.PI * f / sr; y[i] = (Math.sin(ph) + 0.35 * Math.sin(2 * ph) + 0.1 * Math.sin(3 * ph)) * lobes;
        }
        GBX.bq(y, 'lp', 1200, 0.7, sr);
        GBX.mixIn(oL, oR, y, Math.round((t - t0) * sr), 0.06, r.range(-0.4, 0.3));
      }
      for (let i = 0; i < 2; i++) for (let k = -1; k < 4; k++) {   // each pass: u = 0…9 s across the square (cast.js), loudest mid-way
        const ts = T.out - i * 4.5 + k * 9; if (ts + 9 < t0 || ts > END) continue;
        const y = fx.arr(9);
        for (let t = 0; t < 9; t += 1 / 5.4) {
          const a = Math.pow(Math.sin(Math.PI * t / 9), 2), fl = fx.rustle(0.05, { density: 600, rub: 0.6, lo: 600, hi: 2400, grain: 0.004, env: (u) => Math.sin(Math.PI * u) });
          for (let j = 0; j < fl.length; j++) { const q = Math.round(t * sr) + j; if (q < y.length) y[q] += fl[j] * a; }
        }
        const i0 = Math.round((ts - t0) * sr);
        const Lh = y.subarray(0, 4.5 * sr | 0), Rh = y.subarray(4.5 * sr | 0);
        GBX.mixIn(oL, oR, Lh, i0, 0.05, -0.5); GBX.mixIn(oL, oR, Rh, i0 + (4.5 * sr | 0), 0.05, 0.5);
      }
    }
    fx.play(oL, t0, outside, { xr: oR, vol: 0.7 });
  }
  // a short run of sparrow chirps (n notes)
  _chirpArr(fx, f, n) {
    const sr = fx.sr, r = fx.r, y = fx.arr(n * 0.11 + 0.1);
    let t = 0;
    for (let k = 0; k < n; k++) {
      const d = r.range(0.03, 0.07), f0 = f * r.range(0.9, 1.15), i0 = Math.round(t * sr); let ph = 0;
      for (let i = 0; i < d * sr && i0 + i < y.length; i++) { const u = i / (d * sr); ph += 2 * Math.PI * f0 * (1.25 - 0.45 * u) / sr; y[i0 + i] += Math.sin(ph) * Math.sin(Math.PI * u); }
      t += d + r.range(0.025, 0.06);
    }
    return y;
  }

  // ===================================================================================================== FOLEY
  // every event is peak-normalised, so each `vol` below is that sound's peak level inside the stem (1 = the loudest)
  _foley(ctx, dest) {
    const fx = new GbFx(ctx, CONFIG.seed + 301), T = GB;
    const bus = this._withRooms(ctx, fx, dest, 0.2, 0.08);
    const P = (x, t, vol, pan = 0) => fx.play(x, t, bus, { vol, pan, norm: true });
    const rustle = (t, dur, vol, pan = 0, o = {}) => P(fx.rustle(dur, o), t, vol, pan);
    const breath = (t, dur, vol, o = {}, pan = 0) => P(fx.breath(dur, o), t, vol, pan);
    // ---- the café: the doubling hits him (a jolt of clothes, a sharp intake, a worried breath out)
    rustle(T.g + 0.01, 0.45, 0.3, 0, { env: (u) => Math.exp(-u * 5) * Math.min(1, u * 30), density: 500 });
    breath(T.g + 0.06, 0.32, 0.3, { inhale: true });
    breath(T.g + 0.8, 0.75, 0.3, {});
    rustle(T.g + 0.06, 0.5, 0.08, 0.55, { density: 300 });                                    // the waiter sags onto the counter
    // the reach: left palm to the table, the right hand out to the cup
    rustle(T.reach[0] - 0.35, 0.6, 0.18, -0.2);
    P(fx.slap(fx.woodModes(200, 0.8), { amp: 0.7, width: 0.004, skin: 0.5 }), T.reach[0] + 0.2, 0.22, -0.25);
    rustle(T.reach[0] - 0.05, 1.0, 0.14, 0.1);
    // the lift: a quick breath in, held; the pull (a strained grunt through closed lips); strained breaths while it hangs
    breath(T.lift - 0.42, 0.3, 0.24, { inhale: true });
    rustle(T.lift - 0.3, 0.32, 0.14, 0);
    breath(T.lift + 0.3, 1.0, 0.55, { voice: 0.32, f0: 112, nasal: true, env: (u) => Math.min(1, u / 0.15) * (1 - Math.pow(u, 3)) });
    rustle(T.lift + 0.12, 0.75, 0.2, 0);
    for (let t = T.lift + 1.2, k = 0; t < T.lower - 0.25; t += 0.78, k++) breath(t, k % 2 ? 0.42 : 0.5, k % 2 ? 0.26 : 0.36, k % 2 ? { inhale: true } : { voice: 0.12, f0: 118 });
    rustle(T.top - 0.3, 0.5, 0.14, 0);
    // lowering: he lets the breath out slowly through his teeth while he follows the cup down
    breath(T.lower + 0.1, T.down - T.lower - 0.15, 0.2, { teeth: true, env: (u) => Math.min(1, u / 0.2) * (0.7 + 0.3 * Math.sin(u * 9)) * (1 - Math.pow(u, 4)) });
    rustle(T.lower, 0.95, 0.14, 0, { density: 150 });
    // down: he sags, then the long relieved breath out
    rustle(T.down + 0.12, 0.45, 0.16, 0);
    breath(T.letGo + 0.04, 1.15, 0.55, { voice: 0.08, f0: 105, env: (u) => Math.min(1, u / 0.06) * Math.pow(1 - u, 1.6) });
    rustle(T.letGo + 0.25, 0.8, 0.18, 0);
    // ---- outside: the man on the bench (already out of breath). Attempt 1 is under the narrator: kept smaller
    const R1 = T.rise1, R2 = T.rise2, ST = T.step, land = ST[0] + 0.85;
    for (let t = T.out + 0.1, k = 0; t < R1[0] - 0.6; t += 0.62, k++) breath(t, 0.5, k % 2 ? 0.12 : 0.16, k % 2 ? { inhale: true } : {});
    rustle(R1[0] - 0.6, 0.6, 0.16, 0);
    breath(R1[0] - 0.5, 0.42, 0.2, { inhale: true });
    breath(R1[0] + 0.02, 1.25, 0.28, { voice: 0.25, f0: 104, env: (u) => Math.min(1, u / 0.1) * (1 - Math.pow(u, 2.5)) });   // the push: a strained breath
    P(fx.step({ weight: 0.25, scuff: 0.6 }), R1[0] + 0.05, 0.2, -0.1); P(fx.step({ weight: 0.2, scuff: 0.5 }), R1[0] + 0.12, 0.16, 0.1);
    rustle(R1[0] + 0.05, 0.8, 0.16, 0);
    // he drops back onto the bench: the body lands, a defeated breath out, then heavy breathing
    P(fx.slap(fx.woodModes(150, 1.2), { amp: 1, width: 0.012, skin: 0.1, len: 0.6 }), R1[0] + 1.58, 0.3, 0);
    rustle(R1[0] + 1.5, 0.5, 0.18, 0, { env: (u) => Math.exp(-u * 4) * Math.min(1, u * 20) });
    breath(R1[0] + 1.66, 0.85, 0.22, { voice: 0.12, f0: 100 });
    for (let t = R1[0] + 2.7, k = 0; t < R2[0] - 0.8; t += 0.66, k++) breath(t, 0.52, k % 2 ? 0.12 : 0.16, k % 2 ? { inhale: true } : {});
    // the second attempt (no narration): he leans, reaches for the car's wing, palm on the metal (its ring is in sfx), pushes up
    rustle(R2[0] - 0.7, 0.6, 0.22, 0); rustle(R2[0] - 0.55, 0.5, 0.18, 0.15);
    breath(R2[0] - 0.45, 0.35, 0.38, { inhale: true });
    P(fx.slap([[900, 0.01, 0.3]], { amp: 0.4, width: 0.002, skin: 0.9, len: 0.1 }), R2[0] - 0.05, 0.32, 0.2);
    breath(R2[0] + 0.02, 1.5, 0.45, { voice: 0.45, f0: 100, env: (u) => Math.min(1, u / 0.08) * (0.85 + 0.15 * Math.sin(u * 20)) * (1 - Math.pow(u, 3)) });
    P(fx.step({ weight: 0.3, scuff: 0.7 }), R2[0] + 0.1, 0.32, -0.1); P(fx.step({ weight: 0.22, scuff: 0.5 }), R2[0] + 0.22, 0.26, 0.1);
    rustle(R2[0] + 0.3, 1.3, 0.24, 0, { density: 300 });
    breath(R2[0] + 1.6, 0.8, 0.4, { voice: 0.15, f0: 108 }); breath(R2[0] + 2.45, 0.45, 0.28, { inhale: true });
    // he lets go of the car and steps: the foot lifts (a scuff), lands heavy (his doubled weight), the weight rolls over
    P(fx.slap([[700, 0.01, 0.2]], { amp: 0.2, width: 0.003, skin: 0.5, len: 0.08 }), ST[0] - 0.3, 0.14, 0.2);
    rustle(ST[0] - 0.3, 0.6, 0.16, 0.1);
    P(fx.rustle(0.25, { density: 400, rub: 0.5, lo: 900, hi: 4000, grain: 0.006 }), ST[0] + 0.05, 0.22, 0.05);
    breath(ST[0] + 0.1, 0.7, 0.3, { voice: 0.25, f0: 104 });
    P(fx.step({ weight: 1.0, scuff: 0.3, body: 92, decay: 0.075 }), land, 1.0, 0.05);
    rustle(land, 0.8, 0.24, 0, { env: (u) => Math.exp(-u * 3) * Math.min(1, u * 25) });
    P(fx.rustle(0.5, { density: 600, rub: 0.15, lo: 2200, hi: 8000, grain: 0.003, env: (u) => Math.exp(-u * 3) }), land + 0.15, 0.16, 0.05);
    breath(ST[1] + 0.1, 1.1, 0.45, { voice: 0.1, f0: 100, env: (u) => Math.min(1, u / 0.06) * Math.pow(1 - u, 1.5) });
    // the passer-by with the shopping bag: each dip — the bag swings and crackles, a scuff, a gasp; she catches herself
    [T.world + 1.2, T.wide2 + 0.9, T.pull + 1.4].forEach((d, i) => {
      const k = i === 2 ? 0.35 : 0.6;                                                     // she is in the background; the third dip is under the last line
      P(fx.rustle(0.6, { density: 1400, rub: 0.15, lo: 2000, hi: 9000, grain: 0.0025, peak: 4200 }), d, 0.16 * k, -0.3);
      P(fx.step({ weight: 0.2, scuff: 0.8 }), d + 0.08, 0.16 * k, -0.3);
      breath(d + 0.03, 0.32, 0.26 * k, { inhale: true }, -0.3);
      P(fx.step({ weight: 0.35, scuff: 0.3 }), d + 0.68, 0.16 * k, -0.3);
      P(fx.rustle(0.45, { density: 1200, rub: 0.15, lo: 2000, hi: 9000, grain: 0.0025, peak: 4200 }), d + 0.66, 0.12 * k, -0.3);
      breath(d + 0.75, 0.6, 0.2 * k, { voice: 0.2, f0: 205 }, -0.3);
    });
    // the jogger on the ground in the background, still catching her breath (slowing down)
    for (let t = T.out + 0.2, k = 0; t < T.end; k++) { const p = 0.85 + 0.25 * (t - T.out) / (T.end - T.out); breath(t, p * 0.45, (k % 2 ? 0.05 : 0.065) * (1 - 0.4 * (t - T.out) / (T.end - T.out)), k % 2 ? { inhale: true } : {}, -0.55); t += p * 0.5; }
  }

  // a stem's room sound: the café room (short, early reflections) until the cut outside, then a sparse plaza reflection
  _withRooms(ctx, fx, dest, inAmt, outAmt) {
    const T = GB, bus = ctx.createGain(); bus.connect(dest);
    const room = fx.ir(0.9, { bright: 0.7, damp: 4, shape: 2.6, early: [[0.011, 0.5], [0.017, 0.35], [0.023, 0.3], [0.031, 0.2]], seed: 31 });
    const plaza = fx.ir(1.3, { bright: 0.45, damp: 4, shape: 3.2, pre: 0.025, early: [[0.06, 0.25], [0.11, 0.15]], seed: 37 });
    const gi = ctx.createGain(), go = ctx.createGain();
    gi.gain.setValueAtTime(inAmt, 0); gi.gain.setValueAtTime(inAmt, T.out - 0.05); gi.gain.linearRampToValueAtTime(0, T.out);
    go.gain.setValueAtTime(0, 0); go.gain.setValueAtTime(0, T.out - 0.05); go.gain.linearRampToValueAtTime(outAmt, T.out);
    bus.connect(room); room.connect(gi); gi.connect(dest);
    bus.connect(plaza); plaza.connect(go); go.connect(dest);
    return bus;
  }

  // ===================================================================================================== SFX
  // every event is peak-normalised (`vol` = its peak in the stem); the two smashes share one scale so the 2 g cup stays
  // louder by its real impact speed (√2 → +3 dB)
  _sfx(ctx, dest) {
    const fx = new GbFx(ctx, CONFIG.seed + 401), r = fx.r, sr = fx.sr, T = GB;
    const bus = this._withRooms(ctx, fx, dest, 0.22, 0.1);
    const P = (x, t, vol, pan = 0, o = {}) => fx.play(x, t, bus, Object.assign({ vol, pan, norm: true }, o));
    const chairModes = () => [[r.range(290, 340), 0.012, 1], [r.range(600, 680), 0.009, 0.8], [r.range(1100, 1250), 0.006, 0.5], [r.range(2000, 2300), 0.004, 0.3]];
    // ---- THE DOUBLING: no boom. The whole room drops onto its supports at once: a soft body thump, every cup and saucer
    //      in the room clatters, spoons jingle, the lamp shades knock on their cords, chairs and the floor creak, the
    //      window panes buzz in their frames, the plant's leaves shiver
    { const y = fx.arr(0.6);
      for (let i = 0; i < y.length; i++) { const t = i / sr; y[i] = Math.sin(2 * Math.PI * (48 * t + 47 * 0.08 * (1 - Math.exp(-t / 0.08)))) * Math.exp(-t / 0.13) * Math.min(1, t / 0.006); }   // 95 → 48 Hz
      GBX.bq(y, 'hp', 40, 0.7, sr);
      P(y, T.g, 0.32, 0); }
    P(fx.creak(1.1, [[140, 0.02, 1], [330, 0.014, 0.7], [610, 0.01, 0.4]], { rate: [12, 32], env: (u) => Math.exp(-u * 2.5) * Math.min(1, u * 12) }), T.g + 0.03, 0.22, 0);
    for (let k = 0; k < 16; k++) {
      const t = T.g + r.range(0.004, 0.09), pan = r.range(-0.85, 0.85), v = r.range(0.05, 0.11), cm = fx.cupModes(r.range(0.92, 1.1)).concat(fx.saucerModes(r.range(0.92, 1.1)));
      P(fx.hit(cm, { width: 0.0003, amp: 1, extra: [[r.range(0.03, 0.07), 0.0003, 0.35], [r.range(0.09, 0.14), 0.0003, 0.12]] }), t, v, pan);
    }
    P(fx.hit(fx.cupModes().concat(fx.saucerModes()), { width: 0.00035, amp: 1, extra: [[0.045, 0.0003, 0.4], [0.1, 0.0003, 0.15], [0.14, 0.0003, 0.06]] }), T.g + 0.01, 0.28, -0.1);   // his own cup
    for (let k = 0; k < 6; k++) P(fx.hit(fx.metalModes(r.range(2800, 4200), 0.25), { width: 0.0002, extra: [[r.range(0.02, 0.05), 0.0002, 0.4]] }), T.g + r.range(0.01, 0.06), 0.07, r.range(-0.7, 0.7));
    for (const [d, pan] of [[0.03, -0.45], [0.05, 0.1], [0.07, 0.5]]) {
      P(fx.hit(fx.metalModes(r.range(780, 1050), 0.6), { width: 0.0008, amp: 1 }), T.g + d, 0.12, pan);
      for (let k = 0; k < 5; k++) P(fx.hit([[r.range(3000, 6000), 0.02, 1], [r.range(6500, 9000), 0.012, 0.5]], { width: 0.0001 }), T.g + d + r.range(0.0, 0.25), 0.04, pan);
    }
    { const y = fx.hit(fx.glassModes(), { width: 0.002, amp: 1 });   // the panes buzz against their frames
      for (let k = 1; k < 9; k++) GBX.strike(y, Math.round(k * 0.022 * sr), Math.round(0.0004 * sr), 0.5 * Math.exp(-k * 0.35), [[2400, 0.006, 1], [3700, 0.004, 0.6]], sr);
      P(y, T.g + 0.02, 0.14, -0.6); }
    for (let k = 0; k < 4; k++) P(fx.creak(r.range(0.15, 0.35), chairModes(), { rate: [30, 90] }), T.g + r.range(0.02, 0.3), r.range(0.1, 0.16), r.range(-0.8, 0.8));
    P(fx.creak(0.55, chairModes(), { rate: [25, 60], env: (u) => Math.exp(-u * 3) * Math.min(1, u * 15) }), T.g + 0.04, 0.26, 0);                // his chair
    P(fx.creak(0.5, [[180, 0.015, 1], [410, 0.01, 0.7], [800, 0.007, 0.4]], { rate: [20, 50] }), T.g + 0.08, 0.14, 0.55);                       // the counter under the waiter
    P(fx.rustle(0.9, { density: 600, rub: 0.2, lo: 1500, hi: 7000, grain: 0.004, env: (u) => Math.exp(-u * 3) * Math.min(1, u * 20) }), T.g + 0.05, 0.1, -0.7);   // the plant
    for (let k = 0; k < 5; k++) P(fx.hit(fx.cupModes(r.range(0.95, 1.05)), { width: 0.0002, amp: 1 }), T.g + r.range(0.3, 0.8), r.range(0.05, 0.09), r.range(-0.7, 0.7));   // late settles
    for (const [d, pan] of [[0.95, 0.4], [1.6, -0.5], [2.2, 0.2]]) P(fx.creak(r.range(0.35, 0.6), [[r.range(130, 160), 0.02, 1], [r.range(300, 360), 0.014, 0.7], [r.range(560, 660), 0.01, 0.4]], { rate: [10, 26] }), T.g + d, 0.12, pan);   // the building settles
    // ---- THE CUP
    const cupset = fx.cupModes(), saucer = fx.saucerModes(), both = cupset.concat(saucer), cupPan = -0.1;
    P(fx.hit(cupset, { width: 0.00035, amp: 0.5, noise: 0.08, nhp: 3000 }), T.grip, 0.2, cupPan);                                  // fingertips on the handle
    for (let k = 0; k < 5; k++) P(fx.hit(both, { width: 0.00025, amp: 1 }), T.lift + 0.02 + k * (2 * Math.PI / 90), 0.12 + 0.05 * k, cupPan);   // the stick: it rattles at 14 Hz
    P(fx.creak(0.16, cupset.map(([f, tau, a]) => [f, tau * 0.25, a]), { rate: [700, 1150], env: (u) => Math.sin(Math.PI * u) }), T.lift + 0.33, 0.16, cupPan);   // porcelain squeak as it breaks free
    { const y = fx.hit(saucer, { width: 0.0005, amp: 1 }); GBX.strike(y, 0, Math.round(0.002 * sr), 0.5, fx.woodModes(210), sr); P(y, T.lift + 0.37, 0.3, cupPan); }   // the saucer clacks back down
    P(fx.liquid(T.down - T.lift + 1.2, (t) => { const tt = t + T.lift + 0.35, h = tt < T.down ? 0.45 * Math.abs(Math.sin(tt * 9)) * Math.min(1, (tt - T.lift - 0.35) * 2) : 0; return Math.min(1, h + (tt > T.down ? 0.9 * Math.exp(-(tt - T.down) * 3) * Math.abs(Math.sin((tt - T.down) * 15)) : 0)); }), T.lift + 0.35, 0.1, cupPan);
    P(fx.creak(0.8, chairModes(), { rate: [20, 55] }), T.lift + 0.15, 0.22, 0.05);                    // the chair under his braced weight
    P(fx.creak(1.1, chairModes(), { rate: [15, 40] }), T.top - 0.1, 0.17, 0.05);
    P(fx.creak(1.2, chairModes(), { rate: [12, 35] }), T.lower + 0.3, 0.15, 0.05);
    { // ★ the set-down: porcelain on porcelain, a solid wooden "tock" through the table, three little settle bounces
      const y = fx.hit(both, { width: 0.00045, amp: 1, noise: 0.15, nhp: 2500, extra: [[0.0785, 0.0003, 0.42], [0.157, 0.0003, 0.16], [0.236, 0.0003, 0.06]] });
      GBX.strike(y, 0, Math.round(0.0025 * sr), 0.8, fx.woodModes(185), sr);
      P(y, T.down, 0.6, cupPan); }
    P(fx.hit(cupset, { width: 0.0003, amp: 0.25 }), T.letGo, 0.1, cupPan);                           // the fingers come off the handle
    P(fx.creak(0.7, chairModes(), { rate: [20, 50] }), T.letGo + 0.2, 0.24, 0.05);                    // he sags back
    // ---- THE DROP (both lanes at the measured times; the 2 g cup lands √2 faster, so it is louder and its shards
    //      bounce sooner); the slow-motion replay re-synthesises the same events 5× slower and lower; then real time again
    const lanes = this.app.drop.lanes.map((o) => ({ landT: o.landT, v: o.vImpact, g: o.L.g, pan: o.L.side * 0.38 }));
    const real = lanes.map((L) => fx.smash({ v: L.v, g: L.g, pan: L.pan })), slow = lanes.map((L) => fx.smash({ v: L.v, g: L.g, pan: L.pan, slow: 5, pitch: 0.55, len: 1.4 }));
    const div = Math.max(...real.map((s) => GBX.peak(s.L, s.R))), divS = Math.max(...slow.map((s) => GBX.peak(s.L, s.R)));
    for (const L of lanes) P(fx.clamp(), T.drop, 0.14, L.pan);
    lanes.forEach((L, i) => P(real[i].L, T.drop + L.landT, 1.0, 0, { xr: real[i].R, norm: div, stop: T.replay, fade: 0.1 }));
    const sl = (te) => T.replay + (te - T.replayFrom) / T.replayRate;
    for (const L of lanes) P(fx.clamp({ slow: 4, pitch: 0.6 }), sl(0), 0.2, L.pan);
    lanes.forEach((L, i) => P(slow[i].L, sl(L.landT), 0.55, 0, { xr: slow[i].R, norm: divS, stop: T.replayEnd, fade: 0.12 }));
    lanes.forEach((L, i) => P(real[i].L, T.replayEnd, 1.0, 0, { xr: real[i].R, norm: div, offset: T.replayTo - L.landT, fadeIn: 0.04 }));
    // ---- OUTSIDE: the bench (wood slats on an iron frame), the car's wing and springs
    const benchM = () => [[r.range(200, 240), 0.015, 1], [r.range(450, 500), 0.01, 0.8], [r.range(860, 940), 0.007, 0.5], [r.range(1600, 1800), 0.004, 0.25]];
    const R1 = T.rise1, R2 = T.rise2, ST = T.step;
    P(fx.creak(0.8, benchM(), { rate: [18, 50] }), R1[0] - 0.05, 0.2, 0);
    P(fx.hit(fx.woodModes(160).concat([[520, 0.2, 0.15], [1240, 0.12, 0.08]]), { width: 0.006, amp: 1 }), R1[0] + 1.58, 0.35, 0);
    P(fx.creak(0.6, benchM(), { rate: [20, 60], env: (u) => Math.exp(-u * 3) * Math.min(1, u * 15) }), R1[0] + 1.6, 0.22, 0);
    P(fx.creak(0.9, benchM(), { rate: [15, 45] }), R2[0], 0.3, 0);
    P(fx.hit(fx.woodModes(230, 0.6), { width: 0.002, amp: 0.5 }), R2[0] + 0.75, 0.16, 0);
    // his palm on the car's front wing: a dull, hand-damped ring of sheet steel
    P(fx.slap(fx.panelModes(0.5), { amp: 1, width: 0.004, skin: 0.4, len: 0.5 }), R2[0] - 0.05, 0.5, 0.2);
    { // the springs: groan and squeak only while the body moves (|velocity| of the same response car.js draws)
      const car = this.app.cast.car, C = GB_CAR, kC = 250 * 9.81 / C.sag1;
      const steps = [[R2[0] - 0.05, 650, 0.35], [R2[0] + 0.6, 250, 0.4], [R2[0] + 1.6, -500, 0.6], [ST[0] - 0.3, -400, 0.25]].map(([t0, F, rise]) => [t0, F / (2 * kC), rise]);   // (= cast.js updateOutside)
      const t0 = R2[0] - 0.1, dur = ST[0] + 2.6 - t0, vel = [];
      let vmax = 1e-9;
      for (let t = t0; t < t0 + dur; t += 0.01) { const v = Math.abs(car._resp(t + 0.005, steps) - car._resp(t - 0.005, steps)) / 0.01; vel.push(v); vmax = Math.max(vmax, v); }
      const env = (u, t) => Math.pow(Math.min(1, vel[Math.min(vel.length - 1, Math.floor(t / 0.01))] / vmax), 0.8);
      P(fx.creak(dur, [[r.range(170, 200), 0.02, 1], [r.range(400, 440), 0.012, 0.6], [r.range(740, 800), 0.008, 0.3]], { rate: [35, 95], env }), t0, 0.4, 0.2);
      P(fx.creak(dur, [[1650, 0.02, 1], [2480, 0.015, 0.6], [3900, 0.01, 0.35]], { rate: [320, 760], env: (u, t) => Math.pow(env(u, t), 2) }), t0, 0.06, 0.25);
      for (const tt of [R2[0] + 1.6 + 0.12, ST[0] - 0.3 + 0.1]) P(fx.hit(fx.metalModes(r.range(380, 460), 0.3).concat(fx.panelModes(0.3)), { width: 0.003, amp: 0.6 }), tt, 0.2, 0.2);   // the top mounts knock as it rises
    }
  }
}
