/* =====================================================================
   SHOTS — every shot of the film, in order: { id, mode, t0, t1, set }. Cut points come from the captions (clock.js:
   atS, atC, atB, atE) and the story clock jumps forward only at a cut that is one of clock.js's anchors (the owner's
   rule of 2026-10-29: no replays). One set (ship); a shot's mode picks its camera (set.js set.cams).
   ===================================================================== */

const atSh = (id, mode, t0, t1, set = 'ship') => ({ id, mode, t0, t1, set });
// the cut where clock.js's anchor (beat, caption, lead) jumps the story clock
const atJ = (id, k) => { const a = AT_ANCHORS.find((x) => x[0] === id && x[1] === k); return atC(id, k) - (a[3] ?? 0.6); };

const AT_SHOTS = [];
{
  const c = atC, B = atB, J = atJ, pop = atFilmAt(ATE.balloonPop), roll = atFilmAt(ATE.roll);
  const L = [
    // 9:59:56 AM: the pool deck, a boy's cannonball; at 10:00:00 the first 1% goes. Nobody notices.
    ['T1', 'title', -1, AT.tOn],
    ['S1', 'aerial', AT.tOn, c('start', 1) - 0.5],
    ['S2', 'deck', c('start', 1) - 0.5, c('start', 2) - 0.5],
    ['S3', 'girl', c('start', 2) - 0.5, B('weight')],
    // the weight of the air; 1% = 85 m
    ['W1', 'sky', B('weight'), c('weight', 1) - 0.5],
    ['W2', 'terrace', c('weight', 1) - 0.5, c('weight', 2) - 0.5],
    ['W3', 'climb', c('weight', 2) - 0.5, J('boil', 0)],
    // the sea will boil at 3:39; there's nowhere lower to go (the 10:01 step on screen)
    ['B1', 'rail', J('boil', 0), c('boil', 1) - 0.5],
    ['B2', 'seaLevel', c('boil', 1) - 0.5, J('ears', 0)],
    // 10:10: ears; the balloon swelling (the 10:11 step on screen)
    ['E1', 'jaw', J('ears', 0), c('ears', 1) - 0.5],
    ['E2', 'balloon', c('ears', 1) - 0.5, J('storm', 0)],
    // 10:15: below Typhoon Tip's 870 hPa
    ['St1', 'bridge', J('storm', 0), c('storm', 1) - 0.5],
    ['St2', 'bow', c('storm', 1) - 0.5, J('cabin', 0)],
    // 10:29: as thin as an airliner's cabin; things swell; the balloon bursts on the 10:30 step
    ['C1', 'cabinDeck', J('cabin', 0), c('cabin', 1) - 0.5],
    ['C2', 'swell', c('cabin', 1) - 0.5, pop - 1.6],
    ['C3', 'pop', pop - 1.6, J('fizz', 0)],
    // 10:35: the drinks foam over
    ['F1', 'bar', J('fizz', 0), c('fizz', 1) - 0.5],
    ['F2', 'glass', c('fizz', 1) - 0.5, J('stairs', 0)],
    // 10:44: the stairs; the man by the pool; 13 decks down
    ['Sr1', 'climbers', J('stairs', 0), c('stairs', 1) - 0.5],
    ['Sr2', 'oldMan', c('stairs', 1) - 0.5, c('stairs', 2) - 0.5],
    ['Sr3', 'down13', c('stairs', 2) - 0.5, J('tanks', 0)],
    // 10:46: you; the regulator; 10 m of sea = the whole sky; six tanks
    ['K1', 'you', J('tanks', 0), c('tanks', 1) - 0.5],
    ['K2', 'gasping', c('tanks', 1) - 0.5, c('tanks', 2) - 0.5],
    ['K3', 'underEst', c('tanks', 2) - 0.5, c('tanks', 3) - 0.5],
    ['K4', 'rack', c('tanks', 3) - 0.5, J('down', 0)],
    // 10:52: down the stairs; the girl; her hand
    ['D1', 'stairsDown', J('down', 0), c('down', 1) - 0.5],
    ['D2', 'girlStairs', c('down', 1) - 0.5, c('down', 2) - 0.5],
    ['D3', 'hand', c('down', 2) - 0.5, J('engines', 0)],
    // 11:08: the engines choke (black smoke); 11:13: the power fails
    ['N1', 'funnel', J('engines', 0), c('engines', 0) + 2.6],
    ['N2', 'smokeAerial', c('engines', 0) + 2.6, J('engines', 1)],
    ['N3', 'screen', J('engines', 1), J('marina', 0)],
    // 11:20: deck 2; clumsy hands, tunnel vision; minutes
    ['M1', 'marina', J('marina', 0), c('marina', 1) - 0.5],
    ['M2', 'pov', c('marina', 1) - 0.5, c('marina', 2) - 0.5],
    ['M3', 'girlMask', c('marina', 2) - 0.5, J('dive', 0)],
    // the line; the backward roll; sinking
    ['V1', 'lineUW', J('dive', 0), c('dive', 1) - 0.5],
    ['V2', 'roll', c('dive', 1) - 0.5, roll + 0.75],
    ['V3', 'sink', roll + 0.75, J('under', 0)],
    // 10 m down: you can breathe; 4,300 people above can't
    ['U1', 'pair', J('under', 0), c('under', 1) - 0.5],
    ['U2', 'breathe', c('under', 1) - 0.5, c('under', 2) - 0.5],
    ['U3', 'upHull', c('under', 2) - 0.5, J('everest', 0)],
    // 11:56: Everest; nobody awake
    ['Ev1', 'still', J('everest', 0), c('everest', 1) - 0.5],
    ['Ev2', 'stillHand', c('everest', 1) - 0.5, J('shark', 0)],
    // 12:30: the fish; the whitetip; circling
    ['Sh1', 'fish', J('shark', 0), c('shark', 1) - 0.5],
    ['Sh2', 'sharkIn', c('shark', 1) - 0.5, c('shark', 2) - 0.5],
    ['Sh3', 'circle', c('shark', 2) - 0.5, J('oxygen', 0)],
    // 1:11 PM: the bridge wing
    ['O1', 'officer', J('oxygen', 0), J('rise', 0)],
    // 1:19: she lets go; kicking for the light; her fin
    ['R1', 'letGo', J('rise', 0), c('rise', 1) - 0.5],
    ['R2', 'kick', c('rise', 1) - 0.5, c('rise', 2) - 0.7],
    ['R3', 'catch', c('rise', 2) - 0.7, J('sky', 0)],
    // 1:40: the sky going dark
    ['Sk1', 'darkSky', J('sky', 0), J('tubs', 0)],
    // 2:26: the hot tubs boil (on screen); 2:37: body temperature
    ['Tb1', 'tub', J('tubs', 0), c('tubs', 0) + 2.4],
    ['Tb2', 'tubWide', c('tubs', 0) + 2.4, J('tubs', 1)],
    ['Tb3', 'bodyTemp', J('tubs', 1), c('tubs', 2) - 0.5],
    ['Tb4', 'calm', c('tubs', 2) - 0.5, J('stars', 0)],
    // 3:00: stars in full sunshine
    ['Sr4', 'stars', J('stars', 0), c('stars', 1) - 0.5],
    ['Sr5', 'starsFunnel', c('stars', 1) - 0.5, J('sea', 0)],
    // 3:27 the pool boils; 3:39 the ocean
    ['Se1', 'poolBoil', J('sea', 0), J('sea', 1)],
    ['Se2', 'seaBoil', J('sea', 1), c('sea', 2) - 0.5],
    ['Se3', 'ceiling', c('sea', 2) - 0.5, B('last')],
    // the last tank; the stars; the question
    ['L1', 'tankClose', B('last'), c('last', 1) - 0.5],
    ['L2', 'up', c('last', 1) - 0.5, B('question')],
    ['Q1', 'question', B('question'), AT.end + 1],
  ];
  for (const [id, mode, t0, t1] of L) AT_SHOTS.push(atSh(id, mode, t0, t1));
  // (checks: in order, no gaps, every clock jump on a cut)
  for (let i = 1; i < AT_SHOTS.length; i++) { const a = AT_SHOTS[i - 1], b = AT_SHOTS[i]; if (Math.abs(a.t1 - b.t0) > 1e-6 || !(b.t1 > b.t0)) throw new Error(`shots.js: ${a.id} → ${b.id} (${a.t1.toFixed(2)} / ${b.t0.toFixed(2)} → ${b.t1.toFixed(2)})`); }
  for (const j of AT_JUMPS) if (!AT_SHOTS.some((sh) => Math.abs(sh.t0 - j.t) < 1e-6)) throw new Error(`shots.js: the clock jumps at ${j.t.toFixed(2)} s, but nothing cuts there`);
}
function atShotAt(t) { for (const s of AT_SHOTS) if (t >= s.t0 && t < s.t1) return s; return t < 0 ? AT_SHOTS[0] : AT_SHOTS[AT_SHOTS.length - 1]; }
function atCutTimes() { return AT_SHOTS.map((s) => s.t0).filter((t) => t > 0); }
SCRIPT.events = AT_SHOTS.map((s) => ({ id: s.id, time: Math.max(0, s.t0), label: s.id + ' ' + s.mode }));
