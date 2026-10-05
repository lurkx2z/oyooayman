/* =====================================================================
   THE DIRECTOR'S SCRIPT
   ---------------------------------------------------------------------
   Every timing in the film lives in this one file:
     • story events           • HUD text / labels / annotations
     • camera choreography    • vehicles and what happens to them
     • value curves (O₂, hypoxia, muffling…)   • people and their actions
   Retime the film here; the systems just read this data.
   Times are in seconds. Positions in metres (camera looks down -Z).
   ===================================================================== */

const SCRIPT = {
  /* ------------------------------------------------------------------ */
  events: [
    { id: 'normal_world',   time: 0.0,  label: 'Normal day (O₂ already ticking)' },
    { id: 'oxygen_drop',    time: 1.3,  label: 'O₂ crashes · ears start popping' },
    { id: 'flames_out',     time: 1.66, label: 'Flames die at ~15% O₂' },
    { id: 'engines_sputter',time: 1.72, label: 'Engines misfire (~14% O₂)' },
    { id: 'o2_zero',        time: 2.4,  label: 'O₂ = 0 % · pressure −21 % · ears pop' },
    { id: 'engines_dead',   time: 2.6,  label: 'Every combustion engine stopped' },
    { id: 'lighter',        time: 3.8,  label: "Vendor's lighter: sparks, no flame" },
    { id: 'grinder_stop',   time: 6.1,  label: 'Worker stops grinding' },
    { id: 'grid_fail',      time: 6.3,  label: 'Power grid collapses (60% of power was fire)' },
    { id: 'car_bump',       time: 6.75, label: 'Coasting car rear-ends the stalled car · alarm' },
    { id: 'ev_pass',        time: 8.6,  label: 'Electric car still driving' },
    { id: 'hypoxia_begin',  time: 9.8,  label: 'Dizziness · tunnel vision' },
    { id: 'first_collapse', time: 12.6, label: 'Hard-working worker collapses first (~10 s)' },
    { id: 'realization',    time: 15.4, label: 'Every breath pulls O₂ OUT of your blood' },
    { id: 'breath_hold',    time: 16.2, label: 'You hold your breath (buys ~30 s)' },
    { id: 'blink_cut',      time: 21.45, label: 'Lost moment → the intersection' },
    { id: 'aircraft',       time: 23.0, label: 'Airliner gliding overhead, engines dead since 1.7 s' },
    { id: 'aircraft_gone',  time: 31.6, label: 'It disappears behind the blocks' },
    { id: 'impact',         time: 34.4, label: 'Impact: dust, no fireball (nothing can burn)' },
    { id: 'impact_sound',   time: 35.9, label: 'The sound arrives 1.5 s later (510 m away)' },
    { id: 'phones',         time: 37.2, label: 'Phones ringing beside people on the ground' },
    { id: 'co2_burn',       time: 44.6, label: 'CO₂ builds: chest spasms' },
    { id: 'forced_breath',  time: 49.6, label: 'Your body forces a breath of O₂-free air' },
    { id: 'kneel',          time: 52.8, label: 'Knees give way' },
    { id: 'collapse',       time: 55.0, label: 'You collapse' },
    { id: 'silence',        time: 58.4, label: 'Silence' },
    { id: 'pullback',       time: 60.1, label: 'Rise above the dead avenue' },
    { id: 'earth',          time: 67.6, label: 'Earth: the same thing, everywhere' },
    { id: 'ending',         time: 79.2, label: 'You would only have seconds to react' },
    { id: 'end',            time: 90.0, label: 'End' },
  ],

  // Set to null to keep mains electricity on (not realistic: ~60 % of power comes from burning fuel)
  grid: { fail: 6.3 },

  // the viewer's own hands (first-person)
  hands: {
    // the viewer's own arms (authored model in js/camera/viewerHands.js)
    // (a hand over the mouth would sit ~55° below the eye line, out of frame, so the breath-hold beat is a hand
    //  reaching toward the kneeling customer instead)
    right: [[0, 'hidden'], [1.85, 'ear'], [2.75, 'hidden'], [16.6, 'reach'], [18.9, 'hidden'], [53.2, 'brace'], [55.3, 'hidden']],
    left: [[0, 'hidden'], [1.85, 'ear'], [2.75, 'hidden'], [44.4, 'look'], [47.6, 'hidden']],
    flicks: [],                      // viewer's piezo clicks (e.g. [3.95, 4.45, 4.95]); the vendor's flint lighter carries this beat
  },

  /* ------------------------------------------------------------------
     Value curves.  [time, value, ease-into-this-key]
     ------------------------------------------------------------------ */
  tracks: {
    // the counter starts creeping down on the very first frame, then crashes
    oxygen: [[0, 21.0], [0.3, 21.0], [1.3, 20.3, 'inQuad'], [1.66, 15.0, 'inQuad'], [1.95, 8.0, 'linear'], [2.2, 3.0, 'linear'], [2.4, 0, 'outQuad']],
    // 0 … 1 : how strongly the viewer is affected (drives visual + audio effects)
    // holding your breath stops the washout: symptoms plateau until the body forces a breath at 49.6 s
    hypoxia: [[0, 0], [9.8, 0], [12.0, 0.28, 'inQuad'], [15, 0.62, 'linear'], [16.4, 0.64], [19, 0.42], [24, 0.36], [38, 0.38], [44, 0.45],
      [49.6, 0.55], [50.6, 0.72], [53.0, 0.88], [55.3, 0.98], [60.0, 1.0], [60.1, 0, 'step']],
    breathRate: [[0, 14], [9.0, 14], [15, 22, 'inQuad'], [49.6, 22], [50.5, 34], [54, 30], [56, 12]],   // breaths per minute (no gasping: CO₂ still leaves)
    // 1 while the breath is held (no breathing motion or sound)
    breathHold: [[0, 0], [16.15, 0], [16.2, 1, 'step'], [49.6, 1], [49.65, 0, 'step']],
    // CO₂ distress during the breath-hold: chest spasms, louder heart (0 … 1)
    co2: [[0, 0], [38, 0], [44.6, 0.35], [49.5, 1.0, 'inQuad'], [49.7, 0, 'step']],
    heartRate: [[0, 72], [9.4, 76], [15, 112, 'inQuad'], [30, 104], [44, 118], [49.6, 126], [54, 96], [58, 58], [60, 40]],   // beats per minute
    // 1 = first-person layers (bob, breathing, hypoxia effects); 0 = cinematic camera (pull-back, Earth)
    pov: [[0, 1], [60.0, 1], [60.1, 0, 'step']],
    // black fades: a hypoxic "lost moment" cut, the blackout, the end
    fade: [[0, 0], [21.3, 0], [21.42, 1], [21.62, 1], [21.95, 0], [57.6, 0], [59.2, 0.86], [59.45, 1], [60.15, 1], [61.1, 0], [88.4, 0], [89.9, 1]],
    // white-out through the haze into space
    whiteout: [[0, 0], [66.2, 0], [67.5, 1, 'inQuad'], [67.65, 1], [68.7, 0, 'outQuad']],
    // night-side city lights still burning on Earth (backup power running out in waves)
    earthLights: [[0, 1], [68.5, 1], [80, 0.1, 'inOutSine'], [90, 0.06]],
    // sky gets slightly darker: O₂ is ~21 % of the molecules that scatter blue light
    skyO2: [[0, 1], [1.3, 1], [2.4, 0, 'inOutSine']],
  },

  /* ------------------------------------------------------------------
     First-person camera.  yaw: + = turn LEFT, − = turn RIGHT (degrees)
     ------------------------------------------------------------------ */
  camera: {
    // 21.5 s: a hypoxic "lost moment" — the picture blacks out and returns at the intersection corner.
    // 60.1 s: the camera leaves the body and rises above the avenue (cinematic, pov track = 0).
    x: [[0, 9.4], [9.6, 9.4], [10.4, 9.25], [13.6, 9.25], [14.6, 9.45], [16.0, 9.5], [21.35, 9.85, 'linear'], [21.5, 14.0, 'step'],
      [24, 13.9], [36.0, 13.8], [40.8, 11.2], [46, 11.0], [52.8, 10.9], [55.6, 10.8], [60.0, 10.8], [60.1, 12, 'step'], [66.8, 4]],
    z: [[0, 5.2], [1.9, 2.8, 'linear'], [2.6, 2.4, 'outQuad'], [13.6, 2.4], [14.6, 2.65], [16.0, 2.55], [21.35, 1.0, 'linear'], [21.5, -37.4, 'step'],
      [24, -37.6], [36.0, -37.7], [40.8, -39.0], [46, -39.6], [52.8, -39.9], [55.6, -40.05], [60.0, -40.05], [60.1, -26, 'step'], [66.8, 40]],
    // eye height above the pavement: kneel, fall, then the crane up
    height: [[0, 1.7], [52.8, 1.7], [53.7, 1.02, 'inOutQuad'], [55.0, 0.92], [55.6, 0.2, 'inQuad'], [60.0, 0.2], [60.1, 18, 'step'], [66.8, 130, 'inOutSine']],
    // fixed roll (deg) for lying on the ground
    tilt: [[0, 0], [55.0, 0], [55.6, 74, 'inQuad'], [60.0, 74], [60.1, 0, 'step']],
    yaw: [
      [0, 5], [1.3, 5], [1.7, 7], [2.4, 7.5], [3.2, 7], [3.7, 9.5, 'inOutSine'], [5.2, 10.5], [5.75, 9.5], [6.1, 9.5],
      [6.55, 21, 'inOutCubic'], [7.1, 22], [7.3, 30], [7.5, 35], [7.8, 45], [8.0, 52], [8.2, 61], [8.4, 70], [8.6, 77], [8.85, 80, 'outQuad'],
      // after the electric car: look down the avenue — the dead street and the hazy city become the subject,
      // the cart stays as a dark mass at the right edge
      [9.9, 28, 'inOutCubic'], [11.1, 26], [12.0, 17], [13.0, 16], [13.6, 14], [14.5, 11.5], [15, 12],
      // hold your breath, look at the people on the ground
      [16.2, 6], [17.4, 2], [18.4, -10], [19.6, -6], [20.6, 12], [21.35, 16],
      // the intersection; 24.4–31.6 s the head follows the gliding airliner (keys added below from its path)
      [21.5, 48, 'step'], [23.2, 50], [23.9, 55],
      [33.4, -84], [34.0, -86], [37.0, -86], [38.8, 16, 'inOutCubic'], [40.0, 15], [42.0, 19], [44.0, 18], [46.5, 16], [49.6, 18], [52.8, 15], [55.6, 15], [60.0, 15],
      [60.1, 35, 'step'], [66.8, 0],
    ],
    pitch: [
      [0, 4], [1.3, 4], [1.7, 2], [2.4, 1], [3.2, -2], [3.7, -5, 'inOutSine'], [5.2, -4.5], [5.75, 13], [6.1, 12.5],
      [6.55, 3], [7.1, 2.5], [7.5, 0], [8.2, -1.5], [8.85, -2], [9.9, -1.5], [10.8, -2], [11.4, -1.5], [12.0, 10.5],
      [13.0, 9.5], [13.6, -5], [14.5, -7.5], [15, -7],
      [16.2, -8], [17.4, -10], [18.4, -12], [19.6, -9], [20.6, -1], [21.35, -2],
      [21.5, -6, 'step'], [23.2, -4], [23.9, 6],
      [33.4, 6], [34.0, 7], [37.0, 9], [38.8, -6], [40.0, -8], [42, -6], [44, -10], [46.5, -6], [49.6, -2], [52.8, -16], [53.7, -30], [55.0, -38], [55.6, -6], [60, -6],
      [60.1, -38, 'step'], [66.8, -24],
    ],
    fov: [[0, 60], [2.03, 60], [2.1, 55.5, 'outQuad'], [2.8, 60, 'inOutSine'], [10, 60], [15, 56.5], [16.2, 57], [22, 60], [44, 59], [50, 57], [55, 52], [60, 52],
      [60.1, 50, 'step'], [66.8, 50]],
    // sudden reactions: t, strength  (small pops while O₂ falls, the big one at 0 %)
    startles: [[1.55, 0.14], [1.82, 0.42], [2.05, 0.75], [6.77, 0.35]],
    // camera shakes: t, amplitude, decay seconds
    shakes: [[2.05, 0.5, 0.3], [6.77, 0.15, 0.25], [35.95, 0.22, 0.6], [55.55, 0.9, 0.25]],
    // involuntary diaphragm contractions as CO₂ builds during the breath-hold
    spasms: [45.2, 46.6, 47.7, 48.6, 49.2],
    // late hypoxia: the viewer's knees start to go (metres lower) and the head rolls (deg)
    sag: [[0, 0], [12.5, 0], [15, 0.2, 'inQuad'], [18, 0.12], [36, 0.1], [44, 0.14], [52.8, 0.16], [53.7, 0]],
    roll: [[0, 0], [12.5, 0], [15, 4.0, 'inQuad'], [18, 2.5], [44, 3], [52, 5], [55, 5], [55.6, 0]],
  },

  /* ------------------------------------------------------------------
     HUD
     ------------------------------------------------------------------ */
  hud: {
    title: { in: -0.8, out: 1.9 },      // the question is already on screen on the first frame (thumbnail), gone before O₂ hits zero
    timerFrom: 9.6,                     // a second, temporary counter appears when it matters
    oxygenRedBelow: 10,
    // one restrained caption at a time — the world shows everything else
    captions: [
      { t: 1.95, until: 3.85, text: 'The flames went out first.' },
      { t: 6.15, until: 7.85, text: 'Then the engines. Then the power.' },
      { t: 8.05, until: 9.75, text: 'Only electric things kept moving.' },
      { t: 10.3, until: 12.4, text: 'No one felt short of breath.' },
      { t: 12.9, until: 15.0, text: 'That was the dangerous part.' },
      { t: 15.4, until: 17.9, text: 'Every breath was pulling oxygen out of your blood.' },
      { t: 18.1, until: 20.6, text: 'So you stopped breathing.' },
      { t: 25.8, until: 28.6, text: 'Its engines had died twenty seconds earlier.' },
      { t: 34.9, until: 37.4, text: 'No fireball. Nothing could burn.' },
      { t: 38.6, until: 41.0, text: 'Phones kept ringing.' },
      { t: 41.6, until: 44.2, text: 'Only the batteries were still awake.' },
      { t: 45.0, until: 47.6, text: 'Your chest began to burn.' },
      { t: 50.0, until: 52.6, text: 'Your body forced a breath.' },
      { t: 61.6, until: 64.8, text: 'It was happening everywhere at once.' },
      { t: 69.2, until: 72.8, text: 'No fires. No engines. No breathable air.' },
      { t: 73.6, until: 77.8, text: 'Eight billion people. The same few seconds.' },
    ],
    // second counter during the breath-hold
    breathFrom: 16.2, breathUntil: 49.6, breathAlert: 44.6,
    // the info block fades for the blackout and returns over the city; context line by time
    hudVisible: [[0, 1], [55.4, 1], [56.4, 0], [61.2, 0], [62.2, 1], [78.6, 1], [79.2, 0]],
    timerUntil: 55.4,
    context: [[0, 'SEA LEVEL'], [67.6, 'EVERYWHERE ON EARTH']],
    // final payoff
    ending: { line: { t: 79.2, until: 85.2, text: 'You would only have<br>seconds to react.' }, readout: { t: 85.6, until: 90 } },
    // floating object labels (kept available, but the world should tell the story)
    annotations: [],
  },

  /* ------------------------------------------------------------------
     Vehicles.
     lane: S1/S2 head away from camera, N1/N2 come toward it, E/W cross street.
     fail: when the engine starts to die (O₂ ~14 %)   stopS: where it rolls to rest (z = dir * s)
     ------------------------------------------------------------------ */
  vehicles: [
    // ---- heading away (S lanes, z = -s).  S2 is closed for road works near the viewer.
    { id: 'stallcar', type: 'sedan',  color: '#2b2f36', lane: 'S1', v0: 11,   fail: 1.72, stopS: 16,  decel: 2.2 },
    { id: 's1b',      type: 'hatch',  color: '#c9ccd1', lane: 'S1', v0: 11.5, fail: 1.8,  contact: { leader: 'stallcar', t: 6.75, vc: 2.4 } },
    { id: 's2behind', type: 'suv',    color: '#8a8f94', lane: 'S2', v0: 11,   fail: 1.85, stopS: -12, decel: 2.4 },
    { id: 'taxi',     type: 'taxi',   color: '#c4a24c', lane: 'S2', v0: 11,   fail: 1.8,  stopS: 90,  decel: 2.2 },
    { id: 'van',      type: 'van',    color: '#e9e9e6', lane: 'S2', v0: 10.5, fail: 1.85, stopS: 120, decel: 2.3 },
    { id: 'sfar',     type: 'hatch',  color: '#5a3533', lane: 'S2', v0: 12,   fail: 1.9,  stopS: 165, decel: 2.0 },

    // ---- coming toward camera (N lanes, z = s)
    { id: 'moto',     type: 'moto',   color: '#7e2c28', lane: 'N2', v0: 12.5, fail: 1.75, stopS: 32,   decel: 2.6, lateral: 0.55 },
    { id: 'n2p',      type: 'hatch',  color: '#4a4f57', lane: 'N2', v0: 11,   fail: 1.85, stopS: 16,   decel: 2.4 },
    { id: 'bus',      type: 'bus',    color: '#f4f4f2', lane: 'N2', v0: 9,    fail: 1.75, stopS: -24,  decel: 1.6 },
    { id: 'n2b',      type: 'suv',    color: '#2b2e33', lane: 'N2', v0: 10.5, fail: 1.85, stopS: -60,  decel: 2.4 },
    { id: 'n2far',    type: 'pickup', color: '#5a4636', lane: 'N2', v0: 12,   fail: 1.9,  stopS: -150, decel: 2.0 },
    { id: 'n1p',      type: 'sedan',  color: '#d8d8d4', lane: 'N1', v0: 12,   fail: 1.8,  stopS: 24,   decel: 2.4 },
    { id: 'n1a',      type: 'suv',    color: '#5d6b78', lane: 'N1', v0: 12,   fail: 1.75, stopS: -55,  decel: 2.6 },
    { id: 'n1b',      type: 'sedan',  color: '#6a3a34', lane: 'N1', v0: 11.5, fail: 1.85, stopS: -80,  decel: 2.0, swerve: { lat: 0.55, yaw: -7 } },
    { id: 'n1c',      type: 'hatch',  color: '#3d6e9e', lane: 'N1', v0: 12,   fail: 1.9,  stopS: -110, decel: 2.4 },
    { id: 'n1far',    type: 'van',    color: '#d7d2c4', lane: 'N1', v0: 12,   fail: 1.85, stopS: -170, decel: 2.0 },

    // ---- cross traffic waiting at the red light (idling, then dead)
    { id: 'xw1',      type: 'sedan',  color: '#55606b', lane: 'W1', s0: -13.8, v0: 0, fail: 1.8 },
    { id: 'xw2',      type: 'suv',    color: '#9aa3a8', lane: 'W1', s0: -20.6, v0: 0, fail: 1.85 },
    { id: 'xe1',      type: 'hatch',  color: '#e0ddd5', lane: 'E1', s0: -14.0, v0: 0, fail: 1.75 },

    // ---- the electric car: keeps driving, overtaking the dead queue on the wrong side, then passing the viewer
    {
      id: 'ev', type: 'ev', color: '#5a7fa6', lane: 'PATH', passAt: { z: 2.4, t: 8.6 },
      path: [[-1.75, -260], [-1.75, -128], [1.45, -119], [1.45, -52], [-1.75, -41], [-1.75, 2], [1.3, 14], [1.3, 140]],
      speed: [[0, 11], [15, 11]],
    },
  ],

  /* ------------------------------------------------------------------
     People.  face: 0 = looking down the street (-Z), 90 = left (-X), -90 = right (+X)
     path: [[t, x, z], …]   states: [[t, action], …]
     ------------------------------------------------------------------ */
  people: [
    { id: 'vendor',   look: 'vendor',  y: 0.15, path: [[0, 7.3, -3.45]], face: -90,
      states: [[0, 'grill'], [1.66, 'recoil'], [1.85, 'earPop'], [3.1, 'look'], [3.8, 'lighter'], [6.6, 'look'], [10.4, 'handHead'], [11.4, 'lean'], [12.9, 'sitGround']] },
    { id: 'customer', look: 'casual1', y: 0.15, path: [[0, 8.85, -3.9], [11.8, 8.85, -3.9], [12.4, 9.2, -3.25]], face: 90, faceUntil: 11.8,
      states: [[0, 'phone'], [1.85, 'earPop'], [3.1, 'look'], [4.6, 'phone'], [7.0, 'look'], [10.9, 'handHead'], [11.8, 'walk'], [12.4, 'stumble'], [13.4, 'kneel']] },
    { id: 'worker',   look: 'worker',  y: 4.06, path: [[0, 6.3, -14.0]], face: -90,
      states: [[0, 'grind'], [1.85, 'flinch'], [2.3, 'grind'], [6.1, 'lowerTool'], [6.6, 'look'], [11.0, 'handHead'], [12.6, 'railSlump']] },
    // keeps walking toward you, so late in the shot there is a figure in the near-right foreground
    { id: 'toward',   look: 'casual2', y: 0.15, path: [[0, 10.45, -17.5], [2.42, 10.45, -14.6], [3.4, 10.45, -14.6], [8.6, 10.45, -7.6], [12.2, 10.3, -2.6]],
      states: [[0, 'walk'], [1.85, 'earPop'], [3.2, 'look'], [3.4, 'walk'], [12.2, 'handHead'], [12.9, 'stumble'], [14.1, 'kneel']] },
    // a jogger overtakes you on the right: a foreground silhouette at the edge of frame (works hard → goes early)
    { id: 'away',     look: 'casual3', y: 0.15, stride: 2.4, path: [[0, 9.95, 6.6], [1.85, 9.95, -0.5], [2.6, 9.95, -0.7], [4.2, 10.7, -2.6], [6.0, 11.25, -5.0]],
      states: [[0, 'jog'], [1.85, 'earPop'], [2.6, 'walk'], [6.0, 'look'], [11.2, 'stumble'], [12.9, 'collapse']] },
    { id: 'L1',       look: 'casual4', y: 0.15, path: [[0, -8.7, -34], [2.42, -8.7, -31], [3.6, -8.7, -31], [11.5, -8.7, -22]],
      states: [[0, 'walk'], [1.85, 'earPop'], [3.2, 'look'], [3.6, 'walk'], [12.4, 'stumble'], [14.2, 'kneel'], [19.5, 'lie']] },
    { id: 'L2',       look: 'casual5', y: 0.15, path: [[0, -10.7, -4], [2.42, -10.7, -6.9], [3.5, -10.7, -6.9], [10.6, -10.7, -15]],
      states: [[0, 'walk'], [1.85, 'earPop'], [3.2, 'look'], [3.5, 'walk'], [13.0, 'stumble'], [14.2, 'sitGround'], [23, 'lie']] },
    { id: 'L3',       look: 'casual6', y: 0.15, path: [[0, -10.72, -21]], face: -90, seat: 0.45,
      states: [[0, 'sit'], [1.85, 'earPopSit'], [3.3, 'sit'], [17.5, 'sitSlump']] },
    { id: 'L4',       look: 'casual7', y: 0.15, path: [[0, -9.9, -63], [2.42, -9.9, -60], [3.6, -9.9, -60], [11, -9.9, -50]],
      states: [[0, 'walk'], [1.85, 'earPop'], [3.3, 'look'], [3.6, 'walk'], [12.6, 'stumble'], [15.5, 'kneel'], [21, 'lie']] },
    { id: 'L5',       look: 'casual8', y: 0.15, path: [[0, -10.6, -64.2], [2.42, -10.6, -61.2], [3.6, -10.6, -61.2], [11, -10.6, -51.3]],
      states: [[0, 'walk'], [1.85, 'earPop'], [3.3, 'look'], [3.6, 'walk'], [13.2, 'stumble'], [16.0, 'sitGround'], [24, 'lie']] },
    { id: 'C1',       look: 'casual2', y: 0.15, path: [[0, -10.22, -28.0]], face: 90, seat: 0.45,
      states: [[0, 'sit'], [1.85, 'earPopSit'], [3.3, 'sit'], [17.5, 'sitSlump']] },
    { id: 'C2',       look: 'casual5', y: 0.15, path: [[0, -11.58, -28.0]], face: -90, seat: 0.45,
      states: [[0, 'sit'], [1.85, 'earPopSit'], [3.3, 'sit'], [17.5, 'sitSlump']] },
    { id: 'C3',       look: 'casual3', y: 0.15, path: [[0, -10.22, -30.6]], face: 90, seat: 0.45,
      states: [[0, 'sit'], [1.85, 'earPopSit'], [3.3, 'sit'], [17.5, 'sitSlump']] },
    { id: 'R1',       look: 'casual1', y: 0.15, path: [[0, 9.9, -62], [2.42, 9.9, -59], [3.6, 9.9, -59], [11, 9.9, -49]],
      states: [[0, 'walk'], [1.85, 'earPop'], [3.3, 'look'], [3.6, 'walk'], [12.8, 'stumble'], [16.4, 'kneel'], [21.5, 'lie']] },
    // ---- at the intersection (seen after the 21.5 s cut)
    { id: 'X1', look: 'casual7', y: 0.0, path: [[0, 10.2, -43.4], [1.85, 9.9, -44.6], [3.2, 9.9, -44.6], [4.6, 9.5, -45.4]],
      states: [[0, 'walk'], [1.85, 'earPop'], [3.2, 'walk'], [4.6, 'look'], [11.6, 'stumble'], [13.4, 'kneel'], [16.8, 'lie']] },
    { id: 'X2', look: 'casual4', y: 0.0, path: [[0, 2.2, -44.6], [2.0, 3.6, -43.4], [3.0, 3.6, -43.4], [5.0, 4.7, -42.6]],
      states: [[0, 'walk'], [1.85, 'earPop'], [3.0, 'walk'], [5.0, 'look'], [12.2, 'stumble'], [14.4, 'kneel'], [18.2, 'lie']] },
    { id: 'X3', look: 'casual6', y: 0.15, path: [[0, -9.6, -38.8]], face: -60,
      states: [[0, 'idle'], [1.85, 'earPop'], [3.2, 'look'], [13.0, 'sitGround'], [22, 'lie']] },
    { id: 'X4', look: 'casual2', y: 0.15, path: [[0, -10.5, -58.0]], face: 30,
      states: [[0, 'idle'], [1.85, 'earPop'], [3.3, 'look'], [14.5, 'kneel'], [20.5, 'lie']] },
    { id: 'X5', look: 'casual8', y: 0.15, path: [[0, 11.6, -57.2]], face: 160,
      states: [[0, 'idle'], [1.85, 'earPop'], [3.2, 'look'], [12.5, 'handHead'], [14.6, 'sitGround'], [24, 'lie']] },
  ],

  /* ------------------------------------------------------------------
     The airliner on final approach. Its engines flamed out at ~14 % O₂ (1.7 s);
     it has been gliding silently ever since. [t, x, y, z] — no contrail, no fire.
     ------------------------------------------------------------------ */
  aircraft: {
    path: [[22.6, -420, 262, -205], [25.0, -230, 232, -200], [27.0, -75, 205, -186], [29.0, 80, 170, -160],
      [31.0, 232, 124, -125], [32.8, 375, 70, -95], [34.4, 520, 0, -72]],
    bank: [[22.6, 4], [27, 10], [31, 18], [33.5, 30], [34.4, 35]],
  },
  // where it comes down: a dust column, no flash (fuel can't burn), heard 1.4 s later
  impact: { t: 34.4, x: 520, z: -72 },     // at the far end of the cross street, in line of sight from the corner

  // phones on the pavement next to people who collapsed, still ringing on battery
  phones: [
    { x: 10.1, y: 0.01, z: -45.1, t0: 37.2, tune: 0 },
    { x: 4.95, y: 0.01, z: -42.25, t0: 38.3, tune: 1 },
    { x: 9.45, y: 0.16, z: -48.55, t0: 39.4, tune: 2 },
    { x: -9.85, y: 0.16, z: -38.1, t0: 40.6, tune: 1 },
  ],

  /* Earth (67.6 s →): a stylised planet, Atlantic in view, Europe/Africa on the night side */
  earth: { from: 67.6 },
};

