/* =====================================================================
   SOUND · MUSIC — an original score, all synthesised (the music kit of the gravity films, via the Air solid and Speed
   of light films): string pads, a felt piano (also played backwards, so notes swell up out of nothing), glass bells, a
   low drum, a heartbeat. Eerie, cold D minor, like Slower light. Its motif is a falling line, "the empty seat" (A F E
   D); in the maternity ward it turns round and rises; at the end it stops a note short.
     7:42:00       a swell that stops dead on the moment they vanish; a low hit and glass
     the slow part a heartbeat that quickens to the lorry; a hit when it meets the barrier; when you stop, almost nothing
     the radio     the score steps back under the radio's own song (a computer still choosing)
     the river     a pulse under the train and the barge; a hit when the barge runs aground
     flight 2207   high and wide; a low hit on "both its pilots were men"; the 30 seconds at the cockpit door: a tick a
                   second, strings that climb, and the door's click
     8:04          the only warm minute: the ward, the birth resolves to D major, the motif rising
     9:47 on       the endless rise (a Shepard–Risset glissando) under the circling planes, faster to the landing
     touchdown     a hit and a release; then the question, unresolved, cut on the last frame
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
          const osc = ctx.createOscillator(), og = ctx.createGain(), mgo = ctx.createOscillator(), lg = ctx.createGain();
          osc.type = o.wave || 'sawtooth'; osc.frequency.value = f;
          const d0 = d + r.range(-2, 2); osc.detune.setValueAtTime(d0, t0);
          if (o.glide) { osc.detune.setValueAtTime(d0, o.glideFrom || t0); osc.detune.linearRampToValueAtTime(d0 + o.glide, o.glideAt || t1); }
          mgo.frequency.value = r.range(4.4, 5.4); lg.gain.setValueAtTime(0, t0); lg.gain.linearRampToValueAtTime(o.vib == null ? 7 : o.vib, t0 + Math.min(1.5, (t1 - t0) * 0.6));
          mgo.connect(lg); lg.connect(osc.detune); if (wob) wob.connect(osc.detune);
          og.gain.value = 1 / Math.sqrt(notes.length); osc.connect(og); og.connect(lanes[k]);
          osc.start(t0); osc.stop(t1 + 0.05); mgo.start(t0); mgo.stop(t1 + 0.05);
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
  Dm9: ['D2', 'A2', 'F3', 'C4', 'E4'], Dm: ['D2', 'A2', 'D3', 'F3'], Bblyd: ['Bb1', 'F2', 'D3', 'A3', 'E4'], Gm9: ['G1', 'D2', 'Bb2', 'F3', 'A3'],
  A7sus: ['A1', 'E2', 'D3', 'G3'], Fmaj9: ['F1', 'C2', 'A2', 'E3', 'G3'], Cadd9: ['C2', 'G2', 'D3', 'E3', 'G3'], Dadd9: ['D2', 'A2', 'F#3', 'A3', 'E4'],
  Gadd9: ['G1', 'D2', 'B2', 'D3', 'A3'], Ebmaj7: ['Eb2', 'Bb2', 'D3', 'G3'], low: ['D1', 'A1', 'D2'], D5: ['D2', 'A2', 'D3', 'A3'], high: ['A5', 'D6', 'E6'], ice: ['E5', 'F5', 'A5'],
};
const MG_THEME = ['A4', 'F4', 'E4', 'D4', 'A3'];   // "the empty seat": falling (in the ward it rises; at the end it stops a note short)
const MG_RISE = ['D4', 'E4', 'F#4', 'A4', 'D5'];
const mgOct = (n, k) => n.replace(/-?\d$/, (d) => String(+d + k));

mgSound('music', 'score', function (ctx, bus, K) {
  const M = mgMusicKit(ctx, K), C = MG_CH, c = mgC, B = mgB, F = mgFilmAt, END = MG.end, T0 = MG.tLock;
  const ev = { hit: F(MGP.lorry.sHit), stop: F(MGP.car.sStop), barge: F(MG.sBargeHit), code: F(MG.sCode), door: F(MG.sDoor), birth: F(MG.sBirth), flap: F(MG.sFlap), land3: F(MG.sLand3), td: F(MG.sTD), via: F(MG.sOverViaduct) };
  const motif = (t, o = {}) => (o.notes || MG_THEME).slice(0, o.n || 4).forEach((n, i) => M.piano(t + i * (o.gap || 1.2), mgOct(n, o.oct || 0), (o.vel || 0.5) * (i ? 0.88 : 1), o.dur || 3.4, [-0.2, 0.15, -0.1, 0.2, 0][i]));
  const glass = (t, v = 0.36, n = 'D6') => { M.bell(t, n, v, -0.3); M.bell(t + 0.02, mgOct(n, 0).replace('D', 'A'), v * 0.5, 0.3); };
  const fig = (t0, t1, notes, step, vel, durK = 1.8) => { for (let t = t0, i = 0; t < t1 - 0.3; t += step, i++) M.piano(t, notes[i % notes.length], vel * (0.8 + 0.2 * Math.sin(i * 1.3)), step * durK, i % 2 ? 0.25 : -0.25); };
  const hit = (t, v = 0.9, f = 36.7) => { M.drum(t, v, f, 1.1, 1.8); M.drum(t + 0.012, 0.5 * v, f * 1.5, 1.3, 1.0); };
  const beats = (t0, t1, per, vol) => { for (let t = t0; t < t1 - 0.2; t += per(t)) M.beat(t, vol(t)); };

  // ================================================================== the endless rise: the circling planes (9:47 to the end)
  { const t0 = B('hold') - 0.2, t1 = END + 0.05, e = (t) => 0.07 * mgEv(t, B('hold'), B('hold') + 8) * (1 + 0.6 * mgEv(t, B('final'), ev.td - 1)) * (1 - 0.5 * mgWn(t, ev.td - 0.3, B('question') - 0.5, 0.2, 1.5)) * (t > END - 0.02 ? 0 : 1);
    const rate = (t) => (t < B('final') ? 1 / 30 : t < ev.td ? 1 / 18 : 1 / 26);
    const [Lx, Rx] = mgShepard(K.fx, t0, t1, { rate, env: e, centre: 280, width: 1.2 });
    K.fx.play(Lx, t0, M.bus, { xr: Rx, vol: 1 }); }

  // ================================================================== 7:41: the title, and 7:42:00 (in slow motion)
  M.strings(-0.2, T0 + 0.3, C.low, 0.32, { att: 0.3, rel: 0.4, cut: 280 });
  M.strings(0.0, T0 + 0.3, ['A4', 'D5', 'E5'], 0.09, { att: 1.0, rel: 0.4, cut: 2400, wave: 'triangle', vib: 2 });
  motif(0.3, { gap: 0.62, vel: 0.36, n: 3, dur: 2.6, oct: 0 });
  // 7:42:00.000: a swell that stops dead, a low hit, glass
  M.rpiano(T0, 'D2', 0.5, 2.2, 0); M.rpiano(T0, 'A2', 0.34, 2.2, 0.2); hit(T0, 0.75); glass(T0, 0.34);
  // the slow part: Dm9 → B♭ lydian → Gm9 → A7sus, cold and far, and a heartbeat that quickens to the lorry
  M.prog([[T0 + 0.3, C.Dm9], [B('wheel'), C.Bblyd], [B('brake'), C.Gm9], [c('brake', 1), C.A7sus], [B('lorry'), C.Dm]], ev.hit + 0.1, 0.42, { cut: 1100, lastRel: 0.1 });
  M.strings(T0 + 0.5, ev.hit + 0.1, ['A5', 'D6'], 0.1, { att: 3, rel: 0.1, cut: 3600, wave: 'triangle', vib: 2, glide: 60, glideFrom: B('lorry'), glideAt: ev.hit });
  motif(c('start', 0) + 0.5, { gap: 1.6, vel: 0.46 });
  motif(c('start', 1) + 0.6, { gap: 1.8, vel: 0.36, oct: -1, n: 3 });
  fig(c('wheel', 1) + 0.4, B('brake') - 0.2, ['D5', 'A4', 'E5', 'F4'], 1.4, 0.16);
  beats(B('wheel') + 0.5, ev.hit - 0.2, (t) => 1.7 - 0.95 * MathX.clamp((t - B('wheel')) / (ev.hit - B('wheel')), 0, 1), (t) => 0.32 + 0.3 * MathX.clamp((t - B('wheel')) / (ev.hit - B('wheel')), 0, 1));
  M.roll(ev.hit - 2.6, ev.hit - 0.04, [[ev.hit - 2.6, 0.05], [ev.hit - 0.4, 0.5]], 55);
  // the lorry meets the barrier: the hit; a cluster that grinds while it slides
  hit(ev.hit, 1.0); M.drum(ev.hit + 0.02, 0.5, 27.5, 1.4, 2.0); glass(ev.hit + 0.03, 0.32, 'D6');
  M.strings(ev.hit, ev.stop + 0.1, ['D3', 'Eb3', 'A3', 'Bb3'], 0.3, { att: 0.2, rel: 0.1, cut: 900, cutTo: 2600, cutAt: ev.stop - 0.4, glide: 90, glideFrom: ev.hit + 1, glideAt: ev.stop });
  M.strings(ev.hit, ev.stop + 0.1, C.low, 0.42, { att: 0.2, rel: 0.1, cut: 240, cutTo: 380, cutAt: ev.stop });
  beats(ev.hit + 1.2, ev.stop - 0.6, () => 0.82, () => 0.5);
  // you stop, 3 m from it: everything cuts; one bell, a held high note
  M.bell(ev.stop + 0.05, 'A5', 0.3, 0); M.strings(ev.stop + 0.1, B('cars') + 0.5, ['A5'], 0.08, { att: 0.3, rel: 0.6, cut: 4000, wave: 'triangle', vib: 1 });
  M.strings(ev.stop + 0.5, B('cars') + 0.5, ['D1', 'A1'], 0.3, { att: 1.2, rel: 0.6, cut: 200 });
  // the cars all round: wide, slow; hazard-light bells
  M.prog([[B('cars'), C.Dm9], [c('cars', 1), C.Fmaj9], [c('cars', 2), C.Gm9]], B('radio') + 0.4, 0.4, { cut: 1200 });
  motif(c('cars', 0) + 0.4, { gap: 1.5, vel: 0.4 });
  { const r = new RNG(42), notes = ['A5', 'D6', 'E6', 'A6', 'F6']; for (let t = c('cars', 1) + 0.3, i = 0; t < B('radio') - 0.5; t += 0.95 + 0.5 * r.next(), i++) M.bell(t, notes[r.int(0, notes.length - 1)], 0.1 + 0.07 * r.next(), r.range(-0.8, 0.8)); }

  // ================================================================== real speed: the radio (its own song plays), his phone
  M.strings(B('radio'), B('phone') + 0.4, ['D2', 'A2'], 0.26, { att: 1.5, rel: 0.6, cut: 260 });
  M.strings(B('radio') + 2, B('phone') + 0.4, ['E5', 'A5'], 0.06, { att: 3, rel: 0.6, cut: 3800, wave: 'triangle', vib: 3 });
  M.prog([[B('phone'), C.Gm9], [c('phone', 1), C.Ebmaj7]], B('train') + 0.4, 0.38, { cut: 1000 });
  motif(c('phone', 0) + 0.8, { gap: 1.9, vel: 0.34, oct: -1, n: 4 });
  // the river: a pulse under the train and the barge; a hit when the barge runs aground
  M.prog([[B('train'), C.Dm9], [c('train', 1), C.Bblyd], [B('barge'), C.Gm9], [c('barge', 1), C.A7sus]], ev.barge + 0.2, 0.4, { cut: 1100, lastRel: 0.1 });
  mgPulse(ctx, M.bus, B('train') + 0.3, ev.barge - 0.05, ['D1', 'A1'], 0.9, 0.8, { cut: 300, cutTo: 620, acc: 4, ramp: (u) => 0.55 + 0.45 * u, stepAt: (t) => 0.9 - 0.3 * MathX.clamp((t - B('train')) / (ev.barge - B('train')), 0, 1) });
  fig(c('train', 1) + 0.4, B('barge') - 0.2, ['A4', 'D5', 'F5', 'E5'], 1.1, 0.14);
  M.roll(ev.barge - 2.2, ev.barge - 0.04, [[ev.barge - 2.2, 0.05], [ev.barge - 0.4, 0.45]], 55);
  hit(ev.barge, 0.95, 32.7); M.drum(ev.barge + 0.02, 0.45, 49, 1.3, 1.3);
  M.strings(ev.barge + 0.1, B('plane') + 0.6, ['D1', 'A1', 'D2'], 0.32, { att: 0.6, rel: 0.6, cut: 220 });

  // ================================================================== flight 2207
  M.prog([[B('plane'), C.Fmaj9], [c('plane', 1), C.Dm], [c('plane', 2), C.Bblyd], [B('world'), C.Gm9], [c('world', 1), C.A7sus]], B('door') + 0.4, 0.42, { cut: 1500 });
  M.strings(B('plane'), B('door') + 0.4, C.high, 0.1, { att: 2.5, rel: 0.6, cut: 5200, wave: 'triangle', vib: 2 });
  motif(c('plane', 0) + 0.5, { gap: 1.3, vel: 0.38, oct: 1, n: 4 });
  hit(c('plane', 1) + 0.15, 0.8, 32.7); M.rpiano(c('plane', 1) + 0.15, 'D3', 0.42, 2.0, 0);
  glass(c('plane', 2) + 0.2, 0.26, 'A5');
  fig(B('world') + 0.6, c('world', 1) - 0.2, ['D5', 'A5', 'F5', 'E5', 'C5'], 0.85, 0.14, 1.3);
  hit(c('world', 1) + 0.1, 0.85); glass(c('world', 1) + 0.12, 0.3, 'D6');
  // the cockpit door: 30 seconds. A tick a second from the code to the click; strings that climb; the door's click
  M.prog([[B('door'), C.Dm9], [ev.code, C.Gm9]], ev.door + 0.1, 0.38, { cut: 1000, lastRel: 0.1 });
  for (let t = ev.code + 1, i = 0; t < ev.door - 0.2; t += 1, i++) { const u = i / 30; M.bellCut(t, i % 2 ? 'A5' : 'D6', 0.16 + 0.14 * u, 0.12, i % 2 ? 0.3 : -0.3); if (i % 2 === 0) M.drum(t, 0.12 + 0.25 * u, 55, 1.6, 0.25); }
  M.strings(ev.code, ev.door + 0.05, ['A3', 'D4', 'E4', 'A4'], 0.26, { att: 3, rel: 0.05, cut: 700, cutTo: 3200, cutAt: ev.door - 0.2, glide: 160, glideFrom: ev.code + 4, glideAt: ev.door });
  M.strings(ev.code, ev.door + 0.05, C.low, 0.38, { att: 2.0, rel: 0.05, cut: 220, cutTo: 420, cutAt: ev.door });
  M.roll(ev.door - 3.5, ev.door - 0.04, [[ev.door - 3.5, 0.05], [ev.door - 0.4, 0.5]], 55);
  hit(ev.door, 0.9, 36.7); glass(ev.door + 0.02, 0.32, 'D6');
  // she's alone up front: cold and high, a few notes
  M.strings(ev.door + 0.3, B('tower') + 0.5, C.ice, 0.12, { att: 2.0, rel: 0.6, cut: 4200, wave: 'triangle', vib: 1.5 });
  M.strings(ev.door + 0.3, B('tower') + 0.5, ['D1', 'A1', 'E2'], 0.34, { att: 2.0, rel: 0.6, cut: 260 });
  fig(c('door', 3) + 3.5, B('tower') - 0.3, ['E5', 'A4', 'F5', 'D5'], 1.6, 0.15);
  motif(c('alone', 1) + 0.4, { gap: 1.4, vel: 0.36, n: 4 });
  // the tower: 2 controllers of 9: a pulse that won't settle
  M.prog([[B('tower'), C.Dm], [c('tower', 1), C.Bblyd]], B('smoke') + 0.4, 0.4, { cut: 1100 });
  mgPulse(ctx, M.bus, B('tower') + 0.2, B('smoke') - 0.1, ['D2', 'A2', 'Eb3'], 0.42, 0.8, { cut: 420, cutTo: 900, acc: 4, ramp: (u) => 0.6 + 0.4 * u });

  // ================================================================== 7:51 smoke over the town
  M.strings(B('smoke'), B('ward') + 0.4, ['D1', 'A1', 'D2'], 0.4, { att: 1.5, rel: 1.0, cut: 240 });
  M.strings(B('smoke'), B('ward') + 0.2, ['D3', 'Eb3', 'A3'], 0.2, { att: 2.0, rel: 1.0, cut: 700, wave: 'triangle', vib: 4 });
  for (const k of [0, 1, 2]) M.drum(c('smoke', k) + 0.2, 0.5, 36.7, 1.4, 1.6);
  motif(c('smoke', 1) + 0.5, { gap: 1.7, vel: 0.32, oct: -1, n: 3 });

  // ================================================================== 8:04 the maternity ward: the only warm minute
  M.prog([[B('ward'), C.Fmaj9], [c('ward', 1), C.Cadd9], [c('ward', 2) - 2.2, C.Bblyd], [ev.birth, C.Dadd9], [c('ward', 3) + 1.8, C.Gadd9], [c('ward', 4), C.Dadd9]], B('walk') + 0.6, 0.4, { cut: 1500 });
  fig(B('ward') + 0.6, c('ward', 2) - 0.5, ['F4', 'C5', 'A4', 'E5'], 1.25, 0.15);
  M.rpiano(ev.birth, 'D3', 0.5, 2.6, 0); M.rpiano(ev.birth, 'F#3', 0.3, 2.6, 0.2); M.rpiano(ev.birth, 'A3', 0.3, 2.6, -0.2);
  M.strings(ev.birth, B('walk') + 0.4, ['F#5', 'A5', 'D6'], 0.1, { att: 1.5, rel: 1.0, cut: 5200, wave: 'triangle', vib: 3 });
  motif(c('ward', 3) + 0.4, { notes: MG_RISE, n: 5, gap: 1.0, vel: 0.44 });
  ['D6', 'A5', 'F#5', 'E6', 'D6'].forEach((n, i) => M.bell(c('ward', 4) + 0.6 + i * 1.1, n, 0.18 - 0.02 * i, i % 2 ? 0.4 : -0.4));

  // ================================================================== 9:10 walking home; 9:31 the alert
  M.prog([[B('walk'), C.Dm9], [c('walk', 1), C.Bblyd], [c('walk', 2), C.Fmaj9]], B('alert') + 0.4, 0.38, { cut: 1100 });
  fig(B('walk') + 0.5, B('alert') - 0.3, ['D5', 'A4', 'F4', 'E4', 'A4', 'C5'], 1.05, 0.15);
  M.prog([[B('alert'), C.Gm9], [c('alert', 1), C.Ebmaj7], [c('alert', 2), C.A7sus]], B('hold') + 0.4, 0.4, { cut: 1200 });
  mgPulse(ctx, M.bus, c('alert', 0) + 1.5, B('hold') - 0.1, ['D1', 'A1', 'D2'], 0.75, 0.7, { cut: 320, cutTo: 640, acc: 4, ramp: (u) => 0.5 + 0.5 * u });
  hit(c('alert', 2) + 0.1, 0.75, 32.7);

  // ================================================================== 9:47 the circling planes; the queue
  M.prog([[B('hold'), C.Dm9], [B('many'), C.Bblyd], [c('many', 1), C.Gm9], [c('many', 2), C.A7sus]], B('autoland') + 0.4, 0.4, { cut: 1100 });
  motif(c('hold', 0) + 0.6, { gap: 1.4, vel: 0.36, n: 4 });
  mgPulse(ctx, M.bus, B('many') + 0.2, B('autoland') - 0.05, ['D2', 'A2', 'Eb3'], 0.5, 0.75, { cut: 380, cutTo: 900, acc: 4, ramp: (u) => 0.5 + 0.5 * u });
  hit(c('many', 2) + 0.1, 0.85, 32.7); M.rpiano(c('many', 2) + 0.1, 'A2', 0.4, 2.0, 0);

  // ================================================================== the autoland: one switch at a time
  M.prog([[B('autoland'), C.Fmaj9], [c('autoland', 1), C.Cadd9], [c('autoland', 2), C.Bblyd], [c('autoland', 3), C.Gm9]], B('final') + 0.6, 0.4, { cut: 1400 });
  M.strings(B('autoland') + 1, B('final') + 0.6, ['A5', 'E6'], 0.08, { att: 2.5, rel: 0.6, cut: 4800, wave: 'triangle', vib: 2 });
  fig(c('autoland', 1) + 0.3, c('autoland', 3) - 0.3, ['C5', 'G4', 'D5', 'A4'], 0.95, 0.15, 1.2);
  // both autopilots lock on: two bells rising, then the fifth
  ['D5', 'A5', 'D6'].forEach((n, i) => M.bell(ev.land3 + i * 0.55, n, 0.3 - 0.06 * i, -0.4 + 0.4 * i));

  // ================================================================== 10:21 the final approach, and the landing
  M.prog([[B('final'), C.Dm9], [c('final', 1), C.Bblyd], [c('final', 2), C.Gm9], [c('final', 3), C.A7sus]], ev.td + 0.05, 0.44, { cut: 1000, cutTo: 2600, cutAt: ev.td - 0.5, lastRel: 0.05 });
  beats(B('final') + 0.5, ev.td - 0.3, (t) => 1.25 - 0.6 * MathX.clamp((t - B('final')) / (ev.td - B('final')), 0, 1), (t) => 0.3 + 0.35 * MathX.clamp((t - B('final')) / (ev.td - B('final')), 0, 1));
  mgPulse(ctx, M.bus, ev.via, ev.td - 0.05, ['D1', 'A1', 'D2'], 0.6, 0.8, { cut: 300, cutTo: 1100, acc: 2, ramp: (u) => 0.5 + 0.6 * u, stepAt: (t) => 0.6 - 0.3 * MathX.clamp((t - ev.via) / (ev.td - ev.via), 0, 1) });
  M.strings(c('final', 2), ev.td + 0.02, ['A4', 'D5', 'E5'], 0.14, { att: 3, rel: 0.02, cut: 2000, cutTo: 5200, cutAt: ev.td, wave: 'triangle', glide: 120, glideFrom: c('final', 2) + 2, glideAt: ev.td });
  M.roll(ev.td - 4.5, ev.td - 0.04, [[ev.td - 4.5, 0.04], [ev.td - 0.5, 0.55]], 55);
  // touchdown: a hit, and a release (D major, the rising motif)
  hit(ev.td, 1.0, 36.7); M.drum(ev.td + 0.02, 0.55, 27.5, 1.4, 2.0); glass(ev.td + 0.03, 0.36, 'D6');
  M.strings(ev.td + 0.05, B('question') + 0.4, C.Dadd9, 0.44, { att: 0.8, rel: 0.6, cut: 1800 });
  M.strings(ev.td + 0.05, B('question') + 0.4, ['F#5', 'A5', 'D6'], 0.1, { att: 1.2, rel: 0.6, cut: 5200, wave: 'triangle', vib: 3 });
  motif(ev.td + 0.6, { notes: MG_RISE, n: 4, gap: 0.8, vel: 0.42 });
  // the question: unresolved, the falling motif a note short, cut on the last frame
  M.strings(B('question'), END + 0.05, ['G2', 'D3', 'A3', 'C4', 'F4'], 0.46, { att: 0.3, rel: 0.02, cut: 1400 });
  M.strings(B('question'), END + 0.05, ['E5', 'A5'], 0.12, { att: 0.4, rel: 0.02, cut: 4000, wave: 'triangle' });
  motif(c('question', 0) + 0.05, { gap: 0.7, vel: 0.5, n: 3, dur: 2.4 });
  motif(c('question', 1) + 0.05, { gap: 0.55, vel: 0.46, n: 3, dur: 2.4, oct: -1 });
});
MG_SOUND_FNS.push(mgShepard);
