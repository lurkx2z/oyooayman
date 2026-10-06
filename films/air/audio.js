/* =====================================================================
   SOUNDTRACK — "What if air became 10× denser?"
   Sound itself is unchanged (the scenario keeps sound propagation normal).
   The wind is the lead: its roar follows the push (airLoad: ½ρU²), not the
   speed, so the same 60 km/h sounds like a storm. Every hero event has its
   sound (the throw, the cyclist's chain and breath, the car's engine and
   its wind noise as it coasts, the clamp's clank and the sheet's flutter,
   fabric, metal, wood, glass); the music stays underneath: curiosity,
   then a pulse, then it builds, then the payoff, then silence.
   Events are scheduled on story time and land twice when they fall inside
   the cold open (story 35–38 = film 0–3).
   ===================================================================== */

class AirAudio extends AudioEngine {
  constructor(tl, app) { super(tl); this.app = app; this.wavName = SCRIPT.meta.wav; }
  fingerprintData() { return [AR, AIR_PEOPLE, AIR_CITY, AIR_CAR.COAST]; }

  // a soft ceiling just under full scale, and nothing at all after the cut
  async renderOffline() {
    const buf = await super.renderOffline(), sr = buf.sampleRate;
    for (let c = 0; c < buf.numberOfChannels; c++) { const o = buf.getChannelData(c); for (let i = 0; i < o.length; i++) { const x = o[i], ax = Math.abs(x); if (i / sr >= AR.black) o[i] = 0; else if (ax > 0.6) o[i] = Math.sign(x) * (0.6 + 0.2 * Math.tanh((ax - 0.6) / 0.2)); } }
    return buf;
  }

