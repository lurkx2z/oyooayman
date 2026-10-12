/* =====================================================================
   SOUND — scene 12 (the old drill hall, months later). A big, hard room: brick walls 11 m to either side, the end wall
   and its steel doors 8 m behind the start, a timber roof 9–12 m up, the far wall 34 m off (RT60 ≈ 2.4 s).
     arrival      the evening outside through the open doors (traffic far off, a blackbird), cut to a dull murmur when the
                  two steel leaves swing shut (a deep boom that runs round the hall); her steps and cane on concrete, the
                  instructor's softer soles
     the hall     the lamps' hum; the roof ticking as it cools; when the lamps go out bank by bank, a relay clacks at the
                  panel by the door for each bank and its hum sags away, far end first. Then the room is almost silent
     M2 clicks    the hall answers late: the obstacle 7 m ahead at ≈ 41 ms, the end wall at ≈ 47 ms, the roof ≈ 50 ms, the
                  side walls at ≈ 64 ms (one in each ear), the far wall a faint, dull ≈ 200 ms, and a long tail
     the test     G1: the obstacle's face 1.9 m ahead: one broad, strong return at ≈ 11 ms
                  G2 (head left, into the bay): returns from close on every side (≈ 25, 35, 38 ms) and a flutter between the
                  bay's walls 2.2 m apart (one every ≈ 12.8 ms), bright, piling up
                  G3 (head right, into the passage): the obstacle's end, small, at ≈ 14 ms; the crates faint and to the
                  right; then nothing near, only the hall far off and late
                  the cane: a hollow knock on the obstacle's plywood edge; her steps go out into the open hall
     music        the bedroom's piano figure comes back in the hall (months later); the lamps going out leave one low
                  drone; on the sweep a low note for each thing named; in the dark, almost nothing; the gap builds: a
                  note after each answer, then G, A and D as she checks and goes through (it carries into scene 13)
   ===================================================================== */
const BE_ARENA_ROOM = { size: [42, 10.2, 22], rt60: 2.4, absorb: 0.16, bright: 0.5, damp: 3.4, seed: 161 };
const _beAms = (m) => 2 * m / 343;

// where she is and which way she faces (her blocking, scene12.js); the coach likewise
function beArenaAt(segs, t) {
  const C = segs._at || (segs._at = new Map()), key = Math.round(t * 50);   // (cached on a 20 ms grid: the sound builders ask a lot)
  if (C.has(key)) return C.get(key);
  const v = _beArenaAt(segs, key / 50); C.set(key, v); return v;
}
function _beArenaAt(segs, t) {
  let seg = segs[0]; for (const s of segs) if (t >= s.t0) seg = s;
  let x = seg.p0.x, z = seg.p0.z, yaw;
  if (seg.p1) { const plan = beActPlan(seg), p = plan.atS(plan.sOfT(MathX.clamp(t, seg.t0, seg.t1))).p; x = p.x; z = p.z; yaw = Math.atan2(seg.p1.x - seg.p0.x, seg.p1.z - seg.p0.z); }
  else yaw = typeof seg.yaw === 'function' ? seg.yaw(t) : typeof seg.yaw === 'number' ? seg.yaw : Math.PI / 2;
  return { x, z, yaw };
}
// gain and pan of a source at (x, z) heard by Noor at t (her right is (−cos yaw, sin yaw))
function _beArPlace(x, z, t, ref = 1.5, pw = 1.1) {
  const E = beArenaAt(BE_HERO_ARENA, t), dx = x - E.x, dz = z - E.z, d = Math.sqrt(dx * dx + dz * dz + 0.3);
  const pan = MathX.clamp((-dx * Math.cos(E.yaw) + dz * Math.sin(E.yaw)) / d, -1, 1) * 0.85;
  return { d, g: Math.pow(ref / Math.max(d, ref), pw), pan };
}
const _beArRoom = (K, name, wet = 0.5) => K.room(name, Object.assign({ src: [8, 1.5, 11.5], lis: [8.4, 1.6, 11], wet }, BE_ARENA_ROOM));
// 0 = the doors open, 1 = shut
const beArenaShut = (t) => MathX.smooth(t, BE.s12 + 2.9, BE.s12 + 3.2);

