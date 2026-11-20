/* =====================================================================
   SOUND · MUSIC — an original score, all synthesised (the music kit of the gravity films, via the light films and Sound
   faster than light): string pads, a felt piano (also played backwards, so notes swell up out of nothing), glass bells,
   a low drum, a synth pulse, the endless rise. E minor. Its idea is the film's:
     the music box   Leo's lullaby (five notes, falling, ending a semitone off home: it never comes back to rest) is
                     played on a music box that belongs to the world: it shrinks with everything else, so it plays an
                     octave higher every 30 s (ekWorldRate) until it is too high to hear. It is gone by 2:05.
     your score      the strings, the piano, the drums are yours: they never change pitch. After the music box is gone,
                     the lullaby is played only by your piano, lower and slower.
   The beats:
     title/start   the lullaby on the music box, cold strings; the shrinking starts under the title: a reversed swell, a hit
     out           the rip: a stab; wide strings as the campsite closes in
     rule          Poincaré: cold, wide strings (C lydian), sparse bells; "Unless one thing didn't": one low note
     leo/voice     the lullaby again on the music box, now high; a pulse under "2 octaves too high"
     weight        weightless strings; the pick-up: a warm chord
     neighbours    a low ostinato, a semitone cluster; the quake: a timpani roll and blows
     hush          the music box climbs out of hearing (bird, whistle, nothing); the score thins to a thread
     quiet         nothing but a low drone (the amb stem has your breath and heart)
     sunrise       the score opens: E major, the first big swell, gold
     shadow        it slides down a semitone into minor as your shadow falls on the peaks
     peaks/air     huge low strings; then the lullaby on your piano, alone, while you put him down; it stops unresolved
     escape…end    a pulse and the endless rise, faster beat by beat; three blows a semitone apart (house, car, smaller);
                   the ball: silence, one bell; the lullaby again, slow; the question: cut on the last frame
   ===================================================================== */

