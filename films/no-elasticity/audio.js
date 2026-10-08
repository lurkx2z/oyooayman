/* =====================================================================
   AUDIO — the soundtrack, synthesised and rendered offline (js/audio/audioEngine.js).
   Every cue is at an ABSOLUTE STORY TIME (the 1/3-speed crash is slowed with the picture by Edit.spliceAudio,
   which drops it in pitch too). Bake it when the film is final:
     NODE_PATH=$(npm root -g) node tools/bake-soundtrack.cjs --page no-elasticity.html --out films/no-elasticity/soundtrack.js
   The idea of the mix: the sounds of things springing back go missing. The ball's ring, the racket's ping, the
   trampoline's boing, a rubber band's snap, a car's bounce: each one is replaced by a dull, final thud. What is
   left is thudding (springs that stay down), scraping (cars on their bump stops), groaning steel and, at the end,
   one crash that doesn't rebound.
   ===================================================================== */

class NeAudio extends AudioEngine {
  constructor(tl, app) { super(tl); this.app = app; this.wavName = SCRIPT.meta.wav; }
  // anything the sound depends on that is not inside SCRIPT (so a stale baked copy is detected)
  fingerprintData() { return [NE, NE_WALKERS.map((w) => [w.tm, w.v, w.dz]), NE_CRASH.tv, NE_TAP, NE_BALL, NE_RACKET, NE_SHOE]; }

  _build(ctx) {
    const S = new SoundKit(ctx, CONFIG.seed), T = NE, END = CONFIG.duration + 1.4, app = this.app, TR = app.traffic;
    // offline-safe envelopes (Chrome's offline renderer clicks on very short exponential ramps)
    S.env = (g, t, a, peak, d) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(Math.max(0.0002, peak), t + Math.max(a, 0.006)); g.gain.setTargetAtTime(0, t + Math.max(a, 0.006), Math.max(0.004, d / 4)); };
    const tone = S.tone.bind(S);
    S.tone = (t, dur, f, vol, pan, dest, type = 'sine', attack = 0.01, release = null) => tone(t, dur, f, vol, pan, dest, type, Math.max(attack, 0.006), release);

    // mix chain: buses → compressor → out → limiter
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -2.5; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.12;
    // a soft clip after the limiter (it lets the crash's first milliseconds through): nothing above ≈ −1.3 dBFS
    { const sc = ctx.createWaveShaper(), N = 2049, c = new Float32Array(N);
      for (let i = 0; i < N; i++) { const x = i / (N - 1) * 2 - 1, a = Math.abs(x); c[i] = a < 0.6 ? x : Math.sign(x) * (0.6 + 0.26 * Math.tanh((a - 0.6) / 0.26)); }
      sc.curve = c; lim.connect(sc); sc.connect(ctx.destination); }
    const out = ctx.createGain(); out.gain.value = 1.0; out.connect(lim);
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -15; comp.knee.value = 8; comp.ratio.value = 3.5; comp.connect(out);
    const mix = ctx.createGain(); mix.gain.value = 2.3; mix.connect(comp);
    const rev = S.reverb(2.2), revG = ctx.createGain(); revG.gain.value = 0.22; rev.connect(revG); revG.connect(mix);
    const bus = (g) => { const b = ctx.createGain(); b.gain.value = g; b.connect(mix); return b; };
    const amb = bus(0.75), you = bus(0.8), mus = bus(0.42), fx = bus(1.0), cars = bus(0.9);
    // a short dip of the bed and the music just before each dead hit, so the thud lands in a small silence
    { const dk = ctx.createGain(); dk.connect(mix); for (const b of [amb, mus]) { b.disconnect(); b.connect(dk); }
      const hits = [[neBallTimes().tc4, 0.75], [T.land, 0.6], [38.85, 0.55], [NE.tap, 0.6]].sort((a, b) => a[0] - b[0]);
      dk.gain.setValueAtTime(1, 0);
      for (const [t, d] of hits) { dk.gain.setValueAtTime(1, t - 0.35); dk.gain.linearRampToValueAtTime(1 - d, t - 0.03); dk.gain.setValueAtTime(1 - d, t + 0.08); dk.gain.linearRampToValueAtTime(1, t + 0.6); } }
    const R = (a, b) => S.rng.range(a, b);
    const env = (g, t, a, peak, d) => S.env(g, t, a, peak, d);
    const pan = (dest, p) => S.panned(dest, MathX.clamp(p, -0.95, 0.95));

