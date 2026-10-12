/* =====================================================================
   SOUND — scene 8 (the room that swallows sound). The contrast IS the scene:
     bare room   a hard painted box 6 × 5 × 3 m: steps, cane taps and her click ring (bright early reflections at
                 8–20 ms, a ≈ 1.1 s tail); the heavy door shuts with a big, ringing thud
     the foam    as the wedges grow, the room's ring collapses (a wave of soft, swallowed thuds; the room tone drains)
     foam room   (hemi-anechoic) the click is almost dry: the only clear echo left is the hard floor's (9.0 ms below her
                 mouth); a few faint, dull scraps from the foam; then silence. Steps and taps are dry and close.
     music       a soft pad out of the brain scene, gone by the end of the transformation; on "useful" one piano note,
                 on "limits" a low unresolved one; no music in the 7 s without words (the absence is the moment)
   ===================================================================== */
const BE_LAB_BARE = { size: [6, 3, 5], rt60: 1.1, absorb: 0.08, bright: 0.78, wet: 0.5, seed: 91 };
const BE_LAB_FOAM = { size: [6, 3, 5], rt60: 0.07, absorb: 0.97, bright: 0.25, wet: 0.04, seed: 92 };
const BE_LAB_FLOOR_MS = 2 * 1.55 / 343;    // her mouth is 1.55 m above the hard floor

