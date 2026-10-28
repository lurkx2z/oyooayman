/* =====================================================================
   SOUND · MUSIC — an original score in E minor, all synthesised (the music kit of the Slower sound film, renamed hv*):
   string pads, a felt piano (also played backwards), bells, a low drum, a filtered synth pulse. This film's own ideas:
     the theme        E–B–A–F♯, then the E an octave up: whole over the title and the question; CUT (its last note
                      stopped dead) wherever something is cut in half
     10:00:00         the score's upper half stops dead with the sky; only the low half plays on
     the countdown    from "It reaches you at 10:03:42" a pulse counts down to the shock: a heartbeat at first, a synth
                      pulse over Europe, sparse under the quiet minutes, then quicker and quicker; twelve last seconds
     the shock        one blow, then nothing: black, silence
     after            grave and slow from space; the theme played slowly for the Moon leaving; warm for the real part
   ===================================================================== */

// the kit: string pads (three detuned oscillators per note through low-passes), felt piano (also reversed), bells,
// a low drum and a heartbeat
function hvMusicKit(ctx, K) {
  if (K._music) return K._music;
  const fx = K.fx, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(); bus.connect(K.bus);
  const hall = fx.ir(4.2, { bright: 0.5, damp: 2.8, shape: 2.0, pre: 0.025, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.55;
  bus.connect(hall); hall.connect(wet); wet.connect(K.bus);
  const drumModes = (f) => [[f, 0.7, 1], [f * 1.51, 0.45, 0.5], [f * 1.99, 0.3, 0.35], [f * 2.44, 0.2, 0.2], [f * 3.1, 0.12, 0.12]];
  const M = {
    bus,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4, dest = bus) => {
      const b = fx.pianoBuf(hvMidi(n)), len = Math.min(b.length, Math.ceil((dur + fade + 0.05) * fx.sr));
      return fx.play(b.subarray(0, len), t, dest, { vol: vel * 0.34, pan, stop: t + dur + fade, fade });
    },
    // a piano note played backwards: it swells up out of nothing and stops dead on its attack at tEnd
    rpiano(tEnd, n, vel, dur = 1.6, pan = 0) {
      const key = 'rp' + n + '_' + dur;
      if (!fx.cache[key]) {
        const b = fx.pianoBuf(hvMidi(n)), L = Math.min(b.length, Math.ceil(dur * fx.sr)), y = new Float32Array(L + Math.ceil(0.01 * fx.sr));
        for (let i = 0; i < L; i++) { const u = i / L; y[L - 1 - i] = b[i] * Math.min(1, (1 - u) / 0.35); }
        for (let i = 0; i < 0.01 * fx.sr; i++) y[L + i] = y[L - 1] * (1 - i / (0.01 * fx.sr));
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], tEnd - dur, bus, { vol: vel * 0.34, pan });
    },
    bell: (t, n, vol, pan = 0, dest = bus) => fx.play(fx.bellBuf(hvMidi(n)), t, dest, { vol: vol * 0.25, pan }),
    // a bell cut short (something going over the edge: its sound stops, the hall keeps a little of it)
    bellCut: (t, n, vol, d = 0.18, pan = 0) => fx.play(fx.bellBuf(hvMidi(n)), t, bus, { vol: vol * 0.25, pan, stop: t + d, fade: 0.05 }),
    // a low drum (a timpani-like membrane): f the pitch, vol, soft = a wider mallet, dk = decay
    drum(t, vol, f = 36.7, soft = 1, dk = 1) {
      const key = 'drum' + f + '_' + soft + '_' + dk;
      if (!fx.cache[key]) {
        const y = fx.hit(drumModes(f).map(([a, tau, b]) => [a, tau * dk, b]), { width: 0.006 * soft, amp: 1, noise: 0.25, nlen: 0.02, nhp: 300, len: 3.2 * Math.max(dk, 0.3) });
        const pk = HVX.peak(y) || 1; for (let i = 0; i < y.length; i++) y[i] /= pk;
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
    // o.glide (cents, by o.glideAt: the chord slides), o.pan
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
        if (o.cutTo) lp.frequency.linearRampToValueAtTime(o.cutTo, o.cutAt || (t1 - rel * 0.5));
        const pn = ctx.createStereoPanner(); pn.pan.value = Math.max(-1, Math.min(1, p + (o.pan || 0))); lp.connect(pn); pn.connect(g); return lp;
      });
      for (const nn of notes) {
        const f = hvHz(nn);
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
// o.ramp(u) the level over the span, o.wave, o.glide (cents over the span: the pulse slides)
function hvPulse(ctx, dest, t0, t1, notes, step, vol, o = {}) {
  if (t1 - t0 < step) return;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.q || 4;
  lp.frequency.setValueAtTime(o.cut || 600, t0); lp.frequency.linearRampToValueAtTime(o.cutTo || o.cut || 600, t1);
  lp.connect(g); g.connect(dest); g.gain.value = 0;
  notes.forEach((n, k) => {
    const os = ctx.createOscillator(); os.type = o.wave || 'sawtooth'; os.frequency.value = hvHz(n); os.detune.setValueAtTime(k % 2 ? 6 : -6, t0);
    if (o.glide) os.detune.linearRampToValueAtTime((k % 2 ? 6 : -6) + o.glide, t1);
    os.connect(lp); os.start(t0); os.stop(t1 + 0.1);
  });
  for (let t = t0, i = 0; t < t1 - 0.01; t += (o.stepAt ? o.stepAt(t) : step), i++) {
    const acc = o.acc && i % o.acc === 0 ? 1.0 : 0.62, ramp = o.ramp ? o.ramp((t - t0) / (t1 - t0)) : 1, v = vol * 0.05 * acc * ramp, st = o.stepAt ? o.stepAt(t) : step;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.setTargetAtTime(0, t + 0.012, st * (o.decay || 0.28));
  }
}

const HV_CH = {
  Em9: ['E2', 'B2', 'G3', 'D4', 'F#4'], Em: ['E2', 'B2', 'E3', 'G3', 'B3'], E: ['E2', 'B2', 'E3', 'G#3', 'B3'], Emaj9: ['E2', 'B2', 'G#3', 'D#4', 'F#4'],
  Elyd: ['E2', 'B2', 'G#3', 'D#4', 'A#4'], Cmaj7: ['C2', 'G2', 'E3', 'B3', 'E4'], Clyd: ['C2', 'G2', 'E3', 'B3', 'F#4'], G: ['G1', 'D2', 'B2', 'D3', 'G3'],
  D: ['D2', 'A2', 'F#3', 'A3', 'D4'], Dsus: ['D2', 'A2', 'E3', 'G3', 'A3'], Asus: ['A1', 'E2', 'D3', 'E3', 'A3'], Amaj9: ['A1', 'E2', 'C#3', 'G#3', 'B3'],
  Am9: ['A1', 'E2', 'C3', 'G3', 'B3'], Bsus: ['B1', 'F#2', 'E3', 'F#3', 'B3'], B: ['B1', 'F#2', 'D#3', 'F#3', 'B3'], Csm7: ['C#2', 'G#2', 'E3', 'B3', 'E4'],
  Ebig: ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4', 'G#4', 'B4'], Embig: ['E2', 'B2', 'E3', 'G3', 'B3', 'E4', 'G4', 'B4'],
};
const HV_THEME = ['E5', 'B5', 'A5', 'F#5'], HV_THEME_END = 'E6', HV_THEME_BACK = ['F#5', 'A5', 'B5', 'E5'];
const hvOct = (n, k) => n.replace(/-?\d$/, (d) => String(+d + k));

hvSound('music', 'score', function (ctx, bus, K) {
  const M = hvMusicKit(ctx, K), C = HV_CH, cap = (id, k) => hvCap(id, k).show, T0 = HV.t0;
  // the theme (bells, or the piano); o.cut: its last note stopped dead after o.cut seconds
  const theme = (t, dts, vol, o = {}) => {
    let tt = t; const ns = o.notes || HV_THEME;
    ns.forEach((n, i) => {
      const nn = hvOct(n, o.oct || 0), pan = (o.pan || 0) + (i % 2 ? 0.22 : -0.22), last = i === ns.length - 1;
      if (last && o.cut) { if (o.piano) M.piano(tt, nn, vol * 0.9, o.cut, pan, 0.02); else M.bellCut(tt, nn, vol * 0.9, o.cut, pan); }
      else if (o.piano) M.piano(tt, nn, vol * (i ? 0.88 : 1), o.dur || 2.4, pan); else M.bell(tt, nn, vol * (i ? 0.88 : 1), pan);
      tt += Array.isArray(dts) ? dts[Math.min(i, dts.length - 1)] : dts;
    });
    return tt;
  };
  const keys = (t0, t1, dt, ns, vel, o = {}) => { for (let t = t0, i = 0; t < t1 - 0.3; i++, t += dt) M.piano(t, ns[i % ns.length], vel, Math.min(o.dur || 2.4, (o.stop || 1e9) - t), Math.sin(i * 1.3) * 0.4, o.stop && t + 2.4 > o.stop ? 0.04 : 0.4); };
  // a heartbeat every `every` s (o.every(t) to change it), from t0 to t1
  const heart = (t0, t1, every, vol) => { for (let t = t0; t < t1 - 0.2; t += typeof every === 'function' ? every(t) : every) M.beat(t, typeof vol === 'function' ? vol(t) : vol); };

  // ---- 1 · the cold open (10:03:32): a low drone, a held breath, a pulse quickening into the shock; then the title
  M.strings(0, HV.openHit + 0.02, ['E1', 'B1'], 0.42, { att: 2.0, rel: 0.02, cut: 260, wave: 'sine', vib: 1 });
  M.strings(0.6, HV.openHit + 0.02, ['B3', 'E4', 'F#4'], 0.2, { att: 2.5, rel: 0.02, cut: 1200, vib: 4 });
  hvPulse(ctx, M.bus, 2.2, HV.openHit - 0.02, ['E2', 'B2'], 0.5, 0.22, { cut: 500, cutTo: 2000, acc: 2, decay: 0.3, stepAt: (t) => 0.5 - 0.25 * MathX.clamp((t - 2.2) / 7, 0, 1), ramp: (u) => 0.35 + 0.65 * u });
  M.drum(HV.openHit, 0.9, 36.7, 1.2, 1.3); M.piano(HV.openHit, 'E1', 0.5, 0.45, 0, 0.1);
  // the title: the theme, its last note cut dead
  const TT = HV.title[0];
  M.piano(TT, 'E2', 0.38, 3.2); M.strings(TT - 0.1, HV.before + 0.9, C.Em9, 0.36, { att: 0.6, rel: 1.4, cut: 1500 });
  theme(TT + 0.15, [0.36, 0.36, 0.42], 0.42, { cut: 0.16 });

  // ---- 2 · four minutes earlier: a hush; the rule: a pulse counting down; the last seconds swell into 10:00:00
  M.strings(HV.before + 0.4, HV.rule + 0.4, C.Em9, 0.28, { att: 2.0, rel: 0.6, cut: 800 });
  keys(HV.before + 1.4, HV.rule, 2.6, ['B4', 'G4', 'D5', 'F#4'], 0.1);
  M.prog([[HV.rule, C.Cmaj7], [cap('rule', 1), C.Asus], [cap('rule', 2), C.Bsus]], HV.count + 0.3, 0.3, { cut: 1000 });
  hvPulse(ctx, M.bus, HV.rule + 0.5, T0 - 0.02, ['E2', 'B2'], 0.5, 0.24, { cut: 500, cutTo: 1700, acc: 2, decay: 0.3, stepAt: (t) => (t < HV.count ? 0.5 : 0.25), ramp: (u) => 0.4 + 0.6 * u });
  // 10:00:00: the upper half of the chord stops dead with the sky; the lower half plays on
  M.strings(HV.count - 0.2, T0 + 0.01, ['E4', 'G4', 'B4', 'F#5'], 0.34, { att: 0.6, rel: 0.01, cut: 1200, cutTo: 4200, cutAt: T0 });
  M.strings(HV.count - 0.2, HV.moon + 0.6, ['E1', 'E2', 'B2'], 0.38, { att: 0.6, rel: 1.2, cut: 400, keys: [[T0 - 0.1, 1], [T0 + 0.4, 0.75], [HV.moon - 1, 0.6]] });
  M.rpiano(T0, 'E3', 0.36, 2.2); M.rpiano(T0, 'B3', 0.28, 2.2); M.rpiano(T0, 'E4', 0.22, 2.2);
  M.strings(HV.line + 0.6, HV.moon + 0.4, ['B5'], 0.05, { att: 2.0, rel: 1.2, cut: 6000, wave: 'sine', vib: 3 });
  M.bell(cap('line', 1) + 0.4, 'E6', 0.22, -0.3);

  // ---- 3 · the Moon, slowed down: deep and slow; as its far half goes, a slide down; then the half-chord
  M.strings(HV.moon, HV.moonEnd + 0.3, ['E1', 'B1', 'G2'], 0.36, { att: 1.0, rel: 0.6, cut: 320, glide: -300, glideFrom: hvStory(0.0) + 0.1, glideAt: HV.moonEnd, wave: 'triangle', vib: 0 });
  { const wipe = HV.replay.t0 + (0.672 - HV.replay.s0) * HV.replay.slow, wEnd = HV.replay.t0 + (1.202 - HV.replay.s0) * HV.replay.slow;
    M.strings(wipe - 0.5, wEnd, ['B4', 'E5'], 0.06, { att: 0.5, rel: 0.6, cut: 5000, wave: 'sine', vib: 2, glide: -700, glideFrom: wipe, glideAt: wEnd });
    M.bellCut(wEnd + 0.05, 'E6', 0.3, 0.14, 0.3); }
  // nothing: a breath; the pad barely there
  M.strings(HV.nothing, HV.why + 0.4, ['E2', 'B2', 'G3'], 0.18, { att: 1.5, rel: 1.0, cut: 600 });
  M.piano(cap('nothing', 1) + 1.4, 'B4', 0.08, 3);
  // why: a gentle pulse, everything falling together
  M.prog([[HV.why, C.Cmaj7], [cap('why', 1), C.G]], HV.gone + 0.3, 0.26, { cut: 1100 });
  hvPulse(ctx, M.bus, HV.why + 0.5, HV.gone - 0.2, ['G2', 'D3'], 0.42, 0.16, { cut: 600, cutTo: 900, acc: 4, decay: 0.22 });

  // ---- 4 · from space: what's left of the Earth (wide, grave); the face (heat: the chord with something wrong in it)
  M.drum(HV.gone, 0.5, 41.2, 1.6); M.piano(HV.gone, 'E1', 0.38, 4);
  M.prog([[HV.gone, C.Em9], [cap('gone', 1), C.Cmaj7], [cap('gone', 2), C.Am9]], HV.face + 0.3, 0.34, { cut: 1300 });
  M.bell(cap('gone', 2) + 0.4, 'E6', 0.26, 0.3); M.bellCut(cap('gone', 2) + 0.82, 'B5', 0.22, 0.12, 0.3);
  M.strings(HV.face, HV.blow + 0.3, ['E1', 'B1', 'F2', 'C3', 'E3'], 0.32, { att: 1.2, rel: 0.6, cut: 500, cutTo: 1400, cutAt: HV.blow });
  M.strings(cap('face', 1) - 0.4, HV.blow, ['F5', 'E6'], 0.035, { att: 1.5, rel: 0.8, cut: 8000, wave: 'sine', vib: 5 });
  M.roll(HV.blow - 2.2, HV.blow - 0.05, [[HV.blow - 2.2, 0.08], [HV.blow - 0.1, 0.42]], 61.7);
  M.drum(HV.blow, 0.7, 36.7, 1.2); M.strings(HV.blow, HV.shock + 0.3, ['E1', 'B1', 'E2', 'F2'], 0.4, { att: 0.15, rel: 0.6, cut: 700, cutTo: 2200, cutAt: HV.shock });
  // the shock: the countdown starts here (a heartbeat under the cross-section)
  M.prog([[HV.shock, C.Em], [cap('shock', 2), C.Bsus]], HV.calls + 0.4, 0.28, { cut: 900 });
  heart(cap('shock', 1), HV.calls + 0.4, 1.25, 0.32);
  M.bell(cap('shock', 2) + 1.2, 'B5', 0.2, -0.2);

  // ---- 5 · the countdown (10:01:25 → 10:03:42.5): heartbeat, pulse, quiet, quicker
  // the phone, next door's TV: sparse, the heartbeat going on under them
  M.strings(HV.calls, HV.front + 0.3, ['E2', 'B2', 'D3', 'G3'], 0.22, { att: 1.5, rel: 0.8, cut: 700 });
  heart(HV.calls + 0.4, HV.front, 1.2, (t) => 0.22 + 0.04 * Math.sin(t));
  keys(HV.calls + 2.0, HV.front - 0.5, 3.0, ['B4', 'F#4', 'D5', 'E4'], 0.075);
  // Europe from space: the ring racing north (the replay: a quick roll; then a synth pulse)
  M.roll(HV.front + 0.3, HV.front + 5.0, [[HV.front + 0.3, 0.12], [HV.front + 4.9, 0.3]], 73.4);
  M.prog([[HV.front, C.Em9], [cap('front', 1), C.Cmaj7], [cap('front', 2), C.Bsus], [HV.edge, C.Em], [cap('edge', 2), C.Cmaj7]], HV.moonedge + 0.3, 0.3, { cut: 1300 });
  hvPulse(ctx, M.bus, HV.front + 5.0, HV.moonedge - 0.1, ['E2', 'B2', 'E3'], 0.42, 0.22, { cut: 600, cutTo: 1500, acc: 4, decay: 0.26, ramp: (u) => 0.5 + 0.5 * u });
  // the Moon's glowing edge; who gets it when; the compass: quieter, the heartbeat underneath
  M.strings(HV.moonedge, HV.others + 0.3, C.Amaj9, 0.24, { att: 1.0, rel: 0.6, cut: 1200 });
  M.bell(cap('moonedge', 0) + 0.6, 'E6', 0.22, 0.3); M.bellCut(cap('moonedge', 1) + 0.5, 'B5', 0.2, 0.14, -0.3);
  M.prog([[HV.others, C.Em9], [cap('others', 1), C.D], [HV.compass, C.Cmaj7], [HV.nowhere, C.Em], [HV.saturn, C.Am9], [HV.cat2, C.Cmaj7]], HV.lighter + 0.3, 0.24, { cut: 1000 });
  heart(HV.moonedge + 0.5, HV.lighter, (t) => 1.15 - 0.15 * MathX.clamp((t - HV.moonedge) / (HV.lighter - HV.moonedge), 0, 1), (t) => 0.2 + 0.08 * MathX.clamp((t - HV.moonedge) / 40, 0, 1));
  keys(HV.others + 0.6, HV.nowhere - 0.4, 2.0, ['E5', 'B4', 'D5', 'A4'], 0.07);
  M.strings(HV.nowhere + 0.4, HV.cat2 + 0.2, ['F#6'], 0.03, { att: 2.0, rel: 1.0, cut: 9000, wave: 'sine', vib: 4 });   // into the void
  M.bellCut(HV.saturn + 0.9, 'E6', 0.22, 0.14, 0.3); M.bellCut(cap('saturn', 1) + 0.7, 'B5', 0.16, 0.12, -0.3);   // (where Saturn was: a bell, cut off)
  M.piano(HV.cat2 + 1.2, 'G4', 0.08, 3); M.piano(HV.cat2 + 3.6, 'D5', 0.07, 3);
  // 10:03, lighter: the pulse comes back, tighter; then Paris
  M.strings(HV.lighter, HV.count2 + 0.3, ['E1', 'B1', 'E2'], 0.34, { att: 2.0, rel: 0.4, cut: 300, cutTo: 700, cutAt: HV.count2 });
  M.prog([[HV.lighter, C.Em9], [cap('lighter', 1), C.Cmaj7], [HV.bath, C.Am9], [HV.paris, C.Bsus]], HV.count2 + 0.3, 0.28, { cut: 900, cutTo: 1800 });
  hvPulse(ctx, M.bus, HV.lighter + 0.3, HV.count2 - 0.05, ['E2', 'B2'], 0.4, 0.24, { cut: 500, cutTo: 1800, acc: 2, decay: 0.28, stepAt: (t) => 0.4 - 0.12 * MathX.clamp((t - HV.lighter) / (HV.count2 - HV.lighter), 0, 1), ramp: (u) => 0.45 + 0.55 * u });
  M.drum(HV.paris + 0.5, 0.45, 41.2, 1.4);
  // twelve seconds: a heartbeat quickening, the strings rising and opening, a roll into the shock
  heart(HV.count2 + 0.3, HV.hit - 0.1, (t) => 0.95 - 0.5 * MathX.clamp((t - HV.count2) / (HV.hit - HV.count2), 0, 1), (t) => 0.3 + 0.25 * MathX.clamp((t - HV.count2) / (HV.hit - HV.count2), 0, 1));
  M.strings(HV.count2, HV.hit + 0.01, ['B1', 'F#2', 'E3', 'F#3', 'B3', 'C4'], 0.34, { att: 3.0, rel: 0.01, cut: 600, cutTo: 4200, cutAt: HV.hit, keys: [[HV.count2 + 4, 0.6], [HV.hit - 0.2, 1.4]] });
  M.roll(HV.hit - 3.2, HV.hit - 0.04, [[HV.hit - 3.2, 0.08], [HV.hit - 0.1, 0.55]], 61.7);
  HV.countCuts.forEach((c, i) => M.drum(c, 0.16 + 0.05 * i, 49.0, 0.7));                 // (each quick cut lands on a low hit)
  // ---- the shock (10:03:42.5): one blow; then nothing
  M.drum(HV.hit, 1.0, 30.9, 1.0, 1.6); M.piano(HV.hit, 'E1', 0.55, 0.9, 0, 0.3); M.piano(HV.hit, 'B0', 0.4, 0.9, 0, 0.3);

  // ---- 6 · after, from space: grave and slow; the Moon leaving (the theme, slowly, low); half the sky, forever
  M.strings(HV.fall - 0.6, HV.moonaway + 0.4, ['E1', 'B1', 'E2', 'G2'], 0.34, { att: 2.5, rel: 1.0, cut: 380, cutTo: 900, cutAt: cap('fall', 2) });
  M.prog([[HV.fall + 0.6, C.Em9], [cap('fall', 1), C.Cmaj7], [cap('fall', 2), C.Am9]], HV.moonaway + 0.4, 0.26, { cut: 1100 });
  M.drum(cap('fall', 0), 0.4, 36.7, 1.8, 1.4);
  M.prog([[HV.moonaway, C.Cmaj7], [cap('moonaway', 1), C.G], [cap('moonaway', 2), C.Em9]], HV.orbit + 0.6, 0.28, { cut: 1300 });
  // the new Earth still going round the Sun: a little warmth (open chords, the keys)
  M.prog([[HV.orbit, C.Cmaj7], [cap('orbit', 1), C.G]], HV.forever + 0.6, 0.26, { cut: 1500 });
  keys(HV.orbit + 0.9, HV.forever - 0.4, 2.2, ['E5', 'G5', 'B4', 'D5'], 0.06);
  theme(cap('moonaway', 2) - 0.2, [1.0, 1.0, 1.3], 0.2, { piano: true, oct: -1, dur: 3.0 });
  M.strings(HV.forever, HV.real + 0.5, ['E2', 'B2'], 0.24, { att: 2.0, rel: 1.5, cut: 300, wave: 'sine', vib: 1 });
  M.strings(HV.forever + 0.6, HV.real, ['B5', 'E6'], 0.035, { att: 2.5, rel: 2.0, cut: 8000, wave: 'sine', vib: 3 });
  theme(cap('forever', 1) + 0.6, 0.7, 0.2, { cut: 0.12 });

  // ---- 7 · is any of this real: warm and plain (the garden tonight, 9:59); the question: the theme whole, cut dead
  M.prog([[HV.real, C.Em9], [HV.real2, C.Cmaj7], [HV.real3, C.G], [HV.real4, C.Dsus], [HV.real5, C.Asus]], HV.question + 0.2, 0.3, { cut: 1300 });
  keys(HV.real2 + 0.8, HV.real5 - 0.6, 2.4, ['B4', 'G4', 'E5', 'D5', 'B4', 'F#4', 'G4', 'A4'], 0.085);
  M.strings(HV.question - 0.2, HV.end - 0.4, C.Embig, 0.46, { att: 1.0, rel: 0.02, cut: 1600, cutTo: 3600, cutAt: HV.end - 0.4, keys: [[HV.question + 2, 0.9], [HV.end - 1.5, 1.25]] });
  M.drum(HV.question, 0.5, 41.2, 1.4);
  M.bell(theme(HV.question + 0.3, 0.42, 0.42), HV_THEME_END, 0.5, 0);
});
