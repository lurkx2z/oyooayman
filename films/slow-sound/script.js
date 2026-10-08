/* =====================================================================
   SCRIPT — "WHAT IF THE SPEED OF SOUND BECAME 10× SLOWER?"
   ★ The one file to edit for timing: the beats, the moving things (pure functions of time, shared by the
   picture, the sound waves, the sound and the camera), the words, the readouts, your head, your hands.
   Rule: the speed of sound in air drops from 343 m/s to 34.3 m/s (1,235 → 123 km/h). Light is unchanged.
   Every delayed sound comes from js/audio/soundArrival.js: arrival = event time + distance / speed of sound.
   Plan: films/slow-sound/PLAN.md
   ===================================================================== */

CONFIG.duration = 71.0;          // story length (no cut: film = story)
CONFIG.seed = 20261008;
Object.assign(CONFIG.camera, {
  cameraHeight: 1.68, walkSpeed: 1.3, bobStrength: 0.013, bobFrequency: 1.72,
  breathingStrength: 0.005, breathRate: 15, fov: 64, shakeStrength: 1.0,
});
CONFIG.render.shadowMapSize = 2048;

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (story seconds). Every other file keys off these.
// ---------------------------------------------------------------------------------------------------------------------
const SND = {
  title: [-0.6, 3.7],
  rule: [1.35, 2.45],          // the speed of sound drops under the title (343 → 34.3 m/s)
  C0: 343, C1: 34.3,
  friend: { x: -9.8, y: 1.55, z: -22.5, claps: [2.5, 5.1, 5.7, 6.3], shout: 7.35, wave: [4.2, 4.9] },
  pile: { x: 40, y: 1.2, z: -95, t0: 0.55, period: 1.3, last: 16.15 },
  amb: { x: -1.75, y: 1.6, v: 13.89, tc: 22.4 },               // 50 km/h, closest at 22.4 (Mach 0.40)
  h1: { x: 57.2, y: 6.6, v: 30.56, tc: 26.7 },                 // 110 km/h on the highway (Mach 0.89)
  // 112 km/h, speeds up to 126 km/h (Mach 1.02) and holds it; closest to you at tc. At Mach 1.02 the shock only
  // reaches you if the car has been supersonic for ≥ perp/√(M²−1) ≈ 243 m before it passes: it cruises for 259 m.
  sport: { x: 57.2, y: 6.6, v0: 31.0, a: 2.0, v1: 35.0, t0: 26.8, tc: 36.2 },
  drone: { x: 15.6, z: -4.8, up: 39.0, fall: 42.4, down: 43.15 },
  pilot: { x: 18.8, z: -8.2 },
  plane: { x: 24, v: 72.2, tc: 48.6, h: 220, glide: 0.0524 },  // 260 km/h on approach (Mach 2.1), 220 m up, 3° glide
  police: { x: -1.75, y: 1.4, v: 44.44, tc: 59.2 },            // 160 km/h (Mach 1.30): the street payoff
  lineA: [64.3, 66.9], lineB: [67.1, 69.7], note: [69.3, 70.6], black: 70.75, end: 71.0,
  boom: {},                                                    // when each shock reaches YOU (computed below)
};
(() => { const S = SND.sport; S.tA = S.t0 + (S.v1 - S.v0) / S.a; S.zA = 1 - S.v1 * (S.tc - S.tA); const u = S.tA - S.t0; S.z0 = S.zA - (S.v0 * u + 0.5 * S.a * u * u); S.tM = S.t0 + (SND.C1 - S.v0) / S.a; })();

// the speed of sound right now (m/s): 343 → 34.3 under the title
function sndC(t) { const k = MathX.smooth(t, SND.rule[0], SND.rule[1]); return SND.C0 * Math.pow(SND.C1 / SND.C0, k); }