    // where a sound at (x, z) is for you at time t (gain falls with distance; pan from your heading)
    const place = (x, z, t, ref = 6) => {
      const lx = this.cx.value(t), lz = this.cz.value(t), yaw = MathX.deg(this.cyaw.value(t)), dx = x - lx, dz = z - lz, d = Math.max(0.6, Math.hypot(dx, dz));
      return { g: ref / (ref + d), pan: MathX.clamp((dx * Math.cos(yaw) - dz * Math.sin(yaw)) / d, -1, 1) * 0.8, d };
    };
    // a short filtered-noise burst (the building block of slaps, scrapes, rustles)
    const burst = (t, dur, type, f, q, vol, p, dest, a = 0.003) => {
      const n = S.noise(type, t, t + dur + 0.2), b = S.filter(f > 0 ? 'bandpass' : 'lowpass', Math.abs(f), q), g = ctx.createGain();
      env(g, t, a, vol, dur); n.connect(b); b.connect(g); g.connect(pan(dest, p)); return g;
    };
    // a low "dead" thud: what a bounce sounds like when nothing springs back (no ring, no tail)
    const thud = (t, vol, p, dest, f0 = 120, f1 = 55, len = 0.12) => {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + len);
      env(g, t, 0.003, vol, len); o.connect(g); g.connect(pan(dest, p)); o.start(t); o.stop(t + len * 3 + 0.05);
      burst(t, len * 0.6, 'pink', 420, 0.8, vol * 0.6, p, dest, 0.002);
    };
    // a creak / groan: a slow pitch-sagging tone through a resonant band (steel and springs giving way)
    const groan = (t, dur, f, vol, p, dest, drop = 0.7) => {
      const o = ctx.createOscillator(), o2 = ctx.createOscillator(), bp = S.filter('bandpass', f * 3, 2.5), g = ctx.createGain();
      o.type = 'sawtooth'; o2.type = 'sawtooth'; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * drop, t + dur); o2.frequency.setValueAtTime(f * 1.013, t); o2.frequency.linearRampToValueAtTime(f * drop * 1.02, t + dur);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.25); g.gain.linearRampToValueAtTime(vol * 0.7, t + dur * 0.7); g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(bp); o2.connect(bp); bp.connect(g); g.connect(pan(dest, p)); o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
      const s = ctx.createGain(); s.gain.value = 0.4; g.connect(s); s.connect(rev);
    };

    // 1. a sunny afternoon: the city bed, a few birds in the plaza trees; it thins out as the street gives up
    const bed = (type, f, q, vol) => { const n = S.noise(type, 0, END), b = S.filter('lowpass', f, q), g = ctx.createGain(); g.gain.value = vol; n.connect(b); b.connect(g); g.connect(amb); };
    bed('brown', 300, 0.7, 0.16); bed('pink', 1600, 0.5, 0.06);
    amb.gain.setValueAtTime(0.75, 0); amb.gain.linearRampToValueAtTime(0.75, 52.4); amb.gain.linearRampToValueAtTime(0.12, 53.1); amb.gain.setValueAtTime(0.12, T.crash); amb.gain.linearRampToValueAtTime(0.35, T.crash + 0.3);   // a held breath before the hit
    amb.gain.setValueAtTime(0.35, 57); amb.gain.linearRampToValueAtTime(0.5, 60); amb.gain.linearRampToValueAtTime(0.0, T.end + 0.3);
    for (let t = 0.6; t < 50; t += R(1.6, 4.2)) S.chirp(t, R(2600, 4200), R(0.012, 0.025), R(0.1, 0.6), amb, false);

    // 2. your footsteps (from the camera's walk)
    { const xT = new Track(SCRIPT.camera.x), zT = new Track(SCRIPT.camera.z);
      let walked = 0, next = 0.66, px = xT.value(0), pz = zT.value(0);
      for (let t = 0; t < CONFIG.duration; t += 1 / 60) {
        const x = xT.value(t), z = zT.value(t); walked += Math.hypot(x - px, z - pz); px = x; pz = z;
        if (walked >= next) { S.step(t, 0.18, (Math.round(next / 0.66) % 2 ? 0.12 : -0.12), you); next += 0.66; }
      } }

    // 3. the dribble: a solid rubber ball's bright "thock" (it rings a little: elastic), then the bounce that dies, then the dead thud
    { const tb = NE_TEEN, D = T.dribble;
      for (let k = 0; k < 4; k++) {
        const tc = D.t0 + (k + 0.5) * D.P, weak = k === 3; if (tc < 0.02) continue; const P = place(tb.x, tb.z, tc, 5);
        thud(tc, (weak ? 0.5 : 0.75) * P.g * 2.2, P.pan, fx, weak ? 150 : 210, 70, 0.08);
        if (!weak) { S.tone(tc, 0.35, 640, 0.05 * P.g * 2, P.pan, fx, 'sine', 0.002, 0.3); S.tone(tc, 0.25, 1190, 0.025 * P.g * 2, P.pan, fx, 'sine', 0.002, 0.2); }
      }
      // the landing that doesn't bounce (≈ 2.23): flat, short, final
      const tl = neBallTimes().tc4, P = place(tb.x, tb.z, tl, 5);
      thud(tl, 0.9 * P.g * 2.2, P.pan, fx, 110, 48, 0.1);
      burst(T.poke + 0.2, 0.18, 'pink', 380, 1.2, 0.05, P.pan, fx, 0.02);            // the hand pressing on it (a soft squeak of rubber)
    }

    // 4. the rule bites: a low hit and a sound like a string going slack (a falling, de-tuning tone)
    S.thump(T.rule[0] + 0.12, 0.45, fx);
    for (const [f, v] of [[196, 0.06], [293.7, 0.04], [392, 0.025]]) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(f, T.rule[0]); o.frequency.exponentialRampToValueAtTime(f * 0.5, T.rule[1] + 0.4);
      g.gain.setValueAtTime(0, T.rule[0]); g.gain.linearRampToValueAtTime(v, T.rule[0] + 0.25); g.gain.linearRampToValueAtTime(0, T.rule[1] + 0.6);
      o.connect(g); g.connect(mus); o.start(T.rule[0]); o.stop(T.rule[1] + 0.7);
    }

    // 5. the montage (close-ups: loud, centred)
    { // racket: a whoosh, then a dull "thup" where the "ping" should be; the ball drops onto the paving, dead
      const n = S.noise('pink', NE_RACKET.hit - 0.35, NE_RACKET.hit + 0.05), bp = S.filter('bandpass', 900, 0.9), g = ctx.createGain();
      g.gain.setValueAtTime(0, NE_RACKET.hit - 0.35); g.gain.linearRampToValueAtTime(0.12, NE_RACKET.hit - 0.02); g.gain.linearRampToValueAtTime(0, NE_RACKET.hit + 0.02);
      bp.frequency.setValueAtTime(500, NE_RACKET.hit - 0.35); bp.frequency.linearRampToValueAtTime(1600, NE_RACKET.hit); n.connect(bp); bp.connect(g); g.connect(fx);
      thud(NE_RACKET.hit, 0.55, 0.05, fx, 260, 110, 0.07);
      burst(NE_RACKET.hit, 0.25, 'white', 2400, 3, 0.03, 0.05, fx, 0.004);            // the strings creaking as they stretch
      thud(NE_RACKET.hit + 0.32 + Math.sqrt(2 * 1.1 / NE_G), 0.35, 0.15, fx, 180, 80, 0.06);
      // shoe: the swing (cloth), the heel strike, the foam flattening (a soft hiss), the toe-off scuff
      burst(NE_SHOE.strike - 0.3, 0.3, 'pink', 700, 0.7, 0.04, 0, fx, 0.15);
      thud(NE_SHOE.strike, 0.6, 0, fx, 140, 60, 0.09);
      burst(NE_SHOE.strike + 0.03, 0.2, 'white', 3200, 1.0, 0.035, 0, fx, 0.04);
      burst(NE_SHOE.off - 0.05, 0.12, 'white', 1800, 1.2, 0.05, 0.1, fx, 0.01);
      // cushion: standing up (cloth, a creak of the bench) — and no "whoof" of foam refilling
      burst(9.85, 0.45, 'pink', 900, 0.6, 0.06, 0.1, fx, 0.08);
      S.clunk(9.95, 0.08, 0.15, fx);
      // rubber band: it creaks as it stretches… and then nothing. No snap.
      { const t0 = 11.8, t1 = 12.32, n2 = S.noise('white', t0, t1 + 0.1), b2 = S.filter('bandpass', 1400, 6), g2 = ctx.createGain();
        b2.frequency.setValueAtTime(900, t0); b2.frequency.linearRampToValueAtTime(2200, t1); g2.gain.setValueAtTime(0, t0); g2.gain.linearRampToValueAtTime(0.06, t0 + 0.1); g2.gain.linearRampToValueAtTime(0.0, t1 + 0.05);
        n2.connect(b2); b2.connect(g2); g2.connect(fx);
        for (let t = t0 + 0.03; t < t1; t += R(0.03, 0.07)) S.click(t, 0.015, R(-0.2, 0.2), fx); }
    }

    // 6. the plaza again: the trampoline. The springs groan as they stretch… and the "boing" never comes.
    { const P = place(NE_TRAMP.x, NE_TRAMP.z, T.land, 6);
      burst(T.jump, 0.12, 'pink', 600, 0.8, 0.05 * P.g * 2, P.pan, fx, 0.01);
      thud(T.land, 0.55 * P.g * 2.4, P.pan, fx, 95, 42, 0.18);
      groan(T.land + 0.02, 0.6, 140, 0.06 * P.g * 2.4, P.pan, fx, 0.55);
      for (let i = 0; i < 9; i++) S.click(T.land + 0.05 + i * 0.03 + R(0, 0.02), 0.02 * P.g * 2, P.pan + R(-0.1, 0.1), fx);   // spring coils spreading
      thud(T.land2, 0.35 * P.g * 2.4, P.pan, fx, 90, 45, 0.14); groan(T.land2, 0.3, 120, 0.03 * P.g * 2.4, P.pan, fx, 0.7);
      S.voice(T.land + 0.25, 520, 0.4, 'o', 0.03 * P.g * 2, P.pan, fx, 0.85);   // the kid: "oh?"
      S.voice(16.1, 330, 0.35, 'a', 0.02 * P.g * 2, P.pan + 0.1, fx, 1.1);        // the parent
    }

    // 8. traffic: engines and tyres (spatialised from each car's path), the table's climbs and landings, scrapes
    const engine = (car, t0, t1, f, vol) => {
      const pos = (t) => { const p = car.spec.pose(t); return p ? { x: p.x, z: p.z } : { x: 1e4, z: 1e4 }; };
      const pts = this._spatial(pos, t0, t1, 1 / 15, 7);
      const o = ctx.createOscillator(), o2 = ctx.createOscillator(), lp = S.filter('lowpass', 260, 1.2), g = ctx.createGain(), p = ctx.createStereoPanner();
      o.type = 'sawtooth'; o2.type = 'square'; o.frequency.value = f; o2.frequency.value = f * 0.5;
      const og = ctx.createGain(); og.gain.value = 0.35; o2.connect(og); og.connect(lp);
      o.connect(lp); lp.connect(g); g.connect(p); p.connect(cars);
      const n = S.noise('pink', t0, t1), nb = S.filter('bandpass', 650, 0.6), ng = ctx.createGain(); n.connect(nb); nb.connect(ng); ng.connect(g); ng.gain.value = 0.6;
      g.gain.value = 0;
      this._applySpatial(pts, g.gain, p.pan, [[o.frequency, f], [o2.frequency, f * 0.5]], vol, (t) => MathX.smooth(t, t0, t0 + 0.6) * (1 - MathX.smooth(t, t1 - 0.6, t1)));
      o.start(t0); o2.start(t0); o.stop(t1 + 0.1); o2.stop(t1 + 0.1);
    };
    for (const c of TR.cars) {
      const id = c.spec.id;
      const span = { H: [18.5, 30], B1: [0, 12], B2: [0, 14], B3: [0, 16], C1: [27, 45], C2: [28, 45], TR: [28, 52], BUS: [30, 47], C5: [36, 55.5], Q1: [56.5, 62.4], Q2: [44, 56], X1: [46, 53.7], X2: [48, 53.7], X3: [48, 55.0] }[id];
      if (!span) continue;
      const big = id === 'TR' || id === 'BUS';
      engine(c, span[0], span[1], big ? 31 : id === 'H' ? 44 : R(40, 52), big ? 0.32 : 0.16);
      // the table: a heavy thump on each climb, a clunk and a groan of springs on each landing
      for (const e of c.events) {
        const ps = c.spec.pose(e.t); if (!ps) continue;
        const P = place(ps.x, ps.z, e.t, 6), k = big ? 1.6 : 1;
        if (e.kind === 'climb') thud(e.t, 0.45 * P.g * k, P.pan, cars, 90, 40, 0.12);
        else { S.clunk(e.t, 0.3 * P.g * k, P.pan, cars); thud(e.t + 0.01, 0.5 * P.g * k, P.pan, cars, 75, 35, 0.15); groan(e.t, 0.35, 95, 0.03 * P.g * k, P.pan, cars, 0.6); }
      }
    }
    // scrapes: steel on asphalt (bumpers on the table; the truck's dragging bar)
    for (const s of TR._sp) {
      const ps = s.c.spec.pose(s.t0 + 0.05); if (!ps) continue;
      const P = place(ps.x, ps.z, s.t0, 6), d = s.dur, n = S.noise('white', s.t0, s.t0 + d + 0.1), hp = S.filter('bandpass', s.drag ? 2200 : 3000, 1.6), g = ctx.createGain();
      g.gain.setValueAtTime(0, s.t0); g.gain.linearRampToValueAtTime((s.drag ? 0.09 : 0.12) * P.g, s.t0 + 0.02); g.gain.linearRampToValueAtTime((s.drag ? 0.07 : 0.03) * P.g, s.t0 + d * 0.6); g.gain.linearRampToValueAtTime(0, s.t0 + d);
      n.connect(hp); hp.connect(g); g.connect(pan(cars, P.pan));
    }
    // the bus's air brakes at the stop
    { const ps = TR.bus.spec.pose(45.5), P = place(ps.x, ps.z, 45.5, 8); S.hiss(45.5, 0.6, 0.06 * P.g * 2, P.pan, cars); }

    // 9. structures: the footbridge groans at each step of its sag; the signal arm and the lamp posts creak as they give
    // (a long groan of steel as the running club reaches midspan and the deck settles to a new low; a creak when it's gone)
    groan(44.0, 3.4, 56, 0.075, -0.05, fx, 0.7); burst(44.4, 2.6, 'brown', 220, 0.6, 0.05, 0, fx, 0.6); groan(48.9, 1.0, 70, 0.03, 0.1, fx, 0.85);
    // footsteps on the steel deck: soft ticks for the walkers, a drumming patter for the runners
    for (const w of NE_WALKERS) { const step = (w.run ? 2.3 : 1.2) / w.v / 2; for (let t = Math.max(w.t0, NE.bridge[0]) + (w.v * 7.3) % step; t < Math.min(w.t1, NE.bridge[1]); t += step) { const x = neWalkerX(w, t); if (x === null || Math.abs(x) > NE_CITY.bridge.half) continue; S.click(t, w.run ? 0.016 : 0.006, MathX.clamp(x / 14, -0.6, 0.6), fx); if (w.run) thud(t, 0.03, MathX.clamp(x / 14, -0.6, 0.6), fx, 110, 60, 0.04); } }
    groan(44.0, 1.4, 180, 0.025, 0.25, fx, 0.8); groan(47.4, 1.2, 160, 0.022, 0.3, fx, 0.75);
    groan(45.2, 1.3, 120, 0.02, -0.3, fx, 0.7);

    // 10. the crash. Brakes too late, the hit (biggest sound of the film), glass, the van, then a long settle with no rebound.
    { const C = NE_CRASH, ps = neCrashPose('suv', C.ti), P = place(ps.x, ps.z, C.ti, 10);
      // the SUV's tyres scrubbing as it brakes, and a horn too late
      burst(C.ti - 0.32, 0.36, 'white', 1100, 0.7, 0.07, P.pan - 0.1, cars, 0.03);
      S.horn(C.ti - 0.55, 392, 466, 0.05, P.pan - 0.15, cars);
      // the hit
      S.crunch(C.ti, 0.95, P.pan, fx, rev); S.boom(C.ti, 0.75, fx, rev); thud(C.ti, 0.9, P.pan, fx, 70, 30, 0.35);
      for (let i = 0; i < 26; i++) { const t = C.ti + 0.05 + R(0, 1.4) * R(0.2, 1); S.tone(t, 0.06, R(2800, 6400), R(0.01, 0.03), P.pan + R(-0.3, 0.3), fx, 'sine', 0.001, 0.05); }   // glass
      // the wreck scraping along as one, slowing
      { const n = S.noise('white', C.ti + 0.05, C.ti + 1.6), b = S.filter('bandpass', 1500, 1.0), g = ctx.createGain();
        g.gain.setValueAtTime(0, C.ti + 0.05); g.gain.linearRampToValueAtTime(0.1, C.ti + 0.12); g.gain.linearRampToValueAtTime(0.0, C.ti + 1.3); n.connect(b); b.connect(g); g.connect(pan(fx, P.pan)); }
      // the van can't stop: tyres, then the second hit
      burst(C.tb, C.tv - C.tb, 'white', 900, 0.8, 0.08, P.pan, cars, 0.05);
      S.crunch(C.tv, 0.8, P.pan, fx, rev); thud(C.tv, 0.75, P.pan, fx, 65, 30, 0.3);
      // the stuck horn of the wreck (a long, sagging note), a hiss of steam, glass ticking down
      { const o = ctx.createOscillator(), o2 = ctx.createOscillator(), lp = S.filter('lowpass', 1500, 0.7), g = ctx.createGain(); o.type = 'square'; o2.type = 'square';
        o.frequency.setValueAtTime(415, C.tv + 0.4); o2.frequency.setValueAtTime(494, C.tv + 0.4); o.frequency.linearRampToValueAtTime(380, 61); o2.frequency.linearRampToValueAtTime(455, 61);
        g.gain.setValueAtTime(0, C.tv + 0.4); g.gain.linearRampToValueAtTime(0.035, C.tv + 0.5); g.gain.setValueAtTime(0.035, 58.6); g.gain.linearRampToValueAtTime(0, 61.2);
        o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(pan(cars, P.pan)); o.start(C.tv + 0.4); o2.start(C.tv + 0.4); o.stop(61.3); o2.stop(61.3); }
      S.hiss(C.tv + 0.6, 4.5, 0.025, P.pan, fx);
      for (let i = 0; i < 10; i++) S.tone(C.tv + 0.8 + i * R(0.2, 0.6), 0.05, R(3000, 6000), 0.008, P.pan + R(-0.2, 0.2), fx, 'sine', 0.001, 0.04);
      S.voice(C.tv + 1.2, 300, 0.6, 'o', 0.03, P.pan + 0.3, fx, 0.9); S.voice(C.tv + 1.9, 410, 0.5, 'e', 0.025, P.pan - 0.3, fx, 0.95);
    }

    // 10b. the tap: the late hatch's tyres as it brakes, then a small, dull plastic crunch (no rebound knock)
    { const T = NE_TAP, P = { pan: 0.1 };
      burst(T.tb, NE.tap - T.tb, 'white', 1000, 0.8, 0.05, P.pan, cars, 0.05);
      thud(NE.tap, 0.55, P.pan, fx, 140, 60, 0.1);
      burst(NE.tap, 0.16, 'white', 2600, 1.4, 0.06, P.pan, fx, 0.002);
      for (let i = 0; i < 6; i++) S.click(NE.tap + 0.02 + i * R(0.015, 0.04), 0.02, P.pan + R(-0.1, 0.1), fx);
    }

    // 11. music: a quiet pad whose pitch slowly sags (nothing holds its tension); silence before the crash; a closing chord
    { const pad = (t0, t1, notes, vol, sag) => {
        for (const f of notes) {
          const o = ctx.createOscillator(), o2 = ctx.createOscillator(), lp = S.filter('lowpass', 900, 0.6), g = ctx.createGain();
          o.type = 'triangle'; o2.type = 'sine'; o.frequency.setValueAtTime(f, t0); o.frequency.linearRampToValueAtTime(f * sag, t1); o2.frequency.setValueAtTime(f * 1.004, t0); o2.frequency.linearRampToValueAtTime(f * sag * 1.004, t1);
          g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + 1.5); g.gain.setValueAtTime(vol, t1 - 1.5); g.gain.linearRampToValueAtTime(0, t1);
          o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(mus); o.start(t0); o2.start(t0); o.stop(t1 + 0.1); o2.stop(t1 + 0.1);
        }
      };
      pad(13.4, 31.5, [110, 164.8, 220], 0.03, 0.97);
      pad(31.0, 52.6, [98, 146.8, 196, 246.9], 0.032, 0.955);
      // a low pulse that tightens toward the crash (music supports, sound effects dominate)
      for (let t = 46.0; t < T.crash - 0.4;) { const k = MathX.ramp(t, 46, T.crash); S.tone(t, 0.25, 55, 0.05 + 0.07 * k, 0, mus, 'sine', 0.01, 0.2); t += MathX.lerp(0.9, 0.42, k); }
      // the closing chord under the line, unresolved, and a last sag at the very end
      for (const f of [87.3, 130.8, 174.6, 220, 261.6]) S.tone(T.line[0] - 0.2, 7.6, f, 0.03, 0, mus, 'sine', 1.2, 2.8);
      pad(T.note[0] - 0.4, T.end + 0.6, [65.4, 98], 0.035, 0.94);
    }
  }
}