// ================================================================================================= AMBIENCE
beSound('amb', 'arena', function (ctx, dest, K) {
  const { fx, sr, r } = K, B = BE, T0 = B.s12 - 0.6, T1 = B.s13 + 7, n = Math.ceil((T1 - T0) * sr), CR = 64;
  const room = _beArRoom(K, 'arenaAmb', 0.55);
  const L = new Float32Array(n), R = new Float32Array(n), at = (t) => Math.round((t - T0) * sr);
  // outside (through the doors behind her): the evening — a far traffic wash, a blackbird; shut doors leave a murmur
  { const oL = fx.white(n), oR = fx.white(n), w = fx.wander(0.15); for (const x of [oL, oR]) { GBX.bq(x, 'lp', 700, 0.6, sr); GBX.bq(x, 'hp', 60, 0.7, sr); }
    const bird = new Float32Array(n);
    for (let t = 0.8; t < 7; t += r.range(1.2, 2.4)) { const k = r.int(3, 6); for (let i = 0; i < k; i++) { const f = r.range(1900, 3200), d = r.range(0.06, 0.16), y = fx.shimmer(d, f, { skew: r.range(0.3, 0.9) }); GBX.mixIn(bird, bird, y, Math.round((t + i * r.range(0.09, 0.16)) * sr), 0.5, 0); } }
    for (let i0 = 0; i0 < n; i0 += CR) { const t = T0 + i0 / sr, sh = beArenaShut(t), P = _beArPlace(-8.2, 0, t, 3, 0.9), g = (0.06 + 0.02 * w(t)) * P.g * (1 - 0.82 * sh), gl = Math.cos((P.pan + 1) * Math.PI / 4), gr = Math.sin((P.pan + 1) * Math.PI / 4);
      for (let i = i0; i < Math.min(n, i0 + CR); i++) { const b = bird[i] * 0.03 * P.g * (1 - sh); L[i] += (oL[i] * g + b) * gl * 1.3; R[i] += (oR[i] * g + b) * gr * 1.3; } } }
  // the hall itself: still air (a low rumble), the roof ticking now and then far overhead
  { const hL = fx.white(n), hR = fx.white(n); for (const x of [hL, hR]) { GBX.bq(x, 'lp', 160, 0.6, sr); GBX.bq(x, 'hp', 30, 0.7, sr); } for (let i = 0; i < n; i++) { L[i] += hL[i] * 0.05; R[i] += hR[i] * 0.05; } }
  for (let t = T0 + 1.5; t < T1 - 1; t += r.range(1.6, 4.5)) { const y = fx.hit(fx.woodModes(r.range(600, 1100), 0.25), { width: 0.0003, amp: 1 }); GBX.mixIn(L, R, y, at(t), r.range(0.004, 0.009), r.range(-0.8, 0.8)); }
  // the lamps: each bank's hum (100 Hz and its harmonics, a little ballast buzz) sags away when it goes out
  for (let x = -4; x <= 32; x += 6) {
    const ph = r.range(0, 6), y = new Float32Array(n), bz = fx.white(n); GBX.bq(bz, 'bp', 2400, 3, sr);
    for (let i0 = 0; i0 < n; i0 += CR) { const t = T0 + i0 / sr, k = beArenaDim(x, t), on = (k - 0.07) / 0.93, sag = 1 - 0.04 * (1 - on), P = _beArPlace(x, 0, t, 4, 1.0);
      for (let i = i0; i < Math.min(n, i0 + CR); i++) { const tt = i / sr; y[i] = Math.max(0, on) * P.g * (0.5 * Math.sin(2 * Math.PI * 100 * sag * tt + ph) + 0.25 * Math.sin(2 * Math.PI * 200 * sag * tt) + 0.12 * Math.sin(2 * Math.PI * 300 * sag * tt + 1) + 0.15 * bz[i]); } }
    const p = MathX.clamp((x - 2) / 30, -1, 1) * 0.3; GBX.mixIn(L, R, y, 0, 0.0045, p);
  }
  K.putLR(L, R, T0, { vol: 1.1, fadeIn: 0.9, stop: T1, fade: 3.0, room, wet: 0.5 });
});

