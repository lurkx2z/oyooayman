/* =====================================================================
   SOUND · EFFECTS — the events, each at its story second (the clock only runs forward, so each is heard once). In the
   slow minutes an event's sound is slowed with the picture (mgSlowK: at most 4×, so lower and longer, like tape).
     7:42          the car radio (slowed like tape when the clock slows); the coffee cup landing; your hands on the
                   wheel; the parking-brake switch, its motor, the dash's warning beeps, the tyres; the lorry hitting
                   the barrier and grinding along it, its sparks, its air brakes; the hazard relay ticking from then
                   on; the cars that drift into the barriers; two car alarms
     7:42:24       his phone ringing on the floor (MUM), until the network drops it
     the river     the train's brakes squealing and its cab's vigilance alarm; the barge's engine; its hull running
                   aground
     flight 2207   the cabin's call chime in the empty cockpit; the keypad; the cockpit's 30 s buzzer; the lock;
                   the radio calls in the tower (the women left in the cockpits and cabins); the flap and gear levers;
                   the gear coming down; the tower reading out the switches
     7:51, 8:04    smoke alarms across the town, a kitchen fire; the baby's heartbeat on the monitor; his first cry
     9:10, 9:31    footsteps on the deck; the emergency alert on every phone at once
     10:21         the jet coming over the motorway (delayed, Doppler-shifted); its tyres touching down; the rollout;
                   far-off engines circling
   ===================================================================== */

