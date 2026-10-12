/* =====================================================================
   SOUND — scene 11 (the friend; the café-bookshop). Still under the arcade, the rain still falling beyond the columns.
     the friend   her steps along the arcade's tiles (closer with each one, the last ones loud and near), her raincoat's
                  nylon swishing, her voice: a call (two syllables, the second falling) between the narrator's lines, a
                  greeting, a few words at the door. Everything is placed from Noor's ears and turns as she turns
     touch        the friend's hand landing on her sleeve; Noor's hand closing on the raincoat's sleeve
     the click    at the door: the glass front answers at ≈ 7 ms (close, bright, broad), the columns behind at ≈ 12 ms
     the door     the brass handle, the latch, the closer's hiss, and the shop bell on its spring above the door
     the café     a room of people (overlapping voices, cups and saucers, a spoon, the grinder, the steam wand, the
                  fridge's hum), heard first faintly through the glass, then pouring out of the open door, then all
                  around her once she is in: a small, warm, soft room (the books swallow the high end)
     music        a different texture for the warmest scene: a plucked guitar (Karplus-Strong) in D, a soft organ-like
                  pad under it; the friend's last steps climb a scale; on the walk the picking follows their steps; the
                  door gap keeps one chord and lets the room be heard
   ===================================================================== */
const BE_CAFE_ROOM = { size: [10.6, 3.4, 6.3], rt60: 0.5, absorb: 0.62, bright: 0.45, damp: 4.0, seed: 151 };

// where the friend is (x, z) at t: her blocking (BE_FRIEND, scene11.js)
function beFriendAt(t) {
  let seg = BE_FRIEND[0]; for (const s of BE_FRIEND) if (t >= s.t0) seg = s;
  if (seg.p1) { const plan = beActPlan(seg), p = plan.atS(plan.sOfT(MathX.clamp(t, seg.t0, seg.t1))).p; return { x: p.x, z: p.z }; }
  return { x: seg.p0.x, z: seg.p0.z };
}
// Noor's heading (her actor's yaw: +x is π/2) — her ears turn with her
function beHeroYawCity(t) {
  let seg = BE_HERO_CITY[0]; for (const s of BE_HERO_CITY) if (t >= s.t0) seg = s;
  if (typeof seg.yaw === 'function') return seg.yaw(t);
  if (typeof seg.yaw === 'number') return seg.yaw;
  if (seg.p1) return Math.atan2(seg.p1.x - seg.p0.x, seg.p1.z - seg.p0.z);
  return Math.PI / 2;
}
// gain and pan of a source at (x, z) heard by Noor at t (her right is (−cos yaw, sin yaw))
function _beK11Place(x, z, t, ref = 1.5, pw = 1.2) {
  const E = beRainEar(t), th = beHeroYawCity(t), dx = x - E.x, dz = z - E.z, d = Math.sqrt(dx * dx + dz * dz + 0.3);
  const pan = MathX.clamp((-dx * Math.cos(th) + dz * Math.sin(th)) / d, -1, 1) * 0.85, a = (pan + 1) * Math.PI / 4;
  return { d, g: Math.pow(ref / Math.max(d, ref), pw), gl: Math.cos(a), gr: Math.sin(a), pan };
}
// 0…1: she is inside the café (through the door), and the café is open to her (the door open, or she is in)
const beCafeIn = (t) => MathX.smooth(beRainEar(t).z, 15.0, 15.9);
const beCafeOpen = (t) => Math.max(0.8 * MathX.smooth(t, BE.kDoor[0] + 0.05, BE.kDoor[1] - 0.2), beCafeIn(t));

