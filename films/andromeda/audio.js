/* =====================================================================
   SOUNDTRACK — "What if Andromeda collided with the Milky Way overnight?"
   Space is silent: nothing you hear comes from the galaxies. Two layers,
   kept apart:
     EARTH (diegetic) — what you would really hear on the hilltop: wind,
       crickets, the town's hum and its cars, a far dog, the people around
       you (one notices, then several; phones; car doors and footsteps as
       others walk up; gasps at the passage; hush at the end), your breath.
     SCORE (non-diegetic) — music only: quiet wonder (0–10), a subtle
       cosmic bed (10–30), a larger low texture through the tides and the
       first passage (30–50), thinned right down while the cores separate
       (50–60), one long emotional rise into the merger (60–74), then quiet.
       No literal "galaxy sound", no trailer boom.
   ===================================================================== */

// note names → Hz (A4 = 440)
const amHz = (n) => { const m = /^([A-G])(#|b)?(\d)$/.exec(n), k = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); return 440 * Math.pow(2, (k + (Number(m[3]) - 4) * 12) / 12); };

// the score's harmony (D major / B minor): [from, to, notes, level, filter Hz]
const AM_CHORDS = [
  // quiet wonder: an open fifth, then the first colour
  [0.4, 10.5, ['D3', 'A3', 'E4'], 0.55, 900],
  [10.0, 20.5, ['D3', 'A3', 'F#4', 'C#5'], 0.7, 1100],
  [20.0, 30.5, ['B2', 'F#3', 'D4', 'A4'], 0.75, 1200],
  // tides and the first passage: lower, wider, slowly opening
  [30.0, 39.6, ['G2', 'D3', 'B3', 'F#4'], 0.95, 1300],
  [39.4, 45.0, ['E2', 'B2', 'G3', 'D4', 'F#4'], 1.15, 1700],
  [44.6, 50.4, ['G2', 'D3', 'A3', 'E4'], 1.0, 1400],
  // separation: almost nothing
  [50.0, 60.4, ['D4', 'A4'], 0.35, 1000],
  // the return and the merger: the long rise
  [59.8, 64.0, ['B2', 'F#3', 'D4', 'A4'], 0.8, 1300],
  [63.6, 67.4, ['G2', 'D3', 'B3', 'F#4', 'A4'], 1.05, 1800],
  [67.0, 70.6, ['D3', 'A3', 'F#4', 'A4', 'D5'], 1.3, 2400],
  [70.2, 74.4, ['A2', 'E3', 'C#4', 'E4', 'A4'], 1.5, 3000],
  // a new sky: resolved, quiet
  [74.0, 81.0, ['D3', 'A3', 'F#4', 'E5'], 0.75, 1400],
];

class AmAudio extends AudioEngine {
  constructor(tl, app) {
    super(tl);
    this.app = app;
    this.wavName = SCRIPT.meta.wav;
  }

  fingerprintData() { return [AM_PEOPLE, AM_CHORDS]; }   // (the sound depends on the people and the score, not on the sky)

  async renderOffline() { const buf = await super.renderOffline(); AudioEngine.declick(buf, 0.15); return buf; }

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
    S.gasp = (t, vol, dest) => {
      const n = S.noise('pink', t, t + 0.9), bp = S.filter('bandpass', 900, 0.8), g = ctx.createGain();
      bp.frequency.setValueAtTime(700, t); bp.frequency.linearRampToValueAtTime(2200, t + 0.5);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.1); g.gain.linearRampToValueAtTime(vol * 0.7, t + 0.4); g.gain.linearRampToValueAtTime(0, t + 0.8);
      n.connect(bp); bp.connect(g); g.connect(dest);
    };
    // mix → make-up gain → glue compressor → limiter
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 2.5; comp.attack.value = 0.01; comp.release.value = 0.3;
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -2.5; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.12;
    const mixIn = ctx.createGain(); mixIn.gain.value = 11.0; mixIn.connect(comp);
    const out = ctx.createGain(); comp.connect(out); out.connect(lim); lim.connect(ctx.destination);
    out.gain.setValueAtTime(0.0001, 0); out.gain.linearRampToValueAtTime(0.9, 0.08);
    out.gain.setValueAtTime(0.9, end - 0.6); out.gain.linearRampToValueAtTime(0.0001, end);
    // EARTH: the hilltop, with an open-air reflection; YOU: your own breath; SCORE: the music, in a long hall
    const earth = ctx.createGain(); earth.gain.value = 1; earth.connect(mixIn);
    const air = S.reverb(1.6), as = ctx.createGain(); as.gain.value = 0.3; air.connect(as); as.connect(earth);
    const you = ctx.createGain(); you.gain.value = 1; you.connect(mixIn);
    const score = ctx.createGain(); score.connect(mixIn);
    const hall = S.reverb(4.5), hs = ctx.createGain(); hs.gain.value = 0.55; hall.connect(hs); hs.connect(score);
    this.S = S; this.air = air; this.hall = hall;
    this._night(S, earth, air);
    this._town(S, earth, air);
    const ppl = ctx.createGain(); ppl.gain.value = 2.5; ppl.connect(earth);      // (voices sit up in the mix)
    this._people(S, ppl, air);
    you.gain.value = 1.5;
    this._you(S, you);
    this._score(S, score, hall);
  }

  // distance gain and pan of a world point (x, z) at time t, heard from where you stand
  _at(x, z, t, ref = 6) {
    const lx = this.cx.value(t), lz = this.cz.value(t), yaw = MathX.deg(this.cyaw.value(t));
    const dx = x - lx, dz = z - lz, d = Math.max(0.6, Math.hypot(dx, dz)), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    return { g: ref / (ref + d), pan: MathX.clamp((dx * rx + dz * rz) / d, -1, 1) * 0.8, d };
  }
  _person(id) { return AM_PEOPLE.find((p) => p[0] === id); }
  // where a cast member stands at time t (their path, held at the ends)
  _where(id, t) {
    const P = this._person(id)[2];
    if (t <= P[0][0] || P.length === 1) return { x: P[0][1], z: P[0][2] };
    for (let i = 1; i < P.length; i++) if (t <= P[i][0]) { const f = (t - P[i - 1][0]) / (P[i][0] - P[i - 1][0]); return { x: MathX.lerp(P[i - 1][1], P[i][1], f), z: MathX.lerp(P[i - 1][2], P[i][2], f) }; }
    const L = P[P.length - 1]; return { x: L[1], z: L[2] };
  }

  /* the night itself: wind over the hilltop in slow gusts, crickets in the grass (they fall quiet as the crowd grows, and
     come back at the end), the rustle of the trees */
  _night(S, bus, rev) {
    const ctx = S.ctx, end = CONFIG.duration + 0.5;
    // wind: two bands of pink noise, gusting slowly, the high band hissing through the grass and trees
    for (const [f, q, v, seed] of [[320, 0.6, 0.05, 3], [1900, 0.5, 0.012, 7]]) {
      const n = S.noise('pink', 0, end), bp = S.filter('bandpass', f, q), g = ctx.createGain(), p = ctx.createStereoPanner();
      g.gain.setValueAtTime(0, 0);
      for (let t = 0; t <= end; t += 0.25) {
        const gust = 0.55 + 0.45 * fbm1(t * 0.13, seed) + 0.25 * MathX.smooth(t, 30, 44) * (1 - MathX.smooth(t, 50, 58));
        g.gain.linearRampToValueAtTime(v * Math.max(0.15, gust), t);
        p.pan.linearRampToValueAtTime(0.5 * fbm1(t * 0.05, seed + 1), t);
        bp.frequency.linearRampToValueAtTime(f * (0.85 + 0.3 * gust), t);
      }
      n.connect(bp); bp.connect(g); g.connect(p); p.connect(bus);
    }
    // crickets: several in the grass, each a pulse train of 3–4 chirps repeating; quiet from 38 s while people talk loudly, back by 75 s
    const rng = new RNG(CONFIG.seed + 21), level = (t) => 1 - 0.85 * MathX.smooth(t, 34, 40) * (1 - MathX.smooth(t, 72, 76));
    for (let c = 0; c < 6; c++) {
      const f = rng.range(4300, 5200), pan = rng.range(-0.9, 0.9), v = rng.range(0.0035, 0.007), per = rng.range(0.55, 0.9), n = rng.int(3, 4);
      for (let t = rng.range(0, 1); t < end; t += per * rng.range(0.92, 1.08)) {
        if (rng.chance(0.12)) { t += rng.range(0.6, 2.2); continue; }
        for (let k = 0; k < n; k++) S.tone(t + k * 0.045, 0.028, f, v * level(t), pan, bus, 'sine', 0.006, 0.02);
      }
    }
    // the trees behind you: a soft leafy rustle with the stronger gusts
    for (let t = 2.5; t < end; t += rng.range(3, 6)) {
      const n = S.noise('white', t, t + 2.2), hp = S.filter('bandpass', 3800, 0.6), g = ctx.createGain(), v = rng.range(0.004, 0.009);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.8); g.gain.linearRampToValueAtTime(0, t + 2.1);
      n.connect(hp); hp.connect(g); g.connect(S.panned(rev, rng.range(-0.6, 0.6)));
    }
  }

  /* the town below: a low hum, cars on the valley roads that pull over and stop as people notice (13–19 s), a dog that
     won't settle, a car alarm set off far away, and a church clock striking the hour */
  _town(S, bus, rev) {
    const ctx = S.ctx, end = CONFIG.duration + 0.5, rng = new RNG(CONFIG.seed + 33);
    const hum = S.noise('brown', 0, end), lp = S.filter('lowpass', 180, 0.6), g = ctx.createGain();
    g.gain.setValueAtTime(0.03, 0); g.gain.setValueAtTime(0.03, 14); g.gain.linearRampToValueAtTime(0.018, 20); hum.connect(lp); lp.connect(g); g.connect(bus);
    // distant cars: a swell of tyre noise and engine across the valley
    const car = (t, dur, pan0, pan1, v) => {
      const n = S.noise('pink', t, t + dur), bp = S.filter('bandpass', 420, 0.7), cg = ctx.createGain(), p = ctx.createStereoPanner();
      cg.gain.setValueAtTime(0, t); cg.gain.linearRampToValueAtTime(v, t + dur * 0.45); cg.gain.linearRampToValueAtTime(0, t + dur);
      p.pan.setValueAtTime(pan0, t); p.pan.linearRampToValueAtTime(pan1, t + dur);
      n.connect(bp); bp.connect(cg); cg.connect(p); p.connect(rev);
      const o = ctx.createOscillator(), og = ctx.createGain(), ol = S.filter('lowpass', 300, 0.7); o.type = 'sawtooth'; o.frequency.setValueAtTime(rng.range(48, 70), t); o.frequency.linearRampToValueAtTime(rng.range(55, 80), t + dur);
      og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(v * 0.25, t + dur * 0.45); og.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(ol); ol.connect(og); og.connect(p); o.start(t); o.stop(t + dur + 0.05);
    };
    for (let t = 0.2; t < 13.5; t += rng.range(2.2, 4.0)) { const s = rng.chance(0.5) ? 1 : -1; car(t, rng.range(4, 6), -0.7 * s, 0.7 * s, rng.range(0.03, 0.05)); }
    // …one brakes and stops; a horn, then the valley goes still
    car(14.0, 3.0, 0.4, 0.1, 0.04);
    S.horn(16.8, 349, 415, 0.0035, 0.2, rev);
    // a dog in the town, unsettled by the crowd and the light; a second answers later
    const bark = (t, pan, v, f0 = 520) => {
      for (let k = 0, n = rng.int(2, 4); k < n; k++) {
        const tt = t + k * rng.range(0.28, 0.42), o = ctx.createOscillator(), og = ctx.createGain(), bp = S.filter('bandpass', 900, 1.4);
        o.type = 'sawtooth'; o.frequency.setValueAtTime(f0 * rng.range(0.9, 1.1), tt); o.frequency.linearRampToValueAtTime(f0 * 0.6, tt + 0.12);
        S.env(og, tt, 0.008, v, 0.12); o.connect(bp); bp.connect(og); og.connect(S.panned(rev, pan)); o.start(tt); o.stop(tt + 0.2);
      }
    };
    for (const [t, pan, v, f] of [[9.4, -0.5, 0.012, 520], [11.2, -0.5, 0.01, 520], [31.5, 0.6, 0.012, 600], [33.0, -0.5, 0.012, 520], [43.4, -0.4, 0.016, 520],
      [44.6, 0.6, 0.014, 600], [47.8, -0.5, 0.01, 520], [61.2, 0.5, 0.014, 600], [64.5, -0.4, 0.016, 520], [68.8, 0.6, 0.012, 600], [77.0, -0.5, 0.007, 520]]) bark(t, pan, v, f);
    // a car alarm far off in the valley through the passage
    { const t0 = 44.2, t1 = 52.5, o = ctx.createOscillator(), og = ctx.createGain(), ol = S.filter('lowpass', 1500, 0.7); o.type = 'square';
      for (let t = t0; t < t1; t += 0.42) o.frequency.setValueAtTime((Math.floor((t - t0) / 0.42) % 2 ? 1050 : 800), t);
      og.gain.setValueAtTime(0, t0); og.gain.linearRampToValueAtTime(0.0022, t0 + 0.2); og.gain.setValueAtTime(0.0022, t1 - 0.3); og.gain.linearRampToValueAtTime(0, t1);
      o.connect(ol); ol.connect(og); og.connect(S.panned(rev, -0.3)); o.start(t0); o.stop(t1); }
    // the church clock in the town strikes one, late in the night
    for (let k = 0; k < 2; k++) {
      const t = 53.4 + k * 2.4;
      for (const [m, v] of [[1, 0.012], [2.4, 0.005], [3.0, 0.004], [4.2, 0.002]]) S.tone(t, 3.2, 196 * m, v, 0.35, rev, 'sine', 0.006, 3.0);
    }
  }

  /* the people around you: their voices (murmured, at a distance — the words don't matter), phones, car doors, footsteps.
     Reactions build: one, then several, then everyone; gasps at the passage; a shout as it comes back; a hush at the end. */
  _people(S, bus, rev) {
    const ctx = S.ctx, rng = new RNG(CONFIG.seed + 47);
    // a short spoken phrase: syllables with a natural fall, from a person at their place
    const say = (id, t, n, f0, v = 0.02, rise = false) => {
      const w = this._where(id, t), a = this._at(w.x, w.z, t, 5), P = S.panned(bus, a.pan), R = S.panned(rev, a.pan);
      let tt = t;
      for (let k = 0; k < n; k++) {
        const d = rng.range(0.09, 0.22), f = f0 * (rise && k === n - 1 ? 1.25 : 1 - 0.05 * k) * rng.range(0.95, 1.06);
        S.voice(tt, f, d, rng.pick(['a', 'o', 'e', 'u', 'a', 'i']), v * a.g * rng.range(0.7, 1), 0, P, rng.range(0.85, 1.1));
        S.voice(tt, f, d, 'a', v * a.g * 0.25, 0, R, 1);
        tt += d + rng.range(0.03, 0.1);
      }
    };
    // one long word of wonder: "whoa", "wow" — a glide
    const wow = (id, t, f0, v = 0.025, d = 0.7) => {
      const w = this._where(id, t), a = this._at(w.x, w.z, t, 5), P = S.panned(bus, a.pan);
      S.voice(t, f0, d, 'o', v * a.g, 0, P, 0.72); S.voice(t, f0, d, 'u', v * a.g * 0.3, 0, S.panned(rev, a.pan), 0.72);
    };
    const gasp = (id, t, v = 0.05) => { const w = this._where(id, t), a = this._at(w.x, w.z, t, 5); S.gasp(t, v * a.g, S.panned(bus, a.pan)); };
    const men = { A: 0, B: 1, C: 0, D: 1, E: 0, F: 1, G: 0, H: 1, I: 0 }, f0 = (id) => (men[id] ? 125 : 215) * (1 + 0.04 * (id.charCodeAt(0) % 3));

    // 0–5: the evening: a quiet word or two
    say('B', 1.2, 3, f0('B'), 0.012); say('A', 2.6, 2, f0('A'), 0.01);
    // 5.6 she notices; 7.6 points; others turn
    wow('A', 5.7, f0('A') * 1.25, 0.03, 0.8);
    say('A', 7.4, 4, f0('A') * 1.1, 0.026, true);
    say('B', 8.6, 3, f0('B'), 0.02);
    wow('C', 9.0, f0('C') * 1.2, 0.022);
    say('D', 10.6, 4, f0('D'), 0.018);
    // the jogger stops, breathing hard
    { const w = this._where('E', 9.5); for (let k = 0; k < 6; k++) { const t = 9.6 + k * 0.62, a = this._at(w.x, w.z, t, 5); S.breath(t, 0.3, k % 2 === 0, 0.03 * a.g * (1 - k * 0.1), S.panned(bus, a.pan)); } }
    // 15–20: phones come up: camera clicks, the chirp of video starting
    for (const [id, t] of [['A', 16.1], ['B', 16.9], ['E', 17.3], ['C', 18.4], ['B', 19.2], ['A', 21.5], ['E', 23.2], ['G', 35.0]]) {
      const w = this._where(id, t), a = this._at(w.x, w.z, t, 4);
      S.tone(t, 0.07, 1320, 0.012 * a.g, a.pan, bus, 'sine', 0.006, 0.05); S.tone(t + 0.09, 0.09, 1760, 0.012 * a.g, a.pan, bus, 'sine', 0.006, 0.06);
      for (let k = 0; k < 2; k++) S.click(t + 0.4 + k * rng.range(0.3, 0.8), 0.04 * a.g, a.pan, bus);
    }
    // murmurs building through the scale and science beats
    for (let t = 12.5; t < 38; t += rng.range(0.8, 2.0) * (t < 26 ? 1.3 : 0.9)) {
      const id = rng.pick(['A', 'B', 'C', 'D', 'E', ...(t > 33 ? ['F', 'G'] : []), 'H', 'I']);
      say(id, t, rng.int(2, 5), f0(id), rng.range(0.008, 0.015) * (1 + MathX.smooth(t, 26, 38)));
    }
    // 22–34: two more drive up from the town; car doors in the lot behind you, then their footsteps on the gravel path
    for (const [t, x] of [[22.3, -0.6], [23.1, 1.2], [23.9, 1.4]]) { const a = this._at(x, 24, t, 6); S.clunk(t, 0.12 * a.g, a.pan, bus); S.clunk(t, 0.05 * a.g, a.pan, rev); }
    for (const [id, t0, t1] of [['F', 22.0, 33.5], ['G', 23.5, 34.5]]) {
      for (let t = t0 + 0.2, k = 0; t < t1; t += 0.56, k++) {
        const w = this._where(id, t), a = this._at(w.x, w.z, t, 4), n = S.noise('white', t, t + 0.12), bp = S.filter('bandpass', 2400 + rng.range(-400, 400), 0.9), g = ctx.createGain();
        S.env(g, t, 0.004, 0.05 * a.g, 0.07); n.connect(bp); bp.connect(g); g.connect(S.panned(bus, a.pan));
      }
    }
    say('F', 30.2, 4, f0('F'), 0.02); say('G', 31.4, 3, f0('G'), 0.018);
    // a nervous laugh as the band bends
    { const w = this._where('B', 33.6), a = this._at(w.x, w.z, 33.6, 5); S.laugh(33.6, 0.012 * a.g, a.pan, bus, 190, 4); }
    // 39–49: the first passage — everyone at once, then gasps as the core sweeps overhead
    for (let t = 39.6; t < 42.4; t += rng.range(0.25, 0.6)) { const id = rng.pick(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']); say(id, t, rng.int(2, 4), f0(id) * 1.1, rng.range(0.016, 0.026)); }
    for (const [id, dt] of [['C', 0], ['A', 0.08], ['D', 0.2], ['F', 0.26], ['G', 0.12], ['B', 0.35], ['E', 0.3], ['H', 0.5], ['I', 0.55]]) gasp(id, 42.7 + dt, 0.07);
    wow('B', 44.0, f0('B') * 1.15, 0.03, 1.0); say('E', 44.6, 4, f0('E') * 1.2, 0.03, true); wow('A', 45.6, f0('A') * 1.2, 0.025, 0.9);
    for (let t = 46.2; t < 49.4; t += rng.range(0.6, 1.2)) { const id = rng.pick(['A', 'B', 'D', 'F', 'G', 'H']); say(id, t, rng.int(2, 4), f0(id), rng.range(0.01, 0.016)); }
    // 49–57: it goes quiet; a few low words
    say('D', 51.0, 3, f0('D') * 0.95, 0.012); say('F', 54.6, 4, f0('F'), 0.011);
    // 57.3: someone sees it coming back up — a shout, the crowd answers
    say('H', 57.3, 3, f0('H') * 1.35, 0.045, true);
    for (const [id, dt] of [['A', 0.5], ['I', 0.6], ['B', 0.75], ['G', 0.8]]) gasp(id, 57.4 + dt, 0.05);
    // 60–72: the merger — the crowd loud, overlapping, then pointing and calling
    for (let t = 59.0; t < 72; t += rng.range(0.22, 0.5) * (t < 64 ? 1.2 : 0.85)) {
      const id = rng.pick(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']);
      say(id, t, rng.int(2, 5), f0(id) * rng.range(1.0, 1.2), rng.range(0.012, 0.024) * (0.8 + 0.4 * MathX.smooth(t, 60, 70)));
    }
    say('G', 66.1, 4, f0('G') * 1.25, 0.035, true);
    // 72.5–80: hush; one long "wow"; somebody breathes out
    wow('D', 74.2, f0('D') * 1.1, 0.03, 1.2);
    { const w = this._where('A', 76.4), a = this._at(w.x, w.z, 76.4, 5); S.breath(76.4, 1.6, false, 0.04 * a.g, S.panned(bus, a.pan)); }
    say('B', 77.6, 2, f0('B') * 0.95, 0.009);
  }

  /* you: slow breathing, a sharp breath at the passage and when it comes back, held, then a long breath out at the end */
  _you(S, bus) {
    const marks = [[42.6, 'gasp'], [57.3, 'gasp']];
    for (let t = 1.0; t < CONFIG.duration - 1; ) {
      const hold = (t > 43.2 && t < 47.5) || (t > 70.0 && t < 74.4), fast = t > 39 && t < 50 || t > 60 && t < 70;
      if (marks.some(([m]) => Math.abs(t - m) < 0.9) || hold) { t += 0.5; continue; }
      const p = fast ? 2.7 : 4.0, v = fast ? 0.026 : 0.018;
      S.breath(t, p * 0.4, true, v, bus); S.breath(t + p * 0.45, p * 0.45, false, v * 0.8, bus);
      t += p;
    }
    for (const [t] of marks) S.gasp(t, 0.06, bus);
    S.breath(47.6, 2.4, false, 0.04, bus);
    S.breath(74.6, 3.2, false, 0.05, bus);
  }

  /* the score: soft pads (detuned saws under a slowly opening filter), glass-like notes that drift in the hall, a sub drone
     for the tides and the passage, a heartbeat-slow pulse into the merger. No hits on events — the music breathes with them. */
  _score(S, bus, hall) {
    const ctx = S.ctx, rng = new RNG(CONFIG.seed + 61), end = CONFIG.duration + 0.5;
    const send = ctx.createGain(); send.gain.value = 0.7; send.connect(hall);
    const dry = ctx.createGain(); dry.gain.value = 0.55; dry.connect(bus);
    // overall shape of the score: [t, level]
    const shape = [[0, 0.0], [0.6, 1.2], [10, 1.3], [30, 1.4], [39, 1.5], [44, 1.6], [49, 1.4], [51, 0.7], [59, 0.7], [62, 1.2], [70, 1.8], [73.6, 2.0], [75, 1.3], [79.5, 0.9], [80.3, 0]];
    const lvl = ctx.createGain(); lvl.gain.setValueAtTime(0, 0); for (const [t, v] of shape) lvl.gain.linearRampToValueAtTime(v * 0.09, t);
    lvl.connect(dry); lvl.connect(send);
    // pads: each chord's notes as three detuned saws through a low-pass that opens with the chord, with long cross-fades
    for (const [t0, t1, notes, v, fc] of AM_CHORDS) {
      const lp = S.filter('lowpass', fc * 0.6, 0.5), g = ctx.createGain(), fade = Math.min(2.2, (t1 - t0) * 0.3);
      lp.frequency.setValueAtTime(fc * 0.6, t0); lp.frequency.linearRampToValueAtTime(fc, t0 + (t1 - t0) * 0.7);
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + fade); g.gain.setValueAtTime(v, t1 - fade); g.gain.linearRampToValueAtTime(0, t1);
      lp.connect(g); g.connect(lvl);
      notes.forEach((n, i) => {
        const f = amHz(n), nv = 0.34 / Math.sqrt(notes.length) * (i === 0 ? 1.2 : 1);
        for (const dc of [-7, 0, 6]) {
          const o = ctx.createOscillator(), og = ctx.createGain(), p = ctx.createStereoPanner();
          o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = dc + rng.range(-2, 2);
          og.gain.value = nv / 3; p.pan.value = MathX.clamp(dc / 10 + (i - notes.length / 2) * 0.12, -0.8, 0.8);
          o.connect(og); og.connect(p); p.connect(lp); o.start(t0); o.stop(t1 + 0.05);
        }
      });
    }
    // glass notes: high, sparse, drifting (the wonder), from the chord of the moment; sparser while the cores separate
    const chordAt = (t) => { let c = AM_CHORDS[0]; for (const k of AM_CHORDS) if (t >= k[0]) c = k; return c; };
    for (let t = 1.2; t < 78; ) {
      const c = chordAt(t), n = rng.pick(c[2]), f = amHz(n) * (rng.chance(0.5) ? 2 : 4);
      const v = 0.32 * (t < 10 ? 1 : t < 50 ? 0.8 : t < 60 ? 1.1 : 0.7);
      S.pluck(t, Math.min(f, 2400), v, rng.range(-0.6, 0.6), lvl, 2.4, 0.75);
      S.tone(t, 2.2, Math.min(f, 2400), v * 0.18, 0, lvl, 'sine', 0.01, 2.0);
      t += (t < 10 ? rng.range(1.0, 1.8) : t < 30 ? rng.range(1.4, 2.6) : t < 50 ? rng.range(2.0, 3.4) : t < 60 ? rng.range(1.6, 2.6) : t < 74 ? rng.range(0.9, 1.6) : rng.range(1.2, 2.0));
    }
    // the low texture: a sub drone on D/B/G, swelling through the tides and the passage, gone during the separation, back for the merger
    const sub = [[0, 0], [26, 0], [32, 0.6], [39.5, 1.0], [45, 1.2], [49.5, 0.8], [52, 0.0], [60, 0.0], [64, 0.6], [70, 1.1], [73.8, 1.25], [76, 0.35], [80.3, 0]];
    for (const [f, v] of [[36.71, 1.0], [73.42, 0.4]]) {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, 0); for (const [t, k] of sub) g.gain.linearRampToValueAtTime(k * v * 0.08, t);
      // (it moves down to B for the first passage, up to G after it, to A into the merger, and home to D)
      for (const det of [1, 1.004]) {
        const o = ctx.createOscillator(), F = o.frequency; o.type = 'sine';
        F.setValueAtTime(f * det, 0);
        for (const [t, r] of [[39.2, 1], [40.0, 0.8409], [44.4, 0.8409], [45.4, 1.3348], [69.8, 1.3348], [70.6, 1.4983], [73.8, 1.4983], [74.6, 1]]) F.linearRampToValueAtTime(f * det * r, t);
        o.connect(g); o.start(0); o.stop(end);
      }
      g.connect(lvl);
    }
    // a slow pulse under the return and the merger (like a held breath, quickening)
    for (let t = 60.5; t < 73.6; ) { const k = MathX.smooth(t, 60.5, 73); S.tone(t, 0.5, 73.4, 0.12 * (0.4 + 0.6 * k), 0, lvl, 'sine', 0.02, 0.45); S.tone(t, 0.4, 146.8, 0.07 * (0.4 + 0.6 * k), 0, lvl, 'sine', 0.02, 0.35); t += MathX.lerp(1.05, 0.55, k); }
    // a high, held string for the separation (the quiet after the passage)
    { const o = ctx.createOscillator(), g = ctx.createGain(), lp = S.filter('lowpass', 2200, 0.5); o.type = 'triangle'; o.frequency.value = amHz('A5');
      const vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 4.8; vg.gain.value = 3; vib.connect(vg); vg.connect(o.frequency);
      g.gain.setValueAtTime(0, 50); g.gain.linearRampToValueAtTime(0.18, 53); g.gain.setValueAtTime(0.18, 58); g.gain.linearRampToValueAtTime(0, 61);
      o.connect(lp); lp.connect(g); g.connect(lvl); o.start(50); vib.start(50); o.stop(61.1); vib.stop(61.1); }
  }
}
