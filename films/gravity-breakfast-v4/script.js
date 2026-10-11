/* =====================================================================
   SCRIPT — "What If Gravity Doubled at Breakfast?" (Cinematic Hybrid prototype, 16:9)
   ★ The one file to edit for timing: the beats, the words, the POV head, the hands, the sound cues.
   Everything is a pure function of time (story seconds = film seconds; no CONFIG.edit).
   Plan and shot list: films/gravity-breakfast-v4/PLAN.md
   ===================================================================== */

CONFIG.duration = 30.0;
CONFIG.seed = 20261011;
CONFIG.width = 1920; CONFIG.height = 1080;      // 16:9 prototype (film.js installs the 16:9 resize)
Object.assign(CONFIG.camera, {
  cameraHeight: 1.18, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7,
  breathingStrength: 0.0045, breathRate: 17, fov: 44, shakeStrength: 1.0,
});
CONFIG.render.shadowMapSize = 2048;
CONFIG.render.msaa = 4;

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (story seconds). Every other file keys off these.
// ---------------------------------------------------------------------------------------------------------------------
const GB = {
  title: [-0.3, 2.4],   // the title sits over the café interior from frame 1, left of the hero (V3: off his face)
  inside: 0.0,
  sip: [0.35, 1.75],    // first sip (cup up, sip, cup down)
  lift: 2.45,           // he lifts the cup again…
  g: 3.0,               // ★ gravity doubles (1.0 → 2.0 g, ~0.12 s ramp) — gbG(t) is the one gravity value for physics, HUD and story
  room: 4.15,           // cut: the whole room reacts (lamps, the waiter buckles)
  close: 6.9,           // cut: the struggle close-up (one shot, one cup)
  try: [7.2, 12.75],    // V3: brace → reach → grip → attempt 1 (fails) → two hands → sip → set down → let go
  reach: [7.4, 7.95],   // the right hand leaves the table, opens, arcs to the handle
  grip: 7.95,           // contact: fingers close round the handle BEFORE the cup moves
  a1: [8.2, 9.35],      // attempt 1: the cup sticks, then breaks free 5 cm, trembles, slips back down
  a2: [9.95, 12.45],    // attempt 2: both hands, elbows on the table, head down to meet the cup
  rack: 8.6,            // rack focus: hands → face
  push: 12.85,          // push into his face (the transition)
  pov: 13.4,            // POV: eyes open (V3: a short dip, no long black)
  stand: [13.9, 16.0],  // tries to stand… and sinks back
  fall: 16.35,          // cut: the falling cup (a floor-level shot by the waiter)
  waiter: 16.75,        // her tray starts to tip
  smash: 18.427,        // = cast.smashT (story time; probed): the cup leaves the tray at scene waiter + 0.75, 0.56 m free fall in 2 g, slow motion
  out: 19.2,            // cut outside: the fountain
  wide: 22.6,           // the balloon vendor, crane up
  release: 24.3,        // V4: the experiment — he lets go: a 2 g balloon races a 1 g ghost up a height scale
  line: [27.0, 29.6],
  end: 30.0,
  lamp: 99, window: 99, // (V2 beats no longer used)
};

// gravity in g (1 → 2), with a very short ramp so it reads as instant but stays smooth for springs
function gbG(t) { return 1 + MathX.smooth(t, GB.g, GB.g + 0.12); }
// V3: slow motion for the falling cup (S5b only). Story time → scene time: the rate eases 1 → 0.3, holds, eases back.
// Pure function (closed-form integral of a piecewise-linear rate). The scene runs on gbScene(t) inside S5b only.
const GB_SLOW = { t0: GB.waiter + 0.62, r: 0.3, a: 0.15, h: 1.2, b: 0.35 };
function gbScene(t) {
  const S = GB_SLOW; let u = t - S.t0;
  if (u <= 0) return t;
  let s = S.t0;
  if (u < S.a) return s + u - (1 - S.r) * u * u / (2 * S.a);
  s += S.a - (1 - S.r) * S.a / 2; u -= S.a;
  if (u < S.h) return s + S.r * u;
  s += S.r * S.h; u -= S.h;
  if (u < S.b) return s + S.r * u + (1 - S.r) * u * u / (2 * S.b);
  s += S.r * S.b + (1 - S.r) * S.b / 2; u -= S.b;
  return s + u;
}
// scene time → story time (bisection; gbScene is monotonic)
function gbStory(ts) { let lo = ts, hi = ts + 3; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (gbScene(m) < ts) lo = m; else hi = m; } return (lo + hi) / 2; }
// seconds since gravity doubled (negative before)
function gbSince(t) { return t - GB.g; }

