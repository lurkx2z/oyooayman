/* =====================================================================
   SOUND · MUSIC — an original score, all synthesised (the music kit of the gravity films, via the light films and
   the no-light film): string pads, a felt piano (also played backwards, so notes swell up out of nothing), glass
   bells, a low drum, a heartbeat, a synth pulse, the endless rise. Its idea is the film's: the major third is the air.
   The title is in D major, bright, with bells; at 10:00 the first 1% goes and the whole cue drains through a closing
   filter; from then on the score is in D minor. Every step that happens on screen is a low toll (the film's clock).
   Its theme sighs down to the tonic and lifts a semitone off it (F E D A B♭), unresolved.
     the deck        D major, bells, a light pulse; drained to nothing at 10:00
     the weight      a drone, the theme on the low piano; the climb: a rising bell line
     the forecast    3:39: a cold chord (E♭ lydian over the D drone)
     ears, storm     a slow pulse comes in; the 10:15 step: a hit, the strings swell
     cabin, pop      the pulse quickens; the balloon bursts: a stinger, a held breath
     fizz            the drinks: high glass sparkle over a cold lydian pad
     stairs, tanks   a heartbeat; the plan: an ostinato and the theme turned upwards; six bells for six tanks
     down            the girl: the theme high and soft; her hand: a warm chord
     engines         half the air: a hit, a low cluster swelling under the black smoke; the power fails: cut dead
     marina, dive    the heartbeat loud, the edges going dark: a muffled pulse, the endless rise; the roll: silence
     under           you can breathe: D major again (filtered, far off); 4,300 can't: the third falls to minor
     everest, shark  a thin high pad; the whitetip: a slow two-note ostinato on the low piano, closing in
     rise            she lets go: a stinger, a racing pulse and the rise; the catch: a hit, the strings fall back down
     sky … sea       cold and vast: bells for stars, the boil: the biggest swell of the film, heard from under water
     last, question  the theme on the piano, slow; the question: one bell, cut on the last frame
   ===================================================================== */

