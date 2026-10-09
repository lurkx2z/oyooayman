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

CONFIG.duration = 67.0;          // story length (the film is cut from it with CONFIG.edit)
CONFIG.seed = 20261009;
Object.assign(CONFIG.camera, {
  cameraHeight: 1.64, walkSpeed: 1.0, bobStrength: 0.012, bobFrequency: 1.8,
  breathingStrength: 0.0045, breathRate: 16, fov: 64, shakeStrength: 1.0,
});
CONFIG.render.shadowMapSize = 2048;

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (story seconds)
// ---------------------------------------------------------------------------------------------------------------------
const MD = {
  title: [-0.6, 3.9],
  vanish: 1.8,            // every adult man is gone (one frame)
  brake: 4.6,             // the dead man's switch: the handle has been released for 2.8 s → emergency brake
  road: [9.2, 16.4],      // you lean to the left window: the cars below have no drivers
  cruise: 14.6,           // the SUV on cruise control reaches the parked van
  harbour: 16.6,          // you turn to the harbour: the ship
  tele: [20.4, 23.0],     // telephoto: its wheelhouse is empty
  montage: [24.0, 31.7],  // MEANWHILE
  cockpit: 24.0, fire: 26.6, ward: 29.15,
  back: 31.7,             // back on the train: the bow is much closer
  retreat: 32.6,          // the passengers move to the back of the car
  cab: 36.4,              // you at the cab door: the track ahead, the pier, the bow
  turn: 42.6,             // the bow swings into the pier's line
  hit: 47.6,              // the bow hits the pier
  drones: [[41.4, 44.15], [46.4, 48.6], [51.5, 54.4], [58.4, 67.0]],   // outside: the ship's line from above; the impact; the train at the edge; the closing crane
  after: 54.4,            // back in the car: the track ends in the air
  line: [58.6, 63.2],
  note: [63.4, 66.4],
  end: 67.0,
};

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

