/* =====================================================================
   SOUNDTRACK — "How did kids have fun before screens?" (Phase A, 0–15 s)
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
  constructor(tl, kids) {
    super(tl);
    this.kids = kids;
    this.wavName = SCRIPT.meta.wav;
  }

  // listener-relative gain + pan for a point at time t
  _rel(x, z, t, ref = 4) {
    const lx = this.cx.value(t), lz = this.cz.value(t), yaw = MathX.deg(this.cyaw.value(t));
    const dx = x - lx, dz = z - lz, d = Math.max(0.4, Math.hypot(dx, dz));
    return { gain: ref / (ref + d), pan: MathX.clamp((dx * Math.cos(yaw) - dz * Math.sin(yaw)) / d, -1, 1) * 0.85, d };
  }

  _build(ctx) {
    const S = new SoundKit(ctx, CONFIG.seed), end = CONFIG.duration;
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
    this._music(S, music, musSend);
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
    const ctx = S.ctx, t0 = 6.0, end = CONFIG.duration + 1;
    const air = S.noise('pink', t0, end), ab = S.filter('bandpass', 700, 0.4), ag = ctx.createGain();
    ag.gain.setValueAtTime(0.0001, t0); ag.gain.linearRampToValueAtTime(0.026, 6.9);
    for (let t = 7; t < end; t += 1.3) ag.gain.linearRampToValueAtTime(0.02 + 0.012 * (noise1(t * 0.4, 5) * 0.5 + 0.5), t);
    air.connect(ab); ab.connect(ag); ag.connect(bus);
    // birds: scattered chirps and two-note songs
    for (let t = 6.3; t < end; t += S.rng.range(0.15, 0.6)) {
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
  }

  /* the children: footsteps from their paths, hoops, the ball game, the rope, calls */
  _kidsSound(S, bus, rev) {
    const ctx = S.ctx;
    const dirt = ctx.createGain(); dirt.gain.value = 1; dirt.connect(bus); dirt.connect(rev);
    for (const k of this.kids.people) {
      const runner = (k.states || []).some((s) => /run|carry/i.test(s[1]));
      if (!runner) continue;
      const stride = k.spec.stride || 1.32;
      let prev = null;
      for (let t = 5.8; t < CONFIG.duration; t += 1 / 120) {
        const L = k.locate(t);
        if (!L.moving) { prev = null; continue; }
        const step = Math.floor(L.dist / (stride / 2));
        if (prev !== null && step !== prev) {
          const R = this._rel(L.x, L.z, t, 3);
          S.step(t, 0.11 * R.gain * (k.spec.id === 'runner' ? 1.6 : 1), R.pan, dirt);
        }
        prev = step;
      }
      // hoops: a soft rolling rumble and the stick's taps
      if (k.spec.hoop) {
        const n = S.noise('brown', 6.0, CONFIG.duration), lp = S.filter('lowpass', 320, 0.7), g = ctx.createGain(), p = ctx.createStereoPanner();
        n.connect(lp); lp.connect(g); g.connect(p); p.connect(bus);
        const pts = this._spatial((t) => { const L = k.locate(t); return { x: L.x, z: L.z }; }, 6.0, CONFIG.duration, 1 / 15, 3);
        this._applySpatial(pts, g.gain, p.pan, [], 0.05);
        for (let t = 6.1; t < CONFIG.duration; t += 0.24 + 0.05 * Math.sin(t * 3)) { const L = k.locate(t), R = this._rel(L.x, L.z, t, 3); S.click(t, 0.02 * R.gain, R.pan, bus); }
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
      const tc = t0 + fl, R = at(to, tc), R0 = at(from, t0);
      S.clunk(tc, 0.05 * R.gain, R.pan, bus); S.click(tc, 0.03 * R.gain, R.pan, bus);
      const w = S.noise('pink', t0 - 0.05, t0 + 0.2), wb = S.filter('bandpass', 1200, 1), wg = ctx.createGain();
      S.env(wg, t0 - 0.05, 0.05, 0.01 * R0.gain, 0.15); w.connect(wb); wb.connect(wg); wg.connect(S.panned(bus, R0.pan));
    }
    // the skipping rope slaps the ground under her feet
    const rope = this.kids.byId.rope;
    if (rope) for (let k = 0; ; k++) {
      const t = (k + 0.5) * 0.52 - rope.seed;
      if (t > CONFIG.duration) break;
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
    for (let t = 12.0; t < CONFIG.duration; t += 1 / 120) {
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
      o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(mus); g.connect(rev); o.start(6.0); o2.start(6.0); o.stop(CONFIG.duration + 1); o2.stop(CONFIG.duration + 1);
    }
    // harp-like arpeggio over the reveal
    const arp = [293.7, 370, 440, 587.3, 659.3, 880, 740, 587.3, 440, 370];
    arp.forEach((f, k) => S.pluck(6.45 + k * 0.26, f, 0.05, (k % 2 ? 0.3 : -0.3), rev, 2.2, 0.55));
    arp.forEach((f, k) => S.pluck(6.45 + k * 0.26, f, 0.035, (k % 2 ? 0.3 : -0.3), mus, 2.2, 0.55));
    // the street: a light rhythm, 120 bpm, D – A – Bm – G
    const bar = 2.0, t0 = 9.85;
    const chords = [[146.8, 220, 293.7, 370], [110, 220, 277.2, 329.6], [123.5, 246.9, 293.7, 370], [98, 196, 246.9, 293.7]];
    for (let t = t0, i = 0; t < CONFIG.duration + 0.5; t += 0.25, i++) {
      const c = chords[Math.floor((t - t0) / bar) % 4], beat = i % 8;
      const pat = [0, 2, 1, 3, 2, 1, 3, 2][beat];
      S.pluck(t, c[pat] * 2, 0.045, (beat % 2 ? 0.25 : -0.2), mus, 0.9, 0.62);
      if (beat === 0 || beat === 4) { S.pluck(t, c[0], 0.07, 0, mus, 1.4, 0.3); S.tone(t, 0.12, 62, 0.025, 0, mus, 'sine', 0.003, 0.1); }
      if (beat % 2 === 1) { const n = S.noise('white', t, t + 0.06), hp = S.filter('highpass', 6500, 0.7), g = ctx.createGain(); S.env(g, t, 0.003, 0.008, 0.045); n.connect(hp); hp.connect(g); g.connect(mus); }
    }
  }
}
