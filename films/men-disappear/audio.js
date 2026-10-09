/* =====================================================================
   AUDIO — the episode's soundtrack, synthesised and rendered offline (js/audio/audioEngine.js).
   Every cue is scheduled at ABSOLUTE STORY TIMES in _build(ctx). Bake it when the film is final:
     NODE_PATH=$(npm root -g) node tools/bake-soundtrack.cjs --page men-disappear.html --out films/men-disappear/soundtrack.js
   Layers: the train (rumble and rail joints that follow its real speed) → the car (chatter that loses every man's
   voice at once) → what fell (cup, paper, a phone that rings) → the dead man's buzzer and the brake → outside, heard
   through the glass (the road, the ship's engine) → the montage → the impact, the span, the water → quiet → the chord.
   ===================================================================== */

class MdAudio extends AudioEngine {
  constructor(tl, app) { super(tl); this.app = app; this.wavName = SCRIPT.meta.wav; }
  // anything the sound depends on that is not inside SCRIPT (so a stale baked copy is detected)
  fingerprintData() { return [MD, MD_G, MD_SHIP.hit, MD_TRAIN.total]; }

  _build(ctx) {
    const S = new SoundKit(ctx, CONFIG.seed), T = MD, END = CONFIG.duration + 1.0;
    // offline-safe envelopes (Chrome's offline renderer clicks on very short exponential ramps)
    S.env = (g, t, a, peak, d) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(Math.max(0.0002, peak), t + Math.max(a, 0.006)); g.gain.setTargetAtTime(0, t + Math.max(a, 0.006), Math.max(0.004, d / 4)); };
    const tone = S.tone.bind(S);
    S.tone = (t, dur, f, vol, pan, dest, type = 'sine', attack = 0.01, release = null) => tone(t, dur, f, vol, pan, dest, type, Math.max(attack, 0.006), release);

    // mix chain: buses → compressor → out → limiter
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -2.5; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.12; const post = ctx.createGain(); post.gain.value = 0.8; post.connect(ctx.destination); lim.connect(post);   // trim to ≈ −16.7 LUFS, peaks under −1.5 dB
    const out = ctx.createGain(); out.gain.value = 1.0; out.connect(lim);
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 8; comp.ratio.value = 4; comp.connect(out);
    const mix = ctx.createGain(); mix.gain.value = 2.2; mix.connect(comp);
    // a held breath: the whole mix sinks for the last moment before the hit, then the impact lands at full level
    mix.gain.setValueAtTime(2.2, T.hit - 0.9); mix.gain.linearRampToValueAtTime(0.9, T.hit - 0.3); mix.gain.setValueAtTime(0.9, T.hit - 0.02); mix.gain.linearRampToValueAtTime(2.2, T.hit);
    const rev = S.reverb(2.6), revG = ctx.createGain(); revG.gain.value = 0.25; rev.connect(revG); revG.connect(mix);
    const bus = (g, dest = mix) => { const b = ctx.createGain(); b.gain.value = g; b.connect(dest); return b; };
    const car = bus(0.9), mus = bus(0.42), fx = bus(1.0);
    // outside, heard through the glass while you are in the car (opens up for the outside angles and the montage gap)
    const outLP = S.filter('lowpass', 1400, 0.6); outLP.connect(mix);
    const outside = bus(1.0, outLP);
    for (const [a, b] of T.drones) {
      outLP.frequency.setValueAtTime(1400, a - 0.01); outLP.frequency.linearRampToValueAtTime(9000, a + 0.02);
      outLP.frequency.setValueAtTime(9000, b - 0.01); outLP.frequency.linearRampToValueAtTime(1400, b + 0.02);
    }
    // the montage takes you somewhere else: the train and the harbour drop away for those seconds
    const world = [car, outside];
    for (const g of world) { g.gain.setValueAtTime(g.gain.value, T.montage[0] - 0.04); g.gain.linearRampToValueAtTime(0.0001, T.montage[0]); g.gain.setValueAtTime(0.0001, T.montage[1] - 0.02); g.gain.linearRampToValueAtTime(g === car ? 0.9 : 1.0, T.montage[1] + 0.02); }

