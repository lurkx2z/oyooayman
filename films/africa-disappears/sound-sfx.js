/* =====================================================================
   SOUND · EFFECTS — the events, each on the frame it is seen:
     the vanish (an inward rush, the seam's fizz, a blow felt more than heard), the mine's seam sweeping in, the
     lines of a plant stopping and its lights going out row by row, trade lanes cut, the Suez line snapping, the
     board's flaps, the price labels, the oceans breaking over the rim, the bow slamming into the swell, the forest
     and the waterhole going, the phone that never connects, the boats settling on the mud, the last pull-away.
   ===================================================================== */

// a deep blow, felt as much as heard: a sine that falls in pitch (never below 32 Hz), saturated so its harmonics carry
// on a phone's speaker, with a short 120 Hz body and a thud of low noise
function afBlow(K, t, o = {}) {
  const { fx, sr } = K, d = 1.4, n = Math.ceil(d * sr), y = fx.arr(d), f0 = o.f0 || 48, tau = o.tau || 0.45, drv = 2.2; let ph = 0, pb = 0;
  for (let i = 0; i < n; i++) {
    const tt = i / sr; ph += 2 * Math.PI * Math.max(32, f0 * Math.pow(0.55, tt / 1.2)) / sr; pb += 2 * Math.PI * 120 / sr;
    const v = Math.sin(ph) * Math.exp(-tt / tau) + 0.35 * Math.sin(pb) * Math.exp(-tt / 0.1);
    y[i] = Math.tanh(drv * v) / Math.tanh(drv) * Math.min(1, tt / 0.006);
  }
  const z = afNoise(fx, Math.ceil(0.4 * sr), 'brown'); GBX.bq(z, 'lp', 260, 0.7, sr);
  let pk = 0; for (let i = 0; i < z.length; i++) pk = Math.max(pk, Math.abs(z[i])); for (let i = 0; i < z.length; i++) y[i] += 0.45 * z[i] / Math.max(1e-9, pk) * Math.exp(-i / (0.07 * sr));
  return K.put(y, t, { vol: o.vol || 0.25, norm: true, pan: o.pan || 0 });
}
// the vanish signature: a rush of air pulled inward (rising, then cut), the seam's electric fizz, a deep blow
// (o.rush, o.blow scale those two; a second vanish close after a first keeps only the fizz and a small blow)
function afVanish(K, t, o = {}) {
  const { fx, sr } = K, s = o.size || 1, d = o.d || 1.3, rush = o.rush ?? 1, blow = o.blow ?? 1;
  if (rush > 0) { // the rush: noise through a band that falls as it swells; cut dead at t + d
    const n = Math.ceil(d * sr), y = afNoise(fx, n, 'pink'), curve = new Float32Array(64);
    for (let j = 0; j < 64; j++) curve[j] = 3200 * Math.pow(0.08, j / 63);
    for (let i = 0; i < n; i++) { const u = i / n; y[i] *= Math.pow(u, 1.6) * Math.min(1, (n - i) / (0.012 * sr)); }
    afSweepPut(K, y, t, 'bandpass', 0.9, curve, { vol: 0.2 * s * rush });
  }
  K.put(afCrackle(fx, d * 0.9, { rate: 900, hp: 1800, env: (u) => Math.sin(Math.PI * Math.min(1, u * 1.1)) }), t + 0.1, { vol: 0.07 * s, norm: true, pan: o.pan || 0 });
  afBlow(K, t + d - 0.02, { vol: 0.25 * s * blow });
}
// an elephant's trumpet: a buzzing, jittery pulse (the trunk's lips) and breath, through the trunk's formants
function afTrumpet(fx, d = 0.6) {
  const sr = fx.sr, r = fx.r, n = Math.ceil(d * sr), y = fx.arr(d + 0.05), w = fx.wander(9); let ph = 0;
  for (let i = 0; i < n; i++) {
    const u = i / n, tt = i / sr, f = (360 + 230 * Math.min(1, u / 0.16) - 110 * Math.max(0, u - 0.55)) * (1 + 0.05 * w(tt) + 0.03 * (r.next() - 0.5));
    ph += 2 * Math.PI * f / sr;
    const pulse = 2 * Math.pow(Math.max(0, Math.sin(ph)), 6) - 0.3, nz = r.next() * 2 - 1;
    y[i] = (0.75 * pulse + 0.5 * nz * (0.5 + 0.5 * Math.sin(ph))) * Math.min(1, u * 18) * Math.pow(1 - u, 0.7);
  }
  GBX.bq(y, 'peak', 900, 1.2, sr, 8); GBX.bq(y, 'peak', 2100, 1.5, sr, 6); GBX.bq(y, 'hp', 250, 0.7, sr); GBX.bq(y, 'lp', 5000, 0.7, sr);
  return y;
}

