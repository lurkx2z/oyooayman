/* =====================================================================
   SCRIPT — "WHAT IF WATER LOST ALL SURFACE TENSION?"
   ★ The one file to edit for timing: the beats, the words, the readouts, your head (camera), your hands.
   Everything is a pure function of STORY time. A 'step' key on a track is a hard cut. Plan: films/no-surface-tension/PLAN.md
   Structure (docs/VIDEO_FORMAT.md): centred title over a normal kitchen → the rule changes under the title →
   no drops (tap) → nothing floats (paperclip) → a bottle of sparkling water erupts → insects fall through → soil can't
   hold water → plants (days) → rain with no splashes, a waterlogged duck (waterline view) → payoff: a dive from the sky
   down to one wilted leaf where no drop can form.
   ===================================================================== */

CONFIG.duration = 69.6;
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
  tap: 4.4, tapOn: 4.45,            // the tap, barely open: a trickle that can't break into drops
  tapMore: 6.9,                    // … opened further: the stream widens into a twisting, fraying veil
  clip: 9.6, clipLet: 10.95,       // the paperclip: lowered onto the water, let go, sinks
  soda: 14.6, sodaOpen: 15.75,     // a sealed bottle of sparkling water: the cap is twisted … and it erupts
  pond: 22.2, strider: 23.8,       // outside, at the pond: a water strider steps off a lily pad and falls through
  bench: 29.0, pour: 29.75, pourEnd: 33.3,   // watering a pot: it runs straight out of the bottom
  wick: 33.7,                      // (the self-watering wick: built, cut from the film by CONFIG.edit)
  lapse: 37.4, lapse0: 38.0, lapse1: 44.6,  // days pass: the plants wilt
  clouds: 45.6, rain: 46.4,        // (off screen, in the cut) the clouds come; it rains: torn shreds and mist, no drops
  duck: 48.3,                      // the pond at the waterline: no splashes, no rings; a waterlogged duck rides low
  dive: 55.8, land: 61.0,          // the payoff: down from the sky over the dying garden to one wilted sunflower leaf
  line1: 61.6, line2: 64.4, note: 67.6, end: 69.6,
  flashes: [],                     // (no lightning: the rain is a quiet grey roar)
};

// the cut (story intervals kept) → ≈ 60 s
CONFIG.edit = [[0, 14.4], [14.6, 21.4], [22.2, 27.8], [29.0, 33.7], [37.45, 44.95], [48.3, 69.6]];

