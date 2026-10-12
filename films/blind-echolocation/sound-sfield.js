/* =====================================================================
   SOUND — scene 13 (the rise out of the hall; the city as sound). The hall's answers first, from where she stands;
   then the city, heard from where the camera is (the shots are a metaphor, the sound follows the picture):
     the hall     her five clicks at the passage's end: the crates ≈ 34 ms, the partition ≈ 40 ms, the near side wall
                  ≈ 46 ms, the roof ≈ 50 ms, the far side wall ≈ 82 ms, both end walls ≈ 122 ms, a long tail (each a
                  little different: her head turns). The instructor's soft steps on "information you once ignored"
     the city    a far wash (the whole city at once), then the cars (the same cars as the picture: tyres, engine, a Doppler
                  drop as one passes the camera), the pedestrians' steps (the same steps as the rings), the fountain in
                  the square, the weir on the river, birds in the park's trees
     the corner   the woman's clicks: the building's corner at her left ≈ 9 ms, the lamp post ≈ 13 ms (small, bright),
                  the parked car ≈ 26 ms (metal), the facade across the crossing ≈ 103 ms (dull); open to her right.
                  Her cane on the kerb's edge
     the bridge   the man's clicks: the railing's posts ≈ 9 ms (a little comb), the water below ≈ 23 ms (strong, it is a
                  mirror for sound), the quay wall ≈ 100 ms, buildings far off ≈ 230 ms. His steps and cane on stone
     the gap      three measured clicks over the city: hers in the hall (left, the hall's long tail), the corner (right,
                  quick and close), the bridge (centre, the water). The music peaks and resolves into scene 14
   ===================================================================== */
const _beSfMs = (m) => 2 * m / 343;

// the camera at t (scene 13's city shots): position and its right-hand direction (for the pan)
function beSfEar(t) {
  const B = BE, id = t < B.n4 ? 'C1' : t < B.n5 ? 'C2' : t < B.ng ? 'C3' : 'G13';
  const sh = BE_SHOTS.find((s) => s.id === id), c = sh.cam(t), p = c.pos, at = id === 'C3' ? beArenaAt(BE_SF_CAST.B, t) : { x: c.at.x, z: c.at.z };
  const fx = at.x - p.x, fz = at.z - p.z, fl = Math.hypot(fx, fz) || 1;
  return { x: p.x, y: p.y, z: p.z, rx: -fz / fl, rz: fx / fl };
}
function _beSfPlace(x, y, z, E, ref = 4, pw = 1.1) {
  const dx = x - E.x, dy = y - E.y, dz = z - E.z, d = Math.sqrt(dx * dx + dy * dy + dz * dz + 0.3), h = Math.hypot(dx, dz) + 0.5;
  const pan = MathX.clamp((dx * E.rx + dz * E.rz) / h, -1, 1) * 0.8 * MathX.clamp(h / (Math.abs(dy) + 1), 0, 1), a = (pan + 1) * Math.PI / 4;
  return { d, g: Math.pow(ref / Math.max(d, ref), pw), gl: Math.cos(a), gr: Math.sin(a), pan };
}
// rooms: the hall (from where she stands), the street outdoors (a short, open answer), the city as a whole
const _beSfHall = (K, name, wet) => K.room(name, Object.assign({ src: [21, 1.5, 14], lis: [21.3, 1.6, 13.6], wet }, BE_ARENA_ROOM));
const _beSfStreet = (K, name, wet = 0.25) => K.room(name, { size: [36, 22, 70], src: [6, 1.5, 30], lis: [6.5, 1.6, 31], rt60: 0.8, absorb: 0.55, bright: 0.45, damp: 4.0, seed: 171, wet });

