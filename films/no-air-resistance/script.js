/* =====================================================================
   SCRIPT — "WHAT IF AIR RESISTANCE SUDDENLY DISAPPEARED?"
   ★ The one file to edit for timing: the beats, the words, the readouts, your head (camera), your hands.
   Everything is a pure function of time (STORY seconds; with CONFIG.edit the final film is a cut of it).
   A 'step' key on a track is a hard cut. Plan: films/no-air-resistance/PLAN.md
   Template structure = the Oxygen / Friction format (docs/VIDEO_FORMAT.md):
     centred title over a normal moving street → the rule changes under the title → consequences → payoff → line.
   ===================================================================== */

CONFIG.duration = 30.0;          // story length (set the real one; the film can be cut shorter with CONFIG.edit)
CONFIG.seed = 20270101;          // change per film: every "random" choice derives from it
Object.assign(CONFIG.camera, {
  cameraHeight: 1.68, walkSpeed: 1.3, bobStrength: 0.014, bobFrequency: 1.72,
  breathingStrength: 0.005, breathRate: 15, fov: 66, shakeStrength: 1.0,
});
CONFIG.render.shadowMapSize = 2048;
// THE CUT (optional): story intervals kept, in order; a third number plays that stretch slower.
// CONFIG.edit = [[0, 12.0], [13.0, 30.0]];

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (story seconds). Every other file keys off these, so retiming is one edit here.
// ---------------------------------------------------------------------------------------------------------------------
const NR = {
  title: [-0.5, 3.4],     // starts before 0 so it is fully visible on frame 1
  rule: [1.6, 2.6],       // the rule changes UNDER the title (the readout falls)
  first: 4.2,             // consequence 1: at you
  second: 10.0,           // consequence 2: something different
  third: 15.5,            // consequence 3 / scale jump
  payoff: 21.0,           // the biggest event
  line: [25.0, 29.4],     // the closing line
  end: 30.0,
};

// the rule's value over time (1 = normal → 0 = changed). The HUD, the grade and the sound all read this one track.
function nrRule(t) { return 1 - MathX.smooth(t, NR.rule[0], NR.rule[1]); }

const SCRIPT = {
  meta: { title: 'WHAT IF AIR RESISTANCE SUDDENLY DISAPPEARED?', wav: 'no-air-resistance-soundtrack.wav' },

  events: [
    { id: 'start', time: 0.0, label: 'Normal street; the title' },
    { id: 'rule', time: NR.rule[0], label: 'The rule changes' },
    { id: 'first', time: NR.first, label: 'Consequence 1' },
    { id: 'second', time: NR.second, label: 'Consequence 2' },
    { id: 'third', time: NR.third, label: 'Consequence 3' },
    { id: 'payoff', time: NR.payoff, label: 'Payoff' },
    { id: 'line', time: NR.line[0], label: 'The closing line' },
  ],

  // your head: walking down the right-hand sidewalk toward −Z, stopping, looking around
  camera: {
    baseY: 0.15,                                        // the kerb height you stand on
    x: [[0, 9.4], [30, 9.4]],
    z: [[0, 6.0], [12.0, -9.0, 'linear'], [30, -9.0]],  // linear = steady walking (bob is automatic)
    height: [[0, 1.68], [30, 1.68]],
    yaw: [[0, 4], [4.2, 4], [4.8, 22, 'inOutCubic'], [9.5, 18], [10.2, -14, 'inOutCubic'], [15.0, -10], [15.6, 6], [30, 4]],
    pitch: [[0, -3], [4.2, -3], [4.8, -12], [9.5, -8], [15.6, 6], [21, 2], [30, -2]],
    fov: [[0, 66], [30, 66]],
    startles: [[NR.rule[0] + 0.2, 0.8], [NR.payoff, 1.0]],     // REQUIRED (use [] if none): [t, strength]
    shakes: [[NR.payoff, 0.8, 0.5]],                                 // REQUIRED (use [] if none): [t, amp, decay], a decaying impulse, never continuous
  },

  // your hands (camera-space poses: hidden · ear · reach · look · brace + film poses in film.js; 'name!' = snap on a cut).
  // Show a hand only when it DOES something (brace, grip, reach toward someone, shield, hold a prop), keep it clear of
  // the caption band and the HUD, and aim it at its contact point. A bad hand is worse than no hand. Example:
  //   right: [[0, 'hidden'], [4.6, 'reach'], [6.4, 'hidden']],
  hands: {
    right: [[0, 'hidden']],
    left: [[0, 'hidden']],
  },

  // scalar story tracks → SCRIPT_TRACKS.name.value(t) (camera, hands, HUD, grade and sound can all read them)
  tracks: {
    pov: [[0, 1], [30, 1]],                // 0 = a cinematic shot with no body motion
  },

  hud: {
    title: { in: NR.title[0], out: NR.title[1], fi: 0.2, fo: 0.4, cls: 'big center', html: '<span class="kick">WHAT IF AIR RESISTANCE</span><span class="hero">SUDDENLY</span><span class="kick">DISAPPEARED?</span>' },
    captions: [
      { t: 5.0, until: 8.2, text: 'Replace with consequence one.' },
      { t: 10.6, until: 13.6, text: 'Then something else changes.' },
      { t: 16.0, until: 19.4, text: 'Short. Four to nine words.' },
    ],
    readouts: [
      { from: 0.0, until: 24.0, top: 220, label: 'THE RULE', value: (t) => nrRule(t).toFixed(1), sub: (t) => (t >= NR.rule[1] ? 'CHANGED' : 'NORMAL') },
    ],
    endLine: { t: NR.line[0], until: NR.line[1], text: 'Your closing line…<br>…in two beats.' },
  },
};

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
