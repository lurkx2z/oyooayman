/* =====================================================================
   SOUND · MUSIC — an original score in A, all synthesised (the music kit of the Friction 10s and Gravity tilts films,
   renamed gk*): string pads, a felt piano (also played backwards), bells, a low drum, a filtered synth pulse.
   This film's own ideas:
     the clock        the film runs at real speed and down turns 1° every second, so the score is at 60 bpm: a soft
                      piano note lands on every tick wherever there is one (the effects add the tick itself)
     the turn         every 90° a blow on the low drum and a new colour: A minor on the ground (0–90°), A lydian
                      floating up (90–180°), D minor upside down (180–270°), the high lydian at the top (270°), and
                      warm F and C coming back down (270–360°)
     the theme        A–E–D–C, falling, like something tipping: over the title, the circle, the girl and the question
     360°             A major, wide open, for exactly one second; on the next tick it tilts again (the score slides a
                      semitone down and thins), and the film ends on the question, cut on the last frame
   ===================================================================== */

// the kit: string pads (three detuned oscillators per note through low-passes), felt piano (also reversed), bells,
// a low drum and a heartbeat
function gkMusicKit(ctx, K) {
  if (K._music) return K._music;
  const fx = K.fx, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(); bus.connect(K.bus);
  const hall = fx.ir(4.4, { bright: 0.5, damp: 2.8, shape: 2.0, pre: 0.025, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.55;
  bus.connect(hall); hall.connect(wet); wet.connect(K.bus);
  const drumModes = (f) => [[f, 0.7, 1], [f * 1.51, 0.45, 0.5], [f * 1.99, 0.3, 0.35], [f * 2.44, 0.2, 0.2], [f * 3.1, 0.12, 0.12]];
  const M = {
    bus,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4, dest = bus) => {
      const b = fx.pianoBuf(gkMidi(n)), len = Math.min(b.length, Math.ceil((dur + fade + 0.05) * fx.sr));
      return fx.play(b.subarray(0, len), t, dest, { vol: vel * 0.34, pan, stop: t + dur + fade, fade });
    },
    // a piano note played backwards: it swells up out of nothing and stops dead on its attack at tEnd
    rpiano(tEnd, n, vel, dur = 1.6, pan = 0) {
      const key = 'rp' + n + '_' + dur;
      if (!fx.cache[key]) {
        const b = fx.pianoBuf(gkMidi(n)), L = Math.min(b.length, Math.ceil(dur * fx.sr)), y = new Float32Array(L + Math.ceil(0.01 * fx.sr));
        for (let i = 0; i < L; i++) { const u = i / L; y[L - 1 - i] = b[i] * Math.min(1, (1 - u) / 0.35); }
        for (let i = 0; i < 0.01 * fx.sr; i++) y[L + i] = y[L - 1] * (1 - i / (0.01 * fx.sr));
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], tEnd - dur, bus, { vol: vel * 0.34, pan });
    },
    bell: (t, n, vol, pan = 0, dest = bus) => fx.play(fx.bellBuf(gkMidi(n)), t, dest, { vol: vol * 0.25, pan }),
    bellCut: (t, n, vol, d = 0.18, pan = 0) => fx.play(fx.bellBuf(gkMidi(n)), t, bus, { vol: vol * 0.25, pan, stop: t + d, fade: 0.05 }),
    // a low drum (a timpani-like membrane): f the pitch, vol, soft = a wider mallet, dk = decay
    drum(t, vol, f = 36.7, soft = 1, dk = 1) {
      const key = 'drum' + f + '_' + soft + '_' + dk;
      if (!fx.cache[key]) {
        const y = fx.hit(drumModes(f).map(([a, tau, b]) => [a, tau * dk, b]), { width: 0.006 * soft, amp: 1, noise: 0.25, nlen: 0.02, nhp: 300, len: 3.2 * Math.max(dk, 0.3) });
        const pk = GKX.peak(y) || 1; for (let i = 0; i < y.length; i++) y[i] /= pk;
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
        const f = gkHz(nn);
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
function gkPulse(ctx, dest, t0, t1, notes, step, vol, o = {}) {
  if (t1 - t0 < step) return;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.q || 4;
  lp.frequency.setValueAtTime(o.cut || 600, t0); lp.frequency.linearRampToValueAtTime(o.cutTo || o.cut || 600, t1);
  lp.connect(g); g.connect(dest); g.gain.value = 0;
  notes.forEach((n, k) => {
    const os = ctx.createOscillator(); os.type = o.wave || 'sawtooth'; os.frequency.value = gkHz(n); os.detune.setValueAtTime(k % 2 ? 6 : -6, t0);
    if (o.glide) os.detune.linearRampToValueAtTime((k % 2 ? 6 : -6) + o.glide, t1);
    os.connect(lp); os.start(t0); os.stop(t1 + 0.1);
  });
  for (let t = t0, i = 0; t < t1 - 0.01; t += (o.stepAt ? o.stepAt(t) : step), i++) {
    const acc = o.acc && i % o.acc === 0 ? 1.0 : 0.62, ramp = o.ramp ? o.ramp((t - t0) / (t1 - t0)) : 1, v = vol * 0.05 * acc * ramp, st = o.stepAt ? o.stepAt(t) : step;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.setTargetAtTime(0, t + 0.012, st * (o.decay || 0.28));
  }
}


const GK_CH = {
  Am9: ['A1', 'E2', 'C3', 'G3', 'B3'], Am9hi: ['A2', 'E3', 'C4', 'G4', 'B4'], Fmaj7s11: ['F1', 'C2', 'A2', 'E3', 'B3'], Cmaj7: ['C2', 'G2', 'B2', 'E3', 'G3'],
  G69: ['G1', 'D2', 'A2', 'B2', 'E3'], Dm9: ['D2', 'A2', 'F3', 'C4', 'E4'], Esus: ['E1', 'B1', 'E2', 'A2', 'B2'], Esus7: ['E1', 'B1', 'D2', 'A2', 'B2'],
  float: ['A2', 'E3', 'B3', 'D#4', 'F#4'], floatHi: ['E4', 'B4', 'D#5', 'F#5', 'A5'], low: ['E1', 'B1', 'E2'],
  DmLow: ['D1', 'A1', 'D2'], DmHi: ['F4', 'A4', 'D5', 'E5'], Fmaj7: ['F1', 'C2', 'A2', 'E3', 'A3'], Bbmaj7s11: ['Bb1', 'F2', 'D3', 'A3', 'E4'],
  Abig: ['A1', 'E2', 'A2', 'C#3', 'E3', 'A3', 'C#4', 'E4', 'A4'],
};
const GK_THEME = ['A5', 'E6', 'D6', 'C6'];
const gkOct = (n, k) => n.replace(/-?\d$/, (d) => String(+d + k));

gkSound('music', 'score', function (ctx, bus, K) {
  const M = gkMusicKit(ctx, K), C = GK_CH, c = gkC, B = gkB, E = gkE, f = gkFilmAt, END = GK.end;
  const sh = (mode) => GK_SHOTS.find((s) => s.mode === mode);
  const tick = (k) => f(k);                                       // the film time of tick k (down reaches k°)
  // the theme on bells (o.oct: octave shift, o.gap: seconds between notes, o.vol)
  const theme = (t, o = {}) => GK_THEME.forEach((n, i) => M.bell(t + i * (o.gap || 0.62), gkOct(n, o.oct || 0), (o.vol || 0.5) * (i === 3 ? 0.8 : 1), [-0.3, 0.25, -0.1, 0.35][i]));
  // the piano on the ticks k0 … k1 (one note each, cycling through notes; o.vel, o.every: every n-th tick)
  const ost = (k0, k1, notes, vel, o = {}) => { for (let k = k0, i = 0; k <= k1; k++, i++) { if (o.every && (k - k0) % o.every) continue; const t = tick(k); if (t > END) break; M.piano(t, notes[i % notes.length], vel * (o.ramp ? o.ramp((k - k0) / Math.max(1, k1 - k0)) : 1), o.dur || 0.9, o.pan ?? (i % 2 ? 0.2 : -0.2)); } };
  // a blow on the low drum, with the chord's root under it
  const blow = (t, v = 1) => { M.drum(t, 0.9 * v, 36.7, 1.2, 1.3); M.drum(t + 0.015, 0.5 * v, 55, 1.4, 0.8); };

  // ================================================================== 0–90°: on the ground (A minor)
  M.strings(-0.4, 3.6, C.Am9, 0.55, { att: 1.2, rel: 1.0, cut: 900 });
  theme(0.35, { vol: 0.42 });
  M.prog([[3.2, C.Am9], [c('spire', 0), C.Fmaj7s11], [c('spire', 1), C.Esus7]], f(GK_SPIRE.hitS + 1.9) - 0.2, 0.62, { cut: 1300 });
  ost(1, 12, ['A4', 'A4', 'E5', 'A4'], 0.2, { ramp: (u) => 0.6 + 0.4 * u });
  ost(13, 17, ['B4'], 0.24);
  M.roll(f(GK_SPIRE.go) - 0.5, f(GK_SPIRE.hitS + 1.9), [[f(GK_SPIRE.go) - 0.5, 0.05], [f(GK_SPIRE.hitS + 1.9), 0.55]], 55);
  blow(f(GK_SPIRE.hitS + 1.9), 0.9);
  // your ears: the seasick sway
  M.strings(sh('ear').t0 + 0.3, sh('slide').t0 + 0.4, C.Esus, 0.6, { att: 1.5, cut: 1100, wob: [28, 0.21], vib: 4 });
  ost(21, 26, ['E5', 'B4'], 0.16, { every: 2 });
  // the first avalanche, holding on, the street: a pulse, the cars into the church
  gkPulse(ctx, M.bus, sh('slide').t0, f(41.4), ['A1', 'E2', 'A2'], 0.25, 1.1, { cut: 380, cutTo: 1600, acc: 4, ramp: (u) => 0.5 + 0.5 * u });
  M.prog([[sh('slide').t0, C.Am9], [sh('hold').t0, C.Fmaj7s11], [sh('street1').t0, C.G69], [c('east', 1), C.Esus7]], f(41.4) + 0.4, 0.66, { cut: 1500 });
  for (const s of [26.2, 28.3]) M.drum(f(s), 0.35, 49, 1.3, 0.6);
  blow(f(41.4), 1.0); blow(f(43.2), 0.7);
  // the climbing dome, you letting go: a heartbeat
  for (let t = sh('dome0').t0 + 0.3; t < sh('follow').t1 - 0.5; t += 1.0) M.beat(t, 0.32 + 0.12 * gkEv(t, 50, 55));
  M.prog([[sh('dome0').t0, C.Cmaj7], [c('dome', 1), C.G69], [sh('follow').t0, C.Am9]], sh('follow').t1 + 0.4, 0.5, { cut: 1100 });
  M.rpiano(f(53.4), 'E4', 0.5, 1.4); M.piano(f(53.4), 'A3', 0.4, 2.5);
  // the park as a slope, the empty pond: wide and strange; the piano on the ticks again
  M.prog([[sh('ski').t0, C.Fmaj7s11], [sh('pond').t0, C.Cmaj7], [c('pond', 0) + 2.5, C.Fmaj7]], sh('pond').t1 + 0.4, 0.55, { cut: 1600 });
  ost(58, 71, ['C5', 'G5'], 0.17);
  M.bell(c('ski', 0) + 0.2, 'E6', 0.25, 0.3); M.bell(c('pond', 0) + 0.3, 'C6', 0.22, -0.3);
  // your east wall becoming your floor: the chord tilts upward (a glide), the roll into 90°
  M.strings(sh('wall').t0, f(90) + 0.2, C.Am9, 0.62, { att: 2, cut: 900, cutTo: 2600, glide: 200, glideFrom: sh('wall').t0, glideAt: f(90) });
  ost(72, 89, ['A4', 'E5', 'B4', 'E5'], 0.17, { ramp: (u) => 0.7 + 0.5 * u });
  M.roll(f(85), f(90), [[f(85), 0.05], [f(90), 0.6]], 55);

  // ================================================================== 90–180°: falling up (A lydian)
  blow(f(90), 1.0);
  M.prog([[f(90), C.float], [f(96.6), C.low], [sh('up0').t0, C.float], [c('terminal', 2), C.floatHi]], sh('circle').t1 + 0.3, 0.6, { cut: 2000 });
  M.drum(f(96.6), 0.6, 41, 1.3, 1.0); M.drum(f(98.4), 0.35, 46, 1.3, 0.7);
  ost(104, 124, ['A4', 'E5', 'B5', 'F#5', 'D#5', 'B4'], 0.15);
  for (let k = 104; k <= 123; k++) M.piano(tick(k) + 0.5, ['E5', 'B5', 'F#6', 'B5'][k % 4], 0.08, 0.6, 0.35);
  theme(c('terminal', 2) + 0.6, { vol: 0.32, gap: 0.9 });
  // the rain going up, the tiles, the dome: a high shimmer
  M.prog([[sh('rainup').t0, C.floatHi], [sh('tiles').t0, C.float], [sh('climb').t0, C.Cmaj7]], sh('climb').t1 + 0.3, 0.45, { cut: 2600, wave: 'triangle' });
  for (const [t, n] of [[sh('rainup').t0 + 1, 'B6'], [sh('rainup').t0 + 3.4, 'F#6'], [sh('tiles').t0 + 1.5, 'E6'], [sh('climb').t0 + 1.2, 'A5'], [sh('climb').t0 + 4.6, 'E6']]) M.bell(t, n, 0.2, 0.2);
  // the balconies: low and held, gaps for the snaps; then the trees and the climb to 180°
  M.strings(sh('balcony').t0, sh('balcony').t1 + 0.4, C.Esus, 0.45, { cut: 800 });
  M.prog([[sh('trees').t0, C.Am9], [sh('ten').t0, C.Esus7]], f(180) + 0.2, 0.62, { cut: 1100, cutTo: 2200, cutAt: f(180) });
  ost(161, 179, ['E5', 'A4'], 0.16, { ramp: (u) => 0.6 + 0.6 * u });
  M.roll(f(175), f(180), [[f(175), 0.05], [f(180), 0.65]], 55);

  // ================================================================== 180–270°: upside down (D minor)
  blow(f(180), 1.1);
  M.strings(f(180), sh('again').t0 + 0.4, C.DmLow, 0.7, { cut: 500 });
  M.strings(f(180), sh('again').t0 + 0.4, C.DmHi, 0.32, { cut: 2200, wave: 'triangle' });
  for (let k = 182; k < 198; k += 4) M.piano(tick(k), ['D3', 'A2', 'F3', 'E3'][(k / 4) % 4 | 0], 0.3, 3.5, -0.1);
  // the furniture goes again: a pulse to the avalanche and the lamp
  gkPulse(ctx, M.bus, sh('again').t0, f(GK_ROOM.lamp.broken), ['D2', 'A2', 'D3'], 0.25, 1.0, { cut: 400, cutTo: 1800, acc: 4, ramp: (u) => 0.4 + 0.6 * u });
  M.prog([[sh('again').t0, C.Dm9], [f(200.5), C.Bbmaj7s11]], f(GK_ROOM.lamp.broken) + 0.3, 0.6, { cut: 1500 });
  blow(f(GK_ROOM.lamp.broken), 0.8);
  // the crack: almost nothing (a slow heartbeat)
  for (let t = sh('crack').t0 + 0.8; t < sh('crack').t1 - 0.3; t += 1.25) M.beat(t, 0.24);
  // up there: the car, the pigeons, the swings, the girl: a lullaby on the piano over F and C
  M.prog([[sh('sky0').t0, C.Fmaj7], [sh('birds').t0, C.Cmaj7], [sh('swings').t0, C.G69], [sh('kid').t0, C.Am9]], sh('kid').t1 + 0.3, 0.45, { cut: 1300 });
  { const mel = ['A4', 'C5', 'E5', 'D5', 'C5', 'B4', 'A4', 'G4', 'E4', 'G4', 'A4', 'C5', 'B4', 'A4'];
    for (let k = 220, i = 0; k < 256; k += 2, i++) M.piano(tick(k), mel[i % mel.length], 0.2, 1.6, 0.15); }
  theme(c('kid', 0) + 0.8, { vol: 0.3, oct: -1, gap: 0.8 });
  // everything still climbing: the chord glides up into 270°
  M.strings(sh('rising').t0, f(270) + 0.2, C.Fmaj7s11, 0.6, { att: 2, cut: 1000, cutTo: 3000, glide: 300, glideFrom: sh('rising').t0, glideAt: f(270) });
  M.roll(f(265.5), f(270), [[f(265.5), 0.05], [f(270), 0.55]], 55);

  // ================================================================== 270–360°: the top, and coming back down (F, C, A)
  blow(f(270), 1.0);
  M.prog([[f(270), C.floatHi], [sh('westwall').t0, C.Fmaj7]], sh('back').t0 + 0.4, 0.5, { cut: 2600, wave: 'triangle' });
  M.prog([[sh('back').t0, C.Fmaj7], [sh('home').t0, C.Cmaj7], [sh('down0').t0, C.Fmaj7s11], [sh('dome2').t0, C.Cmaj7]], sh('dome2').t1 + 0.4, 0.5, { cut: 1400 });
  { const down = ['A5', 'G5', 'E5', 'D5', 'C5', 'B4', 'A4', 'G4', 'E4', 'D4', 'C4', 'B3'];
    for (let k = 287, i = 0; k < 330; k += 3, i++) M.piano(tick(k), down[i % down.length], 0.17, 2.2, i % 2 ? 0.25 : -0.25); }
  theme(sh('dome2').t0 + 1.2, { vol: 0.26, gap: 1.0 });
  // the last 30 degrees: the clock in the piano again, the pulse, the heartbeat, the roll into 360°
  M.prog([[sh('thirty').t0, C.Am9], [sh('straight').t0, C.Fmaj7s11], [f(351), C.Esus7]], f(360) - 0.02, 0.6, { cut: 1100, cutTo: 2400, cutAt: f(360) });
  ost(330, 359, ['A4', 'E5'], 0.2, { ramp: (u) => 0.6 + 0.7 * u });
  gkPulse(ctx, M.bus, sh('straight').t0, f(360) - 0.02, ['A1', 'E2', 'A2'], 0.25, 1.0, { cut: 350, cutTo: 2000, acc: 4, ramp: (u) => 0.3 + 0.7 * u });
  for (let k = 351; k < 360; k++) M.beat(tick(k), 0.4 + 0.05 * (k - 351));
  M.roll(f(356), f(360) - 0.02, [[f(356), 0.1], [f(360) - 0.02, 0.7]], 55);
  // 360°: A major, wide open, for one second. On the next tick it tilts (slides a semitone down) and thins
  blow(f(360), 1.2);
  M.strings(f(360), f(361) + 0.25, C.Abig, 1.0, { att: 0.05, rel: 0.25, cut: 3200 });
  M.strings(f(361), END + 1, C.Am9, 0.5, { att: 0.3, cut: 1200, cutTo: 700, glide: -100, glideFrom: f(361), glideAt: f(363) });
  ost(361, 374, ['A4', 'A4', 'E5', 'A4'], 0.16);
  theme(c('question', 0) + 0.15, { vol: 0.42 });
});
