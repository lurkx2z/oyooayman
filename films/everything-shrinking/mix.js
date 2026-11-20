/* =====================================================================
   MIX — stem levels and the dynamics map for everything-shrinking.html (read by audio.js).
     gain  stem level (dB) · hp  high-pass (Hz) · dyn  [beat, offset s, dB] keys (beat: a caption beat id, an EK key or a film second)
   The owner's rule (31 October 2026): the music clearly leads, the beds about 10 dB under it, measured stem by stem
   (solo renders, ebur128 in 10 s windows; the numbers are in EPISODE_REPORT.md § Sound).
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
window.EK_MIX = {
  stems: {
    music: { gain: 5.0, hp: 30 },   // the score leads (the owner's rule of 31 October 2026)
    amb: { gain: -14.0, hp: 24 },   // the valley, then only you (under the score by ~10 dB, measured)
    sfx: { gain: -8.0, hp: 22 },    // the tent, Leo, the neighbours, the quake, the grip, the Earth in your hands
  },
  dyn: {
    // the score lifted through its sparse stretches (the rule, the weight, the hush and the quiet, the air, the escape,
    // the sky, the ball), so it still leads the valley and your breath there
    music: [[0, 0, 0], ['rule', -1, 0], ['rule', 1.5, 4], ['rule', 9, 4], ['leo', -1, 0], ['weight', -0.5, 0], ['weight', 1.5, 4], ['weight', 11, 4], ['neighbours', -1, 0],
      ['hush', -1, 0], ['hush', 1.5, 4], ['quiet', 9, 5], ['sunrise', -1, 1], ['sunrise', 3, 0], ['peaks', -1, 0], ['peaks', 1, 2], ['air', 0, 2], ['air', 4, 1], ['air', 6, 3], ['air', 20, 3], ['escape', 2, 3], ['plane', 2, 4], ['plane', 9, 3], ['curve', 0, 0],
      ['sky', 0, 0], ['sky', 2, 3], ['lift', 1, 3], ['lift', 3, 0], ['ball', -1, 0], ['ball', 1, 3], [266.8, 0, 3], [270, 0, 0], [EKT.duration - 0.04, 0, 0], [EKT.duration, 0, -60]],
    amb: [[0, 0, 0], ['rule', -1, 0], ['rule', 1.5, -5], ['rule', 9, -5], ['leo', 0, 0], ['air', 16, 0], ['air', 20, -3], ['plane', 0, -3], ['plane', 4, 0], ['end', -0.04, 0], ['end', 0, -60]],
    sfx: [['end', -0.04, 0], ['end', 0, -60]],
  },
  master: 4.0,
  eq: [['lowshelf', 110, -1.5], ['highshelf', 3500, 1.5]],
  ceiling: -2.0,   // dBTP, the limiter's ceiling (ekLimit)
};
