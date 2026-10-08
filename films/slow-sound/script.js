/* =====================================================================
   SCRIPT — "WHAT IF THE SPEED OF SOUND BECAME 10× SLOWER?"
   ★ The one file to edit for timing: the beats, the moving things (pure functions of time, shared by the
   picture, the sound waves, the sound and the camera), the words, the readouts, your head, your hands.
   Rule: the speed of sound in air drops from 343 m/s to 34.3 m/s (1,235 → 123 km/h). Light is unchanged.
   Every delayed sound comes from js/audio/soundArrival.js: arrival = event time + distance / speed of sound.
   One afternoon in a football stadium, six shots (hard cuts; the story clock never jumps):
     1 the start line · 2 the friend in the stand · 3 the announcement · 4 the shot · 5 the drum · 6 the thunder
   Plan: films/slow-sound/PLAN.md
   ===================================================================== */

CONFIG.duration = 61.4;          // story length (no Edit: film = story; the cuts are camera cuts)
CONFIG.seed = 20261008;
Object.assign(CONFIG.camera, {
  cameraHeight: 1.66, walkSpeed: 1.3, bobStrength: 0.0, bobFrequency: 1.72,
  breathingStrength: 0.004, breathRate: 15, fov: 50, shakeStrength: 1.0,
});
CONFIG.render.shadowMapSize = 2048;

// ---------------------------------------------------------------------------------------------------------------------
// THE STADIUM (metres). Pitch: x along its length (goals at x = ±52.5), z across (touchlines at z = ±34).
// The main stand (with the roof you sit under at the end) is on +z, the far stand on −z, the storm far beyond it.
// ---------------------------------------------------------------------------------------------------------------------
const SND_ST = {
  half: [52.5, 34],
  // long stands: rows along x; row r: seat line at depth d0 + r·dz from the pitch centre line, floor y0 + r·dy
  side: { x0: -56, x1: 56, d0: 40.9, dz: 0.85, y0: 1.2, dy: 0.42, rows: 22 },
  // end stands: rows along z, at x = ±(d0 + r·dz)
  end: { z0: -33, z1: 33, d0: 60.9, dz: 0.85, y0: 1.0, dy: 0.42, rows: 16 },
  towers: [[-66, 52], [66, 52], [-66, -52], [66, -52]],     // floodlight masts (the loudspeakers hang on them)
  screen: { x: -77.6, y: 12.6, z: 0, w: 16, h: 9 },          // the big screen above the west end stand
};
// a seat in a long stand (s = +1 main, −1 far): world position of the floor under row r at x
function sndSideSeat(s, r, x) { const S = SND_ST.side; return { x, y: S.y0 + r * S.dy, z: s * (S.d0 + r * S.dz) }; }
function sndEndSeat(s, r, z) { const S = SND_ST.end; return { x: s * (S.d0 + r * S.dz), y: S.y0 + r * S.dy, z }; }

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (story seconds). Every other file keys off these.
// ---------------------------------------------------------------------------------------------------------------------
const SND = {
  title: [-0.6, 3.7],
  rule: [1.35, 2.45],          // the speed of sound drops under the title (343 → 34.3 m/s)
  C0: 343, C1: 34.3,
  cuts: [9.6, 15.6, 21.7, 29.8, 38.6],
  // 1. a fun-run start line across the pitch (30 runners on the halfway line); the starter at the far touchline
  gun: { x: -1.6, y: 2.1, z: -36.6, set: 0.9, bang: 3.8 },
  line: { x: 0, z0: -31, z1: 31, n: 30 },
  // the lightning under the title (1.71 km from your seat at the end, beyond the far stand): its thunder is the last scene
  flash: { t: 2.7, x: 30, z: -1662, base: 1100 },
  flash2: { t: 58.7, x: -40, z: -1500, base: 1100 },
  // 2. your friend, standing in row 11 of the main stand, waves and shouts (twice)
  friend: { x: -22, row: 11, shout: 10.35, shout2: 12.9, wave: [9.75, 14.6] },
  // 3. the announcer (on the big screen) — one voice, played by four loudspeaker clusters and the roof speaker
  pa: { speak: 16.3, words: 'LADIES AND GENTLEMEN…' },
  // 4. the referee's whistle, then a free kick from 22 m (144 km/h = Mach 1.17; it slows through Mach 1 on the way)
  whistle: { x: 44.5, y: 1.62, z: -8.6, t: 22.3 },
  kick: { t: 25.3, x: 30.2, z: -1.6, tx: 52.55, ty: 2.12, tz: 3.15, v0: 40.0 },
  // 5. the drum, at the front of the far stand (its drummer faces the pitch): every fan claps when the beat reaches
  //    THEM (it starts before the cut, so its first beat reaches you just after it; t0 is set below from where you stand)
  drum: { x: -14, row: 0, t0: 0, period: 0.45, n: 17 },
  // 6. the payoff
  // (the thunder reaches your seat at 52.65)
  lineA: [55.0, 57.0], lineB: [57.2, 59.3], note: [59.5, 61.0], black: 61.15, end: 61.4,
};
SND.friend.y = sndSideSeat(1, SND.friend.row, 0).y + 0.42; SND.friend.z = sndSideSeat(1, SND.friend.row, 0).z;   // (standing on their seat)
SND.drum.y = sndSideSeat(-1, SND.drum.row, 0).y; SND.drum.z = sndSideSeat(-1, SND.drum.row, 0).z;
// the loudspeakers: the four masts (26 m up) and the front edge of the main stand's roof
SND.pa.speakers = [{ x: 0, y: 16.4, z: 41.6 }, ...SND_ST.towers.map(([x, z]) => ({ x: x * 0.97, y: 26, z: z * 0.95 }))];

