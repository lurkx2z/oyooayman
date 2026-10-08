/* =====================================================================
   AUDIO — the soundtrack of "What if gravity became twice as strong?" (v3: the leisure centre), synthesised and
   rendered offline (js/audio/audioEngine.js); every cue at its story time and place (distance and pan from where
   you stand and where you are looking).
   The sound idea: a busy gym (music from the ceiling speakers, a treadmill, plates), then one deep WHUMP and every
   weight in the room hits the floor at once; the music doesn't care. Down the stair into the pool hall's long echo:
   water lapping, voices. Under water the world goes muffled (your heartbeat, the diver's bubbles); the surface
   brings it back; one soft chord under the closing lines.
   Bake when final:
     NODE_PATH=$(npm root -g) node tools/bake-soundtrack.cjs --page gravity-2x.html --out films/gravity-2x/soundtrack.js
   ===================================================================== */

class GvAudio extends AudioEngine {
  constructor(tl, app) { super(tl); this.app = app; this.wavName = SCRIPT.meta.wav; }
  // anything the sound depends on that is not inside SCRIPT (so a stale baked copy is detected)
  fingerprintData() { return [GV, GV_FALL, GV_THROW, GV_C, GV_ME, GV_LOOK.map((L) => [L[0], L[1], Array.isArray(L[2]) ? L[2] : String(L[2])])]; }

  async renderOffline() { const buf = await super.renderOffline(); AudioEngine.declick(buf, 0.15); return buf; }

  // where you are looking (yaw, radians) at story time t: from GV_LOOK's fixed targets (moving targets: null = "at the thing")
  _yaw(t) {
    const L = GV_LOOK; let i = 0; while (i + 1 < L.length && L[i + 1][0] <= t) i++;
    const y = (E) => (Array.isArray(E[2]) ? Math.atan2(-(E[2][0] - this.cx.value(t)), -(E[2][2] - this.cz.value(t))) : null);
    const b = y(L[i]), a = i > 0 ? y(L[i - 1]) : b, w = i > 0 ? MathX.clamp((t - L[i][0]) / Math.max(0.01, L[i][1] - L[i][0]), 0, 1) : 1;
    if (b === null) return w > 0.5 || a === null ? null : a;
    if (a === null) return b;
    return MathX.lerp(a, b, w);
  }
  // gain and pan of a sound at (x, z) heard at time t
  at(x, z, t, ref = 8) {
    const lx = this.cx.value(t), lz = this.cz.value(t), dx = x - lx, dz = z - lz, d = Math.max(0.5, Math.hypot(dx, dz));
    const yaw = this._yaw(t);
    if (yaw === null) return { g: ref / (ref + d), pan: 0, d };
    const rx = Math.cos(yaw), rz = -Math.sin(yaw);
    return { g: ref / (ref + d), pan: MathX.clamp((dx * rx + dz * rz) / d, -1, 1) * 0.8, d };
  }

