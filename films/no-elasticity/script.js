/* =====================================================================
   SCRIPT — "What if everything lost its elasticity?"
   ★ The one file to edit for timing: the beats, the words, the readouts, your head (camera), your hands.
   Everything is a pure function of time (STORY seconds; CONFIG.edit cuts the take into the film).
   A 'step' key on a track is a hard cut. Plan: films/no-elasticity/PLAN.md
   The rule: solids still RESIST being deformed, but they never spring back (elastic recovery = 0).
   Air, water and living tissue are unchanged.
   ===================================================================== */

CONFIG.duration = 70.0;
CONFIG.seed = 20261008;
Object.assign(CONFIG.camera, {
  cameraHeight: 1.68, walkSpeed: 1.3, bobStrength: 0.014, bobFrequency: 1.72,
  breathingStrength: 0.005, breathRate: 15, fov: 64, shakeStrength: 1.0,
});
CONFIG.render.shadowMapSize = 2048;

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (story seconds). Every other file keys off these.
// ---------------------------------------------------------------------------------------------------------------------
const NE = {
  title: [-0.6, 3.5],
  rule: [1.15, 2.35],          // elastic rebound 100 % → 0 % under the title
  // the dribble: contact times of the ball with the ground (the last one is dead)
  dribble: { t0: -0.3, P: 0.62 },
  poke: 4.25,
  // the montage of everyday things (pov 0 inserts)
  mont: [[5.6, 7.55, 'racket'], [7.55, 9.5, 'shoe'], [9.5, 11.45, 'cushion'], [11.45, 13.4, 'band']],
  back: 13.4,
  // the trampoline
  jump: 15.45, land: 15.98, jump2: 16.6, land2: 17.0,
  // the jogger
  jog: [17.6, 21.6],
  // the hero car and its tyres / springs (front axle crossing the speed table)
  car: { t0: 19.0, z0: 30.5 },
  wheelShot: [24.9, 28.2],
  traffic: [31.0, 41.4],
  bridge: [41.4, 51.4],
  crash: 53.6,                 // the SUV hits the crossing sedan
  crashSlow: [53.3, 54.5],     // (CONFIG.edit plays this at 1/3 speed from a low angle)
  wreckShot: [56.9, 59.4],
  line: [61.4, 67.8],
  note: [67.9, 69.6],
  end: 70.0,
};
CONFIG.edit = [[0, NE.crashSlow[0]], [NE.crashSlow[0], NE.crashSlow[1], 1 / 3], [NE.crashSlow[1], NE.end]];

// the rule's value over time (1 = normal elasticity → 0 = no elastic recovery). HUD, grade, sound and props read it.
function neRule(t) { return 1 - MathX.smooth(t, NE.rule[0], NE.rule[1]); }
function neMont(t) { for (const m of NE.mont) if (t >= m[0] && t < m[1]) return m; return null; }

// where you stand (the right-hand sidewalk, by the little plaza)
const NE_YOU = { x: 9.6, z: -0.8 };

// text helpers
const neRebound = (t) => `${Math.round(neRule(t) * 100)}%`;

