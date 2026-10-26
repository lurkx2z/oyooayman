/* =====================================================================
   MIX — stem levels and the dynamics map for light-backward.html (read by audio.js).
     gain  stem level (dB) · hp  high-pass (Hz) · dyn  [beat, offset s, dB] keys
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
window.LB_MIX = {
  stems: {
    music: { gain: 0, hp: 32 },
    amb: { gain: 8, hp: 28 },
    sfx: { gain: 9, hp: 25 },
  },
  dyn: {
    // the score steps back for the robins and the streetlights, and for the beach's cheer when the Sun comes back
    music: [['robin', -0.4, 0], ['robin', 0.6, -3], ['lampsOff', 1.2, -3], ['lampsOff', 2.6, 0], ['back', 0, 0], ['back', 0.8, -3.5], ['double', 0.5, -3.5], ['double', 3.0, 0]],
    amb: [],
    sfx: [],
  },
  master: 6,
  eq: [['lowshelf', 110, -2.5], ['highshelf', 3500, 2]],
  ceiling: -1.5,   // dBTP, the limiter's ceiling (lbLimit)
};