// ================================================================================================= FOLEY
beSound('foley', 'arena', function (ctx, dest, K) {
  const { fx, r } = K, B = BE, room = _beArRoom(K, 'arenaF', 0.6);
  const place = (x, z, t, y, vol, o = {}) => { const P = _beArPlace(x, z, t, o.ref || 1.3, o.pw || 1.1); K.put(y, t, { vol: vol * P.g, pan: P.pan, room, wet: o.wet ?? 0.6, norm: true }); };
  // her steps and her cane on the concrete (the hall answers each one); the last ones go out into the open hall
  for (const sg of BE_HERO_ARENA) {
    if (!sg.p1) continue;
    for (const h of beActPlan(sg)) if (h.t0 > sg.t0 && h.t0 < sg.t1 + 0.5) K.put(fx.step({ weight: 0.42, scuff: 0.1, s: 1.15 }), h.t0, { vol: 0.07, norm: true, pan: h.side === 'L' ? -0.12 : 0.12, room, wet: 0.65 });
    for (const t of beCaneTaps(sg)) if (Math.abs(t - B.mTap) > 0.05) K.put(fx.hit(fx.stoneModes(2.6), { width: 0.0005, amp: 1 }), t, { vol: 0.085, norm: true, pan: 0.22, room, wet: 0.6 });
  }
  // the instructor: softer soles, a step behind; quieter still when she moves to watch during the test
  for (const sg of BE_COACH_ARENA) if (sg.p1) for (const h of beActPlan(sg)) if (h.t0 > sg.t0 && h.t0 < sg.t1 + 0.5) place(h.p.x, h.p.z, h.t0, fx.step({ weight: 0.55, scuff: 0.22, s: 0.95 }), h.t0 > B.m6 ? 0.025 : 0.06);
  // the hand on her shoulder (a jacket's cloth); her breath before the test, and out when she is through
  K.put(fx.rustle(0.4, { density: 260, rub: 0.45, lo: 500, hi: 4500, grain: 0.012, env: (u) => Math.exp(-u * 4) }), B.mTouch[0] + 0.35, { vol: 0.05, norm: true, pan: -0.3, room, wet: 0.3 });
  K.put(fx.breath(1.1, { inhale: true }), B.m7 - 0.15, { vol: 0.045, norm: true, room, wet: 0.35 });
  K.put(fx.breath(1.0, {}), B.mRet + 0.15, { vol: 0.04, norm: true, room, wet: 0.35 });
  void r;
});

