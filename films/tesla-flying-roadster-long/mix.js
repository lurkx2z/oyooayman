/* =====================================================================
   MIX — stem levels, ducking and the dynamics map for tesla-flying-roadster-long.html (read by audio.js).
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
  voiceTrim: { open: 1.0, title: 1.0, did: 0.5, stall: 1.0, numbers: -1.0, pressure: -1.5, twog: -1.0, tenth: -2.0, old: -0.5, newton: -1.0, kilos: -1.5, tanks: -1.0, seconds: -0.5, check: -1.0, shown: -1.5, promise: -1.5, legal: -1.5, human: 0.5, blood: 0.5, end: 0.5 },
  voiceComp: { threshold: -24, knee: 8, ratio: 3, attack: 0.005, release: 0.14 },
  // the dynamics map: the launch and the kickflip swell; the explainer and the verdict sit back; the last shot opens up
  dyn: {
    music: [['go', -0.2, 0], ['go', 0.3, 4], ['questions', 0.5, 0], ['three', 0.0, -2], ['plane', 1.0, 0], ['race', 0.0, 2], ['theory', 0.5, -1], ['catch', 5.5, 3], ['toy', 0.0, -4], ['toyRun', -0.2, 2], ['numbers', 0.5, -4], ['flatFall', -0.3, 0], ['flatFall', 0.4, 4], ['suck', -0.2, 0], ['suck', 1.0, -4], ['old', 0.0, 0], ['surface', 0.5, -3], ['leave', -0.4, -3], ['leave', 0.2, 0], ['newton', 0.5, -4], ['nozzles', 0.0, -1], ['blast', -0.2, 0], ['blast', 0.4, 4], ['brk', 1.0, 0], ['hover', 0.5, -3], ['heli', 0.0, -1], ['hop', 0.0, 0], ['kick', -0.3, 0], ['kick', 0.4, 4], ['real', -0.6, 2], ['real', 0.8, -4], ['human', 0.0, -2], ['pov', -0.4, -1.5], ['pov', 2.0, 2], ['end', -2.5, 0]],
    amb: [['toy', 0.0, -4], ['toyRun', 1.0, 0], ['numbers', 0.0, -3], ['flat', 0.0, 0], ['suck', -0.1, 0], ['suck', 1.0, -4], ['old', 0.0, 0], ['surface', 0.0, -3], ['drop', -0.1, -3], ['newton', 0.0, -4], ['brk', 0.0, 0], ['hover', 0.5, -3], ['heli', 0.0, 0], ['real', 0.5, -4], ['human', 0.0, -1]],
    sfx: [['go', -0.1, 3], ['questions', 0.0, 0], ['catch', 5.0, 0], ['catch', 5.6, 3], ['toy', 0.0, 0], ['flatFall', -0.2, 0], ['flatFall', 0.3, 3], ['suck', 0.0, 0], ['blast', -0.2, 0], ['blast', 0.2, 3], ['brk', 1.4, 0], ['kick', -0.5, 3], ['real', 0.0, 0]],
  },
  master: 1.5,
  ceiling: -1.5,   // dBTP, the limiter's ceiling (trLimit)
};
