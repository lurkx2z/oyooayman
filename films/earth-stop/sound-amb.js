/* =====================================================================
   SOUND · AMBIENCE — where the camera is (sound-lib.js: esPlaces). The beds sit well under the score (mix.js; the
   owner's rule: the music clearly leads, beds about 10 dB under it). Until 5:42:00 the station sounds like a station
   on a warm evening. From then on the film runs hundreds of times slower than life, and every bed is the slowed
   world: low, wide, dragging.
     the platform   before 5:42: evening air, the harbour far off, your train idling, birds. After: the low roar of a
                    station sliding over its own floor; from the moment the Sun is covered, the sea's wall behind it
     beside your train  the ground going by under it
     inside it      the same, through the carriage: close and muffled, its own hum
     the hill       the air piling against the rock; from the first wagon on, the fire
     the harbour    the sea climbing the quay
     high up        thin wind
     the airliner   the cabin's steady hush (the one calm place in the film)
   At 5:42:01 everything still moving is suddenly standing still: the beds drop to a hush, until what the ground
   stopped comes back the other way.
   ===================================================================== */

esSound('amb', 'beds', function (ctx, bus, K) {
  const { fx } = K, T0 = ES.tOn, F = esFilmAt, P = ESP, tb = F(P.T), tW = F(P.wagon0), tTw = esB('twist'), tSun = esC('speed', 1), fi = 0.04, fo = 0.04;
  const open = K.verb('aopen', 1.8, { bright: 0.45, damp: 2.2, wet: 0.3 });
  // the hush after 5:42:01, lifting again as the blast comes
  const lv = esCurve((t) => 1 - 0.78 * esEv(t, tb - 0.005, tb + 0.02) * (1 - esEv(t, tTw - 0.5, tTw + 6)));
  // a bed at the film's level curve (esBed sets its peak after the envelope: scale it by the envelope's own peak)
  const bed = (a, b, o) => {
    let e = 0; for (let k = 0; k <= 40; k++) e = Math.max(e, lv(a + (b - a) * k / 40));
    if (e < 1e-3 || b - a < 0.05) return;
    esBed(K, a, b, Object.assign({ fi, fo, env: (u, t) => lv(t) }, o, { vol: o.vol * e }));
  };
  for (const p of esPlaces()) {
    let a = p.t0; const b = p.t1 + 0.06, m = p.shot.mode;
    if (b - a < 0.05 || a > ES.end + 1) continue;
    // ---- 5:41:57 PM: the station, as it always was
    if (m === 'title') {
      const e = T0 + 0.012, d = e - a;
      esBed(K, a, e, { colour: 'pink', f: [['bp', 700, 0.5], ['lp', 2600]], vol: 0.05, am: 0.4, wr: 0.4, fi: 0.3, fo: 0.012 });
      esBed(K, a, e, { colour: 'pink', f: [['bp', 340, 0.5], ['lp', 900]], vol: 0.04, am: 0.8, wr: 0.15, fi: 0.3, fo: 0.012 });
      esTone(K, a, d, 49, [[1, 0.5], [2, 1], [3, 0.6], [4, 0.3], [6, 0.15]], (u, tt) => Math.min(1, tt / 0.3, (d - tt) / 0.012), { vol: 0.035, pan: 0.3, f: [['lp', 500]] });
      a = T0;
    }
    const d = b - a, ed = (u, tt) => Math.min(1, tt / fi, (d - tt) / fo) * lv(a + tt);
    switch (p.where) {
      case 'inside': {
        bed(a, b, { colour: 'brown', f: [['lp', 210]], vol: 0.14, am: 0.3, wr: 0.5 });
        bed(a, b, { colour: 'pink', f: [['bp', 300, 0.7], ['lp', 650]], vol: 0.06, am: 0.5, wr: 0.6 });
        esTone(K, a, d, 50, [[1, 0.5], [2, 1], [3, 0.5], [4, 0.3], [6, 0.12]], ed, { vol: 0.025 * Math.max(0.2, lv(a + d / 2)), f: [['lp', 420]] });
        break;
      }
      case 'train': {
        bed(a, b, { colour: 'brown', f: [['lp', 230]], vol: 0.13, am: 0.35, wr: 0.4 });
        bed(a, b, { colour: 'pink', f: [['bp', 420, 0.6], ['lp', 1100]], vol: 0.06, am: 0.5, wr: 0.5 });
        break;
      }
      case 'hill': {
        bed(a, b, { colour: 'pink', f: [['bp', 400, 0.55], ['lp', 1300]], vol: 0.12, am: 0.7, wr: 0.3 });
        bed(a, b, { colour: 'brown', f: [['lp', 180]], vol: 0.08, am: 0.4, wr: 0.3 });
        break;
      }
      case 'sea': {
        bed(a, b, { colour: 'brown', f: [['lp', 320]], vol: 0.17, am: 0.4, wr: 0.3 });
        bed(a, b, { colour: 'pink', f: [['bp', 750, 0.4], ['lp', 2600]], vol: 0.1, am: 0.5, wr: 0.5 });
        bed(a, b, { colour: 'pink', f: [['hp', 2500]], vol: 0.022, am: 0.6, wr: 0.7 });
        break;
      }
      case 'high': {
        bed(a, b, { colour: 'pink', f: [['bp', 520, 0.5], ['lp', 1500]], vol: 0.09, am: 0.6, wr: 0.2 });
        bed(a, b, { colour: 'brown', f: [['lp', 150]], vol: 0.05, am: 0.3, wr: 0.3 });
        break;
      }
      case 'cabin': {
        bed(a, b, { colour: 'pink', f: [['bp', 420, 0.4], ['lp', 2200]], vol: 0.07, am: 0.06, wr: 0.2 });
        esTone(K, a, d, 92, [[1, 1], [2, 0.6], [3, 0.3], [4, 0.15]], ed, { vol: 0.03, f: [['lp', 600]] });
        break;
      }
      default: {   // the station
        bed(a, b, { colour: 'brown', f: [['lp', 190]], vol: 0.13, am: 0.35, wr: 0.25 });
        bed(a, b, { colour: 'pink', f: [['bp', 300, 0.5], ['lp', 800]], vol: 0.07, am: 0.6, wr: 0.2 });
        bed(a, b, { colour: 'pink', f: [['bp', 1500, 0.6]], vol: 0.02, am: 0.7, wr: 0.3 });
        // the sea's wall, 100 metres and more of it, standing behind the station from the moment it covers the Sun
        if (a >= tSun - 0.1) bed(a, b, { colour: 'brown', f: [['lp', 270]], vol: 0.07, am: 0.5, wr: 0.2 });
        break;
      }
    }
    // the fire on the hill, from the first wagon on: all of it at the hill, a far roar from everywhere else on land
    if (b > tW && p.where !== 'cabin') {
      const a2 = Math.max(a, tW), near = p.where === 'hill' ? 1 : p.where === 'sea' ? 0 : p.where === 'inside' ? 0.25 : 0.32;
      if (near > 0) {
        bed(a2, b, { colour: 'brown', f: [['lp', 450 * (near < 1 ? 0.5 : 1)]], vol: 0.17 * near, am: 0.55, wr: 1.3, fi: a2 > a ? 0.6 : fi });
        if (near === 1) {
          bed(a2, b, { colour: 'pink', f: [['bp', 1100, 0.5]], vol: 0.05, am: 0.7, wr: 2, fi: a2 > a ? 0.6 : fi });
          K.put(esCrackle(fx, b - a2, { rate: 46, hp: 700 }), a2, { vol: 0.05 * Math.max(0.25, lv((a2 + b) / 2)), norm: true, pan: 0.15, room: open, wet: 0.3, stop: b, fade: 0.05 });
        }
      }
    }
  }
  // birds on the platform, until 5:42:00
  { const r = new RNG(CONFIG.seed + 4401);
    for (let t = -0.9 + r.range(0, 0.3); t < T0 - 0.45; t += r.range(0.5, 1.1))
      K.put(esChirp(fx), t, { vol: r.range(0.02, 0.04), norm: true, pan: r.range(-0.8, 0.8), room: open, wet: 0.4, stop: T0 + 0.004, fade: 0.004 });
  }
});