// Track objects built from SCRIPT.tracks (used everywhere as SCRIPT_TRACKS.name.value(t))
const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));

// ---- the head follows the gliding airliner (24.4–31.6 s), lagging it slightly like a real glance
(function followAircraft() {
  const A = SCRIPT.aircraft.path, C = SCRIPT.camera;
  const ax = new SmoothTrack(A.map((k) => [k[0], k[1]])), ay = new SmoothTrack(A.map((k) => [k[0], k[2]])), az = new SmoothTrack(A.map((k) => [k[0], k[3]]));
  const cx = new Track(C.x), cz = new Track(C.z);
  let prevYaw = null;
  for (let t = 24.4; t <= 31.61; t += 0.6) {
    const tp = t - 0.3, dx = ax.value(tp) - cx.value(t), dz = az.value(tp) - cz.value(t), dy = ay.value(tp) - (LAYOUT.curbH + 1.7);
    let yaw = Math.atan2(-dx, -dz) * 180 / Math.PI;
    if (prevYaw !== null) while (yaw - prevYaw > 180) yaw -= 360;
    prevYaw = yaw;
    const pitch = Math.atan2(dy, Math.hypot(dx, dz)) * 180 / Math.PI;
    // keep the plane a little above frame centre so the city stays in shot
    C.yaw.push([t, yaw]);
    C.pitch.push([t, Math.min(pitch - 6, 40)]);
  }
})();
