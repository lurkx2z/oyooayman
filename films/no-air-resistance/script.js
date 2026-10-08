/* =====================================================================
   SCRIPT — "WHAT IF AIR RESISTANCE SUDDENLY DISAPPEARED?"
   ★ The one file to edit for timing: the beats, the words, the readouts, your head (camera), your hands.
   Everything is a pure function of STORY time; CONFIG.edit plays the paper drop in slow motion and cuts to the sky.
   A rooftop party under a storm cloud. The physics (the drop, the balloons, the cloud's ice) lives in physics.js;
   the cut-away up in the storm cloud (falling beside one piece of its ice) in sky.js.
   Plan: films/no-air-resistance/PLAN.md
   ===================================================================== */

CONFIG.duration = 62.4;
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
  walk: [3.4, 6.3],                            // you look across to the kite's flyer at the parapet; at 6.3 the cut into the stairwell
  drop: { up: 6.35, rel: 7.4 },                // hands out over the stairwell's rail; paper and ball let go together (the fall plays at 0.6×)
  cut0: 10.1,                                  // the drop ends here (straight to the sky)
  sky: [14.2, 20.4],                           // the cut-away: 9 km up, falling beside one piece of the cloud's ice (into the cloud at ~16.6)
  pop: 21.15,                                  // the (spring) confetti cannon, fired straight up, a toy paratrooper with the confetti
  gale: [24.0, 25.4],                          // the gust front: the wind rises 50 → 110 km/h; the rain arrives with it
  balloon: 30.4,                               // the child lets go of the balloons
  cloud: 33.0,                                 // you look up into the cloud: its ice is falling
  ice0: 36.98,                                 // the first of the cloud's ice lands (NR_ICE.first: the lowest ice, 6 km up, falls for 35 s)
  slow: [36.85, 37.75],                        // the first stones, at half speed
  run: 37.45,                                  // you back off to the stair door
  inDoor: 38.9,                                // on its threshold, looking out
  roofHit: 45.2,                               // the ice starts coming through the stair housing's roof over you
  back: 46.4,                                  // you back off to the top of the stairs
  quiet: 53.48,                                // the last of the cloud's ice lands (NR_ICE.last); silence
  out: 54.4,                                   // you step out onto the roof
  line: [56.0, 61.8], fade: [61.4, 62.1], black: 62.1,
};

// the roof: a five-storey building on your side of the avenue (x 12.5–30.5, z −21.6…3.0), its deck 21.4 m up. Everything is
// laid out round the view from the stair door (looking −x, across the roof to the street): the table, the
// washing line (across the wind), the chimney, the kite flown from the front corner
const NR_ROOF = {
  y: 21.4, x0: 12.5, x1: 30.5, z0: -21.6, z1: 3.0, par: 1.05, parT: 0.3,
  hut: { x0: 26.6, x1: 30.2, z0: -3.2, z1: 1.6, h: 2.9, door: -0.8, doorW: 1.05, doorH: 2.15 },   // the stair housing; its door faces −x
  line: [[13.8, 1.6], [18.6, -3.2]],                    // the washing line (across the wind)
  table: { x: 21.2, z: -0.2, len: 2.2, w: 0.95 },       // (its long side along x)
  chimney: { x: 16.8, z: 1.9, w: 0.9, h: 3.0 },
  skylight: { x: 24.0, z: -4.9, w: 1.5, d: 2.2, h: 0.4 },     // (off to the left of the door's view)
  platform: { x: 20.55, z: 0.0, w: 4.9, d: 4.4 },        // the timber platform under the party
  flyer: [13.9, 2.3],                                    // the kite flyer, at the front corner
};

