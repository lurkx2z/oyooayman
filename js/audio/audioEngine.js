/* =====================================================================
   AUDIO ENGINE — shared by every film. A film's soundtrack is synthesised
   with the Web Audio API and rendered once, offline, into a single stereo
   buffer that is perfectly in sync with the timeline: playing from any time t
   just starts that buffer at offset t. The buffer can be exported as a WAV.

   A film subclasses AudioEngine and implements _build(ctx), scheduling every
   cue at absolute timeline times (SoundKit has the building blocks).
   The listener follows the camera's keyframed path (SCRIPT.camera x/z/yaw),
   which _spatial() uses for distance, pan and Doppler.
   ===================================================================== */

class AudioEngine {
  constructor(tl) {
    this.tl = tl;
    this.ctx = null;
    this.buffer = null;
    this.muted = false;
    this.playing = false;
    this.rendering = null;
    this.sampleRate = 48000;
    // listener path = the camera's keyframed path
    const C = SCRIPT.camera;
    this.cx = new Track(C.x); this.cz = new Track(C.z); this.cyaw = new Track(C.yaw);
  }

  /* -------------------- public API -------------------- */
  prepare() {
    if (!this.rendering) this.rendering = this.renderOffline().then((b) => { this.buffer = b; return b; }).catch((e) => { console.error('audio render failed', e); });
    return this.rendering;
  }

  ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: this.sampleRate });
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  get ready() { return !!this.buffer && !!this.ctx; }

  play(fromT) {
    this.stop();
    if (!this.buffer || !this.ctx) return false;
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffer;
    src.connect(this.master);
    const when = this.ctx.currentTime + 0.03;
    const off = MathX.clamp(fromT, 0, this.buffer.duration - 0.01);
    src.start(when, off);
    this.src = src;
    this.startCtx = when;
    this.startT = off;
    this.playing = true;
    return true;
  }

  stop() {
    if (this.src) { try { this.src.stop(); } catch (e) { /* already stopped */ } this.src.disconnect(); this.src = null; }
    this.playing = false;
  }

  // timeline time according to the audio clock (keeps picture locked to sound)
  clockTime() {
    if (!this.playing || !this.ctx) return null;
    const lat = this.ctx.outputLatency || this.ctx.baseLatency || 0;
    return this.startT + Math.max(0, this.ctx.currentTime - this.startCtx - lat);
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.02);
  }

  async exportWav() {
    const buf = this.buffer || (await this.prepare());
    const blob = AudioManager.encodeWav(buf);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = this.wavName || 'soundtrack.wav';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  /* -------------------- offline render -------------------- */
  async renderOffline() {
    const dur = CONFIG.duration + 1.5;
    const ctx = new OfflineAudioContext(2, Math.ceil(dur * this.sampleRate), this.sampleRate);
    this._build(ctx);
    return ctx.startRendering();
  }

  // override: schedule the whole soundtrack into the offline context
  _build(ctx) {}

  /* listener-relative gain/pan/doppler for a moving source */
  _spatial(posFn, t0, t1, step = 1 / 30, ref = 6) {
    const pts = [];
    for (let t = t0; t <= t1 + 1e-6; t += step) {
      const p = posFn(t), lx = this.cx.value(t), lz = this.cz.value(t);
      const yaw = MathX.deg(this.cyaw.value(t));
      const dx = p.x - lx, dz = p.z - lz, d = Math.max(0.5, Math.hypot(dx, dz));
      // listener right vector for yaw (0 = facing -Z)
      const rx = Math.cos(yaw), rz = -Math.sin(yaw);
      const pan = MathX.clamp((dx * rx + dz * rz) / d, -1, 1) * 0.85;
      const p2 = posFn(t + 0.02), d2 = Math.hypot(p2.x - this.cx.value(t + 0.02), p2.z - this.cz.value(t + 0.02));
      const vr = (d2 - d) / 0.02;
      pts.push({ t, gain: ref / (ref + d), pan, dop: 343 / (343 + vr), d });
    }
    return pts;
  }

  _applySpatial(pts, gainParam, panParam, freqParams = [], scale = 1, gainFn = null) {
    pts.forEach((p, i) => {
      const g = Math.max(0.00001, p.gain * scale * (gainFn ? gainFn(p.t) : 1));
      if (i === 0) { gainParam.setValueAtTime(g, p.t); panParam.setValueAtTime(p.pan, p.t); }
      else { gainParam.linearRampToValueAtTime(g, p.t); panParam.linearRampToValueAtTime(p.pan, p.t); }
      for (const [param, base] of freqParams) {
        const v = (typeof base === 'function' ? base(p.t) : base) * p.dop;
        if (i === 0) param.setValueAtTime(v, p.t); else param.linearRampToValueAtTime(v, p.t);
      }
    });
  }

  /* -------------------- WAV encoder -------------------- */
  static encodeWav(buf) {
    const ch = buf.numberOfChannels, sr = buf.sampleRate, len = buf.length;
    const data = new DataView(new ArrayBuffer(44 + len * ch * 2));
    const W = (o, s) => { for (let i = 0; i < s.length; i++) data.setUint8(o + i, s.charCodeAt(i)); };
    W(0, 'RIFF'); data.setUint32(4, 36 + len * ch * 2, true); W(8, 'WAVE'); W(12, 'fmt ');
    data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, ch, true);
    data.setUint32(24, sr, true); data.setUint32(28, sr * ch * 2, true); data.setUint16(32, ch * 2, true); data.setUint16(34, 16, true);
    W(36, 'data'); data.setUint32(40, len * ch * 2, true);
    const chans = []; for (let c = 0; c < ch; c++) chans.push(buf.getChannelData(c));
    let o = 44;
    for (let i = 0; i < len; i++) for (let c = 0; c < ch; c++) { const s = Math.max(-1, Math.min(1, chans[c][i])); data.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2; }
    return new Blob([data], { type: 'audio/wav' });
  }
}


