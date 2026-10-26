/* =====================================================================
   SOUND · SFX — the events, each heard when and how the slowed air would really deliver it (sound-lib.js:
   ssHeardStill for a still source, ssMoving for a moving one: exact delay, Doppler, order and cone).
     morning   the blackbird (on time: a sixtieth of a second late); the boom at 7:27 and the booms of other planes;
               "Good morning!" an octave deep; the kettle's whistle (an octave down); the radio (exactly as recorded)
     kitchen   the spoon and the kitchen ringing 4× longer; Mum's voice three octaves below its vowels; phone taps
     street    the ambulance (×2.6, then ×0.62); cars faster than their sound (a crack, then the engine from both
               ways); the music car, backwards; the noon bell 75 s late; the kick and the ball's crack; one ear then
               the other; the crowd's footsteps cracking
     home      the TV 4.5 s late; the clap and its echoes, seconds apart; the earbuds; the meow after the cat; your hum
               through your bones
     night     rain (but no thunder); the music box's tune 4 min 55 s late, a little lower and slower; the heartbeat
     real      a mug of hot chocolate, its clinks rising as the bubbles clear
   ===================================================================== */

// the music box's tune (the film's theme, as a music box would play it): [beat, note] over SS.boxTune seconds
const SS_TUNE = [[0, 'D6'], [1, 'A6'], [2, 'G6'], [3, 'E6'], [4, 'D7'], [6, 'A6'], [7, 'F#6'], [8, 'D6'], [9, 'E6'], [10, 'F#6'], [11, 'A6'], [12, 'G6'],
  [14, 'E6'], [15, 'C#6'], [16, 'A5'], [17, 'D6'], [18, 'E6'], [19, 'F#6'], [20, 'E6'], [21, 'D6'], [22, 'A5'], [23, 'D6']];
const SS_TUNE_BEAT = SS.boxTune / 24;