// a plucked string (Karplus-Strong with a fractional delay, so chords stay in tune) through a small guitar body
function bePluckBuf(fx, f, dur = 3.2, o = {}) {
  const key = 'pl' + Math.round(f * 100) + '_' + (o.bright || 0.45) + '_' + dur;
  if (fx.cache[key]) return fx.cache[key];
  const sr = fx.sr, r = new RNG(Math.round(f * 7) + 911), n = Math.ceil(dur * sr), y = new Float32Array(n), P = sr / f - 0.5, damp = o.damp || 0.9965;
  const m = Math.round(sr / f), ex = new Float32Array(m); let lp = 0;
  for (let i = 0; i < m; i++) { lp += (r.next() * 2 - 1 - lp) * (o.bright || 0.45); ex[i] = lp; }
  for (let i = 0; i < n; i++) {
    let v = i < m ? ex[i] : 0; const d = i - P;
    if (d >= 1) { const k = Math.floor(d), fr = d - k; v += damp * 0.5 * (y[k] * (1 - fr) + y[k + 1] * fr + y[k - 1] * (1 - fr) + y[k] * fr); }
    y[i] = v;
  }
  GBX.bq(y, 'peak', 105, 1.2, sr, 4); GBX.bq(y, 'peak', 230, 1.4, sr, 3); GBX.bq(y, 'lp', 5200, 0.6, sr); GBX.bq(y, 'hp', 60, 0.7, sr);
  for (let i = 0; i < n; i++) y[i] *= Math.min(1, i / 40) * Math.min(1, (n - i) / (0.3 * sr));
  const pk = GBX.peak(y); for (let i = 0; i < n; i++) y[i] /= pk;
  return (fx.cache[key] = y);
}

