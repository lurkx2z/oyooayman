/* =====================================================================
   SOUND · AMBIENCE — where the camera is (sound-lib.js: shPlaces). The beds sit well under the score (mix.js; the
   owner's rule: the music clearly leads, beds about 10 dB under it). From 10:42:00 every bed runs at the world's own
   speed (shWorldRate: a quarter, so it sinks two octaves and its flutter drags), rising through the count and snapping
   back at 10:42:10.
     the river      the water against the hull, a light wind, the town far off, your boat's engine (idling; from
                    10:42:01 your mum pushes it flat out); birds before 10:42 and after
     inside         the hull's water and the engine through it, close and muffled
     the hospital   the ventilation, the mains hum, the MRI's cold-head pump chuffing
     the bridge     the traffic's roar and the wind over the deck
     the hill       wind over the grass, the turbines' swish (until they stop dead)
     high up        wind; the river far below
   ===================================================================== */

shSound('amb', 'beds', function (ctx, bus, K) {
  const T0 = SH.tOn, tb = shFilmAt(SHP.T), tA = shB('after'), W = (f0) => (tt) => f0, fi = 0.04, fo = 0.04;
  // your boat's engine: idling, then flat out from 10:42:01 (your mum), then idling again after 10:42:10
  const onBoat = ['check2', 'check3', 'title', 'yard', 'radio', 'phone', 'hospitalExt', 'real', 'mum', 'rip', 'count', 'bike', 'question', 'hull'];
  const rev = (t) => (t < T0 + 1 ? 0.55 : t < tb ? 1 : t < tA ? 0.5 : 0.4);
  for (const p of shPlaces()) {
    const a = p.t0, b = p.t1 + 0.06, m = p.shot.mode, d = b - a;
    if (d < 0.05 || a > SH.end + 1) continue;
    const ed = (u, tt) => Math.min(1, tt / fi, (d - tt) / fo), Wr = (f0) => (tt) => f0 * shWorldRate(a + tt) * (0.8 + 0.4 * rev(a + tt));
    switch (p.where) {
      case 'inside': {
        shBedW(K, a, b, { colour: 'brown', f: [['lp', 240]], vol: 0.14, am: 0.3, wr: 0.5, fi, fo });
        shBedW(K, a, b, { colour: 'pink', f: [['bp', 320, 0.7], ['lp', 700]], vol: 0.07, am: 0.6, wr: 0.7, fi, fo });
        shTone(K, a, d, Wr(15), [[2, 1], [3, 0.7], [4, 0.5], [6, 0.3], [8, 0.15]], ed, { vol: 0.05, f: [['lp', 500]] });
        break;
      }
      case 'hospital': {
        shBedW(K, a, b, { colour: 'pink', f: [['hp', 200], ['lp', 2400]], vol: 0.06, am: 0.1, fi, fo });
        shTone(K, a, d, (tt) => 100 * shWorldRate(a + tt), [[1, 0.6], [2, 1], [3, 0.35], [4, 0.2]], ed, { vol: 0.016, pan: -0.2 });
        // the MRI's cold-head pump: a soft chuff every 1.2 s (slowed with the world)
        shBedW(K, a, b, { colour: 'pink', f: [['bp', 700, 1.2]], vol: 0.05, mono: true, pan: 0.25, fi, fo,
          env: (u, t) => { let ph = 0; ph = ((t - a) * shWorldRate(t) / 1.2) % 1; return Math.exp(-ph / 0.12) * (1 - Math.exp(-ph / 0.01)); } });
        break;
      }
      case 'bridge': {
        shBedW(K, a, b, { colour: 'brown', f: [['lp', 520]], vol: 0.13, am: 0.35, wr: 0.5, fi, fo });
        shBedW(K, a, b, { colour: 'pink', f: [['bp', 900, 0.5], ['lp', 2600]], vol: 0.07, am: 0.7, wr: 0.6, fi, fo });
        shBedW(K, a, b, { colour: 'pink', f: [['bp', 380, 0.5], ['lp', 1100]], vol: 0.07, am: 0.6, wr: 0.3, fi, fo });
        break;
      }
      case 'hill': {
        shBedW(K, a, b, { colour: 'pink', f: [['bp', 420, 0.5], ['lp', 1300]], vol: 0.13, am: 0.7, wr: 0.25, fi, fo });
        shBedW(K, a, b, { colour: 'brown', f: [['lp', 180]], vol: 0.07, am: 0.4, wr: 0.3, fi, fo });
        break;
      }
      case 'high': {
        shBedW(K, a, b, { colour: 'pink', f: [['bp', 500, 0.5], ['lp', 1500]], vol: 0.1, am: 0.6, wr: 0.3, fi, fo });
        shBedW(K, a, b, { colour: 'pink', f: [['bp', 600, 0.6], ['lp', 1600]], vol: 0.05, am: 0.5, wr: 0.8, fi, fo });
        break;
      }
      default: {   // the river
        shBedW(K, a, b, { colour: 'pink', f: [['bp', 520, 0.55], ['lp', 1700]], vol: 0.11, am: 0.65, wr: 0.8, fi, fo });
        shBedW(K, a, b, { colour: 'pink', f: [['bp', 320, 0.5], ['lp', 950]], vol: 0.07, am: 0.5, wr: 0.3, fi, fo });
        shBedW(K, a, b, { colour: 'brown', f: [['lp', 260]], vol: 0.06, am: 0.3, wr: 0.4, fi, fo });
        const near = onBoat.includes(m) ? 1 : 0.35;
        shTone(K, a, d, Wr(15), [[2, 1], [3, 0.7], [4, 0.55], [6, 0.3], [8, 0.18], [10, 0.08]], ed, { vol: 0.045 * near, pan: 0.15, f: [['lp', 900]] });
        break;
      }
    }
  }
  // birds over the river before 10:42 and after (none in the slowed seconds: they would sink below hearing)
  { const r = new RNG(CONFIG.seed + 4401), open = K.verb('aopen', 1.8, { bright: 0.45, damp: 2.2, wet: 0.3 });
    for (const [t0, t1] of [[-1, T0 - 0.1], [tA, SH.end + 0.5]]) for (let t = t0 + r.range(0.2, 1); t < t1 - 0.4; t += r.range(1.2, 3.2)) {
      const sh = shShotAt(t), w = shWhereShot(sh); if (w === 'inside' || w === 'hospital') continue;
      K.put(shChirp(K.fx), t, { vol: r.range(0.02, 0.045), norm: true, pan: r.range(-0.8, 0.8), room: open, wet: 0.4 });
    } }
});
