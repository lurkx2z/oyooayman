/* =====================================================================
   SOUND · MUSIC — an original score, all synthesised (the music kit of the gravity films, via the light films): string
   pads, a felt piano (also played backwards, so notes swell up out of nothing), glass bells, a low drum, a heartbeat,
   a synth pulse, the endless rise. Cold D minor, eerie like the slower-light film; its motif is a pull: a note dragged
   up a half step and falling back (A Bb A, then down to D).
     10:41:57      a calm river morning: a quiet piano figure; a backwards piano swells into 10:42:00 and a low hit
     the yard      a drone with a semitone in it (the magnets' new hum); the motif; the pile: a pulse and a roll
     the cube law  three bells rising, one per "10", and a low chord on "1,000"
     the hospital  cold and high (glass strings); the cylinder: a glide up into the wall, a hit; a hit as it reaches the
                   scanner; the water floating: suspended chords and bells; the waiting room: the heartbeat
     your boat     a low ostinato that never lets go; "impossible": a stinger; the check-ins on your boat: the ostinato again
     the cars, the bridge, the turbines  the pulse, driving, wider
     your mum      the heartbeat and a roll; the kettle; your phone: a backwards piano into the rip, a glide into the hit
     the count     the endless rise; a hit on 3, 2 and 1; a roll into 10:42:10 — cut dead
     10:42:10      a held breath, a low hit; a cold chord as the boat drops and the scrap falls
     +1 minute     a sad progression; the question: the motif a note short, cut on the last frame
   ===================================================================== */


