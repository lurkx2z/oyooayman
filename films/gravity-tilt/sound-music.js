/* =====================================================================
   SOUND · MUSIC — an original score in D, all synthesised (the music kit of the Friction 10s film, renamed gt*):
   string pads, a felt piano (also played backwards), bells, a low drum, a filtered synth pulse.
   This film's own ideas:
     the hour chord   D–A–E–G♯–B: no third, a raised fourth. It floats; it never lands. It is under the whole hour
                      and only resolves (to D major) when down comes back
     the theme        D–A–G♯–E, its last note bent down a semitone, like something tipping over: over the title, at
                      Einstein, the sun, the rainbow (in F) and the question (cut on the last frame)
     7:42:00          a calm D major for a second and a half; when gravity turns, one low blow and the chord slides
                      sideways into the hour chord
     the hour         a new colour for each place; a pulse when things move (the street falling, the river, the bath,
                      the terrace going, the last ten minutes); a heartbeat where a body is at risk (the glass, the
                      lamp post, the pool, the count down); silence before the terrace lets go and before the return
     8:42:00          the blow, and the resolution: D major, wide open, at last
   ===================================================================== */

// the kit: string pads (three detuned oscillators per note through low-passes), felt piano (also reversed), bells,
// a low drum and a heartbeat
function gtMusicKit(ctx, K) {
  if (K._music) return K._music;
  const fx = K.fx, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(); bus.connect(K.bus);
  const hall = fx.ir(4.4, { bright: 0.5, damp: 2.8, shape: 2.0, pre: 0.025, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.55;
  bus.connect(hall); hall.connect(wet); wet.connect(K.bus);
  const drumModes = (f) => [[f, 0.7, 1], [f * 1.51, 0.45, 0.5], [f * 1.99, 0.3, 0.35], [f * 2.44, 0.2, 0.2], [f * 3.1, 0.12, 0.12]];
  const M = {
    bus,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4, dest = bus) => {
      const b = fx.pianoBuf(gtMidi(n)), len = Math.min(b.length, Math.ceil((dur + fade + 0.05) * fx.sr));
      return fx.play(b.subarray(0, len), t, dest, { vol: vel * 0.34, pan, stop: t + dur + fade, fade });
    },
    // a piano note played backwards: it swells up out of nothing and stops dead on its attack at tEnd
    rpiano(tEnd, n, vel, dur = 1.6, pan = 0) {
      const key = 'rp' + n + '_' + dur;
      if (!fx.cache[key]) {
        const b = fx.pianoBuf(gtMidi(n)), L = Math.min(b.length, Math.ceil(dur * fx.sr)), y = new Float32Array(L + Math.ceil(0.01 * fx.sr));
        for (let i = 0; i < L; i++) { const u = i / L; y[L - 1 - i] = b[i] * Math.min(1, (1 - u) / 0.35); }
        for (let i = 0; i < 0.01 * fx.sr; i++) y[L + i] = y[L - 1] * (1 - i / (0.01 * fx.sr));
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], tEnd - dur, bus, { vol: vel * 0.34, pan });
    },
    bell: (t, n, vol, pan = 0, dest = bus) => fx.play(fx.bellBuf(gtMidi(n)), t, dest, { vol: vol * 0.25, pan }),
    bellCut: (t, n, vol, d = 0.18, pan = 0) => fx.play(fx.bellBuf(gtMidi(n)), t, bus, { vol: vol * 0.25, pan, stop: t + d, fade: 0.05 }),
    // a low drum (a timpani-like membrane): f the pitch, vol, soft = a wider mallet, dk = decay
    drum(t, vol, f = 36.7, soft = 1, dk = 1) {
      const key = 'drum' + f + '_' + soft + '_' + dk;
      if (!fx.cache[key]) {
        const y = fx.hit(drumModes(f).map(([a, tau, b]) => [a, tau * dk, b]), { width: 0.006 * soft, amp: 1, noise: 0.25, nlen: 0.02, nhp: 300, len: 3.2 * Math.max(dk, 0.3) });
        const pk = GTX.peak(y) || 1; for (let i = 0; i < y.length; i++) y[i] /= pk;
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
        const f = gtHz(nn);
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
function gtPulse(ctx, dest, t0, t1, notes, step, vol, o = {}) {
  if (t1 - t0 < step) return;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.q || 4;
  lp.frequency.setValueAtTime(o.cut || 600, t0); lp.frequency.linearRampToValueAtTime(o.cutTo || o.cut || 600, t1);
  lp.connect(g); g.connect(dest); g.gain.value = 0;
  notes.forEach((n, k) => {
    const os = ctx.createOscillator(); os.type = o.wave || 'sawtooth'; os.frequency.value = gtHz(n); os.detune.setValueAtTime(k % 2 ? 6 : -6, t0);
    if (o.glide) os.detune.linearRampToValueAtTime((k % 2 ? 6 : -6) + o.glide, t1);
    os.connect(lp); os.start(t0); os.stop(t1 + 0.1);
  });
  for (let t = t0, i = 0; t < t1 - 0.01; t += (o.stepAt ? o.stepAt(t) : step), i++) {
    const acc = o.acc && i % o.acc === 0 ? 1.0 : 0.62, ramp = o.ramp ? o.ramp((t - t0) / (t1 - t0)) : 1, v = vol * 0.05 * acc * ramp, st = o.stepAt ? o.stepAt(t) : step;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.setTargetAtTime(0, t + 0.012, st * (o.decay || 0.28));
  }
}

const GT_CH = {
  hour: ['D2', 'A2', 'E3', 'G#3', 'B3'], hourHi: ['A3', 'E4', 'G#4', 'B4'], Dmaj9: ['D2', 'A2', 'F#3', 'C#4', 'E4'],
  Dm9: ['D2', 'A2', 'F3', 'C4', 'E4'], Bbmaj7: ['Bb1', 'F2', 'D3', 'A3', 'D4'], Gm9: ['G1', 'D2', 'Bb2', 'F3', 'A3'], Fmaj7: ['F1', 'C2', 'A2', 'E3', 'A3'],
  Csus: ['C2', 'G2', 'F3', 'G3', 'C4'], Asus: ['A1', 'E2', 'D3', 'E3', 'A3'], A7b9: ['A1', 'E2', 'C#3', 'G3', 'Bb3'], Gmaj7: ['G1', 'D2', 'B2', 'F#3', 'B3'],
  Gmaj7s11: ['G1', 'D2', 'B2', 'F#3', 'C#4'], Bm9: ['B1', 'F#2', 'D3', 'A3', 'C#4'], Gm: ['G1', 'D2', 'G2', 'Bb2', 'D3', 'G3'], Em7: ['E2', 'B2', 'D3', 'G3', 'B3'],
  Dbig: ['D1', 'A1', 'D2', 'F#2', 'A2', 'D3', 'F#3', 'A3', 'D4', 'F#4'], Bbbig: ['Bb1', 'F2', 'Bb2', 'D3', 'F3', 'A3', 'D4', 'F4'],
};
const GT_THEME = ['D5', 'A5', 'G#5', 'E5'];
const gtOct = (n, k) => n.replace(/-?\d$/, (d) => String(+d + k));
const gtTrans = (n, k) => { const m = gtMidi(n) + k, N = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B']; return N[m % 12] + (Math.floor(m / 12) - 1); };

gtSound('music', 'score', function (ctx, bus, K) {
  const M = gtMusicKit(ctx, K), C = GT_CH, cap = gtC, S = gtS, B = gtB, T0 = GT.t0, END = GT.end;
  const sh = (mode) => GT_SHOTS.find((s) => s.mode === mode);
  // the theme (bells or the piano): its last note bent down a semitone (o.bend s: the bend's length; o.cut: cut short;
  // o.tr: transposed by semitones)
  const theme = (t, dts, vol, o = {}) => {
    let tt = t;
    GT_THEME.forEach((n0, i) => {
      const n = gtTrans(gtOct(n0, o.oct || 0), o.tr || 0), pan = (o.pan || 0) + (i % 2 ? 0.22 : -0.22), last = i === GT_THEME.length - 1;
      if (last && o.cut) { if (o.piano) M.piano(tt, n, vol * 0.9, o.cut, pan, 0.02); else M.bellCut(tt, n, vol * 0.9, o.cut, pan); }
      else if (o.piano) M.piano(tt, n, vol * (i ? 0.88 : 1), o.dur || 2.4, pan); else M.bell(tt, n, vol * (i ? 0.88 : 1), pan);
      if (last && o.bend) M.strings(tt, tt + o.bend, [n], vol * 0.3, { att: 0.05, rel: o.bend * 0.45, cut: 5000, wave: 'sine', vib: 2, glide: -100, glideFrom: tt + 0.25, glideAt: tt + o.bend * 0.6 });
      tt += Array.isArray(dts) ? dts[Math.min(i, dts.length - 1)] : dts;
    });
    return tt;
  };
  const keys = (t0, t1, dt, ns, vel, o = {}) => { for (let t = t0, i = 0; t < t1 - 0.3; i++, t += dt) M.piano(t, ns[i % ns.length], vel, Math.min(o.dur || 2.4, (o.stop || 1e9) - t), Math.sin(i * 1.3) * 0.4, o.stop && t + 2.4 > o.stop ? 0.04 : 0.4); };
  const heart = (t0, t1, every, vol) => { for (let t = t0; t < t1 - 0.2; t += typeof every === 'function' ? every(t) : every) M.beat(t, typeof vol === 'function' ? vol(t) : vol); };
  const u01 = (t, a, b) => MathX.clamp((t - a) / (b - a), 0, 1);

  // ---- 1 · 7:42:00, a calm D major; the tilt (one blow, the chord slides sideways into the hour chord); the street
  //          falling (a quick pulse); the bottom
  const tMaster = sh('master').t0, tBottom = sh('bottom').t0, tFront = sh('front').t0;
  M.strings(-0.6, T0 + 0.04, C.Dmaj9, 0.2, { att: 0.5, rel: 0.04, cut: 2600 });
  M.piano(-0.45, 'A4', 0.12, 1.8); M.piano(0.3, 'F#5', 0.1, 1.2, 0.2);
  M.drum(T0, 1.0, 36.7, 1.1, 1.4); M.piano(T0, 'D1', 0.55, 2.2, 0, 0.6); M.piano(T0, 'A1', 0.36, 2.2, 0, 0.6);
  M.strings(T0, tMaster + 0.3, C.hour, 0.36, { att: 0.06, rel: 0.5, cut: 2200, cutTo: 900, cutAt: T0 + 2.5, glide: -100, glideFrom: T0, glideAt: T0 + 1.1 });
  theme(T0 + 0.2, [0.34, 0.34, 0.4], 0.38, { cut: 0.9 });
  M.strings(T0 + 0.3, tMaster + 0.4, ['D1', 'A1', 'D2'], 0.32, { att: 0.6, rel: 0.4, cut: 260, wave: 'triangle', vib: 0 });
  M.prog([[tMaster, C.hour], [cap('tilt', 2) - 0.3, C.Bbmaj7], [B('street', 0.3), C.hour], [cap('street', 1) - 0.4, C.Gm9]], tFront + 0.3, 0.3, { cut: 1100, cutTo: 1700 });
  gtPulse(ctx, M.bus, tMaster + 0.1, tBottom - 0.05, ['D2', 'A2'], 0.19, 0.2, { cut: 520, cutTo: 1500, acc: 4, decay: 0.3, ramp: (u) => 0.55 + 0.45 * u });
  M.roll(tBottom - 1.6, tBottom - 0.03, [[tBottom - 1.6, 0.05], [tBottom - 0.1, 0.36]], 61.7);
  M.drum(tBottom, 0.6, 32.7, 1.1, 1.3); M.piano(tBottom, 'D1', 0.4, 2.6, 0, 0.6);

  // ---- 2 · the glass: a thin high ring, a low drone, a heartbeat (kneel and you go through); off it, onto the wall
  const tCrawl = sh('crawl').t0, tNuance = B('nuance', 0.3);
  M.strings(tFront, tCrawl + 0.4, ['D1', 'A1'], 0.3, { att: 1.0, rel: 0.4, cut: 240, wave: 'triangle', vib: 0 });
  M.strings(tFront + 0.3, tCrawl + 0.2, ['E6', 'G#6', 'B6'], 0.035, { att: 2.0, rel: 0.3, cut: 9000, wave: 'sine', vib: 0 });
  M.prog([[tFront, C.hour], [cap('glass', 1) - 0.3, C.Gmaj7s11], [cap('glass', 2) - 0.3, C.A7b9]], tCrawl + 0.3, 0.22, { cut: 900 });
  heart(cap('glass', 2) - 0.2, tCrawl + 0.2, 0.92, (t) => 0.22 + 0.12 * u01(t, cap('glass', 2), tCrawl));
  M.bellCut(cap('glass', 2) + 1.65, 'G#5', 0.16, 0.14, 0.3);                                   // ("Kneel, and you go through.")
  keys(tCrawl + 0.4, tNuance - 0.2, 1.3, ['A4', 'E5', 'B4', 'G#4'], 0.06, { dur: 1.2 });
  M.rpiano(tNuance + 0.05, 'D3', 0.26, 1.6); M.rpiano(tNuance + 0.05, 'A3', 0.2, 1.6);

  // ---- 3 · the thought experiment: curious and light; Einstein (the theme); tipped on its side
  const tAir = B('air', 0.4);
  M.prog([[tNuance, C.Fmaj7], [cap('nuance', 1) - 0.35, C.Csus], [cap('nuance', 2) - 0.35, C.Bbmaj7], [cap('nuance', 2) + 2.6, C.Asus]], tAir + 0.25, 0.25, { cut: 1100 });
  keys(tNuance + 0.6, cap('nuance', 1) - 0.2, 2.0, ['A4', 'E5', 'C5', 'G4'], 0.07);
  theme(cap('nuance', 1) + 0.9, [0.5, 0.5, 0.6], 0.3, { bend: 1.6 });                                // (Einstein)
  M.drum(cap('nuance', 2) + 1.9, 0.3, 41.2, 1.4);                                                  // ("…tipped on its side.")

  // ---- 4 · the air keeps its down (a wide slow pulse); the sea (one big swell); the river (a quicker pulse, a
  //          hit where it bends, a roll into "falling this way")
  const tTown = sh('town').t0, tRiver = sh('river').t0, tJog = sh('jogger').t0;
  M.prog([[tAir, C.Dm9], [cap('air', 1) - 0.3, C.Bbmaj7], [cap('air', 2) - 0.3, C.Gm9]], tTown + 0.3, 0.27, { cut: 1100 });
  gtPulse(ctx, M.bus, tAir + 0.5, tTown - 0.05, ['D1', 'D2'], 0.6, 0.16, { cut: 380, cutTo: 700, acc: 4, decay: 0.35 });
  M.drum(tTown, 0.45, 36.7, 1.3); M.strings(tTown, tRiver + 0.25, C.Bbbig, 0.3, { att: 1.4, rel: 0.25, cut: 700, cutTo: 2600, cutAt: tRiver - 0.6 });
  M.prog([[tRiver, C.Dm9], [cap('river', 1) - 0.25, C.Gm9], [cap('river', 2) - 0.3, C.A7b9]], tJog + 0.02, 0.3, { cut: 1200, cutTo: 2000, lastRel: 0.02 });
  gtPulse(ctx, M.bus, tRiver + 0.1, tJog - 0.03, ['D1', 'D2', 'A2'], 0.36, 0.22, { cut: 500, cutTo: 1600, acc: 4, decay: 0.28, ramp: (u) => 0.6 + 0.4 * u });
  M.drum(cap('river', 1) - 0.1, 0.5, 41.2, 1.2);                                                   // ("Where it bends, the water doesn't.")
  M.roll(cap('river', 2) + 0.4, tJog - 0.03, [[cap('river', 2) + 0.4, 0.06], [tJog - 0.1, 0.4]], 61.7);

  // ---- 5 · the jogger: hanging on (a heartbeat, a held tension); she climbs on top (lighter)
  const tClimbCap = cap('jogger', 2), tPit = sh('pit').t0;
  M.drum(tJog, 0.55, 36.7, 1.2);
  M.strings(tJog, tClimbCap + 0.3, C.A7b9, 0.28, { att: 0.4, rel: 0.4, cut: 700, cutTo: 1600, cutAt: tClimbCap });
  M.strings(tJog + 0.5, tClimbCap + 0.2, ['Bb5', 'A5'], 0.03, { att: 2.0, rel: 0.2, cut: 7000, wave: 'sine', vib: 0 });
  heart(tJog + 0.6, tClimbCap - 0.1, (t) => 0.95 - 0.3 * u01(t, tJog, tClimbCap), (t) => 0.2 + 0.12 * u01(t, tJog, tClimbCap));
  M.prog([[tClimbCap - 0.1, C.Fmaj7], [tClimbCap + 1.6, C.Csus]], tPit + 0.3, 0.26, { cut: 1300 });
  M.bell(tClimbCap + 1.9, 'C6', 0.16, 0.3); M.bell(tClimbCap + 2.3, 'F5', 0.12, -0.3);           // ("Like a branch.")

  // ---- 6 · the pit (low and hollow); the sickness (the chord sways); the cat (light); the bath (a dark pulse); the
  //          phone (almost nothing, then "Thanks."); the trees (warm); the sun (the theme)
  const tSick = sh('sick').t0, tCat = sh('cat').t0, tBath = sh('bath').t0, tPhone = sh('phone').t0, tTrees = sh('trees').t0, tSun = sh('sun').t0, tTer = sh('terrace').t0;
  M.strings(tPit, tSick + 0.3, ['D1', 'A1', 'D2'], 0.34, { att: 0.8, rel: 0.4, cut: 280, wave: 'triangle', vib: 0 });
  M.prog([[tPit, C.Dm9], [cap('pit', 1) - 0.3, C.Bbmaj7], [cap('pit', 2) - 0.3, C.Gm9]], tSick + 0.3, 0.22, { cut: 800 });
  for (const [dt, n] of [[0.4, 'D3'], [2.6, 'A2'], [5.0, 'F3'], [7.4, 'E3']]) M.piano(tPit + dt, n, 0.1, 3.0, -0.2);
  M.strings(tSick, tCat + 0.3, C.Dm9, 0.27, { att: 1.0, rel: 0.4, cut: 1000, vib: 14, wob: [38, 0.23] });
  M.strings(tSick + 0.5, tCat + 0.2, ['A4', 'D5'], 0.05, { att: 1.5, rel: 0.3, cut: 4000, wave: 'sine', vib: 25, wob: [60, 0.31] });
  M.prog([[tCat, C.Fmaj7]], tBath + 0.3, 0.22, { cut: 1600 });
  for (const [dt, n] of [[0.25, 'A5'], [0.5, 'C6'], [0.75, 'F6']]) M.piano(tCat + dt, n, 0.07, 0.6, 0.3);
  M.bell(cap('cat', 0) + 1.2, 'E6', 0.12, -0.2);
  M.prog([[tBath, C.Gm9], [cap('bath', 1) - 0.3, C.Bbmaj7]], tPhone + 0.2, 0.27, { cut: 900, lastRel: 0.2 });
  gtPulse(ctx, M.bus, tBath + 0.3, tPhone - 0.05, ['G1', 'G2'], 0.42, 0.17, { cut: 420, cutTo: 900, acc: 4, decay: 0.3 });
  M.roll(cap('bath', 1) + 1.0, cap('bath', 1) + 2.6, [[cap('bath', 1) + 1.0, 0.05], [cap('bath', 1) + 2.5, 0.25]], 61.7);
  M.strings(tPhone, tTrees + 0.3, ['D2', 'A2'], 0.16, { att: 1.0, rel: 0.3, cut: 500, wave: 'triangle', vib: 0 });
  M.piano(cap('phone', 1) + 0.05, 'D4', 0.1, 1.2); M.bellCut(cap('phone', 1) + 0.05, 'A5', 0.1, 0.12);      // ("Thanks.")
  M.prog([[tTrees, C.Bbmaj7], [cap('trees', 1) - 0.3, C.Fmaj7]], tSun + 0.3, 0.26, { cut: 1300 });
  keys(tTrees + 0.4, tSun - 0.2, 1.1, ['F5', 'C5', 'A4', 'D5'], 0.05, { dur: 1.0 });
  M.strings(tSun, tTer + 0.4, C.Gmaj7s11, 0.26, { att: 0.8, rel: 0.4, cut: 1500, cutTo: 2600 });
  M.strings(tSun + 0.2, tTer + 0.3, ['F#5', 'B5', 'C#6'], 0.03, { att: 1.5, rel: 0.3, cut: 9000, wave: 'sine', vib: 3 });
  theme(cap('sun', 0) + 0.6, [0.45, 0.45, 0.55], 0.28, { bend: 1.4 });

  // ---- 7 · the brick terrace: ominous, a low ticking; "And it's slipping."
  const tSlip = sh('slip').t0, tRainF = sh('rainfront').t0, tRain = GT.tRain;
  M.prog([[tTer, C.Dm9], [cap('brick', 1) - 0.3, C.Gm9], [cap('brick', 2) - 0.3, C.Asus], [tSlip, C.A7b9]], tRainF + 0.3, 0.26, { cut: 900 });
  for (let t = tTer + 0.5, i = 0; t < tRainF - 0.4; t += 0.92, i++) M.piano(t, i % 4 === 3 ? 'C#3' : 'D3', 0.07 + 0.02 * (i % 2), 0.8, -0.15);
  M.drum(cap('slip', 0) + 0.1, 0.4, 36.7, 1.3);
  M.strings(cap('slip', 0), tRainF + 0.3, ['D1', 'A1'], 0.3, { att: 0.5, rel: 0.3, cut: 300, wave: 'triangle', vib: 0, glide: -60, glideAt: tRainF });

  // ---- 8 · the rain: a swell as it comes down the street; a big chord as it arrives; "it just looks like rain"
  //          (soft); the rainbow (the theme, in F, with the raised fourth)
  const tJ = sh('rainjog').t0, tBow = sh('bow').t0, tWood = sh('wood').t0;
  M.strings(tRainF, tRain + 0.1, C.Gm9, 0.3, { att: 1.2, rel: 0.1, cut: 500, cutTo: 3000, cutAt: tRain, keys: [[tRainF + 2, 0.7], [tRain - 0.3, 1.3]] });
  gtPulse(ctx, M.bus, tRainF + 0.5, tRain - 0.02, ['G1', 'G2', 'D3'], 0.3, 0.2, { cut: 500, cutTo: 2000, acc: 4, decay: 0.3, ramp: (u) => 0.4 + 0.6 * u, stepAt: (t) => 0.32 - 0.12 * u01(t, tRainF, tRain) });
  M.roll(tRain - 2.4, tRain - 0.03, [[tRain - 2.4, 0.06], [tRain - 0.1, 0.45]], 61.7);
  M.drum(tRain, 0.85, 34.6, 1.0, 1.4); M.piano(tRain, 'Bb0', 0.4, 2.0, 0, 0.6);
  M.strings(tRain, tJ + 0.4, C.Bbbig, 0.34, { att: 0.1, rel: 0.5, cut: 3200, cutTo: 1400 });
  M.prog([[tJ, C.Fmaj7], [cap('rain', 2) + 1.4, C.Csus]], tBow + 0.3, 0.24, { cut: 1300 });
  keys(tJ + 0.3, tBow - 0.2, 0.55, ['C6', 'A5', 'F5', 'G5', 'E5', 'A5'], 0.045, { dur: 0.5 });   // (the drops)
  M.strings(tBow, tWood + 0.4, C.Fmaj7, 0.26, { att: 0.6, rel: 0.4, cut: 1600, cutTo: 2600 });
  M.strings(tBow + 0.2, tWood + 0.3, ['A5', 'C6', 'E6'], 0.03, { att: 1.2, rel: 0.3, cut: 9000, wave: 'sine', vib: 3 });
  theme(cap('rain', 3) + 0.4, [0.42, 0.42, 0.5], 0.3, { tr: 3, bend: 1.4 });                       // (F–C–B–G: the rainbow)

  // ---- 9 · the wood: it creaks, it leans, it holds (three low notes); wood weakens (a slow climb)
  const tCreep = sh('creep').t0, tGoing = sh('going').t0, tStill = sh('still').t0;
  M.prog([[tWood, C.Dm9], [cap('wood', 1) - 0.3, C.Bbmaj7]], tCreep + 0.3, 0.22, { cut: 800 });
  const w2 = gtCap('wood', 1).words;
  [[1, 'D2'], [3, 'C2'], [5, 'Bb1']].forEach(([k, n]) => M.piano(w2[k].start, n, 0.18, 1.6));
  M.strings(tCreep, tGoing + 0.3, C.Gm9, 0.26, { att: 1.5, rel: 0.3, cut: 600, cutTo: 1500, glide: 100, glideFrom: tCreep + 2, glideAt: tGoing });
  gtPulse(ctx, M.bus, tCreep + 1.0, tGoing - 0.05, ['G1', 'D2'], 0.62, 0.14, { cut: 380, cutTo: 800, acc: 4, decay: 0.35, ramp: (u) => 0.4 + 0.6 * u });
  M.bell(cap('creep', 1) + 2.2, 'D6', 0.12, 0.2);                                                   // ("…15 minutes.")

  // ---- 10 · the terrace goes: the pulse quickens to "It's going."; then the still (nothing but one thin note); the
  //           release (a roll); the hit (the blow); the cloud (grave)
  const tRel = GT.tRel, tHit = GT.tTerHit, tCloud = sh('cloud').t0, tPool = sh('pool').t0;
  M.strings(tGoing, tStill + 0.02, C.A7b9, 0.32, { att: 0.5, rel: 0.02, cut: 700, cutTo: 3000, cutAt: tStill, keys: [[tGoing + 2, 0.8], [tStill - 0.3, 1.35]] });
  gtPulse(ctx, M.bus, tGoing + 0.1, tStill - 0.02, ['A1', 'A2', 'E3'], 0.4, 0.22, { cut: 600, cutTo: 2200, acc: 4, decay: 0.28, stepAt: (t) => 0.42 - 0.26 * u01(t, tGoing, tStill), ramp: (u) => 0.5 + 0.5 * u });
  M.strings(tStill + 0.1, tRel + 0.02, ['A5'], 0.03, { att: 1.2, rel: 0.02, cut: 8000, wave: 'sine', vib: 0 });
  M.strings(tStill + 0.3, tRel + 0.02, ['D1'], 0.18, { att: 2.0, rel: 0.02, cut: 140, wave: 'sine', vib: 0 });
  M.drum(tRel, 0.6, 32.7, 1.0, 1.2);
  M.roll(tRel + 0.15, tHit - 0.03, [[tRel + 0.15, 0.08], [tHit - 0.1, 0.55]], 55);
  M.strings(tRel, tHit + 0.01, ['D2', 'A2', 'Eb3', 'G#3', 'D4'], 0.3, { att: 0.3, rel: 0.01, cut: 500, cutTo: 3500, cutAt: tHit, glide: 200, glideFrom: tRel, glideAt: tHit });
  M.drum(tHit, 1.0, 30.9, 1.0, 1.7); M.piano(tHit, 'D0', 0.6, 2.4, 0, 0.6); M.piano(tHit, 'A0', 0.42, 2.4, 0, 0.6);
  M.strings(tHit, tCloud + 0.6, C.Dbig.map((n) => n.replace('F#', 'F')), 0.36, { att: 0.03, rel: 1.5, cut: 2400, cutTo: 600, cutAt: tCloud });
  M.prog([[tCloud, C.Dm9], [cap('quiet', 0) + 0.6, C.Bbmaj7], [cap('quiet', 1) - 0.3, C.Gm9]], tPool + 0.3, 0.24, { cut: 900 });
  M.piano(cap('quiet', 1) + 1.2, 'D2', 0.16, 3.0); M.bell(cap('quiet', 1) + 1.25, 'A5', 0.1, 0.2);  // ("…33 minutes to go.")

  // ---- 11 · the pool on the glass: a rising cluster and a heartbeat; the last seconds before it goes (only the
  //           heart); it goes
  const tClose = sh('glassclose').t0, tGlass = GT.tGlass, tReady = sh('ready').t0;
  M.strings(tPool, tClose + 0.3, ['D2', 'A2', 'Eb3', 'A3'], 0.26, { att: 1.5, rel: 0.3, cut: 600, cutTo: 1800, cutAt: tClose });
  M.strings(tPool + 1, tGlass + 0.01, ['E6', 'F6'], 0.03, { att: 3.0, rel: 0.01, cut: 9000, wave: 'sine', vib: 0, glide: 80, glideAt: tGlass });
  heart(tPool + 0.5, tGlass - 0.1, (t) => 0.95 - 0.35 * u01(t, tPool, tGlass), (t) => 0.2 + 0.18 * u01(t, tPool, tGlass));
  M.drum(tGlass, 0.75, 34.6, 1.0, 1.3);
  M.strings(tGlass, tReady + 0.2, ['D3', 'A3', 'D4'], 0.22, { att: 0.05, rel: 0.4, cut: 2400, cutTo: 500, glide: -1200, glideFrom: tGlass + 0.2, glideAt: tReady });

  // ---- 12 · ten minutes left: a steady pulse, the chords climbing; the bolt (the music drops out under the bang)
  const tBolt = GT.tBolt, tLurch = sh('lurch').t0, tLast = sh('last').t0, tCount = sh('count').t0, tHold = GT.hold, tB = GT.tB;
  M.drum(tReady, 0.45, 36.7, 1.2);
  M.prog([[tReady, C.Dm9], [cap('ready', 1) - 0.3, C.Bbmaj7], [cap('ready', 2) - 0.3, C.Fmaj7], [cap('ready', 2) + 2.6, C.Asus]], tBolt - 0.04, 0.28, { cut: 1000, cutTo: 1700, lastRel: 0.04 });
  gtPulse(ctx, M.bus, tReady + 0.3, tBolt - 0.06, ['D1', 'D2', 'A2'], 0.42, 0.2, { cut: 480, cutTo: 1300, acc: 4, decay: 0.3, ramp: (u) => 0.6 + 0.4 * u });
  M.strings(tBolt + 0.6, tLast + 0.3, ['D1', 'A1'], 0.26, { att: 1.5, rel: 0.3, cut: 220, wave: 'triangle', vib: 0 });
  M.piano(cap('bolt', 1) + 0.1, 'D2', 0.18, 2.6); M.piano(cap('bolt', 1) + 0.6, 'C#2', 0.12, 2.6);   // ("21 left.")

  // ---- 13 · the last minute (a heartbeat begins); the last ten seconds (quickening, the strings rising, a roll, a hit
  //           on each quick cut); 0.4 s of nothing; then 8:42:00: the blow, and D major at last
  M.drum(tLast, 0.5, 36.7, 1.2);
  M.strings(tLast, tHold + 0.01, C.hour, 0.3, { att: 1.0, rel: 0.01, cut: 600, cutTo: 4200, cutAt: tHold, keys: [[tLast + 3, 0.7], [tCount, 1.0], [tHold - 0.2, 1.45]] });
  M.strings(tCount, tHold + 0.01, ['G#4', 'A4', 'B4'], 0.06, { att: 3.0, rel: 0.01, cut: 6000, wave: 'sine', vib: 0, glide: 120, glideAt: tHold });
  heart(tLast + 0.7, tHold, (t) => 0.95 - 0.5 * u01(t, tLast, tHold), (t) => 0.24 + 0.26 * u01(t, tLast, tHold));
  M.roll(tHold - 3.2, tHold - 0.03, [[tHold - 3.2, 0.08], [tHold - 0.1, 0.55]], 61.7);
  GT.subCuts.forEach((c, i) => M.drum(c, 0.14 + 0.04 * i, 49.0, 0.7));
  M.drum(tB, 1.0, 30.9, 1.0, 1.7); M.piano(tB, 'D1', 0.6, 2.6, 0, 0.6); M.piano(tB, 'A0', 0.45, 2.6, 0, 0.6);
  M.strings(tB, tB + 9.5, C.Dbig, 0.42, { att: 0.04, rel: 3.0, cut: 1800, cutTo: 3600, cutAt: tB + 4 });
  theme(tB + 0.5, [0.55, 0.55, 0.65], 0.24, { oct: 1 });

  // ---- 14 · after: rest (D major, then G); the rain coming down (bells like drops); the house held (bittersweet); the
  //           question: the hour chord comes back, the theme, its last note cut on the last frame
  const tBS = sh('backstreet').t0, tRF = sh('rainfall').t0, tAfter = sh('after').t0, tQ = sh('question').t0;
  M.prog([[tBS + 1.5, C.Dmaj9], [cap('rainfall', 0) - 0.4, C.Gmaj7]], tAfter + 0.3, 0.24, { cut: 1400 });
  for (let t = tRF + 0.2, i = 0; t < tAfter - 0.3; t += 0.38 + 0.25 * Math.abs(Math.sin(i * 2.1)), i++) M.bell(t, ['D6', 'F#6', 'A6', 'E6', 'B5'][i % 5], 0.06 + 0.03 * Math.abs(Math.sin(i * 1.3)), Math.sin(i * 1.9) * 0.6);
  M.prog([[tAfter, C.Bm9], [cap('after', 0) + 1.8, C.Gmaj7], [cap('after', 1) - 0.3, C.Gm], [cap('after', 1) + 1.9, C.Asus]], tQ + 0.3, 0.26, { cut: 1200 });
  M.piano(cap('after', 1) + 0.2, 'Bb3', 0.1, 2.4); M.piano(cap('after', 1) + 0.25, 'D4', 0.08, 2.4);
  M.drum(tQ, 0.42, 41.2, 1.4);
  M.strings(tQ, END - 0.02, C.hour, 0.32, { att: 0.8, rel: 0.02, cut: 1300, cutTo: 2800, cutAt: END - 0.3 });
  M.strings(tQ + 0.4, END - 0.02, C.hourHi, 0.06, { att: 1.5, rel: 0.02, cut: 6000, wave: 'sine', vib: 3 });
  theme(Math.max(tQ + 0.2, cap('question', 0) + 0.2), [0.42, 0.42, 0.5], 0.36, { cut: Math.max(0.2, END - (Math.max(tQ + 0.2, cap('question', 0) + 0.2) + 1.34) - 0.03) });
});
