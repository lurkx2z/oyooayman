/* =====================================================================
   SHOTS — every shot of the film, in order: { id, t0, t1, set, mode }. Sets: garden (your back garden tonight, and the
   kitchen; everything the sky does to them), cosmos (the galaxies, illustrated), dark (midnight). Mode picks the
   action and the camera inside a set. Cut points come from script.js (UC), i.e. from the captions.
   ===================================================================== */

const UC_SHOTS = [
  // 1 — 11:44 tonight; the title; 7:29; the rule; held together; the promise
  { id: 'A0', t0: -1, t1: UC.titleShot, set: 'garden', mode: 'cold' },
  { id: 'A1', t0: UC.titleShot, t1: UC.frost0, set: 'garden', mode: 'title' },
  { id: 'A2', t0: UC.frost0, t1: UC.rule, set: 'garden', mode: 'frost0' },
  { id: 'A3', t0: UC.rule, t1: UC.held, set: 'cosmos', mode: 'rule' },
  { id: 'A4', t0: UC.held, t1: UC.promise, set: 'cosmos', mode: 'held' },
  { id: 'A5', t0: UC.promise, t1: UC.begin, set: 'cosmos', mode: 'promise' },
  // 2 — the squeeze
  { id: 'B1', t0: UC.begin, t1: UC.mirach, set: 'garden', mode: 'begin' },
  { id: 'B2', t0: UC.mirach, t1: UC.squeeze, set: 'garden', mode: 'mirach' },
  { id: 'B3', t0: UC.squeeze, t1: UC.half, set: 'garden', mode: 'squeeze' },
  { id: 'B4', t0: UC.half, t1: UC.more, set: 'garden', mode: 'half' },
  { id: 'B5', t0: UC.more, t1: UC.best, set: 'garden', mode: 'more' },
  { id: 'B6', t0: UC.best, t1: UC.glow, set: 'garden', mode: 'best' },
  // 3 — the glow
  { id: 'C1', t0: UC.glow, t1: UC.ebl, set: 'garden', mode: 'glow' },
  { id: 'C2', t0: UC.ebl, t1: UC.city, set: 'garden', mode: 'ebl' },
  { id: 'C3', t0: UC.city, t1: UC.drown, set: 'garden', mode: 'city' },
  { id: 'C4', t0: UC.drown, t1: UC.frost, set: 'garden', mode: 'drown' },
  // 4 — the heat
  { id: 'D1', t0: UC.frost, t1: UC.zero, set: 'garden', mode: 'frost' },
  { id: 'D2', t0: UC.zero, t1: UC.warm, set: 'garden', mode: 'zero' },
  { id: 'D3', t0: UC.warm, t1: UC.boil, set: 'garden', mode: 'warm' },
  { id: 'D4', t0: UC.boil, t1: UC.steam, set: 'garden', mode: 'boil' },
  // 5 — the fire, from the kitchen window
  { id: 'E1', t0: UC.steam, t1: UC.leaves, set: 'garden', mode: 'steam' },
  { id: 'E2', t0: UC.leaves, t1: UC.lawn, set: 'garden', mode: 'leaves' },
  { id: 'E3', t0: UC.lawn, t1: UC.noon, set: 'garden', mode: 'lawn' },
  { id: 'E4', t0: UC.noon, t1: UC.shed, set: 'garden', mode: 'noon' },
  { id: 'E5', t0: UC.shed, t1: UC.glass, set: 'garden', mode: 'shed' },
  { id: 'E6', t0: UC.glass, t1: UC.bath, set: 'garden', mode: 'glass' },
  // 6 — the afterglow
  { id: 'F1', t0: UC.bath, t1: UC.red, set: 'garden', mode: 'bath' },
  { id: 'F2', t0: UC.red, t1: UC.melt, set: 'garden', mode: 'red' },
  { id: 'F3', t0: UC.melt, t1: UC.vanish, set: 'garden', mode: 'melt' },
  { id: 'F4', t0: UC.vanish, t1: UC.bigbang, set: 'garden', mode: 'vanish' },
  { id: 'F5', t0: UC.bigbang, t1: UC.sun, set: 'garden', mode: 'bigbang' },
  { id: 'F6', t0: UC.sun, t1: UC.last, set: 'garden', mode: 'sun' },
  // 7 — the last second; midnight
  { id: 'G1', t0: UC.last, t1: UC.midnight, set: 'garden', mode: 'last' },
  { id: 'G2', t0: UC.midnight, t1: UC.real, set: 'dark', mode: 'midnight' },
  // 8 — is any of this real; the question
  { id: 'H1', t0: UC.real, t1: UC.clue, set: 'cosmos', mode: 'real' },
  { id: 'H2', t0: UC.clue, t1: UC.turn, set: 'cosmos', mode: 'map' },
  { id: 'H3', t0: UC.turn, t1: UC.question, set: 'cosmos', mode: 'turn' },
  { id: 'H5', t0: UC.question, t1: 1e9, set: 'garden', mode: 'after' },
];
// every cut, for the 2-frame dip (the shot starts, plus a set's own cuts())
function ucCutTimes(app) {
  const out = UC_SHOTS.map((s) => s.t0).filter((t) => t > 0 && Math.abs(t - UC.midnight) > 0.01 && Math.abs(t - UC.real) > 0.01);
  for (const s of Object.values((app && app.sets) || {})) if (s.cuts) out.push(...s.cuts());
  return out;
}
function ucShotAt(t) { for (const s of UC_SHOTS) if (t >= s.t0 && t < s.t1) return s; return UC_SHOTS[UC_SHOTS.length - 1]; }
