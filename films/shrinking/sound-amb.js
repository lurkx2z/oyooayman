/* =====================================================================
   SOUND · AMBIENCE — each scale's own air, cross-faded with the picture:
     the bedroom   room tone that deepens as the room grows round you; the cat purring until it notices you; a clock
                   ticking somewhere (the same tick each second, but bigger and more echoing as you shrink); a car
                   outside, Mum in the kitchen; the spilt water; on the phone, the screen's faint electric whine
     the dust      a fine hiss (the air itself, louder as you shrink); the house far above as a low rumble; Mum's
                   footsteps, enormous and far away, when she starts looking for you
     the grey      the microscope's hum and its beam's whine; then the molecular hail
     the atom      almost nothing: a high airy shimmer, the electrons' fizz, silence, the nucleus's low thrum
     the proton    a roaring storm, popping with pairs; it falls away round the quark
     beyond        a deep drone; space itself crackling and bubbling (the foam)
   ===================================================================== */

shSound('amb', 'places', function (ctx, bus, K) {
  const { fx, sr, r } = K, T = SH;
  const room = K.verb('room', 1.4, { bright: 0.45, damp: 3.4, wet: 0.5, seed: 21, early: [[0.011, 0.5], [0.019, 0.35], [0.031, 0.25]] });
  const hugeRoom = K.verb('huge', 4.5, { bright: 0.3, damp: 2.4, wet: 0.7, seed: 23, pre: 0.05 });
  const g = (t) => MathX.clamp(Math.log10(1.75 / shH(t)) / 2.4, 0, 1);   // 0 at full height … 1 at ~7 mm

  // ---- the bedroom (0 → the fall into the dust)
  const roomEnd = T.floor + 0.6;
  shBed(K, 0, roomEnd, { colour: 'pink', f: [['hp', 70], ['lp', 1600]], vol: 0.05, am: 0.15, env: (u, t) => (1 - 0.65 * g(t)) * (1 - shE(t, T.floor - 2, roomEnd)), fo: 0.3 });
  shBed(K, 0, roomEnd, { colour: 'brown', f: [['lp', 150]], vol: 0.09, am: 0.35, wr: 0.2, env: (u, t) => (0.25 + 0.75 * g(t)) * (1 - shE(t, T.floor - 2, roomEnd)), fo: 0.3 });
  // the cat purring (until it notices you): a ~25 Hz buzz, louder breathing in; a deeper body as you shrink
  {
    const t1 = T.catLook + 0.07, n = Math.ceil(t1 * sr), y = shNoise(fx, n, 'pink'), lo = shNoise(fx, n, 'brown');
    GBX.bq(y, 'bp', 190, 0.9, sr); GBX.bq(y, 'lp', 1100, 0.7, sr); GBX.bq(lo, 'lp', 140, 0.7, sr);
    let ph = 0, pk = 0; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(lo[i]));
    for (let i = 0; i < n; i++) {
      const t = i / sr, cyc = (t % 2.3) / 2.3, inh = cyc < 0.42, a = inh ? Math.sin(Math.PI * cyc / 0.42) : 0.65 * Math.sin(Math.PI * (cyc - 0.42) / 0.58);
      ph += 2 * Math.PI * (inh ? 26 : 23) / sr;
      const pulse = Math.pow(0.5 + 0.5 * Math.sin(ph), 3), e = (0.12 + 0.88 * pulse) * (0.25 + 0.75 * Math.max(0, a)) * Math.min(1, t / 1.5, (t1 - t) / 0.05);
      y[i] = (y[i] + 2.2 * lo[i] / pk * 0.3 * shE(t, 3, 16)) * e;
    }
    K.put(y, 0, { vol: 0.09, norm: true, pan: 0.3, room, wet: 0.3 });
  }
  // the clock: tick, tock, every second; as you shrink it gets lower, longer and more echoing
  for (let t = 0.5, i = 0; t < T.floor - 0.5; t += 1, i++) {
    const h = shH(t), s = Math.pow(h / 1.75, 0.3), tau = Math.pow(1.75 / h, 0.15), b = (i % 2 ? 2700 : 3300) * s;
    const y = fx.hit([[b, 0.01 * tau, 1], [b * 1.73, 0.006 * tau, 0.6], [b * 2.9, 0.004 * tau, 0.35], [b * 0.51, 0.012 * tau, 0.4]], { width: 0.00015, noise: 0.3, nhp: 3000 });
    K.put(y, t, { vol: 0.03 * (1 + 0.8 * g(t)) * (t > T.land ? 0.7 : 1), norm: true, pan: 0.55, room: hugeRoom, wet: 0.15 + 0.6 * g(t) });
  }
  // outside: cars passing (a swell of low noise)
  for (const [t, d, pan] of [[6.5, 6, -0.5], [52, 7, 0.4], [97, 7, -0.4]]) shBed(K, t, t + d, { colour: 'pink', f: [['bp', 420, 0.6], ['lp', 900]], vol: 0.03, mono: true, pan, env: (u) => Math.pow(Math.sin(Math.PI * u), 2), fi: 0.3, fo: 0.3 });
  // Mum in the kitchen, far away: pans and plates
  for (const t of [38.6, 39.4, 40.1, 41.3, 41.6, 42.4]) K.put(fx.hit(fx.metalModes(r.range(900, 1500), 0.6), { width: 0.0004 }), t, { vol: 0.012, norm: true, pan: -0.6, lp: 2400, room: hugeRoom, wet: 0.9 });
  // the spilt water: a trickle off the table and onto the floor, then drips
  K.put(fx.liquid(6, (t) => Math.exp(-t / 1.6) * Math.min(1, t / 0.05), { f: 700 }), T.glassHit + 0.05, { vol: 0.07, norm: true, pan: -0.25, room, wet: 0.3 });
  for (let t = 37.8; t < 58; t += r.range(1.3, 3.2)) K.put(fx.hit([[r.range(900, 1400), 0.03, 1], [r.range(2200, 2800), 0.015, 0.4]], { width: 0.0004 }), t, { vol: 0.012, norm: true, pan: -0.35, room, wet: 0.5 });
  // on the phone: the screen's whine (its backlight's buzz)
  shTone(K, T.land - 0.3, T.thrown + 1.5 - (T.land - 0.3), 240, [[1, 0.5], [2, 0.3], [3, 0.6], [5, 0.2], [13, 0.15]], (u, t) => Math.min(1, t / 2) * (1 - shE(T.land - 0.3 + t, T.thrown, T.thrown + 1.4)), { vol: 0.016, f: [['hp', 200]] });
  shTone(K, T.land - 0.3, T.thrown + 1.5 - (T.land - 0.3), 3150, [[1, 1], [1.004, 0.6]], (u, t) => Math.min(1, t / 2) * (1 - shE(T.land - 0.3 + t, T.thrown, T.thrown + 1.4)) * (0.7 + 0.3 * Math.sin(t * 0.7)), { vol: 0.004 });

  // ---- the dust (from the fall to the grey): the air's hiss, the house far above, Mum's footsteps
  const d0 = T.floor - 2.2, d1 = T.sem + 0.9;
  const duEnv = (t) => shE(t, d0, T.floor + 0.4) * (1 - shE(t, T.sem - 0.6, d1));
  shBed(K, d0, d1, { colour: 'pink', f: [['hp', 1800], ['lp', 9000]], vol: 0.03, am: 0.2, wr: 0.8, env: (u, t) => duEnv(t) * (0.6 + 0.8 * shE(t, 140, 232)) * (1 - 0.4 * shE(t, T.fade, T.sem)), fi: 0.3, fo: 0.3 });
  shBed(K, d0, d1, { colour: 'brown', f: [['lp', 95]], vol: 0.1, am: 0.45, wr: 0.15, env: (u, t) => duEnv(t), fi: 0.3, fo: 0.3 });
  shBed(K, d0, d1, { colour: 'pink', f: [['bp', 320, 0.5], ['lp', 1400]], vol: 0.025, am: 0.5, wr: 0.3, env: (u, t) => duEnv(t) * (1 - 0.6 * shE(t, T.fade, T.sem)), fi: 0.3, fo: 0.3 });
  // Mum, searching the house (enormous, far away): footsteps, a door
  for (let k = 0; k < 9; k++) {
    const t = 205.3 + k * 0.62 + (k > 4 ? 0.9 : 0), y = fx.arr(1.5);
    for (let i = 0; i < y.length; i++) { const tt = i / sr; y[i] = Math.sin(2 * Math.PI * (34 + 6 * Math.exp(-tt / 0.1)) * tt) * Math.exp(-tt / 0.22) * Math.min(1, tt / 0.01); }
    K.put(y, t, { vol: 0.07 * (k > 4 ? 0.75 : 1), norm: true, pan: -0.2, room: hugeRoom, wet: 0.6 });
  }
  K.put(fx.hit(fx.woodModes(60, 3), { width: 0.006, len: 1.2 }), 213.0, { vol: 0.05, norm: true, pan: 0.25, lp: 400, room: hugeRoom, wet: 0.8 });

  // ---- the grey (the electron microscope): its hum, its beam's whine, the vacuum; the molecular hail
  const n0 = T.sem - 0.8, n1 = T.atomWorld + 1.2;
  const naEnv = (u, t) => shE(t, n0, T.sem + 0.8) * (1 - shE(t, T.atomWorld - 1.2, n1));
  shTone(K, n0, n1 - n0, 50, [[1, 0.4], [2, 1], [3, 0.45], [4, 0.3], [6, 0.12]], (u, t) => naEnv(u, n0 + t), { vol: 0.03, pan: 0.15 });
  shTone(K, n0, n1 - n0, 7400, [[1, 1], [1.003, 0.7]], (u, t) => naEnv(u, n0 + t) * (0.6 + 0.4 * Math.sin(t * 0.9)), { vol: 0.004, pan: -0.2 });
  shBed(K, n0, n1, { colour: 'pink', f: [['hp', 3000], ['lp', 10000]], vol: 0.018, env: naEnv, fi: 0.3, fo: 0.3 });
  shBed(K, n0, n1, { colour: 'brown', f: [['lp', 120]], vol: 0.05, am: 0.3, env: naEnv, fi: 0.3, fo: 0.3 });
  {
    const a = 259.5, b = 290.0, hailE = (u) => shE(a + u * (b - a), 260, 274) * (1 - shE(a + u * (b - a), 286.5, 289.8));
    const L = shCrackle(fx, b - a, { rate: 650, env: hailE, hp: 800 }), R = shCrackle(fx, b - a, { rate: 650, env: hailE, hp: 800 });
    K.putLR(L, R, a, { vol: 0.09, norm: true });
    shBed(K, a, b, { colour: 'brown', f: [['lp', 260]], vol: 0.06, am: 0.6, wr: 2.5, env: hailE, fi: 0.3, fo: 0.3 });
  }

  // ---- the atom: an airy shimmer; the electrons' fizz; nothing; the nucleus's thrum
  const a0 = T.atomWorld - 1.2, a1 = T.proton + 0.8;
  shBed(K, a0, T.empty + 0.3, { colour: 'pink', f: [['bp', 5200, 0.7]], vol: 0.012, am: 0.4, wr: 0.4, env: (u, t) => shE(t, a0, T.atomWorld + 1.5), fi: 0.3, fo: 0.05 });
  {
    const a = 305.5, b = T.empty + 0.3, e = (u) => { const t = a + u * (b - a); return shE(t, 305.5, 312) * (1 - 0.4 * shE(t, 312, 316)) * Math.min(1, (b - t) / 0.08); };
    K.putLR(shCrackle(fx, b - a, { rate: 1400, env: e, hp: 3500 }), shCrackle(fx, b - a, { rate: 1400, env: e, hp: 3500 }), a, { vol: 0.03, norm: true });
  }
  shBed(K, T.empty + 0.3, T.nucleus, { colour: 'pink', f: [['hp', 6000]], vol: 0.0025, fi: 1.5, fo: 1.0 });
  shTone(K, T.nucleus - 1.0, a1 - (T.nucleus - 1.0), 41, [[1, 1], [2, 0.55], [3, 0.3], [4, 0.12]], (u, t) => shE(T.nucleus - 1 + t, T.nucleus - 1, T.nucleus + 3) * (1 - shE(T.nucleus - 1 + t, T.proton - 1, a1)) * (0.75 + 0.25 * Math.sin(t * 2 * Math.PI * 5.5)), { vol: 0.06 });

  // ---- the proton: the storm, falling away round the quark
  const p0 = T.proton - 1.4, p1 = T.unknown + 4.5;
  const prEnv = (u, t) => shE(t, p0, T.storm) * (1 - 0.6 * shE(t, 371, 377)) * (1 - 0.9 * shE(t, 386, 391)) * (1 - shE(t, 391, p1));
  shBed(K, p0, p1, { colour: 'brown', f: [['lp', 260]], vol: 0.16, am: 0.6, wr: 0.8, env: prEnv, fi: 0.3, fo: 0.3 });
  shBed(K, p0, p1, { colour: 'pink', f: [['bp', 700, 1.0]], vol: 0.06, am: 0.7, wr: 1.5, env: prEnv, fi: 0.3, fo: 0.3 });
  {
    const e = (u) => prEnv(0, p0 + u * (p1 - p0));
    K.putLR(shCrackle(fx, p1 - p0, { rate: 90, env: e, hp: 500 }), shCrackle(fx, p1 - p0, { rate: 90, env: e, hp: 500 }), p0, { vol: 0.07, norm: true });
  }

  // ---- beyond: a deep drone; the foam (crackling, bubbling); all of it gone in the flash
  const v0 = T.unknown + 1.5, v1 = T.flash + 0.05;
  shTone(K, v0, v1 - v0, 36, [[1, 1], [1.5, 0.3], [2.01, 0.25]], (u, t) => shE(v0 + t, v0, v0 + 5) * (1 - shE(v0 + t, v1 - 0.04, v1)) * (0.8 + 0.2 * Math.sin(t * 0.6)), { vol: 0.05 });
  shBed(K, v0, v1, { colour: 'pink', f: [['hp', 4000]], vol: 0.006, fi: 3, fo: 0.03 });
  {
    const a = T.foam - 1.5, b = v1, e = (u) => { const t = a + u * (b - a); return shE(t, a, T.foam + 6) * (1 + 0.6 * shE(t, T.planck - 2, T.planck)) * (1 - 0.5 * shE(t, T.bh, T.bh + 3)) * Math.min(1, (b - t) / 0.03); };
    K.putLR(shCrackle(fx, b - a, { rate: 900, env: e, hp: 1200 }), shCrackle(fx, b - a, { rate: 900, env: e, hp: 1200 }), a, { vol: 0.06, norm: true });
    const n = Math.ceil((b - a) * sr), L = new Float32Array(n), R = new Float32Array(n);
    for (let t = 0; t < b - a - 0.2; t += r.range(0.03, 0.12)) { const k = e(t / (b - a)); if (k > 0.05 && r.chance(0.7)) fx.bubble(L, R, Math.round(t * sr), r.range(300, 1600), r.range(0.008, 0.03), 0.3 * k, r.range(-0.8, 0.8)); }
    K.putLR(L, R, a, { vol: 0.04, norm: true });
  }
});
