/* =====================================================================
   SOUNDTRACK — "What if you realized you were in a simulation?"
   Two layers, mixed after rendering:
     THE WORLD — the street on its own clock: traffic, the bus, a crossing
       signal ticking, birds, the café, wind; the cyclist's bell, the horn
       and the pigeons. It is remapped onto the film exactly like the
       picture's world: the repeat (an exact copy, with a seam you can hear),
       nothing at all in the fake pause, run backwards at the reset, and the
       opening again, sample for sample, after it.
     THE FILM — everything on film time: your steps and breath, his steps
       and breath (he has no voice), the ball, the interface (soft, neutral
       tones; no horror stings early), the glass, the void, the shhh.
   No music until the system notices you; then only a low, quiet bed.
   ===================================================================== */

class SxAudio extends AudioEngine {
  constructor(tl, app) { super(tl); this.app = app; this.wavName = SCRIPT.meta.wav; }

  fingerprintData() { return [SX, SX_G, SX_PEOPLE, SX_BALL.tImp1, SX_BALL.tImp2]; }

  // offline-safe envelopes (no exponential ramps from zero)
  _kit(ctx, seed) {
    const S = new SoundKit(ctx, seed);
    S.env = (g, t, a, peak, d) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(Math.max(0.0002, peak), t + Math.max(a, 0.004)); g.gain.setTargetAtTime(0, t + Math.max(a, 0.004), Math.max(0.004, d / 4)); };
    S.tone = (t, dur, f, vol, pan, dest, type = 'sine', attack = 0.01, release = null) => {
      if (vol <= 0.0005) return;
      const o = ctx.createOscillator(), g = ctx.createGain(), r = release || dur * 0.3; o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + Math.max(0.006, attack)); g.gain.setValueAtTime(vol, t + Math.max(attack, dur - r)); g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(g); g.connect(S.panned(dest, pan)); o.start(t); o.stop(t + dur + 0.05); return o;
    };
    S.breath = (t, dur, inhale, vol, dest, pan = 0) => {
      const n = S.noise('pink', t, t + dur + 0.1), bp = S.filter('bandpass', inhale ? 1200 : 700, 0.9), g = ctx.createGain();
      if (inhale) { bp.frequency.setValueAtTime(850, t); bp.frequency.linearRampToValueAtTime(1500, t + dur); }
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + dur * (inhale ? 0.6 : 0.3)); g.gain.linearRampToValueAtTime(0, t + dur);
      n.connect(bp); bp.connect(g); g.connect(S.panned(dest, pan));
    };
    S.gasp = (t, vol, dest) => {
      const n = S.noise('pink', t, t + 0.9), bp = S.filter('bandpass', 900, 0.8), g = ctx.createGain();
      bp.frequency.setValueAtTime(700, t); bp.frequency.linearRampToValueAtTime(2200, t + 0.5);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.1); g.gain.linearRampToValueAtTime(vol * 0.7, t + 0.4); g.gain.linearRampToValueAtTime(0, t + 0.8);
      n.connect(bp); bp.connect(g); g.connect(dest);
    };
    return S;
  }

  /* ---------------- render: world, film, remap, mix, master ---------------- */
  async renderOffline() {
    const sr = this.sampleRate, dur = CONFIG.duration + 1.5, WD = 72.5;
    const wctx = new OfflineAudioContext(2, Math.ceil(WD * sr), sr);
    this._world(wctx, WD);
    const fctx = new OfflineAudioContext(2, Math.ceil(dur * sr), sr);
    this._film(fctx);
    const [W, F] = await Promise.all([wctx.startRendering(), fctx.startRendering()]);
    const n = Math.ceil(dur * sr), mix = new AudioBuffer({ numberOfChannels: 2, length: n, sampleRate: sr });
    const map = this._map.bind(this), gain = this._worldGain.bind(this);
    for (let c = 0; c < 2; c++) {
      const w = W.getChannelData(c), f = F.getChannelData(c), o = mix.getChannelData(c);
      const at = (p) => { const i = Math.floor(p * sr), u = p * sr - i; return i < 0 || i + 1 >= w.length ? 0 : w[i] * (1 - u) + w[i + 1] * u; };
      for (let i = 0; i < n; i++) {
        const t = i / sr, m = map(t);
        let v = 0;
        if (m !== null) { v = at(m.p) * m.g; if (m.x) v = v * (1 - m.x.k) + at(m.x.p) * m.x.k; }
        o[i] = v * gain(t) + f[i];
        if ((t >= SX.pause[0] && t < SX.pause[1]) || t >= SX.black) o[i] = 0;          // the pause and the end: nothing at all
      }
    }
    // master: glue compressor and a limiter
    const mctx = new OfflineAudioContext(2, n, sr), src = mctx.createBufferSource(); src.buffer = mix;
    const comp = mctx.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 2.5; comp.attack.value = 0.01; comp.release.value = 0.25;
    const lim = mctx.createDynamicsCompressor(); lim.threshold.value = -2; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.1;
    const g = mctx.createGain(); g.gain.value = 3.0;
    src.connect(g); g.connect(comp); comp.connect(lim); lim.connect(mctx.destination); src.start(0);
    const out = await mctx.startRendering();
    // (the pause and the cut are exactly silent after the compressor too; a soft ceiling just under full scale)
    for (let c = 0; c < 2; c++) {
      const o = out.getChannelData(c);
      for (let i = 0; i < n; i++) {
        const t = i / sr, x = o[i], ax = Math.abs(x);
        if ((t >= SX.pause[0] && t < SX.pause[1]) || t >= SX.black) { o[i] = 0; continue; }
        if (ax > 0.7) o[i] = Math.sign(x) * (0.7 + 0.17 * Math.tanh((ax - 0.7) / 0.17));
      }
    }
    AudioEngine.declick(out, 0.15);
    return out;
  }

  // film time → where to read the world's sound (p), at what gain (g), with an optional crossfade source (x)
  _map(t) {
    const R = SX.rep, P = SX.pause, RW = SX.rewind;
    if (t < R.at) return { p: t, g: 1 };
    if (t < R.at + R.back) { const u = t - R.at; return { p: t - R.back, g: u < 0.03 ? 0 : MathX.smooth(u, 0.03, 0.045) }; }   // the repeat: a 30 ms hole, then the same sound again
    if (t < R.at + R.back + 0.06) { const k = (t - R.at - R.back) / 0.06; return { p: t - R.back, g: 1, x: { p: t, k } }; }
    if (t < P[0]) return { p: t, g: 1 };
    if (t < P[1]) return null;
    if (t < RW[0]) return { p: t - (P[1] - P[0]), g: 1 };
    if (t < RW[1]) {                                                         // run backwards, faster and faster
      const u = t - RW[0], w0 = RW[0] - (P[1] - P[0]);
      return { p: w0 - (u + 1.6 * u * u), g: 1 - 0.5 * MathX.smooth(u, 0.6, 1.4) };
    }
    if (t < SX.restart) return null;
    return { p: t - SX.restart, g: 1 };
  }

  // how present the world is (it drains away in the stare, recedes once the system notices you, goes in the void)
  _worldGain(t) {
    let g = 1;
    const L = SX.look;
    if (t >= L.turn && t < L.snap) g = 1 - 0.93 * MathX.smooth(t, L.turn, L.turn + 0.35);
    if (t >= SX.up.t && t < SX.restart) {
      g = MathX.lerp(1, 0.38, MathX.smooth(t, SX.up.t, SX.up.detected));
      g *= 1 + 0.6 * MathX.smooth(t, SX.alarm, SX.alarm + 0.3) * (1 - MathX.smooth(t, SX.run, SX.hit));
      g *= 1 - 0.85 * MathX.smooth(t, SX.shatter[1], SX.shatter[2]);
      if (t >= SX.rewind[0]) g = 0.8;
    }
    if (t >= SX.failed.text) g *= 1 - 0.35 * MathX.smooth(t, SX.failed.text, SX.failed.text + 0.3);
    return g;
  }

  /* ---------------- the world (its own clock) ---------------- */
  _world(ctx, WD) {
    const S = this._kit(ctx, CONFIG.seed + 1), rng = new RNG(5151);
    const out = ctx.createGain(); out.gain.value = 1; out.connect(ctx.destination);
    const rev = S.reverb(1.6), rs = ctx.createGain(); rs.gain.value = 0.28; rev.connect(rs); rs.connect(out);
    // the city's bed: low traffic rumble, distant hiss, a little wind
    const bed = (type, f, q, v, kind = 'bandpass', pan = 0) => { const s = S.noise(type, 0, WD), b = S.filter(kind, f, q), g = ctx.createGain(); g.gain.value = v; s.connect(b); b.connect(g); g.connect(S.panned(out, pan)); return g; };
    bed('brown', 160, 0.7, 0.32, 'lowpass', -0.2);
    bed('pink', 900, 0.5, 0.05, 'bandpass', -0.3);
    const wind = bed('pink', 420, 0.6, 0.02, 'bandpass', 0.1);
    for (let t = 0; t < WD; t += 0.5) wind.gain.linearRampToValueAtTime(0.012 + 0.02 * (0.5 + 0.5 * noise1(t * 0.3, 9)), t);
    // the café on your right: murmur, a laugh now and then, cups
    S.chatter(0, WD, 0.022, 0.45, out, 420, 3.2);
    for (let t = 2.5; t < WD; t += rng.range(5, 11)) S.laugh(t, 0.012, 0.5, out, 470, 4);
    for (let t = 1.2; t < WD; t += rng.range(1.6, 4.5)) S.tone(t, 0.12, rng.range(2400, 3400), 0.006, 0.55, out, 'sine', 0.002, 0.1);
    // birds in the trees
    for (let t = 0.3; t < WD; t += rng.range(0.5, 2.2)) { const f = rng.range(2600, 4200), p = rng.range(-0.8, 0.8); for (let k = 0; k < rng.int(1, 4); k++) S.chirp(t + k * 0.11, f * rng.range(0.95, 1.08), 0.02, p, out, false); }
    // the crossing signal down the street: a steady tick
    for (let t = 0.2; t < WD; t += 1.0) S.tone(t, 0.03, 880, 0.006, -0.15, out, 'square', 0.002, 0.02);
    // traffic: each car that passes you, a swell of tyre noise (and engine) on your left
    const T = this.app.traffic, cz = (w) => { const t = w < SX.pause[0] ? w : w + (SX.pause[1] - SX.pause[0]); return this.cz.value(Math.min(t, SX.rewind[0])); };
    const s = {};
    for (const c of T.cars) {
      if (c.id === 'bus') continue;
      let prev = null;
      for (let w = 0; w < WD; w += 0.05) {
        const cw = c.id === 'red' ? (w < SX.brk.freeze ? w : w > SX.repair - 0.85 ? w - (SX.repair - 0.85 - SX.brk.freeze) : SX.brk.freeze) : w;
        T.sample(c, cw, s);
        const d = s.z - cz(w);
        if (prev !== null && Math.sign(d) !== Math.sign(prev) && Math.abs(d - prev) < 3) this._passBy(S, out, w, c.id === 'red' ? 4.5 : c.id === 'taxi' ? 7 : 8.5, c.type);
        prev = d;
      }
    }
    // the red car's engine: it creeps toward you… and cuts dead when it freezes; on again at the repair
    const eng = (t0, t1, cut) => { const o = ctx.createOscillator(), lp = S.filter('lowpass', 260, 0.8), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = 38;
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.03, t0 + 2); g.gain.setValueAtTime(0.03, t1 - 0.001); g.gain.linearRampToValueAtTime(0, t1 + (cut ? 0.004 : 1.5));
      o.connect(lp); lp.connect(g); g.connect(S.panned(out, -0.4)); o.start(t0); o.stop(t1 + 1.6); };
    eng(28, SX.brk.freeze, true);
    // (the stuck engine: a 25 ms grain repeated, then nothing)
    const gr = ctx.createOscillator(), gg = ctx.createGain(), glp = S.filter('lowpass', 300, 0.8); gr.type = 'sawtooth'; gr.frequency.value = 38;
    gg.gain.setValueAtTime(0, 0); for (let k = 0; k < 12; k++) { const tt = SX.brk.freeze + k * 0.03; gg.gain.setValueAtTime(0.03 * (1 - k / 12), tt); gg.gain.setValueAtTime(0, tt + 0.018); }
    gr.connect(glp); glp.connect(gg); gg.connect(S.panned(out, -0.4)); gr.start(SX.brk.freeze); gr.stop(SX.brk.freeze + 0.4);
    eng(SX.repair - 0.85, SX.repair - 0.85 + 3, false);
    // the bus: idling at the stop, the brakes let go, it pulls away and comes past
    const bo = ctx.createOscillator(), bl = S.filter('lowpass', 200, 0.9), bg = ctx.createGain(); bo.type = 'sawtooth';
    bo.frequency.setValueAtTime(32, 0); bo.frequency.linearRampToValueAtTime(32, 1.2); bo.frequency.linearRampToValueAtTime(52, 3.4); bo.frequency.linearRampToValueAtTime(44, 6.8); bo.frequency.linearRampToValueAtTime(36, 9);
    bg.gain.setValueAtTime(0.018, 0); bg.gain.linearRampToValueAtTime(0.03, 3); bg.gain.linearRampToValueAtTime(0.06, 6.9); bg.gain.linearRampToValueAtTime(0.0, 10.5);
    bo.connect(bl); bl.connect(bg); bg.connect(S.panned(out, -0.35)); bo.start(0); bo.stop(11);
    S.hiss(1.12, 0.5, 0.02, -0.3, out);
    this._passBy(S, out, 7.0, 8, 'bus');
    // the cyclist: freewheel ticking, the bell, his tyres going past
    const ring = (t) => { for (const k of [0, 0.16]) { for (const [f, v] of [[2900, 0.03], [4350, 0.012], [6100, 0.006]]) S.tone(t + k, 0.45, f, v, -0.35, out, 'sine', 0.003, 0.4); } };
    ring(11.75);
    for (let t = 11.2; t < 12.9; t += 0.07) S.click(t, 0.006, -0.4, out);
    this._passBy(S, out, 12.0, 6, 'bike');
    // the taxi's horn down at the junction
    S.horn(12.35, 410, 520, 0.022, -0.1, out);
    // the pigeons take off
    for (let i = 0; i < 5; i++) S.flap(12.7 + i * 0.06, 0.15 + i * 0.05, 0.05, out);
    for (let i = 0; i < 5; i++) S.flap(12.95 + i * 0.07, 0.0, 0.03, out);
    // a dog, once, far off
    S.tone(26.5, 0.12, 520, 0.008, -0.6, out, 'sawtooth', 0.01, 0.08); S.tone(26.7, 0.1, 480, 0.006, -0.6, out, 'sawtooth', 0.01, 0.07);
  }

  // a vehicle going past: tyre roar swells and fades on your left (a little engine under it)
  _passBy(S, dest, t, v, type) {
    const ctx = S.ctx, big = type === 'bus' || type === 'van', bike = type === 'bike', T = bike ? 0.9 : 1.6 * 8 / Math.max(4, v);
    const n = S.noise(bike ? 'white' : 'pink', t - T, t + T), bp = S.filter('bandpass', bike ? 1800 : big ? 500 : 750, 0.7), g = ctx.createGain(), p = ctx.createStereoPanner();
    const peak = bike ? 0.014 : big ? 0.11 : 0.06 * (0.6 + v / 20);
    g.gain.setValueAtTime(0, t - T); g.gain.linearRampToValueAtTime(peak * 0.25, t - T * 0.4); g.gain.linearRampToValueAtTime(peak, t); g.gain.linearRampToValueAtTime(peak * 0.2, t + T * 0.5); g.gain.linearRampToValueAtTime(0, t + T);
    p.pan.setValueAtTime(-0.2, t - T); p.pan.linearRampToValueAtTime(-0.75, t); p.pan.linearRampToValueAtTime(-0.3, t + T);
    bp.frequency.setValueAtTime(bike ? 2000 : big ? 560 : 820, t - T); bp.frequency.linearRampToValueAtTime(bike ? 1500 : big ? 380 : 560, t + T);
    n.connect(bp); bp.connect(g); g.connect(p); p.connect(dest);
    if (!bike) { const o = ctx.createOscillator(), og = ctx.createGain(), lp = S.filter('lowpass', 240, 0.8); o.type = 'sawtooth';
      o.frequency.setValueAtTime(big ? 46 : 62, t - T); o.frequency.linearRampToValueAtTime(big ? 40 : 52, t + T);
      og.gain.setValueAtTime(0, t - T); og.gain.linearRampToValueAtTime(peak * 0.25, t); og.gain.linearRampToValueAtTime(0, t + T);
      o.connect(lp); lp.connect(og); og.connect(p); o.start(t - T); o.stop(t + T + 0.05); }
  }

  /* ---------------- the film (film time) ---------------- */
  _film(ctx) {
    const S = this._kit(ctx, CONFIG.seed + 2), rng = new RNG(616);
    const out = ctx.createGain(); out.connect(ctx.destination);
    const rev = S.reverb(2.2), rs = ctx.createGain(); rs.gain.value = 0.35; rev.connect(rs); rs.connect(out);
    const ui = ctx.createGain(); ui.gain.value = 1; ui.connect(out);
    const you = ctx.createGain(); you.gain.value = 1.2; you.connect(out);
    this._steps(S, you);
    this._him(S, out, rev);
    this._ball(S, out);
    this._glitches(S, out, ui, rev);
    this._bed(S, out);
    this._glass(S, out, rev);
  }

  // your footsteps (from the camera's own walk; the opening again after the reset)
  _steps(S, dest) {
    const C = this.app.cam, dt = C.dt, ph = C.stepPh, list = [];
    for (let i = 1; i < ph.length; i++) {
      const t = i * dt;
      if (Math.floor(ph[i]) !== Math.floor(ph[i - 1]) && t < SX.rewind[0]) list.push(t);
    }
    const open = list.filter((t) => t < SX.failed.turn - SX.restart);
    for (const t of list) S.step(t, 0.05 + rng01(t) * 0.012, 0, dest);
    for (const t of open) S.step(t + SX.restart, 0.05 + rng01(t) * 0.012, 0, dest);
    S.step(SX.failed.turn + 0.25, 0.04, 0, dest); S.step(SX.failed.turn + 0.7, 0.03, 0, dest);
    // breathing: calm, then held in the stare; quicker after the hit
    for (let t = 1.5; t < 20; t += 3.8) S.breath(t, 1.0, true, 0.006, dest);
    S.breath(SX.look.turn + 0.05, 0.5, true, 0.018, dest);                   // you catch your breath as he turns
    S.breath(SX.look.snap + 0.1, 1.0, false, 0.016, dest);                    // …and let it go
    for (let t = 39.5; t < 56; t += 3.2) S.breath(t, 1.1, true, 0.007, dest);
    S.breath(53.7, 0.4, true, 0.014, dest);
    S.gasp(SX.hit + 0.02, 0.03, dest);
    for (let t = SX.hit + 1.1; t < SX.rewind[0]; t += 1.1) S.breath(t, 0.6, true, 0.012, dest);
  }

  // him: steps, breath before he speaks, the taps, the slam, the shhh
  _him(S, out, rev) {
    const ctx = S.ctx;
    // the walk-bys: steps that come up on your left and go past
    for (const [t0, tp] of [[3.4, 5.53], [3.4 + SX_G.replay.dt, 5.53 + SX_G.replay.dt]]) {
      for (let t = t0 + 0.2; t < tp + 1.6; t += 0.52) { const d = Math.abs(t - tp); S.step(t, 0.05 / (1 + d * 1.6), MathX.clamp(-0.15 - 0.6 * (1 - d / 2), -0.85, -0.1), out); }
    }
    S.tone(1.05, 0.25, 180, 0.004, -0.05, out, 'sine');                          // (a sip)
    // out of the café door, to the table
    for (let t = 17.7; t < 19.7; t += 0.5) S.step(t, 0.012, 0.25, out);
    // before each line: a breath; while he speaks, a faint close breath only (no voice)
    for (const s of SCRIPT.hud.says) { S.breath(s.t - 0.32, 0.3, true, s.text === s.text.toUpperCase() ? 0.03 : 0.018, out); S.breath(s.t + 0.05, Math.min(0.9, s.until - s.t), false, 0.008, out); }
    // steps toward you (the approach), the run
    for (let t = SX.approach[0] + 0.1; t < SX.approach[1]; t += 0.42) S.step(t, 0.06, 0.05, out);
    for (let t = SX.run + 0.05; t < SX.hit; t += 0.21) S.step(t, 0.05 + 0.06 * (t - SX.run) / (SX.hit - SX.run), 0.05, out);
    // the taps on the lens: a hollow knock right in your ear, and the picture's ripple — a low wobble that sinks
    for (const t of [SX.tap, SX.tap2]) {
      S.tone(t, 0.09, 1250, 0.05, 0, out, 'sine', 0.001, 0.08); S.click(t, 0.05, 0, out);
      const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.2);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.06, t + 0.005); g.gain.setTargetAtTime(0, t + 0.01, 0.05); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.4);
    }
    const w = ctx.createOscillator(), wg = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    w.frequency.setValueAtTime(110, SX.tap); w.frequency.exponentialRampToValueAtTime(42, SX.tap + 1.5); lfo.frequency.value = 7; lg.gain.value = 0.018;
    lfo.connect(lg); lg.connect(wg.gain); wg.gain.setValueAtTime(0, SX.tap); wg.gain.linearRampToValueAtTime(0.05, SX.tap + 0.05); wg.gain.linearRampToValueAtTime(0, SX.tap + 1.6);
    w.connect(wg); wg.connect(out); w.start(SX.tap); w.stop(SX.tap + 1.7); lfo.start(SX.tap); lfo.stop(SX.tap + 1.7);
    // he steps back after the pause (startled)
    S.step(60.25, 0.05, 0, out); S.step(60.6, 0.04, 0, out);
    // yanked away
    const n = S.noise('pink', SX.rewind[0], SX.rewind[0] + 0.9), bp = S.filter('bandpass', 400, 0.8), g = ctx.createGain();
    bp.frequency.setValueAtTime(300, SX.rewind[0]); bp.frequency.linearRampToValueAtTime(2400, SX.rewind[0] + 0.6);
    g.gain.setValueAtTime(0, SX.rewind[0]); g.gain.linearRampToValueAtTime(0.09, SX.rewind[0] + 0.08); g.gain.linearRampToValueAtTime(0, SX.rewind[0] + 0.8);
    n.connect(bp); bp.connect(g); g.connect(out);
    // shhh — close, as if in your ear
    const sh = SX.failed.shh + 0.12, sn = S.noise('white', sh, sh + 1.2), hp = S.filter('highpass', 2200, 0.7), sb = S.filter('bandpass', 4200, 0.9), sg = ctx.createGain();
    sg.gain.setValueAtTime(0, sh); sg.gain.linearRampToValueAtTime(0.05, sh + 0.12); sg.gain.linearRampToValueAtTime(0.035, sh + 0.7); sg.gain.linearRampToValueAtTime(0, sh + 0.95);
    sn.connect(hp); hp.connect(sb); sb.connect(sg); sg.connect(out);
  }

  // the ball: a rubber thock on the canvas edge, two bounces — then the same, backwards
  _ball(S, out) {
    const B = SX_BALL, t0 = SX.ball.t0, i1 = t0 + B.tImp1, i2 = t0 + B.tImp2, r1 = 2 * i2 - i1;
    const thock = (t, v, back) => {
      const ctx = S.ctx, o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(back ? 120 : 210, t); o.frequency.linearRampToValueAtTime(back ? 210 : 120, t + 0.09);
      if (back) { g.gain.setValueAtTime(0, t - 0.12); g.gain.linearRampToValueAtTime(v, t); g.gain.setValueAtTime(0, t + 0.004); o.start(t - 0.13); }
      else { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.003); g.gain.setTargetAtTime(0, t + 0.004, 0.035); o.start(t); }
      o.connect(g); g.connect(S.panned(out, 0.15)); o.stop(t + 0.3);
      const n = S.noise('white', t - 0.13, t + 0.1), bp = S.filter('bandpass', 1400, 1.2), ng = ctx.createGain();
      if (back) { ng.gain.setValueAtTime(0, t - 0.06); ng.gain.linearRampToValueAtTime(v * 0.3, t); ng.gain.setValueAtTime(0, t + 0.003); }
      else { ng.gain.setValueAtTime(0, t); ng.gain.linearRampToValueAtTime(v * 0.3, t + 0.002); ng.gain.setTargetAtTime(0, t + 0.003, 0.012); }
      n.connect(bp); bp.connect(ng); ng.connect(S.panned(out, 0.15));
    };
    S.tone(t0 + 0.02, 0.38, 95, 0.006, 0.3, out, 'triangle');                  // rolling on the awning
    thock(i1, 0.09, false); thock(i2, 0.07, false); thock(r1, 0.09, true);
    S.tone(2 * i2 - t0 - 0.4, 0.38, 95, 0.006, 0.3, out, 'triangle');
  }

  // the interface and the glitches: small, neutral, exact
  _glitches(S, out, ui, rev) {
    const ctx = S.ctx, blip = (t, f, v = 0.02, d = 0.06) => S.tone(t, d, f, v, 0, ui, 'sine', 0.003, d * 0.8);
    S.click(SX.rep.at, 0.03, 0, out);                                           // the seam
    for (const t of [18.92, 19.02, 19.16, 19.26]) S.click(t, 0.012, -0.5, ui);   // NOR—
    // the wall: a glassy shimmer as the grid runs out from your fingers (twice, the same)
    for (const [t, k] of [[SX.wall.touch, 1], [SX.wall.again, 0.6]]) { S.click(t, 0.02 * k, 0.3, out); for (const f of [2093, 2637, 3136, 4186]) S.tone(t, 0.5, f, 0.006 * k, 0.3, out, 'sine', 0.004, 0.45); }
    [29.6, 30.0, 30.45, 30.9].forEach((t) => blip(t, 1568, 0.012, 0.05));      // labels
    S.click(SX.brk.lod, 0.03, -0.5, out); S.click(SX.brk.lod + 0.17, 0.02, -0.5, out);
    S.tone(SX.brk.tree, 0.12, 300, 0.012, -0.4, out, 'square', 0.002, 0.1);
    S.tone(SX.brk.checker, 0.16, 60, 0.03, -0.4, out, 'square', 0.002, 0.12);
    const un = S.noise('white', SX.brk.unstable, SX.brk.unstable + 0.04), ug = ctx.createGain(); ug.gain.setValueAtTime(0.05, SX.brk.unstable); ug.gain.setValueAtTime(0, SX.brk.unstable + 0.033); un.connect(ug); ug.connect(out);
    // the system: VIEWER DETECTED (two soft notes), ACTIVE OBSERVER, the caption that answers, the counter
    blip(SX.up.detected, 880, 0.03, 0.18); blip(SX.up.detected + 0.2, 659, 0.03, 0.3);
    blip(SX.up.observer, 659, 0.022, 0.2);
    for (const t of [SX.cap.wait - 0.1, SX.cap.sees - 0.07]) for (let k = 0; k < 4; k++) S.click(t + k * 0.025, 0.02, 0, ui);
    S.thump(SX.cap.sees, 0.05, out);
    for (let t = Math.ceil(SX.playback[0]); t < SX.playback[1]; t += 1) S.tone(t, 0.02, 2000, 0.006, 0, ui, 'sine', 0.001, 0.015);
    blip(SX.session[0], 523, 0.018, 0.35);
    // the alarm: two clean tones alternating (not a siren)
    for (let k = 0; k < 8; k++) S.tone(SX.alarm + k * 0.28, 0.24, k % 2 ? 554 : 740, 0.035, 0, ui, 'triangle', 0.005, 0.05);
    // the repair: snaps
    for (const t of [SX.repair, SX.repair + 0.02, SX.repair + 0.04, SX.snapBack, SX.snapBack + 0.03, SX.snapBack + 0.05]) { S.click(t, 0.035, rng01(t) - 0.5, out); S.tone(t, 0.06, 900, 0.012, 0, out, 'sine', 0.001, 0.05); }
    // RESET IN 3 · 2 · 1 — ticks over a rising wash
    for (const t of SX.count.slice(0, 3)) blip(t, 1000, 0.03, 0.12);
    const rn = S.noise('pink', SX.count[0], SX.count[3]), rb = S.filter('bandpass', 300, 1.2), rg = ctx.createGain();
    rb.frequency.setValueAtTime(250, SX.count[0]); rb.frequency.exponentialRampToValueAtTime(2600, SX.count[3]);
    rg.gain.setValueAtTime(0, SX.count[0]); rg.gain.linearRampToValueAtTime(0.03, SX.count[3] - 0.05); rg.gain.linearRampToValueAtTime(0, SX.count[3]);
    rn.connect(rb); rb.connect(rg); rg.connect(out);
    // RESETTING…: the sound runs back into a white swell; then nothing
    const wn = S.noise('white', SX.rewind[1] - 0.8, SX.white[1]), wb = S.filter('highpass', 1200, 0.6), wg = ctx.createGain();
    wg.gain.setValueAtTime(0, SX.rewind[1] - 0.8); wg.gain.linearRampToValueAtTime(0.05, SX.white[0]); wg.gain.linearRampToValueAtTime(0, SX.white[1]);
    wn.connect(wb); wb.connect(wg); wg.connect(out);
    // RESET FAILED: one low tone
    S.tone(SX.failed.text, 1.4, 110, 0.04, 0, ui, 'sine', 0.02, 1.0); S.tone(SX.failed.text, 1.4, 164.8, 0.018, 0, ui, 'sine', 0.02, 1.0);
  }

  // a quiet low bed from the moment the system notices you; the void's hum
  _bed(S, out) {
    const ctx = S.ctx, g = ctx.createGain(); g.connect(out);
    for (const [f, v] of [[55, 1], [82.4, 0.6], [110.3, 0.25]]) { const o = ctx.createOscillator(); o.frequency.value = f; const og = ctx.createGain(); og.gain.value = v; o.connect(og); og.connect(g); o.start(SX.up.t); o.stop(SX.rewind[1]); }
    const K = [[SX.up.t, 0], [SX.up.detected, 0.02], [52, 0.02], [53.6, 0.012], [SX.alarm, 0.03], [SX.hit, 0.04], [SX.shatter[1], 0.07], [SX.rewind[0], 0.06], [SX.rewind[1], 0]];
    g.gain.setValueAtTime(0, 0); for (const [t, v] of K) g.gain.linearRampToValueAtTime(v, t);
    // the void: a deep, slow beating hum and thin air
    const vg = ctx.createGain(); vg.connect(out);
    for (const f of [40, 40.6, 80.3]) { const o = ctx.createOscillator(); o.frequency.value = f; o.connect(vg); o.start(SX.shatter[0]); o.stop(SX.rewind[1]); }
    vg.gain.setValueAtTime(0, SX.shatter[0]); vg.gain.linearRampToValueAtTime(0.05, SX.shatter[2]); vg.gain.linearRampToValueAtTime(0.03, SX.rewind[0] + 0.5); vg.gain.linearRampToValueAtTime(0, SX.rewind[1]);
    const an = S.noise('white', SX.shatter[1], SX.rewind[1]), ab = S.filter('bandpass', 6000, 2), ag = ctx.createGain();
    ag.gain.setValueAtTime(0, SX.shatter[1]); ag.gain.linearRampToValueAtTime(0.008, SX.shatter[2]); ag.gain.linearRampToValueAtTime(0, SX.rewind[1]);
    an.connect(ab); ab.connect(ag); ag.connect(out);
  }

  // the glass: the slam and the crack, the crack running across, the pieces falling away; at the reset, all of it backwards
  _glass(S, out, rev) {
    const ctx = S.ctx, cb = S.crackleBuffer(2.6, 60), sr = ctx.sampleRate;
    const play = (buf, t, v, f = 3200, rate = 1) => { const s = ctx.createBufferSource(), bp = S.filter('highpass', f, 0.6), g = ctx.createGain(); s.buffer = buf; s.playbackRate.value = rate; g.gain.value = v; s.connect(bp); bp.connect(g); g.connect(out); const r = ctx.createGain(); r.gain.value = 0.4; g.connect(r); r.connect(rev); s.start(t); return s; };
    // the slam: a heavy thud on the glass, the crack
    S.thump(SX.hit, 0.18, out); S.crunch(SX.hit, 0.09, 0, out, rev); play(cb, SX.hit, 0.22, 2500, 1.4).stop(SX.hit + 0.5);
    S.tone(SX.hit, 1.2, 3520, 0.006, 0, out, 'sine', 0.002, 1.1);
    S.tone(69.2, 0.25, 1800, 0.004, 0, out, 'sine', 0.01, 0.2);                 // (his palm on the glass)
    // the crack runs across the picture; the pieces fall away into the dark
    play(cb, SX.shatter[0], 0.2, 2200, 1.0).stop(SX.shatter[1] + 0.3);
    for (const sh of this.app.crack.shards) { const t = sh.fall + 0.05; if (rng01(t * 7) < 0.45) S.pluck(t, 2400 + 3000 * rng01(t * 3), 0.012, MathX.clamp((sh.c[0] - 540) / 540, -1, 1), out, 0.5, 0.9); }
    // the reset: the crack and the falling pieces, backwards (the glass mending)
    const len = Math.floor(sr * 1.4), rb = ctx.createBuffer(1, len, sr), d = rb.getChannelData(0), src = cb.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = src[len - 1 - i] * (i / len);
    play(rb, SX.rewind[1] - 1.4, 0.25, 2200, 1.0);
  }
}

function rng01(x) { return hash1(Math.floor(x * 1000)); }
