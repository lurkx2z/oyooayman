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
  loss: 2.0,                                   // the air stops pushing on solids
  drop: { up: 5.2, rel: 7.6 },                 // your hands come up; paper and ball released together
  sky: [12.4, 20.4], deploy: 16.6,             // the skydiver cut-away; he pulls
  car: { coast: 12.4, toss: 21.95, pass: 22.4 },   // throttle off (off screen); leaflets out of the window; it passes you
  birds: 28.6, startle: 29.5, ledge: 31.2,     // pigeons on the pavement; one steps off a ledge
  roar: 33.4, plane: 34.6,                     // the plane: heard, then seen
  storm: [40.6, 42.2], balloon: 44.6,          // the wind rises to 100 km/h; the balloon slips
  plunge: 48.2, slow: [48.35, 49.35],          // the plunge (slow motion); it drops behind the skyline; impact at NR.impact
  planeImp: [-40, -2100],                      // where it comes down: 2.1 km away, in the river beyond the end of the avenue
  run: 56.9, land: [59.4, 61.6], board: 59.95, // you run; the debris lands; the sign board is knocked off above where you stood
  look: 62.4, line: [63.2, 67.7], black: 67.8,
};
NR.impact = 2.0 + Math.sqrt(2 * 11400 / 9.81);                  // = NR_PLANE.tImpact() (50.21)
NR.impactDist = Math.hypot(NR.planeImp[0] - 9.4, NR.planeImp[1] - 1.6);
NR.boom = NR.impact + NR.impactDist / 343;                        // sound from the impact reaches you (≈ 6.1 s)

// the cut: one continuous take, less the pause after the drop (straight to the sky); the plunge plays at a quarter speed
CONFIG.edit = [[-0.0, 10.9], [NR.sky[0], NR.slow[0]], [NR.slow[0], NR.slow[1], 0.25], [NR.slow[1], CONFIG.duration]];

// where you stand
const NR_CAM = { x: 9.4, z0: 4.2, z: 1.6, zRun: 9.6 };

// your head following the falling airliner: [yaw, pitch] towards it (same arc as NR_PLANE in physics.js: up the avenue, towards you)
function nrPlaneLook(S) {
  const T = Math.sqrt(2 * 11400 / 9.81), t = Math.max(0, S - NR.loss), z = NR.planeImp[1] - 240 * (T - Math.min(t, T)), y = Math.max(0, 11400 - 4.905 * t * t);
  const dx = NR.planeImp[0] - NR_CAM.x, dz = z - NR_CAM.z;
  return [Math.atan2(-dx, -dz) * 180 / Math.PI, Math.atan2(y - 1.7, Math.hypot(dx, dz)) * 180 / Math.PI];
}
const nrFollow = (s0, s1, k, dy = 0, dp = 0) => { const Y = [], P = []; for (let s = s0; s <= s1 + 1e-6; s += 0.2) { const [y, p] = nrPlaneLook(s); Y.push([+s.toFixed(2), y + dy, k]); P.push([+s.toFixed(2), p + dp, k]); } return [Y, P]; };
const NR_TRACK = nrFollow(35.4, 40.0, 'linear', 0, -0.25), NR_PLUNGE = nrFollow(48.2, 49.2, 'linear', 1.2, -0.8);

