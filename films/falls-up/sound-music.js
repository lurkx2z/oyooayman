/* =====================================================================
   SOUND · MUSIC — an original score, all synthesised (the music kit of the gravity films): string pads, a felt piano
   (also played backwards, so notes swell up out of nothing), bells, a low drum, a heartbeat, a filtered synth pulse.
   The idea: a theme that climbs (A D F♯ A E), heard every time something falls up; at the end it comes back down.
     the kitchen   D major, light and curious; reversed piano into every hit on the ceiling (the glass, the spoon and the
                   grape together); the tea pours up on a rising string glide; the cat: the score holds its breath
                   through the slow-motion jump and lands with it
     the apple     a pulse that keeps speeding up as it climbs (it does: the air thins), the chords opening
     the park      warm and autumnal: reversed piano for the leaves going up, a big open chord for the fountain, a
                   light pulse at walking pace
     the runner    everything drops to a drone and a heartbeat when she leaves the ground; a hit when she grabs the
                   branch; hope for the coat, and nothing when it misses
     3:06–3:07     cold and high (the apple in the freezing air, the planes turned away)
     3:07:20 on    dread: a low pulse and a heartbeat to the countdown, a roll that rises through the ten seconds
     3:10          the score cuts out a moment before, then one huge hit as the ceiling comes down
     the end       the theme comes back down; the last time it climbs again and doesn't resolve, cut on the last frame
   ===================================================================== */

