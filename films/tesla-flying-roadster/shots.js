/* =====================================================================
   SHOTS — every shot of the film, in order: { id, t0, t1, set, mode }. A set is one of the worlds film.js builds
   (site: the test site; sky: the stunt plane); mode picks the motion and camera inside it (site-shots.js).
   Cut points come from script.js (TR), i.e. from the real narration.
   ===================================================================== */

const TR_SHOTS = [
  // ================= 1 — THE DEMO
  { id: 'A1', t0: -1, t1: TR.hero, set: 'site', mode: 'title' },
  { id: 'A2', t0: TR.hero, t1: TR.go + 0.25, set: 'site', mode: 'hero' },
  { id: 'A3', t0: TR.go + 0.25, t1: TR.replay, set: 'site', mode: 'run' },
  { id: 'A4', t0: TR.replay, t1: TR.plane, set: 'site', mode: 'replay' },
  // ================= 2 — WAY 1: THE WING
  { id: 'B1', t0: TR.plane, t1: TR.suck, set: 'sky' },
  // ================= 3 — WAY 2: SUCTION, and 4 — WAY 3: THRUST (one continuous explainer under the ramp)
  { id: 'C1', t0: TR.suck, t1: TR.hover, set: 'site', mode: 'suck' },
  // ================= 5 — THE CATCH
  { id: 'E1', t0: TR.hover, t1: TR.heli, set: 'site', mode: 'hover' },
  { id: 'E2', t0: TR.heli, t1: TR.hop, set: 'site', mode: 'heli' },
  // ================= 6 — THE HOP, THE VERDICT, THE LAST QUESTION
  { id: 'F1', t0: TR.hop, t1: TR.real, set: 'site', mode: 'hop' },
  { id: 'F2', t0: TR.real, t1: TR.pov, set: 'site', mode: 'real' },
  { id: 'F3', t0: TR.pov, t1: 1e9, set: 'site', mode: 'pov' },
];
// the extra cuts inside a shot (the run's three set-ups, the explainer's drop and landing), for the cut dip
function trCutTimes() {
  const C = trRunClock(); trExClock();
  return TR_SHOTS.map((s) => s.t0).filter((t) => t > 0).concat([C.tLoop, C.tAir, TR.leave, TR.drop + 1.2, TR.brk, TR.kick - 0.4]);
}

function trShotAt(t) { for (const s of TR_SHOTS) if (t >= s.t0 && t < s.t1) return s; return TR_SHOTS[TR_SHOTS.length - 1]; }
