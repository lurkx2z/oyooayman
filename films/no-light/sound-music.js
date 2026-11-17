/* =====================================================================
   SOUND · MUSIC — an original score, all synthesised (the music kit of the gravity films, via the light films and the
   shadow film): string pads, a felt piano (also played backwards, so notes swell up out of nothing), glass bells, a low
   drum, a heartbeat, a synth pulse, the endless rise and fall. Its idea is the film's: the major third is the light.
   The title is in E major, bright, with bells; when the light goes the whole cue drains through a closing filter, and
   from then on the score is in E minor. Its theme falls to the tonic and lifts a semitone off it, unresolved.
     daylight      E major, bells, a skating pulse; drained to nothing at 2:40 PM
     the dark      a low thud and a drone; the theme on the low piano
     gliding       the blades' pulse, rising to the fall
     infrared      the heat view: cold glass, a G lydian bloom; "You'd be dust": a stinger
     the lake      your hand; 240 people; the heartbeat starts; the grab: a stinger in the black
     the Sun       the only warmth (C lydian), and an endless fall as it sets
     the fire      the man's steps as a pulse, cut dead when he stops
     the world     wide strings and the whole theme; the rise under every plane still flying
     the road      a low ostinato; the hit is silent: the score holds its breath 1.5 s, until the bang
     the ice       the pulse speeds up, the endless rise; the crack; the sink: cut dead
     the dark      the singing ice: the score steps back to a drone; "Someone is in the water": a stinger
     the crawl     a slow pulse and a heartbeat; the cracks: a stinger in the black; the reach: the strings glide up a
                   semitone, the heartbeat quickens; the question: the theme cut short, on the last frame
   ===================================================================== */


