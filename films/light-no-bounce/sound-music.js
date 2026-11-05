/* =====================================================================
   SOUND · MUSIC — an original score, all synthesised (the music kit of the gravity films, via the light films): string
   pads, a felt piano (also played backwards, so notes swell up out of nothing), glass bells, a low drum, a heartbeat.
   Eerie, cold A minor, like the slower-light film: the dark is a held breath.
     3:29:57        a music box plays the light motif over the carousel's organ (the organ is in sfx)
     3:30:00        a backwards piano swells into the dark and stops dead; a low hit; then only a drone and glass
     the Moon       a swell that stops dead as its last light arrives
     the stars      high bells, more and more as your pupils open
     the near miss  something passes: a cluster that bends, a hit, then the heartbeat
     the road       a pulse; the plane: radar pings that never come back; the rides: the motif slowed and out of tune
     the internet   a pulse that stops dead; space: vast and still; the heat: a heavy pulse
     the count      the endless rise (a Shepard–Risset glissando) from your pupils on; a roll; a hit on 3, 2 and 1
     3:30:10        the light floods back: a blinding A major chord and a shower of bells; the rise cut dead
     the reveal     a stinger; the Moon comes back: one bell; the motorway: low and slow; +2 min: a sad progression
     4:42 PM        high and thin; a roll to Saturn going out, a hit; the question: the motif a note short, cut on the
                    last frame
   ===================================================================== */

