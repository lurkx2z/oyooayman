/* =====================================================================
   SCRIPT — "What if air became 10× denser?"
   ★ The one file to edit for timings, camera, hands, captions and HUD.
   Film time t drives the camera and the text; story time S (airStory)
   drives the world: the cold open is a moment from the gale (S 37–40),
   a rewind runs it back to S 4.7, and from 4.7 s film and story agree.
   The physics (drag, wind pressure) lives in physics.js. Plan and
   numbers: films/air/PLAN.md
   ===================================================================== */

CONFIG.duration = 48.6;
CONFIG.seed = 20261013;
Object.assign(CONFIG.camera, { cameraHeight: 1.68, walkSpeed: 1.1, bobStrength: 0.013, bobFrequency: 1.7, breathingStrength: 0.005, breathRate: 15, fov: 66 });
CONFIG.render.shadowMapSize = 4096;

const AR = {
  cold: 3.0, coldS: 35.0, rewind: [3.0, 4.7],
  density: [4.9, 7.3],
  throwT: 8.8, cyc: 12.2, car: 16.4, fall: 21.6, wind: 25.6, gale: 29.0, eq: 30.0,
  brk: { bin: 34.2, umbrella: 35.2, sign: 36.2, cyclist: 37.2, branch: 38.2, roof: 39.2, blade: 32.2 },
  bill: { look: 40.0, bolts: 40.9, tear: 42.6, swerve: 43.3, glass: 44.15 },
  final: 45.0, sweep: 48.15, black: 48.5,
};
// film time → story time
function airStory(t) {
  if (t < AR.cold) return AR.coldS + t;
  if (t < AR.rewind[1]) { const k = Ease.inOutCubic(MathX.clamp((t - AR.rewind[0]) / (AR.rewind[1] - AR.rewind[0]), 0, 1)); return MathX.lerp(AR.coldS + AR.cold, AR.rewind[1], k); }
  return t;
}

// where you stand (story): walking in, stopping for the throw, on toward the scaffold, then standing in the gale
const AIR_CAM = { x: 9.6, z0: 6.0, zStop: 2.0, zGale: -1.0 };

const airFmt = (n) => (n >= 9.95 ? '10' : n.toFixed(1));

