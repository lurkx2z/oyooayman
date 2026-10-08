/* =====================================================================
   SCRIPT — "WHAT IF AIR RESISTANCE SUDDENLY DISAPPEARED?"
   ★ The one file to edit for timing: the beats, the words, the readouts, your head (camera), your hands.
   Everything is a pure function of STORY time; CONFIG.edit plays the plane's plunge in slow motion.
   The physics (drag, lift, the plane's arc) lives in physics.js. Plan: films/no-air-resistance/PLAN.md
   ===================================================================== */

CONFIG.duration = 68.0;
CONFIG.seed = 20261019;
Object.assign(CONFIG.camera, {
  cameraHeight: 1.68, walkSpeed: 1.2, bobStrength: 0.013, bobFrequency: 1.72, runStrideGain: 0.55,
  breathingStrength: 0.005, breathRate: 15, fov: 66, shakeStrength: 1.0,
});
CONFIG.render.shadowMapSize = 4096;

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (story seconds). Every other file keys off these.
// ---------------------------------------------------------------------------------------------------------------------
const NR = {
  title: [-0.5, 3.4],
  loss: 2.0,                                   // the air stops pushing on solids: the flag drops, the pigeons in the air fall
  drop: { up: 5.5, rel: 6.9 },                 // your hands come up; paper and ball released together (the fall plays at 0.4×)
  cut0: 9.3,                                   // the opening take ends here (straight to the sky)
  sky: [12.4, 20.4], deploy: 16.6,             // the skydiver cut-away; he pulls
  car: { coast: 12.4, toss: 21.95, pass: 22.4, cut: [25.4, 28.2] },   // throttle off (off screen); leaflets out of the window; it passes you
  birds: 28.6, startle: 29.5, ledge: 31.2,     // pigeons on the pavement; one steps off a ledge
  point: 32.45, plane: 33.6,                   // a man turns and points up ("Look!"); you find the plane (it makes no sound)
  storm: [40.6, 42.2], stormCut: [42.6, 43.8], balloon: 44.6,   // the wind rises to 100 km/h; the balloon slips
  plunge: 47.9, slow: [48.6, 49.0],            // the plunge (a quarter speed in the middle); it drops behind the skyline; impact at NR.impact
  planeImp: [-40, -2100],                      // where it comes down: 2.1 km away, in the river beyond the end of the avenue
  run: 56.9, land: [59.4, 61.6], board: 59.95, // you run; the debris lands; the sign board is knocked off above where you stood
  look: 62.2, line: [63.0, 67.7], black: 67.8,
};
NR.impact = 2.0 + Math.sqrt(2 * 11400 / 9.81);                  // = NR_PLANE.tImpact() (50.21)
NR.impactDist = Math.hypot(NR.planeImp[0] - 9.4, NR.planeImp[1] - 1.6);
NR.boom = NR.impact + NR.impactDist / 343;                        // sound from the impact reaches you (≈ 6.1 s)

// the cuts: the opening take (its paper drop at 0.4×), the sky, the street (less 2 s of the car rolling away and 1.2 s
// of the storm), the plunge at a quarter speed in its middle
CONFIG.edit = [[0, NR.drop.rel - 0.05], [NR.drop.rel - 0.05, NR.drop.rel + 0.55, 0.4], [NR.drop.rel + 0.55, NR.cut0],
  [NR.sky[0], NR.car.cut[0]], [NR.car.cut[1], NR.stormCut[0]], [NR.stormCut[1], NR.slow[0]], [NR.slow[0], NR.slow[1], 0.25], [NR.slow[1], CONFIG.duration]];

// where you stand
const NR_CAM = { x: 9.4, z0: 4.2, z: 1.6, zRun: 9.6 };