// ================================================================================================= AMBIENCE
beSound('amb', 'sfield', function (ctx, dest, K) {
  const { fx, sr, r } = K, B = BE, T0 = B.n3 - 1.2, T1 = B.s14 + 0.4, n = Math.ceil((T1 - T0) * sr), CR = 64;
  const L = new Float32Array(n), R = new Float32Array(n), room = _beSfStreet(K, 'sfAmb', 0.2);
  const ears = []; for (let i0 = 0; i0 < n; i0 += CR) ears.push(beSfEar(T0 + i0 / sr));
  const earAt = (t) => ears[MathX.clamp(Math.round((t - T0) * sr / CR), 0, ears.length - 1)];
  // the whole city at once: a far, dark wash that widens as the city appears (and goes with the picture at the end)
  const env = (t) => MathX.smooth(t, B.n3 - 0.6, B.n3 + 3.0) * (1 - MathX.smooth(t, B.s14 - 1.4, B.s14 + 0.3));
  { const wL = fx.white(n), wR = fx.white(n), w = fx.wander(0.12); for (const x of [wL, wR]) { GBX.bq(x, 'lp', 520, 0.6, sr); GBX.bq(x, 'hp', 45, 0.7, sr); }
    for (let i = 0; i < n; i++) { const t = T0 + i / sr, g = 0.075 * env(t) * (0.85 + 0.15 * w(t)); L[i] += wL[i] * g; R[i] += wR[i] * g; } }
  // the cars: tyres and engine, from the camera (a Doppler drop as one passes)
  { const N = Math.ceil(7 * sr), tb = fx.white(N), td = fx.white(N); GBX.bq(tb, 'bp', 1100, 0.45, sr); GBX.bq(tb, 'hp', 320, 0.7, sr); GBX.bq(td, 'lp', 380, 0.7, sr); GBX.bq(td, 'hp', 45, 0.7, sr);
    const nb = 1 / Math.sqrt(GBX.peak(tb) * 0.2 + 1e-9), nd = 1 / Math.sqrt(GBX.peak(td) * 0.2 + 1e-9), tab = _beEngineTab(r, 1.1, 7);
    for (let c = 0; c < BE_SF.cars.length; c++) {
      const f0 = r.range(48, 66), off = r.int(0, N - 1), wv = fx.wander(0.4); let ph = r.next(), prevD = null;
      for (let i0 = 0; i0 < n; i0 += CR) {
        const t = T0 + i0 / sr, q = BeSoundCity.prototype.carAt(c, t).p, P = _beSfPlace(q.x, 0.6, q.z, ears[i0 / CR], 5, 1.15);
        if (P.d > 160) { prevD = null; continue; }
        const vr = prevD == null ? 0 : MathX.clamp((P.d - prevD) * sr / CR, -30, 30); prevD = P.d;
        const dop = 343 / (343 + vr), near = 1 / (1 + (P.d / 16) * (P.d / 16)), G = P.g * env(t) * 1.1, inc = f0 * dop * (1 + 0.02 * wv(t)) / sr / 2;
        for (let j = 0; j < CR && i0 + j < n; j++) { const i = i0 + j, k = (off + i) % N; ph += inc; if (ph >= 1) ph -= 1;
          const s = G * (tb[k] * nb * near * 0.9 + td[k] * nd * (0.5 + 0.5 * near) + tab[(ph * 2048) | 0] * 0.04 * (0.2 + 0.8 * near)); L[i] += s * P.gl; R[i] += s * P.gr; }
      }
    } }
  // the fountain in the square (a splash: falling water on water) and the weir on the river (a broad, low rush)
  for (const [x, y, z, lo, hi, ref, lvl] of [[49, 1.4, 0, 900, 5200, 6, 0.22], [52, -1.6, 135, 160, 2600, 10, 0.34]]) {
    const a = fx.white(n), b = fx.white(n), w = fx.wander(0.6); GBX.bq(a, 'bp', Math.sqrt(lo * hi), 0.5, sr); GBX.bq(a, 'hp', lo, 0.7, sr); GBX.bq(a, 'lp', hi, 0.7, sr); GBX.bq(b, 'lp', lo * 1.4, 0.7, sr);
    const grain = new Float32Array(n); for (let i = 0; i < n; i += Math.round(r.range(0.006, 0.03) * sr)) grain.fill(r.range(0.55, 1.0), i, Math.min(n, i + Math.round(0.03 * sr)));
    for (let i0 = 0; i0 < n; i0 += CR) { const t = T0 + i0 / sr, P = _beSfPlace(x, y, z, ears[i0 / CR], ref, 1.1), g = lvl * P.g * env(t);
      for (let j = 0; j < CR && i0 + j < n; j++) { const i = i0 + j, s = g * (a[i] * grain[i] * (0.8 + 0.2 * w(t)) + b[i] * 0.5); L[i] += s * P.gl; R[i] += s * P.gr; } }
  }
  // the pedestrians' steps (the same steps the rings show) within 70 m of the camera
  for (let p = 0; p < BE_SF_PEDS.length; p++) {
    const ph = (p * 0.137) % 0.55, w = r.range(0.3, 0.55);
    for (let s = Math.ceil((T0 + 0.3 - ph) / 0.55) * 0.55 + ph; s < T1 - 0.3; s += 0.55) {
      const q = beSfPedAt(p, s), P = _beSfPlace(q.x, 0, q.z, earAt(s), 3, 1.2); if (P.d > 70 || env(s) < 0.02) continue;
      GBX.mixIn(L, R, fx.step({ weight: w, scuff: 0.15, s: 1.1 }), Math.round((s - T0) * sr), 0.05 * P.g * env(s), P.pan);
    }
  }
  // the birds in the park's trees (where the rings show them)
  { const sf = FILM._app && FILM._app.sets.sfield;
    if (sf && sf.trees) for (const [k, tb] of _beSfBirds) { if (tb < T0 || tb > T1 - 1 || !sf.trees[k]) continue; const q = sf.trees[k], P = _beSfPlace(q.x, q.y + 2, q.z, earAt(tb), 8, 1.0);
      for (let i = 0, m = r.int(2, 5); i < m; i++) GBX.mixIn(L, R, fx.shimmer(r.range(0.05, 0.14), r.range(2200, 3600), { skew: r.range(0.3, 0.9) }), Math.round((tb + i * r.range(0.08, 0.15) - T0) * sr), 0.04 * P.g * env(tb), P.pan); } }
  K.putLR(L, R, T0, { vol: 1.0, room, wet: 0.2 });
});

