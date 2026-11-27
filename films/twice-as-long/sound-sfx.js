/* =====================================================================
   SOUND · EFFECTS — every step, and what each one does, at its story moment:
     steps 1–5     a push-off and a landing on the pavement (a slowed stride sounds slowed: lower, longer)
     steps 6–9     the whoosh of the stride grows, the landings thud; step 7 cracks the pavement; phones; awnings tear
     step 10       the sonic boom; every window on the street; car alarms
     steps 11–15   a boom every step, the roar of squeezed air, the crater, escape velocity
     the sky       the meteor's roar and crackle; Boston hears the bang (and gasps)
     space         a soft deep push for every step; things whoosh past (the Station, the Moon, the planets, Voyager,
                   Proxima); the light pulse; your watch, and Earth's clock
     home          the boss's phone; the posters in the wind
     the deep      the push grows deeper; step ninety the deepest of all
   ===================================================================== */

twSound('sfx', 'steps', function (ctx, bus, K) {
  const fx = K.fx, sr = fx.sr, room = K.verb('street', 1.6, { bright: 0.5, damp: 3.5, wet: 0.22, seed: 11 }), hall = K.verb('void', 5.5, { bright: 0.35, damp: 2.2, wet: 0.5, seed: 12 });
  const put = (x, t, o = {}) => K.put(x, t, o), putLR = ([L, R], t, o = {}) => K.putLR(L, R, t, o);
  // ---- the ground: steps 1–15
  for (let n = 1; n <= 15; n++) {
    const t0 = TW_T[n], d = TW_D[n], t1 = t0 + d, k = (n - 1) / 14, slow = Math.max(1, d / 1.0);
    // push-off (a scuff and a knock), heavier every step
    put(fx.step({ weight: 0.35 + 0.4 * Math.min(1, k * 2), scuff: true, s: 1.0 }), t0 - 0.02, { vol: 0.35 + 0.2 * Math.min(1, k * 2), room, wet: 0.5, pan: 0 });
    // the stride: a whoosh that grows with the step (from 4: you're flying)
    if (n >= 3) putLR(twWhoosh(fx, Math.max(0.5, d * 0.95), 180 + 40 * n, 900 + 160 * n, 220, { peak: 0.45, q: 0.9, p0: -0.4, p1: 0.4 }), t0 + 0.02, { vol: Math.min(0.9, 0.12 + 0.09 * n) });
    if (n >= 6) put(twThump(fx, 60, 30, 0.35 + 0.05 * n, { click: 0.3 }), t0, { vol: 0.15 + 0.04 * n });
    // landing (on the pavement until 9; then the craters)
    if (n <= 9) {
      put(fx.step({ weight: 0.5 + 0.06 * n, s: 1 / Math.sqrt(slow), body: 78 / Math.sqrt(slow), decay: 0.035 * Math.sqrt(slow) }), t1, { vol: 0.5 + 0.05 * n, room, wet: 0.6 });
      if (n >= 6) put(twThump(fx, 80, 36, 0.12 + 0.03 * (n - 6), { click: 0.5 }), t1, { vol: 0.25 + 0.08 * (n - 6) });
      // step 7: the pavement cracks (a grinding snap through stone)
      if (n >= 7) { const c = fx.creak(0.5, fx.stoneModes(0.8), { rate: [160, 420], env: (u) => Math.exp(-u * 4) }); put(c, t1 + 0.01, { vol: 0.35 + 0.1 * (n - 7), room, wet: 0.5 }); put(fx.hit(fx.stoneModes(0.6), { width: 0.002, noise: 0.4, nlen: 0.03, nhp: 900 }), t1, { vol: 0.5 }); }
    } else if (n <= 14) {
      // a crater: a deep hit, the ground breaking, debris raining down
      put(twThump(fx, 55, 24, 0.5 + 0.05 * (n - 10), { click: 0.8, clickHz: 1500 }), t1, { vol: 0.75 });
      putLR(twBed(fx, 0, 2.2, 'brown', 40, 900, (t) => Math.exp(-t / 0.6) * Math.min(1, t / 0.02) * 2.2), t1 + 0.02, { vol: 0.6 });
      const deb = fx.rustle(1.6, { density: 300, rub: 0.15, lo: 600, hi: 5000, grain: 0.01, env: (u) => Math.pow(1 - u, 1.5) * Math.min(1, u * 8) });
      put(deb, t1 + 0.25, { vol: 0.45, room, wet: 0.4, pan: 0.2 });
    }
  }
  // ---- the step back (step five, 12 m backwards over the bus): a scrape of the heel first
  put(fx.rustle(0.35, { density: 600, rub: 0.6, lo: 700, hi: 4000, grain: 0.005 }), TW_T[5] - 0.25, { vol: 0.25, room });
  // ---- space and the deep: a soft deep push for every step (no air: felt more than heard), bigger as they grow
  for (let n = 21; n <= 90; n++) {
    const t0 = TW_T[n], deep = n >= 57, k = (n - 21) / 69;
    if (t0 > TW.end) break;
    put(twThump(fx, 52 - 12 * k, 26 - 6 * k, 0.4 + 0.5 * k, { click: 0.12, clickHz: 900 }), t0, { vol: 0.32 + 0.25 * k, room: deep ? hall : null, wet: 0.35 });
    putLR(twWhoosh(fx, Math.min(TW_D[n], 3.2) + 0.4, 90, 420 + 300 * (1 - k), 120, { peak: 0.3, q: 0.8, colour: 'brown', p0: 0.3, p1: -0.3 }), t0, { vol: 0.18 + 0.1 * k });
  }
  // step ninety: the deepest push there is (and in the cold open, the same moment's aftermath: a long low swell)
  put(twThump(fx, 40, 18, 2.2, { click: 0.2, clickHz: 600 }), TW_T[90], { vol: 0.9, room: hall, wet: 0.5 });
  putLR(twBed(fx, 0, 3.5, 'brown', 20, 200, (t) => Math.min(1, t / 0.05) * Math.exp(-t / 1.2) * 1.4), 0.0, { vol: 0.55 });
  put(twThump(fx, 44, 20, 1.6, { click: 0.15, clickHz: 700 }), 0.02, { vol: 0.75, room: hall, wet: 0.5 });
});

