/* =====================================================================
   MIX — stem levels and the dynamics map for days-shorter.html (read by audio.js).
     gain  stem level (dB) · hp  high-pass (Hz) · dyn  [beat, offset s, dB] keys (beat: a DS key or a film second)
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
const DS_MIXSH = (m) => DS_SHOTS.find((s) => s.mode === m);
window.DS_MIX = {
  stems: {
    music: { gain: 2, hp: 32 },
    amb: { gain: 5, hp: 28 },
    sfx: { gain: 13, hp: 25 },
  },
  dyn: {
    // the score sits under the big moments (the quakes, the spire's crash) and comes up for the endings; the last frame
    // cuts everything (no fade: the film stops on the question)
    music: [[0, 0, 0], [dsC('quake', 0) - 1, 0, 0], [dsC('quake', 0), 0, -3], [dsE('quake'), 0, 0],
      [dsS('node') - 1, 0, 0], [dsS('node'), 0, 3], [dsE('node'), 0, 3], [dsE('node') + 1.5, 0, 0],          // the explainer stretches: the score up 3 dB
      [dsS('scale') - 1, 0, 0], [dsS('scale'), 0, 3], [dsC('marble', 0) - 2, 0, 3], [dsC('marble', 0) - 1, 0, 0], [dsC('marble', 0), 0, -3], [dsE('marble'), 0, 0],
      [dsC('spire', 0) - 1, 0, 0], [dsC('spire', 0), 0, -3], [dsE('spire'), 0, 0], [dsC('dawn', 0), 0, 1.5], ['end', -0.04, 1.5], ['end', 0, -60]],
    amb: [[0, 0, 0], ['end', -0.04, 0], ['end', 0, -60]],
    sfx: [['end', -0.04, 0], ['end', 0, -60]],
  },
  master: -6.6,
  eq: [['lowshelf', 110, -2.5], ['highshelf', 3500, 2]],
  ceiling: -2.5,   // dBTP, the limiter's ceiling (dsLimit)
};