    // 1. the train: a rumble that follows its speed; the rail joints every 18 m (two bogies, two axles each)
    {
      const n = S.noise('brown', 0, END), lp = S.filter('lowpass', 260, 0.8), g = ctx.createGain(); g.gain.value = 0;
      n.connect(lp); lp.connect(g); g.connect(car);
      const n2 = S.noise('pink', 0, END), bp = S.filter('bandpass', 900, 0.5), g2 = ctx.createGain(); g2.gain.value = 0;
      n2.connect(bp); bp.connect(g2); g2.connect(car);
      for (let t = 0; t < END; t += 0.1) { const k = MD_TRAIN.v(t) / 16; g.gain.linearRampToValueAtTime(0.06 + 0.4 * k, t); g2.gain.linearRampToValueAtTime(0.004 + 0.05 * k * k, t); lp.frequency.linearRampToValueAtTime(140 + 160 * k, t); }
      // the joints: when the wheels pass each rail joint (the train runs MD_TRAIN.s metres)
      const axles = [1.6, 4.0, 15.9, 18.3, 22.2, 24.6];             // axle positions behind the nose (m)
      let last = 0;
      for (let t = 0; t < T.stop + 0.1; t += 1 / 240) {
        const s = MD_TRAIN.s(t), v = MD_TRAIN.v(t);
        if (v < 0.4) continue;
        for (const a of axles) {
          const j = Math.floor((s - a + 1000) / 18), jp = Math.floor((last - a + 1000) / 18);
          if (j !== jp) S.clunk(t, 0.05 + 0.13 * Math.min(1, v / 16) * (a < 10 ? 1 : 0.5), 0, car);
        }
        last = s;
      }
      // the HVAC hum of the car (stays on)
      const h = S.noise('pink', 0, END), hl = S.filter('lowpass', 500, 0.5), hg = ctx.createGain(); hg.gain.value = 0.045; h.connect(hl); hl.connect(hg); hg.connect(car);
      S.tone(0, END, 100, 0.006, 0, car, 'sine', 0.5, 0.5);
    }

    // 2. the passengers: men's and women's voices; every man's stops at the same instant
    S.chatter(0, T.vanish, 0.055, 0.3, car, 125, 3.2);
    S.chatter(0.3, T.vanish, 0.04, -0.35, car, 112, 2.6);
    S.chatter(0, T.vanish, 0.04, -0.2, car, 230, 2.0);
    // …a beat of nothing, then the women: short sharp questions, a child's voice
    for (const [t, f, v, p] of [[T.vanish + 0.35, 260, 0.08, 0.3], [T.vanish + 0.55, 240, 0.07, -0.4], [T.vanish + 0.9, 330, 0.06, 0.2], [T.vanish + 1.3, 250, 0.08, -0.3]]) {
      S.voice(t, f, 0.24, 'a', v, p, car, 1.25); S.voice(t + 0.28, f * 1.1, 0.18, 'o', v * 0.8, p, car, 1.1);
    }
    S.voice(T.vanish + 1.1, 380, 0.35, 'a', 0.07, 0.4, car, 1.3);                       // the boy
    S.chatter(T.brake + 1.8, T.montage[0], 0.035, 0.0, car, 250, 2.4);
    S.chatter(T.back, T.hit - 2, 0.03, 0.1, car, 255, 2.0);

    // 3. the vanish itself: no bang, just the air going still — a soft low drop and a held high tone
    S.thump(T.vanish, 0.18, fx);
    S.tone(T.vanish, 3.0, 1560, 0.012, 0, mus, 'sine', 0.02, 2.4);

    // 4. what fell: the cup (and its bounce), the newspaper, the phone (lands, then rings and rings)
    S.click(T.vanish + 0.44, 0.18, 0.35, car); S.clunk(T.vanish + 0.45, 0.12, 0.35, car); S.click(T.vanish + 0.62, 0.08, 0.32, car);
    for (const [t, d] of [[T.vanish + 0.2, 0.3], [T.vanish + 0.9, 0.45]]) {
      const n = S.noise('white', t, t + d + 0.1), bp = S.filter('bandpass', 2600, 0.7), g = ctx.createGain(); S.env(g, t, 0.04, 0.05, d); n.connect(bp); bp.connect(g); g.connect(S.panned(car, -0.3));
    }
    S.click(T.vanish + 0.5, 0.1, -0.4, car);
    for (let t = T.vanish + 1.6; t < T.cab; t += 2.4) {
      const near = t < T.road[0] ? 1 : 0.55;
      for (let k = 0; k < 8; k++) S.tone(t + k * 0.075, 0.06, k % 2 ? 1320 : 1760, 0.016 * near, -0.25, car, 'square', 0.006, 0.03);
    }

