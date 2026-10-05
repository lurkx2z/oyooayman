/* =====================================================================
   SOUNDTRACK — "What weed-induced depersonalization can feel like"
   Two buses: the WORLD (room tone, the speaker's lo-fi music, the TV, the
   friends' voices, the city) and YOU (breathing, ringing, heartbeat, your
   own movements). When the feeling starts, the world bus is pushed away —
   muffled, quieter, roomier — while your own body stays close. That is the
   film's sound idea: the inside gets louder than the outside.
   Voices are a formant-synth placeholder (see PLAN.md for recorded lines).
   ===================================================================== */

class DPAudio extends AudioEngine {
  constructor(tl, kids, app) {
    super(tl);
    this.kids = kids;
    this.app = app;
    this.wavName = SCRIPT.meta.wav;
  }

  fingerprintData() { return [APT, POS, DP_SLOW]; }

  _build(ctx) {
    const S = new SoundKit(ctx, CONFIG.seed), end = CONFIG.duration;
    // offline-render safe envelopes (no sub-block exponential ramps)
    S.env = (g, t, a, peak, d) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(Math.max(0.0002, peak), t + Math.max(a, 0.006)); g.gain.setTargetAtTime(0, t + Math.max(a, 0.006), Math.max(0.004, d / 4)); };
    const tone = S.tone.bind(S);
    S.tone = (t, dur, f, vol, pan, dest, type = 'sine', attack = 0.01, release = null) => tone(t, dur, f, vol, pan, dest, type, Math.max(attack, 0.006), release);
    S.breath = (t, dur, inhale, vol, dest) => {
      const n = S.noise('pink', t, t + dur + 0.1), bp = S.filter('bandpass', inhale ? 1200 : 700, 0.9), g = ctx.createGain();
      if (inhale) { bp.frequency.setValueAtTime(850, t); bp.frequency.linearRampToValueAtTime(1500, t + dur); }
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + dur * (inhale ? 0.6 : 0.3)); g.gain.linearRampToValueAtTime(0, t + dur);
      n.connect(bp); bp.connect(g); g.connect(dest);
    };
    // mix → make-up gain → glue compressor → limiter
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.005; comp.release.value = 0.25;
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -2.5; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.12;
    const mixIn = ctx.createGain(); mixIn.gain.value = 5.6; mixIn.connect(comp);
    const out = ctx.createGain(); comp.connect(out); out.connect(lim); lim.connect(ctx.destination);
    out.gain.setValueAtTime(0.0001, 0); out.gain.linearRampToValueAtTime(0.9, 0.2);
    out.gain.setValueAtTime(0.9, end - 0.3); out.gain.linearRampToValueAtTime(0.0001, end + 0.3);
    // the WORLD bus: a low-pass, a level and a room send that push it away when the feeling starts
    const world = ctx.createGain(), wlp = S.filter('lowpass', 16000, 0.5), wg = ctx.createGain();
    world.connect(wlp); wlp.connect(wg); wg.connect(mixIn);
    const wRev = S.reverb(1.6), wSend = ctx.createGain(); wSend.gain.value = 0.08; wlp.connect(wSend); wSend.connect(wRev); wRev.connect(mixIn);
    const room = S.reverb(0.45), roomSend = ctx.createGain(); roomSend.gain.value = 0.18; roomSend.connect(room); room.connect(world);
    for (const [t, f, g, r] of this._distance()) {
      wlp.frequency.linearRampToValueAtTime(f, t); wg.gain.linearRampToValueAtTime(g, t); wSend.gain.linearRampToValueAtTime(r, t);
    }
    // the YOU bus: close and dry
    const you = ctx.createGain(); you.gain.value = 1; you.connect(mixIn);
    this.S = S;
    this._room(S, world);
    this._music(S, world);
    this._voices(S, world, roomSend);
    this._body(S, you, world);
    this._bathroom(S, world);
    // the near-silence before the comedown: everything — even your own body — drops away for a breath
    you.gain.setValueAtTime(1, 56.62); you.gain.linearRampToValueAtTime(0.12, 56.75); you.gain.setValueAtTime(0.12, 57.25); you.gain.linearRampToValueAtTime(1, 57.45);
  }

  // how far away the world sounds over time: [t, low-pass Hz, level, room send]
  _distance() {
    return [[0, 16000, 1, 0.08], [1.1, 16000, 1, 0.08], [1.25, 6000, 0.82, 0.22], [2.25, 6500, 0.85, 0.2], [2.45, 16000, 1, 0.08],
      [3.0, 16000, 1, 0.08], [3.45, 1500, 0.55, 0.42], [5.0, 1900, 0.6, 0.38], [8.1, 1300, 0.5, 0.45], [9.7, 1100, 0.48, 0.48], [11.6, 2600, 0.6, 0.35],
      [18.6, 2300, 0.55, 0.42], [19.3, 480, 0.16, 0.6], [22.8, 480, 0.16, 0.6], [23.4, 1400, 0.48, 0.55], [29.0, 1200, 0.42, 0.55],
      [31.0, 1500, 0.5, 0.5], [35.1, 2400, 0.66, 0.42], [37.2, 1300, 0.45, 0.5], [42.0, 900, 0.34, 0.55], [46.6, 600, 0.24, 0.6],
      [56.6, 400, 0.05, 0.6], [57.3, 400, 0.05, 0.6], [57.6, 900, 0.4, 0.5], [60.0, 2600, 0.66, 0.35], [64.0, 9000, 0.9, 0.15], [71.2, 12000, 0.95, 0.1]];
  }

  /* the flat at night: low room tone, a fridge somewhere, the city through the window */
  _room(S, bus) {
    const ctx = S.ctx, end = CONFIG.duration + 0.5;
    const n = S.noise('pink', 0, end), lp = S.filter('lowpass', 280, 0.5), g = ctx.createGain(); g.gain.value = 0.03; n.connect(lp); lp.connect(g); g.connect(bus);
    S.tone(0, end, 58, 0.0025, -0.3, bus, 'sine', 0.3, 0.2);
    const c = S.noise('brown', 0, end), cl = S.filter('lowpass', 420, 0.6), cg = ctx.createGain(); cg.gain.value = 0.02; c.connect(cl); cl.connect(cg); cg.connect(S.panned(bus, 0.6));
    for (let t = 1.2; t < end; t += S.rng.range(3, 6)) { const d = S.rng.range(1.5, 3), w = S.noise('pink', t, t + d), wb = S.filter('bandpass', 500, 0.7), wgn = ctx.createGain(); S.env(wgn, t, d * 0.5, 0.006, d * 0.5); w.connect(wb); wb.connect(wgn); wgn.connect(S.panned(bus, 0.7)); }   // a car passing outside
  }

  /* lo-fi from the little speaker on the media unit: soft kick, brushed snare, hats, warm keys, round bass */
  _music(S, bus) {
    const ctx = S.ctx, end = CONFIG.duration + 0.5, spk = ctx.createGain(), sl = S.filter('lowpass', 3800, 0.6), sh = S.filter('highpass', 90, 0.6);
    spk.gain.value = 1.15; spk.connect(sh); sh.connect(sl); sl.connect(S.panned(bus, 0.12));
    const chords = [[146.8, 174.6, 220, 261.6], [130.8, 164.8, 196, 246.9], [110, 130.8, 164.8, 196], [116.5, 146.8, 174.6, 220]];
    const slow = (t) => (t >= 23 && t < 35 ? 1 : 0);      // like a tape running slow while the room feels unreal
    let beat = 60 / 78;
    for (let b = 0, t = 0.05; t < end; b++, t += beat) {
      beat = slow(t) ? 60 / 56 : 60 / 78;
      const pf = slow(t) ? 0.88 : 1;
      const bar = Math.floor(b / 4) % 4, inBar = b % 4;
      if (inBar === 0) { S.tone(t, 0.25, 55 * pf, 0.07, 0, spk, 'sine', 0.006, 0.2); }
      if (inBar === 2) S.tone(t + beat * 0.5, 0.2, 55 * pf, 0.04, 0, spk, 'sine', 0.006, 0.15);
      if (inBar === 1 || inBar === 3) { const n = S.noise('white', t, t + 0.18), bp = S.filter('bandpass', 1800, 0.8), g = ctx.createGain(); S.env(g, t, 0.006, 0.03, 0.14); n.connect(bp); bp.connect(g); g.connect(spk); }
      for (const off of [0, 0.5]) { const n = S.noise('white', t + off * beat, t + off * beat + 0.04), hp = S.filter('highpass', 7000, 0.7), g = ctx.createGain(); S.env(g, t + off * beat, 0.006, 0.008, 0.03); n.connect(hp); hp.connect(g); g.connect(spk); }
      if (inBar === 0) {
        for (const f of chords[bar]) { const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), trem = ctx.createOscillator(), tg = ctx.createGain();
          o.type = 'triangle'; o.frequency.value = f * 2 * pf; o2.type = 'sine'; o2.frequency.value = f * 4.002 * pf;
          trem.frequency.value = 4.5; tg.gain.value = 0.002; trem.connect(tg); tg.connect(g.gain);
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.006, t + 0.02); g.gain.setTargetAtTime(0.0, t + 0.1, beat * 1.4);
          o.connect(g); o2.connect(g); g.connect(spk); o.start(t); o2.start(t); trem.start(t); o.stop(t + beat * 4); o2.stop(t + beat * 4); trem.stop(t + beat * 4); }
        S.tone(t, beat * 1.8, chords[bar][0] / 2 * pf, 0.03, 0, spk, 'sine', 0.01, 0.4);
      }
    }
  }

  /* the friends: Jay mid-story (a low voice), both laughing, Jay turning to you; Mia's laugh trails late at 2.2 s */
  _voices(S, bus, room) {
    const jayPan = -0.55, miaPan = 0.45;
    const talk = (t0, t1, f0, vol, pan) => {
      let t = t0;
      while (t < t1) {
        const n = S.rng.int(3, 7), top = f0 * S.rng.range(1.0, 1.15);
        for (let k = 0; k < n && t < t1; k++) {
          const d = S.rng.range(0.09, 0.2);
          S.voice(t, top * (1 - 0.15 * k / n) * S.rng.range(0.95, 1.06), d, S.rng.pick(['a', 'e', 'o', 'u', 'a', 'i']), vol * S.rng.range(0.7, 1), pan, bus, S.rng.range(0.9, 1.08));
          t += d + S.rng.range(0.02, 0.06);
        }
        t += S.rng.range(0.18, 0.45);
      }
    };
    talk(0.1, 0.72, 128, 0.032, jayPan);
    S.laugh(0.78, 0.036, jayPan, bus, 210, 6); S.laugh(0.85, 0.02, jayPan, room, 210, 5);
    // Mia's laugh: it starts a beat late, hangs on one note while she freezes, then rushes to catch up
    S.laugh(1.25, 0.03, miaPan, bus, 400, 3);
    S.voice(1.62, 400, 0.5, 'a', 0.022, miaPan, bus, 0.98);
    S.laugh(2.12, 0.026, miaPan, bus, 420, 3);
    talk(2.35, 2.9, 126, 0.03, jayPan);
    // Jay turns to you: the line starts clear, then the world drops away under it (the world bus does the rest)
    talk(2.95, 4.8, 135, 0.036, jayPan * 0.6);
    talk(5.5, 7.0, 122, 0.028, jayPan * 0.6);
    S.laugh(7.3, 0.022, miaPan, bus, 380, 4);
    talk(8.0, 9.6, 126, 0.028, jayPan * 0.7);
    // from the bathroom: laughter through the wall
    const wall = S.ctx.createGain(), wl = S.filter('lowpass', 380, 0.7); wall.gain.value = 0.6; wall.connect(wl); wl.connect(bus);
    S.laugh(13.9, 0.03, -0.3, wall, 210, 5); S.laugh(17.0, 0.025, -0.3, wall, 400, 4);
    // back in the room: everyone slow, low and far — a laugh that drags
    const slowLaugh = (t0, f0, n, vol, pan) => { for (let k = 0; k < n; k++) S.voice(t0 + k * 0.24, f0 * (1 - k * 0.04), 0.17, k % 3 ? 'a' : 'e', vol * (1 - k * 0.08), pan, bus, 0.9); };
    slowLaugh(23.5, 168, 6, 0.032, -0.2); slowLaugh(23.8, 300, 5, 0.026, 0.35);
    const slowTalk = (t0, t1, f0, vol, pan) => { let t = t0; while (t < t1) { const d = S.rng.range(0.18, 0.32); S.voice(t, f0 * S.rng.range(0.92, 1.05), d, S.rng.pick(['a', 'o', 'e', 'u']), vol, pan, bus, 0.94); t += d + S.rng.range(0.05, 0.14); if (S.rng.chance(0.2)) t += 0.4; } };
    slowTalk(25.0, 29.0, 105, 0.026, -0.25); slowTalk(31.4, 34.4, 104, 0.024, -0.35);
    // "you good?" — kind, ordinary, clear… and still far away
    S.voice(35.25, 150, 0.15, 'u', 0.05, -0.2, bus, 1.0); S.voice(35.45, 160, 0.34, 'u', 0.052, -0.2, bus, 1.35);
    // comedown: Mia sits beside you — "hey… you're okay."
    S.voice(60.65, 235, 0.28, 'e', 0.034, -0.6, bus, 0.85);
    [[61.15, 'u', 0.12], [61.29, 'o', 0.12], [61.43, 'o', 0.1], [61.55, 'e', 0.24]].forEach(([t, v, d], i) => S.voice(t, 225 - i * 6, d, v, 0.03, -0.6, bus, 0.95));
    S.laugh(63.9, 0.02, -0.4, bus, 200, 3);           // Jay, softly, at something on the TV
  }

  /* you: a short laugh, your breathing coming forward, a faint ringing, the hands, standing up */
  _body(S, you, world) {
    const ctx = S.ctx, end = CONFIG.duration + 0.5, on = 3.05;
    S.voice(0.88, 170, 0.12, 'e', 0.012, 0, you, 0.9); S.voice(1.04, 165, 0.1, 'e', 0.009, 0, you, 0.9);    // your own laugh, breathy
    // the drop: ears seem to close — a soft pressure swell as the room goes away
    { const n = S.noise('brown', on - 0.1, on + 0.7), lp = S.filter('lowpass', 220, 0.7), g = ctx.createGain(); S.env(g, on - 0.1, 0.25, 0.05, 0.5); n.connect(lp); lp.connect(g); g.connect(you); }
    // ringing: two close high tones — in once it starts, highest in the loop, gone in the comedown
    for (const [f, v] of [[6850, 0.0024], [7230, 0.0016]]) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f;
      g.gain.setValueAtTime(0, 0); g.gain.setValueAtTime(0, on); g.gain.linearRampToValueAtTime(v * 0.6, on + 0.8); g.gain.linearRampToValueAtTime(v, 9.0);
      g.gain.linearRampToValueAtTime(v * 1.1, 19.3); g.gain.linearRampToValueAtTime(v * 1.5, 21.0); g.gain.linearRampToValueAtTime(v * 1.1, 24.0);
      g.gain.linearRampToValueAtTime(v * 1.4, 46.6); g.gain.linearRampToValueAtTime(v * 1.7, 56.6); g.gain.setValueAtTime(v * 1.7, 57.3); g.gain.linearRampToValueAtTime(v * 0.6, 59.0); g.gain.linearRampToValueAtTime(0, 64.0);
      o.connect(g); g.connect(you); o.start(0); o.stop(end);
    }
    // a soft low pressure under everything once it starts (not music, just weight); it lifts in the comedown
    { const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 55; o2.frequency.value = 82.6;
      g.gain.setValueAtTime(0, 0); g.gain.setValueAtTime(0, on); g.gain.linearRampToValueAtTime(0.008, on + 1.4); g.gain.linearRampToValueAtTime(0.011, 38);
      g.gain.linearRampToValueAtTime(0.016, 56.6); g.gain.setValueAtTime(0.016, 57.3); g.gain.linearRampToValueAtTime(0.0, 62);
      o.connect(g); o2.connect(g); g.connect(you); o.start(0); o2.start(0); o.stop(end); o2.stop(end); }
    // breathing: unnoticed → in your head → short and fast in the panic → long and slow at the end
    for (let t = 0.5; t < end - 1;) {
      const fast = t > 40.2 && t < 57.0, calm = t > 58.0;
      const v = t < on ? 0.004 : fast ? 0.016 : calm ? MathX.lerp(0.015, 0.007, MathX.clamp((t - 58) / 10, 0, 1)) : t < 4.5 ? 0.01 : 0.014;
      const din = fast ? 0.55 : calm ? 1.6 : 1.2, dout = fast ? 0.6 : calm ? 2.2 : 1.45, gap = t < on ? 0.8 : fast ? 0.1 : calm ? 0.7 : 0.5;
      if (!(t > 56.5 && t < 57.4)) { S.breath(t, din, true, v, you); S.breath(t + din + 0.08, dout, false, v * 0.9, you); }
      t += din + dout + gap;
    }
    // heartbeat: arrives with the panic, races through the loop, settles and goes in the comedown
    for (let t = 39.0; t < 64.5;) {
      const v = t < 40 ? 0.05 : t < 56.6 ? 0.075 : MathX.lerp(0.07, 0.0, MathX.clamp((t - 57.4) / 7, 0, 1));
      if (!(t > 56.6 && t < 57.35)) S.heart(t, v, you);
      t += t < 42 ? 0.78 : t < 46.6 ? 0.62 : t < 56.6 ? 0.52 : MathX.lerp(0.6, 0.95, MathX.clamp((t - 57.4) / 6, 0, 1));
    }
    // hands and body: the look down, fabric, standing, footsteps (wood, then tile, then wood)
    S.breath(4.15, 0.35, true, 0.02, you);
    const rustle = (t, d, v, f = 2600) => { const n = S.noise('white', t, t + d), bp = S.filter('bandpass', f, 0.8), g = ctx.createGain(); S.env(g, t, d * 0.4, v, d * 0.6); n.connect(bp); bp.connect(g); g.connect(you); };
    rustle(5.0, 0.5, 0.01); rustle(6.45, 0.6, 0.008); rustle(7.5, 0.3, 0.004); rustle(8.1, 0.4, 0.005); rustle(8.85, 0.3, 0.004);
    { const n = S.noise('pink', 9.95, 10.6), bp = S.filter('bandpass', 380, 2.5), g = ctx.createGain(); bp.frequency.setValueAtTime(300, 9.95); bp.frequency.linearRampToValueAtTime(520, 10.5); S.env(g, 9.95, 0.15, 0.03, 0.5); n.connect(bp); bp.connect(g); g.connect(world); }
    rustle(10.0, 0.5, 0.012);
    for (const t of [10.85, 11.35]) S.step(t, 0.05, 0, world);
    const tile = (t, v) => { S.step(t, v, 0, world); S.click(t, v * 0.6, 0, world); };
    for (const t of [11.75, 12.25, 12.75]) tile(t, 0.045);
    rustle(13.6, 0.5, 0.01); rustle(16.3, 0.6, 0.008, 1800);             // hand up; fingers on your cheek
    rustle(18.0, 0.7, 0.012, 1400);                                       // turning away
    for (let t = 19.1; t < 23.0; t += 0.55) S.step(t, 0.035, 0, world);   // the hall, muffled
    // the corridor stretching: a low tone sliding down, a faint rush
    { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(120, 21.4); o.frequency.linearRampToValueAtTime(62, 23.0);
      g.gain.setValueAtTime(0, 21.4); g.gain.linearRampToValueAtTime(0.03, 22.6); g.gain.linearRampToValueAtTime(0, 23.6); o.connect(g); g.connect(you); o.start(21.4); o.stop(23.7); }
    for (const t of [23.3, 23.85]) S.step(t, 0.04, 0, world);
    rustle(28.95, 0.4, 0.012, 900); S.click(29.3, 0.02, 0.3, you);         // a palm on the door frame
    S.click(31.05, 0.015, 0.1, you);                                       // the phone wakes
    // the wall clock: you start hearing it tick (it was always there)
    const tick = (t, v) => { S.click(t, v, -0.2, world); S.tone(t, 0.02, 2600, v * 0.25, -0.2, world, 'sine', 0.006, 0.015); };
    for (let t = 31.5; t < 35; t += 1) tick(t, 0.03);
    for (let t = 42.5; t < 46.6; t += 1) tick(t, 0.045);
    S.voice(36.55, 140, 0.28, 'e', 0.012, 0, you, 0.9); S.voice(36.86, 135, 0.2, 'a', 0.009, 0, you, 0.85);   // you: "yeah…"
    rustle(41.2, 0.35, 0.01, 1600);                                         // hand to your chest
    { S.clunk(42.42, 0.05, 0.1, world); S.clunk(42.47, 0.04, -0.1, world); }   // both hands on the counter
    // the loop: every cut lands with a thud and a short breath in
    const cuts = [46.6, 47.7, 48.6, 49.5, 50.5, 51.4, 52.3, 53.3, 54.1, 54.9];
    cuts.forEach((t, i) => { S.thump(t, 0.05 + i * 0.004, you); S.breath(t + 0.02, 0.22, true, 0.012, you); });
    // comedown: sinking into the couch, Mia's footsteps and the cushion as she sits, a long breath out; a calm low chord
    { const n = S.noise('pink', 57.4, 58.1), lp = S.filter('lowpass', 500, 0.7), g = ctx.createGain(); S.env(g, 57.4, 0.2, 0.04, 0.5); n.connect(lp); lp.connect(g); g.connect(world); }
    S.breath(58.1, 2.6, false, 0.02, you);
    for (let t = 57.95, k = 0; t < 60.1; t += 0.46, k++) S.step(t, 0.035, 0.3 - k * 0.15, world);
    { const n = S.noise('pink', 60.2, 60.7), lp = S.filter('lowpass', 420, 0.7), g = ctx.createGain(); S.env(g, 60.2, 0.1, 0.03, 0.4); n.connect(lp); lp.connect(g); g.connect(world); }
    for (const [f, v] of [[110, 0.012], [164.8, 0.009], [220, 0.007], [277.2, 0.005]]) {
      const o = ctx.createOscillator(), g = ctx.createGain(), lp = S.filter('lowpass', 900, 0.5); o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0, 61.5); g.gain.linearRampToValueAtTime(v, 64.0); g.gain.setValueAtTime(v, 69.5); g.gain.linearRampToValueAtTime(0, 71.6);
      o.connect(lp); lp.connect(g); g.connect(you); o.start(61.5); o.stop(71.7);
    }
  }

  /* the bathroom: an extractor fan, a slow drip from the tap */
  _bathroom(S, bus) {
    const ctx = S.ctx, t0 = 11.6, t1 = 18.9;
    const fan = S.noise('pink', t0, t1 + 0.3), fb = S.filter('bandpass', 260, 0.9), fg = ctx.createGain();
    fg.gain.setValueAtTime(0, t0); fg.gain.linearRampToValueAtTime(0.03, t0 + 0.05); fg.gain.setValueAtTime(0.03, t1); fg.gain.linearRampToValueAtTime(0, t1 + 0.25);
    fan.connect(fb); fb.connect(fg); fg.connect(bus);
    S.tone(t0, t1 - t0, 118, 0.003, 0, bus, 'sine', 0.05, 0.2);
    for (let t = 12.3; t < t1; t += 1.45) { S.tone(t, 0.06, 1400, 0.012, -0.1, bus, 'sine', 0.006, 0.05); S.click(t, 0.01, -0.1, bus); }
    // the loop's two mirror shots
    for (const [a, b] of [[47.7, 48.6], [53.3, 54.1]]) { const n = S.noise('pink', a, b), f2 = S.filter('bandpass', 260, 0.9), g2 = ctx.createGain(); g2.gain.value = 0.025; n.connect(f2); f2.connect(g2); g2.connect(bus); }
  }
}
