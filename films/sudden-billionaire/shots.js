/* =====================================================================
   SHOTS — every shot of the film, in order: { id, t0, t1, set, mode }. Sets: car (your car: the crossing at night
   and by day), flat (your old flat: the draw, the money, the phone; also Chuck Feeney's rented flat), house (the
   glass house: the hall, the kitchen, the terrace, the TV, the gate, the garage), street (your old street, downtown,
   a Dutch street), lab (the boardroom and the studies), sea (the marina). Mode picks the action and the camera inside
   a set. Cut points come from script.js (SB), i.e. from the captions.
   ===================================================================== */

const SB_SHOTS = [
  // 1 — ten years from now; the title
  { id: 'A0', t0: -1, t1: SB.titleShot, set: 'car', mode: 'cold' },
  { id: 'A1', t0: SB.titleShot, t1: SB.flat, set: 'flat', mode: 'title' },
  // 2 — your flat, the draw, a billion
  { id: 'B1', t0: SB.flat, t1: SB.draw, set: 'flat', mode: 'flat' },
  { id: 'B2', t0: SB.draw, t1: SB.balls, set: 'flat', mode: 'draw' },
  { id: 'B3', t0: SB.balls, t1: SB.won, set: 'flat', mode: 'balls' },
  { id: 'B4', t0: SB.won, t1: SB.scale, set: 'flat', mode: 'won' },
  { id: 'B5', t0: SB.scale, t1: SB.promise, set: 'flat', mode: 'scale' },
  { id: 'B6', t0: SB.promise, t1: SB.mum, set: 'flat', mode: 'promise' },
  // 3 — day one; day three
  { id: 'C1', t0: SB.mum, t1: SB.dunn, set: 'flat', mode: 'mum' },
  { id: 'C2', t0: SB.dunn, t1: SB.out, set: 'lab', mode: 'dunn' },
  { id: 'C3', t0: SB.out, t1: SB.who, set: 'flat', mode: 'out' },
  { id: 'C4', t0: SB.who, t1: SB.trust, set: 'flat', mode: 'who' },
  { id: 'C5', t0: SB.trust, t1: SB.interest, set: 'flat', mode: 'trust' },
  { id: 'C6', t0: SB.interest, t1: SB.house, set: 'flat', mode: 'interest' },
  // 4 — the house; your old street; month six; month nine
  { id: 'D1', t0: SB.house, t1: SB.garage, set: 'house', mode: 'house' },
  { id: 'D2', t0: SB.garage, t1: SB.neighbours, set: 'house', mode: 'garage' },
  { id: 'D3', t0: SB.neighbours, t1: SB.six, set: 'street', mode: 'old' },
  { id: 'D4', t0: SB.six, t1: SB.brick, set: 'house', mode: 'six' },
  { id: 'D5', t0: SB.brick, t1: SB.enough, set: 'house', mode: 'brick' },
  { id: 'D6', t0: SB.enough, t1: SB.compare, set: 'house', mode: 'enough' },
  { id: 'D7', t0: SB.compare, t1: SB.boss, set: 'house', mode: 'compare' },
  // 5 — power
  { id: 'E1', t0: SB.boss, t1: SB.cookies, set: 'lab', mode: 'boss' },
  { id: 'E2', t0: SB.cookies, t1: SB.cookie2, set: 'lab', mode: 'cookies' },
  { id: 'E3', t0: SB.cookie2, t1: SB.game, set: 'lab', mode: 'cookie2' },
  { id: 'E4', t0: SB.game, t1: SB.game2, set: 'lab', mode: 'game' },
  { id: 'E5', t0: SB.game2, t1: SB.candy, set: 'lab', mode: 'game2' },
  { id: 'E6', t0: SB.candy, t1: SB.views, set: 'lab', mode: 'candy' },
  { id: 'E7', t0: SB.views, t1: SB.yacht, set: 'house', mode: 'views' },
  // 6 — year two
  { id: 'F1', t0: SB.yacht, t1: SB.wall, set: 'sea', mode: 'yacht' },
  { id: 'F2', t0: SB.wall, t1: SB.walk, set: 'house', mode: 'wall' },
  // 7 — year three
  { id: 'G1', t0: SB.walk, t1: SB.glass, set: 'street', mode: 'walk' },
  { id: 'G2', t0: SB.glass, t1: SB.glass2, set: 'street', mode: 'glass' },
  { id: 'G3', t0: SB.glass2, t1: SB.drive, set: 'street', mode: 'glass2' },
  { id: 'G4', t0: SB.drive, t1: SB.nostop, set: 'car', mode: 'drive' },
  { id: 'G5', t0: SB.nostop, t1: SB.years, set: 'car', mode: 'nostop' },
  // 8 — years five to nine; the note; the Giving Pledge
  { id: 'H1', t0: SB.years, t1: SB.note, set: 'house', mode: 'years' },
  { id: 'H2', t0: SB.note, t1: SB.pledge, set: 'house', mode: 'note' },
  { id: 'H3', t0: SB.pledge, t1: SB.real, set: 'house', mode: 'pledge' },
  // 9 — is any of this real
  { id: 'I1', t0: SB.real, t1: SB.letters, set: 'lab', mode: 'real' },
  { id: 'I2', t0: SB.letters, t1: SB.scott, set: 'street', mode: 'letters' },
  { id: 'I3', t0: SB.scott, t1: SB.feeney, set: 'lab', mode: 'scott' },
  { id: 'I4', t0: SB.feeney, t1: SB.point, set: 'flat', mode: 'feeney' },
  // 10 — the crossing again; the question
  { id: 'J1', t0: SB.point, t1: SB.again, set: 'car', mode: 'point' },
  { id: 'J2', t0: SB.again, t1: SB.question, set: 'car', mode: 'again' },
  { id: 'J3', t0: SB.question, t1: 1e9, set: 'car', mode: 'question' },
];
// every cut, for the 2-frame dip (the shot starts, plus a set's own cuts())
function sbCutTimes(app) {
  const out = SB_SHOTS.map((s) => s.t0).filter((t) => t > 0);
  for (const s of Object.values((app && app.sets) || {})) if (s.cuts) out.push(...s.cuts());
  return out;
}
function sbShotAt(t) { for (const s of SB_SHOTS) if (t >= s.t0 && t < s.t1) return s; return SB_SHOTS[SB_SHOTS.length - 1]; }