ssSound('sfx', 'morning', function (ctx, bus, K) {
  const { fx, sr } = K, room = K.verb('garden', 1.4, { bright: 0.5, damp: 4, wet: 0.18 });
  // the blackbird: a phrase every 3.1 s while its beak moves (garden.js), from 5.5 m away: 0.016 s late
  for (let t = SS.song; t < SS.plane - 0.5; t += 3.1) ssHeardStill(K, ssChirp(fx, { n: 6, f0: 2300, gap: 0.07, nd: 0.11 }), t, 5.5, { put: { vol: 0.14, pan: -0.45, room } });
  for (const [t, f0, pan] of [[SS.seven + 1.2, 3600, 0.6], [SS.seven + 4.4, 4200, -0.7], [SS.seven + 7.9, 3300, 0.4], [SS.bird + 1.0, 3900, 0.7]]) K.put(ssChirp(fx, { f0 }), t, { vol: 0.07, pan, room });
  // 7:27 the boom: an N-wave a third of a second long, twice (nose and tail), the windows rattling after
  {
    const sh = 0.32, y = fx.arr(2.6), L = Math.round(sh * sr);
    for (const off of [0, 0.12]) { const i0 = Math.round(off * sr); for (let i = 0; i < L; i++) y[i0 + i] += (i < 20 ? i / 20 : 1 - 2 * (i - 20) / (L - 20)) * (off ? 0.85 : 1); }
    SSX.bq(y, 'lp', 900, 0.7, sr);
    const rum = ssNoise(fx, y.length, 'brown'); for (let i = 0; i < y.length; i++) y[i] += rum[i] * 0.8 * Math.exp(-i / (1.4 * sr)) * Math.min(1, i / (0.01 * sr));
    K.put(y, SS.boomAt, { vol: 1.0, norm: true, room });
    const rattle = fx.creak(0.7, fx.glassModes(), { rate: [30, 70], env: (u) => Math.exp(-u * 4) });
    K.put(rattle, SS.boomAt + 0.08, { vol: 0.18, norm: true, pan: -0.5 });
    // the other planes' booms: further off, softer, rolling
    for (const [dt, v, p] of [[1.8, 0.4, 0.6], [4.6, 0.3, -0.5], [7.9, 0.34, 0.2], [10.2, 0.22, -0.7], [13.0, 0.26, 0.5]]) {
      const z = fx.arr(2); const L2 = Math.round(0.36 * sr);
      for (const off of [0, 0.14]) { const i0 = Math.round(off * sr); for (let i = 0; i < L2; i++) z[i0 + i] += 1 - 2 * i / L2; }
      SSX.bq(z, 'lp', 380, 0.7, sr); K.put(z, SS.others + dt, { vol: v, norm: true, pan: p, room });
    }
  }
  // 8:00 "Good morning!": his voice box at its usual pitch, the air in his throat ringing an octave lower
  {
    const sc = ssC(1) / SSP.c0, sy = [[0, 0.22, 4], [0.26, 0.24, 3], [0.56, 0.34, 2]], d = 1.1;
    const env = (t) => sy.reduce((s, [a, l]) => s + Math.max(0, Math.sin(Math.PI * MathX.clamp((t - a) / l, 0, 1))) ** 0.6, 0);
    const v = ssVoice(fx, d, { f0: 118, scale: sc, env, vowel: (t) => (t < 0.25 ? 4 : t < 0.55 ? 3 : 2), glide: (t) => -0.12 * t });
    ssHeardStill(K, v, SS.morning, 5.9, { put: { vol: 0.45, norm: true, pan: 0.5, room } });
    const v2 = ssVoice(fx, 1.4, { f0: 112, scale: sc, env: (t) => Math.max(0, Math.sin(t * 9)) ** 0.8 * (t < 1.3 ? 1 : 0), vowel: (t) => t * 6 });
    ssHeardStill(K, v2, SS.morning + 2.4, 5.9, { put: { vol: 0.3, norm: true, pan: 0.5, room } });
  }
  // the kettle (inside, 8:00): its whistle is a pocket of ringing air, so it sings at half its usual 2,000 Hz
  {
    const d = SS.radio - SS.whistle + 0.3, n = Math.ceil(d * sr), y = fx.arr(d), f = 2000 * ssC(1) / SSP.c0, wv = fx.wander(3); let ph = 0;
    for (let i = 0; i < n; i++) { const t = i / sr; ph += 2 * Math.PI * f * (1 + 0.004 * wv(t)) / sr; y[i] = (Math.sin(ph) + 0.15 * Math.sin(2 * ph)) * Math.min(1, t / 1.2) * Math.min(1, (d - t) / 0.3); }
    const air = fx.white(n); SSX.bq(air, 'bp', f, 3, sr); for (let i = 0; i < n; i++) y[i] += air[i] * 0.4 * Math.min(1, i / sr / 1.2);
    K.put(y, SS.whistle, { vol: 0.05, norm: true, pan: -0.3 });
  }
  // the radio: a song recorded last year, through a small speaker, exactly as it was
  {
    const d = SS.nine - SS.radio + 0.2, n = Math.ceil(d * sr), y = fx.arr(d), notes = ['D5', 'F#5', 'A5', 'B5', 'A5', 'F#5', 'E5', 'D5', 'B4', 'D5', 'E5', 'F#5', 'E5', 'D5', 'A4', 'B4'], bass = ['D3', 'D3', 'B2', 'B2', 'G2', 'G2', 'A2', 'A2'];
    for (let k = 0; k * 0.36 < d; k++) {
      const i0 = Math.round(k * 0.36 * sr), p = fx.pianoBuf(ssMidi(notes[k % 16])), b = fx.pianoBuf(ssMidi(bass[(k >> 1) % 8]));
      for (let i = 0; i < Math.min(p.length, 0.5 * sr) && i0 + i < n; i++) y[i0 + i] += p[i] * 0.5 * Math.min(1, (0.5 * sr - i) / (0.05 * sr));
      if (k % 2 === 0) for (let i = 0; i < Math.min(b.length, 0.7 * sr) && i0 + i < n; i++) y[i0 + i] += b[i] * 0.5 * Math.min(1, (0.7 * sr - i) / (0.05 * sr));
      if (k % 4 === 2) { const s = fx.white(Math.round(0.06 * sr)); for (let i = 0; i < s.length && i0 + i < n; i++) y[i0 + i] += s[i] * 0.25 * Math.exp(-i / (0.012 * sr)); }
    }
    SSX.bq(y, 'hp', 380, 0.8, sr); SSX.bq(y, 'lp', 4200, 0.8, sr); SSX.bq(y, 'peak', 1500, 1, sr, 4);
    for (let i = 0; i < n; i++) y[i] *= Math.min(1, i / (0.2 * sr), (n - i) / (0.4 * sr));
    K.put(y, SS.radio + 0.1, { vol: 0.09, norm: true, pan: -0.15 });
  }
});

