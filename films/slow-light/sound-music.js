/* =====================================================================
   SOUND · MUSIC — an original score in E minor, all synthesised (the Shrinking film's kit, renamed sl*): string pads,
   a felt piano, bells, a low drum, a filtered synth pulse. Three ideas of this film's own:
     the theme   five bell notes, E–B–A–F#… G. Over the title it rings out fast and whole. Each time it comes back it
                 is slower, the way light is; in the freeze its notes are seconds apart, and the stop takes its last
                 note: the G never comes. It lands at the very end, when the lab lets the held light go
     the ping    every firework's FLASH gets a bell (the light); the bang is the real sound. So you hear the order
                 change: ping … boom, then ping and boom together, then boom … ping
     the mirror  the hall's piano phrases are answered by themselves two seconds later, as your reflection is
   The shape: a hushed cold open; the title; bright and fast round the Earth; warm at home, the call's piano echoing
   by Gran's delay; a digital pulse for the map, sliding out to sea; the evening darkening early; the fireworks
   left to the bangs and the pings; a held pulse in the street, "blue" high bells, a chord that slides down as car 1
   reddens, a tone that sinks out of hearing when it's gone; dread for the car you can only hear, a hit when it
   appears, two notes splitting apart, the theme in reverse for its past; play for the cat (silence for "And wait.");
   dream in the hall; almost nothing for the lamp; a heartbeat in the dark; one tender phrase for Mum's text; then the
   lab: warmth coming back, a steady pulse that slows with the light, a chord held still, and the release.
   ===================================================================== */

