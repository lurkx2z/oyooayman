/* =====================================================================
   MIX — stem levels and the dynamics map for friction-10s.html (read by audio.js).
     gain  stem level (dB) · hp  high-pass (Hz) · dyn  [beat, offset s, dB] keys
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
window.FZ_MIX = {
  stems: {
    music: { gain: 0, hp: 32 },
    amb: { gain: 8, hp: 28 },
    sfx: { gain: 9, hp: 25 },
  },
  dyn: {
    music: [],
    amb: [['t0', -0.3, 0], ['t0', 0.15, -5], ['t0', 2.5, 0]],   // (the garden holds its breath for a moment at 10:00:00)
    sfx: [],
  },
  master: 8,
  eq: [['lowshelf', 110, -2.5], ['highshelf', 3500, 2]],
  ceiling: -1.5,   // dBTP, the limiter's ceiling (fzLimit)
};
