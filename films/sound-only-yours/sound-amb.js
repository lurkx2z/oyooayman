/* =====================================================================
   SOUND · AMBIENCE — the world, for its last 0.7 seconds: rain on your kitchen window, the news on the TV, the fridge,
   the cat purring on the counter, traffic far off. At 0.7 s (9:41:00 PM) all of it stops dead, mid-word.
   After that the world makes no sound at all; this stem only carries what is inside you:
     your body   a low rush (blood), almost nothing until "your body gets loud", a faint floor after it
     the ringing creeping in under "People inside it hear their own blood moving": a thin high tone (tinnitus), then a
                 faint thread that comes back up in every long silence (the thunder that never comes, the dark)
   The beds sit well under the score (mix.js; the owner's rule after days-shorter).
   ===================================================================== */

soSound('amb', 'world', function (ctx, bus, K) {
  const { fx, sr } = K, T = SO.tStop, cut = (u) => Math.min(1, (1 - u) * T / 0.004);   // (4 ms: dead, but no click)
  const room = K.verb('ambRoom', 0.5, { bright: 0.55, damp: 3.5, wet: 0.22, seed: 21 });
  // rain on the window (and drops on the sill), behind you on the right
  soBed(K, 0, T, { colour: 'pink', f: [['hp', 500], ['lp', 7500], ['peak', 2400, 0.8, 4]], vol: 0.6, am: 0.3, wr: 9, fi: 0.002, fo: 0.004 });
  for (let t = 0.02; t < T - 0.03; t += 0.03 + 0.06 * fx.r.next()) {
    const y = fx.hit([[fx.r.range(1800, 3600), 0.012, 1], [fx.r.range(4000, 6500), 0.006, 0.4]], { width: 0.0003, amp: 0.5, len: 0.06 });
    const n = Math.min(y.length, Math.ceil((T - t) * sr)); K.put(y.subarray(0, n), t, { vol: 0.05 + 0.05 * fx.r.next(), pan: fx.r.range(0.2, 0.9) });
  }
  // the news on the TV across the room: a newsreader's voice (glottal pulses through a moving vocal tract, in syllables)
  { const d = T, n = Math.ceil(d * sr), y = new Float32Array(n), r = fx.r, f0 = 112;
    let ph = 0; const syl = (t) => Math.pow(Math.max(0, Math.sin(Math.PI * 4.7 * t + 0.4)), 0.6) * (t > 0.31 && t < 0.37 ? 0.15 : 1);
    for (let i = 0; i < n; i++) { const t = i / sr; ph += f0 * (1 + 0.06 * Math.sin(2 * Math.PI * 1.3 * t) + 0.01 * (r.next() - 0.5)) / sr; if (ph >= 1) { ph -= 1; y[i] = 1; } }
    const out = new Float32Array(n), F = [[[520, 760, 640, 430], 5, 1], [[1500, 1150, 1800, 1300], 6, 0.55], [[2500, 2600, 2450, 2550], 7, 0.3]];
    for (const [fs, q, a] of F) { const z = soSweep(y, sr, 'bp', q, fs); for (let i = 0; i < n; i++) out[i] += z[i] * a; }
    const hiss = soNoise(fx, n, 'pink'); SOX.bq(hiss, 'bp', 3200, 2, sr);
    for (let i = 0; i < n; i++) { const t = i / sr; out[i] = (out[i] + 0.08 * hiss[i] * syl(t)) * syl(t) * Math.min(1, t / 0.01) * cut(t / d); }
    SOX.bq(out, 'hp', 180, 0.7, sr); SOX.bq(out, 'lp', 4200, 0.7, sr);                  // (a TV's small speakers)
    K.put(out, 0, { vol: 0.4, norm: true, pan: -0.45, room, wet: 0.8 }); }
  // the fridge's hum and the cat's purr
  soTone(K, 0, T, 50, [[1, 0.4], [2, 1], [3, 0.3], [4, 0.25]], (u, t) => Math.min(1, t / 0.01) * cut(u), { vol: 0.06, pan: -0.7 });
  { const n = Math.ceil(T * sr), y = soNoise(fx, n, 'brown'); for (let i = 0; i < n; i++) { const t = i / sr; y[i] *= (0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(2 * Math.PI * 26 * t), 3)) * Math.min(1, t / 0.01) * cut(t / T); }
    SOX.bq(y, 'lp', 600, 0.7, sr); SOX.bq(y, 'hp', 40, 0.7, sr); K.put(y, 0, { vol: 0.14, norm: true, pan: -0.55 }); }
  // the city through the glass: a low wash, a car passing on the wet street
  soBed(K, 0, T, { colour: 'brown', f: [['lp', 380], ['hp', 35]], vol: 0.38, am: 0.2, fi: 0.002, fo: 0.004 });
  soBed(K, 0, T, { colour: 'pink', f: [['bp', 900, 0.7], ['lp', 3000]], vol: 0.2, fi: 0.002, fo: 0.004, env: (u) => 0.4 + 0.6 * Math.sin(Math.PI * Math.min(1, u * 0.8)), mono: true, pan: 0.5 });
});

