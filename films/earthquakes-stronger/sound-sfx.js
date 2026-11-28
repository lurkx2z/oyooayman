/* =====================================================================
   SOUND · EFFECTS — the earthquake itself, and everything it breaks, each at its story moment:
     the quake     wherever you stand: the ground's rumble and the city rattling at the shaking's own rhythm, a
                   jolt on every tick; in the air it can't reach you (until minute nine: "even the air is shaking");
                   the other cities shake with their own earthquakes; from space, a deep floor
     the café      the cup's ripples; the shelves at magnitude five; the phones' emergency alert; the crowd; your run
     the street    the windows, the chimneys, the car alarms, the streetcar off its rails, the mud, the bricks, the
                   split, the pier breaking up
     the helicopter  the door, the turbine winding up for two minutes, the rotor's blade slap, lift-off
     from the air  the Bay Bridge, 1906's fires, the Pyramid, the Golden Gate, the bay draining and the wave
     the world     the Hollywood letters, the dam, the Needle, Tokyo's power lines, Dubai's glass, the Bosphorus
     the end       the planet cracking, the rock melting, the dinosaurs' asteroid; then almost nothing
   Everything synthesised from seeded noise and maths. No breathing loop (a gasp only as a short accent).
   ===================================================================== */

const eqFilm = (s) => s + EQ.tick0;                                   // story seconds → film seconds
// the place mix at film time t (0…1 each), sampled once
function eqPlaceCurves() {
  if (eqPlaceCurves._c) return eqPlaceCurves._c;
  return (eqPlaceCurves._c = { street: eqCurve(eqPlaceAt('street')), cabin: eqCurve(eqPlaceAt('cabin')), air: eqCurve(eqPlaceAt('air')), world: eqCurve(eqPlaceAt('world')), space: eqCurve(eqPlaceAt('space')) });
}
// the rumble's loudness for a shaking level (EQ_AMP's units): small quakes barely heard, big ones a roar
const eqRumbleK = (L) => Math.min(1.15, Math.pow(Math.max(0, L) / 0.2, 0.6));
// which earthquake a world shot shows
const EQ_WORLD_Q = { la: 'la', mexico: 'mexico', jelly: 'mexico', dam: 'nevada', needle: 'seattle', tokyo: 'tokyo', dubai: 'zagros', istanbul: 'istanbul' };
const EQ_WORLD_FAR = { dam: 0.8, dubai: 0.55 };

