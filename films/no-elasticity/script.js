/* =====================================================================
   SCRIPT — "What if everything lost its elasticity?"
   ★ The one file to edit for timing: the beats, the words, the readouts, your head (camera), your hands.
   Everything is a pure function of time (STORY seconds; CONFIG.edit cuts the take into the film).
   A 'step' key on a track is a hard cut. Plan: films/no-elasticity/PLAN.md
   The rule: solids still RESIST being deformed, but they never spring back (elastic recovery = 0).
   Air, water and living tissue are unchanged.
   ===================================================================== */

CONFIG.duration = 72.4;
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
  ballShot: [1.75, 5.6],       // low beside the dead ball: the outline of its round shape; his hand presses on it
  poke: 3.4,
  // the montage of everyday things (pov 0 inserts)
  mont: [[5.6, 7.55, 'racket'], [7.55, 9.5, 'shoe'], [9.5, 11.45, 'cushion'], [11.45, 13.4, 'band']],
  back: 13.4,
  // the trampoline
  jump: 15.45, land: 15.98, jump2: 16.6, land2: 17.0,
  // the hero car and its springs (over the speed table): a glimpse from you, then low beside its front wheel
  car: { t0: 19.0, z0: 30.5 },
  carLook: 21.6,
  wheelShot: [23.3, 26.9],
  // low cars scraping on the table, then the loaded box truck; its rear springs end on their stops (side-on insert)
  traffic: [33.6, 40.8],
  truckShot: [36.5, 39.6],
  // the footbridge: a running club crosses; the deck keeps the dip (insert)
  bridge: [41.8, 48.6],
  crash: 53.6,                 // the SUV hits the crossing sedan
  crashShot: [52.8, 55.4],     // side-on; 53.35–55.0 (the hit and the van's) plays at 1/3 speed
  crashSlow: [53.35, 55.0],
  wreckShot: [56.9, 59.4],
  // the late hatch taps the wreck at walking pace, then backs off: the bumper stays pushed in
  tap: 60.9,
  tapBack: [61.8, 62.6],
  tapShot: [59.4, 63.4],
  line: [64.0, 70.2],
  note: [70.3, 72.2],
  end: 72.4,
};
// the cut: no waiting. Story 18.2–21.6, 26.9–33.6, 40.8–41.8 and 48.6–52.8 are dropped; the crash is slowed. Film ≈ 60.4 s
CONFIG.edit = [[0, 18.2], [NE.carLook, NE.wheelShot[1]], [NE.traffic[0], NE.traffic[1]], [NE.bridge[0], NE.bridge[1]],
  [NE.crashShot[0], NE.crashSlow[0]], [NE.crashSlow[0], NE.crashSlow[1], 1 / 3], [NE.crashSlow[1], NE.end]];

// the rule's value over time (1 = things recover their shape → 0 = nothing springs back). HUD, grade, sound and props read it.
function neRule(t) { return 1 - MathX.smooth(t, NE.rule[0], NE.rule[1]); }
function neMont(t) { for (const m of NE.mont) if (t >= m[0] && t < m[1]) return m; return null; }

// where you stand: by the plaza for the ball, the montage and the trampoline; then at the kerb for the traffic
const NE_YOU = { x: 11.4, z: -2.9 };
const NE_KERB = { x: 8.3, z: -2.1 };
const NE_END = { x: 11.6, z: -3.0 };            // the last look: the flat ball, the teenager sitting behind it, the funnel

// text helpers
const neRecovery = (t) => `${Math.round(neRule(t) * 100)}%`;

