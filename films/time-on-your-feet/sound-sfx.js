/* =====================================================================
   SOUND · EFFECTS — the events, at the moments the picture shows them:
     the cut from the black hole to the hallway; the two clocks' start beep; the sped-up year and lifetime (a rush of
     days); your cat's purr; the pole lifted out and laid down, then turned over into its base; the stairs; the
     experiments (the gamma-ray counter, the cabin chime, the lab jack's motor, the laser's shutter); the GPS signal
     and your phone; the Moon (the radio's beep, your breath in the suit); the ball dropped onto the floor; the maths
     appearing; your steps to the front door, the door, the light; the flights to the stars and the landings; the deck
     groaning under your weight; the telescope; the black hole's platform (your step aboard, its motor each time it
     goes lower, the stop), your toes in slow motion, the sky racing, the freeze; home again; the bunk bed.
   ===================================================================== */

// a whoosh: noise through a band-pass that sweeps f0 → f1 → f2 over d, its level a hump (o.peak: where, 0…1),
// panned from o.p0 to o.p1
function tfWhoosh(K, t, d, o = {}) {
  const { fx, sr } = K, n = Math.ceil(d * sr), pk = o.peak ?? 0.6;
  const mk = (seed) => {
    const x = tfNoise(fx, n, o.colour || 'pink');
    const y = tfSweep(x, sr, 'bandpass', o.q || 1.2, [o.f0 || 300, o.f1 || 1800, o.f2 || o.f0 || 300]);
    for (let i = 0; i < n; i++) { const u = i / n, e = u < pk ? Math.pow(u / pk, o.rise || 2) : Math.pow((1 - u) / (1 - pk), o.fall || 1.5); y[i] *= e; }
    return y;
  };
  const L = mk(), R = mk();
  if (o.p0 != null) { for (let i = 0; i < n; i++) { const p = tfLerp(o.p0, o.p1 ?? o.p0, i / n), a = (p + 1) * Math.PI / 4; L[i] *= Math.cos(a) * 1.41; R[i] *= Math.sin(a) * 1.41; } }
  return K.putLR(L, R, t, { vol: o.vol || 0.1, norm: true, room: o.room, wet: o.wet });
}
// a cat's purr: pulses at ~26 Hz through the chest, breathing in and out (in 1.6 s cycles), over d
function tfPurr(fx, d) {
  const sr = fx.sr, n = Math.ceil(d * sr), y = tfNoise(fx, n, 'pink'), wv = fx.wander(0.5);
  for (let i = 0; i < n; i++) { const t = i / sr, br = Math.sin(Math.PI * ((t / 1.6) % 1)), f = 26 + 2 * wv(t) + ((t / 1.6) % 1 < 0.45 ? 2 : -1); y[i] *= Math.pow(Math.max(0, Math.sin(2 * Math.PI * f * t)), 3) * (0.45 + 0.55 * br) * Math.min(1, t / 0.4, (d - t) / 0.6); }
  TFX.bq(y, 'bp', 320, 0.8, sr); TFX.bq(y, 'lp', 900, 0.7, sr);
  return y;
}
// the black hole's platform motor: how fast it is going down at t (|d ln(height)/dt|), 0 when still
function tfLowerRate(t) {
  if (t < TF.board || t >= TF.freeze + 2.6) return 0;
  const f = t < TF.ten - 0.4 ? (x) => Math.log(tfBhR(x) - 1) : (x) => Math.log(tfRho(x));
  return Math.abs(f(t + 0.05) - f(t - 0.05)) / 0.1;
}

