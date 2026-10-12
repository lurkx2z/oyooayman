/* =====================================================================
   SHOTS — every camera in the 3-minute film (no POV). Each shot: [t0, t1) with a camera function of (t, ctx) →
   { pos, at, fov, roll, focus, dof }. Moves are slow and motivated (push, drift, crane, track); handheld only as
   decaying impulses (the gravity hit). Cut points come from script.js (GB), i.e. from the real narration.
   No shot is a static hold: the longest ones (the silent crane, the final shot) move all the way through.
   ===================================================================== */

const _gbV = (x, y, z) => new THREE.Vector3(x, y, z);
const _gbL = (a, b, k) => new THREE.Vector3().lerpVectors(a, b, k);
// a shot that moves linearly (eased) from A to B over its window: A/B = [pos, at, fov]
function gbMove(t0, t1, A, B, o = {}) {
  return (t, ctx) => {
    const k = (o.ease || Ease.inOutSine)(MathX.ramp(t, t0, t1));
    const pos = _gbL(A[0], B[0], k), at = _gbL(A[1], B[1], k);
    const fov = MathX.lerp(A[2], B[2], k);
    return { pos, at, fov, focus: o.focus ? o.focus(t, ctx, pos) : pos.distanceTo(at), dof: o.dof ?? 0.35, roll: 0 };
  };
}
// a point in the bench's frame (x along the bench, z = where he faces), world
function gbBenchP(x, y, z) { const [bx, bz, by] = GB_SET.bench; const c = Math.cos(by), s = Math.sin(by); return _gbV(bx + x * c + z * s, y, bz - x * s + z * c); }


