/* =====================================================================
   SCRIPT — "What if friction disappeared for 60 seconds?"
   ★ The one file to edit for timings, camera, hands, captions and HUD.
   Everything is keyframed on one timeline (seconds) and is a pure function
   of time; a 'step' key is a cut. What moves in the world comes from the
   simulation (slide.js + scenario.js). Shot plan: films/friction/PLAN.md
   ===================================================================== */

CONFIG.duration = 77.0;
CONFIG.seed = 20261006;
Object.assign(CONFIG.camera, {
  cameraHeight: 1.68,
  walkSpeed: 1.35,
  bobStrength: 0.014,
  bobFrequency: 1.72,
  breathingStrength: 0.005,
  breathRate: 16,
  fov: 70,
});
CONFIG.render.shadowMapSize = 4096;

// your walk before friction goes (the camera track); afterwards your position comes from the simulation (film.js)
const FR_CAM = { x: FR_WALK.x, z0: FR_WALK.z0, z3: FR_WALK.z0 - FR_WALK.v * FR.tLoss };

// the surface-friction readout: 1.0 → 0.6 → 0.2 → 0.0 at 3 s; back at 64 s
function frFrictionText(t) { return t < 1.4 ? '1.0' : t < 2.2 ? '0.6' : t < 3.0 ? '0.2' : '0.0'; }

const SCRIPT = {
  meta: { title: 'What if friction disappeared for 60 seconds?', wav: 'friction-soundtrack.wav' },

  events: [
    { id: 'start', time: 0.0, label: 'Walking to the junction; the title' },
    { id: 'green', time: 1.4, label: 'Avenue light turns green; friction starts to drop' },
    { id: 'zero', time: 3.0, label: 'Friction 0: your foot slips, the phone squirts away, people fall' },
    { id: 'pole', time: 5.2, label: 'You hook the lamp post' },
    { id: 'step', time: 6.2, label: 'You couldn\'t even take a normal step' },
    { id: 'brake', time: 11.3, label: 'Horn: the red sedan sliding with locked wheels' },
    { id: 'clip', time: 13.46, label: 'The taxi clips the steering SUV; the sedan hits them' },
    { id: 'chairs', time: 17.7, label: 'Café chairs arrive from the hill' },
    { id: 'phase2', time: 20.0, label: '(end of phase 1)' },
  ],

  camera: {
    baseY: 0.15,
    x: [[0, FR_CAM.x], [FR.tLoss, FR_CAM.x]],
    z: [[0, FR_CAM.z0], [FR.tLoss, FR_CAM.z3]],
    height: [[0, 1.68], [3.0, 1.68], [3.22, 1.5], [3.6, 1.62], [4.2, 1.66], [5.15, 1.64], [5.35, 1.55], [5.8, 1.64], [6.25, 1.64], [6.5, 1.46], [6.95, 1.52], [7.5, 1.64], [77, 1.64]],
    // yaw: + is left. The lamp post is 32° to your left once you hold it.
    yaw: [[0, 6], [2.9, 4], [3.08, 1], [3.3, -6], [3.7, -9], [4.35, -6], [4.75, 22], [5.2, 44], [5.45, 54], [5.85, 38], [6.2, 30], [6.6, 24], [7.0, -6], [7.6, -12],
      [8.1, -58], [8.7, -92], [9.3, -84], [9.9, -20], [10.6, 6], [11.15, 8], [11.45, 148], [11.9, 150], [12.3, 118], [12.7, 86], [13.1, 58], [13.5, 44], [14.2, 40], [15.0, 36],
      [15.8, 20], [16.6, 8], [17.4, 2], [18.6, -2], [19.4, 4], [20, 6]],
    pitch: [[0, -5], [2.9, -6], [3.06, 9], [3.3, 3], [3.6, -14], [4.3, -12], [4.8, -6], [5.3, -10], [5.8, -8], [6.2, -18], [6.6, -32], [7.0, -12], [7.6, -6],
      [8.1, -12], [8.8, -16], [9.6, -8], [10.6, -1], [11.15, -1], [11.45, -2], [12.3, -3], [13.1, -2], [14.0, 1], [15.0, 1], [16.6, 2], [17.4, -3], [18.6, -3], [20, -1]],
    fov: [[0, 70]],
    roll: [[0, 0], [3.0, 0], [3.15, -6], [3.5, 3], [3.9, -1], [4.3, 0], [5.2, 0], [5.4, 4], [5.9, 0], [6.4, -5], [6.9, 2], [7.4, 0]],
    startles: [[3.0, 1.0], [5.2, 0.7], [6.35, 0.5], [11.3, 0.6], [13.46, 0.5], [13.77, 0.4]],
    shakes: [[3.0, 1.2, 0.35], [5.2, 0.9, 0.3], [6.35, 0.5, 0.3], [13.46, 0.35, 0.4], [13.77, 0.3, 0.4], [15.05, 0.2, 0.3]],
  },

  // your hands: left holds the phone; at 3.05 it squirts out; both end up on the lamp post (aimed in film.js)
  hands: {
    left: [[0, 'phoneL'], [3.02, 'flailL'], [3.6, 'balanceL'], [4.55, 'reachL'], [5.15, 'gripL'], [77, 'gripL']],
    right: [[0, 'hidden'], [3.0, 'flailR'], [3.55, 'balanceR'], [5.5, 'gripR'], [77, 'gripR']],
  },

  hud: {
    title: { in: 0.15, out: 3.95, fi: 0.25, fo: 0.4, cls: 'big center', html: '<span class="kick">WHAT IF FRICTION</span><span class="hero">DISAPPEARED</span><span class="kick">FOR 60 SECONDS?</span>' },
    captions: [
      { t: 6.3, until: 8.7, text: 'You couldn’t even take a normal step.' },
      { t: 12.2, until: 14.7, text: 'Brakes and steering depend on friction too.' },
      { t: 16.6, until: 18.9, text: 'Nothing can stop. Nothing can turn.' },
    ],
    readouts: [
      { from: 0.9, until: 6.2, top: 236, label: 'SURFACE FRICTION', value: frFrictionText },
      { from: 12.0, until: 21.0, top: 236, label: 'TIRE GRIP', value: '0%' },
    ],
  },

  tracks: {
    hypoxia: [[0, 0]],
  },
  people: [],
};

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
