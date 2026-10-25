/* =====================================================================
   SOUND · MUSIC — an original score in D minor, all synthesised (the Slower light film's kit, renamed uc*): string
   pads, a felt piano, bells, a low drum, a heartbeat, a filtered synth pulse. Three ideas of this film's own:
     the theme     four bell notes, D–A–G–E, and then the D an octave up. The octave is the frequency DOUBLED, the way
                   every star's light doubles when the universe is half its size: at "twice as hot" the theme's D
                   jumps its octave. It rings out over the title, comes back on the piano as things are lost, rings
                   out whole for the light of the Big Bang, and lands, warm, for the closing question
     the squeeze   starlight in shrinking space is squeezed, bluer: so is the music. From "Shrinking space squeezes
                   it" the sky's chord slides UP and brightens, and the stars' bells come out thicker and higher
     the halvings  in the last second, one tick for every time the universe halves in size again. They start a
                   breath apart and end as a buzz; then nothing, at midnight
   The shape: a hush for the cold open (a drone, a heartbeat); the title; the ice; wonder, then a turn and a quickening
   pulse for the rule; warmth for "held together"; a rising line for the promise; almost nothing at 7:30 (a church clock
   strikes in the effects); the squeeze, the octave, the most beautiful sky (D major, the theme whole); unease as the
   dark glows; the stars' bells drowned one by one; drums as the galaxies crash; a sparse piano for the frost; a bell
   for 0 °C; a pulse for the heat, the cat, going in; the fire: a low ostinato that grows; the Moon fading as a high
   note into the pad; "pretend nothing can hurt you": the drums stop and the music opens out; the ice motif again for
   the bird bath; a long rise for the afterglow; a low blow for the house; no edges (pure tones, no attacks) as the
   garden disappears; the theme whole for the Big Bang's light; a crescendo for the Sun; the halvings, the heartbeat,
   three hits and a swell for the last second; silence at midnight; then warmth coming back, a question in the music
   for the clue, and the theme landing on its octave for 7:29.
   ===================================================================== */

