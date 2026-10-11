/* =====================================================================
   SHOTS — every camera in the film (no POV). Each shot: [t0, t1) with a camera function of (t, ctx) →
   { pos, at, fov, roll, focus, dof }. Moves are slow and motivated (push, drift, crane); handheld only as decaying
   impulses (the gravity hit). Cut points come from script.js (GB), i.e. from the real narration.
   ===================================================================== */

const _gbV = (x, y, z) => new THREE.Vector3(x, y, z);
const _gbL = (a, b, k) => new THREE.Vector3().lerpVectors(a, b, k);
// a point in the bench's frame (x along the bench, z = where he faces), world
function gbBenchP(x, y, z) { const [bx, bz, by] = GB_SET.bench; const c = Math.cos(by), s = Math.sin(by); return _gbV(bx + x * c + z * s, y, bz - x * s + z * c); }

const GB_SHOTS = [
  // S1 — the hook: inside the café from frame 1, a slow push toward his steaming cup; a small dip on "doubled"
  { id: 'S1', t0: -1, t1: GB.room, rim: 1.0,
    cam: (t) => {
      const k = Ease.inOutSine(MathX.ramp(t, 0, GB.room));
      const pos = _gbL(_gbV(-0.95, 1.34, -1.62), _gbV(-1.62, 1.08, -2.12), k);
      const at = _gbL(_gbV(-2.45, 0.98, -2.7), _gbV(-2.36, 0.84, -2.64), k);
      const hit = gbSpring(t, GB.g, 0.022, 3.2, 4.5) + 0.012 * MathX.smooth(t, GB.g, GB.g + 0.15);
      pos.y -= hit; at.y -= hit * 1.3;
      return { pos, at, fov: 38 - 6 * k, focus: pos.distanceTo(at) - 0.05, dof: 0.55 + 0.4 * k, roll: gbSpring(t, GB.g, 0.8, 2.6, 4) };
    } },
  // S2a — the room: "At first, nothing looks different." A wide from across the café; everything sits as before
  { id: 'S2a', t0: GB.room, t1: GB.reachCut, rim: 1.0,
    cam: (t) => {
      const k = Ease.inOutSine(MathX.ramp(t, GB.room, GB.reachCut));
      const pos = _gbL(_gbV(1.7, 1.55, -0.6), _gbV(1.45, 1.5, -0.75), k);
      const at = _gbL(_gbV(-2.1, 1.05, -2.45), _gbV(-2.2, 1.0, -2.55), k);
      return { pos, at, fov: 44 - 3 * k, focus: pos.distanceTo(at), dof: 0.35 };
    } },
  // S2b — "But that coffee cup?": a medium on him and the cup; his hand goes out to it
  { id: 'S2b', t0: GB.reachCut, t1: GB.handCU, rim: 0.95,
    cam: (t, ctx) => {
      const k = Ease.inOutSine(MathX.ramp(t, GB.reachCut, GB.handCU));
      const cup = ctx.cupP;
      const pos = _gbL(_gbV(-1.32, 1.1, -2.02), _gbV(-1.45, 1.03, -2.12), k);
      const at = _gbL(_gbV(-2.42, 0.95, -2.7), cup.clone().add(_gbV(-0.06, 0.12, -0.03)), 0.35 + 0.4 * k);
      return { pos, at, fov: 36 - 3 * k, focus: pos.distanceTo(cup) + 0.1, dof: 0.8 };
    } },
  // S2c — the close-up: his hand on the handle; the grip, the pull, the cup breaking free of the saucer
  { id: 'S2c', t0: GB.handCU, t1: GB.faceCut, rim: 0.9,
    cam: (t, ctx) => {
      const k = Ease.inOutSine(MathX.ramp(t, GB.handCU, GB.faceCut));
      const cup = ctx.cupRestP;
      const pos = _gbL(cup.clone().add(_gbV(0.42, 0.1, 0.36)), cup.clone().add(_gbV(0.36, 0.13, 0.31)), k);
      const at = cup.clone().add(_gbV(-0.03, 0.05 + 0.5 * (ctx.cupH || 0), -0.04));
      return { pos, at, fov: 30, focus: pos.distanceTo(at), dof: 1.6 };
    } },
  // S3 — no narration: hands and face in one take; rack focus to his face at the top, back to the cup as it goes down
  { id: 'S3', t0: GB.faceCut, t1: GB.exp, rim: 0.9,
    cam: (t, ctx) => {
      const k = Ease.inOutSine(MathX.ramp(t, GB.faceCut, GB.exp));
      const pos = _gbL(_gbV(-1.32, 0.98, -2.22), _gbV(-1.5, 0.97, -2.32), k);
      const cup = ctx.cupP, face = ctx.faceP;
      const hands = _gbV(cup.x - 0.04, cup.y + 0.04, cup.z - 0.12);
      const rk = Ease.inOutCubic(MathX.ramp(t, GB.top - 0.1, GB.top + 0.6)) * (1 - Ease.inOutCubic(MathX.ramp(t, GB.lower + 0.4, GB.lower + 1.1)));
      const at = _gbL(hands, face, 0.38 + 0.12 * rk);
      return { pos, at, fov: MathX.lerp(37, 33, k), focus: MathX.lerp(pos.distanceTo(hands), pos.distanceTo(face), rk), dof: 1.3 };
    } },
  // S4 — the experiment: match cut onto the 2 g cup in its clamp, pull back to both lanes and the metre stick;
  //      then the locked-off side view holds for the anticipation, the release, both impacts and the result
  { id: 'S4', t0: GB.exp, t1: GB.replay, rim: 0.9, exp: true,
    cam: (t) => {
      const cupX = GB_DROP.lanes[1].x, Z = GB_DROP.z;
      const near = { pos: _gbV(cupX + 0.2, 1.1, Z + 0.62), at: _gbV(cupX, 1.04, Z), fov: 30 };
      const wide = { pos: _gbV(GB_DROP.rulerX, 0.72, Z + 2.55), at: _gbV(GB_DROP.rulerX, 0.64, Z), fov: 33 };
      const k = Ease.inOutCubic(MathX.ramp(t, GB.wideExp - 0.6, GB.wideExp + 1.6));
      const pos = _gbL(near.pos, wide.pos, k), at = _gbL(near.at, wide.at, k);
      // a slow push during the last words and the anticipation hold (stops before the release: the drop is locked off)
      const p1 = Ease.inOutSine(MathX.ramp(t, GB.lane2[0], GB.drop - 0.3));
      const fov = MathX.lerp(near.fov, wide.fov, k) - 1.2 * p1;
      return { pos, at, fov, focus: pos.distanceTo(at), dof: 0.28 + 0.5 * (1 - k) };
    } },
  // S5 — the slow-motion replay: a closer, lower frame on the bottom of the fall (the spacing of the strobe trail, both
  //      impacts, the shards); then real time resumes and the result holds
  { id: 'S5', t0: GB.replay, t1: GB.out, rim: 0.9, exp: true,
    cam: (t) => {
      const Z = GB_DROP.z, k = Ease.inOutSine(MathX.ramp(t, GB.replay, GB.out));
      const pos = _gbL(_gbV(GB_DROP.rulerX, 0.44, Z + 1.95), _gbV(GB_DROP.rulerX, 0.42, Z + 1.8), k);
      const at = _gbV(GB_DROP.rulerX, 0.4, Z);
      return { pos, at, fov: 33, focus: pos.distanceTo(at), dof: 0.3 };
    } },
  // O1 — outside: the man on the bench tries to stand. Across the parked car: its wing in the foreground, his face and
  //      the bench beyond, the café's warm windows behind him
  { id: 'O1', t0: GB.out, t1: GB.carCU, outside: true, rim: 1.1,
    cam: (t) => {
      const k = Ease.inOutSine(MathX.ramp(t, GB.out, GB.carCU));
      const pos = _gbL(gbBenchP(-0.8, 1.3, 2.95), gbBenchP(-0.7, 1.27, 2.8), k);
      const at = _gbL(gbBenchP(0.0, 0.86, 0.1), gbBenchP(0.0, 0.88, 0.15), k);
      return { pos, at, fov: 40, focus: pos.distanceTo(at), dof: 0.4 };
    } },
  // O2 — "Even parked cars sink deeper into their suspension": low at the front wheel on the car's far side (the spring
  //      inside the arch, the dashed 1 g ride-height line and the ghost of the body where it sat at 1 g)
  { id: 'O2', t0: GB.carCU, t1: GB.world, outside: true, rim: 1.1,
    cam: (t, ctx) => {
      const k = Ease.inOutSine(MathX.ramp(t, GB.carCU, GB.world));
      const C = ctx.car; C.g.updateMatrixWorld(true);
      const W = (x, y, z) => _gbV(x, y, GB_CAR.refSide * z).applyMatrix4(C.g.matrixWorld);
      const pos = _gbL(W(GB_CAR.wheelX + 0.75, 0.4, GB_CAR.W / 2 + 1.25), W(GB_CAR.wheelX + 0.6, 0.36, GB_CAR.W / 2 + 1.05), k);
      const at = W(GB_CAR.wheelX - 0.15, 0.42, GB_CAR.W / 2 - 0.1);
      return { pos, at, fov: 40, focus: pos.distanceTo(at), dof: 0.35 };
    } },
  // O3 — no narration: from the car's rear quarter, its flank leads to him; he braces on the wing and comes up
  //      (the car dips under his hand), then a slow, heavy step
  { id: 'O3', t0: GB.world, t1: GB.wide2, outside: true, rim: 1.1,
    cam: (t) => {
      const k = Ease.inOutSine(MathX.ramp(t, GB.world, GB.wide2));
      const pos = _gbL(gbBenchP(3.0, 1.3, -0.55), gbBenchP(2.8, 1.38, -0.5), k);
      const at = _gbL(gbBenchP(-0.05, 0.85, 0.55), gbBenchP(-0.1, 1.02, 0.6), k);
      return { pos, at, fov: 42, focus: pos.distanceTo(at), dof: 0.3 };
    } },
  // O4 — the wide hold: the passer-by fighting to stay up, him, the car, the low fountain
  { id: 'O4', t0: GB.wide2, t1: GB.pull, outside: true, rim: 1.1,
    cam: (t) => {
      const k = Ease.inOutSine(MathX.ramp(t, GB.wide2, GB.pull));
      const pos = _gbL(_gbV(6.8, 1.35, -5.6), _gbV(6.6, 1.38, -5.9), k);
      const at = _gbL(_gbV(1.4, 0.95, -10.6), _gbV(1.3, 1.0, -10.8), k);
      return { pos, at, fov: 44, focus: pos.distanceTo(at), dof: 0.2 };
    } },
  // O5 — the ending: the crane pulls back and rises into the atmospheric wide of the whole square
  { id: 'O5', t0: GB.pull, t1: GB.end + 1, outside: true, rim: 1.15,
    cam: (t) => {
      const k = Ease.inOutSine(MathX.ramp(t, GB.pull, GB.end - 0.3));
      const pos = _gbL(_gbV(6.0, 1.5, -6.2), _gbV(7.9, 4.5, -4.3), k);
      const at = _gbL(_gbV(1.0, 1.1, -11.0), _gbV(-0.8, 0.9, -13.2), k);
      return { pos, at, fov: 46 + 4 * k, focus: pos.distanceTo(at), dof: 0.12 };
    } },
];

function gbShotAt(t) { for (const s of GB_SHOTS) if (t >= s.t0 && t < s.t1) return s; return GB_SHOTS[GB_SHOTS.length - 1]; }

function gbApplyShot(camera, S) {
  camera.position.copy(S.pos);
  camera.up.set(0, 1, 0);
  camera.lookAt(S.at);
  if (S.roll) camera.rotateZ(THREE.MathUtils.degToRad(S.roll));
  camera.fov = S.fov; camera.updateProjectionMatrix();
}