soSound('amb', 'inside', function (ctx, bus, K) {
  const T = SO.tStop, END = SO.end + 0.2, c = soC, B = soB;
  // your body: a low rush, pulsing faintly with your heart (the beds are peak-normalised: vol sets the loudest moment,
  // kept ~10 dB under the score). Level (0…1) over the film:
  const body = soCurve((t) => {
    let v = 0.06 * soEv(t, T + 1.5, T + 5);                                              // (barely: the room is dead silent)
    v += 0.55 * soWn(t, B('body') + 0.6, B('mum') - 0.6, 2.5, 2.5);                       // "your body gets loud" (still well under the score)
    v += 0.18 * soEv(t, B('mum') - 1.5, B('mum') + 1);                                    // ...and stays, a little
    v += 0.25 * soWn(t, SO.tTurn, B('street'), 0.2, 2.0);                                 // after the man on the stairs
    v += 0.3 * soEv(t, B('hide'), B('hide') + 3) + 0.35 * soEv(t, soC('who', 0), soC('who', 2));   // in the dark
    return v;
  });
  soBed(K, T + 0.2, END, { colour: 'brown', f: [['lp', 170], ['hp', 28]], vol: 0.36, am: 0.25, wr: 1.2, fi: 1, fo: 0.02, env: (u, t) => body(t) });
  soBed(K, T + 0.2, END, { colour: 'pink', f: [['bp', 320, 0.8], ['lp', 700]], vol: 0.086, am: 0.4, wr: 1.6, fi: 1, fo: 0.02, env: (u, t) => body(t) });
  // the ringing: two thin tones that waver; it creeps in while your body is loud (the quietest room on Earth), then
  // stays as a thread that comes back up in the long silences
  const R0 = c('body', 1) + 2.5;
  const ring = soCurve((t) => {
    let v = 0.7 * soEv(t, R0, R0 + 3.5) * (1 - 0.7 * soEv(t, B('mum'), B('mum') + 3));
    v += 0.25 * soWn(t, c('storm', 3) - 0.4, B('park') + 1.5, 0.6, 2.0);                 // the thunder that never comes
    v += 0.2 * soEv(t, B('hide'), B('hide') + 4) + 0.15 * soEv(t, soC('who', 2), SO.end);    // the dark
    return v;
  });
  soTone(K, R0, END - R0, (t) => 6720 + 40 * Math.sin(2 * Math.PI * 0.21 * t), [[1, 1], [1.5, 0.08]], (u, t) => ring(R0 + t) * Math.min(1, (END - R0 - t) / 0.02), { vol: 0.055, pan: 0.15 });
  soTone(K, R0 + 0.8, END - R0 - 0.8, (t) => 4180 + 25 * Math.sin(2 * Math.PI * 0.13 * t), [[1, 1]], (u, t) => ring(R0 + 0.8 + t) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 0.17 * t)) * Math.min(1, t / 1.5, (END - R0 - 0.8 - t) / 0.02), { vol: 0.03, pan: -0.2 });
  soBed(K, R0, END, { colour: 'white', f: [['bp', 7200, 3]], vol: 0.02, fi: 2.0, fo: 0.02, env: (u, t) => ring(t) });
});
