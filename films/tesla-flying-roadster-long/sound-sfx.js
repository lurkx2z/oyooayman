/* =====================================================================
   SOUND · EFFECTS — the events, each on the frame it is seen:
     the fans spinning up on the start line; the launch on the rear thrusters (a hard cold-gas blast, no flame, no
     combustion: compressed air); the electric motor and the tyres through the loop; the tyres letting go of the
     ceiling; the roll jets in the air; the stall horn and the fall in the sky; the fans holding the car to the
     ceiling, cutting out on the drop; the slowed-down roll and the braking burst; the landing; the hover hissing
     until the tanks are empty and it drops; the kicker and the kickflip; the verdict's ticks; the driver's seat.
   Cold-gas thrusters are a roaring hiss: white noise, bright, with a thump of air at the onset. In slow motion
   the same sound is played lower and longer.
   ===================================================================== */

// a cold-gas jet: hiss whose level follows k(t) (0…1, film time), sampled every 5 ms. o.slow (1 = real time, < 1
// slow motion: the band falls and the hiss darkens), o.thump: a blow of air at the first onset
function trJetSfx(K, t0, t1, k, o = {}) {
  const { fx, sr } = K, d = t1 - t0; if (d <= 0.02) return;
  const n = Math.ceil(d * sr), sl = o.slow ?? 1, env = new Float32Array(Math.ceil(d * 200) + 2);
  for (let j = 0; j < env.length; j++) env[j] = Math.max(0, Math.min(1, k(t0 + j / 200)));
  const mk = () => {
    const y = trNoise(fx, n, sl < 1 ? 'pink' : 'white');
    GBX.bq(y, 'hp', 90 * sl + 30, 0.7, sr); GBX.bq(y, 'peak', 220 * sl + 60, 0.8, sr, 3); GBX.bq(y, 'peak', 2600 * sl + 300, 0.8, sr, 5); GBX.bq(y, 'lp', 11000 * sl + 900, 0.7, sr);
    const w = fx.wander(o.wr || 7);
    for (let i = 0; i < n; i++) { const u = i / sr * 200, j = Math.floor(u), e = env[j] + (env[j + 1] - env[j]) * (u - j); y[i] *= e * (1 + 0.18 * w(i / sr)) * Math.min(1, i / (0.003 * sr), (n - i) / (0.01 * sr)); }
    return y;
  };
  K.putLR(mk(), mk(), t0, { vol: o.vol ?? 0.3, norm: true, room: o.room, wet: o.wet });
  if (sl < 1) trBed(K, t0, t1, { colour: 'brown', f: [['lp', 240]], vol: (o.vol ?? 0.3) * 0.8, mono: true, env: (u, t) => Math.max(0, Math.min(1, k(t))), fi: 0.01, fo: 0.05 });
  if (o.thump) trThump(K, o.thump, { vol: o.thumpVol ?? 0.22, f0: sl < 1 ? 38 : 60, tau: sl < 1 ? 0.6 : 0.22 });
}
// a thump: a low sine that falls in pitch (saturated so it carries on a phone), with a body of low noise
function trThump(K, t, o = {}) {
  const { fx, sr } = K, d = 1.2, n = Math.ceil(d * sr), y = fx.arr(d), f0 = o.f0 || 60, tau = o.tau || 0.25; let ph = 0;
  for (let i = 0; i < n; i++) { const tt = i / sr; ph += 2 * Math.PI * Math.max(34, f0 * Math.pow(0.6, tt / 0.6)) / sr; y[i] = Math.tanh(2 * Math.sin(ph) * Math.exp(-tt / tau)) * Math.min(1, tt / 0.004); }
  const z = trNoise(fx, Math.ceil(0.3 * sr), 'brown'); GBX.bq(z, 'lp', 400, 0.7, sr);
  let pk = 0; for (let i = 0; i < z.length; i++) pk = Math.max(pk, Math.abs(z[i])); for (let i = 0; i < z.length; i++) y[i] += 0.4 * z[i] / Math.max(1e-9, pk) * Math.exp(-i / (0.05 * sr));
  return K.put(y, t, { vol: o.vol || 0.2, norm: true, pan: o.pan || 0 });
}
// a landing: the thump, the springs, a scuff of tyres
function trLandSfx(K, t, o = {}) {
  const { fx } = K, s = o.size || 1;
  trThump(K, t, { vol: 0.26 * s, f0: 70, tau: 0.18 });
  K.put(fx.hit(fx.metalModes(fx.r.range(170, 210), 0.6), { width: 0.003, amp: 1, noise: 0.3, nlen: 0.03, nhp: 800, len: 0.8 }), t + 0.01, { vol: 0.07 * s, norm: true });
  K.put(fx.creak(0.35, fx.metalModes(320, 0.4), {}), t + 0.08, { vol: 0.04 * s, norm: true, pan: 0.2 });
  trBed(K, t, t + 0.5 * s, { colour: 'white', f: [['bp', 1800, 0.9]], vol: 0.06 * s, fi: 0.005, fo: 0.4 });
}
// a whoosh across a cut: noise swept up through a band (o.down: swept down)
function trWhoosh(K, t, o = {}) {
  const { fx, sr } = K, d = o.d || 0.5, n = Math.ceil(d * sr), y = trNoise(fx, n, 'pink'), curve = new Float32Array(32);
  for (let j = 0; j < 32; j++) { const u = j / 31; curve[j] = o.down ? 3000 * Math.pow(0.12, u) : 350 * Math.pow(8, u); }
  for (let i = 0; i < n; i++) { const u = i / n; y[i] *= Math.pow(Math.sin(Math.PI * Math.pow(u, 0.7)), 2); }
  return trSweepPut(K, y, t - d * 0.6, 'bandpass', 1.1, curve, { vol: o.vol || 0.08, pan: o.pan || 0 });
}
// a motor: the electric drive's whine (a pure tone and its gear harmonics) whose pitch follows v(t) (m/s), plus the
// tyres' roar on the road (level ∝ speed); o.slow lowers both
function trDriveSfx(K, t0, t1, v, o = {}) {
  const { fx, sr } = K, d = t1 - t0; if (d <= 0.02) return;
  const n = Math.ceil(d * sr), y = fx.arr(d), sl = (t) => (typeof o.slow === 'function' ? o.slow(t) : o.slow ?? 1); let ph = 0, ph2 = 0;
  for (let i = 0; i < n; i++) {
    const t = t0 + i / sr, vv = Math.max(0, v(t)), f = (180 + 52 * vv) * sl(t);
    ph += 2 * Math.PI * f / sr; ph2 += 2 * Math.PI * f * 2.97 / sr;
    y[i] = (Math.sin(ph) + 0.35 * Math.sin(2 * ph) + 0.18 * Math.sin(ph2)) * Math.min(1, 0.15 + vv / 10) * Math.min(1, i / (0.02 * sr), (n - i) / (0.02 * sr));
  }
  GBX.bq(y, 'lp', 5000, 0.7, sr);
  K.put(y, t0, { vol: o.vol ?? 0.035, norm: true, pan: o.pan || 0 });
  if (o.road !== false) {
    const z = trNoise(fx, n, 'brown'), w = fx.wander(4);
    for (let i = 0; i < n; i++) { const t = t0 + i / sr, vv = Math.max(0, v(t)); z[i] *= Math.min(1, vv / 16) * (o.road ? o.road(t) : 1) * (0.85 + 0.15 * w(i / sr)) * Math.min(1, i / (0.02 * sr), (n - i) / (0.02 * sr)); }
    GBX.bq(z, 'lp', 700, 0.7, sr); GBX.bq(z, 'peak', 160, 1, sr, 4);
    K.put(z, t0, { vol: (o.vol ?? 0.035) * 4, norm: true, pan: o.pan || 0 });
  }
}
// the underbody fans: a high whine (blade pass) over a breathy rush; k(t) 0…1 their speed
function trFanSfx(K, t0, t1, k, o = {}) {
  const { fx, sr } = K, d = t1 - t0; if (d <= 0.02) return;
  const n = Math.ceil(d * sr), y = fx.arr(d), z = trNoise(fx, n, 'pink'); let ph = 0;
  GBX.bq(z, 'bp', 1100, 0.8, sr);
  for (let i = 0; i < n; i++) {
    const t = t0 + i / sr, kk = Math.max(0, Math.min(1, k(t))), f = (o.f || 1250) * (0.25 + 0.75 * kk) * (o.slow ?? 1);
    ph += 2 * Math.PI * f / sr;
    const e = Math.min(1, i / (0.01 * sr), (n - i) / (0.02 * sr));
    y[i] = ((Math.sin(ph) + 0.3 * Math.sin(2 * ph)) * kk * kk * 0.5 + z[i] * kk * 2.5) * e;
  }
  K.put(y, t0, { vol: o.vol ?? 0.05, norm: true, pan: o.pan || 0 });
}

