/* =====================================================================
   SCRIPT — "What if friction disappeared for 60 seconds?"
   ★ The one file to edit for timings, camera, hands, captions and HUD.
   Everything is keyframed on one timeline (seconds, film time) and is a
   pure function of time; a 'step' key is a cut. What moves in the world
   comes from the simulation (slide.js + scenario.js — friction gone at
   1.5 s, back at 61.5 s). Everything here is on the continuous STORY
   clock; CONFIG.edit cuts that take into the film (≈70 s). Shot plan:
   films/friction/PLAN.md
   ===================================================================== */

CONFIG.duration = 74.6;
// the cut: story intervals kept, in order — the slow climb of the truck's slide (20.6–24.6) and the montage's tail
// (53.0–54.5) are dropped, and the knock that tears you off the pole plays at a third of real speed (39.3–39.9)
CONFIG.edit = [[0, 20.6], [24.6, 39.3], [39.3, 39.9, 1 / 3], [39.9, 53.0], [54.5, 74.6]];
CONFIG.seed = 20261006;
Object.assign(CONFIG.camera, {
  cameraHeight: 1.68,
  walkSpeed: 1.35,
  bobStrength: 0.014,
  bobFrequency: 1.72,
  breathingStrength: 0.005,
  breathRate: 16,
  fov: 66,
});
CONFIG.render.shadowMapSize = 4096;

// your walk before friction goes (the camera track); afterwards your position comes from the simulation (film.js)
const FR_CAM = { x: FR_WALK.x, z0: FR_WALK.z0 - FR_WALK.v * FR.shift, z3: FR_WALK.z0 - FR_WALK.v * FR.tLoss0 };

// friction comes back in 4× slow motion (story 61.6–67.6): first the wide view of the street around you (sim 61.6–62.1),
// then the same moment again from down the avenue, where the spinning car trips on an island kerb and rolls (sim
// 61.62–62.62); then a cut to the aftermath (story 67.6 = sim 63.2). Story time → simulation time:
const FR_SLOW = { t0: 61.6, t1: 67.6, k: 4 };
const FR_SEGS = [[61.6, 63.6, 61.6, 62.1], [63.6, 67.6, 61.62, 62.62]];    // [story from, story to, sim from, sim to]
const FR_AFTER = { story: 67.6, sim: 63.2 };
function frSimT(t) {
  if (t < FR_SEGS[0][0]) return t;
  for (const [a, b, c, d] of FR_SEGS) if (t < b) return c + (t - a) * (d - c) / (b - a);
  return FR_AFTER.sim + (t - FR_AFTER.story);
}
// the spinning car's trip on the island kerb (sim time) — traffic.js rolls it, city.js builds the island where it hits
const FR_TRIP = { id: 'B4', t: 61.7, q: 3 };

// moments where your eyes lock onto something: [t0, t1, target, fov] — target is a body id (with an offset [x, y, z] from it)
// or a fixed point; the head turns to it (blending in and out over ~0.3 s) and the view can narrow like you're squinting at it.
const FR_LOOK = [
  [3.85, 4.35, { p: [9.4, 1.0, -21.6] }, null],                     // the corner: the man at the mast
  [5.0, 7.45, { id: 'W3', off: [0.2, 0.75, -0.2] }, 46],
  [7.75, 9.65, { id: 'K', off: [0.94, 0.3, 1.45] }, 44],          // the electric car's front wheel, spinning
  [9.9, 11.0, { id: 'B1', off: [0, 0.7, 0] }, 50],                 // the red sedan coming at you
  [11.75, 12.65, { p: [-1.6, 0.8, -26.4] }, 30],                    // the crash, over the stuck car's roof
  [12.65, 14.75, { id: 'B2', off: [0, 0.8, 0] }, 60],               // the SUV sliding past…
  [14.75, 16.4, { p: [7.45, 3.2, 11.5] }, (t) => MathX.lerp(30, 40, MathX.smooth(t, 15.4, 16.3))],   // …into the lamp post (a squint)
  [16.95, 18.9, { id: 'T', off: [0, 1.6, 0] }, 12],                 // the truck at the top of the hill
  [24.6, 29.0, { id: 'T', off: [0, 1.4, 0] }, (t) => MathX.lerp(14, 36, MathX.smooth(t, 24.8, 28.9))],   // …coming down backwards
  [30.6, 31.6, { p: [5.5, 1.2, -46] }, (t) => MathX.lerp(40, 54, MathX.smooth(t, 30.7, 31.5))],   // everything on the hill comes loose
  [31.6, 33.95, { id: 'B4', off: [0, 1.2, 0] }, 62],                                                // a spinning car slides at you… and clips the car beside you
  [34.6, 39.3, { id: 'T', off: [0, 1.2, 0] }, (t) => MathX.lerp(52, 64, MathX.smooth(t, 35.5, 39.2))],   // the truck: through the junction, into the cars, spinning at you
  [39.3, 39.72, { p: [5.3, 0.9, -17.6] }, 76],                       // (slow motion) its nose into the car beside you — and that car's nose into you
  [58.4, 61.9, { id: 'T', off: [0, 1.2, 0] }, (t) => MathX.lerp(60, 38, MathX.smooth(t, 58.5, 61.4))],   // 3 · 2 · 1: the truck across the street, still sliding
];

