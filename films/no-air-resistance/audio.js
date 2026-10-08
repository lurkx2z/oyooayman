/* =====================================================================
   AUDIO — "What if air resistance suddenly disappeared?"
   Sound is kept: the air still carries it. What changes is that air and
   solids no longer push on each other, so nothing solid makes wind noise
   any more. Before NR.loss the breeze is heard through what it moves (the
   flag cracking, leaves, the awning, litter) and as a rush round you; at
   the loss all of that stops dead and only a faint hiss is left. The storm
   is silent: 100 km/h of air that cannot touch anything. Falling things make
   no whoosh: they are heard only when they hit. The airliner falls without a
   sound (it no longer pushes the air aside: no roar, no sonic boom); its
   impact is seen at once and heard 6.1 s later, and the street holds its
   breath until then; the debris lands before its own sound gets to you.
   Every cue is scheduled on STORY time; Edit.spliceAudio follows the cut
   and the quarter-speed plunge (which comes out two octaves lower).
   Bake: NODE_PATH=$(npm root -g) node tools/bake-soundtrack.cjs --page no-air-resistance.html --out films/no-air-resistance/soundtrack.js
   ===================================================================== */

class NrAudio extends AudioEngine {
  constructor(tl, app) { super(tl); this.app = app; this.wavName = SCRIPT.meta.wav; }
  // anything the sound depends on that is not inside SCRIPT (so a stale baked copy is detected)
  fingerprintData() { return [NR, NR_CAM, NR_PEOPLE, NR_PIGEONS, NR_FLYERS, NR_DEBRIS_SPEC, NR_CITY.flags, NR_STEAM, NR_PLANE.dir]; }

