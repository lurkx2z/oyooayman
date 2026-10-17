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

trSound('music', 'score', function (ctx, bus, K) {
  const M = trMusicKit(ctx, K), T = TR, B = 60 / 112, S16 = B / 4;
  const C = trRunClock(), ex = trExClock(), kc = trKickClock();
  const runLand = C.inv(TR_DEMO.tLand), exitT = C.inv(TR_DEMO_EXIT), kickLaunch = kc.inv(kc.launchT), kickLand = kc.inv(kc.launchT + kc.flight);
  // ---- 1: the start line: a low held E, a piano figure, a tick that tightens
  M.strings(0, T.go + 0.1, ['E1', 'E2', 'B2'], 0.6, { att: 2.0, rel: 0.2, cut: 420, cutTo: 900, cutAt: T.go });
  M.piano(0.6, 'E4', 0.42, 2.5, -0.2); M.piano(1.5, 'B4', 0.32, 2.2, 0.2); M.piano(2.4, 'G4', 0.3, 2.2, 0); M.piano(3.6, 'F#4', 0.3, 2.2, 0.1);
  trPulse(ctx, M.bus, T.hero, T.go, ['E3'], B / 2, 0.5, { cut: 900, cutTo: 2200, ramp: (u) => 0.3 + 0.7 * u, decay: 0.15 });
  // ---- the launch: a hit, the pulse at full drive through the run, strings opening over the loop
  M.drum(T.go + 0.25, 1.0, 41); M.drum(T.go + 0.25, 0.5, 82);
  trPulse(ctx, M.bus, T.go + 0.25, C.tLoop, TR_CH.Em.slice(1), S16, 0.9, { cut: 1400, cutTo: 3200, acc: 4 });
  for (let t = T.go + 0.25; t < C.tLoop; t += B) M.drum(t, 0.45, 55, 1.2, 0.5);
  M.strings(C.tLoop - 0.2, C.tAir + 0.3, ['E2', 'B2', 'G3', 'D4', 'F#4'], 1.1, { att: 0.6, rel: 0.4, cut: 900, cutTo: 3000, cutAt: C.tAir });
  trPulse(ctx, M.bus, C.tLoop, C.tAir, TR_CH.C.slice(1), S16 * 2, 0.6, { cut: 1200, cutTo: 2600, acc: 2 });
  // in the air: suspended (no pulse), a high bell, then the landing hit
  M.strings(C.tAir, runLand + 0.4, ['A2', 'E3', 'B3', 'E4'], 0.9, { att: 0.3, rel: 0.3, cut: 2400 });
  M.bell(C.tAir + 0.05, 'B5', 0.5, 0.3);
  M.drum(runLand, 1.1, 41); M.drum(runLand + 0.02, 0.6, 98, 0.8);
  trPulse(ctx, M.bus, runLand + 0.05, T.replay, TR_CH.Em.slice(1), S16, 0.7, { cut: 2000, cutTo: 900, acc: 4 });
  // the replay: slow, low, curious
  M.prog([[T.replay, TR_CH.Em], [trW(3, 'so').start, TR_CH.C]], T.plane + 0.2, 0.7, { cut: 900 });
  M.piano(trW(3, 'hang').start, 'B4', 0.35, 2, 0.1); M.piano(trW(3, 'plane').start, 'E5', 0.3, 2, -0.1);
  // ---- 2: the sky: airy G and D, a light pulse; the stall pulls the floor out
  M.prog([[T.plane, TR_CH.Gmaj7], [T.lift, TR_CH.D], [T.inv, TR_CH.Em], [T.noseUp, TR_CH.C], [T.slow, TR_CH.Am]], T.stall, 0.85, { cut: 1800 });
  trPulse(ctx, M.bus, T.three, T.slow, ['G4', 'D5'], B / 2, 0.45, { cut: 2600, decay: 0.35 });
  for (const [t, n] of [[T.wing, 'D5'], [T.liftW, 'B5'], [trW(6, 'down').start, 'G5'], [trW(6, 'down', 10).start, 'D5']]) M.bell(t, n, 0.45, 0.2);
  M.strings(T.slow, T.stall + 0.1, ['A2', 'E3', 'A3', 'C4'], 0.9, { att: 0.5, rel: 0.05, cut: 1600, cutTo: 500, cutAt: T.stall });
  M.drum(T.stall, 0.7, 36, 2); M.strings(T.stall + 0.05, T.suck + 0.2, ['E1', 'B1'], 0.8, { att: 0.05, rel: 0.6, cut: 300 });
  M.piano(T.fall + 0.1, 'E3', 0.4, 2.2, 0); M.piano(T.fall + 0.7, 'D#3', 0.32, 2, 0);
  // ---- 3: suction: a low, curious pulse; it rises on "two g's"
  M.prog([[T.suck, TR_CH.Em], [T.press, TR_CH.C], [T.twoG, TR_CH.G], [T.tenth, TR_CH.D], [T.creep, TR_CH.Em]], T.leave, 0.75, { cut: 1000 });
  trPulse(ctx, M.bus, T.fans, T.leave, ['E2', 'B2'], S16 * 2, 0.6, { cut: 500, cutTo: 1400, decay: 0.2 });
  M.bell(T.twoG + 0.6, 'E5', 0.45, -0.2);
  // the drop: a riser through the slow fall, the drums on "thrust", the roll, the landing hit
  M.strings(T.leave, T.thrust, ['B1', 'F#2', 'C3'], 0.9, { att: 0.4, rel: 0.2, cut: 400, cutTo: 1600, cutAt: T.thrust });
  M.drum(T.thrust, 0.9, 41); M.drum(T.thrust, 0.4, 82);
  M.prog([[T.thrust, TR_CH.Em], [T.nozzles, TR_CH.C], [T.blast, TR_CH.D], [T.rolled, TR_CH.Bm]], T.brk + 0.2, 0.85, { cut: 1600 });
  trPulse(ctx, M.bus, T.nozzles, T.brk, TR_CH.Em.slice(1), S16 * 2, 0.6, { cut: 900, cutTo: 2400, acc: 2 });
  M.roll(T.rolled, T.brk, [[T.rolled, 0.15], [T.brk, 0.55]], 80);
  M.drum(T.brk + 0.8, 1.0, 41); M.drum(T.brk + 0.82, 0.5, 98);
  // ---- 5: the hover: a ticking clock (the tanks), cut dead on "seconds"
  M.strings(T.hover, T.empty, ['E2', 'B2', 'E3'], 0.6, { att: 1.0, rel: 0.05, cut: 700, cutTo: 1500, cutAt: T.empty });
  for (let t = T.hover + 0.9, i = 0; t < T.empty; t += B / 2, i++) K.put(K.fx.hit([[2400, 0.02, 1], [3600, 0.015, 0.5]], { width: 0.0003 }), t, { vol: i % 2 ? 0.05 : 0.08, norm: true, pan: i % 2 ? 0.25 : -0.25 });
  M.drum(T.empty + 0.85, 0.8, 41, 1.5);
  M.prog([[T.empty + 0.5, TR_CH.C], [T.heli, TR_CH.G], [T.bottle, TR_CH.Am]], T.hop + 0.2, 0.7, { cut: 1200 });
  M.piano(T.heli + 0.2, 'G4', 0.3, 2.5, -0.2); M.piano(T.bottle, 'E4', 0.32, 2.5, 0.2);
  // ---- 6: the hop: four bars building, a hit on the launch, the landing
  trPulse(ctx, M.bus, T.hop, kickLaunch, TR_CH.Em.slice(1), S16, 0.85, { cut: 700, cutTo: 3000, acc: 4, ramp: (u) => 0.4 + 0.6 * u });
  for (let t = T.hop; t < kickLaunch; t += B) M.drum(t, 0.35 + 0.3 * (t - T.hop) / (kickLaunch - T.hop), 55, 1.2, 0.5);
  M.drum(kickLaunch, 1.0, 41); M.bell(kickLaunch + 0.05, 'E6', 0.4, 0);
  M.strings(kickLaunch, kickLand + 0.3, ['E2', 'B2', 'G3', 'B3', 'E4', 'G4'], 1.1, { att: 0.15, rel: 0.3, cut: 2600 });
  M.drum(kickLand, 1.1, 41); M.drum(kickLand + 0.02, 0.6, 98);
  trPulse(ctx, M.bus, kickLand, T.real + 0.4, TR_CH.Em.slice(1), S16, 0.8, { cut: 2600, cutTo: 900, acc: 4 });
  // the verdict: resolved, quiet; the last question swells to the cut
  M.prog([[T.real, TR_CH.C], [T.promise, TR_CH.Am], [T.pov - 0.6, TR_CH.Dsus]], T.pov, 0.7, { cut: 1300 });
  M.piano(trW(18, 'clings').start, 'G4', 0.28, 2, 0); M.piano(trW(18, 'closed').start, 'B4', 0.26, 2, 0.1); M.piano(trW(18, 'production').start, 'A4', 0.26, 2, -0.1);
  M.strings(T.pov, T.end + 0.2, ['E2', 'B2', 'G3', 'B3', 'E4'], 1.0, { att: 1.6, rel: 0.05, cut: 900, cutTo: 2800, cutAt: T.end - 0.3 });
  trPulse(ctx, M.bus, T.pov + 0.6, T.end, ['E3', 'B3'], S16, 0.6, { cut: 800, cutTo: 2600, ramp: (u) => 0.3 + 0.7 * u });
  M.roll(T.end - 2.2, T.end, [[T.end - 2.2, 0.1], [T.end, 0.6]], 80);
});
