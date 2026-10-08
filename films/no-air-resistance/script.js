/* =====================================================================
   SCRIPT — "WHAT IF AIR RESISTANCE SUDDENLY DISAPPEARED?"
   ★ The one file to edit for timing: the beats, the words, the readouts, your head (camera), your hands.
   Everything is a pure function of STORY time; CONFIG.edit plays the paper drop in slow motion and cuts to the sky.
   A rooftop party under a storm cloud. The physics (the drop, the balloons, the cloud's ice) lives in physics.js.
   Plan: films/no-air-resistance/PLAN.md
   ===================================================================== */

CONFIG.duration = 61.4;
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
  loss: 2.0,                                   // the air stops pushing on solids: the laundry drops, the kite falls
  walk: [3.9, 6.3],                            // the cut to the front parapet; you lean over it
  drop: { up: 6.35, rel: 7.4 },                // hands out over the edge; paper and ball let go together (the fall plays at 0.6×)
  cut0: 10.4,                                  // the drop ends here (straight to the sky)
  sky: [12.4, 20.4], deploy: 16.6,             // the skydiver cut-away; he pulls
  pop: 21.15,                                  // the confetti cannon, fired straight up
  gale: [24.0, 25.4],                          // the gust front: the wind rises 50 → 110 km/h; the rain arrives with it
  balloon: 30.4,                               // the child lets go of the balloons
  cloud: 33.0,                                 // you look up into the cloud: its ice is falling
  ice0: 36.98,                                 // the first of the cloud's ice lands (NR_ICE.first: the lowest ice, 6 km up, falls for 35 s)
  run: 37.35,                                  // you back into the stair door
  inDoor: 39.9,                                // you're inside the doorway, looking out
  quiet: 53.48,                                // the last of the cloud's ice lands (NR_ICE.last); silence
  line: [54.6, 61.0], black: 61.2,
};

// the roof: a five-storey building on your side of the avenue (x 12.5–30.5, z −21.6…3.0), its deck 21.4 m up. Everything is
// laid out round the view from the stair door (looking −x, across the roof to the street): the table, the skylight, the
// washing line (across the wind), the chimney, the kite flown from the front corner
const NR_ROOF = {
  y: 21.4, x0: 12.5, x1: 30.5, z0: -21.6, z1: 3.0, par: 1.05, parT: 0.3,
  hut: { x0: 26.6, x1: 30.2, z0: -3.2, z1: 1.6, h: 2.9, door: -0.8, doorW: 1.05, doorH: 2.15 },   // the stair housing; its door faces −x
  line: [[13.8, 1.6], [18.6, -3.2]],                    // the washing line (across the wind)
  table: { x: 21.2, z: -0.2, len: 2.2, w: 0.95 },       // (its long side along x)
  chimney: { x: 16.8, z: 1.9, w: 0.9, h: 3.0 },
  skylight: { x: 23.9, z: -1.6, w: 1.5, d: 2.2, h: 0.5 },
  platform: { x: 20.55, z: 0.0, w: 4.9, d: 4.4 },        // the timber platform under the party
  flyer: [13.9, 2.3],                                    // the kite flyer, at the front corner
};

// what the ice breaks while you watch from the doorway (story s)
const NR_ROOF_HITS = { panes: [40.35, 42.9], bunting: [41.6, 48.8], lights: 44.2, line: 46.5, pot: 50.6 };

// the cuts: the opening take, the drop (at 0.6×), the sky, the roof
CONFIG.edit = [[0, NR.drop.rel - 0.05], [NR.drop.rel - 0.05, NR.drop.rel + 2.55, 0.6], [NR.drop.rel + 2.55, NR.cut0], [NR.sky[0], CONFIG.duration]];

// where you stand: the stair door (the opening), leaning over the front parapet (the drop), the confetti, the storm, the
// spot by the door where the ice finds you, inside the doorway
const NR_CAM = { x0: 26.1, z0: -0.75, xP: 12.45, zP: -2.4, xC: 25.8, zC: -6.3, xG: 25.2, zG: -2.9, xD: 25.6, zD: -1.9, xIn: 28.25, zIn: -0.8 };

