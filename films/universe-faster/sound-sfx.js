/* =====================================================================
   SOUND · EFFECTS — the events, each placed when it really happens. Two rules:
     slowed down   in the first second a sound is slowed as much as the picture (played at the night's own rate):
                   the cat landing on the lawn, sixty-odd times slower, is a long, low thud
     no air        sound needs air. As it thins (from about 11:20) everything outside you gets fainter; from 11:36
                   only what is inside you is heard: your breathing ("pretend you can breathe") and your heart
                   (that's in the score)
     the garden    the telescope's focuser, the cat ("mrrp", her leap off the wall, her landing), the moth, your
                   steps on the patio as you get lighter, the jump (take-off, the long hang, a soft landing), your
                   breathing in the thinning air, your ears popping, the tea boiling at 75 °C, the candle, the bird
                   bath's water lifting out, the cat's thin cry as she floats up
   ===================================================================== */

uxSound('sfx', 'events', function (ctx, bus, K) {
  const { fx, sr, r } = K, P = uxPl();
  const out = K.verb('out', 2.4, { bright: 0.42, damp: 2.6, wet: 0.5, seed: 43, pre: 0.02 });
  const head = K.verb('head', 0.35, { bright: 0.3, damp: 5, wet: 0.25, seed: 47 });        // inside you: close, dry
  const air = (t) => uxAirAt(t);

  // ================= inside you: breathing (the cold open is 11:41: no air, so only this and your heart)
  const breathe = (t, d, vol, o = {}) => K.put(fx.breath(d, o), t, { vol, norm: true, pan: 0, room: head, wet: 0.3, lp: o.lp || 5200 });
  breathe(0.3, 1.3, 0.05, { inhale: true }); breathe(1.75, 1.6, 0.045); breathe(3.5, 1.2, 0.05, { inhale: true }); breathe(4.8, 0.9, 0.035);

  // ================= 1 · 7:29 in the garden
  // the telescope: you turn the focuser (a gritty little creak, two clicks); later you swing it back to Saturn
  const focus = (t, v) => {
    K.put(fx.creak(0.45, [[r.range(900, 1100), 0.01, 1], [r.range(2100, 2500), 0.006, 0.5]], { rate: [30, 60] }), t, { vol: 0.012 * v, norm: true, pan: 0.1, room: out, wet: 0.2 });
    for (const dt of [0.52, 0.71]) K.put(fx.hit([[3100, 0.004, 1], [5300, 0.003, 0.5], [1500, 0.006, 0.4]], { width: 0.0002, noise: 0.4, nhp: 2500 }), t + dt, { vol: 0.01 * v, norm: true, pan: 0.1, room: out, wet: 0.2 });
  };
  focus(UX.scope + 0.35, 1); focus(UX.saturn + 0.3, 1);
  // the cat on the wall: a small "mrrp"; the moth round the lantern (a faint flutter); her leap: claws off the brick
  K.put(uxMeow(fx, { d: 0.32, f0: [520, 640, 560], open: 0.5 }), uxS('rule') + 1.2, { vol: 0.028, norm: true, pan: -0.25, room: out, wet: 0.4 });
  K.put(fx.rustle(5.5, { density: 90, rub: 0.25, lo: 3000, hi: 9000, grain: 0.004, env: (u) => 0.5 + 0.5 * Math.sin(u * 40) * Math.sin(u * 17) }), UX.rule + 1.2, { vol: 0.004, norm: true, pan: -0.2, room: out, wet: 0.3 });
  const tLeap = uxFilmAt(UX_N.leap, UX.rule, UX.second);
  K.put(fx.rustle(0.18, { density: 1500, rub: 0.2, lo: 1800, hi: 7000, grain: 0.003, env: (u) => Math.exp(-u * 3) }), tLeap - 0.05, { vol: 0.026, norm: true, pan: -0.2, room: out, wet: 0.3 });
  K.put(fx.hit([[420, 0.02, 1], [880, 0.012, 0.5]], { width: 0.003, noise: 0.4, nhp: 900 }), tLeap - 0.04, { vol: 0.016, norm: true, pan: -0.2, room: out, wet: 0.3 });

  // ================= 2 · the first second, slowed down: the cat lands at 0.945 s, heard at the night's own rate
  {
    const tL = uxFilmAt(UX_N.land, UX.second, UX.stretch), rate = MathX.clamp(uxRate(tL), 0.05, 1);
    const thud = fx.hit([[95, 0.05, 1], [160, 0.03, 0.6], [300, 0.015, 0.35]], { width: 0.012, noise: 0.5, nhp: 300, len: 0.6 });
    const grass = fx.rustle(0.25, { density: 700, rub: 0.3, lo: 900, hi: 6000, grain: 0.005, env: (u) => Math.exp(-u * 3) });
    for (let i = 0; i < grass.length && i < thud.length; i++) thud[i] += grass[i] * 0.5;
    K.put(thud, tL, { vol: 0.07, norm: true, pan: -0.1, rate, room: out, wet: 0.4 });
  }

  // ================= 3 · back to the telescope at 9:34 (see focus above)

  // ================= 4 · lighter: your steps on the patio (each lighter than the last), the jump, your ears, the tea
  for (let i = 0; i < 3; i++) { const t = UX.weight + 0.5 + i * 0.62, w = Math.max(0.1, uxWeight(uxNight(t))); K.put(fx.step({ weight: 0.6 * w, scuff: 0.15 }), t, { vol: 0.035 * w * air(t), norm: true, pan: i % 2 ? 0.15 : -0.15, room: out, wet: 0.25 }); }
  {
    const tJ = UX.jump; let land = tJ + 1;
    for (let u = 0.3; u < 6; u += 0.005) { const ge = 9.81 * Math.max(0.05, uxWeight(uxNight(tJ + u))); if (2.7 * u - 0.5 * ge * u * u <= 0) { land = tJ + u; break; } }
    K.put(fx.step({ weight: 0.5, scuff: 0.5 }), tJ - 0.12, { vol: 0.04 * air(tJ), norm: true, pan: 0, room: out, wet: 0.2 });
    breathe(tJ - 0.15, 0.5, 0.05 * air(tJ), { voice: 0.25, f0: 140 });
    breathe(tJ + 0.7, 1.0, 0.03, { inhale: true });                                              // you laugh a little, hanging there
    K.put(fx.step({ weight: 0.4, scuff: 0.3 }), land - 0.02, { vol: 0.04 * air(land), norm: true, pan: 0, room: out, wet: 0.2 });
    K.put(fx.step({ weight: 0.3 }), land + 0.13, { vol: 0.025 * air(land), norm: true, pan: 0.1, room: out, wet: 0.2 });
  }
  // the air thins: you breathe harder; then your ears pop (a soft click and thump, inside your head)
  for (let t = UX.air + 1.0, i = 0; t < UX.zero - 0.5; i++) { const d = i % 2 ? 0.75 : 0.95; breathe(t, d, 0.03 + 0.012 * uxEv(t, UX.air, UX.zero), i % 2 ? {} : { inhale: true }); t += d + 0.35 - 0.12 * uxEv(t, UX.air, UX.zero); }
  {
    const tp = UX.pop;
    K.put(fx.hit([[180, 0.02, 1], [420, 0.01, 0.4]], { width: 0.004, noise: 0.6, nhp: 200, len: 0.3 }), tp, { vol: 0.09, norm: true, pan: -0.05, room: head, wet: 0.2 });
    K.put(fx.hit([[2500, 0.003, 1], [4100, 0.002, 0.5]], { width: 0.0002, noise: 0.5, nhp: 1500 }), tp + 0.01, { vol: 0.03, norm: true, pan: -0.3 });
  }
  // the tea starts to boil (at 75 °C, in this air): first a few bubbles, then a rolling simmer, quieter as the air goes
  {
    const t0 = UX.tea + 0.5, t1 = UX.zero, d = t1 - t0;
    K.put(fx.liquid(d, (x) => uxEv(t0 + x, t0, t0 + 4) * air(t0 + x), { f: 700 }), t0, { vol: 0.02, norm: true, pan: 0.15, room: out, wet: 0.15 });
    const L = new Float32Array(Math.ceil(d * sr)), R = new Float32Array(L.length);
    for (let x = 0; x < d; x += r.range(0.015, 0.07)) { const a = uxEv(t0 + x, t0, t0 + 5) * air(t0 + x); if (a < 0.03 || !r.chance(0.3 + 0.6 * a)) continue; fx.bubble(L, R, Math.round(x * sr), r.range(900, 2600), r.range(0.004, 0.012), a * r.range(0.4, 1), 0.15 + r.range(-0.15, 0.15)); }
    K.putLR(L, R, t0, { vol: 0.03, norm: true, room: out, wet: 0.15 });
    uxBed(K, t0 + 1, t1, { colour: 'white', f: [['hp', 4000], ['lp', 9000]], vol: 0.004, env: (u, t) => uxEv(t, t0 + 1, t0 + 4) * air(t) * (0.5 + 0.5 * P.garden(t)), mono: true, pan: 0.15 });
  }
  // the candle: a soft flutter, close (only in its shot), dying with the air
  uxBed(K, UX.flame, UX.zero + 0.2, { colour: 'brown', f: [['bp', 160, 0.7]], vol: 0.012, am: 0.9, wr: 4, env: (u, t) => air(t) * uxWn(t, UX.flame, UX.zero, 0.3, 0.2), mono: true, pan: 0 });

  // ================= 5 · weightless at 11:35: your feet leave the ground; the bird bath's water lifts out; the cat
  //                   floats up and cries out, thin and faint (the air is nearly gone); then only your breathing
  {
    const tz = UX.zeroAt;
    K.put(fx.rustle(0.3, { density: 600, rub: 0.5, lo: 800, hi: 4000, grain: 0.006 }), tz + 0.1, { vol: 0.02 * air(tz), norm: true, pan: 0, room: out, wet: 0.2 });
    K.put(fx.liquid(1.6, (x) => Math.min(1, x / 0.2) * Math.exp(-x / 0.7), { f: 380 }), tz + 0.6, { vol: 0.03 * air(tz + 0.6), norm: true, pan: 0.3, room: out, wet: 0.3 });
    const tc = tz + 2.6; K.put(uxMeow(fx, { d: 0.85, f0: [560, 900, 520], open: 1, thin: 0.12 }), tc, { vol: 0.05 * Math.max(0.05, air(tc)), norm: true, pan: -0.3, room: out, wet: 0.45 });
    // pretend you can breathe: slow, close breaths from here to the last second
    const t0 = uxCap('zero', 2).show + 0.3;
    for (let t = t0, i = 0; t < UX.last - 0.6; i++) { const d = i % 2 ? 1.6 : 1.3, k = 0.55 + 0.45 * uxEv(t, UX.crack, UX.crackAt + 2); breathe(t, d, 0.03 * k, i % 2 ? {} : { inhale: true }); t += d + 0.6 - 0.3 * uxEv(t, UX.crack, UX.crackAt) + 0.3 * uxEv(t, UX.drift, UX.pieces); }
  }
  // ================= 6 · the last second: one sharp breath in; then nothing
  breathe(UX.last + 0.1, 0.7, 0.05, { inhale: true });

  // ================= the end: 7:29 in the garden again, the cat back on the wall
  K.put(uxMeow(fx, { d: 0.35, f0: [500, 620, 540], open: 0.55 }), UX.question + 3.2, { vol: 0.026, norm: true, pan: -0.25, room: out, wet: 0.4 });
});