eqSound('sfx', 'quake', function (ctx, bus, K) {
  const fx = K.fx, sr = fx.sr, P = eqPlaceCurves(), putLR = ([L, R], t, o = {}) => K.putLR(L, R, t, o), put = (x, t, o = {}) => K.put(x, t, o);
  const lift = eqFilm(EQ_HT.lift), room = K.verb('city', 2.2, { bright: 0.4, damp: 3, wet: 0.3, seed: 21 });
  // ---- the ground under you (the street, and the helicopter until it lifts): rumble + the city rattling
  const ground = eqCurve((t) => { const s = eqS(t), L = eqLevel(s); return eqRumbleK(L) * (P.street(t) + P.cabin(t) * (t < lift ? 0.7 : 0)); });
  { const a = eqShotOf('cafeWide').t0, b = lift + 3;
    putLR(eqBed(fx, a, b, 'brown', 18, 170, (t) => 1.1 * ground(t), { wobble: 0.6, depth: 0.25 }), a, { vol: 0.55 });
    // the rattle: windows, signs, tables, at the shaking's own rhythm (the ground's frequency)
    const rat = eqCurve((t) => { const s = eqS(t), M = Math.min(12, eqMagOf(s)); if (M < 4) return 0; const f = EQ_HZ[M]; return Math.pow(ground(t), 1.3) * (0.35 + 0.65 * Math.pow(Math.abs(Math.sin(Math.PI * f * s)), 3)); }, 400);
    putLR(eqBed(fx, a, b, 'pink', 600, 4200, (t) => 0.22 * rat(t), { wobble: 3, depth: 0.4 }), a, { vol: 0.5 });
    putLR(eqBed(fx, a, b, 'brown', 120, 600, (t) => 0.5 * rat(t), { wobble: 2, depth: 0.4 }), a, { vol: 0.5 }); }
  // ---- the other cities: each its own earthquake's rumble
  { const shots = EQ_SHOTS.filter((sh) => sh.set === 'world');
    for (const sh of shots) {
      const q = EQ_WORLD_Q[sh.mode], far = EQ_WORLD_FAR[sh.mode] || 1, a = sh.t0 - 0.1, b = sh.t1 + 0.1;
      putLR(eqBed(fx, a, b, 'brown', 18, 200, (t) => 1.0 * eqRumbleK(eqQLevel(q, eqS(t), far)) * eqWn(t, sh.t0, sh.t1, 0.05, 0.05), { wobble: 0.8, depth: 0.3 }), a, { vol: 0.55 });
      putLR(eqBed(fx, a, b, 'pink', 300, 2500, (t) => 0.18 * eqRumbleK(eqQLevel(q, eqS(t), far)) * eqWn(t, sh.t0, sh.t1, 0.05, 0.05), { wobble: 2.5, depth: 0.5 }), a, { vol: 0.5 });
    } }
  // ---- space: a deep floor that grows with the magnitude (the cracks glowing)
  { for (const sh of EQ_SHOTS.filter((x) => x.set === 'globe')) { const a = Math.max(0, sh.t0 - 0.1), b = sh.t1 + 0.1, s0 = sh.s !== undefined ? sh.s : eqS(sh.t0);
    putLR(eqBed(fx, a, b, 'brown', 16, 110, (t) => 0.6 * Math.min(1, 0.25 + 0.075 * Math.max(0, eqMagOf(sh.s !== undefined ? s0 : eqS(t)) - 3)) * eqWn(t, sh.t0, sh.t1, 0.05, 0.05), { wobble: 0.4, depth: 0.3 }), a, { vol: 0.5 }); } }
  // ---- minute nine: "Now even the air is shaking": a pressure throb you feel in the cabin
  { const a = eqW('air') - 0.3, b = eqTick(10) + 6, n = Math.ceil((b - a) * sr), L = new Float32Array(n), R = new Float32Array(n); let ph = 0;
    const z = eqNoise(fx, n, 'pink'); EQX.bq(z, 'lp', 400, 0.7, sr);
    for (let i = 0; i < n; i++) { const t = a + i / sr, k = eqEv(t, a, a + 1.5) * (P.cabin(t) + P.air(t) * 0.8); ph += 2 * Math.PI * (19 + 3 * Math.sin(t * 0.7)) / sr; const am = 0.5 + 0.5 * Math.sin(2 * Math.PI * 7.5 * t); L[i] = (Math.sin(ph) * 0.6 + z[i] * 1.6 * am) * k; R[i] = (Math.sin(ph + 0.3) * 0.6 + z[i] * 1.6 * am) * k; }
    putLR([L, R], a, { vol: 0.32 }); }
  // ---- every tick: the jolt (on the ground a crack and a thump; from the air a far boom rolling up)
  for (let k = 2; k <= 10; k++) {
    const t = eqTick(k), g = P.street(t + 0.1) + P.cabin(t + 0.1) * (t < lift ? 1 : 0.4), far = 1 - Math.min(1, g), v = 0.5 + 0.05 * k;
    put(eqThump(fx, 52, 22, 0.55 + 0.07 * k, { click: 0.6 * g, clickHz: 1800 }), t, { vol: v * (0.6 + 0.4 * g) });
    putLR(eqBed(fx, 0, 3.5, 'brown', 25, 400, (u) => Math.min(1, u / 0.03) * Math.exp(-u / (0.7 + 0.08 * k)) * 2.0), t + 0.01, { vol: 0.45 * v });
    if (g > 0.3) { put(fx.hit(fx.stoneModes(0.8), { width: 0.002, noise: 0.5, nlen: 0.04, nhp: 700 }), t + 0.02, { vol: 0.45 * g, room, wet: 0.5 });
      put(fx.rustle(1.4, { density: 260, rub: 0.15, lo: 700, hi: 6000, grain: 0.01, env: (u) => Math.pow(1 - u, 1.5) * Math.min(1, u * 10) }), t + 0.15, { vol: 0.35 * g, room, wet: 0.4, pan: 0.2 }); }
    if (far > 0.5) putLR(eqWhoosh(fx, 2.2, 40, 160, 50, { peak: 0.2, q: 0.7, colour: 'brown' }), t - 0.1, { vol: 0.4 * far });
  }
  // ---- the open (magnitude twelve, in the helicopter): the roar and the planet cracking, cut at the cut
  { const tc = eqShotOf('cafeWide').t0;
    putLR(eqBed(fx, 0, tc + 0.02, 'brown', 18, 300, (t) => Math.min(1, t / 0.02) * 1.6, { wobble: 1.5, depth: 0.3 }), 0, { vol: 0.5, stop: tc + 0.01, fade: 0.01 });
    putLR(eqBed(fx, 0, tc + 0.02, 'pink', 400, 3000, () => 0.35, { wobble: 4, depth: 0.5 }), 0, { vol: 0.5, stop: tc + 0.01, fade: 0.01 });
    put(eqThump(fx, 46, 20, 1.2, { click: 0.4, clickHz: 900 }), 0.02, { vol: 0.8, stop: tc + 0.01, fade: 0.01 });
    put(fx.creak(tc, fx.stoneModes(0.5), { rate: [40, 160], env: (u) => 1 - 0.3 * u }), 0.3, { vol: 0.4, stop: tc + 0.01, fade: 0.01 }); }
});

