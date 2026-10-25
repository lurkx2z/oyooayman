/* =====================================================================
   SOUND · AMBIENCE — the air of each place, cut with the picture (ntWhere).
     the office    the air handling, the fluorescent hum, keyboards and a phone somewhere, colleagues talking low; after
                   8:46 the lights buzz and stutter, voices rise, then a strange quiet; wind on the glass at the windows
     the stairs    a hard, echoing shaft: hundreds of feet shuffling down at the crowd's pace (stopping when it stops),
                   people talking low, a cough now and then; water on the lower floors; the transfer hallway drier
     the lobby     the mezzanine's big hall, sirens outside through the glass; the concourse's sprinklers raining
     the street    open air: sirens from every direction, a helicopter, people; inside the cloud everything is gone
                   but a hiss; the grey: almost nothing, a car alarm far off; further north, sirens again
     the end       the empty stairway: a hum and a drip. The night of the Tribute in Light: the city far off, water
   ===================================================================== */

let NT_PL = null;
function ntPl() {
  if (NT_PL) return NT_PL;
  const m = (...ms) => (s) => ms.includes(s.mode);
  return (NT_PL = {
    office: ntCurve(ntWhere((s) => s.set === 'office' && s.mode !== 'core')),
    win: ntCurve(ntWhere(m('sky', 'tower', 'down', 'outside'))),
    core: ntCurve(ntWhere(m('core'))),
    stair: ntCurve(ntWhere((s) => s.set === 'stair' && s.mode !== 'transfer' && s.mode !== 'empty')),
    hall: ntCurve(ntWhere(m('transfer'))),
    wet: ntCurve(ntWhere(m('water'))),
    thin: ntCurve(ntWhere(m('thin'))),
    empty: ntCurve(ntWhere(m('empty'), 0.3)),
    mezz: ntCurve(ntWhere(m('mezz', 'police'))),
    esc: ntCurve(ntWhere(m('esc'))),
    conc: ntCurve(ntWhere(m('conc'))),
    street: ntCurve(ntWhere((s) => s.set === 'street')),
    light: ntCurve(ntWhere(m('light'), 0.5)),
  });
}
// the street's air before the cloud, inside it, and the grey after (levels over film time)
const ntCloudIn = (t) => ntEv(t, NT.cloudHit - 0.4, NT.cloudHit + 0.3);
const ntClear = (t) => 1 - ntCloudIn(t) + ntEv(t, NT.walk - 0.5, NT.walk + 2.5);     // the open street (back after the grey)
// how fast the crowd is moving on the stairs now (0 stopped … 1.6), from the walking model
function ntCrowdMove(t) {
  const s = ntShotAt(t);
  if (s.set !== 'stair' || s.mode === 'transfer' || s.mode === 'empty') return 0;
  return MathX.clamp((ntStairLocal(t + 0.25, s) - ntStairLocal(t - 0.25, s)) / 0.5 / NT_PACE, 0, 1.6);
}