const SCRIPT = {
  meta: { title: 'WHAT IF MEN SUDDENLY DISAPPEARED FROM THE WORLD?', wav: 'men-disappear-soundtrack.wav' },

  events: [
    { id: 'start', time: 0.0, label: 'The train; the title' },
    { id: 'vanish', time: MD.vanish, label: 'Every man vanishes' },
    { id: 'brake', time: MD.brake, label: 'Dead man’s switch: emergency brake' },
    { id: 'road', time: MD.road[0], label: 'The road: cars coast' },
    { id: 'harbour', time: MD.harbour, label: 'The ship' },
    { id: 'montage', time: MD.montage[0], label: 'Meanwhile' },
    { id: 'back', time: MD.back, label: 'Back: the bow is closer' },
    { id: 'cab', time: MD.cab, label: 'The cab: the pier ahead' },
    { id: 'hit', time: MD.hit, label: 'Impact' },
    { id: 'after', time: MD.after, label: 'The edge' },
    { id: 'line', time: MD.line[0], label: 'The closing line' },
  ],

  // your head, in TRAIN-LOCAL metres (film.js adds the train's position). Where you look: MD_LOOK in film.js.
  camera: {
    baseY: MD_G.floorY,
    // the road beat: kneeling on the empty seat at the left-hand window; the harbour: at the right-hand window;
    // then a quick walk up the car and through the cab door (it slides open) to stand behind the empty driver's desk
    x: [[0, -0.45], [MD.road[0] - 0.4, -0.45], [MD.road[0] + 0.9, -1.2], [MD.road[1] - 0.4, -1.2], [MD.harbour + 0.6, 0.85], [34.6, 0.85],
      [35.5, 0.15], [36.2, 0.05], [37.0, 0.3], [CONFIG.duration, 0.3]],
    z: [[0, 7.7], [MD.road[0] - 0.4, 7.7], [MD.road[0] + 0.9, 7.5], [MD.road[1] - 0.4, 7.5], [MD.harbour + 0.6, 9.3], [34.6, 9.3],
      [35.5, 6.0, 'linear'], [36.2, 3.2, 'linear'], [37.0, 1.08], [CONFIG.duration, 1.08]],
    height: [[0, 1.64], [MD.road[0] + 0.3, 1.64], [MD.road[0] + 1.0, 1.56], [MD.road[1] - 0.4, 1.56], [MD.harbour + 0.6, 1.55], [34.6, 1.55],
      [35.5, 1.64], [37.0, 1.82], [CONFIG.duration, 1.82]],
    yaw: [[0, 0], [CONFIG.duration, 0]],
    pitch: [[0, 0], [CONFIG.duration, 0]],
    fov: [[0, 64], [CONFIG.duration, 64]],
    startles: [[MD.vanish + 0.15, 0.5], [MD.brake + 0.1, 0.9], [MD.hit + 0.05, 1.0]],
    shakes: [[MD.brake + 0.1, 0.35, 0.35], [MD.stop, 0.25, 0.3], [MD.hit + 0.05, 0.6, 0.6], [MD.hit + 1.9, 0.9, 0.9], [MD.hit + 3.0, 0.5, 0.8]],
  },

  // your hands: the right one catches the pole when the brake slams on; both on the edge of the driver's desk in the cab
  hands: {
    right: [[0, 'hidden'], [MD.brake + 0.05, 'poleR'], [MD.road[0] - 0.2, 'hidden'], [36.7, 'deskR'], [MD.line[0] + 0.6, 'hidden']],
    left: [[0, 'hidden'], [36.85, 'deskL'], [MD.line[0] + 0.4, 'hidden']],
  },

  tracks: {
    pov: [[0, 1], [MD.montage[0] - 0.001, 1], [MD.montage[0], 0, 'step'], [MD.back - 0.001, 0], [MD.back, 1, 'step'],
      ...MD.drones.flatMap(([a, b]) => [[a - 0.001, 1], [a, 0, 'step'], [b - 0.001, 0], [b, 1, 'step']]), [CONFIG.duration, 1]],
  },

  hud: {
    title: { in: MD.title[0], out: MD.title[1], fi: 0.2, fo: 0.45, cls: 'big center', html: '<span class="kick">WHAT IF MEN</span><span class="hero">SUDDENLY DISAPPEARED</span><span class="kick">FROM THE WORLD?</span>' },
    captions: [
      { t: 4.15, until: 6.9, text: 'Every adult man. The same second.' },
      { t: 6.9, until: 9.2, text: 'The driver let go. The train braked itself.' },
      { t: 9.6, until: 12.0, text: 'Most cars have no dead man’s switch.' },
      { t: 12.0, until: 14.4, text: 'With no foot on the pedal, they coast.' },
      { t: 14.4, until: 16.4, text: 'Unless an older car was on cruise control.' },
      { t: 17.4, until: 20.2, text: 'Nobody is steering that ship.' },
      { t: 20.6, until: 23.6, text: 'Almost every merchant seafarer is a man.' },
      { t: 24.25, until: 26.4, text: 'The autopilot doesn’t know.' },
      { t: 26.85, until: 28.95, text: 'The alarm rings. Nobody comes.' },
      { t: 29.4, until: 31.6, text: 'But the wards keep running.' },
      { t: 33.0, until: 35.8, text: 'A ship can’t stop like a train.' },
      { t: 37.0, until: 40.4, text: 'Thirty thousand tonnes, heading for a pier.' },
      { t: 41.7, until: 44.1, text: 'Autopilot on. Nobody at the helm.' },
      { t: 55.0, until: 58.2, text: 'The train stopped itself. The ship couldn’t.' },
    ],
    readouts: [
      { from: 0.0, until: 4.3, top: 236, label: 'WORLD POPULATION', value: mdPop, sub: (t) => (t < MD.vanish ? '' : '2.92 BILLION MEN (18+) · GONE') },
      { from: 4.7, until: 9.4, top: 236, label: 'TRAIN · DRIVER GONE', value: mdTrainKmh, unit: 'km/h', sub: 'DEAD MAN’S SWITCH → EMERGENCY BRAKE' },
      { from: 13.1, until: 16.3, top: 236, label: 'SILVER SUV · NOBODY INSIDE', value: (t) => String(Math.round(mdCarKmh('cruise', t))), unit: 'km/h', sub: 'OLD CRUISE CONTROL · NO AUTO-BRAKE' },
      { from: 17.2, until: 23.7, top: 236, label: 'MERCHANT SEAFARERS', value: '98.7 %', sub: 'ARE MEN', ctx: (t) => (t < 20.4 ? '1.89 MILLION SEAFARERS' : 'THIS SHIP · 6.2 KNOTS · CREW 0') },
      { from: 24.1, until: 26.5, top: 236, label: 'AIRLINE PILOTS', value: '≈ 95 %', sub: 'ARE MEN' },
      { from: 26.7, until: 29.0, top: 236, label: 'FIREFIGHTERS (US)', value: '≈ 95 %', sub: 'ARE MEN' },
      { from: 29.25, until: 31.6, top: 236, label: 'NURSES WORLDWIDE', value: '≈ 90 %', sub: 'ARE WOMEN' },
      { from: 37.2, until: 47.4, top: 236, label: 'PIER IMPACT IN', value: (t) => mdClock(MD.hit - t), sub: (t) => `SHIP ${Math.max(0, Math.round(mdShipGap(t)))} m AWAY · 6.2 KNOTS` },
      { from: 55.0, until: 58.4, top: 236, label: 'TRAIN STOPPED', value: '4 m', sub: 'SHORT OF THE FALLEN SPAN' },
    ],
    endLine: { t: MD.line[0], until: MD.line[1], text: 'They were gone in an instant.<br><span class="l2">Some machines were built to notice. Most weren’t.</span>' },
    notes: [{ t: MD.note[0], until: MD.note[1], text: 'WORKFORCE SHARES: ICS/BIMCO 2021 · ISWAP · US BLS (CPS) · WHO 2020 · UN WPP 2024.<br>FIGURES ARE ESTIMATES. EVENTS COMPRESSED FOR THIS SIMULATION. NOT A PREDICTION.' }],
  },
};

function mdClock(s) { s = Math.max(0, s); return `00:${String(Math.ceil(s - 1e-6)).padStart(2, '0')}`; }

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