// the kit: string pads (three detuned oscillators per note through low-passes), felt piano (also reversed), bells,
// a low drum and a heartbeat
function mgMusicKit(ctx, K) {
  if (K._music) return K._music;
  const fx = K.fx, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(); bus.connect(K.bus);
  const hall = fx.ir(4.4, { bright: 0.5, damp: 2.8, shape: 2.0, pre: 0.025, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.55;
  bus.connect(hall); hall.connect(wet); wet.connect(K.bus);
  const drumModes = (f) => [[f, 0.7, 1], [f * 1.51, 0.45, 0.5], [f * 1.99, 0.3, 0.35], [f * 2.44, 0.2, 0.2], [f * 3.1, 0.12, 0.12]];
  const M = {
    bus,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4, dest = bus) => {
      const b = fx.pianoBuf(mgMidi(n)), len = Math.min(b.length, Math.ceil((dur + fade + 0.05) * fx.sr));
      return fx.play(b.subarray(0, len), t, dest, { vol: vel * 0.34, pan, stop: t + dur + fade, fade });
    },
    // a piano note played backwards: it swells up out of nothing and stops dead on its attack at tEnd
    rpiano(tEnd, n, vel, dur = 1.6, pan = 0) {
      const key = 'rp' + n + '_' + dur;
      if (!fx.cache[key]) {
        const b = fx.pianoBuf(mgMidi(n)), L = Math.min(b.length, Math.ceil(dur * fx.sr)), y = new Float32Array(L + Math.ceil(0.01 * fx.sr));
        for (let i = 0; i < L; i++) { const u = i / L; y[L - 1 - i] = b[i] * Math.min(1, (1 - u) / 0.35); }
        for (let i = 0; i < 0.01 * fx.sr; i++) y[L + i] = y[L - 1] * (1 - i / (0.01 * fx.sr));
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], tEnd - dur, bus, { vol: vel * 0.34, pan });
    },
    bell: (t, n, vol, pan = 0, dest = bus) => fx.play(fx.bellBuf(mgMidi(n)), t, dest, { vol: vol * 0.25, pan }),
    bellCut: (t, n, vol, d = 0.18, pan = 0) => fx.play(fx.bellBuf(mgMidi(n)), t, bus, { vol: vol * 0.25, pan, stop: t + d, fade: 0.05 }),
    // a low drum (a timpani-like membrane): f the pitch, vol, soft = a wider mallet, dk = decay
    drum(t, vol, f = 36.7, soft = 1, dk = 1) {
      const key = 'drum' + f + '_' + soft + '_' + dk;
      if (!fx.cache[key]) {
        const y = fx.hit(drumModes(f).map(([a, tau, b]) => [a, tau * dk, b]), { width: 0.006 * soft, amp: 1, noise: 0.25, nlen: 0.02, nhp: 300, len: 3.2 * Math.max(dk, 0.3) });
        const pk = MGX.peak(y) || 1; for (let i = 0; i < y.length; i++) y[i] /= pk;
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
        const f = mgHz(nn);
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
function mgPulse(ctx, dest, t0, t1, notes, step, vol, o = {}) {
  if (t1 - t0 < step) return;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.q || 4;
  lp.frequency.setValueAtTime(o.cut || 600, t0); lp.frequency.linearRampToValueAtTime(o.cutTo || o.cut || 600, t1);
  lp.connect(g); g.connect(dest); g.gain.value = 0;
  notes.forEach((n, k) => {
    const os = ctx.createOscillator(); os.type = o.wave || 'sawtooth'; os.frequency.value = mgHz(n); os.detune.setValueAtTime(k % 2 ? 6 : -6, t0);
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
function mgShepard(fx, t0, t1, o = {}) {
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



const MG_CH = {
  Dm9: ['D2', 'A2', 'F3', 'C4', 'E4'], Bbmaj7: ['Bb1', 'F2', 'D3', 'A3'], Gm9: ['G1', 'D2', 'Bb2', 'F3', 'A3'], A7sus: ['A1', 'E2', 'D3', 'G3'],
  Eblyd: ['Eb2', 'Bb2', 'G3', 'D4', 'A4'], Fmaj9: ['F1', 'C2', 'A2', 'E3', 'G3'], Bblyd: ['Bb1', 'F2', 'D3', 'A3', 'E4'], Csus: ['C2', 'G2', 'F3', 'C4'],
  Dm: ['D2', 'A2', 'D3', 'F3', 'A3'], Bb: ['Bb1', 'F2', 'Bb2', 'D3', 'F3'], F: ['F1', 'C2', 'F2', 'A2', 'C3'], A: ['A1', 'E2', 'A2', 'C#3', 'E3'],
  low: ['D2', 'A2', 'D3'], semi: ['D2', 'Eb2', 'A2'], high: ['A5', 'D6', 'E6'], glass: ['E6', 'F6', 'A6'],
};
const MG_THEME = ['A4', 'Bb4', 'A4', 'E4', 'D4'];        // the pull: dragged up a half step, falling back
const mgOct = (n, k) => n.replace(/-?\d$/, (d) => String(+d + k));
// a word's film time in a caption (beat id, caption k, word j)
const mgWord = (id, k, j) => mgCap(id, k).words[Math.min(j, mgCap(id, k).words.length - 1)].start;

mgSound('music', 'score', function (ctx, bus, K) {
  const M = mgMusicKit(ctx, K), C = MG_CH, c = mgC, B = mgB, F = mgFilmAt, END = MG.end, T0 = MG.tOn, S = MG_SMALL;
  const ev = { cylWall: F(S.cyl.wall), cylHit: F(S.cyl.hit), carUp: F(MG_AT.carUp), rel: F(S.phone.rel), phHit: F(S.phone.hit), d3: F(7), d2: F(8), d1: F(9), back: F(MGP.T), boatHit: F(MGB.hit) };
  const motif = (t, o = {}) => (o.notes || MG_THEME).slice(0, o.n || 5).forEach((n, i) => M.piano(t + i * (o.gap || 1.1), mgOct(n, o.oct || 0), (o.vel || 0.5) * (i ? 0.88 : 1), o.dur || 3.4, [-0.2, 0.15, -0.1, 0.2, 0][i]));
  const glass = (t, v = 0.36, n = 'E6') => { M.bell(t, n, v, -0.3); M.bell(t + 0.02, mgOct(n, 1), v * 0.4, 0.3); };
  const fig = (t0, t1, notes, step, vel, durK = 1.8) => { for (let t = t0, i = 0; t < t1 - 0.3; t += step, i++) M.piano(t, notes[i % notes.length], vel * (0.8 + 0.2 * Math.sin(i * 1.3)), step * durK, i % 2 ? 0.25 : -0.25); };
  const hit = (t, v = 0.9, f = 36.7) => { M.drum(t, v, f, 1.1, 1.8); M.drum(t + 0.012, 0.5 * v, f * 1.5, 1.3, 1.0); };
  const twinkle = (t0, t1, d0, d1, notes, vol) => { const r = new RNG(Math.round(t0 * 100)); for (let t = t0; t < t1;) { M.bell(t, notes[r.int(0, notes.length - 1)], vol * (0.6 + 0.4 * r.next()), r.range(-0.8, 0.8)); const u = (t - t0) / (t1 - t0); t += (d0 + (d1 - d0) * u) * r.range(0.6, 1.4); } };
  const beats = (t0, t1, p0, p1, v0, v1) => { for (let t = t0; t < t1 - 0.2;) { const u = (t - t0) / (t1 - t0); M.beat(t, v0 + (v1 - v0) * u); t += p0 + (p1 - p0) * u; } };

  // ================================================================== 10:41:57: a calm river morning; then 10:42:00
  fig(-0.2, T0 - 0.2, ['D4', 'A4', 'F4', 'E4', 'C4', 'A3'], 0.48, 0.2, 2.2);
  M.strings(-0.3, T0 + 0.2, ['D3', 'A3', 'F4'], 0.14, { att: 0.5, rel: 0.2, cut: 1800, wave: 'triangle', vib: 3 });
  M.rpiano(T0, 'D2', 0.55, 2.4, 0); M.rpiano(T0, 'A2', 0.4, 2.4, 0.2); M.rpiano(T0, 'Eb3', 0.3, 2.0, -0.2);
  hit(T0, 0.9, 32.7); glass(T0 + 0.02, 0.26, 'E6');
  // the magnets' new hum: a drone with a semitone in it, under the first minute
  M.strings(T0 + 0.3, B('mri') + 0.6, C.semi, 0.3, { att: 2.5, rel: 1.2, cut: 300, cutTo: 520, cutAt: B('pile') });
  M.prog([[c('start', 0), C.Dm9], [c('start', 1), C.Bbmaj7], [B('radio'), C.Gm9], [c('radio', 1), C.A7sus], [B('phone'), C.Dm9], [c('phone', 1), C.Eblyd]], B('pile') + 0.5, 0.32, { cut: 950 });
  motif(c('start', 1) + 0.8, { gap: 1.5, vel: 0.36, dur: 4 });
  glass(c('radio', 1) + 2.4, 0.22, 'F6');
  beats(c('phone', 1) - 0.4, B('pile'), 1.3, 1.15, 0.18, 0.26);
  // the pile leaves the ground: a pulse and a roll; the rope
  M.prog([[B('pile'), C.Dm9], [c('pile', 1), C.Bbmaj7], [c('pile', 2), C.Eblyd]], B('reach') + 0.5, 0.36, { cut: 1000 });
  mgPulse(ctx, M.bus, B('pile') + 0.4, c('pile', 2) - 0.6, ['D2', 'A2', 'Eb3'], 0.6, 0.8, { cut: 320, cutTo: 900, acc: 4, ramp: (u) => 0.5 + 0.5 * u });
  M.roll(c('pile', 1) + 1.2, c('pile', 2) - 0.62, [[c('pile', 1) + 1.2, 0.05], [c('pile', 2) - 0.8, 0.5]], 55);
  hit(c('pile', 2) - 0.6, 0.95, 30.9); M.bellCut(c('pile', 2) - 0.59, 'Eb6', 0.3, 0.6, -0.3); M.bellCut(c('pile', 2) - 0.57, 'D6', 0.3, 0.6, 0.3);
  // the cube law: a bell on each "10", a low chord on "1,000"
  [7, 9, 11].forEach((j, i) => M.bell(mgWord('reach', 0, j), ['D5', 'A5', 'D6'][i], 0.26, [-0.4, 0, 0.4][i]));
  { const t = mgWord('reach', 0, 13); hit(t, 0.6, 36.7); M.piano(t, 'D2', 0.5, 5); M.piano(t + 0.01, 'A2', 0.4, 5); M.bell(t + 0.02, 'D7', 0.18, 0); }
  M.prog([[B('reach'), C.Dm9], [c('reach', 1), C.Bblyd]], B('mri') + 0.6, 0.34, { cut: 1300 });
  twinkle(c('reach', 1), B('mri'), 0.9, 0.5, ['A5', 'D6', 'E6', 'A6'], 0.1);

  // ================================================================== the hospital: cold and high
  M.prog([[B('mri'), C.Fmaj9], [c('mri', 1), C.Bblyd], [c('mri', 2), C.Dm9]], B('cylinder') + 0.5, 0.32, { cut: 1100 });
  M.strings(B('mri'), B('waiting') + 0.4, C.glass, 0.06, { att: 3, rel: 1, cut: 6000, wave: 'triangle', vib: 2 });
  { const t = c('mri', 1) + 0.15; hit(t, 0.6, 41.2); M.piano(t, 'F2', 0.42, 5); glass(t + 0.02, 0.24, 'F6'); }
  // the cylinder: a cluster gliding up into the wall, cut dead; a backwards piano into it; a hit as it reaches the bore
  M.strings(B('cylinder'), ev.cylWall + 0.02, ['D3', 'Eb3', 'A3', 'Bb3'], 0.32, { att: 1.5, rel: 0.03, cut: 600, cutTo: 3200, cutAt: ev.cylWall, glide: 100, glideFrom: c('cylinder', 0) + 1, glideAt: ev.cylWall });
  beats(B('cylinder') + 0.4, ev.cylWall - 0.3, 1.1, 0.6, 0.3, 0.55);
  M.rpiano(ev.cylWall, 'D2', 0.5, 2.2, 0); M.rpiano(ev.cylWall, 'Eb3', 0.36, 2.2, 0.2);
  hit(ev.cylWall, 1.0, 29.1); M.drum(ev.cylWall + 0.015, 0.5, 52, 1.2, 1.4);
  M.strings(ev.cylWall + 0.05, ev.cylHit + 0.02, ['D2', 'Eb2', 'A2'], 0.34, { att: 0.05, rel: 0.03, cut: 500, cutTo: 1500, cutAt: ev.cylHit });
  hit(ev.cylHit, 0.85, 32.7); M.bellCut(ev.cylHit + 0.01, 'F6', 0.28, 0.5, -0.4); M.bellCut(ev.cylHit + 0.03, 'E6', 0.28, 0.5, 0.4);
  // the water, floating out of its cup: suspended, bright, slow
  M.prog([[B('water') + 0.4, C.Fmaj9], [c('water', 1), C.Bblyd], [c('water', 2), C.Csus]], B('waiting') + 0.5, 0.3, { cut: 1500 });
  twinkle(c('water', 0) + 1, c('water', 2), 1.1, 0.45, ['A5', 'C6', 'E6', 'G6', 'A6'], 0.12);
  motif(c('water', 1) + 0.6, { gap: 1.3, vel: 0.3, oct: 1, dur: 3 });
  { const t = c('water', 2) + 0.1; M.piano(t, 'D2', 0.4, 5); M.piano(t + 0.02, 'Bb2', 0.32, 5); }
  // the waiting room: the heartbeat
  M.prog([[B('waiting'), C.Dm9], [c('waiting', 1), C.Eblyd]], B('speed') + 0.5, 0.34, { cut: 900 });
  beats(B('waiting') + 0.3, B('speed') - 0.2, 1.0, 0.85, 0.35, 0.45);

  // ================================================================== back at the yard; your boat
  M.prog([[B('speed'), C.Dm], [c('speed', 1), C.Bb]], B('boat') + 0.5, 0.38, { cut: 900 });
  mgPulse(ctx, M.bus, B('speed') + 0.3, B('boat'), ['D2', 'A2', 'D3'], 0.3, 0.7, { cut: 500, cutTo: 1400, acc: 4, decay: 0.35 });
  hit(c('speed', 1) + 0.1, 0.6, 36.7);
  M.prog([[B('boat'), C.Dm9], [c('boat', 1), C.Gm9], [c('boat', 2), C.A7sus]], B('real') + 0.5, 0.36, { cut: 900 });
  mgPulse(ctx, M.bus, B('boat') + 0.2, B('real'), ['D2', 'A2'], 0.95, 0.85, { cut: 260, cutTo: 520, acc: 2, ramp: (u) => 0.55 + 0.45 * u });
  M.piano(c('boat', 0) + 0.2, 'D2', 0.42, 5); motif(c('boat', 1) + 0.4, { gap: 1.2, vel: 0.32, n: 4 });
  // "Officially, this is impossible": a stinger, then a dark held chord
  { const t = c('real', 0) + 0.05; hit(t, 1.0, 29.1); M.drum(t + 0.01, 0.6, 43.7, 1.0, 1.0);
    M.strings(t, c('real', 1) + 0.3, ['Bb2', 'A3', 'Eb4', 'E4'], 0.4, { att: 0.02, rel: 1.4, cut: 3000, cutTo: 800, cutAt: c('real', 1) });
    M.strings(t, t + 2.6, ['F6', 'E6'], 0.08, { att: 0.02, rel: 1.6, cut: 8000, wave: 'sawtooth', vib: 18 }); }
  M.prog([[c('real', 1), C.Dm9], [c('real', 2), C.Bbmaj7], [mgE('real') + 0.25, C.Gm9]], B('cars') + 0.5, 0.34, { cut: 900 });
  M.strings(c('real', 1), B('cars') + 0.3, C.low, 0.3, { att: 1, rel: 0.6, cut: 240 });
  // back on your boat for a breath: its ostinato again, never letting go
  mgPulse(ctx, M.bus, mgE('real') + 0.3, B('cars'), ['D2', 'A2'], 0.95, 0.8, { cut: 260, cutTo: 520, acc: 2, ramp: (u) => 0.6 + 0.4 * u });

  // ================================================================== the cars, the bridge, the turbines: driving
  M.prog([[B('cars'), C.Dm9], [c('cars', 1), C.Eblyd]], B('road') + 0.5, 0.36, { cut: 1000 });
  mgPulse(ctx, M.bus, B('cars') + 0.3, B('road'), ['D2', 'A2', 'Eb3'], 0.36, 0.7, { cut: 500, cutTo: 1200, acc: 4, decay: 0.32, ramp: (u) => 0.6 + 0.4 * u });
  hit(ev.carUp, 0.8, 32.7);
  M.prog([[B('road'), C.Gm9], [c('road', 1), C.Dm9], [c('road', 2), C.A7sus]], B('turbine') + 0.5, 0.38, { cut: 1100 });
  mgPulse(ctx, M.bus, B('road') + 0.2, B('turbine'), ['D2', 'A2', 'D3'], 0.25, 0.75, { cut: 700, cutTo: 1800, acc: 4, decay: 0.3, ramp: (u) => 0.6 + 0.4 * u });
  hit(c('road', 1) + 0.05, 0.6, 36.7);
  M.prog([[B('turbine'), C.Bblyd], [c('turbine', 1), C.Gm9], [c('turbine', 2), C.A7sus]], B('boat2') + 0.5, 0.4, { cut: 900 });
  M.strings(B('turbine'), B('boat2') + 0.3, ['D2', 'A2', 'D3', 'A3'], 0.34, { att: 2, rel: 0.6, cut: 380, cutTo: 700, cutAt: c('turbine', 2) });
  { const t = c('turbine', 1) + 1.2; hit(t, 0.9, 30.9); M.bellCut(t + 0.01, 'Eb6', 0.24, 0.5, -0.3); }
  M.piano(c('turbine', 2) + 0.1, 'G2', 0.4, 5); M.piano(c('turbine', 2) + 0.12, 'D3', 0.3, 5);

  // ================================================================== your mum steers away; it can't be escaped
  M.prog([[B('boat2'), C.Dm9], [c('boat2', 1), C.Eblyd], [c('boat2', 2), C.A7sus]], B('inside') + 0.5, 0.38, { cut: 1000 });
  beats(B('boat2') + 0.3, B('inside'), 1.0, 0.7, 0.35, 0.55);
  hit(c('boat2', 1) + 0.05, 0.7, 32.7);
  motif(c('boat2', 0) + 0.6, { gap: 1.4, vel: 0.3, oct: -1, n: 4, dur: 3 });
  M.roll(c('boat2', 2) + 0.4, B('inside') - 0.05, [[c('boat2', 2) + 0.4, 0.04], [B('inside') - 0.3, 0.4]], 55);
  M.strings(c('boat2', 2), B('inside') + 0.5, ['Eb6', 'E6'], 0.05, { att: 1.5, rel: 0.4, cut: 7000, wave: 'sawtooth', vib: 12 });
  // inside the boat: a held breath
  M.strings(B('inside'), B('phonehit') + 0.4, ['A2', 'Bb2', 'E3', 'F3'], 0.3, { att: 1.0, rel: 0.4, cut: 520 });
  beats(B('inside') + 0.5, B('phonehit'), 0.95, 0.8, 0.32, 0.42);
  glass(c('inside', 1) + 0.35, 0.18, 'F6');

  // ================================================================== your phone: torn out of your hand; it hits the ball
  beats(B('phonehit') + 0.2, ev.rel - 0.25, 0.75, 0.5, 0.42, 0.6);
  M.strings(B('phonehit'), ev.rel + 0.02, ['D3', 'Eb3', 'A3'], 0.3, { att: 1.0, rel: 0.03, cut: 700, cutTo: 2200, cutAt: ev.rel });
  M.rpiano(ev.rel, 'D3', 0.48, 1.8, 0); M.rpiano(ev.rel, 'A3', 0.34, 1.8, 0.2);
  hit(ev.rel, 0.75, 41.2); M.bellCut(ev.rel + 0.01, 'A6', 0.22, 0.4, 0.3);
  M.strings(ev.rel + 0.05, ev.phHit + 0.02, ['A3', 'E4', 'A4', 'Bb4'], 0.3, { att: 0.4, rel: 0.03, cut: 900, cutTo: 4000, cutAt: ev.phHit, glide: 140, glideFrom: ev.rel + 0.5, glideAt: ev.phHit });
  M.roll(ev.phHit - 2.2, ev.phHit - 0.04, [[ev.phHit - 2.2, 0.05], [ev.phHit - 0.3, 0.55]], 61.7);
  hit(ev.phHit, 1.0, 29.1); M.drum(ev.phHit + 0.012, 0.6, 58, 1.2, 1.2);
  ['A6', 'Bb6', 'E6', 'D7', 'A5'].forEach((n, i) => M.bell(ev.phHit + 0.02 + i * 0.07, n, 0.22 - 0.03 * i, -0.6 + 0.3 * i));
  M.strings(ev.phHit + 0.1, B('close') + 0.4, ['D2', 'A2'], 0.32, { att: 0.3, rel: 0.5, cut: 260 });
  // 9 metres: rising
  M.prog([[B('close'), C.Dm9], [c('close', 1), C.Eblyd]], B('count') + 0.3, 0.38, { cut: 900 });
  M.strings(c('close', 1), ev.d3 + 0.1, ['A3', 'D4', 'E4'], 0.24, { att: 1.5, rel: 0.1, cut: 900, cutTo: 2400, cutAt: ev.d3, glide: 60, glideFrom: c('close', 1), glideAt: ev.d3 });
  beats(B('close') + 0.3, ev.d3 - 0.2, 0.75, 0.55, 0.45, 0.6);

  // ================================================================== the count: the endless rise, 3 · 2 · 1, cut dead at 10:42:10
  { const t0 = B('close') + 2, t1 = ev.back + 0.002, e = (t) => (0.03 + 0.1 * mgEv(t, ev.d3, ev.back)) * mgEv(t, t0, t0 + 5) * (t > ev.back ? 0 : 1);
    const rate = (t) => (t < ev.d3 ? 1 / 24 : 1 / 11);
    const [Lx, Rx] = mgShepard(K.fx, t0, t1, { rate, env: e, centre: 300, width: 1.2 });
    K.fx.play(Lx, t0, M.bus, { xr: Rx, vol: 1 }); }
  beats(ev.d3, ev.back, 0.6, 0.32, 0.5, 0.8);
  [ev.d3, ev.d2, ev.d1].forEach((t, i) => { hit(t, 0.75 + 0.1 * i, [41.2, 36.7, 32.7][i]); M.bell(t + 0.02, ['A5', 'F5', 'D5'][i], 0.26, 0); });
  M.strings(ev.d3, ev.back + 0.02, ['D3', 'A3', 'D4', 'Eb4', 'A4'], 0.42, { att: 1.0, rel: 0.02, cut: 600, cutTo: 3800, cutAt: ev.back, glide: 100, glideFrom: ev.d3 + 1, glideAt: ev.back });
  M.strings(ev.d3, ev.back + 0.02, C.low, 0.42, { att: 1.0, rel: 0.02, cut: 220, cutTo: 520, cutAt: ev.back });
  M.roll(ev.d1 - 0.4, ev.back - 0.03, [[ev.d1 - 0.4, 0.12], [ev.back - 0.3, 0.8]], 55);
  hit(ev.boatHit, 0.8, 27.5);

  // ================================================================== 10:42:10: a held breath; a low hit; a cold chord
  { const t = ev.back + 0.9; hit(t, 0.9, 27.5); M.piano(t, 'D2', 0.5, 6); M.piano(t + 0.02, 'A2', 0.4, 6); M.bell(t + 0.03, 'D6', 0.24, 0);
    M.prog([[t, C.Bbmaj7], [c('back', 2), C.Dm9]], B('after') + 0.5, 0.36, { cut: 900, att: 1.5 });
    M.strings(t, B('after') + 0.4, ['A5', 'D6'], 0.06, { att: 2, rel: 0.6, cut: 5000, wave: 'triangle', vib: 2 }); }
  { const t = c('back', 2) + 0.4; hit(t, 0.7, 30.9); M.drum(t + 0.3, 0.4, 36.7, 1.4, 1.2); }
  // ================================================================== +1 minute: everything it pulled is a magnet now
  M.prog([[B('after'), C.Dm], [c('after', 0) + 2.4, C.Bb], [c('after', 1), C.F], [c('after', 1) + 2.2, C.A]], B('question') + 0.4, 0.4, { cut: 1300, lastRel: 0.6 });
  fig(B('after') + 0.4, B('question') - 0.2, ['D5', 'A4', 'F4', 'E4', 'C5', 'A4'], 0.85, 0.16, 1.5);
  // the question: the motif a note short, over an unresolved chord, cut on the last frame
  M.strings(B('question'), END + 0.05, ['D2', 'A2', 'E3', 'G3'], 0.42, { att: 0.4, rel: 0.02, cut: 1300 });
  M.strings(B('question'), END + 0.05, ['A5', 'E6'], 0.09, { att: 0.5, rel: 0.02, cut: 4000, wave: 'triangle' });
  motif(c('question', 0) + 0.05, { gap: 0.6, vel: 0.46, n: 4, dur: 2.2 });
});
MG_SOUND_FNS.push(mgShepard, mgPulse, mgMusicKit, mgWord);
window.MG_THEME = MG_THEME;