// the kit: string pads (three detuned oscillators per note through low-passes), felt piano (also reversed), bells,
// a low drum; and the music box (a bell played at a frequency, so it can follow the world's pitch)
function ekMusicKit(ctx, K) {
  if (K._music) return K._music;
  const fx = K.fx, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(); bus.connect(K.bus);
  const hall = fx.ir(4.4, { bright: 0.5, damp: 2.8, shape: 2.0, pre: 0.025, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.55;
  bus.connect(hall); hall.connect(wet); wet.connect(K.bus);
  const drumModes = (f) => [[f, 0.7, 1], [f * 1.51, 0.45, 0.5], [f * 1.99, 0.3, 0.35], [f * 2.44, 0.2, 0.2], [f * 3.1, 0.12, 0.12]];
  const M = {
    bus,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4, dest = bus) => {
      const b = fx.pianoBuf(ekMidi(n)), len = Math.min(b.length, Math.ceil((dur + fade + 0.05) * fx.sr));
      return fx.play(b.subarray(0, len), t, dest, { vol: vel * 0.34, pan, stop: t + dur + fade, fade });
    },
    // a piano note played backwards: it swells up out of nothing and stops dead on its attack at tEnd
    rpiano(tEnd, n, vel, dur = 1.6, pan = 0) {
      const key = 'rp' + n + '_' + dur;
      if (!fx.cache[key]) {
        const b = fx.pianoBuf(ekMidi(n)), L = Math.min(b.length, Math.ceil(dur * fx.sr)), y = new Float32Array(L + Math.ceil(0.01 * fx.sr));
        for (let i = 0; i < L; i++) { const u = i / L; y[L - 1 - i] = b[i] * Math.min(1, (1 - u) / 0.35); }
        for (let i = 0; i < 0.01 * fx.sr; i++) y[L + i] = y[L - 1] * (1 - i / (0.01 * fx.sr));
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], tEnd - dur, bus, { vol: vel * 0.34, pan });
    },
    bell: (t, n, vol, pan = 0, dest = bus) => fx.play(fx.bellBuf(ekMidi(n)), t, dest, { vol: vol * 0.25, pan }),
    // the music box: a steel tine at f Hz (a short bright pluck with a long, thin ring), cached per 1/8 semitone
    box(t, f, vol, pan = 0) {
      const sr = fx.sr; if (f > sr * 0.44 || vol < 1e-4) return null;
      const q = Math.round(96 * Math.log2(f / 440)), key = 'box' + q;
      if (!fx.cache[key]) {
        const ff = 440 * Math.pow(2, q / 96), modes = [[ff, 1.1, 1], [ff * 2.0, 0.5, 0.18], [ff * 5.9, 0.12, 0.3], [ff * 9.5, 0.05, 0.12]].filter((m) => m[0] < sr * 0.45);
        const y = fx.hit(modes, { width: 0.0003, len: 3.2 });
        let pk = 0; for (let i = 0; i < y.length; i++) pk = Math.max(pk, Math.abs(y[i]));
        for (let i = 0; i < y.length; i++) y[i] /= pk || 1;
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], t, bus, { vol: vol * 0.2, pan });
    },
    // a low drum (a timpani-like membrane): f the pitch, vol, soft = a wider mallet, dk = decay
    drum(t, vol, f = 41.2, soft = 1, dk = 1) {
      const key = 'drum' + f + '_' + soft + '_' + dk;
      if (!fx.cache[key]) {
        const y = fx.hit(drumModes(f).map(([a, tau, b]) => [a, tau * dk, b]), { width: 0.006 * soft, amp: 1, noise: 0.25, nlen: 0.02, nhp: 300, len: 3.2 * Math.max(dk, 0.3) });
        const pk = EKX.peak(y) || 1; for (let i = 0; i < y.length; i++) y[i] /= pk;
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], t, bus, { vol: vol * 0.5 });
    },
    // a timpani roll from t0 to t1, its level following keys [[t, v], …]
    roll(t0, t1, keys, f = 82.4) {
      for (let t = t0, i = 0; t < t1; t += 0.065 + 0.012 * Math.sin(i * 1.7), i++) {
        let v = keys[0][1];
        for (let k = 1; k < keys.length; k++) if (t >= keys[k - 1][0]) v = keys[k - 1][1] + (keys[k][1] - keys[k - 1][1]) * MathX.clamp((t - keys[k - 1][0]) / (keys[k][0] - keys[k - 1][0]), 0, 1);
        M.drum(t, v * (0.8 + 0.2 * Math.sin(i * 2.3)), f, 1.6, 0.35);
      }
    },
    // a held chord: o.att/rel (s), o.cut → o.cutTo by o.cutAt (Hz), o.keys [[t, level]], o.wave, o.vib (cents),
    // o.glide (cents, from o.glideFrom by o.glideAt: the chord slides), o.wob [cents, rate Hz], o.pan
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
        const f = ekHz(nn);
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
function ekPulse(ctx, dest, t0, t1, notes, step, vol, o = {}) {
  if (t1 - t0 < step) return;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.q || 4;
  lp.frequency.setValueAtTime(o.cut || 600, t0); lp.frequency.linearRampToValueAtTime(o.cutTo || o.cut || 600, t1);
  lp.connect(g); g.connect(dest); g.gain.value = 0;
  notes.forEach((n, k) => {
    const os = ctx.createOscillator(); os.type = o.wave || 'sawtooth'; os.frequency.value = ekHz(n); os.detune.setValueAtTime(k % 2 ? 6 : -6, t0);
    if (o.glide) os.detune.linearRampToValueAtTime((k % 2 ? 6 : -6) + o.glide, t1);
    os.connect(lp); os.start(t0); os.stop(t1 + 0.1);
  });
  for (let t = t0, i = 0; t < t1 - 0.01; t += (o.stepAt ? o.stepAt(t) : step), i++) {
    const acc = o.acc && i % o.acc === 0 ? 1.0 : 0.62, ramp = o.ramp ? o.ramp((t - t0) / (t1 - t0)) : 1, v = vol * 0.05 * acc * ramp, st = o.stepAt ? o.stepAt(t) : step;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.setTargetAtTime(0, t + 0.012, st * (o.decay || 0.28));
  }
}

