/* =====================================================================
   MIX — the stem levels, the ducking and the DYNAMICS MAP for gravity-doubled-3min.html (read by audio.js).
   Starts from the narrated test's v3 balance (−15 LUFS, dynamics instead of loudness) and maps this film's twelve scenes:
   quiet before the moments that matter (the doubling, the set-down, the clamps, the second stair), builds where the
   action builds (the struggle, the stairs, the silent reveal), and the five silent scenes carry the score.
     gain      stem level in dB (mix-stems.py --write-gains measures and stores them here)
     duck      how far the stem dips under the narrator, in dB (0 = never)
     hp        high-pass in Hz
     dyn       keyframes [beat, offset (s), dB] per stem, eased between keys; a beat is a key of window.GB (g, down, drop,
               step1[0]…) or a narration clip's edges (N1< … N12>: its first word, the end of its last word)
   Ducking and the map multiply. No glue compressor: only the true-peak limiter touches the loudest hits.
   ===================================================================== */
window.GB_MIX = {
  stems: {
    voice: { gain: -4.6, duck: 0, hp: 80 },
    music: { gain: -3.3, duck: -8.0, hp: 45 },
    amb: { gain: 5.4, duck: -7.0, hp: 50 },
    foley: { gain: -2.8, duck: -2.5, hp: 60 },
    sfx: { gain: -1.8, duck: -1.5, hp: 35 },
  },
  attack: 0.22, lead: 0.1, hold: 0.12, release: 0.8, merge: 1.2,
  voiceTrim: {},
  voiceComp: { threshold: -24, knee: 8, ratio: 3, attack: 0.005, release: 0.14 },
  dyn: {
    amb: [['g', -0.45, 0], ['g', -0.07, -10], ['g', 0.05, 0], ['g', 1.6, 0], ['lift', 0, -3], ['top', 0, -5], ['down', -0.5, -8], ['down', 0.3, -8], ['letGo', 0.8, -3],
      ['N3<', 0, -3], ['N4>', 0, -4], ['drop', -0.55, -14], ['drop', 0.6, -14], ['drop', 1.6, -6], ['replay', 0.3, -9], ['replayEnd', 0.3, -4],
      ['s6', 0, 0], ['step2[0]', 0.3, -5], ['back[1]', 0.2, -6], ['handCU', 0.6, -2],
      ['out', -0.1, 0], ['s9', 0, 1], ['s9b', 0.2, 3], ['s9c', 0, 0], ['s10', 0, -2], ['back10', 0, -5], ['s11', 0.3, 1], ['s12', 0, -1], ['end', -2.0, -2], ['end', 0, -16]],
    music: [['g', 0.3, 0], ['grip', 0, -4], ['lift', 0, -1.5], ['top', 0, 0.5], ['lower', 0, 1], ['down', -0.75, -3], ['down', -0.32, -16],
      ['down', -0.02, -16], ['down', 0.08, 0], ['letGo', 0.5, 1], ['s3', 0.5, -1], ['exp', 0, 0],
      ['N4>', 0, 2], ['drop', -0.62, 3], ['drop', -0.46, -40], ['drop', 1.6, -40], ['drop', 1.7, 1], ['replay', -0.2, 2], ['replay', 0.6, -3], ['replayEnd', -0.3, -3], ['replayEnd', 0.2, 0],
      ['s6', 0, -1], ['N6>', 0, 0], ['s7', 0.5, 3], ['step1[0]', 0.7, 2.5], ['step2[0]', -0.3, 2], ['step2[0]', 0.4, -5], ['back[1]', 0.1, -6], ['handCU', 0.4, 0], ['out', 0, -1],
      ['N8>', 0, 0], ['s9', 0.3, 4], ['s9b', 0.4, 5], ['s9c', 0.3, 2], ['s10', 0, -1], ['N10>', 0, 1], ['s11', 0.4, 3.5], ['s12', -1.5, 4.5], ['s12', 0.2, 1],
      ['N12>', 0.3, 3], ['end', -2.2, 2], ['end', 0, -9]],
    foley: [['grip', 0, 0], ['lift', 0, 3], ['down', 1.4, 3], ['exp', 0, 0], ['s6', 0, 0], ['stand[0]', -0.5, 2.5], ['upCut', 1, 1], ['s7', 0, 2.5], ['out', 0, 0], ['help[0]', -0.5, 2], ['help[1]', 0.5, 0]],
    sfx: [['g', -0.3, 0], ['g', -0.02, 3.5], ['g', 1.2, 3.5], ['g', 2.0, 0], ['down', -0.5, 0], ['down', -0.06, 3], ['down', 0.7, 3], ['down', 1.3, 0], ['drop', -0.2, 0], ['drop', -0.05, 3], ['drop', 1.6, 3], ['drop', 2.0, 0], ['replay', 0, 2], ['replayEnd', 0.5, 0],
      ['step1[0]', 0.4, 3], ['step1[1]', 0.5, 1], ['back[1]', 0.3, 0]],
  },
  glue: false,
  target: -15.0, ceiling: -1.8,
};
