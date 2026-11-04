/* =====================================================================
   SOUND · MUSIC — an original score, all synthesised (the music kit of the gravity films): string pads, a felt piano
   (also played backwards, so notes swell up out of nothing), glass bells, a low drum. In the air there is no sound:
   for three seconds the score is the only thing playing, so it carries the film.
     before 2:00   nothing but the radio in your kitchen (sfx)
     2:00          the radio cuts dead; a low hit and a high glass chord: the air sets. Then the ice motif (A F E D,
                   slow felt piano), cold D minor pads and a glassy shimmer over the whole kitchen
     the city      a slow pulse starts with the pigeon and tightens all the way to the main road; every "like falling flat
                   from …" lands on a low drum, harder the higher the fall (10 cm a touch, 48 m a blow)
     the wind      the floor drops out (A♭: the planet itself got a push)
     one second    a roll that rises to 2:00:03; the score stops a breath before it; one huge hit and the first major
                   chord of the film as everyone breathes in
     after         D minor again, thinner every minute; the planes on a low pulse; the question ends on the motif
                   without its last note, cut on the last frame
   ===================================================================== */


// the kit: string pads (three detuned oscillators per note through low-passes), felt piano (also reversed), bells,
// a low drum and a heartbeat
function saMusicKit(ctx, K) {
  if (K._music) return K._music;
  const fx = K.fx, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(); bus.connect(K.bus);
  const hall = fx.ir(4.4, { bright: 0.5, damp: 2.8, shape: 2.0, pre: 0.025, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.55;
  bus.connect(hall); hall.connect(wet); wet.connect(K.bus);
  const drumModes = (f) => [[f, 0.7, 1], [f * 1.51, 0.45, 0.5], [f * 1.99, 0.3, 0.35], [f * 2.44, 0.2, 0.2], [f * 3.1, 0.12, 0.12]];
  const M = {
    bus,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4, dest = bus) => {
      const b = fx.pianoBuf(saMidi(n)), len = Math.min(b.length, Math.ceil((dur + fade + 0.05) * fx.sr));
      return fx.play(b.subarray(0, len), t, dest, { vol: vel * 0.34, pan, stop: t + dur + fade, fade });
    },
    // a piano note played backwards: it swells up out of nothing and stops dead on its attack at tEnd
    rpiano(tEnd, n, vel, dur = 1.6, pan = 0) {
      const key = 'rp' + n + '_' + dur;
      if (!fx.cache[key]) {
        const b = fx.pianoBuf(saMidi(n)), L = Math.min(b.length, Math.ceil(dur * fx.sr)), y = new Float32Array(L + Math.ceil(0.01 * fx.sr));
        for (let i = 0; i < L; i++) { const u = i / L; y[L - 1 - i] = b[i] * Math.min(1, (1 - u) / 0.35); }
        for (let i = 0; i < 0.01 * fx.sr; i++) y[L + i] = y[L - 1] * (1 - i / (0.01 * fx.sr));
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], tEnd - dur, bus, { vol: vel * 0.34, pan });
    },
    bell: (t, n, vol, pan = 0, dest = bus) => fx.play(fx.bellBuf(saMidi(n)), t, dest, { vol: vol * 0.25, pan }),
    bellCut: (t, n, vol, d = 0.18, pan = 0) => fx.play(fx.bellBuf(saMidi(n)), t, bus, { vol: vol * 0.25, pan, stop: t + d, fade: 0.05 }),
    // a low drum (a timpani-like membrane): f the pitch, vol, soft = a wider mallet, dk = decay
    drum(t, vol, f = 36.7, soft = 1, dk = 1) {
      const key = 'drum' + f + '_' + soft + '_' + dk;
      if (!fx.cache[key]) {
        const y = fx.hit(drumModes(f).map(([a, tau, b]) => [a, tau * dk, b]), { width: 0.006 * soft, amp: 1, noise: 0.25, nlen: 0.02, nhp: 300, len: 3.2 * Math.max(dk, 0.3) });
        const pk = SAX.peak(y) || 1; for (let i = 0; i < y.length; i++) y[i] /= pk;
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
        const f = saHz(nn);
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
function saPulse(ctx, dest, t0, t1, notes, step, vol, o = {}) {
  if (t1 - t0 < step) return;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.q || 4;
  lp.frequency.setValueAtTime(o.cut || 600, t0); lp.frequency.linearRampToValueAtTime(o.cutTo || o.cut || 600, t1);
  lp.connect(g); g.connect(dest); g.gain.value = 0;
  notes.forEach((n, k) => {
    const os = ctx.createOscillator(); os.type = o.wave || 'sawtooth'; os.frequency.value = saHz(n); os.detune.setValueAtTime(k % 2 ? 6 : -6, t0);
    if (o.glide) os.detune.linearRampToValueAtTime((k % 2 ? 6 : -6) + o.glide, t1);
    os.connect(lp); os.start(t0); os.stop(t1 + 0.1);
  });
  for (let t = t0, i = 0; t < t1 - 0.01; t += (o.stepAt ? o.stepAt(t) : step), i++) {
    const acc = o.acc && i % o.acc === 0 ? 1.0 : 0.62, ramp = o.ramp ? o.ramp((t - t0) / (t1 - t0)) : 1, v = vol * 0.05 * acc * ramp, st = o.stepAt ? o.stepAt(t) : step;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.setTargetAtTime(0, t + 0.012, st * (o.decay || 0.28));
  }
}



const SA_CH = {
  Dmaj9: ['D2', 'A2', 'F#3', 'C#4', 'E4'], Fsharp: ['F#1', 'C#2', 'A#2', 'E3', 'G#3'], Abmaj7: ['Ab1', 'Eb2', 'C3', 'G3', 'Bb3'], Fm9: ['F1', 'C2', 'Ab2', 'Eb3', 'G3'],
  Dm9: ['D2', 'A2', 'F3', 'C4', 'E4'], Bbmaj7: ['Bb1', 'F2', 'D3', 'A3', 'C4'], Gm9: ['G1', 'D2', 'Bb2', 'F3', 'A3'], A7sus: ['A1', 'E2', 'D3', 'G3', 'B3'],
  Fmaj7: ['F1', 'C2', 'A2', 'E3', 'G3'], Csus: ['C2', 'G2', 'C3', 'F3', 'G3'], low: ['D1', 'A1', 'D2'], Ebmaj7: ['Eb2', 'Bb2', 'D3', 'G3'],
  Aadd9: ['A1', 'E2', 'A2', 'C#3', 'E3', 'B3', 'C#4', 'E4', 'A4'], Dlyd: ['D2', 'A2', 'E3', 'F#3', 'G#3', 'C#4'], Bm9: ['B1', 'F#2', 'D3', 'A3', 'C#4'],
  Gmaj9: ['G1', 'D2', 'B2', 'F#3', 'A3'], Gadd9: ['G2', 'D3', 'A3', 'B3', 'D4'], Esus: ['E2', 'B2', 'E3', 'A3', 'B3'], high: ['A5', 'D6', 'E6', 'A6'],
  Em9: ['E2', 'B2', 'G3', 'D4', 'F#4'], Cm9: ['C2', 'G2', 'Eb3', 'Bb3', 'D4'], Dbig: ['D1', 'A1', 'D2', 'F#2', 'A2', 'D3', 'F#3', 'A3', 'E4'],
};
const SA_THEME = ['A4', 'F4', 'E4', 'D4', 'A3'];   // the ice motif: slow, falling (at the very end it doesn't finish)
const saOct = (n, k) => n.replace(/-?\d$/, (d) => String(+d + k));

saSound('music', 'score', function (ctx, bus, K) {
  const M = saMusicKit(ctx, K), C = SA_CH, c = saC, B = saB, f = saFilmAt, END = SA.end, L = SA.tLock, R = SA.tRelease;
  // the ice motif on felt piano: o.n notes, o.gap, o.oct, o.vel
  const motif = (t, o = {}) => SA_THEME.slice(0, o.n || 4).forEach((n, i) => M.piano(t + i * (o.gap || 1.25), saOct(n, o.oct || 0), (o.vel || 0.5) * (i ? 0.86 : 1), o.dur || 3.6, [-0.25, 0.1, -0.1, 0.22, 0][i]));
  // glass: two high bells a fifth apart (the air set)
  const glass = (t, v = 0.4, n = 'D6') => { M.bell(t, n, v, -0.3); M.bell(t + 0.02, saOct(n, 1).replace('D', 'A'), v * 0.55, 0.3); };
  // the belly-flop drum: louder the higher the fall (h in metres)
  const flop = (t, h) => { const v = MathX.clamp(0.22 + 0.16 * Math.log10(h / 0.1 + 1) * 1.6, 0.2, 1.05); M.drum(t, v, 36.7, 1.3, 0.9 + 0.3 * v); if (h > 3) M.drum(t + 0.012, 0.4 * v, 55, 1.4, 0.7); if (h > 30) M.rpiano(t, 'D2', 0.5, 2.2, 0); };
  const sp = SA_SPD;
  // a sparse figure on the piano
  const fig = (t0, t1, notes, step, vel, durK = 1.8) => { for (let t = t0, i = 0; t < t1 - 0.3; t += step, i++) M.piano(t, notes[i % notes.length], vel * (0.8 + 0.2 * Math.sin(i * 1.3)), step * durK, i % 2 ? 0.25 : -0.25); };

  // ================================================================== 1 · 2:00: the air sets (your kitchen)
  M.rpiano(L, 'D3', 0.5, 2.4, 0); M.rpiano(L, 'A3', 0.32, 2.4, 0.2);
  M.drum(L, 0.75, 36.7, 1.1, 1.6); glass(L, 0.42);
  // the cold: a high glassy chord that never moves, over a low drone, the whole three and a half minutes
  M.strings(L, B('window') + 0.6, ['D5', 'E5', 'A5'], 0.17, { att: 0.25, rel: 1.4, cut: 3800, wave: 'triangle', vib: 2, keys: [[L, 1], [B('silence'), 1], [c('silence', 0), 0.55], [B('steam'), 0.9], [B('window'), 0.7]] });
  M.strings(L + 0.4, B('window') + 1.0, C.low, 0.36, { att: 2.0, rel: 1.6, cut: 260, wave: 'sawtooth' });
  M.prog([[L + 0.6, C.Dm9], [B('you'), C.Bbmaj7], [B('real'), C.Gm9], [B('silence'), C.Dm9], [B('steam'), C.Bbmaj7], [B('clock'), C.Gm9], [B('catfine'), C.Fmaj7]], B('window') + 0.6, 0.42, { cut: 1100, lastRel: 1.2 });
  motif(c('stop', 0) + 0.4, { gap: 1.5, vel: 0.5 });
  M.rpiano(c('stop', 1), 'E5', 0.3, 1.8, 0.2); M.rpiano(c('stop', 2), 'A4', 0.32, 1.8, -0.2);     // the water, the cat
  motif(c('you', 0) + 0.3, { gap: 1.7, vel: 0.42, oct: -1, n: 3 });
  // the one impossible thing: two low notes, held
  M.piano(c('real', 0) + 0.2, 'G2', 0.42, 5); M.piano(c('real', 1) + 0.2, 'D2', 0.4, 5); glass(c('real', 1) + 0.25, 0.25, 'D6');
  // silence: only the glass chord and a slow low pulse under your heartbeat (sfx)
  fig(c('steam', 0) + 0.3, B('clock'), ['D5', 'A4', 'F5', 'E5'], 1.25, 0.2);
  fig(c('steam', 1) + 0.3, B('clock') + 0.1, ['A5', 'E6'], 1.8, 0.1, 1.2);
  // the clock: a single high note where the tick should be, again and again, never the tock
  for (let t = c('clock', 0) + 0.5; t < B('catfine') - 0.5; t += 1.6) M.bellCut(t, 'A6', 0.22, 0.12, 0.35);
  // your cat is fine: a warmer chord and the motif turned up (F major)
  fig(c('catfine', 1) + 0.2, B('window') - 0.2, ['F4', 'C5', 'A4', 'G5'], 0.9, 0.2);
  flop(c('catfine', 1) + 0.15, sp.cat.h);

  // ================================================================== 2 · the city (a pulse that tightens to the main road)
  M.strings(B('window'), B('pigeon') + 0.6, C.Fmaj7, 0.5, { att: 1.0, rel: 0.8, cut: 2200 });
  M.strings(B('window'), B('pigeon') + 0.6, ['C6', 'E6', 'A6'], 0.12, { att: 1.2, rel: 0.8, cut: 5000, wave: 'triangle', vib: 3 });
  motif(c('window', 0) + 0.2, { gap: 0.9, vel: 0.36, oct: 1 });
  M.prog([[B('pigeon'), C.Dm9], [B('walkers'), C.Bbmaj7], [B('cyclist'), C.Gm9], [B('car'), C.A7sus], [B('fountain'), C.Dlyd], [B('jumper'), C.Gm9],
    [B('swing'), C.Ebmaj7], [B('dog'), C.Cm9], [B('runner'), C.Bbmaj7], [B('road'), C.Dm9], [c('road', 2), C.Fm9], [B('wind'), C.Abmaj7], [c('wind', 1), C.low]], B('count') + 0.4, 0.48, { cut: 1300 });
  // the pulse: a step of 1.0 s at the pigeon, 0.45 s on the main road (and the filter opening)
  { const t0 = B('pigeon') + 0.3, t1 = B('count') + 0.2, stepAt = (t) => 1.0 - 0.55 * MathX.clamp((t - t0) / (t1 - t0), 0, 1) ** 1.3;
    saPulse(ctx, M.bus, t0, B('fountain'), ['D2', 'A2'], 1.0, 0.75, { stepAt, cut: 320, cutTo: 520, acc: 4, ramp: (u) => 0.55 + 0.45 * u });
    saPulse(ctx, M.bus, B('jumper'), B('road'), ['D2', 'A2', 'D3'], 0.8, 0.9, { stepAt, cut: 420, cutTo: 700, acc: 4 });
    saPulse(ctx, M.bus, B('road'), B('wind') + 0.1, ['D2', 'A2', 'F3'], 0.5, 1.15, { stepAt, cut: 600, cutTo: 1300, acc: 2, ramp: (u) => 0.7 + 0.5 * u }); void t1; }
  // every belly flop on the drum
  flop(c('pigeon', 0) + 0.2, sp.pigeon.h); flop(c('walkers', 0) + 0.3, sp.walk.h); flop(c('cyclist', 1) + 0.3, sp.bike.h); flop(c('car', 1) + 0.3, sp.car.h);
  flop(c('runner', 1) + 0.25, sp.run.h); flop(c('road', 1) + 0.3, sp.road.h); flop(c('road', 2) + 0.3, sp.motorway.h);
  // the park: glass for the leaves and the fountain, the motif high for the girl and the swing
  glass(c('fountain', 0) + 0.2, 0.36, 'D6'); M.rpiano(c('fountain', 1) + 0.1, 'F#5', 0.3, 1.6, 0.2);
  motif(c('jumper', 1) + 0.2, { gap: 0.8, vel: 0.3, oct: 1, n: 3 }); motif(c('swing', 1) + 0.2, { gap: 0.8, vel: 0.3, oct: 1, n: 3 });
  M.bellCut(c('dog', 0) + 0.2, 'F6', 0.3, 0.2);
  // the wind (the whole planet): the pulse stops, the floor drops (a low A♭ under everything), a slow rising glass cluster
  M.drum(c('wind', 0) + 0.1, 0.8, 32.7, 1.2, 1.8); M.strings(c('wind', 0), B('count') + 0.5, ['Ab1', 'Eb2'], 0.4, { att: 0.3, rel: 1.0, cut: 300 });
  M.strings(c('wind', 1), B('count') + 0.5, ['C6', 'Db6', 'G6'], 0.13, { att: 2.0, rel: 0.6, cut: 5000, wave: 'triangle', glide: 60 });

  // ================================================================== 3 · one second left; 2:00:03
  M.strings(B('count'), R - 0.42, ['D3', 'A3', 'D4', 'E4', 'A4'], 0.5, { att: 1.5, rel: 0.05, cut: 900, cutTo: 4200, cutAt: R - 0.45, glide: 120, glideFrom: B('count') + 2, glideAt: R - 0.45 });
  M.strings(B('count'), R - 0.42, C.low, 0.5, { att: 1.0, rel: 0.05, cut: 300, cutTo: 700, cutAt: R - 0.45 });
  M.roll(B('count') + 1.0, R - 0.42, [[B('count') + 1.0, 0.08], [R - 3, 0.35], [R - 0.45, 0.8]], 55);
  // (a breath of nothing) — then the hit and the first major chord of the film
  M.drum(R, 1.0, 36.7, 1.0, 2.2); M.drum(R + 0.01, 0.7, 55, 1.2, 1.2); M.drum(R + 0.02, 0.5, 27.5, 1.4, 2.0);
  M.strings(R, B('fall') + 1.5, C.Dbig, 0.7, { att: 0.08, rel: 1.6, cut: 2600, cutTo: 1500, cutAt: B('fall') });
  ['D6', 'A5', 'F#5', 'D5', 'A4', 'F#4', 'D4'].forEach((n, i) => M.bell(R + 0.6 + i * 0.22, n, 0.32 * (1 - 0.07 * i), -0.4 + 0.13 * i));   // everything starts to fall
  M.piano(c('release', 1), 'D3', 0.5, 5); M.piano(c('release', 1) + 0.02, 'A3', 0.4, 5); M.piano(c('release', 1) + 0.04, 'F#4', 0.36, 5);
  // ================================================================== falling from rest (slow motion), the bell
  M.prog([[B('fall'), C.Dmaj9], [c('fall', 1), C.Bm9], [c('fall', 2), C.Gmaj9], [c('fall', 3), C.A7sus]], B('echo') + 0.6, 0.48, { cut: 1500 });
  fig(B('fall') + 0.5, B('echo') - 0.4, ['F#5', 'D5', 'A4', 'E5', 'D5', 'B4'], 0.85, 0.2);
  M.strings(B('echo'), B('fine') + 0.5, ['A4', 'D5', 'E5'], 0.2, { att: 1.0, rel: 1.0, cut: 2600, wave: 'triangle', vib: 2 });
  M.strings(B('echo'), B('fine') + 0.5, C.low, 0.3, { att: 1.2, rel: 1.0, cut: 240 });

  // ================================================================== 4 · after (thinner every minute)
  M.prog([[B('fine'), C.Dm9], [c('fine', 1), C.Bbmaj7], [B('stalled'), C.Gm9], [c('stalled', 1), C.Cm9], [B('sirens'), C.Ebmaj7], [B('still'), C.Dm9], [c('still', 1), C.Bbmaj7], [B('planes'), C.Fm9], [c('planes', 1), C.low]], B('question') + 0.3, 0.42, { cut: 1000 });
  motif(c('fine', 0) + 0.5, { gap: 1.6, vel: 0.36, n: 4 });
  motif(c('stalled', 0) + 0.5, { gap: 1.8, vel: 0.32, oct: -1, n: 3 });
  fig(c('still', 0) + 0.4, B('planes') - 0.3, ['D5', 'A4', 'F5', 'E5'], 1.4, 0.16);
  // the planes: a low pulse and the drum on 3.2 km
  saPulse(ctx, M.bus, B('planes') + 0.3, B('question'), ['D1', 'A1', 'D2'], 0.62, 1.0, { cut: 260, cutTo: 520, acc: 2, ramp: (u) => 0.5 + 0.5 * u });
  flop(c('planes', 1) + 0.3, sp.plane.h);
  // the question: the motif without its last note, over a high unresolved chord, cut on the last frame
  M.strings(B('question'), END + 0.2, ['D3', 'A3', 'E4', 'G4'], 0.5, { att: 0.3, rel: 0.05, cut: 1400 });
  M.strings(B('question'), END + 0.2, ['A5', 'E6'], 0.14, { att: 0.4, rel: 0.05, cut: 4000, wave: 'triangle' });
  motif(c('question', 0) + 0.1, { gap: 0.55, vel: 0.5, n: 3 });
});
