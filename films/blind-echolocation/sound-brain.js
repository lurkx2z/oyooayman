/* =====================================================================
   SOUND — scene 7 (the brain). The only "inner" sound in the film: no room, no world, the brain as an instrument.
     G1  the void's quiet air around her; the push toward her ear pulls everything into a soft inward swell (the flash)
     G2  an inner drone (low, slowly beating) and the network: tiny soft ticks that thicken on "adapt … learning"
     G3  a click reaches her ear (dry, close, a little ear-canal resonance); the auditory region answers (a warm, low
         glassy tone, amber); the flow runs back (a filtered breath moving left → right, front → back); the visual
         region answers (a high glassy shimmer, cyan)
     G4  the same answer twice: the blind participant's brain (left) and the sighted one's (right)
     G5  inside: the drone opens, a slow airy motion
     G6  (no narration) two clicks: each one runs through the whole network (a sweep); then the rise into white
   ===================================================================== */
beSound('sfx', 'brain', function (ctx, dest, K) {
  const { fx, sr, r } = K, B = BE;
  const air = K.room('brain', { size: [0, 0, 0], src: [0, 0, 0], lis: [0, 0, 0], rt60: 1.6, absorb: 0.4, bright: 0.5, wet: 0.35, seed: 77 });
  const pop = () => { const y = beClickArr(fx, { f: 3100 }), s = fx.hit([[600, 0.004, 1], [1080, 0.003, 0.4]], { width: 0.0006, amp: 1 }); for (let i = 0; i < Math.min(y.length, s.length); i++) y[i] += 0.35 * s[i]; return y; };
  // a panned, band-passed breath of air that travels (p0 → p1)
  const travel = (t, d, f, p0, p1, vol, q = 0.9) => {
    const n = Math.ceil(d * sr), y = fx.white(n); GBX.bq(y, 'bp', f, q, sr); GBX.bq(y, 'lp', f * 2.4, 0.7, sr);
    const L = fx.arr(d), R = fx.arr(d);
    for (let i = 0; i < n; i++) { const u = i / n, e = Math.sin(Math.PI * Math.min(1, u)) ** 1.5, p = p0 + (p1 - p0) * u; L[i] = y[i] * e * Math.cos((p + 1) * Math.PI / 4); R[i] = y[i] * e * Math.sin((p + 1) * Math.PI / 4); }
    K.putLR(L, R, t, { vol, norm: true, room: air, wet: 0.5 });
  };
  // a soft glassy chord (the regions answering): partials with slow beating
  const glass = (t, fs, d, vol, pan) => {
    const y = fx.arr(d + 0.1), n = Math.ceil(d * sr);
    for (let i = 0; i < n; i++) { const tt = i / sr, e = Math.min(1, tt / 0.12) * Math.exp(-tt * 2.2 / d); let v = 0; fs.forEach((f, k) => { v += Math.sin(2 * Math.PI * f * tt + k) * (1 / (k + 1)) * (0.8 + 0.2 * Math.sin(2 * Math.PI * (0.7 + k * 0.3) * tt)); }); y[i] = v * e; }
    K.put(y, t, { vol, norm: true, pan, room: air, wet: 0.7 });
  };
  // G1: the push toward her ear: an inward swell that peaks on the flash
  { const d = B.g2 - B.s7 + 0.3, n = Math.ceil(d * sr), y = fx.white(n); GBX.bq(y, 'lp', 900, 0.7, sr);
    for (let i = 0; i < n; i++) { const u = i / n; y[i] *= Math.pow(u, 3.2) * Math.min(1, (1 - u) * 14); }
    K.put(y, B.s7, { vol: 0.12, norm: true, room: air, wet: 0.6 }); }
  K.put(fx.shimmer(2.2, 990, { skew: 0.3 }), B.g2 - 0.05, { vol: 0.05, norm: true, room: air });
  // G2: the network: tiny soft ticks, sparse, then thicker on "adapt … learning"
  { const a = bnE(7, 'adapt').start - 0.3, b = bnE(7, 'learning').start + 0.6;
    for (let t = B.g2 + 0.3; t < B.g3 - 0.2; t += r.range(0.05, 0.22) * (t > a && t < b + 1 ? 0.45 : 1)) {
      K.put(fx.hit([[r.range(2400, 5200), 0.012, 1]], { width: 0.0003, amp: 1 }), t, { vol: r.range(0.012, 0.03), norm: true, pan: r.range(-0.8, 0.8), room: air, wet: 0.8 });
    } }
  // G3: the click arrives at her (right) ear; hearing answers; the flow; vision answers
  K.put(pop(), B.gEar, { vol: 0.3, norm: true, pan: 0.55, room: air, wet: 0.25 });
  K.put(fx.hit([[2700, 0.03, 1], [3900, 0.02, 0.4]], { width: 0.0005, amp: 1 }), B.gEar + 0.004, { vol: 0.05, norm: true, pan: 0.6 });
  glass(B.gEar + 0.22, [220, 330, 495, 660], 3.2, 0.11, 0.35);
  travel(B.gEar + 0.6, B.gVis - B.gEar + 0.2, 1100, 0.5, -0.5, 0.06);
  glass(B.gVis + 0.05, [880, 1320, 1760, 2640], 3.6, 0.07, -0.3);
  K.put(fx.shimmer(2.6, 1760, { skew: 0.4 }), B.gVis + 0.1, { vol: 0.04, norm: true, pan: -0.3, room: air });
  // G4: blind (left), sighted (right): the same answer
  for (const [t, p] of [[B.gBlind, -0.55], [B.gSighted, 0.55]]) {
    K.put(beClickArr(fx, { f: 3000 }), t - 0.1, { vol: 0.14, norm: true, pan: p, room: air, wet: 0.3 });
    glass(t + 0.1, [220, 330, 495], 2.2, 0.06, p);
    glass(t + 0.55, [880, 1320, 1760], 2.6, 0.045, p);
  }
  // G5: inside: a slow airy motion through the pathways
  travel(B.g5, B.g6 - B.g5 + 1.0, 600, 0.6, -0.3, 0.05, 0.7);
  // G6: two clicks, each running through the whole network (a widening sweep); then the rise into white
  for (const c of B.gClicks) {
    K.put(pop(), c, { vol: 0.34, norm: true, room: air, wet: 0.45 });
    { const d = 1.6, n = Math.ceil(d * sr), y = fx.arr(d); let ph = 0;
      const w = fx.white(n); GBX.bq(w, 'hp', 1800, 0.7, sr);
      for (let i = 0; i < n; i++) { const u = i / n, f = 300 + 2600 * u; ph += 2 * Math.PI * f / sr; y[i] = (0.4 * Math.sin(ph) + 0.6 * w[i] * u) * Math.sin(Math.PI * u) ** 2; }
      K.putLR(y, y.slice(), c + 0.02, { vol: 0.07, norm: true, room: air, wet: 0.7 }); }
  }
  { const d = B.s8 - (B.s8 - 2.2) + 0.1, n = Math.ceil(d * sr), y = fx.white(n); GBX.bq(y, 'bp', 1600, 0.6, sr);
    for (let i = 0; i < n; i++) { const u = i / n; y[i] *= Math.pow(u, 2.5) * Math.min(1, (1 - u) * 30); }
    K.put(y, B.s8 - 2.2, { vol: 0.09, norm: true, room: air, wet: 0.4 }); }
});
beSound('amb', 'brain', function (ctx, dest, K) {
  const { fx, sr } = K, B = BE, D = B.s8 - B.s7 + 1.0, n = Math.ceil(D * sr), L = fx.arr(D), R = fx.arr(D);
  // G1: the void's dark air; G2 → G6: an inner drone (two low sines beating slowly), which opens inside (G5)
  const w = [fx.white(n), fx.white(n)]; w.forEach((x) => { GBX.bq(x, 'lp', 160, 0.6, sr); GBX.bq(x, 'hp', 30, 0.7, sr); });
  const i2 = (B.g2 - B.s7) * sr, i5 = (B.g5 - B.s7) * sr;
  for (let i = 0; i < n; i++) {
    const t = i / sr, k = Math.min(1, Math.max(0, (i - i2) / (1.2 * sr))), o = Math.min(1, Math.max(0, (i - i5) / (3 * sr)));
    const dr = (Math.sin(2 * Math.PI * 55 * t) + 0.8 * Math.sin(2 * Math.PI * 55.4 * t) + (0.25 + 0.35 * o) * Math.sin(2 * Math.PI * 82.5 * t)) * 0.06 * k;
    L[i] = w[0][i] * 0.07 + dr; R[i] = w[1][i] * 0.07 + dr * 0.95;
  }
  K.putLR(L, R, B.s7 - 0.4, { vol: 0.8, fadeIn: 0.6, stop: B.s8 + 0.2, fade: 0.5 });
});
beSound('foley', 'brain', function (ctx, dest, K) {
  const { fx } = K, B = BE;
  K.put(fx.breath(1.1, { inhale: true }), B.s7 + 0.2, { vol: 0.045, norm: true, pan: 0.2 });
});
beSound('music', 'brain', function (ctx, dest, K) {
  const B = BE, M = beMusicKit(ctx, K);
  // G1: a held question (unresolved suspension)
  M.strings(B.s7, B.g2 + 0.6, ['D2', 'A2', 'E3', 'G3'], 0.55, { att: 1.0, rel: 0.6, cut: 500, cutTo: 1400 });
  // G2–G4: wonder: a slow, open progression; bells mark each region answering
  M.strings(B.g2 - 0.1, B.g3 + 0.8, ['D2', 'A2', 'F#3', 'C#4'], 0.6, { att: 1.4, rel: 1.0, cut: 900, vib: 2 });
  M.strings(B.g3 + 0.2, B.g4 + 0.8, ['B1', 'F#2', 'D3', 'A3'], 0.6, { att: 1.4, rel: 1.0, cut: 800, cutTo: 1500, vib: 2 });
  M.strings(B.g4 + 0.2, B.g5 + 0.8, ['G1', 'D2', 'B2', 'F#3', 'A3'], 0.6, { att: 1.4, rel: 1.0, cut: 900, vib: 2 });
  M.bell(B.gEar + 0.3, 'F#5', 0.18, 0.4); M.bell(B.gVis + 0.1, 'C#6', 0.22, -0.4);
  M.bell(B.gBlind + 0.6, 'A5', 0.16, -0.5); M.bell(B.gSighted + 0.6, 'A5', 0.16, 0.5);
  for (let t = B.g2 + 0.6, i = 0; t < B.g5 - 0.3; t += 0.75, i++) M.piano(t, ['D3', 'A3', 'E4', 'A3'][i % 4], 0.14, 0.9, i % 2 ? 0.25 : -0.25, 0.3);
  // G5–G6: it opens: a high, bright chord that swells into the white
  M.strings(B.g5 - 0.2, B.s8 + 0.4, ['D2', 'A2', 'E3', 'F#3', 'C#4', 'E4'], 0.7, { att: 2.5, rel: 0.6, cut: 900, cutTo: 3000, vib: 3, keys: [[B.g6, 0.8], [B.s8 - 0.3, 1.0]] });
  M.strings(B.g6, B.s8 + 0.4, ['A4', 'B4', 'E5'], 0.3, { att: 2.0, rel: 0.6, cut: 3600, vib: 3 });
  B.gClicks.forEach((c, i) => M.bell(c + 0.25, ['E6', 'B5'][i], 0.2, i ? 0.3 : -0.3));
});
