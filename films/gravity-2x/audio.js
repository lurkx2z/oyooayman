/* =====================================================================
   AUDIO — the soundtrack of "What if gravity became twice as strong?", synthesised
   and rendered offline (js/audio/audioEngine.js); every cue at its story time and place
   (distance and pan from where you stand and where you are looking).
   The sound idea: an ordinary sunny street (traffic, birds, a hammer on the scaffold),
   then one deep WHUMP and everything that carries weight starts to complain at once:
   creaks, groans, suspension clunks, your own breath. Each failure is its own hit;
   music stays out of the way (a low pulse late on, one chord under the closing lines).
   Bake when final:
     NODE_PATH=$(npm root -g) node tools/bake-soundtrack.cjs --page gravity-2x.html --out films/gravity-2x/soundtrack.js
   ===================================================================== */

class GvAudio extends AudioEngine {
  constructor(tl, app) { super(tl); this.app = app; this.wavName = SCRIPT.meta.wav; }
  // anything the sound depends on that is not inside SCRIPT (so a stale baked copy is detected)
  fingerprintData() { return [GV, GV_FALL, GV_CITY, GV_ME, GV_HOPS, GV_LOOK.map((L) => [L[0], L[1], Array.isArray(L[2]) ? L[2] : String(L[2])])]; }

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
    const mixIn = ctx.createGain(); mixIn.gain.value = 4.0; mixIn.connect(comp);
    const out = ctx.createGain(); comp.connect(out); out.connect(lim); lim.connect(ctx.destination);
    out.gain.setValueAtTime(0.0001, 0); out.gain.linearRampToValueAtTime(0.9, 0.08);
    out.gain.setValueAtTime(0.9, END - 0.8); out.gain.linearRampToValueAtTime(0.0001, END);
    const world = ctx.createGain(); world.connect(mixIn);
    const rev = S.reverb(1.8), rs = ctx.createGain(); rs.gain.value = 0.3; rev.connect(rs); rs.connect(world);
    const you = ctx.createGain(); you.gain.value = 1; you.connect(mixIn);
    const mus = ctx.createGain(); mus.gain.value = 0.6; mus.connect(mixIn);
    this.rev = rev;
    this._bed(S, ctx, world);
    this._you(S, ctx, you);
    this._change(S, ctx, world, rev);
    this._people(S, ctx, world);
    this._pallet(S, ctx, world, rev);
    this._cars(S, ctx, world, rev);
    this._crane(S, ctx, world, rev);
    this._failures(S, ctx, world, rev);
    this._plane(S, ctx, world, rev);
    this._end(S, ctx, world, you, mus, rev);
  }

  /* ---- little synth pieces ---- */
  // a structure under load: a slow, rough groan (sawtooth through a resonant band, wobbling)
  creak(t, dur, f, vol, pan, dest) {
    const ctx = this.S.ctx, o = ctx.createOscillator(), bp = this.S.filter('bandpass', f * 3, 4), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * 0.86, t + dur);
    lfo.frequency.value = 7 + 5 * this.S.rng.next(); lg.gain.value = f * 0.06; lfo.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.3); g.gain.linearRampToValueAtTime(vol * 0.6, t + dur * 0.7); g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(bp); bp.connect(g); g.connect(this.S.panned(dest, pan));
    o.start(t); o.stop(t + dur + 0.05); lfo.start(t); lfo.stop(t + dur + 0.05);
  }
  // metal on asphalt / metal on metal
  scrape(t, dur, f, vol, pan, dest) {
    const S = this.S, ctx = S.ctx, n = S.noise('white', t, t + dur + 0.05), bp = S.filter('bandpass', f, 2.5), g = ctx.createGain();
    for (let k = 0; k <= 8; k++) bp.frequency.setValueAtTime(f * (0.8 + 0.5 * S.rng.next()), t + (k / 8) * dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.02); g.gain.setValueAtTime(vol * 0.8, t + dur * 0.7); g.gain.linearRampToValueAtTime(0, t + dur);
    n.connect(bp); bp.connect(g); g.connect(S.panned(dest, pan));
  }
  // a big structural crash: low boom, crunch, a scatter of clatter after it
  crash(t, vol, pan, dest, rev, clatter = 8, spread = 0.9) {
    const S = this.S;
    S.boom(t, vol * 0.8, S.panned(dest, pan), rev);
    S.crunch(t + 0.01, vol, pan, dest, rev);
    S.thump(t, vol * 0.7, dest);
    for (let k = 0; k < clatter; k++) S.clunk(t + 0.08 + spread * Math.pow(S.rng.next(), 1.6), vol * S.rng.range(0.15, 0.4), MathX.clamp(pan + S.rng.range(-0.3, 0.3), -1, 1), dest);
  }
  // running water: a roar (low) and a hiss (high), shaped by `shape(t)` 0..1
  water(t0, t1, vol, pan, dest, shape) {
    const S = this.S, ctx = S.ctx;
    for (const [type, f, q, k] of [['pink', 700, 0.6, 1.0], ['white', 3200, 0.5, 0.35]]) {
      const n = S.noise(type, t0, t1), bp = S.filter(type === 'pink' ? 'lowpass' : 'bandpass', f, q), g = ctx.createGain();
      g.gain.setValueAtTime(0, t0);
      for (let t = t0; t <= t1; t += 0.1) g.gain.linearRampToValueAtTime(vol * k * shape(t), t);
      n.connect(bp); bp.connect(g); g.connect(S.panned(dest, pan));
    }
  }
  // a moving engine (sawtooth hum + rumble), spatialised along posFn
  engine(posFn, t0, t1, f, vol, dest, ref = 6) {
    const S = this.S, ctx = S.ctx, pts = this._spatial(posFn, t0, t1, 1 / 20, ref);
    const o = ctx.createOscillator(), lp = S.filter('lowpass', f * 6, 0.8), n = S.noise('brown', t0, t1), nl = S.filter('lowpass', 260, 0.7), g = ctx.createGain(), p = ctx.createStereoPanner();
    o.type = 'sawtooth'; o.connect(lp); lp.connect(g); n.connect(nl); nl.connect(g); g.connect(p); p.connect(dest);
    this._applySpatial(pts, g.gain, p.pan, [[o.frequency, f]], vol);
    o.start(t0); o.stop(t1);
  }

  /* ---- the street ---- */
  _bed(S, ctx, world) {
    const END = CONFIG.duration, T = GV;
    // city traffic hum and distant life
    for (const [type, f, q, v] of [['brown', 320, 0.7, 0.32], ['pink', 1600, 0.5, 0.05]]) {
      const n = S.noise(type, 0, END), b = S.filter('lowpass', f, q), g = ctx.createGain();
      g.gain.setValueAtTime(v, 0); g.gain.setValueAtTime(v, GV_FALL.load.hit - 0.2); g.gain.linearRampToValueAtTime(v * 0.25, GV_FALL.load.hit + 1.0); g.gain.linearRampToValueAtTime(v * 0.12, END);
      n.connect(b); b.connect(g); g.connect(world);
    }
    // birds in the trees — until the change (they drop out of the trees and go quiet)
    for (let t = 0.1; t < T.g0 + 0.2; t += S.rng.range(0.18, 0.5)) S.chirp(t, S.rng.range(2600, 4200), 0.05, S.rng.range(-0.8, 0.8), world, false);
    for (let k = 0; k < 6; k++) S.flap(T.g0 + 0.15 + k * 0.09, S.rng.range(-0.8, 0.8), 0.05, world);
    for (let t = 9; t < 52; t += S.rng.range(2.5, 6)) S.chirp(t, S.rng.range(2400, 3600), 0.018, S.rng.range(-0.9, 0.9), world, true);
    // a hammer on the scaffold before the change
    for (let t = 0.15; t < T.g0; t += 0.42) { const a = this.at(11.7, -12.5, t, 10); S.click(t, 0.12 * a.g, a.pan, world); S.clunk(t, 0.06 * a.g, a.pan, world); }
    // the crane's diesel: always there, under everything, until the load lets go
    { const a = this.at(-4.4, -33.5, 0, 12), o = ctx.createOscillator(), lp = S.filter('lowpass', 220, 0.9), g = ctx.createGain(), p = S.panned(world, a.pan * 0.5);
      o.type = 'sawtooth'; o.frequency.setValueAtTime(46, 0); o.frequency.setValueAtTime(46, T.g0); o.frequency.linearRampToValueAtTime(41, T.g0 + 0.6); o.frequency.linearRampToValueAtTime(52, T.g0 + 2.5);
      g.gain.setValueAtTime(0.09 * a.g, 0); g.gain.setValueAtTime(0.09 * a.g, T.drop + 1.0); g.gain.linearRampToValueAtTime(0.0, T.drop + 3);
      o.connect(lp); lp.connect(g); g.connect(p); o.start(0); o.stop(T.drop + 3.2); }
  }

  /* ---- you: steps, the bag, breathing, the fall, getting up ---- */
  _you(S, ctx, you) {
    const T = GV, C = SCRIPT.camera, zT = new Track(C.z);
    let walked = 0, next = 0.66, pz = zT.value(0);
    for (let t = 0; t < CONFIG.duration; t += 1 / 60) {
      const z = zT.value(t); walked += Math.abs(z - pz); pz = z;
      if (walked >= next) { S.step(t, t < T.g0 ? 0.2 : 0.3, (Math.round(next / 0.66) % 2 ? 0.15 : -0.15), you); next += 0.66; }
    }
    // the bag: paper rustle as it swings, the yank, the set-down
    for (let t = 0.3; t < T.g0; t += 0.66) S.hiss(t, 0.12, 0.012, 0.3, you);
    S.hiss(T.g0 + 0.05, 0.25, 0.05, 0.3, you); S.clunk(T.g0 + 0.12, 0.12, 0.3, you);
    S.hiss(T.bagDown[0] + 0.1, 0.5, 0.03, 0.3, you);
    S.thump(T.bagDown[0] + 0.62, 0.35, you); S.clunk(T.bagDown[0] + 0.62, 0.1, 0.3, you); S.hiss(T.bagDown[1], 0.3, 0.035, 0.3, you);
    // breathing: calm, then laboured under the weight (rate from the breathRate track), panting after the fall
    const BR = SCRIPT_TRACKS.breathRate;
    for (let t = 0.4; t < GV_FALL.load.hit - 0.3; ) {
      const rate = BR.value(t), per = 60 / rate, hard = MathX.smooth(t, T.g0, T.g0 + 1.5);
      const loud = 0.025 + 0.06 * hard + 0.08 * MathX.window(t, T.trip, T.up[1] + 1.5, 0.3, 1.5);
      S.breath(t, per * 0.42, true, loud, you); S.breath(t + per * 0.45, per * 0.5, false, loud * 1.15, you);
      t += per;
    }
    // the change: the air pushed out of you; effort grunts while you lower the bag and get up
    S.voice(T.g0 + 0.08, 118, 0.22, 'u', 0.05, 0, you, 0.8);
    S.voice(T.bagDown[0] + 0.5, 112, 0.35, 'u', 0.035, 0, you, 0.85);
    // the trip: a scuff, knees and hands on the pavement, the breath knocked out
    S.hiss(T.trip, 0.2, 0.05, 0.1, you);
    S.thump(T.trip + 0.33, 0.9, you); S.clunk(T.trip + 0.34, 0.25, -0.1, you);
    S.click(T.trip + 0.43, 0.2, 0.3, you); S.click(T.trip + 0.45, 0.2, -0.3, you); S.thump(T.trip + 0.44, 0.35, you);
    S.voice(T.trip + 0.36, 104, 0.3, 'o', 0.07, 0, you, 0.7);
    for (let k = 0; k < 10; k++) S.heart(T.trip + 0.6 + k * 0.52, 0.22 * (1 - k / 12), you);
    S.voice(T.up[0] + 0.7, 110, 0.55, 'u', 0.045, 0, you, 0.9); S.voice(T.up[0] + 2.1, 114, 0.6, 'a', 0.045, 0, you, 0.85);
    S.hiss(T.up[0] + 0.6, 0.4, 0.02, 0, you); S.hiss(T.up[0] + 2.2, 0.5, 0.02, 0, you);
  }

  /* ---- the change: one deep hit, then everything that carries weight complains ---- */
  _change(S, ctx, world, rev) {
    const t = GV.g0;
    S.whump(t, 0.9, 0, world);
    S.boom(t + 0.02, 0.35, world, rev);
    // a sub swell under it (the feel of the floor pushing up at you)
    S.tone(t, 1.6, 34, 0.35, 0, world, 'sine', 0.05, 1.3);
    // creaks all round: scaffold, awning, crane, the bench, the street furniture
    const src = [[11.6, -15, 64, 0.11], [11.4, -6.7, 92, 0.07], [-4.4, -33.5, 52, 0.09], [11.8, -2.4, 140, 0.05], [-16.5, -3, 70, 0.06], [-22, -30, 58, 0.06]];
    src.forEach(([x, z, f, v], i) => { const a = this.at(x, z, t + 0.1); this.creak(t + 0.08 + i * 0.06, 1.6 + 0.4 * S.rng.next(), f, v * (0.5 + a.g), a.pan, world); });
    // every car on the street drops on its springs: a ripple of suspension clunks
    for (const c of [[5.6, 36], [-5.6, 3.5], [-5.6, 9.8], [-5.6, 16.2], [-5.6, 22.6], [1.75, 2], [5.25, 0], [9.25, -15.6], [5.6, -42], [5.6, -52]]) {
      const a = this.at(c[0], c[1], t); S.clunk(t + 0.05 + S.rng.range(0, 0.12), 0.35 * a.g, a.pan, world);
    }
    // scaffold couplers ticking as the joints take up the slack
    for (let k = 0; k < 14; k++) { const tt = t + 0.1 + S.rng.range(0, 1.4), a = this.at(11.6, -18, tt); S.click(tt, 0.12 * a.g, a.pan, world); }
  }

  /* ---- people ---- */
  _people(S, ctx, world) {
    const T = GV;
    // the kid's hops: the two happy landings, a giggle; then the tiny hop at 2 G
    for (const H of GV_HOPS) { const a = this.at(9.75, -6.3, H.t + H.T); S.step(H.t + H.T, 0.14 * a.g * (H.g > GV_G0 ? 0.6 : 1), a.pan, world); }
    { const a = this.at(9.75, -6.3, 0.4); S.laugh(0.42, 0.04 * a.g, a.pan, world, 520, 4); S.voice(T.kidJump - 0.15, 420, 0.25, 'u', 0.035 * a.g, a.pan, world, 0.9); S.voice(T.kidJump + 0.4, 460, 0.3, 'o', 0.03 * a.g, a.pan, world, 0.8); }
    // gasps along the street when it hits
    for (const [x, z, f, dt] of [[10.55, -7.1, 230, 0.12], [8.05, -3.4, 140, 0.2], [-8.7, -4.0, 210, 0.15], [-10.1, -25, 220, 0.3]]) { const a = this.at(x, z, T.g0); S.voice(T.g0 + dt, f, 0.28, 'a', 0.04 * a.g, a.pan, world, 0.8); }
    // the old man: the push, the effort, falling back, the sigh; the bench creaks
    { const a = this.at(11.87, -2.1, T.oldMan[0]), t0 = T.oldMan[0];
      this.creak(t0 + 0.9, 1.2, 180, 0.03 * a.g, a.pan, world);
      S.voice(t0 + 1.1, 112, 0.9, 'o', 0.05 * a.g, a.pan, world, 0.85); S.thump(t0 + 2.5, 0.2 * a.g, world); this.creak(t0 + 2.45, 0.5, 150, 0.04 * a.g, a.pan, world);
      S.breath(t0 + 2.9, 0.9, false, 0.04 * a.g, world); }
    // the paramedics: effort, a dropped bag
    { const a = this.at(5, -9, T.limit); S.voice(T.limit + 0.5, 150, 0.4, 'u', 0.035 * a.g, a.pan, world, 0.85); S.thump(T.limit + 1.4, 0.12 * a.g, world); S.voice(T.limit + 1.6, 210, 0.5, 'a', 0.03 * a.g, a.pan, world, 0.75); }
    // shouts when the brake slips
    { const a = this.at(-2.7, -25.4, T.slips[0]); S.voice(T.slips[0] + 0.15, 190, 0.35, 'e', 0.07 * a.g, a.pan, world, 1.1); S.voice(T.slips[1] + 0.1, 200, 0.5, 'a', 0.08 * a.g, a.pan, world, 0.9); S.voice(T.drop + 0.1, 230, 0.6, 'o', 0.08 * a.g, a.pan, world, 0.8); }
  }

  /* ---- the loading bay, the pallet, the pickup ---- */
  _pallet(S, ctx, world, rev) {
    const B = GV.bay, P = GV_FALL.pallet, a = this.at(9.6, -15.8, B.creak);
    this.creak(B.creak, B.crack - B.creak + 0.1, 58, 0.18 * a.g + 0.05, a.pan, world);
    this.creak(B.creak + 0.3, 0.7, 96, 0.08 * a.g + 0.02, a.pan, world);
    S.backfire(B.crack, 0.5 * a.g + 0.1, world, true); S.clunk(B.crack + 0.01, 0.5 * a.g, a.pan, world); S.ring(B.crack + 0.02, 0.5, 1300, 0.02, world);
    this.scrape(B.crack + 0.1, B.drop - B.crack - 0.05, 700, 0.08 * a.g, a.pan, world);
    S.hiss(P.t0 + 0.2, P.T2 - 0.2, 0.03, a.pan, world);
    const h = this.at(9.36, -15.85, P.hit);
    this.crash(P.hit, 0.8 * h.g + 0.25, h.pan, world, rev, 12, 0.8);
    for (let k = 0; k < 9; k++) S.tick(P.hit + 0.02 + S.rng.range(0, 0.3), S.rng.range(3000, 6000), 0.05, world);   // the windscreen
    // the pickup's alarm: on until the next disaster drowns it out
    const pts = this._spatial(() => ({ x: 9.25, z: -15.6 }), P.hit + 0.6, GV.scaffold.fold + 1.0, 1 / 10, 8);
    S.alarm(P.hit + 0.6, GV.scaffold.fold + 1.0, pts, world, rev, this);
  }

  /* ---- the coupe, the truck, the ambulance ---- */
  _cars(S, ctx, world, rev) {
    const tr = this.app.traffic, T = GV, pos = (c) => (t) => ({ x: c.x, z: c.zt.value(t) });
    const C = tr.coupe, K = tr.truck;
    this.engine(pos(C), T.coupe - 4, T.coupe + 6, 62, 0.16, world);
    for (let s = 0; s < 2; s++) { const ts = tr.scrapeT(s), a = this.at(C.x, C.zt.value(ts), ts); this.scrape(ts, s ? 0.3 : 0.42, 2600, 0.35 * a.g + 0.05, a.pan, world); S.clunk(ts, 0.4 * a.g, a.pan, world); }
    this.engine(pos(K), T.truck - 4, T.truck + 6, 38, 0.24, world, 8);
    const sn = tr.snapT(), a = this.at(K.x, K.zt.value(sn), sn);
    S.backfire(sn, 0.7 * a.g + 0.1, world, true); S.clunk(sn, 0.6 * a.g, a.pan, world); S.ring(sn + 0.01, 0.9, 820, 0.03, world);
    this.scrape(sn + 0.05, 1.2, 900, 0.07 * a.g, a.pan, world);
    { const b = this.at(K.x, -33.5, T.truck + 4.8); S.hiss(T.truck + 4.8, 0.9, 0.06 * b.g + 0.01, b.pan, world); }
    // other traffic passing
    for (const id of ['sedanA', 'taxi', 'suvA', 'hatchA', 'sedanB', 'vanB']) { const c = tr.cars.find((k) => k.id === id); this.engine(pos(c), 0, 50, 50 + 10 * S.rng.next(), 0.06, world); }
    // the ambulance: siren from behind you, stopping by the wreck
    const M = tr.amb, pts = this._spatial(pos(M), 44.5, 51.2, 1 / 15, 10);
    S.alarm(44.5, 51.2, pts, world, rev, this);
    this.engine(pos(M), 44, CONFIG.duration, 44, 0.1, world);
  }

  /* ---- the crane: the outrigger, the overload alarm, the brake, the load, the boom ---- */
  _crane(S, ctx, world, rev) {
    const T = GV, cr = this.app.site.crane, P = GV_FALL.load;
    const pad = this.at(-0.8, -28.2, T.outrigger);
    S.crunch(T.outrigger, 0.6 * pad.g + 0.15, pad.pan, world, rev); S.thump(T.outrigger, 0.5, world); S.boom(T.outrigger, 0.18, world, rev);
    for (let k = 0; k < 10; k++) S.click(T.outrigger + 0.05 + S.rng.range(0, 0.6), 0.15 * pad.g, pad.pan, world);
    this.creak(T.outrigger + 0.1, 2.4, 48, 0.12 * pad.g + 0.04, pad.pan, world);
    // the overload alarm: a hard beep from the crane
    const beep = (t0, t1, per) => { for (let t = t0; t < t1; t += per) { const a = this.at(-4.4, -33.5, t, 12); S.tone(t, per * 0.5, 2900, 0.05 * a.g + 0.01, a.pan, world, 'square', 0.006, 0.02); } };
    beep(T.outrigger + 0.3, T.outrigger + 4.5, 0.5); beep(T.slips[0] - 0.4, T.drop + 0.05, 0.25);
    // the hoist brake slipping: a clack, the rope running a little, a groan
    for (const ts of T.slips) { const a = this.at(-4.4, -33.5, ts, 12); S.clunk(ts, 0.5 * a.g + 0.1, a.pan, world); S.ring(ts + 0.01, 0.35, 1600, 0.02, world); this.scrape(ts + 0.02, 0.14, 4200, 0.12 * a.g, a.pan, world); this.creak(ts + 0.1, 0.8, 55, 0.1 * a.g, a.pan, world); }
    // the brake lets go: a bang, the rope screaming off the drum, the air
    { const a = this.at(-4.4, -33.5, T.drop, 12); S.backfire(T.drop, 0.6 * a.g + 0.15, world, true); S.ring(T.drop, 0.6, 1100, 0.03, world);
      this.scrape(T.drop + 0.03, P.T2, 5200, 0.15 * a.g + 0.03, a.pan, world);
      const n = S.noise('pink', T.drop, P.hit), bp = S.filter('bandpass', 400, 0.8), g = ctx.createGain();
      bp.frequency.setValueAtTime(300, T.drop); bp.frequency.linearRampToValueAtTime(1400, P.hit); g.gain.setValueAtTime(0, T.drop); g.gain.linearRampToValueAtTime(0.06, P.hit - 0.02); g.gain.linearRampToValueAtTime(0, P.hit);
      n.connect(bp); bp.connect(g); g.connect(world); }
    // the hit: the biggest sound of the film
    { const a = this.at(cr._fallXZ[0], cr._fallXZ[1], P.hit); this.crash(P.hit, 1.0, a.pan, world, rev, 18, 1.6); S.boom(P.hit + 0.03, 0.8, world, rev); S.thump(P.hit + 0.02, 1.0, world);
      S.farBoom(P.hit + 0.1, 0.5, a.pan, world);
      for (let k = 0; k < 30; k++) S.click(P.hit + 0.4 + 1.6 * Math.pow(S.rng.next(), 1.5), 0.1, S.rng.range(-0.6, 0.6), world); }
    // the boom whipping back, groaning, then landing across the junction
    { const a = this.at(-6, -45, P.hit); this.creak(T.drop + 0.2, Math.max(0.5, cr.boomLand - T.drop - 0.2), 40, 0.14, a.pan, world);
      if (cr.boomLand < CONFIG.duration) { const b = this.at(-8, -52, cr.boomLand); this.crash(cr.boomLand, 0.75, b.pan, world, rev, 14, 1.2); S.farBoom(cr.boomLand + 0.05, 0.5, b.pan, world); } }
    // car alarms all down the street afterwards
    for (const [x, z, dt] of [[5.6, -42, 0.8], [-5.6, -50.5, 1.3], [5.6, -52, 2.1]]) { const pts = this._spatial(() => ({ x, z }), P.hit + dt, CONFIG.duration, 1 / 5, 10); S.alarm(P.hit + dt, CONFIG.duration, pts, world, rev, this); }
  }

  /* ---- the scaffold, the awning, the water tank ---- */
  _failures(S, ctx, world, rev) {
    const T = GV, F = T.scaffold;
    // the scaffold: groaning tubes, couplers popping, the fold, the landing, boards and bricks raining
    { const a = this.at(11.4, -18, F.bow); this.creak(F.bow - 0.6, F.fold - F.bow + 0.8, 72, 0.14 * a.g + 0.04, a.pan, world); this.creak(F.bow, F.fold - F.bow + 0.4, 118, 0.08 * a.g + 0.02, a.pan, world);
      for (let k = 0; k < 10; k++) { const tt = F.bow + S.rng.range(0, F.fold - F.bow + 0.4); S.ring(tt, 0.25, S.rng.range(1800, 3200), 0.012, world); S.click(tt, 0.18 * a.g, a.pan, world); }
      S.backfire(F.fold, 0.5 * a.g + 0.1, world, true);
      this.scrape(F.fold + 0.1, 0.9, 1800, 0.08 * a.g, a.pan, world);
      const l = this.at(5.5, -18, F.fold + 1.05); this.crash(F.fold + 1.05, 0.75 * l.g + 0.25, l.pan, world, rev, 22, 1.8); }
    // the awning: a creak, the tie rods snapping, the slap against the window, the sign hitting the pavement
    { const A = T.awning, a = this.at(11.4, -6.7, A); this.creak(A - 0.8, 0.9, 130, 0.1 * a.g, a.pan, world);
      S.ring(A, 0.3, 2100, 0.03, world); S.click(A, 0.3 * a.g, a.pan, world); S.ring(A + 0.05, 0.3, 1900, 0.025, world);
      S.whump(A + 0.42, 0.45 * a.g + 0.1, a.pan, world); S.crunch(A + 0.43, 0.3 * a.g, a.pan, world, rev);
      for (let k = 0; k < 6; k++) S.tick(A + 0.45 + S.rng.range(0, 0.25), S.rng.range(3000, 6000), 0.04, world);
      const sl = A + 0.25 + Math.sqrt(2 * (GV_CITY.awning.y - 0.6 - LAYOUT.curbH - 0.35) / GV_G); S.crunch(sl, 0.35 * a.g + 0.05, a.pan, world, rev); S.thump(sl, 0.25 * a.g, world); }
    // the water tank: steel legs groaning, buckling, the tank tipping, bursting, the water coming down
    { const t0 = T.tank, a = this.at(-16.5, -3, t0); this.creak(t0 - 1.2, 1.4, 50, 0.12 * a.g + 0.03, a.pan, world);
      S.clunk(t0, 0.4 * a.g + 0.05, a.pan, world); this.creak(t0, 0.85, 70, 0.1 * a.g, a.pan, world);
      const tb = t0 + 0.85; S.backfire(tb, 0.4 * a.g + 0.1, world, false); S.crunch(tb, 0.45 * a.g + 0.1, a.pan, world, rev);
      this.water(tb, tb + 7, 0.5 * a.g + 0.08, a.pan, world, (t) => MathX.smooth(t, tb, tb + 0.25) * Math.exp(-Math.max(0, t - tb - 0.4) / 1.8));
      const w = this.at(-11, -3, tb + 1.3); this.water(tb + 1.2, tb + 7, 0.6 * w.g + 0.08, w.pan, world, (t) => MathX.smooth(t, tb + 1.2, tb + 1.5) * Math.exp(-Math.max(0, t - tb - 1.6) / 1.8));
      S.whump(tb + 1.34, 0.3 * w.g, w.pan, world); }
  }

  /* ---- the airliner at full power ---- */
  _plane(S, ctx, world, rev) {
    const P = this.app.plane, t0 = GV.plane[0] - 0.4, t1 = 56, pos = (t) => { const v = P.position(t, new THREE.Vector3()); return { x: v.x, z: v.z, y: v.y }; };
    const pts = this._spatial(pos, t0, t1, 1 / 20, 60).map((p) => { const v = P.position(p.t, new THREE.Vector3()), d3 = Math.hypot(v.x - this.cx.value(p.t), v.y - 1.6, v.z - this.cz.value(p.t)); return Object.assign(p, { gain: 140 / (140 + d3) }); });
    const n = S.noise('pink', t0, t1), lp = S.filter('lowpass', 900, 0.6), n2 = S.noise('white', t0, t1), hp = S.filter('bandpass', 2400, 0.6), g = ctx.createGain(), p = ctx.createStereoPanner();
    const o = ctx.createOscillator(), og = ctx.createGain(); o.type = 'sawtooth'; og.gain.value = 0.15;
    n.connect(lp); lp.connect(g); n2.connect(hp); const hg = ctx.createGain(); hg.gain.value = 0.25; hp.connect(hg); hg.connect(g); o.connect(og); og.connect(g);
    g.connect(p); p.connect(world); const rv = ctx.createGain(); rv.gain.value = 0.4; g.connect(rv); rv.connect(rev);
    this._applySpatial(pts, g.gain, p.pan, [[o.frequency, 160], [lp.frequency, 900]], 0.75, (t) => MathX.smooth(t, t0, t0 + 0.8));
    o.start(t0); o.stop(t1);
  }

  /* ---- after: the ringing quiet, the closing chord ---- */
  _end(S, ctx, world, you, mus, rev) {
    const T = GV, P = GV_FALL.load;
    // a low pulse under the brake slipping (music supports; the sound effects lead)
    for (let t = T.slips[0] - 0.3; t < T.drop; t += 0.46) S.tone(t, 0.3, 49, 0.12, 0, mus, 'sine', 0.01, 0.25);
    // ears ringing after the hit
    S.tone(P.hit + 0.15, 2.8, 3950, 0.012, 0, you, 'sine', 0.05, 2.4);
    // the closing chord under the lines
    for (const [f, d] of [[110, 0], [164.8, 0.1], [220, 0.2], [277.2, 0.35], [329.6, 0.5]]) S.tone(T.lineA[0] - 0.3 + d, T.end - T.lineA[0] + 0.3 - d, f, 0.03, 0, mus, 'sine', 1.2, 2.2);
    S.pluck(T.lineA[0], 220, 0.12, 0, mus, 3.0, 0.4); S.pluck(T.lineB[0], 164.8, 0.12, 0, mus, 3.0, 0.4); S.pluck(T.lineB[0] + 0.02, 110, 0.1, 0, mus, 3.0, 0.4);
  }
}
