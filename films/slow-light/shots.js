/* =====================================================================
   SHOTS — every shot of the film, in order: { id, t0, t1, set, mode }. Sets: home (the flat: living room, balcony,
   hallway mirror), street (the road outside at night), globe (the Earth, light lapping it), lab (Harvard, 1999),
   dark (nothing reaches you: black, and the diagrams). Mode picks the action and camera inside a set.
   Cut points come from script.js (SL), i.e. from the narration.
   ===================================================================== */

const SL_SHOTS = [
  // 1 — later tonight, the title, light is fast, the rule
  { id: 'A0', t0: -1, t1: SL.titleShot, set: 'home', mode: 'cold' },
  { id: 'A1', t0: SL.titleShot, t1: SL.fast, set: 'home', mode: 'title' },
  { id: 'A2', t0: SL.fast, t1: SL.rule, set: 'globe', mode: 'fast' },
  { id: 'A3', t0: SL.rule, t1: SL.call, set: 'home', mode: 'rule' },
  // 2 — the call, the map, the Sun
  { id: 'B1', t0: SL.call, t1: SL.map, set: 'home', mode: 'call' },
  { id: 'B2', t0: SL.map, t1: SL.sun, set: 'home', mode: 'map' },
  { id: 'B3', t0: SL.sun, t1: SL.fw, set: 'home', mode: 'window' },
  // 3 — fireworks
  { id: 'C1', t0: SL.fw, t1: SL.street, set: 'home', mode: 'fireworks' },
  // 4 — the street
  { id: 'D1', t0: SL.street, t1: SL.faster, set: 'street', mode: 'car1' },
  { id: 'D2', t0: SL.faster, t1: SL.cat, set: 'street', mode: 'car2' },
  // 5 — the cat
  { id: 'E1', t0: SL.cat, t1: SL.mirror, set: 'home', mode: 'laser' },
  // 6 — the mirror
  { id: 'F1', t0: SL.mirror, t1: SL.lamp, set: 'home', mode: 'mirror' },
  // 7 — the lamp
  { id: 'G1', t0: SL.lamp, t1: SL.knock, set: 'home', mode: 'lamp' },
  // 8 — the knock, the freeze
  { id: 'H1', t0: SL.knock, t1: SL.freeze, set: 'home', mode: 'knock' },
  { id: 'H2', t0: SL.freeze, t1: SL.last, set: 'home', mode: 'freeze' },
  // 9 — the dark
  { id: 'I1', t0: SL.last, t1: SL.on2, set: 'dark', mode: 'eye' },
  { id: 'I2', t0: SL.on2, t1: SL.text, set: 'home', mode: 'xray' },
  { id: 'I3', t0: SL.text, t1: SL.real, set: 'dark', mode: 'text' },
  // 10 — it's real; the question
  { id: 'J1', t0: SL.real, t1: SL.question, set: 'lab', mode: 'lab' },
  { id: 'J2', t0: SL.question, t1: 1e9, set: 'home', mode: 'after' },
];
// every cut, for the 2-frame dip (the shot starts, plus a set's own cuts())
function slCutTimes(app) {
  const out = SL_SHOTS.map((s) => s.t0).filter((t) => t > 0 && !(t > SL.stop - 0.5 && t < SL.real - 0.5));
  for (const s of Object.values((app && app.sets) || {})) if (s.cuts) out.push(...s.cuts());
  return out;
}
function slShotAt(t) { for (const s of SL_SHOTS) if (t >= s.t0 && t < s.t1) return s; return SL_SHOTS[SL_SHOTS.length - 1]; }
