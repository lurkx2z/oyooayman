/* =====================================================================
   SHOTS — every shot of the film, in order: { id, mode, t0, t1, set }. Cut points come from the captions (script.js:
   esS, esC, esB, esE) and the story clock may only jump forward at a cut (the owner's rule of 2026-10-29: no replays).
   Sets: coast (the harbour, the station, the town, the line, the hill), sky (an airliner at 10 km).
   ===================================================================== */

const esSh = (id, mode, t0, t1, set) => ({ id, mode, t0, t1, set });

const ES_SHOTS = [];
{
  const P = ES_SHOTS, c = esC, B = esB;
  const L = [
    // 1 — 5:41:57 PM on platform 1. At 5:42:00.000 the ground stops turning: everything else slides east past the camera
    ['A0', 'title', -1, c('start', 0) + 1.4],
    ['A1', 'lurch', c('start', 0) + 1.4, B('speed')],                  // the whole station gliding off its floor
    ['S1', 'globe', B('speed'), c('speed', 1) - 0.5],                  // from high up: the harbour, the town, the line, the hill
    ['S2', 'glide', c('speed', 1) - 0.5, c('speed', 2) - 0.5],         // travelling with it: nothing looks wrong but the ground
    ['S3', 'sun', c('speed', 2) - 0.5, B('bolts')],
    ['B1', 'bolt', B('bolts'), c('bolts', 1) - 0.5],                   // a base plate, its four bolts sheared
    ['B2', 'feet', c('bolts', 1) - 0.5, c('bolts', 2) - 0.8],          // the column feet, skating
    ['B3', 'floor', c('bolts', 2) - 0.8, B('town')],                   // the building, off its floor
    ['T1', 'town', B('town'), c('town', 1) - 0.6],
    ['T2', 'townAir', c('town', 1) - 0.6, B('people')],
    ['P1', 'people', B('people'), c('people', 2) - 0.6],
    ['P2', 'platEnd', c('people', 2) - 0.6, c('people', 3) - 0.8],
    ['P3', 'pigeons', c('people', 3) - 0.8, B('train')],
    // your train
    ['R1', 'wheels', B('train'), c('train', 1) - 0.5],
    ['R2', 'inside', c('train', 1) - 0.5, c('train', 3) - 0.5],
    ['R3', 'pass', c('train', 3) - 0.5, B('energy')],
    ['E1', 'energy', B('energy'), c('energy', 2) - 0.5],
    ['E2', 'ahead', c('energy', 2) - 0.5, B('hill')],
    // the hill: the anvil
    ['H1', 'hill', B('hill'), c('hill', 2) - 0.8],
    ['H2', 'palms', c('hill', 2) - 0.8, B('depot')],
    ['D1', 'wagons', B('depot'), c('depot', 2) - 1.4],
    ['D2', 'impact', c('depot', 2) - 1.4, B('wind')],
    ['W1', 'wind', B('wind'), c('wind', 1) - 0.5],
    ['W2', 'heat', c('wind', 1) - 0.5, c('wind', 2) - 0.6],
    ['W3', 'over', c('wind', 2) - 0.6, B('sea')],
    // the sea
    ['Q1', 'sea', B('sea'), c('sea', 2) - 0.6],
    ['Q2', 'quay', c('sea', 2) - 0.6, c('sea', 4) - 0.7],
    ['Q3', 'ferry', c('sea', 4) - 0.7, B('up')],
    ['U1', 'up', B('up'), c('up', 1) - 0.8],
    ['U2', 'shores', c('up', 1) - 0.8, B('fall')],
    // what a second is not long enough for
    ['F1', 'roof', B('fall'), c('fall', 2) - 0.8],
    ['F2', 'woman', c('fall', 2) - 0.8, B('sky')],
    ['K1', 'sky', B('sky'), B('count'), 'sky'],
    // the last 0.14 s; 2 — 5:42:01: the ground turns again
    ['C1', 'count', B('count'), c('count', 1) - 0.5],
    ['C2', 'cab', c('count', 1) - 0.5, c('back', 1) - 0.5],
    ['Z1', 'still', c('back', 1) - 0.5, c('back', 2) - 0.6],
    ['Z2', 'short', c('back', 2) - 0.6, c('back', 3) - 0.6],
    ['Z3', 'roofDown', c('back', 3) - 0.6, B('twist')],
    // 3 — everything the ground stopped is thrown west
    ['V1', 'twist', B('twist'), c('twist', 2) - 0.6],
    ['V2', 'twistSea', c('twist', 2) - 0.6, B('second')],
    ['X1', 'second', B('second'), c('second', 1) - 0.5],
    ['X2', 'reach', c('second', 1) - 0.5, B('question')],
    ['G1', 'question', B('question'), 1e9],
  ];
  for (const [id, mode, t0, t1, set] of L) P.push(esSh(id, mode, t0, t1, set || 'coast'));
  P.forEach((s, i) => { if (i && Math.abs(s.t0 - P[i - 1].t1) > 1e-6) throw new Error(`ES_SHOTS: a gap or overlap before ${s.id}`); if (!(s.t1 > s.t0)) throw new Error(`ES_SHOTS: ${s.id} has no length`); });
  // every clock jump must sit on a cut
  for (const j of ES_JUMPS) if (!P.some((s) => Math.abs(s.t0 - j.t) < 1e-6)) throw new Error(`ES_SHOTS: the clock jumps at t ${j.t.toFixed(2)} without a cut`);
}

function esShotAt(t) { for (const s of ES_SHOTS) if (t >= s.t0 && t < s.t1) return s; return t < 0 ? ES_SHOTS[0] : ES_SHOTS[ES_SHOTS.length - 1]; }
const esShot = (mode) => { const A = ES_SHOTS.filter((s) => s.mode === mode); return A.length ? Object.assign({}, A[0], { t1: A[A.length - 1].t1 }) : undefined; };
function esCutTimes(app) {
  const out = ES_SHOTS.map((s) => s.t0).filter((t) => t > 0);
  for (const s of Object.values((app && app.sets) || {})) if (s.cuts) out.push(...s.cuts());
  return out;
}
SCRIPT.events = ES_SHOTS.map((s) => ({ id: s.id, time: Math.max(0, s.t0), label: s.id + ' ' + s.mode }));