// the speed of sound right now (m/s): 343 → 34.3 under the title
function sndC(t) { const k = MathX.smooth(t, SND.rule[0], SND.rule[1]); return SND.C0 * Math.pow(SND.C1 / SND.C0, k); }
// the distance a sound front made at te has travelled by t (the speed of sound changes under the title)
const SND_RUN = (() => {
  const dt = 1 / 240, n = Math.ceil((CONFIG.duration + 2) / dt), R = new Float32Array(n + 1);
  for (let i = 1; i <= n; i++) R[i] = R[i - 1] + sndC((i - 0.5) * dt) * dt;
  const at = (t) => { const f = MathX.clamp(t / dt, 0, n - 1.001), i = Math.floor(f); return R[i] + (R[i + 1] - R[i]) * (f - i); };
  return (te, t) => at(t) - at(te);
})();

const SND_P = (x, y, z) => ({ x, y, z });
const SND_GUN = SND_P(SND.gun.x, SND.gun.y, SND.gun.z);
const SND_FRIEND_MOUTH = SND_P(SND.friend.x, SND.friend.y + 1.55, SND.friend.z);
const SND_DRUM = SND_P(SND.drum.x, SND.drum.y + 0.8, SND.drum.z);
const SND_BOLT = SND_P(SND.flash.x, 0, SND.flash.z);
// when a point first hears something made at a fixed point at a fixed time (after the change: plain distance / c)
function sndHeardAt(te, src, p) { return te + SoundArrival.dist(src, p) / SND.C1; }
// the thunder (ground strike: the nearest part of the bolt) reaches point p at …
function sndThunderAt(p) { return sndHeardAt(SND.flash.t, SND_BOLT, { x: p.x, y: 0, z: p.z }); }

// ---------------------------------------------------------------------------------------------------------------------
// THINGS THAT MOVE (pure functions of story time)
// ---------------------------------------------------------------------------------------------------------------------
// the runners: each one goes when the bang reaches IT (+ a reaction time); a sprint start, v(τ) = vmax(1 − e^(−τ/1.05))
const SND_RUNNERS = (() => {
  const L = SND.line, out = [];
  for (let i = 0; i < L.n; i++) {
    const z = L.z0 + (L.z1 - L.z0) * i / (L.n - 1) + (hash1(i * 7 + 3) - 0.5) * 0.25;
    const head = SND_P(L.x + 0.2, 0.9, z);
    const go = sndHeardAt(SND.gun.bang, SND_GUN, head) + 0.13 + hash1(i * 13 + 1) * 0.06;
    out.push({ i, z, go, vmax: 6.6 + hash1(i * 17 + 5) * 2.0, tau: 1.0 + hash1(i * 19 + 2) * 0.25 });
  }
  return out;
})();
function sndRunnerX(R, t) { const u = Math.max(0, t - R.go); return SND.line.x + R.vmax * (u - R.tau * (1 - Math.exp(-u / R.tau))); }

