/* =====================================================================
   SHOTS — every shot of the film, in order: { id, mode, t0, t1, set }. Cut points come from the captions (script.js:
   nbS, nbC, nbB, nbE) and the story clock may only jump forward at a cut (the owner's rule of 2026-10-29: no replays).
   Sets: fair (the funfair, its sky, the valley, the motorway, the airport), space (the view from the space station).
   ===================================================================== */

const nbSh = (id, mode, t0, t1, set) => ({ id, mode, t0, t1, set });

const NB_SHOTS = [];
{
  const P = NB_SHOTS, c = nbC, B = nbB;
  const L = [
    // 1 — 3:29:57 PM: you, close up in the Fun House's wavy mirror (and something coming up behind you); at 3:30:00 light
    // stops bouncing (26× slower from here, 39× from the sky, 3× for the last three seconds)
    ['A0', 'title', -1, c('start', 0) + 1.8, 'fair'],
    ['A1', 'wide', c('start', 0) + 1.8, c('start', 2) - 0.5, 'fair'],
    ['A1b', 'stalls', c('start', 2) - 0.5, B('moon'), 'fair'],
    // the Moon (its light is 1.24 s old: it goes out at 3:30:01.24), the sky, the Sun
    ['M1', 'moon', B('moon'), c('moon', 1) - 0.5, 'fair'],
    ['M2', 'moongone', c('moon', 1) - 0.5, B('sky'), 'fair'],
    ['K1', 'sky', B('sky'), B('sun'), 'fair'],
    ['K2', 'sun', B('sun'), B('sources'), 'fair'],
    ['K3', 'sources', B('sources'), B('hands'), 'fair'],
    // you: your hands; the one impossible thing; the crowd you can't see; something passes
    ['Y1', 'hands', B('hands'), B('real'), 'fair'],
    ['Y2', 'real', B('real'), B('crowd'), 'fair'],
    ['Y3', 'crowd', B('crowd'), B('near'), 'fair'],
    ['Y4', 'near', B('near'), B('road'), 'fair'],
    // the motorway in the valley
    ['R1', 'valley', B('road'), c('road', 1) - 0.5, 'fair'],
    ['R2', 'driver', c('road', 1) - 0.5, c('road', 3) - 0.5, 'fair'],
    ['R3', 'verge', c('road', 3) - 0.5, B('plane'), 'fair'],
    // the airport: a plane on final approach
    ['P1', 'planeHill', B('plane'), c('plane', 1) - 0.5, 'fair'],
    ['P2', 'approach', c('plane', 1) - 0.5, c('plane', 2) - 0.5, 'fair'],
    ['P3', 'tower', c('plane', 2) - 0.5, B('still'), 'fair'],
    // back to you: the shape in front of the lights is still there
    ['Y5', 'still', B('still'), B('coaster'), 'fair'],
    // the rides
    ['C1', 'coaster', B('coaster'), c('coaster', 1) - 0.5, 'fair'],
    ['C2', 'coasterPOV', c('coaster', 1) - 0.5, B('fire'), 'fair'],
    ['F1', 'fire', B('fire'), c('fire', 1) - 0.5, 'fair'],
    ['F2', 'fireClose', c('fire', 1) - 0.5, B('net'), 'fair'],
    // the internet; space
    ['N1', 'phoneNet', B('net'), c('net', 1) - 0.5, 'fair'],
    ['N2', 'netWide', c('net', 1) - 0.5, B('space'), 'fair'],
    ['X1', 'space', B('space'), B('closer'), 'space'],
    // back to you: it's closer (and you can hear it)
    ['Y6', 'closer', B('closer'), B('heat'), 'fair'],
    // the heat; Saturn (the open loop: 4:42 PM); your pupils; the count
    ['H1', 'heat', B('heat'), B('saturn'), 'fair'],
    ['S1', 'saturn', B('saturn'), B('pupils'), 'fair'],
    ['U1', 'pupils', B('pupils'), c('pupils', 1) - 0.5, 'fair'],
    ['U2', 'sunWarn', c('pupils', 1) - 0.5, B('count'), 'fair'],
    ['Z1', 'count', B('count'), c('back', 0) - 0.6, 'fair'],
    // 2 — 3:30:10 PM: light bounces again (the cut is hidden in the white-out)
    ['Z2', 'reveal', c('back', 0) - 0.6, B('moonback'), 'fair'],
    ['Z3', 'moonback', B('moonback'), B('crash'), 'fair'],
    ['Z4', 'crash', B('crash'), B('after'), 'fair'],
    // +2 min
    ['G1', 'after', B('after'), c('after', 1) - 0.5, 'fair'],
    ['G2', 'afterWide', c('after', 1) - 0.5, B('echo'), 'fair'],
    // 3 — 4:42 PM: Saturn's light from 3:30 should arrive now
    ['E1', 'echo', B('echo'), c('echo', 1) - 0.5, 'fair'],
    ['E2', 'echoSat', c('echo', 1) - 0.5, 1e9, 'fair'],
  ];
  for (const [id, mode, t0, t1, set] of L) P.push(nbSh(id, mode, t0, t1, set));
  P.forEach((s, i) => { if (i && Math.abs(s.t0 - P[i - 1].t1) > 1e-6) throw new Error(`NB_SHOTS: a gap or overlap before ${s.id}`); if (!(s.t1 > s.t0)) throw new Error(`NB_SHOTS: ${s.id} has no length`); });
  // every clock jump must sit on a cut
  for (const j of NB_JUMPS) if (!P.some((s) => Math.abs(s.t0 - j.t) < 1e-6)) throw new Error(`NB_SHOTS: the clock jumps at t ${j.t.toFixed(2)} without a cut`);
}

function nbShotAt(t) { for (const s of NB_SHOTS) if (t >= s.t0 && t < s.t1) return s; return t < 0 ? NB_SHOTS[0] : NB_SHOTS[NB_SHOTS.length - 1]; }
const nbShot = (mode) => { const A = NB_SHOTS.filter((s) => s.mode === mode); return A.length ? Object.assign({}, A[0], { t1: A[A.length - 1].t1 }) : undefined; };
function nbCutTimes(app) {
  const out = NB_SHOTS.map((s) => s.t0).filter((t) => t > 0);
  for (const s of Object.values((app && app.sets) || {})) if (s.cuts) out.push(...s.cuts());
  return out;
}
SCRIPT.events = NB_SHOTS.map((s) => ({ id: s.id, time: Math.max(0, s.t0), label: s.id + ' ' + s.mode }));
