/* =====================================================================
   MIX — stem levels and the dynamics map for earth-stop.html (read by audio.js).
     gain  stem level (dB) · hp  high-pass (Hz) · dyn  [beat, offset s, dB] keys (beat: a ES key or a film second)
   The owner's rule (31 October 2026): the music clearly leads, the beds about 10 dB under it, measured stem by stem
   (solo renders, ebur128 in 10 s windows; the numbers are in EPISODE_REPORT.md § Sound).
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
window.ES_MIX = (() => {
  const B = esB, end = [['end', -0.04, 0], ['end', 0, -60]], tW = esFilmAt(ESP.wagon0), tb = esFilmAt(ESP.T), tLast = esC('twist', 2) - 0.5;
  // the breath before the first wagon (0.35 s; the score's echo is cut too); at 5:42:01 the world goes out for a second
  // (then the beds' own hush)
  const gaps = [[tW - 0.5, 0, 0], [tW - 0.36, 0, -18], [tW - 0.03, 0, -18], [tW, 0, 0], [tb - 0.004, 0, 0], [tb + 0.004, 0, -40], [tb + 0.9, 0, -40], [tb + 2.4, 0, 0]];
  const byT = (a) => a.filter((k) => k[0] !== 'end').sort((x, y) => x[0] - y[0]).concat(a.filter((k) => k[0] === 'end'));
  return {
    stems: { music: { gain: 0, hp: 32 }, amb: { gain: 4, hp: 28 }, sfx: { gain: 5, hp: 25 } },
    // dB over time, per stem ([film s, 0, dB] or ['end', seconds before the end, dB])
    dyn: {
      music: byT([[0, 0, 0], [tW - 0.33, 0, 0], [tW - 0.27, 0, -30], [tW - 0.02, 0, -30], [tW, 0, 0], [B('people') - 0.5, 0, 0], [B('people') + 1.5, 0, 2], [B('train') - 1, 0, 2], [B('train') + 0.5, 0, 0], [B('fall') - 0.5, 0, 0], [B('fall') + 1.5, 0, 4], [B('count') - 0.8, 0, 4], [B('count'), 0, 0],
        [tb - 0.004, 0, 0], [tb + 0.004, 0, -50], [tb + 2.6, 0, -50], [tb + 3.4, 0, 0],   // 5:42:01.000: not even the hall's echo is left
        [tLast, 0, 0], ['end', -0.3, 0], ['end', 0, -60]]),
      amb: byT([[0, 0, 0], [B('fall'), 0, 0], [B('fall') + 2, 0, -3], [B('count') - 1, 0, -3], [B('count') + 0.5, 0, 0]].concat(gaps, end)),
      sfx: byT([[0, 0, 0], [tb - 0.004, 0, 0], [tb + 0.004, 0, -40], [tb + 0.6, 0, -40], [tb + 1.0, 0, 0]].concat(gaps.slice(0, 4), end)),
    },
    master: 1.0, eq: [['lowshelf', 110, -2.5], ['highshelf', 3500, 2]], ceiling: -2.5,
  };
})();
