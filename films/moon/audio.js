/* =====================================================================
   SOUNDTRACK — "What if the Moon crashed into Earth?"
   Space is a vacuum: nothing you hear comes from the Moon itself. Two layers:
     EARTH (diegetic) — the coast and the city: wind, waves on the quay,
       traffic, people; the harbour draining (gurgling, chains, hulls
       grinding on the mud), each surge's roar and crash; rushing water in
       the streets, splashing steps, car alarms and sirens; the tremor's
       rumble, creaking structures, glass, power lines arcing, the lighthouse
       and the tower coming down; your breath; at the end a sound so low and
       so big it is felt more than heard — then silence.
     SCORE (non-diegetic) — immediate tension under the cold open, a drop at
       the rewind, wonder for the normal evening, rising dread, heavy tension
       through the flood and the tremors, stripped back for the countdown,
       one overwhelming climax.
   ===================================================================== */

class MnAudio extends AudioEngine {
  constructor(tl, app) { super(tl); this.app = app; this.wavName = SCRIPT.meta.wav; }

  fingerprintData() { return [MN, MN_SEA, MN_BORES, MN_QUAKE, MN_PEOPLE, MN_FX]; }

  async renderOffline() { const buf = await super.renderOffline(); AudioEngine.declick(buf, 0.15); return buf; }

