/* =====================================================================
   SOUND · EFFECTS — the events, in film order:
     the crossing    she steps back off the kerb (a wet heel, the umbrella); later you brake, and she crosses in front
                     of you (wet steps)
     the flat        the TV (a presenter you can't make out, the draw's sting, the ball machine, every ball dropping,
                     the fanfare and the studio crowd through a small speaker); you get up off the bed; the ticket
                     shaking; the $10,000 bundle on the table; the notes rising round you; the pen writing the note;
                     the note pressed on the fridge; the phone sending; the messages arriving (40, 900, 2,600: a swarm);
                     the inbox scrolling; the phone switched off; the knocks; the peephole; a voice through the door;
                     the interest arriving, a dollar at a time
     the house       the front door, your steps in a hard empty hall, the keys; the garage lights; the car starting;
                     breakfast (a cup, a spoon); a cloth on the stone; ice in a glass; the TV and the remote; the gate
                     closing; years flicking past; the box in the garage, the note unfolded
     the streets     the neighbour's cloth on the new car, a camera; your steps downtown, the phone; a letterbox,
                     the door, her steps to the postbox
     the lab         the envelope, the $20 into the tin; the folder, the chairs, the laughing; the card, the plate,
                     the cookies; the coin, the dice, the money slapped down, the pretzels; the sweets; the stamps;
                     the papers dropped and picked up
     the marina      a tender passing
   ===================================================================== */

