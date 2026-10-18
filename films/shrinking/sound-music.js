/* =====================================================================
   SOUND · MUSIC — an original score in D minor, all synthesised (the kit is the Tesla film's, renamed): string pads,
   a felt piano, bells, low drums, a filtered synth pulse; plus two things of this film's own:
     the theme   a music-box figure, A–F–E–D, heard first in high bells over the title. It comes back an octave lower
                 each time you are a world smaller (bedroom, thumb, the dust "city", the electron microscope), turns
                 upside down for the atoms, and at the very end plays again in the dark without its last note
     the fall    below the proton, a Shepard–Risset glissando: a chord that falls for ever without getting lower,
                 its speed tied to how fast you shrink; it freezes at the Planck length. Over it, while it lasts,
                 one tone that never moves: the quark
   The shape: calm, then dread when the cat looks down, a hit on its jump, held breath, relief at Mum's text; a
   playful build for the brick, a drive for the run, suspension in the air; glassy arpeggios on the screen; the quake
   on drums, the slow fall; awe on looking up; a creeping pulse for the mite; wonder through the dust, stopping dead
   in the syrup; a sting for "Most."; the colours drain; cold sine pads in the grey; a hit when the virus fires;
   the DNA's four-note helix; ethereal pads in the atom, then nothing; a warm swell at the nucleus; the storm; the
   fall; the black hole's swell, cut by the flash.
   ===================================================================== */

