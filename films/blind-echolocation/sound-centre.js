/* =====================================================================
   SOUND — scenes 5 and 6 (the training centre). Three spaces, three acoustics:
     practice room  10 × 3.2 × 8 m, hard floor, big windows: bright and lively (RT60 ≈ 0.9 s)
     corridor       13 × 2.7 × 1.8 m: a quick flutter between the close walls (RT60 ≈ 0.7 s)
     lobby          4 × 2.7 × 5 m: wider, a little softer (RT60 ≈ 0.8 s)
   Each surface's answer is built from its distance (round trip at 343 m/s) and its material:
     partition 1.6 m → 9.3 ms · column 1 m (narrow: a small return) → 5.8 ms · steel panel 2.8 m → 16.3 ms, bright, it
     rings · blanket block 3.0 m → 17.5 ms, very faint and dull · open door → nothing near, a faint late corridor wash
   ===================================================================== */
const BE_CTR_ROOM = { size: [10, 3.2, 8], rt60: 0.9, absorb: 0.24, bright: 0.62, wet: 0.36, seed: 81 };
const BE_COR_ROOM = { size: [13, 2.7, 1.8], rt60: 0.7, absorb: 0.2, bright: 0.6, wet: 0.36, seed: 82 };
const BE_LOB_ROOM = { size: [4, 2.7, 5], rt60: 0.8, absorb: 0.3, bright: 0.5, wet: 0.34, seed: 83 };
const _ms = (m) => 2 * m / 343;