// the kit: string pads (three detuned oscillators per note through low-passes), felt piano (also reversed), bells,
// a low drum and a heartbeat
function ucMusicKit(ctx, K) {
  if (K._music) return K._music;
  const fx = K.fx, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(); bus.connect(K.bus);
  const hall = fx.ir(4.2, { bright: 0.5, damp: 2.8, shape: 2.0, pre: 0.025, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.55;
  bus.connect(hall); hall.connect(wet); wet.connect(K.bus);
  const drumModes = (f) => [[f, 0.7, 1], [f * 1.51, 0.45, 0.5], [f * 1.99, 0.3, 0.35], [f * 2.44, 0.2, 0.2], [f * 3.1, 0.12, 0.12]];
  const M = {
    bus,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4, dest = bus) => {
      const b = fx.pianoBuf(ucMidi(n)), len = Math.min(b.length, Math.ceil((dur + fade + 0.05) * fx.sr));
      return fx.play(b.subarray(0, len), t, dest, { vol: vel * 0.34, pan, stop: t + dur + fade, fade });
    },
    // a piano note played backwards: it swells up out of nothing and stops dead on its attack at tEnd
    rpiano(tEnd, n, vel, dur = 1.6, pan = 0) {
      const key = 'rp' + n + '_' + dur;
      if (!fx.cache[key]) {
        const b = fx.pianoBuf(ucMidi(n)), L = Math.min(b.length, Math.ceil(dur * fx.sr)), y = new Float32Array(L + Math.ceil(0.01 * fx.sr));
        for (let i = 0; i < L; i++) { const u = i / L; y[L - 1 - i] = b[i] * Math.min(1, (1 - u) / 0.35); }
        for (let i = 0; i < 0.01 * fx.sr; i++) y[L + i] = y[L - 1] * (1 - i / (0.01 * fx.sr));
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], tEnd - dur, bus, { vol: vel * 0.34, pan });
    },
    bell: (t, n, vol, pan = 0, dest = bus) => fx.play(fx.bellBuf(ucMidi(n)), t, dest, { vol: vol * 0.25, pan }),
    // a bell cut short (something going over the edge: its sound stops, the hall keeps a little of it)
    bellCut: (t, n, vol, d = 0.18, pan = 0) => fx.play(fx.bellBuf(ucMidi(n)), t, bus, { vol: vol * 0.25, pan, stop: t + d, fade: 0.05 }),
    // a low drum (a timpani-like membrane): f the pitch, vol, soft = a wider mallet, dk = decay
    drum(t, vol, f = 36.7, soft = 1, dk = 1) {
      const key = 'drum' + f + '_' + soft + '_' + dk;
      if (!fx.cache[key]) {
        const y = fx.hit(drumModes(f).map(([a, tau, b]) => [a, tau * dk, b]), { width: 0.006 * soft, amp: 1, noise: 0.25, nlen: 0.02, nhp: 300, len: 3.2 * Math.max(dk, 0.3) });
        const pk = UCX.peak(y) || 1; for (let i = 0; i < y.length; i++) y[i] /= pk;
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
    // o.glide (cents, by o.glideAt: the chord slides), o.pan
    strings(t0, t1, notes, vol, o = {}) {
      if (t1 - t0 < 0.1) return;
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
      for (const nn of notes) {
        const f = ucHz(nn);
        [-7, 1, 6].forEach((d, k) => {
          const osc = ctx.createOscillator(), og = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
          osc.type = o.wave || 'sawtooth'; osc.frequency.value = f;
          const d0 = d + r.range(-2, 2); osc.detune.setValueAtTime(d0, t0);
          if (o.glide) { osc.detune.setValueAtTime(d0, o.glideFrom || t0); osc.detune.linearRampToValueAtTime(d0 + o.glide, o.glideAt || t1); }
          lfo.frequency.value = r.range(4.4, 5.4); lg.gain.setValueAtTime(0, t0); lg.gain.linearRampToValueAtTime(o.vib == null ? 7 : o.vib, t0 + Math.min(1.5, (t1 - t0) * 0.6));
          lfo.connect(lg); lg.connect(osc.detune);
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
// o.ramp(u) the level over the span, o.wave, o.glide (cents over the span: the pulse slides)
function ucPulse(ctx, dest, t0, t1, notes, step, vol, o = {}) {
  if (t1 - t0 < step) return;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.q || 4;
  lp.frequency.setValueAtTime(o.cut || 600, t0); lp.frequency.linearRampToValueAtTime(o.cutTo || o.cut || 600, t1);
  lp.connect(g); g.connect(dest); g.gain.value = 0;
  notes.forEach((n, k) => {
    const os = ctx.createOscillator(); os.type = o.wave || 'sawtooth'; os.frequency.value = ucHz(n); os.detune.setValueAtTime(k % 2 ? 6 : -6, t0);
    if (o.glide) os.detune.linearRampToValueAtTime((k % 2 ? 6 : -6) + o.glide, t1);
    os.connect(lp); os.start(t0); os.stop(t1 + 0.1);
  });
  for (let t = t0, i = 0; t < t1 - 0.01; t += (o.stepAt ? o.stepAt(t) : step), i++) {
    const acc = o.acc && i % o.acc === 0 ? 1.0 : 0.62, ramp = o.ramp ? o.ramp((t - t0) / (t1 - t0)) : 1, v = vol * 0.05 * acc * ramp, st = o.stepAt ? o.stepAt(t) : step;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.setTargetAtTime(0, t + 0.012, st * (o.decay || 0.28));
  }
}

const UC_CH = {
  Dm: ['D2', 'A2', 'F3', 'A3', 'D4'], Dm9: ['D2', 'A2', 'F3', 'C4', 'E4'], Dsus: ['D2', 'A2', 'E3', 'G3', 'A3'], Dmaj: ['D2', 'A2', 'F#3', 'A3', 'D4'],
  Bbmaj7: ['Bb1', 'F2', 'D3', 'A3', 'D4'], F: ['F1', 'C2', 'A2', 'C3', 'F3'], Fmaj7: ['F2', 'C3', 'E3', 'A3', 'C4'], C: ['C2', 'G2', 'E3', 'G3', 'C4'],
  Gm: ['G1', 'D2', 'Bb2', 'D3', 'G3'], Gm9: ['G1', 'D2', 'Bb2', 'F3', 'A3'], Asus: ['A1', 'E2', 'D3', 'E3', 'A3'], A: ['A1', 'E2', 'C#3', 'E3', 'A3'],
  Am7: ['A1', 'E2', 'C3', 'G3', 'C4'], Dbig: ['D2', 'A2', 'D3', 'F3', 'A3', 'D4', 'F4', 'A4'], DmajBig: ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4', 'F#4', 'A4'],
};
const UC_THEME = ['D5', 'A5', 'G5', 'E5'], UC_THEME_END = 'D6';
const ucOct = (n, k) => n.replace(/-?\d$/, (d) => String(+d + k));


const UC_ICE = ['A5', 'E6', 'F5', 'D6'];                         // the ice (7:29), and again at "At 7:29, it was ice"

ucSound('music', 'score', function (ctx, bus, K) {
  const M = ucMusicKit(ctx, K), C = UC_CH, cap = (id, k) => ucCap(id, k).show;
  // the theme: its four notes from t, spaced dts (a number or a list), in bells or piano (o.oct shifts it); returns
  // where the fifth note (the octave) goes
  const theme = (t, dts, vol, o = {}) => {
    let tt = t;
    (o.notes || UC_THEME).forEach((n, i) => {
      const nn = ucOct(n, o.oct || 0), pan = (o.pan || 0) + (i % 2 ? 0.22 : -0.22);
      if (o.piano) M.piano(tt, nn, vol * (i ? 0.88 : 1), o.dur || 2.4, pan); else M.bell(tt, nn, vol * (i ? 0.88 : 1), pan);
      tt += Array.isArray(dts) ? dts[Math.min(i, dts.length - 1)] : dts;
    });
    return tt;
  };
  // bells walking round a chord's tones from t0 to t1, step s (or s(t)), vol (or vol(t)); octaves oct
  const arp = (t0, t1, notes, s, vol, oct = [5, 6], seq = [0, 2, 1, 3, 2, 4, 1, 3]) => {
    const pcs = notes.map((n) => n.replace(/-?\d$/, ''));
    for (let t = t0, i = 0; t < t1 - 0.05; i++) {
      const v = typeof vol === 'function' ? vol(t) : vol;
      if (v > 0.005) M.bell(t, pcs[seq[i % seq.length] % pcs.length] + oct[(i >> 2) % oct.length], v * (i % 4 === 0 ? 1 : 0.7), Math.sin(i * 1.9) * 0.6);
      t += typeof s === 'function' ? s(t) : s;
    }
  };
  const ice = (t, dt, vol) => UC_ICE.forEach((n, i) => M.piano(t + i * dt, n, vol * (i ? 0.85 : 1), 2.2, i % 2 ? 0.3 : -0.3, 0.6));

  // ---- the cold open (11:44 tonight): a low drone, a thin high note, a rub, your heartbeat; a swell into the cut
  M.strings(0, UC.titleShot + 0.2, ['D1', 'A1', 'D2'], 0.62, { att: 1.2, rel: 0.3, cut: 300, wave: 'sine', vib: 2 });
  M.strings(0.6, UC.titleShot + 0.1, ['A5'], 0.05, { att: 2.0, rel: 0.3, cut: 6000, wave: 'sine', vib: 3 });
  M.strings(1.5, UC.titleShot, ['Eb3', 'D4'], 0.16, { att: 2.5, rel: 0.2, cut: 900, wave: 'triangle', vib: 4 });
  for (let t = 0.4; t < UC.titleShot - 0.3; t += 0.74) M.beat(t, 0.3);
  M.drum(cap('open', 1) - 0.05, 0.4, 36.7, 1.4);                                                   // "…setting your garden on fire."
  M.rpiano(UC.titleShot, 'D3', 0.32, 1.8, 0); M.rpiano(UC.titleShot, 'A3', 0.22, 1.8, 0);

  // ---- the title (7:29, the garden): the theme rings out whole, then once more up high; the ice
  const T0 = UC.title[0];
  M.drum(T0, 0.75, 36.7, 1.4); M.piano(T0, 'D2', 0.42, 3.5, 0);
  M.strings(T0 - 0.1, UC.rule + 0.4, C.Dm9, 0.55, { att: 0.5, rel: 0.8, cut: 1400, cutTo: 900, cutAt: UC.frost0 + 2 });
  M.bell(theme(T0 + 0.1, 0.24, 0.45), UC_THEME_END, 0.55, 0);
  M.bell(theme(T0 + 2.2, 0.18, 0.22, { oct: 1 }), ucOct(UC_THEME_END, 1), 0.26, 0);
  M.piano(cap('frozen', 0) + 0.1, 'A3', 0.2, 2.5, 0.2);
  ice(UC.frost0 + 0.5, 0.55, 0.15); M.strings(UC.frost0 + 0.3, UC.rule + 0.3, ['E6'], 0.035, { att: 1.0, rel: 0.6, cut: 7000, wave: 'sine', vib: 2 });

  // ---- the rule: growing (wide, open); "it starts to shrink" (a reversed swell, the chord darkens); "faster and
  //      faster" (a pulse that quickens)
  {
    const ts = UC.shrinkAt, tf = cap('rule', 2);
    M.strings(UC.rule, ts + 0.3, C.Bbmaj7, 0.55, { att: 1.0, rel: 0.4, cut: 1100, cutTo: 2200 });
    for (let t = UC.rule + 0.5, i = 0; t < ts - 0.4; i++) { M.bell(t, ['D5', 'F5', 'A5', 'D6', 'A5', 'F5'][i % 6], 0.12, Math.sin(i * 1.3) * 0.6); t += 0.5 + 0.08 * i; }   // drifting apart
    M.drum(UC.rule, 0.4, 36.7, 2); M.piano(UC.rule, 'Bb1', 0.3, 3, 0);
    M.rpiano(ts, 'A3', 0.3, 1.6, 0); M.rpiano(ts, 'D4', 0.22, 1.6, 0);
    M.drum(ts, 0.55, 36.7, 1.4); M.piano(ts, 'D2', 0.32, 3, 0);
    M.prog([[ts, C.Gm9], [tf - 0.2, C.Asus]], UC.held + 0.4, 0.5, { cut: 800, cutTo: 1700 });
    for (let t = ts + 0.4, i = 0; t < UC.held - 0.2; i++) { M.bell(t, ['A5', 'F5', 'D5', 'A4'][i % 4], 0.1 + 0.04 * ucEv(t, ts, UC.held), (i % 2 ? 0.3 : -0.3)); t += 0.55 - 0.35 * ucEv(t, ts, UC.held); }   // closing in
    ucPulse(ctx, M.bus, tf - 0.2, UC.held + 0.1, ['D3', 'A3'], 0.4, 0.3, { cut: 500, cutTo: 1200, acc: 4, decay: 0.3, stepAt: (t) => 0.42 - 0.24 * ucEv(t, tf, UC.held), ramp: (u) => 0.5 + 0.5 * u });
    M.roll(tf + 1.0, UC.held, [[tf + 1.0, 0.04], [UC.held, 0.3]], 73);
  }
  // ---- held together: warm and steady; "only the empty space shrinks"; "at midnight, it runs out": a low blow
  M.drum(UC.held + 0.3, 0.5, 36.7, 1.6);
  M.prog([[UC.held + 0.3, C.F], [cap('held', 1) - 0.2, C.C], [cap('held', 2) - 0.2, C.Dm]], UC.promise + 0.4, 0.52, { cut: 1300 });
  for (const [t, n] of [[cap('held', 0) + 0.05, 'F2'], [cap('held', 1) + 0.05, 'C2']]) { M.piano(t, n, 0.3, 3, 0); M.piano(t + 0.02, ucOct(n, 2), 0.14, 2.5, 0.15); }
  M.drum(UC.runout + 0.2, 0.6, 36.7, 1.2, 1.3); M.piano(UC.runout + 0.2, 'D1', 0.36, 3.5, 0); M.bellCut(UC.runout + 0.25, 'D6', 0.3, 0.5, 0);
  // ---- the promise: the history rewound, a rising line of bells; "the light of the Big Bang": the theme, glimpsed
  M.prog([[UC.promise, C.Bbmaj7], [cap('promise', 1) - 0.2, C.Asus]], UC.begin + 0.5, 0.5, { cut: 1000, cutTo: 2000 });
  for (let t = UC.promise + 0.5, i = 0; t < cap('promise', 1) - 0.3; i++, t += 0.36) M.bell(t, ['D5', 'E5', 'F5', 'A5', 'Bb5', 'D6', 'E6', 'F6', 'A6'][Math.min(8, i)], 0.09 + 0.012 * i, Math.sin(i * 1.7) * 0.5);
  theme(cap('promise', 1) + 0.3, [0.6, 0.55, 0.8], 0.2, { oct: 0 });
  M.rpiano(UC.begin + 0.1, 'A2', 0.26, 2.0, 0);

  // ---- 7:30: you can't feel a thing. Almost nothing: a held fifth (the church clock strikes in the effects)
  M.strings(UC.begin, UC.mirach + 0.5, ['D2', 'A2', 'E3'], 0.42, { att: 1.0, rel: 0.6, cut: 600, vib: 2 });
  M.bell(UC.onsetT + 1.4, 'A5', 0.14, 0.2);

  // ---- 2 · the squeeze. Mirach, red then white; "squeezes it": the chord slides up and brightens
  {
    const t0 = UC.mirach, tq = cap('squeeze', 0) + 1.2, t1 = UC.half + 0.3, gl = { glide: 400, glideFrom: tq, glideAt: UC.half - 0.3 };
    M.strings(t0, t1, ['D2', 'A2'], 0.42, Object.assign({ att: 1.0, rel: 0.6, cut: 500, cutTo: 900, cutAt: UC.half }, gl));
    for (const [n, v] of [['F4', 0.08], ['A4', 0.08], ['C5', 0.07], ['E5', 0.06]]) M.strings(t0 + 0.3, t1, [n], v * 4, Object.assign({ att: 1.5, rel: 0.6, cut: 900, cutTo: 4500, cutAt: UC.half, wave: 'triangle', vib: 3 }, gl));
    M.piano(t0 + 0.3, 'D2', 0.26, 3, 0); M.piano(cap('mirach', 1) + 0.1, 'A4', 0.16, 2.5, 0.2);              // "By 8:50, it's white."
    arp(cap('mirach', 1), t1 - 0.2, ['D', 'F', 'A', 'C', 'E'], (t) => 0.62 - 0.3 * ucEv(t, tq, UC.half), (t) => 0.06 + 0.06 * ucEv(t, tq, UC.half), [5, 6]);
    ['A5', 'C6', 'E6'].forEach((n, i) => M.bell(cap('squeeze', 1) + 0.1 + i * 0.32, n, 0.16, -0.3 + 0.3 * i));   // "Shorter waves. Bluer. Brighter."
  }
  // ---- 9:14, half the size: the octave. "twice as hot": the theme's D, then the D above it
  {
    const td = ucW('half', 'twice').start;
    M.drum(UC.half + 0.1, 0.55, 36.7, 1.4); M.piano(UC.half + 0.1, 'D2', 0.34, 3.5, 0);
    M.prog([[UC.half + 0.1, C.Dm9], [cap('half', 1) - 0.2, C.Bbmaj7]], UC.more + 0.4, 0.5, { cut: 1500 });
    theme(UC.half + 0.5, [0.45, 0.45, 0.7], 0.22);
    M.bell(td, 'D5', 0.36, -0.3); M.bell(td + 0.5, 'D6', 0.42, 0.3); M.piano(td + 0.5, 'D3', 0.22, 3, 0);
  }
  // ---- stars come out, then thousands more: bells thicker and higher; 10:00, the best sky: D major, the theme whole
  M.prog([[UC.more, C.F], [cap('more', 1) - 0.2, C.C]], UC.best + 0.4, 0.5, { cut: 1500, cutTo: 2600 });
  arp(UC.more + 0.3, UC.best, ['F', 'A', 'C', 'E', 'G'], (t) => 0.4 - 0.26 * ucEv(t, UC.more, UC.best), (t) => 0.07 + 0.06 * ucEv(t, UC.more, UC.best), [5, 6, 6, 7]);
  {
    const tb = UC.best + 0.1;
    M.drum(tb, 0.7, 36.7, 1.4); M.piano(tb, 'D2', 0.4, 4, 0); M.piano(tb + 0.02, 'F#3', 0.2, 4, 0.1);
    M.strings(tb, UC.glow + 0.6, C.DmajBig, 0.6, { att: 0.8, rel: 1.0, cut: 2200 });
    M.bell(theme(tb + 0.3, 0.38, 0.4), UC_THEME_END, 0.48, 0);
    ['D6', 'F#6', 'A6', 'D7'].forEach((n, i) => M.bell(tb + 2.4 + i * 0.22, n, 0.16, -0.45 + 0.3 * i));
  }

  // ---- 3 · the glow: unease (the major turns minor, a held rub); the light of every galaxy: wide, strange
  M.strings(UC.glow, UC.ebl + 0.4, ['D2', 'A2', 'F3', 'A3', 'Eb4'], 0.45, { att: 1.2, rel: 0.5, cut: 900, vib: 3 });
  M.strings(UC.glow + 0.8, UC.city + 0.3, ['A5', 'Bb5'], 0.04, { att: 2.5, rel: 1.0, cut: 6000, wave: 'sine', vib: 2 });
  M.prog([[UC.ebl, C.Bbmaj7], [cap('ebl', 1) - 0.2, C.Gm9]], UC.city + 0.4, 0.48, { cut: 900, cutTo: 1600 });
  M.piano(UC.ebl + 0.3, 'Bb1', 0.28, 3.5, 0); M.piano(cap('ebl', 1) + 0.2, 'G1', 0.26, 3.5, 0);
  for (let t = UC.ebl + 0.8, i = 0; t < UC.city - 0.3; i++, t += 0.9) M.bell(t, ['F6', 'D6', 'Bb5', 'A5'][i % 4], 0.07, Math.sin(i * 2.1) * 0.6);
  // ---- the city-bright sky; twilight at 11 p.m.: a pulse starts; the stars drowned out: their bells drop away
  {
    const t0 = UC.city, t1 = UC.close + 0.3;
    M.prog([[t0, C.Dm9], [cap('city', 1) - 0.2, C.Bbmaj7], [UC.drown, C.Gm9]], t1, 0.48, { cut: 900, cutTo: 3200, cutAt: UC.close });
    ucPulse(ctx, M.bus, cap('city', 1) - 0.1, UC.close, ['D3', 'A3'], 0.36, 0.3, { cut: 500, cutTo: 1200, acc: 4, decay: 0.3, ramp: (u) => 0.4 + 0.6 * u });
    arp(t0 + 0.3, UC.close - 0.2, ['D', 'F', 'A', 'C', 'E'], 0.3, (t) => 0.1 * (1 - ucEv(t, UC.drown, cap('drown', 1) + 1.5)), [6, 7]);
    M.strings(UC.drown + 0.4, UC.close + 0.2, ['D6', 'E6', 'A6'], 0.04, { att: 3.0, rel: 0.5, cut: 9000, wave: 'sine', vib: 1 });   // the sky's glow, rising over them
  }
  // ---- out there: the galaxies close in (drums, a roll); they crash; "their light will never reach you"
  {
    const tc = UC.crashAt;
    M.strings(UC.close, UC.frost + 0.4, ['D1', 'A1', 'D2', 'Eb2'], 0.55, { att: 0.6, rel: 0.6, cut: 500, cutTo: 1100, cutAt: tc });
    M.roll(UC.close + 0.6, tc, [[UC.close + 0.6, 0.04], [tc, 0.5]], 73);
    M.drum(tc, 0.95, 36.7, 1.0, 1.4); M.drum(tc, 0.45, 49); M.piano(tc, 'D1', 0.42, 4, 0); M.piano(tc, 'Eb2', 0.28, 4, 0);
    ucPulse(ctx, M.bus, tc, cap('close', 2), ['D2', 'Eb2'], 0.42, 0.38, { cut: 400, cutTo: 900, acc: 2, decay: 0.35 });
    M.bellCut(cap('close', 2) + 0.2, 'A5', 0.26, 0.35, 0); M.bellCut(cap('close', 2) + 0.9, 'D5', 0.2, 0.35, 0);
  }

  // ---- 4 · the frost melting: a sparse, falling piano; "that cold is gone": a low D
  M.strings(UC.frost, UC.zero + 0.4, ['D3', 'A3', 'E4'], 0.32, { att: 1.0, rel: 0.6, cut: 1200 });
  [['E6', 0.4], ['D6', 1.1], ['A5', 1.9], ['F5', 2.9]].forEach(([n, dt]) => M.piano(UC.frost + dt, n, 0.13, 2.4, 0.2, 0.6));
  M.piano(cap('frost', 1) + 0.2, 'D2', 0.26, 3.5, 0); M.piano(cap('frost', 1) + 1.4, 'C5', 0.12, 2.4, -0.2); M.piano(cap('frost', 1) + 2.3, 'A4', 0.12, 2.4, 0.2);
  // ---- 0 °C: a bell; the Milky Way inside out: the chord turns over (minor to major, the dark notes bright)
  {
    const tz = UC.zeroAt, ti = cap('zero', 1);
    M.bell(tz, 'D6', 0.32, 0); M.bell(tz + 0.5, 'A6', 0.2, 0.3); M.piano(tz, 'D2', 0.3, 4, 0);
    M.strings(UC.zero, ti + 0.3, C.Dm, 0.42, { att: 0.8, rel: 0.4, cut: 1100 });
    M.strings(ti, UC.warm + 0.4, C.Dmaj, 0.46, { att: 0.6, rel: 0.5, cut: 1300, cutTo: 2400 });
    M.strings(ti + 0.2, UC.warm + 0.3, ['F#5', 'A5', 'D6'], 0.05, { att: 1.5, rel: 0.6, cut: 7000, wave: 'sine', vib: 2 });
    for (let t = ti + 0.4, i = 0; t < UC.warm - 0.3; i++, t += 0.45) M.bell(t, ['D6', 'A5', 'F#5', 'A5', 'E6', 'D6'][i % 6], 0.08, Math.sin(i * 1.7) * 0.6);
  }
  // ---- warmer than you; the cat; boiling; you go in: a pulse that quickens, a little running figure for the cat
  {
    const t0 = UC.warm, t1 = UC.steam;
    M.prog([[t0, C.Gm9], [UC.catRun, C.Asus], [UC.boil, C.Dm9], [cap('boil', 1) - 0.2, C.Bbmaj7]], t1 + 0.4, 0.45, { cut: 900, cutTo: 1500 });
    ucPulse(ctx, M.bus, t0 + 0.3, t1, ['D3', 'A3'], 0.36, 0.3, { cut: 600, cutTo: 1400, acc: 4, decay: 0.28, stepAt: (t) => 0.42 - 0.12 * ucEv(t, t0, t1) });
    ['D5', 'E5', 'F5', 'A5', 'D6'].forEach((n, i) => M.piano(UC.catRun + 0.05 + i * 0.11, n, 0.12, 0.4, -0.2 + 0.1 * i, 0.2));   // she runs
    M.drum(UC.boil + 0.1, 0.5, 36.7, 1.4); M.piano(UC.boil + 0.1, 'D2', 0.3, 3, 0);
  }

  // ---- 5 · the fire, from the kitchen: a low ostinato that grows; a hit as the leaves catch; "brighter than noon":
  //      a high bright cluster; the telescope: a dark low note; the Moon fading: a high note sinking into the pad
  {
    const t0 = UC.steam, tp = UC.pretend, tl = ucW('leaves', 'fire').start;
    M.prog([[t0, C.Dm], [UC.leaves, C.Dm9], [UC.lawn, C.Bbmaj7], [UC.noon, C.Gm9], [UC.shed, C.Dm], [UC.glass, C.Gm9], [cap('glass', 0) + 1.6, C.Asus]], tp + 0.3, 0.5, { cut: 700, cutTo: 1600 });
    ucPulse(ctx, M.bus, t0 + 0.3, tp, ['D2', 'A2'], 0.42, 0.42, { cut: 380, cutTo: 1100, acc: 4, decay: 0.32, ramp: (u) => 0.45 + 0.55 * u });
    M.drum(tl, 0.75, 36.7, 1.2); M.piano(tl, 'D1', 0.36, 3.5, 0);
    for (let t = UC.lawn + 0.4; t < tp - 0.3; t += 1.68) M.drum(t, 0.25 + 0.2 * ucEv(t, UC.lawn, tp), 36.7, 1.6, 0.7);
    M.strings(UC.noon + 0.3, UC.shed + 0.3, ['E5', 'A5', 'B5', 'D6'], 0.05, { att: 1.0, rel: 0.6, cut: 8000, wave: 'sine', vib: 2 });
    M.drum(UC.shedAt + 0.05, 0.55, 49);
    M.piano(UC.scopeAt, 'Eb2', 0.3, 3, 0); M.piano(UC.scopeAt + 0.02, 'D1', 0.28, 3, 0);
    M.strings(UC.moonGo, cap('shed', 1) + 2.8, ['A5'], 0.07, { att: 0.2, rel: 2.0, cut: 6000, wave: 'sine', vib: 2, keys: [[UC.moonGo + 0.5, 1], [cap('shed', 1) + 2.0, 0.15]] });
    theme(UC.moonGo + 0.2, [0.9, 0.8, 1.2], 0.15, { piano: true, dur: 2.4 });
    M.roll(cap('glass', 0) + 1.0, tp, [[cap('glass', 0) + 1.0, 0.04], [tp, 0.42]], 73);
  }
  // ---- "pretend nothing can hurt you": the drums stop; the music opens out, wide and high
  {
    const tp = UC.pretend;
    M.drum(tp, 0.6, 36.7, 1.6); M.piano(tp, 'D2', 0.32, 4, 0); M.bell(tp + 0.1, 'F#6', 0.24, 0); M.bell(tp + 0.4, 'A6', 0.18, 0.3);
    M.strings(tp, UC.bath + 0.5, C.DmajBig, 0.5, { att: 1.4, rel: 0.8, cut: 1600, cutTo: 2600 });
  }

  // ---- 6 · the bird bath boils; "At 7:29, it was ice": the ice motif again
  M.prog([[UC.bath, C.Fmaj7], [cap('bath', 1) - 0.2, C.Dm9]], UC.red + 0.5, 0.42, { cut: 1300 });
  ice(cap('bath', 1) + 0.15, 0.5, 0.16);
  // ---- the afterglow: a long rise, the theme in the low strings, opening; "too cold to see": a bell
  {
    const t0 = UC.red, t1 = UC.melt + 0.3;
    M.prog([[t0, C.Bbmaj7], [cap('red', 1) - 0.2, C.F], [cap('red', 2) - 0.2, C.C], [cap('red', 2) + 2.0, C.Dm9]], t1, 0.52, { cut: 800, cutTo: 2600, cutAt: UC.melt });
    theme(t0 + 0.6, [1.4, 1.3, 1.8], 0.22, { piano: true, oct: -2, dur: 3 });
    arp(cap('red', 1), t1 - 0.3, ['D', 'F', 'A', 'C', 'E'], 0.42, (t) => 0.05 + 0.07 * ucEv(t, cap('red', 1), UC.melt), [5, 6]);
    M.bell(cap('red', 2) + 2.2, 'E6', 0.2, 0.2);
  }
  // ---- your house melts: one low blow
  M.drum(UC.melt + 0.4, 0.9, 36.7, 1.0, 1.5); M.piano(UC.melt + 0.4, 'D1', 0.42, 4, 0); M.piano(UC.melt + 0.42, 'A1', 0.3, 4, 0);
  M.strings(UC.melt + 0.4, UC.vanish + 0.6, ['D1', 'A1', 'D2', 'F2'], 0.5, { att: 0.1, rel: 1.0, cut: 900, cutTo: 500 });
  // ---- no shadows, no edges: pure tones only, no attacks (the music loses its edges too)
  M.strings(UC.vanish, UC.bigbang + 0.6, ['D3', 'A3', 'E4', 'A4', 'D5'], 0.4, { att: 2.5, rel: 1.2, cut: 2500, wave: 'sine', vib: 1 });
  M.strings(cap('vanish', 1), UC.bigbang + 0.5, ['A5', 'E6'], 0.05, { att: 2.0, rel: 1.0, cut: 9000, wave: 'sine', vib: 0.5 });
  // ---- 11:52, the Big Bang's light: the theme whole, rung out; its ripples: bells shimmering
  {
    const tb = ucW('bigbang', '2700').start;
    M.strings(UC.bigbang, UC.sun + 0.5, C.DmajBig, 0.55, { att: 1.5, rel: 0.8, cut: 1800, cutTo: 3000 });
    M.drum(tb, 0.8, 36.7, 1.2); M.piano(tb, 'D2', 0.42, 4.5, 0); M.piano(tb + 0.02, 'F#3', 0.22, 4.5, 0.1);
    M.bell(theme(cap('bigbang', 1) + 0.2, 0.5, 0.42), UC_THEME_END, 0.5, 0);
    arp(UC.ripples, UC.sun - 0.2, ['D', 'F#', 'A', 'E', 'B'], 0.18, (t) => 0.06 + 0.04 * Math.sin(2 * Math.PI * 0.4 * (t - UC.ripples)) ** 2, [6, 7]);
  }
  // ---- 11:55, the surface of the Sun: a crescendo
  M.prog([[UC.sun, C.Bbmaj7], [UC.sun + 2.6, C.Asus]], UC.last + 0.3, 0.55, { cut: 1000, cutTo: 3000 });
  M.roll(UC.sun + 0.5, UC.last, [[UC.sun + 0.5, 0.04], [UC.last, 0.5]], 73);
  M.rpiano(UC.last, 'A2', 0.32, 2.0, 0); M.rpiano(UC.last, 'E3', 0.24, 2.0, 0);

  // ---- 7 · the last second. A tick for every halving of the universe (they speed up to a buzz); your heartbeat;
  //      a hit for the Sun's core, the nuclei, the protons; a swell for the end of physics; silence at midnight
  {
    const t0 = UC.last, tm = UC.midnight;
    M.drum(t0, 0.8, 36.7, 1.2); M.piano(t0, 'D1', 0.38, 3, 0);
    M.strings(t0, UC.nuclei + 0.2, ['D2', 'A2', 'E3', 'A3'], 0.5, { att: 0.5, rel: 0.1, cut: 700, cutTo: 1600 });
    M.strings(UC.nuclei, tm - 0.02, ['D1', 'D2', 'Eb2', 'A2'], 0.5, { att: 0.05, rel: 0.05, cut: 900, cutTo: 3000, cutAt: tm - 0.3 });
    M.strings(UC.protons, tm - 0.02, ['A4', 'Bb4', 'D5', 'Eb5'], 0.3, { att: 0.3, rel: 0.05, cut: 2500, cutTo: 7000, cutAt: tm - 0.4, glide: 1200, glideFrom: UC.protons + 0.2, glideAt: tm, wave: 'triangle', vib: 12 });
    // the halvings: N(t) = log₂ of how much smaller the universe is than at 7:30; a tick at each whole number
    const N = (t) => { const n = ucNight(t); if (n < UCP.R - 60) return ucLnS(Math.max(0, n)) / Math.LN2; const L = ucLeft(t); return L > 0 ? ucLnSLeft(L) / Math.LN2 : 1e9; };
    let last = Math.floor(N(t0 + 0.3)), prevT = -1;
    for (let t = t0 + 0.3; t < Math.min(UC.planck + 0.3, tm - 0.08); t += 0.002) {
      const k = Math.floor(N(t)); if (k <= last) continue; last = k;
      if (t - prevT < 0.025) continue; prevT = t;
      const u = MathX.clamp((t - t0) / (tm - t0), 0, 1);
      M.bellCut(t, u < 0.5 ? 'D6' : 'A6', 0.18 + 0.15 * u, 0.06, Math.sin(k * 1.7) * 0.4);
    }
    for (let t = t0 + 0.4, dt = 0.8; t < UC.protons - 0.1; t += dt, dt = Math.max(0.42, dt * 0.95)) M.beat(t, 0.3 + 0.2 * ucEv(t, t0, UC.protons));
    M.drum(UC.core, 0.85, 36.7, 1.0, 1.2); M.piano(UC.core, 'D1', 0.36, 3, 0);
    M.drum(UC.nuclei, 0.9, 36.7, 1.0, 1.4); M.drum(UC.nuclei, 0.5, 55);
    M.drum(UC.protons, 0.8, 49, 1.2); M.bellCut(UC.protons, 'D5', 0.4, 0.4, 0);
    M.roll(UC.planck - 1.0, tm - 0.05, [[UC.planck - 1.0, 0.05], [tm - 0.3, 0.55]], 73);
  }
  // ---- midnight: silence (the score stops dead with the picture)

  // ---- 8 · is any of this real? Warmth coming back out of the silence
  M.piano(UC.real + 0.5, 'D3', 0.24, 3.5, 0); M.piano(UC.real + 0.52, 'A3', 0.16, 3.5, 0.15);
  M.strings(UC.real + 0.3, cap('real', 1) + 0.4, C.Dm9, 0.42, { att: 2.5, rel: 0.6, cut: 500, cutTo: 1400 });
  M.prog([[cap('real', 1) - 0.2, C.Bbmaj7], [cap('real', 1) + 1.8, C.F]], UC.clue + 0.4, 0.48, { cut: 1300 });
  M.bell(cap('real', 1) + 0.1, 'F5', 0.18, -0.2);
  // ---- the clue: a question in the music (a soft pulse, an unresolved chord); "may be weakening": it thins
  M.prog([[UC.clue, C.Gm9], [cap('clue', 1) - 0.2, C.Am7]], UC.turn + 0.4, 0.46, { cut: 1100, cutTo: 800, cutAt: UC.turn });
  ucPulse(ctx, M.bus, UC.clue + 0.4, UC.turn, ['G3', 'D4'], 0.4, 0.24, { cut: 1200, cutTo: 600, q: 2, acc: 4, decay: 0.3, ramp: (u) => 1 - 0.6 * u });
  ['D6', 'A5', 'F5'].forEach((n, i) => M.bell(cap('clue', 1) + 0.3 + i * 0.6, n, 0.16 - 0.03 * i, -0.3 + 0.3 * i));
  // ---- the growth turns around: the theme's first notes, falling back; a Big Crunch in 20 billion years: a low D
  M.prog([[UC.turn, C.Bbmaj7], [cap('turn', 1) - 0.2, C.Asus]], UC.same + 0.4, 0.48, { cut: 1100 });
  ['D5', 'A5', 'G5', 'E5', 'D5', 'A4'].forEach((n, i) => M.piano(UC.turn + 0.6 + i * 0.5, n, 0.15, 2, i % 2 ? 0.2 : -0.2, 0.4));
  M.drum(cap('turn', 1) + 0.1, 0.5, 36.7, 1.6); M.piano(cap('turn', 1) + 0.1, 'D2', 0.3, 3.5, 0);
  // ---- billions of years, not four hours; the sky would end just like this: the theme slow, on the piano
  M.prog([[UC.same, C.Dm9], [cap('same', 1) - 0.2, C.Bbmaj7]], UC.question + 0.4, 0.45, { cut: 1200, cutTo: 800 });
  theme(UC.same + 0.6, [1.4, 1.2, 1.8], 0.2, { piano: true, dur: 2.8 });

  // ---- the question (7:29 again): light, the theme whole once more, and this time it lands on the octave, warm
  M.prog([[UC.question, C.F], [ucS('question') + 2.0, C.C], [cap('question', 1), C.Bbmaj7], [cap('question', 1) + 2.0, C.DmajBig]], UC.end + 1.4, 0.55, { cut: 1500, lastRel: 2.2 });
  for (let t = UC.question + 0.5, i = 0; t < cap('question', 1) - 0.2; t += 0.32, i++) M.piano(t, ['F4', 'A4', 'C5', 'A4', 'E4', 'G4', 'C5', 'G4'][i % 8], 0.11, 0.6, i % 2 ? 0.25 : -0.25, 0.2);
  const tq = theme(cap('question', 1) + 0.2, 0.42, 0.36);
  M.bell(tq, UC_THEME_END, 0.46, 0); M.drum(tq, 0.5, 36.7, 1.4); M.piano(tq, 'D2', 0.38, 5, 0); M.piano(tq + 0.02, 'F#3', 0.2, 5, 0.1);
  ['D6', 'F#6', 'A6', 'D7'].forEach((n, i) => M.bell(tq + 0.5 + i * 0.25, n, 0.2, -0.45 + 0.3 * i));
});
