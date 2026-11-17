/* =====================================================================
   SHOTS — every shot of the film, in order: { id, mode, t0, t1, set }. Cut points come from the captions (clock.js:
   nlS, nlC, nlB, nlE) and the story clock may only jump forward at a cut (the owner's rule of 2026-10-29: no replays).
   One set (lake). A shot's mode picks its camera (lake.js set.cams) and its look: the title is daylight; the dark
   modes (lake.js NL_DARK) are pure black, what you actually see; every other shot is the heat camera.
   ===================================================================== */

const nlSh = (id, mode, t0, t1, set) => ({ id, mode, t0, t1, set });

const NL_SHOTS = [];
{
  const P = NL_SHOTS, c = nlC, B = nlB;
  const L = [
    // 2:39:56 PM, daylight: skating west into the low Sun; at 2:40:00 every light goes out
    ['T1', 'title', -1, NL.tOn],
    ['K0', 'dark', NL.tOn, c('start', 1) - 0.4],
    ['K1', 'sky', c('start', 1) - 0.4, c('start', 2) - 0.5],
    ['K2', 'dark', c('start', 2) - 0.5, B('skaters')],
    // still gliding at 21 km/h, everyone round you; you hit someone sitting on the ice and go down
    ['G1', 'glide', B('skaters'), c('skaters', 1) - 1.4],
    ['G2', 'fall', c('skaters', 1) - 1.4, B('heat')],
    // the heat camera; why only visible light (the rule); your skin's own light; your handprint
    ['H1', 'wide', B('heat'), c('heat', 1) - 0.5],
    ['H2', 'low', c('heat', 1) - 0.5, B('rule')],
    ['R1', 'you', B('rule'), c('rule', 1) - 0.5],
    ['R2', 'spec', c('rule', 1) - 0.5, B('body')],
    ['B1', 'hand', B('body'), B('count')],
    // 240 people on the ice; the woman who grabs your arm; 112
    ['C1', 'count', B('count'), c('count', 1) - 0.5],
    ['C2', 'lost', c('count', 1) - 0.5, B('grab')],
    ['D1', 'grabDark', B('grab'), c('grab', 1) - 0.5],
    ['D2', 'her', c('grab', 1) - 0.5, B('help')],
    ['P1', 'phone', B('help'), c('help', 1) - 0.5],
    ['P2', 'shoreRoad', c('help', 1) - 0.5, B('sun')],
    // the Sun, still up, still warm; the bonfire nobody can see; the town's lamps and screens
    ['U1', 'sun', B('sun'), c('sun', 1) - 0.5],
    ['U2', 'sunset', c('sun', 1) - 0.5, c('sun', 2) - 0.5],
    ['U3', 'sunWide', c('sun', 2) - 0.5, B('fire')],
    ['F1', 'fire', B('fire'), c('fire', 1) - 0.5],
    ['F2', 'man', c('fire', 1) - 0.5, c('fire', 2) - 0.9],
    ['F3', 'feel', c('fire', 2) - 0.9, B('town')],
    ['N1', 'town', B('town'), c('town', 1) - 0.5],
    ['N2', 'window', c('town', 1) - 0.5, B('road')],
    // the road: the lorry creeping blind, the hit you see 1.5 s before you hear it; the car onto the lake; through
    ['O1', 'road', B('road'), c('road', 1) - 0.5],
    ['O2', 'lorry', c('road', 1) - 0.5, c('road', 2) + 1.4],
    ['O3', 'turn', c('road', 2) + 1.4, B('slide')],
    ['S1', 'slide', B('slide'), c('slide', 1) - 0.5],
    ['S2', 'out', c('slide', 1) - 0.5, B('ice')],
    ['I1', 'ice', B('ice'), c('ice', 2) - 1.1],
    ['I2', 'sink', c('ice', 2) - 1.1, B('steam')],
    ['M1', 'steam', B('steam'), c('steam', 1) - 0.5],
    ['M2', 'behind', c('steam', 1) - 0.5, B('world')],
    // (+40 s) the world; the plane
    ['W1', 'world', B('world'), c('world', 1) - 0.5],
    ['W2', 'forest', c('world', 1) - 0.5, c('world', 2) - 0.5],
    ['W3', 'skyup', c('world', 2) - 0.5, B('plane')],
    ['A1', 'plane', B('plane'), c('plane', 1) - 0.5],
    ['A2', 'planeAway', c('plane', 1) - 0.5, B('sing')],
    // the ice sings; someone in the water
    ['Q1', 'singDark', B('sing'), c('sing', 1) - 0.5],
    ['Q2', 'listen', c('sing', 1) - 0.5, B('water')],
    ['V1', 'waterDark', B('water'), c('water', 1) - 0.5],
    ['V2', 'driver', c('water', 1) - 0.5, c('water', 2) - 0.5],
    ['V3', 'cold', c('water', 2) - 0.5, B('crawl')],
    // (+200 s) flat on the ice, her hands on your ankles; (+120 s) the ice cracks; the reach
    ['X1', 'prone', B('crawl'), c('crawl', 1) - 0.5],
    ['X2', 'chain', c('crawl', 1) - 0.5, c('crawl', 2) - 0.6],
    ['X3', 'edge', c('crawl', 2) - 0.6, B('edge')],
    ['Y1', 'crackDark', B('edge'), c('edge', 1) - 0.5],
    ['Y2', 'cracks', c('edge', 1) - 0.5, c('edge', 2) - 0.5],
    ['Y3', 'edge', c('edge', 2) - 0.5, B('reach')],
    ['Z1', 'reach', B('reach'), B('question')],
    ['Z2', 'question', B('question'), 1e9],
  ];
  for (const [id, mode, t0, t1] of L) P.push(nlSh(id, mode, t0, t1, 'lake'));
  P.forEach((s, i) => { if (i && Math.abs(s.t0 - P[i - 1].t1) > 1e-6) throw new Error(`NL_SHOTS: a gap or overlap before ${s.id}`); if (!(s.t1 > s.t0)) throw new Error(`NL_SHOTS: ${s.id} has no length`); });
  // every clock jump must sit on a cut
  for (const j of NL_JUMPS) if (!P.some((s) => Math.abs(s.t0 - j.t) < 1e-6)) throw new Error(`NL_SHOTS: the clock jumps at t ${j.t.toFixed(2)} without a cut`);
}

function nlShotAt(t) { for (const s of NL_SHOTS) if (t >= s.t0 && t < s.t1) return s; return t < 0 ? NL_SHOTS[0] : NL_SHOTS[NL_SHOTS.length - 1]; }
function nlCutTimes(app) {
  const out = NL_SHOTS.map((s) => s.t0).filter((t) => t > 0);
  for (const s of Object.values((app && app.sets) || {})) if (s.cuts) out.push(...s.cuts());
  return out;
}
SCRIPT.events = NL_SHOTS.map((s) => ({ id: s.id, time: Math.max(0, s.t0), label: s.id + ' ' + s.mode }));