  _build(ctx) {
    const S = new SoundKit(ctx, CONFIG.seed), T = GV, END = CONFIG.duration;
    this.S = S;
    // offline-safe envelopes (Chrome's offline renderer clicks on very short exponential ramps)
    S.env = (g, t, a, peak, d) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(Math.max(0.0002, peak), t + Math.max(a, 0.006)); g.gain.setTargetAtTime(0, t + Math.max(a, 0.006), Math.max(0.004, d / 4)); };
    const tone = S.tone.bind(S);
    S.tone = (t, dur, f, vol, pan, dest, type = 'sine', attack = 0.01, release = null) => tone(t, dur, f, vol, pan, dest, type, Math.max(attack, 0.006), release);
    S.breath = (t, dur, inhale, vol, dest) => {
      const n = S.noise('pink', t, t + dur + 0.1), bp = S.filter('bandpass', inhale ? 1200 : 700, 0.9), g = ctx.createGain();
      if (inhale) { bp.frequency.setValueAtTime(850, t); bp.frequency.linearRampToValueAtTime(1500, t + dur); }
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + dur * (inhale ? 0.6 : 0.3)); g.gain.linearRampToValueAtTime(0, t + dur);
      n.connect(bp); bp.connect(g); g.connect(dest);
    };
    // mix → glue compressor → limiter
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.004; comp.release.value = 0.22;
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -2.5; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.12;
    const mixIn = ctx.createGain(); mixIn.gain.value = 2.7; mixIn.connect(comp);
    // (the limiter's built-in makeup gain pushes peaks to 0 dBFS: a trim after it keeps true peaks under −1 dBTP)
    const out = ctx.createGain(), trim = ctx.createGain(); trim.gain.value = 0.8; comp.connect(out); out.connect(lim); lim.connect(trim); trim.connect(ctx.destination);
    out.gain.setValueAtTime(0.0001, 0); out.gain.linearRampToValueAtTime(0.9, 0.08);
    out.gain.setValueAtTime(0.9, END - 0.8); out.gain.linearRampToValueAtTime(0.0001, END);
    // the world, heard through water when you're under: a low-pass that closes when you go in and opens when you surface
    const muff = S.filter('lowpass', 18000, 0.7); muff.connect(mixIn);
    const wet = [[T.slide + 0.18, T.slide + 0.85], [T.under + 0.12, T.surface + 0.02], [T.out.give + 0.33, T.out.give + 0.78]];
    muff.frequency.setValueAtTime(18000, 0);
    for (const [a, b] of wet) { muff.frequency.setValueAtTime(18000, a); muff.frequency.exponentialRampToValueAtTime(420, a + 0.08); muff.frequency.setValueAtTime(420, b - 0.06); muff.frequency.exponentialRampToValueAtTime(18000, b + 0.05); }
    const world = ctx.createGain(); world.connect(muff);
    // the diver's fall: the hall hushes for a second, then the hit
    world.gain.setValueAtTime(1, T.diver.step + 0.1); world.gain.linearRampToValueAtTime(0.35, T.diver.step + 0.45); world.gain.setValueAtTime(0.35, GV_FALL.hit - 0.03); world.gain.linearRampToValueAtTime(1, GV_FALL.hit);
    // two rooms: the gym (short, dry) and the pool hall (long, bright tiles and water)
    const gymRev = S.reverb(0.9), gr = ctx.createGain(); gr.gain.value = 0.22; gymRev.connect(gr); gr.connect(world);
    const hallRev = S.reverb(3.6), hr = ctx.createGain(); hr.gain.value = 0.42; hallRev.connect(hr); hr.connect(world);
    const you = ctx.createGain(); you.gain.value = 1; you.connect(mixIn);
    const uw = ctx.createGain(); uw.gain.value = 1; uw.connect(mixIn);           // under-water sounds (not muffled again)
    const mus = ctx.createGain(); mus.gain.value = 0.6; mus.connect(mixIn);
    this.gymRev = gymRev; this.hallRev = hallRev;
    this._gym(S, ctx, world, gymRev);
    this._change(S, ctx, world, gymRev);
    this._treadmill(S, ctx, world, gymRev);
    this._bench(S, ctx, world, gymRev);
    this._court(S, ctx, world);
    this._hall(S, ctx, world, hallRev);
    this._you(S, ctx, you, world, hallRev);
    this._ladder(S, ctx, world, hallRev);
    this._effort(S, ctx, you, world, gymRev, hallRev);
    this._dive(S, ctx, world, hallRev, uw);
    this._under(S, ctx, uw, you);
    this._end(S, ctx, world, mus);
  }

  /* ---- little synth pieces ---- */
  // steel on steel: a struck bar or plate (inharmonic partials, a fast decay)
  clang(t, f, vol, pan, dest, dur = 0.9) {
    const S = this.S, ctx = S.ctx;
    for (const [k, a] of [[1, 1], [2.76, 0.6], [5.4, 0.35], [8.9, 0.2]]) S.tone(t, dur / Math.sqrt(k), f * k, vol * a, pan, dest, 'sine', 0.002, dur / Math.sqrt(k) * 0.8);
    S.click(t, vol * 1.5, pan, dest);
  }
  // water: a splash (a noise burst through a falling band), droplets pattering after it
  splash(t, vol, pan, dest, rev, size = 1) {
    const S = this.S, ctx = S.ctx, dur = 0.35 + 0.5 * size;
    const n = S.noise('white', t, t + dur + 0.2), bp = S.filter('bandpass', 2400, 0.6), g = ctx.createGain();
    bp.frequency.setValueAtTime(900 + 600 * size, t); bp.frequency.exponentialRampToValueAtTime(3200, t + 0.08); bp.frequency.exponentialRampToValueAtTime(1800, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.012); g.gain.setTargetAtTime(0, t + 0.04, dur / 3.5);
    n.connect(bp); bp.connect(g); g.connect(S.panned(dest, pan));
    if (rev) { const r = ctx.createGain(); r.gain.value = 0.6; g.connect(r); r.connect(rev); }
    const lo = S.noise('pink', t, t + 0.5), lp = S.filter('lowpass', 380, 0.8), lg = ctx.createGain();
    lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(vol * 1.2 * size, t + 0.01); lg.gain.setTargetAtTime(0, t + 0.03, 0.08);
    lo.connect(lp); lp.connect(lg); lg.connect(S.panned(dest, pan));
    for (let k = 0; k < 10 * size; k++) { const tt = t + 0.15 + (0.3 + 0.7 * size) * Math.pow(S.rng.next(), 1.4); this.drip(tt, vol * S.rng.range(0.08, 0.2), MathX.clamp(pan + S.rng.range(-0.3, 0.3), -1, 1), dest); }
  }
  // a single drop or a bubble: a short upward sine chirp
  drip(t, vol, pan, dest, f = null) {
    const S = this.S, ctx = S.ctx, o = ctx.createOscillator(), g = ctx.createGain(), f0 = f || S.rng.range(700, 1500);
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 2.1, t + 0.035);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.setTargetAtTime(0, t + 0.01, 0.012);
    o.connect(g); g.connect(S.panned(dest, pan)); o.start(t); o.stop(t + 0.08);
  }
  // water lapping at the pool's edge: gentle, irregular, filtered noise
  lapping(t0, t1, vol, pan, dest, rate = 1.6) {
    const S = this.S, ctx = S.ctx, n = S.noise('pink', t0, t1), bp = S.filter('bandpass', 700, 0.9), g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    for (let t = t0; t < t1; t += 0.08) g.gain.linearRampToValueAtTime(vol * (0.35 + 0.65 * Math.max(0, Math.sin(t * rate * Math.PI * 2 + Math.sin(t * 0.7) * 2)) ** 2), t);
    n.connect(bp); bp.connect(g); g.connect(S.panned(dest, pan));
  }
  // straining: a long, rough voiced effort (glides down)
  strain(t, dur, f, vol, pan, dest) { this.S.voice(t, f, dur, 'u', vol, pan, dest, 0.82); this.S.breath(t + dur, 0.5, false, vol * 0.7, dest); }

  /* ---- the gym: music from the ceiling speakers, the room, people ---- */
  _gym(S, ctx, world, rev) {
    const T = GV, bpm = 118, beat = 60 / bpm, end = T.stair[0] + 6;
    // the speakers: a band-limited bus that fades as you go down the stair (and is gone in the pool hall)
    const spk = ctx.createGain(), bp = S.filter('bandpass', 1100, 0.45), hp = S.filter('highpass', 140, 0.7);
    spk.connect(hp); hp.connect(bp); bp.connect(world); const sr = ctx.createGain(); sr.gain.value = 0.5; bp.connect(sr); sr.connect(rev);
    spk.gain.setValueAtTime(0.9, 0); spk.gain.setValueAtTime(0.9, T.stair[0]); spk.gain.linearRampToValueAtTime(0.25, T.stair[0] + 2.5); spk.gain.linearRampToValueAtTime(0.0001, end);
    const bass = [55, 55, 65.4, 73.4, 55, 55, 82.4, 73.4];
    for (let i = 0, t = 0.05; t < end; i++, t += beat) {
      S.thump(t, 0.32, spk);
      S.tick(t + beat / 2, 7800, 0.05, spk);
      if (i % 2) S.hiss(t, 0.08, 0.025, 0.1, spk);
      const f = bass[Math.floor(i / 2) % bass.length];
      S.tone(t + beat / 2, beat * 0.45, f * 2, 0.07, 0, spk, 'sawtooth', 0.008, 0.05);
      if (i % 8 === 0) for (const k of [1, 1.26, 1.5]) S.tone(t, beat * 7.5, 220 * k * (Math.floor(i / 8) % 2 ? 0.89 : 1), 0.012, 0, spk, 'triangle', 0.3, 1.0);
    }
    // the room: air handling, a little murmur
    { const n = S.noise('brown', 0, end), lp = S.filter('lowpass', 260, 0.7), g = ctx.createGain(); g.gain.setValueAtTime(0.18, 0); g.gain.setValueAtTime(0.18, T.stair[0]); g.gain.linearRampToValueAtTime(0.0001, end); n.connect(lp); lp.connect(g); g.connect(world); }
    // plates and dumbbells being put down, before the change
    for (const [t, x, z] of [[0.35, -2.6, 4.2], [1.05, 5.2, 1.4]]) { const a = this.at(x, z, t); this.clang(t, 410 + 90 * S.rng.next(), 0.04 * a.g, a.pan, world, 0.5); }
    // the scale: a soft beep when it has your weight; then fast beeps while it re-measures after the change
    S.tone(0.25, 0.09, 1760, 0.035, 0, world, 'sine', 0.006, 0.05);
    for (let k = 0; k < 6; k++) S.tone(T.g0 + 0.3 + k * 0.16, 0.07, 2093, 0.03, 0, world, 'sine', 0.006, 0.04);
    S.tone(T.scale[0] + 0.05, 0.3, 1568, 0.03, 0, world, 'sine', 0.006, 0.2);
  }

  /* ---- the change: one deep hit, and every weight in the room hits the floor ---- */
  _change(S, ctx, world, rev) {
    const t = GV.g0;
    S.whump(t, 0.9, 0, world);
    S.boom(t + 0.02, 0.32, world, rev);
    S.tone(t, 1.6, 34, 0.35, 0, world, 'sine', 0.05, 1.3);              // a sub swell (the floor pushing up at you)
    // the dumbbells she was curling, the bar onto the safety arms, plates sliding on the racks, a kettlebell
    { const a = this.at(-0.55, -3.7, t); S.thump(t + 0.36, 0.35 * a.g + 0.1, world); this.clang(t + 0.37, 330, 0.06 * a.g, a.pan, world, 0.4); this.clang(t + 0.39, 360, 0.05 * a.g, a.pan, world, 0.4); }
    { const a = this.at(GV_C.bench.x, GV_C.bench.barZ, t); this.clang(t + 0.3, 260, 0.1 * a.g, a.pan, world, 1.0); S.clunk(t + 0.3, 0.3 * a.g, a.pan, world); }
    for (const [x, z, dt] of [[-2.6, 4.2, 0.12], [-0.6, 4.2, 0.18], [5.2, 1.4, 0.22], [-4.6, -4.9, 0.27], [1.6, 3.0, 0.33]]) { const a = this.at(x, z, t); S.clunk(t + dt, 0.25 * a.g, a.pan, world); this.clang(t + dt + 0.01, 380 + 200 * S.rng.next(), 0.035 * a.g, a.pan, world, 0.6); }
    // gasps across the room
    for (const [x, z, f, dt] of [[-5.45, -2.15, 240, 0.12], [-0.55, -3.7, 230, 0.2], [3.75, -1.4, 130, 0.25]]) { const a = this.at(x, z, t); S.voice(t + dt, f, 0.3, 'a', 0.045 * a.g, a.pan, world, 0.8); }
    // the building takes the load: a long low groan
    S.tone(t + 0.1, 2.2, 47, 0.06, 0, world, 'sawtooth', 0.2, 1.5);
  }

  /* ---- the treadmill: the motor, her stride, the change, off the back ---- */
  _treadmill(S, ctx, world, rev) {
    const T = GV.tread, x = -5.45, z = GV_C.treadZ[1], end = GV.stair[0];
    { const a = this.at(x, z, 0, 6), o = ctx.createOscillator(), lp = S.filter('lowpass', 900, 1.5), g = ctx.createGain(), p = S.panned(world, a.pan);
      o.type = 'sawtooth'; o.frequency.setValueAtTime(92, 0); o.frequency.setValueAtTime(92, GV.g0); o.frequency.linearRampToValueAtTime(84, GV.g0 + 0.4); o.frequency.linearRampToValueAtTime(92, GV.g0 + 1.2);
      g.gain.setValueAtTime(0.03, 0); g.gain.setValueAtTime(0.03, T.look); g.gain.linearRampToValueAtTime(0.05, T.look + 0.6); g.gain.setValueAtTime(0.05, GV.offScale + 1); g.gain.linearRampToValueAtTime(0.012, GV.offScale + 3); g.gain.linearRampToValueAtTime(0.0001, end);
      o.connect(lp); lp.connect(g); g.connect(p); o.start(0); o.stop(end + 0.1); }
    // her footfalls on the belt: even at 1 G; scuffing and slapping once she's hanging on
    for (let t = 0.1; t < GV.g0; t += 0.5 / GV_RUN_HZ) { const a = this.at(x, z, t, 6); S.step(t, 0.12 * a.g, a.pan, world); }
    for (let t = GV.g0 + 0.15; t < T.slip; t += S.rng.range(0.18, 0.32)) { const a = this.at(x, z, t, 6); S.step(t, 0.07 * a.g, a.pan, world); S.hiss(t, 0.12, 0.012 * a.g, a.pan, world); }
    { const a = this.at(x, z, T.slip, 6);
      S.voice(GV.g0 + 0.1, 260, 0.35, 'a', 0.06 * a.g, a.pan, world, 0.85);
      for (let t = GV.g0 + 1.5; t < T.slip; t += 0.9) S.voice(t, 250, 0.4, 'u', 0.035 * a.g, a.pan, world, 0.9);
      S.voice(T.slip + 0.02, 300, 0.45, 'e', 0.08 * a.g, a.pan, world, 1.15);
      S.thump(T.slip + 0.2, 0.3 * a.g + 0.05, world); this.clang(T.slip + 0.05, 520, 0.03 * a.g, a.pan, world, 0.4);
      const off = T.slip + (GV_C.treadX[1] + 0.02 - (-5.45 + 0.32)) / GV_BELT + 0.13;
      S.thump(off, 0.45 * a.g + 0.08, world); S.clunk(off, 0.2 * a.g, a.pan, world); S.voice(off + 0.05, 230, 0.3, 'o', 0.07 * a.g, a.pan, world, 0.75);
      for (let k = 0; k < 4; k++) S.breath(T.sit + 0.3 + k * 0.7, 0.32, k % 2 === 0, 0.03 * a.g, world); }
  }

  /* ---- the bench: the heave, the strain, the rattle, the crash ---- */
  _bench(S, ctx, world, rev) {
    const B = GV.bench, x = GV_C.bench.x, z = GV_C.bench.barZ, a = this.at(x, z, B.heave);
    S.voice(B.look + 0.3, 140, 0.3, 'e', 0.04 * a.g, a.pan, world, 1.0);                         // "three, two…"
    S.voice(B.look + 0.75, 135, 0.25, 'o', 0.04 * a.g, a.pan, world, 0.95);
    this.strain(B.heave, B.drop - B.heave - 0.05, 112, 0.09 * a.g + 0.02, a.pan, world);
    this.strain(B.heave + 0.08, B.drop - B.heave - 0.1, 150, 0.06 * a.g + 0.01, MathX.clamp(a.pan - 0.1, -1, 1), world);
    // the bar trembling in their hands
    for (let t = B.heave + 0.3; t < B.drop; t += 0.045) S.click(t, 0.035 * a.g * (0.6 + 0.4 * S.rng.next()), a.pan, world);
    // the crash onto the safety arms
    const tc = B.drop + Math.sqrt(2 * 0.069 / GV_G);
    this.clang(tc, 240, 0.16 * a.g + 0.03, a.pan, world, 1.4); this.clang(tc + 0.005, 310, 0.1 * a.g, a.pan, world, 1.1);
    S.clunk(tc, 0.5 * a.g + 0.1, a.pan, world); S.thump(tc, 0.35, world); S.boom(tc, 0.12, world, rev);
    S.voice(tc + 0.35, 120, 0.7, 'a', 0.06 * a.g, a.pan, world, 0.75);                          // a long breath out
    S.breath(tc + 1.2, 0.8, false, 0.04 * a.g, world);
  }

  /* ---- the court, through the glass: the ball's thuds, shoes, a groan ---- */
  _court(S, ctx, world) {
    const glass = S.filter('lowpass', 950, 0.7), g = ctx.createGain(); g.gain.value = 0.9; glass.connect(g); g.connect(world);
    const T = GV_THROW, H = GV_C.court.hoop, o = { x: 0, y: 0, z: 0, vis: 1 };
    // the bounces (from the ball's own flight): find each landing
    let py = 1, pv = 0;
    for (let t = T.t0 + 0.02; t < T.t0 + 4.0; t += 1 / 240) {
      gvBall(t, GV_G, o); const v = o.y - py;
      if (pv < 0 && v >= 0 && o.y < 0.14) { const a = this.at(o.x, o.z, t, 10); S.thump(t, 0.5 * a.g + 0.05, glass); S.step(t, 0.25 * a.g, a.pan, glass); }
      pv = v; py = o.y;
    }
    const a = this.at(H.x, H.z + 3, T.t0);
    S.voice(T.t0 + 0.9, 150, 0.6, 'o', 0.08 * a.g + 0.02, a.pan, glass, 0.8);
    S.voice(T.t0 + 1.1, 190, 0.5, 'a', 0.06 * a.g + 0.02, a.pan, glass, 0.85);
    for (let k = 0; k < 4; k++) S.chirp(T.t0 - 1.0 + k * 0.7 + S.rng.range(0, 0.3), 2400, 0.012, a.pan, glass, false);   // shoe squeaks
  }

  /* ---- the pool hall: the room, water lapping, voices, the swimmers ---- */
  _hall(S, ctx, world, rev) {
    const T = GV, t0 = T.toStair, END = CONFIG.duration;
    const hall = ctx.createGain(); hall.connect(world); const hs = ctx.createGain(); hs.gain.value = 0.7; hall.connect(hs); hs.connect(rev);
    hall.gain.setValueAtTime(0.0001, 0); hall.gain.setValueAtTime(0.0001, t0); hall.gain.linearRampToValueAtTime(0.45, T.stair[0]); hall.gain.linearRampToValueAtTime(1, T.stair[1]);
    // the room tone: the hall's air handling, a wash of water
    { const n = S.noise('pink', t0, END), lp = S.filter('lowpass', 1500, 0.5), g = ctx.createGain(); g.gain.value = 0.12; n.connect(lp); lp.connect(g); g.connect(hall); }
    this.lapping(t0, END, 0.09, -0.3, hall, 1.3); this.lapping(t0, END, 0.07, 0.4, hall, 1.9);
    // distant voices and children; a whistle at the change heard from downstairs
    S.chatter(t0, END - 3, 0.022, -0.2, hall, 380, 2.5);
    S.chatter(t0, END - 3, 0.014, 0.4, hall, 620, 1.6);
    { const w = (t, d) => { S.tone(t, d, 2950, 0.02, 0.3, rev, 'square', 0.01, 0.05); S.tone(t, d, 3100, 0.012, 0.3, rev, 'sine', 0.01, 0.05); }; w(GV.g0 + 0.6, 0.35); }
    // the swimmers: her breaststroke (a splash with each stroke), the kid's paddling
    for (let t = 24; t < 31.6; t += 1.45) { const a = this.at(-9.1, -18.6 + 0.82 * (t - 20), t, 6); S.hiss(t + 0.55, 0.25, 0.02 * a.g, a.pan, hall); this.drip(t + 0.6, 0.02 * a.g, a.pan, hall); }
    for (let t = 25; t < END - 3; t += S.rng.range(0.5, 1.3)) { const a = this.at(-1.0, -10.6, t, 6); this.drip(t, 0.015 * a.g, a.pan, hall); }
    // the lifeguard's heavy breathing as you pass the chair
    { const a = this.at(GV_C.chair.x, GV_C.chair.z, T.deck + 2.0, 4); for (let k = 0; k < 4; k++) S.breath(T.deck + 1.6 + k * 0.8, 0.4, k % 2 === 0, 0.03 * a.g, hall); }
    // the stair man's breath
    { const a = this.at(3.3, -8.4, T.stair[0] + 3.5, 4); for (let k = 0; k < 6; k++) S.breath(T.stair[0] + 2.6 + k * 0.62, 0.3, k % 2 === 0, 0.04 * a.g, world); }
  }

  /* ---- you: footsteps (rubber, steel treads, wet tiles), breathing ---- */
  _you(S, ctx, you, world, rev) {
    const T = GV, xT = new Track(SCRIPT.camera.x), zT = new Track(SCRIPT.camera.z), St = GV_C.stair;
    let walked = 0, next = 0.62, px = xT.value(0), pz = zT.value(0), lastTread = 0;
    for (let t = 0; t < T.sit; t += 1 / 60) {
      const x = xT.value(t), z = zT.value(t); walked += Math.hypot(x - px, z - pz); px = x; pz = z;
      const onStair = z < St.z0 && z > St.z0 - St.n * St.run - 0.1 && t > T.stair[0] - 0.3 && t < T.stair[1] + 0.3;
      if (onStair) {
        const u = (St.z0 - z) / St.run, k = Math.floor(u - 0.5);
        if (k > lastTread) { lastTread = k; S.step(t, 0.34, (k % 2 ? 0.15 : -0.15), you); this.clang(t + 0.005, 140 + 10 * (k % 3), 0.035, 0, you, 0.35); S.thump(t, 0.18, you); }
        walked = 0; next = 0.62;
      } else if (walked >= next) {
        const deck = t > T.stair[1];
        S.step(t, t < T.g0 ? 0.18 : 0.28, (Math.round(next / 0.62) % 2 ? 0.15 : -0.15), you);
        if (deck) S.hiss(t + 0.01, 0.07, 0.025, 0, you);
        next += 0.62;
      }
    }
    // the rail squeaking under your hand on the way down
    for (let t = T.stair[0] + 0.4; t < T.stair[1] - 0.3; t += S.rng.range(0.6, 1.1)) S.chirp(t, 1900, 0.006, 0.4, you, false);
    // stepping off the scale; the knees giving at the change; sitting down on the edge
    S.voice(T.g0 + 0.08, 118, 0.22, 'u', 0.05, 0, you, 0.8);
    S.thump(T.g0 + 0.1, 0.4, you);
    S.thump(T.sit + 0.85, 0.3, you); S.hiss(T.sit + 0.9, 0.3, 0.02, 0, you);
    // breathing: calm, then laboured under the weight (rate from the breathRate track); held under water
    const BR = SCRIPT_TRACKS.breathRate, HOLD = SCRIPT_TRACKS.breathHold;
    for (let t = 0.4; t < T.lineA[0] + 2; ) {
      const rate = BR.value(t), per = 60 / rate, hard = MathX.smooth(t, T.g0, T.g0 + 1.5) * (1 - 0.6 * MathX.smooth(t, T.float, T.float + 2));
      const loud = 0.022 + 0.055 * hard + 0.03 * MathX.window(t, T.stair[0] + 2, T.stair[1] + 2, 1, 2);
      const inWater = (t > T.slide + 0.1 && t < T.slide + 0.9);
      if (HOLD.value(t) < 0.3 && HOLD.value(t + per) < 0.3 && !inWater) { S.breath(t, per * 0.42, true, loud, you); S.breath(t + per * 0.45, per * 0.5, false, loud * 1.15, you); }
      t += per;
    }
    // the slide in: the splash, a moment under, up with a gasp; floating: water at your ears
    S.hiss(T.slide, 0.4, 0.02, 0, you);
    this.splash(T.slide + 0.32, 0.25, 0.1, you, rev, 0.8);
    S.gasp(T.slide + 0.95, 0.06, you);
    this.lapping(T.float - 0.3, CONFIG.duration, 0.09, 0, you, 0.9);
    // surfacing beside her: a gasp, water running off your face
    S.gasp(T.surface + 0.05, 0.07, you); S.hiss(T.surface + 0.1, 0.6, 0.02, 0, you);
    for (let k = 0; k < 8; k++) this.drip(T.surface + 0.15 + 0.6 * S.rng.next(), 0.03, S.rng.range(-0.4, 0.4), you);
  }

  /* ---- the man on the ladder ---- */
  _ladder(S, ctx, world, rev) {
    const L = GV.ladder, a = this.at(GV_C.ladder.x, GV_C.ladder.z, L.up);
    this.strain(L.up + 0.1, L.top - L.up + 0.6, 125, 0.06 * a.g + 0.015, a.pan, world);
    for (let t = L.up; t < L.slip; t += 0.25) this.drip(t + 0.1 * S.rng.next(), 0.03 * a.g, a.pan, world);        // water pouring off him
    S.hiss(L.up + 0.1, 1.2, 0.025 * a.g, a.pan, world);
    S.voice(L.slip + 0.02, 160, 0.3, 'a', 0.07 * a.g, a.pan, world, 1.2);
    this.splash(L.splash, 0.3 * a.g + 0.06, a.pan, world, rev, 1.0);
    S.voice(L.splash + 0.9, 140, 0.5, 'o', 0.04 * a.g, a.pan, world, 0.8);
  }

  /* ---- your own efforts: hanging from the bar, the knee giving on the stair, the cut into the water, pressing out ---- */
  _effort(S, ctx, you, world, gymRev, hallRev) {
    const H = GV.hang, O = GV.out, P = GV_C.pullup;
    // the bar: hands slapping onto the chrome, the frame creaking under twice your weight, the left hand peeling, the landing
    { const a = this.at(P.x, P.z, H.grab, 3);
      S.click(H.grab, 0.08, 0.1, you); S.click(H.grab + 0.03, 0.07, -0.1, you); this.clang(H.grab + 0.01, 880, 0.02, a.pan, world, 0.35);
      S.voice(H.lift + 0.05, 128, H.peel - H.lift - 0.1, 'u', 0.07, 0, you, 0.86);
      S.voice(H.pull + 0.05, 150, 0.8, 'e', 0.07, 0, you, 1.1);
      for (let t = H.lift + 0.15; t < H.drop; t += S.rng.range(0.32, 0.55)) S.chirp(t, 360 + 60 * S.rng.next(), 0.01, a.pan, world, false);
      S.tone(H.lift, H.drop - H.lift, 62, 0.04, a.pan, world, 'sawtooth', 0.2, 0.15);
      S.chirp(H.peel + 0.02, 1650, 0.02, -0.25, you, false); S.chirp(H.drop - 0.02, 1500, 0.025, -0.3, you, false);
      S.voice(H.drop + 0.02, 175, 0.25, 'a', 0.06, 0, you, 0.8);
      S.thump(H.drop + 0.17, 0.7, you); S.step(H.drop + 0.17, 0.45, 0.1, you); S.step(H.drop + 0.2, 0.35, -0.1, you); S.boom(H.drop + 0.18, 0.06, you, gymRev);
      this.clang(H.drop + 0.04, 520, 0.03, a.pan, world, 0.7);
      for (let k = 0; k < 3; k++) S.breath(H.drop + 0.5 + k * 0.42, 0.3, k % 2 === 0, 0.07, you); }
    // the knee giving on a step: a heavy thud, the tread ringing, a grunt
    { const t = 25.92; S.thump(t, 0.45, you); this.clang(t + 0.01, 128, 0.05, 0, you, 0.5); S.voice(t + 0.02, 120, 0.22, 'u', 0.05, 0, you, 0.8); }
    // the cut straight into the water: you've just slid in (water streaming off, a gasp)
    { const t = 42.86; S.hiss(t, 0.5, 0.03, 0, you); S.gasp(t + 0.05, 0.05, you); for (let k = 0; k < 6; k++) this.drip(t + 0.08 + 0.5 * S.rng.next(), 0.03, S.rng.range(-0.4, 0.4), you); }
    // swimming to the wall: a few strokes
    for (let t = O.turn + 0.3; t < O.wall - 0.3; t += 0.62) { S.hiss(t, 0.22, 0.02, 0, you); this.drip(t + 0.12, 0.03, S.rng.range(-0.3, 0.3), you); }
    // hands onto the wet deck; the press: a long rising strain, water pouring off you, the shaking at the top, the give
    S.step(O.wall - 0.28, 0.25, 0.2, you); S.step(O.wall - 0.22, 0.25, -0.2, you); S.hiss(O.wall - 0.25, 0.15, 0.02, 0, you);
    S.voice(O.push + 0.05, 118, O.top - O.push + 0.1, 'u', 0.075, 0, you, 0.9);
    S.voice(O.top + 0.1, 142, O.give - O.top - 0.05, 'e', 0.075, 0, you, 1.08);
    { const n = S.noise('white', O.push + 0.15, O.give + 0.2), bp = S.filter('bandpass', 2200, 0.7), g = ctx.createGain();
      g.gain.setValueAtTime(0, O.push + 0.15); g.gain.linearRampToValueAtTime(0.05, O.push + 0.5); g.gain.linearRampToValueAtTime(0.02, O.give); g.gain.linearRampToValueAtTime(0, O.give + 0.15);
      n.connect(bp); bp.connect(g); g.connect(you); }
    for (let t = O.push + 0.2; t < O.give + 0.2; t += 0.07) this.drip(t + 0.05 * S.rng.next(), 0.025, S.rng.range(-0.5, 0.5), you);
    S.heart(O.top - 0.3, 0.14, you); S.heart(O.top + 0.15, 0.16, you);
    S.voice(O.give, 190, 0.22, 'a', 0.07, 0, you, 0.75);
    S.thump(O.give + 0.3, 0.6, you); this.splash(O.give + 0.3, 0.45, 0, you, hallRev, 1.4);
    { const a = this.at(1.55, -32.5, O.give, 4); S.voice(O.give + 0.35, 135, 0.4, 'o', 0.04 * a.g, a.pan, world, 0.85); }
    for (let k = 0; k < 8; k++) this.drip(O.give + 0.36 + 0.4 * S.rng.next(), 0.03, S.rng.range(-0.4, 0.4), you, S.rng.range(300, 800));
    S.gasp(O.give + 0.82, 0.075, you); S.hiss(O.give + 0.86, 0.6, 0.025, 0, you);
  }

  /* ---- the dive: the hush, the air, the hit, the hall's echo ---- */
  _dive(S, ctx, world, rev, uw) {
    const T = GV.diver, F = GV_FALL, E = GV_ENTRY;
    const a = this.at(E.x, E.z, F.hit, 10);
    // a gasp from someone on the deck as she steps off; the air around her as she falls
    S.voice(T.step + 0.12, 380, 0.4, 'o', 0.03 * a.g, a.pan, world, 0.95);
    { const n = S.noise('pink', T.step, F.hit + 0.02), bp = S.filter('bandpass', 500, 0.7), g = ctx.createGain();
      bp.frequency.setValueAtTime(400, T.step); bp.frequency.linearRampToValueAtTime(1500, F.hit); g.gain.setValueAtTime(0, T.step); g.gain.linearRampToValueAtTime(0.09, F.hit - 0.01); g.gain.linearRampToValueAtTime(0, F.hit + 0.01);
      n.connect(bp); bp.connect(g); g.connect(S.panned(uw, a.pan * 0.5)); }
    // the hit: a deep slap, the crown of water, the jet falling back, the hall answering
    S.thump(F.hit, 0.9, world); S.boom(F.hit + 0.01, 0.5, world, rev); S.whump(F.hit, 0.5, a.pan, world);
    this.splash(F.hit, 0.65, a.pan, world, rev, 2.0);
    this.splash(F.hit + 0.42, 0.3, a.pan, world, rev, 1.2);
    // the wave reaching the edges, lapping harder for a while
    this.lapping(F.hit + 2.6, F.hit + 9, 0.08, -0.2, world, 2.6);
    // the people on the deck
    S.voice(F.hit + 0.6, 300, 0.5, 'o', 0.03, -0.3, world, 0.8); S.voice(F.hit + 0.8, 420, 0.4, 'e', 0.02, 0.4, world, 0.9);
  }

  /* ---- under water: a muffled roar, her bubbles, your heartbeat ---- */
  _under(S, ctx, uw, you) {
    const T = GV, t0 = T.under + 0.1, t1 = T.surface + 0.05;
    for (const [a, b, v] of [[T.slide + 0.2, T.slide + 0.85, 0.5], [t0, t1, 1], [T.out.give + 0.33, T.out.give + 0.78, 0.6]]) {
      const n = S.noise('brown', a, b + 0.1), lp = S.filter('lowpass', 300, 0.7), g = ctx.createGain();
      g.gain.setValueAtTime(0, a); g.gain.linearRampToValueAtTime(0.4 * v, a + 0.06); g.gain.setValueAtTime(0.4 * v, b - 0.08); g.gain.linearRampToValueAtTime(0, b);
      n.connect(lp); lp.connect(g); g.connect(uw);
    }
    // her plume: a rushing roar that fades, and bubbles popping and rising
    { const n = S.noise('pink', t0, t0 + 3), bp = S.filter('bandpass', 600, 0.6), g = ctx.createGain();
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.18, t0 + 0.05); g.gain.setTargetAtTime(0, t0 + 0.2, 0.7); n.connect(bp); bp.connect(g); g.connect(uw); }
    for (let k = 0; k < 70; k++) { const t = t0 + 3.8 * Math.pow(S.rng.next(), 1.6); this.drip(t, 0.03 * (1 - (t - t0) / 4.5), S.rng.range(-0.5, 0.2), uw, S.rng.range(300, 900)); }
    for (let k = 0; k < 14; k++) this.drip(T.slide + 0.3 + 0.5 * S.rng.next(), 0.03, S.rng.range(-0.4, 0.4), uw, S.rng.range(300, 800));
    // your nose bubbles
    for (const tb of [T.under + 1.8, T.under + 3.1]) for (let k = 0; k < 5; k++) this.drip(tb + k * 0.05, 0.035, 0, uw, 500 + 80 * k);
    // your heartbeat
    for (let t = t0 + 0.3; t < t1 - 0.2; t += 0.72) S.heart(t, 0.22, uw);
  }

  /* ---- after: the pool settling, the closing chord ---- */
  _end(S, ctx, world, mus) {
    const T = GV;
    // the platform: a low drone and an airy swell that build while she walks to the edge, cut dead as she steps off
    { const a = T.diver.stand, b = T.diver.step + 0.08;
      for (const [f, v] of [[55, 0.09], [82.4, 0.05], [110.6, 0.025]]) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f; g.gain.setValueAtTime(0, a); g.gain.linearRampToValueAtTime(v, b - 0.1); g.gain.linearRampToValueAtTime(0, b); o.connect(g); g.connect(mus); o.start(a); o.stop(b + 0.05); }
      const n = S.noise('pink', a, b + 0.05), bp = S.filter('bandpass', 300, 1.2), g = ctx.createGain();
      bp.frequency.setValueAtTime(300, a); bp.frequency.exponentialRampToValueAtTime(2400, b); g.gain.setValueAtTime(0, a); g.gain.linearRampToValueAtTime(0.06, b - 0.05); g.gain.linearRampToValueAtTime(0, b);
      n.connect(bp); bp.connect(g); g.connect(mus); }
    for (const [f, d] of [[110, 0], [164.8, 0.1], [220, 0.2], [277.2, 0.35], [329.6, 0.5]]) S.tone(T.lineA[0] - 0.3 + d, T.end - T.lineA[0] + 0.3 - d, f, 0.05, 0, mus, 'sine', 1.2, 2.2);
    S.pluck(T.lineA[0], 220, 0.12, 0, mus, 3.0, 0.4); S.pluck(T.lineB[0], 164.8, 0.12, 0, mus, 3.0, 0.4); S.pluck(T.lineB[0] + 0.02, 110, 0.1, 0, mus, 3.0, 0.4);
    S.pluck(T.lineC[0], 329.6, 0.1, 0, mus, 3.0, 0.35); S.pluck(T.lineC[0] + 0.03, 220, 0.08, 0, mus, 3.0, 0.35);
  }
}
