/* =====================================================================
   SOUND · AMBIENCE — each place's own air, cut with the picture (slPlace: from shots.js).
     the flat     room tone, the fridge, the clock on the sideboard ticking every second (louder while you count the
                  fireworks, and in the dark, when it is the only thing still going); outside through the glass: the
                  harbour, the town, the evening birds, which go quiet early because night comes early
     the balcony  the open air: wind, the harbour 15 m below, the crowd on the promenade waiting for the fireworks
     the street   the harbour road at night: water lapping at the quay behind you, halyards clinking on the masts,
                  the streetlights' buzz, the pub, the town far off
     the Earth    almost nothing: a deep low air
     the lab      the vacuum pump's chug, fans, the lasers' power supplies, a turbo pump's whine
   Sound is never slowed: it is the one thing in the film that tells you what is happening now.
   ===================================================================== */

let SL_PL = null;
function slPl() {
  if (SL_PL) return SL_PL;
  const home = (s) => s.set === 'home' || s.set === 'dark';
  return (SL_PL = {
    home: slPlace(home),
    day: slPlace((s) => s.set === 'home' && ['title', 'rule', 'call', 'map', 'window'].includes(s.mode)),
    balc: slPlace((s) => s.mode === 'fireworks'),
    night: slPlace((s) => s.set === 'dark' || (s.set === 'home' && ['cold', 'laser', 'lamp', 'knock', 'freeze', 'xray', 'after'].includes(s.mode))),
    hall: slPlace((s) => s.mode === 'mirror'),
    street: slPlace((s) => s.set === 'street'),
    globe: slPlace((s) => s.set === 'globe', 0.3),
    lab: slPlace((s) => s.set === 'lab'),
  });
}

