/* =====================================================================
   SOUNDTRACK — "What if friction disappeared for 60 seconds?"
   The physics drives the sound: every contact the simulation logged
   becomes an impact (metal crunch, plastic thump, a chair's clatter, a
   person's oof) at its place, panned and attenuated from where you are.
   The sound idea: sliding is nearly SILENT — scraping is friction — so
   once friction goes (1.5 s) the street turns eerily quiet under the
   motors, horns and voices; a low pulse keeps time. The countdown closes
   the world down to your heartbeat; the return (61.5 s, in slow motion)
   is one wall of screech, scrape and thud; then ringing, and one step
   that grips. Two buses: the WORLD (narrowed during the countdown) and YOU.
   ===================================================================== */

// film time of a simulation-time moment (inverse of frSimT: the 3× slow-motion window)
function frFilmT(s) { const S = FR_SLOW, s1 = S.t0 + (S.t1 - S.t0) / S.k; return s < S.t0 ? s : s < s1 ? S.t0 + (s - S.t0) * S.k : S.t1 + (s - s1); }

class FRAudio extends AudioEngine {
  constructor(tl, app) {
    super(tl);
    this.app = app;
    this.wavName = SCRIPT.meta.wav;
    // the listener rides your body in the simulation (the camera track only holds the walk)
    const W = app.world, o = {};
    this.cx = { value: (t) => W.sample('me', frSimT(t), o).x };
    this.cz = { value: (t) => W.sample('me', frSimT(t), o).z };
  }

