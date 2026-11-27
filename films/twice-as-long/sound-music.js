/* =====================================================================
   SOUND · MUSIC — an original score, all synthesised (the music kit of the ocean-rising film, renamed, plus a plucked
   string, a dry kick and a tick): string pads, a felt piano, glass bells, plucks, low drums, a synth pulse, the
   endless rise. Its two ideas are the film's:
     the step     a note and the note an octave above it (an octave is twice the frequency: a step twice as long)
     home         three notes falling (G E C): your front door. It comes back every time the film thinks of home,
                  always in C, the street's key, wherever the rest of the score has gone.
   The plan, place by place:
     the open      step ninety: a vast D major hit, cut at the cut to step one
     the street    C major, bright plucks; each step's note a step higher; the step back runs down; home's motif
     the rule      bells whose gaps double; a steady tick for "one second"
     to work       A minor, a building pulse and drums; the Statue: a lift; "a problem": the endless rise, and the
                   boom cuts the music dead
     after it      D minor, driving; a hit on every step; "keeping you alive": it opens out; "That was your office":
                   it stops dead; missing it: a small sad figure
     away          step fifteen: the rise; the meteor: the score at full stretch; Boston: it holds its breath
     space         D major, open fifths and bells; "Look back": home's motif; "that was the Moon": a cheeky bell
     the barrier   a low cluster; "Time": the strings bend down
     the planets   a majestic ladder: a hit on each planet as it passes
     alone         thin and high; the posters: home's motif on a music box
     the turn      home's motif, warm; eleven years: bittersweet
     the deep      building to step seventy (the biggest moment in the film); the web: a vast drone; the red giant: a
                   low toll; step ninety: the open's hit again
     the end       home's motif one last time; "step ninety-one": the step motif climbing and not resolving; one bell,
                   cut on the last frame
   ===================================================================== */

// the kit: string pads (three detuned oscillators per note through low-passes), felt piano, bells, plucks, drums
function twMusicKit(ctx, K, dest) {
  if (K._music) return K._music;
  const fx = K.fx, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(), dry = ctx.createGain(); bus.connect(dest); dry.connect(dest);
  const hall = fx.ir(4.8, { bright: 0.5, damp: 2.5, shape: 2.0, pre: 0.025, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.5;
  bus.connect(hall); hall.connect(wet); wet.connect(dest);
  const drumModes = (f) => [[f, 0.7, 1], [f * 1.51, 0.45, 0.5], [f * 1.99, 0.3, 0.35], [f * 2.44, 0.2, 0.2], [f * 3.1, 0.12, 0.12]];
  const drumBuf = (f, soft, dk) => {
    const key = 'drum' + f + '_' + soft + '_' + dk;
    if (!fx.cache[key]) {
      const y = fx.hit(drumModes(f).map(([a, tau, b]) => [a, tau * dk, b]), { width: 0.006 * soft, amp: 1, noise: 0.25, nlen: 0.02, nhp: 300, len: 3.2 * Math.max(dk, 0.3) });
      const pk = TWX.peak(y) || 1; for (let i = 0; i < y.length; i++) y[i] /= pk;
      fx.cache[key] = y;
    }
    return fx.cache[key];
  };
  const M = {
    bus, dry,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4) => {
      const b = fx.pianoBuf(twMidi(n)), len = Math.min(b.length, Math.ceil((dur + fade + 0.05) * fx.sr));
      return fx.play(b.subarray(0, len), t, bus, { vol: vel * 0.34, pan, stop: t + dur + fade, fade });
    },
    bell: (t, n, vol, pan = 0) => fx.play(fx.bellBuf(twMidi(n)), t, bus, { vol: vol * 0.25, pan }),
    // a plucked string (Karplus–Strong with a fractional delay, so it is in tune up high), cached per pitch
    pluck(t, n, vol, pan = 0, dec = 1.2) {
      const m = twMidi(n), key = 'pl' + m + '_' + dec;
      if (!fx.cache[key]) {
        const sr = fx.sr, f = twHz(m), P = sr / f, D = P - 0.5, len = Math.ceil(Math.min(4, dec * 1.1 + 0.2) * sr), y = new Float32Array(len), rr = new RNG(700 + m);
        const g = Math.pow(0.001, 1 / (f * dec)), nb = Math.ceil(P);
        let lp = 0;
        for (let i = 0; i < len; i++) {
          let ex = 0; if (i < nb) { lp += 0.55 * (rr.next() * 2 - 1 - lp); ex = lp; }
          const k = i - D, k0 = Math.floor(k), fr = k - k0, a = k0 >= 0 ? y[k0] : 0, b = k0 + 1 >= 0 ? y[k0 + 1] : 0, c = k0 - 1 >= 0 ? y[k0 - 1] : 0;
          y[i] = ex + g * 0.5 * ((a + (b - a) * fr) + (c + (a - c) * fr));
        }
        TWX.bq(y, 'lp', 5200, 0.7, sr); TWX.bq(y, 'hp', 60, 0.7, sr);
        const on = Math.round(0.002 * sr); for (let i = 0; i < len; i++) y[i] *= Math.min(1, i / on, (len - i) / (0.05 * sr));
        const pk = TWX.peak(y) || 1; for (let i = 0; i < len; i++) y[i] /= pk;
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], t, bus, { vol: vol * 0.3, pan });
    },
    // a low drum (a timpani-like membrane): f the pitch, vol, soft = a wider mallet, dk = decay
    drum: (t, vol, f = 36.7, soft = 1, dk = 1) => fx.play(drumBuf(f, soft, dk), t, bus, { vol: vol * 0.5 }),
    // a short dry kick and a tick (the groove: these stay out of the hall)
    kick: (t, vol) => fx.play(drumBuf(49, 0.7, 0.32), t, dry, { vol: vol * 0.55 }),
    tick(t, vol, pan = 0) {
      if (!fx.cache.tick) { const n = Math.round(0.06 * fx.sr), y = fx.white(n); TWX.bq(y, 'hp', 6500, 0.7, fx.sr); for (let i = 0; i < n; i++) y[i] *= Math.exp(-i / (0.011 * fx.sr)); const pk = TWX.peak(y) || 1; for (let i = 0; i < n; i++) y[i] /= pk; fx.cache.tick = y; }
      return fx.play(fx.cache.tick, t, dry, { vol: vol * 0.12, pan });
    },
    // a held chord: o.att/rel (s), o.cut → o.cutTo by o.cutAt (Hz), o.keys [[t, level]], o.wave, o.vib (cents), o.pan,
    // o.bend [t, cents, s] (every note glides by `cents` from t over s)
    strings(t0, t1, notes, vol, o = {}) {
      t0 = Math.max(0, t0); if (t1 - t0 < 0.1) return;
      const att = Math.min(o.att || 1.0, (t1 - t0) * 0.45), rel = Math.min(o.rel || 1.2, (t1 - t0) * 0.45), g = ctx.createGain();
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol * 0.11 * (o.keys ? o.keys[0][1] : 1), t0 + att);
      for (const [t, v] of (o.keys || [])) if (t > t0 + att && t < t1 - rel) g.gain.linearRampToValueAtTime(vol * 0.11 * v, t);
      const vEnd = o.keys ? o.keys[o.keys.length - 1][1] : 1;
      g.gain.linearRampToValueAtTime(vol * 0.11 * vEnd, Math.max(t0 + att + 0.01, t1 - rel)); g.gain.linearRampToValueAtTime(0, t1);
      g.connect(bus);
      const lanes = [-0.55, 0, 0.55].map((p) => {
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.6; lp.frequency.setValueAtTime(o.cut || 1700, t0);
        if (o.cutTo) lp.frequency.linearRampToValueAtTime(o.cutTo, o.cutAt || (t1 - rel * 0.5));
        const pn = ctx.createStereoPanner(); pn.pan.value = Math.max(-1, Math.min(1, p + (o.pan || 0))); lp.connect(pn); pn.connect(g); return lp;
      });
      for (const nn of notes) {
        const f = twHz(nn);
        [-7, 1, 6].forEach((d, k) => {
          const osc = ctx.createOscillator(), og = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
          osc.type = o.wave || 'sawtooth'; osc.frequency.setValueAtTime(f, t0);
          if (o.bend) { osc.frequency.setValueAtTime(f, Math.max(t0, o.bend[0])); osc.frequency.exponentialRampToValueAtTime(f * Math.pow(2, o.bend[1] / 1200), Math.max(t0, o.bend[0]) + o.bend[2]); }
          osc.detune.setValueAtTime(d + r.range(-2, 2), t0);
          lfo.frequency.value = r.range(4.4, 5.4); lg.gain.setValueAtTime(0, t0); lg.gain.linearRampToValueAtTime(o.vib == null ? 7 : o.vib, t0 + Math.min(1.5, (t1 - t0) * 0.6));
          lfo.connect(lg); lg.connect(osc.detune);
          og.gain.value = 1 / Math.sqrt(notes.length); osc.connect(og); og.connect(lanes[k]);
          osc.start(t0); osc.stop(t1 + 0.05); lfo.start(t0); lfo.stop(t1 + 0.05);
        });
      }
    },
    // a chord progression: [[t0, notes], …] each held to the next; the last one ends at t1
    prog(steps, t1, vol, o = {}) {
      steps.forEach(([t0, notes], i) => { const last = i + 1 >= steps.length; M.strings(t0, last ? t1 : steps[i + 1][0] + 0.35, notes, vol, Object.assign({ att: 0.6, rel: 0.6 }, o, last && o.lastRel ? { rel: o.lastRel } : {})); });
    },
  };
  // the hall's return, so a dead stop can kill the tail too: kill(t, back) drops it at t and brings it back over 2 s from back
  M.kill = (t, back) => { wet.gain.setValueAtTime(0.5, t - 0.01); wet.gain.linearRampToValueAtTime(0, t + 0.12); wet.gain.setValueAtTime(0, back); wet.gain.linearRampToValueAtTime(0.5, back + 2); };
  return (K._music = M);
}

