/* =====================================================================
   SCRIPT — "WHAT IF WATER LOST ALL SURFACE TENSION?"
   ★ The one file to edit for timing: the beats, the words, the readouts, your head (camera), your hands.
   Everything is a pure function of STORY time. A 'step' key on a track is a hard cut. Plan: films/no-surface-tension/PLAN.md
   Structure (docs/VIDEO_FORMAT.md): centred title over a normal kitchen → the rule changes under the title →
   no drops (tap) → nothing floats (paperclip) → a bottle of sparkling water erupts → insects fall through → water
   can't climb thin tubes → inside a stem: air gets in and the water column snaps → days: the sunflower bows over the
   pond → rain: one leaf tip can't make a drop; down its thread to the waterline, where a soaked duck rides low.
   ===================================================================== */

CONFIG.duration = 65.7;
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
  bench: 29.0, pour: 29.6, pourEnd: 31.3,   // glass tubes in a dish on the potting bench: you pour water in; it climbs none of them
  wick: 33.7,                      // (the end of the bench shot)
  stem: 33.7, seed: 36.05, snap: 36.4,      // inside a sunflower stem: water pulled up thin tubes; air gets in through a pit, the column snaps
  lapse: 39.2, lapse0: 39.3, lapse1: 43.4,  // days pass: the sunflower wilts and bows over the pond
  clouds: 44.2, rain: 45.0,        // (off screen, in the cut) the clouds come; it rains: torn shreds and mist, no drops
  fin: 47.0,                       // the rain on one bowed leaf: its tip can't make a drop, it lets the water go as a thread
  desc: 50.8, wl: 52.4,            // down the thread to the pond, settling at the waterline: a soaked duck rides low
  sink: 55.6,                      // … and sinks lower, paddling hard
  line1: 57.4, line2: 60.3, note: 63.5, end: 65.7,
  flashes: [],                     // (no lightning: the rain is a quiet grey roar)
};

