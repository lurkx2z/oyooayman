/* =====================================================================
   SCRIPT — "What if Andromeda collided with the Milky Way overnight?"
   ★ The one file to edit: timings, camera, eye-lines, hands, captions,
   HUD, and how the night maps onto the simulation's billions of years.
   Everything is a pure function of time; a 'step' key is a cut.
   Shot plan and science notes: films/andromeda/PLAN.md
   ===================================================================== */

CONFIG.duration = 80.0;
CONFIG.seed = 20261020;
Object.assign(CONFIG.camera, {
  cameraHeight: 1.7,
  walkSpeed: 1.2,
  bobStrength: 0.01,
  bobFrequency: 1.75,
  breathingStrength: 0.0045,
  breathRate: 14,
  fov: 58,
});
CONFIG.render.shadowMapSize = 2048;

// ---------------------------------------------------------------------------------------------------------------------
// THE NIGHT ↔ THE SIMULATION. One night stands in for ~3.3 billion years of the merger: [story seconds, simulation time]
// (sim units ≈ 0.98 Gyr). Smoothly interpolated (monotone cubic). Andromeda starts 230 kpc away, low in the north-north-west.
// ---------------------------------------------------------------------------------------------------------------------
const AM_TIME = [
  [0, 0.30], [5, 0.42], [12, 0.66], [20, 0.86], [29, 0.975], [39, 1.045], [44, 1.10], [49, 1.155], [55, 1.212],
  [56.6, 1.45], [57.6, 1.95], [59.0, 2.19], [61.0, 2.255], [65.0, 2.33], [69.0, 2.6], [72.0, 2.95], [75.0, 3.3], [80.0, 3.6],
];
const amSimT = (() => {
  // Fritsch–Carlson monotone cubic through AM_TIME
  const X = AM_TIME.map((k) => k[0]), Y = AM_TIME.map((k) => k[1]), n = X.length, d = [], m = new Array(n);
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
})();

// how the sky is drawn over the night (see AmSky): the analytic Milky Way band until our disc is truly torn up, warping as
// Andromeda's tide grows; the Milky Way's own far particles (its far side, bulge, tails) coming in from the first passage;
// star formation flaring at each passage; dust used up after the merger; Andromeda brighter than life at the start
const AM_SKYK = {
  band: [[0, 1], [61, 1], [68, 0]],
  warp: [[0, 0], [14, 0.05], [24, 0.22], [36, 0.55], [48, 0.85], [60, 1.15], [68, 1.3]],
  mwFar: [[0, 0], [34, 0], [46, 1], [80, 1]],
  mwNear: [[0, 0], [62, 0], [70, 0.25]],
  m31Near: [[0, 1], [36, 1], [41, 0.2], [80, 0.2]],
  armsMW: [[0, 1], [80, 1]],
  armsM31: [[0, 1], [40, 1], [52, 0.35], [80, 0.25]],
  gainM31: [[0, 2.8], [12, 1.8], [26, 1.25], [36, 0.8], [42, 0.4], [50, 0.32], [60, 0.32], [66, 0.24], [72, 0.15], [80, 0.12]],
  gainMW: [[0, 1], [40, 0.6], [50, 0.4], [62, 0.3], [70, 0.16], [80, 0.12]],
  sf: [[0, 1], [28, 1.2], [42, 1.8], [50, 1.5], [58, 1.3], [66, 1.8], [72, 2.0], [80, 1.6]],
  dust: [[0, 1], [62, 1], [74, 0.45], [80, 0.35]],
};
const AM_SKY_TRACKS = Object.fromEntries(Object.entries(AM_SKYK).map(([k, v]) => [k, new Track(v, 'inOutSine')]));

