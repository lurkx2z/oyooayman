/* =====================================================================
   SOUND · AMB — the valley at dawn, and then only you.
   THE RULE (sound-lib.js): every sound of the world comes from something that is shrinking, so it rings higher: an
   octave up every 30 s (ekWorldRate). The beds' filters climb with it and fade as they pass the top of your hearing
   (ekAudible): first the low river and the wind in the spruce thin and brighten, then the birds become a fizz, then
   nothing. By 2:07 ("Every sound the valley makes is now too high for you to hear") the world is silent.
   Your own sounds stay where they are: your heartbeat (from the quiet on: "All you can hear is you"), your blood in
   your ears in the silence. (No breathing: the owner found it annoying.)
     the tent      the valley muffled through the fabric
     outside       the outflow over its rocks, the wind in the spruce, the dawn chorus (seeded, a few birds a second)
   ===================================================================== */

ekSound('amb', 'valley', function (ctx, bus, K) {
  const END = EK.end + 1, B = ekB;
  const inTent = ekCurve((t) => 1 - ekEv(t, B('out') + 0.4, B('out') + 1.6));
  // the river: brown noise round 300–900 Hz (climbing with the world), its level falling as it climbs out of hearing
  ekBedW(K, 0, B('quiet') + 3, { colour: 'brown', f: [['lowpass', 900, 0.7], ['highpass', 120, 0.7]], vol: 0.55, am: 0.25, wr: 0.2, fi: 0.5, fo: 1.5,
    env: (u, t) => (0.55 + 0.45 * (1 - inTent(t))) * ekAudible(t, 700) });
  // the wind in the spruce: pink noise round 1–2.5 kHz, slowly breathing
  ekBedW(K, 0, B('quiet') + 3, { colour: 'pink', f: [['bandpass', 1500, 0.6], ['highpass', 400, 0.7]], vol: 0.32, am: 0.5, wr: 0.15, fi: 0.5, fo: 1.5,
    env: (u, t) => (0.35 + 0.65 * (1 - inTent(t))) * ekAudible(t, 2200) });
  // the tent's fabric between you and it (inside only: a low, close hush)
  ekBedW(K, 0, B('out') + 2, { colour: 'pink', f: [['lowpass', 500, 0.7]], vol: 0.18, rate: () => 1, fi: 0.3, fo: 1.0, mono: true, env: (u, t) => inTent(t) });
  // the dawn chorus: chirps (a robin's, a thrush's, a chickadee's two notes) at the birds' pitch × the world's
  { const fx = K.fx, sr = fx.sr, r = new RNG(CONFIG.seed + 71), t1 = B('hush') + 4;
    for (let t = 0.4; t < t1; t += 0.25 + r.next() * 0.9) {
      const w = ekWorldRate(t), kind = r.int(0, 2), f0 = [2800, 3600, 4200][kind] * r.range(0.85, 1.15), a = ekAudible(t, f0 * 1.3);
      if (a < 0.02) continue;
      const notes = kind === 2 ? 2 : r.int(2, 6), d = kind === 2 ? 0.22 : r.range(0.05, 0.12), y = fx.arr(notes * (d + 0.06) + 0.1);
      for (let k = 0; k < notes; k++) {
        const i0 = Math.round(k * (d + 0.06) * sr), fa = f0 * (kind === 2 ? (k ? 0.84 : 1) : r.range(0.85, 1.2)), fb = fa * (kind === 1 ? 1.25 : r.range(0.75, 1.1));
        let ph = 0; for (let i = 0; i < d * sr; i++) { const u = i / (d * sr), f = (fa + (fb - fa) * u) * w; if (f > sr * 0.45) break; ph += 2 * Math.PI * f / sr; y[i0 + i] += Math.sin(ph) * Math.sin(Math.PI * u) * (1 + 0.3 * Math.sin(ph * 0.5)); }
      }
      K.put(y, t, { vol: 0.07 * a * r.range(0.4, 1) * (1 - 0.7 * inTent(t)), norm: true, pan: r.range(-0.8, 0.8) });
    }
  }
  void END;
});

// (no breathing track: the owner found a breath under the whole film annoying, 2026-11-20)

// your heartbeat (from the quiet on: everything else is too high to hear), and the blood in your ears in the silence
ekSound('amb', 'heart', function (ctx, bus, K) {
  const fx = K.fx, B = ekB, c = ekC, END = EK.end;
  const bpm = ekCurve((t) => 66 + 14 * ekEv(t, B('escape'), B('plane')) + 10 * ekEv(t, B('lift'), B('moon')) + 12 * ekEv(t, B('house'), B('ball')) - 8 * ekWn(t, B('ball'), B('end'), 0.5, 1) + 10 * ekEv(t, c('end', 1), END));
  const lvl = ekCurve((t) => ekEv(t, B('quiet') + 0.5, c('quiet', 1)) * (1 - 0.5 * ekWn(t, B('sunrise'), B('peaks'), 1, 2)));
  const thump = (f, dk) => { const y = fx.hit([[f, 0.09 * dk, 1], [f * 1.6, 0.05 * dk, 0.4], [f * 2.3, 0.03 * dk, 0.15]], { width: 0.012, amp: 1, len: 0.5 }); EKX.bq(y, 'lp', 160, 0.7, fx.sr); return y; };
  const L = thump(48, 1), D = thump(56, 0.8);
  for (let t = B('quiet'); t < END - 0.3;) {
    const a = lvl(t); if (a > 0.01) { K.put(L, t, { vol: 0.5 * a, norm: true }); K.put(D, t + 0.17, { vol: 0.32 * a, norm: true }); }
    t += 60 / bpm(t);
  }
  // the blood in your ears: a low, close rush that only shows in the silence
  ekBedW(K, B('quiet'), END + 0.5, { colour: 'brown', f: [['lowpass', 260, 0.7]], vol: 0.16, rate: () => 1, mono: true, fi: 3, fo: 0.05, am: 0.3, wr: 1.1,
    env: (u, t) => ekEv(t, B('quiet') + 1, c('quiet', 1) + 1) });
});
