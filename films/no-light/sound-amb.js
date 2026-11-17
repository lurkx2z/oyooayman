/* =====================================================================
   SOUND · AMBIENCE — where the camera is (sound-lib.js: nlPlaces). The beds sit well under the score (mix.js; the
   owner's rule: the music clearly leads, beds about 10 dB under it). In the slowed stretches they sink and stretch a
   little (nlWorldRate).
     deck   level 4 under the concrete: the lamps' mains hum (100 Hz and its harmonics, an LED driver's thin whine),
            the room tone of a big concrete box, the town through the open sides; from 12:00 AM, with half the lamps
            off, the hum is lower and darker
     edge   at the open side: the town below (traffic, a far siren once), a light wind, the hum behind you
     cctv   camera 7's feed: its hiss and a mains hum, nothing of the deck
     exit   street level: the sodium lamps' buzz, the street, the ticket terminal's whine
   ===================================================================== */

nlSound('amb', 'beds', function (ctx, bus, K) {
  const F = nlFilmAt, tm = F(NLE.mid), fi = 0.04, fo = 0.04;
  // how many lamps are lit (1 before midnight, about half after), as the hum's level
  const lit = (t) => 1 - 0.45 * nlEv(t, tm, tm + 1.4);
  const room = K.verb('adeck', 2.6, { bright: 0.45, damp: 2.0, wet: 0.35, pre: 0.02, early: [[0.045, 0.3], [0.11, 0.2], [0.19, 0.12]] });
  for (const p of nlPlaces()) {
    const a = p.t0, b = p.t1 + 0.06, d = b - a;
    if (d < 0.05 || a > NL.end + 1) continue;
    const ed = (u, tt) => Math.min(1, tt / fi, (d - tt) / fo);
    switch (p.where) {
      case 'deck': case 'edge': {
        const edge = p.where === 'edge' ? 1 : 0;
        // the lamps' hum: 100 Hz and its harmonics (brighter with more lamps lit), the drivers' whine
        nlTone(K, a, d, (tt) => 100 * nlWorldRate(a + tt), [[1, 1], [2, 0.55], [3, 0.4], [4, 0.22], [5, 0.12], [7, 0.06]], (u, tt) => ed(u, tt) * lit(a + tt) * (edge ? 0.35 : 1), { vol: 0.03, norm: 1.8, pan: -0.1, f: [['lp', 900]] });
        nlTone(K, a, d, (tt) => 7800 * nlWorldRate(a + tt), [[1, 1]], (u, tt) => ed(u, tt) * lit(a + tt) * (edge ? 0.2 : 1) * (a + tt < tm ? 1 : 0.5), { vol: 0.0035, norm: 1, pan: 0.3 });
        // the concrete box's room tone and the town through the open sides
        nlBedW(K, a, b, { colour: 'pink', f: [['bp', 420, 0.6], ['lp', 1400]], vol: 0.05 + 0.03 * edge, am: 0.35, wr: 0.25, fi, fo });
        nlBedW(K, a, b, { colour: 'brown', f: [['lp', 240]], vol: 0.07 + 0.05 * edge, am: 0.45, wr: 0.15, fi, fo });
        if (edge) nlBedW(K, a, b, { colour: 'pink', f: [['bp', 650, 0.45], ['lp', 2200]], vol: 0.07, am: 0.7, wr: 0.3, fi, fo });   // the wind at the edge
        break;
      }
      case 'cctv': {
        nlBedW(K, a, b, { colour: 'white', f: [['hp', 2600], ['lp', 9000]], vol: 0.03, am: 0.1, fi: 0.01, fo: 0.01 });
        nlTone(K, a, d, 50, [[1, 0.5], [2, 1], [3, 0.6], [5, 0.3], [7, 0.15]], ed, { vol: 0.02, f: [['lp', 700]] });
        break;
      }
      case 'exit': {
        // the sodium lamps' buzz (a raspy 100 Hz), the street's traffic, the terminal's whine
        nlTone(K, a, d, (tt) => 100 * nlWorldRate(a + tt), [[1, 0.6], [2, 1], [3, 0.7], [4, 0.5], [6, 0.35], [8, 0.2], [10, 0.12]], ed, { vol: 0.022, norm: 2.6, pan: -0.25, f: [['lp', 2400]] });
        nlTone(K, a, d, 4100, [[1, 1]], ed, { vol: 0.003, norm: 1, pan: 0.4 });
        nlBedW(K, a, b, { colour: 'brown', f: [['lp', 320]], vol: 0.1, am: 0.5, wr: 0.2, fi, fo });
        nlBedW(K, a, b, { colour: 'pink', f: [['bp', 900, 0.5], ['lp', 3000]], vol: 0.045, am: 0.6, wr: 0.25, fi, fo });
        nlBedW(K, a, b, { colour: 'pink', f: [['bp', 300, 0.6], ['lp', 800]], vol: 0.04, am: 0.3, wr: 0.4, fi, fo, room, wet: 0.3 });
        break;
      }
    }
  }
  // the town, now and then: a car passing far below (on the deck and at the edge), a siren once, far off
  { const r = new RNG(CONFIG.seed + 4401);
    for (let t = 6 + r.range(0, 5); t < NL.end - 3; t += r.range(9, 17)) {
      const w = nlWhereShot(nlShotAt(t)); if (w === 'cctv' || w === 'exit') continue;
      const d = r.range(4, 6.5), lvl = (w === 'edge' ? 0.06 : 0.03) * r.range(0.7, 1);
      nlBedW(K, t, t + d, { colour: 'pink', f: [['bp', r.range(350, 520), 0.8], ['lp', 1600]], vol: lvl, mono: true, pan: r.range(-0.7, 0.7), env: (u) => Math.pow(Math.sin(Math.PI * u), 2.2), fi: 0.3, fo: 0.3 });
    }
    // a siren far off across the town (under "compared to what?")
    { const t0 = nlC('where', 0) + 0.8, d = 9;
      nlTone(K, t0, d, (tt) => 720 + 230 * Math.sin(2 * Math.PI * tt / 1.6), [[1, 1], [2, 0.25]], (u) => Math.pow(Math.sin(Math.PI * u), 1.5), { vol: 0.012, norm: 1.25, pan: 0.6, f: [['lp', 1800]], room, wet: 0.6 }); }
  }
});