const GB_SHOTS = [
  // ================= SCENE 1 — the moment it happens
  // A1 — the café at sunrise: a slow drift past the counter toward his table (the title sits over it)
  { id: 'A1', t0: -1, t1: 4.9, rim: 1.0,
    cam: gbMove(0, 4.9, [_gbV(1.6, 1.55, -0.2), _gbV(-2.3, 1.0, -2.6), 46], [_gbV(0.7, 1.42, -0.95), _gbV(-2.35, 0.98, -2.65), 42], { dof: 0.3 }) },
  // A2 — on him with his cup, looking out of the window; a slow push
  { id: 'A2', t0: 4.9, t1: GB.g - 1.1, rim: 1.0,
    cam: gbMove(4.9, GB.g - 1.1, [_gbV(-1.05, 1.28, -1.75), _gbV(-2.5, 1.0, -2.72), 38], [_gbV(-1.4, 1.2, -2.0), _gbV(-2.45, 0.98, -2.7), 34], { dof: 0.6 }) },
  // A3 — the cup in his hand, the forearm in frame: on "heavy" it sinks; he lets it down onto the saucer (the clack)
  { id: 'A3', t0: GB.g - 1.1, t1: GB.s2, rim: 0.95,
    cam: (t, ctx) => {
      const k = Ease.inOutSine(MathX.ramp(t, GB.g - 1.1, GB.s2));
      const c = ctx.cupRestP;
      const pos = _gbL(c.clone().add(_gbV(0.62, 0.26, 0.52)), c.clone().add(_gbV(0.55, 0.2, 0.46)), k);
      const at = c.clone().add(_gbV(-0.12, 0.1 + 0.6 * (ctx.cupH || 0), -0.04));
      const hit = gbSpring(t, GB.g, 0.02, 3.2, 4.5) + 0.01 * MathX.smooth(t, GB.g, GB.g + 0.15);
      pos.y -= hit; at.y -= hit * 1.4;
      return { pos, at, fov: 36, focus: pos.distanceTo(at), dof: 0.9, roll: gbSpring(t, GB.g, 0.8, 2.6, 4) };
    } },
  // ================= SCENE 2 — no narration: the first struggle
  // B1 — close on the hand: the grip tightens, the other palm braces, the pull, the cup leaves the saucer
  { id: 'B1', t0: GB.s2, t1: GB.faceCut, rim: 0.9,
    cam: (t, ctx) => {
      const k = Ease.inOutSine(MathX.ramp(t, GB.s2, GB.faceCut));
      const cup = ctx.cupRestP;
      const pos = _gbL(cup.clone().add(_gbV(0.42, 0.1, 0.36)), cup.clone().add(_gbV(0.34, 0.12, 0.3)), k);
      const at = cup.clone().add(_gbV(-0.05, 0.05 + 0.5 * (ctx.cupH || 0), -0.08));
      return { pos, at, fov: 32, focus: pos.distanceTo(at), dof: 1.5 };
    } },
  // B2 — hands and face in one take; rack focus to his face at the top, back to the cup as it goes down
  { id: 'B2', t0: GB.faceCut, t1: GB.letGo + 0.7, rim: 0.9,
    cam: (t, ctx) => {
      const k = Ease.inOutSine(MathX.ramp(t, GB.faceCut, GB.letGo + 0.7));
      const pos = _gbL(_gbV(-1.32, 0.98, -2.22), _gbV(-1.46, 0.97, -2.3), k);
      const cup = ctx.cupP, face = ctx.faceP;
      const hands = _gbV(cup.x - 0.04, cup.y + 0.04, cup.z - 0.12);
      const rk = Ease.inOutCubic(MathX.ramp(t, GB.top - 0.1, GB.top + 0.6)) * (1 - Ease.inOutCubic(MathX.ramp(t, GB.lower + 0.4, GB.lower + 1.1)));
      const at = _gbL(hands, face, 0.38 + 0.12 * rk);
      return { pos, at, fov: MathX.lerp(37, 33, k), focus: MathX.lerp(pos.distanceTo(hands), pos.distanceTo(face), rk), dof: 1.3 };
    } },
  // B3 — the aftermath from the window side: he sits back, breathing; the room is quiet
  { id: 'B3', t0: GB.letGo + 0.7, t1: GB.s3, rim: 1.05,
    cam: gbMove(GB.letGo + 0.7, GB.s3, [_gbV(-1.2, 1.15, -3.45), _gbV(-2.6, 0.95, -2.62), 40], [_gbV(-1.35, 1.12, -3.4), _gbV(-2.6, 0.97, -2.6), 37], { dof: 0.7 }) },
  // ================= SCENE 3 — same mass, double weight (the hologram)
  // C1 — the real cup and its blue twin side by side; a slow arc
  { id: 'C1', t0: GB.s3, t1: GB.body, rim: 0.9, holo: true,
    cam: (t) => {
      const k = Ease.inOutSine(MathX.ramp(t, GB.s3, GB.body));
      const [tx, tz] = GB_SET.heroTable, c = _gbV(tx - 0.04, GB_SET.tableH + 0.2, tz + 0.18);
      const a = 0.55 - 0.45 * k, r = 0.95 - 0.08 * k;
      const pos = _gbV(c.x + Math.cos(a) * r, c.y + 0.22 - 0.04 * k, c.z + Math.sin(a) * r);
      return { pos, at: c, fov: 36, focus: r, dof: 0.8 };
    } },
  // C2 — "even your own body": on him, the body label beside him
  { id: 'C2', t0: GB.body, t1: GB.pull, rim: 1.0, holo: true,
    cam: gbMove(GB.body, GB.pull, [_gbV(-1.0, 1.2, -2.45), _gbV(-2.75, 0.95, -2.8), 42], [_gbV(-1.15, 1.18, -2.5), _gbV(-2.75, 0.98, -2.8), 39], { dof: 0.5 }) },
  // C3 — back to the twin: the weight arrow grows 1× → 2× on "twice as hard"; a slow push in
  { id: 'C3', t0: GB.pull, t1: GB.exp, rim: 0.9, holo: true,
    cam: (t) => {
      const k = Ease.inOutSine(MathX.ramp(t, GB.pull, GB.exp));
      const h = _gbV(GB_SET.heroTable[0] + 0.14, GB_SET.tableH + 0.2, GB_SET.heroTable[1] + 0.24);
      const pos = _gbL(h.clone().add(_gbV(0.78, 0.12, 0.62)), h.clone().add(_gbV(0.62, 0.08, 0.5)), k);
      return { pos, at: h, fov: 34, focus: pos.distanceTo(h), dof: 0.6 };
    } },
  // ================= SCENE 4 — the experiment
  // D1 — match cut onto the 2 g ball in its clamp; pull back to both lanes and the metre stick
  { id: 'D1', t0: GB.exp, t1: GB.lane1[0] - 0.2, rim: 0.9, exp: true,
    cam: (t) => {
      const D = GB_DROP, x2 = D.lanes[1].x, Z = D.z, cy = D.padH + D.h + D.r;
      const k = Ease.inOutCubic(MathX.ramp(t, GB.wideExp - 0.5, GB.wideExp + 1.8));
      const pos = _gbL(_gbV(x2 + 0.18, cy + 0.04, Z + 0.55), _gbV(D.rulerX, 0.74, Z + 2.6), k);
      const at = _gbL(_gbV(x2, cy, Z), _gbV(D.rulerX, 0.62, Z), k);
      return { pos, at, fov: MathX.lerp(30, 34, k), focus: pos.distanceTo(at), dof: 0.3 + 0.6 * (1 - k) };
    } },
  // D2 — "under normal gravity": drift toward the 1 g lane
  { id: 'D2', t0: GB.lane1[0] - 0.2, t1: GB.lane2[0] - 0.2, rim: 0.9, exp: true,
    cam: gbMove(GB.lane1[0] - 0.2, GB.lane2[0] - 0.2, [_gbV(0.5, 0.86, GB_DROP.z + 2.2), _gbV(0.4, 0.8, GB_DROP.z), 36], [_gbV(0.28, 0.9, GB_DROP.z + 1.95), _gbV(0.32, 0.8, GB_DROP.z), 34], { dof: 0.35 }) },
  // D3 — "but under double gravity": the same framing on the 2 g lane
  { id: 'D3', t0: GB.lane2[0] - 0.2, t1: GB.clampCU, rim: 0.9, exp: true,
    cam: gbMove(GB.lane2[0] - 0.2, GB.clampCU, [_gbV(0.8, 0.86, GB_DROP.z + 2.2), _gbV(0.9, 0.8, GB_DROP.z), 36], [_gbV(1.02, 0.9, GB_DROP.z + 1.95), _gbV(0.98, 0.8, GB_DROP.z), 34], { dof: 0.35 }) },
  // D4 — "And the impact?": both clamps side by side, the two balls; the quiet before the release; a slow push
  { id: 'D4', t0: GB.clampCU, t1: GB.dropWide, rim: 0.9, exp: true,
    cam: (t) => {
      const D = GB_DROP, cy = D.padH + D.h + D.r, Z = D.z;
      const k = Ease.inOutSine(MathX.ramp(t, GB.clampCU, GB.drop));
      const pos = _gbL(_gbV(D.rulerX, cy + 0.05, Z + 1.25), _gbV(D.rulerX, cy + 0.03, Z + 1.02), k);
      return { pos, at: _gbV(D.rulerX, cy - 0.02, Z), fov: 36, focus: pos.z - Z, dof: 0.5 };
    } },
  // ================= SCENE 5 — no narration: the drop, the replay, the result
  // E1 — the locked-off wide: both falls, both impacts, the bounces
  { id: 'E1', t0: GB.dropWide, t1: GB.replay, rim: 0.9, exp: true,
    cam: (t) => ({ pos: _gbV(GB_DROP.rulerX, 0.72, GB_DROP.z + 2.55), at: _gbV(GB_DROP.rulerX, 0.6, GB_DROP.z), fov: 34, focus: 2.55, dof: 0.28 }) },
  // E2 — the slow-motion replay: low and closer, on the lower half of the fall (strobe spacing, impacts, pad dents)
  { id: 'E2', t0: GB.replay, t1: GB.result, rim: 0.9, exp: true,
    cam: gbMove(GB.replay, GB.result, [_gbV(GB_DROP.rulerX - 0.25, 0.3, GB_DROP.z + 1.65), _gbV(GB_DROP.rulerX, 0.32, GB_DROP.z), 34], [_gbV(GB_DROP.rulerX + 0.25, 0.26, GB_DROP.z + 1.5), _gbV(GB_DROP.rulerX, 0.3, GB_DROP.z), 33], { dof: 0.35 }) },
  // E3 — the measured result: a high three-quarter wide, the labels and the equal rebound line
  { id: 'E3', t0: GB.result, t1: GB.s6, rim: 0.9, exp: true,
    cam: gbMove(GB.result, GB.s6, [_gbV(GB_DROP.rulerX + 1.0, 1.25, GB_DROP.z + 2.3), _gbV(GB_DROP.rulerX, 0.45, GB_DROP.z), 36], [_gbV(GB_DROP.rulerX + 0.75, 1.15, GB_DROP.z + 2.0), _gbV(GB_DROP.rulerX, 0.45, GB_DROP.z), 35], { dof: 0.3 }) },
  // ================= SCENE 6 — your body
  // F1 — back to him at his table: "It's you." A slow push to his face
  { id: 'F1', t0: GB.s6, t1: GB.knees, rim: 1.0,
    cam: gbMove(GB.s6, GB.knees, [_gbV(-1.1, 1.22, -2.35), _gbV(-2.7, 1.0, -2.78), 40], [_gbV(-1.5, 1.14, -2.5), _gbV(-2.72, 1.08, -2.78), 36], { dof: 0.6 }) },
  // F2 — low on his legs as they push him up (they tremble)
  { id: 'F2', t0: GB.knees, t1: GB.upCut, rim: 1.0,
    cam: gbMove(GB.knees, GB.upCut, [_gbV(-1.75, 0.32, -1.55), _gbV(-2.55, 0.5, -2.78), 50], [_gbV(-1.8, 0.4, -1.5), _gbV(-2.6, 0.8, -2.78), 52], { dof: 0.4 }) },
  // F3 — he is up, braced on the table, breathing (a slow drift around him)
  { id: 'F3', t0: GB.upCut, t1: GB.heart, rim: 1.0,
    cam: gbMove(GB.upCut, GB.heart, [_gbV(-1.25, 1.3, -1.95), _gbV(-2.85, 1.2, -2.78), 42], [_gbV(-1.4, 1.35, -1.75), _gbV(-2.9, 1.25, -2.78), 40], { dof: 0.4 }) },
  // F4 — "And your heart…": another customer on the stairs, from below; she stops, a hand to her chest
  { id: 'F4', t0: GB.heart, t1: GB.s7, rim: 1.0,
    cam: gbMove(GB.heart, GB.s7, [_gbV(1.4, 0.75, 1.15), _gbV(0.0, 1.55, 2.95), 44], [_gbV(1.25, 0.82, 1.3), _gbV(-0.1, 1.6, 2.95), 40], { dof: 0.35 }) },
  // ================= SCENE 7 — no narration: the stairs
  // G1 — the wide from the room: his last heavy steps to the foot of the stairs
  { id: 'G1', t0: GB.s7, t1: GB.rail - 0.3, rim: 1.0,
    cam: gbMove(GB.s7, GB.rail - 0.3, [_gbV(3.6, 1.55, -0.9), _gbV(1.7, 1.05, 2.9), 42], [_gbV(3.25, 1.5, -0.55), _gbV(1.2, 1.0, 2.9), 40], { dof: 0.3 }) },
  // G2 — side on, low: the hand takes the rail; the first step; the second… the foot hesitates and comes back
  { id: 'G2', t0: GB.rail - 0.3, t1: GB.handCU, rim: 1.0,
    cam: gbMove(GB.rail - 0.3, GB.handCU, [_gbV(2.6, 1.1, 1.4), _gbV(1.0, 0.7, 2.95), 44], [_gbV(2.45, 1.0, 1.55), _gbV(0.9, 0.75, 2.95), 40], { dof: 0.4 }) },
  // G3 — close on his hand gripping the rail; it tilts up to his face as he breathes
  { id: 'G3', t0: GB.handCU, t1: GB.out, rim: 1.0,
    cam: (t, ctx) => {
      const k = Ease.inOutSine(MathX.ramp(t, GB.handCU + 1.2, GB.out - 0.3));
      const g = ctx.railGrip || _gbV(0.84, 1.11, 2.49), f = ctx.faceP;
      const at = _gbL(g, f, 0.85 * k);
      const pos = _gbL(g.clone().add(_gbV(0.22, 0.1, -0.5)), g.clone().add(_gbV(0.32, 0.25, -0.72)), k);
      return { pos, at, fov: 34, focus: pos.distanceTo(at), dof: 1.2 };
    } },
  // ================= SCENE 8 — the city reacts
  // H1 — outside: the square, people resting (from the café door, a slow crane down)
  { id: 'H1', t0: GB.out, t1: GB.carCU, outside: true, rim: 1.1,
    cam: gbMove(GB.out, GB.carCU, [_gbV(0.4, 2.2, -4.6), _gbV(0.2, 0.9, -11.5), 50], [_gbV(0.6, 1.7, -5.0), _gbV(0.6, 0.85, -11.0), 46], { dof: 0.15 }) },
  // H2 — "Cars sit lower…": low at the front wheel (the 1 g ride-height line and where it sits now)
  { id: 'H2', t0: GB.carCU, t1: GB.carry, outside: true, rim: 1.1, carRef: true,
    cam: (t, ctx) => {
      const k = Ease.inOutSine(MathX.ramp(t, GB.carCU, GB.carry));
      const C = ctx.car; C.g.updateMatrixWorld(true);
      const W = (x, y, z) => _gbV(x, y, GB_CAR.refSide * z).applyMatrix4(C.g.matrixWorld);
      const pos = _gbL(W(GB_CAR.wheelX + 0.75, 0.4, GB_CAR.W / 2 + 1.25), W(GB_CAR.wheelX + 0.6, 0.36, GB_CAR.W / 2 + 1.05), k);
      const at = W(GB_CAR.wheelX - 0.15, 0.42, GB_CAR.W / 2 - 0.1);
      return { pos, at, fov: 40, focus: pos.distanceTo(at), dof: 0.35 };
    } },
  // H3 — "Ordinary objects…": the cyclist lifts her bicycle out of the rack (it barely comes up)
  { id: 'H3', t0: GB.carry, t1: GB.fount, outside: true, rim: 1.1,
    cam: gbMove(GB.carry, GB.fount, [_gbV(4.6, 1.1, -4.4), _gbV(6.4, 0.75, -6.1), 40], [_gbV(4.75, 1.0, -4.6), _gbV(6.4, 0.7, -6.15), 37], { dof: 0.4 }) },
  // H4 — "And a fountain…": close on the jet, then pull back so the 1 g height line beside it reads
  { id: 'H4', t0: GB.fount, t1: GB.rules, outside: true, rim: 1.1, fountRef: true,
    cam: gbMove(GB.fount, GB.rules, [_gbV(-1.0, 1.15, -9.4), _gbV(-1.5, 1.3, -13.5), 38], [_gbV(1.3, 1.6, -7.4), _gbV(-1.5, 1.4, -13.5), 44], { dof: 0.25 }) },
  // H5 — "Gravity has changed the rules": people against the café wall and slumped on the bench (a pan)
  { id: 'H5', t0: GB.rules, t1: GB.s9, outside: true, rim: 1.1,
    cam: gbMove(GB.rules, GB.s9, [_gbV(0.6, 1.5, -7.6), _gbV(-2.3, 1.05, -4.2), 40], [_gbV(0.8, 1.45, -7.4), _gbV(3.0, 0.85, -9.0), 42], { dof: 0.25 }) },
  // ================= SCENE 9 — no narration: three connected moments
  // I1 — she pushes the bicycle up the gentle ramp (tracking beside her, low)
  { id: 'I1', t0: GB.s9, t1: GB.s9b, outside: true, rim: 1.1,
    cam: (t, ctx) => {
      const z = ctx.rampZ;
      const pos = _gbV(10.15, 1.75, z - 3.1), at = _gbV(10.85, 1.0, z);   // ahead of her, up the ramp: she climbs toward us
      return { pos, at, fov: 42, focus: pos.distanceTo(at), dof: 0.35 };
    } },
  // I2 — the fountain: the wide reveal of the short jets
  { id: 'I2', t0: GB.s9b, t1: GB.s9c, outside: true, rim: 1.1, fountRef: true,
    cam: gbMove(GB.s9b, GB.s9c, [_gbV(0.5, 0.75, -9.0), _gbV(-1.5, 0.9, -13.5), 44], [_gbV(0.8, 1.05, -8.7), _gbV(-1.6, 0.9, -13.6), 48], { dof: 0.15 }) },
  // I3 — him at the edge of the square, a hand on a bollard, watching (over his shoulder, then his face)
  { id: 'I3', t0: GB.s9c, t1: GB.s10, outside: true, rim: 1.1,
    cam: gbMove(GB.s9c, GB.s10, [_gbV(2.4, 1.85, -5.0), _gbV(0.0, 1.1, -9.0), 42], [_gbV(1.6, 1.55, -7.3), _gbV(1.05, 1.5, -6.1), 38], { dof: 0.4 }) },
  // ================= SCENE 10 — the bigger question
  // J1 — the wide: the whole square, people stopped; a slow crane up
  { id: 'J1', t0: GB.s10, t1: GB.sky, outside: true, rim: 1.15,
    cam: gbMove(GB.s10, GB.sky, [_gbV(6.0, 1.6, -5.4), _gbV(-1.0, 1.0, -12.0), 48], [_gbV(6.6, 3.0, -4.8), _gbV(-1.2, 0.8, -12.5), 50], { dof: 0.1 }) },
  // J2 — him looking at the skyline: low, behind his shoulder, the towers beyond
  { id: 'J2', t0: GB.sky, t1: GB.eng, outside: true, rim: 1.15,
    cam: gbMove(GB.sky, GB.eng, [_gbV(-3.0, 1.35, -8.5), _gbV(-4.1, 2.6, -16), 46], [_gbV(-3.1, 1.2, -8.7), _gbV(-4.2, 3.0, -16), 44], { dof: 0.2 }) },
  // J3 — "Some systems…": the engineer under the loaded balcony, torch on the bracket's gauge (low angle)
  { id: 'J3', t0: GB.eng, t1: GB.back10, outside: true, rim: 1.1, gaugeTag: true,
    cam: gbMove(GB.eng, GB.back10, [_gbV(-5.5, 1.0, -7.7), _gbV(-7.6, 2.1, -5.0), 50], [_gbV(-5.7, 1.05, -7.5), _gbV(-7.7, 2.3, -4.9), 46], { dof: 0.3 }) },
  // J4 — "The real question…": back to him, his face
  { id: 'J4', t0: GB.back10, t1: GB.s11, outside: true, rim: 1.1,
    cam: gbMove(GB.back10, GB.s11, [_gbV(-4.0, 1.5, -11.4), _gbV(-3.9, 1.5, -10.2), 38], [_gbV(-4.0, 1.55, -11.15), _gbV(-3.9, 1.52, -10.2), 34], { dof: 0.35 }) },
  // ================= SCENE 11 — no narration: the silent reveal
  // K1 — people helping each other: the shopper pulls the jogger to her feet
  { id: 'K1', t0: GB.s11, t1: GB.help[0] + 3.3, outside: true, rim: 1.15,
    cam: gbMove(GB.s11, GB.help[0] + 3.3, [_gbV(-6.6, 1.1, -9.8), _gbV(-5.0, 0.85, -11.5), 42], [_gbV(-6.4, 1.25, -9.6), _gbV(-5.0, 1.1, -11.5), 40], { dof: 0.4 }) },
  // K2 — the slow wide rising shot: the square at the low sun, short sparkling jets, him by the fountain
  { id: 'K2', t0: GB.help[0] + 3.3, t1: GB.s12, outside: true, rim: 1.2,
    cam: gbMove(GB.help[0] + 3.3, GB.s12, [_gbV(1.5, 1.4, -7.0), _gbV(-2.5, 1.0, -12.5), 46], [_gbV(3.5, 5.0, -4.5), _gbV(-2.0, 0.6, -13.5), 50], { dof: 0.08 }) },
  // ================= SCENE 12 — the final question
  // L1 — from behind him, across the square to the skyline; a slow rise and pull back; the fade after the last word
  { id: 'L1', t0: GB.s12, t1: GB.end + 1, outside: true, rim: 1.2,
    cam: gbMove(GB.s12, GB.end, [_gbV(-3.6, 1.85, -8.9), _gbV(-4.2, 1.5, -14), 42], [_gbV(-3.0, 2.6, -7.6), _gbV(-4.4, 2.0, -16), 48], { dof: 0.12 }) },
];

function gbShotAt(t) { for (const s of GB_SHOTS) if (t >= s.t0 && t < s.t1) return s; return GB_SHOTS[GB_SHOTS.length - 1]; }

function gbApplyShot(camera, S) {
  camera.position.copy(S.pos);
  camera.up.set(0, 1, 0);
  camera.lookAt(S.at);
  if (S.roll) camera.rotateZ(THREE.MathUtils.degToRad(S.roll));
  camera.fov = S.fov; camera.updateProjectionMatrix();
}
