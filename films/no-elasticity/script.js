/* =====================================================================
   SCRIPT — "What if everything lost its elasticity?"
   ★ The one file to edit for timing: the beats, the words, the readouts, your head (camera), your hands.
   Everything is a pure function of time (STORY seconds; there is no cut layer: story time = film time).
   A 'step' key on a track is a hard cut. Plan: films/no-elasticity/PLAN.md (and REDESIGN.md for why).
   The rule: solids still RESIST being deformed, but they never spring back (elastic recovery = 0).
   Air, water and living tissue are unchanged.
   The chain: a Newton's cradle stops passing the hit along → everyday things keep their dents → a trampoline becomes a funnel → a bow can't shoot →
   a tuning fork can't ring → your watch stopped one second into the video (its quartz crystal is a tiny tuning fork) →
   every quartz clock on Earth stopped at the same instant → the day goes on without them, and keeps every dent.
   ===================================================================== */

CONFIG.duration = 60.6;
CONFIG.seed = 20261008;
Object.assign(CONFIG.camera, {
  cameraHeight: 1.68, walkSpeed: 1.3, bobStrength: 0.014, bobFrequency: 1.72,
  breathingStrength: 0.005, breathRate: 15, fov: 64, shakeStrength: 1.0,
});
CONFIG.render.shadowMapSize = 2048;

// The first cut's street beats (a car over a speed table, a truck, a footbridge, a three-car crash, a tap) are cut from the
// film. Their code stays in cars.js / city.js / cast.js and is only built when this is true.
const NE_STREET = false;

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (story seconds). Every other file keys off these.
// ---------------------------------------------------------------------------------------------------------------------
const NE = {
  title: [-0.6, 3.5],
  rule: [1.0, 1.45],           // shape recovery 100 % → 0 % under the title, from the clock's last step
  stop: 1.0,                   // the second hand's last step: every quartz clock stops at 3:41:52 (the fork can't ring any more)
  // the opening, seated at the café table: a Newton's cradle (it clacks, then the hit after the rule just shoves the row
  // along: NE_CRADLE), then a low insert beside it with a ghost of the ball that should have flown out
  cradleIns: [1.75, 5.6],
  // the bounce: contact times of the solid rubber ball with the ground (the 4th is weak, then it lands dead at ≈ 1.45)
  dribble: { t0: -1.08, P: 0.62 },
  ballShot: [1.75, 5.6],       // low beside the dead ball: the outline of its round shape; his hand presses on it
  poke: 3.4,
  // the montage of everyday things (pov 0 inserts)
  mont: [[5.6, 7.55, 'racket'], [7.55, 9.5, 'shoe'], [9.5, 11.45, 'cushion'], [11.45, 13.4, 'band']],
  back: 13.4,
  // the trampoline
  jump: 15.45, land: 15.98, jump2: 16.6, land2: 17.0,
  // the bow, first person at the archery booth: nock, draw, aim, let go… the arrow drops; a low look along it at the target
  bow: { t0: 18.2, draw: [18.45, 19.4], release: 20.2, low: 20.75, shot: [21.2, 23.4] },
  // the tuning fork at the café table: lift, strike the table edge, bring it up to your face (the prong stays pushed in)
  fork: { t0: 23.4, strike: 24.32, up: [24.45, 25.05], t1: 27.3 },
  // your watch (left wrist): it stopped at 3:41:52, one second into the video
  watch: { t0: 27.3, up: [27.4, 28.05], t1: 30.9 },
  // inside the watch: the quartz crystal (a tiny tuning fork), still
  quartz: [30.9, 37.3],
  // the plaza's clock, stopped at the same second; then the camera rises for the time-lapse
  clockShot: [37.3, 40.9],
  // the rest of the day in time-lapse over the plaza (real time 3:42 → 9:05 pm); the clocks never move. Two close inserts
  // (the trampoline, a tree), back to the plaza at dusk, then night on the clock
  lapse: [40.9, 60.6],
  ins: { tramp: [44.9, 47.3], tree: [47.3, 49.6] },
  line: [49.8, 55.5],
  night: 55.6,
  note: [55.8, 58.3],
  rewatch: [58.5, 60.45],
  end: 60.6,
  // (the cut street beats — only used by the kept code when NE_STREET is on)
  car: { t0: 19.0, z0: 30.5 }, carLook: 21.6, wheelShot: [23.3, 26.9], traffic: [33.6, 40.8], truckShot: [36.5, 39.6],
  bridge: [42.2, 47.6], crash: 53.6, crashShot: [52.8, 54.7], crashSlow: [53.35, 55.0], wreckShot: [54.7, 59.4],
  tap: 60.9, tapBack: [61.8, 62.6], tapShot: [59.4, 63.4], endShot: 65.3,
};