eqSound('sfx', 'street', function (ctx, bus, K) {
  const fx = K.fx, sr = fx.sr, P = eqPlaceCurves(), r = new RNG(CONFIG.seed + 707), room = K.verb('street', 1.6, { bright: 0.5, damp: 3.5, wet: 0.22, seed: 11 });
  const put = (x, t, o = {}) => K.put(x, t, o), putLR = ([L, R], t, o = {}) => K.putLR(L, R, t, o), F = eqFilm, B = (m) => eqShotOf(m).t0, W = (id, k = 0) => eqW(id, k), wd = (id, x, i = 0) => eqWord(id, x, i).start;
  const lift = F(EQ_HT.lift);
  // what you hear of the street from where the camera is (inside the helicopter: muffled)
  const near = (t) => P.street(t) + 0.35 * P.cabin(t) * (t < lift ? 1 : 0);
  const o = (t, v, x = {}) => Object.assign({ vol: v * near(t), room, wet: 0.35 }, P.cabin(t) > 0.5 ? { lp: 900 } : {}, x);
  // ---- the cup on your table: tiny clinks as it ripples (minute one), the spoon rattling (minute two on)
  for (const [a, b, n] of [[B('cupRipple') + 0.6, B('faceFelt'), 5], [B('cup') + 0.2, B('calmWide'), 9], [eqTick(2), eqTick(2) + 3, 8]]) for (let i = 0; i < n; i++) { const t = r.range(a, b); put(fx.hit(fx.cupModes(r.range(0.98, 1.02)), { width: 0.0003, amp: r.range(0.3, 1) }), t, { vol: 0.05 * r.range(0.5, 1), pan: 0.15 }); }
  // ---- "It feels like a truck rumbling past"
  putLR(eqWhoosh(fx, 4.5, 40, 220, 60, { peak: 0.5, q: 0.7, colour: 'brown', p0: -0.6, p1: 0.6 }), W('truck') - 0.4, { vol: 0.35 });
  // ---- the birds leave: a flurry of wings
  { const t0 = B('birds') + 0.2; for (let i = 0; i < 26; i++) put(fx.rustle(0.09, { density: 900, rub: 0.5, lo: 300, hi: 2500, grain: 0.004 }), t0 + r.range(0, 2.2), { vol: 0.12, pan: r.range(-0.8, 0.8) }); }
  // ---- magnitude five: the café's shelves go (cups and bottles), the tables walk
  { const t0 = F(EQ_WFT.shelves); for (let i = 0; i < 7; i++) { const s = fx.smash({ v: r.range(3.5, 5.5), g: 9.8, pan: r.range(-0.5, 0.2), len: 1.6, pitch: r.range(0.8, 1.3) }); putLR([s.L, s.R], t0 + 0.2 + r.range(0, 1.4), o(t0, 0.26)); }
    put(fx.creak(2.2, fx.woodModes(160, 1), { rate: [20, 60] }), t0, o(t0, 0.2)); }
  // ---- every phone goes off at once: the emergency alert's two tones (853 + 960 Hz) on a dozen phones
  { const t0 = W('alert') + 0.35, alert = (d) => { const n = Math.ceil(d * sr), y = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / sr, on = (t % 1.25) < 1.0 ? 1 : 0; y[i] = (Math.sin(2 * Math.PI * 853 * t) + Math.sin(2 * Math.PI * 960 * t)) * 0.5 * on; } EQX.bq(y, 'lp', 2600, 0.7, sr); EQX.bq(y, 'hp', 500, 0.7, sr); for (let i = 0; i < n; i++) y[i] *= Math.min(1, i / (0.01 * sr), (n - i) / (0.3 * sr)); return y; };
    for (let i = 0; i < 12; i++) { const d = r.range(4, 6.5), t = t0 + r.range(0, 0.5) + (i === 0 ? -0.3 : 0); put(alert(d), t, Object.assign(o(t, i === 0 ? 0.16 : 0.07), { pan: i === 0 ? 0.1 : r.range(-0.9, 0.9), wet: 0.5 })); } }
  // ---- the crowd: voices in the street (a murmur growing to shouts), a scream or two; feet running
  { const a = W('crowd') - 1, b = lift;
    putLR(eqBed(fx, a, b, 'pink', 280, 2400, (t) => 0.3 * near(t) * eqEv(t, a, a + 2) * (0.6 + 0.4 * eqEv(t, W('never'), W('run'))), { wobble: 4.5, depth: 0.7 }), a, { vol: 0.45, room, wet: 0.3 });
    for (const t of [W('crowd') + 0.8, W('run') + 0.6, F(EQ_WFT.glass) + 0.5, F(EQ_WFT.brick) + 1.0]) put(fx.breath(0.7, { voice: 0.9, f0: r.range(520, 700), env: (u) => Math.sin(Math.PI * Math.pow(u, 0.4)) }), t, o(t, 0.08, { pan: r.range(-0.7, 0.7) }));
    for (let t = W('crowd'); t < W('drop'); t += r.range(0.12, 0.3)) put(fx.step({ weight: r.range(0.2, 0.4), s: 1 }), t, o(t, 0.06, { pan: r.range(-0.8, 0.8) })); }
  // ---- you run, down the pier to the helicopter (wooden boards)
  for (let t = W('run') + 0.2; t < B('jolt6') - 0.2; t += 0.31) put(fx.woodStep ? fx.woodStep({}) : fx.step({ weight: 0.5 }), t, o(t, 0.22, { pan: 0 }));
  // ---- magnitude six: the windows burst; the chimneys fall; every car alarm
  { const tg = F(EQ_WFT.glass); for (let i = 0; i < 9; i++) { const s = fx.smash({ v: r.range(6, 9), g: 9.8, pan: r.range(-0.8, 0.8), len: 2.2, pitch: r.range(0.55, 0.9) }); putLR([s.L, s.R], tg + r.range(0, 0.9), o(tg, 0.2)); }
    put(fx.rustle(3.5, { density: 500, rub: 0.1, lo: 2500, hi: 9000, grain: 0.004, env: (u) => Math.pow(1 - u, 1.3) * Math.min(1, u * 15) }), tg + 0.3, o(tg, 0.3));
    const tc = F(EQ_WFT.chimneys); for (let i = 0; i < 4; i++) { const t = tc + i * 0.4 + r.range(0, 0.2); put(fx.hit(fx.stoneModes(r.range(0.6, 0.9)), { width: 0.003, noise: 0.6, nlen: 0.05, nhp: 500 }), t + 1.1, o(t, 0.4)); put(eqThump(fx, 70, 35, 0.2, { click: 0.4 }), t + 1.1, o(t, 0.3)); put(fx.rustle(1.2, { density: 300, rub: 0.2, lo: 400, hi: 4000, grain: 0.01, env: (u) => Math.pow(1 - u, 2) }), t + 1.15, o(t, 0.25)); }
    const ta = F(EQ_WFT.alarms); [[880, 1180, 0.38, 0], [700, 1400, 1.1, 1], [990, 1320, 0.22, 0], [600, 900, 0.6, 1], [1100, 1500, 0.3, 0]].forEach(([f1, f2, per, wh], i) => { const t = ta + i * 0.35, d = lift - t + 4; put(eqAlarm(fx, d, { f1, f2, per, whoop: !!wh }), t, Object.assign(o(t, 0.032), { pan: [-0.6, 0.5, -0.2, 0.8, 0.1][i], stop: lift + 6, fade: 3 })); }); }
  // ---- the streetcar jumps its rails: a screech, a heavy clank, the thump of its wheels on the road
  { const t = F(EQ_WFT.tram); put(fx.creak(1.4, fx.metalModes(1450, 0.4), { rate: [180, 420], env: (u) => Math.sin(Math.PI * Math.pow(u, 0.5)) }), t, o(t, 0.13, { pan: 0.4 })); put(fx.hit(fx.metalModes(320, 1.2), { width: 0.002, noise: 0.4, nlen: 0.03, nhp: 800 }), t + 0.9, o(t, 0.24)); put(eqThump(fx, 60, 28, 0.3, { click: 0.6 }), t + 0.95, o(t, 0.24)); }
  // ---- into the helicopter: the door, your belt
  { const t = W('in') + 1.2; put(fx.hit(fx.panelModes(0.8), { width: 0.002, noise: 0.3, nlen: 0.02, nhp: 900 }), t, { vol: 0.3, pan: 0.3 }); put(fx.clamp({}), t + 0.9, { vol: 0.18, pan: 0.2 }); }
  // ---- the mud: sand boils, gurgling; the cars sinking (a metal groan)
  { const t0 = F(EQ_WFT.wet); for (let t = t0; t < lift; t += r.range(0.4, 1.2)) put(fx.liquid(r.range(0.4, 0.9), (u) => Math.sin(Math.PI * Math.min(1, u / 0.6)) * 0.8, { f: r.range(250, 500) }), t, o(t, 0.18, { pan: r.range(-0.8, 0.8) }));
    const ts = F(EQ_WFT.sink); put(fx.creak(3.2, fx.metalModes(210, 1.5), { rate: [12, 30], env: (u) => Math.sin(Math.PI * u) }), ts, o(ts, 0.3, { pan: 0.4 })); }
  // ---- magnitude seven: the old brick building comes down; the road splits; the pier breaks up
  { const tb = F(EQ_WFT.brick); putLR(eqBed(fx, 0, 5, 'brown', 30, 1200, (u) => Math.min(1, u / 0.1) * Math.exp(-u / 1.4) * 2.4), tb + 0.3, o(tb, 0.55));
    for (let i = 0; i < 14; i++) put(fx.hit(fx.stoneModes(r.range(0.5, 1.2)), { width: 0.003, noise: 0.5, nlen: 0.04, nhp: 600 }), tb + 0.4 + r.range(0, 2.5), o(tb, 0.25, { pan: r.range(-0.7, 0.7) }));
    const tp = wd('split', 'splits') - 0.1; put(fx.creak(3.0, fx.stoneModes(0.45), { rate: [50, 200], env: (u) => Math.min(1, u * 6) * (1 - u) }), tp, o(tp, 0.5)); put(eqThump(fx, 48, 20, 0.8, { click: 0.9, clickHz: 1400 }), tp + 0.2, o(tp, 0.6));
    const tq = F(EQ_WFT.pier); for (let i = 0; i < 6; i++) { const t = tq + i * 0.7 + r.range(0, 0.3); put(fx.creak(0.8, fx.woodModes(r.range(120, 200), 1.4), { rate: [40, 140] }), t, { vol: 0.35, room, wet: 0.3, pan: r.range(-0.6, 0.6) }); put(fx.hit(fx.woodModes(r.range(90, 140), 1.5), { width: 0.004, noise: 0.5, nlen: 0.03, nhp: 400 }), t + 0.6, { vol: 0.35, room }); putLR(eqWhoosh(fx, 1.2, 300, 1500, 400, { peak: 0.15, q: 0.6 }), t + 0.9, { vol: 0.15 }); } }
});

