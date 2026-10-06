/* =====================================================================
   SCRIPT — "What if you realized you were in a simulation?"
   ★ The one file to edit for timings, camera, hands, captions and HUD.
   Everything is keyframed on film time (seconds) and is a pure function of
   time; a 'step' key is a cut. The world runs on its own clock (sxW): the
   same as film time, except that it freezes in the fake pause, runs back
   at the reset and starts again at SX.restart. Shot plan: films/sim/PLAN.md
   ===================================================================== */

CONFIG.duration = 79.8;
CONFIG.seed = 20261012;
Object.assign(CONFIG.camera, {
  cameraHeight: 1.68,
  walkSpeed: 1.15,
  bobStrength: 0.013,
  bobFrequency: 1.7,
  breathingStrength: 0.005,
  breathRate: 14,
  fov: 66,
});
CONFIG.render.shadowMapSize = 4096;

// the beats (film seconds)
const SX = {
  x0: 9.6, z0: 4.0, v: 1.15,                // your walk down the right-hand sidewalk (toward −Z)
  stop: [14.6, 15.2],                        // you stop
  rep: { at: 14.4, back: 3.0 },              // the cyclist, the horn and the pigeons run again from here, 3 s behind
  ball: { t0: 16.0, drop: 16.2 },            // the ball rolls off the café awning
  look: { freeze: 21.4, turn: 21.6, lock: 21.95, wait: 22.6, who: 23.5, snap: 25.5 },
  wall: { touch: 27.2, off: 27.85, again: 28.2, off2: 28.6, p: [12.5, 1.6, -13.35] },
  labels: [29.6, 32.6],
  brk: { lod: 32.9, tree: 33.6, freeze: 34.3, through: 35.0, shadow: 35.25, drift: 35.6, cloud: 36.0, checker: 36.6, unstable: 37.5 },
  up: { t: 38.2, hud: 38.6, detected: 39.4, observer: 40.6, end: 42.6 },
  front: 43.0,                               // looking down again: he is standing in front of you
  cap: { t: 43.3, wait: 45.0, sees: 45.6, end: 46.8 },
  playback: [46.8, 49.8],
  edge: { lens: 49.8, out: 50.3, back: 51.15, what: 51.4 },
  approach: [52.4, 53.6],
  tap: 57.0, tap2: 59.3,
  pause: [59.3, 60.15],
  session: [60.9, 64.0],
  alarm: 64.0, repair: 64.7, snapBack: 64.8, run: 66.0,
  count: [66.6, 67.6, 68.6, 69.6],           // RESET IN 3 · 2 · 1 · (break)
  hit: 67.6,
  shatter: [69.6, 70.2, 71.6],               // the crack spreads · the pieces fall · all open
  rewind: [72.2, 73.6], white: [73.6, 73.85], restart: 74.2,
  failed: { turn: 76.6, text: 77.6, textEnd: 78.3, shh: 78.3 },
  black: 79.4,
};

// the world's clock: film time, frozen in the pause, run back at the reset (accelerating), from 0 again at the restart
function sxW(t) {
  const P = SX.pause, R = SX.rewind, gap = P[1] - P[0];
  if (t < P[0]) return t;
  if (t < P[1]) return P[0];
  if (t < R[0]) return t - gap;
  if (t < SX.restart) { const w0 = R[0] - gap, x = MathX.clamp((t - R[0]) / (R[1] - R[0]), 0, 1); return w0 * (1 - Ease.inCubic(x)); }
  return t - SX.restart;
}
// the cyclist, the horn and the pigeons: the same clock, 3 s behind from the repeat until the reset
function sxR(t) { const w = sxW(t); return t >= SX.rep.at && t < SX.restart ? w - SX.rep.back : w; }
// background people: back to their spawn points at the repair (their clock restarts there)
function sxN(t) { const w = sxW(t); return t >= SX.snapBack && t < SX.restart ? Math.max(0, w - sxW(SX.snapBack)) : w; }

// your position (the camera track) — walk, stop; the sidestep to the wall; dragged back at the reset; the opening again
const SX_ZSTOP = SX.z0 - SX.v * SX.stop[0] - SX.v * (SX.stop[1] - SX.stop[0]) / 2;
const SX_ZEND = SX.z0 - SX.v * (SX.failed.turn - SX.restart);

