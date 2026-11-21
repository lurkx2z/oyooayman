/* =====================================================================
   SOUND · MUSIC — an original score, all synthesised (the music kit of the gravity films, via the light films and
   the air-thinner film): string pads, a felt piano (also played backwards, so notes swell up out of nothing), glass
   bells, a low drum, a synth pulse, the endless rise. Its idea is the film's: the sea climbs and doesn't stop, so the
   theme climbs too. It is five notes rising a step at a time (A C D E F) and it never comes back down: each time it
   returns it starts one step higher, until the last time, on the roof, it stops on the step it can't take.
     the start     D minor, a drone, the theme's first rise; "It doesn't.": a cold chord; the clock: a low toll
     the boat      the pulse; the line straining; "no way off the rock": a hit
     the rule      a vast cold chord, the endless rise under it, sparse bells
     height        the theme a step higher; lichen: the pad thins
     Isla          her motif (F A C, the G it longs for); "Now.": a hit, the pulse quickens
     the radio     a low cluster
     the bell      the score rings with the buoy's bell, then drops out when its chain runs out
     the world     drums, the strings rising; 10 metres: a hit
     the fog       a drone on the horn's own note; after its last blast, the cellos hold that note
     your house    the theme a step higher again, on the piano, alone
     the island    the biggest swell so far
     the door      the pulse doubles, the endless rise; it gives: a hit and silence
     the dark      a low drone; "All but the lamp": one warm high chord
     the stairs    a driving ostinato and a toll for every step the sea climbs (one every 11 s)
     the town      Isla's motif, then every light goes out and so does the music
     the lights    a thin high pad; "Yours is the last light": warm
     the ship, ice slow, vast; the rise again
     the hill      Isla's motif in D major, with bells: the one warm place in the film
     the lie       the piano alone
     watch, ladder the pulse, the rise
     the gallery   the theme high in the strings, over the open sea
     the lamp      the whole score goes under the water with it (a closing low-pass)
     the roof      the theme's last rise, on the piano, stopping a step short
     the question  one bell, cut on the last frame
   ===================================================================== */

