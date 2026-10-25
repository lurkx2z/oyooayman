/* =====================================================================
   SOUND · MUSIC — an original score in D minor, all synthesised (the Slower light film's kit, renamed ux*): string
   pads, a felt piano, bells, a low drum, a heartbeat, a filtered synth pulse. Three ideas of this film's own:
     the theme     four bell notes, D–A–G–E, and then the D an octave up: the octave is the frequency DOUBLED, the way
                   space doubles. It rings out whole over the title; it comes back slower and lonelier each time; at
                   the end of the film it lands, whole and quiet, on that high D
     the stretch   starlight crossing growing space gets stretched, redder: so does the music. From "Now the stretch
                   reaches you" the sky's chord slides down, and its notes drop out one at a time as the stars go
     the doubling  in the last second, one tick for every time space doubles in size. They start a breath apart and
                   end as a buzz; then nothing, at midnight
   The shape: a hush for the cold open (a heartbeat, a drone); the title; wonder for growing space, warmth for "held
   together"; a little piano for Saturn; tension into 7:30, a hit on it; the first second held still, each galaxy a bell
   cut short as it goes over the edge; time moving again; the sky's chord sliding down and thinning; clear and warm
   for the Moon; one bell for Saturn, and a thread for its light still coming; the Sun: a low drum; then lighter and
   playful (the fountain, the jump), thinner as the air goes, a dip for your ears; weightless: high and still; rising
   lines as things fall up; the crack: drums and a low cluster; the cold open's drone again at 11:41; the theme alone
   for the house; the last second: the ticks, the heartbeat, the tear; silence at midnight; then warmth coming back
   for what's real, relief, the galaxies leaving, "Ours.", and the theme whole for the closing question.
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
  // bells walking round the chord tones
  const arp = (t0, t1, steps, step, vol, oct = [5, 6], seq = [0, 1, 2, 1, 3, 2, 1, 2]) => {
    for (let t = t0, i = 0; t < t1 - 0.05; t += step, i++) {
      let ch = steps[0][1]; for (const [ts, c] of steps) if (t >= ts) ch = c;
      const pcs = ch.map((n) => n.replace(/-?\d$/, '')), pc = pcs[(seq[i % seq.length] + 1) % pcs.length];
      M.bell(t, pc + oct[(i >> 2) % oct.length], vol * (i % 4 === 0 ? 1 : 0.7), i % 2 ? 0.35 : -0.35);
    }
  };

  // ---- 1 · the cold open (11:41 tonight): a low drone, a thin high note, your heartbeat; a swell into the cut
  M.strings(0, UC.titleShot + 0.2, ['D1', 'A1', 'D2'], 0.62, { att: 1.2, rel: 0.3, cut: 300, wave: 'sine', vib: 2 });
  M.strings(0.6, UC.titleShot + 0.1, ['A5'], 0.05, { att: 2.0, rel: 0.3, cut: 6000, wave: 'sine', vib: 3 });
  M.strings(1.5, UC.titleShot, ['Eb3', 'D4'], 0.16, { att: 2.5, rel: 0.2, cut: 900, wave: 'triangle', vib: 4 });
  for (let t = 0.4; t < UC.titleShot - 0.3; t += 0.78) M.beat(t, 0.3);
  M.rpiano(UC.titleShot, 'D3', 0.32, 1.8, 0); M.rpiano(UC.titleShot, 'A3', 0.22, 1.8, 0);

  // ---- the title (7:29, the garden): the theme rings out whole, then once more up high
  const T0 = UC.title[0];
  M.drum(T0, 0.8, 36.7, 1.4); M.piano(T0, 'D2', 0.42, 3.5, 0);
  M.strings(T0 - 0.1, UC.grow + 0.4, C.Dm9, 0.62, { att: 0.5, rel: 0.6, cut: 1400 });
  M.bell(theme(T0 + 0.1, 0.24, 0.45), UC_THEME_END, 0.55, 0);
  M.bell(theme(T0 + 2.2, 0.18, 0.24, { oct: 1 }), ucOct(UC_THEME_END, 1), 0.28, 0);
  M.piano(T0 + 2.4, 'A3', 0.22, 2.5, 0.2);

  // ---- space grows: wide and slow, opening out; bells drifting apart; "doubles": the octave, D then D
  {
    const g2 = cap('grow', 1) + 2.0, g = [[UC.grow, C.Bbmaj7], [cap('grow', 1) - 0.3, C.F], [g2, C.Dm9]];
    M.prog(g, UC.held + 0.4, 0.62, { cut: 1100, cutTo: 2600, att: 1.2 });
    for (let t = UC.grow + 0.6, i = 0; t < UC.held - 0.4; i++) { const ch = t < cap('grow', 1) - 0.3 ? C.Bbmaj7 : t < g2 ? C.F : C.Dm9, pcs = ch.map((n) => n.replace(/-?\d$/, '')); M.bell(t, pcs[(i * 2 + 1) % pcs.length] + (i % 3 ? 5 : 6), 0.13, Math.sin(i * 1.3) * 0.6); t += 0.55 + 0.12 * (i % 3); }
    M.drum(UC.grow, 0.45, 36.7, 2); M.piano(UC.grow, 'Bb1', 0.3, 3, 0);
    const td = ucW('grow', 'doubles').start; M.bell(td, 'D5', 0.36, -0.3); M.bell(td + 0.55, 'D6', 0.4, 0.3); M.piano(td, 'D2', 0.3, 3, 0);
  }
  // ---- held together: warm and steady; a low note under each line
  M.prog([[UC.held, C.F], [cap('held', 1) - 0.2, C.C], [cap('held', 1) + 1.65, C.Dm]], UC.scope + 0.5, 0.55, { cut: 1300 });
  for (const [t, n] of [[ucS('held') + 0.05, 'F2'], [cap('held', 1) + 0.05, 'C2'], [cap('held', 1) + 1.85, 'D2']]) { M.piano(t, n, 0.3, 3, 0); M.piano(t + 0.02, ucOct(n, 2), 0.14, 2.5, 0.15); }
  M.bell(cap('held', 1) + 2.2, 'A5', 0.18, 0.3);

  // ---- 7:29, Saturn: a little felt piano figure; "Rings and all": a sparkle
  {
    const fig = ['F4', 'A4', 'C5', 'A4', 'E4', 'A4', 'D5', 'A4'];
    for (let t = UC.scope + 0.5, i = 0; t < UC.rule - 0.3; t += 0.42, i++) M.piano(t, fig[i % 8], 0.13 * (i % 4 === 0 ? 1.25 : 1), 1.2, i % 2 ? 0.2 : -0.2, 0.25);
    M.strings(UC.scope, UC.rule + 0.4, C.Fmaj7, 0.36, { att: 1.0, rel: 0.6, cut: 1100 });
    ['A5', 'C6', 'E6', 'A6', 'C7'].forEach((n, i) => M.bell(cap('scope', 1) + 0.1 + i * 0.07, n, 0.16, -0.4 + 0.2 * i));
  }
  // ---- 7:30: the rule. Tension: the pad leans, a reversed swell into the moment, a drum on it, a high cluster
  //      appears (the first second begins) and stays
  M.prog([[UC.rule, C.Gm9], [cap('rule', 1) - 0.2, C.Asus]], UC.onset + 0.1, 0.5, { cut: 900, cutTo: 1600 });
  M.roll(cap('rule', 1), UC.onset, [[cap('rule', 1), 0.05], [UC.onset, 0.42]], 73);
  M.rpiano(UC.onset, 'A3', 0.4, 2.2, 0); M.rpiano(UC.onset, 'D4', 0.3, 2.2, 0);
  M.drum(UC.onset, 0.9, 36.7, 1.2); M.drum(UC.onset, 0.35, 73);
  ['D6', 'E6', 'A6'].forEach((n, i) => M.bell(UC.onset + i * 0.02, n, 0.3, -0.4 + 0.4 * i));

  // ---- 2 · the first second, slowed down: one chord held still the whole way; every galaxy that goes over the edge
  //      is a bell cut short; Andromeda's own note; "You can still see it": a thread that goes on (its light)
  {
    const t0 = UC.onset, t1 = UC.resume + 0.4;
    M.strings(t0, t1, ['D2', 'A2', 'E3', 'A3'], 0.5, { att: 2.0, rel: 1.0, cut: 700, vib: 1.5 });
    M.strings(t0 + 1, t1, ['E5', 'A5'], 0.05, { att: 3.0, rel: 1.0, cut: 5000, wave: 'sine', vib: 1 });
    // far: the farthest galaxies first, then nearer and nearer (lower, slower)
    for (let i = 0; i < 14; i++) { const t = UC.far + 0.6 + i * 0.68 + 0.15 * Math.sin(i * 2.1); M.bellCut(t, ['A6', 'E6', 'G6', 'D6', 'C6', 'A5', 'E6', 'G5', 'D6', 'A5', 'F5', 'E5', 'D5', 'A4'][i], 0.12 + 0.012 * i, 0.12 + 0.02 * i, Math.sin(i * 1.9) * 0.7); }
    { const tf = cap('far', 2) + 0.1; M.piano(tf, 'D2', 0.3, 4, 0); M.strings(tf, tf + 4.5, ['A2'], 0.3, { att: 0.2, rel: 2.5, cut: 600, wave: 'triangle', glide: -700, glideAt: tf + 4.5 }); }
    // Andromeda: its own phrase (the theme's start, slow, piano), then it goes over the edge
    M.piano(UC.andro + 0.6, 'D4', 0.22, 2.8, -0.2); M.piano(UC.andro + 2.2, 'A4', 0.2, 2.8, 0.2);
    M.bellCut(UC.andGone, 'G5', 0.34, 0.22, 0); M.drum(UC.andGone, 0.25, 73);
    M.strings(cap('andromeda', 2), cap('andromeda', 3) + 3.0, ['G5'], 0.055, { att: 0.6, rel: 2.0, cut: 6000, wave: 'sine', vib: 2 });
    // letting go: each line a falling pair
    [[ucS('letgo'), 'F4', 'C4'], [cap('letgo', 1), 'E4', 'A3'], [cap('letgo', 2), 'D4', 'G3']].forEach(([t, a, b], i) => { M.piano(t + 0.15, a, 0.22, 1.6, -0.25 + 0.25 * i); M.piano(t + 0.85, b, 0.2, 2.4, -0.25 + 0.25 * i); });
    { const t = cap('letgo', 3); M.piano(t + 0.1, 'D2', 0.3, 3, 0); ['D4', 'A4', 'F5'].forEach((nn, i) => M.piano(t + 0.12, nn, 0.16, 2.6, -0.3 + 0.3 * i)); }   // "All at once.": all three notes together
    // half a second in: every star — a shower of bells, all cut short
    for (let i = 0; i < 22; i++) { const t = ucS('stars') + 0.2 + i * 0.09 + 0.04 * Math.sin(i * 3.3); M.bellCut(t, ['A6', 'E6', 'D6', 'G6', 'A5', 'C6', 'E5', 'G5'][i % 8], 0.08 + 0.05 * Math.abs(Math.sin(i)), 0.08, Math.sin(i * 2.7) * 0.8); }
    // and nothing looks any different
    M.bell(ucS('same') + 0.1, 'E6', 0.16, -0.2); M.bell(cap('same', 1) + 0.1, 'A5', 0.16, 0.2);
  }
  // ---- the first second is over: time moves again (the pad opens, a soft pulse starts)
  M.prog([[UC.resume, C.Dm9], [cap('resume', 1) - 0.2, C.Bbmaj7]], UC.stretch + 0.4, 0.5, { cut: 900, cutTo: 1500 });
  M.drum(UC.resume + 0.05, 0.4, 36.7, 1.6); M.bell(UC.resume + 0.1, 'D6', 0.22, 0);
  ucPulse(ctx, M.bus, UC.resume + 0.4, UC.stretch, ['D3', 'A3'], 0.36, 0.3, { cut: 500, cutTo: 900, acc: 4, decay: 0.3 });

  // ---- 3 · the sky goes out. The stretch: the sky's chord slides down (redder) and darkens; its notes drop out one
  //      by one as the red stars, the Milky Way, then Andromeda's last light go
  {
    const t0 = UC.stretch, tR = UC.red, tEnd = UC.moon + 0.3, gl = { glide: -500, glideFrom: cap('stretch', 1), glideAt: tR + 6 };
    const voices = [['A5', 0.06, cap('red', 0) + 1.2], ['E5', 0.07, cap('red', 1) + 1.2], ['C5', 0.07, cap('red', 2) + 1.8], ['A4', 0.09, tEnd]];
    for (const [n, v, te] of voices) M.strings(t0 + 0.2, te, [n], v * 4, Object.assign({ att: 1.5, rel: 0.9, cut: 4000, cutTo: 1200, cutAt: tR + 8, wave: 'triangle', vib: 3 }, gl));
    M.strings(t0, tEnd, ['D2', 'A2'], 0.45, Object.assign({ att: 1.0, rel: 0.8, cut: 600, cutTo: 350, cutAt: tEnd - 1 }, gl));
    for (let t = t0 + 0.6, i = 0; t < tR + 8; i++) { const k = MathX.clamp((t - cap('stretch', 1)) / (tR + 6 - cap('stretch', 1)), 0, 1); M.bell(t, ['A6', 'E6', 'C6', 'A5'][i % 4], 0.12 * (1 - 0.7 * k), Math.sin(i * 1.7) * 0.6); t += 0.6 + 0.5 * k; }
    M.piano(cap('stretch', 2) + 0.1, 'F2', 0.28, 3, 0);
  }
  // ---- but the Moon is still white: clear, warm, no slide
  M.prog([[UC.moon, C.Fmaj7], [cap('moon', 1) - 0.2, C.C], [cap('moon', 2) - 0.2, C.Am7]], UC.saturn + 0.4, 0.5, { cut: 1500 });
  [['C5', 0], ['A4', 0.6], ['F4', 1.2], ['E4', 2.2]].forEach(([n, dt]) => M.piano(UC.moon + 0.3 + dt, n, 0.18, 2.0, 0.1));
  M.bell(cap('moon', 1) + 0.1, 'E6', 0.16, -0.2); M.piano(cap('moon', 2) + 0.2, 'A2', 0.24, 3, 0);
  // ---- Saturn, 9:34: back at the eyepiece. One bell as it goes over the edge; a thin thread goes on: its light
  M.strings(UC.saturn, UC.blue + 0.3, ['D2', 'A2', 'E3'], 0.38, { att: 1.0, rel: 0.6, cut: 700 });
  M.bellCut(UC.satGone, 'A5', 0.4, 0.3, 0); M.piano(UC.satGone, 'D2', 0.28, 3.5, 0);
  M.strings(UC.satGone + 0.1, UC.blue + 0.6, ['A5'], 0.055, { att: 0.3, rel: 1.6, cut: 6000, wave: 'sine', vib: 2, keys: [[UC.satGone + 1, 1], [UC.blue, 0.5]] });
  // ---- the bluest stars go last: high bells, thinning out, gone by 10:40
  M.strings(UC.blue, UC.moon2 + 0.4, ['E5', 'A5', 'B5'], 0.2, { att: 0.6, rel: 1.0, cut: 5000, cutTo: 1200, wave: 'triangle' });
  for (let t = UC.blue + 0.3, i = 0; t < cap('blue', 1) + 1.6; i++) { const k = MathX.clamp((t - UC.blue) / (cap('blue', 1) + 1.6 - UC.blue), 0, 1); M.bell(t, ['B6', 'E6', 'A6', 'B5'][i % 4], 0.14 * (1 - 0.8 * k), Math.sin(i * 2.2) * 0.6); t += 0.25 + 0.6 * k; }
  // ---- now only the Moon: the theme, slow and alone, on the piano; the pad low
  M.strings(UC.moon2, UC.sunGone + 0.2, ['D2', 'A2', 'F3'], 0.42, { att: 1.5, rel: 0.4, cut: 650 });
  theme(UC.moon2 + 0.6, [1.4, 1.2, 1.8], 0.22, { piano: true, oct: -1, dur: 2.6 });
  // ---- 10:55, the Sun goes over the edge: a low drum; the Moon lit by its last light (a low, dimming chord)
  M.drum(UC.sunGone, 0.75, 36.7, 1.4); M.piano(UC.sunGone, 'D1', 0.4, 4, 0); M.piano(UC.sunGone, 'D2', 0.3, 4, 0);
  M.strings(UC.sunGone, UC.weight + 0.4, ['D2', 'A2', 'D3', 'F3'], 0.5, { att: 0.1, rel: 1.2, cut: 1400, cutTo: 400 });
  M.bell(cap('sun', 1) + 0.1, 'F5', 0.14, 0.3);

  // ---- 4 · lighter. 11:00, "now you can feel it": playful, lighter, higher; a pulse
  {
    const t0 = UC.weight, t1 = UC.moongo;
    M.prog([[t0, C.Dm9], [cap('weight', 1) - 0.2, C.Bbmaj7], [UC.fountain, C.F], [cap('fountain', 1) - 0.2, C.C]], t1 + 0.4, 0.42, { cut: 1500 });
    ucPulse(ctx, M.bus, t0 + 0.3, t1, ['D4', 'A4'], 0.3, 0.26, { wave: 'square', cut: 1800, q: 1, decay: 0.2, acc: 4 });
    const pl = ['D5', 'F5', 'A5', 'F5', 'E5', 'G5', 'A5', 'C6'];
    for (let t = cap('weight', 1) + 0.3, i = 0; t < UC.fountain - 0.2; t += 0.3, i++) M.piano(t, pl[i % 8], 0.12, 0.25, i % 2 ? 0.25 : -0.25, 0.12);
    // the fountain climbs higher (a rising run) … and falls slower (the notes coming down further and further apart)
    ['F4', 'A4', 'C5', 'F5', 'A5', 'C6'].forEach((n, i) => M.bell(UC.fountain + 0.3 + i * 0.12, n, 0.2, -0.3 + 0.12 * i));
    ['C6', 'A5', 'F5', 'C5', 'A4'].forEach((n, i) => M.bell(cap('fountain', 1) + 0.2 + 0.35 * i * (1 + 0.35 * i), n, 0.18, 0.3 - 0.12 * i));
  }
  // ---- the Moon goes out: a single high note fading with it
  M.strings(UC.moongo, UC.jump + 0.3, ['D2', 'A2', 'E3'], 0.36, { att: 0.6, rel: 0.6, cut: 700 });
  M.strings(UC.moongo + 0.2, UC.jump - 0.3, ['F6'], 0.05, { att: 0.3, rel: 1.6, cut: 7000, wave: 'sine', vib: 2, keys: [[UC.moongo + 1, 1], [UC.jump - 1.5, 0.2]] });
  // ---- jump: everything holds its breath while you hang (one chord), a soft note when you land
  {
    const tJ = UC.jump; let land = tJ + 1;
    for (let u = 0.3; u < 6; u += 0.01) { const ge = 9.81 * Math.max(0.05, ucWeight(ucNight(tJ + u))); if (2.7 * u - 0.5 * ge * u * u <= 0) { land = tJ + u; break; } }
    M.rpiano(tJ, 'A3', 0.26, 0.9, 0);
    M.strings(tJ, land + 0.6, ['A3', 'D4', 'E4', 'A4'], 0.32, { att: 0.15, rel: 0.5, cut: 2400, wave: 'triangle', vib: 3 });
    M.bell(tJ + 0.05, 'A5', 0.22, -0.2); M.bell(land, 'D5', 0.2, 0.2); M.piano(land, 'D3', 0.2, 2, 0);
    M.strings(land, UC.air + 0.4, C.Dm9, 0.32, { att: 0.8, rel: 0.5, cut: 1100 });
  }
  // ---- the air weighs less: the music thins (high, airy, quiet); a dip for your ears (mix.js); the tea; the flame
  M.strings(UC.air, UC.zero + 0.4, ['D3', 'A3', 'E4'], 0.34, { att: 1.2, rel: 0.6, cut: 1400, cutTo: 700, cutAt: UC.flame });
  M.strings(UC.air + 1, UC.zero + 0.3, ['A5'], 0.045, { att: 2.0, rel: 0.6, cut: 6000, wave: 'sine', vib: 2 });
  for (let t = UC.tea + 0.8, i = 0; t < UC.flame - 0.4; i++) { M.bell(t, ['D6', 'F6', 'A6', 'E6', 'C7'][i % 5], 0.08 + 0.04 * Math.abs(Math.sin(i * 1.3)), Math.sin(i * 2.4) * 0.7); t += 0.35 + 0.25 * Math.abs(Math.sin(i * 1.9)); }
  M.piano(UC.flame + 0.3, 'F4', 0.16, 3, -0.2); M.piano(UC.flame + 1.4, 'C5', 0.14, 3, 0.2); M.piano(cap('flame', 1) + 0.2, 'A4', 0.14, 3, 0);

  // ---- 5 · 11:35, you weigh nothing: the pulse is gone; a floating pad, very high and still
  {
    const tz = UC.zeroAt;
    M.bell(tz, 'D6', 0.32, 0); M.bell(tz + 0.6, 'A6', 0.22, 0.3); M.piano(tz, 'D2', 0.3, 4, 0);
    M.strings(tz - 0.2, UC.crack + 0.5, ['D4', 'A4', 'E5', 'A5'], 0.28, { att: 2.5, rel: 0.8, cut: 3000, wave: 'triangle', vib: 2 });
    M.strings(tz, UC.crack + 0.4, ['D2', 'A2'], 0.3, { att: 2.0, rel: 0.6, cut: 400, wave: 'sine' });
    // everything that isn't fixed down… starts to fall up: lines rising
    for (let i = 0; i < 4; i++) { const t = UC.rise + 0.5 + i * 1.6, n = ['D4', 'F4', 'A4', 'D5'][i]; M.strings(t, t + 3.2, [n], 0.18, { att: 0.4, rel: 1.6, cut: 4000, wave: 'triangle', glide: 1200, glideAt: t + 3.2, pan: -0.5 + 0.33 * i }); }
  }
  // ---- the crack: a hit, a roll, a low cluster; Earth coming apart, from the outside in (a dark pulse)
  {
    const tc = UC.crackAt;
    M.roll(UC.crack + 0.5, tc, [[UC.crack + 0.5, 0.05], [tc, 0.5]], 73);
    M.drum(tc, 1.0, 36.7, 1.0, 1.4); M.drum(tc, 0.5, 49); M.piano(tc, 'D1', 0.45, 4, 0); M.piano(tc, 'Eb2', 0.3, 4, 0);
    M.strings(tc, UC.drift + 0.3, ['D1', 'A1', 'Eb2', 'D3'], 0.62, { att: 0.05, rel: 0.8, cut: 1600, cutTo: 500 });
    ucPulse(ctx, M.bus, cap('crack', 1), UC.drift, ['D2', 'Eb2'], 0.42, 0.42, { cut: 400, cutTo: 900, acc: 2, decay: 0.35 });
    M.drum(cap('crack', 1) + 0.05, 0.5, 36.7, 1.4);
  }
  // ---- 11:41: the cold open's drone again (we're back where we started); then the theme alone for the house
  M.strings(UC.drift, UC.pieces + 0.5, ['D1', 'A1', 'D2'], 0.6, { att: 0.8, rel: 0.6, cut: 300, wave: 'sine', vib: 2 });
  M.strings(UC.drift + 0.3, UC.pieces + 0.4, ['A5'], 0.05, { att: 1.5, rel: 0.6, cut: 6000, wave: 'sine', vib: 3 });
  M.strings(UC.drift + 0.5, UC.pieces + 0.3, ['Eb3', 'D4'], 0.16, { att: 2.0, rel: 0.4, cut: 900, wave: 'triangle', vib: 4 });
  M.strings(UC.pieces, UC.last + 0.3, ['D2', 'A2', 'F3', 'A3'], 0.4, { att: 1.5, rel: 0.6, cut: 800 });
  theme(UC.pieces + 0.8, [1.1, 0.9, 1.5], 0.2, { piano: true, dur: 2.2 });
  M.piano(cap('pieces', 1) + 0.15, 'F2', 0.28, 3.5, 0); M.piano(cap('pieces', 1) + 0.17, 'C4', 0.16, 3, 0.2);

  // ---- 6 · the last second. One tick for every doubling of space (they speed up to a buzz); your heartbeat until
  //      "Then you."; the house: a hit; you: everything bends; the atoms: a tear; then nothing at midnight
  {
    const t0 = UC.last, tm = UC.midnight;
    M.strings(t0, UC.you + 0.2, ['D2', 'A2', 'E3', 'A3'], 0.5, { att: 0.5, rel: 0.1, cut: 700, cutTo: 1600, cutAt: UC.house });
    M.strings(UC.house, tm - 0.02, ['D1', 'D2', 'Eb2', 'A2'], 0.5, { att: 0.05, rel: 0.05, cut: 900, cutTo: 3000, cutAt: tm - 0.3 });
    M.strings(UC.you, tm - 0.02, ['A4', 'Bb4', 'D5', 'Eb5'], 0.3, { att: 0.3, rel: 0.05, cut: 2500, cutTo: 7000, cutAt: tm - 0.4, glide: 1200, glideFrom: UC.you + 0.2, glideAt: tm, wave: 'triangle', vib: 12 });
    // the doublings: N(t) = (h / ln 2) · ln(left₀ / left(t)); a tick at each whole number (at most one per 25 ms)
    const N = (t) => (UCP.h / Math.LN2) * Math.log(3 / Math.max(1e-30, ucLeft(t)));
    let last = -1, prevT = -1;
    for (let t = t0 + 0.3; t < tm - 0.08; t += 0.002) {
      const k = Math.floor(N(t)); if (k <= last) continue; last = k;
      if (t - prevT < 0.025) continue; prevT = t;
      const u = MathX.clamp((t - t0) / (tm - t0), 0, 1);
      M.bellCut(t, u < 0.5 ? 'D6' : 'A6', 0.2 + 0.15 * u, 0.06, Math.sin(k * 1.7) * 0.4);
    }
    for (let t = t0 + 0.4, dt = 0.8; t < UC.you - 0.1; t += dt, dt = Math.max(0.45, dt * 0.93)) M.beat(t, 0.32 + 0.2 * ucEv(t, t0, UC.you));
    M.drum(UC.house, 1.0, 36.7, 1.0, 1.4); M.drum(UC.house, 0.55, 55); M.piano(UC.house, 'D1', 0.4, 3, 0);
    M.drum(UC.you, 0.7, 49, 1.2); M.bellCut(UC.you, 'D5', 0.4, 0.4, 0);
    M.roll(UC.atoms - 1.0, tm - 0.05, [[UC.atoms - 1.0, 0.05], [tm - 0.3, 0.55]], 73);
  }
  // ---- midnight: silence (the score stops dead with the picture)

  // ---- 7 · is any of this real? Warmth coming back; "We've measured it since 1998": a bright bell (the supernova)
  M.piano(UC.real + 0.5, 'D3', 0.24, 3.5, 0); M.piano(UC.real + 0.52, 'A3', 0.16, 3.5, 0.15);
  M.strings(UC.real + 0.3, cap('real', 1) + 0.4, C.Dm9, 0.42, { att: 3.0, rel: 0.6, cut: 500, cutTo: 1400 });
  M.prog([[cap('real', 1) - 0.2, C.Bbmaj7], [cap('real', 2) - 0.2, C.F], [cap('real', 3) - 0.2, C.Dm]], ucS('rip') + 0.4, 0.5, { cut: 1300 });
  M.bell(cap('real', 1) + 0.1, 'F5', 0.2, -0.2); ['C6', 'F6', 'A6'].forEach((n, i) => M.bell(cap('real', 2) + 0.3 + i * 0.05, n, 0.24, -0.3 + 0.3 * i));
  // a rip needs the push to keep growing (tension) … probably not (relief: the chord resolves and opens)
  M.strings(ucS('rip'), cap('rip', 1) + 0.3, C.Gm9, 0.45, { att: 0.8, rel: 0.4, cut: 900, cutTo: 1300 });
  M.roll(ucS('rip') + 0.6, cap('rip', 1) - 0.1, [[ucS('rip') + 0.6, 0.03], [cap('rip', 1) - 0.1, 0.2]], 73);
  M.prog([[cap('rip', 1) - 0.1, C.Fmaj7], [cap('rip', 1) + 2.4, C.C]], UC.future + 0.4, 0.55, { cut: 1600 });
  M.bell(cap('rip', 1) + 1.0, 'A5', 0.26, 0.2); M.bell(cap('rip', 1) + 1.35, 'C6', 0.22, -0.2); M.piano(cap('rip', 1) + 1.0, 'F2', 0.3, 3, 0);
  // ---- the galaxies are leaving anyway: the theme slow, bittersweet; "Ours.": one bell and a low D
  M.prog([[UC.future, C.Dm9], [cap('future', 1) - 0.2, C.Bbmaj7]], cap('future', 2) + 0.4, 0.45, { cut: 1200, cutTo: 700 });
  theme(UC.future + 0.6, [1.5, 1.3, 1.9], 0.2, { piano: true, dur: 2.8 });
  { const to = cap('future', 2) + 0.05; M.bell(to, 'D6', 0.38, 0); M.piano(to, 'D2', 0.32, 4, 0); M.strings(to, UC.question + 0.4, ['D3', 'A3', 'D4'], 0.3, { att: 0.2, rel: 1.0, cut: 1200, wave: 'triangle' }); }

  // ---- the question (7:29 again): light, the theme whole once more, and this time it lands on the octave, warm
  M.prog([[UC.question, C.F], [ucS('question') + 2.0, C.C], [cap('question', 1), C.Bbmaj7], [cap('question', 1) + 2.0, C.DmajBig]], UC.end + 1.4, 0.55, { cut: 1500, lastRel: 2.2 });
  for (let t = UC.question + 0.5, i = 0; t < cap('question', 1) - 0.2; t += 0.32, i++) M.piano(t, ['F4', 'A4', 'C5', 'A4', 'E4', 'G4', 'C5', 'G4'][i % 8], 0.11, 0.6, i % 2 ? 0.25 : -0.25, 0.2);
  const tq = theme(cap('question', 1) + 0.2, 0.42, 0.36);
  M.bell(tq, UC_THEME_END, 0.46, 0); M.drum(tq, 0.5, 36.7, 1.4); M.piano(tq, 'D2', 0.38, 5, 0); M.piano(tq + 0.02, 'F#3', 0.2, 5, 0.1);
  ['D6', 'F#6', 'A6', 'D7'].forEach((n, i) => M.bell(tq + 0.5 + i * 0.25, n, 0.2, -0.45 + 0.3 * i));
});
