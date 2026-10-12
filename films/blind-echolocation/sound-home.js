/* =====================================================================
   SOUND — scene 14 (the bedroom of the opening, months later). The same small, warm room (BE_BEDROOM), the same
   morning: birds and a far street beyond the window, the clock.
     the alarm    the opening's alarm, on the same table (the buzz through the wood and its three-note tone): it stops
                  after two cycles, under her thumb
     her          the phone lifted and set down square on the wood; her steps on the boards; her fingertips over the
                  dresser's corner; her hand on the lever, the latch, the door swinging away; onto the threshold; the
                  cane unfolding (three snaps: each section pulled home by its elastic), its tip on the floor
     beyond       a neighbour's steps in the hall, through the closed door (Z3); when the door opens the hall and the
                  open window at its end pour in: birds, the street, voices far below, air: a warm wash
     the click    one click on the threshold: the hall's far wall 1.2 m ahead (and the ceiling above her) answers at
                  ≈ 7 ms, the open door leaf beside her at ≈ 3 ms, the hall's two ends late and weak (≈ 22 and 48 ms), the bedroom behind her ≈ 26 ms
     music        the opening's felt-piano figure comes back as the alarm stops (the film began with it); D, Bm, G, A under
                  the words; it resolves on D after the click and rings out with the fade
   ===================================================================== */
const _beHomeEar = () => _beBox(new THREE.Vector3(-1.05, 1.5, -1.0));

// ================================================================================================= SFX
beSound('sfx', 'home', function (ctx, dest, K) {
  const { fx, sr } = K, B = BE, q = B.q14;
  const room = K.room('bedroom14', Object.assign({ src: _beBox(BE_APT.phone0), lis: _beBox(new THREE.Vector3(-1.0, 1.45, -1.3)) }, BE_BEDROOM));
  // the alarm (as in the opening): the buzz through the table and the three-note tone, until her thumb stops it
  const tableModes = [[172, 0.03, 1], [344, 0.02, 0.6], [520, 0.015, 0.45], [1150, 0.008, 0.25], [2300, 0.004, 0.12]];
  for (const o of [0, 0.6, 1.4]) { const t = q.ring + o; if (t >= q.off) break;
    const len = Math.min(0.45, q.off - t), y = fx.creak(len, tableModes, { rate: [168, 178], jit: 0.04, env: (u) => Math.min(1, u * 25, (1 - u) * 25) });
    K.put(y, t, { vol: t > q.pick ? 0.08 : 0.19, norm: true, pan: -0.2, room, wet: 0.9 }); }
  const mel = [['A5', 0], ['C#6', 0.17], ['E6', 0.34], ['A6', 0.6]];
  for (const k of [0, 1]) for (const [n, o] of mel) {
    const t = q.ring + k * 1.4 + o + 0.05; if (t >= q.off) break;
    const y = Float32Array.from(fx.bellBuf(gbMidi(n)).subarray(0, Math.round(0.9 * sr)));
    for (let i = 0; i < y.length; i++) y[i] *= Math.exp(-i / (0.22 * sr)) * (t + i / sr < q.off ? 1 : Math.exp(-(t + i / sr - q.off) * 60));
    GBX.bq(y, 'hp', 650, 0.7, sr); GBX.bq(y, 'peak', 2400, 1, sr, 4);
    K.put(y, t, { vol: 0.085, pan: -0.2, room, wet: 0.8, lp: 5200 });
  }
  // the click on the threshold: the hall answers at once (and the room behind her, softer)
  const hall = K.room('hall14', { size: [12, 2.6, 1.4], src: [6.2, 1.55, 0.2], lis: [6.25, 1.6, 0.3], rt60: 0.55, absorb: 0.32, bright: 0.5, damp: 4.0, seed: 141, wet: 0.5 });
  const c = beClickArr(fx, { f: 3050 }), ms = (m) => 2 * m / 343;
  const rL = [[ms(0.47), 0.12, 6000], [ms(1.18), 0.36, 5200], [ms(1.15) + 0.0012, 0.12, 3800], [ms(3.8), 0.09, 3000], [ms(4.4), 0.06, 2200], [ms(8.2), 0.035, 2000]];
  const rR = [[ms(1.18), 0.34, 5200], [ms(1.15) + 0.0009, 0.13, 3800], [ms(3.8), 0.05, 3000], [ms(4.4), 0.07, 2200], [ms(8.2), 0.05, 2000]];
  const Lr = beWithEchoes(fx, c, rL), Rr = beWithEchoes(fx, c, rR), m = Math.max(Lr.length, Rr.length), Lx = new Float32Array(m), Rx = new Float32Array(m); Lx.set(Lr); Rx.set(Rr);
  const pk = Math.max(GBX.peak(Lx), GBX.peak(Rx)); for (let i = 0; i < m; i++) { Lx[i] /= pk; Rx[i] /= pk; }
  K.putLR(Lx, Rx, B.qClick, { vol: 0.42, room: hall, wet: 0.8 });
});

