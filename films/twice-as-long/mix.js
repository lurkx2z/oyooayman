/* =====================================================================
   MIX — stem levels, ducking and the dynamics map for twice-as-long.html (read by audio.js).
     gain  stem level (dB) · duck  how far the stem dips under the narrator (dB) · hp  high-pass (Hz)
     dyn   [beat, offset s, dB] keys (beats: audio.js twBeat)
   The owner's rule (31 October 2026): the music clearly leads, the beds about 10 dB under it, measured stem by stem.
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
window.TW_MIX = {
  stems: {
    voice: { gain: -2.0, duck: 0, hp: 80 },
    music: { gain: 2.0, duck: -7.0, hp: 30 },
    amb: { gain: -6.0, duck: -4.0, hp: 30 },
    sfx: { gain: -2.0, duck: -3.0, hp: 24 },
  },
  attack: 0.25, lead: 0.12, hold: 0.15, release: 0.9, merge: 1.1,
  fast: [],
  voiceTrim: {},
  voiceComp: { threshold: -24, knee: 8, ratio: 3, attack: 0.005, release: 0.14 },
  dyn: { music: [], amb: [], sfx: [] },
  master: 3.0,
  eq: [['lowshelf', 110, -1.0], ['highshelf', 3500, 1.0]],
  ceiling: -1.5,
};
