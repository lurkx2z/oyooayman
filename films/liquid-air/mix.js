/* =====================================================================
   MIX — stem levels and the dynamics map for liquid-air.html (read by audio.js).
     gain  stem level (dB) · hp  high-pass (Hz) · dyn  [beat, offset s, dB] keys (beat: a LA key or a film second)
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
const LA_MIXSH = (m) => LA_SHOTS.find((s) => s.mode === m);
window.LA_MIX = {
  stems: {
    music: { gain: 2, hp: 32 },
    amb: { gain: 5, hp: 28 },
    sfx: { gain: 13, hp: 25 },
  },
  dyn: {
    // the last frame cuts everything
    music: [['end', -0.04, 0], ['end', 0, -60]],
    amb: [['end', -0.04, 0], ['end', 0, -60]],
    sfx: [['end', -0.04, 0], ['end', 0, -60]],
  },
  master: 6,
  eq: [['lowshelf', 110, -2.5], ['highshelf', 3500, 2]],
  ceiling: -2.0,   // dBTP, the limiter's ceiling (laLimit)
};
