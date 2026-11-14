/* =====================================================================
   SHOTS — every shot of the film, in order: { id, mode, t0, t1, set }. Cut points come from the captions (clock.js:
   shS, shC, shB, shE) and the story clock may only jump forward at a cut (the owner's rule of 2026-10-29: no replays).
   Sets: deck (level 4: the deck, the guard, your car), deck2 (level 2, camera 7), exit (the exit lane, street level).
   ===================================================================== */

const shSh = (id, mode, t0, t1, set) => ({ id, mode, t0, t1, set });

const SH_SHOTS = [];
{
  const P = SH_SHOTS, c = shC, B = shB;
  const L = [
    // 1 — 11:58 PM: out of the stair door onto level 4; your shadow stays in the doorway, then follows
    ['A0', 'door', -1, c('start', 1) + 2.2, 'deck'],
    ['A1', 'overview', c('start', 1) + 2.2, B('warn'), 'deck'],
    ['A2', 'aislePOV', B('warn'), B('light'), 'deck'],
    // what a shadow is; the lamp; 9 billionths of a second
    ['L1', 'floorSide', B('light'), c('light', 1) - 0.5, 'deck'],
    ['L2', 'lampPOV', c('light', 1) - 0.5, c('light', 3) - 0.5, 'deck'],
    ['L3', 'floorSide', c('light', 3) - 0.5, B('hand'), 'deck'],
    // the tests: your hand, your phone, the walk, the stop, the turn, the jump
    ['H1', 'handPOV', B('hand'), B('film'), 'deck'],
    ['F1', 'phonePOV', B('film'), B('walk'), 'deck'],
    ['W1', 'walkSide', B('walk'), B('stop'), 'deck'],
    ['S1', 'stop', B('stop'), B('turn'), 'deck'],
    ['T1', 'turn', B('turn'), B('jump'), 'deck'],
    ['J1', 'jump', B('jump'), B('mirror'), 'deck'],
    // the mirror (on time); the four lamps; the impossible part
    ['M1', 'mirrorPOV', B('mirror'), c('mirror', 1) - 0.5, 'deck'],
    ['M2', 'mirrorOTS', c('mirror', 1) - 0.5, B('lamps'), 'deck'],
    ['N1', 'top', B('lamps'), B('impossible'), 'deck'],
    ['I1', 'parapetWalk', B('impossible'), B('where'), 'deck'],
    // late compared to what? the town, the Earth turning under it
    ['R1', 'town', B('where'), c('where', 2) - 0.5, 'deck'],
    ['R2', 'outside', c('where', 2) - 0.5, c('where', 3) - 0.5, 'deck'],
    ['R3', 'parapetWalk', c('where', 3) - 0.5, B('midnight'), 'deck'],
    // 2 — 12:00 AM: half the lamps go off; footsteps; the pillar
    ['D1', 'midnight', B('midnight'), c('midnight', 1) - 0.5, 'deck'],
    ['D2', 'darker', c('midnight', 1) - 0.5, B('steps'), 'deck'],
    ['P1', 'stepsPOV', B('steps'), B('hide'), 'deck'],
    ['K1', 'hide', B('hide'), B('still'), 'deck'],
    ['Q1', 'still', B('still'), B('moving'), 'deck'],
    ['V1', 'moving', B('moving'), B('guard'), 'deck'],
    // the night guard; his torch; your shadow shields its eyes a second late
    ['G1', 'guard', B('guard'), c('guard', 1) - 0.5, 'deck'],
    ['G2', 'torch', c('guard', 1) - 0.5, B('seen'), 'deck'],
    ['E1', 'guardFace', B('seen'), B('radio'), 'deck'],
    ['E2', 'backAway', B('radio'), B('run'), 'deck'],
    // the run to your car
    ['U1', 'runStart', B('run'), c('run', 2) - 0.5, 'deck'],
    ['U2', 'runSide', c('run', 2) - 0.5, B('lock'), 'deck'],
    // 3 — in your car: the lock, out of the bay, away, the ramp
    ['O1', 'lockOut', B('lock'), B('car'), 'deck'],
    ['C1', 'reverse', B('car'), c('car', 1) - 0.5, 'deck'],
    ['C2', 'drive', c('car', 1) - 0.5, B('speed'), 'deck'],
    ['Z1', 'ramp', B('speed'), B('cctv'), 'deck'],
    // level 2: camera 7 (+34 s)
    ['V2', 'cctv', B('cctv'), B('exit'), 'deck2'],
    // the exit lane (+27 s): the barrier; the wall beside you; the back seat
    ['X1', 'exitWide', B('exit'), c('exit', 1) - 0.4, 'exit'],
    ['X2', 'exitWall', c('exit', 1) - 0.4, c('exit', 2) - 0.4, 'exit'],
    ['X3', 'exitClose', c('exit', 2) - 0.4, 1e9, 'exit'],
  ];
  for (const [id, mode, t0, t1, set] of L) P.push(shSh(id, mode, t0, t1, set));
  P.forEach((s, i) => { if (i && Math.abs(s.t0 - P[i - 1].t1) > 1e-6) throw new Error(`SH_SHOTS: a gap or overlap before ${s.id}`); if (!(s.t1 > s.t0)) throw new Error(`SH_SHOTS: ${s.id} has no length`); });
  // every clock jump must sit on a cut
  for (const j of SH_JUMPS) if (!P.some((s) => Math.abs(s.t0 - j.t) < 1e-6)) throw new Error(`SH_SHOTS: the clock jumps at t ${j.t.toFixed(2)} without a cut`);
}

function shShotAt(t) { for (const s of SH_SHOTS) if (t >= s.t0 && t < s.t1) return s; return t < 0 ? SH_SHOTS[0] : SH_SHOTS[SH_SHOTS.length - 1]; }
function shCutTimes(app) {
  const out = SH_SHOTS.map((s) => s.t0).filter((t) => t > 0);
  for (const s of Object.values((app && app.sets) || {})) if (s.cuts) out.push(...s.cuts());
  return out;
}
SCRIPT.events = SH_SHOTS.map((s) => ({ id: s.id, time: Math.max(0, s.t0), label: s.id + ' ' + s.mode }));
