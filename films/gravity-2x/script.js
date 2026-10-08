/* =====================================================================
   SCRIPT — "What if gravity became twice as strong?"
   ★ The one file to edit for timing: the beats, the words, the readouts, your head (camera), your hands.
   Everything is a pure function of STORY time; CONFIG.edit cuts the take into the film.
   Plan and physics: films/gravity-2x/PLAN.md

   The rule: at GV.g0 surface gravity goes from 9.81 to 19.62 m/s² (over 0.25 s) and stays there.
   Mass and inertia do NOT change: weight (m·g) doubles, falls are faster, springs sag twice as far.
   ===================================================================== */

CONFIG.duration = 73.2;
CONFIG.seed = 20261107;
Object.assign(CONFIG.camera, {
  cameraHeight: 1.7, walkSpeed: 1.25, bobStrength: 0.016, bobFrequency: 1.72, runStrideGain: 0.3,
  breathingStrength: 0.005, breathRate: 15, fov: 66, shakeStrength: 1.0,
});
CONFIG.render.shadowMapSize = 2048;

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (story seconds). Every other file keys off these.
// ---------------------------------------------------------------------------------------------------------------------
const GV = {
  title: [-0.6, 3.7],
  g0: 1.6, g1: 1.85,            // gravity 1 G → 2 G
  bagDown: [4.3, 5.4],          // you put the bag down
  kidJump: 7.1,                 // the kid tries again (he hopped twice before the change)
  oldMan: [10.0, 13.6],         // the man on the bench tries to stand
  bay: { creak: 14.2, crack: 15.15, drop: 15.55 },   // the loading bay gives; the pallet falls 10.2 m
  coupe: 23.2,                  // the low coupe passes you; scrapes on the raised crossing
  truck: 26.2,                  // the loaded box truck; its rear spring snaps on the crossing
  outrigger: 30.0,              // the crane's outrigger pad punches into the road
  scaffold: { bow: 33.6, fold: 35.4 },
  awning: 38.2,
  tank: 40.6,
  plane: [43.0, 52.4],
  limit: 52.6,                  // exhausted people, paramedics
  trip: 55.0,                   // your knee gives; down on your hands
  up: [56.4, 59.4],             // getting back up
  slips: [60.1, 60.95, 61.55],  // the crane's hoist brake slips
  drop: 62.6,                   // the brake gives
  hudBack: 66.6,
  lineA: [67.0, 68.8], lineB: [68.8, 72.0], note: [70.8, 72.6],
  end: 73.2,
};

// the cut (story intervals kept): four invisible trims where the picture barely moves or the head whips round
// (the wreck hold, the swing up to the roar, the airliner far down the avenue, your hands on the pavement). 73.2 s → 69.7 s.
CONFIG.edit = [[0, 20.5], [21.7, 43.3], [43.8, 50.6], [51.8, 56.7], [57.3, GV.end]];

const GV_G0 = 9.81;
// gravity in g (1 → 2)
function gvG(t) { return 1 + MathX.smooth(t, GV.g0, GV.g1); }
// the extra sag of anything sitting on springs: a damped step when gravity doubles (0 → 1 with an overshoot)
function gvSpring(t, f = 1.3, z = 0.28, t0 = GV.g0 + 0.05) {
  if (t < t0) return 0;
  const a = t - t0, w = 2 * Math.PI * f;
  return 1 - Math.exp(-z * w * a) * (Math.cos(w * a * Math.sqrt(1 - z * z)) + z / Math.sqrt(1 - z * z) * Math.sin(w * a * Math.sqrt(1 - z * z)));
}

