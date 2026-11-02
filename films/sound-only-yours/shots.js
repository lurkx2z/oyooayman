/* =====================================================================
   SHOTS — every shot of the film, in order: { id, mode, t0, t1, set, cam? }. Cut points come from the captions
   (script.js: soS, soC, soB, soW) and every clock jump sits on a cut (the story clock only runs forward: the owner's
   rule of 2026-10-29).
   ===================================================================== */

const soSh = (id, mode, t0, t1, o = {}) => Object.assign({ id, mode, t0, t1, set: 'world' }, o);

const SO_SHOTS = [];
{
  const P = SO_SHOTS, c = soC, B = soB, W = soW;
  const L = [
    // 1 — your kitchen, 9:41: the glass, "What...?", the clock, "Hello?", the news, the rain, the cat, nothing; you clap;
    // the pulse of air; your body; the ringing; Mum; the stranger's texts; the window; the windows across the park
    ['A0', 'title', -1, soS('what') - 0.35],
    ['A1', 'what', soS('what') - 0.35, B('start')],
    ['A2', 'start', B('start'), c('start', 0) + 2.4, { cam: 'clock' }],
    ['A2b', 'start', c('start', 0) + 2.4, B('hello')],
    ['A3', 'hello', B('hello'), B('room')],
    ['A4', 'room', B('room'), W('room', 0, 'rain') - 0.12, { cam: 'news' }],
    ['A4b', 'room', W('room', 0, 'rain') - 0.12, W('room', 0, 'cat') - 0.12, { cam: 'rain' }],
    ['A4c', 'room', W('room', 0, 'cat') - 0.12, c('room', 1) - 0.25, { cam: 'cat' }],
    ['A4d', 'room', c('room', 1) - 0.25, B('clap')],
    ['A5', 'clap', B('clap'), B('rule')],
    ['A6', 'rule', B('rule'), B('body')],
    ['A7', 'body', B('body'), B('ring')],
    ['A8', 'ring', B('ring'), B('mum')],
    ['A9', 'mum', B('mum'), B('text')],
    ['A10', 'text', B('text'), B('window')],
    ['A11', 'window', B('window'), c('window', 2) - 0.3],
    ['A11b', 'window', c('window', 2) - 0.3, B('faces'), { cam: 'map' }],
    ['A12', 'faces', B('faces'), c('faces', 1) - 0.3],
    ['A12b', 'faces', c('faces', 1) - 0.3, B('stairs'), { cam: 'reverse' }],
    // 2 — the stairwell, 9:47: down in the timer light; it goes out; behind you
    ['B0', 'stairs', B('stairs'), B('behind'), { set: 'stair' }],
    ['B1', 'behind', B('behind'), c('behind', 3) + 0.9, { set: 'stair' }],
    ['B1b', 'behind', c('behind', 3) + 0.9, B('street'), { set: 'stair', cam: 'phone' }],
    // 3 — the street, 9:52: the rain, the alarm, the dog; the silent car; the ambulance; every head turns; the storm
    ['C0', 'street', B('street'), W('street', 1, 'alarms') - 0.5],
    ['C0b', 'street', W('street', 1, 'alarms') - 0.5, W('street', 1, 'dog') - 0.3, { cam: 'alarm' }],
    ['C0c', 'street', W('street', 1, 'dog') - 0.3, B('car'), { cam: 'dog' }],
    ['C1', 'car', B('car'), B('warn')],
    ['C2', 'warn', B('warn'), B('heads')],
    ['C3', 'heads', B('heads'), B('storm')],
    ['C4', 'storm', B('storm'), B('park')],
    // 4 — the park, 9:56: the middle; the bats; the shout and its echoes; 5 km; they come
    ['D0', 'park', B('park'), B('bats')],
    ['D1', 'bats', B('bats'), B('shout')],
    ['D2', 'shout', B('shout'), c('shout', 1) + 0.9],
    ['D2b', 'shout', c('shout', 1) + 0.9, c('shout', 2) - 0.3, { cam: 'tower' }],
    ['D2c', 'shout', c('shout', 2) - 0.3, B('far'), { cam: 'map' }],
    ['D3', 'far', B('far'), B('coming')],
    ['D4', 'coming', B('coming'), c('coming', 1) - 0.3],
    ['D4b', 'coming', c('coming', 1) - 0.3, B('hide'), { cam: 'high' }],
    // 5 — the dark under the trees, 10:09: the dog; the echo pictures; "Who's there?"; behind you
    ['E0', 'hide', B('hide'), SO.tDog - 0.9],
    ['E0b', 'dog', SO.tDog - 0.9, B('echo')],
    ['E1', 'echo', B('echo'), B('who')],
    ['E2', 'who', B('who'), B('question', 0.9)],
    ['E3', 'question', B('question', 0.9), 1e9],
  ];
  for (const [id, mode, t0, t1, o] of L) P.push(soSh(id, mode, t0, t1, o || {}));
  P.forEach((s, i) => { if (i && Math.abs(s.t0 - P[i - 1].t1) > 1e-6) throw new Error(`SO_SHOTS: a gap or overlap before ${s.id}`); if (!(s.t1 > s.t0)) throw new Error(`SO_SHOTS: ${s.id} has no length`); });
  for (const j of SO_JUMPS) if (!P.some((s) => Math.abs(s.t0 - j.t) < 1e-6)) throw new Error(`SO_SHOTS: the clock jumps at t ${j.t.toFixed(2)} without a cut`);
}

function soShotAt(t) { for (const s of SO_SHOTS) if (t >= s.t0 && t < s.t1) return s; return t < 0 ? SO_SHOTS[0] : SO_SHOTS[SO_SHOTS.length - 1]; }
const soShot = (mode) => { const A = SO_SHOTS.filter((s) => s.mode === mode); return A.length ? Object.assign({}, A[0], { t1: A[A.length - 1].t1 }) : undefined; };
function soCutTimes(app) {
  const out = SO_SHOTS.map((s) => s.t0).filter((t) => t > 0);
  for (const s of Object.values((app && app.sets) || {})) if (s.cuts) out.push(...s.cuts());
  return out;
}
SCRIPT.events = SO_SHOTS.map((s) => ({ id: s.id, time: Math.max(0, s.t0), label: s.id + ' ' + s.mode }));