// the kit: string pads (three detuned oscillators per note through low-passes), felt piano (also reversed), bells,
// a low drum and a heartbeat
function fuMusicKit(ctx, K) {
  if (K._music) return K._music;
  const fx = K.fx, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(); bus.connect(K.bus);
  const hall = fx.ir(4.4, { bright: 0.5, damp: 2.8, shape: 2.0, pre: 0.025, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.55;
  bus.connect(hall); hall.connect(wet); wet.connect(K.bus);
  const drumModes = (f) => [[f, 0.7, 1], [f * 1.51, 0.45, 0.5], [f * 1.99, 0.3, 0.35], [f * 2.44, 0.2, 0.2], [f * 3.1, 0.12, 0.12]];
  const M = {
    bus,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4, dest = bus) => {
      const b = fx.pianoBuf(fuMidi(n)), len = Math.min(b.length, Math.ceil((dur + fade + 0.05) * fx.sr));
      return fx.play(b.subarray(0, len), t, dest, { vol: vel * 0.34, pan, stop: t + dur + fade, fade });
    },
    // a piano note played backwards: it swells up out of nothing and stops dead on its attack at tEnd
    rpiano(tEnd, n, vel, dur = 1.6, pan = 0) {
      const key = 'rp' + n + '_' + dur;
      if (!fx.cache[key]) {
        const b = fx.pianoBuf(fuMidi(n)), L = Math.min(b.length, Math.ceil(dur * fx.sr)), y = new Float32Array(L + Math.ceil(0.01 * fx.sr));
        for (let i = 0; i < L; i++) { const u = i / L; y[L - 1 - i] = b[i] * Math.min(1, (1 - u) / 0.35); }
        for (let i = 0; i < 0.01 * fx.sr; i++) y[L + i] = y[L - 1] * (1 - i / (0.01 * fx.sr));
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], tEnd - dur, bus, { vol: vel * 0.34, pan });
    },
    bell: (t, n, vol, pan = 0, dest = bus) => fx.play(fx.bellBuf(fuMidi(n)), t, dest, { vol: vol * 0.25, pan }),
    bellCut: (t, n, vol, d = 0.18, pan = 0) => fx.play(fx.bellBuf(fuMidi(n)), t, bus, { vol: vol * 0.25, pan, stop: t + d, fade: 0.05 }),
    // a low drum (a timpani-like membrane): f the pitch, vol, soft = a wider mallet, dk = decay
    drum(t, vol, f = 36.7, soft = 1, dk = 1) {
      const key = 'drum' + f + '_' + soft + '_' + dk;
      if (!fx.cache[key]) {
        const y = fx.hit(drumModes(f).map(([a, tau, b]) => [a, tau * dk, b]), { width: 0.006 * soft, amp: 1, noise: 0.25, nlen: 0.02, nhp: 300, len: 3.2 * Math.max(dk, 0.3) });
        const pk = FUX.peak(y) || 1; for (let i = 0; i < y.length; i++) y[i] /= pk;
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], t, bus, { vol: vol * 0.5 });
    },
    // a heartbeat: lub-dub on a soft low drum
    beat(t, vol) { M.drum(t, vol, 47, 1.6, 0.45); M.drum(t + 0.17, vol * 0.62, 52, 1.6, 0.4); },
    // a timpani roll from t0 to t1, its level following keys [[t, v], …]
    roll(t0, t1, keys, f = 73) {
      for (let t = t0, i = 0; t < t1; t += 0.065 + 0.012 * Math.sin(i * 1.7), i++) {
        let v = keys[0][1];
        for (let k = 1; k < keys.length; k++) if (t >= keys[k - 1][0]) v = keys[k - 1][1] + (keys[k][1] - keys[k - 1][1]) * MathX.clamp((t - keys[k - 1][0]) / (keys[k][0] - keys[k - 1][0]), 0, 1);
        M.drum(t, v * (0.8 + 0.2 * Math.sin(i * 2.3)), f, 1.6, 0.35);
      }
    },
    // a held chord: o.att/rel (s), o.cut → o.cutTo by o.cutAt (Hz), o.keys [[t, level]], o.wave, o.vib (cents),
    // o.glide (cents, from o.glideFrom by o.glideAt: the chord slides), o.wob [cents, rate Hz] (a slow seasick sway), o.pan
    strings(t0, t1, notes, vol, o = {}) {
      t0 = Math.max(0, t0); if (t1 - t0 < 0.1) return;
      const att = Math.min(o.att || 1.0, (t1 - t0) * 0.45), rel = Math.min(o.rel || 1.2, (t1 - t0) * 0.45), g = ctx.createGain();
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol * 0.11 * (o.keys ? o.keys[0][1] : 1), t0 + att);
      for (const [t, v] of (o.keys || [])) if (t > t0 + att && t < t1 - rel) g.gain.linearRampToValueAtTime(vol * 0.11 * v, t);
      const vEnd = o.keys ? o.keys[o.keys.length - 1][1] : 1;
      g.gain.linearRampToValueAtTime(vol * 0.11 * vEnd, Math.max(t0 + att + 0.01, t1 - rel)); g.gain.linearRampToValueAtTime(0, t1);
      g.connect(o.dest || bus);
      const lanes = [-0.55, 0, 0.55].map((p) => {
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.6; lp.frequency.setValueAtTime(o.cut || 1700, t0);
        if (o.cutTo) lp.frequency.linearRampToValueAtTime(o.cutTo, o.cutAt || (t1 - rel * 0.5));
        const pn = ctx.createStereoPanner(); pn.pan.value = Math.max(-1, Math.min(1, p + (o.pan || 0))); lp.connect(pn); pn.connect(g); return lp;
      });
      let wob = null;
      if (o.wob) { wob = ctx.createOscillator(); const wg = ctx.createGain(); wob.frequency.value = o.wob[1]; wg.gain.value = o.wob[0]; wob.connect(wg); wob.start(t0); wob.stop(t1 + 0.05); wob = wg; }
      for (const nn of notes) {
        const f = fuHz(nn);
        [-7, 1, 6].forEach((d, k) => {
          const osc = ctx.createOscillator(), og = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
          osc.type = o.wave || 'sawtooth'; osc.frequency.value = f;
          const d0 = d + r.range(-2, 2); osc.detune.setValueAtTime(d0, t0);
          if (o.glide) { osc.detune.setValueAtTime(d0, o.glideFrom || t0); osc.detune.linearRampToValueAtTime(d0 + o.glide, o.glideAt || t1); }
          lfo.frequency.value = r.range(4.4, 5.4); lg.gain.setValueAtTime(0, t0); lg.gain.linearRampToValueAtTime(o.vib == null ? 7 : o.vib, t0 + Math.min(1.5, (t1 - t0) * 0.6));
          lfo.connect(lg); lg.connect(osc.detune); if (wob) wob.connect(osc.detune);
          og.gain.value = 1 / Math.sqrt(notes.length); osc.connect(og); og.connect(lanes[k]);
          osc.start(t0); osc.stop(t1 + 0.05); lfo.start(t0); lfo.stop(t1 + 0.05);
        });
      }
    },
    // a chord progression: [[t0, notes], …] each held to the next; the last one ends at t1 (o.lastRel its release)
    prog(steps, t1, vol, o = {}) {
      steps.forEach(([t0, notes], i) => {
        const last = i + 1 >= steps.length;
        M.strings(t0, last ? t1 : steps[i + 1][0] + 0.35, notes, vol, Object.assign({ att: 0.6, rel: 0.6 }, o, last && o.lastRel ? { rel: o.lastRel } : {}));
      });
    },
  };
  return (K._music = M);
}

