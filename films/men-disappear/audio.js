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
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -2.5; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.12; const post = ctx.createGain(); post.gain.value = 0.74; post.connect(ctx.destination); lim.connect(post);   // trim to ≈ −16.7 LUFS, peaks under −1.5 dB
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
    // from the wheelhouse on, every shot is outside the car: the glass opens and the car's own sounds go
    outLP.frequency.setValueAtTime(1400, T.wheel[0] - 0.01); outLP.frequency.linearRampToValueAtTime(9000, T.wheel[0] + 0.02);
    car.gain.setValueAtTime(0.9, T.wheel[0] - 0.03); car.gain.linearRampToValueAtTime(0.0001, T.wheel[0]);
    // each insert (fire station, grid control, supermarket) takes you somewhere else: the harbour drops away
    for (const [a, b] of T.montage) { outside.gain.setValueAtTime(1.0, a - 0.04); outside.gain.linearRampToValueAtTime(0.0001, a); outside.gain.setValueAtTime(0.0001, b - 0.02); outside.gain.linearRampToValueAtTime(1.0, b + 0.02); }

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
    S.chatter(T.brake + 1.8, T.wheel[0], 0.035, 0.0, car, 250, 2.4);
    for (const [t, f, p] of [[T.planeHit + 0.5, 300, 0.3], [T.planeHit + 0.8, 270, -0.2], [T.planeHit + 1.3, 340, 0.1]]) S.voice(t, f, 0.3, 'o', 0.08, p, car, 1.3);   // the car sees the plane go in

    // 3. the vanish itself: no bang, just the air going still — a soft low drop and a held high tone
    S.thump(T.vanish, 0.18, fx);
    S.tone(T.vanish, 3.0, 1560, 0.012, 0, mus, 'sine', 0.02, 2.4);

    // 4. what fell: the cup (and its bounce), the newspaper, the phone (lands, then rings and rings)
    S.click(T.vanish + 0.44, 0.18, 0.35, car); S.clunk(T.vanish + 0.45, 0.12, 0.35, car); S.click(T.vanish + 0.62, 0.08, 0.32, car);
    for (const [t, d] of [[T.vanish + 0.2, 0.3], [T.vanish + 0.9, 0.45]]) {
      const n = S.noise('white', t, t + d + 0.1), bp = S.filter('bandpass', 2600, 0.7), g = ctx.createGain(); S.env(g, t, 0.04, 0.05, d); n.connect(bp); bp.connect(g); g.connect(S.panned(car, -0.3));
    }
    S.click(T.vanish + 0.5, 0.1, -0.4, car);
    for (let t = T.vanish + 1.6; t < T.wheel[0]; t += 2.4) {
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

    // 5b. the first seconds outside: every car with a man at the wheel lets go at once — horns, a crash below, more far off
    S.crunch(MD_CRASH0, 0.75, -0.6, outside, rev); S.farBoom(MD_CRASH0 + 0.05, 0.4, -0.6, outside);
    for (const [t, f, p] of [[T.vanish + 0.9, 400, -0.7], [T.vanish + 1.2, 470, 0.6], [T.vanish + 1.7, 430, -0.3], [T.vanish + 2.4, 390, 0.7]]) S.horn(t, f, f * 0.92, 0.05, p, outside);
    for (const [t, p] of [[T.vanish + 2.1, 0.7], [T.vanish + 3.3, -0.8], [T.vanish + 4.6, 0.5]]) { S.crunch(t, 0.22, p, outside, rev); S.farBoom(t, 0.18, p, outside); }
    for (const [t, f, p] of [[T.vanish + 0.7, 420, -0.4], [T.vanish + 1.5, 380, 0.5], [T.vanish + 2.0, 460, 0.1]]) S.voice(t, f, 0.45, 'a', 0.09, p, car, 1.35);   // screams in the car
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

    // 8. the airliner: its engines at approach power, growing on the right; it goes in; the sound arrives ~1 s later (350 m)
    {
      const a = T.plane[0] - 1.0, b = T.planeHit, n = S.noise('pink', a, b + 0.05), bp = S.filter('bandpass', 700, 0.4), lp = S.filter('lowpass', 2600, 0.5), g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, a); g.gain.linearRampToValueAtTime(0.05, T.plane[0] + 0.5); g.gain.linearRampToValueAtTime(0.22, b - 0.3); g.gain.setValueAtTime(0.22, b + 0.98); g.gain.linearRampToValueAtTime(0.0001, b + 1.02);
      n.connect(bp); bp.connect(lp); lp.connect(g); g.connect(S.panned(outside, 0.5));
      S.tone(a, b - a + 1, 3100, 0.004, 0.5, outside, 'sine', 1.5, 0.05);               // the turbine whine
      const hb = T.planeHit + 1.0;
      S.boom(hb, 1.0, outside, rev); S.crunch(hb + 0.02, 0.7, 0.5, outside, rev); S.farBoom(hb + 0.3, 0.5, 0.4, outside);
      const w = S.noise('white', hb, hb + 4), wl = S.filter('lowpass', 1800, 0.5), wg = ctx.createGain(); S.env(wg, hb + 0.2, 0.3, 0.25, 3.2); w.connect(wl); wl.connect(wg); wg.connect(S.panned(outside, 0.4));
    }
    // 8b. inside the wheelhouse: the engine through the deck, the autopilot's steering pump, a radio nobody answers
    {
      const a = T.wheel[0], b = T.wheel[1], fxw = S.panned(fx, 0);
      const n = S.noise('brown', a, b), lp = S.filter('lowpass', 160, 0.7), g = ctx.createGain(); g.gain.setValueAtTime(0.45, a); g.gain.setValueAtTime(0.45, b - 0.05); g.gain.linearRampToValueAtTime(0.0001, b); n.connect(lp); lp.connect(g); g.connect(fxw);
      for (let t = a + 0.3; t < b; t += 0.9) S.tone(t, 0.35, 230, 0.03, -0.3, fx, 'sawtooth', 0.04, 0.2);   // the steering pump
      const r = S.noise('white', a + 0.6, b - 0.1), rb = S.filter('bandpass', 1800, 1.2), rg = ctx.createGain(); rg.gain.value = 0.025; r.connect(rb); rb.connect(rg); rg.connect(S.panned(fx, 0.4));
      for (const t of [a + 0.8, a + 1.6]) S.tone(t, 0.25, 1240, 0.03, 0.4, fx, 'square', 0.006, 0.05);       // the radio's call tone
      S.thump(a, 0.12, fx);
    }
    // 9. the countdown: a low pulse that tightens as the bow closes
    for (let t = T.wheel[0] + 0.5; t < T.hit - 0.6;) {   // stops half a second early: a breath of near-silence before the hit
      const k = MathX.ramp(t, T.wheel[0], T.hit);
      S.tone(t, 0.3, 55, 0.05 + 0.07 * k, 0, mus, 'sine', 0.01, 0.25);
      t += MathX.lerp(0.9, 0.38, k);
    }
    S.tone(T.wheel[0], T.hit - 0.5 - T.wheel[0], 73.4, 0.03, 0, mus, 'triangle', 2.0, 0.2);

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

    // 11. the cascade. Under it all, a low drone that climbs a step at each jump in time
    {
      const steps = [[T.fires[0], 49], [T.grid[0], 52], [T.water[0], 55], [T.food[0], 58.3]];
      for (const [k, [t0, f]] of steps.entries()) {
        const t1 = k < steps.length - 1 ? steps[k + 1][0] : T.end[0];
        S.tone(t0, t1 - t0 + 0.3, f, 0.05, 0, mus, 'sawtooth', 0.6, 0.4);
        S.tone(t0, t1 - t0 + 0.3, f * 1.5, 0.018, 0, mus, 'triangle', 1.0, 0.4);
      }
      // the jumps: a rising swell into a hit
      for (const [tj] of MD_JUMPS) {
        const n = S.noise('pink', tj - 0.9, tj + 0.1), hp = S.filter('highpass', 600, 0.5), g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, tj - 0.9); g.gain.exponentialRampToValueAtTime(0.12, tj - 0.02); g.gain.linearRampToValueAtTime(0.0001, tj);
        n.connect(hp); hp.connect(g); g.connect(fx); S.thump(tj, 0.5, fx); S.boom(tj, 0.18, fx, rev);
      }
    }
    // +20 MIN: the fires — crackle and roar, glass going, car alarms nobody switches off (no sirens: nobody is coming)
    const crk = S.crackleBuffer(8, 90);
    const fire = (a, b, vol, pan, dest = outside) => {
      const src = ctx.createBufferSource(); src.buffer = crk; src.loop = true; const g = ctx.createGain(), bp = S.filter('bandpass', 2400, 0.6);
      g.gain.setValueAtTime(0.0001, a); g.gain.linearRampToValueAtTime(vol, a + 0.3); g.gain.setValueAtTime(vol, b - 0.2); g.gain.linearRampToValueAtTime(0.0001, b);
      src.connect(bp); bp.connect(g); g.connect(S.panned(dest, pan)); src.start(a); src.stop(b + 0.1);
      const n = S.noise('brown', a, b), lp = S.filter('lowpass', 300, 0.6), ng = ctx.createGain(); S.env(ng, a, 0.4, vol * 1.6, b - a); n.connect(lp); lp.connect(ng); ng.connect(S.panned(dest, pan));
    };
    fire(T.fires[0], T.grid[0], 0.7, -0.3);
    S.crunch(T.fires[0] + 1.6, 0.3, -0.4, outside, rev); S.crunch(T.fires[0] + 4.2, 0.25, -0.5, outside, rev); S.farBoom(T.fires[0] + 5.3, 0.35, -0.6, outside);
    for (const [a, f, p] of [[T.fires[0], 760, -0.5], [T.fires[0] + 0.7, 910, 0.3]]) for (let t = a; t < T.grid[0]; t += 0.5) S.tone(t, 0.25, f, 0.012, p, outside, 'square', 0.01, 0.05);
    // the fire station: the turnout alarm, ringing in an empty bay
    { const [a, b] = T.fireSt;
      for (let t = a + 0.05; t < b - 0.05; t += 0.13) S.tone(t, 0.1, 1050, 0.05, 0, fx, 'square', 0.006, 0.05);
      for (let t = a + 0.4; t < b; t += 0.7) S.tone(t, 0.35, 660, 0.035, 0.1, fx, 'triangle', 0.01, 0.2);
      S.thump(a, 0.12, fx); S.thump(b, 0.12, fx); }
    // +1 HOUR: the chamber: desk phones ringing that nobody answers, a few voices, the hush of a big room
    { const [a, b] = T.gov;
      const n = S.noise('pink', a, b), lp = S.filter('lowpass', 900, 0.5), g = ctx.createGain(); g.gain.value = 0.05; n.connect(lp); lp.connect(g); g.connect(rev); g.connect(fx);
      for (const [t0, f, p] of [[a + 0.2, 880, -0.5], [a + 0.9, 760, 0.4], [a + 1.6, 940, -0.1]]) for (let t = t0; t < b - 0.3; t += 2.0) { S.tone(t, 0.45, f, 0.025, p, fx, 'square', 0.01, 0.05); S.tone(t + 0.55, 0.45, f, 0.025, p, fx, 'square', 0.01, 0.05); }
      S.chatter(a + 0.3, b, 0.03, 0.2, fx, 240, 1.4); S.thump(a, 0.14, fx); S.thump(b, 0.12, fx); }
    // the street tap: the handle squeaking round, a bucket's clank, the line murmuring, a child
    { const [a, b] = T.queue;
      for (let t = a + 0.3; t < b; t += 0.36) S.tone(t, 0.12, 1250 + 80 * Math.sin(t * 3), 0.012, 0, fx, 'triangle', 0.01, 0.06);
      for (const t of [a + 0.8, a + 2.3, a + 3.1]) S.clunk(t, 0.12, 0.3, fx);
      S.chatter(a + 0.1, b, 0.04, -0.2, fx, 245, 2.4); S.chatter(a + 0.5, b, 0.025, 0.3, fx, 300, 1.6);
      S.voice(a + 2.6, 360, 0.3, 'a', 0.05, 0.4, fx, 1.2);
      const w = S.noise('pink', a, b), wl = S.filter('lowpass', 500, 0.4), wg = ctx.createGain(); wg.gain.value = 0.05; w.connect(wl); wl.connect(wg); wg.connect(fx);
      S.thump(a, 0.12, fx); }
    // +6 HOURS: the city's hum at dusk; in grid control the alarms and the frequency falling; then everything drops
    {
      const a = T.grid[0], bo = T.blackout, o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sawtooth'; o2.type = 'sine'; o.frequency.setValueAtTime(100, a); o2.frequency.setValueAtTime(50, a);
      o.frequency.setValueAtTime(100, T.gridRoom[0]); o.frequency.linearRampToValueAtTime(94, bo - 0.1); o.frequency.exponentialRampToValueAtTime(30, bo + 0.5);
      o2.frequency.setValueAtTime(50, T.gridRoom[0]); o2.frequency.linearRampToValueAtTime(47, bo - 0.1); o2.frequency.exponentialRampToValueAtTime(15, bo + 0.5);
      const lp = S.filter('lowpass', 900, 0.6); g.gain.setValueAtTime(0.0001, a); g.gain.linearRampToValueAtTime(0.06, a + 1.2); g.gain.linearRampToValueAtTime(0.1, bo - 0.1); g.gain.linearRampToValueAtTime(0.0001, bo + 0.55);
      o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(mix); o.start(a); o2.start(a); o.stop(bo + 0.7); o2.stop(bo + 0.7);
      fire(a, T.water[0], 0.25, -0.6);
      const [ra, rb] = T.gridRoom;
      for (let t = ra + 0.05; t < rb; t += 0.32) S.tone(t, 0.16, 1320, 0.04, 0.2, fx, 'square', 0.006, 0.04);
      for (let t = ra + 0.2; t < rb; t += 0.9) S.tone(t, 0.5, 520, 0.03, -0.2, fx, 'triangle', 0.02, 0.2);
      S.thump(ra, 0.12, fx); S.thump(rb, 0.12, fx);
      // the blackout: a heavy contactor clunk, the hum gone, the city's sound sucked out; a beat of silence
      S.clunk(bo, 0.7, 0, fx); S.boom(bo, 0.45, fx, rev); S.thump(bo + 0.02, 0.6, fx);
      mix.gain.setValueAtTime(2.2, bo + 0.3); mix.gain.linearRampToValueAtTime(1.0, bo + 0.6); mix.gain.setValueAtTime(1.0, bo + 1.6); mix.gain.linearRampToValueAtTime(2.2, bo + 3.0);
      for (const [t, p] of [[bo + 1.8, -0.4], [bo + 2.5, 0.5]]) S.tone(t, 2.5, p < 0 ? 640 : 590, 0.01, p, outside, 'square', 0.2, 0.6);   // battery alarms start up in the dark
    }
    // +2 DAYS: a tap that coughs air and stops; the outfall pouring into the basin; gulls
    {
      const a = T.water[0];
      for (let k = 0; k < 6; k++) { const t = a + 0.3 + k * 0.22 + 0.06 * Math.sin(k * 3); const n = S.noise('white', t, t + 0.12), bp = S.filter('bandpass', 1500 + 300 * k, 1.5), g = ctx.createGain(); S.env(g, t, 0.005, 0.05 * (1 - k / 7), 0.08); n.connect(bp); bp.connect(g); g.connect(fx); }
      const n = S.noise('brown', a + 1.2, T.food[0]), bp = S.filter('lowpass', 700, 0.5), g = ctx.createGain(); S.env(g, a + 1.2, 0.8, 0.35, T.food[0] - a - 1.2); g.gain.setValueAtTime(0.3, T.food[0] - 0.05); g.gain.linearRampToValueAtTime(0.0001, T.food[0]); n.connect(bp); bp.connect(g); g.connect(S.panned(outside, -0.3));
      const w = S.noise('pink', a + 1.2, T.food[0]), wb = S.filter('bandpass', 1900, 0.8), wg = ctx.createGain(); wg.gain.value = 0.05; w.connect(wb); wb.connect(wg); wg.connect(S.panned(outside, -0.3));
      for (const t of [a + 2.4, a + 2.6, a + 4.1]) S.chirp(t, 1700, 0.02, 0.4, outside, false);
    }
    // +2 WEEKS: the supermarket: a dying emergency light's buzz, a trolley's rattle, a few voices
    { const [a, b] = T.food; S.chatter(a + 0.2, b, 0.03, 0.1, fx, 250, 1.6); for (let t = a + 0.4; t < b; t += 0.21) S.click(t, 0.025, 0.2, fx); }
    {
      const [a, b] = T.food;
      const o = ctx.createOscillator(), g = ctx.createGain(), bp = S.filter('bandpass', 400, 2); o.type = 'sawtooth'; o.frequency.value = 100;
      g.gain.setValueAtTime(0.0001, a); for (let t = a; t < b; t += 0.08) g.gain.setValueAtTime(hash1(t * 13.1) > 0.25 ? 0.05 : 0.0001, t);
      g.gain.setValueAtTime(0.0001, b); o.connect(bp); bp.connect(g); g.connect(fx); o.start(a); o.stop(b + 0.05);
      S.thump(a, 0.12, fx); S.thump(b, 0.12, fx);
    }
    // the power station across the water: its diesel generators chug, falter and stop (the fuel is gone) — then the blast
    {
      const a = T.nuke[0], stopT = T.nukeBang - 1.1, o = ctx.createOscillator(), g = ctx.createGain(), lp = S.filter('lowpass', 220, 0.8), am = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(45, a); o.frequency.setValueAtTime(45, stopT - 0.8); o.frequency.linearRampToValueAtTime(28, stopT);
      g.gain.setValueAtTime(0.0001, a); g.gain.linearRampToValueAtTime(0.18, a + 0.4);
      for (let t = stopT - 0.8; t < stopT; t += 0.11) g.gain.setValueAtTime(hash1(t * 7.7) > 0.4 ? 0.18 : 0.02, t);
      g.gain.setValueAtTime(0.0001, stopT);
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 7; lg.gain.value = 0.4; lfo.connect(lg); lg.connect(am.gain); am.gain.value = 0.6;
      o.connect(lp); lp.connect(am); am.connect(g); g.connect(S.panned(outside, 0.2)); for (const x of [o, lfo]) { x.start(a); x.stop(stopT + 0.1); }
      const wind = S.noise('pink', a, T.fin + 1), wl = S.filter('lowpass', 600, 0.4), wg = ctx.createGain(); wg.gain.value = 0.06; wind.connect(wl); wl.connect(wg); wg.connect(outside);
      mix.gain.setValueAtTime(2.2, T.nukeBang - 0.8); mix.gain.linearRampToValueAtTime(1.0, T.nukeBang - 0.3); mix.gain.setValueAtTime(1.0, T.nukeBang - 0.02); mix.gain.linearRampToValueAtTime(2.2, T.nukeBang);
      const hb = T.nukeBang + 0.25;
      S.boom(hb, 1.0, outside, rev); S.boom(hb + 0.35, 0.7, outside, rev); S.farBoom(hb + 0.1, 0.8, 0.1, outside); S.thump(hb, 0.8, fx);
      const r = S.noise('brown', hb, hb + 7), rl = S.filter('lowpass', 260, 0.6), rg = ctx.createGain(); S.env(rg, hb, 0.3, 0.6, 5.5); r.connect(rl); rl.connect(rg); rg.connect(outside);
    }
    // the close: the dark city, fires far off, a battery alarm somewhere; the chord under the line
    fire(T.end[0], T.fin + 0.8, 0.18, -0.4);
    S.tone(T.end[0] + 0.5, T.fin - T.end[0], 640, 0.005, 0.5, outside, 'square', 0.5, 1.0);
    for (const f of [98, 116.5, 146.8, 196]) S.tone(T.line[0] - 0.3, 8.5, f, 0.032, 0, mus, 'sine', 1.4, 3.0);
    S.tone(T.births[0], 5, 392, 0.01, 0, mus, 'sine', 1.5, 2.5);
  }
}
