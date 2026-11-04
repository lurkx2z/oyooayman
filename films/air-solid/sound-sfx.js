/* =====================================================================
   SOUND · EFFECTS — the events, each at its story second (the clock only runs forward, so each is heard once; an
   event the clock skips over is not heard). In slow motion an event's sound is stretched and pitched down with it.
     the glass slips (a squeak), rises, smashes on the ceiling, its water splashing; the spoon and the grape land
     together (one tink, one tap); the tea pours up and drums on the ceiling, then drips; the cat's paws on the
     counter, the ceiling, its two tries; the keys, the coffee, the phone (its ringtone going away up); leaves letting
     go; the carp's splash, the kick, the old man's steps; her run, the silence when she leaves the ground, the branch
     taking her weight and creaking while she holds on; the coat; the dog's tags; pigeons' wings; planes far off; your
     clock; ten ticks; 3:10: everything on your ceiling landing on your table at once; her drop to the path
   ===================================================================== */

saSound('sfx', 'events', function (ctx, bus, K) {
  const { fx, sr } = K, f = saFilmAt, CEIL = SAP.ceil, sh = (m) => { const S = saShot(m); return { t0: S.t0, t1: Math.min(S.t1, SA.end + 0.3), mode: m }; };   // (the last shot runs on: clip it)
  const inShot = (t, m) => { const S = sh(m); return t >= S.t0 - 0.02 && t < S.t1; };
  const room = K.verb('room', 0.5, { bright: 0.6, damp: 3.5, wet: 0.25 }), street = K.verb('street', 1.6, { bright: 0.5, damp: 2.2, wet: 0.3 });
  const slow = (t) => 1 / Math.max(0.25, saRateAt(t + 1e-3));                 // how much slow motion stretches a sound
  const sm = (modes, k) => modes.map(([fr, tau, a]) => [fr / Math.sqrt(k), tau * Math.sqrt(k), a]);   // ... and pitches it down
  const whoosh = (t, d, o = {}) => { const n = Math.ceil(d * sr), w = saNoise(fx, n, 'pink'); for (let i = 0; i < n; i++) { const u = i / n; w[i] *= Math.sin(Math.PI * Math.pow(u, o.skew || 0.5)) ** 2; }
    saSweepPut(K, w, t, 'bandpass', o.q || 1.1, o.curve || [500, 1400, 2600], { vol: o.vol || 0.12, pan: o.pan || 0 }); };

  // ---- the glass: a squeak as it slips, a rising air, the smash on the ceiling (slow motion), the water, the shards
  { const tGo = f(0), hit = saHop(0, SA_HELD.glass[1], CEIL - 0.06).hit, tH = f(hit), k = slow(tH);
    K.put(fx.creak(0.18, sm(fx.glassModes(), 1.3), { rate: [60, 140] }), f(-0.12), { vol: 0.12, room, wet: 0.3, pan: 0.2 });
    whoosh(tGo, tH - tGo, { vol: 0.1, curve: [300, 700, 1500], skew: 0.8, pan: 0.2 });
    const S = fx.smash({ g: 9.81, v: 4.2, slow: k, pitch: 1.25 / Math.sqrt(k), pan: 0.15 }); K.putLR(S.L, S.R, tH, { vol: 0.55, room, wet: 0.4 });
    K.put(fx.liquid(1.2 * k, (t) => Math.exp(-t / (0.25 * k)) * Math.min(1, t / 0.01), { f: 700 / Math.sqrt(k) }), tH + 0.01, { vol: 0.3, norm: true, room, wet: 0.35, pan: 0.15 });
    for (let i = 0; i < 9; i++) K.put(fx.hit(sm(fx.glassModes(), k * (0.8 + 0.4 * fx.r.next())), { width: 0.0003, amp: 0.3, noise: 0.2, nlen: 0.002, len: 0.5 }), tH + (0.08 + 0.5 * fx.r.next()) * k, { vol: 0.05, pan: fx.r.range(-0.5, 0.6), room, wet: 0.4 }); }
  // ---- the spoon and the grape, let go together, land together: one tink, one soft tap
  { const tGo = f(SA.sSG), hit = saHop(SA.sSG, SA_HELD.grape[1], CEIL - 0.006).hit, tH = f(hit), k = slow(tH);
    whoosh(tGo, tH - tGo, { vol: 0.05, curve: [600, 1200, 2400], skew: 0.85 });
    K.put(fx.hit(sm(fx.metalModes(2900, 0.5), k), { width: 0.0003, amp: 0.8, noise: 0.2, nlen: 0.003, len: 1.2 * k }), tH, { vol: 0.32, room, wet: 0.4, pan: -0.2 });
    K.put(fx.slap(sm([[180, 0.03, 1], [420, 0.015, 0.4]], k), { width: 0.004, amp: 0.6, skin: 0.25, len: 0.4 * k }), tH + 0.005, { vol: 0.25, room, wet: 0.3, pan: 0.2 }); }
  // ---- the kettle: the lift, the pour (a stream going up), the tea drumming on the ceiling, then drips
  { const [p0, p1] = SA.sPour, t0 = f(p0), t1 = f(p1);
    K.put(fx.hit(fx.metalModes(420, 0.6), { width: 0.002, amp: 0.6, noise: 0.3, nlen: 0.01, nhp: 400, len: 0.6 }), t0 - 1.0, { vol: 0.12, room, wet: 0.3, pan: -0.3 });
    K.put(fx.liquid(t1 - t0 + 0.3, (t) => Math.min(1, t / 0.15) * Math.min(1, (t1 - t0 + 0.3 - t) / 0.3), { f: 620 }), t0, { vol: 0.32, norm: true, room, wet: 0.3, pan: -0.3 });
    saBed(K, t0 + 0.25, t1 + 0.35, { colour: 'pink', f: [['bp', 1500, 0.9], ['lp', 5000]], vol: 0.22, am: 0.4, wr: 7, room, wet: 0.35, fi: 0.15, fo: 0.25 });
    for (let t = t1 + 0.4, i = 0; t < sh('puddle').t1; t += 0.35 + 0.9 * fx.r.next(), i++) { const L = new Float32Array(Math.ceil(0.12 * sr)), R = new Float32Array(L.length); fx.bubble(L, R, 0, fx.r.range(900, 1600), 0.01, 0.6, 0); for (let j = 0; j < L.length; j++) L[j] += R[j]; K.put(L, t, { vol: 0.08, room, wet: 0.5, pan: -0.3 }); } }
  // ---- the cat: off the counter (claws), the slow-motion flight, onto the ceiling on its feet; its two tries
  { const tGo = f(SA.sCat), tL = f(SA.sCat + SA_CAT_LAND), k = slow(tL);
    K.put(fx.rustle(0.12, { density: 600, rub: 0.15, lo: 2000, hi: 8000, grain: 0.004 }), tGo - 0.05, { vol: 0.1, room, wet: 0.3, pan: -0.3 });
    whoosh(tGo, tL - tGo, { vol: 0.05, curve: [400, 900, 1600] });
    K.put(fx.slap(sm([[95, 0.05, 1], [210, 0.03, 0.5]], k), { width: 0.008, amp: 0.8, skin: 0.15, len: 0.5 * k }), tL, { vol: 0.35, room, wet: 0.35, pan: -0.2 });
    K.put(fx.rustle(0.3 * k, { density: 400, rub: 0.2, lo: 1500, hi: 6000, grain: 0.004, env: (u) => Math.exp(-u * 3) }), tL + 0.02, { vol: 0.08, room, wet: 0.3, pan: -0.2 });
    for (const s of SA.sCatHop) { const t = f(s); if (!inShot(t, 'stuck')) continue; K.put(fx.slap([[110, 0.04, 1], [240, 0.02, 0.4]], { width: 0.006, amp: 0.5, skin: 0.1 }), t, { vol: 0.15, room, wet: 0.35 });
      const tb = f(s + 2 * 2.4 / 9.81); K.put(fx.slap([[100, 0.05, 1], [230, 0.025, 0.5]], { width: 0.007, amp: 0.7, skin: 0.12 }), tb, { vol: 0.25, room, wet: 0.35 }); } }
  // ---- the tap: each drop ticks into the cupboard over it (only heard while we're looking)
  { const S = sh('tap'), tr = Math.sqrt(2 * (SA_TAP_TOP - SA_TAP[1]) / SAP.g);
    for (let i = Math.floor(saStoryAt(S.t0) / SA_TAP_P) - 1; ; i++) { const t = f(i * SA_TAP_P + 0.8 * SA_TAP_P + tr); if (t > S.t1) break; if (t < S.t0) continue;
      const L = new Float32Array(Math.ceil(0.1 * sr)), R = new Float32Array(L.length); fx.bubble(L, R, 0, fx.r.range(1700, 2600), 0.006, 0.7, 0); for (let j = 0; j < L.length; j++) L[j] += R[j]; K.put(L, t, { vol: 0.1, room, wet: 0.4, pan: -0.35 }); } }
  // ---- the apple: the casement, the apple leaving your hand
  { const tA = f(SA.sApple); whoosh(tA, 0.9, { vol: 0.06, curve: [500, 1100, 2200], pan: 0.3 }); }
  // ---- the street: the keys (a jingle going away up), the coffee (a slosh), the phone (its ringtone, going away up)
  { const away = (t, d) => (u) => Math.min(1, u * d / 0.01) * Math.exp(-u * 3.2);
    { const t = f(SA.sKeys); for (let i = 0; i < 10; i++) K.put(fx.hit(fx.metalModes(fx.r.range(2400, 4200), 0.3), { width: 0.0002, amp: 0.5, len: 0.4 }), t + i * 0.06 + 0.03 * fx.r.next(), { vol: 0.09 * Math.exp(-i / 4), room: street, wet: 0.3, pan: -0.5, lp: 7000 - 500 * i }); }
    { const t = f(SA.sCoffee); K.put(fx.liquid(0.7, (x) => Math.min(1, x / 0.02) * Math.exp(-x / 0.25), { f: 480 }), t, { vol: 0.16, norm: true, room: street, wet: 0.3, pan: 0 }); }
    { const t = f(SA.sPhone), d = 3.2, n = Math.ceil(d * sr), y = new Float32Array(n), notes = [1318.5, 1568, 1975.5, 1568], e = away(t, d);
      for (let i = 0; i < n; i++) { const tt = i / sr, k = Math.floor(tt / 0.16), fr = notes[k % 4], ph = (tt % 0.16) / 0.16; y[i] = Math.sin(2 * Math.PI * fr * tt) * Math.exp(-ph * 4) * (k % 8 < 4 ? 1 : 0) * e(tt / d); }
      K.put(y, t + 0.1, { vol: 0.08, room: street, wet: 0.35, pan: 0.5 }); }
    for (const [per, v, pan, ph] of [[0.55, 0.07, -0.4, 0.1], [0.6, 0.05, 0.4, 0.3]]) for (let t = sh('street').t0 + ph; t < f(SA.sKeys) - 0.2; t += per) K.put(fx.step({ weight: 0.5 }), t, { vol: v, pan, room: street, wet: 0.3 }); }
  // ---- the park: leaves letting go (little rustles), the carp's splash, the kick, the scoop
  { const S = sh('leaves'); for (let t = S.t0 + 0.2; t < S.t1; t += 0.12 + 0.3 * fx.r.next()) K.put(fx.rustle(0.18, { density: 300, rub: 0.1, lo: 1800, hi: 7000, grain: 0.003, env: (u) => Math.exp(-u * 3) }), t, { vol: 0.03 + 0.03 * fx.r.next(), pan: fx.r.range(-0.8, 0.8), room: street, wet: 0.3 }); }
  { const t = f(SA.sFish); K.put(fx.liquid(0.9, (x) => Math.min(1, x / 0.005) * Math.exp(-x / 0.18), { f: 400 }), t, { vol: 0.32, norm: true, room: street, wet: 0.35, pan: -0.2 });
    const n = Math.ceil(0.4 * sr), w = fx.white(n); for (let i = 0; i < n; i++) w[i] *= Math.exp(-i / (0.06 * sr)); SAX.bq(w, 'hp', 1200, 0.7, sr); K.put(w, t, { vol: 0.12, room: street, wet: 0.3, pan: -0.2 }); }
  { const t = f(SA.sKick); K.put(fx.hit([[110, 0.04, 1], [230, 0.025, 0.6], [520, 0.012, 0.3]], { width: 0.004, amp: 1, noise: 0.4, nlen: 0.01, nhp: 400, len: 0.4 }), t, { vol: 0.35, room: street, wet: 0.3, pan: 0.2 }); }
  { const t = f(SA.sScoop); K.put(fx.slap([[260, 0.02, 1], [600, 0.01, 0.4]], { width: 0.006, amp: 0.4, skin: 0.3 }), t, { vol: 0.08, room: street, wet: 0.3, pan: 0.3 }); }
  // ---- the old man's steps (slow, careful), and later hers (running, quicker), then nothing: she has left the ground
  { const S = sh('walk'); for (let t = S.t0 + 0.3, i = 0; t < S.t1; t += 0.95, i++) K.put(fx.step({ weight: 0.55, scuff: 0.25 }), t, { vol: 0.13, pan: i % 2 ? 0.15 : -0.15, room: street, wet: 0.25 }); }
  { const t0 = f(SA.sRun), tL = f(SA.sLift); for (let k = 0; k < 12; k++) { const s = SA.sRun + Math.sqrt(2 * (0.75 + k * 0.75) / SA_RUN.acc) - 0.4, t = f(s); if (t > tL - 0.05) break; if (t > t0) K.put(fx.step({ weight: 0.7, s: 1.2 }), t, { vol: 0.2, pan: 0.1, room: street, wet: 0.25 }); }
    whoosh(tL, f(SA.sLift + 0.47) - tL, { vol: 0.07, curve: [300, 800, 1600], skew: 0.8 }); }
  // the branch takes her weight: a hand on wood, the leaves shaking, the wood creaking; it creaks now and then while she holds on
  { const tG = f(SA.sLift + 0.47), k = slow(tG), wood = [[150, 0.05, 1], [340, 0.03, 0.6], [720, 0.015, 0.3]];
    K.put(fx.slap(sm(wood, k), { width: 0.004, amp: 0.9, skin: 0.5, len: 0.5 * k }), tG, { vol: 0.35, room: street, wet: 0.3 });
    K.put(fx.rustle(1.4, { density: 500, rub: 0.3, lo: 900, hi: 5500, grain: 0.006, env: (u) => Math.exp(-u * 2.5) }), tG, { vol: 0.14, room: street, wet: 0.35 });
    K.put(fx.creak(1.2, [[140, 0.03, 1], [310, 0.02, 0.6], [650, 0.01, 0.3]], { rate: [12, 35], env: (u) => Math.exp(-u * 2) }), tG + 0.1, { vol: 0.12, room: street, wet: 0.35 });
    for (const m of ['hold', 'rope', 'hold2', 'count']) { const S = sh(m); for (let t = S.t0 + 1.5 + 2 * fx.r.next(); t < S.t1 - 1; t += 3 + 3 * fx.r.next()) K.put(fx.creak(0.8, [[130, 0.03, 1], [300, 0.02, 0.5]], { rate: [10, 28] }), t, { vol: 0.07, room: street, wet: 0.4, pan: fx.r.range(-0.3, 0.3) }); } }
  // ---- the coat: thrown (a whoosh of cloth), past her in slow motion
  { const t = f(SA.sCoat); K.put(fx.rustle(0.35, { density: 200, rub: 0.5, lo: 300, hi: 3000, grain: 0.01 }), t - 0.25, { vol: 0.12, room: street, wet: 0.3 });
    const k = slow(t + 0.5), d = 2.2; K.put(fx.rustle(d, { density: 160 / k, rub: 0.6, lo: 220 / Math.sqrt(k), hi: 2400 / Math.sqrt(k), grain: 0.012 * k, env: (u) => Math.sin(Math.PI * u) ** 2 }), t, { vol: 0.16, room: street, wet: 0.3 }); }
  // ---- the dog: the jump (claws on the path), its tags jingling as it floats, the lead taking its weight
  { const t = f(SA.sDog); K.put(fx.rustle(0.15, { density: 700, rub: 0.1, lo: 1500, hi: 7000, grain: 0.003 }), t, { vol: 0.08, room: street, wet: 0.3 });
    K.put(fx.creak(0.5, [[200, 0.02, 1], [520, 0.01, 0.4]], { rate: [30, 60] }), t + 0.9, { vol: 0.1, room: street, wet: 0.3 });
    for (let tt = t + 1.0; tt < sh('dog').t1; tt += 0.25 + 0.5 * fx.r.next()) K.put(fx.hit(fx.metalModes(fx.r.range(3000, 4200), 0.25), { width: 0.0002, amp: 0.4, len: 0.3 }), tt, { vol: 0.04, room: street, wet: 0.3, pan: -0.1 }); }
  // ---- pigeons: wings (flaps), a coo or two
  { const S = sh('pigeons'); for (let t = S.t0 + 0.4; t < S.t1; t += 0.9 + 1.4 * fx.r.next()) for (let j = 0; j < 4; j++) K.put(fx.rustle(0.07, { density: 400, rub: 0.4, lo: 400, hi: 3500, grain: 0.006 }), t + j * 0.09, { vol: 0.07, pan: fx.r.range(-0.6, 0.6), room: street, wet: 0.3 });
    for (const dt of [1.2, 4.1]) saTone(K, S.t0 + dt, 0.9, (x) => 330 + 60 * Math.sin(Math.PI * x / 0.9) - 40 * (x > 0.5 ? 1 : 0), [[1, 1], [2, 0.25]], (u) => Math.sin(Math.PI * u) * (0.7 + 0.3 * Math.sin(u * 40)), { vol: 0.03, pan: -0.3, f: [['lp', 900]] }); }
  // ---- planes, far off, being turned away
  { const S = sh('planes'); saBed(K, S.t0, S.t1 + 0.3, { colour: 'brown', f: [['lp', 520], ['hp', 60]], vol: 0.18, am: 0.2, wr: 0.2, env: (u) => Math.sin(Math.PI * Math.min(1, u * 1.1)) }); }
  // ---- your wall clock, at real speed, while we're home at 3:08
  { const S = sh('home'); for (let t = S.t0; t < S.t1; ) { const s = saStoryAt(t), nx = Math.floor(s) + 1, tt = t + (nx - s) / saRateAt(t + 1e-3); if (tt >= S.t1) break;
      K.put(fx.hit(fx.woodModes(2600, 0.5), { width: 0.0008, amp: 0.6, noise: 0.4, nlen: 0.004, nhp: 2000, len: 0.08 }), tt, { vol: 0.09, pan: 0.5, room, wet: 0.4 }); t = tt + 1e-3; } }
  // ---- the last ten seconds: a tick each second
  for (let k = 0; k < 10; k++) { const t = f(SA.sCount + k); if (t > sh('count').t1) break; K.put(fx.hit(fx.woodModes(3000, 0.4), { width: 0.0006, amp: 0.8, noise: 0.5, nlen: 0.003, nhp: 2500, len: 0.1 }), t, { vol: 0.18, pan: 0 }); }
  // ---- 3:10, your kitchen: the ceiling comes down onto the table (slow motion: stretched, deeper)
  { const s0 = SAP.T, land = (top, rest) => s0 + Math.sqrt(2 * Math.max(0.05, top - rest) / SAP.g);
    const items = SA_CLUTTER.map(([id, kind, x, z]) => { const b = saDropBounce(CEIL - 0.03, saRestY(x, z), (SA_BOUNCE[kind] || [0])[0]); return { kind, x, z, s: b.land, more: b.hits.slice(1), onT: saRestY(x, z) > 0 }; });
    items.push({ kind: 'glass', x: 0.3, z: 0.2, s: land(CEIL, SA_ROOM.table.top), onT: true }, { kind: 'spoon', x: 0, z: 0.25, s: land(CEIL, SA_ROOM.table.top), onT: true });
    const modes = { plate: fx.cupModes(), bottle: fx.glassModes(), glass: fx.glassModes(), jar: fx.glassModes(), fork: fx.metalModes(1800, 0.5), spoon: fx.metalModes(2600, 0.5), keys: fx.metalModes(3200, 0.3), lid: fx.metalModes(700, 1.2), tin: fx.metalModes(900, 0.5), mug: fx.cupModes() };
    for (const it of items) { const t = f(it.s), k = slow(t), base = modes[it.kind] || fx.woodModes(it.onT ? 160 + 80 * fx.r.next() : 110, 1.2);
      if (it.kind === 'plate' || it.kind === 'glass' || it.kind === 'jar') { const S = fx.smash({ g: 9.81, v: 5.5, slow: k, pitch: (it.kind === 'plate' ? 1 : 1.3) / Math.sqrt(k), pan: MathX.clamp(it.x * 0.5, -0.8, 0.8) }); K.putLR(S.L, S.R, t, { vol: 0.32, room, wet: 0.35 }); continue; }
      K.put(fx.hit(sm(base, k), { width: 0.002, amp: 0.8, noise: 0.4, nlen: 0.02, nhp: 300, len: 1.2 * k }), t, { vol: modes[it.kind] ? 0.14 : 0.2, room, wet: 0.35, pan: MathX.clamp(it.x * 0.5, -0.8, 0.8) });
      (it.more || []).forEach((sb, j) => { const tb = f(sb), kb = slow(tb); K.put(fx.hit(sm(base, kb), { width: 0.0015, amp: 0.5, noise: 0.3, nlen: 0.01, nhp: 400, len: 0.8 * kb }), tb, { vol: (modes[it.kind] ? 0.09 : 0.11) * (j ? 0.45 : 1), room, wet: 0.35, pan: MathX.clamp(it.x * 0.5, -0.8, 0.8) }); }); }
    // the table takes it all: one deep knock under it; the tea and the water rain down
    { const t = f(land(CEIL, SA_ROOM.table.top)), k = slow(t); K.put(fx.hit(sm([[70, 0.12, 1], [140, 0.08, 0.6], [290, 0.04, 0.3]], k), { width: 0.01, amp: 1, noise: 0.5, nlen: 0.05, nhp: 120, len: 2 * k }), t, { vol: 0.6, room, wet: 0.35 });
      saBed(K, f(s0 + 0.05), t + 0.6, { colour: 'pink', f: [['bp', 1400 / Math.sqrt(k), 0.8], ['lp', 5000]], vol: 0.2, am: 0.5, wr: 6, room, wet: 0.35, fi: 0.2, fo: 0.3 }); }
    // the cat: down onto the table, on its feet
    { const t = f(s0 + Math.sqrt(2 * (CEIL - SA_CATP.hc - saRestY(SA_CATP.later[0], SA_CATP.later[1]) - SA_CATP.hc) / SAP.g)); K.put(fx.slap(sm([[90, 0.05, 1], [200, 0.03, 0.5]], slow(t)), { width: 0.008, amp: 0.6, skin: 0.1 }), t, { vol: 0.2, room, wet: 0.3, pan: -0.5 }); } }
  // ---- back in the park: she lets go and drops to the path; the leaves rain down
  { const tD = f(SA_RUN.sDrop + Math.sqrt(2 * 1.45 / SAP.g)); K.put(fx.step({ weight: 1.2, s: 0.9, body: 70 }), tD, { vol: 0.3, room: street, wet: 0.3 }); K.put(fx.step({ weight: 0.9, s: 0.9, body: 72 }), tD + 0.06, { vol: 0.22, room: street, wet: 0.3 });
    for (const m of ['down', 'question']) { const S = sh(m); for (let t = S.t0 + 0.2; t < S.t1; t += 0.1 + 0.25 * fx.r.next()) K.put(fx.rustle(0.2, { density: 250, rub: 0.1, lo: 1800, hi: 7000, grain: 0.003, env: (u) => Math.exp(-u * 3) }), t, { vol: 0.025 + 0.025 * fx.r.next(), pan: fx.r.range(-0.8, 0.8), room: street, wet: 0.3 }); } }
});
