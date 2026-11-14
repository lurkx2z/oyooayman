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
    amb: { gain: -4.5, hp: 28 },   // the lamps' hum, the concrete, the town below, the street: under the score
    sfx: { gain: -2.5, hp: 25 },   // footsteps, the guard, the torch, the radio, your car, the barrier
  },
  dyn: {
    // the ramp's climax (4:13 to 4:21) sat 7 dB over the rest of the score in solo renders: brought down 3.5 dB
    music: [[0, 0, 0], [251, 0, 0], [253.5, 0, -3.5], [261.5, 0, -3.5], [263.5, 0, 0], ['end', -0.04, 0], ['end', 0, -60]],
    amb: [[0, 0, 0], ['end', -0.04, 0], ['end', 0, -60]],
    sfx: [['end', -0.04, 0], ['end', 0, -60]],
  },
  master: 7.5,
  eq: [['lowshelf', 110, -2.5], ['highshelf', 3500, 2]],
  ceiling: -2.5,   // dBTP, the limiter's ceiling (shLimit)
};
