/* =====================================================================
   MIX — stem levels and the dynamics map for ocean-rising.html (read by audio.js).
     gain  stem level (dB) · hp  high-pass (Hz) · dyn  [beat, offset s, dB] keys (beat: a caption beat id, an OC key,
     'e:<OCE event>' or a film second)
   The owner's rule (31 October 2026): the music clearly leads, the beds about 10 dB under it, measured stem by stem
   (solo renders, ebur128 in 10 s windows; the numbers are in EPISODE_REPORT.md § Sound).
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
window.OC_MIX = {
  stems: {
    music: { gain: 5.0, hp: 30 },
    amb: { gain: 1.0, hp: 24 },
    sfx: { gain: -5.0, hp: 22 },
  },
  dyn: {
    // the score is lifted through its sparse stretches (the boat, lichen to the bell, the fog signal, the dark, the coast
    // going dark, Isla's lie to the lamp); the beds dip under the boat, the fog signal, the breakers and the flooded dark
    music: [[0, 0, 0], ['boat', -0.5, 0], ['boat', 0.8, 3], ['phone', -0.3, 3], ['phone', 0.8, 0],
      ['rule', -0.5, 0], ['rule', 1.0, -2], ['height', 0, -2], ['height', 1.0, 0],
      ['lichen', -0.3, 0], ['lichen', 0.8, 3], ['bell', -0.3, 3], ['bell', 0.5, 4], ['world', -0.3, 4], ['world', 0.8, 0],
      ['fog', -0.3, 0], ['fog', 0.8, 4], ['cottage', -0.3, 4], ['cottage', 0.8, 0],
      ['door', -0.3, 0], ['door', 1.5, -3.5], ['e:burst', -0.05, -3.5], ['e:burst', 0.1, 0],
      ['dark', -0.3, 0], ['dark', 0.8, 4], ['stairs', -0.3, 4], ['stairs', 0.8, 0],
      ['town', -0.3, 0], ['town', 0.8, 6], ['ship', -0.3, 6], ['ship', 0.8, 0],
      ['ice', -0.5, 0], ['ice', 1.0, -2.5], ['hill', 0, -2.5], ['hill', 1.0, 0],
      ['lie', -0.3, 0], ['lie', 0.8, 2], ['gallery', -0.3, 2], ['gallery', 1.0, -2], ['lamp', 0, -2], ['lamp', 1.0, 2],
      ['end', -0.04, 2], ['end', 0, -60]],
    amb: [[0, 0, 0], ['boat', -0.5, 0], ['boat', 0.8, -3], ['phone', -0.3, -3], ['phone', 0.8, 0],
      ['lichen', -0.3, 0], ['lichen', 0.8, -2], ['world', -0.3, -2], ['world', 0.8, 0],
      ['fog', -0.3, 0], ['fog', 0.8, -4], ['cottage', -0.3, -4], ['cottage', 0.8, 0],
      ['island', -0.3, 0], ['island', 0.8, -4.5], ['door', -0.3, -4.5], ['door', 3.0, -3.5], ['e:burst', -0.3, -3.5], ['e:burst', 0.1, 0],
      ['dark', -0.2, 0], ['dark', 1.0, -6], ['stairs', -0.3, -6], ['stairs', 1.0, -2], ['town', -0.3, -2], ['town', 0.8, -3],
      ['ship', -0.3, -3], ['ship', 0.8, 0], ['end', -0.04, 0], ['end', 0, -60]],
    sfx: [['end', -0.04, 0], ['end', 0, -60]],
  },
  master: 5.0,
  eq: [['lowshelf', 110, -1.5], ['highshelf', 3500, 1.5]],
  ceiling: -2.0,
};
