/* =====================================================================
   SHOTS — every camera in the film, with the SET it looks at and the VIEW MODE it uses.
   Each shot: { id, t0, t1, set: 'apt' | …, cam(t, ctx) → { pos, at, fov, roll, focus, dof }, look(t) → view mode }
   View mode (film.js applies it): { ac: 0 reality … 1 acoustic, world, hero, glow: reality brightness inside the
   acoustic view, pulse: which pulse clock, tag: the "slowed" tag }.
   Three modes in the film: REALITY (the objective cinematic world), PERCEPTION (darkness + sound information),
   SCIENCE (explanatory cutaways). Cut points come from script.js (BE), i.e. from the real narration.
   ===================================================================== */

const _beV = (x, y, z) => new THREE.Vector3(x, y, z);
const _beL = (a, b, k) => new THREE.Vector3().lerpVectors(a, b, k);
function beMove(t0, t1, A, B, o = {}) {
  return (t) => {
    const k = (o.ease || Ease.inOutSine)(MathX.ramp(t, t0, t1));
    const pos = _beL(A[0], B[0], k), at = _beL(A[1], B[1], k);
    return { pos, at, fov: MathX.lerp(A[2], B[2], k), focus: o.focus ? o.focus(t, pos) : pos.distanceTo(at), dof: o.dof ?? 0.3, roll: o.roll ? o.roll(t) : 0 };
  };
}
const BE_REAL = { ac: 0, world: 1, hero: 1, glow: 1 };
const BE_DARK = { ac: 1, world: 0, hero: 0, glow: 0 };

// scene 1: the collapse of the light, word by word (reality brightness inside the acoustic view)
function beCollapse(t) {
  if (t < BE.dark0) return BE_REAL;
  const k = MathX.smooth(t, BE.dark0, BE.dark1);
  return {
    ac: MathX.smooth(t, BE.dark0, BE.dark0 + 0.35),
    world: MathX.lerp(1, 0.07, Ease.outCubic(k)) * (1 - MathX.smooth(t, BE.sun - 0.4, BE.colors + 0.3) * 0.95),
    glow: MathX.lerp(1, 0.4, k) * (1 - MathX.smooth(t, BE.dark1, BE.sun)),
    hero: MathX.lerp(1, 0.22, k) * (1 - MathX.smooth(t, BE.hands - 1.0, BE.hands)),
  };
}

const BE_SHOTS = [
  // ================= SCENE 1 — the last thing you see
  // A1 — first person, sitting up in bed in the morning sun; the phone rings on her right; the light collapses; the hand
  //      before her face disappears; the alarm, a car, footsteps; she searches for the phone and knocks it off the table
  { id: 'A1', t0: -1, t1: BE.wide1, set: 'apt', fp: true,
    cam: (t, ctx) => { const V = ctx.bedV; return { pos: V.eye, at: V.eye.clone().add(new THREE.Vector3(Math.sin(V.yaw) * Math.cos(V.pitch), Math.sin(V.pitch), Math.cos(V.yaw) * Math.cos(V.pitch))), fov: 62, focus: 0.8, dof: t < BE.dark0 ? 0.25 : 0 }; },
    look: beCollapse },
  // A2 — the impact from above: the wave leaves the phone on the floor and sweeps the room (bed, dresser, walls, her);
  //      the phone skids under the dresser, a trail of small contacts
  //      (a plan view through the ceiling, like a cut-away model: the clearest picture of where the echoes go)
  { id: 'A2', t0: BE.wide1, t1: BE.back1, set: 'apt', tag: true, plan: true, decay: 1.1, gain: 1.8, heroGain: 1.2,
    cam: beMove(BE.wide1, BE.back1, [_beV(-0.1, 5.4, 1.5), _beV(-0.3, 0, -0.25), 44], [_beV(-0.4, 4.7, 1.25), _beV(-0.6, 0, -0.4), 44], { dof: 0, ease: Ease.outSine }),
    look: () => BE_DARK },
  // A3 — back in first person: she turns toward the sound under the dresser; the phone still buzzes there
  { id: 'A3', t0: BE.back1, t1: BE.s2, set: 'apt', fp: true,
    cam: (t, ctx) => { const V = ctx.bedV; return { pos: V.eye, at: V.eye.clone().add(new THREE.Vector3(Math.sin(V.yaw) * Math.cos(V.pitch), Math.sin(V.pitch), Math.cos(V.yaw) * Math.cos(V.pitch))), fov: 62, focus: 1, dof: 0 }; },
    look: () => BE_DARK },
  // ================= SCENE 2 — a world without light (placeholder wide until built)
  { id: 'B1', t0: BE.s2, t1: 1e9, set: 'apt',
    cam: beMove(BE.s2, BE.s3, [_beV(1.6, 1.55, 1.7), _beV(-0.6, 0.7, -1.2), 50], [_beV(1.3, 1.45, 1.5), _beV(-0.7, 0.7, -1.3), 46]),
    look: () => BE_REAL },
];

function beShotAt(t) { for (const s of BE_SHOTS) if (t >= s.t0 && t < s.t1) return s; return BE_SHOTS[BE_SHOTS.length - 1]; }
