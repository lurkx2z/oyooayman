/* =====================================================================
   SOUND · MUSIC — an original score in D minor, all synthesised (the kit of the Slower light and Universe films,
   renamed nt*): string pads, a felt piano, bells, a low drum. It stays out of the way: a memorial, not a thriller.
     the descent   four notes going down, A–G–F–E, and home to D: the way out was down. It is heard over the title,
                   in the glow of the painted steps, warm in "We're okay", low under the firefighters, alone in the
                   grey, and whole over the empty stairway
     the climb     the firefighters' line: rising, slow, low strings, against the descent
     the light     at the end the descent turns round and rises, D–F–A–D, into D major, under the Tribute in Light
   The shape: a quiet, ordinary morning (light piano); silence before 8:46 and none after it until "You don't know it
   yet"; a low drone into the stairs; the glow; a held breath at 9:03; warmth in the calm; the firefighters; faster as
   the crowd thins; a held high note in the mezzanine ("Don't look outside"); open air on the street; the towers
   burning; NO music under the roar, the cloud, or 10:28; the theme alone in the grey; the empty stairway; one note per
   number; the light.
   ===================================================================== */

// the kit: string pads (three detuned oscillators per note through low-passes), felt piano (also reversed), bells,
// a low drum and a heartbeat
function ntMusicKit(ctx, K) {
  if (K._music) return K._music;
  const fx = K.fx, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(); bus.connect(K.bus);
  const hall = fx.ir(4.2, { bright: 0.5, damp: 2.8, shape: 2.0, pre: 0.025, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.55;
  bus.connect(hall); hall.connect(wet); wet.connect(K.bus);
  const drumModes = (f) => [[f, 0.7, 1], [f * 1.51, 0.45, 0.5], [f * 1.99, 0.3, 0.35], [f * 2.44, 0.2, 0.2], [f * 3.1, 0.12, 0.12]];
  const M = {
    bus,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4, dest = bus) => {
      const b = fx.pianoBuf(ntMidi(n)), len = Math.min(b.length, Math.ceil((dur + fade + 0.05) * fx.sr));
      return fx.play(b.subarray(0, len), t, dest, { vol: vel * 0.34, pan, stop: t + dur + fade, fade });
    },
    // a piano note played backwards: it swells up out of nothing and stops dead on its attack at tEnd
    rpiano(tEnd, n, vel, dur = 1.6, pan = 0) {
      const key = 'rp' + n + '_' + dur;
      if (!fx.cache[key]) {
        const b = fx.pianoBuf(ntMidi(n)), L = Math.min(b.length, Math.ceil(dur * fx.sr)), y = new Float32Array(L + Math.ceil(0.01 * fx.sr));
        for (let i = 0; i < L; i++) { const u = i / L; y[L - 1 - i] = b[i] * Math.min(1, (1 - u) / 0.35); }
        for (let i = 0; i < 0.01 * fx.sr; i++) y[L + i] = y[L - 1] * (1 - i / (0.01 * fx.sr));
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], tEnd - dur, bus, { vol: vel * 0.34, pan });
    },
    bell: (t, n, vol, pan = 0, dest = bus) => fx.play(fx.bellBuf(ntMidi(n)), t, dest, { vol: vol * 0.25, pan }),
    // a bell cut short (something going over the edge: its sound stops, the hall keeps a little of it)
    bellCut: (t, n, vol, d = 0.18, pan = 0) => fx.play(fx.bellBuf(ntMidi(n)), t, bus, { vol: vol * 0.25, pan, stop: t + d, fade: 0.05 }),
    // a low drum (a timpani-like membrane): f the pitch, vol, soft = a wider mallet, dk = decay
    drum(t, vol, f = 36.7, soft = 1, dk = 1) {
      const key = 'drum' + f + '_' + soft + '_' + dk;
      if (!fx.cache[key]) {
        const y = fx.hit(drumModes(f).map(([a, tau, b]) => [a, tau * dk, b]), { width: 0.006 * soft, amp: 1, noise: 0.25, nlen: 0.02, nhp: 300, len: 3.2 * Math.max(dk, 0.3) });
        const pk = NTX.peak(y) || 1; for (let i = 0; i < y.length; i++) y[i] /= pk;
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
        const f = ntHz(nn);
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
function ntPulse(ctx, dest, t0, t1, notes, step, vol, o = {}) {
  if (t1 - t0 < step) return;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.q || 4;
  lp.frequency.setValueAtTime(o.cut || 600, t0); lp.frequency.linearRampToValueAtTime(o.cutTo || o.cut || 600, t1);
  lp.connect(g); g.connect(dest); g.gain.value = 0;
  notes.forEach((n, k) => {
    const os = ctx.createOscillator(); os.type = o.wave || 'sawtooth'; os.frequency.value = ntHz(n); os.detune.setValueAtTime(k % 2 ? 6 : -6, t0);
    if (o.glide) os.detune.linearRampToValueAtTime((k % 2 ? 6 : -6) + o.glide, t1);
    os.connect(lp); os.start(t0); os.stop(t1 + 0.1);
  });
  for (let t = t0, i = 0; t < t1 - 0.01; t += (o.stepAt ? o.stepAt(t) : step), i++) {
    const acc = o.acc && i % o.acc === 0 ? 1.0 : 0.62, ramp = o.ramp ? o.ramp((t - t0) / (t1 - t0)) : 1, v = vol * 0.05 * acc * ramp, st = o.stepAt ? o.stepAt(t) : step;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.setTargetAtTime(0, t + 0.012, st * (o.decay || 0.28));
  }
}

const NT_CHD = {
  Dm: ['D2', 'A2', 'F3', 'A3', 'D4'], Dm9: ['D2', 'A2', 'F3', 'C4', 'E4'], Dlow: ['D1', 'A1', 'D2'],
  Bbmaj7: ['Bb1', 'F2', 'D3', 'A3', 'D4'], F: ['F1', 'C2', 'A2', 'C3', 'F3'], Fmaj7: ['F2', 'C3', 'E3', 'A3', 'C4'],
  C: ['C2', 'G2', 'E3', 'G3', 'C4'], Gm: ['G1', 'D2', 'Bb2', 'D3', 'G3'], Gm9: ['G1', 'D2', 'Bb2', 'F3', 'A3'],
  Asus: ['A1', 'E2', 'D3', 'E3', 'A3'], Dmaj: ['D2', 'A2', 'F#3', 'A3', 'D4'], DmajHi: ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4', 'F#4', 'A4'],
};
const NT_THEME = ['A4', 'G4', 'F4', 'E4'];
const ntOct = (n, k) => n.replace(/-?\d$/, (d) => String(+d + k));

ntSound('music', 'score', function (ctx, bus, K) {
  const M = ntMusicKit(ctx, K), C = NT_CHD, cap = (id, k) => ntCap(id, k).show;
  // the descent: its four notes from t, dt apart (bells, or piano with o.piano; o.oct shifts it), then o.home
  const descent = (t, dt, vol, o = {}) => {
    let tt = t;
    NT_THEME.forEach((n, i) => {
      const nn = ntOct(n, o.oct || 0), pan = (o.pan || 0) + (i % 2 ? 0.18 : -0.18);
      if (o.piano) M.piano(tt, nn, vol * (i ? 0.88 : 1), o.dur || 2.4, pan); else M.bell(tt, nn, vol * (i ? 0.88 : 1), pan);
      tt += dt;
    });
    const home = ntOct(o.home || 'D4', o.oct || 0);
    if (o.home !== null) { tt += dt * 0.35; if (o.piano) M.piano(tt, home, vol * 0.95, (o.dur || 2.4) * 1.5, 0); else M.bell(tt, home, vol, 0); }
    return tt;
  };

  // ---- the title: a low D, the descent in bells, a pad that opens
  M.piano(0.25, 'D2', 0.3, 4, 0);
  M.strings(0, NT.morning + 1.2, C.Dm9, 0.38, { att: 2.2, rel: 1.4, cut: 900, cutTo: 1500 });
  descent(0.9, 0.62, 0.22, { home: 'D4', oct: 1 });

  // ---- the morning: light, ordinary; a little piano under the office
  {
    const steps = [[NT.morning, C.Fmaj7], [cap('morning', 1) - 0.2, C.C], [NT.sky + 3.4, C.Dm9], [NT.tower + 2.0, C.Bbmaj7], [NT.windows + 0.4, C.Fmaj7]];
    M.prog(steps, ntCap('windows', 1).hide + 0.3, 0.3, { cut: 1300, lastRel: 1.6 });
    const fig = [0, 2, 4, 2, 3, 2, 4, 1];
    for (let t = NT.morning + 0.6, i = 0; t < NT.windows + 3; t += 0.46, i++) {
      let ch = steps[0][1]; for (const [ts, c] of steps) if (t >= ts) ch = c;
      const pcs = ch.slice(1).map((n) => ntOct(n, 1));
      M.piano(t, pcs[fig[i % 8] % pcs.length], 0.085 * (i % 4 === 0 ? 1.25 : 1), 1.3, i % 2 ? 0.25 : -0.25, 0.3);
    }
    // "The architect was afraid of heights": the figure stops, one high note, then nothing before 8:46
    M.bell(cap('windows', 1) + 0.1, 'E6', 0.12, 0.3);
  }
  // (8:46: no music. The next note is "You don't know it yet.")

  // ---- what you don't know: a low drone; a low note on the floors; a dark cluster on "all three stairways are gone"
  M.strings(NT.known - 0.4, NT.glow + 0.8, C.Dlow, 0.5, { att: 2.0, rel: 1.2, cut: 300, wave: 'sine', vib: 2 });
  M.piano(cap('known', 1) + 0.05, 'D2', 0.3, 4, 0);
  M.strings(cap('known', 2) - 0.2, NT.stair + 1.5, ['Eb3', 'D4'], 0.13, { att: 1.5, rel: 1.0, cut: 800, wave: 'triangle', vib: 4 });
  M.piano(cap('known', 2) + 0.05, 'Bb1', 0.26, 4, 0);

  // ---- 2 · the stairs
  M.strings(NT.stair, NT.glow + 0.5, C.Dm, 0.32, { att: 2.0, rel: 1.0, cut: 700 });
  // the glow: the descent in bells, high; again on the piano, "Today it leads you down"
  M.prog([[NT.glow, C.Bbmaj7], [cap('glow', 1) - 0.2, C.F]], NT.pace + 0.4, 0.36, { cut: 1100, att: 1.4 });
  descent(cap('glow', 0) + 0.3, 0.68, 0.24, { oct: 1, home: 'D4' });
  descent(cap('glow', 1) + 0.1, 0.5, 0.2, { piano: true, home: 'D4', dur: 1.8 });
  // the pace: a quiet pulse at walking speed; the kerosene: the chord leans
  M.prog([[NT.pace, C.Gm9], [cap('pace', 1) - 0.2, C.Asus]], ntCap('second', 0).show - 0.3, 0.34, { cut: 800 });
  ntPulse(ctx, M.bus, NT.pace + 0.4, ntCap('second', 0).show - 0.4, ['D2', 'A2'], 0.56, 0.5, { cut: 500, ramp: (u) => Math.sin(Math.PI * Math.min(1, u * 1.4)) });
  // 9:03: a held high note, the shake (a low drum under the sound effects); the second plane: a dark chord
  M.strings(ntCap('second', 0).show - 0.3, NT.shake + 0.2, ['A5'], 0.05, { att: 1.2, rel: 0.15, cut: 6000, wave: 'sine', vib: 3 });
  M.drum(NT.shake, 0.55, 36.7, 1.8, 1.2);
  M.strings(cap('second', 2) - 0.3, NT.calm + 0.6, C.Gm, 0.36, { att: 1.2, rel: 1.0, cut: 650 });
  M.piano(cap('second', 2) + 0.05, 'G1', 0.28, 4, 0);
  M.bell(cap('second', 3) + 0.2, 'D6', 0.12, -0.3);
  // the calm: warm; the descent on the piano, home to F; "We're okay. Keep going.": a rising answer
  M.prog([[NT.calm, C.F], [cap('calm', 1) - 0.2, C.C], [cap('calm', 2) - 0.2, C.Dm9], [cap('calm', 2) + 2.0, C.Bbmaj7]], NT.right + 0.5, 0.42, { cut: 1300, att: 1.2 });
  descent(cap('calm', 0) + 0.2, 0.7, 0.22, { piano: true, home: 'F4', dur: 2.2 });
  ['D4', 'F4', 'A4'].forEach((n, i) => M.piano(cap('calm', 2) + 0.15 + i * 0.4, n, 0.17, 2.5, -0.2 + 0.2 * i));
  // "Stay to the right!": tension under the hurt man going past
  M.prog([[NT.right, C.Gm9], [cap('right', 1) - 0.2, C.Asus]], NT.transfer + 0.4, 0.36, { cut: 850 });
  ntPulse(ctx, M.bus, NT.right + 0.3, NT.transfer, ['D2', 'A2'], 0.48, 0.45, { cut: 450 });
  // the transfer hallway: low and still
  M.strings(NT.transfer, NT.ff + 0.4, C.Dm9, 0.28, { att: 1.0, rel: 0.8, cut: 650 });
  M.piano(NT.transfer + 0.75, 'D3', 0.16, 3, -0.2); M.piano(cap('transfer', 1) + 0.1, 'A2', 0.16, 3, 0.2);
  // the firefighters: the climb, a slow line rising in the low strings, under a darkening pad; then the descent low
  // on the piano against it ("Everyone else is going down"); a swell as you let them pass
  {
    const f0 = cap('ff', 0);
    M.drum(f0 - 0.05, 0.4, 36.7, 2.0, 1.4);
    M.prog([[NT.ff, C.Dm], [cap('ff', 2) - 0.2, C.Bbmaj7], [cap('ff', 3) - 0.2, C.Gm], [NT.ff2, C.Dm9], [cap('ff2', 1) - 0.2, C.Bbmaj7], [cap('ff2', 1) + 1.8, C.F]], NT.water + 0.8, 0.46, { cut: 900, cutTo: 1500, att: 1.5, lastRel: 2.0 });
    ['D2', 'E2', 'F2', 'G2', 'A2', 'Bb2', 'C3', 'D3'].forEach((n, i) => { const t = f0 + i * 2.6; M.strings(t, t + 3.4, [n], 0.26, { att: 1.2, rel: 1.2, cut: 700, vib: 4 }); });
    descent(cap('ff2', 0) + 0.1, 0.9, 0.24, { piano: true, oct: -1, home: 'D4', dur: 2.6 });
    M.bell(cap('ff2', 1) + 0.6, 'A5', 0.14, 0.2); M.bell(cap('ff2', 1) + 1.8, 'F5', 0.12, -0.2);
  }
  // water: sparse, single high notes like drops
  M.strings(NT.water, NT.thin + 0.3, C.Dm, 0.22, { att: 1.0, rel: 0.6, cut: 550 });
  [['D5', 0.9], ['A4', 3.4], ['F5', 6.0], ['E5', 7.9]].forEach(([n, dt]) => M.piano(NT.water + dt, n, 0.12, 2.5, Math.sin(dt) * 0.4));
  // the crowd thins: the piano moves faster, rising, into the mezzanine
  {
    M.prog([[NT.thin, C.F], [cap('thin', 1) - 0.2, C.C]], NT.mezz + 0.15, 0.4, { cut: 1100, cutTo: 2000, rel: 0.15 });
    const fig = ['D4', 'F4', 'A4', 'C5', 'A4', 'F4', 'E4', 'G4'];
    for (let t = NT.thin + 0.4, i = 0; t < NT.mezz - 0.1; t += 0.3 - 0.06 * ntEv(t, NT.thin, NT.mezz), i++) M.piano(t, fig[i % 8], 0.1 + 0.08 * ntEv(t, NT.thin, NT.mezz), 0.8, i % 2 ? 0.25 : -0.25, 0.2);
  }

  // ---- 3 · the mezzanine: a held high note and a low drone; "Don't look outside": low strings swell; the concourse
  M.strings(NT.mezz, NT.esc + 0.5, ['A5'], 0.05, { att: 0.8, rel: 1.0, cut: 6000, wave: 'sine', vib: 3 });
  M.strings(NT.mezz, NT.five + 0.3, C.Dlow, 0.42, { att: 1.5, rel: 1.2, cut: 280, wave: 'sine', vib: 2 });
  M.strings(cap('police', 0) - 0.2, NT.esc + 0.4, C.Gm, 0.38, { att: 1.8, rel: 1.2, cut: 520 });
  M.piano(cap('police', 1) + 0.05, 'D2', 0.26, 4, 0);
  M.strings(NT.esc, NT.five + 0.2, C.Dm9, 0.28, { att: 1.0, rel: 0.9, cut: 700 });
  ntPulse(ctx, M.bus, NT.conc, NT.five - 0.3, ['D2', 'A2'], 0.5, 0.4, { cut: 420 });
  // ---- the street: open air; "You look back": a swell; it falls away before 9:59
  M.strings(NT.five, NT.back + 0.4, C.Fmaj7, 0.26, { att: 1.8, rel: 1.0, cut: 2000 });
  [['A5', 1.6], ['E5', 4.4], ['C6', 7.6]].forEach(([n, dt]) => M.bell(NT.five + dt, n, 0.09, Math.cos(dt) * 0.5));
  M.prog([[NT.back, C.Dm], [cap('back', 1) - 0.2, C.Bbmaj7]], NT.roarShot - 0.1, 0.5, { cut: 1000, cutTo: 2200, att: 1.0, lastRel: 2.2 });
  M.piano(cap('back', 0) + 0.05, 'D2', 0.28, 4, 0); M.piano(cap('back', 1) + 0.05, 'Bb1', 0.28, 4, 0);
  // (9:59, the roar, the cloud: no music. "Then silence.")

  // ---- the grey: the descent alone, high and slow; under the walk, a low pad; "Your tower is still standing."
  descent(cap('grey', 1) + 0.2, 1.3, 0.18, { piano: true, oct: 1, home: 'D4', dur: 3 });
  M.strings(cap('grey', 1) - 0.4, NT.fallShot + 0.3, C.Dm9, 0.2, { att: 2.5, rel: 1.6, cut: 520 });
  M.piano(cap('walk', 1) + 0.1, 'A3', 0.12, 3, -0.15); M.piano(cap('walk', 1) + 0.12, 'D4', 0.1, 3, 0.15);
  // (10:28: no music under the fall.) "It stood for 102 minutes": one low note
  M.piano(cap('ten28', 2) + 0.1, 'D2', 0.26, 5, 0);
  M.strings(cap('ten28', 2), NT.out + 0.5, C.Dm, 0.16, { att: 1.5, rel: 1.0, cut: 420 });

  // ---- 4 · the empty stairway: the descent whole, slow, on the piano; the climb once more, quietly
  {
    M.prog([[NT.out, C.Dm9], [cap('out', 1) - 0.2, C.F], [cap('how', 0) - 0.2, C.Bbmaj7], [cap('how', 1) - 0.2, C.Gm9], [cap('how', 1) + 1.9, C.Asus]], NT.cost + 0.2, 0.4, { cut: 1100, att: 1.6, lastRel: 1.4 });
    descent(cap('out', 0) + 0.2, 0.9, 0.22, { piano: true, home: 'D4', dur: 3 });
    descent(cap('how', 0) + 0.15, 0.85, 0.2, { piano: true, home: 'F4', dur: 3 });
    ['D3', 'E3', 'F3', 'G3'].forEach((n, i) => { const t = cap('how', 1) + i * 0.9; M.strings(t, t + 1.8, [n], 0.18, { att: 0.7, rel: 0.8, cut: 800, vib: 4 }); });
  }
  // ---- the numbers: one note for each, in the dark
  M.strings(NT.cost + 0.4, NT.light + 0.6, ['D1'], 0.18, { att: 2.0, rel: 1.2, cut: 200, wave: 'sine', vib: 1 });
  [['D2', 'D5', 0], ['A1', 'A4', 1], ['F2', 'F4', 2]].forEach(([lo, hi, k]) => { const t = cap('cost', k) + 0.05; M.piano(t, lo, 0.24, 4, 0); M.bell(t + 0.02, hi, 0.1, 0); });
  // ---- the light: the descent turns round and rises, D–F–A–D, into D major; the card; then quiet
  {
    const t0 = cap('light', 0);
    M.piano(t0, 'D2', 0.3, 5, 0);
    ['D5', 'F5', 'A5', 'D6'].forEach((n, i) => M.bell(t0 + 0.2 + i * 0.75, n, 0.22 * (i === 3 ? 1.15 : 1), -0.3 + 0.2 * i));
    M.prog([[NT.light, C.Dm], [t0 + 1.7, C.Bbmaj7], [NT.card - 1.2, C.Dmaj]], NT.end - 0.2, 0.46, { cut: 1100, cutTo: 2400, att: 2.0, lastRel: 4.5 });
    M.piano(NT.card - 1.15, 'D3', 0.22, 5, 0);
    ['D4', 'F#4', 'A4', 'D5'].forEach((n, i) => M.piano(NT.card + 1.3 + i * 0.7, n, 0.14, 4, -0.2 + 0.13 * i));
  }
});
