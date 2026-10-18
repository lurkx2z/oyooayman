/* =====================================================================
   SOUND · MUSIC — an original score in E minor, all synthesised: string pads, a felt piano, bells, low drums (the kit
   is the Africa film's, renamed) and a filtered synth pulse for the machine. It follows the film's shape:
   a held breath on the start line; the pulse kicks in with the launch, the strings open through the loop and hang in
   the air; the sky section is airy (G, D) until the stall pulls the floor out; suction is a curious low pulse; the
   drop is a riser; thrust lands on drums; the hover is a ticking clock that stops dead; the hop builds four bars and
   lands; the verdict resolves; the last shot swells and is cut on the final frame.
   ===================================================================== */

// the kit: string pads (three detuned saws per note through low-passes), the felt piano, bells, a low drum
function trMusicKit(ctx, K) {
  if (K._music) return K._music;
  const fx = K.fx, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(); bus.connect(K.bus);
  const hall = fx.ir(3.6, { bright: 0.5, damp: 3.2, shape: 2.0, pre: 0.02, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.45;
  bus.connect(hall); hall.connect(wet); wet.connect(K.bus);
  const drumModes = (f) => [[f, 0.7, 1], [f * 1.51, 0.45, 0.5], [f * 1.99, 0.3, 0.35], [f * 2.44, 0.2, 0.2], [f * 3.1, 0.12, 0.12]];
  const M = {
    bus,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4) => {
      const b = fx.pianoBuf(gbMidi(n)), len = Math.min(b.length, Math.ceil((dur + fade + 0.05) * fx.sr));
      return fx.play(b.subarray(0, len), t, bus, { vol: vel * 0.34, pan, stop: t + dur + fade, fade });
    },
    bell: (t, n, vol, pan = 0) => fx.play(fx.bellBuf(gbMidi(n)), t, bus, { vol: vol * 0.25, pan }),
    // a low drum (a timpani-like membrane): f the pitch, vol, soft = a wider mallet
    drum(t, vol, f = 49, soft = 1, dk = 1) {
      const key = 'drum' + f + '_' + soft + '_' + dk;
      if (!fx.cache[key]) {
        const y = fx.hit(drumModes(f).map(([a, tau, b]) => [a, tau * dk, b]), { width: 0.006 * soft, amp: 1, noise: 0.25, nlen: 0.02, nhp: 300, len: 3.2 * Math.max(dk, 0.3) });
        let pk = 0; for (let i = 0; i < y.length; i++) pk = Math.max(pk, Math.abs(y[i])); for (let i = 0; i < y.length; i++) y[i] /= pk;
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], t, bus, { vol: vol * 0.5 });
    },
    // a timpani roll from t0 to t1, the level following keys [[t, v], …] (higher and shorter strokes than single hits,
    // so the roll stays a roll and does not pile up into a sub drone)
    roll(t0, t1, keys, f = 80) {
      for (let t = t0, i = 0; t < t1; t += 0.065 + 0.012 * Math.sin(i * 1.7), i++) {
        let v = keys[0][1];
        for (let k = 1; k < keys.length; k++) if (t >= keys[k - 1][0]) v = keys[k - 1][1] + (keys[k][1] - keys[k - 1][1]) * MathX.clamp((t - keys[k - 1][0]) / (keys[k][0] - keys[k - 1][0]), 0, 1);
        M.drum(t, v * (0.8 + 0.2 * Math.sin(i * 2.3)), f, 1.6, 0.35);
      }
    },
    strings(t0, t1, notes, vol, o = {}) {
      if (t1 - t0 < 0.1) return;
      const att = Math.min(o.att || 1.0, (t1 - t0) * 0.45), rel = Math.min(o.rel || 1.2, (t1 - t0) * 0.45), g = ctx.createGain();
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol * 0.11 * (o.keys ? o.keys[0][1] : 1), t0 + att);
      for (const [t, v] of (o.keys || [])) if (t > t0 + att && t < t1 - rel) g.gain.linearRampToValueAtTime(vol * 0.11 * v, t);
      const vEnd = o.keys ? o.keys[o.keys.length - 1][1] : 1;
      g.gain.linearRampToValueAtTime(vol * 0.11 * vEnd, Math.max(t0 + att + 0.01, t1 - rel)); g.gain.linearRampToValueAtTime(0, t1);
      g.connect(bus);
      const lanes = [-0.55, 0, 0.55].map((p) => {
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.6; lp.frequency.setValueAtTime(o.cut || 1700, t0);
        if (o.cutTo) lp.frequency.linearRampToValueAtTime(o.cutTo, o.cutAt || (t1 - rel * 0.5));
        const pn = ctx.createStereoPanner(); pn.pan.value = Math.max(-1, Math.min(1, p + (o.pan || 0))); lp.connect(pn); pn.connect(g); return lp;
      });
      for (const nn of notes) {
        const f = gbHz(nn);
        [-7, 1, 6].forEach((d, k) => {
          const osc = ctx.createOscillator(), og = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
          osc.type = o.wave || 'sawtooth'; osc.frequency.value = f; osc.detune.value = d + r.range(-2, 2);
          lfo.frequency.value = r.range(4.4, 5.4); lg.gain.setValueAtTime(0, t0); lg.gain.linearRampToValueAtTime(o.vib == null ? 7 : o.vib, t0 + Math.min(1.5, (t1 - t0) * 0.6));
          lfo.connect(lg); lg.connect(osc.detune);
          og.gain.value = 1 / Math.sqrt(notes.length); osc.connect(og); og.connect(lanes[k]);
          osc.start(t0); osc.stop(t1 + 0.05); lfo.start(t0); lfo.stop(t1 + 0.05);
        });
      }
    },
    // a chord progression: [[t0, notes], …] each held to the next; o as strings()
    prog(steps, t1, vol, o = {}) {
      steps.forEach(([t0, notes], i) => M.strings(t0, i + 1 < steps.length ? steps[i + 1][0] + 0.35 : t1, notes, vol, Object.assign({ att: 0.6, rel: 0.6 }, o)));
    },
  };
  return (K._music = M);
}


