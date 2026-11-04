/* =====================================================================
   SOUND · EFFECTS — the events, each at its story second (the clock only runs forward, so each is heard once). In
   slow motion an event's sound is stretched and pitched down with it (at most 4×).
     before 2:00   the radio on your sill, the water into your glass, the clock's tick, the cat's claws
     2:00          everything cut dead. Sound is air moving: from here to 2:00:03 the only sounds are inside you (your
                   heartbeat through your bones, the blood in your ears, a faint ringing) and the score
     2:00:03       the air rushing back, your gasp and everyone's, the water into the glass, the cat landing, the first
                   stroke of the church bell arriving at half strength, the radio coming back (slowed)
     the park      the girl's landing, the ball's bounces, the runner going over, the swing's chains, the bike going down
     after         the bell's second stroke; a car's starter that won't catch, its hazards ticking; planes far off; the
                   radio again at the end
   ===================================================================== */

saSound('sfx', 'events', function (ctx, bus, K) {
  const { fx, sr } = K, f = saFilmAt, L = SA.tLock, R = SA.tRelease, B = saB, c = saC;
  const room = K.verb('room', 0.5, { bright: 0.6, damp: 3.5, wet: 0.25 }), street = K.verb('street', 1.8, { bright: 0.5, damp: 2.0, wet: 0.32 });
  const slow = (t) => 1 / Math.max(0.25, saRateAt(t + 1e-3));
  const sm = (modes, k) => modes.map(([fr, tau, a]) => [fr / Math.sqrt(k), tau * Math.sqrt(k), a]);
  const inside = saPlaceAt('in');
  const whoosh = (t, d, o = {}) => { const n = Math.ceil(d * sr), w = saNoise(fx, n, 'pink'); for (let i = 0; i < n; i++) { const u = i / n; w[i] *= Math.sin(Math.PI * Math.pow(u, o.skew || 0.5)) ** 2; }
    saSweepPut(K, w, t, 'bandpass', o.q || 1.1, o.curve || [500, 1400, 2600], { vol: o.vol || 0.12, pan: o.pan || 0 }); };
  const thud = (t, k, v, pan = 0, o = {}) => K.put(fx.slap(sm([[o.f || 70, 0.07, 1], [(o.f || 70) * 2.3, 0.04, 0.5], [(o.f || 70) * 5, 0.02, 0.2]], k), { width: 0.008, amp: 0.9, skin: 0.2, len: 0.7 * k }), t, { vol: v, pan, room: o.room || street, wet: 0.3 });
  const voice = (t, d, v, pan, o = {}) => K.put(fx.breath(d, { voice: o.voice ?? 0.6, f0: o.f0 || 220, inhale: !!o.inhale, env: o.env }), t, { vol: v, pan, room: o.room || street, wet: 0.35, lp: o.lp || 5000 });

  // ================================================================== before 2:00 (real speed, then the slow-motion jump)
  // the radio (its song, which carries on inside it all through the three seconds)
  const SONG0 = 20;
  K.put(saRadioSong(fx, L + 0.6), 0, { vol: 0.2, norm: true, pan: 0.35, room, wet: 0.2, stop: L, fade: 0.004 });
  // the water from the jug into your glass
  K.put(fx.liquid(L + 0.3, (t) => Math.min(1, t / 0.05) * (0.85 + 0.15 * Math.sin(t * 7)), { f: 820 }), 0, { vol: 0.24, norm: true, room, wet: 0.2, pan: 0.1, stop: L, fade: 0.004 });
  // the clock's last ticks
  for (const s of [-3, -2, -1]) { const t = f(s); if (t > 0.05) K.put(fx.hit(fx.woodModes(2200, 0.6), { width: 0.0002, amp: 0.6, len: 0.15 }), t, { vol: 0.06, pan: 0.6, room, wet: 0.3 }); }
  // the cat's claws on the table as it goes (in slow motion)
  K.put(fx.rustle(0.4, { density: 500, rub: 0.15, lo: 1200, hi: 6000, grain: 0.005, env: (u) => Math.exp(-u * 4) }), f(SA.sJump) - 0.08, { vol: 0.08, pan: -0.25, room, wet: 0.3 });

  // ================================================================== 2:00 → 2:00:03: only what's inside you
  // the blood in your ears and a faint ringing, fading in as the silence goes on
  saBed(K, L + 0.05, R, { colour: 'brown', f: [['lp', 140]], vol: 0.12, am: 0.35, wr: 0.9, fi: 1.5, fo: 0.02 });
  saTone(K, L + 0.4, R - L - 0.4, 6200, [[1, 1], [1.004, 0.6]], (u, t) => Math.min(1, t / 12) * Math.min(1, (R - L - 0.4 - t) / 0.02), { vol: 0.012, pan: 0 });
  // your heartbeat (once in a long while: the three seconds hold four beats)
  for (const s of [0.452, 1.302, 2.151]) { const t = f(s);
    const lub = fx.hit([[42, 0.32, 1], [67, 0.2, 0.5], [110, 0.08, 0.2]], { width: 0.02, amp: 1, len: 1.6 }), dub = fx.hit([[50, 0.24, 1], [84, 0.15, 0.45], [140, 0.06, 0.15]], { width: 0.015, amp: 1, len: 1.3 });
    K.put(lub, t, { vol: 0.62, norm: true, lp: 260 }); K.put(dub, t + 0.85, { vol: 0.45, norm: true, lp: 260 }); }

  // ================================================================== 2:00:03 (slow motion ×0.05, then the park ×0.2)
  // the air rushing back in, your gasp, everyone's (outside, through the window)
  whoosh(R - 0.05, 3.2, { vol: 0.22, curve: [180, 600, 1400, 900], skew: 0.3, q: 0.8 });
  K.put(fx.breath(3.6, { inhale: true, voice: 0.08, f0: 160 }), R + 0.35, { vol: 0.42, norm: true, room, wet: 0.2, lp: 3800 });
  for (let i = 0; i < 9; i++) voice(R + 0.6 + 0.9 * fx.r.next(), 2.2 + fx.r.next(), 0.07, fx.r.range(-0.8, 0.8), { inhale: true, voice: 0.3, f0: fx.r.range(140, 320), lp: 2400 });
  // the water: the stream that was in the air drops into the glass; the jug pours again
  { const t = f(SAP.T + 0.12), k = slow(t); K.put(fx.liquid(2.6, (x) => Math.min(1, x / 0.05) * Math.exp(-x / 1.4), { f: 820 / Math.sqrt(k) }), t, { vol: 0.24, norm: true, room, wet: 0.3, pan: 0.1 }); }
  // the cat lands on the floor (from 46 cm, from rest)
  { const t = f(SAP.T + Math.sqrt(2 * 0.46 / SAP.g)), k = slow(t); thud(t, k, 0.3, -0.3, { f: 95, room }); K.put(fx.rustle(0.5 * k, { density: 400, rub: 0.2, lo: 1500, hi: 6000, grain: 0.004, env: (u) => Math.exp(-u * 3) }), t + 0.02, { vol: 0.07, room, wet: 0.3, pan: -0.3 }); }
  // the bell's first stroke (2:00), caught in the air on its way: half of it arrives now, at half strength
  { const t = f(3.144), k = slow(t); K.put(saBellStroke(fx, { k, f: 233 }), t, { vol: 0.32, norm: true, pan: 0.5, room: street, wet: 0.5, lp: 3000 }); }
  // the radio comes back (slowed with everything else), and later plays on at the end
  K.put(saRadioSong(fx, B('fall') - R + 0.5, { offset: SONG0 + L + SAP.T }), R + 0.2, { vol: 0.12, norm: true, pan: 0.35, room, wet: 0.2, rate: 0.3, fadeIn: 1.5, stop: B('fall') + 0.02, fade: 0.1 });
  // the park, falling from rest (heard 4× slow, an octave down)
  { const t = f(SAP.T + Math.sqrt(2 * SA_CP.girl.y / SAP.g)); if (t > B('fall')) { thud(t, slow(t), 0.32, -0.2, { f: 80 }); voice(t + 0.1, 0.5 * slow(t), 0.08, -0.2, { f0: 300 }); } }
  { let s = SAP.T + Math.sqrt(2 * SA_BALL.p[1] / SAP.g), v = Math.sqrt(2 * SAP.g * SA_BALL.p[1]);
    for (let i = 0; i < 6 && v > 0.6; i++) { const t = f(s); if (t > B('fall') && t < B('echo')) K.put(fx.slap(sm([[150, 0.05, 1], [340, 0.03, 0.5], [900, 0.012, 0.25]], slow(t)), { width: 0.005, amp: 0.8, skin: 0.4, len: 0.6 }), t, { vol: 0.22 * v / 9, pan: 0.3, room: street, wet: 0.3 }); v *= 0.62; s += 2 * v / SAP.g; } }
  { const s = SAP.T + 0.14 + Math.acosh(1.42 / SA_RUNP.th0) / Math.sqrt(SAP.g / SA_RUNP.L), t = f(s); thud(t, slow(t), 0.4, 0.15, { f: 62 }); voice(t + 0.05, 0.6 * slow(t), 0.1, 0.15, { f0: 140 }); }
  { const Bk = SA_BIKE, s = SAP.T + Math.acosh(1.36 / Bk.lean) / Math.sqrt(SAP.g / Bk.L), t = f(s), k = slow(t);
    thud(t, k, 0.38, -0.1, { f: 66 });
    for (let i = 0; i < 7; i++) K.put(fx.hit(sm(fx.metalModes(fx.r.range(600, 1500), 0.4), k), { width: 0.0004, amp: 0.6, noise: 0.3, nlen: 0.004, len: 0.6 * k }), t + (0.01 + 0.25 * fx.r.next()) * k, { vol: 0.08, pan: fx.r.range(-0.4, 0.2), room: street, wet: 0.3 });
    voice(t + 0.1, 0.7 * k, 0.12, -0.1, { f0: 130 }); }
  for (const s of [SAP.T + SA_SWING.per / 2, SAP.T + SA_SWING.per]) { const t = f(s); if (t > B('fall') && t < B('echo')) K.put(fx.creak(1.2, sm(fx.metalModes(820, 0.5), slow(t)), { rate: [40, 90] }), t - 0.5, { vol: 0.06, pan: 0.4, room: street, wet: 0.3 }); }
  // a few cries across the park
  for (let i = 0; i < 6; i++) voice(B('fall') + 1 + 14 * fx.r.next(), 0.8 + 0.8 * fx.r.next(), 0.05, fx.r.range(-0.8, 0.8), { f0: fx.r.range(120, 340), lp: 2600 });

  // ================================================================== after (real speed)
  // the bell's second stroke (its hammer was stuck in the solid air of the belfry)
  K.put(saBellStroke(fx, { f: 233 }), f(SA_BELL.s2), { vol: 0.42, norm: true, pan: 0.5, room: street, wet: 0.55 });
  // 40 seconds later: a starter motor that won't catch (twice), the hazards ticking
  { const S = saShot('stallA'); for (const [t, d] of [[S.t0 + 1.6, 1.4], [S.t0 + 4.0, 2.0]]) { const n = Math.ceil(d * sr), y = new Float32Array(n); let ph = 0;
      for (let i = 0; i < n; i++) { const tt = i / sr, fr = 95 + 10 * Math.sin(tt * 2); ph += 2 * Math.PI * fr / sr; y[i] = (Math.sin(ph) + 0.4 * Math.sin(2 * ph) + 0.25 * Math.sign(Math.sin(3 * ph))) * (0.6 + 0.4 * Math.abs(Math.sin(Math.PI * tt * 5.2))) * Math.min(1, tt / 0.05, (d - tt) / 0.1); }
      SAX.bq(y, 'lp', 1800, 0.7, sr); K.put(y, t, { vol: 0.14, norm: true, pan: -0.1, room: street, wet: 0.2 }); }
    for (let t = S.t0 + 0.2; t < S.t1; t += 0.4) K.put(fx.hit(fx.woodModes(2600, 0.3), { width: 0.0002, amp: 0.5, len: 0.08 }), t, { vol: 0.03, pan: -0.1 }); }
  // the planes: a high, far rumble
  { const S = saShot('planes'); saBed(K, S.t0, Math.min(S.t1, SA.end), { colour: 'pink', f: [['bp', 420, 0.8], ['lp', 1200]], vol: 0.07, am: 0.4, wr: 0.15, fi: 2.0, fo: 0.3 }); }
  // the end: the radio playing on in your kitchen
  { const S = saShot('question'); K.put(saRadioSong(fx, SA.end - S.t0 + 0.5, { offset: SONG0 + L + saStoryAt(S.t0) }), S.t0, { vol: 0.1, norm: true, pan: 0.35, room, wet: 0.2, fadeIn: 0.6 }); }
  void inside;
});
