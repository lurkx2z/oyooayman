/* =====================================================================
   SOUND · MUSIC — an original score in F major / D minor, all synthesised (the music kit of the earlier voiceless
   films, renamed sb*): string pads, a felt piano, bells, a low drum, a synth pulse. One idea of this film's own:
     the promise   a seven-note piano phrase (C–A–C–D–C–A–F), the sound of "give half away". It is first heard cold
                   and in the minor, far off, in the cold open (ten years from now); whole and warm under the title;
                   slowly, while you write the note; then it goes missing for most of the film. When you find the
                   note in year nine it comes back faded and slightly out of tune, and it stops one note short. At
                   the crossing, when you stop, it finally plays to its last note.
   The rest follows the money: a hush for the flat; a pulse that builds ball by ball to the win; a big F major for the
   billion; wonder for the room full of notes; warmth for the first gifts; the pulse returns colder with the messages;
   a hollow grandeur for the house; plucked, sly figures for the studies of power; a cold steady pulse downtown and in
   the car; silence when you don't stop; a racing pulse through the years; serious strings for the Giving Pledge;
   light again for the counter-evidence; plain piano for Chuck Feeney; the promise at the crossing; a landing on the
   question.
   ===================================================================== */

// the kit: string pads (three detuned oscillators per note through low-passes), felt piano (also reversed), bells,
// a low drum and a heartbeat
function sbMusicKit(ctx, K) {
  if (K._music) return K._music;
  const fx = K.fx, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(); bus.connect(K.bus);
  const hall = fx.ir(4.2, { bright: 0.5, damp: 2.8, shape: 2.0, pre: 0.025, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.55;
  bus.connect(hall); hall.connect(wet); wet.connect(K.bus);
  const drumModes = (f) => [[f, 0.7, 1], [f * 1.51, 0.45, 0.5], [f * 1.99, 0.3, 0.35], [f * 2.44, 0.2, 0.2], [f * 3.1, 0.12, 0.12]];
  const M = {
    bus,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4, dest = bus, rate = 1) => {
      const b = fx.pianoBuf(sbMidi(n)), len = Math.min(b.length, Math.ceil((dur + fade + 0.05) * fx.sr));
      return fx.play(b.subarray(0, len), t, dest, { vol: vel * 0.34, pan, stop: t + dur + fade, fade, rate });
    },
    // a piano note played backwards: it swells up out of nothing and stops dead on its attack at tEnd
    rpiano(tEnd, n, vel, dur = 1.6, pan = 0) {
      const key = 'rp' + n + '_' + dur;
      if (!fx.cache[key]) {
        const b = fx.pianoBuf(sbMidi(n)), L = Math.min(b.length, Math.ceil(dur * fx.sr)), y = new Float32Array(L + Math.ceil(0.01 * fx.sr));
        for (let i = 0; i < L; i++) { const u = i / L; y[L - 1 - i] = b[i] * Math.min(1, (1 - u) / 0.35); }
        for (let i = 0; i < 0.01 * fx.sr; i++) y[L + i] = y[L - 1] * (1 - i / (0.01 * fx.sr));
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], tEnd - dur, bus, { vol: vel * 0.34, pan });
    },
    bell: (t, n, vol, pan = 0, dest = bus) => fx.play(fx.bellBuf(sbMidi(n)), t, dest, { vol: vol * 0.25, pan }),
    // a low drum (a timpani-like membrane): f the pitch, vol, soft = a wider mallet, dk = decay
    drum(t, vol, f = 41.2, soft = 1, dk = 1) {
      const key = 'drum' + f + '_' + soft + '_' + dk;
      if (!fx.cache[key]) {
        const y = fx.hit(drumModes(f).map(([a, tau, b]) => [a, tau * dk, b]), { width: 0.006 * soft, amp: 1, noise: 0.25, nlen: 0.02, nhp: 300, len: 3.2 * Math.max(dk, 0.3) });
        const pk = SBX.peak(y) || 1; for (let i = 0; i < y.length; i++) y[i] /= pk;
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
    // o.glide (cents, from o.glideFrom to o.glideAt: the chord slides), o.pan
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
        if (o.cutTo) { if (o.cutFrom) lp.frequency.setValueAtTime(o.cut || 1700, o.cutFrom); lp.frequency.linearRampToValueAtTime(o.cutTo, o.cutAt || (t1 - rel * 0.5)); }
        const pn = ctx.createStereoPanner(); pn.pan.value = Math.max(-1, Math.min(1, p + (o.pan || 0))); lp.connect(pn); pn.connect(g); return lp;
      });
      for (const nn of notes) {
        const f = sbHz(nn);
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
function sbPulse(ctx, dest, t0, t1, notes, step, vol, o = {}) {
  if (t1 - t0 < step) return;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.q || 4;
  lp.frequency.setValueAtTime(o.cut || 600, t0); lp.frequency.linearRampToValueAtTime(o.cutTo || o.cut || 600, t1);
  lp.connect(g); g.connect(dest); g.gain.value = 0;
  notes.forEach((n, k) => {
    const os = ctx.createOscillator(); os.type = o.wave || 'sawtooth'; os.frequency.value = sbHz(n); os.detune.setValueAtTime(k % 2 ? 6 : -6, t0);
    os.connect(lp); os.start(t0); os.stop(t1 + 0.1);
  });
  for (let t = t0, i = 0; t < t1 - 0.01; t += (o.stepAt ? o.stepAt(t) : step), i++) {
    const acc = o.acc && i % o.acc === 0 ? 1.0 : 0.62, ramp = o.ramp ? o.ramp((t - t0) / (t1 - t0)) : 1, v = vol * 0.05 * acc * ramp, st = o.stepAt ? o.stepAt(t) : step;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.setTargetAtTime(0, t + 0.012, st * (o.decay || 0.28));
  }
}

const SB_CH = {
  F: ['F2', 'C3', 'A3', 'C4', 'F4'], Fadd9: ['F2', 'C3', 'G3', 'A3', 'C4'], Fmaj7: ['F2', 'C3', 'E3', 'A3', 'C4'], FA: ['A1', 'F2', 'C3', 'A3', 'F4'],
  C: ['C2', 'G2', 'E3', 'G3', 'C4'], CE: ['E2', 'C3', 'G3', 'C4', 'E4'], Csus: ['C2', 'G2', 'F3', 'G3', 'C4'],
  Dm: ['D2', 'A2', 'F3', 'A3', 'D4'], Dm9: ['D2', 'A2', 'F3', 'C4', 'E4'], Dm7: ['D2', 'A2', 'C3', 'F3', 'A3'],
  Bb: ['Bb1', 'F2', 'D3', 'F3', 'Bb3'], Bbmaj7: ['Bb1', 'F2', 'D3', 'A3', 'D4'], Bbs11: ['Bb1', 'F2', 'D3', 'E3', 'A3'],
  Gm: ['G1', 'D2', 'Bb2', 'D3', 'G3'], Gm9: ['G1', 'D2', 'F3', 'Bb3', 'A3'], A: ['A1', 'E2', 'C#3', 'E3', 'A3'], Asus: ['A1', 'E2', 'D3', 'E3', 'A3'],
  Am7: ['A1', 'E2', 'G3', 'C4', 'E4'], Eb: ['Eb2', 'Bb2', 'G3', 'Bb3', 'Eb4'], Ebmaj7: ['Eb2', 'Bb2', 'D3', 'G3', 'Bb3'], Db: ['Db2', 'Ab2', 'F3', 'Ab3', 'C4'],
  G: ['G1', 'D2', 'B2', 'D3', 'G3'], Gsus: ['G1', 'D2', 'C3', 'D3', 'G3'],
  FBig: ['F1', 'C2', 'F2', 'A2', 'C3', 'F3', 'A3', 'C4', 'F4'], BbBig: ['Bb0', 'F1', 'Bb1', 'D2', 'F2', 'Bb2', 'D3', 'F3', 'Bb3'],
};
// the promise: [note, beat, length in beats]; the cold version is the same phrase in F minor
const SB_PM = [['C5', 0, 0.5], ['A4', 0.5, 0.5], ['C5', 1, 0.5], ['D5', 1.5, 1], ['C5', 2.5, 0.5], ['A4', 3, 0.5], ['F4', 3.5, 2.5]];
const SB_PM_COLD = SB_PM.map(([n, b, l]) => [n.replace(/^A/, 'Ab').replace(/^D/, 'Db'), b, l]);
const sbOct = (n, k) => n.replace(/-?\d$/, (d) => String(+d + k));

sbSound('music', 'score', function (ctx, bus, K) {
  const M = sbMusicKit(ctx, K), C = SB_CH, cap = (id, k) => sbCap(id, k).show;
  // the promise from t0: beat b (s); o: notes, oct, vol, pan, upTo (how many notes), rate (1 = in tune), bell
  const promise = (t0, b, o = {}) => {
    const notes = (o.notes || SB_PM).slice(0, o.upTo || 7);
    notes.forEach(([n, at, len], i) => {
      const t = t0 + at * b, v = (o.vol || 0.3) * (i === 3 ? 1.08 : 1) * (o.shape ? o.shape(i) : 1);
      M.piano(t, sbOct(n, o.oct || 0), v, Math.max(0.4, len * b * 1.1), o.pan || 0, 0.5, bus, o.rate ? o.rate * (1 + (o.wow || 0) * Math.sin(i * 2.1)) : 1);
      if (o.bass && (i === 0 || i === 3 || i === 6)) M.piano(t, sbOct(i === 3 ? 'Bb2' : i === 6 ? 'F2' : 'F2', 0), v * 0.55, len * b * 2, -0.1, 0.8);
      if (o.bell) M.bell(t, sbOct(n, 1 + (o.oct || 0)), v * o.bell, 0.2);
    });
  };
  // a piano arpeggio from t0 to t1 over a chord's tones, step s, vol (or vol(t)), octave shift
  const arp = (t0, t1, notes, s, vol, o = {}) => {
    const seq = o.seq || [0, 2, 3, 4, 2, 3], ns = notes.map((n) => sbOct(n, o.oct ?? 1));
    for (let t = t0, i = 0; t < t1 - 0.05; t += s, i++) {
      const v = typeof vol === 'function' ? vol(t) : vol;
      if (v > 0.004) M.piano(t, ns[seq[i % seq.length] % ns.length], v * (i % 4 === 0 ? 1 : 0.72), o.dur || s * 1.6, Math.sin(i * 1.3) * 0.35, o.fade || 0.25);
    }
  };
  // a plucked figure (short piano notes, like pizzicato): pattern of notes, step s, from t0 to t1
  const pluck = (t0, t1, pat, s, vol, o = {}) => {
    for (let t = t0, i = 0; t < t1 - 0.02; t += s, i++) {
      const n = pat[i % pat.length]; if (!n) continue;
      const v = (typeof vol === 'function' ? vol(t) : vol) * (i % (o.acc || 4) === 0 ? 1 : 0.7);
      if (v > 0.004) M.piano(t, n, v, o.dur || 0.12, (i % 2 ? 0.25 : -0.25), 0.07);
    }
  };

  // ---- 1 · the cold open: ten years from now, a crossing in the rain. A low drone, the promise far off in the minor
  {
    const t1 = SB.titleShot;
    M.strings(0, t1 + 0.3, ['D1', 'A1', 'D2'], 0.55, { att: 1.0, rel: 0.4, cut: 320, wave: 'sine', vib: 2 });
    M.strings(0.6, t1 + 0.2, ['E4', 'F4', 'A4'], 0.1, { att: 2.5, rel: 0.4, cut: 1200, wave: 'triangle', vib: 4 });
    promise(cap('open', 0) + 0.4, 0.62, { notes: SB_PM_COLD, oct: 1, vol: 0.07, pan: 0.3, upTo: 6 });
    M.drum(cap('open', 1) - 0.05, 0.35, 41.2, 1.4);                                         // "And you won't stop for her."
    M.bell(SB.coldPass + 0.1, 'Db6', 0.18, -0.2);
    M.rpiano(SB.title[0] + 0.05, 'F3', 0.32, 1.9, 0); M.rpiano(SB.title[0] + 0.05, 'C4', 0.24, 1.9, 0);
  }
  // ---- the title: the promise, whole and warm
  {
    const T0 = SB.title[0] + 0.05;
    M.drum(T0, 0.6, 43.65, 1.4); M.piano(T0, 'F2', 0.36, 4, 0);
    M.strings(T0 - 0.1, SB.flat + 0.8, C.Fadd9, 0.42, { att: 0.8, rel: 1.0, cut: 1500, cutTo: 800 });
    promise(T0 + 0.25, 0.5, { vol: 0.34, bell: 0.5 });
  }
  // ---- 2 · the flat, Saturday night: almost nothing. The draw: a pulse comes in, ball by ball it opens up
  {
    M.strings(SB.flat, SB.draw + 1.0, ['F1', 'C2', 'F2'], 0.3, { att: 1.0, rel: 1.0, cut: 380, wave: 'sine', vib: 1 });
    for (const [t, n, v] of [[SB.flat + 0.5, 'A3', 0.12], [SB.flat + 2.6, 'G3', 0.1], [SB.rent + 0.1, 'D3', 0.14], [SB.rent + 1.6, 'E3', 0.1]]) M.piano(t, n, v, 2.0, 0.2);
    const p0 = SB.draw + 0.2, p1 = cap('balls', 2) - 0.15;
    sbPulse(ctx, M.bus, p0, p1, ['D2', 'A2', 'D3'], 0.25, 0.9, { cut: 260, cutTo: 1500, acc: 4, ramp: (u) => 0.35 + 0.65 * u });
    M.prog([[SB.draw, C.Dm], [cap('draw', 1), C.Bbmaj7], [SB.balls, C.Dm9], [SB.ball[2] - 0.2, C.Bbs11], [SB.ball[4] - 0.2, C.Asus]], p1 + 0.2, 0.28, { cut: 900, rel: 0.25 });
    // each ball: a drum and a bell, each one higher
    SB.ball.slice(0, 5).forEach((t, i) => { M.drum(t, 0.32 + 0.06 * i, 41.2 + 3 * i, 1.2, 0.6); M.bell(t + 0.02, ['D5', 'E5', 'F5', 'G5', 'A5'][i], 0.22 + 0.03 * i, (i % 2 ? 0.3 : -0.3)); });
    // the last one: a hush, a roll, the hit
    M.roll(p1 + 0.25, SB.ball[5] - 0.02, [[p1 + 0.25, 0.05], [SB.ball[5] - 0.05, 0.42]], 55);
    M.strings(p1 + 0.1, SB.ball[5] + 0.05, ['A2', 'E3', 'A3', 'C#4'], 0.32, { att: 1.5, rel: 0.05, cut: 700, cutTo: 2400 });
    M.drum(SB.ball[5], 0.85, 43.65, 1.3); M.bell(SB.ball[5] + 0.02, 'C6', 0.36, 0);
  }
  // ---- the win: held breath, then a billion in F major
  {
    const B = SB.billion;
    M.strings(SB.ball[5], B + 0.3, C.Fadd9, 0.32, { att: 0.3, rel: 0.3, cut: 1200, cutTo: 2600, keys: [[SB.ball[5] + 1.5, 0.6], [B - 0.2, 1.1]] });
    M.roll(B - 2.2, B - 0.03, [[B - 2.2, 0.06], [B - 0.1, 0.5]], 87.3);
    M.drum(B, 1.0, 43.65, 1.2); M.piano(B, 'F1', 0.45, 5, 0); M.piano(B, 'F2', 0.36, 5, 0);
    M.strings(B, SB.scale + 2.5, C.FBig, 0.62, { att: 0.12, rel: 2.4, cut: 3200, cutTo: 1300, cutAt: SB.scale + 1.5 });
    for (let i = 0; i < 8; i++) M.bell(B + 0.08 + i * 0.11, ['F5', 'A5', 'C6', 'F6', 'C6', 'A5', 'C6', 'F6'][i], 0.28 - 0.02 * i, Math.sin(i * 2) * 0.5);
  }
  // ---- the money's size: wonder, a light arpeggio; a thud for ten tonnes
  {
    const t0 = SB.scale + 1.6, t1 = SB.promise + 0.5;
    M.prog([[t0, C.Fmaj7], [cap('scale', 1) - 0.3, C.Dm9], [SB.cashTop, C.Bbmaj7], [cap('scale', 2) - 0.2, C.Csus]], t1, 0.3, { cut: 1300 });
    arp(t0 + 0.5, cap('scale', 2) - 0.3, C.Fmaj7, 0.3, (t) => 0.07 + 0.05 * sbEv(t, SB.cashUp, SB.cashTop) - 0.04 * sbEv(t, SB.cashTop, SB.cashTop + 1.5), { oct: 2 });
    M.drum(cap('scale', 2) + 0.1, 0.7, 36.7, 1.6, 1.2); M.piano(cap('scale', 2) + 0.1, 'C2', 0.3, 3, 0);
  }
  // ---- the promise: you write it, slowly, the phrase under the pen
  {
    M.strings(SB.promise + 0.2, SB.mum + 0.6, C.Fadd9, 0.26, { att: 1.5, rel: 1.0, cut: 900 });
    promise(SB.write - 0.1, 0.62, { vol: 0.3, bass: true });
    M.bell(SB.stick + 0.05, 'F6', 0.2, 0.2);
  }
  // ---- 3 · day one: warmth. Day three: the pulse returns, colder, with every hundred messages
  {
    const t0 = SB.mum + 0.2;
    M.prog([[t0, C.F], [cap('mum', 0) + 1.8, C.CE], [cap('mum', 1), C.Dm7], [cap('mum', 1) + 1.6, C.Bbmaj7], [cap('mum', 2) - 0.1, C.F]], SB.dunn + 0.6, 0.34, { cut: 1700 });
    arp(t0 + 0.6, SB.dunn, C.F, 0.3, (t) => 0.06 + 0.05 * sbEv(t, SB.sendMum, cap('mum', 2)), { oct: 1, seq: [0, 2, 3, 4, 3, 2] });
    M.drum(cap('mum', 2), 0.45, 43.65, 1.6);
    // the giving study: lighter, plucked
    M.prog([[SB.dunn, C.Bbmaj7], [cap('dunn', 1), C.F], [cap('dunn', 2), C.Csus], [cap('dunn', 2) + 2.0, C.C]], SB.out + 0.3, 0.24, { cut: 1300 });
    pluck(SB.dunn + 0.3, SB.out - 0.3, ['F4', 'C5', 'A4', 'C5', 'Bb4', 'C5', 'A4', null], 0.3, 0.07);
    M.bell(cap('dunn', 2) + 0.5, 'C6', 0.2, 0.1);
  }
  {
    const t0 = SB.out + 0.5, t1 = SB.trust + 0.4;
    sbPulse(ctx, M.bus, t0, t1, ['D2', 'A2', 'D3'], 0.25, 0.8, { cut: 300, cutTo: 2000, acc: 4, ramp: (u) => 0.4 + 0.6 * Math.min(1, u * 1.6) });
    M.prog([[SB.out, C.Dm], [cap('out', 1), C.Bb], [cap('out', 2), C.Gm], [cap('out', 3), C.A], [SB.who, C.Dm9], [cap('who', 1), C.Ebmaj7], [cap('who', 2), C.Dm]], t1, 0.3, { cut: 1100, rel: 0.4 });
    for (const [t, n] of [[cap('who', 0) + 0.6, 'A5'], [cap('who', 1) + 0.8, 'Bb5'], [cap('who', 2) + 0.6, 'E5']]) M.piano(t, n, 0.1, 1.8, 0.3);
    // you stop answering: the pulse stops dead; a low cold drone; a dissonance for "your money"
    M.strings(SB.trust + 0.3, SB.interest + 0.8, ['D1', 'A1', 'D2'], 0.4, { att: 0.2, rel: 1.0, cut: 300, wave: 'sine', vib: 1 });
    M.strings(cap('trust', 2) - 0.1, SB.interest + 0.6, ['Db4', 'D4'], 0.08, { att: 1.0, rel: 0.6, cut: 1400, wave: 'triangle', vib: 3 });
    // interest: money making money, a small cold ostinato in the night
    pluck(SB.interest + 0.5, SB.house - 0.2, ['D4', 'A4', 'E5', 'A4'], 0.6, (t) => 0.06 * sbWn(t, SB.interest + 0.8, SB.house - 1.2, 1, 1), { dur: 0.5, acc: 4 });
    M.strings(SB.interest + 0.3, SB.house + 0.4, C.Dm9, 0.2, { att: 2.0, rel: 1.0, cut: 700 });
  }
  // ---- 4 · the house: hollow grandeur. Your old street: everyone keeping up, a busy plucked figure
  {
    M.drum(SB.house + 0.05, 0.5, 34.6, 1.8, 1.4);
    M.prog([[SB.house, C.Bbmaj7], [cap('house', 1), C.FA], [cap('house', 2) - 0.2, C.Gm9]], SB.neighbours + 0.4, 0.36, { cut: 1600, att: 1.0 });
    for (const [t, n] of [[SB.house + 0.8, 'D6'], [SB.house + 3.0, 'A5'], [cap('house', 1) + 0.6, 'F5'], [cap('house', 1) + 2.4, 'E5']]) M.piano(t, n, 0.1, 3.0, Math.sin(t) * 0.5, 1.0);
    sbPulse(ctx, M.bus, SB.buyCar - 0.2, SB.neighbours + 0.2, ['G1', 'D2'], 0.25, 0.6, { cut: 200, cutTo: 700, acc: 4 });
    const t0 = SB.neighbours + 0.3, t1 = SB.six + 0.3;
    M.prog([[t0, C.Dm], [cap('neighbours', 1), C.Bb], [cap('neighbours', 2), C.Gm], [cap('neighbours', 3), C.A]], t1, 0.24, { cut: 1100 });
    pluck(t0 + 0.4, t1 - 0.3, ['D4', 'F4', 'A4', 'F4', 'E4', 'G4', 'A4', 'G4'], 0.3, (t) => 0.05 + 0.04 * sbEv(t, cap('neighbours', 1), cap('neighbours', 3)), { acc: 4 });
    M.drum(cap('neighbours', 2) + 1.6, 0.4, 41.2, 1.4);                                   // "2.4%"
  }
  // ---- month six: breakfast that doesn't taste of anything (the promise's first two notes, falling, alone)
  {
    M.strings(SB.six + 0.2, SB.brick + 0.8, C.Dm9, 0.22, { att: 1.6, rel: 1.0, cut: 900 });
    for (const [t, n, v] of [[cap('six', 0) + 1.0, 'C5', 0.13], [cap('six', 0) + 1.6, 'A4', 0.11], [cap('six', 1) + 0.5, 'G4', 0.11], [cap('six', 1) + 1.4, 'F4', 0.09]]) M.piano(t, n, v, 2.0, 0.15);
    M.prog([[SB.brick + 0.4, C.Dm], [cap('brick', 1), C.Bbmaj7], [cap('brick', 2), C.Gm9], [SB.sweden, C.F], [cap('brick', 4), C.Csus]], SB.enough + 0.4, 0.22, { cut: 1000, att: 1.2 });
    for (const [t, n] of [[cap('brick', 0) + 1.0, 'D5'], [cap('brick', 2) + 1.4, 'Bb4'], [SB.sweden + 1.0, 'A5'], [cap('brick', 4) + 1.2, 'G5']]) M.piano(t, n, 0.09, 2.4, -0.2);
  }
  // ---- "so you want more": the pulse back, the chords climbing; then a question of rank, two notes rocking
  {
    const t0 = SB.enough + 0.3, t1 = SB.compare + 0.3;
    sbPulse(ctx, M.bus, t0, t1, ['D2', 'D3'], 0.25, 0.75, { cut: 350, cutTo: 1700, acc: 4, ramp: (u) => 0.5 + 0.5 * u });
    M.prog([[t0, C.Dm], [cap('enough', 1), C.Eb], [cap('enough', 1) + 2.4, C.F], [cap('enough', 2), C.G], [cap('enough', 2) + 2.2, C.A]], t1, 0.3, { cut: 1300 });
    M.prog([[SB.compare + 0.2, C.Gm], [cap('compare', 1), C.Dm], [cap('compare', 2), C.Bbs11]], SB.boss + 0.5, 0.24, { cut: 900 });
    pluck(SB.compare + 0.4, SB.boss - 0.4, ['G4', 'D5', 'A4', 'D5'], 0.6, 0.06, { dur: 0.45 });
  }
  // ---- 5 · power: a cold corporate pulse; then the studies, a sly plucked figure that grows with each one
  {
    sbPulse(ctx, M.bus, SB.boss + 0.2, SB.cookies + 0.2, ['D2', 'A2', 'D3', 'F3'], 0.25, 0.75, { cut: 500, cutTo: 900, acc: 4 });
    M.strings(SB.boss, SB.cookies + 0.4, ['D2', 'A2', 'D3', 'A3'], 0.36, { att: 0.4, rel: 0.4, cut: 800, wave: 'square', vib: 2 });
    M.drum(cap('boss', 1), 0.55, 36.7, 1.3);                                             // "nobody tells you no"
    const studies = [[SB.cookies, SB.game], [SB.game, SB.candy], [SB.candy, SB.views]];
    studies.forEach(([a, b], k) => {
      M.drum(a + 0.1, 0.45 + 0.1 * k, 41.2, 1.3);
      pluck(a + 0.4, b - 0.2, ['D4', 'A3', 'F4', 'A3', 'E4', 'A3', 'C#4', 'A3'], 0.3, (t) => 0.055 + 0.02 * k + 0.03 * sbEv(t, a + 4, b - 2), { acc: 4 });
      M.prog([[a, C.Dm], [a + (b - a) * 0.5, C.Gm], [a + (b - a) * 0.8, C.A]], b + 0.3, 0.18 + 0.04 * k, { cut: 900 });
    });
    pluck(SB.game2 + 0.3, SB.candy - 0.3, ['D2', null, 'A2', null], 0.3, 0.12, { dur: 0.2 });   // (the rich player gets louder)
    M.drum(SB.winGame + 0.2, 0.5, 36.7, 1.4);
    // views: the pulse thins to a drone; the TV's on
    M.strings(SB.views, SB.yacht + 0.4, ['D2', 'A2', 'E3'], 0.22, { att: 0.8, rel: 0.5, cut: 600 });
  }
  // ---- 6 · year two: the yacht (a big chord); the next one (bigger, an octave up); the wall (a low thud, then nothing)
  {
    M.strings(SB.yacht, SB.bigYacht + 0.3, C.Bbmaj7, 0.34, { att: 0.6, rel: 0.3, cut: 1500 });
    M.drum(SB.yacht + 0.1, 0.45, 34.6, 1.5);
    M.strings(SB.bigYacht, SB.wall + 0.5, C.BbBig, 0.5, { att: 0.25, rel: 0.6, cut: 2600, cutTo: 1200 });
    M.drum(SB.bigYacht + 0.25, 0.7, 29.1, 1.6, 1.3);
    M.strings(SB.wall, SB.walk + 0.6, ['D1', 'A1', 'D2', 'Eb3'], 0.36, { att: 0.5, rel: 0.6, cut: 500, wave: 'sine', vib: 1 });
    M.drum(SB.gateShut + 0.4, 0.75, 36.7, 1.2, 0.8);
  }
  // ---- 7 · year three: a cold, steady pulse downtown and in the car; it drops to one note for "Not them."
  {
    const t0 = SB.walk + 0.3, t1 = SB.nostop + 0.4;
    sbPulse(ctx, M.bus, t0, cap('glass2', 1) - 0.1, ['D2', 'A2', 'D3'], 0.25, 0.75, { cut: 400, cutTo: 1300, acc: 4 });
    M.prog([[SB.walk, C.Dm9], [SB.glass, C.Bbs11], [cap('glass', 1), C.Gm9], [SB.glass2, C.Dm]], cap('glass2', 1) + 0.2, 0.26, { cut: 1100 });
    M.piano(cap('glass2', 1), 'D3', 0.2, 2.5, 0); M.piano(cap('glass2', 1), 'D2', 0.16, 2.5, 0);
    sbPulse(ctx, M.bus, SB.drive + 0.2, t1, ['D2', 'A2', 'D3', 'E3'], 0.25, 0.85, { cut: 350, cutTo: 2200, acc: 4, ramp: (u) => 0.45 + 0.55 * u });
    M.prog([[SB.drive, C.Dm], [cap('drive', 1), C.Bb], [cap('drive', 2), C.Gm], [cap('drive', 3), C.Asus], [cap('drive', 3) + 1.7, C.A]], t1, 0.3, { cut: 1300 });
    M.roll(cap('drive', 3) + 0.5, SB.nostop + 0.35, [[cap('drive', 3) + 0.5, 0.05], [SB.nostop + 0.3, 0.3]], 55);
    // you don't stop: everything stops. One low note, one cold one
    M.drum(SB.dayPass, 0.6, 36.7, 1.4, 1.2); M.piano(SB.dayPass, 'D1', 0.3, 4, 0);
    M.strings(SB.dayPass + 0.2, SB.years + 0.4, ['D4', 'Eb4'], 0.07, { att: 1.5, rel: 0.6, cut: 1500, wave: 'triangle', vib: 3 });
  }
  // ---- 8 · the years race past; the note (the promise, faded, one note short); the Giving Pledge (serious strings)
  {
    const t0 = SB.years + 0.2, t1 = SB.note - 0.25;
    sbPulse(ctx, M.bus, t0, t1, ['D2', 'A2', 'D3', 'A3'], 0.25, 0.9, { cut: 400, cutTo: 2600, acc: 4, ramp: (u) => 0.5 + 0.5 * u, stepAt: (t) => 0.25 - 0.1 * sbEv(t, t0, t1) });
    M.prog([[t0, C.Dm], [cap('years', 1), C.Bb], [cap('years', 1) + 1.7, C.C], [cap('years', 2), C.Dm], [cap('years', 2) + 1.7, C.Eb]], t1, 0.34, { cut: 1800, rel: 0.1 });
    M.drum(cap('years', 1) + 0.9, 0.4, 41.2, 1.3); M.drum(sbW('years', '5').start + 0.2, 0.4, 43.65, 1.3);
    // the note: silence, then the phrase alone, out of tune, stopping one note short of home
    promise(SB.note + 1.0, 0.72, { vol: 0.26, rate: 0.993, wow: 0.004, upTo: 6 });
    M.strings(cap('note', 1) - 0.2, SB.pledge + 0.8, C.Dm9, 0.22, { att: 1.5, rel: 1.0, cut: 800 });
    const p0 = SB.pledge + 0.2, p1 = SB.real + 0.4;
    M.prog([[p0, C.Dm], [cap('pledge', 1), C.Bb], [cap('pledge', 2), C.Gm], [cap('pledge', 3), C.Eb], [cap('pledge', 4), C.Asus], [cap('pledge', 4) + 2.0, C.A]], p1, 0.3, { cut: 1100, att: 1.0 });
    sbPulse(ctx, M.bus, cap('pledge', 1), p1 - 0.3, ['D2', 'A2'], 0.5, 0.5, { cut: 250, cutTo: 600, acc: 2 });
    for (const k of [1, 2, 3, 4]) M.drum(cap('pledge', k) + 0.05, 0.35 + 0.06 * k, 41.2, 1.4);
  }
  // ---- 9 · is any of this real: light. The letters, the video: hopeful plucks. Chuck Feeney: plain piano
  {
    M.prog([[SB.real + 0.3, C.Fadd9], [cap('real', 1), C.Csus], [cap('real', 2), C.Dm7]], SB.letters + 0.4, 0.22, { cut: 1100 });
    const t0 = SB.letters + 0.2, t1 = SB.video + 0.3;
    M.prog([[t0, C.F], [cap('letters', 1), C.CE], [cap('letters', 2), C.Dm7], [cap('letters', 3), C.Bbmaj7]], t1, 0.26, { cut: 1500 });
    pluck(t0 + 0.4, t1 - 0.3, ['F4', 'C5', 'A4', 'C5', 'G4', 'C5', 'A4', 'F5'], 0.3, 0.06, { acc: 4 });
    M.prog([[SB.video + 0.2, C.Fmaj7], [cap('video', 1), C.Bbmaj7], [cap('video', 1) + 2.0, C.Csus]], SB.feeney + 0.5, 0.3, { cut: 1600 });
    arp(cap('video', 1), SB.feeney - 0.2, C.Fmaj7, 0.3, 0.07, { oct: 1 });
    // Feeney: the promise's shape, low and plain, under his story
    M.strings(SB.feeney + 0.2, SB.point + 0.6, C.FA, 0.2, { att: 1.5, rel: 1.0, cut: 900 });
    for (const [t, n, v] of [[cap('feeney', 0) + 0.4, 'C4', 0.16], [cap('feeney', 0) + 1.0, 'A3', 0.13], [cap('feeney', 1) + 0.3, 'C4', 0.14], [cap('feeney', 1) + 0.9, 'D4', 0.16],
      [cap('feeney', 2) + 0.6, 'C4', 0.13], [cap('feeney', 2) + 1.2, 'A3', 0.12], [cap('feeney', 2) + 2.4, 'F3', 0.15]]) M.piano(t, n, v, 2.0, -0.1);
  }
  // ---- 10 · the crossing again: strings gathering; you stop; she crosses; the promise, to its last note
  {
    const t0 = SB.point + 0.3;
    M.prog([[t0, C.Dm], [cap('point', 0) + 1.6, C.Bb], [cap('point', 1), C.Gm9], [cap('point', 1) + 1.6, C.Csus]], SB.again + 0.5, 0.3, { cut: 1000, att: 1.0 });
    M.strings(SB.again + 0.2, SB.herCross + 0.4, ['F1', 'C2', 'F2'], 0.36, { att: 1.0, rel: 0.5, cut: 400, wave: 'sine', vib: 1 });
    M.strings(SB.brakeAt + 0.4, SB.herLook + 0.2, C.Fadd9, 0.2, { att: 1.5, rel: 0.4, cut: 900 });
    promise(SB.herCross - 0.2, 0.55, { vol: 0.32, bass: true });
    M.strings(SB.herLook - 0.1, SB.end + 1.4, C.F, 0.4, { att: 1.2, rel: 3.0, cut: 1800, cutTo: 900, cutAt: SB.end });
    M.bell(SB.herLook + 0.05, 'F6', 0.22, 0.2); M.bell(SB.herLook + 0.35, 'C6', 0.16, -0.2);
    // the question: one note, and the chord letting go
    M.piano(cap('question', 0), 'F2', 0.24, 5, 0); M.piano(cap('question', 0), 'A4', 0.14, 5, 0.2); M.piano(cap('question', 0) + 0.5, 'C5', 0.12, 5, -0.2);
  }
});