// ================================================================================================= FOLEY
beSound('foley', 'sfield', function (ctx, dest, K) {
  const { fx, r } = K, B = BE, hall = _beSfHall(K, 'sfHallF', 0.6), street = _beSfStreet(K, 'sfStreetF', 0.3);
  // "information you once ignored": the instructor's soft steps across the hall (the camera is above it now)
  for (let k = 0; k < 4; k++) K.put(fx.step({ weight: 0.5, scuff: 0.2, s: 0.95 }), B.nIgn[0] + k * 0.5, { vol: 0.04, norm: true, pan: -0.25, room: hall, wet: 0.8 });
  // the two people with canes: steps and taps, from the camera
  const put = (x, y, z, t, s, vol) => { const P = _beSfPlace(x, y, z, beSfEar(t), 2.5, 1.15); if (P.d < 60) K.put(s, t, { vol: vol * P.g, pan: P.pan, norm: true, room: street, wet: 0.35 }); };
  for (const W of ['A', 'B']) for (const sg of BE_SF_CAST[W]) {
    if (!sg.p1) continue;
    for (const h of beActPlan(sg)) if (h.t0 > Math.max(sg.t0, B.n3) && h.t0 < Math.min(sg.t1 + 0.4, B.s14 - 0.3)) put(h.p.x, 0, h.p.z, h.t0, fx.step({ weight: 0.42, scuff: 0.12, s: 1.1 }), 0.09);
    for (const t of beCaneTaps(sg)) if (t > B.n3 && t < B.s14 - 0.3) { const q = beArenaAt([sg], t); put(q.x, 0, q.z, t, fx.hit(fx.stoneModes(W === 'B' ? 2.2 : 2.7), { width: 0.0005, amp: 1 }), 0.1); }
  }
  // the corner: her cane finds the kerb's edge (stone, a sharp little knock, and the drop beyond it)
  { const q = BE_N.A1; put(q.x - 0.9, 0, q.z, B.nA.tap, fx.hit(fx.stoneModes(3.1).concat([[2900, 0.01, 0.4]]), { width: 0.0004, amp: 1, extra: [[0.004, 0.0003, 0.3]] }), 0.2); }
  void r;
});

