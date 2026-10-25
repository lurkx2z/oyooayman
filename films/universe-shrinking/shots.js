/* =====================================================================
   SHOTS — every shot of the film, in order: { id, t0, t1, set, mode }. Sets: garden (your back garden at night, and
   everything that happens to it), cosmos (the galaxies, illustrated: space growing, the edge), scope (Saturn in your
   telescope's eyepiece), dark (midnight). Mode picks the action and camera inside a set.
   Cut points come from script.js (UC), i.e. from the captions.
   ===================================================================== */

const UC_SHOTS = [
  // 1 — 11:41 tonight; the title; space grows; Saturn; the rule
  { id: 'A0', t0: -1, t1: UC.titleShot, set: 'garden', mode: 'cold' },
  { id: 'A1', t0: UC.titleShot, t1: UC.grow, set: 'garden', mode: 'title' },
  { id: 'A2', t0: UC.grow, t1: UC.scope, set: 'cosmos', mode: 'grow' },
  { id: 'A3', t0: UC.scope, t1: UC.rule, set: 'scope', mode: 'saturn0' },
  { id: 'A4', t0: UC.rule, t1: UC.second, set: 'garden', mode: 'rule' },
  // 2 — the first second, slowed down
  { id: 'B1', t0: UC.second, t1: UC.far, set: 'garden', mode: 'freeze' },
  { id: 'B2', t0: UC.far, t1: UC.andro, set: 'cosmos', mode: 'edge' },
  { id: 'B3', t0: UC.andro, t1: UC.letgo, set: 'garden', mode: 'andro' },
  { id: 'B4', t0: UC.letgo, t1: UC.stars, set: 'garden', mode: 'letgo' },
  { id: 'B5', t0: UC.stars, t1: UC.resume, set: 'garden', mode: 'stars' },
  { id: 'B6', t0: UC.resume, t1: UC.stretch, set: 'garden', mode: 'land' },
  // 3 — the sky goes out
  { id: 'C1', t0: UC.stretch, t1: UC.moon, set: 'garden', mode: 'sky' },
  { id: 'C2', t0: UC.moon, t1: UC.saturn, set: 'garden', mode: 'moon' },
  { id: 'C3', t0: UC.saturn, t1: UC.blue, set: 'scope', mode: 'saturn1' },
  { id: 'C4', t0: UC.blue, t1: UC.moon2, set: 'garden', mode: 'pleiades' },
  { id: 'C5', t0: UC.moon2, t1: UC.weight, set: 'garden', mode: 'moon2' },
  // 4 — lighter
  { id: 'D1', t0: UC.weight, t1: UC.fountain, set: 'garden', mode: 'weight' },
  { id: 'D2', t0: UC.fountain, t1: UC.moongo, set: 'garden', mode: 'fountain' },
  { id: 'D3', t0: UC.moongo, t1: UC.jumpShot, set: 'garden', mode: 'moongo' },
  { id: 'D4', t0: UC.jumpShot, t1: UC.air, set: 'garden', mode: 'jump' },
  { id: 'D5', t0: UC.air, t1: UC.tea, set: 'garden', mode: 'air' },
  { id: 'D6', t0: UC.tea, t1: UC.flame, set: 'garden', mode: 'tea' },
  { id: 'D7', t0: UC.flame, t1: UC.zero, set: 'garden', mode: 'flame' },
  // 5 — weightless; Earth comes apart
  { id: 'E1', t0: UC.zero, t1: UC.rise, set: 'garden', mode: 'zero' },
  { id: 'E2', t0: UC.rise, t1: UC.crack, set: 'garden', mode: 'rise' },
  { id: 'E3', t0: UC.crack, t1: UC.drift, set: 'garden', mode: 'crack' },
  { id: 'E4', t0: UC.drift, t1: UC.pieces, set: 'garden', mode: 'drift' },
  { id: 'E5', t0: UC.pieces, t1: UC.last, set: 'garden', mode: 'pieces' },
  // 6 — the last second; midnight
  { id: 'F1', t0: UC.last, t1: UC.midnight, set: 'garden', mode: 'last' },
  { id: 'F2', t0: UC.midnight, t1: UC.real, set: 'dark', mode: 'midnight' },
  // 7 — is any of this real; the question
  { id: 'G1', t0: UC.real, t1: UC.future, set: 'cosmos', mode: 'real' },
  { id: 'G2', t0: UC.future, t1: UC.question, set: 'cosmos', mode: 'future' },
  { id: 'G3', t0: UC.question, t1: 1e9, set: 'garden', mode: 'after' },
];
// every cut, for the 2-frame dip (the shot starts, plus a set's own cuts())
function ucCutTimes(app) {
  const out = UC_SHOTS.map((s) => s.t0).filter((t) => t > 0 && Math.abs(t - UC.midnight) > 0.01 && Math.abs(t - UC.real) > 0.01);
  for (const s of Object.values((app && app.sets) || {})) if (s.cuts) out.push(...s.cuts());
  return out;
}
function ucShotAt(t) { for (const s of UC_SHOTS) if (t >= s.t0 && t < s.t1) return s; return UC_SHOTS[UC_SHOTS.length - 1]; }
