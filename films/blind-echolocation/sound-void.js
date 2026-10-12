/* =====================================================================
   SOUND — scene 4 (the science space). Almost anechoic: no room around her, so each click is heard with ONLY the
   echo of the one surface it is aimed at. That makes the comparison honest and audible:
     D1  two close clicks (dry, intimate: the tongue's low "pop" plus the bright snap)
     D2–D3  the slowed click (the picture is ≈ 900× slower than life): a designed slow-motion layer, not a real
         echo: the front travelling out (left → right), touching the wall at 5.8 ms, travelling back (right → left)
         and landing at her ears on "milliseconds"
     D4  the real click with its real echo 11.7 ms later (a wall 2 m away)
     D5  under "a completely separate echo": a far-wall click (echo 11.7 ms) then a near-wall click (2.9 ms: blended)
     D7  three surfaces: panel 2.0 m (one strong, bright copy at 11.7 ms), curtain 1.6 m (a weak, dull copy at
         9.3 ms), open doorway (nothing near; a faint, late wash from a space beyond)
   ===================================================================== */
const BE_VOIDROOM = { size: [0, 0, 0], rt60: 0.18, absorb: 0.9, bright: 0.4, wet: 0.12, seed: 64 };

beSound('sfx', 'void', function (ctx, dest, K) {
  const { fx, sr, r } = K, B = BE;
  const air = K.room('void', Object.assign({ src: [0, 0, 0], lis: [0, 0, 0] }, BE_VOIDROOM));
  const pop = () => { const y = beClickArr(fx, { f: 3200 }), s = fx.hit([[620, 0.004, 1], [1100, 0.003, 0.4]], { width: 0.0006, amp: 1 }); for (let i = 0; i < Math.min(y.length, s.length); i++) y[i] += 0.35 * s[i]; return y; };
  // D1: close and dry
  for (const t of B.d1Clicks) K.put(pop(), t, { vol: 0.34, norm: true, room: air, wet: 0.3 });
  K.put(pop(), B.dClick, { vol: 0.36, norm: true, room: air, wet: 0.3 });
  // D2–D3: the slow-motion layer. Out: a low swell and a band of air moving left → right; the touch at the wall;
  // back: right → left, landing on "milliseconds" with a bright tick
  { const d = B.dWall - B.dClick, n = Math.ceil(d * sr), y = fx.white(n); GBX.bq(y, 'bp', 700, 0.8, sr); GBX.bq(y, 'lp', 2200, 0.7, sr);
    for (let i = 0; i < n; i++) { const u = i / n; y[i] *= Math.min(1, u * 6) * (0.55 + 0.45 * u) * (1 - Math.pow(u, 12) * 0.3); }
    const L = fx.arr(d), R = fx.arr(d); for (let i = 0; i < n; i++) { const u = i / n, p = -0.8 + 1.6 * u; L[i] = y[i] * Math.cos((p + 1) * Math.PI / 4); R[i] = y[i] * Math.sin((p + 1) * Math.PI / 4); }
    K.putLR(L, R, B.dClick, { vol: 0.09, norm: true });
    const sub = fx.arr(1.6); for (let i = 0; i < sub.length; i++) { const t = i / sr; sub[i] = Math.sin(2 * Math.PI * (48 + 30 * Math.exp(-t * 3)) * t) * Math.exp(-t * 2.2) * Math.min(1, t * 40); }
    K.put(sub, B.dClick + 0.02, { vol: 0.16, norm: true }); }
  K.put(fx.hit(fx.panelModes(1.6), { width: 0.004, amp: 1 }), B.dWall, { vol: 0.12, norm: true, pan: 0.7, room: air, wet: 0.6 });
  K.put(fx.shimmer(1.4, 1320, { skew: 0.4 }), B.dWall, { vol: 0.03, norm: true, pan: 0.7 });
  { const d = B.dBack - B.dWall, n = Math.ceil(d * sr), y = fx.white(n); GBX.bq(y, 'bp', 520, 0.8, sr); GBX.bq(y, 'lp', 1600, 0.7, sr);
    for (let i = 0; i < n; i++) { const u = i / n; y[i] *= Math.min(1, u * 5) * (0.4 + 0.6 * u); }
    const L = fx.arr(d), R = fx.arr(d); for (let i = 0; i < n; i++) { const u = i / n, p = 0.8 - 1.6 * u; L[i] = y[i] * Math.cos((p + 1) * Math.PI / 4); R[i] = y[i] * Math.sin((p + 1) * Math.PI / 4); }
    K.putLR(L, R, B.dWall, { vol: 0.07, norm: true }); }
  K.put(fx.hit([[2400, 0.05, 1], [3600, 0.03, 0.5], [5100, 0.02, 0.25]], { width: 0.0004, amp: 1 }), B.dBack, { vol: 0.1, norm: true, pan: -0.6 });
  // D4: the real thing: click + one echo 11.7 ms later
  K.put(beWithEchoes(fx, pop(), [[BE_C4_RT, 0.45, 5000]]), B.dFast, { vol: 0.36, norm: true, room: air, wet: 0.3 });
  // D5: far (separate) then near (blended)
  K.put(beWithEchoes(fx, beClickArr(fx), [[BE_C4_RT, 0.45, 5000]]), bnF(4, 'separate').start + 0.1, { vol: 0.2, norm: true, pan: -0.2 });
  K.put(beWithEchoes(fx, beClickArr(fx), [[1 / 343, 0.65, 6000]]), bnF(4, 'echo', 20).start + 0.45, { vol: 0.2, norm: true, pan: 0.2 });
  // D7: three surfaces (the curtain on her left, the doorway on her right)
  K.put(beWithEchoes(fx, pop(), [[BE_C4_RT, 0.62, 7000]]), B.d7Clicks[0], { vol: 0.4, norm: true, room: air, wet: 0.25 });
  { const c = pop(); K.put(beWithEchoes(fx, c, [[3.2 / 343, 0.13, 1100], [3.25 / 343, 0.06, 900]]), B.d7Clicks[1], { vol: 0.36, norm: true, pan: -0.15, room: air, wet: 0.2 }); }
  { const c = pop(), reps = []; for (let i = 0; i < 18; i++) reps.push([0.03 + r.range(0, 0.07), 0.035 * Math.exp(-i / 9), r.range(1200, 2600)]); K.put(beWithEchoes(fx, c, reps), B.d7Clicks[2], { vol: 0.36, norm: true, pan: 0.15, room: air, wet: 0.2 }); }
});
beSound('amb', 'void', function (ctx, dest, K) {
  const { fx, sr } = K, B = BE, D = B.s5 - B.s4 + 1.5, n = Math.ceil(D * sr), L = fx.arr(D), R = fx.arr(D);
  // the science space: a very quiet, dark air tone (no room, no world)
  for (const X of [L, R]) { const w = fx.white(n); GBX.bq(w, 'lp', 160, 0.6, sr); GBX.bq(w, 'hp', 30, 0.7, sr); for (let i = 0; i < n; i++) X[i] += w[i] * 0.07; }
  K.putLR(L, R, B.s4 - 0.3, { vol: 0.8, fadeIn: 0.8, stop: B.s5 + 1.0, fade: 1.2 });
});
beSound('foley', 'void', function (ctx, dest, K) {
  const { fx } = K, B = BE;
  K.put(fx.breath(1.0, { inhale: true }), B.s4 + 0.1, { vol: 0.06, norm: true });
  K.put(fx.breath(0.9, { inhale: true }), B.dClick - 0.9, { vol: 0.05, norm: true });
  K.put(fx.breath(1.2, { inhale: true }), B.d7 + 0.0, { vol: 0.05, norm: true });
  for (const [a, p] of [[B.d7 + 1.05, -0.3], [B.d7 + 2.6, 0.3], [B.d7 + 4.5, 0]]) {
    K.put(fx.rustle(0.6, { density: 220, rub: 0.4, lo: 400, hi: 4200, grain: 0.02 }), a, { vol: 0.05, norm: true, pan: p });
    K.put(fx.step({ weight: 0.25, scuff: 0.4 }), a + 0.3, { vol: 0.04, norm: true, pan: p });
  }
});
beSound('music', 'void', function (ctx, dest, K) {
  const B = BE, M = beMusicKit(ctx, K);
  // D1: the plucked pulse continues from the hall, closer
  [0, 0.75, 1.5, 2.25, 3.0, 3.75].forEach((o, i) => M.piano(B.s4 + 0.3 + o, ['D3', 'A2', 'F#3', 'A2'][i % 4], 0.22, 0.7, 0, 0.3));
  // D2–D3: time slows: a long open fifth that brightens as the front reaches the wall, and resolves when it is home
  M.strings(B.dClick, B.dWall + 0.4, ['D2', 'A2', 'E3'], 0.7, { att: 2.0, rel: 0.5, cut: 450, cutTo: 1600 });
  M.strings(B.dWall - 0.2, B.dBack + 1.2, ['A2', 'E3', 'B3', 'F#4'], 0.6, { att: 1.2, rel: 0.8, cut: 1600, cutTo: 900 });
  M.bell(B.dWall, 'B5', 0.28, 0.6); M.bell(B.dBack, 'F#5', 0.3, -0.6); M.bell(B.dBack + 0.35, 'D6', 0.22, -0.3);
  // D4: "incredibly fast": a quick upward figure
  ['D5', 'F#5', 'A5', 'D6'].forEach((n, i) => M.bell(B.dFast + i * 0.07, n, 0.2, -0.3 + 0.2 * i));
  // D5–D6: a steady, thinking pulse
  for (let t = B.d5 + 0.3, i = 0; t < B.d7 - 0.2; t += 0.62, i++) M.piano(t, ['A2', 'E3', 'B2', 'E3'][i % 4], 0.2, 0.6, 0, 0.3);
  M.strings(B.d5, B.d7 + 0.5, ['E2', 'B2', 'G3'], 0.45, { att: 2, rel: 1, cut: 700 });
  // D7: three steps up; space left around each click so the echoes can be heard
  M.strings(B.d7 - 0.2, B.s5 + 1.0, ['D2', 'A2', 'D3', 'F#3'], 0.75, { att: 1.0, rel: 1.4, cut: 900, cutTo: 2200 });
  B.d7Clicks.forEach((c, i) => M.piano(c + 0.55, ['A3', 'B3', 'C#4'][i], 0.28, 1.2, [0, -0.4, 0.4][i], 0.5));
});