// HUD helpers
const sxClock = (t) => { const s = Math.max(0, t); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${(s % 60).toFixed(2).padStart(5, '0')}`; };

const SCRIPT = {
  meta: { title: 'What if you realized you were in a simulation?', wav: 'simulation-soundtrack.wav' },

  events: [
    { id: 'start', time: 0.0, label: 'A normal street; the title' },
    { id: 'deja', time: 4.2, label: 'The man in the green jacket passes… and passes again' },
    { id: 'back', time: 10.0, label: 'You look back: only one of him' },
    { id: 'repeat', time: 11.6, label: 'Bell, horn, pigeons — then all of it again (14.4); you stop' },
    { id: 'ball', time: 16.0, label: 'The ball bounces… and runs backwards; NOR—' },
    { id: 'look', time: 20.0, label: 'He freezes, looks into the lens: “Wait.” “Who’s watching us?”' },
    { id: 'wall', time: 26.2, label: 'You touch the wall: wireframe' },
    { id: 'labels', time: 29.4, label: 'Debug labels' },
    { id: 'breaks', time: 32.8, label: 'LOD pop, flat tree, frozen car, shadow, drift, cloud loop, checker' },
    { id: 'up', time: 38.2, label: 'You look up: VIEWER DETECTED · ACTIVE OBSERVER: 1' },
    { id: 'front', time: 43.0, label: 'He is in front of you; he reads the caption' },
    { id: 'playback', time: 46.8, label: 'PLAYBACK POSITION (the real timestamp)' },
    { id: 'edge', time: 49.8, label: '“What’s that?” (the right edge of the frame)' },
    { id: 'approach', time: 52.4, label: '“Can you hear me?” “Not you.” “You.”' },
    { id: 'tap', time: 57.0, label: 'He taps the lens: the picture ripples' },
    { id: 'pause', time: 59.3, label: 'Second tap: everything stops but him' },
    { id: 'session', time: 60.9, label: 'VIEWER SESSION ACTIVE · “Don’t leave.”' },
    { id: 'alarm', time: 64.0, label: 'SYSTEM: UNAUTHORIZED AWARENESS — the world repairs itself' },
    { id: 'count', time: 66.6, label: 'RESET IN 3 · 2 (he hits the screen) · 1' },
    { id: 'shatter', time: 69.6, label: 'The picture breaks: the void behind it' },
    { id: 'reset', time: 72.2, label: 'RESETTING… rewind, white, black' },
    { id: 'again', time: 74.2, label: 'The opening again — the title stops' },
    { id: 'failed', time: 76.6, label: 'RESET FAILED · shhh' },
    { id: 'black', time: 79.4, label: 'Black' },
  ],

  camera: {
    baseY: 0.15,
    x: [[0, SX.x0], [26.4, SX.x0], [27.1, 11.75], [28.85, 11.75], [29.6, 10.6], [SX.rewind[0], 10.6], [SX.rewind[1], SX.x0, 'inCubic'], [79.8, SX.x0]],
    z: [[0, SX.z0], [SX.stop[0], SX.z0 - SX.v * SX.stop[0], 'linear'], [SX.stop[1], SX_ZSTOP, 'outQuad'], [SX.rewind[0], SX_ZSTOP], [SX.rewind[1], SX.z0, 'inCubic'],
      [SX.restart, SX.z0], [SX.failed.turn, SX_ZEND, 'linear'], [SX.failed.turn + 0.8, SX_ZEND - SX.v * 0.4, 'outQuad'], [79.8, SX_ZEND - SX.v * 0.4]],
    // yaw: + is left (0 = down the street, −Z)
    yaw: [[0, 6], [4.4, 6], [4.8, 34], [5.1, 52], [5.3, 66], [5.53, 80], [5.8, 88], [6.2, 60], [6.75, 22], [7.15, 6],          // he passes; your head follows him
      [8.5, 6], [8.9, 34], [9.2, 52], [9.4, 66], [9.63, 80], [9.9, 92], [10.3, 122], [10.75, 150], [11.3, 148],                   // …again; then over your shoulder
      [11.85, 30], [12.2, 16], [12.7, 6], [13.0, -10], [13.8, -12], [14.4, -9], [15.0, -6], [15.25, 10], [15.65, 24], [16.1, -14],   // cyclist, pigeons; again
      [16.5, -11], [17.2, -6], [17.7, -3], [18.15, 0], [18.65, -2], [19.1, -4], [19.6, -8], [20.3, -11], [20.9, -10], [26.3, -10], [27.0, -84], [27.25, -84], [27.75, -80], [28.05, -84], [28.9, -84], [29.6, 40], [32.8, 46],                   // ball; first look; wall; labels
      [33.0, 58], [33.7, 52], [34.4, 55], [35.4, 52], [35.9, 38], [36.4, 40], [37.0, 44], [37.8, 40],                       // the breaks
      [38.2, 36], [39.2, 30], [42.2, 26], [43.0, 1], [64.0, 1], [64.55, 44], [65.15, 44], [65.65, 0], [SX.rewind[0], 0], [SX.rewind[1], 6, 'inCubic'],
      [SX.restart, 6], [SX.failed.turn, 6], [77.8, 5.5], [79.8, 5.5]],
    pitch: [[0, -3], [4.4, -3], [5.45, -5], [6.75, -3], [9.55, -5], [10.75, -6], [11.3, -6], [11.85, -4], [12.7, -3], [13.0, 6], [13.8, 14], [14.4, 4], [15.0, -8], [15.65, -2], [16.1, 12],
      [16.5, 12], [17.2, -12], [17.7, -6], [18.15, -12], [18.65, -6], [19.1, -12], [19.6, 0], [20.3, 10], [20.9, 1.5], [26.3, 1], [27.0, -10], [27.25, -9], [27.75, 24], [28.05, -9], [28.9, -10], [29.6, 4], [32.8, 5],
      [33.0, 1], [34.4, 0], [35.9, 2], [36.4, 16], [37.0, 9], [37.8, 8], [38.2, 8], [39.2, 58], [42.2, 55], [43.0, -2.5], [52.4, -2.5], [53.6, -1],
      [64.0, -1], [64.55, 6], [65.15, 6], [65.65, -1], [SX.rewind[0], 1], [SX.rewind[1], -3, 'inCubic'], [SX.failed.turn, -3], [77.8, -0.5], [79.8, -0.5]],
    fov: [[0, 66], [16.0, 66], [16.5, 54], [20.3, 54], [21.4, 48], [22.9, 15], [25.6, 15], [26.2, 58], [29.6, 62], [38.2, 62], [39.2, 66], [42.2, 66], [43.0, 44], [49.8, 40], [52.4, 40],
      [53.6, 50], [64.0, 50], [64.55, 58], [65.15, 58], [65.65, 56], [67.6, 60], [SX.rewind[0], 60], [SX.rewind[1], 66], [SX.failed.turn, 66], [78.0, 30], [79.8, 27]],
    startles: [[12.35, 0.2], [57.0, 0.25], [67.6, 1.0], [72.2, 0.6]],
    shakes: [[67.6, 1.2, 0.35], [69.6, 0.35, 0.5], [72.2, 0.9, 0.5]],
  },

  // your right hand: touching the wall (it repeats the touch), then shading your eyes when you look up
  hands: {
    left: [[0, 'hidden']],
    right: [[0, 'hidden'], [26.75, 'touchR'], [SX.wall.off, 'hidden'], [SX.wall.again, 'touchRx'], [SX.wall.off2, 'hidden'], [38.3, 'shadeR'], [42.1, 'hidden']],
  },

  // (the title, the corrupted caption, the status readout and the system text are drawn by film.js)
  hud: {
    captions: [
      { t: 3.9, until: 6.3, text: 'At first, you probably wouldn’t.' },
      { t: 10.2, until: 12.5, text: 'You’d probably blame your memory.' },
    ],
    readouts: [],
    says: [
      { t: SX.look.wait, until: SX.look.wait + 0.8, text: 'Wait.' },
      { t: SX.look.who, until: SX.look.snap - 0.15, text: 'Who’s watching us?' },
      { t: SX.edge.what, until: 52.4, text: 'What’s that?' },
      { t: 53.8, until: 55.1, text: 'Can you hear me?' },
      { t: 55.4, until: 56.0, text: 'Not you.' },
      { t: 56.1, until: 57.6, text: 'You.' },
      { t: 61.4, until: 62.3, text: 'Don’t leave.' },
      { t: 62.5, until: 63.95, text: 'If you leave, it resets.' },
      { t: 66.8, until: 67.5, text: 'No—' },
      { t: 68.7, until: 69.6, text: 'WAIT—' },
    ],
  },

  tracks: {},
  people: [],
};

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
