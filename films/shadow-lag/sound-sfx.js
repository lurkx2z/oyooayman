/* =====================================================================
   SOUND · EFFECTS — the events, each at its story moment (the clock only runs forward, so each is heard once). In the
   slowed stretches they drop and stretch a little (shWorldRate, k 0.6). Your shadow makes no sound at all: only you do.
     11:58 PM     the stair door's push bar, the door easing shut behind you and its slam echoing round the deck
     the tests    your footsteps (trainers on concrete), your sleeve, your phone's record tone, the jump's landing
     12:00 AM     the lamps' contactors clunking off in a ripple across the deck, each tube ticking as it dies
     the guard    the stair door again, far off; his boots and keys; his gasp; his radio (squelch, a garbled voice,
                  the control room's reply)
     the run      your running steps; your car's door, the seat, the door shut, the locks, the indicator relay
     the car      the starter and the engine (idle, revving away, down the ramp), the tyres squealing on the painted
                  ramp, its expansion joint; nothing at all on camera 7 (a CCTV feed has no sound)
     the exit     the engine idling in, the brakes, the handbrake, the terminal's two beeps; then, from the back seat,
                  a slow creak of the seat's vinyl
   ===================================================================== */

shSound('sfx', 'events', function (ctx, bus, K) {
  const { fx, sr } = K, r = new RNG(CONFIG.seed + 909), F = shFilmAt, E = SHE, END = SH.end;
  const deck = K.verb('sdeck', 2.8, { bright: 0.5, damp: 2.0, wet: 0.42, pre: 0.015, early: [[0.05, 0.35], [0.12, 0.22], [0.21, 0.14], [0.33, 0.08]] });
  const far = K.verb('sfar', 3.6, { bright: 0.32, damp: 1.8, wet: 0.7, pre: 0.06, early: [[0.25, 0.4], [0.55, 0.25]] });
  const street = K.verb('sstreet', 1.2, { bright: 0.5, damp: 2.6, wet: 0.25 });
  const wr = (t) => shWorldRate(t, 0.6);
  const isPOV = (t) => /POV$/.test(shShotAt(t).mode);
  const onScreen = (t, setName) => { const s = shShotAt(t); return s.set === setName; };
  // play x at film time t at the world's speed then; cut at the end of its shot unless o.keep
  const putS = (x, t, o = {}) => { const s0 = shShotAt(t); return K.put(x, t, Object.assign({ norm: true }, o, { rate: o.rate ?? wr(t), stop: o.keep ? undefined : s0.t1 + 0.03, fade: 0.05 })); };
  const clack = (f, dk = 1, a = 1) => fx.hit(fx.metalModes(f, dk), { width: 0.0008, amp: a, noise: 0.5, nlen: 0.01, nhp: 900, len: 0.8 * dk + 0.2 });
  const thump = (f = 70, len = 0.9, noise = 0.4) => fx.hit([[f, 0.12, 1], [f * 1.6, 0.08, 0.6], [f * 2.7, 0.05, 0.4], [f * 4.1, 0.03, 0.25]], { width: 0.004, amp: 1, noise, nlen: 0.03, nhp: 400, len });

  // ================================================================== 11:58 PM: the stair door
  { const tOpen = F(-2.9), tShut = F(4.4);
    putS(clack(1300, 0.6), tOpen, { vol: 0.16, pan: -0.3, room: deck, wet: 0.6, keep: true });                 // the push bar
    putS(fx.creak(1.4, [[180, 0.03, 1], [410, 0.02, 0.6], [930, 0.012, 0.3]], { rate: [14, 34] }), tOpen + 0.1, { vol: 0.05, pan: -0.3, room: deck, wet: 0.5, keep: true });
    putS(fx.creak(1.0, [[160, 0.03, 1], [380, 0.02, 0.6], [870, 0.012, 0.3]], { rate: [12, 30] }), F(3.3), { vol: 0.04, pan: -0.4, room: deck, wet: 0.5, keep: true });
    const sl = thump(62, 1.4, 0.6); const c2 = clack(900, 0.5, 0.6); for (let i = 0; i < c2.length && i + 0.02 * sr < sl.length; i++) sl[i + Math.round(0.02 * sr)] += 0.5 * c2[i];
    putS(sl, tShut, { vol: 0.3, pan: -0.45, room: deck, wet: 0.9, keep: true }); }

  // ================================================================== your footsteps (only yours: your shadow is silent)
  { const steps = shFootfalls(SHY.M, -1, E.sit - 0.6, 0.75, 0.25);
    for (const { s, v } of steps) {
      const t = shSeen(s); if (t == null || t > END) continue;
      const run = v > 2.6, pov = isPOV(t), y = fx.step({ weight: run ? 0.9 : 0.5, s: 1.25, body: run ? 85 : 95, decay: run ? 0.03 : 0.022, scuff: run ? 0.25 : 0.12 });
      SHX.bq(y, 'lp', run ? 4200 : 3200, 0.7, sr);
      putS(y, t + r.range(-0.01, 0.01), { vol: (run ? 0.3 : 0.17) * (pov ? 1.25 : 1) * r.range(0.85, 1.1), pan: r.range(-0.12, 0.12), room: deck, wet: 0.45 });
    }
    // (running: one footfall every 1.65 m, not 0.75: the stride is longer — drop the extra ones)
  }
  // your sleeve as your hand goes up; your phone's record tone (and its stop); the turn's scuff; the jump
  putS(fx.rustle(0.5, { density: 260, rub: 0.35, lo: 900, hi: 5000 }), F(E.hand + 0.05), { vol: 0.06, pan: 0.2 });
  putS(fx.rustle(0.4, { density: 260, rub: 0.35, lo: 900, hi: 5000 }), F(E.handDown), { vol: 0.045, pan: 0.2 });
  { const t = F(E.phone + 0.8), a = fx.beep(880, 0.09), b = fx.beep(1320, 0.12), y = new Float32Array(a.length + b.length + Math.round(0.03 * sr));
    y.set(a, 0); y.set(b, a.length + Math.round(0.03 * sr)); SHX.bq(y, 'lp', 4500, 0.7, sr); putS(y, t, { vol: 0.07, pan: 0.15, rate: 1 }); }
  putS(fx.step({ weight: 0.35, s: 1.3, scuff: 0.6 }), F(E.turn + 0.15), { vol: 0.12, room: deck, wet: 0.4 });
  { putS(fx.step({ weight: 0.4, s: 1.2, scuff: 0.4 }), F(E.jump - 0.05), { vol: 0.14, room: deck, wet: 0.4 });
    const land = fx.step({ weight: 1.0, s: 1.0, body: 70, decay: 0.04 }); const l2 = fx.step({ weight: 0.7, s: 1.1 });
    for (let i = 0; i < l2.length && i + 0.035 * sr < land.length; i++) land[i + Math.round(0.035 * sr)] += l2[i] * 0.7;
    putS(land, F(E.jump + 0.45), { vol: 0.32, room: deck, wet: 0.5 }); }
  // a last half-step back against the pillar
  putS(fx.step({ weight: 0.3, s: 1.3, scuff: 0.5 }), F(E.shuffle + 0.2), { vol: 0.1, room: deck, wet: 0.4 });

  // ================================================================== 12:00 AM: the lamps' contactors, a ripple across the deck
  { const you = SHY.pos(E.mid);
    for (const L of SH_LAMPS) {
      if (L.night) continue;
      const s = E.mid + 0.11 * L.k + 0.03 * L.r, t = shSeen(s); if (t == null) continue;
      const d = Math.hypot(L.x - you[0], L.z - you[1]), g = 1 / (1 + d / 9), pan = MathX.clamp((L.x - you[0]) / 30, -0.85, 0.85);
      const y = thump(r.range(90, 120), 0.5, 0.25); const c1 = clack(r.range(1700, 2300), 0.3, 0.7);
      for (let i = 0; i < c1.length && i < y.length; i++) y[i] += 0.6 * c1[i];
      K.put(y, t + r.range(-0.008, 0.008), { vol: 0.2 * g, norm: true, pan, room: deck, wet: 0.7 });
      // the tube ticking as it dies
      K.put(fx.hit([[r.range(3200, 4200), 0.02, 1]], { width: 0.0003, len: 0.1 }), t + r.range(0.05, 0.12), { vol: 0.03 * g, norm: true, pan, room: deck, wet: 0.5 });
    } }

  // ================================================================== the night guard: the stair door far off; his boots and keys
  { const t = F(E.guardIn);
    putS(clack(1300, 0.6), t, { vol: 0.07, pan: -0.6, room: far, wet: 0.9, keep: true });
    const sl = thump(60, 1.4, 0.5); putS(sl, F(E.guardIn + 3.0), { vol: 0.12, pan: -0.6, room: far, wet: 1.0, keep: true }); }
  { const steps = shFootfalls(SHG.M, E.guardIn, E.radio + 9, 0.7, 0.25);
    for (const { s } of steps) {
      const t = shSeen(s); if (t == null || t > END || shShotAt(t).set !== 'deck') continue;
      const g = SHG.pos(s), y0 = SHY.pos(s), d = Math.hypot(g[0] - y0[0], g[1] - y0[1]), lv = 1 / (1 + d / 5);
      const y = fx.step({ weight: 0.85, s: 0.95, body: 72, decay: 0.03, scuff: 0.08 }); SHX.bq(y, 'lp', 5000, 0.7, sr);
      putS(y, t, { vol: 0.32 * lv * r.range(0.85, 1.05), pan: MathX.clamp((g[0] - y0[0]) / 20, -0.7, 0.7), room: d > 12 ? far : deck, wet: d > 12 ? 0.9 : 0.55 });
      if (r.next() < 0.45) putS(fx.hit([[r.range(3800, 5200), 0.03, 1], [r.range(6100, 7200), 0.02, 0.6]], { width: 0.0003, len: 0.12 }), t + 0.03, { vol: 0.04 * lv, pan: MathX.clamp((g[0] - y0[0]) / 20, -0.7, 0.7), room: deck, wet: 0.4 });
    } }
  // his gasp as he sees it; his step back
  putS(fx.breath(0.55, { inhale: true, voice: 0.25, f0: 140 }), F(E.recoil + 0.05), { vol: 0.16, pan: -0.1, room: deck, wet: 0.35 });
  // his radio: squelch, his voice (garbled), squelch; the control room's reply (thinner, more broken)
  { const t0 = F(E.radio + 0.4);
    const squelch = (t) => { const n = Math.round(0.16 * sr), y = shNoise(fx, n, 'white'); for (let i = 0; i < n; i++) y[i] *= Math.exp(-i / (0.05 * sr)); SHX.bq(y, 'bp', 1800, 1.2, sr); putS(y, t, { vol: 0.07, pan: -0.1, room: deck, wet: 0.3, rate: 1 }); };
    const garble = (t, d, f0, k, vol) => {
      const n = Math.ceil(d * sr), y = new Float32Array(n);
      for (let a = 0; a < d - 0.12;) { const sd = r.range(0.09, 0.22), V = [[r.range(500, 900), 6, 1], [r.range(1100, 1900), 7, 0.7], [r.range(2300, 2900), 8, 0.3]];
        const v = shVoice(fx, sd, { f0: (u) => f0 * (1 + 0.12 * Math.sin(Math.PI * u) - 0.05 * u), formants: V, breath: 0.12, env: (u) => Math.min(1, u / 0.2) * Math.min(1, (1 - u) / 0.25) });
        const i0 = Math.round(a * sr); for (let i = 0; i < v.length && i0 + i < n; i++) y[i0 + i] += v[i];
        a += sd + (r.next() < 0.25 ? r.range(0.12, 0.3) : r.range(0.0, 0.05)); }
      SHX.bq(y, 'hp', 420, 0.8, sr); SHX.bq(y, 'lp', 2800, 0.8, sr);
      for (let i = 0; i < n; i++) y[i] = Math.tanh(k * y[i] / 0.2) * 0.2;
      putS(y, t, { vol, pan: -0.1, room: deck, wet: 0.25, rate: 1 }); };
    squelch(t0); garble(t0 + 0.15, 2.4, 118, 2.0, 0.12); squelch(t0 + 2.6);
    squelch(t0 + 3.3); garble(t0 + 3.45, 1.7, 165, 4.0, 0.08); squelch(t0 + 5.2);
    garble(t0 + 5.7, 1.3, 120, 2.0, 0.1); squelch(t0 + 7.05); }

  // ================================================================== your car: in, the door, the locks
  { const tA = F(E.atCar - 0.15);
    putS(clack(2100, 0.35, 0.8), tA, { vol: 0.12, room: deck, wet: 0.35 });                                   // the handle
    putS(thump(140, 0.5, 0.3), F(E.atCar + 0.15), { vol: 0.1, room: deck, wet: 0.3 });                      // the door opening
    putS(fx.creak(0.5, [[230, 0.02, 1], [520, 0.015, 0.6], [1150, 0.01, 0.3]], { rate: [20, 50] }), F(E.sit), { vol: 0.05 });   // the seat
    const shut = thump(58, 1.1, 0.7); const c1 = clack(700, 0.4, 0.5); for (let i = 0; i < c1.length && i < shut.length; i++) shut[i] += 0.4 * c1[i];
    putS(shut, F(E.doorShut), { vol: 0.34, room: deck, wet: 0.35 });
    // the central locking: two solenoids, 60 ms apart
    const tl = F(E.lock); const lk = thump(160, 0.35, 0.5); putS(lk, tl, { vol: 0.2, rate: 1 }); putS(thump(150, 0.35, 0.5), tl + 0.06, { vol: 0.15, rate: 1 });
    // the indicator relay: tick … tock, with each flash
    for (const dt of [0, 0.4]) { const tt = F(E.lock + dt); putS(fx.hit([[1900, 0.008, 1], [3100, 0.005, 0.5]], { width: 0.0003, len: 0.05 }), tt, { vol: 0.05, rate: 1 }); putS(fx.hit([[1500, 0.008, 1], [2600, 0.005, 0.5]], { width: 0.0003, len: 0.05 }), tt + 0.2, { vol: 0.04, rate: 1 }); } }

  // ================================================================== the engine: start, idle, away, down the ramp (cut at camera 7)
  // a four-cylinder: firing pulses at rpm/30 Hz through an intake/exhaust body; rpm(s) from the car's speed
  const engine = (t0, t1, rpmAt, o = {}) => {
    const n = Math.ceil((t1 - t0) * sr), y = new Float32Array(n), w = fx.white(n); let ph = 0, rr = rpmAt(t0), ra = wr(t0);
    for (let i = 0; i < n; i++) {
      if ((i & 63) === 0) { const t = t0 + i / sr; rr = rpmAt(t); ra = wr(t); }
      const f = rr / 30 * ra; ph += f / sr; const p = ph - Math.floor(ph), load = MathX.clamp((rr - 800) / 3000, 0, 1);
      y[i] = (Math.exp(-p * 7) - 0.14) * (0.7 + 0.3 * load) + w[i] * 0.08 * Math.exp(-p * 4) * (0.5 + load) + 0.25 * Math.sin(2 * Math.PI * ph * 0.5);
    }
    SHX.bq(y, 'lp', o.lp || 900, 0.8, sr); SHX.bq(y, 'hp', 28, 0.7, sr);
    const env = o.env || (() => 1); for (let i = 0; i < n; i++) y[i] *= env(t0 + i / sr) * Math.min(1, i / (0.03 * sr), (n - i) / (0.02 * sr));
    return y; };
  { const tE = F(E.engine), tCut = shB('cctv');
    // the starter: a whine with a slow chug, 0.6 s
    { const d = 0.6, n = Math.ceil(d * sr), y = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / sr; ph += 2 * Math.PI * (150 + 30 * t) / sr; y[i] = (Math.sin(ph) + 0.5 * Math.sin(3 * ph) + 0.25 * Math.sin(5 * ph)) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 9 * t)) * Math.min(1, t / 0.03, (d - t) / 0.05); }
      SHX.bq(y, 'lp', 2200, 0.7, sr); putS(y, tE, { vol: 0.12, rate: 1 }); }
    const rpm = (t) => { const s = shStoryAt(t), c = SHC.l4(s); if (s < E.engine + 0.6) return 800 + 1400 * shBump(s, E.engine + 0.55, E.engine + 0.9, 0.1, 0.6); if (s < E.reverse[1]) return 950 + 250 * shBump(s, E.reverse[0], E.reverse[1], 0.4, 0.6); const v = c.v; const g = v < 4.2 ? v / 4.2 : (v - 4.2) / 4; return 850 + 2900 * MathX.clamp(g, 0, 1) + (s > E.go && s < E.go + 0.6 ? 600 * shBump(s, E.go, E.go + 0.5, 0.1, 0.3) : 0); };
    const lev = (t) => { const m = shShotAt(t).mode; return /lockOut|reverse/.test(m) ? 0.8 : m === 'drive' ? 0.9 : m === 'ramp' ? 1 : 0.7; };
    const y = engine(tE + 0.5, tCut + 0.004, rpm, { env: (t) => lev(t) * (t > tCut ? 0 : 1) });
    K.put(y, tE + 0.5, { vol: 0.22, norm: true, room: deck, wet: 0.35 });
    // the tyres squealing on the ramp's painted concrete; its expansion joint under the front wheels, then the back
    { const t0 = F(E.ramp - 0.25), t1 = Math.min(tCut, F(E.ramp + 1.6)), d = t1 - t0;
      if (d > 0.1) { const n = Math.ceil(d * sr), x = shNoise(fx, n, 'white'), curve = []; for (let k = 0; k <= 30; k++) curve.push(1050 + 160 * Math.sin(k * 0.9) + 80 * Math.sin(k * 2.3));
        const y2 = shSweep(x, sr, 'bp', 14, curve); for (let i = 0; i < n; i++) { const u = i / n; y2[i] *= Math.sin(Math.PI * Math.min(1, u * 1.1)) * (0.75 + 0.25 * Math.sin(i / sr * 2 * Math.PI * 11)); }
        K.put(y2, t0, { vol: 0.08, norm: true, room: deck, wet: 0.5, rate: wr(t0) }); } }
    for (const dt of [0, 2.6 / SHP.ramp]) { const t = F(E.ramp + 0.05 + dt); if (t < tCut) putS(thump(110, 0.4, 0.5), t, { vol: 0.14, room: deck, wet: 0.4 }); } }

  // ================================================================== the exit lane: the engine idling in; the stop; the back seat
  { const x0 = shB('exit'), tS = F(E.exitStop);
    const rpm = (t) => { const s = shStoryAt(t), v = SHC.ex(s).v; return 800 + 500 * MathX.clamp(v / 3.2, 0, 1); };
    const y = engine(x0, END + 0.6, rpm, { lp: 700, env: (t) => (t > END ? 0 : 0.85) });
    K.put(y, x0, { vol: 0.18, norm: true, room: street, wet: 0.3 });
    // the brakes, the handbrake's ratchet, the terminal's two beeps
    putS(fx.creak(0.45, [[1750, 0.01, 1], [3500, 0.006, 0.4]], { rate: [40, 80] }), tS - 0.4, { vol: 0.03, room: street, wet: 0.3 });
    { const t = F(E.exitStop + 0.9); for (let k = 0; k < 7; k++) putS(fx.hit([[2600, 0.004, 1], [4100, 0.003, 0.5]], { width: 0.0002, len: 0.03 }), t + k * 0.045, { vol: 0.05 * (1 - k * 0.08), rate: 1, keep: true }); }
    { const t = F(E.exitStop + 1.8); for (const dt of [0, 0.32]) putS(fx.beep(1760, 0.11), t + dt, { vol: 0.035, pan: 0.35, room: street, wet: 0.4, rate: 1, keep: true }); }
    // the back seat: a slow creak of its vinyl as the shadow there sits up (nothing on the seat makes it)
    { const r0 = F(E.rise[0]), r1 = F(E.rise[1]);
      putS(fx.creak(r1 - r0, [[140, 0.03, 1], [330, 0.02, 0.55], [760, 0.012, 0.25]], { rate: [6, 16], jit: 0.6, env: (u) => Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.15)), 1.2) * (0.5 + 0.5 * u) }), r0 + 0.2, { vol: 0.07, pan: 0.1, rate: 1, keep: true }); } }
});
