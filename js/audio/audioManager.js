/* =====================================================================
   AUDIO MANAGER — the whole temporary soundtrack is synthesised with the
   Web Audio API (no sound files). It is rendered once, offline, into a
   single stereo buffer that is perfectly in sync with the timeline:
   playing from any time t just starts that buffer at offset t.
   The same buffer can be exported as a WAV for editing.

   Cues: city ambience, birds, footsteps, car engines with distance /
   pan / Doppler, tyre noise, sputtering, grill sizzle, angle grinder,
   oxygen-drop ticks, eardrum thump + ear pop + muffling (no 'boom': O₂ vanishing
   everywhere at once makes no pressure wave), crash, car alarm, mains hum that
   dies with the grid, lighter clicks, electric-car hum, air-brake hiss,
   breathing, heartbeat, ringing.
   ===================================================================== */

class AudioManager extends AudioEngine {
  constructor(tl, traffic) {
    super(tl);
    this.traffic = traffic;
    this.wavName = 'what-if-oxygen-soundtrack.wav';
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
    const tPop = 2.05;   // the big pressure step (O₂ 15 → 3 %)
    f.setValueAtTime(18000, tPop + 0.02);
    f.exponentialRampToValueAtTime(520, tPop + 0.09);
    f.exponentialRampToValueAtTime(5200, tPop + 1.3);
    f.exponentialRampToValueAtTime(9000, tPop + 3.0);
    f.setValueAtTime(9000, 9.8);
    f.exponentialRampToValueAtTime(5200, 12.5);
    f.exponentialRampToValueAtTime(1900, 15.0);
    // holding your breath: hearing steadies; the lost moment dulls it; CO₂ and then the forced breath close it down
    f.exponentialRampToValueAtTime(3400, 19.0);
    f.setValueAtTime(3400, 21.3); f.exponentialRampToValueAtTime(700, 21.45); f.exponentialRampToValueAtTime(3600, 22.4);
    f.setValueAtTime(3600, 44.6); f.exponentialRampToValueAtTime(2200, 49.5);
    f.exponentialRampToValueAtTime(1300, 51.5); f.exponentialRampToValueAtTime(650, 54.0); f.exponentialRampToValueAtTime(320, 57.5);
    // leaving the body: the cinematic sound world opens up
    f.setValueAtTime(320, 59.9); f.exponentialRampToValueAtTime(14000, 60.4);
    // ~1 s of complete silence before the camera leaves the body; a fade at the very end
    out.gain.setValueAtTime(0.9, 58.2); out.gain.linearRampToValueAtTime(0.0001, 58.45);
    out.gain.setValueAtTime(0.0001, 59.5); out.gain.linearRampToValueAtTime(0.9, 60.4);
    out.gain.setValueAtTime(0.9, 87.6); out.gain.linearRampToValueAtTime(0.0001, 89.9);

    this._city(S, bus, revSend, tZero);
    this._birds(S, bus, tZero);
    this._footsteps(S, bus);
    this._vehicles(S, bus, revSend);
    this._grill(S, bus, tl);
    this._grinder(S, bus, revSend, tl);
    this._oxygenEvent(S, bus, revSend, tl);
    this._crash(S, bus, revSend, tl);
    this._body(S, bus, tl);
    this._grid(S, bus, tl);
    this._lighter(S, bus);
    this._viewerLighter(S, bus);
    this._distant(S, revSend);
    this._breathHold(S, bus);
    this._aircraft(S, bus, revSend);
    this._impactSound(S, bus, revSend);
    this._phones(S, bus, revSend);
    this._cinematic(S, ctx.destination);
  }