    // 5. the dead man's switch: a warning buzzer once the handle is released, then the brake (air, then the squeal)
    for (let t = T.vanish + 0.4; t < T.brake; t += 0.5) S.tone(t, 0.3, 780, 0.025, 0, car, 'square', 0.006, 0.05);
    S.hiss(T.brake, 1.4, 0.16, 0, car);
    S.thump(T.brake + 0.1, 0.4, fx);
    {
      const o = ctx.createOscillator(), o2 = ctx.createOscillator(), bp = S.filter('bandpass', 2200, 6), g = ctx.createGain();
      o.type = 'sawtooth'; o2.type = 'sawtooth'; o.frequency.value = 2150; o2.frequency.value = 2213;
      g.gain.value = 0; o.connect(bp); o2.connect(bp); bp.connect(g); g.connect(car);
      for (let t = T.brake; t < T.stop + 0.3; t += 0.05) {
        const v = MD_TRAIN.v(t), k = MathX.smooth(t, T.brake + 0.3, T.brake + 1.2) * Math.min(1, v / 3);
        g.gain.linearRampToValueAtTime(0.045 * k * (0.8 + 0.2 * Math.sin(t * 23)), t);
        o.frequency.linearRampToValueAtTime(1900 + 18 * v + 40 * Math.sin(t * 7), t);
      }
      g.gain.linearRampToValueAtTime(0, T.stop + 0.4);
      o.start(T.brake); o2.start(T.brake); o.stop(T.stop + 0.6); o2.stop(T.stop + 0.6);
    }
    S.clunk(T.stop, 0.3, 0, car); S.clunk(T.stop + 0.18, 0.15, 0, car);

    // 6. the road below (through the glass): a horn from a woman who braked, the SUV into the van
    S.horn(T.vanish + 3.4, 420, 380, 0.05, -0.6, outside);
    S.horn(T.road[0] + 1.6, 440, 400, 0.04, -0.6, outside);
    S.crunch(T.cruise, 0.6, -0.6, outside, rev);
    S.farBoom(T.cruise, 0.25, -0.6, outside);
    S.tone(T.cruise + 0.7, 9, 820, 0.008, -0.6, outside, 'square', 0.1, 1.0);       // the van's alarm, far away