// the ball: on the spot, then kicked at v0 toward the top corner. Drag: dv/dt = −k·v², k = 0.0532·Cd, and a sphere's
// drag coefficient jumps near the sound barrier (≈0.25 slow → ≈1 from Mach 1): in this air the shot is supersonic for
// only a few metres, then the air brakes it hard (integrated once into a table: distance and speed after u seconds)
const SND_BALL = (() => {
  const K = SND.kick, from = { x: K.x, y: 0.11, z: K.z }, to = { x: K.tx, y: K.ty, z: K.tz };
  const L = SoundArrival.dist(from, to), ux = (to.x - from.x) / L, uz = (to.z - from.z) / L;
  const cd = (M) => 0.25 + 0.72 * MathX.smooth(M, 0.45, 1.0) + 0.05 * MathX.smooth(M, 1.0, 1.3);
  const acc = (v) => -0.0532 * cd(v / SND.C1) * v * v;
  const dt = 1 / 4000, S = [0], V = [K.v0];
  let s = 0, v = K.v0, tMach1 = null, tGoal = null;
  for (let i = 1; s < L + 4 && i < 40000; i++) {
    const vm = v + 0.5 * dt * acc(v), v1 = v + dt * acc(vm);
    s += 0.5 * (v + v1) * dt; v = v1; S.push(s); V.push(v);
    if (tMach1 === null && v < SND.C1) tMach1 = K.t + i * dt;
    if (tGoal === null && s >= L) tGoal = K.t + i * dt;
  }
  const look = (A, u) => { const f = MathX.clamp(u / dt, 0, A.length - 1.001), i = Math.floor(f); return A[i] + (A[i + 1] - A[i]) * (f - i); };
  const sOf = (u) => look(S, u), vOf = (u) => look(V, u);
  return { from, to, L, ux, uz, s: sOf, v: vOf, tGoal, tMach1, dMach1: sOf(tMach1 - K.t) };
})();
function sndBallV(t) { const K = SND.kick; return t < K.t || t > SND_BALL.tGoal ? 0 : SND_BALL.v(t - K.t); }
// after the goal line: on to the back of the net (2 m), which it pushes out; then it drops
const SND_NET = (() => {
  const B = SND_BALL, K = SND.kick, vG = B.v(B.tGoal - K.t), back = 52.5 + 1.9;
  const uN = (back - B.to.x) / (B.ux * vG);
  return { vG, back, uN, tN: B.tGoal + uN, y: B.to.y - 0.6 * uN, z: B.to.z + B.uz * vG * uN };
})();
function sndNetDepth(u) { return u <= 0 ? 0 : 0.72 * (1 - Math.exp(-u / 0.045)) * Math.exp(-Math.max(0, u - 0.12) / 0.38); }
function sndNetBulge(t) { const N = SND_NET; return { depth: sndNetDepth(t - N.tN), y: N.y, z: N.z }; }
function sndBall(t) {
  const K = SND.kick, B = SND_BALL, N = SND_NET;
  if (t <= K.t) return SND_P(B.from.x, B.from.y, B.from.z);
  if (t <= B.tGoal) {
    const d = B.s(t - K.t), f = d / B.L;
    // a slight rise then a dip onto the corner (a driven shot), plus a little swerve
    return SND_P(B.from.x + (B.to.x - B.from.x) * f, B.from.y + (B.to.y - B.from.y) * f + 0.55 * Math.sin(Math.PI * f), B.from.z + (B.to.z - B.from.z) * f + 0.35 * Math.sin(Math.PI * f));
  }
  const u = t - B.tGoal;
  if (u <= N.uN) return SND_P(B.to.x + B.ux * N.vG * u, B.to.y - 0.6 * u, B.to.z + B.uz * N.vG * u);
  // in the net: carried out with it, then it falls as the net springs back
  const w = u - N.uN;
  return SND_P(N.back + sndNetDepth(w) - 0.12 - 0.3 * MathX.smooth(w, 0.25, 0.9), Math.max(0.11, N.y - 4.9 * Math.max(0, w - 0.08) ** 2), N.z + 0.25 * (1 - Math.exp(-w / 0.3)));
}
// a lightning flash at t0: three return strokes in 0.2 s, then a dying glow (0 … ~1)
function sndFlashLevel(t, t0) {
  const u = t - t0;
  if (u < 0 || u > 1.2) return 0;
  let k = 0;
  for (const [ts, a] of [[0, 1.0], [0.075, 0.7], [0.19, 0.85]]) if (u >= ts) k += a * Math.exp(-(u - ts) / 0.04);
  return Math.min(1.2, k + 0.12 * Math.exp(-u / 0.3));
}

// the listener (your head) — the camera's keyframed position (filled in below)
// (sampled at 30 Hz like the camera's keys, read by direct index: the sound code asks for it many thousands of times)
let SND_EAR = null;
function sndEar(t) {
  const E = SND_EAR, f = MathX.clamp(t * 30, 0, E.n - 1.001), i = Math.floor(f), w = f - i;
  return SND_P(E.x[i] + (E.x[i + 1] - E.x[i]) * w, E.y[i] + (E.y[i + 1] - E.y[i]) * w, E.z[i] + (E.z[i + 1] - E.z[i]) * w);
}

