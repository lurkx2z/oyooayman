/* =====================================================================
   SCRIPT — "What happens if you slip and fall?"
   ★ The one file to edit: the beats, the words, the readouts, your head
   (camera), your hands and legs, the sea level and the wave. Everything is
   a pure function of story time (CONFIG.edit cuts it into the film); a 'step' key is a cut.
   Shot plan: films/slip/PLAN.md
   ===================================================================== */

CONFIG.duration = 67.4;
CONFIG.seed = 20261207;
Object.assign(CONFIG.camera, {
  cameraHeight: 1.62,
  walkSpeed: 1.4,
  bobStrength: 0.022,
  bobFrequency: 1.7,
  runStrideGain: 0.55,
  breathingStrength: 0.004,
  breathRate: 15,
  fov: 68,
  shakeStrength: 1.0,
});
CONFIG.render.shadowMapSize = 2048;
// THE CUT (story seconds kept, in order; a third number plays that stretch slower): the walk starts closer, the shoe
// shoots forward at half speed, the sky hold, the descent's grey middle, the pebble's wait, two moments of the quake,
// a stretch of the planet and the sea's slow retreat are taken out — about 57 s of film from 66.6 s of story.
CONFIG.edit = [[1.29, 3.3], [3.3, 3.62, 0.5], [3.62, 4.25], [4.75, 10.4], [11.6, 13.95], [15.2, 18.9], [19.4, 25.9], [26.6, 30.6], [31.2, 36.2], [37.4, 43.0], [46.2, 67.4]];

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (story seconds; CONFIG.edit above cuts them into the ~57 s film)
// ---------------------------------------------------------------------------------------------------------------------
const SL = {
  title: [1.2, 3.75],
  step: 3.3,            // the right shoe lands on the wet plate
  slide: 3.34,          // …and shoots forward
  thud: 3.8,            // you hit the ground
  sitUp: [4.7, 5.9],
  look: 6.3,            // you look down between your hands: the ring in the puddle
  dive: [6.95, 7.4],    // the camera follows the ring into the ground
  under: 7.4,           // the cut-away
  pebble: 11.8,         // macro: the pebble
  nudge: 12.9,          // it moves 1.4 mm
  drop: 16.2,           // it slips into the crack
  fault: 17.4,          // kilometre scale
  slip: 19.8,           // the fault slips 0.2 mm
  rupture: 20.3,        // the rupture runs along the fault
  mag: [20.4, 23.8],    // M2.1 → M8.7
  quake: 24.6,          // the street
  earth: 32.0,          // the planet
  tick: 35.4,           // 1,674.40 → 1,674.41
  shift: 37.6,          // +0.0006 %: the oceans shift
  coast: 39.2,          // the seafront
  drain: [39.6, 42.5],  // the sea draws back
  line: 46.2,           // a white line on the horizon
  turn: 52.4,           // you turn and run
  run: 52.6,
  back1: [55.0, 56.6],  // look back: 146 m
  back2: [58.3, 59.6],  // look back: the lip overhead
  impact: 59.6,
  black: 60.6,
  recap: [60.9, 63.25],  // the chain, line by line
  card: [63.4, 67.4],
  punch: 64.55,
  meta: [65.8, 67.4],
  end: 67.4,
};
// which world each moment shows
function slSeg(t) {
  if (t < SL.under) return 'street';
  if (t < SL.fault) return 'under';
  if (t < SL.quake) return 'fault';
  if (t < SL.earth) return 'street';
  if (t < SL.coast) return 'earth';
  if (t < SL.black) return 'coast';
  return 'black';
}

