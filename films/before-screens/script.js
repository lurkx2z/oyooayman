/* =====================================================================
   SCRIPT — "How did kids have fun before screens?"
   The whole film as data: story events, camera path, hand poses, HUD,
   and every child's performance. Phase A (0–15 s) is built; see PLAN.md
   for the full 90-second shot list.

   World layout (metres, y up, the street runs along Z, north = -Z):
     dirt street |x| < 5, stone gutters to 5.35, plank sidewalks to 7.35 (y 0.12)
     porches from |x| = 7.6, house fronts at |x| = 9.8 (porch deck y 0.55)
     the viewer's house is on the east side at z ≈ 0; its front door opens from
     a modern bedroom (the set inside it) straight onto the 1905 porch.
   ===================================================================== */

// film-wide settings on top of the shared defaults (js/config.js)
CONFIG.duration = 15.0;                 // Phase A. Grows to 90 s as phases B–E are built.
CONFIG.seed = 19050611;
Object.assign(CONFIG.camera, {
  cameraHeight: 1.3,       // a ~10-year-old's eye height
  walkSpeed: 1.25,
  bobStrength: 0.013,
  bobFrequency: 2.05,      // shorter steps than an adult
  runStrideGain: 0.55,     // running: longer strides, so ~3.5 steps a second instead of a frantic patter
  breathingStrength: 0.004,
  breathRate: 18,
  fov: 62,
});
CONFIG.render.shadowMapSize = 4096;

const BS = {
  street: { half: 5.0, gutter: 5.35, walk: 7.35, walkY: 0.12 },
  porchFront: 7.6, houseFront: 9.8, porchY: 0.55,
  room: { x0: 9.8, x1: 13.5, z0: -0.75, z1: 3.15, y: 0.55, h: 2.55, doorZ: 1.2, doorW: 0.86, doorH: 2.05 },
  seat: { x: 12.45, z: 1.42 },
};