// ================================================================================================= SFX
beSound('sfx', 'arena', function (ctx, dest, K) {
  const { fx, sr, r } = K, B = BE, room = _beArRoom(K, 'arenaS', 0.85);
  // the doors: the two steel leaves swing shut on their closers (a long hinge groan), meet with a deep boom and latch
  { const t0 = B.s12 + 1.2, P = _beArPlace(-8.1, 0, B.s12 + 3, 2, 1.0);
    const g = fx.creak(1.8, [[180, 0.02, 1], [367, 0.014, 0.5], [610, 0.01, 0.3]], { rate: [18, 40] }); for (let i = 0; i < g.length; i++) g[i] *= Math.sin(Math.PI * Math.min(1, i / g.length * 1.1));
    K.put(g, t0 + 0.1, { vol: 0.02, norm: true, pan: P.pan, room, wet: 0.7 });
    const y = fx.hit(fx.metalModes(68, 2.2).concat(fx.panelModes(1.6)), { width: 0.004, amp: 1, len: 2.6, extra: [[0.035, 0.002, 0.45]] });
    K.put(y, B.s12 + 3.2, { vol: 0.13, norm: true, pan: P.pan, lp: 2200, room, wet: 1.0 });
    K.put(fx.hit(fx.metalModes(1250, 0.3), { width: 0.0003, amp: 1 }), B.s12 + 3.29, { vol: 0.035, norm: true, pan: P.pan, room, wet: 0.6 }); }
  // the lamps: a relay at the panel by the door clacks for each bank, far end first
  for (let x = 32; x >= -4; x -= 6) { const t = B.mDim + (32 - x) / 36 * 1.6 + 0.03, P = _beArPlace(-7.6, -1.6, t, 2, 1.0);
    K.put(fx.hit(fx.metalModes(r.range(1700, 2100), 0.18).concat(fx.panelModes(0.3)), { width: 0.0004, amp: 1 }), t, { vol: 0.045 + 0.004 * (32 - x) / 6, norm: true, pan: P.pan, room, wet: 0.8 }); }
  // the clicks. Each one is her own click with the answers the room gives back at her ears (stereo: left, right)
  const clickLR = (t, repsL, repsR, o = {}) => { const c = beClickArr(fx, { f: o.f || 3000 }), Lr = beWithEchoes(fx, c, repsL), Rr = beWithEchoes(fx, c, repsR);
    const m = Math.max(Lr.length, Rr.length), Lx = new Float32Array(m), Rx = new Float32Array(m); Lx.set(Lr); Rx.set(Rr);
    const pk = Math.max(GBX.peak(Lx), GBX.peak(Rx)); for (let i = 0; i < m; i++) { Lx[i] /= pk; Rx[i] /= pk; }
    K.putLR(Lx, Rx, t, { vol: o.vol ?? 0.3, room, wet: o.wet ?? 0.9 }); };
  // M2: the hall (she faces +x at the start): the obstacle ahead, the doors behind, the roof, a side wall in each ear,
  // the far end very late
  for (const [k, t] of B.mL2.entries()) {
    const common = [[_beAms(7), 0.2, 5000], [_beAms(8), 0.15, 4200], [_beAms(8.6), 0.12, 3200], [_beAms(34), 0.05, 1800]];
    clickLR(t, common.concat([[_beAms(11), 0.22, 3800], [_beAms(11) + 0.0013, 0.1, 3000]]), common.concat([[_beAms(11.05), 0.2, 3800], [_beAms(11.05) + 0.0017, 0.09, 3000]]), { vol: 0.3 - 0.02 * k, f: 3050 + 80 * k, wet: 1.0 });
  }
  // G1: ahead: the obstacle's face, 1.9 m: one broad, strong answer (and the floor–face corner a hair later)
  { const rp = [[_beAms(1.9), 0.62, 7500], [_beAms(1.95) + 0.0012, 0.25, 5000], [_beAms(1.9) * 2, 0.12, 3500]]; clickLR(B.mC[0], rp, rp, { vol: 0.33, f: 3100, wet: 0.55 }); }
  // G2: head left, into the bay: close on every side, then the flutter between its walls (2.2 m apart: every 12.8 ms)
  { const rp = [[0.025, 0.3, 6000], [0.035, 0.32, 5500], [0.0378, 0.22, 5000]], fl = _beAms(2.2);
    for (let k = 1; k <= 9; k++) rp.push([0.035 + k * fl, 0.24 * Math.pow(0.72, k), 4800 - 260 * k]);
    clickLR(B.mC[1], rp.map(([d, g, f]) => [d, g * 1.15, f]), rp.map(([d, g, f]) => [d + 0.0006, g * 0.8, f]), { vol: 0.31, f: 3000, wet: 0.5 }); }
  // G3: head right, into the passage: the obstacle's end (small, near), the crates (faint, right), then only the hall far off
  { const far = [[_beAms(29), 0.05, 1600], [_beAms(31), 0.035, 1400]];
    clickLR(B.mC[2], [[_beAms(2.4), 0.09, 4500]].concat(far), [[_beAms(2.4), 0.07, 4500], [_beAms(4.6), 0.1, 3200]].concat(far), { vol: 0.31, f: 3150, wet: 1.0 }); }
  // the cane on the obstacle's edge: a hollow plywood knock, close; the flat buzzes a little against its frame
  { const y = fx.hit(fx.woodModes(310, 0.55).concat([[1450, 0.012, 0.3]]), { width: 0.0006, amp: 1, extra: [[0.006, 0.0004, 0.35]] });
    const q = fx.creak(0.12, [[880, 0.006, 1], [1760, 0.004, 0.4]], { rate: [140, 220] }); for (let i = 0; i < q.length && i + 200 < y.length; i++) y[i + 200] += q[i] * 0.12;
    K.put(y, B.mTap, { vol: 0.16, norm: true, pan: -0.35, room, wet: 0.45 }); }
  void sr;
});