// the rule's value over time (1 = things recover their shape → 0 = nothing springs back). HUD, grade, sound and props read it.
function neRule(t) { return 1 - MathX.smooth(t, NE.rule[0], NE.rule[1]); }
function neMont(t) { for (const m of NE.mont) if (t >= m[0] && t < m[1]) return m; return null; }
// the time-lapse: 0 → 1 across it (the sun's clock), and the time of day it shows
function neLapse(t) { return MathX.clamp((t - NE.lapse[0]) / (NE.lapse[1] - 1.0 - NE.lapse[0]), 0, 1); }
const NE_STOPPED = { h: 3, m: 41, s: 52 };                // every clock: 3:41:52 pm (it showed 3:41:51 at the first frame)
function neSunMinutes(t) { return 15 * 60 + 42 + Ease.inOutSine(neLapse(t)) * (21 * 60 + 5 - (15 * 60 + 42)); }
const neClockText = (mins) => { const h = Math.floor(mins / 60), m = Math.floor(mins % 60); return `${h > 12 ? h - 12 : h}:${String(m).padStart(2, '0')} PM`; };

// where you stand: by the plaza for the ball, the montage and the trampoline; at the archery line; at the café table
const NE_YOU = { x: 11.4, z: -2.9 };
const NE_ARCH = { x: 18.0, z: -16.6, target: [18.0, -31.2] };
const NE_TABLE = { x: 10.5, z: 5.4 };
const NE_KERB = { x: 8.3, z: -2.1 };              // (the cut street beats)

// text helpers
const neRecovery = (t) => `${Math.round(neRule(t) * 100)}%`;

