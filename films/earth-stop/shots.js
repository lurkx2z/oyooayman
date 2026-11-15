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
    // 1 — 5:41:58 PM on platform 1. At 5:42:00.000 the ground stops turning: everything else slides east past the camera
    ['A0', 'title', -1, B('first')],
    ['A1', 'first', B('first'), c('first', 1) - 0.8],                  // the hill east of town: a house reaches its rock
    ['A2', 'firstB', c('first', 1) - 0.8, B('speed')],                 // along its rock face: palm after palm arrives
    ['S2', 'glide', B('speed'), c('speed', 1) - 0.6],                  // travelling with the station: nothing looks wrong but the ground
    ['S3', 'sun', c('speed', 1) - 0.6, B('bolts')],
    ['B1', 'bolt', B('bolts'), c('bolts', 1) - 0.5],                   // a base plate, its four bolts sheared
    ['B3', 'floor', c('bolts', 1) - 0.5, B('town')],                   // the building, off its floor
    ['T1', 'town', B('town'), c('town', 1) - 0.6],
    ['T3', 'cars', c('town', 1) - 0.6, B('people')],                   // the car park behind the station
    ['P1', 'people', B('people'), c('people', 1) - 0.6],
    ['P2', 'platEnd', c('people', 1) - 0.6, c('people', 2) - 0.6],
    ['P3', 'fly', c('people', 2) - 0.6, B('train')],                   // past the platform's end, toppling
    // your train
    ['R1', 'wheels', B('train'), c('train', 1) - 0.5],
    ['R2', 'inside', c('train', 1) - 0.5, c('train', 2) - 0.5],
    ['R3', 'pass', c('train', 2) - 0.5, B('energy')],
    ['E1', 'energy', B('energy'), c('energy', 1) - 0.5],
    ['E2', 'ahead', c('energy', 1) - 0.5, B('hill')],
    // the hill: the anvil
    ['H1', 'hill', B('hill'), c('hill', 1) - 1.4],                     // a house on the road under it gets there
    ['H2', 'shed', c('hill', 1) - 1.4, B('depot')],                    // the depot's shed reaches the rock
    ['D1', 'siding', B('depot'), esCap('depot', 0).hide + 0.3],        // travelling with the six wagons
    ['D1b', 'wagons', esCap('depot', 0).hide + 0.3, c('depot', 1) - 1.4],   // from the rock: they are coming
    ['D2', 'impact', c('depot', 1) - 1.4, c('depot', 1) + 2.1],        // the first wagon
    ['D3', 'impact2', c('depot', 1) + 2.1, B('wind')],                 // the second, from the line
    ['W1', 'heat', B('wind'), c('wind', 1) - 0.5],                     // the third, from the foot of the rock
    ['W2', 'wind', c('wind', 1) - 0.5, c('wind', 2) - 0.6],            // the fourth, from the north
    ['W3', 'over', c('wind', 2) - 0.6, B('sea')],                      // from the air: over the top
    // the sea
    ['Q1', 'quay', B('sea'), c('sea', 2) - 0.7],                       // the wall of water in profile, to its top
    ['Q2', 'foot', c('sea', 2) - 0.7, c('sea', 3) - 0.6],              // along the foot of it, to the ferry
    ['Q3', 'ferry', c('sea', 3) - 0.6, B('up')],
    ['U1', 'up', B('up'), B('fall')],
    // what a second is not long enough for
    ['F1', 'roof', B('fall'), c('fall', 1) - 0.8],
    ['F2', 'woman', c('fall', 1) - 0.8, B('sky')],
    ['K1', 'sky', B('sky'), B('count'), 'sky'],
    // the last 0.15 s; 2 — 5:42:01: the ground turns again
    ['C1', 'count', B('count'), c('count', 1) - 0.5],
    ['C1b', 'mouth', c('count', 1) - 0.5, c('count', 2) - 0.6],        // from the tunnel's mouth: your train, head-on
    ['C2', 'cab', c('count', 2) - 0.6, c('back', 0) + 1.6],            // the driver's view: the rush, then 5:42:01
    ['Z1', 'still', c('back', 0) + 1.6, c('back', 1) + 1.5],
    ['Z1b', 'grip', c('back', 1) + 1.5, c('back', 2) - 0.6],
    ['Z2', 'short', c('back', 2) - 0.6, B('twist')],
    // 3 — the hill leaves behind everything it stopped
    ['V1', 'twist', B('twist'), c('twist', 1) - 0.6],
    ['V2', 'sweep', c('twist', 1) - 0.6, c('twist', 2) - 0.5],         // the ground carries you into it
    ['X2', 'reach', c('twist', 2) - 0.5, B('question')],
    ['G1', 'question', B('question'), 1e9],                            // your seat: it arrives; white; black
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