// ================================================================================================= MUSIC
beSound('music', 'arena', function (ctx, dest, K) {
  const B = BE, M = beMusicKit(ctx, K);
  // months later: the bedroom's figure again, slower, in the big room
  const fig = ['D4', 'A4', 'F#4', 'E5', 'B3', 'F#4', 'D4', 'C#5'];
  for (let i = 0; B.s12 + 0.5 + i * 0.6 < B.m3 - 0.2; i++) { const t = B.s12 + 0.5 + i * 0.6; M.piano(t, fig[i % 8], 0.21 + 0.04 * (i % 2 ? 0 : 1) + 0.06 * MathX.ramp(t, B.s12, B.m2), 1.6, i % 2 ? 0.3 : -0.3, 0.5); }
  M.strings(B.s12 - 0.2, B.m3 + 0.6, ['D3', 'A3', 'F#4'], 0.24, { att: 2.0, rel: 1.2, cut: 1300, keys: [[B.m2, 0.85], [B.m3 - 0.4, 1.0]] });
  M.piano(B.mL2[0] + 0.12, 'A5', 0.16, 2.0, 0.35, 0.8); M.piano(B.mL2[1] + 0.12, 'F#5', 0.15, 2.0, -0.35, 0.8);
  // the lights go out: the figure stops; a low drone stays, and one high harmonic, very quiet
  M.piano(B.mDim + 1.7, 'D2', 0.32, 3.0, 0, 1.5);
  M.strings(B.mDim - 0.3, B.m7 + 0.4, ['D2', 'A2'], 0.5, { att: 2.0, rel: 1.0, cut: 380, cutTo: 520, vib: 2 });
  M.strings(B.m4 + 0.5, B.m7 + 0.3, ['E5', 'A5'], 0.12, { att: 2.5, rel: 1.0, cut: 3000, vib: 3 });
  // the sweep: a low note on each thing named
  [['large', 'D2'], ['obstacle', 'A1'], ['two', 'B1'], ['passages', 'G1']].forEach(([w, nn]) => M.piano(bnE(12, w).start + 0.02, nn, 0.24, 2.5, 0, 1.2));
  // the dark: almost nothing; a soft high note on "practiced" and on "begins"
  M.piano(bnE(12, 'skills').start + 0.6, 'E5', 0.13, 2.2, 0.3, 1.0);
  M.piano(bnE(12, 'begins').start + 0.25, 'A4', 0.15, 2.5, -0.3, 1.2);
  // the gap builds: a note after each answer (the bay's a little sour, the open side clear), then G, A, D as she
  // checks the edge and goes through; it carries on into scene 13
  M.piano(B.mC[0] + 0.45, 'D4', 0.22, 1.8, 0, 0.8);
  M.piano(B.mC[1] + 0.5, 'C5', 0.16, 1.4, -0.4, 0.6); M.piano(B.mC[1] + 0.56, 'C#5', 0.12, 1.4, -0.4, 0.6);
  M.piano(B.mC[2] + 0.5, 'A4', 0.2, 2.2, 0.4, 0.8); M.piano(B.mC[2] + 0.62, 'E5', 0.17, 2.2, 0.4, 0.8);
  M.strings(B.mC[0] - 0.2, B.m8 + 0.4, ['D3', 'A3'], 0.4, { att: 1.5, rel: 0.6, cut: 600, cutTo: 1100 });
  M.strings(B.m8, B.mTap + 0.4, ['G2', 'D3', 'B3', 'D4'], 0.6, { att: 0.9, rel: 0.5, cut: 900, cutTo: 1500 });
  M.strings(B.mTap, B.mRet + 0.3, ['A2', 'E3', 'C#4', 'E4'], 0.7, { att: 0.3, rel: 0.4, cut: 1200, cutTo: 1900 });
  M.strings(B.mRet - 0.1, B.s13 + 4.0, ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'], 0.9, { att: 0.5, rel: 2.5, cut: 1500, cutTo: 2600 });
  [['G3', 0], ['B3', 0.18], ['D4', 0.36], ['G4', 0.54]].forEach(([nn, o]) => M.piano(B.m8 + 0.1 + o, nn, 0.2, 1.5, -0.2 + o, 0.6));
  [['A3', 0], ['C#4', 0.15], ['E4', 0.3], ['A4', 0.45]].forEach(([nn, o]) => M.piano(B.mTap + 0.05 + o, nn, 0.24, 1.5, 0.2 - o, 0.6));
  [['D4', 0], ['F#4', 0.14], ['A4', 0.28], ['D5', 0.42], ['F#5', 0.6]].forEach(([nn, o]) => M.piano(B.mRet + o, nn, 0.28, 2.6, -0.3 + o, 1.0));
});
