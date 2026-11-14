/* =====================================================================
   SOUND · MUSIC — an original score, all synthesised (the music kit of the gravity films, via the light films): string
   pads, a felt piano (also played backwards, so notes swell up out of nothing), glass bells, a low drum, a heartbeat,
   a synth pulse, the endless rise. Cold D minor, eerie like the slower-light film. Its idea is the film's: the piano's
   own shadow. Every note of the motif comes back 1 second later (in story time: slowed, the echo comes later still),
   an octave down and muffled, like a shadow of the note.
     11:58 PM      a low drone; a backwards piano into the moment your shadow stays behind; the motif and its echoes
     the light     cold glass strings; a bell on "5 billionths", a low chord on "100 million"
     the tests     a walking pulse (it stops when you stop; its echo walks on for 1 second); the jump: your landing,
                   then the shadow's, muffled; the mirror's bells; four bells for four lamps, each echoed
     impossible    a stinger and a dark held chord; the Earth: wide strings and a slow rise
     12:00 AM      the score drops out under the lamps going off; a low drone; the guard's footsteps: a heartbeat
     the pillar    a semitone in the strings; "That one hasn't": a stinger
     the guard     a low ostinato; hits on his torch and on "He saw that"; the radio: a roll
     the run       a driving pulse and drums; cut dead when the doors lock
     the car       a held breath; the motif and its echo; the ramp: the pulse, the rise, cut dead at the CCTV
     camera 7      thin glass and a sub drone; a backwards piano into "it sees you go past"
     the exit      a low chord; a hit and its echo; the back seat: the strings glide up a semitone, a slow heartbeat;
                   the question: the motif a note short, cut on the last frame
   ===================================================================== */


