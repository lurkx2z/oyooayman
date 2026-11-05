/* =====================================================================
   MIX — stem levels and the dynamics map for men-disappear-long.html (read by audio.js).
     gain  stem level (dB) · hp  high-pass (Hz) · dyn  [beat, offset s, dB] keys (beat: a MG key or a film second)
   Measured stem by stem (solo, pre-trim, 5 November 2026): music −18.2, amb −24.4, sfx −29.8 LUFS integrated.
   The owner's rule (31 October 2026): the music clearly leads, the beds about 10 dB under it, stem by stem. With the
   trims below, in 10 s windows the score sits 9.3 to 22.5 dB over the beds (median 14.3; re-measured on the final
   cut, after the beds came down 1 dB and the beach surf 1.5 dB) and 5.9 to 37 dB over the effects (median 18; the
   closest are the MRI quench and the grid's bangs, which are meant to cut through).
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
const MG_MIXSH = (m) => mgShot(m);
window.MG_MIX = {
  stems: {
    music: { gain: 2.5, hp: 32 },  // the score leads: about 10 to 13 dB over the beds (the owner's rule of 31 October 2026)
    amb: { gain: -6, hp: 28 },     // the train, sea, hospital, crowd and beach beds, well under the score
    sfx: { gain: 2, hp: 25 },      // the train, the quench, the grid, the crowd, the party's speaker, the fire
  },
  dyn: {
    music: [[0, 0, 0], ['end', -0.04, 1.5], ['end', 0, -60]],
    amb: [[0, 0, 0], ['end', -0.04, 0], ['end', 0, -60]],
    sfx: [['end', -0.04, 0], ['end', 0, -60]],
  },
  master: 1.0,
  eq: [['lowshelf', 110, -2.5], ['highshelf', 3500, 2]],
  ceiling: -2.5,   // dBTP, the limiter's ceiling (mgLimit)
};
