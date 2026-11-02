/* =====================================================================
   MIX — stem levels and the dynamics map for falls-up.html (read by audio.js).
     gain  stem level (dB) · hp  high-pass (Hz) · dyn  [beat, offset s, dB] keys (beat: a FU key or a film second)
   Measured solo (pre-trim): music −22.6, amb −17.3, sfx −25.2 LUFS → with the trims music −15.6, amb −28.3, sfx −21.2.
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
const FU_MIXSH = (m) => FU_SHOTS.find((s) => s.mode === m);
window.FU_MIX = {
  stems: {
    music: { gain: 7, hp: 32 },    // the score leads: about 13 dB over the beds (the owner's rule after Days shorter)
    amb: { gain: -11, hp: 28 },    // the room, street and park beds, well under the score
    sfx: { gain: 4, hp: 25 },
  },
  dyn: {
    music: [[0, 0, 0], ['end', -0.04, 1.5], ['end', 0, -60]],
    amb: [[0, 0, 0], ['end', -0.04, 0], ['end', 0, -60]],
    sfx: [['end', -0.04, 0], ['end', 0, -60]],
  },
  master: 1.0,
  eq: [['lowshelf', 110, -2.5], ['highshelf', 3500, 2]],
  ceiling: -2.5,   // dBTP, the limiter's ceiling (fuLimit)
};