const SCRIPT = {
  meta: { title: 'What if everything lost its elasticity?', wav: 'no-elasticity-soundtrack.wav' },
  events: [
    { id: 'start', time: 0.0, label: 'The plaza; a teenager bouncing a solid rubber ball; the title (the clock shows 3:41:51)' },
    { id: 'rule', time: NE.rule[0], label: 'Every clock stops at 3:41:52; shape recovery drains to 0 %' },
    { id: 'cradle', time: 1.56, label: 'The cradle: the hit just shoves the row along; no ball flies out' },
    { id: 'dead', time: 1.45, label: 'The ball lands… and stays down' },
    { id: 'ball', time: NE.ballShot[0], label: 'Low beside it: the flat spot stays' },
    { id: 'mont', time: NE.mont[0][0], label: 'Everyday things: racket, shoe, cushion, rubber band' },
    { id: 'back', time: NE.back, label: 'Even things built to bounce back' },
    { id: 'tramp', time: NE.jump, label: 'The trampoline: the springs stretch, the mat stays down; the kid is fine' },
    { id: 'bow', time: NE.bow.t0, label: 'The bow: draw… let go… the arrow just drops' },
    { id: 'arrow', time: NE.bow.shot[0], label: 'Low along the fallen arrow: the target is untouched' },
    { id: 'fork', time: NE.fork.t0, label: 'A tuning fork: it goes "tk" instead of ringing' },
    { id: 'watch', time: NE.watch.t0, label: 'Your watch stopped at 3:41:52, one second into the video' },
    { id: 'quartz', time: NE.quartz[0], label: 'Inside the watch: the quartz tuning fork, still' },
    { id: 'clock', time: NE.clockShot[0], label: 'The plaza clock: every quartz clock stopped at the same instant' },
    { id: 'lapse', time: NE.lapse[0], label: 'Time-lapse: the day goes on; the clocks don’t; every dent stays' },
    { id: 'line', time: NE.line[0], label: 'The closing line' },
  ],

  // your head. Yaw + is left (0 = down the avenue, −Z); the plaza is to your right.
  camera: {
    baseY: 0.15,
    x: [[0, NE_TABLE.x], [5.55, NE_TABLE.x], [5.6, NE_YOU.x, 'step'], [18.15, NE_YOU.x], [18.2, NE_ARCH.x, 'step'], [23.35, NE_ARCH.x], [23.4, NE_TABLE.x, 'step'], [75, NE_TABLE.x]],
    z: [[0, NE_TABLE.z], [5.55, NE_TABLE.z], [5.6, NE_YOU.z, 'step'], [18.15, NE_YOU.z], [18.2, NE_ARCH.z, 'step'], [23.35, NE_ARCH.z], [23.4, NE_TABLE.z, 'step'], [75, NE_TABLE.z]],
    // (seated at the café table for the cradle, the fork and the watch)
    height: [[0, 1.22], [5.55, 1.22], [5.6, 1.68, 'step'], [23.35, 1.68], [23.4, 1.22, 'step'], [75, 1.22]],
    yaw: [[0, -90], [5.55, -90], [5.6, -31, 'step'],
      [13.4, -27, 'step'], [14.6, -39], [15.2, -40.4], [18.15, -40],
      // the bow: aim at the target (straight down the plaza); after the release, hold on the bent bow and the slack string
      [18.2, 1.2, 'step'], [20.2, 0.6], [21.2, 1.5],
      // the café table: the fork, then your watch
      [23.4, -88, 'step'], [24.3, -90], [25.1, -92], [27.3, -92], [28.1, -95], [30.9, -95.5], [75, -95.5]],
    pitch: [[0, -16], [1.75, -16.5], [5.55, -16.5], [5.6, -18, 'step'], [NE.mont[3][0], -34, 'step'],
      [13.4, -9, 'step'], [14.6, -5], [18.15, -5],
      [18.2, -1.5, 'step'], [20.2, -1.2], [21.2, -4],
      [23.4, -26, 'step'], [24.05, -38], [24.45, -38], [25.15, -8, 'outQuad'], [27.3, -7], [28.1, -9], [30.9, -10], [75, -10]],
    fov: [[0, 50], [1.75, 46], [5.55, 46], [5.6, 38, 'step'], [NE.mont[3][0], 64, 'step'],
      [13.4, 42, 'step'], [14.6, 32], [15.2, 30], [18.15, 30],
      [18.2, 72, 'step'], [20.2, 70], [20.9, 80], [21.2, 80],
      [23.4, 52, 'step'], [24.0, 40], [24.5, 40], [25.4, 44], [27.3, 42], [28.1, 34], [30.9, 32], [75, 32]],
    startles: [[NE.bow.release + 0.02, 0.25]],
    shakes: [],
  },

  // your hands: the rubber band; the bow (left: bow hand, right: on the string); the tuning fork (right); your watch (left)
  hands: {
    right: [[0, 'hidden'], [11.45, 'bandIn!'], [11.8, 'bandOut'], [12.5, 'bandIn'], [13.4, 'hidden!'],
      [NE.bow.t0, 'nock!'], [NE.bow.draw[0], 'drawn'], [NE.bow.release, 'loose'], [NE.bow.low, 'hidden'],
      [NE.fork.t0, 'forkUp!'], [23.72, 'forkAim'], [24.2, 'forkHit'], [NE.fork.up[0], 'forkShow'], [NE.fork.t1 - 0.1, 'hidden'],
      [NE.watch.t1, 'hidden!']],
    left: [[0, 'hidden'], [11.45, 'bandIn!'], [11.8, 'bandOut'], [12.5, 'bandIn'], [13.4, 'hidden!'],
      [NE.bow.t0, 'bowHold!'], [20.45, 'bowShow'],
      [NE.fork.t0, 'hidden!'], [NE.watch.up[0], 'watchUp'], [NE.watch.t1, 'hidden!']],
  },

  tracks: {
    // 0 = a cinematic shot with no body motion (the ball, the montage inserts, the arrow, the quartz, the clock, the time-lapse)
    pov: [[0, 1], [NE.cradleIns[0], 0, 'step'], [11.45, 1, 'step'],
      [NE.bow.shot[0], 0, 'step'], [NE.bow.shot[1], 1, 'step'], [NE.quartz[0], 0, 'step'], [NE.end, 0]],
  },

  hud: {
    title: { in: NE.title[0], out: NE.title[1], fi: 0.2, fo: 0.4, cls: 'big center', html: '<span class="kick">WHAT IF EVERYTHING</span><span class="kick">LOST ITS</span><span class="hero">ELASTICITY?</span>' },
    captions: [
      { t: 1.85, until: 3.35, text: 'A Newton’s cradle passes the hit<br>along by springing back…' },
      { t: 3.5, until: 5.5, text: '…so now the balls<br>just shove together.' },
      { t: 13.55, until: 15.4, text: 'Even things built<br>to bounce back…' },
      { t: 16.1, until: 18.1, text: 'Bodies are fine. Their gear isn’t.' },
      { t: 18.35, until: 20.1, text: 'A bow is a spring<br>you bend by hand…' },
      { t: 20.3, until: 21.85, text: '…and nothing<br>bends it back.' },
      { t: 22.0, until: 23.3, text: 'The arrow just falls.' },
      { t: 23.5, until: 24.38, text: 'Tuning forks ring<br>by springing back.' },
      { t: 24.5, until: 27.2, text: 'This one just goes “tk”.' },
      { t: 28.1, until: 29.5, text: 'Your watch stopped too…' },
      { t: 29.6, until: 30.85, text: '…one second<br>into this video.' },
      { t: 31.2, until: 33.5, text: 'Inside it: a quartz tuning fork,<br>smaller than a grain of rice.' },
      { t: 33.65, until: 35.75, text: 'It keeps time by springing back<br>32,768 times a second.' },
      { t: 35.9, until: 37.2, text: 'No spring-back. No tick.' },
      { t: 37.5, until: 39.3, text: 'Every quartz clock on Earth<br>stopped at the same instant.' },
      { t: 39.45, until: 40.85, text: 'So did every phone<br>and computer.' },
      { t: 41.3, until: 43.9, text: 'The clocks stay at 3:41.<br>The day doesn’t.' },
      { t: 44.2, until: 47.2, text: 'And everything people use<br>keeps the shape they leave it in.' },
      { t: 47.45, until: 49.5, text: 'The trees keep every gust.' },
      { t: NE.line[0], until: 52.3, text: 'Without elasticity…' },
      { t: 52.6, until: NE.line[1], text: '…almost nothing gets a second chance<br>to return to shape.' },
      { t: NE.rewatch[0], until: NE.rewatch[1], text: 'Now watch the clock<br>in the first second.' },
    ],
    readouts: [
      { from: -0.6, until: 5.5, top: 210, label: 'SHAPE RECOVERY', value: neRecovery, sub: (t) => (t >= NE.rule[1] + 0.1 ? 'NOTHING SPRINGS BACK' : '') },
      { from: NE.bow.t0, until: NE.bow.shot[1], top: 210, label: 'LAUNCH SPEED', value: (t) => (t < NE.bow.release + 0.15 ? '—' : '0 km/h'), sub: (t) => (t < NE.bow.release + 0.15 ? 'DRAWN · AIMED' : 'NORMALLY ABOUT 200 km/h') },
      { from: NE.fork.t0 + 0.1, until: NE.fork.t1, top: 210, label: 'TUNING FORK', value: (t) => (t < NE.fork.strike + 0.12 ? '440 Hz' : 'SILENT'), sub: (t) => (t < NE.fork.strike + 0.12 ? 'NOTE A, WHEN IT RINGS' : 'THE PRONG STAYS PUSHED IN') },
      { from: NE.watch.up[1] - 0.2, until: NE.watch.t1, top: 210, label: 'YOUR WATCH', value: '3:41:52', sub: 'STOPPED 1 s INTO THIS VIDEO' },
      { from: NE.quartz[0] + 0.3, until: NE.quartz[1], top: 210, label: 'QUARTZ CRYSTAL', value: (t) => (t < 35.85 ? '32,768 Hz' : '0 Hz'), sub: (t) => (t < 35.85 ? 'WHEN IT SPRINGS BACK' : 'IT DOESN’T') },
      { from: NE.clockShot[0] + 0.2, until: NE.clockShot[1], top: 210, label: 'EVERY QUARTZ CLOCK', value: '3:41:52', sub: 'STOPPED AT THE SAME INSTANT' },
      { from: NE.lapse[0] + 0.3, until: NE.end, top: 210, label: 'THE CLOCKS SAY', value: '3:41 PM', sub: '' },
      { from: NE.lapse[0] + 0.3, until: NE.end, top: 420, label: 'THE REAL TIME', value: (t) => neClockText(neSunMinutes(t)), sub: '' },
    ],
    notes: [{ t: NE.note[0], until: NE.note[1], text: 'Fictional rule: solids never spring back.<br>People, air and water are unchanged.' }],
  },
};

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
