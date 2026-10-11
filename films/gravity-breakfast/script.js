/* =====================================================================
   SCRIPT — "What If Gravity Doubled at Breakfast?" (Cinematic Hybrid prototype, 16:9)
   ★ The one file to edit for timing: the beats, the words, the POV head, the hands, the sound cues.
   Everything is a pure function of time (story seconds = film seconds; no CONFIG.edit).
   Plan and shot list: films/gravity-breakfast/PLAN.md
   ===================================================================== */

CONFIG.duration = 30.0;
CONFIG.seed = 20261011;
CONFIG.width = 1920; CONFIG.height = 1080;      // 16:9 prototype (film.js installs the 16:9 resize)
Object.assign(CONFIG.camera, {
  cameraHeight: 1.18, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7,
  breathingStrength: 0.0045, breathRate: 17, fov: 44, shakeStrength: 1.0,
});
CONFIG.render.shadowMapSize = 2048;
CONFIG.render.msaa = 4;

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (story seconds). Every other file keys off these.
// ---------------------------------------------------------------------------------------------------------------------
const GB = {
  title: [-0.5, 2.85],
  inside: 3.0,          // cut: exterior establishing → interior medium
  sip: [3.2, 4.7],      // first sip (cup up, sip, cup down)
  lift: 5.05,           // he lifts the cup again…
  g: 5.6,               // ★ gravity doubles (1.0 → 2.0 g, ~0.12 s ramp)
  close: 10.0,          // cut to the close-up (opens on a short top-down insert)
  side: 11.15,          // top-down → side close-up
  try: [11.5, 14.6],    // he tries to lift the cup
  rack: 13.2,           // rack focus: cup → face
  push: 15.45,          // push into his face (the transition)
  pov: 16.25,           // POV: eyes open
  stand: [17.0, 19.35], // tries to stand… and sinks back
  lamp: 19.6,           // looks up at the lamp
  waiter: 20.45,        // looks at the waiter; a cup slides off her tray
  smash: 21.155,        // = cast.smashT (cup B leaves the tray at waiter+0.5, free fall in 2 g)
  window: 21.9,         // turns to the window: the fountain
  wide: 23.0,           // cut outside: the wide reveal
  release: 25.4,        // the vendor's arm drops: balloons escape
  line: [27.6, 29.6],
  end: 30.0,
};

// gravity in g (1 → 2), with a very short ramp so it reads as instant but stays smooth for springs
function gbG(t) { return 1 + MathX.smooth(t, GB.g, GB.g + 0.12); }
// seconds since gravity doubled (negative before)
function gbSince(t) { return t - GB.g; }

// SOUND CUE MARKERS (story s): audio.js schedules from this table; the dev bar shows the same ids as events
const GB_CUES = [
  [0.0, 'bed', 'Room tone, birds, fountain bed; warm pluck motif'],
  [GB.inside, 'inside', 'Cut inside: exterior bed ducks'],
  [GB.sip[0] + 0.45, 'sip', 'Sip'],
  [GB.g, 'gdrop', 'G-DROP: sub hit + pressure swell'],
  [GB.g + 0.12, 'clunk', 'Cup slams onto the saucer'],
  [GB.g + 0.15, 'splash', 'Coffee splash'],
  [GB.g + 0.2, 'creak', 'Chair creaks and sinks'],
  [GB.g + 0.35, 'slump', 'Body slump, breath out'],
  [GB.g + 0.5, 'lamps', 'Lamp cords twang, swing creaks'],
  [GB.g + 0.9, 'waiterdown', 'Waiter buckles, tray rattles'],
  [GB.close, 'close', 'Cut to close-up: room ducks'],
  [GB.side - 0.5, 'gauge', 'Gauge ticks 1.0 → 2.0 g'],
  [GB.try[0], 'strain', 'Strain breaths, ceramic scrape'],
  [GB.push, 'whoosh', 'Push-in whoosh, heartbeat'],
  [GB.pov, 'eyes', 'Eyes open (air)'],
  [GB.stand[0], 'effort', 'Effort to stand, chair creak, sinks back'],
  [GB.lamp, 'swing', 'Lamp swinging overhead'],
  [GB.smash, 'smash', 'Cup smashes on the floor'],
  [GB.wide, 'outside', 'Cut outside: wind, fountain (lower), flapping'],
  [GB.release, 'balloons', 'Balloons escape: rubber squeak, whoosh up'],
  [GB.line[0], 'resolve', 'Music resolves under the end line'],
];

