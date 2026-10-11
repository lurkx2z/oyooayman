/* =====================================================================
   SHOTS — the cinematic cameras (everything except the POV, which is the locked CameraController driven by
   SCRIPT.camera). Each shot: [t0, t1) with a camera function of t → { pos, at, fov, roll, focus, dof }.
   Moves are slow and motivated (drift, push, crane); handheld only as decaying impulses (the gravity hit).
   ===================================================================== */

const _gbV = (x, y, z) => new THREE.Vector3(x, y, z);
const _gbL = (a, b, k) => new THREE.Vector3().lerpVectors(a, b, k);

const GB_SHOTS = [
  // S2 — interior medium from frame 1 (title over it): breakfast; a slow drift that continues through the hit
  { id: 'S2', t0: -1, t1: GB.room, rim: 1.0,
    cam: (t) => {
      const k = Ease.inOutSine(MathX.ramp(t, 0, GB.room));
      const pos = _gbL(_gbV(-1.02, 1.3, -1.74), _gbV(-1.3, 1.2, -1.96), k);
      const at = _gbL(_gbV(-2.5, 1.02, -2.72), _gbV(-2.5, 0.95, -2.74), k);
      const hit = gbSpring(t, GB.g, 0.035, 3.2, 4.5) + 0.03 * MathX.smooth(t, GB.g, GB.g + 0.15);
      pos.y -= hit; at.y -= hit * 1.4;
      return { pos, at, fov: 37 - 3 * k, focus: 1.65, dof: 0.7, roll: gbSpring(t, GB.g, 1.4, 2.6, 4) };
    } },
  // S3 — interior wide: the whole room reacts (lamps bounce, the waiter buckles, he sags), a tilt up to the lamp
  { id: 'S3', t0: GB.room, t1: GB.close, rim: 1.0,
    cam: (t) => {
      const k = Ease.inOutSine(MathX.ramp(t, GB.room, GB.close));
      const up = Ease.inOutCubic(MathX.ramp(t, GB.room + 1.35, GB.room + 2.2)) * (1 - Ease.inOutCubic(MathX.ramp(t, GB.close - 0.55, GB.close)));
      const pos = _gbL(_gbV(1.55, 1.5, -3.15), _gbV(1.2, 1.43, -3.1), k);
      const at = _gbL(_gbV(-2.0, 1.0, -2.35), _gbV(-2.15, 0.98, -2.45), k); at.y += up * 0.7; at.x += up * 0.1;
      return { pos, at, fov: 44 - 4 * k, focus: 3.3, dof: 0.4 };
    } },
  // S4 — the struggle (one close-up): his bracing hand, the cup and his face; rack focus hands → face on the failed lift;
  //      a slow push as he tries again with both hands; then the push into his eyes
  { id: 'S4', t0: GB.close, t1: GB.pov, rim: 0.9,
    cam: (t, ctx) => {
      const k = Ease.inOutSine(MathX.ramp(t, GB.close, GB.push));
      const pos = _gbL(_gbV(-1.3, 0.98, -2.24), _gbV(-1.55, 0.98, -2.36), k);
      const cup = ctx.cupP || _gbV(-2.34, 0.78, -2.62);
      const face = ctx.faceP || _gbV(-2.58, 1.1, -2.78);
      const hands = _gbV(cup.x - 0.04, cup.y + 0.03, cup.z - 0.14);
      const rk = Ease.inOutCubic(MathX.ramp(t, GB.rack, GB.rack + 0.7));
      const mid = _gbL(hands, face, 0.5);
      const at = _gbL(_gbL(hands, face, 0.42), _gbL(hands, face, 0.55), rk);
      let focus = MathX.lerp(pos.distanceTo(hands), pos.distanceTo(face), rk), fov = MathX.lerp(38, 33, k);
      const pk = Ease.inCubic(MathX.ramp(t, GB.push, GB.pov - 0.08));
      if (pk > 0) {
        const eye = ctx.eyeP || face;
        const p2 = _gbL(pos, _gbV(eye.x + 0.16, eye.y + 0.01, eye.z + 0.1), pk);
        pos.copy(p2); at.lerp(eye, MathX.clamp(pk * 1.6, 0, 1)); focus = MathX.lerp(focus, pos.distanceTo(eye), pk); fov = fov - 8 * pk;
      }
      return { pos, at, fov, focus, dof: 1.4 };
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

// V2: a camera with mass. The shot's authored path is filtered with a kernel that leans into the past (it trails
// slightly, like a follow-cam on a spring) and a little into the future (it starts moving before an authored ease
// begins, so moves never start or stop dead). Samples stay inside the shot, so cuts stay cuts. Pure function of t.
const _GB_CK = (() => { const k = []; for (let i = -3; i <= 9; i++) { const d = i * 0.04; k.push([d, Math.exp(-0.5 * ((d - 0.08) / 0.13) ** 2)]); } return k; })();
function gbSmoothShot(shot, t, ctx) {
  const S0 = shot.cam(t, ctx);
  const pos = new THREE.Vector3(), at = new THREE.Vector3();
  let w = 0, fov = 0, roll = 0;
  for (const [d, wk] of _GB_CK) {
    const tt = MathX.clamp(t - d, shot.t0, shot.t1 - 1e-3);
    const S = d === 0 ? S0 : shot.cam(tt, ctx);
    pos.addScaledVector(S.pos, wk); at.addScaledVector(S.at, wk); fov += S.fov * wk; roll += (S.roll || 0) * wk; w += wk;
  }
  pos.multiplyScalar(1 / w); at.multiplyScalar(1 / w);
  // the impact dip/roll at the drop keeps its snap: blend the raw camera back in for 0.4 s after the hit
  const snap = MathX.window(t, GB.g - 0.02, GB.g + 0.45, 0.02, 0.3);
  pos.lerp(S0.pos, snap); at.lerp(S0.at, snap);
  return Object.assign({}, S0, { pos, at, fov: MathX.lerp(fov / w, S0.fov, snap), roll: MathX.lerp(roll / w, S0.roll || 0, snap) });
}

// apply a shot camera (overrides the POV controller's pose)
function gbApplyShot(camera, S) {
  camera.position.copy(S.pos);
  if (S.up) camera.up.copy(S.up); else camera.up.set(0, 1, 0);
  camera.lookAt(S.at);
  if (S.roll) camera.rotateZ(THREE.MathUtils.degToRad(S.roll));
  camera.fov = S.fov; camera.updateProjectionMatrix();
  camera.up.set(0, 1, 0);
}
