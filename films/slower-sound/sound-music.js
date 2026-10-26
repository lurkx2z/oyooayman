/* =====================================================================
   SOUND · MUSIC — an original score in D, all synthesised (the music kit of the Universe-shrinking film, renamed ss*):
   string pads, a felt piano, bells, a low drum, a filtered synth pulse. This film's own ideas:
     the hour chime   on every hour the theme's first note, a bell, and every hour an octave LOWER (the speed of sound
                      halves, so does every voice in the air): D6 at 7:00, D5 at 8:00 … at noon only the church bell, a thud you feel
                      more than hear at 1 PM, then nothing: the hours go by in silence
     the theme        D–A–G–E, then the D an octave up: over the title, again (lower, on the piano) as things are lost,
                      and whole for the closing question
     room to listen   the score steps right back (or stops) whenever the picture is about a sound: the boom, the siren,
                      the passing cars, the bell, the kick, the clap, the TV, the meow, the music box, the heartbeat
   ===================================================================== */

// the kit (from the Universe-shrinking film)
// the kit: string pads (three detuned oscillators per note through low-passes), felt piano (also reversed), bells,
// a low drum and a heartbeat
function ssMusicKit(ctx, K) {
  if (K._music) return K._music;
  const fx = K.fx, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(); bus.connect(K.bus);
  const hall = fx.ir(4.2, { bright: 0.5, damp: 2.8, shape: 2.0, pre: 0.025, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.55;
  bus.connect(hall); hall.connect(wet); wet.connect(K.bus);
  const drumModes = (f) => [[f, 0.7, 1], [f * 1.51, 0.45, 0.5], [f * 1.99, 0.3, 0.35], [f * 2.44, 0.2, 0.2], [f * 3.1, 0.12, 0.12]];
  const M = {
    bus,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4, dest = bus) => {
      const b = fx.pianoBuf(ssMidi(n)), len = Math.min(b.length, Math.ceil((dur + fade + 0.05) * fx.sr));
      return fx.play(b.subarray(0, len), t, dest, { vol: vel * 0.34, pan, stop: t + dur + fade, fade });
    },
    // a piano note played backwards: it swells up out of nothing and stops dead on its attack at tEnd
    rpiano(tEnd, n, vel, dur = 1.6, pan = 0) {
      const key = 'rp' + n + '_' + dur;
      if (!fx.cache[key]) {
        const b = fx.pianoBuf(ssMidi(n)), L = Math.min(b.length, Math.ceil(dur * fx.sr)), y = new Float32Array(L + Math.ceil(0.01 * fx.sr));
        for (let i = 0; i < L; i++) { const u = i / L; y[L - 1 - i] = b[i] * Math.min(1, (1 - u) / 0.35); }
        for (let i = 0; i < 0.01 * fx.sr; i++) y[L + i] = y[L - 1] * (1 - i / (0.01 * fx.sr));
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], tEnd - dur, bus, { vol: vel * 0.34, pan });
    },
    bell: (t, n, vol, pan = 0, dest = bus) => fx.play(fx.bellBuf(ssMidi(n)), t, dest, { vol: vol * 0.25, pan }),
    // a bell cut short (something going over the edge: its sound stops, the hall keeps a little of it)
    bellCut: (t, n, vol, d = 0.18, pan = 0) => fx.play(fx.bellBuf(ssMidi(n)), t, bus, { vol: vol * 0.25, pan, stop: t + d, fade: 0.05 }),
    // a low drum (a timpani-like membrane): f the pitch, vol, soft = a wider mallet, dk = decay
    drum(t, vol, f = 36.7, soft = 1, dk = 1) {
      const key = 'drum' + f + '_' + soft + '_' + dk;
      if (!fx.cache[key]) {
        const y = fx.hit(drumModes(f).map(([a, tau, b]) => [a, tau * dk, b]), { width: 0.006 * soft, amp: 1, noise: 0.25, nlen: 0.02, nhp: 300, len: 3.2 * Math.max(dk, 0.3) });
        const pk = SSX.peak(y) || 1; for (let i = 0; i < y.length; i++) y[i] /= pk;
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
        const f = ssHz(nn);
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
function ssPulse(ctx, dest, t0, t1, notes, step, vol, o = {}) {
  if (t1 - t0 < step) return;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.q || 4;
  lp.frequency.setValueAtTime(o.cut || 600, t0); lp.frequency.linearRampToValueAtTime(o.cutTo || o.cut || 600, t1);
  lp.connect(g); g.connect(dest); g.gain.value = 0;
  notes.forEach((n, k) => {
    const os = ctx.createOscillator(); os.type = o.wave || 'sawtooth'; os.frequency.value = ssHz(n); os.detune.setValueAtTime(k % 2 ? 6 : -6, t0);
    if (o.glide) os.detune.linearRampToValueAtTime((k % 2 ? 6 : -6) + o.glide, t1);
    os.connect(lp); os.start(t0); os.stop(t1 + 0.1);
  });
  for (let t = t0, i = 0; t < t1 - 0.01; t += (o.stepAt ? o.stepAt(t) : step), i++) {
    const acc = o.acc && i % o.acc === 0 ? 1.0 : 0.62, ramp = o.ramp ? o.ramp((t - t0) / (t1 - t0)) : 1, v = vol * 0.05 * acc * ramp, st = o.stepAt ? o.stepAt(t) : step;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.setTargetAtTime(0, t + 0.012, st * (o.decay || 0.28));
  }
}

const SS_CH = {
  Dm: ['D2', 'A2', 'F3', 'A3', 'D4'], Dm9: ['D2', 'A2', 'F3', 'C4', 'E4'], Dsus: ['D2', 'A2', 'E3', 'G3', 'A3'], Dmaj: ['D2', 'A2', 'F#3', 'A3', 'D4'],
  Bbmaj7: ['Bb1', 'F2', 'D3', 'A3', 'D4'], F: ['F1', 'C2', 'A2', 'C3', 'F3'], Fmaj7: ['F2', 'C3', 'E3', 'A3', 'C4'], C: ['C2', 'G2', 'E3', 'G3', 'C4'],
  Gm: ['G1', 'D2', 'Bb2', 'D3', 'G3'], Gm9: ['G1', 'D2', 'Bb2', 'F3', 'A3'], Asus: ['A1', 'E2', 'D3', 'E3', 'A3'], A: ['A1', 'E2', 'C#3', 'E3', 'A3'],
  Am7: ['A1', 'E2', 'C3', 'G3', 'C4'], Dbig: ['D2', 'A2', 'D3', 'F3', 'A3', 'D4', 'F4', 'A4'], DmajBig: ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4', 'F#4', 'A4'],
};
const SS_THEME = ['D5', 'A5', 'G5', 'E5'], SS_THEME_END = 'D6';

const ssOct = (n, k) => n.replace(/-?\d$/, (d) => String(+d + k));
// the hours (story h) and their film times: the moment the clock passes each hour on screen
const SS_HOURS = [];
{
  const at = (h) => { let lo = SS.titleShot, hi = SS.real; for (let i = 0; i < 60; i++) { const m = 0.5 * (lo + hi); if (ssH(m) < h) lo = m; else hi = m; } return 0.5 * (lo + hi); };
  for (let h = 0; h <= 8; h++) SS_HOURS.push([h, at(h)]);
}

ssSound('music', 'score', function (ctx, bus, K) {
  const M = ssMusicKit(ctx, K), C = SS_CH, cap = (id, k) => ssCap(id, k).show;
  const theme = (t, dts, vol, o = {}) => {
    let tt = t;
    (o.notes || SS_THEME).forEach((n, i) => {
      const nn = ssOct(n, o.oct || 0), pan = (o.pan || 0) + (i % 2 ? 0.22 : -0.22);
      if (o.piano) M.piano(tt, nn, vol * (i ? 0.88 : 1), o.dur || 2.4, pan); else M.bell(tt, nn, vol * (i ? 0.88 : 1), pan);
      tt += Array.isArray(dts) ? dts[Math.min(i, dts.length - 1)] : dts;
    });
    return tt;
  };
  const arp = (t0, t1, notes, s, vol, oct = [5, 6], seq = [0, 2, 1, 3, 2, 4, 1, 3]) => {
    const pcs = notes.map((n) => n.replace(/-?\d$/, ''));
    for (let t = t0, i = 0; t < t1 - 0.05; i++) {
      const v = typeof vol === 'function' ? vol(t) : vol;
      if (v > 0.005) M.bell(t, pcs[seq[i % seq.length] % pcs.length] + oct[(i >> 2) % oct.length], v * (i % 4 === 0 ? 1 : 0.7), Math.sin(i * 1.9) * 0.6);
      t += typeof s === 'function' ? s(t) : s;
    }
  };

  // ---- the cold open (3 PM): a low drone, a rub, a quickening pulse under the crowd's cracks; a reversed swell into the cut
  M.strings(0, SS.titleShot + 0.2, ['D1', 'A1', 'D2'], 0.55, { att: 1.2, rel: 0.3, cut: 320, wave: 'sine', vib: 2 });
  M.strings(1.2, SS.titleShot, ['Eb3', 'D4'], 0.14, { att: 2.5, rel: 0.2, cut: 900, wave: 'triangle', vib: 4 });
  ssPulse(ctx, M.bus, 2.4, SS.titleShot - 0.1, ['D2', 'A2'], 0.4, 0.28, { cut: 400, cutTo: 1100, acc: 4, decay: 0.3, ramp: (u) => 0.3 + 0.7 * u });
  M.drum(cap('open', 2) - 0.05, 0.42, 36.7, 1.4);
  M.rpiano(SS.titleShot, 'D3', 0.3, 1.8, 0); M.rpiano(SS.titleShot, 'A3', 0.2, 1.8, 0);

  // ---- the title (6:59): the theme rings out; a warm D chord for the morning
  const T0 = SS.title[0];
  M.drum(T0, 0.65, 36.7, 1.4); M.piano(T0, 'D2', 0.4, 3.5, 0);
  M.bell(theme(T0 + 0.1, 0.26, 0.42), SS_THEME_END, 0.5, 0);
  M.prog([[T0 - 0.1, C.Dsus], [SS.seven, ['D2', 'A2', 'F#3', 'A3', 'E4']], [SS.bird, C.Dmaj], [cap('bird', 2), ['G1', 'D2', 'B2', 'D3', 'F#3']]], SS.plane + 0.3, 0.42, { cut: 1500 });
  for (let t = SS.seven + 1.5, i = 0; t < SS.plane - 1; i++, t += 2.6) M.piano(t, ['F#4', 'A4', 'E4', 'D4', 'B3', 'A4', 'F#4', 'E4', 'D4', 'A3'][i % 10], 0.13, 2.4, Math.sin(i) * 0.4);

  // ---- 7:14: the airliner breaks the sound barrier up there: a pulse, rising; 7:27 the boom (the score cuts out first)
  M.strings(SS.plane - 0.2, SS.boomAt - 1.4, C.Asus, 0.5, { att: 0.8, rel: 0.3, cut: 900, cutTo: 2400, cutAt: SS.boomAt - 2 });
  ssPulse(ctx, M.bus, SS.plane + 0.4, SS.boomAt - 1.5, ['A2', 'E3'], 0.3, 0.3, { cut: 500, cutTo: 1600, acc: 4, decay: 0.28, ramp: (u) => 0.4 + 0.6 * u });
  M.strings(SS.boomAt + 1.2, SS.eight + 0.4, C.Dm9, 0.48, { att: 2.2, rel: 0.8, cut: 1100 });
  theme(cap('carpet', 1) - 0.2, [0.5, 0.5, 0.8], 0.16, { piano: true, oct: -1, dur: 2.8 });

  // ---- 8:00 to 10:00: the morning gets strange: light piano, pads that dip at every hour; the vowels: a low drone
  M.prog([[SS.eight, C.Dsus], [SS.throat, C.Bbmaj7], [SS.kettle, C.F], [SS.radio, C.Gm9]], SS.nine + 0.3, 0.36, { cut: 1300 });
  for (let t = SS.eight + 1.2, i = 0; t < SS.radio - 0.6; i++, t += 2.2) if (!(t > SS.morning - 0.3 && t < SS.morning + 3)) M.piano(t, ['D4', 'A3', 'F4', 'E4', 'C4', 'A3', 'D4', 'G3'][i % 8], 0.11, 2.2, Math.sin(i * 1.3) * 0.4);
  M.prog([[SS.nine, C.Dm], [SS.spoon, C.Gm]], SS.ten + 0.3, 0.3, { cut: 1100 });
  M.prog([[SS.ten, ['D1', 'A1', 'D2', 'E2']], [SS.text, C.Bbmaj7]], SS.motorway + 0.3, 0.36, { cut: 600 });
  M.strings(SS.motorway, SS.eleven + 0.3, ['A1', 'E2', 'Bb2'], 0.4, { att: 1.5, rel: 0.6, cut: 500, cutTo: 900 });

  // ---- 11:00 the street: a driving pulse, stepping back under the siren and the passing cars
  ssPulse(ctx, M.bus, SS.eleven + 0.3, SS.siren + 0.6, ['D2', 'A2'], 0.36, 0.3, { cut: 600, cutTo: 1100, acc: 4, decay: 0.3 });
  M.strings(SS.eleven, SS.noon - 0.4, C.Dm9, 0.32, { att: 1.2, rel: 1.0, cut: 900, keys: [[SS.siren + 1, 0.4], [SS.silent, 0.9], [SS.carPass - 1.5, 0.35], [SS.backwards + 1, 0.8], [SS.musicPass - 2, 0.3]] });
  M.drum(SS.silent, 0.35, 41, 1.6);

  // ---- noon: nothing but the bell; then awe over the town (the bell's horizon)
  M.strings(SS.flying - 0.3, SS.one + 0.3, ['D2', 'A2', 'E3', 'F#3', 'A3', 'C#4'], 0.42, { att: 2.0, rel: 1.0, cut: 1200, cutTo: 2600 });
  arp(SS.horizon, SS.one - 0.6, ['D', 'F#', 'A', 'C#', 'E'], 0.42, 0.07, [5, 6]);

  // ---- 1 PM to 3 PM: tension rising (the wind, the van, the ears), the popcorn street
  M.prog([[SS.one, C.Gm9], [SS.two, ['Eb2', 'Bb2', 'G3', 'D4']], [SS.ears, C.Asus]], SS.three + 0.3, 0.34, { cut: 900, cutTo: 1300 });
  ssPulse(ctx, M.bus, SS.three, SS.four - 0.4, ['D2', 'A2', 'D3'], 0.25, 0.26, { cut: 700, cutTo: 1700, acc: 4, decay: 0.25, ramp: (u) => 0.5 + 0.5 * u });
  M.strings(SS.three, SS.four + 0.2, C.Dm, 0.3, { att: 0.8, rel: 0.6, cut: 1000 });

  // ---- 4 PM home: quiet piano (the theme, lower), stepping out for the TV and the clap
  M.strings(SS.four, SS.five + 0.3, C.Fmaj7, 0.26, { att: 1.5, rel: 1.0, cut: 900, keys: [[SS.four + 3, 0.5], [SS.clap - 0.5, 0.2], [SS.earbuds, 0]] });
  // 5 PM: the cat (bells, playful); the hum: almost nothing
  arp(cap('five', 1) - 0.2, SS.hum - 0.4, ['D', 'F', 'A', 'C', 'E'], 0.32, 0.06, [5, 6]);
  M.strings(SS.five, SS.storm + 0.3, ['D2', 'A2', 'F3'], 0.24, { att: 1.5, rel: 1.5, cut: 700 });

  // ---- 6 PM the storm: low and dark; the lightning: everything stops (the thunder never comes)
  M.strings(SS.storm, SS.flash - 0.1, ['D1', 'A1', 'Eb2', 'D3'], 0.5, { att: 1.5, rel: 0.1, cut: 500 });
  M.strings(cap('storm', 2) + 0.5, SS.eight2 + 0.4, ['D1', 'A1'], 0.3, { att: 3.0, rel: 0.8, cut: 260, wave: 'sine' });
  // 8 PM: a high thin note over a hollow pad (the day's sounds still crawling out there)
  M.strings(SS.eight2, SS.box - 0.5, ['A5'], 0.05, { att: 2.0, rel: 1.0, cut: 6000, wave: 'sine', vib: 3 });
  M.strings(SS.eight2, SS.box + 0.3, ['D2', 'A2', 'E3'], 0.3, { att: 1.5, rel: 1.5, cut: 800 });

  // ---- 10 PM the music box: silence while it plays; a pad for the wait; out again as the tune arrives
  M.strings(SS.wait + 0.5, SS.tuneHere - 0.6, ['D2', 'A2', 'F3', 'C4'], 0.28, { att: 3, rel: 1.4, cut: 700, cutTo: 1100 });
  // ---- midnight: the theme, low and slow on the piano, then fewer and fewer notes; silence before the heartbeat
  theme(SS.midnight + 1.0, [1.5, 1.5, 2.2], 0.22, { piano: true, oct: -2, dur: 3.5 });
  M.strings(SS.midnight, SS.last - 0.5, ['D1', 'A1', 'D2'], 0.32, { att: 2.0, rel: 3.0, cut: 300, wave: 'sine' });
  M.piano(ssCap('stop', 1).show, 'D2', 0.18, 4, -0.2); M.piano(ssCap('stop', 2).show, 'D1', 0.14, 5, 0.2);

  // ---- is any of this real: warmth comes back; the question: the theme whole, landing on its octave
  M.prog([[SS.real, C.Dsus], [SS.real2, C.Dmaj], [SS.real3, C.Bbmaj7], [SS.real4, C.Fmaj7], [SS.real5, C.Gm9]], SS.question + 0.2, 0.36, { cut: 1500 });
  for (let t = SS.real2 + 0.8, i = 0; t < SS.question - 1; i++, t += 2.4) M.piano(t, ['A4', 'F#4', 'D4', 'E4', 'A3', 'D4', 'F4', 'C4'][i % 8], 0.1, 2.2, Math.sin(i) * 0.4);
  M.strings(SS.question - 0.2, SS.end + 1.2, C.DmajBig, 0.5, { att: 1.0, rel: 2.5, cut: 1800 });
  M.drum(SS.question, 0.5, 36.7, 1.4);
  M.bell(theme(SS.question + 0.3, 0.42, 0.42), SS_THEME_END, 0.5, 0);

  // ---- the hour chime: each hour's bell an octave lower than the last (from 1 PM below hearing: a thud, then nothing)
  for (const [h, t] of SS_HOURS) {
    if (h <= 4) M.bell(t + 0.05, 'D' + (6 - h), 0.5 - 0.04 * h, 0.15);
    if (h >= 3 && h <= 4) M.piano(t + 0.05, 'D' + (6 - h), 0.3, 3.5, 0);
    if (h === 6) M.drum(t + 0.05, 0.35, 30, 2.5, 1.5);
  }
});
