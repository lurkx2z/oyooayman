/* =====================================================================
   SOUND · SFX — the events. Each one happens at a story second (physics.js) and is heard at the film time that second
   comes round (gtWhen), once: the clock only runs forward, so nothing is ever heard twice, and an event that falls
   in a jump of the clock is not heard at all. Long sounds are cut at the next jump. A sound out in the street is as
   loud as the camera is near it (gtNear: the pile at the bottom is 285 m from your window), and is heard through the
   walls from inside; the bedroom's own sounds are heard in the bedroom.
     7:42:00    the house groans as it takes the load sideways; you gasp and land on the glass; the mug cracks it;
                the rug, the bed, the wardrobe, the desk, the lamp, the chair, the laptop, the cat, the books; the shed
                behind the house hits your back wall
     the street the parked cars, the bins and a garden chair hitting the bottom (at their speeds); the roof tiles all
                hour; the jogger on her lamp post
     the hour   the glass ticking as its cracks run; your breath; the cat purring; the bath water through your door;
                your phone's emergency alert; the trees; the terrace's mortar; the house creaking; the rain on her
                lamp post; the terrace letting go, falling, hitting; the pool; the window going; the bolt
     8:42:00    you, the cat, the books drop; the house springs back; the pile drops; the jogger sits down
   ===================================================================== */

