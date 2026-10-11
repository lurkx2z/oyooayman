/* =====================================================================
   SHOTS — the cinematic cameras (everything except the POV, which is the locked CameraController driven by
   SCRIPT.camera). Each shot: [t0, t1) with a camera function of t → { pos, at, fov, roll, focus, dof }.
   Moves are slow and motivated (drift, push, crane); handheld only as decaying impulses (the gravity hit).
   ===================================================================== */

const _gbV = (x, y, z) => new THREE.Vector3(x, y, z);
const _gbL = (a, b, k) => new THREE.Vector3().lerpVectors(a, b, k);

const GB_SHOTS = [
  // S1 — exterior establishing: the plaza at sunrise, a slow push toward the café window (title over it)
  { id: 'S1', t0: 0, t1: GB.inside, outside: true, rim: 1.0,
    cam: (t) => {
      const k = Ease.inOutSine(MathX.ramp(t, -0.5, GB.inside + 0.5));
      return { pos: _gbL(_gbV(-5.2, 1.8, -17.0), _gbV(-3.05, 1.3, -8.4), k), at: _gbL(_gbV(-0.8, 2.0, -3.6), _gbV(-2.62, 1.12, -2.9), k), fov: 38 - 16 * k, focus: MathX.lerp(13, 5.6, k), dof: 0.3 };
    } },
  // S2 — interior medium: breakfast; slow drift. Continues through the hit (camera dips with him).
  { id: 'S2', t0: GB.inside, t1: 6.45, rim: 1.0,
    cam: (t) => {
      const k = Ease.inOutSine(MathX.ramp(t, GB.inside, 6.45));
      const pos = _gbL(_gbV(-1.08, 1.27, -1.78), _gbV(-1.32, 1.2, -1.98), k);
      const at = _gbL(_gbV(-2.5, 1.0, -2.72), _gbV(-2.5, 0.96, -2.74), k);
      const hit = gbSpring(t, GB.g, 0.035, 3.2, 4.5) + 0.03 * MathX.smooth(t, GB.g, GB.g + 0.15);
      pos.y -= hit; at.y -= hit * 1.4;
      return { pos, at, fov: 36 - 2 * k, focus: 1.65, dof: 0.8, roll: gbSpring(t, GB.g, 1.4, 2.6, 4) };
    } },
  // S3 — interior wide: the whole room reacts (lamps bounce, the waiter buckles), slow push and tilt up to the lamp
  { id: 'S3', t0: 6.45, t1: GB.close, rim: 1.0,
    cam: (t) => {
      const k = Ease.inOutSine(MathX.ramp(t, 6.45, GB.close));
      const up = Ease.inOutCubic(MathX.ramp(t, 8.2, 9.3)) * (1 - Ease.inOutCubic(MathX.ramp(t, 9.5, 10.2)));
      const pos = _gbL(_gbV(1.55, 1.5, -3.15), _gbV(1.15, 1.42, -3.1), k);
      const at = _gbL(_gbV(-2.0, 1.0, -2.35), _gbV(-2.15, 0.98, -2.45), k); at.y += up * 0.7; at.x += up * 0.1;
      return { pos, at, fov: 44 - 4 * k, focus: 3.3, dof: 0.45 };
    } },
  // S4a — top-down insert: the table from above (cup, spill, croissant, his hands, the top of his head)
  { id: 'S4a', t0: GB.close, t1: GB.side, rim: 0.8,
    cam: (t) => {
      const k = MathX.ramp(t, GB.close, GB.side), [tx, tz] = GB_SET.heroTable;
      const a = 0.25 + 0.18 * k;
      const pos = _gbV(tx - 0.2, 2.05 - 0.15 * k, tz + 0.02);
      return { pos, at: _gbV(tx - 0.2, 0.7, tz + 0.021), up: _gbV(Math.cos(a), 0, Math.sin(a)), fov: 40, focus: 1.3, dof: 0.35 };
    } },
  // S4b — the extreme close-up: cup + hand at table height, his face soft behind; rack focus to the face; then the push into his eyes
  { id: 'S4b', t0: GB.side, t1: GB.pov, rim: 1.2,
    cam: (t, ctx) => {
      const k = Ease.inOutSine(MathX.ramp(t, GB.side, GB.push));
      const pos = _gbL(_gbV(-1.6, 0.855, -2.5), _gbV(-1.7, 0.85, -2.53), k);
      const cup = ctx.cupP || _gbV(-2.34, 0.78, -2.62);
      const face = ctx.faceP || _gbV(-2.58, 1.12, -2.78);
      const rk = Ease.inOutCubic(MathX.ramp(t, GB.rack, GB.rack + 0.7));
      const at = _gbL(_gbV(cup.x - 0.03, cup.y + 0.07, cup.z - 0.05), _gbV(face.x * 0.5 + cup.x * 0.5, face.y * 0.55 + cup.y * 0.45, face.z * 0.5 + cup.z * 0.5), rk * 0.55);
      let focus = MathX.lerp(pos.distanceTo(cup), pos.distanceTo(face), rk), fov = 28;
      // the push: into his face until it fills the frame (dark), ready to open his eyes in POV
      const pk = Ease.inCubic(MathX.ramp(t, GB.push, GB.pov - 0.08));
      if (pk > 0) {
        const eye = ctx.eyeP || face;
        const p2 = _gbL(pos, _gbV(eye.x + 0.16, eye.y + 0.01, eye.z + 0.1), pk);
        pos.copy(p2); at.lerp(eye, MathX.clamp(pk * 1.6, 0, 1)); focus = MathX.lerp(focus, pos.distanceTo(eye), pk); fov = 28 - 8 * pk;
      }
      return { pos, at, fov, focus, dof: 2.2 };
    } },
  // S5 — POV (CameraController + his hands)
  { id: 'S5', t0: GB.pov, t1: GB.wide, pov: true, rim: 1.0 },
  // S6 — the wide reveal: low by the café door (vendor right, half-height fountain behind, sun low in the gap);
  //       at the release the camera cranes up after the balloons and lets them go into the sunrise
  { id: 'S6', t0: GB.wide, t1: 30.01, outside: true, rim: 1.1,
    cam: (t) => {
      const k0 = Ease.inOutSine(MathX.ramp(t, GB.wide, GB.release + 0.2));
      const k1 = Ease.inOutSine(MathX.ramp(t, GB.release - 0.1, 29.4));
      const pos = _gbL(_gbV(-1.45, 1.22, -5.5), _gbV(-1.2, 1.4, -6.0), k0);
      pos.lerp(_gbV(-0.4, 3.4, -4.4), k1);
      const at = _gbL(_gbV(0.25, 1.75, -11.0), _gbV(0.35, 1.95, -11.0), k0);
      at.lerp(_gbV(0.5, 9.2, -14.5), k1);
      return { pos, at, fov: 50 + 4 * k1, focus: MathX.lerp(5.2, 10, k1), dof: 0.22 };
    } },
];

function gbShotAt(t) { for (const s of GB_SHOTS) if (t >= s.t0 && t < s.t1) return s; return GB_SHOTS[GB_SHOTS.length - 1]; }

// apply a shot camera (overrides the POV controller's pose)
function gbApplyShot(camera, S) {
  camera.position.copy(S.pos);
  if (S.up) camera.up.copy(S.up); else camera.up.set(0, 1, 0);
  camera.lookAt(S.at);
  if (S.roll) camera.rotateZ(THREE.MathUtils.degToRad(S.roll));
  camera.fov = S.fov; camera.updateProjectionMatrix();
  camera.up.set(0, 1, 0);
}
