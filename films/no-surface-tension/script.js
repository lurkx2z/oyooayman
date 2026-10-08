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
  drop: 1.2, zero: 1.6,            // surface tension falls 72 → 0 mN/m between these
  tap: 4.4, tapOn: 5.0,            // the tap, barely open: a trickle that can't break into drops
  clip: 9.6, clipLet: 10.95,       // the paperclip: lowered onto the water, let go, sinks
  towel: 14.6, towelIn: 15.55,     // a paper towel strip dipped in the bowl: nothing climbs
  sponge: 18.3, spongeUp: 18.45,   // the soaked sponge lifted out of the sink: it can't hold the water
  pond: 22.2, strider: 24.6,       // outside, at the pond: a water strider steps off a lily pad and falls through
  bench: 29.0, pour: 29.75, pourEnd: 33.3,   // watering a pot: it runs straight out of the bottom
  wick: 33.7,                      // the self-watering wick (cut from the film: CONFIG.edit)
  lapse: 37.4, lapse0: 38.0, lapse1: 44.6,  // days pass: the plants wilt
  clouds: 48.2, rain: 49.4,        // rain: torn spray, not drops
  umb: 52.6,                       // look up: the umbrella soaks through
  drone: 57.0,                     // the payoff: up over the garden, the park, the city in the storm
  line1: 60.6, line2: 63.4, note: 66.6, end: 68.6,
  flashes: [[58.3, 1.0], [61.75, 0.75], [64.2, 0.95]],   // lightning in the payoff [time, strength] (sky, grade, thunder)
};

// the cut (story intervals kept): the pond's tail, the wick pot, the end of the time-lapse → ≈ 61 s
CONFIG.edit = [[0, 27.8], [29.0, 33.7], [37.4, 45.2], [47.9, 68.6]];

