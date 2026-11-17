/* =====================================================================
   SOUND · MUSIC — an original score, all synthesised (the music kit of the gravity films, via the light films and No
   light): string pads, a felt piano (also played backwards, so notes swell up out of nothing), glass bells, a low drum,
   a heartbeat, a synth pulse, the endless rise. Its idea is the film's: before 8:52 the theme is played one note after
   another, each with its echoes; from 8:52 its notes all land at once, as one chord. D minor; the theme falls to the
   tonic and lifts a semitone off it, unresolved. The score is the only thing in the film that still has a left and a
   right: every sound of the world is mono, dry and in the middle (sound-amb.js, sound-sfx.js).
     the title     the theme in echoes, a swell into 8:52; the boom: every note at once
     the flash     a pulse; the strike lands with a hit; "7 millionths": a glass tick
     the rule      wide, cold strings (E flat lydian), sparse bells
     the rumble    the 6 km bolt: a hit; "13 seconds": a timpani roll swells... and is replaced by one blow
     the call      the score thins to a thread so the call and the missing echo are heard; a reversed swell
     the answer    the heartbeat starts; the theme on the piano
     the ears      a high ticking pulse; "44,000 times": a cluster of bells, cut
     the head      the heartbeat close; the theme fades as she gets quieter
     far           wide strings; the endless rise begins, very slow
     the bats      a fluttering pulse, bells; the bat at your face: a stinger
     the sirens    a low ostinato and a semitone cluster
     the tornado   a stinger; the rise grows
     the phone     the pulse and the heartbeat; "West. Towards the tornado.": a stinger
     the run       drums on every step, the pulse, the rise, a roll into the yard light
     the strike    the score cut dead for a second and a half: the bang is the flash
     the wind      the rise, strings climbing
     the Hansens   a stinger
     found         the strings open to D major: the yellow raincoat
     the cellar    the minor theme again, the heartbeat quickening, the strings sliding up a semitone
     the question  a stinger; the theme stops a semitone above home, cut on the last frame
   ===================================================================== */



