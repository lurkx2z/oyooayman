/* =====================================================================
   FILM — "What if everything lost its elasticity?"
   Builds the plaza, the props, the bow, the fork, the watch, the clocks
   and the people; each frame it poses everything for STORY time t and,
   for the cinematic shots (the ball, the montage inserts, the arrow, the
   inside of the watch, the plaza clock and the time-lapse), puts the
   camera on its own shot. Also the world-pinned labels, the montage label
   and the grade. (The cut street beats are kept behind NE_STREET.)
   ===================================================================== */

// your hands: only for the rubber band (index fingers up inside the band, palms facing, the other fingers curled)
const NE_HAND_POSES = Object.assign({}, HAND_POSES, {
  bandIn:  { p: [0.04, -0.24, -0.5], F: [0, 1, -0.22], N: [-1, 0, 0], curl: [0.04, 1.35, 1.42, 1.48], thumb: [0.05, 0.9] },
  bandOut: { p: [0.13, -0.24, -0.5], F: [0, 1, -0.22], N: [-1, 0, 0], curl: [0.04, 1.35, 1.42, 1.48], thumb: [0.05, 0.9], trem: 0.0025 },
});
// the bow (left fist round the grip, arm out toward the target; right fingers hooked on the string, drawn to the jaw)
Object.assign(NE_HAND_POSES, {
  bowHold: { p: [0.07, -0.05, -0.7], F: [-0.25, 0.1, -0.96], N: [-0.97, 0, 0.25], curl: [1.25, 1.35, 1.42, 1.5], thumb: [0.35, 0.95] },
  bowShow: { p: [0.06, -0.08, -0.74], F: [-0.8, 0.1, -0.59], N: [-0.59, 0, 0.8], curl: [1.25, 1.35, 1.42, 1.5], thumb: [0.35, 0.95] },
  bowLow:  { p: [0.3, -0.64, -0.36], F: [-0.45, 0.3, -0.84], N: [-0.85, -0.2, 0.4], curl: [1.25, 1.35, 1.42, 1.5], thumb: [0.35, 0.95] },
  nock:    { p: [0.05, 0.02, -0.52], F: [-0.6, -0.07, -0.8], N: [-0.8, 0, 0.6], curl: [1.1, 1.25, 1.2, 1.45], thumb: [0.15, 0.7] },
  drawn:   { p: [0.07, -0.2, -0.19], F: [-0.6, -0.07, -0.8], N: [-0.8, 0, 0.6], curl: [1.1, 1.25, 1.2, 1.45], thumb: [0.15, 0.7], trem: 0.003 },
  loose:   { p: [0.13, -0.24, -0.1], F: [-0.55, 0.05, -0.83], N: [-0.83, 0, 0.55], curl: [0.25, 0.3, 0.35, 0.6], thumb: [0.35, 0.3] },
  // the tuning fork (right fist round the stem, the prongs up); the strike on the table; up in front of your eyes
  forkUp:   { p: [0.08, -0.17, -0.42], F: [-0.08, 0.06, -1], N: [-1, 0, 0.08], curl: [1.45, 1.5, 1.55, 1.6], thumb: [0.3, 0.9] },
  // the strike: palm down over the table, the fork flat out of the thumb side; its lower prong slaps the table top
  forkAim:  { p: [0.1205, 0.0699, -0.5519], F: [-0.3582, 0.446, -0.8202], N: [0.2795, -0.787, -0.55], curl: [1.45, 1.5, 1.55, 1.6], thumb: [0.3, 0.9] },
  forkHit:  { p: [0.1205, -0.001, -0.6073], F: [-0.3582, 0.446, -0.8202], N: [0.2795, -0.787, -0.55], curl: [1.45, 1.5, 1.55, 1.6], thumb: [0.3, 0.9] },
  forkShow: { p: [0.012, -0.15, -0.31], F: [-0.04, 0.0, -1], N: [-1, 0, 0.04], curl: [1.45, 1.5, 1.55, 1.6], thumb: [0.3, 0.9], trem: 0.0018 },
  // your watch: left forearm across in front of you, the dial turned up toward your eyes
  watchUp:  { p: [-0.025, -0.005, -0.3], F: [-0.95, 0.1, -0.3], N: [0, -0.6, -0.8], curl: [0.55, 0.65, 0.75, 0.85], thumb: [0.4, 0.35], trem: 0.0016 },
});
const NE_HAND_BLEND = Object.assign({}, HAND_BLEND, { bandIn: 0.5, bandOut: 0.5, bowHold: 0.3, bowShow: 0.6, bowLow: 0.55, nock: 0.25, drawn: 0.95, loose: 0.07,
  forkUp: 0.3, forkAim: 0.4, forkHit: 0.11, forkShow: 0.55, watchUp: 0.62 });
for (const k of Object.keys(NE_HAND_POSES)) { if (k.endsWith('!')) continue; NE_HAND_POSES[k + '!'] = NE_HAND_POSES[k]; NE_HAND_BLEND[k + '!'] = 0.02; }