// a synth pulse: each step a short saw chord through a low-pass (cut → cutTo over the span); o.acc accents every n
function trPulse(ctx, dest, t0, t1, notes, step, vol, o = {}) {
  if (t1 - t0 < step) return;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.q || 4;
  lp.frequency.setValueAtTime(o.cut || 600, t0); lp.frequency.linearRampToValueAtTime(o.cutTo || o.cut || 600, t1);
  lp.connect(g); g.connect(dest); g.gain.value = 0;
  const oscs = notes.map((n, k) => { const os = ctx.createOscillator(); os.type = 'sawtooth'; os.frequency.value = gbHz(n); os.detune.value = (k % 2 ? 6 : -6); os.connect(lp); os.start(t0); os.stop(t1 + 0.1); return os; });
  for (let t = t0, i = 0; t < t1 - 0.01; t += step, i++) {
    const acc = o.acc && i % o.acc === 0 ? 1.0 : 0.62, ramp = o.ramp ? o.ramp((t - t0) / (t1 - t0)) : 1, v = vol * 0.05 * acc * ramp;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.setTargetAtTime(0, t + 0.012, step * (o.decay || 0.28));
  }
}

const TR_CH = {
  Em: ['E2', 'B2', 'G3', 'B3'], C: ['C2', 'G2', 'E3', 'G3'], G: ['G1', 'D2', 'B2', 'D3'], D: ['D2', 'A2', 'F#3', 'A3'],
  Bm: ['B1', 'F#2', 'D3', 'F#3'], Am: ['A1', 'E2', 'C3', 'E3'], Gmaj7: ['G2', 'D3', 'F#3', 'B3'], Dsus: ['D2', 'A2', 'E3', 'A3'],
};