// where your eyes lock on: [t0, t1, target, fov|null, {off: [yaw°, pitch°]}] — target 'm31' / 'gc' / 'mid' (between the two
// cores) in the sky, or a world point {p: [x, y, z]} (a person); the head turns to it over ~0.6 s and back
const AM_LOOK = [
  [4.6, 8.4, 'm31', null, { off: [0, -7] }],
  [8.4, 9.9, { p: [-4.2, 1.55, -2.4] }, null],                       // the woman at the railing, pointing
  [9.9, 13.2, 'm31', 52, { off: [0, -4] }],
  [15.4, 20.4, 'm31', 60, { off: [-6, -2] }],
  [20.4, 25.0, 'm31', 62, { off: [4, -6] }],
  [36.5, 39.4, 'gc', 66, { off: [0, 6] }],                           // our own galaxy's centre: the band bending
  [39.4, 49.5, 'm31', 70, { off: [0, -10] }],                        // the core passing overhead and down to the south
  [49.5, 54.2, 'mid', 62, { off: [0, -4] }],                         // the cores pulling apart
  [54.2, 57.2, { sky: [24, 188] }, 62],                              // Andromeda setting below our own core, in the south
  [59.5, 64.2, 'm31', 64, { off: [0, 7] }],                          // …it's coming back: rising behind the hills in the north
  [66.4, 72.4, 'gc', 74, { off: [0, -4] }],                          // the cores swing round each other, closer each time
  [72.4, 80.0, 'gc', 70, { off: [0, -18] }],                         // the new galaxy high in the south, the people below it
];

// HUD helpers: merger progress and the night's clock (accelerated: eight hours to the merger)
const amProgress = (t) => Math.round(100 * MathX.clamp((amSimT(t) - 0.42) / (3.3 - 0.42), 0, 1) ** 0.85);
const amClock = (sec) => { sec = Math.max(0, Math.round(sec)); const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, s = sec % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; };
const amRemaining = (t) => amClock(8 * 3600 * (1 - MathX.clamp((t - 0.0) / 74.0, 0, 1) ** 1.15));

