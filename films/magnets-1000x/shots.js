/* =====================================================================
   SHOTS — every shot of the film, in order: { id, mode, t0, t1, set }. Cut points come from the captions (script.js:
   mgS, mgC, mgB, mgE) and the story clock may only jump forward at a cut (the owner's rule of 2026-10-29: no replays).
   Sets: river (the river, the scrapyard, your boat, the bridge, the turbines), mri (inside the hospital's MRI unit).
   ===================================================================== */

const mgSh = (id, mode, t0, t1, set) => ({ id, mode, t0, t1, set });

const MG_SHOTS = [];
{
  const P = MG_SHOTS, c = mgC, B = mgB;
  const L = [
    // 1 — 10:41:57 AM: on your boat, beside your mum; the scrapyard's magnet over its pile. At 10:42:00 every magnet on
    // Earth gets 1,000 times stronger
    ['A0', 'title', -1, c('start', 0) + 1.6, 'river'],
    ['A1', 'yard', c('start', 0) + 1.6, B('radio'), 'river'],
    ['R1', 'radio', B('radio'), B('phone'), 'river'],
    ['P1', 'phone', B('phone'), B('pile'), 'river'],
    // the pile leaves the ground; the rope snaps; the cube law
    ['Y1', 'pile', B('pile'), c('pile', 2) - 0.6, 'river'],
    ['Y2', 'rope', c('pile', 2) - 0.6, B('reach'), 'river'],
    ['Y3', 'reach', B('reach'), B('mri'), 'river'],
    // the hospital across the river: its MRI scanner
    ['M1', 'hospitalExt', B('mri'), c('mri', 1) - 0.5, 'river'],
    ['M2', 'mriRoom', c('mri', 1) - 0.5, c('mri', 2) - 0.4, 'mri'],
    ['M3', 'plan', c('mri', 2) - 0.4, B('cylinder'), 'mri'],
    ['M4', 'corridor', B('cylinder'), c('cylinder', 1) - 0.9, 'mri'],
    ['M5', 'burst', c('cylinder', 1) - 0.9, B('water'), 'mri'],
    ['M6', 'water', B('water'), B('waiting'), 'mri'],
    ['M7', 'waiting', B('waiting'), B('speed'), 'mri'],
    // back at the yard; your boat is being drawn in
    ['S1', 'speed', B('speed'), B('boat'), 'river'],
    ['B1', 'hull', B('boat'), c('boat', 1) - 0.5, 'river'],
    ['B2', 'boatAir', c('boat', 1) - 0.5, B('real'), 'river'],
    // (before each story away from your boat, a look back at it: how far from the ball now)
    ['X1', 'real', B('real'), mgE('real') + 0.25, 'river'],
    ['K2', 'check1', mgE('real') + 0.25, B('cars'), 'river'],
    ['C1', 'cars', B('cars'), mgE('cars') + 0.25, 'river'],
    ['K3', 'check2', mgE('cars') + 0.25, B('road'), 'river'],
    // the bridge (the electric cars skid), the wind turbines (their blades fly off)
    ['D1', 'bridge', B('road'), c('road', 2) - 0.5, 'river'],
    ['D2', 'bridgeWide', c('road', 2) - 0.5, mgE('road') + 0.25, 'river'],
    ['K4', 'check3', mgE('road') + 0.25, B('turbine'), 'river'],
    ['T1', 'turbines', B('turbine'), c('turbine', 1) - 0.3, 'river'],
    ['T2', 'blades', c('turbine', 1) - 0.3, B('boat2'), 'river'],
    // your mum steers away; inside the boat; 9 metres; the count
    ['B3', 'mum', B('boat2'), B('inside'), 'river'],
    ['I1', 'inside', B('inside'), B('phonehit'), 'river'],
    // your phone is torn out of your hand; it hits the ball
    ['H1', 'rip', B('phonehit'), c('phonehit', 1) - 1.6, 'river'],
    ['H2', 'phonehit', c('phonehit', 1) - 1.6, B('close'), 'river'],
    ['K1', 'close', B('close'), B('count'), 'river'],
    ['Z1', 'count', B('count'), c('count', 1) - 0.6, 'river'],
    ['Z2', 'bike', c('count', 1) - 0.6, c('count', 2) - 0.4, 'river'],
    ['Z3', 'lift', c('count', 2) - 0.4, c('back', 0) - 0.6, 'river'],
    // 2 — 10:42:10 AM: back to normal: the boat drops, the ball lets go
    ['Z4', 'drop', c('back', 0) - 0.6, c('back', 2) - 0.6, 'river'],
    ['Z5', 'heap', c('back', 2) - 0.6, B('after'), 'river'],
    // 3 — +1 min: everything it touched is a magnet now; your boat is stuck to the wall
    ['G1', 'after', B('after'), c('after', 1) - 0.5, 'river'],
    ['G2', 'stuck', c('after', 1) - 0.5, B('question'), 'river'],
    ['G3', 'question', B('question'), 1e9, 'river'],
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