// the kit: string pads (three detuned oscillators per note through low-passes), felt piano (also reversed), bells,
// a low drum and a heartbeat
function sfMusicKit(ctx, K) {
  if (K._music) return K._music;
  const fx = K.fx, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(); bus.connect(K.bus);
  const hall = fx.ir(4.4, { bright: 0.5, damp: 2.8, shape: 2.0, pre: 0.025, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.55;
  bus.connect(hall); hall.connect(wet); wet.connect(K.bus);
  const drumModes = (f) => [[f, 0.7, 1], [f * 1.51, 0.45, 0.5], [f * 1.99, 0.3, 0.35], [f * 2.44, 0.2, 0.2], [f * 3.1, 0.12, 0.12]];
  const M = {
    bus,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4, dest = bus) => {
      const b = fx.pianoBuf(sfMidi(n)), len = Math.min(b.length, Math.ceil((dur + fade + 0.05) * fx.sr));
      return fx.play(b.subarray(0, len), t, dest, { vol: vel * 0.34, pan, stop: t + dur + fade, fade });
    },
    // a piano note played backwards: it swells up out of nothing and stops dead on its attack at tEnd
    rpiano(tEnd, n, vel, dur = 1.6, pan = 0) {
      const key = 'rp' + n + '_' + dur;
      if (!fx.cache[key]) {
        const b = fx.pianoBuf(sfMidi(n)), L = Math.min(b.length, Math.ceil(dur * fx.sr)), y = new Float32Array(L + Math.ceil(0.01 * fx.sr));
        for (let i = 0; i < L; i++) { const u = i / L; y[L - 1 - i] = b[i] * Math.min(1, (1 - u) / 0.35); }
        for (let i = 0; i < 0.01 * fx.sr; i++) y[L + i] = y[L - 1] * (1 - i / (0.01 * fx.sr));
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], tEnd - dur, bus, { vol: vel * 0.34, pan });
    },
    bell: (t, n, vol, pan = 0, dest = bus) => fx.play(fx.bellBuf(sfMidi(n)), t, dest, { vol: vol * 0.25, pan }),
    bellCut: (t, n, vol, d = 0.18, pan = 0) => fx.play(fx.bellBuf(sfMidi(n)), t, bus, { vol: vol * 0.25, pan, stop: t + d, fade: 0.05 }),
    // a low drum (a timpani-like membrane): f the pitch, vol, soft = a wider mallet, dk = decay
    drum(t, vol, f = 36.7, soft = 1, dk = 1) {
      const key = 'drum' + f + '_' + soft + '_' + dk;
      if (!fx.cache[key]) {
        const y = fx.hit(drumModes(f).map(([a, tau, b]) => [a, tau * dk, b]), { width: 0.006 * soft, amp: 1, noise: 0.25, nlen: 0.02, nhp: 300, len: 3.2 * Math.max(dk, 0.3) });
        const pk = SFX.peak(y) || 1; for (let i = 0; i < y.length; i++) y[i] /= pk;
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
        const f = sfHz(nn);
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
function sfPulse(ctx, dest, t0, t1, notes, step, vol, o = {}) {
  if (t1 - t0 < step) return;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.q || 4;
  lp.frequency.setValueAtTime(o.cut || 600, t0); lp.frequency.linearRampToValueAtTime(o.cutTo || o.cut || 600, t1);
  lp.connect(g); g.connect(dest); g.gain.value = 0;
  notes.forEach((n, k) => {
    const os = ctx.createOscillator(); os.type = o.wave || 'sawtooth'; os.frequency.value = sfHz(n); os.detune.setValueAtTime(k % 2 ? 6 : -6, t0);
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
function sfShepard(fx, t0, t1, o = {}) {
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





const SF_CH = {
  Dm9: ['D2', 'A2', 'F3', 'C4', 'E4'], Bbmaj7: ['Bb1', 'F2', 'D3', 'A3'], Gm9: ['G1', 'D2', 'Bb2', 'F3', 'A3'], A7sus: ['A1', 'E2', 'D3', 'G3'],
  Eblyd: ['Eb2', 'Bb2', 'G3', 'D4', 'A4'], Fmaj7: ['F1', 'C2', 'A2', 'E3'], Dmaj: ['D2', 'A2', 'F#3', 'A3', 'E4'], Gmaj: ['G1', 'D2', 'B2', 'F#3', 'A3'],
  low: ['D2', 'A2', 'D3'], semi: ['D2', 'Eb2', 'A2'], cold: ['A5', 'D6', 'E6'], stab: ['Eb2', 'D3', 'A3', 'Bb3'],
};
const SF_THEME = ['A4', 'F4', 'E4', 'D4', 'Eb4'];        // falling to the tonic, then a semitone off it: unresolved
const sfOct = (n, k) => n.replace(/-?\d$/, (d) => String(+d + k));
// a word's film time in a caption (beat id, caption k, word j)
const sfWord = (id, k, j) => sfCap(id, k).words[Math.min(j, sfCap(id, k).words.length - 1)].start;

sfSound('music', 'score', function (ctx, bus, K) {
  const M = sfMusicKit(ctx, K), C = SF_CH, c = sfC, B = sfB, F = sfFilmAt, E = SFE, END = SF.end, T0 = SF.tOn;
  const strike = (key) => F(SF_STRIKES.find((k) => k.key === key).s);
  const glass = (t, v = 0.3, n = 'D6') => { M.bell(t, n, v, -0.3); M.bell(t + 0.02, sfOct(n, 1), v * 0.4, 0.3); };
  const hit = (t, v = 0.9, f = 36.7) => { M.drum(t, v, f, 1.1, 1.8); M.drum(t + 0.012, 0.5 * v, f * 1.5, 1.3, 1.0); };
  const stab = (t, t1, v = 0.36) => { hit(t, 1.0, 27.5); M.drum(t + 0.01, 0.6, 41.2, 1.0, 1.0); M.strings(t, t1, C.stab, v, { att: 0.02, rel: 1.2, cut: 3000, cutTo: 800, cutAt: t1 }); };
  // the theme one note after another (the old world), each note with its echoes (left, then right), or all at once
  const motif = (t, o = {}) => (o.notes || SF_THEME).slice(0, o.n || 5).forEach((n, i) => {
    const tt = t + i * (o.gap || 1.6), v = (o.vel || 0.42) * (i ? 0.88 : 1) * (o.fade ? Math.pow(o.fade, i) : 1);
    M.piano(tt, sfOct(n, o.oct || 0), v, o.dur || 3.2, [-0.25, 0.2, -0.15, 0.25, 0][i]);
    if (o.echo) { M.piano(tt + 0.31, sfOct(n, o.oct || 0), v * 0.42, 1.6, -0.75); M.piano(tt + 0.62, sfOct(n, o.oct || 0), v * 0.2, 1.4, 0.75); }
  });
  const atOnce = (t, v = 0.42, oct = 0, notes = SF_THEME) => notes.forEach((n, i) => M.piano(t + 0.004 * i, sfOct(n, oct), v * (i ? 0.8 : 1), 4.5, [-0.5, 0.3, -0.2, 0.5, 0][i % 5]));
  const beats = (t0, t1, p0, p1, v0, v1) => { for (let t = t0; t < t1 - 0.2;) { const u = (t - t0) / (t1 - t0); M.beat(t, v0 + (v1 - v0) * u); t += p0 + (p1 - p0) * u; } };
  const twinkle = (t0, t1, d0, d1, notes, vol) => { const r = new RNG(Math.round(t0 * 100)); for (let t = t0; t < t1;) { M.bell(t, notes[r.int(0, notes.length - 1)], vol * (0.6 + 0.4 * r.next()), r.range(-0.8, 0.8)); const u = (t - t0) / (t1 - t0); t += (d0 + (d1 - d0) * u) * r.range(0.6, 1.4); } };
  const rise = (t0, t1, lvl, rate, centre = 330) => { const e = (t) => lvl * sfEv(t, t0, t0 + 2.5) * (1 - sfEv(t, t1 - 1.0, t1)); const [Lx, Rx] = sfShepard(K.fx, t0, t1, { rate: () => rate, env: e, centre, width: 1.3 }); K.fx.play(Lx, t0, M.bus, { xr: Rx, vol: 1 }); };
  const drums = (t0, t1, p, v0, v1, f = 41.2) => { for (let t = t0, i = 0; t < t1 - 0.05; t += p, i++) { const u = (t - t0) / (t1 - t0); M.drum(t, (v0 + (v1 - v0) * u) * (i % 2 ? 0.7 : 1), f, 1.2, 0.6); } };

  // ================================================================== the title: the theme in echoes; 8:52: the boom
  M.strings(0, T0 + 0.05, C.Dm9, 0.2, { att: 0.3, rel: 0.05, cut: 900 });
  M.strings(0, T0 + 0.05, C.cold, 0.04, { att: 0.5, rel: 0.05, cut: 8000, wave: 'triangle', vib: 4 });
  motif(0.12, { gap: 0.62, vel: 0.36, n: 5, dur: 2.0, echo: true });
  M.rpiano(T0, 'D2', 0.5, 2.2); M.rpiano(T0, 'A2', 0.32, 2.2);
  hit(T0 + 0.005, 1.0, 27.5); M.drum(T0 + 0.01, 0.7, 36.7, 1.0, 1.4);
  atOnce(T0 + 0.01, 0.5); atOnce(T0 + 0.012, 0.3, -1);
  M.strings(T0, T0 + 2.4, C.stab, 0.32, { att: 0.02, rel: 1.6, cut: 3200, cutTo: 500, cutAt: T0 + 2.2 });

  // ================================================================== 8:52 PM: the farm, the change, the 9 thunders
  M.strings(T0 + 0.3, B('flash') + 0.5, C.low, 0.3, { att: 2.0, rel: 1.0, cut: 240, cutTo: 420, cutAt: B('flash') });
  M.strings(T0 + 3, B('flash') + 0.4, C.semi, 0.12, { att: 3, rel: 0.6, cut: 420 });
  motif(c('start', 0) + 1.0, { gap: 1.9, vel: 0.34, n: 4, dur: 4, oct: -1 });
  glass(c('start', 1) + 0.1, 0.16, 'A6');
  { const t = c('start', 2) + 0.1; atOnce(t, 0.3, -1); M.piano(t, 'D2', 0.4, 5); }

  // ================================================================== the flash: thunder comes with it
  { const t0 = B('flash'), ts = strike('flash3');
    M.prog([[t0, C.Dm9], [c('flash', 1), C.Bbmaj7], [c('flash', 2), C.A7sus]], B('rule') + 0.3, 0.26, { cut: 900 });
    sfPulse(ctx, M.bus, t0 + 0.4, B('rule'), ['D2', 'A2', 'D3'], 0.42, 0.7, { cut: 420, cutTo: 1100, acc: 4, decay: 0.3, ramp: (u) => 0.55 + 0.45 * u });
    hit(ts + 0.004, 0.7, 32.7);
    M.bellCut(sfWord('flash', 2, 12), 'E7', 0.3, 0.1, 0.4); }

  // ================================================================== the rule: only sound's speed changes
  { const t0 = B('rule');
    M.prog([[t0, C.Eblyd], [c('rule', 1), C.Bbmaj7]], B('rumble') - 1.4, 0.24, { cut: 1300, lastRel: 1.0 });
    twinkle(t0 + 0.5, B('rumble') - 2, 1.6, 2.2, ['D6', 'A5', 'G6', 'Bb5'], 0.14);
    motif(c('rule', 1) + 0.4, { gap: 1.5, vel: 0.3, n: 4, dur: 3 }); }

  // ================================================================== the rumble: the 6 km bolt, all of it at once
  { const ts = strike('long');
    hit(ts + 0.004, 0.95, 27.5); atOnce(ts + 0.01, 0.42, -1);
    M.prog([[ts, C.Gm9], [c('rumble', 1), C.Dm9], [c('rumble', 2), C.Bbmaj7]], B('call') + 0.2, 0.26, { cut: 800, lastRel: 0.8 });
    sfPulse(ctx, M.bus, ts + 0.6, c('rumble', 1) - 0.2, ['D2', 'A2'], 0.5, 0.6, { cut: 380, acc: 2, decay: 0.3 });
    // "used to roll on for 13 seconds": a roll swells… and "all of it lands at once": one blow
    { const r0 = c('rumble', 1) + 0.6, r1 = c('rumble', 2) - 0.02;
      M.roll(r0, r1, [[r0, 0.05], [r1 - 0.4, 0.42]], 55);
      hit(c('rumble', 2) + 0.01, 0.95, 27.5); atOnce(c('rumble', 2) + 0.02, 0.36); } }

  // ================================================================== the call: no echo
  { const tc = F(E.call);
    M.strings(B('call'), c('answer', 0) - 0.5, C.cold, 0.05, { att: 2.5, rel: 1.5, cut: 7000, wave: 'triangle', vib: 5 });
    M.strings(B('call'), c('answer', 0) - 0.5, C.low, 0.16, { att: 2.5, rel: 1.5, cut: 200 });
    M.rpiano(c('call', 1), 'D3', 0.42, 2.4); M.rpiano(c('call', 1), 'A3', 0.3, 2.4);
    M.piano(c('call', 1), 'D2', 0.36, 5); glass(tc + 1.6, 0.08, 'E6'); }

  // ================================================================== the answer: she is everywhere
  { const t0 = F(E.answer);
    beats(t0 + 0.5, B('ears'), 0.95, 0.85, 0.3, 0.4);
    M.prog([[t0, C.Dm9], [c('answer', 1), C.Gm9]], B('ears') + 0.3, 0.26, { cut: 750 });
    motif(c('answer', 1) + 0.2, { gap: 1.2, vel: 0.36, n: 5, dur: 3 }); }

  // ================================================================== the ears: 0.66 thousandths → 0.2 billionths
  { const t0 = B('ears');
    M.prog([[t0, C.Bbmaj7], [c('ears', 1), C.Eblyd], [c('ears', 2), C.Gm9]], B('head') + 0.3, 0.25, { cut: 1100 });
    sfPulse(ctx, M.bus, t0 + 0.3, B('head'), ['A5', 'D6'], 0.36, 0.32, { wave: 'triangle', cut: 4000, acc: 2, decay: 0.12 });
    { const t = sfWord('ears', 1, 1); ['D7', 'E7', 'A6', 'Bb6'].forEach((n, i) => M.bellCut(t + 0.003 * i, n, 0.22, 0.14, [-0.6, 0.6, -0.2, 0.2][i])); }
    M.piano(c('ears', 2) + 0.2, 'D1', 0.4, 5); M.piano(c('ears', 2) + 0.21, 'A1', 0.3, 5); }

  // ================================================================== inside your head; she gets quieter
  { const t0 = B('head');
    beats(t0, B('far'), 0.85, 0.8, 0.5, 0.3);
    M.strings(t0, B('far') + 0.4, C.low, 0.28, { att: 1.2, rel: 0.8, cut: 260 });
    M.strings(t0 + 1, B('far') + 0.4, C.semi, 0.14, { att: 2, rel: 0.8, cut: 500 });
    motif(c('head', 2) - 0.3, { gap: 1.4, vel: 0.38, n: 5, dur: 3, fade: 0.72 }); }

  // ================================================================== far: everything for kilometres, right now
  { const t0 = B('far');
    M.prog([[t0, C.Gm9], [c('far', 1), C.Bbmaj7], [c('far', 2), C.Fmaj7]], B('bats') + 0.2, 0.3, { cut: 1300, lastRel: 0.6 });
    M.strings(t0 + 1, B('bats'), C.cold, 0.035, { att: 3, rel: 1, cut: 9000, wave: 'triangle', vib: 3 });
    rise(c('far', 1), B('bats') + 0.3, 0.008, 1 / 34, 300);
    glass(c('far', 2) + 0.3, 0.12, 'A6'); }

  // ================================================================== the bats: flying blind
  { const t0 = F(E.bats), tb = F(E.batYou);
    M.prog([[t0, C.Dm9], [c('bats', 1), C.A7sus], [c('bats', 2), C.Gm9]], B('siren') + 0.2, 0.26, { cut: 900 });
    sfPulse(ctx, M.bus, t0, tb - 0.1, ['D3', 'A3', 'D4'], 0.21, 0.42, { cut: 1500, cutTo: 2600, acc: 4, decay: 0.2 });
    twinkle(t0 + 0.2, tb - 0.4, 0.18, 0.12, ['D6', 'Eb6', 'A6', 'D7'], 0.1);
    stab(tb + 0.004, c('bats', 2) + 0.5, 0.3);
    beats(tb + 1.5, B('siren'), 0.8, 0.75, 0.3, 0.4); }

  // ================================================================== the sirens: coming or going?
  { const t0 = B('siren');
    M.strings(t0, B('tornado') - 1.5, C.low, 0.3, { att: 1.5, rel: 1.0, cut: 230 });
    M.strings(t0 + 1.5, B('tornado') - 1.5, C.semi, 0.2, { att: 3, rel: 1.0, cut: 380, wob: [10, 0.15] });
    sfPulse(ctx, M.bus, t0 + 0.5, B('tornado') - 1.6, ['D2', 'A2'], 0.62, 0.62, { cut: 300, cutTo: 520, acc: 2, decay: 0.3 });
    motif(c('siren', 2) + 0.2, { gap: 1.1, vel: 0.32, n: 4, oct: -1 }); }

  // ================================================================== the tornado
  { const tr = F(E.tornado);
    stab(tr + 0.004, tr + 4, 0.38); atOnce(tr + 0.01, 0.4, -1);
    M.prog([[tr + 0.5, C.Dm9], [c('tornado', 1), C.Gm9], [c('tornado', 2), C.A7sus]], B('phone') + 0.3, 0.3, { cut: 700, cutTo: 1300 });
    rise(tr + 1, B('phone') + 0.5, 0.014, 1 / 22, 330);
    beats(c('tornado', 1), B('phone'), 0.8, 0.7, 0.32, 0.45); }

  // ================================================================== the phone: towards the tornado
  { const t0 = F(E.dial), tw = c('phone', 3);
    M.prog([[t0, C.Dm9], [c('phone', 1), C.Bbmaj7], [c('phone', 2), C.Gm9]], tw + 0.2, 0.26, { cut: 850, lastRel: 0.2 });
    sfPulse(ctx, M.bus, t0 + 0.4, tw, ['D2', 'A2', 'D3'], 0.4, 0.65, { cut: 400, cutTo: 900, acc: 4, decay: 0.28, ramp: (u) => 0.6 + 0.4 * u });
    beats(t0 + 0.4, tw, 0.75, 0.62, 0.32, 0.45);
    motif(c('phone', 1) + 0.3, { gap: 1.2, vel: 0.34, n: 4 });
    stab(tw + 0.02, B('corn') + 0.3, 0.36);
    M.roll(B('corn') - 1.6, B('corn') - 0.02, [[B('corn') - 1.6, 0.05], [B('corn') - 0.3, 0.45]], 61.7); }

  // ================================================================== the run through the corn
  { const t0 = B('corn'), ty = F(E.yardHit);
    hit(t0 + 0.01, 0.85, 30.9);
    M.prog([[t0, C.Dm9], [c('corn', 1), C.Bbmaj7], [c('corn', 2), C.A7sus]], ty + 0.02, 0.32, { cut: 1000, cutTo: 1800, lastRel: 0.02 });
    sfPulse(ctx, M.bus, t0 + 0.2, ty - 0.02, ['D2', 'A2', 'D3', 'A3'], 0.3, 0.75, { cut: 600, cutTo: 1800, acc: 4, decay: 0.28, ramp: (u) => 0.65 + 0.35 * u });
    drums(t0 + 0.2, ty - 0.1, 0.6, 0.3, 0.5);
    rise(t0 + 0.5, ty + 0.02, 0.016, 1 / 14, 360);
    M.roll(ty - 2.2, ty - 0.03, [[ty - 2.2, 0.06], [ty - 0.3, 0.5]], 61.7); }

  // ================================================================== the yard light: the bang is the flash (the score cut dead for 1.5 s)
  { const ty = F(E.yardHit), t1 = ty + 1.5;
    M.strings(t1, B('wind') + 0.3, C.low, 0.32, { att: 1.2, rel: 0.8, cut: 220, cutTo: 480, cutAt: B('wind') });
    M.strings(t1 + 0.5, B('wind') + 0.3, C.semi, 0.18, { att: 2.5, rel: 0.8, cut: 420 });
    beats(t1 + 0.4, B('wind'), 0.8, 0.68, 0.35, 0.48);
    motif(c('strike', 1) + 0.3, { gap: 1.0, vel: 0.34, n: 4, oct: -1 });
    { const t = c('strike', 2) + 0.02; hit(t, 0.8, 30.9); atOnce(t + 0.01, 0.36); } }

  // ================================================================== the wind: everything pointing west
  { const t0 = B('wind'), tn = F(E.hansen);
    M.prog([[t0, C.Gm9], [c('wind', 1), C.A7sus]], tn + 0.02, 0.32, { cut: 1100, cutTo: 2200, cutAt: tn, lastRel: 0.02 });
    M.strings(t0, tn + 0.02, ['D5', 'Eb5'], 0.06, { att: 2, rel: 0.02, cut: 4000, vib: 12, glide: 100, glideFrom: t0 + 2, glideAt: tn });
    sfPulse(ctx, M.bus, t0 + 0.3, tn - 0.02, ['D2', 'A2', 'D3'], 0.33, 0.7, { cut: 500, cutTo: 1500, acc: 2, decay: 0.28 });
    rise(t0, tn + 0.02, 0.016, 1 / 12, 380); }

  // ================================================================== the Hansen farm comes apart
  { const tn = F(E.hansen), tf = F(E.found);
    stab(tn + 0.004, tn + 3.5, 0.38); atOnce(tn + 0.01, 0.4, -1);
    M.prog([[tn + 0.5, C.Dm9], [c('neighbour', 1), C.Gm9]], tf - 0.3, 0.3, { cut: 800, lastRel: 0.4 });
    beats(tn + 1.2, tf - 0.4, 0.62, 0.5, 0.38, 0.55);
    sfPulse(ctx, M.bus, tn + 1.2, tf - 0.4, ['D2', 'A2'], 0.31, 0.6, { cut: 350, cutTo: 900, acc: 2, decay: 0.3 }); }

  // ================================================================== found: a yellow raincoat
  { const tf = F(E.found);
    M.bell(tf + 0.01, 'F#6', 0.3, -0.3); M.bell(tf + 0.03, 'A6', 0.22, 0.3); M.drum(tf, 0.5, 36.7, 1.6, 1.4);
    M.strings(tf, B('back') + 0.3, C.Dmaj, 0.32, { att: 0.6, rel: 1.2, cut: 1400, cutTo: 2600, cutAt: tf + 4 });
    M.strings(tf + 0.5, B('back') + 0.3, ['A5', 'D6', 'F#6'], 0.05, { att: 2, rel: 1.2, cut: 9000, wave: 'triangle', vib: 4 });
    motif(c('found', 1) + 0.1, { notes: ['A4', 'F#4', 'E4', 'D4'], gap: 1.0, vel: 0.36, n: 4, dur: 4 });
    beats(c('found', 1) + 0.8, B('back'), 0.9, 0.9, 0.3, 0.28); }

  // ================================================================== the cellar: which way?
  { const t0 = B('back'), tb = F(SF_STRIKES.find((k) => k.key === 'back').s), tq = B('question');
    M.prog([[t0, C.Dm9], [c('back', 1), C.Gm9], [c('back', 2), C.A7sus]], tq + 0.02, 0.32, { cut: 900, cutTo: 1500, lastRel: 0.02 });
    sfPulse(ctx, M.bus, t0 + 0.3, tq - 0.02, ['D2', 'A2', 'D3'], 0.36, 0.72, { cut: 450, cutTo: 1300, acc: 4, decay: 0.3, ramp: (u) => 0.6 + 0.4 * u });
    beats(t0 + 0.3, tq, 0.7, 0.5, 0.35, 0.55);
    hit(tb + 0.004, 0.9, 27.5); atOnce(tb + 0.01, 0.36, -1);
    motif(c('back', 0) + 0.4, { gap: 1.1, vel: 0.34, n: 4 });
    M.strings(c('back', 2) - 0.5, tq + 0.02, ['A3', 'D4', 'E4'], 0.18, { att: 1.5, rel: 0.02, cut: 900, cutTo: 2400, cutAt: tq, glide: 100, glideFrom: c('back', 2), glideAt: tq - 0.2 });
    rise(t0 + 1, tq + 0.02, 0.014, 1 / 16, 360);
    M.roll(tq - 1.8, tq - 0.03, [[tq - 1.8, 0.05], [tq - 0.3, 0.48]], 55); }

  // ================================================================== the question: the theme stops a semitone above home, cut on the last frame
  { const t = B('question') + 0.02, tl = F(SF_STRIKES.find((k) => k.key === 'last').s);
    hit(tl + 0.004, 1.0, 27.5); M.drum(tl + 0.01, 0.6, 41.2, 1.0, 1.0);
    M.strings(t, END + 0.05, C.stab, 0.34, { att: 0.03, rel: 0.02, cut: 2400 });
    M.strings(t, END + 0.05, C.low, 0.3, { att: 0.5, rel: 0.02, cut: 200 });
    beats(t + 0.4, END - 0.2, 0.55, 0.45, 0.45, 0.6);
    motif(c('question', 0) + 0.1, { notes: ['A4', 'F4', 'E4', 'Eb4'], gap: 0.5, vel: 0.42, n: 4, dur: 1.5 }); }
});
SF_SOUND_FNS.push(sfShepard, sfPulse, sfMusicKit, sfWord);
window.SF_THEME = SF_THEME;
