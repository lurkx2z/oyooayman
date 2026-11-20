/* =====================================================================
   SHOTS — every shot of the film, in order: { id, mode, t0, t1, set }. Cut points come from the captions (clock.js:
   ekS, ekC, ekB, ekBk, ekE) and the story clock jumps forward only at a cut (the owner's rule of 2026-10-29: no
   replays). One set (world.js); a shot's mode picks its camera and what the people do (EK_MODES).
   ===================================================================== */

const ekSh = (id, mode, t0, t1, set) => ({ id, mode, t0, t1, set });
const EK_SHOTS = [];
{
  const P = EK_SHOTS, c = ekC, B = ekB, k = (id, i) => ekBk(id, i);
  const L = [
    // 6:49 AM: in the tent; it closes in
    ['T1', 'tentWake', -1, B('start')],
    ['K1', 'tentLeo', B('start'), k('start', 1)],
    ['K2', 'tentFeet', k('start', 1), k('start', 2)],
    ['K3', 'tentClose', k('start', 2), B('out')],
    // out through the roof; the campsite closing in
    ['O1', 'rip', B('out'), k('out', 1)],
    ['O2', 'campPan', k('out', 1), B('rule')],
    // Poincaré
    ['R1', 'lakeDawn', B('rule'), k('rule', 1)],
    ['R2', 'campLow', k('rule', 1), k('rule', 2)],
    ['R3', 'unless', k('rule', 2), B('leo')],
    // Leo
    ['L1', 'leoOut', B('leo'), k('leo', 1)],
    ['L2', 'leoView', k('leo', 1), B('voice')],
    ['V1', 'leoCall', B('voice'), k('voice', 1)],
    ['V2', 'leoCallLow', k('voice', 1), B('weight')],
    // your weight; you pick him up
    ['W1', 'bayPOV', B('weight'), k('weight', 1)],
    ['W2', 'bendSide', k('weight', 1), k('weight', 2)],
    ['W3', 'pickUp', k('weight', 2), B('neighbours')],
    // the neighbours
    ['N1', 'nbView', B('neighbours'), k('neighbours', 1)],
    ['N2', 'nbDown', k('neighbours', 1), k('neighbours', 2)],
    ['N3', 'boots', k('neighbours', 2), B('rumble')],
    ['U1', 'callOut', B('rumble'), k('rumble', 1)],
    ['U2', 'quake', k('rumble', 1), B('hush')],
    // his voice climbs out of your hearing
    ['H1', 'palm1', B('hush'), k('hush', 1)],
    ['H2', 'palm2', k('hush', 1), k('hush', 2)],
    ['H3', 'palm3', k('hush', 2), B('quiet')],
    ['Q1', 'valleyDark', B('quiet'), k('quiet', 1)],
    ['Q2', 'giantWide', k('quiet', 1), B('sunrise')],
    // the Sun, for you first; your shadow on the peaks
    ['S1', 'sunrise', B('sunrise'), B('shadow')],
    ['D1', 'peaksGold', B('shadow'), k('shadow', 1)],
    ['D2', 'shadowOn', k('shadow', 1), B('peaks')],
    ['P1', 'puddle', B('peaks'), k('peaks', 1)],
    ['P2', 'waist', k('peaks', 1), B('air')],
    // putting him down
    ['A1', 'handHigh', B('air'), k('air', 1)],
    ['A2', 'kneelDown', k('air', 1), k('air', 2)],
    ['A3', 'touch', k('air', 2), k('air', 3)],
    ['A4', 'speck', k('air', 3), k('air', 4)],
    ['A5', 'gone', k('air', 4), B('escape')],
    // holding on
    ['E1', 'kneelView', B('escape'), k('escape', 1)],
    ['E2', 'holdPeaks', k('escape', 1), B('plane')],
    ['F1', 'plane', B('plane'), B('curve')],
    ['C1', 'curve', B('curve'), B('sky')],
    ['K4', 'airBelow', B('sky'), k('sky', 1)],
    ['K5', 'stars', k('sky', 1), B('lift')],
    // it can't hold you
    ['I1', 'lift', B('lift'), B('moon')],
    ['M1', 'moon', B('moon'), B('house')],
    ['H4', 'house', B('house'), k('house', 1)],
    ['H5', 'carSize', k('house', 1), k('house', 2)],
    ['H6', 'smaller', k('house', 2), B('ball')],
    ['B1', 'ball', B('ball'), B('end')],
    ['Z1', 'leoOn', B('end'), k('end', 1)],
    ['Z2', 'cupped', k('end', 1), B('question')],
    ['Z3', 'question', B('question'), 1e9],
  ];
  for (const [id, mode, t0, t1] of L) P.push(ekSh(id, mode, t0, t1, 'world'));
  P.forEach((s, i) => { if (i && Math.abs(s.t0 - P[i - 1].t1) > 1e-6) throw new Error(`EK_SHOTS: a gap or overlap before ${s.id}`); if (!(s.t1 > s.t0)) throw new Error(`EK_SHOTS: ${s.id} has no length`); });
  for (const j of EK_JUMPS) if (!P.some((s) => Math.abs(s.t0 - j.t) < 1e-6)) throw new Error(`EK_SHOTS: the clock jumps at t ${j.t.toFixed(2)} without a cut`);
}
function ekShotAt(t) { for (const s of EK_SHOTS) if (t >= s.t0 && t < s.t1) return s; return t < 0 ? EK_SHOTS[0] : EK_SHOTS[EK_SHOTS.length - 1]; }
function ekCutTimes(app) {
  const out = EK_SHOTS.map((s) => s.t0).filter((t) => t > 0);
  for (const s of Object.values((app && app.sets) || {})) if (s.cuts) out.push(...s.cuts());
  return out;
}
SCRIPT.events = EK_SHOTS.map((s) => ({ id: s.id, time: Math.max(0, s.t0), label: s.id + ' ' + s.mode }));
