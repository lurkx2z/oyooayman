/* =====================================================================
   SCRIPT — "What if men suddenly disappeared from the world?"
   ★ The one file to edit for timing: the beats, the words, the readouts, your head (camera), your hands.
   Everything is a pure function of STORY time (CONFIG.edit cuts the final film from it). Plan: films/men-disappear/PLAN.md

   THE RULE: at one instant every adult man (18+) on Earth vanishes, with whatever he is wearing. Anything he was
   holding falls. Boys stay. Nothing else changes: machines keep doing whatever they were last told to do.

   THE PLACE: the front car of a commuter train on a harbour viaduct, late afternoon. Train-local metres: x across the
   car (+x = right-hand windows, the harbour), y up from the car floor, z along the car (0 = the nose, +z = toward
   the back; the train runs toward world −z). World: water at y 0, rail head at MD_G.rail, track centred on x 0.
   ===================================================================== */

CONFIG.duration = 72.0;          // story length (the film is cut from it with CONFIG.edit)
CONFIG.seed = 20261009;
Object.assign(CONFIG.camera, {
  cameraHeight: 1.64, walkSpeed: 1.0, bobStrength: 0.012, bobFrequency: 1.8,
  breathingStrength: 0.0045, breathRate: 16, fov: 64, shakeStrength: 1.0,
});
CONFIG.render.shadowMapSize = 2048;

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (story seconds). v3: the cascade. The first half is real time (seconds after the vanish); after the
// bridge falls the film jumps forward (+20 MIN, +6 HOURS, +2 DAYS, +2 WEEKS) to what fails next.
// ---------------------------------------------------------------------------------------------------------------------
const MD = {
  title: [-0.6, 3.9],
  vanish: 1.8,            // every adult man is gone (one frame)
  brake: 4.6,             // the dead man's switch: the handle has been released for 2.8 s → emergency brake
  road: [9.2, 15.6],      // you lean to the left window: the cars below have no drivers
  cruise: 14.6,           // the SUV on cruise control reaches the parked van
  plane: [15.6, 21.4],    // the right-hand window: an airliner on final approach, nobody flying it
  planeHit: 19.9,         // it flies into the harbour short of the runway
  harbour: 21.4,          // the ship, very close now
  tele: [23.3, 25.8],     // telephoto: its wheelhouse is empty
  wheel: [26.8, 29.4],    // inside the empty wheelhouse
  hit: 31.0,              // the bow hits the pier
  drones: [[26.8, 29.4], [29.4, 32.2], [32.2, 36.2]],
  fires: [36.2, 42.2],    // +20 MIN: fires nobody puts out
  fireSt: [39.0, 40.9],   // insert: the fire station (alarm, nobody)
  grid: [42.2, 50.6],     // +6 HOURS: dusk; the grid
  gridRoom: [44.4, 46.5], // insert: the grid control room (alarms, empty chairs)
  blackout: 47.3,         // the city goes dark, district by district
  water: [50.6, 56.2],    // +2 DAYS: no pumps; sewage in the harbour
  food: [56.2, 58.6],     // +2 WEEKS: insert: the supermarket
  nuke: [58.6, 62.8],     // +2 WEEKS: the power station across the harbour
  nukeBang: 60.7,         // the reactor building's roof blows (hydrogen, as at Fukushima)
  end: [62.8, 72.0],      // the close: the dark harbour city
  line: [63.4, 67.9],
  births: [66.2, 69.6],
  note: [68.2, 71.4],
  fin: 72.0,
  retreat: 24.0,           // the passengers move to the back of the car (off camera after the wheelhouse cut)
};
MD.montage = [MD.fireSt, MD.gridRoom, MD.food];
// the world clock: minutes since the vanish (real time, then the jumps)
const MD_JUMPS = [[MD.fires[0], 20, '+20 MINUTES'], [MD.grid[0], 6 * 60, '+6 HOURS'], [MD.water[0], 2 * 24 * 60, '+2 DAYS'], [MD.food[0], 14 * 24 * 60, '+2 WEEKS']];
function mdWorldMin(t) {
  let base = Math.max(0, t - MD.vanish) / 60, t0 = MD.vanish;
  for (const [tj, m] of MD_JUMPS) if (t >= tj) { base = m; t0 = tj; }
  return t < MD_JUMPS[0][0] ? base : base + (t - t0) / 60 * (t >= MD.grid[0] && t < MD.water[0] ? 6 : 1);   // the dusk runs a little faster
}

