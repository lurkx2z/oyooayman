/* =====================================================================
   MIX — stem levels and the dynamics map for sudden-billionaire.html (read by audio.js).
     gain  stem level (dB) · hp  high-pass (Hz) · dyn  [beat, offset s, dB] keys
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
// the middle's lift (dB), by beat: the open and the ending stay as they are
function SB_LIFT(k) {
  return [['mum', -1, 0], ['mum', 1, 2 * k], ['interest', 0, 3.5 * k], ['house', 0, 2.5 * k], ['six', 0, 3.5 * k], ['enough', 0, 3 * k],
    ['boss', 0, 1.5 * k], ['cookies', 0, 4 * k], ['views', 0, 3 * k], ['yacht', 0, 0.5 * k], ['years', 0, 2 * k], ['pledge', 0, 2.5 * k],
    ['real', 0, 4 * k], ['scott', 0, 3 * k], ['feeney', 0, 3 * k], ['point', 0, 1 * k], ['again', 0, 0]];
}
window.SB_MIX = {
  stems: {
    music: { gain: 0, hp: 32 },
    amb: { gain: 8, hp: 28 },
    sfx: { gain: 9, hp: 25 },
  },
  // (measured: the open and the ending sat about 9 dB above the middle; the middle is lifted so phones hold it)
  dyn: {
    music: SB_LIFT(1),
    amb: SB_LIFT(1),
    sfx: SB_LIFT(0.6),
  },
  master: 10,
  eq: [['lowshelf', 110, -2.5], ['highshelf', 3500, 2]],
  ceiling: -1.5,   // dBTP, the limiter's ceiling (sbLimit)
};
