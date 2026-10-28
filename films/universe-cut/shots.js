/* =====================================================================
   SHOTS — every shot of the film, in order: { id, t0, t1, set, mode }. Sets: garden (your back garden and the sky over
   it: garden.js), space (what is left of the Earth: space.js). Mode picks the action and the camera inside a set. Cut
   points come from script.js (HV), i.e. from the captions.
   ===================================================================== */

const HV_SHOTS = [
  // 1 — the cold open (10:03:32: the shock arrives); the title
  { id: 'A0', t0: -1, t1: HV.titleShot, set: 'garden', mode: 'open' },
  { id: 'A1', t0: HV.titleShot, t1: HV.before, set: 'garden', mode: 'title' },
  // 2 — four minutes earlier
  { id: 'B1', t0: HV.before, t1: HV.rule, set: 'garden', mode: 'before' },
  { id: 'B2', t0: HV.rule, t1: HV.count, set: 'garden', mode: 'rule' },
  { id: 'B3', t0: HV.count, t1: HV.line, set: 'garden', mode: 'vanish' },
  // 3 — real time from 10:00:00
  { id: 'C1', t0: HV.line, t1: HV.moon, set: 'garden', mode: 'line' },
  { id: 'C2', t0: HV.moon, t1: HV.moonEnd, set: 'garden', mode: 'replay' },
  { id: 'C3', t0: HV.moonEnd, t1: HV.why, set: 'garden', mode: 'nothing' },
  { id: 'C4', t0: HV.why, t1: HV.gone, set: 'garden', mode: 'why' },
  { id: 'D1', t0: HV.gone, t1: HV.face, set: 'space', mode: 'gone' },
  { id: 'D2', t0: HV.face, t1: HV.blow, set: 'space', mode: 'face' },
  { id: 'D3', t0: HV.blow, t1: HV.shock, set: 'space', mode: 'blow' },
  { id: 'D4', t0: HV.shock, t1: HV.calls, set: 'space', mode: 'shock' },
  { id: 'E1', t0: HV.calls, t1: HV.tv, set: 'garden', mode: 'calls' },
  { id: 'E2', t0: HV.tv, t1: HV.front, set: 'garden', mode: 'tv' },
  { id: 'E3', t0: HV.front, t1: HV.edge, set: 'space', mode: 'front' },
  { id: 'E4', t0: HV.edge, t1: HV.moonedge, set: 'space', mode: 'edge' },
  { id: 'E5', t0: HV.moonedge, t1: HV.others, set: 'garden', mode: 'moonedge' },
  { id: 'E6', t0: HV.others, t1: HV.compass, set: 'space', mode: 'others' },
  { id: 'E7', t0: HV.compass, t1: HV.nowhere, set: 'garden', mode: 'compass' },
  { id: 'E8', t0: HV.nowhere, t1: HV.saturn, set: 'garden', mode: 'nowhere' },
  { id: 'E9', t0: HV.saturn, t1: HV.cat2, set: 'garden', mode: 'saturn' },
  { id: 'E10', t0: HV.cat2, t1: HV.lighter, set: 'garden', mode: 'cat' },
  { id: 'F1', t0: HV.lighter, t1: HV.bath, set: 'garden', mode: 'lighter' },
  { id: 'F2', t0: HV.bath, t1: HV.paris, set: 'garden', mode: 'bath' },
  { id: 'F3', t0: HV.paris, t1: HV.alarms, set: 'space', mode: 'paris' },
  { id: 'F4', t0: HV.alarms, t1: HV.count2, set: 'garden', mode: 'alarms' },
  { id: 'F5', t0: HV.count2, t1: HV.hitShot, set: 'garden', mode: 'count' },     // (quick cuts inside: HV.countCuts)
  { id: 'F6', t0: HV.hitShot, t1: HV.fall, set: 'garden', mode: 'hit' },
  // 4 — after: from space
  { id: 'G1', t0: HV.fall, t1: HV.moonaway, set: 'space', mode: 'fall' },
  { id: 'G2', t0: HV.moonaway, t1: HV.orbit, set: 'space', mode: 'moonaway' },
  { id: 'G3', t0: HV.orbit, t1: HV.forever, set: 'space', mode: 'orbit' },
  { id: 'G4', t0: HV.forever, t1: HV.real, set: 'space', mode: 'forever' },
  // 5 — is any of this real; the question (tonight, 9:59)
  { id: 'H1', t0: HV.real, t1: HV.question, set: 'garden', mode: 'real' },
  { id: 'H2', t0: HV.question, t1: 1e9, set: 'garden', mode: 'question' },
];
// every cut, for the 2-frame dip (the shot starts, plus a set's own cuts())
function hvCutTimes(app) {
  const out = HV_SHOTS.map((s) => s.t0).filter((t) => t > 0 && Math.abs(t - HV.hitShot) > 0.01);
  for (const s of Object.values((app && app.sets) || {})) if (s.cuts) out.push(...s.cuts());
  return out;
}
function hvShotAt(t) { for (const s of HV_SHOTS) if (t >= s.t0 && t < s.t1) return s; return HV_SHOTS[HV_SHOTS.length - 1]; }
