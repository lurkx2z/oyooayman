/* =====================================================================
   SCRIPT — "What if gravity became twice as strong?" (v3: the leisure centre)
   ★ The one file to edit for timing: the beats, the words, the readouts, your head (camera), your hands.
   Everything is a pure function of STORY time; CONFIG.edit cuts the take into the film.
   Plan and physics: films/gravity-2x/PLAN.md

   The rule: at GV.g0 surface gravity goes from 9.81 to 19.62 m/s² (over 0.25 s) and stays there.
   Mass and inertia do NOT change: weight (m·g) doubles, falls are faster, and so does the water's weight
   (buoyancy doubles with it: floating is unchanged).
   ===================================================================== */

CONFIG.duration = 67.5;
CONFIG.seed = 20261108;
Object.assign(CONFIG.camera, {
  cameraHeight: 1.66, walkSpeed: 1.0, bobStrength: 0.022, bobFrequency: 1.55, runStrideGain: 0.3,
  breathingStrength: 0.005, breathRate: 15, fov: 64, shakeStrength: 1.0,
});
CONFIG.render.shadowMapSize = 2048;

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (story seconds). Every other file keys off these.
// ---------------------------------------------------------------------------------------------------------------------
const GV = {
  title: [-0.6, 3.2],
  g0: 1.6, g1: 1.85,                       // gravity 1 G → 2 G
  scale: [3.3, 6.3],                       // the scale's reading (readout + caption)
  tread: { look: 6.0, slip: 7.5, sit: 8.25 },   // the runner clinging to the rails, carried off the back
  offScale: 9.3,                           // you step off the scale
  bench: { look: 10.0, heave: 11.0, drop: 12.55 },   // lifter + spotter heave the bar off the safety arms; it drops back
  shot: 15.6,                              // the free throw is released
  hang: { go: 17.3, at: 18.4, grab: 18.55, lift: 18.9, pull: 19.55, peel: 20.55, drop: 21.05 },   // you try a dead hang on the pull-up bar
  toStair: 21.7,                           // (cut) to the stair head
  stair: [23.4, 30.2],                     // down the 16 steps
  deck: 30.2,                              // the foot of the stair: along the deck
  ladder: { up: 36.6, top: 38.2, slip: 39.0, splash: 39.35 },
  sit: 40.2,                               // you sit on the edge of the deep end
  slide: 41.5,                             // and slide in
  float: 42.6,                             // floating
  diver: { stand: 44.6, look: 45.4, edge: 46.7, step: 47.9 },
  under: 49.45,                            // you duck under
  surface: 54.3,                           // you come back up beside her
  out: { turn: 55.1, wall: 56.6, push: 56.85, top: 58.55, give: 59.15 },   // you swim to the wall and try to press yourself out
  lineA: [60.6, 66.9], lineB: [62.1, 66.9], lineC: [63.6, 66.9], note: [64.5, 66.9],
  end: 67.5,
};

// the cut (story intervals kept): from your drop off the bar to the stair; past the lifeguard to the ladder; from the deck
// edge straight into the water, floating
CONFIG.edit = [[0, 21.75], [23.45, 31.3], [34.0, 40.05], [42.85, 67.5]];

const GV_G0 = 9.81, GV_G = 2 * GV_G0;
// gravity in g (1 → 2)
function gvG(t) { return 1 + MathX.smooth(t, GV.g0, GV.g1); }
// a damped step response (0 → 1 with an overshoot) starting at t0
function gvSpring(t, f = 1.3, z = 0.28, t0 = GV.g0 + 0.05) {
  if (t < t0) return 0;
  const a = t - t0, w = 2 * Math.PI * f, wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * a) * (Math.cos(wd * a) + z / Math.sqrt(1 - z * z) * Math.sin(wd * a));
}

// the leisure centre's levels (metres): the gym and the court at 0, the pool deck below, the water just under the deck
const GV_LOW = -3.2, GV_WATER = -3.32;

