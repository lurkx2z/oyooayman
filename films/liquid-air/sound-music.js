/* =====================================================================
   SOUND · MUSIC — an original score, all synthesised (the music kit of the gravity films, renamed la*): string pads,
   a felt piano (also played backwards), bells, a low drum, a heartbeat, a filtered synth pulse.
   This film's own ideas:
     the first minute  real time: a soft piano note on every second of the clock, D minor, the rain building
     the street        a pulse that speeds up with the rain, the chord climbing a step each time the level does
     under             everything goes muffled and wide (the same chords, low-passed); your first breath on one note
     3:10              the score stops dead under the crash: only a low drone, then nothing; the sun comes out on a wide
                       A major chord and the theme on bells
     the bottom of     slow piano in D lydian (wonder), thinning to a cold minor and a heartbeat (the hard breathing)
     the sky
     4:00              a roll and a heartbeat on each of the last ten seconds; on 4:00 a blow and a rising shimmer as it
                       fizzes; cut on the question
   ===================================================================== */

// the kit: string pads (three detuned oscillators per note through low-passes), felt piano (also reversed), bells,
// a low drum and a heartbeat
function laMusicKit(ctx, K) {
  if (K._music) return K._music;
  const fx = K.fx, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(); bus.connect(K.bus);
  const hall = fx.ir(4.4, { bright: 0.5, damp: 2.8, shape: 2.0, pre: 0.025, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.55;
  bus.connect(hall); hall.connect(wet); wet.connect(K.bus);
  const drumModes = (f) => [[f, 0.7, 1], [f * 1.51, 0.45, 0.5], [f * 1.99, 0.3, 0.35], [f * 2.44, 0.2, 0.2], [f * 3.1, 0.12, 0.12]];
  const M = {
    bus,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4, dest = bus) => {
      const b = fx.pianoBuf(laMidi(n)), len = Math.min(b.length, Math.ceil((dur + fade + 0.05) * fx.sr));
      return fx.play(b.subarray(0, len), t, dest, { vol: vel * 0.34, pan, stop: t + dur + fade, fade });
    },
    // a piano note played backwards: it swells up out of nothing and stops dead on its attack at tEnd
    rpiano(tEnd, n, vel, dur = 1.6, pan = 0) {
      const key = 'rp' + n + '_' + dur;
      if (!fx.cache[key]) {
        const b = fx.pianoBuf(laMidi(n)), L = Math.min(b.length, Math.ceil(dur * fx.sr)), y = new Float32Array(L + Math.ceil(0.01 * fx.sr));
        for (let i = 0; i < L; i++) { const u = i / L; y[L - 1 - i] = b[i] * Math.min(1, (1 - u) / 0.35); }
        for (let i = 0; i < 0.01 * fx.sr; i++) y[L + i] = y[L - 1] * (1 - i / (0.01 * fx.sr));
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], tEnd - dur, bus, { vol: vel * 0.34, pan });
    },
    bell: (t, n, vol, pan = 0, dest = bus) => fx.play(fx.bellBuf(laMidi(n)), t, dest, { vol: vol * 0.25, pan }),
    bellCut: (t, n, vol, d = 0.18, pan = 0) => fx.play(fx.bellBuf(laMidi(n)), t, bus, { vol: vol * 0.25, pan, stop: t + d, fade: 0.05 }),
    // a low drum (a timpani-like membrane): f the pitch, vol, soft = a wider mallet, dk = decay
    drum(t, vol, f = 36.7, soft = 1, dk = 1) {
      const key = 'drum' + f + '_' + soft + '_' + dk;
      if (!fx.cache[key]) {
        const y = fx.hit(drumModes(f).map(([a, tau, b]) => [a, tau * dk, b]), { width: 0.006 * soft, amp: 1, noise: 0.25, nlen: 0.02, nhp: 300, len: 3.2 * Math.max(dk, 0.3) });
        const pk = LAX.peak(y) || 1; for (let i = 0; i < y.length; i++) y[i] /= pk;
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
        const f = laHz(nn);
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
function laPulse(ctx, dest, t0, t1, notes, step, vol, o = {}) {
  if (t1 - t0 < step) return;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.q || 4;
  lp.frequency.setValueAtTime(o.cut || 600, t0); lp.frequency.linearRampToValueAtTime(o.cutTo || o.cut || 600, t1);
  lp.connect(g); g.connect(dest); g.gain.value = 0;
  notes.forEach((n, k) => {
    const os = ctx.createOscillator(); os.type = o.wave || 'sawtooth'; os.frequency.value = laHz(n); os.detune.setValueAtTime(k % 2 ? 6 : -6, t0);
    if (o.glide) os.detune.linearRampToValueAtTime((k % 2 ? 6 : -6) + o.glide, t1);
    os.connect(lp); os.start(t0); os.stop(t1 + 0.1);
  });
  for (let t = t0, i = 0; t < t1 - 0.01; t += (o.stepAt ? o.stepAt(t) : step), i++) {
    const acc = o.acc && i % o.acc === 0 ? 1.0 : 0.62, ramp = o.ramp ? o.ramp((t - t0) / (t1 - t0)) : 1, v = vol * 0.05 * acc * ramp, st = o.stepAt ? o.stepAt(t) : step;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.setTargetAtTime(0, t + 0.012, st * (o.decay || 0.28));
  }
}



const LA_CH = {
  Dm9: ['D2', 'A2', 'F3', 'C4', 'E4'], Bbmaj7: ['Bb1', 'F2', 'D3', 'A3', 'C4'], Gm9: ['G1', 'D2', 'Bb2', 'F3', 'A3'], A7sus: ['A1', 'E2', 'D3', 'G3', 'B3'],
  Fmaj7: ['F1', 'C2', 'A2', 'E3', 'G3'], Csus: ['C2', 'G2', 'C3', 'F3', 'G3'], low: ['D1', 'A1', 'D2'], Ebmaj7: ['Eb2', 'Bb2', 'D3', 'G3'],
  Aadd9: ['A1', 'E2', 'A2', 'C#3', 'E3', 'B3', 'C#4', 'E4', 'A4'], Dlyd: ['D2', 'A2', 'E3', 'F#3', 'G#3', 'C#4'], Bm9: ['B1', 'F#2', 'D3', 'A3', 'C#4'],
  Gmaj9: ['G1', 'D2', 'B2', 'F#3', 'A3'], Em9: ['E2', 'B2', 'G3', 'D4', 'F#4'], Cm9: ['C2', 'G2', 'Eb3', 'Bb3', 'D4'], Dbig: ['D1', 'A1', 'D2', 'F#2', 'A2', 'D3', 'F#3', 'A3', 'E4'],
};
const LA_THEME = ['A5', 'E6', 'F#6', 'C#6'];
const laOct = (n, k) => n.replace(/-?\d$/, (d) => String(+d + k));

laSound('music', 'score', function (ctx, bus, K) {
  const M = laMusicKit(ctx, K), C = LA_CH, c = laC, B = laB, E = laE, f = laFilmAt, END = LA.end;
  const sh = (mode) => LA_SHOTS.find((s) => s.mode === mode);
  const under = laAt('under'), vac = laAt('vac');
  const theme = (t, o = {}) => LA_THEME.forEach((n, i) => M.bell(t + i * (o.gap || 0.62), laOct(n, o.oct || 0), (o.vol || 0.5) * (i === 3 ? 0.8 : 1), [-0.3, 0.25, -0.1, 0.35][i]));
  const blow = (t, v = 1) => { M.drum(t, 0.9 * v, 36.7, 1.2, 1.3); M.drum(t + 0.015, 0.5 * v, 55, 1.4, 0.8); };
  // a muffled copy of the bus for the shots under the surface (the chords low-passed): strings(…, { dest: muf })
  const muf = ctx.createBiquadFilter(); muf.type = 'lowpass'; muf.frequency.value = 900; muf.Q.value = 0.5; muf.connect(M.bus);

  // ================================================================== 3:00: your room, real time
  M.strings(-0.4, 3.8, C.Dm9, 0.5, { att: 1.0, rel: 1.0, cut: 1000 });
  theme(0.4, { vol: 0.4, oct: -1 });
  // a piano note on each second of the clock (the first minute runs at real speed)
  for (let k = 1; k < 58; k++) { const t = f(k); if (t > sh('ears').t0 - 0.2) break; M.piano(t, ['D4', 'A4', 'F4', 'A4'][k % 4], 0.13 + 0.09 * laEv(k, 1, 50), 0.8, k % 2 ? 0.2 : -0.2); }
  M.prog([[3.6, C.Dm9], [B('real'), C.Bbmaj7], [B('dark'), C.Gm9], [B('weight'), C.Dm9], [c('weight', 1), C.A7sus]], B('ears'), 0.55, { cut: 1200 });
  M.strings(B('floor'), B('go') + 0.4, C.low, 0.55, { att: 1.5, cut: 500, wob: [18, 0.2], vib: 3 });
  M.prog([[B('ears'), C.Gm9], [B('packet'), C.Ebmaj7]], B('go'), 0.5, { cut: 1100, wob: [22, 0.21], vib: 4 });
  blow(B('go', 0.1), 0.8);
  // ================================================================== the street: a pulse that speeds up with the rain
  laPulse(ctx, M.bus, B('go'), sh('chin').t0, ['D2', 'A2', 'D3'], 0.5, 1.0, { cut: 380, cutTo: 1800, acc: 4, stepAt: (t) => 0.5 - 0.25 * laEv(t, B('go'), sh('chin').t0), ramp: (u) => 0.45 + 0.55 * u });
  M.prog([[B('go'), C.Dm9], [B('street'), C.Bbmaj7], [B('cars'), C.Csus], [B('light'), C.Fmaj7], [B('rising'), C.Gm9], [B('ball'), C.A7sus]], sh('chin').t0 + 0.5, 0.6, { cut: 1500 });
  for (const m of ['cars', 'rising']) blow(sh(m).t0 + 0.05, 0.5);
  // the chin: everything holds its breath (one high note), then under: muffled, wide
  M.strings(sh('chin').t0, sh('breathe').t0 + 0.6, ['A4', 'E5'], 0.45, { att: 0.8, cut: 2400, vib: 2 });
  M.piano(sh('breathe').t0 + 0.2, 'A3', 0.45, 3.0); M.piano(sh('breathe').t0 + 0.2, 'D3', 0.35, 3.0);
  M.prog([[sh('breathe').t0, C.Dm9], [c('breathe', 1), C.Fmaj7], [B('first'), C.Bbmaj7], [c('first', 1), C.Fmaj7], [B('under'), C.Gm9], [B('sink'), C.Ebmaj7], [B('last'), C.A7sus]], LA.tCrash + 0.3, 0.6, { cut: 800, dest: muf });
  M.rpiano(c('first', 1), 'E5', 0.4, 1.4); M.piano(c('first', 1), 'A4', 0.35, 2.2); M.piano(c('first', 1) + 0.5, 'C#5', 0.3, 2.2);
  for (let t = B('last'); t < LA.tCrash; t += 0.75 - 0.35 * laEv(t, B('last'), LA.tCrash)) M.beat(t, 0.25 + 0.25 * laEv(t, B('last'), LA.tCrash));
  M.roll(LA.tCrash - 5, LA.tCrash, [[LA.tCrash - 5, 0.05], [LA.tCrash, 0.5]], 49);
  // ================================================================== 3:10: the crash (only a drone under the roar), the sun
  blow(LA.tCrash + 0.05, 1.0);
  M.strings(LA.tCrash, f(610.2), C.low, 0.5, { att: 0.5, rel: 0.3, cut: 220, vib: 0 });
  const tSun = c('sun', 0);
  M.strings(tSun - 0.6, sh('deep').t0 + 1.5, C.Aadd9, 0.75, { att: 1.8, rel: 2.0, cut: 3200 });
  theme(tSun + 0.8, { vol: 0.55 }); theme(c('sun', 1) + 0.2, { vol: 0.45, oct: -1, gap: 0.8 });
  // ================================================================== the bottom of the sky: wonder (D lydian), then cold
  const wonder = (t0, t1, notes, vel) => { for (let t = t0, i = 0; t < t1 - 0.5; t += 1.25, i++) M.piano(t, notes[i % notes.length], vel * (0.8 + 0.2 * Math.sin(i * 1.3)), 2.2, i % 2 ? 0.25 : -0.25); };
  M.prog([[sh('deep').t0, C.Dlyd], [B('flat'), C.Bm9], [B('snell'), C.Dlyd], [B('moon'), C.Gmaj9], [B('float'), C.Dlyd], [B('pond'), C.Em9], [B('birds'), C.Gmaj9]], B('bell'), 0.55, { cut: 2200 });
  wonder(sh('deep').t0 + 0.6, B('flat'), ['F#4', 'A4', 'G#4', 'E5'], 0.24);
  // your flat, in the vacuum: no sound but the score; very little of it (a high bell for the glass)
  M.bell(c('flat', 1), 'G#6', 0.18, 0.3); M.bell(c('flat', 2), 'D6', 0.2, -0.3);
  theme(c('snell', 0) + 0.3, { vol: 0.42, gap: 0.9 });
  wonder(sh('moon').t0 + 0.4, B('pond'), ['D5', 'E5', 'F#5', 'A5', 'G#5'], 0.2);
  wonder(sh('pond').t0 + 0.4, B('bell'), ['B4', 'D5', 'F#4', 'A4'], 0.18);
  // the bell in the vacuum: the score drops away to nothing; under: the bell (sfx), a low pad
  M.strings(sh('bell2').t0, B('top') + 0.3, C.low, 0.4, { att: 1.5, cut: 400 });
  M.prog([[B('top'), C.Cm9], [B('cold'), C.Gm9], [B('work'), C.Cm9]], B('back'), 0.5, { cut: 900 });
  for (let t = sh('work').t0 + 0.3; t < B('back'); t += 1.25) M.beat(t, 0.3);
  // ================================================================== 4:00: it turns back
  M.strings(B('back'), LA.tBack + 0.2, C.Dm9, 0.55, { att: 2.5, cut: 700, cutTo: 2600, cutAt: LA.tBack - 0.5, glide: 30 });
  for (let k = 3590; k < 3600; k++) M.beat(f(k), 0.35 + 0.035 * (k - 3590));
  M.roll(f(3594), LA.tBack, [[f(3594), 0.05], [LA.tBack, 0.65]], 55);
  blow(LA.tBack, 1.2);
  M.strings(LA.tBack, END + 0.5, C.Dbig, 0.8, { att: 0.4, rel: 0.1, cut: 1800, cutTo: 5200, cutAt: END });
  theme(LA.tBack + 0.6, { vol: 0.5, oct: 0, gap: 0.5 }); theme(LA.tBack + 1.4, { vol: 0.4, oct: 1, gap: 0.45 });
  void under; void vac;
});