  // a soft ceiling just under full scale, and true silence after the cut to black
  async renderOffline() {
    const buf = await super.renderOffline(), sr = buf.sampleRate, black = Edit.film(NR.black);
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const o = buf.getChannelData(c);
      for (let i = 0; i < o.length; i++) {
        const t = i / sr, x = o[i], ax = Math.abs(x);
        if (t >= black) o[i] = 0;
        else if (t > black - 0.004) o[i] *= (black - t) / 0.004;
        else if (ax > 0.6) o[i] = Math.sign(x) * (0.6 + 0.2 * Math.tanh((ax - 0.6) / 0.2));
      }
    }
    return buf;
  }

  _kit(ctx) {
    const S = new SoundKit(ctx, CONFIG.seed);
    // offline-safe envelopes (Chrome's offline renderer clicks on very short exponential ramps)
    S.env = (g, t, a, peak, d) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(Math.max(0.0002, peak), t + Math.max(a, 0.004)); g.gain.setTargetAtTime(0, t + Math.max(a, 0.004), Math.max(0.004, d / 4)); };
    S.tone = (t, dur, f, vol, pan, dest, type = 'sine', attack = 0.01, release = null) => {
      if (vol <= 0.0005 || t < 0) return null; const o = ctx.createOscillator(), g = ctx.createGain(), r = release || dur * 0.3; o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + Math.max(0.006, attack)); g.gain.setValueAtTime(vol, t + Math.max(attack, dur - r)); g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(g); g.connect(S.panned(dest, pan)); o.start(t); o.stop(t + dur + 0.05); return o;
    };
    S.burst = (t, dur, f, q, vol, pan, dest, type = 'white', a = 0.004) => {
      if (t < 0) return null; const n = S.noise(type, t, t + dur + 0.05), b = S.filter('bandpass', f, q), g = ctx.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.setTargetAtTime(0, t + a, dur / 3); n.connect(b); b.connect(g); g.connect(S.panned(dest, pan)); return { b, g };
    };
    // a creak: a narrow band of noise gliding down
    S.creak = (t, dur, f, vol, pan, dest) => { const k = S.burst(t, dur, f, 9, vol, pan, dest, 'pink', dur * 0.3); if (k) k.b.frequency.linearRampToValueAtTime(f * 0.75, t + dur); };
    // a metal ping (a few inharmonic partials)
    S.ping = (t, f, vol, pan, dest, dur = 0.5) => { for (const [m, v] of [[1, 1], [2.76, 0.5], [5.4, 0.25]]) S.tone(t, dur / Math.sqrt(m), f * m, vol * v, pan, dest, 'sine', 0.001, dur * 0.9 / Math.sqrt(m)); };
    // glass: a burst of crackle plus bright tinkles
    S.glass = (t, vol, pan, dest) => {
      const src = ctx.createBufferSource(), hp = S.filter('highpass', 2400, 0.7), g = ctx.createGain(); src.buffer = S.crackleBuffer(1.2, 700); g.gain.value = vol * 3;
      src.connect(hp); hp.connect(g); g.connect(S.panned(dest, pan)); src.start(t);
      for (let k = 0; k < 10; k++) S.tone(t + 0.03 + k * 0.06 + (k * 37 % 11) / 280, 0.12, 2800 + (k * 911) % 3200, vol * 0.4, pan, dest, 'sine', 0.001, 0.1);
    };
    return S;
  }

  _build(ctx) {
    const S = this._kit(ctx), end = CONFIG.duration + 1.0;
    this.S = S;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -20; comp.knee.value = 6; comp.ratio.value = 3; comp.attack.value = 0.008; comp.release.value = 0.25;
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -2; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.1;
    const mix = ctx.createGain(); mix.gain.value = 2.75; mix.connect(comp);
    const out = ctx.createGain(); comp.connect(out); out.connect(lim); lim.connect(ctx.destination);
    out.gain.setValueAtTime(0, 0); out.gain.linearRampToValueAtTime(0.9, 0.03);
    const rev = S.reverb(1.8), rs = ctx.createGain(); rs.gain.value = 0.3; rev.connect(rs); rs.connect(mix);
    const bus = (v) => { const g = ctx.createGain(); g.gain.value = v; g.connect(mix); return g; };
    const street = bus(1), sky = bus(1), you = bus(1), fx = bus(1), music = bus(0.8);
    // the street and the sky cut-away never sound together
    const [k0, k1] = NR.sky;
    street.gain.setValueAtTime(1, k0 - 0.01); street.gain.linearRampToValueAtTime(0, k0); street.gain.setValueAtTime(0, k1 - 0.01); street.gain.linearRampToValueAtTime(1, k1);
    sky.gain.setValueAtTime(0, 0); sky.gain.setValueAtTime(0, k0 - 0.01); sky.gain.linearRampToValueAtTime(1, k0); sky.gain.setValueAtTime(1, k1 - 0.01); sky.gain.linearRampToValueAtTime(0, k1);
    // after the flash the street holds its breath until the sound of the impact arrives (the countdown and your heart stay clear)
    street.gain.setValueAtTime(1, NR.impact); street.gain.linearRampToValueAtTime(0.22, NR.impact + 0.5); street.gain.setValueAtTime(0.22, NR.boom - 0.03); street.gain.linearRampToValueAtTime(1, NR.boom);
    this.rev = rev;
    this._air(S, street, end);
    this._street(S, street, end);
    this._city(S, street, end, new RNG(5050));
    this._steps(S, you);
    this._drop(S, fx);
    this._sky(S, sky);
    this._car(S, street);
    this._pigeons(S, street, new RNG(6060));
    this._flyers(S, street);
    this._look(S, street);
    this._plane(S, fx);
    this._balloon(S, street);
    this._debris(S, fx);
    this._you(S, you);
    this._music(S, music, end);
  }

  // the air itself: a hollow rush round you that follows the wind, and what it moves; at the loss both stop dead and a faint hiss is left (the storm adds nothing)
  _air(S, dest, end) {
    const ctx = S.ctx;
    const lay = (type, kind, f, q, pan) => { const n = S.noise(type, 0, end), b = S.filter(kind, f, q), g = ctx.createGain(); g.gain.value = 0; n.connect(b); b.connect(g); g.connect(S.panned(dest, pan)); return { g, b }; };
    const lo = lay('brown', 'lowpass', 280, 0.6, -0.25), body = lay('pink', 'bandpass', 480, 0.55, 0.25), air = lay('pink', 'bandpass', 1300, 0.5, -0.1);
    const leaves = lay('white', 'highpass', 3600, 0.7, 0.35);
    for (let t = 0; t <= end; t += 1 / 30) {
      const a = nrAero(t), k = Math.pow(nrWindKmh(t) / 100, 1.5) * nrGust(t) * a + 0.06 * (1 - a), L = Math.min(1.6, nrLoad(t));
      // held back under the countdown after the flash and under the closing lines
      const duck = 1 - 0.45 * MathX.smooth(t, NR.impact, NR.impact + 0.8) * (1 - MathX.smooth(t, NR.boom - 0.3, NR.boom)) - 0.35 * MathX.smooth(t, NR.look, NR.line[0]);
      lo.g.gain.linearRampToValueAtTime((0.012 + 0.2 * k) * duck, t);
      body.g.gain.linearRampToValueAtTime((0.006 + 0.13 * k) * duck, t); body.b.frequency.linearRampToValueAtTime(380 + 260 * k, t);
      air.g.gain.linearRampToValueAtTime((0.004 + 0.05 * k) * duck, t);
      leaves.g.gain.linearRampToValueAtTime(0.03 * L, t);
    }
    // the big flag at the kerb: cracking and fluttering in the breeze, then nothing
    const fn = S.noise('white', 0, NR.loss + 1), fb = S.filter('bandpass', 1300, 0.9), am = ctx.createGain(), fg = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.type = 'sawtooth'; lfo.frequency.value = 11; lg.gain.value = 0.45; am.gain.value = 0.55; lfo.connect(lg); lg.connect(am.gain); lfo.start(0); lfo.stop(NR.loss + 1);
    fn.connect(fb); fb.connect(am); am.connect(fg); fg.connect(S.panned(dest, 0.2)); fg.gain.value = 0;
    for (let t = 0; t <= NR.loss + 0.9; t += 1 / 60) { fg.gain.linearRampToValueAtTime(0.09 * Math.pow(Math.min(1.5, nrLoad(t, -6)), 0.8), t); lfo.frequency.linearRampToValueAtTime(9 + 4 * nrGust(t, -6), t); }
    const rng = new RNG(717);
    for (let t = 0.15; t < NR.loss; t += rng.range(0.18, 0.55)) S.burst(t, 0.05, 2200, 0.7, 0.05 * nrLoad(t, -6), 0.2, dest);   // the cracks
    // after: the halyard clinks against the pole as the pole rings down (nothing damps it but itself)
    for (let k = 0; k < 6; k++) S.ping(NR.loss + 0.32 + k * 0.91, 2900 - k * 40, 0.018 * Math.exp(-0.42 * k), 0.2, dest, 0.35);
  }

  // the street furniture in the breeze: the awning, umbrellas, bin lids, litter; the hanging sign keeps swinging after
  _street(S, dest, end) {
    const rng = new RNG(818), Lt = NR.loss;
    for (let t = 0.3; t < Lt; t += rng.range(0.9, 1.6)) S.whump(t, 0.03 * nrLoad(t), 0.45, dest);                            // the awning
    for (let t = 0.2; t < Lt; t += rng.range(0.25, 0.7)) S.clunk(t, 0.008 * nrLoad(t), rng.pick([0.5, -0.3]), dest);          // umbrellas, bin lids
    for (let t = 0.1; t < Lt; t += rng.range(0.05, 0.16)) S.click(t, 0.006 * nrLoad(t), rng.range(-0.7, 0.7), dest);          // litter skittering
    // at the change: the awning drops back, the lids drop shut, every bit of litter falls and lands
    S.whump(Lt + 0.25, 0.035, 0.45, dest); S.whump(Lt + 0.88, 0.015, 0.45, dest);
    S.clunk(Lt + 0.18, 0.03, -0.35, dest); S.clunk(Lt + 0.24, 0.022, 0.55, dest);
    S.creak(Lt + 0.1, 0.5, 520, 0.02, 0.5, dest);
    for (let i = 0; i < 46; i++) { const u = 0.08 + 1.3 * Math.pow(rng.next(), 1.6); S.click(Lt + u, 0.012 * rng.range(0.4, 1), rng.range(-0.8, 0.8), dest); }
    // the hanging sign: it swings on (no air damps it), creaking at each end of the swing
    for (let k = 0; Lt + 0.4 + k * 0.805 < NR.cut0; k++) S.creak(Lt + 0.4 + k * 0.805, 0.3, 640 + (k % 2) * 60, 0.016 * Math.exp(-0.145 * k), 0.4, dest);
    // the steam vent hissing in the curb lane, all film long
    const n = S.noise('white', 0, end), b = S.filter('bandpass', 3200, 0.8), g = S.ctx.createGain(); g.gain.value = 0.006; n.connect(b); b.connect(g); g.connect(S.panned(dest, -0.4));
  }

  // the city: traffic, horns, the café, sparrows; quieter once the traffic stops after the impact
  _city(S, dest, end, rng) {
    const ctx = S.ctx, n = S.noise('brown', 0, end), lp = S.filter('lowpass', 170, 0.7), g = ctx.createGain(); n.connect(lp); lp.connect(g); g.connect(S.panned(dest, -0.15));
    g.gain.setValueAtTime(0.16, 0); g.gain.setValueAtTime(0.16, NR.impact + 0.3); g.gain.linearRampToValueAtTime(0.06, NR.impact + 3);
    for (let t = 0.6; t < NR.impact + 1; t += rng.range(2.2, 4.4)) { if (t > NR.sky[1] && t < NR.birds) continue; S.burst(t, 1.8, 650, 0.6, 0.03, rng.pick([-0.6, -0.3, 0.2]), dest, 'pink', 0.7); }
    for (const [t, f1, f2, p] of [[4.6, 392, 494, -0.6], [29.0, 415, 523, -0.7], [44.1, 370, 466, -0.5]]) S.horn(t, f1, f2, 0.012, p, dest);
    S.chatter(0.2, NR.impact + 0.2, 0.012, 0.55, dest, 420, 3.0);
    for (let t = 0.4; t < NR.boom; t += rng.range(0.8, 2.6)) { const f = rng.range(2800, 4200), p = rng.range(-0.8, 0.8); for (let k = 0; k < rng.int(1, 3); k++) S.chirp(t + k * 0.1, f, 0.01, p, dest, false); }
    // after the boom: car alarms, near and far, to the end
    const alarm = (t0, fA, fB, rate, vol, pan) => {
      const o = ctx.createOscillator(), f = S.filter('lowpass', 2200, 0.7), a = ctx.createGain(); o.type = 'square';
      for (let t = t0, k = 0; t < end; t += rate, k++) o.frequency.setValueAtTime(k % 2 ? fB : fA, t);
      a.gain.setValueAtTime(0, t0); a.gain.linearRampToValueAtTime(vol, t0 + 0.1); a.gain.setValueAtTime(vol, NR.look); a.gain.linearRampToValueAtTime(vol * 0.45, NR.line[0]);
      o.connect(f); f.connect(a); a.connect(S.panned(dest, pan)); o.start(t0); o.stop(end);
    };
    alarm(NR.boom + 0.25, 880, 1150, 0.42, 0.006, -0.55); alarm(NR.boom + 0.6, 700, 980, 0.3, 0.004, 0.6); alarm(NR.boom + 1.4, 1020, 1300, 0.5, 0.0025, -0.2);
  }

  // your footsteps from the walk (in the hook) and the run (from the debris)
  _steps(S, dest) {
    const C = this.app.cam, ph = C.stepPh;
    for (let i = 1; i < ph.length; i++) {
      const t = i * C.dt; if (t >= NR.cut0 && t < NR.sky[1]) continue;
      if (Math.floor(ph[i]) !== Math.floor(ph[i - 1])) S.step(t, t > 50 ? 0.09 : 0.05, Math.floor(ph[i]) % 2 ? 0.12 : -0.12, dest);
    }
  }

  // the paper and the ball: let go together, they land together (a slap and a thud), then the ball bounces on
  _drop(S, dest) {
    S.burst(NR.drop.up, 0.35, 1900, 0.8, 0.008, 0, dest, 'pink', 0.1);       // hands up (sleeves)
    S.click(NR.drop.rel, 0.006, 0.15, dest);
    const t0 = NR.drop.rel + 0.52;
    S.burst(t0, 0.07, 1700, 0.9, 0.07, 0.25, dest, 'white', 0.002); S.burst(t0, 0.12, 600, 0.8, 0.03, 0.25, dest, 'pink', 0.002);
    let v = 0.72 * NR_G * 0.52, t = t0;
    for (let k = 0; k < 8; k++) {
      const a = k === 0 ? 1 : Math.pow(0.72, k);
      S.tone(t, 0.09, 165 + 10 * k, 0.07 * a, -0.25, dest, 'sine', 0.002, 0.08); S.click(t, 0.03 * a, -0.25, dest);
      t += 2 * v / NR_G; v *= 0.72;
      if (t > NR.cut0 - 0.05) break;
    }
  }

  // the sky: almost silent (he falls through still air that makes no sound on him); his altimeter beeps; the canopy opens without a sound
  _sky(S, dest) {
    const ctx = S.ctx, [a, b] = NR.sky;
    const n = S.noise('pink', a, b), lp = S.filter('lowpass', 500, 0.6), g = ctx.createGain(); g.gain.value = 0.02; n.connect(lp); lp.connect(g); g.connect(dest);
    const when = (alt) => { for (let s = a; s < b; s += 0.01) if (NR_JUMP.alt(s) <= alt) return s; return null; };
    const beep = (t, n2, gap, f, v) => { for (let k = 0; k < n2; k++) S.tone(t + k * gap, gap * 0.55, f, v, 0.1, dest, 'triangle', 0.004, 0.02); };
    const t1 = when(1500), t2 = when(1200), t3 = when(900);
    if (t1) beep(t1, 3, 0.22, 2400, 0.02);
    if (t2) beep(t2, 8, 0.11, 2900, 0.02);
    if (t3) beep(t3, Math.floor((b - t3) / 0.06), 0.06, 3300, 0.016);
    // the pull: the container's velcro rips, the bag and lines spill out; no crack of a canopy filling
    const d = NR.deploy;
    const v = ctx.createBufferSource(), vh = S.filter('highpass', 1500, 0.7), vg = ctx.createGain(); v.buffer = S.crackleBuffer(0.4, 3000); vg.gain.value = 0.1; v.connect(vh); vh.connect(vg); vg.connect(S.panned(dest, 0.2)); v.start(d);
    S.burst(d + 0.25, 0.9, 1100, 0.7, 0.03, 0.1, dest, 'pink', 0.2);
    for (let k = 0; k < 5; k++) S.burst(d + 1.4 + k * 0.6, 0.4, 900 + 120 * k, 0.8, 0.008, -0.2 + 0.1 * k, dest, 'pink', 0.15);
  }

  // the coasting car: tyres and an idling engine, no wind noise round it; the leaflets riffle out of the window
  _car(S, dest) {
    const ctx = S.ctx, T = this.app.traffic, t0 = NR.sky[1] - 0.2, t1 = NR.birds;
    const pos = (t) => ({ x: 1.75, z: T.heroZ(t) }), pts = this._spatial(pos, t0, t1);
    const tn = S.noise('pink', t0, t1), tb = S.filter('bandpass', 800, 0.55), tg = ctx.createGain(), tp = ctx.createStereoPanner();
    tn.connect(tb); tb.connect(tg); tg.connect(tp); tp.connect(dest);
    this._applySpatial(pts, tg.gain, tp.pan, [], 0.5, (t) => Math.pow(NR_CAR.speed(t) / 25, 1.5));
    const o = ctx.createOscillator(), ol = S.filter('lowpass', 260, 0.7), og = ctx.createGain(), op = ctx.createStereoPanner(); o.type = 'sawtooth';
    o.connect(ol); ol.connect(og); og.connect(op); op.connect(dest);
    this._applySpatial(pts, og.gain, op.pan, [[o.frequency, 34]], 0.12);
    o.start(t0); o.stop(t1);
    const tp2 = this._spatial(pos, NR.car.toss, NR.car.toss + 0.1)[0];
    S.burst(NR.car.toss, 0.35, 2600, 0.6, 0.05 * tp2.gain * 3, tp2.pan, dest, 'white', 0.02);
  }

  // the pigeons: cooing; startled, they clap their wings and hop but can't lift off; one steps off a ledge
  _pigeons(S, dest, rng) {
    const coo = (t, v, p) => { S.voice(t, 300, 0.22, 'u', v, p, dest, 0.8); S.voice(t + 0.3, 260, 0.35, 'u', v * 0.8, p, dest, 0.9); };
    for (let t = 0.8; t < NR.startle; t += rng.range(1.2, 2.8)) { if (t >= NR.cut0 && t < NR.sky[1]) continue; coo(t, 0.008, rng.range(-0.1, 0.4)); }
    NR_PIGEONS.forEach((p, i) => {
      for (let t = NR.startle + 0.06 * i; t < NR.ledge - 0.2; t += rng.range(0.32, 0.6)) { S.flap(t, (p[0] - 9.9) * 0.4, 0.05 * (1 - (t - NR.startle) / 3), dest); S.click(t + 0.36, 0.01, 0, dest); }
    });
    const L = NR.ledge, land = L + Math.sqrt(2 * (NR_LEDGE.y - 0.15) / NR_G);
    S.flap(L + 0.05, 0.35, 0.05, dest); S.flap(L + 0.4, 0.35, 0.05, dest);
    S.whump(land, 0.03, 0.35, dest); S.click(land, 0.02, 0.35, dest); S.flap(land + 0.15, 0.35, 0.03, dest);
    coo(land + 0.7, 0.012, 0.3);
  }

  // the five pigeons flying up the street in the hook: wingbeats, then at the loss frantic flapping that lifts nothing,
  // a thump as each hits the pavement (½gt² later), a scrape as it skids, a ruffle as it picks itself up
  _flyers(S, dest) {
    const o = {};
    NR_FLYERS.forEach((F, i) => {
      const pan = MathX.clamp((F[0] - NR_CAM.x) * 0.25, -0.5, 0.5);
      for (let t = 0.35 + 0.11 * i; t < NR.loss; t += 0.36 + 0.03 * (i % 3)) S.flap(t, pan, 0.012, dest);
      nrFlyerAt(F, NR.loss + 0.5, o); const land = NR.loss + o.tf;
      for (let t = NR.loss + 0.04 * i; t < land - 0.05; t += 0.17) S.flap(t, pan, 0.03, dest);
      S.thump(land, 0.05, dest); S.click(land, 0.025, pan, dest); S.burst(land + 0.01, 0.22, 2600, 0.7, 0.012, pan, dest, 'white', 0.01);
      S.flap(land + 0.9 + 0.2 * i, pan, 0.02, dest);
    });
  }

  // the man who sees it: "Look... up there!"
  _look(S, dest) {
    const t = NR.point + 0.08, p = 0.15;
    S.voice(t, 150, 0.32, 'u', 0.05, p, dest, 0.92);
    S.voice(t + 0.52, 175, 0.14, 'a', 0.045, p, dest, 1.05);
    S.voice(t + 0.7, 190, 0.34, 'e', 0.05, p, dest, 1.2);
  }

  // the airliner falls without a sound (no roar, no sonic boom: it no longer pushes the air aside);
  // its impact is seen at NR.impact and heard at NR.boom; the windows rattle
  _plane(S, dest) {
    const ctx = S.ctx, rev = this.rev, B = NR.boom;
    S.boom(B, 0.95, dest, rev); S.boom(B + 0.08, 0.6, dest, rev); S.farBoom(B, 0.5, 0, dest); S.thump(B + 0.02, 0.35, dest);
    const r = S.noise('brown', B, B + 5), rl = S.filter('lowpass', 140, 0.6), rg = ctx.createGain(); rg.gain.setValueAtTime(0, B); rg.gain.linearRampToValueAtTime(0.35, B + 0.3); rg.gain.setTargetAtTime(0, B + 0.6, 1.1); r.connect(rl); rl.connect(rg); rg.connect(dest);
    const w = ctx.createBufferSource(), wh = S.filter('bandpass', 2600, 0.9), wg = ctx.createGain(); w.buffer = S.crackleBuffer(1.1, 1600); wg.gain.value = 0.18; w.connect(wh); wh.connect(wg); wg.connect(S.panned(dest, 0.4)); w.start(B + 0.05);
  }

  // the balloon slips: a squeak of the string, the child's "oh!", the mum; then it goes up without a sound
  _balloon(S, dest) {
    const b = NR.balloon;
    S.tone(b, 0.06, 1900, 0.008, 0.1, dest, 'sine', 0.003, 0.04);
    S.voice(b + 0.15, 470, 0.3, 'o', 0.03, 0.1, dest, 1.25);
    S.voice(b + 0.75, 520, 0.4, 'a', 0.025, 0.1, dest, 0.8);
    S.voice(b + 1.05, 240, 0.35, 'o', 0.018, 0.25, dest, 0.85);
  }

  // the debris: no whoosh in the air, only the hits, each heard when its sound reaches you
  _debris(S, dest) {
    const rev = this.rev, list = this.app.debris.list, B = this.app.board;
    for (const d of list) {
      const t = d.land, lx = this.cx.value(t), lz = this.cz.value(t), dist = Math.hypot(d.x - lx, d.y - 1.7, d.z - lz), th = t + dist / 343;
      if (th >= NR.black - 0.05) continue;
      const k = d.size * 10 / (10 + dist), bear = Math.atan2(-(d.x - lx), -(d.z - lz)), pan = MathX.clamp(-Math.sin(bear - MathX.deg(this.cyaw.value(th))) * 0.8, -0.8, 0.8);
      if (k < 0.004) continue;
      if (dist > 400) { S.farBoom(th, 0.12 * k, pan, dest); continue; }
      if (d.kind === 0) S.crunch(th, 0.25 * k, pan, dest, rev);
      else if (d.kind === 1) { S.clunk(th, 0.35 * k, pan, dest); S.ping(th + 0.01, 620 + 40 * (d.i % 5), 0.05 * k, pan, dest, 0.9); }
      else { S.burst(th, 0.1, 1500, 0.8, 0.3 * k, pan, dest, 'white', 0.002); S.ping(th, 980 + 50 * (d.i % 4), 0.04 * k, pan, dest, 0.7); }
      if (Math.abs(Math.abs(d.x) - 12.45) < 0.2 && d.y > 1) S.glass(th + 0.02, 0.05 * k, pan, dest);
      if (d.x === -9.9) S.glass(th + 0.02, 0.06 * k, pan, dest);
    }
    // the sign board: its brackets tear (a shriek of metal), it falls without a sound, it slams down where you stood
    S.creak(NR.board + 0.03, 0.45, 2100, 0.05, -0.35, dest); S.ping(NR.board + 0.2, 1500, 0.03, -0.35, dest, 0.6);
    const L = B.landT;
    S.whump(L, 0.3, -0.05, dest); S.burst(L, 0.14, 1100, 0.7, 0.32, -0.05, dest, 'white', 0.002); S.clunk(L + 0.01, 0.2, -0.05, dest);
    S.ping(L + 0.02, 430, 0.05, -0.05, dest, 1.2); S.ping(L + 0.03, 1210, 0.03, 0.1, dest, 0.8);
    S.burst(L + 0.02, 0.6, 500, 0.6, 0.06, 0, rev, 'pink', 0.005);
  }

  // you: a gasp at the flash, breath held through the countdown, a gasp at the boom, running breath, a ringing ear after the slam
  _you(S, dest) {
    S.gasp(NR.impact + 0.25, 0.02, dest);
    for (let t = NR.impact + 1.4, k = 0; t < NR.boom - 0.1; t += 0.82 - 0.04 * k, k++) S.heart(t, 0.06 + 0.012 * k, dest);
    S.gasp(NR.boom + 0.12, 0.035, dest);
    for (let t = NR.run + 0.2, k = 0; t < 61.9; t += 0.36, k++) S.breath(t, 0.3, k % 2 === 0, 0.016, dest);
    S.gasp(this.app.board.landT + 0.1, 0.03, dest);
    S.tone(this.app.board.landT + 0.05, 3.6, 5900, 0.004, 0.25, dest, 'sine', 0.05, 3.2);
    S.breath(NR.look + 0.3, 1.4, false, 0.012, dest); S.breath(NR.line[0] + 1.3, 1.2, true, 0.01, dest);
  }

  // the music: curious, a pulse, building to the plunge; silence at the flash; a countdown; drive; one held chord at the end
  _music(S, out, end) {
    const ctx = S.ctx;
    const motif = [440, 523.3, 659.3, 587.3, 523.3, 440, 392, 440];
    for (let t = 0.25, k = 0; t < NR.loss - 0.2; t += 0.45, k++) S.pluck(t, motif[k % motif.length], 0.026, k % 2 ? 0.3 : -0.3, out, 1.0, 0.6);
    // the change: a reverse swell into a low hit
    const sw = S.burst(NR.loss - 1.0, 1.05, 700, 0.7, 0.0, 0, out, 'pink', 1.0); sw.g.gain.cancelScheduledValues(NR.loss - 1.0); sw.g.gain.setValueAtTime(0, NR.loss - 1.0); sw.g.gain.linearRampToValueAtTime(0.05, NR.loss - 0.02); sw.g.gain.linearRampToValueAtTime(0, NR.loss);
    S.thump(NR.loss, 0.22, out); S.tone(NR.loss, 2.6, 55, 0.05, 0, out, 'sine', 0.01, 2.0); S.tone(NR.loss, 2.0, 1760, 0.006, 0, out, 'sine', 0.005, 1.8);
    const low = [220, 261.6, 329.6, 293.7, 261.6, 220, 196, 220];
    for (let t = NR.loss + 0.9, k = 0; t < NR.cut0 - 0.3; t += 0.55, k++) S.pluck(t, low[k % low.length], 0.022, k % 2 ? 0.25 : -0.25, out, 1.0, 0.5);
    // into the cut: a riser; the sky: a hit, a drone, a pulse; hope at the pull, then it falls
    const c0 = NR.cut0, ri = S.burst(c0 - 1.0, 1.0, 400, 0.8, 0.0, 0, out, 'pink', 0.9); ri.g.gain.cancelScheduledValues(c0 - 1.0); ri.g.gain.setValueAtTime(0, c0 - 1.0); ri.g.gain.linearRampToValueAtTime(0.05, c0 - 0.02); ri.g.gain.linearRampToValueAtTime(0, c0); ri.b.frequency.exponentialRampToValueAtTime(3000, c0);
    S.thump(NR.sky[0], 0.18, out);
    for (const f of [55, 82.4]) S.tone(NR.sky[0], NR.sky[1] - NR.sky[0], f, 0.03, 0, out, 'sine', 0.3, 0.3);
    for (let t = NR.sky[0] + 0.3, k = 0; t < NR.sky[1] - 0.1; t += 0.62 - 0.12 * MathX.smooth(t, NR.sky[0], NR.sky[1]), k++) S.tone(t, 0.16, k % 2 ? 61.7 : 55, 0.05, 0, out, 'triangle', 0.004, 0.14);
    for (const f of [261.6, 329.6, 392]) S.tone(NR.deploy + 0.3, 2.0, f, 0.011, 0, out, 'triangle', 0.4, 0.6);
    for (const f of [220, 261.6, 311.1]) S.tone(18.7, 1.7, f, 0.011, 0, out, 'triangle', 0.1, 0.8);
    // the street again: a steady pulse and a motif, building through the plane; it drops out for the silent storm
    for (let t = NR.sky[1] + 0.2, k = 0; t < NR.plunge; t += 0.6 - 0.15 * MathX.smooth(t, 34, 47), k++) {
      if (t > NR.storm[0] && t < NR.stormCut[1] + 0.2) continue;
      S.tone(t, 0.16, k % 4 === 0 ? 65.4 : 55, 0.04 + 0.03 * MathX.smooth(t, 30, 47), 0, out, 'triangle', 0.004, 0.14);
    }
    for (let t = NR.sky[1] + 0.4, k = 0; t < NR.point - 0.2; t += 1.2, k++) { if (t > NR.car.cut[0] && t < NR.car.cut[1]) continue; S.pluck(t, low[(k * 3) % low.length], 0.018, k % 2 ? 0.3 : -0.3, out, 1.2, 0.5); }
    // you find it: a low hit and a high glint
    S.thump(NR.plane, 0.16, out); S.tone(NR.plane, 2.4, 41.2, 0.05, 0, out, 'sine', 0.01, 2.0); S.tone(NR.plane + 0.4, 2.0, 1318.5, 0.006, 0.2, out, 'sine', 0.05, 1.6);
    const dr = ctx.createGain(); dr.connect(out); dr.gain.setValueAtTime(0, NR.plane);
    for (const [t, v] of [[NR.plane + 1.5, 0.018], [44, 0.026], [NR.plunge, 0.04], [NR.impact - 0.02, 0.05], [NR.impact, 0]]) dr.gain.linearRampToValueAtTime(v, t);
    for (const f of [55, 82.4, 116.5]) { const o = ctx.createOscillator(); o.type = f > 100 ? 'triangle' : 'sine'; o.frequency.value = f; o.connect(dr); o.start(NR.plane); o.stop(NR.impact + 0.05); }
    for (let i = 0; i < 4; i++) S.pluck(NR.balloon + 0.2 + i * 0.13, [440, 523.3, 659.3, 880][i], 0.02, 0.1, out, 1.2, 0.7);
    // into the plunge: the pulse doubles; a riser to the flash; then nothing
    for (let t = NR.plunge, k = 0; t < NR.impact - 0.05; t += 0.3, k++) S.tone(t, 0.12, k % 2 ? 61.7 : 55, 0.07, 0, out, 'triangle', 0.004, 0.1);
    const r2 = S.burst(NR.slow[1], NR.impact - NR.slow[1], 500, 0.7, 0.0, 0, out, 'pink', 0.5); r2.g.gain.cancelScheduledValues(NR.slow[1]); r2.g.gain.setValueAtTime(0, NR.slow[1]); r2.g.gain.linearRampToValueAtTime(0.06, NR.impact - 0.01); r2.g.gain.linearRampToValueAtTime(0, NR.impact); r2.b.frequency.exponentialRampToValueAtTime(2800, NR.impact);
    // the countdown to the sound: one tick a second, as the number changes
    for (let k = Math.floor(NR.boom - NR.impact - 0.9); k >= 1; k--) S.tick(NR.boom - k, 1500, 0.02, out);
    // the run: a driving low pulse
    for (let t = NR.boom + 0.5, k = 0; t < NR.look - 0.4; t += 0.3, k++) S.tone(t, 0.12, k % 4 === 3 ? 73.4 : 55, 0.06, 0, out, 'triangle', 0.004, 0.1);
    // the end: one held chord under the lines
    for (const f of [110, 164.8, 220, 246.9, 261.6]) S.tone(NR.look + 0.4, NR.black - NR.look - 0.4, f, 0.018, 0, out, 'triangle', 1.6, 0.05);
  }
}