// a synth pulse: each step a short chord through a low-pass (cut → cutTo over the span); o.acc accents every n steps,
// o.ramp(u) the level over the span
function twPulse(ctx, dest, t0, t1, notes, step, vol, o = {}) {
  if (t1 - t0 < step) return;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.q || 4;
  lp.frequency.setValueAtTime(o.cut || 600, t0); lp.frequency.linearRampToValueAtTime(o.cutTo || o.cut || 600, t1);
  lp.connect(g); g.connect(dest); g.gain.value = 0;
  notes.forEach((n, k) => { const os = ctx.createOscillator(); os.type = o.wave || 'sawtooth'; os.frequency.value = twHz(n); os.detune.setValueAtTime(k % 2 ? 6 : -6, t0); os.connect(lp); os.start(t0); os.stop(t1 + 0.1); });
  for (let t = t0, i = 0; t < t1 - 0.01; t += step, i++) {
    const acc = o.acc && i % o.acc === 0 ? 1.0 : 0.62, ramp = o.ramp ? o.ramp((t - t0) / (t1 - t0)) : 1, v = vol * 0.05 * acc * ramp;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.setTargetAtTime(0, t + 0.012, step * (o.decay || 0.28));
  }
}
// the endless rise (a Shepard–Risset glissando): octave-spaced sines climbing for ever under a fixed loudness window
function twShepard(fx, t0, t1, o = {}) {
  const sr = fx.sr, n = Math.ceil((t1 - t0) * sr), L = new Float32Array(n), R = new Float32Array(n), N = 9, f0 = 27.5;
  const c0 = Math.log2(o.centre || 330) - Math.log2(f0), sg = o.width || 1.25, rate = o.rate || (() => 1 / 26), env = o.env || (() => 1);
  const phL = new Float64Array(N), phR = new Float64Array(N), det = Math.pow(2, (o.det || 7) / 1200);
  let u = 0, eC = env(t0), rC = rate(t0);
  for (let i = 0; i < n; i++) {
    if ((i & 255) === 0) { const t = t0 + i / sr; eC = env(t); rC = rate(t); }
    u += rC / sr; const fr = u - Math.floor(u);
    let l = 0, rr = 0;
    for (let k = 0; k < N; k++) { const oc = k + fr, f = f0 * Math.pow(2, oc), a = Math.exp(-0.5 * Math.pow((oc - c0) / sg, 2)); phL[k] += 2 * Math.PI * f / sr; phR[k] += 2 * Math.PI * f * det / sr; l += a * Math.sin(phL[k]); rr += a * Math.sin(phR[k]); }
    L[i] = l * eC; R[i] = rr * eC;
  }
  return [L, R];
}
const twOct = (n, k) => n.replace(/-?\d$/, (d) => String(+d + k));

const TW_CH = {
  // the street (C major)
  Cadd9: ['C2', 'G2', 'E3', 'D4'], Fmaj7: ['F1', 'C2', 'A2', 'E3'], G6: ['G1', 'D2', 'B2', 'E3'], Am9: ['A1', 'E2', 'C3', 'G3', 'B3'],
  CE: ['E2', 'C3', 'G3', 'D4'], Gsus: ['G1', 'D2', 'C3', 'F3'], Dm7: ['D2', 'A2', 'F3', 'C4'],
  // the walk to work (A minor)
  Am: ['A1', 'E2', 'A2', 'C3', 'E3'], F: ['F1', 'C2', 'A2', 'C3'], C: ['C2', 'G2', 'E3', 'G3'], G: ['G1', 'D2', 'B2', 'D3'], Dm: ['D2', 'A2', 'F3', 'A3'],
  Esus: ['E2', 'B2', 'A3', 'E4'], E: ['E2', 'B2', 'G#3', 'E4'], cluster: ['D2', 'Eb2', 'A2', 'Bb2', 'E3', 'F3'],
  // after the boom (D minor)
  Dm9: ['D2', 'A2', 'F3', 'C4', 'E4'], Bbmaj7: ['Bb1', 'F2', 'D3', 'A3'], Gm9: ['G1', 'D2', 'Bb2', 'F3', 'A3'], A7sus: ['A1', 'E2', 'D3', 'G3'],
  Fadd9: ['F2', 'C3', 'A3', 'G4'], Cadd9h: ['C3', 'G3', 'E4', 'D5'], stab: ['Eb2', 'D3', 'A3', 'Bb3'], Bblyd: ['Bb1', 'F2', 'D3', 'A3', 'E4'],
  // space and the deep (D major)
  Dmaj9: ['D2', 'A2', 'F#3', 'C#4', 'E4'], Gmaj7: ['G1', 'D2', 'B2', 'F#3'], Asus: ['A1', 'E2', 'D3', 'E3'], A: ['A1', 'E2', 'C#3', 'E3'],
  Bm7: ['B1', 'F#2', 'D3', 'A3'], Em9: ['E2', 'B2', 'G3', 'D4', 'F#4'], DF: ['F#1', 'D2', 'A2', 'E3'], fifths: ['D2', 'A2', 'E3', 'B3'],
  Glyd: ['G1', 'D2', 'B2', 'C#4', 'F#4'], Eblyd: ['Eb2', 'Bb2', 'G3', 'D4', 'A4'], cold: ['A5', 'D6', 'E6'], low: ['D2', 'A2', 'D3'], deep: ['D1', 'A1', 'D2'],
  dark: ['D1', 'A1', 'Eb2', 'D2'], sus: ['D2', 'A2', 'E3', 'G3'],
};
const TW_STEP_M = ['C4', 'C5', 'G4'];          // the step: a note, its octave (twice the frequency), its fifth
const TW_HOME_M = ['G4', 'E4', 'C4'];          // home: your front door, always in C
window.TW_THEME = Object.assign(window.TW_THEME || {}, { step: TW_STEP_M, home: TW_HOME_M, ch: TW_CH });