// ---------------------------------------------------------------------------------------------------------------------
// THINGS THAT MOVE (pure functions of story time) — positions in metres; the sound source point of each
// ---------------------------------------------------------------------------------------------------------------------
const SND_P = (x, y, z) => ({ x, y, z });
function sndAmb(t) { const A = SND.amb; return SND_P(A.x, A.y, 1 + A.v * (t - A.tc)); }
function sndH1(t) { const A = SND.h1; return SND_P(A.x, A.y, 1 + A.v * (t - A.tc)); }
function sndSportV(t) { const S = SND.sport; return t < S.t0 ? S.v0 : t < S.tA ? S.v0 + S.a * (t - S.t0) : S.v1; }
function sndSport(t) {
  const S = SND.sport;
  if (t < S.t0) return SND_P(S.x, S.y, S.z0 + S.v0 * (t - S.t0));
  if (t < S.tA) { const u = t - S.t0; return SND_P(S.x, S.y, S.z0 + S.v0 * u + 0.5 * S.a * u * u); }
  return SND_P(S.x, S.y, S.zA + S.v1 * (t - S.tA));
}
function sndPlane(t) { const P = SND.plane, z = 1 + P.v * (t - P.tc); return SND_P(P.x, P.h - P.glide * (z - 1), z); }
function sndPolice(t) { const P = SND.police; return SND_P(P.x, P.y, 1 + P.v * (t - P.tc)); }
// the drone: lifts off, can't hold height on supersonic propeller tips, wobbles, flips and drops
function sndDrone(t) {
  const D = SND.drone;
  if (t < D.up) return { x: D.x, y: 0.2, z: D.z, roll: 0, pitch: 0, spin: 0 };
  const u = t - D.up;
  let y = 0.2 + 2.1 * MathX.smooth(u, 0, 1.0) - 0.5 * MathX.smooth(u, 1.0, 2.6);
  let roll = (0.06 + 0.32 * MathX.smooth(u, 0.8, 3.4)) * Math.sin(u * 9.5) + 0.05 * Math.sin(u * 23);
  let pitch = (0.05 + 0.22 * MathX.smooth(u, 1.0, 3.4)) * Math.sin(u * 7.3 + 1);
  let x = D.x + 0.25 * Math.sin(u * 3.1) * MathX.smooth(u, 0.5, 2.5), z = D.z + 0.18 * Math.sin(u * 2.3 + 1);
  if (t > D.fall) {   // a tip stalls: it rolls over and falls (free fall from ~1.9 m: ~0.6 s)
    const f = t - D.fall, ff = Math.min(f, D.down - D.fall);
    y = Math.max(0.12, (0.2 + 2.1 - 0.5 * MathX.smooth(D.fall - D.up, 1.0, 2.6)) - 4.9 * ff * ff);
    roll = Math.sin((D.fall - D.up) * 9.5) * 0.3 + 2.6 * MathX.smooth(f, 0, 0.7);
    x += 0.9 * MathX.smooth(f, 0, 0.75); pitch += 0.4 * MathX.smooth(f, 0, 0.7);
    if (t > D.down) { const g = t - D.down; x += 0.35 * MathX.smooth(g, 0, 0.5); roll = 2.6 + 0.5 * MathX.smooth(g, 0, 0.4); y = 0.12 + 0.18 * Math.max(0, Math.sin(Math.min(g, 0.3) / 0.3 * Math.PI)) * (1 - MathX.smooth(g, 0.3, 0.6)); }
  }
  return { x, y, z, roll, pitch, spin: t < D.down + 0.4 ? 1 : 0 };
}

// the listener (your head) — the camera's keyframed position (filled in once SCRIPT.camera exists)
let SND_CX = null, SND_CZ = null;
function sndEar(t) { return SND_P(SND_CX.value(t), 1.83, SND_CZ.value(t)); }

// when a sound made at a FIXED point at time te reaches your ear — follows the speed of sound as it changes under
// the title (sound already in flight slows down with it), then SoundArrival's rule: te + distance / c
function sndArriveFixed(te, src) {
  if (te >= SND.rule[1]) return SoundArrival.arrival(te, src, sndEar, SND.C1);
  let t = te, run = 0; const dt = 1 / 600;
  for (let i = 0; i < 60000; i++) { const d = SoundArrival.dist(src, sndEar(t)); if (run >= d) return t; run += sndC(t) * dt; t += dt; }
  return t;
}

