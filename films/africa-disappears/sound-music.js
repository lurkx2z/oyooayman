/* =====================================================================
   SOUND · MUSIC — an original score in D minor (strings, a felt piano, low drums, a few bells), all synthesised.
   It follows the film's shape: a question, a shock, a network breaking, the oceans (the big swell, peaking in the
   first narration-free beat), loss (sparse piano), a held breath for the phone, then the rebuild to the final
   swell, which the mix cuts to silence on the last frame.
   ===================================================================== */

// the kit: string pads (three detuned saws per note through low-passes), the felt piano, bells, a low drum
function afMusicKit(ctx, K) {
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

const AF_CH = {
  Dm: ['D2', 'A2', 'F3', 'A3'], Bb: ['Bb1', 'F2', 'D3', 'F3'], F: ['F2', 'C3', 'A3', 'C4'], C: ['C2', 'G2', 'E3', 'G3'],
  Gm: ['G1', 'D2', 'Bb2', 'D3'], A: ['A1', 'E2', 'C#3', 'E3'], Dlo: ['D1', 'D2', 'A2'],
};

afSound('music', 'score', function (ctx, bus, K) {
  const M = afMusicKit(ctx, K), A = AF;
  // ---- 1: the question, then the vanish (a swell that opens as the continent goes)
  M.strings(0, A.van0 + 0.2, ['D2', 'A2'], 0.55, { att: 1.6, rel: 0.4, cut: 500 });
  M.piano(0.25, 'D4', 0.5, 2.8, -0.2); M.piano(1.45, 'A4', 0.34, 2.4, 0.2); M.piano(2.35, 'F4', 0.3, 2.0, 0);
  M.strings(A.van0 - 0.35, A.van0 + 3.2, ['D1', 'D2', 'A2', 'F3', 'D4'], 1.4, { att: 0.5, rel: 1.6, cut: 380, cutTo: 2400, cutAt: A.van0 + 1.2 });
  M.drum(A.van0, 0.9, 41);
  M.strings(A.van0 + 2.2, A.mine + 0.4, AF_CH.Dm, 0.75, { att: 1.5, rel: 0.5, cut: 1100, keys: [[A.van0 + 3, 1], [A.erased, 0.9], [A.erasedW, 1.15], [A.mine, 1]] });
  M.piano(A.erased + 0.05, 'A4', 0.4, 3, 0.15); M.piano(A.erasedW + 0.02, 'D4', 0.45, 3, -0.1); M.piano(A.erasedW + 0.6, 'F4', 0.32, 2.4, 0.2);
  // ---- 2: the mine: a held breath and a heartbeat; the land goes and the music with it; then the industry
  for (let t = A.mine + 0.3; t < A.mineGo - 0.05; t += 0.86) { M.drum(t, 0.22, 46, 2); M.drum(t + 0.28, 0.14, 46, 2); }
  M.strings(A.mine, A.mineGo, ['D2', 'A2', 'E4'], 0.6, { att: 1.2, rel: 0.08, cut: 700 });
  M.strings(A.mineGo + 1.1, A.platinum + 0.3, ['D2', 'Eb2', 'A2'], 0.55, { att: 1.0, rel: 0.3, cut: 520 });
  // the factory: a muted-piano ostinato that drives the line, chords under it; it stops dead when the line does
  const STOP = A.goneW + 0.1, PAT = ['D3', 'D3', 'A3', 'D3', 'F3', 'D3', 'A3', 'C4'];
  for (let i = 0, t = A.platinum; t < STOP - 0.05; i++, t = A.platinum + i * 0.25) {
    const thin = t > A.gone && i % 2 === 1;
    if (!thin) M.piano(t, PAT[i % 8], (i % 4 === 0 ? 0.5 : 0.34) * (t > A.gone ? 0.75 : 1), 0.14, (i % 2 ? 0.3 : -0.3), 0.06);
  }
  M.prog([[A.platinum, AF_CH.Dm], [A.cobalt + 0.6, AF_CH.Bb], [A.battery, AF_CH.F], [A.battery + 1.3, AF_CH.C], [A.gone, AF_CH.Dm]], STOP, 0.8, { cut: 1300 });
  for (let t = A.platinum; t < STOP - 0.1; t += 1.0) M.drum(t, 0.18, 52, 1.2);
  M.strings(STOP + 0.4, A.trade + 0.6, ['D1', 'A1'], 0.6, { att: 0.8, rel: 0.4, cut: 260 });
  // ---- 3: the network: a pulse that tightens; the Suez snap; a long build to "surge", then the floor drops away
  for (let t = A.trade, i = 0; t < A.suezGone - 0.05; i++, t = A.trade + i * 0.4) M.drum(t, 0.12 + 0.12 * MathX.smooth(t, A.trade, A.suezGone), 52, 1.4);
  M.prog([[A.trade, AF_CH.Gm], [A.ports, AF_CH.Dm], [A.collapse, AF_CH.Bb], [A.suez, AF_CH.A]], A.suezGone + 0.05, 0.85, { cut: 1300 });
  M.drum(A.suezGone, 1.0, 41); M.strings(A.suezGone, A.suezGone + 0.9, ['D2', 'A2', 'D3', 'F3'], 1.3, { att: 0.02, rel: 0.6, cut: 2600 });
  M.strings(A.suezGone + 0.4, A.oceans - 0.2, ['D2', 'A2', 'F3', 'C4'], 0.7, { att: 1.0, rel: 0.25, cut: 700, cutTo: 2300, keys: [[A.board, 0.8], [A.prices, 1.1], [A.surgeW, 1.5], [A.oceans - 0.5, 1.6]] });
  for (let t = A.board, i = 0; t < A.oceans - 0.3; i++, t = A.board + i * 0.3) M.drum(t, 0.1 + 0.2 * MathX.smooth(t, A.board, A.oceans - 0.4), 52, 1.3);
  // ---- 4: the oceans: a low rising drone, then the big swell, climbing chord by chord to the narration-free beat
  M.strings(A.oceans, A.surge + 0.3, ['D1', 'D2', 'A2'], 1.0, { att: 1.4, rel: 0.3, cut: 260, cutTo: 900 });
  M.drum(A.surge, 1.0, 41);
  M.prog([[A.surge, ['D2', 'A2', 'D3', 'F3', 'A3']], [A.currents, ['Bb1', 'F2', 'Bb2', 'D3', 'F3']], [A.ship, ['G1', 'D2', 'G2', 'Bb2', 'D3']], [A.geo, ['A1', 'E2', 'A2', 'C#3', 'E3']]],
    A.silence + 0.1, 1.15, { cut: 1500 });
  for (let t = A.surge + 0.75; t < A.silence - 0.1; t += 0.75) M.drum(t, 0.28 + 0.22 * MathX.smooth(t, A.surge, A.silence), 46);
  // ★ the narration-free beat: everything at once (the low brass doubles the root), the drums roll and break
  M.strings(A.silence - 0.05, A.forest + 0.05, ['D1', 'D2', 'A2', 'D3', 'F3', 'A3', 'D4'], 2.0, { att: 0.15, rel: 0.12, cut: 2400, cutTo: 3600 });
  M.strings(A.silence - 0.05, A.forest + 0.05, ['D1', 'A1'], 1.2, { att: 0.15, rel: 0.12, cut: 700, wave: 'square', vib: 3 });
  M.drum(A.silence, 1.1, 41);
  M.roll(A.silence + 0.2, A.forest - 0.35, [[A.silence, 0.2], [A.forest - 0.4, 0.75]]);
  M.drum(A.forest - 0.3, 1.0, 41);
  // ---- 5: loss: sparse piano over a soft pad; each vanish takes the pad away
  M.strings(A.forest + 0.3, A.forestGo + 0.1, ['F2', 'C3', 'A3'], 0.55, { att: 1.2, rel: 0.25, cut: 900 });
  [['A4', 0.4], ['C5', 1.15], ['D5', 1.9], ['A4', 2.9], ['G4', 3.6]].forEach(([n, o], i) => M.piano(A.forest + o, n, 0.38 - 0.03 * i, 2.4, i % 2 ? 0.25 : -0.2));
  M.piano(A.forestGo + 0.1, 'D2', 0.6, 3.5, 0);
  M.strings(A.wild + 0.1, AF.savGo + 0.2, ['D2', 'A2', 'F3'], 0.5, { att: 0.8, rel: 0.2, cut: 800 });
  M.piano(A.wild + 0.3, 'F4', 0.3, 2.2, 0.2); M.piano(A.wild + 1.1, 'E4', 0.28, 2.2, -0.2);
  M.prog([[A.flow, AF_CH.Bb], [A.flowBend - 0.4, AF_CH.F], [A.flowBend + 1.6, AF_CH.C], [A.room - 2.2, AF_CH.Dm]], A.room + 0.3, 0.6, { cut: 1000 });
  [['D5', 0.5], ['A4', 2.4], ['F5', 4.6], ['E5', 6.0]].forEach(([n, o], i) => M.bell(A.flow + o, n, 0.5, i % 2 ? 0.4 : -0.4));
  // ---- 6: the meeting: a slow low tick; the dead factory: a dark drone; the phone: almost nothing
  for (let t = A.room + 0.4; t < A.halt; t += 0.92) M.piano(t, 'D2', 0.32, 0.5, 0, 0.2);
  M.strings(A.room, A.halt + 0.3, ['D2', 'A2', 'E3'], 0.5, { att: 1.0, rel: 0.3, cut: 520 });
  M.strings(A.halt, A.phone + 0.4, ['D1', 'A1', 'D2'], 0.6, { att: 0.5, rel: 0.4, cut: 300 });
  M.strings(A.phone + 0.6, A.quiet, ['A3'], 0.22, { att: 2.0, rel: 1.4, cut: 2200, vib: 4 });   // (not A4: it beats against the 425 Hz ring)
  // ---- 7: the rebuild: the progression returns and grows; "Earth would survive" opens to F major; the final swell
  M.prog([[A.coast + 0.3, AF_CH.Dm], [A.coast + 2.9, AF_CH.Bb], [A.coast + 5.3, AF_CH.F], [A.maps - 0.2, AF_CH.C], [A.maps + 2.3, AF_CH.Dm]], A.earth + 0.2, 0.75,
    { cut: 900, cutTo: 2000 });
  [['A4', 0.6], ['F4', 1.4], ['D4', 2.2], ['C5', 3.3], ['A4', 4.1], ['D5', 5.6], ['C5', 6.4], ['A4', 7.4]].forEach(([n, o], i) => M.piano(A.coast + o, n, 0.3 + 0.012 * i, 2.4, i % 2 ? 0.2 : -0.2));
  M.strings(A.earth, A.never + 0.35, ['F2', 'C3', 'F3', 'A3', 'C4'], 1.0, { att: 0.7, rel: 0.5, cut: 2600 });
  M.bell(A.earth + 0.35, 'C6', 0.45, -0.3); M.bell(A.earth + 1.05, 'F5', 0.4, 0.3);
  M.strings(A.never, A.pull + 0.3, ['D2', 'A2', 'D3', 'F3', 'A3'], 1.0, { att: 0.6, rel: 0.4, cut: 2000 });
  M.piano(A.never + 0.1, 'D4', 0.45, 3, 0); M.piano(A.never + 0.8, 'A4', 0.36, 2.6, 0.2);
  // ★ the last three seconds: the swell (it is cut, not faded, by the mix at the last frame)
  // (it starts low enough to have somewhere to go: 0.5 → 1.6, brightening all the way)
  M.strings(A.pull - 0.1, A.end + 0.3, ['D1', 'D2', 'A2', 'D3', 'F3', 'A3', 'D4', 'F4'], 1.6, { att: 0.3, rel: 0.05, cut: 1200, cutTo: 5000, cutAt: A.end, keys: [[A.pull + 0.3, 0.5], [A.end - 0.1, 1.6]] });
  M.strings(A.pull - 0.1, A.end + 0.3, ['A1'], 1.1, { att: 0.3, rel: 0.05, cut: 600, cutTo: 1200, wave: 'square', vib: 3, keys: [[A.pull + 0.3, 0.5], [A.end - 0.1, 1.3]] });
  M.roll(A.pull + 0.4, A.end, [[A.pull + 0.4, 0.15], [A.end - 0.05, 1.0]]);
  [['D6', 0.6], ['A5', 1.2], ['F6', 1.8], ['D6', 2.4]].forEach(([n, o], i) => M.bell(A.pull + o, n, 0.35 + 0.1 * i, i % 2 ? 0.45 : -0.45));
});