sbSound('sfx', 'events', function (ctx, bus, K) {
  const { fx, sr, r } = K, cap = (id, k) => sbCap(id, k).show;
  const room = K.verb('room', 0.8, { bright: 0.45, damp: 3.6, wet: 0.35, seed: 31, early: [[0.007, 0.5], [0.013, 0.35], [0.021, 0.25]] });
  const hall = K.verb('hall', 2.6, { bright: 0.55, damp: 2.2, wet: 0.45, seed: 33, early: [[0.021, 0.5], [0.043, 0.4], [0.067, 0.3]] });
  const out = K.verb('out', 1.8, { bright: 0.4, damp: 2.8, wet: 0.4, seed: 35, pre: 0.015 });
  const put = (y, t, vol, o = {}) => K.put(y, t, Object.assign({ vol, norm: true }, o));
  // the TV's small speaker: a narrow band, a little honk
  const tvf = (y) => { SBX.bq(y, 'hp', 260, 0.7, sr); SBX.bq(y, 'lp', 4200, 0.7, sr); SBX.bq(y, 'peak', 1800, 1.0, sr, 4); return y; };
  const tvLR = (o, t, vol) => { tvf(o.L); tvf(o.R); return K.putLR(o.L, o.R, t, { vol, norm: true, room, wet: 0.4 }); };
  const voice = (text, f0, o = {}) => sbVoice(fx, text, Object.assign({ f0 }, o));
  // small things
  const paper = (d, o = {}) => fx.rustle(d, Object.assign({ density: 380, rub: 0.25, lo: 900, hi: 7000, grain: 0.008 }, o));
  const cloth = (d, o = {}) => fx.rustle(d, Object.assign({ density: 160, rub: 0.5, lo: 400, hi: 3500, grain: 0.02 }, o));
  const crunch = (o = {}) => { const y = fx.rustle(o.d || 0.14, { density: o.dens || 1600, rub: 0.08, lo: o.lo || 700, hi: o.hi || 6500, grain: 0.004, env: (u) => Math.exp(-u * 5) * Math.min(1, u * 30) }); SBX.strike(y, 0, Math.round(0.002 * sr), 0.3, [[180, 0.02, 1], [420, 0.012, 0.5]], sr); return y; };
  const ping = (f = 1760) => fx.hit([[f, 0.18, 1], [f * 1.5, 0.12, 0.5], [f * 2, 0.07, 0.3]], { width: 0.0006 });
  const tick = (f = 3000) => fx.hit([[f, 0.008, 1], [f * 1.7, 0.005, 0.5]], { width: 0.0002, noise: 0.2, nhp: 3000 });
  const buzz = (d, f = 165) => { const y = fx.arr(d + 0.02), n = Math.ceil(d * sr); let ph = 0; for (let i = 0; i < n; i++) { const t = i / sr; ph += f * (1 + 0.02 * Math.sin(t * 40)) / sr; const sq = Math.sin(2 * Math.PI * ph) > 0 ? 1 : -1; y[i] = (0.6 * sq + 0.4 * Math.sin(4 * Math.PI * ph)) * Math.min(1, t / 0.015, (d - t) / 0.03); } SBX.bq(y, 'lp', 1800, 0.7, sr); SBX.bq(y, 'hp', 90, 0.7, sr); return y; };
  const steps = (t0, t1, period, fn) => { for (let t = t0, i = 0; t < t1; t += period * (1 + 0.04 * Math.sin(i * 2.7)), i++) fn(t, i); };
  const wetStep = (w = 0.5) => { const y = fx.step({ weight: w, scuff: 0.05 }); const z = fx.liquid(0.12, (x) => Math.exp(-x / 0.03) * Math.min(1, x / 0.003), { f: 1200 }); for (let i = 0; i < z.length && i < y.length; i++) y[i] += z[i] * 0.6; return y; };
  // an engine's tone over d seconds: rpm(u) (u = 0…1), its load (0…1)
  const engine = (d, rpm, load = () => 0.5) => {
    const n = Math.ceil(d * sr), y = fx.arr(d + 0.05), rasp = fx.white(n); let ph = 0, a = 1;
    for (let i = 0; i < n; i++) {
      const u = i / n, f = rpm(u) / 30, ld = load(u); ph += f / sr; if (ph >= 1) { ph -= 1; a = 0.75 + 0.5 * r.next(); }
      const p = 2 * Math.PI * ph, pulse = Math.pow(0.5 + 0.5 * Math.cos(p), 3);
      y[i] = (0.5 * Math.sin(p / 2 + 0.4) + Math.sin(p) + 0.5 * Math.sin(2 * p + 0.3) + 0.3 * Math.sin(3 * p + 1.1)) * (0.6 + 0.4 * a) * (0.35 + 0.65 * ld) + rasp[i] * pulse * (0.15 + 0.5 * ld);
    }
    SBX.bq(y, 'lp', 1100, 0.7, sr); SBX.bq(y, 'lp', 1600, 0.7, sr);
    return y;
  };

  // ================= 1 · the cold open: she steps up to the kerb, then back as you roll over the crossing
  {
    const T = SB.coldPass;
    put(wetStep(0.45), T - 1.55, 0.03, { pan: 0.55, lp: 2500 }); put(wetStep(0.5), T - 0.3, 0.04, { pan: 0.6, lp: 2500 });
    put(cloth(0.35, { lo: 600, hi: 4000 }), T - 0.35, 0.03, { pan: 0.6 });                                       // the umbrella jerks
    for (const dt of [-0.12, 0.05, 2.62, 2.79]) put(fx.hit(fx.woodModes(60, 2), { width: 0.006 }), T + dt, 0.035, { lp: 500 });   // the stripes under the tyres
  }
  // ================= 2 · the flat: the TV, the draw
  {
    // the presenter (words you can't make out), through the TV's speaker, from the flat to the fanfare
    const lines = [[SB.flat + 0.4, 'and tonight, the biggest jackpot we have ever seen'], [SB.flat + 3.6, 'stay with us, we are live'], [SB.rent + 1.2, 'the machines are ready'],
      [SB.draw + 1.6, 'the biggest jackpot in history!'], [cap('draw', 1) + 0.8, 'good luck everyone'], [SB.balls + 0.3, 'here we go'], [SB.ball[0] + 0.9, 'number seven'], [SB.ball[1] + 0.5, 'twenty three'],
      [SB.ball[3] + 0.4, 'forty one'], [SB.ball[4] + 0.4, 'twelve'], [SB.won + 1.2, 'one winning ticket!']];
    for (const [t, txt] of lines) { const y = tvf(voice(txt, 128, { rate: 1.15, fs: 1.0 })); put(y, t, 0.035, { pan: -0.15, room, wet: 0.4 }); }
    // the draw's sting: a brass chord through the speaker, a drum
    { const L = fx.arr(1.6), R = fx.arr(1.6); for (const [f, a] of [[220, 1], [277, 0.8], [330, 0.8], [440, 0.6]]) for (let i = 0; i < 1.4 * sr; i++) { const t = i / sr, e = Math.min(1, t / 0.02) * Math.exp(-t / 0.6), v = Math.sin(2 * Math.PI * f * t) + 0.4 * Math.sin(4 * Math.PI * f * t) + 0.2 * Math.sin(6 * Math.PI * f * t); L[i] += v * e * a; R[i] += v * e * a * 0.9; }
      tvLR({ L, R }, SB.draw + 0.15, 0.05); }
    // the ball machine: air roaring through the speaker; each ball popping up the tube and settling
    sbBed(K, SB.balls + 0.2, SB.won + 0.9, { colour: 'pink', f: [['bp', 900, 0.6], ['hp', 300], ['lp', 3500]], vol: 0.025, mono: true, pan: -0.15, am: 0.4, wr: 2, room, wet: 0.3, env: (u, t) => 1 - 0.85 * sbEv(t, SB.ball[5], SB.ball[5] + 0.8) });
    SB.ball.forEach((t, i) => {
      for (const [dt, a] of [[-0.62, 0.5], [-0.4, 0.4], [-0.08, 0.7], [0, 1]]) put(tvf(fx.hit(fx.cupModes(1.3 - 0.05 * i).map(([f, tau, x]) => [f, tau * 0.4, x]), { width: 0.0003 })), t + dt, 0.04 * a, { pan: -0.15, room, wet: 0.3 });
      put(paper(0.35, { density: 600, lo: 2000, hi: 8000, rub: 0.5 }), t + 0.3, 0.018, { pan: 0.25 });                // your pen rings it on the ticket
    });
    // the win: the fanfare, the studio crowd; you get off the bed; the ticket shaking in your hand
    const W0 = SB.won + 0.9;
    { const L = fx.arr(3), R = fx.arr(3); [[0, 392], [0.18, 523], [0.36, 659], [0.54, 784]].forEach(([dt, f]) => { const i0 = Math.round(dt * sr); for (let i = 0; i < 2.2 * sr && i0 + i < L.length; i++) { const t = i / sr, e = Math.min(1, t / 0.015) * Math.exp(-t / (dt > 0.5 ? 1.2 : 0.3)), v = Math.sin(2 * Math.PI * f * t) + 0.5 * Math.sin(4 * Math.PI * f * t) + 0.25 * Math.sin(6 * Math.PI * f * t); L[i0 + i] += v * e; R[i0 + i] += v * e * 0.9; } });
      tvLR({ L, R }, W0, 0.06); }
    tvLR(sbCrowdOoh(fx, { n: 16, vowel: 'aaaah', len: 1.8 }), W0 + 0.1, 0.04);
    tvLR(sbClaps(fx, 4.5, { n: 26 }), W0 + 0.3, 0.035);
    put(fx.creak(0.7, [[95, 0.04, 1], [190, 0.03, 0.5], [420, 0.015, 0.3]], { rate: [10, 30] }), SB.won + 0.45, 0.04, { room, wet: 0.3 });   // the bed's springs
    put(cloth(0.9), SB.won + 0.5, 0.035, { room, wet: 0.2 });
    put(fx.rustle(SB.scale - SB.won - 2.3, { density: 900, rub: 0.35, lo: 1500, hi: 8000, grain: 0.004, env: (u) => 0.6 + 0.4 * Math.sin(u * 90) }), SB.won + 2.3, 0.02, { pan: 0.3 });   // the ticket trembling
  }
  // ================= the money: a bundle, then the notes rising round you
  {
    put(fx.slap(fx.woodModes(140, 1.2), { width: 0.004, skin: 0.3 }), SB.scale + 0.25, 0.06, { room, wet: 0.3 });
    put(paper(0.25), SB.scale + 0.3, 0.025);
    const a = SB.cashUp - 1.2, b = SB.cashTop + 0.4;
    for (const pan of [-0.6, 0.6]) put(fx.rustle(b - a, { density: 700, rub: 0.4, lo: 800, hi: 7500, grain: 0.006, env: (u) => Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.15)), 0.7) }), a, 0.05, { pan, room, wet: 0.3 });
    for (let t = a + 0.3; t < b - 0.3; t += r.range(0.15, 0.45)) put(fx.slap(fx.woodModes(r.range(250, 400), 0.6), { width: 0.003, skin: 0.5 }), t, 0.012 * r.range(0.5, 1), { pan: r.range(-0.8, 0.8), room, wet: 0.3 });   // bundles landing
  }
  // ================= the promise: the pen, the note, the fridge
  {
    const a = SB.write, b = SB.stick - 1.0;
    for (let t = a, i = 0; t < b - 0.1; t += r.range(0.18, 0.32), i++) put(fx.rustle(r.range(0.12, 0.22), { density: 900, rub: 0.6, lo: 1800, hi: 7000, grain: 0.003, env: (u) => Math.sin(Math.PI * u) }), t, 0.03 * r.range(0.6, 1), { pan: 0.2, room, wet: 0.15 });
    put(paper(0.25, { lo: 1500 }), SB.stick - 0.9, 0.03, { pan: 0.2 });                                           // torn off the pad
    put(fx.slap(fx.panelModes(0.6), { width: 0.004, skin: 0.4 }), SB.stick + 0.1, 0.045, { pan: 0.1, room, wet: 0.3 });   // pressed onto the fridge
  }
  // ================= day one, day three: the phone
  {
    const whoosh = (t) => { const x = sbNoise(fx, Math.round(0.35 * sr), 'pink'); for (let i = 0; i < x.length; i++) x[i] *= Math.sin(Math.PI * i / x.length); sbSweepPut(K, x, t, 'bandpass', 2, [500, 1500, 4000], { vol: 0.025, pan: 0.2 }); put(ping(2093), t + 0.35, 0.018, { pan: 0.2 }); };
    whoosh(SB.sendMum); whoosh(SB.sendFriend);
    put(ping(1568), SB.sendMum + 2.0, 0.016, { pan: 0.2 });                                                         // mum's reply
    // the giving study: the envelope, the note into the tin
    { const tHand = cap('dunn', 0) + 1.55, tRead = cap('dunn', 1) - 0.1, tGive = cap('dunn', 2) + 0.5;
      put(paper(0.4), tHand - 0.1, 0.035, { room, wet: 0.2 }); put(paper(0.5, { density: 250 }), tRead, 0.025, { room, wet: 0.2 });
      put(paper(0.3, { lo: 1200 }), tGive, 0.03, { room, wet: 0.2 }); put(fx.hit(fx.metalModes(780, 0.5), { width: 0.0015 }), tGive + 0.28, 0.03, { room, wet: 0.3 }); }
    // the messages: the phone buzzing in your hand, faster and faster until it is one long swarm
    const t0 = SB.out + 0.4, t1 = SB.who + 0.2, m1 = cap('out', 1), m2 = cap('out', 2), m3 = cap('out', 3);
    for (let t = t0, i = 0; t < t1; i++) {
      const rate = t < m1 ? 0.9 : t < m2 ? 0.45 : t < m3 ? 0.18 : 0.07, d = Math.min(0.32, rate * 0.75);
      put(buzz(d, 160 + 12 * Math.sin(i)), t, 0.04 * (t < m3 ? 1 : 0.8), { pan: 0.15 + 0.2 * Math.sin(i * 1.7), room, wet: 0.1 });
      if (i % (t < m2 ? 1 : 3) === 0) put(ping(r.pick([1760, 1976, 2349])), t + 0.02, 0.01, { pan: 0.2 });
      t += rate * r.range(0.8, 1.2);
    }
    // the inbox scrolling under your thumb
    for (let t = SB.who + 0.3; t < SB.trust - 0.2; t += r.range(0.07, 0.16)) { if (r.chance(0.12)) t += r.range(0.4, 0.9); put(tick(r.range(2600, 3200)), t, 0.008, { pan: 0.2 }); }
    // you switch it off; a knock; the peephole; a voice through the door
    put(tick(1800), SB.trust + 0.7, 0.025, { pan: 0.2 }); put(fx.hit(fx.woodModes(160, 1), { width: 0.003 }), SB.trust + 0.95, 0.03, { pan: 0.1, room, wet: 0.3 });
    for (const dt of [0, 0.27, 0.54, 1.35, 1.6]) put(fx.hit(fx.woodModes(105, 2.2), { width: 0.0035, noise: 0.3, nhp: 1500 }), SB.knock + dt, dt > 1 ? 0.06 : 0.075, { pan: -0.35, room, wet: 0.5 });
    put(fx.hit(fx.metalModes(2400, 0.4), { width: 0.0003 }), SB.knock + 2.05, 0.02, { pan: -0.1 }); put(cloth(0.4), SB.knock + 1.0, 0.025, { room, wet: 0.2 });
    { const y = voice('hey! its me! from school! remember me?', 118, { rate: 1.1, breathy: 0.3 }); SBX.bq(y, 'lp', 900, 0.7, sr); SBX.bq(y, 'lp', 1100, 0.7, sr); put(y, SB.knock + 2.35, 0.04, { pan: -0.2, room, wet: 0.5 }); }
    // the interest: a dollar arrives every 0.63 s (a soft coin tick), all night
    for (let t = SB.interest + 0.6, i = 0; t < SB.house - 0.3; t += 1 / 1.585, i++) put(fx.hit(fx.metalModes(i % 2 ? 3400 : 3800, 0.25), { width: 0.0002 }), t, 0.006 * sbEv(t, SB.interest + 0.6, SB.interest + 2), { pan: 0.25, room, wet: 0.3 });
  }
  // ================= 4 · the house: the door, steps in a hard empty hall, the keys; the garage; the car
  {
    put(fx.creak(0.9, [[90, 0.05, 1], [210, 0.03, 0.5]], { rate: [8, 20] }), SB.house + 0.2, 0.025, { room: hall, wet: 0.6 });
    put(fx.hit(fx.metalModes(1500, 0.4), { width: 0.0005 }), SB.house + 0.15, 0.03, { room: hall, wet: 0.6 });
    steps(SB.house + 1.2, SB.garage - 0.3, 0.62, (t, i) => put(fx.step({ weight: 0.55, s: 1.1 }), t, 0.04, { pan: i % 2 ? 0.1 : -0.1, room: hall, wet: 0.8 }));
    put(sbKeys(fx, 0.5), SB.buyHouse, 0.025, { pan: 0.3, room: hall, wet: 0.6 });
    // the garage: the strip lights blink on; the car starts and revs once
    for (const dt of [0, 0.12, 0.3, 0.38]) put(fx.hit(fx.metalModes(2900, 0.3), { width: 0.0002, noise: 0.4 }), SB.garage + 0.1 + dt, 0.012, { pan: r.range(-0.5, 0.5), room: hall, wet: 0.6 });
    const S0 = SB.buyCar + 0.2, d = SB.neighbours + 0.3 - S0;
    put(engine(0.6, (u) => 200 + 100 * Math.sin(u * 30), () => 0.2), S0, 0.03, { room: hall, wet: 0.4 });            // the starter
    put(engine(d - 0.55, (u) => { const t = u * (d - 0.55); return t < 0.4 ? 900 + 1800 * t / 0.4 : t < 1.3 ? 1600 + 2600 * Math.sin(Math.PI * (t - 0.4) / 0.9) : 1000; }, (u) => u * (d - 0.55) < 1.3 ? 0.9 : 0.35), S0 + 0.55, 0.07, { room: hall, wet: 0.35 });
  }
  // ================= your old street: the neighbour's cloth on the new car, a phone camera; your steps
  {
    const a = SB.neighbours, b = SB.six;
    for (let t = a + 0.8; t < b - 0.5; t += r.range(0.7, 1.2)) put(fx.creak(r.range(0.25, 0.4), [[r.range(900, 1200), 0.01, 1], [r.range(2000, 2600), 0.006, 0.5]], { rate: [40, 90] }), t, 0.008, { pan: 0.45, room: out, wet: 0.3 });
    for (const dt of [5.2, 5.5, 11.0]) put(fx.hit([[2200, 0.01, 1], [4400, 0.006, 0.5]], { width: 0.0002, noise: 0.5, nhp: 3000, extra: [[0.06, 0.0002, 0.7]] }), a + dt, 0.01, { pan: -0.5, room: out, wet: 0.3 });
    steps(a + 0.4, b - 0.4, 0.78, (t, i) => put(fx.step({ weight: 0.4, scuff: 0.08 }), t, 0.022, { pan: i % 2 ? 0.08 : -0.08, room: out, wet: 0.2 }));
  }
  // ================= month six: breakfast; the housekeeper's cloth; the terrace (ice); the TV and the remote
  {
    put(fx.hit(fx.cupModes(0.9), { width: 0.0008 }), SB.six + 1.2, 0.03, { room: hall, wet: 0.5 });
    put(fx.hit(fx.saucerModes(1.2), { width: 0.0003 }), SB.six + 2.6, 0.015, { room: hall, wet: 0.5 }); put(fx.hit(fx.saucerModes(1.25), { width: 0.0003 }), SB.six + 2.75, 0.01, { room: hall, wet: 0.5 });
    for (let t = cap('six', 1) + 0.2, i = 0; i < 4; t += 0.42, i++) put(crunch({ d: 0.1, lo: 600, hi: 4000 }), t, 0.012, { room: hall, wet: 0.3 });
    for (let t = SB.brick + 0.5; t < SB.enough - 0.6; t += r.range(0.9, 1.4)) put(cloth(r.range(0.6, 0.9), { density: 220, rub: 0.6, lo: 800, hi: 5000 }), t, 0.012, { pan: -0.3, room: hall, wet: 0.4 });
    for (const dt of [1.4, 1.62, 7.3]) put(fx.hit(fx.glassModes().map(([f, tau, a]) => [f * 4, tau, a]), { width: 0.0002 }), SB.enough + dt, 0.015, { pan: 0.25, room: out, wet: 0.3 });
    // views: the TV's voices; the remote's click; the other channel
    const tvA = [[SB.views + 0.3, 'the markets closed higher again today, led by'], [SB.views + 3.4, 'taxes on the very richest']];
    for (const [t, txt] of tvA) put(tvf(voice(txt, 140, { rate: 1.1 })), t, 0.03, { pan: 0.1, room, wet: 0.4 });
    put(tick(2200), SB.channel - 0.05, 0.03, { pan: 0.25 }); put(fx.hit([[90, 0.03, 1]], { width: 0.002, noise: 0.6, nhp: 2000 }), SB.channel + 0.02, 0.02, { pan: 0.1 });
    put(tvf(voice('a bold new plan to cut what you pay, and keep what you earn', 112, { rate: 1.15 })), SB.channel + 0.3, 0.03, { pan: 0.1, room, wet: 0.4 });
  }
  // ================= the boardroom; the studies
  {
    put(fx.creak(0.6, [[160, 0.03, 1], [330, 0.02, 0.5]], { rate: [12, 30] }), SB.boss + 1.6, 0.02, { room, wet: 0.4 });
    const tFolder = cap('boss', 1) + 0.2;
    put(fx.rustle(0.7, { density: 120, rub: 0.7, lo: 300, hi: 2500, grain: 0.02, env: (u) => Math.sin(Math.PI * u) }), tFolder, 0.03, { room, wet: 0.3 });
    put(fx.slap(fx.woodModes(200, 0.6), { width: 0.004, skin: 0.2 }), tFolder + 0.7, 0.025, { room, wet: 0.3 });
    // they laugh at your joke: six men, a little too long
    for (let k = 0; k < 6; k++) { const y = voice(r.pick(['hahaha haa', 'haha hahaha', 'hahaa haha haa', 'ha ha haa']), 105 + 14 * k * r.range(0.9, 1.1), { rate: r.range(1.25, 1.5), breathy: 0.45 }); SBX.bq(y, 'lp', 2600, 0.7, sr); put(y, cap('boss', 2) + 0.05 + 0.12 * k * r.range(0.6, 1.4), 0.022, { pan: -0.7 + 0.28 * k, room, wet: 0.5 }); }
    for (let k = 0; k < 4; k++) put(fx.creak(0.4, [[150 + 20 * k, 0.03, 1], [320, 0.02, 0.5]], { rate: [12, 30] }), cap('boss', 2) + 0.3 + 0.4 * k, 0.012, { pan: -0.6 + 0.4 * k, room, wet: 0.4 });
    // cookies: the card, the plate, three hands, the extra one, eaten with an open mouth
    put(paper(0.35, { density: 200, rub: 0.5, lo: 500, hi: 4000 }), SB.charge - 0.1, 0.03, { room, wet: 0.3 });
    put(fx.hit(fx.saucerModes(0.8), { width: 0.0012 }), SB.plate, 0.035, { room, wet: 0.35 });
    for (const [t, pan] of [[SB.plate + 0.9, -0.5], [SB.plate + 1.3, 0.5], [SB.plate + 1.85, 0], [SB.extra, 0]]) { put(fx.hit(fx.saucerModes(0.85), { width: 0.0005 }), t, 0.012, { pan, room, wet: 0.3 }); put(paper(0.12, { lo: 1500 }), t + 0.05, 0.008, { pan }); }
    { const tEat = cap('cookie2', 1) + 0.05;
      for (let t = tEat, i = 0; t < tEat + 2.6; t += 0.36, i++) { put(crunch({ d: i === 0 ? 0.2 : 0.12 }), t, i === 0 ? 0.04 : 0.024, { room, wet: 0.2 }); put(fx.liquid(0.12, (x) => Math.exp(-x / 0.03) * Math.min(1, x / 0.004), { f: 900 }), t + 0.17, 0.014, { room, wet: 0.2 }); } }
    // the game: the coin, the dice, the money slapped down, the pretzels, the winning roll, the other player's sigh
    { const T = SB.flip; put(fx.hit(fx.metalModes(4100, 1.6), { width: 0.0002 }), T, 0.03, { room, wet: 0.3 });
      for (let k = 0, t = T + 0.9, g = 0.16; k < 6; k++, t += g, g *= 0.62) put(fx.hit(fx.metalModes(4100 * r.range(0.98, 1.02), 0.4), { width: 0.0002 }), t, 0.03 * Math.pow(0.7, k), { room, wet: 0.3 }); }
    const dice = (t, n = 2) => { for (let d = 0; d < n; d++) for (let k = 0, tt = t + 0.03 * d, g = 0.09; k < 5; k++, tt += g, g *= 0.7) put(fx.hit(fx.woodModes(r.range(1300, 1900), 0.4), { width: 0.0004 }), tt, 0.02 * Math.pow(0.75, k), { pan: r.range(-0.3, 0.3), room, wet: 0.3 }); };
    dice(cap('game', 2) + 0.6, 2); dice(cap('game', 2) + 2.2, 1); dice(SB.game2 + 1.0, 2);
    put(fx.slap(fx.woodModes(170, 0.8), { width: 0.004, skin: 0.8 }), SB.slap, 0.06, { room, wet: 0.35 }); put(paper(0.2, { lo: 1200 }), SB.slap + 0.01, 0.025);
    for (let t = SB.pretzel, i = 0; i < 5; t += 0.4, i++) put(crunch({ d: 0.09, lo: 1200, hi: 7000 }), t, 0.02, { room, wet: 0.2 });
    dice(SB.winGame - 0.3, 2);
    { const y = fx.breath(0.9, {}); put(y, SB.winGame + 0.9, 0.015, { pan: -0.2, room, wet: 0.4 }); }
    // the sweets: the lid, the grab
    put(fx.hit(fx.glassModes().map(([f, tau, a]) => [f * 2.2, tau, a]), { width: 0.0004 }), SB.grab - 0.6, 0.025, { room, wet: 0.3 });
    for (let t = SB.grab, i = 0; i < 26; t += r.range(0.01, 0.05), i++) put(fx.hit([[r.range(2500, 5200), 0.02, 1], [r.range(5500, 8000), 0.01, 0.4]], { width: 0.0001 }), t, 0.012 * r.range(0.3, 1), { pan: r.range(-0.3, 0.3), room, wet: 0.3 });
  }
  // ================= year two: the tender passing; the gate
  {
    const a = SB.yacht, b = SB.wall + 0.2;
    { const y = engine(b - a + 0.5, () => 2600, () => 0.55); for (let i = 0; i < y.length; i++) { const t = i / sr, x = -75 + 17 * t, dd = Math.hypot(x - 20, 210); y[i] *= 40 / dd; } SBX.bq(y, 'lp', 1400, 0.7, sr); K.put(y, a, { vol: 0.02, norm: true, pan: -0.2, room: out, wet: 0.5, fadeIn: 0.6, stop: b, fade: 0.4 }); }
    // the gate: the motor, the rollers, the clang, the latch
    const g0 = SB.gateShut - 2.4, g1 = SB.gateShut + 0.4;
    sbTone(K, g0, g1 - g0, 95, [[1, 1], [2, 0.6], [3, 0.4], [6.3, 0.25]], (u) => Math.min(1, u * 8, (1 - u) * 20), { vol: 0.025, pan: 0.2, f: [['lp', 1200]], room: out, wet: 0.3 });
    put(fx.rustle(g1 - g0, { density: 300, rub: 0.6, lo: 200, hi: 1800, grain: 0.03 }), g0, 0.02, { pan: 0.2, room: out, wet: 0.3 });
    put(fx.hit(fx.metalModes(180, 1.4), { width: 0.002, noise: 0.5, nhp: 800 }), g1, 0.09, { pan: 0.1, room: out, wet: 0.5 });
    put(fx.hit(fx.metalModes(1300, 0.5), { width: 0.0004 }), g1 + 0.18, 0.03, { pan: 0.1, room: out, wet: 0.4 });
  }
  // ================= year three: your steps downtown (one each time the camera bobs down), the phone, two passers-by
  {
    const a = SB.walk, b = SB.drive - 0.2;
    for (let k = 0; ; k++) { const t = a + (0.75 + k) / 1.85; if (t > b) break; put(fx.step({ weight: 0.5, scuff: 0.06 }), t, 0.03, { pan: k % 2 ? 0.08 : -0.08, room: out, wet: 0.2 }); }
    for (const dt of [2.6, 9.1, 14.0]) put(ping(r.pick([1760, 2093])), SB.glass + dt, 0.012, { pan: 0.2 });
    for (const [tp, pan] of [[SB.glass + 3.4, 0.6], [SB.glass + 6.2, 0.7], [SB.glass2 + 4.1, 0.6]]) steps(tp - 1.0, tp + 1.0, 0.5, (t) => put(fx.step({ weight: 0.4 }), t, 0.018 * (1 - Math.abs(t - tp) / 1.2), { pan, room: out, wet: 0.2 }));
    // the crossing by day: the stripes under the tyres; the man steps back
    const T = SB.dayPass;
    for (const dt of [-0.12, 0.05, 2.45, 2.62]) put(fx.hit(fx.woodModes(60, 2), { width: 0.006 }), T + dt, 0.035, { lp: 500 });
    put(fx.step({ weight: 0.5, scuff: 0.4 }), T - 0.3, 0.035, { pan: 0.6, lp: 3000 });
    put(fx.breath(0.35, { inhale: true }), T - 0.3, 0.012, { pan: 0.6, lp: 3000 });
  }
  // ================= years five to nine: each day and night a soft rush; the note in its box
  {
    for (let t = SB.years + 0.2; t < SB.note - 0.4; t += 0.85) { const x = sbNoise(fx, Math.round(0.6 * sr), 'pink'); for (let i = 0; i < x.length; i++) x[i] *= Math.sin(Math.PI * i / x.length); sbSweepPut(K, x, t, 'bandpass', 1.2, [300, 900, 2400, 700], { vol: 0.012 * sbEv(t, SB.years, SB.years + 2) }); }
    put(fx.rustle(0.8, { density: 140, rub: 0.6, lo: 250, hi: 2600, grain: 0.025 }), SB.note + 0.6, 0.035, { room: hall, wet: 0.4 });     // the box's flaps
    put(fx.slap(fx.woodModes(120, 0.8), { width: 0.006, skin: 0.1 }), SB.note + 1.4, 0.025, { room: hall, wet: 0.4 });
    put(paper(0.7, { density: 200, rub: 0.4 }), SB.note + 1.9, 0.025, { room: hall, wet: 0.3 });                   // the note unfolded
  }
  // ================= is any of this real: the stamps; the letters; the video; the papers
  {
    const s0 = cap('real', 2) + 0.25;
    for (let k = 0; k < 6; k++) { const t = s0 + 0.42 * k; put(fx.slap(fx.woodModes(170, 0.9), { width: 0.005, skin: 0.25 }), t, 0.045, { room, wet: 0.3 }); }
    // the letter through the letterbox; the door; her steps to the postbox; she posts it
    const tRel = SB.letters + 3.3, tB = cap('letters', 1) - 0.3, tOut = tB + 0.5;
    put(paper(0.5, { density: 200 }), SB.letters + 1.0, 0.025, { room: out, wet: 0.3 });
    put(fx.hit(fx.metalModes(900, 0.6), { width: 0.0006 }), SB.letters + 2.6, 0.03, { room: out, wet: 0.3 });
    put(fx.hit(fx.metalModes(820, 0.8), { width: 0.0004, extra: [[0.06, 0.0004, 0.4]] }), tRel + 0.42, 0.05, { room: out, wet: 0.4 });   // the flap snaps shut
    put(fx.creak(0.8, [[150, 0.03, 1], [310, 0.02, 0.6]], { rate: [10, 26] }), tOut, 0.018, { pan: 0.1, room: out, wet: 0.5 });
    steps(tOut + 0.6, tOut + 4.8, 0.55, (t, i) => put(fx.step({ weight: 0.35, s: 1.2 }), t, 0.016, { pan: 0.1 * Math.sin(i), room: out, wet: 0.4 }));
    put(paper(0.3), tOut + 5.0, 0.012, { room: out, wet: 0.4 }); put(fx.hit(fx.metalModes(600, 0.8), { width: 0.0008 }), tOut + 5.3, 0.018, { room: out, wet: 0.5 });
    // the video on the laptop: a soft piano and a child's voice you can't make out, very small
    { const y = tvf(voice('every night, she goes to bed hungry', 230, { fs: 1.2, rate: 0.95, breathy: 0.4 })); SBX.bq(y, 'lp', 3000, 0.7, sr); put(y, SB.video + 1.4, 0.016, { pan: -0.2, room, wet: 0.4 }); }
    const tDrop = cap('video', 1) + 0.6;
    put(fx.rustle(0.6, { density: 500, rub: 0.5, lo: 700, hi: 6500, grain: 0.006, env: (u) => Math.exp(-u * 3) }), tDrop + 0.15, 0.04, { pan: 0.3, room, wet: 0.3 });
    put(fx.slap(fx.woodModes(130, 0.6), { width: 0.006, skin: 0.4 }), tDrop + 0.32, 0.03, { pan: 0.3, room, wet: 0.3 });
    put(paper(1.6, { density: 160 }), tDrop + 0.9, 0.022, { pan: 0.2, room, wet: 0.3 });
  }
  // ================= the crossing again: you brake; she crosses in your headlights; you lift a hand
  {
    const T = SB.brakeAt;
    { const x = sbNoise(fx, Math.round(1.6 * sr), 'pink'); for (let i = 0; i < x.length; i++) { const u = i / x.length; x[i] *= Math.min(1, u * 10) * (1 - u); } sbSweepPut(K, x, T, 'bandpass', 3, [1400, 1100, 800], { vol: 0.012 }); }
    put(fx.creak(0.5, [[110, 0.04, 1], [240, 0.025, 0.5]], { rate: [8, 18] }), T + 1.6, 0.02, { lp: 900 });           // the car settles
    const x0 = SB_CAR.kerb + 0.4, x1 = -SB_CAR.kerb - 0.4, t1 = SB.herCross + (x0 - x1) / 1.45;
    steps(SB.herCross + 0.05, t1 + 0.4, 0.52, (t, i) => { const x = x0 + (x1 - x0) * MathX.clamp((t - SB.herCross) / (t1 - SB.herCross), 0, 1); put(wetStep(0.45), t, 0.03, { pan: MathX.clamp(x / 6, -0.8, 0.8), lp: 3500 }); });
    put(cloth(0.6), SB.herLook + 0.1, 0.02, { pan: -0.1 });                                                    // your sleeve: you lift a hand
  }
});
