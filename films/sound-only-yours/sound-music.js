/* =====================================================================
   SOUND · MUSIC — an original score, all synthesised (the music kit of the gravity films: string pads, a felt piano,
   also played backwards so notes swell up out of nothing, bells, a low drum), made cold and eerie for this film, in the
   mood of the Slower light film the owner loved ("a horror game"). It leads the whole way; the world has no other
   sound. A four-note lullaby (D A B♭ E: a tritone at its end) comes back each time you reach out to someone.
     0:00–0:03  the world for 0.7 s (the ambience); then nothing: a backwards swell under the slow-motion glass, sucked
                away at the instant it shatters (silently)
     the kitchen   low drones and the lullaby; a dead hush before your clap; the pulse of air; your body (almost nothing
                   but a sub, so your breath and heart lead); glassy ghosts for the ringing; Mum: the sad version
     the window    the pads open up; one music-box note for each window that lights up across the park
     the stairs    a ticking pulse (the light's timer); it cuts out with the light; a riser into the turn: a hit
     the street    cold and wide; a hit for the silent car; a ghost of a siren in the strings that dies; the heads turn
     the storm     a roll that builds for thunder that never comes: it stops dead, and the score with it
     the park      open fifths; the bats (bells flitting blind); silence for your shout and its echoes; a swell for 5 km;
                   a march as they come
     the dark      a sub and a hush; a hit for the dog; glass for the echo pictures; dread for the crowd; the last hit
                   when you turn and it is right behind you; held to the hard cut on the last frame
   ===================================================================== */

// the kit: string pads (three detuned oscillators per note through low-passes), felt piano (also reversed), bells,
// a low drum and a heartbeat (a long, dark hall behind them all)

