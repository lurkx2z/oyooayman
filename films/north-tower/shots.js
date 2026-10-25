/* =====================================================================
   SHOTS — every shot of the film, in order: { id, t0, t1, set, mode }. Sets: office (your floor, the 73rd), stair
   (stairway C, and the transfer hallway on 48), lobby (the mezzanine, the escalator, the concourse), street (Vesey
   Street and Church Street, 9:50 to 10:28), memorial (the empty stairway, the numbers, the Tribute in Light, the card).
   Mode picks the action and camera inside a set. Cut points come from script.js (NT), i.e. from the captions.
   ===================================================================== */

const NT_SHOTS = [
  // 1 — floor 73
  { id: 'A1', t0: -1, t1: NT.morning, set: 'office', mode: 'title' },
  { id: 'A2', t0: NT.morning, t1: NT.sky, set: 'office', mode: 'desk' },
  { id: 'A3', t0: NT.sky, t1: NT.tower, set: 'office', mode: 'sky' },
  { id: 'A4', t0: NT.tower, t1: NT.windows, set: 'office', mode: 'tower' },
  { id: 'A5', t0: NT.windows, t1: NT.impactShot, set: 'office', mode: 'down' },
  { id: 'A6', t0: NT.impactShot, t1: NT.after, set: 'office', mode: 'impact' },
  { id: 'A7', t0: NT.after, t1: NT.outside, set: 'office', mode: 'after' },
  { id: 'A8', t0: NT.outside, t1: NT.nobody, set: 'office', mode: 'outside' },
  { id: 'A9', t0: NT.nobody, t1: NT.known, set: 'office', mode: 'nobody' },
  { id: 'A10', t0: NT.known, t1: NT.stair, set: 'office', mode: 'core' },
  // 2 — stairway C
  { id: 'B1', t0: NT.stair, t1: NT.glow, set: 'stair', mode: 'enter' },
  { id: 'B2', t0: NT.glow, t1: NT.pace, set: 'stair', mode: 'glow' },
  { id: 'B3', t0: NT.pace, t1: NT.second, set: 'stair', mode: 'pace' },
  { id: 'B4', t0: NT.second, t1: NT.calm, set: 'stair', mode: 'shake' },
  { id: 'B5', t0: NT.calm, t1: NT.right, set: 'stair', mode: 'calm' },
  { id: 'B6', t0: NT.right, t1: NT.transfer, set: 'stair', mode: 'right' },
  { id: 'B7', t0: NT.transfer, t1: NT.ff, set: 'stair', mode: 'transfer' },
  { id: 'B8', t0: NT.ff, t1: NT.water, set: 'stair', mode: 'ff' },
  { id: 'B9', t0: NT.water, t1: NT.thin, set: 'stair', mode: 'water' },
  { id: 'B10', t0: NT.thin, t1: NT.mezz, set: 'stair', mode: 'thin' },
  // 3 — out
  { id: 'C1', t0: NT.mezz, t1: NT.police, set: 'lobby', mode: 'mezz' },
  { id: 'C2', t0: NT.police, t1: NT.esc, set: 'lobby', mode: 'police' },
  { id: 'C3', t0: NT.esc, t1: NT.conc, set: 'lobby', mode: 'esc' },
  { id: 'C4', t0: NT.conc, t1: NT.five, set: 'lobby', mode: 'conc' },
  { id: 'C5', t0: NT.five, t1: NT.back, set: 'street', mode: 'five' },
  { id: 'C6', t0: NT.back, t1: NT.roarShot, set: 'street', mode: 'back' },
  // 4 — 9:59 and 10:28
  { id: 'D1', t0: NT.roarShot, t1: NT.cloud, set: 'street', mode: 'roar' },
  { id: 'D2', t0: NT.cloud, t1: NT.grey, set: 'street', mode: 'cloud' },
  { id: 'D3', t0: NT.grey, t1: NT.walk, set: 'street', mode: 'grey' },
  { id: 'D4', t0: NT.walk, t1: NT.fallShot, set: 'street', mode: 'walk' },
  { id: 'D5', t0: NT.fallShot, t1: NT.out, set: 'street', mode: 'fall' },
  // 5 — remembrance
  { id: 'E1', t0: NT.out, t1: NT.cost, set: 'stair', mode: 'empty' },
  { id: 'E2', t0: NT.cost, t1: NT.light, set: 'memorial', mode: 'dark' },
  { id: 'E3', t0: NT.light, t1: 1e9, set: 'memorial', mode: 'light' },
];
// every cut, for the 2-frame dip (the shot starts, plus a set's own cuts()); none into the cloud or the dark
function ntCutTimes(app) {
  const soft = [NT.cloud, NT.grey, NT.out, NT.cost, NT.light];
  const out = NT_SHOTS.map((s) => s.t0).filter((t) => t > 0 && !soft.some((x) => Math.abs(t - x) < 0.01));
  for (const s of Object.values((app && app.sets) || {})) if (s.cuts) out.push(...s.cuts());
  return out;
}
function ntShotAt(t) { for (const s of NT_SHOTS) if (t >= s.t0 && t < s.t1) return s; return NT_SHOTS[NT_SHOTS.length - 1]; }
