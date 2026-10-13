/* =====================================================================
   MIX — stem levels, ducking and the dynamics map for africa-disappears.html (read by audio.js).
     gain  stem level (dB) · duck  how far the stem dips under the narrator (dB) · dyn  [beat, offset s, dB] keys
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
window.AF_MIX = {
  stems: {
    voice: { gain: 0, duck: 0, hp: 80 },
    music: { gain: 0, duck: -9.0, hp: 40 },
    amb: { gain: 0, duck: -6.0, hp: 35 },
    sfx: { gain: 0, duck: -2.5, hp: 30 },
  },
  attack: 0.25, lead: 0.12, hold: 0.15, release: 0.9, merge: 1.1,
  voiceTrim: {},
  voiceComp: { threshold: -24, knee: 8, ratio: 3, attack: 0.005, release: 0.14 },
  dyn: {},
  master: 0,
};
