/* =====================================================================
   SCRIPT — "WHAT IF AIR RESISTANCE SUDDENLY DISAPPEARED?"
   ★ The one file to edit for timing: the beats, the words, the readouts, your head (camera), your hands.
   Everything is a pure function of STORY time; CONFIG.edit plays the paper drop in slow motion and cuts to the sky.
   A rooftop party under a storm cloud. The physics (the drop, the balloons, the cloud's ice) lives in physics.js;
   the cut-away up in the storm cloud (falling beside one piece of its ice) in sky.js.
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
  sky: [12.4, 20.4],                           // the cut-away: 9 km up, falling beside one piece of the cloud's ice (into the cloud at ~16.6)
  pop: 21.15,                                  // the (spring) confetti cannon, fired straight up, a toy paratrooper with the confetti
  gale: [24.0, 25.4],                          // the gust front: the wind rises 50 → 110 km/h; the rain arrives with it
  balloon: 30.4,                               // the child lets go of the balloons
  cloud: 33.0,                                 // you look up into the cloud: its ice is falling
  ice0: 36.98,                                 // the first of the cloud's ice lands (NR_ICE.first: the lowest ice, 6 km up, falls for 35 s)
  run: 37.45,                                  // you back off to the stair door
  inDoor: 38.9,                                // on its threshold, looking out
  roofHit: 45.2,                               // the ice starts coming through the stair housing's roof over you
  back: 46.4,                                  // you back off to the top of the stairs
  quiet: 53.48,                                // the last of the cloud's ice lands (NR_ICE.last); silence
  out: 54.4,                                   // you step out onto the roof
  line: [56.0, 60.9], fade: [60.5, 61.2], black: 61.2,
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

// the cuts: the opening take, the drop (at 0.6×), the sky, the roof
CONFIG.edit = [[0, NR.drop.rel - 0.05], [NR.drop.rel - 0.05, NR.drop.rel + 2.55, 0.6], [NR.drop.rel + 2.55, NR.cut0], [NR.sky[0], CONFIG.duration]];

// where you stand: the stair door (the opening), leaning out over the front parapet (the drop), the confetti, the storm, the
// spot by the door where the ice finds you, on the door's threshold, at the top of the stairs inside, the walk out
const NR_CAM = { x0: 26.1, z0: -0.75, xP: 12.3, zP: -2.4, xC: 24.4, zC: -5.0, xG: 25.2, zG: -5.2, xD: 25.6, zD: -1.9, xT: 27.0, xIn: 28.1, zIn: -0.8, xOut: 24.9, zOut: -1.3 };

const SCRIPT = {
  meta: { title: 'WHAT IF AIR RESISTANCE SUDDENLY DISAPPEARED?', wav: 'no-air-resistance-soundtrack.wav' },

  events: [
    { id: 'start', time: 0.0, label: 'A windy rooftop party; the title' },
    { id: 'loss', time: NR.loss, label: 'Aerodynamic force 100 % → 0 %: the laundry drops, the kite falls' },
    { id: 'drop', time: NR.walk[0], label: 'Paper and ball dropped off the roof land together' },
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
    x: [[0, NR_CAM.x0], [NR.walk[0] - 0.001, NR_CAM.x0 - 0.5], [NR.walk[0], NR_CAM.xP + 0.05, 'step'], [5.2, NR_CAM.xP, 'inOutSine'], [NR.drop.up, NR_CAM.xP - 0.08, 'inOutSine'], [NR.cut0, NR_CAM.xP - 0.08],
      [20.4, NR_CAM.xC, 'step'], [24.0, NR_CAM.xC], [26.2, NR_CAM.xG, 'inOutSine'], [32.6, NR_CAM.xG], [34.0, NR_CAM.xD, 'inOutSine'], [NR.ice0 + 0.2, NR_CAM.xD],
      [38.2, 26.1, 'inOutSine'], [38.55, 26.6, 'linear'], [38.9, NR_CAM.xT, 'outSine'], [44.3, NR_CAM.xT], [45.1, 27.85, 'inOutSine'], [47.3, NR_CAM.xIn, 'inOutSine'], [NR.out, NR_CAM.xIn],
      [55.4, 27.2, 'inSine'], [56.6, 25.9, 'linear'], [57.6, NR_CAM.xOut, 'outSine'], [61.4, NR_CAM.xOut - 0.25, 'inOutSine']],
    z: [[0, NR_CAM.z0], [NR.walk[0] - 0.001, NR_CAM.z0], [NR.walk[0], NR_CAM.zP, 'step'], [NR.cut0, NR_CAM.zP],
      [20.4, NR_CAM.zC, 'step'], [24.0, NR_CAM.zC], [26.2, NR_CAM.zG, 'inOutSine'], [32.6, NR_CAM.zG], [34.0, NR_CAM.zD, 'inOutSine'], [NR.ice0 + 0.2, NR_CAM.zD],
      [38.2, -1.15, 'inOutSine'], [38.55, -0.85, 'linear'], [38.9, NR_CAM.zIn, 'outSine'], [NR.out, NR_CAM.zIn], [55.4, -0.85, 'inSine'], [57.6, NR_CAM.zOut, 'inOutSine'], [61.4, NR_CAM.zOut]],
    height: [[0, 1.68], [NR.walk[0] - 0.001, 1.68], [NR.walk[0], 1.5, 'step'], [NR.cut0, 1.45], [20.4, 1.68, 'step'], [37.2, 1.68], [37.6, 1.56], [38.9, 1.63], [46.8, 1.63], [47.5, 1.45], [NR.out, 1.45], [55.5, 1.68], [61.4, 1.68]],
    yaw: [[0, 88], [NR.loss, 87], [2.6, 83, 'inOutSine'], [3.3, 85], [NR.walk[0] - 0.001, 86],
      [NR.walk[0], 59, 'step'], [5.0, 61], [6.1, 90, 'inOutSine'], [NR.cut0, 90],
      // (12.4–20.4: the cut-away has its own camera)
      [20.4, 124, 'step'], [24.0, 123], [26.2, 110, 'inOutSine'], [27.4, 108], [29.3, 110], [30.1, 136, 'inOutSine'], [32.4, 136],
      [33.6, 102, 'inOutSine'], [34.4, 93, 'inOutSine'], [36.2, 94], [36.85, 95.5, 'inOutSine'], [37.2, 93], [37.45, 99, 'outSine'], [37.75, 90, 'inOutSine'], [38.2, 86], [38.9, 90, 'inOutSine'],
      [40.1, 92], [40.5, 96, 'inOutSine'], [41.5, 94], [41.9, 92, 'inOutSine'], [43.0, 95, 'inOutSine'], [44.0, 91], [45.0, 90], [45.5, 88], [46.2, 86], [47.3, 90, 'inOutSine'],
      [48.6, 91], [50.4, 95, 'inOutSine'], [50.9, 97], [52.5, 93, 'inOutSine'], [NR.quiet + 0.5, 92], [55.4, 92, 'inOutSine'], [57.6, 97, 'inOutSine'], [61.4, 95, 'inOutSine']],
    pitch: [[0, 15], [1.4, 6, 'inOutSine'], [2.8, 6], [3.4, 4, 'inOutSine'], [NR.walk[0] - 0.001, 4],
      [NR.walk[0], -75, 'step'], [5.0, -73], [6.1, -50, 'inOutSine'], [NR.drop.rel, -52], [NR.drop.rel + 1.3, -85, 'inOutSine'], [NR.cut0, -86],
      [20.4, 12, 'step'], [21.0, 12], [21.9, 40, 'inOutSine'], [22.4, 42], [23.25, -8, 'inOutCubic'], [24.0, -4], [26.2, 1, 'inOutSine'], [30.0, 2], [30.4, 4], [30.7, 9], [32.0, 50, 'inOutCubic'], [32.5, 54], [33.6, 30, 'inOutSine'],
      [34.4, 14, 'inOutSine'], [36.1, 12], [36.85, -8, 'inOutSine'], [37.2, -10], [37.45, -3, 'outSine'], [37.75, -12, 'inOutSine'], [38.2, -6], [38.9, 1, 'inOutSine'],
      [44.9, 2], [45.25, 5], [45.75, 50, 'inOutSine'], [46.7, 53], [47.5, 4, 'inOutSine'], [NR.quiet, 3], [NR.out, 1], [55.4, -2, 'inOutSine'], [57.6, 1, 'inOutSine'], [61.4, 4, 'inOutSine']],
    fov: [[0, 64], [NR.walk[0] - 0.001, 64], [NR.walk[0], 66, 'step'], [NR.drop.rel + 0.3, 66], [NR.drop.rel + 2.1, 42, 'inOutSine'], [NR.cut0, 41],
      [20.4, 66, 'step'], [21.15, 66], [21.75, 40, 'inOutSine'], [22.5, 40], [23.3, 60, 'inOutSine'], [24.0, 66, 'inOutSine'], [30.6, 66], [31.7, 46, 'inOutSine'], [32.5, 47], [33.6, 66, 'inOutSine'], [34.4, 66], [35.2, 68, 'inOutSine'], [36.9, 68], [38.9, 72, 'inOutSine'], [46.7, 72], [47.5, 58, 'inOutSine'], [NR.out, 58], [55.6, 64, 'inOutSine'], [61.4, 64]],
    tilt: [[0, 0], [61.4, 0]],
    startles: [[NR.loss + 0.15, 0.35], [NR.pop, 0.2], [NR.ice0 + 0.02, 0.8], [37.2, 0.5], [37.45, 0.3], [37.66, 0.55], [38.2, 0.4], [NR_ROOF_HITS.panes[0], 0.15], [NR_ROOF_HITS.bottles, 0.3], [NR_ROOF_HITS.cake, 0.25],
      [NR.roofHit + 0.04, 0.6], [NR_ROOF_HITS.sheets[1], 0.2], [NR_ROOF_HITS.pot, 0.25], [NR_ROOF_HITS.table, 0.35]],
    shakes: [[NR.ice0, 0.35, 0.5], [37.66, 0.25, 0.4], [38.9, 0.06, 6.3], [NR.roofHit, 0.11, 8.25]],
  },

  // your hands: a sheet of paper (right) and a tennis ball (left), held out over the parapet and let go together; a hand
  // on the door frame as you back into the doorway
  hands: {
    right: [[0, 'hidden'], [NR.drop.up + 0.1, 'holdPaperR'], [NR.drop.rel, 'openR'], [NR.drop.rel + 0.4, 'hidden']],
    left: [[0, 'hidden'], [NR.drop.up, 'holdBallL'], [NR.drop.rel, 'openL'], [NR.drop.rel + 0.4, 'hidden'], [38.5, 'hidden'], [38.85, 'frameL'], [40.2, 'frameL'], [40.6, 'hidden']],
  },

  tracks: {
    pov: [[0, 1], [NR.sky[0] - 0.001, 1], [NR.sky[0], 0, 'step'], [NR.sky[1] - 0.001, 0], [NR.sky[1], 1, 'step'], [61.4, 1]],
  },

  hud: {
    title: { in: -0.5, out: NR.title[1], fi: 0.2, fo: 0.45, cls: 'big center', html: '<span class="kick">WHAT IF AIR RESISTANCE</span><span class="hero">SUDDENLY DISAPPEARED?</span>' },
    captions: [
      { t: 3.95, until: 5.25, text: 'The wind is still blowing at 50 km/h…' },
      { t: 5.35, until: NR.drop.rel - 0.05, text: '…but the kite dropped like a brick.' },
      { t: 8.4, until: NR.cut0, text: 'Paper now falls as fast as a ball.' },
      { t: 12.9, until: 15.3, text: 'Up in the storm, all of its ice is falling…' },
      { t: 15.45, until: 17.7, text: '…and nothing is slowing it down.' },
      { t: 18.0, until: 20.3, text: 'Every piece is heading for that roof.' },
      { t: 21.9, until: 23.95, text: 'A parachute would be useless.' },
      { t: 25.6, until: 27.4, text: 'The rain flies sideways…' },
      { t: 27.5, until: 29.9, text: '…but the washing barely moves.' },
      { t: 30.9, until: 32.9, text: 'Balloons would rocket up at 2 g.' },
      { t: 33.3, until: 35.0, text: 'That cloud’s ice has been falling for 31 seconds…' },
      { t: 35.1, until: 36.9, text: '…and the first of it is about to land.' },
      { t: 40.6, until: 42.6, text: 'Nothing slowed it on the way down.' },
      { t: 45.35, until: 47.6, text: 'And now it’s coming through the roof.' },
      { t: 49.4, until: 51.8, text: 'Now faster than a pistol bullet.' },
    ],
    says: [],
    stack: [{ t: NR.line[0], until: NR.line[1], lines: [[NR.line[0], 'Every storm cloud'], [NR.line[0], 'is full of ice.'], [57.9, 'Only the air holds it up.']] }],
    readouts: [],
    notes: [{ t: 58.9, until: NR.line[1], text: 'Fictional physics: only solids lose air resistance (rain, steam and cloud droplets still ride the wind) · sound and breathing kept' }],
  },
};

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
