/* =====================================================================
   SOUND · AMBIENCE — where the camera is (sound-lib.js: mgPlaces). The beds sit well under the score (mix.js; the
   owner's rule: the music clearly leads, beds about 10 dB under it). In the slow minutes (up to 13 times slower) every
   bed is lowered and darkened, as if the world itself had slowed; from the radio on they are at real speed.
     your car       the road under the tyres (with the car's speed), the wind on the glass; the engine idling once
                    it has stopped; the vents
     the deck       wind across the viaduct, the valley's hush; nothing on the motorway moves
     the river      the water, the wind, a few birds
     in the air     the airflow round flight 2207, its engines (outside); in the cockpit the hiss over the
                    windscreen and the avionics' fans; in the cabin the roar, and the murmur of the 64 left
     the tower      the room, the air conditioning, the radios' hiss
     the airfield   wind over the grass, a skylark
     the town       wind, birds, the hospital's air handling
     the ward       the room, the air conditioning
   ===================================================================== */

mgSound('amb', 'beds', function (ctx, bus, K) {
  const fx = K.fx, S = mgStoryAt;
  const carV = mgCurve((t) => MGP.carV(S(t)) / MGP.car.v0);
  for (const p of mgPlaces()) {
    const a = p.t0, b = p.t1 + 0.06, m = p.shot.mode;
    if (b - a < 0.05 || a > MG.end + 1) continue;
    const q = mgRateAt(a + 0.01) < 0.5 ? 0.45 : 1, fi = 0.04, fo = 0.04, end = (t) => (t > MG.end - 0.02 ? 0 : 1), fade = (t) => Math.min(1, (t - a) / fi, (b - t) / fo);
    switch (p.where) {
      case 'car': {
        mgBed(K, a, b, { colour: 'brown', f: [['lp', 230 * q]], vol: 0.3, am: 0.12, wr: 0.5, env: (u, t) => 0.12 + 0.88 * carV(t), fi, fo });
        mgBed(K, a, b, { colour: 'pink', f: [['bp', 760 * q, 0.6], ['lp', 2200 * q]], vol: 0.13, am: 0.3, wr: 0.7, env: (u, t) => carV(t) * end(t), fi, fo });
        // the engine idling (heard once the road has gone quiet), the vents
        mgTone(K, a, b - a, 27 * Math.sqrt(q), [[1, 1], [2, 0.7], [3, 0.35], [4, 0.25], [6, 0.1]], (u, tt) => (1 - 0.7 * carV(a + tt)) * fade(a + tt), { vol: 0.035, f: [['lp', 260]] });
        mgBed(K, a, b, { colour: 'pink', f: [['hp', 1800 * q], ['lp', 6000 * q]], vol: 0.02, am: 0.1, fi, fo });
        break;
      }
      case 'deck': {
        const late = S(a) > 3000;
        mgBed(K, a, b, { colour: 'pink', f: [['bp', 460 * q, 0.5], ['lp', 1400 * q]], vol: late ? 0.17 : 0.14, am: 0.55, wr: 0.22, env: (u, t) => end(t), fi, fo });
        mgBed(K, a, b, { colour: 'brown', f: [['lp', 300 * q]], vol: 0.12, am: 0.4, wr: 0.15, fi, fo });
        if (q === 1) mgBed(K, a, b, { colour: 'pink', f: [['hp', 3200], ['lp', 7000]], vol: 0.018, am: 0.6, wr: 0.4, fi, fo });
        break;
      }
      case 'river': {
        mgBed(K, a, b, { colour: 'pink', f: [['bp', 1100, 0.6], ['lp', 3200]], vol: 0.08, am: 0.35, wr: 0.9, fi, fo });
        mgBed(K, a, b, { colour: 'pink', f: [['bp', 420, 0.5], ['lp', 1300]], vol: 0.13, am: 0.5, wr: 0.2, fi, fo });
        for (let t = a + 0.6; t < b - 0.6; t += fx.r.range(1.4, 3.2)) K.put(mgChirp(fx, { f0: fx.r.range(2600, 3800) }), t, { vol: 0.012, norm: true, pan: fx.r.range(-0.7, 0.7) });
        break;
      }
      case 'high': {
        mgBed(K, a, b, { colour: 'brown', f: [['lp', 420]], vol: 0.21, am: 0.15, wr: 0.6, fi, fo });
        mgBed(K, a, b, { colour: 'pink', f: [['bp', 1300, 0.5], ['lp', 5200]], vol: 0.12, am: 0.25, wr: 0.8, fi, fo });
        mgTone(K, a, b - a, 1880, [[1, 1], [1.5, 0.4], [2, 0.3]], (u, tt) => fade(a + tt), { vol: 0.008, pan: -0.3 });
        break;
      }
      case 'cockpit': {
        mgBed(K, a, b, { colour: 'pink', f: [['hp', 900], ['lp', 5200]], vol: 0.11, am: 0.12, wr: 0.5, fi, fo });
        mgBed(K, a, b, { colour: 'brown', f: [['lp', 190]], vol: 0.18, am: 0.1, fi, fo });
        mgTone(K, a, b - a, 410, [[1, 1], [2, 0.3], [3.02, 0.12]], (u, tt) => fade(a + tt), { vol: 0.006, pan: 0.3 });
        break;
      }
      case 'cabin': {
        mgBed(K, a, b, { colour: 'brown', f: [['lp', 300]], vol: 0.24, am: 0.08, fi, fo });
        mgBed(K, a, b, { colour: 'pink', f: [['bp', 520, 0.6], ['lp', 1500]], vol: 0.12, am: 0.12, fi, fo });
        mgBed(K, a, b, { colour: 'pink', f: [['bp', 620, 1.1], ['lp', 1800]], vol: 0.035, am: 0.9, wr: 2.2, fi, fo });   // the murmur of the 64
        break;
      }
      case 'tower': {
        mgBed(K, a, b, { colour: 'brown', f: [['lp', 200]], vol: 0.08, am: 0.1, fi, fo });
        mgTone(K, a, b - a, 60, [[1, 0.6], [2, 1], [3, 0.4], [5, 0.12]], (u, tt) => fade(a + tt), { vol: 0.012, pan: 0.4 });
        mgBed(K, a, b, { colour: 'pink', f: [['hp', 800], ['lp', 3000]], vol: 0.016, am: 0.2, fi, fo });
        break;
      }
      case 'field': {
        mgBed(K, a, b, { colour: 'pink', f: [['bp', 520, 0.5], ['lp', 1600]], vol: 0.17, am: 0.6, wr: 0.25, fi, fo });
        mgBed(K, a, b, { colour: 'brown', f: [['lp', 260]], vol: 0.11, am: 0.4, fi, fo });
        mgBed(K, a, b, { colour: 'pink', f: [['hp', 3000], ['lp', 8000]], vol: 0.025, am: 0.7, wr: 0.5, fi, fo });
        for (let t = a + 0.4; t < b - 0.5; t += fx.r.range(0.5, 1.1)) K.put(mgChirp(fx, { f0: fx.r.range(3200, 4600), n: fx.r.int(3, 7), gap: 0.04, nd: 0.05 }), t, { vol: 0.008, norm: true, pan: 0.4 });
        break;
      }
      case 'town': {
        const hosp = m === 'hospital';
        mgBed(K, a, b, { colour: 'pink', f: [['bp', 520, 0.5], ['lp', 1500]], vol: m === 'townHigh' ? 0.15 : 0.11, am: 0.5, wr: 0.22, fi, fo });
        mgBed(K, a, b, { colour: 'brown', f: [['lp', 220]], vol: 0.11, am: 0.3, fi, fo });
        if (hosp) mgTone(K, a, b - a, 50, [[1, 0.5], [2, 1], [3, 0.5], [4, 0.3], [6, 0.1]], (u, tt) => fade(a + tt), { vol: 0.02, pan: 0.5, f: [['lp', 600]] });
        for (let t = a + 0.5; t < b - 0.6; t += fx.r.range(1.2, 2.6)) K.put(mgChirp(fx), t, { vol: 0.01, norm: true, pan: fx.r.range(-0.8, 0.8) });
        break;
      }
      case 'ward': {
        mgBed(K, a, b, { colour: 'brown', f: [['lp', 180]], vol: 0.07, am: 0.1, fi, fo });
        mgBed(K, a, b, { colour: 'pink', f: [['bp', 900, 0.7], ['lp', 2400]], vol: 0.028, am: 0.15, fi, fo });
        mgTone(K, a, b - a, 100, [[1, 1], [2, 0.4], [3, 0.2]], (u, tt) => fade(a + tt), { vol: 0.006, pan: -0.4 });
        break;
      }
    }
  }
});
