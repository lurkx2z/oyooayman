/* =====================================================================
   SOUNDTRACK — "How did kids have fun before screens?" (all 90 s; this header describes the opening)
   Synthesised and rendered offline by the shared AudioEngine:
   modern room tone and the phone's tinny video, the low-battery chime,
   power-down, two dull taps and near-silence; children muffled behind the
   door; the latch, a hinge and a swell of light; then the past outside:
   air, birds, a distant cart and church bell, kids' voices, footsteps
   (spatial, from each child's path), rolling hoops, the ball, the rope.
   Music: a curious pad → warm wonder → a light plucked rhythm.
   Children's voices are a formant-synth placeholder (see PLAN.md for the
   CC0 recordings that would replace them).
   ===================================================================== */

class BeforeScreensAudio extends AudioEngine {
  constructor(tl, kids, app) {
    super(tl);
    this.kids = kids;
    this.app = app;
    this.wavName = SCRIPT.meta.wav;
  }

  // film constants the soundtrack is built from (part of the baked soundtrack's fingerprint)
  fingerprintData() { return [PARLOUR, SOCIAL, KITE, POCKET]; }

  // listener-relative gain + pan for a point at time t
  _rel(x, z, t, ref = 4) {
    const lx = this.cx.value(t), lz = this.cz.value(t), yaw = MathX.deg(this.cyaw.value(t));
    const dx = x - lx, dz = z - lz, d = Math.max(0.4, Math.hypot(dx, dz));
    return { gain: ref / (ref + d), pan: MathX.clamp((dx * Math.cos(yaw) - dz * Math.sin(yaw)) / d, -1, 1) * 0.85, d };
  }

