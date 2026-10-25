/* =====================================================================
   SHOTS — every shot of the film, in order: { id, t0, t1, set, mode }. Sets: home (your hallway, the stairs, the
   bunk-bed room), lab (the three experiments), tower (Tokyo at dawn, an airliner over the clouds), orbit (the Earth,
   the GPS satellites, the Moon), wd (Sirius B), ns (a neutron star), bh (Sagittarius A*: the fall and the platform).
   Mode picks the action and the camera inside a set. Cut points come from script.js (TF), i.e. from the captions.
   ===================================================================== */

const TF_SHOTS = [
  // 1 — the cold open; the title
  { id: 'A0', t0: -1, t1: TF.titleShot, set: 'bh', mode: 'cold' },
  { id: 'A1', t0: TF.titleShot, t1: TF.hall, set: 'home', mode: 'title' },
  // 2 — your hallway
  { id: 'B1', t0: TF.hall, t1: TF.pole, set: 'home', mode: 'hall' },
  { id: 'B2', t0: TF.pole, t1: TF.drift, set: 'home', mode: 'pole' },
  { id: 'B3', t0: TF.drift, t1: TF.yes, set: 'home', mode: 'drift' },
  { id: 'B4', t0: TF.yes, t1: TF.year, set: 'home', mode: 'yes' },
  { id: 'B5', t0: TF.year, t1: TF.cat, set: 'home', mode: 'year' },
  { id: 'B6', t0: TF.cat, t1: TF.lie, set: 'home', mode: 'cat' },
  { id: 'B7', t0: TF.lie, t1: TF.hand, set: 'home', mode: 'lie' },
  { id: 'B8', t0: TF.hand, t1: TF.upstairs, set: 'home', mode: 'hand' },
  { id: 'B9', t0: TF.upstairs, t1: TF.measured, set: 'home', mode: 'upstairs' },
  // 3 — measured
  { id: 'C1', t0: TF.measured, t1: TF.pound, set: 'lab', mode: 'intro' },
  { id: 'C2', t0: TF.pound, t1: TF.planes, set: 'lab', mode: 'pound' },
  { id: 'C3', t0: TF.planes, t1: TF.nist, set: 'tower', mode: 'flight' },
  { id: 'C4', t0: TF.nist, t1: TF.skytree, set: 'lab', mode: 'nist' },
  { id: 'C5', t0: TF.skytree, t1: TF.jila, set: 'tower', mode: 'skytree' },
  { id: 'C6', t0: TF.jila, t1: TF.gps, set: 'lab', mode: 'jila' },
  // 4 — GPS, the Moon
  { id: 'D1', t0: TF.gps, t1: TF.gps2, set: 'orbit', mode: 'gps' },
  { id: 'D2', t0: TF.gps2, t1: TF.gps3, set: 'orbit', mode: 'sat' },
  { id: 'D3', t0: TF.gps3, t1: TF.moon, set: 'orbit', mode: 'signal' },
  { id: 'D4', t0: TF.moon, t1: TF.why, set: 'orbit', mode: 'moon' },
  // 5 — gravity is time
  { id: 'E1', t0: TF.why, t1: TF.maths, set: 'home', mode: 'why' },
  { id: 'E2', t0: TF.maths, t1: TF.pull, set: 'home', mode: 'maths' },
  { id: 'E3', t0: TF.pull, t1: TF.bigger, set: 'home', mode: 'pull' },
  { id: 'E4', t0: TF.bigger, t1: TF.wd, set: 'home', mode: 'bigger' },
  // 6 — Sirius B
  { id: 'F1', t0: TF.wd, t1: TF.wdLand, set: 'wd', mode: 'approach' },
  { id: 'F2', t0: TF.wdLand, t1: TF.wd3, set: 'wd', mode: 'surface' },
  { id: 'F3', t0: TF.wd3, t1: TF.wd4, set: 'wd', mode: 'clocks' },
  { id: 'F4', t0: TF.wd4, t1: TF.ns, set: 'wd', mode: 'stretched' },
  // 7 — a neutron star
  { id: 'G1', t0: TF.ns, t1: TF.nsLand, set: 'ns', mode: 'approach' },
  { id: 'G2', t0: TF.nsLand, t1: TF.ns4, set: 'ns', mode: 'surface' },
  { id: 'G3', t0: TF.ns4, t1: TF.ns5, set: 'ns', mode: 'sky' },
  { id: 'G4', t0: TF.ns5, t1: TF.bh, set: 'ns', mode: 'clocks' },
  // 8 — Sagittarius A*
  { id: 'H1', t0: TF.bh, t1: TF.board, set: 'bh', mode: 'approach' },
  { id: 'H2', t0: TF.board, t1: TF.sphere, set: 'bh', mode: 'board' },
  { id: 'H3', t0: TF.sphere, t1: TF.lower, set: 'bh', mode: 'sphere' },
  { id: 'H4', t0: TF.lower, t1: TF.ten, set: 'bh', mode: 'lower' },
  { id: 'H5', t0: TF.ten, t1: TF.two, set: 'bh', mode: 'floor' },
  { id: 'H6', t0: TF.two, t1: TF.slow, set: 'bh', mode: 'two' },
  { id: 'H7', t0: TF.slow, t1: TF.eleven, set: 'bh', mode: 'toes' },
  { id: 'H8', t0: TF.eleven, t1: TF.day, set: 'bh', mode: 'eleven' },
  { id: 'H9', t0: TF.day, t1: TF.outside, set: 'bh', mode: 'day' },
  { id: 'H10', t0: TF.outside, t1: TF.edge, set: 'bh', mode: 'outside' },
  { id: 'H11', t0: TF.edge, t1: TF.feetView, set: 'bh', mode: 'edge' },
  { id: 'H12', t0: TF.feetView, t1: TF.real, set: 'bh', mode: 'feet' },
  // 9 — is any of this real; home; the question
  { id: 'I1', t0: TF.real, t1: TF.home, set: 'home', mode: 'real' },
  { id: 'I2', t0: TF.home, t1: TF.question, set: 'home', mode: 'home' },
  { id: 'I3', t0: TF.question, t1: 1e9, set: 'home', mode: 'bunk' },
];
// every cut, for the 2-frame dip (the shot starts, plus a set's own cuts())
function tfCutTimes(app) {
  const out = TF_SHOTS.map((s) => s.t0).filter((t) => t > 0);
  for (const s of Object.values((app && app.sets) || {})) if (s.cuts) out.push(...s.cuts());
  return out;
}
function tfShotAt(t) { for (const s of TF_SHOTS) if (t >= s.t0 && t < s.t1) return s; return TF_SHOTS[TF_SHOTS.length - 1]; }
