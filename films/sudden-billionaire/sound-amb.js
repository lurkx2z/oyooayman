/* =====================================================================
   SOUND · AMBIENCE — each place's air, cut with the picture (sbPlace: a short crossfade at each cut):
     the car at night   rain on the roof and the glass, the wipers (the same 2.6 s cycle as the picture), the engine,
                        tyres on a wet road; by day, the engine, the tyres and the town through the glass
     the flat           room tone, the fridge, the town through the window (night: thinner; 3 am: almost nothing);
                        Chuck Feeney's flat by day: a quieter room and the street below
     the house          a big, empty, hard room (a long tail on everything); morning birds through the glass; the
                        terrace at dusk (wind, the pool, the city); the terrace at night (crickets, the far city); the
                        garage's strip lights; the gate (outside: birds, the road)
     the streets        your old street (birds, a far road, a dog); downtown (traffic, people, a bus); the canal
                        (water, bicycles, gulls)
     the lab            air conditioning, a fluorescent hum; the boardroom high up (wind on the glass)
     the marina         water at the hull, gulls, halyards, a far boat
   ===================================================================== */

// the windows of film time where pred(shot) holds (consecutive shots merged), padded by pad
function sbWins(pred, pad = 0.3) {
  const out = [];
  for (const s of SB_SHOTS) {
    if (!pred(s)) continue;
    const a = Math.max(0, s.t0 - pad), b = Math.min(s.t1, SB.end + 1.5) + pad;
    if (out.length && a <= out[out.length - 1][1]) out[out.length - 1][1] = Math.max(out[out.length - 1][1], b); else out.push([a, b]);
  }
  return out;
}
// the wipers' clock (car.js: a P = 2.6 s cycle; up over S = 0.62 s, back over S, rest)
const SB_WIPE = { P: 2.6, S: 0.62 };

