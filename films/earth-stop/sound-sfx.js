/* =====================================================================
   SOUND · EFFECTS — the events, each at its story moment (the clock only runs forward, so each is heard once). From
   5:42:00 the film runs hundreds of times slower than life: the world's own sounds play at three tenths of their
   speed (esWorldRate: deep, long), and the textures (steel skidding, water climbing, fire) are written low.
     5:42:00      the ground stops: one blast under the whole town (every bolt and every foundation at once), steel
                  groaning, glass
     the station  the building sliding off its floor: groans, column feet scraping, clanks, masonry cracking
     the Sun      the sea's wall rising in front of it: a dark swell
     the town     foundations cracking, near and far
     the platform cloth, shoes scraping; the pigeons' slow wings
     your train   steel skidding on steel (outside; inside, through the carriage, and a cup sliding); it passes
     the hill     the palms and the depot's shed reaching the rock (each at its own moment: physics.js ES_HITS)
     the wagons   skidding to the rock; the first one meets it: the biggest blast of the film, its fireball; the
                  other five, each at its moment (near, or far off behind you)
     the wind     the air against the hill, howling; fuel flaring
     the sea      the surge; the quay cracking under it; the ferry meeting the quay; the water climbing
     in the air   the station's roof creaking as it falls; the woman's dress
     the airliner the seat-belt chime
     the count    the skid climbing: cut dead at 5:42:01.000 as the wheels grip; then hot steel ticking
     the twist    what the ground stopped, coming back west: a roar that grows to the last frame; your carriage's
                  windows start to rattle
   ===================================================================== */