// the endless rise (a Shepard–Risset glissando): octave-spaced sines whose pitch climbs for ever under a fixed bell-shaped
// loudness window, so new low ones fade in as the high ones fade out. It never arrives: everything kept shrinking.
// o.rate(t) octaves per second, o.env(t) its level (t = film time), o.det (cents, the right channel's offset)
function ekShepard(fx, t0, t1, o = {}) {
  const sr = fx.sr, n = Math.ceil((t1 - t0) * sr), L = new Float32Array(n), R = new Float32Array(n), N = 9, f0 = 27.5;
  const c0 = Math.log2(o.centre || 330) - Math.log2(f0), sg = o.width || 1.25, rate = o.rate || (() => 1 / 26), env = o.env || (() => 1);
  const phL = new Float64Array(N), phR = new Float64Array(N), det = Math.pow(2, (o.det || 7) / 1200);
  let u = 0, eC = env(t0), rC = rate(t0);
  for (let i = 0; i < n; i++) {
    if ((i & 255) === 0) { const t = t0 + i / sr; eC = env(t); rC = rate(t); }
    u += rC / sr; const fr = u - Math.floor(u);
    let l = 0, r = 0;
    for (let k = 0; k < N; k++) {
      const oc = k + fr, f = f0 * Math.pow(2, oc), a = Math.exp(-0.5 * Math.pow((oc - c0) / sg, 2));
      phL[k] += 2 * Math.PI * f / sr; phR[k] += 2 * Math.PI * f * det / sr;
      l += a * Math.sin(phL[k]); r += a * Math.sin(phR[k]);
    }
    L[i] = l * eC; R[i] = r * eC;
  }
  return [L, R];
}

const EK_CH = {
  Em9: ['E2', 'B2', 'G3', 'D4', 'F#4'], Cmaj7: ['C2', 'G2', 'E3', 'B3'], Am9: ['A1', 'E2', 'C3', 'G3', 'B3'], B7sus: ['B1', 'F#2', 'E3', 'A3'],
  Clyd: ['C2', 'G2', 'E3', 'B3', 'F#4'], Gmaj7: ['G1', 'D2', 'B2', 'F#3'], Emaj: ['E2', 'B2', 'G#3', 'B3', 'F#4'], Amaj9: ['A1', 'E2', 'C#3', 'G#3', 'B3'],
  Fmaj7: ['F1', 'C2', 'A2', 'E3'], low: ['E2', 'B2', 'E3'], semi: ['E2', 'F2', 'B2'], cold: ['B5', 'E6', 'F#6'], stab: ['F2', 'E3', 'B3', 'C4'],
  float: ['E3', 'B3', 'F#4', 'A4'],
};
const EK_THEME = ['B4', 'G4', 'A4', 'F#4', 'F4'];        // Leo's lullaby: falling, then a semitone off home (unresolved)
const ekOct = (n, k) => n.replace(/-?\d$/, (d) => String(+d + k));