// the falling pallet (from the loading bay) and the crane load: a free fall at 2 G
const GV_FALL = {
  pallet: { t0: GV.bay.drop, h: 9.0 },         // off the tipped bay (≈ 10.9 m) onto the pickup's cab roof (1.9 m)
  load: { t0: GV.drop, h: 23.2 },               // the load's underside 23.2 m above the road
};
for (const k in GV_FALL) { const F = GV_FALL[k]; F.T2 = Math.sqrt(2 * F.h / (2 * GV_G0)); F.T1 = Math.sqrt(2 * F.h / GV_G0); F.v2 = 2 * GV_G0 * F.T2; F.v1 = GV_G0 * F.T1; F.hit = F.t0 + F.T2; }

// where you stand (story): walking in, stopping when the weight hits, the trip at the end
const GV_ME = { x: 9.35, z0: 3.6, z1: 1.3, zTrip: -0.4 };

const gvFmt = (n, d = 1) => n.toFixed(d);

const SCRIPT = {
  meta: { title: 'What if gravity became twice as strong?', wav: 'gravity-2x-soundtrack.wav' },

  events: [
    { id: 'start', time: 0.0, label: 'A sunny street; the title' },
    { id: 'g', time: GV.g0, label: 'Gravity 1 G → 2 G' },
    { id: 'bag', time: GV.bagDown[0], label: 'Your bag pulls your hand down' },
    { id: 'kid', time: GV.kidJump - 1.0, label: 'The kid can barely jump' },
    { id: 'bench', time: GV.oldMan[0], label: 'Standing up from the bench' },
    { id: 'bay', time: GV.bay.creak, label: 'The loading bay gives; the pallet falls' },
    { id: 'coupe', time: GV.coupe, label: 'The low coupe scrapes' },
    { id: 'truck', time: GV.truck, label: 'The truck’s spring snaps' },
    { id: 'crane', time: GV.outrigger - 1.0, label: 'The crane’s outrigger sinks' },
    { id: 'scaffold', time: GV.scaffold.bow - 0.4, label: 'The scaffold buckles' },
    { id: 'awning', time: GV.awning - 0.6, label: 'The old awning' },
    { id: 'tank', time: GV.tank - 0.8, label: 'The water tank' },
    { id: 'plane', time: GV.plane[0], label: 'The airliner can’t hold height' },
    { id: 'limit', time: GV.limit, label: 'People exhausted; paramedics' },
    { id: 'trip', time: GV.trip - 0.6, label: 'You go down' },
    { id: 'slips', time: GV.slips[0] - 0.5, label: 'The hoist brake slips' },
    { id: 'drop', time: GV.drop, label: 'The load falls' },
    { id: 'line', time: GV.lineA[0], label: 'The closing lines' },
  ],

  // your head (the look direction is aimed at world points in film.js, GV_LOOK; yaw/pitch here are the fallback)
  camera: {
    baseY: 0.15,
    x: [[0, GV_ME.x], [75, GV_ME.x]],
    z: [[0, GV_ME.z0], [GV.g0 + 0.1, GV_ME.z1, 'linear'], [GV.trip - 1.4, GV_ME.z1], [GV.trip - 0.1, GV_ME.zTrip, 'inOutSine'], [75, GV_ME.zTrip]],
    // knees buckle at the change; you stay lower (bent knees) under twice the weight; the fall and the slow climb back up
    height: [[0, 1.7], [GV.g0, 1.7], [GV.g0 + 0.22, 1.42, 'outCubic'], [GV.g0 + 0.9, 1.56, 'inOutSine'], [GV.g0 + 2.2, 1.6], [GV.bagDown[0], 1.6], [GV.bagDown[0] + 0.65, 1.16, 'inOutSine'], [GV.bagDown[1] + 0.1, 1.18], [GV.bagDown[1] + 1.2, 1.57, 'inOutSine'],
      [GV.trip, 1.58], [GV.trip + 0.32, 0.62, 'inCubic'], [GV.trip + 0.5, 0.56, 'outCubic'],
      [GV.up[0], 0.56], [GV.up[0] + 1.0, 0.86, 'inOutSine'], [GV.up[0] + 1.6, 0.8], [GV.up[0] + 2.3, 1.22, 'inOutSine'], [GV.up[1], 1.55, 'inOutSine'],
      [75, 1.58]],
    yaw: [[0, 0], [75, 0]],
    pitch: [[0, 0], [75, 0]],
    tilt: [[0, 0], [GV.g0 + 0.1, 0], [GV.g0 + 0.35, -2.2], [GV.g0 + 1.4, 0], [GV.trip, 0], [GV.trip + 0.35, 6], [GV.up[0], 4], [GV.up[1], 0], [75, 0]],
    fov: [[0, 66], [75, 66]],
    startles: [[GV.g0 + 0.05, 1.2], [GV.bay.crack, 0.5], [GV_FALL.pallet.hit, 1.3], [GV.truck + 1.2, 0.7], [GV.outrigger, 0.8], [GV.scaffold.fold + 0.4, 1.0], [GV.awning, 0.9], [GV.tank + 0.4, 0.6], [GV.trip + 0.33, 1.4], [GV.drop + 0.05, 0.6], [GV_FALL.load.hit, 1.6]],
    shakes: [[GV_FALL.pallet.hit, 0.7, 0.35], [GV.outrigger, 0.35, 0.4], [GV.scaffold.fold + 0.5, 0.6, 0.45], [GV.trip + 0.33, 0.8, 0.25], [GV_FALL.load.hit, 1.6, 0.7], [GV_FALL.load.hit + 2.1, 0.6, 0.6]],
  },

  // your hands (camera-space poses in film.js; 'name!' = snap)
  hands: {
    right: [[0, 'bagR'], [GV.g0, 'bagR'], [GV.g0 + 0.18, 'bagDropR'], [GV.bagDown[0], 'bagLowR'], [GV.bagDown[1], 'hidden'],
      [GV.trip + 0.12, 'catchR'], [GV.trip + 0.42, 'plantR'], [GV.up[0] + 0.3, 'pushR'], [GV.up[0] + 1.9, 'kneeR'], [GV.up[1] - 0.6, 'hidden']],
    left: [[0, 'hidden'], [GV.trip + 0.1, 'catchL'], [GV.trip + 0.42, 'plantL'], [GV.up[0] + 0.3, 'pushL'], [GV.up[0] + 1.6, 'hidden']],
  },

  tracks: {
    pov: [[0, 1], [75, 1]],
    // breathing gets harder under the weight; heavy after the fall
    breathRate: [[0, 15], [GV.g0, 15], [GV.g0 + 1.5, 24], [12, 22], [GV.trip, 24], [GV.trip + 1, 34], [GV.up[1] + 1, 28], [75, 24]],
  },

  hud: {
    title: { in: GV.title[0], out: GV.title[1], fi: 0.2, fo: 0.45, cls: 'big center', html: '<span class="kick">WHAT IF GRAVITY</span><span class="hero">BECAME TWICE</span><span class="kick">AS STRONG?</span>' },
    captions: [
      { t: 4.2, until: 7.0, text: 'Everything you lift feels twice as heavy.' },
      { t: 10.6, until: 13.3, text: 'Standing up becomes hard work.' },
      { t: 17.4, until: 20.1, text: 'And falling things hit twice as hard.' },
      { t: 24.6, until: 27.0, text: 'Cars still drive. Their springs give up.' },
      { t: 30.8, until: 33.4, text: 'Every machine was rated for 1 G.' },
      { t: 36.4, until: 39.2, text: 'Most buildings hold. The weak spots don’t.' },
      { t: 46.0, until: 49.0, text: 'Its wings now carry twice the weight.' },
      { t: 57.3, until: 59.6, text: 'Getting up is like lifting a second you.' },
    ],
    readouts: [
      { from: -0.6, until: 9.8, top: 210, label: 'GRAVITY', value: (t) => `${gvFmt(gvG(t))} G`, sub: (t) => (t >= GV.g1 ? '19.6 m/s²' : '9.8 m/s²') },
      { from: 4.6, until: 9.8, top: 470, label: '70 KG PERSON · WEIGHT', value: (t) => (t < 5.2 ? '687 N' : '1,373 N'), sub: 'MASS STILL 70 KG' },
      { from: GV.bay.drop - 0.1, until: 20.1, top: 210, label: (''), value: (t) => gvFallValue(t), sub: (t) => gvFallSub(t) },
      { from: GV.outrigger + 0.5, until: 33.4, top: 210, label: 'CRANE LOAD · MASS 12 t', value: 'PULLS LIKE 24 t', sub: 'OUTRIGGER PAD: 2× PRESSURE' },
      { from: 44.6, until: 51.8, top: 210, label: 'AIRLINER ON APPROACH', value: 'LIFT ×2', sub: 'SAME WINGS · NEEDS 41% MORE SPEED' },
      { from: GV.slips[0] - 0.3, until: GV.drop + 0.2, top: 210, label: 'HOIST BRAKE', value: (t) => `${gvFmt(gvG(t) * 100 / 1.25, 0)} %`, sub: 'OF RATED HOLDING LOAD' },
      { from: GV.drop + 0.05, until: GV_FALL.load.hit + 2.6, top: 210, label: 'FREE FALL · 23 m', value: (t) => gvLoadValue(t), sub: (t) => gvLoadSub(t) },
      { from: GV.hudBack, until: GV.end - 0.4, top: 210, label: 'GRAVITY', value: '2.0 G', sub: 'MASS UNCHANGED' },
    ],
    notes: [{ t: GV.note[0], until: GV.note[1], text: 'FICTIONAL INSTANT GRAVITY CHANGE · MASSES UNCHANGED' }],
    // the closing lines, one after the other
    stack: [{ until: GV.end - 0.6, lines: [[GV.lineA[0], 'Nothing became more massive.'], [GV.lineB[0], 'Everything just became twice as heavy.']] }],
  },

  // the airliner on approach (AircraftSystem spline: [t, x, y, z]): it comes over you from behind at full power, nose high,
  // and keeps sinking down the line of the avenue (≈ 78 m/s, descending ≈ 7 m/s: twice a normal approach's sink rate)
  aircraft: {
    path: [[GV.plane[0] - 0.4, 12, 150, 180], [44.6, 8, 130, 25], [47.4, -2, 112, -195], [50.0, -10, 94, -400], [52.6, -17, 74, -605], [56.0, -26, 46, -870]],
    bank: [[GV.plane[0], 0], [56, 0]],
  },
};

