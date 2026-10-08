/* =====================================================================
   SCRIPT — "What if everything lost its elasticity?"
   ★ The one file to edit for timing: the beats, the words, the readouts, your head (camera), your hands.
   Everything is a pure function of time (STORY seconds; CONFIG.edit cuts the take into the film).
   A 'step' key on a track is a hard cut. Plan: films/no-elasticity/PLAN.md
   The rule: solids still RESIST being deformed, but they never spring back (elastic recovery = 0).
   Air, water and living tissue are unchanged.
   ===================================================================== */

CONFIG.duration = 71.2;
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
  rule: [0.35, 1.25],          // shape recovery 100 % → 0 % under the title
  // the bounce: contact times of the solid rubber ball with the ground (the 4th is weak, then it lands dead at ≈ 1.45)
  dribble: { t0: -1.08, P: 0.62 },
  poke: 3.4,                   // he presses on it: it squashes a little more, and stays that way
  // the montage of everyday things (pov 0 inserts)
  mont: [[5.6, 7.55, 'racket'], [7.55, 9.5, 'shoe'], [9.5, 11.45, 'cushion'], [11.45, 13.4, 'band']],
  back: 13.4,
  // the trampoline
  jump: 15.45, land: 15.98, jump2: 16.6, land2: 17.0,
  // the hero car and its springs (over the speed table): a glimpse from you, then alongside its front wheel
  car: { t0: 19.0, z0: 30.5 },
  carLook: 21.6,
  wheelShot: [23.0, 27.4],
  // the box truck over the table; its rear springs flatten on the landing (side-on insert)
  traffic: [33.6, 41.4],
  truckShot: [36.5, 39.6],
  // the footbridge: a running club crosses; the deck keeps the dip (insert)
  bridge: [41.4, 50.0],
  crash: 53.6,                 // the SUV hits the crossing sedan
  crashShot: [52.8, 55.2],     // from the impact side; 53.35–54.35 plays at 1/3 speed
  crashSlow: [53.35, 54.35],
  wreckShot: [56.9, 59.4],
  // the queue car taps the wreck at walking pace: the bumper stays pushed in
  tap: 60.9,
  tapShot: [59.4, 62.6],
  line: [63.4, 69.2],
  note: [69.3, 71.0],
  end: 71.2,
};
// the cut: no jogger, no waiting. Story → film: 18.2 → 21.6 and 27.4 → 33.6 and 50.0 → 52.8 are dropped; the crash is slowed
CONFIG.edit = [[0, 18.2], [NE.carLook, NE.wheelShot[1]], [NE.traffic[0], NE.bridge[1]], [NE.crashShot[0], NE.crashSlow[0]],
  [NE.crashSlow[0], NE.crashSlow[1], 1 / 3], [NE.crashSlow[1], NE.end]];

// the rule's value over time (1 = things recover their shape → 0 = nothing springs back). HUD, grade, sound and props read it.
function neRule(t) { return 1 - MathX.smooth(t, NE.rule[0], NE.rule[1]); }
function neMont(t) { for (const m of NE.mont) if (t >= m[0] && t < m[1]) return m; return null; }

// where you stand: by the plaza for the ball, the montage and the trampoline; then at the kerb for the traffic
const NE_YOU = { x: 11.4, z: -2.9 };
const NE_KERB = { x: 8.3, z: -2.1 };

// text helpers
const neRecovery = (t) => `${Math.round(neRule(t) * 100)}%`;

