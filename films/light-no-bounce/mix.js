/* =====================================================================
   MIX — stem levels and the dynamics map for light-no-bounce.html (read by audio.js).
     gain  stem level (dB) · hp  high-pass (Hz) · dyn  [beat, offset s, dB] keys (beat: a NB key or a film second)
   The owner's rule (31 October 2026): the music clearly leads, the beds about 10 dB under it, measured stem by stem
   (solo renders, ebur128 in 10 s windows; the numbers are in EPISODE_REPORT.md § Sound).
   Pass 1 (5 November 2026, solo, pre-trim): music −22.9, amb −26.4, sfx −27.1 LUFS integrated; with the old trims the
   beds sat a median 10.6 dB under the score but only 3 to 6 dB in the jet, coaster and motorway shots, and the effects
   (the carousel's organ above all) only 3.9 dB under: those beds and the organ came down, the effects' trim with them.
   The count and the return (3:59–4:19) are the score's loudest stretch: the map holds them 4 dB down so the limiter
   doesn't flatten them; the quiet sky minutes (0:35–1:07) come up 2 dB.
   Final (5 November 2026, the 5:01 cut, solo stems in 10 s windows with these trims): the music over the beds by a median
   11.8 dB (7.4 at the closest, the screams at 3:30:10; 18.5 at most), over the effects by a median 12.0 dB (6.1 at the
   closest, the same screams; the driver's horns came down 4 dB to 7.4). The mix: −15.2 LUFS, −2.4 dBTP, LRA 7.0 LU.
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
window.NB_MIX = {
  stems: {
    music: { gain: 2.5, hp: 32 },  // the score leads (the owner's rule of 31 October 2026)
    amb: { gain: -6.5, hp: 28 },   // the fair's murmur, the valley's wind, the car, the cockpit, the jet, the station: under the score
    sfx: { gain: -4.5, hp: 25 },   // the organ, the crowd, the horns, the screams, the crash
  },
  dyn: {
    // (keyed off the captions: script.js loads first)
    music: [[0, 0, 0], [nbB('sky'), -4, 0], [nbB('sky'), 0, 2], [nbB('hands'), -0.4, 2], [nbB('hands'), 3.6, 0], [nbB('count'), -5, 0], [nbB('count'), 1, -4],
      [nbB('moonback'), -1, -4], [nbB('moonback'), 3, -1], ['end', -0.04, 0.5], ['end', 0, -60]],
    amb: [[0, 0, 0], ['end', -0.04, 0], ['end', 0, -60]],
    sfx: [['end', -0.04, 0], ['end', 0, -60]],
  },
  master: 7.7,
  eq: [['lowshelf', 110, -2.5], ['highshelf', 3500, 2]],
  ceiling: -2.5,   // dBTP, the limiter's ceiling (nbLimit)
};