// a synth pulse: each step a short chord through a low-pass (cut → cutTo over the span); o.acc accents every n steps,
// o.ramp(u) the level over the span, o.wave, o.glide (cents over the span), o.stepAt(t) a changing step
function fuPulse(ctx, dest, t0, t1, notes, step, vol, o = {}) {
  if (t1 - t0 < step) return;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.q || 4;
  lp.frequency.setValueAtTime(o.cut || 600, t0); lp.frequency.linearRampToValueAtTime(o.cutTo || o.cut || 600, t1);
  lp.connect(g); g.connect(dest); g.gain.value = 0;
  notes.forEach((n, k) => {
    const os = ctx.createOscillator(); os.type = o.wave || 'sawtooth'; os.frequency.value = fuHz(n); os.detune.setValueAtTime(k % 2 ? 6 : -6, t0);
    if (o.glide) os.detune.linearRampToValueAtTime((k % 2 ? 6 : -6) + o.glide, t1);
    os.connect(lp); os.start(t0); os.stop(t1 + 0.1);
  });
  for (let t = t0, i = 0; t < t1 - 0.01; t += (o.stepAt ? o.stepAt(t) : step), i++) {
    const acc = o.acc && i % o.acc === 0 ? 1.0 : 0.62, ramp = o.ramp ? o.ramp((t - t0) / (t1 - t0)) : 1, v = vol * 0.05 * acc * ramp, st = o.stepAt ? o.stepAt(t) : step;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.setTargetAtTime(0, t + 0.012, st * (o.decay || 0.28));
  }
}



const FU_CH = {
  Dmaj9: ['D2', 'A2', 'F#3', 'C#4', 'E4'], Fsharp: ['F#1', 'C#2', 'A#2', 'E3', 'G#3'], Abmaj7: ['Ab1', 'Eb2', 'C3', 'G3', 'Bb3'], Fm9: ['F1', 'C2', 'Ab2', 'Eb3', 'G3'],
  Dm9: ['D2', 'A2', 'F3', 'C4', 'E4'], Bbmaj7: ['Bb1', 'F2', 'D3', 'A3', 'C4'], Gm9: ['G1', 'D2', 'Bb2', 'F3', 'A3'], A7sus: ['A1', 'E2', 'D3', 'G3', 'B3'],
  Fmaj7: ['F1', 'C2', 'A2', 'E3', 'G3'], Csus: ['C2', 'G2', 'C3', 'F3', 'G3'], low: ['D1', 'A1', 'D2'], Ebmaj7: ['Eb2', 'Bb2', 'D3', 'G3'],
  Aadd9: ['A1', 'E2', 'A2', 'C#3', 'E3', 'B3', 'C#4', 'E4', 'A4'], Dlyd: ['D2', 'A2', 'E3', 'F#3', 'G#3', 'C#4'], Bm9: ['B1', 'F#2', 'D3', 'A3', 'C#4'],
  Gmaj9: ['G1', 'D2', 'B2', 'F#3', 'A3'], Gadd9: ['G2', 'D3', 'A3', 'B3', 'D4'], Esus: ['E2', 'B2', 'E3', 'A3', 'B3'], high: ['A5', 'D6', 'E6', 'A6'],
  Em9: ['E2', 'B2', 'G3', 'D4', 'F#4'], Cm9: ['C2', 'G2', 'Eb3', 'Bb3', 'D4'], Dbig: ['D1', 'A1', 'D2', 'F#2', 'A2', 'D3', 'F#3', 'A3', 'E4'],
};
const FU_THEME = ['A4', 'D5', 'F#5', 'A5', 'E6'];   // the falling-up theme: it climbs (and at the end comes back down)
const fuOct = (n, k) => n.replace(/-?\d$/, (d) => String(+d + k));