// when each shock front reaches a point near the ground (straight, level, constant-speed pass):
// the moment the source is level with the point + perp·√(M²−1)/v (SoundArrival.boomDelay)
function sndPoliceBoomAt(x, z, y = 1.3) {
  const P = SND.police; return P.tc + (z - 1) / P.v + SoundArrival.boomDelay(Math.hypot(x - P.x, y - P.y), P.v, SND.C1);
}
function sndPlaneBoomAt(x, z, y = 1.3) {
  const P = SND.plane, tz = P.tc + (z - 1) / P.v, q = sndPlane(tz);
  return tz + SoundArrival.boomDelay(Math.hypot(x - P.x, q.y - y), P.v, SND.C1) + SND.boom.planeFix;
}
// the car only reaches Mach 1.02 for its last 259 m: points too far from the highway never get its shock (null)
function sndSportBoomAt(x, z, y = 1.3) {
  const S = SND.sport, M = S.v1 / SND.C1, perp = Math.hypot(x - S.x, y - S.y), run = perp / Math.sqrt(M * M - 1);
  if (z - run < S.zA) return null;
  return S.tc + (z - 1) / S.v1 + SoundArrival.boomDelay(perp, S.v1, SND.C1);
}

// the pile driver's hits (the hammer drops every 1.3 s until it is switched off)
const SND_PILE_HITS = (() => { const P = SND.pile, a = []; for (let t = P.t0; t <= P.last + 1e-6; t += P.period) a.push(+t.toFixed(3)); return a; })();

// ---------------------------------------------------------------------------------------------------------------------
// YOUR HEAD: base keys + "look at" windows that track moving things (sampled into the yaw/pitch keys below)
// ---------------------------------------------------------------------------------------------------------------------
const SND_CAM_X = [[0, 9.4], [71, 9.4]];
const SND_CAM_Z = [[0, 7.2], [4.6, 1.0, 'linear'], [62.8, 1.0], [66.5, -1.6, 'linear'], [71, -1.6]];
// base yaw / pitch (degrees; yaw 0 = down the avenue, + = left) used outside the look windows
const SND_BASE_YAW = [[0, 4], [2.0, 6], [3.6, 16], [37.0, -100], [37.9, -84], [38.6, -56], [44, -20], [49.4, 8], [54.3, 5], [54.7, -8], [55.1, -34], [55.6, -6], [59.9, 20], [62.8, 84], [63.7, 22], [64.6, 4], [71, 2]];
const SND_BASE_PITCH = [[0, -2], [3.6, -1], [37.0, 1], [38.4, -4], [44, 8], [49.4, 2], [54.3, 2], [55.0, -2], [59.9, 0], [62.8, 2], [64.6, -1], [71, -2]];
// [from, to, target(t) → {x,y,z}, blend in s, blend out s, lag s]
const SND_LOOKS = [
  [3.4, 11.0, () => SND_P(SND.friend.x, 1.25, SND.friend.z), 0.9, 0.55, 0],
  [11.0, 19.1, () => SND_P(SND.pile.x, 6.5, SND.pile.z), 0.7, 0.6, 0],
  [19.0, 24.5, (t) => sndAmb(t), 0.7, 0.45, 0.16],
  [24.4, 28.0, (t) => SND_P(SND.h1.x, 6.4, sndH1(t).z), 0.55, 0.5, 0.12],
  [27.9, 36.9, (t) => SND_P(SND.sport.x, 6.4, sndSport(t).z), 0.6, 0.6, 0.14],
  [38.3, 44.2, (t) => { const d = sndDrone(t); return SND_P(d.x, d.y + 0.2, d.z); }, 0.7, 0.6, 0.12],
  [44.2, 49.1, (t) => sndPlane(t), 0.75, 0.7, 0.2],
  [49.5, 54.3, () => SND_P(1.0, 3.0, -90), 0.6, 0.3, 0],
  [55.6, 59.95, (t) => { const p = sndPolice(t); return SND_P(p.x, 1.0, p.z); }, 0.6, 0.45, 0.12],
  [60.2, 62.7, () => SND_P(-12.5, 2.0, 3.0), 0.9, 0.8, 0],
];
const SND_FOV = [[0, 64], [3.6, 60], [4.6, 36], [5.4, 28], [10.6, 28], [11.6, 26], [12.4, 22], [18.6, 22], [19.4, 46], [24.2, 46], [24.9, 20], [27.6, 18], [28.3, 14], [32.0, 17], [34.4, 24], [35.6, 38], [36.6, 46],
  [38.4, 46], [39.4, 34], [44.0, 36], [44.6, 50], [48.8, 56], [49.6, 40], [52.0, 30], [54.3, 32], [54.6, 46], [55.4, 46], [56.0, 26], [58.0, 34], [59.2, 50], [59.6, 54], [60.6, 40], [62.6, 44], [64.0, 58], [71, 60]];

