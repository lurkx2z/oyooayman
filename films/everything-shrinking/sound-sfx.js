/* =====================================================================
   SOUND · SFX — the events, each at its story moment (heard once: the clock only runs forward). The world's at the
   world's pitch (× ekWorldRate, fading past your hearing); yours at your own.
     the tent      Leo asleep (his breath); the fabric straining as it closes in; the poles creaking; the rip
     Leo           "Dad?" … "Daddy!": his voice an octave up every 30 s; past ×6 it is no longer a voice, only its
                   melody: a bird, then a whistle, then nothing
     the neighbours their screams (tiny, high); your call to them (your own voice, deep, inside your head)
     the quake     to you: a crackle, high and far below (the rocks of their valley, grinding at their pitch × 20)
     the touch     your knuckles on the meadow (your own skin and bones: a soft, dull knock)
     the hold      your fingers' tendons straining; the lift: a sharp breath in
     the ball      your palms round it (skin on stone)
   ===================================================================== */

// a voice of the world at film time t: below ×6 a real voice (its pulses and its formants scaled by the world's
// pitch); above, only its melody: a sine following the call's pitch contour with two harmonics (what is left of a
// voice an octave or more above the top of a child's formants). f0 (Hz at full size), d (s), shape: 'call' | 'scream'
function ekWorldVoice(K, t, f0, d, o = {}) {
  const fx = K.fx, sr = fx.sr, w = ekWorldRate(t), a = ekAudible(t, f0 * (w < 6 ? (o.top || 3) : 1.4));   // (past ×6 only the melody is left: its top is the call's own pitch)
  if (a < 0.02) return;
  let y;
  if (w < 6) {
    y = o.scream ? ekScream(fx, { f0: f0 * w, d }) : ekCall(fx, { f0: f0 * w, d, up: o.up ?? 1.25, k: Math.min(w, 2.8), v1: o.v1 || 'a', v2: o.v2 || 'e' });
    EKX.bq(y, 'hp', Math.min(sr * 0.4, 200 * w), 0.7, sr);
  } else {
    const n = Math.ceil(d * sr); y = new Float32Array(n);
    let ph = 0; const up = o.up ?? 1.25;
    for (let i = 0; i < n; i++) {
      const u = i / n, f = f0 * w * (u < 0.42 ? 1 + 0.04 * u : up * (1 + 0.06 * (u - 0.42))) * (o.scream ? 1 + 0.08 * Math.sin(u * 40) : 1);
      if (f > sr * 0.45) { y[i] = 0; continue; }
      ph += 2 * Math.PI * f / sr;
      const e = (u < 0.42 ? Math.min(1, u / 0.06) * Math.min(1, (0.42 - u) / 0.04 + 0.2) : Math.min(1, (u - 0.42) / 0.04) * Math.pow(1 - (u - 0.42) / 0.58, 0.9));
      y[i] = (Math.sin(ph) + (f * 2 < sr * 0.45 ? 0.25 * Math.sin(2 * ph) : 0)) * e;
    }
  }
  K.put(y, t, { vol: (o.vol || 0.3) * a * (w < 6 ? 1 : 0.55), norm: true, pan: o.pan || 0 });
}