ssSound('sfx', 'kitchen', function (ctx, bus, K) {
  const { fx, sr } = K;
  // 9:00 the spoon: a free fall from 1.02 m (garden.js), a clink on the tiles, the kitchen ringing 4× longer (2 s)
  {
    const tf = Math.sqrt(2 * (1.02 - 0.02) / 9.81), room = K.verb('kitchen9', 4.5, { bright: 0.55, damp: 2.2, shape: 1.6, wet: 0.65 });
    const hit = fx.hit(fx.metalModes(2900, 0.6).concat(fx.metalModes(4100, 0.4)), { width: 0.0003, noise: 0.3, nhp: 3000 }), b = fx.hit(fx.metalModes(3300, 0.4), { width: 0.0003 });
    K.put(hit, SS.drop + tf + 0.004, { vol: 0.3, norm: true, room, wet: 1.4 }); K.put(b, SS.drop + tf + 0.2, { vol: 0.18, norm: true, room, wet: 1.4 });
  }
  // 10:00 Mum talking: her voice box as always, but the air in her throat rings three octaves lower: no vowels left
  {
    const d = SS.text - SS.ten + 0.4, env = (t) => Math.max(0, Math.sin(t * 7.3) * Math.sin(t * 2.1 + 1)) ** 0.5 * (1 - MathX.smooth(t, d - 1.2, d - 0.4));
    const v = ssVoice(fx, d, { f0: 205, scale: ssC(3) / SSP.c0, env, vowel: (t) => t * 5 });
    K.put(v, SS.ten + 0.2, { vol: 0.4, norm: true, pan: 0.1 });
  }
  // the phones: taps, a sent-message swoosh, replies arriving
  for (let t = SS.text - 0.2, i = 0; t < SS.motorway - 1.2; i++, t += 0.16 + 0.12 * ssR(i, 5)) K.put(fx.hit([[2600, 0.004, 1], [5200, 0.002, 0.4]], { width: 0.0006 }), t, { vol: 0.05, pan: 0.15 });
  for (const t of [SS.text + 1.6, SS.text + 3.1, SS.text + 4.4]) K.put(fx.beep(1320, 0.06), t, { vol: 0.07, pan: -0.2 });
  // 10:27 the motorway: still its old hum (its first crackles are 1 min 43 s away)
});