// the cinematic shots: camera position / look-at / fov as functions of story time (null fields keep your own view)
const NE_BALL_A0 = 76;   // where the ball inserts look from (degrees round the ball): mostly clear of his legs
const NE_SHOTS = [
  // low beside the cradle at the height of its balls: the row stuck together, swinging a little as one; a dashed ghost
  // where the end ball would normally have flown
  { id: 'cradle', t0: NE.cradleIns[0], t1: NE.cradleIns[1],
    cam: (t) => { const C = NE_CRADLE, u = Ease.inOutSine((t - NE.cradleIns[0]) / (NE.cradleIns[1] - NE.cradleIns[0])), by = C.y0 + C.bar + 0.01 - C.L, zc = C.z - 0.056;
      return { p: [C.x - 1.02 + 0.03 * u, by + 0.07 - 0.01 * u, zc + 0.02], at: [C.x, by + 0.03, zc], fov: 37, focus: [C.x, C.z, 0.95] }; } },
  { id: 'ball', street: true, t0: NE.ballShot[0], t1: NE.ballShot[1],
    cam: (t, app) => { const [bx, bz] = app.ball.spot(app.cast), u = Ease.inOutSine((t - NE.ballShot[0]) / (NE.ballShot[1] - NE.ballShot[0])), d = 1.0 - 0.14 * u, a = MathX.deg(NE_BALL_A0 - 14 * u);
      return { p: [bx + Math.cos(a) * d, NE_BALL.ground + 0.06, bz + Math.sin(a) * d], at: [bx, NE_BALL.ground + 0.1, bz], fov: 40, focus: [bx, bz, 4] }; } },
  { id: 'racket', t0: NE.mont[0][0], t1: NE.mont[0][1], label: 'TENNIS RACKETS', line: 'The strings stretch… and stay stretched.',
    cam: (t) => { const R = NE_RACKET.p, u = t - NE.mont[0][0]; return { p: [R[0] - 0.62 + 0.03 * u, R[1] + 0.07, R[2] + 0.58 - 0.03 * u], at: [R[0], R[1] - 0.01, R[2]], fov: 36, focus: [R[0], R[2], 6] }; } },
  { id: 'shoe', t0: NE.mont[1][0], t1: NE.mont[1][1], label: 'RUNNING SHOES', line: 'The foam gets crushed… and mostly stays crushed.',
    cam: (t) => { const S = NE_SHOE.p, u = t - NE.mont[1][0]; return { p: [S[0] + 0.14, S[1] + 0.09, S[2] + 1.0 - 0.04 * u], at: [S[0] + 0.14, S[1] + 0.06, S[2]], fov: 36, focus: [S[0], S[2], 5] }; } },
  { id: 'cushion', t0: NE.mont[2][0], t1: NE.mont[2][1], label: 'CUSHIONS', line: 'Sit down once. The dent stays.',
    cam: (t) => { const B = NE_CITY.bench, u = t - NE.mont[2][0]; return { p: [B.x - 1.6 + 0.05 * u, 1.5, B.z - 1.55 + 0.04 * u], at: [B.x - 0.06, 0.58, B.z - 0.52], fov: 34, focus: [B.x, B.z, 6] }; } },
  { id: 'band', t0: NE.mont[3][0], t1: NE.mont[3][1], label: 'RUBBER BANDS', line: 'Stretch it once. It stays stretched.', cam: null },
  // low beside the red hatch, rolling along with its front wheel over the speed table (front axle, then rear, up and
  // down): the dashed line on its side is where the lower edge of its paint rode before the rule
  { id: 'wheel', street: true, t0: NE.wheelShot[0], t1: NE.wheelShot[1],
    cam: (t, app) => { const w = app.heroWheel(t), u = (t - NE.wheelShot[0]) / (NE.wheelShot[1] - NE.wheelShot[0]);
      return { p: [w.x + 4.2 - 0.2 * u, 0.5, w.z + 0.5], at: [w.x, 0.62, w.z - 0.2], fov: 44, focus: [w.x, w.z, 7] }; } },
  // side-on and low beside the box truck's rear axle as it crosses the table: the gap between the tyres and the box closes
  { id: 'truck', street: true, t0: NE.truckShot[0], t1: NE.truckShot[1],
    cam: (t, app) => { const zr = app.truckRear(t), u = (t - NE.truckShot[0]) / (NE.truckShot[1] - NE.truckShot[0]);
      return { p: [8.6, 0.78, zr + 2.4 - 0.5 * u], at: [1.75, 0.95, zr - 0.7], fov: 46, focus: [1.75, zr, 9] }; } },
  // the footbridge, face-on from high over the avenue (over the street trees): the whole span and both stair towers in
  // frame, so the dip has its ends to compare against; a running club crosses, the deck keeps the dip (drawn ×NE_SAG_DRAW)
  { id: 'bridge', street: true, t0: NE.bridge[0], t1: NE.bridge[1],
    cam: (t) => { const u = Ease.inOutSine((t - NE.bridge[0]) / (NE.bridge[1] - NE.bridge[0])), B = NE_CITY.bridge;
      return { p: [1.5 - 0.5 * u, 12.5 - 1.0 * u, B.z + 38 - 4.0 * u], at: [0, B.deck - 4.2, B.z], fov: 54, focus: [0, B.z, 22] }; } },
  // the crash from high behind the SUV (5.5 m up, looking down on the T-bone): the SUV runs the red into the crossing
  // sedan's flank, they lock and slide off as one; the camera pans with them. 1/3 speed
  { id: 'crash', street: true, t0: NE.crashShot[0], t1: NE.crashShot[1],
    cam: (t) => { const u = (t - NE.crashShot[0]) / (NE.crashShot[1] - NE.crashShot[0]), k = MathX.smooth(t, NE.crash, NE_CRASH.tv + 0.4);
      return { p: [-8.5 + 0.3 * u, 5.5, -55.0 + 0.4 * u], at: [-1.1 + 1.4 * k, 0.4, -45.8 + 1.8 * k], fov: 40, focus: [-1.0, -46, 14] }; } },
  // the locked wreck: a slow, high arc round it, starting from the side the van comes in (all three stay jammed together)
  { id: 'wreck', street: true, t0: NE.wreckShot[0], t1: NE.wreckShot[1],
    cam: (t) => { const c = [0.05, -44.4], u = Ease.inOutSine((t - NE.wreckShot[0]) / (NE.wreckShot[1] - NE.wreckShot[0])), a = MathX.deg(-70 + 90 * u), r = 13.5 - 0.5 * u;
      return { p: [c[0] + Math.sin(a) * r, 7.0 + 0.4 * u, c[1] + Math.cos(a) * r], at: [c[0] - 0.4, 0.4, c[1] - 1.0], fov: 40, focus: [c[0], c[1], 12] }; } },
  // the tap, side-on at the van's tail: the late hatch comes up the lane, brakes, meets the van at walking pace, backs off;
  // the camera pushes in on the bumper that stays pushed in (a dashed line where its front was)
  { id: 'tap', street: true, t0: NE.tapShot[0], t1: NE.tapShot[1],
    cam: (t, app) => { const T = NE_TAP, f = T.zc + CAR_PROFILES.hatch.L / 2, ps = app.traffic.q1.spec.pose(t), qf = ps ? ps.z + CAR_PROFILES.hatch.L / 2 : f - 9;
      const k = MathX.smooth(t, NE.tapBack[0], NE.tapBack[1] + 0.4), az = MathX.clamp(qf, f - 6.5, f - 0.1) * (1 - k) + (f - 0.55) * k;
      return { p: [5.2 - 3.7 * k, 1.5 - 0.75 * k, f - 1.2 + 0.8 * k], at: [T.x + 0.2, 0.62 - 0.12 * k, az], fov: 46 - 15 * k, focus: [T.x, f, 8] }; } },
  // the end: the opening insert again (the loop), low beside the flat ball, its old top drawn over it; a slow push
  { id: 'end', street: true, t0: NE.endShot, t1: NE.end + 1,
    cam: (t, app) => { const [bx, bz] = app.ball.spot(app.cast), u = Ease.outSine(MathX.clamp((t - NE.endShot) / (NE.end - NE.endShot), 0, 1)), d = 1.0 - 0.14 * u, a = MathX.deg(NE_BALL_A0 - 14);
      return { p: [bx + Math.cos(a) * d, NE_BALL.ground + 0.06, bz + Math.sin(a) * d], at: [bx, NE_BALL.ground + 0.1, bz], fov: 40, focus: [bx, bz, 4] }; } },
  // low on the paving behind the arrow that just dropped, looking along it at the target 14 m away: untouched
  { id: 'arrow', t0: NE.bow.shot[0], t1: NE.bow.shot[1],
    cam: (t, app) => { const L = app.bow.arrow.lying(app, t), u = Ease.inOutSine((t - NE.bow.shot[0]) / (NE.bow.shot[1] - NE.bow.shot[0])), [tx, tz] = NE_ARCH.target;
      // low, behind it and to its right: the arrow lies diagonally across the middle of the frame, above the caption
      const fx = -Math.sin(L.yaw), fz = -Math.cos(L.yaw), rx = -fz, rz = fx, mx = L.x + fx * 0.35, mz = L.z + fz * 0.35, back = 0.9 - 0.1 * u, side = 0.72 - 0.08 * u;
      return { p: [mx - fx * back + rx * side, 0.62 - 0.04 * u, mz - fz * back + rz * side], at: [mx + fx * 0.08, 0.17, mz + fz * 0.08], fov: 42, focus: [mx, mz, 1.1] }; } },
  // inside your watch (the macro set): the dial lifts away, down past the gears to the quartz crystal
  { id: 'quartz', t0: NE.quartz[0], t1: NE.quartz[1], cam: (t, app) => app.quartz.shot(t) },
  // the plaza clock face, frozen; the camera rises and pulls back over the plaza into the time-lapse
  { id: 'clock', t0: NE.clockShot[0], t1: NE.lapse[0], cam: (t) => neLapseCam(t) },
  // time-lapse inserts: low beside the trampoline (a light kid lands: nothing; a heavier adult: deeper), then a plaza tree
  // side-on to the wind, its old upright trunk dashed in
  { id: 'trampIns', t0: NE.ins.tramp[0], t1: NE.ins.tramp[1],
    cam: (t) => { const u = Ease.inOutSine((t - NE.ins.tramp[0]) / (NE.ins.tramp[1] - NE.ins.tramp[0])), T = NE_TRAMP;
      return { p: [T.x + 5.6 - 0.5 * u, 1.75 - 0.1 * u, T.z + 4.6 - 0.4 * u], at: [T.x - 0.2, 0.55, T.z], fov: 44, focus: [T.x, T.z, 7.5] }; } },
  { id: 'treeIns', t0: NE.ins.tree[0], t1: NE.ins.tree[1],
    cam: (t) => { const u = Ease.inOutSine((t - NE.ins.tree[0]) / (NE.ins.tree[1] - NE.ins.tree[0])), [tx, tz] = NE_CITY.trees[NE_LEAN_TREE], sx = -NE_WIND[1], sz = NE_WIND[0];
      // (side-on to the wind, from the pavement: the lean is across the frame, to the right)
      const d = 8.6 - 0.6 * u;
      return { p: [tx + sx * d, 1.45, tz + sz * d], at: [tx + NE_WIND[0] * 0.7, 3.05, tz + NE_WIND[1] * 0.7], fov: 55, focus: [tx, tz, d] }; } },
  { id: 'lapse', t0: NE.lapse[0], t1: NE.push, cam: (t) => neLapseCam(t) },
  // dusk into night: the plaza clock, still at 3:41, face-on; one push in on its dial as the lamps come on behind it
  { id: 'push', t0: NE.push, t1: NE.loop,
    cam: (t) => { const C = NE_CLOCK, n = [Math.sin(C.ry), Math.cos(C.ry)], x = [n[1], -n[0]], u = Ease.outSine(MathX.clamp((t - NE.push) / (NE.loop - NE.push), 0, 1)), v = 1 - u, d = 2.6 + 3.0 * v, s = 0.15 + 0.5 * v;
      return { p: [C.x + n[0] * d + x[0] * s, C.h - 0.12 - 0.5 * v, C.z + n[1] * d + x[1] * s], at: [C.x + x[0] * 0.03, C.h + 0.02 - 0.12 * v, C.z + x[1] * 0.03], fov: 42 + 4 * v, focus: [C.x, C.z, d] }; } },
  // the loop: back on the café table, the desk clock that stopped one second into the video
  { id: 'loop', t0: NE.loop, t1: NE.end + 1,
    cam: (t) => { const D = NE_DESK, f = [Math.sin(D.ry), Math.cos(D.ry)], u = Ease.outSine(MathX.clamp((t - NE.loop) / (NE.end - NE.loop), 0, 1)), d = 0.44 - 0.05 * u, cy = NE_CRADLE.y0 + 0.074;
      return { p: [D.x + f[0] * d, cy + 0.035, D.z + f[1] * d], at: [D.x, cy - 0.004, D.z], fov: 40, focus: [D.x, D.z, d] }; } },
].filter((s) => NE_STREET || !s.street);

