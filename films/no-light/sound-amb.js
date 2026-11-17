/* =====================================================================
   SOUND · AMBIENCE — where the camera is (sound-lib.js: nlPlaces) and the lake's crowd. The beds sit well under the
   score (mix.js; the owner's rule: the music clearly leads, beds about 10 dB under it).
     day    the title: a light wind, a crowd skating and chatting in the sun (it stops dead at 2:40 PM)
     ice    out on the lake: a wind over the snow, the town's low murmur far off; now and then the ice sings
     dark   the black shots: the same lake, closer and drier (the wind down, the voices nearer)
     fire   by the bonfire: its roar and crackle close
     road   by the road: idling engines (every stopped car is still running), a horn now and then
   The crowd (after 2:40 PM): screams at first, then people calling out in the dark ("hallo?", "hjelp!") across the
   ice, thinning as the minutes pass; far off, horns from the road and the town.
   ===================================================================== */

nlSound('amb', 'beds', function (ctx, bus, K) {
  const fi = 0.04, fo = 0.04, T0 = NL.tOn, END = NL.end, fx = K.fx;
  const open = K.verb('aopen', 3.4, { bright: 0.35, damp: 2.2, wet: 0.45, pre: 0.05, early: [[0.32, 0.18], [0.75, 0.1]] });   // the shore's slap-back
  for (const p of nlPlaces()) {
    const a = p.t0, b = p.t1 + 0.06, d = b - a, w = p.where;
    if (d < 0.05 || a > END + 1) continue;
    const ed = (u, tt) => Math.min(1, tt / fi, (d - tt) / fo);
    // the wind over the snow and the town's low murmur (closer by the road)
    nlBedW(K, a, b, { colour: 'pink', f: [['bp', 560, 0.5], ['lp', 2600]], vol: w === 'dark' ? 0.035 : w === 'fire' ? 0.04 : 0.06, am: 0.7, wr: 0.22, fi, fo });
    nlBedW(K, a, b, { colour: 'brown', f: [['lp', 220]], vol: w === 'road' ? 0.1 : w === 'dark' ? 0.045 : 0.06, am: 0.4, wr: 0.15, fi, fo });
    if (w === 'dark') nlBedW(K, a, b, { colour: 'pink', f: [['bp', 1600, 0.7], ['lp', 4000]], vol: 0.012, am: 0.3, wr: 0.5, fi, fo });   // the snow's hiss, close
    if (w === 'fire') {
      // the roar (a big wood fire: low, breathing) and its crackle
      nlBedW(K, a, b, { colour: 'brown', f: [['lp', 380], ['hp', 45]], vol: 0.13, am: 0.55, wr: 0.6, fi, fo });
      nlBedW(K, a, b, { colour: 'pink', f: [['bp', 900, 0.6], ['lp', 2200]], vol: 0.035, am: 0.8, wr: 0.9, fi, fo });
      const c = nlCrackle(fx, d, { rate: 11 }); for (let i = 0; i < c.length; i++) c[i] *= ed(0, i / fx.sr);
      K.put(c, a, { vol: 0.09, norm: true, pan: 0.1 });
    }
    if (w === 'road') {
      // two or three cars idling near (each a little different), the rest a low rumble
      [[760, -0.4, 0.07], [880, 0.35, 0.05], [700, 0.1, 0.04]].forEach(([rpm, pan, v], k) => { const y = nlEngine(fx, d, (tt) => rpm * (1 + 0.012 * Math.sin(tt * (1.3 + k))), { lp: 600 }); for (let i = 0; i < y.length; i++) y[i] *= ed(0, i / fx.sr); K.put(y, a, { vol: v, norm: true, pan }); });
    }
    if (w === 'day') {
      // a crowd skating in the sun: many voices chatting at once, far and near; it stops dead when the light goes
      const n = Math.ceil(d * fx.sr), L = new Float32Array(n), R = new Float32Array(n), r = new RNG(5150);
      for (let v = 0; v < 16; v++) {
        const f0 = r.next() < 0.5 ? r.range(105, 150) : r.range(190, 260), pan = r.range(-0.9, 0.9), g = r.range(0.25, 1);
        for (let t = r.range(0, 0.6); t < d - 0.2;) {
          const sd = r.range(0.09, 0.2), V = NL_VOWEL['aoeu'[r.int(0, 3)]].map(([f, q, aa]) => [f * r.range(0.9, 1.15), q, aa]);
          const y = nlVoice(fx, sd, { f0: (u) => f0 * (1 + 0.15 * Math.sin(Math.PI * u) - 0.06 * u), formants: V, breath: 0.1, env: (u) => Math.min(1, u / 0.2) * Math.min(1, (1 - u) / 0.3) });
          const i0 = Math.round(t * fx.sr);
          for (let i = 0; i < y.length && i0 + i < n; i++) { L[i0 + i] += y[i] * g * (1 - pan) * 0.5; R[i0 + i] += y[i] * g * (1 + pan) * 0.5; }
          t += sd + (r.next() < 0.2 ? r.range(0.3, 0.9) : r.range(0.0, 0.06));
          if (r.next() < 0.03) t += 1.5;
        }
      }
      NLX.bq(L, 'lp', 2600, 0.7, fx.sr); NLX.bq(R, 'lp', 2600, 0.7, fx.sr); NLX.bq(L, 'hp', 140, 0.7, fx.sr); NLX.bq(R, 'hp', 140, 0.7, fx.sr);
      const cut = T0 + 0.35 - a;                                                     // (the chatter stops a beat after the light goes)
      for (let i = 0; i < n; i++) { const tt = i / fx.sr, e = Math.min(1, tt / 0.3) * (tt < cut ? 1 : Math.max(0, 1 - (tt - cut) / 0.12)); L[i] *= e; R[i] *= e; }
      K.putLR(L, R, a, { vol: 0.07, norm: true, room: open, wet: 0.5 });
    }
  }

  // ---- the crowd after 2:40 PM: first screams, then calls across the ice, thinning; quieter while the ice sings
  { const r = new RNG(CONFIG.seed + 777);
    // the first seconds: screams, near and far
    for (let k = 0; k < 7; k++) {
      const t = T0 + 0.9 + k * r.range(0.25, 0.7) + r.range(0, 0.4), near = r.next() < 0.35;
      K.put(nlScream(fx, { f0: r.next() < 0.6 ? r.range(520, 820) : r.range(300, 420), d: r.range(0.7, 1.4) }), t, { vol: (near ? 0.07 : 0.035) * r.range(0.7, 1), norm: true, pan: r.range(-0.85, 0.85), room: open, wet: near ? 0.4 : 0.9, lp: near ? 3800 : 2200 });
    }
    // then the calls: "hallo?" (rising), "hjelp!" (falling), names; every 0.8 s at first, every 6 s by the end
    const gapAt = (t) => (t < T0 + 20 ? 0.9 : t < 110 ? 2.4 : t < 230 ? 3.6 : 5.5);
    for (let t = T0 + 2.6; t < END - 1;) {
      const sh = nlShotAt(t), w = nlWhereShot(sh), quiet = (t > nlB('sing') && t < nlB('water') + 0.6) ? 0.35 : 1;
      if (w !== 'day') {
        const q = r.next() < 0.6, male = r.next() < 0.5, near = w === 'dark' ? r.next() < 0.5 : r.next() < 0.15;
        const y = nlCall(fx, { f0: male ? r.range(130, 175) : r.range(220, 300), d: r.range(0.55, 0.9), up: q ? r.range(1.15, 1.3) : r.range(0.78, 0.88), v1: q ? 'a' : 'e', v2: q ? 'o' : 'u', k: male ? 1 : 1.12 });
        const lv = (near ? 0.06 : 0.026) * r.range(0.6, 1) * quiet * (w === 'fire' || w === 'road' ? 0.7 : 1);
        K.put(y, t, { vol: lv, norm: true, pan: r.range(-0.9, 0.9), room: open, wet: near ? 0.45 : 1.0, lp: near ? 3600 : 1800 });
      }
      t += gapAt(t) * r.range(0.5, 1.5);
    }
    // far off, horns from the road and the town (blind drivers), every 7 to 20 s
    for (let t = T0 + 5 + r.range(0, 4); t < END - 2; t += r.range(7, 20)) {
      const w = nlWhereShot(nlShotAt(t)); if (w === 'day') continue;
      K.put(nlHorn(fx, r.range(0.3, 1.4), r.range(360, 470)), t, { vol: (w === 'road' ? 0.05 : 0.016) * r.range(0.6, 1), norm: true, pan: r.range(-0.8, 0.8), room: open, wet: w === 'road' ? 0.4 : 1.0, lp: w === 'road' ? 3000 : 1400 });
    }
  }

  // ---- the ice sings now and then (out on the lake and in the black): a far pew, a groan
  { const r = new RNG(CONFIG.seed + 4242);
    for (let t = T0 + 6 + r.range(0, 4); t < END - 1; t += r.range(5, 13)) {
      const w = nlWhereShot(nlShotAt(t)); if (w !== 'ice' && w !== 'dark') continue;
      if (t > nlB('sing') - 1 && t < nlB('water') + 1) continue;                  // (the sing beat has its own: sound-sfx.js)
      K.put(nlPew(fx, { f0: r.range(2200, 4200), f1: r.range(180, 420), d: r.range(0.35, 0.9), thump: r.range(0.2, 0.6) }), t, { vol: 0.03 * r.range(0.5, 1), norm: true, pan: r.range(-0.9, 0.9), room: open, wet: 0.9 });
    }
  }
});
