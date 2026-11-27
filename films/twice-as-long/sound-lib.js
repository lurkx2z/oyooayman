/* =====================================================================
   SOUND-LIB — shared helpers for the sound files (being written).
   ===================================================================== */
const twEv = (t, a, b) => MathX.smooth(t, a, b);                                       // 0 → 1 from a to b
const twWn = (t, a, b, fi = 0.3, fo = 0.3) => twEv(t, a - fi, a) * (1 - twEv(t, b, b + fo));   // 1 inside [a, b]
const TW_SOUND_FNS = [twEv, twWn];
