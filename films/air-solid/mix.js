/* =====================================================================
   MIX — stem levels and the dynamics map for air-solid.html (read by audio.js).
     gain  stem level (dB) · hp  high-pass (Hz) · dyn  [beat, offset s, dB] keys (beat: a SA key or a film second)
   Measured stem by stem (solo, pre-trim, 2026-11-04): music −23.1, amb −20.9, sfx −29.2 LUFS integrated.
   With the trims: music −16.1; amb −28.9 (12 dB under the score); sfx −25.2 (the blood bed in the lock sits 11 dB under
   the score; the busy aftermath, 4:00–5:29, 6 dB under).
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
const SA_MIXSH = (m) => saShot(m);
window.SA_MIX = {
  stems: {
    music: { gain: 7, hp: 32 },    // the score leads: about 12 dB over the beds (the owner's rule of 31 October 2026)
    amb: { gain: -8, hp: 28 },     // the room, street and park beds, well under the score
    sfx: { gain: 4, hp: 25 },
  },
  dyn: {
    music: [[0, 0, 0], ['end', -0.04, 1.5], ['end', 0, -60]],
    amb: [[0, 0, 0], ['end', -0.04, 0], ['end', 0, -60]],
    sfx: [['end', -0.04, 0], ['end', 0, -60]],
  },
  master: 1.0,
  eq: [['lowshelf', 110, -2.5], ['highshelf', 3500, 2]],
  ceiling: -2.5,   // dBTP, the limiter's ceiling (saLimit)
};
