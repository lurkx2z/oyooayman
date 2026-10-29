/* =====================================================================
   MIX — stem levels and the dynamics map for gravity-tilt.html (read by audio.js).
     gain  stem level (dB) · hp  high-pass (Hz) · dyn  [beat, offset s, dB] keys (beat: a GT key or a film second)
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
const GT_MIXSH = (m) => GT_SHOTS.find((s) => s.mode === m);
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
    // the river's roar up (its three shots); the rain's front up as it comes down the street, and a while after it
    // arrives; 0.4 s of silence before the return; the last frame cuts everything
    amb: [[GT_MIXSH('river').t0 - 0.05, 0, 0], [GT_MIXSH('river').t0, 0, 4], [GT_MIXSH('spray').t1 - 0.05, 0, 4], [GT_MIXSH('spray').t1, 0, 0],
      [GT_MIXSH('rainfront').t0 - 0.1, 0, 0], [GT_MIXSH('rainfront').t0, 0, 5], ['tRain', 1.2, 5], ['tRain', 5.5, 2], ['tRain', 5.6, 0],
      ['tRel', -8.0, 0], ['tRel', -7.4, -5], ['tRel', -0.05, -5], ['tRel', 0.05, 0], ['hold', -0.25, 0], ['hold', 0, -40], ['tB', -0.01, -40], ['tB', 0, 0], ['end', -0.04, 0], ['end', 0, -60]],
    sfx: [['hold', -0.25, 0], ['hold', 0, -40], ['tB', -0.01, -40], ['tB', 0, 0], ['end', -0.04, 0], ['end', 0, -60]],
  },
  master: 6,
  eq: [['lowshelf', 110, -2.5], ['highshelf', 3500, 2]],
  ceiling: -1.5,   // dBTP, the limiter's ceiling (gtLimit)
};