tfSound('sfx', 'events', function (ctx, bus, K) {
  const { fx, r } = K, cap = (id, k) => tfCap(id, k).show;
  const room = K.verb('room', 0.7, { bright: 0.4, damp: 4, wet: 0.4, seed: 41 });
  const hall = K.verb('hall', 1.2, { bright: 0.4, damp: 3.2, wet: 0.4, seed: 43, early: [[0.013, 0.3], [0.029, 0.2]] });
  const big = K.verb('big', 3.6, { bright: 0.45, damp: 2.2, wet: 0.55, seed: 47, pre: 0.03 });

  // ---- the cut from the black hole to the hallway: a reversed swell that stops dead on the cut
  tfWhoosh(K, TF.titleShot - 1.6, 1.62, { f0: 200, f1: 2500, f2: 2500, peak: 0.995, rise: 3, vol: 0.06 });

  // ---- the two clocks start: one beep from each, at exactly the same moment
  K.put(fx.beep(2048, 0.12), TF.start, { vol: 0.05, pan: 0.25, room, wet: 0.5 });
  K.put(fx.beep(2048, 0.12), TF.start, { vol: 0.05, pan: -0.25, room, wet: 0.5 });

  // ---- a year, sped up: a rush of days (the light sweeping round the hall, seasons turning); a lifetime: higher, faster
  {
    const rush = (a, b, f0, f1, vol) => {
      const d = b - a, n = Math.ceil(d * K.sr), mk = () => { const x = tfNoise(fx, n, 'pink'), cv = Array.from({ length: 24 }, (_, k) => f0 * Math.pow(f1 / f0, Math.sin(Math.PI * k / 23)) * (1 + 0.25 * Math.sin(k * 1.9))); const y = tfSweep(x, K.sr, 'bandpass', 0.9, cv); for (let i = 0; i < n; i++) { const u = i / n; y[i] *= Math.pow(Math.sin(Math.PI * u), 1.4) * (0.75 + 0.25 * Math.sin(2 * Math.PI * 11 * i / K.sr)); } return y; };
      K.putLR(mk(), mk(), a, { vol, norm: true, room, wet: 0.3 });
    };
    rush(TF.yearGo - 0.2, TF.yearEnd + 0.3, 250, 2400, 0.09);
    rush(TF.life + 0.2, TF.lifeEnd + 0.3, 500, 5000, 0.07);
    K.put(fx.hit(fx.metalModes(1900, 0.3), { width: 0.0003 }), TF.yearEnd, { vol: 0.02, pan: 0.2, room, wet: 0.5 });   // (stops)
  }

  // ---- your cat, asleep: a purr
  K.put(tfPurr(fx, TF.lie - TF.cat - 0.2), TF.cat + 0.1, { vol: 0.07, norm: true, pan: -0.1, room, wet: 0.2 });

  // ---- the pole: lifted out of its base (a click, a slide) and laid on the floor (a soft knock); then up and over,
  //      into its base upside down (a whoosh, a clunk); the stairs (three treads)
  {
    K.put(fx.clamp({ pitch: 0.8 }), TF.poleDown - 0.05, { vol: 0.04, norm: true, pan: 0.2, room, wet: 0.4 });
    K.put(fx.rustle(0.9, { density: 300, rub: 0.5, lo: 600, hi: 3500, grain: 0.01 }), TF.poleDown + 0.1, { vol: 0.02, norm: true, pan: 0.15, room, wet: 0.4 });
    K.put(fx.woodStep({ weight: 0.7, f: 110 }), TF.poleLevel, { vol: 0.08, norm: true, pan: 0.1, room, wet: 0.4 });
    tfWhoosh(K, TF.poleFlip - 0.1, 1.3, { f0: 200, f1: 900, peak: 0.55, vol: 0.03, p0: -0.3, p1: 0.3 });
    K.put(fx.hit(fx.metalModes(620, 0.4), { width: 0.002, noise: 0.3, nhp: 1200 }), TF.poleFlipped, { vol: 0.04, norm: true, pan: 0.1, room, wet: 0.4 });
    K.put(fx.woodStep({ weight: 0.5, f: 120 }), TF.poleFlipped + 0.01, { vol: 0.06, norm: true, pan: 0.1, room, wet: 0.4 });
    const s0 = TF.upstairs - 0.3, s1 = TF.measured - 0.3;
    for (let i = 0; i < 4; i++) K.put(fx.woodStep({ weight: 0.55, creak: i === 2 ? 0.25 : 0, scuff: 0.15 }), s0 + 0.9 + i * (s1 - s0 - 1.2) / 4, { vol: 0.07, norm: true, pan: i % 2 ? 0.1 : -0.1, room: hall, wet: 0.5 });
  }

  // ---- the experiments. The lab: a few beeps. 1959: the gamma-ray counter's clicks. 1971: the cabin chime. 2010: the
  //      lab jack's motor (33 cm). 2022: the laser's shutter and a shimmer
  {
    for (const [dt, f] of [[1.2, 1760], [1.38, 2093], [3.4, 1568]]) K.put(fx.beep(f, 0.07), TF.measured + dt, { vol: 0.012, pan: 0.4, room, wet: 0.5 });
    for (let t = TF.pound + 0.8; t < TF.planes - 0.3; t += r.range(0.04, 0.35)) K.put(fx.hit([[3000, 0.003, 1], [5200, 0.002, 0.5]], { width: 0.00008, noise: 0.6, nhp: 2500 }), t, { vol: 0.02 * r.range(0.5, 1), norm: true, pan: 0.3, room, wet: 0.3 });
    K.put(fx.beep(659, 0.9), TF.planes + 1.0, { vol: 0.02, pan: 0, room: hall, wet: 0.6 }); K.put(fx.beep(523, 1.2), TF.planes + 1.55, { vol: 0.02, pan: 0, room: hall, wet: 0.6 });
    const l0 = TF.lift, l1 = TF.lift + 2.5;
    tfTone(K, l0 - 0.05, l1 - l0 + 0.15, (tt) => 140 + 50 * Math.sin(Math.PI * MathX.clamp(tt / (l1 - l0), 0, 1)), [[1, 1], [2, 0.5], [3, 0.3], [5, 0.15]], (u) => Math.min(1, u / 0.05, (1 - u) / 0.06) * 0.8, { vol: 0.015, pan: 0.2, f: [['bp', 600, 0.7]] });
    K.put(fx.clamp({ pitch: 1.2 }), l1, { vol: 0.02, norm: true, pan: 0.2, room, wet: 0.4 });
    K.put(fx.clamp({ pitch: 1.6, slow: 0.6 }), TF.jila + 0.4, { vol: 0.02, norm: true, pan: -0.2, room, wet: 0.4 });
    K.put(fx.shimmer(2.6, 1320), TF.jila + 0.5, { vol: 0.012, norm: true, pan: 0, room: big, wet: 0.5 });
  }

  // ---- GPS: past a satellite (a soft rush); the signal (a ping that sets off and arrives); your phone's map
  {
    tfWhoosh(K, TF.gps2 - 0.4, 2.2, { f0: 150, f1: 1200, peak: 0.4, vol: 0.05, p0: 0.6, p1: -0.6, room: big, wet: 0.3 });
    K.put(fx.beep(1250, 0.18), TF.gps3 + 0.4, { vol: 0.03, pan: -0.3, room: big, wet: 0.6 });
    K.put(fx.beep(1250, 0.18), TF.gps3 + 1.6, { vol: 0.02, pan: 0.3, room: big, wet: 0.7 });
    K.put(fx.hit([[2400, 0.012, 1], [4100, 0.008, 0.5]], { width: 0.0003 }), TF.phone, { vol: 0.03, norm: true, pan: 0, room, wet: 0.3 });
    K.put(fx.beep(1568, 0.06), TF.phone + 0.12, { vol: 0.012, pan: 0, room, wet: 0.3 }); K.put(fx.beep(2093, 0.08), TF.phone + 0.2, { vol: 0.012, pan: 0, room, wet: 0.3 });
  }
  // ---- the Moon: the radio's beep (the Apollo tone, 2,525 Hz), then your breath inside the helmet
  {
    K.put(fx.beep(2525, 0.25), TF.moon + 0.3, { vol: 0.015, pan: 0, lp: 3500 });
    for (let t = TF.moon + 1.2; t < TF.why - 1.2; t += 3.4) {
      K.put(fx.breath(1.3, { inhale: true }), t, { vol: 0.012, norm: true, pan: 0, lp: 3000 });
      K.put(fx.breath(1.6, {}), t + 1.5, { vol: 0.01, norm: true, pan: 0, lp: 2600 });
    }
  }

  // ---- why: the ball dropped onto the floor (lands after 0.54 s, two small bounces); the maths lines appear
  {
    const tb = TF.drop + Math.sqrt(2 * 1.415 / 9.81);
    const knock = (v) => { const y = fx.hit([...fx.woodModes(150, 1.2), [2900, 0.03, 0.25 * v], [4300, 0.02, 0.12 * v]], { width: 0.001, amp: v }); return y; };
    K.put(knock(1), tb, { vol: 0.12, norm: true, pan: 0.3, room, wet: 0.4 });
    K.put(knock(0.5), tb + 0.571, { vol: 0.035, norm: true, pan: 0.3, room, wet: 0.4 });
    K.put(knock(0.3), tb + 1.142, { vol: 0.012, norm: true, pan: 0.3, room, wet: 0.4 });
    K.put(fx.rustle(1.4, { density: 200, rub: 0.4, lo: 300, hi: 1800, grain: 0.02, env: (u) => Math.exp(-u * 3) }), tb + 1.3, { vol: 0.012, norm: true, pan: 0.35, room, wet: 0.3 });   // it rolls
    for (const k of [0, 1, 2]) K.put(fx.hit([[1900, 0.01, 1], [3100, 0.006, 0.4]], { width: 0.0004 }), cap('maths', k) + 0.05, { vol: 0.012, norm: true, pan: -0.2, room, wet: 0.4 });
  }
  // ---- to the front door: your steps, the latch, the door swinging, the light
  {
    const t0 = TF.go, t1 = TF.wd;
    K.put(fx.clamp({ pitch: 0.7, slow: 1.3 }), t0 + 0.1, { vol: 0.03, norm: true, pan: 0, room: hall, wet: 0.4 });
    K.put(fx.creak(1.3, [[180, 0.02, 1], [420, 0.012, 0.6], [830, 0.008, 0.3]], { rate: [12, 30], env: (u) => Math.sin(Math.PI * u) }), t0 + 0.25, { vol: 0.02, norm: true, pan: 0, room: hall, wet: 0.5 });
    for (let i = 0, t = t0 + 0.5; t < t1 - 0.6; i++, t += 0.52) K.put(fx.woodStep({ weight: 0.5 + 0.05 * (i % 2), scuff: 0.1 }), t, { vol: 0.06, norm: true, pan: i % 2 ? 0.08 : -0.08, room: hall, wet: 0.45 });
    tfWhoosh(K, t1 - 2.2, 2.6, { f0: 200, f1: 4000, f2: 600, peak: 0.85, rise: 2.5, vol: 0.09, room: big, wet: 0.4 });
  }

  // ---- the flights to the stars and the landings; on Sirius B: the deck groaning under your weight; the day sped up;
  //      the telescope's shutter. The neutron star: the same, heavier
  {
    const flight = (a, b, vol) => { tfWhoosh(K, a, b - a, { colour: 'brown', f0: 80, f1: 700, f2: 1800, peak: 0.92, rise: 1.6, vol, room: big, wet: 0.35 }); };
    const land = (t, k) => {
      K.put(fx.hit([[38, 0.9, 1], [57, 0.6, 0.6], [86, 0.4, 0.4], [140, 0.25, 0.2]], { width: 0.02, noise: 0.4, nlen: 0.08, nhp: 200, len: 3.5 }), t, { vol: 0.2 * k, norm: true, pan: 0, room: big, wet: 0.5 });
      tfWhoosh(K, t, 2.4, { f0: 3000, f1: 900, f2: 200, peak: 0.05, rise: 1, fall: 2, vol: 0.05 * k, room: big, wet: 0.5 });
    };
    flight(TF.wd, TF.wdLand, 0.1); land(TF.wdLand, 1);
    for (const t of [cap('wd2', 1) + 0.2, cap('wd2', 1) + 1.4]) K.put(fx.creak(1.2, [[62, 0.05, 1], [148, 0.03, 0.6], [311, 0.02, 0.35]], { rate: [8, 22], env: (u) => Math.sin(Math.PI * u) }), t, { vol: 0.05, norm: true, pan: 0.1, room: big, wet: 0.4 });
    tfWhoosh(K, tfS('wd3') + 0.4, tfE('wd3') - tfS('wd3') - 0.6, { f0: 200, f1: 1600, peak: 0.5, vol: 0.04, p0: -0.5, p1: 0.5 });
    K.put(fx.clamp({ pitch: 0.9 }), TF.wd4 + 0.3, { vol: 0.03, norm: true, pan: 0, room: big, wet: 0.3 });
    flight(TF.ns, TF.nsLand, 0.11); land(TF.nsLand, 1.25);
    K.put(fx.creak(1.6, [[45, 0.06, 1], [101, 0.04, 0.6], [233, 0.02, 0.35]], { rate: [6, 16], env: (u) => Math.sin(Math.PI * u) }), TF.nsLand + 0.4, { vol: 0.06, norm: true, pan: 0, room: big, wet: 0.4 });
    K.put(fx.shimmer(3.4, 1760, { skew: 0.4 }), cap('ns4', 1) - 0.2, { vol: 0.01, norm: true, pan: 0, room: big, wet: 0.6 });
    tfWhoosh(K, tfS('ns5') + 0.3, tfCap('ns5', 0).hide - tfS('ns5') - 0.4, { f0: 200, f1: 1600, peak: 0.5, vol: 0.04, p0: -0.5, p1: 0.5 });
  }

  // ---- the black hole. The fall towards it; your step onto the platform; its motor each time it goes lower, and the
  //      stop; your toes, wiggling in slow motion (their creak at half speed and pitch); the sky racing; the freeze
  {
    tfWhoosh(K, TF.bh, TF.board - TF.bh, { colour: 'brown', f0: 50, f1: 300, f2: 120, peak: 0.6, rise: 1.4, vol: 0.08, room: big, wet: 0.3 });
    K.put(fx.step({ weight: 0.8, s: 2.2, body: 60 }), TF.board + 0.3, { vol: 0.08, norm: true, pan: -0.05, room: big, wet: 0.3 });
    K.put(fx.hit(fx.metalModes(310, 0.6), { width: 0.002 }), TF.board + 0.32, { vol: 0.03, norm: true, pan: 0, room: big, wet: 0.4 });
    // the motor: a geared whine whose level and pitch follow how fast it is going down; a clunk each time it stops
    const mv = tfCurve((t) => MathX.smooth(tfLowerRate(t), 0.02, 0.35));
    const a = TF.board, b = TF.freeze + 3;
    tfTone(K, a, b - a, (tt) => 90 + 70 * mv(a + tt), [[1, 1], [2, 0.6], [3, 0.35], [4.2, 0.2], [7, 0.1]], (u, tt) => mv(a + tt), { vol: 0.02, pan: 0, f: [['lp', 1500]] });
    tfBed(K, a, b, { colour: 'pink', f: [['bp', 900, 1.2]], vol: 0.008, env: (u, t) => mv(t), fi: 0.02, fo: 0.2 });
    let was = false;
    for (let t = a; t < b; t += 0.02) { const on = mv(t) > 0.25; if (was && !on) K.put(fx.hit(fx.metalModes(240, 0.5), { width: 0.004, noise: 0.25, nhp: 600 }), t + 0.1, { vol: 0.05, norm: true, pan: 0, room: big, wet: 0.35 }); was = on; }
    // your toes: the shoe's creak, slowed to half speed (you see, and would hear, them at half speed)
    K.put(fx.creak(1.0, [[300, 0.02, 1], [640, 0.012, 0.6], [1300, 0.008, 0.3]], { rate: [20, 50], env: (u) => Math.sin(Math.PI * u) }), TF.wiggle, { vol: 0.03, norm: true, pan: 0, rate: 0.5, room, wet: 0.3 });
    K.put(fx.creak(1.0, [[290, 0.02, 1], [610, 0.012, 0.6], [1250, 0.008, 0.3]], { rate: [20, 50], env: (u) => Math.sin(Math.PI * u) }), TF.wiggle + 2.2, { vol: 0.025, norm: true, pan: 0.05, rate: 0.5, room, wet: 0.3 });
    tfWhoosh(K, TF.outside + 0.2, 3.5, { f0: 800, f1: 6000, f2: 2000, peak: 0.3, vol: 0.04, p0: -0.7, p1: 0.7, room: big, wet: 0.4 });
    // the universe in fast-forward: a fine glittering fizz under the flashes round it
    { const d = TF.edge - TF.outside - 1.2; K.put(tfCrackle(fx, d, { rate: 140, hp: 4500, env: (u) => Math.min(1, u / 0.15, (1 - u) / 0.2) }), TF.outside + 1.0, { vol: 0.012, norm: true, pan: 0, room: big, wet: 0.6 }); }
    // the freeze: a long suck-out into almost nothing
    tfWhoosh(K, TF.freeze - 1.6, 2.4, { f0: 3000, f1: 400, f2: 60, peak: 0.6, rise: 1.5, fall: 3, vol: 0.06, room: big, wet: 0.6 });
    // your feet's view: a turn
    tfWhoosh(K, TF.feetView - 0.6, 1.4, { f0: 300, f1: 2500, f2: 500, peak: 0.45, vol: 0.04, p0: 0.5, p1: -0.5 });
  }

  // ---- home again (a soft swell over the cut); the bunk bed's creak for the question
  tfWhoosh(K, TF.real - 1.2, 1.25, { f0: 200, f1: 1800, f2: 1800, peak: 0.995, rise: 3, vol: 0.04 });
  K.put(fx.creak(0.9, [[150, 0.02, 1], [360, 0.012, 0.6], [720, 0.008, 0.3]], { rate: [14, 36], env: (u) => Math.sin(Math.PI * u) }), TF.question + 1.4, { vol: 0.03, norm: true, pan: 0.3, room, wet: 0.4 });
  K.put(fx.woodStep({ weight: 0.4, creak: 0.3 }), TF.question + 2.4, { vol: 0.04, norm: true, pan: 0.3, room, wet: 0.4 });
});

TF_SOUND_FNS.push(tfWhoosh, tfPurr, tfLowerRate);
