/* =====================================================================
   MIX — stem levels and the dynamics map for gravity-tilt.html (read by audio.js).
     gain  stem level (dB) · hp  high-pass (Hz) · dyn  [beat, offset s, dB] keys (beat: a GT key or a film second)
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
window.GT_MIX = {
  stems: {
    music: { gain: 2, hp: 32 },
    amb: { gain: 5, hp: 28 },
    sfx: { gain: 13, hp: 25 },
  },
  dyn: {
    // the score makes room for the big events (the terrace hitting, the window going, the bolt, the return)
    music: [['tTerHit', -0.15, 0], ['tTerHit', 0.05, -6], ['tTerHit', 3.5, -2], ['tTerHit', 6, 0],
      ['tGlass', -0.1, 0], ['tGlass', 0.05, -7], ['tGlass', 2.5, -2], ['tGlass', 4, 0],
      ['tBolt', -0.1, 0], ['tBolt', 0.05, -6], ['tBolt', 2.5, 0],
      ['tB', -0.05, 0], ['tB', 0.05, -3], ['tB', 2.0, 0]],
    // the river's roar up; 0.4 s of silence before the return; the last frame cuts everything
    amb: [[75.75, 0, 0], [75.8, 0, 4], [88.0, 0, 4], [88.05, 0, 0], [176.1, 0, 0], [176.2, 0, 5], [185.4, 0, 5], [189.7, 0, 2], [189.8, 0, 0],
      ['tRel', -8.0, 0], ['tRel', -7.4, -5], ['tRel', -0.05, -5], ['tRel', 0.05, 0], ['hold', -0.25, 0], ['hold', 0, -40], ['tB', -0.01, -40], ['tB', 0, 0], ['end', -0.04, 0], ['end', 0, -60]],
    sfx: [['hold', -0.25, 0], ['hold', 0, -40], ['tB', -0.01, -40], ['tB', 0, 0], ['end', -0.04, 0], ['end', 0, -60]],
  },
  master: 6,
  eq: [['lowshelf', 110, -2.5], ['highshelf', 3500, 2]],
  ceiling: -1.5,   // dBTP, the limiter's ceiling (gtLimit)
};
