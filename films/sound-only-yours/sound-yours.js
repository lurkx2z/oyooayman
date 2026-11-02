/* =====================================================================
   SOUND · YOURS — every sound left in the world after 9:41 PM is one you make, and only your sounds light up the
   places you are in (each has its own echo):
     your voice  the ten lines (ElevenLabs, voices.js), each in the acoustics of where you are: the kitchen (small), the
                 open window (the flats across the park answer 0.62 s later), the stairwell (long and hard), the street,
                 the park (every building answers your shout at its own delay: physics.js SO_ECHO, a little louder than
                 real, as the HUD says), the dark under the trees (the people round you answer a whisper in tens of ms)
     your hands  two claps; the phone's screen; the window's handle; the doors
     your feet   every step down the stairwell (in the dark too); off the kerb, and back
     your body   breath (held, shaky, panting), a swallow, your heartbeat (only when it is loud: your body, the stairs,
                 the car, the dark), your jacket when you flinch
     the clicks  your tongue in the dark and their echoes: the real ones (a few ms: the tree, the bench, the people), and
                 the echo picture slowed down with the image (each thing it finds rings as the pulse reaches it)
   Not here, because they aren't yours: the glass smashing, the TV, the rain, the clock, the phone's ring and buzz, the
   car, the sirens and alarms, the dog, the thunder, the crowd's steps.
   ===================================================================== */