    // 7. the ship: a slow diesel beat that grows as it comes
    {
      const o = ctx.createOscillator(), o2 = ctx.createOscillator(), lp = S.filter('lowpass', 180, 0.7), am = ctx.createGain(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = 38; o2.type = 'sine'; o2.frequency.value = 76;
      o.connect(lp); o2.connect(lp); lp.connect(am); am.connect(g); g.connect(outside);
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 1.6; lg.gain.value = 0.45; lfo.connect(lg); lg.connect(am.gain); am.gain.value = 0.55;
      g.gain.value = 0;
      for (let t = T.harbour - 1; t < END; t += 0.2) {
        const gap = mdShipGap(t), k = t < T.hit ? MathX.clamp(1 - gap / 180, 0, 1) : Math.exp(-(t - T.hit) / 4);
        const duck = t < T.hit ? 1 - 0.6 * MathX.smooth(t, T.hit - 0.9, T.hit - 0.3) : 1;   // a held breath before the hit
        g.gain.linearRampToValueAtTime((0.02 + 0.14 * k * k) * duck, t);
      }
      for (const x of [o, o2, lfo]) { x.start(T.harbour - 1); x.stop(END); }
    }
    // the harbour's air and water through the glass, a gull or two
    { const n = S.noise('pink', 0, END), lp = S.filter('lowpass', 900, 0.4), g = ctx.createGain(); g.gain.value = 0.03; n.connect(lp); lp.connect(g); g.connect(outside); }
    for (const t of [18.2, 19.0, 39.5, 61.0]) S.chirp(t, 1700, 0.02, 0.5, outside, false);

    // 8. the montage
    // cockpit: the engines' steady roar, an autopilot chime
    { const a = T.cockpit, b = T.fire, n = S.noise('brown', a, b), lp = S.filter('lowpass', 420, 0.5), g = ctx.createGain(); S.env(g, a, 0.03, 0.35, b - a); g.gain.setValueAtTime(0.35, b - 0.08); g.gain.linearRampToValueAtTime(0, b); n.connect(lp); lp.connect(g); g.connect(fx);
      S.tone(a + 0.6, 0.6, 880, 0.04, 0.2, fx, 'sine', 0.01, 0.5); S.tone(a + 0.75, 0.7, 1175, 0.035, 0.2, fx, 'sine', 0.01, 0.6); }
    // fire station: the turnout alarm, ringing in an empty bay
    { const a = T.fire, b = T.ward;
      for (let t = a + 0.05; t < b - 0.05; t += 0.13) S.tone(t, 0.1, 1050, 0.05, 0, fx, 'square', 0.006, 0.05);
      for (let t = a + 0.6; t < b; t += 1.0) S.tone(t, 0.35, 660, 0.03, 0.1, fx, 'triangle', 0.01, 0.2);
      const n = S.noise('pink', a, b), lp = S.filter('lowpass', 1500, 0.5), g = ctx.createGain(); g.gain.value = 0.05; n.connect(lp); lp.connect(g); g.connect(fx); }
    // ward: monitors beeping steadily, the soft hush of the room
    { const a = T.ward, b = T.montage[1];
      for (let t = a + 0.2; t < b; t += 0.85) S.tone(t, 0.08, 980, 0.04, -0.2, fx, 'sine', 0.006, 0.05);
      for (let t = a + 0.55; t < b; t += 1.05) S.tone(t, 0.08, 870, 0.025, 0.3, fx, 'sine', 0.006, 0.05);
      const n = S.noise('pink', a, b), lp = S.filter('lowpass', 700, 0.5), g = ctx.createGain(); g.gain.value = 0.04; n.connect(lp); lp.connect(g); g.connect(fx); }
    // a soft tick on each cut
    for (const t of [T.cockpit, T.fire, T.ward, T.back]) S.thump(t, 0.12, fx);

    // 9. the countdown: a low pulse that tightens as the bow closes
    for (let t = T.back + 1; t < T.hit - 0.6;) {   // stops half a second early: a breath of near-silence before the hit
      const k = MathX.ramp(t, T.back, T.hit);
      S.tone(t, 0.3, 55, 0.05 + 0.07 * k, 0, mus, 'sine', 0.01, 0.25);
      t += MathX.lerp(1.1, 0.42, k);
    }
    S.tone(T.cab, T.hit - 0.5 - T.cab, 73.4, 0.03, 0, mus, 'triangle', 3.0, 0.2);
    S.tone(T.turn, T.hit - 0.5 - T.turn, 110, 0.02, 0, mus, 'sawtooth', 4.0, 0.2);

    // 10. the impact: steel into concrete; the span falls onto the bow; the near end into the water
    S.boom(T.hit, 0.9, outside, rev);
    S.crunch(T.hit + 0.02, 0.9, 0.2, outside, rev);
    S.crunch(T.hit + 0.2, 0.6, -0.1, outside, rev);
    S.thump(T.hit + 0.05, 0.6, fx);
    { const n = S.noise('brown', T.hit, T.hit + 9), lp = S.filter('lowpass', 220, 0.6), g = ctx.createGain(); S.env(g, T.hit + 0.1, 0.4, 0.55, 7); n.connect(lp); lp.connect(g); g.connect(outside); }
    // steel shrieking as the bow drives on
    { const o = ctx.createOscillator(), bp = S.filter('bandpass', 1400, 8), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(1200, T.hit + 0.3); o.frequency.linearRampToValueAtTime(820, T.hit + 3.2);
      S.env(g, T.hit + 0.3, 0.2, 0.05, 2.6); o.connect(bp); bp.connect(g); g.connect(outside); o.start(T.hit + 0.3); o.stop(T.hit + 4); }
    S.boom(MD_FALL.tLand, 1.0, outside, rev);
    S.crunch(MD_FALL.tLand + 0.03, 0.8, 0.0, outside, rev);
    S.thump(MD_FALL.tLand + 0.05, 0.8, fx);
    if (MD_FALL_B.tWater) {
      const tw = MD_FALL_B.tWater;
      S.boom(tw, 0.9, outside, rev);
      const n = S.noise('white', tw, tw + 5), bp = S.filter('lowpass', 2400, 0.5), g = ctx.createGain(); S.env(g, tw, 0.05, 0.5, 3.8); n.connect(bp); bp.connect(g); g.connect(outside);
      S.thump(tw + 0.05, 0.6, fx);
    }
    // the train shakes on its rails at each hit
    S.clunk(T.hit + 0.08, 0.3, 0, car); S.clunk(MD_FALL.tLand + 0.1, 0.4, 0, car);

    // 11. after: the quiet — water, a far alarm on the ship, the car's hum; then the chord under the line
    S.tone(T.after, END - T.after, 640, 0.006, 0.5, outside, 'square', 0.5, 1.0);
    for (const f of [98, 146.8, 196, 246.9]) S.tone(T.line[0] - 0.3, 6.5, f, 0.032, 0, mus, 'sine', 1.4, 3.0);
    S.tone(T.line[0] + 1.2, 5, 392, 0.01, 0, mus, 'sine', 1.5, 2.5);
  }
}
