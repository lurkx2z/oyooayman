/* =====================================================================
   SCRIPT — "What if the Moon crashed into Earth?"
   ★ The one file to edit: the story clock (cold open → rewind → 24 hours),
   the Moon's distance and place in your sky, the sea level, the camera,
   your hands, captions and the HUD. Everything is a pure function of time;
   a 'step' key is a cut. Shot plan and physics notes: films/moon/PLAN.md
   ===================================================================== */

CONFIG.duration = 80.0;
CONFIG.seed = 20261101;
Object.assign(CONFIG.camera, {
  cameraHeight: 1.7,
  walkSpeed: 1.3,
  bobStrength: 0.012,
  bobFrequency: 1.8,
  breathingStrength: 0.005,
  breathRate: 15,
  fov: 60,
  shakeStrength: 1.0,
});
CONFIG.render.shadowMapSize = 2048;

// ---------------------------------------------------------------------------------------------------------------------
// THE STORY CLOCK. The film opens near the end (the cold open), rewinds 24 hours, then plays the day through to impact.
// Everything in the world (the Moon, the sea, the lights, the damage) runs on story time S; the camera, captions and HUD
// run on film time t. The impact is at S = 74.5.
// ---------------------------------------------------------------------------------------------------------------------
const MN = { impact: 74.5, cold: [50.0, 51.3], rewind: [4.0, 5.6], black: 76.3 };
function mnStory(t) {
  if (t < MN.rewind[0]) return MN.cold[0] + (MN.cold[1] - MN.cold[0]) * (t / MN.rewind[0]);
  if (t < MN.rewind[1]) { const u = (t - MN.rewind[0]) / (MN.rewind[1] - MN.rewind[0]), e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; return MathX.lerp(MN.cold[1], MN.rewind[1], e); }
  return t;
}
// hours since the evening it began (the night of the rewind = 0 h, impact = 24 h)
const mnHours = (S) => 24 * Math.pow(MathX.clamp((S - MN.rewind[1]) / (MN.impact - MN.rewind[1]), 0, 1), 0.8);

