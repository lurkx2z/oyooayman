/* =====================================================================
   SOUND · AMB — the places. Each bed follows the shots it belongs to (hvPlace), with a short crossfade at each cut.
     the garden at night   a distant road, leaves, a few late crickets, a tawny owl: the same before and after
                           10:00:00 (nothing you can hear changes when half the universe goes); from 10:02:58, as "down"
                           tips, car alarms start up round the neighbourhood (their tilt sensors) and the house creaks
                           (they are already going in the cold open, 10:03:32)
     the telescope / the long lens   the garden, quieter
     space                 almost nothing: a faint low hum under the illustrations (the music and the effects carry
                           them; the face's roar and the air off the edge are illustration, in the effects)
   After the shock the garden is gone: black, then space. Tonight at 9:59 (the real part) the garden again.
   ===================================================================== */

hvSound('amb', 'places', function (ctx, bus, K) {
  const { fx, sr } = K, END = HV.end + 1.2;
  const garden = hvPlace((s) => s.set === 'garden');
  const space = hvPlace((s) => s.set === 'space');
  // the garden's level: lower through a lens (the replay, the telescope), gone from the shock until tonight again
  const g = hvCurve((t) => garden(t) * (hvWn(t, HV.moon, HV.moonEnd, 0.1, 0.1) || hvWn(t, HV.moonedge, HV.others, 0.05, 0.05) ? 0.45 : 1) * (t > HV.hit && t < HV.real - 0.3 ? 0 : 1) * (t > HV.openHit && t < HV.titleShot ? 0 : 1));
  const room = K.verb('garden', 1.4, { bright: 0.5, damp: 4, wet: 0.16 });

  // ---- the garden at night: the far road, the leaves, crickets, an owl
  hvBed(K, 0, END, { colour: 'pink', f: [['lp', 700], ['hp', 50]], env: (u, t) => g(t), vol: 0.085, fi: 0.3, fo: 0.4, am: 0.3, wr: 0.15 });   // the far road
  hvBed(K, 0, END, { colour: 'white', f: [['bp', 3000, 0.5], ['lp', 8000]], env: (u, t) => g(t), vol: 0.026, fi: 0.3, fo: 0.4, am: 0.8, wr: 0.35 });   // leaves
  { const r = new RNG(91); for (let t = 0.4; t < END; t += 0.5 + 1.2 * r.next()) { const v = g(t); if (v < 0.3) continue; K.put(hvCricket(fx, {}), t, { vol: (0.01 + 0.01 * r.next()) * v, pan: r.range(-0.8, 0.8), room }); } }
  for (const [t, pan] of [[17.2, -0.6], [cap0('nothing') + 3.0, 0.5], [HV.tv + 4.2, -0.4], [HV.real2 + 1.5, -0.5], [HV.real4 + 2.0, 0.4]]) if (g(t) > 0.5) K.put(hvOwl(fx, {}), t, { vol: 0.06, norm: true, pan, room, wet: 1 });
  function cap0(id) { return hvCap(id, 0).show; }

  // ---- 10:03: car alarms going off round the neighbourhood (their tilt sensors feel "down" moving), near and far
  {
    const cars = [[hvStory(178.5), -0.7, 0.35, 'whoop'], [hvStory(186.0), 0.55, 0.22, 'beep'], [hvStory(193.0), -0.2, 0.18, 'warble'], [hvStory(201.5), 0.8, 0.14, 'beep'], [hvStory(208.0), -0.85, 0.12, 'whoop']];
    // (and in the cold open, 10:03:32 to the shock, all of them already going)
    const inOpen = cars.map(([t0, pan, v, kind]) => [Math.max(0.0, HV.openHit - (HV.hit - t0)), pan, v * 0.5, kind, HV.openHit]);
    for (const [t0, pan, v, kind, tEnd] of cars.map((c) => c.concat([HV.hit])).concat(inOpen)) {
      const d = tEnd - t0 + 0.05, n = Math.ceil(d * sr), y = new Float32Array(n); let ph = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr; let f, a = 1;
        if (kind === 'whoop') { const u = (t % 1.1) / 1.1; f = 600 + 900 * u; }
        else if (kind === 'beep') { f = 1250; a = (t % 0.5) < 0.3 ? 1 : 0; }
        else { f = 900 + 350 * Math.sign(Math.sin(2 * Math.PI * 6 * t)); }
        ph += 2 * Math.PI * f / sr; y[i] = Math.tanh(2.5 * Math.sin(ph)) * 0.5 * a * Math.min(1, t / 0.02);
      }
      HVX.bq(y, 'lp', 2400 - 900 * (1 - v / 0.35), 0.7, sr); HVX.bq(y, 'hp', 350, 0.7, sr);
      for (let i = 0; i < n; i++) y[i] *= g(t0 + i / sr);
      K.put(y, t0, { vol: v * 0.075, norm: true, pan, room, wet: 1 });
    }
  }
  // the small quakes before the shock: a low grumble under the garden, growing (from about 10:01:30; hvTremor)
  hvBed(K, hvStory(80), HV.hit + 0.05, { colour: 'brown', f: [['lp', 70], ['hp', 22]], env: (u, t) => g(t) * hvTremor(hvStoryAt(t)) * (0.6 + 0.4 * Math.abs(noise1(t * 1.7, 3))), vol: 0.16, fi: 0.5, fo: 0.02, am: 0.5, wr: 0.3 });
  hvBed(K, 0, HV.openHit + 0.05, { colour: 'brown', f: [['lp', 70], ['hp', 22]], env: (u, t) => hvTremor(hvStoryAt(t)) * (0.6 + 0.4 * Math.abs(noise1(t * 1.7, 3))), vol: 0.16, fi: 0.3, fo: 0.02, am: 0.5, wr: 0.3 });   // (the cold open)
  // a dog, a few gardens away, set off by the alarms
  { const r = new RNG(95); for (let t = hvStory(190.5); t < HV.hit - 0.4; t += 1.1 + 2.0 * r.next()) { const v = g(t); if (v < 0.3) continue; const y = fx.arr(0.5); const n = Math.round(r.range(0.12, 0.18) * sr), z = hvNoise(fx, n, 'pink'); HVX.bq(z, 'bp', r.range(550, 750), 2.5, sr); for (let i = 0; i < n; i++) y[i] = z[i] * Math.sin(Math.PI * i / n); K.put(y, t, { vol: 0.045 * v, norm: true, pan: 0.6, room, wet: 1 }); } }

  // ---- space: a faint low hum under the illustrations
  hvBed(K, HV.gone - 0.3, HV.real + 0.3, { colour: 'brown', f: [['lp', 110], ['hp', 25]], env: (u, t) => space(t) * (t > HV.hit && t < HV.fall - 0.2 ? 0 : 1), vol: 0.05, fi: 0.4, fo: 0.4, am: 0.3, wr: 0.1 });
});