const SCRIPT = {
  meta: { title: 'WHAT IF THE SPEED OF SOUND BECAME 10× SLOWER?', wav: 'slow-sound-soundtrack.wav' },

  events: [
    { id: 'start', time: 0.0, label: 'Busy street; the title' },
    { id: 'rule', time: SND.rule[0], label: 'Sound slows to 34.3 m/s' },
    { id: 'friend', time: 4.2, label: '30 m: the clap arrives 0.88 s late' },
    { id: 'pile', time: 11.0, label: '100 m: the pile driver, 2.9 s late' },
    { id: 'amb', time: 19.0, label: 'Ambulance at 50 km/h: Mach 0.40' },
    { id: 'h1', time: 24.4, label: 'Highway 110 km/h: Mach 0.89' },
    { id: 'sport', time: 27.9, label: 'A car goes supersonic' },
    { id: 'drone', time: 38.4, label: 'Drone: supersonic propeller tips' },
    { id: 'plane', time: 44.2, label: 'A silent Mach 2.1 airliner' },
    { id: 'planeBoom', time: 49.5, label: 'Its shock comes down the street' },
    { id: 'police', time: 55.6, label: 'Police car at Mach 1.3: the windows' },
    { id: 'line', time: SND.lineA[0], label: 'The closing line' },
  ],

  camera: {
    baseY: 0.15,
    x: SND_CAM_X,
    z: SND_CAM_Z,
    height: null, yaw: null, pitch: null, tilt: null, startles: null, shakes: null,   // filled in below (they key off the booms)
    fov: SND_FOV,
  },

  // your hands only go up once: to your ears when the police car's shock hits (filled in below)
  hands: { right: null, left: null },

  tracks: {
    pov: [[0, 1], [71, 1]],
  },

  // the airliner (js/world/aircraft.js): sampled from sndPlane, wings rocking (filled in below)
  aircraft: { path: [], bank: [] },

  hud: {
    title: { in: SND.title[0], out: SND.title[1], fi: 0.2, fo: 0.45, cls: 'big center', html: '<span class="kick">WHAT IF THE</span><span class="hero">SPEED OF SOUND</span><span class="kick">BECAME 10× SLOWER?</span>' },
    captions: [
      { t: 8.7, until: 10.9, text: 'You’d see people speak before you heard them.' },
      { t: 12.9, until: 15.6, text: 'A hundred metres away: three seconds late.' },
      { t: 16.5, until: 17.8, text: 'It had already stopped…' },
      { t: 17.9, until: 19.2, text: '…but the bangs kept coming.' },
      { t: 20.8, until: 23.6, text: 'Passing sirens would drop more than an octave.' },
      { t: 25.0, until: 27.7, text: 'Highway speed is now almost the speed of sound.' },
      { t: 30.0, until: 32.9, text: 'A normal road car could break the sound barrier.' },
      { t: 33.3, until: 35.8, text: 'Its sound is still behind it.' },
      { t: 39.8, until: 42.3, text: 'Small propellers would go supersonic too.' },
      { t: 45.6, until: 48.2, text: 'Even a landing airliner would be supersonic.' },
      { t: 48.5, until: 50.9, text: 'And you can’t hear it. Not yet.' },
      { t: 51.2, until: 53.9, text: 'You’d see its shock wave before you heard it.' },
      { t: 56.3, until: 58.9, text: 'A police car you’d never hear coming.' },
      { t: 60.7, until: 63.3, text: 'Only the weakest windows gave way.' },
      { t: SND.lineA[0], until: SND.lineA[1], text: 'You wouldn’t need a fighter jet…' },
      { t: SND.lineB[0], until: SND.lineB[1], text: '…to break the sound barrier.' },
    ],
    readouts: [
      { from: 0.0, until: 4.3, top: 200, label: 'SPEED OF SOUND', value: (t) => sndKmh(t), sub: (t) => `${sndC(t) >= 100 ? Math.round(sndC(t)) : sndC(t).toFixed(1)} M/S` },
      { from: 4.4, until: 10.9, top: 200, label: 'SOUND DELAY', value: () => `${sndDelay(SND.friend).toFixed(2)} S`, sub: () => `DISTANCE ${Math.round(sndDist(SND.friend))} M` },
      { from: 11.9, until: 19.2, top: 200, label: 'SOUND DELAY', value: () => `${sndDelay(SND.pile).toFixed(1)} S`, sub: () => `DISTANCE ${Math.round(sndDist(SND.pile) / 10) * 10} M` },
      { from: 19.4, until: 24.4, top: 200, label: 'AMBULANCE · 50 KM/H', value: `MACH ${(SND.amb.v / SND.C1).toFixed(2)}`, sub: (t) => (t < SND.amb.tc + 0.9 ? 'SIREN PITCH +68%' : 'SIREN PITCH −29%') },
      { from: 24.8, until: 27.8, top: 200, label: 'CAR SPEED · 110 KM/H', value: `LOCAL MACH ${(SND.h1.v / SND.C1).toFixed(2)}`, sub: 'SOUND BARRIER: 123 KM/H' },
      { from: 28.0, until: 37.9, top: 200, label: 'CAR SPEED', value: (t) => `MACH ${(sndSportV(t) / SND.C1).toFixed(2)}`, sub: (t) => `${Math.round(sndSportV(t) * 3.6)} KM/H${sndSportV(t) > SND.C1 ? ' · SUPERSONIC' : ''}` },
      { from: 39.2, until: 44.0, top: 200, label: 'DRONE PROPELLER TIPS', value: 'MACH 2.6', sub: '≈ 90 M/S' },
      { from: 44.8, until: 50.6, top: 200, label: 'AIRLINER · 260 KM/H', value: `MACH ${(SND.plane.v / SND.C1).toFixed(1)}`, sub: 'AT CRUISE: MACH 6.9' },
      { from: 56.0, until: 59.7, top: 200, label: 'POLICE CAR · 160 KM/H', value: `MACH ${(SND.police.v / SND.C1).toFixed(2)}` },
      { from: 63.8, until: 70.2, top: 200, label: 'SPEED OF SOUND', value: '123 KM/H', sub: '34.3 M/S' },
    ],
    says: [],                          // "Hey!" is placed at the moment the shout ARRIVES (filled in below)
    notes: [{ t: SND.note[0], until: SND.note[1], text: 'FICTIONAL SIMULATION · ONLY THE SPEED OF SOUND WAS CHANGED' }],
  },
};

