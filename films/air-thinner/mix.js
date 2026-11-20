/* =====================================================================
   MIX — stem levels and the dynamics map for air-thinner.html (read by audio.js).
     gain  stem level (dB) · hp  high-pass (Hz) · dyn  [beat, offset s, dB] keys (beat: a AT key or a film second)
   The owner's rule (31 October 2026): the music clearly leads, the beds about 10 dB under it, measured stem by stem
   (solo renders, ebur128 in 10 s windows; the numbers are in EPISODE_REPORT.md § Sound).
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
window.AT_MIX = {
  stems: {
    music: { gain: 2.5, hp: 32 },  // the score leads (the owner's rule of 31 October 2026)
    amb: { gain: 0.5, hp: 28 },    // the sea, the ship's way, the people, the steel band; under water: breath and bubbles
    sfx: { gain: -0.5, hp: 25 },   // each step's pressure drop, the pop, the fizz, the engines, the power, the roll, the boil
  },
  dyn: {
    music: [[0, 0, 0], ['end', -0.04, 0], ['end', 0, -60]],
    // (a little lower where the score is quiet: his jaw, the swelling, the bar)
    amb: [[0, 0, 0], [atB('ears'), -0.3, 0], [atB('ears'), 0.2, -3], [atB('ears'), 5.8, -3], [atB('ears'), 6.3, 0],
      [atB('cabin'), -0.3, 0], [atB('cabin'), 0.2, -2.5], [atB('fizz'), 4.6, -3], [atB('fizz'), 5.1, 0], ['end', -0.04, 0], ['end', 0, -60]],
    sfx: [['end', -0.04, 0], ['end', 0, -60]],
  },
  master: 7.5,
  eq: [['lowshelf', 110, -2.5], ['highshelf', 3500, 2]],
  ceiling: -2.5,   // dBTP, the limiter's ceiling (atLimit)
};