// when a sound made at a FIXED point at time te reaches your ear — follows the speed of sound as it changes under
// the title (sound already in flight slows down with it), then SoundArrival's rule: te + distance / c
function sndArriveFixed(te, src) {
  if (te >= SND.rule[1]) return SoundArrival.arrival(te, src, sndEar, SND.C1);
  let t = te, run = 0; const dt = 1 / 600;
  for (let i = 0; i < 60000; i++) { const d = SoundArrival.dist(src, sndEar(t)); if (run >= d) return t; run += sndC(t) * dt; t += dt; }
  return t;
}

// ---------------------------------------------------------------------------------------------------------------------
// YOUR HEAD, shot by shot: where you are, what you look at, the lens (vertical FOV). Sampled at 30 Hz below.
// ---------------------------------------------------------------------------------------------------------------------
const SND_EYE = [
  null,                              // 1 in row 8 of the main stand, above the near end of the start line (set below)
  SND_P(-3.5, 1.66, 30.0),           // 2 on the pitch below the main stand (your friend is 28 m away, up in row 11)
  SND_P(-2.0, 1.66, 33.0),           // 3 by the near touchline, the big screen at the far west end
  null,                              // 4 high in the main stand (row 18, in the aisle at x = 35), above the penalty area
  SND_P(-8, 1.66, -1),               // 5 on the pitch, facing the far stand and its drummer
  null,                              // 6 standing in row 12 of the main stand (set below)
];
SND_EYE[0] = (() => { const q = sndSideSeat(1, 8, 6.5); return SND_P(q.x, q.y + 1.62, q.z); })();
SND_EYE[3] = (() => { const q = sndSideSeat(1, 18, 35); return SND_P(q.x, q.y + 1.62, q.z); })();
SND_EYE[5] = (() => { const q = sndSideSeat(1, 12, 6.0); return SND_P(q.x, q.y + 1.62, q.z); })();
// the drum starts before shot 5: its first beat reaches you 0.4 s into the shot
SND.drum.t0 = +(SND.cuts[3] + 0.4 - SoundArrival.dist(SND_DRUM, SND_EYE[4]) / SND.C1).toFixed(3);
const SND_FRONT_Z = (t) => SND.gun.z + SND_RUN(SND.gun.bang, t);   // where the bang's front is along the line
function sndMidRunnersX(t) { let s = 0; for (let i = 10; i < 21; i++) s += sndRunnerX(SND_RUNNERS[i], t); return s / 11; }

