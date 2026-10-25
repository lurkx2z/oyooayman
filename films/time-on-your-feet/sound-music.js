/* =====================================================================
   SOUND · MUSIC — an original score in E minor, all synthesised (the music kit of the earlier voiceless films,
   renamed tf*): string pads, a felt piano, bells, a low drum, a synth pulse. One idea of this film's own:
     the two clocks   an eight-note figure (E–B–G–B–F♯–B–D–B) played by two identical voices: your head's (right) and
                      your feet's (left). Each voice plays at the rate its own clock runs. On the Earth, on Sirius B and
                      on the neutron star the difference is far too small to hear, so they play as one. Above the black
                      hole they come apart for real: at 10 m the feet fall 17% behind, at your own height they play at
                      half speed, at 17 cm one note in eleven, at 5 mm they all but stop, and at the edge the feet's
                      last note just hangs. Then, from your feet's point of view, the head's voice races.
                      (Where a stretch of the film is sped up, the figure speeds up with it.)
   Also from the physics: as starlight falls onto the neutron star the sky's chord slides UP by the same factor
   (×1.235, a little over a minor third); above the black hole the floor's glow slides DOWN as its light is
   stretched, an octave by "twice as fast", and out of hearing.
   The shape: a hush and one frozen note for the cold open; the figure over the title; a quiet morning, the figure
   starting on the clocks' beep; a rush for the sped-up year and lifetime; light for the cat; the figure upside down
   when you stand on your head and an octave up for upstairs; a pulse through the experiments, a hit on each year;
   wonder for GPS; space for the Moon; a hush and a build for "why", landing on 9.8; a rise out of the window; size for
   Sirius B; weight and the bright sky for the neutron star; the black hole: the drone, the circling light, the
   shrinking sky, then the two clocks coming apart until one freezes; warmth for "is any of this real?"; the figure at
   home again; a landing on the question.
   ===================================================================== */