// what the ice does to the roof (story s). first: the first big stones round you [t, x, z, size]; then, from the doorway,
// one thing after another (the skylight's panes go while you're getting into the doorway: heard, off to your left);
// the sheets' pegs are shot away [left, middle, right]; the chairs go over; the table gives way; and from NR.roofHit
// the stair housing's roof over you is punched through (holes, roof.js)
const NR_ROOF_HITS = {
  first: [[36.98, 18.7, -1.15, 1.5], [37.2, 23.5, -2.55, 1.3], [37.43, 21.1, -0.35, 1.2], [37.66, 24.4, -1.05, 1.35], [37.93, 22.3, -3.4, 1.1], [38.2, 25.4, -3.15, 1.1]],
  panes: [38.25, 39.05], cups: [39.3, 46.5], bottles: 40.35, bunting: [41.6, 48.8], cake: 42.9, lights: 44.2,
  sheets: [49.7, 47.8, 99], chairs: [48.35, 49.3, 50.25, 51.15], pot: 50.6, table: 50.95,
};

// the cuts: the opening take, the drop (at 0.6×), the sky, the roof (the first stones landing at 0.5×)
CONFIG.edit = [[0, NR.drop.rel - 0.05], [NR.drop.rel - 0.05, NR.drop.rel + 2.35, 0.6], [NR.drop.rel + 2.35, NR.cut0], [NR.sky[0], NR.slow[0]], [NR.slow[0], NR.slow[1], 0.5], [NR.slow[1], CONFIG.duration]];

// where you stand: the stair door (the opening), leaning over the stairwell's top rail (the drop), the confetti, the storm, the
// spot by the door where the ice finds you, on the door's threshold, at the top of the stairs inside, the walk out
const NR_CAM = { x0: 26.1, z0: -0.75, xP: 28.9, zP: -0.85, xC: 24.4, zC: -5.0, xG: 25.2, zG: -5.2, xD: 25.6, zD: -1.9, xT: 27.0, xIn: 27.85, zIn: -0.8, xOut: 24.9, zOut: -1.3 };

