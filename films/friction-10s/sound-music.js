/* =====================================================================
   SOUND · MUSIC — an original score in E minor, all synthesised (the music kit of the Universe cut in half film,
   renamed fz*): string pads, a felt piano (also played backwards), bells, a low drum, a filtered synth pulse.
   This film's own ideas:
     the theme        E–G–F♯–B, then a slide down (things letting go): over the title, at Galileo, and the question
     8:14:07          nothing before it but the kitchen and the brakes outside; when friction goes, one low blow
     the clock stops  the first second and a half plays at real speed; as the clock slows to 1/80 the score slows with
                      it (the chord glides down an octave, like a tape stopping) and holds a low drone
     the replays      a steady pulse under each "same second again" section, a new chord colour for each place
     the slide        from "Now everything starts to slide" the pulse quickens and the chords climb, to the count down
     s = 10           a heartbeat and a roll into the last count; everything stops dead for 0.4 s; then the blow
     after            grave and slow for the replays of the return; nearly nothing for "10 seconds."; the question:
                      the theme, its last note cut on the last frame (it never resolves)
   ===================================================================== */

// the kit: string pads (three detuned oscillators per note through low-passes), felt piano (also reversed), bells,
// a low drum and a heartbeat
function fzMusicKit(ctx, K) {
  if (K._music) return K._music;
  const fx = K.fx, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(); bus.connect(K.bus);
  const hall = fx.ir(4.2, { bright: 0.5, damp: 2.8, shape: 2.0, pre: 0.025, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.55;
  bus.connect(hall); hall.connect(wet); wet.connect(K.bus);
  const drumModes = (f) => [[f, 0.7, 1], [f * 1.51, 0.45, 0.5], [f * 1.99, 0.3, 0.35], [f * 2.44, 0.2, 0.2], [f * 3.1, 0.12, 0.12]];
  const M = {
    bus,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4, dest = bus) => {
      const b = fx.pianoBuf(fzMidi(n)), len = Math.min(b.length, Math.ceil((dur + fade + 0.05) * fx.sr));
      return fx.play(b.subarray(0, len), t, dest, { vol: vel * 0.34, pan, stop: t + dur + fade, fade });
    },
    // a piano note played backwards: it swells up out of nothing and stops dead on its attack at tEnd
    rpiano(tEnd, n, vel, dur = 1.6, pan = 0) {
      const key = 'rp' + n + '_' + dur;
      if (!fx.cache[key]) {
        const b = fx.pianoBuf(fzMidi(n)), L = Math.min(b.length, Math.ceil(dur * fx.sr)), y = new Float32Array(L + Math.ceil(0.01 * fx.sr));
        for (let i = 0; i < L; i++) { const u = i / L; y[L - 1 - i] = b[i] * Math.min(1, (1 - u) / 0.35); }
        for (let i = 0; i < 0.01 * fx.sr; i++) y[L + i] = y[L - 1] * (1 - i / (0.01 * fx.sr));
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], tEnd - dur, bus, { vol: vel * 0.34, pan });
    },
    bell: (t, n, vol, pan = 0, dest = bus) => fx.play(fx.bellBuf(fzMidi(n)), t, dest, { vol: vol * 0.25, pan }),
    bellCut: (t, n, vol, d = 0.18, pan = 0) => fx.play(fx.bellBuf(fzMidi(n)), t, bus, { vol: vol * 0.25, pan, stop: t + d, fade: 0.05 }),
    // a low drum (a timpani-like membrane): f the pitch, vol, soft = a wider mallet, dk = decay
    drum(t, vol, f = 36.7, soft = 1, dk = 1) {
      const key = 'drum' + f + '_' + soft + '_' + dk;
      if (!fx.cache[key]) {
        const y = fx.hit(drumModes(f).map(([a, tau, b]) => [a, tau * dk, b]), { width: 0.006 * soft, amp: 1, noise: 0.25, nlen: 0.02, nhp: 300, len: 3.2 * Math.max(dk, 0.3) });
        const pk = FZX.peak(y) || 1; for (let i = 0; i < y.length; i++) y[i] /= pk;
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
    // o.glide (cents, from o.glideFrom by o.glideAt: the chord slides), o.pan
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
        const f = fzHz(nn);
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
// o.ramp(u) the level over the span, o.wave, o.glide (cents over the span), o.stepAt(t) a changing step
function fzPulse(ctx, dest, t0, t1, notes, step, vol, o = {}) {
  if (t1 - t0 < step) return;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.q || 4;
  lp.frequency.setValueAtTime(o.cut || 600, t0); lp.frequency.linearRampToValueAtTime(o.cutTo || o.cut || 600, t1);
  lp.connect(g); g.connect(dest); g.gain.value = 0;
  notes.forEach((n, k) => {
    const os = ctx.createOscillator(); os.type = o.wave || 'sawtooth'; os.frequency.value = fzHz(n); os.detune.setValueAtTime(k % 2 ? 6 : -6, t0);
    if (o.glide) os.detune.linearRampToValueAtTime((k % 2 ? 6 : -6) + o.glide, t1);
    os.connect(lp); os.start(t0); os.stop(t1 + 0.1);
  });
  for (let t = t0, i = 0; t < t1 - 0.01; t += (o.stepAt ? o.stepAt(t) : step), i++) {
    const acc = o.acc && i % o.acc === 0 ? 1.0 : 0.62, ramp = o.ramp ? o.ramp((t - t0) / (t1 - t0)) : 1, v = vol * 0.05 * acc * ramp, st = o.stepAt ? o.stepAt(t) : step;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.setTargetAtTime(0, t + 0.012, st * (o.decay || 0.28));
  }
}

const FZ_CH = {
  Em9: ['E2', 'B2', 'G3', 'D4', 'F#4'], Em: ['E2', 'B2', 'E3', 'G3', 'B3'], Cmaj7: ['C2', 'G2', 'E3', 'B3', 'E4'], Clyd: ['C2', 'G2', 'E3', 'B3', 'F#4'],
  G: ['G1', 'D2', 'B2', 'D3', 'G3'], D: ['D2', 'A2', 'F#3', 'A3', 'D4'], Dsus: ['D2', 'A2', 'E3', 'G3', 'A3'], Asus: ['A1', 'E2', 'D3', 'E3', 'A3'],
  Am9: ['A1', 'E2', 'C3', 'G3', 'B3'], Bsus: ['B1', 'F#2', 'E3', 'F#3', 'B3'], B: ['B1', 'F#2', 'D#3', 'F#3', 'B3'], Fmaj7s11: ['F1', 'C2', 'A2', 'E3', 'B3'],
  Embig: ['E2', 'B2', 'E3', 'G3', 'B3', 'E4', 'G4', 'B4'], Bbig: ['B1', 'F#2', 'B2', 'D#3', 'F#3', 'B3', 'D#4', 'F#4'],
};
const FZ_THEME = ['E5', 'G5', 'F#5', 'B5'];
const fzOct = (n, k) => n.replace(/-?\d$/, (d) => String(+d + k));

fzSound('music', 'score', function (ctx, bus, K) {
  const M = fzMusicKit(ctx, K), C = FZ_CH, cap = (id, k) => fzCap(id, k).show, S = fzS, B = fzB, T0 = FZ.t0;
  const shot = (mode) => FZ_SHOTS.find((s) => s.mode === mode);
  // the theme (bells, or the piano), then the slide: o.slide (s) the last note glides down a fifth and fades
  const theme = (t, dts, vol, o = {}) => {
    let tt = t; const ns = FZ_THEME;
    ns.forEach((n, i) => {
      const nn = fzOct(n, o.oct || 0), pan = (o.pan || 0) + (i % 2 ? 0.22 : -0.22), last = i === ns.length - 1;
      if (last && o.cut) { if (o.piano) M.piano(tt, nn, vol * 0.9, o.cut, pan, 0.02); else M.bellCut(tt, nn, vol * 0.9, o.cut, pan); }
      else if (o.piano) M.piano(tt, nn, vol * (i ? 0.88 : 1), o.dur || 2.4, pan); else M.bell(tt, nn, vol * (i ? 0.88 : 1), pan);
      if (last && o.slide) M.strings(tt, tt + o.slide, [nn], vol * 0.35, { att: 0.05, rel: o.slide * 0.4, cut: 5000, wave: 'sine', vib: 2, glide: -700, glideFrom: tt + 0.15, glideAt: tt + o.slide });
      tt += Array.isArray(dts) ? dts[Math.min(i, dts.length - 1)] : dts;
    });
    return tt;
  };
  const keys = (t0, t1, dt, ns, vel, o = {}) => { for (let t = t0, i = 0; t < t1 - 0.3; i++, t += dt) M.piano(t, ns[i % ns.length], vel, Math.min(o.dur || 2.4, (o.stop || 1e9) - t), Math.sin(i * 1.3) * 0.4, o.stop && t + 2.4 > o.stop ? 0.04 : 0.4); };
  const heart = (t0, t1, every, vol) => { for (let t = t0; t < t1 - 0.2; t += typeof every === 'function' ? every(t) : every) M.beat(t, typeof vol === 'function' ? vol(t) : vol); };

  // ---- 1 · the cold open: friction goes (one blow), the first second and a half, then the clock (and the score) slow
  const tStop = [FZ.open.real, FZ.open.slow], tNuance = B('nuance', 0.4), tFlash = shot('flash');
  M.drum(T0, 0.95, 36.7, 1.1, 1.3); M.piano(T0, 'E1', 0.5, 2.0, 0, 0.6); M.piano(T0, 'E2', 0.32, 2.0, 0, 0.6);
  M.strings(T0, tStop[1] + 0.6, C.Em9, 0.36, { att: 0.25, rel: 0.6, cut: 1500, glide: -1200, glideFrom: tStop[0], glideAt: tStop[1] + 0.3, cutTo: 500, cutAt: tStop[1] + 0.3 });
  theme(T0 + 0.18, [0.36, 0.36, 0.42], 0.44, { cut: tStop[0] - T0 - 1.3 });
  M.strings(tStop[1] - 0.2, tFlash.t0 + 0.05, ['E1', 'B1', 'E2'], 0.38, { att: 1.0, rel: 0.05, cut: 300, wave: 'triangle', vib: 0 });
  M.strings(S('gone') + 0.5, tFlash.t0 + 0.05, ['B4', 'E5'], 0.035, { att: 2.5, rel: 0.05, cut: 7000, wave: 'sine', vib: 3 });
  // the flash-forward to s = 10: a swell, cut dead when it cuts back
  M.drum(tFlash.t0, 0.55, 41.2, 1.2); M.strings(tFlash.t0, tFlash.t1 + 0.01, ['E1', 'B1', 'F2', 'C3'], 0.4, { att: 0.3, rel: 0.01, cut: 500, cutTo: 2600, cutAt: tFlash.t1 });
  M.roll(tFlash.t1 - 1.8, tFlash.t1 - 0.03, [[tFlash.t1 - 1.8, 0.06], [tFlash.t1 - 0.1, 0.4]], 61.7);
  // the rule: curious and light (atoms, apart, push; the faults: a low warning)
  M.prog([[tNuance, C.Cmaj7], [cap('nuance', 1) - 0.35, C.Am9], [cap('nuance', 2) - 0.35, C.G], [cap('nuance', 3) - 0.35, C.Bsus]], B('rewind', 0.4) + 0.2, 0.26, { cut: 1100 });
  keys(tNuance + 0.6, B('rewind', 0.4), 2.2, ['B4', 'E5', 'G4', 'D5'], 0.08);
  M.bell(cap('nuance', 1) + 0.5, 'E6', 0.18, 0.3); M.bellCut(cap('nuance', 1) + 1.0, 'B5', 0.16, 0.12, -0.3);   // (fall apart: a bell cut short)
  M.strings(cap('nuance', 3) - 0.35, B('rewind', 0.4) + 0.1, ['E1', 'B1'], 0.3, { att: 1.0, rel: 0.2, cut: 220, wave: 'triangle', vib: 0 });

  // ---- 2 · that first second again, 10× slower: the kitchen. A steady pulse; a chord for each beat
  const tRw = B('rewind', 0.4), t2 = B('cat'), t3 = B('house', 0.5);
  M.rpiano(t2, 'E3', 0.34, 2.4); M.rpiano(t2, 'B3', 0.26, 2.4); M.rpiano(t2, 'E4', 0.2, 2.4);
  M.strings(tRw, t2 + 0.3, ['E2', 'B2', 'E3'], 0.22, { att: 0.3, rel: 0.4, cut: 900, glide: 1200, glideFrom: tRw, glideAt: tRw + 1.2 });
  M.prog([[t2, C.Em9], [B('mug', 0.5), C.Cmaj7], [B('feet', 0.5), C.Am9], [B('grip', 0.4), C.Bsus], [cap('grip', 2) - 0.45, C.Em], [B('catrun'), C.Cmaj7], [cap('catrun', 2), C.Dsus]], t3 + 0.3, 0.27, { cut: 1200 });
  fzPulse(ctx, M.bus, t2 + 0.2, t3 - 0.05, ['E2', 'B2'], 0.5, 0.2, { cut: 520, cutTo: 1300, acc: 4, decay: 0.26, ramp: (u) => 0.55 + 0.45 * u });
  M.drum(B('feet', 0.5) + 0.02, 0.3, 41.2, 1.4);
  M.bell(cap('grip', 2) + 0.1, 'B5', 0.2, 0.2);                                                // "Don't grip. Hook."
  keys(B('catrun') + 0.4, t3 - 0.3, 0.75, ['E5', 'B4', 'G5', 'D5'], 0.06, { dur: 0.6 });      // (the cat's run: quick, light)

  // ---- 3 · the rest of the house: a new colour; the screws' tension; the joke (the music stops); the sugar
  const t4 = B('street');
  M.rpiano(t3 + 0.8, 'A3', 0.28, 0.8);
  M.prog([[t3 + 0.75, C.Am9], [B('screws'), C.Fmaj7s11], [B('cabinets'), C.Am9], [B('tv'), C.Cmaj7], [B('cotton'), C.G], [B('clothes', 0.4), C.Am9]], cap('clothes', 1) + 0.02, 0.26, { cut: 1100, lastRel: 0.02 });
  fzPulse(ctx, M.bus, t3 + 0.8, cap('clothes', 1), ['A1', 'E2'], 0.5, 0.17, { cut: 480, cutTo: 900, acc: 4, decay: 0.24 });
  M.strings(B('screws') + 0.3, B('cabinets') + 0.1, ['E5', 'F5'], 0.03, { att: 2.0, rel: 0.1, cut: 8000, wave: 'sine', vib: 0, glide: 120 });   // (the screws turning: a rub)
  M.drum(B('cabinets'), 0.36, 49, 1.2);
  M.bell(cap('cotton', 2) + 0.5, 'E6', 0.16, 0.3); M.bellCut(cap('cotton', 2) + 0.9, 'B5', 0.14, 0.1, -0.3);
  M.bell(cap('clothes', 1) + 0.9, 'G5', 0.12, 0);                                               // ("Let's not look down." — then one bell)
  M.prog([[B('sugar'), C.Cmaj7], [cap('sugar', 1), C.Em9]], t4 + 0.3, 0.24, { cut: 1200 });
  keys(B('sugar') + 0.3, t4 - 0.3, 0.9, ['G5', 'E5', 'D5', 'B4', 'A4', 'G4'], 0.05, { dur: 0.8 });   // (the sugar pouring: a falling run)

  // ---- 4 · outside: wider; a bass pulse; the brakes (the score drops out with the screech); the scaffold's crash
  const t5 = B('slide', 0.5), brakeCut = fzWhen(0, (s) => s.mode === 'brakes')[0];
  M.rpiano(t4 + 0.6, 'E2', 0.3, 1.0); M.rpiano(t4 + 0.6, 'B2', 0.24, 1.0);
  M.prog([[t4 + 0.55, C.Em9], [B('brakes', 2.4), C.Cmaj7]], brakeCut.t + 0.01, 0.28, { cut: 1300, lastRel: 0.01 });
  fzPulse(ctx, M.bus, t4 + 0.6, brakeCut.t, ['E1', 'E2'], 0.42, 0.22, { cut: 420, cutTo: 900, acc: 4, decay: 0.3 });
  const tBack4 = brakeCut.t + 2.2;
  M.prog([[tBack4, C.Am9], [B('bike', 0.5), C.Em9], [B('laces', 0.5), C.Cmaj7], [B('walk', 0.5), C.G], [B('ladder', 0.5), C.Dsus], [B('scaffold', 0.5), C.Am9], [cap('scaffold', 1) - 0.3, C.Bsus], [B('sand', 0.5), C.Em9]], t5 + 0.3, 0.27, { cut: 1250 });
  fzPulse(ctx, M.bus, tBack4 + 0.5, t5 - 0.05, ['E1', 'E2'], 0.42, 0.2, { cut: 420, cutTo: 1100, acc: 4, decay: 0.3, ramp: (u) => 0.6 + 0.4 * u });
  M.bell(cap('laces', 2) + 0.4, 'B5', 0.16, 0.2); M.bellCut(cap('laces', 2) + 0.8, 'F#5', 0.14, 0.12, -0.2);
  M.roll(cap('scaffold', 0) + 2.2, cap('scaffold', 0) + 3.15, [[cap('scaffold', 0) + 2.2, 0.06], [cap('scaffold', 0) + 3.1, 0.35]], 61.7);

  // ---- 5 · everything slides: the build (the pulse quickens, the chords climb), Galileo, real speed, faster
  const tRS = B('realspeed'), tF = tRS + 5.0, tWarn = B('warn'), tCount = FZ_SHOTS.find((s) => s.mode === 'count'), tB = B('back', 0.35);
  M.strings(t5, S('slide') + 0.1, ['E1', 'B1'], 0.36, { att: 0.2, rel: 0.1, cut: 260, wave: 'triangle', vib: 0 });
  M.prog([[t5, C.Em9], [cap('slide', 2) - 0.2, C.Cmaj7], [B('floor'), C.Am9], [cap('floor', 2), C.Bsus], [B('hill', 0.5), C.Em], [B('same', 0.5), C.Cmaj7], [cap('same', 1), C.G], [cap('same', 2), C.Dsus]], tRS + 0.2, 0.28, { cut: 1100, cutTo: 1800, lastRel: 0.15 });
  fzPulse(ctx, M.bus, cap('slide', 2), tRS - 0.05, ['E1', 'E2', 'B2'], 0.5, 0.2, { cut: 450, cutTo: 1500, acc: 4, decay: 0.28, stepAt: (t) => 0.5 - 0.12 * MathX.clamp((t - cap('slide', 2)) / (tRS - cap('slide', 2)), 0, 1), ramp: (u) => 0.5 + 0.5 * u });
  theme(cap('same', 2) + 0.5, [0.55, 0.55, 0.65], 0.32, { slide: 1.6 });                       // (Galileo)
  // real speed, from the start: a quick roll and the chord thrown open
  M.drum(tRS, 0.5, 41.2, 1.2); M.roll(tRS + 0.1, tF - 0.05, [[tRS + 0.1, 0.1], [tF - 0.2, 0.32]], 73.4);
  M.strings(tRS, tF + 0.1, C.Embig, 0.3, { att: 0.4, rel: 0.2, cut: 900, cutTo: 3000, cutAt: tF });
  // faster, every second: the pulse doubles; the bus; the phone
  M.prog([[tF, C.Em9], [B('sofa'), C.Cmaj7], [B('bus'), C.Am9], [cap('bus', 2), C.Bsus], [B('phone2', 0.5), C.Cmaj7]], tWarn + 0.3, 0.3, { cut: 1300, cutTo: 2200 });
  fzPulse(ctx, M.bus, tF, tWarn - 0.02, ['E1', 'E2', 'B2'], 0.25, 0.2, { cut: 600, cutTo: 1800, acc: 4, decay: 0.3, ramp: (u) => 0.6 + 0.4 * u });
  M.drum(B('bus'), 0.32, 41.2, 1.4);
  // the warning and the count down: a heartbeat quickening, the strings rising, a roll; each quick cut on a low hit
  const tHold = tB - 0.42;
  M.drum(tWarn, 0.45, 36.7, 1.2);
  heart(tWarn + 0.4, tHold, (t) => 0.95 - 0.5 * MathX.clamp((t - tWarn) / (tHold - tWarn), 0, 1), (t) => 0.28 + 0.25 * MathX.clamp((t - tWarn) / (tHold - tWarn), 0, 1));
  M.strings(tWarn, tHold + 0.01, ['B1', 'F#2', 'E3', 'F#3', 'B3', 'C4'], 0.34, { att: 2.0, rel: 0.01, cut: 600, cutTo: 4200, cutAt: tHold, keys: [[tWarn + 3, 0.6], [tHold - 0.2, 1.4]] });
  M.roll(tHold - 3.0, tHold - 0.03, [[tHold - 3.0, 0.08], [tHold - 0.1, 0.5]], 61.7);
  FZ.countCuts.forEach((c, i) => M.drum(c, 0.14 + 0.04 * i, 49.0, 0.7));
  // (0.42 s of nothing at all) — then s = 10: the blow
  M.drum(tB, 1.0, 30.9, 1.0, 1.6); M.piano(tB, 'E1', 0.6, 1.2, 0, 0.4); M.piano(tB, 'B0', 0.45, 1.2, 0, 0.4);
  M.strings(tB, B('stop') + 0.4, ['E1', 'B1', 'E2', 'F2'], 0.42, { att: 0.05, rel: 1.0, cut: 900, cutTo: 400, cutAt: B('stop') });

  // ---- 6 · the return, replayed: grave and slow; the bus going over; the cat
  const t6 = B('after', 0.5), busHit = fzWhen(FZP.tBack + 1.25, (s) => s.mode === 'bus2')[0];
  M.prog([[B('stop'), C.Em9], [cap('stop', 1), C.Cmaj7], [B('bus2'), C.Am9], [cap('bus2', 1), C.Bsus]], busHit ? busHit.t + 0.02 : B('cat2'), 0.27, { cut: 1000, lastRel: 0.02 });
  if (busHit) { M.roll(busHit.t - 1.6, busHit.t - 0.03, [[busHit.t - 1.6, 0.06], [busHit.t - 0.1, 0.42]], 61.7); M.drum(busHit.t, 0.8, 32.7, 1.0, 1.4); M.strings(busHit.t, t6 + 0.2, C.Em, 0.26, { att: 0.1, rel: 1.0, cut: 700 }); }
  M.bell(S('cat2') + 0.6, 'E6', 0.14, -0.3);

  // ---- 7 · after: "10 seconds." (nearly nothing); the phone in the gutter; the question: the theme, never resolved
  M.strings(t6, B('question', 0.5) + 0.4, ['E2', 'B2'], 0.2, { att: 1.5, rel: 1.0, cut: 300, wave: 'sine', vib: 1 });
  M.strings(t6 + 0.5, B('question', 0.5) + 0.2, ['B5'], 0.03, { att: 2.5, rel: 1.0, cut: 8000, wave: 'sine', vib: 3 });
  M.piano(cap('phone3', 0) + 0.4, 'B4', 0.08, 3); M.piano(cap('phone3', 1) + 0.2, 'G4', 0.08, 3);
  const tQ = B('question', 0.5);
  M.prog([[tQ, C.Em9], [S('question') + 1.6, C.Cmaj7]], FZ.end - 0.02, 0.32, { cut: 1300, cutTo: 2600, cutAt: FZ.end - 0.5, lastRel: 0.02 });
  M.drum(tQ, 0.42, 41.2, 1.4);
  theme(S('question') + 0.3, [0.42, 0.42, 0.5], 0.4);
  M.strings(FZ.end - 3.2, FZ.end - 0.02, ['B3', 'F#4', 'B4'], 0.22, { att: 2.6, rel: 0.02, cut: 2000, cutTo: 4500, cutAt: FZ.end - 0.05 });
});
