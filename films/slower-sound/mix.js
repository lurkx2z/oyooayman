/* =====================================================================
   MIX — stem levels and the dynamics map for slower-sound.html (read by audio.js).
     gain  stem level (dB) · hp  high-pass (Hz) · dyn  [beat, offset s, dB] keys
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
window.SS_MIX = {
  stems: {
    music: { gain: 0, hp: 32 },
    amb: { gain: 8, hp: 28 },
    sfx: { gain: 9, hp: 25 },
  },
  dyn: {
    // (the score steps back wherever the picture is about a sound)
    music: [['sirenPass', -5, 0], ['sirenPass', -4, -7], ['sirenPass', 3, -7], ['sirenPass', 4.5, 0], ['carPass', -3, 0], ['carPass', -2, -7], ['carPass', 4, -7], ['carPass', 5.5, 0], ['musicPass', -4, 0], ['musicPass', -3, -7], ['musicPass', 4, -7], ['musicPass', 5.5, 0], ['bellHeard', -2.5, 0], ['bellHeard', -1.5, -7], ['bellHeard', 3, -7], ['bellHeard', 4.5, 0], ['kick', -1.5, 0], ['kick', -0.5, -7], ['kick', 3, -7], ['kick', 4.5, 0], ['clapAt', -1.5, 0], ['clapAt', -0.5, -7], ['clapAt', 8, -7], ['clapAt', 9.5, 0], ['tuneHere', -2, 0], ['tuneHere', -1, -7], ['tuneHere', 8, -7], ['tuneHere', 9.5, 0], ['meow', -1, 0], ['meow', -0, -7], ['meow', 12, -7], ['meow', 13.5, 0]],
    amb: [], sfx: [],
  },
  master: 6,
  eq: [['lowshelf', 110, -2.5], ['highshelf', 3500, 2]],
  ceiling: -1.5,   // dBTP, the limiter's ceiling (ssLimit)
};