const SCRIPT = {
  meta: { title: 'WHAT IF AIR RESISTANCE SUDDENLY DISAPPEARED?', wav: 'no-air-resistance-soundtrack.wav' },

  events: [
    { id: 'start', time: 0.0, label: 'A windy rooftop party; the title' },
    { id: 'loss', time: NR.loss, label: 'Aerodynamic force 100 % → 0 %: the laundry drops, the kite falls' },
    { id: 'drop', time: NR.walk[1], label: 'Paper and ball dropped down the stairwell land together' },
    { id: 'sky', time: NR.sky[0], label: '9 km up: falling with the cloud’s ice; the cloud streams up past' },
    { id: 'pop', time: 20.4, label: 'Confetti lands like gravel; the toy parachute can’t open' },
    { id: 'gale', time: NR.gale[0], label: '110 km/h: rain flies sideways, the washing barely moves' },
    { id: 'balloon', time: NR.balloon - 0.3, label: 'The balloons shoot up into the cloud' },
    { id: 'cloud', time: NR.cloud, label: 'The cloud’s ice is about to land' },
    { id: 'ice', time: NR.ice0 - 0.4, label: 'The first ice lands at 1,235 km/h' },
    { id: 'roar', time: NR.inDoor, label: 'The whole cloud’s ice arrives, faster and faster' },
    { id: 'roof', time: NR.roofHit, label: 'It comes through the roof over you' },
    { id: 'quiet', time: NR.quiet, label: 'The last ice; silence' },
    { id: 'line', time: NR.line[0], label: 'Only the air holds it up' },
  ],

  // your head (story time). yaw: + turns left, 0 = down the avenue (−Z), 90 = facing the street (−X). pitch: + up.
  camera: {
    baseY: NR_ROOF.y,
    x: [[0, NR_CAM.x0], [NR.walk[0], NR_CAM.x0], [NR.walk[1] - 0.001, NR_CAM.x0 - 0.25, 'inOutSine'], [NR.walk[1], NR_CAM.xP, 'step'], [NR.cut0, NR_CAM.xP],
      [20.4, NR_CAM.xC, 'step'], [24.0, NR_CAM.xC], [26.2, NR_CAM.xG, 'inOutSine'], [31.7, NR_CAM.xG], [33.0, NR_CAM.xD, 'inOutSine'], [NR.ice0 + 0.2, NR_CAM.xD],
      [38.2, 26.1, 'inOutSine'], [38.55, 26.6, 'linear'], [38.9, NR_CAM.xT, 'outSine'], [44.3, NR_CAM.xT], [45.1, NR_CAM.xIn, 'inOutSine'], [NR.out, NR_CAM.xIn],
      [55.4, 27.2, 'inSine'], [56.6, 25.9, 'linear'], [57.6, NR_CAM.xOut, 'outSine'], [62.4, NR_CAM.xOut - 1.4, 'inOutSine']],
    z: [[0, NR_CAM.z0], [NR.walk[0], NR_CAM.z0], [5.4, -2.4, 'inOutSine'], [NR.walk[1] - 0.001, -2.45], [NR.walk[1], NR_CAM.zP, 'step'], [NR.cut0, NR_CAM.zP],
      [20.4, NR_CAM.zC, 'step'], [24.0, NR_CAM.zC], [26.2, NR_CAM.zG, 'inOutSine'], [31.7, NR_CAM.zG], [33.0, NR_CAM.zD, 'inOutSine'], [NR.ice0 + 0.2, NR_CAM.zD],
      [38.2, -1.15, 'inOutSine'], [38.55, -0.85, 'linear'], [38.9, NR_CAM.zIn, 'outSine'], [NR.out, NR_CAM.zIn], [55.4, -0.85, 'inSine'], [57.6, NR_CAM.zOut, 'inOutSine'], [62.4, NR_CAM.zOut]],
    height: [[0, 1.68], [NR.walk[1] - 0.001, 1.68], [NR.walk[1], 1.56, 'step'], [NR.cut0, 1.5], [20.4, 1.68, 'step'], [37.2, 1.68], [37.6, 1.56], [38.9, 1.63], [46.8, 1.63], [47.5, 1.45], [NR.out, 1.45], [55.5, 1.68], [62.4, 1.68]],
    yaw: [[0, 88], [NR.loss, 87], [2.6, 82, 'inOutSine'], [3.3, 84], [4.9, 110, 'inOutSine'], [NR.walk[1] - 0.001, 111],
      [NR.walk[1], 2, 'step'], [NR.drop.rel, 0], [NR.cut0, -1],
      // (NR.sky: the cut-away has its own camera)
      [20.4, 129, 'step'], [22.6, 128], [23.4, 124, 'inOutSine'], [24.0, 123], [26.2, 110, 'inOutSine'], [29.2, 114, 'inOutSine'], [30.0, 144, 'inOutSine'], [31.0, 144], [31.7, 146],
      // the mum and the girl run past you for the door; you turn back to the party under the cloud
      [32.3, 150, 'inOutSine'], [33.0, 149], [33.5, 150], [34.6, 93, 'inOutSine'], [36.2, 94], [36.85, 95.5, 'inOutSine'], [37.2, 93], [37.45, 99, 'outSine'], [37.75, 90, 'inOutSine'], [38.2, 86], [38.9, 90, 'inOutSine'],
      // from the doorway: a snap in on each thing as it goes (the bottles, the cake), the look up at the roof, then the sheet,
      // the chairs, and the chimney pot and the table in one frame
      [40.0, 92], [40.3, 96.5, 'outCubic'], [41.2, 96], [41.9, 93, 'inOutSine'], [42.55, 94], [42.8, 95.5, 'outCubic'], [43.6, 95.5], [44.1, 92, 'inOutSine'],
      [45.0, 90], [45.5, 88], [46.2, 86], [47.3, 90, 'inOutSine'], [47.55, 90], [47.75, 91, 'outCubic'], [48.15, 91], [48.45, 95.5, 'inOutSine'], [49.6, 95.5],
      [50.2, 100, 'inOutSine'], [50.75, 100], [50.95, 96.5, 'outCubic'], [51.9, 96], [52.6, 93, 'inOutSine'], [NR.quiet + 0.5, 92], [55.4, 92, 'inOutSine'], [57.6, 97, 'inOutSine'], [62.4, 95, 'inOutSine']],
    pitch: [[0, 15], [1.4, 6, 'inOutSine'], [2.15, 6], [2.6, 2, 'inSine'], [3.0, -4, 'linear'], [3.35, -8, 'outSine'], [4.9, -1, 'inOutSine'], [NR.walk[1] - 0.001, -2],
      [NR.walk[1], -56, 'step'], [NR.drop.rel, -60], [NR.drop.rel + 1.3, -87, 'inOutSine'], [NR.cut0, -88],
      [20.4, 15, 'step'], [21.0, 14], [21.7, 22, 'inOutSine'], [22.6, 22], [23.25, 0, 'inOutSine'], [24.0, -4], [26.2, 1, 'inOutSine'], [29.4, 2], [30.0, 6, 'inOutSine'], [30.45, 6], [31.0, 8, 'inOutSine'], [31.7, 6],
      [32.4, -2, 'inOutSine'], [33.3, -5], [34.6, 10, 'inOutSine'], [36.1, 11], [36.85, -8, 'inOutSine'], [37.2, -10], [37.45, -3, 'outSine'], [37.75, -12, 'inOutSine'], [38.2, -6], [38.9, 1, 'inOutSine'],
      [40.0, 1], [40.3, -5, 'outCubic'], [41.2, -5], [41.9, 0, 'inOutSine'], [42.55, 0], [42.8, -6, 'outCubic'], [43.6, -6], [44.1, 2, 'inOutSine'],
      [44.9, 2], [45.25, 5], [45.75, 50, 'inOutSine'], [46.7, 53], [47.5, 4, 'inOutSine'], [47.75, 0, 'outCubic'], [48.15, 0], [48.45, -5, 'inOutSine'], [49.6, -5],
      [50.2, 1, 'inOutSine'], [50.75, 1], [50.95, -7, 'outCubic'], [51.2, -7], [51.38, -8.5, 'outCubic'], [51.9, -8.5], [52.6, 3, 'inOutSine'], [NR.quiet, 3], [NR.out, 3], [55.4, 4, 'inOutSine'], [57.6, 6, 'inOutSine'], [62.4, 7, 'inOutSine']],
    fov: [[0, 64], [2.1, 64], [3.2, 52, 'inOutSine'], [NR.walk[0], 51], [4.8, 34, 'inOutSine'], [NR.walk[1] - 0.001, 33], [NR.walk[1], 64, 'step'], [NR.drop.rel + 0.3, 64], [NR.drop.rel + 1.95, 44, 'inOutSine'], [NR.drop.rel + 2.12, 16, 'outCubic'], [NR.cut0, 15],
      [20.4, 66, 'step'], [24.0, 66], [26.4, 66], [29.3, 54, 'inOutSine'], [30.0, 40, 'inOutSine'], [30.45, 40], [31.3, 41], [32.3, 56, 'inOutSine'], [33.0, 62], [33.6, 66, 'inOutSine'], [34.4, 66], [35.2, 68, 'inOutSine'], [36.9, 68], [38.9, 72, 'inOutSine'],
      [40.0, 72], [40.3, 34, 'outCubic'], [41.2, 35], [41.9, 66, 'inOutSine'], [42.55, 66], [42.8, 34, 'outCubic'], [43.6, 35], [44.1, 64, 'inOutSine'], [45.2, 66], [45.75, 72, 'inOutSine'], [46.7, 72], [47.5, 58, 'inOutSine'],
      [47.55, 58], [47.75, 44, 'outCubic'], [48.15, 45], [48.45, 46, 'inOutSine'], [49.6, 46], [50.2, 50, 'inOutSine'], [50.75, 50], [50.95, 34, 'outCubic'], [51.2, 33], [51.38, 26, 'outCubic'], [51.9, 27], [52.6, 58, 'inOutSine'], [NR.out, 58], [55.6, 64, 'inOutSine'], [62.4, 64]],
    tilt: [[0, 0], [62.4, 0]],
    startles: [[NR.loss + 0.15, 0.35], [NR.pop, 0.2], [NR.ice0 + 0.02, 0.8], [37.2, 0.5], [37.45, 0.3], [37.66, 0.55], [38.2, 0.4], [NR_ROOF_HITS.panes[0], 0.15], [NR_ROOF_HITS.bottles, 0.3], [NR_ROOF_HITS.cake, 0.25],
      [NR.roofHit + 0.04, 0.6], [NR_ROOF_HITS.sheets[1], 0.2], [NR_ROOF_HITS.pot, 0.25], [NR_ROOF_HITS.table, 0.35], [NR_ROOF_HITS.table + 0.37, 0.45]],
    shakes: [[NR.ice0, 0.35, 0.5], [37.66, 0.25, 0.4], [38.9, 0.06, 6.3], [NR.roofHit, 0.11, 8.25]],
  },

  // your hands: a sheet of paper (right) and a tennis ball (left), held out over the parapet and let go together; a hand
  // on the door frame as you back into the doorway
  hands: {
    right: [[0, 'hidden'], [NR.drop.up + 0.1, 'holdPaperR'], [NR.drop.rel, 'openR'], [NR.drop.rel + 0.4, 'hidden']],
    left: [[0, 'hidden'], [NR.drop.up, 'holdBallL'], [NR.drop.rel, 'openL'], [NR.drop.rel + 0.4, 'hidden'], [38.5, 'hidden'], [38.85, 'frameL'], [40.2, 'frameL'], [40.6, 'hidden']],
  },

  tracks: {
    pov: [[0, 1], [NR.sky[0] - 0.001, 1], [NR.sky[0], 0, 'step'], [NR.sky[1] - 0.001, 0], [NR.sky[1], 1, 'step'], [62.4, 1]],
  },

  hud: {
    title: { in: -0.5, out: NR.title[1], fi: 0.2, fo: 0.45, cls: 'big center', html: '<span class="kick">WHAT IF AIR RESISTANCE</span><span class="hero">SUDDENLY DISAPPEARED?</span>' },
    captions: [
      { t: 3.55, until: 4.9, text: 'The kite just dropped like a brick…' },
      { t: 5.0, until: NR.walk[1] - 0.05, text: '…but the wind is still blowing at 50 km/h.' },
      { t: 8.4, until: NR.cut0, text: 'Paper now falls as fast as a ball.' },
      { t: 14.5, until: 17.05, text: 'Up in the storm, all of its ice is falling…' },
      { t: 17.2, until: 20.3, text: '…and the air can’t slow it down.' },
      { t: 20.5, until: 21.8, text: 'All of it lands here in 16 seconds.' },
      { t: 21.9, until: 23.95, text: 'So a parachute is useless.' },
      { t: 25.6, until: 27.4, text: 'The rain flies sideways…' },
      { t: 27.5, until: 29.9, text: '…but the washing barely moves.' },
      { t: 30.35, until: 32.4, text: 'Balloons now rocket up at 2 g.' },
      { t: 33.3, until: 35.0, text: 'That cloud’s ice has been falling for 31 seconds…' },
      { t: 35.1, until: 36.9, text: '…and the first of it is about to land.' },
      { t: 40.6, until: 42.5, text: 'It’s landing faster than sound.' },
      { t: 45.35, until: 47.6, text: 'And now it’s coming through the roof.' },
      { t: 48.5, until: 50.5, text: 'Now faster than a pistol bullet.' },
    ],
    says: [],
    stack: [{ t: NR.line[0], until: NR.line[1], lines: [[NR.line[0], 'Every storm cloud'], [NR.line[0], 'is full of ice.'], [57.9, 'Only the air holds it up.']] }],
    readouts: [],
    notes: [{ t: 58.9, until: NR.line[1], text: 'Fictional physics: only solids lose air resistance · rain and cloud still ride the wind' }],
  },
};

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