const SCRIPT = {
  meta: { title: 'What if everything lost its elasticity?', wav: 'no-elasticity-soundtrack.wav' },
  events: [
    { id: 'start', time: 0.0, label: 'The plaza; a teenager bouncing a solid rubber ball; the title' },
    { id: 'rule', time: NE.rule[0], label: 'Shape recovery drains to 0 %' },
    { id: 'dead', time: 1.45, label: 'The ball lands… and stays down' },
    { id: 'ball', time: NE.ballShot[0], label: 'Low beside it: the flat spot stays' },
    { id: 'mont', time: NE.mont[0][0], label: 'Everyday things: racket, shoe, cushion, rubber band' },
    { id: 'back', time: NE.back, label: 'Bouncing is only the beginning' },
    { id: 'tramp', time: NE.jump, label: 'The trampoline: the springs stretch, the mat stays down; the kid is fine' },
    { id: 'car', time: NE.carLook, label: 'The red car comes to the speed table' },
    { id: 'wheel', time: NE.wheelShot[0], label: 'Beside the wheel: each bump leaves it lower' },
    { id: 'traffic', time: NE.traffic[0], label: 'Cars on their bump stops scrape on the table' },
    { id: 'truck', time: NE.truckShot[0], label: 'Side-on: the loaded truck ends on its bump stops' },
    { id: 'bridge', time: NE.bridge[0], label: 'The footbridge: a running club crosses, the deck keeps the dip' },
    { id: 'crash', time: NE.crash, label: 'The crash: no rebound (slow motion)' },
    { id: 'van', time: 54.86, label: 'The van piles in' },
    { id: 'wreck', time: NE.wreckShot[0], label: 'The wreck moves off as one' },
    { id: 'tap', time: NE.tapShot[0], label: 'A 5 km/h tap: the bumper stays pushed in' },
    { id: 'line', time: NE.line[0], label: 'The tired street; back to the ball; the closing line' },
  ],

  // your head. Yaw + is left (0 = down the avenue, −Z); the plaza is to your right.
  // (the jumps in x / z / yaw at 18.3 and 28.0 are inside the cut, so you never see them)
  camera: {
    baseY: 0.15,
    x: [[0, 10.9], [2.0, NE_YOU.x, 'outQuad'], [28.0, NE_YOU.x], [28.1, NE_KERB.x, 'step'], [64.6, NE_KERB.x], [66.4, NE_END.x, 'inOutSine'], [73, NE_END.x]],
    z: [[0, -1.6], [2.0, NE_YOU.z, 'outQuad'], [28.0, NE_YOU.z], [28.1, NE_KERB.z, 'step'], [64.6, NE_KERB.z], [66.4, NE_END.z, 'inOutSine'], [73, NE_END.z]],
    height: [[0, 1.68], [1.45, 1.68], [1.58, 1.63], [1.95, 1.68], [73, 1.68]],
    yaw: [[0, -28], [2.0, -31], [3.4, -30.5], [5.5, -31],
      [13.4, -22, 'step'], [14.6, -36], [15.2, -38.4], [18.2, -38],
      [18.3, 104, 'step'], [NE.carLook, 100], [22.4, 84], [23.3, 68],
      [28.1, 38, 'step'], [NE.traffic[0], 38], [35.0, 41], [35.6, 50], [36.5, 40],
      [39.6, 16, 'step'], [40.8, 12],
      [55.4, 13, 'step'], [56.9, 14],
      [63.4, 8, 'step'], [64.6, 4], [65.6, -18], [66.4, -27], [73, -29]],
    pitch: [[0, -8], [1.2, -13], [1.6, -20], [2.4, -22], [3.4, -23], [4.6, -17, 'step'], [5.5, -18], [NE.mont[3][0], -34, 'step'],
      [13.4, -9, 'step'], [14.6, -5], [18.2, -5],
      [18.3, -5, 'step'], [23.3, -5],
      [28.1, -5, 'step'], [35.6, -4], [36.5, -4],
      [39.6, -2, 'step'], [40.8, -1.5],
      [55.4, -1, 'step'], [56.9, -1],
      [63.4, -2, 'step'], [64.6, -3], [65.6, -12], [66.4, -21], [73, -23]],
    fov: [[0, 52], [1.2, 48], [1.6, 44], [3.4, 36], [4.6, 40, 'step'], [5.5, 38], [NE.mont[3][0], 64, 'step'],
      [13.4, 42, 'step'], [14.6, 32], [15.2, 30], [18.2, 30],
      [18.3, 44, 'step'], [23.3, 40],
      [28.1, 40, 'step'], [35.0, 40], [35.6, 46], [36.5, 44],
      [39.6, 34, 'step'], [40.8, 32],
      [55.4, 20, 'step'], [56.9, 22],
      [63.4, 38, 'step'], [64.6, 40], [65.6, 44], [66.4, 46], [73, 45]],
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
    pov: [[0, 1], [NE.ballShot[0], 0, 'step'], [11.45, 1, 'step'],
      [NE.wheelShot[0], 0, 'step'], [NE.wheelShot[1], 1, 'step'], [NE.truckShot[0], 0, 'step'], [NE.truckShot[1], 1, 'step'],
      [NE.bridge[0], 0, 'step'], [NE.bridge[1], 1, 'step'], [NE.crashShot[0], 0, 'step'], [NE.crashShot[1], 1, 'step'],
      [NE.wreckShot[0], 0, 'step'], [NE.tapShot[1], 1, 'step'], [NE.end, 1]],
  },

  hud: {
    title: { in: NE.title[0], out: NE.title[1], fi: 0.2, fo: 0.4, cls: 'big center', html: '<span class="kick">WHAT IF EVERYTHING</span><span class="kick">LOST ITS</span><span class="hero">ELASTICITY?</span>' },
    captions: [
      { t: 1.8, until: 3.3, text: 'It hits… and doesn’t come back up.' },
      { t: 3.45, until: 5.5, text: 'It squashes.<br>It stays squashed.' },
      { t: 13.55, until: 15.4, text: 'Bouncing is only the beginning.' },
      { t: 16.1, until: 18.2, text: 'Bodies are fine. Their gear isn’t.' },
      { t: 23.45, until: 25.0, text: 'Suspension is mostly springs…' },
      { t: 25.15, until: 26.9, text: '…so every bump<br>leaves it lower.' },
      { t: 33.75, until: 36.4, text: 'A few bumps later,<br>cars scrape on everything.' },
      { t: 36.65, until: 39.5, text: 'A loaded truck<br>sinks even faster.' },
      { t: 42.2, until: 44.9, text: 'Bridges flex a little, all day…' },
      { t: 45.1, until: 48.4, text: '…now the deepest flex<br>stays forever.' },
      { t: 53.42, until: 54.95, text: 'Crashed cars normally<br>rebound a little…' },
      { t: 55.5, until: 58.6, text: 'These don’t.<br>Not even a little.' },
      { t: 60.2, until: 63.3, text: 'Now even a tap<br>leaves a dent.' },
      { t: NE.line[0], until: 66.3, text: 'Without elasticity…' },
      { t: 66.6, until: NE.line[1], text: '…almost nothing gets a second chance<br>to return to shape.' },
    ],
    readouts: [
      { from: -0.6, until: 5.5, top: 210, label: 'SHAPE RECOVERY', value: neRecovery, sub: (t) => (t >= NE.rule[1] + 0.1 ? 'NOTHING SPRINGS BACK' : '') },
      { from: NE.wheelShot[0], until: NE.wheelShot[1], top: 210, label: 'RIDE HEIGHT LOST', value: (t) => neRideText(t), sub: (t) => (t < 26.55 ? 'SPRINGS DON’T RETURN' : 'NEARLY ON ITS BUMP STOPS') },
      { from: NE.truckShot[0], until: NE.truckShot[1] + 0.8, top: 210, label: 'TRUCK’S REAR DROP', value: (t) => neTruckText(t), sub: (t) => (t < 38.9 ? 'EACH BUMP PUSHES IT DOWN' : 'NOW ON ITS BUMP STOPS') },
      { from: NE.bridge[0], until: NE.bridge[1], top: 210, label: 'FOOTBRIDGE SAG', value: (t) => neSagText(t), sub: 'IT KEEPS ITS DEEPEST DIP' },
      { from: NE.crashShot[1], until: NE.wreckShot[1], top: 210, label: 'REBOUND SPEED', value: '0 m/s', sub: 'NORMALLY ABOUT 1 m/s' },
      { from: NE.tapShot[0], until: NE.tapShot[1], top: 210, label: 'IMPACT SPEED', value: '5 km/h', sub: 'NORMALLY: IT SPRINGS BACK' },
      { from: 64.0, until: NE.note[1], top: 210, label: 'SHAPE RECOVERY', value: '0%', sub: '' },
    ],
    notes: [{ t: NE.note[0], until: NE.note[1], text: 'FICTIONAL RULE: SOLIDS RESIST, BUT NEVER SPRING BACK.<br>BODIES, AIR AND WATER UNCHANGED. ENGINES SPARED.' }],
  },
};

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