// the diver's fall: 10 m from the platform to the water, at 2 G
const GV_FALL = { t0: GV.diver.step, h: 10.0 };
GV_FALL.T2 = Math.sqrt(2 * GV_FALL.h / GV_G); GV_FALL.T1 = Math.sqrt(2 * GV_FALL.h / GV_G0);
GV_FALL.v2 = GV_G * GV_FALL.T2; GV_FALL.v1 = GV_G0 * GV_FALL.T1; GV_FALL.hit = GV_FALL.t0 + GV_FALL.T2;
GV_FALL.h1 = GV_FALL.v2 * GV_FALL.v2 / (2 * GV_G0);          // the height that gives the same speed at 1 G (20 m)

// the free throw: same release (2.13 m, 6.99 m/s at 52°), 3.95 m to the rim (3.05 m). At 1 G it scores; at 2 G it
// peaks at 2.90 m, below the rim, and lands 3.5 m out.
const GV_THROW = { t0: GV.shot, y0: 2.13, v: 6.99, ang: MathX.deg(52), d: 3.95, rim: 3.05 };
GV_THROW.vx = GV_THROW.v * Math.cos(GV_THROW.ang); GV_THROW.vy = GV_THROW.v * Math.sin(GV_THROW.ang);
GV_THROW.peak1 = GV_THROW.y0 + GV_THROW.vy * GV_THROW.vy / (2 * GV_G0);
GV_THROW.peak2 = GV_THROW.y0 + GV_THROW.vy * GV_THROW.vy / (2 * GV_G);

// where you are (story): on the scale, by the bench, at the glass, the stair head (by the right-hand rail), the stair foot,
// the deck, the edge of the deep end, sitting on it, floating; under water you swim toward the diver
const GV_ME = {
  scale: [0.6, 1.8], bench: [0.35, -0.95], glass: [3.6, -0.6], bar: [4.35, 0.6], head: [4.56, -5.8], foot: [4.56, -10.6],
  deck: [4.6, -15.0], edge: [3.0, -20.35], sit: [2.25, -20.35], float: [1.15, -20.6], under: [0.95, -20.9], swim: [1.3, -27.4],
  wall: [1.3, -29.48],
};

const gvFmt = (n, d = 1) => n.toFixed(d);
// your walk as keys for x (i = 0) or z (i = 1): stops at the scale, the bench, the glass; one continuous walk from the glass
// down the stair and along the deck to the deep end; then into the water
function gvPath(i) {
  const M = GV_ME, O = GV.out, k = (t, p, e) => (e ? [t, p[i], e] : [t, p[i]]);
  return [k(0, M.scale), k(GV.offScale, M.scale), k(GV.offScale + 1.5, M.bench), k(GV.bench.drop + 0.6, M.bench), k(GV.bench.drop + 2.2, M.glass),
    k(GV.hang.go, M.glass), k(GV.hang.at, M.bar), k(GV.hang.drop + 0.7, M.bar), k(GV.stair[0], M.head, 'linear'), k(GV.stair[1], M.foot, 'linear'), k(GV.deck + 4.6, M.deck, 'linear'),
    k(GV.sit - 0.2, M.edge, 'outSine'), k(GV.sit + 0.9, M.sit), k(GV.slide, M.sit), k(GV.float, M.float), k(GV.under, M.under, 'linear'), k(GV.surface - 0.3, M.swim),
    k(O.turn, M.swim), k(O.wall, M.wall), k(O.push, M.wall), k(O.top, [M.wall[0], M.wall[1] - 0.22]), k(O.give, [M.wall[0], M.wall[1] - 0.24]),
    k(O.give + 0.5, [M.wall[0], M.wall[1] + 0.1], 'outSine'), k(70, [M.wall[0] + 0.1, M.wall[1] + 0.5])];
}

