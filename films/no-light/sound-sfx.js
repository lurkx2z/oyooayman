/* =====================================================================
   SOUND · EFFECTS — what happens, heard from where you are. Sound crosses the ice at 324 m/s, so the far things arrive
   late (the lorry's hit 1.5 s after you see it, the plane about 2 s behind itself), and a moment the clock jumps over
   makes no sound. Close shots of the car, the hole and the driver hear them close (the camera is there).
     the title: your blades, the skaters around you · then the long glide, everyone stopping and falling in the dark
     the fall (you, the one you hit, her) · your breathing in the black shots · your palm on the ice
     the grab · her phone (five presses, the SOS alarm, a call that rings out) and other phones far off on the ice
     the man at the fire: steps in −12 °C snow (it squeaks), a gasp · the plane overhead (Doppler, 629 m up)
     the lorry's diesel, the hit, the railing, the car down the bank and across the ice, its engine
     the crack, the ice giving way, the engine drowning, the car's air coming up · the driver: the splash, the gasps of
     cold shock, his calls · the singing ice · your crawl (body on ice, her knees), the cracks under your hands, his
     sleeve, the ice bending under your chest
   ===================================================================== */

// ---- generators ---------------------------------------------------------------------------------------------------
// a blade stroke on hard ice: the edge bites and shaves off a fan of ice (bright, rough), d (s)
function nlStroke(fx, d, o = {}) {
  const y = fx.rustle(d, { density: 1600, rub: 0.6, lo: o.lo || 2200, hi: 9500, grain: 0.002, env: (u) => Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.1)), 0.5) * (1 - 0.5 * u) });
  NLX.strike(y, 0, Math.max(1, Math.round(0.0005 * fx.sr)), o.bite ?? 0.4, [[3100, 0.012, 1], [5200, 0.007, 0.6], [7400, 0.004, 0.3]], fx.sr);
  return y;
}
// a body hitting the ice: a dull thump with the sheet's low boom under it, and the clothes' slap; o.w (weight)
function nlThud(fx, o = {}) {
  const w = o.w || 1, y = fx.hit([[48, 0.18, 1], [83, 0.12, 0.7], [131, 0.08, 0.5], [260, 0.04, 0.3], [610, 0.015, 0.2]], { width: 0.012, amp: w, noise: 0.25 * w, nlen: 0.03, nhp: 600, len: 0.9 });
  const r = fx.rustle(0.18, { density: 900, rub: 0.5, lo: 600, hi: 5000, grain: 0.004, env: (u) => Math.exp(-u * 5) });
  for (let i = 0; i < r.length && i < y.length; i++) y[i] += r[i] * 0.4 * w;
  return y;
}
// a body sliding over ice on its clothes: a rough rub, d (s); o.env(u)
function nlRub(fx, d, o = {}) { return fx.rustle(d, { density: o.density || 500, rub: 0.7, lo: o.lo || 450, hi: o.hi || 3800, grain: 0.006, env: o.env || ((u) => Math.min(1, u / 0.03) * Math.pow(1 - u, 1.4)) }); }
// a step in dry snow at −12 °C: the crystals squeak as they crush, over a soft crunch
function nlSnowStep(fx, o = {}) {
  const sr = fx.sr, y = fx.rustle(0.2, { density: 2600, rub: 0.25, lo: 500, hi: 6000, grain: 0.002, env: (u) => Math.min(1, u / 0.15) * Math.pow(1 - u, 1.5) });
  const q = fx.creak(0.14, [[1150, 0.012, 1], [2350, 0.008, 0.6], [3500, 0.005, 0.3]], { rate: [380, 620], env: (u) => Math.sin(Math.PI * u) });
  for (let i = 0; i < q.length && i < y.length; i++) y[i] += q[i] * (o.squeak ?? 0.5);
  NLX.strike(y, 0, Math.round(0.006 * sr), 0.25, [[90, 0.03, 1], [180, 0.02, 0.5]], sr);
  return y;
}
// a splash: water thrown up and falling back, with bubbles; d (s), o.big (0…1)
function nlSplash(fx, d, o = {}) {
  const sr = fx.sr, n = Math.ceil(d * sr), big = o.big ?? 0.5, y = fx.white(n), L = new Float32Array(n), R = new Float32Array(n), r = fx.r;
  NLX.bq(y, 'bp', 900 - 300 * big, 0.6, sr); NLX.bq(y, 'lp', 3600, 0.7, sr);
  for (let i = 0; i < n; i++) { const t = i / sr; y[i] *= Math.min(1, t / 0.01) * Math.exp(-t / (0.12 + 0.25 * big)) + 0.25 * Math.exp(-Math.pow((t - 0.25 - 0.2 * big) / 0.15, 2)); }
  for (let t = 0; t < d * 0.8; t += r.range(0.01, 0.05)) if (r.next() < 0.7) fx.bubble(L, R, Math.round(t * sr), r.range(260, 1100) / (1 + big), r.range(0.006, 0.02), 0.35 * Math.exp(-t / (0.3 + 0.4 * big)), 0);
  for (let i = 0; i < n; i++) y[i] += L[i] + R[i];
  return y;
}
// a crack in the ice close by: a hard snap, the falling "pew" racing off through the sheet, a tail of small fractures;
// o.size (0…1)
function nlCrack(fx, o = {}) {
  const sr = fx.sr, sz = o.size ?? 1, r = fx.r, y = nlPew(fx, { f0: 5200 - 1500 * sz, f1: 160 + 100 * (1 - sz), d: 0.5 + 0.6 * sz, thump: 0.5 + 0.7 * sz });
  const n = Math.round(0.006 * sr), z = fx.white(n); for (let i = 0; i < n; i++) y[i] += z[i] * 1.6 * sz * Math.exp(-i / (0.0012 * sr));
  for (let k = 0; k < 14 * sz + 4; k++) { const i0 = Math.round(-Math.log(1 - r.next() * 0.99) * 0.12 * sr); if (i0 < y.length - 400) NLX.strike(y, i0, 2, r.range(0.05, 0.25) * sz, [[r.range(1800, 6000), 0.004, 1]], sr); }
  return y;
}
// the deep creak of a sheet of ice bending: slow stick-slip pulses through the plate's low modes; d (s), o.env(u, t)
function nlIceBend(fx, d, o = {}) {
  return fx.creak(d, [[38, 0.35, 1], [61, 0.25, 0.8], [97, 0.18, 0.6], [155, 0.1, 0.45], [260, 0.06, 0.3], [430, 0.03, 0.15]], { rate: o.rate || [5, 18], jit: 0.4, env: o.env, wrate: 0.7 });
}
// a gasp: a voiced breath in (o.f0, o.voice), d (s)
function nlGasp(fx, d, o = {}) { return fx.breath(d, { inhale: true, voice: o.voice ?? 0.35, f0: o.f0 || 135 }); }
// a phone's tiny speaker: band-limited (o.hp…o.lp)
function nlPhoneSpk(y, sr, o = {}) { NLX.bq(y, 'hp', o.hp || 650, 0.7, sr); NLX.bq(y, 'lp', o.lp || 5200, 0.7, sr); NLX.bq(y, 'peak', 2600, 1.0, sr, 4); return y; }
NL_SOUND_FNS.push(nlStroke, nlThud, nlRub, nlSnowStep, nlSplash, nlCrack, nlIceBend, nlGasp, nlPhoneSpk);