const SCRIPT = {
  meta: { title: 'WHAT IF AIR RESISTANCE SUDDENLY DISAPPEARED?', wav: 'no-air-resistance-soundtrack.wav' },

  events: [
    { id: 'start', time: 0.0, label: 'A windy afternoon; the title' },
    { id: 'loss', time: NR.loss, label: 'Aerodynamic force 100 % → 0 %: the flags drop' },
    { id: 'drop', time: NR.drop.up, label: 'Paper and ball land together' },
    { id: 'sky', time: NR.sky[0], label: 'The skydiver: the canopy changes nothing' },
    { id: 'car', time: 20.4, label: 'The coasting car; the leaflets keep up' },
    { id: 'birds', time: 28.4, label: 'Pigeons can’t take off' },
    { id: 'plane', time: NR.roar, label: 'The airliner has been falling since 2 s' },
    { id: 'storm', time: NR.storm[0], label: 'A 100 km/h wind moves nothing' },
    { id: 'balloon', time: 44.2, label: 'The balloon: buoyancy, no drag' },
    { id: 'plunge', time: 47.6, label: 'The plunge (slow motion)' },
    { id: 'impact', time: 50.3, label: 'Impact; the boom arrives 6 s later' },
    { id: 'debris', time: NR.run, label: 'Debris thrown 2 km; you run' },
    { id: 'line', time: NR.look, label: 'The air would still be there' },
  ],

  // your head (story time). yaw: + turns left, 0 = down the avenue (−Z). pitch: + up.
  camera: {
    baseY: 0.15,
    x: [[0, NR_CAM.x], [56.9, NR_CAM.x], [57.6, NR_CAM.x + 0.3], [59.2, NR_CAM.x + 0.6], [68.0, NR_CAM.x + 0.6]],
    z: [[0, NR_CAM.z0], [5.0, NR_CAM.z, 'linear'], [56.9, NR_CAM.z], [57.6, NR_CAM.z + 1.6, 'inQuad'], [59.2, NR_CAM.zRun, 'linear'], [59.8, NR_CAM.zRun + 0.5, 'outQuad'], [68.0, NR_CAM.zRun + 0.5]],
    height: [[0, 1.68], [59.6, 1.68], [60.0, 1.3, 'inQuad'], [62.0, 1.3], [62.8, 1.68, 'inOutSine'], [68.0, 1.68]],
    yaw: [[0, 5], [2.3, 4], [3.0, 0, 'inOutCubic'], [4.2, 4], [5.0, 3], [6.0, 2], [10.9, 2],
      // (12.4–20.4: the sky cut-away has its own camera)
      [20.4, 160, 'step'], [21.5, 152], [21.95, 146, 'inOutSine'], [22.4, 96, 'inOutSine'], [22.8, 42, 'inOutSine'], [23.6, 16], [24.6, 8.5], [27.8, 5.5],
      [28.4, -4, 'inOutCubic'], [30.6, -8], [31.0, -33, 'inOutCubic'], [31.3, -33], [32.1, -30, 'inOutSine'], [33.4, -8],
      [34.6, nrPlaneLook(34.6)[0], 'inOutCubic'], ...NR_TRACK[0], [40.8, 3, 'inOutCubic'], [43.6, 0],
      [44.2, -22, 'inOutCubic'], [46.6, -22], [47.9, NR_PLUNGE[0][0][1], 'inOutCubic'], ...NR_PLUNGE[0], [49.85, 2.2, 'inOutSine'],
      [53.0, 2.4], [56.3, 2.6], [57.0, 178, 'inOutCubic'], [58.6, 176], [59.0, 16, 'inOutCubic'], [59.5, 4], [59.95, -14, 'inOutCubic'], [60.3, -14], [61.55, -3, 'inOutSine'], [62.0, 2], [62.6, 8], [68.0, 10]],
    pitch: [[0, 4], [2.3, 4], [3.0, 7, 'inOutCubic'], [4.2, 5], [5.0, -10], [6.0, -48, 'inOutSine'], [10.9, -46],
      [20.4, 2, 'step'], [21.5, 1], [22.4, -3], [23.6, -1.5], [24.6, -1.2], [27.8, -0.8],
      [28.4, -22, 'inOutCubic'], [30.6, -20], [31.0, 19, 'inOutCubic'], [31.3, 19], [32.1, -18, 'inQuad'], [33.4, -6],
      [34.6, nrPlaneLook(34.6)[1] - 4, 'inOutCubic'], ...NR_TRACK[1], [40.8, 7, 'inOutCubic'], [43.6, 6],
      [44.2, -4], [44.9, 2], [45.5, 58, 'inOutCubic'], [46.6, 60], [47.9, NR_PLUNGE[1][0][1], 'inOutCubic'], ...NR_PLUNGE[1], [49.85, 4.5, 'inOutSine'],
      [53.0, 7.5], [56.3, 8.5], [57.0, -4], [58.6, -2], [59.0, 6], [59.5, 14], [59.95, 46, 'inOutCubic'], [60.3, 46], [61.55, -10, 'inQuad'], [62.0, -2], [62.6, 40, 'inOutSine'], [64.6, 56], [68.0, 58]],
    fov: [[0, 66], [10.9, 66], [20.4, 66], [22.8, 64], [24.4, 32], [27.8, 27], [28.4, 64], [34.6, 58], [35.5, 3.8, 'inOutCubic'], [40.0, 3.8], [40.8, 62, 'inOutCubic'],
      [44.2, 60], [46.6, 60], [47.9, 15, 'inOutCubic'], [49.2, 15], [49.85, 30, 'inOutSine'], [53.0, 38], [56.3, 46], [57.0, 66], [68.0, 66]],
    tilt: [[0, 0], [57.0, 0], [57.6, -4], [59.2, 3], [60.0, -6], [61.0, 0], [68.0, 0]],
    startles: [[NR.loss + 0.15, 0.35], [22.35, 0.25], [29.5, 0.25], [NR.impact + 0.05, 0.3], [NR.boom, 0.8], [NR.board, 0.6], [61.1, 0.5], [NR.board + 1.56, 1.0]],
    shakes: [[NR.boom, 0.6, 0.6], [NR.board, 0.35, 0.3], [61.1, 0.4, 0.25], [NR.board + 1.56, 0.9, 0.35]],
  },

  // your hands: a sheet of paper (right) and a tennis ball (left), held out and released together; later, running
  hands: {
    right: [[0, 'hidden'], [5.3, 'holdPaperR'], [NR.drop.rel, 'openR'], [9.6, 'hidden'], [56.9, 'hidden'], [57.5, 'runR'], [59.4, 'hidden'], [61.25, 'shieldR'], [62.2, 'hidden']],
    left: [[0, 'hidden'], [5.2, 'holdBallL'], [NR.drop.rel, 'openL'], [9.5, 'hidden'], [56.9, 'hidden'], [57.45, 'runL'], [59.4, 'hidden']],
  },

  tracks: {
    pov: [[0, 1], [NR.sky[0] - 0.001, 1], [NR.sky[0], 0, 'step'], [NR.sky[1] - 0.001, 0], [NR.sky[1], 1, 'step'], [35.0, 1], [35.5, 0.3], [40.0, 0.3], [40.6, 1], [68.0, 1]],
  },

  hud: {
    title: { in: -0.5, out: NR.title[1], fi: 0.2, fo: 0.45, cls: 'big center', html: '<span class="kick">WHAT IF AIR RESISTANCE</span><span class="hero">SUDDENLY DISAPPEARED?</span>' },
    captions: [
      { t: 3.75, until: 5.6, text: 'The wind didn’t stop.' },
      { t: 8.3, until: 10.8, text: 'Nothing would be slowed by the air.' },
      { t: 14.6, until: 16.4, text: 'His speed just keeps climbing.' },
      { t: 17.1, until: 18.6, text: 'The parachute opens…' },
      { t: 18.7, until: 20.3, text: '…and changes nothing.' },
      { t: 22.3, until: 24.4, text: 'Anything thrown keeps up with it.' },
      { t: 24.6, until: 27.8, text: 'And a car would coast much further.' },
      { t: 30.0, until: 32.6, text: 'Birds couldn’t get off the ground.' },
      { t: 35.6, until: 37.6, text: 'Its wings stopped lifting it…' },
      { t: 37.7, until: 40.1, text: '…when the air let go.' },
      { t: 42.3, until: 44.1, text: 'The air still moves.' },
      { t: 44.2, until: 46.6, text: 'It just can’t push anything.' },
      { t: 57.2, until: 59.4, text: 'Nothing slows it down.' },
    ],
    stack: [{ t: NR.line[0], until: NR.line[1], lines: [[NR.line[0], 'The air would still be there.'], [65.2, 'It just couldn’t catch you.']] }],
    readouts: [],
    notes: [{ t: 65.6, until: NR.line[1], text: 'Fictional physics · sound and breathing kept for this simulation' }],
  },
};

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
