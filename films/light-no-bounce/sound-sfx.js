/* =====================================================================
   SOUND · EFFECTS — the events, each at its story moment (the clock only runs forward, so each is heard once). While
   nothing bounces the world's own sounds run at a quarter speed (nbWorldRate: two octaves down, four times longer), so
   the fair turns into a slow, deep nightmare; at 3:30:10 they snap back to real speed.
     3:29:57      the carousel's band organ (a waltz), the high striker's bell; at 3:30 the organ runs down like tape
     the dark     the crowd's gasp and cries, slowed; now and then a voice somewhere, calling, slowed; something passes
                  you (a footstep, cloth, a breath, slowed)
     the road     horns and a tyre's squeal, slowed; a car going past the verge
     the plane    the flight deck's chime; the tower's radio squelch and its radar's warning, slowed
     back to you  it hasn't moved (cloth); it's closer: a step, and its breathing, slowed
     the rides    the rollercoaster's riders and its wheels; the juggler's torches
     the internet your video's "not sent", slowed; the heat: metal roofs ticking as they warm
     the count    a breath right in front of you, a shuffle; the world speeding back up (a riser) into 3:30:10
     3:30:10      a flash of sound; 400 people screaming at real speed; the person in front of you gasps and stumbles
     the motorway  car alarms echoing up the valley; on the verge by the pile-up, its alarms and horns close by, a tyre's scream, one more crash up the road
     +2 minutes   your phone filling up with messages; sirens far off
     4:42 PM      Saturn goes out: a soft "oh" from the crowd
   ===================================================================== */

