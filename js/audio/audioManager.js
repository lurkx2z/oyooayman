/* =====================================================================
   AUDIO MANAGER — the whole temporary soundtrack is synthesised with the
   Web Audio API (no sound files). It is rendered once, offline, into a
   single stereo buffer that is perfectly in sync with the timeline:
   playing from any time t just starts that buffer at offset t.
   The same buffer can be exported as a WAV for editing.

   Cues: city ambience, birds, footsteps, car engines with distance /
   pan / Doppler, tyre noise, sputtering, grill sizzle, angle grinder,
   oxygen-drop ticks + boom, ear pop + muffling, crash, car alarm,
   electric-car hum, air-brake hiss, breathing, heartbeat, ringing.
   ===================================================================== */

class AudioManager {
  constructor(tl, traffic) {
    this.tl = tl;
    this.traffic = traffic;
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
    a.download = 'what-if-oxygen-phase1-soundtrack.wav';
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

  _build(ctx) {
    const S = new SoundKit(ctx, CONFIG.seed);
    const tl = this.tl;
    // master chain: muffle → compressor → out
    const muffle = ctx.createBiquadFilter(); muffle.type = 'lowpass'; muffle.Q.value = 0.5;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.2;
    const out = ctx.createGain(); out.gain.value = 0.9;
    muffle.connect(comp); comp.connect(out); out.connect(ctx.destination);
    const bus = ctx.createGain(); bus.connect(muffle);
    const rev = S.reverb(1.9); const revSend = ctx.createGain(); revSend.gain.value = 0.35; revSend.connect(rev); rev.connect(muffle);
    this.bus = bus; this.revSend = revSend;
    const tZero = tl.at('o2_zero');

    // ---- hearing: pressure drop pops the ears → muffled, then hypoxia dulls hearing
    const f = muffle.frequency;
    f.setValueAtTime(18000, 0);
    f.setValueAtTime(18000, tZero + 0.02);
    f.exponentialRampToValueAtTime(520, tZero + 0.09);
    f.exponentialRampToValueAtTime(5200, tZero + 1.3);
    f.exponentialRampToValueAtTime(9000, tZero + 3.0);
    f.setValueAtTime(9000, 9.8);
    f.exponentialRampToValueAtTime(5200, 12.5);
    f.exponentialRampToValueAtTime(1900, 15.0);

    this._city(S, bus, revSend, tZero);
    this._birds(S, bus, tZero);
    this._footsteps(S, bus);
    this._vehicles(S, bus, revSend);
    this._grill(S, bus, tl);
    this._grinder(S, bus, revSend, tl);
    this._oxygenEvent(S, bus, revSend, tl);
    this._crash(S, bus, revSend, tl);
    this._body(S, bus, tl);
    this._distant(S, revSend);
  }

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

  /* -------------------- layers -------------------- */
  _city(S, bus, rev, tZero) {
    const ctx = S.ctx, end = CONFIG.duration + 1.4;
    // broadband city air
    const air = S.noise('pink', 0, end); const lp = S.filter('lowpass', 1100, 0.4); const hp = S.filter('highpass', 70, 0.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.16, 0); g.gain.setValueAtTime(0.16, tZero); g.gain.linearRampToValueAtTime(0.07, tZero + 3); g.gain.linearRampToValueAtTime(0.035, 9); g.gain.linearRampToValueAtTime(0.03, end);
    air.connect(hp); hp.connect(lp); lp.connect(g); g.connect(bus);
    // distant traffic rumble — dies with the engines
    const rum = S.noise('brown', 0, end); const rl = S.filter('lowpass', 220, 0.7); const rg = ctx.createGain();
    rg.gain.setValueAtTime(0.34, 0); rg.gain.setValueAtTime(0.34, tZero - 0.5); rg.gain.linearRampToValueAtTime(0.12, tZero + 1.5); rg.gain.linearRampToValueAtTime(0.02, tZero + 5);
    rum.connect(rl); rl.connect(rg); rg.connect(bus);
    // a light wind that remains in the silence
    const wind = S.noise('pink', 0, end); const wb = S.filter('bandpass', 420, 0.6); const wg = ctx.createGain();
    wg.gain.setValueAtTime(0.0, 0); wg.gain.linearRampToValueAtTime(0.025, 6); wg.gain.linearRampToValueAtTime(0.04, end);
    wind.connect(wb); wb.connect(wg); wg.connect(bus);
    // distant horns (normal city)
    S.horn(0.55, 392, 466, 0.012, -0.6, rev);
    S.horn(1.6, 330, 415, 0.008, 0.7, rev);
  }

  _birds(S, bus, tZero) {
    const rng = new RNG(CONFIG.seed + 5);
    let t = 0.05;
    while (t < tZero + 2.6) {
      const frantic = t > tZero;
      const n = rng.int(2, frantic ? 6 : 4);
      const base = rng.range(2600, 4600), pan = rng.range(-0.8, 0.8), vol = rng.range(0.012, 0.03) * (frantic ? 0.8 : 1);
      for (let k = 0; k < n; k++) S.chirp(t + k * rng.range(0.07, 0.13), base * rng.range(0.9, 1.15), vol, pan, bus, frantic);
      t += frantic ? rng.range(0.25, 0.7) : rng.range(0.18, 0.55);
    }
    // a few panicked wing flaps as birds fall (distant)
    for (let k = 0; k < 6; k++) S.flap(9.3 + k * 0.45 + rng.range(0, 0.2), rng.range(-0.4, 0.4), 0.02, bus);
  }

  _footsteps(S, bus) {
    // steps while the viewer walks (same stride as the camera bob)
    const camTx = this.cx, camTz = this.cz;
    let dist = 0, last = 0, px = camTx.value(0), pz = camTz.value(0);
    const stride = 1 / CONFIG.camera.bobFrequency;
    let side = 1;
    for (let t = 0; t < CONFIG.duration; t += 1 / 240) {
      const x = camTx.value(t), z = camTz.value(t);
      dist += Math.hypot(x - px, z - pz); px = x; pz = z;
      if (dist - last >= stride) { last = dist; S.step(t, 0.06, side * 0.12, bus); side = -side; }
    }
  }

  _vehicles(S, bus, rev) {
    const ctx = S.ctx, end = CONFIG.duration + 1;
    for (const v of this.traffic.vehicles) {
      const k = v.kin, spec = v.spec;
      const pos = (t) => k.pose(t);
      // only vehicles that come reasonably close are worth a voice
      let minD = 1e9;
      for (let t = 0; t < CONFIG.duration; t += 0.25) { const p = pos(t); minD = Math.min(minD, Math.hypot(p.x - this.cx.value(t), p.z - this.cz.value(t))); }
      if (minD > 70) continue;
      const pts = this._spatial(pos, 0, end, 1 / 30);
      const speedAt = (t) => Math.abs(k.v(t));
      // ---- tyre / road noise (keeps going while the car coasts — engines are silent)
      {
        const n = S.noise('white', 0, end); const bp = S.filter('bandpass', 700, 0.7); const lp = S.filter('lowpass', 2400, 0.5);
        const g = ctx.createGain(), p = ctx.createStereoPanner();
        n.connect(bp); bp.connect(lp); lp.connect(g); g.connect(p); p.connect(bus);
        const big = spec.type === 'bus' ? 1.6 : 1;
        this._applySpatial(pts, g.gain, p.pan, [[bp.frequency, (t) => 500 + speedAt(t) * 45]], 0.12 * big, (t) => Math.min(1, speedAt(t) / 11) ** 1.4);
      }
      if (v.isEV) {
        // electric car: soft synthetic warning hum + motor whine
        const o1 = ctx.createOscillator(); o1.type = 'sine';
        const o2 = ctx.createOscillator(); o2.type = 'triangle';
        const g = ctx.createGain(), p = ctx.createStereoPanner(), mix = ctx.createGain(); mix.gain.value = 0.5;
        o1.connect(mix); o2.connect(mix); mix.connect(g); g.connect(p); p.connect(bus);
        this._applySpatial(pts, g.gain, p.pan, [[o1.frequency, (t) => 420 + speedAt(t) * 38], [o2.frequency, (t) => 980 + speedAt(t) * 70]], 0.05);
        o1.start(0); o2.start(0); o1.stop(end); o2.stop(end);
        continue;
      }
      if (!spec.v0 && spec.v0 !== 0) continue;
      // ---- combustion engine voice
      const tf = spec.fail !== undefined ? spec.fail : 2.9;
      const tDead = tf + k.sputter + 0.15;
      const moto = v.isMoto, bigE = spec.type === 'bus' || spec.type === 'pickup';
      const f0 = moto ? 92 : bigE ? 34 : 46 + v.seed * 14;
      const rpm = (t) => {
        if (t < tf) return f0 * (spec.v0 ? 1 + Math.min(1, speedAt(t) / 12) * 0.35 : 0.72);
        const u = MathX.clamp((t - tf) / k.sputter, 0, 1);
        return f0 * (1 - 0.55 * u) * (1 + 0.15 * Math.sin(u * 40));
      };
      const saw = ctx.createOscillator(); saw.type = 'sawtooth';
      const sq = ctx.createOscillator(); sq.type = 'square';
      const lp = S.filter('lowpass', moto ? 1500 : bigE ? 420 : 700, 1.2);
      const am = ctx.createGain(); // firing pulses
      const g = ctx.createGain(), p = ctx.createStereoPanner();
      const sqg = ctx.createGain(); sqg.gain.value = 0.5;
      saw.connect(lp); sq.connect(sqg); sqg.connect(lp); lp.connect(am); am.connect(g); g.connect(p); p.connect(bus);
      const send = ctx.createGain(); send.gain.value = 0.25; p.connect(send); send.connect(rev);
      // misfire gating during the sputter, then silence
      am.gain.setValueAtTime(1, 0);
      const rng = new RNG(Math.floor(v.seed * 1e6));
      let tt = tf;
      while (tt < tDead) {
        const on = rng.next() < 0.55;
        am.gain.setValueAtTime(on ? 1 : 0.08, tt);
        if (!on && rng.next() < 0.5) S.backfire(tt, 0.12, bus, moto);
        tt += rng.range(0.04, 0.14);
      }
      am.gain.setValueAtTime(0, tDead);
      const vol = (moto ? 0.11 : bigE ? 0.12 : 0.075) * (spec.v0 ? 1 : 0.6);
      this._applySpatial(pts.filter((q) => q.t <= tDead + 0.1), g.gain, p.pan, [[saw.frequency, rpm], [sq.frequency, (t) => rpm(t) * 0.5]], vol);
      saw.start(0); sq.start(0); saw.stop(tDead + 0.2); sq.stop(tDead + 0.2);
      // bus air brakes still hiss (stored compressed air)
      if (spec.type === 'bus' && k.tStop < CONFIG.duration) {
        const pp = this._spatial(pos, k.tStop, k.tStop + 0.1)[0];
        S.hiss(k.tStop + 0.15, 0.9, 0.16 * pp.gain * 3, pp.pan, bus);
      }
    }
  }

  _grill(S, bus, tl) {
    const ctx = S.ctx, tOut = tl.at('flames_out'), end = CONFIG.duration + 1;
    const pos = { x: LAYOUT.cart.x, z: LAYOUT.cart.z + 0.4 };
    const pts = this._spatial(() => pos, 0, end, 1 / 15, 3);
    // sizzle (hiss)
    const n = S.noise('white', 0, end); const hp = S.filter('highpass', 3200, 0.6); const g = ctx.createGain(), p = ctx.createStereoPanner();
    n.connect(hp); hp.connect(g); g.connect(p); p.connect(bus);
    this._applySpatial(pts, g.gain, p.pan, [], 0.06, (t) => (t < tOut ? 1 : 0.35 * Math.exp(-(t - tOut) / 5)));
    // crackle (sparse clicks)
    const cr = ctx.createBufferSource(); cr.buffer = S.crackleBuffer(4, 60); cr.loop = true;
    const cg = ctx.createGain(), cp = ctx.createStereoPanner(); const cbp = S.filter('bandpass', 2500, 0.8);
    cr.connect(cbp); cbp.connect(cg); cg.connect(cp); cp.connect(bus);
    this._applySpatial(pts, cg.gain, cp.pan, [], 0.55, (t) => (t < tOut ? 1 : 0.12 * Math.exp(-(t - tOut) / 3)));
    cr.start(0); cr.stop(end);
    // the flame dying: soft "whump"
    S.whump(tOut, 0.22, pts[0].pan, bus);
  }

  _grinder(S, bus, rev, tl) {
    const ctx = S.ctx, tStop = tl.at('grinder_stop');
    const pos = { x: 13.9, z: -13.4 };
    const pts = this._spatial(() => pos, 0, tStop + 2.5, 1 / 15, 5);
    // motor whine (electric — unaffected by oxygen), spins down when released
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    const bp = S.filter('bandpass', 380, 2.0);
    const g = ctx.createGain(), p = ctx.createStereoPanner();
    o.connect(bp); bp.connect(g); g.connect(p); p.connect(bus);
    const freq = (t) => (t < tStop ? 186 + Math.sin(t * 9) * 2 : 186 * Math.exp(-(t - tStop) / 0.9));
    this._applySpatial(pts, g.gain, p.pan, [[o.frequency, freq], [bp.frequency, (t) => freq(t) * 2]], 0.07, (t) => (t < tStop ? 1 : Math.exp(-(t - tStop) / 1.1)));
    o.start(0); o.stop(tStop + 2.5);
    // grinding screech: metal on abrasive disc (stops when he stops cutting)
    const n = S.noise('white', 0, tStop + 0.1);
    const b1 = S.filter('bandpass', 3400, 7), b2 = S.filter('bandpass', 5600, 9);
    const sg = ctx.createGain(), sp = ctx.createStereoPanner();
    n.connect(b1); n.connect(b2); b1.connect(sg); b2.connect(sg); sg.connect(sp); sp.connect(bus);
    const s2 = ctx.createGain(); s2.gain.value = 0.3; sp.connect(s2); s2.connect(rev);
    this._applySpatial(pts.filter((q) => q.t <= tStop + 0.05), sg.gain, sp.pan, [], 0.5, (t) => 0.75 + 0.25 * Math.sin(t * 13) * Math.sin(t * 3.1));
    sg.gain.setValueAtTime(0.0001, tStop + 0.06);
  }

  _oxygenEvent(S, bus, rev, tl) {
    const ctx = S.ctx, t0 = tl.at('oxygen_drop'), tZ = tl.at('o2_zero');
    // accelerating UI ticks in sync with the counter
    let t = t0, gap = 0.16;
    while (t < tZ - 0.02) { S.tick(t, 1650, 0.05, bus); t += gap; gap = Math.max(0.045, gap * 0.82); }
    // rising sub drone
    const o = ctx.createOscillator(); o.type = 'sine'; const og = ctx.createGain();
    o.frequency.setValueAtTime(70, t0); o.frequency.exponentialRampToValueAtTime(38, tZ);
    og.gain.setValueAtTime(0.0001, t0); og.gain.exponentialRampToValueAtTime(0.32, tZ - 0.05); og.gain.exponentialRampToValueAtTime(0.0001, tZ + 0.05);
    o.connect(og); og.connect(bus); o.start(t0); o.stop(tZ + 0.1);
    // tension riser (filtered noise sweep)
    const n = S.noise('white', t0, tZ + 0.1); const bp = S.filter('bandpass', 400, 3); const ng = ctx.createGain();
    bp.frequency.setValueAtTime(300, t0); bp.frequency.exponentialRampToValueAtTime(4200, tZ);
    ng.gain.setValueAtTime(0.0001, t0); ng.gain.exponentialRampToValueAtTime(0.09, tZ - 0.03); ng.gain.setValueAtTime(0.0001, tZ);
    n.connect(bp); bp.connect(ng); ng.connect(bus);
    // impact at 0 %
    S.boom(tZ, 0.75, bus, rev);
    // ear pop
    S.pop(tZ + 0.04, 0.4, bus);
    // pressure ringing afterwards
    S.ring(tZ + 0.1, 1.8, 7400, 0.012, bus);
  }

  _crash(S, bus, rev, tl) {
    const t = tl.at('car_bump');
    const v = this.traffic.byId.bumper;
    const p = this._spatial((tt) => v.kin.pose(tt), t, t + 0.1, 0.05, 10)[0];
    S.crunch(t, 0.9 * p.gain * 2.2, p.pan, bus, rev);
    // car alarm (electric — keeps going in the silence)
    const suv = this.traffic.byId.suv;
    const pts = this._spatial((tt) => suv.kin.pose(tt), t + 0.35, CONFIG.duration + 1, 1 / 15, 10);
    S.alarm(t + 0.35, CONFIG.duration + 1, pts, bus, rev, this);
  }

  _body(S, bus, tl) {
    const ctx = S.ctx, end = CONFIG.duration + 1;
    // breathing: driven by the breathRate curve
    let t = 9.2, i = 0;
    while (t < end) {
      const rate = SCRIPT_TRACKS.breathRate.value(t);
      const period = 60 / rate;
      const hyp = SCRIPT_TRACKS.hypoxia.value(t);
      const vol = 0.05 + 0.2 * Math.min(1, hyp * 2.2);
      S.breath(t, period * 0.42, 1, vol, bus);
      S.breath(t + period * 0.45, period * 0.5, 0, vol * 0.85, bus);
      t += period; i++;
    }
    // heartbeat
    t = 9.8;
    while (t < end) {
      const bpm = SCRIPT_TRACKS.heartRate.value(t);
      const hyp = SCRIPT_TRACKS.hypoxia.value(t);
      const vol = MathX.smooth(t, 9.8, 11.5) * (0.25 + 0.35 * hyp);
      S.heart(t, vol, bus);
      t += 60 / bpm;
    }
    // ringing in the ears as hypoxia deepens
    S.ring(11.2, end - 11.2, 6900, 0.009, bus, true);
  }

  _distant(S, rev) {
    // far-off crashes: the same thing is happening across the city
    S.farBoom(10.3, 0.22, -0.5, rev);
    S.farBoom(12.9, 0.18, 0.6, rev);
    S.farBoom(14.2, 0.14, -0.2, rev);
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

  farBoom(t, vol, pan, dest) {
    const ctx = this.ctx, n = this.noise('brown', t, t + 2), lp = this.filter('lowpass', 160, 0.7), g = ctx.createGain();
    this.env(g, t, 0.05, vol, 1.6); n.connect(lp); lp.connect(g); g.connect(this.panned(dest, pan));
  }
}
