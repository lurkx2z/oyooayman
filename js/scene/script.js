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
    { id: 'phase1_end',     time: 15.0, label: 'End of Phase 1 (≈4 s before you black out)' },
  ],

  // Set to null to keep mains electricity on (not realistic: ~60 % of power comes from burning fuel)
  grid: { fail: 6.3 },

  // the viewer's own hands (first-person)
  hands: {
    // first-person hands stay out of Phase 1 until a proper low-poly arm model is available
    // (the old poses: [1.85, 'ear'], [2.75, 'hidden'], [3.4, 'lighter'], [5.3, 'hidden'])
    right: [[0, 'hidden']],
    left: [[0, 'hidden']],
    flicks: [],                      // viewer's piezo clicks (e.g. [3.95, 4.45, 4.95]); the vendor's flint lighter carries this beat
  },

  /* ------------------------------------------------------------------
     Value curves.  [time, value, ease-into-this-key]
     ------------------------------------------------------------------ */
  tracks: {
    // the counter starts creeping down on the very first frame, then crashes
    oxygen: [[0, 21.0], [0.3, 21.0], [1.3, 20.3, 'inQuad'], [1.66, 15.0, 'inQuad'], [1.95, 8.0, 'linear'], [2.2, 3.0, 'linear'], [2.4, 0, 'outQuad']],
    // 0 … 1 : how strongly the viewer is affected (drives visual + audio effects)
    hypoxia: [[0, 0], [9.8, 0], [12.0, 0.28, 'inQuad'], [15, 0.72, 'linear']],
    breathRate: [[0, 14], [9.0, 14], [15, 22, 'inQuad']],          // breaths per minute (no gasping: CO₂ still leaves)
    heartRate: [[0, 72], [9.4, 76], [15, 112, 'inQuad']],          // beats per minute
    // sky gets slightly darker: O₂ is ~21 % of the molecules that scatter blue light
    skyO2: [[0, 1], [1.3, 1], [2.4, 0, 'inOutSine']],
  },

  /* ------------------------------------------------------------------
     First-person camera.  yaw: + = turn LEFT, − = turn RIGHT (degrees)
     ------------------------------------------------------------------ */
  camera: {
    x: [[0, 9.4], [9.6, 9.4], [10.4, 9.25], [13.6, 9.25], [14.6, 9.45]],
    z: [[0, 5.2], [1.9, 2.8, 'linear'], [2.6, 2.4, 'outQuad'], [13.6, 2.4], [14.6, 2.65]],
    yaw: [
      [0, 5], [1.3, 5], [1.7, 7], [2.4, 7.5], [3.2, 7], [3.7, 9.5, 'inOutSine'], [5.2, 10.5], [5.75, 9.5], [6.1, 9.5],
      [6.55, 21, 'inOutCubic'], [7.1, 22], [7.3, 30], [7.5, 35], [7.8, 45], [8.0, 52], [8.2, 61], [8.4, 70], [8.6, 77], [8.85, 80, 'outQuad'],
      [9.5, 12, 'inOutCubic'], [10.5, 10], [11.4, 8], [12.0, 9.5], [13.0, 9.5], [13.6, 6], [14.5, 2], [15, 3],
    ],
    pitch: [
      [0, 4], [1.3, 4], [1.7, 2], [2.4, 1], [3.2, -2], [3.7, -5, 'inOutSine'], [5.2, -4.5], [5.75, 13], [6.1, 12.5],
      [6.55, 3], [7.1, 2.5], [7.5, 0], [8.2, -1.5], [8.85, -2], [9.5, -5], [10.5, -6], [11.4, -5], [12.0, 12.5],
      [13.0, 11.5], [13.6, -7], [14.5, -9], [15, -8],
    ],
    fov: [[0, 60], [2.03, 60], [2.1, 55.5, 'outQuad'], [2.8, 60, 'inOutSine'], [10, 60], [15, 56.5]],
    // sudden reactions: t, strength  (small pops while O₂ falls, the big one at 0 %)
    startles: [[1.55, 0.2], [1.82, 0.6], [2.05, 1.0], [6.77, 0.5]],
    // camera shakes: t, amplitude, decay seconds
    shakes: [[2.05, 0.85, 0.35], [6.77, 0.24, 0.3]],
    // late hypoxia: the viewer's knees start to go (metres lower) and the head rolls (deg)
    sag: [[0, 0], [12.5, 0], [15, 0.2, 'inQuad']],
    roll: [[0, 0], [12.5, 0], [15, 4.0, 'inQuad']],
  },

  /* ------------------------------------------------------------------
     HUD
     ------------------------------------------------------------------ */
  hud: {
    title: { in: 0.15, out: 1.75 },     // small "WHAT IF…" then "oxygen disappeared?"
    timerFrom: 9.6,                     // a second, temporary counter appears when it matters
    oxygenRedBelow: 10,
    // one restrained caption at a time — the world shows everything else
    captions: [
      { t: 1.95, until: 3.85, text: 'The flames went out first.' },
      { t: 6.15, until: 7.85, text: 'Then the engines. Then the power.' },
      { t: 8.05, until: 9.75, text: 'Only electric things kept moving.' },
      { t: 10.3, until: 12.4, text: 'No one felt short of breath.' },
      { t: 12.9, until: 15.0, text: 'That was the dangerous part.' },
    ],
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
      states: [[0, 'walk'], [1.85, 'earPop'], [3.2, 'look'], [3.6, 'walk'], [12.4, 'stumble'], [14.2, 'kneel']] },
    { id: 'L2',       look: 'casual5', y: 0.15, path: [[0, -10.7, -4], [2.42, -10.7, -6.9], [3.5, -10.7, -6.9], [10.6, -10.7, -15]],
      states: [[0, 'walk'], [1.85, 'earPop'], [3.2, 'look'], [3.5, 'walk'], [13.0, 'stumble'], [14.2, 'sitGround']] },
    { id: 'L3',       look: 'casual6', y: 0.15, path: [[0, -10.72, -21]], face: -90, seat: 0.45,
      states: [[0, 'sit'], [1.85, 'earPopSit'], [3.3, 'sit']] },
    { id: 'L4',       look: 'casual7', y: 0.15, path: [[0, -9.9, -63], [2.42, -9.9, -60], [3.6, -9.9, -60], [11, -9.9, -50]],
      states: [[0, 'walk'], [1.85, 'earPop'], [3.3, 'look'], [3.6, 'walk'], [12.6, 'stumble']] },
    { id: 'L5',       look: 'casual8', y: 0.15, path: [[0, -10.6, -64.2], [2.42, -10.6, -61.2], [3.6, -10.6, -61.2], [11, -10.6, -51.3]],
      states: [[0, 'walk'], [1.85, 'earPop'], [3.3, 'look'], [3.6, 'walk'], [13.2, 'stumble']] },
    { id: 'C1',       look: 'casual2', y: 0.15, path: [[0, -10.22, -28.0]], face: 90, seat: 0.45,
      states: [[0, 'sit'], [1.85, 'earPopSit'], [3.3, 'sit']] },
    { id: 'C2',       look: 'casual5', y: 0.15, path: [[0, -11.58, -28.0]], face: -90, seat: 0.45,
      states: [[0, 'sit'], [1.85, 'earPopSit'], [3.3, 'sit']] },
    { id: 'C3',       look: 'casual3', y: 0.15, path: [[0, -10.22, -30.6]], face: 90, seat: 0.45,
      states: [[0, 'sit'], [1.85, 'earPopSit'], [3.3, 'sit']] },
    { id: 'R1',       look: 'casual1', y: 0.15, path: [[0, 9.9, -62], [2.42, 9.9, -59], [3.6, 9.9, -59], [11, 9.9, -49]],
      states: [[0, 'walk'], [1.85, 'earPop'], [3.3, 'look'], [3.6, 'walk'], [12.8, 'stumble']] },
  ],
};

// Track objects built from SCRIPT.tracks (used everywhere as SCRIPT_TRACKS.name.value(t))
const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