const SCRIPT = {
  meta: { title: 'What if gravity became twice as strong?', wav: 'gravity-2x-soundtrack.wav' },

  events: [
    { id: 'start', time: 0.0, label: 'The gym; you on the scale; the title' },
    { id: 'g', time: GV.g0, label: 'Gravity 1 G → 2 G: the scale runs to 140 kg' },
    { id: 'tread', time: GV.tread.look, label: 'The runner is carried off the treadmill' },
    { id: 'bench', time: GV.bench.look, label: 'The bar won’t come off the safety arms' },
    { id: 'shot', time: GV.shot - 1.0, label: 'The free throw falls short' },
    { id: 'hang', time: GV.hang.go, label: 'You try to hang from the pull-up bar' },
    { id: 'stair', time: GV.stair[0], label: 'Down the stair into the pool hall' },
    { id: 'pool', time: GV.stair[1] - 1.2, label: 'Swimmers float as before' },
    { id: 'ladder', time: GV.ladder.up - 0.6, label: 'The man on the ladder can’t get out' },
    { id: 'in', time: GV.float, label: 'You float at the deep end' },
    { id: 'diver', time: GV.diver.stand, label: 'The diver on the 10 m platform' },
    { id: 'fall', time: GV.diver.step, label: 'The 10 m drop: 1.01 s, 71 km/h' },
    { id: 'under', time: GV.under, label: 'Under the water' },
    { id: 'out', time: GV.out.turn, label: 'You try to press yourself out' },
    { id: 'line', time: GV.lineA[0], label: 'The closing lines' },
  ],

  // your head: the position path and the eye height above the floor under you (film.js adds the floor: the scale's
  // platform, the stair, the deck; and in the pool, the water). Where you look is GV_LOOK in film.js.
  camera: {
    baseY: 0,
    x: gvPath(0), z: gvPath(1),
    // eye height above the floor: knees give at the change; lower and bent-kneed under the doubled weight; sitting on
    // the edge (film.js takes over from the slide: the water line)
    height: [[0, 1.66], [GV.g0, 1.66], [GV.g0 + 0.22, 1.36, 'outCubic'], [GV.g0 + 1.0, 1.52, 'inOutSine'], [GV.g0 + 2.4, 1.56],
      // the bar: up on your toes to grab it, feet off, your shoulders stretch; a pull (5 cm), back down; the drop (0.25 m
      // at 2 G: 0.16 s) and your knees taking it
      [GV.hang.grab, 1.56], [GV.hang.lift, 1.68, 'outSine'], [GV.hang.lift + 0.5, 1.6, 'outCubic'], [GV.hang.pull, 1.6], [GV.hang.pull + 0.55, 1.65, 'outSine'],
      [GV.hang.peel - 0.1, 1.6, 'inOutSine'], [GV.hang.drop, 1.59], [GV.hang.drop + 0.16, 1.34, 'inQuad'], [GV.hang.drop + 0.4, 1.04, 'outQuad'], [GV.hang.drop + 0.7, 1.12, 'inOutSine'],
      [GV.stair[0] - 0.2, 1.56],
      // a step down that your knee doesn't hold
      [25.75, 1.56], [25.95, 1.33, 'outCubic'], [26.7, 1.55, 'inOutSine'],
      [GV.sit, 1.54], [GV.sit + 0.9, 0.86, 'inOutSine'], [70, 0.86]],
    yaw: [[0, 0], [70, 0]],
    pitch: [[0, 0], [70, 0]],
    tilt: [[0, 0], [GV.g0 + 0.1, 0], [GV.g0 + 0.35, -2.4], [GV.g0 + 1.4, 0], [70, 0]],
    fov: [[0, 64], [70, 64]],
    startles: [[GV.g0 + 0.05, 1.2], [GV.tread.sit, 0.35], [GV.bench.drop, 0.7], [GV.hang.drop + 0.16, 1.0], [25.92, 0.6], [GV.ladder.splash, 0.3], [GV_FALL.hit, 0.6], [GV.out.give + 0.3, 0.8]],
    shakes: [[GV.g0 + 0.05, 0.35, 0.45], [GV.bench.drop, 0.25, 0.25], [GV.hang.pull + 0.2, 0.9, 0.12], [GV.hang.drop + 0.16, 0.3, 0.35], [GV.out.top - 0.7, 1.1, 0.14]],
  },

  // your hands (camera-space poses in film.js; aimed ones are re-aimed at world points every frame; 'name!' = snap)
  hands: {
    right: [[0, 'gripR'], [GV.offScale - 0.15, 'hidden'], [GV.hang.at - 0.25, 'barR'], [GV.hang.drop + 0.02, 'hidden!'], [GV.stair[0] - 0.3, 'railR'], [GV.stair[1] - 0.2, 'hidden'],
      [GV.float - 0.2, 'scullR'], [GV.under - 0.25, 'hidden'], [GV.surface - 0.2, 'scullR'], [GV.out.wall - 0.3, 'pushR'], [GV.out.give + 0.04, 'hidden'], [GV.out.give + 0.8, 'scullR']],
    left: [[0, 'gripL'], [GV.offScale - 0.15, 'hidden'], [GV.hang.at - 0.2, 'barL'], [GV.hang.peel, 'barSlipL'], [GV.hang.drop - 0.04, 'hidden!'],
      [GV.float - 0.2, 'scullL'], [GV.under - 0.25, 'hidden'], [GV.surface - 0.2, 'scullL'], [GV.out.wall - 0.25, 'pushL'], [GV.out.give - 0.08, 'hidden'], [GV.out.give + 0.8, 'scullL']],
  },

  tracks: {
    pov: [[0, 1], [70, 1]],
    // breathing: hard under the weight; calm once you float; held under water
    breathRate: [[0, 14], [GV.g0, 14], [GV.g0 + 1.5, 24], [GV.stair[1], 28], [GV.slide, 30], [GV.float + 1.0, 16], [GV.under - 0.2, 12], [GV.out.wall, 16], [GV.out.give + 1.0, 26], [70, 18]],
    breathHold: [[0, 0], [GV.hang.lift, 0], [GV.hang.lift + 0.2, 1], [GV.hang.drop + 0.2, 1], [GV.hang.drop + 0.5, 0], [GV.under - 0.3, 0], [GV.under, 1], [GV.surface, 1], [GV.surface + 0.4, 0],
      [GV.out.push, 0], [GV.out.push + 0.2, 1], [GV.out.give + 0.9, 1], [GV.out.give + 1.2, 0], [70, 0]],
  },

  hud: {
    title: { in: GV.title[0], out: GV.title[1], fi: 0.2, fo: 0.45, cls: 'big center', html: '<span class="kick">WHAT IF GRAVITY</span><span class="hero">BECAME TWICE</span><span class="kick">AS STRONG?</span>' },
    captions: [
      { t: 3.6, until: 6.2, text: 'You didn’t gain a gram.' },
      { t: 6.9, until: 9.4, text: 'Every stride lifts twice the weight.' },
      { t: 10.9, until: 13.6, text: 'Every weight in the gym just doubled.' },
      { t: 15.9, until: 17.35, text: 'The same throw falls short.' },
      { t: 19.0, until: 21.7, text: 'Just hanging on is like holding two of you.' },
      { t: 24.1, until: 27.4, text: 'Every step down lands twice as hard.' },
      { t: 28.4, until: 31.25, text: 'But in the water, you float exactly as before.' },
      { t: 37.6, until: 40.05, text: 'Until you try to get out.' },
      { t: 44.5, until: 47.5, text: 'She climbed up before the change.' },
      { t: 47.5, until: 49.5, text: 'So she jumps.' },
    ],
    readouts: [
      { from: -0.6, until: 10.0, top: 210, label: 'GRAVITY', value: (t) => `${gvFmt(gvG(t))} G`, sub: (t) => `${gvFmt(GV_G0 * gvG(t))} m/s²` },
      { from: GV.scale[0], until: GV.scale[1], top: 470, label: 'THE SCALE', value: (t) => `${gvFmt(gvScaleKg(t))} kg`, sub: 'YOUR MASS: STILL 70 kg' },
      { from: GV.tread.look + 0.7, until: 9.6, top: 470, label: 'TREADMILL · 10 km/h', value: '2× THE LOAD', sub: 'SAME SPEED · EVERY STRIDE' },
      { from: GV.bench.heave - 0.4, until: 14.0, top: 210, label: 'BARBELL · 80 kg', value: 'LIFTS LIKE 160 kg', sub: 'AT 1 G 785 N · NOW 1,570 N' },
      { from: GV.shot - 0.4, until: 17.35, top: 210, label: 'SAME FREE THROW', value: (t) => gvThrowValue(t), sub: (t) => gvThrowSub(t) },
      { from: GV.hang.lift + 0.1, until: GV.hang.drop + 0.5, top: 210, label: 'DEAD HANG · YOUR GRIP', value: 'HOLDS 140 kg', sub: 'AT 1 G: 70 kg' },
      { from: GV.stair[0] + 0.9, until: 28.2, top: 210, label: 'HIS CLIMB · ONE FLOOR', value: 'WORK OF TWO', sub: '4,400 J · AT 1 G 2,200 J' },
      { from: 28.4, until: 31.25, top: 210, label: 'FLOATING', value: 'SAME AS BEFORE', sub: 'WEIGHT ×2 · BUOYANCY ×2' },
      { from: GV.ladder.up - 0.2, until: GV.ladder.splash + 0.7, top: 210, label: 'LEAVING THE WATER', value: 'BUOYANCY GONE', sub: 'HE LIFTS HIS FULL 2× WEIGHT' },
      { from: 42.85, until: GV.diver.stand - 0.1, top: 210, label: 'YOU, FLOATING', value: 'FEELS WEIGHTLESS', sub: 'BUOYANCY = WEIGHT = 1,373 N' },
      { from: GV.diver.step - 0.05, until: GV_FALL.hit + 2.6, top: 210, label: `FALL · ${GV_FALL.h} m · GHOST: 1 G`, value: (t) => gvFallValue(t), sub: (t) => gvFallSub(t) },
      { from: GV.under + 1.6, until: GV.surface - 0.3, top: 210, label: 'HER DEPTH 3 m', value: 'WATER PRESSURE ×2', sub: 'LIKE 6 m AT 1 G' },
      { from: GV.out.push + 0.1, until: GV.out.give + 0.7, top: 210, label: 'ON YOUR ARMS', value: (t) => `${Math.round(gvOutKg(t))} kg`, sub: (t) => `AT 1 G: ${Math.round(gvOutKg(t) / 2)} kg` },
      { from: GV.lineA[0] - 0.4, until: GV.end - 0.4, top: 210, label: 'GRAVITY', value: '2.0 G', sub: 'MASS UNCHANGED' },
    ],
    notes: [{ t: GV.note[0], until: GV.note[1], text: 'FICTIONAL INSTANT GRAVITY CHANGE · MASSES UNCHANGED · AIR PRESSURE CHANGES NOT SHOWN' }],
    // the closing lines, one after the other
    stack: [{ until: GV.end - 0.6, lines: [[GV.lineA[0], 'You didn’t gain a gram.'], [GV.lineB[0], 'Everything just weighs twice as much.'], [GV.lineC[0], 'Even the water.']] }],
  },
};