// the moment the race car drops off the tunnel ceiling (its downforce falls below its weight)
function trTrackFallT() { for (let t = TR.catch; t < TR.toy; t += 0.01) if (trTrackCatchDF(t) < 1) return t; return TR.toy - 1.5; }

trSound('music', 'score', function (ctx, bus, K) {
  const M = trMusicKit(ctx, K), T = TR, B = 60 / 112, S16 = B / 4, W = (n, w, f) => trW(n, w, f).start;
  const C = trRunClock(), kc = trKickClock();
  const runLand = C.inv(TR_DEMO.tLand), kickLaunch = kc.inv(kc.launchT), kickLand = kc.inv(kc.launchT + kc.flight);
  const skyRec = trSkyT().rec, tFallTk = trTrackFallT(), flatCrash = T.flatFall + Math.sqrt(2 * (2 * TR_R + 0.03 - TR_CG - 0.66) / TR_G);
  // ---- 1: the cold open and the title: a low held E, a piano figure; the site from above opens out; the route is
  //      drawn on a rising pulse that hands over to the launch
  M.strings(0, T.when + 0.3, ['E1', 'E2', 'B2'], 0.6, { att: 2.0, rel: 0.5, cut: 420, cutTo: 900, cutAt: T.when });
  M.piano(0.6, 'E4', 0.42, 2.5, -0.2); M.piano(2.3, 'B4', 0.32, 2.2, 0.2); M.piano(4.0, 'G4', 0.34, 2.2, 0); M.piano(T.title[0] + 0.2, 'F#4', 0.3, 2.2, 0.1);
  M.drum(T.title[0], 0.6, 41, 1.5);
  M.prog([[T.when, TR_CH.Em], [W(3, 'a'), TR_CH.C], [W(3, 'tesla'), TR_CH.G], [W(3, 'does'), TR_CH.D]], T.did + 0.2, 0.8, { cut: 1300 });
  M.bell(W(3, 'october'), 'B5', 0.3, 0.2);
  M.prog([[T.did, TR_CH.Em], [W(4, 'hangs'), TR_CH.C], [W(4, 'then'), TR_CH.D]], T.go, 0.7, { cut: 900, cutTo: 1800 });
  for (const [w, n] of [['curls', 'B4'], ['hangs', 'G4'], ['lets', 'D5'], ['lands', 'E5']]) M.piano(W(4, w), n, 0.3, 1.8, 0);
  trPulse(ctx, M.bus, T.did + 1.0, T.go, ['E3'], B / 2, 0.5, { cut: 900, cutTo: 2200, ramp: (u) => 0.3 + 0.7 * u, decay: 0.15 });
  // ---- the launch: a hit, the pulse at full drive through the run, strings opening over the loop
  M.drum(T.go + 0.25, 1.0, 41); M.drum(T.go + 0.25, 0.5, 82);
  trPulse(ctx, M.bus, T.go + 0.25, C.tLoop, TR_CH.Em.slice(1), S16, 0.9, { cut: 1400, cutTo: 3200, acc: 4 });
  for (let t = T.go + 0.25; t < C.tLoop; t += B) M.drum(t, 0.45, 55, 1.2, 0.5);
  M.strings(C.tLoop - 0.2, C.tAir + 0.3, ['E2', 'B2', 'G3', 'D4', 'F#4'], 1.1, { att: 0.6, rel: 0.4, cut: 900, cutTo: 3000, cutAt: C.tAir });
  trPulse(ctx, M.bus, C.tLoop, C.tAir, TR_CH.C.slice(1), S16 * 2, 0.6, { cut: 1200, cutTo: 2600, acc: 2 });
  M.strings(C.tAir, runLand + 0.4, ['A2', 'E3', 'B3', 'E4'], 0.9, { att: 0.3, rel: 0.3, cut: 2400 });
  M.bell(C.tAir + 0.05, 'B5', 0.5, 0.3);
  M.drum(runLand, 1.1, 41); M.drum(runLand + 0.02, 0.6, 98, 0.8);
  // the claims: the pulse keeps going, lighter; a bell on each claim
  trPulse(ctx, M.bus, runLand + 0.05, T.questions, TR_CH.Em.slice(1), S16 * 2, 0.6, { cut: 2000, cutTo: 1100, acc: 4 });
  M.prog([[T.claims, TR_CH.Em], [W(5, 'ten'), TR_CH.C], [W(5, 'fans'), TR_CH.G], [W(5, 'on'), TR_CH.D]], T.questions + 0.3, 0.7, { cut: 1500 });
  for (const [w, n] of [['zero', 'E5'], ['ten', 'G5'], ['fans', 'B5'], ['sale', 'D6']]) M.bell(W(5, w), n, 0.4, 0.2);
  // the replay: slow, low, curious; three questions, three notes
  M.prog([[T.questions, TR_CH.Em], [W(6, 'how'), TR_CH.C], [W(6, 'why'), TR_CH.Am], [W(6, 'and'), TR_CH.Bm]], T.three + 0.2, 0.7, { cut: 900 });
  M.piano(W(6, 'ceiling'), 'B4', 0.35, 2, 0.1); M.piano(W(6, 'plane'), 'E5', 0.3, 2, -0.1); M.piano(W(6, 'fly'), 'F#5', 0.34, 2.4, 0);
  // ---- 2: the wing. Airy G and D, a light pulse; the speed demo lifts; the stall pulls the floor out; the pull-out
  M.prog([[T.three, TR_CH.Gmaj7], [T.plane, TR_CH.G], [T.lift, TR_CH.D], [T.speed, TR_CH.G], [T.inv, TR_CH.Em], [T.noseUp, TR_CH.C], [T.slow, TR_CH.Am]], T.stall, 0.8, { cut: 1800 });
  trPulse(ctx, M.bus, T.plane, T.slow, ['G4', 'D5'], B / 2, 0.42, { cut: 2600, decay: 0.35 });
  for (const [t, n] of [[T.wing, 'D5'], [T.liftW, 'B5'], [W(9, 'down'), 'G5'], [W(10, 'four'), 'D6']]) M.bell(t, n, 0.42, 0.2);
  M.strings(W(10, 'twice') - 0.2, T.inv, ['G2', 'D3', 'B3', 'D4', 'G4'], 0.9, { att: 1.0, rel: 0.8, cut: 900, cutTo: 3200, cutAt: W(10, 'four') + 0.5 });
  M.strings(T.slow, T.stall + 0.1, ['A2', 'E3', 'A3', 'C4'], 0.9, { att: 0.5, rel: 0.05, cut: 1600, cutTo: 500, cutAt: T.stall });
  M.drum(T.stall, 0.7, 36, 2); M.strings(T.stall + 0.05, skyRec, ['E1', 'B1'], 0.8, { att: 0.05, rel: 0.6, cut: 300 });
  M.piano(T.fall + 0.1, 'E3', 0.4, 2.2, 0); M.piano(T.fall + 0.7, 'D#3', 0.32, 2, 0);
  M.prog([[skyRec - 0.4, TR_CH.D], [skyRec + 2.0, TR_CH.G]], T.race + 0.3, 0.85, { cut: 1600, cutTo: 2600 });
  M.bell(skyRec + 0.5, 'D6', 0.4, -0.2);
  // the race car: a faster drive; in the tunnel it echoes; "slow down": the pulse slows, and stops as it falls
  trPulse(ctx, M.bus, T.race, T.catch, TR_CH.Em.slice(1), S16, 0.8, { cut: 1600, cutTo: 3000, acc: 4 });
  for (let t = T.race; t < T.catch - 0.1; t += B) M.drum(t, 0.4, 55, 1.2, 0.5);
  M.prog([[T.race, TR_CH.Em], [W(16, 'their'), TR_CH.C], [W(16, 'engineers'), TR_CH.D], [T.theory, TR_CH.Bm]], T.catch + 0.3, 0.75, { cut: 1500 });
  for (let t = T.catch, step = S16 * 2, i = 0; t < tFallTk; t += step, step *= 1.09, i++) M.drum(t, 0.35, 55, 1.2, 0.4);
  M.strings(T.catch, tFallTk + 0.05, ['B1', 'F#2', 'D3'], 0.8, { att: 0.3, rel: 0.05, cut: 1200, cutTo: 400, cutAt: tFallTk });
  M.drum(tFallTk + 0.6, 0.9, 41, 1.5);
  // ---- 3: the loop: a toy-box piano and bells; the real-time run gets a quick swirl
  M.prog([[T.toy, TR_CH.C], [T.curve, TR_CH.G], [W(19, 'top'), TR_CH.Am], [W(19, 'fast'), TR_CH.D]], T.numbers + 0.2, 0.55, { cut: 1300 });
  for (let t = T.toy + 0.5, i = 0; t < T.toyRun - 0.3; t += B, i++) M.piano(t, ['G4', 'C5', 'E5', 'D5', 'G4', 'B4', 'D5', 'C5'][i % 8], 0.16, 0.9, (i % 2 ? 0.3 : -0.3));
  for (let i = 0; i < 6; i++) M.bell(T.toyRun + 0.2 + i * 0.09, ['C6', 'E6', 'G6', 'C7', 'G6', 'E6'][i], 0.22, -0.5 + i * 0.2);
  M.prog([[T.numbers, TR_CH.Em], [W(20, 'stunt'), TR_CH.G], [T.flat, TR_CH.C], [W(21, 'flat', 3), TR_CH.Am]], T.flatFall, 0.7, { cut: 1300 });
  M.strings(T.flatFall - 0.4, flatCrash, ['B1', 'F#2', 'C3'], 0.8, { att: 0.3, rel: 0.05, cut: 400, cutTo: 1600, cutAt: flatCrash });
  M.drum(flatCrash, 1.0, 41); M.drum(flatCrash + 0.02, 0.5, 98);
  // ---- 4: suction: a low, curious pulse; it rises on "two g's"
  M.prog([[T.suck, TR_CH.Em], [T.fans, TR_CH.C], [T.press, TR_CH.G], [T.twoG, TR_CH.D], [T.tenth, TR_CH.Em]], T.old + 0.3, 0.72, { cut: 1000 });
  trPulse(ctx, M.bus, T.fans, T.old, ['E2', 'B2'], S16 * 2, 0.55, { cut: 500, cutTo: 1400, decay: 0.2 });
  M.bell(T.twoG + 0.6, 'E5', 0.45, -0.2); M.bell(T.tenth + 0.3, 'B4', 0.35, 0.2);
  // the fan cars: a period groove (1970), a fanfare for the win (1978), a modern pulse for the rig (2025)
  trPulse(ctx, M.bus, T.old, W(27, 'banned') - 0.1, TR_CH.Am.slice(1), S16 * 2, 0.6, { cut: 1100, acc: 2 });
  for (let t = T.old; t < W(27, 'banned') - 0.2; t += B) { M.drum(t, 0.4, 55, 1.2, 0.5); M.drum(t + B / 2, 0.22, 98, 0.8, 0.3); }
  M.prog([[T.old, TR_CH.Am], [W(27, 'chaparral'), TR_CH.D]], W(27, 'banned'), 0.6, { cut: 1500 });
  M.drum(W(27, 'banned'), 0.8, 36, 2); M.piano(W(27, 'banned') + 0.05, 'C3', 0.4, 2, 0);
  trPulse(ctx, M.bus, T.brabham, W(28, 'then') - 0.1, TR_CH.D.slice(1), S16, 0.6, { cut: 1500, cutTo: 2800, acc: 4 });
  M.prog([[T.brabham, TR_CH.D], [W(28, 'won'), TR_CH.G]], W(28, 'then'), 0.75, { cut: 2000 });
  for (const [i, n] of [[0, 'D5'], [1, 'G5'], [2, 'B5'], [3, 'D6']]) M.bell(W(28, 'won') + i * 0.13, n, 0.35, -0.3 + i * 0.2);
  M.prog([[W(28, 'then'), TR_CH.Bm]], T.mcm + 0.2, 0.7, { cut: 800 });
  M.piano(W(28, 'withdrawn'), 'B2', 0.4, 2.4, 0);
  M.prog([[T.mcm, TR_CH.Em], [W(29, 'used'), TR_CH.C], [W(29, 'grip'), TR_CH.G], [W(29, 'no'), TR_CH.D]], T.surface + 0.3, 0.75, { cut: 1300, cutTo: 2400 });
  trPulse(ctx, M.bus, T.mcm, T.surface, ['E3', 'B3'], S16, 0.5, { cut: 900, cutTo: 2200, acc: 4 });
  // back under the ramp: "it needs a surface"; the drop is a riser; drums on "thrust"
  M.prog([[T.surface, TR_CH.Em]], T.leave, 0.6, { cut: 900 });
  M.strings(T.leave, T.thrust, ['B1', 'F#2', 'C3'], 0.9, { att: 0.4, rel: 0.2, cut: 400, cutTo: 1600, cutAt: T.thrust });
  M.drum(T.thrust, 0.9, 41); M.drum(T.thrust, 0.4, 82);
  // ---- 5: thrust. Space: a wide, still pad and bells; the frozen fall, low; the nozzles pulse; the roll; the landing
  M.strings(T.newton - 0.1, T.cold + 0.3, ['E2', 'B2', 'F#3', 'B3', 'E4'], 0.7, { att: 0.4, rel: 0.4, cut: 2200, vib: 3 });
  M.bell(W(33, 'throw'), 'E6', 0.35, -0.3); M.bell(W(33, 'pushed'), 'B5', 0.35, 0.3); M.bell(W(33, 'rocket'), 'F#6', 0.3, 0);
  M.prog([[T.cold, TR_CH.Em], [W(34, 'air'), TR_CH.C]], T.space2, 0.6, { cut: 800 });
  M.strings(T.space2 - 0.1, T.nozzles + 0.2, ['E2', 'B2', 'G3', 'B3', 'E4'], 0.6, { att: 0.3, rel: 0.3, cut: 2400, vib: 3 });
  M.prog([[T.nozzles, TR_CH.Em], [W(35, 'four'), TR_CH.C], [T.blast, TR_CH.D], [T.rolled, TR_CH.Bm]], T.brk + 0.2, 0.85, { cut: 1600 });
  trPulse(ctx, M.bus, T.nozzles, T.brk, TR_CH.Em.slice(1), S16 * 2, 0.6, { cut: 900, cutTo: 2400, acc: 2 });
  M.roll(T.rolled, T.brk, [[T.rolled, 0.15], [T.brk, 0.55]], 80);
  M.drum(T.brk + 0.8, 1.0, 41); M.drum(T.brk + 0.82, 0.5, 98);
  // the hover: low and patient for the arithmetic; then a ticking clock (the tanks) from lift-off, cut dead on "seconds"
  M.prog([[T.hover, TR_CH.Am], [T.weight, TR_CH.Em], [T.kilos, TR_CH.C]], T.lift0 + 0.2, 0.6, { cut: 900 });
  M.piano(W(38, 'hover'), 'E4', 0.3, 2.2, 0);
  M.strings(T.lift0, T.empty, ['E2', 'B2', 'E3'], 0.65, { att: 1.0, rel: 0.05, cut: 700, cutTo: 1600, cutAt: T.empty });
  for (let t = T.lift0 + 0.5, i = 0; t < T.empty; t += B / 2, i++) K.put(K.fx.hit([[2400, 0.02, 1], [3600, 0.015, 0.5]], { width: 0.0003 }), t, { vol: i % 2 ? 0.05 : 0.08, norm: true, pan: i % 2 ? 0.25 : -0.25 });
  M.drum(T.empty + 0.85, 0.8, 41, 1.5);
  M.prog([[T.empty + 0.5, TR_CH.C], [T.heli, TR_CH.G], [W(43, 'grabs'), TR_CH.D], [T.bottle, TR_CH.Am]], T.hop + 0.2, 0.7, { cut: 1200 });
  M.piano(T.heli + 0.2, 'G4', 0.3, 2.5, -0.2); M.piano(T.bottle, 'E4', 0.32, 2.5, 0.2); M.piano(W(44, 'empty'), 'C4', 0.3, 2.5, 0);
  // ---- the hop: building bars, a hit on the launch, the landing
  trPulse(ctx, M.bus, T.hop, kickLaunch, TR_CH.Em.slice(1), S16, 0.85, { cut: 700, cutTo: 3000, acc: 4, ramp: (u) => 0.4 + 0.6 * u });
  for (let t = T.hop; t < kickLaunch; t += B) M.drum(t, 0.35 + 0.3 * (t - T.hop) / (kickLaunch - T.hop), 55, 1.2, 0.5);
  M.drum(kickLaunch, 1.0, 41); M.bell(kickLaunch + 0.05, 'E6', 0.4, 0);
  M.strings(kickLaunch, kickLand + 0.3, ['E2', 'B2', 'G3', 'B3', 'E4', 'G4'], 1.1, { att: 0.15, rel: 0.3, cut: 2600 });
  M.drum(kickLand, 1.1, 41); M.drum(kickLand + 0.02, 0.6, 98);
  trPulse(ctx, M.bus, kickLand, T.real, TR_CH.Em.slice(1), S16, 0.8, { cut: 2600, cutTo: 900, acc: 4 });
  // ---- 6: the verdict: resolved and quiet; a piano note per line; the timeline steps; the FAA
  M.prog([[T.real - 0.6, TR_CH.C], [W(48, 'a'), TR_CH.G], [T.promise, TR_CH.Am], [T.timeline, TR_CH.Em], [T.legal, TR_CH.C], [W(50, 'so'), TR_CH.G]], T.human, 0.65, { cut: 1300 });
  for (const [n, w, f, note] of [[48, 'clings', 0, 'G4'], [48, 'jumps', 0, 'B4'], [48, 'closed', 0, 'D5'], [48, 'nobody', 0, 'G5'], [49, 'onesecond', 0, 'A4'], [49, 'roadgoing', 0, 'C5'], [49, 'price', 0, 'E5']]) M.piano(W(n, w, f) - 0.1, note, 0.24, 1.8, 0);
  for (const [w, f, note] of [['that', 0, 'E5'], ['twentyeight', 0, 'B5'], ['seventeen', 0, 'G4'], ['twenty', 27, 'B4']]) M.bell(W(49, w, f), note, 0.3, 0);
  // ---- 7: you. Low and close; the blood note; the last question swells to the cut
  M.prog([[T.human, TR_CH.Em], [W(52, 'your'), TR_CH.C], [W(52, 'blood'), TR_CH.Am], [W(52, 'and'), TR_CH.Bm]], T.pov, 0.6, { cut: 900 });
  M.piano(W(51, 'you'), 'E3', 0.42, 2.6, 0); M.piano(W(52, 'harness'), 'B3', 0.3, 2, 0); M.piano(W(52, 'blood'), 'C4', 0.3, 2, 0);
  M.strings(T.pov, T.end + 0.2, ['E2', 'B2', 'G3', 'B3', 'E4'], 1.0, { att: 1.6, rel: 0.05, cut: 900, cutTo: 2800, cutAt: T.end - 0.3 });
  trPulse(ctx, M.bus, T.pov + 0.6, T.end, ['E3', 'B3'], S16, 0.6, { cut: 800, cutTo: 2600, ramp: (u) => 0.3 + 0.7 * u });
  M.roll(T.end - 2.2, T.end, [[T.end - 2.2, 0.1], [T.end, 0.6]], 80);
});
