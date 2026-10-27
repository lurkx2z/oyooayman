/* =====================================================================
   SHOTS — every shot of the film, in order: { id, t0, t1, set, mode }. Sets: garden (your back garden and the sky
   over it: garden.js), hawaii (Waikiki beach at noon: hawaii.js), space (the Earth, the Sun, the light: space.js).
   Mode picks the action and the camera inside a set. Cut points come from script.js (LB), i.e. from the captions.
   ===================================================================== */

const LB_SHOTS = [
  // 1 — the cold open (10:02 PM, daylight); the title
  { id: 'A0', t0: -1, t1: LB.titleShot, set: 'garden', mode: 'open' },
  { id: 'A1', t0: LB.titleShot, t1: LB.before, set: 'garden', mode: 'title' },
  // 2 — 9:59 PM
  { id: 'B1', t0: LB.before, t1: LB.rule, set: 'garden', mode: 'before' },
  { id: 'B2', t0: LB.rule, t1: LB.count, set: 'garden', mode: 'rule' },
  { id: 'B3', t0: LB.count, t1: LB.moonCut, set: 'garden', mode: 'vanish' },
  // 3 — real time from 10:00:00
  { id: 'C1', t0: LB.moonCut, t1: LB.lights, set: 'garden', mode: 'crescent' },
  { id: 'C2', t0: LB.lights, t1: LB.siriusCut, set: 'garden', mode: 'lights' },
  { id: 'C3', t0: LB.siriusCut, t1: LB.mirror, set: 'garden', mode: 'sirius' },
  { id: 'C4', t0: LB.mirror, t1: LB.replay, set: 'garden', mode: 'mirror' },
  { id: 'C5', t0: LB.replay, t1: LB.replayEnd, set: 'garden', mode: 'replay' },
  { id: 'C7', t0: LB.europeCut, t1: LB.north, set: 'garden', mode: 'europe' },
  { id: 'C8', t0: LB.north, t1: LB.switchCut, set: 'garden', mode: 'north' },
  { id: 'C9', t0: LB.switchCut, t1: LB.day, set: 'garden', mode: 'switch' },
  // 4 — the second Sun
  { id: 'D1', t0: LB.day, t1: LB.why, set: 'garden', mode: 'day' },
  { id: 'D2', t0: LB.why, t1: LB.shadow, set: 'space', mode: 'why' },
  { id: 'D3', t0: LB.shadow, t1: LB.wave, set: 'space', mode: 'shadow' },
  { id: 'D4', t0: LB.wave, t1: LB.moonwhy, set: 'space', mode: 'wave' },
  { id: 'D5', t0: LB.moonwhy, t1: LB.project, set: 'garden', mode: 'moonwhy' },
  { id: 'D6', t0: LB.project, t1: LB.past, set: 'garden', mode: 'project' },
  { id: 'D7', t0: LB.past, t1: LB.hawaii, set: 'garden', mode: 'past' },
  // 5 — Hawaii
  { id: 'E1', t0: LB.hawaii, t1: LB.black, set: 'hawaii', mode: 'noon' },
  { id: 'E2', t0: LB.black, t1: LB.shrink, set: 'hawaii', mode: 'black' },
  { id: 'E2b', t0: LB.shrink, t1: LB.half, set: 'hawaii', mode: 'shrink' },
  { id: 'E3', t0: LB.half, t1: LB.wait, set: 'space', mode: 'half' },
  { id: 'E4', t0: LB.wait, t1: LB.voyager, set: 'hawaii', mode: 'wait' },
  { id: 'E5', t0: LB.voyager, t1: LB.ret, set: 'space', mode: 'voyager' },
  { id: 'E6', t0: LB.ret, t1: LB.sunClose, set: 'hawaii', mode: 'return' },
  { id: 'E7', t0: LB.sunClose, t1: LB.full, set: 'hawaii', mode: 'bright' },
  // 6 — home
  { id: 'F1', t0: LB.full, t1: LB.three, set: 'garden', mode: 'full' },
  { id: 'F2', t0: LB.three, t1: LB.midnight, set: 'garden', mode: 'three' },
  { id: 'F3', t0: LB.midnight, t1: LB.sunrise, set: 'garden', mode: 'midnight' },
  { id: 'F4', t0: LB.sunrise, t1: LB.little, set: 'garden', mode: 'sunrise' },
  { id: 'F4b', t0: LB.little, t1: LB.noon, set: 'garden', mode: 'little' },
  { id: 'F5', t0: LB.noon, t1: LB.never, set: 'garden', mode: 'noon' },
  { id: 'F6', t0: LB.never, t1: LB.summer, set: 'garden', mode: 'never' },
  // 7 — the planet, the years
  { id: 'G2', t0: LB.summer, t1: LB.heat, set: 'garden', mode: 'summer' },
  { id: 'G3', t0: LB.heat, t1: LB.boil, set: 'space', mode: 'ice' },
  { id: 'G4', t0: LB.boil, t1: LB.birth, set: 'space', mode: 'boil' },
  { id: 'G5', t0: LB.birth, t1: LB.nightBack, set: 'space', mode: 'birth' },
  { id: 'G6', t0: LB.nightBack, t1: LB.real, set: 'garden', mode: 'nightback' },
  // 8 — is any of this real; the question
  { id: 'H1', t0: LB.real, t1: LB.real3, set: 'garden', mode: 'real' },
  { id: 'H1b', t0: LB.real3, t1: LB.real4, set: 'space', mode: 'real3' },
  { id: 'H1c', t0: LB.real4, t1: LB.question, set: 'garden', mode: 'real' },
  { id: 'H2', t0: LB.question, t1: 1e9, set: 'garden', mode: 'question' },
];
// every cut, for the 2-frame dip (the shot starts, plus a set's own cuts())
function lbCutTimes(app) {
  const out = LB_SHOTS.map((s) => s.t0).filter((t) => t > 0);
  for (const s of Object.values((app && app.sets) || {})) if (s.cuts) out.push(...s.cuts());
  return out;
}
function lbShotAt(t) { for (const s of LB_SHOTS) if (t >= s.t0 && t < s.t1) return s; return LB_SHOTS[LB_SHOTS.length - 1]; }