// ================================================================================================= AMBIENCE: the café
beSound('amb', 'cafe', function (ctx, dest, K) {
  const { fx, sr, r } = K, B = BE, T0 = B.s11 - 0.5, T1 = B.s12 + 1.2, n = Math.ceil((T1 - T0) * sr), CR = 64;
  const room = K.room('cafeAmb', Object.assign({ src: [5.3, 1.2, 3.4], lis: [5.3, 1.6, 0.8], wet: 0.4 }, BE_CAFE_ROOM));
  const L = new Float32Array(n), R = new Float32Array(n);
  const at = (t) => Math.round((t - T0) * sr);
  const put = (x, z, t, y, vol, ref = 1.5) => { const P = _beK11Place(x, z, t, ref, 1.15); GBX.mixIn(L, R, y, at(t), vol * P.g, P.pan); };
  // the voices: two at the tables, the barista, two more out of sight at the back (phrases, pauses, a laugh)
  for (const [x, z, f0, fs, v] of [[55.8, 17.8, 128, 1, 0.03], [55.0, 19.9, 205, 1.13, 0.028], [62.7, 18.0, 118, 1, 0.022], [53.8, 21.0, 190, 1.1, 0.02], [60.8, 20.8, 140, 1.03, 0.02]]) {
    for (let t = T0 + r.range(0, 1.2); t < T1 - 0.6;) {
      const k = r.int(3, 10); for (let i = 0; i < k && t < T1 - 0.6; i++) { const y = beSyllable(fx, f0 * r.range(0.95, 1.05), r.range(0.1, 0.19), fs, 0.7); GBX.bq(y, 'lp', 2600, 0.7, sr); put(x, z, t, y, v); t += r.range(0.13, 0.23); }
      if (r.next() < 0.12) { const y = fx.breath(0.5, { voice: 0.5, f0: f0 * 1.3, env: (u) => Math.abs(Math.sin(u * Math.PI * 5)) * (1 - u) }); put(x, z, t, y, v * 0.8); t += 0.5; }
      t += r.range(0.5, 2.0);
    }
  }
  // cups and saucers at the tables and the counter; a spoon stirring now and then
  for (let t = T0 + 0.4; t < T1 - 0.4; t += r.range(0.6, 2.2)) { const q = r.int(0, 3), [x, z] = [[55.2, 17.6], [55.6, 20.1], [62.1, 18.0], [62.1, 19.2]][q];
    put(x, z, t, fx.hit(r.next() < 0.5 ? fx.cupModes() : fx.saucerModes(), { width: 0.0004, amp: 1 }), r.range(0.006, 0.014)); }
  for (const t0 of [T0 + 6.2, T0 + 21.5, B.k10 + 0.4]) { for (let k = 0; k < 9; k++) put(55.6, 20.1, t0 + k * 0.17 + r.range(-0.02, 0.02), fx.hit(fx.cupModes(1.25), { width: 0.0002, amp: 1 }), 0.004); }
  // the grinder (a burst as the door opens) and the steam wand (a hiss that gurgles as the milk turns)
  { const t = B.kDoor[0] + 0.55, d = 2.0, m = Math.ceil(d * sr), y = new Float32Array(m), g = fx.white(m); let ph = 0;
    GBX.bq(g, 'bp', 2400, 0.5, sr);
    for (let i = 0; i < m; i++) { const u = i / m, e = Math.min(1, i / (0.05 * sr)) * Math.min(1, (m - i) / (0.15 * sr)); ph += (118 + 6 * Math.sin(i / sr * 13)) / sr; y[i] = e * (0.5 * Math.sin(2 * Math.PI * ph) + 0.25 * Math.sin(4 * Math.PI * ph) + 0.6 * g[i] * (0.6 + 0.4 * Math.sin(i / sr * 41 + u))); }
    put(62.25, 17.6, t, y, 0.02 / GBX.peak(y), 2.5); }
  { const t = B.k10c - 0.2, d = 3.2, m = Math.ceil(d * sr), y = fx.white(m), w = fx.wander(3); GBX.bq(y, 'bp', 4200, 0.7, sr);
    const gu = fx.white(m); GBX.bq(gu, 'bp', 650, 2.5, sr);
    for (let i = 0; i < m; i++) { const u = i / m, e = Math.min(1, i / (0.08 * sr)) * Math.min(1, (m - i) / (0.3 * sr)); y[i] = e * (y[i] * (1 - 0.4 * u) + gu[i] * 0.8 * u * (0.5 + 0.5 * w(i / sr))); }
    put(62.25, 17.6, t, y, 0.016 / GBX.peak(y), 2.5); }
  // the room's own hum (a fridge under the counter, the lamps)
  { const y = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / sr; y[i] = 0.6 * Math.sin(2 * Math.PI * 50 * t) + 0.3 * Math.sin(2 * Math.PI * 100 * t + 0.4) + 0.1 * Math.sin(2 * Math.PI * 150 * t); }
    for (let i0 = 0; i0 < n; i0 += CR) { const P = _beK11Place(62.0, 19.5, T0 + i0 / sr, 2.5, 1.0); for (let i = i0; i < Math.min(n, i0 + CR); i++) { L[i] += y[i] * 0.004 * P.g * P.gl; R[i] += y[i] * 0.004 * P.g * P.gr; } } }
  // through the glass the room is faint and dull; through the open door it pours out; inside it is all around her
  const mL = Float32Array.from(L), mR = Float32Array.from(R); for (const x of [mL, mR]) { GBX.bq(x, 'lp', 650, 0.7, sr); GBX.bq(x, 'lp', 900, 0.7, sr); }
  for (let i0 = 0; i0 < n; i0 += CR) { const o = beCafeOpen(T0 + i0 / sr); for (let i = i0; i < Math.min(n, i0 + CR); i++) { L[i] = L[i] * o + mL[i] * (1 - o) * 0.3; R[i] = R[i] * o + mR[i] * (1 - o) * 0.3; } }
  K.putLR(L, R, T0, { vol: 1.15, fadeIn: 0.8, stop: T1, fade: 1.0, room, wet: 0.45 });
});

