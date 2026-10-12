/* =====================================================================
   SOUND — scene 3 (the hallway). A long, narrow, hard corridor (12 × 2.6 × 1.4 m): its parallel walls 1.4 m apart give
   a fast flutter (a reflection every ≈ 8 ms) that the bedroom never had. Her tongue click is a short, bright palatal
   "tock" (≈ 2–4 kHz, ≈ 1 ms). The three answers in C4 are built from the geometry: a wall 0.7 m away returns one strong
   copy 4.1 ms later (and a weaker flutter at 8.2 ms); an open doorway returns almost nothing; a bookcase ≈ 1 m away returns many weak copies spread from ≈ 5.6 ms over ≈ 3 ms.
   ===================================================================== */
const BE_HALL = { size: [12, 2.6, 1.4], rt60: 0.75, absorb: 0.22, bright: 0.6, wet: 0.38, seed: 52 };

function beClickArr(fx, o = {}) {
  const sr = fx.sr, y = fx.arr(0.06), r = fx.r;
  GBX.strike(y, 0, Math.round(0.00035 * sr), 1, [[(o.f || 2900) * r.range(0.97, 1.03), 0.0016, 1], [4300 * r.range(0.97, 1.03), 0.0011, 0.55], [1750, 0.0022, 0.45], [900, 0.003, 0.2]], sr);
  const n = Math.round(0.004 * sr), z = fx.white(n); GBX.bq(z, 'hp', 2500, 0.7, sr);
  for (let i = 0; i < n; i++) y[i] += z[i] * 0.25 * Math.exp(-i / (n * 0.2));
  return y;
}
// add delayed, filtered copies of a sound (a hand-built echo): reps [[delay s, gain, lowpass Hz]]
function beWithEchoes(fx, x, reps) {
  const sr = fx.sr, y = fx.arr(x.length / sr + Math.max(...reps.map((r) => r[0])) + 0.02);
  y.set(x);
  for (const [d, g, lp] of reps) { const c = Float32Array.from(x); if (lp) GBX.bq(c, 'lp', lp, 0.7, sr); const i0 = Math.round(d * sr); for (let i = 0; i < c.length && i0 + i < y.length; i++) y[i0 + i] += c[i] * g; }
  return y;
}