// your head on the falling airliner: [yaw, pitch] towards it (same arc as NR_PLANE in physics.js: up the avenue, towards you)
function nrPlaneLook(S) {
  const T = Math.sqrt(2 * 11400 / 9.81), t = Math.max(0, S - NR.loss), z = NR.planeImp[1] - 240 * (T - Math.min(t, T)), y = Math.max(0, 11400 - 4.905 * t * t);
  const dx = NR.planeImp[0] - NR_CAM.x, dz = z - NR_CAM.z;
  return [Math.atan2(-dx, -dz) * 180 / Math.PI, Math.atan2(y - 1.7, Math.hypot(dx, dz)) * 180 / Math.PI];
}
// the plunge: your head follows it, a little late, so it sinks through the frame (from 0.9° above the centre to 0.7° below)
const NR_PLUNGE = (() => { const Y = [], P = []; for (let s = 47.9; s <= 49.7 + 1e-6; s += 0.1) { const [y, p] = nrPlaneLook(s), k = (s - 47.9) / 1.8; Y.push([+s.toFixed(2), y, 'linear']); P.push([+s.toFixed(2), p - 0.9 + 1.6 * k, 'linear']); } return [Y, P]; })();
// the telephoto hold on the plane (story 34.0–38.2): the head stays still and it sinks from the top of the frame
const NR_HOLD = { yaw: 0.86, pitch: 45.4 };   // (the plane a little right of centre, clear of the side view on the left)