fuSound('music', 'score', function (ctx, bus, K) {
  const M = fuMusicKit(ctx, K), C = FU_CH, c = fuC, B = fuB, f = fuFilmAt, END = FU.end, CEIL = FUP.ceil;
  const sh = (mode) => FU_SHOTS.find((s) => s.mode === mode);
  // the theme (bells): up, or back down (o.down); o.n notes, o.gap, o.oct
  const theme = (t, o = {}) => { const ns = FU_THEME.slice(0, o.n || 5), seq = o.down ? ns.slice().reverse() : ns;
    seq.forEach((n, i) => M.bell(t + i * (o.gap || 0.42), fuOct(n, o.oct || 0), (o.vol || 0.45) * (i === seq.length - 1 ? 0.85 : 1), [-0.35, -0.15, 0.05, 0.25, 0.4][i])); };
  // a quick climb (something just let go): four bells up in a fifth of a second
  const lift = (t, v = 0.35, oct = 0) => ['D6', 'F#6', 'A6', 'D7'].forEach((n, i) => M.bell(t + i * 0.06, fuOct(n, oct), v * (1 - 0.15 * i), -0.3 + 0.2 * i));
  const blow = (t, v = 1) => { M.drum(t, 0.9 * v, 36.7, 1.2, 1.3); M.drum(t + 0.015, 0.5 * v, 55, 1.4, 0.8); };
  const fig = (t0, t1, notes, step, vel, durK = 1.6) => { for (let t = t0, i = 0; t < t1 - 0.3; t += step, i++) M.piano(t, notes[i % notes.length], vel * (0.8 + 0.2 * Math.sin(i * 1.3)), step * durK, i % 2 ? 0.25 : -0.25); };
  // story moments
  const tGlassHit = f(fuHop(0, FU_HELD.glass[1], CEIL - 0.06).hit), tSGHit = f(fuHop(FU.sSG, FU_HELD.grape[1], CEIL - 0.006).hit);
  const tCatGo = f(FU.sCat), tCatLand = f(FU.sCat + FU_CAT_LAND), tLift = f(FU.sLift), tGrab = f(FU.sLift + 0.47), tCoat = f(FU.sCoat), tDrop = FU.tDrop;

  // ================================================================== 1 · the kitchen (D major, curious)
  M.strings(-0.4, B('real') + 0.4, C.Dmaj9, 0.42, { att: 1.2, rel: 1.0, cut: 1300 });
  M.rpiano(tGlassHit, 'A5', 0.42, 2.2, 0.2); M.bell(tGlassHit, 'D6', 0.4, 0.2); M.bell(tGlassHit + 0.01, 'A6', 0.22, 0.25);   // the glass, into the ceiling
  theme(4.3, { vol: 0.4, gap: 0.5 });
  fig(6.8, sh('sg').t0 - 0.2, ['D4', 'A4', 'F#4', 'E5', 'A4', 'B4'], 0.5, 0.17);
  // the spoon and the grape, together (one note, two octaves)
  M.rpiano(tSGHit, 'D5', 0.4, 2.0, -0.2); M.rpiano(tSGHit, 'D6', 0.3, 2.0, 0.2); M.bell(tSGHit, 'D6', 0.45, 0); M.bell(tSGHit, 'D7', 0.25, 0.1);
  fig(tSGHit + 0.8, B('real') - 0.2, ['F#4', 'A4', 'D5', 'A4'], 0.6, 0.15);
  // the one impossible part: a low, still chord
  M.prog([[B('real'), C.Bm9], [c('real', 1), C.Gmaj9]], B('kettle') + 0.4, 0.5, { cut: 1100 });
  M.piano(c('real', 0) + 0.2, 'B2', 0.35, 4); M.piano(c('real', 1) + 0.2, 'G2', 0.32, 4);
  // the kettle: the figure again (G); the tea pours up on a rising glide
  M.prog([[B('kettle'), C.Gadd9], [sh('puddle').t0, C.Em9]], B('cat') + 0.3, 0.45, { cut: 1500 });
  fig(B('kettle') + 0.3, f(FU.sPour[0]) - 0.2, ['G4', 'D5', 'B4', 'A5'], 0.45, 0.16);
  M.strings(f(FU.sPour[0]), f(FU.sPour[1]) + 1.2, ['D4', 'A4', 'D5'], 0.32, { att: 0.6, rel: 1.0, cut: 1800, cutTo: 3800, glide: 700, glideFrom: f(FU.sPour[0]), glideAt: f(FU.sPour[1]), vib: 4 });
  lift(f(FU.sPour[0]) + 0.3, 0.25);
  fig(sh('puddle').t0 + 0.5, B('cat') - 0.2, ['E4', 'B4', 'G4', 'F#5'], 0.7, 0.13);
  // the cat: a pulse while it gets ready; the score holds its breath through the jump and lands with it
  fuPulse(ctx, M.bus, B('cat'), tCatGo - 0.4, ['B1', 'F#2', 'B2'], 0.42, 0.6, { cut: 380, cutTo: 800, acc: 4, ramp: (u) => 0.4 + 0.6 * u });
  M.strings(B('cat'), tCatGo, C.Bm9, 0.4, { att: 0.8, rel: 0.3, cut: 900 });
  M.strings(tCatGo - 0.1, tCatLand + 0.2, ['F#5', 'B5'], 0.28, { att: 0.3, rel: 0.2, cut: 2600, vib: 2 });
  M.rpiano(tCatLand, 'B4', 0.35, 1.6, -0.1);
  M.bell(tCatLand, 'D6', 0.4, -0.2); M.bell(tCatLand + 0.05, 'F#6', 0.3, 0.2); M.piano(tCatLand, 'D3', 0.4, 4);
  M.prog([[tCatLand, C.Dmaj9], [B('stuck'), C.Gmaj9]], B('apple') + 0.3, 0.45, { cut: 1600, att: 0.4 });
  for (const s of FU.sCatHop) { const t = f(s); M.bell(t, 'A5', 0.28, -0.2); M.bell(t + 0.12, 'D6', 0.24, 0.2); M.bell(t + 0.42, 'A5', 0.2, 0); }
  // ================================================================== 2 · the apple: a pulse that speeds up as it climbs
  { const a0 = B('apple'), tA = f(FU.sApple), a1 = sh('appleUp').t1;
    M.strings(a0, tA + 0.2, C.Esus, 0.4, { att: 0.6, rel: 0.2, cut: 1100 });
    lift(tA + 0.05, 0.4); M.rpiano(tA + 0.05, 'E5', 0.3, 1.2);
    M.prog([[tA, C.Bm9], [c('apple', 1), C.Gmaj9], [c('apple', 2), C.Dmaj9], [sh('appleUp').t0 + 6, C.A7sus]], a1 + 0.4, 0.55, { cut: 1300, cutTo: 2600, att: 0.4 });
    const step = (t) => 0.5 - 0.3 * fuEv(t, tA, a1);
    fuPulse(ctx, M.bus, tA + 0.3, a1, ['D2', 'A2', 'D3', 'F#3'], 0.5, 0.85, { cut: 450, cutTo: 1800, acc: 4, stepAt: step, ramp: (u) => 0.4 + 0.6 * u });
    theme(sh('appleUp').t0 + 1.2, { vol: 0.42, gap: 0.55 });
    M.roll(a1 - 2.5, a1, [[a1 - 2.5, 0.03], [a1, 0.25]], 55); }
  // ---- the street: lighter (each loss a little climb)
  M.prog([[B('street'), C.Dmaj9], [c('street', 1), C.Bm9]], B('leaves') + 0.4, 0.42, { cut: 1500 });
  fuPulse(ctx, M.bus, B('street') + 0.2, B('leaves'), ['D3', 'A3'], 0.4, 0.5, { cut: 900, acc: 2, ramp: (u) => 0.7 + 0.3 * Math.sin(Math.PI * u) });
  for (const s of [FU.sKeys, FU.sCoffee, FU.sPhone]) lift(f(s) + 0.05, 0.28, 0);
  // ================================================================== 3 · the park (warm, autumnal)
  { const L0 = B('leaves'), L1 = B('fountain');
    M.prog([[L0, C.Gmaj9], [c('leaves', 1), C.Dmaj9]], L1 + 0.4, 0.55, { cut: 1500, att: 1.0 });
    // leaves going up: reversed piano notes, each swelling up to its own moment
    const ln = ['B5', 'D6', 'A5', 'F#6', 'G5', 'E6', 'D6', 'B5', 'A6'];
    for (let i = 0, t = L0 + 1.4; t < L1 - 0.3; t += 0.9 + 0.35 * Math.sin(i * 1.9), i++) M.rpiano(t, ln[i % ln.length], 0.2 + 0.05 * Math.sin(i), 1.1, i % 2 ? 0.35 : -0.35);
    theme(c('leaves', 1) + 0.2, { vol: 0.32, gap: 0.6, oct: -1 }); }
  // the fountain: a big open chord, opening as the water climbs
  M.strings(B('fountain'), B('fish') + 0.4, C.Dbig, 0.6, { att: 2.2, rel: 0.6, cut: 900, cutTo: 3200, cutAt: c('fountain', 1) + 1 });
  M.strings(c('fountain', 1), B('fish') + 0.3, ['A5', 'E6'], 0.18, { att: 1.5, cut: 4000, vib: 2 });
  // the carp, the ball, the scoop: light and quick, a climb for each
  M.prog([[B('fish'), C.Gadd9], [B('ball'), C.Em9], [B('scoop'), C.Gmaj9]], B('walk') + 0.3, 0.42, { cut: 1700, att: 0.3 });
  fig(B('fish') + 0.2, B('walk'), ['G4', 'B4', 'D5', 'B4', 'A4', 'D5'], 0.32, 0.14, 1.2);
  for (const s of [FU.sFish, FU.sKick, FU.sScoop]) lift(f(s) + 0.05, 0.32);
  // walking: a pulse at walking pace (one foot always down), steady
  { const W0 = B('walk'), W1 = sh('walk').t1;
    M.prog([[W0, C.Dmaj9], [c('walk', 1), C.Bm9]], W1 + 0.3, 0.45, { cut: 1300 });
    fig(W0 + 0.3, W1, ['D4', 'F#4', 'A4', 'F#4'], 0.56, 0.15, 1.4);
    // running: the same notes, with gaps
    for (let t = c('walk', 1) + 0.6, i = 0; t < W1 - 0.2; t += 0.28, i++) if (i % 3 !== 2) M.piano(t, ['A4', 'D5'][i % 2], 0.1, 0.2, 0.3); }
  // ================================================================== 4 · the runner
  M.strings(B('jogger'), tLift + 0.2, C.Dmaj9, 0.35, { att: 0.8, rel: 0.2, cut: 1400 });
  fig(B('jogger') + 0.4, f(FU.sRun), ['D5', 'A4', 'F#5', 'A4'], 0.4, 0.12, 1.2);
  fuPulse(ctx, M.bus, f(FU.sRun), tLift, ['D2', 'A2', 'D3'], 0.3, 0.7, { cut: 600, cutTo: 1400, acc: 2, ramp: (u) => 0.5 + 0.5 * u });
  // she leaves the ground: a drone and a heartbeat; the grab: a hit
  M.strings(tLift, B('hold') + 0.6, C.low, 0.45, { att: 0.15, rel: 0.4, cut: 380, vib: 0 });
  M.strings(tLift, tGrab + 0.1, ['B5', 'C6'], 0.18, { att: 0.4, rel: 0.1, cut: 3500, vib: 0 });
  blow(tGrab, 0.9); M.piano(tGrab, 'B1', 0.5, 4);
  { const H0 = B('hold'), H1 = sh('hold').t1;
    M.prog([[H0, C.Bm9], [c('hold', 1), C.Gmaj9], [c('hold', 2), C.Em9]], H1 + 0.4, 0.5, { cut: 1000, wob: [8, 0.2] });
    for (let t = H0 + 0.4; t < H1; t += 0.85) M.beat(t, 0.24 + 0.1 * fuEv(t, H0, H1));
    M.piano(c('hold', 2) + 0.3, 'E5', 0.3, 3); M.piano(c('hold', 2) + 1.2, 'G5', 0.25, 3); }
  // the coat: hope (a warm swell up to the throw); it goes past her (slow motion) and the score falls away
  { const R0 = B('rope'), R1 = sh('rope').t1;
    M.strings(R0, tCoat + 0.2, C.Ebmaj7, 0.5, { att: 1.5, rel: 0.2, cut: 1200, cutTo: 2600, cutAt: tCoat });
    M.rpiano(tCoat + 0.6, 'G5', 0.35, 1.8); lift(tCoat + 0.7, 0.3);
    M.strings(tCoat + 0.6, R1 + 0.4, ['C2', 'G2', 'Eb3'], 0.42, { att: 0.8, cut: 600, cutTo: 350, vib: 0 });
    M.piano(c('rope', 1) + 0.9, 'C3', 0.3, 4); }
  // the dog: a lighter moment (bells bouncing), then an uneasy pad
  { const D0 = B('dog'), D1 = sh('dog').t1, tD = f(FU.sDog);
    M.strings(D0, D1 + 0.3, C.Fmaj7, 0.4, { att: 0.6, cut: 1500 });
    fig(D0 + 0.3, tD, ['F4', 'C5', 'A4', 'G5'], 0.36, 0.14, 1.1); lift(tD + 0.1, 0.35, -1);
    for (let t = tD + 1.2, i = 0; t < D1 - 0.3; t += 0.7, i++) M.bell(t, ['C6', 'A5', 'G5', 'F5'][i % 4], 0.16, i % 2 ? 0.3 : -0.3); }
  // pigeons: light, high
  M.strings(B('pigeons'), sh('pigeons').t1 + 0.3, C.Fmaj7, 0.35, { att: 0.5, cut: 2200 });
  for (let t = B('pigeons') + 0.4, i = 0; t < sh('pigeons').t1 - 0.3; t += 0.55, i++) M.bell(t, ['A6', 'F6', 'C7', 'G6'][i % 4], 0.13, i % 2 ? 0.4 : -0.4);
  // ================================================================== 5 · 3:06–3:07: cold and high
  { const P0 = B('height'), P1 = sh('planes').t1;
    M.prog([[P0, C.Dlyd], [c('height', 1), C.Bm9], [B('planes'), C.Gmaj9], [c('planes', 1), C.Em9]], P1 + 0.4, 0.5, { cut: 2200, att: 1.0 });
    M.strings(P0, P1 + 0.3, C.high, 0.16, { att: 2.5, cut: 5000, vib: 1 });
    for (let t = P0 + 0.6, i = 0; t < P1 - 0.3; t += 1.25, i++) M.bell(t, ['E6', 'A6', 'D6', 'F#6', 'B6'][i % 5], 0.17, i % 2 ? 0.35 : -0.35); }
  // ================================================================== 6 · 3:07:20 → 3:10: dread
  { const W0 = B('warn'), W1 = sh('warn').t1;
    M.strings(W0, W1 + 0.4, C.Cm9, 0.5, { att: 1.0, cut: 900, wob: [12, 0.2] });
    fuPulse(ctx, M.bus, W0 + 0.5, W1 + 0.1, ['C2', 'G2', 'C3'], 0.5, 0.7, { cut: 420, cutTo: 900, acc: 4, ramp: (u) => 0.4 + 0.6 * u });
    for (let t = c('warn', 1); t < W1; t += 0.8) M.beat(t, 0.3); }
  // home: the ceiling full: low and still, a high held note over it
  M.strings(B('home'), sh('home').t1 + 0.3, C.Abmaj7, 0.5, { att: 1.0, cut: 800 });
  M.strings(B('home') + 1, sh('home').t1 + 0.2, ['C6'], 0.16, { att: 2, cut: 3000, vib: 1 });
  M.piano(c('home', 1) + 0.3, 'Ab2', 0.4, 4); M.piano(c('home', 1) + 0.9, 'Eb4', 0.25, 3);
  // she is still holding on
  M.strings(B('hold2'), sh('hold2').t1 + 0.3, C.Fm9, 0.5, { att: 0.6, cut: 1000, wob: [10, 0.25] });
  for (let t = B('hold2') + 0.3; t < sh('hold2').t1; t += 0.72) M.beat(t, 0.32);
  // the apple in space: a moment of quiet awe
  { const S0 = B('space'), S1 = sh('space').t1;
    M.strings(S0, S1 + 0.3, C.Aadd9, 0.55, { att: 1.4, cut: 2400, rel: 0.6 });
    theme(c('space', 0) + 0.3, { vol: 0.35, gap: 0.6, oct: 1 }); }
  // the last ten seconds: a heartbeat, a roll that rises, the strings opening; then nothing for a moment
  { const T0 = B('count'), tC = c('count', 0);
    M.strings(T0, tDrop - 0.35, C.Cm9, 0.6, { att: 1.0, rel: 0.1, cut: 600, cutTo: 2600, cutAt: tDrop - 0.4, keys: [[T0 + 1, 0.6], [tDrop - 0.5, 1.2]] });
    for (let k = 0; k < 10; k++) { const t = tC + 0.15 + k * (tDrop - 0.35 - tC - 0.15) / 10; M.beat(t, 0.3 + 0.05 * k); }
    M.roll(tC + 3, tDrop - 0.35, [[tC + 3, 0.03], [tDrop - 0.4, 0.55]], 55); }
  // 3:10: one huge hit as the ceiling comes down, a low chord ringing out under the slow motion
  { const tHit = f(FUP.T + 0.35);
    blow(tHit, 1.35); M.drum(tHit + 0.02, 0.7, 27.5, 1.5, 1.6);
    M.strings(tHit, sh('drop').t1 + 0.5, C.Dbig, 0.6, { att: 0.05, rel: 0.6, cut: 1600, cutTo: 500, vib: 0 });
    M.piano(tHit, 'D1', 0.6, 5); M.piano(tHit, 'D2', 0.5, 5); }
  // ================================================================== 7 · it comes back down; the question
  { const D0 = B('down'), Q0 = B('question');
    M.prog([[D0, C.Bm9], [c('down', 1), C.Gmaj9]], Q0 + 0.4, 0.55, { cut: 1400, att: 1.0 });
    theme(D0 + 1.4, { vol: 0.42, gap: 0.6, down: true });
    theme(c('down', 1) + 1.0, { vol: 0.32, gap: 0.7, down: true, oct: -1 });
    fig(D0 + 3.2, Q0, ['B4', 'F#4', 'D4', 'A3'], 0.6, 0.13);
    // the last time it climbs, and stops one note short (on the open fifth), cut on the last frame
    M.strings(Q0, END + 0.5, C.Dbig, 0.62, { att: 1.5, rel: 0.05, cut: 1100, cutTo: 4000, cutAt: END });
    theme(c('question', 0) + 0.4, { vol: 0.44, gap: 0.55, n: 4 });
    theme(c('question', 1) + 0.2, { vol: 0.38, gap: 0.4, n: 4, oct: 1 });
    M.roll(END - 3.5, END, [[END - 3.5, 0.03], [END, 0.35]], 55); }
});
