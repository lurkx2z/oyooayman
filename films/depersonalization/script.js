/* =====================================================================
   SCRIPT — "What weed-induced depersonalization can feel like"
   ★ The one file to edit: timings, camera, hands, captions, HUD, cast.
   Everything is keyframed on one timeline (seconds) and is a pure function
   of time. A 'step' key is a cut. Shot plan: films/depersonalization/PLAN.md
   ===================================================================== */

CONFIG.duration = 71.2;
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

// where the camera stands for the recurring shots
const POS = {
  bathIn: [-5.75, 1.1], mirror: [-7.55, 1.1], mirrorClose: [-7.75, 1.1],
  hall: [-3.55, 1.05], room: [-2.55, 1.45], table: [0.15, 1.45], counter: [-1.9, -1.52],
};

// each friend has their own clock: [from, to, rate] windows (rate < 1 slows them, 0 freezes, > 1 catches up).
// Times in their performances below are written in film time and converted with W().
const DP_SLOW = {
  mia: [[1.6, 2.1, 0], [2.1, 2.3, 3.5], [23.0, 35.0, 0.5]],     // her laugh freezes, then catches up; later everyone is slow
  jay: [[3.05, 9.8, 0.6], [23.0, 35.0, 0.55]],
};
function warpOf(id, t) {
  let w = t;
  for (const [a, b, r] of DP_SLOW[id] || []) w -= (1 - r) * Math.max(0, Math.min(t, b) - a);
  return w;
}
const W = warpOf;

