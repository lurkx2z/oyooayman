/* =====================================================================
   SOUND · AMBIENCE — where the camera is (sound-lib.js: saPlaceAt). The beds sit well under the score (mix.js: the
   score leads; the owner's rule after days-shorter):
     in     your kitchen: a quiet room tone, the fridge's hum, the street muffled through the glass; louder with the
            casement open (3:01:24 to 3:08)
     out    the street and the park: a city murmur, a light breeze, birds; the fountain's hiss near the pond; from
            3:07:20 a warning siren far off (the city telling everyone to hold on), still wailing after 3:10
   ===================================================================== */

saSound('amb', 'beds', function (ctx, bus, K) {
  const S = (t) => saStoryAt(t), fx = K.fx;
  const open = saCurve((t) => saSm(S(t), 83.5, 85.0) * (1 - saSm(S(t), 300, 302)));
  // how near the pond the camera is (the fountain's hiss): by shot
  const nearPond = { fountain: 1, fish: 0.8, ball: 0.25, question: 0.55, down: 0.35, window: 0.12 };
  for (const p of saPlaces()) {
    const a = p.t0, b = p.t1 + 0.06, m = p.shot.mode;
    if (b - a < 0.05 || a > SA.end + 1) continue;
    if (p.where === 'in') {
      saBed(K, a, b, { colour: 'brown', f: [['lp', 240]], vol: 0.2, am: 0.1 });
      saBed(K, a, b, { colour: 'pink', f: [['bp', 520, 0.6], ['lp', 1300]], vol: 0.26, am: 0.3, wr: 0.6, env: (u, t) => 0.35 + 0.65 * open(t) });
      saTone(K, a, b - a, 50, [[1, 0.5], [2, 1], [3, 0.35], [4, 0.2]], (u, t) => Math.min(1, t / 0.05, (b - a - t) / 0.05), { vol: 0.03, pan: -0.6 });
    } else {
      saBed(K, a, b, { colour: 'pink', f: [['hp', 140], ['lp', 1800]], vol: 0.42, am: 0.25, wr: 0.7 });
      saBed(K, a, b, { colour: 'brown', f: [['lp', 320]], vol: 0.35, am: 0.5, wr: 0.22 });
      const np = nearPond[m] || 0; if (np) saBed(K, a, b, { colour: 'white', f: [['hp', 900], ['lp', 6000]], vol: 0.3 * np, am: 0.15, wr: 2.5 });
    }
  }
  // birds: outdoors (in the room only faintly, through the glass)
  const inside = saPlaceAt('in');
  for (let t = 0.3; t < SA.end; ) {
    const out = 1 - inside(t);
    if (fx.r.next() < 0.45) K.put(saChirp(fx, { f0: fx.r.range(2600, 4600) }), t, { vol: 0.07 * (0.2 + 0.8 * out), pan: fx.r.range(-0.8, 0.8), hp: 1500 });
    t += 0.25 + 0.6 * fx.r.next();
  }
  // the warning siren, far off: a slow wail (rises, falls) from 3:07:20; muffled indoors
  { const t0 = saFilmAt(440.6), t1 = SA.end + 0.5, d = t1 - t0, n = Math.ceil(d * K.sr), y = new Float32Array(n);
    let ph = 0;
    for (let i = 0; i < n; i++) { const t = i / K.sr, w = 0.5 - 0.5 * Math.cos(2 * Math.PI * t / 7.5), fr = 380 + 420 * w; ph += 2 * Math.PI * fr / K.sr; y[i] = (Math.sin(ph) + 0.25 * Math.sin(2 * ph)) * Math.min(1, t / 2.5) * (0.6 + 0.4 * w) * (1 - 0.75 * inside(t0 + t)); }
    SAX.bq(y, 'lp', 1400, 0.7, K.sr);
    K.put(y, t0, { vol: 0.07, norm: true, pan: 0.45 }); }
});