// each shot: [t0, t1, eye(t), target(t), vfov(t)]
const SND_MIX = (p, q, w) => SND_P(p.x + (q.x - p.x) * w, p.y + (q.y - p.y) * w, p.z + (q.z - p.z) * w);
const SND_SHOTS = [
  [0, SND.cuts[0], (t) => SND_P(SND_EYE[0].x + 0.06 * t, SND_EYE[0].y, SND_EYE[0].z),
    (t) => {
      const A = SND_P(-1.0, 7.0 - 5.6 * MathX.smooth(t, 2.6, 3.9), -18);                           // the line, the starter, the storm
      const zf = Math.min(31, SND_FRONT_Z(t)), F = SND_P(0, 1.0, Math.min(14, zf - 7));                 // following the bang along the line
      const R = SND_P(sndMidRunnersX(t) + 2, 1.0, 0);                                                // the staggered line, down its length
      return SND_MIX(SND_MIX(A, F, MathX.smooth(t, 3.7, 4.4)), R, MathX.smooth(t, 5.7, 6.7));
    },
    (t) => 34 - 2 * MathX.smooth(t, 0, 3.6) + 22 * MathX.smooth(t, 4.1, 6.3)],
  [SND.cuts[0], SND.cuts[1], (t) => SND_P(-3.5, 1.66, 30.0 + 0.25 * (t - SND.cuts[0])),
    (t) => SND_P(SND.friend.x, SND.friend.y + 1.25 + 0.2 * MathX.smooth(t, 9.6, 11), SND.friend.z),
    (t) => 8.6 - 1.4 * MathX.smooth(t, 9.6, 15.6)],
  [SND.cuts[1], SND.cuts[2], (t) => SND_P(-2.0 - 0.12 * (t - SND.cuts[1]), 1.66, 33.0),
    (t) => SND_P(SND_ST.screen.x, SND_ST.screen.y - 1.5 - 4.5 * MathX.smooth(t, 19.4, 21.6), SND_ST.screen.z - 9 * MathX.smooth(t, 19.4, 21.6)),
    (t) => 30 + 10 * MathX.smooth(t, 19.4, 21.7)],
  // (high in the main stand: the referee's whistle through a long lens, then the whole penalty area — the kicker, the
  //  wall, the keeper and the goal in one frame — held through the goal; the kick reaches you 0.8 s after it)
  [SND.cuts[2], SND.cuts[3], (t) => SND_EYE[3],
    (t) => {
      const W = SND_P(SND.whistle.x, 1.55, SND.whistle.z), K = SND_P(37.0, 0.3, -0.6), G = SND_P(48.2, 0.8, 1.2);
      return SND_MIX(SND_MIX(W, K, MathX.smooth(t, 24.25, 25.0)), G, MathX.smooth(t, SND.kick.t + 0.02, SND.kick.t + 0.75));
    },
    (t) => 11 + 24 * MathX.smooth(t, 24.25, 25.0) - 5 * MathX.smooth(t, 26.6, 29.8)],
  // (on the pitch: the drummer through a long lens (you see the stroke; its sound comes later), then the far stand
  //  wide and still, so the clapping can be seen spreading out from the drum along the stand)
  [SND.cuts[3], SND.cuts[4], (t) => SND_EYE[4],
    (t) => SND_MIX(SND_P(SND.drum.x + 0.1, SND.drum.y + 1.5, SND.drum.z + 0.3), SND_P(-12, 5.0, -48), MathX.smooth(t, 31.0, 32.3)),
    (t) => 11 + 41 * MathX.smooth(t, 31.0, 32.3)],
  // (the storm; down to the city and the far stand as the thunder's front comes over the city (birds lift off as it
  //  reaches them); the lens closes on the far stand as the front reaches it, then follows the front across the pitch
  //  toward you; afterwards up to the sky for the next flash)
  [SND.cuts[4], 99, (t) => SND_EYE[5],
    (t) => {
      const zf = SND_EYE[5].z - Math.max(0, sndThunderAt(SND_EYE[5]) - t) * SND.C1;    // (where the front is, on the pitch)
      const U = SND_P(-2, 17, -42), C = SND_P(-4, 7.5, -42), Fs = SND_P(-6, 7.0, -50), Fr = SND_P(-1, 0.6, Math.min(22, zf - 3)), W = SND_P(-3, 2.5, -30), Sk = SND_P(-6, 15, -42);
      const a = MathX.smooth(t, 42.4, 45.0), b = MathX.smooth(t, 46.6, 48.3), c = MathX.smooth(t, 50.2, 50.9), w = MathX.smooth(t, 53.6, 55.4), d = MathX.smooth(t, 55.8, 58.2);
      return SND_MIX(SND_MIX(SND_MIX(SND_MIX(SND_MIX(U, C, a), Fs, b), Fr, c), W, w), Sk, d);
    },
    (t) => 57 - 7 * MathX.smooth(t, 42.4, 45.0) - 16 * MathX.smooth(t, 46.6, 48.3) + 22 * MathX.smooth(t, 50.2, 50.9) + 4 * MathX.smooth(t, 55.8, 58.2)],
];
function sndShotAt(t) { let k = 0; for (let i = 0; i < SND.cuts.length; i++) if (t >= SND.cuts[i]) k = i + 1; return k; }
// true when a cut falls between t0 and t1 (no whip smear across a cut)
function sndCutBetween(t0, t1) { for (const c of SND.cuts) if (t0 < c && t1 >= c) return true; return false; }

