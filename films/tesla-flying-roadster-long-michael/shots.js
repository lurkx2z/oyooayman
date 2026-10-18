/* =====================================================================
   SHOTS — every shot of the film, in order: { id, t0, t1, set, mode }. A set is one of the worlds film.js builds
   (site: the test site; sky: the stunt plane; track: the race cars; toy: the desk loop; space: the capsule); mode picks
   the motion and camera inside it. Cut points come from script.js (TR), i.e. from the real narration.
   ===================================================================== */

const TR_SHOTS = [
  // ================= 1 — THE DEMO
  { id: 'A0', t0: -1, t1: TR.wide, set: 'site', mode: 'cold' },
  { id: 'A1', t0: TR.wide, t1: TR.when, set: 'site', mode: 'title' },
  { id: 'A2', t0: TR.when, t1: TR.did, set: 'site', mode: 'when' },
  { id: 'A3', t0: TR.did, t1: TR.go, set: 'site', mode: 'did' },
  { id: 'A4', t0: TR.go, t1: TR.claims, set: 'site', mode: 'run' },
  { id: 'A5', t0: TR.claims, t1: TR.questions, set: 'site', mode: 'claims' },
  { id: 'A6', t0: TR.questions, t1: TR.three, set: 'site', mode: 'replay' },
  // ================= 2 — WAY 1: THE WING (and the race car's upside-down wing)
  { id: 'B1', t0: TR.three, t1: TR.race, set: 'sky', mode: 'sky' },
  { id: 'B2', t0: TR.race, t1: TR.theory, set: 'track', mode: 'race' },
  { id: 'B3', t0: TR.theory, t1: TR.catch, set: 'track', mode: 'theory' },
  { id: 'B4', t0: TR.catch, t1: TR.toy, set: 'track', mode: 'catch' },
  // ================= 3 — THE LOOP
  { id: 'C1', t0: TR.toy, t1: TR.numbers, set: 'toy', mode: 'toy' },
  { id: 'C2', t0: TR.numbers, t1: TR.flat, set: 'site', mode: 'loopspeed' },
  { id: 'C3', t0: TR.flat, t1: TR.suck, set: 'site', mode: 'flat' },
  // ================= 4 — WAY 2: SUCTION
  { id: 'D1', t0: TR.suck, t1: TR.old, set: 'site', mode: 'ex' },
  { id: 'D2', t0: TR.old, t1: TR.brabham, set: 'track', mode: 'chap70' },
  { id: 'D3', t0: TR.brabham, t1: TR.mcm, set: 'track', mode: 'fan78' },
  { id: 'D4', t0: TR.mcm, t1: TR.surface, set: 'track', mode: 'mcm' },
  { id: 'D5', t0: TR.surface, t1: TR.newton, set: 'site', mode: 'ex' },
  // ================= 5 — WAY 3: THRUST
  { id: 'E1', t0: TR.newton, t1: TR.cold, set: 'space', mode: 'newton' },
  { id: 'E2', t0: TR.cold, t1: TR.space2, set: 'site', mode: 'ex' },
  { id: 'E3', t0: TR.space2, t1: TR.nozzles, set: 'space', mode: 'steer' },
  { id: 'E4', t0: TR.nozzles, t1: TR.hover, set: 'site', mode: 'ex' },
  { id: 'E5', t0: TR.hover, t1: TR.heli, set: 'site', mode: 'hover' },
  { id: 'E6', t0: TR.heli, t1: TR.bottle, set: 'site', mode: 'heli' },
  { id: 'E7', t0: TR.bottle, t1: TR.hop, set: 'site', mode: 'bottle' },
  { id: 'E8', t0: TR.hop, t1: TR.real, set: 'site', mode: 'hop' },
  // ================= 6 — THE REALITY CHECK
  { id: 'F1', t0: TR.real, t1: TR.legal, set: 'site', mode: 'real' },
  { id: 'F2', t0: TR.legal, t1: TR.human, set: 'site', mode: 'legal' },
  // ================= 7 — YOU
  { id: 'G1', t0: TR.human, t1: TR.pov, set: 'site', mode: 'human' },
  { id: 'G2', t0: TR.pov, t1: 1e9, set: 'site', mode: 'pov' },
];
// every cut, for the 2-frame dip: the shot starts, plus the cuts inside a shot (a set's cuts(), a site mode's cuts())
function trCutTimes(app) {
  const out = TR_SHOTS.map((s) => s.t0).filter((t) => t > 0);
  for (const s of Object.values((app && app.sets) || {})) if (s.cuts) out.push(...s.cuts());
  for (const M of Object.values(SITE_SHOTS)) if (M.cuts) out.push(...M.cuts());
  return out;
}

function trShotAt(t) { for (const s of TR_SHOTS) if (t >= s.t0 && t < s.t1) return s; return TR_SHOTS[TR_SHOTS.length - 1]; }