twSound('music', 'score', function (ctx, bus, K) {
  const M = twMusicKit(ctx, K, bus), C = TW_CH, fx = K.fx, END = TW.end;
  const S = (n) => TW_T[n], Ld = (n) => TW_T[n] + (TW_D[n] || 0), W = (id, k = 0) => twW(id, k), Ee = (id) => twE(id), wd = (id, x, i = 0) => twWord(id, x, i).start, B = (m) => twShotOf(m).t0;
  const hit = (t, v = 0.9, f = 36.7) => { M.drum(t, v, f, 1.1, 1.8); M.drum(t + 0.012, 0.5 * v, f * 1.5, 1.3, 1.0); };
  const stab = (t, t1, notes, v = 0.3) => { hit(t, 1.0, 29.1); M.strings(t, t1, notes, v, { att: 0.02, rel: 1.2, cut: 3000, cutTo: 800, cutAt: t1 }); };
  const rise = (t0, t1, lvl, rate, centre = 360) => { const e = (t) => lvl * twEv(t, t0, t0 + 2) * (1 - twEv(t, t1 - 0.25, t1)); const [Lx, Rx] = twShepard(fx, t0, t1, { rate: () => rate, env: e, centre, width: 1.3 }); fx.play(Lx, t0, M.bus, { xr: Rx, vol: 1 }); };
  const twinkle = (t0, t1, d0, notes, vol) => { const r = new RNG(Math.round(t0 * 100)); for (let t = t0; t < t1;) { M.bell(t, notes[r.int(0, notes.length - 1)], vol * (0.6 + 0.4 * r.next()), r.range(-0.8, 0.8)); t += d0 * r.range(0.6, 1.4); } };
  const arp = (t0, t1, notes, step, vol, o = {}) => { let i = 0; for (let t = t0; t < t1 - 0.02; t += step, i++) M.pluck(t, notes[i % notes.length], vol * (i % (o.acc || 4) === 0 ? 1 : 0.72) * (o.ramp ? o.ramp((t - t0) / (t1 - t0)) : 1), (i % 2 ? 0.3 : -0.3) * (o.spread ?? 1), o.dec || 0.9); };
  const groove = (t0, t1, beat, vol, o = {}) => { let i = 0; for (let t = t0; t < t1 - 0.05; t += beat / 2, i++) { const g = vol * (o.ramp ? o.ramp((t - t0) / (t1 - t0)) : 1); if (i % 4 === 0 || (o.four && i % 2 === 0)) M.kick(t, g); if (o.ticks !== false) M.tick(t, g * (i % 2 ? 1 : 0.5), i % 2 ? 0.35 : -0.35); if (o.tom && i % 8 === 7) M.drum(t, 0.3 * g, 82.4, 1.2, 0.45); } };
  const motif = (t, notes, o = {}) => notes.forEach((n, i) => (o.bell ? M.bell(t + i * (o.gap || 0.7), n, (o.vel || 0.16) * (i ? 0.9 : 1), [-0.2, 0.2, 0][i % 3]) : M.piano(t + i * (o.gap || 0.7), n, (o.vel || 0.36) * (i ? 0.9 : 1), o.dur || 3.2, [-0.2, 0.2, 0][i % 3])));
  const home = (t, o = {}) => motif(t, TW_HOME_M.map((n) => twOct(n, o.oct || 0)), o);
  // the open's hit (step ninety), heard twice: at the very start, and when step ninety comes round
  const ninety = (t, t1, o = {}) => {
    hit(t, 1.0, 29.1); M.drum(t + 0.01, 0.6, 36.7, 1.2, 1.4);
    M.strings(t, t1, C.Dmaj9, 0.3, { att: 0.04, rel: o.rel || 0.12, cut: 2600, cutTo: 1400, cutAt: t1 });
    M.strings(t, t1, C.deep, 0.24, { att: 0.04, rel: o.rel || 0.12, cut: 220 });
    M.strings(t + 0.1, t1, ['A4', 'D5', 'E5', 'F#5'], 0.07, { att: 0.6, rel: o.rel || 0.12, cut: 6000, wave: 'triangle', vib: 4 });
    M.bell(t + 0.02, 'D6', 0.2, -0.2); M.bell(t + 0.3, 'A6', 0.12, 0.3); M.piano(t + 0.01, 'D2', 0.34, 3); M.piano(t + 0.02, 'A2', 0.26, 3);
  };

  // ================================================================== the open: step ninety (cut at the cut)
  { const tc = B('stoop'); ninety(0.02, tc + 0.03, { rel: 0.06 }); rise(0.02, tc + 0.03, 0.05, 1 / 6, 500); }

  // ================================================================== step one; the morning (C major, plucks)
  { const t1 = wd('one', 'one');
    M.bell(t1 + 0.05, 'C6', 0.12, 0.2);
    M.pluck(Ld(1), 'C4', 0.5, -0.1); M.pluck(Ld(1) + 0.01, 'C3', 0.35, 0.1);
    const a = W('late'), tw = wd('late', 'twice');
    M.prog([[a, C.Cadd9], [wd('late', "you're"), C.Fmaj7], [wd('late', 'and'), C.G6], [tw, C.Cadd9]], S(2) + 0.5, 0.15, { cut: 1300, wave: 'triangle', vib: 4 });
    arp(a + 0.05, tw - 0.05, ['C4', 'G4', 'E4', 'G4'], 0.3, 0.3, { ramp: (u) => 0.6 + 0.4 * u });
    // "twice as long": a run up an octave, each note twice as long as the last
    { let t = tw; ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => { M.pluck(t, n, 0.45, [-0.3, 0.1, 0.3, 0][i]); t += 0.12 * Math.pow(2, i); }); }
    groove(a + 1.2, S(2) - 0.05, 0.6, 0.35, { ticks: true, ramp: (u) => 0.5 + 0.5 * u }); }

  // ================================================================== steps two to five: a step higher each time
  { const notes = { 2: 'G4', 3: 'C5', 4: 'E5' };
    for (const n of [2, 3, 4]) { M.pluck(Ld(n), notes[n], 0.55, 0); M.pluck(Ld(n) + 0.02, twOct(notes[n], -1), 0.35, 0.2); M.bell(Ld(n) + 0.01, twOct(notes[n], 1), 0.1, -0.2); M.kick(Ld(n), 0.5); }
    M.prog([[S(2), C.Cadd9], [S(3), C.Fmaj7], [wd('three', "that's"), C.Dm7], [S(4), C.G6], [wd('four', 'right'), C.Am9], [wd('four', 'bus'), C.Fmaj7]], W('back') + 0.3, 0.16, { cut: 1500, wave: 'triangle', vib: 4 });
    arp(S(2) + 0.2, S(3) - 0.1, ['C4', 'G4', 'E4', 'G4'], 0.3, 0.3);
    arp(S(3) + 0.2, wd('three', "that's") - 0.1, ['F4', 'C5', 'A4', 'C5'], 0.3, 0.3);
    // "That's a bit much.": a raised eyebrow
    M.pluck(wd('three', "that's") + 0.55, 'B4', 0.35, 0.3); M.pluck(wd('three', "that's") + 0.75, 'C5', 0.3, 0.3);
    arp(S(4) + 0.2, W('back') - 0.1, ['G3', 'D4', 'B3', 'E4', 'A3', 'E4', 'C4', 'E4'], 0.25, 0.34, { ramp: (u) => 0.7 + 0.3 * u });
    groove(S(2) + 0.3, W('back') - 0.1, 0.6, 0.4, { tom: true });
    // "So you step back.": everything holds its breath
    M.strings(W('back') - 0.1, S(5) + 0.2, C.Gsus, 0.15, { att: 0.3, rel: 0.2, cut: 1100, wave: 'triangle' });
    M.pluck(W('back') + 0.3, 'G4', 0.3, -0.3); M.pluck(W('back') + 0.9, 'F4', 0.25, 0.3);
    // step five, backwards over the bus: the step's run going down
    { const t0 = S(5) + 0.1, d = TW_D[5] - 0.2, ns = ['G5', 'E5', 'C5', 'G4', 'E4', 'C4']; ns.forEach((n, i) => M.pluck(t0 + d * i / ns.length, n, 0.42, 0.4 - 0.16 * i));
      M.strings(S(5), Ld(5) + 0.2, ['G3', 'D4', 'G4'], 0.08, { att: 0.8, rel: 0.2, cut: 3000, cutTo: 900, wave: 'triangle' }); }
    M.kick(Ld(5), 0.7); M.pluck(Ld(5), 'C4', 0.5, 0); M.pluck(Ld(5) + 0.01, 'C3', 0.4, 0);
    M.prog([[Ld(5), C.Cadd9], [B('busFaces'), C.Fmaj7]], W('home') + 0.3, 0.15, { cut: 1500, wave: 'triangle', vib: 4 });
    arp(Ld(5) + 0.3, W('home') - 0.1, ['C4', 'G4', 'E4', 'G4'], 0.3, 0.28);
    groove(Ld(5) + 0.3, W('home') - 0.1, 0.6, 0.32); }

  // ================================================================== home: your own front step (the motif, first time)
  M.prog([[W('home'), C.Fmaj7], [wd('home', 'right'), C.CE]], W('rule') + 0.3, 0.2, { cut: 1700, cutTo: 2400, lastRel: 0.6 });
  M.strings(W('home'), W('rule') + 0.3, ['C2', 'G2'], 0.14, { att: 1.0, rel: 0.6, cut: 300 });
  home(wd('home', 'front') - 0.1, { gap: 0.6, vel: 0.4 });
  M.bell(wd('home', 'front') + 1.5, 'C6', 0.1, 0.3);

  // ================================================================== the rule: bells whose gaps double; one second each
  { const a = W('rule'), te = wd('rule', 'every'), ta = wd('rule', 'and');
    M.prog([[a, C.Am9], [ta, C.Fmaj7]], W('sum') + 0.3, 0.2, { cut: 1100, cutTo: 2000, lastRel: 0.5 });
    M.strings(a, W('sum') + 0.3, ['A1', 'E2'], 0.14, { att: 0.8, rel: 0.5, cut: 260 });
    ['C5', 'E5', 'G5', 'C6', 'E6'].forEach((n, k) => M.bell(te + 0.18 * (Math.pow(2, k) - 1), n, 0.16, [-0.4, 0.3, -0.2, 0.4, 0][k]));
    for (let k = 0; k < 4; k++) M.pluck(ta + 0.1 + k * 1.0, k % 2 ? 'E4' : 'A4', 0.32, k % 2 ? 0.3 : -0.3);
    // every new step is longer than all the others together: the plucks pile up into one chord
    const b = W('sum'), tg = wd('sum', 'together');
    M.prog([[b, C.Dm7], [b + 2.0, C.G6]], W('loop') + 0.3, 0.18, { cut: 1300, wave: 'triangle', vib: 4 });
    arp(b + 0.1, tg - 0.05, ['D4', 'A4', 'F4', 'C5', 'E5'], 0.3, 0.3, { acc: 5 });
    ['C4', 'G4', 'C5', 'E5', 'G5'].forEach((n, i) => M.pluck(tg + 0.02 + 0.015 * i, n, 0.36, -0.4 + 0.2 * i));
    // step back, and you'll always land at home: the motif again, and "Remember that."
    const c0 = W('loop');
    M.prog([[c0, C.Fmaj7], [wd('loop', 'front'), C.CE], [wd('loop', 'remember'), C.Am9]], W('work') + 0.2, 0.18, { cut: 1500, lastRel: 0.4 });
    groove(c0 + 0.1, wd('loop', 'front') - 0.3, 0.6, 0.25, { ticks: true });
    home(wd('loop', 'front') - 0.1, { gap: 0.6, vel: 0.36 });
    M.bell(wd('loop', 'remember') + 0.1, 'G5', 0.12, -0.2); M.bell(wd('loop', 'remember') + 0.5, 'E5', 0.1, 0.2); }

  // ================================================================== the walk to work: A minor, building
  { const a = W('work'), tw = wd('work', "you'll");
    M.strings(a, S(6) + 0.3, C.Am, 0.16, { att: 0.5, rel: 0.3, cut: 700, cutTo: 1500 });
    twPulse(ctx, M.bus, a + 0.2, S(6), ['A1', 'E2', 'A2'], 0.3, 0.45, { cut: 300, cutTo: 900, acc: 4, decay: 0.3, ramp: (u) => 0.4 + 0.6 * u });
    // "You'll walk.": a pickup into step six
    for (let k = 0; k < 4; k++) M.drum(S(6) - 1.2 + k * 0.3, 0.2 + 0.08 * k, 73.4, 1.2, 0.4);
    M.pluck(tw + 0.4, 'E4', 0.3, 0.2); M.pluck(tw + 0.6, 'A4', 0.36, -0.2);
    // steps six to nine: the chords change with the steps, a drum on every landing
    const P = [[S(6), C.Am], [B('taxi'), C.F], [S(7), C.C], [B('speed7'), C.G], [B('crack'), C.Dm], [B('phones'), C.Esus], [B('phones') + 1.0, C.E],
      [S(8), C.Am], [B('statue'), C.F], [S(9), C.C], [B('awnings'), C.Dm]];
    M.prog(P, W('warn') + 0.2, 0.2, { cut: 900, cutTo: 2400, lastRel: 0.3 });
    twPulse(ctx, M.bus, S(6), W('warn'), ['A1', 'E2', 'A2'], 0.3, 0.6, { cut: 500, cutTo: 1800, acc: 4, decay: 0.28, ramp: (u) => 0.6 + 0.4 * u });
    groove(S(6), W('warn') - 0.1, 0.6, 0.55, { four: false, tom: true, ramp: (u) => 0.6 + 0.4 * u });
    groove(S(8), W('warn') - 0.1, 0.6, 0.35, { four: true, ticks: false });
    for (const n of [6, 7, 8, 9]) { hit(Ld(n), 0.5 + 0.06 * (n - 6), 36.7); M.pluck(Ld(n), ['A4', 'C5', 'E5', 'A5'][n - 6], 0.4, 0); M.pluck(Ld(n) + 0.12, ['A5', 'C6', 'E6', 'A6'][n - 6], 0.22, 0.3); }
    // the crack: the bass drops; the phones: a twitchy figure
    M.piano(B('crack') + 0.1, 'D2', 0.32, 3); M.piano(B('crack') + 0.12, 'A2', 0.24, 3);
    arp(B('phones') + 0.1, S(8) - 0.05, ['B4', 'E5', 'G#4', 'E5'], 0.15, 0.22, { acc: 4 });
    // the Statue of Liberty: a lift
    { const ts = B('statue'); M.strings(ts, S(9) + 0.3, ['F3', 'A3', 'C4', 'F4'], 0.12, { att: 0.4, rel: 0.4, cut: 2200, cutTo: 3600 }); ['C5', 'F5', 'A5'].forEach((n, i) => M.bell(ts + 0.3 + i * 0.35, n, 0.14, [-0.3, 0, 0.3][i])); }
    arp(S(9) + 0.1, W('warn') - 0.05, ['C4', 'G4', 'E5', 'G4', 'D4', 'A4', 'F5', 'A4'], 0.15, 0.24, { acc: 4, ramp: (u) => 0.6 + 0.4 * u }); }

  // ================================================================== "Step ten is going to be a problem.": the rise; the boom cuts it dead
  { const a = W('warn'), tb = TW_BOOM.t;
    M.strings(a, tb + 0.02, C.cluster, 0.18, { att: 1.5, rel: 0.02, cut: 400, cutTo: 2600, cutAt: tb });
    M.strings(a, tb + 0.02, C.deep, 0.24, { att: 1.0, rel: 0.02, cut: 220 });
    rise(a, tb + 0.02, 0.1, 1 / 7);
    // (step ten in slow motion: a heartbeat under it)
    for (let t = S(10) + 0.2; t < tb - 0.3; t += 0.85) { M.drum(t, 0.4, 41.2, 1.3, 0.5); M.drum(t + 0.22, 0.25, 41.2, 1.3, 0.4); }
    M.strings(B('esb'), tb + 0.02, ['E5', 'F5', 'A5'], 0.06, { att: 1.5, rel: 0.02, cut: 6000, wave: 'triangle', vib: 9 });
    // (the silence after the bang, the hall's tail too; then a low drone creeps back)
    M.kill(tb, W('boom') - 1.7);
    M.strings(W('boom') - 1.6, W('boom') + 0.4, C.deep, 0.18, { att: 1.5, rel: 0.1, cut: 160 }); }

  // ================================================================== "That bang was you.": D minor, driving
  { const a = W('boom'), tsafe = W('safe');
    stab(a, a + 3.0, C.stab, 0.3);
    M.prog([[a + 1.2, C.Dm9], [wd('boom', 'every'), C.Bbmaj7], [S(11), C.Dm9], [B('mach2'), C.Gm9], [S(12), C.Bbmaj7], [B('bridgeSide'), C.Fadd9],
      [W('squeeze'), C.cluster], [B('hot'), C.A7sus], [S(13), C.Dm9], [B('mach9'), C.Bblyd], [B('glowing'), C.A7sus], [B('impact'), C.Dm9]], tsafe + 0.3, 0.22, { cut: 900, cutTo: 2600, lastRel: 0.4 });
    M.strings(a + 1.2, tsafe + 0.3, C.deep, 0.2, { att: 1.0, rel: 0.4, cut: 200 });
    twPulse(ctx, M.bus, a + 1.2, S(11), ['D2', 'A2', 'D3'], 0.215, 0.5, { cut: 400, cutTo: 900, acc: 4, decay: 0.3 });
    twPulse(ctx, M.bus, S(11), B('impact'), ['D2', 'A2', 'D3'], 0.215, 0.65, { cut: 600, cutTo: 2200, acc: 4, decay: 0.28, ramp: (u) => 0.7 + 0.3 * u });
    groove(S(11), B('impact') - 0.05, 0.43, 0.6, { tom: true });
    groove(W('squeeze'), B('impact') - 0.05, 0.43, 0.4, { four: true, ticks: false });
    for (const n of [11, 12, 13]) { hit(S(n), 0.8, 32.7); hit(Ld(n), 0.9, 29.1); }
    // the bridge: a lift; squeezed air: the rise; glowing: the strings go high
    { const tq = B('bridgeSide'); ['F5', 'A5', 'C6', 'G6'].forEach((n, i) => M.bell(tq + 0.2 + i * 0.4, n, 0.13, [-0.3, 0.1, 0.3, 0][i])); }
    rise(W('squeeze'), Ld(13), 0.07, 1 / 10);
    M.strings(B('glowing'), B('impact') + 0.3, ['A5', 'C#6', 'E6'], 0.06, { att: 0.6, rel: 0.3, cut: 7000, wave: 'triangle', vib: 10 });
    stab(B('impact'), tsafe + 0.3, C.stab, 0.22); }

  // ================================================================== "keeping you alive": it opens out; "That was your office": dead stop
  { const a = W('safe'), ti = wd('safe', 'it'), tt = wd('fourteen', 'that');
    M.prog([[a, C.Bbmaj7], [wd('safe', 'alive'), C.Fadd9], [ti, C.Gm9]], S(14) + 0.3, 0.22, { cut: 1400, lastRel: 0.4 });
    M.piano(a + 0.3, 'F4', 0.3, 3, -0.2); M.piano(a + 1.6, 'D5', 0.26, 3, 0.2); M.piano(ti + 0.1, 'G2', 0.3, 4); M.piano(ti + 0.12, 'D3', 0.22, 4);
    // step fourteen, and the office passing under you
    hit(S(14), 0.8, 32.7);
    M.prog([[S(14), C.Dm9], [B('office'), C.Bbmaj7]], tt + 0.04, 0.24, { cut: 1200, cutTo: 2600, lastRel: 0.04 });
    twPulse(ctx, M.bus, S(14), tt, ['D2', 'A2', 'D3'], 0.215, 0.65, { cut: 600, cutTo: 2000, acc: 4, decay: 0.28 });
    groove(S(14), tt - 0.05, 0.43, 0.55, { tom: true });
    M.kill(tt, tt + 1.2); M.pluck(tt + 0.02, 'D4', 0.35, 0); M.pluck(tt + 0.02, 'D5', 0.2, 0);
    // "And missed it by four kilometres.": a small sad figure
    const tm = wd('passed', 'missed');
    ['G4', 'F#4', 'F4', 'E4'].forEach((n, i) => M.pluck(tm + 0.15 + i * 0.32, n, 0.34, [-0.2, 0.1, -0.1, 0.2][i], i === 3 ? 1.6 : 0.8));
    M.strings(W('passed') + 0.2, S(15) + 0.2, ['C3', 'G3', 'E4'], 0.08, { att: 1.0, rel: 0.3, cut: 1400, wave: 'triangle' }); }

  // ================================================================== step fifteen: away (the rise; "never coming down")
  { const a = S(15), tn = wd('curve', 'never');
    hit(a, 0.9, 29.1);
    M.prog([[a, C.Dm9], [B('escape'), C.Bbmaj7], [W('curve'), C.Gm9]], tn + 0.3, 0.24, { cut: 800, cutTo: 3000, cutAt: tn, lastRel: 0.3 });
    M.strings(a, tn + 0.3, C.deep, 0.2, { att: 0.5, rel: 0.3, cut: 220 });
    rise(a + 0.5, tn + 0.05, 0.1, 1 / 6);
    twPulse(ctx, M.bus, a, tn, ['D2', 'A2', 'D3'], 0.215, 0.7, { cut: 600, cutTo: 2600, acc: 4, decay: 0.3, ramp: (u) => 0.6 + 0.4 * u });
    for (let t = W('curve'), k = 0; t < tn - 0.1; t += Math.max(0.1, 0.35 - 0.025 * k), k++) M.drum(t, Math.min(0.4, 0.16 + 0.016 * k), 73.4, 1.2, 0.35);
    // never coming down: a vast open chord over the curve of the Earth
    M.strings(tn, S(16) + 0.4, C.Bblyd, 0.24, { att: 0.3, rel: 0.6, cut: 3200, cutTo: 1500 });
    M.strings(tn, S(16) + 0.4, ['Bb0', 'F1', 'Bb1'], 0.2, { att: 0.3, rel: 0.6, cut: 200 });
    hit(tn, 0.85, 29.1); M.bell(tn + 0.1, 'F6', 0.14, -0.2); M.bell(tn + 0.5, 'D6', 0.12, 0.3); }

  // ================================================================== the meteor: full stretch; Boston: it holds its breath
  { const a = S(16), tb = wd('boston', 'bang') + 0.25;
    hit(a, 1.0, 29.1);
    M.prog([[a, C.Dm9], [a + 2.2, C.Bbmaj7], [wd('meteor', 'low'), C.Fadd9], [wd('meteor', 'meteor'), C.A7sus]], W('boston') + 0.4, 0.28, { cut: 1200, cutTo: 3200, lastRel: 0.5 });
    M.strings(a, W('boston') + 0.4, C.deep, 0.22, { att: 0.5, rel: 0.5, cut: 220 });
    M.strings(a + 0.5, W('boston') + 0.4, ['A4', 'D5', 'F5', 'A5'], 0.08, { att: 1.0, rel: 0.5, cut: 5000, wave: 'triangle', vib: 6 });
    twPulse(ctx, M.bus, a, W('boston'), ['D2', 'A2', 'D3'], 0.215, 0.7, { cut: 900, cutTo: 2400, acc: 4, decay: 0.3 });
    groove(a, W('boston') - 0.1, 0.43, 0.65, { tom: true }); groove(a, W('boston') - 0.1, 0.43, 0.35, { four: true, ticks: false });
    M.drum(wd('meteor', 'meteor') + 0.3, 0.7, 29.1, 1.1, 1.5);
    // Boston: one held chord, quiet, so the bang is heard; then the climb out
    M.strings(W('boston') - 0.1, B('climb') + 0.4, ['F2', 'C3', 'G3', 'A3'], 0.12, { att: 0.4, rel: 0.6, cut: 900, keys: [[tb - 0.1, 1], [tb + 0.3, 0.5], [tb + 1.5, 1]] });
    M.strings(B('climb'), W('space') + 0.6, C.Asus, 0.2, { att: 1.0, rel: 0.6, cut: 700, cutTo: 2600 });
    rise(B('climb'), W('space') + 0.1, 0.07, 1 / 9); }

  // ================================================================== space: D major, open, awed
  { const a = W('space'), ts = wd('space', 'space'), tr = wd('push', 'rule');
    M.strings(a, W('station') + 0.5, C.fifths, 0.22, { att: 1.8, rel: 0.8, cut: 900, cutTo: 2200, cutAt: ts + 1 });
    M.strings(a, W('station') + 0.5, C.deep, 0.18, { att: 1.5, rel: 0.8, cut: 180 });
    M.drum(ts, 0.55, 29.1, 1.4, 2.0);
    twinkle(ts + 0.2, W('push') + 3, 0.9, ['A5', 'D6', 'E6', 'F#6', 'B6'], 0.1);
    // "The rule doesn't care.": the pulse comes back, softly, in the dark
    twPulse(ctx, M.bus, tr, W('look'), ['D2', 'A2', 'D3'], 0.3, 0.45, { cut: 300, cutTo: 1200, acc: 4, decay: 0.3, wave: 'triangle', ramp: (u) => 0.5 + 0.5 * u });
    M.prog([[W('station'), C.Dmaj9], [W('ninemin'), C.Gmaj7], [wd('ninemin', 'you'), C.Dmaj9], [W('radius'), C.Bm7], [W('across'), C.Gmaj7], [wd('across', 'whole'), C.Asus]], W('look') + 0.3, 0.2, { cut: 1100, cutTo: 2600, lastRel: 0.5 });
    M.bell(W('station') + 0.2, 'F#6', 0.14, 0.3);
    ['D5', 'A5', 'F#5'].forEach((n, i) => M.pluck(wd('ninemin', 'you') + 0.5 + i * 0.25, n, 0.28, [-0.3, 0.3, 0][i]));
    hit(S(24), 0.55, 32.7); hit(S(25), 0.65, 29.1);
    rise(W('across'), W('look'), 0.05, 1 / 16, 420);
    // "Look back. Everyone you've ever met is down there.": home's motif, alone
    M.strings(W('look'), W('fifty') + 0.3, ['C2', 'G2', 'E3', 'G3'], 0.14, { att: 0.8, rel: 0.4, cut: 1200, wave: 'triangle', vib: 3 });
    home(wd('look', 'everyone') + 0.2, { gap: 0.75, vel: 0.38, dur: 3.6 });
    // fifty thousand kilometres a second; the Moon goes by
    const tm = wd('moon', 'moon');
    M.prog([[W('fifty'), C.Dmaj9], [W('moon'), C.Glyd], [tm - 0.3, C.Dmaj9]], W('problem') + 0.3, 0.22, { cut: 1200, cutTo: 2800, lastRel: 0.4 });
    twPulse(ctx, M.bus, W('fifty'), tm - 0.3, ['D2', 'A2', 'D3'], 0.215, 0.55, { cut: 500, cutTo: 1800, acc: 4, decay: 0.28, ramp: (u) => 0.6 + 0.4 * u });
    groove(W('fifty'), tm - 0.3, 0.43, 0.35, { ramp: (u) => 0.5 + 0.5 * u });
    hit(S(27), 0.6, 32.7); hit(S(29), 0.7, 29.1);
    // "And that was the Moon.": a cheeky little bell
    M.bell(tm + 0.35, 'D6', 0.16, 0.3); M.bell(tm + 0.6, 'A5', 0.14, -0.3); }

  // ================================================================== the light barrier: "Time." (the strings bend down)
  { const a = W('problem'), tt = wd('give', 'time'), tr = W('real');
    M.strings(a, W('nothing') + 0.3, C.cluster, 0.15, { att: 0.8, rel: 0.4, cut: 380, cutTo: 900 });
    M.strings(a, W('give') + 0.4, C.deep, 0.2, { att: 0.6, rel: 0.4, cut: 180 });
    M.strings(W('thirty'), W('nothing') + 0.1, ['E5', 'F5', 'Bb5'], 0.05, { att: 2.5, rel: 0.1, cut: 6000, wave: 'triangle', vib: 8 });
    rise(W('thirty'), W('nothing') + 0.05, 0.06, 1 / 14);
    for (let t = W('thirty') + 0.2; t < W('nothing') - 0.3; t += 0.9) M.drum(t, 0.3, 41.2, 1.3, 0.5);
    M.piano(W('nothing') + 0.05, 'D2', 0.36, 4); M.piano(W('nothing') + 0.06, 'Eb3', 0.2, 4);
    M.strings(W('give') - 0.1, W('clock') + 0.4, ['D3', 'A3', 'D4', 'F4'], 0.14, { att: 0.8, rel: 0.5, cut: 1500, bend: [tt, -300, 2.2] });
    M.bell(tt + 0.05, 'D6', 0.12, 0.2);
    // your clock, slowed: a cold, still chord (the ticks are the watch's own, in the effects)
    M.strings(W('clock'), tr + 0.3, C.Eblyd, 0.17, { att: 1.5, rel: 0.6, cut: 800, cutTo: 1800 });
    M.strings(W('clock'), tr + 0.3, ['Eb1', 'Bb1', 'Eb2'], 0.16, { att: 1.5, rel: 0.6, cut: 200 });
    hit(S(30), 0.6, 32.7);
    // "That part isn't made up.": warm and plain; the steps quicken toward Mars
    M.prog([[tr, C.Gmaj7], [wd('real', 'astronauts'), C.DF], [S(33), C.Em9], [S(35), C.Asus]], W('mars') + 0.3, 0.2, { cut: 1300, cutTo: 2600, lastRel: 0.3 });
    M.piano(tr + 0.4, 'F#4', 0.26, 3, -0.2); M.piano(tr + 1.6, 'B4', 0.24, 3, 0.2); M.piano(tr + 2.8, 'A4', 0.22, 3, 0);
    twPulse(ctx, M.bus, S(31), W('mars'), ['D2', 'A2', 'D3'], 0.215, 0.55, { cut: 400, cutTo: 2000, acc: 4, decay: 0.28, ramp: (u) => 0.4 + 0.6 * u });
    for (let n = 31; n <= 36; n++) M.drum(S(n), 0.25 + 0.04 * (n - 31), 36.7, 1.2, 0.6); }

  // ================================================================== the planets: a ladder, a hit on each as it passes
  { const a = W('mars'), pass = (k) => twPassOf(k);
    M.prog([[a, C.Dmaj9], [W('marstime'), C.Bm7], [W('sun'), C.Gmaj7], [wd('sun', 'light'), C.Em9], [wd('sun', 'you'), C.Asus],
      [W('jupiter'), C.Dmaj9], [pass('jupiter') + 0.4, C.Bm7], [W('saturn'), C.Gmaj7], [pass('saturn') + 0.4, C.Asus], [W('pluto'), C.Dmaj9]], B('evening') + 0.2, 0.24, { cut: 1300, cutTo: 3000, lastRel: 0.2 });
    M.strings(a, B('evening') + 0.2, C.deep, 0.2, { att: 0.8, rel: 0.2, cut: 200 });
    twPulse(ctx, M.bus, a, B('evening'), ['D2', 'A2', 'D3'], 0.215, 0.6, { cut: 600, cutTo: 2200, acc: 4, decay: 0.28 });
    groove(a, W('marstime'), 0.43, 0.5, { tom: true }); groove(W('sun'), B('evening') - 0.05, 0.43, 0.55, { tom: true });
    groove(W('jupiter'), B('evening') - 0.05, 0.43, 0.3, { four: true, ticks: false });
    for (const k of ['mars', 'jupiter', 'saturn', 'pluto']) { hit(pass(k), 0.95, 29.1); M.bell(pass(k) + 0.05, { mars: 'A5', jupiter: 'D6', saturn: 'F#6', pluto: 'A6' }[k], 0.14, 0.2); }
    // light needs eight minutes: bells running like light; you needed one second: one note
    twinkle(wd('sun', 'light') + 0.1, wd('sun', 'you') - 0.2, 0.22, ['D6', 'E6', 'F#6', 'A6', 'B6'], 0.09);
    M.pluck(wd('sun', 'you') + 1.3, 'A4', 0.4, 0); M.pluck(wd('sun', 'you') + 1.31, 'A5', 0.25, 0);
    // the rising step motif, on each planet's word (an octave each)
    for (const [id, base] of [['jupiter', 'D4'], ['saturn', 'E4'], ['pluto', 'F#4']]) [base, twOct(base, 1)].forEach((n, i) => M.pluck(W(id) + 0.05 + i * 0.22, n, 0.34, i ? 0.3 : -0.3)); }

  // ================================================================== home, evening; the boss; Voyager
  { const te = B('evening'), tb = B('boss'), a = W('voyager'), tp = twPassOf('voyager');
    M.strings(te, tb + 0.3, ['C2', 'G2', 'E3', 'B3'], 0.14, { att: 0.25, rel: 0.4, cut: 1200, wave: 'triangle', vib: 3 });
    home(te + 0.2, { gap: 0.5, vel: 0.32, dur: 2.4 });
    // "Your boss has stopped calling.": a shrug
    M.strings(tb, a + 0.3, C.Bm7, 0.12, { att: 0.5, rel: 0.4, cut: 1000 });
    M.pluck(wd('pluto', 'your') + 1.2, 'B4', 0.3, 0.3); M.pluck(wd('pluto', 'your') + 1.45, 'F#4', 0.3, -0.3);
    // Voyager: lonely and noble; you catch it up
    M.prog([[a, C.Gmaj7], [tp, C.Dmaj9], [wd('voyager', "it's"), C.Bm7], [wd('voyager', 'you'), C.Gmaj7]], W('day') + 0.3, 0.2, { cut: 1300, cutTo: 2400, lastRel: 0.5 });
    M.strings(a, W('day') + 0.3, ['G1', 'D2'], 0.16, { att: 1.0, rel: 0.5, cut: 220 });
    hit(tp, 0.8, 29.1);
    ['D5', 'E5', 'F#5', 'A5', 'B5'].forEach((n, i) => M.strings(tp + 0.4 + i * 0.9, tp + 0.4 + i * 0.9 + 1.2, [n], 0.07, { att: 0.2, rel: 0.4, cut: 4000, wave: 'triangle', vib: 6 }));
    ['D4', 'D5', 'A4'].forEach((n, i) => M.pluck(wd('voyager', 'you') + 0.3 + i * 0.3, n, 0.32, [-0.3, 0.3, 0][i])); }

  // ================================================================== alone: a day, a star, a month, the posters, Proxima
  { const a = W('day'), tps = B('poster'), tpx = twPassOf('proxima');
    M.strings(a, tps + 0.2, C.cold, 0.06, { att: 2.0, rel: 0.3, cut: 6500, wave: 'triangle', vib: 3 });
    M.prog([[a, C.Bm7], [W('star'), C.Gmaj7], [W('month'), C.Em9]], tps + 0.2, 0.16, { cut: 900, cutTo: 1600, lastRel: 0.2 });
    M.strings(a, tps + 0.2, ['B0', 'F#1', 'B1'], 0.14, { att: 1.5, rel: 0.2, cut: 180 });
    M.bell(wd('day', 'day') + 0.2, 'B5', 0.12, 0.2);
    twinkle(W('star') + 0.3, W('month') - 0.4, 1.6, ['F#6', 'B6', 'D7'], 0.06);
    M.bell(wd('star', 'star') + 0.1, 'D6', 0.16, -0.1);
    M.piano(W('month') + 0.2, 'E2', 0.3, 4); M.piano(W('month') + 1.6, 'B3', 0.2, 3, 0.2);
    twPulse(ctx, M.bus, a, tps, ['B1', 'F#2', 'B2'], 0.43, 0.3, { cut: 300, cutTo: 600, acc: 4, decay: 0.3, wave: 'triangle' });
    // the posters: home's motif on a music box
    M.strings(tps, W('ninemonths') + 0.3, ['C3', 'G3', 'E4'], 0.1, { att: 0.4, rel: 0.4, cut: 1500, wave: 'triangle', vib: 2 });
    home(tps + 0.3, { bell: true, oct: 1, gap: 0.65, vel: 0.2 }); M.bell(tps + 2.6, 'D5', 0.12, 0.3);
    // nine months; Proxima: one star, close; six years
    M.prog([[W('ninemonths'), C.Bm7], [W('proxima'), C.Gmaj7], [tpx, C.Glyd], [W('sixyears'), C.Em9]], W('turn') + 0.3, 0.2, { cut: 1000, cutTo: 2400, lastRel: 0.6 });
    M.strings(W('ninemonths'), W('turn') + 0.3, C.deep, 0.16, { att: 1.0, rel: 0.6, cut: 180 });
    twPulse(ctx, M.bus, W('ninemonths'), W('sixyears'), ['D2', 'A2', 'D3'], 0.215, 0.5, { cut: 500, cutTo: 1600, acc: 4, decay: 0.28 });
    hit(tpx, 0.9, 29.1); ['C#6', 'F#6', 'B5', 'D6'].forEach((n, i) => M.bell(tpx + 0.1 + i * 0.45, n, 0.13, [-0.3, 0.3, -0.1, 0.1][i]));
    M.piano(W('sixyears') + 0.4, 'E3', 0.24, 4, -0.1); M.piano(W('sixyears') + 1.4, 'G3', 0.22, 4, 0.1); }

  // ================================================================== the turn: home's motif, warm; eleven years after you left
  { const a = W('turn'), tf = wd('turn', 'front'), ty = W('eleven_years');
    M.strings(a, wd('turn', 'turn') - 0.1, ['D2', 'A2', 'E3'], 0.1, { att: 0.6, rel: 0.3, cut: 800, wave: 'triangle' });
    M.prog([[wd('turn', 'turn') - 0.1, C.Cadd9], [tf - 1.2, C.Fmaj7], [tf - 0.1, C.CE]], ty + 0.3, 0.2, { cut: 1500, cutTo: 2400, lastRel: 0.4 });
    M.strings(wd('turn', 'turn') - 0.1, ty + 0.3, ['C2', 'G2'], 0.14, { att: 1.0, rel: 0.4, cut: 260 });
    arp(wd('turn', 'turn'), tf - 0.2, ['C4', 'G4', 'E4', 'G4'], 0.3, 0.24, { ramp: (u) => 0.5 + 0.5 * u });
    home(tf - 0.05, { gap: 0.6, vel: 0.4 });
    M.prog([[ty, ['A1', 'E2', 'C3', 'B3']], [ty + 2.2, C.Fmaj7]], W('keep') + 0.2, 0.18, { cut: 1300, lastRel: 0.3 });
    ['E5', 'D5', 'C5'].forEach((n, i) => M.piano(ty + 0.3 + i * 0.9, n, 0.3, 3, [0.2, -0.1, 0][i])); }

  // ================================================================== the deep: you keep going (to step seventy)
  { const a = W('keep'), tg = wd('keep', 'going'), t70 = wd('seventy', 'there');
    hit(tg + 0.1, 0.7, 29.1);
    M.prog([[a, C.Dm9], [S(57), C.Bbmaj7], [W('sixty'), C.Bm7], [wd('sixty', 'everyone') - 0.2, C.Gmaj7], [W('sixtyfour'), C.Em9], [B('sixtyfour') + 2.2, C.Asus]], W('climb') + 0.3, 0.2, { cut: 900, cutTo: 1800, lastRel: 0.4 });
    M.strings(a, W('climb') + 0.3, C.deep, 0.18, { att: 1.0, rel: 0.4, cut: 180 });
    twPulse(ctx, M.bus, tg, W('climb'), ['D2', 'A2', 'D3'], 0.3, 0.5, { cut: 400, cutTo: 1200, acc: 4, decay: 0.3 });
    for (const n of [57, 58, 59]) M.drum(S(n), 0.35, 36.7, 1.2, 0.7);
    M.piano(wd('sixty', 'everyone') + 0.2, 'B4', 0.26, 3, 0.2); M.piano(wd('sixty', 'everyone') + 1.2, 'A4', 0.24, 3, -0.2); M.piano(wd('sixty', 'everyone') + 2.2, 'F#4', 0.24, 4, 0);
    hit(S(60), 0.55, 32.7); hit(S(64), 0.6, 32.7);
    // climbing out of the Milky Way: everything rises into step seventy
    M.prog([[W('climb'), C.Gmaj7], [S(68), C.Em9], [S(69), C.Asus]], t70 + 0.05, 0.24, { cut: 700, cutTo: 3400, cutAt: t70, lastRel: 0.05 });
    M.strings(W('climb'), t70 + 0.05, C.deep, 0.22, { att: 0.8, rel: 0.05, cut: 220 });
    rise(W('climb'), t70 + 0.05, 0.06, 1 / 7);
    twPulse(ctx, M.bus, W('climb'), t70, ['D2', 'A2', 'D3'], 0.215, 0.7, { cut: 500, cutTo: 2800, acc: 4, decay: 0.3, ramp: (u) => 0.5 + 0.5 * u });
    groove(W('climb'), t70 - 0.05, 0.43, 0.6, { tom: true, ramp: (u) => 0.5 + 0.5 * u });
    for (let t = S(69), k = 0; t < t70 - 0.08; t += Math.max(0.1, 0.3 - 0.02 * k), k++) M.drum(t, Math.min(0.4, 0.15 + 0.015 * k), 73.4, 1.2, 0.35);
    for (const n of [67, 68, 69, 70]) hit(S(n), 0.55, 32.7); }

  // ================================================================== "There it is. All of it.": the biggest moment in the film
  { const a = wd('seventy', 'there'), ta = wd('seventy', 'and'), ts = wd('seventy', 'spot'), th = W('humans');
    hit(a, 1.0, 29.1); M.drum(a + 0.01, 0.7, 36.7, 1.2, 1.6);
    M.prog([[a, C.Dmaj9], [a + 2.4, C.Gmaj7], [a + 4.4, C.Asus]], ta + 0.4, 0.32, { att: 0.05, cut: 3200, cutTo: 2200, lastRel: 0.5 });
    M.strings(a, ta + 0.4, ['D1', 'D2', 'A2'], 0.26, { att: 0.05, rel: 0.5, cut: 220 });
    M.strings(a, ta + 0.4, ['A4', 'D5', 'F#5', 'A5'], 0.1, { att: 0.3, rel: 0.5, cut: 7000, wave: 'triangle', vib: 7 });
    twinkle(a + 0.1, ta, 0.18, ['D6', 'E6', 'F#6', 'A6', 'B6', 'D7'], 0.1);
    ['D4', 'D5', 'A4'].forEach((n, i) => M.piano(a + 0.05 + i * 0.55, n, 0.4, 3.5, [-0.2, 0.2, 0][i]));
    twPulse(ctx, M.bus, a, ta, ['D2', 'A2', 'D3'], 0.215, 0.7, { cut: 1600, cutTo: 2600, acc: 4, decay: 0.3 });
    groove(a, ta - 0.1, 0.43, 0.6, { tom: true }); groove(a, ta - 0.1, 0.43, 0.35, { four: true, ticks: false });
    // "And every person who ever lived, lived in that one little spot.": home's motif, quietly
    M.prog([[ta, C.Gmaj7], [ts - 0.8, C.CE]], th + 0.4, 0.18, { cut: 1400, lastRel: 0.6 });
    home(ts - 0.6, { gap: 0.7, vel: 0.36, dur: 3.6 }); M.bell(ts + 1.6, 'C6', 0.1, 0.3);
    // longer than humans have existed: still, vast
    M.prog([[th, C.Bm7], [S(73), C.Gmaj7], [S(74), C.Asus]], W('andromeda') + 0.3, 0.2, { cut: 1000, cutTo: 1800, lastRel: 0.3 });
    M.strings(th, W('andromeda') + 0.3, C.deep, 0.18, { att: 1.0, rel: 0.3, cut: 180 });
    twPulse(ctx, M.bus, th + 0.5, W('andromeda'), ['B1', 'F#2', 'B2'], 0.3, 0.45, { cut: 400, cutTo: 1100, acc: 4, decay: 0.3, ramp: (u) => 0.5 + 0.5 * u }); }

  // ================================================================== Andromeda; galaxies like dust; the web
  { const a = W('andromeda'), tA = wd('andromeda', 'andromeda'), td = W('dust'), tw = W('web'), to = wd('web', 'outside');
    hit(tA, 0.85, 29.1); M.bell(tA + 0.05, 'B5', 0.14, 0.2);
    M.prog([[a, C.Em9], [tA, C.Glyd], [td, C.DF], [td + 2.0, C.Gmaj7]], tw + 0.3, 0.24, { cut: 1200, cutTo: 2600, lastRel: 0.6 });
    M.strings(a, tw + 0.3, C.deep, 0.18, { att: 0.8, rel: 0.6, cut: 180 });
    twPulse(ctx, M.bus, a, td, ['E2', 'B2', 'E3'], 0.215, 0.55, { cut: 600, cutTo: 1800, acc: 4, decay: 0.28 });
    groove(a, td - 0.1, 0.43, 0.4, {});
    // galaxies everywhere, like dust: bells scattered everywhere
    twinkle(td + 0.1, tw - 0.3, 0.16, ['D6', 'E6', 'F#6', 'A6', 'B6', 'C#7', 'E7'], 0.07);
    // the web: a vast drone, slow chords, and an awed swell at "outside"
    M.strings(tw, W('sundies') + 0.5, ['D1', 'A1', 'D2', 'A2'], 0.22, { att: 2.0, rel: 0.8, cut: 200, cutTo: 320 });
    M.prog([[tw, C.Gmaj7], [wd('web', 'bubbles') - 0.4, C.Em9], [to - 0.6, C.Glyd], [to + 1.4, C.Dmaj9]], W('sundies') + 0.5, 0.2, { cut: 700, cutTo: 2400, lastRel: 0.8, wave: 'triangle', vib: 4 });
    M.strings(to - 0.6, W('sundies') + 0.5, ['C#5', 'F#5', 'A5'], 0.06, { att: 1.2, rel: 0.8, cut: 6500, wave: 'triangle', vib: 5 });
    for (let t = tw + 0.4, k = 0; t < W('sundies') - 0.6; t += 1.9, k++) M.bell(t, ['A5', 'E6', 'F#5', 'B5', 'D6'][k % 5], 0.08, k % 2 ? 0.4 : -0.4);
    M.drum(to + 0.2, 0.5, 29.1, 1.4, 2.0); }

  // ================================================================== the Sun dies: dark, low, a toll
  { const a = W('sundies'), tr = wd('sundies', 'red'), tsw = wd('sundies', 'swallowed');
    M.strings(a, W('ninety') + 0.1, C.dark, 0.24, { att: 1.5, rel: 0.2, cut: 300, cutTo: 520 });
    M.strings(a + 1.0, W('ninety') + 0.1, ['Eb4', 'D5', 'A4'], 0.05, { att: 2.5, rel: 0.2, cut: 3000, wave: 'triangle', vib: 9 });
    M.drum(tr, 0.8, 29.1, 1.4, 2.2); M.piano(tr + 0.02, 'D1', 0.4, 5);
    M.drum(tsw + 0.1, 0.9, 27.5, 1.4, 2.4); M.piano(tsw + 0.12, 'Eb1', 0.4, 5); M.piano(tsw + 0.13, 'A1', 0.24, 5);
    rise(tsw + 0.4, S(90) + 0.02, 0.07, 1 / 6); }

  // ================================================================== step ninety: the open's hit again
  { const t = S(90), tl = W('last');
    ninety(t, tl + 0.6, { rel: 1.2 });
    twinkle(t + 0.4, tl - 0.5, 0.5, ['D6', 'E6', 'F#6', 'A6', 'C#7'], 0.08);
    M.strings(t + 1.5, tl + 0.6, ['A2', 'E3', 'F#3', 'C#4'], 0.12, { att: 1.5, rel: 1.0, cut: 1800 }); }

  // ================================================================== the end: home's motif; step ninety-one; one bell
  { const a = W('last'), tf = wd('last', 'front'), tor = W('or'), tq = W('question');
    M.prog([[a, C.Cadd9], [tf - 1.4, C.Fmaj7], [tf - 0.1, C.CE]], tor + 0.3, 0.18, { cut: 1400, lastRel: 0.5, wave: 'triangle', vib: 3 });
    M.strings(a, tor + 0.3, ['C2', 'G2'], 0.14, { att: 1.0, rel: 0.5, cut: 240 });
    home(tf - 0.05, { gap: 0.75, vel: 0.4, dur: 3.6 });
    // "Or you could take step ninety-one.": the step motif, climbing, and not coming down
    M.strings(tor, tq + 0.3, C.Dmaj9, 0.18, { att: 0.6, rel: 0.4, cut: 1200, cutTo: 3000 });
    ['D4', 'D5', 'A4', 'E5', 'F#5'].forEach((n, i) => M.piano(tor + 0.2 + i * 0.45, n, 0.34 + 0.02 * i, 3, [-0.2, 0.2, -0.1, 0.1, 0][i]));
    rise(tor, tq + 0.1, 0.05, 1 / 8, 500);
    // "Which way would you step?": one bell, a chord that doesn't resolve, cut on the last frame
    M.bell(tq + 0.03, 'E6', 0.22, 0); M.piano(tq + 0.04, 'D2', 0.32, 6); M.piano(tq + 0.05, 'A2', 0.22, 6);
    M.strings(tq, END + 0.5, C.sus, 0.16, { att: 0.4, rel: 0.05, cut: 1600 });
    M.strings(tq, END + 0.5, ['A4', 'D5', 'E5'], 0.06, { att: 0.6, rel: 0.05, cut: 5000, wave: 'triangle', vib: 4 }); }
});

TW_SOUND_FNS.push(twMusicKit, twPulse, twShepard, twOct);
