/* =====================================================================
   SHOTS — every shot of the film, in order: { id, mode, t0, t1, set }. Cut points come from the captions (clock.js:
   sfS, sfC, sfB, sfE) and the story clock may only jump forward at a cut (the owner's rule of 2026-10-29: no replays).
   One set (farm). A shot's mode picks its camera (farm.js set.cams).
   ===================================================================== */

const sfSh = (id, mode, t0, t1, set) => ({ id, mode, t0, t1, set });

const SF_SHOTS = [];
{
  const P = SF_SHOTS, c = sfC, B = sfB, at = (s) => sfFilmAt(s);
  const L = [
    // 8:51:56 PM: she runs into the corn after the dog; 8:52:00: every thunder at once
    ['T1', 'title', -1, c('start', 1) - 0.4],
    ['K1', 'storm', c('start', 1) - 0.4, c('start', 2) - 0.5],
    ['K2', 'thunder', c('start', 2) - 0.5, B('flash')],
    // the flash and the bang together (3 km); the race; the rule
    ['F1', 'walk', B('flash'), at(SF_STRIKES.find((k) => k.key === 'flash3').s) - 1.1],
    ['F2', 'bolt3', at(SF_STRIKES.find((k) => k.key === 'flash3').s) - 1.1, c('flash', 2) - 0.5],
    ['F3', 'race', c('flash', 2) - 0.5, B('rule')],
    ['R1', 'windmill', B('rule'), c('rule', 1) - 0.5],
    ['R2', 'yardlight', c('rule', 1) - 0.5, at(SF_STRIKES.find((k) => k.key === 'long').s) - 0.6],
    // the 6 km bolt; its rumble, all at once
    ['M1', 'longBolt', at(SF_STRIKES.find((k) => k.key === 'long').s) - 0.6, c('rumble', 1) - 0.5],
    ['M2', 'rumble', c('rumble', 1) - 0.5, c('rumble', 2) - 0.4],
    ['M3', 'stare', c('rumble', 2) - 0.4, B('call')],
    // your call; no echo; her answer, from everywhere
    ['C1', 'call', B('call'), c('call', 1) - 0.5],
    ['C2', 'echo', c('call', 1) - 0.5, B('answer')],
    ['A1', 'answer', B('answer'), c('answer', 1) - 0.5],
    ['A2', 'search', c('answer', 1) - 0.5, B('ears')],
    ['E1', 'ears1', B('ears'), c('ears', 1) - 0.5],
    ['E2', 'ears2', c('ears', 1) - 0.5, c('ears', 2) - 0.5],
    ['E3', 'high', c('ears', 2) - 0.5, B('head')],
    ['H1', 'insideHead', B('head'), c('head', 1) - 0.5],
    ['H2', 'louder', c('head', 1) - 0.5, c('head', 2) - 0.5],
    ['H3', 'wrongWay', c('head', 2) - 0.5, B('far')],
    // far off: the train, the Hansens' dogs, everything at once
    ['W1', 'train', B('far'), c('far', 1) - 0.5],
    ['W2', 'hansen', c('far', 1) - 0.5, c('far', 2) - 0.5],
    ['W3', 'plain', c('far', 2) - 0.5, B('siren')],
    // the sirens; the sheriff's car (no drop in pitch)
    ['S1', 'sirens', B('siren'), c('siren', 1) - 0.5],
    ['S2', 'sheriff', c('siren', 1) - 0.5, c('siren', 2) - 0.5],
    ['S3', 'goingAway', c('siren', 2) - 0.5, at(SFE.tornado) - 1.6],
    // a flash: the tornado
    ['N1', 'reveal', at(SFE.tornado) - 1.6, c('tornado', 1) - 0.4],
    ['N2', 'funnel', c('tornado', 1) - 0.4, c('tornado', 2) - 0.5],
    ['N3', 'louderT', c('tornado', 2) - 0.5, B('phone')],
    // her phone
    ['P1', 'dial', B('phone'), c('phone', 1) - 0.5],
    ['P2', 'kidPhone', c('phone', 1) - 0.5, c('phone', 2) - 0.5],
    ['P3', 'phoneMap', c('phone', 2) - 0.5, B('corn')],
    // (+25 s) into the corn
    ['Q1', 'run', B('corn'), c('corn', 1) - 0.5],
    ['Q2', 'above', c('corn', 1) - 0.5, c('corn', 2) - 0.5],
    ['Q3', 'runFront', c('corn', 2) - 0.5, at(SFE.yardHit) - 0.6],
    ['X1', 'yardHit', at(SFE.yardHit) - 0.6, c('strike', 1) - 0.5],
    ['X2', 'yardDead', c('strike', 1) - 0.5, c('strike', 2) - 0.5],
    ['X3', 'stumble', c('strike', 2) - 0.5, B('wind')],
    ['V1', 'windAbove', B('wind'), c('wind', 1) - 0.5],
    ['V2', 'lyingDown', c('wind', 1) - 0.5, at(SFE.hansen) - 1.4],
    ['Y1', 'hansenHit', at(SFE.hansen) - 1.4, c('neighbour', 1) - 0.5],
    ['Y2', 'debris', c('neighbour', 1) - 0.5, at(SFE.found) - 0.9],
    // a flash: her raincoat
    ['Z1', 'found', at(SFE.found) - 0.9, c('found', 1) - 0.5],
    ['Z2', 'hold', c('found', 1) - 0.5, B('back')],
    ['Z3', 'escape', B('back'), at(SF_STRIKES.find((k) => k.key === 'back').s) - 0.5],
    ['Z4', 'everywhere', at(SF_STRIKES.find((k) => k.key === 'back').s) - 0.5, c('back', 2) - 0.5],
    ['Z5', 'turn', c('back', 2) - 0.5, B('question')],
    ['Z6', 'question', B('question'), 1e9],
  ];
  for (const [id, mode, t0, t1] of L) P.push(sfSh(id, mode, t0, t1, 'farm'));
  P.forEach((s, i) => { if (i && Math.abs(s.t0 - P[i - 1].t1) > 1e-6) throw new Error(`SF_SHOTS: a gap or overlap before ${s.id}`); if (!(s.t1 > s.t0)) throw new Error(`SF_SHOTS: ${s.id} has no length`); });
  // every clock jump must sit on a cut
  for (const j of SF_JUMPS) if (!P.some((s) => Math.abs(s.t0 - j.t) < 1e-6)) throw new Error(`SF_SHOTS: the clock jumps at t ${j.t.toFixed(2)} without a cut`);
}

function sfShotAt(t) { for (const s of SF_SHOTS) if (t >= s.t0 && t < s.t1) return s; return t < 0 ? SF_SHOTS[0] : SF_SHOTS[SF_SHOTS.length - 1]; }
function sfCutTimes(app) {
  const out = SF_SHOTS.map((s) => s.t0).filter((t) => t > 0);
  for (const s of Object.values((app && app.sets) || {})) if (s.cuts) out.push(...s.cuts());
  return out;
}
SCRIPT.events = SF_SHOTS.map((s) => ({ id: s.id, time: Math.max(0, s.t0), label: s.id + ' ' + s.mode }));