  _kit(ctx) {
    const S = new SoundKit(ctx, CONFIG.seed);
    S.env = (g, t, a, peak, d) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(Math.max(0.0002, peak), t + Math.max(a, 0.004)); g.gain.setTargetAtTime(0, t + Math.max(a, 0.004), Math.max(0.004, d / 4)); };
    S.tone = (t, dur, f, vol, pan, dest, type = 'sine', attack = 0.01, release = null) => {
      if (vol <= 0.0005 || t < 0) return; const o = ctx.createOscillator(), g = ctx.createGain(), r = release || dur * 0.3; o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + Math.max(0.006, attack)); g.gain.setValueAtTime(vol, t + Math.max(attack, dur - r)); g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(g); g.connect(S.panned(dest, pan)); o.start(t); o.stop(t + dur + 0.05); return o;
    };
    S.burst = (t, dur, f, q, vol, pan, dest, type = 'white', a = 0.004) => {
      if (t < 0) return; const n = S.noise(type, t, t + dur + 0.05), b = S.filter('bandpass', f, q), g = ctx.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.setTargetAtTime(0, t + a, dur / 3); n.connect(b); b.connect(g); g.connect(S.panned(dest, pan)); return { b, g };
    };
    return S;
  }

  _build(ctx) {
    const S = this._kit(ctx), end = CONFIG.duration, rng = new RNG(4242);
    this.S = S;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 2.6; comp.attack.value = 0.01; comp.release.value = 0.25;
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -2; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.1;
    const mix = ctx.createGain(); mix.gain.value = 2.2; mix.connect(comp);
    const out = ctx.createGain(); comp.connect(out); out.connect(lim); lim.connect(ctx.destination);
    out.gain.setValueAtTime(0, 0); out.gain.linearRampToValueAtTime(0.9, 0.03); out.gain.setValueAtTime(0.9, AR.black - 0.01); out.gain.linearRampToValueAtTime(0, AR.black);
    const rev = S.reverb(1.6), rs = ctx.createGain(); rs.gain.value = 0.3; rev.connect(rs); rs.connect(mix);
    const music = ctx.createGain(); music.gain.value = 0.8; music.connect(mix);
    // a story event lands at film time S (and at S − 35 if it falls in the cold open)
    this.at = (s, fn) => { if (s >= AR.coldS && s < AR.coldS + AR.cold) fn(s - AR.coldS); if (s >= AR.rewind[1]) fn(s); };
    this._wind(S, mix, end);
    this._city(S, mix, end, rng);
    this._steps(S, mix);
    this._beats(S, mix, rev);
    this._failures(S, mix, rev, rng);
    this._billboard(S, mix, rev);
    this._music(S, music, end);
  }

  // the wind: a low roar, a howl whose pitch climbs, a high rustle — all from the push, sampled 30× a second
  _wind(S, mix, end) {
    const ctx = S.ctx;
    const lay = (type, kind, f, q, pan) => { const n = S.noise(type, 0, end + 1), b = S.filter(kind, f, q), g = ctx.createGain(), p = S.panned(mix, pan); g.gain.value = 0; n.connect(b); b.connect(g); g.connect(p); return { g, b }; };
    const low = lay('brown', 'lowpass', 260, 0.7, -0.15), howl = lay('pink', 'bandpass', 700, 3.5, 0.2), hi = lay('white', 'highpass', 3800, 0.6, -0.3), body = lay('pink', 'bandpass', 380, 0.8, 0.1);
    for (let t = 0; t <= end; t += 1 / 30) {
      const s = airStory(t), L = airLoad(s), rw = t >= AR.rewind[0] && t < AR.rewind[1] ? 1 - (t - AR.rewind[0]) / (AR.rewind[1] - AR.rewind[0]) : 0;
      const l = rw > 0 ? Math.max(L * rw, 0.004) : L;
      low.g.gain.linearRampToValueAtTime(0.03 + 0.3 * Math.pow(l, 0.8), t);
      body.g.gain.linearRampToValueAtTime(0.004 + 0.09 * l, t);
      howl.g.gain.linearRampToValueAtTime(0.002 + 0.05 * Math.max(0, l - 0.15), t); howl.b.frequency.linearRampToValueAtTime(480 + 950 * Math.sqrt(l), t);
      hi.g.gain.linearRampToValueAtTime(0.002 + 0.03 * l, t);
    }
  }

  // the city: traffic, birds, the café — fading as the wind takes over
  _city(S, mix, end, rng) {
    const ctx = S.ctx, n = S.noise('brown', 0, end), lp = S.filter('lowpass', 180, 0.7), g = ctx.createGain(); n.connect(lp); lp.connect(g); g.connect(S.panned(mix, -0.2));
    g.gain.setValueAtTime(0.12, 0);
    for (let t = 0; t <= end; t += 0.25) g.gain.linearRampToValueAtTime(t < AR.rewind[1] ? 0.08 : 0.24 * (1 - 0.5 * MathX.smooth(airStory(t), 26, 31)), t);
    for (let t = AR.rewind[1] + 0.2; t < 25.6; t += rng.range(0.4, 1.8)) { const f = rng.range(2600, 4200), p = rng.range(-0.8, 0.8); for (let k = 0; k < rng.int(1, 3); k++) S.chirp(t + k * 0.11, f, 0.015, p, mix, false); }
    S.chatter(AR.rewind[1], 27.5, 0.026, 0.45, mix, 420, 3.2);
    for (let t = AR.rewind[1] + 1.2; t < 26; t += rng.range(2.5, 5)) S.tone(t, 0.12, rng.range(2400, 3400), 0.005, 0.5, mix, 'sine', 0.002, 0.1);
    // passing traffic hiss now and then (left), louder in the dense air
    for (let t = AR.rewind[1] + 0.8; t < end; t += rng.range(2.2, 4.5)) { const k = S.burst(t, 1.6, 700, 0.6, 0.02 * (1 + airLoad(t)), -0.6, mix, 'pink', 0.6); }
  }

  // your footsteps when you walk
  _steps(S, mix) {
    const C = this.app.cam, ph = C.stepPh;
    for (let i = 1; i < ph.length; i++) { const t = i * C.dt; if (t > AR.rewind[1] && Math.floor(ph[i]) !== Math.floor(ph[i - 1])) S.step(t, 0.045, 0, mix); }
  }

  // the demonstrations: throw, cyclist, car, the fall
  _beats(S, mix, rev) {
    const ctx = S.ctx;
    // the throw: a short whoosh that dies at once; the ball lands short, bounces
    const tt = AR.throwT, fl = AIR_BALL.dense.rows; let land = tt + 1.33;
    for (let i = 1; i < fl.length; i++) if (fl[i].y <= 0.26 && fl[i - 1].y > 0.26) { land = tt + fl[i].t; break; }
    const w = S.burst(tt, 0.5, 1400, 1.2, 0.05, 0.55, mix); w.b.frequency.setValueAtTime(1800, tt); w.b.frequency.exponentialRampToValueAtTime(500, tt + 0.5);
    S.tone(land, 0.12, 180, 0.04, 0.55, mix, 'sine', 0.003, 0.1); S.tone(land + 0.42, 0.1, 200, 0.02, 0.55, mix, 'sine', 0.003, 0.08);
    // the cyclist: chain and freewheel, hard breathing as he passes on your left, his tyres
    for (let t = AR.cyc; t < 16.2; t += 0.12) S.click(t, 0.008 * (1 - Math.abs(t - 13.6) / 3), -0.5, mix);
    for (let t = AR.cyc + 0.6; t < 15.6; t += 0.85) S.breath(t, 0.45, true, 0.018 * (1 - Math.abs(t - 13.6) / 3), mix);
    const cw = S.burst(12.6, 2.6, 2000, 0.8, 0.012, -0.5, mix, 'white', 0.8);
    // the car: engine at speed, comes past; lifts off — the engine note drops, the wind noise round it fades with its speed; then power
    const o = ctx.createOscillator(), og = ctx.createGain(), olp = S.filter('lowpass', 900, 0.8), p = ctx.createStereoPanner(); o.type = 'sawtooth';
    o.connect(olp); olp.connect(og); og.connect(p); p.connect(mix);
    const nz = S.noise('pink', 15.0, 22), nb = S.filter('bandpass', 900, 0.7), ng = ctx.createGain(); nz.connect(nb); nb.connect(ng); ng.connect(p);
    og.gain.setValueAtTime(0, 15.0); ng.gain.setValueAtTime(0, 15.0);
    for (let t = 15.0; t <= 22; t += 1 / 30) {
      const z = this.app.traffic.heroZ(t), v = this.app.traffic.heroSpeed(t), dz = z - 2.0, dist = Math.hypot(dz, 7.85), near = 1 / (1 + dist / 8);
      const lift = t > AR.car && t < AR.car + AIR_CAR.COAST, rpm = lift ? 0.55 : t > AR.car + AIR_CAR.COAST ? 0.85 + 0.1 * MathX.smooth(t, 20, 21) : 1;
      o.frequency.linearRampToValueAtTime((60 + 2.2 * v) * rpm * (dz > 0 ? 1.06 : 0.94), t);
      og.gain.linearRampToValueAtTime(0.13 * near * (lift ? 0.45 : 1), t);
      ng.gain.linearRampToValueAtTime(0.3 * near * Math.pow(v / 25, 2), t);
      p.pan.linearRampToValueAtTime(MathX.clamp(-dz / 12, -0.9, 0.9) * -0.6 - 0.3, t);
    }
    o.start(15.0); o.stop(22.2);
    // the fall: a creak above; the clamp clanks down; the sheet flutters down and slaps the pavement
    const creak = S.burst(20.85, 0.6, 520, 6, 0.03, 0.1, mix, 'pink', 0.15); creak.b.frequency.linearRampToValueAtTime(380, 21.4);
    const cl = AR.fall + 1.66;
    for (const [f, v] of [[2650, 0.045], [3980, 0.03], [5600, 0.018], [1320, 0.03]]) S.tone(cl, 0.5, f, v, 0.15, mix, 'sine', 0.001, 0.48);
    S.click(cl, 0.05, 0.15, mix); S.tone(cl + 0.2, 0.25, 3100, 0.012, 0.15, mix, 'sine', 0.001, 0.22);
    const fl2 = S.noise('pink', AR.fall, AR.fall + 3.9), fb = S.filter('bandpass', 260, 1.1), fg = ctx.createGain(); fl2.connect(fb); fb.connect(fg); fg.connect(S.panned(mix, 0.1));
    fg.gain.setValueAtTime(0, AR.fall); for (let t = AR.fall; t < AR.fall + 3.85; t += 0.05) fg.gain.linearRampToValueAtTime(0.065 * Math.abs(Math.sin((t - AR.fall) * 2.3)) * Math.min(1, (t - AR.fall) * 1.5), t);
    fg.gain.linearRampToValueAtTime(0, AR.fall + 3.85);
    S.whump(AR.fall + 3.83, 0.06, 0.1, mix); S.burst(AR.fall + 3.83, 0.15, 1500, 0.8, 0.04, 0.1, mix);
    // the interface
    for (const t of [5.9, 6.6, 7.3]) S.tone(t, 0.08, 1320, 0.012, 0, mix, 'sine', 0.003, 0.06);
    S.thump(AR.eq, 0.05, mix);
  }

  // the street lets go: fabric, plastic, metal, wood
  _failures(S, mix, rev, rng) {
    const ctx = S.ctx, B = AR.brk;
    // fabric: the awning and the umbrellas flap harder as the push grows (from the wind's rise on, and in the cold open)
    const fab = S.noise('white', 0, CONFIG.duration), fbp = S.filter('bandpass', 900, 0.9), fgn = ctx.createGain(), am = ctx.createGain();
    fab.connect(fbp); fbp.connect(am); am.connect(fgn); fgn.connect(S.panned(mix, 0.35)); fgn.gain.value = 0;
    for (let t = 0; t <= CONFIG.duration; t += 1 / 40) {
      const s = airStory(t), L = t > AR.rewind[0] && t < AR.rewind[1] ? 0 : airLoad(s);
      fgn.gain.linearRampToValueAtTime(0.06 * Math.min(1, L), t); am.gain.linearRampToValueAtTime(0.3 + 0.7 * Math.abs(Math.sin(t * (9 + 6 * L))), t);
    }
    // the hanging sign tears off one hook
    this.at(B.blade, (t) => { S.click(t, 0.05, 0.4, mix); S.tone(t, 0.6, 1900, 0.02, 0.4, mix, 'sine', 0.001, 0.55); for (let k = 0; k < 6; k++) S.click(t + 0.08 + k * 0.07, 0.015, 0.4, mix); });
    // the bin goes over and slides into the road
    this.at(B.bin, (t) => { S.whump(t + 0.45, 0.06, 0.1, mix); for (let k = 0; k < 10; k++) S.clunk(t + 0.5 + k * 0.19 + rng.range(0, 0.05), 0.025, 0.05, mix); });
    // the umbrella: a snap, then it rattles away across the street
    this.at(B.umbrella, (t) => { S.burst(t, 0.12, 2500, 1.2, 0.05, 0.1, mix); S.click(t, 0.04, 0.1, mix); for (let k = 0; k < 8; k++) S.clunk(t + 0.6 + k * 0.28, 0.015 * (1 - k / 9), -0.3 - k * 0.06, mix); });
    // the pole sign: its mount groans, it goes down with a clang
    this.at(B.sign, (t) => { const g = S.tone(t, 0.6, 140, 0.03, 0.25, mix, 'sawtooth', 0.05, 0.3); if (g) g.frequency.linearRampToValueAtTime(90, t + 0.6); for (const [f, v] of [[1200, 0.04], [2350, 0.02], [3700, 0.01]]) S.tone(t + 0.55, 0.7, f, v, 0.25, mix, 'sine', 0.001, 0.65); });
    // the cyclist is shoved: the bike clatters, a foot scrapes
    this.at(B.cyclist, (t) => { S.clunk(t + 0.3, 0.03, 0.3, mix); S.burst(t + 0.7, 0.4, 1800, 0.7, 0.02, 0.3, mix); S.breath(t + 0.1, 0.5, true, 0.02, mix); });
    // the branch: a crack, then the crash of leaves and wood
    this.at(B.branch, (t) => { S.burst(t, 0.08, 1500, 0.6, 0.12, 0.05, mix); S.thump(t, 0.06, mix); S.burst(t + 0.85, 0.6, 1100, 0.5, 0.05, -0.1, mix, 'pink', 0.02); S.whump(t + 0.85, 0.05, -0.1, mix); });
    // the roof sheet: a thunder-sheet wobble as it peels and flies
    this.at(B.roof, (t) => { const n = S.noise('pink', t, t + 2.4), b = S.filter('bandpass', 140, 2.5), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = 7; lg.gain.value = 60; lfo.connect(lg); lg.connect(b.frequency); lfo.start(t); lfo.stop(t + 2.4);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.09, t + 0.3); g.gain.linearRampToValueAtTime(0, t + 2.3); n.connect(b); b.connect(g); g.connect(S.panned(mix, -0.2)); S.clunk(t + 0.25, 0.04, -0.3, mix); });
  }

  // the billboard: strain, bolts, the tear, the flight, the crash and the glass; the car's brakes and horn
  _billboard(S, mix, rev) {
    const ctx = S.ctx, A = AR.bill;
    const groan = (t0, t1, v) => { const o = ctx.createOscillator(), b = S.filter('bandpass', 180, 3), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = 48;
      lfo.frequency.value = 3.3; lg.gain.value = 6; lfo.connect(lg); lg.connect(o.frequency); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + 0.6); g.gain.setValueAtTime(v, t1 - 0.2); g.gain.linearRampToValueAtTime(0, t1);
      o.connect(b); b.connect(g); g.connect(S.panned(mix, -0.15)); o.start(t0); lfo.start(t0); o.stop(t1 + 0.05); lfo.stop(t1 + 0.05); };
    groan(0.2, 2.9, 0.03);                                      // (heard in the cold open too)
    groan(A.look - 0.3, A.tear + 0.3, 0.05);
    for (let i = 0; i < 4; i++) { const t = A.bolts + i * 0.5; S.tone(t, 0.35, 3400 + i * 180, 0.03, -0.1, mix, 'sine', 0.001, 0.33); S.click(t, 0.04, -0.1, mix); }
    // the tear: a shriek of metal, a deep wrench
    const sh = S.burst(A.tear, 0.9, 1400, 4, 0.06, -0.1, mix, 'white', 0.05); sh.b.frequency.linearRampToValueAtTime(700, A.tear + 0.8);
    S.boom(A.tear + 0.05, 0.05, mix, rev);
    const wh = S.burst(A.tear + 0.5, 1.4, 500, 0.7, 0.07, 0.0, mix, 'pink', 0.5); wh.b.frequency.linearRampToValueAtTime(260, A.glass);
    // the car: brakes hard (tyres), a horn
    const sq = S.burst(A.swerve + 0.1, 1.0, 2600, 3, 0.035, 0.25, mix, 'white', 0.08);
    S.horn(A.swerve + 0.2, 400, 505, 0.03, 0.25, mix);
    // the crash on the bus shelter: a heavy hit, steel, then the glass
    S.boom(A.glass, 0.14, mix, rev); S.crunch(A.glass, 0.1, 0.3, mix, rev);
    const gb = S.crackleBuffer(1.4, 900), src = ctx.createBufferSource(), hp = S.filter('highpass', 2500, 0.7), gg = ctx.createGain(); src.buffer = gb; gg.gain.value = 0.35; src.connect(hp); hp.connect(gg); gg.connect(S.panned(mix, 0.3)); src.start(A.glass + 0.02);
    for (let k = 0; k < 18; k++) { const t = A.glass + 0.05 + k * 0.05 + (k * 37 % 11) / 300; S.tone(t, 0.12, 3000 + (k * 911) % 3000, 0.012, 0.3, mix, 'sine', 0.001, 0.1); }
    // the last sheet across the lens: a rush right past your head
    const fs = S.burst(AR.sweep - 0.15, 0.45, 600, 0.6, 0.12, 0.0, mix, 'pink', 0.2); fs.b.frequency.linearRampToValueAtTime(220, AR.black);
    S.thump(AR.black - 0.05, 0.08, mix);
  }

  // the music: curiosity, a pulse, building, the payoff — always under the sound of the street
  _music(S, out, end) {
    const ctx = S.ctx;
    // cold open: a low tension drone; the rewind: a reverse swell
    for (const f of [55, 82.4]) S.tone(0, 3.1, f, 0.02, 0, out, 'sine', 0.05, 0.3);
    const rs = S.burst(AR.rewind[0], 1.7, 900, 0.8, 0.0, 0, out, 'pink', 1.5); rs.g.gain.cancelScheduledValues(AR.rewind[0]); rs.g.gain.setValueAtTime(0, AR.rewind[0]); rs.g.gain.linearRampToValueAtTime(0.05, AR.rewind[1] - 0.05); rs.g.gain.linearRampToValueAtTime(0, AR.rewind[1]);
    // curiosity: soft plucks
    const notes = [392, 523.3, 587.3, 659.3, 587.3, 523.3, 440, 392];
    for (let t = AR.rewind[1] + 0.2, k = 0; t < 10.2; t += 0.62, k++) S.pluck(t, notes[k % notes.length], 0.032, (k % 2 ? 0.3 : -0.3), out, 1.2, 0.6);
    // tension: a quiet pulse (a low thud on the beat), faster as it goes
    for (let t = 10.2, k = 0; t < AR.wind; t += 0.6 - 0.1 * MathX.smooth(t, 10, 25), k++) S.tone(t, 0.18, k % 4 === 0 ? 65 : 55, 0.045, 0, out, 'sine', 0.004, 0.16);
    // building: a rising drone and the pulse on top, louder
    const dr = ctx.createGain(); dr.connect(out); dr.gain.setValueAtTime(0, AR.wind);
    for (const [t, v] of [[AR.wind + 1, 0.025], [35, 0.04], [42.6, 0.05], [44.2, 0.06], [AR.black - 0.02, 0.06], [AR.black, 0]]) dr.gain.linearRampToValueAtTime(v, t);
    for (const f of [55, 82.4, 110, 164.8]) { const o = ctx.createOscillator(); o.type = f > 100 ? 'triangle' : 'sine'; o.frequency.value = f; o.connect(dr); o.start(AR.wind); o.stop(AR.black + 0.05); }
    for (let t = AR.wind, k = 0; t < 44.2; t += 0.45 - 0.12 * MathX.smooth(t, 30, 44), k++) S.tone(t, 0.16, k % 2 ? 73.4 : 55, 0.04 + 0.03 * MathX.smooth(t, 30, 44), 0, out, 'sine', 0.004, 0.14);
    // payoff: one held chord under the last shot
    for (const f of [110, 164.8, 220, 277.2]) S.tone(44.2, AR.black - 44.2, f, 0.014, 0, out, 'triangle', 0.4, 0.05);
  }
}
