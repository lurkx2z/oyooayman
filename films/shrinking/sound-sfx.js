/* =====================================================================
   SOUND · EFFECTS — the events, each on the frame it is seen. As you shrink the room's sounds get bigger round you:
   your own steps get lighter and higher, while everything else (the cat, the glass, the phone's buzz) arrives huge
   and low. Footsteps are placed where the camera has travelled one stride (a stride shrinks with you), the mite's
   where it has, the Brownian shoves where the camera is shoved, the molecular hail on the same hashed beats as the
   camera's jolts, and in the void a soft rush for each ring (each factor of ten) as it sweeps past the edge of frame.
   ===================================================================== */

// a thump: a low sine that falls in pitch (saturated so it carries on a phone), with a body of low noise
function shThump(K, t, o = {}) {
  const { fx, sr } = K, d = Math.max(1.2, (o.tau || 0.25) * 5), n = Math.ceil(d * sr), y = fx.arr(d), f0 = o.f0 || 60, tau = o.tau || 0.25; let ph = 0;
  for (let i = 0; i < n; i++) { const tt = i / sr; ph += 2 * Math.PI * Math.max(28, f0 * Math.pow(0.6, tt / 0.6)) / sr; y[i] = Math.tanh(2 * Math.sin(ph) * Math.exp(-tt / tau)) * Math.min(1, tt / 0.004); }
  const z = shNoise(fx, Math.ceil(0.3 * sr), 'brown'); GBX.bq(z, 'lp', o.body || 400, 0.7, sr);
  let pk = 0; for (let i = 0; i < z.length; i++) pk = Math.max(pk, Math.abs(z[i])); for (let i = 0; i < z.length; i++) y[i] += 0.4 * z[i] / Math.max(1e-9, pk) * Math.exp(-i / (0.05 * sr));
  return K.put(y, t, { vol: o.vol || 0.2, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
}
// a whoosh: noise through a band-pass whose centre follows curve (Hz) over d seconds; o.env(u) its level
function shWhoosh(K, t, d, curve, o = {}) {
  const { fx, sr } = K, n = Math.ceil(d * sr), x = shNoise(fx, n, o.colour || 'pink'), e = o.env || ((u) => Math.pow(Math.sin(Math.PI * u), 1.5));
  for (let i = 0; i < n; i++) x[i] *= e(i / n);
  return shSweepPut(K, x, t, 'bandpass', o.q || 1.2, curve, { vol: o.vol || 0.2, pan: o.pan || 0, room: o.room, wet: o.wet });
}
// a phone vibrating on a wooden floor: the motor's buzz and the case knocking on the boards once a turn.
// wins [[t0, t1], …]; o.pitch, o.size (0 = heard at your normal size; 1 = heard by someone a few centimetres tall:
// a sub rumble under it, driven harder)
function shBuzz(K, wins, o = {}) {
  const { fx, sr } = K, t0 = wins[0][0] - 0.01, t1 = wins[wins.length - 1][1] + 0.05, d = t1 - t0 + 0.5, n = Math.ceil(d * sr);
  const y = fx.arr(d), ex = new Float32Array(n), f0 = 172 * (o.pitch || 1), sz = o.size || 0;
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = t0 + i / sr; let e = 0;
    for (const [a, b] of wins) e = Math.max(e, MathX.clamp(Math.min((t - a) / 0.02, (b - t) / 0.035), 0, 1));
    ph += 2 * Math.PI * f0 / sr;
    const s = Math.sin(ph);
    y[i] = e * (0.55 * s + 0.3 * Math.sin(2 * ph + 0.4) + 0.15 * Math.sin(3 * ph + 1.1)) * (1 - 0.5 * sz);
    ex[i] = e * Math.pow(Math.max(0, s), 8);
  }
  GBX.res(y, ex, fx.panelModes(0.6).map(([f, tau, a]) => [f * (1 - 0.45 * sz), tau * (1 + sz), a * 0.6]), sr);
  if (sz) for (let i = 0, ph2 = 0; i < n; i++) { const t = t0 + i / sr; let e = 0; for (const [a, b] of wins) e = Math.max(e, MathX.clamp(Math.min((t - a) / 0.03, (b - t) / 0.06), 0, 1)); ph2 += 2 * Math.PI * 43 / sr; y[i] = Math.tanh((y[i] + sz * 1.2 * e * Math.sin(ph2)) * (1 + 1.5 * sz)); }
  return K.put(y, t0, { vol: o.vol || 0.3, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet, lp: o.lp });
}
// footsteps along a path: one each time pos(t) → [x, z] has moved a stride(t); fn(t, i) plays it
function shStepsAlong(t0, t1, pos, stride, fn) {
  let acc = 0.5, [px, pz] = pos(t0), i = 0;
  for (let t = t0 + 0.01; t < t1; t += 0.01) {
    const [x, z] = pos(t); acc += Math.hypot(x - px, z - pz) / stride(t); px = x; pz = z;
    if (acc >= 1) { acc -= Math.floor(acc); fn(t, i++); }
  }
}

shSound('sfx', 'events', function (ctx, bus, K) {
  const { fx, sr, r } = K, T = SH;
  const room = K.verb('room', 1.2, { bright: 0.5, damp: 3.6, wet: 0.45, seed: 41, early: [[0.009, 0.5], [0.017, 0.35], [0.027, 0.2]] });
  const big = K.verb('big', 3.2, { bright: 0.4, damp: 2.6, wet: 0.6, seed: 43, pre: 0.03 });
  const far = K.verb('far', 6.0, { bright: 0.3, damp: 2.0, wet: 1.0, seed: 47, pre: 0.08 });

  // ================= the bedroom
  // the shrinking starts: a deep swell under the title
  shTone(K, T.shrink, 4.5, (t) => 46 - 12 * t / 4.5, [[1, 1], [2, 0.25]], (u) => Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.6)), 2) * (1 - u * 0.4), { vol: 0.2 });
  shWhoosh(K, T.shrink - 0.3, 3.0, [300, 900, 2400, 5200], { vol: 0.05, q: 2.5, env: (u) => Math.pow(u, 1.5) * Math.pow(1 - u, 0.5) * 2 });
  // your steps on the boards: lighter and higher the smaller you are
  const woodTap = (t, i, w = 1) => {
    const s = shH(t) / 1.75, y = fx.woodStep({ weight: 0.6, scuff: i % 3 === 0 ? 0.12 : 0 });
    K.put(y, t, { vol: (0.035 + 0.13 * Math.pow(s, 0.45)) * w, norm: true, pan: i % 2 ? 0.12 : -0.12, rate: Math.min(2.6, Math.pow(1 / s, 0.2)), room, wet: 0.2 + 0.4 * (1 - s) });
  };
  const rmPos = (t) => shSpline(SH_RM_POS, t), rmStride = (t) => 0.75 * shH(t);
  shStepsAlong(10.4, 23.3, rmPos, rmStride, woodTap);
  shStepsAlong(47.4, 65.0, rmPos, rmStride, woodTap);
  const S = Math.PI / 7.5;   // the run: a step every 0.42 s (the camera's bob)
  for (let t = T.run + S, i = 0; t < T.jump - 0.05; t += S, i++) woodTap(t, i, 1.3);
  for (let t = T.run + 0.5, i = 0; t < T.jump - 0.2; t += 2 * S, i++) K.put(fx.breath(0.32, {}), t, { vol: 0.035, norm: true, rate: 1.15 });
  // the cat: a wiggle before it leaps; the leap; the glass and the phone go over; it lands (horse-sized to you)
  K.put(fx.rustle(0.8, { density: 300, rub: 0.4, lo: 500, hi: 4000, env: (u) => Math.sin(Math.PI * u) }), 31.6, { vol: 0.05, norm: true, pan: 0.2 });
  shWhoosh(K, T.catJump - 0.05, 0.9, [400, 1500, 700], { vol: 0.2, pan: 0.2, q: 1.0 });
  { const { L, R } = fx.smash({ v: 4.4, g: 9.8, pan: -0.25, pitch: 0.72, slow: 1.3, len: 2.6 }); K.putLR(L, R, T.glassHit, { vol: 0.62, norm: true, room: big, wet: 0.35 }); }
  K.put(fx.liquid(0.7, (t) => Math.exp(-t / 0.18) * Math.min(1, t / 0.01), { f: 380 }), T.glassHit + 0.01, { vol: 0.25, norm: true, pan: -0.25, room, wet: 0.3 });
  shThump(K, T.glassHit, { vol: 0.3, f0: 70, tau: 0.12, pan: -0.25 });
  K.put(fx.hit(fx.panelModes(0.7).map(([f, tau, a]) => [f * 1.8, tau, a]).concat([[2200, 0.03, 0.5], [3900, 0.02, 0.35]]), { width: 0.0008, noise: 0.4 }), T.phoneHit, { vol: 0.42, norm: true, pan: 0.15, room, wet: 0.3 });
  K.put(fx.hit(fx.panelModes(0.5).map(([f, tau, a]) => [f * 1.8, tau, a]), { width: 0.0008 }), T.phoneHit + 0.12, { vol: 0.15, norm: true, pan: 0.15, room, wet: 0.3 });
  shThump(K, T.catLand, { vol: 0.5, f0: 58, tau: 0.16, pan: 0.05 }); shThump(K, T.catLand + 0.08, { vol: 0.35, f0: 52, tau: 0.14, pan: -0.05 });
  K.put(fx.rustle(0.5, { density: 500, rub: 0.5, lo: 300, hi: 3000, env: (u) => Math.exp(-u * 4) }), T.catLand, { vol: 0.1, norm: true });
  // the sniff: bursts of short, deep inhales right in front of you, a warm puff out; its whiskers brush past
  for (let t = 36.6, k = 0; t < T.buzz1 - 0.4; t += 1.15 + 0.2 * Math.sin(k * 1.7), k++) {
    for (let j = 0; j < 3; j++) K.put(fx.breath(0.12, { inhale: true }), t + j * 0.16, { vol: 0.22 * (0.8 + 0.2 * j), norm: true, rate: 0.55, room, wet: 0.15 });
    if (k % 2 === 1) K.put(fx.breath(0.45, {}), t + 0.6, { vol: 0.16, norm: true, rate: 0.6, lp: 1800 });
  }
  K.put(fx.rustle(1.1, { density: 120, rub: 0.1, lo: 2500, hi: 9000, grain: 0.02 }), 39.6, { vol: 0.05, norm: true, pan: 0.4 });
  // Mum's text: the phone buzzes on the floor beside you; the cat startles (a hiss, its claws scrabbling) and bolts
  shBuzz(K, [[T.buzz1, T.buzz1 + 0.35], [T.buzz1 + 0.55, T.buzz1 + 0.9]], { size: 0.55, vol: 0.24, pan: 0.1, room, wet: 0.25 });
  K.put(fx.breath(0.55, { teeth: true }), T.buzz1 + 0.12, { vol: 0.16, norm: true, rate: 0.7, pan: 0.1 });
  for (let t = T.buzz1 + 0.2, i = 0; t < 43.7; t += r.range(0.04, 0.08), i++) K.put(fx.hit([[r.range(2600, 4200), 0.006, 1], [r.range(900, 1300), 0.01, 0.5]], { width: 0.0002 }), t, { vol: 0.05 * r.range(0.5, 1), norm: true, pan: r.range(-0.2, 0.3) });
  for (let t = 43.75, i = 0; t < T.catGone + 0.4; t += 1 / 3.6, i++) {
    const k = shE(t, 43.75, T.catGone + 0.4);
    for (const dt of [0, 0.07]) { const y = fx.woodStep({ weight: 0.7 }); K.put(y, t + dt, { vol: 0.2 * (1 - 0.85 * k), norm: true, pan: -0.15 - 0.55 * k, rate: 0.7, lp: 2500 - 1800 * k, room, wet: 0.3 + 0.4 * k }); }
  }
  // the brick: your grip on it (plastic), the strain, the lift, holding it up, the drop and its bounces
  const plastic = (s = 1) => [[420 * s, 0.05, 1], [780 * s, 0.04, 0.7], [1350 * s, 0.03, 0.5], [2400 * s, 0.02, 0.3], [3700 * s, 0.012, 0.2]];
  K.put(fx.hit(plastic(2.2), { width: 0.0003 }), T.grab, { vol: 0.1, norm: true });
  K.put(fx.breath(1.4, { voice: 0.12, f0: 150, env: (u) => Math.sin(Math.PI * u) }), 66.4, { vol: 0.07, norm: true });
  K.put(fx.rustle(0.5, { density: 600, rub: 0.4, lo: 1200, hi: 5000 }), T.lift, { vol: 0.07, norm: true });
  K.put(fx.creak(1.3, plastic(1.4), { rate: [20, 55] }), T.lift + 0.1, { vol: 0.06, norm: true });
  K.put(fx.creak(3.0, plastic(1.1), { rate: [12, 30], env: (u) => 0.4 + 0.6 * Math.sin(Math.PI * u) }), 69.2, { vol: 0.04, norm: true });
  K.put(fx.breath(1.6, { voice: 0.1, f0: 150 }), 70.4, { vol: 0.06, norm: true });
  K.put(fx.breath(0.7, {}), T.drop + 0.05, { vol: 0.07, norm: true });
  for (let k = 0; k < 4; k++) {
    const t = 72.93 + (k ? 0.168 * k : 0), a = k ? 0.4 * Math.exp(-(k - 1) * 0.9) : 1;
    K.put(fx.hit(plastic(0.8), { width: 0.0012, noise: 0.3, nhp: 1500 }), t, { vol: 0.5 * a, norm: true, pan: 0.05, room, wet: 0.35 });
    if (!k) shThump(K, t, { vol: 0.35, f0: 62, tau: 0.12 });
  }
  // the jump: the push-off, the air (slow motion), the landing on the screen
  shThump(K, T.jump, { vol: 0.15, f0: 80, tau: 0.08 });
  shWhoosh(K, T.jump, T.land - T.jump, [250, 500, 380, 260], { vol: 0.12, q: 0.8, env: (u) => Math.pow(Math.sin(Math.PI * u), 0.8) });
  K.put(fx.hit([[1800, 0.03, 1], [3100, 0.02, 0.6], [5200, 0.012, 0.4], [900, 0.04, 0.5]], { width: 0.0006, noise: 0.3 }), T.land, { vol: 0.3, norm: true, room, wet: 0.2 });
  shThump(K, T.land, { vol: 0.32, f0: 60, tau: 0.15 });
  // walking on the screen: tiny glassy taps
  const glassTap = (t, i, w = 1) => K.put(fx.hit([[r.range(3800, 4600), 0.006, 1], [r.range(6500, 7400), 0.004, 0.5], [r.range(1200, 1500), 0.008, 0.4]], { width: 0.00025 }), t, { vol: 0.045 * w, norm: true, pan: i % 2 ? 0.1 : -0.1 });
  const onPh = (t) => shSpline(SH_RM_ONPH, t);
  shStepsAlong(T.land + 0.6, T.quake, onPh, (t) => 0.75 * shH(t), glassTap);
  // the call: the screen changes under your feet
  K.put(fx.beep(1320, 0.05), T.call, { vol: 0.04, norm: true }); K.put(fx.beep(1760, 0.06), T.call + 0.07, { vol: 0.03, norm: true });
  K.putLR(shCrackle(fx, 0.25, { rate: 2500, hp: 3000, env: (u) => 1 - u }), shCrackle(fx, 0.25, { rate: 2500, hp: 3000, env: (u) => 1 - u }), T.call, { vol: 0.05, norm: true });
  // the quake: the phone vibrating under you (1.2 s on, 0.8 off): on top of it, thrown off (slow motion, darker), from the floor
  {
    const t0 = T.quake - 0.02, t1 = T.floor + 2.4, d = t1 - t0, n = Math.ceil(d * sr), y = fx.arr(d), ex = new Float32Array(n), rat = shNoise(fx, n, 'pink');
    let ph = 0, ph2 = 0;
    for (let i = 0; i < n; i++) {
      const t = t0 + i / sr, c = (t - T.quake) % 2.0, on = t >= T.quake ? MathX.clamp(Math.min(c / 0.03, (1.2 - c) / 0.06), 0, 1) : 0;
      const slow = t < T.thrown ? 1 : t < T.floor + 0.2 ? 0.55 : 1;
      ph += 2 * Math.PI * 168 * slow / sr; ph2 += 2 * Math.PI * 42 * slow / sr;
      const s = Math.sin(ph);
      ex[i] = on * Math.pow(Math.max(0, s), 6);
      y[i] = on * (Math.tanh(2.5 * (0.6 * s + 0.35 * Math.sin(2 * ph))) * 0.45 + 0.9 * Math.sin(ph2) + rat[i] * (0.5 + 0.4 * Math.sin(ph * 0.25)));
    }
    GBX.res(y, ex, [[95, 0.08, 1], [160, 0.06, 0.8], [260, 0.05, 0.6], [410, 0.03, 0.4], [690, 0.02, 0.3]], sr);
    const curve = []; for (let j = 0; j <= 400; j++) { const t = t0 + j / 400 * d; curve.push(t < T.thrown ? 5000 : t < T.floor ? 5000 * Math.pow(0.07, shE(t, T.thrown, T.thrown + 1.5)) : 240); }
    const z = shSweep(y, sr, 'lowpass', 0.7, curve);
    for (let i = 0; i < n; i++) { const t = t0 + i / sr; z[i] = Math.tanh(1.6 * z[i]) * (t < T.thrown ? 1 : t < T.floor ? 0.85 : 0.5); }
    K.put(z, t0, { vol: 0.24, norm: true });
  }
  for (let k = 1; T.quake + k / 2.3 < T.thrown; k++) { glassTap(T.quake + k / 2.3, k, 2.5); shThump(K, T.quake + k / 2.3, { vol: 0.08, f0: 90, tau: 0.05 }); }
  // thrown off the edge: a rush of air; the slow fall (the air catches you); landing soft in the dust
  shWhoosh(K, T.thrown - 0.1, 2.2, [300, 1100, 500, 300], { vol: 0.22, q: 0.9 });
  shBed(K, T.thrown + 0.5, T.floor + 0.2, { colour: 'pink', f: [['bp', 260, 0.7], ['lp', 900]], vol: 0.08, am: 0.5, wr: 0.6, env: (u) => Math.sin(Math.PI * u), fi: 0.4, fo: 0.2 });
  shThump(K, T.floor, { vol: 0.32, f0: 50, tau: 0.3 });
  shBed(K, T.floor, T.floor + 1.2, { colour: 'pink', f: [['lp', 1800]], vol: 0.12, env: (u) => Math.exp(-u * 4), fi: 0.005, fo: 0.2 });
  K.put(fx.rustle(0.6, { density: 1200, rub: 0.1, lo: 1500, hi: 7000, grain: 0.003, env: (u) => Math.exp(-u * 5) }), T.floor + 0.02, { vol: 0.06, norm: true });

  // ================= the dust
  const duPos = (t) => shSpline(SH_DU_POS, t), um = (t) => shH(t) * 1e6;
  shStepsAlong(167.8, 215, duPos, (t) => 0.75 * um(t), (t, i) => {
    const flake = t > 189.8, syrup = t > T.syrup;
    const y = fx.rustle(flake ? 0.16 : 0.12, flake ? { density: 1600, rub: 0.1, lo: 1500, hi: 9000, grain: 0.002, env: (u) => Math.exp(-u * 4) } : { density: 900, rub: 0.15, lo: 500, hi: 4500, grain: 0.004, env: (u) => Math.exp(-u * 5) });
    K.put(y, t, { vol: 0.07, norm: true, pan: i % 2 ? 0.12 : -0.12, lp: syrup ? 1800 : undefined });
    shThump(K, t, { vol: 0.03, f0: 110, tau: 0.04 });
  });
  // the mite: eight feet (a padded thud and a click of shell each), closer and closer; it nibbles; it walks into the water
  {
    const mPos = (t) => shSpline(SH_DU_MITE, t);
    shStepsAlong(140, T.miteStuck + 0.4, mPos, () => 22, (t, i) => {
      const [mx, mz] = mPos(t), [cx, cz] = duPos(t), dd = Math.hypot(mx - cx, mz - cz), a = 1 / (1 + dd / 350);
      const y = fx.arr(0.25);
      for (let j = 0; j < y.length; j++) { const tt = j / sr; y[j] = Math.sin(2 * Math.PI * (85 + 30 * Math.exp(-tt / 0.02)) * tt) * Math.exp(-tt / 0.05) * Math.min(1, tt / 0.003); }
      GBX.strike(y, 0, 3, 0.25, [[r.range(2400, 3200), 0.006, 1], [r.range(4800, 5600), 0.004, 0.5]], sr);
      K.put(y, t, { vol: 0.55 * a * (i % 4 === 0 ? 1 : 0.7), norm: true, pan: MathX.clamp((mx - cx) / (dd + 1), -0.7, 0.7) * 0.6, room: big, wet: 0.2 });
    });
    for (let t = 156.6; t < 159.2; t += r.range(0.25, 0.6)) K.putLR(shCrackle(fx, 0.18, { rate: 400, hp: 1800, env: (u) => Math.sin(Math.PI * u) }), shCrackle(fx, 0.18, { rate: 400, hp: 1800, env: (u) => Math.sin(Math.PI * u) }), t, { vol: 0.07, norm: true });
    // stuck: it thrashes in the water, weaker and weaker
    K.put(fx.liquid(8, (t) => (0.5 + 0.5 * Math.abs(Math.sin(t * 5.3))) * Math.exp(-t / 3.5) * Math.min(1, t / 0.1), { f: 420 }), T.miteStuck, { vol: 0.13, norm: true, pan: 0.45, room: big, wet: 0.3 });
    for (let t = T.miteStuck + 0.2; t < 172; t += r.range(0.12, 0.3)) K.put(fx.hit([[r.range(2400, 3400), 0.006, 1]], { width: 0.0002 }), t, { vol: 0.04 * Math.exp(-(t - T.miteStuck) / 3), norm: true, pan: 0.45 });
  }
  // the water's edge creeping in: a slow low gloop, its surface crackling
  K.put(fx.liquid(16, (t) => Math.sin(Math.PI * Math.min(1, t / 16)) * (0.6 + 0.4 * Math.sin(t * 0.9)), { f: 300 }), 157, { vol: 0.1, norm: true, pan: 0.3, lp: 900, room: big, wet: 0.25 });
  K.putLR(shCrackle(fx, 14, { rate: 160, hp: 3000, env: (u) => Math.sin(Math.PI * u) }), shCrackle(fx, 14, { rate: 160, hp: 3000, env: (u) => Math.sin(Math.PI * u) }), 158, { vol: 0.035, norm: true });
  // the hair creaks; the syrup air (a thick, slow push that stops dead); the pollen grain falls and lands
  K.put(fx.creak(1.6, [[150, 0.03, 1], [330, 0.02, 0.6], [610, 0.012, 0.3]], { rate: [9, 22] }), 175.4, { vol: 0.07, norm: true, pan: -0.3, room: big, wet: 0.4 });
  shBed(K, T.syrup + 0.2, 185.5, { colour: 'brown', f: [['lp', 420]], vol: 0.12, am: 0.6, wr: 0.35, env: (u) => Math.min(1, u * 3), fi: 0.6, fo: 0.02 });
  shWhoosh(K, 186.9, 2.7, [900, 600, 380, 250], { vol: 0.12, q: 0.9, env: (u) => Math.pow(u, 1.6) });
  shThump(K, T.pollen + 0.6, { vol: 0.4, f0: 45, tau: 0.35 });
  K.put(fx.rustle(0.7, { density: 900, rub: 0.2, lo: 400, hi: 3500, env: (u) => Math.exp(-u * 4) }), T.pollen + 0.6, { vol: 0.1, norm: true });
  shBed(K, T.pollen + 0.6, T.pollen + 2.4, { colour: 'pink', f: [['lp', 1500]], vol: 0.08, env: (u) => Math.exp(-u * 3.5), fi: 0.01, fo: 0.3 });
  K.put(fx.rustle(0.5, { density: 1500, rub: 0.15, lo: 1500, hi: 9000, grain: 0.002 }), 189.0, { vol: 0.06, norm: true });
  // bacteria: their flagella's motors whirring, now and then a wet nudge
  for (const [f, pan, ph] of [[96, -0.4, 0], [131, 0.35, 1.3], [74, 0.05, 2.1]]) shTone(K, T.bacteria - 1, 25, (t) => f * (1 + 0.04 * Math.sin(t * 0.7 + ph)), [[1, 1], [2, 0.6], [3, 0.35], [5, 0.15]], (u, t) => Math.min(1, t / 2.5) * (1 - shE(T.bacteria - 1 + t, 219, 224)) * (0.6 + 0.4 * Math.sin(t * 2 * Math.PI * (17 + ph * 3))), { vol: 0.03, pan, f: [['lp', 1400]] });
  for (const t of [203.2, 206.8, 211.4]) K.put(fx.liquid(0.5, (tt) => Math.exp(-tt / 0.12), { f: 260 }), t, { vol: 0.08, norm: true, pan: r.range(-0.5, 0.5) });
  // the Brownian shoves (where the camera is shoved): a soft "thoomp" and a puff of air each
  {
    const kD = (sd, t) => noise1(t * 2.6, sd) * 0.22 + noise1(t * 6.1, sd + 3) * 0.1 + Math.max(0, noise1(t * 1.3, sd + 9)) * 0.25 * Math.sin(t * 9 + sd);
    const kN = (sd, t) => noise1(t * 2.6, sd) * 0.18 + noise1(t * 6.1, sd + 3) * 0.08 + Math.max(0, noise1(t * 1.3, sd + 9)) * 0.2 * Math.sin(t * 9 + sd);
    const off = (t) => {
      const nano = t >= T.sem - 0.8, k = nano ? kN : kD, b = nano ? 0.8 + 0.6 * shWin(t, 262, 286, 2, 3) : shE(t, T.brown - 0.5, T.brown + 2.5) * (1 + 0.6 * shE(t, 222, 233));
      return [k(1, t) * b, k(4, t) * b * 0.5, k(7, t) * b, k(11, t) * b * 0.8];
    };
    const a = T.brown - 0.5, b = T.atomWorld - 1.0, sp = [];
    let prev = off(a);
    for (let t = a + 0.01; t < b; t += 0.01) { const o = off(t); sp.push([t, Math.hypot(o[0] - prev[0], o[1] - prev[1], o[2] - prev[2], o[3] - prev[3]) * 100]); prev = o; }
    const vals = sp.map((s) => s[1]).sort((x, y) => x - y), thr = vals[Math.floor(vals.length * 0.6)], mx = vals[vals.length - 1];
    let last = -1;
    for (let i = 1; i < sp.length - 1; i++) {
      const [t, v] = sp[i];
      if (v > thr && v >= sp[i - 1][1] && v >= sp[i + 1][1] && t - last > 0.3) {
        last = t; const k = Math.min(1, v / mx), pan = r.range(-0.5, 0.5);
        shThump(K, t - 0.02, { vol: 0.16 * (0.3 + 0.7 * k), f0: 75, tau: 0.09, pan, body: 300 });
        shBed(K, t - 0.03, t + 0.25, { colour: 'pink', f: [['bp', 900, 0.8]], vol: 0.04 * (0.3 + 0.7 * k), mono: true, pan, env: (u) => Math.exp(-u * 6), fi: 0.01, fo: 0.05 });
      }
    }
  }

  // ================= the grey
  // the switch to the electron microscope: a deep electric thunk
  shThump(K, T.sem - 0.4, { vol: 0.25, f0: 48, tau: 0.4 });
  K.put(fx.hit(fx.metalModes(220, 0.8), { width: 0.002 }), T.sem - 0.4, { vol: 0.06, norm: true, lp: 1500, room: big, wet: 0.5 });
  // the virus: falling in; its six fibres touching down; it seats; it fires (the sheath snaps shut); the injection
  const P = SH_NA_PH;
  shWhoosh(K, P.fall, P.touch - P.fall, [500, 900, 1400], { vol: 0.05, q: 1.5, env: (u) => Math.pow(u, 2) });
  for (let k = 0; k < 6; k++) K.put(fx.hit([[r.range(2200, 3200), 0.01, 1], [r.range(5000, 6000), 0.006, 0.4]], { width: 0.0002 }), P.touch + k * 0.13 + r.range(0, 0.05), { vol: 0.07, norm: true, pan: -0.5 + k * 0.2 });
  K.put(fx.hit(fx.metalModes(340, 0.5), { width: 0.0015 }), P.seat, { vol: 0.2, norm: true, room: big, wet: 0.3 }); shThump(K, P.seat, { vol: 0.12, f0: 80, tau: 0.08 });
  K.put(fx.clamp({ slow: 2.2, pitch: 0.6 }), P.fire, { vol: 0.4, norm: true, room: big, wet: 0.35 });
  shThump(K, P.fire, { vol: 0.42, f0: 62, tau: 0.2 });
  shBed(K, P.fire, P.fire + 0.5, { colour: 'white', f: [['hp', 1500]], vol: 0.1, env: (u) => Math.exp(-u * 6), fi: 0.003, fo: 0.1 });
  K.put(fx.liquid(1.0, (t) => Math.exp(-t / 0.3) * Math.min(1, t / 0.02), { f: 300 }), P.fired, { vol: 0.12, norm: true, lp: 1200 });
  // the molecular hail: a hard hit on each of the camera's jolts
  for (let k = Math.ceil(262 * 5); k <= Math.floor(287 * 5); k++) {
    if (hash1(k * 13 + 1) <= 0.6) continue;
    const t = k / 5, a = (0.5 + hash1(k * 13 + 2)) * shWin(t, 262, 287, 1.5, 2);
    if (a < 0.05) continue;
    K.put(fx.hit([[r.range(3000, 4200), 0.004, 1], [r.range(5200, 6800), 0.003, 0.6], [r.range(900, 1300), 0.01, 0.5]], { width: 0.00015, noise: 0.5, nhp: 2500 }), t, { vol: 0.13 * Math.min(1.5, a), norm: true, pan: (hash1(k * 13 + 3) - 0.5) * 1.2 });
    shThump(K, t, { vol: 0.08 * Math.min(1.5, a), f0: 95, tau: 0.05, pan: (hash1(k * 13 + 3) - 0.5) });
  }
  // the DNA turns to balls: a glassy shimmer
  K.put(fx.shimmer(3.2, 1180, { skew: 0.4 }), 285.8, { vol: 0.07, norm: true, room: big, wet: 0.5 });

  // ================= the atom, the proton
  shWhoosh(K, T.atomWorld - 1.4, 2.8, [800, 2500, 6000], { vol: 0.07, q: 1.4, env: (u) => Math.pow(Math.sin(Math.PI * u), 1.2) });
  shWhoosh(K, T.proton - 1.2, 2.2, [200, 600, 1600, 400], { vol: 0.14, q: 1.0, env: (u) => Math.pow(u, 1.4) * (1 - Math.pow(u, 6)) });
  shThump(K, T.proton + 0.6, { vol: 0.2, f0: 50, tau: 0.3 });

  // ================= beyond
  // a rush for each ring (each factor of ten smaller) as it sweeps past the edge of the frame
  {
    const H0 = shH(T.unknown), c = Math.log10(0.55) - 0.5;
    let prev = Math.floor(Math.log10(H0 / shH(T.unknown + 2)) - c), k = 0;
    for (let t = T.unknown + 2; t < 428.5; t += 0.01) {
      const lvl = Math.floor(Math.log10(H0 / shH(t)) - c);
      if (lvl > prev) { prev = lvl; k++; shWhoosh(K, t - 0.55, 1.0, [500, 1600, 3200], { vol: 0.035, q: 1.6, pan: k % 2 ? 0.5 : -0.5, env: (u) => Math.pow(u, 2.5) * Math.pow(1 - u, 0.6) * 3 }); }
    }
  }
  // "Up there, she's still calling": her call, buzzing very far above
  shBuzz(K, [[403.7, 404.05], [404.25, 404.6], [405.7, 406.05], [406.25, 406.6]], { size: 0.3, vol: 0.06, lp: 380, room: far, wet: 1.2 });
  // the black hole: a swell sucked in, the boom as it forms; its Hawking glow rises to a whine; the flash; silence
  shWhoosh(K, T.bh - 1.6, 1.62, [6000, 2500, 600, 150], { vol: 0.16, q: 1.2, env: (u) => Math.pow(u, 3) });
  shThump(K, T.bh, { vol: 0.6, f0: 38, tau: 1.4, body: 200 });
  shBed(K, T.bh, T.flash, { colour: 'brown', f: [['lp', 120]], vol: 0.12, am: 0.4, wr: 0.5, env: (u) => Math.exp(-u * 2) + 0.3 * u * u, fi: 0.01, fo: 0.02 });
  shTone(K, T.bh + 0.5, T.flash - T.bh - 0.5, (t) => 180 * Math.pow(40, Math.pow(t / (T.flash - T.bh - 0.5), 2)), [[1, 1], [2, 0.2]], (u) => (0.08 + 0.92 * u * u) * Math.min(1, (1 - u) * (T.flash - T.bh - 0.5) / 0.02), { vol: 0.12 });
  shBed(K, T.bh + 2, T.flash, { colour: 'white', f: [['hp', 2500]], vol: 0.12, env: (u) => Math.pow(u, 3), fi: 0.5, fo: 0.02 });
  shBed(K, T.flash, T.flash + 2.2, { colour: 'white', f: [['hp', 400]], vol: 0.4, env: (u) => Math.exp(-u * 7), fi: 0.002, fo: 0.3 });
  shThump(K, T.flash, { vol: 0.6, f0: 70, tau: 0.5 });
  // in the dark: your phone buzzes on the bedroom floor (her message)
  shBuzz(K, [[T.buzzEnd, T.buzzEnd + 0.35], [T.buzzEnd + 0.55, T.buzzEnd + 0.9]], { size: 0, vol: 0.32, pan: 0.1, room, wet: 0.35 });
});
