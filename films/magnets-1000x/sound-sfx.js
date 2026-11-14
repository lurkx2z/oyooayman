/* =====================================================================
   SOUND · EFFECTS — the events, each at its story moment (the clock only runs forward, so each is heard once). From
   10:42:00 the world's own sounds run at a quarter speed (mgWorldRate: two octaves down, four times longer); at
   10:42:10 they snap back to real speed.
     10:41:57     the radio on the hatch, playing a song; at 10:42:00 it goes silent (its own magnet brakes the cone)
     10:42:00     every magnet's hum (the scrapyard's, loudest by the river; the MRI's in the hospital), cut dead at
                  10:42:10; the crane's magnet slams; its rope snaps
     the pile     steel groaning and clanking as it lifts; scrap hitting the ball
     the hospital the cylinder scraping off its trolley, the wall bursting, the clang in the scanner; the water's
                  gloop; phones smacking into the waiting room's wall; its people crying out
     your boat    the hull groaning; the water rushing along it
     the cars     tyres on gravel; a car hitting the ball
     the bridge   tyres screaming; horns
     the turbines a far crack as the blades snap off, their whoosh
     inside       tins and pans sliding; the kettle hits the floor
     your phone   your fingers losing it, your gasp, its whoosh, the hit (glass and steel)
     the count    the boat's hull groaning, your bike torn off the roof, the water pouring off the hull, the crash
     10:42:10     the hum cut dead; the boat drops into the river; the ball's outside falls, its crushed core thuds down
     +1 minute    sirens far off; magnetised scrap ticking; the hull creaking against the wall
   ===================================================================== */