eqSound('sfx', 'helicopter', function (ctx, bus, K) {
  const fx = K.fx, sr = fx.sr, P = eqPlaceCurves(), F = eqFilm, put = (x, t, o = {}) => K.put(x, t, o);
  const t0 = F(EQ_HT.start), t1 = EQ.end + 1, n = Math.ceil((t1 - t0) * sr);
  // the blade slap: a soft thud every time a blade passes (two blades), at the rotor's own speed; the turbine's whine
  // over it; outside, loud; in the cabin, through headsets (muffled); from the other cities and space, nothing
  const heard = eqCurve((t) => P.cabin(t) * 0.55 + P.street(t) * 0.9 + P.air(t) * 0.75);
  const slap = new Float32Array(n), whine = new Float32Array(n);
  let last = 0, ph1 = 0, ph2 = 0;
  for (let i = 0; i < n; i++) {
    const t = t0 + i / sr, s = eqS(t), rev = eqRotorRev(s), ang = eqRotorAngle(s), pass = Math.floor(ang / Math.PI), h = heard(t);
    if (pass > last) { last = pass; const amp = Math.min(1, rev / 6.4) * h, len = Math.round(0.045 * sr); for (let j = 0; j < len && i + j < n; j++) slap[i + j] += amp * Math.sin(2 * Math.PI * 70 * j / sr) * Math.exp(-j / (0.012 * sr)); }
    const w = Math.min(1, rev / 6.4); ph1 += 2 * Math.PI * (900 + 3600 * Math.pow(w, 0.7)) / sr; ph2 += 2 * Math.PI * (1800 + 7200 * Math.pow(w, 0.7)) / sr;
    whine[i] = (Math.sin(ph1) * 0.6 + Math.sin(ph2) * 0.25) * (0.15 + 0.85 * Math.min(1, (t - t0) / 6)) * h * 0.3;
  }
  EQX.bq(slap, 'lp', 600, 0.7, sr);
  put(slap, t0, { vol: 0.5 }); put(whine, t0, { vol: 0.05 });
  // the turbine's air: a broadband roar that rises with the rotor
  const [L, R] = eqBed(fx, t0, t1, 'pink', 200, 3500, (t) => 0.25 * Math.min(1, eqRotorRev(eqS(t)) / 6.4) * heard(t), { wobble: 0.6, depth: 0.2 });
  K.putLR(L, R, t0, { vol: 0.5 });
  // the starter: a whir and a click as the pilot starts it
  put(fx.hit(fx.metalModes(1900, 0.3), { width: 0.0005 }), t0 - 0.1, { vol: 0.15 });
});