const SCRIPT = {
  meta: { title: 'What if air became 10× denser?', wav: 'air-soundtrack.wav' },
  events: [
    { id: 'cold', time: 0.0, label: 'Cold open: a 60 km/h wind doing hurricane damage (story 35–38 s)' },
    { id: 'rewind', time: 3.0, label: '33 SECONDS EARLIER' },
    { id: 'density', time: 4.9, label: 'Air density 1 → 10×' },
    { id: 'throw', time: 8.8, label: 'The throw dies in the air' },
    { id: 'cyclist', time: 12.2, label: 'The cyclist can’t get past 17 km/h' },
    { id: 'car', time: 16.0, label: 'The car sheds speed off the throttle' },
    { id: 'fall', time: 20.8, label: 'Clamp vs plywood sheet' },
    { id: 'wind', time: 25.6, label: 'The wind rises: 30 → 50 km/h' },
    { id: 'gale', time: 29.0, label: '60 km/h ≈ 190 km/h in normal air' },
    { id: 'escalate', time: 34.0, label: 'Bin, umbrella, pole sign, cyclist, branch, roof sheet' },
    { id: 'billboard', time: 40.0, label: 'The billboard from frame one fails' },
    { id: 'final', time: 45.0, label: 'Same wind speed. Ten times the air.' },
  ],

  camera: {
    baseY: 0.15,
    // (film time) the cold open stands where you will be at story 37–40; the rewind carries you back up the street
    x: [[0, AIR_CAM.x], [79, AIR_CAM.x]],
    z: [[0, AIR_CAM.zGale], [AR.rewind[0], AIR_CAM.zGale], [AR.rewind[1], AIR_CAM.z0, 'inOutCubic'], [9.0, AIR_CAM.zStop, 'linear'], [16.6, AIR_CAM.zStop], [20.8, AIR_CAM.zGale, 'inOutSine'], [79, AIR_CAM.zGale]],
    // yaw: + is left (0 = down the street, −Z)
    yaw: [[0, 4], [AR.rewind[0], 8], [AR.rewind[1], 5, 'inOutCubic'], [8.4, 8],
      [9.0, 50], [9.6, 55], [10.4, 60], [11.6, 66], [12.2, 72],                                                   // the throw, across the street
      [12.9, 100], [13.6, 90], [14.6, 52], [16.0, 34],                                                           // the cyclist passes and rides on
      [16.6, 40], [17.2, 18], [20.0, 8], [20.8, 2],                                                              // the car
      [21.45, -12], [23.3, -12], [25.6, -10],                                                                    // the scaffold: clamp and sheet
      [26.4, 12], [27.6, 18], [29.0, 6], [30.0, -4], [31.6, -8], [33.2, -10], [33.7, -8],         // trees, terrace, the hanging sign
      [34.1, 4], [34.9, -2], [35.2, -4], [35.9, 12], [36.3, 18], [36.6, 18], [37.3, 28], [37.9, 26],            // bin, umbrella, pole sign, cyclist
      [38.3, 6], [38.9, 9], [39.3, -15], [39.9, -8], [40.3, -6], [42.6, -6], [43.1, -4], [43.45, -1], [43.7, 6], [43.95, 14], [44.2, 20], [44.6, 22], // branch, roof sheet, the billboard
      [45.0, 8], [48.6, 2]],
    pitch: [[0, 10], [AR.rewind[0], 9], [AR.rewind[1], -2, 'inOutCubic'], [8.4, -1],
      [9.0, 2], [9.6, 4], [10.4, 1], [11.6, 0], [12.2, -2], [13.6, -4], [16.0, -2], [20.0, 0], [20.8, 4],
      [21.45, 46], [21.8, 45], [22.6, 15], [23.3, -8], [24.0, 5], [24.8, -4], [25.4, -9], [25.6, -8],
      [26.4, 12], [27.6, 16], [29.0, 8], [30.0, 7], [31.6, 9], [33.2, 10], [33.7, 6],
      [34.1, -6], [34.9, 0], [35.2, 4], [35.9, 14], [36.3, 4], [36.6, -4], [37.3, -2], [37.9, -1],
      [38.3, 12], [38.9, 3], [39.3, 8], [39.9, 16], [40.3, 25], [42.6, 25], [43.1, 24], [43.45, 22], [43.7, 15], [43.95, 7], [44.2, 2], [44.6, 2],
      [45.0, 3], [48.6, 4]],
    fov: [[0, 64], [AR.rewind[1], 66], [8.4, 66], [9.2, 58], [12.2, 58], [12.9, 64], [16.0, 64], [21.4, 64], [25.6, 64], [29.0, 66], [40.2, 60], [42.6, 60], [43.4, 68], [48.6, 68]],
    startles: [[23.26, 0.25], [AR.bill.tear, 0.5], [AR.bill.glass, 1.0], [AR.brk.branch, 0.3]],
    shakes: [[AR.bill.glass, 0.8, 0.4], [AR.sweep, 0.6, 0.3]],
  },

  hands: {
    left: [[0, 'hidden']],
    right: [[0, 'hidden'], [AR.bill.glass - 0.12, 'shieldR'], [AR.bill.glass + 0.55, 'hidden']],
  },

  hud: {
    captions: [
      { t: 5.0, until: 6.7, text: 'The air would still look normal.' },
      { t: 6.85, until: 8.6, text: 'But moving through it wouldn’t.' },
      { t: 10.2, until: 12.2, text: 'Anything moving fast would fight far more air.' },
      { t: 12.9, until: 14.3, text: 'The faster you move…' },
      { t: 14.4, until: 15.9, text: '…the worse it gets.' },
      { t: 22.4, until: 24.8, text: 'Even falling changes.' },
      { t: 25.8, until: 27.3, text: 'Then comes the real problem.' },
      { t: 27.4, until: 28.9, text: 'The wind.' },
      { t: 31.0, until: 33.8, text: 'A normal gale would hit like a hurricane.' },
      { t: 45.25, until: 46.5, text: 'Same wind speed.' },
      { t: 46.65, until: 48.3, text: 'Ten times the air.' },
    ],
    readouts: [],
    notes: [{ t: 45.4, until: 48.35, text: 'Aerodynamic effects isolated for this simulation.' }],
  },

  tracks: {},
  people: [],
};

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
