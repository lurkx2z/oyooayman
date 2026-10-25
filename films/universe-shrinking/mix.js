/* =====================================================================
   MIX — stem levels and the dynamics map for universe-shrinking.html (read by audio.js).
     gain  stem level (dB) · hp  high-pass (Hz) · dyn  [beat, offset s, dB] keys
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
window.UC_MIX = {
  stems: {
    music: { gain: 0, hp: 32 },
    amb: { gain: 4, hp: 28 },
    sfx: { gain: 3, hp: 25 },
  },
  dyn: {
    // your ears pop: for a moment everything goes dull and far, then comes back (a little less: the air is thinner)
    music: [['pop', -0.05, 0], ['pop', 0.06, -6], ['pop', 1.6, 0]],
    amb: [['pop', -0.05, 0], ['pop', 0.06, -9], ['pop', 1.3, -2.5]],
    sfx: [],
  },
  master: 9,
  eq: [['lowshelf', 110, -2.5], ['highshelf', 3500, 2]],
  ceiling: -1.5,   // dBTP, the limiter's ceiling (ucLimit)
};