ntSound('amb', 'places', function (ctx, bus, K) {
  const { fx, r, sr } = K, END = NT.end + 1.5, P = ntPl();
  const room = K.verb('office', 0.9, { bright: 0.4, damp: 4, wet: 0.35, seed: 21, pre: 0.008 });
  const shaft = K.verb('shaft', 2.6, { bright: 0.55, damp: 2.2, wet: 0.5, seed: 31, pre: 0.006, early: [[0.011, 0.5], [0.023, 0.35], [0.041, 0.25], [0.067, 0.15]] });
  const big = K.verb('hall', 3.6, { bright: 0.45, damp: 2.4, wet: 0.5, seed: 37, pre: 0.02 });
  const out = K.verb('out', 2.2, { bright: 0.4, damp: 3, wet: 0.45, seed: 41, pre: 0.03 });
  const hit = NT.hit;
  // the lights after 8:46 (the same flicker as the picture: 1 steady … 0 out)
  const lights = ntCurve((t) => t < hit ? 1 : MathX.clamp(1 - 0.85 * Math.max(0, noise1(t * 17, 5)) * Math.exp(-(t - hit) / 2.5) - 0.5 * (ntEv(t, hit, hit + 0.05) * (1 - ntEv(t, hit + 0.15, hit + 0.7))), 0, 1));

  // ================= the office
  ntBed(K, 0, NT.stair + 1, { colour: 'pink', f: [['hp', 60], ['lp', 420]], vol: 0.06, am: 0.12, wr: 0.1, env: (u, t) => (P.office(t) + 0.7 * P.core(t)) * (0.6 + 0.4 * lights(t)), fi: 0.02, fo: 0.4 });
  ntBed(K, 0, NT.stair + 1, { colour: 'pink', f: [['bp', 950, 0.8], ['lp', 2600]], vol: 0.012, am: 0.2, wr: 0.15, env: (u, t) => P.office(t) * (0.5 + 0.5 * lights(t)), fi: 0.02, fo: 0.3 });
  ntTone(K, 0, NT.stair, 120, [[1, 1], [2, 0.55], [3, 0.3], [4, 0.18], [6, 0.08]], (u, t) => (P.office(t) + 0.6 * P.core(t)) * lights(t) * (t > hit && t < hit + 3 ? 1 + 2 * Math.max(0, noise1(t * 23, 9)) : 1), { vol: 0.0065, f: [['lp', 1400]], room, wet: 0.2 });
  // keyboards somewhere on the floor, and a phone ringing far off (before 8:46)
  for (let t = r.range(0.2, 1); t < hit - 0.2; t += r.range(1.0, 3.5)) {
    const pan = r.range(-0.8, 0.8), nk = r.int(4, 16);
    for (let k = 0, tt = t; k < nk && tt < hit - 0.05; k++, tt += r.range(0.07, 0.17)) K.put(fx.hit([[r.range(2200, 3200), 0.006, 1], [r.range(4500, 6000), 0.003, 0.5], [r.range(600, 900), 0.01, 0.4]], { width: 0.0003, noise: 0.5, nhp: 2000 }), tt, { vol: 0.0035 * r.range(0.5, 1) * P.office(tt), norm: true, pan, room, wet: 0.5 });
  }
  for (const t0 of [NT.sky + 1.2, NT.tower + 2.6]) ntTone(K, t0, 2.0, 440, [[1, 1], [480 / 440, 1]], (u) => Math.min(1, u * 40, (1 - u) * 40), { vol: 0.0032, pan: 0.65, f: [['bp', 1000, 0.6]], room, wet: 0.8 });
  // colleagues talking low; after 8:46 louder (alarmed), then quiet; then talk about what to do
  {
    const lv = ntCurve((t) => P.office(t) * (t < hit ? 0.35 : 0.45 + 0.9 * ntEv(t, hit + 0.8, hit + 3) * (1 - 0.7 * ntEv(t, ntCap('after', 1).show - 1.5, ntCap('after', 1).show + 0.5)) + 0.5 * ntEv(t, NT.nobody, NT.nobody + 2)) + 0.5 * P.core(t));
    const B = ntBabble(fx, NT.stair + 0.5, { voices: 7, f0: [95, 220], talk: 0.45, env: (t) => lv(t) });
    K.putLR(B.L, B.R, 0, { vol: 0.026, norm: true, room, wet: 0.8 });
  }
  // the windows: wind on the glass, high up (only at the windows)
  ntBed(K, NT.sky - 0.5, NT.nobody, { colour: 'pink', f: [['bp', 900, 1.2], ['lp', 3000]], vol: 0.018, am: 0.7, wr: 0.22, env: (u, t) => P.win(t), fi: 0.02, fo: 0.2 });

  // ================= the stairs
  ntBed(K, NT.stair - 0.5, NT.mezz + 0.5, { colour: 'brown', f: [['lp', 220]], vol: 0.045, am: 0.15, wr: 0.08, env: (u, t) => P.stair(t) + 0.6 * P.hall(t), fi: 0.02, fo: 0.3 });
  ntBed(K, NT.stair - 0.5, NT.mezz + 0.5, { colour: 'pink', f: [['hp', 200], ['lp', 1800]], vol: 0.008, am: 0.2, wr: 0.12, env: (u, t) => P.stair(t), fi: 0.02, fo: 0.3, room: shaft, wet: 0.5 });
  // the crowd's feet: steps on concrete treads, as many as the crowd, at its pace (fewer when it stops)
  {
    const steps = Array.from({ length: 14 }, (_, i) => fx.step({ weight: r.range(0.25, 0.6), scuff: r.range(0, 0.45), s: r.range(0.9, 1.25), body: r.range(70, 95) }));
    const dense = (t) => (1 - 0.6 * P.thin(t)) * (P.stair(t) + 0.7 * P.hall(t));
    for (let t = NT.stair + 0.2; t < NT.mezz; t += r.range(0.05, 0.22)) {
      const mv = ntShotAt(t).mode === 'transfer' ? 1 : ntCrowdMove(t), d = dense(t);
      if (d < 0.03 || !r.chance(Math.min(1, 0.15 + 0.85 * mv) * (0.5 + 0.5 * d))) continue;
      K.put(steps[r.int(0, steps.length - 1)], t, { vol: 0.009 * d * r.range(0.4, 1), norm: true, pan: r.range(-0.8, 0.8), room: shaft, wet: 0.55 });
      if (P.wet(t) > 0.2 && r.chance(0.7)) K.put(fx.rustle(0.12, { density: 1400, rub: 0.4, lo: 1200, hi: 6500, grain: 0.004, env: (u) => Math.exp(-u * 5) }), t + 0.01, { vol: 0.006 * P.wet(t), norm: true, pan: r.range(-0.6, 0.6), room: shaft, wet: 0.4 });
    }
  }
  // people talking low on the stairs, and a cough now and then
  {
    const lv = ntCurve((t) => (P.stair(t) * (1 - 0.6 * P.thin(t)) + 0.7 * P.hall(t)) * (t > NT.shake && t < NT.shake + 4 ? 1.8 : 1));
    const B = ntBabble(fx, NT.mezz - NT.stair + 0.5, { voices: 6, f0: [95, 210], talk: 0.35, env: (t) => lv(NT.stair + t) });
    K.putLR(B.L, B.R, NT.stair, { vol: 0.011, norm: true, room: shaft, wet: 0.9 });
    for (const t of [NT.pace + 3.1, NT.calm + 6.4, NT.right + 1.2, NT.ff + 8.8, NT.water + 4.4]) K.put(fx.breath(0.32, { voice: 0.9, f0: r.range(110, 160), env: (u) => Math.min(1, u / 0.05) * Math.pow(1 - u, 2) }), t, { vol: 0.012 * (P.stair(t) + P.hall(t)), norm: true, pan: r.range(-0.6, 0.6), lp: 3500, room: shaft, wet: 0.6 });
  }
  // the water: running down the steps on the lower floors, dripping through the gap
  ntBed(K, NT.water - 0.5, NT.mezz, { colour: 'white', f: [['bp', 2600, 0.7], ['lp', 7000]], vol: 0.012, am: 0.5, wr: 2.2, env: (u, t) => P.wet(t) + 0.35 * P.thin(t), fi: 0.02, fo: 0.3, room: shaft, wet: 0.4 });
  {
    const L = new Float32Array(Math.ceil((NT.mezz - NT.water + 1) * sr)), R = new Float32Array(L.length);
    for (let x = 0; x < NT.mezz - NT.water; x += r.range(0.03, 0.15)) { const t = NT.water + x, a = P.wet(t) + 0.3 * P.thin(t); if (a > 0.05) fx.bubble(L, R, Math.round(x * sr), r.range(800, 2400), r.range(0.004, 0.012), a * r.range(0.3, 1), r.range(-0.7, 0.7)); }
    K.putLR(L, R, NT.water, { vol: 0.01, norm: true, room: shaft, wet: 0.5 });
  }
  // the empty stairway at the end: a low hum, and one drip, slow, in the dark
  ntBed(K, NT.out - 0.5, NT.cost + 0.5, { colour: 'brown', f: [['lp', 160]], vol: 0.03, env: (u, t) => P.empty(t), fi: 0.3, fo: 0.4 });
  for (let t = NT.out + 1.3; t < NT.cost - 0.5; t += r.range(2.6, 3.6)) { const L = new Float32Array(Math.ceil(0.2 * sr)), R = new Float32Array(L.length); fx.bubble(L, R, 0, r.range(1300, 1700), 0.01, 1, r.range(-0.3, 0.3)); K.putLR(L, R, t, { vol: 0.012 * P.empty(t), norm: true, room: shaft, wet: 1.4 }); }

  // ================= the lobby: the mezzanine's hall, sirens outside; the concourse's sprinklers
  ntBed(K, NT.mezz - 0.5, NT.five + 0.5, { colour: 'pink', f: [['hp', 50], ['lp', 700]], vol: 0.03, am: 0.2, wr: 0.1, env: (u, t) => P.mezz(t) + 0.7 * P.esc(t) + 0.5 * P.conc(t), fi: 0.02, fo: 0.3, room: big, wet: 0.4 });
  {
    const B = ntBabble(fx, NT.five - NT.mezz + 0.5, { voices: 8, f0: [95, 220], talk: 0.3, env: (t) => 0.5 + 0.5 * Math.sin(t * 0.3) });
    K.putLR(B.L, B.R, NT.mezz, { vol: 0.009, norm: true, room: big, wet: 1.0 });
    // crowd steps on grit and glass
    const crunch = Array.from({ length: 10 }, () => { const y = fx.step({ weight: r.range(0.25, 0.5), scuff: 0.3 }), g = fx.rustle(0.1, { density: 2500, rub: 0.1, lo: 2500, hi: 9500, grain: 0.002, env: (u) => Math.exp(-u * 6) }); for (let i = 0; i < g.length; i++) y[i] += g[i] * 0.8; return y; });
    for (let t = NT.mezz + 0.2; t < NT.five; t += r.range(0.08, 0.25)) { const a = P.mezz(t) + 0.6 * P.esc(t) + 0.8 * P.conc(t); if (a > 0.05) K.put(crunch[r.int(0, 9)], t, { vol: 0.007 * a * r.range(0.4, 1), norm: true, pan: r.range(-0.8, 0.8), room: big, wet: 0.6 }); }
  }
  // the sprinklers: rain from the ceiling, water on the floor
  ntBed(K, NT.conc - 0.5, NT.five + 0.3, { colour: 'white', f: [['hp', 1800], ['lp', 9000]], vol: 0.022, am: 0.3, wr: 1.5, env: (u, t) => P.conc(t) + 0.2 * P.esc(t), fi: 0.02, fo: 0.2, room: big, wet: 0.3 });
  {
    const d = NT.five - NT.conc + 0.5, L = new Float32Array(Math.ceil(d * sr)), R = new Float32Array(L.length);
    for (let x = 0; x < d; x += r.range(0.004, 0.02)) fx.bubble(L, R, Math.round(x * sr), r.range(1500, 4500), r.range(0.002, 0.006), r.range(0.2, 1) * P.conc(NT.conc + x), r.range(-0.9, 0.9));
    K.putLR(L, R, NT.conc, { vol: 0.012, norm: true, room: big, wet: 0.3 });
  }

  // ================= the street
  const sirenLv = ntCurve((t) => (P.mezz(t) * 0.25 + P.esc(t) * 0.12 + P.street(t) * ntClear(t) * (t > NT.grey && t < NT.walk ? 0.15 : 1)));
  ntBed(K, NT.five - 0.5, NT.out + 0.5, { colour: 'pink', f: [['hp', 40], ['lp', 900]], vol: 0.035, am: 0.3, wr: 0.12, env: (u, t) => P.street(t) * (0.15 + 0.85 * ntClear(t)) * (t > NT.grey && t < NT.walk ? 0.35 : 1), fi: 0.02, fo: 0.3 });
  // sirens: one after another from different streets, near and far; through the mezzanine's glass, faint
  for (let t = NT.mezz + 1.0, i = 0; t < NT.out - 2; i++) {
    const d = r.range(7, 16), dist = r.range(0.2, 0.9), kind = r.chance(0.3) ? 'yelp' : 'wail', pan = r.range(-0.9, 0.9), env0 = (u) => Math.min(1, u * 5, (1 - u) * 5);
    const y = ntSiren(fx, d, { kind, dist, range: kind === 'yelp' ? [700, 1600] : [r.range(600, 720), r.range(1350, 1550)], env: env0 });
    const lv = ntCurve((x) => sirenLv(x));
    for (let i2 = 0, n = y.length; i2 < n; i2 += 256) { const g = lv(t + i2 / sr); for (let k = i2; k < Math.min(n, i2 + 256); k++) y[k] *= g; }
    K.put(y, t, { vol: 0.012 * (1 - 0.6 * dist), norm: true, pan, room: out, wet: 0.6 + 0.4 * dist, lp: P.mezz(t) > 0.5 ? 1800 : undefined });
    t += d * r.range(0.35, 0.8);
  }
  // a helicopter, high up, on and off
  ntBed(K, NT.five + 2, NT.roarShot + 2, { colour: 'brown', f: [['lp', 380]], vol: 0.022, mono: true, pan: -0.4, env: (u, t) => P.street(t) * ntClear(t) * (0.55 + 0.45 * Math.sin(2 * Math.PI * 11.5 * (t - NT.five))) * Math.pow(Math.sin(Math.PI * u), 0.8), fi: 1, fo: 1.5, room: out, wet: 0.5 });
  ntBed(K, NT.walk + 1, NT.out - 1, { colour: 'brown', f: [['lp', 340]], vol: 0.016, mono: true, pan: 0.5, env: (u, t) => P.street(t) * (0.55 + 0.45 * Math.sin(2 * Math.PI * 11 * (t - NT.walk))) * Math.pow(Math.sin(Math.PI * u), 0.8), fi: 1.5, fo: 1.5, room: out, wet: 0.5 });
  // people on the street: talking, calling out
  {
    const lv = ntCurve((t) => P.street(t) * (ntClear(t) * (t > NT.grey && t < NT.walk ? 0.2 : 1) + 0.4 * (t > NT.fall + 3 && t < NT.out ? 1 : 0)));
    const B = ntBabble(fx, NT.out - NT.five + 0.5, { voices: 9, f0: [100, 240], talk: 0.4, env: (t) => lv(NT.five + t) });
    K.putLR(B.L, B.R, NT.five, { vol: 0.012, norm: true, room: out, wet: 0.7 });
    const steps = Array.from({ length: 8 }, () => fx.step({ weight: r.range(0.25, 0.5), scuff: r.range(0, 0.3) }));
    for (let t = NT.five + 0.3; t < NT.out; t += r.range(0.12, 0.4)) { const a = P.street(t) * ntClear(t) * (t > NT.roar + 1.5 && t < NT.cloudHit ? 2.2 : 1); if (a > 0.05) K.put(steps[r.int(0, 7)], t, { vol: 0.006 * a * r.range(0.4, 1), norm: true, pan: r.range(-0.8, 0.8), room: out, wet: 0.4 }); }
  }
  // inside the cloud: no street at all, only a hiss of dust falling and a deep, dead air; the grey: almost nothing
  ntBed(K, NT.cloudHit - 1, NT.walk + 2, { colour: 'white', f: [['hp', 3500], ['lp', 8000]], vol: 0.007, am: 0.4, wr: 0.8, env: (u, t) => P.street(t) * ntCloudIn(t) * (1 - 0.6 * ntEv(t, NT.grey, NT.grey + 6)) * (1 - ntEv(t, NT.walk - 0.5, NT.walk + 2)), fi: 0.02, fo: 0.3 });
  ntBed(K, NT.cloudHit - 1, NT.walk + 2, { colour: 'brown', f: [['lp', 120]], vol: 0.03, env: (u, t) => P.street(t) * ntCloudIn(t) * (1 - 0.7 * ntEv(t, NT.grey, NT.grey + 4)) * (1 - ntEv(t, NT.walk - 0.5, NT.walk + 2)), fi: 0.02, fo: 0.3 });
  {
    const t0 = ntCap('grey', 1).show - 1.0, d = NT.walk - t0 + 1.5;
    K.put(ntCarAlarm(fx, d, { per: 0.48 }), t0, { vol: 0.0035, norm: true, pan: 0.7, room: out, wet: 1.2, lp: 1600 });
  }

  // ================= the end: the night of the Tribute in Light, across the river: the city far off, water close
  ntBed(K, NT.light - 0.5, END, { colour: 'pink', f: [['hp', 40], ['lp', 380]], vol: 0.022, am: 0.2, wr: 0.08, env: (u, t) => P.light(t) * (1 - ntEv(t, NT.end - 3, NT.end)), fi: 0.5, fo: 0.5 });
  ntBed(K, NT.light - 0.5, END, { colour: 'pink', f: [['bp', 600, 0.8], ['lp', 1500]], vol: 0.008, am: 0.8, wr: 0.45, env: (u, t) => P.light(t) * (1 - ntEv(t, NT.end - 3, NT.end)), fi: 0.5, fo: 0.5 });
});