// ================================================================================================= SFX
beSound('sfx', 'sfield', function (ctx, dest, K) {
  const { fx, r } = K, B = BE, hall = _beSfHall(K, 'sfHallS', 1.0), street = _beSfStreet(K, 'sfStreetS', 0.35);
  const clickLR = (t, repsL, repsR, o = {}) => { const c = beClickArr(fx, { f: o.f || 3000 }), Lr = beWithEchoes(fx, c, repsL), Rr = beWithEchoes(fx, c, repsR);
    const m = Math.max(Lr.length, Rr.length), Lx = new Float32Array(m), Rx = new Float32Array(m); Lx.set(Lr); Rx.set(Rr);
    const pk = Math.max(GBX.peak(Lx), GBX.peak(Rx)); for (let i = 0; i < m; i++) { Lx[i] /= pk; Rx[i] /= pk; }
    if (o.pan) { const a = (o.pan + 1) * Math.PI / 4, gl = Math.cos(a) * 1.41, gr = Math.sin(a) * 1.41; for (let i = 0; i < m; i++) { const s = (Lx[i] + Rx[i]) * 0.5; Lx[i] = Lx[i] * (1 - Math.abs(o.pan)) + s * gl * Math.abs(o.pan); Rx[i] = Rx[i] * (1 - Math.abs(o.pan)) + s * gr * Math.abs(o.pan); } }
    K.putLR(Lx, Rx, t, { vol: o.vol ?? 0.3, room: o.room, wet: o.wet ?? 0.9 }); };
  // the hall from the passage's end (she faces down the hall; the crates behind her left, the near wall at her right)
  const hallReps = (k, s) => { const j = 0.0006 * k; return [[_beSfMs(5.9) + j, 0.16 * s, 3600], [_beSfMs(6.8), 0.15, 4200], [_beSfMs(7.9) - j, 0.2 * (2 - s), 4400], [_beSfMs(8.5), 0.14, 3000], [_beSfMs(14.1) + j, 0.11 * s, 3200], [_beSfMs(21), 0.07, 2200], [_beSfMs(21.2), 0.06, 1900]]; };
  B.nCl.forEach((t, k) => { const s = 1 + 0.25 * Math.sin(k * 1.9); clickLR(t, hallReps(k, s), hallReps(k, 2 - s).map(([d, g, f]) => [d + 0.0004, g, f]), { vol: 0.27 - 0.012 * k, f: 3000 + 60 * ((k * 7) % 5), room: hall, wet: 0.95 + 0.05 * k }); });
  // the corner (she faces the crossing): the building's corner at her left, the lamp post, the parked car (metal) at
  // her right and behind, the facade across the crossing, late and dull; the avenue open to her right
  const cornerL = [[_beSfMs(1.5), 0.42, 6500], [_beSfMs(2.2), 0.08, 7500], [_beSfMs(17.6), 0.1, 1800]], cornerR = [[_beSfMs(1.6), 0.12, 4000], [_beSfMs(2.2), 0.16, 8000], [_beSfMs(4.4), 0.24, 6000], [_beSfMs(4.5) + 0.0011, 0.1, 5200], [_beSfMs(17.7), 0.09, 1800]];
  B.nA.clicks.forEach((t, k) => { if (t === B.nG[1]) return; const P = _beSfPlace(BE_N.A1.x, 1.55, BE_N.A1.z, beSfEar(t), 3, 0.9); clickLR(t, cornerL, cornerR, { vol: 0.3 * MathX.clamp(P.g * 1.6, 0.35, 1), f: 3200 + 50 * k, pan: P.pan * 0.6, room: street, wet: 0.5 }); });
  // the bridge: the railing's posts (a little comb), the water below (strong), the quay wall, buildings far off
  const posts = []; for (let k = 0; k < 5; k++) posts.push([_beSfMs(1.6 + k * 0.35), 0.06 / (1 + k * 0.5), 7500]);
  const bridge = posts.concat([[_beSfMs(3.95), 0.4, 4000], [_beSfMs(4.0) + 0.0015, 0.15, 3000], [_beSfMs(17), 0.09, 1600], [_beSfMs(40), 0.04, 1200]]);
  B.nB.clicks.forEach((t, k) => { if (t === B.nG[2]) return; const q = beArenaAt(BE_SF_CAST.B, t), P = _beSfPlace(q.x, 1.55, q.z, beSfEar(t), 4, 0.9); clickLR(t, bridge, bridge.map(([d, g, f]) => [d + 0.0005, g * 0.9, f]), { vol: 0.28 * MathX.clamp(P.g * 1.8, 0.35, 1), f: 2700 + 80 * k, pan: P.pan * 0.6, room: street, wet: 0.4 }); });
  // the gap: three measured clicks over the city (each with its own place's answer)
  clickLR(B.nG[0], hallReps(5, 1.2), hallReps(5, 0.8), { vol: 0.52, f: 3000, pan: -0.5, room: hall, wet: 1.2 });
  clickLR(B.nG[1], cornerL, cornerR, { vol: 0.5, f: 3250, pan: 0.45, room: street, wet: 0.55 });
  clickLR(B.nG[2], bridge, bridge, { vol: 0.5, f: 2750, pan: 0.1, room: street, wet: 0.5 });
  void r;
});