beSound('sfx', 'hall', function (ctx, dest, K) {
  const { fx, sr, r } = K, B = BE;
  const hall = K.room('hall', Object.assign({ src: [3.83, 1.5, 0.7], lis: [3.83, 1.6, 0.73] }, BE_HALL));
  const click = (t, v = 0.32, o = {}) => K.put(beClickArr(fx, o), t, { vol: v, norm: true, pan: o.pan || 0, room: hall, wet: o.wet ?? 1 });
  // C1 the click (real time), heard with the hall's flutter
  click(B.k1, 0.36);
  // C2–C3 (slowed picture): a designed, honest-to-the-picture "slow" layer: the click's energy as a soft low swell
  // spreading outward, and a breath of air as the reflected front passes back over her (73 s)
  { const d = B.awall - B.every, n = Math.ceil(d * sr), y = fx.white(n); GBX.bq(y, 'bp', 520, 0.9, sr); GBX.bq(y, 'lp', 1400, 0.7, sr);
    for (let i = 0; i < n; i++) { const t = B.every + i / sr; y[i] *= 0.5 * MathX.window(t, B.every, B.encounter + 0.5, 0.8, 1.2) + 1.0 * MathX.window(t, B.reflects - 0.4, B.awall, 0.5, 0.5); }
    K.put(y, B.every, { vol: 0.07, norm: true });
    K.put(fx.shimmer(2.6, 660, { skew: 0.7 }), B.reflects - 0.4, { vol: 0.035, norm: true, pan: -0.2 }); }
  // C4: three surfaces, three answers (built from the distances)
  { const c = beClickArr(fx); K.put(beWithEchoes(fx, c, [[0.0041, 0.75, 6000], [0.0082, 0.25, 4000]]), B.awall + 0.05, { vol: 0.34, norm: true, room: hall, wet: 0.5 }); }
  { const c = beClickArr(fx); K.put(beWithEchoes(fx, c, [[0.0175, 0.06, 1500], [0.021, 0.04, 1200]]), B.adoor + 0.04, { vol: 0.3, norm: true, room: hall, wet: 0.15 }); }
  { const c = beClickArr(fx), reps = []; for (let i = 0; i < 14; i++) reps.push([0.0056 + r.range(0, 0.0034), r.range(0.06, 0.2), r.range(2500, 5000)]); K.put(beWithEchoes(fx, c, reps), B.afurn + 0.04, { vol: 0.32, norm: true, room: hall, wet: 0.5 }); }
  // C6–C8: the clicks as she walks, then the two from above (each with the hall)
  for (const t of B.clicks3) click(t, 0.3, { pan: 0.05 });
  for (const t of B.clicks8) click(t, 0.33);
  // her shoes on the hall's boards
  const plan = beScene3Props._plan;
  if (plan) for (const h of plan) if (h.t0 > B.walk3[0] && h.t0 < B.walk3[1] + 0.6) K.put(fx.woodStep({ weight: 0.45, scuff: 0.05 }), h.t0, { vol: 0.07, norm: true, room: hall, wet: 0.6 });
});
beSound('amb', 'hall', function (ctx, dest, K) {
  const { fx, sr } = K, B = BE, D = B.s4 - B.s3 + 1.5, n = Math.ceil(D * sr), L = fx.arr(D), R = fx.arr(D);
  for (const X of [L, R]) { const w = fx.white(n); GBX.bq(w, 'lp', 220, 0.6, sr); GBX.bq(w, 'hp', 40, 0.7, sr); for (let i = 0; i < n; i++) X[i] += w[i] * 0.1; }
  { const h = fx.arr(D); for (let i = 0; i < n; i++) h[i] = 0.4 * Math.sin(2 * Math.PI * 50 * i / sr) + 0.2 * Math.sin(2 * Math.PI * 100 * i / sr); GBX.mixIn(L, R, h, 0, 0.004, 0.7); }   // a fridge, far
  for (let t = Math.ceil(B.s3) + 0.5; t < B.s4 + 1; t += 1) GBX.mixIn(L, R, fx.hit([[3100, 0.006, 1], [5200, 0.004, 0.5]], { width: 0.0003, amp: 1 }), Math.round((t - B.s3) * sr), 0.003, -0.5);   // the bedroom clock, through the door
  K.putLR(L, R, B.s3, { vol: 1, fadeIn: 0.8, stop: B.s4 + 1.2, fade: 1.0 });
});
beSound('foley', 'hall', function (ctx, dest, K) {
  const { fx } = K, B = BE;
  K.put(fx.breath(1.2, { inhale: true }), B.s3 + 0.3, { vol: 0.05, norm: true });
  K.put(fx.breath(1.6, {}), B.each + 0.2, { vol: 0.03, norm: true });
  K.put(fx.rustle(1.0, { density: 200, rub: 0.4, lo: 400, hi: 4000, grain: 0.02 }), B.walk3[0], { vol: 0.05, norm: true });
});
beSound('music', 'hall', function (ctx, dest, K) {
  const B = BE, M = beMusicKit(ctx, K);
  // "Listen." is unscored. The slowed click: a pad that opens with the wave; the return: a high answer
  M.strings(B.every + 0.3, B.awall - 0.1, ['D2', 'A2', 'E3'], 0.8, { att: 2.5, rel: 0.6, cut: 400, cutTo: 1300 });
  M.strings(B.reflects - 0.6, B.awall + 0.4, ['F#5', 'C#6'], 0.3, { att: 1.0, rel: 0.6, cut: 4000, vib: 3 });
  // the science: a soft, steady pulse (low plucked notes) under the traces
  [0, 0.7, 1.4, 2.1].forEach((o, i) => M.piano(B.each + 0.2 + o, i % 2 ? 'A2' : 'D3', 0.3, 0.8, 0, 0.4));
  // the walk: warmer, moving; "Echolocation": the chord resolves, bells
  M.strings(B.andif - 0.2, B.echoW + 0.2, ['D3', 'F#3', 'A3', 'E4'], 0.6, { att: 1.5, rel: 0.4, cut: 1300 });
  M.strings(B.echoW - 0.1, B.s4 + 0.8, ['D2', 'A2', 'D3', 'F#3', 'A3', 'C#4'], 0.8, { att: 0.6, rel: 1.5, cut: 1800 });
  [['A5', 0], ['D6', 0.35], ['F#6', 0.7], ['C#7', 1.2]].forEach(([n, o], i) => M.bell(B.echoW + o, n, 0.3 - 0.04 * i, i % 2 ? 0.35 : -0.35));
  M.strings(B.over, B.s4 + 0.6, ['A4', 'E5'], 0.3, { att: 2.0, rel: 1.0, cut: 4500, vib: 3 });
});