// surface tension of water (mN/m) — the one track the HUD, the water, the grade and the sound all read
function nstSigma(t) { return 72 * (1 - MathX.smooth(t, NST.drop, NST.zero)); }
function nstGone(t) { return MathX.smooth(t, NST.drop, NST.zero); }
// time-lapse: story time → garden days (1.0 = the morning of the change)
function nstDay(t) {
  if (t < NST.lapse0) return 1.0 + Math.max(0, t - NST.lapse) * 0.002;
  if (t < NST.lapse1) { const k = (t - NST.lapse0) / (NST.lapse1 - NST.lapse0); return 1.0 + 2.25 * Ease.inOutSine(k); }
  return 3.25 + (t - NST.lapse1) * 0.0015;
}
// how wilted the garden is (0 fresh → 1 badly wilted): soft plants start within hours, by day 3 it is straw
function nstWilt(t) { return Math.pow(MathX.clamp((nstDay(t) - 1.02) / 2.1, 0, 1), 0.75); }
// lightning: each flash flickers and holds for ~5 frames
function nstFlash(t) {
  let f = 0;
  for (const [t0, v] of NST.flashes) {
    const u = t - t0; if (u < -0.02 || u > 0.5) continue;
    const env = MathX.smooth(u, -0.02, 0.0) * (1 - MathX.smooth(u, 0.12, 0.42));
    const flick = u < 0.06 ? 1 : u < 0.1 ? 0.45 : u < 0.17 ? 0.9 : 0.6;
    f = Math.max(f, v * env * flick);
  }
  return f;
}
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
    x: [[0, -0.54], [4.4, -0.54], [4.4, 0.68, 'step'], [9.6, 0.67], [9.6, -0.19, 'step'], [14.6, -0.19], [14.6, -0.2, 'step'], [18.3, -0.2], [18.3, 0.2, 'step'], [22.2, 0.2],
      [22.2, -0.62, 'step'], [29.0, -0.62],
      [29.0, 2.3, 'step'], [33.7, 2.31], [33.7, 2.7, 'step'], [37.4, 2.71],
      [37.4, -2.2, 'step'], [57.0, -2.2]],
    z: [[0, 1.07], [4.4, 1.01, 'linear'], [4.4, 0.68, 'step'], [9.6, 0.68], [9.6, 0.98, 'step'], [14.6, 0.96], [14.6, 1.05, 'step'], [18.3, 1.05], [18.3, 1.05, 'step'], [22.2, 1.03],
      [22.2, -5.14, 'step'], [29.0, -5.14],
      [29.0, -1.62, 'step'], [33.7, -1.6], [33.7, -0.85, 'step'], [37.4, -0.87],
      [37.4, -0.7, 'step'], [57.0, -0.74]],
    height: [[0, 1.25], [4.4, 1.22], [4.4, 1.1, 'step'], [9.6, 1.1], [9.6, 1.13, 'step'], [14.6, 1.13], [14.6, 1.12, 'step'], [15.0, 1.14], [18.3, 1.14], [18.3, 1.42, 'step'], [22.2, 1.41],
      [22.2, 0.6, 'step'], [29.0, 0.56],
      [29.0, 1.56, 'step'], [33.7, 1.56], [33.7, 1.01, 'step'], [37.4, 1.02],
      [37.4, 1.62, 'step'], [57.0, 1.62]],
    yaw: [[0, 0], [4.4, 0], [4.4, 63, 'step'], [9.6, 64], [9.6, 0, 'step'], [14.6, 0], [18.3, 0], [18.3, -4, 'step'], [22.2, -5],
      [22.2, 2, 'step'], [23.7, 1], [24.5, 0, 'inOutSine'], [29.0, -1],
      [29.0, 186, 'step'], [33.7, 187], [33.7, 200, 'step'], [37.4, 199],
      [37.4, 6, 'step'], [44.0, 3], [45.2, 3], [47.9, 3], [50.6, 10], [52.6, 6], [53.4, 4], [57.0, 2]],
    pitch: [[0, -20], [4.4, -20.5], [4.4, 5, 'step'], [9.6, 4], [9.6, -19, 'step'], [10.9, -21], [11.6, -25, 'inOutSine'], [14.6, -26], [14.6, -12, 'step'], [18.3, -12.5], [18.3, -46, 'step'], [18.5, -46], [19.6, -38, 'inOutSine'], [22.2, -37],
      [22.2, -65, 'step'], [24.4, -66], [29.0, -66.5],
      [29.0, -27, 'step'], [33.7, -28], [33.7, -6, 'step'], [37.4, -7],
      [37.4, -8, 'step'], [45.2, -7], [47.9, -6], [50.0, -2], [52.6, -3], [53.5, 62, 'inOutCubic'], [56.2, 64], [57.0, 60]],
    fov: [[0, 36], [4.4, 35], [4.4, 46, 'step'], [9.6, 44], [9.6, 30, 'step'], [14.6, 29], [14.6, 38, 'step'], [18.3, 38], [18.3, 38, 'step'], [22.2, 37],
      [22.2, 24, 'step'], [24.4, 17, 'inOutSine'], [29.0, 16],
      [29.0, 54, 'step'], [33.7, 54], [33.7, 37, 'step'], [37.4, 35],
      [37.4, 64, 'step'], [57.0, 66]],
    tilt: [[0, 0], [57.0, 0]],
    startles: [[NST.drop + 0.15, 0.35], [NST.strider + 0.4, 0.25]],
    shakes: [],
  },

  // your hands (camera-space poses in film.js; 'name!' = snap on a cut). Aimed poses are re-solved every frame.
  hands: {
    right: [[0, 'hidden'], [NST.tap + 0.1, 'tapReach'], [NST.tapOn + 0.45, 'tapTurn'], [NST.tapOn + 1.2, 'hidden'],
      [NST.clip, 'clipHold!'], [NST.clipLet, 'clipOpen'], [NST.clipLet + 0.95, 'hidden!'],
      [NST.towel - 0.2, 'towelHold'], [NST.towel + 2.6, 'towelHold'], [NST.sponge, 'spongeGrab!'], [NST.pond, 'hidden!'],
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
      { t: 5.6, until: 9.3, text: 'Water would stop forming drops.' },
      { t: 11.6, until: 14.4, text: 'A paperclip used to float on it.' },
      { t: 16.2, until: 18.25, text: 'Tiny tubes depend on it too.' },
      { t: 19.2, until: 21.95, text: 'A sponge can’t hold water anymore.' },
      { t: 22.9, until: 27.75, text: 'Insects that walk on water fall through.' },
      { t: 30.6, until: 33.65, text: 'Soil can’t hold water either.' },
      { t: 38.4, until: 41.3, text: 'Leaves pull water up from the roots.' },
      { t: 41.6, until: 45.15, text: 'Without surface tension, that pull breaks.' },
      { t: 50.0, until: 52.9, text: 'Rain can’t hold itself together.' },
      { t: 53.9, until: 56.8, text: 'And fabric can’t keep it out.' },
      { t: NST.line1, until: NST.line2 - 0.25, text: 'It looks like a tiny force…' },
      { t: NST.line2, until: NST.note - 0.1, text: '…until an entire ecosystem depends on it.' },
    ],
    readouts: [
      { from: -0.6, until: 21.95, top: 220, label: 'SURFACE TENSION', value: (t) => `${Math.round(nstSigma(t))} mN/m`, sub: (t) => (t < NST.drop ? 'LIQUID WATER · 20 °C' : 'WATER ONLY · EVERYTHING ELSE NORMAL') },
      { from: 22.5, until: 27.75, top: 220, label: 'SURFACE TENSION', value: () => '0 mN/m', sub: 'THE SURFACE CAN’T CARRY ANY WEIGHT' },
      { from: 29.9, until: 33.65, top: 220, label: 'CAPILLARY RISE', value: () => '0 mm', sub: 'TINY PORES CAN’T HOLD WATER NOW' },
      { from: 37.9, until: 48.6, top: 220, label: 'TIME SINCE THE CHANGE', value: (t) => nstDayText(t), sub: (t) => `PLANTS WILTING · ${Math.round(nstWilt(t) * 100)} %` },
      { from: 59.2, until: 66.4, top: 220, label: 'SURFACE TENSION', value: () => '0 mN/m', sub: 'SAME WATER · SAME AMOUNT · NO DROPS' },
    ],
    notes: [
      { t: NST.note, until: NST.end + 0.2, text: 'FICTIONAL RULE: ONLY WATER’S SURFACE TENSION CHANGED · TIME COMPRESSED' },
    ],
  },
};

function nstDayText(t) {
  const d = nstDay(t) - 1, h = Math.max(1, Math.floor(d * 24));
  if (h < 24) return h === 1 ? '1 HOUR' : `${h} HOURS`;
  return `DAY ${Math.floor(d) + 1}`;
}

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
