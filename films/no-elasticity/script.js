/* =====================================================================
   SCRIPT — "What if everything lost its elasticity?"
   ★ The one file to edit for timing: the beats, the words, the readouts, your head (camera), your hands.
   Everything is a pure function of time (STORY seconds; CONFIG.edit cuts the take into the film).
   A 'step' key on a track is a hard cut. Plan: films/no-elasticity/PLAN.md
   The rule: solids still RESIST being deformed, but they never spring back (elastic recovery = 0).
   Air, water and living tissue are unchanged.
   ===================================================================== */

CONFIG.duration = 69.6;
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
  wheelShot: [24.9, 29.2],
  traffic: [31.0, 41.4],
  bridge: [41.4, 51.4],
  crash: 53.6,                 // the SUV hits the crossing sedan
  crashSlow: [53.35, 54.35],   // (CONFIG.edit plays this at 1/3 speed from the corner)
  wreckShot: [56.9, 59.4],
  line: [61.2, 67.4],
  note: [67.5, 69.4],
  end: 69.6,
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
    { id: 'wheel', time: NE.wheelShot[0], label: 'Alongside the wheel: off the table, the body settles below its old line' },
    { id: 'traffic', time: NE.traffic[0], label: 'Traffic bottoms out; the truck’s rear springs flatten and it drags' },
    { id: 'bridge', time: NE.bridge[0], label: 'The footbridge: every crossing adds sag; the signal arm droops' },
    { id: 'crash', time: NE.crash, label: 'The crash: crumple and stay locked (slow motion)' },
    { id: 'van', time: 54.86, label: 'The van piles in and locks on too' },
    { id: 'wreck', time: NE.wreckShot[0], label: 'The locked wreck' },
    { id: 'line', time: NE.line[0], label: 'The exhausted street; the closing line' },
  ],

  // your head. Yaw + is left (0 = down the avenue, −Z); the plaza is to your right (yaw ≈ −35).
  camera: {
    baseY: 0.15,
    x: [[0, 9.6], [30.6, 9.6], [32.2, 8.3, 'inOutSine'], [62.6, 8.3], [65.0, 10.4, 'inOutSine'], [70, 10.4]],
    z: [[0, 1.0], [2.7, NE_YOU.z, 'outQuad'], [30.6, NE_YOU.z], [32.2, -2.1, 'inOutSine'], [62.6, -2.1], [65.0, -2.6, 'inOutSine'], [70, -2.6]],
    height: [[0, 1.68], [2.36, 1.68], [2.5, 1.63], [2.9, 1.68], [70, 1.68]],
    yaw: [[0, -27], [2.0, -32], [2.6, -34], [4.2, -36], [5.5, -36],
      [13.4, -33, 'step'], [15.2, -38], [17.2, -37], [17.8, 7], [19.1, 14], [19.6, 21], [20.4, 22], [20.95, 40], [21.4, 70], [21.8, 84], [22.3, 58], [23.3, 33], [24.2, 23], [24.9, 19],
      [29.2, 8, 'step'], [30.6, 8], [32.2, 30], [34.6, 52], [35.7, 50], [36.5, 39], [37.5, 28], [38.85, 20], [40.5, 15], [41.3, 7],
      [42.0, 6], [46.5, 5], [48.0, 8], [50.5, 13], [51.6, 13], [53.35, 13],
      [54.35, 12, 'step'], [56.8, 14],
      [59.4, 13, 'step'], [61.2, 8], [62.6, 4], [64.4, -26], [65.6, -32], [70, -33]],
    pitch: [[0, -7], [2.0, -12], [2.6, -17], [4.2, -21], [5.5, -18], [NE.mont[3][0], -34, 'step'],
      [13.4, -12, 'step'], [15.2, -6], [17.2, -6], [17.8, -6], [19.1, -12], [19.6, -18], [20.4, -17], [20.95, -12], [21.8, -12], [22.5, -12], [23.3, -8], [24.9, -8],
      [29.2, -3, 'step'], [30.6, -3], [32.2, -6], [35.7, -5], [38.85, -3], [41.0, 0],
      [42.0, 2.5], [46.5, 2.5], [48.0, 1.0], [50.5, -1], [53.35, -1.5],
      [54.35, -1.5, 'step'], [56.8, -1.5],
      [59.4, -2, 'step'], [61.2, -1], [62.6, -2], [64.4, -12], [65.6, -15], [70, -16]],
    fov: [[0, 58], [2.0, 56], [4.2, 50], [5.5, 50], [NE.mont[3][0], 64, 'step'],
      [13.4, 54, 'step'], [15.2, 36], [17.2, 36], [17.8, 54], [19.1, 50], [20.4, 50], [21.4, 60], [21.8, 64], [23.3, 56], [24.9, 50],
      [29.2, 34, 'step'], [30.6, 36], [32.2, 50], [35.7, 46], [38.85, 38], [41.0, 30], [42.0, 18], [46.5, 18], [48.0, 22], [50.5, 30], [53.35, 30],
      [54.35, 30, 'step'], [56.8, 34],
      [59.4, 40, 'step'], [61.2, 44], [62.6, 44], [64.4, 48], [70, 48]],
    startles: [[2.32, 0.35], [NE.crash, 0.6], [54.86, 0.9]],
    shakes: [[54.86, 0.35, 0.4]],
  },

  // your hands: only for the rubber band (stretched once, then it stays long and slack)
  hands: {
    right: [[0, 'hidden'], [11.45, 'bandIn!'], [11.8, 'bandOut'], [12.5, 'bandIn'], [13.4, 'hidden!']],
    left: [[0, 'hidden'], [11.45, 'bandIn!'], [11.8, 'bandOut'], [12.5, 'bandIn'], [13.4, 'hidden!']],
  },

  tracks: {
    // 0 = a cinematic shot with no body motion (the montage inserts, the wheel, the crash, the wreck)
    pov: [[0, 1], [5.6, 0, 'step'], [11.45, 1, 'step'], [NE.wheelShot[0], 0, 'step'], [NE.wheelShot[1], 1, 'step'],
      [NE.crashSlow[0], 0, 'step'], [NE.crashSlow[1], 1, 'step'], [NE.wreckShot[0], 0, 'step'], [NE.wreckShot[1], 1, 'step'], [NE.end, 1]],
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
      { t: NE.line[0], until: 63.8, text: 'Without elasticity…' },
      { t: 64.1, until: NE.line[1], text: '…almost nothing gets a second chance<br>to return to shape.' },
    ],
    readouts: [
      { from: -0.6, until: 5.5, top: 210, label: 'ELASTIC REBOUND', value: neRebound, sub: (t) => (t >= NE.rule[1] + 0.1 ? 'NOTHING SPRINGS BACK' : '') },
      { from: 24.0, until: 31.0, top: 210, label: 'SUSPENSION RETURN', value: '0%', sub: (t) => neRideText(t) },
      { from: 42.0, until: 51.4, top: 210, label: 'FOOTBRIDGE SAG', value: (t) => neSagText(t), sub: 'EACH CROSSING ADDS MORE' },
      { from: 54.6, until: 59.4, top: 210, label: 'REBOUND SPEED', value: '0 m/s', sub: 'THE CARS STAY LOCKED TOGETHER' },
      { from: 60.0, until: NE.note[1], top: 210, label: 'ELASTIC REBOUND', value: '0%', sub: '' },
    ],
    notes: [{ t: NE.note[0], until: NE.note[1], text: 'FICTIONAL RULE · SOLIDS STILL RESIST BUT NEVER SPRING BACK · LIVING TISSUE, AIR AND WATER UNCHANGED' }],
  },
};

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