slSound('amb', 'places', function (ctx, bus, K) {
  const { fx, sr, r } = K, END = SL.end + 1.5, P = slPl();
  const room = K.verb('room', 1.1, { bright: 0.45, damp: 3.4, wet: 0.45, seed: 21, early: [[0.009, 0.5], [0.017, 0.35], [0.027, 0.25]] });
  const out = K.verb('out', 2.6, { bright: 0.4, damp: 2.6, wet: 0.5, seed: 29, pre: 0.02 });
  const inside = (t) => P.day(t) + P.night(t) + 0.8 * P.hall(t);      // indoors, glass shut
  // the flat after dark: when nothing reaches you, the house is all there is (and you listen harder)
  const darkUp = (t) => slEv(t, SL.stop - 1, SL.stop + 2) * (1 - slEv(t, SL.real - 0.5, SL.real + 1));

  // ---- the flat: room tone, the building's low hum, the fridge (the kitchen is off to the left)
  slBed(K, 0, END, { colour: 'pink', f: [['hp', 60], ['lp', 900]], vol: 0.035, am: 0.12, env: (u, t) => P.home(t) * (1 - 0.4 * P.balc(t)) * (1 + 0.35 * darkUp(t)), fi: 0.02, fo: 0.3 });
  slBed(K, 0, END, { colour: 'brown', f: [['lp', 120]], vol: 0.05, am: 0.25, wr: 0.15, env: (u, t) => P.home(t) * (1 - 0.5 * P.balc(t)), fi: 0.02, fo: 0.3 });
  slTone(K, 0, END, 50, [[1, 0.25], [2, 1], [3, 0.35], [4, 0.3], [6, 0.12], [8, 0.05]], (u, t) => P.home(t) * (1 - 0.7 * P.balc(t)) * (1 - 0.6 * P.hall(t)) * (0.85 + 0.15 * Math.sin(t * 0.37)) * (1 + 0.5 * darkUp(t)), { vol: 0.007, pan: -0.45, f: [['lp', 500]] });

  // ---- the clock on the sideboard: tick, tock, once a second. While you count the first firework's six seconds it
  //      steps forward; in the dark it is the loudest thing in the house
  for (let t = 0.22, i = 0; t < END - 1; t += 1, i++) {
    const h = P.home(t); if (h < 0.05) continue;
    const count = slWn(t, SL.f1 + 0.5, SL.b1 - 0.2, 0.4, 0.4), lvl = 0.016 * h * (inside(t) + 0.55 * P.balc(t) + 1.4 * count) * (1 + 0.9 * darkUp(t)) * (1 - 0.4 * P.hall(t));
    if (lvl < 0.001) continue;
    const b = i % 2 ? 2650 : 3150;
    K.put(fx.hit([[b, 0.01, 1], [b * 1.73, 0.006, 0.6], [b * 2.9, 0.004, 0.35], [b * 0.51, 0.012, 0.4]], { width: 0.00015, noise: 0.3, nhp: 3000 }), t, { vol: lvl, norm: true, pan: 0.5 * (1 - P.hall(t)), room, wet: 0.35 });
  }

  // ---- outside, through the glass (the harbour, the town) and, on the balcony, in the open
  const outLvl = (t) => 0.45 * P.day(t) + 1.6 * P.balc(t) + 0.22 * P.night(t) * (1 - darkUp(t) * 0.5);
  slBed(K, 0, END, { colour: 'pink', f: [['bp', 420, 0.6], ['lp', 1400]], vol: 0.03, am: 0.55, wr: 0.22, env: (u, t) => outLvl(t), fi: 0.02, fo: 0.3 });     // the water, far below
  slBed(K, 0, END, { colour: 'brown', f: [['lp', 380]], vol: 0.035, am: 0.3, wr: 0.1, env: (u, t) => outLvl(t) * (1 - 0.4 * P.balc(t)), fi: 0.02, fo: 0.3 });  // the town
  // the evening birds: a chorus that thins and stops early (the Sun's light is arriving slower; to them, it's dusk)
  for (let t = SL.titleShot + 0.3; t < SL.fw - 1; t += r.range(0.35, 1.3)) {
    const k = P.day(t) * (1 - slEv(t, SL.sun + 0.5, slE('sun') - 1.0)); if (k < 0.04) continue;
    K.put(slChirp(fx, { f0: r.range(2600, 4300) }), t, { vol: 0.009 * k * r.range(0.4, 1), norm: true, pan: r.range(-0.8, 0.2), lp: 5000, room: out, wet: 0.5 });
  }
  for (const t of [21.4, 37.6, 58.2, 69.8]) K.put(slGull(fx), t, { vol: 0.012 * P.day(t), norm: true, pan: r.range(-0.7, 0.3), lp: 3200, room: out, wet: 0.6 });

  // ---- the balcony: the air, and the crowd on the promenade 15 m below (talk, a child, laughter)
  slBed(K, SL.fw - 0.2, SL.street + 0.2, { colour: 'pink', f: [['hp', 180], ['lp', 1600]], vol: 0.022, am: 0.6, wr: 0.3, env: (u, t) => P.balc(t), fi: 0.02, fo: 0.02 });
  slBed(K, SL.fw - 0.2, SL.street + 0.2, { colour: 'pink', f: [['bp', 520, 0.8], ['lp', 1500]], vol: 0.016, am: 0.5, wr: 4.0, env: (u, t) => P.balc(t) * (1 - 0.35 * slWn(t, SL.f1 + 0.6, SL.b1 + 1, 0.5, 1.0)), fi: 0.02, fo: 0.02 });   // murmur
  for (let t = SL.fw + 0.2; t < SL.street - 1; t += r.range(0.25, 0.9)) {
    const woman = r.chance(0.5), y = slVoice(fx, slChatter(r, r.int(2, 6)), { f0: (woman ? 205 : 115) * r.range(0.85, 1.2), fs: woman ? 1.15 : 1, rate: r.range(0.9, 1.15) });
    SLX.bq(y, 'lp', 1900, 0.7, sr);
    K.put(y, t, { vol: 0.006 * r.range(0.5, 1) * P.balc(t) * (1 - 0.5 * slWn(t, SL.f1 + 0.6, SL.b1 + 1, 0.5, 1.0)), norm: true, pan: r.range(-0.9, 0.9), room: out, wet: 0.7 });
  }
  for (const [t, f0] of [[SL.fw + 6.5, 320], [SL.b3 + 0.6, 340]]) { const y = slVoice(fx, 'hahaha haa', { f0, fs: 1.3, rate: 1.4, breathy: 0.5 }); SLX.bq(y, 'lp', 2400, 0.7, sr); K.put(y, t, { vol: 0.007, norm: true, pan: 0.5, room: out, wet: 0.7 }); }

  // ---- the street at night (the harbour road): the water lapping at the quay behind you, the masts' halyards, the
  //      streetlights' buzz, the pub, a far town, gusts off the water
  const st = (u, t) => P.street(t);
  slBed(K, SL.street - 0.2, SL.cat + 0.2, { colour: 'brown', f: [['lp', 220]], vol: 0.06, am: 0.3, wr: 0.12, env: st, fi: 0.02, fo: 0.02 });
  slBed(K, SL.street - 0.2, SL.cat + 0.2, { colour: 'pink', f: [['bp', 380, 0.7], ['lp', 1100]], vol: 0.03, am: 0.8, wr: 0.28, env: st, fi: 0.02, fo: 0.02 });   // lapping
  slBed(K, SL.street - 0.2, SL.cat + 0.2, { colour: 'pink', f: [['hp', 300], ['lp', 2200]], vol: 0.012, am: 0.7, wr: 0.15, env: st, fi: 0.02, fo: 0.02 });   // wind
  for (let t = SL.street + 0.4; t < SL.cat - 0.4; t += r.range(0.6, 1.8)) K.put(fx.liquid(r.range(0.25, 0.5), (x) => Math.exp(-x / 0.12) * Math.min(1, x / 0.01), { f: r.range(350, 700) }), t, { vol: 0.016 * r.range(0.4, 1) * P.street(t), norm: true, pan: r.range(-0.6, 0.6), lp: 2400, room: out, wet: 0.4 });
  for (let t = SL.street + 1.1; t < SL.cat - 0.4; t += r.range(1.2, 3.5)) {      // a halyard: a run of clinks as a mast rocks
    const b = r.range(1700, 2600), pan = r.range(-0.8, 0.8);
    for (let k = 0, tt = t; k < r.int(1, 4); k++, tt += r.range(0.12, 0.3)) K.put(fx.hit(fx.metalModes(b * r.range(0.98, 1.02), 0.7), { width: 0.0002 }), tt, { vol: 0.007 * P.street(tt) * r.range(0.5, 1), norm: true, pan, room: out, wet: 0.8 });
  }
  for (let t = SL.street + 3; t < SL.cat - 1; t += r.range(5, 9)) K.put(fx.creak(r.range(0.5, 0.9), [[r.range(140, 190), 0.03, 1], [r.range(320, 420), 0.02, 0.5]], { rate: [8, 22] }), t, { vol: 0.009 * P.street(t), norm: true, pan: r.range(-0.5, 0.5), room: out, wet: 0.5 });   // a fender
  slTone(K, SL.street - 0.2, SL.cat + 0.2 - (SL.street - 0.2), 100, [[1, 1], [2, 0.5], [3, 0.4], [5, 0.15], [7, 0.1]], (u, t) => P.street(SL.street - 0.2 + t), { vol: 0.0035, pan: 0.2, f: [['hp', 90]] });
  // the pub (THE ANCHOR, up the road): talk and a laugh behind glass
  for (let t = SL.street + 0.5; t < SL.cat - 1; t += r.range(0.4, 1.2)) {
    const woman = r.chance(0.5), y = slVoice(fx, slChatter(r, r.int(2, 5)), { f0: (woman ? 200 : 112) * r.range(0.85, 1.2), fs: woman ? 1.15 : 1 });
    SLX.bq(y, 'lp', 1000, 0.7, sr);
    K.put(y, t, { vol: 0.004 * P.street(t), norm: true, pan: r.range(-0.6, -0.2), room: out, wet: 0.8 });
  }
  { const y = slVoice(fx, 'haha hahaa', { f0: 135, rate: 1.3, breathy: 0.4 }); SLX.bq(y, 'lp', 1100, 0.7, sr); K.put(y, SL.street + 5.2, { vol: 0.006, norm: true, pan: -0.4, room: out, wet: 0.8 }); }
  K.put(slGull(fx), SL.street + 2.5, { vol: 0.008, norm: true, pan: 0.6, lp: 3000, room: out, wet: 0.7 });

  // ---- the Earth from space: a deep, low air under the music
  slBed(K, SL.fast - 0.4, SL.rule + 0.4, { colour: 'brown', f: [['lp', 70]], vol: 0.04, env: (u, t) => P.globe(t), fi: 0.02, fo: 0.02 });
  slBed(K, SL.fast - 0.4, SL.rule + 0.4, { colour: 'pink', f: [['hp', 5000]], vol: 0.003, env: (u, t) => P.globe(t), fi: 0.02, fo: 0.02 });

  // ---- the lab (it fades up with the picture): the vacuum pump's chug, fans, the lasers' power supplies, a whine
  const lb = (t) => P.lab(t) * slEv(t, SL.real, SL.real + 2.2);
  const L0 = SL.real - 0.1, L1 = SL.question + 0.3;
  slTone(K, L0, L1 - L0, 24, [[1, 1], [2, 0.7], [3, 0.5], [4, 0.35], [6, 0.2], [8, 0.1]], (u, t) => lb(L0 + t) * (0.75 + 0.25 * Math.sin(2 * Math.PI * 8 * t)), { vol: 0.045, pan: -0.4, f: [['lp', 600]] });
  slBed(K, L0, L1, { colour: 'pink', f: [['bp', 520, 0.5]], vol: 0.028, am: 0.1, env: (u, t) => lb(t), fi: 0.02, fo: 0.02 });
  slBed(K, L0, L1, { colour: 'pink', f: [['hp', 2200], ['lp', 9000]], vol: 0.006, env: (u, t) => lb(t), fi: 0.02, fo: 0.02 });
  slTone(K, L0, L1 - L0, 120, [[1, 0.6], [2, 1], [3, 0.5], [4, 0.25], [8, 0.08]], (u, t) => lb(L0 + t), { vol: 0.006, pan: 0.35, f: [['hp', 100]] });
  slTone(K, L0, L1 - L0, 1250, [[1, 1], [1.004, 0.8], [2, 0.15]], (u, t) => lb(L0 + t) * (0.7 + 0.3 * Math.sin(t * 0.8)), { vol: 0.0022, pan: 0.15 });
  for (const [t, f] of [[SL.lab + 0.4, 2400], [SL.lab + 0.55, 2400], [327.2, 1800]]) K.put(fx.beep(f, 0.07), t, { vol: 0.006 * lb(t), norm: true, pan: 0.5, room, wet: 0.3 });
  // the house again at the end (night outside, the clock already ticking above): a car going by on the road below
  slBed(K, SL.question + 3.5, SL.question + 10.5, { colour: 'pink', f: [['bp', 450, 0.6], ['lp', 1100]], vol: 0.02, mono: true, pan: -0.3, env: (u) => Math.pow(Math.sin(Math.PI * u), 2), fi: 0.3, fo: 0.3 });
});
