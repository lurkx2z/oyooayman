/* =====================================================================
   SCRIPT — "WHAT IF WATER LOST ALL SURFACE TENSION?"
   ★ The one file to edit for timing: the beats, the words, the readouts, your head (camera), your hands.
   Everything is a pure function of STORY time. A 'step' key on a track is a hard cut. Plan: films/no-surface-tension/PLAN.md
   Structure (docs/VIDEO_FORMAT.md): centred title over a normal kitchen → the rule changes under the title →
   drops → a paperclip → capillary tubes (towel, sponge) → insects → soil and wicks → plants (days) → rain → payoff.
   ===================================================================== */

CONFIG.duration = 68.6;
CONFIG.seed = 20271107;
Object.assign(CONFIG.camera, {
  cameraHeight: 1.66, walkSpeed: 1.0, bobStrength: 0.010, bobFrequency: 1.72,
  breathingStrength: 0.0035, breathRate: 14, fov: 40, shakeStrength: 0.6,
});
CONFIG.render.shadowMapSize = 2048;

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (story seconds). Every other file keys off these.
// ---------------------------------------------------------------------------------------------------------------------
const NST = {
  title: [-0.6, 3.9],
  drop: 1.75, zero: 2.15,          // surface tension falls 72 → 0 mN/m between these
  tap: 4.4, tapOn: 5.15,           // the tap: you turn it on; the stream can't make drops
  clip: 9.6, clipLet: 10.95,       // the paperclip: lowered onto the water, let go, sinks
  towel: 14.6, towelIn: 15.55,     // a paper towel strip dipped in the bowl: nothing climbs
  sponge: 18.3, spongeUp: 18.85,   // the soaked sponge lifted out of the sink: it can't hold the water
  pond: 22.2, strider: 23.85,      // outside, at the pond: a water strider steps off a lily pad and falls through
  bench: 29.0, pour: 29.75, pourEnd: 33.3,   // watering a pot: it runs straight out of the bottom
  wick: 33.7,                      // the self-watering wick: dry
  lapse: 37.4, lapse0: 38.2, lapse1: 47.4,  // days pass: the plants wilt
  clouds: 48.2, rain: 49.4,        // rain: torn spray, not drops
  umb: 52.6,                       // look up: the umbrella soaks through
  drone: 57.0,                     // the payoff: up over the garden, the park, the city in the storm
  line1: 60.6, line2: 63.4, note: 66.6, end: 68.6,
};

// surface tension of water (mN/m) — the one track the HUD, the water, the grade and the sound all read
function nstSigma(t) { return 72 * (1 - MathX.smooth(t, NST.drop, NST.zero)); }
function nstGone(t) { return MathX.smooth(t, NST.drop, NST.zero); }
// time-lapse: story time → garden days (1.0 = the morning of the change)
function nstDay(t) {
  if (t < NST.lapse0) return 1.0 + Math.max(0, t - NST.lapse) * 0.002;
  if (t < NST.lapse1) { const k = (t - NST.lapse0) / (NST.lapse1 - NST.lapse0); return 1.0 + 2.25 * Ease.inOutSine(k); }
  return 3.25 + (t - NST.lapse1) * 0.0015;
}
// how wilted the garden is (0 fresh → 1 badly wilted): starts on day 1.3
function nstWilt(t) { return MathX.clamp((nstDay(t) - 1.3) / 1.9, 0, 1); }
// rain amount 0..1
function nstRain(t) { return MathX.smooth(t, NST.rain - 0.4, NST.rain + 1.6); }
// the storm darkness 0..1
function nstStorm(t) { return MathX.smooth(t, NST.clouds, NST.rain + 1.2); }