twSound('sfx', 'street', function (ctx, bus, K) {
  const fx = K.fx, sr = fx.sr, room = K.verb('street', 1.6, { bright: 0.5, damp: 3.5, wet: 0.22, seed: 11 });
  const put = (x, t, o = {}) => K.put(x, t, o), putLR = ([L, R], t, o = {}) => K.putLR(L, R, t, o), r = new RNG(CONFIG.seed + 707);
  // the bus pulls in (air brakes, the door)
  { const sh = twShotOf('busArrive'); const hiss = fx.rustle(1.1, { density: 4000, rub: 0.9, lo: 2500, hi: 9000, grain: 0.002, env: (u) => Math.min(1, u * 12) * Math.pow(1 - u, 0.8) });
    put(hiss, sh.t0 + 0.9, { vol: 0.2, room, pan: 0.4 }); }
  // phones: people filming you (shutter clicks)
  { const sh = twShotOf('phones'); for (let i = 0; i < 6; i++) { const c = fx.hit([[3200, 0.004, 1], [5400, 0.003, 0.6], [1800, 0.006, 0.4]], { width: 0.0002, noise: 0.5, nlen: 0.006, nhp: 3000 }); put(c, sh.t0 + 0.2 + i * 0.23 + r.range(0, 0.1), { vol: 0.18, pan: r.range(-0.7, 0.7), room }); } }
  // step nine's wake tears the awnings off the shops (the fabric snapping, flapping, a frame clattering)
  { const sh = twShotOf('awnings'); for (let i = 0; i < 5; i++) { const f = fx.rustle(r.range(0.4, 0.9), { density: 900, rub: 0.7, lo: 300, hi: 5000, grain: 0.004, env: (u) => Math.pow(Math.sin(Math.PI * u), 0.5) }); put(f, sh.t0 + 0.1 + i * 0.35, { vol: 0.5, pan: r.range(-0.6, 0.6), room }); }
    put(fx.hit(fx.metalModes(410, 0.5), { width: 0.001, noise: 0.3 }), sh.t0 + 0.9, { vol: 0.25, room, pan: -0.3 });
    putLR(twWhoosh(fx, 1.6, 120, 1500, 300, { peak: 0.25 }), sh.t0, { vol: 0.5 }); }
  // ---- step ten: the sound barrier (the boom: the cracks, the windows a street at a time, the alarms)
  { const tb = TW_BOOM.t;
    putLR(twBoom(fx, { len: 5, tail: 1.4, gap: 0.14 }), tb, { vol: 1.0 });
    for (let i = 0; i < 26; i++) { const dt = 0.05 + Math.pow(i / 26, 1.4) * 2.6, s = fx.smash({ v: r.range(5, 9), g: 9.8, pan: r.range(-0.9, 0.9), len: 1.6 }); K.putLR(s.L, s.R, tb + dt, { vol: 0.42 * (1 - 0.5 * i / 26), room, wet: 0.4 }); }
    // car alarms, one after another, until we leave the street
    const t1 = twShotOf('leap11').t0 + 0.3;
    [[1.4, 900, 1250, 0.42, false, -0.5], [2.1, 700, 1500, 0.9, true, 0.4], [2.9, 1100, 1450, 0.3, false, 0.7]].forEach(([dt, f1, f2, per, wh, pan]) => put(twAlarm(fx, t1 - tb - dt, { f1, f2, per, whoop: wh }), tb + dt, { vol: 0.1, pan, room, wet: 0.5, stop: t1, fade: 0.4 })); }
  // ---- steps 11–14: a boom every step, behind you
  for (let n = 11; n <= 14; n++) putLR(twBoom(fx, { len: 3, tail: 0.8, gap: 0.09 }), TW_T[n] + 0.15, { vol: 0.55 });
  // ---- the squeezed air: a roar that glows hotter (step 12's end to step 14)
  { const a = twShotOf('squeeze').t0, b = TW_T[14] + 0.5;
    putLR(twBed(fx, a, b, 'pink', 120, 5000, (t) => 0.5 * twEv(t, a, a + 2) * (1 - twEv(t, b - 0.8, b)) * (0.6 + 0.6 * twEv(t, TW_T[13], TW_T[13] + 2)), { wobble: 2.5 }), a, { vol: 0.5 }); }
  // ---- step fifteen: escape velocity (a tearing roar), and the ground curving away
  { const a = TW_T[15] - 0.1, b = twShotOf('never').t1;
    putLR(twBoom(fx, { len: 4, tail: 1.5, gap: 0.07 }), a + 0.1, { vol: 0.7 });
    putLR(twBed(fx, a, b, 'pink', 60, 3000, (t) => 0.7 * twEv(t, a, a + 0.6) * (1 - twEv(t, b - 1.5, b)), { wobble: 3 }), a, { vol: 0.45 }); }
});