  _build(ctx) {
    const S = new SoundKit(ctx, CONFIG.seed), end = CONFIG.duration;
    // Chrome's offline renderer can spike on exponential ramps shorter than one 128-sample block:
    // this film's envelopes use a linear attack and an exponential (setTarget) decay instead, and tones get a 6 ms minimum attack
    S.env = (g, t, a, peak, d) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(Math.max(0.0002, peak), t + Math.max(a, 0.006)); g.gain.setTargetAtTime(0, t + Math.max(a, 0.006), Math.max(0.004, d / 4)); };
    const tone = S.tone.bind(S);
    S.tone = (t, dur, f, vol, pan, dest, type = 'sine', attack = 0.01, release = null) => tone(t, dur, f, vol, pan, dest, type, Math.max(attack, 0.006), release);
    // mix → make-up gain (+15 dB: social-video loudness) → glue compressor → limiter
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.005; comp.release.value = 0.25;
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -2.5; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.12;
    const mixIn = ctx.createGain(); mixIn.gain.value = 5.6; mixIn.connect(comp);
    const out = ctx.createGain(); comp.connect(out); out.connect(lim); lim.connect(ctx.destination);
    out.gain.setValueAtTime(0.0001, 0); out.gain.linearRampToValueAtTime(0.9, 0.06);
    out.gain.setValueAtTime(0.9, end - 0.4); out.gain.linearRampToValueAtTime(0.0001, end + 0.4);
    const bus = ctx.createGain(); bus.connect(mixIn);
    const roomRev = S.reverb(0.5), roomSend = ctx.createGain(); roomSend.gain.value = 0.22; roomSend.connect(roomRev); roomRev.connect(mixIn);
    const outRev = S.reverb(1.7), outSend = ctx.createGain(); outSend.gain.value = 0.28; outSend.connect(outRev); outRev.connect(mixIn);
    const music = ctx.createGain(); music.gain.value = 0.6; music.connect(mixIn);
    const musRev = S.reverb(2.6), musSend = ctx.createGain(); musSend.gain.value = 0.4; musSend.connect(musRev); musRev.connect(mixIn);
    this.S = S;
    this._room(S, bus);
    this._phone(S, bus, roomSend);
    this._door(S, bus, roomSend, outSend);
    this._outside(S, bus, outSend);
    this._kidsSound(S, bus, outSend);
    this._povSteps(S, bus, roomSend, outSend);
    this._pocket(S, bus, outSend);
    this._workshop(S, bus, outSend, music);
    this._meadow(S, bus, outSend);
    this._imagination(S, bus, outSend, music, musSend);
    this._musicC(S, music, musSend);
    this._games(S, bus, outSend);
    this._evening(S, bus, outSend, music, musSend);
    this._music(S, music, musSend);
    // phase E: the parlour has its own little room (cut dead at the return to the bedroom), then the bedroom at night (cut dead at the black),
    // and the last note on a chain of its own
    const parl = ctx.createGain(); parl.connect(mixIn); parl.gain.setValueAtTime(2.0, 0); parl.gain.setValueAtTime(2.0, 80.39); parl.gain.linearRampToValueAtTime(0, 80.4);   // (+6 dB: an intimate room, but not a drop-out)
    const parlRev = S.reverb(0.8), parlSend = ctx.createGain(); parlSend.gain.value = 0.3; parlSend.connect(parlRev); parlRev.connect(parl);
    const parlMus = ctx.createGain(); parlMus.gain.value = 0.6; parlMus.connect(parl);
    const parlMusRev = S.reverb(2.4), parlMusSend = ctx.createGain(); parlMusSend.gain.value = 0.42; parlMusSend.connect(parlMusRev); parlMusRev.connect(parl);
    const bed = ctx.createGain(); bed.connect(mixIn); bed.gain.setValueAtTime(0, 80.39); bed.gain.linearRampToValueAtTime(1, 80.4); bed.gain.setValueAtTime(1, 88.39); bed.gain.linearRampToValueAtTime(0, 88.4);
    const bedRev = S.reverb(0.5), bedSend = ctx.createGain(); bedSend.gain.value = 0.25; bedSend.connect(bedRev); bedRev.connect(bed);
    const endBus = ctx.createGain(); endBus.gain.value = 6.0; endBus.connect(out);
    const endRev = S.reverb(3.0), endSend = ctx.createGain(); endSend.gain.value = 0.5; endSend.connect(endRev); endRev.connect(endBus);
    if (end > 67.6) {
      this._parlour(S, parl, parlSend, parlMus, parlMusSend);
      this._return(S, bed, bedSend, endBus, endSend);
    }
  }

  /* little sound builders */
  // a shaker hit: a pre-baked, enveloped burst of high noise (no gain automation)
  _shaker(S, t, vol, dest) {
    if (!this._shakeBuf) {
      const sr = S.ctx.sampleRate, len = Math.floor(sr * 0.06), b = S.ctx.createBuffer(1, len, sr), d = b.getChannelData(0), r = new RNG(5);
      let prev = 0;
      for (let i = 0; i < len; i++) { const w = r.next() * 2 - 1, hp = w - prev; prev = w; d[i] = hp * 0.5 * Math.min(1, i / (sr * 0.003)) * Math.exp(-i / (sr * 0.012)); }
      this._shakeBuf = b;
    }
    const s = S.ctx.createBufferSource(), g = S.ctx.createGain(); s.buffer = this._shakeBuf; g.gain.value = vol * 0.02;
    s.connect(g); g.connect(dest); s.start(t);
  }

  _glass(S, t, vol, pan, dest) {
    const f = S.rng.range(2600, 4200);
    S.tone(t, 0.05, f, vol, pan, dest, 'sine', 0.001, 0.045); S.tone(t, 0.035, f * 2.7, vol * 0.4, pan, dest, 'sine', 0.001, 0.03);
    S.click(t, vol * 0.8, pan, dest);
  }
  _rustle(S, t, dur, vol, pan, dest, f = 3200) {
    const ctx = S.ctx, n = S.noise('white', t, t + dur), bp = S.filter('bandpass', f, 0.9), g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    for (let k = 0; k < dur / 0.03; k++) g.gain.linearRampToValueAtTime(vol * (0.3 + 0.7 * S.rng.next()), t + k * 0.03 + 0.015);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    n.connect(bp); bp.connect(g); g.connect(S.panned(dest, pan));
  }
  _whoosh(S, t, dur, vol, pan, dest, f0 = 400, f1 = 2400) {
    const ctx = S.ctx, n = S.noise('pink', t, t + dur), bp = S.filter('bandpass', f0, 1.2), g = ctx.createGain();
    bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.6); bp.frequency.exponentialRampToValueAtTime(f0, t + dur);
    S.env(g, t, dur * 0.5, vol, dur * 0.5); n.connect(bp); bp.connect(g); g.connect(S.panned(dest, pan));
  }

  /* marbles (from the physics), the top, jacks */
  _pocket(S, bus, rev) {
    const ctx = S.ctx, M = this.app && this.app.marbles;
    // knees on the gravel as you kneel at the ring
    S.crunch(15.45, 0.05, -0.1, bus, rev); S.crunch(15.75, 0.045, 0.1, bus, rev);
    if (M) {
      const C = POCKET.ring;
      for (const h of M.sim.hits) { const R = this._rel(h.x, h.z, h.t, 0.6); this._glass(S, h.t, Math.min(0.09, 0.03 + 0.05 * h.v) * R.gain * 2, R.pan, bus); }
      // rolling: a soft grit whose level follows how fast the marbles are moving
      const n = S.noise('white', 17.3, 21.0), bp = S.filter('bandpass', 2400, 0.7), g = ctx.createGain(); g.gain.value = 0.0001;
      n.connect(bp); bp.connect(g); g.connect(bus);
      for (let t = 17.3; t < 21.0; t += 1 / 30) { const st = M.stateAt(t); let v = 0; for (const m of st.a) v += m.v; g.gain.linearRampToValueAtTime(Math.min(0.03, v * 0.018) + 0.0001, t); }
    }
    S.click(17.34, 0.04, 0.05, bus);                      // the flick
    S.click(19.36, 0.025, -0.25, bus);
    { const a = S.ctx; S.laugh(17.8, 0.03, -0.2, bus, 520, 3); S.voice(17.75, 600, 0.35, 'o', 0.03, 0.2, bus, 1.15); }   // "ooh!" from the others
    S.voice(19.95, 420, 0.45, 'a', 0.028, -0.3, bus, 0.75);  // your friend groans
    S.laugh(20.1, 0.02, 0.15, bus, 560, 4);
    // the top: string zip, landing tap, whirr with a rattle that grows as it wobbles, the clatter as it falls
    const T = POCKET.top;
    this._whoosh(S, T.tThrow - 0.05, 0.3, 0.05, 0.05, bus, 900, 4000);
    S.click(T.tLand, 0.06, 0, bus); S.tone(T.tLand, 0.06, 420, 0.04, 0, bus, 'sine', 0.001, 0.05);
    const D = T.tFall - T.tLand;
    const o = ctx.createOscillator(), og = ctx.createGain(), lp = S.filter('lowpass', 900, 0.7);
    o.type = 'triangle'; o.frequency.setValueAtTime(240, T.tLand); o.frequency.linearRampToValueAtTime(120, T.tFall);
    og.gain.setValueAtTime(0.0001, T.tLand); og.gain.exponentialRampToValueAtTime(0.022, T.tLand + 0.1);
    const rat = S.noise('white', T.tLand, T.tFall + 0.1), rb = S.filter('bandpass', 1800, 1.5), rg = ctx.createGain(); rg.gain.value = 0.0001;
    for (let t = T.tLand; t < T.tFall; t += 0.02) {
      const s = t - T.tLand, k = s / D, prec = 4 + 14 * k;            // the wobble frequency rises as it slows
      og.gain.linearRampToValueAtTime(0.022 * (1 - 0.4 * k), t);
      rg.gain.linearRampToValueAtTime(0.0001 + 0.03 * k * k * (0.5 + 0.5 * Math.sin(2 * Math.PI * prec * s)), t);
    }
    og.gain.linearRampToValueAtTime(0.0001, T.tFall + 0.05); rg.gain.linearRampToValueAtTime(0.0001, T.tFall + 0.1);
    o.connect(lp); lp.connect(og); og.connect(bus); o.start(T.tLand); o.stop(T.tFall + 0.1);
    rat.connect(rb); rb.connect(rg); rg.connect(bus);
    for (let k = 0; k < 5; k++) { S.click(T.tFall + 0.04 + k * (0.07 + k * 0.03), 0.05 * (1 - k * 0.15), 0, bus); S.tone(T.tFall + 0.04 + k * 0.09, 0.05, 520 - k * 40, 0.025, 0, bus, 'sine', 0.001, 0.04); }
    S.laugh(T.tFall + 0.35, 0.022, 0.3, bus, 500, 4);
    // jacks: each toss — a sweep of metal on wood, the ball back in the hand
    const J = POCKET.jacks;
    for (let n = 0; ; n++) {
      const t0 = J.t0 - 0.35 + n * 0.8;
      if (t0 > J.t1) break;
      if (t0 + 0.2 < J.t0) continue;
      for (let k = 0; k < 4; k++) this._glass(S, t0 + 0.24 + k * 0.035, 0.012, -0.3, bus);
      S.tone(t0 + 0.74, 0.05, 300, 0.03, -0.3, bus, 'sine', 0.001, 0.04);
    }
    S.laugh(25.95, 0.025, -0.3, bus, 560, 4);
  }

  /* the meadow: open-field wind and gusts, grasshoppers, the kite's paper flutter and the string's hum */
  _meadow(S, bus, rev) {
    const ctx = S.ctx, t0 = 34.85, t1 = 42.4;
    const w = S.noise('pink', t0, t1 + 0.1), wb = S.filter('bandpass', 650, 0.5), wg = ctx.createGain();
    wg.gain.setValueAtTime(0.0001, t0); wg.gain.linearRampToValueAtTime(0.03, t0 + 0.05);
    for (let t = t0 + 0.4; t < t1; t += 0.5) wg.gain.linearRampToValueAtTime(0.022 + 0.022 * (noise1(t * 0.5, 9) * 0.5 + 0.5), t);
    wg.gain.linearRampToValueAtTime(0.0001, t1 + 0.02);
    w.connect(wb); wb.connect(wg); wg.connect(bus);
    for (let t = t0 + 0.3; t < t1; t += S.rng.range(0.4, 1.1)) { S.chirp(t, S.rng.range(5200, 6800), 0.004, S.rng.range(-0.8, 0.8), bus, true); }
    S.laugh(35.5, 0.03, 0.25, bus, 520, 5); S.voice(36.3, 620, 0.5, 'e', 0.025, -0.3, bus, 1.25); S.laugh(38.7, 0.025, -0.2, bus, 560, 4);
    S.chatter(37.0, 42.2, 0.012, 0.1, bus, 480, 3);
    // the kite: a flutter of paper and a thin hum in the string once it's up
    this._whoosh(S, 35.25, 0.8, 0.05, 0.15, bus, 400, 2600);
    const fl = S.noise('white', 35.3, t1), fb = S.filter('bandpass', 2800, 1.2), fg = ctx.createGain(); fg.gain.value = 0.0001;
    for (let t = 35.3; t < t1; t += 0.05) fg.gain.linearRampToValueAtTime(0.0001 + 0.012 * Math.max(0, Math.sin(t * 37) * 0.5 + 0.5) * (0.4 + 0.6 * (noise1(t * 0.8, 4) * 0.5 + 0.5)) * Math.max(0.3, 1 - (t - 35.3) / 9), t);
    fl.connect(fb); fb.connect(fg); fg.connect(bus);
    const hum = ctx.createOscillator(), hg = ctx.createGain(); hum.frequency.value = 880;
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.7; lg.gain.value = 18; lfo.connect(lg); lg.connect(hum.frequency);
    hg.gain.setValueAtTime(0.0001, 36.0); hg.gain.linearRampToValueAtTime(0.0035, 37.5); hg.gain.setValueAtTime(0.0035, t1 - 0.1); hg.gain.linearRampToValueAtTime(0.0001, t1);
    hum.connect(hg); hg.connect(bus); hum.start(36.0); hum.stop(t1 + 0.1); lfo.start(36.0); lfo.stop(t1 + 0.1);
  }

  /* imagination: the swell, stone grinding up out of the ground, the blade's ring, torches, clashes; all cut at the smash */
  _imagination(S, bus, rev, mus, musRev) {
    const ctx = S.ctx, ib = ctx.createGain(); ib.connect(bus);
    ib.gain.setValueAtTime(1, 45.9); ib.gain.setValueAtTime(1, 50.6); ib.gain.linearRampToValueAtTime(0.0001, 50.61);
    // the stick: grass and grit as you reach, a knock as you pick it up
    this._rustle(S, 42.8, 0.4, 0.03, 0, bus, 1800); S.clunk(43.15, 0.05, 0.05, bus);
    // the swell: a breath of air rising into shimmer
    this._whoosh(S, 45.6, 1.0, 0.08, 0, ib, 300, 5000);
    const sh = S.noise('white', 45.7, 46.4), shp = S.filter('highpass', 6000, 0.7), shg = ctx.createGain();
    shg.gain.setValueAtTime(0.0001, 45.7); shg.gain.exponentialRampToValueAtTime(0.03, 46.05); shg.gain.exponentialRampToValueAtTime(0.0001, 46.4);
    sh.connect(shp); shp.connect(shg); shg.connect(ib);
    // stone walls grinding up
    const rum = S.noise('brown', 46.0, 47.8), rl = S.filter('lowpass', 160, 0.7), rg = ctx.createGain();
    rg.gain.setValueAtTime(0.0001, 46.0); rg.gain.linearRampToValueAtTime(0.09, 46.4); rg.gain.linearRampToValueAtTime(0.0001, 47.7);
    rum.connect(rl); rl.connect(rg); rg.connect(ib);
    for (let k = 0; k < 14; k++) S.clunk(46.1 + k * 0.09 + S.rng.range(0, 0.04), 0.03, S.rng.range(-0.8, 0.8), ib);
    // the blade rings as it grows out of the stick
    for (const [f, a] of [[1320, 0.02], [1320 * 2.76, 0.01], [1320 * 5.4, 0.005]]) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(f * 0.7, 46.2); o.frequency.exponentialRampToValueAtTime(f, 46.75); g.gain.setValueAtTime(0.0001, 46.2); g.gain.linearRampToValueAtTime(a, 46.3); g.gain.setTargetAtTime(0, 46.75, 0.4); o.connect(g); g.connect(ib); g.connect(rev); o.start(46.2); o.stop(48.5); }
    // torches catch
    this._whoosh(S, 47.1, 0.5, 0.04, -0.5, ib, 300, 1200); this._whoosh(S, 47.2, 0.5, 0.04, 0.5, ib, 300, 1200);
    const cr = ctx.createBufferSource(); cr.buffer = S.crackleBuffer(4, 30); const cg = ctx.createGain(); cg.gain.value = 0.02; cr.connect(cg); cg.connect(ib); cr.start(47.2); cr.stop(50.6);
    // clashes: bright inharmonic metal with a noise crack; battle cries
    for (const tc of [48.15, 49.05, 49.95]) {
      for (const [m, a] of [[1, 0.06], [2.76, 0.035], [5.4, 0.02], [8.93, 0.012]]) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 610 * m; g.gain.setValueAtTime(0, tc); g.gain.linearRampToValueAtTime(a, tc + 0.004); g.gain.setTargetAtTime(0, tc + 0.004, 0.12); o.connect(g); g.connect(ib); g.connect(rev); o.start(tc); o.stop(tc + 0.9); }
      S.click(tc, 0.09, 0, ib); S.click(tc + 0.01, 0.06, 0.1, ib);
    }
    S.voice(47.9, 560, 0.3, 'a', 0.035, 0, ib, 1.3); S.voice(48.75, 600, 0.3, 'a', 0.035, 0.05, ib, 1.25); S.voice(49.7, 540, 0.25, 'a', 0.03, 0, ib, 1.3);
    S.chatter(47.0, 50.5, 0.012, -0.3, ib, 500, 5);    // the other knights
    // the smash cut: silence for a beat, then the two of you laughing in the plain street
    S.laugh(50.85, 0.045, 0.02, bus, 520, 6); S.laugh(51.05, 0.03, -0.1, bus, 470, 5);
    for (let k = 0; k < 6; k++) S.step(53.7 + k * 0.27, 0.06 * (1 - k * 0.12), -0.2 - k * 0.08, bus);
  }

  /* games with others: the long rope and its chant, counting at the tree, hopscotch, the catch, the chase */
  _games(S, bus, rev) {
    const ctx = S.ctx, R = SOCIAL.rope;
    for (let k = 0; ; k++) {
      const t = R.t0 + (k + 0.5) * R.period;
      if (t > R.t1) break;
      if (t < 55.0) continue;
      S.click(t, 0.05, -0.35, bus); S.tone(t, 0.04, 240, 0.02, -0.35, bus, 'sine', 0.002, 0.03);   // rope slaps the dirt
      S.voice(t - 0.12, 470 + (k % 2) * 60, 0.16, k % 2 ? 'e' : 'a', 0.016, -0.3, bus, 1.05);   // the skipping chant
    }
    // counting at the tree (muffled in his arms), a giggle beside you behind the barrels
    for (let k = 0; k < 6; k++) S.voice(56.75 + k * 0.2, 420 - k * 6, 0.14, k % 2 ? 'i' : 'u', 0.014, 0.05, bus, 0.95);
    S.voice(57.95, 470, 0.3, 'e', 0.02, 0.05, bus, 1.2);
    S.laugh(57.3, 0.012, -0.35, bus, 600, 3);
    // hopscotch: one-foot landings and the two-foot ones
    for (let t = 58.0; t < 59.4; t += 0.42) S.step(t + 0.3, 0.05, 0.05, bus);
    // the catch: a whoosh and the leather slap into both hands
    this._whoosh(S, 60.0, 0.45, 0.04, 0, bus, 500, 1800);
    S.clunk(SOCIAL.ball.catch, 0.11, 0, bus); S.click(SOCIAL.ball.catch, 0.06, 0, bus);
    S.laugh(60.7, 0.03, 0.2, bus, 520, 5);
    // the chase: your own running steps, shrieks and laughter all round
    for (let t = 60.85; t < 62.6; t += 0.29) S.step(t, 0.11, (Math.round((t - 60.85) / 0.29) % 2) ? 0.08 : -0.08, bus);
    S.chatter(60.8, 62.8, 0.02, 0, bus, 520, 7);
    S.voice(61.2, 720, 0.35, 'i', 0.022, 0.4, bus, 1.1); S.laugh(61.6, 0.025, -0.4, bus, 560, 5); S.laugh(62.1, 0.02, 0.3, bus, 480, 4);
  }

  /* the evening: crickets, a mother calling the kids in, goodbyes, the lamplighter's flame; warm slow music */
  _evening(S, bus, rev, mus, musRev) {
    const ctx = S.ctx;
    for (let t = 63.0; t < Math.min(CONFIG.duration, 67.6); t += 0.11) {
      const k = MathX.clamp((t - 63) / 3, 0, 1);
      if (S.rng.chance(0.55)) S.tone(t, 0.03, 4300 + S.rng.range(-120, 120), 0.003 * k, S.rng.range(-0.8, 0.8), bus, 'sine', 0.006, 0.02);
    }
    // "come in now!" from the porch: two long calling syllables, falling
    S.voice(63.1, 380, 0.45, 'o', 0.03, 0.55, rev, 1.15); S.voice(63.6, 430, 0.75, 'i', 0.03, 0.55, rev, 0.75);
    S.voice(63.1, 380, 0.45, 'o', 0.02, 0.55, bus, 1.15); S.voice(63.6, 430, 0.75, 'i', 0.02, 0.55, bus, 0.75);
    S.voice(64.5, 520, 0.4, 'a', 0.022, 0.1, bus, 0.85);   // your friend: "bye!"
    S.laugh(64.9, 0.012, -0.5, bus, 520, 3);
    for (let k = 0; k < 8; k++) S.step(63.0 + k * 0.5, 0.025 * (1 - k * 0.1), -0.4 + k * 0.1, bus);
    // the lamplighter: the pole clinks on the lantern, the gas catches and hisses
    S.click(65.1, 0.03, 0.5, bus); S.tone(65.12, 0.2, 1900, 0.008, 0.5, bus, 'sine', 0.003, 0.15);
    this._whoosh(S, 65.5, 0.5, 0.05, 0.5, bus, 200, 900);
    const h = S.noise('white', 65.6, 67.65), hb = S.filter('bandpass', 3800, 0.8), hg = ctx.createGain();
    hg.gain.setValueAtTime(0.0001, 65.6); hg.gain.linearRampToValueAtTime(0.004, 66.0); hg.gain.setValueAtTime(0.004, 67.58); hg.gain.linearRampToValueAtTime(0.0001, 67.6);
    h.connect(hb); hb.connect(hg); hg.connect(S.panned(bus, 0.5));
    // a far church bell for the evening
    for (const [f, a, d] of [[196, 0.014, 4.0], [392 * 1.19, 0.007, 3.0], [588 * 0.98, 0.005, 2.2]]) S.tone(66.2, d, f, a, -0.4, rev, 'sine', 0.006, d * 0.95);
    // music: a slow warm arpeggio over a soft pad (G – D – Em – C)
    const prog = [[98, 196, 246.9, 293.7], [73.4, 146.8, 220, 293.7], [82.4, 164.8, 246.9, 329.6], [65.4, 130.8, 196, 261.6]];
    for (let k = 0; k < 4; k++) {
      const t0 = 62.6 + k * 1.6, c = prog[k];
      for (const f of c) S.tone(t0, 1.75, f * 2, 0.006, 0, mus, 'triangle', 0.4, 0.8);
      c.forEach((f, j) => S.pluck(t0 + j * 0.3, f * 2, 0.035, -0.25 + j * 0.15, musRev, 2.4, 0.5));
    }
  }

  /* a voice telling a story: phrases of low syllables with a falling contour, pauses between */
  _murmur(S, t0, t1, f0, vol, pan, dest) {
    let t = t0;
    while (t < t1) {
      const n = S.rng.int(4, 9), top = f0 * S.rng.range(1.0, 1.2);
      for (let k = 0; k < n && t < t1; k++) {
        const d = S.rng.range(0.1, 0.22), f = top * (1 - 0.18 * k / n);
        S.voice(t, f, d, S.rng.pick(['o', 'a', 'u', 'e', 'o']), vol * S.rng.range(0.7, 1), pan, dest, S.rng.range(0.92, 1.05));
        t += d + S.rng.range(0.02, 0.07);
      }
      t += S.rng.range(0.3, 0.75);
    }
  }

  /* the parlour (67.6–80.4): the fire and the clock, checkers and a book, grandfather's story, the warmest music */
  _parlour(S, bus, rev, mus, musRev) {
    const ctx = S.ctx, P = PARLOUR, t0 = P.t0, t1 = P.t1;
    const fireAt = { x: P.fire.x, z: P.z0 + 0.25 }, gpa = { x: P.chair.x, z: P.chair.z }, cl = (x) => MathX.clamp(x, -0.9, 0.9);
    // fire: a soft roar and the crackle of coal, placed where the hearth is as you look around the room
    const fire = ctx.createGain(), fpan = ctx.createStereoPanner(); fire.connect(fpan); fpan.connect(bus); fpan.connect(rev);
    this._applySpatial(this._spatial(() => fireAt, t0, t1, 1 / 10, 2.5), fire.gain, fpan.pan, [], 1);
    const roar = S.noise('brown', t0, t1 + 0.1), rlp = S.filter('lowpass', 260, 0.6), rg = ctx.createGain(); rg.gain.value = 0.05; roar.connect(rlp); rlp.connect(rg); rg.connect(fire);
    const cr = ctx.createBufferSource(); cr.buffer = S.crackleBuffer(t1 - t0 + 0.5, 9); const cbp = S.filter('bandpass', 2300, 0.6), cg = ctx.createGain(); cg.gain.value = 0.06;
    cr.connect(cbp); cbp.connect(cg); cg.connect(fire); cr.start(t0); cr.stop(t1 + 0.1);
    // the mantel clock: tick, tock
    for (let t = t0 + 0.12, k = 0; t < t1; t += 0.5, k++) { const R = this._rel(fireAt.x, fireAt.z, t, 2); S.tone(t, 0.02, k % 2 ? 2100 : 2500, 0.006 * R.gain, cl(R.pan), bus, 'sine', 0.006, 0.015); S.click(t, 0.005 * R.gain, cl(R.pan), bus); }
    // mother's knitting needles
    for (let t = t0 + 0.05; t < 71.0; t += 0.16 + 0.05 * Math.sin(t * 7)) { const R = this._rel(1.62, 198.42, t, 1.5); S.click(t, 0.004 * R.gain, cl(R.pan), bus); }
    // grandfather talking (quietly at first, then telling the story); the children's 'ooh' and giggles
    { const R = this._rel(gpa.x, gpa.z, 69, 2.5); this._murmur(S, 67.9, 73.3, 120, 0.01 * R.gain + 0.004, cl(R.pan), bus); }
    this._murmur(S, 73.45, 80.3, 128, 0.013, 0, bus);
    S.voice(75.55, 380, 0.5, 'u', 0.012, -0.3, bus, 1.25); S.voice(75.6, 430, 0.45, 'o', 0.01, 0.3, bus, 1.2);
    S.laugh(77.4, 0.014, 0.25, bus, 520, 4); S.laugh(77.7, 0.012, -0.25, bus, 480, 3);
    S.voice(78.95, 400, 0.6, 'a', 0.013, 0.2, bus, 1.3); S.voice(79.0, 460, 0.55, 'o', 0.011, -0.2, bus, 1.25);
    // checkers: pick up, two hops (clack, clack), your friend's groan
    S.click(71.32, 0.03, 0.1, bus);
    const J = P.jump;
    for (const tj of J.t) { const tl = tj + J.hop; S.clunk(tl, 0.035, 0.05, bus); S.click(tl, 0.04, 0.05, bus); S.tone(tl, 0.05, 1500, 0.01, 0.05, bus, 'sine', 0.006, 0.04); }
    S.voice(71.66, 330, 0.4, 'o', 0.02, -0.05, bus, 0.7); S.laugh(72.0, 0.012, 0.0, bus, 560, 3);
    // the book: a page lifted and turned
    this._rustle(S, 72.55, 0.42, 0.03, 0.05, bus, 3600); this._whoosh(S, 72.6, 0.4, 0.012, 0.05, bus, 900, 2600);
    this._rustle(S, 72.98, 0.08, 0.035, -0.05, bus, 2600);
    // music: a gentle music-box tune over a soft string pad (G – Em – C – D), then the story theme swelling to the castle; cut dead at the phone
    const pad = (ta, tb, freqs, vol, cut = 1400) => {
      for (const f of freqs) for (const d of [-5, 5]) {
        const o = ctx.createOscillator(), g = ctx.createGain(), lp = S.filter('lowpass', cut, 0.5);
        o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = d;
        g.gain.setValueAtTime(0.0001, ta); g.gain.linearRampToValueAtTime(vol, ta + 0.6); g.gain.setValueAtTime(vol, tb - 0.5); g.gain.linearRampToValueAtTime(0.0001, tb);
        o.connect(lp); lp.connect(g); g.connect(mus); g.connect(musRev); o.start(ta); o.stop(tb + 0.05);
      }
    };
    const prog = [[98, 196, 246.9, 293.7], [82.4, 164.8, 246.9, 329.6], [65.4, 130.8, 196, 261.6], [73.4, 146.8, 220, 293.7]];
    for (let k = 0; k < 4; k++) { const ta = 68.6 + k * 1.5; pad(ta, ta + 1.6, prog[k], 0.0022); }
    const box = [[68.75, 587.3], [69.05, 784], [69.35, 740], [69.65, 659.3], [70.1, 587.3], [70.4, 493.9], [70.7, 523.3], [71.0, 493.9], [71.6, 440], [71.9, 493.9], [72.2, 587.3], [72.6, 659.3], [73.1, 587.3], [73.5, 493.9]];
    for (const [t, f] of box) { S.pluck(t, f * 2, 0.022, 0.2, musRev, 1.6, 0.85); S.pluck(t, f * 2, 0.016, 0.2, mus, 1.6, 0.85); }
    // the story: deeper pad, a warm flute line, a harp flourish as each picture appears, a full chord for the castle
    const story = [[74.6, 76.4, [98, 196, 293.7, 392]], [76.4, 77.9, [82.4, 164.8, 246.9, 392]], [77.9, 78.7, [65.4, 130.8, 261.6, 329.6]], [78.7, 80.45, [73.4, 146.8, 293.7, 370, 440]]];
    for (const [ta, tb, f] of story) pad(ta, tb + 0.1, f, 0.0032, 1700);
    const mel = [[74.9, 587.3, 0.6], [75.55, 784, 0.9], [76.5, 740, 0.45], [77.0, 659.3, 0.9], [78.0, 587.3, 0.6], [78.7, 880, 1.6]];
    for (const [t, f, d] of mel) {
      const o = ctx.createOscillator(), g = ctx.createGain(), vib = ctx.createOscillator(), vg = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f; vib.frequency.value = 5; vg.gain.value = f * 0.005; vib.connect(vg); vg.connect(o.frequency);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.014, t + 0.1); g.gain.setValueAtTime(0.013, t + d * 0.8); g.gain.linearRampToValueAtTime(0, t + d + 0.12);
      o.connect(g); g.connect(mus); g.connect(musRev); o.start(t); o.stop(t + d + 0.2); vib.start(t); vib.stop(t + d + 0.2);
    }
    for (const [t, root] of [[75.3, 293.7], [77.1, 329.6], [78.7, 293.7]]) [1, 1.26, 1.5, 2, 2.52, 3].forEach((m, k) => S.pluck(t + k * 0.06, root * m, 0.035, -0.4 + k * 0.16, musRev, 2.2, 0.6));
    for (let k = 0; k < 10; k++) S.tone(78.7 + k * 0.07, 0.25, 55, 0.02 * (k / 10), 0, mus, 'sine', 0.006, 0.2);   // a soft timpani roll into the castle
    S.tone(79.45, 1.2, 73.4, 0.05, 0, mus, 'sine', 0.008, 1.0);
  }

  /* back in the bedroom (80.4–88.4): the buzz, the hum, laughter outside, the phone put down, the door; then one warm note */
  _return(S, bus, rev, endBus, endRev) {
    const ctx = S.ctx;
    // the phone buzzing against the duvet: a muffled motor rattle, twice
    for (const [ta, tb] of [[80.42, 80.62], [80.72, 80.92]]) {
      const o = ctx.createOscillator(), o2 = ctx.createOscillator(), lp = S.filter('lowpass', 700, 0.8), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = 168; o2.type = 'square'; o2.frequency.value = 336.5;
      g.gain.setValueAtTime(0, ta); g.gain.linearRampToValueAtTime(0.07, ta + 0.012); g.gain.setValueAtTime(0.07, tb - 0.015); g.gain.linearRampToValueAtTime(0, tb);
      const g2 = ctx.createGain(); g2.gain.value = 0.25; o2.connect(g2); g2.connect(lp);
      o.connect(lp); lp.connect(g); g.connect(S.panned(bus, 0.25)); o.start(ta); o.stop(tb + 0.02); o2.start(ta); o2.stop(tb + 0.02);
    }
    // the room at night: a low hum, a faint fridge-like tone somewhere in the house, crickets through the window
    const hum = S.noise('pink', 80.4, 88.45), hl = S.filter('lowpass', 220, 0.5), hg = ctx.createGain(); hg.gain.value = 0.028; hum.connect(hl); hl.connect(hg); hg.connect(bus);
    S.tone(80.4, 8.0, 100, 0.0025, -0.2, bus, 'sine', 0.006, 0.05);
    for (let t = 80.5; t < 88.3; t += 0.12) if (S.rng.chance(0.5)) S.tone(t, 0.03, 4300 + S.rng.range(-100, 100), 0.0018, -0.5, bus, 'sine', 0.006, 0.02);
    // picking it up: the duvet, a little click; the swipes
    this._rustle(S, 81.25, 0.25, 0.02, 0.2, bus, 1400); S.click(81.36, 0.012, 0.15, bus);
    for (const t of [81.9, 82.35]) this._whoosh(S, t, 0.2, 0.006, 0.1, bus, 1800, 3600);
    // outside: children laughing and running past, muffled by the glass and the curtain
    const glass = ctx.createGain(), gl = S.filter('lowpass', 750, 0.7); glass.connect(gl); gl.connect(bus); gl.connect(rev);
    glass.gain.setValueAtTime(0.0001, 82.0); glass.gain.linearRampToValueAtTime(1, 82.5); glass.gain.setValueAtTime(1, 84.4); glass.gain.linearRampToValueAtTime(0.25, 85.4);
    S.laugh(82.25, 0.05, -0.35, glass, 520, 5); S.chatter(82.4, 85.2, 0.035, -0.3, glass, 470, 6); S.laugh(83.0, 0.045, -0.1, glass, 600, 4); S.voice(83.5, 720, 0.4, 'i', 0.04, 0.1, glass, 1.1); S.laugh(84.0, 0.04, 0.2, glass, 480, 5);
    for (let t = 82.55; t < 84.8; t += 0.16) S.step(t, 0.05, -0.2 + (t - 82.55) * 0.2, glass);
    const hoop = S.noise('brown', 82.5, 84.0), hpl = S.filter('lowpass', 300, 0.7), hpg = ctx.createGain(); S.env(hpg, 82.5, 0.5, 0.05, 1.0); hoop.connect(hpl); hpl.connect(hpg); hpg.connect(glass);
    // the phone goes down on its face: a soft thunk into the duvet
    S.thump(85.7, 0.05, bus); this._rustle(S, 85.68, 0.15, 0.015, 0.1, bus, 1200);
    // the light round the door: a faint warm air, and the past behind it — birds, a far laugh — growing as you go to it
    const past = ctx.createGain(), pl = S.filter('lowpass', 600, 0.6); past.connect(pl); pl.connect(bus);
    past.gain.setValueAtTime(0.0001, 85.6); past.gain.linearRampToValueAtTime(0.6, 87.0); past.gain.linearRampToValueAtTime(1.0, 87.5);
    pl.frequency.setValueAtTime(600, 87.45); pl.frequency.exponentialRampToValueAtTime(7000, 88.2);
    for (let t = 85.8; t < 88.4; t += S.rng.range(0.15, 0.4)) S.chirp(t, S.rng.range(2600, 4400), S.rng.range(0.01, 0.02), S.rng.range(-0.5, 0.5), past, false);
    S.chatter(86.2, 88.4, 0.025, -0.1, past, 450, 4); S.laugh(87.2, 0.04, 0.0, past, 520, 4);
    const air = S.noise('pink', 85.6, 88.45), ab = S.filter('bandpass', 600, 0.7), ag = ctx.createGain();
    ab.frequency.setValueAtTime(500, 87.45); ab.frequency.exponentialRampToValueAtTime(3000, 88.3);
    ag.gain.setValueAtTime(0.0001, 85.6); ag.gain.linearRampToValueAtTime(0.012, 87.0); ag.gain.linearRampToValueAtTime(0.06, 88.3);
    air.connect(ab); ab.connect(ag); ag.connect(bus);
    // stand (the bed creaks), two quick steps, the latch, the hinge
    { const n = S.noise('pink', 86.4, 86.8), bp = S.filter('bandpass', 300, 3), g = ctx.createGain(); bp.frequency.setValueAtTime(260, 86.4); bp.frequency.linearRampToValueAtTime(520, 86.75); S.env(g, 86.4, 0.05, 0.05, 0.3); n.connect(bp); bp.connect(g); g.connect(bus); }
    for (const t of [86.95, 87.25]) { S.step(t, 0.05, 0, bus); S.tone(t, 0.09, 120, 0.02, 0, rev, 'sine', 0.006, 0.07); }
    S.click(87.46, 0.07, 0.1, bus); S.clunk(87.48, 0.05, 0.1, bus);
    { const o = ctx.createOscillator(), hb = S.filter('bandpass', 1300, 5), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(720, 87.52); o.frequency.linearRampToValueAtTime(560, 88.1);
      g.gain.setValueAtTime(0, 87.52); g.gain.linearRampToValueAtTime(0.01, 87.6); g.gain.setValueAtTime(0.01, 88.0); g.gain.linearRampToValueAtTime(0, 88.3); o.connect(hb); hb.connect(g); g.connect(bus); g.connect(rev); o.start(87.52); o.stop(88.35); }
    // black. a breath of silence, then one warm chord
    for (const [f, v] of [[196, 0.05], [246.9, 0.035], [293.7, 0.035], [392, 0.03]]) { S.pluck(88.95, f, v, 0, endBus, 2.6, 0.45); S.pluck(88.95, f, v * 0.8, 0, endRev, 2.6, 0.45); }
    for (const f of [98, 196, 293.7]) S.tone(88.95, 1.5, f, 0.012, 0, endRev, 'sine', 0.3, 1.0);
  }

  /* music for the meadow (big, open, uplifting) and the castle (heroic) */
  _musicC(S, mus, rev) {
    const ctx = S.ctx;
    const pad = (t0, t1, freqs, vol, cut = 1800) => {
      for (const f of freqs) for (const d of [-7, 6]) {
        const o = ctx.createOscillator(), g = ctx.createGain(), lp = S.filter('lowpass', cut, 0.5);
        o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = d;
        g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.5); g.gain.setValueAtTime(vol, t1 - 0.4); g.gain.linearRampToValueAtTime(0.0001, t1);
        o.connect(lp); lp.connect(g); g.connect(mus); g.connect(rev); o.start(t0); o.stop(t1 + 0.05);
      }
    };
    // meadow: D – A – Bm – G, each 1.9 s, with a soaring flute-like line and harp arpeggios
    const prog = [[146.8, 293.7, 370, 440], [110, 277.2, 329.6, 440], [123.5, 293.7, 370, 493.9], [98, 246.9, 293.7, 392]];
    for (let k = 0; k < 4; k++) { const t0 = 34.85 + k * 1.9; pad(t0, t0 + 1.95, prog[k], 0.0032); prog[k].forEach((f, j) => S.pluck(t0 + j * 0.12, f * 2, 0.04, -0.3 + j * 0.2, rev, 2.0, 0.6)); S.pluck(t0, prog[k][0] / 2, 0.08, 0, mus, 2.2, 0.3); }
    const mel = [[35.3, 740, 0.5], [35.8, 880, 0.4], [36.2, 987.8, 0.9], [37.2, 880, 0.5], [37.7, 1174.7, 1.2], [39.0, 1108.7, 0.5], [39.5, 880, 0.6], [40.2, 987.8, 0.5], [40.7, 880, 0.4], [41.1, 740, 1.2]];
    for (const [t, f, d] of mel) {
      const o = ctx.createOscillator(), g = ctx.createGain(), vib = ctx.createOscillator(), vg = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f; vib.frequency.value = 5.2; vg.gain.value = f * 0.006; vib.connect(vg); vg.connect(o.frequency);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.018, t + 0.08); g.gain.setValueAtTime(0.016, t + d * 0.8); g.gain.linearRampToValueAtTime(0, t + d + 0.1);
      o.connect(g); g.connect(mus); g.connect(rev); o.start(t); o.stop(t + d + 0.15); vib.start(t); vib.stop(t + d + 0.15);
    }
    // the stick: one soft held note, then nothing for the held breath
    S.tone(42.45, 2.4, 293.7, 0.012, 0, rev, 'triangle', 0.3, 1.2);
    // the castle: a choir of 'ah' voices, brass-like stabs, timpani — all gone at the smash cut
    const cm = ctx.createGain(); cm.connect(mus); cm.gain.setValueAtTime(1, 50.6); cm.gain.linearRampToValueAtTime(0.0001, 50.61);
    for (const f of [146.8, 220, 293.7, 370]) S.voice(46.05, f * (f < 200 ? 1 : 1), 4.5, 'a', 0.014, (f % 3) - 1, cm, 1.0);
    pad(46.1, 50.6, [73.4, 146.8, 220, 293.7], 0.0045, 1200);
    for (const [t, c] of [[46.4, [293.7, 370, 440]], [47.6, [293.7, 370, 440]], [48.15, [329.6, 415.3, 493.9]], [49.05, [293.7, 370, 440]], [49.95, [392, 493.9, 587.3]]]) {
      for (const f of c) { const o = ctx.createOscillator(), g = ctx.createGain(), lp = S.filter('lowpass', 1500, 0.6); o.type = 'sawtooth'; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.012, t + 0.02); g.gain.setTargetAtTime(0, t + 0.15, 0.15); o.connect(lp); lp.connect(g); g.connect(cm); o.start(t); o.stop(t + 1.0); }
      const k = ctx.createOscillator(), kg = ctx.createGain(); k.frequency.setValueAtTime(90, t); k.frequency.exponentialRampToValueAtTime(48, t + 0.4); kg.gain.setValueAtTime(0, t); kg.gain.linearRampToValueAtTime(0.09, t + 0.008); kg.gain.setTargetAtTime(0, t + 0.01, 0.18); k.connect(kg); kg.connect(cm); k.start(t); k.stop(t + 1.0);
    }
    // after the laughter: the light street rhythm comes back, leading into the games
    const chords = [[146.8, 220, 293.7, 370], [110, 220, 277.2, 329.6]];
    for (let t = 51.35, i = 0; t < Math.min(CONFIG.duration + 0.5, 62.6); t += 0.25, i++) {
      const c = chords[Math.floor(i / 8) % 2], beat = i % 8, pat = [0, 2, 1, 3, 2, 1, 3, 2][beat];
      S.pluck(t, c[pat] * 2, 0.04 * Math.min(1, (t - 51.35) / 1.5), beat % 2 ? 0.25 : -0.2, mus, 0.9, 0.62);
      if (beat === 0 || beat === 4) S.pluck(t, c[0], 0.06, 0, mus, 1.4, 0.3);
      if (beat % 2 === 1) this._shaker(S, t, 0.4, mus);
    }
  }

  /* the workshop: paper, twine, chatter; the montage cuts land on the beat; the kite reveal */
  _workshop(S, bus, rev, mus) {
    const W = KITE.bench;
    S.chatter(26.6, 30.6, 0.022, -0.2, bus, 470, 4);
    for (const t of [27.4, 28.6, 29.5, 30.2]) this._rustle(S, t, 0.35, 0.03, -0.15, bus);
    for (const t of [28.1, 29.9]) S.voice(t, 300, 0.12, 'i', 0.008, 0.1, bus, 1.4);     // twine squeak
    // montage: a woody knock on every cut, with the sound of what is being done
    for (const t of [30.85, 31.85, 32.35]) { S.clunk(t, 0.08, 0, mus); S.tone(t, 0.12, 82, 0.05, 0, mus, 'sine', 0.003, 0.1); }
    for (let k = 0; k < 6; k++) S.voice(31.0 + k * 0.12, 260 + k * 30, 0.08, 'i', 0.008, 0.1, bus, 1.3);   // twine wound tight
    this._rustle(S, 31.9, 0.4, 0.05, 0, bus, 2000);    // paste brushed on paper
    this._rustle(S, 32.4, 0.35, 0.04, 0.1, bus, 4200); // rag bows tied
    // the reveal: a gust, the tail flutters, the gang cheers
    this._whoosh(S, 32.75, 1.6, 0.06, 0.2, bus, 300, 1800);
    for (let k = 0; k < 10; k++) this._rustle(S, 33.0 + k * 0.18, 0.12, 0.012, 0.2, bus, 3500);
    S.laugh(33.05, 0.03, 0.3, bus, 520, 5); S.voice(32.95, 640, 0.4, 'e', 0.025, -0.25, bus, 1.2);
  }

  /* modern room: a low hum of a house at night */
  _room(S, bus) {
    const ctx = S.ctx, n = S.noise('pink', 0, 6.8), lp = S.filter('lowpass', 260, 0.5), g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, 0); g.gain.linearRampToValueAtTime(0.03, 0.2); g.gain.setValueAtTime(0.03, 6.0); g.gain.linearRampToValueAtTime(0.0001, 6.7);
    n.connect(lp); lp.connect(g); g.connect(bus);
    const h = S.noise('white', 0, 6.8), hp = S.filter('bandpass', 5200, 0.6), hg = ctx.createGain();
    hg.gain.setValueAtTime(0.0035, 0); hg.gain.setValueAtTime(0.0035, 6.0); hg.gain.linearRampToValueAtTime(0.0001, 6.6);
    h.connect(hp); hp.connect(hg); hg.connect(bus);
  }

  /* the phone: tinny video audio through a small speaker until it dies */
  _phone(S, bus, rev) {
    const ctx = S.ctx, spk = ctx.createGain(), bp = S.filter('bandpass', 1900, 0.7), hp = S.filter('highpass', 600, 0.7);
    spk.connect(hp); hp.connect(bp); bp.connect(bus);
    spk.gain.setValueAtTime(1, 0); spk.gain.setValueAtTime(1, 1.94); spk.gain.linearRampToValueAtTime(0.0001, 1.96);
    const notes = [523.3, 659.3, 784, 659.3, 587.3, 784, 880, 784];
    for (let k = 0; k < 16; k++) { const t = k * 0.125; if (t > 1.95) break; S.tone(t, 0.11, notes[k % 8] * (k % 4 === 0 ? 0.5 : 1), 0.03, 0, spk, 'square', 0.005, 0.06); }
    S.chatter(0.05, 1.9, 0.05, 0, spk, 210, 5);                    // someone talking in the video
    S.tick(0.48, 3200, 0.01, bus); S.tick(1.08, 3200, 0.01, bus);  // scroll haptics
    // low-battery chime
    S.tone(1.47, 0.12, 1046.5, 0.022, 0, bus, 'sine', 0.005, 0.08); S.tone(1.6, 0.2, 784, 0.02, 0, bus, 'sine', 0.005, 0.14);
    // power-down blip
    const o = ctx.createOscillator(), og = ctx.createGain(); o.frequency.setValueAtTime(520, 1.95); o.frequency.exponentialRampToValueAtTime(130, 2.14);
    S.env(og, 1.95, 0.004, 0.035, 0.2); o.connect(og); og.connect(bus); og.connect(rev); o.start(1.95); o.stop(2.2);
    S.click(1.95, 0.03, 0, bus);
    // two dull taps on dead glass
    for (const t of [2.5, 2.88]) { S.click(t, 0.05, 0.05, bus); S.tone(t, 0.05, 190, 0.05, 0.05, bus, 'sine', 0.002, 0.04); }
  }

  /* the door: children muffled behind it, the bed, two steps, latch, hinge, the light */
  _door(S, bus, roomSend, outSend) {
    const ctx = S.ctx;
    const muf = ctx.createGain(), lp = S.filter('lowpass', 520, 0.6);
    muf.connect(lp); lp.connect(bus);
    muf.gain.setValueAtTime(0.0001, 3.3); muf.gain.linearRampToValueAtTime(0.5, 5.9); muf.gain.linearRampToValueAtTime(0.0001, 6.5);
    lp.frequency.setValueAtTime(520, 5.95); lp.frequency.exponentialRampToValueAtTime(6000, 6.45);
    S.chatter(3.3, 6.5, 0.05, -0.1, muf, 440, 4);
    S.laugh(4.25, 0.06, -0.15, muf, 500, 5); S.laugh(5.2, 0.05, 0.1, muf, 460, 4);
    // bed creak as you stand, two steps on the floorboards
    const n = S.noise('pink', 4.62, 5.0), bp = S.filter('bandpass', 320, 3), g = ctx.createGain();
    bp.frequency.setValueAtTime(260, 4.62); bp.frequency.linearRampToValueAtTime(520, 4.95);
    S.env(g, 4.62, 0.05, 0.05, 0.3); n.connect(bp); bp.connect(g); g.connect(bus);
    // latch and hinge
    S.click(5.96, 0.07, 0.1, bus); S.clunk(5.98, 0.05, 0.1, bus);
    const o = ctx.createOscillator(), hb = S.filter('bandpass', 1300, 5), hg = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(720, 6.03); o.frequency.linearRampToValueAtTime(560, 6.6);
    hg.gain.setValueAtTime(0.0001, 6.03); hg.gain.exponentialRampToValueAtTime(0.01, 6.12); hg.gain.setValueAtTime(0.01, 6.45); hg.gain.exponentialRampToValueAtTime(0.0001, 6.7);
    o.connect(hb); hb.connect(hg); hg.connect(bus); hg.connect(roomSend); o.start(6.03); o.stop(6.75);
    // the light: an airy swell that opens into the outdoors
    const w = S.noise('pink', 5.85, 7.4), wb = S.filter('bandpass', 500, 0.8), wg = ctx.createGain();
    wb.frequency.setValueAtTime(400, 5.85); wb.frequency.exponentialRampToValueAtTime(3200, 6.5); wb.frequency.exponentialRampToValueAtTime(900, 7.3);
    wg.gain.setValueAtTime(0.0001, 5.85); wg.gain.exponentialRampToValueAtTime(0.06, 6.42); wg.gain.exponentialRampToValueAtTime(0.0001, 7.4);
    w.connect(wb); wb.connect(wg); wg.connect(bus); wg.connect(outSend);
    const sh = S.noise('white', 5.9, 6.5), shp = S.filter('highpass', 5000, 0.7), shg = ctx.createGain();
    shg.gain.setValueAtTime(0.0001, 5.9); shg.gain.exponentialRampToValueAtTime(0.018, 6.44); shg.gain.linearRampToValueAtTime(0.0001, 6.5);
    sh.connect(shp); shp.connect(shg); shg.connect(bus);
  }

  /* the past outside: air, birds, a distant cart, a church bell, a playground of voices */
  _outside(S, bus, rev) {
    const ctx = S.ctx, t0 = 6.0, end = Math.min(CONFIG.duration + 1, 67.62);     // (outdoors ends at the cut into the parlour)
    const air = S.noise('pink', t0, end), ab = S.filter('bandpass', 700, 0.4), ag = ctx.createGain();
    ag.gain.setValueAtTime(0.0001, t0); ag.gain.linearRampToValueAtTime(0.026, 6.9);
    for (let t = 7; t < end - 0.1; t += 1.3) ag.gain.linearRampToValueAtTime(0.02 + 0.012 * (noise1(t * 0.4, 5) * 0.5 + 0.5), t);
    air.connect(ab); ab.connect(ag); ag.connect(bus);
    // birds: scattered chirps and two-note songs
    for (let t = 6.3; t < Math.min(end, 66.0); t += S.rng.range(0.15, 0.6)) {
      const pan = S.rng.range(-0.9, 0.9), f = S.rng.range(2600, 4600), v = S.rng.range(0.005, 0.014);
      S.chirp(t, f, v, pan, bus, false);
      if (S.rng.chance(0.35)) S.chirp(t + 0.11, f * 1.18, v * 0.8, pan, bus, false);
      if (S.rng.chance(0.15)) S.chirp(t + 0.22, f * 0.92, v * 0.7, pan, bus, false);
    }
    // a distant horse and cart: slow clip-clop and wheel rumble, far left
    const cart = ctx.createGain(), clp = S.filter('lowpass', 1400, 0.6); cart.connect(clp); clp.connect(S.panned(bus, -0.6)); clp.connect(rev);
    cart.gain.setValueAtTime(0.0001, 6.2); cart.gain.linearRampToValueAtTime(0.5, 7.5);
    for (let t = 6.4, k = 0; t < end; t += 0.27 + (k % 2) * 0.06, k++) S.clunk(t, 0.02, 0, cart);
    const rum = S.noise('brown', 6.2, end), rlp = S.filter('lowpass', 140, 0.6), rg = ctx.createGain(); rg.gain.value = 0.02; rum.connect(rlp); rlp.connect(rg); rg.connect(cart);
    // a church bell, far away
    for (const [f, a, d] of [[220, 0.016, 3.5], [440 * 1.19, 0.008, 2.6], [660 * 0.98, 0.006, 2.0], [880 * 1.33, 0.004, 1.4]]) S.tone(8.3, d, f, a, 0.35, rev, 'sine', 0.004, d * 0.95);
    // the playground: distant chatter all round, and laughs now and then
    const far = ctx.createGain(), flp = S.filter('lowpass', 2600, 0.6); far.connect(flp); flp.connect(bus); flp.connect(rev);
    far.gain.setValueAtTime(0.0001, t0); far.gain.linearRampToValueAtTime(1, 6.8);
    for (const [pan, f0] of [[-0.5, 430], [0.4, 470], [0.0, 400], [-0.2, 520]]) S.chatter(6.1, end, 0.012, pan, far, f0, 3);
    for (const [t, pan, v] of [[7.4, -0.4, 0.016], [8.9, 0.3, 0.014], [12.9, 0.25, 0.016], [13.9, -0.35, 0.014]]) S.laugh(t, v, pan, far, S.rng.range(440, 540), S.rng.int(4, 6));
    const duck = [[34.8, 1], [34.86, 0.35], [42.38, 0.35], [42.42, 0.9], [44.9, 0.9], [45.3, 0.12], [46.0, 0.12], [46.3, 0.3], [50.58, 0.3], [50.62, 1.0]];
    for (const g of [far.gain, cart.gain]) for (const [t, v] of duck) g.linearRampToValueAtTime(v * (g === cart.gain ? 0.5 : 1), t);
    for (const [t, v] of duck) ag.gain.linearRampToValueAtTime(0.024 * (v < 0.5 ? v * 1.5 : 1), t);
    // the cut indoors: everything outside stops at once (a 20 ms ramp, no click)
    for (const g of [ag.gain, far.gain, cart.gain]) { g.linearRampToValueAtTime(g === ag.gain ? 0.024 : g === cart.gain ? 0.5 : 1, 67.58); g.linearRampToValueAtTime(0.0001, 67.6); }
  }

  /* the children: footsteps from their paths, hoops, the ball game, the rope, calls */
  _kidsSound(S, bus, rev) {
    const ctx = S.ctx;
    const dirt = ctx.createGain(); dirt.gain.value = 1; dirt.connect(bus); dirt.connect(rev);
    for (const k of this.kids.people) {
      const runner = (k.states || []).some((s) => /run|carry/i.test(s[1]));
      if (!runner) continue;
      let prev = null, prevDist = null;
      for (let t = 5.8; t < Math.min(CONFIG.duration, 67.6); t += 1 / 120) {
        if (!k.shown(t)) { prev = null; continue; }
        const L = k.locate(t);
        const jump = prevDist !== null && L.dist - prevDist > 0.5; prevDist = L.dist;
        if (!L.moving || jump) { prev = null; continue; }
        const step = Math.floor(L.dist / (k.strideAt(t) / 2));
        if (prev !== null && step !== prev) {
          const R = this._rel(L.x, L.z, t, 3);
          S.step(t, 0.11 * R.gain * (k.spec.id === 'runner' ? 1.6 : 1), R.pan, dirt);
        }
        prev = step;
      }
      // hoops: a soft rolling rumble and the stick's taps
      if (k.spec.hoop) {
        const hEnd = Math.min(CONFIG.duration, 67.6);
        const n = S.noise('brown', 6.0, hEnd), lp = S.filter('lowpass', 320, 0.7), g = ctx.createGain(), p = ctx.createStereoPanner();
        n.connect(lp); lp.connect(g); g.connect(p); p.connect(bus);
        const pts = this._spatial((t) => { const L = k.locate(t); return { x: L.x, z: L.z }; }, 6.0, hEnd - 0.05, 1 / 15, 3);
        this._applySpatial(pts, g.gain, p.pan, [], 0.05);
        g.gain.linearRampToValueAtTime(0.00001, hEnd);
        for (let t = 6.1; t < hEnd; t += 0.24 + 0.05 * Math.sin(t * 3)) { const L = k.locate(t), R = this._rel(L.x, L.z, t, 3); S.click(t, 0.02 * R.gain, R.pan, bus); }
      }
    }
    // the runner's laugh as he rushes past, a shout and a shriek in the game of tag, a laugh after
    const runner = this.kids.byId.runner;
    if (runner) { const L = runner.locate(10.15), R = this._rel(L.x, L.z, 10.15, 2); S.laugh(10.12, 0.05 * R.gain + 0.012, R.pan, bus, 520, 4); }
    const at = (id, t) => { const L = this.kids.byId[id].locate(t); return this._rel(L.x, L.z, t, 6); };
    { const R = at('tagIt', 11.55); S.voice(11.5, 560, 0.28, 'e', 0.03 * R.gain, R.pan, bus, 1.25); }
    { const R = at('tag2', 11.82); S.voice(11.8, 760, 0.3, 'i', 0.028 * R.gain, R.pan, bus, 1.1); S.laugh(12.2, 0.02 * R.gain, R.pan, bus, 600, 4); }
    { const R = at('tag3', 12.3); S.laugh(12.35, 0.022 * R.gain, R.pan, bus, 470, 5); }
    // the ball game: a leather slap at each catch
    for (const [t0, from, to, fl] of SCRIPT.throws || []) {
      if (!this.kids.byId[from] || !this.kids.byId[to]) continue;
      const tc = t0 + fl, R = at(to, tc), R0 = at(from, t0);
      S.clunk(tc, 0.05 * R.gain, R.pan, bus); S.click(tc, 0.03 * R.gain, R.pan, bus);
      const w = S.noise('pink', t0 - 0.05, t0 + 0.2), wb = S.filter('bandpass', 1200, 1), wg = ctx.createGain();
      S.env(wg, t0 - 0.05, 0.05, 0.01 * R0.gain, 0.15); w.connect(wb); wb.connect(wg); wg.connect(S.panned(bus, R0.pan));
    }
    // the skipping rope slaps the ground under her feet
    const rope = this.kids.byId.rope;
    if (rope) for (let k = 0; ; k++) {
      const t = (k + 0.5) * 0.52 - rope.seed;
      if (t > Math.min(CONFIG.duration, 15.0)) break;      // (her skipping rope belongs to the street race)
      if (t < 6.0) continue;
      const L = rope.locate(t), R = this._rel(L.x, L.z, t, 4);
      S.click(t, 0.04 * R.gain, R.pan, bus); S.tone(t, 0.04, 260, 0.012 * R.gain, R.pan, bus, 'sine', 0.002, 0.03);
    }
  }

  /* your own steps: floorboards, the hollow porch, its steps, then running on packed dirt */
  _povSteps(S, bus, roomSend, outSend) {
    const wood = (t, v) => { S.step(t, v, 0, bus); S.tone(t, 0.09, 120, v * 0.4, 0, roomSend, 'sine', 0.003, 0.07); };
    for (const t of [5.32, 5.72]) wood(t, 0.09);
    for (const t of [6.3, 6.72, 7.25, 7.8, 8.55, 8.85, 9.15, 9.45]) wood(t, 0.08);
    // running: the same step rhythm as the camera bob
    const C = SCRIPT.camera, tx = new Track(C.x), tz = new Track(C.z), P = CONFIG.camera;
    let ph = 0, prev = null, px = tx.value(12.0), pz = tz.value(12.0);
    for (let t = 12.0; t < 15.0; t += 1 / 120) {
      const x = tx.value(t), z = tz.value(t), dd = Math.hypot(x - px, z - pz), sp = dd * 120;
      ph += dd * P.bobFrequency / (1 + Math.max(0, sp / P.walkSpeed - 1) * (P.runStrideGain || 0));
      const step = Math.floor(ph);
      if (prev !== null && step !== prev && sp > 0.4) { S.step(t, 0.13, step % 2 ? 0.08 : -0.08, bus); S.step(t, 0.03, 0, outSend); }
      prev = step; px = x; pz = z;
    }
  }

  /* music: curiosity → warm wonder → a light plucked rhythm */
  _music(S, mus, rev) {
    const ctx = S.ctx;
    // a soft, open interval while you look at the door
    for (const f of [220, 329.6]) {
      const o = ctx.createOscillator(), g = ctx.createGain(), lp = S.filter('lowpass', 900, 0.5);
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, 3.4); g.gain.exponentialRampToValueAtTime(0.02, 5.0); g.gain.setValueAtTime(0.02, 5.9); g.gain.exponentialRampToValueAtTime(0.0001, 6.6);
      o.connect(lp); lp.connect(g); g.connect(mus); g.connect(rev); o.start(3.4); o.stop(6.7);
    }
    // warm wonder: D major add9 pad swelling with the light
    for (const f of [146.8, 220, 293.7, 370, 659.3]) {
      const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), lp = S.filter('lowpass', 1600, 0.4);
      o.type = 'triangle'; o.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f * 1.004;
      g.gain.setValueAtTime(0.0001, 6.0); g.gain.exponentialRampToValueAtTime(0.014, 7.2); g.gain.setValueAtTime(0.014, 9.4); g.gain.exponentialRampToValueAtTime(0.004, 11.0);
      g.gain.setValueAtTime(0.004, 33.6); g.gain.linearRampToValueAtTime(0.0001, 34.8);
      o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(mus); g.connect(rev); o.start(6.0); o2.start(6.0); o.stop(34.9); o2.stop(34.9);
    }
    // harp-like arpeggio over the reveal
    const arp = [293.7, 370, 440, 587.3, 659.3, 880, 740, 587.3, 440, 370];
    arp.forEach((f, k) => S.pluck(6.45 + k * 0.26, f, 0.05, (k % 2 ? 0.3 : -0.3), rev, 2.2, 0.55));
    arp.forEach((f, k) => S.pluck(6.45 + k * 0.26, f, 0.035, (k % 2 ? 0.3 : -0.3), mus, 2.2, 0.55));
    // the street: a light rhythm, 120 bpm, D – A – Bm – G
    const bar = 2.0, t0 = 9.85;
    const chords = [[146.8, 220, 293.7, 370], [110, 220, 277.2, 329.6], [123.5, 246.9, 293.7, 370], [98, 196, 246.9, 293.7]];
    for (let t = t0, i = 0; t < Math.min(CONFIG.duration + 0.5, 32.85); t += 0.25, i++) {
      const c = chords[Math.floor((t - t0) / bar) % 4], beat = i % 8;
      if (t > 20.35 && t < 24.35 && beat % 2 === 1) continue;     // sparser while the top spins
      const pat = [0, 2, 1, 3, 2, 1, 3, 2][beat];
      S.pluck(t, c[pat] * 2, 0.045, (beat % 2 ? 0.25 : -0.2), mus, 0.9, 0.62);
      if (beat === 0 || beat === 4) { S.pluck(t, c[0], 0.07, 0, mus, 1.4, 0.3); S.tone(t, 0.12, 62, 0.025, 0, mus, 'sine', 0.003, 0.1); }
      if (beat % 2 === 1) this._shaker(S, t, 0.5, mus);
    }
    // the kite: a bright open chord swells, a harp sweeps up
    for (const f of [146.8, 220, 293.7, 370, 440, 587.3, 740]) {
      const o = ctx.createOscillator(), g = ctx.createGain(), lp = S.filter('lowpass', 2400, 0.4);
      o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = S.rng.range(-6, 6);
      g.gain.setValueAtTime(0.0001, 32.8); g.gain.exponentialRampToValueAtTime(0.006, 33.4); g.gain.setValueAtTime(0.006, 34.4); g.gain.exponentialRampToValueAtTime(0.002, 35.5);
      g.gain.setValueAtTime(0.002, 66.6); g.gain.linearRampToValueAtTime(0.0001, 67.6);
      o.connect(lp); lp.connect(g); g.connect(mus); g.connect(rev); o.start(32.8); o.stop(Math.min(CONFIG.duration + 1, 67.7));
    }
    [293.7, 370, 440, 587.3, 740, 880, 1174.7].forEach((f, k) => S.pluck(32.86 + k * 0.05, f, 0.05, -0.4 + k * 0.13, rev, 2.4, 0.6));
    S.pluck(32.86, 73.4, 0.12, 0, mus, 2.5, 0.25);
  }
}
