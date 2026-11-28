/* =====================================================================
   SOUND · MUSIC — an original score, all synthesised (the music kit of the twice-as-long film, renamed): string
   pads, a felt piano, glass bells, plucks, low drums, a synth pulse, the endless rise. It leads the mix.
   Its two ideas are the film's:
     the climb   the whole score goes up a semitone every minute, as the earthquake goes up a magnitude: minute one is
                 in C, minute ten in A. Every tick lands on a hit and the climb's motif (a note, then a semitone up).
     you         three notes falling (sol, mi, do): the café, the moment you lift off, and the last line.
   The plan:
     the open      magnitude twelve: a vast hit and the rise, cut dead at the cut to the café
     minute 1      C major, morning plucks; "But this one isn't stopping": everything drops to a low pulse; the
                   thirty-two-times rule in bells; "real time": a clock, one tick a second
     minute 2      C♯ minor, a heartbeat; the faults; the bomb; the birds; the pilot: the pulse speeds up
     minute 3      D minor; the alert; drop, cover: held; "never going to stop": a cluster; "So you run": full drive
     minute 4      E♭ minor; Hiroshima; the street smashing; "two minutes": a clock and the endless rise
     minute 5      E minor; Haiti, the bricks, the split; "you're off the ground": it opens into E major, wide
     minute 6      F minor, heavy; 1906; fifteen megatons; the Pyramid, the Golden Gate; the phone: a bell per city
     minute 7      F♯ minor; Japan; "Up here, you can't feel a thing": high and still; the bay draining; the wave
     minute 8      G minor; Chile's record broken; things float; the dam, the Needle; the crack from space
     minute 9      A♭ minor; the air shaking; Tokyo, Dubai, Istanbul; two dozen; the fuel: a clock again
     minute 10     A minor; four days of sunlight; the Earth cracking; the dinosaurs; seven minutes of planet; the
                   last line alone on the piano, one bell on the question, cut on the last frame
   ===================================================================== */

