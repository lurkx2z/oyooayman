/* =====================================================================
   SOUND · AMB — the places. Each bed follows the shots it belongs to (lbPlace), with a short crossfade at each cut.
     the garden at night   a distant road, leaves, a few late crickets, a tawny owl (the night of 9:59 PM, the
                           first minutes after 10, the night that finally comes back, and tonight again at the end)
     the garden by day     robins singing at 10 PM (robins sing under streetlights anyway; in daylight, all of them),
                           a blackbird, the road; bees at noon; at 4 AM an owl that has lost its dark
     the park at sunrise   a dawn chorus
     Hawaii                the surf, the palms, the crowd: chatter at noon, the gasp when their Sun goes out, the
                           murmur in the dark, the cheer when it comes back
     space                 almost nothing: a faint low hum under the illustrations (the music carries them)
   Light turning round does nothing to sound: the garden's sounds carry on straight through 10:00:00 (the mix only
   holds its breath for a second there: mix.js).
   ===================================================================== */

lbSound('amb', 'places', function (ctx, bus, K) {
  const { fx } = K, END = LB.end + 1.2, sun2 = lbStory(LB_SKY.on), M = (...m) => (s) => m.includes(s.mode);
  const garden = lbPlace((s) => s.set === 'garden' && s.mode !== 'sunrise');
  const nightG = lbCurve((t) => garden(t) * (t < sun2 + 0.3 || t > LB.nightBack + 1.5 ? 1 : 0) * (t > LB.replay && t < LB.replayEnd ? 0.3 : 1));
  const dayG = lbCurve((t) => garden(t) * (t > sun2 - 0.2 && t < LB.nightBack + 1.5 ? 1 : 0) * (t > LB.nightBack ? 1 - MathX.smooth(t, LB.nightBack, LB.nightBack + 2.5) : 1));
  const park = lbPlace(M('sunrise'));
  const hawaii = lbPlace((s) => s.set === 'hawaii');
  const space = lbPlace((s) => s.set === 'space');
  const room = K.verb('garden', 1.4, { bright: 0.5, damp: 4, wet: 0.16 });

  // ---- the garden at night: the road, the leaves, crickets, an owl
  lbBed(K, 14.8, END, { colour: 'pink', f: [['lp', 700], ['hp', 50]], env: (u, t) => nightG(t) + 0.6 * dayG(t), vol: 0.09, fi: 0.5, fo: 0.4, am: 0.3, wr: 0.15 });   // the far road
  lbBed(K, 14.8, END, { colour: 'white', f: [['bp', 3000, 0.5], ['lp', 8000]], env: (u, t) => nightG(t) + dayG(t), vol: 0.03, fi: 0.5, fo: 0.4, am: 0.8, wr: 0.35 });   // leaves
  { const r = new RNG(91); for (let t = 15.6; t < END; t += 0.35 + 0.9 * r.next()) { const v = nightG(t); if (v < 0.3) continue; K.put(lbCricket(fx, {}), t, { vol: (0.012 + 0.012 * r.next()) * v, pan: r.range(-0.8, 0.8), room }); } }
  for (const [t, pan] of [[24.5, -0.6], [61.5, 0.5], [99.0, -0.3], [405.2, -0.5], [432.0, 0.4]]) if (nightG(t) > 0.5) K.put(lbOwl(fx, {}), t, { vol: 0.07, norm: true, pan, room, wet: 1 });
  // a dog, far off, at the second Sun (it notices first)
  { const y = fx.arr(1.4); for (const [a, d] of [[0, 0.16], [0.42, 0.14], [0.9, 0.18]]) { const i0 = Math.round(a * K.sr), n = Math.round(d * K.sr), z = lbNoise(fx, n, 'pink'); LBX.bq(z, 'bp', 650, 2.5, K.sr); for (let i = 0; i < n; i++) y[i0 + i] += z[i] * Math.sin(Math.PI * i / n); } K.put(y, sun2 + 1.6, { vol: 0.05, norm: true, pan: 0.7, room, wet: 1 }); }

  // the cold open (10:02:30, the second Sun 70 s old): the crickets still going, a robin trying the odd phrase
  { const open = lbPlace(M('open', 'title')), r = new RNG(92); for (let t = 1.2; t < LB.before - 0.5; t += 1.8 + 2.5 * r.next()) K.put(lbRobinSong(fx, { n: r.int(5, 9) }), t, { vol: 0.035 * open(t), pan: r.range(-0.7, 0.7), room }); }

  // ---- the garden by day: robins (from the second Sun on), a blackbird, a wood pigeon; bees at noon and in summer
  { const r = new RNG(93); for (let t = sun2 + 2.4; t < LB.nightBack; t += 1.1 + 2.2 * r.next()) { const v = dayG(t); if (v < 0.3) continue; const close = t > LB.robin && t < LB.lampsOff - 1;
    K.put(lbRobinSong(fx, {}), t, { vol: (close ? 0.06 : 0.03) * v * (0.7 + 0.3 * r.next()), pan: close ? -0.2 : r.range(-0.9, 0.9), room }); } }
  { const r = new RNG(95); for (let t = LB.day + 3; t < LB.nightBack; t += 3.5 + 4 * r.next()) { const v = dayG(t); if (v < 0.3) continue; K.put(lbChirp(fx, { n: r.int(4, 7), f0: r.range(1900, 2600), gap: 0.07, nd: 0.12 }), t, { vol: 0.03 * v, pan: r.range(-0.8, 0.8), room }); } }
  const bees = lbCurve((t) => dayG(t) * (lbWn(t, LB.noon, LB.never, 0.4, 0.4) + lbWn(t, LB.summer, LB.heat, 0.4, 0.4)));
  lbTone(K, LB.noon - 0.5, LB.heat - LB.noon + 1, (t) => 215 + 12 * Math.sin(t * 1.3) + 8 * Math.sin(t * 3.1), [[1, 1], [2, 0.5], [3, 0.3], [4, 0.15]], (u, t) => bees(LB.noon - 0.5 + t), { vol: 0.012, f: [['bp', 600, 0.8]], pan: 0.3 });
  // 4 AM, two days on, broad daylight: a tawny owl calling anyway
  K.put(lbOwl(fx, { f: 580 }), lbCap('never', 1).show + 0.4, { vol: 0.07, norm: true, pan: -0.5, room, wet: 1 });

  // ---- the park at 6:45 AM: a dawn chorus, a breeze
  lbBed(K, LB.sunrise - 0.3, LB.noon + 0.3, { colour: 'pink', f: [['lp', 900], ['hp', 60]], env: (u, t) => park(t), vol: 0.07, fi: 0.3, fo: 0.3, am: 0.4, wr: 0.2 });
  { const r = new RNG(97); for (let t = LB.sunrise; t < LB.noon - 0.3; t += 0.18 + 0.5 * r.next()) K.put(r.next() < 0.5 ? lbRobinSong(fx, { n: r.int(5, 10) }) : lbChirp(fx, { f0: r.range(2400, 5200) }), t, { vol: 0.02 + 0.025 * r.next(), pan: r.range(-0.95, 0.95), room }); }

  // ---- Hawaii: the surf, the palms, the crowd
  const hEnv = lbCurve(hawaii);
  { const r = new RNG(99); for (let t = LB.hawaii - 1.5; t < LB.full; t += 4.2 + 2.6 * r.next()) { const v = hEnv(t + 1); if (v < 0.2) continue; const [L, R] = lbSurf(fx, 4.5 + r.next()); K.putLR(L, R, t, { vol: 0.16 * v, norm: true }); } }
  lbBed(K, LB.hawaii - 0.3, LB.full, { colour: 'pink', f: [['lp', 380], ['hp', 40]], env: (u, t) => hEnv(t), vol: 0.07, fi: 0.3, fo: 0.3, am: 0.4, wr: 0.15 });   // the sea's roar
  lbBed(K, LB.hawaii - 0.3, LB.full, { colour: 'white', f: [['bp', 2600, 0.5], ['lp', 7000]], env: (u, t) => hEnv(t), vol: 0.025, fi: 0.3, fo: 0.3, am: 0.9, wr: 0.5 });   // the palms
  // the crowd: chatter at noon; hushed for a moment when the Sun goes; a rising murmur in the dark; quiet while they wait
  const crowd = lbCurve((t) => hEnv(t) * (t < LB.out + 0.3 ? 1 : t < LB.out + 2.5 ? 0.15 : t < LB.wait ? 0.8 : t < LB.ret ? 0.45 : 0.9));
  lbBed(K, LB.hawaii - 0.3, LB.full, { colour: 'white', f: [['bp', 850, 0.7], ['lp', 3000]], env: (u, t) => crowd(t), vol: 0.06, fi: 0.3, fo: 0.3, am: 1.0, wr: 1.4 });
  lbBed(K, LB.hawaii - 0.3, LB.full, { colour: 'pink', f: [['bp', 400, 0.8]], env: (u, t) => crowd(t), vol: 0.04, fi: 0.3, fo: 0.3, am: 0.8, wr: 0.9 });

  // ---- space: a faint low hum under the illustrations
  lbBed(K, LB.why - 0.3, LB.nightBack + 0.3, { colour: 'brown', f: [['lp', 110], ['hp', 25]], env: (u, t) => space(t), vol: 0.06, fi: 0.4, fo: 0.4, am: 0.3, wr: 0.1 });
  // the boiling oceans: a roar under the steam
  lbBed(K, LB.boil - 0.3, LB.birth + 0.3, { colour: 'brown', f: [['lp', 400], ['hp', 30]], env: (u, t) => space(t) * MathX.smooth(t, lbCap('boil', 1).show, lbCap('boil', 2).show + 1), vol: 0.14, fi: 0.4, fo: 0.6, am: 0.5, wr: 0.3 });
});