soSound('sfx', 'yours', function (ctx, bus, K) {
  const { fx, sr } = K, r = fx.r, c = soC, B = soB;
  const V = {
    in: K.verb('kitchen', 0.8, { bright: 0.6, damp: 3.2, shape: 2.4, wet: 0.34, early: [[0.0045, 0.5], [0.0083, 0.4], [0.0121, 0.32], [0.019, 0.24]], seed: 11 }),
    win: K.verb('window', 1.8, { bright: 0.42, damp: 2.4, shape: 2.4, wet: 0.2, pre: 0.02, seed: 12 }),
    stair: K.verb('stair', 3.6, { bright: 0.8, damp: 1.5, shape: 1.5, wet: 0.5, early: [[0.011, 0.6], [0.019, 0.5], [0.031, 0.42], [0.047, 0.34], [0.066, 0.26], [0.09, 0.2]], seed: 13 }),
    street: K.verb('street', 1.6, { bright: 0.5, damp: 2.4, shape: 2.2, wet: 0.24, early: [[0.012, 0.35], [0.026, 0.25]], seed: 14 }),
    park: K.verb('park', 3.2, { bright: 0.35, damp: 2.0, shape: 2.8, wet: 0.18, pre: 0.09, seed: 15 }),
    dark: K.verb('dark', 1.0, { bright: 0.45, damp: 3.0, shape: 2.6, wet: 0.14, seed: 16 }),
  };
  const WET = { in: 0.6, win: 0.55, stair: 0.9, street: 0.5, park: 0.55, dark: 0.45 };
  const X = soMixer(K);   // (every sound below is pre-mixed: sound-lib.js)
  const put = (x, t, o = {}) => { const w = o.where || soPlaceOf(t + 0.01); X.put(x, t, { vol: o.vol, norm: o.norm, pan: o.pan || 0, lp: o.lp, hp: o.hp, room: V[w], wet: (o.wet ?? 1) * WET[w] }); };
  // an echo of x (from a wall): later, quieter (db), duller (lp), from its side (pan)
  const echo = (x, t, dt, db, pan, lp = 2500, o = {}) => X.put(x, t + dt, { vol: (o.vol ?? 1) * Math.pow(10, db / 20), pan, lp, room: o.room, wet: o.wet });
  // your lines
  const say = (id, o = {}) => { const v = soVoice(id), x = soVoiceBuf(fx, id); put(x, v.start, { vol: o.vol ?? 1, wet: o.wet, pan: o.pan || 0, where: o.where }); return { x, t: v.start }; };

  // ---- breath, heart, body ---------------------------------------------------------------------------------------
  const inhale = (t, d, v, o = {}) => put(fx.breath(d, { inhale: true }), t, { vol: v, norm: true, wet: o.wet ?? 0.5, pan: 0.02 });
  const exhale = (t, d, v, o = {}) => put(fx.breath(d, { voice: o.voice || 0, f0: 105, nasal: o.nasal }), t, { vol: v, norm: true, wet: o.wet ?? 0.5, pan: -0.02 });
  const gasp = (t, v = 0.3) => { put(fx.breath(0.32, { inhale: true, env: (u) => Math.min(1, u / 0.12) * Math.pow(1 - u, 0.6) }), t, { vol: v, norm: true, wet: 0.7 });
    put(fx.breath(0.18, { inhale: true, voice: 0.5, f0: 190, env: (u) => Math.min(1, u / 0.2) * Math.pow(1 - u, 1.2) }), t + 0.02, { vol: v * 0.5, norm: true, wet: 0.7 }); };
  // breathing over a span: cycles of period P (s), level v (peak); o.shaky adds a stutter to each breath out
  const breathe = (t0, t1, P, v, o = {}) => { for (let t = t0, i = 0; t < t1 - P * 0.4; t += P * (0.92 + 0.16 * r.next()), i++) {
    const vi = v * (o.ramp ? o.ramp((t - t0) / Math.max(1e-3, t1 - t0)) : 1);
    inhale(t, P * 0.36, vi * 0.85, o);
    if (o.shaky) { exhale(t + P * 0.42, P * 0.2, vi * 0.8, o); exhale(t + P * 0.64, P * 0.24, vi * 0.7, o); } else exhale(t + P * 0.42, P * 0.48, vi, o);
  } };
  // your heart: lub-dub, low (felt as much as heard); its rate and level follow the story
  const lub = fx.hit([[46, 0.075, 1], [92, 0.03, 0.35], [150, 0.014, 0.18]], { width: 0.014, amp: 1, len: 0.5 }), dub = fx.hit([[56, 0.05, 1], [118, 0.022, 0.3]], { width: 0.01, amp: 1, len: 0.4 });
  const pk = SOX.peak(lub); for (const y of [lub, dub]) for (let i = 0; i < y.length; i++) y[i] /= pk;
  const HEART = [   // [film t, bpm, level dB] (−60: none)
    [B('body') + 0.4, 64, -60], [B('body') + 2.5, 64, 0], [c('ring', 0) + 2, 66, -4], [B('mum'), 68, -60],
    [SO.tTurn - 0.1, 70, -60], [SO.tTurn + 0.2, 118, -2], [c('behind', 3), 92, -8], [B('street') - 0.2, 88, -60],
    [SO.tCar, 80, -60], [SO.tCar + 0.25, 120, -4], [c('car', 2), 92, -12], [B('warn'), 88, -60],
    [c('storm', 3) - 0.6, 80, -60], [c('storm', 3) + 0.4, 80, -10], [B('park') + 1, 80, -60],
    [c('coming', 1), 90, -60], [c('coming', 2), 104, -6], [B('hide') + 0.1, 104, -4], [SO.tDog - 0.05, 100, -6], [SO.tDog + 0.2, 138, 0],
    [B('echo'), 112, -5], [c('echo', 4), 118, -3], [c('who', 0), 126, 0], [c('who', 2), 132, 1], [SO.end, 136, 2],
  ];
  const hAt = (t) => { const H = HEART; if (t <= H[0][0]) return [H[0][1], H[0][2]]; for (let i = 1; i < H.length; i++) if (t <= H[i][0]) { const u = (t - H[i - 1][0]) / (H[i][0] - H[i - 1][0]); return [H[i - 1][1] + (H[i][1] - H[i - 1][1]) * u, H[i - 1][2] + (H[i][2] - H[i - 1][2]) * u]; } return [H[H.length - 1][1], H[H.length - 1][2]]; };
  for (let t = B('body') + 0.4; t < SO.end + 0.3; ) { const [bpm, db] = hAt(t); if (db > -40) { const v = 0.55 * Math.pow(10, db / 20); X.put(lub, t, { vol: v, pan: 0 }); X.put(dub, t + 0.16 * Math.min(1, 75 / bpm) + 0.06, { vol: v * 0.62, pan: 0 }); } t += 60 / bpm; }

  // ================================================================== the kitchen
  inhale(3.15, 0.45, 0.07);                                                              // (a breath in, before "What...?")
  { const v = say('y_what'); }
  { const v = say('y_hello'); echo(v.x, v.t, 0.045, -17, 0.4, 1800, { room: V.in, wet: 0.5 }); }   // (the hall answers)
  exhale(B('room') + 0.8, 1.2, 0.04);
  // the clap: two palms, sharp, the kitchen ringing after it; and again, for the diagram
  const clap = (t, v) => { const y = fx.slap([[1150, 0.006, 1], [1900, 0.004, 0.6], [720, 0.01, 0.55], [2900, 0.003, 0.3]], { width: 0.0007, amp: 0.9, skin: 1.4, len: 0.25 });
    const n = Math.round(0.012 * sr), z = fx.white(n); for (let i = 0; i < n; i++) z[i] *= Math.exp(-i / (0.0025 * sr)); SOX.bq(z, 'bp', 1600, 0.9, sr); for (let i = 0; i < n; i++) y[i] += z[i] * 1.2;
    for (let i = 0; i < Math.min(y.length, 0.06 * sr); i++) y[i] += 0.5 * Math.sin(2 * Math.PI * 190 * i / sr) * Math.exp(-i / (0.008 * sr));
    put(y, t, { vol: v, norm: true, wet: 1.5, pan: 0.03 }); };
  clap(SO.tClap, 1.0); clap(SO.tClap2, 0.8);
  breathe(c('clap', 1) + 0.6, B('body') - 0.6, 4.2, 0.03);
  // your body: close breathing, loud; a swallow
  breathe(B('body') + 0.5, c('ring', 0) + 1.5, 4.0, 0.22, { wet: 0.25 });
  { const t = c('body', 1) + 1.8, y = fx.hit([[310, 0.012, 1], [880, 0.006, 0.5], [1900, 0.003, 0.25]], { width: 0.002, amp: 0.6, noise: 0.3, nlen: 0.006, nhp: 1500, len: 0.12 });
    put(y, t, { vol: 0.1, norm: true, wet: 0.2 }); X.put(fx.hit([[120, 0.04, 1], [240, 0.02, 0.4]], { width: 0.02, amp: 0.8, len: 0.25 }), t + 0.12, { vol: 0.16, norm: true }); }
  breathe(c('ring', 0) + 2.0, B('mum') + 0.5, 4.6, 0.05);
  // Mum: three taps on the screen, your voice; a shaky breath out after it
  for (const dt of [0.5, 0.85, 1.35]) put(fx.hit([[2600, 0.004, 1], [5200, 0.002, 0.4]], { width: 0.0004, amp: 0.6, noise: 0.4, nlen: 0.002, nhp: 3000, len: 0.04 }), c('mum', 0) + dt, { vol: 0.06, norm: true, pan: 0.2 });
  { say('y_mum'); exhale(soVoice('y_mum').start + soVoice('y_mum').seconds + 0.4, 1.4, 0.05, { voice: 0.15 }); }
  inhale(c('text', 0) + 0.35, 0.4, 0.09);                                                // (a text from a number you don't know)
  // ================================================================== the window
  { const t = SO.tWin;
    put(fx.hit(fx.metalModes(1350, 0.35), { width: 0.0006, amp: 0.7, noise: 0.5, nlen: 0.004, nhp: 1500, len: 0.3 }), t - 0.35, { vol: 0.12, norm: true, pan: 0.15, where: 'in' });   // the handle
    put(fx.hit([[620, 0.02, 1], [1400, 0.01, 0.5]], { width: 0.0015, amp: 0.8, noise: 0.4, nlen: 0.008, nhp: 800, len: 0.15 }), t - 0.2, { vol: 0.1, norm: true, pan: 0.15, where: 'in' });  // the latch
    put(fx.creak(0.7, [[310, 0.02, 1], [720, 0.012, 0.6], [1500, 0.006, 0.3]], { rate: [18, 45] }), t - 0.1, { vol: 0.06, norm: true, pan: 0.15, where: 'in' }); }   // the frame
  // "Hello? ...Is anyone out there?": out into the night; the flats across the park answer (106 m: 0.62 s), the tower
  // (228 m: 1.33 s), and the flats again off your own block (1.24 s)
  { const v = say('y_window', { where: 'win' });
    echo(v.x, v.t, 0.62, -12, -0.25, 2200, { room: V.win, wet: 0.6 }); echo(v.x, v.t, 1.24, -21, 0.3, 1500, { room: V.win, wet: 0.7 }); echo(v.x, v.t, 1.33, -19, 0.05, 1600, { room: V.win, wet: 0.7 }); }
  breathe(soVoice('y_window').start + 3.5, B('faces') + 2, 4.4, 0.035);
  exhale(c('faces', 1) + 0.9, 1.6, 0.05, { voice: 0.1 });
  // ================================================================== the stairwell
  // your door, pulled shut behind you; every step down (the treads, the landings), in the dark too
  { const t0 = soC('stairs', 0) - 0.4, P = SO_STAIR_PATH, per = (soC('behind', 0) - 0.4 - t0) / (P.length - 1);
    put(fx.hit(fx.woodModes(95, 1.6), { width: 0.004, amp: 1, noise: 0.4, nlen: 0.02, nhp: 300, len: 0.6 }), B('stairs') + 0.1, { vol: 0.32, norm: true, pan: 0.2, where: 'stair' });
    put(fx.hit(fx.metalModes(1700, 0.25), { width: 0.0005, amp: 0.6, noise: 0.4, nlen: 0.003, len: 0.25 }), B('stairs') + 0.16, { vol: 0.1, norm: true, pan: 0.25, where: 'stair' });
    for (let i = 1; i < P.length; i++) { const flat = Math.abs(P[i][1] - P[i - 1][1]) < 0.01, t = t0 + i * per - 0.04;
      put(fx.step({ weight: flat ? 0.4 : 0.62, s: flat ? 1.0 : 1.15, scuff: flat ? 0.35 : 0.12, body: 82 }), t, { vol: flat ? 0.3 : 0.42, norm: true, pan: i % 2 ? 0.08 : -0.08, where: 'stair' }); } }
  { say('y_okay', { where: 'stair' }); }
  breathe(soVoice('y_okay').start + 3.4, SO.tLightOut + 0.3, 3.4, 0.04, { wet: 0.8 });
  breathe(SO.tLightOut + 0.6, SO.tTurn - 0.6, 1.8, 0.07, { wet: 0.8, shaky: true });
  // you turn: a gasp, your shoe scuffing the step, your jacket
  { const t = SO.tTurn - 0.15; gasp(t, 0.42);
    put(fx.step({ weight: 0.35, scuff: 0.8 }), t + 0.05, { vol: 0.14, norm: true, where: 'stair' });
    put(fx.rustle(0.5, { density: 300, rub: 0.5, lo: 500, hi: 4500, grain: 0.01 }), t - 0.2, { vol: 0.09, norm: true, where: 'stair' }); }
  breathe(SO.tTurn + 0.7, soVoice('y_scared').start - 0.2, 1.1, 0.1, { wet: 0.7, shaky: true });
  { say('y_scared', { where: 'stair' }); }
  breathe(soVoice('y_scared').start + 2.6, B('street') - 0.2, 2.2, 0.06, { wet: 0.8 });
  // ================================================================== the street
  { const t = B('street') + 0.15;   // the front door's push bar, the door swinging, its closer
    put(fx.hit(fx.metalModes(480, 0.8), { width: 0.002, amp: 0.9, noise: 0.5, nlen: 0.01, nhp: 400, len: 0.8 }), t, { vol: 0.24, norm: true, pan: -0.2, where: 'street' });
    put(fx.creak(0.9, [[180, 0.03, 1], [410, 0.02, 0.6]], { rate: [10, 30] }), t + 0.15, { vol: 0.05, norm: true, pan: -0.3, where: 'street' }); }
  breathe(B('street') + 1.5, B('car') - 0.2, 4.6, 0.035);
  // off the kerb (your shoe in the wet); you see it: a gasp; back onto the kerb; the air it pushes moves your jacket
  { const k = SO.tKerb + 0.3, tC = SO.tCar;
    put(fx.step({ weight: 0.6, s: 0.95, scuff: 0.2 }), k, { vol: 0.2, norm: true, where: 'street' });
    put(fx.liquid(0.25, (x) => Math.min(1, x / 0.004) * Math.exp(-x / 0.05), { f: 900 }), k + 0.005, { vol: 0.08, norm: true, where: 'street' });
    gasp(tC - 0.48, 0.38);
    put(fx.step({ weight: 0.7, s: 1.05, scuff: 0.5 }), tC - 0.02, { vol: 0.2, norm: true, where: 'street' });
    put(fx.rustle(0.45, { density: 380, rub: 0.7, lo: 300, hi: 3500, grain: 0.008, env: (u) => Math.min(1, u * 12) * Math.pow(1 - u, 1.5) }), tC + 0.05, { vol: 0.12, norm: true, where: 'street' });
    breathe(tC + 0.6, c('car', 2), 1.3, 0.09, { shaky: true }); }
  breathe(B('warn') + 0.5, B('heads'), 4.2, 0.03);
  // "Can anyone hear me?": the flats across the park (100 m), the church (70 m)
  { const v = say('y_street', { where: 'street' }); echo(v.x, v.t, 0.41, -16, 0.7, 2000, { room: V.street, wet: 0.6 }); echo(v.x, v.t, 0.58, -13, -0.2, 2200, { room: V.street, wet: 0.6 }); echo(v.x, v.t, 1.17, -24, 0.3, 1500, { room: V.street, wet: 0.7 }); }
  breathe(c('heads', 1), B('storm'), 3.6, 0.045, { ramp: (u) => 0.6 + 0.4 * u });
  // the storm: a sharp breath at the flash; the count, each number answered by the flats (94 m: 0.55 s)
  inhale(SO.tBolt + 0.15, 0.3, 0.12);
  { const v = say('y_count', { where: 'street' }); echo(v.x, v.t, 0.55, -14, -0.2, 2000, { room: V.street, wet: 0.6 }); echo(v.x, v.t, 1.1, -25, 0.3, 1400, { room: V.street, wet: 0.7 }); }
  breathe(soVoice('y_count').start + 6.0, B('park') - 0.3, 3.8, 0.04);
  // ================================================================== the park
  exhale(B('park') + 0.9, 1.8, 0.05, { voice: 0.1 });
  breathe(B('park') + 3.5, SO.tShout - 1.4, 4.0, 0.035);
  inhale(SO.tShout - 0.65, 0.55, 0.2, { wet: 0.4 });                                      // (a deep breath in)
  // "HELLO!": every building round the park sends it back, each at its own delay; then the echoes of the echoes
  { const v = say('y_shout', { where: 'park', wet: 1.3 }), dB = [-9, -10, -12, -8, -14], lp = [3000, 2800, 2500, 2100, 1700];
    SO_ECHO.forEach((e, i) => echo(v.x, v.t, e.dt, dB[i], e.pan * 0.85, lp[i], { room: V.park, wet: 0.5 }));
    [[1.92, -18, 0.4, 1500], [2.46, -20, -0.5, 1300], [3.15, -23, 0.15, 1100], [3.98, -27, -0.3, 900]].forEach(([dt, d, p, l]) => echo(v.x, v.t, dt, d, p, l, { room: V.park, wet: 0.7 })); }
  breathe(SO.tShout + 4.6, B('coming'), 3.4, 0.05);
  breathe(c('coming', 0) + 0.5, B('hide') - 0.1, 1.6, 0.08, { ramp: (u) => 0.6 + 0.6 * u, shaky: true });
  // ================================================================== the dark
  // into the trees: leaves against you, a knee on the wet ground; shaky breaths through the nose (trying to be quiet)
  { const t = B('hide');
    put(fx.rustle(1.0, { density: 420, rub: 0.25, lo: 1400, hi: 7500, grain: 0.004, env: (u) => Math.min(1, u * 8) * Math.pow(1 - u, 1.4) }), t + 0.05, { vol: 0.14, norm: true, pan: 0.3, where: 'dark' });
    put(fx.slap([[90, 0.05, 1], [210, 0.03, 0.4]], { width: 0.01, amp: 0.6, skin: 0.1, len: 0.3 }), t + 0.6, { vol: 0.12, norm: true, where: 'dark' }); }
  breathe(B('hide') + 1.2, SO.tDog - 0.3, 2.4, 0.07, { shaky: true, nasal: true });
  // the dog: you never heard it coming: a gasp, a flinch through the leaves; panting, held back
  { const t = SO.tDog; gasp(t + 0.08, 0.5);
    put(fx.rustle(0.6, { density: 520, rub: 0.35, lo: 1200, hi: 7000, grain: 0.004, env: (u) => Math.min(1, u * 15) * Math.pow(1 - u, 1.6) }), t + 0.1, { vol: 0.16, norm: true, pan: -0.2, where: 'dark' });
    breathe(t + 0.8, B('echo') + 1.0, 0.9, 0.11, { shaky: true }); }
  breathe(B('echo') + 1.0, soVoice('y_who').start - 0.4, 2.6, 0.06, { shaky: true, ramp: (u) => 0.8 + 0.4 * u });
  // your clicks and what answers them. The real echoes come back in milliseconds (a tree 3 m off: 17 ms; the people
  // round you: 40–100 ms); the echo picture is slowed ~70× (echo.js: 5 m/s), and as its pulse reaches each thing, that
  // thing rings: the tree (wood), the bench (iron), something soft at 7 m, the people (a glassy rain of them), and the
  // one right behind you (low and close)
  { const H = SO_ST.you.hide, Rng = SO_ECHO_RANGE, Vv = SO_ECHO_V, tw = soVoice('y_who').start;
    const click = fx.hit([[2300, 0.004, 1], [3400, 0.003, 0.6], [1500, 0.005, 0.45]], { width: 0.0003, amp: 1, noise: 0.5, nlen: 0.003, nhp: 1500, len: 0.06 }), ck = SOX.peak(click);
    for (let i = 0; i < click.length; i++) click[i] /= ck;
    const things = (t) => {   // [{ d (m), a (bearing), kind }] at film t
      const out = [{ d: Math.hypot(-9 - H[0], -19.2 - H[2]), a: Math.atan2(-9 - H[0], -19.2 - H[2]), kind: 'tree' }, { d: Math.hypot(-8 - H[0], -17.2 - H[2]), a: Math.atan2(-8 - H[0], -17.2 - H[2]), kind: 'bench' }];
      SO_RING.forEach((e, i) => { const step = soSm(t, tw + e.d / SOP.c + 0.2, tw + e.d / SOP.c + 1.0);
        const d = i === 1 ? SO_BEHIND.d0 + (SO_BEHIND.d1 - SO_BEHIND.d0) * soSm(t, soC('who', 2), soC('question', 0) - 0.6) : e.d - 0.7 * step;
        out.push({ d, a: i === 1 ? SO_BEHIND.a : e.a, kind: i === 0 ? 'it' : i === 1 ? 'behind' : 'person' }); });
      return out; };
    const yawAt = (t) => (t > SO.tClicks[SO.tClicks.length - 1] - 0.3 ? Math.PI : t > c('who', 1) - 0.8 ? 0.35 : t > c('echo', 5) + 0.4 ? -1.15 : t > c('echo', 4) - 0.6 ? 0.25 : -0.3);
    const ping = { tree: fx.hit(fx.woodModes(180, 2.5), { width: 0.002, amp: 1, len: 0.6 }), bench: fx.hit(fx.metalModes(820, 1.2), { width: 0.0008, amp: 1, len: 1.2 }),
      it: fx.hit([[110, 0.12, 1], [233, 0.07, 0.6], [311, 0.05, 0.4]], { width: 0.006, amp: 1, len: 1.0 }), behind: fx.hit([[73, 0.18, 1], [104, 0.12, 0.6], [155, 0.07, 0.35]], { width: 0.008, amp: 1, len: 1.4 }) };
    const pp = ['E6', 'F6', 'B6', 'C7', 'Bb6', 'F#6'].map((n) => fx.bellBuf(soMidi(n)));
    SO.tClicks.forEach((t, k) => {
      put(click, t, { vol: 0.42, norm: true, wet: 1.2, pan: 0.02, where: 'dark' });
      const yaw = yawAt(t), list = things(t);
      for (const o of list) {
        const pan = MathX.clamp(-Math.sin(o.a - yaw) * 0.8, -0.8, 0.8), dt = 2 * o.d / SOP.c;
        // the real echo (a few ms: a flam, a closeness; the crowd a dense whisper of them)
        X.put(click, t + dt, { vol: 0.3 * (o.kind === 'person' ? 0.12 : o.kind === 'behind' ? 0.6 : 0.3) / Math.max(1, o.d / 3), pan, lp: 5000, room: V.dark, wet: 0.2 });
        // the echo picture, slowed: what this click's pulse reaches (as far as the picture shows: SO_ECHO_RANGE)
        if (o.d > Rng[k]) continue;
        const tp = t + o.d / Vv;
        if (o.kind === 'person') X.put(pp[(k * 7 + Math.round(o.d * 10)) % pp.length], tp, { vol: 0.035, pan, lp: 6000, room: V.dark, wet: 0.6 });
        else X.put(ping[o.kind], tp, { vol: { tree: 0.09, bench: 0.08, it: 0.16, behind: k === SO.tClicks.length - 1 ? 0.5 : 0.07 }[o.kind], norm: true, pan: o.kind === 'behind' && k < SO.tClicks.length - 1 ? 0 : pan, lp: o.kind === 'behind' ? 900 : 4000, room: V.dark, wet: 0.5 });
      }
    });
    // "Who's there?": whispered; the people round you send it back, 40 to 100 ms later, from every side
    { const v = say('y_who', { where: 'dark' }), list = things(v.t);
      list.forEach((o, i) => { if (o.kind !== 'person' && o.kind !== 'it') return; echo(v.x, v.t, 2 * o.d / SOP.c, -24 - 0.2 * o.d, MathX.clamp(-Math.sin(o.a - yawAt(v.t)) * 0.85, -0.85, 0.85), 2400, { room: V.dark, wet: 0.3 }); }); }
  }
  // they step closer: a catch in your breath; then breathing you can't quiet, held at the very end
  { const tq = SO.tClicks[SO.tClicks.length - 1];
    inhale(soVoice('y_who').start + 2.3, 0.25, 0.14);
    breathe(soVoice('y_who').start + 3.0, tq - 0.9, 1.25, 0.1, { shaky: true, ramp: (u) => 0.8 + 0.5 * u });
    gasp(tq + SO_BEHIND.d1 / SO_ECHO_V + 0.05, 0.45);
    put(fx.rustle(0.4, { density: 400, rub: 0.5, lo: 600, hi: 5000, grain: 0.008 }), tq - 0.7, { vol: 0.1, norm: true, where: 'dark' }); }   // (you turn)
  X.flush();
});