// ================================================================================================= FOLEY
beSound('foley', 'home', function (ctx, dest, K) {
  const { fx, r } = K, B = BE, q = B.q14;
  const room = K.room('bedroomF14', Object.assign({ src: [1.2, 1.0, 0.6], lis: _beHomeEar() }, BE_BEDROOM, { wet: 0.25 }));
  const put = (y, t, vol, pan = 0, o = {}) => K.put(y, t, Object.assign({ vol, norm: true, pan, room, wet: 0.35 }, o));
  // the phone: fingers close on it; her thumb on the side button; set down square on the wood
  put(fx.rustle(0.12, { density: 300, rub: 0.3, lo: 900, hi: 6000, grain: 0.004 }), q.pick - 0.04, 0.05, -0.2);
  put(fx.hit([[2600, 0.003, 1], [5200, 0.002, 0.4]], { width: 0.0002, amp: 1 }), q.off - 0.01, 0.06, -0.15);
  put(fx.hit(fx.woodModes(420, 0.18).concat([[1900, 0.004, 0.3]]), { width: 0.0007, amp: 1 }), q.put, 0.1, -0.2);
  put(fx.breath(1.0, {}), q.let + 0.4, 0.035, 0);
  // her steps across the boards (and the turn out of the table); her fingertips over the dresser's corner
  for (const h of BE_Q_WALK) if (h.t0 > B.qWalk[0] - 0.1 && h.t0 < B.qWalk[1] + 0.6) put(fx.step({ weight: 0.4, scuff: 0.14, s: 1.05 }), h.t0, 0.075, h.side === 'L' ? -0.1 : 0.1);
  { let tc = null; for (let t = B.qWalk[0]; t < B.qWalk[1]; t += 0.02) { const p = BE_Q_WALK.atS(BE_Q_WALK.sOfT(t)).p; if (p.z > BE_Q.corner.z - 0.15) { tc = t; break; } }
    if (tc) put(fx.rustle(0.35, { density: 220, rub: 0.6, lo: 700, hi: 5000, grain: 0.006, env: (u) => Math.sin(Math.PI * u) }), tc - 0.1, 0.03, 0.3); }
  // the lever: her hand finds it (a light touch of metal), settles on it (Z3), presses it (the latch), the door swings
  put(fx.hit(fx.metalModes(2900, 0.12), { width: 0.0003, amp: 1 }), B.qLever - 0.05, 0.035, 0.15);
  put(fx.hit(fx.metalModes(3300, 0.08), { width: 0.0002, amp: 1 }), B.z3 + 5.6, 0.025, 0.15);
  put(fx.hit(fx.metalModes(1800, 0.2).concat(fx.woodModes(260, 0.12)), { width: 0.0005, amp: 1, extra: [[0.045, 0.0004, 0.6]] }), B.qOpen[0] - 0.05, 0.11, 0.1);
  put(fx.creak(0.9, [[210, 0.02, 1], [430, 0.012, 0.4]], { rate: [9, 16] }), B.qOpen[0] + 0.15, 0.012, 0.1);
  put(fx.rustle(1.6, { density: 90, rub: 0.2, lo: 150, hi: 1400, grain: 0.03, env: (u) => Math.sin(Math.PI * Math.min(1, u * 1.4)) }), B.qOpen[0] + 0.1, 0.03, 0);   // the air moves
  // onto the threshold
  for (const h of BE_Q_STEP) if (h.t0 > B.qStep[0] - 0.1) put(fx.step({ weight: 0.38, scuff: 0.1, s: 1.05 }), h.t0, 0.065, 0);
  // the cane: three snaps (each section pulled home by the elastic), then the tip on the floor
  B.qSnap.forEach((t, k) => { const y = fx.hit(fx.metalModes(2100 + 260 * k, 0.22).concat([[640 + 40 * k, 0.012, 0.4]]), { width: 0.0003, amp: 1, extra: [[0.004, 0.0002, 0.45]] });
    put(y, t, 0.12 - 0.01 * k, 0.12); put(fx.creak(0.07, [[180, 0.01, 1]], { rate: [90, 140] }), t - 0.06, 0.012, 0.12); });
  put(fx.hit(fx.woodModes(380, 0.2).concat([[2400, 0.003, 0.4]]), { width: 0.0005, amp: 1 }), B.qTip, 0.09, 0.05);
  put(fx.breath(1.2, { inhale: true }), B.z5 + 0.2, 0.03, 0);
  void r;
});

