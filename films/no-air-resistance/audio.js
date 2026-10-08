/* =====================================================================
   AUDIO — "What if air resistance suddenly disappeared?"
   Sound is kept (the film's one exception, stated on screen): the air
   still carries it. What changes is that air and solids no longer push on
   each other, so nothing solid makes wind noise any more. Before NR.loss
   the 50 km/h wind is heard through what it moves on the roof (sheets
   cracking, bunting fluttering, the kite's line humming, the tablecloth)
   and as a rush round your head; at the loss all of that stops dead. The
   party's little speaker keeps playing. The storm's wind is silent: only
   its rain (water) is heard. Falling things make no whoosh: they are heard
   when they hit. The cloud's ice: single cracks at first, then a roar that
   grows as more and faster ice lands, the breakages one after another,
   and then, at NR.quiet, nothing but the rain and the car alarms below.
   Every cue is scheduled on STORY time; Edit.spliceAudio follows the cuts
   and the slow-motion drop.
   Bake: NODE_PATH=$(npm root -g) node tools/bake-soundtrack.cjs --page no-air-resistance.html --out films/no-air-resistance/soundtrack.js
   ===================================================================== */

class NrAudio extends AudioEngine {
  constructor(tl, app) { super(tl); this.app = app; this.wavName = SCRIPT.meta.wav; }
  // anything the sound depends on that is not inside SCRIPT (so a stale baked copy is detected)
  fingerprintData() { return [NR, NR_CAM, NR_PEOPLE, NR_ROOF, NR_ROOF_HITS, NR_HUT_HOLES, NR_SKY, NR_STONE.H0, NR_HAIL.R, NR_HAIL.x0, NR_HAIL.z1, NR_ICE.base, NR_ICE.top, NR_ICE.peak]; }

