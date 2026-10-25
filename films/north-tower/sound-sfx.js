/* =====================================================================
   SOUND · EFFECTS — the events, each placed when it happens (and, outside, when its sound would ARRIVE: from blocks
   away a collapse is seen before it is heard, about one second per 340 m).
     8:46        a deep boom far above, the building's groan running down it, the jolt (everything on the desks jumps),
                 the lights buzzing and stuttering, ceiling tiles falling, then the long creaks of the sway
     the stairs  your own steps at the crowd's pace, your breathing; the stair door; 9:03: a deep shudder through the
                 shaft, the handrail rattling; a bottle of water handed along; the hurt man helped past; the
                 firefighters: heavy boots, gear, hard breathing, their radios; water underfoot; faster at the end
     out         glass underfoot, the escalator, the wet concourse, the stairs up to the street
     9:59        the roar (from about 360 m: it arrives a second after the tower starts to fall), people running, you
                 running, the cloud's blast of air and grit, then muffled: your coughing, your breath
     10:28       from about a kilometre away: the gasp of the people round you first, then, three seconds later, the
                 sound arriving, low and long
   Nobody screams; there are no voices with words. Nothing shown or heard is graphic.
   ===================================================================== */

ntSound('sfx', 'events', function (ctx, bus, K) {
  const { fx, sr, r } = K, P = ntPl(), hit = NT.hit;
  const room = K.verb('office', 0.9, { bright: 0.4, damp: 4, wet: 0.35, seed: 23, pre: 0.008 });
  const shaft = K.verb('shaft', 2.6, { bright: 0.55, damp: 2.2, wet: 0.5, seed: 33, pre: 0.006, early: [[0.011, 0.5], [0.023, 0.35], [0.041, 0.25], [0.067, 0.15]] });
  const big = K.verb('hall', 3.6, { bright: 0.45, damp: 2.4, wet: 0.5, seed: 39, pre: 0.02 });
  const out = K.verb('out', 2.2, { bright: 0.4, damp: 3, wet: 0.45, seed: 43, pre: 0.03 });
  const head = K.verb('head', 0.35, { bright: 0.3, damp: 5, wet: 0.25, seed: 47 });
  const breathe = (t, d, vol, o = {}) => K.put(fx.breath(d, o), t, { vol, norm: true, pan: o.pan || 0, room: o.room || head, wet: o.wet ?? 0.3, lp: o.lp || 5200 });
  const gasp = (t, vol, pan, rm) => breathe(t, r.range(0.28, 0.45), vol, { inhale: true, voice: 0.25, f0: r.range(140, 260), pan, room: rm, wet: 0.6, env: (u) => Math.min(1, u / 0.15) * Math.pow(1 - u, 1.5) });
  const cough = (t, vol, o = {}) => breathe(t, 0.26, vol, Object.assign({ voice: 1.0, f0: r.range(105, 140), env: (u) => Math.min(1, u / 0.04) * Math.pow(1 - u, 2.2) }, o));

  // ================= 1 · the office
  // your keyboard at your desk
  for (let t = NT.morning + 0.8; t < NT.sky - 0.6; t += r.range(0.6, 1.6)) {
    for (let k = 0, n = r.int(5, 14), tt = t; k < n && tt < NT.sky - 0.5; k++, tt += r.range(0.08, 0.16)) K.put(fx.hit([[r.range(1900, 2600), 0.008, 1], [r.range(4200, 5200), 0.004, 0.5], [r.range(500, 700), 0.014, 0.6]], { width: 0.0004, noise: 0.5, nhp: 1800 }), tt, { vol: 0.012 * r.range(0.6, 1), norm: true, pan: r.range(-0.15, 0.15), room, wet: 0.2 });
    t += 0.5;
  }
  // ---- 8:46:40. The boom, far above; the building's groan; the jolt
  {
    const boom = fx.hit([[34, 0.6, 1], [48, 0.5, 0.8], [71, 0.35, 0.6], [118, 0.2, 0.4], [190, 0.12, 0.25]], { width: 0.03, noise: 0.6, nlen: 0.05, nhp: 200, len: 3.5 });
    NTX.bq(boom, 'lp', 1400, 0.7, sr);
    K.put(boom, hit, { vol: 0.4, norm: true, pan: 0, room, wet: 0.3 });
    const R0 = ntRoar(fx, 4.5, { rise: 0.25, hold: 0.9, tail: 1.6, dist: 0.55 });
    K.putLR(R0.L, R0.R, hit + 0.04, { vol: 0.26, norm: true, room, wet: 0.2 });
    // the frame of the building twisting: a long low groan, then the creaks at each end of the sway (6.5 s, dying)
    K.put(fx.creak(3.2, [[r.range(70, 90), 0.06, 1], [r.range(180, 220), 0.04, 0.6], [r.range(420, 480), 0.02, 0.3]], { rate: [9, 26], env: (u) => Math.min(1, u / 0.08) * Math.pow(1 - u, 1.2) }), hit + 0.25, { vol: 0.13, norm: true, pan: -0.2, room, wet: 0.4 });
    for (let k = 1; k <= 4; k++) { const t = hit + 1.6 + (k - 1) * 3.25, a = Math.exp(-(t - hit) / 12); K.put(fx.creak(r.range(1.4, 2.2), [[r.range(85, 110), 0.05, 1], [r.range(230, 270), 0.03, 0.55], [r.range(560, 640), 0.015, 0.25]], { rate: [6, 18] }), t, { vol: 0.07 * a, norm: true, pan: k % 2 ? 0.35 : -0.35, room, wet: 0.45 }); }
    // everything on the floor rattles: panels, the window frames, the desk; your mug
    K.put(fx.creak(1.6, fx.panelModes(0.5), { rate: [40, 90], jit: 0.6, env: (u) => Math.exp(-u * 3.5) }), hit + 0.02, { vol: 0.09, norm: true, pan: 0.25, room, wet: 0.3 });
    K.put(fx.creak(1.2, fx.glassModes().map(([f, tau, a]) => [f * 2.2, tau, a]), { rate: [30, 70], jit: 0.7, env: (u) => Math.exp(-u * 4) }), hit + 0.05, { vol: 0.05, norm: true, pan: 0.6, room, wet: 0.3 });
    const cup = fx.cupModes();
    [0, 0.09, 0.21, 0.36].forEach((dt, i) => K.put(fx.hit(cup, { width: 0.0003, amp: 1 }), hit + 0.03 + dt, { vol: 0.03 * Math.pow(0.6, i), norm: true, pan: -0.3, room, wet: 0.2 }));
    // the lights: the ballasts buzz and stutter, one pops
    K.put(ntCrackle(fx, 2.6, { rate: 500, hp: 2500, env: (u) => Math.exp(-u * 2.5) * (0.4 + 0.6 * Math.abs(Math.sin(u * 40))) }), hit + 0.05, { vol: 0.03, norm: true, pan: 0.1, room, wet: 0.4 });
    ntTone(K, hit + 0.05, 2.4, 120, [[1, 1], [2, 0.8], [3, 0.6], [5, 0.3]], (u, t) => Math.exp(-u * 2) * (0.5 + 0.5 * Math.max(0, noise1(t * 30, 3))), { vol: 0.02, f: [['lp', 2000]], room, wet: 0.3 });
    K.put(fx.hit([[2400, 0.01, 1], [5200, 0.006, 0.6]], { width: 0.0002, noise: 1, nlen: 0.01, nhp: 1500 }), hit + 0.62, { vol: 0.03, norm: true, pan: 0.5, room, wet: 0.5 });
    // the people round you: a gasp or two; and you
    breathe(hit + 0.15, 0.5, 0.06, { inhale: true, voice: 0.2, f0: 150 });
    [[0.45, -0.5], [0.7, 0.4], [1.1, -0.2], [1.6, 0.7]].forEach(([dt, pan]) => gasp(hit + dt, 0.022, pan, room));
    // the ceiling tiles (the same five as the picture: they come loose, fall 2.6 m, land)
    [[-1.8, 0.15], [0.6, 0.55], [-4.9, 0.9], [2.4, 1.25], [-6.5, 1.6]].forEach(([x, dl]) => {
      const t0 = hit + dl, pan = MathX.clamp((x + 3) / 6, -0.8, 0.8);
      K.put(fx.rustle(0.25, { density: 600, rub: 0.3, lo: 900, hi: 5000, grain: 0.006, env: (u) => Math.exp(-u * 4) }), t0, { vol: 0.012, norm: true, pan, room, wet: 0.3 });
      K.put(fx.slap(fx.woodModes(r.range(260, 340), 0.5), { width: 0.006, amp: 0.8, skin: 0.4 }), t0 + 0.73, { vol: 0.05, norm: true, pan, room, wet: 0.3 });
      K.put(fx.rustle(0.6, { density: 300, rub: 0.15, lo: 1500, hi: 7000, grain: 0.004, env: (u) => Math.exp(-u * 3) }), t0 + 0.75, { vol: 0.01, norm: true, pan, room, wet: 0.3 });
    });
    // the tiles left hanging, swinging on their wires
    for (const [dt, pan] of [[0.3, 0.3], [0.7, -0.6], [1.1, 0.6]]) K.put(fx.creak(1.4, [[r.range(900, 1200), 0.01, 1], [r.range(2200, 2600), 0.006, 0.5]], { rate: [12, 30], env: (u) => Math.exp(-u * 2.5) }), hit + dt, { vol: 0.008, norm: true, pan, room, wet: 0.3 });
  }
  // after: settling grit, a creak; you get up (the chair), take your bag, and walk to the core
  for (const [t, v] of [[NT.after + 2.4, 0.04], [NT.outside + 3.5, 0.03], [NT.nobody + 2.2, 0.025]]) K.put(fx.creak(1.6, [[r.range(80, 100), 0.05, 1], [r.range(200, 240), 0.03, 0.5]], { rate: [6, 16] }), t, { vol: v, norm: true, pan: r.range(-0.5, 0.5), room, wet: 0.5 });
  K.put(fx.rustle(0.7, { density: 260, rub: 0.4, lo: 300, hi: 3000, grain: 0.01 }), NT.go - 0.1, { vol: 0.02, norm: true, pan: 0.2, room, wet: 0.2 });     // the chair, your bag
  K.put(fx.rustle(0.35, { density: 600, rub: 0.5, lo: 700, hi: 5000, grain: 0.006, peak: 2200 }), NT.go + 0.5, { vol: 0.016, norm: true, pan: 0.15, room, wet: 0.2 });
  for (let t = NT.go + 0.8, i = 0; t < NT.known; t += 0.55, i++) K.put(fx.step({ weight: 0.3, scuff: 0.25, s: 0.8 }), t, { vol: 0.012, norm: true, pan: i % 2 ? 0.1 : -0.1, lp: 2200, room, wet: 0.2 });   // (carpet)
  for (let t = NT.known + 0.2, i = 0; t < NT.stair - 0.1; t += 0.56, i++) K.put(fx.step({ weight: 0.5, scuff: 0.1 }), t, { vol: 0.016, norm: true, pan: i % 2 ? 0.1 : -0.1, room, wet: 0.35 });   // (the corridor)

  // ================= 2 · the stairs
  // the door: its push bar, the heavy door swinging shut behind you
  const pushBar = (t, pan, rm) => { K.put(fx.hit(fx.metalModes(r.range(700, 820), 0.35), { width: 0.0008, noise: 0.5, nhp: 1500, extra: [[0.035, 0.0005, 0.6]] }), t, { vol: 0.05, norm: true, pan, room: rm, wet: 0.4 }); };
  const doorShut = (t, pan, rm) => { K.put(fx.hit([[62, 0.12, 1], [118, 0.08, 0.6], [240, 0.05, 0.4], [880, 0.02, 0.2]], { width: 0.004, noise: 0.4, nhp: 600, extra: [[0.02, 0.0004, 0.15]] }), t, { vol: 0.07, norm: true, pan, room: rm, wet: 0.6 }); };
  pushBar(NT.stair + 0.35, 0.15, shaft); doorShut(NT.stair + 3.1, -0.2, shaft);
  // your steps: one every tread at the pace of the crowd (and on the landing as you come in)
  {
    const steps = Array.from({ length: 6 }, () => fx.step({ weight: 0.55, scuff: 0.12, body: 82 }));
    for (let k = 0; k < 4; k++) K.put(steps[k % 6], NT.stair + 0.6 + k * 0.55, { vol: 0.02, norm: true, pan: k % 2 ? 0.1 : -0.1, room: shaft, wet: 0.3 });
    for (const s of NT_SHOTS) {
      if (s.set !== 'stair' || s.mode === 'transfer' || s.mode === 'empty') continue;
      let last = Math.floor(ntStairLocal(s.t0, s) * 20), i = 0;
      for (let t = s.t0; t < s.t1; t += 1 / 120) {
        const k = Math.floor(ntStairLocal(t, s) * 20);
        if (k > last) {
          last = k; i++;
          const wet = s.mode === 'water' || s.mode === 'thin' ? 1 : 0;
          K.put(steps[i % 6], t, { vol: 0.02 * (s.mode === 'thin' ? 1.15 : 1), norm: true, pan: i % 2 ? 0.1 : -0.1, room: shaft, wet: 0.3 });
          if (wet) K.put(fx.rustle(0.14, { density: 1600, rub: 0.5, lo: 900, hi: 6000, grain: 0.004, env: (u) => Math.exp(-u * 5) }), t + 0.012, { vol: 0.012 * (s.mode === 'water' ? 1 : 0.6), norm: true, pan: i % 2 ? 0.1 : -0.1, room: shaft, wet: 0.3 });
        }
      }
    }
  }
  // your breathing on the stairs: quiet, steady; quicker at the end
  for (let t = NT.stair + 4, i = 0; t < NT.mezz - 0.5; i++) {
    if (ntShotAt(t).mode === 'transfer') { t += 1; continue; }
    const fast = ntEv(t, NT.thin, NT.thin + 2), d = (i % 2 ? 1.05 : 1.25) * (1 - 0.3 * fast);
    breathe(t, d, (0.016 + 0.01 * fast) * (t > NT.shake && t < NT.shake + 3 ? 1.6 : 1), i % 2 ? {} : { inhale: true });
    t += d + 0.45 - 0.25 * fast;
  }
  // 9:03:11, the second plane, felt in here: a deep shudder through the shaft, the handrail rattling, the lights dipping
  {
    const t = NT.shake;
    const thud = fx.hit([[29, 0.7, 1], [41, 0.55, 0.8], [63, 0.4, 0.5], [97, 0.25, 0.3]], { width: 0.05, noise: 0.3, nlen: 0.08, nhp: 120, len: 3.5 });
    NTX.bq(thud, 'lp', 600, 0.7, sr);
    K.put(thud, t, { vol: 0.42, norm: true, pan: 0, room: shaft, wet: 0.3 });
    const R1 = ntRoar(fx, 4, { rise: 0.35, hold: 0.8, tail: 1.3, dist: 0.8 }); K.putLR(R1.L, R1.R, t + 0.05, { vol: 0.2, norm: true, room: shaft, wet: 0.3 });
    K.put(fx.creak(1.8, fx.metalModes(r.range(560, 640), 0.4), { rate: [35, 80], jit: 0.7, env: (u) => Math.exp(-u * 3) }), t + 0.05, { vol: 0.05, norm: true, pan: 0.35, room: shaft, wet: 0.4 });
    K.put(ntCrackle(fx, 1.4, { rate: 350, hp: 2500, env: (u) => Math.exp(-u * 3) }), t + 0.1, { vol: 0.018, norm: true, pan: -0.2, room: shaft, wet: 0.5 });
    [[0.35, -0.5], [0.6, 0.6], [0.9, 0.2]].forEach(([dt, pan]) => gasp(t + dt, 0.02, pan, shaft));
  }
  // "People pass water down the line": a plastic bottle handed to you, and on
  K.put(fx.rustle(0.6, { density: 500, rub: 0.2, lo: 1500, hi: 9000, grain: 0.003, peak: 3200, env: (u) => Math.pow(Math.sin(Math.PI * u), 0.6) }), ntCap('calm', 1).show + 0.6, { vol: 0.02, norm: true, pan: 0.25, room: shaft, wet: 0.3 });
  K.put(fx.liquid(0.5, (x) => Math.sin(Math.PI * x / 0.5), { f: 650 }), ntCap('calm', 1).show + 1.0, { vol: 0.008, norm: true, pan: 0.2, room: shaft, wet: 0.2 });
  // the man who is hurt, helped down past you: a dragging step, hard breathing
  {
    const t0 = NT.hurt - 1.5;
    for (let k = 0; k < 7; k++) { const t = t0 + k * 0.8; K.put(fx.step({ weight: 0.4, scuff: 0.6 }), t, { vol: 0.016, norm: true, pan: 0.45 - k * 0.04, room: shaft, wet: 0.4 }); K.put(fx.step({ weight: 0.45 }), t + 0.3, { vol: 0.013, norm: true, pan: 0.5 - k * 0.04, room: shaft, wet: 0.4 }); }
    for (let k = 0; k < 5; k++) breathe(t0 + 0.3 + k * 1.05, 0.8, 0.02, { voice: 0.35, f0: 115, pan: 0.45, room: shaft, wet: 0.5, inhale: k % 2 === 1 });
  }
  // the transfer hallway on 48: out of one stairway (its door), along, into the next
  pushBar(NT.transfer + 0.15, -0.1, room); doorShut(NT.transfer + 1.6, -0.3, room);
  for (let t = NT.transfer + 0.5, i = 0; t < NT.ff - 0.7; t += 0.56, i++) K.put(fx.step({ weight: 0.45, scuff: 0.15 }), t, { vol: 0.016, norm: true, pan: i % 2 ? 0.1 : -0.1, room, wet: 0.4 });
  pushBar(NT.ff - 0.5, 0.1, shaft);
  // the firefighters: boots (heavy, slow), their gear clinking, hard breathing; radios crackling
  {
    const ffSteps = Array.from({ length: 6 }, () => { const y = fx.step({ weight: 0.95, scuff: 0.2, body: 64, decay: 0.05 }); NTX.strike(y, Math.round(0.03 * sr), Math.round(0.0003 * sr), 0.12, fx.metalModes(r.range(1700, 2300), 0.25), sr); return y; });
    const span = (t0, t1, lv) => {
      for (let f = 0; f < 6; f++) {
        const pan = r.range(-0.1, 0.7);
        for (let t = t0 + f * 1.3 + r.range(0, 0.4); t < t1; t += r.range(0.62, 0.8)) K.put(ffSteps[r.int(0, 5)], t, { vol: 0.016 * lv * r.range(0.6, 1), norm: true, pan, room: shaft, wet: 0.45 });
        for (let t = t0 + f * 1.3 + 0.5; t < t1; t += r.range(1.4, 2.0)) breathe(t, 0.9, 0.012 * lv, { voice: 0.25, f0: r.range(95, 125), pan, room: shaft, wet: 0.5, inhale: r.chance(0.5) });
      }
    };
    span(NT.ff + 0.6, ntCap('ff', 3).show, 1); span(ntCap('ff', 3).show + 2.5, NT.water - 0.3, 1.1);
    // the one resting on the landing: slow heavy breaths
    for (let t = ntCap('ff', 3).show, k = 0; t < NT.ff2; t += 1.4, k++) breathe(t, 1.1, 0.026, { voice: 0.3, f0: 105, pan: 0.55, room: shaft, wet: 0.4, inhale: k % 2 === 0 });
    // radios: a burst of garbled talk (no words), a squelch and the chirp at the end
    const radio = (t, d, pan) => {
      const B = ntBabble(fx, d, { voices: 1, f0: [110, 140], talk: 1 }), y = new Float32Array(B.L.length);
      for (let i = 0; i < y.length; i++) y[i] = (B.L[i] + B.R[i]) + 0.06 * (r.next() * 2 - 1);
      NTX.bq(y, 'hp', 700, 0.9, sr); NTX.bq(y, 'lp', 2800, 0.9, sr);
      for (let i = 0; i < y.length; i++) y[i] = Math.tanh(y[i] * 6) * 0.5;
      K.put(y, t, { vol: 0.013, norm: true, pan, room: shaft, wet: 0.3 });
      K.put(ntCrackle(fx, 0.12, { rate: 2000, hp: 1200 }), t + d, { vol: 0.01, norm: true, pan, room: shaft, wet: 0.3 });
      K.put(fx.beep(1400, 0.06), t + d + 0.1, { vol: 0.005, norm: true, pan, room: shaft, wet: 0.3 });
    };
    [[NT.ff + 2.4, 1.3, 0.5], [ntCap('ff', 2).show + 1.1, 0.9, 0.2], [NT.ff2 + 1.6, 1.6, 0.4], [ntCap('ff2', 1).show + 2.0, 1.0, 0.6]].forEach(([t, d, p]) => radio(t, d, p));
  }

  // ================= 3 · the lobby, the concourse, the stairs up
  for (let t = NT.mezz + 0.3, i = 0; t < NT.esc; t += 0.55, i++) { const y = fx.step({ weight: 0.45, scuff: 0.2 }), g = fx.rustle(0.1, { density: 2600, rub: 0.1, lo: 2500, hi: 9500, grain: 0.002, env: (u) => Math.exp(-u * 6) }); for (let k = 0; k < g.length; k++) y[k] += g[k]; K.put(y, t, { vol: 0.02, norm: true, pan: i % 2 ? 0.1 : -0.1, room: big, wet: 0.35 }); }
  for (let t = NT.esc + 0.3, i = 0; t < NT.conc; t += 0.5, i++) { const y = fx.step({ weight: 0.45 }); NTX.strike(y, 0, Math.round(0.001 * sr), 0.25, fx.metalModes(r.range(380, 460), 0.3), sr); K.put(y, t, { vol: 0.02, norm: true, pan: i % 2 ? 0.1 : -0.1, room: big, wet: 0.35 }); }
  for (let t = NT.conc + 0.3, i = 0; t < NT.five; t += 0.54, i++) { K.put(fx.step({ weight: 0.4, scuff: 0.1 }), t, { vol: 0.016, norm: true, pan: i % 2 ? 0.1 : -0.1, room: big, wet: 0.3 }); K.put(fx.rustle(0.16, { density: 1600, rub: 0.6, lo: 800, hi: 5500, grain: 0.004, env: (u) => Math.exp(-u * 5) }), t + 0.01, { vol: 0.014, norm: true, pan: i % 2 ? 0.1 : -0.1, room: big, wet: 0.3 }); }
  for (let t = NT.five + 0.2, i = 0; t < NT.back - 0.5; t += i < 12 ? 0.46 : 0.55, i++) K.put(fx.step({ weight: 0.5, scuff: 0.15 }), t, { vol: 0.018, norm: true, pan: i % 2 ? 0.1 : -0.1, room: out, wet: 0.25 });

  // ================= 4 · 9:59: the South Tower. Its sound reaches you about a second after it starts to fall
  {
    const tS = NT.roar + 1.2, arrive = tS + 1.05;
    const R2 = ntRoar(fx, 22, { rise: 2.6, hold: 9.5, tail: 5, dist: 0.25 });
    K.putLR(R2.L, R2.R, arrive, { vol: 0.4, norm: true, room: out, wet: 0.25, stop: NT.cloudHit + 0.25, fade: 0.5 });
    // (inside the cloud it goes on, far away and muffled, and dies before the grey)
    K.put(R2.L, NT.cloudHit - 0.2, { offset: NT.cloudHit - 0.2 - arrive, vol: 0.2, norm: true, lp: 240, fadeIn: 0.4, stop: NT.grey + 1.2, fade: 3.5 });
    const sub = fx.hit([[27, 1.2, 1], [36, 1.0, 0.8], [52, 0.6, 0.5]], { width: 0.08, len: 6 }); NTX.bq(sub, 'lp', 300, 0.7, sr);
    for (const dt of [0.4, 2.1, 4.0, 6.3]) K.put(sub, arrive + dt, { vol: 0.2, norm: true, pan: r.range(-0.2, 0.2), room: out, wet: 0.2 });
    [[0.2, -0.6], [0.5, 0.5], [0.8, -0.1], [1.2, 0.7]].forEach(([dt, pan]) => gasp(arrive - 0.6 + dt, 0.03, pan, out));
    // you run: fast steps, hard breathing
    const run0 = NT.run;
    for (let t = run0 + 0.3, i = 0; t < NT.cloudHit + 0.2; t += 0.31, i++) K.put(fx.step({ weight: 0.75, scuff: 0.3 }), t, { vol: 0.03, norm: true, pan: i % 2 ? 0.12 : -0.12, room: out, wet: 0.2 });
    for (let t = run0 + 0.4, i = 0; t < NT.cloudHit; t += 0.62, i++) breathe(t, 0.5, 0.04, i % 2 ? { voice: 0.2, f0: 150 } : { inhale: true, voice: 0.15, f0: 160 });
    // the cloud reaches you: a blast of air and grit, then everything goes far away
    const blast = ntNoise(fx, Math.ceil(3 * sr), 'pink');
    for (let i = 0; i < blast.length; i++) { const t = i / sr; blast[i] *= Math.min(1, t / 0.08) * Math.exp(-t / 0.9); }
    NTX.bq(blast, 'lp', 2400, 0.7, sr);
    K.put(blast, NT.cloudHit - 0.15, { vol: 0.26, norm: true, pan: 0, room: out, wet: 0.2 });
    K.put(fx.rustle(3.5, { density: 1800, rub: 0.2, lo: 1500, hi: 9000, grain: 0.003, env: (u) => Math.exp(-u * 1.6) }), NT.cloudHit - 0.1, { vol: 0.05, norm: true, pan: 0, room: out, wet: 0.2 });
  }
  // inside the cloud: you cough; your breath close, through your shirt
  [0.9, 2.4, 2.75, 5.2, 8.0].forEach((dt, i) => cough(NT.cloudHit + dt, 0.04 * (i === 2 ? 0.7 : 1)));
  for (let t = NT.cloudHit + 1.4, i = 0; t < NT.grey + 6; i++) { const d = i % 2 ? 1.0 : 1.2; breathe(t, d, 0.03, Object.assign({ lp: 2400 }, i % 2 ? {} : { inhale: true })); t += d + 0.5; }
  for (let t = NT.cloudHit + 2; t < NT.grey + 5; t += r.range(0.1, 0.5)) K.put(fx.rustle(0.05, { density: 2000, rub: 0.1, lo: 2500, hi: 8000, grain: 0.002, env: (u) => 1 - u }), t, { vol: 0.005 * r.range(0.3, 1), norm: true, pan: r.range(-0.9, 0.9), room: out, wet: 0.3 });
  // the grey: your steps soft in the dust; a sheet of paper going by
  for (let t = NT.grey + 1.5, i = 0; t < NT.walk; t += 0.62, i++) K.put(fx.step({ weight: 0.3, scuff: 0.5, s: 0.85 }), t, { vol: 0.012, norm: true, pan: i % 2 ? 0.1 : -0.1, lp: 3200, room: out, wet: 0.2 });
  for (let t = NT.walk + 0.3, i = 0; t < NT.fallShot - 0.3; t += 0.6, i++) K.put(fx.step({ weight: 0.35, scuff: 0.4 }), t, { vol: 0.013, norm: true, pan: i % 2 ? 0.1 : -0.1, lp: 3600, room: out, wet: 0.25 });
  K.put(fx.rustle(1.4, { density: 120, rub: 0.15, lo: 1500, hi: 8000, grain: 0.01 }), ntCap('grey', 1).show + 1.6, { vol: 0.01, norm: true, pan: 0.4, room: out, wet: 0.3 });

  // ================= 10:28: the North Tower, from about a kilometre: the people round you gasp; three seconds later
  //                   the sound arrives, low and long
  {
    const tN = NT.fall + 0.6, arrive = tN + 3.15;
    [[0.9, -0.5], [1.2, 0.4], [1.5, -0.1], [2.0, 0.6], [2.4, -0.7]].forEach(([dt, pan]) => gasp(tN + dt, 0.025, pan, out));
    const R3 = ntRoar(fx, 24, { rise: 3.2, hold: 10, tail: 6, dist: 0.8 });
    K.putLR(R3.L, R3.R, arrive, { vol: 0.2, norm: true, room: out, wet: 0.45, stop: NT.out + 0.2, fade: 1.8 });
  }
});
