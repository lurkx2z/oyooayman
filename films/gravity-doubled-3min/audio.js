/* =====================================================================
   AUDIO — "What If Gravity Doubled? Episode 01" (3-minute film). js/audio/audioEngine.js is unchanged (this is a subclass).
   Built on the narrated test's v3 dynamic mix (films/gravity-doubled-narrated/audio-v3.js): the same DSP, the same five
   stems and the same ducking, with the sound design written for this film's twelve scenes:
     voice  the seven ElevenLabs clips (never regenerated), levelled per clip, each faded out 0.3 s after its last word
     music  an original score in F, scored scene by scene: sparse under the narrator, carrying the five silent scenes
     amb    the café (room tone, machine, the regulars, a clock after the change, the square through the glass) and the
            plaza (wind, the fountain, birds, pigeons, leaves, a murmur, far heavy steps)
     foley  breath, effort, clothes, hands: the hero, the climber, the cyclist, the shopper and the jogger
     sfx    physics: the doubling, the cup, the hologram, the ceramic balls on their pads (every impact at its computed
            time, bounces included), chairs, stair treads, the rail, the bicycle, the freewheel, the balcony bracket
   Ducking follows the real word times (window.GN); the DYNAMICS MAP (mix.js `dyn`) leaves room before the hits and builds
   where the action builds. Every sound is synthesised from seeded noise and maths: a pure function of time.
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
// the dynamics map (mix.js dyn): a beat name → film time. GB keys ('drop', 'step1[0]') or a narration clip's first/last
// word ('N4<', 'N4>': clip s04's first word, its last word's end)
function gbBeat(name) {
  const m = /^N(\d+)([<>])$/.exec(name);
  if (m) { const c = GN.clips.find((x) => x.id.startsWith('s' + m[1].padStart(2, '0'))); return m[2] === '<' ? c.words[0].start : c.speechEnd; }
  const k = /^(\w+)(?:\[(\d)\])?$/.exec(name), v = GB[k[1]];
  if (v == null) throw new Error('dyn: unknown beat ' + name);
  return k[2] != null ? v[+k[2]] : v;
}
// dB at film time t from keyframes [beat, offset, dB] (sorted by time; raised-cosine between keys, held outside them)
function gbDynDb(t, keys) {
  if (!keys || !keys.length) return 0;
  const K = keys.map(([b, o, d]) => [gbBeat(b) + o, d]).sort((a, b) => a[0] - b[0]);
  if (t <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (t <= K[i][0]) { const [t0, d0] = K[i - 1], [t1, d1] = K[i], u = (t - t0) / Math.max(1e-6, t1 - t0); return d0 + (d1 - d0) * (0.5 - 0.5 * Math.cos(Math.PI * u)); }
  return K[K.length - 1][1];
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
      for (const [f, q, a] of V) { const z = Float32Array.from(v); GBX.bq(z, 'bp', f, q, sr); for (let i = 0; i < n; i++) y[i] += z[i] * a * o.voice * 1.8; }   // (v3: less buzz)
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
    // v3: the crunch — a dense burst of micro-fractures in the first ≈60 ms as the material gives way, each a tiny high
    //     ring, thinning out exponentially; a harder impact makes more of them
    { const nCr = Math.round(40 + 50 * vr * vr);
      for (let k = 0; k < nCr; k++) {
        const tt = -Math.log(1 - r.next() * 0.995) * 0.018 * slow, f = Math.exp(r.range(Math.log(2400), Math.log(10500))) * P;
        const x = this.arr(0.03 * slow); GBX.strike(x, 0, Math.round(0.00008 * slow * sr), 1, [[f, r.range(0.002, 0.007) * Math.pow(slow, 0.7), 1], [f * r.range(1.4, 1.8), 0.003 * Math.pow(slow, 0.7), 0.5]], sr);
        GBX.mixIn(L, R, x, Math.round(tt * sr), 0.06 * vr * r.range(0.3, 1) * Math.exp(-tt / (0.03 * slow)), pan + r.range(-0.3, 0.3));
      } }
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

// ---- extra generators for this film
Object.assign(GbFx.prototype, {
  // a footstep on wooden boards or a stair tread: a soft heel knock through the board's modes, a creak if it is loaded
  woodStep(o = {}) {
    const sr = this.sr, r = this.r, w = o.weight || 0.6, y = this.arr(0.7);
    GBX.strike(y, 0, Math.round(0.003 * sr), 0.9 * w, this.woodModes(o.f || r.range(95, 130), 1.6), sr);
    for (let i = 0; i < 0.3 * sr; i++) y[i] += 0.45 * w * Math.sin(2 * Math.PI * (o.body || 72) * i / sr) * Math.exp(-i / (0.05 * sr)) * Math.min(1, i / (0.003 * sr));
    GBX.strike(y, Math.round(r.range(0.07, 0.1) * sr), Math.round(0.0015 * sr), 0.3 * w, this.woodModes(r.range(170, 220)), sr);
    if (o.creak) { const c = this.creak(r.range(0.25, 0.45), [[r.range(150, 190), 0.02, 1], [r.range(380, 430), 0.012, 0.6], [r.range(760, 860), 0.008, 0.3]], { rate: [14, 40] }); for (let i = 0; i < c.length && i + 0.04 * sr < y.length; i++) y[i + Math.round(0.04 * sr)] += c[i] * o.creak; }
    if (o.scuff) { const sc = this.rustle(0.2, { density: 500, rub: 0.5, lo: 800, hi: 4000, grain: 0.006 }); for (let i = 0; i < sc.length; i++) y[i] += sc[i] * o.scuff; }
    return y;
  },
  // the ceramic ball landing on its rubber pad (over a steel plate): a dull "dok" of the pad and plate, the glazed ball's
  // own short ring, a little rubber squeak. o.v impact speed (m/s); o.slow stretches it for the replay (and lowers it)
  ballHit(o = {}) {
    const sr = this.sr, slow = o.slow || 1, P = o.pitch || 1, vr = o.v / 4.43, y = this.arr(0.9 * slow);
    const st = (m) => m.map(([f, tau, a]) => [f * P, tau * Math.pow(slow, 0.7), a]);
    GBX.strike(y, 0, Math.round(0.0012 * slow * sr), 0.9 * vr, st([[165, 0.06, 1], [260, 0.045, 0.6], [410, 0.03, 0.4], [690, 0.018, 0.25]]), sr);   // pad + plate
    GBX.strike(y, 0, Math.round(0.0005 * slow * sr), 0.28 * vr, st([[3420, 0.05, 1], [5100, 0.035, 0.55], [7900, 0.02, 0.35]]), sr);                    // the ball rings
    GBX.strike(y, 0, Math.round(0.0025 * slow * sr), 0.5 * vr, st(this.metalModes(520, 0.35)), sr);                                                // the stand's base plate
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

class GbAudio extends AudioEngine {
  constructor(tl, app) { super(tl); this.app = app; this.wavName = 'gravity-doubled-3min-soundtrack.wav'; this.solo = null; this.noDuck = false; }
  fingerprintData() {
    return [GB, GN.clips.map((c) => [c.id, c.hash, c.start, c.seconds, c.gainDb]), GB_CAR, GB_DROP, GB_SET.stairs, GB_SET.ramp, window.GB_MIX,
      GbFx.toString(), Object.values(GBX).map(String).join(''), Object.values(GbFx.prototype).map(String).join(''), gnSpeechWindows.toString(), gbDuckDb.toString(), gbBeat.toString(), gbDynDb.toString(),
      GbAudio.toString()];
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
    else {   // the live fallback's master: only a safety limiter (the export is mastered by mix-stems.py)
      const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.1;
      master.connect(lim); lim.connect(ctx.destination);
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
      const dyn = (M.dyn || {})[id], dk = st.duck && !this.noDuck;
      if (dk || dyn) {
        const n = Math.ceil(END * 100) + 1, c = new Float32Array(n);
        for (let i = 0; i < n; i++) c[i] = Math.pow(10, ((dk ? gbDuckDb(i / 100, st.duck, M, wins) : 0) + (this.noDuck ? 0 : gbDynDb(i / 100, dyn))) / 20);
        duck.gain.setValueCurveAtTime(c, 0, END);
      }
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
      const src = ctx.createBufferSource(), g = ctx.createGain(), v = Math.pow(10, (c.gainDb + ((window.GB_MIX.voiceTrim || {})[c.id] || 0)) / 20);
      // every word plays whole; the clip fades out just after its last word (last word + 0.3 s): clip 02's file ends on a click
      const f1 = Math.min(c.start + buf.duration, c.speechEnd + 0.3);
      src.buffer = buf; src.connect(g); g.connect(low); src.start(c.start); src.stop(f1 + 0.02);
      g.gain.setValueAtTime(v, c.start); g.gain.setValueAtTime(v, f1 - 0.12); g.gain.linearRampToValueAtTime(0, f1);
    }
  }

  // ===================================================================================================== MUSIC
  // an original score in F: felt piano, string section, pizzicato, bells, a felt drum. Under the narrator it is sparse;
  // in the five silent scenes it carries the story (the dynamics map in mix.js shapes it further)
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
    const beat = (t, v) => fx.play(fx.hit([[70, 0.16, 1], [104, 0.1, 0.45], [141, 0.07, 0.3], [212, 0.04, 0.12]], { width: 0.007, len: 0.9 }), t, bus, { vol: v * 0.4, norm: true });
    const strings = (t0, t1, notes, vol, o = {}) => {
      if (t1 - t0 < 0.1) return;
      const att = Math.min(o.att || 1.0, (t1 - t0) * 0.45), rel = Math.min(o.rel || 1.2, (t1 - t0) * 0.45), g = ctx.createGain();
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
    // a chord walk: [[t, notes], …] up to tEnd, each chord held to the next
    const walk = (list, tEnd, vol, o = {}) => list.forEach(([t, notes], i) => strings(t - 0.1, (list[i + 1] ? list[i + 1][0] : tEnd) + 0.15, notes, vol, Object.assign({ att: 0.7, rel: 0.5, cut: 1300 }, o)));

    // ================= S1: a warm felt-piano figure in F over a soft pad; a short swell; everything stops dead at g
    const figA = ['F4', 'C5', 'A4', 'E5', 'G4', 'C5', 'A4', 'D5'];
    for (let i = 0; 0.1 + i * 0.36 < T.g - 0.25; i++) piano(0.1 + i * 0.36, figA[i % 8], 0.4 + 0.08 * (i % 2 ? 0 : 1), Math.min(1.2, T.g - 0.14 - 0.1 - i * 0.36), i % 2 ? 0.25 : -0.25, 0.06);
    for (const t of [0.1, 2.98, 5.86]) { piano(t, 'F2', 0.5, Math.min(2.8, T.g - 0.26 - t), 0, 0.06); piano(t, 'C3', 0.32, Math.min(2.8, T.g - 0.26 - t), 0, 0.06); }
    piano(8.7, 'D2', 0.45, T.g - 0.26 - 8.7, 0, 0.06);
    strings(0.0, T.g - 0.08, ['F3', 'A3', 'C4', 'E4'], 0.45, { att: 0.8, rel: 0.08, cut: 1500 });
    strings(T.g - 0.9, T.g - 0.08, ['C3', 'G3', 'Db4'], 0.55, { att: 0.75, rel: 0.05, cut: 900, cutTo: 1800 });
    // after the doubling: a low uneasy D (cellos), a thin high E creeping in; one low piano note for the weight
    piano(T.g + 0.42, 'D2', 0.7, 2.4); drum(T.g + 0.42, 'D2', 0.55);
    strings(T.g + 0.35, T.s2 + 0.8, ['D2', 'A2', 'D3'], 1.5, { att: 0.9, rel: 0.9, cut: 750 });
    strings(T.g + 0.8, T.s2 + 0.6, ['E5'], 0.35, { att: 1.3, rel: 0.6, cut: 4000, vib: 4 });
    // ================= S2 (no narration): the struggle. A low A pulse that tightens while he lifts and holds, slows while
    //      he lowers it, high strings rubbing a semitone, a hush before the set-down, then F major and four soft plucks
    strings(T.s2 + 0.3, T.lift + 0.2, ['A2', 'E3'], 0.6, { att: 1.2, rel: 0.3, cut: 700 });
    { let t = T.grip + 0.1, k = 0;
      while (t < Math.min(T.lower + 1.6, T.down - 0.45)) {
        const v = t < T.lift ? 0.15 + 0.25 * (t - T.grip) / (T.lift - T.grip) : t < T.top ? 0.5 + 0.35 * (t - T.lift) / (T.top - T.lift) : t < T.lower ? 0.85 : 0.85 - 0.5 * (t - T.lower) / 1.6;
        pizz(t, k % 2 ? 'E3' : 'A2', v, k % 2 ? 0.2 : -0.2, 0.3);
        if (t > T.lift && k % 4 === 0) pizz(t, 'A3', v * 0.5, 0.35, 0.4);
        t += t < T.lower ? 0.3 : t < T.lower + 0.9 ? 0.42 : 0.6; k++;
      } }
    strings(T.lift - 0.2, T.down - 0.3, ['A2', 'E3'], 0.9, { att: 1.5, rel: 0.3, cut: 800, keys: [[T.lift + 1.3, 0.6], [T.top, 1.0], [T.lower, 1.0], [T.down - 0.65, 0.55]] });
    strings(T.lift + 0.4, T.lower + 1.0, ['E5', 'F5'], 0.45, { att: 1.8, rel: 0.5, cut: 3500, keys: [[T.lift + 2.2, 0.5], [T.top + 0.8, 1.0], [T.lower + 0.5, 0.7]], vib: 3 });
    strings(T.lower + 0.7, T.down - 0.3, ['A5'], 0.3, { att: 0.6, rel: 0.12, cut: 5000, vib: 2 });
    piano(T.down + 0.03, 'F2', 0.55, 3.5); piano(T.down + 0.05, 'C4', 0.4, 3.5); piano(T.down + 0.06, 'F4', 0.4, 3.5); piano(T.down + 0.08, 'A4', 0.45, 3.5);
    strings(T.down, T.s3 + 0.8, ['F3', 'A3', 'C4', 'E4'], 0.7, { att: 0.45, rel: 0.7, cut: 1600 });
    ['C5', 'A4', 'F4', 'C4'].forEach((n, i) => pizz(T.down + 0.22 + i * 0.36, n, 0.5, i % 2 ? 0.3 : -0.3, 0.55));
    // ================= S3: same mass, double weight. Dm9 → Bbmaj7 → F/A → Gm7; a bell on "mass", a rising line on "twice"
    walk([[T.s3 + 0.5, ['D3', 'F3', 'A3', 'E4']], [T.coffee, ['Bb2', 'D3', 'F3', 'A3']], [T.body + 0.2, ['A2', 'C3', 'F3', 'A3']], [T.pull, ['G2', 'D3', 'F3', 'Bb3']]], T.exp + 0.4, 0.5);
    bell(T.holo + 0.05, 'A5', 0.4, 0.3); bell(T.mass + 0.05, 'E6', 0.45, -0.3);
    [[T.s3 + 0.6, 'A4'], [T.coffee + 0.05, 'F4'], [T.body + 0.3, 'C5'], [T.pull + 0.1, 'Bb4']].forEach(([t, n], i) => piano(t, n, 0.36, 1.8, i % 2 ? 0.2 : -0.2));
    strings(T.twice[0] - 1.2, T.exp + 0.3, ['D4', 'G4'], 0.35, { att: 1.0, rel: 0.4, cut: 1800, cutTo: 4200, keys: [[T.twice[1], 1.0]] });
    // ================= S4: the experiment. A soft tick-tock and a chord walk; a bell as each predicted time lights; from
    //      "but under double gravity" a heartbeat that quickens and stops dead before the clamps open
    for (let t = T.exp + 0.5, k = 0; t < T.lane2[0] - 0.05; t += 0.5, k++) tick(t, k % 2 ? 1310 : 1750, k % 2 ? 0.8 : 1.0, 0.1);
    for (let t = T.lane2[0] + 0.1, gap = 0.84; t < T.drop - 0.75; t += gap, gap = Math.max(0.58, gap * 0.95)) {
      const u = (t - T.lane2[0]) / (T.drop - T.lane2[0]); beat(t, 0.35 + 0.5 * u); beat(t + 0.19, (0.35 + 0.5 * u) * 0.62);
    }
    walk([[T.exp + 0.1, ['A2', 'E3', 'G3', 'C4']], [T.wideExp + 0.7, ['F2', 'C3', 'E3', 'A3']], [T.lane1[0] + 1.2, ['E2', 'C3', 'G3', 'E4']], [T.lane2[0] - 0.1, ['D2', 'A2', 'F3', 'C4']]], N4.speechEnd + 0.3, 0.7, { cut: 1200 });
    piano(N4.start + 0.15, 'E4', 0.4, 1.5, 0.1); piano(T.oneM[0], 'C5', 0.4, 1.5, 0.1);
    bell(T.lane1[0] + 0.05, 'C6', 0.55, -0.35); bell(T.lane2[0] + 0.05, 'E6', 0.55, 0.35);
    // the hold before the drop: a thin high note and a low swell, cut 0.46 s before the clamps: silence, click, impacts
    strings(T.lane2[0] + 1.0, T.drop - 0.47, ['A5', 'E6'], 0.35, { att: 1.0, rel: 0.03, cut: 6000, vib: 2, keys: [[N4.speechEnd, 0.7], [T.drop - 0.55, 1.0]] });
    strings(T.lane2[0] + 0.5, T.drop - 0.47, ['D2', 'A2', 'D3'], 1.0, { att: 1.2, rel: 0.03, cut: 400, cutTo: 2000, keys: [[N4.speechEnd, 0.6], [T.drop - 0.55, 1.0]] });
    // ================= S5: the result after the bounces settle; the replay on a low Bb with a reverse swell sucked into the
    //      slowed 2 g hit; Bb → Csus4 → F into scene 6
    const tRes = T.drop + 1.75;
    ['F5', 'A5', 'C6'].forEach((n, i) => bell(tRes + i * 0.035, n, 0.55, [-0.3, 0, 0.3][i]));
    piano(tRes, 'F2', 0.45, 1.5); piano(tRes + 0.02, 'C4', 0.32, 1.2);
    const sl = (te) => T.replay + (te - T.replayFrom) / T.replayRate, land2 = Math.min(...this.app.drop.lanes.map((o) => o.landT));
    strings(T.replay - 0.1, T.replayEnd + 0.3, ['Bb1', 'F2', 'Bb2', 'F3'], 1.2, { att: 1.0, rel: 0.5, cut: 700 });
    strings(T.replay + 0.4, T.replayEnd + 0.2, ['D6'], 0.2, { att: 1.0, rel: 0.4, cut: 6000, vib: 2 });
    strings(sl(land2) - 1.1, sl(land2) + 0.02, ['Bb3', 'C4', 'D4', 'F4'], 0.9, { att: 1.05, rel: 0.02, cut: 700, cutTo: 2600 });
    piano(T.replayEnd + 0.05, 'Bb2', 0.5, 2.0); piano(T.replayEnd + 0.07, 'D4', 0.4, 2.0); piano(T.replayEnd + 0.09, 'F4', 0.35, 2.0); piano(T.replayEnd + 0.6, 'C5', 0.4, 1.6, 0.2);
    walk([[T.replayEnd, ['Bb2', 'F3', 'D4']], [T.s6 - 1.6, ['C3', 'F3', 'G3', 'C4']]], T.s6 + 0.5, 0.6, { cut: 1500 });
    // ================= S6: your body. Dm → Bb → Gm → A (a question); the standing up gets a felt drum and a climb; under
    //      "your heart" a low heartbeat
    walk([[T.s6 + 0.3, ['D3', 'F3', 'A3']], [T.stand[0], ['Bb2', 'D3', 'F3', 'Bb3']], [T.upCut, ['G2', 'D3', 'G3', 'Bb3']], [T.heart, ['A2', 'E3', 'G3', 'C#4']]], T.s7 + 0.3, 0.5);
    drum(T.stand[0] + 0.5, 'Bb1', 0.45); drum(T.stand[0] + 2.0, 'D2', 0.4);
    [[T.s6 + 0.4, 'A4'], [T.you, 'D5'], [T.stand[0] + 1.0, 'F4'], [T.upCut + 0.2, 'G4'], [T.heart + 0.2, 'E4']].forEach(([t, n], i) => piano(t, n, 0.36, 1.8, i % 2 ? 0.2 : -0.2));
    for (let t = T.heart + 0.3, k = 0; t < T.s7 - 0.4; t += 0.92, k++) { beat(t, 0.4); beat(t + 0.2, 0.25); }
    // ================= S7 (no narration): the stairs. The pizzicato labours with his steps, the chords climb; on the first
    //      step a drum and C; at the second attempt everything thins to one high note; when he stops, a soft resolution
    { const roots = (t) => t < T.walk[1] ? 'D2' : t < T.step1[0] ? 'E2' : 'F2';
      for (let t = T.s7 + 0.2, k = 0; t < T.step1[1] + 0.3; t += 0.46, k++) pizz(t, roots(t), 0.45 + 0.3 * (t - T.s7) / (T.step1[1] - T.s7), k % 2 ? 0.25 : -0.25, 0.3); }
    walk([[T.s7, ['D3', 'F3', 'A3', 'D4']], [T.walk[1] - 0.2, ['E3', 'G3', 'C4', 'E4']], [T.step1[0] + 0.2, ['F2', 'C3', 'F3', 'A3', 'C4']]], T.step2[0] + 0.4, 0.8, { cut: 1600 });
    drum(T.step1[0] + 0.7, 'F1', 0.6); drum(T.step1[1] - 0.15, 'C2', 0.5);
    strings(T.step2[0] - 0.2, T.back[1] + 0.5, ['G5'], 0.3, { att: 0.5, rel: 0.4, cut: 5000, vib: 2 });
    strings(T.back[1] + 0.2, T.out + 0.4, ['Bb2', 'F3', 'D4', 'A4'], 0.65, { att: 1.2, rel: 0.8, cut: 1400 });
    piano(T.handCU + 0.1, 'Bb2', 0.4, 2.5); piano(T.handCU + 0.12, 'F4', 0.36, 2.5); piano(T.handCU + 1.6, 'A4', 0.36, 2.0, 0.2); piano(T.handCU + 3.0, 'G4', 0.34, 1.6, -0.2);
    // ================= S8: the city. Dm → Bb → Gm7 → C, the piano figure slower and lower, a few plucks
    walk([[T.out, ['D3', 'F3', 'A3']], [T.carCU, ['Bb2', 'F3', 'D4']], [T.fount, ['G2', 'D3', 'F3', 'Bb3']], [T.rules, ['C3', 'F3', 'G3', 'C4']]], T.s9 + 0.3, 0.45);
    ['D4', 'A4', 'F4', 'E4', 'D4', 'C4', 'A3', 'Bb3', 'D4', 'F4', 'E4', 'C4'].forEach((n, i) => piano(T.out + 0.55 + i * 1.6, n, 0.34, 1.6, i % 2 ? 0.25 : -0.25));
    // ================= S9 (no narration): a gentle theme. F → C/E → Dm → Bb → F; the melody walks with her up the ramp; it
    //      opens at the fountain reveal; it thins to piano when we find him at the edge of the square
    walk([[T.s9 - 0.1, ['F2', 'C3', 'F3', 'A3']], [T.s9 + 2.6, ['E2', 'C3', 'G3', 'C4']], [T.s9b, ['D2', 'A2', 'F3', 'A3', 'D4']], [T.s9b + 2.5, ['Bb1', 'F2', 'D3', 'F3', 'Bb3']], [T.s9c, ['F2', 'C3', 'A3']]], T.s10 + 0.3, 0.75, { cut: 1700 });
    [['A4', 0], ['C5', 0.65], ['F5', 1.3], ['E5', 2.6], ['D5', 3.25], ['C5', 3.9], ['A4', 5.3], ['F5', 6.0], ['E5', 6.6], ['D5', 7.8], ['F5', 8.4], ['C5', 10.0], ['A4', 11.3], ['G4', 12.6]]
      .forEach(([n, d], i) => piano(T.s9 + d, n, 0.5, 1.6, i % 2 ? 0.2 : -0.2));
    for (let t = T.s9, k = 0; t < T.s9b; t += 0.55, k++) pizz(t, k % 2 ? 'C3' : 'F2', 0.3, k % 2 ? 0.25 : -0.25, 0.35);
    strings(T.s9b - 0.3, T.s9c + 0.5, ['A5', 'D6'], 0.25, { att: 1.5, rel: 1.0, cut: 5000, vib: 4 });
    bell(T.s9b + 0.1, 'A6', 0.3, 0.3); bell(T.s9b + 0.45, 'F6', 0.25, -0.3);
    // ================= S10: the bigger question. Low strings Dm → Bb → Gm → A7 under the line; a slow low pulse from "Some
    //      systems…", one bell for "the real question"
    walk([[T.s10, ['D2', 'A2', 'F3']], [T.sky, ['Bb1', 'F2', 'D3', 'F3']], [T.eng, ['G1', 'D2', 'Bb2', 'D3']], [T.back10, ['A1', 'E2', 'C#3', 'G3']]], T.s11 + 0.3, 0.75, { cut: 900 });
    for (let t = T.eng + 0.2; t < T.back10 - 0.2; t += 1.2) drum(t, 'D2', 0.22);
    [[T.s10 + 0.3, 'F4'], [T.sky + 0.1, 'D4'], [T.back10 + 0.05, 'E4']].forEach(([t, n]) => piano(t, n, 0.34, 2.0, 0.1));
    bell(T.back10 + 0.1, 'E5', 0.35, 0);
    // ================= S11 (no narration): the reveal. The warmest, fullest moment: F → Bbmaj7 → C → F with the piano
    //      figure from the opening coming back (slower) and bells like the jets' sparkle
    walk([[T.s11 - 0.1, ['F2', 'C3', 'F3', 'A3', 'C4']], [T.s11 + 2.6, ['Bb1', 'F2', 'D3', 'A3', 'D4']], [T.s11 + 5.2, ['C2', 'G2', 'E3', 'G3', 'C4']], [T.s11 + 7.6, ['F2', 'C3', 'A3', 'C4', 'F4']]], T.s12 + 0.6, 1.0, { cut: 2000 });
    strings(T.s11 + 1.0, T.s12 + 0.4, ['F5', 'C6'], 0.28, { att: 2.0, rel: 1.0, cut: 5500, vib: 4 });
    for (let i = 0; T.s11 + 0.2 + i * 0.6 < T.s12 - 0.3; i++) piano(T.s11 + 0.2 + i * 0.6, figA[i % 8], 0.4, 1.1, i % 2 ? 0.25 : -0.25);
    for (const [d, n, p] of [[1.3, 'C7', 0.4], [3.1, 'A6', -0.4], [4.8, 'F6', 0.2], [6.9, 'C7', -0.2], [8.6, 'A6', 0.35]]) bell(T.s11 + d, n, 0.22, p);
    drum(T.s11 + 5.2, 'C2', 0.35); drum(T.s11 + 7.6, 'F1', 0.45);
    // ================= S12: the final question. Dm → Bb → C under the line; after the last word Fmaj9 opens and decays
    const wq = N12.words, wMid = wq[Math.floor(wq.length / 2)].start;
    walk([[T.s12, ['D3', 'F3', 'A3']], [wMid, ['Bb2', 'F3', 'D4']], [N12.speechEnd - 1.4, ['C3', 'G3', 'E4']]], N12.speechEnd + 0.2, 0.5, { cut: 1400 });
    strings(N12.speechEnd + 0.1, T.end + 0.05, ['F2', 'C3', 'A3', 'E4', 'G4'], 0.85, { att: 0.8, rel: 2.2, cut: 1500, keys: [[N12.speechEnd + 0.6, 1.0], [T.end - 2.0, 0.85]] });
    [[T.s12 + 0.3, 'A4'], [wMid, 'F4'], [N12.speechEnd - 1.3, 'G4']].forEach(([t, n]) => piano(t, n, 0.38, 1.6, 0.15));
    piano(N12.speechEnd + 0.15, 'F2', 0.55, 2.4); piano(N12.speechEnd + 0.17, 'C4', 0.45, 2.4); piano(N12.speechEnd + 0.2, 'A4', 0.5, 2.4);
    piano(N12.speechEnd + 1.0, 'C5', 0.45, 1.6, 0.2); bell(T.end - 1.6, 'F6', 0.32, 0);
  }

  // ===================================================================================================== AMBIENCE
  _amb(ctx, dest, END) {
    const fx = new GbFx(ctx, CONFIG.seed + 201), r = fx.r, sr = fx.sr, T = GB;
    const inside = ctx.createGain(), outside = ctx.createGain(); inside.connect(dest); outside.connect(dest);
    // the café is the café; the experiment shots lower it; a J-cut: the square's sound arrives 0.7 s before the picture
    inside.gain.setValueAtTime(1, 0); inside.gain.setValueAtTime(1, T.exp - 0.3); inside.gain.linearRampToValueAtTime(0.6, T.exp + 0.3);
    inside.gain.setValueAtTime(0.6, T.s6 - 0.3); inside.gain.linearRampToValueAtTime(1, T.s6 + 0.2);
    inside.gain.setValueAtTime(1, T.out - 0.05); inside.gain.linearRampToValueAtTime(0, T.out + 0.25);
    outside.gain.setValueAtTime(0, 0); outside.gain.setValueAtTime(0, T.out - 0.7); outside.gain.linearRampToValueAtTime(0.5, T.out - 0.05); outside.gain.linearRampToValueAtTime(1, T.out + 0.3);
    // ---- the café bed (stereo)
    const ci = T.out + 0.4, L = fx.arr(ci), R = fx.arr(ci), n = L.length;
    for (const X of [L, R]) {   // room tone
      const w = fx.white(n), h = fx.white(n); GBX.bq(w, 'lp', 380, 0.6, sr); GBX.bq(w, 'hp', 70, 0.7, sr); GBX.bq(h, 'bp', 1900, 0.4, sr);
      for (let i = 0; i < n; i++) X[i] += w[i] * 0.16 + h[i] * 0.012;
    }
    { // the espresso machine: a faint hiss, a gurgle now and then (behind the counter, right)
      const h = fx.white(n); GBX.bq(h, 'bp', 3900, 3, sr);
      GBX.mixIn(L, R, h, 0, 0.012, 0.6);
      for (const t0 of [1.4, 9.6, 23.2, 33.4, 52.0, 74.5, 91.0]) for (let t = t0; t < t0 + 0.5; t += r.range(0.015, 0.05)) fx.bubble(L, R, Math.round(t * sr), r.range(160, 520), r.range(0.01, 0.03), 0.05, 0.6);
    }
    { // the square through the glass: a murmur (quiet after the doubling, then smaller and uneasy), the fountain, birds
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
      for (let i = 0; i < n; i++) { const t = i / sr; m[i] *= t < T.g ? 1 : t < T.g + 0.15 ? 1 - (t - T.g) / 0.15 : t < T.g + 4.5 ? 0 : Math.min(0.5, 0.5 * (t - T.g - 4.5) / 3); }
      GBX.mixIn(L, R, m, 0, 0.05, -0.35);
      const fo = fx.white(n); GBX.bq(fo, 'bp', 1500, 0.8, sr); GBX.bq(fo, 'lp', 2400, 0.7, sr);
      GBX.mixIn(L, R, fo, 0, 0.012, -0.5);
      for (let t = 0.8; t < ci - 1; t += r.range(1.8, 3.8)) { if (t > T.g - 0.1 && t < T.g + 6.5) continue; const c = this._chirpArr(fx, r.range(2600, 3600), r.int(1, 3)); GBX.bq(c, 'lp', 2200, 0.7, sr); GBX.mixIn(L, R, c, Math.round(t * sr), 0.022, r.range(-0.8, -0.2)); }
    }
    { // the waiter's cups: light clinks before the doubling, heavy ones after; a spoon and a newspaper before it
      for (const [t, v] of [[0.35, 0.05], [1.25, 0.04], [2.05, 0.05], [6.4, 0.04]]) GBX.mixIn(L, R, fx.hit(fx.cupModes().concat(fx.saucerModes()), { width: 0.0003, amp: 1 }), Math.round(t * sr), v, 0.55);
      for (const [t, v] of [[T.g + 0.95, 0.08], [T.s3 + 6.0, 0.05], [T.s6 + 3.0, 0.05], [T.s7 + 9.5, 0.05]]) {
        const y = fx.hit(fx.cupModes().concat(fx.saucerModes()), { width: 0.0006, amp: 1 });
        GBX.strike(y, 0, Math.round(0.002 * sr), 0.6, fx.woodModes(170), sr);
        GBX.mixIn(L, R, y, Math.round(t * sr), v, 0.55);
      }
      const cm = fx.cupModes(1.12).map(([f, tau, a]) => [f, tau * 0.7, a]);
      for (let t = 0.55, k = 0; t < 1.55; t += 0.21 + 0.03 * Math.sin(k * 1.7), k++) GBX.mixIn(L, R, fx.hit(cm, { width: 0.00025, amp: 1 }), Math.round(t * sr), 0.011 + 0.005 * (k % 2), -0.45);
      for (const t of [1.72, 1.86]) GBX.mixIn(L, R, fx.hit(cm, { width: 0.0002, amp: 1 }), Math.round(t * sr), 0.02, -0.45);
      const pg = fx.rustle(0.45, { density: 900, rub: 0.25, lo: 1400, hi: 9000, grain: 0.004, peak: 3200, env: (u) => Math.pow(Math.sin(Math.PI * u), 0.6) * (u < 0.7 ? 1 : 1.4) });
      GBX.mixIn(L, R, pg, Math.round(4.6 * sr), 0.02, 0.4);
    }
    { // the regulars' murmur at the next table (until the doubling), and a clock ticking on the wall afterwards
      const mm = new Float32Array(Math.round((T.g + 0.2) * sr));
      for (let v = 0; v < 2; v++) {
        const f0 = v ? 190 : 118, wv = fx.wander(0.8); let ph = 0, syl = 0, a = 0, tgt = 0;
        for (let i = 0; i < mm.length; i++) {
          if (i >= syl) { syl = i + Math.round(r.range(0.08, 0.24) * sr); tgt = (Math.sin(i / sr * 0.8 + v * 3) > 0 ? 1 : 0.15) * (r.chance(0.75) ? r.range(0.4, 1) : 0); }
          a += (tgt - a) * 0.002; ph += f0 * (1 + 0.1 * wv(i / sr)) / sr; if (ph >= 1) { ph -= 1; mm[i] += a; }
        }
      }
      GBX.bq(mm, 'bp', 700, 1.0, sr); GBX.bq(mm, 'lp', 1700, 0.7, sr);
      for (let i = 0; i < mm.length; i++) mm[i] *= Math.min(1, (T.g + 0.12 - i / sr) / 0.12);
      GBX.mixIn(L, R, mm, 0, 0.035, 0.25);
      const tk = fx.hit([[3100, 0.012, 1], [5200, 0.008, 0.5]], { width: 0.0002 });
      for (let t = T.g + 6, k = 0; t < ci - 0.5; t += 1, k++) GBX.mixIn(L, R, tk, Math.round(t * sr), k % 2 ? 0.006 : 0.008, -0.7);
    }
    fx.play(L, 0, inside, { xr: R, vol: 1.8 });
    // ---- the plaza (stereo): gusting wind, the fountain, birds, pigeons, leaves, a distant murmur, far heavy steps
    const t0 = T.out - 0.75, D = END - t0, oL = fx.arr(D), oR = fx.arr(D), m = oL.length;
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
    { // the fountain: the short jets fall back heavier and sooner at 2 g (a denser, lower splash)
      const bed = fx.white(m), sp = fx.white(m); GBX.bq(bed, 'hp', 700, 0.7, sr); GBX.bq(bed, 'lp', 6500, 0.7, sr); GBX.bq(sp, 'bp', 420, 0.9, sr);
      const wv = fx.wander(0.5);
      for (let i = 0; i < m; i++) { const a = 1 + 0.15 * wv(i / sr); oL[i] += (bed[i] * 0.03 + sp[i] * 0.05) * a; oR[i] += (bed[(i + 5003) % m] * 0.03 + sp[(i + 7919) % m] * 0.05) * a; }
      for (let t = 0; t < D; t += r.range(0.002, 0.012)) fx.bubble(oL, oR, Math.round(t * sr), Math.exp(r.range(Math.log(350), Math.log(2600))), r.range(0.004, 0.02), r.range(0.006, 0.035), r.range(-0.2, 0.7));
    }
    { const mm = new Float32Array(m);
      for (let v = 0; v < 3; v++) {
        const f0 = r.range(110, 230), wv = fx.wander(0.6); let ph = 0, syl = 0, a = 0, tgt = 0;
        for (let i = 0; i < m; i++) {
          if (i >= syl) { syl = i + Math.round(r.range(0.1, 0.3) * sr); tgt = r.chance(0.5) ? r.range(0.3, 1) : 0; }
          a += (tgt - a) * 0.0015; ph += f0 * (1 + 0.12 * wv(i / sr)) / sr; if (ph >= 1) { ph -= 1; mm[i] += a; }
        }
      }
      GBX.bq(mm, 'bp', 600, 1.0, sr); GBX.bq(mm, 'lp', 1300, 0.7, sr);
      GBX.mixIn(oL, oR, mm, 0, 0.026, 0.3);
    }
    { // sparrows, pigeon coos, the low-flying pigeons' wings, leaves
      for (let t = 0.6; t < D - 0.5; t += r.range(1.6, 3.6)) GBX.mixIn(oL, oR, this._chirpArr(fx, r.range(3200, 4800), r.int(2, 6)), Math.round(t * sr), r.range(0.025, 0.05), r.range(-0.8, 0.8));
      for (const t of [T.out + 1.5, T.out + 7.8, T.fount + 3, T.s9 + 4.4, T.s10 + 2.0, T.eng + 2.5, T.s11 + 3.0, T.end - 2.4]) {
        const y = fx.arr(1.1), f0 = r.range(330, 390); let ph = 0;
        for (let i = 0; i < y.length; i++) {
          const u = i / y.length, lobes = Math.max(0, Math.sin(Math.PI * Math.min(1, u * 3.2))) * (u < 0.32 ? 0.7 : 0) + Math.max(0, Math.sin(Math.PI * (u - 0.35) / 0.55)) * (u > 0.35 && u < 0.9 ? 1 : 0);
          const f = f0 * (u < 0.32 ? 1.0 : 1.12 - 0.2 * (u - 0.35)) * (1 + 0.012 * Math.sin(2 * Math.PI * 26 * i / sr));
          ph += 2 * Math.PI * f / sr; y[i] = (Math.sin(ph) + 0.35 * Math.sin(2 * ph) + 0.1 * Math.sin(3 * ph)) * lobes;
        }
        GBX.bq(y, 'lp', 1200, 0.7, sr);
        GBX.mixIn(oL, oR, y, Math.round((t - t0) * sr), 0.055, r.range(-0.4, 0.3));
      }
      for (let k = 0; k < 9; k++) {   // the two flying pigeons' passes (cast3.js: every 9 s), laboured wingbeats
        const ts = T.out - 4.5 * (k % 2) + Math.floor(k / 2) * 9; if (ts + 9 < t0 || ts > END) continue;
        const y = fx.arr(9);
        for (let t = 0; t < 9; t += 1 / 5.4) {
          const a = Math.pow(Math.sin(Math.PI * t / 9), 2), fl = fx.rustle(0.05, { density: 600, rub: 0.6, lo: 600, hi: 2400, grain: 0.004, env: (u) => Math.sin(Math.PI * u) });
          for (let j = 0; j < fl.length; j++) { const q = Math.round(t * sr) + j; if (q < y.length) y[q] += fl[j] * a; }
        }
        GBX.mixIn(oL, oR, y, Math.round((ts - t0) * sr), 0.035, k % 2 ? 0.4 : -0.4);
      }
      const gw = fx.wander(0.13);
      for (const [pan, ph] of [[-0.7, 0], [0.75, 3.1]]) {
        const lv = fx.rustle(D, { density: 260, rub: 0.12, lo: 1800, hi: 7500, grain: 0.005, env: (u) => Math.pow(Math.max(0, 0.45 + 0.55 * gw(u * D + ph)), 2) });
        GBX.mixIn(oL, oR, lv, 0, 0.018, pan);
      }
    }
    { // people crossing the far side of the square: slow, heavy steps, far away
      for (const [ta, tb, pa, pb] of [[T.out + 0.8, T.out + 9.5, -0.8, 0.2], [T.s10 + 1.0, T.s12 + 6.0, 0.7, -0.3]]) {
        for (let t = ta, k = 0; t < tb; t += r.range(0.95, 1.15), k++) {
          const y = fx.step({ weight: 0.4, scuff: k % 3 === 0 ? 0.25 : 0 }); GBX.bq(y, 'lp', 1600, 0.7, sr);
          GBX.mixIn(oL, oR, y, Math.round((t - t0) * sr), 0.01, pa + (pb - pa) * (t - ta) / (tb - ta));
        } } }
    fx.play(oL, t0, outside, { xr: oR, vol: 0.7 });
  }
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

  // the landing times of a foothold plan (holds after the two starting ones), within [ta, tb]
  _landings(plan, ta, tb) { return plan.filter((h) => h.t0 > ta && h.t0 < tb).map((h) => h); }

  // ===================================================================================================== FOLEY
  // every event is peak-normalised, so each `vol` below is that sound's peak level inside the stem (1 = the loudest)
  _foley(ctx, dest) {
    const fx = new GbFx(ctx, CONFIG.seed + 301), T = GB, C = this.app.cast;
    const bus = this._withRooms(ctx, fx, dest, 0.2, 0.08);
    const P = (x, t, vol, pan = 0) => fx.play(x, t, bus, { vol, pan, norm: true });
    const rustle = (t, dur, vol, pan = 0, o = {}) => P(fx.rustle(dur, o), t, vol, pan);
    const breath = (t, dur, vol, o = {}, pan = 0) => P(fx.breath(dur, o), t, vol, pan);
    const breathing = (ta, tb, vol, period, pan = 0, f0 = 110) => { for (let t = ta, k = 0; t < tb; t += period * (k % 2 ? 0.55 : 0.45), k++) breath(t, period * 0.42, k % 2 ? vol * 0.75 : vol, k % 2 ? { inhale: true } : { voice: 0.06, f0 }, pan); };
    // ---- S1: the doubling hits him (a jolt of clothes, a sharp intake, a worried breath out); the arm sinks
    rustle(T.g + 0.01, 0.45, 0.3, 0, { env: (u) => Math.exp(-u * 5) * Math.min(1, u * 30), density: 500 });
    breath(T.g + 0.06, 0.32, 0.3, { inhale: true });
    breath(T.g + 0.8, 0.75, 0.3, {});
    rustle(T.g + 0.06, 0.5, 0.08, 0.55, { density: 300 });
    rustle(T.cupDown1 - 0.5, 0.6, 0.14, 0);
    // ---- S2: the brace (left palm to the table), the grip, the lift with a strained grunt, breaths, the slow lowering
    P(fx.slap(fx.woodModes(200, 0.8), { amp: 0.7, width: 0.004, skin: 0.5 }), T.brace + 0.05, 0.22, -0.25);
    rustle(T.brace - 0.3, 0.6, 0.16, -0.2); rustle(T.grip - 0.2, 0.5, 0.12, 0.1);
    breath(T.lift - 0.42, 0.3, 0.24, { inhale: true });
    rustle(T.lift - 0.3, 0.32, 0.14, 0);
    breath(T.lift + 0.3, 1.0, 0.55, { voice: 0.32, f0: 112, nasal: true, env: (u) => Math.min(1, u / 0.15) * (1 - Math.pow(u, 3)) });
    rustle(T.lift + 0.12, 0.75, 0.2, 0);
    for (let t = T.lift + 1.2, k = 0; t < T.lower - 0.25; t += 0.78, k++) breath(t, k % 2 ? 0.42 : 0.5, k % 2 ? 0.26 : 0.36, k % 2 ? { inhale: true } : { voice: 0.12, f0: 118 });
    rustle(T.top - 0.3, 0.5, 0.14, 0);
    breath(T.lower + 0.1, T.down - T.lower - 0.15, 0.2, { teeth: true, env: (u) => Math.min(1, u / 0.2) * (0.7 + 0.3 * Math.sin(u * 9)) * (1 - Math.pow(u, 4)) });
    rustle(T.lower, 0.95, 0.14, 0, { density: 150 });
    rustle(T.down + 0.12, 0.45, 0.16, 0);
    breath(T.letGo + 0.04, 1.15, 0.55, { voice: 0.08, f0: 105, env: (u) => Math.min(1, u / 0.06) * Math.pow(1 - u, 1.6) });
    rustle(T.letGo + 0.25, 0.8, 0.18, 0);
    breathing(T.letGo + 1.4, T.s3 + 1.5, 0.22, 1.5);
    // ---- S3: he breathes, quietly (under the narrator); a shift in the chair on "your own body"
    breathing(T.s3 + 1.5, T.exp - 0.5, 0.1, 1.8);
    rustle(T.body + 0.2, 0.6, 0.12, 0);
    // ---- S6: "It's you." He gets up: the lean, both palms on the table, a long strained push, legs shaking; then up, breathing
    breathing(T.s6 + 0.3, T.stand[0] - 0.6, 0.14, 1.6);
    rustle(T.stand[0] - 0.6, 0.6, 0.2, 0);
    P(fx.slap(fx.woodModes(190, 0.8), { amp: 0.8, width: 0.004, skin: 0.5 }), T.stand[0] - 0.08, 0.24, -0.2);
    P(fx.slap(fx.woodModes(205, 0.8), { amp: 0.8, width: 0.004, skin: 0.5 }), T.stand[0] - 0.02, 0.22, 0.2);
    breath(T.stand[0] - 0.05, 0.35, 0.3, { inhale: true });
    breath(T.stand[0] + 0.4, 1.6, 0.5, { voice: 0.38, f0: 108, env: (u) => Math.min(1, u / 0.1) * (0.85 + 0.15 * Math.sin(u * 22)) * (1 - Math.pow(u, 3)) });
    rustle(T.stand[0] + 0.3, 2.2, 0.24, 0, { density: 300 });
    P(fx.woodStep({ weight: 0.35, scuff: 0.6 }), T.stand[0] + 0.5, 0.18, -0.1); P(fx.woodStep({ weight: 0.3, scuff: 0.5 }), T.stand[0] + 0.62, 0.16, 0.1);
    breath(T.stand[1] - 0.6, 0.9, 0.42, { voice: 0.14, f0: 104 });
    breathing(T.upCut + 0.4, T.heart - 0.2, 0.26, 1.1);
    // the climber on the stairs (her breath, her clothes, a little moan of effort at each step up)
    for (const h of this._landings(C.climbPlan, T.heart - 3.5, T.s7)) { breath(h.t0 - 0.5, 0.5, 0.16, { voice: 0.18, f0: 190 }, -0.35); rustle(h.t0 - 0.4, 0.4, 0.08, -0.35); }
    breathing(T.chest - 0.4, T.s7 - 0.4, 0.14, 1.0, -0.35, 195);
    rustle(T.chest - 0.2, 0.5, 0.12, -0.35);
    // ---- S7: his walk (heavy steps are in sfx), his breathing building; the first step: a grunt; the second: a held
    //      breath, the foot hesitates, comes back down; he stops and breathes hard, his hand squeezing the rail
    breathing(T.s7, T.step1[0] - 0.4, 0.3, 1.0, 0.1);
    rustle(T.rail - 0.3, 0.5, 0.18, 0.1);
    P(fx.slap([[620, 0.012, 0.6], [1180, 0.008, 0.3]], { amp: 0.6, width: 0.003, skin: 0.8, len: 0.15 }), T.rail, 0.3, 0.15);   // palm on the wooden rail
    breath(T.step1[0] - 0.35, 0.3, 0.34, { inhale: true });
    breath(T.step1[0] + 0.1, 1.5, 0.62, { voice: 0.42, f0: 104, env: (u) => Math.min(1, u / 0.1) * (0.85 + 0.15 * Math.sin(u * 22)) * (1 - Math.pow(u, 3)) });
    rustle(T.step1[0], 1.4, 0.26, 0, { density: 320 });
    breath(T.step1[1] + 0.1, 0.6, 0.4, { voice: 0.1, f0: 104 });
    breath(T.step2[0] - 0.3, 0.3, 0.36, { inhale: true });
    breath(T.step2[0], 0.9, 0.34, { voice: 0.3, f0: 110, nasal: true, env: (u) => Math.min(1, u / 0.15) * (1 - Math.pow(u, 2)) });
    rustle(T.step2[0], 1.0, 0.2, 0);
    breath(T.back[1] - 0.1, 1.3, 0.55, { voice: 0.12, f0: 100, env: (u) => Math.min(1, u / 0.06) * Math.pow(1 - u, 1.5) });
    breathing(T.back[1] + 1.2, T.out - 0.3, 0.36, 0.95);
    P(fx.creak(0.6, [[640, 0.01, 1], [1300, 0.007, 0.5]], { rate: [40, 90] }), T.handCU + 0.4, 0.14, 0.1);   // the grip tightens on the rail
    // ---- S8: outside. The shopper's dips (bag crackle, a scuff, a gasp); the bench man's breathing; the cyclist's lift
    const dips = [T.out + 1.5, T.carry + 0.6, T.half + 0.5, T.s9b + 1.2];
    dips.forEach((d) => {
      P(fx.rustle(0.6, { density: 1400, rub: 0.15, lo: 2000, hi: 9000, grain: 0.0025, peak: 4200 }), d, 0.12, -0.3);
      P(fx.step({ weight: 0.2, scuff: 0.8 }), d + 0.08, 0.1, -0.3);
      breath(d + 0.03, 0.32, 0.15, { inhale: true }, -0.3);
      breath(d + 0.75, 0.6, 0.12, { voice: 0.2, f0: 205 }, -0.3);
    });
    breathing(T.out + 0.3, T.carCU - 0.2, 0.08, 1.6, 0.4, 98);
    const L2 = T.lift2;
    breath(L2[0] - 0.3, 0.3, 0.3, { inhale: true }, 0.2);
    breath(L2[0] + 0.25, 1.6, 0.46, { voice: 0.36, f0: 200, env: (u) => Math.min(1, u / 0.1) * (1 - Math.pow(u, 3)) }, 0.2);
    rustle(L2[0], 1.8, 0.18, 0.2);
    breath(L2[1] - 0.2, 0.8, 0.3, { voice: 0.1, f0: 195 }, 0.2);
    // ---- S9: the ramp. Her footsteps are in sfx; here her breath (harder halfway, the stop) and her jacket
    breathing(T.ramp[0] + 0.3, T.ramp[1] + 1.5, 0.28, 0.9, 0.1, 200);
    rustle(T.s9 - 0.5, T.ramp[1] - T.s9 + 0.5, 0.1, 0.1, { density: 120 });
    // him at the edge of the square: one long breath out
    breath(T.s9c + 1.3, 1.4, 0.3, { voice: 0.06, f0: 104, env: (u) => Math.min(1, u / 0.08) * Math.pow(1 - u, 1.4) });
    // ---- S10: the engineer's jacket, his torch click (sfx), a long breath; the hero's breathing under the last line
    rustle(T.eng - 0.2, 0.6, 0.12, -0.4); breath(T.gaugeUp[1] - 0.4, 1.0, 0.16, { voice: 0.08, f0: 100 }, -0.4);
    breathing(T.back10, T.s11, 0.12, 1.4);
    // ---- S11: the help. Her bag set down, both hands, the pull (two strained breaths), the jogger's gasp, a relieved laugh-breath
    const H = T.help;
    rustle(H[0] - 0.8, 0.8, 0.18, -0.3);
    breath(H[0] + 0.5, 0.35, 0.3, { inhale: true }, -0.3);
    breath(H[0] + 0.85, 1.6, 0.48, { voice: 0.36, f0: 200, env: (u) => Math.min(1, u / 0.1) * (1 - Math.pow(u, 3)) }, -0.35);
    breath(H[0] + 1.1, 1.8, 0.44, { voice: 0.32, f0: 225, env: (u) => Math.min(1, u / 0.1) * (1 - Math.pow(u, 2.5)) }, -0.2);
    rustle(H[0] + 0.7, 2.6, 0.24, -0.3, { density: 320 });
    P(fx.step({ weight: 0.45, scuff: 0.6 }), H[0] + 3.0, 0.24, -0.25); P(fx.step({ weight: 0.4, scuff: 0.3 }), H[0] + 3.4, 0.2, -0.3);
    for (const d of [0, 0.22, 0.4]) breath(H[1] - 0.6 + d, 0.18, 0.2, { voice: 0.25, f0: 230 }, -0.3);
    breathing(H[1] + 0.5, T.s12, 0.14, 1.3, -0.3, 210);
    breathing(T.s12, T.end - 1.0, 0.08, 1.6);
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
  // every event is peak-normalised (`vol` = its peak in the stem); the ball impacts share one scale so the 2 g ball stays
  // louder by its real impact speed (√2 → +3 dB)
  _sfx(ctx, dest) {
    const fx = new GbFx(ctx, CONFIG.seed + 401), r = fx.r, sr = fx.sr, T = GB, C = this.app.cast;
    const bus = this._withRooms(ctx, fx, dest, 0.22, 0.1);
    const P = (x, t, vol, pan = 0, o = {}) => fx.play(x, t, bus, Object.assign({ vol, pan, norm: true }, o));
    const chairModes = () => [[r.range(290, 340), 0.012, 1], [r.range(600, 680), 0.009, 0.8], [r.range(1100, 1250), 0.006, 0.5], [r.range(2000, 2300), 0.004, 0.3]];
    const stairModes = () => [[r.range(140, 175), 0.022, 1], [r.range(360, 420), 0.014, 0.6], [r.range(720, 840), 0.009, 0.35]];
    // ---- THE DOUBLING: no boom. The whole room drops onto its supports at once
    { const y = fx.arr(0.6);
      for (let i = 0; i < y.length; i++) { const t = i / sr; y[i] = Math.sin(2 * Math.PI * (48 * t + 47 * 0.08 * (1 - Math.exp(-t / 0.08)))) * Math.exp(-t / 0.13) * Math.min(1, t / 0.006); }
      GBX.bq(y, 'hp', 40, 0.7, sr);
      P(y, T.g, 0.32, 0); }
    P(fx.creak(1.1, [[140, 0.02, 1], [330, 0.014, 0.7], [610, 0.01, 0.4]], { rate: [12, 32], env: (u) => Math.exp(-u * 2.5) * Math.min(1, u * 12) }), T.g + 0.03, 0.22, 0);
    for (let k = 0; k < 16; k++) {
      const t = T.g + r.range(0.004, 0.09), pan = r.range(-0.85, 0.85), v = r.range(0.05, 0.11), cm = fx.cupModes(r.range(0.92, 1.1)).concat(fx.saucerModes(r.range(0.92, 1.1)));
      P(fx.hit(cm, { width: 0.0003, amp: 1, extra: [[r.range(0.03, 0.07), 0.0003, 0.35], [r.range(0.09, 0.14), 0.0003, 0.12]] }), t, v, pan);
    }
    for (let k = 0; k < 6; k++) P(fx.hit(fx.metalModes(r.range(2800, 4200), 0.25), { width: 0.0002, extra: [[r.range(0.02, 0.05), 0.0002, 0.4]] }), T.g + r.range(0.01, 0.06), 0.07, r.range(-0.7, 0.7));
    for (const [d, pan] of [[0.03, -0.45], [0.05, 0.1], [0.07, 0.5]]) {
      P(fx.hit(fx.metalModes(r.range(780, 1050), 0.6), { width: 0.0008, amp: 1 }), T.g + d, 0.12, pan);
      for (let k = 0; k < 5; k++) P(fx.hit([[r.range(3000, 6000), 0.02, 1], [r.range(6500, 9000), 0.012, 0.5]], { width: 0.0001 }), T.g + d + r.range(0.0, 0.25), 0.04, pan);
    }
    { const y = fx.hit(fx.glassModes(), { width: 0.002, amp: 1 });
      for (let k = 1; k < 9; k++) GBX.strike(y, Math.round(k * 0.022 * sr), Math.round(0.0004 * sr), 0.5 * Math.exp(-k * 0.35), [[2400, 0.006, 1], [3700, 0.004, 0.6]], sr);
      P(y, T.g + 0.02, 0.14, -0.6); }
    for (let k = 0; k < 4; k++) P(fx.creak(r.range(0.15, 0.35), chairModes(), { rate: [30, 90] }), T.g + r.range(0.02, 0.3), r.range(0.1, 0.16), r.range(-0.8, 0.8));
    P(fx.creak(0.55, chairModes(), { rate: [25, 60], env: (u) => Math.exp(-u * 3) * Math.min(1, u * 15) }), T.g + 0.04, 0.26, 0);
    P(fx.creak(0.5, [[180, 0.015, 1], [410, 0.01, 0.7], [800, 0.007, 0.4]], { rate: [20, 50] }), T.g + 0.08, 0.14, 0.55);
    P(fx.rustle(0.9, { density: 600, rub: 0.2, lo: 1500, hi: 7000, grain: 0.004, env: (u) => Math.exp(-u * 3) * Math.min(1, u * 20) }), T.g + 0.05, 0.1, -0.7);
    for (let k = 0; k < 5; k++) P(fx.hit(fx.cupModes(r.range(0.95, 1.05)), { width: 0.0002, amp: 1 }), T.g + r.range(0.3, 0.8), r.range(0.05, 0.09), r.range(-0.7, 0.7));
    for (const [d, pan] of [[0.95, 0.4], [1.6, -0.5], [2.2, 0.2]]) P(fx.creak(r.range(0.35, 0.6), [[r.range(130, 160), 0.02, 1], [r.range(300, 360), 0.014, 0.7], [r.range(560, 660), 0.01, 0.4]], { rate: [10, 26] }), T.g + d, 0.12, pan);
    // ---- THE CUP: the coffee lurches in his sinking hand; the first set-down (a clack, too fast); the struggle; ★ set-down
    const cupset = fx.cupModes(), saucer = fx.saucerModes(), both = cupset.concat(saucer), cupPan = -0.1;
    P(fx.liquid(1.6, (t) => 0.9 * Math.exp(-t * 2.5) * Math.abs(Math.sin(t * 14))), T.g, 0.08, cupPan);
    { const y = fx.hit(both, { width: 0.0004, amp: 1, noise: 0.12, nhp: 2500, extra: [[0.06, 0.0003, 0.35], [0.11, 0.0003, 0.12]] }); GBX.strike(y, 0, Math.round(0.0025 * sr), 0.6, fx.woodModes(185), sr); P(y, T.cupDown1, 0.42, cupPan); }
    P(fx.hit(cupset, { width: 0.00035, amp: 0.5, noise: 0.08, nhp: 3000 }), T.grip, 0.2, cupPan);
    for (let k = 0; k < 5; k++) P(fx.hit(both, { width: 0.00025, amp: 1 }), T.lift + 0.02 + k * (2 * Math.PI / 90), 0.12 + 0.05 * k, cupPan);
    P(fx.creak(0.16, cupset.map(([f, tau, a]) => [f, tau * 0.25, a]), { rate: [700, 1150], env: (u) => Math.sin(Math.PI * u) }), T.lift + 0.33, 0.16, cupPan);
    { const y = fx.hit(saucer, { width: 0.0005, amp: 1 }); GBX.strike(y, 0, Math.round(0.002 * sr), 0.5, fx.woodModes(210), sr); P(y, T.lift + 0.37, 0.3, cupPan); }
    P(fx.liquid(T.down - T.lift + 1.2, (t) => { const tt = t + T.lift + 0.35, h = tt < T.down ? 0.45 * Math.abs(Math.sin(tt * 9)) * Math.min(1, (tt - T.lift - 0.35) * 2) : 0; return Math.min(1, h + (tt > T.down ? 0.9 * Math.exp(-(tt - T.down) * 3) * Math.abs(Math.sin((tt - T.down) * 15)) : 0)); }), T.lift + 0.35, 0.1, cupPan);
    P(fx.creak(0.8, chairModes(), { rate: [20, 55] }), T.lift + 0.15, 0.22, 0.05);
    P(fx.creak(1.1, chairModes(), { rate: [15, 40] }), T.top - 0.1, 0.17, 0.05);
    P(fx.creak(1.2, chairModes(), { rate: [12, 35] }), T.lower + 0.3, 0.15, 0.05);
    { const y = fx.hit(both, { width: 0.00045, amp: 1, noise: 0.15, nhp: 2500, extra: [[0.0785, 0.0003, 0.42], [0.157, 0.0003, 0.16], [0.236, 0.0003, 0.06]] });
      GBX.strike(y, 0, Math.round(0.0025 * sr), 0.8, fx.woodModes(185), sr);
      for (let i = 0; i < 0.25 * sr; i++) { const t = i / sr; y[i] += 0.22 * Math.sin(2 * Math.PI * 108 * t) * Math.exp(-t / 0.035) * Math.min(1, t / 0.002); }
      P(y, T.down, 0.6, cupPan); }
    P(fx.hit(cupset, { width: 0.0003, amp: 0.25 }), T.letGo, 0.1, cupPan);
    P(fx.creak(0.7, chairModes(), { rate: [20, 50] }), T.letGo + 0.2, 0.24, 0.05);
    // ---- THE HOLOGRAM: a soft shimmer as the twin appears; a tone on "mass"; the weight arrow's rising hum on "twice"
    P(fx.shimmer(1.4, 880), T.holo - 0.3, 0.12, 0.3);
    P(fx.shimmer(0.7, 1320, { skew: 0.3 }), T.mass - 0.05, 0.08, -0.2);
    { const d = T.twice[1] + 0.2 - (T.twice[0] - 0.4), y = fx.arr(d + 0.3);
      for (let i = 0; i < y.length; i++) { const t = i / sr, u = Math.min(1, t / d), f = 220 * Math.pow(2, u); y[i] = (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t)) * Math.sin(Math.PI * Math.min(1, t / (d + 0.3))) ; }
      GBX.bq(y, 'lp', 1500, 0.7, sr); P(y, T.twice[0] - 0.4, 0.1, 0.3); }
    // ---- THE DROP: the clamps; each ball's impacts at the measured times (fall, then bounces with the same restitution: the
    //      2 g ball's rhythm is √2 faster); the replay re-synthesises the same hits 4× slower and lower; then real time
    const lanes = this.app.drop.lanes.map((o) => ({ hits: gbBallPath(o.L.g, 5).hits, pan: o.L.side * 0.38 }));
    const vMax = Math.max(...lanes.map((L) => L.hits[0].v));
    for (const L of lanes) P(fx.clamp(), T.drop, 0.14, L.pan);
    const sl = (te) => T.replay + (te - T.replayFrom) / T.replayRate;
    for (const L of lanes) for (const h of L.hits) {
      const v = 0.95 * h.v / vMax;
      if (T.drop + h.t < T.replay - 0.05) P(fx.ballHit({ v: h.v }), T.drop + h.t, v, L.pan, { stop: T.replay, fade: 0.08 });
      if (h.t >= T.replayFrom && h.t < T.replayTo) P(fx.ballHit({ v: h.v, slow: 3, pitch: 0.6 }), sl(h.t), 0.8 * h.v / vMax, L.pan);
      if (h.t >= T.replayTo) P(fx.ballHit({ v: h.v }), T.replayEnd + (h.t - T.replayTo), v, L.pan);
    }
    for (const L of lanes) P(fx.clamp({ slow: 4, pitch: 0.6 }), sl(0), 0.18, L.pan);
    { const y = fx.arr(0.5); for (let i = 0; i < y.length; i++) { const t = i / sr; y[i] = Math.sin(2 * Math.PI * 2100 * t) * Math.exp(-t / 0.08) * 0.5; } P(y, T.replay - 0.02, 0.06, 0.6); }   // the replay "tick"
    // ---- S6: the chair slides back over the boards as he pushes up; the table takes his hands; the climber's treads
    P(fx.creak(0.8, [[r.range(260, 300), 0.012, 1], [r.range(520, 600), 0.009, 0.7], [r.range(1000, 1150), 0.006, 0.4]], { rate: [60, 140], env: (u) => Math.sin(Math.PI * u) }), T.stand[0] - 0.55, 0.36, 0.1);
    P(fx.creak(0.9, [[120, 0.02, 1], [260, 0.014, 0.6], [480, 0.01, 0.35]], { rate: [15, 40] }), T.stand[0], 0.24, 0);   // the table under his weight
    P(fx.creak(1.2, chairModes(), { rate: [14, 40] }), T.s6 + 1.0, 0.12, 0.05);
    for (const h of this._landings(C.climbPlan, T.heart - 3.5, T.s7)) P(fx.woodStep({ weight: 0.55, creak: 0.5, f: r.range(110, 140) }), h.t0, 0.3, -0.35);
    // ---- S7: his heavy steps on the boards; the first tread groans under him; the second step's foot scrapes and lands back
    for (const h of this._landings(C.heroPlan, T.walk[0], T.step1[0] + 0.2)) P(fx.woodStep({ weight: 0.9, scuff: 0.25, creak: 0.2, body: 66 }), h.t0, 0.55, 0.1);
    for (const h of this._landings(C.heroPlan, T.step1[0] + 0.2, T.step1[1] + 1)) P(fx.woodStep({ weight: 1.0, creak: 0.9, body: 62, f: 105 }), h.t0, 0.75, 0.05);
    P(fx.creak(1.0, stairModes(), { rate: [10, 30], env: (u) => Math.exp(-u * 2) * Math.min(1, u * 10) }), T.step1[0] + 0.75, 0.4, 0.05);
    P(fx.creak(0.7, stairModes(), { rate: [14, 34] }), T.step2[0] + 0.1, 0.22, 0.05);
    P(fx.rustle(0.3, { density: 500, rub: 0.5, lo: 800, hi: 3500, grain: 0.006 }), T.step2[0] + 0.25, 0.16, 0.05);
    P(fx.woodStep({ weight: 0.7, creak: 0.5, body: 64, f: 108 }), T.back[1] - 0.15, 0.5, 0.05);
    P(fx.creak(1.3, [[r.range(580, 640), 0.012, 1], [r.range(1150, 1250), 0.008, 0.5]], { rate: [25, 60] }), T.rail + 0.1, 0.12, 0.15);   // the rail
    P(fx.creak(1.0, stairModes(), { rate: [12, 30] }), T.handCU + 0.8, 0.18, 0.05);
    // ---- S8: the car is quiet (it sank at the change); the bicycle comes out of the rack: the frame knocks the hoop, the
    //      chain rattles, the basket's load shifts, then it is set down
    const L2 = T.lift2;
    P(fx.hit(fx.metalModes(r.range(600, 700), 0.4), { width: 0.0008, amp: 1 }), L2[0] + 0.45, 0.3, 0.3);
    for (let k = 0; k < 18; k++) P(fx.hit(fx.metalModes(r.range(1800, 3200), 0.12), { width: 0.0002 }), L2[0] + 0.4 + k * r.range(0.04, 0.09), r.range(0.04, 0.09), 0.3);
    P(fx.rustle(0.6, { density: 1200, rub: 0.2, lo: 1500, hi: 8000, grain: 0.003 }), L2[0] + 0.5, 0.12, 0.35);
    P(fx.hit(fx.panelModes(0.4).concat(fx.metalModes(480, 0.3)), { width: 0.004, amp: 1 }), L2[1] + 0.35, 0.36, 0.3);   // the bike set down: tyres and frame
    for (let k = 0; k < 8; k++) P(fx.hit(fx.metalModes(r.range(1800, 3200), 0.12), { width: 0.0002 }), L2[1] + 0.38 + k * 0.05, 0.05, 0.3);
    // ---- S9: the ramp. Her steps on stone (heavy, short); the tyres crunching grit; the freewheel ticking with the wheel
    for (const h of this._landings(C.rampPlan, T.ramp[0], T.ramp[1] + 1)) P(fx.step({ weight: 0.7, scuff: 0.3 }), h.t0, 0.32, 0.1);
    { const t0 = T.ramp[0], d = T.ramp[1] - t0 + 0.5, spd = (t) => Math.abs(C.rampZ(t + 0.05) - C.rampZ(t - 0.05)) / 0.1;
      const roll = fx.rustle(d, { density: 900, rub: 0.35, lo: 300, hi: 2600, grain: 0.004, env: (u) => Math.min(1, spd(t0 + u * d) / 0.7) });
      P(roll, t0, 0.14, 0.15);
      let ang = 0; const tk = fx.hit([[4200, 0.004, 1], [6100, 0.003, 0.5]], { width: 0.0001 });
      for (let t = t0; t < t0 + d; t += 0.005) { ang += spd(t) * 0.005 / 0.34; if (ang > Math.PI * 2 / 24) { ang -= Math.PI * 2 / 24; P(tk, t, 0.06, 0.2, { norm: false, vol: 0.05 }); } }
    }
    // ---- S10: the balcony bracket groans faintly under its doubled load; the engineer's torch click and the tablet's beeps
    P(fx.hit([[2400, 0.01, 1], [3900, 0.006, 0.5]], { width: 0.0002 }), T.eng + 0.1, 0.1, -0.4);
    P(fx.creak(2.6, [[r.range(70, 90), 0.05, 1], [r.range(180, 210), 0.03, 0.6], [r.range(420, 470), 0.02, 0.3]], { rate: [6, 16], env: (u) => Math.sin(Math.PI * u) }), T.gaugeUp[0], 0.22, -0.45);
    P(fx.hit(fx.metalModes(r.range(210, 250), 1.0), { width: 0.004, amp: 1 }), T.gaugeUp[0] + 2.4, 0.16, -0.45);
    P(fx.beep(1480, 0.07), T.gaugeUp[1] - 0.2, 0.06, -0.4); P(fx.beep(1480, 0.07), T.gaugeUp[1] - 0.05, 0.06, -0.4);
    // ---- S11: the shopping bag set down on the paving
    P(fx.hit(fx.stoneModes(1.2), { width: 0.006, amp: 1 }), T.help[0] - 0.75, 0.16, -0.3);
    P(fx.rustle(0.5, { density: 1400, rub: 0.15, lo: 2000, hi: 9000, grain: 0.0025, peak: 4200 }), T.help[0] - 0.78, 0.1, -0.3);
  }
}
