/* =====================================================================
   SOUND · AMBIENCE — where the camera is (sound-lib.js: nbPlaces). The beds sit well under the score (mix.js; the
   owner's rule: the music clearly leads, beds about 10 dB under it). While nothing bounces, every bed runs at the
   world's own speed (nbWorldRate: a quarter, so it sinks two octaves and its flutter drags), then rises through the
   count and snaps back at 3:30:10.
     the fair       400 people's murmur (lively, then slowed and afraid, then the panic, then a murmur, then hushed at
                    4:42 PM), the generators' hum, the rides' rumble
     the fence      wind over the valley, the motorway far below (jammed after the crash), the fair behind you; a jet far
                    off while the plane comes in
     a car          the engine, the road, the wind on the glass
     the verge      the motorway's rumble and the cars going past
     the flight deck  the air conditioning, the engines, the avionics fans; the tower: a quiet room, fans, the wind
     beside the plane  the jet's roar and its fan's whine
     the coaster    the wind of the ride and the track's rumble
     the station    its fans and pumps
   ===================================================================== */

nbSound('amb', 'beds', function (ctx, bus, K) {
  const T0 = NB.tLock, tb = nbFilmAt(NBP.T), tA = nbB('after'), tE = nbB('echo');
  // how many people you hear, and how afraid (film time t)
  const crowd = (t) => (t < T0 ? 1 : t < tb ? 0.72 : t < tA ? 0.95 + 0.6 * Math.exp(-(t - tb) / 6) : t < tE ? 0.5 : 0.26);
  const panic = (t) => (t < tb || t >= tA ? 0 : MathX.smooth(t, tb, tb + 0.35) * (0.3 + 0.7 * Math.exp(-(t - tb) / 7)));
  const traffic = (t) => (t < tb ? 1 : t < tA ? 0.8 : t < tE ? 0.45 : 0.6);
  const fi = 0.04, fo = 0.04;
  for (const p of nbPlaces()) {
    const a = p.t0, b = p.t1 + 0.06, m = p.shot.mode, d = b - a;
    if (d < 0.05 || a > NB.end + 1) continue;
    const ed = (u, tt) => Math.min(1, tt / fi, (d - tt) / fo), W = (f0) => (tt) => f0 * nbWorldRate(a + tt);
    switch (p.where) {
      case 'edge': {
        nbBedW(K, a, b, { colour: 'pink', f: [['bp', 420, 0.5], ['lp', 1300]], vol: 0.12, am: 0.6, wr: 0.3, fi, fo });
        nbBedW(K, a, b, { colour: 'brown', f: [['lp', 300]], vol: 0.1, am: 0.3, wr: 0.4, env: (u, t) => traffic(t), fi, fo });
        nbBedW(K, a, b, { colour: 'pink', f: [['bp', 600, 0.6], ['lp', 1500]], vol: 0.05, am: 0.5, wr: 0.7, env: (u, t) => traffic(t), fi, fo });
        nbBedW(K, a, b, { colour: 'pink', f: [['bp', 500, 0.6], ['lp', 900]], vol: 0.07, am: 0.5, wr: 0.9, env: (u, t) => crowd(t), fi, fo });
        if (m === 'planeHill') nbBedW(K, a, b, { colour: 'pink', f: [['bp', 700, 0.8], ['lp', 1600]], vol: 0.06, am: 0.2, fi, fo });
        break;
      }
      case 'car': {
        nbTone(K, a, d, W(85), [[1, 1], [2, 0.7], [3, 0.35], [4, 0.2], [6, 0.1]], ed, { vol: 0.04, pan: 0.1 });
        nbBedW(K, a, b, { colour: 'brown', f: [['lp', 380]], vol: 0.17, am: 0.15, wr: 0.6, fi, fo });
        nbBedW(K, a, b, { colour: 'pink', f: [['bp', 1100, 0.6], ['lp', 3000]], vol: 0.06, am: 0.3, wr: 0.5, fi, fo });
        break;
      }
      case 'verge': {
        nbBedW(K, a, b, { colour: 'brown', f: [['lp', 520]], vol: 0.11, am: 0.4, wr: 0.5, fi, fo });
        nbBedW(K, a, b, { colour: 'pink', f: [['bp', 800, 0.5], ['lp', 2500]], vol: 0.07, am: 0.8, wr: 0.6, fi, fo });
        nbBedW(K, a, b, { colour: 'pink', f: [['bp', 400, 0.5], ['lp', 1200]], vol: 0.07, am: 0.6, wr: 0.3, fi, fo });
        break;
      }
      case 'cockpit': {
        nbBedW(K, a, b, { colour: 'pink', f: [['hp', 600], ['lp', 5000]], vol: 0.07, am: 0.1, fi, fo });
        nbBedW(K, a, b, { colour: 'brown', f: [['lp', 180]], vol: 0.16, am: 0.15, fi, fo });
        nbBedW(K, a, b, { colour: 'pink', f: [['bp', 1500, 0.4]], vol: 0.09, am: 0.25, wr: 0.5, fi, fo });
        nbBedW(K, a, b, { colour: 'pink', f: [['bp', 380, 3]], vol: 0.035, mono: true, pan: 0.4, fi, fo });
        break;
      }
      case 'tower': {
        nbBedW(K, a, b, { colour: 'pink', f: [['lp', 1500]], vol: 0.05, am: 0.1, fi, fo });
        nbTone(K, a, d, W(120), [[1, 0.5], [2, 1], [3, 0.3]], ed, { vol: 0.014, pan: -0.3 });
        nbBedW(K, a, b, { colour: 'pink', f: [['bp', 600, 0.6], ['lp', 1500]], vol: 0.05, am: 0.7, wr: 0.3, fi, fo });
        break;
      }
      case 'sky': {
        nbBedW(K, a, b, { colour: 'brown', f: [['lp', 260]], vol: 0.1, am: 0.15, fi, fo });
        nbBedW(K, a, b, { colour: 'pink', f: [['bp', 1100, 0.6], ['lp', 4000]], vol: 0.075, am: 0.2, wr: 0.6, fi, fo });
        nbTone(K, a, d, W(2800), [[1, 1], [1.5, 0.4]], ed, { vol: 0.012, pan: 0.2 });
        break;
      }
      case 'ride': {
        nbBedW(K, a, b, { colour: 'pink', f: [['bp', 900, 0.4], ['lp', 3500]], vol: 0.13, am: 0.5, wr: 0.5, fi, fo });
        nbBedW(K, a, b, { colour: 'brown', f: [['lp', 200]], vol: 0.07, am: 0.4, wr: 2, fi, fo });
        break;
      }
      case 'space': {
        nbBedW(K, a, b, { colour: 'pink', f: [['hp', 120], ['lp', 2600]], vol: 0.07, am: 0.05, fi, fo });
        nbBedW(K, a, b, { colour: 'pink', f: [['bp', 300, 2]], vol: 0.045, am: 0.3, wr: 0.2, fi, fo });
        nbBedW(K, a, b, { colour: 'brown', f: [['lp', 150]], vol: 0.06, fi, fo });
        break;
      }
      default: {   // the fair
        nbBedW(K, a, b, { colour: 'pink', f: [['bp', 650, 0.55], ['lp', 2600]], vol: 0.19, am: 0.55, wr: 0.9, env: (u, t) => crowd(t), fi, fo });
        if (b > tb && a < tA) nbBedW(K, a, b, { colour: 'pink', f: [['bp', 1300, 0.8], ['lp', 4200]], vol: 0.12, am: 0.9, wr: 1.8, env: (u, t) => panic(t), fi, fo });
        nbTone(K, a, d, W(50), [[2, 1], [3, 0.5], [4, 0.35], [6, 0.15]], ed, { vol: 0.022, pan: 0.4 });
        nbBedW(K, a, b, { colour: 'brown', f: [['lp', 260]], vol: 0.11, am: 0.3, wr: 0.5, fi, fo });
        if (a >= tE - 0.1) nbBedW(K, a, b, { colour: 'pink', f: [['bp', 500, 0.5], ['lp', 1400]], vol: 0.07, am: 0.6, wr: 0.3, fi, fo });   // the evening wind
        break;
      }
    }
  }
});
