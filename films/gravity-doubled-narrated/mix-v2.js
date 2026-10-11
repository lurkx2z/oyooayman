/* =====================================================================
   MIX v2 — the stem levels and the ducking for gravity-doubled-narrated-v2.html (read by audio-v2.js).
   The five stems stay separate until the final export: mix-v2.py renders each one on its own, measures it (EBU R128),
   sets the levels below from those measurements, sums the stems and masters the result.
     gain      stem level in dB (written back here by mix-v2.py after it measures the stems)
     duck      how far the stem dips under the narrator, in dB (0 = never)
     hp        high-pass in Hz (keeps sub rumble out: phones cannot play it and it eats headroom)
   Ducking follows the real word times (window.GN): words closer than `merge` seconds form one spoken window; the duck
   starts `attack + lead` before the first word, holds, then releases `hold` after the last word over `release`.
   ===================================================================== */
window.GB_MIX = {
  stems: {
    voice: { gain: -4.5, duck: 0, hp: 80 },
    music: { gain: -2.2, duck: -8.0, hp: 45 },
    amb: { gain: 5.1, duck: -7.0, hp: 50 },
    foley: { gain: -3.6, duck: -2.5, hp: 60 },
    sfx: { gain: -0.4, duck: -1.5, hp: 35 },
  },
  attack: 0.22, lead: 0.1, hold: 0.12, release: 0.8, merge: 1.2,
  // per-line trims (dB) that even out the five lines after the voice chain (measured and written by mix-v2.py)
  voiceTrim: { 'a-opening': -1.2, 'b-cafe': 1.9, 'c-falling': -0.3, 'd-outside': 0.0, 'e-ending': -0.3 },
  // the voice chain: a gentle presence lift for phone speakers, then a slow-ish compressor for an even level
  voiceComp: { threshold: -24, knee: 8, ratio: 3, attack: 0.005, release: 0.14 },
  // mastering (mix-v2.py): integrated loudness and the true-peak ceiling of the exported WAV (AAC adds ≈1 dB later)
  target: -15.0, ceiling: -2.0,
};
