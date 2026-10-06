/* =====================================================================
   SOUNDTRACK — "What if friction disappeared for 60 seconds?"
   The physics drives the sound: every contact the simulation logged
   becomes an impact (metal crunch, plastic thump, a chair's clatter, a
   person's oof) at its place, panned and attenuated from where you are.
   The sound idea: sliding is nearly SILENT — scraping is friction — so
   once friction goes the street turns eerily quiet under the revs, horns
   and voices; the return at 64 s is a wall of screech, scrape and thud.
   Two buses: the WORLD (narrowed during the countdown) and YOU (close).
   ===================================================================== */

class FRAudio extends AudioEngine {
  constructor(tl, app) {
    super(tl);
    this.app = app;
    this.wavName = SCRIPT.meta.wav;
    // the listener rides your body in the simulation (the camera track only holds the walk)
    const W = app.world, o = {};
    this.cx = { value: (t) => W.sample('me', t, o).x };
    this.cz = { value: (t) => W.sample('me', t, o).z };
  }

  fingerprintData() {
    return [FR_CARS, FR_PARKED, FR_PEOPLE, FR_PROPS, FR_STATES, FR_STATIC, FR_WALK, FR_POLE, FR_HOLD, FR,
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
    out.gain.setValueAtTime(0.0001, 0); out.gain.linearRampToValueAtTime(0.9, 0.08);
    out.gain.setValueAtTime(0.9, end - 0.4); out.gain.linearRampToValueAtTime(0.0001, end);
    // WORLD bus (a low-pass + level the countdown can close down) with an outdoor reflection send
    const world = ctx.createGain(), wlp = S.filter('lowpass', 18000, 0.5), wg = ctx.createGain();
    world.connect(wlp); wlp.connect(wg); wg.connect(mixIn);
    const rev = S.reverb(1.4), rs = ctx.createGain(); rs.gain.value = 0.35; rev.connect(rs); rs.connect(mixIn);
    for (const [t, f, g] of this._narrow()) { wlp.frequency.linearRampToValueAtTime(f, t); wg.gain.linearRampToValueAtTime(g, t); }
    const you = ctx.createGain(); you.gain.value = 1; you.connect(mixIn);
    this.S = S; this.rev = rev;
    this._city(S, world, rev);
    this._steps(S, world);
    this._body(S, you, world);
    this._voices(S, world, rev);
    this._engines(S, world, rev);
    this._impacts(S, world, rev);
    this._music(S, you);
  }

  // the world bus over time: [t, low-pass Hz, level] (the countdown and the return come in later phases)
  _narrow() { return [[0, 18000, 1], [77, 18000, 1]]; }

  // distance gain and pan of a world point at time t, as heard from your body
  _at(x, z, t, ref = 8) {
    const lx = this.cx.value(t), lz = this.cz.value(t), yaw = MathX.deg(this.cyaw.value(t));
    const dx = x - lx, dz = z - lz, d = Math.max(0.6, Math.hypot(dx, dz)), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    return { g: ref / (ref + d), pan: MathX.clamp((dx * rx + dz * rz) / d, -1, 1) * 0.85, d };
  }

  /* the city: air, distant traffic, birds; once friction goes the distance fills with horns, revs and the odd crash */
  _city(S, bus, rev) {
    const ctx = S.ctx, end = CONFIG.duration + 0.5, T0 = FR.tLoss;
    const air = S.noise('pink', 0, end), lp = S.filter('lowpass', 1300, 0.4), hp = S.filter('highpass', 70, 0.5), g = ctx.createGain();
    g.gain.setValueAtTime(0.11, 0); air.connect(hp); hp.connect(lp); lp.connect(g); g.connect(bus);
    // distant traffic: steady rumble before; after 3 s it thins (nobody is driving anywhere) but never stops
    const rum = S.noise('brown', 0, end), rl = S.filter('lowpass', 240, 0.7), rg = ctx.createGain();
    rg.gain.setValueAtTime(0.26, 0); rg.gain.setValueAtTime(0.26, T0); rg.gain.linearRampToValueAtTime(0.13, T0 + 4); rum.connect(rl); rl.connect(rg); rg.connect(bus);
    // birds
    const rng = new RNG(CONFIG.seed + 5);
    for (let t = 0.1; t < end; t += rng.range(0.25, 0.9)) { const n = rng.int(2, 4), base = rng.range(2700, 4500), pan = rng.range(-0.8, 0.8), v = rng.range(0.006, 0.014) * (t < T0 ? 1 : 0.6); for (let k = 0; k < n; k++) S.chirp(t + k * rng.range(0.07, 0.12), base * rng.range(0.92, 1.12), v, pan, bus, t > T0 && t < T0 + 3); }
    // distant horns: a few before, many after
    S.horn(0.6, 392, 466, 0.006, -0.6, rev);
    for (let t = T0 + 1.2; t < end - 1; t += rng.range(0.9, 2.6)) { const f = rng.range(300, 470); S.horn(t, f, f * rng.range(1.15, 1.3), rng.range(0.003, 0.008), rng.range(-0.9, 0.9), rev); }
    // somewhere else in the city, things keep hitting things
    for (let t = T0 + 4.5; t < end - 1; t += rng.range(2.5, 6)) S.crunch(t, rng.range(0.03, 0.07), rng.range(-0.9, 0.9), rev, rev);
    // car alarms start up in the distance after the first hits
    for (const [t0, pan, f] of [[9.5, -0.7, 0.9], [16.2, 0.6, 1.05], [23.5, 0.2, 0.95]]) {
      const o = ctx.createOscillator(), og = ctx.createGain(), ol = S.filter('lowpass', 1800, 0.7); o.type = 'square';
      for (let t = t0; t < end; t += 0.4) o.frequency.setValueAtTime((Math.floor((t - t0) / 0.4) % 2 ? 1100 : 820) * f, t);
      og.gain.setValueAtTime(0, t0); og.gain.linearRampToValueAtTime(0.0035, t0 + 0.1);
      o.connect(ol); ol.connect(og); og.connect(S.panned(rev, pan)); o.start(t0); o.stop(end);
    }
  }

  /* your footsteps while you walk; the very last one is the slip (a scuff — the last friction sound for a minute) */
  _steps(S, bus) {
    for (let t = 0.12, side = 1; t < FR.tLoss - 0.05; t += 1 / (CONFIG.camera.bobFrequency * FR_WALK.v), side = -side) S.step(t, 0.07, side * 0.1, bus);
    const ctx = S.ctx, n = S.noise('white', 2.98, 3.25), bp = S.filter('bandpass', 2600, 2.5), g = ctx.createGain();
    bp.frequency.setValueAtTime(3400, 2.98); bp.frequency.linearRampToValueAtTime(1500, 3.2);
    S.env(g, 2.98, 0.02, 0.05, 0.2); n.connect(bp); bp.connect(g); g.connect(bus);
  }

  /* you: the gasp at the slip, breathing, grabbing the pole (a clang through the metal), straining to step */
  _body(S, you, world) {
    const ctx = S.ctx, end = CONFIG.duration;
    S.gasp(3.05, 0.05, you);
    const rustle = (t, d, v, f = 2400) => { const n = S.noise('white', t, t + d), bp = S.filter('bandpass', f, 0.8), g = ctx.createGain(); S.env(g, t, d * 0.4, v, d * 0.6); n.connect(bp); bp.connect(g); g.connect(you); };
    rustle(3.0, 0.5, 0.02); rustle(4.6, 0.4, 0.014);
    // the phone hits the sidewalk and skates away without a sound
    S.click(3.47, 0.05, -0.25, world); S.clunk(3.47, 0.018, -0.25, world); S.click(3.53, 0.02, -0.25, world);
    // your hand on the lamp post: a hollow metal clang that rings up the pole
    const clang = (t, v) => { for (const [f, d, a] of [[523, 1.4, 1], [1291, 0.8, 0.5], [2210, 0.5, 0.3], [3405, 0.3, 0.2]]) S.tone(t, d, f, v * a, -0.3, world, 'sine', 0.006, d * 0.9); S.clunk(t, v * 1.2, -0.3, world); };
    clang(5.18, 0.03); clang(5.52, 0.018);
    S.voice(5.22, 140, 0.18, 'u', 0.025, 0, you, 0.8);
    // trying to step: a strained breath, a grunt as your feet go, hands squeaking… no: sliding silently down the pole
    S.breath(6.2, 0.4, true, 0.03, you); S.voice(6.38, 150, 0.25, 'a', 0.03, 0, you, 0.75); rustle(6.35, 0.6, 0.016, 1600);
    clang(7.25, 0.012);
    // breathing: calm while walking, then fast and shallow
    for (let t = 0.6; t < end - 1;) {
      const fast = t > 3.0, v = fast ? 0.014 : 0.004, din = fast ? 0.5 : 1.2, dout = fast ? 0.55 : 1.4;
      if (!(t > 5.1 && t < 5.5) && !(t > 6.1 && t < 6.8)) { S.breath(t, din, true, v, you); S.breath(t + din + 0.05, dout, false, v * 0.9, you); }
      t += din + dout + (fast ? 0.12 : 0.6);
    }
    // a pulse under everything once friction goes (felt more than heard)
    { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 52; g.gain.setValueAtTime(0, 0); g.gain.setValueAtTime(0, 3.0); g.gain.linearRampToValueAtTime(0.006, 4.5); o.connect(g); g.connect(you); o.start(0); o.stop(end); }
  }

  /* people: yelps as they go down, shouts, a nervous laugh */
  _voices(S, bus, rev) {
    const W = this.app.world, s = {};
    const at = (id, t) => { W.sample(id, t, s); return this._at(s.x, s.z, t, 6); };
    const yell = (id, t, f0, vowels, vol, glide = 0.8) => { let tt = t; for (const [v, d] of vowels) { const p = at(id, tt); S.voice(tt, f0, d, v, vol * p.g, p.pan, bus, glide); tt += d + 0.03; f0 *= 0.92; } };
    yell('W1', 3.2, 420, [['a', 0.22], ['a', 0.14]], 0.06, 0.7);           // "ah—"
    yell('W2', 3.42, 190, [['o', 0.16], ['a', 0.24]], 0.07, 0.75);         // "whoa"
    yell('J', 3.32, 380, [['e', 0.2]], 0.04, 0.7);
    yell('W3', 6.78, 175, [['o', 0.14], ['o', 0.3]], 0.06, 0.8);           // "no no no"
    yell('W3', 7.4, 170, [['o', 0.12], ['o', 0.12], ['o', 0.2]], 0.05, 0.85);
    yell('W5', 9.6, 200, [['a', 0.3]], 0.045, 0.7);
    yell('W2', 7.9, 185, [['e', 0.12], ['i', 0.25]], 0.05, 1.1);           // "hey!"
    yell('W6', 4.0, 360, [['a', 0.15], ['e', 0.15], ['a', 0.2]], 0.03, 0.9);
    // a nervous laugh from somewhere, someone shouting across the street
    S.laugh(10.6, 0.012, 0.5, rev, 260, 4);
    yell('W6', 12.2, 340, [['e', 0.14], ['o', 0.3]], 0.03, 0.85);
    yell('W1', 17.8, 410, [['a', 0.16]], 0.05, 0.8);                      // the chairs bump into her
  }

  /* engines and horns, from the simulation; K (beside you) revving to the limiter while its wheels spin in the air of no-friction */
  _engines(S, bus, rev) {
    const ctx = S.ctx, W = this.app.world, end = CONFIG.duration + 0.5, s = {};
    for (const [id, type, , , , , , o] of FR_CARS) {
      const pos = (t) => W.sample(id, t, s);
      let minD = 1e9; for (let t = 0; t < end; t += 0.5) { const p = pos(t); minD = Math.min(minD, Math.hypot(p.x - this.cx.value(t), p.z - this.cz.value(t))); }
      if (minD > 60) continue;
      const pts = this._spatial(pos, 0, end, 1 / 30, 7);
      const acts = (o && o.actions) || [[0, 'roll']];
      const act = (t) => { let a = 'roll'; for (const k of acts) if (k[0] <= t) a = k[1]; else break; return a; };
      const big = type === 'truck' || type === 'van' || type === 'suv';
      const f0 = big ? 38 : type === 'ev' ? 0 : 46 + (id.charCodeAt(0) % 7) * 2;
      // rpm: idling, driving, coasting; floored with no load: straight up to the limiter and bouncing off it
      const rpm = (t) => {
        const a = act(t), sp = W.sample(id, t, s).speed;
        if (a === 'gas' && t > FR.tLoss) { let t0 = t; for (const k of acts) if (k[0] <= t && k[1] === 'gas') t0 = k[0]; const u = t - t0; return f0 * (0.8 + Math.min(2.4, u * 2.6)) * (1 + (u > 0.9 ? 0.06 * Math.sin(u * 47) : 0)); }
        if (t < FR.tLoss) return f0 * (0.75 + Math.min(1, sp / 12) * 0.55);
        return f0 * 0.72;
      };
      if (f0 > 0) {
        const saw = ctx.createOscillator(), sq = ctx.createOscillator(), lp = S.filter('lowpass', big ? 520 : 820, 1.1), g = ctx.createGain(), p = ctx.createStereoPanner(), sqg = ctx.createGain();
        saw.type = 'sawtooth'; sq.type = 'square'; sqg.gain.value = 0.45;
        saw.connect(lp); sq.connect(sqg); sqg.connect(lp); lp.connect(g); g.connect(p); p.connect(bus);
        const send = ctx.createGain(); send.gain.value = 0.2; p.connect(send); send.connect(rev);
        const vol = id === 'K' ? 0.08 : big ? 0.07 : 0.05;
        this._applySpatial(pts, g.gain, p.pan, [[saw.frequency, rpm], [sq.frequency, (t) => rpm(t) * 0.5], [lp.frequency, (t) => (big ? 420 : 640) + rpm(t) * 6]], vol, (t) => (act(t) === 'gas' && t > FR.tLoss ? 1.9 : 1));
        saw.start(0); sq.start(0); saw.stop(end); sq.stop(end);
      } else {
        // the EV: a soft synthetic hum
        const o1 = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner(); o1.type = 'triangle';
        o1.connect(g); g.connect(p); p.connect(bus);
        this._applySpatial(pts, g.gain, p.pan, [[o1.frequency, 520]], 0.012);
        o1.start(0); o1.stop(end);
      }
      // spinning tyres in the air of no friction: a whir that climbs with the wheel speed (no screech, no smoke)
      if (acts.some((k) => k[1] === 'gas')) {
        const n = S.noise('pink', 0, end), bp = S.filter('bandpass', 400, 3), g = ctx.createGain(), p = ctx.createStereoPanner();
        n.connect(bp); bp.connect(g); g.connect(p); p.connect(bus);
        this._applySpatial(pts, g.gain, p.pan, [[bp.frequency, (t) => 200 + Math.abs(W.sample(id, t, s).wheelRate) * 18]], 0.09, (t) => MathX.smooth(Math.abs(W.sample(id, t, s).wheelRate), 5, 30));
      }
      // rolling tyre noise before friction goes; after it, only the wind of anything moving fast
      { const n = S.noise('white', 0, end), bp = S.filter('bandpass', 700, 0.7), g = ctx.createGain(), p = ctx.createStereoPanner();
        n.connect(bp); bp.connect(g); g.connect(p); p.connect(bus);
        this._applySpatial(pts, g.gain, p.pan, [[bp.frequency, (t) => (t < FR.tLoss ? 500 : 900) + W.sample(id, t, s).speed * 30]], 0.1, (t) => (t < FR.tLoss ? 1 : 0.25) * Math.min(1, W.sample(id, t, s).speed / 10) ** 1.6); }
      // horns
      for (const [t, d] of (o && o.horns) || []) {
        const q = this._at(W.sample(id, t, s).x, s.z, t, 10), f = big ? 300 : 392 + (id.charCodeAt(0) % 5) * 12;
        for (let k = 0; k * 0.45 < d; k++) S.horn(t + k * 0.45, f, f * 1.26, 0.05 * q.g, q.pan, bus);
      }
    }
  }

  /* every logged contact becomes a sound at its place */
  _impacts(S, bus, rev) {
    const W = this.app.world, kind = (id) => (id === null ? 'static' : W.byId[id] ? (W.byId[id].kind === 'car' ? 'car' : W.byId[id].kind === 'person' || id === 'me' ? 'person' : (FR_PROPS.find((p) => p[0] === id) || [0, 'prop'])[1]) : 'static');
    const ctx = S.ctx;
    for (const e of W.events) {
      if (e.dv < 0.7) continue;
      const q = this._at(e.x, e.z, e.t, 9), A = kind(e.a), B = kind(e.b), dv = e.dv;
      const has = (k) => A === k || B === k;
      if (has('car') && (has('car') && A === B)) {
        const v = Math.min(0.9, 0.05 * dv) * q.g * 2.2;
        S.crunch(e.t, v, q.pan, bus, rev);
        if (dv > 4) for (let k = 0; k < 8; k++) S.tone(e.t + 0.03 + k * 0.035 + S.rng.range(0, 0.04), 0.06, S.rng.range(3000, 6500), v * 0.12, q.pan, bus, 'sine', 0.006, 0.05);   // glass
      } else if (has('car')) {
        if (has('static')) { S.clunk(e.t, Math.min(0.5, 0.05 * dv) * q.g * 2, q.pan, bus); S.thump(e.t, Math.min(0.3, 0.03 * dv) * q.g * 2, bus); }
        else if (has('person')) { S.thump(e.t, 0.1 * q.g, bus); }
        else { S.clunk(e.t, Math.min(0.35, 0.04 * dv) * q.g * 2, q.pan, bus); for (let k = 0; k < 3; k++) S.click(e.t + k * 0.03, 0.05 * q.g, q.pan, bus); }
      } else if (has('person')) {
        S.thump(e.t, Math.min(0.12, 0.03 * dv) * q.g * 2, bus);
      } else if (has('chair') || has('cart') || has('bike')) {
        for (let k = 0; k < 4; k++) S.click(e.t + k * 0.025 + S.rng.range(0, 0.02), Math.min(0.12, 0.03 * dv) * q.g * 2, q.pan, bus);
        S.tone(e.t, 0.18, S.rng.range(700, 1400), 0.02 * q.g * Math.min(2, dv / 2), q.pan, bus, 'triangle', 0.006, 0.15);
      } else if (has('bin') || has('box')) {
        const n = S.noise('brown', e.t, e.t + 0.25), lp = S.filter('lowpass', 420, 0.8), g = ctx.createGain(); S.env(g, e.t, 0.006, Math.min(0.2, 0.05 * dv) * q.g * 2, 0.18); n.connect(lp); lp.connect(g); g.connect(S.panned(bus, q.pan));
      } else if (has('phone')) {
        S.click(e.t, 0.04 * q.g, q.pan, bus);
      } else {
        S.clunk(e.t, Math.min(0.2, 0.03 * dv) * q.g * 2, q.pan, bus);
      }
    }
    // bollards and restraints giving way: a deep metallic bang
    for (const b of W.breaks) { if (b.t > 70) continue; const q = this._at(b.id.startsWith('bollards') ? 5.8 : 11, -50, b.t, 14); S.boom(b.t, 0.12 * q.g, bus, rev); S.clunk(b.t, 0.15 * q.g, q.pan, bus); }
  }

  /* a subtle bed: a low pulse and a held fifth that tighten as things escalate */
  _music(S, dest) {
    const ctx = S.ctx, end = CONFIG.duration;
    const bus = ctx.createGain(), lp = S.filter('lowpass', 900, 0.6); bus.gain.value = 1; bus.connect(lp); lp.connect(dest);
    for (const [f, v] of [[55, 0.012], [82.4, 0.007], [110, 0.004]]) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0, 0); g.gain.setValueAtTime(0, 3.2); g.gain.linearRampToValueAtTime(v, 6.5); g.gain.linearRampToValueAtTime(v * 1.4, 20);
      o.connect(g); g.connect(bus); o.start(0); o.stop(end);
    }
    // a ticking pulse that comes in with the cars (12 s) — the clock that will matter later
    for (let t = 12.0; t < 20.5; t += 0.5) S.tone(t, 0.08, 220, 0.006, 0, bus, 'triangle', 0.006, 0.06);
  }
}