// ================================================================================================= FOLEY
beSound('foley', 'cafe', function (ctx, dest, K) {
  const { fx, r, sr } = K, B = BE;
  const arcade = K.room('arcadeF11', Object.assign({ src: [8, 0.2, 1.3], lis: [8, 1.6, 1.3], wet: 0.45 }, BE_ARCADE_ROOM));
  const cafe = K.room('cafeF', Object.assign({ src: [5.3, 0.2, 1.5], lis: [5.3, 1.6, 1.0], wet: 0.4 }, BE_CAFE_ROOM));
  const K3 = BE_SHOTS.find((s) => s.id === 'K3'), K4 = BE_SHOTS.find((s) => s.id === 'K4');
  const inK = (S, t) => MathX.window(t, S.t0 - 0.05, S.t1 + 0.05, 0.1, 0.15);
  const place = (x, z, t, y, vol, o = {}) => { const P = _beK11Place(x, z, t, o.ref || 1.2, o.pw || 1.25); if (P.g < 0.004) return;
    const inside = beCafeIn(t) > 0.5 && z > 15.2; K.put(y, t, { vol: vol * P.g, pan: P.pan, room: inside ? cafe : arcade, wet: o.wet ?? (inside ? 0.45 : 0.5), lp: P.d > 7 ? 3000 : null, norm: true }); };   // vol = the peak
  // the friend's steps (tiles outside, boards inside), louder in her experience (K4); her raincoat's swish with each
  for (const sg of BE_FRIEND) if (sg.p1) for (const h of beActPlan(sg)) {
    if (h.t0 <= sg.t0 || h.t0 > sg.t1 + 0.05 || h.t0 > B.s12 + 0.3) continue;
    const wood = h.p.z > 15.25, y = wood ? fx.woodStep({ weight: 0.5 }) : fx.step({ weight: 0.5, scuff: 0.06, s: 1.12, body: 84 });
    if (!wood && h.t0 < B.k3 && r.next() < 0.3) { const q = fx.creak(0.06, [[2600, 0.004, 1], [5100, 0.003, 0.5]], { rate: [180, 260] }); for (let i = 0; i < q.length && i < y.length; i++) y[i] += q[i] * 0.25; }   // a wet sole
    place(h.p.x, h.p.z, h.t0, y, 0.11 * (1 + 0.8 * inK(K4, h.t0)));
    place(h.p.x, h.p.z, h.t0 + 0.08, fx.rustle(0.3, { density: 380, rub: 0.35, lo: 1400, hi: 7500, grain: 0.008 }), 0.025);
  }
  // the friend's voice: the call, the greeting, a word at the door (a little closer and clearer in K3)
  for (const q of BE_FRIEND_TALK) {
    const P = beFriendAt(q.t), long = q.call ? q.d : r.range(0.11, 0.18);
    const y = beSyllable(fx, q.call ? (q.d > 0.2 ? 238 : 215) : 208 * r.range(0.96, 1.05), long + 0.04, 1.13, q.call ? 1.6 : 1); GBX.bq(y, 'lp', 4200, 0.7, sr);
    const overNarr = q.t > B.kTouch - 0.2 && q.t < B.kTouch + 1.0 ? 0.4 : 1;   // under the narrator's line: a murmur
    place(P.x, P.z, q.t, y, (q.call ? 0.5 : 0.12) * overNarr * (1 + 0.4 * inK(K3, q.t)), { ref: 1.4, wet: 0.35 });   // the call is raised
  }
  // Noor: a breath of recognition as she turns; she answers at the door; a soft exhale (a smile) on "it's"
  K.put(fx.breath(0.42, { voice: 0.25, f0: 205, env: (u) => Math.min(1, u / 0.1) * Math.pow(1 - u, 1.6) }), B.kTurn[0] + 0.45, { vol: 0.05, norm: true, room: arcade, wet: 0.3 });
  K.put(fx.breath(0.6, {}), B.kW.smile - 0.1, { vol: 0.03, norm: true, room: arcade, wet: 0.3 });
  for (const q of BE_NOOR_TALK) { const y = beSyllable(fx, 186 * r.range(0.96, 1.04), q.d + 0.03, 1.08, 1); GBX.bq(y, 'lp', 4800, 0.7, sr); K.put(y, q.t, { vol: 0.1, norm: true, room: arcade, wet: 0.3 }); }
  // touch: the friend's hand lands on her sleeve; Noor's hand closes on the raincoat's sleeve (nylon)
  { const y = fx.rustle(0.18, { density: 300, rub: 0.5, lo: 350, hi: 3200, grain: 0.01, env: (u) => Math.exp(-u * 7) }); const s = fx.slap([[180, 0.02, 1], [420, 0.01, 0.4]], { amp: 0.6, skin: 0.15, len: 0.2 }); for (let i = 0; i < s.length && i < y.length; i++) y[i] += s[i] * 0.4;
    K.put(y, B.kTouch, { vol: 0.07, norm: true, pan: -0.3, room: arcade, wet: 0.25 }); }
  K.put(fx.rustle(0.42, { density: 600, rub: 0.45, lo: 1300, hi: 7500, grain: 0.006 }), B.kGrip[0] + 0.25, { vol: 0.06, norm: true, pan: -0.35, room: arcade, wet: 0.25 });
  // her cane crosses the door's threshold strip (aluminium on brass)
  { let tx = null; for (let t = B.kIn[0]; t < B.s12 + 0.5; t += 0.01) if (beRainEar(t).z > 14.7) { tx = t; break; }
    if (tx) K.put(fx.hit(fx.metalModes(2300, 0.25), { width: 0.0003, amp: 1 }), tx, { vol: 0.05, norm: true, pan: 0.15, room: cafe, wet: 0.3 }); }
});