const SCRIPT = {
  meta: { title: 'WHAT IF THE SPEED OF SOUND BECAME 10× SLOWER?', wav: 'slow-sound-soundtrack.wav' },

  events: [
    { id: 'start', time: 0.0, label: 'The start line; the title; a far flash' },
    { id: 'rule', time: SND.rule[0], label: 'Sound slows to 34.3 m/s' },
    { id: 'bang', time: SND.gun.bang, label: 'The gun: the runners go one by one' },
    { id: 'friend', time: SND.cuts[0], label: 'Your friend shouts: 0.8 s late, hollow' },
    { id: 'pa', time: SND.cuts[1], label: 'One announcement, three arrivals' },
    { id: 'kick', time: SND.cuts[2], label: 'The whistle; a supersonic shot' },
    { id: 'drum', time: SND.cuts[3], label: 'The drum: claps sweep down the stand' },
    { id: 'thunder', time: SND.cuts[4], label: 'The flash from the start: its thunder' },
    { id: 'line', time: SND.lineA[0], label: 'The closing line' },
  ],

  camera: {
    baseY: 0,
    x: null, z: null, height: null, yaw: null, pitch: null, fov: null,   // sampled below
    tilt: null, startles: null, shakes: null,
  },

  hands: { right: null, left: null },     // up to your ears when the thunder arrives (filled in below)

  tracks: {
    pov: [[0, 1], [70, 1]],
  },

  hud: {
    title: { in: SND.title[0], out: SND.title[1], fi: 0.2, fo: 0.45, cls: 'big center', html: '<span class="kick">WHAT IF THE</span><span class="hero">SPEED OF SOUND</span><span class="kick">BECAME 10× SLOWER?</span>' },
    captions: [
      { t: 6.3, until: 9.4, text: 'Whoever stood nearest the gun would start first.' },
      { t: 11.3, until: 13.55, text: 'Your friend’s shout would take almost a second…' },
      { t: 13.75, until: 15.5, text: '…and you couldn’t make out a word.' },
      { t: 18.2, until: 21.3, text: 'One announcement would reach you three times.' },
      { t: 25.55, until: 27.05, text: 'A hard shot would break the sound barrier…' },
      { t: 27.25, until: 29.7, text: '…and you’d hear the kick after the goal.' },
      { t: 32.4, until: 34.9, text: 'A crowd could never clap in time…' },
      { t: 35.1, until: 38.4, text: '…every beat would ripple along the stand.' },
      { t: 38.9, until: 41.0, text: 'Remember the flash at the start?' },
      { t: 41.2, until: 44.0, text: 'Its thunder is still on the way.' },
      { t: 44.3, until: 47.4, text: 'Thunder would take half a minute per kilometre.' },
      { t: SND.lineA[0], until: SND.lineA[1], text: 'You’d see everything as it happened…' },
      { t: SND.lineB[0], until: SND.lineB[1], text: '…and hear it long after it was over.' },
    ],
    readouts: [],                      // filled in below (they key off the computed arrivals)
    says: [],                          // what is shouted / announced, placed when it ARRIVES (filled in below)
    notes: [{ t: SND.note[0], until: SND.note[1], text: 'FICTIONAL SIMULATION<br>ONLY THE SPEED OF SOUND IN AIR WAS CHANGED' }],
  },
};

function sndKmh(t) { const k = sndC(t) * 3.6; return k >= 1000 ? `${Math.floor(k / 1000)},${String(Math.round(k % 1000)).padStart(3, '0')} KM/H` : `${Math.round(k)} KM/H`; }