// the kit: string pads (three detuned oscillators per note through low-passes), felt piano (also reversed), bells,
// a low drum and a heartbeat
function tfMusicKit(ctx, K) {
  if (K._music) return K._music;
  const fx = K.fx, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(); bus.connect(K.bus);
  const hall = fx.ir(4.2, { bright: 0.5, damp: 2.8, shape: 2.0, pre: 0.025, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.55;
  bus.connect(hall); hall.connect(wet); wet.connect(K.bus);
  const drumModes = (f) => [[f, 0.7, 1], [f * 1.51, 0.45, 0.5], [f * 1.99, 0.3, 0.35], [f * 2.44, 0.2, 0.2], [f * 3.1, 0.12, 0.12]];
  const M = {
    bus,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4, dest = bus) => {
      const b = fx.pianoBuf(tfMidi(n)), len = Math.min(b.length, Math.ceil((dur + fade + 0.05) * fx.sr));
      return fx.play(b.subarray(0, len), t, dest, { vol: vel * 0.34, pan, stop: t + dur + fade, fade });
    },
    // a piano note played backwards: it swells up out of nothing and stops dead on its attack at tEnd
    rpiano(tEnd, n, vel, dur = 1.6, pan = 0) {
      const key = 'rp' + n + '_' + dur;
      if (!fx.cache[key]) {
        const b = fx.pianoBuf(tfMidi(n)), L = Math.min(b.length, Math.ceil(dur * fx.sr)), y = new Float32Array(L + Math.ceil(0.01 * fx.sr));
        for (let i = 0; i < L; i++) { const u = i / L; y[L - 1 - i] = b[i] * Math.min(1, (1 - u) / 0.35); }
        for (let i = 0; i < 0.01 * fx.sr; i++) y[L + i] = y[L - 1] * (1 - i / (0.01 * fx.sr));
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], tEnd - dur, bus, { vol: vel * 0.34, pan });
    },
    bell: (t, n, vol, pan = 0, dest = bus) => fx.play(fx.bellBuf(tfMidi(n)), t, dest, { vol: vol * 0.25, pan }),
    bellCut: (t, n, vol, d = 0.18, pan = 0) => fx.play(fx.bellBuf(tfMidi(n)), t, bus, { vol: vol * 0.25, pan, stop: t + d, fade: 0.05 }),
    // a low drum (a timpani-like membrane): f the pitch, vol, soft = a wider mallet, dk = decay
    drum(t, vol, f = 41.2, soft = 1, dk = 1) {
      const key = 'drum' + f + '_' + soft + '_' + dk;
      if (!fx.cache[key]) {
        const y = fx.hit(drumModes(f).map(([a, tau, b]) => [a, tau * dk, b]), { width: 0.006 * soft, amp: 1, noise: 0.25, nlen: 0.02, nhp: 300, len: 3.2 * Math.max(dk, 0.3) });
        const pk = TFX.peak(y) || 1; for (let i = 0; i < y.length; i++) y[i] /= pk;
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], t, bus, { vol: vol * 0.5 });
    },
    beat(t, vol) { M.drum(t, vol, 47, 1.6, 0.45); M.drum(t + 0.17, vol * 0.62, 52, 1.6, 0.4); },
    // a timpani roll from t0 to t1, its level following keys [[t, v], …]
    roll(t0, t1, keys, f = 82.4) {
      for (let t = t0, i = 0; t < t1; t += 0.065 + 0.012 * Math.sin(i * 1.7), i++) {
        let v = keys[0][1];
        for (let k = 1; k < keys.length; k++) if (t >= keys[k - 1][0]) v = keys[k - 1][1] + (keys[k][1] - keys[k - 1][1]) * MathX.clamp((t - keys[k - 1][0]) / (keys[k][0] - keys[k - 1][0]), 0, 1);
        M.drum(t, v * (0.8 + 0.2 * Math.sin(i * 2.3)), f, 1.6, 0.35);
      }
    },
    // a held chord: o.att/rel (s), o.cut → o.cutTo by o.cutAt (Hz), o.keys [[t, level]], o.wave, o.vib (cents),
    // o.glide (cents, from o.glideFrom to o.glideAt: the chord slides), o.pan
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
        if (o.cutTo) { if (o.cutFrom) lp.frequency.setValueAtTime(o.cut || 1700, o.cutFrom); lp.frequency.linearRampToValueAtTime(o.cutTo, o.cutAt || (t1 - rel * 0.5)); }
        const pn = ctx.createStereoPanner(); pn.pan.value = Math.max(-1, Math.min(1, p + (o.pan || 0))); lp.connect(pn); pn.connect(g); return lp;
      });
      for (const nn of notes) {
        const f = tfHz(nn);
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
// o.ramp(u) the level over the span, o.wave, o.stepAt(t) a changing step
function tfPulse(ctx, dest, t0, t1, notes, step, vol, o = {}) {
  if (t1 - t0 < step) return;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.q || 4;
  lp.frequency.setValueAtTime(o.cut || 600, t0); lp.frequency.linearRampToValueAtTime(o.cutTo || o.cut || 600, t1);
  lp.connect(g); g.connect(dest); g.gain.value = 0;
  notes.forEach((n, k) => {
    const os = ctx.createOscillator(); os.type = o.wave || 'sawtooth'; os.frequency.value = tfHz(n); os.detune.setValueAtTime(k % 2 ? 6 : -6, t0);
    os.connect(lp); os.start(t0); os.stop(t1 + 0.1);
  });
  for (let t = t0, i = 0; t < t1 - 0.01; t += (o.stepAt ? o.stepAt(t) : step), i++) {
    const acc = o.acc && i % o.acc === 0 ? 1.0 : 0.62, ramp = o.ramp ? o.ramp((t - t0) / (t1 - t0)) : 1, v = vol * 0.05 * acc * ramp, st = o.stepAt ? o.stepAt(t) : step;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.setTargetAtTime(0, t + 0.012, st * (o.decay || 0.28));
  }
}

const TF_CH = {
  Em9: ['E2', 'B2', 'G3', 'D4', 'F#4'], Em: ['E2', 'B2', 'G3', 'B3', 'E4'], Cmaj7: ['C2', 'G2', 'E3', 'B3', 'E4'], G: ['G1', 'D2', 'B2', 'D3', 'G3'],
  Gadd9: ['G2', 'D3', 'A3', 'B3', 'D4'], D: ['D2', 'A2', 'F#3', 'A3', 'D4'], Dsus: ['D2', 'A2', 'E3', 'G3', 'A3'], Am9: ['A1', 'E2', 'C3', 'G3', 'B3'],
  Bsus: ['B1', 'F#2', 'E3', 'F#3', 'B3'], B7: ['B1', 'F#2', 'D#3', 'A3', 'B3'], Cmaj7s11: ['C2', 'G2', 'E3', 'F#3', 'B3'],
  EmBig: ['E2', 'B2', 'E3', 'G3', 'B3', 'E4', 'G4', 'B4'], GBig: ['G1', 'D2', 'G2', 'B2', 'D3', 'G3', 'B3', 'D4'], EBig: ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4', 'G#4', 'B4'],
};
// the clock figure; the same upside down (a mirror in E minor about E5), and one octave up
const TF_FIG = ['E5', 'B4', 'G5', 'B4', 'F#5', 'B4', 'D5', 'B4'];
const TF_FIG_INV = ['E5', 'A5', 'C5', 'A5', 'D5', 'A5', 'F#5', 'A5'];
const tfOct = (n, k) => n.replace(/-?\d$/, (d) => String(+d + k));

// the feet's clock rate seen from your head (1 = together): above the black hole 1/(head/feet ratio); 0 once frozen
function tfFeetRate(t) {
  if (t < TF.titleShot) return 1 / tfBhRatio(tfRho(t));
  if (t >= TF.ten - 0.4 && t < TF.real) return t >= TF.freeze + 0.4 ? 0 : 1 / tfBhRatio(tfRho(t));
  return 1;
}

tfSound('music', 'score', function (ctx, bus, K) {
  const M = tfMusicKit(ctx, K), C = TF_CH, cap = (id, k) => tfCap(id, k).show, ev = tfEv;
  // the two clocks: a voice plays the figure at its own clock's rate rate(t) (× the figure's step), from t0 to t1.
  // o: step (s), notes, oct, vol(t), pan, dur, k0 (where in the figure it starts), inst 'piano' | 'bell', minGap
  // Returns the last note and its time (the frozen voice holds it).
  const voice = (t0, t1, rate, o = {}) => {
    const step = o.step || 0.3, notes = o.notes || TF_FIG, dt = 0.002, minGap = o.minGap || 0.045;
    let tau = 0, k = o.k0 || 0, lastT = -9, last = null;
    const fire = (t, kk) => {
      const n = tfOct(notes[kk % notes.length], o.oct || 0), v = (o.vol ? (typeof o.vol === 'function' ? o.vol(t) : o.vol) : 0.12) * (kk % 2 ? 0.8 : 1);
      if (v < 0.004) return;
      if (o.inst === 'bell') M.bell(t, n, v * 1.6, o.pan || 0); else M.piano(t, n, v, o.dur || 0.9, o.pan || 0, 0.3);
      lastT = t; last = n;
    };
    fire(t0, k);
    for (let t = t0; t < t1; t += dt) {
      const rt = typeof rate === 'function' ? rate(t) : rate; tau += rt * dt;
      const kk = (o.k0 || 0) + Math.floor(tau / step + 1e-9);
      if (kk > k) { k = kk; if (t - lastT >= minGap) fire(t, k); }
    }
    return { last, lastT };
  };
  // both clocks at once (head right, feet left); feet(t) their rate relative to the head's; sped(t) both sped up
  const clocks = (t0, t1, o = {}) => {
    const sp = o.sped || (() => 1), fr = o.feet || (() => 1);
    const h = voice(t0, t1, (t) => sp(t), Object.assign({}, o, { pan: 0.32 }));
    const f = voice(t0, t1, (t) => sp(t) * fr(t), Object.assign({}, o, { pan: -0.32 }));
    return { h, f };
  };
  // bells walking round a chord's tones from t0 to t1, step s (or s(t)), vol (or vol(t)), octaves oct
  const arp = (t0, t1, notes, s, vol, oct = [5, 6], seq = [0, 2, 1, 3, 2, 4, 1, 3], pan = (i) => Math.sin(i * 1.9) * 0.6) => {
    const pcs = notes.map((n) => n.replace(/-?\d$/, ''));
    for (let t = t0, i = 0; t < t1 - 0.05; i++) {
      const v = typeof vol === 'function' ? vol(t) : vol;
      if (v > 0.005) M.bell(t, pcs[seq[i % seq.length] % pcs.length] + oct[(i >> 2) % oct.length], v * (i % 4 === 0 ? 1 : 0.7), pan(i));
      t += typeof s === 'function' ? s(t) : s;
    }
  };

  // ---- 1 · the cold open, 5 mm above a black hole's edge: a low drone; your head's clock voice running, your feet's
  //      sounding once and hanging there (it would sound again in 110 seconds)
  {
    const t1 = TF.titleShot;
    M.strings(0, t1 + 0.2, ['E1', 'B1', 'E2'], 0.6, { att: 1.2, rel: 0.3, cut: 300, wave: 'sine', vib: 2 });
    M.strings(1.0, t1 + 0.1, ['F#3', 'G3'], 0.12, { att: 2.5, rel: 0.2, cut: 900, wave: 'triangle', vib: 4 });
    voice(cap('open', 0), t1 - 0.4, 1, { vol: (t) => 0.06 + 0.05 * ev(t, 0.4, 3), pan: 0.32, step: 0.3 });
    M.bell(cap('open', 1) + 0.05, 'E5', 0.3, -0.32);                                                    // "…your feet age just one day."
    M.strings(cap('open', 1) + 0.1, t1 + 0.05, ['E5'], 0.07, { att: 0.05, rel: 0.2, cut: 5000, wave: 'sine', vib: 0.5 });   // (it hangs)
    M.drum(cap('open', 2) - 0.05, 0.4, 41.2, 1.4);                                                       // "And it's happening to you…"
    M.rpiano(t1, 'E3', 0.3, 1.8, 0); M.rpiano(t1, 'B3', 0.22, 1.8, 0);
  }
  // ---- the title: the figure rung out in bells, both clocks together, ending on the E above
  {
    const T0 = TF.title[0];
    M.drum(T0, 0.7, 41.2, 1.4); M.piano(T0, 'E2', 0.4, 3.5, 0);
    M.strings(T0 - 0.1, TF.hall + 1.0, C.Em9, 0.5, { att: 0.5, rel: 1.0, cut: 1400, cutTo: 900 });
    TF_FIG.forEach((n, i) => M.bell(T0 + 0.15 + i * 0.22, n, i % 2 ? 0.2 : 0.34, i % 2 ? 0.25 : -0.25));
    M.bell(T0 + 0.15 + 8 * 0.22, 'E6', 0.42, 0);
  }

  // ---- 2 · your hallway, 7 a.m.: a quiet morning; the two clocks' voices start on their beep, together
  {
    M.prog([[TF.hall, C.Gadd9], [cap('hall', 1) - 0.2, C.Cmaj7], [cap('hall', 2) - 0.2, C.Em9], [TF.pole, C.Cmaj7]], TF.start + 0.3, 0.42, { cut: 1100 });
    M.piano(TF.hall + 0.2, 'G2', 0.22, 3, 0); M.piano(TF.hall + 1.4, 'D5', 0.1, 2, 0.2); M.piano(TF.hall + 2.6, 'B4', 0.1, 2, -0.2);
    M.piano(cap('hall', 1) + 0.1, 'C3', 0.22, 3, 0);
    ['B5', 'G5', 'E5'].forEach((n, i) => M.bell(cap('hall', 1) + 0.6 + i * 0.4, n, 0.12, -0.3 + 0.3 * i));   // "the most precise clocks"
    M.piano(cap('hall', 2) + 0.1, 'E2', 0.24, 3, 0);
    M.strings(cap('hall', 2) + 0.3, TF.pole + 0.5, ['B5'], 0.04, { att: 1.5, rel: 0.8, cut: 6000, wave: 'sine', vib: 1 });
    M.piano(TF.pole + 0.3, 'C3', 0.2, 3, 0);
    M.rpiano(TF.start, 'E4', 0.18, 1.4, 0);
    const t0 = TF.start, t1 = TF.year + 0.2;
    clocks(t0, t1, { vol: (t) => 0.11 * (1 - ev(t, TF.year - 0.6, TF.year + 0.2)) });
    M.prog([[t0, C.Em9], [TF.drift + 0.2, C.Cmaj7], [cap('drift', 2) - 0.2, C.G], [TF.yes, C.Em9], [cap('yes', 1) - 0.2, C.Cmaj7]], TF.year + 0.6, 0.44, { cut: 1200 });
    M.piano(t0, 'E2', 0.26, 3.5, 0); M.piano(TF.drift + 0.2, 'C2', 0.22, 3, 0); M.piano(cap('drift', 2), 'G1', 0.22, 3, 0);
    M.drum(cap('yes', 0), 0.45, 41.2, 1.6); M.piano(cap('yes', 0), 'E2', 0.3, 3, 0); M.bell(cap('yes', 0) + 0.1, 'E6', 0.24, 0);   // "So yes. It's true."
    M.bell(cap('yes', 1) + 0.2, 'G5', 0.14, -0.2); M.bell(cap('yes', 1) + 0.6, 'B5', 0.14, 0.2);
  }
  // ---- a year, sped up: the clocks' figure rushes (as fast as the picture), and stops; "6 billionths": one tiny bell.
  //      A lifetime: faster; "half a millionth". Since the Big Bang: 81 seconds, a low swell
  {
    const yg = TF.yearGo, ye = TF.yearEnd, sp = (t) => 1 + 26 * Math.sin(Math.PI * MathX.clamp((t - yg) / (ye - yg), 0, 1)) ** 2;
    M.strings(TF.year, ye + 0.3, C.Am9, 0.4, { att: 0.6, rel: 0.4, cut: 700, cutTo: 3000, cutAt: (yg + ye) / 2 });
    clocks(cap('year', 0) + 0.2, ye, { sped: sp, vol: (t) => 0.1 * (0.6 + 0.4 * ev(t, yg, yg + 1)), minGap: 0.05 });
    M.roll(yg, ye - 0.2, [[yg, 0.03], [(yg + ye) / 2, 0.25], [ye - 0.2, 0.05]]);
    M.strings(ye, TF.life + 0.4, ['E2', 'B2', 'F#3'], 0.36, { att: 0.3, rel: 0.4, cut: 600 });
    M.bell(cap('year', 1) + 0.15, 'B6', 0.16, 0.2);                                                     // "…6 billionths of a second."
    const l0 = TF.life + 0.3, l1 = TF.lifeEnd, sl = (t) => 1 + 60 * Math.sin(Math.PI * MathX.clamp((t - l0) / (l1 - l0), 0, 1)) ** 2;
    M.strings(TF.life, l1 + 0.3, C.Cmaj7, 0.4, { att: 0.4, rel: 0.4, cut: 800, cutTo: 3500 });
    clocks(l0, l1, { sped: sl, vol: 0.08, minGap: 0.05, oct: 1, inst: 'bell' });
    M.bell(tfW('life', 'half').start + 0.05, 'E7', 0.12, -0.2);                                          // "half a millionth"
    const bb = TF.bigBang;
    M.drum(bb + 0.1, 0.55, 41.2, 1.4); M.piano(bb + 0.1, 'G1', 0.32, 4, 0);
    M.strings(bb, TF.cat + 0.5, C.GBig, 0.5, { att: 1.2, rel: 0.8, cut: 900, cutTo: 2000 });
    M.bell(tfW('life', '81').start + 0.05, 'D6', 0.26, 0); M.bell(tfW('life', '81').start + 0.45, 'G6', 0.18, 0.3);
  }
  // ---- your cat: light, plucked; lying down: the figure falls; standing on your head: the figure upside down;
  //      upstairs: an octave up
  {
    M.prog([[TF.cat, C.Cmaj7], [cap('cat', 1) - 0.2, C.G]], TF.lie + 0.4, 0.36, { cut: 1300 });
    voice(TF.cat + 0.5, TF.lie - 0.3, 0.5, { vol: 0.09, oct: 1, dur: 0.35, pan: 0.15 });
    M.piano(cap('cat', 1) + 0.1, 'G2', 0.2, 3, 0);
    M.prog([[TF.lie, C.Am9], [cap('lie', 1) - 0.2, C.Em9]], TF.hand + 0.4, 0.4, { cut: 1100 });
    ['B5', 'G5', 'E5', 'B4', 'G4'].forEach((n, i) => M.piano(TF.poleDown + i * 0.22, n, 0.12, 1.2, 0.3 - 0.15 * i, 0.3));
    clocks(cap('lie', 1), TF.hand - 0.2, { vol: 0.085 });                                                 // "age at the same speed"
    M.prog([[TF.hand, C.Cmaj7s11], [cap('hand', 1) - 0.2, C.Am9]], TF.upstairs + 0.4, 0.4, { cut: 1100 });
    M.piano(TF.poleFlip, 'C2', 0.24, 3, 0);
    clocks(TF.poleFlipped, TF.upstairs - 0.2, { vol: 0.09, notes: TF_FIG_INV });
    M.prog([[TF.upstairs, C.G], [cap('upstairs', 1) - 0.2, C.D]], TF.measured + 0.4, 0.4, { cut: 1500 });
    clocks(TF.upstairs + 0.4, TF.measured - 0.2, { vol: 0.07, oct: 1, inst: 'bell' });
    M.piano(TF.upstairs + 0.2, 'G2', 0.22, 3, 0); M.piano(cap('upstairs', 1), 'D2', 0.22, 3, 0);
  }

  // ---- 3 · measured: a pulse that grows through the experiments; a hit on each year
  {
    const t0 = TF.measured, t1 = TF.gps;
    M.prog([[t0, C.Em9], [TF.pound, C.Cmaj7], [cap('pound', 1) - 0.2, C.Am9], [TF.planes, C.G], [cap('planes', 1) - 0.2, C.D], [TF.nist, C.Em9], [cap('nist', 1) - 0.2, C.GBig],
      [TF.skytree, C.Cmaj7], [cap('skytree', 1) - 0.2, C.D], [TF.jila, C.Em9], [cap('jila', 1) - 0.2, C.Bsus]], t1 + 0.6, 0.44, { cut: 900, cutTo: 1800 });
    tfPulse(ctx, M.bus, cap('measured', 1), t1 - 0.3, ['E2', 'B2'], 0.3, 0.32, { cut: 450, cutTo: 1300, acc: 4, decay: 0.3, ramp: (u) => 0.45 + 0.55 * Math.sin(Math.PI * Math.min(1, u * 1.15)) });
    for (const [id, n] of [['pound', 'C2'], ['planes', 'G1'], ['nist', 'E2'], ['skytree', 'C2'], ['jila', 'E2']]) { const t = cap(id, 0); M.drum(t, 0.5, 41.2, 1.4); M.piano(t, n, 0.3, 3, 0); }
    M.bell(tfW('nist', 'just').start, 'B5', 0.24, -0.2); M.bell(tfW('nist', 'exactly').start + 0.3, 'D6', 0.2, 0.2); M.bell(tfW('nist', 'einstein').start, 'G6', 0.22, 0);
    arp(cap('jila', 0) + 0.3, t1 - 0.3, ['E', 'F#', 'B', 'D', 'G'], 0.2, 0.06, [6, 7]);                 // inside a cloud of atoms
  }
  // ---- 4 · GPS: wonder, bells going round; "Einstein built in": the figure once, both clocks; the Moon: space
  {
    const t0 = TF.gps, tm = TF.moon;
    M.prog([[t0, C.GBig], [cap('gps', 1) - 0.2, C.Cmaj7], [TF.gps2, C.Em9], [cap('gps2', 1) - 0.2, C.Am9], [cap('gps2', 2) - 0.2, C.Bsus], [TF.gps3, C.Em9],
      [cap('gps3', 1) - 0.2, C.Cmaj7], [cap('gps3', 2) - 0.2, C.GBig]], tm + 0.6, 0.46, { cut: 1300, cutTo: 2200 });
    M.drum(t0 + 1.2, 0.45, 41.2, 1.6); M.piano(t0 + 1.2, 'G1', 0.3, 4, 0);
    arp(t0 + 1.5, TF.gps3 - 0.3, ['G', 'B', 'D', 'F#', 'A'], 0.42, (t) => 0.05 + 0.04 * ev(t, t0, TF.gps2), [5, 6], undefined, (i) => Math.sin(i * 0.7) * 0.7);
    M.drum(cap('gps2', 2), 0.5, 41.2, 1.4); M.bell(tfW('gps2', '38').start, 'F#6', 0.22, 0.2);         // "38 millionths"
    tfPulse(ctx, M.bus, TF.gps3, cap('gps3', 2) - 0.2, ['E3', 'B3'], 0.3, 0.2, { cut: 900, cutTo: 500, q: 2, acc: 4, decay: 0.25 });
    const te = cap('gps3', 2) + 0.2;
    M.drum(te, 0.5, 41.2, 1.6); M.piano(te, 'G2', 0.3, 4, 0);
    TF_FIG.forEach((n, i) => M.bell(te + 0.3 + i * 0.26, tfOct(n, 0), i % 2 ? 0.16 : 0.26, i % 2 ? 0.25 : -0.25)); M.bell(te + 0.3 + 8 * 0.26, 'G6', 0.3, 0);
    M.strings(tm, TF.why + 0.5, ['E2', 'B2', 'F#3', 'B3'], 0.4, { att: 1.5, rel: 0.6, cut: 600, vib: 2 });
    M.strings(tm + 0.5, TF.why + 0.4, ['F#6'], 0.04, { att: 2.0, rel: 0.6, cut: 8000, wave: 'sine', vib: 1 });
    [['B5', 0.6], ['F#5', 1.8], ['E6', 3.4], ['D6', 5.0], ['B5', 6.4]].forEach(([n, d]) => M.piano(tm + d, n, 0.1, 2.4, Math.sin(d) * 0.4, 0.6));
  }

  // ---- 5 · why: a hush; "that's what gravity is": a low E; the ball falls (a falling run); the maths builds over a
  //      pulse and lands on 9.8; "what holds you down": warm; "somewhere stronger": a rise out through the window
  {
    M.strings(TF.why, cap('why', 1) + 0.3, ['E3', 'B3', 'F#4'], 0.3, { att: 1.0, rel: 0.4, cut: 900 });
    M.piano(cap('why', 0) + 0.3, 'B4', 0.12, 2.5, 0.2); M.piano(cap('why', 0) + 1.3, 'G4', 0.12, 2.5, -0.2);
    M.drum(cap('why', 1), 0.55, 41.2, 1.4); M.piano(cap('why', 1), 'E1', 0.36, 4, 0); M.piano(cap('why', 1) + 0.02, 'E2', 0.24, 4, 0);
    M.prog([[cap('why', 1), C.Em9], [TF.fall, C.Cmaj7], [cap('fall', 1) - 0.2, C.Am9]], TF.maths + 0.4, 0.42, { cut: 1000 });
    ['B6', 'G6', 'E6', 'B5', 'G5', 'E5', 'B4'].forEach((n, i) => M.bell(TF.drop + 0.04 + i * 0.075, n, 0.12, 0.4 - 0.12 * i));   // the ball falls
    const tm = TF.maths, t98 = cap('maths', 2);
    M.prog([[tm, C.Am9], [cap('maths', 1) - 0.2, C.Bsus]], t98 + 0.3, 0.44, { cut: 800, cutTo: 2000 });
    tfPulse(ctx, M.bus, tm + 0.3, t98, ['E2', 'B2'], 0.3, 0.3, { cut: 400, cutTo: 1400, acc: 4, decay: 0.3, ramp: (u) => 0.4 + 0.6 * u });
    M.roll(cap('maths', 1) + 0.5, t98, [[cap('maths', 1) + 0.5, 0.03], [t98, 0.3]]);
    M.drum(t98, 0.8, 41.2, 1.2); M.piano(t98, 'E2', 0.4, 4, 0); M.piano(t98 + 0.02, 'B2', 0.26, 4, 0);  // 9.8
    M.strings(t98, TF.pull + 0.4, C.EmBig, 0.55, { att: 0.3, rel: 0.6, cut: 2000 });
    TF_FIG.slice(0, 4).forEach((n, i) => M.bell(tfW('maths', '98').start + 0.1 + i * 0.2, tfOct(n, 1), 0.2, -0.3 + 0.2 * i));
    M.prog([[TF.pull, C.G], [cap('pull', 1) - 0.2, C.Cmaj7], [cap('pull', 1) + 1.7, C.D], [TF.bigger, C.Em9], [cap('bigger', 1) - 0.2, C.Cmaj7], [cap('bigger', 2) - 0.2, C.Dsus]], TF.go + 0.4, 0.46, { cut: 1300 });
    M.piano(TF.pull + 0.1, 'G1', 0.3, 4, 0); M.piano(cap('pull', 1) + 0.1, 'C2', 0.26, 4, 0);
    clocks(TF.bigger + 0.3, cap('bigger', 2) - 0.2, { vol: 0.08 });                                        // "On Earth, the gap is tiny"
    const tg = TF.go, tw = TF.wd;
    M.roll(cap('bigger', 2), tg + 0.1, [[cap('bigger', 2), 0.03], [tg, 0.35]]);
    M.drum(tg, 0.7, 41.2, 1.2); M.piano(tg, 'D2', 0.34, 4, 0);
    M.strings(tg, tw + 0.5, ['D2', 'A2', 'E3', 'A3', 'D4'], 0.5, { att: 0.3, rel: 0.6, cut: 900, cutTo: 3000 });
    for (let t = tg + 0.3, i = 0; t < tw - 0.2; i++, t += 0.3) M.bell(t, ['D5', 'E5', 'F#5', 'A5', 'B5', 'D6', 'E6', 'F#6', 'A6', 'B6', 'D7'][Math.min(10, i)], 0.08 + 0.01 * i, Math.sin(i * 1.7) * 0.5);
  }

  // ---- 6 · Sirius B: size; landing; the weight (slow low hits); the clocks' figure again, together; the telescope
  {
    const t0 = TF.wd, tl = TF.wdLand;
    M.prog([[t0, C.Em9], [cap('wd', 0) - 0.2, C.Cmaj7], [cap('wd', 1) - 0.2, C.Am9]], tl + 0.3, 0.46, { cut: 1000, cutTo: 2200 });
    M.bell(cap('wd', 0) + 0.1, 'B5', 0.26, -0.2); M.bell(cap('wd', 0) + 0.5, 'E6', 0.2, 0.2);
    M.drum(cap('wd', 1), 0.55, 41.2, 1.4); M.piano(cap('wd', 1), 'A1', 0.32, 4, 0);
    M.drum(tl, 0.8, 41.2, 1.2); M.piano(tl, 'G1', 0.38, 4, 0);
    M.strings(tl, TF.wd2 + 0.4, C.GBig, 0.55, { att: 0.2, rel: 0.6, cut: 2400 });
    M.strings(tl + 0.2, TF.wd2 + 0.4, ['B6', 'D7'], 0.035, { att: 0.8, rel: 0.6, cut: 9000, wave: 'sine', vib: 1 });
    M.prog([[TF.wd2, C.Cmaj7], [cap('wd2', 1) - 0.2, C.Am9]], TF.wd3 + 0.4, 0.48, { cut: 900 });
    for (const t of [cap('wd2', 0) + 0.1, cap('wd2', 0) + 1.3, cap('wd2', 1) + 0.1, cap('wd2', 1) + 1.3]) { M.drum(t, 0.55, 36.7, 1.0, 1.4); M.piano(t, 'C1', 0.2, 2, 0); }
    M.prog([[TF.wd3, C.Em9], [cap('wd3', 1) - 0.2, C.Cmaj7]], TF.wd4 + 0.4, 0.42, { cut: 1100 });
    clocks(TF.wd3 + 0.3, TF.wd4, { vol: 0.1, sped: (t) => 1 + 3 * Math.sin(Math.PI * MathX.clamp((t - tfS('wd3') - 0.6) / (tfE('wd3') - 1 - tfS('wd3')), 0, 1)) ** 2 });
    M.bell(tfW('wd3', 'millionths').start, 'B6', 0.14, 0.2);
    M.prog([[TF.wd4, C.Am9], [cap('wd4', 1) - 0.2, C.Bsus]], TF.ns + 0.5, 0.44, { cut: 1000 });
    M.piano(TF.wd4 + 0.2, 'A1', 0.28, 4, 0); M.bell(cap('wd4', 1) + 0.2, 'F#6', 0.16, 0.3); M.bell(cap('wd4', 1) + 0.9, 'E6', 0.14, -0.3);
  }
  // ---- 7 · a neutron star: dark and heavy; the light bending round (a circling figure); landing; "under a
  //      millimetre": a flat pure tone; "59%": a rise; the sky: a shimmer that slides up ×1.235 as the starlight is
  //      squeezed; the clocks; "1 year 3 months pass on Earth": a third voice, Earth's, running 1.235× faster
  {
    const t0 = TF.ns, tl = TF.nsLand;
    M.strings(t0, tl + 0.3, ['E1', 'B1', 'E2', 'F#2'], 0.5, { att: 0.8, rel: 0.4, cut: 500, cutTo: 900 });
    M.drum(cap('ns', 0), 0.6, 36.7, 1.2); M.piano(cap('ns', 0), 'E1', 0.36, 4, 0); M.bell(cap('ns', 0) + 0.2, 'B5', 0.2, 0);
    M.piano(cap('ns', 1) + 0.1, 'C2', 0.26, 3, 0);
    M.prog([[TF.ns2, C.Cmaj7s11], [cap('ns2', 1) - 0.2, C.Em9]], tl + 0.3, 0.44, { cut: 1100, cutTo: 2000 });
    arp(TF.ns2 + 0.3, tl - 0.2, ['E', 'G', 'B', 'D', 'F#'], 0.18, 0.07, [5, 6], [0, 1, 2, 3, 4, 3, 2, 1], (i) => Math.sin(i * 0.55) * 0.8);   // round the edge
    M.drum(tl, 0.85, 36.7, 1.0, 1.3); M.piano(tl, 'E1', 0.4, 4, 0); M.piano(tl + 0.02, 'B1', 0.3, 4, 0);
    M.strings(tl, cap('ns3', 1) + 0.3, ['E1', 'B1', 'E2', 'G2'], 0.55, { att: 0.1, rel: 0.4, cut: 600 });
    M.strings(cap('ns3', 1), cap('ns3', 2) + 0.3, ['B4', 'E5'], 0.18, { att: 0.6, rel: 0.4, cut: 3000, wave: 'sine', vib: 0 });   // flat as glass
    M.prog([[cap('ns3', 2) - 0.1, C.Am9], [cap('ns3', 2) + 1.7, C.Bsus]], TF.ns4 + 0.4, 0.48, { cut: 700, cutTo: 2600 });
    M.roll(cap('ns3', 2) + 0.4, TF.ns4, [[cap('ns3', 2) + 0.4, 0.03], [TF.ns4, 0.3]]);
    const ts = TF.ns4, tb = cap('ns4', 1), gl = { glide: 365, glideFrom: tb - 0.3, glideAt: tb + 1.6 };
    M.drum(ts, 0.5, 41.2, 1.6); M.piano(ts, 'E2', 0.3, 4, 0);
    M.strings(ts, TF.ns5 + 0.4, ['E2', 'B2'], 0.4, Object.assign({ att: 0.8, rel: 0.6, cut: 600, cutTo: 900, cutAt: tb + 1.6 }, gl));
    for (const [n, v] of [['G4', 0.3], ['B4', 0.3], ['D5', 0.26], ['F#5', 0.22]]) M.strings(ts + 0.2, TF.ns5 + 0.4, [n], v, Object.assign({ att: 1.2, rel: 0.6, cut: 1500, cutTo: 5000, cutAt: tb + 1.6, wave: 'triangle', vib: 3 }, gl));
    arp(ts + 0.4, tb, ['E', 'G', 'B', 'D', 'F#'], 0.24, 0.07, [6, 7]);
    arp(tb + 1.0, TF.ns5, ['G', 'A#', 'D', 'F', 'A'], 0.24, 0.08, [6, 7]);                                 // (the same, a little over a minor third up)
    M.prog([[TF.ns5, C.Em9], [cap('ns5', 1) - 0.2, C.Cmaj7]], TF.bh + 0.5, 0.42, { cut: 1100 });
    const s5 = (t) => 1 + 3 * Math.sin(Math.PI * MathX.clamp((t - tfS('ns5') - 0.4) / (tfCap('ns5', 0).hide - 0.6 - tfS('ns5')), 0, 1)) ** 2;
    clocks(TF.ns5 + 0.3, cap('ns5', 1) - 0.1, { vol: 0.1, sped: s5 });
    const te = cap('ns5', 1);
    voice(te, TF.bh - 0.3, 1, { vol: 0.1, pan: -0.15 });                                                   // here
    voice(te, TF.bh - 0.3, TFP.ns.blue, { vol: 0.08, pan: 0.6, oct: 1, inst: 'bell' });                     // the Earth: 1.235× faster
  }

  // ---- 8 · Sagittarius A*. The drone; "4 million suns"; its photograph; the platform; light going round in circles;
  //      half the sky black; the universe shrinking to a circle (the high strings close to one note)
  {
    const t0 = TF.bh;
    M.strings(t0, TF.board + 0.4, ['E1', 'B1', 'E2'], 0.6, { att: 1.5, rel: 0.5, cut: 350, wave: 'sine', vib: 1 });
    M.strings(t0 + 1, TF.board + 0.3, ['C3', 'B3'], 0.14, { att: 2.5, rel: 0.5, cut: 900, wave: 'triangle', vib: 3 });
    M.drum(cap('bh', 0), 0.6, 36.7, 1.2); M.piano(cap('bh', 0), 'E1', 0.36, 4, 0);
    M.piano(cap('bh', 1) + 0.1, 'C2', 0.26, 4, 0);
    M.drum(cap('bh', 2), 0.85, 36.7, 1.0, 1.4); M.piano(cap('bh', 2), 'C1', 0.4, 4, 0); M.piano(cap('bh', 2) + 0.02, 'G1', 0.3, 4, 0);
    M.prog([[TF.bh2, C.Am9], [cap('bh2', 1) - 0.2, C.Em9]], TF.sphere + 0.4, 0.44, { cut: 900 });
    M.bell(cap('bh2', 0) + 0.3, 'E6', 0.24, 0); M.bell(cap('bh2', 0) + 0.7, 'B5', 0.16, -0.3);
    M.piano(TF.board + 0.1, 'E2', 0.26, 4, 0);
    const ts = TF.sphere;
    M.strings(ts, TF.lower + 0.4, C.Cmaj7s11, 0.46, { att: 1.0, rel: 0.5, cut: 1200 });
    arp(cap('sphere', 0), TF.lower - 0.2, ['C', 'E', 'F#', 'G', 'B'], 0.2, 0.08, [5, 6], [0, 1, 2, 3, 4, 3, 2, 1], (i) => Math.sin(i * 0.39) * 0.9);   // circling
    M.strings(cap('sphere', 1), TF.lower + 0.3, ['C1', 'G1'], 0.5, { att: 0.3, rel: 0.4, cut: 300, wave: 'sine' });          // half the sky black
    M.drum(cap('lower', 0), 0.65, 36.7, 1.2); M.piano(cap('lower', 0), 'E1', 0.36, 4, 0);
    M.strings(TF.lower, TF.ten + 0.4, ['E1', 'B1', 'E2'], 0.5, { att: 0.5, rel: 0.5, cut: 400, wave: 'sine' });
    const c1 = cap('lower', 1);
    for (const [n, dc] of [['F#5', 600], ['G5', 400], ['A5', 200], ['C6', -100], ['D6', -300]]) M.strings(c1 - 0.3, TF.ten + 0.2, [n], 0.04, { att: 1.0, rel: 0.5, cut: 7000, wave: 'sine', vib: 1, glide: dc, glideFrom: c1, glideAt: TF.ten - 0.4 });   // they close to one B
  }
  // ---- the two clocks above the edge. 10 m: the feet's voice starts to slip behind; the floor's glow (a held chord)
  //      sinks as its light is stretched, an octave down by "twice as fast", then out of hearing; 17 cm: one note in
  //      eleven; 5 mm: all but stopped; the sky in fast-forward (a racing shimmer); the edge: the feet's last note
  //      hangs; then from your feet: the head's voice racing
  {
    const t0 = TF.ten, tf = TF.freeze, tv = TF.feetView;
    const cl = clocks(t0 + 0.2, tf + 0.4, { feet: tfFeetRate, vol: (t) => 0.11 * (1 - 0.5 * ev(t, TF.edge, tf)) });
    M.prog([[t0, C.Em9], [cap('ten', 1) - 0.2, C.Cmaj7], [TF.red, C.Am9], [TF.two, C.Em9], [cap('two', 2) - 0.2, C.Cmaj7], [TF.slow, C.Am9], [TF.eleven, C.Em9],
      [TF.day, C.Cmaj7s11], [cap('day', 1) - 0.2, C.Em9]], TF.outside + 0.4, 0.4, { cut: 900 });
    M.drum(cap('ten', 1), 0.45, 41.2, 1.6);
    // the floor's glow: a chord that slides down by log2(ratio) octaves as the light climbing to your eyes stretches
    const g0 = TF.red - 0.4, g1 = cap('two', 2) + 2.0, oct = (t) => Math.log2(tfBhRatio(tfRho(t)));
    const ga = ctx.createGain(); ga.connect(M.bus); ga.gain.value = 0;
    for (const n of ['E4', 'G#4', 'B4', 'E5']) {
      const os = ctx.createOscillator(); os.type = 'triangle'; os.frequency.value = tfHz(n);
      for (let t = g0; t <= g1; t += 0.05) os.detune.setValueAtTime(-1200 * (oct(t) - oct(g0)), t);
      const og = ctx.createGain(); og.gain.value = 0.25; os.connect(og); og.connect(ga); os.start(g0); os.stop(g1 + 0.1);
    }
    ga.gain.setValueAtTime(0, g0); ga.gain.linearRampToValueAtTime(0.022, g0 + 1.0); ga.gain.setValueAtTime(0.022, cap('two', 2) - 0.5); ga.gain.linearRampToValueAtTime(0, g1);
    M.drum(cap('two', 1), 0.5, 41.2, 1.4); M.piano(cap('two', 1), 'E2', 0.3, 4, 0);
    M.drum(cap('eleven', 1), 0.6, 36.7, 1.2); M.piano(cap('eleven', 1), 'E1', 0.34, 4, 0);
    M.drum(cap('day', 1), 0.65, 36.7, 1.2); M.piano(cap('day', 1), 'C1', 0.36, 4, 0);
    // the sky in fast-forward: a racing high figure
    const to = TF.outside;
    M.strings(to, TF.edge + 0.4, C.EmBig, 0.45, { att: 0.6, rel: 0.6, cut: 1400, cutTo: 3000 });
    voice(to + 0.3, TF.edge, 1, { vol: (t) => 0.045 * ev(t, to, to + 1.5), oct: 2, inst: 'bell', step: 0.06, minGap: 0.055, pan: 0 });
    M.drum(cap('outside', 2), 0.8, 36.7, 1.0, 1.4); M.piano(cap('outside', 2), 'E1', 0.4, 4, 0); M.bell(tfW('outside', '17').start, 'B6', 0.24, 0);
    // the edge: everything thins; the feet's last note hangs, alone, until your feet's own view
    M.strings(TF.edge, tf + 0.6, ['E2', 'B2', 'F#3'], 0.4, { att: 0.4, rel: 0.6, cut: 700, cutTo: 300 });
    const hold = cl.f.last || 'B4', th = Math.max(cl.f.lastT, tf - 0.4);
    M.strings(th, tv + 0.5, [hold], 0.11, { att: 0.05, rel: 0.5, cut: 5000, wave: 'sine', vib: 0, pan: -0.32 });
    M.piano(cap('feel', 0) + 0.2, 'E3', 0.16, 3, -0.2); M.piano(cap('feel', 0) + 1.2, 'B3', 0.12, 3, 0.2);
    // your feet's view: their voice plays at its ordinary pace; the head's races (as fast as notes can go)
    M.strings(tv, TF.real + 0.4, ['E2', 'B2', 'G3', 'D4'], 0.36, { att: 0.5, rel: 0.6, cut: 1000 });
    voice(tv + 0.1, TF.real - 0.3, 1, { vol: 0.1, pan: -0.32 });
    voice(tv + 0.1, TF.real - 0.3, 1, { vol: (t) => 0.05 * ev(t, tv, tv + 1.2) * (1 - ev(t, TF.real - 1.2, TF.real - 0.3)), oct: 1, step: 0.05, minGap: 0.05, pan: 0.32, inst: 'bell' });
  }

  // ---- 9 · is any of this real? Warmth; "real physics": a bell; "you surviving the trip": light
  {
    const t0 = TF.real;
    M.drum(t0 + 0.4, 0.4, 41.2, 1.8); M.piano(t0 + 0.5, 'G2', 0.26, 4, 0); M.piano(t0 + 0.52, 'D3', 0.16, 4, 0.15);
    M.prog([[t0 + 0.3, C.Gadd9], [cap('real', 1) - 0.2, C.Cmaj7], [cap('real', 1) + 1.6, C.G], [TF.made, C.Am9], [cap('made', 0) + 1.7, C.D]], TF.home + 0.4, 0.46, { cut: 1300 });
    M.bell(cap('real', 1) + 0.2, 'G5', 0.18, -0.2); M.bell(cap('real', 1) + 0.6, 'D6', 0.16, 0.2);
    ['A4', 'B4', 'D5', 'F#5'].forEach((n, i) => M.piano(cap('made', 0) + 0.8 + i * 0.3, n, 0.1, 1.5, -0.3 + 0.2 * i, 0.4));
  }
  // ---- home: the two clocks together again; "0.000 000 000 000 09 seconds": a tiny bell
  {
    const t0 = TF.home, tq = TF.question;
    M.prog([[t0, C.Em9], [cap('home', 1) - 0.2, C.Cmaj7], [cap('home', 2) - 0.2, C.Am9]], tq + 0.4, 0.42, { cut: 1200 });
    M.piano(t0 + 0.3, 'E2', 0.26, 4, 0);
    clocks(t0 + 0.6, tq - 0.2, { vol: (t) => 0.1 * (1 - 0.4 * ev(t, cap('home', 2), cap('home', 2) + 1)) });
    M.bell(tfW('home', 'seconds').start + 0.1, 'B7', 0.1, 0.25);
  }
  // ---- the question: the figure once more, landing on its E
  {
    const tq = TF.question, END = TF.end;
    M.prog([[tq, C.G], [cap('question', 0) + 1.2, C.Cmaj7], [cap('question', 0) + 3.0, C.EmBig]], END + 1.4, 0.5, { cut: 1500, lastRel: 2.2 });
    M.piano(tq + 0.1, 'G1', 0.3, 4, 0);
    TF_FIG.forEach((n, i) => M.piano(cap('question', 0) + 0.2 + i * 0.3, n, i % 2 ? 0.09 : 0.13, 1.0, i % 2 ? 0.25 : -0.25, 0.3));
    const tl = cap('question', 0) + 0.2 + 8 * 0.3 + 0.4;
    M.bell(tl, 'E6', 0.38, 0); M.drum(tl, 0.45, 41.2, 1.6); M.piano(tl, 'E2', 0.34, 5, 0); M.piano(tl + 0.02, 'B2', 0.2, 5, 0.1);
    ['E6', 'G6', 'B6', 'E7'].forEach((n, i) => M.bell(tl + 0.6 + i * 0.25, n, 0.16, -0.45 + 0.3 * i));
  }
});

TF_SOUND_FNS.push(tfMusicKit, tfPulse, tfFeetRate, tfOct);