const SCRIPT = {
  meta: { title: 'What if everything lost its elasticity?', wav: 'no-elasticity-soundtrack.wav' },
  events: [
    { id: 'start', time: 0.0, label: 'The plaza; a teenager bouncing a solid rubber ball; the title' },
    { id: 'rule', time: NE.rule[0], label: 'Shape recovery drains to 0 %' },
    { id: 'dead', time: 1.45, label: 'The ball lands… and stays down' },
    { id: 'poke', time: NE.poke, label: 'He presses on it: it squashes and stays squashed' },
    { id: 'mont', time: NE.mont[0][0], label: 'Everyday things: racket, shoe, cushion, rubber band' },
    { id: 'back', time: NE.back, label: 'Bouncing is only the beginning' },
    { id: 'tramp', time: NE.jump, label: 'The trampoline: the springs stretch, the mat stays down; the kid is fine' },
    { id: 'car', time: NE.carLook, label: 'The red car comes to the speed table' },
    { id: 'wheel', time: NE.wheelShot[0], label: 'Alongside the wheel: each bump leaves it lower' },
    { id: 'traffic', time: NE.traffic[0], label: 'The box truck over the table' },
    { id: 'truck', time: NE.truckShot[0], label: 'Side-on: its rear springs flatten, the box tips back' },
    { id: 'bridge', time: NE.bridge[0], label: 'The footbridge: a running club crosses, the deck stays down' },
    { id: 'crash', time: NE.crash, label: 'The crash: no rebound (slow motion)' },
    { id: 'van', time: 54.86, label: 'The van piles in' },
    { id: 'wreck', time: NE.wreckShot[0], label: 'The wreck moves off as one' },
    { id: 'tap', time: NE.tapShot[0], label: 'A 5 km/h tap: the bumper stays pushed in' },
    { id: 'line', time: NE.line[0], label: 'The tired street; the closing line' },
  ],

  // your head. Yaw + is left (0 = down the avenue, −Z); the plaza is to your right.
  // (the jumps in x / z / yaw at 18.3 and 28.0 are inside the cut, so you never see them)
  camera: {
    baseY: 0.15,
    x: [[0, 10.9], [2.0, NE_YOU.x, 'outQuad'], [28.0, NE_YOU.x], [28.1, NE_KERB.x, 'step'], [62.8, NE_KERB.x], [65.4, 9.7, 'inOutSine'], [72, 9.7]],
    z: [[0, -1.6], [2.0, NE_YOU.z, 'outQuad'], [28.0, NE_YOU.z], [28.1, NE_KERB.z, 'step'], [62.8, NE_KERB.z], [65.4, -1.5, 'inOutSine'], [72, -1.5]],
    height: [[0, 1.68], [1.45, 1.68], [1.58, 1.63], [1.95, 1.68], [72, 1.68]],
    yaw: [[0, -28], [2.0, -31], [3.4, -30.5], [5.5, -31],
      [13.4, -22, 'step'], [14.6, -36], [15.2, -38.4], [18.2, -38],
      [18.3, 104, 'step'], [NE.carLook, 100], [22.4, 84], [23.0, 70],
      [28.1, 45, 'step'], [NE.traffic[0], 45], [34.6, 52], [35.7, 50], [36.5, 39],
      [39.6, 16, 'step'], [41.4, 10],
      [52.8, 13, 'step'], [55.2, 13, 'step'], [56.9, 14],
      [62.6, 8, 'step'], [63.4, 6], [64.6, -20], [65.8, -31], [72, -33]],
    pitch: [[0, -8], [1.2, -11], [1.6, -16], [3.4, -22], [5.5, -22], [NE.mont[3][0], -34, 'step'],
      [13.4, -14, 'step'], [14.6, -5], [18.2, -5],
      [18.3, -8, 'step'], [23.0, -9],
      [28.1, -6, 'step'], [35.7, -5], [36.5, -4.5],
      [39.6, -2, 'step'], [41.4, -1.5],
      [52.8, -1.5, 'step'], [55.2, -1.5, 'step'], [56.9, -1.5],
      [62.6, -2, 'step'], [63.4, -2], [64.6, -9], [65.8, -11], [72, -12]],
    fov: [[0, 52], [1.2, 48], [1.6, 44], [3.4, 36], [5.5, 34], [NE.mont[3][0], 64, 'step'],
      [13.4, 50, 'step'], [14.6, 32], [15.2, 30], [18.2, 30],
      [18.3, 50, 'step'], [23.0, 46],
      [28.1, 50, 'step'], [35.7, 46], [36.5, 44],
      [39.6, 36, 'step'], [41.4, 32],
      [52.8, 30, 'step'], [55.2, 32, 'step'], [56.9, 34],
      [62.6, 40, 'step'], [63.4, 44], [64.6, 46], [72, 44]],
    startles: [[1.47, 0.35]],
    shakes: [],
  },

  // your hands: only for the rubber band (stretched once, then it stays long and slack)
  hands: {
    right: [[0, 'hidden'], [11.45, 'bandIn!'], [11.8, 'bandOut'], [12.5, 'bandIn'], [13.4, 'hidden!']],
    left: [[0, 'hidden'], [11.45, 'bandIn!'], [11.8, 'bandOut'], [12.5, 'bandIn'], [13.4, 'hidden!']],
  },

  tracks: {
    // 0 = a cinematic shot with no body motion (the montage inserts, the wheel, the truck, the bridge, the crash, the wreck, the tap)
    pov: [[0, 1], [5.6, 0, 'step'], [11.45, 1, 'step'],
      [NE.wheelShot[0], 0, 'step'], [NE.wheelShot[1], 1, 'step'], [NE.truckShot[0], 0, 'step'], [NE.truckShot[1], 1, 'step'],
      [NE.bridge[0], 0, 'step'], [NE.bridge[1], 1, 'step'], [NE.crashShot[0], 0, 'step'], [NE.crashShot[1], 1, 'step'],
      [NE.wreckShot[0], 0, 'step'], [NE.tapShot[1], 1, 'step'], [NE.end, 1]],
  },

  hud: {
    title: { in: NE.title[0], out: NE.title[1], fi: 0.2, fo: 0.4, cls: 'big center', html: '<span class="kick">WHAT IF EVERYTHING</span><span class="kick">LOST ITS</span><span class="hero">ELASTICITY?</span>' },
    captions: [
      { t: 1.8, until: 3.4, text: 'It hits… and doesn’t come back up.' },
      { t: 3.75, until: 5.5, text: 'It still squashes.<br>It never un-squashes.' },
      { t: 13.55, until: 15.4, text: 'Bouncing is only the beginning.' },
      { t: 16.1, until: 18.2, text: 'Bodies are fine. Their gear isn’t.' },
      { t: 24.4, until: 27.4, text: 'Every bump leaves it a little lower.' },
      { t: 33.75, until: 35.9, text: 'Suspension is just springs…' },
      { t: 36.1, until: 38.2, text: '…and springs stopped springing back.' },
      { t: 42.3, until: 45.3, text: 'Every bridge flexes a little, all day.' },
      { t: 45.7, until: 49.6, text: 'Now every flex is permanent.' },
      { t: 55.35, until: 58.6, text: 'They don’t rebound<br>even a little.' },
      { t: 59.9, until: 62.5, text: 'Now even a tap<br>leaves a dent.' },
      { t: NE.line[0], until: 66.0, text: 'Without elasticity…' },
      { t: 66.3, until: NE.line[1], text: '…almost nothing gets a second chance<br>to return to shape.' },
    ],
    readouts: [
      { from: -0.6, until: 5.5, top: 210, label: 'SHAPE RECOVERY', value: neRecovery, sub: (t) => (t >= NE.rule[1] + 0.1 ? 'NOTHING SPRINGS BACK' : '') },
      { from: NE.wheelShot[0], until: NE.wheelShot[1], top: 210, label: 'RIDE HEIGHT LOST', value: (t) => neRideText(t), sub: 'SPRINGS DON’T RETURN' },
      { from: NE.truckShot[0], until: NE.truckShot[1] + 0.8, top: 210, label: 'TRUCK’S REAR DROP', value: (t) => neTruckText(t), sub: (t) => (t < 38.9 ? 'EACH BUMP PUSHES IT DOWN' : 'NOW ON ITS BUMP STOPS') },
      { from: NE.bridge[0], until: NE.bridge[1], top: 210, label: 'FOOTBRIDGE SAG', value: (t) => neSagText(t), sub: 'IT KEEPS ITS DEEPEST DIP' },
      { from: NE.crashShot[1], until: NE.wreckShot[1], top: 210, label: 'REBOUND SPEED', value: '0 m/s', sub: 'THEY MOVE OFF AS ONE' },
      { from: NE.tapShot[0], until: NE.tapShot[1], top: 210, label: 'IMPACT SPEED', value: '5 km/h', sub: 'NORMALLY: NO DAMAGE' },
      { from: 63.0, until: NE.note[1], top: 210, label: 'SHAPE RECOVERY', value: '0%', sub: '' },
    ],
    notes: [{ t: NE.note[0], until: NE.note[1], text: 'FICTIONAL RULE: SOLIDS RESIST, BUT NEVER SPRING BACK.<br>BODIES, AIR AND WATER UNCHANGED. ENGINES SPARED.' }],
  },
};

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