// the kit: string pads (three detuned oscillators per note through low-passes), felt piano (also reversed), bells,
// a low drum and a heartbeat
function slMusicKit(ctx, K) {
  if (K._music) return K._music;
  const fx = K.fx, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(); bus.connect(K.bus);
  const hall = fx.ir(3.6, { bright: 0.5, damp: 3.0, shape: 2.0, pre: 0.02, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.5;
  bus.connect(hall); hall.connect(wet); wet.connect(K.bus);
  const drumModes = (f) => [[f, 0.7, 1], [f * 1.51, 0.45, 0.5], [f * 1.99, 0.3, 0.35], [f * 2.44, 0.2, 0.2], [f * 3.1, 0.12, 0.12]];
  const M = {
    bus,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4, dest = bus) => {
      const b = fx.pianoBuf(slMidi(n)), len = Math.min(b.length, Math.ceil((dur + fade + 0.05) * fx.sr));
      return fx.play(b.subarray(0, len), t, dest, { vol: vel * 0.34, pan, stop: t + dur + fade, fade });
    },
    // a piano note played backwards: it swells up out of nothing and stops dead on its attack at tEnd
    rpiano(tEnd, n, vel, dur = 1.6, pan = 0) {
      const key = 'rp' + n + '_' + dur;
      if (!fx.cache[key]) {
        const b = fx.pianoBuf(slMidi(n)), L = Math.min(b.length, Math.ceil(dur * fx.sr)), y = new Float32Array(L + Math.ceil(0.01 * fx.sr));
        for (let i = 0; i < L; i++) { const u = i / L; y[L - 1 - i] = b[i] * Math.min(1, (1 - u) / 0.35); }
        for (let i = 0; i < 0.01 * fx.sr; i++) y[L + i] = y[L - 1] * (1 - i / (0.01 * fx.sr));
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], tEnd - dur, bus, { vol: vel * 0.34, pan });
    },
    bell: (t, n, vol, pan = 0, dest = bus) => fx.play(fx.bellBuf(slMidi(n)), t, dest, { vol: vol * 0.25, pan }),
    // a low drum (a timpani-like membrane): f the pitch, vol, soft = a wider mallet, dk = decay
    drum(t, vol, f = 49, soft = 1, dk = 1) {
      const key = 'drum' + f + '_' + soft + '_' + dk;
      if (!fx.cache[key]) {
        const y = fx.hit(drumModes(f).map(([a, tau, b]) => [a, tau * dk, b]), { width: 0.006 * soft, amp: 1, noise: 0.25, nlen: 0.02, nhp: 300, len: 3.2 * Math.max(dk, 0.3) });
        const pk = SLX.peak(y) || 1; for (let i = 0; i < y.length; i++) y[i] /= pk;
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], t, bus, { vol: vol * 0.5 });
    },
    // a heartbeat: lub-dub on a soft low drum
    beat(t, vol) { M.drum(t, vol, 47, 1.6, 0.45); M.drum(t + 0.17, vol * 0.62, 52, 1.6, 0.4); },
    // a timpani roll from t0 to t1, its level following keys [[t, v], …]
    roll(t0, t1, keys, f = 80) {
      for (let t = t0, i = 0; t < t1; t += 0.065 + 0.012 * Math.sin(i * 1.7), i++) {
        let v = keys[0][1];
        for (let k = 1; k < keys.length; k++) if (t >= keys[k - 1][0]) v = keys[k - 1][1] + (keys[k][1] - keys[k - 1][1]) * MathX.clamp((t - keys[k - 1][0]) / (keys[k][0] - keys[k - 1][0]), 0, 1);
        M.drum(t, v * (0.8 + 0.2 * Math.sin(i * 2.3)), f, 1.6, 0.35);
      }
    },
    // a held chord: o.att/rel (s), o.cut → o.cutTo by o.cutAt (Hz), o.keys [[t, level]], o.wave, o.vib (cents),
    // o.glide (cents, over the whole note: the chord slides), o.pan
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
        const f = slHz(nn);
        [-7, 1, 6].forEach((d, k) => {
          const osc = ctx.createOscillator(), og = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
          osc.type = o.wave || 'sawtooth'; osc.frequency.value = f;
          const d0 = d + r.range(-2, 2); osc.detune.setValueAtTime(d0, t0);
          if (o.glide) osc.detune.linearRampToValueAtTime(d0 + o.glide, o.glideAt || t1);
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
function slPulse(ctx, dest, t0, t1, notes, step, vol, o = {}) {
  if (t1 - t0 < step) return;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.q || 4;
  lp.frequency.setValueAtTime(o.cut || 600, t0); lp.frequency.linearRampToValueAtTime(o.cutTo || o.cut || 600, t1);
  lp.connect(g); g.connect(dest); g.gain.value = 0;
  notes.forEach((n, k) => {
    const os = ctx.createOscillator(); os.type = o.wave || 'sawtooth'; os.frequency.value = slHz(n); os.detune.setValueAtTime(k % 2 ? 6 : -6, t0);
    if (o.glide) os.detune.linearRampToValueAtTime((k % 2 ? 6 : -6) + o.glide, t1);
    os.connect(lp); os.start(t0); os.stop(t1 + 0.1);
  });
  for (let t = t0, i = 0; t < t1 - 0.01; t += step, i++) {
    const acc = o.acc && i % o.acc === 0 ? 1.0 : 0.62, ramp = o.ramp ? o.ramp((t - t0) / (t1 - t0)) : 1, v = vol * 0.05 * acc * ramp;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.setTargetAtTime(0, t + 0.012, step * (o.decay || 0.28));
  }
}

const SL_CH = {
  Em: ['E2', 'B2', 'G3', 'B3', 'E4'], Em9: ['E2', 'B2', 'G3', 'D4', 'F#4'], Cmaj7: ['C2', 'G2', 'E3', 'B3', 'E4'], C: ['C2', 'G2', 'E3', 'G3', 'C4'],
  G: ['G1', 'D2', 'B2', 'D3', 'G3'], Gmaj7: ['G1', 'D2', 'F#3', 'B3', 'D4'], D: ['D2', 'A2', 'F#3', 'A3', 'D4'], Dsus: ['D2', 'A2', 'E3', 'A3', 'D4'],
  Am: ['A1', 'E2', 'C3', 'E3', 'A3'], Am9: ['A1', 'E2', 'C3', 'G3', 'B3'], Bsus: ['B1', 'F#2', 'E3', 'F#3', 'B3'], B: ['B1', 'F#2', 'D#3', 'F#3', 'B3'],
  Esus: ['E2', 'B2', 'F#3', 'A3', 'B3'], Gbig: ['G1', 'D2', 'B2', 'D3', 'G3', 'B3', 'D4', 'G4'],
};
const SL_THEME = ['E5', 'B5', 'A5', 'F#5'], SL_THEME_END = 'G5';
const slOct = (n, k) => n.replace(/-?\d$/, (d) => String(+d + k));

slSound('music', 'score', function (ctx, bus, K) {
  const M = slMusicKit(ctx, K), r = new RNG(CONFIG.seed + 404), C = SL_CH;
  // the theme: its four notes from t, spaced dts (a number or a list), in bells or piano (o.oct shifts it)
  const theme = (t, dts, vol, o = {}) => {
    let tt = t;
    (o.notes || SL_THEME).forEach((n, i) => {
      const nn = slOct(n, o.oct || 0), pan = (o.pan || 0) + (i % 2 ? 0.22 : -0.22);
      if (o.piano) M.piano(tt, nn, vol * (i ? 0.88 : 1), o.dur || 2.4, pan); else M.bell(tt, nn, vol * (i ? 0.88 : 1), pan);
      tt += Array.isArray(dts) ? dts[Math.min(i, dts.length - 1)] : dts;
    });
    return tt;   // where the fifth note would go
  };
  // bells walking round the chord tones
  const arp = (t0, t1, steps, step, vol, oct = [5, 6], seq = [0, 1, 2, 1, 3, 2, 1, 2]) => {
    for (let t = t0, i = 0; t < t1 - 0.05; t += step, i++) {
      let ch = steps[0][1]; for (const [ts, c] of steps) if (t >= ts) ch = c;
      const pcs = ch.map((n) => n.replace(/-?\d$/, '')), pc = pcs[(seq[i % seq.length] + 1) % pcs.length];
      M.bell(t, pc + oct[(i >> 2) % oct.length], vol * (i % 4 === 0 ? 1 : 0.7), i % 2 ? 0.35 : -0.35);
    }
  };

  // ---- 1 · the cold open: a low hush, a thin high note, a slow figure of bells (the light crawling)
  M.strings(0, 7.0, ['E2', 'B2'], 0.5, { att: 2.0, rel: 0.6, cut: 380, wave: 'sine', vib: 2 });
  M.strings(0.5, 7.0, ['B5'], 0.05, { att: 2.5, rel: 0.5, cut: 6000, wave: 'sine', vib: 3 });
  for (const [t, n] of [[1.6, 'E6'], [2.8, 'B5'], [4.0, 'G5'], [5.2, 'F#5']]) M.bell(t, n, 0.22, t > 3 ? 0.25 : -0.25);

  // ---- the title: the theme, fast and whole (light is fast), then once more up high
  const T0 = slS('title');
  M.drum(T0, 0.75, 41, 1.4); M.piano(T0, 'E2', 0.42, 3.5, 0);
  M.strings(T0 - 0.1, SL.fast + 0.3, C.Em, 0.7, { att: 0.4, rel: 0.6, cut: 1400 });
  M.bell(theme(T0 + 0.05, 0.2, 0.45), SL_THEME_END, 0.55, 0);
  M.bell(theme(T0 + 1.9, 0.16, 0.26, { oct: 1 }), slOct(SL_THEME_END, 1), 0.32, 0);
  M.piano(T0 + 2.2, 'B3', 0.25, 2.5, 0.2);

  // ---- light laps the Earth: wide and bright; bells running fast; seven quick bells for "seven times round"
  const glob = [[SL.fast, C.Cmaj7], [SL.fast + 2.7, C.G], [SL.fast + 5.4, C.D]];
  M.prog(glob, SL.rule + 0.3, 0.7, { cut: 1600, cutTo: 3000 });
  arp(SL.fast + 0.3, SL.rule - 0.3, glob, 0.11, 0.11, [5, 6]);
  M.drum(SL.fast, 0.5, 36, 2); M.piano(SL.fast, 'C2', 0.32, 3, 0); M.piano(SL.fast + 5.4, 'D2', 0.3, 3, 0);
  ['E5', 'G5', 'B5', 'D6', 'E6', 'F#6', 'G6'].forEach((n, i) => M.bell(slCap('fast', 1).show + 0.1 + i * 0.13, n, 0.32, -0.6 + i * 0.2));

  // ---- the rule: home, early evening. Warm broken chords that start to slow ("it starts slowing down"): the pad
  //      sags a little, a reversed swell into the moment, a soft drum on it
  {
    const t0 = SL.rule + 0.2, t1 = SL.call - 0.1, ch1 = ['E3', 'B3', 'D4', 'G4', 'F#4', 'D4'], ch2 = ['C3', 'G3', 'B3', 'E4', 'D4', 'B3'];
    for (let t = t0, i = 0; t < t1; i++) { const ch = t < slCap('rule', 1).show - 0.2 ? ch1 : ch2; M.piano(t, ch[i % 6], 0.17 * (i % 6 === 0 ? 1.2 : 1), 1.6, i % 2 ? 0.2 : -0.2); t += 0.42 + 0.38 * slEv(t, SL.slow0 - 0.3, SL.slow0 + 4.5); }
    M.strings(SL.rule, slCap('rule', 1).show + 0.3, C.Em9, 0.45, { att: 0.8, rel: 0.6, cut: 1100, glide: -35, glideAt: SL.slow0 + 2.5 });
    M.strings(slCap('rule', 1).show - 0.2, SL.call + 0.4, C.Cmaj7, 0.42, { att: 0.8, rel: 0.6, cut: 1000 });
    M.rpiano(SL.slow0, 'E3', 0.32, 1.7, 0); M.drum(SL.slow0, 0.42, 36, 2);
    M.bell(slCap('rule', 1).show + 0.1, 'B5', 0.2, 0.2);
  }

  // ---- the call: a light piano figure, and its echo arriving Gran's delay later (from her side); a silence while
  //      you wait for her laugh; a little sting when it comes
  {
    const prog = [[SL.call, C.G], [SL.call + 2.4, C.D], [SL.call + 4.8, C.Em], [SL.call + 7.2, C.C]];
    const steps = []; for (let k = 0; k < 7; k++) steps.push([SL.call + k * 2.4, prog[k % 4][1]]);
    M.prog(steps, SL.joke + 0.4, 0.34, { cut: 1000 });
    const fig = [['G4', 'B4', 'D5', 'B4'], ['F#4', 'A4', 'D5', 'A4'], ['E4', 'G4', 'B4', 'G4'], ['E4', 'G4', 'C5', 'G4']];
    for (let t = SL.call + 0.55, i = 0; t < SL.joke - 0.4; t += 0.6, i++) {
      const n = fig[Math.floor(((t - SL.call) / 2.4)) % 4][i % 4], D = slGranDelay(slC(t));
      M.piano(t, n, 0.16, 1.1, -0.3);
      if (t + D < SL.joke + 1) M.piano(t + D, n, 0.07, 1.1, 0.5);
    }
    M.bell(slCap('lag', 0).show + 0.1, 'D6', 0.2, 0.4); M.bell(slCap('lag', 1).show + 0.1, 'B5', 0.2, 0.4); M.bell(slCap('lag', 2).show + 0.1, 'G5', 0.22, 0.4);
    M.strings(SL.joke + 0.3, SL.jokeLaugh + 0.3, ['A5'], 0.05, { att: 1.0, rel: 0.2, cut: 6000, wave: 'sine', vib: 3 });
    M.strings(SL.joke + 0.3, SL.jokeLaugh + 0.3, ['E2', 'B2'], 0.3, { att: 1.5, rel: 0.2, cut: 400, wave: 'sine' });
    ['G5', 'B5', 'D6'].forEach((n, i) => M.bell(SL.jokeLaugh + i * 0.09, n, 0.3, -0.3 + i * 0.3)); M.piano(SL.jokeLaugh, 'G3', 0.25, 1.2, 0);
  }

  // ---- the map: a digital pulse; it slides away as the dot runs out to sea; a wrong note, then the right one
  M.strings(SL.map, SL.mapSea + 0.4, C.Am, 0.38, { att: 0.6, rel: 0.5, cut: 1200 });
  slPulse(ctx, M.bus, slS('map') - 0.1, SL.mapSea, ['E4', 'B4'], 0.15, 0.32, { wave: 'square', cut: 2200, q: 1, decay: 0.18, acc: 4 });
  slPulse(ctx, M.bus, SL.mapSea, SL.sun - 0.4, ['E4', 'B4'], 0.15, 0.28, { wave: 'square', cut: 2200, cutTo: 700, q: 1, decay: 0.18, acc: 4, glide: -900, ramp: (u) => 1 - 0.8 * u });
  M.strings(SL.mapSea - 0.1, SL.sun + 0.3, C.Em, 0.38, { att: 0.5, rel: 0.6, cut: 1100, glide: -150 });
  M.piano(slCap('map', 2).show + 0.1, 'E2', 0.3, 2.5, 0); M.bell(slCap('map', 2).show + 0.15, 'D#6', 0.22, 0.3); M.bell(slCap('map', 2).show + 0.75, 'E6', 0.22, 0.3);

  // ---- night comes early: the pad darkens as it goes (the filters close), a low line underneath
  M.prog([[SL.sun, C.Am9], [slCap('sun', 1).show, C.Cmaj7], [slCap('sun', 2).show, C.Bsus]], SL.fw + 0.4, 0.55, { cut: 1400, cutTo: 450 });
  [['E3', 0.5], ['D3', 3.4], ['C3', 5.7], ['B2', 7.15]].forEach(([n, dt]) => M.strings(SL.sun + dt, SL.sun + dt + 2.6, [n], 0.32, { att: 0.5, rel: 0.6, cut: 900, wave: 'triangle', vib: 4 }));
  M.piano(SL.sun + 0.5, 'A3', 0.18, 2.4, -0.2); M.piano(slCap('sun', 1).show + 0.2, 'G3', 0.16, 2.4, 0.2);

  // ---- fireworks: a suspended pad; the bangs are the sound; each FLASH gets its own bell (the light)
  M.strings(SL.fw, SL.fb4 + 0.3, ['E2', 'B2', 'F#3'], 0.32, { att: 1.2, rel: 0.4, cut: 700, wave: 'triangle', keys: [[SL.fw + 1.2, 1], [SL.f1 + 0.4, 0.55], [SL.b3, 0.7]] });
  M.bell(slS('fireworks') + 0.05, 'B5', 0.18, 0);
  const ping = (t, notes, vol) => { notes.forEach((n, i) => M.bell(t + i * 0.012, n, vol, -0.2 + 0.2 * i)); M.strings(t, t + 1.8, [notes[notes.length - 1]], 0.07, { att: 0.01, rel: 1.5, cut: 7000, wave: 'sine', vib: 2 }); };
  ping(SL.f1, ['B5'], 0.36); ping(SL.f2, ['D6'], 0.34); ping(SL.f3, ['E6'], 0.34);
  ping(SL.fb4, ['G5', 'B5', 'E6'], 0.34);
  M.strings(SL.fb4, SL.b5 + 0.2, C.G, 0.42, { att: 0.3, rel: 0.6, cut: 1200 });
  // now you hear it first: a reversed swell that grows out of the bang and stops on the light
  M.rpiano(SL.f5, 'B4', 0.42, SL.f5 - SL.b5 - 0.05, 0); M.rpiano(SL.f5, 'E4', 0.3, SL.f5 - SL.b5 - 0.05, 0);
  ping(SL.f5, ['F#6'], 0.34);
  // light is slower than sound: the big one is heard, and there is a long wait to see it
  M.strings(slS('slower') - 0.3, SL.f6 + 0.05, ['E2', 'B2', 'F3', 'B3'], 0.6, { att: 1.5, rel: 0.05, cut: 400, cutTo: 2200, cutAt: SL.f6 });
  M.roll(SL.b6 + 0.2, SL.f6, [[SL.b6 + 0.2, 0.08], [SL.f6, 0.45]], 82);
  ping(SL.f6, ['E6', 'B6'], 0.4); M.drum(SL.f6, 0.8, 41); M.drum(SL.f6, 0.35, 82);
  M.strings(SL.f6, SL.street + 0.2, ['E2', 'B2', 'E3', 'G3', 'B3', 'E4', 'B4'], 0.65, { att: 0.05, rel: 1.4, cut: 2600, cutTo: 900 });

  // ---- the street, car 1: a held pulse; "blue": high bells as it comes; as it passes, a chord slides down (its
  //      light reddens); "infrared, gone": a low tone sinks out of hearing
  slPulse(ctx, M.bus, SL.street + 0.15, SL.faster - 0.1, ['E2'], 0.5, 0.55, { cut: 420, decay: 0.4, acc: 2 });
  M.strings(SL.street, SL.car1Pass + 0.2, ['E2', 'B2', 'G3'], 0.36, { att: 1.0, rel: 0.4, cut: 600 });
  for (let t = slS('blue') + 0.1, i = 0; t < SL.car1Pass - 0.4; t += 0.25, i++) M.bell(t, ['E6', 'G#6', 'B6', 'G#6'][i % 4], 0.11 * (0.6 + 0.4 * slEv(t, slS('blue'), SL.car1Pass - 1)), 0.3 * Math.sin(i));
  M.strings(SL.car1Pass - 0.4, slCap('red', 1).show + 0.3, ['E4', 'B4', 'E5'], 0.4, { att: 0.3, rel: 0.6, cut: 2400, cutTo: 700, glide: -500, wave: 'triangle' });
  M.piano(SL.car1Pass - 0.3, 'B1', 0.32, 3, 0);
  { const t0 = slCap('red', 1).show, d = 3.2; slTone(K, t0, d, (t) => slHz('E2') * Math.pow(0.5, t / d * 1.3), [[1, 1], [2, 0.3]], (u) => Math.min(1, u / 0.1) * Math.pow(1 - u, 1.6), { vol: 0.09 }); }

  // ---- car 2: you can only hear it. A quickening pulse, a heartbeat, a roll; a hit when it appears; two notes
  //      pulling apart as it splits; for its past, the theme played backwards
  slPulse(ctx, M.bus, SL.faster + 0.1, SL.car2Seen, ['E2', 'B2'], 0.25, 0.55, { cut: 500, cutTo: 1400, acc: 4, ramp: (u) => 0.5 + 0.5 * u });
  M.strings(slS('cantsee') - 0.2, SL.car2Seen + 0.05, ['E2', 'F2', 'B2'], 0.6, { att: 1.5, rel: 0.05, cut: 300, cutTo: 1200, cutAt: SL.car2Seen });
  for (let t = slS('cantsee'), dt = 0.95; t < SL.car2Seen - 0.3; t += dt, dt = Math.max(0.55, dt * 0.95)) M.beat(t, 0.28 + 0.25 * slEv(t, slS('cantsee'), SL.car2Seen));
  M.roll(slS('two'), SL.car2Seen, [[slS('two'), 0.08], [SL.car2Seen, 0.6]], 82);
  M.drum(SL.car2Seen, 0.85, 41); M.drum(SL.car2Seen, 0.45, 82);
  ['E6', 'F#6', 'B6'].forEach((n, i) => M.bell(SL.car2Seen + i * 0.02, n, 0.3, -0.4 + 0.4 * i));
  M.strings(SL.car2Seen, slCap('two', 1).show + 0.3, ['B3', 'E4', 'F#4', 'B4'], 0.55, { att: 0.03, rel: 0.5, cut: 3000, cutTo: 1200 });
  M.strings(slCap('two', 1).show, slS('past') + 0.2, ['B4'], 0.42, { att: 0.2, rel: 0.8, cut: 3000, wave: 'triangle', glide: 700, pan: 0.4 });
  M.strings(slCap('two', 1).show, slS('past') + 0.2, ['B4'], 0.42, { att: 0.2, rel: 0.8, cut: 3000, wave: 'triangle', glide: -700, pan: -0.4 });
  M.strings(slS('past') - 0.1, SL.cat + 0.1, ['E2', 'B2', 'E3'], 0.42, { att: 0.6, rel: 1.2, cut: 700 });
  { const t0 = slCap('past', 1).show + 0.2, rev = [...SL_THEME].reverse(); rev.forEach((n, i) => M.rpiano(t0 + 0.75 + i * 0.75, slOct(n, -1), 0.3, 0.75, i % 2 ? 0.3 : -0.3)); }

  // ---- the cat: play. Plucked notes; silence for "And wait."; a run of bells as she goes; a cheeky cadence
  {
    const pl = ['E4', 'G4', 'B4', 'C#5', 'B4', 'G4', 'A4', 'F#4'];
    for (let t = SL.cat + 0.6, i = 0; t < slCap('laser', 1).show - 0.2; t += 0.3, i++) M.piano(t, pl[i % 8], 0.15 * (i % 4 === 0 ? 1.25 : 1), 0.22, i % 2 ? 0.25 : -0.25, 0.12);
    M.strings(SL.cat, slCap('laser', 1).show, C.Em, 0.3, { att: 0.5, rel: 0.1, cut: 1100 });
    for (let i = 0; i < 10; i++) M.bell(SL.catGo + i * 0.055, ['E5', 'G5', 'B5', 'C#6', 'E6', 'G6', 'B6', 'C#7', 'E7', 'G7'][i], 0.22, -0.5 + i * 0.11);
    M.strings(slS('dot') - 0.4, SL.beat + 0.4, C.G, 0.32, { att: 0.6, rel: 0.4, cut: 1200 });
    for (let t = slS('dot') - 0.2, i = 0; t < SL.beat; t += 0.3, i++) M.piano(t, ['G4', 'B4', 'D5', 'B4', 'A4', 'C5', 'E5', 'C5'][i % 8], 0.13, 0.22, i % 2 ? 0.25 : -0.25, 0.12);
    const tb = slS('beat') + 0.05;
    M.piano(tb, 'G2', 0.32, 2.5, 0); M.piano(tb, 'D4', 0.22, 2.5, -0.2); M.piano(tb, 'B4', 0.22, 2.5, 0.2);
    M.bell(tb + 0.1, 'G5', 0.3, -0.2); M.bell(tb + 0.25, 'D6', 0.3, 0.2); M.drum(tb, 0.45, 49, 1.4);
    M.strings(tb, SL.mirror + 0.2, C.Gmaj7, 0.42, { att: 0.2, rel: 1.4, cut: 1500 });
  }

  // ---- the mirror: a dream. Each piano phrase answered by itself two seconds later (your reflection); walking in:
  //      high strings opening out (everything ahead turns blue); looking back: low and dark
  {
    M.prog([[SL.mirror, C.Gmaj7], [slS('late') - 0.4, C.Em9]], SL.walk + 0.3, 0.38, { cut: 1200 });
    const echo = (t, notes, dt) => notes.forEach((n, i) => { M.piano(t + i * dt, n, 0.2, 1.8, -0.15); M.piano(t + i * dt + 2.0, n, 0.11, 1.8, 0.45); });
    echo(slCap('mirror', 1).show + 0.2, ['B4', 'D5', 'A4', 'G4'], 0.5);
    echo(slS('late') + 0.6, ['E5', 'D5', 'B4'], 0.55);
    M.bell(slS('late') + 0.05, 'D6', 0.2, 0);
    M.strings(slS('walk') - 0.1, SL.behind + 0.3, ['B4', 'E5', 'F#5', 'B5'], 0.34, { att: 1.5, rel: 0.4, cut: 2000, cutTo: 5000, wave: 'triangle', vib: 4 });
    M.strings(slS('walk') - 0.1, SL.behind + 0.3, ['E2', 'B2'], 0.32, { att: 1.2, rel: 0.4, cut: 500 });
    M.strings(SL.behind, SL.lamp + 0.3, ['E1', 'B1', 'E2', 'G2'], 0.7, { att: 0.8, rel: 0.6, cut: 260 });
    M.piano(SL.behind + 0.2, 'E1', 0.35, 3.5, 0);
  }

  // ---- the lamp: almost nothing. One note; when the lamp goes off, a high thread; the dark spilling (a low swell);
  //      the lamp back on (a slow warm swell); the cold open's bells again ("what you saw at the start")
  M.strings(SL.lamp + 0.3, SL.lampOff + 0.1, ['E4', 'B4'], 0.14, { att: 1.5, rel: 0.1, cut: 3000, wave: 'sine', vib: 2 });
  M.strings(SL.lampOff, slCap('stays', 1).show + 0.5, ['B5'], 0.05, { att: 0.3, rel: 1.0, cut: 6000, wave: 'sine', vib: 3 });
  M.strings(slCap('stays', 1).show - 0.1, SL.lampOn - 0.3, ['E1', 'B1', 'E2'], 0.62, { att: 2.5, rel: 0.8, cut: 200, cutTo: 520 });
  M.strings(SL.lampOn + 0.2, SL.egg + 0.4, C.Gmaj7, 0.5, { att: 3.5, rel: 0.8, cut: 900, cutTo: 2000 });
  for (const [dt, n] of [[0, 'E6'], [1.2, 'B5'], [2.4, 'G5'], [3.6, 'F#5']]) M.bell(slCap('on', 1).show + dt, n, 0.2, dt > 1.5 ? 0.25 : -0.25);
  M.strings(SL.egg, SL.knock + 0.3, C.Em9, 0.32, { att: 1.0, rel: 0.6, cut: 1000 });
  for (const [t, n] of [[SL.egg + 0.4, 'E4'], [slCap('egg', 1).show, 'G4'], [slCap('egg', 1).show + 1.4, 'B4']]) M.piano(t, n, 0.16, 2.2, 0);

  // ---- the knock: a low drone; a thin high note while you wait to see it; "There." one bell
  M.strings(SL.knock + 0.2, SL.knockSeen + 0.3, ['E1', 'E2'], 0.4, { att: 1.5, rel: 0.4, cut: 260, wave: 'sine' });
  M.strings(slS('hear') + 0.1, SL.knockSeen + 0.2, ['F#6'], 0.035, { att: 2.5, rel: 0.1, cut: 8000, wave: 'sine', vib: 6 });
  M.bell(slS('see') + 0.02, 'B5', 0.42, 0); M.piano(slS('see') + 0.02, 'E2', 0.28, 3, 0);

  // ---- the freeze: the theme, slower than it has ever been; the pad closing; the stop takes the last note
  M.strings(SL.freeze, SL.stop, C.Em, 0.45, { att: 1.5, rel: 0.05, cut: 1000, cutTo: 240, cutAt: SL.stop });
  M.strings(SL.freeze + 0.5, SL.stop, ['B5'], 0.04, { att: 2.0, rel: 0.05, cut: 6000, wave: 'sine', vib: 2, keys: [[SL.freeze + 2.5, 1], [SL.stop - 0.5, 0.3]] });
  [[0, 'E4'], [3.2, 'B4'], [7.0, 'A4'], [10.5, 'F#4']].forEach(([dt, n], i) => { const t = SL.freeze + 0.5 + dt; M.piano(t, n, 0.3 * (i ? 0.88 : 1), Math.min(3.0, SL.stop - t - 0.06), i % 2 ? 0.22 : -0.22, 0.05); });

  // ---- the dark: a heartbeat; then nothing until "every light in the house is on" (a soft low chord); one tender
  //      phrase for Mum's text, which she beat home
  for (let t = SL.last + 0.6; t < SL.door - 0.3; t += 0.95) M.beat(t, 0.22 * (1 - 0.5 * slEv(t, SL.door - 4, SL.door)));
  M.strings(SL.on2 + 0.2, SL.text + 0.3, C.Cmaj7, 0.34, { att: 1.5, rel: 0.6, cut: 700, wave: 'triangle' });
  M.prog([[SL.text, C.C], [slCap('text', 1).show - 0.2, C.G]], SL.real + 0.3, 0.34, { cut: 900 });
  for (const [t, n] of [[slS('text') + 0.3, 'G4'], [slS('text') + 1.1, 'E4'], [slS('text') + 2.0, 'B3'], [slCap('text', 1).show + 0.2, 'C4'], [slCap('text', 1).show + 1.3, 'D4']]) M.piano(t, n, 0.18, 2.4, 0);

  // ---- 10 · it's real: warmth coming back with the light; the lab's steady pulse (it slows with the light: 17 m/s);
  //      the held chord; the release, and the G at last
  M.strings(SL.real, SL.lab + 0.4, C.Cmaj7, 0.62, { att: 3.0, rel: 0.6, cut: 600, cutTo: 2400 });
  M.bell(slS('real') + 0.05, 'E6', 0.2, -0.2); M.bell(slCap('real', 1).show + 0.05, 'G6', 0.2, 0.2);
  M.prog([[SL.lab, C.Em], [slCap('lab', 1).show, C.C], [slCap('lab', 2).show, C.Am9], [slCap('lab', 3).show, C.Bsus]], SL.held + 0.3, 0.5, { cut: 1300 });
  M.drum(slS('lab'), 0.45, 41, 1.4); M.drum(slCap('lab', 2).show, 0.4, 41, 1.4);
  for (let t = slS('lab') + 0.1, i = 0; t < slS('stopped') - 0.2; i++) { M.bell(t, ['E5', 'G5', 'B5', 'E6', 'B5', 'G5'][i % 6], 0.16, i % 2 ? 0.3 : -0.3); t += 0.4 + 0.5 * slEv(t, slCap('lab', 2).show - 0.3, slCap('lab', 2).show + 2); }
  M.strings(slS('stopped') - 0.1, SL.release + 0.05, C.Esus, 0.55, { att: 0.8, rel: 0.05, cut: 1400, vib: 0 });
  M.strings(SL.held, SL.release + 0.05, ['B5'], 0.06, { att: 0.5, rel: 0.05, cut: 6000, wave: 'sine', vib: 0 });
  M.bell(SL.release, SL_THEME_END, 0.55, 0); M.piano(SL.release, 'G2', 0.42, 4, 0); M.piano(SL.release, 'G3', 0.3, 4, 0); M.drum(SL.release, 0.7, 41, 1.2);
  M.strings(SL.release, SL.question + 0.4, C.Gbig, 0.65, { att: 0.08, rel: 0.8, cut: 2600 });
  M.bell(theme(SL.release + 0.8, 0.32, 0.36), SL_THEME_END, 0.42, 0);

  // ---- the question: light and quick, the theme whole again, ending on G
  M.prog([[SL.question, C.C], [slS('question') + 2.0, C.D], [slCap('question', 1).show, C.Em], [slCap('question', 1).show + 2.4, C.G]], SL.end + 1.4, 0.6, { cut: 1600, lastRel: 2.2 });
  for (let t = SL.question + 0.4, i = 0; t < slCap('question', 1).show - 0.2; t += 0.3, i++) M.piano(t, ['C5', 'E5', 'G5', 'E5', 'D5', 'F#5', 'A5', 'F#5'][i % 8], 0.12, 0.6, i % 2 ? 0.25 : -0.25, 0.2);
  M.bell(theme(slCap('question', 1).show + 0.15, 0.2, 0.42), SL_THEME_END, 0.5, 0);
  const tg = slCap('question', 1).show + 2.4;
  M.drum(tg, 0.6, 41, 1.4); M.piano(tg, 'G2', 0.4, 5, 0);
  ['G5', 'B5', 'D6', 'G6'].forEach((n, i) => M.bell(tg + 0.3 + i * 0.22, n, 0.3, -0.45 + 0.3 * i));
});