twSound('sfx', 'skyspace', function (ctx, bus, K) {
  const fx = K.fx, sr = fx.sr, hall = K.verb('void', 5.5, { bright: 0.35, damp: 2.2, wet: 0.5, seed: 12 });
  const put = (x, t, o = {}) => K.put(x, t, o), putLR = ([L, R], t, o = {}) => K.putLR(L, R, t, o), r = new RNG(CONFIG.seed + 909);
  // ---- the meteor: a roar with crackle, low over New England
  { const a = twShotOf('meteor').t0, b = twShotOf('boston').t0;
    putLR(twBed(fx, a, b + 0.2, 'brown', 30, 700, (t) => 1.2 * twEv(t, a, a + 0.5) * (1 - twEv(t, b - 0.3, b + 0.2)), { wobble: 2 }), a, { vol: 0.6 });
    const cr = fx.rustle(b - a, { density: 140, rub: 0.0, lo: 1500, hi: 8000, grain: 0.004, env: (u) => Math.min(1, u * 6) * (1 - Math.pow(u, 6)) }); put(cr, a, { vol: 0.35 }); }
  // ---- Boston: they hear the bang (a far boom off the buildings), and gasp
  { const tb = twWord('boston', 'bang').start + 0.25;
    { const bb = twBoom(fx, { len: 5, tail: 1.8, gap: 0.2 }); for (const x of bb) { TWX.bq(x, 'lp', 900, 0.7, sr); TWX.bq(x, 'lp', 900, 0.7, sr); } putLR(bb, tb, { vol: 0.6 }); }
    putLR(twGasp(fx, { n: 8, spread: 0.4 }), tb + 0.35, { vol: 0.32 }); }
  // ---- space: things whoosh past you (each at the moment you pass it)
  const passes = [['iss', 0.6, 900], ['moon', 0.9, 400], ['mars', 0.7, 500], ['jupiter', 1.0, 260], ['saturn', 0.9, 300], ['pluto', 0.6, 650], ['voyager', 0.5, 1100], ['proxima', 1.0, 200]];
  for (const [k, v, f] of passes) {
    const tp = twPassOf(k);
    putLR(twWhoosh(fx, 1.6, f * 0.5, f * 3, f * 0.35, { peak: 0.42, q: 1.4, p0: -0.8, p1: 0.8, colour: 'pink' }), tp - 0.65, { vol: 0.5 * v });
    put(twThump(fx, 70, 30, 0.6, { click: 0.1 }), tp, { vol: 0.35 * v, room: hall, wet: 0.4 });
  }
  // the light pulse passing you (Y3): a bright zing that slides past
  { const sh = twShotOf('nothing'); const z = fx.shimmer(2.2, 1320, { skew: 0.45 }); put(z, sh.t0 + 0.1, { vol: 0.16, room: hall, wet: 0.5 }); }
  // your watch (Y4, Y5: a tick every second of your time), and Earth's clock (Y5–Y6: 1.67 ticks for each of yours)
  { const tk = fx.hit([[2900, 0.006, 1], [4700, 0.004, 0.5], [1500, 0.01, 0.3]], { width: 0.0002 }), tk2 = fx.hit([[1900, 0.008, 1], [3300, 0.005, 0.5]], { width: 0.0003 });
    const a = twShotOf('time').t0, b = twShotOf('issAge').t0, e0 = twShotOf('clocks').t0, e1 = twShotOf('issAge').t0;
    for (let t = Math.ceil(a) + 0.02; t < b; t += 1.0) put(tk, t, { vol: 0.22, pan: -0.15 });
    for (let t = e0 + 0.3; t < e1; t += 1 / twStepEarthS(30)) put(tk2, t, { vol: 0.16, pan: 0.3 }); }
  // the Sun's light, eight minutes on the way: a low swell under Z3/Z4
  // Voyager: its faint carrier (a soft beep every second)
  { const a = twShotOf('voyager').t0, b = twShotOf('day').t0; for (let t = a + 0.5; t < b - 0.3; t += 1.1) put(fx.beep(1150, 0.09), t, { vol: 0.04, room: hall, wet: 0.6, pan: 0.2 }); }
  // the red giant (AN, AO): a deep slow roar
  { const a = twShotOf('redgiant').t0, b = twShotOf('swallow').t1;
    putLR(twBed(fx, a, b, 'brown', 25, 300, (t) => 1.1 * twEv(t, a, a + 1.5) * (1 - twEv(t, b - 0.8, b)), { wobble: 0.6 }), a, { vol: 0.5 }); }
});

twSound('sfx', 'home', function (ctx, bus, K) {
  const fx = K.fx, sr = fx.sr, room = K.verb('office', 0.8, { bright: 0.6, damp: 5, wet: 0.25, seed: 14 });
  const put = (x, t, o = {}) => K.put(x, t, o), r = new RNG(CONFIG.seed + 1001);
  // the evening: your boss calling (a phone ringing on a desk), then not
  { const sh = twShotOf('evening'), ring = (t) => { for (let k = 0; k < 2; k++) put(fx.beep(k ? 1320 : 1760, 0.12), t + k * 0.16, { vol: 0.08, room, pan: -0.2 }); };
    for (let t = sh.t0 + 0.3; t < sh.t1 - 0.4; t += 1.2) { ring(t); ring(t + 0.4); } }
  // the posters: paper shaking in the wind
  { const sh = twShotOf('poster'); put(fx.rustle(sh.t1 - sh.t0, { density: 160, rub: 0.25, lo: 900, hi: 6000, grain: 0.008, env: (u) => 0.6 + 0.4 * Math.sin(u * 17) }), sh.t0, { vol: 0.25, pan: 0.2 }); }
});