nlSound('sfx', 'events', function (ctx, bus, K) {
  const fx = K.fx, sr = fx.sr, r = new RNG(CONFIG.seed + 9091), E = NLE, C = NLP.sound, T0 = NL.tOn, END = NL.end;
  const open = K.verb('sopen', 3.6, { bright: 0.35, damp: 2.0, wet: 0.5, pre: 0.04, early: [[0.3, 0.16], [0.7, 0.09]] });
  const close = K.verb('sclose', 1.2, { bright: 0.5, damp: 3.5, wet: 0.25 });
  const F = (s) => nlSeen(s);                                                   // story → film (null: not shown)
  const mode = (t) => nlShotAt(t).mode, shot = (id) => NL_SHOTS.find((x) => x.id === id);
  // where you are: an ear at (x, 1, z), facing your heading; pan from the bearing
  const ear = (s) => NLY.at2(s);
  const heard = (s, x, y, z) => { const p = ear(s), d = Math.max(0.5, Math.hypot(x - p.x, y - 1, z - p.z)), t = F(s + d / C); return t == null ? null : { t, d, pan: MathX.clamp(((x - p.x) * -Math.cos(p.yaw) + (z - p.z) * Math.sin(p.yaw)) / d * 1.2, -0.85, 0.85) }; };
  // a level curve over the shots: v[mode] (default dflt), crossfaded 40 ms at the cuts
  const shotCurve = (v, dflt = 0) => nlCurve((t) => { let a = 0, w = 0; for (const sh of NL_SHOTS) { const k = nlWn(t, sh.t0, sh.t1, 0.02, 0.02); if (k > 0) { a += k * (v[sh.mode] ?? dflt); w += k; } } return w > 0 ? a / w : dflt; });
  // put y at t0 with its level following curve(t) (the peak of y sets vol, before the curve)
  const putC = (y, t0, curve, o = {}) => { const pk = NLX.peak(y); if (pk < 1e-9) return; const a = Float32Array.from(y); let any = 0; for (let i = 0; i < a.length; i++) { const g = curve(t0 + i / sr); a[i] *= g; any = Math.max(any, g); } if (any > 0.002) K.put(a, t0, Object.assign({}, o, { norm: pk })); };
  const seq = (n, f) => { for (let i = 0; i < n; i++) f(i); };

  // ==== THE TITLE: your blades and the skaters round you (strokes on each sway of the camera: s·2.6 rad)
  for (let k = 1; k < 5; k++) { const t = T0 - k * 1.208 - 0.25; if (t > -0.6) K.put(nlStroke(fx, 0.55, { bite: 0.5 }), t, { vol: 0.075, norm: true, pan: k % 2 ? 0.25 : -0.25, room: close, wet: 0.15 }); }
  seq(16, (i) => { const per = r.range(0.95, 1.4), pan = r.range(-0.9, 0.9), v = r.range(0.012, 0.04), ph = r.range(0, per); for (let t = -0.7 + ph; t < T0 - 0.1; t += per) K.put(nlStroke(fx, r.range(0.4, 0.6), { lo: 1800 }), t, { vol: v, norm: true, pan, room: open, wet: 0.5, lp: 7000 }); });

  // ==== THE GLIDE: your blades hissing on, slowing (v0 − a·s), until you hit someone at E.fall
  { const t0 = T0, t1 = F(E.fall), d = t1 - t0, n = Math.ceil(d * sr), y = nlNoise(fx, n, 'white'), w = fx.wander(0.6);
    NLX.bq(y, 'bp', 4800, 0.7, sr); NLX.bq(y, 'lp', 9000, 0.7, sr);
    const lo = nlNoise(fx, n, 'brown'); NLX.bq(lo, 'lp', 260, 0.7, sr);
    for (let i = 0; i < n; i++) { const t = i / sr, v = Math.max(0, 1 - NLP.glide * t / NLP.v0); y[i] = (y[i] + 0.9 * lo[i]) * v * (1 + 0.25 * w(t)) * Math.min(1, t / 0.05, (d - t) / 0.02); }
    K.put(y, t0, { vol: 0.035, norm: true, room: close, wet: 0.2 }); }

  // ==== EVERYONE ELSE in the first seconds of the dark: the stoppers' long scrapes, the fallers' thuds and slides
  for (const k of NLK.list) {
    if (k.fixed) continue;
    if (k.fall) {
      const p = NLK.pos(k, k.tf + 0.05), h = heard(k.tf, p.x, 0.3, p.z); if (!h || h.d > 90) continue;
      const g = Math.min(1, 5 / h.d), wet = Math.min(1, 0.25 + h.d / 40), lp = 9000 * Math.exp(-h.d / 60) + 1200;
      K.put(nlThud(fx, { w: r.range(0.7, 1.2) }), h.t, { vol: 0.11 * g, norm: true, pan: h.pan, room: open, wet, lp });
      K.put(nlRub(fx, r.range(0.7, 1.6)), h.t + 0.03, { vol: 0.05 * g, norm: true, pan: h.pan, room: open, wet, lp });
    } else {
      const tS = k.stop * k.v / 2.5, p = NLK.pos(k, tS * 0.5), h = heard(0.05, p.x, 0.1, p.z); if (!h || h.d > 90) continue;
      const g = Math.min(1, 5 / h.d);
      K.put(nlStroke(fx, tS, { lo: 1500, bite: 0.6 }), h.t, { vol: 0.06 * g, norm: true, pan: h.pan, room: open, wet: Math.min(1, 0.3 + h.d / 40), lp: 9000 * Math.exp(-h.d / 60) + 1200 });
    }
  }

  // ==== THE FALL: you hit the one sitting in your way; you both slide; she falls over the same pile behind you
  { const t = F(E.fall), tr = F(E.rest), th = F(E.herFall);
    K.put(nlThud(fx, { w: 1.5 }), t, { vol: 0.32, norm: true, pan: 0.05, room: close, wet: 0.3 });
    K.put(nlThud(fx, { w: 0.8 }), t + 0.31, { vol: 0.14, norm: true, pan: -0.15, room: close, wet: 0.3 });
    K.put(fx.breath(0.32, { voice: 0.7, f0: 128 }), t + 0.02, { vol: 0.13, norm: true, room: close, wet: 0.2 });   // your grunt
    K.put(nlVoice(fx, 0.38, { f0: (u) => 330 * (1 - 0.3 * u), formants: NL_VOWEL.a, breath: 0.2, env: (u) => Math.min(1, u / 0.05) * Math.pow(1 - u, 1.2) }), t + 0.06, { vol: 0.08, norm: true, pan: -0.35, room: close, wet: 0.3 });   // theirs
    K.put(nlRub(fx, tr - t - 0.1, { env: (u) => Math.min(1, u / 0.02) * Math.pow(1 - u, 1.1) }), t + 0.08, { vol: 0.13, norm: true, room: close, wet: 0.2 });
    K.put(nlThud(fx, { w: 1.0 }), th, { vol: 0.13, norm: true, pan: 0.45, room: open, wet: 0.45, lp: 6000 });
    K.put(nlVoice(fx, 0.5, { f0: (u) => 410 * (1 + 0.1 * Math.sin(Math.PI * u) - 0.3 * u), formants: [[950, 5, 1], [1500, 6, 0.7], [3000, 7, 0.35]], breath: 0.25 }), th - 0.08, { vol: 0.07, norm: true, pan: 0.45, room: open, wet: 0.5 });
    K.put(nlRub(fx, 2.6), th + 0.05, { vol: 0.06, norm: true, pan: 0.5, room: open, wet: 0.45, lp: 5000 }); }

  // ==== YOUR BREATHING in the black (and the POV at the edge): [t0, t1, period, level, gasp at t0?]
  const breathe = (a, b, per, v, o = {}) => {
    let t = a;
    if (o.gasp) { K.put(nlGasp(fx, 0.5, { voice: 0.4 }), t, { vol: v * 1.8, norm: true, room: close, wet: 0.2 }); t += 0.9; }
    for (; t < b - 0.4; t += per * r.range(0.9, 1.1)) {
      const di = per * 0.38, de = per * 0.5;
      K.put(fx.breath(di, { inhale: true, voice: o.voice || 0 }), t, { vol: v * 0.7, norm: true, room: close, wet: 0.15 });
      if (t + di + 0.05 + de < b + 0.3) K.put(fx.breath(de, { voice: (o.voice || 0) * 0.6, f0: 120 }), t + di + 0.05, { vol: v, norm: true, room: close, wet: 0.15 });
    }
  };
  breathe(T0 + 0.15, 9.35, 1.55, 0.05, { gasp: true, voice: 0.08 });
  breathe(13.7, 18.3, 1.8, 0.04);
  breathe(F(E.grab) + 0.15, 83.7, 1.15, 0.05, { gasp: true, voice: 0.1 });
  K.put(fx.breath(1.6, { voice: 0.05, f0: 115 }), 213.4, { vol: 0.035, norm: true, room: close, wet: 0.15 });   // (held through the singing, let out slowly)
  { const t = F(E.iceCrack); breathe(t + 0.1, 259.8, 2.1, 0.045, { gasp: true, voice: 0.12 }); }
  breathe(264.6, 270.3, 2.4, 0.035);

  // ==== YOUR PALM on the ice, then lifted
  { const t = F(E.hand[0]) - 0.12, t2 = F(E.hand[1]) + 0.05;
    K.put(fx.slap([[1900, 0.02, 1], [3100, 0.012, 0.6], [520, 0.05, 0.5]], { skin: 0.7, amp: 0.4 }), t, { vol: 0.07, norm: true, pan: 0.2, room: close, wet: 0.25 });
    K.put(fx.rustle(0.12, { density: 900, rub: 0.15, lo: 1500, hi: 7000, grain: 0.002, env: (u) => Math.exp(-u * 4) }), t2, { vol: 0.02, norm: true, pan: 0.2 }); }

  // ==== THE GRAB: her hand on your sleeve in the black, her gasp, yours; then her breathing beside you
  { const t = F(E.grab);
    K.put(fx.rustle(0.5, { density: 1100, rub: 0.6, lo: 800, hi: 7000, grain: 0.003, env: (u) => Math.min(1, u / 0.015) * Math.pow(1 - u, 1.6) }), t, { vol: 0.2, norm: true, pan: -0.45, room: close, wet: 0.15 });
    K.put(nlGasp(fx, 0.45, { f0: 255, voice: 0.3 }), t + 0.08, { vol: 0.07, norm: true, pan: -0.5, room: close, wet: 0.2 });
    for (let u = t + 1.3; u < 88.5; u += r.range(1.2, 1.7)) K.put(fx.breath(0.5, { voice: 0.12, f0: 240 }), u, { vol: mode(u) === 'her' ? 0.03 : 0.022, norm: true, pan: -0.4, room: close, wet: 0.2 });
    for (const u of [t + 2.3, t + 5.1, t + 7.4]) K.put(fx.rustle(0.35, { density: 400, rub: 0.4, lo: 700, hi: 5000 }), u, { vol: 0.03, norm: true, pan: -0.4 }); }

  // ==== HER PHONE: five presses on the side button, the SOS alarm (a countdown siren), then a call ringing out (425 Hz,
  // 1 s on, 4 s off); and other phones' alarms far off over the ice
  { const t0 = nlC('help', 0) + 0.25;
    seq(5, (k) => K.put(fx.hit([[2400, 0.008, 1], [4100, 0.005, 0.6]], { width: 0.0003, noise: 0.5, nlen: 0.002, nhp: 3000, len: 0.06 }), t0 + 0.21 * k, { vol: 0.045, norm: true, pan: -0.3 }));
    const sos = (d, f0) => { const n = Math.ceil(d * sr), y = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / sr, c = (t % 0.36) / 0.36, on = c < 0.72 ? 1 : 0; ph += 2 * Math.PI * f0 * (1 + 0.55 * Math.min(1, c / 0.72)) / sr; y[i] = Math.tanh(2.5 * Math.sin(ph)) * on * Math.min(1, (c * 0.36) / 0.004, (0.72 - c) * 0.36 / 0.004 + (on ? 0 : 1)) * Math.min(1, t / 0.01, (d - t) / 0.02); } return nlPhoneSpk(y, sr); };
    K.put(sos(3.0, 980), t0 + 1.25, { vol: 0.05, norm: true, pan: -0.3, room: close, wet: 0.2 });
    const ring = () => { const d = 1.0, n = Math.ceil(d * sr), y = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / sr; y[i] = Math.sin(2 * Math.PI * 425 * t) * Math.min(1, t / 0.01, (d - t) / 0.01); } return nlPhoneSpk(y, sr, { hp: 300, lp: 3400 }); };
    for (let k = 0; k < 3; k++) { const t = t0 + 4.9 + 5 * k; K.put(ring(), t, { vol: [0.028, 0.02, 0.012][k], norm: true, pan: -0.3, room: close, wet: 0.2 }); }
    seq(9, () => { const t = t0 + r.range(1.5, 11), d = r.range(2.2, 3.4); K.put(sos(d, r.range(900, 1100)), t, { vol: r.range(0.004, 0.012), norm: true, pan: r.range(-0.9, 0.9), room: open, wet: 1.0, lp: 1800 }); }); }

  // ==== THE MAN AT THE FIRE: slow steps in the squeaking snow, the stop; he gasps and steps back
  { const st = F(E.manStop), near = (t) => (mode(t) === 'feel' ? 0.075 : 0.045);
    for (let t = st - 0.85; t > shot('F2').t0 - 0.1; t -= 0.85) K.put(nlSnowStep(fx, { squeak: r.range(0.35, 0.65) }), t, { vol: near(t) * r.range(0.8, 1), norm: true, pan: -0.2, room: open, wet: 0.25 });
    K.put(nlSnowStep(fx, { squeak: 0.3 }), st, { vol: near(st) * 0.7, norm: true, pan: -0.2, room: open, wet: 0.25 });
    K.put(nlGasp(fx, 0.4, { f0: 125, voice: 0.45 }), st + 0.15, { vol: 0.06, norm: true, pan: -0.2, room: close, wet: 0.2 });
    for (const dt of [0.55, 1.35]) K.put(nlSnowStep(fx, { squeak: 0.6 }), st + dt, { vol: near(st + dt), norm: true, pan: -0.2, room: open, wet: 0.25 }); }

  // ==== THE PLANE: twin jets on the approach, 629 m up at 72 m/s; what reaches you was made d/c earlier, so the pitch
  // falls as it passes (the emission clock runs fast, then slow) and the roar follows it over
  { const s0 = Math.max(E.plane - 30, nlStoryAt(shot('W1').t0) + 0.05), s1 = E.plane + 24, st = 0.02, P = [];   // (from the world cut: the clock jumped there)
    for (let s = s0; s <= s1 + 1e-9; s += st) { const a = NLA.at(s), y = ear(s), d = Math.hypot(a.x - y.x, a.y - 1, a.z - y.z); const fw = (Math.sin(a.yaw) * (y.x - a.x) + Math.cos(a.yaw) * (y.z - a.z)) / d; P.push([s, nlFilmAt(s) + d / C, d, fw]); }
    const tA = Math.max(P[0][1], shot('W2').t0), tB = P[P.length - 1][1], n = Math.ceil((tB - tA) * sr);
    const sE = new Float64Array(n), dE = new Float32Array(n), fE = new Float32Array(n); let j = 0;
    for (let i = 0; i < n; i++) { const tr = tA + i / sr; while (j < P.length - 2 && P[j + 1][1] < tr) j++; const u = MathX.clamp((tr - P[j][1]) / (P[j + 1][1] - P[j][1]), 0, 1); sE[i] = P[j][0] + st * u; dE[i] = P[j][2] + (P[j + 1][2] - P[j][2]) * u; fE[i] = P[j][3] + (P[j + 1][3] - P[j][3]) * u; }
    const roar = nlNoise(fx, n, 'brown'), hiss = nlNoise(fx, n, 'pink');
    for (let i = 0; i < n; i++) roar[i] = roar[i] * 1.0 + hiss[i] * 0.5;
    const NC = Math.ceil(n / sr * 20) + 2, cut = Array.from({ length: NC }, (_, k) => { const d = dE[Math.min(n - 1, Math.round(k / (NC - 1) * (n - 1)))]; return 450 + 7000 * Math.exp(-d / 650); });
    const ro = nlSweep(roar, sr, 'lp', 0.7, cut), y = new Float32Array(n), w = fx.wander(0.4);
    let p1 = 0, p2 = 0, p3 = 0;
    for (let i = 0; i < n; i++) {
      const t = i / sr, s = sE[i], g = Math.pow(630 / dE[i], 2), fw = fE[i], air = Math.exp(-dE[i] / 900);   // (a flyover: steeper than 1/d, for the screen)
      p1 = 2 * Math.PI * 2350 * s; p2 = 2 * Math.PI * 3060 * s; p3 = 2 * Math.PI * 118 * s;
      const whine = (Math.sin(p1) + 0.6 * Math.sin(p2)) * air * (0.35 + 0.65 * Math.max(0, fw)) * 0.18;
      const buzz = (Math.sin(p3) + 0.5 * Math.sin(2 * p3 + 0.4) + 0.3 * Math.sin(3 * p3 + 1.1)) * 0.12;
      y[i] = (ro[i] * (0.8 + 0.25 * Math.max(0, -fw)) * (1 + 0.15 * w(t)) + whine + buzz) * g * Math.min(1, t / 3, (n / sr - t) / 2.5);
    }
    K.put(y, tA, { vol: 0.2, norm: true, room: open, wet: 0.35 }); }

  // ==== THE ROAD: the lorry's diesel creeping along 500 m away; the hit (seen first, heard 1.5 s later); the railing;
  // the car over the bank and onto the ice; its engine still running out there
  { const V = NLV, Lr = (s) => NLV.lorry(s), dl = (s) => { const q = Lr(s), y = ear(s); return Math.hypot(q.x - y.x, q.y + 1 - 1, q.z - y.z); };
    const s0 = nlStoryAt(shot('O1').t0) - 2, s1 = nlStoryAt(shot('S1').t0) + 10, d0 = dl(s0) / C;
    const eng = nlEngine(fx, s1 - s0, (tt) => { const s = s0 + tt, u = s - E.hit; return u < 0 ? 720 : u < 0.4 ? 720 - 260 * (u / 0.4) : 560 + 60 * Math.exp(-(u - 0.4) / 1.5); }, { lp: 420, cyl: 6 });
    for (let i = 0; i < eng.length; i++) { const tt = i / sr; eng[i] *= Math.min(1, tt / 1.5); }
    K.put(eng, F(s0) + d0, { vol: 0.035, norm: true, pan: 0.3, room: open, wet: 0.7 });
    // the hit: a dull crump of steel, the car's glass, metal tearing as it's shoved
    const tH = F(E.hear);
    const boom = fx.hit(fx.panelModes(1.6), { width: 0.012, amp: 1, noise: 0.6, nlen: 0.06, nhp: 250, len: 1.6 });
    K.put(boom, tH, { vol: 0.34, norm: true, pan: 0.3, room: open, wet: 0.7, lp: 3200 });
    K.put(nlThud(fx, { w: 2 }), tH, { vol: 0.2, norm: true, pan: 0.3, room: open, wet: 0.6 });
    { const g = fx.smash({ v: 3.2, g: 9.81, pitch: 0.7, pan: 0.3, len: 1.6 }); K.putLR(g.L, g.R, tH + 0.02, { vol: 0.08, norm: true, room: open, wet: 0.8, lp: 4000 }); }
    K.put(fx.rustle(1.4, { density: 300, rub: 0.5, lo: 700, hi: 4200, grain: 0.01, peak: 1300 }), tH + 0.1, { vol: 0.07, norm: true, pan: 0.3, room: open, wet: 0.8 });
    // the railing (the car's nose reaches it ≈1 s after the hit): posts snapping, the rail ringing; then the bank, the ice
    const tRail = (V.edgeD - 2.2) / V.carV, tBank = V.shoreD / ((V.carV + V.vIce) / 2);
    const dr = (s) => { const c = NLV.car(s), y = ear(s); return Math.hypot(c.x - y.x, c.z - y.z); };
    { const s = E.hit + tRail, t = F(s + dr(s) / C); if (t != null) { K.put(fx.hit(fx.metalModes(640, 0.5), { width: 0.002, amp: 1, noise: 0.5, nlen: 0.02, nhp: 900 }), t, { vol: 0.12, norm: true, pan: 0.3, room: open, wet: 0.8, lp: 3600 }); K.put(fx.hit(fx.woodModes(160, 1.5), { width: 0.004, amp: 1, noise: 0.4 }), t + 0.12, { vol: 0.07, norm: true, pan: 0.3, room: open, wet: 0.8 }); } }
    seq(3, (k) => { const s = E.hit + tRail + 0.4 + k * 0.45, t = F(s + dr(s) / C); if (t != null) K.put(nlThud(fx, { w: 1.4 }), t, { vol: 0.07, norm: true, pan: 0.3, room: open, wet: 0.7, lp: 2500 }); });
    { const s = E.hit + tBank, t = F(s + dr(s) / C); if (t != null) K.put(nlPew(fx, { f0: 2400, f1: 140, d: 1.1, thump: 1.2 }), t, { vol: 0.14, norm: true, pan: 0.25, room: open, wet: 0.8 }); }
  }

  // ==== THE CAR ON THE ICE: its tyres sliding, its engine running on, the crack, the sink, the engine drowning, its
  // air coming up for a minute. The close shots hear it close; elsewhere it's 430 m off (late, dark, far)
  const NEAR = { slide: 1, out: 1, ice: 1, sink: 1, steam: 0.8, behind: 0.5, driver: 0.55, cold: 0.45 };
  const nearC = shotCurve(NEAR, 0), farC = nlCurve((t) => 1 - nearC(t));
  const putNF = (y, t, o) => { putC(y, t, nearC, Object.assign({ room: close, wet: 0.25 }, o)); putC(y, t + 1.3, farC, Object.assign({}, o, { vol: (o.vol || 0.1) * 0.13, room: open, wet: 1.0, lp: 1400 })); };
  { const V = NLV, tBank = V.shoreD / ((V.carV + V.vIce) / 2), sOn = E.hit + tBank, sStop = V.carStop;
    // the slide: tyres scrubbing over the ice, slowing (v from vIce to 0)
    { const t0 = F(sOn), d = F(sStop) - t0, n = Math.ceil(d * sr), y = nlNoise(fx, n, 'pink'), lo = nlNoise(fx, n, 'brown');
      NLX.bq(y, 'bp', 1400, 0.6, sr); NLX.bq(lo, 'lp', 180, 0.7, sr);
      for (let i = 0; i < n; i++) { const u = i / n, v = 1 - u; y[i] = (y[i] * 0.6 + lo[i]) * v * Math.min(1, i / (0.05 * sr)); }
      putNF(y, t0, { vol: 0.12 }); }
    // the engine: idling from the bank to the sink, then drowning (it coughs, slows, stops)
    { const t0 = F(sOn), tS = F(E.sink), d = tS - t0 + 1.8;
      const y = nlEngine(fx, d, (tt) => { const u = tt - (tS - t0); return u < 0 ? 790 + 30 * Math.sin(tt * 0.7) : Math.max(120, 790 * (1 - 0.75 * MathX.smooth(u, 0, 1.6)) * (1 + 0.25 * Math.sin(u * 37))); }, { lp: 900 });
      for (let i = 0; i < y.length; i++) { const u = i / sr - (tS - t0); if (u > 0) y[i] *= Math.max(0, 1 - u / 1.7) * (0.6 + 0.4 * Math.sin(u * 23)); }
      putNF(y, t0, { vol: 0.07, pan: 0.05 }); }
    // the crack under it, then the ice giving way: the crunch, a boom, the water rushing in
    putNF(nlCrack(fx, { size: 0.8 }), F(E.crack), { vol: 0.22 });
    seq(4, (k) => putNF(nlPew(fx, { f0: r.range(2600, 4200), f1: r.range(200, 400), d: r.range(0.4, 0.8), thump: 0.4 }), F(E.crack) + 1.2 + k * r.range(0.9, 1.4), { vol: 0.06 }));
    { const t = F(E.sink);
      putNF(nlCrack(fx, { size: 1 }), t, { vol: 0.3 });
      putNF(nlThud(fx, { w: 2.2 }), t + 0.05, { vol: 0.25 });
      { const g = fx.smash({ v: 5, g: 9.81, pitch: 0.38, len: 2.0 }); putC(g.L, t + 0.03, nearC, { vol: 0.1, room: close, wet: 0.3, pan: -0.2 }); putC(g.R, t + 0.03, nearC, { vol: 0.1, room: close, wet: 0.3, pan: 0.2 }); }
      { const d = 4.5, n = Math.ceil(d * sr), y = nlNoise(fx, n, 'pink'), L = new Float32Array(n), R = new Float32Array(n);
        NLX.bq(y, 'lp', 1300, 0.7, sr); NLX.bq(y, 'hp', 90, 0.7, sr);
        for (let i = 0; i < n; i++) { const tt = i / sr; y[i] *= Math.min(1, tt / 0.25) * Math.exp(-tt / 1.6); }
        for (let tt = 0.1; tt < d; tt += r.range(0.02, 0.07)) fx.bubble(L, R, Math.round(tt * sr), r.range(90, 320), r.range(0.02, 0.06), 0.5 * Math.exp(-tt / 1.8), 0);
        for (let i = 0; i < n; i++) y[i] += L[i] + R[i];
        putNF(y, t + 0.1, { vol: 0.2 }); }
      // the car's air coming up: big glugs, thinning over a minute (the cabin floods, the car goes down nose-first)
      { const d = Math.min(70, shot('X1').t0 - t), n = Math.ceil(d * sr), y = new Float32Array(n), L2 = new Float32Array(n);
        for (let tt = 1.5; tt < d - 1; tt += r.range(0.08, 0.5) * (1 + tt / 12)) fx.bubble(y, L2, Math.round(tt * sr), r.range(70, 260), r.range(0.03, 0.09), Math.exp(-tt / 35) * r.range(0.4, 1), 0);
        for (let i = 0; i < n; i++) y[i] += L2[i];
        putNF(y, t, { vol: 0.09 }); } }
  }

  // ==== THE DRIVER: out through the window as it sinks (a splash), the gasps of cold shock, then calling for help
  // and thrashing; nine minutes on, weak; at the edge, close: ragged breath, teeth, the water lapping
  { const DN = { driver: 1, cold: 1, edge: 0.75, reach: 0.9, cracks: 0.6, behind: 0.45 };
    const dC = shotCurve(DN, 0);
    const dist = (s) => Math.max(1.2, NLY.dist(s) - NLY.dDriver);
    // far: what reaches you (his voice carries; a gasp only close); close: the camera beside him
    const say = (mk, s, o) => { const t = F(s + dist(s) / C); if (t == null) return; const gF = Math.min(1, Math.pow(4 / dist(s), o.k || 0.8)), gN = dC(t), g = Math.max(gF, gN);
      if (g < 0.01) return; K.put(mk(), t, { vol: o.vol * g, norm: true, pan: o.pan || 0, room: gN > gF ? close : open, wet: gN > gF ? 0.25 : Math.min(1, 0.3 + dist(s) / 60), lp: gN > gF ? 9000 : 9000 * Math.exp(-dist(s) / 120) + 900 }); };
    say(() => nlSplash(fx, 2.2, { big: 1 }), E.out, { vol: 0.2, k: 0.4 });
    // the first minute: involuntary gasps, fast, then slowing (s from E.out)
    for (let u = 0.9; u < 75; u += 0.75 + 0.9 * MathX.smooth(u, 0, 60) + r.range(0, 0.25)) {
      const s = E.out + u, big = u < 20 ? 1 : 0.6;
      say(() => nlGasp(fx, r.range(0.35, 0.55), { f0: r.range(135, 160), voice: 0.55 * big }), s, { vol: 0.09 * big, k: 1.1 });
      if (r.next() < 0.35) say(() => nlSplash(fx, 0.9, { big: 0.3 }), s + 0.2, { vol: 0.07, k: 0.9 });
    }
    // calling: "hjelp!" (falling), "hallo!", from 12 s in; every 3–5 s, weaker and rarer after the jump (9 minutes in)
    for (let u = 12; u < 1000; u += u < 120 ? r.range(3, 5) : r.range(6, 10)) {
      const s = E.out + u; if (s > nlSC('reach', 0)) break; const weak = u > 300;
      const f0 = r.range(140, 165) * (weak ? 0.92 : 1), cd = weak ? r.range(0.8, 1.0) : r.range(0.55, 0.75), up = r.next() < 0.7 ? r.range(0.78, 0.86) : r.range(1.1, 1.2), v2 = r.next() < 0.5 ? 'u' : 'a';
      say(() => nlCall(fx, { f0, d: cd, up, v1: 'e', v2, k: 1 }), s, { vol: weak ? 0.07 : 0.12, k: 0.55 });
      say(() => nlSplash(fx, 1.0, { big: weak ? 0.15 : 0.4 }), s + 0.9, { vol: weak ? 0.04 : 0.07, k: 0.9 });
    }
    // nine minutes in, close: shallow ragged breaths, a moan now and then, teeth chattering, the water at the edge
    for (let s = nlStoryAt(shot('V2').t0); s < nlStoryAt(END); s += r.range(1.1, 1.5)) {
      const t = F(s); if (t == null) continue; const late = s > E.out + 300;
      if (dC(t) < 0.3 && dist(s) > 8) continue;
      say(() => fx.breath(0.45, { inhale: true, voice: late ? 0.2 : 0.35, f0: 140 }), s, { vol: late ? 0.035 : 0.06, k: 1.3 });
      say(() => fx.breath(0.55, { voice: late ? 0.3 : 0.2, f0: 120 }), s + 0.5, { vol: late ? 0.035 : 0.05, k: 1.3 });
      if (late && r.next() < 0.5) { const n = Math.round(0.5 * sr), y = new Float32Array(n); for (let k = 0; k < 6; k++) NLX.strike(y, Math.round((0.02 + k * 0.075 + r.range(0, 0.01)) * sr), 3, r.range(0.5, 1), [[r.range(2500, 3500), 0.004, 1], [5200, 0.002, 0.4]], sr); say(() => y, s + 1.0, { vol: 0.02, k: 1.5 }); }
      if (r.next() < 0.6) say(() => nlSplash(fx, 0.6, { big: 0.08 }), s + r.range(0, 1), { vol: 0.025, k: 1.2 });
    }
  }

  // ==== THE SINGING ICE: the black and the listening, dense, near and far; the sheet's whole voice
  { const a = shot('Q1').t0, b = shot('Q2').t1;
    for (let t = a + 0.1; t < b - 0.3; t += r.range(0.25, 1.1)) {
      const far = r.next() < 0.6;
      K.put(nlPew(fx, { f0: r.range(1800, 5200), f1: r.range(120, 520), d: r.range(0.35, 1.4), thump: r.range(0.1, 0.7) }), t, { vol: (far ? 0.03 : 0.07) * r.range(0.5, 1), norm: true, pan: r.range(-0.9, 0.9), room: open, wet: far ? 1.0 : 0.55, lp: far ? 3000 : 9000 });
    }
    seq(5, (k) => K.put(nlIceBend(fx, r.range(1.5, 3), { rate: [3, 10] }), a + 0.4 + k * (b - a - 3) / 5 + r.range(0, 1), { vol: 0.06, norm: true, pan: r.range(-0.6, 0.6), room: open, wet: 0.8 })); }

  // ==== THE PLANE'S END, 4 km off beyond the hills: a deep boom that rolls round the valley while you stand listening
  { const t = NL_BOOM.t, d = 6, n = Math.ceil(d * sr), y = nlNoise(fx, n, 'brown'), w = fx.wander(1.2);
    NLX.bq(y, 'lp', 160, 0.8, sr); NLX.bq(y, 'hp', 22, 0.7, sr);
    for (let i = 0; i < n; i++) { const tt = i / sr; y[i] *= Math.min(1, tt / 0.04) * (Math.exp(-tt / 0.5) + 0.45 * Math.exp(-tt / 2.2) * (1 + 0.5 * w(tt))) * Math.min(1, (d - tt) / 0.5); }
    NLX.strike(y, 0, Math.round(0.03 * sr), 0.4, [[34, 0.6, 1], [52, 0.4, 0.7], [77, 0.25, 0.4]], sr);
    K.put(y, t, { vol: 0.2, norm: true, pan: -0.5, room: open, wet: 1.0, lp: 500 }); }

  // ==== YOUR CRAWL: each arm's reach drags your body over the ice (one stroke per π of the crawl phase), her knees
  // behind, your breath; and the ice creaking more the closer you get to the hole
  { const s0 = E.lie, s1 = nlStoryAt(END); let last = Math.floor(NLY.dist(s0) * NL_CRAWL_PH / Math.PI);
    for (let s = s0 + 0.02; s < s1; s += 0.02) {
      const k = Math.floor(NLY.dist(s) * NL_CRAWL_PH / Math.PI); if (k === last) continue; last = k;
      const t = F(s); if (t == null) continue; const pan = k % 2 ? 0.2 : -0.2;
      K.put(nlRub(fx, 1.1, { lo: 350, hi: 3200, env: (u) => Math.sin(Math.PI * u) }), t - 0.4, { vol: 0.06, norm: true, pan, room: close, wet: 0.2 });
      K.put(fx.hit([[2100, 0.01, 1], [3700, 0.006, 0.5]], { width: 0.0008, noise: 0.3, nlen: 0.003 }), t - 0.45, { vol: 0.018, norm: true, pan });
      K.put(nlRub(fx, 0.8, { lo: 400, hi: 2600, env: (u) => Math.sin(Math.PI * u) }), t + 0.2, { vol: 0.03, norm: true, pan: -0.1, room: close, wet: 0.25 });
      K.put(fx.breath(0.7, { voice: 0.15, f0: 118 }), t + 0.1, { vol: 0.03, norm: true, room: close, wet: 0.15 });
    }
    // creaks, more and lower as the ice thins towards the hole (your distance to it)
    for (let t = shot('X1').t0 + 1; t < END - 0.5; t += r.range(1.6, 3.4)) {
      const s = nlStoryAt(t), d = NLY.dist(s), g = MathX.clamp(1 - (d - 4.4) / 40, 0.2, 1);
      if (shot('Y1').t0 - 0.3 < t && t < shot('Y1').t0 + 0.6) continue;
      K.put(fx.creak(r.range(0.4, 0.9), [[180 + 200 * (1 - g), 0.06, 1], [410, 0.04, 0.6], [900, 0.02, 0.3]], { rate: [30, 90] }), t, { vol: 0.035 * g, norm: true, pan: r.range(-0.6, 0.6), room: open, wet: 0.5 });
    }
  }

  // ==== THE CRACK UNDER YOUR HANDS (in the black), and the small ones after
  { const t = F(E.iceCrack);
    K.put(nlCrack(fx, { size: 1 }), t, { vol: 0.36, norm: true, room: close, wet: 0.35 });
    K.put(nlIceBend(fx, 1.6, { rate: [8, 30], env: (u) => Math.exp(-u * 2.5) }), t + 0.05, { vol: 0.12, norm: true, room: close, wet: 0.3 });
    for (const [dt, sz] of [[0.9, 0.35], [1.7, 0.25], [3.1, 0.45], [6.2, 0.3], [8.4, 0.4], [11.5, 0.3]]) K.put(nlCrack(fx, { size: sz }), t + dt, { vol: 0.12 * sz / 0.45, norm: true, pan: r.range(-0.5, 0.5), room: close, wet: 0.4 }); }

  // ==== THE REACH: your fingers on his wet sleeve; then the ice under your chest starts to bend (to the last frame)
  { const sC = nlSC('reach', 0) + 1.75, tC = F(sC), tB = nlC('reach', 1);
    if (tC != null) { K.put(fx.rustle(0.4, { density: 700, rub: 0.45, lo: 300, hi: 2600, grain: 0.005 }), tC, { vol: 0.07, norm: true, pan: 0.15, room: close, wet: 0.2 });
      { const n = Math.round(0.9 * sr), L = new Float32Array(n), R = new Float32Array(n); for (let k = 0; k < 7; k++) fx.bubble(L, R, Math.round(r.range(0.05, 0.8) * sr), r.range(1200, 2600), r.range(0.003, 0.008), r.range(0.2, 0.5), 0); for (let i = 0; i < n; i++) L[i] += R[i]; K.put(L, tC, { vol: 0.03, norm: true, pan: 0.15, room: close, wet: 0.3 }); }
      K.put(nlGasp(fx, 0.6, { f0: 128, voice: 0.3 }), tC + 0.3, { vol: 0.045, norm: true, pan: 0.15, room: close, wet: 0.2 });
      K.put(fx.breath(1.8, { voice: 0.12, f0: 112 }), tB + 0.35, { vol: 0.04, norm: true, room: close, wet: 0.15 }); }
    // the bend: a deep groan of the plate that grows to the end; small fractures ticking; the water seeping up
    const d = END - tB + 0.2;
    K.put(nlIceBend(fx, d, { rate: [4, 22], env: (u) => Math.pow(MathX.smooth(u, 0, 1), 1.3) * (0.3 + 0.7 * u) }), tB, { vol: 0.2, norm: true, room: close, wet: 0.3 });
    for (let t = tB + 0.6; t < END - 0.3; t += r.range(0.25, 0.9) * (1.3 - 0.8 * (t - tB) / d)) K.put(nlCrack(fx, { size: r.range(0.08, 0.25) }), t, { vol: r.range(0.03, 0.07), norm: true, pan: r.range(-0.7, 0.7), room: close, wet: 0.35 });
    { const n = Math.ceil((END - tB) * sr), y = nlNoise(fx, n, 'pink'), L = new Float32Array(n), R = new Float32Array(n);
      NLX.bq(y, 'bp', 700, 0.8, sr);
      for (let i = 0; i < n; i++) y[i] *= MathX.smooth(i / sr, 0.6, 4) * 0.4;
      for (let t = 0.8; t < n / sr - 0.2; t += r.range(0.05, 0.2)) fx.bubble(L, R, Math.round(t * sr), r.range(600, 1800), r.range(0.004, 0.012), 0.25 * MathX.smooth(t, 0.8, 4), 0);
      for (let i = 0; i < n; i++) y[i] += L[i] + R[i];
      K.put(y, tB, { vol: 0.04, norm: true, pan: 0.1, room: close, wet: 0.25 }); } }
});