eqSound('sfx', 'air', function (ctx, bus, K) {
  const fx = K.fx, sr = fx.sr, P = eqPlaceCurves(), r = new RNG(CONFIG.seed + 909), F = eqFilm, B = (m) => eqShotOf(m).t0, W = (id, k = 0) => eqW(id, k), wd = (id, x, i = 0) => eqWord(id, x, i).start;
  const put = (x, t, o = {}) => K.put(x, t, o), putLR = ([L, R], t, o = {}) => K.putLR(L, R, t, o), far = K.verb('far', 3.5, { bright: 0.3, damp: 2, wet: 0.5, seed: 31 });
  const crash = (t, v, o = {}) => { putLR(eqBed(fx, 0, o.len || 5, 'brown', 25, o.hi || 900, (u) => Math.min(1, u / 0.15) * Math.exp(-u / (o.dk || 1.5)) * 2.4), t, { vol: v }); for (let i = 0; i < (o.n || 8); i++) put(fx.hit(fx.stoneModes(r.range(0.4, 0.8)), { width: 0.004, noise: 0.5, nlen: 0.05, nhp: 400 }), t + r.range(0, 2), { vol: v * 0.4, room: far, wet: 0.6, pan: r.range(-0.6, 0.6), lp: 2400 }); };
  // ---- the Ferry Building's tower; the Bay Bridge's deck drops (1989 again)
  crash(F(EQ_FAIL.ferryTower) + 1.5, 0.3);
  { const t = F(EQ_FAIL.bayPiece); put(fx.creak(2.5, fx.metalModes(140, 2), { rate: [10, 30], env: (u) => Math.sin(Math.PI * u) }), t - 1, { vol: 0.35, room: far, wet: 0.6, lp: 1500 }); crash(t + 1.0, 0.35, { hi: 600 }); putLR(eqWhoosh(fx, 2.5, 200, 1200, 300, { peak: 0.1, q: 0.5 }), t + 2.2, { vol: 0.2 }); }
  // ---- 1906 again: the fires (a crackle under the aerials)
  { const a = W('fires') - 0.5, b = eqW('phone'); const y = fx.rustle(b - a, { density: 140, rub: 0.06, lo: 800, hi: 6000, grain: 0.003, env: (u) => Math.min(1, u * 8) * (1 - Math.pow(u, 6)) }); put(y, a, { vol: 0.25 }); }
  // ---- the Pyramid; the Golden Gate (the cables snap, the deck falls into the strait)
  crash(F(EQ_FAIL.pyramid) + 1.6, 0.42, { n: 12 });
  { const t = F(EQ_FAIL.gg); for (let i = 0; i < 6; i++) put(fx.hit(fx.metalModes(r.range(380, 700), 2.5), { width: 0.0008 }), t + i * 0.35 + r.range(0, 0.2), { vol: 0.25, room: far, wet: 0.5, pan: r.range(-0.6, 0.6) });
    crash(t + 2.4, 0.4, { hi: 700 }); putLR(eqWhoosh(fx, 3, 150, 900, 200, { peak: 0.12, q: 0.5 }), t + 3.4, { vol: 0.3 }); }
  // ---- your phone: it buzzes; a ping for every city
  { const t0 = B('phoneLap') + 0.1, n = Math.ceil(0.5 * sr), y = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / sr; y[i] = Math.sin(2 * Math.PI * 165 * t) * (Math.sin(2 * Math.PI * 22 * t) > 0 ? 1 : 0.2) * Math.min(1, t / 0.01, (0.5 - t) / 0.02); }
    put(y, t0, { vol: 0.12 }); put(y, t0 + 0.7, { vol: 0.12 });
    for (const w of ['los', 'tokyo', 'mexico', 'istanbul']) { const t = wd('phone', w) - 0.1; put(fx.beep(1568, 0.07), t, { vol: 0.05, pan: 0.1 }); put(fx.beep(2093, 0.1), t + 0.08, { vol: 0.045, pan: 0.1 }); } }
  // ---- the bay drains (a long sucking roar out to sea), and the wave comes back over the Embarcadero
  { const a = W('empty') - 1, b = W('back') - 0.3; const [L, R] = eqWhoosh(fx, b - a, 900, 300, 120, { peak: 0.75, q: 0.6, colour: 'pink', p0: 0.3, p1: -0.3 }); putLR([L, R], a, { vol: 0.45 });
    putLR(eqBed(fx, a, b, 'brown', 30, 300, (t) => 0.8 * eqEv(t, a, b), { wobble: 0.8 }), a, { vol: 0.45 });
    const w = W('back'), c = W('cafe') + 0.4;
    putLR(eqBed(fx, w - 0.4, c + 5, 'pink', 80, 5000, (t) => 0.9 * eqEv(t, w - 0.4, c) * (1 - eqEv(t, c + 1, c + 5)), { wobble: 1.5, depth: 0.4 }), w - 0.4, { vol: 0.5 });
    putLR(eqBed(fx, w - 0.4, c + 5, 'brown', 25, 400, (t) => 1.2 * eqEv(t, w - 0.4, c) * (1 - eqEv(t, c + 1.5, c + 5)), { wobble: 0.6 }), w - 0.4, { vol: 0.5 });
    put(eqThump(fx, 50, 22, 1.0, { click: 0.6, clickHz: 1200 }), c, { vol: 0.6 });
    put(fx.rustle(3, { density: 600, rub: 0.5, lo: 400, hi: 8000, grain: 0.006, env: (u) => Math.pow(1 - u, 1.2) }), c + 0.05, { vol: 0.35 }); }
});