// monotone cubic through [x, y] keys (Fritsch–Carlson)
function mnCurve(K) {
  const X = K.map((k) => k[0]), Y = K.map((k) => k[1]), n = X.length, d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((Y[i + 1] - Y[i]) / (X[i + 1] - X[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) { if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; } const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b; if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; } }
  return (t) => {
    if (t <= X[0]) return Y[0]; if (t >= X[n - 1]) return Y[n - 1];
    let i = 0; while (t > X[i + 1]) i++;
    const h = X[i + 1] - X[i], u = (t - X[i]) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * Y[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * Y[i + 1] + (u3 - u2) * h * m[i + 1];
  };
}

// THE MOON over story time: centre-to-centre distance (km, interpolated in log), height in your sky (deg), azimuth (deg,
// 0 = due south over the sea, + = toward the east / left), its roll, and which face point is turned to you (lat, lon).
// Contact (8 108 km between centres) at the impact.
const MN_MOON = {
  dist: [[5.6, 384400], [9, 352000], [13, 190000], [17, 112000], [21, 66000], [25, 40000], [30, 24500], [35, 18000], [39, 15200],
    [43, 13300], [47, 11800], [51, 10600], [55, 9800], [59, 9250], [63, 8850], [67, 8550], [71, 8300], [74.5, 8108]],
  elev: [[5.6, 7.5], [13, 8.5], [21, 12], [30, 18], [39, 24], [47, 29], [55, 33], [63, 36], [69, 37], [74.5, 34.5]],
  az: [[5.6, 5], [30, 3], [55, 1], [63, 0], [74.5, -5]],
  roll: [[5.6, -24], [74.5, -18]],
  faceLat: [[5.6, 0], [30, 2], [55, 8], [74.5, 13]],
  faceLon: [[5.6, 0], [30, -3], [55, -9], [74.5, -14]],
};
const mnDist = (() => { const f = mnCurve(MN_MOON.dist.map(([s, d]) => [s, Math.log(d)])); return (S) => Math.exp(f(S)); })();
const MN_MOON_C = Object.fromEntries(['elev', 'az', 'roll', 'faceLat', 'faceLon'].map((k) => [k, mnCurve(MN_MOON[k])]));

// THE SEA over story time: level (m above normal; the quay top is +2.0) and its flow (+ = inland). The tides grow with
// the Moon's tidal pull (∝ 1/distance³): first the harbour drains, then a surge; strong sloshing currents; the flood
// through the streets; it drains back as the ground shakes; the bay empties; the last great surge.
const MN_SEA = [
  [0, 0], [5.6, 0], [12.5, 0], [14.5, -1.6], [16.5, -4.6], [17.6, -5.4], [18.6, -2.5], [19.6, 0.8], [20.6, 1.5], [21.6, 1.7],
  [23.2, -0.4], [25.0, 2.15], [26.9, 0.2], [28.7, 2.3], [30.4, 0.3], [31.8, -1.6], [33.2, -0.6], [34.2, 2.1], [35.5, 2.55],
  [39, 2.7], [44, 2.75], [47, 2.72], [51, 2.62], [55, 1.5], [58, -3.0], [62, -11.5], [64.5, -7.0], [67.5, 4.0], [71, 11.0], [74.5, 17.0], [80, 18],
];
const mnSea = mnCurve(MN_SEA);
// the leading edge of a surge front running inland (z along the main street; null when there is none)
const MN_BORES = [
  { s0: 17.9, s1: 20.4, z0: -160, z1: -22, h: 1.6 },      // the harbour fills again
  { s0: 33.2, s1: 38.5, z0: -45, z1: 64, h: 0.55 },        // the surge through the streets (it slows as it runs inland)
  { s0: 64.0, s1: 73.5, z0: -900, z1: 40, h: 6.0 },       // the last great surge (seen from the hill)
];

// ground tremor (0..1) over story time
const MN_QUAKE = [[0, 0], [44, 0], [46.5, 0.15], [48, 0.55], [50, 0.8], [52, 0.6], [55, 0.75], [60, 0.55], [64, 0.7], [70, 0.85], [74.5, 1.0], [80, 1.0]];
const mnQuake = mnCurve(MN_QUAKE);
// the city's power (1 = all lights on) and its emergency lights
const MN_POWER = [[0, 1], [33, 1], [34.5, 0.8], [38, 0.7], [48.2, 0.55], [50.5, 0.3], [53, 0.25], [61, 0.1], [74.5, 0.05]];
const mnPower = mnCurve(MN_POWER);

// HUD helpers
const mnKm = (S) => Math.round(mnDist(S) / 100) * 100;
const mnFmt = (n) => n.toLocaleString('en-US');
const mnCount = (t) => Math.max(0, Math.ceil((MN.impact - t) / 1.4));

const SCRIPT = {
  meta: { title: 'What if the Moon crashed into Earth?', wav: 'moon-soundtrack.wav' },

  events: [
    { id: 'cold', time: 0.0, label: 'Cold open: an enormous Moon over the flooded street; the title' },
    { id: 'rewind', time: 4.0, label: 'Rewind: 24 hours earlier' },
    { id: 'normal', time: 5.6, label: 'A normal evening by the sea; the Moon low over the water' },
    { id: 'tide', time: 13.0, label: 'The harbour drains, then fills again' },
    { id: 'huge', time: 21.0, label: 'The Moon becomes terrifying; phones up' },
    { id: 'flood', time: 30.0, label: 'The surge through the streets; you run inland' },
    { id: 'sky', time: 39.0, label: 'The Moon dominates the sky' },
    { id: 'stress', time: 47.0, label: 'Earth itself feels it: tremors, damage' },
    { id: 'limit', time: 55.0, label: 'Approaching the limit; the countdown' },
    { id: 'hill', time: 63.0, label: 'From the hill: city, ocean and Moon' },
    { id: 'impact', time: 74.5, label: 'Impact' },
  ],

  camera: {
    baseY: 0.0,
    x: [[0, 1.0], [4.0, 1.0], [5.6, 1.6], [13, 1.6], [13.01, -3.0, 'step'], [30, -3.0], [32.6, -2.6], [39, -1.0], [39.01, 1.8, 'step'], [47, 2.2], [55, 2.0],
      [55.01, -1.5, 'step'], [63, -1.0], [63.01, 0.5, 'step'], [80, 0.5]],
    z: [[0, 66], [4.0, 65.7], [5.6, 66], [13, 58], [13.01, -18.95, 'step'], [30, -18.95], [32.6, -17.2], [36.2, 4], [39, 16], [39.01, 98, 'step'], [47, 102], [55, 112],
      [55.01, 160, 'step'], [63, 214], [63.01, 336.2, 'step'], [80, 336.8]],
    height: [[0, 1.7], [80, 1.7]],
    // yaw: 0 = looking south over the sea; 180 = inland (north, up the hill)
    yaw: [[0, 3], [4.0, 2], [5.6, 2], [13, 0], [13.01, 4, 'step'], [30, 2], [32.6, 6], [33.4, 170, 'inOutQuad'], [36.2, 178], [37.0, 30, 'inOutQuad'],
      [38.0, 20], [38.6, 175, 'inOutQuad'], [39, 178], [39.01, 2, 'step'], [47, 0], [55, 3], [55.01, 182, 'step'], [61.4, 178], [62.2, 20, 'inOutQuad'], [63, 4],
      [63.01, 0, 'step'], [80, -2]],
    pitch: [[0, 13], [4.0, 12], [5.6, 4], [13, 5], [13.01, -6, 'step'], [16, -16], [20, -6], [21, 12], [26, 24], [30, 14], [32.6, 6], [33.4, -6],
      [36.2, -4], [37.0, 6], [38.6, -4], [39, -2], [39.01, 26, 'step'], [43, 34], [47, 22], [55, 26], [55.01, 2, 'step'], [61.4, 4], [62.2, 18], [63, 18],
      [63.01, 2, 'step'], [70, 4], [74.5, 7], [80, 7]],
    fov: [[0, 74], [4.0, 72], [5.6, 58], [13, 56], [13.01, 64, 'step'], [21, 62], [30, 66], [39, 70], [39.01, 76, 'step'], [47, 78], [55, 74],
      [55.01, 70, 'step'], [63, 72], [63.01, 72, 'step'], [74.5, 78], [80, 78]],
    roll: [[0, 0], [80, 0]],
    startles: [[17.9, 0.3], [32.9, 0.6], [48.2, 0.5], [58.0, 0.4]],
    // shakes: [t, amplitude, decay] — the tremors (the ground's own shaking is added in film.js from MN_QUAKE)
    shakes: [],
  },

  // your hands, sparingly: pointing at it, gripping the railing as the harbour drains, pushing through the water,
  // keeping your balance in the tremor, an arm up against the light at the end
  hands: {
    left: [[0, 'hidden'], [14.2, 'hidden'], [14.8, 'railL'], [20.6, 'railL'], [21.2, 'hidden'], [34.0, 'hidden'], [34.5, 'pushL'], [37.3, 'pushL'], [37.8, 'hidden'],
      [48.0, 'hidden'], [48.4, 'balL'], [50.6, 'balL'], [51.1, 'hidden'], [73.4, 'hidden'], [73.9, 'shieldL'], [80, 'shieldL']],
    right: [[0, 'hidden'], [10.2, 'hidden'], [10.8, 'pointR'], [12.4, 'pointR'], [13.0, 'hidden'], [14.4, 'hidden'], [15.0, 'railR'], [20.4, 'railR'], [21.0, 'hidden'],
      [34.1, 'hidden'], [34.6, 'pushR'], [37.2, 'pushR'], [37.7, 'hidden'], [48.1, 'hidden'], [48.5, 'balR'], [50.5, 'balR'], [51.0, 'hidden'], [73.2, 'hidden'], [73.7, 'shieldR'], [80, 'shieldR']],
  },

  hud: {
    title: { in: 0.05, out: 3.3, fi: 0.15, fo: 0.4, cls: 'big center', html: '<span class="hero">WHAT IF THE MOON<br>CRASHED INTO EARTH?</span>' },
    captions: [
      { t: 8.0, until: 11.6, text: 'At first, you’d barely notice.' },
      { t: 14.6, until: 18.2, text: 'But the oceans would notice first.' },
      { t: 23.0, until: 25.7, text: 'The closer it gets…' },
      { t: 26.0, until: 29.4, text: '…the stronger its tides become.' },
      { t: 40.6, until: 44.2, text: 'And it would keep getting bigger.' },
      { t: 48.4, until: 53.4, text: 'At this distance, even Earth itself would be under enormous tidal stress.' },
    ],
    readouts: [
      { from: 0.2, until: 3.9, top: 220, label: 'DISTANCE TO MOON', value: 'CRITICAL', sub: '' },
      { from: 6.8, until: 12.4, top: 220, label: 'LUNAR DISTANCE', value: (t) => `${mnFmt(mnKm(mnStory(t)))} KM`, sub: '' },
      { from: 12.6, until: 54.6, top: 220, label: 'LUNAR DISTANCE', value: (t) => `${mnFmt(mnKm(mnStory(t)))} KM`, sub: (t) => (t < 21 ? 'DECREASING' : 'DECREASING RAPIDLY') },
      { from: 54.8, until: 74.6, top: 220, label: 'IMPACT IN', value: (t) => `00:${String(mnCount(t)).padStart(2, '0')}`, sub: '' },
    ],
  },

  tracks: { hypoxia: [[0, 0]] },
  people: [],
};

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