// the kit: string pads (three detuned oscillators per note through low-passes), felt piano, bells, a low drum, and a
// "far" send (low-passed, a long wet hall) for music heard from a long way off
function shMusicKit(ctx, K) {
  if (K._music) return K._music;
  const fx = K.fx, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(); bus.connect(K.bus);
  const hall = fx.ir(3.8, { bright: 0.5, damp: 3.0, shape: 2.0, pre: 0.02, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.5;
  bus.connect(hall); hall.connect(wet); wet.connect(K.bus);
  const far = ctx.createGain(), farLp = ctx.createBiquadFilter(), farVerb = fx.ir(7.0, { bright: 0.35, damp: 2.2, shape: 1.6, pre: 0.06, seed: 93 }), farWet = ctx.createGain(), farDry = ctx.createGain();
  farLp.type = 'lowpass'; farLp.frequency.value = 1300; farLp.Q.value = 0.5; farWet.gain.value = 1.1; farDry.gain.value = 0.18;
  far.connect(farLp); farLp.connect(farVerb); farVerb.connect(farWet); farWet.connect(K.bus); farLp.connect(farDry); farDry.connect(K.bus);
  const drumModes = (f) => [[f, 0.7, 1], [f * 1.51, 0.45, 0.5], [f * 1.99, 0.3, 0.35], [f * 2.44, 0.2, 0.2], [f * 3.1, 0.12, 0.12]];
  const M = {
    bus, far,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4, dest = bus) => {
      const b = fx.pianoBuf(gbMidi(n)), len = Math.min(b.length, Math.ceil((dur + fade + 0.05) * fx.sr));
      return fx.play(b.subarray(0, len), t, dest, { vol: vel * 0.34, pan, stop: t + dur + fade, fade });
    },
    bell: (t, n, vol, pan = 0, dest = bus) => fx.play(fx.bellBuf(gbMidi(n)), t, dest, { vol: vol * 0.25, pan }),
    // a low drum (a timpani-like membrane): f the pitch, vol, soft = a wider mallet, dk = decay
    drum(t, vol, f = 49, soft = 1, dk = 1) {
      const key = 'drum' + f + '_' + soft + '_' + dk;
      if (!fx.cache[key]) {
        const y = fx.hit(drumModes(f).map(([a, tau, b]) => [a, tau * dk, b]), { width: 0.006 * soft, amp: 1, noise: 0.25, nlen: 0.02, nhp: 300, len: 3.2 * Math.max(dk, 0.3) });
        let pk = 0; for (let i = 0; i < y.length; i++) pk = Math.max(pk, Math.abs(y[i])); for (let i = 0; i < y.length; i++) y[i] /= pk;
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], t, bus, { vol: vol * 0.5 });
    },
    // a heartbeat: lub-dub on a soft low drum
    beat(t, vol) { M.drum(t, vol, 47, 1.6, 0.45); M.drum(t + 0.17, vol * 0.62, 52, 1.6, 0.4); },
    // a timpani roll from t0 to t1, its level following keys [[t, v], …]
    roll(t0, t1, keys, f = 80) {
      for (let t = t0, i = 0; t < t1; t += 0.065 + 0.012 * Math.sin(i * 1.7), i++) {
        let v = keys[0][1];
        for (let k = 1; k < keys.length; k++) if (t >= keys[k - 1][0]) v = keys[k - 1][1] + (keys[k][1] - keys[k - 1][1]) * MathX.clamp((t - keys[k - 1][0]) / (keys[k][0] - keys[k - 1][0]), 0, 1);
        M.drum(t, v * (0.8 + 0.2 * Math.sin(i * 2.3)), f, 1.6, 0.35);
      }
    },
    // a held chord: o.att/rel (s), o.cut → o.cutTo by o.cutAt (Hz), o.keys [[t, level]], o.wave, o.vib (cents),
    // o.glide (cents, over the whole note: the chord slides), o.pan
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
        const f = gbHz(nn);
        [-7, 1, 6].forEach((d, k) => {
          const osc = ctx.createOscillator(), og = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
          osc.type = o.wave || 'sawtooth'; osc.frequency.value = f;
          const d0 = d + r.range(-2, 2); osc.detune.setValueAtTime(d0, t0);
          if (o.glide) osc.detune.linearRampToValueAtTime(d0 + o.glide, t1);
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
    // the theme: A–F–E–D in octave `oct` (o.piano for the piano; o.notes to change it; o.dt the spacing)
    theme(t, oct, vol, o = {}) {
      const ns = o.notes || ['A', 'F', 'E', 'D'], dt = o.dt || 0.55;
      ns.forEach((n, i) => {
        const nn = /\d$/.test(n) ? n : n + oct, tt = t + i * dt, pan = (o.pan || 0) + (i % 2 ? 0.2 : -0.2);
        if (o.piano) M.piano(tt, nn, vol * (i ? 0.85 : 1), o.dur || 2.2, pan, 0.4, o.dest || bus);
        else M.bell(tt, nn, vol * (i ? 0.85 : 1), pan, o.dest || bus);
      });
    },
  };
  return (K._music = M);
}

// a synth pulse: each step a short chord through a low-pass (cut → cutTo over the span); o.acc accents every n steps,
// o.ramp(u) the level over the span, o.wave
function shPulse(ctx, dest, t0, t1, notes, step, vol, o = {}) {
  if (t1 - t0 < step) return;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.q || 4;
  lp.frequency.setValueAtTime(o.cut || 600, t0); lp.frequency.linearRampToValueAtTime(o.cutTo || o.cut || 600, t1);
  lp.connect(g); g.connect(dest); g.gain.value = 0;
  notes.forEach((n, k) => { const os = ctx.createOscillator(); os.type = o.wave || 'sawtooth'; os.frequency.value = gbHz(n); os.detune.value = (k % 2 ? 6 : -6); os.connect(lp); os.start(t0); os.stop(t1 + 0.1); });
  for (let t = t0, i = 0; t < t1 - 0.01; t += step, i++) {
    const acc = o.acc && i % o.acc === 0 ? 1.0 : 0.62, ramp = o.ramp ? o.ramp((t - t0) / (t1 - t0)) : 1, v = vol * 0.05 * acc * ramp;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.setTargetAtTime(0, t + 0.012, step * (o.decay || 0.28));
  }
}

// a Shepard–Risset glissando from t0 to t1: octave-spaced sines under a raised-cosine window over log-frequency, so the
// chord moves for ever without leaving its register. oct(t) is its position in octaves (falling = down), env(t) its
// level; o.voices [[offset in octaves, level]] stack more than one (a root and a fifth)
function shShepard(K, t0, t1, oct, env, o = {}) {
  const { fx, sr } = K, d = t1 - t0, n = Math.ceil(d * sr), L = fx.arr(d), R = fx.arr(d);
  const N = o.n || 7, fLo = o.fLo || 55, voices = o.voices || [[0, 1]];
  const tab = new Float32Array(Math.ceil(d * 100) + 2), et = new Float32Array(tab.length);
  for (let j = 0; j < tab.length; j++) { tab[j] = oct(t0 + j / 100); et[j] = env(t0 + j / 100); }
  for (const [off, va] of voices) for (let k = 0; k < N; k++) {
    let ph = fx.r.range(0, 6.283);
    const pan = (k % 2 ? 0.35 : -0.35) * (off ? -1 : 1), gl = Math.cos((pan + 1) * Math.PI / 4) * va, gr = Math.sin((pan + 1) * Math.PI / 4) * va;
    for (let i = 0; i < n; i++) {
      const u = i / sr * 100, j = Math.floor(u), w = u - j, p = tab[j] + (tab[j + 1] - tab[j]) * w, e = et[j] + (et[j + 1] - et[j]) * w;
      let x = k + off + p; x = ((x % N) + N) % N;
      ph += 2 * Math.PI * fLo * Math.pow(2, x) / sr;
      const v = Math.sin(ph) * (0.5 - 0.5 * Math.cos(2 * Math.PI * x / N)) * e;
      L[i] += v * gl; R[i] += v * gr;
    }
  }
  return K.putLR(L, R, t0, { vol: o.vol, norm: true, room: o.room, wet: o.wet });
}

const SH_CH = {
  Dm: ['D2', 'A2', 'F3', 'A3', 'D4'], Dm9: ['D2', 'A2', 'F3', 'C4', 'E4'], Bb: ['Bb1', 'F2', 'D3', 'F3', 'Bb3'], Bbmaj7: ['Bb1', 'F2', 'A2', 'D3', 'F3'],
  F: ['F2', 'C3', 'A3', 'C4'], Fmaj7: ['F2', 'C3', 'E3', 'A3', 'C4'], C: ['C2', 'G2', 'E3', 'G3'], Gm: ['G1', 'D2', 'Bb2', 'D3', 'G3'],
  Gm9: ['G1', 'D2', 'Bb2', 'F3', 'A3'], A: ['A1', 'E2', 'C#3', 'E3', 'A3'], Dsus: ['D2', 'A2', 'E3', 'A3'], D: ['D2', 'A2', 'F#3', 'A3', 'D4'],
};

shSound('music', 'score', function (ctx, bus, K) {
  const M = shMusicKit(ctx, K), T = SH, r = new RNG(CONFIG.seed + 404);
  const arp = (t0, t1, steps, step, vol, oct = [5, 6]) => {   // bells walking up and down the chord tones
    for (let t = t0, i = 0; t < t1 - 0.05; t += step, i++) {
      let ch = steps[0][1]; for (const [ts, c] of steps) if (t >= ts) ch = c;
      const pcs = ch.map((n) => n.replace(/-?\d$/, '')), seq = [0, 1, 2, 1, 3, 2, 1, 2], pc = pcs[(seq[i % 8] + 1) % pcs.length];
      M.bell(t, pc + oct[(i >> 2) % oct.length], vol * (i % 4 === 0 ? 1 : 0.7), i % 2 ? 0.35 : -0.35);
    }
  };

  // ---- 1 · the bedroom: the theme in high bells over the title; a soft pad; the pad slides down as you shrink
  M.theme(0.4, 5, 0.55);
  M.bell(2.9, 'A4', 0.35, 0);
  M.prog([[0, SH_CH.Dm], [6, SH_CH.Bb], [10.5, SH_CH.F], [14, SH_CH.C]], T.catLook + 0.05, 0.55, { cut: 900, att: 1.0, lastRel: 0.12 });
  M.strings(0, 4.6, ['D1', 'A1'], 0.4, { att: 1.5, rel: 1.5, cut: 300 });
  M.piano(5.2, 'D4', 0.28, 2.2, 0.1); M.piano(6.4, 'A3', 0.22, 2.2, -0.1);
  M.drum(9.0, 0.45, 41, 1.6); M.piano(9.0, 'D2', 0.36, 3, 0);
  M.strings(9.5, T.catLook + 0.05, ['A4', 'D5'], 0.28, { att: 3.0, rel: 0.12, cut: 2600, glide: -500, wave: 'triangle', vib: 4 });
  M.theme(14.2, 4, 0.5);

  // ---- the cat: the music stops dead when it looks at you; a low drone, a heartbeat that speeds up, a roll, the jump
  M.strings(T.catLook + 0.15, T.catJump + 0.05, ['D1', 'A1'], 0.85, { att: 1.4, rel: 0.05, cut: 260, cutTo: 420, cutAt: T.catJump });
  for (let t = T.catLook + 4.6, dt = 1.05; t < T.catJump - 0.3; t += dt, dt = Math.max(0.58, dt * 0.96)) M.beat(t, 0.36 + 0.3 * (t - T.catLook - 4.6) / (T.catJump - T.catLook - 4.6));
  M.strings(28.5, T.catJump + 0.05, ['A5', 'Bb5'], 0.16, { att: 2.0, rel: 0.05, cut: 4000, wave: 'sine', vib: 10 });
  M.roll(31.0, T.catJump, [[31.0, 0.08], [T.catJump, 0.5]], 82);
  M.drum(T.catJump, 1.15, 41); M.drum(T.catJump, 0.6, 82);
  M.strings(T.catJump, 35.3, ['D1', 'D2', 'A2', 'Eb3', 'A3'], 1.2, { att: 0.04, rel: 1.4, cut: 2000, cutTo: 500, cutAt: 34.8 });
  // "Don't move": a held low note, the heart racing, a thin high note while its nose comes down
  M.strings(35.0, T.buzz1 + 0.05, ['D1', 'A1'], 0.6, { att: 1.2, rel: 0.05, cut: 220 });
  for (let t = 35.3; t < T.buzz1 - 0.2; t += 0.56) M.beat(t, 0.4);
  M.strings(36.5, T.buzz1 + 0.05, ['A5'], 0.12, { att: 2.5, rel: 0.05, cut: 5000, wave: 'sine', vib: 4 });
  // the buzz: a stab; then relief (Mum's text saved you)
  M.drum(T.buzz1, 0.6, 55); M.strings(T.buzz1, 43.9, ['D2', 'Ab2', 'D3'], 0.8, { att: 0.02, rel: 0.5, cut: 1200 });
  M.strings(44.6, 49.2, ['F2', 'C3', 'A3', 'C4', 'F4'], 0.75, { att: 1.2, rel: 1.4, cut: 1500, cutTo: 2200, cutAt: 46.5 });
  M.bell(45.2, 'C6', 0.35, 0.2); M.bell(45.9, 'F5', 0.3, -0.2);
  // walking: a light pad and piano; the theme in piano when you are as tall as your thumb
  M.prog([[47.8, SH_CH.Dm9], [51, SH_CH.Bb], [54, SH_CH.Gm], [56.5, SH_CH.A]], T.brick + 0.4, 0.5, { cut: 1200 });
  for (let t = 48.0, i = 0; t < T.brick - 0.2; t += 0.5, i++) if (t < 51 || t > 53.6) M.piano(t, ['D4', 'F4', 'A4', 'C5', 'Bb3', 'D4', 'F4', 'A4', 'G3', 'Bb3', 'D4', 'G4', 'A3', 'C#4', 'E4', 'A4'][Math.min(15, Math.floor((t - 48) / 2.5) * 4 + (i % 4))], 0.12, 0.9, i % 2 ? 0.25 : -0.25);
  M.theme(51.2, 4, 0.36, { piano: true, dt: 0.6 });
  M.piano(55.2, 'D2', 0.3, 2.5, 0);

  // ---- the brick: a playful pulse; a roll as you crouch; a hit and a rising chord as it goes up; the drop
  M.prog([[T.brick, SH_CH.Dm], [60, SH_CH.C], [62, SH_CH.Bb], [64, SH_CH.C]], T.grab, 0.55, { cut: 1400 });
  shPulse(ctx, M.bus, T.brick + 0.5, T.grab, ['D3', 'A3'], 0.25, 0.45, { cut: 900, cutTo: 1500, acc: 4, decay: 0.2 });
  for (const [t, n] of [[58.6, 'A5'], [59.1, 'D6'], [60.6, 'G5'], [61.1, 'C6'], [62.6, 'F5'], [63.1, 'Bb5']]) M.bell(t, n, 0.28, 0.2);
  M.piano(63.1, 'D2', 0.4, 2.8, 0); M.drum(63.1, 0.5, 36, 2);
  M.roll(T.grab, T.lift, [[T.grab, 0.12], [T.lift, 0.7]], 80);
  M.strings(T.grab, T.lift + 0.05, ['D2', 'A2', 'D3'], 0.8, { att: 0.4, rel: 0.05, cut: 400, cutTo: 1600, cutAt: T.lift });
  M.drum(T.lift, 1.0, 41); M.drum(T.lift, 0.5, 82);
  M.strings(T.lift, 69.7, ['Bb1', 'F2', 'D3', 'F3', 'Bb3', 'D4'], 0.85, { att: 0.08, rel: 0.4, cut: 2600 });
  M.strings(69.6, 71.6, ['F2', 'C3', 'A3', 'C4', 'F4'], 0.85, { att: 0.2, rel: 0.3, cut: 2800 });
  M.strings(71.5, T.drop + 0.06, ['C2', 'G2', 'E3', 'G3', 'C4'], 0.85, { att: 0.2, rel: 0.05, cut: 3000 });
  shPulse(ctx, M.bus, T.lift, T.drop, ['D3', 'A3', 'D4'], 0.125, 0.8, { cut: 1800, cutTo: 3000, acc: 4 });
  M.drum(72.93, 0.8, 41, 1.2);

  // ---- the run: the pulse on your stride (a step every 0.42 s); the jump: suspended in the air; the landing
  const S = Math.PI / 7.5;
  shPulse(ctx, M.bus, T.run, T.jump, ['D3', 'A3', 'D4'], S / 2, 0.85, { cut: 1300, cutTo: 2800, acc: 2, ramp: (u) => 0.6 + 0.4 * u });
  for (let t = T.run + S; t < T.jump - 0.1; t += S) M.drum(t, 0.38, 55, 1.2, 0.5);
  M.prog([[T.run, SH_CH.Dm], [T.run + 4 * S, SH_CH.Bb], [T.run + 8 * S, SH_CH.C]], T.jump + 0.05, 0.75, { cut: 1400, cutTo: 2600, lastRel: 0.05 });
  M.drum(T.jump, 1.0, 41); M.drum(T.jump, 0.4, 98, 0.8);
  M.strings(T.jump, T.land + 0.2, ['A3', 'D4', 'E4', 'A4', 'D5'], 0.6, { att: 0.4, rel: 0.4, cut: 3000, vib: 3 });
  M.bell(T.apex, 'E6', 0.45, 0); M.bell(T.apex + 0.5, 'A5', 0.3, 0.3);
  M.drum(T.land, 0.9, 41); M.drum(T.land, 0.35, 49, 1.4);
  M.strings(T.land, 86.4, SH_CH.Dsus, 0.5, { att: 0.3, rel: 0.6, cut: 1600 });
  M.bell(86.6, 'D6', 0.3, -0.3); M.bell(87.0, 'A6', 0.22, 0.3);

  // ---- the phone's screen: glassy arpeggios; the pixels get a digital pulse; three bells for red, green and blue
  const phone = [[86, SH_CH.F], [90, SH_CH.C], [94, SH_CH.Dm], [98, SH_CH.Bb], [102, SH_CH.F]];
  M.prog(phone, 104.6, 0.5, { cut: 1600 });
  arp(87.6, 104.4, phone, 0.3, 0.17);
  shPulse(ctx, M.bus, 95.2, 104.4, ['F4', 'C5'], 0.15, 0.3, { cut: 2600, wave: 'square', q: 1, decay: 0.15, ramp: (u) => Math.min(1, u * 4) });
  M.bell(100.5, 'C6', 0.45, -0.4); M.bell(101.0, 'E6', 0.45, 0); M.bell(101.5, 'G6', 0.45, 0.4);
  M.strings(104.4, 108.7, SH_CH.Fmaj7, 0.8, { att: 0.6, rel: 0.6, cut: 1800, cutTo: 3200, cutAt: 106 });
  M.strings(108.5, T.call + 0.05, SH_CH.C, 0.45, { att: 0.5, rel: 0.05, cut: 1600 });
  arp(104.6, T.call - 0.1, [[104.5, SH_CH.Fmaj7], [108.5, SH_CH.C]], 0.3, 0.12);

  // ---- the call and the quake: a tightening cluster, then drums on every buzz; the fall is slow and suspended
  M.strings(T.call, T.quake + 0.2, ['D1', 'D2', 'Eb2', 'A2'], 0.9, { att: 2.2, rel: 0.2, cut: 300, cutTo: 1400, cutAt: T.quake });
  for (let t = T.quake; t < T.thrown; t += 2.0) { M.drum(t, 1.0, 41); M.drum(t, 0.55, 36, 1.5); }
  shPulse(ctx, M.bus, T.quake, T.thrown, ['D2', 'A2'], 0.125, 0.9, { cut: 600, cutTo: 1400, acc: 4 });
  M.strings(T.quake, T.thrown + 0.05, ['D1', 'A1', 'D2', 'Eb2'], 0.8, { att: 0.1, rel: 0.05, cut: 600 });
  M.strings(T.thrown, T.floor + 0.3, ['D3', 'A3', 'E4', 'A4', 'D5'], 0.55, { att: 0.4, rel: 0.4, cut: 2200, vib: 3 });
  M.strings(T.thrown, T.floor + 0.3, ['D1'], 0.5, { att: 0.6, rel: 0.4, cut: 200 });
  M.bell(121.8, 'A5', 0.3, 0);
  M.drum(T.floor, 0.6, 49, 1.6);
  M.strings(125.0, T.lookUp + 0.3, SH_CH.Dm9, 0.45, { att: 1.0, rel: 0.4, cut: 1100 });
  M.piano(125.7, 'D4', 0.24, 2.2, 0); M.piano(126.5, 'A4', 0.2, 2.2, 0.2); M.piano(127.3, 'F4', 0.22, 2.4, -0.2);

  // ---- 3 · the dust. Looking up: wide strings opening out; the theme an octave lower (low bells), then high
  M.strings(T.lookUp, 131.85, SH_CH.Bbmaj7, 0.95, { att: 1.2, rel: 0.5, cut: 800, cutTo: 1800 });
  M.strings(131.5, 134.35, SH_CH.F, 0.95, { att: 0.5, rel: 0.5, cut: 1800, cutTo: 2600 });
  M.strings(134.0, 136.85, ['C2', 'G2', 'E3', 'G3', 'C4', 'E4'], 1.0, { att: 0.5, rel: 0.5, cut: 2600, cutTo: 3400 });
  M.strings(136.5, 139.6, SH_CH.Dm9, 0.85, { att: 0.5, rel: 1.0, cut: 3200, cutTo: 1200 });
  M.drum(T.lookUp, 0.45, 36, 2); M.drum(134.0, 0.5, 36, 2);
  M.theme(129.6, 3, 0.62, { dt: 0.7 });
  M.theme(134.2, 5, 0.38, { dt: 0.45 });
  // the dust: sparse
  M.strings(139.2, T.mite + 0.3, SH_CH.Dm, 0.38, { att: 1.0, rel: 0.5, cut: 800 });
  for (const [t, n] of [[139.5, 'A3'], [141.5, 'F4'], [143.4, 'E4'], [145.3, 'D4']]) M.piano(t, n, 0.22, 2.2, 0);

  // ---- the mite: a creeping low pulse and a slow heart; a stab when it is close; thin high notes
  shPulse(ctx, M.bus, T.mite, T.miteStuck, ['D2'], 0.4, 0.75, { cut: 500, cutTo: 1300, acc: 2, decay: 0.35 });
  for (let t = T.mite + 0.4; t < T.water - 0.5; t += 0.8) M.beat(t, 0.3);
  M.strings(T.mite, 152.1, ['D1', 'A1', 'Eb2'], 0.7, { att: 2.0, rel: 0.1, cut: 300, cutTo: 900, cutAt: 152 });
  M.drum(152.0, 1.0, 41); M.drum(152.0, 0.5, 36, 1.5);
  M.strings(152.0, 155.6, ['D1', 'D2', 'A2', 'Eb3', 'Bb3'], 1.1, { att: 0.03, rel: 1.2, cut: 1600, cutTo: 500, cutAt: 155 });
  M.strings(155.5, T.water + 0.1, ['Eb6', 'D6'], 0.1, { att: 1.5, rel: 0.4, cut: 6000, wave: 'sine', vib: 6 });
  M.strings(155.5, T.water + 0.1, ['D1', 'A1'], 0.55, { att: 1.0, rel: 0.4, cut: 260 });
  // the water: shimmering high strings; the mite caught (a falling line); glue (a swell)
  M.strings(T.water, T.miteStuck + 0.3, ['A4', 'D5', 'E5'], 0.4, { att: 0.8, rel: 0.4, cut: 3500, vib: 28 });
  M.strings(T.water, T.miteStuck + 0.3, ['D2', 'A2'], 0.55, { att: 0.6, rel: 0.4, cut: 500 });
  ['A4', 'G4', 'F4', 'E4', 'D4'].forEach((n, i) => M.piano(T.miteStuck + 0.2 + i * 0.35, n, 0.28, 1.6, 0));
  M.strings(T.miteStuck, T.hair + 0.3, ['D2', 'A2', 'F3', 'C4', 'E4'], 0.6, { att: 1.0, rel: 0.8, cut: 900, cutTo: 2200, cutAt: 171.5, keys: [[166, 0.7], [170.5, 1.15], [173, 0.8]] });

  // ---- wonder: the hair, the syrup (the music thickens and slides, then stops dead), pollen, the flake, bacteria
  M.prog([[T.hair, SH_CH.F], [177, SH_CH.C]], T.syrup + 0.3, 0.55, { cut: 1400 });
  M.piano(175.2, 'F4', 0.24, 2, 0); M.piano(175.9, 'A4', 0.22, 2, 0.2); M.piano(176.6, 'C5', 0.24, 2.6, -0.2);
  M.strings(T.syrup, 185.45, SH_CH.Dm9, 0.7, { att: 0.8, rel: 0.03, cut: 1000, cutTo: 500, glide: -80, vib: 2 });
  M.piano(180.4, 'D3', 0.3, 3, 0, 0.3); M.piano(182.2, 'A3', 0.22, 3, 0, 0.3);
  M.prog([[186.3, SH_CH.Bb], [T.pollen, SH_CH.F], [T.flake, SH_CH.Gm9]], T.bacteria + 0.3, 0.55, { cut: 1400, att: 1.2 });
  M.bell(189.6, 'F6', 0.35, 0.2); M.drum(189.6, 0.4, 41, 1.6); M.bell(190.2, 'C6', 0.25, -0.2);
  M.piano(194.6, 'G3', 0.26, 2, 0); M.piano(195.2, 'D4', 0.22, 2, 0.2); M.piano(195.8, 'Bb4', 0.24, 2.4, -0.2);
  M.prog([[T.bacteria, SH_CH.Dm], [204.5, SH_CH.Bb]], 210.6, 0.5, { cut: 1100, lastRel: 0.1 });
  shPulse(ctx, M.bus, T.bacteria, 210.5, ['D2'], 0.3, 0.5, { cut: 700, decay: 0.3 });
  for (let t = T.bacteria + 0.3; t < 209.0; t += r.range(0.18, 0.42)) M.bell(t, r.pick(['D', 'F', 'G', 'A', 'C']) + r.pick([5, 6]), 0.1 * r.range(0.6, 1), r.range(-0.7, 0.7));
  // "Most." — a dark sting
  M.drum(210.6, 0.8, 36, 2); M.strings(210.6, T.brown + 0.2, ['D1', 'Eb2', 'A2'], 0.85, { att: 0.05, rel: 1.4, cut: 900, cutTo: 300, cutAt: 213 });

  // ---- the shoves; the colours fade (the filters close, the pad slides down); near silence
  M.strings(T.brown, T.fade + 0.3, ['D2', 'A2', 'E3'], 0.45, { att: 1.5, rel: 0.5, cut: 900 });
  M.piano(218.6, 'D3', 0.22, 2.5, 0); M.piano(219.6, 'E3', 0.18, 2.5, 0);
  M.strings(T.fade, 232.6, ['D3', 'A3', 'E4', 'A4'], 0.55, { att: 1.0, rel: 1.5, cut: 2400, cutTo: 250, cutAt: 231.5, glide: -200 });
  M.strings(227.5, 232.6, ['A5'], 0.12, { att: 0.6, rel: 3.5, cut: 6000, wave: 'sine', vib: 3 });

  // ---- 4 · the electron microscope: cold sine pads; the theme an octave lower again, in piano
  M.strings(T.sem, T.phage + 0.3, ['D2', 'A2', 'E3'], 0.7, { att: 1.5, rel: 0.5, cut: 3000, wave: 'sine', vib: 2 });
  M.theme(235.6, 3, 0.32, { piano: true, dt: 0.65, dur: 2.6 });
  M.piano(240.6, 'E5', 0.16, 2.4, 0.2); M.piano(242.0, 'A4', 0.16, 2.4, -0.2);
  // the virus: a mechanical tick; tension; the hit when it fires; awe ("more of these than stars")
  for (let t = T.phage, i = 0; t < SH_NA_PH.fire - 0.02; t += 0.25 - 0.08 * MathX.clamp((t - T.phage) / 7, 0, 1), i++) K.put(K.fx.hit([[2900, 0.012, 1], [4300, 0.008, 0.5]], { width: 0.0002 }), t, { vol: i % 2 ? 0.035 : 0.055, norm: true, pan: i % 2 ? 0.3 : -0.3 });
  M.strings(T.phage, SH_NA_PH.fire + 0.05, ['D2', 'Eb2', 'A2'], 0.65, { att: 1.5, rel: 0.05, cut: 400, cutTo: 1500, cutAt: SH_NA_PH.fire, wave: 'triangle' });
  M.drum(SH_NA_PH.fire, 1.1, 41); M.drum(SH_NA_PH.fire, 0.5, 98, 0.8);
  M.strings(254.3, T.grit + 0.3, ['Bb1', 'F2', 'D3', 'F3', 'A3', 'D4'], 0.9, { att: 0.9, rel: 1.2, cut: 900, cutTo: 2600, cutAt: 257 });
  M.bell(254.8, 'D6', 0.4, -0.3); M.bell(255.4, 'A5', 0.32, 0.3); M.bell(256.0, 'F5', 0.3, 0);
  // the grit and the hail: a low pulse; the DNA: a four-note helix in bells, circling
  shPulse(ctx, M.bus, T.grit, T.dna, ['D2', 'A2'], 0.2, 0.6, { cut: 500, cutTo: 1100, acc: 4 });
  M.strings(T.grit, T.dna + 0.3, ['D1', 'A1'], 0.5, { att: 1.0, rel: 0.5, cut: 300 });
  M.prog([[T.dna, SH_CH.Dm9], [278.5, SH_CH.Bbmaj7], [283.5, SH_CH.F]], T.balls + 0.3, 0.6, { cut: 1400, keys: null });
  for (let t = T.dna + 0.5, i = 0; t < T.balls - 0.2; t += 0.42, i++) M.bell(t, ['A4', 'C5', 'G4', 'D5'][i % 4], 0.2, 0.7 * Math.sin(i * 0.8));
  M.strings(283.5, T.balls + 0.3, ['F3', 'C4', 'A4', 'C5'], 0.5, { att: 1.2, rel: 0.6, cut: 2400 });
  M.drum(283.6, 0.4, 36, 2);
  for (let i = 0; i < 8; i++) M.bell(T.balls + 0.1 + i * 0.12, ['A6', 'E6', 'D6', 'A5', 'F6', 'D6', 'A5', 'E5'][i], 0.18, -0.6 + i * 0.17);

  // ---- 5 · the atom: ethereal pads (D major: another place); the theme upside down; sparkles of maybe; then nothing
  M.strings(T.atomWorld, T.haze + 0.3, ['D3', 'A3', 'E4', 'F#4'], 0.55, { att: 1.5, rel: 0.6, cut: 2200, wave: 'triangle', vib: 3 });
  M.theme(292.7, 5, 0.42, { notes: ['D5', 'E5', 'F#5', 'A5'], dt: 0.5 });
  M.strings(T.atoms + 4.5, 301.6, ['D1', 'A1'], 0.6, { att: 1.0, rel: 1.0, cut: 300 });
  M.strings(T.haze, T.empty + 0.25, ['A2', 'E3', 'B3', 'F#4'], 0.5, { att: 1.2, rel: 0.05, cut: 1800, wave: 'triangle' });
  M.strings(T.inside, T.empty + 0.25, ['E5', 'A5'], 0.15, { att: 1.5, rel: 0.05, cut: 6000, wave: 'sine', vib: 15 });
  for (let t = 315.1; t < T.empty; t += r.range(0.1, 0.22)) M.bell(t, r.pick(['D', 'E', 'F#', 'A', 'B']) + r.pick([5, 6, 6, 7]), 0.08 * r.range(0.5, 1), r.range(-0.8, 0.8));
  M.strings(T.empty + 0.5, T.pea, ['A6'], 0.045, { att: 2.0, rel: 3.0, cut: 8000, wave: 'sine', vib: 2 });
  M.bell(T.pea + 0.3, 'A5', 0.4, 0);
  // the nucleus: a warm swell; bells for its twelve; its weight
  M.strings(T.nucleus, 343.3, ['D2', 'A2', 'F#3', 'A3', 'D4'], 0.8, { att: 2.5, rel: 0.6, cut: 700, cutTo: 2400, cutAt: 340 });
  for (let i = 0; i < 6; i++) M.bell(338.7 + i * 0.3, ['D5', 'F#5', 'A5', 'D6', 'A5', 'F#5'][i], 0.22, -0.5 + i * 0.2);
  M.drum(343.1, 0.6, 36, 2); M.strings(343.0, T.proton + 0.3, ['D1', 'D2', 'A2'], 0.9, { att: 0.4, rel: 0.6, cut: 400 });

  // ---- the proton: the storm (a roll, churning low strings and a pulse); three notes for three quarks; the energy
  M.roll(T.proton, T.storm, [[T.proton, 0.12], [T.storm, 0.6]], 70);
  M.strings(T.proton, T.storm + 0.05, ['D1', 'A1', 'D2', 'Eb2'], 0.9, { att: 1.0, rel: 0.05, cut: 300, cutTo: 1200, cutAt: T.storm });
  M.drum(T.storm, 1.1, 41); M.drum(T.storm, 0.5, 82);
  M.strings(T.storm, 361.3, ['D1', 'A1', 'D2', 'Eb2', 'A2'], 0.85, { att: 0.2, rel: 0.4, cut: 900, keys: [[352, 1], [356, 0.75], [361, 0.9]] });
  shPulse(ctx, M.bus, T.storm, 366.0, ['D2', 'Eb2'], 0.125, 0.6, { cut: 500, cutTo: 1500, acc: 3, ramp: (u) => 0.7 + 0.3 * Math.sin(u * 9) });
  M.bell(357.0, 'D4', 0.5, -0.4); M.bell(357.5, 'F4', 0.5, 0); M.bell(358.0, 'A4', 0.5, 0.4);
  M.strings(361.0, 366.4, ['Bb1', 'F2', 'D3', 'F3', 'Bb3', 'D4'], 1.1, { att: 0.6, rel: 0.6, cut: 1200, cutTo: 3200, cutAt: 364 });
  M.drum(361.0, 0.7, 36, 2);
  M.strings(366.0, T.quark + 0.4, ['D2', 'A2', 'F3', 'A3', 'E4'], 0.6, { att: 0.5, rel: 1.0, cut: 1600, cutTo: 700 });

  // ---- 6 · beyond. The quark: one tone that never moves. Under it the fall, as fast as you shrink; it freezes at
  //      the Planck length; the black hole's swell; the flash cuts everything
  shTone(K, T.quark + 0.3, 26.5, 440, [[1, 1], [2, 0.12], [3, 0.04]], (u, t) => Math.min(1, t / 1.2) * (1 - shE(T.quark + 0.3 + t, T.unknown + 2, T.unknown + 8)) * (1 + 0.06 * Math.sin(t * 5.1)), { vol: 0.16 });
  M.strings(T.quark, T.unknown + 0.5, ['D1', 'A1'], 0.6, { att: 2.0, rel: 1.5, cut: 3000, wave: 'sine', vib: 1 });
  const hA = shH(373), gl = (t) => 0.5 * Math.log10(shH(Math.min(t, 430)) / hA);
  const glEnv = (t) => shE(t, 373, 378) * (1 - 0.45 * shWin(t, 389.5, 398, 1.5, 3)) * (1 + 0.35 * shWin(t, 408.5, 413.0, 1.5, 1.2)) * (1 - 0.4 * shWin(t, 413.5, 421, 1.0, 2)) * (1 + 0.6 * shE(t, 430.5, 443.8)) * (1 - shE(t, T.flash - 0.03, T.flash));
  shShepard(K, 373, T.flash + 0.05, gl, glEnv, { vol: 0.2, voices: [[0, 1], [7 / 12, 0.55]] });
  M.bell(384.7, 'D5', 0.3, 0);
  // "Up there, she's still calling": the bedroom's theme, very far away
  M.theme(403.8, 5, 0.35, { dt: 0.75, dest: M.far });
  M.strings(408.5, 413.6, ['D2', 'A2', 'F3', 'C4', 'E4'], 0.55, { att: 1.5, rel: 1.0, cut: 800, cutTo: 2600 });
  M.strings(422.0, T.planck + 0.3, ['D1', 'D2', 'A2'], 0.6, { att: 1.5, rel: 0.3, cut: 300, cutTo: 900 });
  M.bell(T.planck + 0.3, 'D5', 0.4, -0.2); M.bell(T.planck + 0.3, 'A4', 0.3, 0.2); M.drum(T.planck + 0.3, 0.4, 36, 2);
  M.strings(430.5, T.bh + 0.1, ['D2', 'A2', 'Eb3'], 0.8, { att: 1.5, rel: 0.05, cut: 400, cutTo: 1800 });
  M.drum(T.bh, 1.2, 36, 2); M.drum(T.bh, 0.6, 41);
  M.strings(T.bh, T.flash, ['D1', 'A1', 'D2', 'F2', 'A2', 'Eb3'], 0.75, { att: 0.3, rel: 0.02, cut: 600, cutTo: 2800, cutAt: T.flash - 0.3 });
  M.roll(438.5, T.flash, [[438.5, 0.12], [T.flash, 0.6]], 70);
  // the end: the theme in the dark, without its last note
  M.theme(453.6, 5, 0.3, { notes: ['A5', 'F5', 'E5'], dt: 0.62 });
});
