/* =====================================================================
   SOUND · MUSIC — an original score, all synthesised (the music kit of the gravity films): string pads, a felt piano
   (also played backwards), bells, a low drum, a heartbeat, a filtered synth pulse.
   This film's own ideas:
     Sunday      D major, light and curious: a piano figure over the time-lapse; a warm swell for the early sunset;
                 the score drops to a low drone for the first quake
     the week    a synth pulse that keeps getting faster (the days getting shorter), the chords sliding towards
                 B minor; it thins to almost nothing for the marble (you hear it roll)
     Friday      the pulse at its fastest under the strobing days; something lighter (bells) for the jumping
     Saturday    dread: a low drone and a heartbeat; the score stops dead for the sofa and the spire, then hits; for the
                 9-second sunset one chord swells for exactly those 9 seconds; the stars on a wide minor chord and slow
                 bells; the last sunrise and the question on the theme, cut on the last frame
     (sound-sfx.js adds a small chime at every sunrise we see: they come faster and faster)
   ===================================================================== */

// the kit: string pads (three detuned oscillators per note through low-passes), felt piano (also reversed), bells,
// a low drum and a heartbeat
function dsMusicKit(ctx, K) {
  if (K._music) return K._music;
  const fx = K.fx, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(); bus.connect(K.bus);
  const hall = fx.ir(4.4, { bright: 0.5, damp: 2.8, shape: 2.0, pre: 0.025, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.55;
  bus.connect(hall); hall.connect(wet); wet.connect(K.bus);
  const drumModes = (f) => [[f, 0.7, 1], [f * 1.51, 0.45, 0.5], [f * 1.99, 0.3, 0.35], [f * 2.44, 0.2, 0.2], [f * 3.1, 0.12, 0.12]];
  const M = {
    bus,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4, dest = bus) => {
      const b = fx.pianoBuf(dsMidi(n)), len = Math.min(b.length, Math.ceil((dur + fade + 0.05) * fx.sr));
      return fx.play(b.subarray(0, len), t, dest, { vol: vel * 0.34, pan, stop: t + dur + fade, fade });
    },
    // a piano note played backwards: it swells up out of nothing and stops dead on its attack at tEnd
    rpiano(tEnd, n, vel, dur = 1.6, pan = 0) {
      const key = 'rp' + n + '_' + dur;
      if (!fx.cache[key]) {
        const b = fx.pianoBuf(dsMidi(n)), L = Math.min(b.length, Math.ceil(dur * fx.sr)), y = new Float32Array(L + Math.ceil(0.01 * fx.sr));
        for (let i = 0; i < L; i++) { const u = i / L; y[L - 1 - i] = b[i] * Math.min(1, (1 - u) / 0.35); }
        for (let i = 0; i < 0.01 * fx.sr; i++) y[L + i] = y[L - 1] * (1 - i / (0.01 * fx.sr));
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], tEnd - dur, bus, { vol: vel * 0.34, pan });
    },
    bell: (t, n, vol, pan = 0, dest = bus) => fx.play(fx.bellBuf(dsMidi(n)), t, dest, { vol: vol * 0.25, pan }),
    bellCut: (t, n, vol, d = 0.18, pan = 0) => fx.play(fx.bellBuf(dsMidi(n)), t, bus, { vol: vol * 0.25, pan, stop: t + d, fade: 0.05 }),
    // a low drum (a timpani-like membrane): f the pitch, vol, soft = a wider mallet, dk = decay
    drum(t, vol, f = 36.7, soft = 1, dk = 1) {
      const key = 'drum' + f + '_' + soft + '_' + dk;
      if (!fx.cache[key]) {
        const y = fx.hit(drumModes(f).map(([a, tau, b]) => [a, tau * dk, b]), { width: 0.006 * soft, amp: 1, noise: 0.25, nlen: 0.02, nhp: 300, len: 3.2 * Math.max(dk, 0.3) });
        const pk = DSX.peak(y) || 1; for (let i = 0; i < y.length; i++) y[i] /= pk;
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
        const f = dsHz(nn);
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
function dsPulse(ctx, dest, t0, t1, notes, step, vol, o = {}) {
  if (t1 - t0 < step) return;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.q || 4;
  lp.frequency.setValueAtTime(o.cut || 600, t0); lp.frequency.linearRampToValueAtTime(o.cutTo || o.cut || 600, t1);
  lp.connect(g); g.connect(dest); g.gain.value = 0;
  notes.forEach((n, k) => {
    const os = ctx.createOscillator(); os.type = o.wave || 'sawtooth'; os.frequency.value = dsHz(n); os.detune.setValueAtTime(k % 2 ? 6 : -6, t0);
    if (o.glide) os.detune.linearRampToValueAtTime((k % 2 ? 6 : -6) + o.glide, t1);
    os.connect(lp); os.start(t0); os.stop(t1 + 0.1);
  });
  for (let t = t0, i = 0; t < t1 - 0.01; t += (o.stepAt ? o.stepAt(t) : step), i++) {
    const acc = o.acc && i % o.acc === 0 ? 1.0 : 0.62, ramp = o.ramp ? o.ramp((t - t0) / (t1 - t0)) : 1, v = vol * 0.05 * acc * ramp, st = o.stepAt ? o.stepAt(t) : step;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.setTargetAtTime(0, t + 0.012, st * (o.decay || 0.28));
  }
}



const DS_CH = {
  Dmaj9: ['D2', 'A2', 'F#3', 'C#4', 'E4'], Fsharp: ['F#1', 'C#2', 'A#2', 'E3', 'G#3'], Abmaj7: ['Ab1', 'Eb2', 'C3', 'G3', 'Bb3'], Fm9: ['F1', 'C2', 'Ab2', 'Eb3', 'G3'],
  Dm9: ['D2', 'A2', 'F3', 'C4', 'E4'], Bbmaj7: ['Bb1', 'F2', 'D3', 'A3', 'C4'], Gm9: ['G1', 'D2', 'Bb2', 'F3', 'A3'], A7sus: ['A1', 'E2', 'D3', 'G3', 'B3'],
  Fmaj7: ['F1', 'C2', 'A2', 'E3', 'G3'], Csus: ['C2', 'G2', 'C3', 'F3', 'G3'], low: ['D1', 'A1', 'D2'], Ebmaj7: ['Eb2', 'Bb2', 'D3', 'G3'],
  Aadd9: ['A1', 'E2', 'A2', 'C#3', 'E3', 'B3', 'C#4', 'E4', 'A4'], Dlyd: ['D2', 'A2', 'E3', 'F#3', 'G#3', 'C#4'], Bm9: ['B1', 'F#2', 'D3', 'A3', 'C#4'],
  Gmaj9: ['G1', 'D2', 'B2', 'F#3', 'A3'], Em9: ['E2', 'B2', 'G3', 'D4', 'F#4'], Cm9: ['C2', 'G2', 'Eb3', 'Bb3', 'D4'], Dbig: ['D1', 'A1', 'D2', 'F#2', 'A2', 'D3', 'F#3', 'A3', 'E4'],
};
const DS_THEME = ['A5', 'E6', 'F#6', 'C#6'];
const dsOct = (n, k) => n.replace(/-?\d$/, (d) => String(+d + k));

dsSound('music', 'score', function (ctx, bus, K) {
  const M = dsMusicKit(ctx, K), C = DS_CH, c = dsC, B = dsB, f = dsFilmAt, END = DS.end;
  const sh = (mode) => DS_SHOTS.find((s) => s.mode === mode);
  const theme = (t, o = {}) => DS_THEME.forEach((n, i) => M.bell(t + i * (o.gap || 0.62), dsOct(n, o.oct || 0), (o.vol || 0.5) * (i === 3 ? 0.8 : 1), [-0.3, 0.25, -0.1, 0.35][i]));
  const blow = (t, v = 1) => { M.drum(t, 0.9 * v, 36.7, 1.2, 1.3); M.drum(t + 0.015, 0.5 * v, 55, 1.4, 0.8); };
  const fig = (t0, t1, notes, step, vel) => { for (let t = t0, i = 0; t < t1 - 0.3; t += step, i++) M.piano(t, notes[i % notes.length], vel * (0.8 + 0.2 * Math.sin(i * 1.3)), step * 1.6, i % 2 ? 0.25 : -0.25); };

  // ================================================================== Sunday: light, curious (D major)
  M.strings(-0.4, B('dish') + 0.4, C.Dmaj9, 0.5, { att: 1.6, rel: 1.0, cut: 1400 });
  theme(0.5, { vol: 0.38, oct: -1, gap: 0.7 });
  fig(2.2, B('dish'), ['D4', 'A4', 'F#4', 'E5', 'A4', 'C#5'], 0.62, 0.2);
  M.prog([[B('dish'), C.Gmaj9], [sh('tv').t0, C.Em9], [B('sunset'), C.Gmaj9], [c('sunset', 1), C.A7sus]], B('quake') + 0.3, 0.55, { cut: 1700 });
  fig(B('sunset') + 0.3, B('quake'), ['B4', 'D5', 'F#5', 'A5'], 0.9, 0.18);
  // the first quake: everything drops to a drone, two hits
  M.strings(B('quake'), B('sunrise') + 0.4, C.low, 0.5, { att: 0.3, cut: 300, vib: 0 });
  blow(f(DS.sQuake) + 0.1, 0.9); blow(f(DS.sQuake + 4), 0.6);
  M.prog([[B('sunrise'), C.Bm9], [B('node'), C.Gmaj9], [c('node', 1), C.Em9], [c('node', 2), C.Fsharp]], B('midnight') + 0.3, 0.55, { cut: 1500 });
  theme(c('sunrise', 0) + 0.4, { vol: 0.32, gap: 0.8 });
  // ================================================================== the week: a pulse that keeps speeding up
  const p0 = B('midnight'), p1 = sh('marble').t0, p2 = sh('quake2').t0, p3 = END;
  const step = (t) => 0.62 - 0.36 * dsEv(t, p0, sh('sat').t0);
  dsPulse(ctx, M.bus, p0, p1 + 0.1, ['B1', 'F#2', 'B2'], 0.5, 0.8, { cut: 420, cutTo: 900, acc: 4, stepAt: step, ramp: (u) => 0.5 + 0.5 * u });
  M.prog([[p0, C.Bm9], [B('birds'), C.Gmaj9], [B('lamps'), C.Em9], [B('wed'), C.Bm9], [B('scale'), C.Gmaj9], [B('push'), C.Fsharp]], p1 + 0.3, 0.5, { cut: 1300 });
  // the marble: almost nothing (you hear it roll); a high note
  M.strings(p1, p2 + 0.2, ['F#4', 'B4'], 0.3, { att: 1.0, cut: 2000, vib: 2 });
  blow(f(dsAt(3, 20, 10, 2.2)), 0.8);
  dsPulse(ctx, M.bus, p2 + 1.5, sh('swings').t0, ['B1', 'F#2', 'B2', 'D3'], 0.4, 0.9, { cut: 500, cutTo: 1400, acc: 4, stepAt: step, ramp: (u) => 0.6 + 0.4 * u });
  M.prog([[p2, C.Em9], [B('pond'), C.Bm9], [B('car'), C.Gmaj9], [B('friday'), C.Bm9], [c('friday', 1), C.Fsharp]], sh('swings').t0 + 0.3, 0.55, { cut: 1500 });
  // ================================================================== Friday: lighter, odd (bells), the crooked glass
  M.prog([[B('swings'), C.Em9], [B('lighter'), C.Gmaj9], [B('jump'), C.Dmaj9], [B('glass'), C.Em9]], B('sat') + 0.3, 0.5, { cut: 1800 });
  for (let t = sh('jump').t0 + 0.2, i = 0; t < sh('jump').t1; t += 0.45, i++) M.bell(t, ['D6', 'F#6', 'A6', 'E6'][i % 4], 0.22, i % 2 ? 0.3 : -0.3);
  M.rpiano(sh('glass').t0 + 1.6, 'B5', 0.35, 1.5); M.piano(sh('glass').t0 + 1.6, 'E5', 0.3, 2.5);
  // ================================================================== Saturday: dread
  M.strings(B('sat'), sh('slide').t0 + 0.2, C.Cm9, 0.5, { att: 1.0, cut: 900, wob: [14, 0.2] });
  for (let t = sh('sat').t0 + 0.5; t < sh('slide').t0; t += 0.95) M.beat(t, 0.3);
  // the sofa: the score holds its breath, then a hit when it lands
  const so = DS_ROOM_SLIDE.find((x) => x.id === 'sofa'); blow(f(so.hit), 0.7);
  M.strings(f(so.hit), sh('spire').t0 + 0.2, C.low, 0.45, { att: 0.5, cut: 400 });
  // the spire: nothing while it leans; a blow and a dark swell as it lands
  const sLand = DS_SPIRE.sLand;
  blow(f(sLand), 1.1); M.strings(f(sLand), sh('lean').t0 + 0.4, C.Cm9, 0.6, { att: 0.15, rel: 0.6, cut: 1200, cutTo: 500 });
  M.prog([[B('lean'), C.Abmaj7], [B('cars'), C.Cm9], [B('equator'), C.Fm9]], B('sunset2') + 0.2, 0.55, { cut: 1100, wob: [10, 0.25] });
  for (let t = sh('lean').t0 + 0.2; t < B('sunset2'); t += 0.8) M.beat(t, 0.28 + 0.12 * dsEv(t, sh('lean').t0, B('sunset2')));
  M.strings(sh('equator').t0 + 1, B('sunset2'), ['C6'], 0.18, { att: 3, cut: 3000, vib: 1 });
  // the 9-second sunset: one chord swells for the 9 seconds the disc takes, then stops
  { const s0 = DS.sSunset2 - dsSunsetLen(DS.sSunset2) / 2, t0 = f(s0), t1 = f(DS.sSunset2 + dsSunsetLen(DS.sSunset2) / 2);
    M.strings(sh('sunset2').t0, t1 + 0.15, C.Abmaj7, 0.75, { att: Math.max(0.5, t1 - sh('sunset2').t0 - 0.3), rel: 0.15, cut: 900, cutTo: 3000, cutAt: t1 }); void t0; }
  // the stars: wide minor, slow bells
  M.strings(sh('stars').t0, sh('dawn').t0 + 0.6, C.Fm9, 0.55, { att: 1.2, cut: 1600 });
  for (let t = sh('stars').t0 + 0.4, i = 0; t < sh('dawn').t0; t += 1.4, i++) M.bell(t, ['C6', 'Ab5', 'Eb6', 'G5', 'F6'][i % 5], 0.2, i % 2 ? 0.35 : -0.35);
  // the last sunrise and the question: the theme, a big open chord rising to the cut
  M.strings(sh('dawn').t0, END + 0.5, C.Dbig, 0.75, { att: 2.5, rel: 0.1, cut: 1200, cutTo: 4200, cutAt: END });
  theme(sh('dawn').t0 + 1.2, { vol: 0.5, gap: 0.75 }); theme(sh('question').t0 + 0.6, { vol: 0.42, oct: 1, gap: 0.6 });
  M.roll(END - 4.5, END, [[END - 4.5, 0.03], [END, 0.4]], 55);
});