// monotone cubic through [x, y] keys (Fritsch–Carlson)
function slCurve(K) {
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

// ---------------------------------------------------------------------------------------------------------------------
// THE SEA. Normal level y = SL_SEA0 (the promenade is at +0.15, the beach below the sea wall at −2.6). It draws back by
// 38 m (the readout steps through 0 / −2 / −9 / −21 / −38), then the wave comes in over the drained seabed.
// ---------------------------------------------------------------------------------------------------------------------
const SL_SEA0 = -3.6;
const SL_DRAIN = [[0, 0], [39.6, 0], [40.0, -0.6], [40.3, -2], [41.0, -9], [41.7, -21], [42.2, -33], [42.5, -38], [52, -38], [66.6, -38]];
const slDrain = slCurve(SL_DRAIN);
const SL_SEA_STEPS = [[39.3, '0'], [40.2, '−2'], [40.9, '−9'], [41.6, '−21'], [42.3, '−38']];
// THE WAVE: the front's z (the sea wall is at z = −352), its height (m above the drained sea) and how far its lip has
// curled over (0 = a steep face, 1 = plunging). The readout steps 3 / 7 / 16 / 34 / 78, then 146.
const SL_WAVE = {
  z: [[46.0, -5200], [46.9, -4200], [48.1, -3300], [49.3, -2500], [50.5, -1800], [51.7, -1250], [53.2, -980], [55.0, -700], [56.6, -560],
    [58.3, -440], [59.35, -352], [59.75, -300], [60.6, -260]],
  h: [[46.0, 2.5], [46.9, 3], [48.1, 7], [49.3, 16], [50.5, 34], [51.7, 78], [53.6, 120], [55.0, 146], [60.6, 146]],
  curl: [[46.0, 0], [51.8, 0.2], [55.0, 0.55], [58.3, 0.75], [59.6, 0.95], [60.6, 1]],
};
const slWaveZ = slCurve(SL_WAVE.z), slWaveH = slCurve(SL_WAVE.h), slWaveCurl = slCurve(SL_WAVE.curl);
const SL_WAVE_STEPS = [[46.9, '3'], [48.1, '7'], [49.3, '16'], [50.5, '34'], [51.7, '78'], [54.9, '146']];
// the ring in the puddle beside your right hand (off the steel plate)
const SL_RING = { x: 10.35, z: 1.97 };
const slStep = (S, t) => { let v = S[0][1]; for (const [a, s] of S) if (t >= a) v = s; return v; };

// the magnitude counter: M2.1 → M8.7 (eased; faster at the end)
const slMag = (t) => 2.1 + 6.6 * Math.pow(MathX.clamp((t - SL.mag[0]) / (SL.mag[1] - SL.mag[0]), 0, 1), 1.6);
// the fall's numbers (they are real): ~70 kg landing at ~4 m/s, stopped in a few centimetres → ~1.7 kN peak (on the
// hips and hands); of the ~600 J of the fall, a few millionths of a percent… we say 0.07 J (a generous upper bound) reach the ground as waves
const slFmt = (n, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

const SCRIPT = {
  meta: { title: 'What happens if you slip and fall?', wav: 'slip-soundtrack.wav' },

  events: [
    { id: 'walk', time: 0.0, label: 'Walking in the rain; the title' },
    { id: 'slip', time: SL.step, label: 'The slip' },
    { id: 'thud', time: SL.thud, label: 'The thud; silence' },
    { id: 'normal', time: SL.sitUp[0], label: '“Normally… you’d just get back up.”' },
    { id: 'under', time: SL.under, label: 'Underground: the vibration' },
    { id: 'pebble', time: SL.pebble, label: 'The pebble moves 1.4 mm' },
    { id: 'fault', time: SL.fault, label: 'The fault at 99.999 %' },
    { id: 'rupture', time: SL.rupture, label: 'Rupture: M2.1 → M8.7' },
    { id: 'quake', time: SL.quake, label: 'The earthquake on your street' },
    { id: 'earth', time: SL.earth, label: 'Earth’s rotation: 1,674.40 → 1,674.41 km/h' },
    { id: 'coast', time: SL.coast, label: 'The sea draws back' },
    { id: 'line', time: SL.line, label: 'A distant water mass' },
    { id: 'run', time: SL.run, label: 'Run' },
    { id: 'impact', time: SL.impact, label: 'Impact' },
    { id: 'card', time: SL.card[0], label: 'Cause of global catastrophe' },
  ],

  // your head in the street and at the coast (the underground, the fault and the planet have their own cameras)
  camera: {
    baseY: 0.15,
    x: [[0, 9.6], [3.3, 9.6], [3.8, 9.75], [6.3, 9.75], [6.8, 9.95], [6.95, 10.0], [7.4, 10.33], [24.6, 9.7, 'step'], [32, 9.7],
      [39.2, 1.6, 'step'], [52.4, 1.6], [52.9, 1.2], [56, -0.4], [59.6, -0.8], [66.6, -0.8]],
    z: [[0, 6.2], [3.3, 1.55, 'linear'], [3.8, 2.3], [4.7, 2.3], [5.9, 1.95], [6.3, 2.05], [6.8, 2.25], [6.95, 2.2], [7.4, 1.97],
      [24.6, 1.5, 'step'], [32, 1.5],
      [39.2, -351.2, 'step'], [52.4, -351.2], [52.9, -349.8], [55.0, -336, 'linear'], [56.6, -325, 'linear'], [58.3, -313.5, 'linear'], [59.6, -305, 'linear'], [60.6, -303]],
    height: [[0, 1.62], [3.3, 1.62], [3.45, 1.45, 'inQuad'], [3.8, 0.24, 'inQuad'], [3.86, 0.3], [3.94, 0.26], [4.7, 0.26], [5.9, 0.82], [6.3, 0.82], [6.95, 0.62], [7.4, 0.12],
      [24.6, 0.74, 'step'], [32, 0.74],
      [39.2, 1.64, 'step'], [52.4, 1.64], [52.8, 1.55], [59.6, 1.55], [60.6, 1.2]],
    // yaw: 0 = looking down the avenue toward the sea (−Z); 180 = inland
    yaw: [[0, -1], [2.4, 1], [3.3, 0], [3.8, 4], [4.7, 6], [5.9, -6], [6.3, -24], [6.8, -40], [7.4, -41],
      [24.6, -6, 'step'], [25.8, -10], [26.6, -29, 'inOutQuad'], [28.0, -27], [28.6, 34, 'inOutQuad'], [29.8, 40], [30.4, 8, 'inOutQuad'], [32, 0],
      [39.2, 4, 'step'], [40.2, -16, 'inOutQuad'], [41.6, -20], [42.6, -4, 'inOutQuad'], [43.0, -2], [46.2, 0, 'step'], [52.0, 1], [52.4, 2],
      [53.0, 180, 'inOutQuad'], [55.0, 182], [55.4, 6, 'inOutQuad'], [56.6, 4], [57.0, 178, 'inOutQuad'], [58.2, 180], [58.6, 4, 'inOutQuad'], [60.6, 2]],
    pitch: [[0, -7], [1.8, -9], [2.6, -24], [3.25, -36], [3.3, -36], [3.45, -31], [3.58, -12, 'inQuad'], [3.8, 62, 'inQuad'], [3.86, 64], [4.7, 60], [5.9, -18], [6.3, -24],
      [6.8, -62], [6.95, -64], [7.4, -88],
      [24.6, -30, 'step'], [25.8, -26], [26.6, -10], [28.0, -6], [29.8, -2], [30.4, 30, 'inOutQuad'], [31.4, 38], [32, 70],
      [39.2, -6, 'step'], [40.2, -10], [42.6, -7], [43.0, -6], [46.2, -1, 'step'], [46.6, 0.3], [51.8, 0.8], [52.0, -1], [52.4, -3], [53.0, 2], [55.0, 4], [55.4, 9], [56.6, 10],
      [57.0, 0], [58.2, 0], [58.6, 22], [59.1, 30], [59.6, 46], [60.6, 52]],
    tilt: [[0, 0], [3.3, 0], [3.5, -6], [3.8, 8], [3.9, 5], [4.7, 3], [5.9, 0], [24.6, 0], [32, 0], [39.2, 0], [52.4, 0], [53.0, 6], [55.0, 2], [56.6, -4], [58.3, 3], [59.6, -6], [60.6, -12]],
    fov: [[0, 68], [3.3, 68], [3.8, 74], [4.7, 72], [5.9, 66], [6.3, 66], [7.4, 60],
      [24.6, 74, 'step'], [32, 74],
      [39.2, 62, 'step'], [43.0, 62], [46.2, 60, 'step'], [46.6, 15, 'inOutQuad'], [51.9, 10.5, 'linear'], [52.2, 60, 'inOutQuad'], [52.4, 66], [53.0, 78], [55.0, 78], [55.4, 50, 'inOutQuad'], [56.6, 50],
      [57.0, 78, 'inOutQuad'], [58.2, 80], [59.6, 82], [60.6, 86]],
    startles: [[SL.thud, 1.8], [46.6, 0.25], [51.7, 0.4]],
    // shakes: [t, amplitude, decay] (the quake's own shaking is added in film.js)
    shakes: [[SL.thud, 1.6, 0.35]],
  },

  // your hands (aimed poses are re-aimed every frame in film.js)
  hands: {
    left: [[0, 'hidden'], [3.36, 'hidden'], [3.5, 'flailL'], [3.84, 'flailL'], [4.0, 'hidden'], [4.9, 'hidden'], [5.25, 'groundL'], [6.85, 'groundL'], [6.95, 'hidden'],
      [24.6, 'groundL'], [30.3, 'groundL'], [30.7, 'hidden'],
      [39.2, 'railL'], [52.3, 'railL'], [52.6, 'runL'], [55.0, 'runL'], [55.3, 'hidden'], [56.6, 'hidden'], [56.9, 'runL'], [58.3, 'runL'], [58.6, 'hidden'], [59.2, 'hidden'], [59.5, 'shieldL']],
    right: [[0, 'hidden'], [3.36, 'hidden'], [3.48, 'flailR'], [3.84, 'flailR'], [4.0, 'hidden'], [4.8, 'hidden'], [5.15, 'groundR'], [6.85, 'groundR'], [6.95, 'hidden'],
      [24.6, 'groundR'], [30.2, 'groundR'], [30.6, 'hidden'],
      [39.2, 'railR'], [46.4, 'railR'], [52.3, 'railR'], [52.6, 'runR'], [55.0, 'runR'], [55.3, 'hidden'], [56.6, 'hidden'], [56.9, 'runR'], [58.3, 'runR'], [58.6, 'hidden'], [59.15, 'hidden'], [59.45, 'shieldR']],
  },

  hud: {
    title: { in: SL.title[0], out: SL.title[1], fi: 0.01, fo: 0.4, cls: 'big center', html: '<span class="hero">WHAT HAPPENS<br>IF YOU SLIP<br>AND FALL?</span>' },
    captions: [
      { t: 4.8, until: 6.3, text: 'Normally… you’d just get back up.' },
      { t: 6.45, until: 7.6, text: 'But not this time.' },
      { t: 8.1, until: 10.4, text: 'A tiny part of the impact becomes vibration.' },
      { t: 12.95, until: 13.95, text: 'Usually, this would mean nothing.' },
      { t: 15.25, until: 16.8, text: 'Unfortunately…' },
      { t: 18.0, until: 20.0, text: 'You fell in exactly the wrong place.' },
      { t: 32.6, until: 35.9, text: 'The earthquake transferred momentum into Earth’s rotation.' },
      { t: 37.45, until: 39.15, text: 'But even a tiny change… can have consequences.' },
    ],
    readouts: [
      { from: 3.2, until: 3.95, top: 230, label: 'SURFACE', value: 'WET STEEL', sub: 'FRICTION μ ≈ 0.1' },
      { from: 3.85, until: 6.2, top: 230, label: 'IMPACT FORCE', value: '≈ 1.7 kN', sub: '' },
      { from: 7.9, until: 10.4, top: 230, label: 'ENERGY TRANSFERRED TO THE GROUND', value: '0.07 J', sub: 'ABOUT ONE RAINDROP’S WORTH' },
      { from: 12.95, until: 17.0, top: 230, label: 'ROCK DISPLACEMENT', value: '1.4 MM', sub: '' },
      { from: 17.8, until: 20.95, top: 230, label: 'FAULT', value: (t) => (t < SL.slip ? 'STRESS 99.999 %' : 'SLIP 0.2 MM'), sub: (t) => (t < SL.slip ? 'LOCKED' : 'IT MOVED') },
      { from: 20.95, until: 24.6, top: 230, label: 'MAGNITUDE', value: (t) => 'M' + slMag(t).toFixed(1), sub: (t) => (t < 23.8 ? 'RUPTURE SPREADING' : '') },
      { from: 24.75, until: 31.9, top: 230, label: 'MAGNITUDE', value: 'M8.7', sub: 'GROUND SHAKING' },
      { from: 25.2, until: 31.0, top: 470, label: 'GROUND ACCELERATION', value: '0.9 G', sub: '' },
      { from: 39.3, until: 43.0, top: 230, label: 'SEA LEVEL', value: (t) => slStep(SL_SEA_STEPS, t) + ' M', sub: (t) => (t < 40.2 ? '' : 'RETREATING') },
      { from: 46.25, until: 59.5, top: 230, label: 'DISTANT WATER MASS DETECTED', value: (t) => (t < 46.9 ? '—' : 'WAVE HEIGHT ' + slStep(SL_WAVE_STEPS, t) + ' M'), sub: '' },
    ],
    // after the black: the chain, line by line, then the card
    stack: [{ t: SL.recap[0], until: SL.recap[1], lines: [[60.9, 'SLIP · 1.7 kN'], [61.18, 'GROUND · 0.07 J'], [61.46, 'PEBBLE · 1.4 MM'], [61.74, 'FAULT · M8.7'], [62.02, 'EARTH · +0.01 KM/H'], [62.3, 'SEA · −38 M'], [62.62, 'WAVE · 146 M']] }],
  },

  tracks: { hypoxia: [[0, 0]], pov: [[0, 1]] },
  people: [],
  vehicles: [],
};

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