ssSound('sfx', 'street', function (ctx, bus, K) {
  const { fx, sr } = K, A = SS_SS, street = K.verb('street', 1.1, { bright: 0.5, damp: 4, wet: 0.2 });
  const at = [A.x + 0.2, 1.62, 1.5];
  // an engine as it is made (from emission time): a low growl with harmonics and road roar
  const engine = (t0, d, f = 38, seed = 1) => { const n = Math.ceil(d * sr), y = new Float32Array(n), road = fx.white(n); SSX.bq(road, 'bp', 700, 0.6, sr); let ph = 0;
    for (let i = 0; i < n; i++) { const te = t0 + i / sr; ph += 2 * Math.PI * f * (1 + 0.05 * ssTNoise(te, 0.7, seed)) / sr; y[i] = 0.5 * Math.sin(ph) + 0.3 * Math.sin(2 * ph + 0.3) + 0.2 * Math.sin(3 * ph) + 0.25 * ssTNoise(te, 180, seed + 3) + 0.5 * road[i]; } return y; };
  // 11:00 walking to the shops: the traffic, Doppler and all (you are walking too)
  {
    const t0 = SS.eleven, t1 = SS.siren + 0.3, you = (t) => [A.x, 1.62, 6 - 1.4 * (t - SS.eleven)];
    SS_SS_TRAFFIC.slice(0, 6).forEach((T, i) => { const src = (te) => [T.x, 0.7, ssTrafficZ(T, te)], x = engine(t0 - 14, t1 - t0 + 15, 34 + 6 * i, i + 1);
      ssMoving(K, t0, t1, src, x, t0 - 14, { L: you, look: 12, vol: 0.45, dmin: 2, room: street }); });
  }
  // the ambulance: a two-tone siren (960 / 770 Hz, 0.6 s each) and its engine, from 13 m/s
  {
    const C = SS_SS_CARS.amb, src = (te) => [C.x, 1.6, ssCarZ(C, te)], t0 = SS.siren, t1 = SS.silent + 0.2, xt0 = t0 - 14, d = t1 - xt0, n = Math.ceil(d * sr), y = new Float32Array(n);
    let ph = 0; for (let i = 0; i < n; i++) { const te = xt0 + i / sr, f = (Math.floor(te / 0.6) % 2 ? 770 : 960); ph += 2 * Math.PI * f / sr; y[i] = Math.sin(ph) + 0.35 * Math.sin(3 * ph) + 0.2 * Math.sin(5 * ph); }
    const e = engine(xt0, d, 42, 9); for (let i = 0; i < n; i++) y[i] = 0.55 * y[i] + 0.25 * e[i];
    ssMoving(K, t0, t1, src, y, xt0, { at, look: 14, vol: 0.55, dmin: 2.5, room: street });
  }
  // 11:41 cars faster than their sound: nothing ahead of them; a crack as each one's cone sweeps over you; then its
  // engine, from both directions at once (traffic in the shot, the close car, the music car)
  {
    const t0 = SS.silent, t1 = SS.noon - 0.3;
    SS_SS_TRAFFIC.slice(0, 6).forEach((T, i) => { const src = (te) => [T.x, 0.7, ssTrafficZ(T, te)], x = engine(t0 - 14, t1 - t0 + 15, 34 + 6 * i, i + 11);
      ssMoving(K, t0, SS.after + 0.4, src, x, t0 - 14, { at, look: 12, vol: 0.4, dmin: 2, crack: 0.12, room: street }); });
    const Cc = SS_SS_CARS.close, srcC = (te) => [Cc.x, 0.7, ssCarZ(Cc, te)];
    ssMoving(K, SS.after, SS.backwards + 0.4, srcC, engine(SS.after - 14, 30, 40, 21), SS.after - 14, { at, look: 12, vol: 0.6, dmin: 2, crack: 0.5, room: street });
    // the music car: a bass and a melody (and its engine), made in order; it reaches you last notes first
    const Cm = SS_SS_CARS.music, srcM = (te) => [Cm.x, 1.0, ssCarZ(Cm, te)], xt0 = SS.backwards - 14, d = SS.noon - xt0, n = Math.ceil(d * sr), y = engine(xt0, d, 46, 31);
    for (let i = 0; i < n; i++) y[i] *= 0.3;
    const mel = ['E5', 'G5', 'B5', 'D6', 'C6', 'A5', 'G5', 'E5'], bas = ['E2', 'E2', 'C2', 'D2'];
    for (let k = 0; k * 0.25 < d; k++) { const i0 = Math.round(k * 0.25 * sr), f = ssHz(mel[k % 8]), fb = ssHz(bas[(k >> 2) % 4]);
      for (let i = 0; i < 0.22 * sr && i0 + i < n; i++) { const t = i / sr, e = Math.exp(-t * 9); y[i0 + i] += 0.5 * e * Math.sign(Math.sin(2 * Math.PI * f * t)) * 0.4 + 0.6 * Math.exp(-t * 4) * Math.sin(2 * Math.PI * fb * t); } }
    SSX.bq(y, 'lp', 3500, 0.7, sr);
    ssMoving(K, SS.backwards, t1, srcM, y, xt0, { at, look: 14, vol: 0.8, dmin: 2, crack: 0.5, room: street });
  }
  // noon: the church bell, 800 m away: twelve strokes 2.4 s apart from 12:00:00; the first reaches you at 12:01:15,
  // the next 2.4 s later (heard only where the film is in real time)
  {
    const bell = fx.hit([[226, 3.5, 1], [452, 2.6, 0.7], [540, 1.8, 0.45], [678, 1.4, 0.35], [904, 1.0, 0.25], [1130, 0.7, 0.15], [1356, 0.5, 0.1]], { width: 0.0015, len: 7 });
    SSX.bq(bell, 'lp', 2600, 0.7, sr);
    const d = Math.hypot(A.bell[0] - at[0], A.bell[1] - at[1], A.bell[2] - at[2]);
    for (let k = 0; k < 12; k++) ssHeardStill(K, bell, SS.bell + 2.4 * k, d, { put: { vol: 0.18, norm: true, room: street, wet: 1.5 }, w0: SS.noon, w1: SS.ball });
  }
  // 12:03 the kick (a thud from the boy, 2 s later at 10 m/s) and the ball: faster than sound, it cracks
  {
    const kickAt = [SS_SS_KID[0], 0.2, SS_SS_KID[2]], youK = [A.x - 0.3, 1.62, 3], d = Math.hypot(kickAt[0] - youK[0], kickAt[1] - youK[1], kickAt[2] - youK[2]);
    ssHeardStill(K, fx.hit([[95, 0.05, 1], [160, 0.03, 0.6], [310, 0.015, 0.3]], { width: 0.004, noise: 0.4, nhp: 600 }), SS.kick, d, { put: { vol: 0.3, norm: true, pan: -0.5, room: street } });
    // (the ball's flight: as street.js; its sound a soft rush)
    const BALL = { v: 25, dir: ssN3([0.35, 0, -1]) }, ballAt = (te) => { const q = Math.max(0, te - SS.kick), s = BALL.v * q; return [SS_SS_KID[0] + 0.3 + BALL.dir[0] * s, 0.26 + Math.max(0, 3.2 * q - 4.9 * q * q), SS_SS_KID[2] - 0.2 + BALL.dir[2] * s]; };
    const xt0 = SS.kick, x = fx.white(Math.ceil(3 * sr)); SSX.bq(x, 'bp', 900, 0.8, sr); for (let i = 0; i < x.length; i++) x[i] *= 0.15 * Math.min(1, i / (0.01 * sr)) * Math.exp(-i / (2 * sr));
    ssMoving(K, SS.kick, SS.flying - 0.2, (te) => (te < SS.kick ? [99, -99, 99] : ballAt(te)), x, xt0, { at: youK, look: 10, vol: 0.4, crack: 0.4, crackLen: 0.0015, room: street });
  }
  // 2 PM the ears: a sound from your left, your left ear first and the right 0.075 s later
  { const tc = SS.ears + 2.6, c = fx.slap(fx.panelModes(0.6), { amp: 0.9 }), dt = 0.2 / ssC(ssH(tc));
    K.put(c, tc, { vol: 0.5, norm: true, pan: -1 }); K.put(c, tc + dt, { vol: 0.4, norm: true, pan: 1 });
    K.put(c, tc + 3.4, { vol: 0.45, norm: true, pan: -1 }); K.put(c, tc + 3.4 + dt, { vol: 0.36, norm: true, pan: 1 }); }
  // the crowd's footsteps: 3 PM (the cold open and "Every step breaks the sound barrier"): every step a crack
  const crowd = (t0, t1, rate, vol) => { const r = new RNG(Math.round(t0 * 100) + 7); for (let t = t0; t < t1; t += -Math.log(1 - r.next() * 0.999) / rate) {
    const near = r.next(); K.put(ssCrack(fx, { len: 0.0008 + 0.002 * r.next(), body: 70 + 60 * r.next(), decay: 0.02 }), t, { vol: vol * (0.25 + 0.75 * near * near), norm: true, pan: r.range(-0.9, 0.9), room: street, wet: 0.6 }); } };
  crowd(0.4, SS.titleShot - 0.05, 7, 0.26);
  crowd(SS.three + 0.4, SS.four - 0.1, 5, 0.18);
  crowd(SS.popcorn, SS.four - 0.1, 12, 0.24);
  // (and your own steps in the cold open: you are walking just faster than they can get away from you)
  for (let t = 0.5; t < SS.titleShot - 0.2; t += 0.47) K.put(fx.step({ weight: 0.4 }), t, { vol: 0.1, norm: true, pan: 0.1 });
});

