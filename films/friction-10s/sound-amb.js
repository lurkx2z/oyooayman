/* =====================================================================
   SOUND · AMB — the places. A bed follows the picture: inside the house or out in the street, at real speed or
   slowed down (fzInsideAt, fzRate), with a short crossfade at each cut.
     inside, real speed     the kitchen's room tone, the fridge's hum, the street through the window
     outside, real speed    the street: distant traffic, a breeze in the trees, robins, the bus's diesel idling
                            (it stops when the bus goes over)
     slowed down            the same places stretched: darker, lower, the hum and the diesel an octave down, the
                            robins' songs slowed into low warbles
     after (s > 10)         the street once it has stopped: car alarms set off all along it, a dog, the wind
   ===================================================================== */

fzSound('amb', 'places', function (ctx, bus, K) {
  const { fx, sr } = K, END = FZ.end + 1.2, r = new RNG(4401);
  const room = K.verb('street', 1.6, { bright: 0.5, damp: 4, wet: 0.18 });
  // where the picture is, sampled once (smoothed over ±40 ms so the beds cross-fade at the cuts)
  const raw = (t) => { const sh = fzShotAt(t); return { inside: fzInsideAt(sh, t), real: fzRate(sh, t) >= 0.7, s: fzClock(sh, t) }; };
  const sm = (f) => fzCurve((t) => (f(raw(t - 0.04)) + f(raw(t)) + f(raw(t + 0.04))) / 3);
  const inR = sm((p) => (p.inside && p.real ? 1 : 0)), outR = sm((p) => (!p.inside && p.real ? 1 : 0));
  const inS = sm((p) => (p.inside && !p.real ? 1 : 0)), outS = sm((p) => (!p.inside && !p.real ? 1 : 0));
  const busOn = fzCurve((t) => (fzStoryAt(t) < FZP.tBack + 1.1 ? 1 : 0));
  const after = fzCurve((t) => (t > FZ_SHOTS.find((s) => s.mode === 'after').t0 - 0.05 ? 1 : 0));
  // the windows where a curve is on (merged, padded), so the beds are only built where they play
  const wins = (f, pad = 0.1) => {
    const out = []; let a = null;
    for (let t = 0; t < END; t += 0.02) { const on = f(t) > 0.001; if (on && a == null) a = t; if (!on && a != null) { out.push([Math.max(0, a - pad), t + pad]); a = null; } }
    if (a != null) out.push([Math.max(0, a - pad), END]);
    return out;
  };
  const beds = (f, o) => { for (const [a, b] of wins(f)) fzBed(K, a, b, Object.assign({}, o, { env: (u, t) => f(t) * (o.env ? o.env(u, t) : 1), fi: 0.04, fo: 0.04 })); };

  // ---- inside, real speed: the room, the fridge, the street through the glass
  beds(inR, { colour: 'pink', f: [['lp', 520], ['hp', 45]], vol: 0.06, am: 0.2, wr: 0.2 });
  beds(inR, { colour: 'brown', f: [['lp', 260], ['hp', 40]], vol: 0.05, am: 0.35, wr: 0.15 });                   // (the street outside, muffled)
  for (const [a, b] of wins(inR)) fzTone(K, a, b - a, 50, [[1, 0.5], [2, 1], [3, 0.35], [4, 0.2]], (u, t) => inR(a + t) * Math.min(1, t / 0.05, (b - a - t) / 0.05), { vol: 0.012, f: [['lp', 400]] });
  // ---- outside, real speed: traffic far off, a breeze, the bus idling
  beds(outR, { colour: 'pink', f: [['lp', 800], ['hp', 50]], vol: 0.085, am: 0.3, wr: 0.15 });
  beds(outR, { colour: 'white', f: [['bp', 3000, 0.5], ['lp', 8000]], vol: 0.022, am: 0.8, wr: 0.35 });
  for (const [a, b] of wins((t) => (outR(t) + 0.3 * inR(t)) * busOn(t))) {
    const y = fzDiesel(fx, b - a, { f: 11.5 }), pk = FZX.peak(y) || 1;
    for (let i = 0; i < y.length; i++) { const t = a + i / sr; y[i] *= (outR(t) + 0.3 * inR(t)) * busOn(t) * Math.min(1, i / (0.05 * sr)) / pk; }
    K.put(y, a, { vol: 0.05, pan: 0.3, room, wet: 0.3 });
  }
  // robins in the gardens (outside: clear; inside: through the glass)
  for (let t = 0.3; t < END; t += 1.2 + 2.4 * r.next()) {
    const o = outR(t), i = inR(t); if (o + i < 0.3) continue;
    K.put(fzRobinSong(fx, {}), t, { vol: (o ? 0.022 : 0.008) * (0.6 + 0.4 * r.next()), norm: true, pan: r.range(-0.8, 0.8), room, wet: 0.5, lp: o ? undefined : 2500 });
  }

  // ---- slowed down: the same places, stretched
  beds(inS, { colour: 'brown', f: [['lp', 220], ['hp', 28]], vol: 0.06, am: 0.4, wr: 0.12 });
  beds(outS, { colour: 'brown', f: [['lp', 340], ['hp', 28]], vol: 0.075, am: 0.4, wr: 0.12 });
  beds(outS, { colour: 'pink', f: [['bp', 900, 0.4], ['lp', 1600]], vol: 0.018, am: 0.6, wr: 0.08 });
  for (const [a, b] of wins(inS)) fzTone(K, a, b - a, 25, [[1, 0.6], [2, 1], [3, 0.3]], (u, t) => inS(a + t) * Math.min(1, t / 0.08, (b - a - t) / 0.08), { vol: 0.012, f: [['lp', 220]] });
  for (const [a, b] of wins((t) => outS(t) * busOn(t))) {
    const y = fzDiesel(fx, b - a, { f: 5.2, low: 0.5 }), pk = FZX.peak(y) || 1;
    for (let i = 0; i < y.length; i++) { const t = a + i / sr; y[i] *= outS(t) * busOn(t) * Math.min(1, i / (0.08 * sr)) / pk; }
    K.put(y, a, { vol: 0.04, pan: 0.3, room, wet: 0.5 });
  }
  for (let t = 0.5; t < END; t += 3.0 + 4.0 * r.next()) { if (outS(t) < 0.5 || outS(t + 1.5) < 0.5) continue; K.put(fzRobinSong(fx, {}), t, { vol: 0.012, norm: true, pan: r.range(-0.7, 0.7), room, wet: 0.8, rate: 0.42 }); }

  // ---- after: car alarms all along the street, a dog, the wind
  {
    const tA = FZ_SHOTS.find((s) => s.mode === 'after').t0, alarms = [[0.2, -0.6, 0.3, 'whoop'], [0.9, 0.5, 0.22, 'beep'], [1.6, -0.15, 0.16, 'warble'], [3.4, 0.75, 0.12, 'beep']];
    for (const [dt, pan, v, kind] of alarms) {
      const t0 = tA + dt, d = END - t0, n = Math.ceil(d * sr), y = new Float32Array(n); let ph = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr; let f, a = 1;
        if (kind === 'whoop') { const u = (t % 1.1) / 1.1; f = 600 + 900 * u; }
        else if (kind === 'beep') { f = 1250; a = (t % 0.5) < 0.3 ? 1 : 0; }
        else f = 900 + 350 * Math.sign(Math.sin(2 * Math.PI * 6 * t));
        ph += 2 * Math.PI * f / sr; y[i] = Math.tanh(2.5 * Math.sin(ph)) * 0.5 * a * Math.min(1, t / 0.02);
      }
      FZX.bq(y, 'lp', 2400 - 900 * (1 - v / 0.3), 0.7, sr); FZX.bq(y, 'hp', 350, 0.7, sr);
      // (quieter when the camera is down at the gutter with the phone)
      for (let i = 0; i < n; i++) { const t = t0 + i / sr; y[i] *= after(t) * (fzShotAt(t).mode === 'phone3' ? 0.55 : 1); }
      K.put(y, t0, { vol: v * 0.07, norm: true, pan, room, wet: 1 });
    }
    beds(after, { colour: 'pink', f: [['lp', 700], ['hp', 60]], vol: 0.06, am: 0.5, wr: 0.2 });
    for (let t = tA + 2.3; t < END - 0.5; t += 1.3 + 2.2 * r.next()) { const y = fx.arr(0.4), m = Math.round(r.range(0.11, 0.17) * sr), z = fzNoise(fx, m, 'pink'); FZX.bq(z, 'bp', r.range(520, 720), 2.5, sr); for (let i = 0; i < m; i++) y[i] = z[i] * Math.sin(Math.PI * i / m); K.put(y, t, { vol: 0.035, norm: true, pan: -0.6, room, wet: 1 }); }
  }
});