// the clock shot and the time-lapse: one continuous camera (face-on to the clock, then up and back over the plaza; then a
// slow drift through the afternoon)
const NE_LAPSE_CAM = { p0: [10.3, 4.0, -6.7], p1: [10.95, 3.8, -7.2], at0: [18.8, 2.3, -13.7], at1: [18.8, 2.2, -13.7], fov: 56, t1: 49.6,
  // back from the inserts at dusk: the camera comes down to the trampoline's level, so the mat shows under its frame when
  // the day's heaviest landing takes it down to the paving (NE_PIT)
  p2: [11.9, 2.0, -7.8], at2: [19.0, 0.6, -12.5], fov2: 40, t2: 53.3 };
function neLapseCam(t) {
  const C = NE_CLOCK, n = [Math.sin(C.ry), Math.cos(C.ry)], head = [C.x, C.h, C.z], L = NE_LAPSE_CAM;
  const lap = Ease.inOutSine(MathX.clamp((t - NE.lapse[0]) / (L.t1 - NE.lapse[0]), 0, 1)), q = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);
  const pL = q(L.p0, L.p1, lap), aL = q(L.at0, L.at1, lap);
  if (t >= NE.lapse[0]) { const m = Ease.inOutSine(MathX.clamp((t - L.t1) / (L.t2 - L.t1), 0, 1));
    return { p: q(pL, L.p2, m), at: q(aL, L.at2, m), fov: L.fov + (L.fov2 - L.fov) * m, focus: [17, -11.5, 16 - 4 * m] }; }
  // the clock shot: face-on, a little below the dial; then (from 38.9) up and back to the time-lapse framing
  const u = (t - NE.clockShot[0]) / (NE.lapse[0] - NE.clockShot[0]), k = Ease.inOutSine(MathX.clamp((t - 38.6) / (NE.lapse[0] - 38.6), 0, 1));
  const pC = [head[0] + n[0] * (3.3 - 0.25 * u) + 0.25, head[1] - 0.32, head[2] + n[1] * (3.3 - 0.25 * u)], aC = [head[0], head[1] - 0.15, head[2]];
  return { p: q(pC, L.p0, k), at: q(aC, L.at0, Ease.inOutSine(MathX.clamp((t - 38.9) / (NE.lapse[0] - 38.9), 0, 1))), fov: 34 + (L.fov - 34) * k, focus: [C.x + 3 * k, C.z - 3 * k, 10 + 14 * k] };
}