const SCRIPT = {
  meta: { title: 'WHAT IF AIR RESISTANCE SUDDENLY DISAPPEARED?', wav: 'no-air-resistance-soundtrack.wav' },

  events: [
    { id: 'start', time: 0.0, label: 'A windy rooftop party; the title' },
    { id: 'loss', time: NR.loss, label: 'Aerodynamic force 100 % → 0 %: the laundry drops, the kite falls' },
    { id: 'drop', time: NR.walk[0], label: 'Paper and ball dropped off the roof land together' },
    { id: 'sky', time: NR.sky[0], label: 'The skydiver: the parachute can’t open' },
    { id: 'pop', time: 20.4, label: 'Confetti falls like gravel' },
    { id: 'gale', time: NR.gale[0], label: '110 km/h: rain flies sideways, nothing solid moves, soot pours down' },
    { id: 'balloon', time: NR.balloon - 0.3, label: 'The balloons shoot up into the cloud' },
    { id: 'cloud', time: NR.cloud, label: 'The cloud’s ice is falling' },
    { id: 'ice', time: NR.run - 0.4, label: 'The first ice lands at 1,235 km/h' },
    { id: 'roar', time: NR.inDoor, label: 'The whole cloud’s ice arrives, faster and faster' },
    { id: 'quiet', time: NR.quiet, label: 'The last ice; silence' },
    { id: 'line', time: NR.line[0], label: 'The air would still be there' },
  ],

  // your head (story time). yaw: + turns left, 0 = down the avenue (−Z), 90 = facing the street (−X). pitch: + up.
  camera: {
    baseY: NR_ROOF.y,
    x: [[0, NR_CAM.x0], [NR.walk[0] - 0.001, NR_CAM.x0 - 0.5], [NR.walk[0], NR_CAM.xP + 0.25, 'step'], [5.2, NR_CAM.xP, 'inOutSine'], [NR.cut0, NR_CAM.xP],
      [20.4, NR_CAM.xC, 'step'], [24.2, NR_CAM.xC], [26.4, NR_CAM.xG, 'inOutSine'], [32.6, NR_CAM.xG], [34.0, NR_CAM.xD, 'inOutSine'], [NR.ice0 + 0.25, NR_CAM.xD],
      [37.9, 26.3, 'inOutSine'], [38.9, NR_CAM.xIn, 'inOutSine'], [44.0, NR_CAM.xIn], [48.0, NR_CAM.xIn - 0.45, 'inOutSine'], [NR.quiet + 0.5, NR_CAM.xIn - 0.45],
      [NR.quiet + 2.2, 27.0, 'inOutSine'], [NR.quiet + 4.6, 25.9, 'inOutSine'], [61.4, 25.8]],
    z: [[0, NR_CAM.z0], [NR.walk[0] - 0.001, NR_CAM.z0], [NR.walk[0], NR_CAM.zP, 'step'], [NR.cut0, NR_CAM.zP],
      [20.4, NR_CAM.zC, 'step'], [24.2, NR_CAM.zC], [26.4, NR_CAM.zG, 'inOutSine'], [32.6, NR_CAM.zG], [34.0, NR_CAM.zD, 'inOutSine'], [NR.ice0 + 0.25, NR_CAM.zD],
      [37.9, -0.85, 'inOutSine'], [38.9, NR_CAM.zIn, 'inOutSine'], [61.4, NR_CAM.zIn]],
    height: [[0, 1.68], [NR.walk[0] - 0.001, 1.68], [NR.walk[0], 1.5, 'step'], [NR.cut0, 1.45], [20.4, 1.68, 'step'], [61.4, 1.68]],
    yaw: [[0, 88], [NR.loss, 87], [2.6, 83, 'inOutSine'], [3.3, 85], [NR.walk[0] - 0.001, 86],
      [NR.walk[0], 62, 'step'], [5.0, 64], [6.1, 90, 'inOutSine'], [NR.cut0, 90],
      // (12.4–20.4: the sky cut-away has its own camera)
      [20.4, 127, 'step'], [24.2, 126], [26.4, 110, 'inOutSine'], [28.6, 106], [29.8, 118, 'inOutSine'], [30.4, 124], [32.6, 122],
      [34.2, 92, 'inOutSine'], [NR.ice0, 90], [37.3, 86, 'inOutSine'], [37.9, 92], [38.9, 90, 'inOutSine'],
      [40.1, 90], [40.5, 85, 'inOutSine'], [41.5, 87], [41.9, 92, 'inOutSine'], [43.0, 86, 'inOutSine'], [44.0, 90], [46.3, 91], [46.7, 94, 'inOutSine'], [48.6, 92], [50.4, 94], [50.9, 99, 'inOutSine'], [52.5, 95],
      [NR.quiet + 0.5, 92], [NR.quiet + 4.6, 97, 'inOutSine'], [61.4, 98]],
    pitch: [[0, 6], [NR.loss, 6], [2.7, 3, 'inOutSine'], [NR.walk[0] - 0.001, 4],
      [NR.walk[0], -60, 'step'], [5.0, -58], [6.1, -48, 'inOutSine'], [NR.drop.rel, -50], [NR.drop.rel + 0.9, -62, 'inOutSine'], [NR.cut0, -63],
      [20.4, 10, 'step'], [21.0, 10], [21.7, 30, 'inOutSine'], [22.5, 31], [23.3, -6, 'inOutCubic'], [24.2, -4], [26.4, 2, 'inOutSine'], [30.4, 3], [30.7, 8], [32.0, 52, 'inOutCubic'], [33.0, 62], [33.5, 62],
      [34.4, 14, 'inOutSine'], [NR.ice0 - 0.1, 12], [37.25, -14, 'inOutCubic'], [37.9, -8], [38.9, 2, 'inOutSine'],
      [44.0, 3], [44.4, 8, 'inOutSine'], [45.4, 7], [46.0, 3, 'inOutSine'], [NR.quiet, 2], [NR.quiet + 4.6, -6, 'inOutSine'], [61.4, -6]],
    fov: [[0, 72], [NR.walk[0] - 0.001, 72], [NR.walk[0], 66, 'step'], [NR.drop.rel + 0.3, 66], [NR.drop.rel + 2.1, 46, 'inOutSine'], [NR.cut0, 45],
      [20.4, 66, 'step'], [34.4, 66], [35.2, 70, 'inOutSine'], [37.9, 70], [38.9, 68], [61.4, 68]],
    tilt: [[0, 0], [61.4, 0]],
    startles: [[NR.loss + 0.15, 0.35], [NR.pop, 0.25], [NR.ice0 + 0.02, 0.7], [37.45, 0.45], [NR_ROOF_HITS.panes[0], 0.35], [NR_ROOF_HITS.panes[1], 0.3], [NR_ROOF_HITS.line, 0.25], [NR_ROOF_HITS.pot, 0.3]],
    shakes: [[NR.ice0, 0.3, 0.5], [40.0, 0.08, 13.4]],
  },

  // your hands: a sheet of paper (right) and a tennis ball (left), held out over the parapet and let go together
  hands: {
    right: [[0, 'hidden'], [NR.drop.up + 0.1, 'holdPaperR'], [NR.drop.rel, 'openR'], [NR.cut0, 'hidden'], [NR.ice0 + 0.05, 'hidden'], [NR.ice0 + 0.3, 'shieldR'], [38.7, 'hidden']],
    left: [[0, 'hidden'], [NR.drop.up, 'holdBallL'], [NR.drop.rel, 'openL'], [NR.cut0, 'hidden']],
  },

  tracks: {
    pov: [[0, 1], [NR.sky[0] - 0.001, 1], [NR.sky[0], 0, 'step'], [NR.sky[1] - 0.001, 0], [NR.sky[1], 1, 'step'], [61.4, 1]],
  },

  hud: {
    title: { in: -0.5, out: NR.title[1], fi: 0.2, fo: 0.45, cls: 'big center', html: '<span class="kick">WHAT IF AIR RESISTANCE</span><span class="hero">SUDDENLY DISAPPEARED?</span>' },
    captions: [
      { t: 3.7, until: 5.15, text: 'The wind still blows…' },
      { t: 5.2, until: NR.drop.rel - 0.05, text: '…it just can’t push anything.' },
      { t: NR.drop.rel + 1.0, until: NR.cut0, text: 'Paper would fall like a stone.' },
      { t: 14.6, until: 16.4, text: 'His speed just keeps climbing.' },
      { t: 16.8, until: 18.4, text: 'He pulls the parachute…' },
      { t: 18.5, until: 20.3, text: '…but it can’t even open.' },
      { t: 22.0, until: 23.95, text: 'Confetti would fall like gravel.' },
      { t: 25.6, until: 27.4, text: 'Storm-force wind…' },
      { t: 27.5, until: 29.9, text: '…and nothing solid moves.' },
      { t: 30.9, until: 32.9, text: 'Floating still works.' },
      { t: 33.3, until: 35.0, text: 'That cloud is full of ice…' },
      { t: 35.1, until: 36.9, text: '…and nothing holds it up now.' },
      { t: 40.6, until: 42.6, text: 'It fell 6 km without slowing down.' },
      { t: 45.2, until: 47.4, text: 'And it keeps coming faster.' },
      { t: 49.4, until: 51.8, text: 'Now faster than a pistol bullet.' },
    ],
    says: [],
    stack: [{ t: NR.line[0], until: NR.line[1], lines: [[NR.line[0], 'The air would still be there.'], [57.0, 'It just couldn’t hold anything up.']] }],
    readouts: [],
    notes: [{ t: 58.4, until: NR.line[1], text: 'Fictional physics: only solids lose air resistance (rain and steam still ride the wind) · sound and breathing kept' }],
  },
};

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