// the kit: string pads (three detuned oscillators per note through low-passes), felt piano (also reversed), bells,
// a low drum and a heartbeat
function nbMusicKit(ctx, K) {
  if (K._music) return K._music;
  const fx = K.fx, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(); bus.connect(K.bus);
  const hall = fx.ir(4.4, { bright: 0.5, damp: 2.8, shape: 2.0, pre: 0.025, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.55;
  bus.connect(hall); hall.connect(wet); wet.connect(K.bus);
  const drumModes = (f) => [[f, 0.7, 1], [f * 1.51, 0.45, 0.5], [f * 1.99, 0.3, 0.35], [f * 2.44, 0.2, 0.2], [f * 3.1, 0.12, 0.12]];
  const M = {
    bus,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4, dest = bus) => {
      const b = fx.pianoBuf(nbMidi(n)), len = Math.min(b.length, Math.ceil((dur + fade + 0.05) * fx.sr));
      return fx.play(b.subarray(0, len), t, dest, { vol: vel * 0.34, pan, stop: t + dur + fade, fade });
    },
    // a piano note played backwards: it swells up out of nothing and stops dead on its attack at tEnd
    rpiano(tEnd, n, vel, dur = 1.6, pan = 0) {
      const key = 'rp' + n + '_' + dur;
      if (!fx.cache[key]) {
        const b = fx.pianoBuf(nbMidi(n)), L = Math.min(b.length, Math.ceil(dur * fx.sr)), y = new Float32Array(L + Math.ceil(0.01 * fx.sr));
        for (let i = 0; i < L; i++) { const u = i / L; y[L - 1 - i] = b[i] * Math.min(1, (1 - u) / 0.35); }
        for (let i = 0; i < 0.01 * fx.sr; i++) y[L + i] = y[L - 1] * (1 - i / (0.01 * fx.sr));
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], tEnd - dur, bus, { vol: vel * 0.34, pan });
    },
    bell: (t, n, vol, pan = 0, dest = bus) => fx.play(fx.bellBuf(nbMidi(n)), t, dest, { vol: vol * 0.25, pan }),
    bellCut: (t, n, vol, d = 0.18, pan = 0) => fx.play(fx.bellBuf(nbMidi(n)), t, bus, { vol: vol * 0.25, pan, stop: t + d, fade: 0.05 }),
    // a low drum (a timpani-like membrane): f the pitch, vol, soft = a wider mallet, dk = decay
    drum(t, vol, f = 36.7, soft = 1, dk = 1) {
      const key = 'drum' + f + '_' + soft + '_' + dk;
      if (!fx.cache[key]) {
        const y = fx.hit(drumModes(f).map(([a, tau, b]) => [a, tau * dk, b]), { width: 0.006 * soft, amp: 1, noise: 0.25, nlen: 0.02, nhp: 300, len: 3.2 * Math.max(dk, 0.3) });
        const pk = NBX.peak(y) || 1; for (let i = 0; i < y.length; i++) y[i] /= pk;
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
        const f = nbHz(nn);
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
function nbPulse(ctx, dest, t0, t1, notes, step, vol, o = {}) {
  if (t1 - t0 < step) return;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.q || 4;
  lp.frequency.setValueAtTime(o.cut || 600, t0); lp.frequency.linearRampToValueAtTime(o.cutTo || o.cut || 600, t1);
  lp.connect(g); g.connect(dest); g.gain.value = 0;
  notes.forEach((n, k) => {
    const os = ctx.createOscillator(); os.type = o.wave || 'sawtooth'; os.frequency.value = nbHz(n); os.detune.setValueAtTime(k % 2 ? 6 : -6, t0);
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
function nbShepard(fx, t0, t1, o = {}) {
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


const NB_CH = {
  Am9: ['A1', 'E2', 'C3', 'G3', 'B3'], Flyd: ['F1', 'C2', 'A2', 'E3', 'B3'], Dm9: ['D2', 'A2', 'F3', 'C4', 'E4'], E7sus: ['E1', 'B1', 'D3', 'A3'],
  Cmaj7: ['C2', 'G2', 'E3', 'B3'], Bblyd: ['Bb1', 'F2', 'D3', 'A3', 'E4'], Fmaj9: ['F1', 'C2', 'A2', 'E3', 'G3'], Gsus: ['G1', 'D2', 'C3', 'G3'],
  Am: ['A1', 'E2', 'A2', 'C3', 'E3'], low: ['A1', 'E2', 'A2'], Cmaj9: ['C2', 'G2', 'E3', 'B3', 'D4'], Dm: ['D2', 'A2', 'D3', 'F3'],
  Amaj: ['A1', 'E2', 'A2', 'C#3', 'E3', 'A3', 'C#4', 'E4'], F: ['F1', 'C2', 'F2', 'A2', 'C3'], C: ['C2', 'G2', 'C3', 'E3', 'G3'], G: ['G1', 'D2', 'G2', 'B2', 'D3'],
  high: ['E5', 'A5', 'B5'], glass: ['E6', 'F6', 'B6'],
};
const NB_THEME = ['E5', 'C5', 'B4', 'A4', 'E4'];     // the light motif: falling (light going out); at the return it rises, in major
const NB_THEME_UP = ['E4', 'A4', 'B4', 'C#5', 'E5'];
const nbOct = (n, k) => n.replace(/-?\d$/, (d) => String(+d + k));

nbSound('music', 'score', function (ctx, bus, K) {
  const M = nbMusicKit(ctx, K), C = NB_CH, c = nbC, B = nbB, F = nbFilmAt, END = NB.end, T0 = NB.tLock;
  const ev = { moon: F(NBP.moonS), d3: B('count'), d2: F(NBP.T - 2), d1: F(NBP.T - 1), back: F(NBP.T), moonBack: F(NBP.T + NBP.moonS), sat: F(NBP.sEcho), satBack: F(NBP.sEchoEnd) };
  const motif = (t, o = {}) => (o.notes || NB_THEME).slice(0, o.n || 5).forEach((n, i) => M.piano(t + i * (o.gap || 1.2), nbOct(n, o.oct || 0), (o.vel || 0.5) * (i ? 0.88 : 1), o.dur || 3.4, [-0.2, 0.15, -0.1, 0.2, 0][i]));
  const glass = (t, v = 0.36, n = 'E6') => { M.bell(t, n, v, -0.3); M.bell(t + 0.02, nbOct(n, 1).replace('E', 'B'), v * 0.5, 0.3); };
  const fig = (t0, t1, notes, step, vel, durK = 1.8) => { for (let t = t0, i = 0; t < t1 - 0.3; t += step, i++) M.piano(t, notes[i % notes.length], vel * (0.8 + 0.2 * Math.sin(i * 1.3)), step * durK, i % 2 ? 0.25 : -0.25); };
  const hit = (t, v = 0.9, f = 36.7) => { M.drum(t, v, f, 1.1, 1.8); M.drum(t + 0.012, 0.5 * v, f * 1.5, 1.3, 1.0); };
  const twinkle = (t0, t1, d0, d1, notes, vol) => { const r = new RNG(Math.round(t0 * 100)); for (let t = t0; t < t1;) { M.bell(t, notes[r.int(0, notes.length - 1)], vol * (0.6 + 0.4 * r.next()), r.range(-0.8, 0.8)); const u = (t - t0) / (t1 - t0); t += (d0 + (d1 - d0) * u) * r.range(0.6, 1.4); } };

  // ================================================================== 3:29:57: a music box, then the dark
  ['E5', 'A5', 'C6', 'B5', 'A5', 'E5'].forEach((n, i) => M.bell(-0.3 + i * 0.42, n, 0.2, [-0.3, 0.2, -0.1, 0.3, 0, -0.2][i]));
  M.strings(-0.3, T0 + 0.3, ['A3', 'E4', 'C5'], 0.12, { att: 0.6, rel: 0.3, cut: 2200, wave: 'triangle', vib: 3 });
  M.rpiano(T0, 'A2', 0.5, 2.4, 0); M.rpiano(T0, 'E3', 0.36, 2.4, 0.2); M.rpiano(T0, 'C4', 0.24, 2.0, -0.2);
  hit(T0, 0.85, 32.7); glass(T0 + 0.02, 0.3);
  // the ten seconds begin: a drone and a cold cluster of glass, the motif falling, far away
  M.strings(T0 + 0.6, B('sky') + 0.6, C.low, 0.36, { att: 3.0, rel: 1.0, cut: 240 });
  M.strings(T0 + 1.5, ev.moon + 0.1, C.glass, 0.07, { att: 4.0, rel: 0.1, cut: 6000, wave: 'triangle', vib: 1 });
  M.prog([[c('start', 1), C.Am9], [B('mirror'), C.Flyd], [c('mirror', 1), C.Am9]], B('moon') + 0.5, 0.34, { cut: 900 });
  motif(c('start', 1) + 0.6, { gap: 1.7, vel: 0.36, n: 5, dur: 4 });
  M.piano(c('mirror', 0) + 0.3, 'A2', 0.36, 5); M.piano(c('mirror', 1) + 0.4, 'F2', 0.34, 5);
  // the Moon: its last light on its way; a swell that stops dead as it arrives
  M.prog([[B('moon'), C.Dm9], [c('moon', 1), C.E7sus]], ev.moon + 0.1, 0.36, { cut: 1000, lastRel: 0.05 });
  M.strings(c('moon', 1), ev.moon + 0.02, ['A3', 'E4', 'A4', 'B4'], 0.26, { att: 4.0, rel: 0.03, cut: 700, cutTo: 3000, cutAt: ev.moon, glide: 60, glideFrom: c('moon', 1) + 2, glideAt: ev.moon });
  M.roll(ev.moon - 3.5, ev.moon - 0.05, [[ev.moon - 3.5, 0.04], [ev.moon - 0.4, 0.42]], 55);
  M.rpiano(ev.moon, 'E3', 0.42, 3.0, 0); M.rpiano(ev.moon, 'B3', 0.3, 3.0, 0.2);
  hit(ev.moon, 0.7, 36.7); M.bell(ev.moon + 0.02, 'E6', 0.34, 0); M.bell(ev.moon + 0.05, 'B6', 0.16, 0.3);
  M.strings(ev.moon + 0.2, B('sky') + 0.6, ['A1', 'E2'], 0.3, { att: 1.0, rel: 0.6, cut: 200 });

  // ================================================================== the sky, the Sun, the stars: bells as they come out
  M.prog([[B('sky'), C.Fmaj9], [c('sky', 1), C.Am9], [B('sun'), C.Cmaj9], [c('sun', 1), C.Am9], [B('sources'), C.Fmaj9], [c('sources', 1), C.Dm9]], B('hands') + 0.5, 0.34, { cut: 1100 });
  twinkle(c('sun', 1) - 0.4, B('hands'), 1.6, 0.55, ['E6', 'B6', 'A6', 'E7', 'B5', 'C7'], 0.12);
  M.strings(B('sky'), B('hands') + 0.6, C.high, 0.08, { att: 3, rel: 1, cut: 4000, wave: 'triangle', vib: 2 });
  motif(c('sources', 0) + 0.8, { gap: 1.5, vel: 0.34, oct: 1, n: 5, dur: 3 });

  // ================================================================== you: your hands, the impossible, the crowd you can't see
  M.prog([[B('hands'), C.Dm9], [c('hands', 1), C.Bblyd], [B('real'), C.Am9], [c('real', 1), C.E7sus], [B('crowd'), C.Dm9], [c('crowd', 1), C.E7sus]], B('near') + 0.3, 0.36, { cut: 900 });
  { const t0 = c('hands', 1), t1 = B('near'); for (let t = t0, i = 0; t < t1; t += 1.25 - 0.15 * (t - t0) / (t1 - t0), i++) M.beat(t, 0.22 + 0.12 * (t - t0) / (t1 - t0)); }
  M.piano(c('real', 0) + 0.2, 'F2', 0.4, 5); M.piano(c('real', 1) + 0.2, 'B1', 0.38, 5); glass(c('real', 1) + 0.25, 0.2, 'E6');
  fig(c('crowd', 0) + 0.4, B('near') - 0.4, ['E5', 'B4', 'C5', 'A4'], 1.3, 0.16);
  // something passes: a cluster that bends down, a hit, and the heartbeat, louder, close
  { const t = c('near', 0) - 0.3;
    M.strings(B('near'), t + 0.02, ['A3', 'Bb3', 'E4', 'F4'], 0.3, { att: 0.6, rel: 0.03, cut: 1600 });
    hit(t, 1.0, 30.9); M.drum(t + 0.02, 0.5, 46, 1.3, 1.2); M.bellCut(t + 0.01, 'F6', 0.3, 0.5, -0.4); M.bellCut(t + 0.03, 'E6', 0.3, 0.5, 0.4);
    M.strings(t, B('road') + 0.4, ['E2', 'F2', 'B2'], 0.34, { att: 0.05, rel: 0.8, cut: 600, cutTo: 260, cutAt: B('road'), glide: -120, glideFrom: t, glideAt: B('road') });
    M.strings(t, B('road') + 0.3, ['E6', 'F6'], 0.06, { att: 0.05, rel: 0.5, cut: 7000, wave: 'sawtooth', vib: 14 });
    for (let k = 0; k < 4; k++) M.beat(t + 1.4 + k * 1.0, 0.45); }

  // ================================================================== the road: the drivers, blind
  M.prog([[B('road'), C.Am9], [c('road', 1), C.Bblyd], [c('road', 2), C.Dm9], [c('road', 3), C.E7sus]], B('plane') + 0.5, 0.38, { cut: 1000 });
  nbPulse(ctx, M.bus, B('road') + 0.3, B('plane'), ['A1', 'E2', 'Bb2'], 0.75, 0.8, { cut: 320, cutTo: 800, acc: 4, ramp: (u) => 0.55 + 0.45 * u });
  M.piano(c('road', 3) + 0.3, 'A2', 0.42, 4); M.piano(c('road', 3) + 0.32, 'E3', 0.3, 4);
  // ================================================================== the plane: radar pings that never come back
  M.prog([[B('plane'), C.Cmaj9], [c('plane', 1), C.Am9], [c('plane', 2), C.Fmaj9], [c('plane', 3), C.Am9]], B('coaster') + 0.5, 0.32, { cut: 1300 });
  M.strings(B('plane'), B('coaster') + 0.4, ['E5', 'B5'], 0.07, { att: 2, rel: 1, cut: 5000, wave: 'triangle', vib: 2 });
  for (let k = 0; k < 4; k++) { const t = c('plane', 2) + 0.4 + k * 1.3; M.bellCut(t, 'B6', 0.22, 0.09, k % 2 ? 0.3 : -0.3); }      // ping … (no echo)
  for (let k = 0; k < 3; k++) { const t = c('plane', 3) + 0.4 + k * 1.1; M.bell(t, 'E6', 0.14, 0.4); M.bell(t + 0.18, 'A6', 0.12, 0.4); }   // the transponder answers
  motif(c('plane', 1) + 0.5, { gap: 1.5, vel: 0.3, n: 4 });

  // ================================================================== the rides: the motif slowed and out of tune
  M.prog([[B('coaster'), C.Am9], [c('coaster', 1), C.Flyd], [B('dodgems'), C.Bblyd], [B('fire'), C.Dm9], [c('fire', 1), C.E7sus]], B('net') + 0.5, 0.34, { cut: 900 });
  { const notes = ['E5', 'A5', 'C6', 'B5', 'A5', 'E5', 'G5', 'F5']; let t = B('coaster') + 0.6, i = 0;
    while (t < B('net') - 0.5) { M.bell(t, notes[i % notes.length], 0.16, -0.3); M.bell(t + 0.03, nbOct(notes[i % notes.length], 0).replace(/^([A-G])/, '$1'), 0.08, 0.3); t += 1.15 + 0.25 * Math.sin(i * 0.9); i++; } }
  M.strings(B('coaster'), B('net') + 0.3, ['A4', 'Bb4'], 0.06, { att: 2, rel: 0.6, cut: 3000, wave: 'triangle', wob: [30, 0.13] });
  { const t = c('fire', 1) + 0.2; M.piano(t, 'D2', 0.4, 4); M.piano(t + 0.02, 'A2', 0.3, 4); }

  // ================================================================== the internet: a pulse that stops dead
  { const tStop = c('net', 3) + 1.6;
    M.prog([[B('net'), C.Am9], [c('net', 1), C.Cmaj9], [c('net', 2), C.Fmaj9]], tStop + 0.05, 0.34, { cut: 1300, lastRel: 0.05 });
    nbPulse(ctx, M.bus, B('net') + 0.4, tStop, ['A2', 'E3', 'B3'], 0.21, 0.55, { cut: 900, cutTo: 2200, acc: 4, decay: 0.4, ramp: (u) => 0.5 + 0.5 * u });
    hit(tStop, 0.6, 41.2); M.strings(tStop + 0.05, B('space') + 0.5, ['A1', 'E2'], 0.3, { att: 1.2, rel: 0.5, cut: 220 }); }
  // ================================================================== space: vast and still
  M.strings(B('space'), B('heat') + 0.6, ['A1', 'E2', 'B2'], 0.36, { att: 2.0, rel: 1.0, cut: 260 });
  M.strings(B('space'), B('heat') + 0.6, ['E5', 'B5', 'E6'], 0.09, { att: 3.0, rel: 1.0, cut: 5000, wave: 'triangle', vib: 1.5 });
  motif(c('space', 0) + 0.6, { gap: 2.0, vel: 0.32, oct: -1, n: 5, dur: 5 });
  twinkle(c('space', 1), B('heat'), 0.9, 0.6, ['E6', 'B6', 'E7'], 0.09);
  // ================================================================== the heat: a heavy pulse
  M.prog([[B('heat'), C.Dm9], [c('heat', 1), C.Bblyd], [c('heat', 2), C.E7sus]], B('saturn') + 0.5, 0.4, { cut: 900 });
  nbPulse(ctx, M.bus, B('heat') + 0.3, B('saturn'), ['A1', 'E2', 'Bb2'], 1.15, 0.85, { cut: 280, cutTo: 560, acc: 2, ramp: (u) => 0.6 + 0.4 * u });
  hit(c('heat', 2) + 0.1, 0.6, 32.7);
  // ================================================================== Saturn: high and thin; it will go out at 4:42
  M.prog([[B('saturn'), C.Am9], [c('saturn', 1), C.Cmaj9], [c('saturn', 2), C.Flyd]], B('pupils') + 0.5, 0.32, { cut: 1300 });
  M.strings(B('saturn'), B('pupils') + 0.5, ['E6', 'B6'], 0.07, { att: 3, rel: 1, cut: 6000, wave: 'triangle', vib: 2 });
  fig(B('saturn') + 0.6, c('saturn', 2) - 0.3, ['E5', 'B5', 'A5', 'E6', 'C6'], 1.35, 0.13, 1.3);
  M.rpiano(c('saturn', 2) + 1.6, 'E3', 0.38, 2.4, 0); M.bell(c('saturn', 2) + 1.62, 'E6', 0.3, 0); M.bell(c('saturn', 2) + 2.8, 'B5', 0.2, 0.3);

  // ================================================================== your pupils; the count: the endless rise, a roll, 3 · 2 · 1
  { const t0 = B('pupils') - 0.2, t1 = ev.back + 0.002, e = (t) => (0.03 + 0.09 * nbEv(t, ev.d3, ev.back)) * nbEv(t, t0, t0 + 6) * (t > ev.back ? 0 : 1);
    const rate = (t) => (t < ev.d3 ? 1 / 26 : 1 / 12);
    const [Lx, Rx] = nbShepard(K.fx, t0, t1, { rate, env: e, centre: 300, width: 1.2 });
    K.fx.play(Lx, t0, M.bus, { xr: Rx, vol: 1 }); }
  M.prog([[B('pupils'), C.Am9], [c('pupils', 1), C.Flyd]], ev.d3 + 0.4, 0.34, { cut: 1000 });
  { const t0 = B('pupils'), t1 = ev.back; for (let t = t0; t < t1 - 0.2;) { const u = (t - t0) / (t1 - t0); M.beat(t, 0.32 + 0.3 * u); t += 1.1 - 0.62 * u; } }
  twinkle(B('pupils'), c('pupils', 1), 0.7, 0.25, ['E6', 'B6', 'A6', 'E7', 'C7'], 0.1);
  [ev.d3, ev.d2, ev.d1].forEach((t, i) => { hit(t, 0.75 + 0.1 * i, [41.2, 36.7, 32.7][i]); M.bell(t + 0.02, ['E6', 'C6', 'A5'][i], 0.26, 0); });
  M.strings(ev.d3, ev.back + 0.02, ['A2', 'E3', 'A3', 'B3', 'E4'], 0.4, { att: 1.0, rel: 0.02, cut: 600, cutTo: 3800, cutAt: ev.back, glide: 100, glideFrom: ev.d3 + 1, glideAt: ev.back });
  M.strings(ev.d3, ev.back + 0.02, C.low, 0.42, { att: 1.0, rel: 0.02, cut: 220, cutTo: 520, cutAt: ev.back });
  M.roll(ev.d1 - 0.4, ev.back - 0.03, [[ev.d1 - 0.4, 0.12], [ev.back - 0.3, 0.75]], 55);
  M.rpiano(ev.back, 'A2', 0.55, 2.6, 0); M.rpiano(ev.back, 'E3', 0.42, 2.6, 0.2); M.rpiano(ev.back, 'A3', 0.3, 2.2, -0.2);

  // ================================================================== 3:30:10: light floods back: blinding, in major
  hit(ev.back, 1.0, 27.5); M.drum(ev.back + 0.015, 0.6, 55, 1.2, 1.6);
  M.strings(ev.back, B('reveal') + 0.3, C.Amaj, 0.5, { att: 0.04, rel: 1.6, cut: 5200, cutTo: 1400, cutAt: B('reveal'), keys: [[ev.back + 0.05, 1], [ev.back + 3, 0.6], [B('reveal') - 1, 0.35]] });
  M.strings(ev.back, B('reveal') + 0.3, ['C#6', 'E6', 'A6'], 0.12, { att: 0.04, rel: 1.4, cut: 9000, cutTo: 3000, cutAt: B('reveal'), wave: 'triangle', vib: 3 });
  ['A6', 'E6', 'C#7', 'A5', 'E7', 'C#6', 'B6', 'E6'].forEach((n, i) => M.bell(ev.back + 0.03 + i * 0.09, n, 0.3 - 0.025 * i, -0.7 + 0.2 * i));
  motif(c('back', 1) + 0.2, { notes: NB_THEME_UP, gap: 0.8, vel: 0.4, n: 5, dur: 3 });

  // ================================================================== the reveal: a stinger; the Moon comes back: one bell
  { const t = B('reveal') + 0.05;
    hit(t, 1.0, 29.1); M.drum(t + 0.01, 0.7, 43.7, 1.0, 1.0);
    M.strings(t, t + 3.6, ['Bb2', 'A3', 'Eb4', 'E4'], 0.42, { att: 0.02, rel: 2.0, cut: 3000, cutTo: 700, cutAt: t + 3.4 });
    M.strings(t, t + 2.6, ['F6', 'E6'], 0.09, { att: 0.02, rel: 1.6, cut: 8000, wave: 'sawtooth', vib: 18 }); }
  M.strings(B('moonback'), B('crash') + 0.5, ['A1', 'E2', 'A2'], 0.3, { att: 1.0, rel: 0.8, cut: 300 });
  M.strings(B('moonback'), B('crash') + 0.5, ['E5', 'A5'], 0.07, { att: 1.0, rel: 0.6, cut: 5000, wave: 'triangle', vib: 2 });
  M.bell(ev.moonBack, 'E6', 0.36, 0); M.bell(ev.moonBack + 0.02, 'A6', 0.18, 0.2); M.rpiano(ev.moonBack, 'A3', 0.32, 2.0, 0);
  // the motorway: low and slow
  M.prog([[B('crash'), C.Dm], [c('crash', 0) + 2.4, C.Am]], B('after') + 0.5, 0.4, { cut: 700 });
  nbPulse(ctx, M.bus, B('crash') + 0.2, B('after'), ['D2', 'A2'], 1.3, 0.6, { cut: 260, cutTo: 220, acc: 2 });
  M.piano(c('crash', 0) + 0.2, 'D3', 0.36, 4); M.piano(c('crash', 0) + 1.5, 'A2', 0.32, 4);
  // ================================================================== +2 minutes: what it was like (a sad progression)
  M.prog([[B('after'), C.Am], [c('after', 0) + 2.4, C.F], [c('after', 1), C.C], [c('after', 1) + 2.4, C.G], [c('after', 2), C.Am], [c('after', 2) + 2.2, C.F]], B('echo') + 0.6, 0.4, { cut: 1300, lastRel: 1.2 });
  fig(B('after') + 0.5, c('after', 2) - 0.4, ['A4', 'E5', 'C5', 'B4', 'G4', 'C5'], 0.95, 0.16, 1.5);
  motif(c('after', 2) + 0.2, { gap: 1.0, vel: 0.42, n: 5, dur: 3.6 });

  // ================================================================== 4:42 PM: Saturn's light should arrive now; there is none
  M.prog([[B('echo'), C.Am9], [c('echo', 1), C.Flyd]], ev.sat + 0.05, 0.34, { cut: 1200, lastRel: 0.05 });
  M.strings(B('echo'), ev.sat + 0.02, ['E6', 'B6'], 0.08, { att: 3, rel: 0.03, cut: 6000, wave: 'triangle', vib: 2 });
  fig(B('echo') + 0.8, c('echo', 1) - 0.2, ['E5', 'B5', 'A5', 'E6'], 1.4, 0.13, 1.3);
  M.roll(c('echo', 1) + 0.6, ev.sat - 0.05, [[c('echo', 1) + 0.6, 0.04], [ev.sat - 2.5, 0.25], [ev.sat - 0.3, 0.62]], 55);
  M.strings(c('echo', 1), ev.sat + 0.02, ['A3', 'E4', 'A4', 'B4'], 0.28, { att: 2.0, rel: 0.03, cut: 800, cutTo: 3400, cutAt: ev.sat - 0.2, glide: 90, glideFrom: c('echo', 1) + 1, glideAt: ev.sat });
  hit(ev.sat, 1.0, 32.7); M.bell(ev.sat + 0.03, 'E6', 0.34, 0);
  M.strings(ev.sat + 0.15, END + 0.05, ['A1', 'E2'], 0.32, { att: 1.2, rel: 0.02, cut: 220 });
  // the question: the motif a note short, over an unresolved chord, cut on the last frame
  M.strings(B('question'), END + 0.05, ['A2', 'E3', 'B3', 'D4'], 0.42, { att: 0.4, rel: 0.02, cut: 1300 });
  M.strings(B('question'), END + 0.05, ['E5', 'B5'], 0.1, { att: 0.5, rel: 0.02, cut: 4000, wave: 'triangle' });
  motif(c('question', 0) + 0.05, { gap: 0.55, vel: 0.46, n: 4, dur: 2.2 });
});
NB_SOUND_FNS.push(nbShepard, nbPulse, nbMusicKit);