  _build(ctx) {
    const S = new SoundKit(ctx, CONFIG.seed), end = CONFIG.duration;
    // offline-render safe envelopes
    S.env = (g, t, a, peak, d) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(Math.max(0.0002, peak), t + Math.max(a, 0.006)); g.gain.setTargetAtTime(0, t + Math.max(a, 0.006), Math.max(0.004, d / 4)); };
    const tone = S.tone.bind(S);
    S.tone = (t, dur, f, vol, pan, dest, type = 'sine', attack = 0.01, release = null) => tone(t, dur, f, vol, pan, dest, type, Math.max(attack, 0.006), release);
    S.breath = (t, dur, inhale, vol, dest) => {
      const n = S.noise('pink', t, t + dur + 0.1), bp = S.filter('bandpass', inhale ? 1200 : 700, 0.9), g = ctx.createGain();
      if (inhale) { bp.frequency.setValueAtTime(850, t); bp.frequency.linearRampToValueAtTime(1500, t + dur); }
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + dur * (inhale ? 0.6 : 0.3)); g.gain.linearRampToValueAtTime(0, t + dur);
      n.connect(bp); bp.connect(g); g.connect(dest);
    };
    S.gasp = (t, vol, dest) => {
      const n = S.noise('pink', t, t + 0.9), bp = S.filter('bandpass', 900, 0.8), g = ctx.createGain();
      bp.frequency.setValueAtTime(700, t); bp.frequency.linearRampToValueAtTime(2200, t + 0.5);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.1); g.gain.linearRampToValueAtTime(vol * 0.7, t + 0.4); g.gain.linearRampToValueAtTime(0, t + 0.8);
      n.connect(bp); bp.connect(g); g.connect(dest);
    };
    this.S = S;
    // master: mix → glue compressor → limiter; everything stops dead at the cut to black
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 2.5; comp.attack.value = 0.008; comp.release.value = 0.25;
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -2.0; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.12;
    const mixIn = ctx.createGain(); mixIn.gain.value = 4.2; mixIn.connect(comp);
    const out = ctx.createGain(); comp.connect(out); out.connect(lim); lim.connect(ctx.destination);
    out.gain.setValueAtTime(0.0001, 0); out.gain.linearRampToValueAtTime(0.9, 0.04);
    out.gain.setValueAtTime(0.9, MN.black - 0.04); out.gain.linearRampToValueAtTime(0.0, MN.black);
    // EARTH bus: narrowed (low-passed) through the countdown, everything after the rewind; the open-air reflection
    const earth = ctx.createGain(), elp = S.filter('lowpass', 18000, 0.5); earth.connect(elp); elp.connect(mixIn);
    for (const [t, f] of [[0, 18000], [66, 18000], [71, 3000], [73.8, 900], [74.5, 1400], [75.2, 9000]]) elp.frequency.linearRampToValueAtTime(f, t);
    const rev = S.reverb(1.8), rs = ctx.createGain(); rs.gain.value = 0.35; rev.connect(rs); rs.connect(earth);
    const you = ctx.createGain(); you.gain.value = 1.4; you.connect(mixIn);
    const score = ctx.createGain(); score.connect(mixIn);
    const hall = S.reverb(4.0), hs = ctx.createGain(); hs.gain.value = 0.5; hall.connect(hs); hs.connect(score);
    this.earth = earth; this.rev = rev;
    this._wind(S, earth);
    this._sea(S, earth, rev);
    this._city(S, earth, rev);
    this._people(S, earth, rev);
    this._quake(S, earth, rev);
    this._you(S, you);
    this._rewind(S, mixIn);
    this._impact(S, mixIn);
    this._score(S, score, hall);
  }

  // a level over film time from [t, v] keys (linear)
  _lv(param, keys, scale = 1) { param.setValueAtTime(keys[0][1] * scale, 0); for (const [t, v] of keys) param.linearRampToValueAtTime(v * scale, t); }

  /* wind: gusts that strengthen through the day; strong in the cold open and on the hill */
  _wind(S, bus) {
    const ctx = S.ctx, end = CONFIG.duration;
    const lvl = [[0, 0.9], [3.9, 0.9], [4.2, 0.2], [5.6, 0.12], [13, 0.15], [21, 0.25], [30, 0.4], [39, 0.55], [47, 0.65], [55, 0.75], [63, 0.95], [70, 1.1], [74.5, 1.2]];
    for (const [f, q, v, seed] of [[260, 0.6, 0.05, 3], [1600, 0.5, 0.014, 7]]) {
      const n = S.noise('pink', 0, end), bp = S.filter('bandpass', f, q), g = ctx.createGain(), p = ctx.createStereoPanner();
      g.gain.setValueAtTime(0, 0);
      for (let t = 0; t <= end; t += 0.25) {
        let L = lvl[0][1]; for (let i = 1; i < lvl.length; i++) if (t <= lvl[i][0]) { const [a, va] = lvl[i - 1], [b, vb] = lvl[i]; L = va + (vb - va) * (t - a) / (b - a); break; } else L = lvl[i][1];
        const gust = 0.55 + 0.45 * fbm1(t * 0.17, seed);
        g.gain.linearRampToValueAtTime(v * L * Math.max(0.2, gust), t);
        p.pan.linearRampToValueAtTime(0.5 * fbm1(t * 0.06, seed + 1), t);
      }
      n.connect(bp); bp.connect(g); g.connect(p); p.connect(bus);
    }
  }

  /* the sea: lapping on the quay; the harbour draining; the surges; rushing currents; flood water in the streets */
  _sea(S, bus, rev) {
    const ctx = S.ctx, end = CONFIG.duration, rng = new RNG(CONFIG.seed + 11);
    // lapping: soft swells and splashes against the quay wall (closer when you are at the railing)
    const lap = [[0, 0.1], [4.0, 0.1], [5.6, 0.25], [12.5, 0.35], [13.2, 0.9], [14.5, 0.5], [16.5, 0.08], [18.0, 0.05], [20.4, 1.0], [30, 1.0], [31.8, 0.5], [33.4, 1.0], [39, 0.4], [55, 0.3], [63, 0.15], [80, 0.15]];
    { const n = S.noise('pink', 0, end), bp = S.filter('bandpass', 520, 0.7), g = ctx.createGain(); this._lv(g.gain, lap, 0.06); n.connect(bp); bp.connect(g); g.connect(bus); }
    for (let t = 5.8; t < 74; t += rng.range(0.7, 1.8)) {
      const nearRail = t > 13 && t < 33, amp = (nearRail ? 0.05 : 0.018) * (t > 16 && t < 19.5 ? 0.1 : 1) * (t > 21 ? 1.6 : 1);
      const n = S.noise('white', t, t + 0.7), bp = S.filter('bandpass', rng.range(700, 1500), 0.8), g = ctx.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amp, t + 0.08); g.gain.linearRampToValueAtTime(0, t + rng.range(0.35, 0.65));
      n.connect(bp); bp.connect(g); g.connect(S.panned(bus, rng.range(-0.6, 0.6)));
    }
    // the harbour draining (13.5–17.6): gurgles and sucking, mooring chains clanking taut, hulls grinding on the mud
    for (let t = 13.6; t < 17.8; t += rng.range(0.12, 0.35)) {
      const o = ctx.createOscillator(), g = ctx.createGain(), f = rng.range(140, 320);
      o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * rng.range(1.5, 2.4), t + 0.07);
      S.env(g, t, 0.006, rng.range(0.008, 0.02), 0.08); o.connect(g); g.connect(S.panned(bus, rng.range(-0.7, 0.7))); o.start(t); o.stop(t + 0.15);
    }
    { const n = S.noise('pink', 13.5, 18.2), bp = S.filter('bandpass', 380, 1.4), g = ctx.createGain(); g.gain.setValueAtTime(0, 13.5); g.gain.linearRampToValueAtTime(0.05, 15); g.gain.linearRampToValueAtTime(0.02, 17.6); g.gain.linearRampToValueAtTime(0, 18.2); n.connect(bp); bp.connect(g); g.connect(rev); }
    const chain = (t, pan, v) => { for (let k = 0; k < 4; k++) { const tt = t + k * rng.range(0.05, 0.12); for (const f of [1870, 2950, 4100]) S.tone(tt, 0.25, f * rng.range(0.97, 1.03), v * (f < 2000 ? 1 : 0.5), pan, bus, 'sine', 0.002, 0.22); } };
    const creak = (t, pan, v, f0 = 110) => { const o = ctx.createOscillator(), g = ctx.createGain(), lp = S.filter('bandpass', 700, 3); o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f0 * rng.range(1.3, 1.9), t + 0.5); o.frequency.linearRampToValueAtTime(f0 * 0.9, t + 0.9);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.2); g.gain.linearRampToValueAtTime(v * 0.6, t + 0.6); g.gain.linearRampToValueAtTime(0, t + 0.95); o.connect(lp); lp.connect(g); g.connect(S.panned(bus, pan)); o.start(t); o.stop(t + 1); };
    for (const t of [14.6, 15.4, 16.3, 17.1]) chain(t, rng.range(-0.6, 0.6), 0.01);
    for (const t of [15.8, 16.6, 17.4, 22.5, 24.1, 26.0, 27.7, 29.2]) creak(t, rng.range(-0.7, 0.7), 0.012, rng.range(80, 140));
    // each surge: a roar that builds out at sea and arrives, a crash where it meets the quay, then rushing water
    const surge = (t0, t1, vol, crashT) => {
      const n = S.noise('brown', t0, t1 + 3), lp = S.filter('lowpass', 300, 0.6), g = ctx.createGain();
      lp.frequency.setValueAtTime(200, t0); lp.frequency.linearRampToValueAtTime(900, crashT);
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, crashT); g.gain.linearRampToValueAtTime(vol * 0.5, t1); g.gain.linearRampToValueAtTime(0, t1 + 3);
      n.connect(lp); lp.connect(g); g.connect(bus);
      const w = S.noise('white', t0, t1 + 3), bp = S.filter('bandpass', 1400, 0.5), wg = ctx.createGain();
      wg.gain.setValueAtTime(0, t0); wg.gain.linearRampToValueAtTime(vol * 0.35, crashT); wg.gain.linearRampToValueAtTime(vol * 0.25, t1); wg.gain.linearRampToValueAtTime(0, t1 + 3);
      w.connect(bp); bp.connect(wg); wg.connect(bus);
      S.boom(crashT, vol * 1.6, bus, rev); S.crunch(crashT + 0.05, vol * 0.6, 0, rev, rev);
    };
    surge(17.4, 21.5, 0.14, 20.3);
    surge(31.9, 39.5, 0.22, 33.6);
    // strong currents in the harbour (21–31): rushing, slapping hulls, ropes snapping
    { const n = S.noise('white', 21, 32), bp = S.filter('bandpass', 1100, 0.6), g = ctx.createGain(); g.gain.setValueAtTime(0, 21);
      for (let t = 21; t < 32; t += 0.3) g.gain.linearRampToValueAtTime(0.02 + 0.03 * Math.abs(Math.sin(t * 0.9)) * (0.6 + 0.4 * fbm1(t, 4)), t);
      g.gain.linearRampToValueAtTime(0, 32); n.connect(bp); bp.connect(g); g.connect(bus); }
    for (const t of [23.6, 26.4, 29.0]) { S.tone(t, 0.18, 260, 0.03, rng.range(-0.5, 0.5), bus, 'triangle', 0.002, 0.15); S.click(t, 0.08, 0, bus); }      // a mooring line snaps
    for (let t = 21.5; t < 31; t += rng.range(0.6, 1.4)) S.clunk(t, 0.05, rng.range(-0.7, 0.7), rev);                                                 // hulls knocking
    // flood water in the streets (cold open; 33.6–56): a constant rush, louder near you, with splashes and knocks of debris
    const flood = [[0, 0.9], [3.9, 0.9], [4.3, 0.1], [5.6, 0], [33.6, 0], [34.6, 1.0], [39, 0.45], [47, 0.4], [51, 0.55], [55, 0.3], [56, 0.05], [80, 0]];
    { const n = S.noise('pink', 0, end), bp = S.filter('bandpass', 900, 0.5), g = ctx.createGain(); this._lv(g.gain, flood, 0.07); n.connect(bp); bp.connect(g); g.connect(bus); }
    for (let t = 0.1; t < 56; t += rng.range(0.2, 0.7)) {
      if (t > 3.9 && t < 34) { t = 34; continue; }
      const n = S.noise('white', t, t + 0.3), bp = S.filter('bandpass', rng.range(1200, 2600), 0.9), g = ctx.createGain();
      S.env(g, t, 0.01, rng.range(0.01, 0.03) * (t < 39 ? 1 : 0.5), 0.2); n.connect(bp); bp.connect(g); g.connect(S.panned(bus, rng.range(-0.8, 0.8)));
      if (rng.chance(0.15)) S.clunk(t + 0.05, 0.035, rng.range(-0.8, 0.8), rev);
    }
    // the last great surge, heard from the hill: a far, rising roar (64–74.5)
    { const n = S.noise('brown', 63.5, 75), lp = S.filter('lowpass', 250, 0.6), g = ctx.createGain(); lp.frequency.setValueAtTime(180, 63.5); lp.frequency.linearRampToValueAtTime(600, 74.5);
      g.gain.setValueAtTime(0, 63.5); g.gain.linearRampToValueAtTime(0.12, 70); g.gain.linearRampToValueAtTime(0.2, 74.5); n.connect(lp); lp.connect(g); g.connect(rev); }
  }

  /* the city: traffic and its hum, a boat's horn, sirens and car alarms as things go wrong */
  _city(S, bus, rev) {
    const ctx = S.ctx, end = CONFIG.duration, rng = new RNG(CONFIG.seed + 21);
    const hum = [[0, 0.4], [3.9, 0.4], [4.4, 0.6], [5.6, 1.0], [21, 1.0], [27, 0.6], [34, 0.4], [50, 0.2], [80, 0.15]];
    { const n = S.noise('brown', 0, end), lp = S.filter('lowpass', 220, 0.6), g = ctx.createGain(); this._lv(g.gain, hum, 0.05); n.connect(lp); lp.connect(g); g.connect(bus); }
    // cars passing on the coast road (until they stop, ~21–27)
    const car = (t, dur, pan0, pan1, v) => {
      const n = S.noise('pink', t, t + dur), bp = S.filter('bandpass', 480, 0.7), g = ctx.createGain(), p = ctx.createStereoPanner();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + dur * 0.5); g.gain.linearRampToValueAtTime(0, t + dur);
      p.pan.setValueAtTime(pan0, t); p.pan.linearRampToValueAtTime(pan1, t + dur); n.connect(bp); bp.connect(g); g.connect(p); p.connect(bus);
    };
    for (let t = 5.8; t < 25; t += rng.range(1.6, 3.2)) { const s = rng.chance(0.5) ? 1 : -1; car(t, rng.range(2.2, 3.6), -0.8 * s, 0.8 * s, (t < 13 ? 0.03 : 0.05) * (t > 21 ? 0.6 : 1)); }
    S.horn(9.2, 98, 131, 0.01, -0.3, rev);                                  // a ship's horn far out in the bay
    S.horn(23.4, 349, 415, 0.006, 0.4, rev); S.horn(25.1, 330, 392, 0.005, -0.5, rev);
    // sirens: one far off from 24, more and nearer as it goes on
    const siren = (t0, t1, pan, v, rate = 0.22) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), lp = S.filter('lowpass', 2200, 0.7); o.type = 'sawtooth';
      for (let t = t0; t < t1; t += 1 / rate) { o.frequency.setValueAtTime(620, t); o.frequency.linearRampToValueAtTime(1250, t + 0.5 / rate); o.frequency.linearRampToValueAtTime(620, t + 1 / rate); }
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + 1); g.gain.setValueAtTime(v, t1 - 1); g.gain.linearRampToValueAtTime(0, t1);
      o.connect(lp); lp.connect(g); g.connect(S.panned(rev, pan)); o.start(t0); o.stop(t1);
    };
    siren(0, 4.2, 0.5, 0.012); siren(24, 74.5, -0.6, 0.006); siren(31, 74.5, 0.5, 0.008, 0.3); siren(45, 74.5, 0.1, 0.006, 0.18); siren(58, 74.5, -0.3, 0.007, 0.26);
    // car alarms: two-tone and whoop patterns, in the flood (cold open; from 34)
    const alarm = (t0, t1, pan, v, f = 1) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), lp = S.filter('lowpass', 2400, 0.7); o.type = 'square';
      let t = t0; o.frequency.setValueAtTime(900 * f, t0);
      while (t < t1) { for (let k = 0; k < 6 && t < t1; k++) { o.frequency.setValueAtTime((k % 2 ? 1180 : 860) * f, t); t += 0.4; } for (let k = 0; k < 6 && t < t1; k++) { o.frequency.setValueAtTime(700 * f, t); o.frequency.linearRampToValueAtTime(1500 * f, t + 0.28); t += 0.3; } }
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + 0.05); g.gain.setValueAtTime(v, t1 - 0.1); g.gain.linearRampToValueAtTime(0, t1);
      o.connect(lp); lp.connect(g); g.connect(S.panned(bus, pan)); o.start(t0); o.stop(t1);
    };
    alarm(0, 3.95, -0.6, 0.008); alarm(0.6, 3.95, 0.5, 0.006, 1.07);
    alarm(34.3, 55, -0.5, 0.006); alarm(35.1, 56, 0.6, 0.005, 1.05); alarm(36.8, 55, 0.2, 0.004, 0.94); alarm(48.6, 62, -0.2, 0.004, 1.1);
  }

  /* people: chatter on the evening street, murmurs at the railing, shouts, the panic, screams far off, a hush on the hill */
  _people(S, bus, rev) {
    const rng = new RNG(CONFIG.seed + 31);
    const murmur = (t0, t1, v, pan = 0, f0 = 180, density = 2) => S.chatter(t0, t1, v, pan, rev, f0, density);
    murmur(0, 3.9, 0.006, -0.4, 260, 6); murmur(0.4, 3.9, 0.005, 0.5, 200, 6);
    for (let t = 0.3; t < 3.9; t += rng.range(0.4, 0.9)) S.voice(t, rng.range(380, 620), rng.range(0.25, 0.5), 'a', 0.009, rng.range(-0.8, 0.8), rev, rng.range(0.8, 1.1));   // shouting
    murmur(6.0, 12.8, 0.004, 0.4, 190, 1.5); murmur(7.2, 12.8, 0.003, -0.5, 230, 1.2);
    S.voice(9.5, 210, 0.5, 'o', 0.012, 0.4, bus, 0.75);                                                     // "whoa…"
    murmur(13.5, 21, 0.006, -0.2, 200, 3); murmur(15, 21, 0.005, 0.4, 240, 3);
    for (const t of [16.4, 18.0, 20.2]) S.gasp(t, 0.03, S.panned(rev, rng.range(-0.5, 0.5)));
    murmur(21, 31.6, 0.008, -0.3, 210, 4.5); murmur(21.5, 31.6, 0.007, 0.5, 250, 4.5);
    for (let t = 21.4; t < 31; t += rng.range(0.8, 2.0)) S.click(t, 0.04, rng.range(-0.6, 0.6), bus);       // camera shutters
    // "RUN!" and the stampede
    for (const [t, f] of [[31.7, 330], [31.95, 300], [32.3, 420]]) S.voice(t, f, 0.35, 'a', 0.03, rng.range(-0.4, 0.4), bus, 0.85);
    for (let t = 32.2; t < 39; t += rng.range(0.25, 0.7)) S.voice(t, rng.range(420, 760), rng.range(0.2, 0.5), rng.pick(['a', 'e']), 0.008, rng.range(-0.9, 0.9), rev, rng.range(0.8, 1.2));
    murmur(39, 55, 0.004, -0.6, 280, 5); murmur(41, 55, 0.004, 0.6, 330, 5);
    for (const t of [48.4, 48.6, 50.95, 51.2]) S.voice(t, rng.range(500, 800), 0.6, 'a', 0.016, rng.range(-0.6, 0.6), rev, 0.7);          // screams at the shaking
    murmur(63.2, 72, 0.004, 0.3, 200, 1.5);
    for (const t of [67.6, 70.5]) S.voice(t, 240, 0.9, 'o', 0.008, -0.2, rev, 0.8);                         // a sob on the hill
  }

  /* the tremor: rumble, creaking and groaning structures, glass, power lines arcing, the lighthouse, the tower */
  _quake(S, bus, rev) {
    const ctx = S.ctx, end = CONFIG.duration, rng = new RNG(CONFIG.seed + 41);
    // rumble follows the tremor (cold open, from 44, all the way to the end)
    const R = [[0, 0.8], [3.9, 0.8], [4.4, 0.0], [44, 0.0], [46.5, 0.2], [48, 0.6], [50, 0.85], [52, 0.6], [55, 0.75], [60, 0.55], [64, 0.7], [70, 0.9], [74.5, 1.0], [76.3, 1.0]];
    { const n = S.noise('brown', 0, end), lp = S.filter('lowpass', 110, 0.7), g = ctx.createGain(); this._lv(g.gain, R, 0.13); n.connect(lp); lp.connect(g); g.connect(bus); }
    { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 34; this._lv(g.gain, R, 0.05); o.connect(g); g.connect(bus); o.start(0); o.stop(end); }
    // groans and creaks of buildings
    const groan = (t, v, pan) => { const o = ctx.createOscillator(), g = ctx.createGain(), bp = S.filter('bandpass', 260, 4); o.type = 'sawtooth'; const f = rng.range(45, 75);
      o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * rng.range(0.7, 1.4), t + 1.4); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.5); g.gain.linearRampToValueAtTime(0, t + 1.6);
      o.connect(bp); bp.connect(g); g.connect(S.panned(rev, pan)); o.start(t); o.stop(t + 1.7); };
    for (let t = 0.2; t < 74; t += rng.range(0.8, 2.2)) { if (t > 3.6 && t < 46) { t = 46; continue; } groan(t, rng.range(0.02, 0.045), rng.range(-0.8, 0.8)); }
    // glass bursting (48.3, 50.9; and in the cold open)
    const glass = (t, v, pan) => { S.crunch(t, v, pan, bus, rev); for (let k = 0; k < 26; k++) { const tt = t + rng.range(0, 1.6), f = rng.range(3000, 8000); S.tone(tt, 0.06, f, v * 0.12 * rng.range(0.3, 1), pan + rng.range(-0.3, 0.3), bus, 'sine', 0.002, 0.05); } };
    glass(1.6, 0.04, 0.6); glass(48.3, 0.09, 0.5); glass(50.9, 0.08, -0.5); glass(57.6, 0.04, 0.3); glass(61.2, 0.03, -0.4);
    // power lines arcing: crackle + mains buzz
    const arc = (t, dur, v, pan) => { const b = ctx.createBufferSource(); b.buffer = S.crackleBuffer(dur + 0.2, 160); const hp = S.filter('highpass', 900, 0.7), g = ctx.createGain(); S.env(g, t, 0.01, v, dur); b.connect(hp); hp.connect(g); g.connect(S.panned(bus, pan)); b.start(t); b.stop(t + dur + 0.2);
      const o = ctx.createOscillator(), og = ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = 100; S.env(og, t, 0.01, v * 0.25, dur); o.connect(og); og.connect(S.panned(bus, pan)); o.start(t); o.stop(t + dur + 0.1); };
    for (const [t, d, p] of [[48.9, 0.8, -0.5], [52.6, 0.5, -0.6], [56.4, 0.9, -0.3], [59.8, 0.6, 0.4]]) arc(t, d, 0.05, p);
    // the lighthouse falls (far): a crack, a long rumble, a splash; the tower comes down (from the hill)
    S.farBoom(50.6, 0.08, 0.3, rev); S.crunch(49.6, 0.02, 0.35, rev, rev);
    S.farBoom(67.6, 0.14, -0.1, rev); S.farBoom(68.4, 0.12, 0.1, rev);
    { const n = S.noise('brown', 67.3, 73), lp = S.filter('lowpass', 300, 0.6), g = ctx.createGain(); g.gain.setValueAtTime(0, 67.3); g.gain.linearRampToValueAtTime(0.1, 68.2); g.gain.linearRampToValueAtTime(0, 73); n.connect(lp); lp.connect(g); g.connect(rev); }
    // transformers blowing in the dark city
    for (const t of [53.8, 58.6, 62.3, 65.4]) { S.boom(t, 0.06, rev, rev); S.click(t, 0.08, rng.range(-0.6, 0.6), rev); }
  }

  /* you: footsteps (walking, then running — splashing in the flood), breath, a gasp */
  _you(S, bus) {
    const rng = new RNG(CONFIG.seed + 51);
    for (let t = 5.8, s = 1; t < 12.9; t += 0.56, s = -s) S.step(t, 0.035, s * 0.1, bus);
    const splash = (t, v) => { const ctx = S.ctx, n = S.noise('white', t, t + 0.3), bp = S.filter('bandpass', rng.range(900, 1700), 0.8), g = ctx.createGain(); S.env(g, t, 0.006, v, 0.18); n.connect(bp); bp.connect(g); g.connect(bus); S.step(t, v * 0.5, 0, bus); };
    for (let t = 32.8, s = 1; t < 38.9; t += 0.34, s = -s) { if (t < 34.4) S.step(t, 0.06, s * 0.1, bus); else splash(t, 0.07); }
    for (let t = 55.1, s = 1; t < 62.9; t += 0.33, s = -s) S.step(t, 0.06, s * 0.1, bus);
    // breath: calm, then fast with the running, held at the end
    for (let t = 6; t < 74; ) {
      const run = (t > 32.5 && t < 39.5) || (t > 55 && t < 64), hold = t > 71.5;
      if (hold) break;
      const p = run ? 0.75 : t > 44 ? 2.0 : 3.6, v = run ? 0.05 : t > 44 ? 0.03 : 0.015;
      S.breath(t, p * 0.42, true, v, bus); S.breath(t + p * 0.45, p * 0.45, false, v * 0.8, bus);
      t += p;
    }
    for (const t of [17.9, 32.9, 48.2, 58.0]) S.gasp(t, 0.07, bus);
    S.gasp(73.6, 0.09, bus);
  }

  /* the rewind (4.0–5.6): the chaos sucked backwards — a reversed swell into a soft, tape-like slow-down, then the quiet */
  _rewind(S, bus) {
    const ctx = S.ctx, t0 = MN.rewind[0], t1 = MN.rewind[1];
    const n = S.noise('pink', t0 - 0.2, t1 + 0.2), bp = S.filter('bandpass', 600, 0.6), g = ctx.createGain();
    bp.frequency.setValueAtTime(3000, t0); bp.frequency.exponentialRampToValueAtTime(200, t1);
    g.gain.setValueAtTime(0, t0 - 0.2); g.gain.linearRampToValueAtTime(0.06, t0 + 0.2); g.gain.linearRampToValueAtTime(0.09, t1 - 0.25); g.gain.linearRampToValueAtTime(0, t1);
    n.connect(bp); bp.connect(g); g.connect(bus);
    // a reversed hit: swells up to the cut instead of decaying from it
    const o = ctx.createOscillator(), og = ctx.createGain(); o.frequency.setValueAtTime(70, t0); o.frequency.exponentialRampToValueAtTime(160, t1 - 0.1);
    og.gain.setValueAtTime(0, t0); og.gain.exponentialRampToValueAtTime(0.001, t0 + 0.5); og.gain.exponentialRampToValueAtTime(0.06, t1 - 0.12); og.gain.linearRampToValueAtTime(0, t1 - 0.05);
    o.connect(og); og.connect(bus); o.start(t0); o.stop(t1);
  }

  /* the impact: no explosion — a roar from below everything, the air itself, rising until it is all there is; then nothing */
  _impact(S, bus) {
    const ctx = S.ctx, t0 = MN.impact - 0.2, t1 = MN.black;
    const n = S.noise('brown', t0, t1), lp = S.filter('lowpass', 80, 0.5), g = ctx.createGain();
    lp.frequency.setValueAtTime(80, t0); lp.frequency.linearRampToValueAtTime(900, t1);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.5, t0 + 0.8); g.gain.linearRampToValueAtTime(0.9, t1);
    n.connect(lp); lp.connect(g); g.connect(bus);
    const w = S.noise('white', t0 + 0.4, t1), bp = S.filter('bandpass', 1200, 0.4), wg = ctx.createGain();
    wg.gain.setValueAtTime(0, t0 + 0.4); wg.gain.linearRampToValueAtTime(0.12, t1); w.connect(bp); bp.connect(wg); wg.connect(bus);
    for (const [f, v] of [[28, 0.35], [41, 0.2], [55, 0.12]]) { const o = ctx.createOscillator(), og = ctx.createGain(); o.frequency.setValueAtTime(f, t0); o.frequency.linearRampToValueAtTime(f * 0.8, t1);
      og.gain.setValueAtTime(0, t0); og.gain.linearRampToValueAtTime(v, t0 + 1.0); og.gain.setValueAtTime(v, t1); o.connect(og); og.connect(bus); o.start(t0); o.stop(t1 + 0.05); }
  }

  /* the score */
  _score(S, bus, hall) {
    const ctx = S.ctx, rng = new RNG(CONFIG.seed + 61), end = CONFIG.duration;
    const send = ctx.createGain(); send.gain.value = 0.7; send.connect(hall);
    const dry = ctx.createGain(); dry.gain.value = 0.5; dry.connect(bus);
    const lvl = ctx.createGain(); lvl.connect(dry); lvl.connect(send);
    this._lv(lvl.gain, [[0, 0], [0.05, 1.2], [3.8, 1.3], [4.1, 0.0], [5.6, 0.0], [6.4, 0.7], [13, 0.8], [21, 1.0], [30, 1.15], [39, 1.25], [47, 1.35], [55, 1.45], [63, 1.5], [66, 1.2], [70, 0.5], [72.5, 0.12], [74.4, 0.0], [80, 0]], 0.09);
    const Hz = (n) => { const m = /^([A-G])(#|b)?(\d)$/.exec(n), k = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); return 440 * Math.pow(2, (k + (Number(m[3]) - 4) * 12) / 12); };
    // harmony: [from, to, notes, level, filter Hz] — D minor, with dissonance creeping in
    const C = [
      [0.0, 4.1, ['D2', 'A2', 'D3', 'Eb3', 'A3'], 1.0, 1500],          // the cold open: a tense cluster
      [5.4, 13.4, ['D3', 'A3', 'F4', 'C5'], 0.6, 1100],                // wonder: open and soft
      [13.0, 21.4, ['Bb2', 'F3', 'D4', 'A4'], 0.7, 1200],
      [21.0, 30.4, ['G2', 'D3', 'Bb3', 'Eb4', 'A4'], 0.85, 1400],       // dread
      [30.0, 39.4, ['D2', 'A2', 'Eb3', 'A3', 'D4'], 1.0, 1700],
      [39.0, 47.4, ['C2', 'G2', 'Eb3', 'Ab3', 'D4'], 1.0, 1800],
      [47.0, 55.4, ['Db2', 'Ab2', 'D3', 'F3', 'C4'], 1.05, 2000],      // heavy tension
      [55.0, 66.4, ['D2', 'A2', 'Eb3', 'Bb3', 'E4'], 1.1, 2400],
      [66.0, 74.4, ['D2', 'A2', 'D3'], 0.8, 900],                      // stripped back
    ];
    for (const [t0, t1, notes, v, fc] of C) {
      const lp = S.filter('lowpass', fc * 0.6, 0.5), g = ctx.createGain(), fade = Math.min(1.6, (t1 - t0) * 0.25);
      lp.frequency.setValueAtTime(fc * 0.6, t0); lp.frequency.linearRampToValueAtTime(fc, t1);
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + (t0 < 0.1 ? 0.05 : fade)); g.gain.setValueAtTime(v, t1 - fade); g.gain.linearRampToValueAtTime(0, t1);
      lp.connect(g); g.connect(lvl);
      notes.forEach((n, i) => { const f = Hz(n), nv = 0.36 / Math.sqrt(notes.length);
        for (const dc of [-8, 0, 7]) { const o = ctx.createOscillator(), og = ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = dc + rng.range(-2, 2); og.gain.value = nv / 3; o.connect(og); og.connect(lp); o.start(t0); o.stop(t1 + 0.05); } });
    }
    // a low pulse that quickens with the danger (the cold open; 21–70)
    const pulse = (t0, t1, p0, p1, v) => { for (let t = t0; t < t1; ) { const k = (t - t0) / (t1 - t0); S.tone(t, 0.35, 55, v * (0.6 + 0.4 * k), 0, lvl, 'sine', 0.01, 0.3); S.tone(t, 0.25, 110, v * 0.3, 0, lvl, 'sine', 0.01, 0.2); t += MathX.lerp(p0, p1, k); } };
    pulse(0.1, 3.9, 0.42, 0.36, 0.5); pulse(21, 47, 1.1, 0.7, 0.35); pulse(47, 70, 0.7, 0.42, 0.45);
    // glass-like notes for the wonder of the normal evening (5.8–14)
    for (let t = 6.2; t < 14; t += rng.range(0.9, 1.6)) { const f = Hz(rng.pick(['D5', 'A5', 'F5', 'C6', 'E5'])); S.pluck(t, f, 0.25, rng.range(-0.5, 0.5), lvl, 2.2, 0.75); S.tone(t, 2.0, f, 0.05, 0, lvl, 'sine', 0.01, 1.8); }
    // the climax: one enormous low chord swelling with the light, cut off by the black
    { const lp = S.filter('lowpass', 400, 0.5), g = ctx.createGain(); lp.frequency.setValueAtTime(400, MN.impact - 0.1); lp.frequency.linearRampToValueAtTime(2600, MN.black);
      g.gain.setValueAtTime(0, MN.impact - 0.1); g.gain.linearRampToValueAtTime(0.16, MN.black - 0.05); g.gain.linearRampToValueAtTime(0, MN.black); lp.connect(g); g.connect(bus);
      for (const n of ['D1', 'D2', 'A2', 'D3', 'F3', 'A3', 'D4']) for (const dc of [-9, 0, 8]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = Hz(n); o.detune.value = dc; const og = ctx.createGain(); og.gain.value = 0.05; o.connect(og); og.connect(lp); o.start(MN.impact - 0.1); o.stop(MN.black + 0.02); } }
    // a high, thin string held through the countdown (66–74), then gone
    { const o = ctx.createOscillator(), g = ctx.createGain(), lp = S.filter('lowpass', 2500, 0.5); o.type = 'triangle'; o.frequency.value = Hz('A5');
      const vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 5; vg.gain.value = 4; vib.connect(vg); vg.connect(o.frequency);
      g.gain.setValueAtTime(0, 64); g.gain.linearRampToValueAtTime(0.25, 67); g.gain.setValueAtTime(0.25, 71); g.gain.linearRampToValueAtTime(0, 74.2);
      o.connect(lp); lp.connect(g); g.connect(lvl); o.start(64); vib.start(64); o.stop(74.3); vib.stop(74.3); }
  }
}
