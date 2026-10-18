/* =====================================================================
   MIX — stem levels and the dynamics map for shrinking.html (read by audio.js).
     gain  stem level (dB) · hp  high-pass (Hz) · dyn  [beat, offset s, dB] keys
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
window.SH_MIX = {
  stems: {
    music: { gain: 0, hp: 35 },
    amb: { gain: 9, hp: 30 },
    sfx: { gain: 3, hp: 25 },
  },
  dyn: {
    // music steps back under the quake, the proton storm and the black hole
    music: [[0, 0, 0], [112.9, 0, 0], [113.3, 0, -2], [117.4, 0, -2], [117.8, 0, 0], [347.5, 0, 0], [348.2, 0, -2], [366, 0, -2], [367, 0, 0], [432.5, 0, 0], [433.2, 0, -1.5], [444, 0, -1.5], [444.5, 0, 0]],
    amb: [],
    // sfx steps back under Mum's kitchen, the fall and the flash
    sfx: [[0, 0, 0], [42.7, 0, 0], [43.0, 0, -4], [44.2, 0, -4], [44.8, 0, 0], [112.9, 0, 0], [113.3, 0, -4.5], [126.4, 0, -4.5], [127.4, 0, 0], [443.8, 0, 0], [444.0, 0, -3], [446, 0, -3], [447, 0, 0]],
  },
  master: 5,
  ceiling: -1.5,   // dBTP, the limiter's ceiling (shLimit)
};
