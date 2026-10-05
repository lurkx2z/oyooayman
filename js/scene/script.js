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
    { id: 'normal_world',   time: 0.0,  label: 'Normal day' },
    { id: 'oxygen_drop',    time: 2.0,  label: 'O₂ starts falling' },
    { id: 'flames_out',     time: 2.55, label: 'Flames die (~15% O₂)' },
    { id: 'engines_sputter',time: 2.7,  label: 'Engines misfire' },
    { id: 'o2_zero',        time: 3.2,  label: 'O₂ = 0 % · air pressure −21 %' },
    { id: 'engines_dead',   time: 4.2,  label: 'Combustion engines dead' },
    { id: 'grinder_stop',   time: 4.6,  label: 'Worker stops grinding' },
    { id: 'vehicles_coast', time: 5.6,  label: 'Traffic coasting to a stop' },
    { id: 'car_bump',       time: 7.4,  label: 'Fender-bender · car alarm' },
    { id: 'ev_pass',        time: 8.4,  label: 'Electric car keeps driving' },
    { id: 'hypoxia_begin',  time: 9.6,  label: 'Hypoxia begins' },
    { id: 'people_react',   time: 10.6, label: 'People stumble' },
    { id: 'phase1_end',     time: 15.0, label: 'End of Phase 1' },
  ],

  /* ------------------------------------------------------------------
     Value curves.  [time, value, ease-into-this-key]
     ------------------------------------------------------------------ */
  tracks: {
    oxygen: [[0, 21.0], [2.0, 21.0], [2.35, 15.2, 'inQuad'], [2.7, 8.1, 'linear'], [2.98, 3.0, 'linear'], [3.2, 0, 'outQuad']],
    // 0 … 1 : how strongly the viewer is affected (drives visual + audio effects)
    hypoxia: [[0, 0], [9.6, 0], [12.0, 0.25, 'inQuad'], [15, 0.62, 'linear']],
    breathRate: [[0, 14], [9.0, 14], [15, 30, 'inQuad']],          // breaths per minute
    heartRate: [[0, 72], [9.4, 76], [15, 122, 'inQuad']],          // beats per minute
    // sky gets slightly darker: O₂ is ~21 % of the molecules that scatter blue light
    skyO2: [[0, 1], [2.0, 1], [3.2, 0, 'inOutSine']],
  },

  /* ------------------------------------------------------------------
     First-person camera.  yaw: + = turn LEFT, − = turn RIGHT (degrees)
     ------------------------------------------------------------------ */
  camera: {
    x: [[0, 8.3], [8.0, 8.3], [9.0, 8.05], [12.6, 8.05], [13.4, 8.25]],
    z: [[0, 3.5], [2.0, 1.2, 'linear'], [2.9, 0.68, 'outQuad'], [8.0, 0.68], [9.0, 0.25], [12.6, 0.25], [13.4, 0.5]],
    yaw: [
      [0, -2], [2.0, -3.5], [3.15, -4], [4.1, -12], [4.8, -14], [5.3, -14], [6.4, 17], [8.0, 20],
      [8.42, 50, 'outCubic'], [9.4, 27, 'inOutSine'], [10.3, 9], [10.9, 2],
      [11.8, -11], [12.8, -14], [13.8, -9], [14.5, -3], [15, 1],
    ],
    pitch: [
      [0, 6.5], [2.0, 6.8], [3.2, 6.8], [4.1, -2], [4.8, 9], [5.3, 8.5], [6.4, 2.5], [8.0, 2.0],
      [8.42, -0.5], [10.3, 0.5], [11.8, -9], [12.8, -12.5], [13.8, -10], [15, -5],
    ],
    fov: [[0, 70], [3.2, 70], [3.27, 67.8, 'outQuad'], [3.9, 70, 'inOutSine'], [10, 70], [15, 66.5]],
    // sudden reactions: t, strength
    startles: [[2.56, 0.35], [3.22, 1.0], [7.42, 0.25], [8.38, 0.3]],
    // camera shakes: t, amplitude, decay seconds
    shakes: [[3.22, 0.9, 0.38], [7.42, 0.12, 0.3]],
  },

  /* ------------------------------------------------------------------
     HUD
     ------------------------------------------------------------------ */
  hud: {
    title: { in: 0.0, out: 2.35 },
    timerFrom: 9.4,
    oxygenRedBelow: 10,
    logs: [
      { t: 2.6,  until: 5.4,  text: 'OPEN FLAMES — OUT', tone: 'bad' },
      { t: 3.3,  until: 6.2,  text: 'AIR PRESSURE — DOWN 21%', tone: 'info' },
      { t: 4.3,  until: 7.4,  text: 'COMBUSTION ENGINES — FAILING', tone: 'bad' },
      { t: 8.6,  until: 11.4, text: 'ELECTRIC MOTORS — UNAFFECTED', tone: 'good' },
      { t: 10.1, until: 13.4, text: 'BLOOD OXYGEN — FALLING', tone: 'bad' },
      { t: 12.2, until: 15.2, text: 'BRAIN O₂ RESERVE — SECONDS', tone: 'bad' },
    ],
    annotations: [
      { target: 'fx:grinder',   from: 3.45, to: 5.4,  title: 'ELECTRIC GRINDER', status: 'SPINNING · SPARKS DIM', tone: 'info' },
      { target: 'veh:stallcar', from: 5.7,  to: 8.0,  title: 'GASOLINE CAR',     status: 'ENGINE STALLED',        tone: 'bad' },
      { target: 'veh:ev',       from: 8.55, to: 10.9, title: 'ELECTRIC CAR',     status: 'STILL DRIVING',         tone: 'good' },
    ],
  },

  /* ------------------------------------------------------------------
     Vehicles.
     lane: S1/S2 head away from camera, N1/N2 come toward it, E/W cross street.
     s0  : position along the lane at t=0 (z = dir * s for avenue lanes)
     fail: when the engine dies (sputter starts)   stopS: where it rolls to rest
     ------------------------------------------------------------------ */
  vehicles: [
    // ---- heading away (S lanes, z = -s)
    { id: 'stallcar', type: 'sedan',  color: '#2b2f36', lane: 'S2', v0: 11,   fail: 2.7,  stopS: 30,  decel: 2.5 },
    { id: 's2behind', type: 'suv',    color: '#8a8f94', lane: 'S2', v0: 11,   fail: 3.0,  stopS: -12, decel: 2.4 },
    { id: 'taxi',     type: 'taxi',   color: '#f2b705', lane: 'S2', v0: 11,   fail: 2.9,  stopS: 72,  decel: 2.2 },
    { id: 'van',      type: 'van',    color: '#e9e9e6', lane: 'S2', v0: 10.5, fail: 2.95, stopS: 104, decel: 2.3 },
    { id: 'sfar',     type: 'hatch',  color: '#6b1e1e', lane: 'S2', v0: 12,   fail: 3.0,  stopS: 150, decel: 2.0 },
    { id: 'moto',     type: 'moto',   color: '#b3121b', lane: 'S1', v0: 12.5, fail: 2.75, stopS: 33,  decel: 2.4, lateral: 0.55 },
    { id: 's1b',      type: 'hatch',  color: '#c9ccd1', lane: 'S1', v0: 11,   fail: 3.05, stopS: 14,  decel: 2.6 },
    { id: 's1far',    type: 'pickup', color: '#2f4f3a', lane: 'S1', v0: 12,   fail: 2.9,  stopS: 118, decel: 2.2 },
    { id: 's1far2',   type: 'sedan',  color: '#111214', lane: 'S1', v0: 12,   fail: 3.1,  stopS: 170, decel: 2.0 },

    // ---- coming toward camera (N lanes, z = s)
    { id: 'n1p',      type: 'sedan',  color: '#d8d8d4', lane: 'N1', v0: 12,   fail: 2.9,  stopS: 24,    decel: 2.4 },
    { id: 'n1a',      type: 'suv',    color: '#5d6b78', lane: 'N1', v0: 12,   fail: 2.8,  stopS: -7,    decel: 2.6 },
    { id: 'n1b',      type: 'sedan',  color: '#7b2d26', lane: 'N1', v0: 11.5, fail: 3.0,  stopS: -17.5, decel: 2.0, swerve: { lat: 0.55, yaw: -7 } },
    { id: 'n1c',      type: 'hatch',  color: '#3d6e9e', lane: 'N1', v0: 12,   fail: 3.1,  stopS: -66,   decel: 2.4 },
    { id: 'n1far',    type: 'van',    color: '#d7d2c4', lane: 'N1', v0: 12,   fail: 3.0,  stopS: -140,  decel: 2.0 },
    { id: 'n2p',      type: 'hatch',  color: '#4a4f57', lane: 'N2', v0: 11,   fail: 3.0,  stopS: 34,    decel: 2.4 },
    { id: 'bus',      type: 'bus',    color: '#f4f4f2', lane: 'N2', v0: 9,    fail: 2.85, stopS: -14,   decel: 1.8 },
    { id: 'suv',      type: 'suv',    color: '#2b2e33', lane: 'N2', v0: 10.5, fail: 3.0,  stopS: -44.5, decel: 3.2 },
    { id: 'bumper',   type: 'sedan',  color: '#9c9fa3', lane: 'N2', v0: 12.5, fail: 3.0,  contact: { leader: 'suv', t: 7.4, vc: 1.7 } },
    { id: 'n2far',    type: 'pickup', color: '#5a4636', lane: 'N2', v0: 12,   fail: 3.1,  stopS: -150,  decel: 2.0 },

    // ---- car turning left across the intersection that dies mid-turn (s = distance along its turn path)
    { id: 'turner',   type: 'sedan',  color: '#c23b22', lane: 'TURN', v0: 8, fail: 2.9, stopS: 25.5, decel: 2.6 },

    // ---- cross traffic waiting at the red light (idling, then dead)
    { id: 'xw1',      type: 'sedan',  color: '#55606b', lane: 'W1', s0: -13.8, v0: 0 },
    { id: 'xw2',      type: 'suv',    color: '#9aa3a8', lane: 'W1', s0: -20.6, v0: 0 },
    { id: 'xe1',      type: 'hatch',  color: '#e0ddd5', lane: 'E1', s0: -14.0, v0: 0 },

    // ---- the electric car: keeps driving, weaving through the dead traffic
    {
      id: 'ev', type: 'ev', color: '#eef1f4', lane: 'PATH',
      path: [[1.75, 67.2], [1.75, 4], [4.8, -8], [4.8, -18], [1.75, -25.5], [0.55, -31], [0.55, -35.5], [4.0, -42.5], [4.8, -50], [4.8, -60], [1.75, -68], [1.75, -420]],
      speed: [[0, 10], [3.5, 10], [6.0, 4.2], [7.0, 4.2], [8.0, 8.6], [15, 8.6]],
    },
  ],

  /* ------------------------------------------------------------------
     People.  face: 0 = looking down the street (-Z), 90 = left (-X), -90 = right (+X)
     path: [[t, x, z], …]   states: [[t, action], …]
     ------------------------------------------------------------------ */
  people: [
    { id: 'vendor',   look: 'vendor',  y: 0.15, path: [[0, 11.9, -8.6]], face: 90,
      states: [[0, 'grill'], [2.55, 'recoil'], [3.25, 'look'], [10.4, 'handHead'], [11.4, 'lean'], [12.7, 'sitGround']] },
    { id: 'customer', look: 'casual1', y: 0.15, path: [[0, 9.95, -8.7]], face: -90,
      states: [[0, 'phone'], [2.6, 'recoil'], [3.2, 'look'], [11.2, 'stumble'], [12.4, 'kneel']] },
    { id: 'worker',   look: 'worker',  y: 4.55, path: [[0, 14.15, -21.5]], face: 90,
      states: [[0, 'grind'], [4.6, 'lowerTool'], [5.3, 'look'], [10.6, 'handHead'], [11.6, 'sitGround']] },
    { id: 'toward',   look: 'casual2', y: 0.15, path: [[0, 9.0, -14.6], [10.1, 9.0, -3.4]],
      states: [[0, 'walk'], [10.1, 'handHead'], [11.1, 'stumble'], [12.1, 'kneel'], [13.5, 'lie']] },
    { id: 'away',     look: 'casual3', y: 0.15, path: [[0, 10.0, -11.4], [4.3, 10.0, -17.2], [4.9, 10.0, -17.5]],
      states: [[0, 'walk'], [4.6, 'look'], [10.9, 'stumble'], [12.2, 'kneel'], [14.0, 'lie']] },
    { id: 'L1',       look: 'casual4', y: 0.15, path: [[0, -8.7, -34], [10.3, -8.7, -21]],
      states: [[0, 'walk'], [10.3, 'handHead'], [11.3, 'stumble'], [12.3, 'kneel'], [13.7, 'lie']] },
    { id: 'L2',       look: 'casual5', y: 0.15, path: [[0, -10.7, -4], [10.6, -10.7, -17.6]],
      states: [[0, 'walk'], [10.6, 'stumble'], [11.8, 'sitGround']] },
    { id: 'L3',       look: 'casual6', y: 0.15, path: [[0, -10.72, -21]], face: -90, seat: 0.45,
      states: [[0, 'sit'], [11.8, 'sitSlump']] },
    { id: 'L4',       look: 'casual7', y: 0.15, path: [[0, -9.9, -63], [11, -9.9, -49]],
      states: [[0, 'walk'], [11.0, 'stumble'], [12.6, 'kneel']] },
    { id: 'L5',       look: 'casual8', y: 0.15, path: [[0, -10.6, -64.2], [11, -10.6, -50.3]],
      states: [[0, 'walk'], [11.2, 'stumble'], [12.4, 'sitGround']] },
    { id: 'C1',       look: 'casual2', y: 0.15, path: [[0, -10.22, -28.0]], face: 90, seat: 0.45,
      states: [[0, 'sit'], [12.3, 'sitSlump']] },
    { id: 'C2',       look: 'casual5', y: 0.15, path: [[0, -11.58, -28.0]], face: -90, seat: 0.45,
      states: [[0, 'sit'], [13.0, 'sitSlump']] },
    { id: 'C3',       look: 'casual3', y: 0.15, path: [[0, -10.22, -30.6]], face: 90, seat: 0.45,
      states: [[0, 'sit'], [12.0, 'sitSlump']] },
    { id: 'R1',       look: 'casual1', y: 0.15, path: [[0, 9.9, -62], [11, 9.9, -48.5]],
      states: [[0, 'walk'], [11.0, 'stumble'], [12.5, 'kneel']] },
  ],
};

// Track objects built from SCRIPT.tracks (used everywhere as SCRIPT_TRACKS.name.value(t))
const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