eqSound('sfx', 'world', function (ctx, bus, K) {
  const fx = K.fx, sr = fx.sr, r = new RNG(CONFIG.seed + 1111), F = eqFilm, B = (m) => eqShotOf(m).t0, W = (id, k = 0) => eqW(id, k), wd = (id, x, i = 0) => eqWord(id, x, i).start;
  const put = (x, t, o = {}) => K.put(x, t, o), putLR = ([L, R], t, o = {}) => K.putLR(L, R, t, o), far = K.verb('far2', 3.0, { bright: 0.35, damp: 2.2, wet: 0.5, seed: 41 });
  const inShot = (mode, t) => { const sh = eqShotOf(mode); return t >= sh.t0 - 0.2 && t <= sh.t1 + 0.5; };
  // a whoosh into every city (a new place)
  for (const sh of EQ_SHOTS.filter((x) => x.set === 'world' && x.mode !== 'jelly')) putLR(eqWhoosh(fx, 1.1, 250, 2200, 400, { peak: 0.75, q: 0.9, p0: -0.5, p1: 0.4 }), sh.t0 - 0.8, { vol: 0.16 });
  // ---- the Hollywood letters: each one bangs down on the hillside (sheet metal), the slope slides
  { const order = [3, 0, 6, 1, 8, 4, 7, 2, 5]; for (let i = 0; i < 9; i++) { const k = order.indexOf(i); if (k >= 7) continue; const t = F(402.4 + k * 0.42 + 0.15 * hash1(i * 5) + 1.5); if (!inShot('la', t)) continue;
    put(fx.hit(fx.panelModes(1.6), { width: 0.003, noise: 0.5, nlen: 0.03, nhp: 600 }), t, { vol: 0.32, room: far, wet: 0.4, pan: -0.6 + 0.15 * i }); put(eqThump(fx, 70, 32, 0.25, { click: 0.4 }), t, { vol: 0.3 }); }
    putLR(eqBed(fx, 0, 4, 'brown', 40, 1500, (u) => Math.min(1, u / 0.3) * Math.exp(-u / 1.5) * 1.6), F(403.2), { vol: 0.3 }); }
  // ---- the dam: the concrete cracks; the top breaks away; Lake Mead's roar
  { const a = F(453.4); for (let i = 0; i < 5; i++) put(fx.hit(fx.stoneModes(r.range(0.5, 0.8)), { width: 0.001, noise: 0.6, nlen: 0.02, nhp: 1200 }), a + i * 0.55, { vol: 0.3, room: far, wet: 0.5, pan: r.range(-0.5, 0.5) });
    const br = F(456.6); put(eqThump(fx, 55, 24, 0.7, { click: 0.7 }), br, { vol: 0.45 }); const sh = eqShotOf('dam');
    putLR(eqBed(fx, br, sh.t1 + 0.3, 'pink', 120, 6000, (t) => 0.9 * eqEv(t, br, br + 1.5) * eqWn(t, sh.t0, sh.t1, 0.05, 0.05), { wobble: 1.2, depth: 0.3 }), br, { vol: 0.5 });
    putLR(eqBed(fx, br, sh.t1 + 0.3, 'brown', 30, 400, (t) => 1.0 * eqEv(t, br, br + 1.5) * eqWn(t, sh.t0, sh.t1, 0.05, 0.05), { wobble: 0.6 }), br, { vol: 0.5 }); }
  // ---- the Space Needle: its steel groans as it sways, then it goes over
  { const sh = eqShotOf('needle'), fall = F(461.9); put(fx.creak(fall - sh.t0 + 0.5, fx.metalModes(95, 2.5), { rate: [6, 18], env: (u) => 0.4 + 0.6 * u }), sh.t0, { vol: 0.3, room: far, wet: 0.4 });
    for (let i = 0; i < 4; i++) put(fx.hit(fx.metalModes(r.range(220, 400), 2), { width: 0.002 }), fall + 0.4 + i * 0.3, { vol: 0.25, room: far, wet: 0.5 });
    putLR(eqBed(fx, 0, 4.5, 'brown', 25, 900, (u) => Math.min(1, u / 0.2) * Math.exp(-u / 1.4) * 2.2), fall + 2.6, { vol: 0.42, stop: sh.t1 + 0.3, fade: 0.2 }); }
  // ---- Tokyo at 2 AM: the power lines arc and the transformers bang; the city's hum dies
  { const sh = eqShotOf('tokyo'), out = F(500.2);
    const n = Math.ceil((sh.t1 - sh.t0 + 0.4) * sr), hum = new Float32Array(n); for (let i = 0; i < n; i++) { const t = sh.t0 + i / sr; hum[i] = (Math.sin(2 * Math.PI * 100 * t) + 0.5 * Math.sin(2 * Math.PI * 200 * t) + 0.25 * Math.sin(2 * Math.PI * 300 * t)) * (t < out ? 1 : Math.max(0, 1 - (t - out) * 3)) * Math.min(1, (t - sh.t0 + 0.1) / 0.2); }
    put(hum, sh.t0, { vol: 0.03 });
    for (let i = 0; i < 9; i++) { const t = F(497 + r.range(0, 5.5)); if (t > sh.t1) continue; const d = r.range(0.25, 0.7), z = eqNoise(fx, Math.ceil(d * sr), 'white'); for (let j = 0; j < z.length; j++) z[j] *= (Math.sin(2 * Math.PI * 50 * j / sr) > 0.3 ? 1 : 0.25) * Math.min(1, (z.length - j) / (0.05 * sr)) * (r.next() < 0.002 ? 3 : 1); EQX.bq(z, 'bp', r.range(1500, 4000), 0.8, sr);
      put(z, t, { vol: 0.07, room: far, wet: 0.4, pan: r.range(-0.8, 0.8) }); if (i % 3 === 0) put(eqThump(fx, 80, 40, 0.18, { click: 0.6, clickHz: 3000 }), t, { vol: 0.25, room: far, wet: 0.5 }); } }
  // ---- Dubai: the glass comes off the facade (a high rain of shards far away); the tower's long sway
  { const sh = eqShotOf('dubai'), a = F(505.2); put(fx.rustle(sh.t1 - a + 0.3, { density: 900, rub: 0.05, lo: 3500, hi: 11000, grain: 0.002, env: (u) => Math.min(1, u * 4) }), a, { vol: 0.11, room: far, wet: 0.5, stop: sh.t1 + 0.3, fade: 0.2 });
    put(fx.creak(sh.t1 - sh.t0, fx.metalModes(70, 3), { rate: [4, 10], env: () => 0.7 }), sh.t0, { vol: 0.22 }); }
  // ---- Istanbul: the bridge's deck twists (steel groaning), pieces fall into the Bosphorus
  { const sh = eqShotOf('istanbul'); put(fx.creak(sh.t1 - F(510.5), fx.metalModes(120, 2.5), { rate: [8, 25], env: (u) => Math.min(1, u * 3) }), F(510.5), { vol: 0.2, room: far, wet: 0.4 });
    for (let i = 27; i <= 31; i++) { const t = F(513.4 + (i - 27) * 0.25); put(fx.hit(fx.metalModes(r.range(300, 520), 1.5), { width: 0.002 }), t, { vol: 0.22, room: far, wet: 0.5, pan: r.range(-0.5, 0.5) });
      const tw = t + Math.sqrt(2 * 68 / 9.8); if (tw < sh.t1 + 0.3) putLR(eqWhoosh(fx, 1.6, 200, 1400, 300, { peak: 0.08, q: 0.5 }), tw, { vol: 0.22 }); } }
  // ---- the fuel: the panel's soft chime
  { const t = wd('fuel', 'fuel') + 0.2; put(fx.beep(1175, 0.12), t, { vol: 0.05 }); put(fx.beep(1175, 0.12), t + 0.25, { vol: 0.05 }); }
  // ---- minute ten: the planet cracking; the rock melting along the cracks; the dinosaurs' asteroid; then quiet
  { putLR(eqWhoosh(fx, 3, 60, 300, 80, { peak: 0.4, q: 0.6, colour: 'brown' }), W('sun') - 0.5, { vol: 0.4 });
    for (let i = 0; i < 5; i++) put(fx.creak(1.4, fx.stoneModes(0.3), { rate: [30, 120] }), wd('cracking', 'cracking') + i * 0.9, { vol: 0.35, room: far, wet: 0.5, pan: r.range(-0.6, 0.6) });
    const a = W('melt'), b = W('dino'); put(fx.rustle(b - a + 1, { density: 2500, rub: 0.6, lo: 1500, hi: 9000, grain: 0.002, env: (u) => Math.min(1, u * 4) * (1 - Math.pow(u, 4)) }), a, { vol: 0.12 });
    const ta = wd('dino', 'asteroid'); put(eqThump(fx, 42, 18, 1.6, { click: 0.5, clickHz: 700 }), ta, { vol: 0.75 }); putLR(eqBed(fx, 0, 6, 'brown', 20, 300, (u) => Math.min(1, u / 0.05) * Math.exp(-u / 2) * 2.2), ta + 0.02, { vol: 0.4 }); }
});
