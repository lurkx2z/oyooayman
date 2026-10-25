/* =====================================================================
   SHOTS — every shot of the film, in order: { id, t0, t1, set, mode }. Sets: garden (your back garden at night, and
   everything that happens to it), cosmos (the galaxies, illustrated: space growing, the edge), scope (Saturn in your
   telescope's eyepiece), dark (midnight). Mode picks the action and camera inside a set.
   Cut points come from script.js (UX), i.e. from the captions.
   ===================================================================== */

const UX_SHOTS = [
  // 1 — 11:41 tonight; the title; space grows; Saturn; the rule
  { id: 'A0', t0: -1, t1: UX.titleShot, set: 'garden', mode: 'cold' },
  { id: 'A1', t0: UX.titleShot, t1: UX.grow, set: 'garden', mode: 'title' },
  { id: 'A2', t0: UX.grow, t1: UX.scope, set: 'cosmos', mode: 'grow' },
  { id: 'A3', t0: UX.scope, t1: UX.rule, set: 'scope', mode: 'saturn0' },
  { id: 'A4', t0: UX.rule, t1: UX.second, set: 'garden', mode: 'rule' },
  // 2 — the first second, slowed down
  { id: 'B1', t0: UX.second, t1: UX.far, set: 'garden', mode: 'freeze' },
  { id: 'B2', t0: UX.far, t1: UX.andro, set: 'cosmos', mode: 'edge' },
  { id: 'B3', t0: UX.andro, t1: UX.letgo, set: 'garden', mode: 'andro' },
  { id: 'B4', t0: UX.letgo, t1: UX.stars, set: 'garden', mode: 'letgo' },
  { id: 'B5', t0: UX.stars, t1: UX.resume, set: 'garden', mode: 'stars' },
  { id: 'B6', t0: UX.resume, t1: UX.stretch, set: 'garden', mode: 'land' },
  // 3 — the sky goes out
  { id: 'C1', t0: UX.stretch, t1: UX.moon, set: 'garden', mode: 'sky' },
  { id: 'C2', t0: UX.moon, t1: UX.saturn, set: 'garden', mode: 'moon' },
  { id: 'C3', t0: UX.saturn, t1: UX.blue, set: 'scope', mode: 'saturn1' },
  { id: 'C4', t0: UX.blue, t1: UX.moon2, set: 'garden', mode: 'pleiades' },
  { id: 'C5', t0: UX.moon2, t1: UX.weight, set: 'garden', mode: 'moon2' },
  // 4 — lighter
  { id: 'D1', t0: UX.weight, t1: UX.fountain, set: 'garden', mode: 'weight' },
  { id: 'D2', t0: UX.fountain, t1: UX.moongo, set: 'garden', mode: 'fountain' },
  { id: 'D3', t0: UX.moongo, t1: UX.jumpShot, set: 'garden', mode: 'moongo' },
  { id: 'D4', t0: UX.jumpShot, t1: UX.air, set: 'garden', mode: 'jump' },
  { id: 'D5', t0: UX.air, t1: UX.tea, set: 'garden', mode: 'air' },
  { id: 'D6', t0: UX.tea, t1: UX.flame, set: 'garden', mode: 'tea' },
  { id: 'D7', t0: UX.flame, t1: UX.zero, set: 'garden', mode: 'flame' },
  // 5 — weightless; Earth comes apart
  { id: 'E1', t0: UX.zero, t1: UX.rise, set: 'garden', mode: 'zero' },
  { id: 'E2', t0: UX.rise, t1: UX.crack, set: 'garden', mode: 'rise' },
  { id: 'E3', t0: UX.crack, t1: UX.drift, set: 'garden', mode: 'crack' },
  { id: 'E4', t0: UX.drift, t1: UX.pieces, set: 'garden', mode: 'drift' },
  { id: 'E5', t0: UX.pieces, t1: UX.last, set: 'garden', mode: 'pieces' },
  // 6 — the last second; midnight
  { id: 'F1', t0: UX.last, t1: UX.midnight, set: 'garden', mode: 'last' },
  { id: 'F2', t0: UX.midnight, t1: UX.real, set: 'dark', mode: 'midnight' },
  // 7 — is any of this real; the question
  { id: 'G1', t0: UX.real, t1: UX.future, set: 'cosmos', mode: 'real' },
  { id: 'G2', t0: UX.future, t1: UX.question, set: 'cosmos', mode: 'future' },
  { id: 'G3', t0: UX.question, t1: 1e9, set: 'garden', mode: 'after' },
];
// every cut, for the 2-frame dip (the shot starts, plus a set's own cuts())
function uxCutTimes(app) {
  const out = UX_SHOTS.map((s) => s.t0).filter((t) => t > 0 && Math.abs(t - UX.midnight) > 0.01 && Math.abs(t - UX.real) > 0.01);
  for (const s of Object.values((app && app.sets) || {})) if (s.cuts) out.push(...s.cuts());
  return out;
}
function uxShotAt(t) { for (const s of UX_SHOTS) if (t >= s.t0 && t < s.t1) return s; return UX_SHOTS[UX_SHOTS.length - 1]; }