ssSound('sfx', 'home', function (ctx, bus, K) {
  const { fx, sr } = K;
  // 4 PM the TV: the presenter's voice (its speaker shakes normally), 4.5 s behind her lips (garden.js: the same mouth)
  {
    const mouth = (te) => Math.round(4 * Math.max(0, Math.sin(te * 9.1) * Math.sin(te * 3.3))) / 4, xt0 = SS.four - 6, d = SS.clap - xt0 + 0.5;
    const v = ssVoice(fx, d, { f0: 190, scale: 1, env: (t) => Math.min(1, mouth(xt0 + t) * 1.6), vowel: (t) => t * 7 });
    SSX.bq(v, 'hp', 250, 0.7, sr); SSX.bq(v, 'lp', 5000, 0.7, sr);
    const tvh = ssH(SS.four), delay = (ssArriveH(tvh, SS_K.tvDist) - tvh) * 3600;
    K.put(v, xt0 + delay, { vol: 0.3, norm: true, pan: -0.5, stop: SS.clap - 0.1, fade: 0.3, fadeIn: 0.05 });
  }
  // the clap (16:00:11) by your face, then its echoes: off every wall, floor and ceiling (image sources), each arriving
  // when its path is done at 67 cm/s, seconds apart, fading over minutes
  {
    const KD = SS_G.kitchen, E = SS_K.ear, c0 = [E[0], E[1] - 0.1, E[2] - 0.36], B = [[KD[0], KD[1]], [0, 2.5], [0.36, KD[2]]], room = K.verb('clap', 3.0, { bright: 0.5, damp: 2.0, wet: 0.35 });
    const clap = fx.slap([[900, 0.01, 1], [1500, 0.008, 0.6], [2300, 0.005, 0.4]], { amp: 1, width: 0.0008, skin: 1.2, len: 0.2 }), h0 = ssH(SS.clapAt);
    const imgs = [];
    for (let ix = -2; ix <= 2; ix++) for (let iy = -1; iy <= 1; iy++) for (let iz = -2; iz <= 2; iz++) {
      const order = Math.abs(ix) + Math.abs(iy) + Math.abs(iz); if (order > 3) continue;
      // (reflected across the walls: the image of v in the k-th mirror box along this axis)
      const img = (v, [a, b], k) => { const L = b - a; return k % 2 === 0 ? v + k * L : 2 * a - v + (k + 1) * L; };
      const q = [img(c0[0], B[0], ix), img(c0[1], B[1], iy), img(c0[2], B[2], iz)];
      imgs.push({ q, order, d: Math.hypot(q[0] - E[0], q[1] - E[1], q[2] - E[2]) });
    }
    for (const I of imgs) {
      const h1 = ssArriveH(h0, I.d), ta = SS.clapAt + (h1 - h0) * 3600; if (ta > SS.five - 0.3) continue;
      const pan = MathX.clamp((I.q[0] - E[0]) / Math.max(0.3, I.d), -1, 1) * 0.7, g = Math.pow(0.82, I.order) * 0.3 / Math.max(0.3, I.d);
      K.put(clap, ta, { vol: Math.min(1, g * 2.2), norm: true, pan, room, wet: 0.3 + 0.2 * I.order });
    }
    // (the room's later ringing: denser, very slowly fading, for the rest of the kitchen scenes)
    ssBed(K, SS.clapAt + 3, SS.five - 0.2, { colour: 'pink', f: [['bp', 1400, 0.9]], env: (u) => 0.5 + 0.5 * Math.exp(-u * 0.6), vol: 0.045, fi: 3, fo: 0.3, am: 0.6, wr: 1.5 });
  }
  // the earbuds: a song a centimetre from your eardrum, perfectly normal
  {
    const t0 = SS.earbuds + 0.6, d = SS.five - t0 + 0.2, n = Math.ceil(d * sr), y = fx.arr(d), mel = ['A4', 'C#5', 'E5', 'F#5', 'E5', 'C#5', 'B4', 'A4'], ch = [['A2', 'E3'], ['F#2', 'C#3'], ['D2', 'A2'], ['E2', 'B2']];
    for (let k = 0; k * 0.3 < d; k++) { const i0 = Math.round(k * 0.3 * sr), p = fx.pianoBuf(ssMidi(mel[k % 8])); for (let i = 0; i < 0.6 * sr && i0 + i < n && i < p.length; i++) y[i0 + i] += 0.5 * p[i];
      if (k % 4 === 0) for (const nn of ch[(k >> 2) % 4]) { const b = fx.pianoBuf(ssMidi(nn)); for (let i = 0; i < 1.2 * sr && i0 + i < n && i < b.length; i++) y[i0 + i] += 0.35 * b[i]; } }
    for (let i = 0; i < n; i++) y[i] *= Math.min(1, i / (0.3 * sr), (n - i) / (0.5 * sr));
    K.putLR(y, y, t0, { vol: 0.09, norm: true });
  }
  // 5 PM the cat: she meows as she sets off; she reaches you first, then the meow (from 3.2 m at 33 cm/s)
  {
    const you = [0.4, 0.62, -2.85], c = SS_GD.cat0, d = Math.hypot(c[0] - you[0], 0.26 - you[1], c[2] - you[2]);
    ssHeardStill(K, ssMeow(fx, { d: 0.8, f0: [520, 760, 430] }), SS.meow, d, { put: { vol: 0.25, norm: true, pan: -0.1 }, w0: SS.five, w1: SS.storm });
  }
  // your hum: the air in your mouth is far too slow to carry it, but your skull isn't: a buzz you hear from inside
  {
    const t0 = ssCap('hum', 0).show + 0.4, d = 3.6, n = Math.ceil(d * sr), y = fx.arr(d); let ph = 0;
    for (let i = 0; i < n; i++) { const t = i / sr; ph += 2 * Math.PI * 110 / sr; y[i] = (Math.sin(ph) + 0.4 * Math.sin(2 * ph) + 0.2 * Math.sin(3 * ph)) * Math.min(1, t / 0.3, (d - t) / 0.6); }
    SSX.bq(y, 'lp', 400, 0.7, sr); K.putLR(y, y, t0, { vol: 0.06, norm: true });
  }
});