// the cut (story intervals kept) → ≈ 60 s
CONFIG.edit = [[0, 14.4], [14.6, 21.4], [22.2, 27.8], [29.0, 43.6], [47.0, 65.7]];

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
function nstWilt(t) { return Math.pow(MathX.clamp((nstDay(t) - 1.01) / 1.25, 0, 1), 0.6); }      // (with its vessels failed it droops within hours, like a cut stem)
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
    { id: 'bench', time: NST.bench, label: 'Thin glass tubes: the water climbs none of them' },
    { id: 'stem', time: NST.stem, label: 'Inside a stem: air gets in, the water column snaps' },
    { id: 'lapse', time: NST.lapse, label: 'Days pass: the sunflower bows over the pond' },
    { id: 'fin', time: NST.fin, label: 'Rain on one leaf: no drop, a thread' },
    { id: 'wl', time: NST.wl, label: 'Down to the waterline: the soaked duck rides low' },
    { id: 'line', time: NST.line1, label: 'The closing line' },
  ],

  // your head. Kitchen: the back wall (window over the sink) is at z = 0.2, you face −Z toward it.
  // Garden: outside the same wall (z < 0). Pond around (−1.2, −7); potting bench against the wall at x 1.7–3.3.
  camera: {
    baseY: 0,
    x: [[0, -0.54], [4.39, -0.54], [4.4, 0.68, 'step'], [9.59, 0.67], [9.6, -0.175, 'step'], [14.59, -0.175],
      [14.6, -0.4, 'step'], [21.4, -0.4],
      [22.2, -0.62, 'step'], [28.99, -0.62],
      [29.0, 2.312, 'step'], [33.69, 2.308],
      [33.7, 60.0, 'step'], [39.19, 60.0],
      [39.2, -2.2, 'step'], [43.59, -2.2],
      [43.6, -0.9, 'step'], [65.7, -0.9]],
    z: [[0, 1.07], [4.39, 1.01, 'linear'], [4.4, 0.68, 'step'], [9.59, 0.68], [9.6, 0.98, 'step'], [14.59, 0.96],
      [14.6, 1.09, 'step'], [15.7, 1.075], [16.25, 1.24, 'outCubic'], [17.4, 1.21], [18.6, 1.15], [21.4, 1.0],
      [22.2, -5.14, 'step'], [28.99, -5.14],
      [29.0, -0.9, 'step'], [33.69, -0.88],
      [33.7, 60.82, 'step'], [39.19, 60.66],
      [39.2, -4.2, 'step'], [43.59, -4.32],
      [43.6, -5.4, 'step'], [65.7, -5.4]],
    height: [[0, 1.25], [4.39, 1.22], [4.4, 1.1, 'step'], [9.59, 1.1], [9.6, 1.13, 'step'], [14.59, 1.13],
      [14.6, 1.2, 'step'], [15.7, 1.2], [16.25, 1.26, 'outCubic'], [17.4, 1.24], [21.4, 1.17],
      [22.2, 0.6, 'step'], [28.99, 0.56],
      [29.0, 1.03, 'step'], [33.69, 1.03],
      [33.7, -39.98, 'step'], [39.19, -40.0],
      [39.2, 0.6, 'step'], [43.59, 0.6],
      [43.6, 1.0, 'step'], [65.7, 1.0]],      // (from the rain on: the camera is flown by film.js)
    yaw: [[0, 0], [4.39, 0], [4.4, 63, 'step'], [9.59, 64], [9.6, 0, 'step'], [14.59, 0],
      [14.6, 0, 'step'], [21.4, 0],
      [22.2, 2, 'step'], [23.7, 1], [24.5, 0, 'inOutSine'], [28.99, -1],
      [29.0, 180, 'step'], [33.69, 180.5],
      [33.7, 0, 'step'], [39.19, 0],
      [39.2, 0, 'step'], [43.59, 0],
      [43.6, 0, 'step'], [65.7, 0]],
    pitch: [[0, -20], [4.39, -20.5], [4.4, 5, 'step'], [6.9, 4], [9.59, -1], [9.6, -19, 'step'], [10.9, -21], [11.6, -25, 'inOutSine'], [14.59, -26],
      [14.6, -18, 'step'], [15.7, -18.5], [16.25, 4, 'outCubic'], [16.9, 4], [17.7, -8], [18.7, -17], [21.4, -19],
      [22.2, -65, 'step'], [24.4, -66], [28.99, -66.5],
      [29.0, -10, 'step'], [33.69, -10],
      [33.7, 0, 'step'], [39.19, 0],
      [39.2, 18, 'step'], [43.59, 17],
      [43.6, 0, 'step'], [65.7, 0]],
    fov: [[0, 36], [4.39, 35], [4.4, 46, 'step'], [9.59, 42], [9.6, 30, 'step'], [14.59, 29],
      [14.6, 42, 'step'], [15.7, 40], [16.25, 54, 'outCubic'], [17.4, 52], [18.7, 45], [21.4, 37],
      [22.2, 24, 'step'], [24.4, 17, 'inOutSine'], [28.99, 16],
      [29.0, 36.5, 'step'], [33.69, 35],
      [33.7, 46, 'step'], [39.19, 41],
      [39.2, 56, 'step'], [43.59, 54],
      [43.6, 50, 'step'], [65.7, 50]],
    tilt: [[0, 0], [65.7, 0]],
    startles: [[NST.drop + 0.15, 0.35], [NST.sodaOpen + 0.04, 0.9], [NST.strider + 0.4, 0.25], [NST.snap + 0.02, 0.5], [NST.snap + 1.17, 0.25]],
    shakes: [[NST.sodaOpen + 0.05, 0.5, 0.35], [NST.snap + 0.02, 0.3, 0.25]],
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
    pov: [[0, 1], [NST.stem, 1], [NST.stem + 0.001, 0], [NST.lapse, 0], [NST.lapse + 0.001, 1], [NST.fin, 1], [NST.fin + 0.001, 0], [NST.end, 0]],      // (no body motion inside the stem or in the flown finale)
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
      { t: 30.3, until: 33.65, text: 'Water can’t climb thin tubes anymore.' },
      { t: 34.05, until: 36.25, text: 'Plants pull water up through hair-thin tubes.' },
      { t: 36.45, until: 39.15, text: 'Without surface tension, the leaves can’t pull and air gets in.' },
      { t: 47.4, until: 50.7, text: 'Rain can’t hold itself together.' },
      { t: 53.0, until: 57.0, text: 'And feathers can’t keep it out.' },
      { t: NST.line1, until: NST.line2 - 0.25, text: 'It looks like a tiny force…' },
      { t: NST.line2, until: NST.note - 0.1, text: '…until an entire ecosystem depends on it.' },
    ],
    readouts: [
      { from: -0.6, until: 21.3, top: 220, label: 'SURFACE TENSION', value: (t) => `${Math.round(nstSigma(t))} mN/m`, sub: (t) => (t < NST.drop ? 'LIQUID WATER · 20 °C' : t < NST.soda ? 'WATER ONLY · EVERYTHING ELSE NORMAL' : 'NOTHING HOLDS NEW BUBBLES BACK') },
      { from: 22.5, until: 27.75, top: 220, label: 'SURFACE TENSION', value: () => '0 mN/m', sub: 'NO SURFACE SKIN TO STAND ON' },
      { from: 29.9, until: 33.65, top: 220, label: 'CAPILLARY RISE', value: () => '0 mm', sub: 'IT USED TO CLIMB HIGHER IN THINNER TUBES' },
      { from: 33.9, until: 39.15, top: 220, label: 'WATER IN THE STEM', value: (t) => (t < NST.snap ? 'HOLDING' : 'BROKEN'), sub: (t) => (t < NST.snap ? 'THE INSTANT OF THE CHANGE' : 'AIR GOT IN THROUGH A PORE') },
      { from: 39.4, until: 43.55, top: 220, label: 'TIME SINCE THE CHANGE', value: (t) => nstDayText(t), sub: 'THE PLANTS ARE WILTING' },
      { from: 47.3, until: 50.75, top: 220, label: 'ROUND DROPS', value: () => '0', sub: 'NOT EVEN ON A LEAF TIP' },
      { from: 52.9, until: 57.05, top: 220, label: 'DUCK’S FEATHERS', value: () => 'SOAKED', sub: 'NO TRAPPED AIR · IT RIDES LOW' },
      { from: 57.25, until: 60.55, top: 220, label: 'SURFACE TENSION', value: () => '0 mN/m', sub: 'SAME WATER · NO DROPS' },      // (off before the tilt-up brings the sunflower's head into its corner)
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
