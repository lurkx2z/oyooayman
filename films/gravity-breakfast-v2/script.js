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
  title: [-0.3, 2.4],   // V2: the title sits over the café interior from frame 1 (no exterior opener)
  inside: 0.0,
  sip: [0.35, 1.75],    // first sip (cup up, sip, cup down)
  lift: 2.45,           // he lifts the cup again…
  g: 3.0,               // ★ gravity doubles (1.0 → 2.0 g, ~0.12 s ramp) — gbG(t) is the one gravity value for physics, HUD and story
  room: 4.15,           // cut: the whole room reacts (lamps, the waiter buckles)
  close: 6.9,           // cut: the struggle close-up (one shot, one cup)
  try: [7.2, 12.5],     // brace → attempt 1 (fails) → two-handed attempt 2 (a sip) → sets it down
  a1: [7.95, 9.15],     // attempt 1: lifts 3 cm, trembles, drops it back
  a2: [9.9, 12.45],     // attempt 2: both hands, head down to meet the cup
  rack: 8.4,            // rack focus: hands → face
  push: 12.75,          // push into his face (the transition)
  pov: 13.5,            // POV: eyes open
  stand: [14.1, 16.4],  // tries to stand… and sinks back
  lamp: 16.65,          // looks up at the lamp
  waiter: 17.45,        // looks at the waiter; a cup slides off her tilted tray
  smash: 18.155,        // = cast.smashT (cup leaves the tray at waiter+0.5, free fall in 2 g)
  window: 18.75,        // turns to the window: the fountain
  wide: 19.9,           // cut outside: the wide reveal
  release: 23.4,        // the vendor's arm drops: balloons escape
  line: [26.4, 29.6],
  end: 30.0,
};

// gravity in g (1 → 2), with a very short ramp so it reads as instant but stays smooth for springs
function gbG(t) { return 1 + MathX.smooth(t, GB.g, GB.g + 0.12); }
// seconds since gravity doubled (negative before)
function gbSince(t) { return t - GB.g; }

// SOUND CUE MARKERS (story s): audio.js schedules from this table; the dev bar shows the same ids as events
const GB_CUES = [
  [0.0, 'bed', 'Room tone, birds, fountain bed; warm pluck motif'],
  [GB.room, 'room', 'Cut wide: lamps, tray rattle'],
  [GB.sip[0] + 0.45, 'sip', 'Sip'],
  [GB.g, 'gdrop', 'G-DROP: sub hit + pressure swell'],
  [GB.g + 0.12, 'clunk', 'Cup slams onto the saucer'],
  [GB.g + 0.15, 'splash', 'Coffee splash'],
  [GB.g + 0.2, 'creak', 'Chair creaks and sinks'],
  [GB.g + 0.35, 'slump', 'Body slump, breath out'],
  [GB.g + 0.5, 'lamps', 'Lamp cords twang, swing creaks'],
  [GB.g + 0.9, 'waiterdown', 'Waiter buckles, tray rattles'],
  [GB.close, 'close', 'Cut to close-up: room ducks'],
  [GB.g + 0.1, 'gauge', 'Gauge ticks 1.0 → 2.0 g'],
  [GB.try[0], 'brace', 'Palm presses on the table, breath in'],
  [GB.a1[0], 'strain', 'Attempt 1: strain, tremble'],
  [GB.a1[1], 'clink', 'Cup drops back onto the saucer'],
  [GB.a2[0], 'strain2', 'Attempt 2: two hands, breaths'],
  [GB.a2[1], 'setdown', 'Cup set down; relief exhale'],
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
  meta: { title: 'What If Gravity Doubled at Breakfast?', wav: 'gravity-breakfast-v2-soundtrack.wav' },

  events: [
    { id: 'start', time: 0.0, label: 'S2 medium: breakfast + title' },
    { id: 'room', time: GB.room, label: 'S3 wide: the room reacts' },
    { id: 'g', time: GB.g, label: '★ gravity doubles' },
    { id: 'close', time: GB.close, label: 'S4 close-up: the struggle' },
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
      { t: 3.9, until: 6.6, text: 'Then gravity doubles. Everything weighs twice as much.' },
      { t: 7.4, until: 9.7, text: 'His arm alone now weighs as much as 8 kilograms.' },
      { t: 10.1, until: 12.4, text: 'Every sip becomes a workout.' },
      { t: 14.3, until: 16.4, text: 'Standing up is like carrying a second you.' },
      { t: 17.2, until: 18.7, text: 'Things fall faster. And harder.' },
      { t: 20.4, until: 22.9, text: 'The fountain only reaches half as high.' },
      { t: 23.6, until: 25.9, text: 'But the balloons rise faster.' },
    ],
    readouts: [],
    endLine: { t: GB.line[0], until: GB.line[1] + 0.4, text: 'Buoyancy doubles too.<br>Air weighs twice as much.' },
  },
};

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