// the kit: string pads (three detuned oscillators per note through low-passes), felt piano (also reversed), bells,
// a low drum and a heartbeat
function shMusicKit(ctx, K) {
  if (K._music) return K._music;
  const fx = K.fx, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(); bus.connect(K.bus);
  const hall = fx.ir(4.4, { bright: 0.5, damp: 2.8, shape: 2.0, pre: 0.025, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.55;
  bus.connect(hall); hall.connect(wet); wet.connect(K.bus);
  const drumModes = (f) => [[f, 0.7, 1], [f * 1.51, 0.45, 0.5], [f * 1.99, 0.3, 0.35], [f * 2.44, 0.2, 0.2], [f * 3.1, 0.12, 0.12]];
  const M = {
    bus,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4, dest = bus) => {
      const b = fx.pianoBuf(shMidi(n)), len = Math.min(b.length, Math.ceil((dur + fade + 0.05) * fx.sr));
      return fx.play(b.subarray(0, len), t, dest, { vol: vel * 0.34, pan, stop: t + dur + fade, fade });
    },
    // a piano note played backwards: it swells up out of nothing and stops dead on its attack at tEnd
    rpiano(tEnd, n, vel, dur = 1.6, pan = 0) {
      const key = 'rp' + n + '_' + dur;
      if (!fx.cache[key]) {
        const b = fx.pianoBuf(shMidi(n)), L = Math.min(b.length, Math.ceil(dur * fx.sr)), y = new Float32Array(L + Math.ceil(0.01 * fx.sr));
        for (let i = 0; i < L; i++) { const u = i / L; y[L - 1 - i] = b[i] * Math.min(1, (1 - u) / 0.35); }
        for (let i = 0; i < 0.01 * fx.sr; i++) y[L + i] = y[L - 1] * (1 - i / (0.01 * fx.sr));
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], tEnd - dur, bus, { vol: vel * 0.34, pan });
    },
    bell: (t, n, vol, pan = 0, dest = bus) => fx.play(fx.bellBuf(shMidi(n)), t, dest, { vol: vol * 0.25, pan }),
    bellCut: (t, n, vol, d = 0.18, pan = 0) => fx.play(fx.bellBuf(shMidi(n)), t, bus, { vol: vol * 0.25, pan, stop: t + d, fade: 0.05 }),
    // a low drum (a timpani-like membrane): f the pitch, vol, soft = a wider mallet, dk = decay
    drum(t, vol, f = 36.7, soft = 1, dk = 1) {
      const key = 'drum' + f + '_' + soft + '_' + dk;
      if (!fx.cache[key]) {
        const y = fx.hit(drumModes(f).map(([a, tau, b]) => [a, tau * dk, b]), { width: 0.006 * soft, amp: 1, noise: 0.25, nlen: 0.02, nhp: 300, len: 3.2 * Math.max(dk, 0.3) });
        const pk = SHX.peak(y) || 1; for (let i = 0; i < y.length; i++) y[i] /= pk;
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
        const f = shHz(nn);
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
function shPulse(ctx, dest, t0, t1, notes, step, vol, o = {}) {
  if (t1 - t0 < step) return;
  const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.q || 4;
  lp.frequency.setValueAtTime(o.cut || 600, t0); lp.frequency.linearRampToValueAtTime(o.cutTo || o.cut || 600, t1);
  lp.connect(g); g.connect(dest); g.gain.value = 0;
  notes.forEach((n, k) => {
    const os = ctx.createOscillator(); os.type = o.wave || 'sawtooth'; os.frequency.value = shHz(n); os.detune.setValueAtTime(k % 2 ? 6 : -6, t0);
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
function shShepard(fx, t0, t1, o = {}) {
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



const SH_CH = {
  Dm9: ['D2', 'A2', 'F3', 'C4', 'E4'], Bbmaj7: ['Bb1', 'F2', 'D3', 'A3'], Gm9: ['G1', 'D2', 'Bb2', 'F3', 'A3'], A7sus: ['A1', 'E2', 'D3', 'G3'],
  Eblyd: ['Eb2', 'Bb2', 'G3', 'D4', 'A4'], Fmaj9: ['F1', 'C2', 'A2', 'E3', 'G3'], Bblyd: ['Bb1', 'F2', 'D3', 'A3', 'E4'], Csus: ['C2', 'G2', 'F3', 'C4'],
  Dm: ['D2', 'A2', 'D3', 'F3', 'A3'], Bb: ['Bb1', 'F2', 'Bb2', 'D3', 'F3'], Gm: ['G1', 'D2', 'G2', 'Bb2', 'D3'], A: ['A1', 'E2', 'A2', 'C#3', 'E3'],
  low: ['D2', 'A2', 'D3'], semi: ['D2', 'Eb2', 'A2'], glass: ['E6', 'F6', 'A6'], cold: ['A5', 'D6', 'E6'],
};
const SH_THEME = ['A4', 'F4', 'E4', 'D4', 'C#4'];        // falling, and the last note leaning on the tonic it never reaches
const shOct = (n, k) => n.replace(/-?\d$/, (d) => String(+d + k));
// a word's film time in a caption (beat id, caption k, word j)
const shWord = (id, k, j) => shCap(id, k).words[Math.min(j, shCap(id, k).words.length - 1)].start;
// the film time 1 story second after film time t (the moment a shadow would copy it)
const shLate = (t) => shFilmAt(shStoryAt(t) + 1);

shSound('music', 'score', function (ctx, bus, K) {
  const M = shMusicKit(ctx, K), C = SH_CH, c = shC, B = shB, F = shFilmAt, E = SHE, END = SH.end, T0 = SH.tOn;
  // the shadow's bus: muffled and a little further away
  const dark = ctx.createBiquadFilter(); dark.type = 'lowpass'; dark.frequency.value = 650; dark.Q.value = 0.5; dark.connect(M.bus);
  const glass = (t, v = 0.3, n = 'E6') => { M.bell(t, n, v, -0.3); M.bell(t + 0.02, shOct(n, 1), v * 0.4, 0.3); };
  const hit = (t, v = 0.9, f = 36.7) => { M.drum(t, v, f, 1.1, 1.8); M.drum(t + 0.012, 0.5 * v, f * 1.5, 1.3, 1.0); };
  // a note and its shadow: the same note an octave down, muffled, 1 story second later
  const echo = (t, n, vel, dur = 3, pan = 0, o = {}) => { M.piano(t, n, vel, dur, pan); if (o.noEcho) return; const te = shLate(t); if (te < (o.until ?? END)) M.piano(te, shOct(n, -1), vel * (o.ek ?? 0.55), dur, -pan, 0.4, dark); };
  const motif = (t, o = {}) => (o.notes || SH_THEME).slice(0, o.n || 5).forEach((n, i) => echo(t + i * (o.gap || 1.6), shOct(n, o.oct || 0), (o.vel || 0.45) * (i ? 0.88 : 1), o.dur || 3.2, [-0.25, 0.2, -0.15, 0.25, 0][i], o));
  const beats = (t0, t1, p0, p1, v0, v1) => { for (let t = t0; t < t1 - 0.2;) { const u = (t - t0) / (t1 - t0); M.beat(t, v0 + (v1 - v0) * u); t += p0 + (p1 - p0) * u; } };
  const twinkle = (t0, t1, d0, d1, notes, vol) => { const r = new RNG(Math.round(t0 * 100)); for (let t = t0; t < t1;) { M.bell(t, notes[r.int(0, notes.length - 1)], vol * (0.6 + 0.4 * r.next()), r.range(-0.8, 0.8)); const u = (t - t0) / (t1 - t0); t += (d0 + (d1 - d0) * u) * r.range(0.6, 1.4); } };

  // ================================================================== 11:58 PM: your shadow stays behind
  M.strings(-0.3, B('light') + 0.5, C.low, 0.26, { att: 2.2, rel: 1.0, cut: 260, cutTo: 420, cutAt: B('warn') });
  M.strings(0, T0 + 0.1, C.glass, 0.04, { att: 1.5, rel: 0.1, cut: 7000, wave: 'triangle', vib: 3 });
  M.rpiano(T0, 'D2', 0.55, 2.6, 0); M.rpiano(T0, 'A2', 0.4, 2.6, 0.2); M.rpiano(T0, 'Eb3', 0.3, 2.2, -0.2);
  hit(T0, 0.95, 32.7); glass(T0 + 0.02, 0.24, 'E6');
  M.prog([[c('start', 0), C.Dm9], [c('start', 1), C.Bbmaj7], [B('only'), C.Dm9], [B('warn'), C.Eblyd], [c('warn', 0) + 2.6, C.A7sus]], B('light') + 0.5, 0.3, { cut: 900 });
  motif(c('start', 0) + 0.3, { gap: 1.7, vel: 0.36, n: 4, dur: 4 });
  { const t = c('start', 1) + 0.05; M.piano(t, 'D2', 0.45, 5); glass(t + 0.02, 0.18, 'F6'); }
  { const t = shWord('only', 0, 9); hit(t, 0.55, 36.7); M.bell(t + 0.02, 'D6', 0.2, 0); }
  { const t = c('warn', 0) + 0.1; M.piano(t, 'Bb1', 0.4, 5); M.piano(t + 0.02, 'F2', 0.3, 5); }

  // ================================================================== what a shadow is; 9 billionths; 100 million
  M.prog([[B('light'), C.Fmaj9], [c('light', 1), C.Bblyd], [c('light', 2), C.Dm9], [c('light', 3), C.Eblyd]], B('hand') + 0.5, 0.28, { cut: 1300 });
  M.strings(B('light'), B('hand') + 0.4, C.cold, 0.05, { att: 3, rel: 1, cut: 6000, wave: 'triangle', vib: 2 });
  twinkle(c('light', 1) + 0.5, c('light', 3), 1.2, 0.7, ['A5', 'D6', 'E6', 'A6'], 0.08);
  M.bell(shWord('light', 1, 8), 'A6', 0.26, 0.2); M.bell(shWord('light', 2, 6), 'A6', 0.22, -0.2);
  { const t = shWord('light', 3, 4); hit(t, 0.7, 30.9); M.piano(t, 'Eb2', 0.45, 5); M.piano(t + 0.02, 'Bb2', 0.35, 5); M.bell(t + 0.03, 'E6', 0.2, 0); }

  // ================================================================== your hand; your phone: every note copied 1 s late
  M.prog([[B('hand'), C.Dm9], [c('hand', 1), C.Gm9], [c('hand', 2), C.Dm9], [B('film'), C.Bbmaj7], [c('film', 1), C.A7sus]], B('walk') + 0.5, 0.3, { cut: 950 });
  echo(F(E.hand + 0.45), 'A4', 0.42, 3, -0.2); echo(c('hand', 2) + 0.3, 'F4', 0.36, 3, 0.2);
  echo(F(E.phone + 0.8), 'E4', 0.36, 3, -0.2); echo(c('film', 1) + 0.4, 'D4', 0.36, 3, 0.2);
  beats(c('hand', 1), B('walk') - 0.3, 1.25, 1.1, 0.14, 0.22);

  // ================================================================== the walk, the stop, the turn, the jump
  M.prog([[B('walk'), C.Dm9], [c('walk', 1), C.Bbmaj7], [B('stop'), C.Gm9], [B('turn'), C.Eblyd], [B('jump'), C.Dm9], [c('jump', 1), C.A7sus]], B('mirror') + 0.5, 0.3, { cut: 1000 });
  // the walking pulse: steps in time with you; when you stop it stops, and its shadow (muffled) walks on 1 s longer
  { const t0 = F(E.walk0) + 0.4, tS = F(E.stop), tL = shLate(tS);
    shPulse(ctx, M.bus, t0, tS, ['D2', 'A2', 'D3'], 0.54, 0.75, { cut: 380, cutTo: 900, acc: 4, decay: 0.3 });
    shPulse(ctx, dark, t0 + (shLate(t0) - t0), tL, ['D2', 'A2'], 0.54, 0.6, { cut: 300, cutTo: 500, acc: 4, decay: 0.3 });
    hit(tL, 0.6, 36.7); }
  { const t = F(E.turn + 0.3); M.piano(t, 'C#3', 0.32, 3); M.piano(shLate(t), 'C#2', 0.24, 3, 0, 0.4, dark); }
  // the jump: you land; your shadow lands 1 s later, muffled
  { const t = F(E.jump + 0.45); hit(t, 0.7, 41.2); M.bell(t + 0.01, 'A5', 0.2, 0.2); const tl = shLate(t); M.drum(tl, 0.55, 36.7, 1.6, 1.2); M.piano(tl, 'A2', 0.3, 3, 0, 0.4, dark); }

  // ================================================================== the mirror; four lamps; the impossible part
  M.prog([[B('mirror'), C.Fmaj9], [c('mirror', 1), C.Bblyd], [B('lamps'), C.Dm9], [c('lamps', 1), C.Eblyd]], B('impossible') + 0.3, 0.28, { cut: 1300 });
  twinkle(B('mirror') + 0.4, c('mirror', 1), 0.9, 0.6, ['A5', 'C6', 'E6', 'A6'], 0.09);
  { const t = shWord('lamps', 0, 9); ['D6', 'A5', 'F5', 'D5'].forEach((n, i) => { const ti = t + 0.32 * i; M.bell(ti, n, 0.2, [-0.6, -0.2, 0.2, 0.6][i]); M.bell(shLate(ti), shOct(n, -1), 0.12, [0.6, 0.2, -0.2, -0.6][i]); }); }
  { const t = c('impossible', 0) + 0.05; hit(t, 1.0, 29.1); M.drum(t + 0.01, 0.6, 43.7, 1.0, 1.0);
    M.strings(t, c('impossible', 1) + 0.3, ['Bb2', 'A3', 'Eb4', 'E4'], 0.38, { att: 0.02, rel: 1.4, cut: 3000, cutTo: 800, cutAt: c('impossible', 1) });
    M.strings(t, t + 2.6, ['F6', 'E6'], 0.07, { att: 0.02, rel: 1.6, cut: 8000, wave: 'sawtooth', vib: 18 }); }
  M.prog([[c('impossible', 1), C.Dm9], [c('impossible', 2), C.Bbmaj7]], B('where') + 0.4, 0.32, { cut: 900 });
  M.strings(c('impossible', 1), B('where') + 0.3, C.semi, 0.22, { att: 1.5, rel: 0.6, cut: 300 });
  motif(c('impossible', 2) + 0.4, { gap: 1.2, vel: 0.3, n: 3, oct: -1 });

  // ================================================================== compared to what? the Earth turning
  M.prog([[B('where'), C.Gm9], [c('where', 1), C.Bblyd], [c('where', 2), C.Fmaj9], [c('where', 3), C.A7sus]], B('midnight') + 0.1, 0.34, { cut: 1400 });
  { const t0 = c('where', 1) - 0.5, t1 = c('where', 3) + 0.5, e = (t) => 0.06 * shEv(t, t0, t0 + 3) * (1 - shEv(t, t1 - 2, t1));
    const [Lx, Rx] = shShepard(K.fx, t0, t1, { rate: () => 1 / 30, env: e, centre: 420, width: 1.3 }); K.fx.play(Lx, t0, M.bus, { xr: Rx, vol: 1 }); }
  M.bell(shWord('where', 1, 6), 'D6', 0.24, -0.3); M.bell(shWord('where', 1, 15), 'A6', 0.2, 0.3);
  { const t = shWord('where', 2, 11); hit(t, 0.6, 36.7); M.bell(t + 0.02, 'E6', 0.2, 0); }
  motif(c('where', 3) + 0.5, { gap: 1.0, vel: 0.32, n: 4 });

  // ================================================================== 12:00 AM: the lamps go off; footsteps
  { const tm = F(E.mid); hit(tm + 0.05, 0.85, 27.5); M.strings(tm, B('steps') + 0.3, C.low, 0.32, { att: 0.3, rel: 0.6, cut: 220, cutTo: 160, cutAt: B('steps') });
    M.strings(c('midnight', 1), B('steps') + 0.3, ['A2', 'Bb2', 'E3'], 0.16, { att: 2, rel: 0.5, cut: 500 }); }
  beats(B('steps') + 0.4, B('hide'), 1.25, 1.05, 0.2, 0.32);
  M.strings(B('steps'), B('still') + 0.4, ['D3', 'Eb3', 'A3'], 0.22, { att: 2, rel: 0.6, cut: 600 });
  // the pillar: a semitone in the strings, the heartbeat on
  M.prog([[B('hide'), C.Dm9], [c('hide', 1), C.Eblyd]], B('still') + 0.4, 0.3, { cut: 800 });
  beats(B('hide'), B('still'), 1.0, 0.9, 0.3, 0.38);
  { const t = c('hide', 1) + 0.1; M.piano(t, 'Eb2', 0.4, 4); glass(t + 0.02, 0.16, 'F6'); }
  M.prog([[B('still'), C.Gm9], [c('still', 1), C.Dm9], [c('still', 2), C.A7sus]], B('moving') + 0.3, 0.28, { cut: 800 });
  echo(c('still', 1) + 0.6, 'D4', 0.36, 3, 0.1);
  M.strings(c('still', 2), B('moving') + 0.2, ['A4', 'Bb4'], 0.1, { att: 2, rel: 0.2, cut: 3000, glide: 60, glideFrom: c('still', 2) + 1, glideAt: B('moving') });
  M.strings(B('moving'), c('moving', 1) + 0.1, ['D2', 'Eb2', 'A2'], 0.3, { att: 1, rel: 0.1, cut: 400 });
  beats(B('moving') + 0.2, c('moving', 1) - 0.2, 0.9, 0.7, 0.3, 0.45);
  { const t = c('moving', 1) + 0.05; hit(t, 1.0, 29.1); M.drum(t + 0.01, 0.6, 43.7, 1.0, 1.0); M.rpiano(t, 'D3', 0.4, 1.6, 0); M.rpiano(t, 'Eb3', 0.32, 1.6, 0.2);
    M.strings(t, B('guard') + 0.3, ['Bb2', 'A3', 'Eb4', 'E4'], 0.36, { att: 0.02, rel: 1.0, cut: 2600, cutTo: 700, cutAt: B('guard') }); }

  // ================================================================== the night guard; his torch; "He saw that"
  M.prog([[B('guard'), C.Dm9], [c('guard', 1), C.Gm9], [c('guard', 2), C.A7sus], [B('seen'), C.Dm9], [c('seen', 1), C.Eblyd], [B('radio'), C.Gm9]], B('run') + 0.3, 0.32, { cut: 900 });
  shPulse(ctx, M.bus, B('guard') + 0.2, B('run'), ['D2', 'A2'], 0.95, 0.75, { cut: 260, cutTo: 560, acc: 2, ramp: (u) => 0.5 + 0.5 * u });
  { const t = c('guard', 1) - 0.2; hit(t, 0.75, 32.7); glass(t + 0.02, 0.2, 'F6'); }
  motif(F(E.shield + 0.35), { gap: 0.9, vel: 0.36, n: 3, ek: 0.65 });
  { const t = c('seen', 0) + 0.05; hit(t, 0.95, 29.1); M.bellCut(t + 0.01, 'Eb6', 0.26, 0.6, -0.3); M.bellCut(t + 0.03, 'D6', 0.26, 0.6, 0.3); }
  beats(B('seen') + 0.5, B('run') - 0.2, 0.9, 0.62, 0.3, 0.5);
  M.roll(c('radio', 0) + 1.5, B('run') - 0.05, [[c('radio', 0) + 1.5, 0.04], [B('run') - 0.3, 0.5]], 55);

  // ================================================================== the run
  { const t0 = B('run'), t1 = F(E.lock);
    hit(t0 + 0.02, 0.9, 30.9);
    M.prog([[t0, C.Dm], [c('run', 1), C.Bb], [c('run', 2), C.Gm], [c('run', 3), C.A]], t1 + 0.02, 0.38, { cut: 1300, lastRel: 0.02 });
    shPulse(ctx, M.bus, t0 + 0.1, t1, ['D2', 'A2', 'D3'], 0.3, 0.85, { cut: 600, cutTo: 1800, acc: 4, decay: 0.3, ramp: (u) => 0.6 + 0.4 * u });
    for (let t = t0 + 0.1, i = 0; t < t1 - 0.2; t += 0.6, i++) M.drum(t, i % 2 ? 0.28 : 0.42, i % 2 ? 49 : 36.7, 1.2, 0.6);
    hit(c('run', 2) + 0.05, 0.8, 32.7);
    M.roll(t1 - 2.0, t1 - 0.03, [[t1 - 2.0, 0.08], [t1 - 0.3, 0.55]], 61.7); }

  // ================================================================== locked in: a held breath; the car
  { const t = F(E.lock); M.strings(t + 0.1, B('car') + 0.4, ['A2', 'Bb2', 'E3', 'F3'], 0.2, { att: 1.2, rel: 0.4, cut: 480 }); }
  M.prog([[B('car'), C.Dm9], [c('car', 1), C.Bbmaj7]], B('speed') + 0.3, 0.32, { cut: 900 });
  shPulse(ctx, M.bus, B('car') + 0.3, B('speed'), ['D2', 'A2'], 0.95, 0.7, { cut: 260, cutTo: 480, acc: 2, ramp: (u) => 0.55 + 0.45 * u });
  motif(c('car', 1) + 0.3, { gap: 1.1, vel: 0.36, n: 4, ek: 0.7 });
  // the ramp: driving, rising; cut dead on the cut to camera 7
  { const t0 = B('speed'), t1 = B('cctv');
    hit(t0 + 0.05, 0.9, 30.9);
    M.prog([[t0, C.Dm], [c('speed', 0) + 2.6, C.Bb], [c('speed', 1), C.Gm9], [c('speed', 1) + 2.4, C.A7sus]], t1 + 0.01, 0.4, { cut: 1200, lastRel: 0.01 });
    shPulse(ctx, M.bus, t0 + 0.1, t1, ['D2', 'A2', 'D3'], 0.3, 0.8, { cut: 600, cutTo: 2200, acc: 4, decay: 0.3, ramp: (u) => 0.6 + 0.4 * u });
    const e = (t) => (0.03 + 0.09 * shEv(t, t0, t1)) * (t > t1 ? 0 : 1);
    const [Lx, Rx] = shShepard(K.fx, t0, t1 + 0.002, { rate: () => 1 / 12, env: e, centre: 320, width: 1.2 }); K.fx.play(Lx, t0, M.bus, { xr: Rx, vol: 1 });
    hit(c('speed', 1) + 0.05, 0.8, 32.7);
    M.roll(t1 - 2.2, t1 - 0.03, [[t1 - 2.2, 0.1], [t1 - 0.3, 0.6]], 55); }

  // ================================================================== camera 7: thin, cold, watching
  { const t0 = B('cctv'), t1 = B('exit');
    M.strings(t0 + 0.05, t1 + 0.3, C.cold, 0.06, { att: 0.4, rel: 0.4, cut: 7000, wave: 'triangle', vib: 1 });
    M.strings(t0 + 0.05, t1 + 0.3, ['D1', 'A1'], 0.3, { att: 0.6, rel: 0.4, cut: 120 });
    glass(F(E.cctv), 0.16, 'E6');
    const t = c('cctv', 1) + 0.05; M.rpiano(t, 'D3', 0.42, 1.8, 0); M.rpiano(t, 'A3', 0.3, 1.8, 0.2); hit(t, 0.85, 30.9); M.bell(t + 0.02, 'D6', 0.2, 0);
    M.strings(t, t1 + 0.3, ['D2', 'Eb2', 'A2'], 0.26, { att: 0.3, rel: 0.3, cut: 400 }); }

  // ================================================================== the exit lane; the back seat; the question
  M.prog([[B('exit'), C.Dm9], [c('exit', 1), C.Eblyd], [c('exit', 2), C.Dm9]], B('question') + 0.2, 0.3, { cut: 800 });
  { const t = c('exit', 1) + 0.05; hit(t, 0.75, 32.7); M.drum(shLate(t), 0.5, 32.7, 1.6, 1.2); M.piano(t, 'D2', 0.4, 4); M.piano(shLate(t), 'D1', 0.3, 4, 0, 0.4, dark); }
  // the shadow in the back seat sits up: the strings glide up a semitone; a slow heartbeat
  { const r0 = F(E.rise[0]), r1 = F(E.rise[1]);
    M.strings(c('exit', 2) + 0.5, END + 0.05, ['A3', 'D4', 'E4'], 0.2, { att: 2.5, rel: 0.02, cut: 900, cutTo: 2600, cutAt: r1, glide: 100, glideFrom: r0, glideAt: r1 });
    M.strings(c('exit', 2) + 0.5, END + 0.05, C.low, 0.3, { att: 2, rel: 0.02, cut: 200 });
    beats(r0 - 0.5, END - 0.3, 1.2, 0.85, 0.3, 0.5);
    M.strings(r0, END + 0.05, ['Eb6', 'E6'], 0.04, { att: 2.5, rel: 0.02, cut: 7000, wave: 'sawtooth', vib: 14 }); }
  // the question: a stinger; the motif a note short (no echo: it ends before its shadow could), cut on the last frame
  { const t = c('question', 0) + 0.02; hit(t, 1.0, 27.5); M.drum(t + 0.01, 0.6, 41.2, 1.0, 1.0);
    M.strings(t, END + 0.05, ['Bb2', 'A3', 'Eb4', 'E4'], 0.36, { att: 0.03, rel: 0.02, cut: 2400 });
    motif(t + 0.1, { gap: 0.4, vel: 0.42, n: 4, dur: 1.5, noEcho: true }); }
});
SH_SOUND_FNS.push(shShepard, shPulse, shMusicKit, shWord, shLate);
window.SH_THEME = SH_THEME;
