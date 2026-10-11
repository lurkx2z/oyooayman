/* =====================================================================
   SHOTS — the cinematic cameras (everything except the POV, which is the locked CameraController driven by
   SCRIPT.camera). Each shot: [t0, t1) with a camera function of t → { pos, at, fov, roll, focus, dof }.
   Moves are slow and motivated (drift, push, crane); handheld only as decaying impulses (the gravity hit).
   ===================================================================== */

const _gbV = (x, y, z) => new THREE.Vector3(x, y, z);
const _gbL = (a, b, k) => new THREE.Vector3().lerpVectors(a, b, k);

// V3: the falling-cup camera looks from this side of the smash point (horizontal unit vector)
const GB_FALL_SIDE = _gbV(Math.cos(2.443), 0, Math.sin(2.443));   // (140°) in front of her, to her left: her face, the window, the whole drop

const GB_SHOTS = [
  // S2 — interior medium from frame 1 (title over it): breakfast; a slow drift that continues through the hit
  { id: 'S2', t0: -1, t1: GB.room, rim: 1.0,
    cam: (t) => {
      const k = Ease.inOutSine(MathX.ramp(t, 0, GB.room));
      const pos = _gbL(_gbV(-1.02, 1.3, -1.74), _gbV(-1.3, 1.2, -1.96), k);
      const at = _gbL(_gbV(-2.5, 1.02, -2.72), _gbV(-2.5, 0.95, -2.74), k);
      // V3: while the title is up, aim a little to his right so he sits right of centre and the title (left) never covers him
      const off = 0.34 * (1 - Ease.inOutSine(MathX.ramp(t, 1.4, 3.4)));
      at.x -= 0.55 * off; at.z += 0.83 * off;
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
  // S5 — POV (CameraController + his hands): he tries to stand and sinks back
  { id: 'S5', t0: GB.pov, t1: GB.fall, pov: true, rim: 1.0 },
  // S5b — V3: the falling cup, low on the floor beside the waiter. Her tray tips, a cup slides off and falls in 2 g
  //        (slow motion with a strobe trail and a faint 1 g ghost beside it), smashes, the shards bounce.
  //        Framed from the side so the whole drop (tray → floor) and her face are both in the shot.
  { id: 'S5b', t0: GB.fall, t1: GB.out, rim: 1.0,
    cam: (t, ctx) => {
      const sp = ctx.smashP || _gbV(-1.1, 0, -2.1), side = ctx.fallSide || GB_FALL_SIDE;
      const k = Ease.inOutSine(MathX.ramp(t, GB.fall, GB.out));
      const right = _gbV(-side.z, 0, side.x);                       // (the camera's left, as it turns out: −right moves the aim to frame right)
      const k2 = Ease.inOutSine(MathX.ramp(t, GB.waiter, GB.smash + 0.2));   // a slow push in on the drop
      const d = MathX.lerp(2.35, 1.6, k2);
      const pos = _gbV(sp.x + side.x * d, 0.32 - 0.06 * k2, sp.z + side.z * d);
      const at = _gbV(sp.x - right.x * 0.2 * (1 - k2), 0.56 - 0.16 * k2, sp.z - right.z * 0.2 * (1 - k2));
      const hit = gbSpring(t, GB.smash, 0.012, 3.0, 6.0);
      at.y += 0.42 * Ease.inOutSine(MathX.ramp(t, GB.smash + 0.2, GB.out - 0.1));   // then up to her face: the wince
      pos.y += hit; at.y += hit;
      return { pos, at, fov: 58 - 8 * k2 + 0 * k, focus: pos.distanceTo(sp) - 0.1, dof: 0.15 };
    } },
  // S6a — V3: outside, the fountain up close: the jets rise to half their old height (the 1 g line is marked)
  { id: 'S6a', t0: GB.out, t1: GB.wide, outside: true, rim: 1.1,
    cam: (t) => {
      const k = Ease.inOutSine(MathX.ramp(t, GB.out, GB.wide));
      const [fx, fz] = GB_SET.fountain;
      const pos = _gbL(_gbV(fx - 3.9, 1.1, fz + 5.6), _gbV(fx - 3.3, 1.3, fz + 4.9), k);
      const at = _gbL(_gbV(fx + 0.2, 2.45, fz), _gbV(fx + 0.1, 2.6, fz), k);
      return { pos, at, fov: 48 - 3 * k, focus: pos.distanceTo(at), dof: 0.3 };
    } },
  // S6b — the balloon vendor: low by the café door (vendor right, fountain behind, sun low in the gap);
  //        at the release the camera cranes up after the balloons and lets them go into the sunrise
  { id: 'S6b', t0: GB.wide, t1: 30.01, outside: true, rim: 1.1,
    cam: (t) => {
      const k0 = Ease.inOutSine(MathX.ramp(t, GB.wide, GB.release + 0.2));
      const k1 = Ease.inOutSine(MathX.ramp(t, GB.release - 0.1, 29.4));
      const pos = _gbL(_gbV(-1.0, 1.25, -5.9), _gbV(-0.85, 1.38, -6.3), k0);
      pos.lerp(_gbV(-0.4, 3.4, -4.6), k1);
      const at = _gbL(_gbV(0.9, 1.85, -10.2), _gbV(1.0, 2.0, -10.4), k0);
      at.lerp(_gbV(0.6, 9.2, -14.5), k1);
      return { pos, at, fov: 46 + 8 * k1, focus: MathX.lerp(4.3, 10, k1), dof: 0.22 };
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