function eqMusicKit(ctx, K, dest) {
  if (K._music) return K._music;
  const fx = K.fx, r = new RNG(CONFIG.seed + 303), bus = ctx.createGain(), dry = ctx.createGain(); bus.connect(dest); dry.connect(dest); bus._eqFx = fx; dry._eqFx = fx;
  const hall = fx.ir(4.8, { bright: 0.5, damp: 2.5, shape: 2.0, pre: 0.025, seed: 71 }), wet = ctx.createGain(); wet.gain.value = 0.5;
  bus.connect(hall); hall.connect(wet); wet.connect(dest);
  const drumModes = (f) => [[f, 0.7, 1], [f * 1.51, 0.45, 0.5], [f * 1.99, 0.3, 0.35], [f * 2.44, 0.2, 0.2], [f * 3.1, 0.12, 0.12]];
  const drumBuf = (f, soft, dk) => {
    const key = 'drum' + f + '_' + soft + '_' + dk;
    if (!fx.cache[key]) {
      const y = fx.hit(drumModes(f).map(([a, tau, b]) => [a, tau * dk, b]), { width: 0.006 * soft, amp: 1, noise: 0.25, nlen: 0.02, nhp: 300, len: 3.2 * Math.max(dk, 0.3) });
      const pk = EQX.peak(y) || 1; for (let i = 0; i < y.length; i++) y[i] /= pk;
      fx.cache[key] = y;
    }
    return fx.cache[key];
  };
  const M = {
    bus, dry,
    piano: (t, n, vel, dur = 2.5, pan = 0, fade = 0.4) => {
      const b = fx.pianoBuf(eqMidi(n)), len = Math.min(b.length, Math.ceil((dur + fade + 0.05) * fx.sr));
      return fx.play(b.subarray(0, len), t, bus, { vol: vel * 0.34, pan, stop: t + dur + fade, fade });
    },
    bell: (t, n, vol, pan = 0) => fx.play(fx.bellBuf(eqMidi(n)), t, bus, { vol: vol * 0.25, pan }),
    // a plucked string (Karplus–Strong with a fractional delay, so it is in tune up high), cached per pitch
    pluck(t, n, vol, pan = 0, dec = 1.2) {
      const m = eqMidi(n), key = 'pl' + m + '_' + dec;
      if (!fx.cache[key]) {
        const sr = fx.sr, f = eqHz(m), P = sr / f, D = P - 0.5, len = Math.ceil(Math.min(4, dec * 1.1 + 0.2) * sr), y = new Float32Array(len), rr = new RNG(700 + m);
        const g = Math.pow(0.001, 1 / (f * dec)), nb = Math.ceil(P);
        let lp = 0;
        for (let i = 0; i < len; i++) {
          let ex = 0; if (i < nb) { lp += 0.55 * (rr.next() * 2 - 1 - lp); ex = lp; }
          const k = i - D, k0 = Math.floor(k), fr = k - k0, a = k0 >= 0 ? y[k0] : 0, b = k0 + 1 >= 0 ? y[k0 + 1] : 0, c = k0 - 1 >= 0 ? y[k0 - 1] : 0;
          y[i] = ex + g * 0.5 * ((a + (b - a) * fr) + (c + (a - c) * fr));
        }
        EQX.bq(y, 'lp', 5200, 0.7, sr); EQX.bq(y, 'hp', 60, 0.7, sr);
        const on = Math.round(0.002 * sr); for (let i = 0; i < len; i++) y[i] *= Math.min(1, i / on, (len - i) / (0.05 * sr));
        const pk = EQX.peak(y) || 1; for (let i = 0; i < len; i++) y[i] /= pk;
        fx.cache[key] = y;
      }
      return fx.play(fx.cache[key], t, bus, { vol: vol * 0.3, pan });
    },
    // a low drum (a timpani-like membrane): f the pitch, vol, soft = a wider mallet, dk = decay
    drum: (t, vol, f = 36.7, soft = 1, dk = 1) => fx.play(drumBuf(f, soft, dk), t, bus, { vol: vol * 0.5 }),
    // a short dry kick and a tick (the groove: these stay out of the hall)
    kick: (t, vol) => fx.play(drumBuf(49, 0.7, 0.32), t, dry, { vol: vol * 0.55 }),
    tick(t, vol, pan = 0) {
      if (!fx.cache.tick) { const n = Math.round(0.06 * fx.sr), y = fx.white(n); EQX.bq(y, 'hp', 6500, 0.7, fx.sr); for (let i = 0; i < n; i++) y[i] *= Math.exp(-i / (0.011 * fx.sr)); const pk = EQX.peak(y) || 1; for (let i = 0; i < n; i++) y[i] /= pk; fx.cache.tick = y; }
      return fx.play(fx.cache.tick, t, dry, { vol: vol * 0.12, pan });
    },
    // a held chord: o.att/rel (s), o.cut → o.cutTo by o.cutAt (Hz), o.keys [[t, level]], o.wave, o.vib (cents), o.pan,
    // o.bend [t, cents, s] (every note glides by `cents` from t over s)
    strings(t0, t1, notes, vol, o = {}) {
      // (synthesised here, not with oscillator nodes: see EqFx.play. Three lanes (left, centre, right), each a low-pass;
      // every note three detuned voices with a slow vibrato, one voice per lane)
      t0 = Math.max(0, t0); if (t1 - t0 < 0.1) return;
      const sr = fx.sr, att = Math.min(o.att || 1.0, (t1 - t0) * 0.45), rel = Math.min(o.rel || 1.2, (t1 - t0) * 0.45);
      const T1 = t1 + 0.05, n = Math.ceil((T1 - t0) * sr), keys = [[t0, 0], [t0 + att, vol * 0.11 * (o.keys ? o.keys[0][1] : 1)]];
      for (const [t, v] of (o.keys || [])) if (t > t0 + att && t < t1 - rel) keys.push([t, vol * 0.11 * v]);
      const vEnd = o.keys ? o.keys[o.keys.length - 1][1] : 1;
      keys.push([Math.max(t0 + att + 0.01, t1 - rel), vol * 0.11 * vEnd], [t1, 0]);
      const env = eqKeysFn(keys), cutAt = o.cutAt || (t1 - rel * 0.5), cut = (t) => (o.cutTo && t > t0 ? (o.cut || 1700) + ((o.cutTo) - (o.cut || 1700)) * Math.min(1, (t - t0) / Math.max(1e-3, cutAt - t0)) : (o.cut || 1700));
      const L = new Float32Array(n), R = new Float32Array(n), lane = new Float32Array(n), gn = 1 / Math.sqrt(notes.length), vibT = Math.min(1.5, (t1 - t0) * 0.6), vib = o.vib == null ? 7 : o.vib;
      const lanes = [-0.55, 0, 0.55];
      const voices = notes.map((nn) => [-7, 1, 6].map((d) => ({ f: eqHz(nn), det: d + r.range(-2, 2), lf: r.range(4.4, 5.4) })));
      for (let k = 0; k < 3; k++) {
        lane.fill(0);
        for (const vs of voices) { const v = vs[k], bend = o.bend;
          eqOscInto(lane, sr, o.wave || 'sawtooth', gn, (i) => { const t = t0 + i / sr; let f = v.f; if (bend && t > Math.max(t0, bend[0])) f *= Math.pow(2, (bend[1] / 1200) * Math.min(1, (t - Math.max(t0, bend[0])) / bend[2]));
            const vd = vib * Math.min(1, (t - t0) / vibT) * Math.sin(6.2832 * v.lf * (t - t0)); return f * Math.pow(2, (v.det + vd) / 1200); }); }
        EQX.lpRun(lane, sr, (i) => cut(t0 + i / sr), 0.6);
        const a = (Math.max(-1, Math.min(1, lanes[k] + (o.pan || 0))) + 1) * Math.PI / 4, gl = Math.cos(a), gr = Math.sin(a);
        for (let i = 0; i < n; i++) { const x = lane[i]; L[i] += x * gl; R[i] += x * gr; }
      }
      for (let i = 0; i < n; i++) { const e = env(t0 + i / sr); L[i] *= e; R[i] *= e; }
      fx.play(L, t0, bus, { xr: R });
    },
    // a chord progression: [[t0, notes], …] each held to the next; the last one ends at t1
    prog(steps, t1, vol, o = {}) {
      steps.forEach(([t0, notes], i) => { const last = i + 1 >= steps.length; M.strings(t0, last ? t1 : steps[i + 1][0] + 0.35, notes, vol, Object.assign({ att: 0.6, rel: 0.6 }, o, last && o.lastRel ? { rel: o.lastRel } : {})); });
    },
  };
  // the hall's return, so a dead stop can kill the tail too: kill(t, back) drops it at t and brings it back over 2 s from back
  M.kill = (t, back) => { wet.gain.setValueAtTime(0.5, t - 0.01); wet.gain.linearRampToValueAtTime(0, t + 0.12); wet.gain.setValueAtTime(0, back); wet.gain.linearRampToValueAtTime(0.5, back + 2); };
  return (K._music = M);
}

