/* =====================================================================
   MIX — stem levels, ducking and the dynamics map for africa-disappears.html (read by audio.js).
     gain  stem level (dB) · duck  how far the stem dips under the narrator (dB) · dyn  [beat, offset s, dB] keys
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
window.AF_MIX = {
  stems: {
    voice: { gain: -5.5, duck: 0, hp: 80 },
    music: { gain: 1.5, duck: -9.0, hp: 40 },
    amb: { gain: 6, duck: -6.0, hp: 45 },
    sfx: { gain: 3, duck: -2.5, hp: 30 },
  },
  attack: 0.25, lead: 0.12, hold: 0.15, release: 0.9, merge: 1.1,
  // the narrator's own dynamics: a little bigger over the oceans, softer for the people left behind
  voiceTrim: { 's4-move': 0.5, 's4-surge': 1.2, 's4-waves': 1.2, 's4-geography': 1.0, 's6-crisis': -2.0, 's6-supply': -2.0, 's6-families': -3.5, 's7-survive': -1.0, 's7-never': -0.5 },
  voiceComp: { threshold: -24, knee: 8, ratio: 3, attack: 0.005, release: 0.14 },
  // the dynamics map: the oceans and the storm swell; the human section drops back; the final swell opens up
  dyn: {
    music: [['oceans', -0.3, 0], ['oceans', 0.6, 1.5], ['forest', -0.05, 1.5], ['forest', 0.1, 0], ['room', -0.3, 0], ['room', 0.6, -4], ['coast', -0.3, -4], ['coast', 1.0, 0], ['pull', -0.2, 0], ['pull', 1.2, 1.5]],
    amb: [['oceans', -0.3, 0], ['oceans', 0.4, 2], ['forest', -0.05, 2], ['forest', 0.1, 0], ['room', -0.3, 0], ['room', 0.4, -4], ['coast', -0.3, -4], ['coast', 0.5, 0]],
    sfx: [['ship', -0.2, 0], ['ship', 0.2, 1.5], ['forest', -0.05, 1.5], ['forest', 0.1, 0]],
  },
  master: 0,
  ceiling: -1.5,   // dBTP, the limiter's ceiling (afLimit)
};
