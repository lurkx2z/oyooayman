/* =====================================================================
   MIX — stem levels and the dynamics map for sound-faster-light.html (read by audio.js).
     gain  stem level (dB) · hp  high-pass (Hz) · dyn  [beat, offset s, dB] keys (beat: an SF key or a film second)
   The owner's rule (31 October 2026): the music clearly leads, the beds about 10 dB under it, measured stem by stem
   (solo renders, ebur128 in 10 s windows; the numbers are in EPISODE_REPORT.md § Sound).
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
window.SF_MIX = {
  stems: {
    music: { gain: 3.5, hp: 32 },   // the score leads (the owner's rule of 31 October 2026)
    amb: { gain: -1.0, hp: 28 },    // rain, wind, the corn, the tornado's roar (under the score by ~10 dB, measured)
    sfx: { gain: -3.0, hp: 25 },    // thunder, voices, the horn, the bats, the sirens, the phone, the run, the yard light
  },
  dyn: {
    // the score's quiet stretches (the flash and the rule, the far sounds and the bats, the sirens, the run, the wind's
    // end, the hug) lifted so it still leads the storm, the sirens and the roar; keyed to beats and physics events, so a
    // caption change moves them with the picture
    music: (() => {
      const B = sfB, F = sfFilmAt, E = SFE, ty = F(E.yardHit), tn = F(E.hansen), tf = F(E.found);
      return [[0, 0, 0], [B('start') + 6, 0, 0], [B('start') + 10, 0, 3], [B('rumble') - 2, 0, 3], [B('rumble') + 1, 0, 0],
        [B('far') - 1, 0, 0], [B('far') + 1, 0, 2.5], [B('tornado') - 1, 0, 2.5], [B('tornado') + 2, 0, 1],
        [B('corn') + 6, 0, 1], [B('corn') + 9, 0, 3], [ty - 0.3, 0, 3], [ty, 0, 1], [B('wind') + 4, 0, 1], [B('wind') + 6, 0, 4], [tn + 2, 0, 4], [tn + 4, 0, 1],
        [tf - 0.2, 0, 1], [tf + 2, 0, 4], [B('back') - 0.5, 0, 4], [B('back') + 1, 0, 1], ['end', -0.04, 1], ['end', 0, -60]];
    })(),
    amb: [[0, 0, 0], ['end', -0.04, 0], ['end', 0, -60]],
    sfx: [['end', -0.04, 0], ['end', 0, -60]],
  },
  master: 7.5,
  eq: [['lowshelf', 110, -2.0], ['highshelf', 3500, 2]],
  ceiling: -2.5,   // dBTP, the limiter's ceiling (sfLimit)
};
