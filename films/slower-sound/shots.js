/* =====================================================================
   SHOTS — every shot of the film, in order: { id, t0, t1, set, mode }. Sets: garden (your back garden, the sky over it,
   the kitchen inside: garden.js) and street (your road, the high street, the church at its end: street.js).
   Mode picks the action and the camera inside a set. Cut points come from script.js (SS), i.e. from the captions.
   ===================================================================== */

const SS_SHOTS = [
  // 1 — the cold open (3 PM); the title (6:59)
  { id: 'A0', t0: -1, t1: SS.titleShot, set: 'street', mode: 'cold' },
  { id: 'A1', t0: SS.titleShot, t1: SS.seven, set: 'garden', mode: 'title' },
  // 2 — the morning
  { id: 'B1', t0: SS.seven, t1: SS.bird, set: 'garden', mode: 'seven' },
  { id: 'B2', t0: SS.bird, t1: SS.plane, set: 'garden', mode: 'bird' },
  { id: 'B3', t0: SS.plane, t1: SS.boom, set: 'garden', mode: 'plane' },
  { id: 'B4', t0: SS.boom, t1: SS.carpet, set: 'garden', mode: 'boom' },
  { id: 'B5', t0: SS.carpet, t1: SS.eight, set: 'garden', mode: 'carpet' },
  { id: 'B6', t0: SS.eight, t1: SS.kettle, set: 'garden', mode: 'neighbour' },
  { id: 'B7', t0: SS.kettle, t1: SS.radio, set: 'garden', mode: 'kettle' },
  { id: 'B8', t0: SS.radio, t1: SS.nine, set: 'garden', mode: 'radio' },
  // 3 — the kitchen echoes; the vowels go; the motorway
  { id: 'C1', t0: SS.nine, t1: SS.ten, set: 'garden', mode: 'echo' },
  { id: 'C2', t0: SS.ten, t1: SS.motorway, set: 'garden', mode: 'vowels' },
  { id: 'C3', t0: SS.motorway, t1: SS.eleven, set: 'garden', mode: 'motorway' },
  // 4 — the street
  { id: 'D1', t0: SS.eleven, t1: SS.siren, set: 'street', mode: 'walk' },
  { id: 'D2', t0: SS.siren, t1: SS.silent, set: 'street', mode: 'siren' },
  { id: 'D3', t0: SS.silent, t1: SS.after, set: 'street', mode: 'silent' },
  { id: 'D4', t0: SS.after, t1: SS.backwards, set: 'street', mode: 'after' },
  { id: 'D5', t0: SS.backwards, t1: SS.noon, set: 'street', mode: 'backwards' },
  { id: 'D6', t0: SS.noon, t1: SS.ball, set: 'street', mode: 'noon' },
  { id: 'D7', t0: SS.ball, t1: SS.flying, set: 'street', mode: 'ball' },
  { id: 'D8', t0: SS.flying, t1: SS.one, set: 'street', mode: 'horizon' },
  { id: 'D9', t0: SS.one, t1: SS.two, set: 'street', mode: 'wind' },
  { id: 'D10', t0: SS.two, t1: SS.ears, set: 'street', mode: 'van' },
  { id: 'D11', t0: SS.ears, t1: SS.three, set: 'street', mode: 'ears' },
  { id: 'D12', t0: SS.three, t1: SS.four, set: 'street', mode: 'walkers' },
  // 5 — home
  { id: 'E1', t0: SS.four, t1: SS.clap, set: 'garden', mode: 'tv' },
  { id: 'E2', t0: SS.clap, t1: SS.earbuds, set: 'garden', mode: 'clap' },
  { id: 'E3', t0: SS.earbuds, t1: SS.five, set: 'garden', mode: 'earbuds' },
  { id: 'E4', t0: SS.five, t1: SS.hum, set: 'garden', mode: 'cat' },
  { id: 'E5', t0: SS.hum, t1: SS.storm, set: 'garden', mode: 'hum' },
  // 6 — the evening
  { id: 'F1', t0: SS.storm, t1: SS.eight2, set: 'garden', mode: 'storm' },
  { id: 'F2', t0: SS.eight2, t1: SS.box, set: 'garden', mode: 'dusk' },
  { id: 'F3', t0: SS.box, t1: SS.walkinto, set: 'garden', mode: 'box' },
  { id: 'F4', t0: SS.walkinto, t1: SS.wait, set: 'garden', mode: 'walkinto' },
  { id: 'F5', t0: SS.wait, t1: SS.midnight, set: 'garden', mode: 'wait' },
  // 7 — the night
  { id: 'G1', t0: SS.midnight, t1: SS.last, set: 'garden', mode: 'night' },
  { id: 'G2', t0: SS.last, t1: SS.real, set: 'garden', mode: 'dawn' },
  // 8 — is any of this real; the question
  { id: 'H1', t0: SS.real, t1: SS.question, set: 'garden', mode: 'real' },
  { id: 'H2', t0: SS.question, t1: 1e9, set: 'garden', mode: 'question' },
];
// every cut, for the 2-frame dip (the shot starts, plus a set's own cuts())
function ssCutTimes(app) {
  const out = SS_SHOTS.map((s) => s.t0).filter((t) => t > 0);
  for (const s of Object.values((app && app.sets) || {})) if (s.cuts) out.push(...s.cuts());
  return out;
}
function ssShotAt(t) { for (const s of SS_SHOTS) if (t >= s.t0 && t < s.t1) return s; return SS_SHOTS[SS_SHOTS.length - 1]; }