// the kit: string pads (three detuned oscillators per note through low-passes), felt piano (also reversed), bells,
// a low drum and a heartbeat
function atMusicKit(ctx, K) {
  if (K._music) return K._music;
  const fx = K.fx, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(); bus.connect(K.bus);
  const hall = fx.ir(4.6, { bright: 0.5, damp: 2.6, shape: 2.0, pre: 0.025, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.55;
  bus.connect(hall); hall.connect(wet); wet.connect(K.bus);
  const drumModes = (f) => [[f, 0.7, 1], [f * 1.51, 0.45, 0.5], [f * 1.99, 0.3, 0.35], [f * 2.44, 0.2, 0.2], [f * 3.1, 0.12, 0.12]];
  const M = {
    bus,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4, dest = bus) => {
      const b = fx.pianoBuf(atMidi(n)), len = Math.min(b.length, Math.ceil((dur + fade + 0.05) * fx.sr));
      return fx.play(b.subarray(0, len), t, dest, { vol: vel * 0.34, pan, stop: t + dur + fade, fade });
    },
    // a piano note played backwards: it swells up out of nothing and stops dead on its attack at tEnd
    rpiano(tEnd, n, vel, dur = 1.6, pan = 0) {
      const key = 'rp' + n + '_' + dur;
      if (!fx.cache[key]) {
        const b = fx.pianoBuf(atMidi(n)), L = Math.min(b.length, Math.ceil(dur * fx.sr)), y = new Float32Array(L + Math.ceil(0.01 * fx.sr));
        for (let i = 0; i < L; i++) { const u = i / L; y[L - 1 - i] = b[i] * Math.min(1, (1 - u) / 0.35); }
        for (let i = 0; i < 0.01 * fx.sr; i++) y[L + i] = y[L - 1] * (1 - i / (0.01 * fx.sr));
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], tEnd - dur, bus, { vol: vel * 0.34, pan });
    },
    bell: (t, n, vol, pan = 0, dest = bus) => fx.play(fx.bellBuf(atMidi(n)), t, dest, { vol: vol * 0.25, pan }),
    // a low drum (a timpani-like membrane): f the pitch, vol, soft = a wider mallet, dk = decay
    drum(t, vol, f = 36.7, soft = 1, dk = 1, dest = bus) {
      const key = 'drum' + f + '_' + soft + '_' + dk;
      if (!fx.cache[key]) {
        const y = fx.hit(drumModes(f).map(([a, tau, b]) => [a, tau * dk, b]), { width: 0.006 * soft, amp: 1, noise: 0.25, nlen: 0.02, nhp: 300, len: 3.2 * Math.max(dk, 0.3) });
        const pk = ATX.peak(y) || 1; for (let i = 0; i < y.length; i++) y[i] /= pk;
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], t, dest, { vol: vol * 0.5 });
    },
    // a heartbeat: lub-dub on a soft low drum
    beat(t, vol, dest = bus) { M.drum(t, vol, 47, 1.6, 0.45, dest); M.drum(t + 0.17, vol * 0.62, 52, 1.6, 0.4, dest); },
    // a held chord: o.att/rel (s), o.cut → o.cutTo by o.cutAt (Hz), o.keys [[t, level]], o.wave, o.vib (cents),
    // o.glide (cents, from o.glideFrom by o.glideAt), o.pan, o.dest
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
      for (const nn of notes) {
        const f = atHz(nn);
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
// o.ramp(u) the level over the span, o.wave, o.stepAt(t) a changing step
function atPulse(ctx, dest, t0, t1, notes, step, vol, o = {}) {
  if (t1 - t0 < step) return;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.q || 4;
  lp.frequency.setValueAtTime(o.cut || 600, t0); lp.frequency.linearRampToValueAtTime(o.cutTo || o.cut || 600, t1);
  lp.connect(g); g.connect(dest); g.gain.value = 0;
  notes.forEach((n, k) => {
    const os = ctx.createOscillator(); os.type = o.wave || 'sawtooth'; os.frequency.value = atHz(n); os.detune.setValueAtTime(k % 2 ? 6 : -6, t0);
    os.connect(lp); os.start(t0); os.stop(t1 + 0.1);
  });
  for (let t = t0, i = 0; t < t1 - 0.01; t += (o.stepAt ? o.stepAt(t) : step), i++) {
    const acc = o.acc && i % o.acc === 0 ? 1.0 : 0.62, ramp = o.ramp ? o.ramp((t - t0) / (t1 - t0)) : 1, v = vol * 0.05 * acc * ramp, st = o.stepAt ? o.stepAt(t) : step;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.setTargetAtTime(0, t + 0.012, st * (o.decay || 0.28));
  }
}

// the endless rise (a Shepard–Risset glissando): octave-spaced sines whose pitch climbs for ever under a fixed
// bell-shaped loudness window. o.rate(t) octaves per second, o.env(t) its level (t = film time), o.det (cents, right)
function atShepard(fx, t0, t1, o = {}) {
  const sr = fx.sr, n = Math.ceil((t1 - t0) * sr), L = new Float32Array(n), R = new Float32Array(n), N = 9, f0 = 27.5;
  const c0 = Math.log2(o.centre || 330) - Math.log2(f0), sg = o.width || 1.25, rate = o.rate || (() => 1 / 26), env = o.env || (() => 1);
  const phL = new Float64Array(N), phR = new Float64Array(N), det = Math.pow(2, (o.det || 7) / 1200);
  let u = 0, eC = env(t0), rC = rate(t0);
  for (let i = 0; i < n; i++) {
    if ((i & 255) === 0) { const t = t0 + i / sr; eC = env(t); rC = rate(t); }
    u += rC / sr; const fr = u - Math.floor(u);
    let l = 0, rr = 0;
    for (let k = 0; k < N; k++) {
      const oc = k + fr, f = f0 * Math.pow(2, oc), a = Math.exp(-0.5 * Math.pow((oc - c0) / sg, 2));
      phL[k] += 2 * Math.PI * f / sr; phR[k] += 2 * Math.PI * f * det / sr;
      l += a * Math.sin(phL[k]); rr += a * Math.sin(phR[k]);
    }
    L[i] = l * eC; R[i] = rr * eC;
  }
  return [L, R];
}

const AT_CH = {
  Dmaj9: ['D2', 'A2', 'F#3', 'C#4', 'E4'],                                     // the air: the major third
  Dm9: ['D2', 'A2', 'F3', 'C4', 'E4'], Bbmaj7: ['Bb1', 'F2', 'D3', 'A3'], Gm9: ['G1', 'D2', 'Bb2', 'F3', 'A3'], A7sus: ['A1', 'E2', 'D3', 'G3'],
  Fadd9: ['F2', 'C3', 'A3', 'G4'], Flyd: ['F1', 'C2', 'A2', 'E3', 'B3'], Eblyd: ['Eb2', 'Bb2', 'G3', 'D4', 'A4'], Cadd9: ['C2', 'G2', 'E3', 'D4'],
  low: ['D2', 'A2', 'D3'], semi: ['D2', 'Eb2', 'A2'], cold: ['A5', 'D6', 'E6'], stab: ['Eb2', 'D3', 'A3', 'Bb3'], deep: ['D1', 'A1', 'D2'],
  cluster: ['D2', 'Eb2', 'A2', 'Bb2', 'E3', 'F3'],
};
const AT_THEME = ['F4', 'E4', 'D4', 'A3', 'Bb3'];            // a sigh down to the tonic, then a semitone off it: unresolved
window.AT_THEME = AT_THEME;
const atOct = (n, k) => n.replace(/-?\d$/, (d) => String(+d + k));

atSound('music', 'score', function (ctx, bus, K) {
  const M = atMusicKit(ctx, K), C = AT_CH, c = atC, B = atB, F = atFilmAt, E = ATE, END = AT.end, T0 = AT.tOn;
  const hit = (t, v = 0.9, f = 36.7) => { M.drum(t, v, f, 1.1, 1.8); M.drum(t + 0.012, 0.5 * v, f * 1.5, 1.3, 1.0); };
  const stab = (t, t1, v = 0.34) => { hit(t, 1.0, 29.1); M.drum(t + 0.01, 0.6, 43.7, 1.0, 1.0); M.strings(t, t1, C.stab, v, { att: 0.02, rel: 1.2, cut: 3000, cutTo: 800, cutAt: t1 }); };
  const motif = (t, o = {}) => (o.notes || AT_THEME).slice(0, o.n || 5).forEach((n, i) => M.piano(t + i * (o.gap || 1.6), atOct(n, o.oct || 0), (o.vel || 0.42) * (i ? 0.88 : 1), o.dur || 3.2, [-0.25, 0.2, -0.15, 0.25, 0][i]));
  const beats = (t0, t1, p0, p1, v0, v1) => { for (let t = t0; t < t1 - 0.2;) { const u = (t - t0) / (t1 - t0); M.beat(t, v0 + (v1 - v0) * u); t += p0 + (p1 - p0) * u; } };
  const twinkle = (t0, t1, d0, d1, notes, vol) => { const r = new RNG(Math.round(t0 * 100)); for (let t = t0; t < t1;) { M.bell(t, notes[r.int(0, notes.length - 1)], vol * (0.6 + 0.4 * r.next()), r.range(-0.8, 0.8)); const u = (t - t0) / (t1 - t0); t += (d0 + (d1 - d0) * u) * r.range(0.6, 1.4); } };
  const rise = (t0, t1, lvl, rate, centre = 360) => { const e = (t) => lvl * atEv(t, t0, t0 + 2) * (1 - atEv(t, t1 - 0.6, t1)); const [Lx, Rx] = atShepard(K.fx, t0, t1, { rate: typeof rate === 'function' ? rate : () => rate, env: e, centre, width: 1.3 }); K.fx.play(Lx, t0, M.bus, { xr: Rx, vol: 1 }); };
  // a muffled bus (the edges going dark; under water): its own low-pass
  const muff = (f) => { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.7; lp.frequency.value = f; lp.connect(M.bus); return lp; };

  // ================================================================== the clock: a toll on every step seen on screen
  // (the first 1% at 10:00 is the title's own hit; the others: a low piano D and a far bell, softer as the film goes)
  { const seen = []; for (let n = 1; n < 420; n++) { const t = atSeen(60 * n); if (t != null) seen.push(t); }
    for (const t of seen) { const u = t / END; M.piano(t + 0.02, 'D2', 0.34 - 0.1 * u, 4.5, -0.1); M.piano(t + 0.03, 'D1', 0.22, 4.5, 0.1); M.bell(t + 0.04, 'D6', 0.07, 0.3); } }
  // every jump forward: a piano note swelling backwards into the cut (time pulled past you)
  AT_JUMPS.forEach((j, i) => { if (j.t > T0 + 1 && j.t < END - 2) M.rpiano(j.t, ['A4', 'F4', 'E4', 'D4'][i % 4], 0.13, 1.3, i % 2 ? 0.3 : -0.3); });

  // ================================================================== the deck in the sun (the title): drained at 10:00
  { const day = ctx.createBiquadFilter(), dg = ctx.createGain(); day.type = 'lowpass'; day.Q.value = 0.8;
    day.frequency.setValueAtTime(15000, 0); day.frequency.setValueAtTime(15000, T0 - 0.04); day.frequency.exponentialRampToValueAtTime(140, T0 + 0.9);
    dg.gain.setValueAtTime(1, 0); dg.gain.setValueAtTime(1, T0 + 0.3); dg.gain.linearRampToValueAtTime(0, T0 + 1.4); day.connect(dg); dg.connect(M.bus);
    M.strings(0, T0 + 1.5, C.Dmaj9, 0.3, { att: 0.25, rel: 0.1, cut: 3200, dest: day });
    M.strings(0, T0 + 1.5, ['A5', 'D6', 'F#6'], 0.05, { att: 0.4, rel: 0.1, cut: 9000, wave: 'triangle', vib: 3, dest: day });
    ['A5', 'F#5', 'E5', 'D5', 'F#5', 'A5'].forEach((n, i) => M.bell(0.08 + i * 0.55, n, 0.28, [-0.3, 0.2, -0.1, 0.3, 0, -0.2][i], day));
    atPulse(ctx, day, 0, T0 + 1.4, ['D3', 'A3', 'F#4'], 0.42, 0.55, { cut: 2600, acc: 2, decay: 0.25 }); }

  // ================================================================== 10:00: the first 1%. The weight of the air
  hit(T0 + 0.02, 0.85, 36.7);
  M.strings(T0 + 0.3, B('ears') + 0.5, C.low, 0.28, { att: 2.5, rel: 1.2, cut: 230, cutTo: 480, cutAt: B('boil') });
  M.strings(T0 + 4, B('boil') + 0.3, C.semi, 0.12, { att: 4, rel: 0.8, cut: 420 });
  motif(c('start', 0) + 1.4, { gap: 1.8, vel: 0.36, n: 4, dur: 4, oct: -1 });
  M.prog([[B('weight'), C.Dm9], [c('weight', 1) - 0.3, C.Bbmaj7]], B('boil') + 0.3, 0.2, { cut: 750, lastRel: 0.6 });
  M.piano(c('weight', 0) + 0.6, 'A3', 0.3, 4); M.piano(c('weight', 0) + 2.4, 'F3', 0.26, 4);
  // 1% of the air: like climbing 85 m (the camera rises past the funnel): a slow bell line climbing
  ['D5', 'E5', 'F5', 'A5', 'C6', 'D6'].forEach((n, i) => M.bell(c('weight', 2) + 0.2 + i * 0.55, n, 0.16 + 0.02 * i, -0.4 + 0.16 * i));

  // ================================================================== the sea will boil at 3:39
  M.strings(B('boil') + 0.1, B('ears') + 0.6, C.Eblyd, 0.2, { att: 1.8, rel: 1.0, cut: 600, cutTo: 1500, cutAt: c('boil', 0) + 4 });
  M.strings(B('boil'), B('ears') + 0.6, C.deep, 0.22, { att: 1.0, rel: 1.0, cut: 200 });
  M.piano(c('boil', 0) + 0.3, 'Eb5', 0.22, 4, 0.3); M.piano(c('boil', 0) + 0.32, 'D4', 0.26, 4, -0.2);
  M.piano(c('boil', 1) + 0.2, 'D2', 0.36, 5); M.piano(c('boil', 1) + 0.22, 'A2', 0.26, 5);

  // ================================================================== ears; the balloon; 10:15 below any storm
  atPulse(ctx, M.bus, B('ears'), B('cabin'), ['D2', 'A2', 'D3'], 0.6, 0.7, { cut: 360, cutTo: 950, acc: 4, decay: 0.3, ramp: (u) => 0.5 + 0.5 * u });
  M.prog([[B('ears'), C.Dm9], [c('ears', 1) - 0.4, C.Gm9], [B('storm'), C.Bbmaj7], [c('storm', 1) - 0.3, C.A7sus]], B('cabin') + 0.4, 0.22, { cut: 850, lastRel: 0.5 });
  twinkle(c('ears', 1) - 0.2, B('storm') - 0.4, 0.9, 0.55, ['D6', 'E6', 'F6', 'A6'], 0.1);           // the balloon swelling
  { const t = atSeen(atHMS(10, 15)); if (t != null) { hit(t + 0.02, 0.8, 32.7); M.strings(t, B('cabin') + 0.3, ['Bb2', 'F3', 'D4', 'A4'], 0.16, { att: 1.5, rel: 0.6, cut: 900, cutTo: 2400 }); } }

  // ================================================================== 10:29 the cabin; the balloon bursts (10:30)
  { const tp = F(E.balloonPop);
    atPulse(ctx, M.bus, B('cabin'), tp - 0.05, ['D2', 'A2', 'F3'], 0.5, 0.75, { cut: 700, cutTo: 1500, acc: 4, decay: 0.28 });
    M.prog([[B('cabin'), C.Dm9], [c('cabin', 1) - 0.3, C.Bbmaj7]], tp, 0.22, { cut: 1100, lastRel: 0.05 });
    M.rpiano(tp, 'D5', 0.3, 1.8);
    stab(tp + 0.4, B('fizz') + 0.4, 0.3);                                                              // a held breath, then the stab
    M.strings(tp + 1.2, B('fizz') + 0.6, C.semi, 0.14, { att: 1.5, rel: 0.8, cut: 380 }); }

  // ================================================================== 10:35 the drinks foam over: cold sparkle
  M.strings(B('fizz'), B('stairs') + 0.5, C.Flyd, 0.18, { att: 1.5, rel: 1.0, cut: 1600 });
  twinkle(B('fizz') + 0.3, B('stairs') - 0.2, 0.32, 0.22, ['A6', 'B6', 'E7', 'C7', 'F#6'], 0.09);
  motif(c('fizz', 1) + 0.2, { gap: 1.3, vel: 0.28, n: 3, oct: 1, dur: 3 });

  // ================================================================== 10:44 a flight of stairs; the man by the pool
  beats(B('stairs') + 0.4, B('tanks'), 0.9, 0.72, 0.28, 0.42);
  M.prog([[B('stairs'), C.Dm9], [c('stairs', 1) - 0.4, C.Gm9], [c('stairs', 2) - 0.3, C.Bbmaj7]], B('tanks') + 0.4, 0.22, { cut: 800, lastRel: 0.4 });
  motif(c('stairs', 1) + 0.3, { gap: 1.5, vel: 0.34, n: 4, dur: 3.2 });
  ['D5', 'C5', 'A4', 'F4', 'D4'].forEach((n, i) => M.bell(c('stairs', 2) + 0.15 + i * 0.4, n, 0.14, 0.3 - 0.15 * i));   // 13 decks down

  // ================================================================== 10:46 you, the dive instructor: the plan
  { const t0 = B('tanks') + 0.1, t1 = B('down');
    atPulse(ctx, M.bus, t0 + 0.4, t1, ['D3', 'F3', 'A3'], 0.45, 0.75, { cut: 520, cutTo: 1700, acc: 4, decay: 0.26, ramp: (u) => 0.6 + 0.4 * u });
    beats(t0, t1, 0.72, 0.66, 0.36, 0.4);
    M.prog([[t0, C.Dm9], [c('tanks', 1) - 0.3, C.Bbmaj7], [c('tanks', 2) - 0.3, C.Flyd], [c('tanks', 3) - 0.3, C.A7sus]], t1 + 0.4, 0.24, { cut: 1000, lastRel: 0.4 });
    motif(c('tanks', 0) + 0.8, { notes: ['A3', 'D4', 'E4', 'F4'], n: 4, gap: 1.1, vel: 0.36, dur: 2.6 });            // the theme turned upwards
    M.strings(c('tanks', 2) - 0.1, c('tanks', 3) + 0.4, ['F3', 'C4', 'A4', 'E5'], 0.14, { att: 1.2, rel: 0.8, cut: 2600 });   // 10 m of sea
    ['D5', 'E5', 'F5', 'G5', 'A5', 'D6'].forEach((n, i) => M.bell(c('tanks', 3) + 0.25 + i * 0.33, n, 0.2, -0.5 + 0.2 * i)); }   // six tanks

  // ================================================================== 10:52 down 13 decks; the girl; her hand
  { const t0 = B('down'), t1 = F(E.choke);
    beats(t0 + 0.2, t1, 0.66, 0.58, 0.4, 0.5);
    atPulse(ctx, M.bus, t0, c('down', 1) - 0.3, ['D2', 'A2', 'D3'], 0.33, 0.6, { cut: 600, cutTo: 900, acc: 4, decay: 0.24 });
    M.prog([[t0, C.Dm9], [c('down', 1) - 0.4, C.Bbmaj7], [c('down', 2) - 0.2, C.Fadd9]], t1 + 0.2, 0.22, { cut: 900, lastRel: 0.3 });
    motif(c('down', 1) + 0.4, { oct: 1, vel: 0.26, gap: 1.2, n: 4, dur: 2.6 });                         // the girl
    M.piano(c('down', 2) + 0.35, 'F4', 0.3, 4, 0.1); M.piano(c('down', 2) + 0.38, 'A4', 0.26, 4, -0.1); M.piano(c('down', 2) + 0.42, 'C5', 0.22, 4); M.bell(c('down', 2) + 0.5, 'G6', 0.1); }

  // ================================================================== 11:08 the engines choke; 11:13 the power fails
  { const th = F(E.half), tb = F(E.blackout);
    M.strings(F(E.choke), tb, C.cluster, 0.22, { att: 1.0, rel: 0.04, cut: 260, cutTo: 2200, cutAt: tb - 0.2 });
    M.strings(F(E.choke), tb, C.deep, 0.28, { att: 0.6, rel: 0.04, cut: 180 });
    atPulse(ctx, M.bus, th + 0.3, tb, ['D2', 'Eb2', 'A2'], 0.3, 0.8, { cut: 420, cutTo: 2000, acc: 2, decay: 0.24, ramp: (u) => 0.5 + 0.5 * u });
    beats(th + 0.2, tb - 0.1, 0.56, 0.42, 0.45, 0.6);
    rise(th + 1.5, tb, 0.05, 1 / 7, 300);
    // the power fails: everything stops; one deep drum in the dark, a drone after it
    M.drum(tb + 0.05, 0.9, 27.5, 1.4, 2.4);
    M.strings(tb + 1.6, B('marina') + 0.6, C.deep, 0.24, { att: 2.5, rel: 0.6, cut: 150 }); }

  // ================================================================== 11:20 deck 2: the edges going dark; the roll
  { const t0 = B('marina'), tr = F(E.roll), lp = muff(700);
    beats(t0 + 0.2, tr - 0.1, 0.52, 0.4, 0.55, 0.7);
    atPulse(ctx, lp, t0 + 0.2, tr - 0.05, ['D2', 'A2', 'D3'], 0.4, 0.9, { cut: 400, cutTo: 900, acc: 2, decay: 0.22 });
    M.strings(t0, tr, C.semi, 0.22, { att: 1.0, rel: 0.05, cut: 300, cutTo: 700, cutAt: tr - 0.3 });
    M.strings(c('marina', 1) - 0.2, tr, ['D7', 'Eb7'], 0.03, { att: 2, rel: 0.05, cut: 12000, wave: 'sine', vib: 0 });     // the ears ringing
    rise(c('marina', 2) - 0.5, tr, 0.07, (t) => 1 / 14 + 0.06 * atEv(t, B('dive'), tr), 320);
    M.strings(B('dive'), tr, C.Eblyd, 0.18, { att: 2.0, rel: 0.05, cut: 500, cutTo: 2000, cutAt: tr - 0.2 }); }

  // ================================================================== under: you can breathe (D major, far); 4,300 can't
  { const t0 = F(E.roll) + 1.6, uw = muff(1300), uw2 = muff(2400);
    M.strings(t0, B('under') + 0.4, C.deep, 0.2, { att: 2.5, rel: 0.6, cut: 160, dest: uw });
    M.strings(t0 + 0.4, c('under', 1) + 0.2, ['A3', 'D4', 'E4', 'A4'], 0.2, { att: 2.2, rel: 0.8, cut: 1100, dest: uw2 });                // 10 m down: suspended
    ['D3', 'A3', 'E4'].forEach((n, i) => M.piano(c('under', 0) + 0.5 + i * 1.4, n, 0.3, 4, [-0.2, 0.15, 0][i]));
    M.strings(c('under', 1) - 0.4, c('under', 2) + 0.3, C.Dmaj9, 0.42, { att: 2.0, rel: 0.8, cut: 1900, dest: uw2 });
    ['F#4', 'A4', 'D5'].forEach((n, i) => M.piano(c('under', 1) + 0.6 + i * 0.5, n, 0.3, 4, [0.2, -0.15, 0][i]));
    M.strings(c('under', 1) - 0.2, c('under', 2) + 0.3, ['F#5', 'A5', 'D6'], 0.05, { att: 2.5, rel: 0.8, cut: 6000, wave: 'triangle', vib: 3 });
    M.strings(c('under', 2) - 0.1, B('everest') + 0.6, C.Dm9, 0.26, { att: 1.0, rel: 0.8, cut: 1200, dest: uw });       // the third falls
    motif(c('under', 2) + 0.4, { oct: -1, vel: 0.36, gap: 1.6, n: 5, dur: 3.5 }); }

  // ================================================================== 11:56 Everest; nobody awake
  M.strings(B('everest'), B('shark') + 0.5, C.cold, 0.06, { att: 2, rel: 1.0, cut: 9000, wave: 'triangle', vib: 2 });
  M.strings(B('everest'), B('shark') + 0.5, C.low, 0.22, { att: 1.5, rel: 1.0, cut: 260 });
  M.piano(c('everest', 1) + 0.3, 'D5', 0.28, 5); M.piano(c('everest', 1) + 2.4, 'Bb4', 0.22, 5);

  // ================================================================== 12:30 the whitetip, closing in
  { const t0 = B('shark'), ts = c('shark', 1), t1 = B('oxygen');
    M.strings(t0, t1 + 0.4, C.semi, 0.2, { att: 2, rel: 0.6, cut: 300, cutTo: 700, cutAt: t1 });
    twinkle(t0 + 0.3, ts - 0.6, 0.7, 0.9, ['A5', 'D6', 'E6'], 0.1);                                       // the fish
    M.strings(t0, ts + 0.3, C.Fadd9, 0.2, { att: 1.5, rel: 0.6, cut: 1300, cutTo: 700, cutAt: ts });
    stab(ts - 0.3, ts + 3, 0.26);
    for (let t = ts + 0.6, i = 0; t < t1 - 0.1; i++) { const u = (t - ts) / (t1 - ts); M.piano(t, i % 2 ? 'Eb2' : 'D2', 0.3 + 0.15 * u, 1.2, i % 2 ? 0.2 : -0.2); t += 0.78 - 0.3 * u; }
    beats(ts + 0.8, t1, 0.8, 0.55, 0.3, 0.5); }

  // ================================================================== 1:11 PM the bridge wing: a hush
  M.strings(B('oxygen'), B('rise') + 0.3, C.cold, 0.07, { att: 1.5, rel: 0.4, cut: 9000, wave: 'triangle', vib: 2 });
  M.strings(B('oxygen'), B('rise') + 0.3, C.deep, 0.2, { att: 1.5, rel: 0.4, cut: 170 });
  M.piano(c('oxygen', 0) + 0.5, 'Bb3', 0.24, 4);

  // ================================================================== 1:19 she lets go; you kick after her; the catch
  { const tl = F(E.letGo), tc = F(E.catch), t1 = B('sky');
    stab(tl + 0.02, tl + 2.5, 0.3);
    atPulse(ctx, M.bus, tl + 0.4, tc, ['D3', 'A3', 'D4'], 0.22, 0.85, { cut: 800, cutTo: 3000, acc: 4, decay: 0.22, ramp: (u) => 0.6 + 0.4 * u });
    beats(tl + 0.3, tc, 0.42, 0.32, 0.55, 0.75);
    rise(tl + 0.6, tc, 0.09, (t) => 1 / 8 + 0.12 * atEv(t, tl, tc), 360);
    M.strings(tl + 0.5, tc, C.Eblyd, 0.22, { att: 1.2, rel: 0.05, cut: 900, cutTo: 3400, cutAt: tc - 0.2 });
    hit(tc, 1.0, 32.7);
    M.strings(tc + 0.05, t1 + 0.5, C.Dm9, 0.26, { att: 0.05, rel: 1.2, cut: 2400, cutTo: 500, glide: -500, glideFrom: tc + 0.6, glideAt: t1 }); }   // pulled back down

  // ================================================================== 1:40 the sky going dark
  M.strings(B('sky'), B('tubs') + 0.5, C.Gm9, 0.22, { att: 1.5, rel: 1.0, cut: 1600, cutTo: 400 });
  M.strings(B('sky'), B('tubs') + 0.5, C.deep, 0.2, { att: 1.5, rel: 1.0, cut: 170 });
  twinkle(c('sky', 0) + 1.5, B('tubs'), 1.4, 1.0, ['D7', 'A6', 'E7'], 0.05);

  // ================================================================== 2:26 the hot tubs boil; 2:37 body temperature
  { const t0 = B('tubs'), t1 = B('stars'), r = new RNG(2626);
    M.strings(t0, t1 + 0.5, C.low, 0.22, { att: 1.0, rel: 1.0, cut: 240 });
    for (let t = F(E.tub) + 0.3; t < c('tubs', 1) - 0.3; t += r.range(0.12, 0.3)) M.piano(t, ['D2', 'A2', 'Eb3', 'D3', 'Bb2'][r.int(0, 4)], r.range(0.08, 0.16), 0.6, r.range(-0.6, 0.6));   // bubbling
    hit(F(E.body) + 0.02, 0.8, 30.9);
    M.strings(F(E.body), t1 + 0.5, C.Eblyd, 0.18, { att: 2.0, rel: 1.0, cut: 700 });
    motif(c('tubs', 2) + 0.3, { oct: -1, vel: 0.3, gap: 1.7, n: 4, dur: 3.5 }); }

  // ================================================================== 3:00 stars beside the Sun
  { const t0 = B('stars'), t1 = B('sea');
    M.strings(t0, t1 + 0.6, C.Flyd, 0.2, { att: 2.0, rel: 1.0, cut: 2400 });
    M.strings(t0, t1 + 0.6, ['B5', 'E6', 'A6'], 0.05, { att: 2.5, rel: 1.0, cut: 9000, wave: 'triangle', vib: 2 });
    twinkle(t0 + 0.4, t1, 0.6, 0.35, ['E6', 'A6', 'B6', 'E7', 'F#7'], 0.1);
    AT_THEME.forEach((n, i) => M.bell(c('stars', 1) + 0.3 + i * 0.9, atOct(n, 2), 0.16, [-0.3, 0.2, -0.1, 0.3, 0][i])); }

  // ================================================================== 3:27 the pool; 3:39 the ocean boils (heard from below)
  { const tp = F(E.pool), ts = F(E.sea), t1 = B('last'), uw = muff(1500);
    M.strings(B('sea'), ts, C.cluster, 0.18, { att: 1.5, rel: 0.05, cut: 300, cutTo: 2600, cutAt: ts - 0.1 });
    rise(tp + 0.5, ts, 0.08, (t) => 1 / 10 + 0.08 * atEv(t, tp, ts), 340);
    beats(tp + 0.4, ts, 0.7, 0.45, 0.35, 0.6);
    hit(ts, 1.0, 27.5); M.drum(ts + 0.02, 0.7, 41.2, 1.0, 1.4);
    M.strings(ts + 0.02, c('sea', 2) - 0.4, [...C.cluster, 'D4', 'Eb4'], 0.24, { att: 0.08, rel: 0.6, cut: 3200, cutTo: 1800 });
    M.strings(c('sea', 2) - 0.5, t1 + 0.5, C.cluster, 0.32, { att: 0.3, rel: 1.0, cut: 1400, cutTo: 450, dest: uw });   // only the top: down here, muffled
    motif(c('sea', 2) + 0.6, { oct: -1, vel: 0.34, gap: 1.5, n: 4, dur: 3.5 });
    M.strings(c('sea', 2) - 0.5, t1 + 0.5, C.deep, 0.22, { att: 0.5, rel: 1.0, cut: 160, dest: uw }); }

  // ================================================================== the last tank; the question (cut on the last frame)
  { const t0 = B('last'), tq = c('question', 0);
    M.strings(t0, END + 0.05, C.Dm9, 0.2, { att: 2.0, rel: 0.05, cut: 700 });
    M.strings(t0, END + 0.05, C.cold, 0.05, { att: 3.0, rel: 0.05, cut: 9000, wave: 'triangle', vib: 2 });
    beats(t0 + 0.6, tq, 1.0, 1.2, 0.32, 0.22);
    motif(c('last', 0) + 0.6, { vel: 0.36, gap: 1.9, n: 5, dur: 4 });
    twinkle(c('last', 1) + 0.2, tq - 0.3, 0.8, 1.2, ['E6', 'A6', 'D7'], 0.07);
    M.rpiano(tq, 'A4', 0.3, 2.2);
    M.bell(tq + 0.05, 'D6', 0.22); M.piano(tq + 0.06, 'F4', 0.32, 6); M.piano(tq + 0.08, 'Bb3', 0.28, 6); }
});

AT_SOUND_FNS.push(atMusicKit, atPulse, atShepard);
