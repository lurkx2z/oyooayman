/* =====================================================================
   SOUND · AMBIENCE — where the camera is (sound-lib.js: dsPlaceAt) and what time it is on the story clock (so in a
   time-lapse the days and nights go by in the sound too):
     in     your room: a quiet room tone, the fridge, the street muffled through the glass (busier by day)
     out    the street: traffic by day, a hush at night; birds after every sunrise, crickets after every sunset (in the
            Friday time-lapse they swap every second or two); a wind that rises as the week goes on; from Saturday the
            ground groans all the time (the planet straining into its new shape)
   ===================================================================== */

dsSound('amb', 'beds', function (ctx, bus, K) {
  const S = (t) => dsStoryAt(t);
  const day = dsCurve((t) => dsDaylight(S(t))), dawn = dsCurve((t) => { const s = S(t), d = s - (dsNext(s, true) - dsDay(s)); return dsDaylight(s) * Math.exp(-Math.max(0, d) / (0.12 * dsDay(s))); });
  const wind = dsCurve((t) => 0.15 + 0.85 * dsSm(dsTiltDeg(S(t)), 4, 70)), groan = dsCurve((t) => (S(t) > dsAt(6, 0, 0) ? dsQuake(S(t)) : 0));
  for (const p of dsPlaces()) {
    const a = p.t0, b = p.t1 + 0.06;
    if (b - a < 0.05 || a > DS.end + 1) continue;
    if (p.where === 'in') {
      dsBed(K, a, b, { colour: 'brown', f: [['lp', 260]], vol: 0.22, am: 0.1 });
      dsBed(K, a, b, { colour: 'pink', f: [['bp', 520, 0.6], ['lp', 1300]], vol: 0.32, am: 0.3, wr: 0.6, env: (u, t) => 0.25 + 0.75 * day(t) });
      dsBed(K, a, b, { colour: 'brown', f: [['lp', 90]], vol: 0.4, am: 0.2, env: (u, t) => groan(t) });
    } else {
      dsBed(K, a, b, { colour: 'pink', f: [['hp', 120], ['lp', 1900]], vol: 0.55, am: 0.25, wr: 0.8, env: (u, t) => 0.12 + 0.88 * day(t) * (1 - dsEv(S(t), dsAt(6, 0, 10), dsAt(6, 1, 0))) });
      dsBed(K, a, b, { colour: 'brown', f: [['lp', 380]], vol: 0.55, am: 0.5, wr: 0.25, env: (u, t) => wind(t) });
      dsBed(K, a, b, { colour: 'pink', f: [['bp', 900, 0.8]], vol: 0.3, am: 0.7, wr: 0.4, env: (u, t) => wind(t) * wind(t) });
      dsBed(K, a, b, { colour: 'brown', f: [['lp', 70]], vol: 0.9, am: 0.3, wr: 0.15, env: (u, t) => groan(t) });
    }
  }
  // birds after each sunrise and crickets at night (outdoors; in the room only faintly, through the glass)
  const fx = K.fx, inside = dsPlaceAt('in');
  for (let t = 0.2; t < DS.end; ) {
    const s = S(t), d = day(t), out = 1 - inside(t), n = dawn(t);
    if (fx.r.next() < 0.7 * (0.25 + 0.75 * n) * d) K.put(dsChirp(fx, { f0: fx.r.range(2600, 4600) }), t, { vol: (0.05 + 0.1 * n) * (0.25 + 0.75 * out), pan: fx.r.range(-0.8, 0.8), hp: 1500 });
    if (fx.r.next() < 0.6 * (1 - d) * out && s > 0) K.put(dsChirp(fx, { f0: fx.r.range(4300, 4700), n: fx.r.int(3, 6), gap: 0.03, nd: 0.025 }), t, { vol: 0.03, pan: fx.r.range(-0.8, 0.8), hp: 3000 });
    t += 0.08 + 0.12 * fx.r.next();
  }
});