// the pallet's fall in numbers: while falling, the clock; at the hit, the speed
function gvFallValue(t) {
  const F = GV_FALL.pallet;
  if (t < F.hit) return `${gvFmt(MathX.clamp(t - F.t0, 0, F.T2), 2)} s`;
  return `${Math.round(F.v2 * 3.6)} km/h`;
}
function gvFallSub(t) {
  const F = GV_FALL.pallet;
  if (t < F.hit) return `FALL 9 m · AT 1 G: ${gvFmt(F.T1, 2)} s`;
  return `IMPACT · AT 1 G: ${Math.round(F.v1 * 3.6)} km/h · ENERGY ×2`;
}
function gvLoadValue(t) {
  const F = GV_FALL.load;
  if (t < F.hit) return `${gvFmt(MathX.clamp(t - F.t0, 0, F.T2), 2)} s`;
  return `${Math.round(F.v2 * 3.6)} km/h`;
}
function gvLoadSub(t) {
  const F = GV_FALL.load;
  if (t < F.hit) return `AT 1 G: ${gvFmt(F.T1, 2)} s`;
  return `AT 1 G: ${Math.round(F.v1 * 3.6)} km/h · 12 t`;
}
SCRIPT.hud.readouts[2].label = 'FALLING PALLET';

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