// the scale: load cells measure force (calibrated for 1 G), so the reading follows gravity, with the display's lag
function gvScaleKg(t) { return 70 * (1 + MathX.smooth(t, GV.g0 + 0.08, GV.g1 + 0.45)); }
// pressing yourself out of the water: how far you're up (0 → 1), and the load on your arms. Out to the hips (about 70 % of
// you above the water), your arms carry 0.7 × 140 = 98 kg-force; at 1 G it would be 49.
function gvOutK(t) { const O = GV.out; return t < O.give ? 0.92 * Ease.outCubic(MathX.clamp((t - O.push) / (O.top - O.push), 0, 1)) + 0.03 * MathX.smooth(t, O.top, O.give) : 0; }
function gvOutKg(t) { return 98 * MathX.clamp(gvOutK(t) / 0.95, 0, 1) * (t < GV.out.give ? 1 : Math.max(0, 1 - (t - GV.out.give) / 0.25)); }
// the throw in numbers: the peak while it flies, then the comparison
function gvThrowValue(t) { return t < GV_THROW.t0 + 0.32 ? '…' : `PEAK ${gvFmt(GV_THROW.peak2, 2)} m`; }
function gvThrowSub(t) { return `RIM ${gvFmt(GV_THROW.rim, 2)} m · AT 1 G (GHOST): ${gvFmt(GV_THROW.peak1, 2)} m`; }
// the fall: the clock while she falls, then the speed
function gvFallValue(t) {
  const F = GV_FALL;
  if (t < F.hit) return `${gvFmt(MathX.clamp(t - F.t0, 0, F.T2), 2)} s`;
  return `${Math.round(F.v2 * 3.6)} km/h`;
}
function gvFallSub(t) {
  const F = GV_FALL;
  if (t < F.hit) return `AT 1 G: ${gvFmt(F.T1, 2)} s`;
  return `LIKE A ${Math.round(F.h1)} m DIVE AT 1 G · AT 1 G: ${Math.round(F.v1 * 3.6)} km/h`;
}

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