ssSound('sfx', 'night', function (ctx, bus, K) {
  const { fx, sr } = K;
  // the music box: its tune is the film's theme. It plays from 22:00:00 (6.4 s); each note reaches you 3 m away when
  // its sound has crawled there: from 22:04:55, a little lower (×0.94) and slower than it left
  {
    const E = SS_K.ear, B = SS_K.box, d = Math.hypot(B[0] - E[0], B[1] + 0.07 - E[1], B[2] - E[2]);
    for (const [b, nn] of SS_TUNE) {
      const tone = fx.hit([[ssHz(nn), 1.1, 1], [ssHz(nn) * 3.9, 0.25, 0.25], [ssHz(nn) * 8.2, 0.08, 0.1]], { width: 0.0003, len: 2.5 });
      ssHeardStill(K, tone, SS.boxGo + b * SS_TUNE_BEAT, d, { put: { vol: 0.08, norm: true, pan: 0.35 }, w0: SS.wait, w1: SS.midnight });
    }
  }
  // 6 PM the storm: rain on the window and the patio (near enough to reach you); the lightning: no thunder, ever
  ssBed(K, SS.storm - 0.2, SS.eight2 - 0.4, { colour: 'pink', f: [['hp', 900], ['lp', 7000]], vol: 0.035, fi: 1.0, fo: 1.0, am: 0.25, wr: 0.8 });
  { const r = new RNG(61); for (let t = SS.storm; t < SS.eight2 - 0.6; t += 0.03 + 0.08 * r.next()) K.put(fx.hit([[r.range(2500, 5000), 0.006, 1]], { width: 0.0002 }), t, { vol: 0.006 + 0.012 * r.next(), pan: r.range(-0.8, 0.8) }); }
  // the heartbeat: it travels through you, not the air
  for (let t = SS.beat; t < SS.real - 0.3; t += 0.92) {
    const lub = fx.hit([[48, 0.05, 1], [70, 0.03, 0.5]], { width: 0.012 }), dub = fx.hit([[58, 0.04, 1], [90, 0.02, 0.4]], { width: 0.009 });
    const k = Math.min(1, (t - SS.beat) / 2.5);
    K.put(lub, t, { vol: 0.4 * k, norm: true }); K.put(dub, t + 0.3, { vol: 0.28 * k, norm: true });
  }
  // is it real: a fresh mug of hot chocolate. Tap it: bubbly liquid carries sound slowly, so it clinks low; as the
  // bubbles clear the clinks climb (the "hot chocolate effect")
  for (let t = SS.real3 + 1.1, i = 0; t < SS.real4 - 0.3; i++, t += 0.42) {
    const u = MathX.clamp((t - SS.real3 - 1.1) / (SS.real4 - SS.real3 - 1.5), 0, 1), s = 0.45 + 0.55 * Math.pow(u, 0.7);
    K.put(fx.hit(fx.cupModes(s), { width: 0.0004 }), t, { vol: 0.1, norm: true, pan: 0.15 });
  }
  // the question: the morning's birds again, ordinary sound
  for (const [dt, f0, pan] of [[0.6, 3600, 0.5], [2.4, 4100, -0.6], [4.4, 2400, -0.3], [5.6, 3300, 0.7]]) K.put(ssChirp(fx, { f0 }), SS.question + dt, { vol: 0.07, pan });
});