esSound('sfx', 'events', function (ctx, bus, K) {
  const { fx, sr } = K, r = new RNG(CONFIG.seed + 909), wr = esWorldRate, T0 = ES.tOn, F = esFilmAt, P = ESP, tb = F(P.T), tW = F(P.wagon0), tF = F(P.ferryHit), c = esC, B = esB, END = ES.tHit;   // (END: it arrives; after it, black)
  const open = K.verb('sopen', 2.2, { bright: 0.45, damp: 2.0, wet: 0.3 }), big = K.verb('sbig', 4.2, { bright: 0.35, damp: 1.6, wet: 0.4, pre: 0.03 });
  const room = K.verb('sroom', 0.7, { bright: 0.6, damp: 3.2, wet: 0.25 }), far = K.verb('sfar', 3.6, { bright: 0.3, damp: 1.8, wet: 0.65, pre: 0.08, early: [[0.3, 0.4], [0.7, 0.25]] });
  const sh = (m) => esShot(m), whereAt = (t) => esWhereShot(esShotAt(t)), len = (p) => p.t1 - p.t0;
  // play x at film time t at the world's speed then (o.rate overrides), cut at the end of its shot unless o.keep
  const putS = (x, t, o = {}) => { const s0 = esShotAt(t); return K.put(x, t, Object.assign({ norm: true }, o, { rate: o.rate ?? wr(t), stop: o.keep ? undefined : s0.t1 + 0.03, fade: 0.05 })); };
  // a texture over a whole shot, at real speed (its pitch is written low), faded at the cuts
  const over = (x, p, o = {}) => K.put(x, p.t0, Object.assign({ norm: true, stop: p.t1 + 0.03, fade: 0.05, fadeIn: 0.04 }, o));
  const burst = (d, curve, q = 1, env = (u) => Math.sin(Math.PI * u), col = 'pink') => { const n = Math.ceil(d * sr), y = esNoise(fx, n, col); for (let i = 0; i < n; i++) y[i] *= env(i / n); return esSweep(y, sr, 'bp', q, curve); };
  const clank = (f, dk = 1, a = 1) => fx.hit(fx.metalModes(f, dk), { width: 0.0012, amp: a, noise: 0.4, nlen: 0.012, nhp: 400, len: 1.2 * dk + 0.3 });
  const groan = (d, f, o = {}) => fx.creak(d, [[f, 0.18, 1], [f * 1.63, 0.12, 0.6], [f * 2.9, 0.08, 0.35], [f * 4.4, 0.05, 0.2]], Object.assign({ rate: [9, 22], jit: 0.5, wrate: 0.7, env: (u) => Math.min(1, u * 12, (1 - u) * 12) }, o));
  // a heavy steel impact: a body that rings, a crunch on top
  const crash = (f = 70, ln = 2.4) => { const y = fx.hit([[f, 0.6, 1], [f * 1.48, 0.45, 0.7], [f * 2.31, 0.3, 0.5], [f * 3.7, 0.18, 0.35], [f * 5.3, 0.1, 0.2]], { width: 0.004, amp: 1, noise: 0.6, nlen: 0.05, nhp: 300, len: ln });
    const k = esCrack(fx, { len: Math.min(ln, 1.6), s: 0.5 }); for (let i = 0; i < k.length && i < y.length; i++) y[i] += 0.5 * k[i]; return y; };
  const wood = (f) => fx.hit(fx.woodModes(f, 3), { width: 0.002, amp: 1, noise: 0.7, nlen: 0.03, nhp: 500, len: 0.5 });
  const wander = (n, lo, hi) => Array.from({ length: n }, () => r.range(lo, hi));

  // ================================================================== 5:42:00.000: the ground stops
  K.put(esBoom(fx, { len: 6, f0: 74, f1: 22, bright: 3200 }), T0, { vol: 0.5, norm: true, room: big, wet: 0.35 });
  putS(crash(48, 3), T0 + 0.012, { vol: 0.28, rate: 0.5, keep: true, pan: -0.15, room: big, wet: 0.4 });      // every bolt, every foundation, at once
  putS(groan(2.4, 50, { rate: [6, 15] }), T0 + 0.3, { vol: 0.2, rate: 0.6, pan: 0.2, room: big, wet: 0.4 });
  { const g = fx.smash({ v: 6, g: 9.8, slow: 2.5, pitch: 0.6, len: 1.6 }); K.putLR(g.L, g.R, T0 + 0.45, { vol: 0.07, norm: true, room: open, wet: 0.4, stop: sh('title').t1 + 0.03, fade: 0.05 }); }

  // ================================================================== the hill, 600 m east: the air piling on its rock; the palms arriving
  for (const m of ['first', 'firstB']) { const p = sh(m), d = len(p);
    over(burst(d, wander(8, 380, 700), 5, () => 1), p, { vol: 0.05, pan: -0.2, room: open, wet: 0.4 });
    over(groan(d, 84, { rate: [9, 22] }), p, { vol: m === 'first' ? 0.05 : 0.09, pan: 0.2, room: open, wet: 0.35 }); }
  // ================================================================== the station, sliding off its own floor
  { const p = sh('glide'), d = len(p);
    over(esScrape(fx, d, { f: 260, rate: 5 }), p, { vol: 0.08, pan: -0.3, room: open, wet: 0.3 });
    over(groan(d, 46, { rate: [4, 10] }), p, { vol: 0.1, pan: 0.25, room: big, wet: 0.4 }); }
  // the sea's wall rising in front of the Sun: a dark swell that tops as the Sun goes, then stays
  { const p = sh('sun'), d = len(p), uS = 0.7, e = (u) => (u < uS ? 0.12 + 0.88 * Math.pow(u / uS, 2) : 0.5 + 0.5 * Math.exp(-(u - uS) * 9));
    over(burst(d, [70, 110, 190, 260, 240, 220], 0.6, e, 'brown'), p, { vol: 0.26, room: big, wet: 0.35 });
    over(burst(d, [300, 500, 900, 1300, 1200, 1100], 0.5, e), p, { vol: 0.05, pan: -0.3, room: open, wet: 0.3 }); }
  // the base plate and its four sheared bolts (still ringing); the column feet skating; the building off its floor
  { const p = sh('bolt');
    [0.3, 1.9].forEach((dt, i) => putS(fx.hit(fx.metalModes(860 + 90 * i, 1.6), { width: 0.0006, amp: 1, noise: 0.5, nlen: 0.008, nhp: 900, len: 1.2 }), p.t0 + dt, { vol: 0.09, pan: -0.25 + 0.4 * i, room: open, wet: 0.4 }));
    over(esScrape(fx, len(p), { f: 320, rate: 8 }), p, { vol: 0.06, pan: 0.2, room: open, wet: 0.3 }); }
  { const p = sh('floor');
    over(groan(len(p), 36, { rate: [5, 12] }), p, { vol: 0.18, room: big, wet: 0.4 });
    for (let t = p.t0 + 0.5; t < p.t1 - 1; t += r.range(0.9, 1.7)) putS(esCrack(fx, { len: 1.2, s: r.range(0.5, 0.9) }), t, { vol: r.range(0.1, 0.17), pan: r.range(-0.5, 0.5), room: big, wet: 0.4 }); }

  // ================================================================== the town leaving its foundations
  { const p = sh('town');
    over(burst(len(p), [80, 140, 120], 0.7, (u) => Math.pow(Math.sin(Math.PI * u), 0.5), 'brown'), p, { vol: 0.18, room: big, wet: 0.35 });
    for (let t = p.t0 + 0.3; t < p.t1 - 0.8; t += r.range(0.6, 1.1)) putS(esCrack(fx, { len: 1.2, s: r.range(0.5, 0.9) }), t, { vol: r.range(0.12, 0.2), pan: r.range(-0.6, 0.6), room: big, wet: 0.4 }); }
  { const p = sh('cars'), d = len(p); over(esScrape(fx, d, { f: 300, rate: 7 }), p, { vol: 0.1, pan: -0.2, room: open, wet: 0.3 }); over(esScrape(fx, d, { f: 210, rate: 5 }), p, { vol: 0.07, pan: 0.3, room: open, wet: 0.3 }); }

  // ================================================================== the people; the platform's end
  { const p = sh('people'); over(fx.rustle(len(p), { density: 60, rub: 0.5, lo: 250, hi: 1800, grain: 0.05, env: () => 1 }), p, { vol: 0.03, pan: 0.2, room: open, wet: 0.3 }); }
  { const p = sh('platEnd'), d = len(p);
    over(esScrape(fx, d, { f: 520, rate: 11, q: 0.7 }), p, { vol: 0.08, pan: -0.1, room: open, wet: 0.3 });
    over(fx.rustle(d, { density: 90, rub: 0.4, lo: 300, hi: 2200, grain: 0.04, env: () => 1 }), p, { vol: 0.03, pan: 0.3 }); }
  { const p = sh('fly'); over(fx.rustle(len(p), { density: 70, rub: 0.5, lo: 260, hi: 2000, grain: 0.05, env: () => 1 }), p, { vol: 0.035, pan: -0.2, room: open, wet: 0.3 }); }
  // ================================================================== your train: steel skidding on steel
  { const p = sh('wheels'), d = len(p);
    over(esScreech(fx, d, { f: 480, rate: 34 }), p, { vol: 0.15, pan: 0.1, room: open, wet: 0.25 });
    over(esCrackle(fx, d, { rate: 140, hp: 1800 }), p, { vol: 0.045, pan: -0.2 });
    over(esRoll(fx, d, { lp: 500 }), p, { vol: 0.1 }); }
  { const p = sh('inside'), d = len(p);
    over(esScreech(fx, d, { f: 330, rate: 30 }), p, { vol: 0.055, lp: 700 });
    over(groan(d, 70, { rate: [3, 7] }), p, { vol: 0.045, pan: -0.3, room, wet: 0.5 });                       // the carriage's body
    putS(esScrape(fx, 0.9, { f: 900, rate: 16 }), p.t0 + 1.6, { vol: 0.045, pan: 0.3, room, wet: 0.5 });        // a cup, sliding on its table
    putS(fx.hit(fx.cupModes(0.9), { width: 0.0005, amp: 1 }), p.t0 + 4.9, { vol: 0.04, pan: 0.3, room, wet: 0.5 }); }
  { const p = sh('pass'), d = len(p), s0 = esStoryAt(p.t0), x0 = P.nose(s0) + 7.5;
    let lo = s0, hi = esStoryAt(p.t1 - 1e-3); for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (P.nose(m) < x0) lo = m; else hi = m; }
    const u0 = MathX.clamp((F(lo) - p.t0) / d, 0.3, 0.95);                                                     // the nose reaches the camera
    const LR = esPassBy(fx, d, { f: [160, 620, 300], peak: u0, w: 0.3, from: -0.15, to: -0.8, q: 0.7 });
    K.putLR(LR[0], LR[1], p.t0, { vol: 0.3, norm: true, room: open, wet: 0.25, stop: p.t1 + 0.03, fade: 0.05 });
    over(esScreech(fx, d, { f: 520, rate: 36, env: (u) => 0.25 + 0.75 * Math.exp(-Math.pow((u - u0) / 0.3, 2)), bend: (u) => 1.12 - 0.2 * esEv(u, u0 - 0.2, u0 + 0.2) }), p, { vol: 0.16, pan: -0.3, room: open, wet: 0.25 }); }
  for (const m of ['energy', 'ahead']) { const p = sh(m); over(esScreech(fx, len(p), { f: 440, rate: 32 }), p, { vol: 0.065, pan: m === 'energy' ? -0.2 : 0, room: open, wet: 0.35 }); }

  // ================================================================== the hill: everything that reaches the rock
  for (const h of ES_HITS) {
    const t = F(h.s); if (t < T0 || t > END || whereAt(t) !== 'hill' && h.kind === 'palm') continue;
    const m = esShotAt(t).mode, near = m === 'over' ? 0.45 : 1;
    if (h.kind === 'palm') putS(wood(r.range(110, 240)), t, { vol: r.range(0.11, 0.18) * near, pan: r.range(-0.5, 0.5), room: open, wet: 0.35 });
    if (h.kind === 'palm' && (m === 'first' || m === 'firstB')) K.put(esBoom(fx, { len: 1.3, f0: r.range(80, 110), f1: 38, bright: 900, crack: 0.5 }), t, { vol: m === 'first' ? 0.07 : 0.13, norm: true, pan: r.range(-0.5, 0.5), room: open, wet: 0.3, stop: esShotAt(t).t1 + 0.03, fade: 0.05 });
    else if (h.kind === 'house' && whereAt(t) === 'hill') { putS(crash(74, 2.2), t, { vol: 0.3, rate: 0.45, pan: -0.15, room: big, wet: 0.4 }); K.put(esBoom(fx, { len: 3, f0: 72, f1: 28, bright: 2400 }), t, { vol: 0.34, norm: true, room: big, wet: 0.35, stop: esShotAt(t).t1 + 0.03, fade: 0.05 });
      for (let i = 0; i < 5; i++) putS(esCrack(fx, { len: 1.2, s: r.range(0.5, 0.9) }), t + r.range(0.1, 1.3), { vol: r.range(0.1, 0.16), pan: r.range(-0.5, 0.5), room: big, wet: 0.4 }); }   // a house: masonry
    else if (h.kind === 'shed' && whereAt(t) === 'hill') { putS(crash(60, 2.6), t, { vol: 0.3, rate: 0.4, pan: 0.2, room: big, wet: 0.4 }); K.put(esBoom(fx, { len: 3, f0: 60, f1: 26, bright: 1800 }), t, { vol: 0.22, norm: true, room: big, wet: 0.35, stop: esShotAt(t).t1 + 0.03, fade: 0.05 }); }
    else if (h.kind !== 'wagon' && h.kind !== 'shed' && h.kind !== 'palm' && whereAt(t) === 'train') K.put(esBoom(fx, { len: 3, f0: 56, f1: 26, bright: 600, crack: 0 }), t, { vol: 0.12, norm: true, room: far, wet: 0.6 });
  }
  { const p = sh('hill'); over(burst(len(p), wander(10, 420, 720), 5, () => 1), p, { vol: 0.045, pan: -0.2, room: open, wet: 0.4 }); }
  for (const m of ['shed']) { const p = sh(m); over(groan(len(p), 92, { rate: [10, 26] }), p, { vol: 0.07, pan: -0.2, room: open, wet: 0.35 }); over(burst(len(p), wander(8, 420, 720), 5, () => 1), p, { vol: 0.045, pan: 0.2, room: open, wet: 0.4 }); }   // the air on the rock; timber and sheet steel folding
  // the wagons skidding to the rock
  for (const m of ['siding', 'wagons']) { const p = sh(m), d = len(p);
    over(esScreech(fx, d, { f: 400, rate: 30, env: (u) => 0.3 + 0.7 * u * u, bend: (u) => 0.9 + 0.2 * u }), p, { vol: 0.14, pan: -0.2, room: open, wet: 0.3 });
    over(esRoll(fx, d, { v: (u) => 0.3 + 0.7 * u, lp: 420 }), p, { vol: 0.14 }); }
  // …the last 3 metres: only a thin skid, so the blast has silence to land in
  { const p = sh('impact'), d = tW - p.t0; if (d > 0.1) K.put(esScreech(fx, d, { f: 700, rate: 40, env: (u) => 0.6 * (1 - u) + 0.1 }), p.t0, { vol: 0.05, norm: true, pan: -0.2, stop: tW, fade: 0.004 }); }
  // ★ the first wagon meets the rock: the biggest blast of the film, and its fireball opening
  K.put(esBoom(fx, { len: 9, f0: 84, f1: 20, bright: 4200, tau: 2.2 }), tW, { vol: 0.75, norm: true, room: big, wet: 0.4 });
  putS(crash(52, 3.2), tW + 0.004, { vol: 0.34, rate: 0.4, keep: true, pan: 0.15, room: big, wet: 0.4 });
  for (let i = 0; i < 6; i++) putS(clank(r.range(160, 480), r.range(0.9, 1.6)), tW + r.range(0.25, 1.9), { vol: r.range(0.06, 0.1), pan: r.range(-0.6, 0.6), room: big, wet: 0.4 });   // plate, raining
  { const p = sh('impact'), d = p.t1 - tW; K.put(burst(d, [140, 420, 620, 520, 460], 0.5, (u) => Math.min(1, u * 9) * (0.55 + 0.45 * Math.exp(-u * 3)), 'brown'), tW + 0.02, { vol: 0.3, norm: true, room: big, wet: 0.3, stop: p.t1 + 0.03, fade: 0.05 }); }
  // the other five, each at its moment: at the hill they are blasts; from the harbour, thuds far behind you
  for (let k = 1; k < ES_F.wagons.n; k++) {
    const t = F(P.wagonHit(k)), m = esShotAt(t).mode, near = whereAt(t) !== 'hill' ? 0.22 : m === 'over' ? 0.55 : 1, pan = k % 2 ? -0.3 : 0.3;
    K.put(esBoom(fx, { len: 6, f0: 70 + 4 * k, f1: 22, bright: near < 0.5 ? 700 : 3400, crack: near < 0.5 ? 0 : 0.6 }), t, { vol: 0.5 * near, norm: true, pan, room: near < 0.5 ? far : big, wet: near < 0.5 ? 0.6 : 0.4 });
    if (near === 1) putS(crash(48 + 5 * k, 2.6), t + 0.004, { vol: 0.24, rate: 0.4, keep: true, pan, room: big, wet: 0.4 });
    if (near === 1) for (let i = 0; i < 4; i++) putS(clank(r.range(180, 520), r.range(0.8, 1.4)), t + r.range(0.3, 1.8), { vol: r.range(0.05, 0.09), pan: r.range(-0.6, 0.6), room: big, wet: 0.4 });
  }
  // the air against the hill (1.3 times the speed of sound): a howl; fuel flaring in it
  for (const m of ['impact2', 'wind', 'heat', 'over']) { const p = sh(m), d = len(p), near = m === 'over' ? 0.5 : 1;
    over(burst(d, wander(12, 420, 760), 5, () => 1), p, { vol: 0.07 * near, pan: -0.2, room: open, wet: 0.4 });
    over(burst(d, wander(9, 900, 1500), 7, () => 1), p, { vol: 0.03 * near, pan: 0.3, room: open, wet: 0.4 });
    for (let t = p.t0 + r.range(0.9, 1.6); t < p.t1 - 1.2; t += r.range(1.9, 3.2)) K.put(esBoom(fx, { len: 3, f0: r.range(52, 70), f1: 26, bright: 1500, crack: 0.3 }), t, { vol: r.range(0.14, 0.22) * near, norm: true, pan: r.range(-0.5, 0.5), room: big, wet: 0.4, stop: p.t1 + 0.03, fade: 0.05 }); }

  // ================================================================== the sea
  // from the platform: the surge, growing as you look up it
  { const p = sh('quay'), d = len(p);
    over(burst(d, [90, 150, 260, 340, 380], 0.5, (u) => 0.4 + 0.6 * u, 'brown'), p, { vol: 0.26, room: big, wet: 0.35 });
    over(burst(d, [500, 900, 1600, 2200], 0.5, (u) => 0.3 + 0.7 * u), p, { vol: 0.09, pan: -0.2, room: open, wet: 0.3 });
    K.put(esBoom(fx, { len: 4, f0: 54, f1: 24, bright: 1400, crack: 0, noise: 1.3 }), p.t0 + 0.05, { vol: 0.3, norm: true, room: big, wet: 0.4, stop: p.t1 + 0.03, fade: 0.05 }); }
  // along its foot: the quay cracking under it
  { const p = sh('foot'), d = len(p);
    over(burst(d, [80, 120, 170, 210], 0.6, (u) => 0.5 + 0.5 * u, 'brown'), p, { vol: 0.22, room: big, wet: 0.35 });
    over(burst(d, [400, 800, 1500, 2400], 0.5, (u) => 0.3 + 0.7 * u * u), p, { vol: 0.1, pan: 0.2, room: open, wet: 0.3 });
    for (let t = p.t0 + 0.4; t < p.t1 - 1.2; t += r.range(1.0, 1.9)) putS(esCrack(fx, { len: 1.4, s: r.range(0.4, 0.7) }), t, { vol: r.range(0.12, 0.2), pan: r.range(-0.5, 0.5), room: big, wet: 0.4 });
    for (const dt of [0.9, 3.7]) K.put(esBoom(fx, { len: 4, f0: 54, f1: 24, bright: 1400, crack: 0, noise: 1.3 }), p.t0 + dt, { vol: 0.26, norm: true, pan: r.range(-0.4, 0.4), room: big, wet: 0.4, stop: p.t1 + 0.03, fade: 0.05 }); }
  // the ferry: its last 6 metres, then the quay
  { const p = sh('ferry'), d = tF - p.t0; if (d > 0.1) K.put(burst(d, [200, 380, 640], 0.8, (u) => u * u), p.t0, { vol: 0.15, norm: true, pan: -0.3, stop: tF + 0.01, fade: 0.01 });
    K.put(esBoom(fx, { len: 6, f0: 66, f1: 21, bright: 2600 }), tF, { vol: 0.5, norm: true, pan: -0.1, room: big, wet: 0.4 });
    putS(crash(42, 3.4), tF + 0.004, { vol: 0.4, rate: 0.36, keep: true, pan: -0.1, room: big, wet: 0.45 });
    putS(groan(2.2, 34, { rate: [5, 12] }), tF + 0.5, { vol: 0.24, rate: 0.5, pan: 0.1, room: big, wet: 0.45 }); }
  { const p = sh('up'), d = len(p);
    over(burst(d, [260, 500, 900, 1500, 2100], 0.5, (u) => 0.35 + 0.65 * u), p, { vol: 0.2, pan: -0.1, room: open, wet: 0.3 });
    over(burst(d, [70, 100, 150, 190], 0.6, (u) => 0.5 + 0.5 * u, 'brown'), p, { vol: 0.2, room: big, wet: 0.35 }); }

  // ================================================================== still in the air: the station's roof, the woman from the footbridge
  for (const m of ['roof']) { const p = sh(m), d = len(p);
    over(fx.creak(d, fx.panelModes(2.5).map(([f, tau, a]) => [f * 0.5, tau, a]), { rate: [3, 9], jit: 0.6, wrate: 0.4, env: (u) => Math.min(1, u * 12, (1 - u) * 12) }), p, { vol: 0.09, pan: -0.15, room: open, wet: 0.4 });
    for (let t = p.t0 + 0.6; t < p.t1 - 1; t += r.range(1.1, 1.9)) K.put(burst(0.7, [240, 140, 110], 0.8, (u) => Math.pow(Math.sin(Math.PI * u), 1.5), 'brown'), t, { vol: r.range(0.05, 0.08), norm: true, pan: r.range(-0.4, 0.4), room: open, wet: 0.3 }); }
  { const p = sh('woman'); over(fx.rustle(len(p), { density: 40, rub: 0.6, lo: 220, hi: 1600, grain: 0.06, env: () => 1 }), p, { vol: 0.045, pan: 0.1, room: open, wet: 0.3 }); }

  // ================================================================== 10 kilometres up: the seat-belt chime
  { const p = sh('sky'), ding = (f) => { const y = fx.arr(1.5); for (let i = 0; i < y.length; i++) { const t = i / sr; y[i] = (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(4 * Math.PI * f * t)) * Math.exp(-t / 0.38) * Math.min(1, t / 0.004); } return y; };
    K.put(ding(1046.5), p.t0 + 0.9, { vol: 0.045, norm: true, pan: -0.2, room, wet: 0.6 }); K.put(ding(830.6), p.t0 + 1.5, { vol: 0.045, norm: true, pan: -0.2, room, wet: 0.6 }); }

  // ================================================================== the count: the skid climbing, cut dead at 5:42:01.000
  { const a = sh('count').t0, d = tb - a;
    K.put(esScreech(fx, d, { f: 470, rate: 36, env: (u) => 0.25 + 0.75 * u * u, bend: (u) => 0.9 + 0.5 * u * u }), a, { vol: 0.2, norm: true, pan: 0.1, fadeIn: 0.04, stop: tb, fade: 0.004 });
    K.put(esRoll(fx, d, { v: (u) => 0.4 + 0.6 * u, lp: 520 }), a, { vol: 0.14, norm: true, fadeIn: 0.04, stop: tb, fade: 0.004 });
    K.put(esCrackle(fx, d, { rate: 160, hp: 1800, env: (u) => 0.3 + 0.7 * u }), a, { vol: 0.05, norm: true, pan: -0.2, stop: tb, fade: 0.004 });
    // the last 0.025 s go by in a rush: the air tearing past, rising, cut with everything else
    K.put(burst(1.3, [180, 320, 700, 1500, 2600], 0.6, (u) => u * u * u), tb - 1.3, { vol: 0.34, norm: true, stop: tb, fade: 0.004 });
    // the wheels grip: one hard, dry knock, and nothing after it
    K.put(fx.hit(fx.metalModes(86, 0.5), { width: 0.003, amp: 1, noise: 0.5, nlen: 0.02, nhp: 300, len: 0.5 }), tb, { vol: 0.3, norm: true }); }
  // hot steel ticking in the stillness
  for (let t = tb + 1.6; t < B('twist') - 0.5; t += r.range(0.9, 2.3)) K.put(fx.hit(fx.metalModes(r.range(1900, 3200), 0.35), { width: 0.0003, amp: 1, len: 0.4 }), t, { vol: r.range(0.015, 0.03), norm: true, pan: r.range(-0.5, 0.5), room: open, wet: 0.5 });

  // ================================================================== the twist: everything the ground stopped, coming back west
  { const a = B('twist') - 0.2, d = END - a + 0.05, n = Math.ceil(d * sr), k = (u) => 0.06 + 0.94 * Math.pow(u, 2.2);
    const mk = (col) => { const y = esNoise(fx, n, col); for (let i = 0; i < n; i++) y[i] *= k(i / n); return y; };
    K.put(esSweep(mk('brown'), sr, 'lp', 0.7, [160, 220, 320, 520, 900, 1700, 3200]), a, { vol: 0.5, norm: true, room: big, wet: 0.3, fadeIn: 0.5, stop: END + 0.01, fade: 0.006 });
    K.putLR(esSweep(mk('pink'), sr, 'bp', 0.5, [500, 700, 1000, 1500, 2200, 3000]), esSweep(mk('pink'), sr, 'bp', 0.5, [500, 700, 1000, 1500, 2200, 3000]), a, { vol: 0.14, norm: true, fadeIn: 0.5, stop: END + 0.01, fade: 0.006 }); }
  // ★ it arrives: one blast, and then nothing
  K.put(esBoom(fx, { len: 3.6, f0: 96, f1: 19, bright: 5200, tau: 0.8 }), END, { vol: 0.85, norm: true, room: big, wet: 0.4 });
  // your carriage's windows start to rattle
  { const p = sh('question'), d = END - p.t0 + 0.05, y = fx.arr(d), modes = fx.glassModes();
    for (let t = 0.1; t < d - 0.08;) { const u = t / d; ESX.strike(y, Math.round(t * sr), Math.round(0.0006 * sr), 0.3 + 0.7 * u, modes, sr); t += r.range(0.8, 1.2) / (14 + 22 * u); }
    K.put(y, p.t0, { vol: 0.12, norm: true, pan: 0.3, room, wet: 0.5 }); }
});
