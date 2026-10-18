/* =====================================================================
   SOUND · EFFECTS — the events. Sound travels at its normal speed all film, so every sound is placed when it really
   happens (plus its trip through the air), never when it is SEEN: that gap is the story.
     the call      Gran's voice (no words you can make out) through the phone's speaker, as late as her picture: it
                   left her one cable delay ago, so as the delay grows her voice drags; you, close; her late laugh
     the map       the app's error tone; a slide as the dot runs out to sea
     fireworks     six bangs from 2 km away, exactly when sound would bring them (script.js SL.b1…b6), and the crowd
                   below going "ooh" when it SEES each burst: as light slows, the "ooh" moves after the bang
     the street    car 1 and car 2 heard where they really are (slCarHeard): car 2 is heard coming, and passing, before
                   anything of it is seen
     the flat      the laser pointer's click; the cat's paws (she's at the wall before you see her go); your steps in
                   the hall; the light switch; the three knocks on the table, heard at once; your breathing in the dark;
                   Mum: the keys, the lock, the door, her voice, the switches she tries
     the lab       the lasers' shutters
   ===================================================================== */

// footsteps along a path: one each time x(t) has moved a stride; fn(t, i) plays it
function slStepsAlong(t0, t1, x, stride, fn) {
  let acc = 0.5, px = x(t0), i = 0;
  for (let t = t0 + 0.01; t < t1; t += 0.01) { const v = x(t); acc += Math.abs(v - px) / stride; px = v; if (acc >= 1) { acc -= Math.floor(acc); fn(t, i++); } }
}
// a voice line fitted to a window: synthesised, then re-made at the rate that makes it last `d` seconds
function slVoiceFit(fx, text, d, o) {
  const y0 = slVoice(fx, text, o), d0 = y0.length / fx.sr - 0.25;
  return slVoice(fx, text, Object.assign({}, o, { rate: (o.rate || 1) * d0 / Math.max(0.3, d) }));
}

