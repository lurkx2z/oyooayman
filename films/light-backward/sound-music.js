/* =====================================================================
   SOUND · MUSIC — an original score in E, all synthesised (the music kit of the Slower sound film, renamed lb*):
   string pads, a felt piano (also played backwards), bells, a low drum, a filtered synth pulse. This film's own ideas:
     the theme        E–B–A–F♯, then the E an octave up: over the title, at the second Sun, whole for the question
     backwards        at 10:00:00 the swell is cut dead; from then on the theme keeps turning up BACKWARDS (F♯–A–B–E,
                      on a reversed piano that swells out of nothing and stops on its attack) for the old light
                      going home: the stars, the lantern, the Sun's past, the second Sun setting
     the raised 4th   the bright chord with something wrong in it (E Lydian): daylight at 10 PM, noon at ×3
     room to listen   the score stops dead when Hawaii's Sun goes out, and steps back for the robins, the crowd,
                      the clock
   ===================================================================== */

// the kit: string pads (three detuned oscillators per note through low-passes), felt piano (also reversed), bells,
// a low drum and a heartbeat
function lbMusicKit(ctx, K) {
  if (K._music) return K._music;
  const fx = K.fx, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(); bus.connect(K.bus);
  const hall = fx.ir(4.2, { bright: 0.5, damp: 2.8, shape: 2.0, pre: 0.025, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.55;
  bus.connect(hall); hall.connect(wet); wet.connect(K.bus);
  const drumModes = (f) => [[f, 0.7, 1], [f * 1.51, 0.45, 0.5], [f * 1.99, 0.3, 0.35], [f * 2.44, 0.2, 0.2], [f * 3.1, 0.12, 0.12]];
  const M = {
    bus,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4, dest = bus) => {
      const b = fx.pianoBuf(lbMidi(n)), len = Math.min(b.length, Math.ceil((dur + fade + 0.05) * fx.sr));
      return fx.play(b.subarray(0, len), t, dest, { vol: vel * 0.34, pan, stop: t + dur + fade, fade });
    },
    // a piano note played backwards: it swells up out of nothing and stops dead on its attack at tEnd
    rpiano(tEnd, n, vel, dur = 1.6, pan = 0) {
      const key = 'rp' + n + '_' + dur;
      if (!fx.cache[key]) {
        const b = fx.pianoBuf(lbMidi(n)), L = Math.min(b.length, Math.ceil(dur * fx.sr)), y = new Float32Array(L + Math.ceil(0.01 * fx.sr));
        for (let i = 0; i < L; i++) { const u = i / L; y[L - 1 - i] = b[i] * Math.min(1, (1 - u) / 0.35); }
        for (let i = 0; i < 0.01 * fx.sr; i++) y[L + i] = y[L - 1] * (1 - i / (0.01 * fx.sr));
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], tEnd - dur, bus, { vol: vel * 0.34, pan });
    },
    bell: (t, n, vol, pan = 0, dest = bus) => fx.play(fx.bellBuf(lbMidi(n)), t, dest, { vol: vol * 0.25, pan }),
    // a bell cut short (something going over the edge: its sound stops, the hall keeps a little of it)
    bellCut: (t, n, vol, d = 0.18, pan = 0) => fx.play(fx.bellBuf(lbMidi(n)), t, bus, { vol: vol * 0.25, pan, stop: t + d, fade: 0.05 }),
    // a low drum (a timpani-like membrane): f the pitch, vol, soft = a wider mallet, dk = decay
    drum(t, vol, f = 36.7, soft = 1, dk = 1) {
      const key = 'drum' + f + '_' + soft + '_' + dk;
      if (!fx.cache[key]) {
        const y = fx.hit(drumModes(f).map(([a, tau, b]) => [a, tau * dk, b]), { width: 0.006 * soft, amp: 1, noise: 0.25, nlen: 0.02, nhp: 300, len: 3.2 * Math.max(dk, 0.3) });
        const pk = LBX.peak(y) || 1; for (let i = 0; i < y.length; i++) y[i] /= pk;
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
        const f = lbHz(nn);
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
function lbPulse(ctx, dest, t0, t1, notes, step, vol, o = {}) {
  if (t1 - t0 < step) return;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.q || 4;
  lp.frequency.setValueAtTime(o.cut || 600, t0); lp.frequency.linearRampToValueAtTime(o.cutTo || o.cut || 600, t1);
  lp.connect(g); g.connect(dest); g.gain.value = 0;
  notes.forEach((n, k) => {
    const os = ctx.createOscillator(); os.type = o.wave || 'sawtooth'; os.frequency.value = lbHz(n); os.detune.setValueAtTime(k % 2 ? 6 : -6, t0);
    if (o.glide) os.detune.linearRampToValueAtTime((k % 2 ? 6 : -6) + o.glide, t1);
    os.connect(lp); os.start(t0); os.stop(t1 + 0.1);
  });
  for (let t = t0, i = 0; t < t1 - 0.01; t += (o.stepAt ? o.stepAt(t) : step), i++) {
    const acc = o.acc && i % o.acc === 0 ? 1.0 : 0.62, ramp = o.ramp ? o.ramp((t - t0) / (t1 - t0)) : 1, v = vol * 0.05 * acc * ramp, st = o.stepAt ? o.stepAt(t) : step;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.setTargetAtTime(0, t + 0.012, st * (o.decay || 0.28));
  }
}

const LB_CH = {
  Em9: ['E2', 'B2', 'G3', 'D4', 'F#4'], Em: ['E2', 'B2', 'E3', 'G3', 'B3'], E: ['E2', 'B2', 'E3', 'G#3', 'B3'], Emaj9: ['E2', 'B2', 'G#3', 'D#4', 'F#4'],
  Elyd: ['E2', 'B2', 'G#3', 'D#4', 'A#4'], Cmaj7: ['C2', 'G2', 'E3', 'B3', 'E4'], Clyd: ['C2', 'G2', 'E3', 'B3', 'F#4'], G: ['G1', 'D2', 'B2', 'D3', 'G3'],
  D: ['D2', 'A2', 'F#3', 'A3', 'D4'], Dsus: ['D2', 'A2', 'E3', 'G3', 'A3'], Asus: ['A1', 'E2', 'D3', 'E3', 'A3'], Amaj9: ['A1', 'E2', 'C#3', 'G#3', 'B3'],
  Am9: ['A1', 'E2', 'C3', 'G3', 'B3'], Bsus: ['B1', 'F#2', 'E3', 'F#3', 'B3'], B: ['B1', 'F#2', 'D#3', 'F#3', 'B3'], Csm7: ['C#2', 'G#2', 'E3', 'B3', 'E4'],
  Ebig: ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4', 'G#4', 'B4'], Embig: ['E2', 'B2', 'E3', 'G3', 'B3', 'E4', 'G4', 'B4'],
};
const LB_THEME = ['E5', 'B5', 'A5', 'F#5'], LB_THEME_END = 'E6', LB_THEME_BACK = ['F#5', 'A5', 'B5', 'E5'];
const lbOct = (n, k) => n.replace(/-?\d$/, (d) => String(+d + k));

lbSound('music', 'score', function (ctx, bus, K) {
  const M = lbMusicKit(ctx, K), C = LB_CH, cap = (id, k) => lbCap(id, k).show, sun2 = lbStory(LB_SKY.on);
  // the theme forwards (bells, or the piano)
  const theme = (t, dts, vol, o = {}) => {
    let tt = t;
    (o.notes || LB_THEME).forEach((n, i) => {
      const nn = lbOct(n, o.oct || 0), pan = (o.pan || 0) + (i % 2 ? 0.22 : -0.22);
      if (o.piano) M.piano(tt, nn, vol * (i ? 0.88 : 1), o.dur || 2.4, pan); else M.bell(tt, nn, vol * (i ? 0.88 : 1), pan);
      tt += Array.isArray(dts) ? dts[Math.min(i, dts.length - 1)] : dts;
    });
    return tt;
  };
  // the theme backwards, on the reversed piano: each note swells up and stops dead on its attack at tt
  const back = (t, dt, vol, o = {}) => { let tt = t; for (const n of LB_THEME_BACK) { M.rpiano(tt, lbOct(n, o.oct || 0), vol, o.dur || 1.5, o.pan || 0); tt += dt; } return tt; };
  const arp = (t0, t1, notes, s, vol, oct = [5, 6], seq = [0, 2, 1, 3, 2, 4, 1, 3]) => {
    const pcs = notes.map((n) => n.replace(/-?\d$/, ''));
    for (let t = t0, i = 0; t < t1 - 0.05; i++) {
      const v = typeof vol === 'function' ? vol(t) : vol;
      if (v > 0.005) M.bell(t, pcs[seq[i % seq.length] % pcs.length] + oct[(i >> 2) % oct.length], v * (i % 4 === 0 ? 1 : 0.7), Math.sin(i * 1.9) * 0.6);
      t += typeof s === 'function' ? s(t) : s;
    }
  };
  // piano notes every dt from t0 to t1 (a melody cycling through `ns`)
  const keys = (t0, t1, dt, ns, vel, o = {}) => { for (let t = t0, i = 0; t < t1 - 0.3; i++, t += dt) M.piano(t, ns[i % ns.length], vel, Math.min(o.dur || 2.4, (o.stop || 1e9) - t), Math.sin(i * 1.3) * 0.4, o.stop && t + 2.4 > o.stop ? 0.04 : 0.4); };

  // ---- 1 · the cold open (10:02 PM, daylight): a bright chord with something wrong in it, a quickening pulse, a
  // reversed swell into the title
  M.strings(0, LB.titleShot + 0.3, C.Elyd, 0.4, { att: 1.5, rel: 0.4, cut: 1400, vib: 5 });
  M.strings(0.4, LB.titleShot, ['E1', 'B1'], 0.5, { att: 2.0, rel: 0.3, cut: 260, wave: 'sine', vib: 1 });
  lbPulse(ctx, M.bus, 2.0, LB.titleShot - 0.15, ['E3', 'B3'], 0.36, 0.22, { cut: 700, cutTo: 2200, acc: 4, decay: 0.28, ramp: (u) => 0.3 + 0.7 * u });
  M.bell(cap('open', 1) + 0.15, 'B5', 0.3, 0.3);
  M.rpiano(LB.titleShot, 'E3', 0.32, 1.8); M.rpiano(LB.titleShot, 'B3', 0.24, 1.8);
  // the title: the theme rings out
  const T0 = LB.title[0];
  M.drum(T0, 0.6, 41.2, 1.4); M.piano(T0, 'E2', 0.4, 3.5);
  M.bell(theme(T0 + 0.1, 0.28, 0.42), LB_THEME_END, 0.5, 0);
  M.strings(T0 - 0.1, LB.before + 0.8, C.Emaj9, 0.4, { att: 0.5, rel: 1.4, cut: 1600 });

  // ---- 2 · 9:59 PM: a hush; the rule: a pulse counting down; the last seconds swell into 10:00:00 and stop dead
  M.strings(LB.before, LB.rule + 0.4, C.Em9, 0.3, { att: 2.0, rel: 0.6, cut: 800 });
  keys(LB.before + 1.4, LB.rule, 2.6, ['B4', 'G4', 'D5', 'F#4'], 0.1);
  M.prog([[LB.rule, C.Cmaj7], [LB.flipRule, C.Asus], [cap('rule', 2), C.Bsus]], LB.count + 0.3, 0.32, { cut: 1000 });
  lbPulse(ctx, M.bus, LB.rule + 0.5, LB.t0 - 0.02, ['E2', 'B2'], 0.5, 0.26, { cut: 500, cutTo: 1800, acc: 2, decay: 0.3, stepAt: (t) => (t < LB.count ? 0.5 : 0.25), ramp: (u) => 0.4 + 0.6 * u });
  M.strings(LB.count, LB.t0 + 0.02, ['B1', 'F#2', 'E3', 'F#3', 'B3', 'A4'], 0.42, { att: 2.0, rel: 0.02, cut: 900, cutTo: 4200, cutAt: LB.t0 });
  M.rpiano(LB.t0, 'E2', 0.45, 2.3); M.rpiano(LB.t0, 'B2', 0.35, 2.3); M.rpiano(LB.t0, 'E4', 0.3, 2.3);

  // ---- 3 · after 10:00:00: a low drone; a glassy note for the sliver; the theme backwards as the old light heads home
  M.strings(LB.t0 + 1.4, LB.mirror + 0.4, ['E1', 'B1', 'E2'], 0.34, { att: 3.0, rel: 1.0, cut: 240, wave: 'sine', vib: 1 });
  M.strings(cap('crescent', 0) - 0.2, LB.old + 3, ['B5'], 0.05, { att: 1.5, rel: 2.0, cut: 6000, wave: 'sine', vib: 3 });
  back(cap('old', 1) + 1.2, 1.05, 0.22, { oct: -1 });
  M.strings(LB.siriusCut, LB.mirror + 0.4, ['C2', 'G2', 'E3', 'B3'], 0.26, { att: 2.0, rel: 1.0, cut: 900 });
  M.bell(lbStory(20.0), 'B5', 0.32, -0.4);                                         // Sirius
  // the mirror: the stars come back on the wrong side, more every second
  M.prog([[LB.mirror, C.Cmaj7], [cap('mirror', 1), C.G], [cap('mirror', 2), C.Em9]], LB.replay + 0.3, 0.32, { cut: 1300 });
  arp(LB.mirror + 1.2, LB.replay - 0.4, ['E', 'G', 'B', 'D', 'F#'], 0.45, (t) => 0.025 + 0.05 * MathX.clamp((t - LB.mirror) / 11, 0, 1));
  // the lantern slowed down a billion times: everything deep and slow, sliding down; its light pours back in
  M.strings(LB.replay, LB.replayEnd + 0.3, ['E1', 'B1', 'G2'], 0.36, { att: 1.2, rel: 0.8, cut: 320, glide: -500, glideAt: LB.replayEnd, wave: 'triangle', vib: 0 });
  M.rpiano(cap('replay', 1) + 2.6, 'E3', 0.3, 2.6); M.rpiano(cap('replay', 1) + 2.6, 'B3', 0.24, 2.6); M.rpiano(cap('replay', 1) + 2.6, 'G4', 0.2, 2.6);
  M.bell(cap('replay', 2) + 0.6, 'E6', 0.2, 0.3);
  // Canopus, never seen from Britain: wonder
  M.prog([[LB.replayEnd, C.Amaj9], [LB.canopusCut + 3, C.Clyd]], LB.north + 0.3, 0.32, { cut: 1500 });
  M.bell(lbStory(57.3), 'E6', 0.34, 0.4); M.bell(lbStory(57.3) + 0.42, 'B5', 0.24, 0.4);
  // ---- 10:01: the glow; the build to the second Sun (10:01:20): a roll, a swell, then the chord
  M.strings(LB.north, LB.switchCut + 0.4, C.Em9, 0.3, { att: 2.5, rel: 0.6, cut: 500, cutTo: 1800, cutAt: LB.switchCut });
  lbPulse(ctx, M.bus, LB.north + 3, sun2 - 0.05, ['E2', 'B2'], 0.5, 0.24, { cut: 400, cutTo: 2400, acc: 2, decay: 0.3, stepAt: (t) => (t < LB.switchCut ? 0.5 : 0.25), ramp: (u) => 0.3 + 0.7 * u });
  M.strings(LB.switchCut, sun2 + 0.02, C.Bsus, 0.42, { att: 2.5, rel: 0.02, cut: 800, cutTo: 4000, cutAt: sun2 });
  M.roll(sun2 - 3.0, sun2 - 0.05, [[sun2 - 3, 0.1], [sun2 - 0.1, 0.5]], 61.7);
  M.rpiano(sun2, 'E3', 0.4, 2.0); M.rpiano(sun2, 'B3', 0.3, 2.0); M.rpiano(sun2, 'G#4', 0.25, 2.0);
  M.drum(sun2, 0.8, 41.2, 1.2); M.piano(sun2, 'E1', 0.5, 4);
  M.strings(sun2, LB.day + 1, C.Ebig, 0.6, { att: 0.05, rel: 2.0, cut: 2600 });
  M.bell(theme(sun2 + 0.25, 0.3, 0.45), LB_THEME_END, 0.5, 0);

  // ---- 4 · daylight at 10 PM (bright, a little wrong); then space: a steady pulse under the illustrations
  M.prog([[LB.day, C.E], [LB.robin, C.Amaj9], [LB.lampsOff, C.Clyd]], LB.why + 0.3, 0.28, { cut: 1500 });
  keys(LB.day + 0.8, LB.why, 2.2, ['G#4', 'B4', 'E5', 'D#5', 'B4', 'F#4'], 0.09);
  lbPulse(ctx, M.bus, LB.why + 0.2, LB.moonwhy - 0.2, ['E2', 'B2', 'E3'], 0.3, 0.22, { cut: 600, cutTo: 1300, acc: 4, decay: 0.26 });
  M.prog([[LB.why, C.Em9], [LB.flip, C.Cmaj7], [LB.shadow, C.D], [cap('shadow', 2), C.Bsus], [LB.wave, C.Em9], [cap('wave', 2), C.E]], LB.moonwhy + 0.4, 0.34, { cut: 1200 });
  M.rpiano(LB.flip, 'B2', 0.34, 2.0); M.rpiano(LB.flip, 'E3', 0.26, 2.0); M.drum(LB.flip, 0.35, 41.2, 1.6);
  arp(LB.wave + 0.7, LB.moonwhy - 0.5, ['E', 'G#', 'B', 'D#', 'F#'], (t) => 0.32 - 0.12 * MathX.clamp((t - LB.wave) / 12, 0, 1), 0.06, [5, 6]);
  // the Moon's dark side, the telescope's card, the Sun's past (the theme backwards, slow, low)
  M.bell(cap('moonwhy', 0) + 0.3, 'E6', 0.26, 0.3);
  M.prog([[LB.moonwhy, C.Emaj9], [LB.project, C.Amaj9], [cap('project', 2), C.Csm7], [LB.past, C.Em9]], LB.hawaii + 0.4, 0.28, { cut: 1100 });
  keys(LB.project + 0.6, LB.past - 0.3, 2.4, ['E4', 'B3', 'C#4', 'G#3'], 0.1);
  back(cap('past', 1) + 1.6, 1.4, 0.22, { oct: -1, dur: 1.8 });
  back(cap('past', 2) + 1.5, 1.6, 0.18, { oct: -2, dur: 2.0 });

  // ---- 5 · Hawaii at noon: warm; their Sun goes out: the music stops dead. The black sky: a drone, a thin high note
  M.strings(LB.hawaii, LB.out + 0.02, C.Amaj9, 0.32, { att: 0.8, rel: 0.02, cut: 1800 });
  keys(LB.hawaii + 0.3, LB.out, 0.42, ['A4', 'C#5', 'E5', 'B4', 'C#5', 'E5', 'G#4', 'B4'], 0.08, { stop: LB.out, dur: 1.2 });
  M.strings(LB.out + 1.6, LB.half + 0.4, ['E1', 'B1'], 0.3, { att: 3.0, rel: 0.8, cut: 220, wave: 'sine', vib: 1 });
  M.strings(LB.black + 1.0, LB.wait, ['F#5'], 0.04, { att: 2.0, rel: 1.5, cut: 6000, wave: 'sine', vib: 4 });
  M.strings(LB.half, LB.wait + 0.3, C.Clyd, 0.26, { att: 1.5, rel: 0.8, cut: 900 });
  // the wait: a pulse ticking off the 8 minutes; Voyager: wide and sparse, its signal turning round (backwards)
  lbPulse(ctx, M.bus, LB.wait, LB.voyager - 0.1, ['E2', 'B2'], 0.25, 0.2, { cut: 500, cutTo: 900, acc: 4, decay: 0.2 });
  M.prog([[LB.wait, C.Am9], [cap('wait', 1), C.Bsus]], LB.voyager + 0.3, 0.28, { cut: 900 });
  M.strings(LB.voyager, LB.ret + 0.3, C.Cmaj7, 0.28, { att: 2.5, rel: 1.0, cut: 1100 });
  back(cap('voyager', 1) + 2.2, 0.8, 0.2, { oct: 0, dur: 1.2 });
  // ---- 10:08:16, the Sun comes back: a single note (the dot), then the chord (the disc); brighter and brighter
  M.strings(LB.ret, LB.back + 0.02, C.Bsus, 0.36, { att: 1.0, rel: 0.02, cut: 700, cutTo: 2000, cutAt: LB.back });
  M.strings(LB.back, cap('return', 1) + 0.5, ['E5'], 0.06, { att: 0.6, rel: 0.4, cut: 6000, wave: 'sine', vib: 2 });
  M.drum(cap('return', 1) + 0.1, 0.55, 41.2, 1.3);
  M.strings(cap('return', 1) + 0.1, LB.double + 0.4, C.E, 0.42, { att: 0.4, rel: 0.8, cut: 2000 });
  M.strings(LB.double, LB.full + 0.3, C.Emaj9, 0.3, { att: 1.0, rel: 1.0, cut: 1200, cutTo: 4200, cutAt: cap('double', 3), keys: [[LB.double + 1, 0.6], [cap('double', 3), 1.6], [LB.full - 0.5, 1.0]] });
  lbPulse(ctx, M.bus, LB.double + 0.5, cap('double', 3), ['E2', 'B2', 'E3'], 0.4, 0.24, { cut: 600, cutTo: 2600, acc: 4, decay: 0.28, stepAt: (t) => 0.4 - 0.2 * MathX.clamp((t - LB.double) / (cap('double', 3) - LB.double), 0, 1), ramp: (u) => 0.4 + 0.6 * u });
  M.drum(cap('double', 3), 0.6, 41.2, 1.2); M.bell(cap('double', 3) + 0.1, 'E6', 0.4, 0); M.bell(cap('double', 3) + 0.1, 'B5', 0.3, 0);

  // ---- 6 · home: the Moon lights up again; three times the sunlight; midnight; the two suns; noon; the dark lost
  M.bell(LB.moonFull, 'B5', 0.3, -0.3); M.bell(LB.moonFull + 0.35, 'E6', 0.26, 0.3);
  M.prog([[LB.full, C.Emaj9], [LB.three, C.G], [cap('three', 1), C.Dsus]], LB.midnight + 0.3, 0.3, { cut: 1300 });
  lbPulse(ctx, M.bus, LB.three, LB.midnight - 0.2, ['G2', 'D3'], 0.36, 0.18, { cut: 700, cutTo: 1100, acc: 4, decay: 0.25 });
  M.strings(LB.midnight, LB.sunrise + 0.3, C.Clyd, 0.26, { att: 2.0, rel: 1.0, cut: 1600 });
  M.strings(LB.midnight + 1.0, LB.sunrise, ['E5', 'B5'], 0.04, { att: 2.5, rel: 1.5, cut: 7000, wave: 'sine', vib: 4 });
  keys(LB.midnight + 2.0, LB.sunrise - 0.5, 3.1, ['B4', 'F#4', 'E5', 'G4'], 0.08);
  // 6:47: the theme forwards (the real Sun rising, right) and backwards (the second setting, left) at once
  M.prog([[LB.sunrise, C.E], [LB.bothDown, C.Csm7], [cap('sunrise', 2), C.Amaj9]], LB.noon + 0.3, 0.34, { cut: 1400 });
  theme(LB.sunrise + 1.0, [1.0, 1.0, 1.4], 0.22, { piano: true, oct: -1, dur: 3.0, pan: 0.45 });
  back(LB.bothDown + 1.6, 1.0, 0.24, { oct: -1, pan: -0.45, dur: 1.4 });
  M.bell(cap('sunrise', 2) + 0.3, 'E6', 0.3, 0.45); M.bell(cap('sunrise', 2) + 0.3, 'E5', 0.24, -0.45);
  // noon at ×3: the bright chord with the raised fourth again, high and hard
  M.strings(LB.noon, LB.never + 0.3, C.Elyd, 0.34, { att: 0.8, rel: 0.8, cut: 3200 });
  M.strings(LB.noon + 0.5, LB.never, ['A#5', 'E6'], 0.035, { att: 1.0, rel: 1.0, cut: 9000, wave: 'sine', vib: 6 });
  // it never gets dark again: the theme backwards, low, for the night that is gone
  M.prog([[LB.never, C.Em9], [cap('never', 2), C.Cmaj7]], LB.space + 0.4, 0.3, { cut: 1000 });
  back(cap('never', 1) + 1.4, 1.3, 0.2, { oct: -1, dur: 1.7 });

  // ---- 7 · the planet: big and steady; the heat: dread, quickening; the oceans; the Sun being born
  M.prog([[LB.space, C.Ebig], [cap('space', 1), C.Emaj9]], LB.summer + 0.3, 0.4, { cut: 1800 });
  arp(LB.space + 0.6, LB.summer - 0.4, ['E', 'G#', 'B', 'D#', 'F#'], 0.38, 0.05, [5, 6]);
  M.prog([[LB.summer, C.E], [cap('summer', 1), C.Amaj9], [cap('summer', 2), C.B]], LB.heat + 0.3, 0.34, { cut: 1500 });
  keys(LB.summer + 0.5, LB.heat - 0.2, 1.6, ['B4', 'E5', 'G#4', 'C#5', 'A4', 'E5'], 0.09);
  M.strings(LB.heat, LB.birth + 0.4, ['E1', 'B1', 'E2'], 0.36, { att: 1.0, rel: 1.2, cut: 300, cutTo: 700, cutAt: LB.birth });
  M.strings(LB.heat + 2, LB.boil + 0.4, ['F2', 'C3', 'E3'], 0.22, { att: 2.5, rel: 0.6, cut: 700, cutTo: 1400, cutAt: LB.boil });
  lbPulse(ctx, M.bus, LB.heat + 0.5, cap('boil', 1), ['E2', 'B2'], 0.4, 0.26, { cut: 500, cutTo: 2200, acc: 4, decay: 0.26, stepAt: (t) => 0.4 - 0.22 * MathX.clamp((t - LB.heat) / (cap('boil', 1) - LB.heat), 0, 1), ramp: (u) => 0.4 + 0.6 * u });
  M.drum(cap('boil', 1), 0.65, 36.7, 1.2); M.piano(cap('boil', 1), 'E1', 0.45, 3);
  M.strings(cap('boil', 1), LB.birth + 0.3, ['E1', 'B1', 'F2', 'C3'], 0.34, { att: 0.2, rel: 1.5, cut: 500 });
  M.drum(cap('boil', 2) + 0.2, 0.45, 30.9, 2.0, 1.4);
  // the second Sun running back to the Sun's birth: rising, opening out; then it fades and the night comes back
  M.strings(LB.birth, LB.nightBack + 1.5, C.Em9, 0.34, { att: 2.5, rel: 1.8, cut: 600, cutTo: 2600, cutAt: LB.nightBack });
  M.strings(cap('birth', 1), LB.nightBack + 1.0, ['B4', 'E5', 'B5'], 0.06, { att: 2.5, rel: 1.6, cut: 6000, wave: 'sine', vib: 3 });
  arp(cap('birth', 1) + 0.4, LB.nightBack, ['E', 'G', 'B', 'D', 'F#'], (t) => 0.5 - 0.3 * MathX.clamp((t - cap('birth', 1)) / 5, 0, 1), 0.05, [5, 6, 7]);
  M.bell(LB.nightBack + 2.4, 'E5', 0.3, 0);

  // ---- 8 · is any of this real: warm and plain (the night garden again); the question: the theme whole
  M.prog([[LB.real, C.Em9], [LB.real2, C.Cmaj7], [LB.real3, C.G], [LB.real4, C.Dsus], [LB.real5, C.Asus]], LB.question + 0.2, 0.3, { cut: 1300 });
  keys(LB.real2 + 0.8, LB.real4 - 0.6, 2.4, ['B4', 'G4', 'E5', 'D5', 'B4', 'F#4', 'G4', 'A4'], 0.09);
  back(cap('real4', 1) + 1.0, 0.9, 0.2, { oct: 0, dur: 1.2 });
  keys(LB.real5 + 0.6, LB.question - 0.6, 2.8, ['E5', 'C#5', 'A4', 'B4'], 0.08);
  M.strings(LB.question - 0.2, LB.end + 0.05, C.Ebig, 0.48, { att: 1.0, rel: 1.2, cut: 1800, keys: [[LB.question + 2, 1], [LB.end - 3, 0.55], [LB.end - 0.6, 0.4]] });
  M.drum(LB.question, 0.5, 41.2, 1.4);
  M.bell(theme(LB.question + 0.3, 0.42, 0.42), LB_THEME_END, 0.5, 0);
});
