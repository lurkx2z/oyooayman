/* =====================================================================
   MIX — stem levels and the dynamics map for no-light.html (read by audio.js).
     gain  stem level (dB) · hp  high-pass (Hz) · dyn  [beat, offset s, dB] keys (beat: a NL key or a film second)
   The owner's rule (31 October 2026): the music clearly leads, the beds about 10 dB under it, measured stem by stem
   (solo renders, ebur128 in 10 s windows; the numbers are in EPISODE_REPORT.md § Sound).
   Targets (docs + owner): −16 to −14 LUFS integrated, true peak ≤ −1 dBTP, a real loudness range (not flat).
   ===================================================================== */
window.NL_MIX = {
  stems: {
    music: { gain: 2.5, hp: 32 },  // the score leads (the owner's rule of 31 October 2026)
    amb: { gain: 0.5, hp: 28 },    // the wind over the snow, the town, the fire, the road; the crowd in the dark
    sfx: { gain: -0.5, hp: 25 },   // blades, falls, breathing, the phone, the plane, the crash, the car, the driver, the ice
  },
  dyn: {
    // the score is sparse by the fire, under the plane, on the road (a pulse, then silence before the bang) and by the
    // glowing hole: lifted 2–3 dB there so it still leads the fire's roar, the jet and the idling engines; the sink sat
    // 8 dB over the rest: down 4 dB. Keyed to the beats (film seconds from timing.js and physics.js), so a caption
    // change moves them with the picture.
    music: (() => {
      const fire = nlB('fire'), stop = nlFilmAt(NLE.manStop), plane = nlB('plane'), road = nlB('road'), hit = nlFilmAt(NLE.hit),
        crack = nlFilmAt(NLE.crack), sink = nlFilmAt(NLE.sink), steam = nlB('steam'), sing = nlB('sing');
      return [[0, 0, 0], [fire - 1.4, 0, 0], [nlC('fire', 0) - 0.45, 0, 3], [stop - 0.6, 0, 3], [stop + 1.4, 0, 0],
        [plane - 0.5, 0, 0], [plane + 0.5, 0, 2], [road - 1.5, 0, 2], [road, 0, 3], [hit - 0.3, 0, 3], [hit, 0, 0],
        [crack - 1.4, 0, 0], [crack + 0.6, 0, -4], [sink + 1.6, 0, -4], [sink + 4.1, 0, 0],
        [steam - 0.5, 0, 0], [steam + 0.5, 0, 2.5], [sing, 0, 2.5], [sing + 1, 0, 0], ['end', -0.04, 0], ['end', 0, -60]];
    })(),
    amb: [[0, 0, 0], ['end', -0.04, 0], ['end', 0, -60]],
    sfx: [['end', -0.04, 0], ['end', 0, -60]],
  },
  master: 7.5,
  eq: [['lowshelf', 110, -2.5], ['highshelf', 3500, 2]],
  ceiling: -2.5,   // dBTP, the limiter's ceiling (nlLimit)
};