slSound('sfx', 'events', function (ctx, bus, K) {
  const { fx, sr, r } = K, P = slPl();
  const room = K.verb('room', 1.1, { bright: 0.5, damp: 3.6, wet: 0.4, seed: 41, early: [[0.009, 0.5], [0.017, 0.35], [0.027, 0.2]] });
  const hallV = K.verb('hall', 1.4, { bright: 0.4, damp: 3.0, wet: 0.6, seed: 45, early: [[0.012, 0.6], [0.023, 0.4], [0.04, 0.3]] });
  const out = K.verb('out', 2.8, { bright: 0.4, damp: 2.4, wet: 0.55, seed: 43, pre: 0.02 });
  const harbour = K.verb('harbour', 5.5, { bright: 0.28, damp: 1.8, wet: 0.9, seed: 49, pre: 0.09, early: [[0.4, 0.5], [0.9, 0.35], [1.6, 0.3], [2.4, 0.2]] });

  // ================= 2 · the video call
  // the app's "joined" chime (on your phone: no delay)
  for (const [dt, f, d] of [[0, 784, 0.09], [0.11, 1175, 0.16]]) { const y = fx.beep(f, d); slPhone(y, sr); K.put(y, SL.call + 0.15 + dt, { vol: 0.05, norm: true, pan: 0.05 }); }
  // Gran, in her own time τ (home-phone.js slGranAt: the same windows her mouth moves in): built as one track, then
  // carried to you through the cable: you hear τ = t − delay(t)
  {
    const τ0 = SL.call, τ1 = 53.6, G = new Float32Array(Math.ceil((τ1 - τ0) * sr)), gran = { f0: 192, fs: 1.13, breathy: 0.3 };
    const heard = SL.joke + 0.5 * (SL.jokeLaugh - SL.joke);
    slAddAt(G, slVoiceFit(fx, 'Hello darling! Can you see me?', 2.5, gran), SL.call + 0.65 - τ0, 1, sr);
    slAddAt(G, slVoiceFit(fx, 'Oh, you look well! How is it there?', 1.95, gran), SL.lagFrac + 0.42 - τ0, 1, sr);
    slAddAt(G, slVoiceFit(fx, 'Hello? You have gone all slow, love.', 1.75, gran), SL.lagOne + 0.82 - τ0, 1, sr);
    slAddAt(G, slVoiceFit(fx, 'ha ha haa ha ha hahaa, oh ha ha!', 3.2, { f0: 245, fs: 1.15, breathy: 0.55 }), heard + 0.15 - τ0, 1.1, sr);
    slAddAt(G, fx.breath(0.45, { inhale: true }), heard + 3.35 - τ0, 0.35, sr);
    // the call breaks up as the delay grows (lost packets)
    slPhone(G, sr, { seed: 7, drop: (τ) => 0.05 * slEv(τ0 + τ, SL.lagFrac, SL.lagThree) });
    let last = -1e9;
    const tauOf = (t) => (last = Math.max(last, t - slGranDelay(slC(t))));
    slWarpPut(K, G, τ0, tauOf, SL.call, 58.0, { vol: 0.2, pan: 0.05, room, wet: 0.08 });
  }
  // you (close, no delay): "hi", the joke, your own laugh
  {
    const you = { f0: 142, fs: 1.04, breathy: 0.2 };
    const lines = [[SL.call + 3.65, 'Hi Gran! Yes, I can see you.', 2.1, you], [SL.joke - 1.55, 'and the lamp said, not that bright!', 1.5, you], [SL.joke + 0.05, 'ha ha ha, haha', 1.6, { f0: 165, fs: 1.04, breathy: 0.6 }]];
    for (const [t, text, d, o] of lines) { const y = slVoiceFit(fx, text, d, o); SLX.bq(y, 'lp', 6500, 0.7, sr); K.put(y, t, { vol: 0.13, norm: true, pan: 0, room, wet: 0.15 }); }
  }

  // ================= the map app breaks
  for (const [dt, f] of [[0, 660], [0.16, 440]]) { const y = fx.beep(f, 0.12); slPhone(y, sr); K.put(y, slS('map') + 0.3 + dt, { vol: 0.045, norm: true, pan: 0.05 }); }
  { const d = 0.7, y = fx.arr(d); let ph = 0; for (let i = 0; i < d * sr; i++) { const u = i / (d * sr); ph += 2 * Math.PI * (1300 * Math.pow(0.35, u)) / sr; y[i] = Math.sin(ph) * Math.sin(Math.PI * u) * (1 - 0.3 * u); } slPhone(y, sr); K.put(y, SL.mapSea + 0.1, { vol: 0.035, norm: true, pan: 0.05, room, wet: 0.2 }); }

  // ================= 3 · fireworks: the bangs (on time for sound) and the crowd's "ooh" (on time for light)
  const bangs = [[SL.b1, 1.0, 0, -0.1], [SL.b2, 1.0, 0.5, 0.15], [SL.b3, 1.1, 0, -0.2], [SL.fb4, 1.3, 1, 0.05], [SL.b5, 1.2, 0.6, 0.2], [SL.b6, 2.2, 1.5, 0]];
  for (const [t, size, crackle, pan] of bangs) { const { L, R } = slBang(fx, { size, crackle, pan }); K.putLR(L, R, t, { vol: 0.26 * Math.pow(size, 0.5), norm: true, room: harbour, wet: 0.35 }); }
  const oohs = [[SL.f1, 18, 1.5, 1], [SL.f2, 16, 1.3, 0.8], [SL.f3, 14, 1.2, 0.75], [SL.fb4, 20, 1.6, 1], [SL.f5, 18, 1.5, 1], [SL.f6, 30, 2.2, 1.5]];
  for (const [t, n, len, k] of oohs) {
    const { L, R } = slCrowdOoh(fx, { n, len });
    SLX.bq(L, 'lp', 2200, 0.7, sr); SLX.bq(R, 'lp', 2200, 0.7, sr);
    K.putLR(L, R, t + 0.3, { vol: 0.045 * k, norm: true, room: out, wet: 0.7 });
  }
  { const { L, R } = slClaps(fx, 3.2, { n: 36 }); SLX.bq(L, 'lp', 3000, 0.7, sr); SLX.bq(R, 'lp', 3000, 0.7, sr); K.putLR(L, R, SL.f6 + 1.3, { vol: 0.03, norm: true, room: out, wet: 0.7 }); }

  // ================= 4 · the street: the two cars, heard where they really are
  const E = SL_ST.eye, gear = (v) => { const k = v * 3.6; return k < 45 ? 900 + 50 * k : 600 + 40 * k; };
  const tShift = SL.car1Go + (45 / 3.6 - SL_ST.v1) / SL_ST.a1;
  slCarHeard(K, {
    eye: E, lane: SL_ST.lane, t0: SL.street - 0.3, t1: SL.faster + 0.05,
    x: slCar1X, v: slCar1V,
    rpm: (te) => gear(slCar1V(te)) * (1 - 0.18 * slWn(te, tShift, tShift + 0.25, 0.05, 0.15)),
    load: (te) => te < SL.car1Go ? 0.3 : te < tShift ? 0.95 : te < tShift + 0.3 ? 0.1 : slCar1V(te) < SL_ST.v1max - 0.2 ? 0.85 : 0.4,
    pan: (x) => -0.12 + 0.3 * (x - E[0]) / Math.hypot(x - E[0], 3.7), vol: 0.9,
  });
  const x2 = (te) => E[0] - SL_ST.v2 * (te - SL.car2Tp);
  slCarHeard(K, {
    eye: E, lane: SL_ST.lane, t0: SL.faster - 0.3, t1: SL.cat + 0.05, engine: 0.7,
    x: x2, v: () => SL_ST.v2, rpm: () => 1850, load: () => 0.32,
    // the camera looks up the road at first (the car is ahead, a little left), then faces the road (+x on the right)
    pan: (x, t) => { const k = slEv(t, slCap('two', 0).show - 0.5, slCap('two', 0).show + 2); return (1 - k) * -0.15 + k * 0.85 * (x - E[0]) / Math.hypot(x - E[0], 3.7); }, vol: 0.9,
  });

  // ================= 5 · the cat and the laser
  // she purrs on the rug, watching your hand; the pointer's click; then her paws on the boards (she runs when the
  // light from your thumb reaches her, and she's at the wall before your eyes see her go)
  {
    const t0 = SL.cat + 0.3, t1 = SL.laserOn - 1.6, n = Math.ceil((t1 - t0) * sr), y = slNoise(fx, n, 'pink'), lo = slNoise(fx, n, 'brown');
    SLX.bq(y, 'bp', 190, 0.9, sr); SLX.bq(y, 'lp', 1100, 0.7, sr); SLX.bq(lo, 'lp', 140, 0.7, sr);
    let ph = 0; const pk = SLX.peak(lo) || 1;
    for (let i = 0; i < n; i++) {
      const t = i / sr, cyc = (t % 2.3) / 2.3, inh = cyc < 0.42, a = inh ? Math.sin(Math.PI * cyc / 0.42) : 0.65 * Math.sin(Math.PI * (cyc - 0.42) / 0.58);
      ph += 2 * Math.PI * (inh ? 26 : 23) / sr;
      const pulse = Math.pow(0.5 + 0.5 * Math.sin(ph), 3);
      y[i] = (y[i] + 0.6 * lo[i] / pk) * (0.12 + 0.88 * pulse) * (0.25 + 0.75 * Math.max(0, a)) * Math.min(1, t / 1.0, (t1 - t0 - t) / 0.6);
    }
    K.put(y, t0, { vol: 0.05, norm: true, pan: -0.15, room, wet: 0.2 });
  }
  K.put(slSwitch(fx, { f: 4200 }), SL.laserOn, { vol: 0.05, norm: true, pan: 0.25, room, wet: 0.2 });
  {
    const go = SL.catGo, run = SL.catRun, stride = 0.21;
    for (let s = 0; s * stride < run - 0.02; s++) for (const [dt, w] of [[0, 1], [0.035, 0.8], [0.095, 0.9], [0.12, 0.7]]) {
      const t = go + s * stride + dt; if (t > go + run) continue;
      const u = (t - go) / run, y = fx.hit(fx.woodModes(r.range(110, 150), 0.6), { width: 0.0035, amp: w });
      slAddAt(y, fx.hit([[r.range(3800, 5200), 0.004, 1], [r.range(6000, 7500), 0.003, 0.5]], { width: 0.00008 }), 0.002, 0.25, sr);
      K.put(y, t, { vol: 0.07 * w * (0.7 + 0.3 * Math.sin(Math.PI * u)), norm: true, pan: -0.4 + 1.0 * u, room, wet: 0.25 });
    }
    K.put(fx.rustle(0.22, { density: 900, rub: 0.15, lo: 2500, hi: 8000, grain: 0.003, env: (u) => Math.exp(-u * 3) }), go + run - 0.02, { vol: 0.04, norm: true, pan: 0.6, room, wet: 0.25 });
    K.put(fx.hit(fx.woodModes(95, 1.2), { width: 0.006 }), go + run + 0.12, { vol: 0.05, norm: true, pan: 0.6, room, wet: 0.3 });
  }

  // ================= 6 · the mirror: your wave (a sleeve), your steps down the hall, turning to look back
  K.put(fx.rustle(1.9, { density: 260, rub: 0.35, lo: 600, hi: 5000, grain: 0.012, env: (u) => Math.pow(Math.sin(Math.PI * u), 0.8) * (0.7 + 0.3 * Math.sin(u * 50)) }), SL.wave, { vol: 0.025, norm: true, pan: 0.2, room: hallV, wet: 0.2 });
  slStepsAlong(SL.walkGo, SL.lamp - 0.2, slWalkX, 0.31, (t, i) => K.put(fx.woodStep({ weight: 0.42, creak: i % 5 === 3 ? 0.35 : 0, scuff: 0.05 }), t, { vol: 0.07, norm: true, pan: i % 2 ? 0.1 : -0.1, room: hallV, wet: 0.35 }));
  K.put(fx.rustle(0.9, { density: 320, rub: 0.4, lo: 500, hi: 4500, grain: 0.01 }), SL.behind, { vol: 0.03, norm: true, pan: 0, room: hallV, wet: 0.2 });

  // ================= 7 · the lamp switch, off and on (heard at once; the light takes its time)
  for (const t of [SL.lampOff, SL.lampOn]) K.put(slSwitch(fx), t, { vol: 0.09, norm: true, pan: 0.15, room, wet: 0.3 });

  // ================= 8 · three knocks on the wooden table
  for (let k = 0; k < 3; k++) {
    const y = fx.hit(fx.woodModes(r.range(225, 245), 1.3), { width: 0.0011, amp: 1 - 0.1 * k });
    SLX.strike(y, 0, Math.round(0.002 * sr), 0.6, fx.woodModes(105, 2.0), sr);
    slAddAt(y, fx.slap(fx.woodModes(300, 0.5), { width: 0.0015, amp: 0.2, skin: 0.4 }), 0, 0.5, sr);
    K.put(y, SL.knockHit + k * 0.32, { vol: 0.24 * (1 - 0.08 * k), norm: true, pan: 0.05, room, wet: 0.3 });
  }
  // your breathing, quiet, from the freeze into the dark (a little faster once nothing is left to see)
  for (let t = SL.freeze + 0.8, i = 0; t < SL.door - 0.3; i++) {
    const fast = slEv(t, SL.stop, SL.stop + 3) * (1 - 0.6 * slEv(t, SL.last + 6, SL.door - 2)), inh = 1.5 - 0.4 * fast, exh = 2.1 - 0.6 * fast;
    K.put(fx.breath(inh, { inhale: true }), t, { vol: 0.008 * (1 + 0.6 * fast), norm: true, pan: 0, room, wet: 0.15, lp: 5000 });
    K.put(fx.breath(exh, {}), t + inh + 0.1, { vol: 0.007 * (1 + 0.6 * fast), norm: true, pan: 0, room, wet: 0.15, lp: 4000 });
    t += inh + exh + 0.5 + 0.3 * Math.sin(i * 1.7);
  }

  // ================= 9 · the dark: Mum comes home. Keys, the lock, the door; her steps; her voice; the switches
  {
    const T0 = SL.door, door = { room: hallV, wet: 0.55 };
    { const y = slKeys(fx, 0.7); SLX.bq(y, 'lp', 2600, 0.7, sr); K.put(y, T0, Object.assign({ vol: 0.03, norm: true, pan: -0.55 }, door)); }
    K.put(fx.rustle(0.18, { density: 1200, rub: 0.4, lo: 1800, hi: 6000, grain: 0.003 }), T0 + 0.85, Object.assign({ vol: 0.02, norm: true, pan: -0.55 }, door));
    for (const [dt, b, a] of [[1.15, 1900, 1], [1.3, 1450, 0.8], [1.42, 900, 1.2]]) K.put(fx.hit(fx.metalModes(b, 0.4), { width: 0.0003, amp: a }), T0 + dt, Object.assign({ vol: 0.035 * a, norm: true, pan: -0.55, lp: 3500 }, door));
    K.put(fx.hit(fx.metalModes(1250, 0.5), { width: 0.0004 }), T0 + 1.65, Object.assign({ vol: 0.03, norm: true, pan: -0.5 }, door));         // the handle
    K.put(fx.creak(0.9, [[150, 0.03, 1], [310, 0.02, 0.6], [640, 0.012, 0.3]], { rate: [12, 30], env: (u) => Math.sin(Math.PI * u) }), T0 + 1.8, Object.assign({ vol: 0.025, norm: true, pan: -0.5 }, door));
    slBed(K, T0 + 1.7, T0 + 3.9, { colour: 'pink', f: [['bp', 600, 0.6], ['lp', 1600]], vol: 0.012, mono: true, pan: -0.5, env: (u) => Math.sin(Math.PI * u), room: hallV, wet: 0.6 });   // the stairwell's air
    slStepsAlong(T0 + 2.3, T0 + 4.4, (t) => 1.1 * (t - T0), 0.62, (t, i) => K.put(fx.woodStep({ weight: 0.55, scuff: 0.1 }), t, Object.assign({ vol: 0.05, norm: true, pan: -0.55 + 0.05 * i, lp: 3000 }, door)));
    { const y = fx.hit(fx.woodModes(70, 3), { width: 0.008, len: 1.2 }); SLX.strike(y, Math.round(0.01 * sr), Math.round(0.0003 * sr), 0.4, fx.metalModes(1600, 0.4), sr); K.put(y, T0 + 3.75, Object.assign({ vol: 0.06, norm: true, pan: -0.5, lp: 2500 }, door)); }   // it shuts
    { const y = slKeys(fx, 0.25); SLX.bq(y, 'lp', 3000, 0.7, sr); K.put(y, T0 + 4.5, Object.assign({ vol: 0.025, norm: true, pan: -0.45 }, door)); }    // keys down on the hall table
    const mum = { f0: 205, fs: 1.15, breathy: 0.25 };
    const said = (t, text, d, v) => { const y = slVoiceFit(fx, text, d, mum); SLX.bq(y, 'lp', 2400, 0.7, sr); K.put(y, t, Object.assign({ vol: v, norm: true, pan: -0.45 }, door)); };
    said(slCap('door', 1).show - 0.25, 'Hello? Why are all the lights off?', 1.9, 0.08);
    for (const dt of [0, 0.32, 1.05, 1.32]) K.put(slSwitch(fx, { f: 1900 }), slCap('door', 1).hide - 0.3 + dt, Object.assign({ vol: 0.04, norm: true, pan: -0.5, lp: 3500 }, door));
    // she walks down the hall to the living-room door (the x-ray shows her: home.js)
    slStepsAlong(SL.on2 + 1.2, SL.on2 + 4.6, (t) => 3.0 * Ease.inOutSine(MathX.clamp((t - SL.on2 - 1.2) / 3.4, 0, 1)), 0.6, (t, i) => K.put(fx.woodStep({ weight: 0.5, scuff: 0.12 }), t, Object.assign({ vol: 0.042, norm: true, pan: -0.45 + 0.07 * i, lp: 2800 }, door)));
    said(SL.on2 + 3.3, 'Are you home?', 1.0, 0.065);
    for (const dt of [0, 0.3]) K.put(slSwitch(fx, { f: 2000 }), SL.on2 + 5.1 + dt, Object.assign({ vol: 0.03, norm: true, pan: -0.3, lp: 3000 }, door));
  }

  // ================= 10 · the lab: the trigger for each pulse; the control laser's shutter off (held) and on (let go)
  for (const t of [SL_LAB.in1 - 0.6, SL_LAB.in2 - 0.6]) K.put(fx.beep(1500, 0.05), t, { vol: 0.012, norm: true, pan: 0.4, room, wet: 0.3 });
  for (const t of [SL.held, SL.release]) {
    const y = fx.hit(fx.metalModes(2300, 0.35), { width: 0.0002, noise: 0.4, nhp: 3000 }); SLX.strike(y, Math.round(0.004 * sr), Math.round(0.0004 * sr), 0.5, [[520, 0.03, 1], [1050, 0.02, 0.5]], sr);
    K.put(y, t, { vol: 0.06, norm: true, pan: 0.3, room, wet: 0.3 });
  }
});