mgSound('sfx', 'events', function (ctx, bus, K) {
  const { fx, sr } = K, r = new RNG(CONFIG.seed + 909), wr = mgWorldRate, T0 = MG.tOn, F = mgFilmAt, S = MG_SMALL, tb = F(MGP.T), tA = mgB('after');
  const open = K.verb('sopen', 2.2, { bright: 0.45, damp: 2.0, wet: 0.3 }), big = K.verb('sbig', 4.0, { bright: 0.35, damp: 1.6, wet: 0.4, pre: 0.03 });
  const room = K.verb('sroom', 0.7, { bright: 0.6, damp: 3.2, wet: 0.25 }), far = K.verb('sfar', 3.4, { bright: 0.3, damp: 1.8, wet: 0.65, pre: 0.08, early: [[0.3, 0.4], [0.7, 0.25]] });
  const sh = (m) => mgShot(m), where = (t) => mgWhereShot(mgShotAt(t)), modeAt = (t) => mgShotAt(t).mode;
  // play x at film time t at the world's speed then (o.rate overrides), cut at the end of its shot unless o.keep
  const putS = (x, t, o = {}) => { const s0 = mgShotAt(t); return K.put(x, t, Object.assign({ norm: true }, o, { rate: o.rate ?? wr(t), stop: o.keep ? undefined : s0.t1 + 0.03, fade: 0.05 })); };
  const burst = (d, curve, q = 1, env = (u) => Math.sin(Math.PI * u), col = 'pink') => { const n = Math.ceil(d * sr), y = mgNoise(fx, n, col); for (let i = 0; i < n; i++) y[i] *= env(i / n); return mgSweep(y, sr, 'bp', q, curve); };
  const clank = (f, dk = 1, a = 1) => fx.hit(fx.metalModes(f, dk), { width: 0.0012, amp: a, noise: 0.4, nlen: 0.012, nhp: 400, len: 1.2 * dk + 0.3 });
  const groan = (d, f, o = {}) => fx.creak(d, [[f, 0.18, 1], [f * 1.63, 0.12, 0.6], [f * 2.9, 0.08, 0.35], [f * 4.4, 0.05, 0.2]], Object.assign({ rate: [9, 22], jit: 0.5, wrate: 0.7 }, o));
  // a heavy steel impact: a body that rings, a crunch on top
  const crash = (f = 70, len = 2.4) => { const y = fx.hit([[f, 0.6, 1], [f * 1.48, 0.45, 0.7], [f * 2.31, 0.3, 0.5], [f * 3.7, 0.18, 0.35], [f * 5.3, 0.1, 0.2]], { width: 0.004, amp: 1, noise: 0.6, nlen: 0.05, nhp: 300, len });
    const c = mgCrack(fx, { len: Math.min(len, 1.6), s: 0.5 }); for (let i = 0; i < c.length && i < y.length; i++) y[i] += 0.5 * c[i]; return y; };

  // ================================================================== 10:41:57: the radio on the hatch; 10:42:00: it goes silent
  // (its speaker's own magnet, 1,000× stronger, brakes the cone almost dead: one soft tock, then nothing)
  { const t0 = -1.2, y = mgPartySong(fx, T0 - t0 + 0.02, { offset: 21 });
    K.put(y, t0, { vol: 0.16, norm: true, pan: -0.25, room, wet: 0.2, stop: T0 + 0.002, fade: 0.002 });
    putS(fx.hit([[180, 0.04, 1], [420, 0.02, 0.4]], { width: 0.0008, amp: 1, noise: 0.3, nlen: 0.004, nhp: 600, len: 0.12 }), T0 + 0.004, { vol: 0.05, pan: -0.25, rate: 1, keep: true }); }

  // ================================================================== every magnet's hum, 10:42:00 → 10:42:10 (cut dead)
  { const lv = { river: 1, high: 0.55, inside: 0.4, bridge: 0.12, hill: 0.08, hospital: 0 };
    const g = mgCurve((t) => { let v = 0; for (const p of mgPlaces()) { const l = lv[p.where] ?? 0; if (l) v += l * mgWn(t, p.t0, p.t1, 0.04, 0.04); } return Math.min(1, v) * mgEv(t, T0, T0 + 0.5); });
    const gH = mgCurve((t) => { let v = 0; for (const p of mgPlaces()) if (p.where === 'hospital') v += mgWn(t, p.t0, p.t1, 0.04, 0.04); return Math.min(1, v) * mgEv(t, T0, T0 + 0.5); });
    const d = tb - T0 + 0.005;
    mgTone(K, T0, d, (tt) => 110 * wr(T0 + tt), [[1, 1], [2, 0.8], [3, 0.55], [4, 0.4], [5, 0.3], [7, 0.18], [9, 0.1]], (u, tt) => g(T0 + tt) * Math.min(1, (d - tt) / 0.004), { vol: 0.07, pan: 0.2, f: [['hp', 35]] });
    mgTone(K, T0, d, (tt) => 64 * wr(T0 + tt) * (1 + 0.004 * Math.sin(tt * 0.7)), [[1, 0.6], [2, 1], [3, 0.6], [4, 0.45], [6, 0.25], [8, 0.12]], (u, tt) => gH(T0 + tt) * Math.min(1, (d - tt) / 0.004), { vol: 0.07, pan: -0.1, f: [['hp', 35]] }); }
  // the crane's magnet slams on; its rope snaps (slowed: a deep twang)
  putS(clank(160, 2), T0 + 0.05, { vol: 0.2, pan: 0.3, room: big, wet: 0.4, keep: true });
  { const t = F(MGY.S0); putS(fx.hit([[310, 0.5, 1], [620, 0.3, 0.5], [935, 0.2, 0.3], [1260, 0.12, 0.2]], { width: 0.0005, amp: 1, noise: 0.5, nlen: 0.01, nhp: 1200, len: 1.6 }), t, { vol: 0.22, pan: 0.35, room: big, wet: 0.4 }); }

  // ================================================================== the pile lifting; scrap hitting the ball
  { const p = sh('pile'), y2 = sh('rope');
    putS(groan(p.t1 - p.t0 + 0.5, 48), p.t0 + 0.2, { vol: 0.22, pan: 0.2, room: big, wet: 0.35, rate: 1 });
    for (let t = p.t0 + 0.6; t < y2.t1 - 0.3; t += r.range(0.35, 0.9)) putS(clank(r.range(140, 520), r.range(0.6, 1.4)), t, { vol: r.range(0.06, 0.14), pan: r.range(-0.5, 0.6), room: big, wet: 0.35 });
    putS(groan(y2.t1 - y2.t0, 36), y2.t0 + 0.2, { vol: 0.2, pan: 0.3, room: big, wet: 0.4, rate: 1 }); }
  { const p = sh('speed');
    for (const s of [p]) for (let t = s.t0 + 0.3; t < s.t1 - 0.2; t += r.range(0.18, 0.55)) putS(clank(r.range(90, 420), r.range(0.4, 1.0)), t, { vol: r.range(0.06, 0.16), pan: r.range(-0.6, 0.6), room: big, wet: 0.35 });
    putS(groan(p.t1 - p.t0, 40), p.t0 + 0.1, { vol: 0.14, pan: 0, room: big, wet: 0.35, rate: 1 }); }

  // ================================================================== the hospital
  { const ex = sh('hospitalExt'); putS(burst(4, [300, 500, 380]), ex.t0 + 0.4, { vol: 0.03, pan: 0.4, room: far, wet: 0.6 }); }
  { const mr = sh('mriRoom'), pl = sh('plan');
    // the scanner's coil under 3,000 tesla: a deep metallic strain
    putS(groan(mr.t1 - mr.t0 + 0.2, 52, { rate: [5, 12] }), mr.t0 + 0.1, { vol: 0.15, pan: 0, room, wet: 0.3, rate: 1 });
    putS(groan(pl.t1 - pl.t0 + 0.2, 46, { rate: [5, 12] }), pl.t0 + 0.1, { vol: 0.1, pan: 0, room, wet: 0.3, rate: 1 }); }
  { const co = sh('corridor'), tw = F(S.cyl.wall), th = F(S.cyl.hit);
    // the cylinder dragged off its trolley; its wheels; the rush as it accelerates; the wall bursts; the clang in the bore
    putS(mgScrape(fx, 1.2, { f: 900, rate: 22 }), co.t0 + 0.4, { vol: 0.16, pan: -0.3, room, wet: 0.3 });
    putS(clank(380, 0.6), co.t0 + 0.5, { vol: 0.1, pan: -0.3, room, wet: 0.3 });
    K.put(burst(tw - co.t0 - 0.6, [180, 260, 420, 700, 1100], 0.9, (u) => Math.pow(u, 2)), co.t0 + 0.6, { vol: 0.14, norm: true, pan: -0.1, room, wet: 0.2 });
    { const y = mgCrack(fx, { len: 2.4, s: 0.55 }); putS(y, tw, { vol: 0.32, pan: 0, room, wet: 0.35, keep: true }); }
    putS(fx.rustle(3.0, { density: 400, rub: 0.25, lo: 300, hi: 4000, grain: 0.02, env: (u) => Math.pow(1 - u, 1.5) }), tw + 0.05, { vol: 0.14, pan: 0.1, room, wet: 0.3, keep: true });
    for (let k = 0; k < 14; k++) putS(fx.hit(fx.stoneModes(r.range(0.8, 1.6)), { width: 0.002, amp: 1, noise: 0.3, nlen: 0.01, nhp: 600, len: 0.5 }), tw + r.range(0.3, 3.5), { vol: r.range(0.04, 0.09), pan: r.range(-0.6, 0.6), room, wet: 0.3, keep: true });
    putS(crash(62, 3.2), th, { vol: 0.36, pan: 0.05, room: big, wet: 0.35, keep: true });
    putS(clank(240, 2.6), th + 0.01, { vol: 0.2, pan: -0.1, room: big, wet: 0.35, keep: true }); }
  { const wa = sh('water');
    // the water rising out of its cup: a slow, deep gloop and bubbles
    putS(fx.liquid(6, (t) => Math.min(1, t / 0.6) * (0.6 + 0.4 * Math.sin(t * 1.3)), { f: 380 }), wa.t0 + 0.6, { vol: 0.12, pan: 0.15, room, wet: 0.25 });
    // the waiting room's phones hitting the wall, through it (muffled)
    for (const w of S.wait) { if (w.hit == null) continue; const t = F(w.hit); if (where(t) !== 'hospital') continue;
      const inWait = modeAt(t) === 'waiting';
      putS(fx.hit(fx.glassModes().map(([f, tau, a]) => [f * r.range(0.9, 1.2), tau, a]), { width: 0.0008, amp: 1, noise: 0.5, nlen: 0.006, nhp: 1500, len: 0.6 }), t, { vol: inWait ? 0.2 : 0.07, pan: r.range(-0.4, 0.4), room, wet: 0.3, lp: inWait ? undefined : 700 }); } }
  { const w = sh('waiting');
    // its people: a cry, slowed to a moan
    mgCrowdCry(K, w.t0 + 0.6, { k: wr(w.t0 + 1), n: 6, d: 1.4, spread: 1.2, vol: 0.14, lo: 260, hi: 560, room, wet: 0.35 });
    mgCrowdCry(K, w.t0 + 5.5, { k: wr(w.t0 + 6), n: 3, d: 1.2, spread: 0.8, vol: 0.09, lo: 240, hi: 480, room, wet: 0.35 }); }

  // ================================================================== your boat: the hull groaning, the water rushing along it
  const water = (s0, vol) => mgBedW(K, s0.t0, s0.t1 + 0.04, { colour: 'pink', f: [['bp', 650, 0.6], ['lp', 2200]], vol, am: 0.6, wr: 1.2, mono: true, pan: -0.15 });
  for (const [m, gv, wv] of [['hull', 0.13, 0.06], ['boatAir', 0.08, 0.04], ['mum', 0.16, 0.07], ['close', 0.2, 0.08], ['count', 0.22, 0.08], ['bike', 0.24, 0.09]]) {
    const s0 = sh(m); if (!s0) continue;
    putS(groan(s0.t1 - s0.t0 + 0.2, r.range(55, 75)), s0.t0 + 0.1, { vol: gv, pan: r.range(-0.3, 0.3), room: open, wet: 0.25, rate: 1 });
    water(s0, wv); }
  // your mum, straining at the tiller
  { const s0 = sh('mum'); putS(fx.breath(1.6, { voice: 0.3, f0: 190 }), s0.t0 + 2.2, { vol: 0.08, pan: -0.25, room: open, wet: 0.15, rate: 0.6 }); }

  // ================================================================== the cars; the bridge; the turbines
  { const cs = sh('cars'), up = F(MG_AT.carUp), hit = F(MGY.cars[0].firstHit);
    putS(mgRoll(fx, 6, { v: (u) => 0.4 + 0.6 * u, lp: 900 }), cs.t0 + 0.4, { vol: 0.14, pan: 0.3, room: open, wet: 0.25 });
    putS(groan(1.6, 90), up - 0.2, { vol: 0.12, pan: 0.2, room: open, wet: 0.3, rate: 1 });
    if (where(hit) !== 'hospital') { putS(crash(80, 2.4), hit, { vol: 0.32, pan: -0.1, room: big, wet: 0.4 }); const sm = fx.smash({ v: 9, g: 9.8, slow: 2.5, pitch: 0.5, pan: -0.1 }); putS(sm.L, hit + 0.01, { vol: 0.12, pan: -0.3, room: big, wet: 0.35 }); } }
  { const b1 = sh('bridge'), b2 = sh('bridgeWide');
    const squeal = (d) => { const n = Math.ceil(d * sr), y = mgNoise(fx, n, 'white'), w = fx.wander(6); for (let i = 0; i < n; i++) { const u = i / n; y[i] *= Math.min(1, u * 10) * Math.pow(1 - u, 0.6); } return mgSweep(y, sr, 'bp', 9, Array.from({ length: 40 }, (_, k) => 1900 + 260 * w(k / 40 * d))); };
    const horn = (d, f) => { const n = Math.ceil(d * sr), y = new Float32Array(n); for (const [ff, a] of [[f, 1], [f * 1.22, 0.85]]) { let ph = 0; for (let i = 0; i < n; i++) { const t = i / sr; ph += 2 * Math.PI * ff / sr; y[i] += a * (Math.sin(ph) + 0.5 * Math.sin(2 * ph) + 0.35 * Math.sin(3 * ph)) * Math.min(1, t / 0.03, (d - t) / 0.08); } } MGX.bq(y, 'lp', 3200, 0.7, sr); return y; };
    putS(squeal(2.4), b1.t0 + 1.2, { vol: 0.09, pan: 0.3, room: open, wet: 0.3 });
    putS(squeal(2.0), b1.t0 + 4.8, { vol: 0.08, pan: -0.35, room: open, wet: 0.3 });
    putS(horn(2.0, 415), b1.t0 + 6.5, { vol: 0.07, pan: 0.15, room: open, wet: 0.3 });
    putS(squeal(2.4), b2.t0 + 0.6, { vol: 0.07, pan: 0.1, room: far, wet: 0.5 }); }
  { const t1 = sh('turbines'), t2 = sh('blades');
    putS(mgCrack(fx, { len: 2.4, s: 0.4 }), mgC('turbine', 1) + 0.6, { vol: 0.12, pan: 0.4, room: far, wet: 0.65 });
    putS(burst(4.5, [120, 260, 180, 90], 0.8), t1.t0 + 6.5, { vol: 0.08, pan: 0.3, room: far, wet: 0.6 });
    putS(burst(3.6, [200, 420, 250], 0.8), t2.t0 + 0.2, { vol: 0.1, pan: -0.2, room: far, wet: 0.5 }); }

  // ================================================================== inside: the tins and pans slide; the kettle hits the floor
  { const ins = sh('inside'), tk = F(6.088);
    putS(mgScrape(fx, 4.5, { f: 1500, rate: 14 }), ins.t0 + 0.8, { vol: 0.06, pan: 0.25, room, wet: 0.2 });
    putS(mgScrape(fx, 4.0, { f: 520, rate: 9 }), ins.t0 + 2.2, { vol: 0.07, pan: -0.2, room, wet: 0.2 });
    putS(mgScrape(fx, 1.8, { f: 1100, rate: 18 }), tk - 2.2, { vol: 0.06, pan: 0.1, room, wet: 0.2 });
    putS(clank(560, 1.1), tk, { vol: 0.22, pan: 0.05, room, wet: 0.3 });
    putS(fx.hit(fx.woodModes(170), { width: 0.002, amp: 1, noise: 0.3, nlen: 0.01, nhp: 400, len: 0.5 }), tk + 0.005, { vol: 0.12, pan: 0.05, room, wet: 0.25 }); }

  // ================================================================== your phone: torn out of your fingers; it hits the ball
  { const tr = F(S.phone.rel), th = F(S.phone.hit), rp = sh('rip');
    // your grip straining (a squeak of skin on glass), then it's gone: your gasp; its whoosh as it flies
    putS(fx.creak(1.8, [[1450, 0.02, 1], [2900, 0.012, 0.4]], { rate: [18, 40], env: (u) => Math.pow(u, 2) }), tr - 1.8, { vol: 0.06, pan: 0.15, room, wet: 0.1, rate: 1 });
    putS(fx.slap(fx.glassModes(), { amp: 0.5, skin: 0.8 }), tr, { vol: 0.12, pan: 0.15, rate: 0.5 });
    putS(fx.breath(0.7, { inhale: true }), tr + 0.15, { vol: 0.13, pan: 0.02, room, wet: 0.1, rate: 0.6 });
    putS(burst(3.2, [900, 600, 400, 300], 1.2, (u) => Math.min(1, u * 8) * Math.pow(1 - u, 1.6)), tr + 0.05, { vol: 0.1, pan: 0.2, room: open, wet: 0.3 });
    // the side view: its last metres, a rising rush; the hit
    const hs = sh('phonehit');
    K.put(burst(th - hs.t0, [250, 400, 900, 2200, 5000], 1.0, (u) => Math.pow(u, 2.5)), hs.t0, { vol: 0.16, norm: true, pan: -0.1, room: open, wet: 0.2 });
    putS(crash(180, 1.8), th, { vol: 0.24, pan: 0.15, room: big, wet: 0.35, rate: 0.5 });
    const sm = fx.smash({ v: 12, g: 9.8, slow: 3, pitch: 0.6, pan: 0.1 }); K.put(sm.L, th + 0.005, { vol: 0.2, norm: true, xr: sm.R, room: big, wet: 0.3, stop: hs.t1 + 0.03, fade: 0.05 }); void rp; }

  // ================================================================== the count: your bike; the boat out of the water; the crash
  { const tr = F(MGP.bikeRel), th = S.bike.hit != null ? F(S.bike.hit) : null, tOut = F(MG_AT.outS), tHit = F(MGB.hit);
    putS(fx.clamp({ slow: 2, pitch: 0.7 }), tr, { vol: 0.2, pan: 0.2, room: open, wet: 0.2, rate: 1 });
    putS(burst(2.6, [300, 700, 1500, 900], 1.0, (u) => Math.min(1, u * 6) * Math.pow(1 - u, 1.2)), tr + 0.05, { vol: 0.12, pan: 0.3, room: open, wet: 0.3 });
    if (th != null) putS(crash(140, 1.6), th, { vol: 0.2, pan: 0.2, room: big, wet: 0.35 });
    // the hull lifting out of the river: water pouring off it
    mgBedW(K, tOut - 0.3, tb + 0.05, { colour: 'pink', f: [['bp', 900, 0.5], ['lp', 3000]], vol: 0.14, am: 0.8, wr: 2, fi: 0.4, fo: 0.02 });
    for (let t = tOut; t < tb - 0.2; t += r.range(0.05, 0.16)) { const L = new Float32Array(Math.ceil(0.1 * sr)), R = new Float32Array(L.length); fx.bubble(L, R, 0, r.range(300, 900), r.range(0.008, 0.02), 1, r.range(-0.6, 0.6)); K.putLR(L, R, t, { vol: r.range(0.02, 0.05), norm: true, rate: wr(t) }); }
    putS(crash(48, 3.6), tHit, { vol: 0.42, pan: 0, room: big, wet: 0.35, keep: true });
    putS(clank(95, 3), tHit + 0.01, { vol: 0.22, pan: -0.2, room: big, wet: 0.35, keep: true }); }

  // ================================================================== 10:42:10: the hum cut dead (above); the boat drops; 160 tonnes fall
  { const tDrop = F(MGP.T + 0.25), tF0 = F(MGP.T + 0.32), tF1 = F(MGP.T + 1.4);
    // the splash: a heavy body of water, then it slapping back
    { const d = 2.6, n = Math.ceil(d * sr), y = mgNoise(fx, n, 'pink'), z = mgNoise(fx, n, 'brown'); for (let i = 0; i < n; i++) { const t = i / sr; y[i] = (0.6 * y[i] + z[i]) * Math.min(1, t / 0.01) * Math.exp(-t / 0.5); }
      K.put(mgSweep(y, sr, 'lp', 0.8, [3500, 1800, 900, 500]), tDrop, { vol: 0.34, norm: true, room: open, wet: 0.3 }); }
    for (let k = 0; k < 18; k++) { const t = tDrop + r.range(0.1, 2.2), L = new Float32Array(Math.ceil(0.12 * sr)), R = new Float32Array(L.length); fx.bubble(L, R, 0, r.range(250, 800), r.range(0.01, 0.03), 1, r.range(-0.7, 0.7)); K.putLR(L, R, t, { vol: r.range(0.03, 0.07), norm: true }); }
    // the scrap: a long falling crash, dense then thinning
    for (let t = tF0; t < tF1 + 2.5; t += r.range(0.03, 0.12) * (1 + 2 * mgEv(t, tF1, tF1 + 2.5))) putS(clank(r.range(70, 380), r.range(0.4, 1.2)), t, { vol: r.range(0.06, 0.15) * (1 - 0.7 * mgEv(t, tF1, tF1 + 2.5)), pan: r.range(-0.7, 0.7), room: big, wet: 0.35, keep: true });
    K.put(crash(40, 3.8), tF0 + 0.1, { vol: 0.34, norm: true, room: big, wet: 0.4 });
    { const d = 4.5, n = Math.ceil(d * sr), y = mgNoise(fx, n, 'brown'); for (let i = 0; i < n; i++) { const t = i / sr; y[i] *= Math.min(1, t / 0.05) * Math.exp(-t / 1.4); } MGX.bq(y, 'lp', 400, 0.7, sr); K.put(y, tF0, { vol: 0.24, norm: true, room: big, wet: 0.3 }); } }
  // ================================================================== +1 minute: sirens far off; magnetised scrap ticking; the hull against the wall
  { const siren = (d, f0) => { const n = Math.ceil(d * sr), y = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / sr, f = f0 * (1 + 0.28 * (0.5 + 0.5 * Math.sin(2 * Math.PI * t / 3.2))); ph += 2 * Math.PI * f / sr; y[i] = (Math.sin(ph) + 0.25 * Math.sin(2 * ph)) * Math.min(1, t / 1.5, (d - t) / 1.5); } MGX.bq(y, 'lp', 2200, 0.7, sr); return y; };
    K.put(siren(MG.end - tA + 0.5, 640), tA, { vol: 0.035, norm: true, pan: 0.5, room: far, wet: 0.7 });
    K.put(siren(MG.end - tA - 3, 720), tA + 3.5, { vol: 0.025, norm: true, pan: -0.4, room: far, wet: 0.7 });
    for (let t = tA + 0.8; t < mgB('question') - 0.3; t += r.range(0.7, 1.8)) K.put(clank(r.range(900, 1800), 0.25), t, { vol: r.range(0.02, 0.04), norm: true, pan: r.range(-0.6, 0.6), room: open, wet: 0.35 });
    const st = sh('stuck'); K.put(groan(st.t1 - st.t0, 70, { rate: [4, 9] }), st.t0 + 0.2, { vol: 0.08, norm: true, pan: 0.2, room: open, wet: 0.3 }); }
});
