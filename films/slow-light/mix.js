/* =====================================================================
   MIX — stem levels and the dynamics map for slow-light.html (read by audio.js).
     gain  stem level (dB) · hp  high-pass (Hz) · dyn  [beat, offset s, dB] keys
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
window.SL_MIX = {
  stems: {
    music: { gain: 0, hp: 35 },
    amb: { gain: 6, hp: 30 },
    sfx: { gain: 3, hp: 25 },
  },
  dyn: {
    // the score steps back under the call's voices, and under the car you can only hear (it has to be heard)
    music: [['call', 0, 0], ['call', 1.0, -3.5], ['joke', 1.4, -3.5], ['joke', 2.6, 0],
      ['faster', 0.5, 0], ['faster', 2.0, -5], ['car2Seen', -0.3, -5], ['car2Seen', -0.04, 0]],
    amb: [],
    sfx: [],
  },
  master: 9,
  ceiling: -1.5,   // dBTP, the limiter's ceiling (slLimit)
};