/* =====================================================================
   SoundKit — small synth building blocks (all scheduled at absolute t)
   ===================================================================== */
class SoundKit {
  constructor(ctx, seed) {
    this.ctx = ctx;
    this.rng = new RNG(seed);
    this._noise = {};
  }

  buffer(type) {
    if (this._noise[type]) return this._noise[type];
    const ctx = this.ctx, len = ctx.sampleRate * 3, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    const r = new RNG(type.length * 977 + 3);
    let b0 = 0, b1 = 0, b2 = 0, last = 0;
    for (let i = 0; i < len; i++) {
      const w = r.next() * 2 - 1;
      if (type === 'white') d[i] = w;
      else if (type === 'pink') { b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2; }
      else { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    }
    this._noise[type] = b;
    return b;
  }

  noise(type, t0, t1) {
    const s = this.ctx.createBufferSource();
    s.buffer = this.buffer(type); s.loop = true;
    s.start(t0, this.rng.next() * 2.5); s.stop(t1);
    return s;
  }

  filter(type, f, q = 1) { const b = this.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; }

  env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  panned(dest, pan) { const p = this.ctx.createStereoPanner(); p.pan.value = pan; p.connect(dest); return p; }

  reverb(sec) {
    const ctx = this.ctx, len = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, len, ctx.sampleRate);
    const r = new RNG(77);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      let lp = 0;
      for (let i = 0; i < len; i++) { lp = lp * 0.6 + (r.next() * 2 - 1) * 0.4; d[i] = lp * Math.pow(1 - i / len, 2.6); }
    }
    const cv = ctx.createConvolver(); cv.buffer = b;
    return cv;
  }

  crackleBuffer(sec, rate) {
    const ctx = this.ctx, len = ctx.sampleRate * sec, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    const r = new RNG(31);
    for (let i = 0; i < len; i++) {
      if (r.next() < rate / ctx.sampleRate) {
        const amp = r.range(0.2, 1), L = Math.floor(r.range(20, 220));
        for (let k = 0; k < L && i + k < len; k++) d[i + k] += (r.next() * 2 - 1) * amp * Math.exp(-k / (L * 0.25));
      }
    }
    return b;
  }

  chirp(t, f, vol, pan, dest, frantic) {
    const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    const d = frantic ? 0.05 : 0.07;
    o.frequency.setValueAtTime(f * 0.85, t); o.frequency.exponentialRampToValueAtTime(f * (frantic ? 1.5 : 1.25), t + d * 0.6); o.frequency.exponentialRampToValueAtTime(f * 0.95, t + d);
    this.env(g, t, 0.008, vol, d);
    o.connect(g); g.connect(this.panned(dest, pan)); o.start(t); o.stop(t + d + 0.05);
  }

  flap(t, pan, vol, dest) {
    const n = this.noise('white', t, t + 0.4), bp = this.filter('bandpass', 900, 1.2), g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    for (let k = 0; k < 4; k++) { g.gain.exponentialRampToValueAtTime(vol, t + k * 0.08 + 0.02); g.gain.exponentialRampToValueAtTime(0.0002, t + k * 0.08 + 0.07); }
    n.connect(bp); bp.connect(g); g.connect(this.panned(dest, pan));
  }

  step(t, vol, pan, dest) {
    const n = this.noise('white', t, t + 0.12), lp = this.filter('lowpass', 520 + this.rng.range(-80, 80), 0.8), g = this.ctx.createGain();
    this.env(g, t, 0.004, vol, 0.08);
    n.connect(lp); lp.connect(g); g.connect(this.panned(dest, pan));
    const o = this.ctx.createOscillator(), og = this.ctx.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.06);
    this.env(og, t, 0.002, vol * 0.6, 0.06); o.connect(og); og.connect(dest); o.start(t); o.stop(t + 0.1);
  }

  horn(t, f1, f2, vol, pan, dest) {
    const ctx = this.ctx, g = ctx.createGain(), lp = this.filter('lowpass', 1400, 0.7);
    for (const f of [f1, f2]) { const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = f; o.connect(lp); o.start(t); o.stop(t + 0.5); }
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.03); g.gain.setValueAtTime(vol, t + 0.38); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.48);
    lp.connect(g); g.connect(this.panned(dest, pan));
  }

  backfire(t, vol, dest, sharp) {
    const n = this.noise('white', t, t + 0.12), bp = this.filter('lowpass', sharp ? 1800 : 600, 1.2), g = this.ctx.createGain();
    this.env(g, t, 0.002, vol, 0.07);
    n.connect(bp); bp.connect(g); g.connect(dest);
  }

  hiss(t, dur, vol, pan, dest) {
    const n = this.noise('white', t, t + dur + 0.1), hp = this.filter('highpass', 2600, 0.7), g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(vol * 0.4, t + dur * 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(hp); hp.connect(g); g.connect(this.panned(dest, pan));
  }

  whump(t, vol, pan, dest) {
    const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.3);
    this.env(g, t, 0.01, vol, 0.32); o.connect(g); g.connect(this.panned(dest, pan)); o.start(t); o.stop(t + 0.4);
    const n = this.noise('pink', t, t + 0.4), lp = this.filter('lowpass', 700, 0.7), ng = ctx.createGain();
    this.env(ng, t, 0.01, vol * 0.8, 0.28); n.connect(lp); lp.connect(ng); ng.connect(this.panned(dest, pan));
  }

  tick(t, f, vol, dest) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = 'square'; o.frequency.value = f;
    this.env(g, t, 0.001, vol, 0.03); o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.05);
  }

  boom(t, vol, dest, rev) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(62, t); o.frequency.exponentialRampToValueAtTime(26, t + 1.4);
    this.env(g, t, 0.01, vol, 1.6); o.connect(g); g.connect(dest); o.start(t); o.stop(t + 1.8);
    const n = this.noise('brown', t, t + 1.2), lp = this.filter('lowpass', 380, 0.6), ng = ctx.createGain();
    this.env(ng, t, 0.005, vol * 0.9, 0.9); n.connect(lp); lp.connect(ng); ng.connect(dest);
    const s = ctx.createGain(); s.gain.value = 0.5; ng.connect(s); s.connect(rev);
  }

  thump(t, vol, dest) {
    // eardrum being pushed out: a deep, muffled internal thud
    const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain(), lp = this.filter('lowpass', 160, 0.7);
    o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.45);
    this.env(g, t, 0.006, vol, 0.55); o.connect(lp); lp.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.7);
    const n = this.noise('brown', t, t + 0.4), nl = this.filter('lowpass', 220, 0.6), ng = ctx.createGain();
    this.env(ng, t, 0.004, vol * 0.5, 0.3); n.connect(nl); nl.connect(ng); ng.connect(dest);
  }

  clunk(t, vol, pan, dest) {
    const ctx = this.ctx, P = this.panned(dest, pan);
    const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.08);
    this.env(g, t, 0.002, vol, 0.12); o.connect(g); g.connect(P); o.start(t); o.stop(t + 0.18);
    const n = this.noise('white', t, t + 0.06), bp = this.filter('bandpass', 1800, 1.5), ng = ctx.createGain();
    this.env(ng, t, 0.001, vol * 0.5, 0.03); n.connect(bp); bp.connect(ng); ng.connect(P);
  }

  click(t, vol, pan, dest) {
    const n = this.noise('white', t, t + 0.04), bp = this.filter('bandpass', 4200, 2), g = this.ctx.createGain();
    this.env(g, t, 0.001, vol, 0.018); n.connect(bp); bp.connect(g); g.connect(this.panned(dest, pan));
  }

  pop(t, vol, dest) {
    const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(240, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.05);
    this.env(g, t, 0.002, vol, 0.08); o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.12);
  }

  ring(t, dur, f, vol, dest, rising = false) {
    const ctx = this.ctx, o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = f; o2.frequency.value = f * 1.031;
    g.gain.setValueAtTime(0.0001, t);
    if (rising) { g.gain.exponentialRampToValueAtTime(vol, t + dur); }
    else { g.gain.exponentialRampToValueAtTime(vol, t + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
    o.connect(g); o2.connect(g); g.connect(dest); o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }

  crunch(t, vol, pan, dest, rev) {
    const ctx = this.ctx, P = this.panned(dest, pan);
    const n = this.noise('white', t, t + 0.6), bp = this.filter('bandpass', 900, 0.9), g = ctx.createGain();
    this.env(g, t, 0.003, vol, 0.35); n.connect(bp); bp.connect(g); g.connect(P);
    const s = ctx.createGain(); s.gain.value = 0.6; g.connect(s); s.connect(rev);
    const o = ctx.createOscillator(), og = ctx.createGain(); o.frequency.setValueAtTime(85, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.2);
    this.env(og, t, 0.003, vol * 1.1, 0.25); o.connect(og); og.connect(P); o.start(t); o.stop(t + 0.35);
    // plastic/glass ticks
    for (let k = 0; k < 7; k++) {
      const tt = t + 0.04 + this.rng.range(0, 0.35), f = this.rng.range(2500, 6000);
      const oo = ctx.createOscillator(), gg = ctx.createGain(); oo.frequency.value = f; this.env(gg, tt, 0.001, vol * 0.18, 0.04);
      oo.connect(gg); gg.connect(P); oo.start(tt); oo.stop(tt + 0.06);
    }
  }

  alarm(t0, t1, pts, dest, rev, mgr) {
    const ctx = this.ctx, o = ctx.createOscillator(); o.type = 'square';
    const lp = this.filter('lowpass', 2600, 0.7), g = ctx.createGain(), p = ctx.createStereoPanner(), am = ctx.createGain();
    o.connect(lp); lp.connect(am); am.connect(g); g.connect(p); p.connect(dest);
    const s = ctx.createGain(); s.gain.value = 0.5; p.connect(s); s.connect(rev);
    // pattern: 2.4 s two-tone, 2.4 s fast whoop, repeat
    let t = t0;
    o.frequency.setValueAtTime(900, t0);
    while (t < t1) {
      for (let k = 0; k < 6 && t < t1; k++) { o.frequency.setValueAtTime(k % 2 ? 1180 : 860, t); t += 0.4; }
      for (let k = 0; k < 8 && t < t1; k++) { o.frequency.setValueAtTime(700, t); o.frequency.linearRampToValueAtTime(1500, t + 0.28); t += 0.3; }
    }
    am.gain.setValueAtTime(0.0001, t0); am.gain.exponentialRampToValueAtTime(1, t0 + 0.05);
    mgr._applySpatial(pts, g.gain, p.pan, [], 0.05);
    o.start(t0); o.stop(t1);
  }

  breath(t, dur, inhale, vol, dest) {
    const ctx = this.ctx, n = this.noise('pink', t, t + dur + 0.1);
    const bp = this.filter('bandpass', inhale ? 1300 : 750, 0.9), g = ctx.createGain();
    if (inhale) { bp.frequency.setValueAtTime(900, t); bp.frequency.linearRampToValueAtTime(1600, t + dur); }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + dur * (inhale ? 0.6 : 0.25));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(bp); bp.connect(g); g.connect(dest);
  }

  heart(t, vol, dest) {
    if (vol <= 0.001) return;
    const ctx = this.ctx;
    const beat = (tt, v) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), lp = this.filter('lowpass', 140, 0.8);
      o.frequency.setValueAtTime(64, tt); o.frequency.exponentialRampToValueAtTime(36, tt + 0.12);
      this.env(g, tt, 0.008, v, 0.14); o.connect(lp); lp.connect(g); g.connect(dest); o.start(tt); o.stop(tt + 0.2);
    };
    beat(t, vol); beat(t + 0.17, vol * 0.65);
  }

  tone(t, dur, f, vol, pan, dest, type = 'sine', attack = 0.01, release = null) {
    if (vol <= 0.0005) return;
    const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.setValueAtTime(vol, t + Math.max(attack, dur - (release || dur * 0.3)));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.panned(dest, pan)); o.start(t); o.stop(t + dur + 0.05);
  }

  gasp(t, vol, dest) {
    // a sudden, ragged, involuntary inhale
    const ctx = this.ctx, n = this.noise('pink', t, t + 0.9), bp = this.filter('bandpass', 900, 0.8), g = ctx.createGain();
    bp.frequency.setValueAtTime(700, t); bp.frequency.linearRampToValueAtTime(2200, t + 0.55);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.12); g.gain.setValueAtTime(vol * 0.8, t + 0.45); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
    n.connect(bp); bp.connect(g); g.connect(dest);
  }

  /* ---- music: Karplus-Strong plucked string (guitar / harp / mandolin-ish), cached per pitch ---- */
  pluckBuffer(f, dur = 1.6, bright = 0.5) {
    const key = 'ks' + f.toFixed(2) + bright;
    if (this._noise[key]) return this._noise[key];
    const ctx = this.ctx, sr = ctx.sampleRate, len = Math.floor(sr * dur), b = ctx.createBuffer(1, len, sr), d = b.getChannelData(0);
    const N = Math.max(2, Math.round(sr / f)), buf = new Float32Array(N), r = new RNG(Math.round(f * 13));
    for (let i = 0; i < N; i++) buf[i] = (r.next() * 2 - 1) * (0.6 + 0.4 * Math.sin(i / N * Math.PI));
    let idx = 0, prev = 0;
    const damp = 0.996 - (1 - bright) * 0.006;
    for (let i = 0; i < len; i++) {
      const cur = buf[idx];
      const next = damp * (cur * (0.5 + bright * 0.25) + prev * (0.5 - bright * 0.25));
      prev = cur; buf[idx] = next; d[i] = cur; idx = (idx + 1) % N;
    }
    this._noise[key] = b;
    return b;
  }

  pluck(t, f, vol, pan, dest, dur = 1.6, bright = 0.5) {
    if (vol <= 0.0005) return;
    const s = this.ctx.createBufferSource(), g = this.ctx.createGain();
    s.buffer = this.pluckBuffer(f, dur, bright);
    g.gain.value = vol;
    s.connect(g); g.connect(this.panned(dest, pan)); s.start(t); s.stop(t + dur);
  }

  /* ---- voices (placeholder): formant-synth syllables. Convincing only at a distance / under other sound;
     real recordings are better for close voices. vowel: a e i o u ---- */
  voice(t, f0, dur, vowel, vol, pan, dest, glide = 1.0) {
    if (vol <= 0.0005) return;
    const F = { a: [950, 1550, 3000], e: [600, 2300, 3200], i: [400, 2900, 3600], o: [620, 1000, 2900], u: [420, 900, 2800] }[vowel] || [800, 1500, 3000];
    const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain(), P = this.panned(dest, pan);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * glide, t + dur);
    const vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 5.5 + this.rng.next() * 2; vg.gain.value = f0 * 0.02;
    vib.connect(vg); vg.connect(o.frequency); vib.start(t); vib.stop(t + dur + 0.05);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.03, dur * 0.3));
    g.gain.setValueAtTime(vol, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    for (let k = 0; k < 3; k++) {
      const bp = this.filter('bandpass', F[k] * (1.08 + 0.06 * this.rng.next()), [6, 9, 12][k]), fg = ctx.createGain();
      fg.gain.value = [1.0, 0.55, 0.25][k];
      o.connect(bp); bp.connect(fg); fg.connect(g);
    }
    // breath on the onset (the 'h' of a laugh)
    const n = this.noise('white', t, t + 0.08), nb = this.filter('bandpass', 1800, 0.8), ng = ctx.createGain();
    this.env(ng, t, 0.004, vol * 0.5, 0.05); n.connect(nb); nb.connect(ng); ng.connect(P);
    g.connect(P); o.start(t); o.stop(t + dur + 0.05);
  }

  // a child's laugh: a run of short 'ha' syllables, falling in pitch
  laugh(t, vol, pan, dest, f0 = 480, n = 5) {
    for (let k = 0; k < n; k++) {
      const st = t + k * (0.13 + this.rng.range(-0.015, 0.02)), f = f0 * (1 - k * 0.045) * this.rng.range(0.97, 1.04);
      this.voice(st, f, 0.085 + this.rng.range(0, 0.03), this.rng.chance(0.75) ? 'a' : 'e', vol * (1 - k * 0.1), pan, dest, 0.92);
    }
  }

  // children's chatter / calls: random syllables with lively pitch contours
  chatter(t0, t1, vol, pan, dest, f0 = 420, density = 3.5) {
    let t = t0;
    while (t < t1) {
      const burst = this.rng.int(2, 6), base = f0 * this.rng.range(0.85, 1.2);
      for (let k = 0; k < burst && t < t1; k++) {
        const d = this.rng.range(0.07, 0.2);
        this.voice(t, base * this.rng.range(0.9, 1.15), d, this.rng.pick(['a', 'e', 'i', 'o', 'u', 'a']), vol * this.rng.range(0.5, 1), pan + this.rng.range(-0.15, 0.15), dest, this.rng.range(0.85, 1.2));
        t += d + this.rng.range(0.02, 0.09);
      }
      t += this.rng.range(0.2, 1.2) / (density / 3.5);
    }
  }

  farBoom(t, vol, pan, dest) {
    const ctx = this.ctx, n = this.noise('brown', t, t + 2), lp = this.filter('lowpass', 160, 0.7), g = ctx.createGain();
    this.env(g, t, 0.05, vol, 1.6); n.connect(lp); lp.connect(g); g.connect(this.panned(dest, pan));
  }
}