// HUD text helpers
const frFrictionText = (t) => (t < 0.5 ? '1.0' : t < 1.0 ? '0.6' : t < 1.5 ? '0.2' : '0.0');
const frClock = (n) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
const frBackIn = (t) => (t < FR.tLoss ? '' : `BACK IN ${frClock(Math.max(0, Math.ceil(FR.tBack - t)))}`);
const frCountdown = (t) => `00:${String(Math.max(0, Math.ceil(FR.tBack - t))).padStart(2, '0')}`;
const frSpeed = (id, t, k = 3.6) => (FILM._app ? Math.round(FILM._app.world.sample(id, frSimT(t)).speed * k) : 0);
const frWheel = (id, t) => (FILM._app ? Math.round(Math.abs(FILM._app.world.sample(id, frSimT(t)).wheelRate) * FR_WHEEL_R.ev * 3.6) : 0);

const SCRIPT = {
  meta: { title: 'What if friction disappeared for 60 seconds?', wav: 'friction-soundtrack.wav' },

  events: [
    { id: 'start', time: 0.0, label: 'Walking along the kerb; the title; friction already dropping' },
    { id: 'zero', time: 1.5, label: 'Friction 0: your foot slips, the phone squirts away, people fall' },
    { id: 'pole', time: 3.56, label: 'Chest-first into the sign pole; arms round it; foot against the kerb' },
    { id: 'step', time: 4.4, label: 'You couldn’t even take a normal step; the man at the corner does the splits' },
    { id: 'wheels', time: 7.6, label: 'The electric car floors it: wheels spin, car stays' },
    { id: 'brake', time: 9.8, label: 'Horn: the red sedan, brakes on, sliding at 32 km/h' },
    { id: 'clip', time: 11.96, label: 'The taxi clips the steering SUV; the sedan slams in' },
    { id: 'lamp', time: 14.95, label: 'The SUV slides past you and snaps a lamp post' },
    { id: 'hill', time: 16.6, label: 'Up the hill, the truck has stopped… and starts sliding back (drone, 18.9)' },
    { id: 'slope', time: 24.6, label: '(cut) The truck coming down the hill, backwards' },
    { id: 'smash', time: 29.4, label: 'Cutaway at the foot of the hill: the truck smashes the parked cars; the bollards give' },
    { id: 'pass', time: 33.75, label: 'A spinning car flies past you and clips the car beside you' },
    { id: 'truck', time: 36.6, label: 'The truck smashes through the junction and spins toward you' },
    { id: 'knock', time: 39.53, label: 'The truck hits the car beside you; its nose knocks you off the pole' },
    { id: 'shop', time: 42.03, label: 'You slide backwards into the shopfront, then along it' },
    { id: 'montage', time: 46.5, label: 'Meanwhile: conveyor, bike, crane, grip, ambulance (cut at 53.0)' },
    { id: 'realize', time: 54.5, label: 'And then you realize… it’s coming back' },
    { id: 'count', time: 58.5, label: '3 · 2 · 1' },
    { id: 'return', time: 61.5, label: 'Friction returns: your jolt, then 4× slow motion — the street, then the roll' },
    { id: 'after', time: 67.6, label: 'Aftermath: the skid marks and the wreck; you stand; your foot grips' },
  ],

  camera: {
    baseY: 0.15,
    x: [[0, FR_CAM.x], [FR.tLoss, FR_CAM.x]],
    z: [[0, FR_CAM.z0], [FR.tLoss, FR_CAM.z3]],
    // camera height above the sidewalk (film.js adds the ground under you once you leave it)
    height: [[0, 1.68], [1.0, 1.68], [1.08, 1.63], [1.25, 1.68], [1.5, 1.68], [1.66, 1.5], [1.95, 1.62], [2.4, 1.66], [3.5, 1.66], [3.62, 1.58], [3.9, 1.64],
      [4.45, 1.64], [4.62, 1.44], [5.0, 1.5], [5.6, 1.64], [39.62, 1.64], [39.9, 1.18], [40.25, 0.86], [42.0, 0.86], [42.08, 0.79], [42.4, 0.86],
      [61.5, 0.86], [61.62, 0.74], [61.9, 0.84], [69.6, 0.86], [70.4, 1.2], [71.0, 1.66], [74.6, 1.66]],
    // yaw: + is left (0 = up the street toward the junction and the hill)
    yaw: [[0, 5], [1.0, 4], [1.5, 3], [1.56, 12], [1.95, 16], [2.15, -16], [2.75, -14], [3.1, 6], [3.45, 2], [3.56, 0], [3.7, -6], [4.3, -26], [4.6, -31], [5.0, -18], [7.4, -14],
      [7.8, 14], [9.6, 18], [9.85, 150, 'outQuad'], [10.6, 146], [11.0, 120], [11.4, 74], [11.75, 44], [12.6, 44], [13.0, 92], [13.5, 140], [14.0, 164], [14.6, 178], [15.6, 181],
      [16.4, 182], [16.95, 4, 'inOutQuad'], [18.9, 3], [24.6, 3, 'step'], [29.0, 1], [30.6, 2, 'step'], [31.0, 4], [31.6, 8], [32.4, 20], [33.0, 36], [33.5, 69], [33.75, 92],
      [33.95, 100], [34.75, 24, 'inOutQuad'], [36.0, 40], [37.5, 50], [39.3, 53], [39.72, 56], [39.95, 72, 'outQuad'], [40.6, 80], [42.03, 84], [42.2, 87], [44.0, 84], [44.7, 58],
      [45.5, 24], [46.4, 20],
      [54.5, 104, 'step'], [56.5, 96], [58.4, 100], [61.5, 106], [61.9, 106], [67.6, 112, 'step'], [69.4, 138], [70.6, 140], [72.6, 136], [74.6, 128]],
    pitch: [[0, -10], [1.0, -9], [1.5, -8], [1.56, 6], [1.62, 8], [1.75, -30], [2.0, -28], [2.15, -14], [2.75, -12], [3.1, -12], [3.5, -14], [3.6, -24], [3.9, -18], [4.3, -16],
      [4.6, -34], [5.0, -12], [5.6, -4], [7.4, -4], [7.8, -14], [9.6, -13], [9.85, -2], [11.0, -3], [11.75, -2], [12.6, -1], [14.0, -2], [15.6, -1], [16.4, -1], [16.95, 2], [18.9, 2],
      [24.6, 3, 'step'], [29.0, 3], [30.6, 2, 'step'], [31.0, 1], [33.4, -2], [33.95, -6], [34.75, 0], [39.3, -4], [39.72, -14], [39.85, 12], [40.25, -6], [41.0, -8], [42.0, -8],
      [42.08, -16], [42.4, -10], [44.0, -12], [45.5, 2], [46.4, 2],
      [54.5, 0, 'step'], [58.4, 2], [61.5, 2], [61.62, -12], [61.9, -4], [67.6, -3, 'step'], [69.4, -5], [70.4, -12], [71.0, -32], [71.3, -60], [72.1, -52], [73.0, -8], [74.6, -6]],
    fov: [[0, 66], [4.6, 66], [5.0, 50], [7.4, 50], [7.8, 56], [9.6, 56], [9.85, 62], [11.75, 54], [12.6, 54], [13.0, 62], [14.6, 62], [14.75, 40], [16.4, 58], [16.95, 40], [18.9, 12],
      [24.6, 14, 'step'], [29.0, 36], [30.6, 40, 'step'], [31.6, 54], [33.45, 58], [34.75, 54], [39.3, 64], [39.72, 76], [39.9, 66], [46.4, 66], [54.5, 64, 'step'], [58.4, 60],
      [61.5, 40], [61.9, 40], [67.6, 64, 'step'], [74.6, 64]],
    roll: [[0, 0], [1.5, 0], [1.6, -7], [1.9, 3], [2.3, -1], [2.7, 0], [3.56, 0], [3.66, 4], [4.0, -2], [4.4, 0], [4.62, -5], [5.0, 2], [5.4, 0],
      [39.62, 0], [39.8, 7], [40.3, 3], [42.0, 3], [42.1, -4], [42.6, -1], [46.4, 0], [61.5, 0], [61.6, 5], [62.0, 0]],
    startles: [[1.05, 0.25], [1.5, 1.0], [3.56, 0.9], [4.62, 0.5], [9.8, 0.4], [11.96, 0.35], [12.27, 0.35], [14.95, 0.6], [29.4, 0.6], [33.75, 0.5], [35.68, 0.35],
      [39.27, 0.45], [39.53, 0.7], [39.67, 1.0], [42.03, 0.7], [42.15, 0.3], [61.5, 1.0]],
    shakes: [[1.5, 1.2, 0.35], [3.56, 1.0, 0.3], [4.62, 0.5, 0.3], [11.96, 0.3, 0.4], [12.27, 0.3, 0.4], [14.95, 0.45, 0.35], [29.4, 0.5, 0.5], [33.75, 0.5, 0.3],
      [35.68, 0.4, 0.25], [39.27, 0.5, 0.25], [39.53, 0.9, 0.3], [39.67, 1.4, 0.4], [42.03, 0.9, 0.35], [42.15, 0.3, 0.2], [61.5, 1.6, 0.5]],
  },

  // your hands: the phone in your left hand until 1.5 s; arms round the pole from 3.5 s; torn off at 39.67 s; then braced on the ground
  hands: {
    left: [[0, 'phoneL'], [1.52, 'flailL'], [1.95, 'balanceL'], [3.25, 'reachL'], [3.56, 'gripL'], [39.67, 'flailL'], [40.25, 'braceL'], [46.4, 'braceL'], [46.5, 'hidden!'],
      [54.5, 'braceL!'], [61.5, 'braceL'], [69.6, 'braceL'], [70.3, 'pushL'], [71.0, 'hidden']],
    right: [[0, 'hidden'], [1.5, 'flailR'], [1.95, 'balanceR'], [3.25, 'reachR'], [3.56, 'gripR'], [39.67, 'flailR'], [40.3, 'braceR'], [46.4, 'braceR'], [46.5, 'hidden!'],
      [54.5, 'braceR!'], [61.5, 'braceR'], [69.6, 'braceR'], [70.2, 'pushR'], [70.9, 'hidden']],
  },

  hud: {
    title: { in: 0.1, out: 3.25, fi: 0.22, fo: 0.4, cls: 'big center', html: '<span class="kick">WHAT IF FRICTION</span><span class="hero">DISAPPEARED</span><span class="kick">FOR 60 SECONDS?</span>' },
    captions: [
      { t: 4.4, until: 6.6, text: 'You couldn’t even take a normal step.' },
      { t: 11.8, until: 14.0, text: 'Brakes and steering depend on friction too.' },
      { t: 15.3, until: 16.9, text: 'Things only stop when they hit something.' },
      { t: 17.2, until: 18.9, text: 'Up the hill, the truck had stopped…' },
      { t: 19.05, until: 20.5, text: '…and started sliding back.' },
      { t: 24.8, until: 27.4, text: 'Even a small hill becomes dangerous.' },
      { t: 40.0, until: 42.5, text: 'Now you’re part of it.' },
      { t: 54.7, until: 56.5, text: 'And then you realize…' },
      { t: 56.7, until: 58.4, text: '…it’s coming back.' },
      { t: 68.0, until: 70.2, text: 'You’d never notice friction…' },
      { t: 70.6, until: 73.4, text: '…until it was gone.' },
    ],
    readouts: [
      { from: 0.0, until: 7.4, top: 220, label: 'SURFACE FRICTION', value: frFrictionText, sub: (t) => (t >= FR.tLoss ? 'SOLID SURFACES ONLY' : ''), ctx: frBackIn },
      { from: 7.6, until: 9.7, top: 220, label: 'TIRE GRIP 0%', value: 'CAR 0 km/h', sub: (t) => `WHEELS SPINNING AT ${frWheel('K', t)} km/h`, ctx: frBackIn },
      { from: 9.9, until: 11.7, top: 220, label: 'RED CAR · BRAKES ON', value: (t) => `${frSpeed('B1', t)} km/h`, sub: 'BRAKE PADS CAN’T GRIP EITHER', ctx: frBackIn },
      { from: 11.85, until: 16.9, top: 220, label: 'SURFACE FRICTION', value: '0.0', sub: 'SOLID SURFACES ONLY', ctx: frBackIn },
      { from: 17.0, until: 29.0, top: 220, label: 'SLOPE', value: '7°', sub: (t) => `TRUCK SLIDING BACK · ${frSpeed('T', t)} km/h`, ctx: frBackIn },
      { from: 30.6, until: 33.5, top: 220, label: 'SLOPE', value: '7°', sub: 'NOTHING ON THE HILL CAN HOLD', ctx: frBackIn },
      { from: 33.6, until: 37.4, top: 220, label: 'SURFACE FRICTION', value: '0.0', sub: 'SOLID SURFACES ONLY', ctx: frBackIn },
      { from: 37.5, until: 58.4, top: 220, label: 'FRICTION RETURNS IN', value: frCountdown, sub: '' },
      { from: 61.5, until: 67.4, top: 220, label: 'FRICTION', value: '100%', sub: 'EVERYTHING GRIPS AT ONCE' },
      { from: 67.8, until: 74.2, top: 220, label: 'SURFACE FRICTION', value: 'NORMAL', sub: '' },
    ],
  },

  tracks: {
    hypoxia: [[0, 0]],
  },
  people: [],
};

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
