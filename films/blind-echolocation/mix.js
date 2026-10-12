/* =====================================================================
   MIX — the stem levels, the ducking and the DYNAMICS MAP for blind-echolocation.html (read by audio.js).
   Starts from the gravity films' v3 balance (−15 LUFS integrated, dynamics instead of loudness).
     gain   stem level in dB (mix-stems.py --write-gains measures and stores them here)
     duck   how far the stem dips under the narrator (dB)
     dyn    keyframes [beat, offset (s), dB] per stem (beats: BE keys or clip edges N1< … N14>)
   ===================================================================== */
window.BE_MIX = {
  stems: {
    voice: { gain: -4.6, duck: 0, hp: 80 },
    music: { gain: -3.5, duck: -8.0, hp: 45 },
    amb: { gain: 13.0, duck: -6.0, hp: 40 },
    foley: { gain: 5.0, duck: -2.5, hp: 60 },
    sfx: { gain: -1.5, duck: -1.0, hp: 30 },
  },
  attack: 0.22, lead: 0.1, hold: 0.12, release: 0.8, merge: 1.2,
  voiceTrim: {},
  voiceComp: { threshold: -24, knee: 8, ratio: 3, attack: 0.005, release: 0.14 },
  dyn: {
    // measured per stem (2026-10-12): the brain's inner drone and the street, the rain and the café beds came out at or
    // above the narrator, so they sit 8–11 dB lower under the words and come up again (to about the voice's level) in
    // the words-free gaps. Scene 9: the street rises under "mask" (the masking is the point), then steps back so the
    // signal's tick comes forward; scene 10: in the gap the rain is the whole soundtrack; scene 11: the café pours out
    amb: [['N7<', -0.6, 0], ['N7<', 0.2, -9], ['N7>', 0, -9], ['N7>', 0.8, -6], ['s8', -0.5, -6], ['s8', 0.3, 0],
      ['s9', -0.4, 0], ['s9', -0.1, -8], ['i5', -0.2, -8], ['i5', 0.5, -5], ['i6', -0.3, -5], ['i6', 0.6, -8], ['i9', 0, -8], ['i9b', 0.8, -8],
      ['s10', 0.2, -11], ['j9', -0.2, -11], ['j9', 0.8, -5], ['s11', -0.4, -5], ['s11', 1.2, -8], ['k10', 0, -8], ['k10', 0.8, -3],
      ['s12', -0.3, -3], ['s12', 0.5, 0],
      // scene 14: when her door opens, the hallway's warm wash comes in and stays
      ['qOpen[0]', 0, 0], ['qOpen[1]', 0, 4.5]],
    // scene 12's gap: the music builds with each careful movement; scene 13's gap is the film's musical peak (the clicks
    // come up with it)
    music: [['N12>', 0.5, 0], ['s13', -0.6, 4], ['s13', 1.2, 0], ['N13>', 0, 0], ['N13>', 0.8, 4], ['s14', -0.6, 4], ['s14', 1.0, 0]],
    sfx: [['N13>', 0, 0], ['N13>', 0.5, 3], ['s14', -0.4, 3], ['s14', 0.4, 0]],
  },
  glue: false,
  target: -15.0, ceiling: -1.8,
};