// ================================================================================================= SFX
beSound('sfx', 'cafe', function (ctx, dest, K) {
  const { fx, sr, r } = K, B = BE;
  const arcade = K.room('arcadeS11', Object.assign({ src: [8, 1.5, 1.5], lis: [8, 1.6, 1.3], wet: 0.35 }, BE_ARCADE_ROOM));
  // K8: her click at the door. The glass front ≈ 1.2 m ahead answers at ≈ 7 ms (bright, broad), the door's frame a
  // hair later, the columns behind at ≈ 12 ms, the arcade's ceiling at ≈ 15 ms
  { const E = beRainEar(B.kClick), dG = 15.18 - E.z, dC = E.z - 11.95;
    const y = beWithEchoes(fx, beClickArr(fx, { f: 3100 }), [[2 * dG / 343, 0.42, 7000], [2 * dG / 343 + 0.0011, 0.18, 4500], [2 * dC / 343, 0.13, 3500], [2 * (4.05 - 1.6) / 343, 0.1, 3000]]);
    K.put(y, B.kClick, { vol: 0.3, norm: true, pan: 0, room: arcade, wet: 0.5 }); }
  // the door: the brass handle, the latch, the closer hissing as it swings in, and the shop bell on its spring
  const D0 = B.kDoor[0], D1 = B.kDoor[1], P = (t) => _beK11Place(58.0, 15.2, t, 1.2, 1.1);
  { const y = fx.hit(fx.metalModes(1450, 0.35), { width: 0.0004, amp: 1 }); K.put(y, D0 - 0.18, { vol: 0.07, norm: true, pan: P(D0).pan, room: arcade, wet: 0.3 }); }
  { const y = fx.hit(fx.metalModes(820, 0.15).concat(fx.woodModes(260, 0.6)), { width: 0.0005, amp: 1, extra: [[0.012, 0.0004, 0.6]] }); K.put(y, D0 - 0.05, { vol: 0.1, norm: true, pan: P(D0).pan, room: arcade, wet: 0.35 }); }
  { const d = D1 - D0 + 0.4, m = Math.ceil(d * sr), y = fx.white(m); GBX.bq(y, 'bp', 1600, 0.6, sr); GBX.bq(y, 'lp', 3000, 0.7, sr);
    for (let i = 0; i < m; i++) { const u = i / m; y[i] *= Math.sin(Math.PI * Math.pow(u, 0.7)) * 0.6; }
    const q = fx.creak(0.5, [[930, 0.01, 1], [1870, 0.006, 0.5], [2790, 0.004, 0.25]], { rate: [35, 70] }); for (let i = 0; i < q.length && i + 0.3 * sr < m; i++) y[i + Math.round(0.3 * sr)] += q[i] * 0.12;
    K.put(y, D0, { vol: 0.03, norm: true, pan: P(D0).pan, room: arcade, wet: 0.4 }); }
  { const bell = (a) => fx.hit([[2140, 0.5, 1], [2140 * 2.32, 0.28, 0.45], [2140 * 3.9, 0.16, 0.3], [2140 * 0.53, 0.35, 0.2], [2140 * 5.7, 0.08, 0.15]], { width: 0.00025, amp: a, len: 1.8 });
    [[0, 1], [0.11, 0.6], [0.24, 0.42], [0.41, 0.28], [0.62, 0.17], [0.86, 0.1]].forEach(([dt, a]) => { const t = D0 + 0.22 + dt, y = bell(1); K.put(y, t, { vol: 0.085 * a, norm: true, pan: P(t).pan * 0.8, room: arcade, wet: 0.5 }); }); }
});