// ================================================================================================= AMBIENCE
beSound('amb', 'home', function (ctx, dest, K) {
  const { fx, sr, r } = K, B = BE, T0 = B.s14 - 0.3, T1 = B.end + 0.5, D = T1 - T0, n = Math.ceil(D * sr), L = fx.arr(D), R = fx.arr(D);
  const open = (t) => MathX.smooth(t, B.qOpen[0] + 0.1, B.qOpen[1]);
  // the room tone; the street beyond the window (her left in the opening); birds; the clock
  { const w = fx.white(n), w2 = fx.white(n); GBX.bq(w, 'lp', 260, 0.6, sr); GBX.bq(w, 'hp', 45, 0.7, sr); GBX.bq(w2, 'lp', 260, 0.6, sr); GBX.bq(w2, 'hp', 45, 0.7, sr);
    for (let i = 0; i < n; i++) { L[i] += w[i] * 0.11; R[i] += w2[i] * 0.11; } }
  { const w = fx.white(n); GBX.bq(w, 'bp', 420, 0.5, sr); GBX.bq(w, 'lp', 900, 0.7, sr); const wv = fx.wander(0.15); for (let i = 0; i < n; i++) w[i] *= 0.8 + 0.2 * wv(i / sr); GBX.mixIn(L, R, w, 0, 0.045, 0.5); }
  const chirp = (t, vol, pan, lp) => { const f = r.range(2900, 4600), k = r.int(2, 5), y = fx.arr(k * 0.12 + 0.1);
    for (let j = 0; j < k; j++) { const i0 = Math.round(j * r.range(0.09, 0.14) * sr), len = Math.round(r.range(0.04, 0.08) * sr), f1 = f * r.range(0.85, 1.15); let ph = 0; for (let i = 0; i < len && i0 + i < y.length; i++) { const u = i / len; ph += 2 * Math.PI * f1 * (1 + 0.25 * Math.sin(Math.PI * u)) / sr; y[i0 + i] += Math.sin(ph) * Math.sin(Math.PI * u); } }
    GBX.bq(y, 'lp', lp, 0.7, sr); GBX.mixIn(L, R, y, Math.round((t - T0) * sr), vol, pan); };
  for (let t = T0 + 0.4; t < T1 - 1; t += r.range(1.2, 3.2)) chirp(t, r.range(0.012, 0.022), r.range(0.4, 0.9), 3600);
  for (let t = Math.ceil(T0); t < T1; t += 1) GBX.mixIn(L, R, fx.hit([[3100, 0.006, 1], [5200, 0.004, 0.5], [1400, 0.01, 0.4]], { width: 0.0003, amp: 1 }), Math.round((t - T0) * sr), t > B.z3 && t < B.z4 ? 0.012 : 0.007, -0.3);
  // a neighbour's steps in the hall, through the closed door (left to right)
  for (const s of B.qNb) { const y = fx.step({ weight: 0.5, scuff: 0.2, s: 0.95 }); GBX.bq(y, 'lp', 800, 0.7, sr); GBX.mixIn(L, R, y, Math.round((s - T0) * sr), 0.03, MathX.clamp(-0.6 + 0.35 * (s - B.qNb[0]), -0.7, 0.7)); }
  // the door opens: the hall and its open window pour in (birds near, the street, voices far below, air)
  { const a = fx.white(n), b = fx.white(n); GBX.bq(a, 'bp', 600, 0.4, sr); GBX.bq(a, 'lp', 2400, 0.7, sr); GBX.bq(b, 'bp', 600, 0.4, sr); GBX.bq(b, 'lp', 2400, 0.7, sr);
    const ai = fx.white(n); GBX.bq(ai, 'bp', 3000, 0.4, sr); const wv = fx.wander(0.2);
    for (let i = 0; i < n; i++) { const t = T0 + i / sr, g = open(t) * (0.9 + 0.1 * wv(t)); L[i] += (a[i] * 0.06 + ai[i] * 0.008) * g; R[i] += (b[i] * 0.06 + ai[i] * 0.008) * g; } }
  for (let t = B.qOpen[0] + 0.5; t < T1 - 1; t += r.range(0.6, 1.5)) chirp(t, r.range(0.02, 0.04), r.range(-0.4, 0.4), 6000);
  for (let t = B.qOpen[0] + 1.2; t < T1 - 1.5; t += r.range(1.6, 3.2)) {   // voices far below: a few unintelligible syllables, now and then a laugh
    const f0 = r.range(150, 230), k = r.int(3, 7); let o = 0;
    for (let j = 0; j < k; j++) { const d = r.range(0.12, 0.24), y = beSyllable(fx, f0 * r.range(0.92, 1.1), d, 1, 1); GBX.bq(y, 'lp', 1400, 0.7, sr); GBX.mixIn(L, R, y, Math.round((t + o - T0) * sr), 0.012, r.range(-0.5, 0.5)); o += d + r.range(0.02, 0.08); }
  }
  const room = K.room('bedroomAmb14', Object.assign({ src: [3.5, 2, 1], lis: _beHomeEar() }, BE_BEDROOM, { wet: 0.2 }));
  K.putLR(L, R, T0, { vol: 1, fadeIn: 0.4, stop: T1, fade: 0.5, room, wet: 0.45 });
});