ekSound('sfx', 'events', function (ctx, bus, K) {
  const fx = K.fx, r = new RNG(CONFIG.seed + 501), c = ekC, B = ekB, sh = (id) => EK_SHOTS.find((x) => x.id === id);
  const W = ekWorldRate;
  // ---- the tent: Leo asleep beside you (his breath, small, at his pitch × the world's)
  for (let t = 1.2; t < sh('K3').t1; t += 2.6 + r.next() * 0.3) {
    const w = W(t), y = fx.breath(1.1, { inhale: true }), z = fx.breath(1.3, {});
    EKX.bq(y, 'hp', 300 * w, 0.7, fx.sr); EKX.bq(z, 'hp', 300 * w, 0.7, fx.sr);
    K.put(y, t, { vol: 0.05, norm: true, pan: -0.35, rate: w }); K.put(z, t + 1.3 / w, { vol: 0.06, norm: true, pan: -0.35, rate: w });
  }
  // the fabric straining and the poles creaking as the tent closes in on you
  { const t0 = c('start', 2) - 1, t1 = B('out') + 0.2;
    for (let t = t0; t < t1; t += 0.7 + r.next() * 1.2) {
      const w = W(t), y = fx.creak(r.range(0.3, 0.7), [[160, 0.03, 1], [390, 0.02, 0.6], [820, 0.012, 0.3]].map(([f, tau, a]) => [Math.min(fx.sr * 0.4, f * w), tau, a]), { rate: [18 * w, 45 * w] });
      K.put(y, t, { vol: 0.12 + 0.1 * ekEv(t, t0, t1), norm: true, pan: r.range(-0.5, 0.5) });
      const z = fx.rustle(r.range(0.4, 0.9), { density: 300, rub: 0.5, lo: 400 * w, hi: Math.min(16000, 4000 * w), grain: 0.01 });
      K.put(z, t + 0.1, { vol: 0.1 + 0.08 * ekEv(t, t0, t1), norm: true, pan: r.range(-0.6, 0.6) });
    } }
  // the rip: the fly tears across your hands (nylon, at the world's pitch × 1.6)
  { const t = sh('O1').t0 + (sh('O1').t1 - sh('O1').t0) * 0.14, w = W(t);
    const y = fx.rustle(1.0, { density: 2600, rub: 0.7, lo: 900 * w, hi: Math.min(16000, 7000 * w), grain: 0.002, env: (u) => Math.min(1, u / 0.05) * Math.pow(1 - u, 1.6) });
    K.put(y, t, { vol: 0.42, norm: true, pan: -0.1 }); K.put(fx.rustle(0.6, { density: 1800, rub: 0.5, lo: 1200 * w, hi: Math.min(16000, 8000 * w), grain: 0.002 }), t + 0.35, { vol: 0.28, norm: true, pan: 0.3 });
    K.put(fx.breath(0.5, { voice: 0.25, f0: 130 }), t - 0.1, { vol: 0.32, norm: true }); }
  // ---- Leo: his calls (from out in front of you, then from your hand)
  { const calls = [
      [sh('L2').t0 + 1.0, 0.7, 0.2], [sh('V1').t0 + 0.6, 0.75, 0.2], [sh('V1').t0 + 3.4, 0.9, 0.2], [sh('V2').t0 + 1.2, 0.8, 0.15],
      [sh('W2').t0 + 3.6, 0.6, 0.1], [sh('N1').t0 + 2.0, 0.7, 0.1], [sh('N3').t0 + 1.5, 0.75, 0.05], [sh('U1').t0 + 3.4, 0.7, 0],
      [c('hush', 0) - 0.3, 0.8, 0], [c('hush', 0) + 1.6, 0.7, 0], [c('hush', 1) - 0.25, 0.8, 0], [c('hush', 1) + 1.2, 0.7, 0], [c('hush', 2) - 0.3, 0.8, 0], [c('hush', 2) + 1.4, 0.8, 0]];
    calls.forEach(([t, d, pan], i) => ekWorldVoice(K, t, EKP.leo.f0, d, { up: i % 3 === 2 ? 0.9 : 1.25, vol: 0.32, pan, v1: 'a', v2: i % 2 ? 'e' : 'o' })); }
  // ---- the neighbours' screams (tiny and high: ×16)
  { const t0 = B('neighbours') + 0.3;
    for (let k = 0; k < 7; k++) { const t = t0 + k * 1.7 + r.next() * 0.6; ekWorldVoice(K, t, k % 2 ? 620 : 520, 1.0 + 0.3 * r.next(), { scream: true, vol: 0.12, pan: 0.5 + 0.2 * r.next(), top: 2.4 }); } }
  // ---- your call to them: your own voice (deep, close: inside your head)
  { const t = c('rumble', 0) - 0.3, y = ekCall(fx, { f0: 118, d: 1.1, up: 0.9, k: 0.95, v1: 'e', v2: 'o' });
    EKX.bq(y, 'peak', 200, 0.7, fx.sr, 6);
    K.put(y, t, { vol: 0.5, norm: true }); }
  // ---- the quake, as you hear it: the rocks of their valley grinding, at their pitch × 20 (a fizz far below you)
  { const t0 = c('rumble', 1) - 0.2, w = W(t0), y = ekCrackle(fx, 4.5, { rate: 40 });
    EKX.bq(y, 'hp', Math.min(12000, 400 * w), 0.7, fx.sr);
    for (let i = 0; i < y.length; i++) y[i] *= Math.min(1, i / (0.3 * fx.sr)) * Math.pow(1 - i / y.length, 1.4);
    K.put(y, t0, { vol: 0.16 * ekAudible(t0, 500), norm: true, pan: 0.2 }); }
  // ---- your boots lift off the grass (the grass at the world's pitch: a faint hiss); your breath catches
  { const t = sh('W2').t0 + 0.6; K.put(fx.rustle(0.5, { density: 600, rub: 0.3, lo: 3000, hi: 14000, grain: 0.003 }), t, { vol: 0.08, norm: true });
    K.put(fx.breath(0.45, { inhale: true }), t + 0.1, { vol: 0.25, norm: true }); }
  // ---- the touch: your knuckles on the meadow (your skin and bones: a soft, dull knock)
  { const t = sh('A3').t0 + (sh('A3').t1 - sh('A3').t0) * 0.3;
    K.put(fx.hit([[68, 0.07, 1], [140, 0.04, 0.5], [310, 0.02, 0.2]], { width: 0.01, amp: 1, len: 0.5 }), t, { vol: 0.4, norm: true, lp: 600 }); }
  // ---- holding on: your fingers' tendons straining, your grip
  { const t0 = sh('E2').t0 + 0.3;
    K.put(fx.creak(1.6, [[95, 0.03, 1], [210, 0.02, 0.5], [430, 0.012, 0.2]], { rate: [12, 30], env: (u) => Math.sin(Math.PI * u) }), t0, { vol: 0.2, norm: true, lp: 900 });
    K.put(fx.breath(0.9, { voice: 0.15, f0: 120, teeth: true }), t0 + 0.4, { vol: 0.3, norm: true }); }
  // ---- the lift: a sharp breath in; your grip again
  { const t = B('lift') + 0.4; K.put(fx.breath(0.55, { inhale: true }), t, { vol: 0.45, norm: true });
    K.put(fx.creak(1.2, [[90, 0.03, 1], [200, 0.02, 0.5]], { rate: [10, 26] }), t + 0.5, { vol: 0.18, norm: true, lp: 800 }); }
  // ---- the ball in your hands: palms on stone
  { const t = B('ball') + 0.2; K.put(fx.rustle(1.4, { density: 120, rub: 0.6, lo: 200, hi: 2500, grain: 0.02, env: (u) => Math.sin(Math.PI * u) }), t, { vol: 0.18, norm: true });
    K.put(fx.hit([[120, 0.05, 1], [260, 0.03, 0.4]], { width: 0.008, len: 0.4 }), t + 0.05, { vol: 0.2, norm: true }); }
  // ---- cupped: your palms close round it
  { const t = ekS('end') + (ekC('end', 1) - ekS('end')) * 0.5 + 1; K.put(fx.rustle(1.0, { density: 100, rub: 0.6, lo: 200, hi: 2200, grain: 0.02 }), t, { vol: 0.14, norm: true }); }
});
EK_SOUND_FNS.push(ekWorldVoice);