// the kit: string pads (three detuned oscillators per note through low-passes), felt piano (also reversed), bells,
// a low drum and a heartbeat
function soMusicKit(ctx, K) {
  if (K._music) return K._music;
  const fx = K.fx, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(); bus.connect(K.bus);
  const hall = fx.ir(6.5, { bright: 0.45, damp: 2.4, shape: 1.8, pre: 0.03, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.62;
  bus.connect(hall); hall.connect(wet); wet.connect(K.bus);
  const drumModes = (f) => [[f, 0.7, 1], [f * 1.51, 0.45, 0.5], [f * 1.99, 0.3, 0.35], [f * 2.44, 0.2, 0.2], [f * 3.1, 0.12, 0.12]];
  const M = {
    bus,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4, dest = bus) => {
      const b = fx.pianoBuf(soMidi(n)), len = Math.min(b.length, Math.ceil((dur + fade + 0.05) * fx.sr));
      return fx.play(b.subarray(0, len), t, dest, { vol: vel * 0.34, pan, stop: t + dur + fade, fade });
    },
    // a piano note played backwards: it swells up out of nothing and stops dead on its attack at tEnd
    rpiano(tEnd, n, vel, dur = 1.6, pan = 0) {
      const key = 'rp' + n + '_' + dur;
      if (!fx.cache[key]) {
        const b = fx.pianoBuf(soMidi(n)), L = Math.min(b.length, Math.ceil(dur * fx.sr)), y = new Float32Array(L + Math.ceil(0.01 * fx.sr));
        for (let i = 0; i < L; i++) { const u = i / L; y[L - 1 - i] = b[i] * Math.min(1, (1 - u) / 0.35); }
        for (let i = 0; i < 0.01 * fx.sr; i++) y[L + i] = y[L - 1] * (1 - i / (0.01 * fx.sr));
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], tEnd - dur, bus, { vol: vel * 0.34, pan });
    },
    bell: (t, n, vol, pan = 0, dest = bus) => fx.play(fx.bellBuf(soMidi(n)), t, dest, { vol: vol * 0.25, pan }),
    bellCut: (t, n, vol, d = 0.18, pan = 0) => fx.play(fx.bellBuf(soMidi(n)), t, bus, { vol: vol * 0.25, pan, stop: t + d, fade: 0.05 }),
    // a low drum (a timpani-like membrane): f the pitch, vol, soft = a wider mallet, dk = decay
    drum(t, vol, f = 36.7, soft = 1, dk = 1) {
      const key = 'drum' + f + '_' + soft + '_' + dk;
      if (!fx.cache[key]) {
        const y = fx.hit(drumModes(f).map(([a, tau, b]) => [a, tau * dk, b]), { width: 0.006 * soft, amp: 1, noise: 0.25, nlen: 0.02, nhp: 300, len: 3.2 * Math.max(dk, 0.3) });
        const pk = SOX.peak(y) || 1; for (let i = 0; i < y.length; i++) y[i] /= pk;
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
        const f = soHz(nn);
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
function soPulse(ctx, dest, t0, t1, notes, step, vol, o = {}) {
  if (t1 - t0 < step) return;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.q || 4;
  lp.frequency.setValueAtTime(o.cut || 600, t0); lp.frequency.linearRampToValueAtTime(o.cutTo || o.cut || 600, t1);
  lp.connect(g); g.connect(dest); g.gain.value = 0;
  notes.forEach((n, k) => {
    const os = ctx.createOscillator(); os.type = o.wave || 'sawtooth'; os.frequency.value = soHz(n); os.detune.setValueAtTime(k % 2 ? 6 : -6, t0);
    if (o.glide) os.detune.linearRampToValueAtTime((k % 2 ? 6 : -6) + o.glide, t1);
    os.connect(lp); os.start(t0); os.stop(t1 + 0.1);
  });
  for (let t = t0, i = 0; t < t1 - 0.01; t += (o.stepAt ? o.stepAt(t) : step), i++) {
    const acc = o.acc && i % o.acc === 0 ? 1.0 : 0.62, ramp = o.ramp ? o.ramp((t - t0) / (t1 - t0)) : 1, v = vol * 0.05 * acc * ramp, st = o.stepAt ? o.stepAt(t) : step;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.setTargetAtTime(0, t + 0.012, st * (o.decay || 0.28));
  }
}




// The score has thousands of oscillators; built all at once, the offline render visits every one of them every 128
// samples, long before most start, and crawls. So the kit's calls are only queued here, by start time, and each is
// built just before it is needed: the render pauses every 4 s (OfflineAudioContext.suspend) to build the next few
// seconds. Same sound either way (where suspend isn't available everything is built at once).
function soLazyScore(ctx, K, M) {
  const Q = [], raw = {}, later = (t, fn) => Q.push([t, Q.length, fn]);
  for (const k of ['piano', 'bell', 'bellCut', 'drum', 'strings']) { raw[k] = M[k]; M[k] = (t, ...a) => later(t, () => raw[k](t, ...a)); }
  raw.rpiano = M.rpiano; M.rpiano = (tEnd, n, vel, dur = 1.6, pan = 0) => later(tEnd - dur, () => raw.rpiano(tEnd, n, vel, dur, pan));
  const put = K.put; K.put = (x, t, o) => later(t, () => put(x, t, o));
  return {
    pulse: (...a) => later(a[2], () => soPulse(...a)),
    go() {
      Q.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      const W = 4, M0 = 0.75; let i = 0;
      const upTo = (T) => { while (i < Q.length && Q[i][0] < T) Q[i++][2](); };
      if (typeof ctx.suspend !== 'function' || typeof OfflineAudioContext === 'undefined' || !(ctx instanceof OfflineAudioContext)) { upTo(Infinity); return; }
      upTo(W + M0);
      for (let k = 1; k * W < ctx.length / ctx.sampleRate; k++) ctx.suspend(k * W).then(() => { upTo((k + 1) * W + M0); ctx.resume(); });
    },
  };
}

const SO_THEME = ['D5', 'A4', 'Bb4', 'E4'];   // the lullaby (its last step a tritone)
const SO_CH = {
  Dm9: ['D2', 'A2', 'F3', 'C4', 'E4'], Dm: ['D2', 'A2', 'D3', 'F3', 'A3'], Bbmaj7: ['Bb1', 'F2', 'D3', 'A3'], Gm9: ['G1', 'D2', 'Bb2', 'F3', 'A3'],
  Asus: ['A1', 'E2', 'D3', 'E3', 'A3'], A7b9: ['A1', 'E2', 'C#3', 'G3', 'Bb3'], Ebmaj7: ['Eb2', 'Bb2', 'D3', 'G3'], Fm9: ['F1', 'C2', 'Ab2', 'Eb3', 'G3'],
  open: ['D2', 'A2', 'E3', 'A3', 'E4'], low: ['D1', 'A1', 'D2'], sub: ['D1', 'D2'], dread: ['D1', 'Ab1', 'D2', 'Eb3', 'A3'], Cm9: ['C2', 'G2', 'Eb3', 'Bb3', 'D4'],
  glass: ['A5', 'Bb5', 'E6'], ghost: ['E6', 'F6', 'B6'], high: ['D6', 'Eb6', 'A6'], wide: ['D1', 'A1', 'E2', 'D3', 'A3', 'E4', 'F4', 'A4'],
};
const soOct = (n, k) => n.replace(/-?\d$/, (d) => String(+d + k));

soSound('music', 'score', function (ctx, bus, K) {
  const M = soMusicKit(ctx, K), C = SO_CH, c = soC, B = soB, W = soW, END = SO.end, fx = K.fx, sr = K.sr, r = new RNG(CONFIG.seed + 909);
  const LZ = soLazyScore(ctx, K, M), soPulse = LZ.pulse;   // (everything below is queued, then built just in time)
  // ---- devices
  // the lullaby on the felt piano: o.gap, o.oct, o.vol, o.n (notes)
  const theme = (t, o = {}) => SO_THEME.slice(0, o.n || 4).forEach((n, i) => M.piano(t + i * (o.gap || 0.85), soOct(n, o.oct || 0), (o.vol || 0.3) * (i === 3 ? 0.8 : 1), 3.2, [-0.25, 0.15, -0.1, 0.25][i]));
  // a swell of noise that stops dead at tEnd (a breath sucked in)
  const riser = (tEnd, d, v, curve = [300, 1300, 5200], q = 1.1) => { const n = Math.ceil(d * sr), w = soNoise(fx, n, 'pink'), f = Math.round(0.006 * sr);
    for (let i = 0; i < n; i++) { const u = i / n; w[i] *= Math.pow(u, 2.4) * Math.min(1, (n - i) / f); }
    soSweepPut(K, w, tEnd - d, 'bandpass', q, curve, { vol: v }); };
  // the scare: a deep boom, a low piano cluster, a scrape of high strings, bells that don't agree
  const hit = (t, v = 1, o = {}) => {
    M.drum(t, 1.0 * v, 29, 1.4, 2.2); M.drum(t + 0.008, 0.55 * v, 43, 1.2, 1.1);
    M.piano(t, 'A0', 0.75 * v, 5, -0.2); M.piano(t, 'Bb0', 0.6 * v, 5, 0.2); M.piano(t, 'E1', 0.4 * v, 4, 0);
    if (o.scrape !== false) M.strings(t, t + (o.len || 2.6), C.ghost, 0.55 * v, { att: 0.012, rel: (o.len || 2.6) * 0.8, cut: 7500, cutTo: 1400, cutAt: t + (o.len || 2.6), vib: 38 });
    M.bell(t, 'F6', 0.45 * v, -0.3); M.bell(t + 0.006, 'F#6', 0.35 * v, 0.3); M.bell(t + 0.012, 'C7', 0.25 * v, 0);
  };
  // a soft knock (a low note that lands): for a reveal
  const knock = (t, n = 'D2', v = 0.4) => { M.drum(t, 0.5 * v, 36.7, 1.4, 1.2); M.piano(t, n, v, 4); };
  // a glassy cluster held over a span
  const glass = (t0, t1, v = 0.18, notes = C.glass, o = {}) => M.strings(t0, t1, notes, v, Object.assign({ wave: 'sine', att: 1.8, rel: 1.6, cut: 9000, vib: 3 }, o));
  // a dark drone (sine + saw lanes, low-passed)
  const drone = (t0, t1, notes = C.low, v = 0.5, o = {}) => M.strings(t0, t1, notes, v, Object.assign({ wave: 'sawtooth', att: 2.0, rel: 1.5, cut: 260, vib: 0, wob: [6, 0.07] }, o));
  const sub = (t0, t1, v = 0.6, o = {}) => M.strings(t0, t1, C.sub, v, Object.assign({ wave: 'sine', att: 1.5, rel: 1.2, cut: 400, vib: 0 }, o));

  // ================================================================== 0 · the title: the world, then nothing
  // (nothing in the score while the world still sounds: the cut at 0.7 s takes everything)
  // the glass goes over (slow motion): a backwards piano and a swell, sucked away the instant it shatters
  { const tS = SO.tShatter;
    M.rpiano(tS, 'D6', 0.36, 1.4, 0.2); M.rpiano(tS, 'A5', 0.3, 1.1, -0.2); M.rpiano(tS, 'Eb5', 0.26, 0.9, 0);
    M.strings(SO.tKnock - 0.2, tS, C.glass, 0.34, { wave: 'sine', att: tS - SO.tKnock, rel: 0.02, cut: 9000, vib: 0 });
    riser(tS, 1.4, 0.22, [600, 2200, 7000], 0.9);
    // ...and then only a thin high note, under "What...?"
    glass(tS + 0.5, B('start') + 1.0, 0.08, ['A6'], { att: 1.8 }); }
  // ================================================================== 1 · the kitchen
  // 9:41 PM. Every sound stopped: a low drone, the lullaby
  { const t0 = B('start'), t1 = B('hello') + 0.2;
    drone(t0 - 0.4, t1 + 0.4, C.low, 0.5, { att: 1.0 });
    M.strings(t0, t1 + 0.6, C.Dm9, 0.28, { att: 1.8, rel: 1.2, cut: 900 });
    theme(c('start', 0) + 0.9, { vol: 0.32, gap: 0.95 });
    knock(c('start', 1) + 0.15, 'D1', 0.42); }
  // "Hello?": nobody answers (the score holds its breath: only a thin high note)
  glass(soVoice('y_hello').start + 0.6, B('text') + 0.6, 0.07, ['E6'], { att: 0.9 });
  // a text, from a number you don't know ("was that you?"): a low knock, a sour bell, a dread swell cut by the cut
  { const T0 = B('text'), T1 = B('room');
    knock(c('text', 0) + 0.1, 'Eb1', 0.5); M.bell(c('text', 0) + 0.12, 'A6', 0.25, 0.3);
    M.strings(T0, T1 + 0.03, C.dread, 0.4, { att: T1 - T0 - 0.2, rel: 0.03, cut: 600, cutTo: 1400, cutAt: T1 }); }
  // the news, the rain, the cat: a low note on each; "Nothing.": a cold cluster
  { const R0 = B('room');
    M.strings(R0, c('room', 1) + 1.5, C.Gm9, 0.24, { att: 1.0, rel: 1.0, cut: 800 });
    knock(R0 + 0.05, 'D2', 0.28); knock(W('room', 0, 'rain') - 0.12, 'Bb1', 0.26); knock(W('room', 0, 'cat') - 0.12, 'A1', 0.28);
    glass(c('room', 1) - 0.3, B('clap') + 0.2, 0.16, C.high, { att: 0.6, rel: 0.6 });
    sub(R0, B('clap') + 0.3, 0.4); }
  // a dead hush before the clap; after it: "You hear it." (bells, wonder and dread at once)
  { const tC = SO.tClap;
    M.bell(tC + 1.2, 'A5', 0.3, -0.3); M.bell(tC + 1.5, 'Bb5', 0.26, 0.3); M.bell(tC + 2.4, 'D6', 0.22, 0);
    M.strings(SO.tClap + 1.0, B('rule') + 0.5, C.Dm9, 0.3, { att: 1.5, rel: 0.8, cut: 1200 }); }
  // the pulse of air: a soft pulse, the score dipping for the second clap
  { const R0 = B('rule'), R1 = B('body');
    M.prog([[R0, C.Dm9], [SO.tClap2 + 0.5, C.Bbmaj7]], R1 + 0.3, 0.32, { cut: 1100 });
    soPulse(ctx, M.bus, R0 + 0.3, SO.tClap2 - 0.15, ['D3', 'A3'], 0.5, 0.45, { cut: 500, cutTo: 900, acc: 2 });
    soPulse(ctx, M.bus, SO.tClap2 + 0.6, R1, ['Bb2', 'F3'], 0.5, 0.4, { cut: 700, cutTo: 450, acc: 2, ramp: (u) => 1 - 0.7 * u }); }
  // your body: almost nothing in the score (a sub, a faint high cluster for "their own blood moving")
  { const B0 = B('body'), B1 = B('mum');
    sub(B0, B1 + 0.6, 0.42, { att: 2.5 });
    glass(c('body', 1) + 0.6, B1 + 0.8, 0.09, ['Eb6', 'E6'], { att: 2.5, vib: 6 }); }
  // Mum: the sad version (D minor, the lullaby whole); "Neither of you hears a thing": just the piano
  { const M0 = B('mum'), M1 = B('window');
    M.prog([[M0, C.Dm], [c('mum', 1), C.Bbmaj7], [soVoice('y_mum').start + 2.6, C.Gm9], [c('mum', 2), C.Asus]], M1 + 0.3, 0.38, { cut: 1100, att: 1.2 });
    M.piano(M0 + 0.3, 'D3', 0.32, 4); M.piano(c('mum', 1) + 0.1, 'Bb2', 0.3, 4);
    theme(c('mum', 2) + 0.4, { vol: 0.3, gap: 1.05 });
    M.piano(c('mum', 2) + 5.0, 'A2', 0.28, 3); }
  // ================================================================== 2 · the window: the pads open up
  { const W0 = B('window'), W1 = B('faces');
    M.prog([[W0, C.open], [c('window', 2), C.Dm9], [c('window', 3), C.Bbmaj7]], W1 + 0.5, 0.42, { cut: 900, cutTo: 2200, att: 1.6 });
    glass(soVoice('y_window').start + 1.5, W1 + 0.5, 0.12, ['A5', 'E6'], { att: 2.0 });
    // "about 500 metres" (a rising line of bells, going out); "Anyone with a window open can hear you": a low note
    ['D5', 'E5', 'A5', 'D6', 'E6'].forEach((n, i) => M.bell(c('window', 2) + 0.3 + i * 0.28, n, 0.22 * (1 - 0.1 * i), -0.4 + 0.2 * i));
    knock(c('window', 3) + 0.1, 'D1', 0.4); }
  // the windows across the park light up: a music-box note for each of the first; then a shimmer for the rest
  { if (!SO_FLATS.some((w) => w.on != null)) soFlatsSchedule();
    const on = SO_FLATS.filter((w) => w.on != null).map((w) => w.on).sort((a, b) => a - b), F0 = B('faces'), F1 = B('stairs');
    const notes = ['D6', 'A5', 'Bb5', 'E5', 'F5', 'D5', 'A5', 'C6', 'Bb5', 'E6', 'D6', 'A5'];
    on.slice(0, 14).forEach((t, i) => M.bell(t, notes[i % notes.length], 0.3 * (1 - 0.03 * i), [-0.5, 0.3, -0.2, 0.5, 0, -0.4, 0.4][i % 7]));
    glass(on[14] || F0 + 5, c('faces', 1) + 1.0, 0.12, ['D6', 'Eb6', 'A6', 'Bb6'], { att: 1.2, rel: 0.4 });
    M.strings(F0, F1 + 0.3, C.Dm9, 0.3, { att: 1.5, rel: 0.4, cut: 700 });
    // "They're all looking at yours.": a dread chord that swells and is cut off by the cut to the stairs
    M.strings(c('faces', 1), F1 + 0.05, C.dread, 0.5, { att: F1 - c('faces', 1) - 0.1, rel: 0.03, cut: 500, cutTo: 2500, cutAt: F1 });
    riser(F1 + 0.02, 3.0, 0.28); }
  // ================================================================== 3 · the stairwell
  { const S0 = B('stairs'), tOut = SO.tLightOut, tT = SO.tTurn;
    // the light's timer: a ticking pulse (muted plucks), a little faster as it runs out; it stops with the light
    for (let t = S0 + 0.6, i = 0; t < tOut - 0.05; t += 0.5 - 0.12 * soSm(t, S0 + 6, tOut), i++) { M.bellCut(t, i % 4 === 0 ? 'D6' : 'A5', 0.16 + 0.03 * (i % 4 === 0), 0.06, i % 2 ? 0.2 : -0.2); }
    drone(S0, tOut + 0.05, C.low, 0.42, { att: 1.5, rel: 0.05 });
    M.strings(S0 + 0.4, tOut + 0.03, C.Gm9, 0.26, { att: 2.0, rel: 0.03, cut: 800 });
    theme(c('stairs', 0) + 0.8, { vol: 0.22, gap: 0.8, oct: 1 });
    // the light goes out: the score with it; only a sub left, and then the riser into the turn
    sub(tOut + 0.3, tT + 0.05, 0.5, { att: 2.0, rel: 0.05 });
    glass(c('behind', 0) - 0.4, tT, 0.1, ['Eb6', 'E6', 'F6'], { att: 2.0, rel: 0.02, vib: 12 });
    riser(tT - 0.1, 2.4, 0.3);
    // you turn: he's right there
    hit(tT - 0.1, 1.0);
    // "God! ...You scared me.": a low pulse; "He can hear you. You can't hear him.": dread; "He types something."
    drone(tT + 0.4, B('street') + 0.3, C.dread, 0.48, { att: 1.5 });
    soPulse(ctx, M.bus, c('behind', 2), B('street'), ['D2', 'Ab2'], 0.62, 0.55, { cut: 380, cutTo: 700, acc: 2 });
    M.piano(c('behind', 3) + 0.2, 'Bb4', 0.26, 3); M.piano(c('behind', 3) + 1.1, 'E4', 0.24, 3);
    // the phone: "DON'T SHOUT."
    knock(c('behind', 3) + 1.8, 'D1', 0.35); }
  // ================================================================== 4 · the street: cold and wide
  { const S0 = B('street'), S1 = B('car');
    M.prog([[S0, C.Gm9], [c('street', 1), C.Ebmaj7]], S1 + 0.1, 0.36, { cut: 900, att: 2.0 });
    glass(S0 + 1.0, S1, 0.1, ['D6', 'G6'], { att: 2.5 });
    // the alarm, the dog: a backwards note that swells to where its sound should be, and nothing
    M.rpiano(W('street', 1, 'alarms') + 0.3, 'F5', 0.24, 1.2, 0.3); M.rpiano(W('street', 1, 'dog') + 0.4, 'B4', 0.24, 1.2, -0.3); }
  // the kerb: the score drops out as you step off; the car: a hit; then a low pulse under the facts
  { const C0 = B('car'), C1 = B('warn'), tC = SO.tCar;
    sub(C0, SO.tKerb + 0.1, 0.4, { rel: 0.05 });
    hit(tC - 0.05, 0.75, { len: 1.8 });
    drone(tC + 0.6, C1 + 0.3, C.dread, 0.42, { att: 1.5 });
    soPulse(ctx, M.bus, c('car', 1), C1, ['D2', 'A2'], 0.55, 0.42, { cut: 400, cutTo: 650, acc: 4 }); }
  // the ambulance: a cold high fifth held over it (no wail: nothing here may sound like a siren); "none of them work":
  // it slides down and dies
  { const A0 = B('warn'), A1 = B('heads'), tDie = c('warn', 2);
    M.strings(A0 + 0.3, tDie + 2.4, ['A5', 'E6'], 0.3, { wave: 'triangle', att: 1.6, rel: 2.0, cut: 3000, cutTo: 900, cutAt: tDie + 2.4, vib: 3, glide: -1500, glideFrom: tDie, glideAt: tDie + 2.4 });
    M.prog([[A0, C.Dm9], [c('warn', 1), C.Bbmaj7], [tDie, C.A7b9]], A1 + 0.2, 0.32, { cut: 900 });
    knock(tDie + 0.1, 'A1', 0.35); }
  // "Can anyone hear me?": every head turns (a slow dread swell); the lullaby, high and thin
  { const H0 = B('heads'), H1 = B('storm');
    drone(c('heads', 1) - 0.4, H1 + 0.3, C.dread, 0.48, { att: 2.6, cut: 300, cutTo: 900, cutAt: c('heads', 2) });
    glass(c('heads', 1), H1 + 0.2, 0.14, ['D6', 'Eb6'], { att: 2.0, vib: 8 });
    theme(c('heads', 2) + 0.4, { vol: 0.22, gap: 0.9, oct: 1 }); }
  // the storm: a flash of high bells; under the count, one held note; then a swell that builds for the thunder and
  // stops dead at "It never comes" — and the score with it, for four seconds of nothing (no drums: nothing here may
  // sound like the thunder that never comes)
  { const tB = SO.tBolt, tNever = c('storm', 3);
    ['D7', 'Eb7', 'A6', 'Bb6'].forEach((n, i) => M.bell(tB + 0.02 + i * 0.012, n, 0.32, -0.4 + 0.27 * i));
    M.strings(tB + 0.3, c('storm', 2) + 0.5, ['A2', 'E3', 'A3'], 0.3, { att: 1.5, rel: 0.8, cut: 700 });
    M.strings(c('storm', 2), tNever - 0.02, C.dread, 0.45, { att: tNever - c('storm', 2) - 0.2, rel: 0.02, cut: 300, cutTo: 1100, cutAt: tNever });
    glass(c('storm', 2) + 0.4, tNever - 0.02, 0.12, ['D6', 'Eb6', 'A6'], { att: tNever - c('storm', 2) - 0.5, rel: 0.02, vib: 10 }); }
  // ================================================================== 5 · the park
  // the middle of the park: the pads open out; "If anyone else can still make a sound, they'll answer": hope, then
  // silence before your shout
  { const P0 = B('park'), tS = SO.tShout;
    M.strings(P0 + 0.2, tS - 1.4, C.open, 0.4, { att: 2.6, rel: 1.0, cut: 900, cutTo: 1600 });
    glass(P0 + 1.0, tS - 1.6, 0.1, ['A5', 'E6'], { att: 2.0 });
    M.prog([[c('park', 1) - 0.2, C.Dm9]], tS - 1.4, 0.26, { cut: 1000, att: 1.2 });
    M.bell(c('park', 1) + 0.3, 'A5', 0.22, -0.2); M.bell(c('park', 1) + 1.1, 'D6', 0.2, 0.2); }
  // the shout: nothing but you and your echoes; then a deep swell; "Your own voice is the only answer": the lullaby, low
  { const tS = SO.tShout, X0 = tS + 3.6, X1 = B('far');
    drone(X0, X1 + 0.3, C.low, 0.55, { att: 2.5 });
    M.prog([[X0 + 0.4, C.Dm], [c('shout', 2), C.Bbmaj7], [c('shout', 3), C.Gm9]], X1 + 0.3, 0.36, { cut: 900, att: 2.0 });
    theme(c('shout', 3) + 0.3, { vol: 0.32, gap: 1.0, oct: -1 }); }
  // 5 km: a slow, enormous chord rising; "about 400,000 people just heard you": a hit, soft
  { const F0 = B('far'), F1 = B('coming');
    M.strings(F0, F1 + 0.4, C.wide, 0.55, { att: 3.5, rel: 1.2, cut: 600, cutTo: 2600, cutAt: c('far', 1) });
    glass(c('far', 0) + 1.5, F1 + 0.3, 0.12, ['D6', 'A6'], { att: 2.0 });
    knock(c('far', 1) + 0.1, 'D1', 0.55); M.drum(c('far', 1) + 0.1, 0.4, 29, 1.6, 2.0); }
  // they come: a slow low boom under a building pulse (half walking pace, so it never reads as their steps); cut dead
  // as you run into the dark
  { const C0 = B('coming'), C1 = B('hide');
    for (let t = c('coming', 1) - 0.3, i = 0; t < C1 - 0.05; t += 1.12, i++) M.drum(t, (0.18 + 0.32 * soSm(t, c('coming', 1), C1)) * (i % 2 ? 0.7 : 1), 46, 1.5, 0.55);
    soPulse(ctx, M.bus, c('coming', 0), C1, ['D2', 'A2', 'D3'], 0.28, 0.6, { cut: 380, cutTo: 1400, acc: 2, ramp: (u) => 0.35 + 0.65 * u });
    M.prog([[C0, C.Dm], [c('coming', 1), C.Bbmaj7], [c('coming', 2), C.A7b9]], C1 + 0.04, 0.42, { cut: 900, cutTo: 2000, att: 1.0, lastRel: 0.03 });
    glass(c('coming', 2), C1 + 0.02, 0.16, C.ghost, { att: 2.0, rel: 0.02, vib: 14 }); }
  // ================================================================== 6 · the dark
  // hiding: a sub and a hush; you don't hear the dog: a hit
  { const H0 = B('hide'), tD = SO.tDog;
    sub(H0 + 0.6, tD + 0.2, 0.42, { att: 3.0, rel: 0.1 });
    glass(H0 + 2.0, tD, 0.06, ['E6', 'F6'], { att: 3.0, rel: 0.02, vib: 10 });
    hit(tD - 0.04, 0.95);
    drone(tD + 0.8, B('echo') + 0.6, C.dread, 0.45, { att: 1.5 });
    soPulse(ctx, M.bus, tD + 1.0, B('echo'), ['D2', 'Ab2'], 0.36, 0.5, { cut: 420, acc: 2, ramp: (u) => 1 - 0.6 * u }); }
  // the echo pictures: glass and air; "Something else. 7 metres.": dread under it; "People.": a knock; "Dozens.": the
  // whole dread chord, swelling
  { const E0 = B('echo'), E1 = B('who');
    glass(E0, c('echo', 3), 0.13, ['A5', 'E6', 'B6'], { att: 2.5, rel: 1.0, vib: 4 });
    M.strings(E0 + 0.5, c('echo', 3) + 0.5, C.open, 0.28, { att: 2.5, rel: 1.0, cut: 700 });
    drone(c('echo', 3) - 0.3, E1 + 0.4, C.dread, 0.5, { att: 2.0, cut: 260, cutTo: 900, cutAt: c('echo', 5) + 2 });
    M.piano(c('echo', 3) + 0.3, 'Eb2', 0.35, 4); M.piano(c('echo', 3) + 0.32, 'A2', 0.3, 4);
    knock(c('echo', 4) - 0.05, 'D1', 0.5);
    glass(c('echo', 5) - 0.5, E1 + 0.2, 0.2, C.ghost, { att: 3.0, rel: 0.4, vib: 12 });
    theme(c('echo', 5) + 1.2, { vol: 0.2, gap: 1.1, oct: 1 }); }
  // "Who's there?": a low hit as they all step closer; then a long crescendo, a riser, and the last hit when you turn
  // and the click finds him right behind you; held, rising, to the hard cut on the last frame
  { const tW = soVoice('y_who').start, tStep = tW + 9.5 / SOP.c + 0.75, tQ = SO.tClicks[SO.tClicks.length - 1], tR = tQ + SO_BEHIND.d1 / SO_ECHO_V;
    knock(tStep, 'Ab1', 0.5); M.drum(tStep, 0.35, 33, 1.5, 1.6);
    drone(tStep + 0.2, tR + 0.05, C.dread, 0.55, { att: 3.0, rel: 0.03, cut: 300, cutTo: 1300, cutAt: tR });
    M.strings(c('who', 2) - 0.5, tR + 0.03, C.ghost, 0.32, { att: tR - c('who', 2), rel: 0.02, cut: 2000, cutTo: 8000, cutAt: tR, vib: 16 });
    riser(tR, 3.4, 0.36);
    hit(tR, 1.15, { len: END - tR + 1 });
    // held to the end: a high dissonance and a sub, rising
    M.strings(tR + 0.3, END + 0.3, ['D6', 'Eb6', 'A6'], 0.3, { att: END - tR - 0.6, rel: 0.02, cut: 4000, cutTo: 9000, cutAt: END, vib: 20 });
    sub(tR + 0.1, END + 0.3, 0.6, { att: 1.0, rel: 0.02 }); }
  LZ.go();
});
