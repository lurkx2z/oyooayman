/* =====================================================================
   SCRIPT — "What weed-induced depersonalization can feel like"
   ★ The one file to edit: timings, camera, hands, captions, HUD, cast.
   Everything is keyframed on one timeline (seconds) and is a pure function
   of time. A 'step' key is a cut. Shot plan: films/depersonalization/PLAN.md
   ===================================================================== */

CONFIG.duration = 13.0;                 // phase 1 (0–13 s); the full cut runs ~74 s
CONFIG.seed = 20261012;
Object.assign(CONFIG.camera, {
  cameraHeight: 1.66,      // a young adult standing; seated heights are written in the track
  walkSpeed: 1.2,
  bobStrength: 0.011,
  bobFrequency: 1.8,
  breathingStrength: 0.005,
  breathRate: 15,
  fov: 64,
});
CONFIG.render.shadowMapSize = 2048;

// the apartment (metres; y = 0 is the floor). Cuts between rooms are camera jumps.
const APT = {
  living: { x0: -3.0, x1: 3.0, z0: -2.6, z1: 2.6, h: 2.6 },
  hall: { x0: -6.0, x1: -3.0, z0: 0.5, z1: 1.7 },
  bath: { x0: -8.4, x1: -6.0, z0: -0.2, z1: 2.4 },
  door: { z0: 0.6, z1: 1.5 },               // living room → hallway, in the west wall
  seat: { x: 0.75, z: 1.95, eye: 1.13 },    // you, on the couch
  jay: { x: -0.8, z: 0.2 },                 // armchair, facing you
  mia: { x: 1.7, z: 0.4 },                  // beanbag, on her phone
};

const SCRIPT = {
  meta: { title: 'What weed-induced depersonalization can feel like', wav: 'depersonalization-soundtrack.wav' },

  events: [
    { id: 'start', time: 0.0, label: 'Couch, friends, title' },
    { id: 'lag', time: 2.2, label: 'Mia’s laugh lags for a moment' },
    { id: 'line', time: 3.8, label: 'Jay turns to you…' },
    { id: 'distant', time: 4.6, label: '…his voice drops away; the room stretches' },
    { id: 'hands', time: 5.2, label: 'Look down: your hands' },
    { id: 'turn', time: 7.8, label: 'Hands turn over' },
    { id: 'mirror?', time: 11.1, label: 'So what happens in a mirror? (stand up)' },
  ],

  tracks: {
    // detachment: drives the grade (colour drains, flatter, softer edges, tighter vignette, focus breathing)
    dp: [[0, 0], [2.15, 0], [2.3, 0.12], [2.75, 0], [4.55, 0], [5.1, 0.38, 'outQuad'], [6.2, 0.46], [9.4, 0.52], [10.2, 0.7], [11.0, 0.66], [13, 0.6]],
    legs: [[0, 1], [11.55, 1], [11.6, 0, 'step']],      // your legs while you sit
  },

  camera: {
    baseY: 0,
    x: [[0, APT.seat.x], [4.3, APT.seat.x], [5.05, 0.73], [11.3, 0.74], [12.3, 0.55], [13, 0.2]],
    // leaning in toward Jay as his voice drops away (with the wider lens below: the room seems to recede)
    z: [[0, APT.seat.z], [4.3, APT.seat.z], [5.05, 1.78, 'inOutSine'], [5.9, 1.84], [11.3, 1.86], [12.3, 1.58], [13, 1.42]],
    height: [[0, APT.seat.eye], [4.3, APT.seat.eye], [5.05, 1.08], [5.9, 1.1], [11.4, 1.11], [12.3, 1.66, 'inOutQuad'], [13, 1.66]],
    yaw: [[0, 36], [1.35, 37], [1.85, -18], [2.7, -20], [3.25, 36], [4.3, 38], [5.15, 37], [5.75, 6], [6.3, 4], [11.0, 3], [11.65, 72], [12.3, 76], [13, 77]],
    pitch: [[0, -6], [1.35, -4], [1.85, -10], [2.7, -11], [3.25, -5], [5.15, -6], [5.75, -55], [6.25, -50], [6.9, -38], [10.9, -36], [11.6, -3], [13, -2]],
    fov: [[0, 64], [4.3, 64], [5.05, 71, 'inOutSine'], [6.0, 69], [11.0, 68], [12.4, 64]],
    startles: [[5.2, 0.12]],
    shakes: [],
    sag: [[0, 0]], roll: [[0, 0]],
  },

  // first-person hands (poses: films/depersonalization/film.js). restThigh is re-aimed at your thigh every frame.
  hands: {
    right: [[0, 'restThigh'], [6.15, 'palmUp'], [7.8, 'palmDown'], [8.85, 'flexIn'], [9.45, 'farOut'], [10.15, 'farIn'], [10.7, 'farOut'], [11.15, 'hidden']],
    left: [[0, 'restThighL'], [6.25, 'palmUp'], [7.9, 'palmDown'], [8.95, 'flexIn'], [9.55, 'farOut'], [10.25, 'farIn'], [10.8, 'farOut'], [11.2, 'hidden']],
  },

  hud: {
    title: { in: -0.2, out: 3.85, fi: 0.3, cls: 'big', html: '<span class="kick">WHAT WEED-INDUCED</span><span class="hero">DEPERSONALIZATION</span><span class="kick">CAN FEEL LIKE</span>' },
    captions: [
      { t: 3.95, until: 5.65, text: 'At first, everything feels normal.' },
      { t: 5.75, until: 7.6, text: 'Then your own body starts feeling unfamiliar.' },
      { t: 7.7, until: 9.35, text: 'You know those are your hands.' },
      { t: 9.45, until: 11.05, text: 'They just don’t feel like yours.' },
      { t: 11.15, until: 12.95, text: 'So what happens in a mirror?' },
    ],
    readouts: [
      { from: 6.4, until: 12.9, label: 'SENSE OF SELF', value: (t) => `${Math.round(100 - 22 * Ease.inOutSine(MathX.clamp((t - 6.8) / 3.8, 0, 1)))}%`, ctx: 'CONNECTED → DISTANT' },
    ],
  },

  // the friends (looks and seated actions: films/depersonalization/cast.js). [from, to, { at, face, seat, act | states }]
  people: [
    perf('jay', 'jay', [[0, 13, { at: [APT.jay.x, APT.jay.z], face: -138, seat: 0.46, states: [[0, 'sitTalk'], [1.45, 'sitLaugh'], [2.6, 'sitTalk'], [3.7, 'sitTalkTo']] }]]),
    perf('mia', 'mia', [[0, 13, { at: [APT.mia.x, APT.mia.z], face: 37, seat: 0.3, states: [[0, 'beanbagPhone'], [1.5, 'beanbagLaugh'], [3.4, 'beanbagPhone']] }]]),
  ],
  throws: [],
};

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
