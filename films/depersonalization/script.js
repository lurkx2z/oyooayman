/* =====================================================================
   SCRIPT — "What weed-induced depersonalization can feel like"
   ★ The one file to edit: timings, camera, hands, captions, HUD, cast.
   Everything is keyframed on one timeline (seconds) and is a pure function
   of time. A 'step' key is a cut. Shot plan: films/depersonalization/PLAN.md
   ===================================================================== */

CONFIG.duration = 11.6;                 // phase 1 (0–11.6 s); the full cut runs ~72 s
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
    { id: 'start', time: 0.0, label: 'Couch, friends, title (Jay exhales, mid-story)' },
    { id: 'lag', time: 1.1, label: 'Head turn lags; Mia’s laugh freezes, then catches up' },
    { id: 'normal', time: 2.0, label: 'At first, everything feels normal.' },
    { id: 'distant', time: 3.0, label: 'Jay turns to you: his voice drops away, the room recedes' },
    { id: 'hands', time: 4.15, label: 'Look down: your hands' },
    { id: 'turn', time: 6.45, label: 'Hands turn over' },
    { id: 'drift', time: 8.1, label: 'They drift away from you' },
    { id: 'mirror?', time: 9.8, label: 'What about your own reflection? (stand up)' },
  ],

  tracks: {
    // detachment: drives the grade (cooler, flatter, lifted blacks, softer edges, breathing focus)
    dp: [[0, 0], [1.1, 0], [1.25, 0.16], [2.3, 0.06], [2.95, 0.06], [3.9, 0.44, 'outQuad'], [4.8, 0.5], [7.9, 0.56], [8.7, 0.72], [9.7, 0.7], [11.6, 0.66]],
    // the picture trailing behind your head (seconds of lag) — only in a few moments
    lag: [[0, 0], [1.05, 0], [1.12, 0.1], [1.5, 0.1], [1.6, 0], [4.12, 0], [4.18, 0.07], [4.7, 0.07], [4.8, 0], [9.95, 0], [10.05, 0.09], [11.0, 0.09], [11.1, 0]],
    legs: [[0, 1], [10.0, 1], [10.05, 0, 'step']],      // your legs while you sit
  },

  camera: {
    baseY: 0,
    x: [[0, APT.seat.x], [2.85, APT.seat.x], [3.85, 0.72], [9.7, 0.74], [10.6, 0.55], [11.6, 0.15]],
    // leaning in toward Jay as his voice drops away (with the wider lens below: the room seems to recede behind him)
    z: [[0, APT.seat.z], [2.85, APT.seat.z], [3.85, 1.74, 'inOutSine'], [4.6, 1.82], [9.7, 1.86], [10.6, 1.56], [11.6, 1.38]],
    height: [[0, APT.seat.eye], [2.85, APT.seat.eye], [3.85, 1.07], [4.6, 1.1], [9.75, 1.11], [10.6, 1.66, 'inOutQuad'], [11.6, 1.66]],
    yaw: [[0, 38], [1.05, 40], [1.45, -24], [2.25, -27], [2.7, 37], [3.0, 39], [4.12, 38], [4.62, 6], [5.2, 4], [9.6, 3], [10.25, 70], [11.0, 76], [11.6, 77]],
    pitch: [[0, -6], [1.05, -5], [1.45, -11], [2.25, -12], [2.7, -5], [4.12, -6], [4.62, -56], [5.15, -50], [5.7, -40], [9.55, -38], [10.25, -4], [11.6, -2]],
    fov: [[0, 64], [2.9, 64], [3.95, 77, 'inOutSine'], [4.7, 72], [9.7, 70], [10.8, 64]],
    startles: [[4.15, 0.12]],
    shakes: [],
    sag: [[0, 0]], roll: [[0, 0]],
  },

  // first-person hands (poses: films/depersonalization/film.js). restThigh(L) are re-aimed at your thighs every frame.
  // The two hands never move in lockstep: the left follows a beat later.
  hands: {
    right: [[0, 'restThigh'], [5.0, 'palmUp'], [6.45, 'palmDown'], [7.45, 'flexIn'], [8.1, 'farOut'], [8.8, 'farIn'], [9.4, 'farOut'], [9.85, 'hidden']],
    left: [[0, 'restThighL'], [5.3, 'palmUpL'], [6.8, 'palmDown'], [7.85, 'flexInL'], [8.45, 'farOut'], [9.1, 'farInL'], [9.65, 'farOut'], [9.95, 'hidden']],
  },

  hud: {
    title: { in: -0.2, out: 2.85, fi: 0.3, cls: 'big', html: '<span class="kick">WHAT WEED-INDUCED</span><span class="hero">DEPERSONALIZATION</span><span class="kick">CAN FEEL LIKE</span>' },
    captions: [
      { t: 2.0, until: 3.35, text: 'At first, everything feels normal.' },
      { t: 3.45, until: 4.6, text: 'Then his voice sounds far away.' },
      { t: 4.7, until: 6.35, text: 'And your own body starts feeling unfamiliar.' },
      { t: 6.45, until: 8.0, text: 'You know those are your hands.' },
      { t: 8.1, until: 9.7, text: 'They just don’t feel like yours.' },
      { t: 9.8, until: 11.5, text: 'What about your own reflection?' },
    ],
    readouts: [
      { from: 4.8, until: 11.5, label: 'SENSE OF SELF', value: (t) => `${Math.round(100 - 28 * Ease.inOutSine(MathX.clamp((t - 5.05) / 4.6, 0, 1)))}%` },
    ],
  },

  // the friends (looks and seated actions: films/depersonalization/cast.js). [from, to, { at, face, seat, act | states }]
  people: [
    perf('jay', 'jay', [[0, 11.6, { at: [APT.jay.x, APT.jay.z], face: -138, seat: 0.46, states: [[0, 'sitTalk'], [0.75, 'sitLaugh'], [2.25, 'sitTalkTo']] }]]),
    perf('mia', 'mia', [[0, 11.6, { at: [APT.mia.x, APT.mia.z], face: 118, seat: 0.3, states: [[0, 'beanbagPhone'], [0.95, 'beanbagLaugh'], [3.2, 'beanbagPhone']] }]]),
  ],
  throws: [],
};

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
