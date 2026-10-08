/* =====================================================================
   SOUNDTRACK — "What if water lost all surface tension?"
   The sound idea: water's voice is made of DROPS — the plip of a drip,
   the patter of rain, the gurgle of a tap are drops snapping shut and
   bubbles popping, all held together by surface tension. When it goes
   (1.75 s, a taut string goes slack) water loses its voice: the tap
   only hisses, the sponge pours in silence, the rain arrives as one
   soft roar of mist with no patter at all. Around it: a quiet kitchen,
   a garden full of birds that thins out over the accelerated days, the
   storm, and a slow chord for the closing line.
   Buses: ROOM (kitchen / outdoors, switched at the cuts), WATER, MUSIC.
   ===================================================================== */

class NstAudio extends AudioEngine {
  constructor(tl, app) { super(tl); this.app = app; this.wavName = SCRIPT.meta.wav; }
  fingerprintData() { return [NST, NST_K, NST_G]; }
  async renderOffline() { const buf = await super.renderOffline(); AudioEngine.declick(buf, 0.15); return buf; }

  _build(ctx) {
    const S = new SoundKit(ctx, CONFIG.seed), end = CONFIG.duration;
    // offline-render safe envelopes (no sub-block exponential ramps from silence)
    S.env = (g, t, a, peak, d) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(Math.max(0.0002, peak), t + Math.max(a, 0.006)); g.gain.setTargetAtTime(0, t + Math.max(a, 0.006), Math.max(0.004, d / 4)); };
    const tone = S.tone.bind(S);
    S.tone = (t, dur, f, vol, pan, dest, type = 'sine', attack = 0.01, release = null) => tone(t, dur, f, vol, pan, dest, type, Math.max(attack, 0.006), release);
    // mix → make-up gain → glue compressor → limiter, a fade in and out
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.attack.value = 0.006; comp.release.value = 0.25;
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -2.5; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.12;
    const mixIn = ctx.createGain(); mixIn.gain.value = 4.8; mixIn.connect(comp);
    const out = ctx.createGain(); comp.connect(out); out.connect(lim); lim.connect(ctx.destination);
    out.gain.setValueAtTime(0, 0); out.gain.linearRampToValueAtTime(0.9, 0.08);
    out.gain.setValueAtTime(0.9, end - 1.6); out.gain.linearRampToValueAtTime(0, end);
    this.S = S;
    this.rev = S.reverb(1.1); const rs = ctx.createGain(); rs.gain.value = 0.3; this.rev.connect(rs); rs.connect(mixIn);
    this.revBig = S.reverb(3.2); const rb = ctx.createGain(); rb.gain.value = 0.35; this.revBig.connect(rb); rb.connect(mixIn);
    const room = ctx.createGain(); room.connect(mixIn);
    const water = ctx.createGain(); water.connect(mixIn);
    const music = ctx.createGain(); music.connect(mixIn);
    this._kitchen(S, room);
    this._outdoors(S, room);
    this._water(S, water);
    this._foley(S, room);
    this._storm(S, room, water);
    this._music(S, music);
  }

  // a gain curve sampled from fn(t) (linear ramps every dt)
  _curve(param, fn, t0, t1, dt = 0.05) {
    param.setValueAtTime(fn(t0), t0);
    for (let t = t0 + dt; t <= t1 + 1e-6; t += dt) param.linearRampToValueAtTime(fn(t), t);
  }

  // a noise band: type, band-pass centre / Q (or [hp, lp]), its gain curve gfn(t) over [t0, t1]
  _band(S, dest, type, band, t0, t1, gfn, pan = 0, dt = 0.05) {
    const ctx = S.ctx, n = S.noise(type, t0, t1 + 0.1), g = ctx.createGain();
    let head;
    if (band.length === 2 && band[1] > 40) { const hp = S.filter('highpass', band[0], 0.6), lp = S.filter('lowpass', band[1], 0.6); n.connect(hp); hp.connect(lp); head = lp; }
    else { const bp = S.filter('bandpass', band[0], band[1]); n.connect(bp); head = bp; }
    head.connect(g); g.connect(pan ? S.panned(dest, pan) : dest);
    this._curve(g.gain, gfn, t0, t1, dt);
    return { n, g, head };
  }

  /* the kitchen (0 → the cut outside): room tone, the fridge, the garden faint through the window, a drip before the change */
  _kitchen(S, bus) {
    const ctx = S.ctx, T = NST, t1 = T.pond;
    const cut = (t) => 1 - MathX.smooth(t, t1 - 0.03, t1);
    this._band(S, bus, 'pink', [80, 900], 0, t1 + 0.05, (t) => 0.05 * cut(t));
    for (const [f, v] of [[50, 0.006], [100, 0.004], [150, 0.0015]]) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f; o.connect(g); g.connect(bus);
      this._curve(g.gain, (t) => v * cut(t), 0, t1 + 0.05, 0.1); o.start(0); o.stop(t1 + 0.2);
    }
    // birds outside, muffled by the glass
    const lp = S.filter('lowpass', 2600, 0.5), bg = ctx.createGain(); bg.gain.value = 0.5; lp.connect(bg); bg.connect(bus);
    const r = new RNG(CONFIG.seed + 11);
    for (let t = 0.3; t < t1 - 0.3; t += r.range(0.6, 1.8)) { const n = r.int(2, 4), f = r.range(2600, 4200), pan = r.range(-0.6, 0.6); for (let k = 0; k < n; k++) S.chirp(t + k * r.range(0.08, 0.13), f * r.range(0.92, 1.1), r.range(0.006, 0.012), pan, lp); }
    // a dripping tap somewhere, a drop every 0.7 s … until drops stop existing
    for (const t of [0.15, 0.85, 1.55]) this._plip(S, t, 0.05, -0.25, bus);
    // a clock on the wall: you can hear how quiet the water has gone
    for (let t = 2.6; t < t1; t += 1.0) S.tone(t, 0.03, 2400, 0.0016, 0.5, bus, 'square', 0.006, 0.02);
  }

  // a drop falling into water: a short tone that sweeps up (the bubble a drop traps) + a tiny splash
  _plip(S, t, vol, pan, dest) {
    const ctx = S.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(900, t); o.frequency.exponentialRampToValueAtTime(2100, t + 0.05);
    S.env(g, t, 0.003, vol, 0.07); o.connect(g); g.connect(S.panned(dest, pan)); o.start(t); o.stop(t + 0.15);
    const n = S.noise('white', t, t + 0.06), bp = S.filter('bandpass', 5200, 1.5), ng = ctx.createGain();
    S.env(ng, t, 0.002, vol * 0.25, 0.03); n.connect(bp); bp.connect(ng); ng.connect(S.panned(dest, pan));
    const sg = ctx.createGain(); sg.gain.value = 0.6; g.connect(sg); sg.connect(this.rev);
  }

  /* outdoors (the pond → the end): air, leaves, birds and insects that thin out as the garden wilts; crickets at night */
  _outdoors(S, bus) {
    const ctx = S.ctx, T = NST, t0 = T.pond, end = CONFIG.duration + 0.3;
    const on = (t) => MathX.smooth(t, t0 - 0.02, t0 + 0.02);
    const day = (t) => (t < T.lapse ? 1 : nstDaylight(nstDay(t)));
    const life = (t) => (1 - 0.8 * nstWilt(t)) * (1 - nstStorm(t));
    this._band(S, bus, 'pink', [120, 1600], t0 - 0.05, end, (t) => on(t) * (0.05 + 0.02 * MathX.smooth(t, T.clouds - 1, T.rain)) * (1 - 0.5 * nstRain(t)), 0, 0.1);
    // leaves: a slow-moving brighter band (wind gusts)
    this._band(S, bus, 'pink', [2200, 0.7], t0 - 0.05, end, (t) => on(t) * 0.012 * (0.6 + 0.4 * Math.sin(t * 0.7) * Math.sin(t * 0.31 + 1)) * (1 + 1.5 * MathX.smooth(t, T.clouds - 1, T.rain)), 0.3, 0.1);
    const r = new RNG(CONFIG.seed + 21);
    // birds (daylight, while things are alive)
    for (let t = t0 + 0.1; t < T.rain; t += r.range(0.35, 1.2)) {
      const v = 0.024 * life(t) * day(t); if (v < 0.002) continue;
      const n = r.int(2, 5), f = r.range(2600, 4600), pan = r.range(-0.8, 0.8);
      for (let k = 0; k < n; k++) S.chirp(t + k * r.range(0.07, 0.12), f * r.range(0.9, 1.12), v * r.range(0.5, 1), pan, k % 2 ? this.rev : bus);
    }
    // insects over the pond: a buzzing whine that comes and goes (pond + bench)
    const o = ctx.createOscillator(), og = ctx.createGain(), ol = S.filter('bandpass', 520, 3); o.type = 'sawtooth';
    this._curve(o.frequency, (t) => 230 + 18 * Math.sin(t * 7.3) + 9 * Math.sin(t * 13.1), t0, T.lapse, 0.05);
    this._curve(og.gain, (t) => on(t) * 0.0035 * Math.max(0, Math.sin(t * 0.9 + 0.4)) * (1 - MathX.smooth(t, T.lapse - 0.3, T.lapse)), t0, T.lapse + 0.05, 0.05);
    o.connect(ol); ol.connect(og); og.connect(S.panned(bus, 0.4)); o.start(t0); o.stop(T.lapse + 0.2);
    // crickets at night during the time-lapse
    for (let t = T.lapse0; t < T.lapse1 + 0.5; t += 0.09) {
      const night = 1 - day(t); if (night < 0.15) continue;
      S.tone(t, 0.035, 4300 + 200 * Math.sin(t * 3), 0.0035 * night * (1 - 0.6 * nstWilt(t)), Math.sin(t * 1.7) * 0.6, bus, 'sine', 0.006, 0.02);
    }
  }

  /* water — before the change it drips and plinks; after, it only hisses */
  _water(S, bus) {
    const ctx = S.ctx, T = NST, K = NST_K;
    // the brimming glass and the beads letting go (1.75 →): a soft wet slump each, a hiss of the overflow running out
    NST_K.beads.forEach(([x, z, ml], i) => {
      const t = T.drop + 0.03 * i + hash1(i + 4) * 0.05 + 0.04;
      this._band(S, bus, 'pink', [380, 1.2], t, t + 0.35, (u) => 0.05 * Math.sqrt(ml) * MathX.smooth(u, t, t + 0.03) * (1 - MathX.smooth(u, t + 0.05, t + 0.33)), (x + 0.6) * 4, 0.01);
    });
    this._band(S, bus, 'white', [2600, 1.0], T.drop, T.drop + 1.6, (u) => 0.045 * MathX.smooth(u, T.drop, T.drop + 0.15) * (1 - MathX.smooth(u, T.drop + 0.5, T.drop + 1.55)), 0.15, 0.02);
    // the tap: no gurgle, no splash — a smooth hiss, like poured sand (on from the lever until you go outside)
    const on = (t) => MathX.smooth(t, T.tapOn, T.tapOn + 0.35) * (1 - MathX.smooth(t, T.pond - 0.03, T.pond));
    const near = (t) => (t < T.clip ? 1 : 0.4);                // off-camera after the cut, still running
    this._band(S, bus, 'white', [4800, 0.8], T.tapOn - 0.05, T.pond + 0.05, (t) => 0.075 * on(t) * near(t) * (0.9 + 0.1 * Math.sin(t * 9.1)), 0.15, 0.03);
    this._band(S, bus, 'pink', [600, 0.9], T.tapOn - 0.05, T.pond + 0.05, (t) => 0.045 * on(t) * near(t), 0.1, 0.05);
    // the sponge: lifted out, and the water just pours off it — in a hush
    this._band(S, bus, 'white', [3800, 0.9], T.spongeUp, T.pond, (t) => 0.04 * MathX.smooth(t, T.spongeUp + 0.1, T.spongeUp + 0.4) * (1 - MathX.smooth(t, T.spongeUp + 1.8, T.pond - 0.1)), 0.3, 0.03);
    // the watering can: a hiss into the soil, and run-off sheeting off the bench without a single drip
    this._band(S, bus, 'white', [3300, 0.8], T.pour, T.pourEnd + 0.5, (t) => 0.05 * MathX.smooth(t, T.pour + 0.2, T.pour + 0.5) * (1 - MathX.smooth(t, T.pourEnd - 0.2, T.pourEnd + 0.15)), -0.1, 0.03);
    this._band(S, bus, 'pink', [900, 1.4], T.pour + 0.8, T.wick, (t) => 0.03 * MathX.smooth(t, T.pour + 0.9, T.pour + 1.6) * (1 - MathX.smooth(t, T.wick - 0.05, T.wick)), 0.2, 0.05);
  }

  /* things you touch */
  _foley(S, bus) {
    const ctx = S.ctx, T = NST;
    S.click(T.tapOn, 0.06, 0.2, bus); S.click(T.tapOn + 0.06, 0.03, 0.2, bus);
    // the paperclip touches the water (nothing holds it), then a glass tink on the bottom of the dish
    S.pluck(T.clipLet + 0.36, 3150, 0.05, 0.05, bus, 0.5, 0.9); S.pluck(T.clipLet + 0.38, 5200, 0.02, 0.05, bus, 0.3, 0.9);
    // the paper towel: a dry rustle as it comes down
    this._band(S, bus, 'white', [3000, 0.6], T.towel, T.towelIn + 0.2, (t) => 0.02 * MathX.smooth(t, T.towel, T.towel + 0.1) * (0.5 + 0.5 * Math.abs(Math.sin(t * 23))) * (1 - MathX.smooth(t, T.towelIn - 0.1, T.towelIn + 0.15)), 0.1, 0.02);
    // the sponge: a squeeze
    this._band(S, bus, 'pink', [700, 1.5], T.sponge + 0.05, T.sponge + 0.5, (t) => 0.06 * MathX.smooth(t, T.sponge + 0.05, T.sponge + 0.1) * (1 - MathX.smooth(t, T.sponge + 0.12, T.sponge + 0.45)), 0.2, 0.01);
    // the strider: no plip as it goes under — just a tiny soft fizz
    this._band(S, bus, 'white', [6500, 1.2], T.strider + 0.1, T.strider + 0.6, (t) => 0.012 * MathX.smooth(t, T.strider + 0.1, T.strider + 0.15) * (1 - MathX.smooth(t, T.strider + 0.2, T.strider + 0.55)), 0, 0.01);
    // the watering can lifted: a slosh
    this._band(S, bus, 'pink', [450, 1.2], T.bench + 0.2, T.bench + 1.2, (t) => 0.03 * Math.max(0, Math.sin((t - T.bench - 0.2) * Math.PI)), -0.2, 0.02);
    // the umbrella: opened over you
    this._band(S, bus, 'white', [1800, 0.8], T.umb - 0.5, T.umb + 0.1, (t) => 0.04 * MathX.smooth(t, T.umb - 0.5, T.umb - 0.1) * (1 - MathX.smooth(t, T.umb - 0.05, T.umb + 0.08)), 0.3, 0.01);
    S.click(T.umb + 0.05, 0.05, 0.3, bus);
    // the cuts outside: a soft air shift
    for (const t of [T.pond, T.bench, T.lapse]) this._band(S, bus, 'pink', [400, 3000], t - 0.25, t + 0.3, (u) => 0.03 * MathX.smooth(u, t - 0.25, t) * (1 - MathX.smooth(u, t, t + 0.3)), 0, 0.02);
  }

  /* the time-lapse days, the clouds, the rain (a roar of mist with no patter), the hiss on the umbrella, thunder */
  _storm(S, bus, water) {
    const ctx = S.ctx, T = NST, end = CONFIG.duration + 0.3;
    // each passing day: a long airy whoosh, centred on midday
    for (let d = 1.5; d <= 3.0; d += 1) {
      // when nstDay(t) crosses d (search the lapse window)
      let tc = null; for (let t = T.lapse0; t < T.lapse1; t += 0.02) if (nstDay(t) >= d) { tc = t; break; }
      if (tc === null) continue;
      this._band(S, bus, 'pink', [900, 0.7], tc - 1.4, tc + 1.4, (u) => 0.035 * Math.pow(Math.sin(MathX.clamp((u - tc + 1.4) / 2.8, 0, 1) * Math.PI), 2), Math.sin(d * 2) * 0.5, 0.04);
    }
    // wind rising with the clouds
    this._band(S, bus, 'brown', [60, 700], T.clouds - 1, end, (t) => 0.05 * MathX.smooth(t, T.clouds - 1, T.rain + 1) * (0.75 + 0.25 * Math.sin(t * 0.5)), 0, 0.1);
    // rain: one smooth, soft roar (no drops, no patter); brighter and closer under the umbrella
    const R = (t) => nstRain(t);
    this._band(S, water, 'pink', [500, 7000], T.rain - 0.6, end, (t) => 0.048 * R(t) * (t > T.drone ? 1.1 : 1), 0, 0.05);
    this._band(S, water, 'white', [5200, 0.7], T.rain - 0.6, end, (t) => 0.018 * R(t) * (1 + 1.4 * MathX.smooth(t, T.umb - 0.3, T.umb + 1.5) * (1 - MathX.smooth(t, T.drone - 0.1, T.drone + 0.6))), 0.2, 0.05);
    // thunder: far before the rain, then with the lightning
    S.farBoom(T.clouds + 0.7, 0.12, -0.5, this.revBig);
    for (const [t, v] of [[58.45, 0.22], [58.7, 0.13], [64.35, 0.19]]) { S.boom(t + 0.25, v, bus, this.revBig); S.farBoom(t + 0.1, v * 0.8, -0.3, this.revBig); }
  }

  /* music: the slack string at the change, a soft pulse for the kitchen, a warm pad that sours as the plants wilt,
     a held low note in the storm, and the closing chord */
  _music(S, bus) {
    const ctx = S.ctx, T = NST, end = CONFIG.duration;
    const lp = S.filter('lowpass', 2400, 0.5), mb = ctx.createGain(); mb.gain.value = 1; lp.connect(mb); mb.connect(bus);
    const sendR = ctx.createGain(); sendR.gain.value = 0.5; lp.connect(sendR); sendR.connect(this.revBig);
    // the title: a taut string, plucked … and it goes slack with the readout (72 → 0)
    {
      const o = ctx.createOscillator(), g = ctx.createGain(), f = S.filter('lowpass', 3000, 2); o.type = 'sawtooth';
      o.frequency.setValueAtTime(587, 0.35); o.frequency.setValueAtTime(587, T.drop); o.frequency.exponentialRampToValueAtTime(98, T.zero + 0.6);
      f.frequency.setValueAtTime(3000, T.drop); f.frequency.exponentialRampToValueAtTime(300, T.zero + 0.6);
      g.gain.setValueAtTime(0, 0.35); g.gain.linearRampToValueAtTime(0.03, 0.4); g.gain.setTargetAtTime(0.012, 0.4, 0.5);
      g.gain.setValueAtTime(0.018, T.drop); g.gain.linearRampToValueAtTime(0.03, T.drop + 0.05); g.gain.setTargetAtTime(0, T.drop + 0.1, 0.35);
      o.connect(f); f.connect(g); g.connect(lp); o.start(0.35); o.stop(T.zero + 2.5);
      // and a low thud as it lets go
      S.thump(T.drop + 0.02, 0.22, bus);
    }
    // a soft two-note pulse under the kitchen beats (D–A, very quiet), a new note at each new consequence
    const beats = [T.tap, T.clip, T.towel, T.sponge, T.pond, T.bench, T.wick];
    for (let t = T.zero + 0.6; t < T.lapse - 0.2; t += 0.75) {
      const k = beats.filter((b) => b <= t).length, f = [146.8, 164.8, 174.6, 196, 220, 196, 174.6, 164.8][k % 8];
      S.tone(t, 0.5, f, 0.02, 0, lp, 'triangle', 0.02, 0.45);
      S.tone(t + 0.375, 0.35, f * 1.5, 0.01, 0.2, lp, 'sine', 0.02, 0.3);
    }
    // a hit on each cut to a new consequence
    for (const t of beats) S.tone(t, 1.2, 73.4, 0.05, 0, lp, 'sine', 0.008, 1.1);
    // the time-lapse: a warm pad (D major-ish) that loses its third and slides flat as the garden wilts; ticks speed up
    const pad = [[146.8, 0.018], [220, 0.013], [293.7, 0.01], [370, 0.009], [440, 0.006]];
    for (const [f, v] of pad) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle';
      const sour = f === 370 ? 0.94 : 0.985;                 // the third sinks toward minor
      this._curve(o.frequency, (t) => f * MathX.lerp(1, sour, nstWilt(t)), T.lapse - 0.1, T.clouds + 2, 0.1);
      this._curve(g.gain, (t) => v * MathX.smooth(t, T.lapse - 0.1, T.lapse + 1.2) * (1 - MathX.smooth(t, T.clouds, T.clouds + 2)), T.lapse - 0.1, T.clouds + 2, 0.1);
      o.connect(g); g.connect(lp); o.start(T.lapse - 0.1); o.stop(T.clouds + 2.2);
    }
    for (let t = T.lapse0; t < T.lapse1;) { S.tone(t, 0.03, 1900, 0.004, 0.3, lp, 'square', 0.006, 0.02); t += MathX.lerp(0.5, 0.22, MathX.smooth(t, T.lapse0, T.lapse0 + 4)); }
    // the storm: a held low D with a slow beating fifth
    for (const [f, v] of [[73.4, 0.02], [110.4, 0.01], [146.8, 0.006]]) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f;
      this._curve(g.gain, (t) => v * MathX.smooth(t, T.rain, T.rain + 3) * (1 - MathX.smooth(t, T.drone, T.drone + 1)), T.rain, T.drone + 1.1, 0.1);
      o.connect(g); g.connect(lp); o.start(T.rain); o.stop(T.drone + 1.3);
    }
    // the closing chord (D minor add9 → D with the third on the last line), rising under the payoff
    const chord = (t0, t1, notes, v) => {
      for (const [f, w] of notes) {
        for (const det of [0.997, 1.003]) {
          const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = f * det;
          g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v * w, t0 + 1.2); g.gain.setValueAtTime(v * w, t1 - 0.6); g.gain.linearRampToValueAtTime(0, t1);
          o.connect(g); g.connect(lp); o.start(t0); o.stop(t1 + 0.1);
        }
      }
    };
    chord(T.drone, T.line2 + 0.3, [[73.4, 1.2], [146.8, 1], [220, 0.8], [329.6, 0.5], [349.2, 0.6]], 0.009);
    chord(T.line2, end, [[73.4, 1.2], [146.8, 1], [220, 0.8], [293.7, 0.6], [370, 0.6], [440, 0.4]], 0.01);
  }
}
