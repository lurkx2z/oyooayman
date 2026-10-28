/* =====================================================================
   MIX — stem levels and the dynamics map for friction-10s.html (read by audio.js).
     gain  stem level (dB) · hp  high-pass (Hz) · dyn  [beat, offset s, dB] keys
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
window.FZ_MIX = {
  stems: {
    music: { gain: 2, hp: 32 },
    amb: { gain: 5, hp: 28 },
    sfx: { gain: 9, hp: 25 },
  },
  // the score builds from "Now everything starts to slide" to real speed, stays up through "faster" and settles for the
  // warning (which builds on its own); everything stops dead for 0.42 s before s = 10, even the reverb tails
  dyn: {
    music: [['tSlide', 0, 0], ['tRS', -0.4, 5], ['tRS', 0.3, 2], ['tWarn', -0.5, 3.5], ['tWarn', 1.5, 0], ['hold', -0.02, 0], ['hold', 0.0, -70], ['tB', -0.003, -70], ['tB', 0, 0]],
    amb: [['hold', -0.02, 0], ['hold', 0.0, -70], ['tB', -0.003, -70], ['tB', 0, 0]],
    sfx: [['hold', -0.02, 0], ['hold', 0.0, -70], ['tB', -0.003, -70], ['tB', 0, 0]],
  },
  master: 9,
  eq: [['lowshelf', 110, -2.5], ['highshelf', 3500, 2]],
  ceiling: -1.5,   // dBTP, the limiter's ceiling (fzLimit)
};
