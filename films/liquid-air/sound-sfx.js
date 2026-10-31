/* =====================================================================
   SOUND · EFFECTS — the events, each at its story second (the clock only runs forward, so each is heard once):
     the first drops in your room; the cars lifting off; your first breath of it (the last of your air bubbling out),
     the girl's; a car going down; THE CRASH (3:10:00–3:10:10: a roar out of a black sky, muffled under the surface,
     ending in one deep slam, then silence); the church bell, struck in a vacuum and heard only through the stone; the
     4:00 fizz (a liquid turning back into gas everywhere at once) and everyone breathing out streams of bubbles.
   ===================================================================== */

laSound('sfx', 'events', function (ctx, bus, K) {
  const { fx, sr } = K, f = laFilmAt, sh = (m) => LA_SHOTS.find((s) => s.mode === m), at = { in: laAt('in'), out: laAt('out'), under: laAt('under') };
  const room = K.verb('room', 0.5, { bright: 0.6, damp: 3.5, wet: 0.25 });
  // ---- drops landing in your room: plinks on the table, the sill, the floor (more every second; only in its shots)
  for (const p of laPlaces().filter((q) => q.where === 'in')) {
    for (let t = Math.max(p.t0, 0.2); t < p.t1; ) {
      const s = laStoryAt(t), rate = MathX.clamp(3 + s * 0.6, 3, 40);
      K.put(laPlink(fx, { f: fx.r.range(1500, 4800) }), t, { vol: 0.05 + 0.08 * fx.r.next(), pan: fx.r.range(-0.7, 0.7), room, wet: 0.5, hp: 600 });
      t += -Math.log(1 - fx.r.next() * 0.98) / rate;
    }
  }
  // ---- the cars lifting off (a hollow knock as each one lets go of the road, a slosh) in the cars shot
  { const S = sh('cars'); for (const id in LA_CARFLOAT) { const t = f(LA_CARFLOAT[id].lift); if (t > S.t0 && t < S.t1) { K.put(fx.hit(fx.panelModes(0.8), { width: 0.004, amp: 0.8, noise: 0.3, nlen: 0.05, nhp: 200, len: 1.2 }), t, { vol: 0.5, lp: 900, pan: 0.3 }); K.put(fx.liquid(1.6, (x) => Math.sin(Math.PI * x / 1.6)), t + 0.05, { vol: 0.35, pan: 0.2 }); } } }
  // ---- your first breath of it: the last of your air bubbling out (a stream, then a few), and the liquid going in
  { const t = sh('breathe').t0 + 0.15, [L, R] = laBubbleSnd(fx, 3.5, { rate: 160, env: (u) => Math.max(0, 1 - u * 1.2), f0: 250, f1: 900 }); K.putLR(L, R, t, { vol: 0.75 });
    K.put(fx.liquid(2.4, (x) => Math.sin(Math.PI * Math.min(1, x / 1.7))), c0('breathe', 1) - 1.0, { vol: 0.4, lp: 700 }); }
  // ---- the girl's breath out
  { const t = f(LA.kidBreath), [L, R] = laBubbleSnd(fx, 3.0, { rate: 120, env: (u) => Math.max(0, 1 - u), f0: 400, f1: 1500 }); K.putLR(L, R, t, { vol: 0.55 }); }
  // ---- a car going down: the groan of its body as it fills, a soft thud on the road
  { const S = sh('sink'); K.put(fx.creak(S.t1 - S.t0, fx.metalModes(140, 2), { rate: [8, 22], jit: 0.4, env: (u) => Math.sin(Math.PI * u) }), S.t0 + 0.2, { vol: 0.35, lp: 700 }); }
  // ---- THE CRASH: a roar that builds out of a black sky (muffled: we hear it from under the surface), the last 7 m in
  //      four seconds, one deep slam at 3:10:10, then nothing
  { const t0 = f(599.6), t1 = f(610.3), d = t1 - t0, n = Math.ceil((d + 1.5) * sr);
    const roar = laNoise(fx, n, 'brown'), hiss = laNoise(fx, n, 'pink');
    for (let i = 0; i < n; i++) { const tt = i / sr, s = laStoryAt(t0 + tt), e = s < 610.2 ? (0.35 + 0.65 * laEv(s, 599.6, 607.5)) * Math.min(1, tt / 0.3) : Math.exp(-(s - 610.2) / 0.25); roar[i] *= e; hiss[i] *= e * (0.6 + 0.4 * laEv(s, 605, 609)); }
    LAX.bq(roar, 'lp', 260, 0.7, sr); laSweepPut(K, hiss, t0, 'lowpass', 0.7, [500, 700, 1100, 1600, 1200], { vol: 0.75 });
    K.put(roar, t0, { vol: 1.0, norm: true });
    // the slam (the last of it landing), then silence
    K.put(fx.hit([[38, 1.2, 1], [55, 0.8, 0.6], [80, 0.5, 0.4], [130, 0.3, 0.25]], { width: 0.02, amp: 1, noise: 0.5, nlen: 0.25, nhp: 60, len: 3.5 }), f(610.2), { vol: 1.0, lp: 600 }); }
  // ---- the church bell at 3:30:00, 3:30:03, 3:30:06: struck in a vacuum (no sound up there); under the surface, it
  //      comes through the tower's stone and the liquid: low, dull, long
  { const S = sh('bell2'), stone = (t, v) => { const y = fx.bellBuf(laMidi('D3')); const z = Float32Array.from(y); LAX.bq(z, 'lp', 520, 0.7, sr); K.put(z, t, { vol: v, room: K.verb('deep', 4.5, { bright: 0.2, damp: 2.5, wet: 0.5 }), wet: 0.6 }); };
    for (const s of [1800, 1803, 1806, 1809]) { const t = f(s); if (t >= S.t0 - 0.05 && t < S.t1) stone(t, 0.55); }
    // (the strike that landed while we were up in the vacuum: its long hum, joined from the cut)
    const tail = f(1800); if (tail < S.t0) { const y = fx.bellBuf(laMidi('D3')), i0 = Math.round((S.t0 - tail) * sr), z = Float32Array.from(y.subarray(Math.min(i0, y.length - 1))); LAX.bq(z, 'lp', 520, 0.7, sr); K.put(z, S.t0, { vol: 0.4 }); } }
  // ---- 4:00: the fizz (every litre of it giving up 1.2 litres of gas a second), and everyone breathing out bubbles
  { const t0 = LA.tBack - 0.2, d = LA.end - t0 + 1.0;
    const cr = laCrackle(fx, d, { rate: 9000, env: (u) => Math.min(1, u * d / 2.5), hp: 900 }); K.put(cr, t0, { vol: 0.8, norm: true });
    const [L, R] = laBubbleSnd(fx, d, { rate: 420, env: (u) => Math.min(1, 0.2 + u * d / 2), f0: 200, f1: 1100 }); K.putLR(L, R, t0 + 0.3, { vol: 0.8 });
    laBed(K, t0, LA.end + 0.5, { colour: 'pink', f: [['bp', 900, 0.5]], vol: 0.6, am: 0.4, wr: 4, env: (u) => Math.min(1, u * 3) }); }
  void at;
});
const c0 = (id, k) => laC(id, k);
