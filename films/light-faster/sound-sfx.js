/* =====================================================================
   SOUND · EFFECTS — the events, each at its story second (the clock only runs forward, so each is heard once). In the
   slow minutes an event's sound is slowed with the picture (lfSlowK: at most 4×, so lower and longer, like tape).
     9:00 PM       the train's horn out of the tunnel; its wheels on the rail joints (a deep slow "ka-thunk" once the
                   clock slows); the wire's arcs at the pantograph, the transformers' hum turning harsh as the iron
                   saturates
     the hospital  the MRI's knocking, its alarm as the current climbs; the quench: a bang and the helium's roar, on the
                   roof a jet; the generators' starter, the engine catching, its weak alternator, the LOW VOLTS beeps
     the grid      the city's transformers dropping out across the bay; the stadium's four floodlight contactors, the
                   crowd's gasp; the train's brakes, screaming all the way to the beach
     the road      the cars' engines, each one coughing out when its spark goes
     the mountain  a fingernail on the barometer's glass: the mercury wobbles; when it has frozen, a dead tap
     the beach     the train's last squeal, the air brakes, the doors; the party's song from its speaker, quieter by
                   exactly as much as its magnet has weakened (LFP.speakerDb); the fire's crackle, just as loud all
                   night (just as hot); the astronomer's breath; then very little
   ===================================================================== */