const SCRIPT = {
  meta: { title: 'What if everything lost its elasticity?', wav: 'no-elasticity-soundtrack.wav' },

  events: [
    { id: 'start', time: 0.0, label: 'Normal plaza; a teenager dribbling; the title' },
    { id: 'rule', time: NE.rule[0], label: 'Elastic rebound drains to 0 %' },
    { id: 'dead', time: 2.3, label: 'The ball lands… and stays flat' },
    { id: 'mont', time: NE.mont[0][0], label: 'Everyday things: racket, shoe, cushion, rubber band' },
    { id: 'back', time: NE.back, label: 'Bouncing is only the beginning' },
    { id: 'tramp', time: NE.jump, label: 'The trampoline: first landing, stays stretched' },
    { id: 'jog', time: NE.jog[0], label: 'The jogger: shoes go flat, bodies are fine' },
    { id: 'car', time: 21.0, label: 'The red car: tyres and springs over the speed table' },
    { id: 'wheel', time: NE.wheelShot[0], label: 'Low at the wheel: flat spots, the coil stays short' },
    { id: 'traffic', time: NE.traffic[0], label: 'Traffic bottoms out; the truck sags; the bus kneels' },
    { id: 'bridge', time: NE.bridge[0], label: 'The footbridge: every crossing adds sag; the signal arm droops' },
    { id: 'crash', time: NE.crash, label: 'The crash: crumple and stay locked (slow motion)' },
    { id: 'van', time: 54.75, label: 'The van piles in and locks on too' },
    { id: 'wreck', time: NE.wreckShot[0], label: 'The locked wreck' },
    { id: 'line', time: NE.line[0], label: 'The exhausted street; the closing line' },
  ],

  // your head. Yaw + is left (0 = down the avenue, −Z); the plaza is to your right (yaw ≈ −35).
  camera: {
    baseY: 0.15,
    x: [[0, 9.6], [30.6, 9.6], [32.2, 8.3, 'inOutSine'], [70, 8.3]],
    z: [[0, 1.9], [2.7, NE_YOU.z, 'outQuad'], [30.6, NE_YOU.z], [32.2, -2.1, 'inOutSine'], [70, -2.1]],
    height: [[0, 1.68], [2.36, 1.68], [2.5, 1.63], [2.9, 1.68], [53.6, 1.68], [53.75, 1.6], [54.2, 1.68], [70, 1.68]],
    yaw: [[0, -24], [2.0, -30], [2.6, -34], [4.2, -36], [5.5, -36],
      [13.4, -33, 'step'], [15.2, -33], [15.6, -31], [17.2, -31], [17.7, -12], [19.2, -8], [20.2, -24], [21.2, -38],
      [21.7, 82, 'inOutQuad'], [22.5, 70], [23.3, 34], [24.2, 22], [24.9, 20],
      [28.2, 6, 'step'], [29.6, 4], [30.6, 10], [32.2, 34], [36.0, 30], [38.5, 22], [41.0, 10],
      [42.0, 6], [46.5, 5], [48.0, 9], [50.5, 14], [51.6, 13], [53.3, 13],
      [54.5, 12, 'step'], [56.8, 14],
      [59.4, 12, 'step'], [60.4, 9], [62.4, 6], [64.0, -6], [65.6, -26], [67.2, -36], [70, -38]],
    pitch: [[0, -11], [2.0, -14], [2.6, -18], [4.2, -22], [5.5, -18], [NE.mont[3][0], -34, 'step'],
      [13.4, -12, 'step'], [15.2, -6], [15.6, -5], [17.2, -6], [17.7, -6], [19.2, -7], [21.2, -9],
      [21.7, -14], [22.5, -14], [23.3, -8], [24.9, -8],
      [28.2, -3, 'step'], [30.6, -4], [32.2, -7], [36.0, -6], [41.0, -2],
      [42.0, 2.5], [46.5, 2.5], [48.0, 1.0], [50.5, -1], [53.3, -1.5],
      [54.5, -1.5, 'step'], [56.8, -1.5],
      [59.4, -2, 'step'], [62.4, 0], [64.0, -2], [65.6, -8], [67.2, -12], [70, -13]],
    fov: [[0, 64], [2.0, 60], [4.2, 52], [5.5, 52], [NE.mont[3][0], 64, 'step'],
      [13.4, 54, 'step'], [15.2, 36], [17.2, 36], [17.7, 54], [21.2, 60], [21.7, 66], [23.3, 56], [24.9, 50],
      [28.2, 48, 'step'], [30.6, 52], [32.2, 46], [36.0, 40], [41.0, 32], [42.0, 22], [46.5, 22], [48.0, 26], [50.5, 34], [53.3, 30],
      [54.5, 30, 'step'], [56.8, 34],
      [59.4, 50, 'step'], [62.4, 46], [64.0, 50], [67.2, 56], [70, 56]],
    startles: [[2.32, 0.35], [NE.crash, 0.6], [54.75, 0.9]],
    shakes: [[54.75, 0.35, 0.4]],
  },

  // your hands: only for the rubber band (stretched once, then it stays long and slack)
  hands: {
    right: [[0, 'hidden'], [11.45, 'bandIn!'], [11.8, 'bandOut'], [12.5, 'bandIn'], [13.4, 'hidden!']],
    left: [[0, 'hidden'], [11.45, 'bandIn!'], [11.8, 'bandOut'], [12.5, 'bandIn'], [13.4, 'hidden!']],
  },

  tracks: {
    // 0 = a cinematic shot with no body motion (the montage inserts, the wheel, the crash, the wreck)
    pov: [[0, 1], [5.6, 0, 'step'], [11.45, 1, 'step'], [24.9, 0, 'step'], [28.2, 1, 'step'],
      [NE.crashSlow[0], 0, 'step'], [NE.crashSlow[1], 1, 'step'], [NE.wreckShot[0], 0, 'step'], [NE.wreckShot[1], 1, 'step'], [70, 1]],
  },

  hud: {
    title: { in: NE.title[0], out: NE.title[1], fi: 0.2, fo: 0.4, cls: 'big center', html: '<span class="kick">WHAT IF EVERYTHING</span><span class="kick">LOST ITS</span><span class="hero">ELASTICITY?</span>' },
    captions: [
      { t: 3.7, until: 5.5, text: 'It lands… and just stays flat.' },
      { t: 13.55, until: 15.4, text: 'Bouncing is only the beginning.' },
      { t: 18.7, until: 21.4, text: 'Bodies are fine. Their gear isn’t.' },
      { t: 28.4, until: 30.9, text: 'Every bump leaves it a little lower.' },
      { t: 33.0, until: 35.8, text: 'Suspension is just springs…' },
      { t: 36.1, until: 39.2, text: '…and springs stopped pushing back.' },
      { t: 43.0, until: 46.0, text: 'Every bridge flexes a little, all day.' },
      { t: 46.4, until: 49.8, text: 'Now every flex is permanent.' },
      { t: 55.0, until: 56.8, text: 'No rebound. Nothing bounces apart.' },
      { t: NE.line[0], until: 63.9, text: 'Without elasticity…' },
      { t: 64.2, until: NE.line[1], text: '…almost nothing gets a second chance<br>to return to shape.' },
    ],
    readouts: [
      { from: -0.6, until: 5.5, top: 210, label: 'ELASTIC REBOUND', value: neRebound, sub: (t) => (t >= NE.rule[1] + 0.1 ? 'NOTHING SPRINGS BACK' : '') },
      { from: 23.0, until: 31.0, top: 210, label: 'SUSPENSION RETURN', value: '0%', sub: (t) => neRideText(t) },
      { from: 42.0, until: 51.4, top: 210, label: 'FOOTBRIDGE SAG', value: (t) => neSagText(t), sub: 'EACH CROSSING ADDS MORE' },
      { from: 54.6, until: 59.4, top: 210, label: 'REBOUND SPEED', value: '0 m/s', sub: 'THE CARS STAY LOCKED TOGETHER' },
      { from: 60.0, until: NE.note[1], top: 210, label: 'ELASTIC REBOUND', value: '0%', sub: '' },
    ],
    notes: [{ t: NE.note[0], until: NE.note[1], text: 'FICTIONAL RULE · SOLIDS STILL RESIST BUT NEVER SPRING BACK · LIVING TISSUE, AIR AND WATER UNCHANGED' }],
  },
};

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
