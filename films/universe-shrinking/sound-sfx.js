/* =====================================================================
   SOUND · EFFECTS — the events, each placed when it really happens (the night clock: ucFilmAt). From the kitchen
   (UC_KITCHEN_MODES) what happens in the garden is heard through the glass: duller, lower.
     the cold open   11:44, the kitchen: the window glass ticking in the heat, your breathing, the cat's low growl
     7:29            the cat on the wall ("mrrp"), the ice on the bird bath, a church clock striking the half hour at
                     7:30:00 exactly, the telescope's focuser as you find Mirach
     the heat        the frost melting (a fizz, then drips), the cat asking to go in, her gallop, the cat flap;
                     you go in: steps, the door handle, the door, shut behind you
     the fire        a soft "whump" as each place catches (garden.js's fire front); the telescope groaning as it
                     melts and folding; the window glass creaking as it softens; the bird bath boiling; the house's
                     groan and slump as the brick melts
     the last second the nuclei: a fizz; the protons: a deep blow; then physics runs out: a tear that grows to a wall
                     and stops dead at midnight
     the end         7:29 again: the cat back on the wall
   ===================================================================== */

ucSound('sfx', 'events', function (ctx, bus, K) {
  const { fx, sr, r } = K, P = ucPl();
  const out = K.verb('out', 2.4, { bright: 0.42, damp: 2.6, wet: 0.5, seed: 43, pre: 0.02 });
  const room = K.verb('room', 0.6, { bright: 0.35, damp: 4, wet: 0.3, seed: 47 });          // the kitchen: close, small
  const far = K.verb('far', 4.5, { bright: 0.3, damp: 2.2, wet: 0.9, seed: 53, pre: 0.06 }); // across the town
  // something in the garden, heard from wherever the picture is (through the glass from the kitchen)
  const garden = (x, t, vol, o = {}) => {
    const k = P.kit(t);
    if (k > 0.5) return K.put(x, t, { vol: vol * 0.6, norm: true, pan: o.pan || 0, lp: o.klp || 700, room, wet: 0.5 });
    return K.put(x, t, { vol, norm: true, pan: o.pan || 0, lp: o.lp, room: out, wet: o.wet ?? 0.35 });
  };
  const breathe = (t, d, vol, o = {}) => K.put(fx.breath(d, o), t, { vol, norm: true, pan: 0, room, wet: 0.2, lp: o.lp || 5200 });

  // ================= the cold open (11:44, the kitchen): the glass ticks in the heat; you breathe; the cat growls
  for (const [t, f] of [[1.35, 2500], [3.05, 3300], [5.6, 2800], [6.7, 3600]]) K.put(fx.hit([[f, 0.012, 1], [f * 1.62, 0.007, 0.5], [f * 2.9, 0.004, 0.25]], { width: 0.0002, noise: 0.3, nhp: 2000 }), t, { vol: 0.016, norm: true, pan: r.range(-0.3, 0.3), room, wet: 0.35 });
  K.put(fx.creak(1.1, fx.glassModes(), { rate: [9, 22] }), 4.1, { vol: 0.02, norm: true, pan: -0.1, room, wet: 0.3 });
  breathe(0.5, 1.4, 0.034, { inhale: true }); breathe(2.0, 1.5, 0.03); breathe(4.6, 1.2, 0.034, { inhale: true }); breathe(5.9, 1.4, 0.028);
  K.put(ucMeow(fx, { d: 0.9, f0: [300, 340, 270], open: 0.45, thin: 0.35 }), 3.4, { vol: 0.018, norm: true, pan: -0.3, room, wet: 0.3, lp: 2500 });

  // ================= 7:29 in the garden
  K.put(ucMeow(fx, { d: 0.32, f0: [520, 640, 560], open: 0.5 }), UC.title[0] + 2.1, { vol: 0.024, norm: true, pan: -0.15, room: out, wet: 0.45 });
  // the ice on the bird bath: a tink as it tightens in the cold, a faint crackle of frost
  K.put(fx.hit([[3150, 0.05, 1], [5200, 0.03, 0.5], [7900, 0.015, 0.3]], { width: 0.0002, noise: 0.25, nhp: 3000 }), UC.frost0 + 1.0, { vol: 0.016, norm: true, pan: 0.15, room: out, wet: 0.35 });
  K.put(fx.hit([[2600, 0.04, 1], [4400, 0.02, 0.4]], { width: 0.0002, noise: 0.2, nhp: 3000 }), UC.frost0 + 2.6, { vol: 0.01, norm: true, pan: 0.2, room: out, wet: 0.35 });
  K.put(ucCrackle(fx, 2.2, { rate: 60, hp: 3500, env: (u) => Math.sin(Math.PI * u) }), UC.frost0 + 0.6, { vol: 0.005, norm: true, pan: -0.1, room: out, wet: 0.2 });
  // 7:30:00: a church clock across the town strikes the half hour (one stroke)
  {
    const f = 311, y = fx.hit([[f * 0.5, 3.0, 0.55], [f, 2.4, 1], [f * 1.19, 1.8, 0.5], [f * 1.5, 1.4, 0.4], [f * 2, 1.3, 0.45], [f * 2.52, 0.8, 0.22], [f * 3.01, 0.6, 0.15]], { width: 0.0025, len: 7, noise: 0.15, nhp: 800 });
    K.put(y, UC.onsetT, { vol: 0.03, norm: true, pan: 0.55, lp: 2200, room: far, wet: 0.9 });
  }
  // the telescope: you turn the focuser to find Mirach (a gritty little creak, two clicks)
  {
    const t = UC.mirach + 0.2;
    K.put(fx.creak(0.45, [[r.range(900, 1100), 0.01, 1], [r.range(2100, 2500), 0.006, 0.5]], { rate: [30, 60] }), t, { vol: 0.012, norm: true, pan: 0.1, room: out, wet: 0.2 });
    for (const dt of [0.52, 0.71]) K.put(fx.hit([[3100, 0.004, 1], [5300, 0.003, 0.5], [1500, 0.006, 0.4]], { width: 0.0002, noise: 0.4, nhp: 2500 }), t + dt, { vol: 0.01, norm: true, pan: 0.1, room: out, wet: 0.2 });
  }

  // ================= the heat
  // the frost melting (macro): a fizz as the crystals go, then drips off the blades, more and more
  {
    const tm = ucFilmAt(UC_N.frostMelt, UC.frost, UC.zero);
    K.put(ucCrackle(fx, tm + 1.5 - UC.frost, { rate: 140, hp: 3000, env: (u) => Math.min(1, u * 3) * (1 - Math.pow(u, 3)) }), UC.frost + 0.2, { vol: 0.008, norm: true, pan: 0, room: out, wet: 0.15 });
    const d = UC.zero - tm, L = new Float32Array(Math.ceil((d + 0.3) * sr)), R = new Float32Array(L.length);
    for (let x = 0.3; x < d; x += r.range(0.12, 0.55) * (1 - 0.5 * x / d)) fx.bubble(L, R, Math.round(x * sr), r.range(1700, 3600), r.range(0.003, 0.007), r.range(0.4, 1), r.range(-0.4, 0.4));
    K.putLR(L, R, tm, { vol: 0.022, norm: true, room: out, wet: 0.25 });
  }
  // the cat asks to go in, then runs for her flap: soft paws on the grass, the flap swinging and clacking shut
  K.put(ucMeow(fx, { d: 0.75, f0: [480, 760, 450], open: 1.0 }), UC.catRun - 1.15, { vol: 0.03, norm: true, pan: -0.15, room: out, wet: 0.4 });
  {
    const G = UC_G, FLAP = [(G.door[0] + G.door[1]) / 2, 0, -0.12], tg = Math.hypot(FLAP[0] + 0.5, FLAP[2] + 6.6) / 4.3;
    for (const [leg, ph] of [['bl', 0], ['br', 0.09], ['fl', 0.52], ['fr', 0.6]]) for (let k = 1; k < 8; k++) {
      const t = UC.catRun + (k - ph) / 3.4; if (t > UC.catRun + tg - 0.05) break;
      K.put(fx.hit([[120, 0.02, 1], [260, 0.012, 0.5]], { width: 0.006, noise: 0.5, nhp: 1200, nlen: 0.01 }), t, { vol: 0.012 * (leg[0] === 'b' ? 1 : 0.7), norm: true, pan: -0.2 + 0.5 * (t - UC.catRun) / tg, room: out, wet: 0.25 });
    }
    const tf = UC.catRun + tg - 0.05;
    [0, 0.35, 0.7, 1.05, 1.4].forEach((dt, i) => K.put(fx.hit([[640, 0.03, 1], [1450, 0.02, 0.6], [2900, 0.01, 0.3]], { width: 0.0008, noise: 0.3, nhp: 1500 }), tf + dt, { vol: 0.03 * Math.exp(-i * 0.8), norm: true, pan: 0.35, room: out, wet: 0.3 }));
  }
  // you go in: steps on the patio, the door handle, the door swinging open (a creak); shut behind you at the cut
  {
    const tH = UC.goIn - 0.15;
    for (let i = 0; i < 5; i++) { const t = UC.goIn + 0.35 + i * 0.55; if (t > UC.steam - 0.3) break; K.put(fx.step({ weight: 0.55, scuff: 0.12 }), t, { vol: 0.03, norm: true, pan: i % 2 ? 0.12 : -0.12, room: out, wet: 0.2 }); }
    K.put(fx.hit([[1800, 0.02, 1], [3700, 0.012, 0.5], [900, 0.03, 0.4]], { width: 0.0005, noise: 0.3, nhp: 1500, extra: [[0.09, 0.0004, 0.6]] }), tH, { vol: 0.02, norm: true, pan: 0.2, room: out, wet: 0.2 });
    K.put(fx.creak(0.9, [[r.range(240, 280), 0.02, 1], [r.range(560, 640), 0.012, 0.6], [r.range(1100, 1300), 0.008, 0.3]], { rate: [10, 30] }), UC.goIn + 0.05, { vol: 0.016, norm: true, pan: 0.25, room: out, wet: 0.25 });
    K.put(fx.hit(fx.panelModes(1.4), { width: 0.004, noise: 0.4, nhp: 600, len: 0.6 }), UC.steam - 0.12, { vol: 0.05, norm: true, pan: 0.3, room, wet: 0.4 });
  }

  // ================= the fire. Each place catching: a soft "whump" (heard through the glass)
  for (const [kind, count, size, vol] of [['leaves', 6, 0.6, 0.035], ['grass', 5, 1.2, 0.05], ['tree', 3, 1.4, 0.05], ['shed', 3, 1.6, 0.06], ['fence', 5, 1.2, 0.045]]) {
    for (const n of ucIgnitions(kind, count)) {
      const t = ucFilmAt(n, UC.leaves - 1, UC.bath); if (t < UC.leaves - 0.5 || t > UC.bath - 0.5) continue;
      garden(ucWhump(fx, { size: size * r.range(0.8, 1.2) }), t, vol * r.range(0.7, 1.1), { pan: r.range(-0.5, 0.5), klp: 900 });
    }
  }
  // the telescope melts (660 °C): the tube groans, sags, and folds onto the patio
  {
    const t0 = ucFilmAt(UC_N.scopeMelt - 2, UC.shed, UC.glass), t1 = ucFilmAt(UC_N.scopeMelt + 18, UC.shed, UC.glass);
    garden(fx.creak(t1 - t0 + 0.3, fx.metalModes(170, 0.5), { rate: [5, 16], env: (u) => Math.min(1, u * 4) * (1 - 0.6 * u) }), t0, 0.04, { pan: 0.3, klp: 1300 });
    garden(fx.hit(fx.metalModes(230, 0.35), { width: 0.006, noise: 0.4, nhp: 500, len: 1.2 }), t1, 0.045, { pan: 0.3, klp: 1100 });
    garden(ucCrackle(fx, 0.8, { rate: 400, hp: 2500, env: (u) => Math.exp(-u * 4) }), t1 + 0.02, 0.02, { pan: 0.3, klp: 2400 });
  }
  // the window glass softening (right in front of you): slow groans and ticks
  for (const [dt, d] of [[0.6, 1.4], [2.4, 1.0], [4.2, 1.8], [6.1, 1.2]]) {
    K.put(fx.creak(d, fx.glassModes().map(([f, tau, a]) => [f * r.range(0.85, 1.15), tau, a]), { rate: [6, 18] }), UC.glass + dt, { vol: 0.03, norm: true, pan: r.range(-0.25, 0.25), room, wet: 0.35 });
    K.put(fx.hit([[2700, 0.01, 1], [4400, 0.006, 0.4]], { width: 0.0002, noise: 0.3, nhp: 2000 }), UC.glass + dt + d * 0.8, { vol: 0.012, norm: true, pan: r.range(-0.3, 0.3), room, wet: 0.3 });
  }
  // the bird bath boiling: a rolling boil, close (as garden.js: from the moment it reaches 100 °C to dry)
  {
    const t0 = UC.bath, t1 = UC.red + 0.2, d = t1 - t0;
    const lv = (t) => { const n = ucSoundNight(t); return n > UC_N.boil && n < UC_N.dry ? MathX.smooth(n, UC_N.boil, UC_N.boil + 6) * (1 - MathX.smooth(n, UC_N.dry - 20, UC_N.dry)) : 0; };
    K.put(fx.liquid(d, (x) => lv(t0 + x) * Math.min(1, x / 0.15, (d - x) / 0.2), { f: 420 }), t0, { vol: 0.04, norm: true, pan: 0.05, room: out, wet: 0.15 });
    const L = new Float32Array(Math.ceil(d * sr)), R = new Float32Array(L.length);
    for (let x = 0.05; x < d - 0.1; x += r.range(0.008, 0.03)) { const a = lv(t0 + x); if (a < 0.05) continue; fx.bubble(L, R, Math.round(x * sr), r.range(350, 1500), r.range(0.006, 0.02), a * r.range(0.3, 1), r.range(-0.35, 0.35)); }
    K.putLR(L, R, t0, { vol: 0.05, norm: true, room: out, wet: 0.15 });
  }
  // the house melts: a deep groan in the walls, then two slumps as the brick gives
  {
    const t0 = UC.melt + 0.2;
    K.put(fx.creak(3.2, fx.stoneModes(0.55), { rate: [4, 11], env: (u) => Math.min(1, u * 3) * (1 - 0.5 * u) }), t0, { vol: 0.06, norm: true, pan: -0.1, lp: 900, room: out, wet: 0.4 });
    for (const [dt, s, p] of [[1.3, 2.2, -0.2], [2.7, 2.8, 0.15]]) K.put(ucWhump(fx, { size: s }), t0 + dt, { vol: 0.08, norm: true, pan: p, lp: 400, room: out, wet: 0.45 });
    K.put(fx.rustle(1.4, { density: 160, rub: 0.15, lo: 600, hi: 3000, grain: 0.02, env: (u) => Math.sin(Math.PI * u) }), t0 + 1.5, { vol: 0.012, norm: true, pan: 0.25, room: out, wet: 0.4 });
  }

  // ================= the last second: the nuclei (a fizz), the protons (a deep blow), then the tear, cut at midnight
  K.put(ucCrackle(fx, 1.6, { rate: 900, hp: 1800, env: (u) => Math.min(1, u * 6) * Math.exp(-u * 2.5) }), UC.nuclei - 0.05, { vol: 0.03, norm: true, pan: 0, room: out, wet: 0.3 });
  K.put(ucWhump(fx, { size: 3 }), UC.protons, { vol: 0.09, norm: true, pan: 0, lp: 260, room: out, wet: 0.5 });
  {
    const t0 = UC.planck - 0.5, d = UC.midnight - 0.01 - t0, n = Math.ceil(d * sr), x = ucNoise(fx, n, 'pink');
    for (let i = 0; i < n; i++) { const u = i / n; x[i] *= Math.pow(u, 1.6) * (1 + 0.6 * Math.sin(2 * Math.PI * (6 + 30 * u) * i / sr)); }
    const y = ucSweep(x, sr, 'bandpass', 1.4, Array.from({ length: 24 }, (_, k) => 180 * Math.pow(9000 / 180, k / 23)));
    for (let i = Math.max(0, n - Math.round(0.004 * sr)); i < n; i++) y[i] *= (n - i) / (0.004 * sr);
    K.put(y, t0, { vol: 0.12, norm: true, pan: 0 });
  }

  // ================= the end: 7:29 in the garden again, the cat back on the wall
  K.put(ucMeow(fx, { d: 0.35, f0: [500, 620, 540], open: 0.55 }), UC.question + 3.2, { vol: 0.026, norm: true, pan: -0.25, room: out, wet: 0.4 });
});
