/* =====================================================================
   SOUND · AMBIENCE — the places (each bed follows the shots that are there, crossfading at the cuts):
     street   your side street in Brooklyn Heights on a Monday morning: traffic a block away, a bus idling, sparrows, a far horn;
              after the boom the street is rattled (a low hum of voices, the alarms are effects)
     fast     the wind of your own wake, over New York
     sky      the thin wind of the high air, fading to nothing as you leave it
     boston   the Esplanade: the river, the wind in the bare trees, a few birds
     space    nothing at all, almost: a very low hum (a film needs a floor)
     home     the city in the evening; the posters' street; the quiet street of the future
     deep     a vast, slow, airy hum
   The beds sit about 10 dB under the music (the owner's rule), measured stem by stem.
   ===================================================================== */

twSound('amb', 'places', function (ctx, bus, K) {
  const fx = K.fx, sr = fx.sr, END = TW.end + 1;
  const putLR = ([L, R], t, o = {}) => K.putLR(L, R, t, o), put = (x, t, o = {}) => K.put(x, t, o), r = new RNG(CONFIG.seed + 515);
  const P = { street: twCurve(twPlaceAt('street')), fast: twCurve(twPlaceAt('fast')), sky: twCurve(twPlaceAt('sky')), boston: twCurve(twPlaceAt('boston')),
    space: twCurve(twPlaceAt('space')), home: twCurve(twPlaceAt('home')), deep: twCurve(twPlaceAt('deep')) };
  const span = (f) => { let a = null, b = null; for (const p of twPlaces()) if (p.where === f) { a = a == null ? p.t0 : Math.min(a, p.t0); b = b == null ? p.t1 : Math.max(b, p.t1); } return [Math.max(-1, a - 0.5), Math.min(END, b + 0.5)]; };
  // ---- the street: traffic rumble a block away, a hiss of tyres, the bus idling while it's there
  { const [a, b] = span('street');
    putLR(twBed(fx, a, b, 'brown', 35, 420, (t) => 0.9 * P.street(t), { wobble: 0.15, depth: 0.25 }), a, { vol: 0.5 });
    putLR(twBed(fx, a, b, 'pink', 500, 3500, (t) => 0.12 * P.street(t), { wobble: 0.4, depth: 0.5 }), a, { vol: 0.5 });
    // cars passing on the avenue (a soft whoosh now and then)
    for (let t = a + 1.2; t < twShotOf('glass').t0; t += r.range(3.5, 7.5)) putLR(twWhoosh(fx, r.range(1.8, 2.8), 150, 700, 200, { peak: 0.5, p0: r.chance(0.5) ? -0.7 : 0.7, p1: r.chance(0.5) ? 0.7 : -0.7, q: 0.8 }), t, { vol: 0.09 * P.street(t + 1) });
    // sparrows (short chirps) and a far horn, until the boom
    const tb = TW_BOOM.t;
    for (let t = a + 0.6; t < tb - 0.5; t += r.range(0.9, 3.2)) {
      const f = r.range(3200, 4800), n = r.int(2, 4);
      for (let k = 0; k < n; k++) { const c = fx.arr(0.07); let ph = 0; for (let i = 0; i < c.length; i++) { const u = i / c.length; ph += 2 * Math.PI * f * (1 + 0.25 * Math.sin(u * 3.1)) / sr; c[i] = Math.sin(ph) * Math.sin(Math.PI * u); } put(c, t + k * 0.09, { vol: 0.05 * P.street(t), pan: r.range(-0.8, 0.8) }); }
    }
    for (let t = a + 8; t < tb - 2; t += r.range(14, 22)) put(fx.beep(r.chance(0.5) ? 392 : 349, r.range(0.25, 0.5)), t, { vol: 0.03 * P.street(t), pan: r.range(-0.6, 0.6), lp: 1200 });
    // the bus idling at the stop (D3 to E4)
    { const ba = twShotOf('busArrive').t0 + 0.6, bb = twShotOf('doorway').t0;
      const n = Math.ceil((bb - ba) * sr), y = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / sr; ph += 2 * Math.PI * 31 / sr; y[i] = (Math.sin(ph) + 0.5 * Math.sin(2 * ph) + 0.3 * Math.sin(3.02 * ph)) * Math.min(1, t / 0.8, (n / sr - t) / 0.8); }
      TWX.bq(y, 'lp', 300, 0.7, sr); put(y, ba, { vol: 0.12, pan: 0.3 }); }
    // after the boom: the street holds its breath, then voices (a murmur), until we leave
    { const t0 = TW_BOOM.t + 2.5, t1 = b; putLR(twBed(fx, t0, t1, 'pink', 250, 1800, (t) => 0.22 * twEv(t, t0, t0 + 2) * P.street(t), { wobble: 3, depth: 0.6 }), t0, { vol: 0.5 }); } }
  // ---- fast over New York: the wind of your wake
  { const [a, b] = span('fast'); putLR(twBed(fx, a, b, 'pink', 90, 2200, (t) => 0.55 * P.fast(t), { wobble: 1.4, depth: 0.45 }), a, { vol: 0.5 }); }
  // ---- the sky: high thin wind, then nothing
  { const [a, b] = span('sky'), s20 = TW_T[20]; putLR(twBed(fx, a, b, 'pink', 140, 1800, (t) => 0.5 * P.sky(t) * (1 - 0.95 * twEv(t, s20 - 2, s20 + 1.5)), { wobble: 1.0, depth: 0.4 }), a, { vol: 0.5 }); }
  // ---- Boston: the river lapping, the wind in bare trees, a few birds
  { const [a, b] = span('boston');
    putLR(twBed(fx, a, b, 'pink', 200, 1400, (t) => 0.3 * P.boston(t), { wobble: 0.8, depth: 0.5 }), a, { vol: 0.5 });
    putLR(twBed(fx, a, b, 'brown', 40, 300, (t) => 0.6 * P.boston(t), { wobble: 0.1 }), a, { vol: 0.5 });
    for (let t = a + 0.4; t < b - 0.5; t += r.range(0.8, 2.0)) { const f = r.range(2600, 3800), c = fx.arr(0.12); let ph = 0; for (let i = 0; i < c.length; i++) { const u = i / c.length; ph += 2 * Math.PI * f * (1 - 0.2 * u) / sr; c[i] = Math.sin(ph) * Math.sin(Math.PI * u); } put(c, t, { vol: 0.04, pan: r.range(-0.8, 0.8) }); } }
  // ---- space: a very low hum (felt, barely heard), a breath of air high up (the floor of the mix)
  { const [a, b] = span('space');
    const n = Math.ceil((b - a) * sr), L = new Float32Array(n), R = new Float32Array(n); let p1 = 0, p2 = 0;
    for (let i = 0; i < n; i++) { const t = a + i / sr, lv = P.space(t) * 0.12; p1 += 2 * Math.PI * 55 / sr; p2 += 2 * Math.PI * 82.6 / sr; L[i] = (Math.sin(p1) + 0.4 * Math.sin(p2)) * lv; R[i] = (Math.sin(p1 + 0.4) + 0.4 * Math.sin(p2 + 0.9)) * lv; }
    putLR([L, R], a, { vol: 0.5 });
    putLR(twBed(fx, a, b, 'pink', 1500, 7000, (t) => 0.05 * P.space(t), { wobble: 0.3, depth: 0.5 }), a, { vol: 0.5 }); }
  // ---- home, later: the evening city (traffic, far); the posters' street (wind); the future street (quiet, birds)
  { const [a, b] = span('home');
    putLR(twBed(fx, a, b, 'brown', 35, 400, (t) => 0.6 * P.home(t), { wobble: 0.2 }), a, { vol: 0.5 });
    putLR(twBed(fx, a, b, 'pink', 300, 2500, (t) => 0.12 * P.home(t), { wobble: 1.2, depth: 0.6 }), a, { vol: 0.5 }); }
  // ---- the deep: a vast slow airy hum
  { const [a, b] = span('deep');
    putLR(twBed(fx, a, b, 'pink', 60, 600, (t) => 0.22 * P.deep(t), { wobble: 0.12, depth: 0.5 }), a, { vol: 0.5 });
    putLR(twBed(fx, a, b, 'pink', 2000, 8000, (t) => 0.035 * P.deep(t), { wobble: 0.25, depth: 0.6 }), a, { vol: 0.5 }); }
});
