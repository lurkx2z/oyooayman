/* =====================================================================
   MIX — stem levels and the dynamics map for universe-shrinking.html (read by audio.js).
     gain  stem level (dB) · hp  high-pass (Hz) · dyn  [beat, offset s, dB] keys
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
window.UC_MIX = {
  stems: {
    music: { gain: 0, hp: 32 },
    amb: { gain: 8, hp: 28 },
    sfx: { gain: 9, hp: 25 },
  },
  dyn: {
    // (the fire run: the score steps back a little so the fire and each place catching are heard)
    music: [['leaves', -1, 0], ['leaves', 1.5, -2.5], ['glass', 0, -2.5], ['bath', 0, 0]],
    // (the night bed sits a little lower under the quiet early scenes and the ending; the fire comes up)
    amb: [['titleShot', -0.2, 0], ['titleShot', 1.0, -3], ['leaves', -1, -3], ['leaves', 2, 2], ['vanish', 0, 2], ['bigbang', 0, 0], ['midnight', 0, 0], ['midnight', 1, -3]],
    sfx: [],
  },
  master: 9,
  eq: [['lowshelf', 110, -2.5], ['highshelf', 3500, 2]],
  ceiling: -1.5,   // dBTP, the limiter's ceiling (ucLimit)
};