const SCRIPT = {
  meta: { title: 'WHAT IF WATER LOST ALL SURFACE TENSION?', wav: 'no-surface-tension-soundtrack.wav' },

  events: [
    { id: 'start', time: 0.0, label: 'Kitchen counter; the title' },
    { id: 'drop', time: NST.drop, label: 'Surface tension → 0: the beads slump, the glass spills' },
    { id: 'tap', time: NST.tap, label: 'The tap: no drops' },
    { id: 'clip', time: NST.clip, label: 'The paperclip sinks' },
    { id: 'towel', time: NST.towel, label: 'Paper towel: nothing climbs' },
    { id: 'sponge', time: NST.sponge, label: 'The sponge can’t hold water' },
    { id: 'pond', time: NST.pond, label: 'Pond: the water strider falls through' },
    { id: 'bench', time: NST.bench, label: 'The pot: water runs straight through' },
    { id: 'wick', time: NST.wick, label: 'The wick stays dry' },
    { id: 'lapse', time: NST.lapse, label: 'Days pass: the plants wilt' },
    { id: 'rain', time: NST.rain, label: 'Rain: torn spray' },
    { id: 'umb', time: NST.umb, label: 'The umbrella soaks through' },
    { id: 'drone', time: NST.drone, label: 'Payoff: the storm over the wilted park' },
    { id: 'line', time: NST.line1, label: 'The closing line' },
  ],

  // your head. Kitchen: the back wall (window over the sink) is at z = 0.2, you face −Z toward it.
  // Garden: outside the same wall (z < 0). Pond around (−1.2, −7); potting bench against the wall at x 1.7–3.3.
  camera: {
    baseY: 0,
    x: [[0, -0.6], [4.4, -0.59], [4.4, 0.84, 'step'], [9.6, 0.79], [9.6, -0.2, 'step'], [14.5, -0.2], [15.0, -0.2], [18.1, -0.2], [18.7, 0.05, 'inOutSine'], [22.2, 0.05],
      [22.2, -0.6, 'step'], [29.0, -0.59],
      [29.0, 2.3, 'step'], [33.7, 2.31], [33.7, 2.7, 'step'], [37.4, 2.71],
      [37.4, -2.2, 'step'], [57.0, -2.2]],
    z: [[0, 0.98], [4.4, 0.95, 'linear'], [4.4, 0.505, 'step'], [9.6, 0.505], [9.6, 1.05, 'step'], [14.5, 1.05], [15.0, 1.05], [18.1, 1.05], [18.7, 0.95], [22.2, 0.95],
      [22.2, -5.2, 'step'], [29.0, -5.22],
      [29.0, -1.62, 'step'], [33.7, -1.6], [33.7, -0.85, 'step'], [37.4, -0.87],
      [37.4, -0.7, 'step'], [57.0, -0.74]],
    height: [[0, 1.18], [4.4, 1.16], [4.4, 1.03, 'step'], [9.6, 1.02], [9.6, 1.12, 'step'], [14.5, 1.12], [15.0, 1.14], [18.1, 1.14], [18.7, 1.2], [22.2, 1.2],
      [22.2, 0.6, 'step'], [29.0, 0.56],
      [29.0, 1.56, 'step'], [33.7, 1.56], [33.7, 1.01, 'step'], [37.4, 1.02],
      [37.4, 1.62, 'step'], [57.0, 1.62]],
    yaw: [[0, 0], [4.4, 0], [4.4, 90, 'step'], [9.6, 91], [9.6, 0, 'step'], [14.5, 0], [15.0, 0], [18.1, 0], [18.7, -27, 'inOutCubic'], [22.2, -26],
      [22.2, 2, 'step'], [23.7, 1], [24.5, 0, 'inOutSine'], [29.0, -1],
      [29.0, 186, 'step'], [33.7, 187], [33.7, 200, 'step'], [37.4, 199],
      [37.4, 6, 'step'], [44.0, 2], [48.0, 6], [50.6, 10], [52.6, 6], [53.4, 4], [57.0, 2]],
    pitch: [[0, -31], [4.4, -34], [4.4, 4, 'step'], [9.6, 2], [9.6, -14, 'step'], [14.5, -17], [15.0, -8, 'inOutCubic'], [18.1, -9], [18.7, -26, 'inOutCubic'], [20.0, -16, 'inOutSine'], [22.2, -17],
      [22.2, -64, 'step'], [23.7, -65], [24.6, -68, 'inOutSine'], [29.0, -70],
      [29.0, -27, 'step'], [33.7, -28], [33.7, -6, 'step'], [37.4, -7],
      [37.4, -8, 'step'], [48.0, -6], [50.0, -2], [52.6, -3], [53.5, 62, 'inOutCubic'], [56.2, 64], [57.0, 60]],
    fov: [[0, 32], [4.4, 30], [4.4, 52, 'step'], [9.6, 50], [9.6, 38, 'step'], [14.5, 36], [15.0, 38], [18.1, 38], [18.7, 46], [22.2, 46],
      [22.2, 32, 'step'], [29.0, 27],
      [29.0, 54, 'step'], [33.7, 54], [33.7, 37, 'step'], [37.4, 35],
      [37.4, 64, 'step'], [57.0, 66]],
    tilt: [[0, 0], [57.0, 0]],
    startles: [[NST.drop + 0.15, 0.35], [NST.strider + 0.4, 0.25]],
    shakes: [],
  },

  // your hands (camera-space poses in film.js; 'name!' = snap on a cut). Aimed poses are re-solved every frame.
  hands: {
    right: [[0, 'hidden'], [NST.tap + 0.1, 'tapReach'], [NST.tapOn + 0.45, 'tapTurn'], [NST.tapOn + 1.2, 'hidden'],
      [NST.clip, 'clipHold'], [NST.clipLet, 'clipOpen'], [NST.clipLet + 0.95, 'hidden!'],
      [NST.towel - 0.2, 'towelHold'], [NST.towel + 2.6, 'towelHold'], [NST.sponge - 0.2, 'hidden'],
      [NST.sponge + 0.05, 'spongeGrab'], [NST.spongeUp + 2.8, 'spongeGrab'], [21.6, 'hidden'],
      [NST.bench, 'canHold!'], [NST.pourEnd + 0.3, 'canHold'], [NST.wick, 'hidden!'],
      [NST.lapse, 'hidden!'], [NST.umb - 0.6, 'hidden'], [NST.umb + 0.3, 'umbHold'], [NST.drone, 'hidden!']],
    left: [[0, 'hidden'], [NST.drone, 'hidden!']],
  },

  tracks: {
    pov: [[0, 1], [NST.drone, 1], [NST.drone + 0.001, 0], [NST.end, 0]],
  },

  hud: {
    title: { in: NST.title[0], out: NST.title[1], fi: 0.2, fo: 0.45, cls: 'big center',
      html: '<span class="kick">WHAT IF WATER LOST ALL</span><span class="hero">SURFACE TENSION?</span>' },
    captions: [
      { t: 5.9, until: 9.2, text: 'Water would stop forming drops.' },
      { t: 11.9, until: 14.4, text: 'A paperclip used to float on it.' },
      { t: 16.3, until: 18.4, text: 'Tiny tubes depend on it too.' },
      { t: 19.3, until: 21.9, text: 'A sponge can’t hold water anymore.' },
      { t: 24.7, until: 28.6, text: 'Insects that walk on water fall through.' },
      { t: 30.9, until: 33.8, text: 'Soil can’t hold water either.' },
      { t: 34.7, until: 37.2, text: 'Wicks stop lifting it.' },
      { t: 38.7, until: 42.2, text: 'Plants lift water through tiny tubes.' },
      { t: 42.9, until: 46.9, text: 'Without surface tension, that pull breaks.' },
      { t: 50.3, until: 52.9, text: 'Rain can’t hold itself together.' },
      { t: 54.0, until: 56.8, text: 'And fabric can’t keep it out.' },
      { t: NST.line1, until: NST.line2 - 0.25, text: 'It looks like a tiny force…' },
      { t: NST.line2, until: NST.note - 0.1, text: '…until an entire ecosystem depends on it.' },
    ],
    readouts: [
      { from: -0.6, until: 21.9, top: 220, label: 'SURFACE TENSION', value: (t) => `${Math.round(nstSigma(t))} mN/m`, sub: (t) => (t < NST.drop ? 'LIQUID WATER · 20 °C' : 'WATER ONLY · EVERYTHING ELSE NORMAL') },
      { from: 22.6, until: 28.8, top: 220, label: 'SURFACE TENSION', value: () => '0 mN/m', sub: 'NOTHING HOLDS THE SURFACE TOGETHER' },
      { from: 30.2, until: 37.2, top: 220, label: 'CAPILLARY RISE', value: () => '0 mm', sub: (t) => (t < NST.wick ? 'SOIL HOLDS WATER IN TINY PORES' : 'THE WICK CAN’T LIFT IT') },
      { from: 37.9, until: 48.6, top: 220, label: 'TIME SINCE THE CHANGE', value: (t) => nstDayText(t), sub: (t) => `PLANTS WILTING · ${Math.round(nstWilt(t) * 100)} %` },
      { from: 59.2, until: 66.4, top: 220, label: 'SURFACE TENSION', value: () => '0 mN/m', sub: 'SAME WATER · SAME RAIN · NO SKIN' },
    ],
    notes: [
      { t: NST.note, until: NST.end + 0.2, text: 'FICTIONAL RULE: ONLY WATER’S SURFACE TENSION CHANGED · DAYS ACCELERATED' },
    ],
  },
};

function nstDayText(t) {
  const d = nstDay(t) - 1, h = Math.floor(d * 24);
  if (h < 24) return `${Math.max(1, h)} HOURS`;
  return `DAY ${Math.floor(d) + 1}`;
}

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