// labels pinned to things in the world: [t0, t1, point(t, app) → [x, y, z], text]
const NE_TAGS = [
  // (new beats)
  { t0: 25.4, t1: 27.1, at: (t, app) => app.fork.tipWorld(t), text: 'STAYS BENT · DRAWN 10× BIGGER', cls: 'ne-tag line' },
  { t0: 32.0, t1: 33.5, at: () => neQ(NE_Q.can[0] + 0.6, NE_Q.can[1] + 0.4, NE_Q.can[2]), text: 'THE QUARTZ CRYSTAL' },
  { t0: 33.85, t1: 35.75, at: () => neQ(NE_Q.can[0] + 1.6, NE_Q.can[1] + 0.4, NE_Q.can[2] + 0.9), text: 'NORMALLY', cls: 'ne-tag line' },
  { t0: NE.ins.tramp[0] + 0.25, t1: NE.ins.tramp[1] - 0.1, at: () => [NE_TRAMP.x, 0.95, NE_TRAMP.z], text: 'DEEPER ONLY AFTER A HARDER LANDING' },
  { t0: NE.ins.tree[0] + 0.25, t1: NE.ins.tree[1] - 0.1, at: () => [NE_CITY.trees[NE_LEAN_TREE][0], 5.4, NE_CITY.trees[NE_LEAN_TREE][1]], text: 'EACH STRONGER GUST BENDS IT FURTHER' },
  { t0: NE_PIT[NE_PIT.length - 1][0] + 0.15, t1: NE.push, at: () => [NE_TRAMP.x, 1.25, NE_TRAMP.z], text: 'MAT ON THE GROUND · IT STAYS THERE' },
  // (the first cut)
  { t0: 3.6, t1: NE.cradleIns[1] - 0.1, at: (t, app) => { const g = app.cradle.ghostWorld(); g[1] += NE_CRADLE.r + 0.004; return g; }, text: 'NORMALLY, THIS ONE FLIES OUT', cls: 'ne-tag line' },
  { street: true, t0: 3.55, t1: 5.45, at: (t, app) => { const [bx, bz] = app.ball.spot(app.cast); return [bx, NE_BALL.ground + 2 * NE_BALL.r + 0.004, bz]; }, text: 'WHERE ITS TOP USED TO BE', cls: 'ne-tag line' },
  { t0: 16.15, t1: 17.35, at: () => [NE_TRAMP.x - 1.2, 1.35, NE_TRAMP.z + 1.2], text: 'SPRINGS STRETCHED · MAT STAYS DOWN' },
  { street: true, t0: 23.9, t1: 25.4, at: (t, app) => { const w = app.heroWheel(t); return [w.x + 0.15, 0.62, w.z - 0.75]; }, text: 'WHERE THE BODY USED TO SIT', cls: 'ne-tag line' },
  { street: true, t0: 25.8, t1: 26.85, at: (t, app) => { const w = app.heroWheel(t); return [w.x, 0.98, w.z]; }, text: 'SPRING STAYS SQUASHED', cls: 'ne-tag line' },
  { street: true, t0: 36.7, t1: 37.9, at: (t, app) => [2.95, 1.25, app.truckRear(t) - 0.6], text: 'WHERE THE BOX USED TO SIT', cls: 'ne-tag line' },
  { street: true, t0: 38.95, t1: 39.6, at: (t, app) => [2.9, 0.98, app.truckRear(t)], text: 'REAR SPRINGS · ON THE STOPS' },
  { street: true, t0: NE.bridge[0] + 0.3, t1: 45.6, at: () => [-6.5, NE_CITY.bridge.deck - 0.05, NE_CITY.bridge.z + NE_CITY.bridge.w / 2 + 0.35], text: 'WHERE THE DECK WAS', cls: 'ne-tag line' },
  { street: true, t0: NE.bridge[0] + 0.3, t1: NE.bridge[1] - 0.2, at: (t) => [0, NE_CITY.bridge.deck - 0.6 - neSag(t), NE_CITY.bridge.z + NE_CITY.bridge.w / 2], text: `SAG DRAWN ${NE_SAG_DRAW}× LARGER` },
  { street: true, t0: 61.3, t1: 63.3, at: (t, app) => { const ps = app.traffic.q1.spec.pose(t); return [ps.x, 0.8, ps.z + CAR_PROFILES.hatch.L / 2 - NE_TAP.dent]; }, text: 'BUMPER PUSHED IN · STAYS IN' },
].filter((g) => NE_STREET || !g.street);