// ================================================================================================= MUSIC
beSound('music', 'sfield', function (ctx, dest, K) {
  const B = BE, M = beMusicKit(ctx, K), w = (x) => bnE(13, x).start;
  // under the words: D, Bm, G, A (the arena's D carries in); a slow figure in the piano, the strings with the chords
  const ch = [[B.s13 + 3.2, 'D', ['D3', 'A3', 'F#4'], ['D4', 'A4', 'F#4', 'D5']], [w('losing') - 0.1, 'Bm', ['B2', 'F#3', 'D4'], ['B3', 'F#4', 'D4', 'B4']],
    [w('time') - 0.1, 'G', ['G2', 'D3', 'B3'], ['G3', 'D4', 'B3', 'G4']], [w('information') - 0.1, 'A', ['A2', 'E3', 'C#4'], ['A3', 'E4', 'C#4', 'A4']],
    [B.n3 - 0.2, 'D', ['D3', 'A3', 'F#4', 'A4'], ['D4', 'A4', 'F#5', 'D5']], [w('supernatural') - 0.1, 'Bm', ['B2', 'F#3', 'D4'], ['B3', 'F#4', 'D5', 'B4']],
    [B.n4 - 0.1, 'G', ['G2', 'D3', 'B3', 'D4'], ['G3', 'D4', 'B4', 'G4']], [w('useful') - 0.1, 'A', ['A2', 'E3', 'C#4'], ['A3', 'E4', 'C#5', 'A4']],
    [B.n5 - 0.1, 'Bm', ['B2', 'F#3', 'D4'], ['B3', 'F#4', 'D5', 'B4']], [w('different') - 0.1, 'G', ['G2', 'D3', 'B3'], ['G3', 'D4', 'B4', 'G4']],
    [w('understand') - 0.1, 'Asus', ['A2', 'E3', 'D4'], ['A3', 'E4', 'D5', 'A4']], [B.ng, null]];
  for (let i = 0; i < ch.length - 1; i++) {
    const [t0, , st, fig] = ch[i], t1 = ch[i + 1][0], lift = t0 >= B.n3 - 0.3 ? 1.25 : 1;
    M.strings(t0 - 0.2, t1 + 0.6, st, 0.26 * lift, { att: 0.9, rel: 0.8, cut: 1100 + (lift > 1 ? 400 : 0) });
    for (let k = 0; t0 + 0.05 + k * 0.42 < t1 - 0.1; k++) M.piano(t0 + 0.05 + k * 0.42, fig[k % 4], 0.17 + (k % 4 ? 0 : 0.05), 1.4, k % 2 ? 0.25 : -0.25, 0.6);
  }
  // the city appears: a high shimmer opens over it
  M.strings(B.n3 + 0.3, B.ng + 0.2, ['A5', 'D6'], 0.09, { att: 3.0, rel: 1.5, cut: 3600, vib: 3 });
  // the gap: the peak. Full D, built on the three clicks (each answered by a chord's tone, high, then the whole); it
  // resolves and carries softly into the morning of scene 14
  // (it steps back for each click, so the click and its answer are heard clearly, then swells again)
  const dip = (t, v) => [[t - 0.06, v], [t + 0.02, v * 0.45], [t + 0.45, v * 0.6], [t + 1.0, v]];
  M.strings(B.ng - 0.1, B.s14 + 2.6, ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4', 'F#4', 'A4'], 1.35, { att: 0.9, rel: 3.0, cut: 1500, cutTo: 3000,
    keys: [[B.nG[0] - 0.3, 0.7], ...dip(B.nG[0], 0.75), ...dip(B.nG[1], 0.9), ...dip(B.nG[2], 1.0), [B.s14 - 1.0, 0.9], [B.s14 + 0.5, 0.35]] });
  M.piano(B.ng + 0.02, 'D2', 0.32, 3.5, 0, 1.5); M.piano(B.ng + 0.02, 'D3', 0.24, 3.5, 0, 1.5);
  [['A4', 'D5'], ['C#5', 'E5'], ['D5', 'F#5', 'A5']].forEach((ns, k) => ns.forEach((nn, j) => M.piano(B.nG[k] + 0.3 + j * 0.09, nn, 0.24 + 0.03 * k, 2.6, [-0.4, 0.4, 0.1][k], 1.0)));
  M.bell(B.nG[2] + 0.35, 'D6', 0.3, 0.1);
  [['D3', 0], ['A3', 0.16], ['D4', 0.32], ['F#4', 0.48], ['A4', 0.64], ['D5', 0.8]].forEach(([nn, o]) => M.piano(B.s14 - 1.3 + o, nn, 0.2 - o * 0.08, 3.2, -0.3 + o * 0.6, 1.4));
});