const SCRIPT = {
  meta: { title: 'What If Gravity Doubled at Breakfast?', wav: 'gravity-breakfast-soundtrack.wav' },

  events: [
    { id: 'start', time: 0.0, label: 'S1 establishing (exterior) + title' },
    { id: 'inside', time: GB.inside, label: 'S2 medium: breakfast' },
    { id: 'g', time: GB.g, label: '★ gravity doubles' },
    { id: 'close', time: GB.close, label: 'S4 top-down → close-up: the cup' },
    { id: 'push', time: GB.push, label: 'Transition: into his eyes' },
    { id: 'pov', time: GB.pov, label: 'S5 POV' },
    { id: 'wide', time: GB.wide, label: 'S6 wide reveal' },
    { id: 'balloons', time: GB.release, label: 'Payoff: balloons' },
    { id: 'line', time: GB.line[0], label: 'End line' },
  ],

  // The POV head (S5 only; the other shots override the camera in shots.js). Seated at his table, facing +X.
  camera: {
    baseY: 0,
    x: [[0, -2.72], [GB.window, -2.72], [GB.window + 0.9, -3.1, 'inOutSine'], [30, -3.12]],
    z: [[0, -2.78], [GB.window, -2.78], [GB.window + 0.9, -3.0, 'inOutSine'], [30, -3.02]],
    height: [[0, 1.13], [GB.stand[0], 1.13], [GB.stand[0] + 0.35, 1.07, 'inOutSine'], [GB.stand[0] + 1.55, 1.36, 'inOutCubic'], [GB.stand[1] - 0.35, 1.38],
      [GB.stand[1], 1.1, 'inQuad'], [GB.stand[1] + 0.25, 1.15, 'outQuad'], [30, 1.15]],
    yaw: [[0, -98], [GB.pov, -98], [GB.stand[0], -96], [GB.stand[1], -94], [GB.lamp, -95], [GB.lamp + 0.55, -92, 'inOutCubic'], [GB.waiter, -92],
      [GB.waiter + 0.5, -119, 'inOutCubic'], [GB.window, -121], [GB.window + 0.8, -13, 'inOutCubic'], [30, -11]],
    pitch: [[0, -50], [GB.pov, -50], [GB.stand[0], -46], [GB.stand[0] + 1.6, -30, 'inOutSine'], [GB.stand[1], -40], [GB.lamp, -24],
      [GB.lamp + 0.5, 34, 'inOutCubic'], [GB.waiter, 30], [GB.waiter + 0.5, -10, 'inOutCubic'], [GB.window, -10], [GB.window + 0.75, -2, 'inOutCubic'], [30, 0]],
    fov: [[0, 62], [GB.window + 0.6, 62], [GB.wide, 40, 'inOutSine'], [30, 40]],
    tilt: [[0, 0], [GB.stand[0] + 1.0, -2], [GB.stand[1], 2.5], [GB.stand[1] + 0.4, 0], [30, 0]],
    startles: [[GB.stand[1] - 0.05, 0.9], [GB.smash, 0.5]],
    shakes: [[GB.stand[1], 0.5, 0.35]],
  },

  // his hands in POV (dark skin, teal sleeves): pressing on the table edge to stand up
  hands: {
    right: [[0, 'hidden'], [GB.pov, 'gbRest!'], [GB.stand[0] - 0.3, 'gbPress'], [GB.stand[1] + 0.6, 'gbRest'], [GB.lamp + 0.2, 'hidden']],
    left: [[0, 'hidden'], [GB.pov, 'gbRest!'], [GB.stand[0] - 0.2, 'gbPress'], [GB.stand[1] + 0.6, 'gbRest'], [GB.lamp + 0.2, 'hidden']],
  },

  tracks: {
    pov: [[0, 0], [GB.pov - 0.01, 0], [GB.pov, 1, 'step'], [GB.wide - 0.01, 1], [GB.wide, 0, 'step'], [30, 0]],
  },

  hud: {
    title: { in: GB.title[0], out: GB.title[1], fi: 0.2, fo: 0.45, cls: 'big center',
      html: '<span class="kick">WHAT IF GRAVITY</span><span class="hero">DOUBLED</span><span class="kick">AT BREAKFAST?</span>' },
    captions: [
      { t: 3.35, until: 5.3, text: 'An ordinary breakfast.' },
      { t: 6.3, until: 9.6, text: 'Then gravity doubles. Everything weighs twice as much.' },
      { t: 11.5, until: 13.6, text: 'His coffee now feels twice as heavy.' },
      { t: 13.7, until: 15.4, text: 'So does every part of him.' },
      { t: 17.2, until: 19.4, text: 'Standing up is like lifting your own body.' },
      { t: 20.5, until: 22.2, text: 'Things fall faster. And harder.' },
      { t: 23.6, until: 25.3, text: 'The fountain only reaches half as high.' },
      { t: 25.6, until: 27.4, text: 'But the balloons rise faster.' },
    ],
    readouts: [],
    endLine: { t: GB.line[0], until: GB.line[1] + 0.4, text: 'Buoyancy doubles too.<br>Air weighs twice as much.' },
  },
};

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