ekSound('music', 'score', function (ctx, bus, K) {
  const M = ekMusicKit(ctx, K), C = EK_CH, c = ekC, B = ekB, END = EK.end, T0 = EK.tOn;
  const hit = (t, v = 0.9, f = 41.2) => { M.drum(t, v, f, 1.1, 1.8); M.drum(t + 0.012, 0.5 * v, f * 1.5, 1.3, 1.0); };
  const stab = (t, t1, v = 0.36) => { hit(t, 1.0, 30.9); M.drum(t + 0.01, 0.6, 46.2, 1.0, 1.0); M.strings(t, t1, C.stab, v, { att: 0.02, rel: 1.2, cut: 3000, cutTo: 800, cutAt: t1 }); };
  // the lullaby on your piano (it stays where it is)
  const motif = (t, o = {}) => (o.notes || EK_THEME).slice(0, o.n || 5).forEach((n, i) => {
    const tt = t + i * (o.gap || 1.6), v = (o.vel || 0.42) * (i ? 0.88 : 1) * (o.fade ? Math.pow(o.fade, i) : 1);
    M.piano(tt, ekOct(n, o.oct || 0), v, o.dur || 3.2, [-0.25, 0.2, -0.15, 0.25, 0][i]);
  });
  // the lullaby on the world's music box: each note at its pitch × the world's (an octave up every 30 s), fading as it
  // climbs past your hearing; it repeats from t0 to t1, a note every gap
  const box = (t0, t1, gap = 0.62, vol = 0.5, oct = 0) => {
    for (let t = t0, i = 0; t < t1; t += gap * (i % 5 === 4 ? 2.2 : 1), i++) {
      const f = ekHz(ekOct(EK_THEME[i % 5], oct)), w = ekWorldRate(t), a = ekAudible(t, f);
      if (a > 0.01) M.box(t, f * w, vol * a * (i % 5 === 0 ? 1 : 0.8), [-0.3, 0.25, -0.1, 0.3, 0][i % 5]);
    }
  };
  const rise = (t0, t1, lvl, rate, centre = 330) => {
    const e = (t) => lvl * ekEv(t, t0, t0 + 2.5) * (1 - ekEv(t, t1 - 0.6, t1));
    const [Lx, Rx] = ekShepard(K.fx, t0, t1, { rate: typeof rate === 'function' ? rate : () => rate, env: e, centre, width: 1.3 });
    K.fx.play(Lx, t0, M.bus, { xr: Rx, vol: 1 });
  };
  const drums = (t0, t1, p, v0, v1, f = 41.2) => { for (let t = t0, i = 0; t < t1 - 0.05; t += p, i++) { const u = (t - t0) / (t1 - t0); M.drum(t, (v0 + (v1 - v0) * u) * (i % 2 ? 0.7 : 1), f, 1.2, 0.6); } };
  const twinkle = (t0, t1, gap, notes, vol) => { const rr = new RNG(Math.round(t0 * 100)); for (let t = t0; t < t1; t += gap * (0.7 + 0.6 * rr.next())) M.bell(t, notes[rr.int(0, notes.length - 1)], vol * (0.6 + 0.4 * rr.next()), rr.range(-0.8, 0.8)); };

  // ================================================================== the title: the lullaby; 6:49:00: it starts
  M.strings(0, B('start') + 0.5, C.cold, 0.05, { att: 0.4, rel: 0.6, cut: 8000, wave: 'triangle', vib: 4 });
  M.strings(0, B('out') + 0.4, C.Em9, 0.2, { att: 0.3, rel: 0.6, cut: 700, cutTo: 1300, cutAt: B('out') });
  box(0.15, B('out') - 0.4, 0.62, 0.55);
  M.rpiano(T0, 'E2', 0.5, 2.0); M.rpiano(T0, 'B2', 0.3, 2.0);
  hit(T0 + 0.005, 0.7, 30.9);

  // ================================================================== 6:49 AM: the tent closes in
  { const t0 = B('start');
    M.strings(t0, B('out') + 0.4, C.semi, 0.1, { att: 4, rel: 0.6, cut: 380 });
    ekPulse(ctx, M.bus, c('start', 1), B('out'), ['E2', 'B2', 'E3'], 0.5, 0.6, { cut: 360, cutTo: 900, acc: 4, decay: 0.3, ramp: (u) => 0.4 + 0.6 * u });
    motif(c('start', 2) + 0.3, { gap: 1.3, vel: 0.3, n: 4, oct: -1, dur: 2.6 });
    M.roll(B('out') - 1.6, B('out') - 0.02, [[B('out') - 1.6, 0.04], [B('out') - 0.2, 0.45]], 61.7); }

  // ================================================================== out through the roof
  { const t0 = B('out');
    stab(t0 + 0.01, t0 + 3.5, 0.34);
    M.prog([[t0 + 0.4, C.Em9], [c('out', 1), C.Cmaj7]], B('rule') + 0.4, 0.28, { cut: 900, cutTo: 1600 });
    M.strings(c('out', 1), B('rule') + 0.4, C.cold, 0.04, { att: 2, rel: 1, cut: 9000, wave: 'triangle', vib: 3 }); }

  // ================================================================== the rule: Poincaré
  { const t0 = B('rule');
    M.prog([[t0, C.Clyd], [c('rule', 1), C.Gmaj7], [c('rule', 2), C.low]], B('leo') + 0.3, 0.24, { cut: 1300, lastRel: 0.6 });
    twinkle(t0 + 0.5, c('rule', 2) - 0.5, 1.9, ['E6', 'B5', 'F#6', 'G5'], 0.13);
    { const t = c('rule', 2) + 0.05; M.piano(t, 'E1', 0.5, 5); M.piano(t + 0.01, 'B1', 0.32, 5); M.drum(t, 0.55, 30.9, 1.4, 1.6); } }

  // ================================================================== Leo: you're growing; his voice
  { const t0 = B('leo');
    M.prog([[t0, C.Em9], [c('leo', 1), C.Cmaj7], [B('voice'), C.Am9], [c('voice', 1), C.B7sus]], B('weight') + 0.3, 0.26, { cut: 900, lastRel: 0.6 });
    box(t0 + 0.3, c('voice', 1) + 3.5, 0.55, 0.5);
    ekPulse(ctx, M.bus, c('voice', 1), B('weight'), ['E3', 'B3'], 0.36, 0.45, { wave: 'triangle', cut: 2400, acc: 2, decay: 0.16 }); }

  // ================================================================== weight: half the pull; you pick him up
  { const t0 = B('weight');
    M.strings(t0, c('weight', 2) + 0.4, C.float, 0.16, { att: 1.5, rel: 0.8, cut: 2600, wave: 'triangle', vib: 9, wob: [14, 0.2] });
    M.strings(t0, c('weight', 2) + 0.4, C.low, 0.18, { att: 1.5, rel: 0.8, cut: 260 });
    M.rpiano(c('weight', 1) + 2.4, 'B3', 0.32, 2.2); M.rpiano(c('weight', 1) + 2.4, 'E4', 0.24, 2.2);
    M.prog([[c('weight', 2), C.Cmaj7], [c('weight', 2) + 3.2, C.Em9]], B('neighbours') + 0.3, 0.3, { cut: 1100, lastRel: 0.5 });
    motif(c('weight', 2) + 0.5, { gap: 1.2, vel: 0.34, n: 5, dur: 3 }); }

  // ================================================================== the neighbours; your voice; the quake
  { const t0 = B('neighbours'), tq = B('rumble') + 5.2;
    M.strings(t0, B('hush') + 0.3, C.low, 0.3, { att: 1.2, rel: 0.8, cut: 240, cutTo: 420, cutAt: B('rumble') });
    M.strings(t0 + 1, B('hush') + 0.3, C.semi, 0.2, { att: 3, rel: 0.8, cut: 400, wob: [10, 0.15] });
    ekPulse(ctx, M.bus, t0 + 0.4, B('rumble'), ['E2', 'B2'], 0.5, 0.62, { cut: 300, cutTo: 560, acc: 2, decay: 0.3 });
    drums(c('neighbours', 1), B('rumble') - 0.2, 1.0, 0.25, 0.45);
    stab(c('neighbours', 2) + 0.02, c('neighbours', 2) + 3.5, 0.3);
    // the quake: a roll that swells under "like an earthquake", three blows
    M.roll(c('rumble', 0) + 1.0, c('rumble', 1) + 0.6, [[c('rumble', 0) + 1.0, 0.05], [c('rumble', 1), 0.55], [c('rumble', 1) + 0.6, 0.3]], 49);
    [0, 0.9, 1.7].forEach((d, i) => hit(c('rumble', 1) + 0.6 + d, 0.9 - 0.15 * i, 30.9));
    void tq; }

  // ================================================================== the hush: the music box climbs out of hearing
  { const t0 = B('hush');
    M.strings(t0, B('quiet') + 0.4, C.cold, 0.05, { att: 2, rel: 1.5, cut: 9000, wave: 'triangle', vib: 4 });
    M.strings(t0, B('quiet') + 0.4, C.low, 0.14, { att: 2, rel: 1.5, cut: 200 });
    box(t0 + 0.2, c('hush', 2) + 2.0, 0.45, 0.75);
    M.piano(c('hush', 2) + 0.3, 'E2', 0.32, 5); M.piano(c('hush', 2) + 0.31, 'F2', 0.18, 5); }

  // ================================================================== quiet: only you (the drone; your breath and heart are in the amb stem)
  { const t0 = B('quiet');
    M.strings(t0, B('sunrise') + 0.3, ['E1', 'B1'], 0.22, { att: 2.5, rel: 0.4, cut: 160 });
    M.strings(c('quiet', 1), B('sunrise') + 0.3, ['B4', 'F#5'], 0.03, { att: 3, rel: 0.4, cut: 3000, wave: 'triangle', vib: 3 });
    M.rpiano(B('sunrise'), 'E3', 0.4, 2.6); M.rpiano(B('sunrise'), 'B3', 0.3, 2.6); M.rpiano(B('sunrise'), 'G#4', 0.24, 2.6); }

  // ================================================================== sunrise: the score opens (E major)
  { const t0 = B('sunrise');
    M.drum(t0 + 0.01, 0.5, 41.2, 1.6, 1.4);
    M.prog([[t0, C.Emaj], [c('sunrise', 0) + 2.6, C.Amaj9]], B('shadow') + 0.4, 0.34, { cut: 1200, cutTo: 3000, att: 1.2 });
    M.strings(t0 + 0.5, B('shadow') + 0.4, ['B5', 'E6', 'G#6'], 0.05, { att: 2.5, rel: 1, cut: 9000, wave: 'triangle', vib: 4 });
    motif(c('sunrise', 0) + 0.4, { notes: ['B4', 'G#4', 'A4', 'F#4', 'E4'], gap: 1.1, vel: 0.36, n: 5, dur: 4 }); }

  // ================================================================== your shadow on the peaks: down a semitone into minor
  { const t0 = B('shadow'), t1 = c('shadow', 1);
    M.strings(t0, t1 + 0.3, C.Emaj, 0.3, { att: 0.4, rel: 0.3, cut: 2400, cutTo: 900, cutAt: t1 });
    M.strings(t1 - 0.1, B('peaks') + 0.4, C.Em9, 0.3, { att: 0.3, rel: 0.6, cut: 900, glide: -40, glideFrom: t1, glideAt: B('peaks') });
    hit(t1 + 0.01, 0.75, 30.9);
    ekPulse(ctx, M.bus, t1 + 0.3, B('peaks'), ['E2', 'B2'], 0.6, 0.5, { cut: 300, acc: 2, decay: 0.32 }); }

  // ================================================================== the peaks at your waist
  { const t0 = B('peaks');
    M.prog([[t0, C.Cmaj7], [c('peaks', 1), ['E1', 'B1', 'E2', 'G2']]], B('air') + 0.4, 0.36, { cut: 600, cutTo: 1400, lastRel: 0.8 });
    drums(t0 + 0.3, B('air') - 0.3, 1.4, 0.3, 0.5, 36.7);
    M.strings(c('peaks', 1), B('air') + 0.4, C.cold, 0.04, { att: 2, rel: 0.8, cut: 9000, wave: 'triangle', vib: 3 }); }

  // ================================================================== putting him down: the lullaby on your piano, alone; it stops unresolved
  { const t0 = B('air'), tg = c('air', 4);
    M.strings(t0, tg + 0.3, C.low, 0.16, { att: 2, rel: 1.0, cut: 220 });
    M.strings(c('air', 1), tg + 0.3, ['G3', 'B3', 'D4'], 0.07, { att: 3, rel: 1.0, cut: 1400, vib: 5 });
    motif(c('air', 1) + 0.2, { gap: 1.7, vel: 0.36, n: 4, dur: 3.6 });
    motif(c('air', 3) - 0.2, { gap: 1.4, vel: 0.3, n: 5, dur: 3.6, fade: 0.85 });
    M.bell(c('air', 3) + 0.3, 'B6', 0.1, 0.4);
    M.strings(tg, B('escape') + 0.3, ['E2', 'F2', 'B2'], 0.16, { att: 1.0, rel: 0.4, cut: 380 }); }

  // ================================================================== 14 grams: hold on
  { const t0 = B('escape');
    M.prog([[t0, C.Am9], [c('escape', 1), C.B7sus]], B('plane') + 0.3, 0.28, { cut: 800, cutTo: 1500 });
    ekPulse(ctx, M.bus, t0 + 0.2, B('plane'), ['E2', 'B2', 'E3'], 0.4, 0.66, { cut: 400, cutTo: 1100, acc: 4, decay: 0.28 });
    stab(c('escape', 1) + 0.02, c('escape', 1) + 3, 0.3); }

  // ================================================================== the airliner; the curve; the sky
  { const t0 = B('plane');
    M.strings(t0, B('curve') + 0.4, C.cold, 0.06, { att: 2, rel: 1, cut: 9000, wave: 'triangle', vib: 5 });
    M.strings(t0, B('curve') + 0.4, C.semi, 0.16, { att: 2, rel: 1, cut: 420, wob: [8, 0.12] });
    rise(t0 + 0.5, END + 0.05, 0.010, (t) => 1 / (34 - 22 * ekEv(t, B('plane'), END)), 300);
    M.drum(B('curve') + 0.01, 0.55, 41.2, 1.6, 1.4);
    M.prog([[B('curve'), C.Clyd], [c('curve', 0) + 2.6, C.Gmaj7]], B('sky') + 0.4, 0.34, { cut: 1100, cutTo: 2600 });
    twinkle(B('sky') + 0.5, B('lift') - 0.5, 1.2, ['E6', 'B6', 'F#6', 'D6', 'A6'], 0.12);
    M.strings(B('sky'), B('lift') + 0.4, ['E1', 'B1', 'F#2'], 0.26, { att: 1.5, rel: 0.6, cut: 200 });
    M.piano(c('sky', 1) + 0.2, 'E1', 0.4, 5); }

  // ================================================================== it can't hold you: you hold it
  { const t0 = B('lift');
    stab(t0 + 0.01, t0 + 4, 0.36);
    M.prog([[t0 + 0.6, C.Em9], [c('lift', 0) + 2.4, C.Cmaj7]], B('moon') + 0.4, 0.3, { cut: 800, cutTo: 1500 });
    ekPulse(ctx, M.bus, t0 + 0.6, B('moon'), ['E2', 'B2'], 0.34, 0.6, { cut: 380, cutTo: 900, acc: 2, decay: 0.3 }); }

  // ================================================================== the Moon
  { const t0 = B('moon');
    M.strings(t0, B('house') + 0.3, ['C2', 'G2', 'E3', 'B3', 'D4'], 0.26, { att: 1.5, rel: 0.6, cut: 1300 });
    twinkle(t0 + 0.6, B('house') - 0.5, 1.5, ['B5', 'E6', 'G6'], 0.12);
    M.roll(B('house') - 1.8, B('house') - 0.03, [[B('house') - 1.8, 0.04], [B('house') - 0.2, 0.5]], 55); }

  // ================================================================== a house, a car, smaller than you: three blows, a semitone apart
  { const t0 = B('house');
    [[c('house', 0), 41.2, ['E2', 'B2', 'G3']], [c('house', 1), 43.7, ['F2', 'C3', 'G#3']], [c('house', 2), 46.2, ['F#2', 'C#3', 'A3']]].forEach(([t, f, ch], i, A) => {
      hit(t - 0.05, 0.9, f); M.strings(t - 0.05, (A[i + 1] ? A[i + 1][0] : B('ball')) + 0.2, ch, 0.32, { att: 0.05, rel: 0.3, cut: 1500, cutTo: 700 });
    });
    ekPulse(ctx, M.bus, t0 + 0.2, B('ball') - 0.05, ['E2', 'B2', 'E3'], 0.3, 0.7, { cut: 500, cutTo: 1600, acc: 2, decay: 0.26 });
    drums(c('house', 1), B('ball') - 0.1, 0.5, 0.3, 0.55); }

  // ================================================================== 30 cm, 75 kg: silence, one bell
  { const t0 = B('ball');
    M.bell(t0 + 0.4, 'E6', 0.22, -0.2); M.bell(t0 + 0.42, 'B6', 0.1, 0.3);
    M.strings(t0 + 0.6, B('end') + 0.4, ['E3', 'B3'], 0.06, { att: 2.5, rel: 0.8, cut: 1200 }); }

  // ================================================================== Leo is on it; 4 minutes; 10
  { const t0 = B('end');
    M.prog([[t0, C.Em9], [c('end', 1), C.Cmaj7], [c('end', 1) + 3.6, C.B7sus]], B('question') + 0.05, 0.3, { cut: 900, cutTo: 1700, lastRel: 0.05 });
    motif(t0 + 0.4, { gap: 1.25, vel: 0.36, n: 5, dur: 3.4 });
    ekPulse(ctx, M.bus, c('end', 1), B('question'), ['E2', 'B2', 'E3'], 0.36, 0.66, { cut: 420, cutTo: 1300, acc: 4, decay: 0.3, ramp: (u) => 0.5 + 0.5 * u });
    M.roll(B('question') - 1.8, B('question') - 0.03, [[B('question') - 1.8, 0.05], [B('question') - 0.3, 0.48]], 55); }

  // ================================================================== the question: the lullaby stops a semitone off home, cut on the last frame
  { const t = B('question') + 0.02;
    hit(t, 1.0, 30.9);
    M.strings(t, END + 0.05, C.stab, 0.3, { att: 0.03, rel: 0.02, cut: 2400 });
    M.strings(t, END + 0.05, C.low, 0.28, { att: 0.5, rel: 0.02, cut: 200 });
    motif(c('question', 0) + 0.2, { notes: ['B4', 'G4', 'A4', 'F4'], gap: 0.7, vel: 0.4, n: 4, dur: 1.8 }); }
});
EK_SOUND_FNS.push(ekShepard, ekPulse, ekMusicKit);
window.EK_THEME = EK_THEME;