// --- the head, the arrivals at YOUR ear, and everything that keys off them -------------------------------------------
(function sndBuild() {
  const C = SCRIPT.camera, A = SND, n = Math.round(CONFIG.duration * 30) + 30;
  // 1. sample each shot at 30 Hz: position (cut = a jump between two frames), aim (smoothed inside each shot), lens
  const X = [], Y = [], Z = [], YAW = [], PITCH = [], FOV = [];
  let sy = null, sp = null, prevShot = -1;
  for (let i = 0; i <= n; i++) {
    const t = i / 30, k = sndShotAt(t), [, , eyeFn, tgtFn, fovFn] = SND_SHOTS[k];
    const e = eyeFn(t), q = tgtFn(t), dx = q.x - e.x, dz = q.z - e.z;
    let yaw = Math.atan2(-dx, -dz) * 180 / Math.PI, pitch = Math.atan2(q.y - e.y, Math.hypot(dx, dz)) * 180 / Math.PI;
    if (k !== prevShot) { sy = yaw; sp = pitch; prevShot = k; }
    while (yaw - sy > 180) yaw -= 360; while (yaw - sy < -180) yaw += 360;
    sy += (yaw - sy) * 0.22; sp += (pitch - sp) * 0.22;                  // a head, not a gimbal: a little lag
    const fov = fovFn(t);
    // through a long lens you brace: cancel the controller's idle sway (fully below 12° of view)
    const st = 1 - MathX.smooth(fov, 12, 30);
    const yw = sy - st * (noise1(t * 0.35, 11) * 0.6 + noise1(t * 1.3, 12) * 0.12), pt = sp - st * (noise1(t * 0.3, 13) * 0.45 + noise1(t * 1.1, 14) * 0.1);
    const tt = +t.toFixed(4);
    X.push([tt, +e.x.toFixed(3), 'linear']); Y.push([tt, +e.y.toFixed(3), 'linear']); Z.push([tt, +e.z.toFixed(3), 'linear']);
    YAW.push([tt, +yw.toFixed(3), 'linear']); PITCH.push([tt, +pt.toFixed(3), 'linear']); FOV.push([tt, +fov.toFixed(3), 'linear']);
  }
  C.x = X; C.z = Z; C.height = Y; C.yaw = YAW; C.pitch = PITCH; C.fov = FOV;
  SND_EAR = { x: Float64Array.from(X, (k) => k[1]), y: Float64Array.from(Y, (k) => k[1]), z: Float64Array.from(Z, (k) => k[1]), n: X.length };

  // 2. what reaches you, and when
  const H = A.heard = {};
  H.gun = sndArriveFixed(A.gun.bang, SND_GUN);
  H.shout = sndArriveFixed(A.friend.shout, SND_FRIEND_MOUTH);
  H.shout2 = sndArriveFixed(A.friend.shout2, SND_FRIEND_MOUTH);
  H.pa = A.pa.speakers.map((p) => sndArriveFixed(A.pa.speak, p)).sort((a, b) => a - b);
  H.whistle = sndArriveFixed(A.whistle.t, SND_P(A.whistle.x, A.whistle.y, A.whistle.z));
  H.kick = sndArriveFixed(A.kick.t, SND_P(A.kick.x, 0.15, A.kick.z));
  // the ball's own sound: the first arrival over its flight is the fold where it slows through Mach 1 (its "crack")
  H.ball = SoundArrival.firstArrival(sndBall, sndEar, A.C1, A.kick.t, SND_BALL.tGoal, 1 / 960).tr;
  H.drum = sndArriveFixed(A.drum.t0, SND_DRUM) - A.drum.t0;          // (the delay of every beat)
  H.thunder = sndThunderAt(sndEar(52));
  // 3. what that does to you: jolts, the thunder's shake, your hands flying up
  const tT = H.thunder;
  C.startles = [[H.gun + 0.02, 0.35], [H.kick + 0.02, 0.5], [tT + 0.02, 2.0]];
  C.shakes = [[H.kick + 0.01, 0.3, 0.25], [tT + 0.02, 1.15, 1.9]];
  C.tilt = [[0, 0], [tT, 0], [tT + 0.2, -3.5], [tT + 2.5, 0], [70, 0]];
  SCRIPT.hands.right = [[0, 'hidden'], [tT + 0.05, 'brace'], [tT + 1.7, 'brace'], [tT + 2.5, 'hidden']];
  SCRIPT.hands.left = [[0, 'hidden'], [tT + 0.08, 'brace'], [tT + 1.6, 'brace'], [tT + 2.4, 'hidden']];

  // 4. the readouts (top-left); the small "thunder" tag under them (tag: true) keeps the opening flash in mind
  const R = SCRIPT.hud.readouts, top = 200, tagTop = 470;
  const dGun = SoundArrival.dist(SND_GUN, sndEar(5));
  R.push({ from: 0.0, until: 3.65, top, label: 'SPEED OF SOUND', value: (t) => sndKmh(t), sub: (t) => `${sndC(t) >= 100 ? Math.round(sndC(t)) : sndC(t).toFixed(1)} M/S` });
  R.push({ from: A.gun.bang, until: 9.5, top, label: 'THE STARTING GUN', value: (t) => `${Math.min(t, H.gun) - A.gun.bang >= 0 ? (Math.min(t, H.gun) - A.gun.bang).toFixed(2) : '0.00'} S`,
    sub: (t) => (t < H.gun ? 'ITS BANG IS ON ITS WAY TO YOU…' : `HEARD · ${Math.round(dGun)} M AWAY`),
    ctx: (t) => (t < H.gun ? '' : `THE RUNNER NEAREST YOU HEARD IT ${(SND_RUNNERS[29].go - SND_RUNNERS[0].go).toFixed(1)} S AFTER THE FIRST`) });
  const tagIn = (t) => `IN ${Math.max(0, Math.round(sndThunderAt(sndEar(t)) - t))} S`;
  for (const [a, b] of [[2.95, 5.9], [SND.cuts[0] + 0.2, SND.cuts[0] + 2.6], [SND.cuts[1] + 0.2, SND.cuts[1] + 2.6], [SND.cuts[2] + 0.2, SND.cuts[2] + 2.4], [SND.cuts[3] + 0.2, SND.cuts[3] + 2.4]])
    R.push({ tag: true, from: a, until: b, top: tagTop, label: 'THE FLASH’S THUNDER', value: tagIn });
  const dF = SoundArrival.dist(SND_FRIEND_MOUTH, sndEar(10.5));
  R.push({ from: 10.0, until: 15.5, top, label: 'SOUND DELAY', value: (t) => (t < A.friend.shout ? '0.00 S' : `${(Math.min(t, H.shout) - A.friend.shout).toFixed(2)} S`),
    sub: (t) => (t >= A.friend.shout && t < H.shout ? 'ON ITS WAY TO YOU…' : `DISTANCE ${Math.round(dF)} M`),
    ctx: (t) => (t < 13.45 ? '' : 'VOICE RESONANCES 10× LOWER') });
  // (the five copies come in three bunches: count the bunches)
  const paG = []; for (const x of H.pa) if (!paG.length || x - paG[paG.length - 1][0] > 0.3) paG.push([x]); else paG[paG.length - 1].push(x);
  R.push({ from: 16.0, until: SND.cuts[2] - 0.1, top, label: 'ONE ANNOUNCEMENT', value: (t) => { const n = paG.filter((g) => g[0] <= t).length; return n ? `HEARD ${n}×` : 'NOT YET'; },
    sub: () => `FROM 5 LOUDSPEAKERS · ${paG.map((g) => (g[0] - A.pa.speak).toFixed(1)).join(' · ')} S LATE` });
  const dW = SoundArrival.dist(SND_P(A.whistle.x, A.whistle.y, A.whistle.z), SND_EYE[3]);
  R.push({ from: A.whistle.t - 0.1, until: A.kick.t - 0.15, top, label: 'THE REFEREE’S WHISTLE', value: (t) => `${Math.max(0, Math.min(t, H.whistle) - A.whistle.t).toFixed(2)} S`,
    sub: (t) => (t < H.whistle ? `ON ITS WAY · ${Math.round(dW)} M` : 'AND ABOUT 10× LOWER'), ctx: (t) => (t < H.whistle ? '' : 'ITS NOTE IS SET BY ITS AIR CHAMBER') });
  const B = SND_BALL;
  R.push({ from: A.kick.t, until: SND.cuts[3] - 0.1, top, label: 'THE SHOT · 144 KM/H', value: `MACH ${(A.kick.v0 / A.C1).toFixed(2)}`,
    sub: (t) => (t < B.tGoal ? `SUPERSONIC FOR ITS FIRST ${Math.round(B.dMach1)} M` : t < H.kick ? 'GOAL · THE KICK IS STILL ON ITS WAY…' : `THE KICK: HEARD ${(H.kick - B.tGoal).toFixed(1)} S AFTER THE GOAL`),
    ctx: (t) => (t < A.kick.t + 0.25 ? '' : 'THEN THE AIR BRAKES IT HARD') });
  const dD = SoundArrival.dist(SND_DRUM, SND_EYE[4]);
  R.push({ from: SND.cuts[3] + 0.2, until: SND.cuts[4] - 0.1, top, label: 'THE DRUM', value: `${H.drum.toFixed(1)} S LATE`, sub: `${Math.round(dD)} M AWAY`,
    ctx: 'EACH FAN CLAPS WHEN THEY HEAR IT' });
  const eT = SND_EYE[5], dT = SoundArrival.dist(SND_BOLT, { x: eT.x, y: 0, z: eT.z });
  R.push({ from: SND.cuts[4] + 0.2, until: tT + 0.1, top, label: 'THE FLASH AT 0:03', value: (t) => `${Math.max(0, tT - t).toFixed(1)} S`,
    sub: (t) => `ITS THUNDER: ${Math.max(0, Math.round(dT - SND_RUN(A.flash.t, t)))} M AWAY`, ctx: 'UNTIL IT REACHES YOU' });
  R.push({ from: tT + 0.1, until: A.flash2.t, top, label: 'THE THUNDER', value: `${(tT - A.flash.t).toFixed(0)} S LATE`, sub: 'IT WOULD ROLL ON FOR OVER A MINUTE' });
  const e2 = sndEar(A.flash2.t), tT2 = sndHeardAt(A.flash2.t, SND_P(A.flash2.x, 0, A.flash2.z), { x: e2.x, y: 0, z: e2.z });   // (the next flash's thunder: long after the film)
  R.push({ from: A.flash2.t + 0.15, until: A.note[1] + 0.05, top, label: 'THAT FLASH', value: (t) => `${Math.round(tT2 - t)} S`, sub: 'UNTIL YOU HEAR IT' });

  // 5. the words, shown when they ARRIVE (the second shout: what actually reaches you)
  const S = SCRIPT.hud.says;
  S.push({ t: +H.shout.toFixed(3), until: +(H.shout + 1.6).toFixed(3), text: '“Hey! Up here!”' });
  S.push({ t: +H.shout2.toFixed(3), until: +(H.shout2 + 1.5).toFixed(3), text: '“Uvvh… hhrrh!”' });
  H.pa.forEach((tr, i) => S.push({ t: +tr.toFixed(3), until: +(i + 1 < H.pa.length ? Math.min(H.pa[i + 1], tr + 1.1) : tr + 1.3).toFixed(3), text: '“Ladies and gentlemen…”' }));
})();

const SCRIPT_TRACKS = Object.fromEntries(Object.entries(SCRIPT.tracks).map(([k, v]) => [k, new Track(v, 'linear')]));
