/* =====================================================================
   MIX — stem levels and the dynamics map for shadow-lag.html (read by audio.js).
     gain  stem level (dB) · hp  high-pass (Hz) · dyn  [beat, offset s, dB] keys (beat: a SH key or a film second)
   The owner's rule (31 October 2026): the music clearly leads, the beds about 10 dB under it, measured stem by stem
   (solo renders, ebur128 in 10 s windows; the numbers are in EPISODE_REPORT.md § Sound).
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
window.SH_MIX = {
  stems: {
    music: { gain: 2.5, hp: 32 },  // the score leads (the owner's rule of 31 October 2026)
    amb: { gain: -4.5, hp: 28 },   // the river, the boat's engine, the hospital, the bridge, the hill: under the score
    sfx: { gain: -4.5, hp: 25 },   // the radio, the hum, the steel, the cylinder, your phone, the crash
  },
  dyn: {
    music: [[0, 0, 0], ['end', -0.04, 0], ['end', 0, -60]],
    amb: [[0, 0, 0], ['end', -0.04, 0], ['end', 0, -60]],
    sfx: [['end', -0.04, 0], ['end', 0, -60]],
  },
  master: 7.7,
  eq: [['lowshelf', 110, -2.5], ['highshelf', 3500, 2]],
  ceiling: -2.5,   // dBTP, the limiter's ceiling (shLimit)
};