// ================================================================================================= MUSIC: the guitar
beSound('music', 'cafe', function (ctx, dest, K) {
  const B = BE, fx = K.fx, M = beMusicKit(ctx, K), r = new RNG(1121);
  const pl = (t, nn, v, pan = 0, o = {}) => fx.play(bePluckBuf(fx, gbHz(nn), o.dur || 3.4, o), t, M.bus, { vol: v * 0.32, pan });
  const pad = (t0, t1, notes, v, o = {}) => M.strings(t0, t1, notes, v, Object.assign({ wave: 'triangle', cut: 1300, vib: 4, att: 1.6, rel: 1.6 }, o));
  const strum = (t, notes, v, pan = 0, gap = 0.035) => notes.forEach((nn, k) => pl(t + k * gap + r.range(0, 0.008), nn, v * (1 - 0.08 * k), pan + (k - notes.length / 2) * 0.06));
  // "Here's something easy to forget": a few open notes, the rain still around her
  [[0.7, 'A3', -0.2], [1.45, 'D4', 0.15], [2.2, 'F#4', -0.05]].forEach(([dt, nn, p]) => pl(B.s11 + dt, nn, 0.11, p));
  // the friend: D, then A/C# as she remembers and calls instead of waving; Bm under the voice; G as Noor turns to it
  strum(B.k2 + 0.1, ['D3', 'A3', 'D4', 'F#4'], 0.13, -0.1);
  [[0.9, 'A3'], [1.5, 'D4'], [2.1, 'E4'], [2.7, 'F#4']].forEach(([dt, nn], k) => pl(B.k2 + dt, nn, 0.08, k % 2 ? 0.25 : -0.2));
  strum(B.kCall[0] - 0.4, ['C#3', 'A3', 'C#4', 'E4'], 0.12, 0.1);
  strum(B.k3 + 0.05, ['B2', 'F#3', 'B3', 'D4'], 0.12, -0.1);
  strum(B.kTurn[0] + 0.4, ['G2', 'D3', 'B3', 'D4', 'G4'], 0.14, 0.05, 0.05);
  pad(B.k3 - 0.2, B.k5 + 0.5, ['G2', 'D3', 'B3'], 0.18, { keys: [[B.kTurn[0], 0.6], [B.kTurn[1] + 0.4, 1.0]] });
  // her footsteps, closer with each one: the guitar climbs a note on each of the friend's last steps
  { const seq = ['A3', 'B3', 'C#4', 'D4', 'E4', 'F#4', 'A4']; let i = 0;
    for (const sg of BE_FRIEND) if (sg.p1) for (const h of beActPlan(sg)) if (h.t0 > B.k4 + 0.1 && h.t0 < B.kArrive + 0.05 && h.t0 <= sg.t1) { pl(h.t0 + 0.01, seq[Math.min(i, seq.length - 1)], 0.07 + 0.01 * i, h.side === 'L' ? -0.2 : 0.2); i++; } }
  // touch: the warmth arrives (D/F#, a pad that opens); she takes the arm (G, then A)
  strum(B.kTouch + 0.05, ['F#2', 'D3', 'A3', 'D4', 'F#4'], 0.15, 0, 0.045);
  pad(B.kTouch - 0.2, B.k6 + 0.6, ['D3', 'F#3', 'A3', 'D4'], 0.22, { cut: 1500 });
  strum(B.kGrip[0] + 0.2, ['G2', 'D3', 'G3', 'B3'], 0.11, -0.1);
  strum(B.kGrip[1] + 0.4, ['A2', 'E3', 'A3', 'C#4'], 0.11, 0.1);
  // the walk: the picking follows her steps (D, Bm, G, A), the pad under it
  { const sg = BE_HERO_CITY.find((s) => s.p1 && Math.abs(s.t0 - (B.kWalk[0] + 0.1)) < 1e-6), chords = [['D3', 'A3', 'F#4', 'A3'], ['B2', 'F#3', 'D4', 'F#3'], ['G2', 'D3', 'B3', 'D3'], ['A2', 'E3', 'C#4', 'E3']];
    if (sg) { let i = 0; for (const h of beActPlan(sg)) { if (h.t0 <= sg.t0 || h.t0 > sg.t1) continue; const c = chords[Math.floor(i / 4) % 4]; pl(h.t0, c[i % 4], i % 4 ? 0.075 : 0.1, h.side === 'L' ? -0.25 : 0.25); i++; } }
    pad(B.k6 + 0.3, B.k8 + 0.4, ['D3', 'A3', 'D4'], 0.16, { cut: 1200, keys: [[B.k7, 0.8], [B.k8 - 0.6, 1.0]] }); }
  // "senses, skills and tools": a high harmonic on each word
  [['senses', 'F#5', -0.35], ['skills', 'A5', 0.3], ['tools', 'D6', 0]].forEach(([w, nn, p]) => pl(B.kW[w] + 0.03, nn, 0.08, p, { bright: 0.6, dur: 2.6 }));
  // the click: the music thins to one held, open chord
  pad(B.k8 - 0.3, B.k9 + 0.8, ['D3', 'E4', 'A4'], 0.15, { cut: 1700, att: 1.0 });
  pl(bnE(11, 'remarkable').start + 0.05, 'B4', 0.07, 0.2);
  // "the goal isn't to recreate eyesight / useful information and greater independence": the fullest moment, resolving
  strum(B.k9 + 0.5, ['G2', 'D3', 'B3', 'D4', 'G4'], 0.15, -0.1, 0.05);
  [[1.2, 'B4'], [1.8, 'A4'], [2.4, 'G4']].forEach(([dt, nn], k) => pl(B.k9 + dt, nn, 0.08, k % 2 ? 0.2 : -0.15));
  strum(bnE(11, "it's").start + 0.05, ['A2', 'E3', 'A3', 'C#4', 'E4'], 0.14, 0.1, 0.05);
  strum(bnE(11, 'independence').start + 0.1, ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'], 0.17, 0, 0.06);
  pad(B.k9 + 0.2, B.k10 + 1.8, ['D2', 'A2', 'F#3', 'A3', 'D4'], 0.24, { cut: 1500, keys: [[B.kW.smile, 1.0], [bnE(11, 'independence').start + 0.3, 1.25]] });
  // the gap: one chord held while the room is heard; a last high note as they go in
  [[B.kIn[0] + 0.2, 'A4', 0.07], [B.kIn[0] + 0.8, 'D5', 0.08], [B.kIn[0] + 1.6, 'F#5', 0.06]].forEach(([t, nn, v], k) => pl(t, nn, v, k % 2 ? 0.25 : -0.2, { dur: 3.6 }));
  pad(B.k10 + 1.0, B.s12 + 0.8, ['D3', 'A3', 'E4'], 0.12, { cut: 1100 });
});