mgSound('sfx', 'events', function (ctx, bus, K) {
  const { fx, sr } = K, F = mgFilmAt, S = mgStoryAt, END = MG.end, Y = MG_V.deckY, R = MG_V.runway, T = MG_V.tower;
  const car = K.verb('scar', 0.25, { bright: 0.7, damp: 6, wet: 0.2 }), room = K.verb('sroom', 0.6, { bright: 0.6, damp: 3.5, wet: 0.25 }), open = K.verb('sopen', 2.4, { bright: 0.45, damp: 2.0, wet: 0.3 }), cab = K.verb('scab', 0.4, { bright: 0.5, damp: 5, wet: 0.2 });
  const place = (t) => mgWhereShot(mgShotAt(t)), mode = (t) => mgShotAt(t).mode;
  const putS = (x, t, o = {}) => { const k = o.k || mgSlowK(t); return K.put(x, t, Object.assign({}, o, { rate: 1 / k })); };
  const burst = (d, f, q = 1, env = (u) => Math.exp(-u * 5), col = 'pink') => { const n = Math.ceil(d * sr), y = mgNoise(fx, n, col); for (let i = 0; i < n; i++) y[i] *= env(i / n); MGX.bq(y, 'bp', f, q, sr); return y; };
  const gate = (where, xf = 0.04) => mgCurve(mgPlaceAt(where, xf));
  const inCar = gate('car'), onDeck = gate('deck');
  // what a sound heard from inside your car loses (glass, doors): duller, quieter
  const lorryHear = (t) => { const m = mode(t); return m === 'lorryExt' ? 1 : m === 'cabIn' ? 0.85 : m === 'cabWide' ? 0.55 : place(t) === 'car' ? 0.5 : place(t) === 'deck' ? 0.3 : 0; };

  // ================================================================== 7:41:55 → the car radio, slowed with the clock
  { const t0 = -1.9, t1 = mgShot('phone').t1 + 0.3, d = t1 - t0;
    const rr = mgCurve((t) => { let v = 0; for (let k = -4; k <= 4; k++) v += 1 / mgSlowK(t + k * 0.06); return v / 9; });
    const gain = mgCurve((t) => { const m = mode(t); return (m === 'radio' ? 1 : m === 'phone' ? 0.6 : m === 'title' ? 0.55 : 0.42) * mgPlaceAt('car', 0.05)(t); });
    const y = mgRadioSong(fx, d, t0, rr, 31.4);
    for (let i = 0; i < y.length; i++) { const t = t0 + i / sr; y[i] *= gain(t) * Math.min(1, (t1 - t) / 0.3); }
    K.put(y, t0, { vol: 0.11, norm: true, pan: 0.15, room: car, wet: 0.5 }); }

  // ================================================================== 7:42:00 — the cup, your hands, the brake
  { const sLand = 0.21;
    putS(fx.hit(fx.woodModes(150, 0.6), { width: 0.004, amp: 0.7, noise: 0.25, nlen: 0.02, nhp: 500, len: 0.5 }), F(sLand), { vol: 0.16, norm: true, pan: -0.35, room: car, wet: 0.3 });
    putS(burst(0.5, 900, 0.8, (u) => Math.exp(-u * 6) * Math.min(1, u * 40)), F(sLand + 0.02), { vol: 0.07, norm: true, pan: -0.35 });
    // your hands on the wheel (the rim's leather)
    putS(fx.creak(0.22, [[620, 0.02, 1], [1240, 0.012, 0.5], [2100, 0.008, 0.25]], { rate: [40, 90] }), F(MGP.car.sGrab), { vol: 0.05, norm: true, pan: -0.2 });
    // the parking-brake switch, held: its click, the motor's whirr, the dash's warning beeps until you stop
    const sb = MGP.car.sBrake, ss = MGP.car.sStop;
    putS(fx.hit([[2400, 0.006, 1], [4100, 0.004, 0.5], [900, 0.012, 0.4]], { width: 0.0003, noise: 0.5, nlen: 0.003, nhp: 2500, len: 0.08 }), F(sb - 0.03), { vol: 0.12, norm: true, pan: 0.05 });
    { const d = 0.5, n = Math.ceil(d * sr), y = new Float32Array(n), w = fx.white(n); let ph = 0;
      for (let i = 0; i < n; i++) { const u = i / n, f = 160 + 120 * u; ph += 2 * Math.PI * f / sr; y[i] = (Math.sign(Math.sin(ph)) * 0.4 + w[i] * 0.3) * Math.min(1, u * 20) * Math.min(1, (1 - u) * 8); }
      MGX.bq(y, 'bp', 700, 0.9, sr); putS(y, F(sb + 0.02), { vol: 0.06, norm: true, pan: 0.1 }); }
    for (let s = sb + 0.12; s < ss; s += 0.32) putS(fx.beep(2050, 0.09), F(s), { vol: 0.05, pan: -0.25, room: car, wet: 0.3 });
    // the tyres at the limit of grip (the brakes pulsing), louder with speed × deceleration
    { const a = F(sb + 0.3), b = F(ss + 0.05), d = b - a, n = Math.ceil(d * sr), y = mgNoise(fx, n, 'pink');
      const lv = mgCurve((t) => { const s = S(t); return MGP.carDecel(s) / MGP.car.a * Math.sqrt(MGP.carV(s) / MGP.car.v0); });
      for (let i = 0; i < n; i++) { const t = a + i / sr, s = S(t); y[i] *= lv(t) * (0.7 + 0.3 * Math.sin(2 * Math.PI * 14 * s)); }
      MGX.bq(y, 'bp', 1300 * 0.5, 1.6, sr); MGX.bq(y, 'lp', 1600, 0.7, sr); K.put(y, a, { vol: 0.16, norm: true, pan: 0, room: car, wet: 0.2 }); }
    // stopped: the car rocks back on its springs
    putS(fx.hit([[48, 0.12, 1], [96, 0.06, 0.4], [210, 0.03, 0.2]], { width: 0.02, amp: 1, len: 0.8 }), F(ss), { vol: 0.2, norm: true }); }

  // ================================================================== the hazard relay (from the brake on: tick … tock)
  { const s0 = MGP.car.sBrake + 0.3, sEnd = S(mgShot('phone').t1);
    const tick = (hi) => fx.hit([[hi ? 1850 : 1450, 0.01, 1], [hi ? 3200 : 2700, 0.006, 0.5], [620, 0.02, 0.4]], { width: 0.0003, noise: 0.4, nlen: 0.003, nhp: 2000, len: 0.08 });
    for (let k = Math.ceil(s0 * 2.9); k / 2.9 < sEnd; k++) { const s = k / 2.9, t = F(s), g = inCar(t); if (g < 0.05) continue; putS(tick(k % 2 === 0), t, { vol: 0.055 * g, norm: true, pan: 0.05 }); } }

  // ================================================================== the lorry: the barrier, the grind, its air brakes
  { const L = MGP.lorry, a = F(L.sHit), b = F(L.sStop) + 0.1, k0 = mgSlowK(a);
    // the hit: a front corner into the concrete (a deep crunch, its panels, glass)
    const hit = fx.hit(fx.stoneModes(0.42), { width: 0.006, amp: 1, noise: 0.8, nlen: 0.12, nhp: 180, len: 1.8 });
    const pan = fx.hit(fx.panelModes(0.8), { width: 0.002, amp: 0.7, noise: 0.5, nlen: 0.05, nhp: 600, len: 1.2 }); for (let i = 0; i < pan.length && i < hit.length; i++) hit[i] += pan[i];
    putS(hit, a, { vol: 0.55 * Math.max(0.35, lorryHear(a + 0.05)), norm: true, pan: -0.15, room: open, wet: 0.35, lp: 2400, k: k0 });
    // the grind along the barrier: stick-slip bursts, as fast and as bright as the lorry still is (slowed with the clock)
    { const d = b - a, n = Math.ceil(d * sr), y = mgNoise(fx, n, 'pink'), z = fx.white(n), hear = mgCurve(lorryHear);
      const vv = mgCurve((t) => MGP.lorryV(S(t)) / L.v0), qq = mgCurve((t) => 1 / Math.sqrt(mgSlowK(t)));
      let ph = 0; for (let i = 0; i < n; i++) { const t = a + i / sr, v = vv(t), q = qq(t); ph += (12 + 30 * v) * q * q / sr;
        const g = 0.3 + 0.7 * Math.pow(Math.abs(Math.sin(Math.PI * ph)), 5); y[i] = (y[i] * g + 0.15 * z[i] * v) * Math.sqrt(v) * hear(t) * Math.min(1, (t - a) / 0.05, (b - t) / 0.3); }
      const cv = []; for (let j = 0; j <= 60; j++) cv.push(400 + 1800 * Math.sqrt(MGP.lorryV(S(a + d * j / 60)) / L.v0) / Math.sqrt(mgSlowK(a + d * j / 60)));
      K.put(mgSweep(y, sr, 'lowpass', 0.9, cv), a, { vol: 0.32, norm: true, pan: -0.2, room: open, wet: 0.25 }); }
    // its sparks (a crackle), with the grind
    { const d = b - a, n = Math.ceil(d * sr), y = mgCrackle(fx, d, { rate: 900, hp: 2200 }), hear = mgCurve(lorryHear);
      for (let i = 0; i < n && i < y.length; i++) { const t = a + i / sr; y[i] *= MGP.lorrySparks(S(t)) * hear(t) / Math.sqrt(mgSlowK(t)); }
      K.put(y, a, { vol: 0.07, norm: true, pan: -0.25 }); }
    // stopped: its air brakes let out
    { const t = F(L.sStop + 0.6), g = lorryHear(t); if (g > 0) putS(burst(1.4, 2600, 0.5, (u) => Math.min(1, u * 30) * Math.exp(-u * 2.2), 'white'), t, { vol: 0.12 * g, norm: true, pan: -0.2, room: open, wet: 0.3 }); } }

  // ================================================================== the other cars: drifting into the barriers, braking
  { const near = (q, s) => Math.hypot(q.x - MGP.carX(s), q.z - MG_V.lanes[1]);
    const drift = MG_TRAFFIC.cars.filter((c) => c.kind === 'drift').map((c) => ({ c, d: near(MG_TRAFFIC.place(c, c.sH), c.sH) })).filter((o) => o.d < 900).sort((x, y) => x.d - y.d).slice(0, 7);
    drift.forEach(({ c, d }, i) => { const t = F(c.sH), g = inCar(t) * 0.5 + onDeck(t); if (g < 0.05) return; const q = MG_TRAFFIC.place(c, c.sH);
      const y = fx.hit(fx.panelModes(0.6), { width: 0.004, amp: 1, noise: 0.7, nlen: 0.08, nhp: 300, len: 1.4 });
      putS(y, t, { vol: 0.3 * g * Math.min(1, 60 / Math.max(30, d)), norm: true, pan: MathX.clamp((q.z - MG_V.lanes[1]) / 30, -0.7, 0.7), room: open, wet: 0.6, lp: 1800 });
      // the alarms of the first two (an impact sets them off; EU alarms stop after 30 s)
      // (made in story time, so it slows with the clock like everything else: its pattern and its pitch)
      if (i < 2) { const s1 = c.sH + 0.4, a1 = F(s1), a2 = Math.min(F(s1 + 30), mgShot('phone').t1), n = Math.ceil(Math.max(0.1, a2 - a1) * sr), al = new Float32Array(n), f1 = i ? 1050 : 920, f2 = i ? 780 : 700, per = i ? 0.31 : 0.42;
        let ph = 0; for (let j = 0; j < n; j++) { const tt = a1 + j / sr, ss = S(tt), kk = mgSlowK(tt), f = (Math.floor((ss - s1) / per) % 2 ? f1 : f2) / kk; ph += 2 * Math.PI * f / sr;
          al[j] = (Math.sin(ph) + 0.3 * Math.sin(3 * ph)) * Math.min(1, (tt - a1) / 0.05, (a2 - tt) / 0.2) * (0.15 + 0.85 * Math.max(inCar(tt) * 0.4, onDeck(tt))); }
        MGX.bq(al, 'bp', 1100, 0.6, sr); K.put(al, a1, { vol: 0.05 * Math.min(1, 80 / Math.max(40, d)), norm: true, pan: i ? 0.5 : -0.6, room: open, wet: 0.7, lp: 2200 }); } });
    // the newer ones stopping themselves: tyres, a few near you
    MG_TRAFFIC.cars.filter((c) => c.kind === 'aeb').map((c) => ({ c, d: near(MG_TRAFFIC.place(c, c.sB), c.sB) })).filter((o) => o.d < 160).slice(0, 5).forEach(({ c, d }) => {
      const t = F(c.sB + 0.2), g = inCar(t) * 0.5 + onDeck(t); if (g < 0.05) return;
      putS(burst(0.9, 1500, 2.2, (u) => Math.min(1, u * 12) * (1 - u)), t, { vol: 0.07 * g * Math.min(1, 40 / d), norm: true, pan: fx.r.range(-0.5, 0.5), room: open, wet: 0.4 }); }); }

  // ================================================================== 7:42:24 his phone, on the floor: MUM calling
  { const ring = (s0, s1) => { const a = F(s0), b = F(s1), d = b - a, n = Math.ceil(d * sr), y = new Float32Array(n), w = fx.white(n); let pr = 0;
      const mel = [76, 79, 83, 79, 76, 72], beat = 0.18;
      for (let i = 0; i < n; i++) { const t = i / sr, v = (t % 1.4) < 0.8, bz = v ? 0.5 * Math.sign(Math.sin(2 * Math.PI * 165 * t)) * (0.7 + 0.3 * w[i]) : 0;
        const k = Math.floor(t / beat) % 12, nt = t % beat, f = k < 6 ? mgHz(mel[k]) : 0; pr += 2 * Math.PI * f / sr;
        y[i] = bz * 0.6 + (f ? 0.5 * (Math.sin(pr) + 0.3 * Math.sin(2 * pr)) * Math.exp(-nt * 14) : 0); y[i] *= Math.min(1, (d - t) / 0.02); }
      MGX.bq(y, 'hp', 260, 0.7, sr); MGX.bq(y, 'lp', 4200, 0.7, sr);
      for (let i = 0; i < n; i++) y[i] *= inCar(a + i / sr) * (mode(a + i / sr) === 'phone' ? 1 : 0.55);
      K.put(y, a, { vol: 0.09, norm: true, pan: -0.3, room: car, wet: 0.4 }); };
    ring(24, 30); ring(46, 52); }

  // ================================================================== the train: its brakes, its cab's alarm
  { const P = MGP.train, sh1 = mgShot('trainHigh'), sh2 = mgShot('trainCab'), a = sh1.t0, b = sh2.t1, d = b - a, n = Math.ceil(d * sr);
    const vv = mgCurve((t) => MGP.trainV(S(t)) / P.v0), near = mgCurve((t) => (mode(t) === 'trainCab' ? 1 : mode(t) === 'trainHigh' ? 0.45 : 0));
    // the wheels' squeal (blocks on the tyres), with the speed, and the rumble
    { const y = new Float32Array(n), w = mgNoise(fx, n, 'brown'), z = fx.wander(0.7); let p1 = 0, p2 = 0;
      for (let i = 0; i < n; i++) { const t = a + i / sr, v = vv(t), s = S(t), br = s > P.sWarn && v > 0.01 ? 1 : 0; p1 += 2 * Math.PI * (2900 + 300 * z(t)) / sr; p2 += 2 * Math.PI * (4100 + 200 * z(t * 1.3)) / sr;
        y[i] = near(t) * (br * Math.pow(v, 0.6) * 0.12 * (Math.sin(p1) * (0.6 + 0.4 * Math.sin(t * 9)) + 0.5 * Math.sin(p2)) + 1.6 * v * w[i]) * Math.min(1, (t - a) / 0.05, (b - t) / 0.05); }
      K.put(y, a, { vol: 0.2, norm: true, pan: 0.2, room: open, wet: 0.4 }); }
    // the vigilance alarm in the empty cab: on since 7:42:04, nobody to acknowledge it
    { const y = new Float32Array(n); let ph = 0;
      for (let i = 0; i < n; i++) { const t = a + i / sr, s = S(t), on = (s % 1) < 0.55; ph += 2 * Math.PI * 1150 / sr; y[i] = on ? (Math.sign(Math.sin(ph)) * 0.6 + Math.sin(ph)) * near(t) * near(t) : 0; }
      MGX.bq(y, 'lp', 3500, 0.7, sr); K.put(y, a, { vol: 0.04, norm: true, pan: -0.1, room: cab, wet: 0.4 }); }
    // stopped: the air brakes hold, a long hiss; the couplings settle
    { const t = F(P.sStop); if (t > a && t < b) { K.put(burst(2.2, 2400, 0.5, (u) => Math.min(1, u * 25) * Math.exp(-u * 1.6), 'white'), t + 0.2, { vol: 0.08 * near(t), norm: true, pan: 0.2, room: open, wet: 0.4 });
      K.put(fx.hit(fx.metalModes(130, 0.5), { width: 0.004, amp: 1, noise: 0.4, nlen: 0.03, nhp: 300, len: 1.0 }), t + 0.05, { vol: 0.12 * near(t), norm: true, pan: 0.25, room: open, wet: 0.5 }); } } }

  // ================================================================== the barge: its engine, its hull running aground
  { const sh = mgShot('barge'), a = sh.t0, b = mgShot('bargeHit').t1, d = b - a, n = Math.ceil(d * sr), y = new Float32Array(n);
    let ph = 0; for (let i = 0; i < n; i++) { const t = i / sr; ph += 2 * Math.PI * 41 / sr; y[i] = (Math.sin(ph) + 0.5 * Math.sin(2 * ph)) * (0.55 + 0.45 * Math.pow(Math.max(0, Math.sin(2 * Math.PI * 6.8 * t)), 3)) * Math.min(1, t / 0.05, (d - t) / 0.05); }
    MGX.bq(y, 'lp', 260, 0.7, sr); K.put(y, a, { vol: 0.07, norm: true, pan: -0.2, room: open, wet: 0.5 });
    const t = F(MG.sBargeHit);
    const c1 = fx.hit([[42, 0.5, 1], [71, 0.35, 0.6], [118, 0.2, 0.35], [260, 0.08, 0.2]], { width: 0.04, amp: 1, noise: 0.6, nlen: 0.3, nhp: 120, len: 3.5 });
    K.put(c1, t, { vol: 0.32, norm: true, pan: -0.15, room: open, wet: 0.5 });
    { const g = mgScrape(fx, 3.4, { f: 380, rate: 9, env: (u) => Math.min(1, u * 6) * Math.exp(-u * 1.2) }); K.put(g, t + 0.1, { vol: 0.16, norm: true, pan: -0.2, room: open, wet: 0.5 }); }
    K.put(burst(2.5, 700, 0.5, (u) => Math.min(1, u * 8) * Math.exp(-u * 1.8)), t + 0.15, { vol: 0.08, norm: true, pan: 0.2, room: open, wet: 0.6 }); }

  // ================================================================== 7:43 flight 2207, 11,000 m up: a far rumble
  { const sh = mgShot('skyUp'); mgBed(K, sh.t0, sh.t1, { colour: 'brown', f: [['lp', 160]], vol: 0.06, am: 0.4, wr: 0.2, env: (u) => Math.sin(Math.PI * u), fi: 0.3, fo: 0.3 }); }

  // ================================================================== the cockpit: the cabin calls; nobody answers
  { const sh = mgShot('cockpit'), chime = () => { const y = fx.arr(1.6); for (const [dt, f] of [[0, 1047], [0.42, 831]]) { const z = fx.hit([[f, 0.5, 1], [f * 2.01, 0.25, 0.3], [f * 3.0, 0.12, 0.12]], { width: 0.001, len: 1.2 }); mgAddAt(y, z, dt, 1, sr); } return y; };
    for (const dt of [0.5, 2.8]) K.put(chime(), sh.t0 + dt, { vol: 0.07, norm: true, pan: 0.2, room: cab, wet: 0.5 }); }

  // ================================================================== the door: the code, 30 s of buzzer, the lock
  { const sc = MG.sCode, sd = MG.sDoor, key = () => fx.beep(2350, 0.07);
    for (let k = 0; k < 6; k++) { const t = F(sc - 1.6 + k * 0.27); if (place(t) === 'cabin') K.put(key(), t, { vol: 0.035, pan: 0.3, room: cab, wet: 0.3 }); }
    // the buzzer in the cockpit (heard through the door in the cabin, plainly in the cockpit)
    { const a = F(sc + 0.3), b = F(sd), d = b - a, n = Math.ceil(d * sr), y = new Float32Array(n); let ph = 0;
      for (let i = 0; i < n; i++) { const t = a + i / sr, pl = place(t), g = pl === 'cockpit' ? 1 : pl === 'cabin' ? 0.3 : 0; ph += 2 * Math.PI * 520 / sr; y[i] = g * (Math.sign(Math.sin(ph)) * 0.5 + 0.5 * Math.sin(3 * ph)) * (((t - a) % 1.0) < 0.75 ? 1 : 0.15) * Math.min(1, (t - a) / 0.02, (b - t) / 0.02); }
      MGX.bq(y, 'lp', 2200, 0.7, sr); K.put(y, a, { vol: 0.035, norm: true, pan: 0.1, room: cab, wet: 0.4 }); }
    // the lock lets go; the door swings
    { const t = F(sd), g = ['cockpit', 'cabin'].includes(place(t + 0.1)) ? 1 : 0.4;
      K.put(fx.hit(fx.metalModes(310, 0.4), { width: 0.002, amp: 1, noise: 0.5, nlen: 0.02, nhp: 800, len: 0.6 }), t, { vol: 0.16 * g, norm: true, pan: 0.15, room: cab, wet: 0.4 });
      K.put(fx.creak(1.1, [[180, 0.03, 1], [410, 0.02, 0.5], [830, 0.01, 0.25]], { rate: [18, 40] }), t + 0.6, { vol: 0.04 * g, norm: true, pan: 0.15, room: cab, wet: 0.4 }); } }

  // ================================================================== the tower: every plane in range calling
  { const calls = (a, b, dens, vol, glass) => { for (let t = a + fx.r.range(0.1, 0.5); t < b - 0.6;) { const d = Math.min(b - t - 0.1, fx.r.range(1.1, 2.6));
      if (d > 0.5) { const y = mgRadioVoice(fx, d, { f0: fx.r.range(185, 245), syl: fx.r.range(4.6, 6.0) }); if (glass) MGX.bq(y, 'lp', 1200, 0.7, sr);
        K.put(y, t, { vol: vol * fx.r.range(0.7, 1), norm: true, pan: fx.r.range(-0.5, 0.5), room, wet: 0.2 });
        K.put(fx.beep(1000, 0.06), t + d + 0.02, { vol: vol * 0.3, pan: 0.2 }); }
      t += d * (1 - dens) + fx.r.range(0.25, 0.9); } };
    const tw = (m, dens, vol) => { const sh = mgShot(m); if (sh) calls(sh.t0, sh.t1, dens, vol); };
    tw('towerIn', 0.55, 0.07); tw('radar', 0.4, 0.06); tw('ctl', 0.3, 0.055); tw('towerRead', 0.2, 0.06); tw('finalTower', 0.0, 0.035);
    // in the cockpit, the tower's voice reading out the switches (through the speaker)
    for (const m of ['cockpitApp', 'flaps']) { const sh = mgShot(m); if (sh) calls(sh.t0 + 0.3, sh.t1, 0.0, 0.05, false); } }

  // ================================================================== autoland: flaps, the gear, the approach button
  { const sf = MG.sFlap, lever = (t, f = 260) => K.put(fx.hit(fx.metalModes(f, 0.3), { width: 0.0015, amp: 1, noise: 0.5, nlen: 0.01, nhp: 1500, len: 0.4 }), t, { vol: 0.1, norm: true, pan: 0.15, room: cab, wet: 0.3 });
    lever(F(sf - 0.35), 300); lever(F(sf - 0.05), 280);
    lever(F(sf + 3.3), 200);
    // the gear coming down: hydraulics, the doors, the wind on the legs (heard in the cockpit as a rising rumble)
    { const a = F(sf + 3.6), b = Math.min(F(sf + 16), mgShot('flaps').t1 + 0.4); if (b > a + 0.2) mgBed(K, a, b, { colour: 'brown', f: [['lp', 220]], vol: 0.18, am: 0.3, wr: 1.5, env: (u, t) => (place(t) === 'cockpit' ? 1 : 0) * Math.min(1, u * 3), fi: 0.3, fo: 0.2 }); }
    { const t = F(MG.sLand3 - 0.3); K.put(fx.hit([[2600, 0.006, 1], [4300, 0.004, 0.4]], { width: 0.0003, noise: 0.4, nlen: 0.003, nhp: 2500, len: 0.06 }), t, { vol: 0.08, norm: true, pan: -0.1 }); } }

  // ================================================================== 7:51 the town: smoke alarms, a kitchen fire
  { const t3 = (d) => { const n = Math.ceil(d * sr), y = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / sr, c = t % 4.5, on = c < 3 && (c % 1) < 0.5; y[i] = on ? Math.sin(2 * Math.PI * 3150 * t) : 0; } return y; };
    for (const m of ['town', 'house', 'townHigh', 'hospital']) { const sh = mgShot(m); if (!sh) continue; const d = sh.t1 - sh.t0, nAl = m === 'house' ? 3 : 4;
      for (let k = 0; k < nAl; k++) { const o = k * 1.13 + 0.4 * (m.length % 3), y = t3(d + o); for (let i = 0; i < y.length; i++) { const t = i / sr - o; y[i] *= t < 0 ? 0 : Math.min(1, t / 0.05, (d - t) / 0.05); }
        K.put(y.subarray(Math.floor(o * sr)), sh.t0 + 0.05, { vol: (m === 'house' && k === 0 ? 0.022 : 0.009) / (1 + 0.3 * k), pan: [-0.6, 0.5, -0.2, 0.75][k], room: open, wet: 0.8, lp: m === 'house' && k === 0 ? 5000 : 3600 }); } }
    { const sh = mgShot('house'), d = sh.t1 - sh.t0, y = mgCrackle(fx, d, { rate: 140, hp: 900 }), r2 = mgNoise(fx, Math.ceil(d * sr), 'brown');
      for (let i = 0; i < y.length && i < r2.length; i++) { const t = i / sr; const e = Math.min(1, t / 0.1, (d - t) / 0.1); y[i] = (y[i] + 0.6 * r2[i]) * e; }
      K.put(y, sh.t0, { vol: 0.05, norm: true, pan: 0.1, room: open, wet: 0.4 }); } }

  // ================================================================== 8:04 the ward: his heartbeat; his first cry
  { const sb = MG.sBirth, a = mgShot('wardIn').t0, b = mgShot('wardWin').t1;
    // before: the baby's heartbeat on the monitor's Doppler (a galloping whoosh, 142 a minute); after: the mother's beeps
    { const d = F(sb) - a, n = Math.ceil(d * sr), y = mgNoise(fx, n, 'pink');
      for (let i = 0; i < n; i++) { const t = i / sr, ph = (t * 142 / 60) % 1, e = Math.exp(-ph * 9) + 0.6 * Math.exp(-Math.max(0, ph - 0.28) * 11) * (ph > 0.28 ? 1 : 0); y[i] *= e * Math.min(1, t / 0.1, (d - t) / 0.2); }
      MGX.bq(y, 'bp', 420, 1.4, sr); MGX.bq(y, 'lp', 900, 0.7, sr); K.put(y, a, { vol: 0.07, norm: true, pan: 0.45, room, wet: 0.3 }); }
    for (let t = F(sb) + 1.0; t < b - 0.2; t += 60 / 82) K.put(fx.beep(880, 0.07), t, { vol: 0.012, pan: 0.45, room, wet: 0.4 });
    // his cry (soft; he is a minute old), from a second after he is born
    { const t0 = F(sb) + 1.1, d = b - t0 - 0.3, y = mgCry(fx, d, { delay: 0.05 });
      const g = mgCurve((t) => { const m = mode(t); return m === 'baby' ? 1 : m === 'birth' ? 0.9 : m === 'wardWin' ? 0.45 : 0.7; });
      for (let i = 0; i < y.length; i++) { const t = t0 + i / sr; y[i] *= g(t) * Math.min(1, (t0 + d - t) / 0.5); }
      K.put(y, t0, { vol: 0.07, norm: true, pan: -0.1, room, wet: 0.35 }); } }

  // ================================================================== 9:10 walking home: footsteps on the deck
  { for (const [m, people] of [['walkDeck', [[0.55, 1.75, -0.15, 0.8], [0.25, 1.62, 0.4, 0.4]]], ['walkLong', [[0.2, 1.7, 0.2, 0.3]]], ['walkPOV', [[0.4, 1.8, -0.4, 0.6], [0.15, 1.68, 0.3, 0.3]]]]) {
      const sh = mgShot(m); if (!sh) continue;
      for (const [ph, hz, pan, g] of people) for (let t = sh.t0 + ph; t < sh.t1 - 0.1; t += 1 / hz) K.put(fx.step({ weight: 0.4, s: 1.2 }), t, { vol: 0.05 * g, norm: true, pan, room: open, wet: 0.35 }); } }

  // ================================================================== 9:31 the emergency alert, on every phone at once
  { const t0 = F(MG_AT(9, 31, 3)), pat = [[0, 2], [2.5, 1], [4, 1]];
    const tone = (d) => { const n = Math.ceil(d * sr), y = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / sr; y[i] = (Math.sin(2 * Math.PI * 853 * t) + Math.sin(2 * Math.PI * 960 * t)) * Math.min(1, t / 0.01, (d - t) / 0.01); } return y; };
    const one = (dt, vol, pan, far) => { for (const [o, d] of pat) { const y = tone(d); if (far) MGX.bq(y, 'lp', 2400, 0.7, sr); K.put(y, t0 + dt + o, { vol, norm: true, pan, room: open, wet: far ? 0.6 : 0.15 }); }
      if (!far) { const n = Math.ceil(5 * sr), z = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / sr; z[i] = ((t % 1) < 0.6 ? 1 : 0) * Math.sin(2 * Math.PI * 170 * t) * Math.min(1, t / 0.02, (5 - t) / 0.05); } K.put(z, t0 + dt, { vol: vol * 0.5, norm: true, pan }); } };
    one(0, 0.075, 0.25, false);
    [[0.35, 0.03, -0.5], [0.8, 0.022, 0.6], [1.15, 0.016, -0.2], [1.6, 0.012, 0.8], [2.1, 0.01, -0.75]].forEach(([dt, v, p]) => one(dt, v, p, true)); }

  // ================================================================== 9:47 the stack: engines circling, far off
  { for (const m of ['stack', 'question']) { const sh = mgShot(m); if (!sh) continue;
      for (let k = 0; k < 3; k++) mgBed(K, sh.t0, Math.min(sh.t1, END + 0.3), { colour: 'brown', f: [['lp', 190 + 40 * k]], vol: 0.05, am: 0.7, wr: 0.12 + 0.05 * k, env: (u, t) => 0.5 + 0.5 * Math.sin(2 * Math.PI * (t / (9 + 4 * k) + k * 0.3)), fi: 0.4, fo: 0.3, pan: [-0.6, 0.1, 0.7][k], mono: true }); } }

  // ================================================================== 10:21 flight 2207 comes in over the motorway
  { const at = (s) => mgPlaneAt(s).p;
    const via = mgShot('finalVia'); mgJetBy(K, via.t0 - 0.3, via.t1 + 0.2, at, [R.x - 70, Y + 1.6, -14.6], { vol: 0.62 });
    const tw = mgShot('finalTower'); mgJetBy(K, tw.t0, tw.t1 + 0.1, at, [T[0], MG_V.towerH + 1.7, T[2]], { vol: 0.2, glass: true, room, wet: 0.2 });
    const td = mgShot('touchdown'); mgJetBy(K, td.t0, td.t1 + 0.1, at, [R.x + 46, 1.5, MG_FL.zTD + 70], { vol: 0.5 });
    const qn = mgShot('question'); mgJetBy(K, qn.t0, END, at, [R.x - 40, Y + 1.7, 15.4], { vol: 0.3 });
    // in the cockpit: the wind on the wheels, the engines low, the airflow louder as it slows to land
    { const sh = mgShot('finalCock'); mgBed(K, sh.t0, sh.t1, { colour: 'brown', f: [['lp', 240]], vol: 0.2, am: 0.35, wr: 1.2, fi: 0.05, fo: 0.05 }); }
    // touchdown: both main gears' tyres (a chirp and smoke), the thump, the nose wheel; the rollout, the autobrake
    { const t = F(MG.sTD), g = mode(t) === 'touchdown' ? 1 : 0.4;
      for (const [dt, v, f] of [[0, 1, 1700], [0.12, 0.8, 1500]]) K.put(burst(0.45, f, 1.2, (u) => Math.min(1, u * 60) * Math.exp(-u * 6), 'white'), t + 0.1 + dt, { vol: 0.12 * v * g, norm: true, pan: 0.2, room: open, wet: 0.4 });
      K.put(fx.hit([[38, 0.25, 1], [70, 0.15, 0.5], [140, 0.06, 0.3]], { width: 0.03, amp: 1, noise: 0.5, nlen: 0.1, nhp: 100, len: 1.5 }), t + 0.12, { vol: 0.3 * g, norm: true, pan: 0.2, room: open, wet: 0.4 });
      const sh = mgShot('touchdown'); if (sh && sh.t1 > t + 0.3) mgBed(K, t + 0.2, sh.t1 + 0.1, { colour: 'brown', f: [['lp', 300]], vol: 0.14 * g, am: 0.3, wr: 2, env: (u) => Math.max(0.3, 1 - u * 0.6), fi: 0.15, fo: 0.08, pan: 0.2, mono: true }); } }
});
