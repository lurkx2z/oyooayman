/* =====================================================================
   MIX v3 — the stem levels, the ducking and the DYNAMICS MAP for gravity-doubled-narrated-v3.html (read by audio-v3.js).
   v3 keeps v2's balance and ducking and adds what v2 lacked: dynamics. The overall loudness stays the same, but the film
   now breathes: it goes quiet before the moments that matter, so the hits land, and it builds where the action builds.
     gain      stem level in dB (v2's measured levels; mix-stems.py --use-gains exports exactly these)
     duck      how far the stem dips under the narrator, in dB (0 = never); as in v2
     hp        high-pass in Hz
     dyn       the dynamics map: keyframes [beat, offset (s), dB] per stem, eased between keys (raised cosine); 0 dB = the
               stem's level in v2. A beat is a key of window.GB (g, down, drop, out, step[0]...) or a line's spoken edges
               (A< A> … E< E>: the first and the last word of each narration line), so the map follows the film's timing.
   Ducking and the map multiply. The master has no glue compressor (glue: false): the stems keep their own dynamics and
   only the true-peak limiter touches the loudest hits.
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
  // per-line trims (dB) that even out the five lines after the voice chain (measured by mix-stems.py for v2)
  voiceTrim: { 'a-opening': -1.2, 'b-cafe': 1.9, 'c-falling': -0.3, 'd-outside': 0.0, 'e-ending': -0.3 },
  voiceComp: { threshold: -24, knee: 8, ratio: 3, attack: 0.005, release: 0.14 },
  dyn: {
    // the beds: a breath-in before gravity doubles; the café holds its breath around the cup; near silence before the
    // drop; the slow-motion replay muffled; the square opens up on the wide; everything fades with the last picture
    amb: [['g', -0.45, 0], ['g', -0.07, -10], ['g', 0.05, 0], ['g', 1.6, 0], ['A>', 2.2, -3],
      ['lift', 0, -4], ['top', 0, -6], ['down', -0.5, -8], ['down', 0.3, -8], ['letGo', 0.8, -3],
      ['C>', 0, -3], ['drop', -0.55, -13], ['drop', 0.55, -13], ['drop', 1.0, -6], ['replay', 0.3, -9], ['replayEnd', 0.3, -3],
      ['out', -0.1, 0], ['D>', 0.3, 0], ['world', 0, -3], ['rise2[0]', 0, -4], ['step[0]', 0.85, -2], ['wide2', 0.6, 1], ['pull', 0, 0],
      ['end', -2.0, 0], ['end', 0, -14]],
    // the score: soft into the cup scene, a crescendo to the top of the lift, a hush before the set-down, a build under
    // the end of line C cut to silence before the clamps, a crescendo through the stand-up to the step, then away
    music: [['g', 0.3, 0], ['grip', 0, -6], ['lift', 0, -4], ['top', 0, -1], ['lower', 0, 0], ['down', -0.75, -3], ['down', -0.32, -16],
      ['down', -0.02, -16], ['down', 0.08, 0], ['letGo', 0.5, 1], ['exp', 0, 0],
      ['lane2[0]', 0, 0], ['C>', 0, 2], ['drop', -0.62, 3], ['drop', -0.46, -40], ['drop', 0.7, -40], ['drop', 0.76, 0],
      ['out', 0, 0], ['world', 0, -7], ['rise2[0]', 0, -5], ['rise2[0]', 1.6, -2.5], ['step[0]', 0, -1], ['step[0]', 0.9, 2],
      ['wide2', 0.4, 1.5], ['wide2', 1.8, 0], ['pull', 0, -1], ['E<', 0, 0], ['end', -2.0, 0], ['end', 0, -9]],
    // movement: closer and more intimate while he fights the cup and while he stands up
    foley: [['grip', 0, 0], ['lift', 0, 2], ['down', 1.4, 2], ['exp', 0, 0], ['world', 0, 0], ['rise2[0]', -0.6, 1.5], ['step[1]', 1.0, 1.5], ['wide2', 2.0, 0]],
    // impacts: the set-down, the drop and his step get a little more weight
    sfx: [['down', -0.5, 0], ['down', -0.06, 3], ['down', 0.7, 3], ['down', 1.3, 0], ['drop', -0.2, 0], ['drop', -0.05, 2], ['replay', 0, 2],
      ['replay', 0.4, 0], ['rise2[0]', -0.3, 0], ['rise2[0]', -0.1, 2], ['step[0]', 1.6, 2], ['wide2', 1.0, 0]],
  },
  glue: false,
  // mastering (mix-stems.py): integrated loudness and the true-peak ceiling of the exported WAV (AAC adds a little later)
  target: -15.0, ceiling: -1.8,
};