gtSound('sfx', 'events', function (ctx, bus, K) {
  const { fx, sr } = K, r = new RNG(5501), END = GT.end + 1.2;
  const room = K.verb('room', 0.8, { bright: 0.55, damp: 5, wet: 0.22 });
  const street = K.verb('street', 1.6, { bright: 0.5, damp: 4, wet: 0.2 });
  const hill = K.verb('hill', 3.0, { bright: 0.42, damp: 2.2, shape: 1.6, pre: 0.035, wet: 0.4 });       // the far end, off the hillside
  const mix = (...parts) => { const n = Math.max(...parts.map(([y, dt]) => y.length + Math.round(dt * sr))), out = new Float32Array(n); for (const [y, dt, g] of parts) gtAddAt(out, y, dt, g ?? 1, sr); return out; };
  const scale = (y, g) => { for (let i = 0; i < y.length; i++) y[i] *= g; return y; };
  const norm = (y) => scale(y, 1 / (GTX.peak(y) || 1));

  // ---- placing an event -------------------------------------------------------------------------------------------
  // a sound may ring until the next jump of the clock (a cut that moves the hour on cuts it off)
  const ring = (t) => { const j = GT_JUMPS.find((jp) => jp.t > t + 1e-6); return Math.min(j ? j.t : Infinity, END); };
  // how near a street sound at (x, y) is, as curves over film time (cached): its level and the low-pass of the distance
  // (or of the walls, from inside)
  const NC = {};
  const nearC = (x, y, k, wall) => { const key = [x, y, k, wall].join(); if (!NC[key]) { const f = (t) => gtNear(t, x, y, { k, wall }); NC[key] = { g: gtCurve((t) => f(t).g), lp: gtCurve((t) => f(t).lp) }; } return NC[key]; };
  // shape y (starting at film time t0) by a nearness curve: level × g(t), through a two-pole low-pass at lp(t)
  const shape = (y, t0, C) => {
    let y1 = 0, y2 = 0, prim = true;
    for (let i = 0; i < y.length; i++) {
      const t = t0 + i / sr, fc = C.lp(t), g = C.g(t);
      if (fc > 1 && fc < 12000) { if (prim) { y1 = y2 = y[i]; prim = false; } const a = 1 - Math.exp(-2 * Math.PI * fc / sr); y1 += a * (y[i] - y1); y2 += a * (y1 - y2); y[i] = y2 * g; }
      else { y1 = y2 = y[i]; prim = true; y[i] *= g; }
    }
    return y;
  };
  // an event at story second sE. place: 'in' | 'out' | 'any' (o.big: heard muffled from the other side), or o.x / o.y
  // for a sound out in the street (heard by distance, and through the walls inside: o.k, o.wall). make(w) builds it once
  // (mono, or { L, R }). o.vol its peak at full level, o.pan, o.len (cut after), o.dt (film s), o.room, o.wet
  const ev = (sE, place, make, o = {}) => {
    const w = gtWhen(sE); if (!w || w.where === 'river') return null;
    if (o.pred && !o.pred(w)) return null;
    const t = w.t + (o.dt || 0);
    let C = null, g = 1, lp = 0;
    if (o.x != null) { C = nearC(o.x, o.y ?? 1, o.k ?? 0.75, o.wall ?? 0.35); if (Math.max(C.g(t), C.g(t + 0.5), C.g(t + 2)) < 0.002) return null; }
    else if (place !== 'any' && place !== w.where) { if (!o.big) return null; g = 0.3; lp = 600; }
    const b = make(w), stop = Math.min(ring(t), t + (o.len || 30)), keep = Math.max(8, Math.ceil((stop - t + 0.2) * sr));
    let L = b.L || b, R = b.R || null;
    const pk = GTX.peak(L, R) || 1; L = L.slice(0, keep); if (R) R = R.slice(0, keep);
    scale(L, 1 / pk); if (R) scale(R, 1 / pk);
    if (C) { shape(L, t, C); if (R) shape(R, t, C); }
    const opt = { vol: (o.vol || 0.05) * g, pan: o.pan || 0, room: o.room || (w.where === 'in' ? room : street), wet: o.wet ?? 0.3, stop: Math.max(t + 0.05, stop), fade: o.fade || 0.12 };
    if (lp) opt.lp = lp;
    if (R) K.putLR(L, R, t, opt); else K.put(L, t, opt);
    return w;
  };
  // a run of events every `every` story seconds from sA to sB, in the stretches of film that show them (thinned so
  // they are never closer than o.gap film seconds); make() is called for a few variants
  const series = (sA, sB, every, place, make, o = {}) => {
    const bufs = [0, 1, 2, 3].map(() => norm(make()));
    for (const sp of gtSpan(sA, sB)) {
      if (sp.where === 'river' || (o.x == null && place !== 'any' && place !== sp.where)) continue;
      if (o.pred && !o.pred(sp)) continue;
      if (o.maxRate && sp.rate > o.maxRate) continue;
      const m = Math.max(1, Math.ceil((o.gap || 0) * sp.rate / every));
      const C = o.x != null ? nearC(o.x, o.y ?? 1, o.k ?? 0.75, o.wall ?? 0.35) : null;
      let k = Math.ceil((sp.sA - sA) / every);
      for (let s = sA + k * every; s < sp.sB && s < sB; s = sA + ++k * every) {
        if (k % m) continue;
        const t = sp.tA + (s - sp.sA) / sp.rate + r.range(-0.008, 0.008), g = C ? C.g(t) : 1; if (g < 0.003) continue;
        K.put(bufs[k % 4], t, { vol: (o.vol || 0.02) * g * r.range(0.7, 1.0), pan: (o.pan || 0) + r.range(-0.15, 0.15), lp: C && C.lp(t) > 1 ? C.lp(t) : undefined, room: sp.where === 'in' ? room : street, wet: o.wet ?? 0.25 });
      }
    }
  };

  // ---- the materials ----------------------------------------------------------------------------------------------
  const body = (w = 1, f = 62) => fx.woodStep({ weight: w, body: f, scuff: 0 });
  const thump = (f = 40, d = 0.7, dk = 0.18) => { const y = fx.arr(d); for (let i = 0; i < y.length; i++) { const u = i / sr; y[i] = Math.sin(2 * Math.PI * f * u * (1 - 0.12 * Math.min(1, u / dk))) * Math.exp(-u / dk) * Math.min(1, u / 0.003); } return y; };
  // timber: a joint creaking (stick-slip), and a whole frame groaning under a load
  const timber = (d, f = 1, o = {}) => fx.creak(d, [[r.range(110, 150) * f, 0.03, 1], [r.range(260, 320) * f, 0.02, 0.6], [r.range(540, 640) * f, 0.012, 0.35], [r.range(1100, 1300) * f, 0.006, 0.15]], { rate: o.rate || [12, 38], jit: 0.35, env: o.env });
  const groan = (d, f = 1, sway = 0) => {
    const y = mix([timber(d, 0.55 * f, { rate: [8, 22], env: (u) => Math.min(1, u / 0.04) * Math.pow(1 - u, 1.2) }), 0], [timber(d * 0.7, 1.1 * f, { rate: [20, 50] }), 0.05, 0.5], [thump(30, 0.9, 0.3), 0, 0.5]);
    if (sway) for (let k = 1; k <= sway; k++) gtAddAt(y, timber(0.35, 0.8 * f, { rate: [16, 40] }), k / 1.6 - 0.12, Math.pow(0.6, k), sr);   // (the frame swinging back and forth: 1.6 Hz)
    return y;
  };
  // glass: a sharp crack, a tiny tick as a crack runs, the pane booming under a body, a groan under a load
  const crack = (o = {}) => { const y = fx.arr(o.len || 0.4), n = Math.round(0.012 * sr), z = fx.white(n); for (let i = 0; i < n; i++) y[i] = z[i] * Math.exp(-i / (0.0018 * sr)); GTX.bq(y, 'hp', o.hp || 1800, 0.7, sr); GTX.strike(y, 0, Math.round(0.0004 * sr), 0.6 * (o.ring ?? 1), [[r.range(2800, 3400), 0.03, 1], [r.range(4600, 5400), 0.02, 0.6], [r.range(7000, 8200), 0.012, 0.4]], sr); return y; };
  const tick = () => crack({ len: 0.09, hp: r.range(2500, 4000), ring: 0.4 });
  const pane = (w = 1) => mix([fx.hit([[r.range(80, 95), 0.08, 1], [r.range(150, 170), 0.06, 0.7], [270, 0.05, 0.5], [430, 0.03, 0.3], [700, 0.02, 0.2]], { width: 0.008 * w }), 0], [fx.creak(0.25, [[1900, 0.006, 1], [3100, 0.004, 0.5]], { rate: [60, 110], env: (u) => Math.exp(-u * 6) }), 0.01, 0.25]);
  const glassGroan = (d) => fx.creak(d, [[r.range(380, 440), 0.04, 1], [r.range(900, 1000), 0.02, 0.5], [2200, 0.008, 0.25]], { rate: [6, 18], jit: 0.5, env: (u) => Math.sin(Math.PI * u) });
  // metal: the lamp post (a hollow steel pole), a bolt
  const pole = (w = 1) => fx.hit(fx.metalModes(r.range(340, 420), 1.4), { width: 0.0025 / w, noise: 0.2 * w });
  // brick, rubble: a granular crunch (o.d long, o.env), and a single brick clacking
  const rubble = (d, o = {}) => { const y = fx.rustle(d, { density: o.density || 1500, rub: 0.35, lo: o.lo || 180, hi: o.hi || 3200, grain: 0.005, env: o.env }); for (let k = 0; k < (o.n || 12); k++) { const u = r.next(), e = o.env ? o.env(u) : 1; GTX.strike(y, Math.round(u * d * sr), Math.round(0.002 * sr), r.range(0.3, 1) * e, fx.stoneModes(r.range(1.1, 2.2)), sr); } return y; };
  const brick = () => fx.hit(fx.stoneModes(r.range(1.6, 2.6)), { width: 0.0018, noise: 0.25, nhp: 1500 });
  const mortar = () => mix([crack({ len: 0.06, hp: 1200, ring: 0.15 }), 0], [rubble(0.07, { density: 900, n: 2, lo: 600, hi: 5000 }), 0.003, 0.4]);
  // a tile (a clay slate clacking onto the heap)
  const tile = () => fx.hit(fx.stoneModes(r.range(2.4, 3.6)).map(([f, tau, a]) => [f, tau * 0.8, a]), { width: 0.0012, noise: 0.4, nhp: 2500, extra: [[r.range(0.04, 0.09), 0.0008, 0.3]] });
  // a plastic bin / chair hitting: a hollow body, its lid, the rubbish
  const plastic = (big = 1) => mix([fx.hit([[r.range(95, 125) / big, 0.06, 1], [r.range(210, 260) / big, 0.04, 0.7], [480, 0.025, 0.4], [950, 0.012, 0.25]], { width: 0.004, noise: 0.5, nhp: 1200 }), 0], [fx.rustle(0.6, { density: 700, rub: 0.2, lo: 700, hi: 6000, grain: 0.006, env: (u) => Math.exp(-u * 4) }), 0.02, 0.5]);
  // books: a slap of covers and pages
  const book = (onGlass) => mix([fx.slap(onGlass ? [[r.range(300, 360), 0.03, 1], [r.range(800, 900), 0.015, 0.5]] : fx.woodModes(r.range(160, 220), 0.6), { amp: 0.8 }), 0], [fx.rustle(0.12, { density: 900, rub: 0.3, lo: 1200, hi: 7000, grain: 0.003 }), 0.004, 0.4]);
  // water pouring and splashing (o.d long, env(u)), lapping
  const pour = (d, env) => {
    const y = gtNoise(fx, Math.ceil(d * sr), 'pink'); GTX.bq(y, 'bp', 900, 0.5, sr);
    const z = fx.white(y.length); GTX.bq(z, 'hp', 2800, 0.7, sr); GTX.bq(z, 'lp', 9000, 0.7, sr);
    const wv = fx.wander(2.2), L = fx.arr(d + 0.1), R = fx.arr(d + 0.1);
    for (let i = 0; i < y.length; i++) { const u = i / y.length, e = env(u) * (0.8 + 0.2 * wv(i / sr)); y[i] = (y[i] + 0.35 * z[i] * (0.6 + 0.4 * Math.abs(wv(i / sr * 3)))) * e; }
    for (let i = 0; i < y.length; i++) { L[i] = y[i]; R[i] = y[i]; }
    for (let t = 0; t < d; t += r.range(0.006, 0.03)) fx.bubble(L, R, Math.round(t * sr), r.range(500, 2400), r.range(0.006, 0.02), 0.25 * env(t / d), r.range(-0.6, 0.6));
    return { L, R };
  };
  // a breath (yours; hers is higher): o.in, o.voice, f0
  const breathe = (d, o = {}) => fx.breath(d, Object.assign({ env: (u) => Math.sin(Math.PI * Math.min(1, u * 1.1)) }, o));
  // the emergency alert: two tones together (853 Hz + 960 Hz), on 2 s, off, on, off, on; the phone buzzing with it
  const alert = () => {
    const P = [[0, 2.0], [2.45, 0.95], [3.85, 0.95]], d = 4.9, y = fx.arr(d);
    for (const [a, l] of P) for (let i = 0; i < l * sr; i++) { const u = i / sr, e = Math.min(1, u / 0.01, (l - u) / 0.02); y[Math.round(a * sr) + i] += (Math.sin(2 * Math.PI * 853 * u) + Math.sin(2 * Math.PI * 960 * u)) * 0.5 * e; }
    const bz = fx.arr(d), z = gtNoise(fx, bz.length, 'white'); GTX.bq(z, 'bp', 175, 3, sr);
    for (let i = 0; i < bz.length; i++) { const u = i / sr; bz[i] = z[i] * ((u % 0.9) < 0.55 ? 1 : 0) * Math.min(1, u / 0.02) * 6; }
    for (let i = 0; i < y.length; i++) y[i] = Math.tanh(1.6 * y[i]) * 0.8 + 0.12 * bz[i];
    return y;
  };
  // the cat purring: ~25 Hz pulses of breath, in and out
  const purr = (d) => {
    const y = fx.arr(d), z = gtNoise(fx, y.length, 'pink'); GTX.bq(z, 'lp', 900, 0.7, sr); GTX.bq(z, 'hp', 70, 0.7, sr);
    for (let i = 0; i < y.length; i++) { const u = i / sr, cyc = u % 2.0, inh = cyc < 0.85, a = inh ? Math.sin(Math.PI * cyc / 0.85) : cyc > 0.95 ? Math.sin(Math.PI * (cyc - 0.95) / 1.05) : 0, f = inh ? 24 : 27; y[i] = z[i] * a * Math.pow(0.5 + 0.5 * Math.sin(2 * Math.PI * f * u), 3) * (inh ? 0.8 : 1); }
    return y;
  };

  // ================================================================================================= 7:41:58 → 7:42:00
  ev(-0.9, 'in', () => fx.woodStep({ weight: 0.35, creak: true }), { vol: 0.02, pan: 0.1 });                          // a board under your feet
  ev(-0.5, 'in', () => fx.liquid(0.35, (t) => Math.sin(Math.PI * t / 0.35)), { vol: 0.012, pan: 0.2 });                        // the coffee in the mug

  // ================================================================================================= 7:42:00: the turn
  // the house takes the load sideways: one deep groan through every joint, then the frame swinging (gtLean's sway)
  ev(0.0, 'any', () => groan(2.4, 1, 4), { x: -4, y: 4, wall: 1.0, k: 0.6, vol: 0.13, pan: -0.1, room, wet: 0.25 });
  // you: the gasp, the 17 cm onto the glass (the pane booms), the mug in your hand cracks it, the coffee
  ev(0.03, 'in', () => breathe(0.32, { inhale: true }), { vol: 0.05 });
  ev(GT_YOU.hitGlass, 'in', () => mix([pane(1.4), 0], [body(1.1, 58), 0.004, 0.8], [crack({ ring: 1.2 }), 0.012, 0.9], [fx.hit(fx.cupModes(), { width: 0.0005 }), 0.01, 0.5], [fx.liquid(0.45, (t) => Math.exp(-t * 10) * Math.min(1, (0.45 - t) / 0.05)), 0.02, 0.35]), { vol: 0.13, pan: 0.05 });
  ev(GT_YOU.hitGlass + 0.12, 'in', () => breathe(0.5, { voice: 0.5, f0: 115 }), { vol: 0.035 });
  // the room falls 0.7–1.7 m east: the rug, the bed (its frame, its springs), the wardrobe onto the bed's head, the desk,
  // the lamp, the chair's corner into the window (a second crack), the laptop, the cat (feet first), the books
  const rf = (k) => gtDropT(GT_ROOM[k].d);
  ev(rf('rug'), 'in', () => mix([thump(55, 0.3, 0.06), 0], [fx.rustle(0.2, { density: 500, rub: 0.5, lo: 300, hi: 2500, grain: 0.01 }), 0, 0.5]), { vol: 0.05, pan: 0.0 });
  ev(rf('bed'), 'in', () => mix([fx.hit(fx.woodModes(85, 1.4), { width: 0.006, noise: 0.3 }), 0], [thump(48, 0.6, 0.12), 0, 0.8], [fx.hit(fx.metalModes(r.range(320, 380), 1.8), { width: 0.003 }), 0.01, 0.25], [fx.hit(fx.woodModes(120, 1.2), { width: 0.006 }), 0.03, 0.7]), { vol: 0.15, pan: -0.45, big: true });
  ev(rf('desk'), 'in', () => mix([fx.hit(fx.woodModes(130, 1.3), { width: 0.005, noise: 0.3 }), 0], [thump(60, 0.4, 0.08), 0, 0.6]), { vol: 0.11, pan: 0.45 });
  ev(rf('lamp'), 'in', () => mix([fx.hit(fx.metalModes(r.range(700, 800), 0.6), { width: 0.0015 }), 0], [fx.smash({ v: 2.5, g: 9.81, pitch: 1.8, len: 0.7 }).L, 0.01, 0.4]), { vol: 0.05, pan: 0.5 });
  ev(rf('chair'), 'in', () => mix([fx.hit(fx.woodModes(170, 0.9), { width: 0.004 }), 0], [crack({ ring: 0.9 }), 0.05, 0.8], [pane(0.8), 0.05, 0.5]), { vol: 0.11, pan: 0.15 });
  ev(rf('laptop'), 'in', () => fx.hit([[r.range(260, 300), 0.03, 1], [r.range(900, 1050), 0.02, 0.6], [2600, 0.008, 0.3]], { width: 0.002, noise: 0.3 }), { vol: 0.06, pan: 0.4 });
  ev(GT_CAT.land, 'in', () => mix([body(0.3, 120), 0], [gtMeow(fx, { d: 0.45, f0: [560, 820, 600], open: 0.9 }), 0.06, 0.8]), { vol: 0.05, pan: -0.3 });
  { const W = gtWardrobe(5); ev(W.hit2, 'in', () => mix([fx.hit(fx.woodModes(75, 1.6), { width: 0.012, noise: 0.2 }), 0], [thump(42, 0.7, 0.16), 0, 0.9], [fx.hit(fx.metalModes(330, 1.5), { width: 0.004 }), 0.02, 0.2]), { vol: 0.14, pan: -0.55, big: true }); }
  for (const [i, b] of GT_BOOKS.entries()) if (i % 2 === 0) ev(gtDropT(b.d), 'in', () => book(b.glass), { vol: 0.04 * r.range(0.6, 1), pan: -0.2 + 0.05 * (i % 7) });
  // the shed in the back garden falls the 11 m onto your house's back wall
  ev(gtDropT(11.0), 'any', () => mix([fx.hit(fx.woodModes(70, 1.6), { width: 0.01, noise: 0.3 }), 0], [thump(36, 0.9, 0.2), 0, 1], [fx.hit(fx.metalModes(560, 0.8), { width: 0.002 }), 0.03, 0.3], [fx.hit(fx.metalModes(830, 0.6), { width: 0.002 }), 0.07, 0.2], [fx.smash({ v: 3, g: 9.81, pitch: 0.9, len: 1 }).L, 0.02, 0.3]), { x: -12, y: 2, wall: 0.8, k: 0.6, vol: 0.12, pan: -0.6 });
  // the glass, while you lie on it: its cracks run (ticks), it groans; your breath; off it, onto the wall
  for (const s of [5.0, 9.6, 13.2, 22.4, 24.9, 27.1, 28.6, 30.2, 32.8, 34.1, 36.5]) ev(s, 'any', () => tick(), { x: 0, y: 4.5, wall: 1.0, k: 1.1, vol: 0.03, pan: r.range(-0.2, 0.2) });
  ev(30.0, 'in', () => glassGroan(2.2), { vol: 0.025, pan: 0.1 });
  for (let s = 29.8; s < 36; s += 2.6) { ev(s, 'in', () => breathe(1.0, { inhale: true }), { vol: 0.02 }); ev(s + 1.15, 'in', () => breathe(1.2, {}), { vol: 0.018 }); }
  for (const s of [35.4, 37.2, 39.0, 41.5, 44.6, 48.0, 50.6]) ev(s, 'in', () => mix([fx.rustle(0.5, { density: 300, rub: 0.4, lo: 600, hi: 4500, grain: 0.015 }), 0], [fx.slap(fx.woodModes(r.range(180, 230), 0.5), { amp: 0.6 }), 0.25, 0.6]), { vol: 0.03, pan: r.range(-0.3, 0.3) });
  ev(52.3, 'in', () => breathe(1.4, { voice: 0.25, f0: 110 }), { vol: 0.03 });                                          // (off it: the breath out)

  // ================================================================================================= the street
  // the parked cars hit the bottom (24–67 m/s), the bins, a garden chair: big, heard by distance (and off the hill)
  for (const f of GT_FALLERS) {
    const x = Math.min(284, f.stop + f.len), v = f.vHit;
    if (f.k === 'car') ev(f.tHit, 'out', () => mix([gtCrunch(fx, { big: 1.0 + 0.4 * r.next(), len: 2.6 }), 0], [fx.smash({ v: 5, g: 9.81, pitch: 1.2, len: 1.6 }).L, 0.01, 0.5], [thump(34, 1.0, 0.25), 0, 0.9 * Math.min(1, v / 60)]), { x, y: 1, k: 0.45, vol: 0.1 + 0.12 * Math.min(1, v / 70), pan: f.z / 8, room: hill, wet: 0.45 });
    else ev(f.tHit, 'out', () => plastic(f.k === 'bin' ? 1 : 0.7), { x, y: 0.6, k: 0.75, vol: 0.06, pan: f.z / 8, room: hill, wet: 0.35 });
  }
  // the roof tiles, landing on the heap all hour (most in the first minutes)
  {
    const lands = GT_TILES.map((T) => T.s0 + gtDropT(T.d, T.vt)).filter((s) => s < GTP.tBack).sort((a, b) => a - b);
    for (const s of lands) { const w = gtWhen(s); if (!w || w.where !== 'out' || (w.rate > 3 && r.next() < 0.7)) continue; ev(s, 'out', () => tile(), { x: 281, y: r.range(1, 6), k: 0.9, vol: 0.035 * r.range(0.6, 1), pan: r.range(-0.5, 0.5), wet: 0.3 }); }
  }
  // the pile settling: metal creaking, now and then (heard near the bottom)
  for (let s = 9; s < 900; s += 4 + 0.04 * s * (1 + r.next())) ev(s, 'out', () => fx.creak(r.range(0.4, 0.9), fx.metalModes(r.range(180, 300), 0.4), { rate: [10, 30] }), { x: 283, y: 2, k: 0.9, vol: 0.03, pan: r.range(-0.4, 0.4) });

  // ---- the jogger: flung back past the lamp post, she hooks it (0.72); hangs; climbs on top; sits; rain; edges down
  {
    const J = GT_JOG, X = J.post.x, she = (d, o = {}) => breathe(d, Object.assign({ f0: 210 }, o));
    ev(0.05, 'out', () => she(0.45, { inhale: true, voice: 0.5 }), { x: X, y: 1.6, vol: 0.05 });
    ev(J.catch, 'out', () => mix([pole(1.3), 0], [she(0.3, { voice: 0.8 }), 0.02, 0.8]), { x: X, y: 1.5, vol: 0.08 });
    // hanging (92 → 100): hard breaths, her grip shifting on the steel
    for (let s = 92.3, k = 0; s < 100; s += 1.15, k++) ev(s, 'out', () => she(0.55, { inhale: k % 2 === 0, voice: 0.35 }), { x: X, y: 1.5, vol: 0.035, pan: -0.1 });
    for (const s of [93.8, 96.9, 98.7]) ev(s, 'out', () => mix([fx.slap(fx.metalModes(380, 0.3), { amp: 0.5 }), 0], [fx.creak(0.2, [[2600, 0.004, 1], [4100, 0.003, 0.5]], { rate: [80, 160] }), 0.02, 0.3]), { x: X, y: 1.5, vol: 0.03, pan: -0.15 });
    // the climb (100 → 132): effort, her shoes on the pole, sitting on top
    for (const s of [101, 106, 111.5, 117, 122, 127.5]) ev(s, 'out', () => mix([she(0.4, { voice: 0.9 }), 0], [pole(0.7), 0.1, 0.5]), { x: X, y: 1.5, vol: 0.05, pan: -0.1 });
    ev(131.5, 'out', () => mix([pole(1.0), 0], [she(0.9, { voice: 0.3 }), 0.1, 0.6]), { x: X, y: 1.6, vol: 0.05 });
    // the rain reaches her (448.6): a gasp; the drops ringing on the steel
    ev(448.7, 'out', () => she(0.4, { inhale: true, voice: 0.6 }), { x: X, y: 1.6, vol: 0.05 });
    series(449, 470, 0.045, 'out', () => fx.hit(fx.metalModes(r.range(1600, 2600), 0.15), { width: 0.0003 }), { x: X, y: 1.5, k: 1.2, vol: 0.012, gap: 0.03 });
    // edging down (3020 → 3080): her shoes squeaking and sliding on the steel
    for (const s of [3060, 3064.5, 3069, 3074, 3078.5, 3082]) ev(s, 'out', () => mix([fx.creak(0.25, [[r.range(1700, 2300), 0.005, 1], [3600, 0.003, 0.4]], { rate: [70, 140] }), 0], [pole(0.4), 0.15, 0.5]), { x: X, y: 0.8, vol: 0.035 });
    // the last seconds: her breath, fast (the first quick cut is her)
    for (let s = 3590.1; s < 3591.6; s += 0.42) ev(s, 'out', () => she(0.3, { voice: 0.3 }), { x: X, y: 0.6, vol: 0.03 });
    // 8:42:00: the 45 cm onto the pavement; then a breathless laugh
    ev(GTP.tBack + gtDownT(J.lowY), 'out', () => mix([fx.step({ weight: 1.0 }), 0], [she(0.3, { voice: 0.9 }), 0.02, 0.6]), { x: X, y: 0.3, vol: 0.06 });
    for (const [k, s] of [3604.6, 3604.85, 3605.1, 3605.38].entries()) ev(s, 'out', () => she(0.17, { voice: 1.0, f0: 240 - 10 * k }), { x: X, y: 0.6, vol: 0.035 });
  }

  // ================================================================================================= the hour
  // ---- your house: a creak now and then, inside and seen from outside (wood creeps: the creaks thin out over the hour)
  {
    const HOUSE = ['tipped', 'house', 'wood', 'creak', 'pit', 'sick', 'cat', 'bath', 'phone', 'pool', 'ready', 'lastin', 'lurch', 'creep', 'question'];
    for (let t = 6; t < GT.hold - 0.5; t += 1.6 + 3.2 * r.next()) {
      const sh = gtShotAt(t); if (!HOUSE.includes(sh.mode)) continue;
      const s = gtStoryAt(t); ev(s, 'any', () => timber(r.range(0.4, 1.1), r.range(0.7, 1.3)), { x: -4, y: 4, wall: 1.0, k: 0.8, vol: 0.03 * r.range(0.5, 1), pan: r.range(-0.6, 0.6) });
    }
    // "It creaks. It leans. It holds." (one long creak on each word)
    const Wd = gtCap('wood', 1).words;
    for (const [k, i] of [1, 3, 5].entries()) if (Wd[i]) ev(gtStoryAt(Wd[i].start), 'any', () => groan(1.4 - 0.2 * k, 0.9 + 0.1 * k), { x: -4, y: 4, wall: 1.0, k: 0.8, vol: 0.06, pan: -0.2 + 0.2 * k, len: 1.6 });
  }
  // ---- the pit: behind your door (the ceiling now), a thump somewhere in the house
  ev(141.5, 'in', () => mix([thump(45, 0.5, 0.12), 0], [fx.hit(fx.woodModes(90, 1.2), { width: 0.01 }), 0, 0.5]), { vol: 0.04, pan: 0, lp: 0, room, wet: 0.5 });
  // ---- the sickness: your breath, slow; a swallow
  for (let s = 153.2, k = 0; s < 163; s += 2.4, k++) ev(s, 'in', () => breathe(k % 2 ? 1.3 : 1.0, { inhale: k % 2 === 0, voice: k % 2 ? 0.15 : 0 }), { vol: 0.03 });
  ev(158.6, 'in', () => fx.creak(0.18, [[260, 0.02, 1], [600, 0.01, 0.4]], { rate: [40, 70] }), { vol: 0.02 });
  // ---- the cat: purring, washing
  ev(163.6, 'in', () => purr(5.0), { vol: 0.045, pan: 0.1, len: 4.5 });
  series(163.5, 168, 0.32, 'in', () => fx.rustle(0.08, { density: 1500, rub: 0.6, lo: 1500, hi: 6000, grain: 0.004 }), { vol: 0.01, pan: 0.1 });
  // ---- the bath water: through the edges of your door (170 → 380), falling the 3.6 m onto your window wall
  for (const sp of gtSpan(GT_BATH.t0, GT_BATH.t1)) {
    if (sp.where !== 'in') continue;
    const flow = (s) => gtSm(s, GT_BATH.t0, GT_BATH.t0 + 12) * (1 - gtSm(s, GT_BATH.t1 - 50, GT_BATH.t1)), d = sp.tB - sp.tA;
    const b = pour(d + 0.2, (u) => 0.15 + 0.85 * flow(sp.sA + u * (sp.sB - sp.sA)));
    K.putLR(b.L, b.R, sp.tA, { vol: 0.05, norm: true, room, wet: 0.35, stop: sp.tB + 0.06, fade: 0.06 });
  }
  // ---- your phone: the emergency alert (7:45:55), and "Thanks." (a breath out through the nose)
  ev(GTP.alert, 'in', () => alert(), { vol: 0.055, pan: -0.15, len: 4.9, wet: 0.12 });
  ev(gtStoryAt(gtC('phone', 1)) + 0.4, 'in', () => breathe(0.6, { teeth: false }), { vol: 0.03 });
  ev(gtStoryAt(gtE('phone')), 'in', () => gtClick(fx, { f: 2900, tau: 0.003, len: 0.05, hp: 900 }), { vol: 0.015, pan: -0.15 });
  // ---- the trees bend: their leaves thrashing as they swing out, a limb creaking
  {
    const sh = GT_SHOTS.find((s) => s.mode === 'trees');
    K.put(fx.rustle(sh.t1 - sh.t0, { density: 2500, rub: 0.5, lo: 900, hi: 9000, grain: 0.006, env: (u) => 0.5 + 0.5 * Math.sin(Math.PI * u) }), sh.t0, { vol: 0.03, norm: true, pan: 0.3, room: street, wet: 0.3, stop: sh.t1 + 0.05, fade: 0.05 });
    for (const s of [262, 274]) ev(s, 'out', () => timber(1.2, 0.6, { rate: [6, 16] }), { x: 210, y: 4, vol: 0.04, pan: 0.4 });
  }
  // ---- the terrace: the mortar's grip (pops), its slip on the plastic (a grinding of grit), faster and faster
  for (let s = 302; s < 366; s += 1.2 + 2.5 * r.next()) ev(s, 'out', () => mortar(), { x: 30 + 130 * r.next(), y: 0.2, k: 0.9, vol: 0.03, pan: 0.5 });
  for (let s = 351; s < 365; s += 1.4 + r.next()) ev(s, 'out', () => rubble(0.12, { density: 600, n: 2, lo: 900, hi: 6000 }), { x: 14, y: 0.15, k: 1.2, vol: 0.03, pan: 0.2 });
  // going (30 cm → 1 m in 2½ minutes): pops, cracks, then a groaning grind under everything
  {
    const sh = GT_SHOTS.find((s) => s.mode === 'going'), d = sh.t1 - sh.t0;
    const y = rubble(d + 0.3, { density: 2500, n: 60, lo: 120, hi: 2400, env: (u) => Math.pow(u, 2.2) });
    const g = fx.creak(d, [[70, 0.06, 1], [150, 0.04, 0.7], [320, 0.02, 0.4]], { rate: [6, 20], env: (u) => Math.pow(u, 2.5) });
    gtAddAt(y, g, 0, 1.2 * (GTX.peak(y) || 1) / (GTX.peak(g) || 1), sr);
    K.put(y, sh.t0, { vol: 0.08, norm: true, pan: 0.45, room: street, wet: 0.35, stop: sh.t1 + 0.04, fade: 0.04 });
    for (let t = sh.t0 + 0.2; t < sh.t1; t += 0.9 * Math.pow(1 - (t - sh.t0) / d, 1.6) + 0.06) K.put(mortar(), t, { vol: 0.03 + 0.04 * (t - sh.t0) / d, norm: true, pan: r.range(0.1, 0.8), room: street, wet: 0.3 });
  }
  // still: one last tick of mortar before it goes
  ev(1614.2, 'out', () => mortar(), { x: 15, y: 0.2, k: 1.2, vol: 0.03, pan: 0.3 });
  // 8:09:00: it lets go: the whole terrace tears off its damp-proof course in one long crack, and falls: the air
  // rushing round 30 houses, bits coming off it; then it hits (x 285, 175 km/h), house after house; the debris
  {
    const T = GT_TER;
    ev(T.release, 'out', () => {
      const d = 4.6, y = rubble(d, { density: 5000, n: 90, lo: 90, hi: 4500, env: (u) => Math.exp(-u * 6) + 0.25 * Math.exp(-u * 1.2) });
      for (let k = 0; k < 14; k++) gtAddAt(y, crack({ len: 0.5, hp: 600, ring: 0.6 }), r.range(0, 0.35), r.range(0.5, 1.2), sr);
      gtAddAt(y, thump(26, 2.5, 0.6), 0, 2.2, sr);
      // the rush: a rising roar as it gains speed (it moves away from the camera)
      const n = Math.ceil(4 * sr), z = gtNoise(fx, n, 'brown'); GTX.bq(z, 'lp', 600, 0.7, sr);
      for (let i = 0; i < n; i++) { const u = i / sr; z[i] *= Math.min(1, u / 1.2) * Math.exp(-Math.max(0, u - 2.4) * 2) * 2.5; }
      gtAddAt(y, z, 0.25, 1, sr);
      return y;
    }, { x: 40, y: 3, k: 0.45, vol: 0.2, pan: 0.5, room: hill, wet: 0.35 });
    // the impact: 30 houses, one every 0.06 s, each a deep blow, bricks bursting, glass, timber
    ev(T.hit0, 'out', () => {
      const span = T.hitLast - T.hit0, d = span + 9, y = fx.arr(d);
      for (let i = 0; i < T.n; i++) {
        const t = gtTerHouse(i, 1e9).hit - T.hit0;
        gtAddAt(y, thump(r.range(24, 36), 1.4, 0.35), t, 1.4, sr);
        gtAddAt(y, rubble(1.8, { density: 4000, n: 25, lo: 100, hi: 4000, env: (u) => Math.exp(-u * 3) }), t, 0.9, sr);
        if (i % 3 === 0) gtAddAt(y, fx.smash({ v: 6, g: 9.81, pitch: r.range(0.6, 1.0), len: 1.4 }).L, t + 0.02, 0.35, sr);
        if (i % 4 === 1) gtAddAt(y, timber(0.4, 0.7, { rate: [30, 80], env: (u) => Math.exp(-u * 5) }), t + 0.01, 0.6, sr);
      }
      // the rumble going on, and bricks falling off the heap for seconds after
      const n = Math.ceil(d * sr), z = gtNoise(fx, n, 'brown'); GTX.bq(z, 'lp', 180, 0.7, sr);
      for (let i = 0; i < n; i++) { const u = i / sr; z[i] *= Math.min(1, u / 0.1) * Math.exp(-Math.max(0, u - span) / 2.4) * 4; }
      gtAddAt(y, z, 0, 1, sr);
      for (let t = span; t < d - 0.5; t += 0.05 + 0.4 * Math.pow((t - span) / (d - span), 1.2) * r.next() * 2) gtAddAt(y, brick(), t, r.range(0.2, 0.7) * Math.exp(-(t - span) / 4), sr);
      return y;
    }, { x: 280, y: 4, k: 0.6, vol: 0.25, pan: 0.2, room: hill, wet: 0.5 });
    // the dust cloud: grit pattering down, out of it
    ev(T.hitLast + 2.0, 'out', () => fx.rustle(8, { density: 1400, rub: 0.3, lo: 1500, hi: 8000, grain: 0.003, env: (u) => Math.pow(1 - u, 1.5) }), { x: 260, y: 10, k: 0.5, vol: 0.03, pan: 0.2 });
  }
  // ---- the pool on the window (the bath water and everything that fell on it): lapping, the glass groaning
  {
    const sh = GT_SHOTS.find((s) => s.mode === 'pool'), d = sh.t1 - sh.t0;
    const y = fx.liquid(d, (t) => 0.3 + 0.2 * Math.sin(t * 9) + 0.15 * Math.sin(t * 23));
    K.put(y, sh.t0, { vol: 0.022, norm: true, pan: 0.15, room, wet: 0.3, stop: sh.t1 + 0.05, fade: 0.05 });
    for (const u of [0.18, 0.47, 0.71, 0.9]) K.put(glassGroan(1.6), sh.t0 + u * d, { vol: 0.03, norm: true, pan: 0.1, room, wet: 0.3 });
    for (let t = sh.t0 + 0.6; t < sh.t1; t += 0.7 + 1.5 * r.next()) K.put(tick(), t, { vol: 0.02, norm: true, pan: r.range(-0.2, 0.3), room, wet: 0.3 });
  }
  // glassclose (2526 → 2529): the groan rising, the ticks coming faster; 8:24:10: it goes. The pane bursts, the pool
  // pours out of the hole with the chair, the mug and the books (they're gone down the street in silence)
  {
    ev(2526.1, 'in', () => glassGroan(4.2), { vol: 0.04, pan: 0.1 });
    for (let s = 2526.3, k = 0; s < GT_GLASS.go - 0.05; k++, s += 0.07 + 0.55 * Math.pow(0.78, k)) ev(s, 'any', () => tick(), { x: 0, y: 4.5, wall: 1.0, k: 1.0, vol: 0.025 + 0.004 * k, pan: r.range(-0.2, 0.2) });
    ev(GT_GLASS.go, 'any', () => {
      const S = fx.smash({ v: 7, g: 9.81, pitch: 0.75, len: 2.4 }), d = 3.2;
      const L = new Float32Array(Math.ceil(d * sr)), R = new Float32Array(L.length);
      gtAddAt(L, S.L, 0, 1, sr); gtAddAt(R, S.R, 0, 1, sr);
      const c = crack({ len: 0.5, hp: 900, ring: 1.4 }); gtAddAt(L, c, 0, 1.2, sr); gtAddAt(R, c, 0.002, 1.2, sr);
      const W = pour(2.6, (u) => Math.min(1, u / 0.06) * Math.exp(-u * 2.2)); gtAddAt(L, W.L, 0.05, 1.6, sr); gtAddAt(R, W.R, 0.05, 1.6, sr);
      const ch = fx.hit(fx.woodModes(170, 0.8), { width: 0.004 }); gtAddAt(L, ch, 0.22, 0.6, sr); gtAddAt(R, ch, 0.23, 0.5, sr);
      return { L, R };
    }, { x: 0, y: 4.5, wall: 1.0, k: 0.7, vol: 0.3, pan: 0, len: 3.4 });
  }
  // ---- ten minutes left: you get down into the corner (3000 → 3030)
  for (const s of [3001, 3008, 3013, 3019, 3024, 3029]) ev(s, 'in', () => mix([fx.rustle(0.6, { density: 320, rub: 0.45, lo: 500, hi: 4500, grain: 0.015 }), 0], [body(0.35, 80), 0.2, 0.6]), { vol: 0.035, pan: -0.2 });
  ev(3021, 'in', () => breathe(0.6, { voice: 0.5, f0: 110 }), { vol: 0.03 });
  // ---- 8:37:30: the bolt. Steel under a load that doesn't stop: it creaks, the timber round it splits, then it goes:
  // a bang through the whole frame, the house lurches 0.2° and swings
  {
    const B = GT_BOLT.snap;
    ev(B - 2.5, 'out', () => mix([fx.creak(2.5, [[r.range(900, 1100), 0.02, 1], [2300, 0.01, 0.5], [3900, 0.005, 0.3]], { rate: [4, 22], jit: 0.6, env: (u) => Math.pow(u, 1.6) }), 0], [timber(2.4, 0.8, { rate: [10, 30], env: (u) => Math.pow(u, 2) }), 0.05, 0.8]), { x: -0.6, y: 0.1, k: 1, vol: 0.05, pan: 0.0 });
    for (const s of [B - 1.7, B - 0.9, B - 0.4]) ev(s, 'out', () => crack({ len: 0.2, hp: 1400, ring: 0.3 }), { x: -0.6, y: 0.1, k: 1, vol: 0.035 });
    ev(B, 'any', () => {
      const y = mix([crack({ len: 0.6, hp: 700, ring: 1.6 }), 0], [fx.hit(fx.metalModes(r.range(1150, 1300), 2.0), { width: 0.0006, noise: 0.6, nhp: 1500 }), 0, 1.1], [thump(38, 1.6, 0.35), 0, 1.3], [groan(3.2, 0.85, 5), 0.12, 0.9]);
      return y;
    }, { x: -0.6, y: 0.4, wall: 1.0, k: 0.55, vol: 0.2, pan: 0, room: hill, wet: 0.3 });
    // the frame settling: creaks, a tile sliding off the roof
    for (const s of [B + 3.4, B + 4.9, B + 6.3]) ev(s, 'out', () => timber(0.8, 0.9), { x: -4, y: 4, k: 0.8, vol: 0.035, pan: -0.2 });
    ev(B + 5.2, 'out', () => mix([fx.rustle(0.3, { density: 600, rub: 0.3, lo: 1500, hi: 6000, grain: 0.005 }), 0], [tile(), 0.3, 1]), { x: -1, y: 7, k: 0.8, vol: 0.03, pan: -0.3 });
  }
  // ---- the last minute: your breath fast and short; the wall clock, every second, in the last ten
  for (let s = 3565, k = 0; s < 3590; s += 1.9, k++) ev(s, 'in', () => breathe(0.32, { inhale: k % 2 === 0, voice: 0.2 }), { vol: 0.03 });
  for (let s = 3591; s < GTP.tBack; s += 1) { const w = gtWhen(s); if (w) K.put(gtClick(fx, { f: 3300, tau: 0.003, len: 0.05, hp: 1400 }), w.t, { vol: w.where === 'in' ? 0.035 : 0.022, norm: true, pan: 0.35, room, wet: 0.3 }); }
  // (the clock in the bedroom the rest of the hour, at its own pace: only when the picture runs at real speed)
  series(-1.5, 3590, 1, 'in', () => gtClick(fx, { f: 3400, tau: 0.0025, len: 0.05, hp: 1200 }), { vol: 0.012, pan: 0.35, maxRate: 1.3, pred: (sp) => sp.shot.mode !== 'count' });
  for (let s = 3592.0; s < 3599.2; s += 0.62) ev(s, 'in', () => breathe(0.28, { inhale: Math.round(s / 0.62) % 2 === 0 }), { vol: 0.03 });
  ev(3592.3, 'in', () => gtMeow(fx, { d: 0.35, f0: [380, 450, 360], open: 0.35, thin: 0.3 }), { vol: 0.02, pan: -0.2 });

  // ================================================================================================= 8:42:00: down
  {
    const T0 = GTP.tBack;
    // you drop the 36 cm onto the floor, the cat lands, the books on the wall fall; the house springs back (a deep
    // groan, the frame swinging); far off, the pile at the bottom drops
    ev(T0 + gtDownT(GT_YOU.cornerP[1]), 'in', () => mix([body(1.2, 55), 0], [breathe(0.4, { voice: 0.7, f0: 105 }), 0.03, 0.6]), { vol: 0.24, pan: -0.1 });
    ev(T0 + gtDownT(GT_CAT.y - 0.05), 'in', () => mix([body(0.35, 110), 0], [gtMeow(fx, { d: 0.4, f0: [520, 700, 480], open: 0.8 }), 0.25, 0.6]), { vol: 0.05, pan: 0.3 });
    for (const [i, b] of GT_BOOKS.entries()) if (!b.glass && i % 2 === 1) ev(T0 + gtDownT(GT_ROOM.shelf.y) * r.range(0.6, 1), 'in', () => book(false), { vol: 0.035 * r.range(0.6, 1), pan: -0.5 + 0.05 * (i % 6) });
    ev(T0 + 0.02, 'any', () => groan(3.0, 1.05, 5), { x: -4, y: 4, wall: 1.0, k: 0.6, vol: 0.2, pan: 0.1, room, wet: 0.25 });
    ev(T0 + 0.35, 'any', () => {
      const d = 5, y = rubble(d, { density: 3000, n: 50, lo: 80, hi: 2500, env: (u) => Math.exp(-u * 2.5) });
      for (let k = 0; k < 8; k++) gtAddAt(y, gtCrunch(fx, { big: 1.2, len: 1.5 }), r.range(0, 0.9), r.range(0.3, 0.7), sr);
      gtAddAt(y, thump(28, 2.5, 0.6), 0, 1.5, sr);
      return y;
    }, { x: 282, y: 3, k: 0.55, vol: 0.2, pan: 0.2, room: hill, wet: 0.5 });
    // the trees whip back past upright and ring down (leaves), heard from the street
    ev(T0 + 0.1, 'out', () => fx.rustle(6, { density: 3000, rub: 0.5, lo: 800, hi: 9000, grain: 0.006, env: (u) => Math.exp(-u * 3) * (0.6 + 0.4 * Math.sin(u * 40)) }), { x: 40, y: 5, k: 0.4, vol: 0.05, pan: 0.3 });
    // the rain on the road, close (the low shot): splashes; it stops as the last drops come down
    series(T0 + 7.8, T0 + 12.6, 0.012, 'out', () => mix([fx.hit([[r.range(1800, 3200), 0.006, 1]], { width: 0.0004, noise: 0.5, nhp: 2500 }), 0]), { x: 46, y: 0.1, k: 1.3, vol: 0.02, gap: 0.004, pred: (sp) => sp.shot.mode === 'rainfall' });
    // after: the house settles once more
    ev(T0 + 16.5, 'out', () => timber(1.0, 0.75, { rate: [8, 20] }), { x: -4, y: 4, k: 0.8, vol: 0.04, pan: -0.2 });
  }
});
