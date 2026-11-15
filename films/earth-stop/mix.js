/* =====================================================================
   MIX — stem levels and the dynamics map for earth-stop.html (read by audio.js).
     gain  stem level (dB) · hp  high-pass (Hz) · dyn  [beat, offset s, dB] keys (beat: a ES key or a film second)
   The owner's rule (31 October 2026): the music clearly leads, the beds about 10 dB under it, measured stem by stem
   (solo renders, ebur128 in 10 s windows; the numbers are in EPISODE_REPORT.md § Sound).
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
window.ES_MIX = (() => {
  const B = esB, end = [['end', -0.04, 0], ['end', 0, -60]];
  return {
    stems: {
      music: { gain: 0, hp: 32 },    // the score leads (the owner's rule of 31 October 2026)
      amb: { gain: 4, hp: 28 },      // the platform, the ground under your train, the hill's fire, the sea: under the score
      sfx: { gain: 5, hp: 25 },      // the stop, the steel, the wagons, the ferry, the skid, what comes back west
    },
    dyn: {
      // the score's quiet stretches (the people; the fall and the airliner) sat 10 dB under the rest and under the beds:
      // up a little; its last 14 seconds sat 5 dB over everything: down a little (they are still the loudest)
      music: [[0, 0, 0], [B('people'), -0.5, 0], [B('people'), 1.5, 2], [B('train'), -1, 2], [B('train'), 0.5, 0], [B('fall'), -0.5, 0], [B('fall'), 1.5, 4], [B('count'), -0.8, 4], [B('count'), 0, 0],
        [B('second'), 0, 0], ['end', -1, -2.5]].map(([b, o, d]) => (b === 'end' ? [b, o, d] : [b + o, 0, d])).concat([['end', -0.04, -2.5], ['end', 0, -60]]),
      amb: [[0, 0, 0], [B('fall'), 0, 0], [B('fall') + 2, 0, -3], [B('count') - 1, 0, -3], [B('count') + 0.5, 0, 0]].concat(end),
      sfx: [[0, 0, 0]].concat(end),
    },
    master: 1.0,
    eq: [['lowshelf', 110, -2.5], ['highshelf', 3500, 2]],
    ceiling: -2.5,   // dBTP, the limiter's ceiling (esLimit)
  };
})();