const SCRIPT = {
  meta: { title: 'WHAT IF AIR RESISTANCE SUDDENLY DISAPPEARED?', wav: 'no-air-resistance-soundtrack.wav' },

  events: [
    { id: 'start', time: 0.0, label: 'A windy afternoon; the title' },
    { id: 'loss', time: NR.loss, label: 'Aerodynamic force 100 % → 0 %: the flag drops, the pigeons fall' },
    { id: 'drop', time: NR.drop.up, label: 'Paper and ball land together' },
    { id: 'sky', time: NR.sky[0], label: 'The skydiver: the parachute can’t open' },
    { id: 'car', time: 20.4, label: 'The coasting car; the leaflets keep up' },
    { id: 'birds', time: 28.4, label: 'Pigeons can’t take off' },
    { id: 'plane', time: NR.point, label: '“Look!” The airliner has been falling since 2 s, in silence' },
    { id: 'storm', time: 39.0, label: 'A 100 km/h wind moves nothing' },
    { id: 'balloon', time: NR.stormCut[1], label: 'The balloon: buoyancy, no drag' },
    { id: 'plunge', time: NR.plunge - 0.4, label: 'The plunge' },
    { id: 'impact', time: NR.impact, label: 'Impact; the sound arrives 6 s later' },
    { id: 'debris', time: NR.run, label: 'Debris thrown 2 km; you run' },
    { id: 'line', time: NR.look, label: 'The air would still be there' },
  ],

  // your head (story time). yaw: + turns left, 0 = down the avenue (−Z). pitch: + up.
  camera: {
    baseY: 0.15,
    x: [[0, NR_CAM.x], [56.9, NR_CAM.x], [57.6, NR_CAM.x + 0.3], [59.2, NR_CAM.x + 0.6], [68.0, NR_CAM.x + 0.6]],
    z: [[0, NR_CAM.z0], [5.0, NR_CAM.z, 'linear'], [56.9, NR_CAM.z], [57.6, NR_CAM.z + 1.6, 'inQuad'], [59.2, NR_CAM.zRun, 'linear'], [59.8, NR_CAM.zRun + 0.5, 'outQuad'], [68.0, NR_CAM.zRun + 0.5]],
    height: [[0, 1.68], [59.6, 1.68], [60.0, 1.3, 'inQuad'], [62.0, 1.3], [62.8, 1.68, 'inOutSine'], [68.0, 1.68]],
    yaw: [[0, 11.5], [5.0, 11], [5.9, 3, 'inOutSine'], [NR.cut0, 2.5],
      // (12.4–20.4: the sky cut-away has its own camera)
      [20.4, 160, 'step'], [21.5, 152], [21.95, 146, 'inOutSine'], [22.4, 96, 'inOutSine'], [22.8, 42, 'inOutSine'], [23.6, 16], [24.6, 8.5], [NR.car.cut[0], 8],
      [NR.car.cut[1], -10, 'step'], [30.6, -12], [31.0, -33, 'inOutCubic'], [31.3, -33], [32.05, -31, 'inQuad'], [32.3, -31], [32.75, -6, 'inOutCubic'], [33.0, -5],
      [33.6, NR_HOLD.yaw, 'inOutCubic'], [34.0, NR_HOLD.yaw], [38.2, NR_HOLD.yaw], [39.0, 9, 'inOutCubic'], [42.6, 10],
      [NR.stormCut[1], -22, 'step'], [46.6, -22], [47.6, NR_PLUNGE[0][0][1], 'inOutCubic'], [47.9, NR_PLUNGE[0][0][1]], ...NR_PLUNGE[0], [50.5, 1.3], [51.6, 1.9, 'inOutCubic'],
      [53.0, 2.4], [56.3, 2.6], [57.0, 178, 'inOutCubic'], [58.6, 176], [59.0, 16, 'inOutCubic'], [59.5, 4], [59.95, -14, 'inOutCubic'], [60.3, -14], [61.55, -3, 'inOutSine'], [62.0, 1], [62.8, 6.2, 'inOutSine'], [68.0, 6.8]],
    pitch: [[0, 2], [4.8, 2], [5.9, -44, 'inOutSine'], [NR.drop.rel, -44], [NR.drop.rel + 0.6, -55, 'inOutSine'], [NR.cut0, -54],
      [20.4, 2, 'step'], [21.5, 1], [22.4, -3], [23.6, -1.5], [24.6, -1.2], [NR.car.cut[0], -1.1],
      [NR.car.cut[1], -22, 'step'], [30.6, -20], [31.0, 19, 'inOutCubic'], [31.3, 19], [32.05, -12, 'inQuad'], [32.3, -11], [32.75, 9, 'inOutCubic'], [33.0, 10],
      [33.6, 46.6, 'inOutCubic'], [34.0, NR_HOLD.pitch, 'inOutSine'], [38.2, NR_HOLD.pitch], [39.0, 7, 'inOutCubic'], [41.2, 8], [42.6, 11, 'inOutSine'],
      [NR.stormCut[1], -4, 'step'], [44.4, -4], [44.9, 2], [45.5, 58, 'inOutCubic'], [46.6, 60], [47.6, NR_PLUNGE[1][0][1], 'inOutCubic'], [47.9, NR_PLUNGE[1][0][1]], ...NR_PLUNGE[1], [49.85, 9.0, 'inOutSine'], [50.5, 9.0],
      [51.6, 5.0, 'inOutCubic'], [56.3, 5.4], [57.0, -4], [58.6, -2], [59.0, 6], [59.5, 14], [59.95, 46, 'inOutCubic'], [60.3, 46], [61.55, -10, 'inQuad'], [62.0, -2], [62.8, 3.0, 'inOutSine'], [68.0, 3.6]],
    fov: [[0, 66], [NR.cut0, 66], [20.4, 66], [22.8, 64], [24.4, 32], [NR.car.cut[0], 30], [NR.car.cut[1], 64, 'step'], [30.6, 64], [31.0, 30, 'inOutCubic'], [32.05, 30], [32.3, 32], [32.75, 50, 'inOutCubic'],
      [33.6, 40, 'inOutSine'], [34.0, 5.0, 'inOutCubic'], [38.2, 3.7, 'linear'], [39.0, 62, 'inOutCubic'], [42.6, 60],
      [NR.stormCut[1], 60, 'step'], [46.6, 60], [47.6, 8, 'inOutCubic'], [47.9, 6], [49.85, 6], [50.5, 6], [51.6, 28, 'inOutCubic'], [56.3, 21, 'inOutSine'], [57.0, 66], [62.0, 66], [62.8, 52, 'inOutSine'], [68.0, 49]],
    tilt: [[0, 0], [57.0, 0], [57.6, -4], [59.2, 3], [60.0, -6], [61.0, 0], [68.0, 0]],
    startles: [[NR.loss + 0.15, 0.35], [22.35, 0.25], [29.5, 0.25], [NR.impact + 0.05, 0.3], [NR.boom, 0.8], [NR.board, 0.6], [61.1, 0.5], [NR.board + 1.61, 1.0]],
    shakes: [[NR.boom, 0.6, 0.6], [NR.board, 0.35, 0.3], [61.1, 0.4, 0.25], [NR.board + 1.61, 0.9, 0.35]],
  },

  // your hands: a sheet of paper (right) and a tennis ball (left), held out and released together; later, running
  hands: {
    right: [[0, 'hidden'], [NR.drop.up + 0.1, 'holdPaperR'], [NR.drop.rel, 'openR'], [NR.cut0, 'hidden'], [56.9, 'hidden'], [57.5, 'runR'], [59.4, 'hidden'], [61.25, 'shieldR'], [62.2, 'hidden']],
    left: [[0, 'hidden'], [NR.drop.up, 'holdBallL'], [NR.drop.rel, 'openL'], [NR.cut0, 'hidden'], [56.9, 'hidden'], [57.45, 'runL'], [59.4, 'hidden']],
  },

  tracks: {
    pov: [[0, 1], [NR.sky[0] - 0.001, 1], [NR.sky[0], 0, 'step'], [NR.sky[1] - 0.001, 0], [NR.sky[1], 1, 'step'], [33.5, 1], [34.0, 0.25], [38.2, 0.25], [38.9, 1],
      [47.4, 1], [47.8, 0.3], [50.5, 0.3], [51.6, 1], [68.0, 1]],
  },

  hud: {
    title: { in: -0.5, out: NR.title[1], fi: 0.2, fo: 0.45, cls: 'big center', html: '<span class="kick">WHAT IF AIR RESISTANCE</span><span class="hero">SUDDENLY DISAPPEARED?</span>' },
    captions: [
      { t: 3.7, until: 5.2, text: 'The wind still blows…' },
      { t: 5.25, until: NR.drop.rel - 0.05, text: '…it just can’t push anything.' },
      { t: NR.drop.rel + 0.35, until: NR.cut0, text: 'Nothing would be slowed by the air.' },
      { t: 14.6, until: 16.4, text: 'His speed just keeps climbing.' },
      { t: 16.8, until: 18.4, text: 'He pulls the parachute…' },
      { t: 18.5, until: 20.3, text: '…but it can’t even open.' },
      { t: 22.2, until: 23.7, text: 'Thrown things keep their speed…' },
      { t: 23.8, until: NR.car.cut[0], text: '…and cars coast much further.' },
      { t: 29.7, until: 31.15, text: 'Birds couldn’t get off the ground.' },
      { t: 34.4, until: 36.2, text: 'Its wings stopped lifting it…' },
      { t: 36.3, until: 38.2, text: '…the moment the air let go.' },
      { t: 39.6, until: 41.1, text: 'Storm-force wind…' },
      { t: 41.2, until: NR.stormCut[0], text: '…and nothing moves.' },
      { t: NR.stormCut[1] + 0.15, until: 45.4, text: 'Floating still works…' },
      { t: 45.45, until: 46.6, text: '…nothing holds it back.' },
      { t: 57.1, until: 58.9, text: 'Everything it threw is still flying…' },
      { t: 59.2, until: 60.9, text: '…and nothing slows it down.' },
    ],
    says: [{ t: NR.point + 0.1, until: 33.6, text: '“Look… up there!”' }],
    stack: [{ t: NR.line[0], until: NR.line[1], lines: [[NR.line[0], 'The air would still be there.'], [65.0, 'It just couldn’t catch you.']] }],
    readouts: [],
    notes: [{ t: 65.5, until: NR.line[1], text: 'Fictional physics: only solids lose air resistance (water droplets still ride the wind) · sound and breathing kept' }],
  },
};

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