nbSound('sfx', 'events', function (ctx, bus, K) {
  const { fx, sr } = K, r = new RNG(CONFIG.seed + 909), wr = nbWorldRate, T0 = NB.tLock, tb = nbFilmAt(NBP.T), tA = nbB('after'), tE = nbB('echo');
  const open = K.verb('sopen', 2.2, { bright: 0.45, damp: 2.0, wet: 0.3 }), dark = K.verb('sdark', 4.5, { bright: 0.35, damp: 1.4, wet: 0.45, pre: 0.03 });
  const valley = K.verb('svalley', 3.6, { bright: 0.3, damp: 1.8, wet: 0.65, pre: 0.1, early: [[0.32, 0.5], [0.71, 0.32], [1.2, 0.18]] }), room = K.verb('sroom', 0.5, { bright: 0.6, damp: 3.5, wet: 0.25 });
  const sh = (m) => nbShot(m), where = (t) => nbWhereShot(nbShotAt(t)), modeAt = (t) => nbShotAt(t).mode;
  // play x at film time t at the world's speed then (o.rate overrides), cut at the end of its shot unless o.keep
  const putS = (x, t, o = {}) => { const s0 = nbShotAt(t); return K.put(x, t, Object.assign({ norm: true }, o, { rate: o.rate ?? wr(t), stop: o.keep ? undefined : s0.t1 + 0.03, fade: 0.05 })); };
  const noiseBurst = (d, curve, q = 1, env = (u) => Math.sin(Math.PI * u)) => { const n = Math.ceil(d * sr), y = nbNoise(fx, n, 'pink'); for (let i = 0; i < n; i++) y[i] *= env(i / n); return nbSweep(y, sr, 'bp', q, curve); };

  // ================================================================== 3:29:57: the carousel's organ, all film long
  // (one performance, its clock at the world's speed; heard by how near each shot is to the carousel)
  { const lv = { title: 0.32, wide: 0.5, stalls: 0.42, sky: 0.45, sun: 0.35, sources: 0.3, hands: 0.32, real: 0.5, crowd: 0.45, near: 0.3, still: 0.16,
      coaster: 0.2, fire: 0.28, fireClose: 0.24, phoneNet: 0.3, closer: 0.12, heat: 0.36, pupils: 0.3, sunWarn: 0.32, count: 0.32, reveal: 0.34 };
    const t0 = -1, t1 = tA + 0.1, [L, R] = nbOrgan(fx, t0, t1, wr, { offset: 3.2 });
    const g = nbCurve((t) => { let v = 0; for (const s of NB_SHOTS) { if (s.t0 >= tA) continue; const l = lv[s.mode] ?? (nbWhereShot(s) === 'edge' ? 0.08 : 0); if (l) v += l * nbWn(t, s.t0, s.t1, 0.04, 0.04); } return Math.min(v, 0.6) * (t < tA ? 1 : 0); });
    const pk = NBX.peak(L, R);   // (the level is set from the organ itself, before the shots' levels: a quieter shot stays quieter)
    for (let i = 0; i < L.length; i++) { const k = g(t0 + i / sr); L[i] *= k; R[i] *= k; }
    K.putLR(L, R, t0, { vol: 0.43, norm: pk, room: open, wet: 0.35 }); }
  // the high striker's bell, just before
  { const y = fx.hit(fx.metalModes(1320, 2.2), { width: 0.0008, amp: 1, noise: 0.15, nlen: 0.01, nhp: 2000, len: 2.2 }); K.put(y, 0.9, { vol: 0.09, norm: true, pan: 0.55, room: open, wet: 0.5 }); }

  // ================================================================== 3:30:00: the dark. The crowd, slowed
  for (const [t, o] of [[4.7, { n: 22, d: 0.45, spread: 0.4, vol: 0.3, lo: 300, hi: 700 }], [10.6, { n: 14, d: 1.3, spread: 1.2, vol: 0.3 }], [18.2, { n: 8, d: 1.5, spread: 1.5, vol: 0.22 }], [27.6, { n: 6, d: 1.6, spread: 2, vol: 0.2 }]]) {
    const w = where(t), g = w === 'fair' ? 1 : w === 'edge' ? 0.4 : 0; if (!g) continue;
    nbCrowdCry(K, t, Object.assign({}, o, { k: wr(t), vol: o.vol * g, room: dark, wet: 0.45 })); }
  // now and then, somewhere in the dark, someone calling out (slowed: a deep, long moan)
  { const quiet = ['near', 'count', 'hands'];
    for (let t = 44 + r.range(0, 5); t < nbB('count') - 2; t += r.range(9, 16)) {
      const w = where(t), m = modeAt(t); if (w !== 'fair' || quiet.includes(m)) continue;
      nbCrowdCry(K, t, { k: wr(t), n: r.int(1, 3), d: r.range(0.6, 1.2), spread: 0.5, vol: r.range(0.07, 0.12), lo: 250, hi: 520, room: dark, wet: 0.55 }); } }
  // something passes between you and the lights: a footstep, its clothes, a breath, all slowed
  { const s0 = sh('near');
    putS(fx.step({ weight: 0.9, scuff: 0.4 }), s0.t0 + 0.5, { vol: 0.28, pan: -0.45, room: dark, wet: 0.3 });
    putS(fx.rustle(1.6, { density: 300, lo: 500, hi: 5000 }), s0.t0 + 1.1, { vol: 0.11, pan: -0.3, room: dark, wet: 0.25 });
    putS(fx.breath(1.0, { voice: 0.2, f0: 110 }), s0.t0 + 1.9, { vol: 0.12, pan: -0.15, room: dark, wet: 0.2 });
    putS(fx.step({ weight: 0.8, scuff: 0.3 }), s0.t0 + 4.2, { vol: 0.24, pan: -0.05, room: dark, wet: 0.3 }); }

  // ================================================================== the road, blind
  const horn = (d, f) => { const n = Math.ceil(d * sr), y = new Float32Array(n); for (const [ff, a] of [[f, 1], [f * 1.22, 0.85]]) { let ph = 0; for (let i = 0; i < n; i++) { const t = i / sr; ph += 2 * Math.PI * ff / sr; y[i] += a * (Math.sin(ph) + 0.5 * Math.sin(2 * ph) + 0.35 * Math.sin(3 * ph) + 0.2 * Math.sin(4 * ph)) * Math.min(1, t / 0.03, (d - t) / 0.08); } } NBX.bq(y, 'lp', 3200, 0.7, sr); return y; };
  const squeal = (d) => { const n = Math.ceil(d * sr), y = nbNoise(fx, n, 'white'), w = fx.wander(6); for (let i = 0; i < n; i++) { const u = i / n; y[i] *= Math.min(1, u * 10) * Math.pow(1 - u, 0.6); } return nbSweep(y, sr, 'bp', 9, Array.from({ length: 40 }, (_, k) => 1900 + 260 * w(k / 40 * d))); };
  { const d = sh('driver'), v = sh('verge');
    putS(horn(2.2, 415), d.t0 + 1.4, { vol: 0.1, pan: 0.15, room: open, wet: 0.3 });
    putS(squeal(1.4), d.t0 + 4.6, { vol: 0.065, pan: 0.35, room: open, wet: 0.3 });
    putS(horn(1.6, 350), d.t0 + 6.4, { vol: 0.065, pan: -0.4, room: open, wet: 0.4 });
    // a car past the verge (a whoosh, slowed), a horn far off
    putS(noiseBurst(1.6, [380, 600, 1200, 700, 420], 0.8), v.t0 + 0.7, { vol: 0.22, pan: 0, room: open, wet: 0.25 });
    putS(horn(1.4, 470), v.t0 + 3.2, { vol: 0.07, pan: 0.5, room: valley, wet: 0.6 }); }

  // ================================================================== the plane
  { const ap = sh('approach'), tw = sh('tower');
    const chime = () => { const d = 1.1, n = Math.ceil(d * sr), y = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / sr, e = Math.exp(-t * 3.2) * Math.min(1, t / 0.004); y[i] = e * (Math.sin(2 * Math.PI * 784 * t) + 0.7 * Math.sin(2 * Math.PI * 1175 * t) + 0.2 * Math.sin(2 * Math.PI * 2350 * t)); } return y; };
    putS(chime(), ap.t0 + 1.2, { vol: 0.11, pan: 0.2, room, wet: 0.3 });
    // the tower: the radio's squelch, then the radar's warning (no returns)
    { const n = Math.ceil(0.4 * sr), y = nbNoise(fx, n, 'white'); for (let i = 0; i < n; i++) y[i] *= Math.min(1, i / (0.005 * sr)) * Math.pow(1 - i / n, 0.4); NBX.bq(y, 'bp', 2100, 1.2, sr); putS(y, tw.t0 + 0.7, { vol: 0.07, pan: -0.25, room, wet: 0.3 }); }
    for (const dt of [3.2, 3.55]) putS(fx.beep(1400, 0.22), tw.t0 + dt * 1, { vol: 0.05, pan: 0.3, room, wet: 0.3 }); }

  // ================================================================== the rides
  { const c = sh('coaster'), cp = sh('coasterPOV');
    // the train goes over (its wheels, its riders), slowed
    putS(nbRoll(fx, 1.3, { v: (u) => Math.sin(Math.PI * u), seam: 9, tick: 700, lp: 1800 }), c.t0 + 0.4, { vol: 0.2, pan: 0.3, room: open, wet: 0.35 });
    nbCrowdCry(K, c.t0 + 0.9, { k: wr(c.t0 + 1), n: 6, d: 1.4, spread: 0.6, vol: 0.14, lo: 380, hi: 820, room: dark, wet: 0.45 });
    // on the ride: your friend's scream, right beside you, slowed; the wheels over the track's joints
    { const y = nbVoice(fx, 2.0, { f0: (u) => 700 + 160 * Math.sin(Math.PI * u), formants: [[900, 5, 1], [1450, 6, 0.6], [3000, 7, 0.3]], breath: 0.2, env: (u) => Math.min(1, u / 0.06) * Math.pow(1 - u, 0.7) });
      putS(y, cp.t0 + 0.5, { vol: 0.17, pan: 0.35, room: dark, wet: 0.25 }); }
    for (let t = cp.t0 + 0.2; t < cp.t1 - 0.1; t += 1.05) putS(fx.hit(fx.metalModes(220, 0.5), { width: 0.0015, amp: 1, noise: 0.5, nlen: 0.02, nhp: 500, len: 0.5 }), t, { vol: 0.09, pan: -0.1, lp: 2400 }); }
  { const f1 = sh('fire'), f2 = sh('fireClose');
    // the torches: their roar, and a whoosh each time one swings past, slowed
    for (const s of [f1, f2]) nbBedW(K, s.t0, s.t1 + 0.04, { colour: 'pink', f: [['bp', 520, 0.6], ['lp', 1800]], vol: s === f2 ? 0.13 : 0.09, am: 0.6, wr: 1.5, mono: true, pan: 0.2 });
    let k = 0; for (let t = f1.t0 + 0.6; t < f2.t1 - 0.6; t += 2.4, k++) putS(noiseBurst(0.55, [300, 950, 300], 0.9), t, { vol: t > f2.t0 ? 0.2 : 0.15, pan: k % 2 ? 0.45 : -0.05, room: open, wet: 0.25 }); }

  // ================================================================== back to you: it hasn't moved; it's closer, and you can hear it breathing
  // (sound still bounces: its breath reaches you, slowed with the world)
  { const st = sh('still'), cl = sh('closer');
    putS(fx.rustle(1.2, { density: 160, lo: 400, hi: 3000 }), st.t0 + 1.0, { vol: 0.07, pan: 0.1, room: dark, wet: 0.25 });
    putS(fx.step({ weight: 0.8, scuff: 0.5 }), cl.t0 + 0.4, { vol: 0.24, pan: 0.05, room: dark, wet: 0.25 });
    putS(fx.breath(1.5, { inhale: true }), cl.t0 + 1.3, { vol: 0.16, pan: 0.02, room, wet: 0.12 });
    putS(fx.breath(1.6, { voice: 0.25, f0: 100 }), cl.t0 + 4.3, { vol: 0.17, pan: 0.02, room, wet: 0.12 }); }

  // ================================================================== the internet; the heat
  { const p = sh('phoneNet'); putS(fx.beep(880, 0.14), p.t0 + 1.4, { vol: 0.07, pan: 0.05, room, wet: 0.2 }); putS(fx.beep(660, 0.2), p.t0 + 2.1, { vol: 0.07, pan: 0.05, room, wet: 0.2 }); }
  { const h = sh('heat'); for (let t = h.t0 + 1.1; t < h.t1 - 0.5; t += r.range(1.8, 3.6)) putS(fx.hit(fx.metalModes(r.range(500, 900), 0.3), { width: 0.0008, amp: 1, noise: 0.2, nlen: 0.005, nhp: 1500, len: 0.5 }), t, { vol: r.range(0.04, 0.08), pan: r.range(-0.7, 0.7), room: open, wet: 0.5 }); }

  // ================================================================== the count: right in front of you
  { const c = sh('count');
    putS(fx.breath(1.4, { inhale: true }), c.t0 + 0.5, { vol: 0.1, pan: 0.05, room, wet: 0.15 });
    putS(fx.step({ weight: 0.7, scuff: 0.6 }), c.t0 + 3.4, { vol: 0.2, pan: 0.1, room: dark, wet: 0.25 });
    putS(fx.breath(1.2, { voice: 0.15, f0: 105 }), c.t0 + 5.0, { vol: 0.11, pan: 0.05, room, wet: 0.15 });
    // the world speeds back up: a rising sweep into the moment light returns, then a flash of sound
    { const d = 1.3, n = Math.ceil(d * sr), y = nbNoise(fx, n, 'pink'); for (let i = 0; i < n; i++) { const u = i / n; y[i] *= Math.pow(u, 2.2); }
      K.put(nbSweep(y, sr, 'bp', 1.4, [140, 220, 400, 900, 2400, 6000]), tb - d, { vol: 0.2, norm: true, room: open, wet: 0.3 }); }
    { const d = 2.2, n = Math.ceil(d * sr), y = nbNoise(fx, n, 'pink'), z = nbNoise(fx, n, 'brown'); for (let i = 0; i < n; i++) { const t = i / sr; y[i] = (y[i] * 0.6 + z[i]) * Math.min(1, t / 0.01) * Math.exp(-t / 0.5); } NBX.bq(y, 'lp', 3000, 0.7, sr); K.put(y, tb, { vol: 0.3, norm: true, room: open, wet: 0.4 }); } }

  // ================================================================== 3:30:10: real speed again. 400 people screaming
  for (const [dt, o] of [[0.25, { n: 30, d: 1.5, spread: 1.0, vol: 0.4 }], [2.3, { n: 18, d: 1.8, spread: 1.5, vol: 0.28 }], [5.2, { n: 10, d: 1.6, spread: 2.0, vol: 0.18 }]]) {
    const t = tb + dt, w = where(t), g = w === 'fair' ? 1 : w === 'edge' ? 0.4 : 0; if (g) nbCrowdCry(K, t, Object.assign({ k: 1, lo: 300, hi: 820, room: open, wet: 0.4 }, o, { vol: o.vol * g })); }
  // the reveal: the person in the bear suit gasps and stumbles back; so do you
  { const rv = sh('reveal');
    // (rv.t0 is 3:30:10 itself, in the white-out: it gasps as its face comes out of the white, at the world's slowed speed)
    K.put(fx.breath(0.35, { inhale: true }), rv.t0 + 1.4, { vol: 0.14, norm: true, pan: 0, room, wet: 0.15, rate: wr(rv.t0 + 1.4) });
    K.put(nbVoice(fx, 0.5, { f0: (u) => 170 + 90 * u, formants: [[650, 5, 1], [1150, 6, 0.6], [2500, 7, 0.25]], breath: 0.35, env: (u) => Math.min(1, u / 0.05) * Math.pow(1 - u, 1.4) }), rv.t0 + 1.65, { vol: 0.2, norm: true, pan: 0.05, room, wet: 0.2 });
    K.put(fx.step({ weight: 0.8, scuff: 0.6 }), rv.t0 + 2.3, { vol: 0.2, norm: true, pan: 0.1, room: open, wet: 0.2 });
    K.put(fx.step({ weight: 0.7, scuff: 0.4 }), rv.t0 + 2.9, { vol: 0.16, norm: true, pan: 0.15, room: open, wet: 0.2 }); }

  // ================================================================== the motorway: alarms up the valley (from the hill), then on the
  // verge by the pile-up: its car alarm and hazards close by, horns, one more crash further up the road
  { const mb = sh('moonback'), cr = sh('crash');
    K.put(nbAlarm(fx, cr.t0 - mb.t0 - 1.2, { f1: 980, f2: 780, per: 0.32 }), mb.t0 + 1.2, { vol: 0.045, norm: true, pan: 0.45, room: valley, wet: 0.7, lp: 1600, stop: cr.t0 + 0.03 });
    K.put(nbAlarm(fx, cr.t1 - cr.t0, { f1: 1150, f2: 900, per: 0.45 }), cr.t0, { vol: 0.07, norm: true, pan: 0.45, room: open, wet: 0.2, lp: 4500, stop: cr.t1 + 0.03 });
    K.put(nbAlarm(fx, cr.t1 - cr.t0, { f1: 980, f2: 780, per: 0.32 }), cr.t0 + 0.4, { vol: 0.035, norm: true, pan: -0.2, room: open, wet: 0.4, lp: 3000, stop: cr.t1 + 0.03 });
    K.put(horn(2.6, 380), cr.t0 + 0.3, { vol: 0.07, norm: true, pan: -0.1, room: open, wet: 0.35, lp: 3500 });
    K.put(squeal(0.9), cr.t0 + 1.4, { vol: 0.06, norm: true, pan: -0.3, room: valley, wet: 0.5, lp: 3000 });
    // one more crash, 150 m up the road (0.45 s later)
    { const t = cr.t0 + 2.3, y = nbCrack(fx, { len: 1.4, s: 0.55 }), gl = fx.smash({ v: 4.43, len: 1.6 });
      K.put(y, t, { vol: 0.15, norm: true, pan: -0.25, room: valley, wet: 0.55, lp: 3000 }); K.putLR(gl.L, gl.R, t + 0.03, { vol: 0.045, norm: true, room: valley, wet: 0.5 }); }
    K.put(horn(3.0, 440), cr.t0 + 3.3, { vol: 0.06, norm: true, pan: 0.15, room: open, wet: 0.35, lp: 3500 }); }

  // ================================================================== +2 minutes: your phone, the sirens
  { const af = sh('after'), aw = sh('afterWide');
    for (const dt of [0.6, 1.5, 1.8, 3.2, 4.9, 5.15, 7.0, 8.4, 9.1]) { const t = af.t0 + dt; if (t > af.t1 - 0.2) continue;
      const y = fx.arr(0.35); for (let i = 0; i < 0.3 * sr; i++) { const tt = i / sr, f = tt < 0.09 ? 1318.5 : 1760, lo = tt < 0.09 ? tt : tt - 0.09; y[i] = Math.sin(2 * Math.PI * f * tt) * Math.exp(-lo * 18) * Math.min(1, lo * sr / 40); }
      K.put(y, t, { vol: 0.06, norm: true, pan: 0.05, room, wet: 0.15 }); }
    K.put(nbAlarm(fx, af.t1 - af.t0 + 0.2, { f1: 740, f2: 554, per: 0.95 }), af.t0, { vol: 0.035, norm: true, pan: -0.5, room: valley, wet: 0.7, lp: 1700, stop: af.t1 + 0.03 });
    K.put(nbAlarm(fx, aw.t1 - aw.t0 + 0.2, { f1: 700, f2: 525, per: 1.0 }), aw.t0, { vol: 0.06, norm: true, pan: 0.4, room: valley, wet: 0.6, lp: 2000, stop: aw.t1 + 0.03 });
    K.put(nbAlarm(fx, aw.t1 - aw.t0 + 0.2, { f1: 780, f2: 585, per: 0.9 }), aw.t0 + 0.6, { vol: 0.035, norm: true, pan: -0.4, room: valley, wet: 0.7, lp: 1600, stop: aw.t1 + 0.03 }); }

  // ================================================================== 4:42 PM: Saturn goes out. A soft "oh"
  { const t = nbFilmAt(NBP.sEcho) + 0.2;
    nbCrowdCry(K, t, { k: 1, n: 30, d: 1.7, spread: 0.5, vol: 0.17, lo: 150, hi: 300, breath: 0.25, room: open, wet: 0.5,
      form: (q) => [[q.range(420, 520), 5, 1], [q.range(760, 900), 6, 0.55], [q.range(2400, 2700), 7, 0.15]], env: (u) => Math.min(1, u / 0.25) * Math.pow(1 - u, 1.4) }); }
});
