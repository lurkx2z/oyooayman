/* =====================================================================
   SOUND · MUSIC — an original score, all synthesised (the music kit of the gravity films, via the Air solid film):
   string pads, a felt piano (also played backwards, so notes swell up out of nothing), glass bells, a low drum. Eerie,
   cold A minor. Its signature is the endless rise (a Shepard–Risset glissando) that starts at 9:00 PM and never
   arrives, quietly under everything, faster in the last act and cut dead on the last frame.
     9:00 PM       the night train: three notes of the light motif (E A B C, rising); at 9:00 a swell that stops dead
     ×1.085–×1.15  a pulse that tightens through the failures (the iron, the MRI's quench, the grid); a hit for each
     the dark      only the rise and a low drone; 40,000 phones lighting up as high bells, one by one
     the mountain  ice: a high cluster that never moves; mercury freezes on one bell; gold turns silver, the bells fall
     the beach     warmer, sparse (the party's own song plays from its speaker); the colours drain from the chords
                   down to a bare octave; the Sun's old light: a swell that rises to 9:03 and a hit
     the stars     high and thin; a roll to Saturn going out, a hit; the nearest star: a hit, then bells cut off one by
                   one, faster and faster; the question: the motif a note short, cut on the last frame
   ===================================================================== */

// the kit: string pads (three detuned oscillators per note through low-passes), felt piano (also reversed), bells,
// a low drum and a heartbeat
function lfMusicKit(ctx, K) {
  if (K._music) return K._music;
  const fx = K.fx, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(); bus.connect(K.bus);
  const hall = fx.ir(4.4, { bright: 0.5, damp: 2.8, shape: 2.0, pre: 0.025, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.55;
  bus.connect(hall); hall.connect(wet); wet.connect(K.bus);
  const drumModes = (f) => [[f, 0.7, 1], [f * 1.51, 0.45, 0.5], [f * 1.99, 0.3, 0.35], [f * 2.44, 0.2, 0.2], [f * 3.1, 0.12, 0.12]];
  const M = {
    bus,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4, dest = bus) => {
      const b = fx.pianoBuf(lfMidi(n)), len = Math.min(b.length, Math.ceil((dur + fade + 0.05) * fx.sr));
      return fx.play(b.subarray(0, len), t, dest, { vol: vel * 0.34, pan, stop: t + dur + fade, fade });
    },
    // a piano note played backwards: it swells up out of nothing and stops dead on its attack at tEnd
    rpiano(tEnd, n, vel, dur = 1.6, pan = 0) {
      const key = 'rp' + n + '_' + dur;
      if (!fx.cache[key]) {
        const b = fx.pianoBuf(lfMidi(n)), L = Math.min(b.length, Math.ceil(dur * fx.sr)), y = new Float32Array(L + Math.ceil(0.01 * fx.sr));
        for (let i = 0; i < L; i++) { const u = i / L; y[L - 1 - i] = b[i] * Math.min(1, (1 - u) / 0.35); }
        for (let i = 0; i < 0.01 * fx.sr; i++) y[L + i] = y[L - 1] * (1 - i / (0.01 * fx.sr));
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], tEnd - dur, bus, { vol: vel * 0.34, pan });
    },
    bell: (t, n, vol, pan = 0, dest = bus) => fx.play(fx.bellBuf(lfMidi(n)), t, dest, { vol: vol * 0.25, pan }),
    bellCut: (t, n, vol, d = 0.18, pan = 0) => fx.play(fx.bellBuf(lfMidi(n)), t, bus, { vol: vol * 0.25, pan, stop: t + d, fade: 0.05 }),
    // a low drum (a timpani-like membrane): f the pitch, vol, soft = a wider mallet, dk = decay
    drum(t, vol, f = 36.7, soft = 1, dk = 1) {
      const key = 'drum' + f + '_' + soft + '_' + dk;
      if (!fx.cache[key]) {
        const y = fx.hit(drumModes(f).map(([a, tau, b]) => [a, tau * dk, b]), { width: 0.006 * soft, amp: 1, noise: 0.25, nlen: 0.02, nhp: 300, len: 3.2 * Math.max(dk, 0.3) });
        const pk = LFX.peak(y) || 1; for (let i = 0; i < y.length; i++) y[i] /= pk;
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
        const f = lfHz(nn);
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
function lfPulse(ctx, dest, t0, t1, notes, step, vol, o = {}) {
  if (t1 - t0 < step) return;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.q || 4;
  lp.frequency.setValueAtTime(o.cut || 600, t0); lp.frequency.linearRampToValueAtTime(o.cutTo || o.cut || 600, t1);
  lp.connect(g); g.connect(dest); g.gain.value = 0;
  notes.forEach((n, k) => {
    const os = ctx.createOscillator(); os.type = o.wave || 'sawtooth'; os.frequency.value = lfHz(n); os.detune.setValueAtTime(k % 2 ? 6 : -6, t0);
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
function lfShepard(fx, t0, t1, o = {}) {
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

const LF_CH = {
  Am9: ['A1', 'E2', 'C3', 'G3', 'B3'], Flyd: ['F1', 'C2', 'A2', 'E3', 'B3'], Dm9: ['D2', 'A2', 'F3', 'C4', 'E4'], E7sus: ['E1', 'B1', 'D3', 'A3'],
  Cmaj7: ['C2', 'G2', 'E3', 'B3'], Bblyd: ['Bb1', 'F2', 'D3', 'A3', 'E4'], Fmaj9: ['F1', 'C2', 'A2', 'E3', 'G3'], Gsus: ['G1', 'D2', 'C3', 'G3'],
  Am: ['A1', 'E2', 'A2', 'C3', 'E3'], A5: ['A1', 'E2', 'A2', 'E3'], A1: ['A1', 'A2'], low: ['A1', 'E2', 'A2'], Cmaj9: ['C2', 'G2', 'E3', 'B3', 'D4'],
  Ebmaj7: ['Eb2', 'Bb2', 'D3', 'G3'], Dm: ['D2', 'A2', 'D3', 'F3'], high: ['E5', 'A5', 'B5'], ice: ['E5', 'F5', 'B5'],
};
const LF_THEME = ['E4', 'A4', 'B4', 'C5', 'E5'];   // the light motif: rising (at the very end it stops a note short)
const lfOct = (n, k) => n.replace(/-?\d$/, (d) => String(+d + k));

lfSound('music', 'score', function (ctx, bus, K) {
  const M = lfMusicKit(ctx, K), C = LF_CH, c = lfC, B = lfB, F = lfFilmAt, END = LF.end, T0 = LF.tLock;
  const ev = { trans: F(LFP.sTrans), quench: F(LFP.sQuench), grid: F(LFP.sGrid), stad: F(LFP.sGrid + LF_STAD_D), gen: F(15.45), brake: F(LFP.train.sBrake),
    spark: F(LFP.sSpark), hg: F(LFP.sHgCold), gold: F(LFP.sGold), stop: F(LFP.train.sStop), sun: F(LFP.sSun), saturn: F(LFP.sSaturn), alpha: F(LFP.sAlphaCen) };
  const motif = (t, o = {}) => LF_THEME.slice(0, o.n || 4).forEach((n, i) => M.piano(t + i * (o.gap || 1.2), lfOct(n, o.oct || 0), (o.vel || 0.5) * (i ? 0.88 : 1), o.dur || 3.4, [-0.2, 0.15, -0.1, 0.2, 0][i]));
  const glass = (t, v = 0.36, n = 'E6') => { M.bell(t, n, v, -0.3); M.bell(t + 0.02, lfOct(n, 1).replace('E', 'B'), v * 0.5, 0.3); };
  const fig = (t0, t1, notes, step, vel, durK = 1.8) => { for (let t = t0, i = 0; t < t1 - 0.3; t += step, i++) M.piano(t, notes[i % notes.length], vel * (0.8 + 0.2 * Math.sin(i * 1.3)), step * durK, i % 2 ? 0.25 : -0.25); };
  const hit = (t, v = 0.9, f = 36.7) => { M.drum(t, v, f, 1.1, 1.8); M.drum(t + 0.012, 0.5 * v, f * 1.5, 1.3, 1.0); };

  // ================================================================== the endless rise: from 9:00 to the last frame
  { const t0 = T0 - 0.2, t1 = END + 0.05, e = (t) => 0.06 * lfEv(t, T0, T0 + 9) * (1 - 0.35 * lfWn(t, B('beach'), B('stars'), 3, 3)) * (1 + 0.5 * lfEv(t, B('stars'), B('nearest'))) * (t > END - 0.02 ? 0 : 1);
    const rate = (t) => (t < B('beach') ? 1 / 30 : t < B('stars') ? 1 / 24 : 1 / 16);
    const [Lx, Rx] = lfShepard(K.fx, t0, t1, { rate, env: e, centre: 300, width: 1.2 });
    K.fx.play(Lx, t0, M.bus, { xr: Rx, vol: 1 }); }

  // ================================================================== 9:00 PM: the night train (the title)
  M.strings(-0.2, T0 + 0.3, C.low, 0.3, { att: 0.2, rel: 0.4, cut: 280 });
  M.strings(0.0, T0 + 0.3, ['E4', 'A4', 'B4'], 0.09, { att: 1.0, rel: 0.4, cut: 2400, wave: 'triangle', vib: 2 });
  motif(0.25, { gap: 0.6, vel: 0.36, n: 3, dur: 2.6 });
  // 9:00:00: light starts speeding up: a swell that stops dead, a low hit, glass
  M.rpiano(T0, 'A2', 0.5, 2.2, 0); M.rpiano(T0, 'E3', 0.34, 2.2, 0.2); hit(T0, 0.7); glass(T0, 0.34);
  // the slow minutes: Am9 → F lydian → Dm9 → E7sus, cold and far
  M.prog([[T0 + 0.3, C.Am9], [B('gps'), C.Flyd], [B('real'), C.Dm9], [c('real', 2), C.E7sus], [B('magnet'), C.Am9]], B('flicker') + 0.6, 0.42, { cut: 1100 });
  M.strings(T0 + 0.5, B('flicker') + 0.8, ['E5', 'A5', 'B5'], 0.1, { att: 3, rel: 1.2, cut: 3600, wave: 'triangle', vib: 2 });
  motif(c('start', 0) + 0.5, { gap: 1.6, vel: 0.44 });
  motif(c('gps', 1) + 0.5, { gap: 1.8, vel: 0.36, oct: -1, n: 3 });
  // the one impossible thing: two low notes, held
  M.piano(c('real', 0) + 0.2, 'F2', 0.42, 5); M.piano(c('real', 1) + 0.2, 'B1', 0.4, 5); glass(c('real', 1) + 0.25, 0.22, 'E6');
  fig(c('real', 2) + 0.3, B('magnet'), ['E5', 'B4', 'C5', 'A4'], 1.3, 0.18);
  // light = electricity + magnetism: a slow pulse starts, and tightens to the blackout
  { const t0 = B('magnet') + 0.4, t1 = ev.grid, stepAt = (t) => 1.1 - 0.6 * MathX.clamp((t - t0) / (t1 - t0), 0, 1) ** 1.2;
    lfPulse(ctx, M.bus, t0, ev.trans, ['A1', 'E2'], 1.1, 0.7, { stepAt, cut: 300, cutTo: 480, acc: 4, ramp: (u) => 0.5 + 0.5 * u });
    lfPulse(ctx, M.bus, ev.trans, ev.quench, ['A1', 'E2', 'Bb2'], 0.8, 0.85, { stepAt, cut: 420, cutTo: 700, acc: 4 });
    lfPulse(ctx, M.bus, ev.quench, ev.grid - 0.05, ['A1', 'E2', 'Bb2', 'F3'], 0.6, 1.0, { stepAt, cut: 600, cutTo: 1300, acc: 2, ramp: (u) => 0.75 + 0.4 * u }); }
  // ×1.085: the iron saturates (a minor second grinds in)
  hit(ev.trans, 0.55, 41.2); M.strings(ev.trans, ev.quench + 0.4, ['A4', 'Bb4', 'E5'], 0.16, { att: 0.4, rel: 0.6, cut: 2600, wave: 'triangle', vib: 4 });
  M.prog([[B('flicker'), C.Bblyd], [B('mri'), C.Dm9], [c('mri', 1), C.Bblyd]], ev.quench + 0.5, 0.44, { cut: 1300 });
  M.strings(B('mri'), ev.quench + 0.3, ['B5', 'E6'], 0.1, { att: 1.5, rel: 0.2, cut: 5000, wave: 'triangle', glide: 80, glideAt: ev.quench });
  // ×1.1: the MRI quenches: a roll up to it, the hit, a rising cluster while the helium roars
  M.roll(ev.quench - 3.2, ev.quench - 0.05, [[ev.quench - 3.2, 0.06], [ev.quench - 0.6, 0.5]], 55);
  hit(ev.quench, 1.0); M.drum(ev.quench + 0.02, 0.5, 27.5, 1.4, 2.0); glass(ev.quench + 0.03, 0.4, 'E6');
  M.strings(ev.quench, ev.grid + 0.4, ['A3', 'Bb3', 'E4', 'F4'], 0.34, { att: 0.15, rel: 0.4, cut: 900, cutTo: 3400, cutAt: ev.grid - 0.3, glide: 140, glideFrom: ev.quench + 0.5, glideAt: ev.grid });
  M.strings(ev.quench, ev.grid + 0.4, C.low, 0.42, { att: 0.2, rel: 0.4, cut: 260, cutTo: 420, cutAt: ev.grid });
  motif(c('mri', 3) + 0.4, { gap: 0.9, vel: 0.4, oct: 1, n: 4 });
  // ×1.15: the grid trips: everything stops; only the rise and a low drone are left
  hit(ev.grid, 1.0, 32.7); M.drum(ev.grid + 0.015, 0.6, 49, 1.3, 1.4);
  M.strings(ev.grid + 0.1, B('generator') + 0.6, ['A1', 'E2'], 0.34, { att: 2.5, rel: 1.0, cut: 220 });
  // the stadium goes dark (its own feed, last): a hit, glass; then 40,000 phones: high bells, one by one, more and more
  hit(ev.stad, 0.85, 36.7); glass(ev.stad + 0.02, 0.3, 'B5');
  { const r = new RNG(91), t0 = c('blackout', 2) - 0.2, t1 = B('generator') + 0.3, notes = ['E6', 'B6', 'A6', 'E7', 'B5', 'C7'];
    for (let t = t0, i = 0; t < t1; t += 0.42 - 0.3 * MathX.clamp((t - t0) / (t1 - t0), 0, 1) + 0.1 * r.next(), i++) M.bell(t, notes[r.int(0, notes.length - 1)], 0.12 + 0.1 * r.next(), r.range(-0.8, 0.8)); }
  M.strings(c('blackout', 2), B('generator') + 0.6, C.high, 0.1, { att: 1.6, rel: 0.6, cut: 5200, wave: 'triangle', vib: 3 });
  // the hospital's generators: the pulse again, stumbling
  M.prog([[B('generator'), C.Dm], [c('generator', 1), C.Bblyd], [B('brake'), C.Am9], [c('brake', 1), C.Flyd], [B('road'), C.Dm9], [c('road', 1), C.E7sus]], ev.spark + 0.5, 0.4, { cut: 1000 });
  lfPulse(ctx, M.bus, B('generator') + 0.3, B('brake'), ['D2', 'A2'], 0.9, 0.7, { cut: 320, cutTo: 260, acc: 3, stepAt: (t) => 0.9 + 0.35 * Math.sin(t * 1.9) * Math.sin(t * 0.7), ramp: (u) => 1 - 0.5 * u });
  M.piano(c('generator', 1) + 0.3, 'D2', 0.4, 4); M.piano(c('generator', 1) + 1.9, 'A1', 0.36, 4);
  // the brakes, the battery lights: the motif low; then the road: a pulse that the stalling engines cut
  motif(c('brake', 1) + 0.4, { gap: 1.7, vel: 0.36, oct: -1 });
  lfPulse(ctx, M.bus, B('road') + 0.3, ev.spark, ['A1', 'E2', 'A2'], 0.7, 0.8, { cut: 380, cutTo: 900, acc: 4, ramp: (u) => 0.6 + 0.4 * u });
  hit(ev.spark, 0.8, 41.2); M.rpiano(ev.spark, 'E3', 0.4, 2.0, 0);
  // the mountain: ice (a high cluster that never moves), a few piano notes; mercury freezes: one bell, then nothing
  M.strings(B('mercury'), ev.hg + 0.3, C.ice, 0.13, { att: 2.0, rel: 0.1, cut: 4200, wave: 'triangle', vib: 1.5 });
  M.strings(B('mercury'), ev.hg + 0.3, ['A1', 'E2', 'B2'], 0.36, { att: 2.0, rel: 0.1, cut: 300 });
  fig(B('mercury') + 0.8, ev.hg - 0.6, ['B4', 'E5', 'F5', 'A4'], 1.6, 0.16);
  M.rpiano(ev.hg, 'B3', 0.45, 2.6, 0); M.bell(ev.hg, 'E6', 0.4, 0); M.bell(ev.hg + 0.01, 'B6', 0.2, 0.2);
  M.strings(ev.hg + 0.2, B('ring') + 0.5, ['E2', 'B2'], 0.26, { att: 1.2, rel: 0.6, cut: 240 });
  // gold turns silver: the bells fall, colder each time
  ['E6', 'C6', 'A5', 'E5', 'C5', 'A4'].forEach((n, i) => M.bell(B('ring') + 0.6 + i * 0.55, n, 0.26 * (1 - 0.08 * i), -0.5 + 0.2 * i));
  M.prog([[B('ring'), C.Fmaj9], [c('ring', 1), C.Am9]], B('beach') + 0.6, 0.4, { cut: 1400 });
  M.strings(ev.gold - 0.5, B('beach') + 0.6, ['C6', 'E6', 'A6'], 0.1, { att: 1.0, rel: 0.6, cut: 5000, wave: 'triangle', glide: -50, glideAt: B('beach') });

  // ================================================================== 2 · the beach (real speed from here)
  M.prog([[B('beach'), C.Cmaj9], [c('beach', 1), C.Am9], [B('speaker'), C.Fmaj9], [c('speaker', 1), C.Gsus], [B('board'), C.Am9], [c('board', 1), C.Flyd], [B('fire'), C.Cmaj7], [c('fire', 1), C.Am9], [c('fire', 2), C.Fmaj9],
    [B('waves'), C.Am9], [c('waves', 1), C.Flyd], [B('phones'), C.Bblyd]], B('colour') + 0.5, 0.38, { cut: 1250 });
  motif(c('beach', 0) + 0.6, { gap: 1.4, vel: 0.4 });
  fig(B('speaker') + 0.5, B('board') - 0.2, ['C5', 'G4', 'E5', 'B4'], 1.1, 0.14);
  // the board: the names slide off: fragile, high, a note for each
  fig(B('board') + 0.4, B('fire') - 0.3, ['A5', 'E5', 'B5', 'C6'], 0.95, 0.15, 1.2);
  // the fire: seven times dimmer and just as hot (a chord whose brightness drains while it holds)
  motif(c('fire', 0) + 0.4, { gap: 1.5, vel: 0.4, oct: -1 });
  M.strings(c('fire', 1), B('waves') + 0.4, ['A3', 'C4', 'E4', 'B4'], 0.22, { att: 1.0, rel: 0.6, cut: 3400, cutTo: 500, cutAt: B('waves') });
  // the waves' plankton: high bells, each softer
  ['B6', 'E6', 'A6', 'E6', 'B5', 'E6', 'A5'].forEach((n, i) => M.bell(B('waves') + 0.8 + i * 1.25, n, 0.2 * (1 - 0.09 * i), i % 2 ? 0.45 : -0.45));
  // 40,000 phones going dark: the drone under a single held high note
  M.strings(B('phones'), B('colour') + 0.4, ['B5'], 0.1, { att: 0.8, rel: 0.4, cut: 4000, wave: 'triangle', vib: 1 });
  // colours fade: the chords lose their colour (the ninth, then the third), down to a bare octave
  M.prog([[B('colour'), C.Am9], [c('colour', 1), C.Am], [c('colour', 2), C.A5], [B('day') - 2.2, C.A1]], B('day') + 0.4, 0.42, { cut: 1500, lastRel: 1.0 });
  M.piano(c('colour', 0) + 0.4, 'A4', 0.36, 4); M.piano(c('colour', 0) + 0.42, 'A3', 0.3, 4); M.piano(c('colour', 1) + 0.4, 'E4', 0.34, 4); M.piano(c('colour', 2) + 0.4, 'A3', 0.32, 5);
  // the day side: sunlight already on its way arrives faster: a swell that keeps rising to 9:03
  M.strings(B('day'), ev.sun + 0.2, ['A2', 'E3', 'A3', 'C4', 'E4'], 0.42, { att: 4.0, rel: 0.1, cut: 700, cutTo: 3600, cutAt: ev.sun, glide: 90, glideFrom: B('day') + 3, glideAt: ev.sun });
  M.strings(B('day'), ev.sun + 0.2, C.low, 0.4, { att: 3.0, rel: 0.1, cut: 240, cutTo: 520, cutAt: ev.sun });
  M.roll(ev.sun - 5, ev.sun - 0.05, [[ev.sun - 5, 0.05], [ev.sun - 0.5, 0.55]], 55);
  hit(ev.sun, 1.0); glass(ev.sun + 0.02, 0.34, 'E6');
  // Earth can't cool: a slow heavy pulse
  M.prog([[ev.sun + 0.2, C.Dm9], [B('heat'), C.Bblyd], [c('heat', 1), C.E7sus]], B('stars') + 0.6, 0.42, { cut: 900 });
  lfPulse(ctx, M.bus, B('heat') + 0.3, B('stars'), ['A1', 'E2', 'Bb2'], 1.2, 0.85, { cut: 280, cutTo: 520, acc: 2, ramp: (u) => 0.6 + 0.4 * u });

  // ================================================================== 3 · the stars: the last light, running out
  M.prog([[B('stars'), C.Am9], [c('stars', 1), C.Flyd], [c('stars', 2), C.Cmaj9], [B('runout'), C.Dm9], [c('runout', 1), C.E7sus]], ev.saturn + 0.2, 0.36, { cut: 1300, lastRel: 0.1 });
  M.strings(B('stars'), ev.saturn + 0.2, ['E6', 'B6'], 0.1, { att: 3.0, rel: 0.1, cut: 6000, wave: 'triangle', vib: 2 });
  fig(B('stars') + 0.6, B('runout') - 0.3, ['E5', 'B5', 'A5', 'E6', 'C6'], 1.35, 0.14, 1.3);
  motif(c('stars', 1) + 0.5, { gap: 1.3, vel: 0.36, oct: 1 });
  // swallowing its own past: a roll that grows to Saturn
  M.roll(B('runout') + 1.0, ev.saturn - 0.05, [[B('runout') + 1, 0.05], [ev.saturn - 3, 0.3], [ev.saturn - 0.4, 0.7]], 55);
  M.strings(B('runout'), ev.saturn, ['A3', 'E4', 'A4', 'B4'], 0.3, { att: 2.0, rel: 0.05, cut: 800, cutTo: 3600, cutAt: ev.saturn - 0.2, glide: 120, glideFrom: B('runout') + 2, glideAt: ev.saturn });
  // 9:07: Saturn goes out: the hit, one bell; then nothing but the rise and a low drone
  hit(ev.saturn, 1.0, 32.7); M.bell(ev.saturn + 0.03, 'E6', 0.36, 0);
  M.strings(ev.saturn + 0.2, B('nearest') + 0.5, ['A1', 'E2'], 0.32, { att: 1.5, rel: 0.6, cut: 230 });
  motif(c('saturn', 1) + 0.6, { gap: 1.9, vel: 0.34, oct: -1, n: 4 });
  // 9:23: the nearest star goes out (a hit), and the rest will follow, nearest first: bells cut off, faster and faster
  M.strings(B('nearest'), ev.alpha - 0.05, ['E5', 'B5'], 0.1, { att: 1.0, rel: 0.05, cut: 4000, wave: 'triangle' });
  hit(ev.alpha, 0.9, 36.7);
  M.prog([[ev.alpha + 0.1, C.Am9], [c('nearest', 1), C.Flyd], [c('nearest', 2), C.Dm9]], B('question') + 0.4, 0.4, { cut: 1100 });
  { const notes = ['B6', 'E6', 'A6', 'B5', 'E6', 'C7', 'A5', 'E5', 'B5', 'E6', 'A5', 'B5'];
    let t = ev.alpha + 1.2, i = 0; while (t < B('question') - 0.2) { M.bellCut(t, notes[i % notes.length], 0.2, 0.14 + 0.2 * Math.exp(-i / 6), (i % 2 ? 0.5 : -0.5) * (1 - i / 30)); t += Math.max(0.35, 1.5 * Math.exp(-i / 7)); i++; } }
  // the question: the motif a note short, over an unresolved chord, cut on the last frame
  M.strings(B('question'), END + 0.05, ['A2', 'E3', 'B3', 'D4'], 0.46, { att: 0.3, rel: 0.02, cut: 1400 });
  M.strings(B('question'), END + 0.05, ['E5', 'B5'], 0.12, { att: 0.4, rel: 0.02, cut: 4000, wave: 'triangle' });
  motif(c('question', 0) + 0.05, { gap: 0.6, vel: 0.5, n: 4, dur: 2.4 });
});
LF_SOUND_FNS.push(lfShepard);
