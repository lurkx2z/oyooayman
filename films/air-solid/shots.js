/* =====================================================================
   SHOTS — every shot of the film, in order: { id, mode, t0, t1, set }. Cut points come from the captions (script.js:
   saS, saC, saB, saE) and land where the story clock may jump (it only jumps forward, at a cut: the owner's rule of
   2026-10-29). While the air is solid the clock crawls (three seconds over three and a half minutes), so every new angle
   is a few thousandths of a second later than the last.
   ===================================================================== */

const saSh = (id, mode, t0, t1, o = {}) => Object.assign({ id, mode, t0, t1, set: 'world' }, o);

const SA_SHOTS = [];
{
  const P = SA_SHOTS, c = saC, B = saB, at = saFilmAt;
  const L = [
    // 1 — your kitchen, 2:00:00: the pour, the cat, the lock; held
    ['A0', 'title', -1, B('start')],
    ['A1', 'start', B('start'), B('stop')],
    ['A2', 'stop', B('stop'), c('stop', 1) - 0.5],
    ['A2b', 'stopW', c('stop', 1) - 0.5, c('stop', 2) - 0.5],
    ['A2c', 'stopC', c('stop', 2) - 0.5, B('you')],
    ['A3', 'you', B('you'), B('real')],
    ['A4', 'real', B('real'), B('silence')],
    ['A5', 'silence', B('silence'), B('steam')],
    ['A6', 'steam', B('steam'), c('steam', 1) - 0.5],
    ['A6b', 'dust', c('steam', 1) - 0.5, B('clock')],
    ['A7', 'clock', B('clock'), B('catfine')],
    ['A8', 'catfine', B('catfine'), B('window')],
    // 2 — outside: the street, the park, the main road
    ['B0', 'window', B('window'), B('pigeon')],
    ['B1', 'pigeon', B('pigeon'), B('walkers')],
    ['B2', 'walkers', B('walkers'), B('cyclist')],
    ['B3', 'cyclist', B('cyclist'), B('car')],
    ['B4', 'car', B('car'), B('leaves')],
    ['B5', 'leaves', B('leaves'), B('fountain')],
    ['B6', 'fountain', B('fountain'), c('fountain', 1) - 0.5],
    ['B6b', 'carp', c('fountain', 1) - 0.5, B('jumper')],
    ['B7', 'jumper', B('jumper'), B('swing')],
    ['B8', 'swing', B('swing'), B('ball')],
    ['B9', 'ball', B('ball'), B('dog')],
    ['B10', 'dog', B('dog'), B('flock')],
    ['B11', 'flock', B('flock'), B('runner')],
    ['B12', 'runner', B('runner'), B('wind')],
    ['B13', 'wind', B('wind'), c('wind', 1) - 0.5],
    ['B13b', 'windUp', c('wind', 1) - 0.5, B('road')],
    ['B14', 'road', B('road'), c('road', 2) - 0.5],
    ['B14b', 'motorway', c('road', 2) - 0.5, B('count')],
    // 3 — the last second; 2:00:03; from rest; after
    ['C0', 'countA', B('count'), B('count') + 4.6],
    ['C0b', 'countB', B('count') + 4.6, SA.tRel],
    ['C1', 'release', SA.tRel, B('fall')],
    ['C2', 'fallA', B('fall'), at(3.98)],
    ['C2b', 'fallRun', at(3.98), at(4.86)],
    ['C2c', 'fallBike', at(4.86), at(5.92)],
    ['C2d', 'fallSwing', at(5.92), B('echo')],
    ['C3', 'echo', B('echo'), B('fine')],
    ['C4', 'fineA', B('fine'), c('fine', 1) - 0.5],
    ['C4b', 'fineB', c('fine', 1) - 0.5, B('stalled')],
    ['C5', 'stallA', B('stalled'), c('stalled', 1) - 0.5],
    ['C5b', 'stallB', c('stalled', 1) - 0.5, B('sirens')],
    ['C6', 'sirens', B('sirens'), B('still')],
    ['C7', 'stillA', B('still'), c('still', 1) - 0.5],
    ['C7b', 'stillB', c('still', 1) - 0.5, B('planes')],
    ['C8', 'planes', B('planes'), B('question')],
    ['C9', 'question', B('question'), 1e9],
  ];
  for (const [id, mode, t0, t1, o] of L) P.push(saSh(id, mode, t0, t1, o || {}));
  P.forEach((s, i) => { if (i && Math.abs(s.t0 - P[i - 1].t1) > 1e-6) throw new Error(`SA_SHOTS: a gap or overlap before ${s.id}`); if (!(s.t1 > s.t0)) throw new Error(`SA_SHOTS: ${s.id} has no length`); });
  // every clock jump must sit on a cut
  for (const j of SA_JUMPS) if (!P.some((s) => Math.abs(s.t0 - j.t) < 1e-6)) throw new Error(`SA_SHOTS: the clock jumps at t ${j.t.toFixed(2)} without a cut`);
}

function saShotAt(t) { for (const s of SA_SHOTS) if (t >= s.t0 && t < s.t1) return s; return t < 0 ? SA_SHOTS[0] : SA_SHOTS[SA_SHOTS.length - 1]; }
// a mode's whole span (a beat may be cut into several shots of one mode, one after another: { …the first, t1: the last's end })
const saShot = (mode) => { const A = SA_SHOTS.filter((s) => s.mode === mode); return A.length ? Object.assign({}, A[0], { t1: A[A.length - 1].t1 }) : undefined; };
// every cut, for the 2-frame dip (the shot starts, plus a set's own cuts())
function saCutTimes(app) {
  const out = SA_SHOTS.map((s) => s.t0).filter((t) => t > 0);
  for (const s of Object.values((app && app.sets) || {})) if (s.cuts) out.push(...s.cuts());
  return out;
}
// the events for the dev scrubber
SCRIPT.events = SA_SHOTS.map((s) => ({ id: s.id, time: Math.max(0, s.t0), label: s.id + ' ' + s.mode }));