function sndKmh(t) { const k = sndC(t) * 3.6; return k >= 1000 ? `${Math.floor(k / 1000)},${String(Math.round(k % 1000)).padStart(3, '0')} KM/H` : `${Math.round(k)} KM/H`; }
function sndDist(p) { return SoundArrival.dist(p, SND_P(9.4, 1.83, 1.0)); }
function sndDelay(p) { return sndDist(p) / SND.C1; }

// --- the booms at YOUR ear (exact, from SoundArrival), then everything that keys off them -------------------------
(function sndBuild() {
  const C = SCRIPT.camera, B = SND.boom, c = SND.C1;
  SND_CX = new Track(C.x); SND_CZ = new Track(C.z);
  // the earliest arrival over each source's supersonic emissions is its shock (a fold: an interior minimum)
  const S = SND.sport, fs = SoundArrival.firstArrival(sndSport, sndEar, c, S.tM, S.tc, 1 / 480);
  B.sport = fs.tr; B.sportFold = fs.te > S.tM + 0.05;
  B.police = SoundArrival.firstArrival(sndPolice, sndEar, c, 40, SND.police.tc, 1 / 480).tr;
  B.plane = SoundArrival.firstArrival(sndPlane, sndEar, c, 30, SND.plane.tc, 1 / 240).tr;
  B.planeFix = 0;
  B.planeFix = B.plane - sndPlaneBoomAt(9.4, 1.0, 1.83);   // the straight-line formula, trued up to the exact value at you
  const tS = B.sport, tP = B.police, tQ = B.plane;
  // the shocks hit you: a jolt and a shake each; the police car's (closest, the strongest) makes you duck, hands to ears
  C.startles = [[tS + 0.02, 0.9], [tQ + 0.02, 1.2], [tP + 0.02, 1.6]];
  C.shakes = [[tS + 0.02, 0.55, 0.35], [tQ + 0.02, 0.9, 0.7], [tP + 0.02, 1.25, 0.55]];
  C.height = [[0, 1.68], [tP, 1.68], [tP + 0.3, 1.5, 'outQuad'], [tP + 2.65, 1.66], [71, 1.68]];
  C.tilt = [[0, 0], [tP - 0.05, 0], [tP + 0.25, -3.5], [tP + 1.85, 0], [71, 0]];
  SCRIPT.hands.right = [[0, 'hidden'], [tP + 0.07, 'ear'], [tP + 1.95, 'ear'], [tP + 2.65, 'hidden']];
  SCRIPT.hands.left = [[0, 'hidden'], [tP + 0.11, 'ear'], [tP + 1.85, 'ear'], [tP + 2.55, 'hidden']];
  // sample the head: base keys blended toward each look window's target
  const by = new Track(SND_BASE_YAW), bp = new Track(SND_BASE_PITCH);
  const yaw = [], pitch = [];
  let prevYaw = null;
  for (let i = 0; i <= Math.round(CONFIG.duration * 30); i++) {
    const t = i / 30, cx = SND_CX.value(t), cz = SND_CZ.value(t), ey = 1.83;
    let y = by.value(t), p = bp.value(t);
    for (const [a, b, fn, fi, fo, lag] of SND_LOOKS) {
      const w = MathX.smooth(t, a - fi * 0.5, a + fi * 0.5) * (1 - MathX.smooth(t, b - fo * 0.5, b + fo * 0.5));
      if (w <= 0) continue;
      const q = fn(Math.max(a, t - lag)), dx = q.x - cx, dz = q.z - cz, dh = Math.hypot(dx, dz);
      let ly = Math.atan2(-dx, -dz) * 180 / Math.PI, lp = Math.min(72, Math.atan2(q.y - ey, dh) * 180 / Math.PI);
      while (ly - y > 180) ly -= 360; while (ly - y < -180) ly += 360;
      y += (ly - y) * w; p += (lp - p) * w;
    }
    if (prevYaw !== null) { while (y - prevYaw > 180) y -= 360; while (y - prevYaw < -180) y += 360; }
    prevYaw = y;
    yaw.push([+t.toFixed(4), +y.toFixed(3), 'linear']); pitch.push([+t.toFixed(4), +p.toFixed(3), 'linear']);
  }
  C.yaw = yaw; C.pitch = pitch;
  // the airliner path and its rocking wings (it is fighting its own shock waves)
  const A = SCRIPT.aircraft;
  for (let t = 40.0; t <= 58.0 + 1e-6; t += 0.5) { const q = sndPlane(t); A.path.push([+t.toFixed(2), q.x, +q.y.toFixed(2), +q.z.toFixed(2)]); }
  for (let t = 40.0; t <= 58.0 + 1e-6; t += 0.35) A.bank.push([+t.toFixed(2), +(7 * Math.sin(t * 1.9) + 3 * Math.sin(t * 4.3 + 1)).toFixed(2)]);
  // "Hey!" appears when the shout reaches you, not when the mouth opens
  const tr = sndArriveFixed(SND.friend.shout, SND.friend);
  SCRIPT.hud.says.push({ t: +tr.toFixed(3), until: +(tr + 1.3).toFixed(3), text: '“Hey! Over here!”' });
})();

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