const SCRIPT = {
  meta: { title: 'How did kids have fun before screens?', wav: 'before-screens-soundtrack.wav' },

  events: [
    { id: 'start', time: 0.0, label: 'Evening bedroom: scrolling at 1 %' },
    { id: 'battery_low', time: 1.45, label: 'Low battery card' },
    { id: 'phone_dies', time: 1.95, label: 'The phone dies' },
    { id: 'taps', time: 2.5, label: 'Tap, tap: nothing' },
    { id: 'look_up', time: 3.4, label: 'Look up: daylight round the door' },
    { id: 'stand', time: 4.6, label: 'Stand up' },
    { id: 'door', time: 5.95, label: 'The door opens: light' },
    { id: 'reveal', time: 6.9, label: 'A town street, c. 1905' },
    { id: 'steps', time: 8.4, label: 'Down the porch steps' },
    { id: 'run_past', time: 9.9, label: 'A boy runs past' },
    { id: 'join', time: 12.4, label: 'Join in: run with them' },
    { id: 'phase_b', time: 15.0, label: '(phase B: marbles)' },
  ],

  // keyframed story tracks (linear unless an ease is given)
  tracks: {
    // 0 = the modern room's look, 1 = the sunlit past
    day: [[0, 0], [6.35, 0], [6.4, 1, 'step']],
    phoneLight: [[0, 1], [1.95, 1], [2.12, 0]],
    // warm white flood when the door opens, then the eyes adjust
    flash: [[0, 0], [5.95, 0], [6.45, 0.96, 'inQuad'], [6.75, 0.96], [7.9, 0, 'outQuad']],
    adapt: [[0, 0], [6.4, 0], [6.5, 1, 'step'], [9.0, 0, 'outQuad']],
    // door swing (0 closed → 1 fully open, ~100°)
    door: [[0, 0], [5.95, 0], [6.15, 0.18, 'inQuad'], [6.9, 1, 'outCubic']],
    // daylight leaking round the closed door (it brightens as you look at it)
    leak: [[0, 0.5], [3.2, 0.5], [4.3, 1.0], [5.95, 1.0], [6.3, 0]],
  },

  camera: {
    baseY: 0,               // heights below are absolute eye heights (floor heights are in the track)
    x: [[0, BS.seat.x], [4.6, BS.seat.x], [5.3, 12.2], [6.0, 10.75, 'linear'], [6.9, 9.3, 'linear'], [8.4, 8.75, 'outQuad'],
      [9.5, 6.95], [9.6, 6.7], [12.1, 6.6], [12.6, 6.1, 'inQuad'], [15.0, 4.7, 'linear']],
    z: [[0, BS.seat.z], [4.6, BS.seat.z], [5.3, 1.4], [6.0, 1.26, 'linear'], [6.9, 1.2, 'linear'], [8.4, 1.15],
      [9.6, 1.05], [12.1, 0.95], [12.6, 0.4, 'inQuad'], [15.0, -8.2, 'linear']],
    height: [[0, 1.47], [4.6, 1.47], [5.25, 1.85, 'inOutQuad'], [8.45, 1.85], [8.75, 1.7], [9.1, 1.56], [9.45, 1.42], [15.0, 1.42]],
    yaw: [[0, 91], [3.3, 91], [4.2, 92], [6.9, 90], [7.5, 82], [8.4, 64], [9.35, 70], [9.6, 76], [9.95, 102], [10.25, 96], [10.85, 38], [11.6, 14], [12.6, 6], [15.0, 2]],
    pitch: [[0, -27], [2.4, -27], [3.3, -25], [4.25, -2], [5.3, -4], [6.0, -1], [6.9, 1], [8.4, -3], [8.7, -14], [9.4, -9], [9.8, -3], [10.6, -2], [12.6, -4], [15.0, -5]],
    fov: [[0, 62]],
    startles: [[9.95, 0.5]],        // the boy rushing past
    shakes: [],
    sag: [[0, 0]], roll: [[0, 0], [10.0, 0], [10.3, -2.2], [10.9, 0]],
  },

  // first-person hands (poses in films/before-screens/hands.js)
  hands: {
    right: [[0, 'phone'], [0.42, 'swipe'], [0.62, 'phone'], [1.02, 'swipe'], [1.22, 'phone'], [2.48, 'tap'], [2.6, 'phone'], [2.86, 'tap'], [2.98, 'phone'],
      [3.45, 'lower'], [4.1, 'hidden'], [5.45, 'handle'], [5.98, 'push'], [6.55, 'hidden']],
    left: [[0, 'hidden']],
  },

  hud: {
    title: { in: -0.6, out: 1.85, html: 'How did kids have fun<br>before screens?' },
    stack: [{ t: 2.35, until: 4.25, lines: [[2.35, 'No phone.'], [2.8, 'No TV.'], [3.25, 'No internet.']] }],
    captions: [
      { t: 4.3, until: 6.05, text: 'So what did kids actually do all day?' },
      { t: 10.2, until: 12.45, text: 'For many kids, the playground wasn’t a screen.' },
      { t: 12.7, until: 14.95, text: 'It was the street.' },
    ],
    readouts: [{ from: 7.6, until: 11.6, label: 'YEAR', value: 'c. 1905', ctx: 'A TOWN STREET' }],
  },

  /* ---- the children (and two grown-ups). look → films/before-screens/children.js
     path: [[t, x, z], ...]   states: [[t, action], ...]   stride: metres per running cycle */
  people: [
    // the boy who rushes past within a metre
    { id: 'runner', look: 'newsboy', stride: 2.25, path: [[0, 6.2, 9.4], [9.45, 6.2, 5.2], [10.25, 5.55, 1.0], [11.6, 5.0, -4.6], [15.0, 3.6, -18.5]], states: [[0, 'run'], [10.1, 'runLaugh']] },
    // hoop racers: one rolls past during the reveal, two more pass you after the runner
    { id: 'hoop1', look: 'sailor', stride: 2.1, hoop: true, path: [[0, 2.6, 4.4], [5.6, 2.6, 4.4], [9.2, 1.4, -6.4], [11.6, 0.8, -14.2], [15.0, 0.2, -25.0]], states: [[0, 'hoopRun']] },
    { id: 'hoop2', look: 'girlPinafore', stride: 2.0, hoop: true, path: [[0, 1.0, 13.0], [5.6, 1.0, 13.0], [9.0, 0.6, 5.6], [12.0, 0.0, -4.6], [15.0, -0.6, -15.0]], states: [[0, 'hoopRun']] },
    { id: 'hoop3', look: 'boyBare', stride: 2.2, hoop: true, path: [[0, 3.4, 15.0], [5.6, 3.4, 15.0], [9.0, 3.0, 7.6], [12.0, 2.6, -3.4], [15.0, 2.0, -14.4]], states: [[0, 'hoopRun']] },
    // tag in the street right in front of the porch; at 11.6 s the chaser tags tag2, and the game drifts north
    { id: 'tagIt', look: 'boyCap', stride: 2.0, path: [[0, -2.6, -4.0], [5.6, -2.6, -4.0], [7.6, -0.2, -6.8], [8.6, 1.8, -4.2], [9.6, -0.6, -2.8], [10.4, 0.6, -6.0], [11.55, 1.6, -9.9], [12.8, 3.0, -13.5], [15.0, 3.6, -20.0]], states: [[0, 'run'], [11.3, 'reach'], [11.75, 'run']] },
    { id: 'tag2', look: 'girlBlue', stride: 1.9, path: [[0, 1.2, -7.0], [5.6, 1.2, -7.0], [7.8, 2.6, -3.6], [8.8, 0.2, -1.8], [9.8, 1.6, -5.4], [10.8, 2.2, -8.6], [11.6, 2.0, -10.6], [12.0, 2.0, -10.8], [13.4, -0.6, -14.0], [15.0, -2.4, -19.5]], states: [[0, 'run'], [11.6, 'startle'], [12.0, 'run']] },
    { id: 'tag3', look: 'tallBoy', stride: 2.1, path: [[0, -3.6, -8.6], [5.6, -3.6, -8.6], [8.0, -1.6, -10.8], [9.4, -3.8, -7.0], [10.6, -2.2, -11.0], [12.0, -3.4, -15.6], [15.0, -4.0, -22.0]], states: [[0, 'run'], [12.1, 'runLaugh']] },
    { id: 'tag4', look: 'girlCheck', stride: 1.9, path: [[0, 3.4, -10.2], [5.6, 3.4, -10.2], [8.2, 1.2, -12.4], [9.6, 3.6, -9.6], [11.0, 2.4, -14.0], [13.0, 0.8, -19.0], [15.0, 2.8, -25.0]], states: [[0, 'run']] },
    // a game of catch further up the street
    { id: 'catchG', look: 'girlSmall', path: [[0, -6.3, -15.5]], face: -56.6, states: [[0, 'catchIdle']] },
    { id: 'catchB', look: 'braces', path: [[0, -1.6, -18.6]], face: 123.4, states: [[0, 'catchIdle']] },
    // marbles on the far walk (a glimpse of what's coming)
    { id: 'marbleA', look: 'boyStripe', path: [[0, -6.05, -8.7]], face: -70, states: [[0, 'kneel']] },
    { id: 'marbleB', look: 'girlApron2', path: [[0, -5.05, -9.15]], face: 110, states: [[0, 'kneel']] },
    // jump rope on the far sidewalk
    { id: 'rope', look: 'girlRope', path: [[0, -6.3, -2.6]], face: -90, states: [[0, 'jumpRope']] },
    // two girls on a bench with a doll
    { id: 'step1', look: 'girlStep1', y: 0.12, seat: 0.6, path: [[0, -7.12, 5.0]], face: -96, states: [[0, 'sitStep']] },
    { id: 'step2', look: 'girlStep2', y: 0.12, seat: 0.62, path: [[0, -7.12, 5.75]], face: -82, states: [[0, 'sitStep']] },
    // chores: a boy carrying a bucket home from the pump
    { id: 'bucket', look: 'boyChores', stride: 1.15, path: [[0, -6.4, -26.0], [5.6, -6.4, -24.0], [15.0, -6.5, -12.5]], states: [[0, 'carry']] },
    // grown-ups: a woman hanging washing in a side yard, an old man on a bench
    { id: 'mother', look: 'mother', path: [[0, -13.1, -13.6]], face: -90, states: [[0, 'hangWash']] },
    { id: 'oldman', look: 'oldMan', y: 0.12, seat: 0.44, path: [[0, -7.12, -20.6]], face: -90, states: [[0, 'sitBench']] },
  ],

  // ball throws: [t0, from, to, flight seconds]
  throws: [[7.2, 'catchG', 'catchB', 0.85], [9.0, 'catchB', 'catchG', 0.85], [10.8, 'catchG', 'catchB', 0.85], [12.5, 'catchB', 'catchG', 0.85], [14.1, 'catchG', 'catchB', 0.85]],
};

// Track objects built from SCRIPT.tracks (used everywhere as SCRIPT_TRACKS.name.value(t))
const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
