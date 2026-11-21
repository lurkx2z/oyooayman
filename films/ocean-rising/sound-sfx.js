/* =====================================================================
   SOUND · SFX — the events, each at its story moment (heard once: the story clock only runs forward). The texts
   chime when they arrive; the boat's line creaks and the boat floods; the radio's calls for help (and yours); the bell buoy close
   up, until its chain runs out; the fog signal's last blast; the sea under the house's door; the tower's door shut,
   bolted, straining, bursting; the power room's sparks; the stairs; the watch room's radio
   dying; the ladder; the lamp going under; your phone's low battery.
   ===================================================================== */

ocSound('sfx', 'events', function (ctx, bus, K) {
  const { fx, sr } = K, r = new RNG(CONFIG.seed + 4242), E = OCE, P = OCP, T = OC_F.tower, F = ocFilmAt, S = ocStoryAt;
  const shot = (mode) => OC_SHOTS.find((x) => x.mode === mode);
  const room = K.verb('sroom', 1.0, { bright: 0.5, damp: 3.4, shape: 2.0, early: [[0.011, 0.5], [0.019, 0.35]], wet: 0.45 });
  const shaft = K.verb('sshaft', 3.4, { bright: 0.42, damp: 2.1, shape: 1.6, early: [[0.021, 0.5], [0.043, 0.4], [0.067, 0.3]], wet: 0.6 });
  const outside = K.verb('sout', 1.6, { bright: 0.5, damp: 4.5, shape: 2.5, wet: 0.25 });
  const put = (y, t, vol, o = {}) => { if (t == null || !y) return; const pk = OCX.peak(y) || 1; K.put(y, t, Object.assign({ vol: vol / pk }, o)); };
  const noiseBuf = (d, colour, filters) => { const y = ocNoise(fx, Math.ceil(d * sr), colour); for (const [ty, f, q] of filters) OCX.bq(y, ty, f, q || 0.7, sr); return y; };
  const env = (y, f) => { for (let i = 0; i < y.length; i++) y[i] *= f(i / sr, i / y.length); return y; };
  const inShot = (t, mode) => { const sh = shot(mode); return sh && t >= sh.t0 && t < sh.t1; };

  // ---- the phone: Isla's texts arrive (a soft two-note chime and the buzz), yours go (taps, then the swoosh)
  const chime = () => { const a = fx.beep(1318.5, 0.11), b = fx.beep(1760, 0.16), y = new Float32Array(Math.ceil(0.5 * sr)); for (let i = 0; i < a.length; i++) y[i] += a[i] * 0.8; const o = Math.round(0.12 * sr); for (let i = 0; i < b.length && o + i < y.length; i++) y[o + i] += b[i]; for (let i = 0; i < y.length; i++) y[i] *= Math.exp(-i / (0.3 * sr)) * 0.9 + 0.1; OCX.bq(y, 'lp', 5000, 0.7, sr); return y; };
  const buzz = (d = 0.38) => { const y = fx.arr(d); for (let i = 0; i < y.length; i++) { const t = i / sr; y[i] = (Math.sin(2 * Math.PI * 165 * t) + 0.5 * Math.sign(Math.sin(2 * Math.PI * 165 * t))) * Math.min(1, t / 0.01, (d - t) / 0.03); } OCX.bq(y, 'lp', 900, 0.7, sr); return y; };
  const tap = () => { const y = fx.hit([[r.range(2400, 3200), 0.006, 1], [r.range(900, 1300), 0.01, 0.5]], { width: 0.0003, len: 0.05 }); return y; };
  const swoosh = () => { const d = 0.35, y = noiseBuf(d, 'white', []); const yy = ocSweep(y, sr, 'bandpass', 2.5, [900, 2400, 4200, 5200]); return env(yy, (t) => Math.sin(Math.PI * t / d)); };
  for (const [s, who] of OC_TEXTS) {
    const t = ocSeen(s); if (t == null) continue;
    if (who === 'isla') { put(chime(), t, 0.22, { pan: 0.1 }); put(buzz(), t + 0.02, 0.12); }
    else { for (let k = 0, tt = t - 1.7; tt < t - 0.25; tt += r.range(0.07, 0.16), k++) put(tap(), tt, r.range(0.05, 0.09), { pan: r.range(-0.15, 0.15) }); put(swoosh(), t - 0.05, 0.1, { pan: 0.2 }); }
  }

  // ---- the boat: the bow line taking the strain, the bow held down as the sea climbs over it, the boat going under
  { const t0 = F(E.taut) - 0.3, t1 = F(E.sunk), rope = [[310, 0.08, 1], [620, 0.05, 0.5], [890, 0.04, 0.35], [1450, 0.02, 0.2]];
    for (let t = t0; t < t1 - 0.4; t += r.range(0.5, 1.1)) { const u = MathX.clamp((t - t0) / (t1 - t0), 0, 1), y = fx.creak(r.range(0.35, 0.8), rope, { rate: [18 + 30 * u, 60 + 60 * u] }); put(y, t, (0.1 + 0.18 * u) * (inShot(t, 'rope') ? 1.3 : 1), { pan: -0.2, room: outside, wet: 0.4 }); }
    // the hull groaning
    for (let t = F(E.flood) - 1.5; t < t1; t += r.range(1.0, 1.8)) { const y = fx.creak(r.range(0.8, 1.4), [[r.range(90, 120), 0.12, 1], [r.range(180, 230), 0.08, 0.6], [r.range(330, 400), 0.05, 0.3]], { rate: [12, 30] }); put(y, t, 0.16, { pan: 0.25, room: outside, wet: 0.3 }); }
    // the sea pouring in over the gunwale, then the boat going under (a deep glug, the air bubbling up)
    { const tf = F(E.flood), d = 3.4, y = fx.liquid(d, (t) => Math.min(1, t / 0.4) * Math.min(1, (d - t) / 0.8), { f: 480 }); put(y, tf, 0.3, { pan: 0.15 }); }
    { const ts = shot('sunk').t0 + 0.8, L = new Float32Array(Math.ceil(4 * sr)), R = new Float32Array(L.length);
      for (let t = 0; t < 3.6; t += r.range(0.03, 0.14) * (1 + t)) fx.bubble(L, R, Math.round(t * sr), r.range(110, 380) * (1 + t * 0.2), r.range(0.03, 0.08), 0.5 * Math.exp(-t / 1.6), r.range(-0.4, 0.4));
      const g = fx.hit([[52, 0.4, 1], [78, 0.3, 0.5]], { width: 0.03, len: 1.4 }); OCX.mixIn(L, R, g, 0, 0.6 / (OCX.peak(g) || 1), 0);
      const pk = OCX.peak(L, R) || 1; K.putLR(L, R, ts, { vol: 0.35 / pk }); } }

  // ---- you run up the path from the landing (on rock, then grass)
  { const sh = shot('path'); for (let t = sh.t0 + 0.2, k = 0; t < sh.t1 - 0.1; t += r.range(0.33, 0.38), k++) put(fx.step({ weight: 0.8, scuff: 0.2, body: 70 }), t, 0.14 * (0.7 + 0.3 * Math.sin(k)), { pan: -0.3 + 0.03 * k, room: outside, wet: 0.3 }); }

  // ---- the coastguard radio: every harbour on the coast calling for help (static, squelch, garbled voices)
  { const a = shot('radio').t0 - 0.1, b = shot('window').t1, d = b - a;
    const st = ocStatic(fx, d, { f: 1500 }); for (let i = 0; i < st.length; i++) { const t = a + i / sr; st[i] *= inShot(t, 'window') ? 0.45 : 1; }
    put(st, a, 0.05, { room, wet: 0.3 });
    for (let t = a + 0.5; t < b - 1.2; t += r.range(2.0, 3.4)) {
      const vd = r.range(1.3, 2.4), y = ocRadioVoice(fx, vd, { up: r.range(0.9, 1.25) }), k = inShot(t, 'window') ? 0.45 : 1;
      const sq = fx.hit([[2200, 0.01, 1]], { width: 0.0003, noise: 1.2, nlen: 0.03, nhp: 1200, len: 0.06 });
      put(sq, t - 0.06, 0.05 * k); put(y, t, 0.14 * k, { pan: r.range(-0.1, 0.1), room, wet: 0.3 }); put(sq, t + vd + 0.02, 0.05 * k);
    }
    // you call too: the handset's key (a click), your call, its release; nobody answers
    { const tc = ocC('radio', 1) - 0.4, key = fx.hit([[1800, 0.004, 1], [640, 0.01, 0.6]], { width: 0.0002, noise: 0.6, nlen: 0.01, nhp: 2000, len: 0.04 });
      put(key, tc, 0.09, { pan: -0.1 }); put(key, tc + 2.2, 0.08, { pan: -0.1 });   // (ocC: the caption's time)
      put(fx.hit([[2200, 0.01, 1]], { width: 0.0003, noise: 1.2, nlen: 0.05, nhp: 1200, len: 0.08 }), tc + 2.25, 0.07); } }

  // ---- the bell buoy, close (through the long lens): it rings as it rolls on the swell; its chain runs out and the
  //      sea pulls it under: the bell's last stroke, choked; the air bubbling up out of its float
  { const sh = shot('buoy'), tB = F(E.bell), modes = [[512, 2.2, 1], [1229, 1.4, 0.55], [1690, 0.9, 0.4], [2470, 0.6, 0.25], [3420, 0.35, 0.12]];
    for (let t = sh.t0 + 0.2; t < tB - 0.2; t += r.range(1.1, 2.0)) put(fx.hit(modes.map(([f, tau, a]) => [f * r.range(0.997, 1.003), tau, a]), { width: 0.0008, len: 5 }), t, r.range(0.11, 0.16), { pan: 0.05, room: outside, wet: 0.5 });
    { const y = fx.hit(modes.map(([f, tau, a]) => [f, tau * 0.35, a]), { width: 0.0012, len: 3 }); OCX.bq(y, 'lp', 1400, 0.7, sr); put(y, tB + 0.25, 0.2, { room: outside, wet: 0.6 }); }
    { const L = new Float32Array(Math.ceil(3 * sr)), R = new Float32Array(L.length); for (let t = 0; t < 2.6; t += r.range(0.03, 0.12)) fx.bubble(L, R, Math.round(t * sr), r.range(140, 420), r.range(0.03, 0.07), 0.4 * Math.exp(-t / 1.0), r.range(-0.3, 0.3)); const pk = OCX.peak(L, R) || 1; K.putLR(L, R, tB + 0.35, { vol: 0.12 / pk }); } }

  // ---- the fog signal: one blast (the regular one), then its last, choking as the sea floods its compressor
  { const sh = shot('fogHouse'), y = ocFoghorn(fx, 2.6, 96); put(y, sh.t0 + 1.2, 0.5, { room: outside, wet: 0.7 }); }
  { const sh = shot('horn'), tl = Math.max(sh.t0 + 0.25, F(E.fogLast) - 2.4), y = ocFoghorn(fx, Math.min(3.0, sh.t1 - tl - 0.3), 96, { choke: 1 }); put(y, tl, 0.62, { room: outside, wet: 0.6 }); }

  // ---- your house: the sea coming in under the door (a trickle that spreads), then standing on the kitchen floor
  { const sh = shot('doorSeep'), d = sh.t1 - sh.t0 + 0.4, y = fx.liquid(d, (t) => Math.min(1, t / 0.8) * (0.5 + 0.5 * t / d), { f: 900 }); put(y, sh.t0 - 0.1, 0.14, { room, wet: 0.35 }); }
  { const sh = shot('kitchen'), d = sh.t1 - sh.t0 + 0.4, y = fx.liquid(d, (t) => 0.7 + 0.3 * Math.sin(t * 1.3), { f: 420 }); put(y, sh.t0 - 0.1, 0.12, { room, wet: 0.4 });
    // (a chair, afloat, knocking on the table leg)
    for (const dt of [1.3, 2.9, 3.6]) put(fx.hit(fx.woodModes(170, 0.8), { width: 0.002, len: 0.4 }), sh.t0 + dt, 0.12, { pan: -0.2, room, wet: 0.5 }); }

  // ---- the tower door: you shove it shut, slide the two bolts
  { const sh = shot('bolt'), t0 = sh.t0;
    const slam = fx.hit([[62, 0.25, 1], [96, 0.18, 0.7], [160, 0.1, 0.5], [270, 0.06, 0.3]], { width: 0.004, len: 1.6, noise: 0.5, nlen: 0.02, nhp: 600 }); put(slam, t0 + 0.32, 0.6, { room: shaft, wet: 0.7 });
    const latch = fx.clamp({ pitch: 0.7 }); put(latch, t0 + 0.36, 0.2, { room: shaft, wet: 0.5 });
    for (const tb of [t0 + 1.4, t0 + 2.2]) { const sc = fx.rustle(0.3, { density: 900, rub: 0.6, lo: 1200, hi: 6000, grain: 0.004, peak: 2600 }); put(sc, tb, 0.12, { room: shaft, wet: 0.4 }); put(fx.clamp({ pitch: 0.55 }), tb + 0.3, 0.3, { room: shaft, wet: 0.6 }); } }

  // ---- the door straining: oak groaning on its bolts, the sea hissing through every seam, spraying the floor
  { const sh = shot('strain'), a = shot('bolt').t1 - 1.5, b = F(E.burst), d = b - a;
    const hs = noiseBuf(d, 'white', [['bp', 3300, 0.6], ['lp', 9000]]); env(hs, (t) => Math.min(1, t / 1.2) * (0.55 + 0.45 * t / d)); put(hs, a, 0.12, { room: shaft, wet: 0.3 });
    const sp = noiseBuf(d, 'pink', [['lp', 1600], ['hp', 120]]); const wv = fx.wander(2); env(sp, (t) => Math.min(1, t / 1.5) * (0.7 + 0.3 * wv(t))); put(sp, a, 0.13, { room: shaft, wet: 0.4 });
    for (let t = sh.t0 - 0.5; t < b - 0.3; t += r.range(0.8, 1.6)) { const u = (t - a) / d, y = fx.creak(r.range(0.6, 1.3), [[r.range(70, 95), 0.15, 1], [r.range(140, 180), 0.1, 0.7], [r.range(260, 320), 0.06, 0.4]], { rate: [8, 22] }); put(y, t, 0.2 + 0.25 * u, { room: shaft, wet: 0.6 }); }
    for (let t = sh.t0 + 0.8; t < b - 0.5; t += r.range(1.5, 2.6)) put(fx.clamp({ pitch: 0.5 }), t, 0.1, { room: shaft, wet: 0.5 }); }

  // ---- it gives: the oak splits, the door slams into the wall, the sea comes in (a roar that becomes a churn)
  { const tb = F(E.burst);
    const sm = fx.smash({ v: 7, g: 9.8, pitch: 0.32, len: 2.4 }); { const pk = OCX.peak(sm.L, sm.R) || 1; K.putLR(sm.L, sm.R, tb, { vol: 0.5 / pk, room: shaft, wet: 0.5 }); }
    const crack = fx.hit([[48, 0.6, 1], [73, 0.45, 0.7], [118, 0.25, 0.5], [190, 0.12, 0.3]], { width: 0.006, len: 2.5, noise: 0.8, nlen: 0.04, nhp: 400 }); put(crack, tb, 0.85, { room: shaft, wet: 0.7 });
    put(fx.hit([[55, 0.3, 1], [88, 0.2, 0.6], [150, 0.1, 0.4]], { width: 0.004, len: 1.2, noise: 0.4, nlen: 0.02, nhp: 500 }), tb + 0.42, 0.5, { pan: 0.3, room: shaft, wet: 0.7 });
    const d = 7.5, ro = ocNoise(fx, Math.ceil(d * sr), 'brown'), ro2 = ocNoise(fx, Math.ceil(d * sr), 'pink');
    const rf = ocSweep(ro2, sr, 'lowpass', 0.6, [300, 2600, 2200, 1500, 1100, 900, 800, 750]);
    for (let i = 0; i < ro.length; i++) { const t = i / sr, e = Math.min(1, t / 0.08) * (0.45 + 0.55 * Math.exp(-t / 2.5)) * Math.min(1, (d - t) / 1.5); ro[i] = (ro[i] * 0.8 + rf[i] * 1.2) * e; }
    put(ro, tb + 0.02, 0.75, { room: shaft, wet: 0.5 }); }

  // ---- the power room floods: sparks, a fizzing panel, the lights' breaker thumps out
  { const td = F(E.dark), d = 2.2, y = fx.arr(d);
    for (let t = 0; t < d - 0.05; t += r.range(0.01, 0.09)) { const i0 = Math.round(t * sr), a = r.range(0.3, 1) * (t < 0.6 ? 1 : Math.exp(-(t - 0.6) / 0.5)); for (let j = 0; j < 0.012 * sr && i0 + j < y.length; j++) y[i0 + j] += a * (r.next() * 2 - 1) * Math.exp(-j / (0.002 * sr)); }
    OCX.bq(y, 'hp', 1500, 0.7, sr); put(y, td - 0.6, 0.3, { pan: 0.35, room: shaft, wet: 0.4 });
    const hum = fx.arr(0.65); for (let i = 0; i < hum.length; i++) { const t = i / sr; hum[i] = Math.sign(Math.sin(2 * Math.PI * 120 * t)) * 0.3 * (0.6 + 0.4 * Math.sin(t * 90)) * Math.min(1, (0.65 - t) / 0.01); } OCX.bq(hum, 'lp', 2500, 0.7, sr); put(hum, td - 0.62, 0.12, { pan: 0.35, room: shaft, wet: 0.3 });
    put(fx.hit([[70, 0.12, 1], [140, 0.06, 0.5], [900, 0.01, 0.3]], { width: 0.002, len: 0.6, noise: 0.6, nlen: 0.01, nhp: 1500 }), td, 0.35, { pan: 0.35, room: shaft, wet: 0.7 }); }

  // ---- up the stairs: your boots on the stone steps, two at a time, the torch rattling; the sea in the shaft below
  for (const mode of ['stairsDown', 'climb']) { const sh = shot(mode); for (let t = sh.t0 + 0.15, k = 0; t < sh.t1 - 0.1; t += r.range(0.3, 0.36), k++) { put(fx.step({ weight: 0.9, s: 1.25, body: 95, scuff: 0.1 }), t, 0.16 * (k % 2 ? 0.85 : 1), { pan: k % 2 ? 0.15 : -0.15, room: shaft, wet: 0.55 }); } }
  // (at the top: two hard breaths, no more)
  { const sh = shot('climb'); for (const [dt, inh] of [[-1.5, true], [-0.95, false]]) put(fx.breath(inh ? 0.45 : 0.4, { inhale: inh, voice: 0.08, f0: 120 }), sh.t1 + dt, 0.07, { room: shaft, wet: 0.3 }); }

  // (no ship's horn: the ship is 25 km out, too far to hear)
  // ---- you call the ship on the watch room's radio: your key, the squelch; this time somebody answers
  { const sh = shot('watchRadio'), tc = sh.t0 + 0.3, key = fx.hit([[1800, 0.004, 1], [640, 0.01, 0.6]], { width: 0.0002, noise: 0.6, nlen: 0.01, nhp: 2000, len: 0.04 });
    const sq = () => fx.hit([[2200, 0.01, 1]], { width: 0.0003, noise: 1.2, nlen: 0.05, nhp: 1200, len: 0.08 });
    put(ocStatic(fx, sh.t1 - sh.t0 + 0.3, { f: 1500 }), sh.t0 - 0.05, 0.035, { room, wet: 0.3 });
    put(key, tc, 0.09, { pan: -0.1 }); put(key, tc + 1.3, 0.08, { pan: -0.1 }); put(sq(), tc + 1.35, 0.06);
    const vd = Math.min(2.0, sh.t1 - tc - 2.0), y = ocRadioVoice(fx, vd, { up: 0.95 }); put(sq(), tc + 1.75, 0.06); put(y, tc + 1.8, 0.16, { pan: 0.05, room, wet: 0.3 }); put(sq(), tc + 1.8 + vd + 0.02, 0.06); }

  // ---- the watch room: the radio dies (its static swells, it fizzes, it's gone); the sea welling up the stairs
  { const sh = shot('watchFlood'), tr = F(E.watch + 1), a = sh.t0 - 0.05;
    if (tr > a) { const st = ocStatic(fx, tr - a + 0.05, { f: 1800 }); env(st, (t, u) => 0.4 + 0.6 * u); put(st, a, 0.09, { room, wet: 0.3 }); }
    { const y = fx.arr(0.35); for (let i = 0; i < y.length; i++) { const t = i / sr; y[i] = (r.next() * 2 - 1) * Math.exp(-t / 0.08) + Math.sin(2 * Math.PI * 55 * t) * Math.exp(-t / 0.05) * 0.8; } OCX.bq(y, 'lp', 4000, 0.7, sr); put(y, tr, 0.22, { room, wet: 0.4 }); }
    { const d = sh.t1 - sh.t0 + 0.3, y = fx.liquid(d, (t) => Math.min(1, t / 0.3), { f: 360 }); put(y, sh.t0, 0.2, { pan: 0.3, room, wet: 0.4 }); } }

  // ---- the ladder: iron rungs under your hands and boots
  { const sh = shot('ladder'); for (let t = sh.t0 + 0.3, k = 0; t < sh.t1 - 0.2; t += 0.55, k++) { put(fx.hit(fx.metalModes(r.range(780, 900), 0.35), { width: 0.0006, len: 0.6 }), t, 0.12, { pan: k % 2 ? 0.3 : -0.3, room, wet: 0.4 }); put(fx.step({ weight: 0.5, s: 1.8, body: 120 }), t + 0.27, 0.1, { pan: k % 2 ? -0.2 : 0.2, room, wet: 0.4 }); } }

  // ---- the lamp goes under: the sea closes over the lens (a deep gulp, the air streaming up out of the lantern)
  { const tl = F(E.lamp); put(fx.hit([[44, 0.7, 1], [66, 0.5, 0.6], [99, 0.3, 0.3]], { width: 0.03, len: 2.5 }), tl, 0.45, { room, wet: 0.5 });
    const L = new Float32Array(Math.ceil(4.5 * sr)), R = new Float32Array(L.length); for (let t = 0; t < 4.0; t += r.range(0.02, 0.08)) fx.bubble(L, R, Math.round(t * sr), r.range(160, 600), r.range(0.02, 0.06), 0.45 * Math.exp(-t / 1.8), r.range(-0.6, 0.6));
    const pk = OCX.peak(L, R) || 1; K.putLR(L, R, tl + 0.1, { vol: 0.2 / pk }); }

  // ---- your phone: 4% (the low-battery chime, falling)
  { const sh = shot('phoneLow'), t = sh.t0 + 1.0, a = fx.beep(880, 0.14), b = fx.beep(659.3, 0.22), y = new Float32Array(Math.ceil(0.6 * sr)); y.set(a, 0); y.set(b.subarray(0, Math.min(b.length, y.length - Math.round(0.17 * sr))), Math.round(0.17 * sr)); OCX.bq(y, 'lp', 4000, 0.7, sr); put(y, t, 0.18, { pan: 0.05 }); }
});