beSound('sfx', 'centre', function (ctx, dest, K) {
  const { fx, r } = K, B = BE;
  const room = K.room('ctr', Object.assign({ src: [5, 1.5, 4.5], lis: [5.1, 1.6, 4.5] }, BE_CTR_ROOM));
  const cor = K.room('cor', Object.assign({ src: [3, 1.5, 0.9], lis: [3, 1.6, 0.92] }, BE_COR_ROOM));
  const lob = K.room('lob', Object.assign({ src: [0.6, 1.5, 0.9], lis: [0.6, 1.6, 0.92] }, BE_LOB_ROOM));
  const click = (t, reps, o = {}) => K.put(beWithEchoes(fx, beClickArr(fx, { f: o.f || 3000 }), reps || [[0.001, 0.0, 0]]), t, { vol: o.vol ?? 0.3, norm: true, pan: o.pan || 0, room: o.room || room, wet: o.wet ?? 0.8 });
  // E1 hesitant clicks (week 1), E2 early ones: the same room, but nothing she can use yet
  for (const t of B.e1Clicks) click(t, [[_ms(1.6), 0.3, 5000]], { vol: 0.22 });
  for (const t of B.e2Clicks) click(t, [[_ms(1.6), 0.3, 5000]], { vol: 0.26 });
  click(B.e2Clean, [[_ms(1.6), 0.5, 6000], [_ms(1.62), 0.25, 5000]], { vol: 0.32 });     // the two panels; the gap is silent
  click(B.e2cClick, [[_ms(1.0), 0.28, 5000]], { vol: 0.32 });                                  // a narrow column
  click(B.e2dClicks[0], [[_ms(2.8), 0.55, 7000]], { vol: 0.32, pan: 0.3 });                    // the broad flat panel
  click(B.e2dClicks[1], [[_ms(2.4), 0.22, 4500]], { vol: 0.3, pan: -0.3 });                    // the round column
  for (const t of B.e3Clicks) click(t, [[_ms(2), 0.3, 5000]], { vol: 0.16 });
  click(B.e4Click, [[_ms(0.9), 0.5, 6000], [_ms(0.9) * 2, 0.2, 4000]], { vol: 0.28, room: cor });
  // E5: the corridor; the near walls answer fast; at the end of the wall the answer on her right drops away; the
  // lobby: later, softer
  B.e5Clicks.forEach((t, i) => {
    const x = -2.5 + 9.1 * MathX.clamp((t - B.e5Walk[0]) / (B.e5Walk[1] - B.e5Walk[0]), 0, 1);
    const wallR = x < 3.5 || (x > 4.6 && x < 5.9), inLobby = x > 6.0;
    const reps = [[_ms(0.92), 0.45, 6000]];
    if (wallR && !inLobby) reps.push([_ms(0.92) + 0.0002, 0.35, 5500], [_ms(0.92) * 2, 0.18, 4000]);
    if (!wallR && !inLobby) reps.push([_ms(2.2), 0.08, 2000]);
    if (inLobby) reps.splice(0, reps.length, [_ms(1.2), 0.3, 5000], [_ms(3.0), 0.12, 3000]);
    click(t, reps, { vol: 0.3, room: inLobby ? lob : cor, pan: wallR ? 0.15 : -0.1 });
  });
  // E6 (first person, the lobby): a near wall on her left, then the doorway ahead (a dark gap: almost nothing back)
  click(B.e6Clicks[0], [[_ms(0.9), 0.55, 6500]], { vol: 0.32, room: lob, pan: -0.35 });
  click(B.e6Clicks[1], [[_ms(3.9), 0.12, 3500], [_ms(4.4), 0.06, 2500]], { vol: 0.32, room: lob });
  for (const [t, p] of [[B.e6 + 2.75, -0.25], [B.e6 + 3.25, 0.25]]) K.put(fx.hit(fx.stoneModes(2.2), { width: 0.0008, amp: 1 }), t, { vol: 0.12, norm: true, pan: p, room: lob, wet: 0.5 });
  // scene 6: the three things not in the echo (one click each, plain), the steel and the blanket, the clues, F6
  click(B.f2 + 2.9, [[_ms(3.4), 0.3, 5000]], { vol: 0.22 });
  click(B.f3a + 0.15, [[_ms(6.1), 0.4, 5000]], { vol: 0.3, pan: -0.3 });
  click(B.f3c + 0.6, [[_ms(1.6), 0.08, 2500]], { vol: 0.26 });
  const steel = (t, v, pan) => { click(t, [[_ms(2.8), 0.7, 9000], [_ms(2.8) * 2, 0.15, 6000]], { vol: v, pan }); K.put(fx.hit(fx.metalModes(1850, 0.6), { width: 0.0005, amp: 1 }), t + _ms(1.4), { vol: 0.035, norm: true, pan }); };
  const soft = (t, v, pan) => click(t, [[_ms(3.0), 0.05, 900]], { vol: v, pan, wet: 0.6 });
  steel(B.f4b + 0.4, 0.34, 0.25); soft(B.f4c + 0.4, 0.32, -0.25);
  B.f5Clicks.forEach((t, i) => click(t, [[_ms(2 + (i % 3)), 0.32, 5000]], { vol: 0.24, pan: 0.2 * Math.sin(i) }));
  steel(B.f6Clicks[0], 0.36, 0.35);
  click(B.f6Clicks[1], [[0.045, 0.05, 2000], [0.07, 0.04, 1800]], { vol: 0.34, pan: 0.0, wet: 0.5 });   // the open door: the sound leaves
  soft(B.f6Clicks[2], 0.34, -0.35);
  // the cane: taps on the room's wooden floor, the corridor's tiles; her steps; the coach's steps
  for (const sg of BE_HERO_CTR) {
    if (!sg.p1) continue;
    const inCor = sg.p0.z > 4.5, rm = inCor ? (sg.p1.x > 6 ? lob : cor) : room;
    for (const t of beCaneTaps(sg)) K.put(fx.hit(inCor ? fx.stoneModes(2.4) : fx.woodModes(420, 0.7), { width: 0.0007, amp: 1 }), t, { vol: inCor ? 0.11 : 0.09, norm: true, pan: r.range(-0.2, 0.2), room: rm, wet: 0.5 });
    for (const h of beActPlan(sg)) if (h.t0 > sg.t0 && h.t0 < sg.t1 + 0.6) K.put(fx.step({ weight: 0.4, scuff: 0.15 }), h.t0, { vol: 0.06, norm: true, room: rm, wet: 0.6 });
  }
  for (const sg of BE_COACH_CTR) if (sg.p1) for (const h of beActPlan(sg)) if (h.t0 > sg.t0 && h.t0 < sg.t1 + 0.6) K.put(fx.step({ weight: 0.6, scuff: 0.2 }), h.t0, { vol: 0.05, norm: true, pan: -0.3, room, wet: 0.6 });
});
beSound('amb', 'centre', function (ctx, dest, K) {
  const { fx, sr, r } = K, B = BE;
  const bed = (t0, t1, lp, lvl, extra) => {
    const D = t1 - t0 + 1.5, n = Math.ceil(D * sr), L = fx.arr(D), R = fx.arr(D);
    for (const X of [L, R]) { const w = fx.white(n); GBX.bq(w, 'lp', lp, 0.6, sr); GBX.bq(w, 'hp', 40, 0.7, sr); for (let i = 0; i < n; i++) X[i] += w[i] * lvl; }
    if (extra) extra(L, R, n);
    K.putLR(L, R, t0, { vol: 1, fadeIn: 0.6, stop: t1 + 0.8, fade: 0.8 });
  };
  // the practice room: ventilation, birds through the windows, a ball in the next hall
  const roomBed = (t0, t1) => bed(t0, t1, 300, 0.09, (L, R, n) => {
    for (let t = 0.7; t < t1 - t0; t += r.range(1.4, 3.2)) GBX.mixIn(L, R, fx.shimmer(r.range(0.12, 0.3), r.range(2600, 4200), { skew: 0.3 }), Math.round(t * sr), 0.004, r.range(-0.9, -0.3));
    for (let t = 2.1; t < t1 - t0; t += r.range(2.5, 5)) GBX.mixIn(L, R, fx.hit(fx.panelModes(0.5), { width: 0.004, amp: 1 }), Math.round(t * sr), 0.012, 0.8);
  });
  roomBed(B.s5, B.e4); roomBed(B.s6, B.s7);
  // corridor and lobby: a lower hum, a door far away
  bed(B.e4, B.s6, 200, 0.1, (L, R) => { const h = fx.arr(B.s6 - B.e4); for (let i = 0; i < h.length; i++) h[i] = Math.sin(2 * Math.PI * 120 * i / sr) * 0.3 + Math.sin(2 * Math.PI * 240 * i / sr) * 0.1; GBX.mixIn(L, R, h, 0, 0.006, 0.3);
    GBX.mixIn(L, R, fx.hit(fx.woodModes(110, 2), { width: 0.006, amp: 1 }), Math.round(4.2 * sr), 0.03, 0.9); });
});
beSound('foley', 'centre', function (ctx, dest, K) {
  const { fx } = K, B = BE;
  for (const t of [B.s5 + 0.6, B.e2 + 0.1, B.e4 + 0.6, B.e6 + 0.1, B.f2 + 2.3, B.f6 + 0.1]) K.put(fx.breath(1.0, { inhale: true }), t, { vol: 0.05, norm: true });
  for (const t of [B.e2d + 0.4, B.e6 + 0.9, B.f4 + 0.6, B.f6 + 1.1, B.f6 + 2.9]) K.put(fx.rustle(0.7, { density: 220, rub: 0.4, lo: 400, hi: 4200, grain: 0.02 }), t, { vol: 0.05, norm: true });
});
beSound('music', 'centre', function (ctx, dest, K) {
  const B = BE, M = beMusicKit(ctx, K);
  // WEEKS: a patient, forward-moving piano figure under strings; brighter as the weeks go by
  const fig = ['D3', 'A3', 'F#4', 'A3'], fig2 = ['G2', 'D3', 'B3', 'D3'], fig3 = ['A2', 'E3', 'C#4', 'E3'];
  for (let t = B.s5 + 0.2, i = 0; t < B.e4 - 0.3; t += 0.5, i++) { const f = t < B.e2c ? fig : t < B.e3 ? fig2 : (i >> 3) % 2 ? fig3 : fig; M.piano(t, f[i % 4], 0.16 + 0.06 * MathX.ramp(t, B.s5, B.e4), 0.9, 0, 0.3); }
  M.strings(B.s5, B.e3 + 0.5, ['D2', 'A2', 'F#3'], 0.45, { att: 2.5, rel: 1, cut: 700, cutTo: 1200 });
  M.strings(B.e3, B.e4 + 0.4, ['G2', 'D3', 'B3', 'F#4'], 0.5, { att: 1.5, rel: 0.8, cut: 1100, cutTo: 2000 });
  M.bell(bnF(5, 'both').start, 'F#5', 0.22, 0.3); M.bell(bnF(5, 'improved').start + 0.2, 'A5', 0.2, -0.3);
  // the corridor: hushed, a held fifth that opens when the lobby opens; the first-person gap: a swell
  M.strings(B.e4 + 0.2, B.e6 + 0.4, ['A2', 'E3'], 0.4, { att: 2, rel: 1, cut: 600, cutTo: 900 });
  M.strings(B.e6 - 0.5, B.s6 + 1.2, ['D2', 'A2', 'D3', 'F#3', 'A3'], 0.85, { att: 1.2, rel: 1.4, cut: 900, cutTo: 2400 });
  [['A4', 0.5], ['D5', 2.05], ['F#5', 3.7]].forEach(([n, o]) => M.piano(B.e6 + o, n, 0.26, 1.6, 0, 0.5));
  // scene 6: lighter, then thoughtful; a small figure for each clue
  for (let t = B.s6 + 0.4, i = 0; t < B.f4 - 0.3; t += 0.75, i++) M.piano(t, ['B2', 'F#3', 'D3', 'F#3'][i % 4], 0.15, 0.9, 0, 0.3);
  M.strings(B.s6, B.f4 + 0.5, ['B1', 'F#2', 'D3'], 0.4, { att: 2, rel: 1, cut: 650 });
  M.strings(B.f4, B.f6, ['E2', 'B2', 'G3'], 0.42, { att: 1.5, rel: 1, cut: 700, cutTo: 1000 });
  ['A5', 'C#6', 'E6', 'A6'].forEach((n, i) => M.bell(B.f5clues + 0.25 + i * 0.35, n, 0.16, -0.4 + 0.27 * i));
  M.strings(B.f6 - 0.2, B.s7 + 1.0, ['A1', 'E2', 'A2', 'C#3', 'E3'], 0.8, { att: 1.0, rel: 1.6, cut: 800, cutTo: 2200 });
  B.f6Clicks.forEach((c, i) => M.piano(c + 0.6, ['E4', 'F#4', 'G#4'][i], 0.24, 1.2, [0.3, 0, -0.3][i], 0.5));
});
