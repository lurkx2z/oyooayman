/* =====================================================================
   SOUND · AMBIENCE — the places (each bed follows the shots that are there, crossfading at the cuts):
     street   the Embarcadero on a Saturday morning: traffic, the bay lapping under the café, gulls, a far ferry horn;
              as the shaking grows, the city's own noise thins out (the alarms, the crowd, the rumble are effects)
     cabin    inside the helicopter, headsets on: the cabin's muffled roar (the rotor and the turbine are effects)
     air      outside the helicopter, over the bay: wind
     world    the other cities: a far wind by day, a low city hum by night
     space    almost nothing: a very low hum (a film needs a floor)
   The beds sit about 10 dB under the music (the owner's rule), measured stem by stem. No breathing anywhere.
   ===================================================================== */

eqSound('amb', 'places', function (ctx, bus, K) {
  const fx = K.fx, sr = fx.sr, END = EQ.end + 1;
  const putLR = ([L, R], t, o = {}) => K.putLR(L, R, t, o), put = (x, t, o = {}) => K.put(x, t, o), r = new RNG(CONFIG.seed + 515);
  const P = { street: eqCurve(eqPlaceAt('street')), cabin: eqCurve(eqPlaceAt('cabin')), air: eqCurve(eqPlaceAt('air')), world: eqCurve(eqPlaceAt('world')), space: eqCurve(eqPlaceAt('space')) };
  const span = (f) => { let a = null, b = null; for (const p of eqPlaces()) if (p.where === f) { a = a == null ? p.t0 : Math.min(a, p.t0); b = b == null ? p.t1 : Math.max(b, p.t1); } return a == null ? null : [Math.max(0, a - 0.5), Math.min(END, b + 0.5)]; };
  const lift = EQ_HT.lift + EQ.tick0, alarms = EQ_WFT.alarms + EQ.tick0;
  // ---- the street: traffic a block away, tyres, the bay lapping, gulls, a ferry horn; it thins as the city fails
  { const [a, b] = span('street'), calm = (t) => 1 - 0.6 * eqEv(t, alarms - 1, alarms + 4);
    putLR(eqBed(fx, a, b, 'brown', 35, 420, (t) => 0.8 * P.street(t) * calm(t), { wobble: 0.15, depth: 0.25 }), a, { vol: 0.5 });
    putLR(eqBed(fx, a, b, 'pink', 500, 3500, (t) => 0.1 * P.street(t) * calm(t), { wobble: 0.4, depth: 0.5 }), a, { vol: 0.5 });
    // the bay lapping at the pilings under the café (slow swells of filtered noise)
    putLR(eqBed(fx, a, b, 'pink', 180, 1400, (t) => 0.16 * P.street(t) * (0.6 + 0.4 * Math.sin(t * 1.3) * Math.sin(t * 0.47)), { wobble: 0.9, depth: 0.6 }), a, { vol: 0.5 });
    // cars passing (a soft whoosh now and then), until the street stops
    for (let t = a + 1.2; t < Math.min(b, EQ_WFT.alarms + EQ.tick0); t += r.range(3.5, 7.5)) putLR(eqWhoosh(fx, r.range(1.8, 2.8), 150, 700, 200, { peak: 0.5, p0: r.chance(0.5) ? -0.7 : 0.7, p1: r.chance(0.5) ? 0.7 : -0.7, q: 0.8 }), t, { vol: 0.08 * P.street(t + 1) });
    // gulls: a falling cry, two or three times (until the birds leave)
    const birds = eqW('birds') - 2;
    for (let t = a + 2; t < birds; t += r.range(5, 11)) {
      const n = r.int(2, 3), f0 = r.range(1400, 1900);
      for (let k = 0; k < n; k++) { const d = r.range(0.25, 0.4), c = fx.arr(d); let ph = 0; for (let i = 0; i < c.length; i++) { const u = i / c.length, f = f0 * (1.15 - 0.35 * u); ph += 2 * Math.PI * f / sr; c[i] = (Math.sin(ph) + 0.35 * Math.sin(2 * ph) + 0.2 * Math.sin(3 * ph)) * Math.sin(Math.PI * Math.pow(u, 0.6)); } EQX.bq(c, 'bp', f0 * 1.3, 0.9, sr); put(c, t + k * 0.42, { vol: 0.05 * P.street(t), pan: r.range(-0.8, 0.8) }); }
    }
    // a ferry's horn across the bay, once
    { const t = 31.5, n = Math.ceil(2.6 * sr), y = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const tt = i / sr; ph += 2 * Math.PI * 110 / sr; y[i] = (Math.sin(ph) + 0.6 * Math.sin(2 * ph) + 0.4 * Math.sin(3 * ph) + 0.25 * Math.sin(5 * ph)) * Math.min(1, tt / 0.15, (n / sr - tt) / 0.6); } EQX.bq(y, 'lp', 900, 0.7, sr); put(y, t, { vol: 0.035, pan: 0.5, room: K.verb('bay', 3.5, { bright: 0.3, damp: 2, wet: 0.5, seed: 9 }), wet: 0.8 }); }
  }
  // ---- the cabin: a muffled roar (headsets on)
  { const sp = span('cabin'); if (sp) { const [a, b] = sp;
    putLR(eqBed(fx, a, b, 'brown', 30, 300, (t) => 0.55 * P.cabin(t) * (t < lift ? 0.4 + 0.6 * eqEv(t, eqTick(4), lift) : 1), { wobble: 0.3, depth: 0.2 }), a, { vol: 0.5 });
    putLR(eqBed(fx, a, b, 'pink', 300, 1600, (t) => 0.08 * P.cabin(t) * (t < lift ? 0.3 : 1), { wobble: 0.6, depth: 0.3 }), a, { vol: 0.5 }); } }
  // ---- the air: wind over the bay
  { const sp = span('air'); if (sp) { const [a, b] = sp; putLR(eqBed(fx, a, b, 'pink', 120, 2200, (t) => 0.32 * P.air(t), { wobble: 1.1, depth: 0.45 }), a, { vol: 0.5 }); } }
  // ---- the other cities: a far wind by day (Los Angeles to Seattle), a low hum by night (Tokyo to Istanbul)
  { const sp = span('world'); if (sp) { const [a, b] = sp, night = eqCurve((t) => eqEv(t, eqShotOf('tokyo').t0 - 0.05, eqShotOf('tokyo').t0 + 0.05) * (1 - eqEv(t, eqShotOf('dozens').t0 - 0.05, eqShotOf('dozens').t0 + 0.05)));
    putLR(eqBed(fx, a, b, 'pink', 150, 2000, (t) => 0.22 * P.world(t) * (1 - night(t)), { wobble: 0.9, depth: 0.45 }), a, { vol: 0.5 });
    putLR(eqBed(fx, a, b, 'brown', 40, 500, (t) => 0.5 * P.world(t) * (0.4 + 0.6 * night(t)), { wobble: 0.2, depth: 0.3 }), a, { vol: 0.5 }); } }
  // ---- space: a very low hum and a breath of air high up
  { const sp = span('space'); if (sp) { const [a, b] = sp;
    const n = Math.ceil((b - a) * sr), L = new Float32Array(n), R = new Float32Array(n); let p1 = 0, p2 = 0;
    for (let i = 0; i < n; i++) { const t = a + i / sr, lv = P.space(t) * 0.1; p1 += 2 * Math.PI * 55 / sr; p2 += 2 * Math.PI * 82.6 / sr; L[i] = (Math.sin(p1) + 0.4 * Math.sin(p2)) * lv; R[i] = (Math.sin(p1 + 0.4) + 0.4 * Math.sin(p2 + 0.9)) * lv; }
    putLR([L, R], a, { vol: 0.5 });
    putLR(eqBed(fx, a, b, 'pink', 1500, 7000, (t) => 0.04 * P.space(t), { wobble: 0.3, depth: 0.5 }), a, { vol: 0.5 }); } }
});