  fingerprintData() {
    return [FR_CARS, FR_PARKED, FR_PEOPLE, FR_PROPS, FR_STATES, FR_STATIC, FR_WALK, FR_POLE, FR_HOLD, FR, FR_SLOW, FR_MONTAGE, FR_KNOCK, FR_RELEASE,
      String(frBuildWorld), Object.getOwnPropertyNames(SlideWorld.prototype).map((k) => String(SlideWorld.prototype[k])).join('')];
  }

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
    // mix → make-up gain → glue compressor → limiter
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.004; comp.release.value = 0.22;
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -2.5; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.12;
    const mixIn = ctx.createGain(); mixIn.gain.value = 5.0; mixIn.connect(comp);
    const out = ctx.createGain(); comp.connect(out); out.connect(lim); lim.connect(ctx.destination);
    out.gain.setValueAtTime(0.0001, 0); out.gain.linearRampToValueAtTime(0.9, 0.06);
    out.gain.setValueAtTime(0.9, end - 0.9); out.gain.linearRampToValueAtTime(0.0001, end);
    // WORLD bus: a low-pass + level the countdown closes down, an outdoor reflection send
    const world = ctx.createGain(), wlp = S.filter('lowpass', 18000, 0.5), wg = ctx.createGain();
    world.connect(wlp); wlp.connect(wg); wg.connect(mixIn);
    const rev = S.reverb(1.4), rs = ctx.createGain(); rs.gain.value = 0.35; rev.connect(rs); rs.connect(wlp);
    for (const [t, f, g] of this._narrow()) { wlp.frequency.linearRampToValueAtTime(f, t); wg.gain.linearRampToValueAtTime(g, t); }
    const you = ctx.createGain(); you.gain.value = 1; you.connect(mixIn);
    this.S = S; this.rev = rev;
    this._city(S, world, rev);
    this._steps(S, world);
    this._body(S, you, world);
    this._voices(S, world, rev);
    this._engines(S, world, rev);
    this._impacts(S, world, rev);
    this._montage(S, world, rev);
    this._return(S, world, you, rev);
    this._music(S, you);
  }

  // the world bus over time: [t, low-pass Hz, level]. Montage shots are their own places; the countdown closes it down to you.
  _narrow() {
    return [[0, 18000, 1], [46.45, 18000, 1], [46.5, 18000, 0.25], [54.45, 18000, 0.25], [54.5, 9000, 0.9], [56.0, 4000, 0.8], [58.5, 1400, 0.55], [61.45, 500, 0.35],
      [61.5, 18000, 1.0], [64.6, 14000, 0.95], [66.0, 6000, 0.55], [68.0, 9000, 0.6], [75.5, 12000, 0.7]];
  }

  // distance gain and pan of a world point at (film) time t, as heard from your body
  _at(x, z, t, ref = 8) {
    const lx = this.cx.value(t), lz = this.cz.value(t), yaw = MathX.deg(this.cyaw.value(t));
    const dx = x - lx, dz = z - lz, d = Math.max(0.6, Math.hypot(dx, dz)), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    return { g: ref / (ref + d), pan: MathX.clamp((dx * rx + dz * rz) / d, -1, 1) * 0.85, d };
  }

  /* the city: air, distant traffic, birds; once friction goes the distance fills with horns, motors, alarms and the odd crash */
  _city(S, bus, rev) {
    const ctx = S.ctx, end = CONFIG.duration + 0.5, T0 = FR.tLoss;
    const air = S.noise('pink', 0, end), lp = S.filter('lowpass', 1300, 0.4), hp = S.filter('highpass', 70, 0.5), g = ctx.createGain();
    g.gain.setValueAtTime(0.11, 0); air.connect(hp); hp.connect(lp); lp.connect(g); g.connect(bus);
    const rum = S.noise('brown', 0, end), rl = S.filter('lowpass', 240, 0.7), rg = ctx.createGain();
    rg.gain.setValueAtTime(0.26, 0); rg.gain.setValueAtTime(0.26, T0); rg.gain.linearRampToValueAtTime(0.12, T0 + 3); rum.connect(rl); rl.connect(rg); rg.connect(bus);
    const rng = new RNG(CONFIG.seed + 5);
    for (let t = 0.1; t < end; t += rng.range(0.25, 0.9)) { const n = rng.int(2, 4), base = rng.range(2700, 4500), pan = rng.range(-0.8, 0.8), v = rng.range(0.006, 0.014) * (t < T0 ? 1 : 0.6); for (let k = 0; k < n; k++) S.chirp(t + k * rng.range(0.07, 0.12), base * rng.range(0.92, 1.12), v, pan, bus, t > T0 && t < T0 + 3); }
    S.horn(0.5, 392, 466, 0.006, -0.6, rev);
    for (let t = T0 + 0.9; t < 61; t += rng.range(0.8, 2.4)) { const f = rng.range(300, 470); S.horn(t, f, f * rng.range(1.15, 1.3), rng.range(0.003, 0.008), rng.range(-0.9, 0.9), rev); }
    for (let t = T0 + 3.5; t < 61; t += rng.range(2.5, 5.5)) S.crunch(t, rng.range(0.03, 0.07), rng.range(-0.9, 0.9), rev, rev);
    // a distant voice or two shouting, all through the minute
    for (let t = T0 + 2.0; t < 60; t += rng.range(1.8, 4.0)) S.voice(t, rng.range(180, 420), rng.range(0.2, 0.4), rng.pick(['a', 'o', 'e']), 0.008, rng.range(-0.9, 0.9), rev, rng.range(0.75, 1.1));
    for (const [t0, pan, f] of [[8.0, -0.7, 0.9], [14.7, 0.6, 1.05], [22.0, 0.2, 0.95], [31.0, -0.3, 1.1]]) {
      const o = ctx.createOscillator(), og = ctx.createGain(), ol = S.filter('lowpass', 1800, 0.7); o.type = 'square';
      for (let t = t0; t < end; t += 0.4) o.frequency.setValueAtTime((Math.floor((t - t0) / 0.4) % 2 ? 1100 : 820) * f, t);
      og.gain.setValueAtTime(0, t0); og.gain.linearRampToValueAtTime(0.0035, t0 + 0.1);
      o.connect(ol); ol.connect(og); og.connect(S.panned(rev, pan)); o.start(t0); o.stop(end);
    }
  }

  /* your footsteps while you walk; a skid at 1.05 (friction 0.2); the slip — the last friction sound for a minute */
  _steps(S, bus) {
    const ctx = S.ctx;
    for (let t = 0.1, side = 1; t < FR.tLoss - 0.05; t += 1 / (CONFIG.camera.bobFrequency * FR_WALK.v), side = -side) S.step(t, 0.07, side * 0.1, bus);
    for (const [t0, v] of [[1.05, 0.025], [1.46, 0.05]]) {
      const n = S.noise('white', t0, t0 + 0.28), bp = S.filter('bandpass', 2600, 2.5), g = ctx.createGain();
      bp.frequency.setValueAtTime(3400, t0); bp.frequency.linearRampToValueAtTime(1500, t0 + 0.22);
      S.env(g, t0, 0.02, v, 0.2); n.connect(bp); bp.connect(g); g.connect(bus);
    }
  }

  /* you: the gasp, the phone, chest-first into the pole, straining to step, knocked loose, sliding, standing up, one gripping step */
  _body(S, you, world) {
    const ctx = S.ctx, end = CONFIG.duration;
    S.gasp(1.52, 0.05, you);
    const rustle = (t, d, v, f = 2400) => { const n = S.noise('white', t, t + d), bp = S.filter('bandpass', f, 0.8), g = ctx.createGain(); S.env(g, t, d * 0.4, v, d * 0.6); n.connect(bp); bp.connect(g); g.connect(you); };
    rustle(1.5, 0.5, 0.02); rustle(3.2, 0.4, 0.014);
    // the phone hits the pavement and skates away without a sound
    S.click(1.98, 0.05, -0.2, world); S.clunk(1.98, 0.018, -0.2, world); S.click(2.04, 0.02, -0.2, world);
    // chest into the sign pole: a body thud and a ring up the metal; your foot finds the kerb
    const clang = (t, v) => { for (const [f, d, a] of [[611, 1.2, 1], [1503, 0.7, 0.5], [2650, 0.45, 0.3], [3990, 0.3, 0.2]]) S.tone(t, d, f, v * a, 0.1, world, 'sine', 0.006, d * 0.9); S.clunk(t, v * 1.3, 0.1, world); };
    S.thump(3.56, 0.12, you); clang(3.57, 0.03); S.voice(3.6, 130, 0.2, 'u', 0.03, 0, you, 0.75); rustle(3.56, 0.5, 0.02, 1500);
    S.clunk(4.28, 0.04, 0.3, world);                                                                  // shoe against the kerb face
    // trying to step: a strained breath, a grunt as your feet go, your hands sliding down the pole (silently) — a soft ring as they stop
    S.breath(4.35, 0.35, true, 0.03, you); S.voice(4.58, 150, 0.25, 'a', 0.03, 0, you, 0.75); rustle(4.55, 0.6, 0.016, 1600); clang(5.05, 0.01);
    // knocked off the pole: the hit, your shout, sitting down hard
    S.thump(34.0, 0.18, you); S.voice(34.05, 165, 0.3, 'o', 0.05, 0, you, 0.7); rustle(34.0, 0.7, 0.03, 1200);
    { const n = S.noise('pink', 34.45, 34.8), lp = S.filter('lowpass', 400, 0.7), g = ctx.createGain(); S.env(g, 34.45, 0.01, 0.06, 0.25); n.connect(lp); lp.connect(g); g.connect(you); }
    S.thump(40.5, 0.1, you); S.voice(40.55, 175, 0.18, 'e', 0.035, 0, you, 0.8); rustle(40.5, 0.5, 0.02, 1400);
    S.thump(44.3, 0.08, you);                                                                           // off the kerb into the road
    S.thump(50.6, 0.07, you);                                                                           // the far kerb
    // breathing: calm while walking, fast and shallow for the minute, held through 3-2-1, then long and shaky after
    for (let t = 0.5; t < end - 1;) {
      const fast = t > 1.5 && t < 58.3, after = t > 63, held = t > 58.3 && t < 61.6;
      const v = fast ? 0.013 : after ? 0.014 : 0.004, din = fast ? 0.48 : after ? 1.1 : 1.2, dout = fast ? 0.52 : after ? 1.6 : 1.4;
      if (!held && !(t > 3.45 && t < 3.8) && !(t > 4.3 && t < 4.9) && !(t > 46.4 && t < 54.6)) { S.breath(t, din, true, v, you); S.breath(t + din + 0.05, dout, false, v * 0.9, you); }
      t += din + dout + (fast ? 0.1 : 0.6);
    }
    S.breath(58.15, 0.5, true, 0.03, you);                                                              // the breath you hold
    S.breath(64.8, 2.2, false, 0.03, you);                                                              // …and let go
    // standing up, then one step — and the sole grips: a little squeak, the first friction sound you've noticed in your life
    rustle(67.6, 1.4, 0.022, 1300); S.voice(68.3, 140, 0.25, 'u', 0.02, 0, you, 0.8);
    S.step(70.85, 0.12, 0.05, world);
    { const o = ctx.createOscillator(), g = ctx.createGain(), bp = S.filter('bandpass', 2200, 6); o.type = 'sawtooth'; o.frequency.setValueAtTime(1900, 70.86); o.frequency.linearRampToValueAtTime(2500, 70.95);
      g.gain.setValueAtTime(0, 70.86); g.gain.linearRampToValueAtTime(0.03, 70.88); g.gain.linearRampToValueAtTime(0, 70.98); o.connect(bp); bp.connect(g); g.connect(world); o.start(70.86); o.stop(71.0); }
    S.step(71.7, 0.08, -0.05, world);
  }

  /* people: yelps as they go down, shouts, a nervous laugh (times on the film clock) */
  _voices(S, bus, rev) {
    const W = this.app.world, s = {};
    const at = (id, t) => { W.sample(id, frSimT(t), s); return this._at(s.x, s.z, t, 6); };
    const yell = (id, t, f0, vowels, vol, glide = 0.8) => { let tt = t; for (const [v, d] of vowels) { const p = at(id, tt); S.voice(tt, f0, d, v, vol * p.g, p.pan, bus, glide); tt += d + 0.03; f0 *= 0.92; } };
    yell('W1', 1.7, 420, [['a', 0.22], ['a', 0.14]], 0.07, 0.7);           // "ah—"
    yell('W2', 1.92, 190, [['o', 0.16], ['a', 0.24]], 0.08, 0.75);         // "whoa"
    yell('J', 1.82, 380, [['e', 0.2]], 0.04, 0.7);
    yell('W6', 2.5, 360, [['a', 0.15], ['e', 0.15], ['a', 0.2]], 0.03, 0.9);
    yell('W3', 5.3, 175, [['o', 0.14], ['o', 0.3]], 0.07, 0.8);            // "no no no"
    yell('W3', 5.9, 170, [['o', 0.12], ['o', 0.12], ['o', 0.2]], 0.06, 0.85);
    yell('W2', 6.4, 185, [['e', 0.12], ['i', 0.25]], 0.05, 1.1);           // "hey!"
    yell('W5', 8.1, 200, [['a', 0.3]], 0.045, 0.7);
    S.laugh(9.1, 0.012, 0.5, rev, 260, 4);
    yell('W6', 10.7, 340, [['e', 0.14], ['o', 0.3]], 0.03, 0.85);
    yell('W1', 16.4, 410, [['a', 0.16]], 0.04, 0.8);
    yell('W3', 33.8, 180, [['o', 0.3]], 0.06, 0.8);
  }

  /* motors and horns, from the simulation. K is electric: floored, its motor whines up as the wheels spin in the air of no-friction */
  _engines(S, bus, rev) {
    const ctx = S.ctx, W = this.app.world, end = CONFIG.duration + 0.5, s = {};
    for (const [id, type, , , , , , o] of FR_CARS) {
      const pos = (t) => W.sample(id, frSimT(t), s);
      let minD = 1e9; for (let t = 0; t < end; t += 0.5) { const p = pos(t); minD = Math.min(minD, Math.hypot(p.x - this.cx.value(t), p.z - this.cz.value(t))); }
      if (minD > 60) continue;
      const pts = this._spatial(pos, 0, end, 1 / 30, 7);
      const acts = ((o && o.actions) || [[0, 'roll']]).map(([t, a]) => [t - FR.shift, a]);
      const act = (t) => { let a = 'roll'; for (const k of acts) if (k[0] <= t) a = k[1]; else break; return a; };
      const big = type === 'truck' || type === 'van' || type === 'suv';
      const wr = (t) => Math.abs(W.sample(id, frSimT(t), s).wheelRate);
      if (type !== 'ev') {
        const f0 = big ? 38 : 46 + (id.charCodeAt(0) % 7) * 2, sp = (t) => W.sample(id, frSimT(t), s).speed;
        const rpm = (t) => (t < FR.tLoss ? f0 * (0.75 + Math.min(1, sp(t) / 12) * 0.55) : f0 * 0.72);
        const saw = ctx.createOscillator(), sq = ctx.createOscillator(), lp = S.filter('lowpass', big ? 520 : 820, 1.1), g = ctx.createGain(), p = ctx.createStereoPanner(), sqg = ctx.createGain();
        saw.type = 'sawtooth'; sq.type = 'square'; sqg.gain.value = 0.45;
        saw.connect(lp); sq.connect(sqg); sqg.connect(lp); lp.connect(g); g.connect(p); p.connect(bus);
        const send = ctx.createGain(); send.gain.value = 0.2; p.connect(send); send.connect(rev);
        this._applySpatial(pts, g.gain, p.pan, [[saw.frequency, rpm], [sq.frequency, (t) => rpm(t) * 0.5]], big ? 0.07 : 0.05);
        saw.start(0); sq.start(0); saw.stop(end); sq.stop(end);
      } else {
        // electric: a soft hum at rest, a climbing whine with the wheel speed when floored
        const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner(), m = ctx.createGain(); o1.type = 'triangle'; o2.type = 'sine'; m.gain.value = 0.6;
        o1.connect(g); o2.connect(m); m.connect(g); g.connect(p); p.connect(bus);
        this._applySpatial(pts, g.gain, p.pan, [[o1.frequency, (t) => 380 + wr(t) * 14], [o2.frequency, (t) => 1150 + wr(t) * 38]], id === 'K' ? 0.05 : 0.02, (t) => 0.25 + MathX.smooth(wr(t), 3, 40) * 1.6);
        o1.start(0); o2.start(0); o1.stop(end); o2.stop(end);
      }
      // spinning tyres in the air of no friction: a whir that climbs with the wheel speed (no screech, no smoke)
      if (acts.some((k) => k[1] === 'gas')) {
        const n = S.noise('pink', 0, end), bp = S.filter('bandpass', 400, 3), g = ctx.createGain(), p = ctx.createStereoPanner();
        n.connect(bp); bp.connect(g); g.connect(p); p.connect(bus);
        this._applySpatial(pts, g.gain, p.pan, [[bp.frequency, (t) => 200 + wr(t) * 18]], 0.1, (t) => MathX.smooth(wr(t), 5, 30));
      }
      // rolling tyre noise before friction goes; after it, only the wind of anything moving fast
      { const n = S.noise('white', 0, end), bp = S.filter('bandpass', 700, 0.7), g = ctx.createGain(), p = ctx.createStereoPanner();
        n.connect(bp); bp.connect(g); g.connect(p); p.connect(bus);
        this._applySpatial(pts, g.gain, p.pan, [[bp.frequency, (t) => (t < FR.tLoss ? 500 : 900) + W.sample(id, frSimT(t), s).speed * 30]], 0.1, (t) => (t < FR.tLoss || t > FR.tBack ? 1 : 0.25) * Math.min(1, W.sample(id, frSimT(t), s).speed / 10) ** 1.6); }
      for (const [t0, d] of (o && o.horns) || []) {
        const t = t0 - FR.shift, q = this._at(W.sample(id, frSimT(t), s).x, s.z, t, 10), f = big ? 300 : 392 + (id.charCodeAt(0) % 5) * 12;
        for (let k = 0; k * 0.45 < d; k++) S.horn(t + k * 0.45, f, f * 1.26, 0.05 * q.g, q.pan, bus);
      }
    }
  }

  /* every logged contact becomes a sound at its place (on the film clock) */
  _impacts(S, bus, rev) {
    const W = this.app.world, kind = (id) => (id === null ? 'static' : W.byId[id] ? (W.byId[id].kind === 'car' ? 'car' : W.byId[id].kind === 'person' || id === 'me' ? 'person' : (FR_PROPS.find((p) => p[0] === id) || [0, 'prop'])[1]) : 'static');
    const ctx = S.ctx;
    for (const e of W.events) {
      if (e.dv < 0.7 || e.t > FR.tBack) continue;
      const t = frFilmT(e.t);
      if (t > 46.45 && t < 54.5) continue;                                                              // (the montage is elsewhere)
      const q = this._at(e.x, e.z, t, 9), A = kind(e.a), B = kind(e.b), dv = e.dv;
      const has = (k) => A === k || B === k;
      if (has('car') && A === B) {
        const v = Math.min(0.9, 0.05 * dv) * q.g * 2.2;
        S.crunch(t, v, q.pan, bus, rev);
        if (dv > 4) for (let k = 0; k < 8; k++) S.tone(t + 0.03 + k * 0.035 + S.rng.range(0, 0.04), 0.06, S.rng.range(3000, 6500), v * 0.12, q.pan, bus, 'sine', 0.006, 0.05);   // glass
      } else if (has('car')) {
        if (has('static')) { S.clunk(t, Math.min(0.5, 0.05 * dv) * q.g * 2, q.pan, bus); S.thump(t, Math.min(0.3, 0.03 * dv) * q.g * 2, bus); }
        else if (has('person')) { S.thump(t, 0.1 * q.g, bus); }
        else { S.clunk(t, Math.min(0.35, 0.04 * dv) * q.g * 2, q.pan, bus); for (let k = 0; k < 3; k++) S.click(t + k * 0.03, 0.05 * q.g, q.pan, bus); }
      } else if (has('person')) {
        S.thump(t, Math.min(0.12, 0.03 * dv) * q.g * 2, bus);
      } else if (has('chair') || has('cart') || has('bike') || has('cage')) {
        for (let k = 0; k < 4; k++) S.click(t + k * 0.025 + S.rng.range(0, 0.02), Math.min(0.12, 0.03 * dv) * q.g * 2, q.pan, bus);
        S.tone(t, 0.18, S.rng.range(700, 1400), 0.02 * q.g * Math.min(2, dv / 2), q.pan, bus, 'triangle', 0.006, 0.15);
      } else if (has('bin') || has('box')) {
        const n = S.noise('brown', t, t + 0.25), lp = S.filter('lowpass', 420, 0.8), g = ctx.createGain(); S.env(g, t, 0.006, Math.min(0.2, 0.05 * dv) * q.g * 2, 0.18); n.connect(lp); lp.connect(g); g.connect(S.panned(bus, q.pan));
      } else if (has('phone')) {
        S.click(t, 0.04 * q.g, q.pan, bus);
      } else {
        S.clunk(t, Math.min(0.2, 0.03 * dv) * q.g * 2, q.pan, bus);
      }
    }
    // things giving way: the bollards (a deep metallic bang), the lamp post (a crack, then the long fall and the clang on the road)
    for (const b of W.breaks) {
      const t = frFilmT(b.t); if (t > 61) continue;
      if (b.id.startsWith('bollards')) { const q = this._at(5.8, -48.4, t, 14); S.boom(t, 0.14 * q.g, bus, rev); S.clunk(t, 0.18 * q.g, q.pan, bus); }
      if (b.id.startsWith('lamp')) { const z = +b.id.replace(/lamp[RL]/, ''), x = b.id[4] === 'R' ? 7.45 : -7.45, q = this._at(x, z, t, 12);
        S.crunch(t, 0.5 * q.g, q.pan, bus, rev); S.boom(t + 1.0, 0.12 * q.g, bus, rev); for (const [f, d] of [[180, 1.4], [420, 0.9], [960, 0.6]]) S.tone(t + 1.0, d, f, 0.03 * q.g, q.pan, bus, 'triangle', 0.006, d * 0.9); }
    }
  }

  /* the montage: each shot its own place */
  _montage(S, bus, rev) {
    // (the world bus is turned down during the montage, so these go straight to the mix at full level through their own gain)
    const ctx = S.ctx, M = Object.fromEntries(FR_MONTAGE.map((m) => [m.id, m]));
    const out = ctx.createGain(); out.gain.value = 4.0; out.connect(bus);
    // conveyor: a store's hum, the belt motor, a scanner beep that nobody triggers
    { const m = M.conveyor; const n = S.noise('pink', m.t0, m.t1), bp = S.filter('bandpass', 180, 2), g = ctx.createGain(); g.gain.setValueAtTime(0, m.t0); g.gain.linearRampToValueAtTime(0.25, m.t0 + 0.05); g.gain.setValueAtTime(0.25, m.t1 - 0.05); g.gain.linearRampToValueAtTime(0, m.t1); n.connect(bp); bp.connect(g); g.connect(out);
      S.tone(m.t0, m.t1 - m.t0, 100, 0.04, 0, out, 'sawtooth', 0.02, 0.05); S.voice(m.t0 + 0.7, 260, 0.35, 'e', 0.05, 0.3, out, 1.15); }
    // bike: a freewheel ticking furiously, then the clatter as it goes down and slides on
    { const m = M.bike; for (let t = m.t0; t < m.t1; t += 0.035) S.click(t, 0.035, -0.2, out); S.voice(m.t0 + 0.5, 200, 0.3, 'o', 0.06, -0.2, out, 0.8);
      for (let k = 0; k < 6; k++) S.click(m.t0 + 0.95 + k * 0.03, 0.12, -0.1, out); S.clunk(m.t0 + 0.95, 0.25, -0.1, out); }
    // crane: no brake squeal (the brake can't grip) — only the cable whizzing off the drum, a shout, then the load hits the ground
    { const m = M.crane; const n = S.noise('white', m.t0 + 0.25, m.t0 + 1.4), bp = S.filter('bandpass', 900, 3), g = ctx.createGain(); bp.frequency.setValueAtTime(600, m.t0 + 0.25); bp.frequency.linearRampToValueAtTime(2400, m.t0 + 1.35);
      g.gain.setValueAtTime(0, m.t0 + 0.25); g.gain.linearRampToValueAtTime(0.12, m.t0 + 1.3); g.gain.linearRampToValueAtTime(0, m.t0 + 1.42); n.connect(bp); bp.connect(g); g.connect(out);
      S.voice(m.t0 + 0.55, 180, 0.4, 'e', 0.07, 0.3, out, 0.85); const hit = m.t0 + 0.25 + Math.sqrt(2 * 9 / 8); S.boom(hit, 0.5, out, this.rev); S.crunch(hit, 0.6, 0, out, this.rev); }
    // grip: four glasses sliding off a tray, smashing one after another
    { const m = M.grip; for (let i = 0; i < 4; i++) { const t = m.t0 + 0.55 + i * 0.16; for (let k = 0; k < 10; k++) S.tone(t + k * 0.012 + S.rng.range(0, 0.03), 0.08, S.rng.range(2500, 7500), 0.05, S.rng.range(-0.4, 0.4), out, 'sine', 0.006, 0.07); S.click(t, 0.15, 0, out); }
      S.voice(m.t0 + 0.45, 230, 0.3, 'o', 0.05, 0, out, 0.75); }
    // ambulance: the siren, sliding past sideways
    { const m = M.ambulance; const o = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner(), lp = S.filter('lowpass', 2500, 0.7); o.type = 'square';
      for (let t = m.t0; t < m.t1; t += 0.5) { o.frequency.setValueAtTime(760, t); o.frequency.linearRampToValueAtTime(1180, t + 0.25); o.frequency.linearRampToValueAtTime(760, t + 0.5); }
      g.gain.setValueAtTime(0, m.t0); g.gain.linearRampToValueAtTime(0.06, m.t0 + 0.1); g.gain.linearRampToValueAtTime(0.1, m.t0 + 0.9); g.gain.setValueAtTime(0.1, m.t1 - 0.1); g.gain.linearRampToValueAtTime(0, m.t1);
      p.pan.setValueAtTime(-0.6, m.t0); p.pan.linearRampToValueAtTime(0.6, m.t1); o.connect(lp); lp.connect(g); g.connect(p); p.connect(out); o.start(m.t0); o.stop(m.t1); }
  }

  /* friction returns: every sliding tyre bites at once — a wall of screech, scrape and thud, slowed down — then ringing */
  _return(S, bus, you, rev) {
    const ctx = S.ctx, T = FR.tBack, slow = FR_SLOW;
    // the instant: a huge low hit and a screech chord from everywhere (slowed: pitched down, stretched)
    S.boom(T, 0.6, you, rev); S.thump(T, 0.25, you);
    for (let i = 0; i < 9; i++) {
      const f = 900 + i * 230 + S.rng.range(-60, 60), o = ctx.createOscillator(), g = ctx.createGain(), bp = S.filter('bandpass', f, 8), p = ctx.createStereoPanner(), n = S.noise('white', T, slow.t1 + 0.5);
      o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 0.5, T); o.frequency.linearRampToValueAtTime(f * 0.5 / slow.k, slow.t0 + 0.3); o.frequency.linearRampToValueAtTime(f * 0.42 / slow.k, slow.t1);
      bp.frequency.setValueAtTime(f, T); bp.frequency.linearRampToValueAtTime(f / slow.k, slow.t0 + 0.3);
      g.gain.setValueAtTime(0, T); g.gain.linearRampToValueAtTime(0.03, T + 0.03); g.gain.setValueAtTime(0.03, slow.t1 - 1.2); g.gain.linearRampToValueAtTime(0, slow.t1 + 0.4);
      p.pan.value = S.rng.range(-0.8, 0.8); o.connect(bp); n.connect(bp); bp.connect(g); g.connect(p); p.connect(bus); o.start(T); o.stop(slow.t1 + 0.5);
    }
    // rollovers and tips in slow motion: each landing a deep crunch; metal scraping; glass
    for (const c of this.app.traffic.cars) {
      const R = c.ret; if (!R || !R.roll) continue;
      for (const [tl, str] of R.lands) { const t = frFilmT(tl); S.crunch(t, 0.35 * str, S.rng.range(-0.6, 0.6), bus, rev); S.boom(t, 0.15 * str, bus, rev); }
      const t0 = frFilmT(T + 0.1), t1 = frFilmT(T + R.dur + 0.4), n = S.noise('white', t0, t1), bp = S.filter('bandpass', 1200, 1.5), g = ctx.createGain();
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.05, t0 + 0.2); g.gain.linearRampToValueAtTime(0, t1); n.connect(bp); bp.connect(g); g.connect(S.panned(bus, S.rng.range(-0.5, 0.5)));
    }
    for (let k = 0; k < 30; k++) { const t = T + 0.2 + S.rng.range(0, 4.5); S.tone(t, 0.08, S.rng.range(2500, 6500), 0.012, S.rng.range(-0.8, 0.8), bus, 'sine', 0.006, 0.07); }
    // after: ringing in your ears, debris settling, a distant alarm, the wind
    S.ring(64.6, 6.0, 5200, 0.006, you);
    for (let k = 0; k < 14; k++) { const t = 64.8 + S.rng.range(0, 5); S.click(t, S.rng.range(0.01, 0.03), S.rng.range(-0.8, 0.8), bus); }
    { const n = S.noise('pink', 64.6, CONFIG.duration), bp = S.filter('bandpass', 380, 0.6), g = ctx.createGain(); g.gain.setValueAtTime(0, 64.6); g.gain.linearRampToValueAtTime(0.03, 67); n.connect(bp); bp.connect(g); g.connect(bus); }
  }

  /* a subtle bed: a low pulse from the moment friction goes, tightening through the hill; the countdown's clock and heartbeat;
     big hits on 3 · 2 · 1; silence at the return; one warm chord at the end */
  _music(S, dest) {
    const ctx = S.ctx, end = CONFIG.duration;
    const bus = ctx.createGain(), lp = S.filter('lowpass', 1000, 0.6); bus.gain.value = 1; bus.connect(lp); lp.connect(dest);
    for (const [f, v] of [[55, 0.012], [82.4, 0.007], [110, 0.004]]) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0, 0); g.gain.setValueAtTime(0, 1.5); g.gain.linearRampToValueAtTime(v, 3.0); g.gain.linearRampToValueAtTime(v * 1.5, 29); g.gain.linearRampToValueAtTime(v * 1.8, 46.4);
      g.gain.linearRampToValueAtTime(v * 0.5, 46.6); g.gain.setValueAtTime(v * 0.5, 54.4); g.gain.linearRampToValueAtTime(v * 2.0, 61.4); g.gain.linearRampToValueAtTime(0, 61.5);
      o.connect(g); g.connect(bus); o.start(0); o.stop(62);
    }
    // a pulse on the beat from the slip; faster as the hill lets go
    for (let t = 1.6; t < 46.4; t += t < 29.4 ? 0.62 : 0.46) S.tone(t, 0.09, 110, t < 29.4 ? 0.01 : 0.014, 0, bus, 'sine', 0.006, 0.07);
    // the countdown: a ticking clock and a heartbeat that speeds up; a rising tone; the 3-2-1 hits
    for (let t = 37.5; t < 46.4; t += 1) S.tone(t, 0.05, 1800, 0.006, 0, bus, 'square', 0.006, 0.04);
    for (let t = 54.6; t < 61.4; t += 0.5) S.tone(t, 0.05, 1800, 0.008, 0, bus, 'square', 0.006, 0.04);
    for (let t = 54.6; t < 61.45;) { S.heart(t, 0.06 + 0.04 * MathX.smooth(t, 54.6, 61), dest); t += MathX.lerp(0.75, 0.42, MathX.smooth(t, 54.6, 61)); }
    { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(220, 55.5); o.frequency.linearRampToValueAtTime(440, 61.45);
      g.gain.setValueAtTime(0, 55.5); g.gain.linearRampToValueAtTime(0.012, 61.4); g.gain.linearRampToValueAtTime(0, 61.5); o.connect(g); g.connect(dest); o.start(55.5); o.stop(61.6); }
    for (const t of [58.5, 59.5, 60.5]) { S.boom(t, 0.18, dest, this.rev); S.tone(t, 0.6, 65, 0.05, 0, dest, 'sine', 0.006, 0.5); }
    // a warm chord to end on
    for (const [f, v] of [[110, 0.01], [164.8, 0.008], [220, 0.006], [277.2, 0.004]]) {
      const o = ctx.createOscillator(), g = ctx.createGain(), l2 = S.filter('lowpass', 900, 0.5); o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0, 69.4); g.gain.linearRampToValueAtTime(v, 71.5); g.gain.setValueAtTime(v, 74.4); g.gain.linearRampToValueAtTime(0, end);
      o.connect(l2); l2.connect(g); g.connect(dest); o.start(69.4); o.stop(end + 0.1);
    }
  }
}
