/* =====================================================================
   SOUND · AMB — the places. A bed follows the picture (gtAt: the bedroom, the street, the river), with a short
   crossfade at each cut. The air keeps its old down (the caption says so), so there is no gale: the street sounds like
   a street, only with nothing driving on it and everything that fell lying in a heap at the bottom.
     the bedroom     its room tone; the street through the walls (and through the hole once the window has gone);
                     before 7:42:00 the morning traffic far off and the robins; the rain drumming on the house's west
                     side once the river arrives; at 8:42 the rain on the roof
     the street      the air, the leaves, more wind up high; the car alarms of the pile at the bottom (each set off when
                     its car hits, quieter the further the camera is from the pile: gtNear); alarms all over town, far
                     off; crashes in other streets in the first minute; dogs; birds' alarm calls
     the rain        a roar coming down the street from the west as the falling river's front comes (gtRainAt), then
                     rain everywhere; at the return it falls out of the air onto the ground for ~12 s, and stops
     the river       the roar of a river falling along its own bed at up to 35 m/s; the spray where it bends
     after 8:42      the alarms set off again by the pile dropping, a dog, the drips, the birds starting again
   ===================================================================== */

gtSound('amb', 'places', function (ctx, bus, K) {
  const { fx, sr } = K, END = GT.end + 1.2, r = new RNG(4401), S = gtStoryAt;
  const street = K.verb('street', 1.8, { bright: 0.5, damp: 3.5, wet: 0.22 });
  const town = K.verb('town', 3.2, { bright: 0.35, damp: 2.2, shape: 1.6, pre: 0.04, wet: 0.5 });
  // where the picture is (the place curves cross-fade over ±60 ms at each cut)
  const inC = gtCurve(gtAt('in')), outC = gtCurve(gtAt('out')), rvC = gtCurve(gtAt('river'));
  const modes = (list, xf = 0.06) => { const W = gtPlaces().filter((p) => list.includes(p.shot.mode)).map((p) => [p.t0, p.t1]); return gtCurve((t) => { let v = 0; for (const [a, b] of W) v += gtWn(t, a, b, xf, xf); return Math.min(1, v); }); };
  const hiC = modes(['master', 'town', 'sun', 'release', 'impact', 'last', 'wood', 'tipped', 'bottom']);
  // a curve that jumps at the cuts, smoothed over ±40 ms (so a bed's level never steps)
  const sm = (f) => gtCurve((t) => (f(t - 0.04) + f(t) + f(t + 0.04)) / 3);
  const rainK = sm((t) => gtRainAt(t).k), rainNear = sm((t) => gtRainAt(t).near), rainGround = sm((t) => gtRainAt(t).ground);
  const open = gtCurve((t) => gtEv(S(t), GT_GLASS.go, GT_GLASS.go + 0.4));                  // the window's gone
  // the windows where a curve is on (merged, padded), so the beds are only built where they play
  const wins = (f, pad = 0.1, th = 0.001) => {
    const out = []; let a = null;
    for (let t = 0; t < END; t += 0.02) { const on = f(t) > th; if (on && a == null) a = t; if (!on && a != null) { out.push([Math.max(0, a - pad), t + pad]); a = null; } }
    if (a != null) out.push([Math.max(0, a - pad), END]);
    return out;
  };
  const beds = (f, o) => { for (const [a, b] of wins(f)) gtBed(K, a, b, Object.assign({}, o, { env: (u, t) => f(t) * (o.env ? o.env(u, t) : 1), fi: 0.04, fo: 0.04 })); };

  // ================================================================================================ the bedroom
  beds(inC, { colour: 'pink', f: [['lp', 480], ['hp', 45]], vol: 0.045, am: 0.2, wr: 0.2 });                                   // room tone
  beds((t) => inC(t) * (1 - gtEv(S(t), 0.15, 1.2)), { colour: 'pink', f: [['lp', 380], ['hp', 60]], vol: 0.05, am: 0.4, wr: 0.12 });   // 7:41: the traffic on the main road, far off
  beds((t) => inC(t) * (1 - 0.6 * open(t)), { colour: 'brown', f: [['lp', 260], ['hp', 40]], vol: 0.045, am: 0.35, wr: 0.15 });  // the street through the walls
  beds((t) => inC(t) * open(t), { colour: 'pink', f: [['lp', 1800], ['hp', 90]], vol: 0.05, am: 0.45, wr: 0.25 });              // … through the hole
  // the rain on the house's west side (the bedroom is at the front, in its lee: a drumming through the house), and
  // through the hole once the window has gone; at the return, the rain falling onto the roof
  beds((t) => inC(t) * rainK(t), { colour: 'pink', f: [['lp', 800], ['hp', 110]], vol: 0.06, am: 0.25, wr: 0.3 });
  beds((t) => inC(t) * rainK(t) * open(t), { colour: 'white', f: [['bp', 3500, 0.6], ['lp', 9000]], vol: 0.03, am: 0.35, wr: 0.4 });
  beds((t) => inC(t) * rainGround(t), { colour: 'pink', f: [['lp', 1500], ['hp', 150]], vol: 0.08, am: 0.3, wr: 0.45 });
  // the robins at 7:41, through the glass
  for (const t of [0.15, 1.05]) K.put(gtRobinSong(fx, { n: 9 }), t, { vol: 0.012, norm: true, pan: t < 1 ? -0.5 : 0.4, lp: 2600, room: street, wet: 0.4 });

  // ================================================================================================= the street
  beds(outC, { colour: 'pink', f: [['lp', 700], ['hp', 50]], vol: 0.05, am: 0.35, wr: 0.15 });                                  // the air
  beds((t) => outC(t) * hiC(t), { colour: 'pink', f: [['bp', 520, 0.5], ['lp', 1500]], vol: 0.06, am: 0.6, wr: 0.18 });            // up high: wind
  beds((t) => outC(t) * (1 - 0.5 * rainK(t)), { colour: 'white', f: [['bp', 3200, 0.5], ['lp', 8000]], vol: 0.015, am: 0.8, wr: 0.35 });   // leaves
  // falling with the garden chair: the air rushing past (as fast as it falls, ~15 m/s)
  {
    const F = GT_FALLERS.find((f) => f.k === 'gchair'), ch = modes(['chair'], 0.04);
    const rush = gtCurve((t) => ch(t) * Math.pow(MathX.clamp(gtFaller(F, S(t)).v / 15, 0, 1), 1.4));
    beds(rush, { colour: 'pink', f: [['bp', 750, 0.45], ['lp', 2600]], vol: 0.1, am: 0.55, wr: 0.7 });
    beds(rush, { colour: 'white', f: [['bp', 2400, 0.7]], vol: 0.025, am: 0.9, wr: 1.4 });
  }
  // the rain: its roar coming down the street (darker, further off), then rain everywhere, hitting every west face
  beds((t) => outC(t) * rainNear(t) * (1 - rainK(t)), { colour: 'brown', f: [['lp', 700], ['hp', 50]], vol: 0.15, am: 0.25, wr: 0.2 });
  beds((t) => outC(t) * Math.pow(rainNear(t), 1.5) * (1 - rainK(t)), { colour: 'pink', f: [['bp', 1500, 0.4], ['lp', 4000]], vol: 0.08, am: 0.3, wr: 0.3 });
  beds((t) => outC(t) * rainK(t), { colour: 'pink', f: [['hp', 350], ['lp', 7000]], vol: 0.1, am: 0.2, wr: 0.25 });
  beds((t) => outC(t) * rainK(t), { colour: 'brown', f: [['lp', 300], ['hp', 40]], vol: 0.06, am: 0.3, wr: 0.2 });
  beds((t) => outC(t) * rainK(t), { colour: 'white', f: [['bp', 5200, 0.7], ['lp', 11000]], vol: 0.022, am: 0.5, wr: 0.6 });
  // the drops drag the air along with them: a gust as the front goes past, then a steady wind east inside the rain
  beds((t) => outC(t) * Math.min(1, 4 * rainK(t) * (1 - rainK(t)) + 0.3 * rainK(t)), { colour: 'pink', f: [['bp', 650, 0.5], ['lp', 3200]], vol: 0.07, am: 0.7, wr: 0.3 });
  // 8:42: the rain falls out of the air and hits the ground, for the first time in 53 minutes; ~12 s, then it stops
  beds((t) => outC(t) * rainGround(t), { colour: 'pink', f: [['hp', 500], ['lp', 9000]], vol: 0.13, am: 0.25, wr: 0.3 });
  beds((t) => outC(t) * rainGround(t), { colour: 'white', f: [['bp', 4200, 0.6]], vol: 0.03, am: 0.5, wr: 0.8 });

  // ---- the car alarms: the pile's (set off as each car hits; the terrace hitting sets more off; 8:42, when the pile
  // drops, sets everything off), and far off all over town. Each one is a wave built once over the windows where it
  // is heard, shaped by how near the camera is (outside), or through the walls (inside)
  {
    const wave = (kind, a, b) => {
      const n = Math.ceil((b - a) * sr), y = new Float32Array(n); let ph = 0;
      for (let i = 0; i < n; i++) {
        const t = a + i / sr; let f, g = 1;
        if (kind === 'whoop') { const u = (t % 1.1) / 1.1; f = 620 + 880 * u; }
        else if (kind === 'beep') { f = 1250; g = (t % 0.5) < 0.3 ? 1 : 0; }
        else if (kind === 'slow') { f = 920; g = (t % 1.0) < 0.6 ? 1 : 0; }
        else if (kind === 'yelp') { const u = (t % 0.26) / 0.26; f = 900 + 800 * Math.sin(Math.PI * u); }
        else f = 900 + 350 * Math.sign(Math.sin(2 * Math.PI * 6 * t));
        ph += 2 * Math.PI * f / sr; y[i] = Math.tanh(2.5 * Math.sin(ph)) * 0.5 * g;
      }
      return y;
    };
    const run = (s0, s1, kind, pan, vol, place, lp, rm, wet) => {
      const on = (t) => { const s = S(t); return s < s0 ? 0 : Math.min(1, (s - s0) / 0.05) * (1 - gtEv(s, s1 - 1.5, s1)); };
      for (const [a, b] of wins((t) => on(t) * place(t), 0.05, 0.004)) {
        const y = wave(kind, a, b); GTX.bq(y, 'lp', lp, 0.7, sr); GTX.bq(y, 'hp', 350, 0.7, sr);
        const fiN = 0.05 * sr;
        for (let i = 0; i < y.length; i++) { const t = a + i / sr; y[i] *= on(t) * place(t) * Math.min(1, i / fiN, (y.length - i) / fiN); }
        K.put(y, a, { vol, pan, room: rm, wet });
      }
    };
    const pileOut = gtCurve((t) => (gtWhere(t) === 'out' ? gtNear(t, 283, 1.5, { k: 0.7 }).g : 0));
    const pileIn = gtCurve((t) => inC(t) * (1 - 0.6 * open(t)) * 0.12 + inC(t) * open(t) * 0.22);
    const farOut = gtCurve((t) => outC(t) * (1 + 2 * (gtShotAt(t).mode === 'town')));
    const AL = [[3.1, 96, 'whoop', -0.3], [4.4, 330, 'beep', 0.35], [5.8, 640, 'warble', -0.1], [7.6, 215, 'yelp', 0.5], [11.2, 905, 'slow', -0.55],
      [1625.2, 2160, 'whoop', 0.2], [1625.8, 1810, 'warble', -0.4], [1626.6, 2600, 'beep', 0.45],
      [3600.7, 1e9, 'whoop', -0.25], [3601.3, 1e9, 'beep', 0.4], [3602.2, 1e9, 'warble', 0.05], [3604.4, 1e9, 'yelp', -0.5]];
    for (const [s0, s1, kind, pan] of AL) {
      run(s0, s1, kind, pan, 0.11, pileOut, 2600, street, 0.6);
      run(s0, s1, kind, pan * 0.4, 0.11, pileIn, 750, street, 0.3);
    }
    for (const [s0, s1, kind, pan] of [[2.5, 1400, 'whoop', 0.7], [15, 2200, 'warble', -0.75], [40, 1300, 'slow', 0.2], [3601, 1e9, 'beep', -0.6], [3606, 1e9, 'whoop', 0.75]]) run(s0, s1, kind, pan, 0.012, farOut, 1200, town, 1.0);
  }

  // ---- the town in the first minutes: crashes in other streets, far off (a deep thud and its echo off the hills)
  {
    const boom = () => { const y = fx.arr(1.6), n = y.length, z = gtNoise(fx, n, 'brown'), f = r.range(38, 62); for (let i = 0; i < n; i++) { const u = i / sr; y[i] = (Math.sin(2 * Math.PI * f * u) * 0.8 + z[i] * 1.6) * Math.exp(-u / r.range(0.15, 0.35)) * Math.min(1, u / 0.004); } GTX.bq(y, 'lp', 420, 0.7, sr); return y; };
    for (let s = 0.7, k = 0; s < 150; k++, s += 0.6 + 0.05 * s * (0.4 + 1.2 * r.next())) {
      const w = gtWhen(s); if (!w || w.where === 'river') continue;
      const out = w.where === 'out';
      K.put(boom(), w.t, { vol: (out ? 0.05 : 0.03) * r.range(0.5, 1), norm: true, pan: r.range(-0.9, 0.9), lp: out ? undefined : 300, room: town, wet: 1.2 });
    }
  }
  // ---- dogs: one a few gardens away, barking on and off all hour (and at 8:42)
  {
    const bark = (p = 1) => { const y = fx.arr(0.35), m = Math.round(r.range(0.1, 0.16) * sr), z = gtNoise(fx, m, 'pink'), z2 = Float32Array.from(z); GTX.bq(z, 'bp', r.range(520, 700) * p, 2.5, sr); GTX.bq(z2, 'bp', 1400 * p, 3, sr); for (let i = 0; i < m; i++) { const e = Math.sin(Math.PI * i / m) * Math.min(1, i / (0.01 * sr)); y[i] = (z[i] + 0.4 * z2[i]) * e; } return y; };
    const spells = [[20, 9], [140, 6], [300, 5], [470, 7], [1632, 8], [3604, 14], [3618, 10]];   // [story s, barks]
    for (const [s0, nb] of spells) {
      const w = gtWhen(s0); if (!w || w.where === 'river') continue;
      let t = w.t;
      for (let k = 0; k < nb; k++) {
        const place = gtWhere(t); if (place === 'river' || t > END - 0.4) break;
        K.put(bark(), t, { vol: place === 'out' ? 0.03 : 0.01, norm: true, pan: -0.55, lp: place === 'out' ? undefined : 900, room: street, wet: 0.9 });
        t += k % 3 === 2 ? r.range(0.7, 1.1) : r.range(0.28, 0.42);
      }
    }
  }
  // ---- birds: in the first minutes, their alarm calls (a run of hard "chinks"); after 8:42, the robins singing again
  for (let t = 4; t < GT.tB; t += 2.5 + 5 * r.next()) {
    const s = S(t); if (s > 900 || gtWhere(t) !== 'out' || gtWhere(t + 0.8) !== 'out') continue;
    K.put(gtChirp(fx, { n: r.int(4, 8), f0: r.range(3600, 4600), gap: r.range(0.08, 0.12), nd: 0.022 }), t, { vol: 0.012 * (s < 120 ? 1 : 0.6), norm: true, pan: r.range(-0.8, 0.8), room: street, wet: 0.6 });
  }
  for (let t = GT.tB + 6.5; t < END - 1; t += 2.4 + 2.6 * r.next()) {
    const w = gtWhere(t); if (w === 'river') continue;
    K.put(gtRobinSong(fx, {}), t, { vol: w === 'out' ? 0.02 : 0.008, norm: true, pan: r.range(-0.8, 0.8), lp: w === 'out' ? undefined : 2600, room: street, wet: 0.5 });
  }
  // ---- after the rain: drips off the eaves, the gutters, the trees
  {
    const drip = () => { const d = r.range(0.04, 0.09), y = fx.arr(d + 0.02), n = Math.round(d * sr), f0 = r.range(900, 2400); let ph = 0; for (let i = 0; i < n; i++) { const u = i / n; ph += 2 * Math.PI * f0 * (1 + 0.9 * u) / sr; y[i] = Math.sin(ph) * Math.exp(-u * 5) * Math.min(1, i / 30); } return y; };
    const t0 = gtFilmAt(GTP.tBack + 10.5);
    for (let t = t0; t < END - 0.3; t += 0.08 + 0.35 * r.next()) {
      const w = gtWhere(t); if (w === 'river') continue;
      K.put(drip(), t, { vol: (w === 'out' ? 0.016 : 0.006) * r.range(0.4, 1), norm: true, pan: r.range(-0.9, 0.9), lp: w === 'out' ? undefined : 2000, room: street, wet: 0.5 });
    }
  }

  // ================================================================================================== the river
  {
    const spray = modes(['bend', 'spray'], 0.06), sp2 = modes(['spray'], 0.06);
    beds(rvC, { colour: 'brown', f: [['lp', 350], ['hp', 30]], vol: 0.12, am: 0.25, wr: 0.3 });
    beds(rvC, { colour: 'pink', f: [['hp', 300], ['lp', 4000]], vol: 0.075, am: 0.3, wr: 0.5 });
    beds((t) => rvC(t) * (0.35 + 0.4 * spray(t) + 0.25 * sp2(t)), { colour: 'white', f: [['hp', 2500], ['lp', 10000]], vol: 0.045, am: 0.4, wr: 0.6 });
  }
});
