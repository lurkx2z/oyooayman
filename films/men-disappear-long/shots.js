/* =====================================================================
   SHOTS — every shot of the film, in order: { id, mode, t0, t1, set }. Cut points come from the captions (script.js:
   mgS, mgC, mgB, mgE) and the story clock may only jump forward at a cut (the owner's rule of 2026-10-29: no replays).
   Sets: world (the valley: your car, the viaduct, the train, the barge, flight 2207 inside and out, the airport and
   its tower, the town), ward (the hospital's delivery room). Cameras: set.js (world), ward.js.
   ===================================================================== */

const mgSh = (id, mode, t0, t1, set) => ({ id, mode, t0, t1, set });

const MG_SHOTS = [];
{
  const P = MG_SHOTS, c = mgC, B = mgB;
  const L = [
    // 1 — 7:42:00 AM, in slow motion: your car on the viaduct; your dad vanishes; the lorry; the cars all round
    ['A0', 'title', -1, B('start'), 'world'],
    ['A1', 'empty', B('start'), c('start', 1) - 0.5, 'world'],
    ['A2', 'ext1', c('start', 1) - 0.5, B('wheel'), 'world'],
    ['A3', 'cluster', B('wheel'), c('wheel', 1) - 0.5, 'world'],
    ['A4', 'grab', c('wheel', 1) - 0.5, B('brake'), 'world'],
    ['A5', 'hands', B('brake'), c('brake', 1) - 0.5, 'world'],
    ['A6', 'epb', c('brake', 1) - 0.5, B('lorry'), 'world'],
    ['A7', 'lorryPOV', B('lorry'), c('lorry', 1) - 2.5, 'world'],
    ['A8', 'lorryExt', c('lorry', 1) - 2.5, B('cab'), 'world'],
    ['A9', 'cabIn', B('cab'), c('cab', 1) - 0.5, 'world'],
    ['A10', 'cabWide', c('cab', 1) - 0.5, B('stop'), 'world'],
    ['A11', 'stopPOV', B('stop'), B('cars'), 'world'],
    ['A12', 'carsWide', B('cars'), c('cars', 1) - 0.5, 'world'],
    ['A13', 'carsNew', c('cars', 1) - 0.5, c('cars', 2) - 0.5, 'world'],
    ['A14', 'carsOld', c('cars', 2) - 0.5, B('radio'), 'world'],
    // 2 — real speed from here: the radio, his phone; the train, the barge; flight 2207 and its cockpit door
    ['B1', 'radio', B('radio'), c('radio', 1) - 0.5, 'world'],
    ['B2', 'gantry', c('radio', 1) - 0.5, B('phone'), 'world'],
    ['B3', 'phone', B('phone'), B('train'), 'world'],
    ['B4', 'trainHigh', B('train'), c('train', 1) - 0.5, 'world'],
    ['B5', 'trainCab', c('train', 1) - 0.5, B('barge'), 'world'],
    ['B6', 'barge', B('barge'), c('barge', 1) - 0.5, 'world'],
    ['B7', 'bargeHit', c('barge', 1) - 0.5, B('plane'), 'world'],
    ['B8', 'skyUp', B('plane'), c('plane', 1) - 0.5, 'world'],
    ['B9', 'cockpit', c('plane', 1) - 0.5, c('plane', 2) - 0.5, 'world'],
    ['B10', 'planeExt', c('plane', 2) - 0.5, B('world'), 'world'],
    ['B11', 'planeMap', B('world'), c('world', 2) - 0.5, 'world'],
    ['B11b', 'seats', c('world', 2) - 0.5, B('door'), 'world'],   // the two empty seats, their headsets hanging
    ['B12', 'cabinAisle', B('door'), c('door', 1) - 0.5, 'world'],
    ['B13', 'keypad', c('door', 1) - 0.5, c('door', 2) - 0.5, 'world'],
    ['B14', 'cabinPax', c('door', 2) - 0.5, c('door', 3) - 0.5, 'world'],
    ['B15', 'doorWait', c('door', 3) - 0.5, c('door', 3) + 5.6, 'world'],
    ['B16', 'cockpitDoor', c('door', 3) + 5.6, c('alone', 0) + 2.0, 'world'],
    ['B17', 'fuel', c('alone', 0) + 2.0, c('alone', 1) - 0.5, 'world'],
    ['B18', 'cabinHalf', c('alone', 1) - 0.5, B('tower'), 'world'],
    ['B19', 'towerExt', B('tower'), c('tower', 1) - 0.5, 'world'],
    ['B20', 'towerIn', c('tower', 1) - 0.5, B('smoke'), 'world'],
    // 3 — 7:51, 8:04: the town's kitchens burning; the maternity ward
    ['C1', 'town', B('smoke'), c('smoke', 1) - 0.5, 'world'],
    ['C2', 'house', c('smoke', 1) - 0.5, c('smoke', 2) - 0.5, 'world'],
    ['C3', 'townHigh', c('smoke', 2) - 0.5, B('ward'), 'world'],
    ['W0', 'hospital', B('ward'), c('ward', 1) - 0.5, 'world'],
    ['W1', 'wardIn', c('ward', 1) - 0.5, c('ward', 2) - 0.5, 'ward'],
    ['W2', 'birth', c('ward', 2) - 0.5, c('ward', 3) - 0.5, 'ward'],
    ['W3', 'baby', c('ward', 3) - 0.5, c('ward', 4) - 0.5, 'ward'],
    ['W4', 'wardWin', c('ward', 4) - 0.5, B('walk'), 'ward'],
    // 4 — 9:10 to 10:21: walking home; the alert; the planes circling; the autoland; the landing
    ['D1', 'walkDeck', B('walk'), c('walk', 1) - 0.5, 'world'],
    ['D2', 'walkLong', c('walk', 1) - 0.5, c('walk', 2) - 0.5, 'world'],
    ['D3', 'walkPOV', c('walk', 2) - 0.5, B('alert'), 'world'],
    ['D4', 'alertPhone', B('alert'), c('alert', 1) - 0.5, 'world'],
    ['D5', 'alertRead', c('alert', 1) - 0.5, c('alert', 2) - 0.5, 'world'],
    ['D6', 'leaders', c('alert', 2) - 0.5, B('hold'), 'world'],
    ['D7', 'hold', B('hold'), B('many'), 'world'],
    ['D8', 'radar', B('many'), c('many', 1) - 0.5, 'world'],
    ['D9', 'ctl', c('many', 1) - 0.5, c('many', 2) - 0.5, 'world'],
    ['D10', 'stack', c('many', 2) - 0.5, B('autoland'), 'world'],
    ['D11', 'cockpitApp', B('autoland'), c('autoland', 1) - 0.5, 'world'],
    ['D12', 'flaps', c('autoland', 1) - 0.5, c('autoland', 2) - 0.5, 'world'],
    ['D13', 'towerRead', c('autoland', 2) - 0.5, c('autoland', 3) - 0.5, 'world'],
    ['D14', 'land3', c('autoland', 3) - 0.5, B('final'), 'world'],
    ['E1', 'finalVia', B('final'), c('final', 1) + 0.6, 'world'],
    ['E2', 'finalCock', c('final', 1) + 0.6, c('final', 2) - 0.5, 'world'],
    ['E3', 'finalTower', c('final', 2) - 0.5, c('final', 4) - 4.0, 'world'],
    ['E4', 'touchdown', c('final', 4) - 4.0, B('question'), 'world'],
    ['E5', 'question', B('question'), 1e9, 'world'],
  ];
  for (const [id, mode, t0, t1, set] of L) P.push(mgSh(id, mode, t0, t1, set));
  P.forEach((s, i) => { if (i && Math.abs(s.t0 - P[i - 1].t1) > 1e-6) throw new Error(`MG_SHOTS: a gap or overlap before ${s.id}`); if (!(s.t1 > s.t0)) throw new Error(`MG_SHOTS: ${s.id} has no length`); });
  // every clock jump must sit on a cut
  for (const j of MG_JUMPS) if (!P.some((s) => Math.abs(s.t0 - j.t) < 1e-6)) throw new Error(`MG_SHOTS: the clock jumps at t ${j.t.toFixed(2)} without a cut`);
}

function mgShotAt(t) { for (const s of MG_SHOTS) if (t >= s.t0 && t < s.t1) return s; return t < 0 ? MG_SHOTS[0] : MG_SHOTS[MG_SHOTS.length - 1]; }
const mgShot = (mode) => { const A = MG_SHOTS.filter((s) => s.mode === mode); return A.length ? Object.assign({}, A[0], { t1: A[A.length - 1].t1 }) : undefined; };
function mgCutTimes(app) {
  const out = MG_SHOTS.map((s) => s.t0).filter((t) => t > 0);
  for (const s of Object.values((app && app.sets) || {})) if (s.cuts) out.push(...s.cuts());
  return out;
}
SCRIPT.events = MG_SHOTS.map((s) => ({ id: s.id, time: Math.max(0, s.t0), label: s.id + ' ' + s.mode }));