// a synth pulse: each step a short chord through a low-pass (cut → cutTo over the span); o.acc accents every n steps,
// o.ramp(u) the level over the span
function eqPulse(ctx, dest, t0, t1, notes, step, vol, o = {}) {
  // (synthesised here: see EqFx.play; dest carries its EqFx as _eqFx)
  if (t1 - t0 < step) return;
  const fx = dest._eqFx, sr = fx.sr; t0 = Math.max(0, t0);
  const n = Math.ceil((t1 + 0.1 - t0) * sr), y = new Float32Array(n);
  notes.forEach((nn, k) => { const f = eqHz(nn) * Math.pow(2, (k % 2 ? 6 : -6) / 1200); eqOscInto(y, sr, o.wave || 'sawtooth', 1, () => f); });
  const c0 = o.cut || 600, c1 = o.cutTo || o.cut || 600;
  EQX.lpRun(y, sr, (i) => c0 + (c1 - c0) * Math.min(1, i / ((t1 - t0) * sr)), o.q || 4);
  // each step: up in 6 ms, held to 12 ms, then an exponential fall (time constant step × decay) until the next step
  const tau = step * (o.decay || 0.28);
  for (let i = 0; i < n; i++) {
    const t = i / sr, k = Math.floor(t / step), u = t - k * step, ts = t0 + k * step;
    if (ts >= t1 - 0.01) { y[i] = 0; continue; }
    const acc = o.acc && k % o.acc === 0 ? 1.0 : 0.62, ramp = o.ramp ? o.ramp((ts - t0) / (t1 - t0)) : 1, v = vol * 0.05 * acc * ramp;
    y[i] *= u < 0.006 ? v * u / 0.006 : u < 0.012 ? v : v * Math.exp(-(u - 0.012) / tau);
  }
  fx.play(y, t0, dest, {});
}
// a band-limited oscillator (PolyBLEP saw / square, a triangle, a sine) added into y; f(i) its frequency at sample i
// (read every 32 samples)
function eqOscInto(y, sr, wave, amp, f) {
  let ph = 0, dt = f(0) / sr;
  const blep = (t, d) => (t < d ? (t /= d, t + t - t * t - 1) : t > 1 - d ? (t = (t - 1) / d, t * t + t + t + 1) : 0);
  for (let i = 0; i < y.length; i++) {
    if ((i & 31) === 0) dt = Math.min(0.45, f(i) / sr);
    let v;
    if (wave === 'sine') v = Math.sin(6.283185307 * ph);
    else if (wave === 'triangle') v = 1 - 4 * Math.abs(ph - 0.5);
    else if (wave === 'square') { v = ph < 0.5 ? 1 : -1; v += blep(ph, dt); let q = ph + 0.5; q -= Math.floor(q); v -= blep(q, dt); }
    else v = 2 * ph - 1 - blep(ph, dt);
    y[i] += v * amp;
    ph += dt; if (ph >= 1) ph -= 1;
  }
}
// a value through time from keys [[t, v], …] (linear between them, held outside)
function eqKeysFn(keys) {
  return (t) => { if (t <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [a, va] = keys[i - 1], [b, vb] = keys[i]; return b > a ? va + (vb - va) * (t - a) / (b - a) : vb; } return keys[keys.length - 1][1]; };
}
// the endless rise (a Shepard–Risset glissando): octave-spaced sines climbing for ever under a fixed loudness window
function eqShepard(fx, t0, t1, o = {}) {
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

const EQ_KEY = (k) => 48 + Math.max(0, k - 1);              // minute k's key (MIDI): C at minute one, a semitone higher every minute
const EQ_IV = { min: [-12, 0, 7, 12, 15], min9: [-12, 0, 7, 15, 22, 26], sus: [-12, 0, 7, 12, 14, 19], maj: [-12, 0, 7, 12, 16, 19], maj9: [-12, 0, 7, 16, 23, 26],
  six: [-16, -4, 3, 8, 12], four: [-7, 5, 12, 17, 20], five: [-5, 7, 14, 19], low: [-24, -17, -12], cl: [-12, 0, 1, 7, 8, 13], hi: [12, 19, 24, 26] };
const EQ_YOU = [7, 4, 0];                                    // you: sol, mi, do
window.EQ_THEME = { key: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(EQ_KEY), iv: EQ_IV, you: EQ_YOU };

eqSound('music', 'score', function (ctx, bus, K) {
  const M = eqMusicKit(ctx, K, bus), fx = K.fx, END = EQ.end;
  const W = (id, k = 0) => eqW(id, k), wd = (id, x, i = 0) => eqWord(id, x, i).start, B = (m) => eqShotOf(m).t0, T = (k) => eqTick(k), E = (id) => eqE_(id);
  const st = (s) => s + EQ.tick0;                                                    // story seconds → film seconds
  const ch = (k, iv, o = 0) => EQ_IV[iv].map((x) => EQ_KEY(k) + x + 12 * o);
  const hit = (t, v = 0.9, f = 36.7) => { M.drum(t, v, f, 1.1, 1.8); M.drum(t + 0.012, 0.5 * v, f * 1.5, 1.3, 1.0); };
  const stab = (t, t1, notes, v = 0.3) => { hit(t, 1.0, 29.1); M.strings(t, t1, notes, v, { att: 0.02, rel: 1.2, cut: 3200, cutTo: 800, cutAt: t1 }); };
  const rise = (t0, t1, lvl, rate, centre = 360) => { const e = (t) => lvl * eqEv(t, t0, t0 + 2) * (1 - eqEv(t, t1 - 0.25, t1)); const [Lx, Rx] = eqShepard(fx, t0, t1, { rate: () => rate, env: e, centre, width: 1.3 }); fx.play(Lx, t0, M.bus, { xr: Rx, vol: 1 }); };
  const arp = (t0, t1, notes, step, vol, o = {}) => { let i = 0; for (let t = t0; t < t1 - 0.02; t += step, i++) M.pluck(t, notes[i % notes.length], vol * (i % (o.acc || 4) === 0 ? 1 : 0.72) * (o.ramp ? o.ramp((t - t0) / (t1 - t0)) : 1), (i % 2 ? 0.3 : -0.3) * (o.spread ?? 1), o.dec || 0.9); };
  const groove = (t0, t1, beat, vol, o = {}) => { let i = 0; for (let t = t0; t < t1 - 0.05; t += beat / 2, i++) { const g = vol * (o.ramp ? o.ramp((t - t0) / (t1 - t0)) : 1); if (i % 4 === 0 || (o.four && i % 2 === 0)) M.kick(t, g); if (o.ticks !== false) M.tick(t, g * (i % 2 ? 1 : 0.5), i % 2 ? 0.35 : -0.35); if (o.tom && i % 8 === 7) M.drum(t, 0.3 * g, 82.4, 1.2, 0.45); } };
  const you = (t, k, o = {}) => EQ_YOU.forEach((x, i) => M.piano(t + i * (o.gap || 0.62), EQ_KEY(k) + 12 + x + (o.minor && x === 4 ? -1 : 0), (o.vel || 0.36) * (i ? 0.9 : 1), o.dur || 3, [-0.2, 0.2, 0][i]));
  const clock = (t0, t1, step, vol, o = {}) => { let i = 0; for (let t = t0; t < t1 - 0.02; t += step, i++) M.tick(t, vol * (i % 2 ? 0.7 : 1) * (o.ramp ? o.ramp((t - t0) / (t1 - t0)) : 1), i % 2 ? 0.25 : -0.25); };
  const roll = (t0, t1, vol, f = 36.7) => { for (let t = t0, i = 0; t < t1; i++) { const u = (t - t0) / Math.max(0.01, t1 - t0); M.drum(t, vol * (0.25 + 0.75 * u), f, 1.4, 0.35); t += 0.16 - 0.1 * u; } };
  // a tick: minute k lands. A hit, a low stab in the new key, the climb's motif (the old key's note, then a semitone up)
  const tickHit = (k, o = {}) => {
    const t = T(k), v = Math.min(1, 0.62 + 0.04 * k);
    hit(t, v, 29.1); M.drum(t + 0.02, 0.6 * v, 36.7 * Math.pow(2, (k - 1) / 12), 1.2, 1.6);
    M.strings(t, t + (o.hold || 4.5), ch(k, 'low'), 0.24 + 0.012 * k, { att: 0.02, rel: 2.5, cut: 420, cutTo: 160 });
    M.strings(t, t + (o.hold || 4.5), ch(k, 'min', 1), 0.1 + 0.01 * k, { att: 0.02, rel: 2.2, cut: 3400, cutTo: 700, cutAt: t + (o.hold || 4.5) });
    M.piano(t + 0.02, EQ_KEY(k - 1) + 24, 0.3, 2.5, -0.2); M.piano(t + 0.42, EQ_KEY(k) + 24, 0.34, 3.5, 0.2);
    M.bell(t + 0.44, EQ_KEY(k) + 36, 0.13, 0.3);
    if (o.rollIn !== false) roll(t - 1.6, t - 0.05, 0.22 + 0.02 * k, 36.7 * Math.pow(2, (k - 2) / 12));
  };
  // the open (magnitude twelve), and the last minute's own hit, are the same sound
  const twelve = (t, t1, o = {}) => {
    hit(t, 1.0, 27.5); M.drum(t + 0.01, 0.7, 41.2, 1.2, 1.6);
    M.strings(t, t1, ch(10, 'cl'), 0.26, { att: 0.03, rel: o.rel || 0.1, cut: 2600, cutTo: 1200, cutAt: t1 });
    M.strings(t, t1, ch(10, 'low'), 0.26, { att: 0.03, rel: o.rel || 0.1, cut: 240 });
    M.strings(t + 0.1, t1, ch(10, 'hi', 1), 0.06, { att: 0.5, rel: o.rel || 0.1, cut: 6000, wave: 'triangle', vib: 9 });
    M.bell(t + 0.03, EQ_KEY(10) + 36, 0.2, -0.2); M.piano(t + 0.01, EQ_KEY(10) - 12, 0.34, 3); M.piano(t + 0.02, EQ_KEY(10) - 5, 0.26, 3);
  };

  // ================================================================== the open: magnitude twelve, cut at the cut
  { const tc = B('cafeWide'); twelve(0.02, tc + 0.03, { rel: 0.06 }); rise(0.02, tc + 0.03, 0.06, 1 / 5, 480); M.kill(tc + 0.02, tc + 1.0); }

  // ================================================================== minute one: C major, a Saturday morning
  { const a = B('cafeWide'), but = W('but');
    M.piano(a + 0.05, 'C4', 0.34, 3.2, -0.1); M.bell(a + 0.08, 'G5', 0.12, 0.2);
    const P = [[W('sat'), ch(1, 'maj9')], [wd('sat', "you're"), ch(1, 'six')], [W('felt'), ch(1, 'four')], [wd('felt', 'california'), ch(1, 'five')], [W('lightning'), ch(1, 'maj9')], [wd('lightning', 'bolt'), ch(1, 'four')]];
    M.prog(P, but + 0.2, 0.15, { cut: 1500, wave: 'triangle', vib: 4, lastRel: 0.25 });
    arp(W('sat') + 0.1, but - 0.1, [60, 67, 64, 67, 72, 67, 64, 67], 0.3, 0.3, { ramp: (u) => 0.6 + 0.4 * Math.min(1, u * 3) });
    groove(W('sat') + 1.2, but - 0.1, 0.6, 0.28, { ramp: (u) => 0.5 + 0.5 * Math.min(1, u * 2) });
    you(wd('sat', 'helicopter') + 0.6, 1, { vel: 0.3, gap: 0.55 });
    // "Did you feel that?": a little question in bells
    M.bell(wd('felt', 'feel') + 0.1, 'E6', 0.12, -0.3); M.bell(wd('felt', 'feel') + 0.4, 'D6', 0.1, 0.3);
    // lightning: a bright run of bells
    ['C6', 'E6', 'G6', 'C7'].forEach((n, i) => M.bell(wd('lightning', 'lightning') + 0.06 * i, n, 0.1, -0.4 + 0.27 * i));
    // "But this one isn't stopping.": the music drops to a low pulse
    M.strings(but - 0.05, W('realtime'), ch(1, 'low'), 0.2, { att: 0.1, rel: 0.6, cut: 260 });
    M.strings(wd('but', 'stopping'), W('realtime'), [60, 63, 67], 0.1, { att: 1.5, rel: 0.5, cut: 900, wave: 'triangle' });
    eqPulse(ctx, M.bus, wd('but', 'stopping'), W('realtime') + 0.5, [36, 43], 0.5, 0.5, { cut: 260, cutTo: 520, acc: 2, decay: 0.4 });
    // the rule: one step up (the climb's motif); thirty-two times; a thousand
    { const r1 = wd('rule', 'stronger'); M.piano(r1, 72, 0.3, 2, -0.2); M.piano(r1 + 0.4, 73, 0.34, 2.5, 0.2); M.bell(r1 + 0.42, 85, 0.1, 0.3);
      const t32 = wd('x32', 'thirtytwo'); for (let i = 0; i < 32; i++) M.bell(t32 + 0.02 + i * 0.045, [84, 88, 91, 96][i % 4], 0.035 + 0.002 * i, -0.8 + 0.05 * i);
      const tk = wd('x32', 'thousand'); stab(tk, tk + 3.5, [36, 48, 55, 60, 63, 67], 0.2); }
    // "Everything you see from here on happens in real time.": a clock, one tick a second, to the end of the minute
    clock(W('realtime'), T(2) - 0.05, 1.0, 0.7, { ramp: (u) => 0.6 + 0.4 * u });
    M.prog([[W('realtime'), ch(1, 'min9')], [W('cup'), ch(1, 'six')], [B('calmWide'), ch(1, 'cl')]], T(2) - 0.1, 0.16, { cut: 900, cutTo: 1600, lastRel: 0.2 });
    eqPulse(ctx, M.bus, W('realtime') + 0.5, T(2) - 0.05, [36, 43, 48], 1.0, 0.45, { cut: 300, cutTo: 700, acc: 2, decay: 0.35, ramp: (u) => 0.6 + 0.4 * u });
    rise(B('calmWide'), T(2) - 0.02, 0.035, 1 / 9, 380); }

  // ================================================================== minute two: C♯ minor, a heartbeat
  tickHit(2);
  { const k = 2, a = T(2), t3 = T(3);
    M.prog([[a + 1.5, ch(k, 'min')], [W('long'), ch(k, 'six')], [W('faults'), ch(k, 'min9')], [W('moab'), ch(k, 'four')], [W('birds'), ch(k, 'sus')], [W('tour'), ch(k, 'min')], [W('pilot'), ch(k, 'six')]], t3 - 0.1, 0.18, { cut: 800, cutTo: 2000, lastRel: 0.2 });
    for (let t = a + 1.0; t < W('tour'); t += 0.9) { M.kick(t, 0.38); M.kick(t + 0.22, 0.22); }
    eqPulse(ctx, M.bus, W('long'), W('tour'), [EQ_KEY(k) - 12, EQ_KEY(k) - 5], 0.45, 0.45, { cut: 320, cutTo: 900, acc: 4, decay: 0.3 });
    // the two faults: a low stab on each name
    stab(wd('faults', 'andreas'), wd('faults', 'andreas') + 2, ch(k, 'low'), 0.16); stab(wd('faults', 'hayward'), wd('faults', 'hayward') + 2.5, ch(k, 'cl'), 0.14);
    hit(wd('moab', 'bomb'), 0.7);
    // the birds have left: a high flutter
    arp(W('birds'), E('birds') + 1.5, [EQ_KEY(k) + 24, EQ_KEY(k) + 31, EQ_KEY(k) + 27, EQ_KEY(k) + 36], 0.09, 0.22, { acc: 4, ramp: (u) => 1 - u, dec: 0.4 });
    // the tour; the pilot doesn't want to wait: the pulse speeds up, a pickup into minute three
    arp(W('tour'), t3 - 0.1, [EQ_KEY(k) + 12, EQ_KEY(k) + 19, EQ_KEY(k) + 15, EQ_KEY(k) + 19], 0.25, 0.32, { ramp: (u) => 0.6 + 0.4 * u });
    groove(W('tour'), t3 - 0.1, 0.5, 0.42, { tom: true, ramp: (u) => 0.6 + 0.4 * u });
    eqPulse(ctx, M.bus, W('tour'), t3 - 0.05, [EQ_KEY(k) - 12, EQ_KEY(k) - 5, EQ_KEY(k)], 0.25, 0.55, { cut: 400, cutTo: 1800, acc: 4, decay: 0.28, ramp: (u) => 0.5 + 0.5 * u });
    rise(W('pilot'), t3 - 0.02, 0.04, 1 / 7, 420); }

  // ================================================================== minute three: D minor; drop, cover; run
  tickHit(3);
  { const k = 3, a = T(3), t4 = T(4);
    M.prog([[a + 1.5, ch(k, 'min')], [W('alert'), ch(k, 'cl')], [W('tnt'), ch(k, 'min9')], [W('crowd'), ch(k, 'six')], [W('drop'), ch(k, 'sus')]], W('never'), 0.18, { cut: 900, cutTo: 2200, lastRel: 0.2 });
    eqPulse(ctx, M.bus, a + 1.5, W('drop'), [EQ_KEY(k) - 12, EQ_KEY(k) - 5], 0.3, 0.55, { cut: 400, cutTo: 1400, acc: 4, decay: 0.28 });
    groove(a + 1.5, W('drop') - 0.1, 0.6, 0.45, { tom: true });
    stab(wd('alert', 'off') + 0.1, wd('alert', 'off') + 2, ch(k, 'cl', 0), 0.12);
    hit(wd('tnt', 'five'), 0.8); M.bell(wd('tnt', 'five') + 0.02, EQ_KEY(k) + 31, 0.12, 0);
    // drop, cover, hold on: held, still
    M.strings(W('drop'), W('never'), ch(k, 'sus', 1), 0.1, { att: 0.6, rel: 0.3, cut: 1800, wave: 'triangle' });
    ['drop', 'cover', 'hold'].forEach((w, i) => M.pluck(wd('drop', w), EQ_KEY(k) + 19 - 2 * i, 0.32, [-0.3, 0.3, 0][i]));
    // "But this shaking is never going to stop.": a cluster that swells
    M.strings(W('never'), W('run'), ch(k, 'cl'), 0.22, { att: 1.2, rel: 0.05, cut: 700, cutTo: 2600 });
    rise(W('never'), W('run') + 0.02, 0.05, 1 / 4, 420);
    // "So you run.": full drive to the tick
    const r0 = W('run') + 0.25;
    hit(r0, 0.9);
    M.prog([[r0, ch(k, 'min')], [W('ferry'), ch(k, 'six')], [wd('ferry', 'survived'), ch(k, 'four')], [B('pierTrack'), ch(k, 'five')], [B('pierHeli'), ch(k, 'cl')]], t4 - 0.1, 0.22, { cut: 1400, cutTo: 3000, lastRel: 0.1 });
    groove(r0, t4 - 0.1, 0.5, 0.6, { four: true, tom: true });
    arp(r0, t4 - 0.1, [EQ_KEY(k) + 12, EQ_KEY(k) + 15, EQ_KEY(k) + 19, EQ_KEY(k) + 22, EQ_KEY(k) + 19, EQ_KEY(k) + 15], 0.125, 0.3, { acc: 6, dec: 0.5 });
    eqPulse(ctx, M.bus, r0, t4 - 0.05, [EQ_KEY(k) - 12, EQ_KEY(k) - 5, EQ_KEY(k)], 0.25, 0.65, { cut: 600, cutTo: 2400, acc: 2, decay: 0.26 });
    rise(B('pierHeli'), t4 - 0.02, 0.045, 1 / 5, 460); }

  // ================================================================== minute four: E♭ minor; two minutes is two more magnitudes
  tickHit(4, { hold: 3.5 });
  { const k = 4, a = T(4), t5 = T(5);
    hit(wd('hiro', 'hiroshima'), 0.85); M.strings(wd('hiro', 'hiroshima'), W('smash'), ch(k, 'cl'), 0.16, { att: 0.05, rel: 1.0, cut: 2400, cutTo: 600 });
    M.prog([[W('smash'), ch(k, 'min')], [W('streetcar'), ch(k, 'six')], [W('in'), ch(k, 'maj')]], W('start'), 0.2, { cut: 1300, cutTo: 2600, lastRel: 0.4 });
    groove(W('smash'), W('in'), 0.5, 0.55, { four: true, tom: true });
    eqPulse(ctx, M.bus, W('smash'), W('in'), [EQ_KEY(k) - 12, EQ_KEY(k) - 5, EQ_KEY(k)], 0.25, 0.55, { cut: 600, cutTo: 2000, acc: 2, decay: 0.26 });
    // "You make it to the helicopter.": a breath of relief (major), then the wait
    M.bell(W('in') + 0.3, EQ_KEY(k) + 28, 0.1, -0.2); M.bell(W('in') + 0.6, EQ_KEY(k) + 31, 0.1, 0.2);
    // two minutes: a clock and the endless rise, all the way to lift-off (through minute five's tick)
    const w0 = wd('start', 'two'), lift = st(EQ_HT.lift);
    clock(w0, t5 - 0.05, 0.5, 0.8, { ramp: (u) => 0.5 + 0.5 * u });
    rise(w0, lift + 0.05, 0.05, 1 / 11, 380);
    M.prog([[w0, ch(k, 'min9')], [W('mud'), ch(k, 'six')], [wd('mud', 'shaking'), ch(k, 'cl')], [W('sink'), ch(k, 'min')]], t5 - 0.1, 0.17, { cut: 600, cutTo: 1600, lastRel: 0.2 });
    eqPulse(ctx, M.bus, w0, t5 - 0.05, [EQ_KEY(k) - 12, EQ_KEY(k) - 5], 0.5, 0.5, { cut: 280, cutTo: 900, acc: 2, decay: 0.35, ramp: (u) => 0.5 + 0.5 * u });
    M.strings(W('mud'), t5, ch(k, 'low'), 0.16, { att: 2, rel: 0.4, cut: 200 }); }

  // ================================================================== minute five: E minor → E major; off the ground
  tickHit(5, { hold: 3.0 });
  { const k = 5, a = T(5), t6 = T(6), lift = st(EQ_HT.lift);
    M.prog([[a + 1.0, ch(k, 'min')], [W('brick'), ch(k, 'six')], [W('split'), ch(k, 'cl')], [W('pier'), ch(k, 'five')]], lift, 0.22, { cut: 1200, cutTo: 3000, lastRel: 0.05 });
    groove(a + 1.0, lift - 0.1, 0.5, 0.6, { four: true, tom: true, ramp: (u) => 0.7 + 0.3 * u });
    hit(wd('haiti', 'haiti'), 0.8); hit(W('brick') + 0.3, 0.7); stab(wd('split', 'splits'), wd('split', 'splits') + 2.5, ch(k, 'cl'), 0.16);
    eqPulse(ctx, M.bus, a + 1.0, lift - 0.05, [EQ_KEY(k) - 12, EQ_KEY(k) - 5, EQ_KEY(k)], 0.25, 0.6, { cut: 700, cutTo: 2600, acc: 2, decay: 0.24 });
    roll(W('pier'), lift - 0.05, 0.4, 41.2);
    // lift-off: E major, wide and high; the drums stop; you
    hit(lift, 0.7, 41.2);
    M.prog([[lift, ch(k, 'maj9')], [W('sky'), ch(k, 'six')], [wd('sky', 'sky'), ch(k, 'maj')], [W('baybridge'), ch(k, 'four')]], W('baybridge') + 2.5, 0.24, { cut: 2600, wave: 'sawtooth', vib: 6, lastRel: 1.5 });
    M.strings(lift + 0.5, W('baybridge') + 2, [EQ_KEY(k) + 28, EQ_KEY(k) + 31, EQ_KEY(k) + 35], 0.06, { att: 2.5, rel: 1.5, cut: 7000, wave: 'triangle', vib: 8 });
    you(wd('sky', 'sky') - 0.1, k, { vel: 0.42, gap: 0.7, dur: 4 });
    for (let i = 0; i < 6; i++) M.bell(lift + 0.4 + i * 0.5, EQ_KEY(k) + [31, 28, 36, 35, 31, 40][i], 0.08, -0.6 + 0.24 * i);
    // 1989's Bay Bridge; "a seven, and climbing": the weight comes back
    const bb = wd('baybridge', 'seven');
    M.prog([[bb, ch(k, 'min')], [bb + 4, ch(k, 'six')], [B('heliOverBay'), ch(k, 'cl')], [B('downtown'), ch(k, 'five')]], t6 - 0.1, 0.22, { cut: 900, cutTo: 2400, lastRel: 0.1 });
    groove(bb, t6 - 0.1, 0.8, 0.55, { tom: true });
    eqPulse(ctx, M.bus, bb, t6 - 0.05, [EQ_KEY(k) - 12, EQ_KEY(k) - 5], 0.4, 0.55, { cut: 400, cutTo: 1600, acc: 2, decay: 0.3 });
    rise(B('downtown'), t6 - 0.02, 0.045, 1 / 6, 420); }

  // ================================================================== minute six: F minor, heavy; the phone
  tickHit(6);
  { const k = 6, a = T(6), t7 = T(7);
    M.prog([[a + 1.5, ch(k, 'min')], [W('fires'), ch(k, 'six')], [W('bravo'), ch(k, 'cl')], [W('pyramid'), ch(k, 'min9')], [W('golden'), ch(k, 'four')], [B('ggFall'), ch(k, 'cl')]], W('phone'), 0.24, { cut: 1100, cutTo: 2600, lastRel: 0.4 });
    groove(a + 1.5, W('phone') - 0.2, 0.9, 0.6, { tom: true });
    eqPulse(ctx, M.bus, a + 1.5, W('phone') - 0.1, [EQ_KEY(k) - 12, EQ_KEY(k) - 5], 0.45, 0.6, { cut: 400, cutTo: 1800, acc: 2, decay: 0.3 });
    stab(wd('bravo', 'fifteen'), wd('bravo', 'fifteen') + 3, ch(k, 'low'), 0.2);
    const pf = B('pyramidFall') + 1.2; hit(pf, 0.9); M.strings(pf, pf + 3, ch(k, 'cl'), 0.16, { att: 0.05, rel: 1.5, cut: 2400, cutTo: 500 });
    const gf = B('ggFall') + 1.6; hit(gf, 1.0, 27.5); M.strings(gf, gf + 3.5, ch(k, 'low'), 0.22, { att: 0.05, rel: 2, cut: 300 });
    // the phone: thin; a bell on every city
    M.strings(W('phone'), W('notjust'), ch(k, 'sus', 1), 0.1, { att: 0.4, rel: 0.4, cut: 1400, wave: 'triangle' });
    ['los', 'tokyo', 'mexico', 'istanbul'].forEach((w, i) => { M.bell(wd('phone', w) - 0.05, EQ_KEY(k) + 31 + [0, 3, 5, 7][i], 0.13, [-0.5, 0.5, -0.2, 0.2][i]); M.kick(wd('phone', w) - 0.05, 0.4); });
    // it's not just yours: every quake on Earth, growing
    M.prog([[W('notjust'), ch(k, 'min9')], [wd('notjust', 'every', 1), ch(k, 'six')]], t7 - 0.1, 0.22, { cut: 700, cutTo: 2600, lastRel: 0.1 });
    eqPulse(ctx, M.bus, W('notjust'), t7 - 0.05, [EQ_KEY(k) - 12, EQ_KEY(k) - 5, EQ_KEY(k)], 0.25, 0.6, { cut: 400, cutTo: 2600, acc: 4, decay: 0.26, ramp: (u) => 0.4 + 0.6 * u });
    groove(wd('notjust', 'every', 1), t7 - 0.1, 0.5, 0.55, { four: true, ramp: (u) => 0.5 + 0.5 * u });
    rise(W('notjust'), t7 - 0.02, 0.05, 1 / 7, 420); }

  // ================================================================== minute seven: F♯ minor; the bay drains; the wave
  tickHit(7);
  { const k = 7, a = T(7), t8 = T(8);
    M.prog([[a + 1.5, ch(k, 'min')], [W('tsar'), ch(k, 'cl')]], W('calm'), 0.24, { cut: 1200, cutTo: 2600, lastRel: 0.3 });
    groove(a + 1.5, W('calm') - 0.3, 0.6, 0.6, { four: true, tom: true });
    stab(wd('tsar', 'ten'), wd('tsar', 'ten') + 2.6, ch(k, 'low'), 0.22);
    // "Up here, you can't feel a thing.": high and still, you on the piano
    M.strings(W('calm'), W('empty') + 1, ch(k, 'hi', 1), 0.08, { att: 0.8, rel: 1.2, cut: 5000, wave: 'triangle', vib: 6 });
    you(wd('calm', 'watch') - 0.2, k, { vel: 0.3, gap: 0.8, minor: true });
    // the bay draining: low and dark, the rise going down
    M.strings(W('empty'), W('back'), ch(k, 'low'), 0.18, { att: 2.5, rel: 0.1, cut: 200, cutTo: 400 });
    M.strings(W('empty') + 2, W('back'), ch(k, 'cl', 1), 0.08, { att: 4, rel: 0.1, cut: 900, cutTo: 3000 });
    clock(W('empty') + 1, W('back') - 0.1, 0.5, 0.6, { ramp: (u) => 0.3 + 0.7 * u });
    roll(W('back') - 2.4, W('back') - 0.05, 0.5);
    // "And now it's coming back.": everything
    const wb = W('back'); hit(wb, 1.0, 27.5);
    M.prog([[wb, ch(k, 'min')], [W('cafe'), ch(k, 'six')], [W('la'), ch(k, 'cl')], [wd('la', 'seven'), ch(k, 'min')], [W('mexico'), ch(k, 'four')], [wd('mexico', 'jelly'), ch(k, 'five')]], t8 - 0.1, 0.25, { cut: 1600, cutTo: 3200, lastRel: 0.1 });
    groove(wb, W('cafe') - 0.2, 0.5, 0.65, { four: true, tom: true });
    you(W('cafe') + 0.3, k, { vel: 0.34, gap: 0.6, minor: true });
    groove(W('la'), t8 - 0.1, 0.5, 0.6, { four: true, tom: true });
    eqPulse(ctx, M.bus, W('la'), t8 - 0.05, [EQ_KEY(k) - 12, EQ_KEY(k) - 5, EQ_KEY(k)], 0.25, 0.6, { cut: 600, cutTo: 2600, acc: 2, decay: 0.26 });
    for (let i = 0; i < 7; i++) M.drum(st(402.4 + i * 0.42), 0.32, 55, 1.1, 0.5);       // the letters
    // jelly: the pulse wobbles
    eqPulse(ctx, M.bus, wd('mexico', 'jelly'), t8 - 0.05, [EQ_KEY(k) + 12, EQ_KEY(k) + 19], 0.333, 0.4, { cut: 1200, cutTo: 2400, acc: 3, decay: 0.5, wave: 'triangle' });
    rise(W('mexico'), t8 - 0.02, 0.05, 1 / 6, 440); }

  // ================================================================== minute eight: G minor; the record broken
  tickHit(8);
  { const k = 8, a = T(8), t9 = T(9);
    M.prog([[a + 1.5, ch(k, 'min')], [W('never2'), ch(k, 'six')], [wd('never2', 'chile'), ch(k, 'four')], [wd('never2', 'nine'), ch(k, 'cl')], [W('fault'), ch(k, 'min9')]], W('gravity'), 0.24, { cut: 1200, cutTo: 2600, lastRel: 0.2 });
    groove(a + 1.5, W('gravity') - 0.2, 0.6, 0.6, { four: true, tom: true });
    hit(wd('never2', 'nine'), 0.9); M.bell(wd('never2', 'five') + 0.05, EQ_KEY(k) + 31, 0.12, 0);
    hit(wd('fault', 'ten'), 0.8);
    // faster than gravity: things float (no bass, bells, high strings)
    M.strings(W('gravity'), W('dam'), ch(k, 'hi', 1), 0.1, { att: 0.5, rel: 0.6, cut: 6000, wave: 'triangle', vib: 10 });
    for (let i = 0; i < 14; i++) M.bell(W('gravity') + 0.1 + i * 0.42, EQ_KEY(k) + [24, 31, 36, 34, 31, 38, 43][i % 7], 0.07, Math.sin(i * 1.7) * 0.7);
    stab(wd('month', 'month'), wd('month', 'month') + 2.5, ch(k, 'low'), 0.2);
    // the dam; the Needle
    const br = st(456.6); hit(br, 0.9); M.prog([[W('dam'), ch(k, 'min')], [br, ch(k, 'cl')], [W('needle'), ch(k, 'six')], [st(461.9), ch(k, 'cl')]], W('crack'), 0.24, { cut: 1400, cutTo: 3000, lastRel: 0.2 });
    hit(st(461.9) + 0.8, 1.0); groove(W('dam'), W('crack') - 0.1, 0.5, 0.6, { four: true, tom: true });
    // from space: the crack; wide, to the tick
    M.prog([[W('crack'), ch(k, 'min9')], [wd('crack', 'los'), ch(k, 'six')], [wd('crack', 'oregon'), ch(k, 'sus')]], t9 - 0.1, 0.24, { cut: 900, cutTo: 2800, lastRel: 0.1 });
    eqPulse(ctx, M.bus, W('crack'), t9 - 0.05, [EQ_KEY(k) - 12, EQ_KEY(k) - 5, EQ_KEY(k)], 0.25, 0.55, { cut: 400, cutTo: 2600, acc: 4, decay: 0.26, ramp: (u) => 0.4 + 0.6 * u });
    rise(W('crack'), t9 - 0.02, 0.05, 1 / 7, 420); }

  // ================================================================== minute nine: A♭ minor; the air; the cities
  tickHit(9);
  { const k = 9, a = T(9), t10 = T(10);
    M.prog([[a + 1.5, ch(k, 'min')], [W('years'), ch(k, 'six')], [W('air'), ch(k, 'cl')]], W('tokyo'), 0.25, { cut: 1300, cutTo: 2800, lastRel: 0.2 });
    groove(a + 1.5, W('air') - 0.1, 0.6, 0.6, { four: true, tom: true });
    stab(wd('years', 'three'), wd('years', 'three') + 2.5, ch(k, 'low'), 0.22);
    // the air is shaking: a tremolo
    eqPulse(ctx, M.bus, W('air'), W('tokyo'), ch(k, 'min', 1), 0.07, 0.4, { cut: 2400, acc: 1, decay: 0.6, wave: 'sawtooth' });
    // Tokyo, Dubai, Istanbul: a hit on each
    const cities = [['tokyo', ch(k, 'min')], ['dubai', ch(k, 'six')], ['istanbul', ch(k, 'four')]];
    M.prog(cities.map(([id, c]) => [W(id), c]).concat([[W('dozens'), ch(k, 'min9')], [wd('dozens', 'still'), ch(k, 'cl')]]), W('fuel'), 0.25, { cut: 1400, cutTo: 3000, lastRel: 0.3 });
    for (const [id] of cities) hit(W(id), 0.8);
    groove(W('tokyo'), W('fuel') - 0.2, 0.5, 0.62, { four: true, tom: true });
    eqPulse(ctx, M.bus, W('tokyo'), W('fuel') - 0.1, [EQ_KEY(k) - 12, EQ_KEY(k) - 5, EQ_KEY(k)], 0.25, 0.62, { cut: 600, cutTo: 2800, acc: 2, decay: 0.26 });
    arp(W('dozens'), W('fuel') - 0.1, [EQ_KEY(k) + 12, EQ_KEY(k) + 15, EQ_KEY(k) + 19, EQ_KEY(k) + 24, EQ_KEY(k) + 19, EQ_KEY(k) + 15], 0.125, 0.3, { acc: 6, dec: 0.5 });
    // the fuel: a clock again; nowhere to land: dread
    clock(W('fuel'), t10 - 0.05, 0.5, 0.75, { ramp: (u) => 0.5 + 0.5 * u });
    M.prog([[W('fuel'), ch(k, 'min9')], [W('nowhere'), ch(k, 'cl')]], t10 - 0.1, 0.2, { cut: 600, cutTo: 2600, lastRel: 0.1 });
    M.strings(W('nowhere'), t10, ch(k, 'low'), 0.2, { att: 1.5, rel: 0.1, cut: 220 });
    rise(W('fuel'), t10 - 0.02, 0.055, 1 / 5, 440); }

  // ================================================================== minute ten: A minor; the planet; the last line
  { const k = 10, a = T(10), last = W('last'), q = W('question');
    twelve(a, a + 4.5, { rel: 2.5 }); roll(a - 1.6, a - 0.05, 0.45, 32.7);
    // four days of sunlight: blazing (A major, high), then back to minor
    M.prog([[W('sun'), ch(k, 'maj9')], [wd('sun', 'planet'), ch(k, 'six')], [W('cracking'), ch(k, 'min')], [W('melt'), ch(k, 'cl')], [wd('melt', 'friction'), ch(k, 'min9')]], W('dino'), 0.27, { cut: 1600, cutTo: 3400, lastRel: 0.2 });
    M.strings(W('sun'), W('cracking'), ch(k, 'hi', 1), 0.08, { att: 0.6, rel: 0.6, cut: 7000, wave: 'triangle', vib: 8 });
    groove(a + 1.5, W('dino') - 0.1, 0.5, 0.65, { four: true, tom: true });
    eqPulse(ctx, M.bus, a + 1.5, W('dino') - 0.05, [EQ_KEY(k) - 12, EQ_KEY(k) - 5, EQ_KEY(k)], 0.25, 0.62, { cut: 600, cutTo: 3000, acc: 2, decay: 0.26 });
    hit(wd('cracking', 'cracking'), 0.9);
    // the dinosaurs; seven more: the biggest moment, then everything stops
    hit(wd('dino', 'asteroid'), 1.0, 27.5);
    M.prog([[W('dino'), ch(k, 'cl')], [W('seven'), ch(k, 'min')], [wd('seven', 'apart'), ch(k, 'cl')]], last - 0.3, 0.3, { cut: 1800, cutTo: 3600, lastRel: 0.2 });
    groove(W('dino'), last - 0.4, 0.5, 0.7, { four: true, tom: true });
    arp(W('seven'), last - 0.4, [EQ_KEY(k) + 12, EQ_KEY(k) + 15, EQ_KEY(k) + 19, EQ_KEY(k) + 24, EQ_KEY(k) + 27, EQ_KEY(k) + 24], 0.1, 0.32, { acc: 6, dec: 0.5 });
    stab(wd('seven', 'apart'), last - 0.2, ch(k, 'low'), 0.26); rise(W('seven'), last - 0.25, 0.06, 1 / 3, 500);
    M.kill(last - 0.25, last + 0.6);
    // the last line, alone: you, on the piano, over a soft A minor; one bell on the question; cut on the last frame
    M.strings(last - 0.1, END + 0.4, ch(k, 'min9'), 0.13, { att: 1.5, rel: 0.05, cut: 900, wave: 'triangle', vib: 4 });
    M.strings(last - 0.1, END + 0.4, ch(k, 'low'), 0.12, { att: 2, rel: 0.05, cut: 180 });
    you(wd('last', 'seven') - 0.3, k, { vel: 0.34, gap: 0.75, minor: true, dur: 5 });
    M.piano(q - 0.05, EQ_KEY(k), 0.3, 4); M.bell(wd('question', 'call') + 0.25, EQ_KEY(k) + 31, 0.16, 0); }
});