  /* -------------------- layers -------------------- */
  _city(S, bus, rev, tZero) {
    const ctx = S.ctx, end = 59.6;
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
    while (t < tZero + 0.5) {
      const frantic = t > tZero;
      const n = rng.int(2, frantic ? 6 : 4);
      const base = rng.range(2600, 4600), pan = rng.range(-0.8, 0.8), vol = rng.range(0.012, 0.03) * (frantic ? 0.8 : 1);
      for (let k = 0; k < n; k++) S.chirp(t + k * rng.range(0.07, 0.13), base * rng.range(0.9, 1.15), vol, pan, bus, frantic);
      t += frantic ? rng.range(0.25, 0.7) : rng.range(0.18, 0.55);
    }
    // a few panicked wing flaps as birds fall (distant)
    for (let k = 0; k < 7; k++) S.flap(1.9 + k * 0.12, rng.range(-0.6, 0.6), 0.03, bus);                // flock scatters
    for (let k = 0; k < 6; k++) S.flap(10.4 + k * 0.5 + rng.range(0, 0.2), rng.range(-0.4, 0.4), 0.018, bus);  // faltering
  }

  _footsteps(S, bus) {
    // steps while the viewer walks (same stride as the camera bob)
    const camTx = this.cx, camTz = this.cz;
    let dist = 0, last = 0, px = camTx.value(0), pz = camTz.value(0);
    const stride = 1 / CONFIG.camera.bobFrequency;
    let side = 1;
    for (let t = 0; t < CONFIG.duration; t += 1 / 240) {
      const x = camTx.value(t), z = camTz.value(t);
      const dd = Math.hypot(x - px, z - pz);
      if (dd > 0.2 || t > 53) { px = x; pz = z; last = dist; continue; }   // a cut, or on your knees
      dist += dd; px = x; pz = z;
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
        if (!on && rng.next() < 0.5 && tt < this.tl.at('o2_zero') - 0.05) S.backfire(tt, 0.12, bus, moto);
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
    const pos = { x: LAYOUT.works.poleX - 0.4, z: LAYOUT.works.z };
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
    this._applySpatial(pts.filter((q) => q.t <= tStop + 0.05), sg.gain, sp.pan, [], 0.5, (t) => (t > 1.85 && t < 2.27 ? 0.02 : 0.75 + 0.25 * Math.sin(t * 13) * Math.sin(t * 3.1)));
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
    // at 0 %: no explosion (nothing moves in the air) — it's INSIDE your head: eardrum thump + pop
    // the middle ear vents every few kPa: a crackle of pops as pressure falls (most of it by ~2.1 s),
    // one deep thump at the big step, and an involuntary exhale as the air in your lungs expands
    for (const [tp, v] of [[1.48, 0.12], [1.66, 0.16], [1.8, 0.2], [1.92, 0.24], [2.05, 0.42], [2.2, 0.18], [2.34, 0.12]]) S.pop(tp, v, bus);
    S.thump(2.03, 0.7, bus);
    S.breath(2.08, 0.6, 0, 0.13, bus);
    // pressure ringing afterwards
    S.ring(tZ + 0.1, 1.8, 7400, 0.012, bus);
  }

  _crash(S, bus, rev, tl) {
    const t = tl.at('car_bump');
    const v = this.traffic.vehicles.find((x) => x.spec.contact);
    if (!v) return;
    const p = this._spatial((tt) => v.kin.pose(tt), t, t + 0.1, 0.05, 10)[0];
    S.crunch(t, Math.min(0.9, 0.9 * p.gain * 2.2), p.pan, bus, rev);
    // car alarm on the car that got hit (battery powered — keeps going in the silence)
    const hit = this.traffic.byId[v.spec.contact.leader];
    const pts = this._spatial((tt) => hit.kin.pose(tt), t + 0.35, 58.3, 1 / 15, 10);
    S.alarm(t + 0.35, 58.3, pts, bus, rev, this);
  }

  _body(S, bus, tl) {
    const ctx = S.ctx, end = 58.2;
    const hold = SCRIPT_TRACKS.breathHold, H = SCRIPT.hud;
    // breathing: driven by the breathRate curve; nothing while the breath is held
    let t = 9.2, i = 0;
    while (t < end) {
      if (hold.value(t) > 0.5) { t = H.breathUntil + 0.05; continue; }
      const rate = SCRIPT_TRACKS.breathRate.value(t);
      const period = 60 / rate;
      const hyp = SCRIPT_TRACKS.hypoxia.value(t);
      const after = t > H.breathUntil;            // after the forced breath: fast, shallow, then fading
      const vol = (0.03 + 0.11 * Math.min(1, hyp * 2.0)) * (after ? MathX.lerp(1.3, 0.25, MathX.smooth(t, 53, 57.5)) : 1);
      S.breath(t, period * 0.42, 1, vol, bus);
      if (hold.value(t + period * 0.45) < 0.5) S.breath(t + period * 0.45, period * 0.5, 0, vol * 0.85, bus);
      t += period; i++;
    }
    // heartbeat: louder as CO₂ builds, slowing to nothing
    t = 9.8;
    while (t < end) {
      const bpm = SCRIPT_TRACKS.heartRate.value(t);
      const hyp = SCRIPT_TRACKS.hypoxia.value(t);
      const vol = MathX.smooth(t, 9.8, 11.5) * (0.25 + 0.35 * hyp + 0.3 * SCRIPT_TRACKS.co2.value(t)) * (1 - MathX.smooth(t, 55.5, 58.1));
      S.heart(t, vol, bus);
      t += 60 / bpm;
    }
    // ringing in the ears as hypoxia deepens
    S.ring(11.2, end - 11.2, 6900, 0.009, bus, true);
  }

  // the held breath: a sharp inhale, the throat closes; swallows; diaphragm spasms; the forced gasp
  _breathHold(S, bus) {
    const H = SCRIPT.hud, t0 = H.breathFrom, t1 = H.breathUntil;
    S.breath(t0 - 0.5, 0.5, 1, 0.16, bus);              // one last breath in
    S.click(t0 + 0.02, 0.06, 0, bus);                   // glottis shuts
    for (const ts of [26.4, 33.0, 41.2]) { S.click(ts, 0.035, 0, bus); S.thump(ts + 0.05, 0.08, bus); }   // swallows
    for (const ts of SCRIPT.camera.spasms || []) { S.thump(ts, 0.22, bus); S.click(ts + 0.03, 0.05, 0, bus); }
    S.gasp(t1, 0.5, bus);                               // the body forces a breath
  }

  // the gliding airliner: windmilling fans (a thin whistle) and rushing air — no engine roar
  _aircraft(S, bus, rev) {
    const A = SCRIPT.aircraft.path, ctx = S.ctx;
    const ax = new SmoothTrack(A.map((k) => [k[0], k[1]])), ay = new SmoothTrack(A.map((k) => [k[0], k[2]])), az = new SmoothTrack(A.map((k) => [k[0], k[3]]));
    const t0 = A[0][0] - 1.5, t1 = A[A.length - 1][0];
    const g = ctx.createGain(), p = ctx.createStereoPanner(), lp = S.filter('lowpass', 2600, 0.6);
    g.connect(p); p.connect(bus);
    const s = ctx.createGain(); s.gain.value = 0.35; p.connect(s); s.connect(rev);
    const air = S.noise('pink', t0, t1), bp = S.filter('bandpass', 700, 0.7); air.connect(bp); bp.connect(lp);
    const whistles = [1240, 1872].map((f) => { const o = ctx.createOscillator(); o.frequency.value = f; const og = ctx.createGain(); og.gain.value = 0.05; o.connect(og); og.connect(lp); o.start(t0); o.stop(t1); return o; });
    lp.connect(g);
    for (let t = t0, i = 0; t <= t1 + 1e-6; t += 1 / 20, i++) {
      const tt = Math.max(A[0][0], t);
      const lx = this.cx.value(t), lz = this.cz.value(t), yaw = MathX.deg(this.cyaw.value(t));
      const dx = ax.value(tt) - lx, dy = ay.value(tt) - 1.85, dz = az.value(tt) - lz, d = Math.hypot(dx, dy, dz);
      const t2 = Math.min(tt + 0.05, t1), d2 = Math.hypot(ax.value(t2) - lx, ay.value(t2) - 1.85, az.value(t2) - lz);
      const dop = 343 / (343 + (d2 - d) / 0.05);
      const rx = Math.cos(yaw), rz = -Math.sin(yaw);
      const pan = MathX.clamp((dx * rx + dz * rz) / Math.max(1, Math.hypot(dx, dz)), -1, 1) * 0.8;
      const vol = Math.min(0.5, 60 / (60 + d)) * MathX.smooth(t, t0, t0 + 1.5) * (t > t1 - 0.4 ? 0.3 : 1);
      const fn = i === 0 ? 'setValueAtTime' : 'linearRampToValueAtTime';
      g.gain[fn](Math.max(0.0001, vol * 0.5), t); p.pan[fn](pan, t);
      whistles.forEach((o, k) => o.frequency[fn]([1240, 1872][k] * dop, t));
      bp.frequency[fn](700 * dop, t);
    }
  }

  // the impact, heard 1.5 s after it is seen: a deep thud and a long rolling rumble (no explosion)
  _impactSound(S, bus, rev) {
    const I = SCRIPT.impact, ctx = S.ctx;
    const d = Math.hypot(I.x - this.cx.value(I.t), I.z - this.cz.value(I.t)), t = I.t + d / 343;
    const lp = S.filter('lowpass', 520, 0.6); lp.connect(bus);
    const s = ctx.createGain(); s.gain.value = 0.8; lp.connect(s); s.connect(rev);
    S.boom(t, 0.55, lp, rev);
    S.farBoom(t + 0.15, 0.4, 0.35, lp);
    S.farBoom(t + 1.1, 0.22, 0.4, lp);
    S.crunch(t + 0.05, 0.12, 0.4, lp, rev);
  }

  // phones on the pavement ringing on battery (three different ringtones)
  _phones(S, bus, rev) {
    const tunes = [[[440, 480]], [[784], [659], [523], [659]], [[1400], [0], [1400], [0]]];
    for (const ph of SCRIPT.phones || []) {
      const pts = this._spatial(() => ph, ph.t0, 58.2, 1 / 4, 3);
      const p = pts[0];
      const mean = pts.reduce((a, q) => a + q.gain, 0) / pts.length;
      for (let t = ph.t0; t < 58.2; t += 3.0) {
        const tune = tunes[ph.tune % tunes.length];
        if (ph.tune === 0) { S.tone(t, 0.9, 440, mean * 0.06, p.pan, bus); S.tone(t, 0.9, 480, mean * 0.06, p.pan, bus); S.tone(t + 1.1, 0.9, 440, mean * 0.06, p.pan, bus); S.tone(t + 1.1, 0.9, 480, mean * 0.06, p.pan, bus); }
        else tune.forEach((f, k) => { if (f[0]) S.tone(t + k * 0.22, 0.2, f[0], mean * 0.07, p.pan, bus, 'triangle'); });
      }
    }
  }

  // leaving the body: high wind over the avenue, then a low, slow drone for the planet and the last line
  _cinematic(S, dest) {
    const ctx = S.ctx, end = CONFIG.duration + 1.4;
    const wind = S.noise('pink', 59.8, 68.5), wb = S.filter('bandpass', 380, 0.5), wg = ctx.createGain();
    wg.gain.setValueAtTime(0.0001, 59.8); wg.gain.linearRampToValueAtTime(0.12, 61.2); wg.gain.linearRampToValueAtTime(0.18, 66.5); wg.gain.linearRampToValueAtTime(0.0001, 68.4);
    wind.connect(wb); wb.connect(wg); wg.connect(dest);
    const pad = ctx.createGain(); pad.connect(dest);
    pad.gain.setValueAtTime(0.0001, 60.2); pad.gain.linearRampToValueAtTime(0.05, 64); pad.gain.linearRampToValueAtTime(0.08, 70); pad.gain.setValueAtTime(0.08, 86); pad.gain.linearRampToValueAtTime(0.0001, 89.8);
    for (const [f, a] of [[55, 0.5], [82.4, 0.32], [110.2, 0.18], [164.8, 0.08]]) {
      const o = ctx.createOscillator(); o.frequency.value = f; const og = ctx.createGain(); og.gain.value = a;
      o.connect(og); og.connect(pad); o.start(60.2); o.stop(end);
    }
    // a soft struck note for each closing line
    for (const [t, f] of [[69.2, 330], [73.6, 294], [79.2, 220], [85.6, 110]]) S.tone(t, 5.5, f, 0.045, 0, dest, 'sine', 0.01, 5.2);
  }

  _grid(S, bus, tl) {
    // background mains hum (shop fridges, AC, transformers) — gone when the grid collapses
    const ctx = S.ctx, g = SCRIPT.grid, end = CONFIG.duration + 1;
    const off = g && g.fail !== null && g.fail !== undefined ? g.fail : null;
    const hum = ctx.createGain(), lp = S.filter('lowpass', 900, 0.7);
    for (const [f, a] of [[60, 0.5], [120, 0.35], [180, 0.18], [240, 0.08]]) {
      const o = ctx.createOscillator(); o.frequency.value = f; const og = ctx.createGain(); og.gain.value = a;
      o.connect(og); og.connect(lp); o.start(0); o.stop(end);
    }
    const fridge = S.noise('brown', 0, end), fb = S.filter('bandpass', 140, 1.5), fg = ctx.createGain(); fg.gain.value = 0.25;
    fridge.connect(fb); fb.connect(fg); fg.connect(lp);
    lp.connect(hum); hum.connect(bus);
    hum.gain.setValueAtTime(0.022, 0);
    if (off !== null) {
      // stutter, then silence + a relay clunk
      for (let k = 0; k < 6; k++) { const tt = off - 0.25 + k * 0.08; hum.gain.setValueAtTime(k % 2 ? 0.022 : 0.006, tt); }
      hum.gain.setValueAtTime(0.022, off + 0.1);
      hum.gain.exponentialRampToValueAtTime(0.0001, off + 0.45);
      S.clunk(off + 0.42, 0.18, 0.3, bus);
    }
  }

  _lighter(S, bus) {
    const v = SCRIPT.people.find((p) => p.id === 'vendor');
    const st = v && v.states.find((s) => s[1] === 'lighter');
    if (!st) return;
    const i0 = v.states.indexOf(st), t0 = st[0], t1 = v.states[i0 + 1] ? v.states[i0 + 1][0] : t0 + 2;
    const pos = { x: v.path[0][1], z: v.path[0][2] };
    for (let t = t0 + 0.15; t < t1; t += 0.5) {
      const p = this._spatial(() => pos, t, t + 0.01, 0.01, 3)[0];
      S.click(t, 0.09 * p.gain * 3, p.pan, bus);
    }
  }

  _viewerLighter(S, bus) {
    // the viewer's own piezo lighter: loud click, a short hiss of gas that never lights
    for (const f of (SCRIPT.hands && SCRIPT.hands.flicks) || []) {
      S.click(f, 0.32, 0.15, bus);
      S.hiss(f + 0.02, 0.45, 0.025, 0.15, bus);
    }
  }

  _distant(S, rev) {
    // far-off crashes: the same thing is happening across the city
    S.farBoom(10.3, 0.22, -0.5, rev);
    S.farBoom(12.9, 0.18, 0.6, rev);
    S.farBoom(14.2, 0.14, -0.2, rev);
    S.farBoom(23.4, 0.12, 0.7, rev);
    S.farBoom(42.6, 0.1, -0.6, rev);
  }
}
