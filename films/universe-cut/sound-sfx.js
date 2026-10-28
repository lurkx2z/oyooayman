/* =====================================================================
   SOUND · SFX — the events. Half the universe going makes no sound of its own, so these are the film's marks on the
   clock and the world reacting:
     the clock         dry ticks on the readout's seconds: the last five before 10:00:00, the twelve before the shock,
                       and tonight again at the end (9:59:52 → 10:00)
     10:00:00          a reversed cymbal and bells that swell and stop dead as half the sky goes black
     the Moon          the replay: a slow low throb; a tearing slide down as its far half goes
     the phone         buzzing on the metal table: the failed call
     the cat           a puzzled "mrrp" on the wall
     the house         creaks as "down" tips; the feeder's cord; the bird bath's water
     the shock         (the cold open's and the real one) a deep blow and a crack, then nothing
     space             illustration: the face's roar; its insides blowing out; the rumble of the shock through the
                       rock; the air pouring off the edge; the half-Earth falling in; the oceans boiling
   ===================================================================== */

hvSound('sfx', 'events', function (ctx, bus, K) {
  const { fx, sr } = K;
  const room = K.verb('garden', 1.5, { bright: 0.5, damp: 4, wet: 0.16 });
  const hall = K.verb('space', 3.4, { bright: 0.45, damp: 2.2, shape: 1.8, wet: 0.3 });
  const rev = (y) => { const z = new Float32Array(y.length); for (let i = 0; i < y.length; i++) z[i] = y[y.length - 1 - i]; return z; };
  const fadeEnd = (y, sec) => { const n = Math.round(sec * sr); for (let i = 0; i < n; i++) y[y.length - 1 - i] *= i / n; return y; };
  const sine = (y, f, a, tau, i0 = 0, rise = 0.004) => { for (let i = 0; i + i0 < y.length; i++) { const t = i / sr; y[i0 + i] += a * Math.sin(2 * Math.PI * f * t) * Math.exp(-t / tau) * Math.min(1, t / rise); } return y; };
  // a rumble of brown noise from t0 for d s, its level env(u), through a low-pass at f
  const rumble = (t0, d, env, f, vol, o = {}) => { const n = Math.ceil(d * sr), y = hvNoise(fx, n, 'brown'); HVX.bq(y, 'lp', f, 0.7, sr); HVX.bq(y, 'hp', 28, 0.7, sr); for (let i = 0; i < n; i++) y[i] *= env(i / n); return K.put(y, t0, { vol, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet }); };
  // a rush of air that swells into tEnd and stops there (a reversed, darkening noise tail)
  const rush = (tEnd, d, o = {}) => {
    const n = Math.ceil(d * sr), z = hvNoise(fx, n, o.colour || 'pink');
    for (let i = 0; i < n; i++) z[i] *= Math.exp(-i / ((o.tau || 0.3) * d * sr));
    const y = fadeEnd(rev(hvSweep(z, sr, 'lowpass', 0.8, o.curve || [9000, 4000, 1800, 900, 500])), 0.004);
    return K.put(y, tEnd - d, { vol: o.vol || 0.05, norm: true, pan: o.pan || 0, room: o.room, wet: o.wet });
  };
  // the shock arriving: a deep blow (a falling sine), a crack, the ground roaring for a moment
  const blow = (t, v, tail = 1.6) => {
    const y = fx.arr(tail + 0.5); let ph = 0;
    for (let i = 0; i < y.length; i++) { const u = i / sr, f = 30 + 34 * Math.exp(-u / 0.12); ph += 2 * Math.PI * f / sr; y[i] = Math.sin(ph) * Math.exp(-u / (0.35 * tail)) * Math.min(1, u / 0.003); }
    const c = hvCrackle(fx, 0.6, { rate: 5000, hp: 250, env: (u) => Math.exp(-u * 6) }); hvAddAt(y, c, 0.0, 3.0, sr);
    const z = hvNoise(fx, Math.ceil(tail * sr), 'brown'); HVX.bq(z, 'lp', 260, 0.7, sr); for (let i = 0; i < z.length; i++) z[i] *= Math.exp(-i / (0.4 * tail * sr)) * Math.min(1, i / (0.01 * sr)); hvAddAt(y, z, 0.0, 1.6, sr);
    return K.put(fadeEnd(y, 0.05), t, { vol: v, norm: true });
  };

  // ---- the clock
  const tick = (t, v, pan = 0.15) => K.put(hvClick(fx, { f: 3400, tau: 0.0025, len: 0.04, hp: 1200 }), t, { vol: v, norm: true, pan, room, wet: 0.25 });
  for (let k = 5; k >= 1; k--) tick(HV.t0 - k, 0.035 + 0.01 * (5 - k));
  for (let k = 0; k <= 12; k++) { const t = hvStory(217 + k); if (t < HV.hit - 0.3) tick(t, 0.03 + 0.004 * k, 0.1); }   // 10:03:37 → 10:03:49
  for (let j = 8; j >= 0; j--) { const t = HV.end - 0.45 - j; if (t > HV.question) tick(t, 0.03 + 0.006 * (8 - j)); }

  // ---- the cold open: 10:03:49, the shock (cut short by the title)
  blow(HV.openHit, 0.2, 1.2);

  // ---- 10:00:00: everything in the sky swells and stops dead
  {
    const d = 2.6, n = Math.ceil(d * sr), cym = hvNoise(fx, n, 'white');
    HVX.bq(cym, 'hp', 3200, 0.7, sr); HVX.bq(cym, 'lp', 12000, 0.7, sr);
    for (let i = 0; i < n; i++) cym[i] *= Math.exp(-i / (0.6 * sr));
    const y = new Float32Array(n);
    for (const [nn, a] of [['E6', 0.6], ['B6', 0.4], ['E7', 0.25]]) { const b = fx.bellBuf(hvMidi(nn)); for (let i = 0; i < n && i < b.length; i++) y[i] += b[i] * a; }
    for (let i = 0; i < n; i++) y[i] += 2 * cym[i];
    K.put(fadeEnd(rev(y), 0.003), HV.t0 - d, { vol: 0.11, norm: true });
    // and in the silence after, a soft low drop
    K.put(sine(fx.arr(2.0), 44, 1, 0.5, 0, 0.02), HV.t0 + 0.02, { vol: 0.07, norm: true });
  }

  // ---- the Moon, slowed down 8×: a low throb; its far half tearing away (a slide down), a snap back to real time
  {
    const wipe = HV.replay.t0 + (0.672 - HV.replay.s0) * HV.replay.slow, wEnd = HV.replay.t0 + (1.202 - HV.replay.s0) * HV.replay.slow;
    hvBed(K, HV.moon, HV.moonEnd, { colour: 'brown', f: [['lp', 220], ['hp', 28]], env: (u, t) => 0.6 + 0.4 * Math.sin(2 * Math.PI * 0.7 * t) ** 2, vol: 0.06, fi: 0.5, fo: 0.06, am: 0.4, wr: 0.5 });
    const n = Math.ceil((wEnd - wipe + 0.6) * sr), z = hvNoise(fx, n, 'pink');
    for (let i = 0; i < n; i++) { const u = i / n; z[i] *= Math.sin(Math.PI * Math.min(1, u * 1.1)) ** 1.2; }
    hvSweepPut(K, z, wipe, 'bandpass', 2.0, [2400, 1600, 1000, 600, 380, 240], { vol: 0.05, room: hall, wet: 0.5 });
    K.put(hvClick(fx, { f: 1500, tau: 0.006, len: 0.08 }), HV.moonEnd, { vol: 0.025, norm: true, room, wet: 0.4 });
  }

  // ---- space: the face (a deep roar of heat: illustration); its insides blowing out; the shock through the rock
  rumble(HV.gone + 0.2, HV.face - HV.gone, (u) => Math.min(1, u / 0.25) * Math.min(1, (1 - u) / 0.05) * 0.5, 160, 0.06, { room: hall, wet: 0.3 });
  rumble(HV.face, HV.blow - HV.face + 0.05, (u) => Math.min(1, u / 0.1) * (0.6 + 0.4 * u) * Math.min(1, (1 - u) / 0.02), 240, 0.08, { room: hall, wet: 0.3 });
  rush(HV.blow, 1.8, { vol: 0.08, tau: 0.35, curve: [10000, 6000, 2500, 900, 300], room: hall, wet: 0.4 });
  {
    const d = HV.shock - HV.blow + 0.3, n = Math.ceil(d * sr), L = hvNoise(fx, n, 'pink'), R = hvNoise(fx, n, 'pink');
    for (const y of [L, R]) { HVX.bq(y, 'bp', 700, 0.5, sr); for (let i = 0; i < n; i++) { const u = i / n; y[i] *= Math.min(1, u / 0.05) * Math.min(1, (1 - u) / 0.08) * (0.7 + 0.3 * Math.sin(u * 40)); } }
    K.putLR(L, R, HV.blow, { vol: 0.06, norm: true, room: hall, wet: 0.4 });
  }
  rumble(HV.shock, HV.calls - HV.shock, (u) => Math.min(1, u / 0.2) * Math.min(1, (1 - u) / 0.06) * 0.7, 120, 0.06);

  // ---- your ears popping (a soft, muffled click inside your head)
  K.put(hvClick(fx, { f: 260, tau: 0.018, len: 0.14 }), hvCap('ears', 0).show - 0.15, { vol: 0.07, norm: true });
    // ---- the phone buzzing on the metal table (the failed call); the spoon in the tea
  {
    const buzz = (d) => { const y = fx.arr(d); let ph = 0; for (let i = 0; i < y.length; i++) { const u = i / sr; ph += 2 * Math.PI * 165 / sr; y[i] = Math.tanh(3 * Math.sin(ph)) * Math.min(1, u / 0.01, (d - u) / 0.02); } HVX.bq(y, 'bp', 900, 0.8, sr); return y; };
    for (const [t, d] of [[HV.calls + 0.6, 0.38], [HV.calls + 1.15, 0.38]]) K.put(buzz(d), t, { vol: 0.06, norm: true, pan: -0.1, room, wet: 0.3 });
    // the tea: the spoon chattering against the mug as the tremors start
    { const r = new RNG(311); for (let t = HV.tea + 0.3; t < HV.saturn - 0.2; t += 0.07 + 0.22 * r.next()) K.put(hvClick(fx, { f: r.range(3200, 5200), tau: 0.004, len: 0.05 }), t, { vol: 0.012 + 0.012 * r.next() * MathX.smooth(t - HV.tea, 0, 3), norm: true, pan: 0.15, room, wet: 0.3 }); }
  }

  // ---- Europe from space: the ring racing north, a rolling rumble (illustration); the edge: the air pouring off
  rumble(HV.front + 0.3, HV.edge - HV.front, (u) => Math.min(1, u / 0.1) * Math.min(1, (1 - u) / 0.05) * (0.6 + 0.4 * Math.sin(u * 30) ** 2), 180, 0.07, { room: hall, wet: 0.3 });
  {
    const d = HV.moonedge - HV.edge + 0.1, n = Math.ceil(d * sr), w = [hvNoise(fx, n, 'pink'), hvNoise(fx, n, 'pink')];
    for (const y of w) { HVX.bq(y, 'bp', 520, 0.45, sr); HVX.bq(y, 'lp', 3200, 0.7, sr); const wd = fx.wander(1.2); for (let i = 0; i < n; i++) { const u = i / n; y[i] *= Math.min(1, u / 0.06) * Math.min(1, (1 - u) / 0.04) * (1 + 0.45 * wd(i / sr)); } }
    K.putLR(w[0], w[1], HV.edge, { vol: 0.09, norm: true });
    // the sea spilling over: a hiss and a crackle of boiling and freezing
    const t1 = hvCap('edge', 2).show - 0.3, d2 = HV.moonedge - t1, c = hvCrackle(fx, d2, { rate: 1800, hp: 1800, env: (u) => Math.min(1, u / 0.1) * Math.min(1, (1 - u) / 0.1) });
    K.put(c, t1, { vol: 0.03, norm: true, pan: 0.2, room: hall, wet: 0.3 });
  }
  // Paris: the rumble arriving under it (illustration)
  rumble(HV.paris, HV.alarms - HV.paris, (u) => Math.min(1, u / 0.15) * Math.min(1, (1 - u) / 0.05) * (0.5 + 0.5 * MathX.smooth(u, 0.0, 0.3)), 150, 0.075, { room: hall, wet: 0.3 });

  // ---- the cat: a puzzled "mrrp" on the wall (and at 9:59, asleep, a sleepy one)
  K.put(hvMeow(fx, { d: 0.32, f0: [380, 520, 360], open: 0.45, thin: 0.25 }), HV.cat + 1.0, { vol: 0.04, norm: true, pan: -0.1, room, wet: 0.8 });
  K.put(hvMeow(fx, { d: 0.55, f0: [460, 620, 700], open: 0.8, thin: 0.1 }), HV.cat2 + 1.4, { vol: 0.045, norm: true, pan: -0.1, room, wet: 0.8 });

  // ---- 10:03: the house creaks as "down" tips; the feeder's cord; the bird bath's water
  {
    const r = new RNG(231);
    for (const [t, pan, v] of [[HV.heavier + 0.9, 0.5, 0.05], [HV.heavier + 4.6, -0.4, 0.04], [HV.bath + 1.2, 0.6, 0.045], [hvStory(205), -0.6, 0.05], [HV.count2 + 2.4, 0.4, 0.05], [HV.count2 + 7.0, -0.3, 0.055], [HV.hit - 2.0, 0.2, 0.06]]) {
      const y = fx.creak(r.range(0.6, 1.1), [[r.range(90, 130), 0.05, 1], [r.range(220, 300), 0.03, 0.5], [r.range(500, 650), 0.015, 0.25]], { rate: [10, 30], env: (u) => Math.sin(Math.PI * u) });
      K.put(y, t, { vol: v, norm: true, pan, room, wet: 0.6 });
    }
    const cord = fx.creak(0.5, [[1200, 0.01, 1], [2600, 0.006, 0.4]], { rate: [30, 60], env: (u) => Math.sin(Math.PI * u) });
    K.put(cord, hvCap('heavier', 1).show + 0.6, { vol: 0.012, norm: true, pan: 0.2, room, wet: 0.4 });
    const lap = fx.liquid(2.6, (t) => 0.4 * Math.sin(Math.PI * MathX.clamp(t / 2.6, 0, 1)), {});
    if (lap && lap.length) K.put(lap, HV.bath + 0.4, { vol: 0.014, norm: true, pan: 0.3, room, wet: 0.4 });
  }

  // ---- the shock (10:03:49): the blow, then nothing
  blow(HV.hit, 0.32, 1.8);
  rush(HV.hit, 1.4, { vol: 0.05, tau: 0.3, curve: [6000, 3000, 1400, 700, 300] });

  // ---- after, from space: the half-Earth falling in on itself; the oceans boiling into the sky; the Moon going
  rumble(HV.fall, HV.moonaway - HV.fall + 0.3, (u) => Math.min(1, u / 0.15) * Math.min(1, (1 - u) / 0.08) * (0.8 - 0.3 * u), 110, 0.09, { room: hall, wet: 0.3 });
  {
    const t0 = hvCap('fall', 2).show - 0.4, d = HV.moonaway - t0 + 0.3, n = Math.ceil(d * sr), L = new Float32Array(n), R = new Float32Array(n), r = new RNG(237);
    for (let t = 0; t < d; t += r.range(0.004, 0.02)) { const a = MathX.smooth(t, 0, 1.2); if (r.next() < 0.3 + 0.6 * a) fx.bubble(L, R, Math.round(t * sr), r.range(140, 700), r.range(0.01, 0.035), 0.35 * a * r.range(0.4, 1), r.range(-0.9, 0.9)); }
    const steam = hvNoise(fx, n, 'white'); HVX.bq(steam, 'hp', 2500, 0.7, sr);
    for (let i = 0; i < n; i++) { const t = i / sr, e = MathX.smooth(t, 0, 1.0) * Math.min(1, (d - t) / 0.4); L[i] = L[i] * e + 0.12 * steam[i] * e; R[i] = R[i] * e + 0.12 * steam[i] * e * 0.9; }
    K.putLR(L, R, t0, { vol: 0.05, norm: true, room: hall, wet: 0.35 });
  }
  {
    const d = 2.6, z = hvNoise(fx, Math.ceil(d * sr), 'pink');
    for (let i = 0; i < z.length; i++) { const u = i / z.length; z[i] *= Math.sin(Math.PI * u) ** 1.5; }
    hvSweepPut(K, z, hvCap('moonaway', 2).show - 0.6, 'bandpass', 1.4, [1400, 900, 600, 400, 260], { vol: 0.035, room: hall, wet: 0.6 });
  }
});
