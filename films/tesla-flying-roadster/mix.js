/* =====================================================================
   MIX — stem levels, ducking and the dynamics map for tesla-flying-roadster.html (read by audio.js).
     gain  stem level (dB) · duck  how far the stem dips under the narrator (dB) · dyn  [beat, offset s, dB] keys
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
window.TR_MIX = {
  stems: {
    voice: { gain: -5.5, duck: 0, hp: 80 },
    music: { gain: 1.5, duck: -9.0, hp: 40 },
    amb: { gain: 6, duck: -6.0, hp: 45 },
    sfx: { gain: 3, duck: -5.0, hp: 30 },
  },
  attack: 0.25, lead: 0.12, hold: 0.15, release: 0.9, merge: 1.1,
  // the hits that must land at full level: the duck lets go just before them
  fast: ['go', 'kick'],
  // the narrator's own dynamics: up for the hook and the stall, down and close for the explainer and the verdict
  voiceTrim: { title: 1.0, ramp: 0.8, stall: 1.0, suction: -1.5, fans: -2.0, tenth: -2.0, leave: -0.5, nozzles: -1.0, hover: -0.5, heli: -1.5, real: -0.5, end: 0.5 },
  voiceComp: { threshold: -24, knee: 8, ratio: 3, attack: 0.005, release: 0.14 },
  // the dynamics map: the launch and the kickflip swell; the explainer and the verdict sit back; the last shot opens up
  dyn: {
    music: [['go', -0.2, 0], ['go', 0.3, 3], ['replay', 0.5, 0], ['suck', -0.2, 0], ['suck', 1.0, -3], ['leave', -0.4, -3], ['leave', 0.2, 0], ['kick', -0.3, 0], ['kick', 0.4, 3], ['real', -0.6, 2], ['real', 0.8, -1.5], ['pov', -0.4, -1.5], ['pov', 2.0, 0], ['end', -2.5, 0]],
    amb: [['suck', -0.1, 0], ['suck', 1.0, -3], ['drop', -0.1, -3], ['brk', 0.0, 0], ['real', 0.5, -2]],
    sfx: [['go', -0.1, 2], ['replay', 0.0, 0], ['blast', -0.2, 0], ['blast', 0.2, 2.5], ['brk', 1.4, 0], ['kick', -0.5, 2], ['real', 0.0, 0]],
  },
  master: 1.5,
  ceiling: -1.5,   // dBTP, the limiter's ceiling (trLimit)
};