// the kit: string pads (three detuned oscillators per note through low-passes), felt piano (also reversed), bells,
// a low drum and a heartbeat
function nlMusicKit(ctx, K) {
  if (K._music) return K._music;
  const fx = K.fx, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(); bus.connect(K.bus);
  const hall = fx.ir(4.4, { bright: 0.5, damp: 2.8, shape: 2.0, pre: 0.025, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.55;
  bus.connect(hall); hall.connect(wet); wet.connect(K.bus);
  const drumModes = (f) => [[f, 0.7, 1], [f * 1.51, 0.45, 0.5], [f * 1.99, 0.3, 0.35], [f * 2.44, 0.2, 0.2], [f * 3.1, 0.12, 0.12]];
  const M = {
    bus,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4, dest = bus) => {
      const b = fx.pianoBuf(nlMidi(n)), len = Math.min(b.length, Math.ceil((dur + fade + 0.05) * fx.sr));
      return fx.play(b.subarray(0, len), t, dest, { vol: vel * 0.34, pan, stop: t + dur + fade, fade });
    },
    // a piano note played backwards: it swells up out of nothing and stops dead on its attack at tEnd
    rpiano(tEnd, n, vel, dur = 1.6, pan = 0) {
      const key = 'rp' + n + '_' + dur;
      if (!fx.cache[key]) {
        const b = fx.pianoBuf(nlMidi(n)), L = Math.min(b.length, Math.ceil(dur * fx.sr)), y = new Float32Array(L + Math.ceil(0.01 * fx.sr));
        for (let i = 0; i < L; i++) { const u = i / L; y[L - 1 - i] = b[i] * Math.min(1, (1 - u) / 0.35); }
        for (let i = 0; i < 0.01 * fx.sr; i++) y[L + i] = y[L - 1] * (1 - i / (0.01 * fx.sr));
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], tEnd - dur, bus, { vol: vel * 0.34, pan });
    },
    bell: (t, n, vol, pan = 0, dest = bus) => fx.play(fx.bellBuf(nlMidi(n)), t, dest, { vol: vol * 0.25, pan }),
    bellCut: (t, n, vol, d = 0.18, pan = 0) => fx.play(fx.bellBuf(nlMidi(n)), t, bus, { vol: vol * 0.25, pan, stop: t + d, fade: 0.05 }),
    // a low drum (a timpani-like membrane): f the pitch, vol, soft = a wider mallet, dk = decay
    drum(t, vol, f = 36.7, soft = 1, dk = 1) {
      const key = 'drum' + f + '_' + soft + '_' + dk;
      if (!fx.cache[key]) {
        const y = fx.hit(drumModes(f).map(([a, tau, b]) => [a, tau * dk, b]), { width: 0.006 * soft, amp: 1, noise: 0.25, nlen: 0.02, nhp: 300, len: 3.2 * Math.max(dk, 0.3) });
        const pk = NLX.peak(y) || 1; for (let i = 0; i < y.length; i++) y[i] /= pk;
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
        const f = nlHz(nn);
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
function nlPulse(ctx, dest, t0, t1, notes, step, vol, o = {}) {
  if (t1 - t0 < step) return;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.q || 4;
  lp.frequency.setValueAtTime(o.cut || 600, t0); lp.frequency.linearRampToValueAtTime(o.cutTo || o.cut || 600, t1);
  lp.connect(g); g.connect(dest); g.gain.value = 0;
  notes.forEach((n, k) => {
    const os = ctx.createOscillator(); os.type = o.wave || 'sawtooth'; os.frequency.value = nlHz(n); os.detune.setValueAtTime(k % 2 ? 6 : -6, t0);
    if (o.glide) os.detune.linearRampToValueAtTime((k % 2 ? 6 : -6) + o.glide, t1);
    os.connect(lp); os.start(t0); os.stop(t1 + 0.1);
  });
  for (let t = t0, i = 0; t < t1 - 0.01; t += (o.stepAt ? o.stepAt(t) : step), i++) {
    const acc = o.acc && i % o.acc === 0 ? 1.0 : 0.62, ramp = o.ramp ? o.ramp((t - t0) / (t1 - t0)) : 1, v = vol * 0.05 * acc * ramp, st = o.stepAt ? o.stepAt(t) : step;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.setTargetAtTime(0, t + 0.012, st * (o.decay || 0.28));
  }
}




// the endless rise (a Shepard–Risset glissando): octave-spaced sines whose pitch climbs for ever under a fixed bell-shaped
// loudness window, so new low ones fade in as the high ones fade out. It is light, getting faster, and it never arrives.
// o.rate(t) octaves per second, o.env(t) its level (t = film time), o.det (cents, the right channel's offset)
function nlShepard(fx, t0, t1, o = {}) {
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




const NL_CH = {
  Emaj: ['E2', 'B2', 'G#3', 'D#4', 'F#4'],                                    // daylight: the major third is the light
  Em9: ['E2', 'B2', 'G3', 'D4', 'F#4'], Cmaj7: ['C2', 'G2', 'E3', 'B3'], Am9: ['A1', 'E2', 'C3', 'G3', 'B3'], B7sus: ['B1', 'F#2', 'E3', 'A3'],
  Flyd: ['F1', 'C2', 'A2', 'E3', 'B3'], Glyd: ['G1', 'D2', 'B2', 'F#3', 'A3'], Clyd: ['C2', 'G2', 'E3', 'B3', 'F#4'],
  Em: ['E2', 'B2', 'E3', 'G3', 'B3'],
  low: ['E2', 'B2', 'E3'], semi: ['E2', 'F2', 'B2'], cold: ['B5', 'E6', 'F#6'], stab: ['F2', 'E3', 'B3', 'C4'],
};
const NL_THEME = ['B4', 'G4', 'F#4', 'E4', 'F4'];        // falling to the tonic, then a semitone off it: unresolved
const nlOct = (n, k) => n.replace(/-?\d$/, (d) => String(+d + k));
// a word's film time in a caption (beat id, caption k, word j)
const nlWord = (id, k, j) => nlCap(id, k).words[Math.min(j, nlCap(id, k).words.length - 1)].start;

nlSound('music', 'score', function (ctx, bus, K) {
  const M = nlMusicKit(ctx, K), C = NL_CH, c = nlC, B = nlB, F = nlFilmAt, E = NLE, END = NL.end, T0 = NL.tOn;
  const glass = (t, v = 0.3, n = 'E6') => { M.bell(t, n, v, -0.3); M.bell(t + 0.02, nlOct(n, 1), v * 0.4, 0.3); };
  const hit = (t, v = 0.9, f = 41.2) => { M.drum(t, v, f, 1.1, 1.8); M.drum(t + 0.012, 0.5 * v, f * 1.5, 1.3, 1.0); };
  const stab = (t, t1, v = 0.36) => { hit(t, 1.0, 30.9); M.drum(t + 0.01, 0.6, 46.2, 1.0, 1.0); M.strings(t, t1, C.stab, v, { att: 0.02, rel: 1.2, cut: 3000, cutTo: 800, cutAt: t1 }); };
  const motif = (t, o = {}) => (o.notes || NL_THEME).slice(0, o.n || 5).forEach((n, i) => M.piano(t + i * (o.gap || 1.6), nlOct(n, o.oct || 0), (o.vel || 0.42) * (i ? 0.88 : 1), o.dur || 3.2, [-0.25, 0.2, -0.15, 0.25, 0][i]));
  const beats = (t0, t1, p0, p1, v0, v1) => { for (let t = t0; t < t1 - 0.2;) { const u = (t - t0) / (t1 - t0); M.beat(t, v0 + (v1 - v0) * u); t += p0 + (p1 - p0) * u; } };
  const twinkle = (t0, t1, d0, d1, notes, vol) => { const r = new RNG(Math.round(t0 * 100)); for (let t = t0; t < t1;) { M.bell(t, notes[r.int(0, notes.length - 1)], vol * (0.6 + 0.4 * r.next()), r.range(-0.8, 0.8)); const u = (t - t0) / (t1 - t0); t += (d0 + (d1 - d0) * u) * r.range(0.6, 1.4); } };
  const rise = (t0, t1, lvl, rate, centre = 360) => { const e = (t) => lvl * nlEv(t, t0, t0 + 2) * (1 - nlEv(t, t1 - 1.5, t1)); const [Lx, Rx] = nlShepard(K.fx, t0, t1, { rate: () => rate, env: e, centre, width: 1.3 }); K.fx.play(Lx, t0, M.bus, { xr: Rx, vol: 1 }); };

  // ================================================================== daylight (the title); the light goes
  { const day = ctx.createBiquadFilter(), dg = ctx.createGain(); day.type = 'lowpass'; day.Q.value = 0.8;
    day.frequency.setValueAtTime(15000, 0); day.frequency.setValueAtTime(15000, T0 - 0.04); day.frequency.exponentialRampToValueAtTime(110, T0 + 0.3);
    dg.gain.setValueAtTime(1, 0); dg.gain.setValueAtTime(1, T0 + 0.05); dg.gain.linearRampToValueAtTime(0, T0 + 0.6); day.connect(dg); dg.connect(M.bus);
    M.strings(0, T0 + 0.7, C.Emaj, 0.3, { att: 0.25, rel: 0.1, cut: 3200, dest: day });
    M.strings(0, T0 + 0.7, ['B5', 'E6', 'G#6'], 0.05, { att: 0.4, rel: 0.1, cut: 9000, wave: 'triangle', vib: 3, dest: day });
    ['B5', 'G#5', 'F#5', 'E5', 'G#5'].forEach((n, i) => M.bell(0.1 + i * 0.62, n, 0.3, [-0.3, 0.2, -0.1, 0.3, 0][i], day));
    nlPulse(ctx, day, 0, T0 + 0.6, ['E3', 'B3', 'G#4'], 0.4, 0.55, { cut: 2600, acc: 2, decay: 0.25 }); }

  // ================================================================== 2:40 PM: the dark
  hit(T0 + 0.02, 0.95, 27.5);
  M.strings(T0, B('heat') + 0.5, C.low, 0.3, { att: 1.6, rel: 1.0, cut: 220, cutTo: 420, cutAt: B('skaters') });
  M.strings(T0 + 2, B('skaters') + 0.4, C.semi, 0.14, { att: 3, rel: 0.6, cut: 420 });
  motif(c('start', 0) + 1.2, { gap: 1.8, vel: 0.36, n: 4, dur: 4, oct: -1 });
  glass(c('start', 1) + 0.1, 0.16, 'B6');
  { const t = c('start', 2) + 0.1; M.piano(t, 'E2', 0.42, 5); M.piano(t + 0.02, 'B2', 0.3, 5); }

  // ================================================================== still gliding, blind; the fall
  { const t0 = B('skaters') + 0.2, tf = F(E.fall);
    M.prog([[B('skaters'), C.Em9], [c('skaters', 0) + 2.4, C.Cmaj7], [c('skaters', 1), C.B7sus]], tf + 0.3, 0.28, { cut: 900, lastRel: 0.2 });
    nlPulse(ctx, M.bus, t0, tf, ['E2', 'B2', 'E3'], 0.36, 0.75, { cut: 450, cutTo: 1400, acc: 4, decay: 0.3, ramp: (u) => 0.55 + 0.45 * u });
    M.rpiano(c('skaters', 1), 'E3', 0.36, 1.6, 0); M.rpiano(c('skaters', 1), 'F3', 0.26, 1.6, 0.2);
    M.roll(tf - 1.6, tf - 0.03, [[tf - 1.6, 0.05], [tf - 0.2, 0.4]], 55);
    hit(tf, 0.85, 30.9);
    M.strings(tf, B('heat') + 0.4, C.low, 0.22, { att: 0.1, rel: 0.5, cut: 200 }); }

  // ================================================================== infrared; the physics
  M.prog([[B('heat'), C.Glyd], [c('heat', 1), C.Clyd]], B('rule') + 0.5, 0.3, { cut: 1300 });
  M.strings(B('heat'), B('rule') + 0.4, C.cold, 0.05, { att: 3, rel: 1, cut: 6000, wave: 'triangle', vib: 2 });
  twinkle(B('heat') + 0.6, c('heat', 1) + 3.5, 1.1, 0.7, ['B5', 'E6', 'F#6', 'B6'], 0.08);
  glass(nlWord('heat', 0, 11), 0.22, 'E6');
  M.piano(c('heat', 1) + 0.05, 'G2', 0.36, 5);
  M.prog([[B('rule'), C.Am9], [c('rule', 2), C.Em9]], B('body') + 0.5, 0.3, { cut: 1000 });
  M.roll(c('rule', 0) + 3.0, c('rule', 1) - 0.03, [[c('rule', 0) + 3.0, 0.04], [c('rule', 1) - 0.3, 0.45]], 55);
  stab(c('rule', 1) + 0.02, c('rule', 2) - 0.2, 0.34);                                   // "You'd be dust."
  M.bell(nlWord('rule', 2, 8), 'E6', 0.24, -0.3); M.bell(nlWord('rule', 2, 10), 'B6', 0.22, 0.3);

  // ================================================================== your hand; 240 people; the grab
  M.prog([[B('body'), C.Cmaj7], [c('body', 1), C.Em9]], B('count') + 0.4, 0.26, { cut: 900 });
  motif(F(E.hand[0]) + 0.6, { gap: 1.5, vel: 0.36, n: 3 });
  { const t = c('body', 1) + 0.1; glass(t, 0.16, 'F#6'); motif(t + 0.6, { gap: 1.4, vel: 0.32, n: 5, oct: -1 }); }
  M.prog([[B('count'), C.Am9], [c('count', 1), C.B7sus]], F(E.grab) + 0.02, 0.3, { cut: 800, lastRel: 0.02 });
  beats(B('count') + 0.5, F(E.grab) - 0.1, 1.3, 1.05, 0.14, 0.3);
  { const t = c('count', 1) + 0.1; M.piano(t, 'B1', 0.4, 5); M.piano(t + 0.02, 'F2', 0.3, 5); }
  M.strings(c('count', 1), F(E.grab) + 0.02, ['B4', 'C5'], 0.08, { att: 2, rel: 0.02, cut: 3000, glide: 50, glideFrom: c('count', 1) + 1, glideAt: F(E.grab) });
  { const tg = F(E.grab); stab(tg, c('grab', 1) + 0.2, 0.38); M.strings(tg, tg + 2.4, ['F6', 'E6'], 0.07, { att: 0.02, rel: 1.6, cut: 8000, vib: 18 }); }
  M.prog([[c('grab', 1), C.Em9]], B('help') + 0.4, 0.28, { cut: 800 });
  beats(c('grab', 1), B('help'), 1.0, 0.95, 0.28, 0.32);
  motif(c('grab', 1) + 0.5, { gap: 1.2, vel: 0.34, n: 3 });

  // ================================================================== nobody is coming
  M.prog([[B('help'), C.Am9], [c('help', 0) + 2.8, C.Flyd], [c('help', 1), C.Em]], B('sun') + 0.4, 0.3, { cut: 850 });
  nlPulse(ctx, M.bus, B('help') + 0.3, nlWord('help', 1, 6), ['E2', 'B2'], 0.9, 0.7, { cut: 260, cutTo: 520, acc: 2, ramp: (u) => 0.5 + 0.5 * u });
  { const t = nlWord('help', 1, 6); hit(t, 0.8, 30.9); M.piano(t, 'E2', 0.4, 5); M.strings(t, B('sun') + 0.3, C.semi, 0.2, { att: 0.5, rel: 0.6, cut: 380 }); }

  // ================================================================== the Sun: the only warmth; an endless fall as it sets
  M.prog([[B('sun'), C.Clyd], [c('sun', 0) + 2.8, C.Glyd], [c('sun', 1), C.Am9]], B('fire') + 0.4, 0.32, { cut: 1500 });
  rise(c('sun', 0) + 1, c('sun', 1) + 2.5, 0.05, -1 / 34, 420);
  motif(c('sun', 0) + 1.2, { gap: 1.6, vel: 0.3, n: 4 });
  { const t = nlWord('sun', 1, 5); glass(t, 0.2, 'B6'); M.piano(t, 'A1', 0.36, 5); }

  // ================================================================== the bonfire: the man's steps, cut dead when he stops
  { const t0 = c('fire', 1) - 0.3, ts = F(E.manStop);
    M.prog([[B('fire'), C.Em9], [c('fire', 1), C.Cmaj7]], ts + 0.02, 0.3, { cut: 900, lastRel: 0.02 });
    nlPulse(ctx, M.bus, t0, ts, ['E2', 'B2', 'E3'], 0.56, 0.8, { cut: 380, cutTo: 1600, acc: 4, decay: 0.3, ramp: (u) => 0.5 + 0.5 * u });
    beats(t0 + 0.2, ts - 0.2, 0.95, 0.7, 0.24, 0.45);
    M.roll(ts - 1.8, ts - 0.03, [[ts - 1.8, 0.06], [ts - 0.25, 0.5]], 61.7);
    hit(ts, 0.95, 30.9); M.bell(ts + 0.02, 'F6', 0.22, 0);
    M.strings(ts + 0.05, nlWord('fire', 2, 8) + 0.1, C.low, 0.26, { att: 0.05, rel: 0.4, cut: 260 });
    const w = nlWord('fire', 2, 8); M.strings(w, B('world') + 0.4, C.Flyd, 0.26, { att: 0.6, rel: 0.6, cut: 900 }); M.piano(w, 'F2', 0.36, 4); }

  // ================================================================== the road: the hit is silent; the score holds its breath for the bang
  { const t0 = B('road'), th = F(E.hit), te = F(E.hear);
    M.prog([[t0, C.Em9], [c('road', 1), C.Cmaj7], [c('road', 1) + 2.4, C.B7sus]], th + 0.02, 0.3, { cut: 900, lastRel: 0.02 });
    nlPulse(ctx, M.bus, t0 + 0.3, th, ['E2', 'B2'], 0.48, 0.75, { cut: 300, cutTo: 900, acc: 4, decay: 0.3, ramp: (u) => 0.45 + 0.55 * u });
    beats(c('road', 1), th - 0.1, 0.9, 0.75, 0.25, 0.4);
    M.strings(th, te + 0.05, ['B5', 'C6'], 0.05, { att: 0.05, rel: 0.02, cut: 6000, wave: 'triangle', vib: 0 });
    hit(te, 1.0, 27.5); M.drum(te + 0.01, 0.7, 41.2, 1.0, 1.2);
    M.strings(te, B('slide') + 0.4, C.stab, 0.34, { att: 0.02, rel: 1.4, cut: 2600, cutTo: 700, cutAt: B('slide') }); }

  // ================================================================== the car on the lake
  M.prog([[B('slide'), C.Am9], [c('slide', 1), C.Flyd]], B('ice') + 0.4, 0.3, { cut: 900 });
  M.strings(B('slide'), B('ice') + 0.3, ['E3', 'F3', 'B3'], 0.14, { att: 2, rel: 0.5, cut: 700, glide: 40, glideFrom: B('slide') + 2, glideAt: B('ice') });
  beats(B('slide') + 0.3, B('ice'), 1.0, 0.9, 0.25, 0.32);
  { const t = c('slide', 1) + 0.1; M.piano(t, 'F2', 0.4, 5); M.piano(t + 0.02, 'B2', 0.3, 5); }

  // ================================================================== the ice: faster, rising; the crack; it goes through
  { const tc = F(E.crack), ts = F(E.sink), t0 = B('ice');
    M.prog([[t0, C.Em9], [c('ice', 1), C.Cmaj7], [tc, C.B7sus]], ts + 0.02, 0.32, { cut: 1000, lastRel: 0.02 });
    nlPulse(ctx, M.bus, t0 + 0.3, ts, ['E2', 'B2', 'E3'], 0.42, 0.8, { cut: 400, cutTo: 2000, acc: 4, decay: 0.3, ramp: (u) => 0.5 + 0.5 * u, stepAt: (t) => 0.5 - 0.18 * nlEv(t, t0, ts) });
    beats(c('ice', 0) + 1, ts - 0.15, 0.85, 0.55, 0.28, 0.5);
    hit(tc, 0.75, 36.7); M.bellCut(tc + 0.01, 'F6', 0.24, 0.5, -0.3);
    { const e = (t) => (0.03 + 0.09 * nlEv(t, tc, ts)) * (t > ts ? 0 : 1); const [Lx, Rx] = nlShepard(K.fx, tc, ts + 0.002, { rate: () => 1 / 10, env: e, centre: 320, width: 1.2 }); K.fx.play(Lx, tc, M.bus, { xr: Rx, vol: 1 }); }
    M.roll(ts - 2.2, ts - 0.03, [[ts - 2.2, 0.08], [ts - 0.3, 0.6]], 55);
    M.rpiano(ts, 'E3', 0.4, 1.8, 0); M.rpiano(ts, 'F3', 0.3, 1.8, 0.2);
    hit(ts, 1.0, 27.5); M.drum(ts + 0.01, 0.7, 41.2, 1.0, 1.4);
    M.strings(ts + 0.02, B('steam') + 0.4, C.stab, 0.34, { att: 0.02, rel: 1.4, cut: 2400, cutTo: 600, cutAt: B('steam') });
    M.strings(ts + 0.02, B('steam') + 0.4, ['E1', 'B1'], 0.3, { att: 0.1, rel: 1, cut: 140 }); }

  // ================================================================== the hole: it glows, and nobody can see it
  M.prog([[B('steam'), C.Em9], [c('steam', 1), C.Cmaj7]], B('sing') + 0.2, 0.26, { cut: 800 });
  M.strings(B('steam'), B('sing') + 0.2, C.cold, 0.05, { att: 2, rel: 0.5, cut: 6500, wave: 'triangle', vib: 2 });
  motif(c('steam', 1) + 0.4, { gap: 1.5, vel: 0.32, n: 5, oct: -1 });

  // ================================================================== the world; the plane
  { const t0 = B('world'), t1 = B('road'), tp = F(E.plane);
    hit(t0 + 0.02, 0.8, 30.9);
    M.prog([[t0, C.Clyd], [c('world', 1), C.Am9], [c('world', 2), C.Flyd], [B('plane'), C.B7sus], [c('plane', 1), C.Em9]], t1 + 0.3, 0.34, { cut: 1400 });
    motif(c('world', 0) + 0.4, { gap: 1.3, vel: 0.4, n: 5 });
    M.bell(nlWord('world', 0, 2), 'E6', 0.24, -0.3);
    rise(c('world', 2) - 0.5, tp + 2.5, 0.07, 1 / 16, 380);
    M.roll(tp - 2.0, tp - 0.03, [[tp - 2, 0.06], [tp - 0.3, 0.45]], 55);
    hit(tp, 0.9, 30.9); M.drum(tp + 0.01, 0.6, 46.2, 1.0, 1.0);
    glass(c('plane', 1) + 0.1, 0.2, 'F6'); }

  // ================================================================== the singing ice: the score steps back
  M.strings(B('sing'), B('water') + 0.3, ['E1', 'B1', 'E2'], 0.22, { att: 1.0, rel: 0.4, cut: 160 });
  M.strings(B('sing'), B('water') + 0.3, C.cold, 0.03, { att: 3, rel: 0.4, cut: 5000, wave: 'triangle', vib: 1 });
  glass(c('sing', 1) + 0.2, 0.14, 'B6');

  // ================================================================== someone is in the water
  { const t = B('water') + 0.05; stab(t, c('water', 1) + 0.2, 0.36); M.strings(t, t + 2.6, ['F6', 'E6'], 0.07, { att: 0.02, rel: 1.6, cut: 8000, vib: 18 }); }
  M.prog([[c('water', 1), C.Em9], [c('water', 2), C.Am9]], B('crawl') + 0.2, 0.3, { cut: 850 });
  beats(c('water', 0) + 1, B('crawl'), 0.9, 0.75, 0.3, 0.42);
  nlPulse(ctx, M.bus, c('water', 2), B('crawl'), ['E2', 'B2'], 1.0, 0.7, { cut: 300, cutTo: 520, acc: 1, decay: 0.2 });   // a clock's tick

  // ================================================================== the crawl
  { const t0 = B('crawl'), t1 = B('edge');
    hit(t0 + 0.02, 0.8, 30.9);
    M.prog([[t0, C.Em9], [c('crawl', 1), C.Cmaj7], [c('crawl', 2), C.B7sus]], t1 + 0.02, 0.32, { cut: 900, lastRel: 0.02 });
    nlPulse(ctx, M.bus, t0 + 0.4, t1, ['E2', 'B2', 'E3'], 0.62, 0.8, { cut: 320, cutTo: 1100, acc: 2, decay: 0.32, ramp: (u) => 0.5 + 0.5 * u });
    beats(t0 + 0.4, t1, 0.95, 0.72, 0.3, 0.48);
    motif(c('crawl', 1) + 0.3, { gap: 1.0, vel: 0.36, n: 4 });
    { const t = nlWord('crawl', 2, 1); hit(t, 0.75, 32.7); M.bell(t + 0.02, 'E6', 0.2, 0); }
    M.roll(t1 - 1.8, t1 - 0.03, [[t1 - 1.8, 0.06], [t1 - 0.3, 0.5]], 61.7); }

  // ================================================================== the ice cracks under your hands
  { const tc = F(E.iceCrack); stab(tc, c('edge', 1) + 0.3, 0.38); M.strings(tc, tc + 3, ['F6', 'E6'], 0.06, { att: 0.02, rel: 2, cut: 8000, vib: 22 }); }
  M.prog([[c('edge', 1), C.Am9], [c('edge', 2), C.Flyd]], B('reach') + 0.3, 0.32, { cut: 900 });
  beats(c('edge', 0) + 1, B('reach'), 0.8, 0.62, 0.32, 0.5);
  M.strings(c('edge', 1), B('reach') + 0.2, C.semi, 0.22, { att: 1.5, rel: 0.3, cut: 380 });
  M.piano(nlWord('edge', 2, 6), 'E2', 0.38, 4); M.piano(nlWord('edge', 2, 9), 'F2', 0.38, 4);
  M.roll(B('reach') - 2.2, B('reach') - 0.03, [[B('reach') - 2.2, 0.06], [B('reach') - 0.3, 0.5]], 55);

  // ================================================================== the reach: the strings glide up a semitone; the heartbeat quickens
  { const t0 = B('reach'), tb = c('reach', 1);
    hit(t0 + 0.02, 0.7, 30.9);
    M.strings(t0, B('question') + 0.05, ['B3', 'E4', 'F#4'], 0.2, { att: 2.0, rel: 0.03, cut: 900, cutTo: 2600, cutAt: tb + 2, glide: 100, glideFrom: tb - 1, glideAt: tb + 2.5 });
    M.strings(t0, END + 0.05, C.low, 0.3, { att: 1.5, rel: 0.02, cut: 200 });
    beats(t0 + 0.2, END - 0.3, 0.75, 0.55, 0.35, 0.55);
    M.strings(tb, END + 0.05, ['F6', 'E6'], 0.045, { att: 2.5, rel: 0.02, cut: 7000, vib: 14 });
    motif(c('reach', 0) + 0.6, { gap: 1.1, vel: 0.36, n: 4 }); }
  // the question: a stinger in the black; the theme falls past the tonic and stops a semitone above it, cut on the last frame
  { const t = B('question') + 0.02;
    hit(t, 1.0, 27.5); M.drum(t + 0.01, 0.6, 41.2, 1.0, 1.0);
    M.strings(t, END + 0.05, C.stab, 0.36, { att: 0.03, rel: 0.02, cut: 2400 });
    motif(c('question', 0) + 0.1, { notes: ['B4', 'G4', 'F#4', 'F4'], gap: 0.45, vel: 0.42, n: 4, dur: 1.5 }); }
});
NL_SOUND_FNS.push(nlShepard, nlPulse, nlMusicKit, nlWord);
window.NL_THEME = NL_THEME;
