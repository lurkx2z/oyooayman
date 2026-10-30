/* =====================================================================
   SOUND · SFX — the events. The story clock runs at real speed, so an event at story second s is heard at film time
   s + GK.t0, once. A sound out in the street or the park is as loud as the camera is near it (gkNear: the church is
   82 m east of your window, the cars end up kilometres up), and muffled through the walls from inside; your room's
   own sounds are heard in your room, and faintly from just outside your window.
     the tick      every second, as down jumps 1°: a soft knock through the building, and everything loose stirs
     the room      every impact the simulation found (the furniture, the books, the glass, the lamps, the TV, the vase…),
                   each by its material and how hard it hit; you, sliding after the furniture; the lamps going out; the
                   ceiling lamp smashed; the building creaking as it hangs from its foundations; the crack
     outside       the cars' tyres scrubbing as they slide, their crashes into the church (by speed and mass), the bins,
                   the balls, the bike; the spire cracking, rocking over and landing; the balconies snapping; the swings'
                   chains; the pigeons' wings
   ===================================================================== */

gkSound('sfx', 'events', function (ctx, bus, K) {
  const { fx, sr } = K, r = new RNG(5501), END = GK.end + 1.2, f = gkFilmAt;
  const room = K.verb('room', 0.7, { bright: 0.55, damp: 5, wet: 0.22 });
  const street = K.verb('street', 1.6, { bright: 0.5, damp: 4, wet: 0.2 });
  const mix = (...parts) => { const n = Math.max(...parts.map(([y, dt]) => y.length + Math.round(dt * sr))), out = new Float32Array(n); for (const [y, dt, g] of parts) gkAddAt(out, y, dt, g ?? 1, sr); return out; };
  const scale = (y, g) => { for (let i = 0; i < y.length; i++) y[i] *= g; return y; };
  const norm = (y) => scale(y, 1 / (GKX.peak(y) || 1));

  // ---- placing a sound -----------------------------------------------------------------------------------------------
  // nearness as curves over film time (cached by place), and shaping a buffer by them (level × g(t), low-pass at lp(t))
  const NC = {};
  const nearC = (P, o = {}) => { const key = [P.map((x) => x.toFixed(1)), o.room, o.k, o.wall].join(); if (!NC[key]) { const fn = (t) => gkNear(t, P, o); NC[key] = { g: gkCurve((t) => fn(t).g, 40), lp: gkCurve((t) => fn(t).lp, 40) }; } return NC[key]; };
  const shape = (y, t0, C) => {
    let y1 = 0, y2 = 0, prim = true;
    for (let i = 0; i < y.length; i++) {
      const t = t0 + i / sr, fc = C.lp(t), g = C.g(t);
      if (fc > 1 && fc < 12000) { if (prim) { y1 = y2 = y[i]; prim = false; } const a = 1 - Math.exp(-2 * Math.PI * fc / sr); y1 += a * (y[i] - y1); y2 += a * (y1 - y2); y[i] = y2 * g; }
      else { y1 = y2 = y[i]; prim = true; y[i] *= g; }
    }
    return y;
  };
  // an event at story second sE, at P (world) or in your room (o.room); make() builds it once (mono, or { L, R });
  // o.vol its peak at full level, o.pan, o.len (cut after), o.wet
  const ev = (sE, P, make, o = {}) => {
    const t = f(sE) + (o.dt || 0); if (t < -1.5 || t > END - 0.05) return;
    const C = nearC(P || GK_ROOM.origin, o);
    if (Math.max(C.g(t), C.g(t + 0.3), C.g(t + 1.5)) < 0.003) return;
    const b = make(), keep = Math.max(8, Math.ceil((Math.min(END, t + (o.len || 30)) - t + 0.2) * sr));
    let L = b.L || b, R = b.R || null;
    const pk = GKX.peak(L, R) || 1; L = L.slice(0, keep); if (R) R = R.slice(0, keep);
    scale(L, 1 / pk); if (R) scale(R, 1 / pk);
    shape(L, t, C); if (R) shape(R, t, C);
    const inside = gkWhere(t) === 'in', opt = { vol: o.vol || 0.05, pan: o.pan || 0, room: inside ? room : street, wet: o.wet ?? (inside ? 0.25 : 0.3), stop: Math.min(END, t + (o.len || 30)), fade: o.fade || 0.12 };
    if (R) K.putLR(L, R, t, opt); else K.put(L, t, opt);
  };
  const RW = (x, y, z) => { const O = GK_ROOM.origin; return [O[0] + x, O[1] + y, O[2] + z]; };

  // ---- the materials -------------------------------------------------------------------------------------------------
  const body = (w = 1, f = 62) => fx.woodStep({ weight: w, body: f, scuff: 0 });
  const thump = (f = 40, d = 0.7, dk = 0.18) => { const y = fx.arr(d); for (let i = 0; i < y.length; i++) { const u = i / sr; y[i] = Math.sin(2 * Math.PI * f * u * (1 - 0.12 * Math.min(1, u / dk))) * Math.exp(-u / dk) * Math.min(1, u / 0.003); } return y; };
  // timber: a joint creaking (stick-slip), and a whole frame groaning under a load
  const timber = (d, f = 1, o = {}) => fx.creak(d, [[r.range(110, 150) * f, 0.03, 1], [r.range(260, 320) * f, 0.02, 0.6], [r.range(540, 640) * f, 0.012, 0.35], [r.range(1100, 1300) * f, 0.006, 0.15]], { rate: o.rate || [12, 38], jit: 0.35, env: o.env });
  const groan = (d, f = 1, sway = 0) => {
    const y = mix([timber(d, 0.55 * f, { rate: [8, 22], env: (u) => Math.min(1, u / 0.04) * Math.pow(1 - u, 1.2) }), 0], [timber(d * 0.7, 1.1 * f, { rate: [20, 50] }), 0.05, 0.5], [thump(30, 0.9, 0.3), 0, 0.5]);
    if (sway) for (let k = 1; k <= sway; k++) gkAddAt(y, timber(0.35, 0.8 * f, { rate: [16, 40] }), k / 1.6 - 0.12, Math.pow(0.6, k), sr);   // (the frame swinging back and forth: 1.6 Hz)
    return y;
  };
  // glass: a sharp crack, a tiny tick as a crack runs, the pane booming under a body, a groan under a load
  const crack = (o = {}) => { const y = fx.arr(o.len || 0.4), n = Math.round(0.012 * sr), z = fx.white(n); for (let i = 0; i < n; i++) y[i] = z[i] * Math.exp(-i / (0.0018 * sr)); GKX.bq(y, 'hp', o.hp || 1800, 0.7, sr); GKX.strike(y, 0, Math.round(0.0004 * sr), 0.6 * (o.ring ?? 1), [[r.range(2800, 3400), 0.03, 1], [r.range(4600, 5400), 0.02, 0.6], [r.range(7000, 8200), 0.012, 0.4]], sr); return y; };
  const tick = () => crack({ len: 0.09, hp: r.range(2500, 4000), ring: 0.4 });
  const pane = (w = 1) => mix([fx.hit([[r.range(80, 95), 0.08, 1], [r.range(150, 170), 0.06, 0.7], [270, 0.05, 0.5], [430, 0.03, 0.3], [700, 0.02, 0.2]], { width: 0.008 * w }), 0], [fx.creak(0.25, [[1900, 0.006, 1], [3100, 0.004, 0.5]], { rate: [60, 110], env: (u) => Math.exp(-u * 6) }), 0.01, 0.25]);
  const glassGroan = (d) => fx.creak(d, [[r.range(380, 440), 0.04, 1], [r.range(900, 1000), 0.02, 0.5], [2200, 0.008, 0.25]], { rate: [6, 18], jit: 0.5, env: (u) => Math.sin(Math.PI * u) });
  // metal: the lamp post (a hollow steel pole), a bolt
  const pole = (w = 1) => fx.hit(fx.metalModes(r.range(340, 420), 1.4), { width: 0.0025 / w, noise: 0.2 * w });
  // brick, rubble: a granular crunch (o.d long, o.env), and a single brick clacking
  const rubble = (d, o = {}) => { const y = fx.rustle(d, { density: o.density || 1500, rub: 0.35, lo: o.lo || 180, hi: o.hi || 3200, grain: 0.005, env: o.env }); for (let k = 0; k < (o.n || 12); k++) { const u = r.next(), e = o.env ? o.env(u) : 1; GKX.strike(y, Math.round(u * d * sr), Math.round(0.002 * sr), r.range(0.3, 1) * e, fx.stoneModes(r.range(1.1, 2.2)), sr); } return y; };
  const brick = () => fx.hit(fx.stoneModes(r.range(1.6, 2.6)), { width: 0.0018, noise: 0.25, nhp: 1500 });
  const mortar = () => mix([crack({ len: 0.06, hp: 1200, ring: 0.15 }), 0], [rubble(0.07, { density: 900, n: 2, lo: 600, hi: 5000 }), 0.003, 0.4]);
  // a tile (a clay slate clacking onto the heap)
  const tile = () => fx.hit(fx.stoneModes(r.range(2.4, 3.6)).map(([f, tau, a]) => [f, tau * 0.8, a]), { width: 0.0012, noise: 0.4, nhp: 2500, extra: [[r.range(0.04, 0.09), 0.0008, 0.3]] });
  // a plastic bin / chair hitting: a hollow body, its lid, the rubbish
  const plastic = (big = 1) => mix([fx.hit([[r.range(95, 125) / big, 0.06, 1], [r.range(210, 260) / big, 0.04, 0.7], [480, 0.025, 0.4], [950, 0.012, 0.25]], { width: 0.004, noise: 0.5, nhp: 1200 }), 0], [fx.rustle(0.6, { density: 700, rub: 0.2, lo: 700, hi: 6000, grain: 0.006, env: (u) => Math.exp(-u * 4) }), 0.02, 0.5]);
  // books: a slap of covers and pages
  const book = (onGlass) => mix([fx.slap(onGlass ? [[r.range(300, 360), 0.03, 1], [r.range(800, 900), 0.015, 0.5]] : fx.woodModes(r.range(160, 220), 0.6), { amp: 0.8 }), 0], [fx.rustle(0.12, { density: 900, rub: 0.3, lo: 1200, hi: 7000, grain: 0.003 }), 0.004, 0.4]);
  const soft = (w = 1) => mix([thump(r.range(70, 95), 0.4, 0.06), 0, 0.8 * w], [fx.rustle(0.18, { density: 600, rub: 0.5, lo: 300, hi: 2500, grain: 0.006, env: (u) => Math.exp(-u * 6) }), 0.003, 0.6]);
  const wood = (f0 = 1) => fx.hit(fx.woodModes(r.range(150, 220) * f0, 0.8), { width: 0.002, noise: 0.25, nhp: 900 });
  const ceramic = (v) => fx.smash({ v: Math.max(2, v * 2), g: 9.81, len: 1.4, pan: r.range(-0.3, 0.3) });
  const metal = (b = 600) => fx.hit(fx.metalModes(r.range(b * 0.85, b * 1.15), 0.6), { width: 0.0012, noise: 0.2 });
  const glassClink = () => fx.hit(fx.cupModes(r.range(0.9, 1.1)), { width: 0.0006, noise: 0.1 });
  const MAT = (id) => /^book|^tbook|^sbooks/.test(id) ? 'book' : /^cush|^pouffe|^rug/.test(id) ? 'soft' : /^sofa|^armchair/.test(id) ? 'sofa'
    : /^glass/.test(id) ? 'glass' : /^bowl|^vase/.test(id) ? 'ceramic' : /^tv/.test(id) ? 'tv' : /^tlamp|^flamp|^photo/.test(id) ? 'lamp' : /^plant/.test(id) ? 'pot' : /^remote/.test(id) ? 'plastic' : 'wood';

  // ======================================================================================================= THE TICK
  // every second: a soft knock through the building (the whole frame takes up a new load), louder inside
  {
    const knocks = [0, 1, 2, 3].map(() => norm(mix([thump(r.range(48, 58), 0.5, 0.09), 0, 1], [fx.hit(fx.woodModes(r.range(120, 150), 1.3), { width: 0.004, noise: 0.15 }), 0.002, 0.35], [timber(0.18, 1.0, { rate: [20, 40], env: (u) => Math.exp(-u * 8) }), 0.01, 0.25])));
    for (let k = 1; f(k) < END - 0.05; k++) {
      const t = f(k), inside = gkWhere(t) === 'in';
      K.put(knocks[k % 4], t + r.range(-0.004, 0.004), { vol: inside ? 0.05 : 0.026, pan: r.range(-0.1, 0.1), lp: inside ? undefined : 1800, room: inside ? room : street, wet: 0.2 });
      // (the ceiling lamp's shade and loose things in the room give a small rattle)
      if (inside && k < 210) K.put(norm(fx.rustle(0.12, { density: 900, rub: 0.2, lo: 2000, hi: 7000, grain: 0.002, env: (u) => Math.exp(-u * 9) })), t + 0.015, { vol: 0.008, pan: r.range(-0.4, 0.4), room, wet: 0.3 });
    }
  }

  // ======================================================================================================= YOUR ROOM
  // every impact the simulation found, by material (merged when the same body hits again within 0.12 s)
  {
    const last = {};
    for (const [s, id, dv, x, y, z] of GK_SIM.room.events) {
      if (last[id] != null && s - last[id] < 0.12) continue; last[id] = s;
      const m = MAT(id), a = Math.min(1, dv / 4), P = RW(x, y, z), pan = MathX.clamp(x / 3, -0.8, 0.8);
      const make = { book: () => book(false), soft: () => soft(a), sofa: () => mix([thump(r.range(50, 65), 0.6, 0.1), 0, 1], [wood(0.7), 0.004, 0.5], [soft(1), 0, 0.6]),
        glass: () => (dv > 2.5 ? ceramic(dv) : glassClink()), ceramic: () => (dv > 1.4 ? ceramic(dv) : glassClink()), tv: () => mix([plastic(1.4), 0, 1], [crack({ len: 0.3, hp: 1500 }), 0.003, dv > 1.5 ? 0.8 : 0.2]),
        lamp: () => mix([metal(700), 0, 0.6], [dv > 1.5 ? ceramic(dv).L : glassClink(), 0.002, 0.6]), pot: () => mix([thump(110, 0.3, 0.05), 0, 1], [rubble(0.3, { density: 900, n: 5, lo: 400, hi: 4000, env: (u) => Math.exp(-u * 5) }), 0.002, 0.6]),
        plastic: () => plastic(0.5), wood: () => mix([wood(0.8), 0, 1], [thump(r.range(60, 80), 0.4, 0.07), 0, 0.5 * a]) }[m];
      ev(s, P, make, { room: true, vol: (m === 'book' ? 0.04 : m === 'soft' ? 0.06 : 0.09) * (0.25 + 0.75 * a), pan, len: 2.5 });
    }
  }
  // you, sliding after the furniture (cloth on the floor, the wall, the ceiling) and landing
  for (const [a, b] of [[53.4, 54.6], [125.5, 127.2], [214.6, 216.4], [302.5, 304.2]]) {
    ev(a, null, () => fx.rustle(b - a + 0.2, { density: 500, rub: 0.7, lo: 300, hi: 3000, grain: 0.008, env: (u) => Math.sin(Math.PI * Math.min(1, u * 1.1)) }), { room: true, vol: 0.05, pan: 0.2 });
    ev(b, null, () => soft(1), { room: true, vol: 0.08 });
  }
  // the football: a soft rumble on the boards as it rolls (louder as it speeds up), then a hollow knock on the sideboard
  // and its smaller bounces (physics.js GK_BALL)
  { const B = GK_BALL, s0 = 1.0, s1 = B.hits.length ? B.hits[0][0] : 6, n = Math.round((s1 - s0) * sr);
    ev(s0, null, () => { const y = new Float32Array(n + Math.round(0.05 * sr)); let lp = 0, lp2 = 0;
      for (let i = 0; i < n; i++) { const s = s0 + i / sr, v = Math.abs(gkBallX(s + 0.01) - gkBallX(s - 0.01)) / 0.02, a = 1 - Math.exp(-2 * Math.PI * (120 + 260 * Math.min(1, v)) / sr);
        lp += a * (r.range(-1, 1) - lp); lp2 += a * (lp - lp2); y[i] = lp2 * Math.min(1, v / 1.3) * (1 + 0.35 * Math.sin(2 * Math.PI * (v / (2 * Math.PI * B.r)) * 5 * (i / sr))); }
      return y; }, { room: true, vol: 0.05, len: s1 - s0 + 0.1 });
    for (const [s, v] of B.hits) ev(s, null, () => mix([thump(95, 0.35, 0.05), 0, 1], [body(0.4, 140), 0.002, 0.6]), { room: true, vol: 0.035 * Math.min(1.4, v) }); }
  // the lamps going out (a click and the bulb's tick as it cools); the TV's picture going (a pop)
  for (const s of [GK_LAMPS.tlamp, GK_LAMPS.flamp]) ev(s, null, () => mix([crack({ len: 0.05, hp: 3000, ring: 0.2 }), 0, 1], [glassClink(), 0.12, 0.15]), { room: true, vol: 0.03 });
  ev(GK_LAMPS.tv, null, () => mix([crack({ len: 0.1, hp: 900, ring: 0.1 }), 0, 1]), { room: true, vol: 0.03 });
  // the ceiling lamp: the sofa sliding along the ceiling smashes its shade and bulb
  ev(GK_ROOM.lamp.broken, RW(GK_ROOM.lamp.x, 2.5, GK_ROOM.lamp.z), () => { const s1 = fx.smash({ v: 6, g: 9.81, len: 1.8 }); gkAddAt(s1.L, crack({ len: 0.2, hp: 2500 }), 0, 0.8, sr); return s1; }, { room: true, vol: 0.14 });
  // the building: concrete taking a pull (deep groans as down passes 90°, and while it hangs from its foundations)
  for (const s of [88.5, 93.2, 99.8, 118.4, 150.3, 176.6, 183.9, 189.2, 196.4, 233.5, 262.7, 268.4]) ev(s, null, () => groan(r.range(1.4, 2.4), r.range(0.45, 0.6), 1), { room: true, vol: 0.07, pan: r.range(-0.5, 0.5) });
  // the crack: dry snaps as it runs along your ceiling, and the plaster trickling
  for (let s = 210.6; s < 218; s += r.range(0.25, 0.9)) ev(s, RW(r.range(-1.6, 1.6), 2.6, 1.72), () => mix([crack({ len: 0.08, hp: r.range(900, 1800), ring: 0.1 }), 0, 1], [rubble(0.25, { density: 500, n: 3, lo: 1500, hi: 6000, env: (u) => Math.exp(-u * 6) }), 0.01, 0.4]), { room: true, vol: 0.035, pan: r.range(-0.4, 0.4) });

  // ======================================================================================================= OUTSIDE
  // the cars: their tyres scrubbing as they slide down the street (handbrakes on), as loud as they're fast and near
  for (const id of GK_CARS) {
    const spC = gkCurve((t) => { const s = gkStoryAt(t); if (s < 0 || s > 97) return 0; const P = [0, 0, 0], Q = [0, 0, 0, 1]; gkSimPose('street', id, s, P, Q); return P[1] < 0.8 ? Math.min(1, gkSimSpeed('street', id, s) / 12) : 0; }, 50);
    const sp = (s) => spC(f(s));
    let a = null;
    for (let s = 0; s < 98; s += 0.1) {
      const on = sp(s) > 0.03;
      if (on && a == null) a = s;
      if ((!on || s >= 97.9) && a != null) {
        const b = s, d = b - a + 0.3, P = [0, 0, 0], Q = [0, 0, 0, 1]; gkSimPose('street', id, (a + b) / 2, P, Q);
        const y = gkScreech(fx, d, { f: r.range(0.45, 0.6), env: (u) => Math.pow(sp(a + u * d), 0.8) });
        const z = gkNoise(fx, y.length, 'brown'); GKX.bq(z, 'lp', 250, 0.7, sr);
        for (let i = 0; i < y.length; i++) y[i] = 0.5 * y[i] + 2.5 * z[i] * Math.pow(sp(a + i / sr), 0.7);
        ev(a, P, () => y, { vol: 0.07, pan: MathX.clamp((P[0] - 30) / 80, -0.8, 0.8), len: d });
        a = null;
      }
    }
  }
  // every impact in the street, by what hit (cars by their speed and mass)
  {
    const last = {};
    for (const [s, id, dv, x, y, z] of GK_SIM.street.events) {
      if (last[id] != null && s - last[id] < 0.2) continue; last[id] = s;
      const b = GK_ST.bodies.find((q) => q.id === id), a = Math.min(1, dv / 15);
      if (b.kind === 'car') ev(s, [x, y, z], () => gkCrunch(fx, { big: 0.7 + b.m / 2500, len: 1.6 + 1.6 * a, scrape: a }), { vol: 0.12 * (0.35 + 0.65 * a), k: 0.7, len: 3.5 });
      else if (b.kind === 'bin') ev(s, [x, y, z], () => plastic(1), { vol: 0.06 * (0.4 + 0.6 * a) });
      else if (b.kind === 'ball') ev(s, [x, y, z], () => fx.ballHit({ v: Math.min(8, dv) }), { vol: 0.04 });
      else ev(s, [x, y, z], () => mix([metal(900), 0, 0.7], [metal(1500), 0.03, 0.4], [rubble(0.3, { density: 800, n: 6, lo: 800, hi: 6000, env: (u) => Math.exp(-u * 5) }), 0, 0.5]), { vol: 0.06 });
    }
  }
  // the spire: a crack as it starts to rock, its base grinding, the landing beside the nave
  {
    const SP = GK_ST.church.tower, top = [(SP.x[0] + SP.x[1]) / 2, SP.h, (SP.z[0] + SP.z[1]) / 2], land = [top[0] + 8, 2, top[2]];
    ev(GK_SPIRE.go - 0.6, top, () => mix([crack({ len: 0.4, hp: 600, ring: 0.2 }), 0, 1], [rubble(0.6, { density: 1200, n: 10, lo: 200, hi: 3000, env: (u) => Math.exp(-u * 4) }), 0.01, 0.6]), { vol: 0.1, k: 0.65 });
    ev(GK_SPIRE.go, top, () => rubble(GK_SPIRE.hitS - GK_SPIRE.go + 0.4, { density: 1800, n: 30, lo: 120, hi: 2400, env: (u) => 0.3 + 0.7 * u }), { vol: 0.08, k: 0.65 });
    ev(GK_SPIRE.hitS + 1.9, land, () => mix([thump(32, 1.6, 0.4), 0, 1.4], [rubble(2.6, { density: 2600, n: 60, lo: 150, hi: 4500, env: (u) => Math.exp(-u * 2.2) }), 0.01, 1], [brick(), 0.05, 0.4], [brick(), 0.18, 0.3]), { vol: 0.2, k: 0.6, len: 4 });
  }
  // the balconies: a crack at the root as each folds up, then the snap as it breaks off
  for (const b of GK_BALC) if (b.go) {
    const P = [b.x, b.y, b.z];
    ev(b.go, P, () => mix([crack({ len: 0.3, hp: 500, ring: 0.1 }), 0, 1], [rubble(0.5, { density: 1000, n: 8, lo: 300, hi: 3500, env: (u) => Math.exp(-u * 5) }), 0.01, 0.5]), { vol: 0.08, k: 0.7 });
    ev(b.go + GK_BALC_FOLD, P, () => mix([crack({ len: 0.4, hp: 400, ring: 0.2 }), 0, 1], [metal(1100), 0.02, 0.5], [metal(1700), 0.05, 0.3], [rubble(1.0, { density: 1500, n: 16, lo: 200, hi: 4000, env: (u) => Math.exp(-u * 3) }), 0.01, 0.6]), { vol: 0.12, k: 0.7 });
  }
  // the swings' chains, creaking round their bar with each tick
  for (let k = 2; k < 372; k++) ev(k, [GK_ST.swings.x, GK_ST.swings.top, GK_ST.swings.z], () => fx.creak(0.35, [[r.range(900, 1100), 0.01, 1], [r.range(1900, 2300), 0.006, 0.5]], { rate: [30, 60], jit: 0.4, env: (u) => Math.exp(-u * 5) }), { vol: 0.02, k: 1.1 });
  // the pigeons' wings
  { const sh = GK_SHOTS.find((x) => x.mode === 'birds');
    for (let t = sh.t0 + 0.2; t < sh.t1 - 0.2; t += r.range(0.4, 1.1)) K.put(norm(fx.rustle(0.5, { density: 400, rub: 0.1, lo: 500, hi: 4000, grain: 0.02, env: (u) => Math.pow(Math.sin(Math.PI * u), 2) * (0.5 + 0.5 * Math.sin(u * 60)) })), t, { vol: 0.02, pan: r.range(-0.6, 0.6), room: street, wet: 0.3 }); }
});
