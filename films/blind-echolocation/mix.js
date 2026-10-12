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
  dyn: {},
  glue: false,
  target: -15.0, ceiling: -1.8,
};