afSound('sfx', 'events', function (ctx, bus, K) {
  const { fx, sr, r } = K, A = AF, STOP = A.goneW + 0.1;
  const hall = K.verb('hallS', 2.8, { bright: 0.45, damp: 3, wet: 0.5, seed: 41 }), big = K.verb('bigS', 4.5, { bright: 0.4, damp: 2.4, wet: 0.55, seed: 43 });
  // ---- 1: the continent goes; the cities' lights go out
  afVanish(K, A.van0 - 0.25, { size: 1.15, d: 1.25 });
  for (let i = 0; i < 7; i++) K.put(afCrackle(fx, 0.25, { rate: 500, hp: 2500, env: (u) => 1 - u }), A.erased + 0.15 + i * 0.32 + r.range(0, 0.1), { vol: 0.15, norm: true, pan: r.range(-0.5, 0.5), room: big, wet: 0.3 });
  // ---- 2: the mine: the seam comes in from the horizon (a roar that grows and opens), passes us, and the ground is gone
  {
    const d = 1.45, n = Math.ceil(d * sr), y = afNoise(fx, n, 'pink'), curve = new Float32Array(64);
    for (let j = 0; j < 64; j++) curve[j] = 250 * Math.pow(18, Math.pow(j / 63, 1.5));
    for (let i = 0; i < n; i++) { const u = i / n; y[i] *= Math.pow(u, 2.2) * Math.min(1, (n - i) / (0.02 * sr)); }
    afSweepPut(K, y, A.mineGo, 'lowpass', 0.8, curve, { vol: 0.28 });
    K.put(afCrackle(fx, 1.2, { rate: 1100, hp: 1600, env: (u) => Math.pow(u, 1.5) }), A.mineGo + 0.3, { vol: 0.08, norm: true });
    afBlow(K, A.mineGo + 1.43, { f0: 44, vol: 0.22 });
  }
  // ---- the plant: the line stops (a clunk, the air let out, the motors winding down), then the lights, row by row
  K.put(fx.hit(fx.metalModes(88, 1.2).concat([[160, 0.3, 0.8], [43, 0.4, 0.9]]), { width: 0.004, amp: 1, noise: 0.4, nhp: 600 }), STOP - 0.05, { vol: 0.32, norm: true, room: hall, wet: 0.8 });
  afBed(K, STOP, STOP + 1.4, { colour: 'white', f: [['hp', 1800], ['lp', 7000]], vol: 0.07, fi: 0.005, fo: 1.2, mono: true, pan: 0.3, room: hall, wet: 0.5 });
  afTone(K, STOP - 0.1, 2.6, (s) => 118 * Math.pow(0.12, s / 2.6), [[1, 1], [2, 0.6], [3, 0.4], [4, 0.25], [6, 0.1]], (u) => Math.min(1, u * 40) * Math.pow(1 - u, 1.4), { f: [['lp', 900]], vol: 0.12, room: hall, wet: 0.5 });
  { const out0 = A.goneW + 0.05; for (let k = 0; k < 9; k++) { const x = 75 - k * 18.75, t = out0 + (75 - x) * 0.004, near = k / 8;
    K.put(fx.hit([[62, 0.18, 1], [131, 0.12, 0.6], [410, 0.04, 0.4], [1900, 0.01, 0.3]], { width: 0.002, amp: 1, noise: 0.5, nhp: 1200 }), t, { vol: 0.06 + 0.2 * near * near, norm: true, pan: 0.2 - 0.3 * near, room: big, wet: 1.4 - near }); } }
  // ---- 3: the network: the African lanes blink out (small digital cuts); the Suez line snaps; the detours draw
  const blip = (t, f, v, p) => K.put(fx.beep(f, 0.05), t, { vol: v, norm: true, pan: p, room: big, wet: 0.3 });
  for (let i = 0; i < 6; i++) blip(A.ports + 0.05 + i * 0.13, 1320 - i * 90, 0.035, r.range(-0.6, 0.6));
  for (let i = 0; i < 8; i++) blip(A.collapse + 0.05 + i * 0.11, 990 - i * 70, 0.035, r.range(-0.6, 0.6));
  { const n = Math.ceil(0.03 * sr), z = afNoise(fx, n, 'white'); for (let i = 0; i < n; i++) z[i] *= Math.exp(-i / (0.004 * sr)); GBX.bq(z, 'hp', 900, 0.7, sr);
    K.put(z, A.suezGone - 0.15, { vol: 0.3, norm: true, room: big, wet: 0.9 });
    afTone(K, A.suezGone - 0.15, 0.6, (s) => 1600 * Math.pow(0.2, s / 0.6), [[1, 1], [2.7, 0.3]], (u) => Math.pow(1 - u, 2), { vol: 0.04, room: big, wet: 0.6 }); }
  afTone(K, A.suezGone + 0.35, A.board - A.suezGone - 0.3, (s) => 520 + 260 * s, [[1, 1], [2, 0.25]], (u) => Math.sin(Math.PI * u) * (0.6 + 0.4 * Math.sin(u * 60)), { vol: 0.018, pan: 0.3, room: big, wet: 0.5 });
  // ---- the board: a chime, then each African row's flaps clatter round to CANCELLED
  { const ch = (t, n, v) => K.put(fx.bellBuf(gbMidi(n)), t, { vol: v, norm: true, room: big, wet: 1.2 }); ch(A.board + 0.05, 'E5', 0.05); ch(A.board + 0.45, 'C5', 0.05); }
  {
    let n = 0;
    AF_BOARD_ROWS.forEach((R, i) => {
      if (!AF_AFRICAN.has(R[1])) return;
      const tf = A.board + 0.15 + n * 0.14; n++;
      for (let k = 0; k < 13; k++) K.put(fx.hit([[r.range(2400, 3200), 0.004, 1], [r.range(5200, 6400), 0.003, 0.6], [r.range(900, 1100), 0.008, 0.4]], { width: 0.0004 }), tf + k * 0.023 + r.range(0, 0.006), { vol: r.range(0.03, 0.05), norm: true, pan: (i / 11 - 0.5) * 0.4, room: big, wet: 0.5 });
    });
  }
  // ---- the prices: each label re-prices with a till's tick, nearest first, twice
  for (const s of [0, 0.55]) for (let i = 0; i < 12; i++) K.put(fx.beep(r.range(2650, 2800), 0.03), A.surgeW - 0.25 + s + i * 0.06 + r.range(0, 0.02), { vol: 0.03 * (1 - i / 16), norm: true, pan: -0.3 + i * 0.05 });
  // ---- 4: the oceans: the Atlantic breaks over the rim; the fronts hit the floor (a blow under the music's)
  {
    const d = 2.4, n = Math.ceil(d * sr), y = afNoise(fx, n, 'brown'); GBX.bq(y, 'lp', 1400, 0.7, sr);
    for (let i = 0; i < n; i++) { const u = i / n; y[i] *= Math.min(1, u * 6) * Math.pow(1 - u, 0.8); }
    K.put(y, A.oceans + 0.35, { vol: 0.32, norm: true, room: big, wet: 0.5 });
  }
  afBlow(K, A.surge, { f0: 42, vol: 0.21 });
  // ---- the storm: every time the bow buries itself (each peak of its slam signal): the slam (a deep blow through
  //      the hull), the sea exploding (a broadband crash), the spray hissing down, the hull's creak
  {
    const S = []; for (let t = A.ship; t < A.forest - 0.2; t += 1 / 60) S.push([t, afShipSlam(t)]);
    let last = -9;
    for (let i = 1; i < S.length - 1; i++) {
      const [t, s] = S[i];
      if (!(s > 0.8 && s > S[i - 1][1] && s >= S[i + 1][1] && t - last > 1.0)) continue;
      last = t; const k = MathX.clamp(s / 1.3, 0.4, 1.2), quiet = t > A.silence - 0.3 && t < A.forest ? 1.3 : 1;   // the silent beat: the water speaks
      afBlow(K, t, { f0: 54, tau: 0.3, vol: 0.24 * k * quiet, pan: 0.1 });
      { const n = Math.ceil(1.2 * sr), z = afNoise(fx, n, 'white'); GBX.bq(z, 'hp', 1500, 0.7, sr); GBX.bq(z, 'lp', 11000, 0.7, sr);
        for (let j = 0; j < n; j++) z[j] *= Math.min(1, j / (0.004 * sr)) * Math.exp(-j / (0.28 * sr));
        K.put(z, t + 0.03, { vol: 0.28 * k * quiet, norm: true, pan: 0.12 }); }
      { const n = Math.ceil(1.6 * sr), z = afNoise(fx, n, 'pink'); GBX.bq(z, 'lp', 2200, 0.7, sr);
        for (let j = 0; j < n; j++) z[j] *= Math.min(1, j / (0.01 * sr)) * Math.exp(-j / (0.45 * sr));
        K.put(z, t + 0.05, { vol: 0.2 * k * quiet, norm: true, pan: 0.05 }); }
      afBed(K, t + 0.3, t + 2.1, { colour: 'white', f: [['hp', 2600], ['lp', 9000]], vol: 0.09 * k * quiet, fi: 0.08, fo: 1.4, env: (u) => Math.pow(1 - u, 1.2) });
      K.put(fx.creak(1.1, [[r.range(210, 260), 0.03, 1], [r.range(520, 600), 0.02, 0.6], [r.range(1100, 1300), 0.01, 0.3]], { rate: [18, 45] }), t + 0.25, { vol: 0.05 * k, norm: true, pan: -0.3, room: big, wet: 0.6 });
    }
  }
  // ★ the narration-free beat opens with a crash of water (bright, so a phone hears the hit), drawn in by a reversed swell
  { const n = Math.ceil(1.6 * sr), z = afNoise(fx, n, 'white'); GBX.bq(z, 'hp', 2000, 0.7, sr); GBX.bq(z, 'lp', 12000, 0.7, sr);
    for (let j = 0; j < n; j++) z[j] *= Math.min(1, j / (0.003 * sr)) * Math.exp(-j / (0.42 * sr));
    K.put(z, A.silence, { vol: 0.3, norm: true });
    const m = Math.ceil(0.7 * sr), w = afNoise(fx, m, 'pink'); GBX.bq(w, 'hp', 900, 0.7, sr);
    for (let j = 0; j < m; j++) { const u = j / m; w[j] *= Math.pow(u, 3) * Math.min(1, (m - j) / (0.004 * sr)); }
    K.put(w, A.silence - 0.7, { vol: 0.16, norm: true }); }
  // ---- 5: the rainforest goes; the waterhole goes (an elephant calls just before)
  afVanish(K, A.forestGo - 0.35, { size: 0.85, d: 1.15, rush: 0.5 });
  K.put(afTrumpet(fx), A.wild + 0.12, { vol: 0.06, norm: true, pan: -0.35, room: big, wet: 1.2 });
  afVanish(K, A.savGo - 0.35, { size: 0.75, d: 1.05, rush: 0, blow: 0.5 });
  // ---- 6: the phone, on speaker: the ringing tone, the three rising tones of a call that cannot connect; the tap
  {
    const P = A.phone, speaker = (y) => { GBX.bq(y, 'hp', 350, 0.7, sr); GBX.bq(y, 'lp', 3400, 0.7, sr); GBX.bq(y, 'peak', 1800, 1, sr, 4); return y; };
    const ring = (t) => { const y = fx.arr(1.0), n = Math.ceil(0.95 * sr); for (let i = 0; i < n; i++) { const tt = i / sr; y[i] = Math.sin(2 * Math.PI * 425 * tt) * Math.min(1, tt / 0.01, (0.95 - tt) / 0.01); } K.put(speaker(y), t, { vol: 0.07, norm: true, pan: 0.05 }); };
    const sit = (t) => { const y = fx.arr(1.1); [[913.8, 0, 0.276], [1370.6, 0.276, 0.276], [1776.7, 0.552, 0.38]].forEach(([f, o, d]) => { for (let i = 0; i < d * sr; i++) { const tt = i / sr; y[Math.round(o * sr) + i] = Math.sin(2 * Math.PI * f * tt) * Math.min(1, tt / 0.006, (d - tt) / 0.006); } }); K.put(speaker(y), t, { vol: 0.06, norm: true, pan: 0.05 }); };
    ring(P + 0.4); sit(P + 1.9);
    K.put(fx.hit([[2200, 0.004, 1], [180, 0.02, 0.6]], { width: 0.002 }), P + 2.45, { vol: 0.05, norm: true, pan: 0.05 });
    ring(P + 3.15); sit(P + 4.6);
  }
  // ---- 7: the coast: boats settling on the mud (a hull's creak), the old coastline drawn on "maps"
  for (const o of [1.6, 3.4, 5.8]) K.put(fx.creak(0.8, fx.woodModes(r.range(140, 190), 3), { rate: [12, 30] }), A.coast + o, { vol: 0.03, norm: true, pan: r.range(-0.5, 0.5), room: big, wet: 0.5 });
  K.put(fx.rustle(1.0, { density: 400, rub: 0.5, lo: 1800, hi: 7000, grain: 0.006, env: (u) => Math.sin(Math.PI * u) }), A.maps + 0.1, { vol: 0.02, norm: true, pan: -0.2 });
  // the pull-away: air rising under the swell (the mix cuts it with everything else on the last frame)
  afBed(K, A.pull - 0.4, A.end + 0.2, { colour: 'pink', f: [['bp', 900, 0.5]], vol: 0.12, fi: 2.5, fo: 0.01, env: (u) => Math.pow(u, 1.5) });
});
