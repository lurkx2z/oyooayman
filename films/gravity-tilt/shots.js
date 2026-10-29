/* =====================================================================
   SHOTS — every shot of the film, in order: { id, mode, t0, t1, set, pov }. Story time comes from the film's one
   clock (script.js: GT_CLOCK, gtStoryAt), never from the shot: every cut moves the hour on, none goes back (the
   owner's rule of 2026-10-29). Each jump of the clock is a cut here (checked below). The cut points come from the
   captions (script.js: gtS, gtC, gtB).
   ===================================================================== */

const gtSh = (id, mode, t0, t1, o = {}) => Object.assign({ id, mode, t0, t1, set: 'world' }, o);
const GT_SEG = (i) => GT_CLOCK[i].t0;                            // where clock segment i starts (a jump or a change of speed)

const GT_SHOTS = [];
{
  const P = GT_SHOTS, c = gtC, B = gtB;
  const J = GT_CLOCK.map((g) => g.t0);                          // [−2, 40.7, 75.8, 88.0, 96.7, 103.1, …]
  const L = [
    // 1 — the first seconds: your window; your room (it falls onto the window); the street, falling; a chair; the bottom
    ['A0', 'pov0', -1, GT.t0 + 0.25, { pov: true }],
    ['A1', 'room0', GT.t0 + 0.25, GT.t0 + 2.0],
    ['A2', 'master', GT.t0 + 2.0, B('street', 0.2)],
    ['A3', 'chair', B('street', 0.2), c('street', 1) - 0.2],
    ['A4', 'bottom', c('street', 1) - 0.2, B('glass', 0.6)],
    // 2 — the glass; off it; the thought experiment (your room as you feel it; your house, tipped)
    ['B0', 'front', B('glass', 0.6), c('glass', 2) - 1.1],
    ['B1', 'povglass', c('glass', 2) - 1.1, B('crawl', 0.45), { pov: true }],
    ['B2', 'crawl', B('crawl', 0.45), B('nuance', 0.3)],
    ['B3', 'roomroll', B('nuance', 0.3), c('nuance', 1) - 0.3],
    ['B4', 'tipped', c('nuance', 1) - 0.3, B('air', 0.4)],
    // 3 — the air keeps its down (the steam off the pile); the river (its own set); the jogger
    ['C0', 'dust', B('air', 0.4), c('air', 1) - 0.3],
    ['C1', 'dust2', c('air', 1) - 0.3, J[2]],
    ['D0', 'river', J[2], c('river', 1) - 0.2, { set: 'river' }],
    ['D1', 'bend', c('river', 1) - 0.2, c('river', 1) + 2.0, { set: 'river' }],
    ['D2', 'spray', c('river', 1) + 2.0, J[3], { set: 'river' }],
    ['E0', 'jogger', J[3], J[4]],
    ['E1', 'climb', J[4], J[5]],
    // 4 — the pit, the sickness, the cat, the bath, the phone, the trees, the sun
    ['F0', 'pit', J[5], B('sick', 0.45)],
    ['F2', 'sick', B('sick', 0.45), B('cat', 0.65), { pov: true }],
    ['F3', 'cat', B('cat', 0.65), J[6]],
    ['G0', 'bath', J[6], J[7]],
    ['G1', 'phone', J[7], J[8], { pov: true }],
    ['G2', 'trees', J[8], J[9]],
    ['G3', 'sun', J[9], J[10]],
    // 5 — the brick terrace; the rain
    ['H0', 'terrace', J[10], c('brick', 0) + 2.2],
    ['H1', 'dpc', c('brick', 0) + 2.2, c('brick', 2) - 0.3],
    ['H2', 'row', c('brick', 2) - 0.3, J[11]],
    ['H3', 'slip', J[11], J[12]],
    ['I0', 'rainfront', J[12], J[13]],
    ['I1', 'rainjog', J[13], c('rain', 3) - 0.6],
    ['I2', 'bow', c('rain', 3) - 0.6, J[14]],
    // 6 — the wood; the terrace goes; where it was
    ['J0', 'wood', J[14], c('wood', 1) - 0.4],
    ['J1', 'creak', c('wood', 1) - 0.4, J[15]],
    ['J2', 'creep', J[15], J[16]],
    ['K0', 'going', J[16], J[17]],
    ['K1', 'still', J[17], J[17] + 4.25],
    ['K2', 'release', J[17] + 4.25, c('gone', 1) - 1.6],
    ['K3', 'impact', c('gone', 1) - 1.6, GT.tTerHit + 3.0],
    ['K4', 'empty', GT.tTerHit + 3.0, J[18]],
    // 7 — the pool; the window goes (from inside, then from below it outside)
    ['L0', 'pool', J[18], J[19]],
    ['L1', 'glassclose', J[19], GT.tGlass + 0.2],
    ['L2', 'glassgo', GT.tGlass + 0.2, J[20]],
    // 8 — ten minutes; the bolt; the last minute; the last ten seconds
    ['M0', 'ready', J[20], c('ready', 3) - 0.5],
    ['M1', 'jogdown', c('ready', 3) - 0.5, J[21]],
    ['M2', 'bolt', J[21], c('bolt', 1) - 3.0],
    ['M3', 'lurch', c('bolt', 1) - 3.0, J[22]],
    ['N0', 'last', J[22], J[22] + 4.1],
    ['N1', 'lastin', J[22] + 4.1, J[23]],
    ['N2', 'count', J[23], GT.tB],
    // 9 — down is down
    ['O0', 'back', GT.tB, GT.tB + 3.1],
    ['O1', 'backstreet', GT.tB + 3.1, B('rainfall', 0.6)],
    ['O2', 'rainfall', B('rainfall', 0.6), B('after', 0.7)],
    ['O3', 'after', B('after', 0.7), B('question', 0.65)],
    ['O4', 'question', B('question', 0.65), 1e9],
  ];
  for (const [id, mode, t0, t1, o] of L) P.push(gtSh(id, mode, t0, t1, o || {}));
  // every jump of the clock must be a cut (never a jump inside a shot)
  const starts = P.map((s) => s.t0);
  for (const jp of GT_JUMPS) if (!starts.some((x) => Math.abs(x - jp.t) < 1e-6)) throw new Error(`GT_SHOTS: the clock jumps at t ${jp.t.toFixed(2)} (+${jp.ds.toFixed(0)} s) inside a shot`);
  P.forEach((s, i) => { if (i && Math.abs(s.t0 - P[i - 1].t1) > 1e-6) throw new Error(`GT_SHOTS: a gap or overlap before ${s.id}`); if (!(s.t1 > s.t0)) throw new Error(`GT_SHOTS: ${s.id} has no length`); });
}
// the last ten seconds' quick cuts (inside 'count')
GT.subCuts = (() => { const sh = GT_SHOTS.find((s) => s.mode === 'count'), n = 6, d = (sh.t1 - sh.t0) / n; return Array.from({ length: n - 1 }, (_, i) => sh.t0 + d * (i + 1)); })();
// your hands (film time): the mug; up onto the glass; flat on it; the phone; braced for the return
GT.hands = {
  right: [[-9, 'mug'], [GT.t0 + 0.02, 'glassR'], [GT_SHOTS.find((s) => s.mode === 'povglass').t1, 'hidden']],
  left: [[-9, 'hidden'], [GT.t0 + 0.02, 'glassR'], [GT_SHOTS.find((s) => s.mode === 'povglass').t1, 'hidden'], [gtB('phone') - 0.3, 'phone'], [gtE('phone') + 0.5, 'hidden']],
};

function gtShotAt(t) { for (const s of GT_SHOTS) if (t >= s.t0 && t < s.t1) return s; return t < 0 ? GT_SHOTS[0] : GT_SHOTS[GT_SHOTS.length - 1]; }
// every cut, for the 2-frame dip (the shot starts, plus a set's own cuts())
function gtCutTimes(app) {
  const out = GT_SHOTS.map((s) => s.t0).filter((t) => t > 0);
  for (const s of Object.values((app && app.sets) || {})) if (s.cuts) out.push(...s.cuts());
  return out;
}
// the events for the dev scrubber
SCRIPT.events = GT_SHOTS.map((s) => ({ id: s.id, time: Math.max(0, s.t0), label: s.id + ' ' + s.mode }));