const FILM = {
  build(app) {
    const { scene, camera, renderer } = app;
    FILM._app = app;
    camera.near = 0.03; camera.far = 2800; camera.updateProjectionMatrix();
    app.env = new NeCity(scene, renderer, app.rng);
    app.env.camera = camera;                       // (haze cards need it before build)
    app.env.build();
    app.traffic = NE_STREET ? new NeTraffic(scene) : null;
    app.tramp = new NeTramp(scene);
    app.ball = new NeBall(scene);
    app.racket = new NeRacket(scene);
    app.shoe = new NeShoe(scene);
    app.cushions = new NeCushions(scene);
    app.target = new NeTarget(scene);
    app.clock = new NeClock(scene);
    app.cradle = new NeCradle(scene);
    app.quartz = new NeQuartz(scene);
    app.lapse = new NeLapse(app);
    app.cast = new NeCast(app);
    if (NE_STREET) {
      app.deckLine = this._deckLine(scene);
      app.sillLine = this._sillLine(app.traffic.H);
      app.boxLine = this._boxLine(app.traffic.truck);
      app.noseLine = this._noseLine(app.traffic.q1);
    }
    // the shared material treatment, lighter on the grime (a clean, sunny plaza); people and the bending materials skip it
    Look.surface(app.env.m.sidewalk, false); Look.grime(app.env.m.sidewalk, 0.2);
    { const skip = new Set(); camera.traverse((o) => skip.add(o)); app.quartz.g.traverse((o) => skip.add(o));
      scene.traverse((o) => {
        if (!o.isMesh || skip.has(o)) return;
        let q = o, person = false, veh = false; while (q) { if (q.name && q.name.startsWith('person:')) person = true; if (q.name && q.name.startsWith('veh:')) veh = true; q = q.parent; }
        if (person) return;
        for (const m of [].concat(o.material)) if (m && m.isMeshStandardMaterial && m.userData.grime === undefined && m.onBeforeCompile === THREE.Material.prototype.onBeforeCompile) { Look.surface(m, veh); if (!/glass|tire/i.test(m.name || '')) Look.grime(m, veh ? 0.3 : 0.5); }
      }); }
    // your hands (a grey hoodie sleeve, a quartz watch on the left wrist), the rubber band, the bow, the fork, the watch dial
    app.hands = new ViewerHands(camera, { scale: 1.04, skin: '#c99a7c', nail: '#d9b4a2', sleeve: '#5a6068', cuff: '#474c53', watch: true, sleeveLen: 1.1, sleeveFit: 0.78,
      poses: NE_HAND_POSES, blends: NE_HAND_BLEND });
    app.band = new NeBand(scene, app.hands);
    app.bow = new NeBow(scene, app.hands);
    app.fork = new NeFork(app.hands);
    app.watch = new NeWatch(app.hands);
    if (NE_STREET) {
      // the hero car's front-right wheel (the wheel shot follows it)
      const H = app.traffic.H, fw = H.wheels.find((w) => w.axle === 1 && w.side === 1);
      const wv = new THREE.Vector3();
      app.heroWheel = (t) => { const ps = H.spec.pose(t), c = Math.cos(ps.yaw + Math.PI / 2), s = Math.sin(ps.yaw + Math.PI / 2), lx = fw.m.position.x, lz = fw.m.position.z;
        return wv.set(ps.x + c * lx + s * lz, 0, ps.z - s * lx + c * lz); };
      // the truck's rear axle (z): the truck insert follows it
      { const TR = app.traffic.truck; app.truckRear = (t) => TR._axleZ(TR.spec.pose(t), 0); }
      // where the wreck ends up (the wreck shot circles it)
      { const C = NE_CRASH, w = C.slide(C.c2, C.V2, C.w2, C.tv, 30); app.wreckC = [w.x, w.z]; }
    }
    // HUD + overlays
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    const hud = document.getElementById('hud');
    const mk = (cls) => { const d = document.createElement('div'); d.className = cls; d.style.opacity = '0'; hud.appendChild(d); return d; };
    app.chyron = mk('ne-chyron');
    app.tags = [mk('ne-tag'), mk('ne-tag')];
    app.audio = new NeAudio(app.tl, app);
    this._v = new THREE.Vector3(); this._f = new THREE.Vector3();
  },

  // a dashed yellow line where the footbridge deck used to be (on the near face of the deck)
  _deckLine(scene) {
    const B = NE_CITY.bridge, g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: '#ffd23e', fog: false, depthTest: true });
    for (let x = -B.half - 1.3; x < B.half + 1.1; x += 1.0) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.09, 0.04), mat); m.position.set(x + 0.275, B.deck - 0.04, B.z + B.w / 2 + 0.35); g.add(m); }
    g.visible = false; scene.add(g); return g;
  },

  // a dashed yellow line along the red hatch's right side where the lower edge of its paint rode before the rule (wheel shot
  // only); it runs on past both bumpers and across the wheels so the drop reads against it
  _sillLine(H) {
    const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: '#ffd23e', fog: false });
    for (let x = -H.L / 2 - 0.55; x < H.L / 2 + 0.5; x += 0.3) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.012), mat); m.position.set(x + 0.08, 0, H.W / 2 + 0.06); g.add(m);
    }
    g.visible = false; H.g.add(g); return g;
  },

  // the same along the truck's right side, at the healthy height of the box floor over the rear axle (truck shot only)
  _boxLine(TR) {
    const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: '#ffd23e', fog: false });
    for (let x = -TR.L / 2 - 0.6; x < 0.6; x += 0.3) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.012), mat); m.position.set(x + 0.08, 0, TR.W / 2 + 0.07); g.add(m); }
    g.visible = false; TR.g.add(g); return g;
  },

  // a vertical dashed line at the late hatch's original front (its near corner), for the tap
  _noseLine(Q) {
    const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: '#ffd23e', fog: false });
    for (let y = 0.2; y < 0.95; y += 0.06) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.032, 0.012), mat); m.position.set(Q.L / 2 + 0.01, y, -Q.W / 2 - 0.02); g.add(m); }
    g.visible = false; Q.g.add(g); return g;
  },

  shotAt(t) { return NE_SHOTS.find((s) => t >= s.t0 && t < s.t1) || null; },

  update(app, t) {
    const cam = app.camera, shot = this.shotAt(t);
    // the arrow's release pose is worked out once, from your head and hands at the moment you let go
    if (t >= NE.bow.release && !app.bow.arrow._rel) app.bow.arrow._release(app, app.bow, t);
    const sh = shot && shot.cam ? shot.cam(t, app) : null;
    if (sh) {
      cam.position.set(...sh.p);
      const [ax, ay, az] = sh.at, dx = ax - sh.p[0], dy = ay - sh.p[1], dz = az - sh.p[2];
      cam.rotation.set(Math.atan2(dy, Math.hypot(dx, dz)), Math.atan2(-dx, -dz), sh.roll || 0, 'YXZ');
      if (Math.abs(cam.fov - sh.fov) > 1e-3) { cam.fov = sh.fov; cam.updateProjectionMatrix(); }
      // the crash: the camera takes the hit too (a short, decaying shake)
      if (shot.id === 'crash') { const k = MathX.impulse(t, NE.crash, 0.18); cam.rotation.x += 0.012 * k * Math.sin(t * 190); cam.rotation.y += 0.009 * k * Math.sin(t * 157); }
    }
    cam.updateMatrixWorld(true);
    // the sun's shadow box follows what you are looking at
    if (sh && sh.focus) app.env.focus(...sh.focus);
    else {
      const f = cam.getWorldDirection(this._f); f.y = 0; f.normalize();
      const d = cam.fov < 30 ? 50 : 20, r = cam.fov < 30 ? 46 : 30;
      app.env.focus(cam.position.x + f.x * d, cam.position.z + f.z * d, r);
    }
    app.env.update(t);
    if (app.traffic) app.traffic.update(t, cam, app.scene.fog);
    app.cast.update(t);
    app.ball.update(t, app.cast);
    app.ball.m.visible = NE_STREET;                 // (the v1 opening's ball; v2 opens on the cradle)
    app.tramp.update(t);
    app.racket.update(t);
    app.shoe.update(t);
    app.cushions.update(t);
    app.hands.update(t);
    if (sh) { app.hands.right.g.visible = false; app.hands.left.g.visible = false; }
    app.band.update(t, cam);
    app.bow.update(t, app);
    app.fork.update(t);
    app.clock.update(t);
    app.cradle.update(t);
    app.quartz.update(t);
    app.lapse.update(t);
    // the ball's old outline, turned to the low camera
    { const on = !!(shot && (shot.id === 'ball' || shot.id === 'end')), R = app.ball.ring; R.visible = on;
      if (on) { const [bx, bz] = app.ball.spot(app.cast); R.position.set(bx, NE_BALL.ground + NE_BALL.r, bz); R.lookAt(app.camera.position.x, NE_BALL.ground + NE_BALL.r, app.camera.position.z); } }
    if (NE_STREET) {
      app.deckLine.visible = t > NE.bridge[0] - 0.5 && t < NE.bridge[1];
      app.noseLine.visible = !!(shot && shot.id === 'tap') && t > NE.tap + 0.15;
      // the line sits at the healthy height of the red paint's lower edge (0.46 m above the road under the car)
      { const H = app.traffic.H, ps = H.spec.pose(t), on = shot && shot.id === 'wheel';
        app.sillLine.visible = !!on;
        if (on) { const r0 = neRoadY(H._axleZ(ps, 0)), r1 = neRoadY(H._axleZ(ps, 1));
          app.sillLine.rotation.z = Math.atan2(r1 - r0, H.axles[1] - H.axles[0]); app.sillLine.position.y = (r0 + r1) / 2 + 0.46; } }
      { const TR = app.traffic.truck, ps = TR.spec.pose(t), on = shot && shot.id === 'truck';
        app.boxLine.visible = !!on;
        if (on) { const r0 = neRoadY(TR._axleZ(ps, 0)), r1 = neRoadY(TR._axleZ(ps, 1)), wb = TR.axles[1] - TR.axles[0];
          app.boxLine.rotation.z = Math.atan2(r1 - r0, wb); app.boxLine.position.y = (r0 + r1) / 2 + 1.22; } }
    }
    this._overlays(app, t, shot);
  },

  _overlays(app, t, shot) {
    // the montage label (what you're looking at, and what happened to it)
    const ch = app.chyron, k = shot && shot.label ? StoryHUD.win(t, shot.t0, shot.t1, 0.12, 0.15) : 0;
    if (shot && shot.label && ch._id !== shot.id) { ch.innerHTML = `<span class="mt">${shot.label}</span><span class="mr">${shot.line}</span>`; ch._id = shot.id; }
    ch.style.opacity = k.toFixed(3);
    // labels pinned to the world (at most two at once)
    const live = NE_TAGS.filter((g) => t >= g.t0 && t < g.t1), v = this._v;
    app.tags.forEach((el, i) => {
      const T = live[i];
      if (!T) { el.style.opacity = '0'; return; }
      v.set(...T.at(t, app)).project(app.camera);
      const vis = v.z < 1 && Math.abs(v.x) < 0.9 && v.y < 0.93 && v.y > -0.9;
      if (el._t !== T.text) { el.textContent = T.text; el._t = T.text; el.className = T.cls || 'ne-tag'; }
      // keep the whole label on screen and clear of the readout (the tick still points at the thing)
      const W = el.parentNode.clientWidth, Hh = el.parentNode.clientHeight, u = W / 1080, hw = el.offsetWidth / 2;
      const x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * Hh, cx = MathX.clamp(x, hw + 44 * u, 0.86 * W - hw), cy = Math.max(y, (t >= NE.lapse[0] ? 640 : 430) * u + el.offsetHeight + 26 * u);
      el.style.left = `${cx.toFixed(1)}px`; el.style.top = `${cy.toFixed(1)}px`; el.style.setProperty('--tick', `${(x - cx).toFixed(1)}px`);
      el.style.opacity = vis ? StoryHUD.win(t, T.t0, T.t1, 0.15, 0.15).toFixed(3) : '0';
    });
  },

  grade(t, p) {
    const tired = MathX.smooth(t, NE.rule[1], 40);
    p.flash = 0; p.fade = 0; p.ao = 0.55;
    p.exposure = 1.12; p.saturation = 1.24; p.contrast = 1.1; p.warmth = 0.08; p.blackLift = 0.0;
    p.vignette = 0.45; p.soft = 0.015; p.bloom = 0.24; p.bloomThreshold = 1.4; p.grain = 0.02;
    p.tunnel = 1.25; p.tunnelSoft = 0.5; p.tunnelDark = 0; p.edgeBlur = 0; p.chroma = 0;
    p.flashColor.setRGB(1, 1, 1);
    // the day goes a little flatter and cooler as everything gives up (colour as storytelling), until the time-lapse
    const lap = t >= NE.lapse[0] ? 1 : 0;
    p.saturation -= 0.12 * tired * (1 - lap); p.warmth -= 0.06 * tired * (1 - lap); p.contrast -= 0.03 * tired * (1 - lap);
    // the rule bites: a small jolt of chroma under the title
    p.chroma += 0.004 * MathX.impulse(t, NE.rule[0] + 0.15, 0.3);
    // the bow: a touch of tunnel while you aim; the release lands in a small silence of colour
    if (t >= NE.bow.t0 && t < NE.bow.release) p.vignette += 0.12 * MathX.smooth(t, NE.bow.draw[0], NE.bow.draw[1]);
    // inside the watch: a cooler, darker studio look, heavier vignette
    if (t >= NE.quartz[0] && t < NE.quartz[1]) { p.vignette += 0.3; p.warmth -= 0.06; p.contrast += 0.06; p.exposure -= 0.04; p.bloom = 0.3; }
    // the time-lapse: golden, then dusk (lift the exposure as the light goes, keep the lamps glowing)
    if (lap) {
      const m = neSunMinutes(t), gold = MathX.window(m, 18 * 60 + 15, 20 * 60, 40, 30), dusk = neDusk(t);
      p.warmth += 0.07 * gold - 0.08 * dusk; p.saturation += 0.06 * gold; p.exposure += 0.18 * MathX.smooth(m, 19 * 60, 20 * 60 + 30) + 0.12 * dusk;
      p.bloom = 0.24 + 0.22 * dusk; p.bloomThreshold = 1.4 - 0.5 * dusk; p.contrast += 0.04 * dusk; p.vignette += 0.1 * dusk;
    }
    if (NE_STREET) {
      // the crash: a hit of chroma (no white flash: it hid the contact); the slow motion is a touch harder
      p.chroma += 0.007 * MathX.impulse(t, NE.crash, 0.12) + 0.005 * MathX.impulse(t, NE_CRASH.tv, 0.2);
      if (t > NE.crashSlow[0] && t < NE.crashSlow[1]) { p.contrast += 0.06; p.saturation -= 0.08; p.vignette += 0.15; }
      if (t >= NE.bridge[0] && t < NE.bridge[1]) p.exposure += 0.14;
    }
    p.fade = MathX.smooth(t, NE.end - 0.45, NE.end);
    // whip pans drag a little (camera-lag trail)
    const app = FILM._app;
    if (app && app.cam && !this.shotAt(t) && !this.shotAt(t - 1 / 30)) {
      const C = app.cam, dt = 1 / 30, vf = C.tfov.value(t);
      const hfov = 2 * Math.atan(Math.tan(MathX.deg(vf) / 2) * 9 / 16) * 180 / Math.PI;
      const yr = (C.tyaw.value(t) - C.tyaw.value(t - dt)) / dt, pr = (C.tpitch.value(t) - C.tpitch.value(t - dt)) / dt;
      // (every real pan in this film is slow; anything this fast is a cut between two set-ups, so no trail)
      const cut = Math.abs(yr) > 400 || Math.abs(pr) > 400 ? 0 : 1;
      p.smear.set(cut * MathX.clamp(yr / hfov * 0.008, -0.025, 0.025), cut * MathX.clamp(-pr / vf * 0.008, -0.025, 0.025));
    } else p.smear.set(0, 0);
  },

  debug(app, t) {
    return `rule ${neRule(t).toFixed(2)} · sun ${neClockText(neSunMinutes(t))} · lean ${neTreeLean(t).toFixed(2)} · mat ${neMatDepth(t).toFixed(2)} m`;
  },
};
