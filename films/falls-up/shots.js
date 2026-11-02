/* =====================================================================
   SHOTS — every shot of the film, in order: { id, mode, t0, t1, set }. Cut points come from the captions (script.js:
   fuS, fuC, fuB, fuE) and land where the story clock may jump (it only jumps forward, at a cut: the owner's rule of
   2026-10-29). Each new angle moves the ten minutes on.
   ===================================================================== */

const fuSh = (id, mode, t0, t1, o = {}) => Object.assign({ id, mode, t0, t1, set: 'world' }, o);

const FU_SHOTS = [];
{
  const P = FU_SHOTS, c = fuC, B = fuB, cap = fuCap, tCount = c('count', 0), at = fuFilmAt;
  const L = [
    // 1 — your kitchen, 3:00–3:02: the glass, the spoon and the grape, the tap, the window, the tea, the cat; the apple;
    // the street
    ['A0', 'title', -1, cap('start', 0).show + 0.4],
    ['A1', 'ceiling', cap('start', 0).show + 0.4, c('start', 1) - 0.5],
    ['A1b', 'tap', c('start', 1) - 0.5, B('rate')],
    ['A2', 'sg', B('rate'), c('rate', 1) + 1.5],
    ['A2b', 'sg', c('rate', 1) + 1.5, B('real'), { cam: 'close' }],                // up close: the two of them, side by side on the ceiling
    ['A3', 'window', B('real'), c('real', 1) - 0.4],
    ['A3b', 'window', c('real', 1) - 0.4, B('kettle'), { cam: 'tree' }],          // the plane tree across the road, losing its leaves upwards
    ['A4', 'kettle', B('kettle'), c('kettle', 2) - 0.5],
    ['A5', 'puddle', c('kettle', 2) - 0.5, B('cat')],
    ['A6', 'cat', B('cat'), at(FU.sCat + 0.3)],
    ['A6b', 'cat', at(FU.sCat + 0.3), B('stuck'), { cam: 'land' }],                 // (a cut mid-air: under the ceiling, upside down)
    ['A7', 'stuck', B('stuck'), B('apple')],
    ['A8', 'apple', B('apple'), c('apple', 1) - 0.5],
    ['A9', 'appleUp', c('apple', 1) - 0.5, B('street')],
    ['A10', 'street', B('street'), at(FU.sKeys - 0.7)],
    ['A10b', 'street', at(FU.sKeys - 0.7), at(FU.sCoffee - 0.5), { cam: 'keys' }],
    ['A10c', 'street', at(FU.sCoffee - 0.5), at(FU.sPhone - 0.7), { cam: 'coffee' }],
    ['A10d', 'street', at(FU.sPhone - 0.7), B('leaves'), { cam: 'phone' }],
    // 2 — the park, 3:03–3:07: leaves, the fountain, a fish, a ball, ice cream; walking and running; the runner in the
    // tree; the coat; the dog; the pigeons; the sky; the planes; everyone holding on
    ['B0', 'leaves', B('leaves'), c('leaves', 1) - 0.5],
    ['B0b', 'leaves', c('leaves', 1) - 0.5, B('fountain'), { cam: 'close' }],     // in the crown: leaves letting go, past the lens
    ['B1', 'fountain', B('fountain'), c('fountain', 1) - 0.5],
    ['B1b', 'fountain', c('fountain', 1) - 0.5, B('fish'), { cam: 'up' }],        // from the jet, straight up the column
    ['B2', 'fish', B('fish'), at(FU.sFish + 1.7)],
    ['B2b', 'fish', at(FU.sFish + 1.7), B('ball'), { cam: 'chase' }],                 // riding up beside the carp
    ['B3', 'ball', B('ball'), at(FU.sKick + 1.0)],
    ['B3b', 'ball', at(FU.sKick + 1.0), B('scoop'), { cam: 'chase' }],
    ['B4', 'scoop', B('scoop'), B('walk')],
    ['B5', 'walk', B('walk'), B('jogger')],
    ['B6', 'jogger', B('jogger'), B('hold')],
    ['B7', 'hold', B('hold'), c('hold', 1) - 0.4],
    ['B7b', 'hold', c('hold', 1) - 0.4, c('hold', 2) - 0.4, { cam: 'hands' }],      // her hands on the branch
    ['B7c', 'hold', c('hold', 2) - 0.4, B('rope'), { cam: 'above' }],              // above her: the safe ground she can't reach
    ['B8', 'rope', B('rope'), B('dog')],
    ['B9', 'dog', B('dog'), B('pigeons')],
    ['B10', 'pigeons', B('pigeons'), B('height')],
    ['B11', 'height', B('height'), B('planes'), { set: 'space' }],
    ['B12', 'planes', B('planes'), B('warn'), { set: 'space' }],
    ['B13', 'warn', B('warn'), c('warn', 1) - 0.4],
    ['B13b', 'warn', c('warn', 1) - 0.4, B('home'), { cam: 'post' }],             // an old man holding on to a lamp post
    // 3 — 3:08–3:10 and after: your ceiling; still holding on; the apple in space; the count; the ceiling comes down;
    // everything that went up is coming back
    ['C0', 'home', B('home'), B('hold2')],
    ['C1', 'hold2', B('hold2'), B('space')],
    ['C2', 'space', B('space'), B('count'), { set: 'space' }],
    ['C3', 'count', B('count'), tCount + 2.6],
    ['C3b', 'count', tCount + 2.6, tCount + 5.0, { cam: 'hands' }],
    ['C3c', 'count', tCount + 5.0, tCount + 7.4, { cam: 'crowd' }],
    ['C3d', 'count', tCount + 7.4, tCount + 9.75, { cam: 'ceil', where: 'in' }],   // your kitchen: you, under it
    ['C4', 'drop', tCount + 9.75, B('down')],
    ['C5', 'down', B('down'), B('question', 0.45)],
    ['C6', 'question', B('question', 0.45), 1e9],
  ];
  for (const [id, mode, t0, t1, o] of L) P.push(fuSh(id, mode, t0, t1, o || {}));
  P.forEach((s, i) => { if (i && Math.abs(s.t0 - P[i - 1].t1) > 1e-6) throw new Error(`FU_SHOTS: a gap or overlap before ${s.id}`); if (!(s.t1 > s.t0)) throw new Error(`FU_SHOTS: ${s.id} has no length`); });
  // every clock jump must sit on a cut
  for (const j of FU_JUMPS) if (!P.some((s) => Math.abs(s.t0 - j.t) < 1e-6)) throw new Error(`FU_SHOTS: the clock jumps at t ${j.t.toFixed(2)} without a cut`);
}

function fuShotAt(t) { for (const s of FU_SHOTS) if (t >= s.t0 && t < s.t1) return s; return t < 0 ? FU_SHOTS[0] : FU_SHOTS[FU_SHOTS.length - 1]; }
// a mode's whole span (a beat may be cut into several shots of one mode, one after another: { …the first, t1: the last's end })
const fuShot = (mode) => { const A = FU_SHOTS.filter((s) => s.mode === mode); return A.length ? Object.assign({}, A[0], { t1: A[A.length - 1].t1 }) : undefined; };
// every cut, for the 2-frame dip (the shot starts, plus a set's own cuts())
function fuCutTimes(app) {
  const out = FU_SHOTS.map((s) => s.t0).filter((t) => t > 0);
  for (const s of Object.values((app && app.sets) || {})) if (s.cuts) out.push(...s.cuts());
  return out;
}
// the events for the dev scrubber
SCRIPT.events = FU_SHOTS.map((s) => ({ id: s.id, time: Math.max(0, s.t0), label: s.id + ' ' + s.mode }));