// surface tension of water (mN/m) — the one track the HUD, the water, the grade and the sound all read
function nstSigma(t) { return 72 * (1 - MathX.smooth(t, NST.drop, NST.zero)); }
function nstGone(t) { return MathX.smooth(t, NST.drop, NST.zero); }
// time-lapse: story time → garden days (1.0 = the morning of the change)
function nstDay(t) {
  if (t < NST.lapse0) return 1.0 + Math.max(0, t - NST.lapse) * 0.002;
  if (t < NST.lapse1) { const k = (t - NST.lapse0) / (NST.lapse1 - NST.lapse0); return 1.0 + 2.25 * (0.45 * Ease.inOutSine(k) + 0.55 * (1 - (1 - k) * (1 - k))); }
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
    { id: 'soda', time: NST.soda, label: 'Sparkling water: it erupts the moment it is opened' },
    { id: 'pond', time: NST.pond, label: 'Pond: the water strider falls through' },
    { id: 'bench', time: NST.bench, label: 'The pot: water runs straight through' },
    { id: 'lapse', time: NST.lapse, label: 'Days pass: the plants wilt' },
    { id: 'duck', time: NST.duck, label: 'Rain at the waterline: no splashes; the duck rides low' },
    { id: 'dive', time: NST.dive, label: 'Payoff: down to one leaf in the rain' },
    { id: 'line', time: NST.line1, label: 'The closing line' },
  ],

  // your head. Kitchen: the back wall (window over the sink) is at z = 0.2, you face −Z toward it.
  // Garden: outside the same wall (z < 0). Pond around (−1.2, −7); potting bench against the wall at x 1.7–3.3.
  camera: {
    baseY: 0,
    x: [[0, -0.54], [4.4, -0.54], [4.4, 0.68, 'step'], [9.6, 0.67], [9.6, -0.175, 'step'], [14.6, -0.175],
      [14.6, -0.4, 'step'], [21.4, -0.4],
      [22.2, -0.62, 'step'], [29.0, -0.62],
      [29.0, 2.3, 'step'], [33.7, 2.31], [33.7, 2.7, 'step'], [37.4, 2.71],
      [37.4, -2.2, 'step'], [48.3, -2.2],
      [48.3, -0.88, 'step'], [55.8, -0.93]],
    z: [[0, 1.07], [4.4, 1.01, 'linear'], [4.4, 0.68, 'step'], [9.6, 0.68], [9.6, 0.98, 'step'], [14.6, 0.96],
      [14.6, 1.09, 'step'], [15.7, 1.075], [16.25, 1.24, 'outCubic'], [17.4, 1.21], [18.6, 1.15], [21.4, 1.0],
      [22.2, -5.14, 'step'], [29.0, -5.14],
      [29.0, -1.62, 'step'], [33.7, -1.6], [33.7, -0.85, 'step'], [37.4, -0.87],
      [37.4, -0.7, 'step'], [48.3, -0.72],
      [48.3, -5.36, 'step'], [55.8, -5.42]],
    height: [[0, 1.25], [4.4, 1.22], [4.4, 1.1, 'step'], [9.6, 1.1], [9.6, 1.13, 'step'], [14.6, 1.13],
      [14.6, 1.2, 'step'], [15.7, 1.2], [16.25, 1.26, 'outCubic'], [17.4, 1.24], [21.4, 1.17],
      [22.2, 0.6, 'step'], [29.0, 0.56],
      [29.0, 1.56, 'step'], [33.7, 1.56], [33.7, 1.01, 'step'], [37.4, 1.02],
      [37.4, 1.62, 'step'], [48.3, 1.62],
      [48.3, -0.0556, 'step'], [55.8, -0.0556]],      // exactly at the pond's surface (y −0.055): half in, half out
    yaw: [[0, 0], [4.4, 0], [4.4, 63, 'step'], [9.6, 64], [9.6, 0, 'step'], [14.6, 0],
      [14.6, 0, 'step'], [21.4, 0],
      [22.2, 2, 'step'], [23.7, 1], [24.5, 0, 'inOutSine'], [29.0, -1],
      [29.0, 186, 'step'], [33.7, 187], [33.7, 200, 'step'], [37.4, 199],
      [37.4, 14, 'step'], [44.0, 11], [48.3, 11],
      [48.3, 3, 'step'], [55.8, 8]],
    pitch: [[0, -20], [4.4, -20.5], [4.4, 5, 'step'], [6.9, 4], [9.6, -1], [9.6, -19, 'step'], [10.9, -21], [11.6, -25, 'inOutSine'], [14.6, -26],
      [14.6, -18, 'step'], [15.7, -18.5], [16.25, 4, 'outCubic'], [16.9, 4], [17.7, -8], [18.7, -17], [21.4, -19],
      [22.2, -65, 'step'], [24.4, -66], [29.0, -66.5],
      [29.0, -27, 'step'], [33.7, -28], [33.7, -6, 'step'], [37.4, -7],
      [37.4, -8, 'step'], [48.3, -7],
      [48.3, 0, 'step'], [55.8, 0.6]],
    fov: [[0, 36], [4.4, 35], [4.4, 46, 'step'], [9.6, 42], [9.6, 30, 'step'], [14.6, 29],
      [14.6, 42, 'step'], [15.7, 40], [16.25, 54, 'outCubic'], [17.4, 52], [18.7, 45], [21.4, 37],
      [22.2, 24, 'step'], [24.4, 17, 'inOutSine'], [29.0, 16],
      [29.0, 54, 'step'], [33.7, 54], [33.7, 37, 'step'], [37.4, 35],
      [37.4, 64, 'step'], [48.3, 65],
      [48.3, 56, 'step'], [55.8, 52]],
    tilt: [[0, 0], [69.6, 0]],
    startles: [[NST.drop + 0.15, 0.35], [NST.sodaOpen + 0.04, 0.9], [NST.strider + 0.4, 0.25]],
    shakes: [[NST.sodaOpen + 0.05, 0.5, 0.35]],
  },

  // your hands (camera-space poses in film.js; 'name!' = snap on a cut). Aimed poses are re-solved every frame.
  hands: {
    right: [[0, 'hidden'], [NST.tap + 0.1, 'tapReach'], [NST.tapOn + 0.45, 'tapTurn'], [NST.tapMore - 0.3, 'tapTurn'], [NST.tapMore + 0.25, 'tapPush'], [NST.tapMore + 1.0, 'hidden'],
      [NST.clip, 'clipHold!'], [NST.clipLet, 'clipOpen'], [NST.clipLet + 0.95, 'hidden!'],
      [NST.soda, 'capHold!'], [NST.sodaOpen - 0.05, 'capTwist'], [NST.sodaOpen + 0.12, 'capOff'], [NST.sodaOpen + 0.75, 'hidden'],
      [NST.pond, 'hidden!'],
      [NST.bench, 'canHold!'], [NST.pourEnd + 0.3, 'canHold'], [NST.wick, 'hidden!'],
      [NST.lapse, 'hidden!']],
    left: [[0, 'hidden'], [NST.soda, 'bottleHold!'], [NST.sodaOpen + 0.1, 'bottleHold'], [NST.sodaOpen + 0.8, 'hidden'], [NST.pond, 'hidden!']],
  },

  tracks: {
    pov: [[0, 1], [NST.duck, 1], [NST.duck + 0.001, 0], [NST.end, 0]],      // (no body motion from the waterline on: a camera held at the surface)
  },

  hud: {
    title: { in: NST.title[0], out: NST.title[1], fi: 0.2, fo: 0.45, cls: 'big center',
      html: '<span class="kick">WHAT IF WATER LOST ALL</span><span class="hero">SURFACE TENSION?</span>' },
    captions: [
      { t: 5.6, until: 9.3, text: 'Water would stop forming drops.' },
      { t: 11.6, until: 14.3, text: 'A paperclip used to float on it.' },
      { t: 15.95, until: 18.45, text: 'Every fizzy drink would erupt when opened.' },
      { t: 18.7, until: 21.3, text: 'All its bubbles form at once. Then it’s flat.' },
      { t: 22.9, until: 27.75, text: 'Insects that walk on water fall through.' },
      { t: 30.6, until: 33.65, text: 'Soil can’t hold water either.' },
      { t: 38.4, until: 41.3, text: 'Leaves pull water up through hair-thin tubes.' },
      { t: 41.6, until: 44.9, text: 'Without surface tension, air leaks in and the pull breaks.' },
      { t: 48.7, until: 51.7, text: 'Rain can’t hold itself together.' },
      { t: 52.0, until: 55.6, text: 'And feathers can’t keep it out.' },
      { t: 56.3, until: 60.0, text: 'Even the rain can’t save the garden.' },
      { t: NST.line1, until: NST.line2 - 0.25, text: 'It looks like a tiny force…' },
      { t: NST.line2, until: NST.note - 0.1, text: '…until an entire ecosystem depends on it.' },
    ],
    readouts: [
      { from: -0.6, until: 21.3, top: 220, label: 'SURFACE TENSION', value: (t) => `${Math.round(nstSigma(t))} mN/m`, sub: (t) => (t < NST.drop ? 'LIQUID WATER · 20 °C' : t < NST.soda ? 'WATER ONLY · EVERYTHING ELSE NORMAL' : 'NOTHING HOLDS NEW BUBBLES BACK') },
      { from: 22.5, until: 27.75, top: 220, label: 'SURFACE TENSION', value: () => '0 mN/m', sub: 'NO SURFACE SKIN TO STAND ON' },
      { from: 29.9, until: 33.65, top: 220, label: 'CAPILLARY RISE', value: () => '0 mm', sub: 'TINY PORES CAN’T HOLD WATER NOW' },
      { from: 37.9, until: 44.9, top: 220, label: 'TIME SINCE THE CHANGE', value: (t) => nstDayText(t), sub: (t) => `PLANTS WILTING · ${Math.round(nstWilt(t) * 100)} %` },
      { from: 48.5, until: 51.75, top: 220, label: 'ROUND DROPS', value: () => '0', sub: 'IT FALLS AS SHREDS AND MIST' },
      { from: 51.95, until: 55.6, top: 220, label: 'DUCK’S FEATHERS', value: () => 'SOAKED', sub: 'NO TRAPPED AIR · IT RIDES LOW' },
      { from: 56.2, until: 67.4, top: 220, label: 'SURFACE TENSION', value: () => '0 mN/m', sub: 'SAME WATER · NO DROPS' },
    ],
    notes: [
      { t: NST.note, until: NST.end + 0.2, text: 'FICTIONAL RULE: ONLY WATER’S SURFACE TENSION CHANGED<br>TIME COMPRESSED' },
    ],
  },
};

function nstDayText(t) {
  const d = nstDay(t) - 1, h = Math.max(1, Math.floor(d * 24));
  if (h < 24) return h === 1 ? '1 HOUR' : `${h} HOURS`;
  return `DAY ${Math.floor(d) + 1}`;
}

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