trSound('sfx', 'events', function (ctx, bus, K) {
  const { fx, sr, r } = K, A = TR, C = trRunClock(), ex = trExClock(), kc = trKickClock(), W = (n, w, f) => trW(n, w, f).start;
  const open = K.verb('openS', 2.0, { bright: 0.55, damp: 3, wet: 0.4, seed: 41 });
  const exitT = C.inv(TR_DEMO_EXIT), tick = (t, pan = 0, v = 0.03) => K.put(fx.hit([[2100, 0.03, 1], [4300, 0.015, 0.4]], { width: 0.001, amp: 1, noise: 0.2, nlen: 0.01, nhp: 2000, len: 0.12 }), t, { vol: v, norm: true, pan });

  // ---- 1: the start line. A hiss of vapour on "drive"; the fans spin up as the route is drawn
  trJetSfx(K, W(1, 'drive') - 0.02, W(1, 'drive') + 1.4, (t) => 0.5 * Math.exp(-Math.max(0, t - W(1, 'drive')) / 0.45), { vol: 0.18 });
  trWhoosh(K, A.when, { d: 0.7, vol: 0.06 });
  for (const w of ['curls', 'hangs', 'lets', 'flips', 'lands']) tick(W(4, w) + 0.1, 0, 0.02);
  trFanSfx(K, A.did + 2, C.tLoop, (t) => MathX.smooth(t, A.did + 2, A.go), { vol: 0.035 });
  // ---- the launch on the rear thrusters, then the drive into and round the loop (half speed from tLoop)
  const runV = (t) => trDemo(C.at(t)).v || 0, runSlow = (t) => (t < C.tLoop ? 1 : t < C.tAir ? 0.62 : 0.55);
  trJetSfx(K, (A.go + 0.25) - 0.01, (A.go + 0.25) + 1.3, (t) => trDemo(C.at(t)).jets.rear || 0, { vol: 0.42, thump: (A.go + 0.25), thumpVol: 0.3, room: open, wet: 0.5 });
  trDriveSfx(K, (A.go + 0.25), exitT + 0.02, runV, { slow: runSlow, vol: 0.04, road: (t) => (t < C.tLoop ? 1 : 0.6) });
  trFanSfx(K, C.tLoop, C.tLand, (t) => (t < exitT ? 1 : 0.4), { vol: 0.03, slow: 0.7 });
  K.put(fx.creak(0.25, fx.metalModes(260, 0.5), {}), exitT - 0.05, { vol: 0.05, norm: true });
  trWhoosh(K, exitT + 0.35, { d: 0.9, vol: 0.09 });
  trJetSfx(K, exitT, C.tLand + 0.3, (t) => { const j = trDemo(C.at(t)).jets; return (j.roll || 0) * 0.8 + (j.brake || 0); }, { vol: 0.3, slow: 0.62 });
  trLandSfx(K, C.tLand, { size: 1.1 });
  trDriveSfx(K, C.tLand, A.claims, (t) => trDemo(C.at(t)).v || 0, { vol: 0.03 });
  // the claims: a blip of the rear jets on "second", the nozzles light with ticks, the fans whine (x-ray)
  trJetSfx(K, W(5, 'second') - 0.02, W(5, 'second') + 0.6, (t) => 0.8 * MathX.smooth(t, W(5, 'second'), W(5, 'second') + 0.04) * (1 - MathX.smooth(t, W(5, 'second') + 0.35, W(5, 'second') + 0.47)), { vol: 0.3, thump: W(5, 'second'), thumpVol: 0.15 });
  for (let i = 0; i < 10; i++) tick(W(5, 'ten') + 0.05 + i * 0.09, -0.5 + i * 0.1, 0.018);
  trFanSfx(K, W(5, 'fans') - 0.25, W(5, 'on') - 0.2, (t) => MathX.smooth(t, W(5, 'fans') - 0.2, W(5, 'fans') + 0.6), { vol: 0.05 });
  // ---- the replay: a rewind whoosh, then the exit again, slowed (deep)
  trWhoosh(K, A.replay, { d: 0.7, vol: 0.1, down: true });
  {
    const Rp = TR_REPLAY, tEx = Rp.inv(TR_DEMO_EXIT);
    trFanSfx(K, A.replay, tEx + 0.4, () => 1, { vol: 0.03, slow: 0.4 });
    K.put(fx.creak(0.6, fx.metalModes(130, 0.6), {}), tEx - 0.1, { vol: 0.05, norm: true });
    trJetSfx(K, tEx, A.three, (t) => { const j = trDemo(Rp.at(t)).jets; return (j.roll || 0) * 0.8 + (j.brake || 0); }, { vol: 0.26, slow: 0.3 });
  }

  // ---- 2: the sky. Whooshes into the clouds; the stall warning horn as the speed bleeds away; the fall
  trWhoosh(K, A.three, { d: 0.8, vol: 0.1 });
  trWhoosh(K, A.plane, { d: 0.6, vol: 0.08 });
  trWhoosh(K, W(10, 'twice') + 0.3, { d: 1.2, vol: 0.07 });
  trTone(K, A.slow + 0.9, A.fall + 0.4 - A.slow - 0.9, 2900, [[1, 1], [2, 0.45], [3, 0.3], [5, 0.12]], (u, t) => Math.min(1, t / 0.03) * Math.min(1, (A.fall + 0.4 - A.slow - 0.9 - t) / 0.05) * (0.75 + 0.25 * Math.sin(t * 40)), { vol: 0.045, pan: 0.15, f: [['bp', 2900, 1.2]] });
  K.put(fx.creak(0.7, fx.metalModes(150, 0.7), {}), A.stall + 0.05, { vol: 0.05, norm: true, pan: -0.2 });
  {
    const t0 = A.fall, rec = trSkyT().rec, d = rec + 0.5 - t0, n = Math.ceil(d * sr), y = trNoise(fx, n, 'pink'), curve = new Float32Array(64);
    for (let j = 0; j < 64; j++) curve[j] = 500 * Math.pow(5, j / 63);
    for (let i = 0; i < n; i++) { const u = i / n; y[i] *= Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.15)), 1.3) * Math.min(1, (n - i) / (0.3 * sr)); }
    trSweepPut(K, y, t0, 'bandpass', 2.5, curve, { vol: 0.11 });
    trWhoosh(K, rec + 0.8, { d: 1.6, vol: 0.09 });
  }
  trWhoosh(K, A.race, { d: 0.5, vol: 0.08 });

  // ---- 3: the loop on the real ramp (slowed): the drive and the fans; the flat ceiling: the fans stop, it falls
  {
    const τa = 1.7, rr = (TR_DEMO_EXIT - 0.15 - τa) / (A.flat - A.numbers);
    trDriveSfx(K, A.numbers, A.flat, (t) => trDemo(τa + (t - A.numbers) * rr).v || 0, { slow: 0.6, vol: 0.035, road: () => 0.6 });
    trFanSfx(K, A.numbers, A.flat, () => 1, { vol: 0.025, slow: 0.6 });
    const f = A.flatFall, crash = f + Math.sqrt(2 * (2 * TR_R + 0.03 - TR_CG - 0.66) / TR_G);
    trFanSfx(K, A.flat, f + 0.4, (t) => (t < f - 0.4 ? 1 : Math.max(0, 1 - (t - f + 0.4) / 0.6)), { vol: 0.05, room: open, wet: 0.3 });
    trDriveSfx(K, A.flat, f, (t) => 3 * (1 - MathX.smooth(t, A.flat, f)), { vol: 0.02, road: () => 0.5 });
    K.put(fx.creak(0.4, fx.metalModes(200, 0.6), {}), f - 0.05, { vol: 0.05, norm: true });
    trWhoosh(K, crash - 0.1, { d: 1.0, vol: 0.08, down: true });
    trThump(K, crash, { vol: 0.32, f0: 55, tau: 0.25 });
    K.put(fx.hit(fx.metalModes(140, 0.8), { width: 0.004, amp: 1, noise: 0.6, nlen: 0.08, nhp: 600, len: 1.2 }), crash, { vol: 0.12, norm: true });
    K.put(fx.creak(0.9, fx.panelModes(0.7), {}), crash + 0.05, { vol: 0.07, norm: true, pan: 0.2 });
    trBed(K, crash, crash + 0.8, { colour: 'white', f: [['bp', 2600, 0.8]], vol: 0.05, fi: 0.005, fo: 0.6 });
  }

  // ---- 4: the ceiling. The fans' whine; the creep; the readouts tick in
  trFanSfx(K, A.suck - 0.02, A.old + 0.05, (t) => 1 - 0.3 * MathX.smooth(t, A.fans, A.fans + 0.6), { vol: 0.06, room: open, wet: 0.3 });
  trFanSfx(K, A.surface - 0.02, A.drop + 0.05, () => 0.7, { vol: 0.06, room: open, wet: 0.3 });
  trDriveSfx(K, A.creep - 0.3, A.drop, (t) => 2 + 3 * MathX.smooth(t, A.creep, A.creep + 1), { vol: 0.02, road: () => 0.4 });
  for (const t of [A.twoG, A.tenth, A.surface + 0.3]) K.put(fx.beep(1800, 0.05), t, { vol: 0.03, norm: true, pan: 0.3 });
  // the drop (the clock at 0.075×): the fans spool down, the wheels leave the ceiling, a deep, slowed rush
  {
    const t0 = A.drop;
    trFanSfx(K, t0, t0 + 3.2, (t) => 1 - MathX.smooth(t, t0, t0 + 3), { vol: 0.05, slow: 0.6 });
    K.put(fx.creak(1.0, fx.metalModes(90, 0.8), {}), t0 + 0.1, { vol: 0.07, norm: true });
    trThump(K, t0 + 0.05, { vol: 0.14, f0: 36, tau: 0.8 });
    trBed(K, t0, A.newton, { colour: 'pink', f: [['bp', 260, 0.6]], vol: 0.06, fi: 0.8, fo: 0.1, env: (u) => 0.5 + 0.5 * u });
  }
  // ---- 5: thrust. Back in the frozen fall: the tanks hum; the nozzles light with ticks on their words
  trWhoosh(K, A.cold, { d: 0.5, vol: 0.06, down: true });
  trTone(K, W(34, 'tanks') - 0.1, 1.8, 180, [[1, 1], [2, 0.5], [3, 0.2]], (u) => Math.sin(Math.PI * u), { vol: 0.012, pan: -0.2 });
  for (const [w, k] of [['four', 4], ['corner', 4], ['two', 2]]) for (let i = 0; i < k; i++) tick(W(35, w) + i * 0.08 - (w === 'corner' ? 0.3 : 0), -0.4 + i * 0.25, 0.02);
  // the roll on the corner and fender jets, slowed: one side fires, then the other catches it
  const rollK = (t) => MathX.smooth(t, A.blast, A.blast + 0.4) * (1 - MathX.smooth(t, A.blast + 1.6, A.blast + 1.9)) * (0.75 + 0.25 * Math.sin((t - A.blast) * 2.4));
  const stopK = (t) => MathX.smooth(t, A.rolled - 0.1, A.rolled + 0.2) * (1 - MathX.smooth(t, A.rolled + 1.0, A.rolled + 1.3));
  trJetSfx(K, A.blast - 0.05, A.blast + 2.0, rollK, { vol: 0.38, slow: 0.22, thump: A.blast + 0.02, thumpVol: 0.2, room: open, wet: 0.5, pan: -0.3 });
  trJetSfx(K, A.rolled - 0.15, A.rolled + 1.4, stopK, { vol: 0.32, slow: 0.22, thump: A.rolled, thumpVol: 0.15, room: open, wet: 0.5 });
  trBed(K, A.blast, A.brk, { colour: 'pink', f: [['bp', 220, 0.6]], vol: 0.05, fi: 0.5, fo: 0.1 });
  // real time again: the braking burst, the landing
  trWhoosh(K, A.brk, { d: 0.35, vol: 0.06 });
  trJetSfx(K, A.brk, A.brk + 0.95, (t) => MathX.smooth(t, A.brk, A.brk + 0.04) * (1 - MathX.smooth(t, A.brk + 0.7, A.brk + 0.92)), { vol: 0.4, thump: A.brk + 0.005, room: open, wet: 0.4 });
  trLandSfx(K, A.brk + 0.8, { size: 1 });

  // ---- the hover: a nozzle test on "fast"; the jets lift it, hold it, sputter on "seconds"; it drops
  trWhoosh(K, A.hover, { d: 0.5, vol: 0.07 });
  { const b = W(40, 'fast') - 0.05, b2 = W(40, 'thirty'); trJetSfx(K, b - 0.02, b2 + 1.5, (t) => MathX.smooth(t, b, b + 0.04) * (1 - MathX.smooth(t, b + 0.9, b + 1.02)) + 0.6 * MathX.smooth(t, b2, b2 + 0.04) * (1 - MathX.smooth(t, b2 + 1.2, b2 + 1.32)), { vol: 0.3, thump: b, thumpVol: 0.15 }); }
  trJetSfx(K, A.lift0 + 0.15, A.empty + 0.5, (t) => trHoverK(t), { vol: 0.25, thump: A.lift0 + 0.2, room: open, wet: 0.5 });
  {
    const tl = Math.sqrt(2 * 1.7 / TR_G) + 0.25;
    for (let i = 0; i < 3; i++) K.put(fx.hit([[r.range(900, 1300), 0.02, 1], [r.range(2400, 3000), 0.01, 0.5]], { width: 0.002, amp: 1, noise: 0.6, nlen: 0.02, nhp: 1200, len: 0.15 }), A.empty + 0.1 + i * 0.11, { vol: 0.05, norm: true });
    trLandSfx(K, A.empty + tl, { size: 1.15 });
  }
  trWhoosh(K, A.heli, { d: 0.6, vol: 0.08 });
  // the bottle: the tanks' hum goes out on "empty"
  trTone(K, A.bottle + 0.3, W(44, 'empty') + 0.4 - A.bottle - 0.3, 180, [[1, 1], [2, 0.5], [3, 0.2]], (u, t) => Math.min(1, t / 0.3) * (1 - MathX.smooth(u, 0.85, 1)), { vol: 0.012 });
  K.put(fx.beep(600, 0.12), W(44, 'empty'), { vol: 0.025, norm: true });
  // ---- the hop: blips of the jets on "short, sharp bursts…", the kicker, a whoosh over the cars, the landing
  trWhoosh(K, A.hop, { d: 0.5, vol: 0.07 });
  for (const w of ['short', 'sharp', 'bursts', 'launch', 'jump', 'flip']) { const b = W(45, w); trJetSfx(K, b - 0.01, b + 0.4, (t) => MathX.smooth(t, b, b + 0.03) * (1 - MathX.smooth(t, b + 0.14, b + 0.26)), { vol: 0.22, pan: 0.2 }); }
  {
    const L = kc.inv(0), tk = kc.inv(kc.launchT), tl = kc.inv(kc.launchT + kc.flight);
    trDriveSfx(K, L - 0.3, tk + 0.05, (t) => (t < L ? 0 : TR_KICK.v * Math.min(1, (t - L + 0.3) / 0.6)), { vol: 0.045 });
    trJetSfx(K, tk - 0.03, tk + 0.6, (t) => MathX.smooth(t, tk - 0.03, tk) * (1 - MathX.smooth(t, tk + 0.25, tk + 0.55)), { vol: 0.35, thump: tk, room: open, wet: 0.5 });
    trWhoosh(K, (tk + tl) / 2 + 0.4, { d: 1.4, vol: 0.12 });
    trLandSfx(K, tl, { size: 1.1 });
    trDriveSfx(K, tl, tl + 2.2, (t) => TR_KICK.v * Math.max(0, 1 - (t - tl) / 2.2), { vol: 0.035 });
  }
  // ---- 6: the verdict: a tick as each line appears; the timeline steps; the drive out and its little trick
  trWhoosh(K, A.real, { d: 0.6, vol: 0.06, down: true });
  for (const [n, w] of [[48, 'clings'], [48, 'jumps'], [48, 'closed'], [48, 'nobody'], [49, 'onesecond'], [49, 'roadgoing'], [49, 'price']]) tick(W(n, w) - 0.1, n === 49 ? 0.3 : -0.3);
  trWhoosh(K, A.timeline + 0.2, { d: 0.6, vol: 0.05 });
  trDriveSfx(K, A.legal, A.human, () => 3.2, { vol: 0.035 });
  { const b = W(50, 'tricks'); trJetSfx(K, b - 0.01, b + 0.6, (t) => MathX.smooth(t, b, b + 0.03) * (1 - MathX.smooth(t, b + 0.25, b + 0.4)), { vol: 0.25, thump: b, thumpVol: 0.1 }); }
  // ---- 7: you. The fans holding the car to the ceiling; the body creaks under the hanging weight
  trFanSfx(K, A.human, A.pov, () => 0.85, { vol: 0.05, room: open, wet: 0.3 });
  K.put(fx.creak(1.2, fx.panelModes(0.6), {}), W(52, 'seat'), { vol: 0.04, norm: true, pan: 0.2 });
  K.put(fx.creak(0.8, fx.metalModes(160, 0.5), {}), W(52, 'harness'), { vol: 0.04, norm: true, pan: -0.2 });
  // the driver's seat: the motor and the tyres up the loop, the fans coming on, the car slowing to a stop upside
  // down; the body creaks as the weight comes off the seat; cut on the last frame
  {
    const sAt = (t) => MathX.lerp(-9, TR_LOOP + 3.2, trK(t, A.pov - 0.2, A.pov + 2.7, (u) => u * u * (3 - 2 * u)));
    const vAt = (t) => (sAt(t + 0.02) - sAt(t - 0.02)) / 0.04;
    trDriveSfx(K, A.pov, A.end + 0.1, vAt, { vol: 0.05 });
    trFanSfx(K, A.pov, A.end + 0.1, (t) => 0.4 + 0.6 * MathX.smooth(sAt(t), 0, TR_LOOP * 0.6), { vol: 0.05 });
    const tTop = (() => { for (let t = A.pov; t < A.end; t += 0.01) if (sAt(t) > TR_LOOP * 0.85) return t; return A.end - 2; })();
    K.put(fx.creak(1.2, fx.metalModes(140, 0.6), {}), tTop, { vol: 0.05, norm: true, pan: -0.3 });
    K.put(fx.creak(0.8, fx.panelModes(0.6), {}), A.end - 1.3, { vol: 0.05, norm: true, pan: 0.3 });
  }
  // ---- the other worlds (race track, desk, space): their own effects, if the set provides them
  for (const f of window.TR_SFX_EXTRA || []) f(K, { open, tick });
});