beSound('sfx', 'lab', function (ctx, dest, K) {
  const { fx, sr, r } = K, B = BE;
  const bare = K.room('labBare', Object.assign({ src: [2.6, 1.55, 2.7], lis: [2.6, 1.6, 2.72] }, BE_LAB_BARE));
  const door = K.room('labDoor', Object.assign({ src: [1.2, 1.2, 4.9], lis: [2.6, 1.6, 2.72] }, BE_LAB_BARE));
  const foam = K.room('labFoam', Object.assign({ src: [2.6, 1.55, 2.7], lis: [2.6, 1.6, 2.72] }, BE_LAB_FOAM));
  const u = (t) => beLabGrowth(t);
  // a click in the foam room: the floor's echo, a few dull scraps, nothing else
  const deadClick = (t, vol, pan = 0) => {
    const reps = [[BE_LAB_FLOOR_MS, 0.42, 6500]];
    for (let i = 0; i < 5; i++) reps.push([r.range(0.012, 0.022), r.range(0.015, 0.035), r.range(700, 1300)]);
    K.put(beWithEchoes(fx, beClickArr(fx, { f: 3000 }), reps), t, { vol, norm: true, pan, room: foam, wet: 0.3 });
  };
  // H1: the bare room: her click rings
  K.put(beClickArr(fx, { f: 3000 }), B.h1Click, { vol: 0.32, norm: true, room: bare, wet: 1.4 });
  // the heavy door: the closer's hiss, the slab, the seal, the latch; the bare room rings with it
  K.put(fx.creak(1.0, fx.metalModes(180, 0.4), { amp: 0.4 }), B.hDoor[0] + 0.1, { vol: 0.03, norm: true, pan: -0.5, room: door, wet: 0.6 });
  { const y = fx.slap([[62, 0.12, 1], [118, 0.08, 0.8], [240, 0.05, 0.5], [610, 0.02, 0.3], [1500, 0.008, 0.15]], { amp: 1, skin: 0.1, width: 0.004, len: 0.8 });
    K.put(y, B.hDoor[1], { vol: 0.5, norm: true, pan: -0.45, room: door, wet: 1.3 }); }
  K.put(fx.hit(fx.metalModes(1250, 0.35), { width: 0.0008, amp: 0.7 }), B.hDoor[1] + 0.06, { vol: 0.12, norm: true, pan: -0.45, room: door, wet: 0.8 });
  // H2: the room swallows itself: a wave of soft, muffled thuds (far corner → near), then none
  for (let t = B.hGrow[0]; t < B.hGrow[1]; t += r.range(0.03, 0.09)) {
    const k = MathX.ramp(t, B.hGrow[0], B.hGrow[1]);
    K.put(fx.slap([[r.range(70, 110), 0.05, 1], [r.range(160, 260), 0.03, 0.5]], { amp: 1, skin: 0.6, width: 0.006, len: 0.2 }), t, { vol: 0.035 * Math.sin(Math.PI * k) + 0.008, norm: true, pan: MathX.lerp(-0.7, 0.6, k) + r.range(-0.2, 0.2), lp: 900, room: bare, wet: 0.5 * (1 - k) });
  }
  { const d = B.hGrow[1] - B.hGrow[0] + 0.4, n = Math.ceil(d * sr), y = fx.white(n); GBX.bq(y, 'bp', 900, 0.6, sr);
    for (let i = 0; i < n; i++) { const k = i / n; y[i] *= Math.sin(Math.PI * Math.min(1, k * 1.1)) * (1 - k); }
    K.put(y, B.hGrow[0], { vol: 0.05, norm: true, room: bare, wet: 0.4 }); }
  // H3, H5, H7: clicks into the dead room (louder when no one is speaking)
  B.h3Clicks.forEach((t) => deadClick(t, 0.3));
  B.h5Clicks.forEach((t) => deadClick(t, 0.28, 0.1));
  B.h7Clicks.forEach((t) => deadClick(t, 0.4));
  // the cane: the tip on the hard floor (bright in the bare room, dry and close in the foam room); her steps
  for (const sg of BE_HERO_LAB) {
    for (const t of beCaneTaps(sg)) { const k = u(t); K.put(fx.hit(fx.stoneModes(2.6), { width: 0.0006, amp: 1 }), t, { vol: 0.1, norm: true, pan: r.range(-0.2, 0.2), room: k < 0.5 ? bare : foam, wet: k < 0.5 ? 0.9 : 0.3 }); }
    if (sg.p1) for (const h of beActPlan(sg)) if (h.t0 > sg.t0 && h.t0 < sg.t1 + 0.6) { const k = u(h.t0); K.put(fx.step({ weight: 0.38, scuff: 0.2 }), h.t0, { vol: k < 0.5 ? 0.06 : 0.07, norm: true, room: k < 0.5 ? bare : foam, wet: k < 0.5 ? 0.8 : 0.3 }); }
  }
  // H7b: the cane's sweep on the floor, then its tip meeting the foam (a soft, dead brush)
  K.put(fx.rustle(0.5, { density: 260, rub: 0.5, lo: 600, hi: 5000, grain: 0.01 }), B.h7b + 0.05, { vol: 0.03, norm: true, pan: -0.2, room: foam, wet: 0.2 });
  K.put(fx.rustle(0.45, { density: 260, rub: 0.5, lo: 600, hi: 5000, grain: 0.01 }), B.h7b + 0.5, { vol: 0.03, norm: true, pan: 0.2, room: foam, wet: 0.2 });
  K.put(fx.rustle(0.6, { density: 180, rub: 0.8, lo: 200, hi: 1400, grain: 0.03 }), B.hWalk[1] - 0.35, { vol: 0.05, norm: true, pan: -0.1, room: foam, wet: 0.1 });
});
beSound('amb', 'lab', function (ctx, dest, K) {
  const { fx, sr } = K, B = BE, D = B.s9 - B.s8 + 1.0, n = Math.ceil(D * sr), L = fx.arr(D), R = fx.arr(D);
  // bare room: ventilation and a faint, reflective room tone; it drains as the foam grows. Foam room: almost nothing
  // (a very low rumble from the building, and the faint hiss of her own hearing in the quiet)
  const w = [fx.white(n), fx.white(n)], lo = [fx.white(n), fx.white(n)];
  w.forEach((x) => { GBX.bq(x, 'bp', 1400, 0.4, sr); GBX.bq(x, 'hp', 200, 0.7, sr); });
  lo.forEach((x) => { GBX.bq(x, 'lp', 90, 0.7, sr); GBX.bq(x, 'hp', 22, 0.7, sr); });
  for (let i = 0; i < n; i++) {
    const t = B.s8 + i / sr, k = beLabGrowth(t), hum = 0.012 * Math.sin(2 * Math.PI * 120 * (i / sr)) * (1 - k);
    L[i] = w[0][i] * 0.05 * (1 - 0.92 * k) + lo[0][i] * (0.05 + 0.04 * k) + hum;
    R[i] = w[1][i] * 0.05 * (1 - 0.92 * k) + lo[1][i] * (0.05 + 0.04 * k) + hum;
  }
  K.putLR(L, R, B.s8, { vol: 0.8, fadeIn: 0.5, stop: B.s9 + 0.4, fade: 0.6 });
});
beSound('foley', 'lab', function (ctx, dest, K) {
  const { fx } = K, B = BE;
  const foam = K.room('labFoamF', Object.assign({ src: [2.6, 1.55, 2.7], lis: [2.6, 1.6, 2.72] }, BE_LAB_FOAM));
  const bare = K.room('labBareF', Object.assign({ src: [2.6, 1.55, 2.7], lis: [2.6, 1.6, 2.72] }, BE_LAB_BARE));
  K.put(fx.rustle(2.6, { density: 200, rub: 0.4, lo: 350, hi: 4500, grain: 0.018 }), B.s8 + 0.2, { vol: 0.05, norm: true, room: bare, wet: 0.5 });
  // in the dead room her own body is suddenly close: a breath held after the first click, let go after the second
  K.put(fx.breath(0.9, { inhale: true }), B.h7Clicks[0] - 0.8, { vol: 0.05, norm: true, room: foam, wet: 0.2 });
  K.put(fx.breath(1.4, {}), B.h7Clicks[1] + 0.9, { vol: 0.06, norm: true, room: foam, wet: 0.2 });
  K.put(fx.rustle(0.8, { density: 220, rub: 0.4, lo: 400, hi: 4200, grain: 0.02 }), B.h6 + 0.4, { vol: 0.035, norm: true, room: foam, wet: 0.2 });
  K.put(fx.rustle(1.0, { density: 220, rub: 0.4, lo: 400, hi: 4200, grain: 0.02 }), B.h7b, { vol: 0.04, norm: true, room: foam, wet: 0.2 });
});
beSound('music', 'lab', function (ctx, dest, K) {
  const B = BE, M = beMusicKit(ctx, K);
  // out of the white: a soft, warm chord that thins and is gone as the foam closes in
  M.strings(B.s8 - 0.2, B.hGrow[1] - 0.4, ['D2', 'A2', 'F#3', 'A3'], 0.55, { att: 0.6, rel: 2.6, cut: 1400, cutTo: 500 });
  M.piano(B.s8 + 0.6, 'F#4', 0.16, 2.2, -0.2, 0.6);
  // H3–H5: almost nothing: a very low, distant held fifth under the words
  M.strings(B.h3 + 0.5, B.h6 + 0.3, ['D2', 'A2'], 0.32, { att: 2.5, rel: 1.5, cut: 260 });
  // H6: "useful" (a single clear note) / "limits" (a low note that does not resolve)
  M.piano(bnE(8, 'useful').start + 0.05, 'A3', 0.2, 2.2, 0.15, 0.8);
  M.piano(B.hLimits + 0.05, 'C3', 0.22, 2.6, -0.1, 1.2);
  M.strings(B.hLimits, B.h7 + 0.8, ['C2', 'G2', 'D3'], 0.3, { att: 0.8, rel: 1.4, cut: 420 });
});
