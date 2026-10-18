/* =====================================================================
   MIX — stem levels and the dynamics map for shrinking.html (read by audio.js).
     gain  stem level (dB) · hp  high-pass (Hz) · dyn  [beat, offset s, dB] keys
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
window.SH_MIX = {
  stems: {
    music: { gain: 0, hp: 35 },
    amb: { gain: 0, hp: 30 },
    sfx: { gain: 0, hp: 25 },
  },
  dyn: { music: [], amb: [], sfx: [] },
  master: 0,
  ceiling: -1.5,   // dBTP, the limiter's ceiling (shLimit)
};