// the kit: string pads (three detuned oscillators per note through low-passes), felt piano (also reversed), bells,
// a low drum
function ocMusicKit(ctx, K, dest) {
  if (K._music) return K._music;
  const fx = K.fx, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(); bus.connect(dest);
  const hall = fx.ir(4.8, { bright: 0.5, damp: 2.5, shape: 2.0, pre: 0.025, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.55;
  bus.connect(hall); hall.connect(wet); wet.connect(dest);
  const drumModes = (f) => [[f, 0.7, 1], [f * 1.51, 0.45, 0.5], [f * 1.99, 0.3, 0.35], [f * 2.44, 0.2, 0.2], [f * 3.1, 0.12, 0.12]];
  const M = {
    bus,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4) => {
      const b = fx.pianoBuf(ocMidi(n)), len = Math.min(b.length, Math.ceil((dur + fade + 0.05) * fx.sr));
      return fx.play(b.subarray(0, len), t, bus, { vol: vel * 0.34, pan, stop: t + dur + fade, fade });
    },
    // a piano note played backwards: it swells up out of nothing and stops dead on its attack at tEnd
    rpiano(tEnd, n, vel, dur = 1.6, pan = 0) {
      const key = 'rp' + n + '_' + dur;
      if (!fx.cache[key]) {
        const b = fx.pianoBuf(ocMidi(n)), L = Math.min(b.length, Math.ceil(dur * fx.sr)), y = new Float32Array(L + Math.ceil(0.01 * fx.sr));
        for (let i = 0; i < L; i++) { const u = i / L; y[L - 1 - i] = b[i] * Math.min(1, (1 - u) / 0.35); }
        for (let i = 0; i < 0.01 * fx.sr; i++) y[L + i] = y[L - 1] * (1 - i / (0.01 * fx.sr));
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], tEnd - dur, bus, { vol: vel * 0.34, pan });
    },
    bell: (t, n, vol, pan = 0) => fx.play(fx.bellBuf(ocMidi(n)), t, bus, { vol: vol * 0.25, pan }),
    // a low drum (a timpani-like membrane): f the pitch, vol, soft = a wider mallet, dk = decay
    drum(t, vol, f = 36.7, soft = 1, dk = 1) {
      const key = 'drum' + f + '_' + soft + '_' + dk;
      if (!fx.cache[key]) {
        const y = fx.hit(drumModes(f).map(([a, tau, b]) => [a, tau * dk, b]), { width: 0.006 * soft, amp: 1, noise: 0.25, nlen: 0.02, nhp: 300, len: 3.2 * Math.max(dk, 0.3) });
        const pk = OCX.peak(y) || 1; for (let i = 0; i < y.length; i++) y[i] /= pk;
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], t, bus, { vol: vol * 0.5 });
    },
    // a held chord: o.att/rel (s), o.cut → o.cutTo by o.cutAt (Hz), o.keys [[t, level]], o.wave, o.vib (cents), o.pan
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
        const f = ocHz(nn);
        [-7, 1, 6].forEach((d, k) => {
          const osc = ctx.createOscillator(), og = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
          osc.type = o.wave || 'sawtooth'; osc.frequency.value = f;
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
  return (K._music = M);
}

// a synth pulse: each step a short chord through a low-pass (cut → cutTo over the span); o.acc accents every n steps,
// o.ramp(u) the level over the span
function ocPulse(ctx, dest, t0, t1, notes, step, vol, o = {}) {
  if (t1 - t0 < step) return;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.q || 4;
  lp.frequency.setValueAtTime(o.cut || 600, t0); lp.frequency.linearRampToValueAtTime(o.cutTo || o.cut || 600, t1);
  lp.connect(g); g.connect(dest); g.gain.value = 0;
  notes.forEach((n, k) => { const os = ctx.createOscillator(); os.type = o.wave || 'sawtooth'; os.frequency.value = ocHz(n); os.detune.setValueAtTime(k % 2 ? 6 : -6, t0); os.connect(lp); os.start(t0); os.stop(t1 + 0.1); });
  for (let t = t0, i = 0; t < t1 - 0.01; t += step, i++) {
    const acc = o.acc && i % o.acc === 0 ? 1.0 : 0.62, ramp = o.ramp ? o.ramp((t - t0) / (t1 - t0)) : 1, v = vol * 0.05 * acc * ramp;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.setTargetAtTime(0, t + 0.012, step * (o.decay || 0.28));
  }
}
// the endless rise (a Shepard–Risset glissando): octave-spaced sines climbing for ever under a fixed loudness window
function ocShepard(fx, t0, t1, o = {}) {
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

const OC_CH = {
  Dm9: ['D2', 'A2', 'F3', 'C4', 'E4'], Bbmaj7: ['Bb1', 'F2', 'D3', 'A3'], Gm9: ['G1', 'D2', 'Bb2', 'F3', 'A3'], A7sus: ['A1', 'E2', 'D3', 'G3'],
  Fadd9: ['F2', 'C3', 'A3', 'G4'], Cadd9: ['C2', 'G2', 'E3', 'D4'], Eblyd: ['Eb2', 'Bb2', 'G3', 'D4', 'A4'], Dmaj9: ['D2', 'A2', 'F#3', 'C#4', 'E4'],
  Gmaj7: ['G1', 'D2', 'B2', 'F#3'], low: ['D2', 'A2', 'D3'], deep: ['D1', 'A1', 'D2'], cold: ['A5', 'D6', 'E6'], stab: ['Eb2', 'D3', 'A3', 'Bb3'],
  cluster: ['D2', 'Eb2', 'A2', 'Bb2', 'E3', 'F3'], hornG: ['G1', 'G2', 'D3'], warm: ['F3', 'A3', 'C4', 'E4', 'G4'],
};
// the theme: five notes rising (a step each), and each return starts a step higher (D natural minor)
const OC_SCALE = ['A2', 'Bb2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'Bb3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'];
const ocThemeAt = (k, oct = 0) => { const i0 = OC_SCALE.indexOf('A3') + k; return [0, 2, 3, 4, 5].map((d) => OC_SCALE[Math.min(OC_SCALE.length - 1, i0 + d)].replace(/-?\d$/, (x) => String(+x + oct))); };
const OC_ISLA = ['F4', 'A4', 'C5', 'G4'];                       // Isla's motif: up a major third and a fifth, then the G it longs for
window.OC_THEME = Object.assign(window.OC_THEME || {}, { theme: OC_SCALE, isla: OC_ISLA, ch: OC_CH });
const ocOct = (n, k) => n.replace(/-?\d$/, (d) => String(+d + k));

ocSound('music', 'score', function (ctx, bus, K) {
  // (the lamp going under takes the whole score under with it: a low-pass on everything)
  const sea = ctx.createBiquadFilter(); sea.type = 'lowpass'; sea.Q.value = 0.9; sea.connect(bus);
  const M = ocMusicKit(ctx, K, sea), C = OC_CH, c = ocC, B = ocB, F = ocFilmAt, E = OCE, END = OC.end, T0 = OC.tOn, sh = (m) => OC_SHOTS.find((x) => x.mode === m);
  { const tl = F(E.lamp), tr = sh('roof').t0; sea.frequency.setValueAtTime(18000, 0); sea.frequency.setValueAtTime(18000, tl - 0.05); sea.frequency.exponentialRampToValueAtTime(520, tl + 1.2); sea.frequency.setValueAtTime(520, tr - 0.6); sea.frequency.exponentialRampToValueAtTime(18000, tr + 0.4); }
  const hit = (t, v = 0.9, f = 36.7) => { M.drum(t, v, f, 1.1, 1.8); M.drum(t + 0.012, 0.5 * v, f * 1.5, 1.3, 1.0); };
  const stab = (t, t1, v = 0.3) => { hit(t, 1.0, 29.1); M.strings(t, t1, C.stab, v, { att: 0.02, rel: 1.2, cut: 3000, cutTo: 800, cutAt: t1 }); };
  const theme = (t, k, o = {}) => ocThemeAt(k, o.oct || 0).slice(0, o.n || 5).forEach((n, i) => M.piano(t + i * (o.gap || 1.5), n, (o.vel || 0.4) * (i ? 0.9 : 1), o.dur || 3.4, [-0.25, 0.2, -0.15, 0.25, 0][i]));
  const isla = (t, o = {}) => (o.notes || OC_ISLA).forEach((n, i) => M.piano(t + i * (o.gap || 0.9), ocOct(n, o.oct || 0), (o.vel || 0.34) * (i === 3 ? 0.8 : 1), o.dur || 3.2, [-0.2, 0.15, 0.3, -0.1][i]));
  const rise = (t0, t1, lvl, rate, centre = 360) => { const e = (t) => lvl * ocEv(t, t0, t0 + 2) * (1 - ocEv(t, t1 - 0.6, t1)); const [Lx, Rx] = ocShepard(K.fx, t0, t1, { rate: () => rate, env: e, centre, width: 1.3 }); K.fx.play(Lx, t0, M.bus, { xr: Rx, vol: 1 }); };
  const twinkle = (t0, t1, d0, notes, vol) => { const r = new RNG(Math.round(t0 * 100)); for (let t = t0; t < t1;) { M.bell(t, notes[r.int(0, notes.length - 1)], vol * (0.6 + 0.4 * r.next()), r.range(-0.8, 0.8)); t += d0 * r.range(0.6, 1.4); } };

  // ================================================================== the clock: every story jump forward, a piano
  // note swelling backwards into the cut (time pulled past you)
  OC_JUMPS.forEach((j, i) => { if (j.t > T0 + 1 && j.t < END - 2) M.rpiano(j.t, ['A4', 'F4', 'E4', 'D4'][i % 4], 0.12, 1.3, i % 2 ? 0.3 : -0.3); });

  // ================================================================== the title, the start: 6:42 PM, the tide
  M.strings(-0.5, B('boat') + 0.5, C.deep, 0.22, { att: 3.5, rel: 1.2, cut: 220, cutTo: 420, cutAt: B('boat') });
  M.bell(0.15, 'A5', 0.16, 0.3); M.bell(1.6, 'D6', 0.1, -0.3);
  M.strings(0.4, c('start', 1) - 0.1, ['A4', 'D5', 'E5'], 0.05, { att: 2.5, rel: 1.0, cut: 5000, wave: 'triangle', vib: 3 });
  theme(T0 + 0.6, 0, { gap: 1.7, vel: 0.36 });
  // "It doesn't.": a low hit and a cold chord
  { const td = c('start', 0) + 2.0; hit(td, 0.7, 32.7); M.strings(td, B('boat') + 0.4, C.Eblyd, 0.17, { att: 1.4, rel: 0.8, cut: 700, cutTo: 1400 }); }
  // "1 metre every minute.": the pulse begins (and the low toll, every 2.5 s, under the boat)
  ocPulse(ctx, M.bus, c('start', 1) - 0.1, B('phone'), ['D2', 'A2', 'D3'], 0.62, 0.6, { cut: 320, cutTo: 900, acc: 4, decay: 0.3, ramp: (u) => 0.55 + 0.45 * u });
  for (let t = c('start', 1) - 0.1; t < B('phone') - 0.5; t += 2.48) M.piano(t, 'D2', 0.22, 2.2, -0.1);

  // ================================================================== the boat
  M.prog([[B('boat'), C.Dm9], [c('boat', 1) - 0.3, C.Gm9], [c('boat', 2) - 0.4, C.A7sus]], B('phone') + 0.5, 0.2, { cut: 800, cutTo: 1600, lastRel: 0.8 });
  stab(c('boat', 2) - 0.02, c('boat', 2) + 3.5, 0.24);

  // ================================================================== the rule: 361,000 km³ every minute, from nowhere
  M.strings(B('rule'), B('height') + 0.6, C.Eblyd, 0.22, { att: 2.0, rel: 1.2, cut: 500, cutTo: 2000, cutAt: c('rule', 2) + 2 });
  M.strings(B('rule'), B('height') + 0.6, C.deep, 0.2, { att: 1.5, rel: 1.0, cut: 200 });
  rise(c('rule', 1) - 1, B('height') + 0.3, 0.05, 1 / 30);
  twinkle(B('rule') + 0.5, B('height') - 0.5, 1.3, ['D6', 'E6', 'A6', 'Bb5'], 0.09);
  hit(c('rule', 2) - 0.02, 0.6, 29.1);

  // ================================================================== height, lichen: the theme a step higher
  ocPulse(ctx, M.bus, B('height'), B('radio'), ['D2', 'A2', 'D3'], 0.62, 0.55, { cut: 380, cutTo: 700, acc: 4, decay: 0.3 });
  M.prog([[B('height'), C.Dm9], [c('height', 1) - 0.3, C.Bbmaj7], [B('lichen'), C.Gm9], [c('lichen', 0) + 2.4, C.Dm9]], B('radio') + 0.4, 0.18, { cut: 900, lastRel: 0.8 });
  theme(c('height', 0) + 0.4, 1, { gap: 1.5, vel: 0.36 });
  M.piano(c('height', 1) + 0.1, 'D2', 0.3, 4); M.piano(c('height', 1) + 0.12, 'A2', 0.22, 4);
  M.bell(c('lichen', 0) + 2.6, 'F5', 0.12, -0.2);

  // ================================================================== Isla
  M.strings(B('phone'), B('rule') + 0.4, C.warm, 0.16, { att: 1.0, rel: 0.8, cut: 1500 });
  M.strings(B('phone'), B('rule') + 0.4, ['F1', 'C2', 'F2'], 0.14, { att: 1.0, rel: 0.8, cut: 240 });
  isla(c('phone', 0) + 0.6, { gap: 1.0 });
  hit(c('phone', 1) - 0.02, 0.75, 34.6);
  ocPulse(ctx, M.bus, c('phone', 1), B('rule') + 0.2, ['F2', 'C3', 'F3'], 0.42, 0.6, { cut: 500, cutTo: 1200, acc: 4, decay: 0.28 });

  // ================================================================== the radio: every harbour calling for help
  M.strings(B('radio'), B('bell') + 0.4, C.cluster, 0.12, { att: 1.5, rel: 1.0, cut: 420, cutTo: 700 });
  M.strings(B('radio'), B('bell') + 0.4, C.low, 0.16, { att: 1.0, rel: 1.0, cut: 260 });
  ocPulse(ctx, M.bus, B('radio'), B('bell'), ['D2', 'A2', 'D3'], 0.62, 0.5, { cut: 420, acc: 4, decay: 0.3 });
  M.piano(c('radio', 1) + 0.1, 'Eb4', 0.2, 3, 0.3); M.piano(c('radio', 1) + 0.12, 'D3', 0.24, 3, -0.2);

  // ================================================================== the bell buoy: then its chain runs out
  { const tB = F(E.bell); M.strings(B('bell'), tB + 0.3, ['C4', 'G4', 'C5'], 0.08, { att: 1.5, rel: 0.25, cut: 2500, wave: 'triangle', vib: 2 });
    M.strings(B('bell'), tB + 0.3, C.low, 0.14, { att: 1.0, rel: 0.25, cut: 260 });
    for (let t = B('bell') + 1.0, k = 0; t < tB - 0.4; t += 2.6, k++) M.bell(t, ['C5', 'G5', 'C6'][k % 3], 0.07, k % 2 ? 0.4 : -0.4);
    // (the drop: two seconds of nothing, then a bare low D)
    M.strings(tB + 2.2, B('world') + 0.4, C.deep, 0.2, { att: 2.0, rel: 0.6, cut: 180 }); }

  // ================================================================== the world: one person in ten
  M.prog([[B('world'), C.Dm9], [c('world', 1) - 0.3, C.Bbmaj7]], B('fog') + 0.6, 0.22, { cut: 700, cutTo: 2200, lastRel: 1.0 });
  for (let t = B('world') + 0.3, k = 0; t < c('world', 1) - 0.4; t += 1.25, k++) M.drum(t, 0.3 + 0.03 * k, 36.7, 1.4, 0.8);
  hit(c('world', 1) - 0.02, 0.9, 29.1); rise(c('world', 1), B('fog') + 0.4, 0.05, 1 / 18);
  // (her text: the car going up; her motif, quietly)
  isla(sh('phoneMid').t0 + 0.5, { gap: 0.8, vel: 0.24, dur: 2.6 });

  // ================================================================== the fog signal: a drone on the horn's own note
  M.strings(B('fog'), B('cottage') + 1.2, C.hornG, 0.16, { att: 2.0, rel: 1.5, cut: 300, cutTo: 520, cutAt: B('cottage') });
  M.strings(c('fog', 1) + 2.4, B('cottage') + 1.2, ['G2', 'D3'], 0.1, { att: 1.5, rel: 1.0, cut: 900, wave: 'triangle' });

  // ================================================================== your house: the theme a step higher, alone
  M.strings(B('cottage'), B('island') + 0.4, ['D2', 'A2', 'F3'], 0.14, { att: 1.5, rel: 0.8, cut: 500 });
  theme(B('cottage') + 0.8, 2, { gap: 1.6, vel: 0.34, dur: 4 });
  M.piano(c('cottage', 1) + 0.1, 'Bb2', 0.28, 4); M.piano(c('cottage', 1) + 0.12, 'F3', 0.2, 4);

  // ================================================================== the island: no island any more
  M.prog([[B('island'), C.Dm9], [c('island', 0) + 3.2, C.Bbmaj7], [c('island', 1) - 0.3, C.Gm9]], B('door') + 0.5, 0.26, { cut: 900, cutTo: 2600, lastRel: 0.8 });
  M.strings(B('island'), B('door') + 0.5, C.deep, 0.2, { att: 1.0, rel: 0.8, cut: 200 });
  hit(B('island') + 0.05, 0.85, 29.1); hit(c('island', 1) - 0.02, 0.6, 32.7);
  twinkle(B('island') + 1, B('door') - 0.5, 1.1, ['D6', 'F6', 'A6', 'C7'], 0.07);

  // ================================================================== the door: the pulse doubles; the endless rise
  { const tb = F(E.burst);
    ocPulse(ctx, M.bus, B('door'), tb, ['D2', 'A2', 'D3'], 0.31, 0.7, { cut: 400, cutTo: 1800, acc: 4, decay: 0.32, ramp: (u) => 0.5 + 0.5 * u });
    M.strings(B('door'), tb + 0.02, C.cluster, 0.16, { att: 2.0, rel: 0.02, cut: 400, cutTo: 2400, cutAt: tb });
    M.strings(B('door'), tb + 0.02, C.deep, 0.22, { att: 1.5, rel: 0.02, cut: 220 });
    rise(c('door', 1) - 1.5, tb + 0.02, 0.09, 1 / 9);
    for (let t = c('door', 1); t < tb - 0.3; t += 0.62) M.drum(t, 0.36, 41.2, 1.2, 0.6);
    // it gives: a hit, and then nothing but the sea
    stab(tb, tb + 3.5, 0.3); }

  // ================================================================== the dark: all but the lamp
  M.strings(c('dark', 0) - 0.2, B('stairs') + 0.4, C.deep, 0.2, { att: 2.5, rel: 0.8, cut: 160, cutTo: 260 });
  M.strings(c('dark', 1) + 0.1, B('stairs') + 0.8, ['F4', 'A4', 'C5', 'E5'], 0.1, { att: 1.5, rel: 1.2, cut: 3500, wave: 'triangle', vib: 4 });
  M.bell(c('dark', 1) + 0.1, 'A5', 0.14, 0.2);

  // ================================================================== the stairs: a toll for every step the sea climbs
  { const a = B('stairs'), b = B('town');
    ocPulse(ctx, M.bus, a, b, ['D2', 'A2', 'D3'], 0.21, 0.6, { cut: 500, cutTo: 1600, acc: 4, decay: 0.3 });
    M.prog([[a, C.Dm9], [c('stairs', 1) - 0.3, C.Bbmaj7]], b + 0.4, 0.2, { cut: 800, cutTo: 2000, lastRel: 0.6 });
    // (the sea climbs a step every 11 s of story: a low toll each time, wherever the clock shows it)
    { const s0 = ocStoryAt(a), s1 = ocStoryAt(b); for (let s = Math.ceil(s0 / 11) * 11; s < s1; s += 11) { const t = ocSeen(s); if (t != null) { M.drum(t, 0.55, 32.7, 1.2, 1.2); M.piano(t + 0.01, 'D1', 0.3, 3); } } }
    theme(c('stairs', 0) + 0.3, 3, { gap: 0.95, vel: 0.32, dur: 2.2, oct: 0 }); }

  // ================================================================== the town: Isla walking up; then every light out
  { const tg = F(E.grid);
    M.strings(B('town'), tg + 0.05, C.warm, 0.14, { att: 1.0, rel: 0.05, cut: 1600 });
    isla(B('town') + 0.6, { gap: 1.0, vel: 0.3 });
    // (the lights go out: so does the music; one low note under the dark)
    M.strings(tg + 1.6, B('lights') + 0.5, ['D1', 'D2'], 0.18, { att: 2.5, rel: 0.6, cut: 140 }); }

  // ================================================================== the lights: the last light on the sea
  M.strings(B('lights'), B('ship') + 0.5, C.cold, 0.06, { att: 2.0, rel: 1.0, cut: 6000, wave: 'triangle', vib: 3 });
  M.strings(B('lights'), c('lights', 1), C.low, 0.14, { att: 1.5, rel: 0.6, cut: 240 });
  M.strings(c('lights', 1) - 0.1, B('ship') + 0.6, C.Fadd9, 0.18, { att: 1.2, rel: 1.0, cut: 1800 });
  M.bell(c('lights', 1), 'C6', 0.14, 0.1);

  // ================================================================== the ship, the ice: slow, vast
  M.prog([[B('ship'), C.Gm9], [c('ship', 1) - 0.3, C.Dm9], [c('ship', 2) - 0.3, C.Fadd9]], B('ice') + 0.5, 0.2, { cut: 900, cutTo: 1800, lastRel: 0.8 });
  M.piano(c('ship', 1) + 0.2, 'A3', 0.26, 4, -0.2); M.piano(c('ship', 1) + 1.8, 'F3', 0.24, 4, 0.2);
  // (you call it; it turns for you: a little hope, two bells)
  M.bell(c('ship', 2) + 1.2, 'C6', 0.12, -0.2); M.bell(c('ship', 2) + 2.2, 'F6', 0.1, 0.25);
  M.prog([[B('ice'), C.Bbmaj7], [c('ice', 0) + 2.6, C.A7sus]], B('hill') + 0.5, 0.24, { cut: 600, cutTo: 2400, lastRel: 0.8 });
  M.strings(B('ice'), B('hill') + 0.5, C.deep, 0.22, { att: 1.5, rel: 0.8, cut: 200 });
  hit(c('ice', 0) + 2.8, 0.85, 29.1); rise(B('ice') + 1, B('hill') + 0.3, 0.06, 1 / 14);

  // ================================================================== the hill: Isla's motif in D major, with bells
  M.prog([[B('hill'), C.Dmaj9], [c('hill', 1) - 0.3, C.Gmaj7]], B('lie') + 0.4, 0.2, { cut: 1600, lastRel: 0.8, wave: 'triangle' });
  isla(B('hill') + 0.8, { notes: ['F#4', 'A4', 'D5', 'E5'], gap: 1.0, vel: 0.34 });
  ['A5', 'F#5', 'D6', 'E6'].forEach((n, i) => M.bell(c('hill', 1) + 0.2 + i * 0.7, n, 0.13, [-0.3, 0.3, -0.1, 0.2][i]));

  // ================================================================== the lie: the piano alone
  ['E4', 'D4', 'A3'].forEach((n, i) => M.piano(B('lie') + 0.6 + i * 1.3, n, 0.3, 3.5, [0.2, -0.1, 0][i]));
  M.strings(B('lie') + 0.3, B('watch') + 0.4, ['D3', 'G3', 'A3'], 0.08, { att: 1.5, rel: 0.6, cut: 1200, wave: 'triangle' });

  // ================================================================== the watch room floods; the ladder
  ocPulse(ctx, M.bus, B('watch'), B('gallery'), ['D2', 'A2', 'D3'], 0.31, 0.65, { cut: 420, cutTo: 1700, acc: 4, decay: 0.3 });
  M.prog([[B('watch'), C.cluster], [c('watch', 1) - 0.3, C.A7sus]], B('gallery') + 0.3, 0.16, { cut: 600, cutTo: 2000, lastRel: 0.4 });
  rise(c('watch', 1) - 0.5, B('gallery') + 0.2, 0.08, 1 / 10);

  // ================================================================== the gallery: just the light, on the open sea
  hit(B('gallery') + 0.02, 0.8, 29.1);
  M.prog([[B('gallery'), C.Dm9], [B('gallery') + 3.5, C.Bbmaj7]], B('lamp') + 0.8, 0.24, { cut: 1500, cutTo: 3000, lastRel: 1.0 });
  M.strings(B('gallery'), B('lamp') + 0.8, C.deep, 0.2, { att: 1.0, rel: 1.0, cut: 200 });
  ocThemeAt(4).forEach((n, i) => M.strings(B('gallery') + 0.5 + i * 1.0, B('gallery') + 0.5 + i * 1.0 + 1.25, [ocOct(n, 1)], 0.09, { att: 0.25, rel: 0.4, cut: 4000, wave: 'triangle', vib: 6 }));

  // ================================================================== the lamp: under the water, still turning
  { const tl = F(E.lamp);
    M.strings(tl - 0.3, B('roof') + 0.4, ['D2', 'A2', 'E3', 'F3'], 0.2, { att: 1.0, rel: 1.0, cut: 1200 });
    for (let t = tl + 1.2, k = 0; t < B('roof') - 0.6; t += 1.25, k++) M.bell(t, ['A5', 'C6', 'D6', 'E6', 'F6'][k % 5], 0.12, k % 2 ? 0.3 : -0.3); }

  // ================================================================== the roof: the theme's last rise, stopping short
  M.strings(B('roof'), B('question') + 0.3, C.deep, 0.18, { att: 2.0, rel: 0.6, cut: 180 });
  M.strings(B('roof') + 0.5, B('question') + 0.3, ['F3', 'A3', 'E4'], 0.08, { att: 2.0, rel: 0.6, cut: 1500, wave: 'triangle' });
  ocThemeAt(5).slice(0, 4).forEach((n, i) => M.piano(B('roof') + 0.8 + i * 1.8, n, 0.3 - 0.02 * i, 4.5, [-0.2, 0.15, -0.1, 0.2][i]));

  // ================================================================== the question: one bell, cut on the last frame
  M.bell(B('question') + 0.05, 'D5', 0.22, 0); M.piano(B('question') + 0.06, 'D2', 0.26, 6); M.piano(B('question') + 0.07, 'A2', 0.18, 6);
  M.strings(B('question'), END, ['D2', 'A2', 'E3'], 0.12, { att: 1.5, rel: 0.05, cut: 600 });
});

OC_SOUND_FNS.push(ocMusicKit, ocPulse, ocShepard, ocThemeAt, ocOct);
