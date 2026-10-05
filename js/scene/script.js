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
    { id: 'oxygen_drop',    time: 1.3,  label: 'O₂ crashes' },
    { id: 'flames_out',     time: 1.66, label: 'Flames die at ~15% O₂' },
    { id: 'engines_sputter',time: 1.72, label: 'Engines misfire (~14% O₂)' },
    { id: 'o2_zero',        time: 2.4,  label: 'O₂ = 0 % · pressure −23 % · ears pop' },
    { id: 'engines_dead',   time: 2.6,  label: 'Every combustion engine stopped' },
    { id: 'lighter',        time: 3.8,  label: 'Vendor tries a lighter — no flame' },
    { id: 'grinder_stop',   time: 4.6,  label: 'Worker stops grinding' },
    { id: 'car_bump',       time: 6.2,  label: 'Coasting car rear-ends the stalled car · alarm' },
    { id: 'ev_pass',        time: 8.6,  label: 'Electric car still driving' },
    { id: 'grid_fail',      time: 9.3,  label: 'Power grid fails (fuel-burning plants out)' },
    { id: 'hypoxia_begin',  time: 9.8,  label: 'Dizziness · tunnel vision' },
    { id: 'first_collapse', time: 12.0, label: 'First people collapse (~10 s without O₂)' },
    { id: 'phase1_end',     time: 15.0, label: 'End of Phase 1' },
  ],

  // Set to null to keep mains electricity on (not realistic: ~60 % of power is from burning fuel)
  grid: { fail: 9.3 },

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
      [0, 5], [1.3, 5], [1.7, 7], [2.4, 7.5], [3.0, 10.5], [3.5, 10.5], [4.2, 9.5], [4.6, 9.5], [5.3, 12], [6.25, 13],
      [6.9, 26], [7.2, 30], [7.5, 35], [7.8, 45], [8.0, 52], [8.2, 61], [8.4, 70], [8.6, 77], [8.85, 80, 'outQuad'],
      [9.4, 55, 'inOutSine'], [10.0, 25], [10.6, 12], [11.3, 11], [12.2, 9], [12.9, -2], [13.8, -4], [14.5, 2], [15, 4],
    ],
    pitch: [
      [0, 3], [1.3, 3], [2.4, 1], [3.0, -6], [3.5, -6], [4.2, 10.5], [4.6, 10.5], [5.3, 1.5], [6.25, 1],
      [7.5, 0], [8.2, -1.5], [8.85, -2], [9.4, 0], [10.0, 1.5], [10.6, -1], [11.3, -6], [12.2, -7],
      [12.9, -8], [13.8, -9], [15, -6],
    ],
    fov: [[0, 60], [2.4, 60], [2.47, 55.5, 'outQuad'], [3.1, 60, 'inOutSine'], [10, 60], [15, 56.5]],
    // sudden reactions: t, strength
    startles: [[1.68, 0.3], [2.42, 1.0], [6.22, 0.45]],
    // camera shakes: t, amplitude, decay seconds
    shakes: [[2.42, 0.9, 0.35], [6.22, 0.22, 0.3]],
    // late hypoxia: the viewer's knees start to give (metres lower) and the head rolls (deg)
    sag: [[0, 0], [12.5, 0], [15, 0.22, 'inQuad']],
    roll: [[0, 0], [12.5, 0], [15, 4.5, 'inQuad']],
  },

  /* ------------------------------------------------------------------
     HUD
     ------------------------------------------------------------------ */
  hud: {
    title: { in: 0.0, out: 1.75 },
    timerSwap: 3.3,            // the big O₂ readout turns into TIME WITHOUT OXYGEN
    oxygenRedBelow: 10,
    logs: [
      { t: 1.7,  until: 4.4,  text: 'FLAMES — OUT AT 15% O₂', tone: 'bad' },
      { t: 2.5,  until: 5.2,  text: 'AIR PRESSURE — DOWN 23%', tone: 'info' },
      { t: 3.2,  until: 5.9,  text: 'COMBUSTION ENGINES — STOPPED', tone: 'bad' },
      { t: 9.65, until: 12.3, text: 'POWER PLANTS BURN FUEL — GRID DOWN', tone: 'bad' },
      { t: 11.0, until: 13.6, text: 'NO FEELING OF SUFFOCATION', tone: 'info' },
      { t: 12.6, until: 15.2, text: 'BRAIN OXYGEN — SECONDS LEFT', tone: 'bad' },
    ],
    annotations: [
      { target: 'fx:grinder',   from: 3.95, to: 5.25,  title: 'BATTERY GRINDER',   status: 'SPINNING · SPARKS DIM', tone: 'info' },
      { target: 'veh:stallcar', from: 5.25, to: 6.4,  title: 'GASOLINE CAR',      status: 'ENGINE DEAD',           tone: 'bad' },
      { target: 'veh:ev',       from: 6.6,  to: 8.75, title: 'ELECTRIC CAR',      status: 'STILL DRIVING',         tone: 'good' },
    ],
  },

  /* ------------------------------------------------------------------
     Vehicles.
     lane: S1/S2 head away from camera, N1/N2 come toward it, E/W cross street.
     fail: when the engine starts to die (O₂ ~14 %)   stopS: where it rolls to rest (z = dir * s)
     ------------------------------------------------------------------ */
  vehicles: [
    // ---- heading away (S lanes, z = -s).  S2 is closed for road works near the viewer.
    { id: 'stallcar', type: 'sedan',  color: '#2b2f36', lane: 'S1', v0: 11,   fail: 1.72, stopS: 16,  decel: 2.2 },
    { id: 's1b',      type: 'hatch',  color: '#c9ccd1', lane: 'S1', v0: 11.5, fail: 1.8,  contact: { leader: 'stallcar', t: 6.2, vc: 2.3 } },
    { id: 's2behind', type: 'suv',    color: '#8a8f94', lane: 'S2', v0: 11,   fail: 1.85, stopS: -12, decel: 2.4 },
    { id: 'taxi',     type: 'taxi',   color: '#f2b705', lane: 'S2', v0: 11,   fail: 1.8,  stopS: 90,  decel: 2.2 },
    { id: 'van',      type: 'van',    color: '#e9e9e6', lane: 'S2', v0: 10.5, fail: 1.85, stopS: 120, decel: 2.3 },
    { id: 'sfar',     type: 'hatch',  color: '#6b1e1e', lane: 'S2', v0: 12,   fail: 1.9,  stopS: 165, decel: 2.0 },

    // ---- coming toward camera (N lanes, z = s)
    { id: 'moto',     type: 'moto',   color: '#b3121b', lane: 'N2', v0: 12.5, fail: 1.75, stopS: 32,   decel: 2.6, lateral: 0.55 },
    { id: 'n2p',      type: 'hatch',  color: '#4a4f57', lane: 'N2', v0: 11,   fail: 1.85, stopS: 16,   decel: 2.4 },
    { id: 'bus',      type: 'bus',    color: '#f4f4f2', lane: 'N2', v0: 9,    fail: 1.75, stopS: -24,  decel: 1.6 },
    { id: 'n2b',      type: 'suv',    color: '#2b2e33', lane: 'N2', v0: 10.5, fail: 1.85, stopS: -60,  decel: 2.4 },
    { id: 'n2far',    type: 'pickup', color: '#5a4636', lane: 'N2', v0: 12,   fail: 1.9,  stopS: -150, decel: 2.0 },
    { id: 'n1p',      type: 'sedan',  color: '#d8d8d4', lane: 'N1', v0: 12,   fail: 1.8,  stopS: 24,   decel: 2.4 },
    { id: 'n1a',      type: 'suv',    color: '#5d6b78', lane: 'N1', v0: 12,   fail: 1.75, stopS: -55,  decel: 2.6 },
    { id: 'n1b',      type: 'sedan',  color: '#7b2d26', lane: 'N1', v0: 11.5, fail: 1.85, stopS: -80,  decel: 2.0, swerve: { lat: 0.55, yaw: -7 } },
    { id: 'n1c',      type: 'hatch',  color: '#3d6e9e', lane: 'N1', v0: 12,   fail: 1.9,  stopS: -110, decel: 2.4 },
    { id: 'n1far',    type: 'van',    color: '#d7d2c4', lane: 'N1', v0: 12,   fail: 1.85, stopS: -170, decel: 2.0 },

    // ---- cross traffic waiting at the red light (idling, then dead)
    { id: 'xw1',      type: 'sedan',  color: '#55606b', lane: 'W1', s0: -13.8, v0: 0, fail: 1.8 },
    { id: 'xw2',      type: 'suv',    color: '#9aa3a8', lane: 'W1', s0: -20.6, v0: 0, fail: 1.85 },
    { id: 'xe1',      type: 'hatch',  color: '#e0ddd5', lane: 'E1', s0: -14.0, v0: 0, fail: 1.75 },

    // ---- the electric car: keeps driving, overtaking the dead queue on the wrong side, then passing the viewer
    {
      id: 'ev', type: 'ev', color: '#eef1f4', lane: 'PATH', passAt: { z: 2.4, t: 8.6 },
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
      states: [[0, 'grill'], [1.66, 'recoil'], [2.42, 'earPop'], [3.1, 'look'], [3.8, 'lighter'], [6.6, 'look'], [10.6, 'handHead'], [11.7, 'lean'], [13.3, 'collapse']] },
    { id: 'customer', look: 'casual1', y: 0.15, path: [[0, 8.85, -3.9]], face: 90,
      states: [[0, 'phone'], [2.42, 'earPop'], [3.1, 'look'], [4.6, 'phone'], [7.0, 'look'], [10.9, 'handHead'], [12.5, 'collapse']] },
    { id: 'worker',   look: 'worker',  y: 4.06, path: [[0, 6.3, -14.0]], face: -90,
      states: [[0, 'grind'], [2.42, 'flinch'], [2.85, 'grind'], [4.6, 'lowerTool'], [5.2, 'look'], [11.0, 'handHead'], [12.0, 'collapse']] },
    { id: 'toward',   look: 'casual2', y: 0.15, path: [[0, 10.45, -17.5], [2.42, 10.45, -14.6], [3.4, 10.45, -14.6], [8.6, 10.45, -7.6]],
      states: [[0, 'walk'], [2.42, 'earPop'], [3.2, 'look'], [3.4, 'walk'], [8.6, 'look'], [11.5, 'handHead'], [12.9, 'collapse']] },
    { id: 'away',     look: 'casual3', y: 0.15, path: [[0, 11.45, -1.2], [2.42, 11.45, -4.1], [3.6, 11.45, -4.1], [7.0, 11.45, -8.3]],
      states: [[0, 'walk'], [2.42, 'earPop'], [3.2, 'look'], [3.6, 'walk'], [7.0, 'look'], [11.2, 'stumble'], [13.7, 'collapse']] },
    { id: 'L1',       look: 'casual4', y: 0.15, path: [[0, -8.7, -34], [2.42, -8.7, -31], [3.6, -8.7, -31], [11.5, -8.7, -22]],
      states: [[0, 'walk'], [2.42, 'earPop'], [3.2, 'look'], [3.6, 'walk'], [11.5, 'stumble'], [13.6, 'collapse']] },
    { id: 'L2',       look: 'casual5', y: 0.15, path: [[0, -10.7, -4], [2.42, -10.7, -6.9], [3.5, -10.7, -6.9], [10.6, -10.7, -15]],
      states: [[0, 'walk'], [2.42, 'earPop'], [3.2, 'look'], [3.5, 'walk'], [12.8, 'stumble'], [14.0, 'sitGround']] },
    { id: 'L3',       look: 'casual6', y: 0.15, path: [[0, -10.72, -21]], face: -90, seat: 0.45,
      states: [[0, 'sit'], [2.42, 'earPopSit'], [3.3, 'sit'], [12.8, 'sitSlump']] },
    { id: 'L4',       look: 'casual7', y: 0.15, path: [[0, -9.9, -63], [2.42, -9.9, -60], [3.6, -9.9, -60], [11, -9.9, -50]],
      states: [[0, 'walk'], [2.42, 'earPop'], [3.3, 'look'], [3.6, 'walk'], [12.0, 'stumble'], [13.9, 'collapse']] },
    { id: 'L5',       look: 'casual8', y: 0.15, path: [[0, -10.6, -64.2], [2.42, -10.6, -61.2], [3.6, -10.6, -61.2], [11, -10.6, -51.3]],
      states: [[0, 'walk'], [2.42, 'earPop'], [3.3, 'look'], [3.6, 'walk'], [12.4, 'sitGround']] },
    { id: 'C1',       look: 'casual2', y: 0.15, path: [[0, -10.22, -28.0]], face: 90, seat: 0.45,
      states: [[0, 'sit'], [2.42, 'earPopSit'], [3.3, 'sit'], [12.4, 'sitSlump']] },
    { id: 'C2',       look: 'casual5', y: 0.15, path: [[0, -11.58, -28.0]], face: -90, seat: 0.45,
      states: [[0, 'sit'], [2.42, 'earPopSit'], [3.3, 'sit'], [13.1, 'sitSlump']] },
    { id: 'C3',       look: 'casual3', y: 0.15, path: [[0, -10.22, -30.6]], face: 90, seat: 0.45,
      states: [[0, 'sit'], [2.42, 'earPopSit'], [3.3, 'sit'], [13.8, 'sitSlump']] },
    { id: 'R1',       look: 'casual1', y: 0.15, path: [[0, 9.9, -62], [2.42, 9.9, -59], [3.6, 9.9, -59], [11, 9.9, -49]],
      states: [[0, 'walk'], [2.42, 'earPop'], [3.3, 'look'], [3.6, 'walk'], [12.2, 'stumble'], [14.2, 'collapse']] },
  ],
};

// Track objects built from SCRIPT.tracks (used everywhere as SCRIPT_TRACKS.name.value(t))
const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