lfSound('sfx', 'events', function (ctx, bus, K) {
  const { fx, sr } = K, F = lfFilmAt, S = lfStoryAt, c = lfC, B = lfB, END = LF.end;
  const room = K.verb('sroom', 0.5, { bright: 0.6, damp: 3.5, wet: 0.25 }), open = K.verb('sopen', 2.2, { bright: 0.45, damp: 2.0, wet: 0.3 }), bowl = K.verb('sbowl', 3.6, { bright: 0.4, damp: 1.6, wet: 0.45, pre: 0.04 });
  const place = (t) => lfWhereShot(lfShotAt(t)), shotAt = (t) => lfShotAt(t).mode;
  // (what the long sounds read per sample, sampled once at 200 Hz)
  const gridC = lfCurve((t) => lfGrid(S(t))), satC = lfCurve((t) => MathX.clamp((S(t) - 3.5) / (LFP.sGrid - 3.5), 0, 1)), vC = lfCurve((t) => lfTrainV(S(t)) / LFP.train.v), hospC = lfCurve((t) => lfHospital(S(t)));
  const ev = { quench: F(LFP.sQuench), grid: F(LFP.sGrid), stad: F(LFP.sGrid + LF_STAD_D), brake: F(LFP.train.sBrake), stop: F(LFP.train.sStop), door: F(LFP.sDoor), hg: F(LFP.sHgCold) };
  // play x slowed with the picture (at film time t): its pitch and length both follow the clock
  const putS = (x, t, o = {}) => { const k = o.k || lfSlowK(t); return K.put(x, t, Object.assign({}, o, { rate: 1 / k })); };
  const burst = (d, f, q = 1, env = (u) => Math.exp(-u * 5)) => { const n = Math.ceil(d * sr), y = lfNoise(fx, n, 'pink'); for (let i = 0; i < n; i++) y[i] *= env(i / n); LFX.bq(y, 'bp', f, q, sr); return y; };

  // ================================================================== 9:00 PM: the night train
  // the horn out of the tunnel (two notes, a minor third)
  { const d = 1.7, n = Math.ceil(d * sr), y = new Float32Array(n);
    for (const [f, a] of [[311, 1], [370, 0.8]]) { let ph = 0; for (let i = 0; i < n; i++) { const t = i / sr; ph += 2 * Math.PI * f * (1 + 0.002 * Math.sin(t * 31)) / sr; y[i] += a * (Math.sin(ph) + 0.5 * Math.sin(2 * ph) + 0.3 * Math.sin(3 * ph) + 0.15 * Math.sin(5 * ph)) * Math.min(1, t / 0.08, (d - t) / 0.3); } }
    LFX.bq(y, 'lp', 2400, 0.7, sr); K.put(y, 0.35, { vol: 0.2, norm: true, pan: -0.35, room: open, wet: 0.5 }); }
  // the wheels over the rail joints (every 25 m): each axle of the first car, as it reaches a joint
  { const axles = [-2.3, -4.5, -15.5, -17.7], last = axles.map((o) => Math.floor((lfTrainX(S(-0.9)) + o) / 25));
    for (let t = -0.9; t < ev.stop + 0.3; t += 0.004) {
      const s = S(t), v = lfTrainV(s) / LFP.train.v; if (v < 0.03) continue;
      axles.forEach((o, j) => { const J = Math.floor((lfTrainX(s) + o) / 25); if (J === last[j]) return; last[j] = J;
        const w = place(t), g = w === 'trainIn' ? 1 : w === 'trainOut' ? 0.55 : 0; if (!g) return;
        const near = Math.exp(-Math.abs(o - LF_TR.you.row) / 8), y = fx.hit(fx.metalModes(180, 0.5), { width: 0.0018, amp: 1, noise: 0.5, nlen: 0.02, nhp: 600, len: 0.5 });
        for (let i = 0; i < 0.3 * sr; i++) y[i] += 0.8 * Math.sin(2 * Math.PI * 62 * i / sr) * Math.exp(-i / (0.04 * sr));
        putS(y, t, { vol: 0.16 * g * (0.35 + 0.65 * near) * (0.4 + 0.6 * v), norm: true, pan: (j < 2 ? 0.2 : -0.2) * (w === 'trainIn' ? 1 : 0.4), room: w === 'trainOut' ? open : room, wet: 0.3, lp: 1600 }); }); } }
  // the wire's arcs at the pantograph (as the mains fail): blue-white snaps in the panto and flicker shots
  for (const m of ['panto', 'flicker', 'ext3']) { const sh = lfShot(m); if (!sh) continue;
    for (let t = sh.t0 + 0.05; t < sh.t1 - 0.05; t += 0.02) { const s = S(t), mains = lfTrainMains(s); if (mains < 0.02) continue;
      const sat = s > LFP.sTrans ? 1 : 0.25, f = lfFlick(s, 5, 30), a = (0.15 + 0.85 * Math.pow(f, 6) * sat) * mains;
      if (a > 0.45 && fx.r.next() < 0.35) putS(lfCrackle(fx, 0.12, { rate: 2200, hp: 1800, env: (u) => Math.exp(-u * 6) }), t, { vol: 0.22 * a * (m === 'panto' ? 1 : 0.6), norm: true, pan: fx.r.range(-0.3, 0.3), room: open, wet: 0.3 }); } }
  // the transformers' hum (the wire, the substations): pure while the iron holds, harsh as it saturates (from ×1.085)
  for (const m of ['panto', 'flicker', 'ext3', 'bay', 'bayOut']) { const sh = lfShot(m); if (!sh) continue;
    const a = sh.t0, d = Math.min(sh.t1, ev.grid + 0.6) - a; if (d < 0.1) continue;
    const y = fx.arr(d), n = Math.ceil(d * sr), q = 1 / Math.sqrt(lfSlowK(a)); let ph = 0;
    for (let i = 0; i < n; i++) { const t = a + i / sr, u = satC(t), g = gridC(t);
      ph += 2 * Math.PI * 100 * q / sr; let v = Math.sin(ph) + 0.4 * Math.sin(2 * ph);
      v += u * u * (0.7 * Math.sin(3 * ph) + 0.5 * Math.sin(5 * ph) + 0.35 * Math.sin(7 * ph) + 0.25 * Math.sin(9 * ph));
      y[i] = Math.tanh(v * (1 + 2.5 * u)) * g * Math.min(1, (t - a) / 0.05, (d - (t - a)) / 0.05); }
    K.put(y, a, { vol: m === 'panto' || m === 'flicker' ? 0.07 : 0.035, norm: true, pan: 0.2, lp: 2600 }); }

  // ================================================================== the hospital: the MRI quenches
  // the scanner's knocking (a sequence running: knocks in fours), until the quench
  { const sh0 = lfShot('mriA'), t1 = Math.min(ev.quench, lfShot('mriB').t1);
    for (let t = sh0.t0 + 0.3, i = 0; t < t1 - 0.05; i++) { const k = lfSlowK(t), y = fx.hit(fx.panelModes(0.7), { width: 0.0012, amp: 1, noise: 0.4, nlen: 0.01, nhp: 900, len: 0.4 });
      putS(y, t, { vol: (shotAt(t) === 'mriA' ? 0.22 : 0.15) * (i % 4 === 0 ? 1 : 0.7), norm: true, pan: -0.15, room, wet: 0.35, k }); t += (i % 4 === 3 ? 0.55 : 0.13) * k; } }
  // the console's alarm as the current climbs past 105 % (mriB), faster towards the quench
  { const sh = lfShot('mriB'); for (let t = sh.t0 + 0.6; t < ev.quench - 0.1; t += 0.9 - 0.45 * MathX.clamp((t - sh.t0) / (ev.quench - sh.t0), 0, 1)) {
      K.put(fx.beep(880, 0.16), t, { vol: 0.07, pan: 0.35, room, wet: 0.25 }); K.put(fx.beep(660, 0.16), t + 0.2, { vol: 0.06, pan: 0.35, room, wet: 0.25 }); } }
  // the quench: the burst disc's bang, then the helium boiling off through the pipe (a roar for the rest of the shots)
  { const t0 = ev.quench, k = lfSlowK(t0);
    putS(fx.hit(fx.stoneModes(0.5), { width: 0.003, amp: 1, noise: 0.9, nlen: 0.08, nhp: 200, len: 1.2 }), t0, { vol: 0.5, norm: true, room, wet: 0.4, k });
    for (const m of ['mriB', 'quench', 'roof']) { const sh = lfShot(m), a = Math.max(sh.t0, t0), b = sh.t1; if (b - a < 0.05) continue;
      const roofM = m === 'roof', n = Math.ceil((b - a) * sr), y = lfNoise(fx, n, 'pink'), w = fx.wander(0.8), z = fx.white(n);
      for (let i = 0; i < n; i++) { const t = a + i / sr, u = (t - t0); y[i] = (y[i] * (1 + 0.35 * w(t)) + (roofM ? 0.25 : 0.08) * z[i]) * Math.min(1, u / 0.6, (b - t) / 0.06) * (0.75 + 0.25 * Math.exp(-u / 6)); }
      LFX.bq(y, 'lp', (roofM ? 2600 : 900) / Math.sqrt(k), 0.7, sr); LFX.bq(y, 'hp', roofM ? 160 : 70, 0.7, sr);
      K.put(y, a, { vol: roofM ? 0.42 : 0.3, norm: true, pan: roofM ? -0.25 : 0.1, room: roofM ? open : room, wet: roofM ? 0.3 : 0.2 }); } }
  // ================================================================== the grid trips (×1.15)
  // the city's districts dropping out across the bay, one after another: far heavy thumps
  LF_DIST_D.forEach((d, i) => { const t = F(LFP.sGrid + d); if (shotAt(t) !== 'bayOut') return;
    putS(fx.hit(fx.stoneModes(0.42), { width: 0.006, amp: 1, noise: 0.3, nlen: 0.05, nhp: 150, len: 1.5 }), t, { vol: 0.2 * (1 - 0.06 * i), norm: true, pan: -0.6 + 0.17 * i, room: open, wet: 0.7, lp: 700 }); });
  // the stadium's four floodlight contactors, a breath apart, round the bowl; then the crowd's gasp and the screams
  [[0, -0.7], [0.06, 0.7], [0.11, -0.35], [0.17, 0.35]].forEach(([ds, pan]) => { const t = F(LFP.sGrid + LF_STAD_D + ds);
    putS(fx.hit(fx.metalModes(140, 0.6), { width: 0.002, amp: 1, noise: 0.7, nlen: 0.03, nhp: 400, len: 1.0 }), t, { vol: 0.32, norm: true, pan, room: bowl, wet: 0.8 }); });
  { const t0 = ev.stad + 0.25, k = lfSlowK(t0);
    for (let i = 0; i < 26; i++) { const r = fx.r, d = r.range(1.0, 1.8);
      putS(fx.breath(d, { inhale: true, voice: r.range(0.3, 0.7), f0: r.range(140, 320), env: (u) => Math.sin(Math.PI * Math.pow(u, 0.6)) }), t0 + r.range(0, 0.25) * k, { vol: 0.05, norm: true, pan: r.range(-0.9, 0.9), room: bowl, wet: 0.6, k }); }
    for (let i = 0; i < 14; i++) { const r = fx.r, t = t0 + r.range(1.0, 9.0) * (k / 4), d = r.range(0.5, 1.1);
      if (t > lfShot('stadB').t1) continue;
      putS(fx.breath(d, { voice: 0.9, f0: r.range(380, 620), env: (u) => Math.pow(Math.sin(Math.PI * u), 0.7) }), t, { vol: 0.035, norm: true, pan: r.range(-0.9, 0.9), room: bowl, wet: 0.7, lp: 4200, k }); } }
  // ================================================================== the hospital's generators (15.45 s)
  { const sh = lfShot('gen'), k = lfSlowK(sh.t0 + 0.01), t0 = sh.t0 + 0.1 + 0.55 * k;   // (t0: the engine catches, after the starter)
    // the starter motor: a whine climbing as it turns the engine over (in the slow minutes: a groan)
    { const d = 0.55, n = Math.ceil(d * sr), y = new Float32Array(n); let ph = 0;
      for (let i = 0; i < n; i++) { const t = i / sr, f = 220 + 260 * Math.min(1, t / 0.4); ph += 2 * Math.PI * f / sr; y[i] = (Math.sin(ph) + 0.4 * Math.sin(2 * ph) + 0.3 * Math.sign(Math.sin(ph * 0.25))) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 9 * t)) * Math.min(1, t / 0.02, (d - t) / 0.05); }
      putS(y, sh.t0 + 0.1, { vol: 0.12, norm: true, pan: -0.2, room, wet: 0.3, lp: 2200, k }); }
    // the engine catching and running: firing thumps, the rest of the hospital shots (then far off)
    for (const m of ['gen', 'corridor', 'board']) { const s2 = lfShot(m), a = Math.max(s2.t0, t0), b = s2.t1; if (b - a < 0.1) continue;
      const kk = lfSlowK(a + 0.01), fire = 14 / kk, d = b - a, n = Math.ceil(d * sr), y = new Float32Array(n), z = lfNoise(fx, n, 'brown');
      for (let i = 0; i < n; i++) { const t = i / sr, ph = (t * fire) % 1; y[i] = (Math.exp(-ph * 7) * Math.sin(2 * Math.PI * 38 / Math.sqrt(kk) * t) + 0.6 * z[i]) * Math.min(1, t / (m === 'gen' ? 0.4 : 0.05), (d - t) / 0.05); }
      LFX.bq(y, 'lp', 600 / Math.sqrt(kk), 0.7, sr);
      K.put(y, a, { vol: m === 'gen' ? 0.22 : 0.07, norm: true, pan: 0.15, room, wet: m === 'gen' ? 0.3 : 0.15 }); }
    // the alternator: a whine that should hold; it sags (its field is a magnet, now weak)
    { const a = t0, b = sh.t1, d = b - a, n = Math.ceil(d * sr), y = new Float32Array(n); let ph = 0;
      for (let i = 0; i < n; i++) { const t = a + i / sr, g = Math.max(0.05, hospC(t) / 0.32); ph += 2 * Math.PI * 400 * (0.8 + 0.2 * g) / Math.sqrt(k) / sr; y[i] = (Math.sin(ph) + 0.3 * Math.sin(2 * ph)) * g * Math.min(1, (t - a) / 0.3, (b - t) / 0.05); }
      K.put(y, a, { vol: 0.04, norm: true, pan: 0.15, room, wet: 0.3 }); }
    // LOW VOLTS
    for (let t = c('generator', 1) - 2.2; t < sh.t1 - 0.2; t += 0.7) K.put(fx.beep(1250, 0.12), t, { vol: 0.05, pan: 0.4, room, wet: 0.2 }); }
  // the corridor's battery lights: a ballast's buzz; a monitor far down the corridor, on its battery
  { const sh = lfShot('corridor'); lfTone(K, sh.t0, sh.t1 - sh.t0, 120, [[1, 0.5], [2, 1], [3, 0.6], [4, 0.4], [6, 0.2]], (u, t) => Math.min(1, t / 0.05, (sh.t1 - sh.t0 - t) / 0.05), { vol: 0.03, pan: -0.3 });
    for (let t = sh.t0 + 0.8; t < sh.t1 - 0.2; t += 1.3) K.put(fx.beep(980, 0.09), t, { vol: 0.03, pan: 0.6, room: open, wet: 0.5 }); }

  // ================================================================== the train's brakes (16.6 s to the stop at 60.7 s)
  { const a0 = ev.brake, b0 = ev.stop + 0.4;
    for (const p of lfPlaces()) { if (p.where !== 'trainIn' && p.where !== 'trainOut' && p.shot.mode !== 'stopX') continue;
      const a = Math.max(p.t0, a0), b = Math.min(p.t1, b0); if (b - a < 0.05) continue;
      const ins = p.where === 'trainIn', kk = lfSlowK(a + 0.01), n = Math.ceil((b - a) * sr), y = new Float32Array(n), z = lfNoise(fx, n, 'pink'), w = fx.wander(0.6);
      let p1 = 0, p2 = 0;
      for (let i = 0; i < n; i++) { const t = a + i / sr, v = vC(t), f = (2900 + 500 * w(t) - 900 * (1 - v)) / Math.sqrt(kk);
        p1 += 2 * Math.PI * f / sr; p2 += 2 * Math.PI * f * 1.52 / sr;
        const lv = Math.sqrt(v) * (v < 0.02 ? v / 0.02 : 1) * Math.min(1, (t - a) / 0.3, (b - t) / 0.06) * Math.min(1, (t - a0) / (0.6 * kk));
        y[i] = (0.6 * Math.sin(p1) + 0.3 * Math.sin(p2) + 0.25 * z[i]) * lv * (0.75 + 0.25 * Math.sin(t * 7.3)); }
      LFX.bq(y, 'bp', 2200 / Math.sqrt(kk), 0.6, sr);
      K.put(y, a, { vol: ins ? 0.045 : 0.09, norm: true, pan: ins ? -0.3 : 0.2, room: ins ? room : open, wet: 0.3, lp: ins ? 1800 : 6000 }); }
    // the stop: a last groan, the air brakes letting go, the doors
    K.put(fx.creak(0.9, [[180, 0.05, 1], [410, 0.03, 0.5], [900, 0.02, 0.25]], { rate: [18, 6], env: (u) => Math.sin(Math.PI * u) }), ev.stop - 0.6, { vol: 0.12, norm: true, pan: -0.2, room, wet: 0.3 });
    K.put(burst(1.6, 3200, 0.5, (u) => Math.min(1, u * 30) * Math.exp(-u * 2.4)), ev.stop + 0.6, { vol: 0.1, norm: true, pan: 0.4, room, wet: 0.3 });
    K.put(burst(0.9, 2400, 0.7, (u) => Math.min(1, u * 20) * Math.exp(-u * 4)), ev.door, { vol: 0.09, norm: true, pan: 0.5, room, wet: 0.3 });
    K.put(lfScrape(fx, 0.8, { f: 520, rate: 26 }), ev.door + 0.2, { vol: 0.06, norm: true, pan: 0.5, room, wet: 0.3 }); }

  // ================================================================== the road: the engines stall (their spark is a magnet)
  { const sh0 = lfShot('road'), sh1 = lfShot('roadCar'), a = sh0.t0, b = sh1.t1, kk = lfSlowK(a + 0.01);
    LF_CARS.forEach((car, i) => { const n = Math.ceil((b - a) * sr), y = new Float32Array(n), f0 = (32 + 4 * (i % 4)) / Math.sqrt(kk), tc = F(lfCarCut(i)); let ph = 0;
      const cough = [0.0, 0.11, 0.19, 0.33].map((x) => tc + x * kk);
      for (let i2 = 0; i2 < n; i2++) { const t = a + i2 / sr, on = t < tc ? 1 : t > cough[3] + 0.05 ? 0 : cough.some((x) => t > x && t < x + 0.04 * kk) ? 0 : 0.7;
        ph += 2 * Math.PI * f0 * (t < tc ? 1 : 0.8) / sr; y[i2] = (Math.sin(ph) + 0.5 * Math.sin(2 * ph) + 0.35 * Math.sin(3 * ph) + 0.2 * Math.sign(Math.sin(ph * 0.5))) * on * Math.min(1, (t - a) / 0.2, (b - t) / 0.05); }
      LFX.bq(y, 'lp', 700, 0.7, sr); K.put(y, a, { vol: 0.03, norm: true, pan: car[0] > 0 ? -0.4 : 0.4, room: open, wet: 0.2 });
      // the tyres keep rolling
      const vv = lfCurve((t) => lfCarAt(i, S(t)).v / car[2]);
      lfBed(K, a, b, { colour: 'pink', f: [['bp', 500 / Math.sqrt(kk), 0.6]], vol: 0.03, mono: true, pan: car[0] > 0 ? -0.3 : 0.3, env: (u, t) => vv(t) }); }); }

  // ================================================================== the mountain: a fingernail on the barometer
  { const sh = lfShot('baro'), tap = (t, dead) => { const k = Math.sqrt(lfSlowK(t)), y = fx.hit(fx.glassModes().map(([f, tau, a]) => [f * 2.2, tau * (dead ? 0.35 : 1), a]), { width: 0.0003, amp: 1, noise: 0.3, nlen: 0.003, len: 0.6 });
      if (!dead) { const w = fx.liquid(0.5, (x) => Math.exp(-x * 7), { f: 700 }); for (let i = 0; i < w.length && i < y.length; i++) y[i] += 0.25 * w[i]; }
      putS(y, t, { vol: 0.16, norm: true, pan: 0.1, room, wet: 0.25, k }); };
    tap(c('mercury', 1) + 0.6, false); tap(c('mercury', 1) + 1.0, false);
    // it freezes: tiny ticks as the crystals grow up the column
    putS(lfCrackle(fx, 1.4, { rate: 120, hp: 3000, env: (u) => Math.sin(Math.PI * u) }), ev.hg - 0.3, { vol: 0.05, norm: true, room, wet: 0.2 });
    tap(Math.min(ev.hg + 1.0, sh.t1 - 0.6), true); }
  // the ring (the train still braking): nothing but the brakes; at the eyepiece: the astronomer's breath, the stool
  { const sh = lfShot('eyepiece'); K.put(fx.creak(0.7, [[160, 0.04, 1], [420, 0.025, 0.5]], { rate: [30, 12] }), sh.t0 + 0.4, { vol: 0.05, norm: true, pan: -0.2, room, wet: 0.3 });
    for (let t = sh.t0 + 1.2; t < sh.t1 - 1; t += 3.4) { K.put(fx.breath(1.3, { inhale: true }), t, { vol: 0.03, norm: true, room, wet: 0.3, lp: 3000 }); K.put(fx.breath(1.6, {}), t + 1.5, { vol: 0.03, norm: true, room, wet: 0.3, lp: 2600 }); } }
  { const sh = lfShot('scope'); K.put(fx.breath(1.6, {}), sh.t0 + 0.8, { vol: 0.03, norm: true, room, wet: 0.3, lp: 2600 }); }

  // ================================================================== the beach: the party's song, the fire
  // the speaker: its push is its magnet's, so it plays LFP.speakerDb quieter (−12 dB at ×2), heard from wherever you are
  { const t0 = B('beach'), t1 = B('stars'), y = lfPartySong(fx, t1 - t0, { offset: 40 }), n = y.length;
    const gain = { stopX: [0.35, 1400], winBeach: [0.22, 900], spk: [1.0, 6000], fireA: [0.6, 4000], fireB: [0.55, 4000], waves: [0.3, 2500], colA: [0.55, 4000], colB: [0.55, 4000], dayA: [0.35, 3000], heat: [0.5, 4000] };
    const gC = lfCurve((t) => { const g = gain[shotAt(t)]; return g ? g[0] * Math.pow(10, LFP.speakerDb(LFP.k(S(t))) / 20) : 0; });
    for (let i = 0; i < n; i++) y[i] *= gC(t0 + i / sr);
    // (per shot, its own low-pass: through the window, beside it, from the fire)
    for (const p of lfPlaces()) { const g = gain[p.shot.mode]; if (!g) continue; const a = Math.max(p.t0, t0), b = Math.min(p.t1, t1); if (b - a < 0.05) continue;
      const i0 = Math.round((a - t0) * sr), i1 = Math.round((b - t0) * sr), x = y.slice(i0, i1); for (let i = 0; i < x.length; i++) x[i] *= Math.min(1, i / (0.03 * sr), (x.length - i) / (0.03 * sr));
      LFX.bq(x, 'lp', g[1], 0.7, sr); K.put(x, a, { vol: 0.32, pan: p.shot.mode === 'spk' ? 0.1 : 0.45, room: open, wet: p.shot.mode === 'spk' ? 0.15 : 0.35 }); } }
  // the fire: it crackles just as loudly all night (just as hot), close or from across the cove
  { const near = { fireA: 1, fireB: 1, colA: 0.9, colB: 1, heat: 0.9, starsB: 0.8, spk: 0.35, waves: 0.3, dayA: 0.35, starsA: 0.55, runout: 0.5, stopX: 0.2, stretch: 0.3, pupil: 0.2, question: 0.15 };
    for (const p of lfPlaces()) { const g = near[p.shot.mode]; if (!g) continue; const a = p.t0, b = Math.min(p.t1, END) + 0.04; if (b - a < 0.05) continue;
      const d = b - a, cr = lfCrackle(fx, d, { rate: 60, hp: 900, env: (u) => Math.min(1, u * d / 0.05, (1 - u) * d / 0.05) });
      K.put(cr, a, { vol: 0.12 * g, norm: true, pan: 0.15, room: open, wet: 0.15 });
      lfBed(K, a, b, { colour: 'brown', f: [['lp', 320], ['hp', 60]], vol: 0.07 * g, am: 0.5, wr: 1.2, mono: true, pan: 0.1, env: (u, t) => (t > END - 0.02 ? 0 : 1) }); } }
});