// SOUND CUE MARKERS (story s): audio.js schedules from this table; the dev bar shows the same ids as events
const GB_CUES = [
  [0.0, 'bed', 'Room tone; warm pluck motif'],
  [GB.sip[0] + 0.45, 'sip', 'Sip'],
  [GB.g, 'gdrop', 'G-DROP: sub hit + pressure swell'],
  [GB.g + 0.12, 'clunk', 'Cup slams onto the saucer'],
  [GB.g + 0.15, 'splash', 'Coffee splash'],
  [GB.g + 0.2, 'creak', 'Chair creaks and sinks'],
  [GB.g + 0.35, 'slump', 'Body slump, breath out'],
  [GB.g + 0.5, 'lamps', 'Lamp cords twang'],
  [GB.g + 0.9, 'waiterdown', 'Waiter buckles, tray rattles'],
  [GB.g + 0.1, 'gauge', 'Gauge ticks 1.0 → 2.0 g'],
  [GB.try[0], 'brace', 'Palm presses on the table, breath in'],
  [GB.grip, 'grip', 'Fingers close on the handle (ceramic tick)'],
  [GB.a1[0], 'strain', 'Attempt 1: held breath, strain'],
  [GB.a1[0] + 0.45, 'scrape', 'The cup breaks free of the saucer'],
  [GB.a1[1], 'clink', 'Cup slips back onto the saucer'],
  [GB.a2[0], 'strain2', 'Attempt 2: two hands, breaths'],
  [GB.a2[1], 'setdown', 'Cup set down; relief exhale'],
  [GB.push, 'whoosh', 'Push-in whoosh, heartbeat'],
  [GB.pov, 'eyes', 'Eyes open (air)'],
  [GB.stand[0], 'effort', 'Effort to stand, chair creak, sinks back'],
  [GB.fall, 'fallcut', 'Cut low: tray rattle, her strained breath'],
  [GB.smash, 'smash', 'Cup hits the floor: crack, shards skitter, splash'],
  [GB.out, 'outside', 'Cut outside: fountain (lower), wind'],
  [GB.release, 'balloons', 'Balloons escape: rubber squeak, whoosh up'],
  [GB.line[0], 'resolve', 'Music resolves under the end line'],
];

const SCRIPT = {
  meta: { title: 'What If Gravity Doubled at Breakfast?', wav: 'gravity-breakfast-v4-soundtrack.wav' },

  events: [
    { id: 'start', time: 0.0, label: 'S2 medium: breakfast + title' },
    { id: 'g', time: GB.g, label: '★ gravity doubles' },
    { id: 'room', time: GB.room, label: 'S3 wide: the room reacts' },
    { id: 'close', time: GB.close, label: 'S4 close-up: the struggle' },
    { id: 'grip', time: GB.grip, label: 'Grip (contact before the cup moves)' },
    { id: 'push', time: GB.push, label: 'Transition: into his eyes' },
    { id: 'pov', time: GB.pov, label: 'S5 POV: trying to stand' },
    { id: 'fall', time: GB.fall, label: 'S5b the falling cup (floor level)' },
    { id: 'out', time: GB.out, label: 'S6a the fountain' },
    { id: 'wide', time: GB.wide, label: 'S6b the balloons, crane up' },
    { id: 'line', time: GB.line[0], label: 'End line' },
  ],

  // The POV head (S5 only; the other shots override the camera in shots.js). Seated at his table, facing +X.
  camera: {
    baseY: 0,
    x: [[0, -2.72], [30, -2.72]],
    z: [[0, -2.78], [30, -2.78]],
    height: [[0, 1.13], [GB.stand[0], 1.13], [GB.stand[0] + 0.35, 1.07, 'inOutSine'], [GB.stand[0] + 1.45, 1.34, 'inOutCubic'], [GB.stand[1] - 0.3, 1.36],
      [GB.stand[1], 1.1, 'inQuad'], [GB.stand[1] + 0.25, 1.15, 'outQuad'], [30, 1.15]],
    yaw: [[0, -98], [GB.pov, -98], [GB.stand[0], -96], [GB.stand[1], -94], [30, -94]],
    pitch: [[0, -50], [GB.pov, -50], [GB.stand[0], -46], [GB.stand[0] + 1.5, -30, 'inOutSine'], [GB.stand[1], -40], [30, -38]],
    fov: [[0, 62], [30, 62]],
    tilt: [[0, 0], [GB.stand[0] + 1.0, -2], [GB.stand[1], 2.5], [GB.stand[1] + 0.4, 0], [30, 0]],
    startles: [[GB.stand[1] - 0.05, 0.6]],
    shakes: [[GB.stand[1], 0.3, 0.35]],
  },

  // his hands in POV: pressing on the table edge to stand up
  hands: {
    right: [[0, 'hidden'], [GB.pov, 'gbRest!'], [GB.stand[0] - 0.3, 'gbPress'], [GB.stand[1] + 0.3, 'gbRest'], [GB.fall, 'hidden']],
    left: [[0, 'hidden'], [GB.pov, 'gbRest!'], [GB.stand[0] - 0.2, 'gbPress'], [GB.stand[1] + 0.3, 'gbRest'], [GB.fall, 'hidden']],
  },

  tracks: {
    pov: [[0, 0], [GB.pov - 0.01, 0], [GB.pov, 1, 'step'], [GB.fall - 0.01, 1], [GB.fall, 0, 'step'], [30, 0]],
  },

  hud: {
    title: { in: GB.title[0], out: GB.title[1], fi: 0.2, fo: 0.45, cls: 'big center',
      html: '<span class="kick">WHAT IF GRAVITY</span><span class="hero">DOUBLED</span><span class="kick">AT BREAKFAST?</span>' },
    captions: [
      { t: 3.9, until: 6.6, text: 'Gravity doubles. Same mass, twice the weight.' },
      { t: 7.3, until: 9.8, text: 'His 4 kg arm now weighs what 8 kg used to.' },
      { t: 10.2, until: 12.5, text: 'Every sip becomes a workout.' },
      { t: 14.1, until: 16.2, text: 'Standing up is like carrying a second you.' },
      { t: 16.6, until: 19.0, text: 'Falling things gain speed twice as quickly. They land sooner, and harder.' },
      { t: 19.5, until: 22.4, text: 'Same water speed, so the fountain only reaches half as high.' },
      { t: 22.85, until: 24.25, text: 'So will a balloon still float?' },
      { t: 24.6, until: 26.8, text: 'Yes, and faster. The air weighs twice as much too, so it pushes up twice as hard.' },
    ],
    readouts: [],
    endLine: { t: GB.line[0], until: GB.line[1] + 0.4, text: 'Twice the weight, twice the lift.<br>It climbs about 40 % faster.' },
  },
};

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