// ---------------------------------------------------------------------------------------------------------------------
// THE GEOMETRY (metres)
// ---------------------------------------------------------------------------------------------------------------------
const MD_G = {
  rail: 24.0,             // rail head above the water
  floor: 1.1,             // car floor above the rail head
  carLen: 20.0, carW: 2.9, carH: 2.25,
  cab: 2.4,               // the cab bulkhead (train-local z)
  span: 60,               // viaduct spans; piers at z = k·60
  pierHit: -60,           // the pier the ship hits (the span from 0 to −60 falls)
  stopZ: 4.0,             // where the train's nose comes to rest (world z): 4 m short of the span that falls
  shoreZ: 22,             // left side: land (the waterfront road) for z > shoreZ, the inner basin beyond
  roadX: -30,             // the waterfront road's centre line (world x)
  quay: 2.4,              // land and road height above the water
  trackX: -4.4,           // the train runs on the viaduct's left-hand track (the land side)
};
MD_G.floorY = MD_G.rail + MD_G.floor;

// the train: 58 km/h → coasting with the driver gone → emergency brake when the dead man's switch trips.
// Precomputed (1/240 s) and sampled: MD_TRAIN.s(t) = metres travelled since t = 0.
const MD_TRAIN = (() => {
  const v0 = 16.0, aMax = 1.4, dt = 1 / 240, N = Math.ceil(CONFIG.duration / dt) + 2;
  const S = new Float32Array(N), V = new Float32Array(N), A = new Float32Array(N);
  let s = 0, v = v0;
  for (let i = 0; i < N; i++) {
    const t = i * dt;
    // the brake builds over 0.6 s (air brakes), eases off in the last 0.4 m/s (the final jolt is a short spring-back)
    let a = 0;
    if (v <= 0) a = 0;
    else if (t > MD.brake) a = aMax * MathX.smooth(t, MD.brake, MD.brake + 0.6) * (0.75 + 0.25 * MathX.smooth(v, 0.0, 0.8));
    else if (t > MD.vanish) a = 0.05;                  // power cut with the driver gone: it coasts (rolling resistance)
    S[i] = s; V[i] = v; A[i] = a;
    v = Math.max(0, v - a * dt); s += v * dt;
  }
  const at = (arr, t) => { const f = MathX.clamp(t / dt, 0, N - 1.001), i = Math.floor(f); return arr[i] + (arr[i + 1] - arr[i]) * (f - i); };
  const total = S[N - 1];
  let stop = 0; for (let i = 0; i < N; i++) if (V[i] <= 0) { stop = i * dt; break; }
  return { s: (t) => at(S, t), v: (t) => at(V, t), a: (t) => at(A, t), total, stop, v0 };
})();
MD.stop = MD_TRAIN.stop;
// the nose's world z at time t (the train runs toward −z and stops at MD_G.stopZ)
function mdNoseZ(t) { return MD_G.stopZ + MD_TRAIN.total - MD_TRAIN.s(t); }

// the brake's surge felt in your body: + = thrown forward (toward the nose)
function mdSurge(t) {
  const on = MD_TRAIN.a(t) / 1.4;
  const jolt = MathX.impulse(t, MD.stop, 0.25) * Math.sin(Math.max(0, t - MD.stop) * 9) * 0.6;   // the spring-back as it stops
  return on - jolt;
}

// ---------------------------------------------------------------------------------------------------------------------
// numbers on screen (sources and arithmetic: films/men-disappear/PLAN.md § 1)
// ---------------------------------------------------------------------------------------------------------------------
function mdPop(t) {
  // UN WPP 2024 medium projection for late 2026 ≈ 8.30 billion; ~2.4 people a second net growth
  const base = 8301468210 + Math.floor(Math.max(0, t) * 2.4);
  const gone = 2921600480;                             // men aged 18+ ≈ 35.2 % of everyone
  const n = t < MD.vanish ? base : base - gone;
  return n.toLocaleString('en-US');
}
function mdTrainKmh(t) { return Math.round(MD_TRAIN.v(t) * 3.6); }

