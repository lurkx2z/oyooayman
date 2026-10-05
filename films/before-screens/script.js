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
CONFIG.duration = 67.6;                 // phases A–D built; grows to 90 s when E is built.
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

// a child's whole performance from scenes: [from, to, { path | at, act | states, face, y, seat, stride }]
// → one path (with instant moves between scenes), states, and per-scene facing, height, seat and visibility
function perf(id, look, scenes, extra = {}) {
  const path = [], states = [], faces = [], ys = [], seats = [], show = [], strides = [];
  let stride = 1.32;
  const push = (t, x, z) => { if (path.length && t <= path[path.length - 1][0]) t = path[path.length - 1][0] + 0.001; path.push([t, x, z]); };
  for (const [t0, t1, S] of scenes) {
    const P = S.path || [[t0, S.at[0], S.at[1]]];
    if (P[0][0] > t0) push(t0, P[0][1], P[0][2]);
    for (const k of P) push(k[0], k[1], k[2]);
    const last = P[P.length - 1];
    if (last[0] < t1) push(t1, last[1], last[2]);
    for (const st of S.states || [[t0, S.act || 'idle']]) states.push(st);
    faces.push([t0, S.face === undefined ? null : S.face]);
    ys.push([t0, S.y || 0]); seats.push([t0, S.seat]);
    show.push([t0, t1]);
    if (S.stride) stride = S.stride;
    strides.push([t0, S.stride || 1.32]);
  }
  states.sort((a, b) => a[0] - b[0]);
  return Object.assign({ id, look, path, states, faces, ys, seats, show, stride, strides }, extra);
}

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
    { id: 'marbles', time: 15.0, label: 'Match cut down: a marble ring' },
    { id: 'flick', time: 17.35, label: 'Your shot: click, one knocked out' },
    { id: 'miss', time: 19.35, label: 'Your friend misses' },
    { id: 'top', time: 20.35, label: 'A spinning top' },
    { id: 'top_fall', time: 23.85, label: 'The top wobbles and falls' },
    { id: 'jacks', time: 24.35, label: 'Jacks' },
    { id: 'workshop', time: 26.35, label: 'If you did not own the toy…' },
    { id: 'montage', time: 30.85, label: 'Build: sticks, paper, tail' },
    { id: 'kite_reveal', time: 32.85, label: 'The kite' },
    { id: 'meadow', time: 34.85, label: 'The meadow: run with the string' },
    { id: 'release', time: 35.3, label: 'Your friend lets go: it climbs' },
    { id: 'sky', time: 37.8, label: 'Look up: the big sky' },
    { id: 'stick', time: 42.4, label: 'Just a stick' },
    { id: 'imagine', time: 46.0, label: 'Imagination: the castle rises' },
    { id: 'clash', time: 48.2, label: 'Swords clash' },
    { id: 'smash', time: 50.6, label: 'Smash cut: back to the street' },
    { id: 'social', time: 55.0, label: 'A long rope: games need others' },
    { id: 'hide', time: 56.6, label: 'Hide-and-seek' },
    { id: 'hopscotch', time: 58.0, label: 'Hopscotch' },
    { id: 'catch', time: 59.4, label: 'Catch!' },
    { id: 'chase', time: 60.8, label: 'Everyone runs: PLAYERS 12' },
    { id: 'sunset', time: 62.6, label: 'The sun goes down' },
    { id: 'lamplighter', time: 65.55, label: 'The lamplighter' },
    { id: 'parlour', time: 67.6, label: '(phase E: stories at night)' },
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
    // imagination: the colour wash, the castle rising, knight gear, the blade growing; all snap off at the smash cut
    wash: [[0, 0], [45.95, 0], [46.35, 1], [50.58, 1], [50.6, 0, 'step']],
    castle: [[0, 0], [46.05, 0], [47.4, 1, 'linear'], [50.58, 1], [50.6, 0, 'step']],
    gear: [[0, 0], [46.3, 0], [46.9, 1], [50.58, 1], [50.6, 0, 'step']],
    sword: [[0, 0], [46.2, 0], [46.75, 1, 'outQuad'], [50.58, 1], [50.6, 0, 'step']],
    imagFlash: [[0, 0], [45.95, 0], [46.08, 0.42], [46.6, 0]],
    // time of day: 0 late morning → 1 sunset → 1.12 dusk (a time-lapse over the games' end)
    sunT: [[0, 0], [62.6, 0], [66.0, 1, 'inOutSine'], [67.6, 1.12]],
  },

  camera: {
    baseY: 0,               // heights below are absolute eye heights (floor heights are in the track)
    // a 'step' key is a cut: the value jumps at that key
    x: [[0, BS.seat.x], [4.6, BS.seat.x], [5.3, 12.2], [6.0, 10.75, 'linear'], [6.9, 9.3, 'linear'], [8.4, 8.75, 'outQuad'],
      [9.5, 6.95], [9.6, 6.7], [12.1, 6.6], [12.6, 6.1, 'inQuad'], [15.0, 4.7, 'linear'],
      // B: marble ring (kneel) · top · jacks · workshop · montage close-ups · kite reveal
      [15.01, -2.72, 'step'], [20.34, -2.72], [20.36, -6.3, 'step'], [24.34, -6.3], [24.36, -5.55, 'step'], [26.34, -5.55],
      [26.36, -6.0, 'step'], [27.9, -9.85], [30.84, -9.85], [30.86, -11.2, 'step'], [31.84, -11.2], [31.86, -10.6, 'step'], [32.34, -10.62],
      [32.36, -10.65, 'step'], [32.84, -10.66], [32.86, -10.15, 'step'], [34.84, -10.32],
      // C: meadow run west · turn to the kite · back in the street with a stick · the duel
      [34.86, -34.6, 'step'], [35.3, -34.7], [37.0, -37.6, 'inOutSine'], [42.39, -39.4], [42.41, 2.0, 'step'], [48.0, 2.0], [48.2, 2.05], [49.0, 1.95], [53.6, 2.0], [55.0, 2.4],
      // D: the long rope · behind a barrel · hopscotch · catch · the chase · sunset and the lamplighter
      [56.58, 2.7], [56.6, -6.05, 'step'], [57.2, -5.9], [57.98, -5.92], [58.0, 2.6, 'step'], [59.38, 2.6], [59.4, 2.4, 'step'], [60.8, 2.4], [62.6, 1.8, 'linear'], [63.4, 1.6, 'outQuad'], [67.6, 1.7]],
    z: [[0, BS.seat.z], [4.6, BS.seat.z], [5.3, 1.4], [6.0, 1.26, 'linear'], [6.9, 1.2, 'linear'], [8.4, 1.15],
      [9.6, 1.05], [12.1, 0.95], [12.6, 0.4, 'inQuad'], [15.0, -8.2, 'linear'],
      [15.01, -9.25, 'step'], [20.34, -9.25], [20.36, -11.55, 'step'], [24.34, -11.6], [24.36, -13.75, 'step'], [26.34, -13.75],
      [26.36, -21.35, 'step'], [27.9, -23.15], [30.84, -23.15], [30.86, -23.22, 'step'], [31.84, -23.22], [31.86, -23.8, 'step'], [32.34, -23.79],
      [32.36, -23.0, 'step'], [32.84, -23.01], [32.86, -23.45, 'step'], [34.84, -23.42],
      [34.86, -23.2, 'step'], [35.3, -23.2], [37.0, -23.5, 'inOutSine'], [42.39, -23.9], [42.41, -30.0, 'step'], [48.0, -30.0], [48.2, -30.25], [49.0, -30.1], [53.6, -30.2], [55.0, -31.4],
      [56.58, -34.4], [56.6, -54.15, 'step'], [57.98, -54.1], [58.0, -45.1, 'step'], [59.38, -45.2], [59.4, -50.6, 'step'], [60.8, -50.6], [62.6, -57.6, 'linear'], [63.4, -59.2, 'outQuad'], [67.6, -59.4]],
    height: [[0, 1.47], [4.6, 1.47], [5.25, 1.85, 'inOutQuad'], [8.45, 1.85], [8.75, 1.7], [9.1, 1.56], [9.45, 1.42], [15.0, 1.42],
      [15.01, 1.36, 'step'], [15.9, 0.66, 'inOutQuad'], [20.34, 0.65], [20.36, 1.42, 'step'], [21.75, 1.36], [22.3, 0.86], [24.34, 0.84],
      [24.36, 1.3, 'step'], [24.9, 0.88], [26.34, 0.88], [26.36, 1.42, 'step'], [30.84, 1.42], [30.86, 1.78, 'step'], [31.84, 1.74],
      [31.86, 1.35, 'step'], [32.34, 1.34], [32.36, 1.25, 'step'], [32.84, 1.24], [32.86, 0.95, 'step'], [34.84, 0.98],
      [34.86, 1.38, 'step'], [42.39, 1.38], [42.41, 0.92, 'step'], [43.2, 0.92], [43.9, 1.42], [47.6, 1.42], [48.2, 1.36], [48.6, 1.42], [55.0, 1.42],
      [56.58, 1.42], [56.6, 0.86, 'step'], [57.2, 0.92], [57.98, 0.9], [58.0, 1.42, 'step'], [67.6, 1.42]],
    yaw: [[0, 91], [3.3, 91], [4.2, 92], [6.9, 90], [7.5, 82], [8.4, 64], [9.35, 70], [9.6, 76], [9.95, 102], [10.25, 96], [10.85, 38], [11.6, 14], [12.6, 6], [15.0, 2],
      [15.01, 90, 'step'], [17.6, 90], [18.1, 97], [19.4, 92], [20.34, 88], [20.36, 0, 'step'], [24.34, 4], [24.36, 50, 'step'], [26.34, 48],
      [26.36, 92, 'step'], [27.9, 98], [30.84, 96], [30.86, 0, 'step'], [31.84, 2], [31.86, 124, 'step'], [32.34, 125], [32.36, 48, 'step'], [32.84, 48],
      [32.86, 92, 'step'], [34.84, 95],
      [34.86, -88, 'step'], [36.0, -86], [37.5, -84], [40.0, -88], [42.39, -90], [42.41, 0, 'step'], [46.0, 0], [46.6, -24], [47.2, 18], [47.7, 0], [50.6, 0], [53.6, 2], [55.0, 38],
      [55.6, 46], [56.58, 46], [56.6, 168, 'step'], [57.3, 176], [57.98, 175], [58.0, 0, 'step'], [59.38, 0], [59.4, 12, 'step'], [60.4, 14], [60.8, 6], [62.6, -4], [63.6, 82], [64.4, 84], [65.5, -102], [67.6, -105]],
    pitch: [[0, -27], [2.4, -27], [3.3, -25], [4.25, -2], [5.3, -4], [6.0, -1], [6.9, 1], [8.4, -3], [8.7, -14], [9.4, -9], [9.8, -3], [10.6, -2], [12.6, -4], [14.4, -5], [15.0, -30],
      [15.01, -46, 'step'], [15.9, -58], [17.3, -60], [17.7, -57], [19.3, -56], [20.34, -55], [20.36, -46, 'step'], [21.2, -38], [21.6, -62], [24.34, -62],
      [24.36, -34, 'step'], [24.9, -44], [26.34, -44], [26.36, -4, 'step'], [27.9, -18], [28.4, -34], [30.84, -34], [30.86, -86, 'step'], [31.84, -85],
      [31.86, -39, 'step'], [32.34, -40], [32.36, -43, 'step'], [32.84, -43], [32.86, 20, 'step'], [34.84, 24],
      [34.86, 2, 'step'], [35.3, 4], [36.2, 16], [37.0, 26], [38.5, 38], [40.0, 45], [41.5, 49], [42.39, 50], [42.41, -62, 'step'], [43.2, -55], [43.9, -14], [45.0, -10], [46.0, -8], [46.6, 6], [47.2, 10], [47.7, -2], [50.6, -2], [53.6, -4], [55.0, -6],
      [56.58, -4], [56.6, -2, 'step'], [57.98, 0], [58.0, -30, 'step'], [59.38, -28], [59.4, -4, 'step'], [60.3, -2], [60.42, -7], [60.8, -6], [62.6, -4], [63.6, 4], [64.4, 6], [65.5, 18], [67.6, 16]],
    fov: [[0, 62]],
    startles: [[9.95, 0.5], [17.62, 0.18], [50.62, 0.35], [60.43, 0.3]],     // the boy rushing past; glass on glass; the smash cut
    shakes: [[46.1, 0.3, 0.9], [48.2, 0.7, 0.16], [49.05, 0.55, 0.16], [49.95, 0.4, 0.14]],    // walls rising; the two clashes
    sag: [[0, 0]], roll: [[0, 0], [10.0, 0], [10.3, -2.2], [10.9, 0]],
  },

  // first-person hands (poses in films/before-screens/hands.js)
  hands: {
    right: [[0, 'phone'], [0.42, 'swipe'], [0.62, 'phone'], [1.02, 'swipe'], [1.22, 'phone'], [2.48, 'tap'], [2.6, 'phone'], [2.86, 'tap'], [2.98, 'phone'],
      [3.45, 'lower'], [4.1, 'hidden'], [5.45, 'handle'], [5.98, 'push'], [6.55, 'hidden'],
      // B: knuckle down behind your shooter and flick; hold the top, wind up, throw
      [15.7, 'knuckle'], [17.33, 'flick'], [17.75, 'hidden'], [20.36, 'topHold', 'step'], [20.95, 'topWind'], [21.3, 'topThrow'], [21.75, 'hidden'],
      // C: the kite string, then the stick: pick it up, look at it, it's a sword: swing, block, swing
      [34.86, 'stringHold', 'step'], [42.4, 'hidden', 'step'], [42.7, 'reachDown'], [43.15, 'grab'], [43.5, 'stickHold'],
      [46.3, 'swordReady'], [47.75, 'swingBack'], [48.05, 'swingHit'], [48.5, 'swordReady'], [48.85, 'block'], [49.35, 'swordReady'], [49.6, 'swingBack'], [49.85, 'swingHit'], [50.2, 'swordReady'],
      [50.62, 'stickHold', 'step'], [53.8, 'hidden'],
      // D: both hands up for the ball, then hold it
      [59.42, 'catchReady'], [60.42, 'catchHold'], [60.95, 'hidden']],
    left: [[0, 'hidden'], [59.42, 'catchReady'], [60.42, 'catchHold'], [60.95, 'hidden']],
  },

  hud: {
    title: { in: -0.6, out: 1.85, html: 'How did kids have fun<br>before screens?' },
    stack: [{ t: 2.35, until: 4.25, lines: [[2.35, 'No phone.'], [2.8, 'No TV.'], [3.25, 'No internet.']] }],
    captions: [
      { t: 4.3, until: 6.05, text: 'So what did kids actually do all day?' },
      { t: 10.2, until: 12.45, text: 'For many kids, the playground wasn’t a screen.' },
      { t: 12.7, until: 14.95, text: 'It was the street.' },
      { t: 16.4, until: 19.1, text: 'Sometimes the entire game fit in your pocket.' },
      { t: 21.1, until: 23.8, text: 'A few marbles could become a whole afternoon.' },
      { t: 26.8, until: 29.6, text: 'And if you didn’t own the toy you wanted…' },
      { t: 31.0, until: 33.6, text: '…you could make one.' },
      { t: 42.8, until: 45.5, text: 'And sometimes, the toy wasn’t really the point.' },
      { t: 51.0, until: 53.8, text: 'A stick could become anything.' },
      { t: 55.3, until: 57.9, text: 'And most games had something else built in…' },
      { t: 59.5, until: 62.1, text: '…other kids.' },
      { t: 64.2, until: 66.9, text: 'When the sun went down…' },
    ],
    readouts: [{ from: 7.6, until: 11.6, label: 'YEAR', value: 'c. 1905', ctx: 'A TOWN STREET' }, { from: 60.9, until: 63.7, label: 'PLAYERS', value: '12', top: 236 }],
  },

  /* ---- the children (and two grown-ups): the same gang of friends turns up scene after scene.
     Each kid is a list of scenes: [from, to, { path: [[t, x, z], ...] | at: [x, z], act | states, face, y, seat, stride }]
     (see perf() below; looks → films/before-screens/children.js) */
  people: [
    // the boy who rushes past within a metre, then cheers at the marble ring and builds the kite
    perf('runner', 'newsboy', [
      [0, 15.0, { stride: 2.25, path: [[0, 6.2, 9.4], [9.45, 6.2, 5.2], [10.25, 5.55, 1.0], [11.6, 5.0, -4.6], [15.0, 3.6, -18.5]], states: [[0, 'run'], [10.1, 'runLaugh']] }],
      [15.0, 20.35, { at: [-3.6, -8.4], face: 0, states: [[15.0, 'kneelWatch'], [17.7, 'kneelCheer'], [18.6, 'kneelWatch']] }],
      [26.35, 34.85, { at: [-11.85, -23.0], face: -90, states: [[26.35, 'benchWork'], [32.85, 'holdKiteUp']] }],
      [34.85, 42.4, { stride: 2.0, path: [[34.85, -31.6, -23.2], [35.9, -31.6, -23.2], [37.2, -33.2, -21.6], [42.4, -33.3, -21.5]], face: 90, states: [[34.85, 'holdKiteUp'], [35.3, 'launch'], [35.9, 'run'], [37.2, 'lookUp']] }],
      [42.4, 54.9, { stride: 1.6, path: [[42.4, 2.25, -33.3], [47.6, 2.25, -33.3], [48.0, 2.2, -32.0], [48.6, 2.3, -32.4], [49.0, 2.2, -31.9], [49.5, 2.3, -32.5], [53.6, 2.3, -32.5], [55.0, -0.6, -37.0]], face: 176,
        states: [[42.4, 'idle'], [46.0, 'duelStance'], [47.6, 'run'], [47.95, 'duelBlock'], [48.45, 'duelStance'], [48.8, 'duelSwing'], [49.3, 'duelStance'], [49.75, 'duelBlock'], [50.1, 'duelStance'], [50.6, 'laughStand'], [53.6, 'run']] }],
      [59.4, 60.8, { at: [1.25, -55.1], face: -165.7, act: 'catchIdle' }],
      [60.8, 62.6, { stride: 2.2, path: [[60.8, 1.0, -55.3], [62.6, 0.2, -61.8]], act: 'run' }],
      [62.6, 67.6, { stride: 1.3, path: [[62.6, 0.2, -61.8], [64.6, 0.4, -61.6], [67.6, 5.6, -63.5]], states: [[62.6, 'run'], [63.0, 'idle'], [64.4, 'wave'], [65.3, 'walk']] }],
    ]),
    // hoop racers: one rolls past during the reveal, two more pass you after the runner; then the top and the jacks
    perf('hoop1', 'sailor', [
      [0, 15.0, { stride: 2.1, hoop: true, path: [[0, 2.6, 4.4], [5.6, 2.6, 4.4], [9.2, 1.4, -6.4], [11.6, 0.8, -14.2], [15.0, 0.2, -25.0]], act: 'hoopRun' }],
      [20.35, 24.35, { at: [-6.4, -13.5], face: -175, act: 'lookDown' }],
      [54.9, 56.7, { at: [-3.4, -38.6], face: -90, act: 'turnRope' }],
      [60.8, 62.6, { stride: 2.1, path: [[60.8, 4.2, -53.6], [62.6, 3.2, -60.6]], act: 'run' }],
      [62.6, 64.6, { stride: 1.3, path: [[62.6, 3.2, -60.6], [64.6, 6.2, -62.4]], act: 'walk' }],
    ], { hoop: true }),
    perf('hoop2', 'girlPinafore', [
      [0, 15.0, { stride: 2.0, path: [[0, 1.0, 13.0], [5.6, 1.0, 13.0], [9.0, 0.6, 5.6], [12.0, 0.0, -4.6], [15.0, -0.6, -15.0]], act: 'hoopRun' }],
      [24.35, 26.35, { at: [-6.95, -14.2], face: -120, act: 'sitCross' }],
      [56.6, 58.0, { at: [-3.7, -39.2], face: 160, act: 'hide' }],
      [60.8, 62.6, { stride: 2.0, path: [[60.8, -2.8, -54.4], [62.6, -1.6, -61.0]], act: 'run' }],
      [62.6, 64.6, { stride: 1.3, path: [[62.6, -1.6, -61.0], [64.6, -4.4, -63.2]], act: 'walk' }],
    ], { hoop: true }),
    perf('hoop3', 'boyBare', [
      [0, 15.0, { stride: 2.2, path: [[0, 3.4, 15.0], [5.6, 3.4, 15.0], [9.0, 3.0, 7.6], [12.0, 2.6, -3.4], [15.0, 2.0, -14.4]], act: 'hoopRun' }],
      [58.0, 59.4, { at: [1.25, -49.3], face: -120, act: 'cheer' }],
      [60.8, 62.6, { stride: 2.2, path: [[60.8, 0.8, -49.4], [62.6, 1.4, -56.2]], act: 'run' }],
      [62.6, 64.0, { stride: 1.3, path: [[62.6, 1.4, -56.2], [64.0, 4.4, -55.6]], act: 'walk' }],
    ], { hoop: true }),
    // tag in the street right in front of the porch; at 11.6 s the chaser tags tag2, and the game drifts north
    perf('tagIt', 'boyCap', [
      [0, 15.0, { stride: 2.0, path: [[0, -2.6, -4.0], [5.6, -2.6, -4.0], [7.6, -0.2, -6.8], [8.6, 1.8, -4.2], [9.6, -0.6, -2.8], [10.4, 0.6, -6.0], [11.55, 1.6, -9.9], [12.8, 3.0, -13.5], [15.0, 3.6, -20.0]], states: [[0, 'run'], [11.3, 'reach'], [11.75, 'run']] }],
      [20.35, 24.35, { at: [-5.85, -13.0], face: 143, act: 'squatWatch' }],
      [34.85, 42.4, { stride: 2.0, path: [[34.85, -28.4, -26.4], [36.8, -30.6, -25.6], [42.4, -30.7, -25.5]], states: [[34.85, 'run'], [36.8, 'lookUp']] }],
      [42.4, 54.9, { at: [-1.7, -42.3], face: -140, states: [[42.4, 'idle'], [46.9, 'duelLoop'], [50.6, 'laughStand']] }],
      [60.8, 62.6, { stride: 2.0, path: [[60.8, -0.2, -50.0], [62.6, -0.8, -57.2]], act: 'run' }],
      [62.6, 65.5, { stride: 1.3, path: [[62.6, -0.8, -57.2], [65.5, -4.8, -57.8]], act: 'walk' }],
    ]),
    perf('tag2', 'girlBlue', [
      [0, 15.0, { stride: 1.9, path: [[0, 1.2, -7.0], [5.6, 1.2, -7.0], [7.8, 2.6, -3.6], [8.8, 0.2, -1.8], [9.8, 1.6, -5.4], [10.8, 2.2, -8.6], [11.6, 2.0, -10.6], [12.0, 2.0, -10.8], [13.4, -0.6, -14.0], [15.0, -2.4, -19.5]], states: [[0, 'run'], [11.6, 'startle'], [12.0, 'run']] }],
      [24.35, 26.35, { at: [-6.6, -14.7], face: -133, act: 'jacks' }],
      [26.35, 34.85, { at: [-11.3, -22.42], face: -6, states: [[26.35, 'benchWork'], [32.85, 'cheer']] }],
      [34.85, 42.4, { stride: 1.9, path: [[34.85, -30.4, -25.6], [36.6, -32.6, -24.8], [42.4, -32.7, -24.7]], states: [[34.85, 'run'], [36.6, 'lookUp'], [38.6, 'cheer'], [39.6, 'lookUp']] }],
      [42.4, 54.9, { at: [-2.4, -35.2], face: 135, states: [[42.4, 'idle'], [46.9, 'knightCheer'], [50.6, 'laughStand']] }],
      [54.9, 56.7, { at: [-1.5, -38.6], face: -135, act: 'jumpLong' }],
      [60.8, 62.6, { stride: 1.9, path: [[60.8, -1.4, -52.6], [62.6, -2.2, -59.4]], act: 'run' }],
      [62.6, 67.6, { stride: 1.3, path: [[62.6, -2.2, -59.4], [63.2, -2.4, -60.0], [67.6, -6.8, -63.2]], states: [[62.6, 'run'], [63.2, 'walk']] }],
    ]),
    perf('tag3', 'tallBoy', [
      [0, 15.0, { stride: 2.1, path: [[0, -3.6, -8.6], [5.6, -3.6, -8.6], [8.0, -1.6, -10.8], [9.4, -2.6, -6.6], [10.6, -1.4, -11.4], [12.0, -3.4, -15.6], [15.0, -4.0, -22.0]], states: [[0, 'run'], [12.1, 'runLaugh']] }],
      [15.0, 20.35, { at: [-4.95, -8.6], face: -115, states: [[15.0, 'lookDown'], [17.7, 'cheer'], [18.6, 'lookDown']] }],
      [26.35, 34.85, { at: [-11.1, -24.38], face: 174, states: [[26.35, 'benchWork'], [32.85, 'cheer']] }],
      [34.85, 42.4, { stride: 2.1, path: [[34.85, -29.0, -20.2], [36.6, -31.0, -22.0], [42.4, -31.1, -22.1]], states: [[34.85, 'run'], [36.6, 'lookUp']] }],
      [42.4, 54.9, { at: [-3.1, -41.0], face: 40, states: [[42.4, 'idle'], [46.9, 'duelLoop'], [50.6, 'laughStand']] }],
      [56.6, 58.0, { at: [-5.85, -44.42], face: 180, act: 'countTree' }],
      [60.8, 62.6, { stride: 2.1, path: [[60.8, -4.6, -51.8], [62.6, -3.6, -58.6]], act: 'run' }],
      [62.6, 65.0, { stride: 1.3, path: [[62.6, -3.6, -58.6], [65.0, -6.4, -61.0]], act: 'walk' }],
    ]),
    perf('tag4', 'girlCheck', [
      [0, 15.0, { stride: 1.9, path: [[0, 3.4, -10.2], [5.6, 3.4, -10.2], [8.2, 1.2, -12.4], [9.6, 3.6, -9.6], [11.0, 2.4, -14.0], [13.0, 0.8, -19.0], [15.0, 2.8, -25.0]], act: 'run' }],
      [20.35, 24.35, { at: [-6.85, -12.95], face: -135, act: 'squatWatch' }],
      [34.85, 42.4, { at: [-29.6, -24.6], face: 100, act: 'lookUp' }],
      [42.4, 54.9, { at: [4.4, -37.6], face: -140, states: [[42.4, 'idle'], [46.9, 'knightCheer'], [50.6, 'laughStand']] }],
      [58.0, 59.4, { path: [[58.0, 2.6, -50.7], [59.4, 2.6, -47.1]], act: 'hop' }],
      [60.8, 62.6, { stride: 1.9, path: [[60.8, 3.4, -51.2], [62.6, 3.8, -58.0]], act: 'run' }],
      [62.6, 66.0, { stride: 1.3, path: [[62.6, 3.8, -58.0], [66.0, 6.6, -60.8]], act: 'walk' }],
    ]),
    // a game of catch further up the street
    perf('catchG', 'girlSmall', [
      [0, 15.0, { at: [-6.3, -15.5], face: -56.6, act: 'catchIdle' }],
      [58.0, 59.4, { at: [3.85, -48.6], face: 120, act: 'idle' }],
      [60.8, 62.6, { stride: 1.8, path: [[60.8, -3.6, -49.6], [62.6, -4.2, -56.4]], act: 'run' }],
    ]),
    perf('catchB', 'braces', [
      [0, 15.0, { at: [-1.6, -18.6], face: 123.4, act: 'catchIdle' }],
      [54.9, 56.7, { at: [0.4, -38.6], face: 90, act: 'turnRope' }],
      [60.8, 62.6, { stride: 2.0, path: [[60.8, 2.0, -52.2], [62.6, 2.6, -59.0]], act: 'run' }],
    ]),
    // the marble game: you can see it from the porch, then you kneel and join it
    perf('marbleA', 'boyStripe', [
      [0, 15.0, { at: [-4.36, -9.25], face: -90, act: 'kneelWatch' }],
      [15.0, 20.35, { at: [-4.36, -9.25], face: -90, states: [[15.0, 'kneelWatch'], [19.05, 'kneelShoot'], [19.6, 'kneelWatch'], [19.95, 'kneelGroan'], [20.3, 'kneelWatch']] }],
      [54.9, 56.7, { at: [-3.7, -36.4], face: -150, act: 'cheer' }],
      [60.8, 62.6, { stride: 2.0, path: [[60.8, -0.6, -53.0], [62.6, 0.6, -60.0]], act: 'run' }],
    ]),
    perf('marbleB', 'girlApron2', [
      [0, 15.0, { at: [-3.55, -10.12], face: 180, act: 'kneelWatch' }],
      [15.0, 20.35, { at: [-3.55, -10.12], face: 180, states: [[15.0, 'kneelWatch'], [17.7, 'kneelCheer'], [18.5, 'kneelWatch']] }],
      [54.9, 56.7, { at: [-2.9, -36.0], face: -160, act: 'cheer' }],
      [56.6, 58.0, { at: [-7.15, -53.4], face: -175, act: 'hide' }],
    ]),
    // jump rope on the far sidewalk; two girls on a bench with a doll; chores: a boy with a bucket
    perf('rope', 'girlRope', [[0, 15.0, { at: [-6.3, -2.6], face: -90, act: 'jumpRope' }]]),
    perf('step1', 'girlStep1', [[0, 15.0, { at: [-7.12, 5.0], y: 0.12, seat: 0.6, face: -96, act: 'sitStep' }]]),
    perf('step2', 'girlStep2', [[0, 15.0, { at: [-7.12, 5.75], y: 0.12, seat: 0.62, face: -82, act: 'sitStep' }]]),
    perf('bucket', 'boyChores', [[0, 15.0, { stride: 1.15, path: [[0, -6.4, -26.0], [5.6, -6.4, -24.0], [15.0, -6.5, -12.5]], act: 'carry' }]]),
    // grown-ups: a woman hanging washing in a side yard, an old man on a bench watching it all
    perf('mother', 'mother', [[0, 90, { at: [-13.1, -13.6], face: -90, act: 'hangWash' }]]),
    perf('neighbour', 'neighbour', [[62.4, 67.6, { at: [8.6, -64.4], y: 0.55, face: 95, states: [[62.4, 'idle'], [63.0, 'callWave']] }]]),
    perf('lamplighter', 'lamplighter', [[62.0, 67.6, { stride: 1.4, path: [[62.0, 6.4, -51.8], [64.3, 6.2, -57.6], [67.6, 6.2, -57.6]], states: [[62.0, 'walk'], [64.3, 'idle'], [64.6, 'lampLight']] }]]),
    perf('oldman', 'oldMan', [[0, 90, { at: [-7.12, -20.6], y: 0.12, seat: 0.44, face: -90, act: 'sitBench' }]]),
  ],

  // ball throws: [t0, from, to, flight seconds]
  throws: [[7.2, 'catchG', 'catchB', 0.85], [9.0, 'catchB', 'catchG', 0.85], [10.8, 'catchG', 'catchB', 0.85], [12.5, 'catchB', 'catchG', 0.85], [14.1, 'catchG', 'catchB', 0.85],
    [59.85, 'runner', 'pov', 0.57]],   // your friend throws to you
};

// Track objects built from SCRIPT.tracks (used everywhere as SCRIPT_TRACKS.name.value(t))
const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
