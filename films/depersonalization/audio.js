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

  fingerprintData() { return [APT, DP_WARP && Object.keys(DP_WARP)]; }

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
  }

  // how far away the world sounds over time: [t, low-pass Hz, level, room send]
  _distance() {
    return [[0, 16000, 1, 0.08], [2.15, 16000, 1, 0.08], [2.3, 7000, 0.85, 0.2], [2.75, 16000, 1, 0.08],
      [4.55, 16000, 1, 0.08], [5.1, 1500, 0.55, 0.42], [6.5, 1900, 0.6, 0.38], [9.5, 1300, 0.5, 0.45], [11.0, 1100, 0.48, 0.48], [13, 1200, 0.5, 0.45]];
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
    const beat = 60 / 78, chords = [[146.8, 174.6, 220, 261.6], [130.8, 164.8, 196, 246.9], [110, 130.8, 164.8, 196], [116.5, 146.8, 174.6, 220]];
    for (let b = 0, t = 0.05; t < end; b++, t += beat) {
      const bar = Math.floor(b / 4) % 4, inBar = b % 4;
      if (inBar === 0 || inBar === 2.5) { S.tone(t, 0.25, 55, 0.07, 0, spk, 'sine', 0.006, 0.2); }
      if (inBar === 2) S.tone(t + beat * 0.5, 0.2, 55, 0.04, 0, spk, 'sine', 0.006, 0.15);
      if (inBar === 1 || inBar === 3) { const n = S.noise('white', t, t + 0.18), bp = S.filter('bandpass', 1800, 0.8), g = ctx.createGain(); S.env(g, t, 0.006, 0.03, 0.14); n.connect(bp); bp.connect(g); g.connect(spk); }
      for (const off of [0, 0.5]) { const n = S.noise('white', t + off * beat, t + off * beat + 0.04), hp = S.filter('highpass', 7000, 0.7), g = ctx.createGain(); S.env(g, t + off * beat, 0.006, 0.008, 0.03); n.connect(hp); hp.connect(g); g.connect(spk); }
      if (inBar === 0) {
        for (const f of chords[bar]) { const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), trem = ctx.createOscillator(), tg = ctx.createGain();
          o.type = 'triangle'; o.frequency.value = f * 2; o2.type = 'sine'; o2.frequency.value = f * 4.002;
          trem.frequency.value = 4.5; tg.gain.value = 0.002; trem.connect(tg); tg.connect(g.gain);
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.006, t + 0.02); g.gain.setTargetAtTime(0.0, t + 0.1, beat * 1.4);
          o.connect(g); o2.connect(g); g.connect(spk); o.start(t); o2.start(t); trem.start(t); o.stop(t + beat * 4); o2.stop(t + beat * 4); trem.stop(t + beat * 4); }
        S.tone(t, beat * 1.8, chords[bar][0] / 2, 0.03, 0, spk, 'sine', 0.01, 0.4);
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
    talk(0.15, 1.4, 128, 0.03, jayPan);
    S.laugh(1.5, 0.035, jayPan, bus, 210, 6); S.laugh(1.6, 0.02, jayPan, room, 210, 5);
    S.laugh(2.42, 0.03, miaPan, bus, 400, 5);           // (her laugh lands a beat late: the first thing that's off)
    talk(2.7, 3.55, 125, 0.03, jayPan);
    // Jay turns to you: the line starts clear, then the world drops away under it (the world bus does the rest)
    talk(3.75, 6.2, 135, 0.036, jayPan * 0.6);
    talk(6.9, 8.4, 122, 0.028, jayPan * 0.6);
    S.laugh(8.6, 0.025, miaPan, bus, 380, 4);
    talk(9.3, 11.0, 126, 0.028, jayPan * 0.7);
  }

  /* you: a short laugh, your breathing coming forward, a faint ringing, the hands, standing up */
  _body(S, you, world) {
    const ctx = S.ctx, end = CONFIG.duration + 0.5;
    S.voice(1.62, 170, 0.12, 'e', 0.012, 0, you, 0.9); S.voice(1.78, 165, 0.1, 'e', 0.009, 0, you, 0.9);    // your own laugh, breathy
    // ringing: two close high tones, slowly in from 4.6 s
    for (const [f, v] of [[6850, 0.0024], [7230, 0.0016]]) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f;
      g.gain.setValueAtTime(0, 0); g.gain.setValueAtTime(0, 4.6); g.gain.linearRampToValueAtTime(v * 0.6, 5.4); g.gain.linearRampToValueAtTime(v, 10.5); g.gain.linearRampToValueAtTime(v * 1.15, end);
      o.connect(g); g.connect(you); o.start(0); o.stop(end);
    }
    // a soft low pressure under everything once it starts (not music, just weight)
    { const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 55; o2.frequency.value = 82.6;
      g.gain.setValueAtTime(0, 0); g.gain.setValueAtTime(0, 4.6); g.gain.linearRampToValueAtTime(0.008, 6.0); g.gain.linearRampToValueAtTime(0.011, end);
      o.connect(g); o2.connect(g); g.connect(you); o.start(0); o2.start(0); o.stop(end); o2.stop(end); }
    // breathing: unnoticed at first, then right there in your head
    for (let t = 0.8, k = 0; t < end - 1; k++) {
      const v = t < 4.6 ? 0.004 : t < 6 ? 0.01 : 0.014, din = 1.25, dout = 1.5;
      S.breath(t, din, true, v, you); S.breath(t + din + 0.1, dout, false, v * 0.9, you);
      t += din + dout + (t < 4.6 ? 0.9 : 0.55);
    }
    // the look down: a small sharp inhale; fabric as the hands lift and turn
    S.breath(5.2, 0.35, true, 0.02, you);
    const rustle = (t, d, v) => { const n = S.noise('white', t, t + d), bp = S.filter('bandpass', 2600, 0.8), g = ctx.createGain(); S.env(g, t, d * 0.4, v, d * 0.6); n.connect(bp); bp.connect(g); g.connect(you); };
    rustle(6.15, 0.5, 0.01); rustle(7.85, 0.6, 0.008); rustle(9.0, 0.3, 0.004); rustle(10.2, 0.3, 0.004);
    // standing up: the couch, a creak, then steps on the floorboards
    { const n = S.noise('pink', 11.55, 12.2), bp = S.filter('bandpass', 380, 2.5), g = ctx.createGain(); bp.frequency.setValueAtTime(300, 11.55); bp.frequency.linearRampToValueAtTime(520, 12.1); S.env(g, 11.55, 0.15, 0.03, 0.5); n.connect(bp); bp.connect(g); g.connect(world); }
    rustle(11.6, 0.5, 0.012);
    for (const t of [12.45, 12.95]) S.step(t, 0.05, 0, world);
  }
}