  // a soft ceiling just under full scale, and true silence after the cut to black
  async renderOffline() {
    const buf = await super.renderOffline(), sr = buf.sampleRate, black = Edit.film(NR.black);
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const o = buf.getChannelData(c);
      for (let i = 0; i < o.length; i++) {
        const t = i / sr, x = o[i], ax = Math.abs(x);
        if (t >= black) o[i] = 0;
        else if (t > black - 0.004) o[i] *= (black - t) / 0.004;
        else if (ax > 0.6) o[i] = Math.sign(x) * (0.6 + 0.2 * Math.tanh((ax - 0.6) / 0.2));
      }
    }
    return buf;
  }

  _kit(ctx) {
    const S = new SoundKit(ctx, CONFIG.seed);
    // offline-safe envelopes (Chrome's offline renderer clicks on very short exponential ramps)
    S.env = (g, t, a, peak, d) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(Math.max(0.0002, peak), t + Math.max(a, 0.004)); g.gain.setTargetAtTime(0, t + Math.max(a, 0.004), Math.max(0.004, d / 4)); };
    S.tone = (t, dur, f, vol, pan, dest, type = 'sine', attack = 0.01, release = null) => {
      if (vol <= 0.0005 || t < 0) return null; const o = ctx.createOscillator(), g = ctx.createGain(), r = release || dur * 0.3; o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + Math.max(0.006, attack)); g.gain.setValueAtTime(vol, t + Math.max(attack, dur - r)); g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(g); g.connect(S.panned(dest, pan)); o.start(t); o.stop(t + dur + 0.05); return o;
    };
    S.burst = (t, dur, f, q, vol, pan, dest, type = 'white', a = 0.004) => {
      if (t < 0) return null; const n = S.noise(type, t, t + dur + 0.05), b = S.filter('bandpass', f, q), g = ctx.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.setTargetAtTime(0, t + a, dur / 3); n.connect(b); b.connect(g); g.connect(S.panned(dest, pan)); return { b, g };
    };
    // a creak: a narrow band of noise gliding down
    S.creak = (t, dur, f, vol, pan, dest) => { const k = S.burst(t, dur, f, 9, vol, pan, dest, 'pink', dur * 0.3); if (k) k.b.frequency.linearRampToValueAtTime(f * 0.75, t + dur); };
    // a metal ping (a few inharmonic partials)
    S.ping = (t, f, vol, pan, dest, dur = 0.5) => { for (const [m, v] of [[1, 1], [2.76, 0.5], [5.4, 0.25]]) S.tone(t, dur / Math.sqrt(m), f * m, vol * v, pan, dest, 'sine', 0.001, dur * 0.9 / Math.sqrt(m)); };
    // glass: a burst of crackle plus bright tinkles
    S.glass = (t, vol, pan, dest) => {
      const src = ctx.createBufferSource(), hp = S.filter('highpass', 2400, 0.7), g = ctx.createGain(); src.buffer = S.crackleBuffer(1.2, 700); g.gain.value = vol * 3;
      src.connect(hp); hp.connect(g); g.connect(S.panned(dest, pan)); src.start(t);
      for (let k = 0; k < 10; k++) S.tone(t + 0.03 + k * 0.06 + (k * 37 % 11) / 280, 0.12, 2800 + (k * 911) % 3200, vol * 0.4, pan, dest, 'sine', 0.001, 0.1);
    };
    // a hailstone hitting something hard: a crack, a knock under it for the big ones
    S.crack = (t, vol, pan, dest, f = 2600) => { S.burst(t, 0.035, f, 0.9, vol, pan, dest, 'white', 0.001); if (vol > 0.02) S.burst(t, 0.08, 420, 0.8, vol * 0.6, pan, dest, 'pink', 0.002); };
    return S;
  }

  _build(ctx) {
    const S = this._kit(ctx), end = CONFIG.duration + 1.0;
    this.S = S;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -20; comp.knee.value = 6; comp.ratio.value = 3; comp.attack.value = 0.008; comp.release.value = 0.25;
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -2; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.1;
    const mix = ctx.createGain(); mix.gain.value = 2.75; mix.connect(comp);
    const out = ctx.createGain(); comp.connect(out); out.connect(lim); lim.connect(ctx.destination);
    out.gain.setValueAtTime(0, 0); out.gain.linearRampToValueAtTime(0.9, 0.03);
    const rev = S.reverb(1.6), rs = ctx.createGain(); rs.gain.value = 0.25; rev.connect(rs); rs.connect(mix);
    const bus = (v) => { const g = ctx.createGain(); g.gain.value = v; g.connect(mix); return g; };
    const roof = bus(1), sky = bus(1), you = bus(1), fx = bus(1), music = bus(0.8);
    // the roof and the sky cut-away never sound together
    const [k0, k1] = NR.sky;
    // (and in the stairwell the roof's sounds are muffled, through the door behind you)
    roof.gain.setValueAtTime(1, NR.walk[1] - 0.01); roof.gain.linearRampToValueAtTime(0.3, NR.walk[1] + 0.02);
    for (const b of [roof, fx]) { const g0 = b === roof ? 0.3 : 1; b.gain.setValueAtTime(g0, k0 - 0.01); b.gain.linearRampToValueAtTime(0, k0); b.gain.setValueAtTime(0, k1 - 0.01); b.gain.linearRampToValueAtTime(1, k1); }
    sky.gain.setValueAtTime(0, 0); sky.gain.setValueAtTime(0, k0 - 0.01); sky.gain.linearRampToValueAtTime(1, k0); sky.gain.setValueAtTime(1, k1 - 0.01); sky.gain.linearRampToValueAtTime(0, k1);
    this.rev = rev;
    this._air(S, roof, end);
    this._things(S, roof);
    this._party(S, roof);
    this._city(S, roof, end, new RNG(5050));
    this._steps(S, you);
    this._drop(S, fx);
    this._sky(S, sky);
    this._confetti(S, fx);
    this._rain(S, roof, end);
    this._balloons(S, roof);
    this._ice(S, fx, end);
    this._you(S, you);
    this._music(S, music, end);
  }

  // the stereo position of a world point for the listener at story t (−1 left … 1 right)
  _pan(t, x, z) { const lx = this.cx.value(t), lz = this.cz.value(t), yaw = MathX.deg(this.cyaw.value(t)), dx = x - lx, dz = z - lz, d = Math.max(0.5, Math.hypot(dx, dz)); return MathX.clamp((dx * Math.cos(yaw) - dz * Math.sin(yaw)) / d, -1, 1) * 0.8; }
  _dist(t, x, z) { return Math.hypot(x - this.cx.value(t), z - this.cz.value(t)); }

  // the wind round your head: a hollow rush that follows the wind; at the loss it stops dead (the storm adds nothing)
  _air(S, dest, end) {
    const ctx = S.ctx;
    const lay = (type, kind, f, q, pan) => { const n = S.noise(type, 0, end), b = S.filter(kind, f, q), g = ctx.createGain(); g.gain.value = 0; n.connect(b); b.connect(g); g.connect(S.panned(dest, pan)); return { g, b }; };
    const lo = lay('brown', 'lowpass', 280, 0.6, -0.25), body = lay('pink', 'bandpass', 480, 0.55, 0.25), air = lay('pink', 'bandpass', 1300, 0.5, -0.1);
    for (let t = 0; t <= NR.loss + 1.0; t += 1 / 30) {
      const a = nrAero(t), k = Math.pow(nrWindKmh(t) / 100, 1.5) * nrGust(t) * a + 0.03 * (1 - a);
      lo.g.gain.linearRampToValueAtTime(0.012 + 0.22 * k, t);
      body.g.gain.linearRampToValueAtTime(0.004 + 0.15 * k, t); body.b.frequency.linearRampToValueAtTime(380 + 260 * k, t);
      air.g.gain.linearRampToValueAtTime(0.002 + 0.06 * k, t);
    }
    for (const L of [lo, body, air]) L.g.gain.linearRampToValueAtTime(0.0, NR.loss + 1.5);
  }

  // what the wind moves on the roof: the sheets cracking, the bunting fluttering, the kite's line humming, the tablecloth;
  // at the loss: one last flop as the sheets drop, then nothing
  _things(S, dest) {
    const ctx = S.ctx, rng = new RNG(818), Lt = NR.loss;
    const sheetsPan = this._pan(0, 16.2, -0.8);
    for (let t = 0.2; t < Lt; t += rng.range(0.35, 0.8)) { S.burst(t, 0.12, 900, 0.7, 0.05 * nrLoad(t), sheetsPan + rng.range(-0.2, 0.2), dest, 'pink', 0.01); S.burst(t + 0.02, 0.06, 2400, 0.8, 0.03 * nrLoad(t), sheetsPan, dest, 'white', 0.003); }
    // the bunting: a fast flutter (amplitude-modulated noise)
    const fn = S.noise('white', 0, Lt + 0.6), fb = S.filter('bandpass', 2100, 0.9), am = ctx.createGain(), fg = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.type = 'sawtooth'; lfo.frequency.value = 15; lg.gain.value = 0.5; am.gain.value = 0.5; lfo.connect(lg); lg.connect(am.gain); lfo.start(0); lfo.stop(Lt + 0.6);
    fn.connect(fb); fb.connect(am); am.connect(fg); fg.connect(S.panned(dest, 0.15)); fg.gain.value = 0;
    for (let t = 0; t <= Lt + 0.5; t += 1 / 60) { fg.gain.linearRampToValueAtTime(0.03 * Math.pow(Math.min(1.5, nrLoad(t, 3)), 0.8), t); lfo.frequency.linearRampToValueAtTime(13 + 4 * nrGust(t, 3), t); }
    // the kite's line humming in the wind
    const ho = ctx.createOscillator(), hg = ctx.createGain(), hl = S.filter('bandpass', 380, 4); ho.type = 'sawtooth'; ho.frequency.value = 190;
    ho.connect(hl); hl.connect(hg); hg.connect(S.panned(dest, this._pan(0, 13.9, 2.3))); hg.gain.value = 0; ho.start(0); ho.stop(Lt + 0.3);
    for (let t = 0; t <= Lt + 0.2; t += 1 / 30) { hg.gain.linearRampToValueAtTime(0.012 * nrLoad(t) * (0.8 + 0.2 * Math.sin(t * 9)), t); ho.frequency.linearRampToValueAtTime(185 + 12 * nrGust(t), t); }
    // the tablecloth's skirts
    for (let t = 0.15; t < Lt; t += rng.range(0.12, 0.3)) S.burst(t, 0.05, 1600, 0.9, 0.012 * nrLoad(t), this._pan(t, 21.2, -0.2), dest, 'white', 0.004);
    // the loss: the sheets flop down and swing; the bunting's flags tick as they swing to a stop
    S.whump(Lt + 0.18, 0.03, sheetsPan, dest); S.burst(Lt + 0.15, 0.3, 700, 0.6, 0.04, sheetsPan, dest, 'pink', 0.02);
    for (let k = 0; k < 5; k++) S.click(Lt + 0.3 + k * 0.23, 0.012 * Math.exp(-0.5 * k), 0.15, dest);
    // the kite hits the pavement below (2.6 s later; 30 m away)
    const kl = Lt + 2.58 + 0.09;
    S.clunk(kl, 0.025, -0.1, dest); S.click(kl + 0.02, 0.02, -0.1, dest); S.click(kl + 0.11, 0.01, -0.1, dest);
  }

  // the party: chatter, the little speaker playing a song; everyone stops talking at the loss; "whoa"s at the confetti
  _party(S, dest) {
    const ctx = S.ctx, sp = (t) => this._pan(t, 21.7, 0.05);
    S.chatter(0.1, NR.loss, 0.02, sp(0), dest, 430, 4.2); S.laugh(0.9, 0.018, -0.2, dest, 520, 4);
    S.voice(NR.loss + 0.35, 380, 0.3, 'o', 0.03, 0.1, dest, 1.2); S.voice(NR.loss + 0.6, 240, 0.4, 'a', 0.025, -0.15, dest, 0.9);
    S.chatter(NR.loss + 1.4, NR.sky[0], 0.012, 0, dest, 400, 2.4);
    S.chatter(NR.sky[1], NR.pop - 0.1, 0.012, 0, dest, 410, 3.0);
    S.voice(NR.pop + 2.35, 300, 0.45, 'o', 0.035, sp(NR.pop), dest, 1.15); S.laugh(NR.pop + 2.7, 0.02, -0.1, dest, 460, 5);
    S.chatter(NR.pop + 3.2, NR.gale[0] + 1.2, 0.012, 0, dest, 420, 3.0);
    // the speaker (on the table): a bright little song, small-speaker sound, until someone takes it in from the rain
    const off = 24.95, spk = ctx.createGain(), hp = S.filter('highpass', 320, 0.7), lp = S.filter('lowpass', 4200, 0.7), pn = ctx.createStereoPanner();
    spk.connect(hp); hp.connect(lp); lp.connect(pn); pn.connect(dest); spk.gain.value = 1;
    for (let t = 0; t <= off; t += 0.25) pn.pan.linearRampToValueAtTime(sp(t) * 0.7, t);
    const chords = [[261.6, 329.6, 392], [196, 246.9, 293.7], [220, 261.6, 329.6], [174.6, 220, 261.6]], beat = 0.5;
    for (let t = 0.05, k = 0; t < off; t += beat / 2, k++) {
      const ch = chords[Math.floor(k / 8) % 4], f = ch[k % 3] * (k % 4 === 3 ? 2 : 1);
      S.pluck(t, f, 0.022, 0, spk, 0.5, 0.75);
      if (k % 2 === 0) S.tone(t, 0.09, 110, 0.03, 0, spk, 'sine', 0.002, 0.07);
      if (k % 4 === 2) S.burst(t, 0.05, 6000, 0.7, 0.012, 0, spk, 'white', 0.002);
    }
    S.click(off, 0.012, sp(off), dest);
  }

  // the city below (21 m down): traffic, a horn or two; quieter under the rain; the traffic stops at the ice; then car alarms
  _city(S, dest, end, rng) {
    const ctx = S.ctx, n = S.noise('brown', 0, end), lp = S.filter('lowpass', 170, 0.7), g = ctx.createGain(); n.connect(lp); lp.connect(g); g.connect(S.panned(dest, 0.3));
    g.gain.setValueAtTime(0.1, 0); g.gain.setValueAtTime(0.1, NR_ICE.first + 0.2); g.gain.linearRampToValueAtTime(0.03, NR_ICE.first + 2.4);
    for (let t = 0.6; t < NR_ICE.first; t += rng.range(2.4, 4.6)) { if (t > NR.sky[0] && t < NR.sky[1]) continue; S.burst(t, 1.8, 650, 0.6, 0.016, rng.pick([0.2, 0.4, 0.5]), dest, 'pink', 0.7); }
    for (const [t, f1, f2, p] of [[5.6, 392, 494, 0.5], [27.8, 415, 523, 0.4]]) S.horn(t, f1, f2, 0.006, p, dest);
    // car alarms: set off by the ice all over the street; heard once the roar stops
    const alarm = (t0, fA, fB, rate, vol, pan) => {
      const o = ctx.createOscillator(), f = S.filter('lowpass', 2200, 0.7), a = ctx.createGain(); o.type = 'square';
      for (let t = t0, k = 0; t < end; t += rate, k++) o.frequency.setValueAtTime(k % 2 ? fB : fA, t);
      a.gain.setValueAtTime(0, t0); a.gain.linearRampToValueAtTime(vol, t0 + 0.1); a.gain.setValueAtTime(vol, NR.line[0]); a.gain.linearRampToValueAtTime(vol * 0.55, NR.line[1]);
      o.connect(f); f.connect(a); a.connect(S.panned(dest, pan)); o.start(t0); o.stop(end);
    };
    alarm(NR_ICE.first + 0.6, 880, 1150, 0.42, 0.005, 0.55); alarm(NR_ICE.first + 1.3, 700, 980, 0.3, 0.0035, -0.5); alarm(NR_ICE.first + 2.2, 1020, 1300, 0.5, 0.0025, 0.2); alarm(NR_ICE.first + 4.0, 760, 1010, 0.36, 0.002, -0.2);
  }

  // your footsteps (from the camera's own stride)
  _steps(S, dest) {
    const C = this.app.cam, ph = C.stepPh;
    for (let i = 1; i < ph.length; i++) {
      const t = i * C.dt; if (t >= NR.cut0 && t < NR.sky[1]) continue;
      if (Math.floor(ph[i]) !== Math.floor(ph[i - 1])) S.step(t, t > NR_ICE.first ? 0.08 : 0.05, Math.floor(ph[i]) % 2 ? 0.12 : -0.12, dest);
    }
  }

  // the paper and the ball: let go together, they land together 21 m down (a slap and a thud), then the ball bounces on
  _drop(S, dest) {
    S.burst(NR.drop.up, 0.35, 1900, 0.8, 0.008, 0, dest, 'pink', 0.1);       // hands out (sleeves)
    S.click(NR.drop.rel, 0.006, 0.15, dest);
    const r = this.app.props && this.app.props.rel, h = r ? r.p.y - LAYOUT.curbH : 22.4, t0 = NR.drop.rel + Math.sqrt(2 * h / NR_G) + h / 343;
    S.burst(t0, 0.07, 1700, 0.9, 0.05, 0.1, dest, 'white', 0.002); S.burst(t0, 0.12, 600, 0.8, 0.02, 0.1, dest, 'pink', 0.002);
    // (22 m down a stairwell: it rings round the walls)
    S.burst(t0, 0.07, 1700, 0.9, 0.08, 0, this.rev, 'white', 0.002); S.tone(t0, 0.12, 170, 0.08, 0, this.rev, 'sine', 0.002, 0.1);
    // the stairwell's own hollow quiet
    const wn = S.noise('brown', NR.walk[1], NR.cut0 + 0.05), wl = S.filter('lowpass', 260, 0.7), wg = S.ctx.createGain(); wn.connect(wl); wl.connect(wg); wg.connect(dest);
    wg.gain.setValueAtTime(0, NR.walk[1]); wg.gain.linearRampToValueAtTime(0.03, NR.walk[1] + 0.05); wg.gain.setValueAtTime(0.03, NR.cut0 - 0.05); wg.gain.linearRampToValueAtTime(0, NR.cut0);
    let v = 0.72 * Math.sqrt(2 * NR_G * h), t = t0;
    for (let k = 0; k < 8; k++) {
      const a = k === 0 ? 1 : Math.pow(0.72, k);
      S.tone(t, 0.09, 165 + 10 * k, 0.05 * a, -0.1, dest, 'sine', 0.002, 0.08); S.click(t, 0.02 * a, -0.1, dest);
      t += 2 * v / NR_G; v *= 0.72;
      if (t > NR.cut0 - 0.05) break;
    }
  }

  // the cut-away: almost silent. The air rushing up past you at 400–650 km/h makes no sound on things it no longer
  // touches; only a faint high hush, thunder rolling round the storm, and inside the cloud the crack of a stroke near you
  _sky(S, dest) {
    const ctx = S.ctx, [a, b] = NR.sky;
    const n = S.noise('pink', a, b + 0.05), lp = S.filter('lowpass', 1400, 0.5), g = ctx.createGain(); n.connect(lp); lp.connect(g); g.connect(dest);
    g.gain.setValueAtTime(0, a); g.gain.linearRampToValueAtTime(0.012, a + 0.4); g.gain.setValueAtTime(0.012, b - 0.1); g.gain.linearRampToValueAtTime(0, b);
    // far thunder (a low roll), then in the cloud a close stroke: a crack, a tearing rumble
    const roll = (t, dur, vol, pan) => { const r = S.noise('brown', t, t + dur + 0.1), rl = S.filter('lowpass', 160, 0.7), rg = ctx.createGain(); r.connect(rl); rl.connect(rg); rg.connect(S.panned(dest, pan));
      rg.gain.setValueAtTime(0, t); rg.gain.linearRampToValueAtTime(vol, t + dur * 0.25); rg.gain.setTargetAtTime(0, t + dur * 0.35, dur * 0.25); };
    roll(a + 0.4, 2.4, 0.09, -0.5); roll(16.7, 1.8, 0.06, 0.4);
    const t0 = NR_SKY.bolt[0] + 0.25;
    S.burst(t0, 0.09, 2200, 0.6, 0.16, 0.35, dest, 'white', 0.001); S.burst(t0 + 0.01, 0.4, 700, 0.6, 0.12, 0.35, dest, 'pink', 0.003);
    roll(t0 + 0.05, 1.6, 0.3, 0.3); roll(NR_SKY.bolt[2] + 0.4, 0.9, 0.12, -0.2);
  }

  // the confetti cannon (a spring): a clack and a twang; then the whole load lands at once: a soft patter, all in a moment (each flake carries ~0.01 J)
  _confetti(S, dest) {
    const t = NR.pop, pan = this._pan(t, 19.0, -1.4), m = this.app.storm.muzzle(), fl = nrFloorAt(m.x, m.z), v = NR_CONFETTI.v0;
    S.burst(t, 0.05, 1400, 0.8, 0.1, pan, dest, 'white', 0.001); S.clunk(t, 0.08, pan, dest); S.ping(t + 0.005, 310, 0.03, pan, dest, 0.7); S.ping(t + 0.01, 470, 0.015, pan, dest, 0.5);
    const tl = t + (v + Math.sqrt(v * v + 2 * NR_G * (m.y - fl))) / NR_G, rng = new RNG(4410);
    for (let k = 0; k < 70; k++) { const dt = 0.16 * Math.pow(rng.next(), 1.5) - 0.03; S.click(tl + dt, rng.range(0.004, 0.011), pan + rng.range(-0.15, 0.15), dest); }
    S.burst(tl, 0.18, 5200, 0.7, 0.02, pan, dest, 'white', 0.01);
  }

  // the rain (water: the wind still carries it): a hiss on everything, from the gust front to the end
  _rain(S, dest, end) {
    const ctx = S.ctx, n = S.noise('white', NR.gale[0] - 0.1, end), b = S.filter('bandpass', 5200, 0.5), g = ctx.createGain(), n2 = S.noise('pink', NR.gale[0] - 0.1, end), b2 = S.filter('lowpass', 900, 0.6), g2 = ctx.createGain();
    n.connect(b); b.connect(g); g.connect(S.panned(dest, -0.1)); n2.connect(b2); b2.connect(g2); g2.connect(S.panned(dest, 0.15));
    g.gain.setValueAtTime(0, NR.gale[0]); g.gain.linearRampToValueAtTime(0.045, NR.gale[0] + 1.2); g2.gain.setValueAtTime(0, NR.gale[0]); g2.gain.linearRampToValueAtTime(0.03, NR.gale[0] + 1.2);
    // the moment the last ice lands: the rain drops away for a breath, then comes back (the silence is the ice stopping)
    for (const [G, v] of [[g, 0.045], [g2, 0.03]]) { G.gain.setValueAtTime(v, NR.quiet); G.gain.linearRampToValueAtTime(v * 0.2, NR.quiet + 0.05); G.gain.setValueAtTime(v * 0.2, NR.quiet + 0.9); G.gain.linearRampToValueAtTime(v * 0.8, NR.quiet + 3.0); }
    // drops ticking on the hut and the chairs
    const rng = new RNG(6070);
    for (let t = NR.gale[0] + 0.3; t < end; t += rng.range(0.03, 0.12)) { if (t > NR.sky[0] && t < NR.sky[1]) continue; S.click(t, rng.range(0.002, 0.006), rng.range(-0.7, 0.7), dest); }
  }

  // the balloons: a squeak of the strings, the girl's "oh!"; then they go up without a sound
  _balloons(S, dest) {
    const b = NR.balloon, pan = this._pan(b, 19.6, 1.15);
    S.tone(b, 0.06, 1900, 0.008, pan, dest, 'sine', 0.003, 0.04);
    S.voice(b + 0.15, 470, 0.3, 'o', 0.03, pan, dest, 1.25);
    S.voice(b + 0.75, 520, 0.4, 'a', 0.025, pan, dest, 0.8);
    S.voice(b + 1.05, 240, 0.35, 'o', 0.018, pan + 0.1, dest, 0.85);
  }

  // the ice: single cracks round you at first (each one a stone hitting at over 1,200 km/h), then a roar that grows with the
  // flux and with the speed; the breakages; the hut's roof drumming over your head; at NR.quiet: nothing
  _ice(S, dest, end) {
    const ctx = S.ctx, q = NR.quiet, F = NR_ICE.first;
    // the hits near you (a sample of the drawn ones; the loud early stones are all there)
    const near = [];
    for (let t = F; t < q; t += 0.25) {
      const cx = this.cx.value(t), cz = this.cz.value(t), share = 0.6 / (1 + 40 * NR_ICE.flux(t));
      for (const h of NR_HAIL.near(t, Math.min(q, t + 0.25), cx, cz, 16, share)) near.push(h);
    }
    for (const [t, d, bear, k] of near) {
      const yaw = MathX.deg(this.cyaw.value(t)), pan = MathX.clamp(-Math.sin(bear - yaw) * 0.85, -0.85, 0.85), v = 0.09 * k * 6 / (6 + d * d * 0.35);
      if (v < 0.0015) continue;
      S.crack(t, v, pan, dest, 2000 + 1600 * hash1(Math.floor(t * 1000)));
    }
    // the roar: a dense crackle and a hiss, growing with the flux (and the speed: v² per hit), a low rumble under it
    const roar = ctx.createGain(), hp = S.filter('bandpass', 2600, 0.45), src = ctx.createBufferSource(); src.buffer = S.crackleBuffer(4.0, 9000); src.loop = true;
    src.connect(hp); hp.connect(roar); roar.connect(S.panned(dest, 0)); src.start(F); src.stop(q + 0.02);
    const hs = S.noise('white', F, q + 0.05), hb = S.filter('bandpass', 4200, 0.6), hg = ctx.createGain(); hs.connect(hb); hb.connect(hg); hg.connect(dest);
    const rb = S.noise('brown', F, q + 0.05), rl = S.filter('lowpass', 180, 0.6), rg = ctx.createGain(); rb.connect(rl); rl.connect(rg); rg.connect(dest);
    // the hut's roof over your head (once you're inside): heavy drumming
    const dr = ctx.createBufferSource(), dl = S.filter('lowpass', 700, 0.7), dg = ctx.createGain(); dr.buffer = S.crackleBuffer(3.0, 2600); dr.loop = true; dr.connect(dl); dl.connect(dg); dg.connect(dest); dr.start(F); dr.stop(q + 0.02);
    for (const g of [roar, hg, rg, dg]) g.gain.setValueAtTime(0, F);
    for (let t = F; t <= q; t += 1 / 30) {
      const f = NR_ICE.flux(t), sp = NR_ICE.v(t) / 343, w = Math.pow(f, 0.7) * (0.8 + 0.2 * sp * sp), inside = MathX.smooth(this.cx.value(t), NR_ROOF.hut.x0 + 0.2, NR_ROOF.hut.x0 + 1.2);
      roar.gain.linearRampToValueAtTime(0.32 * w * (1 - 0.35 * inside), t); hg.gain.linearRampToValueAtTime(0.035 * w, t); rg.gain.linearRampToValueAtTime(0.32 * w, t); dg.gain.linearRampToValueAtTime(0.5 * w * inside, t);
    }
    for (const g of [roar, hg, rg, dg]) { g.gain.setValueAtTime(g.gain.value, q); g.gain.linearRampToValueAtTime(0, q + 0.015); }
    // the breakages (from the doorway)
    const P = (t, x, z) => this._pan(t, x, z), K = NR_ROOF.skylight, H = NR_ROOF_HITS;
    for (const t of H.panes) { S.glass(t, 0.06, P(t, K.x, K.z), dest); S.crack(t, 0.05, P(t, K.x, K.z), dest, 3200); }      // (the skylight, off to your left)
    { const t = H.bottles, T = NR_ROOF.table, p = P(t, T.x - 0.3, T.z); S.glass(t, 0.1, p, dest); S.crack(t, 0.07, p, dest, 4200); S.glass(t + 0.07, 0.05, p, dest); }
    { const t = H.cake, T = NR_ROOF.table, p = P(t, T.x + 0.1, T.z); S.whump(t, 0.07, p, dest); S.crack(t, 0.05, p, dest, 1800); S.burst(t + 0.02, 0.18, 900, 0.7, 0.03, p, dest, 'pink', 0.01); }
    H.bunting.forEach((t, r) => { const p = P(t, 22, r ? -1.8 : 1.2); S.ping(t, 1800, 0.03, p, dest, 0.25); for (let k = 0; k < 8; k++) S.click(t + 0.6 + k * 0.04, 0.012, p, dest); });
    this.app.roof.bulbs.forEach((b, k) => { const p = P(b.t, b.p[0], b.p[2]); S.click(b.t, 0.02, p, dest); S.tone(b.t + 0.01, 0.05, 3400 + (k * 377) % 1800, 0.008, p, dest, 'sine', 0.001, 0.04); });
    // the sheets: their pegs shot away (two clicks), then the sheet lands on the deck (a soft slap)
    const Rf = this.app.roof, Yd = NR_ROOF.y;
    Rf.sheets.forEach((Sh) => { const t = H.sheets[Sh.i]; if (t > NR.quiet) return; const c = Sh.m.position, p = P(t, c.x, c.z), tl = Math.sqrt(2 * Math.max(0.1, Rf.lineY - (Yd + 1.72)) / NR_G);
      S.click(t, 0.03, p, dest); S.click(t + 0.05, 0.025, p, dest); S.whump(t + tl, 0.05, p, dest); S.burst(t + tl, 0.3, 600, 0.6, 0.035, p, dest, 'pink', 0.02); });
    // the cups: a knock as each is hit, a plastic clatter where it lands
    for (const c of Rf.cups) { const p = P(c.t, c.p0.x, c.p0.z), tl = (c.vy + Math.sqrt(c.vy * c.vy + 2 * NR_G * (c.p0.y - Yd - 0.05))) / NR_G;
      S.crack(c.t, 0.04, p, dest, 1700); S.click(c.t + tl, 0.02, p, dest); S.click(c.t + tl + 0.07, 0.012, p, dest); }
    // the chairs: hit, then a clatter of aluminium as each goes over
    for (const C of Rf.chairs) { const c = C.g.position, p = P(C.t, c.x, c.z); S.crack(C.t, 0.05, p, dest, 2300); S.ping(C.t + 0.5, 900 + 200 * C.dir, 0.02, p, dest, 0.3); S.clunk(C.t + 0.5, 0.05, p, dest); S.click(C.t + 0.58, 0.02, p, dest); }
    // the table: its legs shot through, the top comes down on the deck with everything left on it
    { const t = H.table, T = NR_ROOF.table, p = P(t, T.x, T.z), tl = Math.sqrt(2 * 0.68 / NR_G); S.crack(t, 0.07, p, dest, 1400); S.crunch(t + tl, 0.1, p, dest, this.rev); S.whump(t + tl, 0.08, p, dest); for (let k = 0; k < 6; k++) S.click(t + tl + 0.05 + k * 0.05, 0.015, p, dest); }
    // the stair housing's roof over your head: each stone that punches through it, a hard knock and a splinter
    for (const [x, z, t] of NR_HUT_HOLES) { if (t >= q) continue; const p = P(t, x, z), v = t < NR.roofHit + 0.6 ? 0.12 : 0.05; S.crack(t, v, p, dest, 1100); S.burst(t + 0.005, 0.12, 2400, 0.8, v * 0.35, p, dest, 'white', 0.002); }
    // the first stones: each one a crack you feel (the very first the loudest thing in the film so far)
    NR_ROOF_HITS.first.forEach(([t, x, z], k) => { const p = P(t, x, z), v = k === 0 ? 0.42 : 0.16; S.crack(t, v, p, dest, 1800); S.boom(t, k === 0 ? 0.2 : 0.05, dest, this.rev); S.burst(t + 0.01, 0.5, 1200, 0.6, v * 0.25, p, dest, 'pink', 0.004); });
    { const t = H.pot, C = NR_ROOF.chimney, p = P(t, C.x, C.z); S.crunch(t, 0.12, p, dest, this.rev); S.crack(t, 0.1, p, dest, 1500); }
  }

  // you: a gasp at the first stone, fast breathing in the doorway, a long breath out in the silence
  _you(S, dest) {
    S.gasp(NR_ICE.first + 0.08, 0.04, dest);
    for (let t = NR_ICE.first + 0.7, k = 0; t < NR.quiet - 0.3; t += 0.42, k++) S.breath(t, 0.34, k % 2 === 0, 0.012, dest);
    S.breath(NR.quiet + 0.7, 1.6, false, 0.022, dest); S.breath(NR.quiet + 2.6, 1.3, true, 0.012, dest);
    S.breath(NR.line[0] + 2.0, 1.4, false, 0.01, dest);
  }

  // the score: a low hit at the loss; plucks over the drop; the sky's pulse; a pulse building through the storm; a tense
  // drone and the count to the first ice; nothing in the hail; one held chord at the end
  _music(S, out, end) {
    const ctx = S.ctx;
    const sw = S.burst(NR.loss - 1.0, 1.05, 700, 0.7, 0.0, 0, out, 'pink', 1.0); sw.g.gain.cancelScheduledValues(NR.loss - 1.0); sw.g.gain.setValueAtTime(0, NR.loss - 1.0); sw.g.gain.linearRampToValueAtTime(0.05, NR.loss - 0.02); sw.g.gain.linearRampToValueAtTime(0, NR.loss);
    S.thump(NR.loss, 0.22, out); S.tone(NR.loss, 2.6, 55, 0.05, 0, out, 'sine', 0.01, 2.0); S.tone(NR.loss, 2.0, 1760, 0.006, 0, out, 'sine', 0.005, 1.8);
    const low = [220, 261.6, 329.6, 293.7, 261.6, 220, 196, 220];
    for (let t = NR.title[1] + 0.3, k = 0; t < NR.cut0 - 0.3; t += 0.55, k++) S.pluck(t, low[k % low.length], 0.016, k % 2 ? 0.25 : -0.25, out, 1.0, 0.5);
    // into the cut: a riser; the sky: a hit, a drone, a pulse that quickens as you fall into the cloud
    const c0 = NR.cut0, ri = S.burst(c0 - 1.0, 1.0, 400, 0.8, 0.0, 0, out, 'pink', 0.9); ri.g.gain.cancelScheduledValues(c0 - 1.0); ri.g.gain.setValueAtTime(0, c0 - 1.0); ri.g.gain.linearRampToValueAtTime(0.05, c0 - 0.02); ri.g.gain.linearRampToValueAtTime(0, c0); ri.b.frequency.exponentialRampToValueAtTime(3000, c0);
    S.thump(NR.sky[0], 0.18, out);
    for (const f of [55, 82.4]) S.tone(NR.sky[0], NR.sky[1] - NR.sky[0], f, 0.03, 0, out, 'sine', 0.3, 0.3);
    for (let t = NR.sky[0] + 0.3, k = 0; t < NR.sky[1] - 0.1; t += 0.62 - 0.12 * MathX.smooth(t, NR.sky[0], NR.sky[1]), k++) S.tone(t, 0.16, k % 2 ? 61.7 : 55, 0.05, 0, out, 'triangle', 0.004, 0.14);
    for (const f of [220, 261.6, 329.6]) S.tone(NR.sky[0] + 0.3, 2.4, f, 0.008, 0, out, 'triangle', 0.8, 1.2);
    for (const f of [207.7, 246.9, 311.1]) S.tone(16.7, 3.5, f, 0.01, 0, out, 'triangle', 0.3, 1.4);
    // the roof again: a light pulse; it grows when the storm comes
    for (let t = NR.sky[1] + 0.2, k = 0; t < NR.cloud; t += 0.6 - 0.1 * MathX.smooth(t, NR.gale[0], NR.cloud), k++) S.tone(t, 0.16, k % 4 === 0 ? 65.4 : 55, 0.03 + 0.03 * MathX.smooth(t, NR.gale[0], NR.cloud), 0, out, 'triangle', 0.004, 0.14);
    for (let i = 0; i < 4; i++) S.pluck(NR.balloon + 0.2 + i * 0.13, [440, 523.3, 659.3, 880][i], 0.02, 0.1, out, 1.2, 0.7);
    // the cloud: a low hit and a drone that tightens; the count (one tick a second); cut dead at the first ice
    const F = NR_ICE.first;
    S.thump(NR.cloud, 0.16, out); S.tone(NR.cloud + 0.4, 2.0, 1318.5, 0.005, 0.2, out, 'sine', 0.05, 1.6);
    const dr = ctx.createGain(); dr.connect(out); dr.gain.setValueAtTime(0, NR.cloud);
    for (const [t, v] of [[NR.cloud + 1.5, 0.02], [F - 0.4, 0.05], [F - 0.02, 0.055], [F, 0]]) dr.gain.linearRampToValueAtTime(v, t);
    for (const f of [55, 82.4, 116.5]) { const o = ctx.createOscillator(); o.type = f > 100 ? 'triangle' : 'sine'; o.frequency.value = f; o.connect(dr); o.start(NR.cloud); o.stop(F + 0.05); }
    for (let k = 3; k >= 1; k--) S.tick(F - k, 1500, 0.02, out);
    for (let t = F - 3, k = 0; t < F - 0.05; t += 0.5, k++) S.heart(t, 0.05 + 0.01 * k, out);
    // the end: one held chord under the lines
    for (const f of [110, 164.8, 220, 246.9, 261.6]) S.tone(NR.line[0] - 0.2, NR.black - NR.line[0] + 0.2, f, 0.016, 0, out, 'triangle', 1.6, 0.05);
  }
}