// ================================================================================================= MUSIC
beSound('music', 'home', function (ctx, dest, K) {
  const B = BE, M = beMusicKit(ctx, K), q = B.q14, w = (x) => bnE(14, x).start;
  // the opening's figure, as the alarm stops (the film began with it)
  const fig = ['D4', 'A4', 'F#4', 'E5', 'B3', 'F#4', 'D4', 'C#5'];
  const ch = [[q.off - 0.05, ['D3', 'A3', 'F#4']], [w('life') - 0.2, ['B2', 'F#3', 'D4']], [w('no') - 0.2, ['G2', 'D3', 'B3']], [w('echolocation') - 0.3, ['A2', 'E3', 'C#4']],
    [w('can') - 0.2, ['D3', 'A3', 'F#4']], [w('maybe') - 0.2, ['G2', 'D3', 'B3', 'D4']], [w('sometimes') - 0.2, ['A2', 'E3', 'C#4', 'E4']], [B.z5, null]];
  const figT = []; for (let t = q.off - 0.05; t < B.z5 - 0.2; t += 0.42) figT.push(t);
  figT.forEach((t, i) => { let c = 0; for (let k = 0; k < ch.length - 1; k++) if (t >= ch[k][0]) c = k;
    const shift = [0, -3, 5, 7, 0, 5, 7][c] || 0, n = gbMidi(fig[i % 8]) + (shift > 4 ? shift - 12 : shift);
    M.piano(t, n, 0.36 + 0.08 * (i % 2 ? 0 : 1), 1.4, i % 2 ? 0.25 : -0.25, 0.1); });
  for (let k = 0; k < ch.length - 1; k++) M.strings(ch[k][0] - 0.2, ch[k + 1][0] + 0.5, ch[k][1], 0.34, { att: 0.9, rel: 0.7, cut: 1300 });
  // the door opens: the strings open upward a little
  M.strings(B.qOpen[0], B.z5 + 0.3, ['A4', 'D5'], 0.12, { att: 2.0, rel: 1.0, cut: 3200, vib: 3 });
  // the end: held breath on A (no figure) for the click, then the resolution on D, left to ring out with the fade
  M.strings(B.z5 - 0.2, B.qClick + 0.25, ['A2', 'E3', 'A3', 'C#4'], 0.32, { att: 0.5, rel: 0.4, cut: 900 });
  M.strings(B.qClick + 0.45, B.end, ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'], 0.62, { att: 1.0, rel: 3.2, cut: 1300, cutTo: 900 });
  [['D3', 0], ['A3', 0.12], ['F#4', 0.24], ['D5', 0.42]].forEach(([n, o]) => M.piano(B.qClick + 0.5 + o, n, 0.34 - o * 0.2, 4.2, -0.2 + o, 0.3));
  M.piano(B.qClick + 2.3, 'A4', 0.18, 2.4, 0.25, 0.3);
  M.bell(B.qClick + 0.55, 'A5', 0.14, 0.2);
});