const SCRIPT = {
  meta: { title: 'What if Andromeda collided with the Milky Way overnight?', wav: 'andromeda-soundtrack.wav' },

  events: [
    { id: 'hook', time: 0.0, label: 'Night over the town; Andromeda already big, low in the north-north-west; the title' },
    { id: 'beautiful', time: 5.0, label: 'Time speeds up: it grows; a woman at the railing points' },
    { id: 'scale', time: 12.0, label: 'Spiral arms, dust lanes, the core; the town lights beneath it; phones up' },
    { id: 'science', time: 20.4, label: 'Galaxies are mostly empty space: no stars smashing — gravity takes over' },
    { id: 'gravity', time: 29.0, label: 'Tides: Andromeda stretched, our Milky Way band warping across the sky' },
    { id: 'passage', time: 39.4, label: 'First passage: the core sweeps overhead and down to the south' },
    { id: 'separate', time: 49.5, label: 'The cores separate: Andromeda sets below ours; tails left across the sky' },
    { id: 'return', time: 57.0, label: '…and comes back up from the north' },
    { id: 'merger', time: 65.5, label: 'Second passage and merger: 2 → 1' },
    { id: 'new', time: 72.5, label: 'A new galaxy, high in the south' },
  ],

  camera: {
    baseY: 0.0,
    // you start at the railing, step back a little at the scale reveal, then turn about on the platform
    x: [[0, 0.3], [12, 0.3], [16, 0.1], [57, 0.1], [60, -0.4], [80, -0.4]],
    z: [[0, -2.25], [12, -2.25], [16, -1.6], [40, -1.2], [57, -0.6], [60, -1.4], [72, -1.2], [80, 0.6]],
    height: [[0, 1.7], [80, 1.7]],
    // yaw: + is to the left (west); 0 = north over the town; ±180 = south (the park, the galactic centre)
    yaw: [[0, 10], [4.6, 12], [13.2, 14], [14.6, 6], [15.4, 12], [25.0, 20], [29.0, 30], [33.0, 70], [36.5, 140],
      [39.4, 178], [49.5, 182], [57.2, 188], [59.5, 372, 'inOutQuad'], [64.2, 387], [66.4, 540, 'inOutSine'], [80, 540]],
    pitch: [[0, 6], [4.6, 8], [13.2, 22], [13.9, -8], [14.8, -6], [15.4, 30], [25.0, 50], [29.0, 70], [33.0, 76], [36.5, 52],
      [39.4, 60], [49.5, 28], [57.2, 20], [58.4, 8], [59.5, 6], [64.2, 64], [65.3, 78], [66.4, 48], [72.4, 46], [80, 32]],
    fov: [[0, 58], [4.6, 56], [13.2, 52], [13.9, 58], [15.4, 60], [25.0, 62], [29.0, 72], [36.5, 72], [39.4, 70], [57.2, 62], [59.5, 64], [64.2, 64], [66.4, 74], [72.4, 74], [80, 68]],
    roll: [[0, 0], [80, 0]],
    startles: [[42.6, 0.25], [57.3, 0.35]],
    shakes: [],
  },

  // your hands: on the railing; pointing; your phone up to film it; a hand up against the glare of the core; open at the end
  hands: {
    left: [[0, 'railL'], [15.6, 'railL'], [16.2, 'phoneL'], [20.0, 'phoneL'], [20.6, 'railL'], [27.5, 'railL'], [28.4, 'hidden'], [74.6, 'hidden'], [75.4, 'aweL'], [79.6, 'aweL']],
    right: [[0, 'railR'], [10.2, 'railR'], [10.8, 'pointR'], [12.6, 'pointR'], [13.3, 'railR'], [27.5, 'railR'], [28.4, 'hidden'], [42.0, 'hidden'], [42.6, 'shieldR'], [45.6, 'shieldR'], [46.4, 'hidden'],
      [74.8, 'hidden'], [75.6, 'aweR'], [79.6, 'aweR']],
  },

  hud: {
    title: { in: 0.1, out: 3.8, fi: 0.25, fo: 0.45, cls: 'big center', html: '<span class="kick">WHAT IF ANDROMEDA</span><span class="hero">COLLIDED WITH THE MILKY WAY</span><span class="kick">OVERNIGHT?</span>' },
    captions: [
      { t: 6.0, until: 9.6, text: 'At first, it would be beautiful.' },
      { t: 20.6, until: 23.9, text: 'But galaxies don’t collide like solid objects.' },
      { t: 24.2, until: 27.9, text: 'The stars are separated by enormous distances.' },
      { t: 30.4, until: 34.6, text: 'Gravity would tear both galaxies out of shape.' },
      { t: 40.4, until: 44.6, text: 'They would pass through each other…' },
      { t: 52.4, until: 56.2, text: 'But it wouldn’t end there.' },
      { t: 58.2, until: 62.2, text: 'Gravity would pull them together again.' },
      { t: 73.4, until: 75.7, text: 'Neither galaxy would survive unchanged.' },
      { t: 75.9, until: 78.0, text: 'A new galaxy would take their place.' },
    ],
    readouts: [
      { from: 0.0, until: 5.4, top: 220, label: 'MERGER BEGINS IN', value: (t) => amRemaining(t), sub: '' },
      { from: 5.6, until: 49.2, top: 220, label: 'MERGER PROGRESS', value: (t) => `${amProgress(t)}%`, sub: (t) => `TIME REMAINING ${amRemaining(t)}`, ctx: 'ACCELERATED VISUALIZATION' },
      { from: 49.4, until: 57.0, top: 220, label: 'GALACTIC CORES', value: 'SEPARATING', sub: (t) => `MERGER PROGRESS ${amProgress(t)}%`, ctx: 'ACCELERATED VISUALIZATION' },
      { from: 57.2, until: 65.3, top: 220, label: 'MERGER PROGRESS', value: (t) => `${amProgress(t)}%`, sub: (t) => `TIME REMAINING ${amRemaining(t)}`, ctx: 'ACCELERATED VISUALIZATION' },
      { from: 65.5, until: 73.2, top: 220, label: 'GALAXIES', value: '2 → 1', sub: (t) => `MERGER PROGRESS ${amProgress(t)}%` },
      { from: 73.4, until: 79.6, top: 220, label: 'GALAXIES', value: '1', sub: '' },
    ],
  },

  tracks: { hypoxia: [[0, 0]] },
  people: [],
};

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