sbSound('amb', 'places', function (ctx, bus, K) {
  const { fx, sr, r } = K;
  const is = (set, modes) => (s) => s.set === set && (!modes || modes.includes(s.mode));
  const PR = {
    carN: is('car', ['cold', 'point', 'again', 'question']), carD: is('car', ['drive', 'nostop']),
    flatN: is('flat', ['title', 'flat', 'draw', 'balls', 'won', 'scale', 'promise']), flatD: is('flat', ['mum', 'out', 'who', 'trust']),
    flat3: is('flat', ['interest']), feeney: is('flat', ['feeney']),
    houseIn: is('house', ['house', 'views', 'years', 'pledge']), morning: is('house', ['six', 'brick']), garage: is('house', ['garage', 'note']),
    dusk: is('house', ['enough']), night: is('house', ['compare']), gate: is('house', ['wall']),
    old: is('street', ['old']), town: is('street', ['walk', 'glass', 'glass2']), canal: is('street', ['letters']),
    lab: is('lab', ['dunn', 'cookies', 'cookie2', 'game', 'game2', 'candy', 'real']), hallS: is('lab', ['scott']), board: is('lab', ['boss']), sea: is('sea'),
  };
  const P = {}; for (const k in PR) P[k] = sbCurve(sbPlace(PR[k]));
  const W = {}; for (const k in PR) W[k] = sbWins(PR[k]);
  const bed = (key, o) => { for (const [a, b] of W[key]) sbBed(K, a, b, Object.assign({ fi: 0.02, fo: 0.02 }, o, { env: (u, t) => P[key](t) * (o.env ? o.env(u, t) : 1) })); };
  const tone = (key, f, harm, o, lvl) => { for (const [a, b] of W[key]) sbTone(K, a, b - a, f, harm, (u, tt) => P[key](a + tt) * (lvl ? lvl(a + tt) : 1), o); };
  const room = K.verb('room', 0.9, { bright: 0.45, damp: 3.6, wet: 0.4, seed: 21, early: [[0.008, 0.5], [0.015, 0.35], [0.024, 0.25]] });
  const out = K.verb('out', 2.4, { bright: 0.4, damp: 2.6, wet: 0.5, seed: 29, pre: 0.02 });
  const chirps = (key, t0, t1, rate, lvl, o = {}) => { for (let t = t0 + r.range(0, 0.5); t < t1; t += r.range(rate * 0.4, rate * 1.6)) { const k = P[key](t); if (k < 0.05) continue; K.put(sbChirp(fx, { f0: r.range(2500, 4300) }), t, { vol: lvl * k * r.range(0.4, 1), norm: true, pan: r.range(-0.8, 0.8), lp: o.lp || 6000, room: out, wet: 0.5 }); } };
  const chatter = (key, t0, t1, rate, lvl, lp = 1800) => {
    for (let t = t0 + r.range(0, 0.4); t < t1; t += r.range(rate * 0.5, rate * 1.5)) {
      const k = P[key](t); if (k < 0.05) continue;
      const woman = r.chance(0.5), y = sbVoice(fx, sbChatter(r, r.int(2, 5)), { f0: (woman ? 205 : 115) * r.range(0.85, 1.2), fs: woman ? 1.15 : 1, rate: r.range(0.9, 1.15) });
      SBX.bq(y, 'lp', lp, 0.7, sr); K.put(y, t, { vol: lvl * k * r.range(0.4, 1), norm: true, pan: r.range(-0.9, 0.9), room: out, wet: 0.6 });
    }
  };

  // ---- the car at night: rain on the roof and the screen, the wipers, the engine, the wet road
  {
    bed('carN', { colour: 'pink', f: [['hp', 500], ['lp', 6000]], vol: 0.05, am: 0.25, wr: 0.6 });                          // the hiss of rain
    bed('carN', { colour: 'brown', f: [['lp', 300]], vol: 0.05, am: 0.2, wr: 0.2 });                                         // the drum of it on the roof
    for (const [a, b] of W.carN) {
      const y = sbCrackle(fx, b - a, { rate: 650, hp: 900 }); SBX.bq(y, 'lp', 5000, 0.7, sr);                                // drops on the glass and the roof
      for (let i = 0; i < y.length; i++) y[i] *= P.carN(a + i / sr);
      K.put(y, a, { vol: 0.035, norm: true, pan: 0.05 });
      // the engine and tyres: louder with speed (sbCarV), a low idle when stopped
      const n = Math.ceil((b - a) * sr), eng = fx.arr(b - a), tyre = sbNoise(fx, n, 'pink'); let ph = 0;
      SBX.bq(tyre, 'bp', 700, 0.5, sr); SBX.bq(tyre, 'lp', 2500, 0.7, sr);
      for (let i = 0; i < n; i++) {
        const t = a + i / sr, v = sbCarV(t), rpm = 750 + 140 * v, p = P.carN(t);
        ph += rpm / 30 / sr; const q = 2 * Math.PI * ph;
        eng[i] = (Math.sin(q) + 0.5 * Math.sin(2 * q + 0.3) + 0.25 * Math.sin(3 * q + 1.1) + 0.4 * Math.sin(q / 2)) * p * (0.55 + 0.05 * v);
        tyre[i] *= p * Math.pow(v / 9, 1.3) * 1.2;
      }
      SBX.bq(eng, 'lp', 260, 0.7, sr); SBX.bq(eng, 'lp', 400, 0.7, sr);
      K.put(eng, a, { vol: 0.05, norm: true }); K.put(tyre, a, { vol: 0.035, norm: true });
      // the wipers: a rubber swish each way, a soft knock where they turn and where they park
      for (let c0 = Math.floor(a / SB_WIPE.P) * SB_WIPE.P; c0 < b; c0 += SB_WIPE.P) {
        for (const [t, dir] of [[c0, 1], [c0 + SB_WIPE.S, -1]]) {
          const k = P.carN(t + 0.3); if (k < 0.05 || t < a) continue;
          const x = sbNoise(fx, Math.round(SB_WIPE.S * sr), 'pink');
          for (let i = 0; i < x.length; i++) { const u = i / x.length; x[i] *= Math.pow(Math.sin(Math.PI * u), 0.8) * (1 + 0.6 * Math.sin(2 * Math.PI * 23 * u)); }
          sbSweepPut(K, x, t, 'bandpass', 1.4, dir > 0 ? [900, 1600, 2200, 1500] : [1500, 2100, 1500, 900], { vol: 0.03 * k, pan: dir > 0 ? -0.2 : 0.2 });
          K.put(fx.hit(fx.woodModes(120, 1.5), { width: 0.004, noise: 0.2 }), t + SB_WIPE.S - 0.02, { vol: 0.03 * k, norm: true, pan: dir > 0 ? 0.35 : -0.35, lp: 1500 });
        }
      }
    }
  }
  // ---- the car by day: the engine, the tyres, the town muffled through the glass
  {
    bed('carD', { colour: 'pink', f: [['bp', 600, 0.5], ['lp', 2000]], vol: 0.03, am: 0.3, wr: 0.3 });
    bed('carD', { colour: 'brown', f: [['lp', 180]], vol: 0.06, am: 0.15, wr: 0.2 });
    tone('carD', 22, [[1, 1], [2, 0.6], [3, 0.3], [4, 0.2]], { vol: 0.03, f: [['lp', 300]] });
    for (const [a, b] of W.carD) for (let t = a + 1.5; t < b - 1; t += r.range(3, 6)) sbBed(K, t, t + r.range(1.8, 3), { colour: 'pink', f: [['bp', r.range(400, 700), 0.6], ['lp', 1400]], vol: 0.02 * P.carD(t), mono: true, pan: r.range(-0.8, 0.8), env: (u) => Math.pow(Math.sin(Math.PI * u), 2) });
  }
  // ---- the flat: room tone, the fridge, the town through the window
  {
    for (const key of ['flatN', 'flatD', 'flat3']) {
      bed(key, { colour: 'pink', f: [['hp', 60], ['lp', 800]], vol: key === 'flat3' ? 0.014 : 0.025, am: 0.12 });
      tone(key, 50, [[1, 0.2], [2, 1], [3, 0.35], [4, 0.25], [6, 0.1]], { vol: key === 'flat3' ? 0.003 : 0.005, pan: -0.5, f: [['lp', 500]] });
    }
    bed('flatN', { colour: 'pink', f: [['bp', 450, 0.6], ['lp', 1300]], vol: 0.018, am: 0.5, wr: 0.2 });                    // the town at night
    bed('flatD', { colour: 'pink', f: [['bp', 550, 0.6], ['lp', 1800]], vol: 0.026, am: 0.5, wr: 0.25 });                   // the town by day
    for (const [a, b] of W.flatD) { chirps('flatD', a, b, 1.6, 0.006, { lp: 4500 }); }
    for (const [a, b] of W.flat3) { sbBed(K, a + 3, a + 9, { colour: 'pink', f: [['bp', 900, 3]], vol: 0.006, mono: true, pan: 0.6, env: (u) => Math.pow(Math.sin(Math.PI * u), 2) * (0.6 + 0.4 * Math.sin(u * 40)) }); }   // a far siren
    // Feeney's flat: a quieter room by day, the street below, a cheap watch ticking on the table
    bed('feeney', { colour: 'pink', f: [['hp', 60], ['lp', 700]], vol: 0.018, am: 0.1 });
    bed('feeney', { colour: 'pink', f: [['bp', 600, 0.6], ['lp', 1800]], vol: 0.02, am: 0.5, wr: 0.25 });
    for (const [a, b] of W.feeney) for (let t = Math.ceil(a * 2) / 2, i = 0; t < b; t += 0.5, i++) { const k = P.feeney(t); if (k < 0.05) continue; const f = i % 2 ? 3900 : 4400; K.put(fx.hit([[f, 0.006, 1], [f * 1.6, 0.004, 0.5], [f * 2.4, 0.003, 0.3]], { width: 0.0001, noise: 0.3, nhp: 4000 }), t, { vol: 0.012 * k, norm: true, pan: 0.25, room, wet: 0.2 }); }
  }
  // ---- the house: big, hard and empty; mornings through the glass; the terrace; the garage; the gate
  {
    for (const key of ['houseIn', 'morning']) { bed(key, { colour: 'pink', f: [['hp', 50], ['lp', 600]], vol: 0.016, am: 0.1 }); bed(key, { colour: 'brown', f: [['lp', 90]], vol: 0.03, am: 0.15 }); }
    bed('houseIn', { colour: 'pink', f: [['bp', 400, 0.6], ['lp', 900]], vol: 0.008, am: 0.4, wr: 0.15 });                   // the city, far below, through glass
    for (const [a, b] of W.morning) chirps('morning', a, b, 1.2, 0.005, { lp: 3500 });
    tone('morning', 60, [[1, 0.3], [2, 1], [3, 0.4], [5, 0.15]], { vol: 0.0035, pan: 0.5, f: [['lp', 400]] });             // the fridge (a big one)
    // the terrace at dusk: wind, the pool's edge, the city coming on
    bed('dusk', { colour: 'pink', f: [['hp', 250], ['lp', 2400]], vol: 0.02, am: 0.7, wr: 0.15 });
    bed('dusk', { colour: 'brown', f: [['lp', 350]], vol: 0.04, am: 0.25, wr: 0.1 });
    for (const [a, b] of W.dusk) for (let t = a + 0.3; t < b; t += r.range(0.5, 1.4)) K.put(fx.liquid(r.range(0.2, 0.45), (x) => Math.exp(-x / 0.1) * Math.min(1, x / 0.01), { f: r.range(400, 800) }), t, { vol: 0.012 * r.range(0.4, 1) * P.dusk(t), norm: true, pan: r.range(-0.3, 0.6), lp: 2600, room: out, wet: 0.3 });
    // the terrace at night: crickets, the far city
    bed('night', { colour: 'brown', f: [['lp', 300]], vol: 0.035, am: 0.2, wr: 0.1 });
    for (const [a, b] of W.night) for (let t = a + 0.2; t < b; t += r.range(0.25, 0.7)) { const k = P.night(t); if (k < 0.05) continue; K.put(sbCricket(fx), t, { vol: 0.006 * k * r.range(0.4, 1), norm: true, pan: r.range(-0.9, 0.9), room: out, wet: 0.4 }); }
    // the garage: the strip lights' hum, a hard room
    bed('garage', { colour: 'pink', f: [['hp', 60], ['lp', 700]], vol: 0.016, am: 0.1 });
    tone('garage', 100, [[1, 1], [2, 0.5], [3, 0.45], [5, 0.2], [7, 0.12]], { vol: 0.005, pan: 0.2, f: [['hp', 90]] });
    // the gate: outside, by day (birds, the road, a breeze)
    bed('gate', { colour: 'pink', f: [['bp', 500, 0.6], ['lp', 1800]], vol: 0.025, am: 0.5, wr: 0.2 });
    bed('gate', { colour: 'pink', f: [['hp', 300], ['lp', 2600]], vol: 0.01, am: 0.7, wr: 0.15 });
    for (const [a, b] of W.gate) chirps('gate', a, b, 0.9, 0.007);
  }
  // ---- the streets
  {
    // your old street: birds, a far road, a dog, somebody's radio
    bed('old', { colour: 'pink', f: [['bp', 500, 0.6], ['lp', 1700]], vol: 0.025, am: 0.5, wr: 0.2 });
    bed('old', { colour: 'pink', f: [['hp', 300], ['lp', 2500]], vol: 0.008, am: 0.7, wr: 0.15 });
    for (const [a, b] of W.old) {
      chirps('old', a, b, 0.7, 0.008);
      for (const dt of [3.2, 3.6, 9.5]) { const y = sbVoice(fx, 'wuf', { f0: 210, fs: 0.8, rate: 1.4, breathy: 0.6 }); SBX.bq(y, 'lp', 1500, 0.7, sr); K.put(y, a + dt, { vol: 0.008 * P.old(a + dt), norm: true, pan: -0.6, room: out, wet: 0.7 }); }
    }
    // downtown: traffic, people talking, a bus, a horn
    bed('town', { colour: 'brown', f: [['lp', 300]], vol: 0.06, am: 0.25, wr: 0.15 });
    bed('town', { colour: 'pink', f: [['bp', 650, 0.5], ['lp', 2600]], vol: 0.035, am: 0.4, wr: 0.3 });
    bed('town', { colour: 'pink', f: [['bp', 480, 0.8], ['lp', 1500]], vol: 0.018, am: 0.5, wr: 4.0 });                     // a murmur
    for (const [a, b] of W.town) {
      chatter('town', a, b, 0.55, 0.008);
      for (let t = a + 1.0; t < b - 1; t += r.range(2.5, 5)) sbBed(K, t, t + r.range(2, 3.5), { colour: 'pink', f: [['bp', r.range(350, 700), 0.6], ['lp', 2200]], vol: 0.03 * P.town(t), mono: true, pan: r.range(-0.4, 0.9), env: (u) => Math.pow(Math.sin(Math.PI * u), 2) });   // a car going by
      for (const dt of [6.5, 13.8]) { const t = a + dt; if (t < b) sbTone(K, t, 0.45, 392, [[1, 1], [1.26, 0.8], [2, 0.4], [3, 0.25]], (u) => Math.min(1, u * 20, (1 - u) * 8), { vol: 0.008 * P.town(t), pan: 0.7, f: [['lp', 2200]] }); }   // a horn, far off
    }
    // the canal: water at the quay, bicycles, gulls, a breeze
    bed('canal', { colour: 'pink', f: [['bp', 380, 0.7], ['lp', 1100]], vol: 0.03, am: 0.8, wr: 0.28 });
    bed('canal', { colour: 'pink', f: [['bp', 600, 0.6], ['lp', 1800]], vol: 0.014, am: 0.5, wr: 0.2 });
    for (const [a, b] of W.canal) {
      chirps('canal', a, b, 1.1, 0.006);
      for (let t = a + 0.5; t < b; t += r.range(0.6, 1.6)) K.put(fx.liquid(r.range(0.25, 0.5), (x) => Math.exp(-x / 0.12) * Math.min(1, x / 0.01), { f: r.range(350, 700) }), t, { vol: 0.014 * r.range(0.4, 1) * P.canal(t), norm: true, pan: r.range(-0.6, 0.6), lp: 2400, room: out, wet: 0.4 });
      for (const dt of [2.4, 9.1]) K.put(sbGull(fx), a + dt, { vol: 0.008 * P.canal(a + dt), norm: true, pan: r.range(-0.6, 0.6), lp: 3200, room: out, wet: 0.6 });
      for (const dt of [4.6, 11.7, 14.2]) for (const k of [0, 0.14]) K.put(fx.hit(fx.metalModes(3100, 0.6), { width: 0.0002 }), a + dt + k, { vol: 0.01 * P.canal(a + dt), norm: true, pan: 0.5, room: out, wet: 0.6 });   // a bicycle bell
    }
  }
  // ---- the lab: air conditioning, a fluorescent hum. The boardroom: high up, wind on the glass
  {
    bed('lab', { colour: 'pink', f: [['bp', 520, 0.5]], vol: 0.022, am: 0.1 });
    bed('lab', { colour: 'pink', f: [['hp', 2200], ['lp', 8000]], vol: 0.004 });
    tone('lab', 120, [[1, 0.6], [2, 1], [3, 0.5], [4, 0.25], [8, 0.08]], { vol: 0.004, pan: 0.35, f: [['hp', 100]] });
    bed('board', { colour: 'pink', f: [['hp', 200], ['lp', 1600]], vol: 0.016, am: 0.8, wr: 0.12 });
    bed('board', { colour: 'pink', f: [['hp', 50], ['lp', 600]], vol: 0.018, am: 0.1 });
  }
  // ---- the marina: water at the hulls, gulls, halyards, a far boat
  {
    bed('sea', { colour: 'pink', f: [['bp', 380, 0.7], ['lp', 1100]], vol: 0.035, am: 0.8, wr: 0.28 });
    bed('sea', { colour: 'pink', f: [['hp', 300], ['lp', 2200]], vol: 0.012, am: 0.7, wr: 0.15 });
    bed('sea', { colour: 'brown', f: [['lp', 220]], vol: 0.04, am: 0.3, wr: 0.12 });
    for (const [a, b] of W.sea) {
      for (let t = a + 0.3; t < b; t += r.range(0.5, 1.3)) K.put(fx.liquid(r.range(0.25, 0.5), (x) => Math.exp(-x / 0.12) * Math.min(1, x / 0.01), { f: r.range(350, 650) }), t, { vol: 0.014 * r.range(0.4, 1) * P.sea(t), norm: true, pan: r.range(-0.6, 0.6), lp: 2400, room: out, wet: 0.4 });
      for (const dt of [1.0, 4.4]) K.put(sbGull(fx), a + dt, { vol: 0.012 * P.sea(a + dt), norm: true, pan: r.range(-0.7, 0.7), lp: 3400, room: out, wet: 0.6 });
      for (let t = a + 0.8; t < b - 0.3; t += r.range(1.2, 2.6)) { const bb = r.range(1700, 2600), pan = r.range(-0.8, 0.8); for (let k = 0, tt = t; k < r.int(1, 3); k++, tt += r.range(0.12, 0.3)) K.put(fx.hit(fx.metalModes(bb, 0.7), { width: 0.0002 }), tt, { vol: 0.006 * P.sea(tt), norm: true, pan, room: out, wet: 0.8 }); }
    }
  }
});
