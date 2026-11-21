/* =====================================================================
   SHOTS — every shot of the film, in order: { id, mode, t0, t1, set }. Cut points come from the captions (clock.js:
   ocS, ocC, ocB, ocE) and the story clock jumps forward only at a cut that is one of clock.js's anchors (the owner's
   rule of 2026-10-29: no replays). Two sets: the rock (everything at Harrow Rock) and the hill (Isla, 24 km away).
   A shot's mode picks its camera (set.js set.cams).
   ===================================================================== */

const ocSh = (id, mode, t0, t1, set = 'rock') => ({ id, mode, t0, t1, set });
// the cut where clock.js's anchor (beat, caption, lead) jumps the story clock
const ocJ = (id, k) => { const a = OC_ANCHORS.find((x) => x[0] === id && x[1] === k); return ocC(id, k) - (a[3] ?? 0.6); };

const OC_SHOTS = [];
{
  const c = ocC, B = ocB, J = ocJ, F = ocFilmAt, E = OCE;
  const L = [
    // 6:42 PM, high water, the Sun going down over the sea; the tide doesn't turn
    ['T1', 'title', -1, OC.tOn],
    ['S1', 'tide', OC.tOn, c('start', 1) - 0.5],
    ['S2', 'aerial', c('start', 1) - 0.5, c('start', 2) - 0.5],
    ['S3', 'keeper', c('start', 2) - 0.5, J('boat', 0)],
    // the boat on its short line
    ['B1', 'rope', J('boat', 0), J('boat', 1)],
    ['B2', 'bow', J('boat', 1), J('boat', 2)],
    ['B3', 'sunk', J('boat', 2), J('phone', 0)],
    // Isla
    ['P1', 'phone', J('phone', 0), c('phone', 1) - 0.5],
    ['P2', 'phoneType', c('phone', 1) - 0.5, J('rule', 0)],
    // the water from nowhere
    ['R1', 'ocean', J('rule', 0), c('rule', 1) - 0.5],
    ['R2', 'horizon', c('rule', 1) - 0.5, c('rule', 2) - 0.5],
    ['R3', 'path', c('rule', 2) - 0.5, J('height', 0)],
    // 47 m: 45 minutes
    ['H1', 'towerUp', J('height', 0), c('height', 1) - 0.5],
    ['H2', 'keeperUp', c('height', 1) - 0.5, J('lichen', 0)],
    ['L1', 'lichen', J('lichen', 0), J('radio', 0)],
    ['Ra1', 'radio', J('radio', 0), c('radio', 1) - 0.5],
    ['Ra2', 'window', c('radio', 1) - 0.5, J('bell', 0)],
    ['Be1', 'buoy', J('bell', 0), J('world', 0)],
    ['W1', 'binocs', J('world', 0), c('world', 1) - 0.5],
    ['W2', 'tenM', c('world', 1) - 0.5, ocCap('world', 1).hide + 0.3],
    ['P3', 'phoneMid', ocCap('world', 1).hide + 0.3, J('fog', 0)],
    ['F1', 'fogHouse', J('fog', 0), c('fog', 1) - 0.5],
    ['F2', 'horn', c('fog', 1) - 0.5, J('cottage', 0)],
    ['C1', 'doorSeep', J('cottage', 0), J('cottage', 1)],
    ['C2', 'kitchen', J('cottage', 1), J('island', 0)],
    ['I1', 'aerialSea', J('island', 0), c('island', 1) - 0.5],
    ['I2', 'breakers', c('island', 1) - 0.5, J('door', 0)],
    // the door
    ['D1', 'bolt', J('door', 0), J('door', 1)],
    ['D2', 'strain', J('door', 1), F(E.burst) - 1.2],
    ['Bu1', 'burst', F(E.burst) - 1.2, c('dark', 0) - 0.5],
    ['Dk1', 'powerRoom', c('dark', 0) - 0.5, c('dark', 1) - 0.5],
    ['Dk2', 'towerOut', c('dark', 1) - 0.5, J('stairs', 0)],
    ['St1', 'stairsDown', J('stairs', 0), c('stairs', 1) - 0.5],
    ['St2', 'climb', c('stairs', 1) - 0.5, J('town', 0)],
    // the coast goes dark
    ['Tw1', 'phoneTown', J('town', 0), c('town', 1) - 0.5],
    ['Tw2', 'coastOut', c('town', 1) - 0.5, J('lights', 0)],
    ['Li1', 'owlPoint', J('lights', 0), c('lights', 1) - 0.5],
    ['Li2', 'lastLight', c('lights', 1) - 0.5, J('ship', 0)],
    ['Sh1', 'ship', J('ship', 0), c('ship', 1) - 0.5],
    ['Sh2', 'section', c('ship', 1) - 0.5, c('ship', 2) - 0.5],
    ['Sh3', 'watchRadio', c('ship', 2) - 0.5, J('ice', 0)],
    ['Ic1', 'night', J('ice', 0), J('hill', 0)],
    // Isla on the hill
    ['Hi1', 'phoneHill', J('hill', 0), c('hill', 1) - 0.5],
    ['Hi2', 'hill', c('hill', 1) - 0.5, J('lie', 0), 'hill'],
    ['Le1', 'phoneLie', J('lie', 0), J('watch', 0)],
    // the top
    ['Wa1', 'watchFlood', J('watch', 0), c('watch', 1) - 0.5],
    ['Wa2', 'ladder', c('watch', 1) - 0.5, J('gallery', 0)],
    ['G1', 'gallery', J('gallery', 0), J('lamp', 0)],
    ['La1', 'lens', J('lamp', 0), J('lamp', 1)],
    ['La2', 'underBeam', J('lamp', 1), J('roof', 0)],
    ['Ro1', 'roof', J('roof', 0), c('roof', 1) - 0.5],
    ['Ro2', 'phoneLow', c('roof', 1) - 0.5, B('question')],
    ['Q1', 'question', B('question'), OC.end + 1],
  ];
  for (const [id, mode, t0, t1, set] of L) OC_SHOTS.push(ocSh(id, mode, t0, t1, set));
  // (checks: in order, no gaps, every clock jump on a cut)
  for (let i = 1; i < OC_SHOTS.length; i++) { const a = OC_SHOTS[i - 1], b = OC_SHOTS[i]; if (Math.abs(a.t1 - b.t0) > 1e-6 || !(b.t1 > b.t0 + 0.4)) throw new Error(`shots.js: ${a.id} → ${b.id} (${a.t1.toFixed(2)} / ${b.t0.toFixed(2)} → ${b.t1.toFixed(2)})`); }
  for (const j of OC_JUMPS) if (!OC_SHOTS.some((sh) => Math.abs(sh.t0 - j.t) < 1e-6)) throw new Error(`shots.js: the clock jumps at ${j.t.toFixed(2)} s, but nothing cuts there`);
}
function ocShotAt(t) { for (const s of OC_SHOTS) if (t >= s.t0 && t < s.t1) return s; return t < 0 ? OC_SHOTS[0] : OC_SHOTS[OC_SHOTS.length - 1]; }
function ocCutTimes() { return OC_SHOTS.map((s) => s.t0).filter((t) => t > 0); }
SCRIPT.events = OC_SHOTS.map((s) => ({ id: s.id, time: Math.max(0, s.t0), label: s.id + ' ' + s.mode }));
// the POV shots (your hands, no body) and what your hands do in each
const OC_POV = { phone: ['phone', 'phoneL'], phoneType: ['phone', 'phoneL'], phoneMid: ['phone', 'phoneL'], binocs: ['bino', 'bino'], bolt: ['bolt', 'bolt'], powerRoom: ['torch', 'hidden'], watchRadio: ['torch', 'hidden'], stairsDown: ['torch', 'rail'], climb: ['torch', 'rail'],
  phoneTown: ['phone', 'hidden'], phoneHill: ['phone', 'phoneL'], phoneLie: ['phone', 'phoneL'], ladder: ['rung', 'rung'], phoneLow: ['phone', 'hidden'] };
(() => { const R = OC_HANDS.right, L = OC_HANDS.left;
  for (const sh of OC_SHOTS) { const p = OC_POV[sh.mode] || ['hidden', 'hidden']; R.push([sh.t0, p[0]]); L.push([sh.t0, p[1]]); }
  // (the bolts: both hands shove the door shut, then slide the bolts across)
  const d1 = OC_SHOTS.find((x) => x.mode === 'bolt'); R.push([d1.t0 + 0.05, 'shove'], [d1.t0 + 1.4, 'bolt']); L.push([d1.t0 + 0.05, 'shove'], [d1.t0 + 2.2, 'bolt']);
  R.sort((a, b) => a[0] - b[0]); L.sort((a, b) => a[0] - b[0]); })();