// the shares on screen (sources: films/men-disappear/PLAN.md § 1). Rounded; see the plan for the exact figures.
const MD_STAT = {
  pilots: '≈ 94 %', fire: '94 %', power: '93 %', lines: '97 %', water: '94 %', trucks: '92 %', diesel: '7 DAYS', births: '≈ 360,000',
  note: 'SHARES: ISWAP · ICS/BIMCO 2021 · US BLS & CENSUS ACS 2024 · NRC · UN WPP 2024.<br>FIGURES ARE ESTIMATES. EVENTS COMPRESSED FOR THIS SIMULATION. NOT A PREDICTION.',
};

const SCRIPT = {
  meta: { title: 'WHAT IF MEN SUDDENLY DISAPPEARED FROM THE WORLD?', wav: 'men-disappear-soundtrack.wav' },

  events: [
    { id: 'start', time: 0.0, label: 'The train; the title' },
    { id: 'vanish', time: MD.vanish, label: 'Every man vanishes' },
    { id: 'brake', time: MD.brake, label: 'Dead man’s switch: emergency brake' },
    { id: 'road', time: MD.road[0], label: 'The road: nobody at the wheel' },
    { id: 'plane', time: MD.plane[0], label: 'A plane on final approach' },
    { id: 'ship', time: MD.harbour, label: 'The ship' },
    { id: 'hit', time: MD.hit, label: 'The bridge' },
    { id: 'fires', time: MD.fires[0], label: '+20 min: fires' },
    { id: 'grid', time: MD.grid[0], label: '+6 h: the grid' },
    { id: 'water', time: MD.water[0], label: '+2 days: water' },
    { id: 'food', time: MD.food[0], label: '+2 weeks: food, the reactor' },
    { id: 'end', time: MD.end[0], label: 'The close' },
  ],

  // your head, in TRAIN-LOCAL metres (film.js adds the train's position). Where you look: MD_LOOK in film.js.
  // From MD.wheel on, every shot is an outside camera (MD_DRONE in film.js).
  camera: {
    baseY: MD_G.floorY,
    // the road beat: kneeling on the empty seat at the left-hand window; then across the aisle to the right-hand window
    x: [[0, -0.45], [MD.road[0] - 0.4, -0.45], [MD.road[0] + 0.9, -1.2], [MD.road[1] - 0.03, -1.2], [MD.road[1], 0.85], [CONFIG.duration, 0.85]],
    z: [[0, 7.7], [MD.road[0] - 0.4, 7.7], [MD.road[0] + 0.9, 7.5], [MD.road[1] - 0.03, 7.5], [MD.road[1], 9.3], [CONFIG.duration, 9.3]],
    height: [[0, 1.64], [MD.road[0] + 0.3, 1.64], [MD.road[0] + 1.0, 1.56], [MD.road[1] - 0.03, 1.56], [MD.road[1], 1.5], [CONFIG.duration, 1.5]],
    yaw: [[0, 0], [CONFIG.duration, 0]],
    pitch: [[0, 0], [CONFIG.duration, 0]],
    fov: [[0, 64], [CONFIG.duration, 64]],
    startles: [[MD.vanish + 0.15, 0.5], [MD.brake + 0.1, 0.9], [MD.planeHit + 0.9, 0.5]],
    shakes: [[MD.brake + 0.1, 0.35, 0.35], [MD.stop, 0.25, 0.3], [MD.planeHit + 1.0, 0.4, 0.5]],
  },

  // your hands: the right one catches the pole when the brake slams on
  hands: {
    right: [[0, 'hidden'], [MD.brake + 0.05, 'poleR'], [MD.road[0] - 0.2, 'hidden']],
    left: [[0, 'hidden']],
  },

  tracks: {
    pov: [[0, 1], [MD.wheel[0] - 0.001, 1], [MD.wheel[0], 0, 'step'], [CONFIG.duration, 0]],
  },

  hud: {
    title: { in: MD.title[0], out: MD.title[1], fi: 0.2, fo: 0.45, cls: 'big center', html: '<span class="kick">WHAT IF MEN</span><span class="hero">SUDDENLY DISAPPEARED</span><span class="kick">FROM THE WORLD?</span>' },
    captions: [
      { t: 4.15, until: 6.6, text: 'Every adult man. The same second.' },
      { t: 6.6, until: 9.2, text: 'The driver let go. The train braked itself.' },
      { t: 9.6, until: 12.1, text: 'Cars have no dead man’s switch.' },
      { t: 12.1, until: 15.5, text: 'Millions of cars. Nobody at the wheel.' },
      { t: 16.0, until: 18.4, text: 'Planes land by hand.' },
      { t: 18.4, until: 21.2, text: 'Nobody is flying this one.' },
      { t: 21.8, until: 24.0, text: 'Nobody is steering that ship.' },
      { t: 27.1, until: 29.3, text: 'Autopilot on. Nobody at the helm.' },
      { t: 29.6, until: 31.0, text: 'It can’t stop.' },
      { t: 33.0, until: 36.1, text: 'The train stopped itself. The ship couldn’t.' },
      { t: 36.9, until: 38.9, text: 'Fires start everywhere.' },
      { t: 39.1, until: 40.9, text: 'The alarm rings. Nobody comes.' },
      { t: 41.0, until: 42.1, text: 'They spread.' },
      { t: 42.9, until: 44.4, text: 'Someone has to balance the grid, every second.' },
      { t: 44.6, until: 46.4, text: 'Nobody is.' },
      { t: 47.6, until: 50.4, text: 'The whole grid goes down.' },
      { t: 51.0, until: 53.4, text: 'No power, no pumps. The taps run dry.' },
      { t: 53.4, until: 56.1, text: 'Sewage pours into the harbour.' },
      { t: 56.4, until: 58.5, text: 'Food comes by truck. The trucks stopped.' },
      { t: 58.8, until: 60.6, text: 'Reactors shut down, but still need cooling.' },
      { t: 60.8, until: 62.7, text: 'The backup diesel ran out.' },
    ],
    readouts: [
      { from: 0.0, until: 4.3, top: 236, label: 'WORLD POPULATION', value: mdPop, sub: (t) => (t < MD.vanish ? '' : '2.92 BILLION MEN (18+) · GONE') },
      { from: 4.7, until: 9.2, top: 236, label: 'TRAIN · DRIVER GONE', value: mdTrainKmh, unit: 'km/h', sub: 'DEAD MAN’S SWITCH → EMERGENCY BRAKE' },
      { from: 13.1, until: 15.5, top: 236, label: 'SILVER SUV · NOBODY INSIDE', value: (t) => String(Math.round(mdCarKmh('cruise', t))), unit: 'km/h', sub: 'CRUISE CONTROL · NO AUTO-BRAKE' },
      { from: 16.0, until: 21.2, top: 236, label: 'AIRLINE PILOTS', value: MD_STAT.pilots, sub: 'ARE MEN' },
      { from: 21.6, until: 26.6, top: 236, label: 'MERCHANT SEAFARERS', value: '98.7 %', sub: 'ARE MEN', ctx: 'THIS SHIP · 6.2 KNOTS · CREW 0' },
      { from: 36.6, until: 42.1, top: 236, label: 'FIREFIGHTERS (US)', value: MD_STAT.fire, sub: 'ARE MEN' },
      { from: 42.6, until: 50.4, top: 236, label: 'POWER PLANT OPERATORS (US)', value: MD_STAT.power, sub: 'ARE MEN', ctx: (t) => (t < MD.blackout ? 'LINE WORKERS ' + MD_STAT.lines + ' MEN' : 'CITY POWER · OFF') },
      { from: 50.8, until: 56.1, top: 236, label: 'WATER PLANT OPERATORS (US)', value: MD_STAT.water, sub: 'ARE MEN' },
      { from: 56.4, until: 58.5, top: 236, label: 'TRUCK DRIVERS (US)', value: MD_STAT.trucks, sub: 'ARE MEN' },
      { from: 58.8, until: 62.7, top: 236, label: 'BACKUP DIESEL', value: MD_STAT.diesel, sub: 'OF FUEL ON SITE', ctx: (t) => (t < MD.nukeBang ? 'REACTOR COOLING · ON DIESEL' : 'COOLING · LOST') },
      { from: MD.births[0], until: MD.births[1], top: 236, label: 'BIRTHS PER DAY (WORLD)', value: MD_STAT.births, sub: 'NINE MONTHS FROM NOW: ALMOST NONE' },
    ],
    endLine: { t: MD.line[0], until: MD.line[1], text: 'Half the world vanished in a second.<br><span class="l2">Everything they kept running stopped with them.</span>' },
    notes: [{ t: MD.note[0], until: MD.note[1], text: MD_STAT.note }],
  },
};

function mdClock(s) { s = Math.max(0, s); return `00:${String(Math.ceil(s - 1e-6)).padStart(2, '0')}`; }

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