const SCRIPT = {
  meta: { title: 'What weed-induced depersonalization can feel like', wav: 'depersonalization-soundtrack.wav' },

  events: [
    { id: 'start', time: 0.0, label: 'Couch, friends, title (Jay exhales, mid-story)' },
    { id: 'lag', time: 1.1, label: 'Head turn lags; Mia’s laugh freezes' },
    { id: 'distant', time: 3.0, label: 'Jay’s voice drops away; the room recedes' },
    { id: 'hands', time: 4.15, label: 'Look down: your hands' },
    { id: 'mirror?', time: 9.8, label: 'What about your own reflection?' },
    { id: 'mirror', time: 11.6, label: 'The bathroom mirror' },
    { id: 'raise', time: 13.6, label: 'You raise a hand; so does the reflection' },
    { id: 'unreal', time: 18.0, label: 'Turn away: the world starts feeling unreal' },
    { id: 'hall', time: 19.0, label: 'Hallway: sound drops out, the corridor stretches' },
    { id: 'friends', time: 23.0, label: 'Friends laughing — slow, far away' },
    { id: 'flat', time: 25.9, label: 'The room goes flat, like a set' },
    { id: 'wall', time: 28.9, label: 'Touch the wall' },
    { id: 'phone', time: 31.0, label: 'Phone: 11:47 … still 11:47' },
    { id: 'good', time: 34.6, label: '“You good?”' },
    { id: 'panic', time: 37.5, label: 'The panic can make it stronger (heartbeat)' },
    { id: 'counter', time: 42.4, label: 'Gripping the counter; the clock' },
    { id: 'loop', time: 46.6, label: 'The checking loop' },
    { id: 'payoff', time: 52.0, label: 'The more you check… the stranger it can feel.' },
    { id: 'sit', time: 57.4, label: 'Sit down; Mia sits beside you' },
    { id: 'end', time: 61.9, label: 'Nothing around you actually changed.' },
    { id: 'note', time: 66.4, label: 'The note' },
  ],

  tracks: {
    // detachment: drives the grade (cooler, flatter, lifted blacks, softer edges, breathing focus)
    dp: [[0, 0], [1.1, 0], [1.25, 0.16], [2.3, 0.06], [2.95, 0.06], [3.9, 0.44, 'outQuad'], [4.8, 0.5], [7.9, 0.56], [8.7, 0.72], [9.7, 0.7], [11.6, 0.62],
      [13.0, 0.56], [16.2, 0.68], [18.0, 0.72], [19.5, 0.8], [23.0, 0.8], [25.9, 0.82], [28.9, 0.86], [31.0, 0.82], [35.0, 0.85], [38.0, 0.9],
      [46.6, 0.96], [56.6, 1.0], [57.4, 0.9], [62.0, 0.5], [66.0, 0.25], [71.2, 0.18]],
    // panic: tighter vignette, darker edges (the second act)
    panic: [[0, 0], [38.0, 0], [42.4, 0.55], [46.6, 0.85], [56.6, 1.0], [57.4, 0.7], [62.0, 0.15], [66.0, 0]],
    // the picture trailing behind your head (seconds of lag) — a few moments, and every cut of the loop
    lag: [[0, 0], [1.05, 0], [1.12, 0.1], [1.5, 0.1], [1.6, 0], [4.12, 0], [4.18, 0.07], [4.7, 0.07], [4.8, 0], [9.95, 0], [10.05, 0.09], [11.0, 0.09], [11.1, 0],
      [17.95, 0], [18.05, 0.09], [18.9, 0.09], [19.0, 0], [42.35, 0], [42.45, 0.05], [56.7, 0.05], [56.8, 0]],
    // dim: the loop collapses into a breath of near-black, and the final fade
    dim: [[0, 0], [56.6, 0], [56.9, 0.88], [57.25, 0.88], [57.5, 0], [70.4, 0], [71.2, 1]],
    legs: [[0, 1], [10.0, 1], [10.05, 0, 'step'], [57.4, 1, 'step']],      // your legs while you sit
  },

  camera: {
    baseY: 0,
    x: [[0, APT.seat.x], [2.85, APT.seat.x], [3.85, 0.72], [9.7, 0.74], [10.6, 0.55], [11.6, 0.15],
      // the mirror: walk in, look, lean in, the reflection seems to recede, turn away
      [11.61, POS.bathIn[0], 'step'], [12.9, -7.5], [13.6, POS.mirror[0]], [14.4, -7.56], [15.4, -7.68], [16.2, -7.66], [17.6, -7.48], [18.0, -7.46], [18.9, -7.3],
      // the hallway (it stretches), the friends, the room going flat, the wall
      [23.0, -3.6, 'linear'], [24.0, POS.room[0]], [25.9, -2.42], [28.9, POS.hall[0]], [31.0, POS.hall[0]],
      // the phone, “you good?”, the panic
      [31.01, POS.table[0], 'step'], [42.38, POS.table[0]],
      [42.4, POS.counter[0], 'step'], [46.58, POS.counter[0]],
      // THE LOOP: hands · mirror · clock · Jay · phone · wall · hands · mirror · clock · hands
      [46.6, POS.counter[0], 'step'], [47.68, POS.counter[0]], [47.7, POS.mirror[0], 'step'], [48.58, POS.mirror[0]], [48.6, POS.counter[0], 'step'], [49.48, POS.counter[0]],
      [49.5, POS.table[0], 'step'], [51.38, POS.table[0]], [51.4, POS.hall[0], 'step'], [52.28, POS.hall[0]], [52.3, POS.counter[0], 'step'], [53.28, POS.counter[0]],
      [53.3, POS.mirrorClose[0], 'step'], [54.08, POS.mirrorClose[0]], [54.1, POS.counter[0], 'step'], [57.38, POS.counter[0]],
      // the comedown: back on the couch
      [57.4, APT.seat.x, 'step'], [71.2, APT.seat.x]],
    z: [[0, APT.seat.z], [2.85, APT.seat.z], [3.85, 1.74, 'inOutSine'], [4.6, 1.82], [9.7, 1.86], [10.6, 1.56], [11.6, 1.38],
      [11.61, POS.bathIn[1], 'step'], [18.9, 1.1],
      [23.0, 1.05, 'linear'], [24.0, POS.room[1]], [25.9, 1.42], [28.9, POS.hall[1]], [31.0, POS.hall[1]],
      [31.01, POS.table[1], 'step'], [42.38, POS.table[1]],
      [42.4, POS.counter[1], 'step'], [46.58, POS.counter[1]],
      [46.6, POS.counter[1], 'step'], [47.68, POS.counter[1]], [47.7, POS.mirror[1], 'step'], [48.58, POS.mirror[1]], [48.6, -1.6, 'step'], [49.48, -1.6],
      [49.5, POS.table[1], 'step'], [51.38, POS.table[1]], [51.4, POS.hall[1], 'step'], [52.28, POS.hall[1]], [52.3, POS.counter[1], 'step'], [53.28, POS.counter[1]],
      [53.3, POS.mirrorClose[1], 'step'], [54.08, POS.mirrorClose[1]], [54.1, -1.6, 'step'], [54.88, -1.6], [54.9, POS.counter[1], 'step'], [57.38, POS.counter[1]],
      [57.4, APT.seat.z, 'step'], [71.2, APT.seat.z]],
    height: [[0, APT.seat.eye], [2.85, APT.seat.eye], [3.85, 1.07], [4.6, 1.1], [9.75, 1.11], [10.6, 1.66, 'inOutQuad'], [11.6, 1.66],
      [56.6, 1.66], [57.4, 1.5, 'step'], [58.0, APT.seat.eye, 'inOutQuad'], [71.2, APT.seat.eye]],
    yaw: [[0, 38], [1.05, 40], [1.45, -24], [2.25, -27], [2.7, 37], [3.0, 39], [4.12, 38], [4.62, 6], [5.2, 4], [9.6, 3], [10.25, 70], [11.0, 76], [11.6, 77],
      [11.61, 90, 'step'], [17.95, 91], [18.9, -90],
      [23.0, -90], [24.0, -64], [25.9, -66], [28.9, -78], [30.0, -124], [31.0, -122],
      [31.01, 8, 'step'], [32.3, 8], [32.8, -40], [33.4, -38], [33.9, -6], [34.3, 8], [34.6, 9], [35.0, 36], [37.4, 37], [38.4, 33], [39.2, 39], [40.0, 34], [40.5, 10], [41.2, 12], [42.38, 10],
      [42.4, 0, 'step'], [44.6, 1], [45.1, -16], [46.58, -16],
      [46.6, 0, 'step'], [47.68, 1], [47.7, 90, 'step'], [48.58, 90], [48.6, -16, 'step'], [49.48, -16], [49.5, 37, 'step'], [50.48, 37], [50.5, 8, 'step'], [51.38, 8],
      [51.4, -124, 'step'], [52.28, -124], [52.3, 0, 'step'], [53.28, 0], [53.3, 90, 'step'], [54.08, 90], [54.1, -16, 'step'], [54.88, -16], [54.9, 0, 'step'], [57.38, 0],
      [57.4, 10, 'step'], [58.2, 28], [59.3, 50], [60.2, 62], [60.6, 70], [62.0, 71], [62.9, 16], [66.0, 12], [71.2, 10]],
    pitch: [[0, -6], [1.05, -5], [1.45, -11], [2.25, -12], [2.7, -5], [4.12, -6], [4.62, -56], [5.15, -50], [5.7, -40], [9.55, -38], [10.25, -4], [11.6, -2],
      [11.61, -2, 'step'], [12.9, 0], [13.6, 1], [17.95, 0], [18.9, -2],
      [23.0, -2], [24.0, -6], [28.9, -6], [30.0, -9], [31.0, -9],
      [31.01, -38, 'step'], [32.3, -38], [32.8, -10], [33.9, -8], [34.3, -38], [34.6, -37], [35.0, -16], [37.4, -15], [40.0, -15], [40.5, -50], [41.0, -48], [41.45, -14], [42.38, -12],
      [42.4, -56, 'step'], [44.6, -54], [45.1, 9], [46.58, 10],
      [46.6, -50, 'step'], [47.68, -50], [47.7, 0, 'step'], [48.58, 0], [48.6, 10, 'step'], [49.48, 10], [49.5, -16, 'step'], [50.48, -16], [50.5, -38, 'step'], [51.38, -38],
      [51.4, -9, 'step'], [52.28, -9], [52.3, -52, 'step'], [53.28, -52], [53.3, 0, 'step'], [54.08, 0], [54.1, 10, 'step'], [54.88, 10], [54.9, -50, 'step'], [57.38, -52],
      [57.4, -10, 'step'], [58.2, -6], [59.3, -4], [60.2, -8], [60.6, -10], [62.0, -10], [62.9, -6], [71.2, -5]],
    fov: [[0, 64], [2.9, 64], [3.95, 77, 'inOutSine'], [4.7, 72], [9.7, 70], [10.8, 64],
      [11.61, 64, 'step'], [14.4, 64], [15.4, 60], [16.2, 60], [17.6, 68], [18.6, 64],
      [21.4, 64], [23.0, 86, 'inQuad'], [23.8, 64, 'outQuad'], [25.9, 64], [28.9, 40, 'inOutSine'], [30.2, 62], [31.0, 62],
      [31.01, 64, 'step'], [42.38, 64], [42.4, 62, 'step'], [46.58, 58],
      [46.6, 62, 'step'], [47.68, 62], [47.7, 58, 'step'], [48.58, 58], [48.6, 52, 'step'], [49.48, 52], [49.5, 56, 'step'], [50.48, 56], [50.5, 62, 'step'], [51.38, 62],
      [51.4, 62, 'step'], [52.28, 62], [52.3, 62, 'step'], [53.28, 62], [53.3, 54, 'step'], [54.08, 54], [54.1, 48, 'step'], [54.88, 48], [54.9, 66, 'step'], [56.6, 58],
      [57.4, 64, 'step'], [71.2, 64]],
    startles: [[4.15, 0.12], [39.0, 0.1]],
    shakes: [[42.42, 0.25, 0.25]],         // (gripping the counter)
    sag: [[0, 0]], roll: [[0, 0]],
  },

  // first-person hands (poses: films/depersonalization/film.js). Poses ending in '!' snap (for cuts).
  // restThigh / wallTouch / grip / chest are re-aimed at the world every frame. The two hands never move in lockstep.
  hands: {
    right: [[0, 'restThigh'], [5.0, 'palmUp'], [6.45, 'palmDown'], [7.45, 'flexIn'], [8.1, 'farOut'], [8.8, 'farIn'], [9.4, 'farOut'], [9.85, 'hidden'],
      [13.55, 'raiseHand'], [15.35, 'hidden'],
      [28.95, 'wallTouch'], [30.95, 'hidden'],
      [31.01, 'phone!'], [34.7, 'hidden'],
      [40.2, 'palmUpT'], [41.15, 'touchFace'], [42.3, 'hidden'],
      [42.4, 'gripR!'], [46.58, 'gripR'],
      [46.6, 'palmUpT!'], [47.7, 'hidden!'], [50.5, 'phone!'], [51.4, 'wallTouch!'], [52.3, 'palmDownT!'], [53.3, 'hidden!'], [54.9, 'palmUpT!'], [57.38, 'palmUpT'],
      [57.4, 'restThigh!']],
    left: [[0, 'restThighL'], [5.3, 'palmUpL'], [6.8, 'palmDown'], [7.85, 'flexInL'], [8.45, 'farOut'], [9.1, 'farInL'], [9.65, 'farOut'], [9.95, 'hidden'],
      [16.25, 'touchFace'], [17.75, 'hidden'],
      [40.4, 'palmUpTL'], [41.3, 'hidden'],
      [42.4, 'gripL!'], [46.58, 'gripL'],
      [46.6, 'palmUpTL!'], [47.7, 'hidden!'], [52.3, 'palmDownT!'], [53.3, 'hidden!'], [54.9, 'palmUpTL!'], [57.38, 'palmUpTL'],
      [57.4, 'restThighL!']],
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
      { t: 14.5, until: 16.1, text: 'Everything looks right.' },
      { t: 16.25, until: 17.95, text: 'But it doesn’t feel like you.' },
      { t: 18.3, until: 19.9, text: 'Then the world starts feeling unreal.' },
      { t: 20.05, until: 21.7, text: 'It can start to feel like a dream…' },
      { t: 21.8, until: 23.3, text: '…or weirdly far away.' },
      { t: 24.0, until: 25.75, text: 'Even your friends feel distant.' },
      { t: 26.2, until: 27.6, text: 'It all looks normal…' },
      { t: 27.7, until: 29.4, text: '…so why does it feel unreal?' },
      { t: 32.3, until: 34.2, text: 'Seconds can feel strangely long.' },
      { t: 37.6, until: 39.6, text: 'The feeling isn’t always the worst part.' },
      { t: 40.0, until: 42.2, text: 'The panic can make it stronger.' },
      { t: 46.8, until: 48.2, text: 'Do I feel normal?' },
      { t: 48.4, until: 49.8, text: 'Why don’t I feel normal?' },
      { t: 50.0, until: 51.5, text: 'Am I stuck like this?' },
      { t: 52.0, until: 53.6, text: 'The more you check…' },
      { t: 54.2, until: 56.6, text: '…the stranger it can feel.' },
      { t: 61.9, until: 63.8, text: 'Nothing around you actually changed.' },
      { t: 64.0, until: 66.1, text: 'But it felt like everything did.' },
    ],
    says: [
      { t: 35.2, until: 36.7, text: 'you good?' },
      { t: 60.6, until: 62.0, text: 'hey… you’re okay.' },
    ],
    notes: [
      { t: 66.4, until: 70.6, text: 'For many people, it fades as the high wears off.<br>If it keeps happening or doesn’t go away, talk to a healthcare professional.' },
    ],
    readouts: [
      { from: 4.8, until: 11.5, top: 236, label: 'SENSE OF SELF', value: (t) => `${Math.round(100 - 28 * Ease.inOutSine(MathX.clamp((t - 5.05) / 4.6, 0, 1)))}%` },
      { from: 13.0, until: 18.6, top: 236, label: 'SENSE OF SELF', value: (t) => `${Math.round(72 - 6 * Ease.inOutSine(MathX.clamp((t - 14.0) / 3.8, 0, 1)))}%` },
      { from: 20.2, until: 30.6, top: 236, label: 'REALITY FEEL', value: (t) => (t < 21.6 ? 'NORMAL' : t < 24.2 ? 'DREAMLIKE' : t < 27.0 ? 'DISTANT' : 'UNREAL') },
      { from: 31.3, until: 34.9, top: 236, label: 'TIME SINCE CHECK', value: (t) => `00:0${Math.max(0, Math.min(9, Math.floor(t - 31.4)))}` },
      { from: 38.6, until: 46.4, top: 236, label: 'ANXIETY', value: (t) => (t < 40.2 ? 'LOW' : t < 44.6 ? 'RISING' : 'HIGH') },
      { from: 59.6, until: 66.2, top: 236, label: 'SENSE OF SELF', value: (t) => `${Math.round(66 + 30 * Ease.inOutSine(MathX.clamp((t - 60.2) / 5.2, 0, 1)))}%` },
    ],
  },

  // the friends (looks and seated actions: films/depersonalization/cast.js). [from, to, { at | path, face, seat, act | states }]
  people: [
    perf('jay', 'jay', [[0, W('jay', 72), { at: [APT.jay.x, APT.jay.z], face: -138, seat: 0.46, states: [
      [0, 'sitTalk'], [W('jay', 0.75), 'sitLaugh'], [W('jay', 2.25), 'sitTalkTo'], [W('jay', 9.8), 'sitTalk'], [W('jay', 23.4), 'sitLaugh'], [W('jay', 25.0), 'sitTalk'],
      [W('jay', 34.6), 'sitTalkTo'], [W('jay', 37.4), 'sitWatch'], [W('jay', 57.6), 'sitWatch'], [W('jay', 63.8), 'sitLaugh'], [W('jay', 65.2), 'sitCalm']] }]]),
    perf('mia', 'mia', [
      [0, W('mia', 57.0), { at: [APT.mia.x, APT.mia.z], face: 118, seat: 0.3, states: [[0, 'beanbagPhone'], [W('mia', 0.95), 'beanbagLaugh'], [W('mia', 3.2), 'beanbagPhone'],
        [W('mia', 23.3), 'beanbagLaugh'], [W('mia', 26.2), 'beanbagPhone'], [W('mia', 37.4), 'beanbagWatch']] }],
      [W('mia', 57.0), W('mia', 60.3), { stride: 1.3, path: [[W('mia', 57.0), 1.7, 0.45], [W('mia', 57.8), 1.15, 0.05], [W('mia', 58.6), -0.15, 0.12], [W('mia', 59.4), -0.62, 0.9], [W('mia', 60.0), -0.18, 1.55], [W('mia', 60.3), 0.1, 1.92]], act: 'walk' }],
      [W('mia', 60.3), W('mia', 72), { at: [0.1, 1.95], face: 0, seat: 0.45, states: [[W('mia', 60.3), 'sitBeside']] }],
    ]),
  ],
  throws: [],
};

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
