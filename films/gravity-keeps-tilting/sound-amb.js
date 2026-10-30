/* =====================================================================
   SOUND · AMB — the places. A bed follows the picture (gkAt: your room, or outside), with a short crossfade at each
   cut. The air keeps its old down, so there is no gale: the park sounds like a park on a Saturday afternoon, then less
   and less like one.
     your room   its room tone; the football on the TV until the TV falls; the park through the window (birds, a city
                 Saturday far off), later the car alarms; the building's creaks are in the effects
     outside     the air and the leaves; the birds until they all take off (alarm calls, then nothing); the town's
                 traffic stopping; crashes in other streets in the first two minutes; the pond spilling over its bank
                 and the water running east across the grass; the car alarms of the pile at the church (each set off
                 as its car hits, and carried up into the sky with it: quieter and duller as it goes); alarms all over
                 town, far off; a dog
   ===================================================================== */

gkSound('amb', 'places', function (ctx, bus, K) {
  const { fx, sr } = K, END = GK.end + 1.2, r = new RNG(4401), S = gkStoryAt, f = gkFilmAt;
  const street = K.verb('street', 1.8, { bright: 0.5, damp: 3.5, wet: 0.22 });
  const town = K.verb('town', 3.2, { bright: 0.35, damp: 2.2, shape: 1.6, pre: 0.04, wet: 0.5 });
  const inC = gkCurve(gkAt('in')), outC = gkCurve(gkAt('out'));
  // the windows where a curve is on (merged, padded), so the beds are only built where they play
  const wins = (fn, pad = 0.1, th = 0.001) => {
    const out = []; let a = null;
    for (let t = -1; t < END; t += 0.02) { const on = fn(t) > th; if (on && a == null) a = t; if (!on && a != null) { out.push([Math.max(-1, a - pad), t + pad]); a = null; } }
    if (a != null) out.push([Math.max(-1, a - pad), END]);
    return out;
  };
  const beds = (fn, o) => { for (const [a, b] of wins(fn)) gkBed(K, Math.max(0, a), b, Object.assign({}, o, { env: (u, t) => fn(t) * (o.env ? o.env(u, t) : 1), fi: 0.04, fo: 0.04 })); };
  const near = (P, o) => { const g = gkCurve((t) => gkNear(t, P, o).g, 40); return g; };

  // ================================================================================================ your room
  beds(inC, { colour: 'pink', f: [['lp', 480], ['hp', 45]], vol: 0.04, am: 0.2, wr: 0.2 });                                     // room tone
  beds((t) => inC(t) * (1 - gkEv(S(t), 20, 40)), { colour: 'pink', f: [['lp', 420], ['hp', 60]], vol: 0.04, am: 0.4, wr: 0.12 });   // the city, far off, through the glass
  // the TV: half-time on a Saturday (a crowd's murmur and a commentator's level through a small speaker) until it falls
  {
    const tv = (t) => inC(t) * (S(t) < GK_LAMPS.tv ? 1 : 0);
    beds(tv, { colour: 'pink', f: [['bp', 900, 0.8], ['lp', 3200], ['hp', 250]], vol: 0.03, am: 0.5, wr: 0.4 });
    beds(tv, { colour: 'white', f: [['bp', 1800, 2.5]], vol: 0.006, am: 0.9, wr: 3.5 });
  }
  // the park through the window: birds, before they go
  for (let t = 0.2; t < f(24); t += 1.6 + 2 * r.next()) if (gkWhere(t) === 'in') K.put(gkRobinSong(fx, { n: r.int(5, 9) }), t, { vol: 0.01, norm: true, pan: r.range(-0.6, 0.6), lp: 2600, room: street, wet: 0.4 });

  // ================================================================================================= outside
  beds(outC, { colour: 'pink', f: [['lp', 700], ['hp', 50]], vol: 0.05, am: 0.35, wr: 0.15 });                                  // the air
  beds((t) => outC(t) * (1 - 0.6 * gkEv(S(t), 60, 200)), { colour: 'white', f: [['bp', 3200, 0.5], ['lp', 8000]], vol: 0.014, am: 0.8, wr: 0.35 });   // leaves (fewer and fewer on the trees)
  beds((t) => outC(t) * (1 - gkEv(S(t), 15, 35)), { colour: 'pink', f: [['lp', 380], ['hp', 50]], vol: 0.06, am: 0.4, wr: 0.12 });    // the town's traffic, stopping
  // birds: singing, then alarm calls as the ground tips (they all take off by ~25°), then nothing
  for (let t = 0.1; t < f(24); t += 1.2 + 1.8 * r.next()) if (gkWhere(t) === 'out') K.put(gkRobinSong(fx, {}), t, { vol: 0.02, norm: true, pan: r.range(-0.8, 0.8), room: street, wet: 0.5 });
  for (let t = f(12); t < f(70); t += 1.5 + 3 * r.next()) if (gkWhere(t) === 'out') K.put(gkChirp(fx, { n: r.int(4, 8), f0: r.range(3600, 4600), gap: r.range(0.08, 0.12), nd: 0.022 }), t, { vol: 0.014 * (1 - gkEv(S(t), 40, 70)), norm: true, pan: r.range(-0.8, 0.8), room: street, wet: 0.6 });
  // the pond spilling over its east bank (a weir's rush), and the sheet of water running east to the railings
  {
    const P = [GK_ST.pond.x + GK_ST.pond.rx, 0, GK_ST.pond.z], spill = near(P, { k: 0.8 }), sheet = near([66, 0, -50], { k: 0.8 });
    beds((t) => spill(t) * gkEv(S(t), 1, 2.5) * GK_POND.left(S(t)) ** 0.5, { colour: 'pink', f: [['bp', 1100, 0.5], ['lp', 6000]], vol: 0.09, am: 0.35, wr: 0.6 });
    beds((t) => sheet(t) * gkEv(S(t), 6, 20) * (1 - gkEv(S(t), 80, 100)), { colour: 'pink', f: [['bp', 700, 0.6], ['lp', 4000]], vol: 0.06, am: 0.4, wr: 0.5 });
  }
  // the town in the first two minutes: crashes in other streets, far off (a deep thud and its echo)
  {
    const boom = () => { const y = fx.arr(1.6), n = y.length, z = gkNoise(fx, n, 'brown'), fq = r.range(38, 62); for (let i = 0; i < n; i++) { const u = i / sr; y[i] = (Math.sin(2 * Math.PI * fq * u) * 0.8 + z[i] * 1.6) * Math.exp(-u / r.range(0.15, 0.35)) * Math.min(1, u / 0.004); } GKX.bq(y, 'lp', 500, 0.7, sr); return y; };
    for (let s = 21, k = 0; s < 140; k++, s += 1.2 + 0.08 * s * (0.4 + 1.2 * r.next())) {
      const t = f(s), out = gkWhere(t) === 'out';
      K.put(boom(), t, { vol: (out ? 0.045 : 0.025) * r.range(0.5, 1), norm: true, pan: r.range(-0.9, 0.9), lp: out ? undefined : 300, room: town, wet: 1.2 });
    }
  }
  // the car alarms: each set off as its car hits the church, and carried up with it (the camera's distance to the car)
  {
    const wave = (kind, a, b) => {
      const n = Math.ceil((b - a) * sr), y = new Float32Array(n); let ph = 0;
      for (let i = 0; i < n; i++) {
        const t = a + i / sr; let fq, g = 1;
        if (kind === 'whoop') { const u = (t % 1.1) / 1.1; fq = 620 + 880 * u; }
        else if (kind === 'beep') { fq = 1250; g = (t % 0.5) < 0.3 ? 1 : 0; }
        else if (kind === 'slow') { fq = 920; g = (t % 1.0) < 0.6 ? 1 : 0; }
        else if (kind === 'yelp') { const u = (t % 0.26) / 0.26; fq = 900 + 800 * Math.sin(Math.PI * u); }
        else fq = 900 + 350 * Math.sign(Math.sin(2 * Math.PI * 6 * t));
        ph += 2 * Math.PI * fq / sr; y[i] = Math.tanh(2.5 * Math.sin(ph)) * 0.5 * g;
      }
      return y;
    };
    const run = (s0, kind, pan, vol, place, lp, rm, wet) => {
      const on = (t) => (S(t) < s0 ? 0 : Math.min(1, (S(t) - s0) / 0.05));
      for (const [a, b] of wins((t) => on(t) * place(t), 0.05, 0.003)) {
        const y = wave(kind, a, b); GKX.bq(y, 'lp', lp, 0.7, sr); GKX.bq(y, 'hp', 350, 0.7, sr);
        const fiN = 0.05 * sr;
        for (let i = 0; i < y.length; i++) { const t = a + i / sr; y[i] *= on(t) * place(t) * Math.min(1, i / fiN, (y.length - i) / fiN); }
        K.put(y, a, { vol, pan, room: rm, wet });
      }
    };
    const AL = [['car3', 'whoop', -0.3], ['car5', 'beep', 0.35], ['car4', 'warble', -0.1], ['car7', 'yelp', 0.5], ['car8', 'slow', -0.5]];
    for (const [id, kind, pan] of AL) {
      const hit = GK_SIM.street.events.find((e) => e[1] === id && e[2] > 5); if (!hit) continue;
      const P = [0, 0, 0], Q = [0, 0, 0, 1];
      const g = gkCurve((t) => { const s = S(t); if (s < hit[0]) return 0; gkSimPose('street', id, s, P, Q); return gkNear(t, P, { k: 0.85 }).g; }, 40);
      run(hit[0], kind, pan, 0.1, g, 2600, street, 0.5);
    }
    // far off, all over town
    for (const [s0, kind, pan] of [[28, 'whoop', 0.7], [44, 'warble', -0.75], [70, 'slow', 0.2]]) run(s0, kind, pan, 0.01, (t) => outC(t) + 0.3 * inC(t), 1200, town, 1.0);
  }
  // a dog a few gardens away, barking in spells
  {
    const bark = (p = 1) => { const y = fx.arr(0.35), m = Math.round(r.range(0.1, 0.16) * sr), z = gkNoise(fx, m, 'pink'), z2 = Float32Array.from(z); GKX.bq(z, 'bp', r.range(520, 700) * p, 2.5, sr); GKX.bq(z2, 'bp', 1400 * p, 3, sr); for (let i = 0; i < m; i++) { const u = i / m; y[i] = (z[i] + 0.5 * z2[i]) * Math.sin(Math.PI * u) ** 0.6; } return y; };
    for (const [s0, nb] of [[18, 9], [52, 6], [118, 5], [205, 7], [300, 6], [362, 8]]) {
      let t = f(s0);
      for (let k = 0; k < nb && t < END - 0.4; k++) {
        const out = gkWhere(t) === 'out';
        K.put(bark(), t, { vol: out ? 0.022 : 0.008, norm: true, pan: -0.55, lp: out ? undefined : 900, room: street, wet: 0.9 });
        t += k % 3 === 2 ? r.range(0.7, 1.1) : r.range(0.28, 0.42);
      }
    }
  }
});
