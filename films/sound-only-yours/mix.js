/* =====================================================================
   MIX — stem levels and the dynamics map for sound-only-yours.html (read by audio.js).
     gain  stem level (dB) · hp  high-pass (Hz) · dyn  [beat, offset s, dB] keys (beat: an SO key, a caption beat or a
     film second), or a function of film time → dB (the score's: it gets out of the way of your voice and your body)
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range; the score clearly
   leads (beds about 10 dB under it, measured solo).
   ===================================================================== */
window.SO_MIX = {
  stems: {
    music: { gain: 6, hp: 30 },
    amb: { gain: -8, hp: 28 },
    sfx: { gain: 4, hp: 25 },
  },
  dyn: {
    // the score, ducked: a dead hush before your clap; well down while your body is loud; under every line you speak;
    // down while your steps fill the stairwell; muted from "It never comes" to the park; cut on the last frame
    music: (t) => {
      const D = (a, b, db, fi = 0.4, fo = 0.6) => db * soSm(t, a - fi, a) * (1 - soSm(t, b, b + fo));
      let v = D(SO.tClap - 0.7, SO.tClap + 1.0, -12, 0.9, 1.6);
      v += D(soC('body', 0) + 1.5, soB('mum') - 0.4, -4, 2.0, 1.0);
      for (const c of SO_VOICE) { const d = { y_okay: -9, y_who: -8, y_count: -5, y_street: -4, y_shout: 0 }[c.id] ?? -6; v += D(c.start - 0.1, c.start + c.seconds - 0.1, d, 0.4, 0.7); }
      v += D(soC('stairs', 2) - 0.5, SO.tTurn - 0.4, -5, 1.0, 0.2);
      const tN = soC('storm', 3), P0 = soB('park');
      if (t > tN - 0.03 && t < P0 + 0.6) v += -60 * soSm(t, tN - 0.03, tN) * (1 - soSm(t, P0 + 0.1, P0 + 0.6));
      if (t > SO.end - 0.04) v += -60 * soSm(t, SO.end - 0.04, SO.end);
      return Math.max(-60, v);
    },
    amb: [[0, 0, 0], ['end', -0.04, 0], ['end', 0, -60]],
    sfx: [['end', -0.04, 0], ['end', 0, -60]],
  },
  master: 2,
  eq: [['lowshelf', 110, -1.5], ['highshelf', 3500, 1.5]],
  ceiling: -2.0,
};
