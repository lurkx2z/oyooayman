/* =====================================================================
   SHOTS — every shot of "What If Every Step You Took Was Twice as Long?", in order: { id, set, mode, t0, t1 }.
   Cuts sit just before the narration's words (steps.js: twW, twWord, twE) or on a step (TW_T). The new recipe: a new
   picture every 2–3 s in the first 15 s, 6–10 shots a minute, something changing about every 5 s. The cold open is
   step ninety (a flash-forward); the end picks up after that moment, it never shows the same second again.
   Sets: nyc (street.js on nyc.js), sky (sky.js), space (space.js), deep (deep.js). A shot's mode picks its camera
   and what the set shows.
   ===================================================================== */

const TW_SHOTS = [];
{
  const w = (id, text, i = 0, d = 0.3) => twWord(id, text, i).start - d;       // just before a word
  const W = (id, k = 0, d = 0.3) => twW(id, k) - d;                             // just before word k
  const T = (n, d = 0.3) => TW_T[n] - d;                                        // just before step n
  const L = [
    // ---- the cold open: step ninety, then step one
    ['O1', 'deep', 'open', -1, W('one', 0, 0.15)],
    ['A1', 'nyc', 'stoop', W('one', 0, 0.15), W('late', 0)],
    ['A2', 'nyc', 'morning', W('late', 0), w('late', "you're")],
    ['A3', 'nyc', 'faceLate', w('late', "you're"), w('late', 'and')],
    ['A4', 'nyc', 'stoopSide', w('late', 'and'), w('late', 'take')],
    ['A5', 'nyc', 'feet', w('late', 'take'), T(2)],
    // ---- steps two to five
    ['B1', 'nyc', 'chase2', T(2), w('two', 'one')],
    ['B2', 'nyc', 'front2', w('two', 'one'), T(3)],
    ['C1', 'nyc', 'wide3', T(3), w('three', "that's")],
    ['C2', 'nyc', 'face3', w('three', "that's"), T(4, 0.35)],
    ['D1', 'nyc', 'leap4', T(4, 0.35), w('four', 'right')],
    ['D2', 'nyc', 'busStop', w('four', 'right'), w('four', 'bus', 0, 0.5)],
    ['D3', 'nyc', 'busArrive', w('four', 'bus', 0, 0.5), W('back', 0)],
    ['E1', 'nyc', 'lookBack', W('back', 0), T(5, 0.35)],
    ['E2', 'nyc', 'overBus', T(5, 0.35), w('five', 'the')],
    ['E3', 'nyc', 'busTop', w('five', 'the'), twE('five') + 0.4],
    ['E4', 'nyc', 'busFaces', twE('five') + 0.4, W('home', 0)],
    ['E5', 'nyc', 'doorway', W('home', 0), w('home', 'right')],
    ['E6', 'nyc', 'stoopTop', w('home', 'right'), W('rule', 0)],
    // ---- the rule
    ['F1', 'nyc', 'ruleA', W('rule', 0), w('rule', 'and')],
    ['F2', 'nyc', 'ruleB', w('rule', 'and'), W('sum', 0)],
    ['F3', 'nyc', 'sum', W('sum', 0), W('loop', 0)],
    ['F4', 'nyc', 'loop', W('loop', 0), w('loop', 'remember')],
    ['F5', 'nyc', 'remember', w('loop', 'remember'), W('work', 0)],
    ['G1', 'nyc', 'officeMap', W('work', 0), w('work', "you'll")],
    ['G2', 'nyc', 'walk', w('work', "you'll"), T(6)],
    // ---- steps six to nine, west along the street
    ['H1', 'nyc', 'chase6', T(6), w('six', "you're", 0, 0.9)],
    ['H2', 'nyc', 'taxi', w('six', "you're", 0, 0.9), T(7)],
    ['I1', 'nyc', 'side7', T(7), w('seven', 'a')],
    ['I2', 'nyc', 'speed7', w('seven', 'a'), W('crack', 0)],
    ['I3', 'nyc', 'crack', W('crack', 0), W('phones', 0)],
    ['J1', 'nyc', 'phones', W('phones', 0), T(8)],
    ['K1', 'nyc', 'leap8', T(8), w('eight', 'longer')],
    ['K2', 'nyc', 'statue', w('eight', 'longer'), T(9)],
    ['L1', 'nyc', 'leap9', T(9), w('nine', 'the', 0, 0.2)],
    ['L2', 'nyc', 'awnings', w('nine', 'the', 0, 0.2), W('warn', 0)],
    ['M1', 'nyc', 'promenade', W('warn', 0), T(10, 0.25)],
    // ---- step ten: the sound barrier
    ['N1', 'nyc', 'leap10', T(10, 0.25), w('ten', 'the')],
    ['N2', 'nyc', 'esb', w('ten', 'the'), w('ten', 'and', 1)],
    ['N3', 'nyc', 'cone', w('ten', 'and', 1), TW_T[10] + TW_D[10] + 0.15],
    ['N4', 'nyc', 'boomWide', TW_T[10] + TW_D[10] + 0.15, TW_T[10] + TW_D[10] + 2.3],
    ['N5', 'nyc', 'glass', TW_T[10] + TW_D[10] + 2.3, W('boom', 0, 0.1)],
    ['N6', 'nyc', 'boomStreet', W('boom', 0, 0.1), w('boom', 'every')],
    ['N7', 'nyc', 'windows', w('boom', 'every'), T(11)],
    // ---- steps eleven to fourteen: the bridge, Manhattan
    ['P1', 'nyc', 'leap11', T(11), w('eleven', 'twice')],
    ['P2', 'nyc', 'mach2', w('eleven', 'twice'), T(12)],
    ['Q1', 'nyc', 'bridge', T(12), w('twelve', 'most')],
    ['Q2', 'nyc', 'bridgeSide', w('twelve', 'most'), W('squeeze', 0)],
    ['R1', 'nyc', 'squeeze', W('squeeze', 0), w('squeeze', 'and')],
    ['R2', 'nyc', 'hot', w('squeeze', 'and'), T(13)],
    ['S1', 'nyc', 'leap13', T(13), w('thirteen', 'nine')],
    ['S2', 'nyc', 'mach9', w('thirteen', 'nine'), w('thirteen', 'the', 1, 0.2)],
    ['S3', 'nyc', 'glowing', w('thirteen', 'the', 1, 0.2), TW_T[13] + TW_D[13] + 0.05],
    ['S4', 'nyc', 'impact', TW_T[13] + TW_D[13] + 0.05, W('safe', 0)],
    ['T1', 'nyc', 'crater', W('safe', 0), w('safe', 'it')],
    ['T2', 'nyc', 'trail', w('safe', 'it'), T(14)],
    ['U1', 'nyc', 'leap14', T(14), w('fourteen', 'six')],
    ['U2', 'nyc', 'office', w('fourteen', 'six'), W('passed', 0)],
    ['U3', 'nyc', 'park', W('passed', 0), w('passed', 'and')],
    ['U4', 'nyc', 'missed', w('passed', 'and'), T(15)],
    // ---- step fifteen: away
    ['V1', 'nyc', 'leap15', T(15), w('fifteen', "that's")],
    ['V2', 'sky', 'escape', w('fifteen', "that's"), W('curve', 0)],
    ['V3', 'sky', 'curve', W('curve', 0), w('curve', "you're")],
    ['V4', 'sky', 'never', w('curve', "you're"), T(16)],
    ['W1', 'sky', 'meteor', T(16), w('meteor', 'low')],
    ['W2', 'sky', 'england', w('meteor', 'low'), W('boston', 0)],
    ['W3', 'sky', 'boston', W('boston', 0), T(20, 1.1)],
    ['W4', 'sky', 'climb', T(20, 1.1), W('space', 0)],
    // ---- space: Earth orbit to the Moon
    ['X1', 'space', 'space', W('space', 0), W('push', 0)],
    ['X2', 'space', 'push', W('push', 0), W('station', 0)],
    ['X3', 'space', 'station', W('station', 0), W('ninemin', 0)],
    ['X4', 'space', 'ninemin', W('ninemin', 0), W('radius', 0)],
    ['X5', 'space', 'radius', W('radius', 0), W('across', 0)],
    ['X6', 'space', 'across', W('across', 0), W('look', 0)],
    ['X7', 'space', 'look', W('look', 0), W('fifty', 0)],
    ['X8', 'space', 'fifty', W('fifty', 0), W('moon', 0)],
    ['X9', 'space', 'moon', W('moon', 0), W('problem', 0)],
    // ---- the light barrier
    ['Y1', 'space', 'problem', W('problem', 0), W('thirty', 0)],
    ['Y2', 'space', 'barrier', W('thirty', 0), W('nothing', 0)],
    ['Y3', 'space', 'nothing', W('nothing', 0), W('give', 0)],
    ['Y4', 'space', 'time', W('give', 0), W('clock', 0)],
    ['Y5', 'space', 'clocks', W('clock', 0), T(30, 0.4)],
    ['Y6', 'space', 'earth', T(30, 0.4), W('real', 0)],
    ['Y7', 'space', 'issAge', W('real', 0), w('real', 'for', 0, 0.4)],
    ['Y8', 'space', 'outward', w('real', 'for', 0, 0.4), W('mars', 0)],
    // ---- the planets
    ['Z1', 'space', 'mars', W('mars', 0), W('marstime', 0)],
    ['Z2', 'space', 'marstime', W('marstime', 0), W('sun', 0)],
    ['Z3', 'space', 'sun', W('sun', 0), w('sun', 'light')],
    ['Z4', 'space', 'light8', w('sun', 'light'), W('jupiter', 0)],
    ['Z5', 'space', 'jupiter', W('jupiter', 0), W('saturn', 0)],
    ['Z6', 'space', 'saturn', W('saturn', 0), W('pluto', 0)],
    ['Z7', 'space', 'pluto', W('pluto', 0), w('pluto', 'back')],
    ['Z8', 'nyc', 'evening', w('pluto', 'back'), w('pluto', 'your')],
    ['Z9', 'space', 'boss', w('pluto', 'your'), W('voyager', 0)],
    ['ZA', 'space', 'voyager', W('voyager', 0), w('voyager', "it's")],
    ['ZB', 'space', 'caught', w('voyager', "it's"), W('day', 0)],
    ['ZC', 'space', 'day', W('day', 0), W('star', 0)],
    ['ZD', 'space', 'star', W('star', 0), W('month', 0)],
    ['ZE', 'space', 'month', W('month', 0), W('poster', 0)],
    ['ZF', 'nyc', 'poster', W('poster', 0), W('ninemonths', 0)],
    ['ZG', 'space', 'ninemonths', W('ninemonths', 0), W('proxima', 0)],
    ['ZH', 'space', 'proxima', W('proxima', 0), W('sixyears', 0)],
    ['ZI', 'space', 'sixyears', W('sixyears', 0), W('turn', 0)],
    // ---- the turn, and on into the deep
    ['AA', 'deep', 'turn', W('turn', 0), W('eleven_years', 0)],
    ['AB', 'nyc', 'future', W('eleven_years', 0), W('keep', 0)],
    ['AC', 'deep', 'keep', W('keep', 0), W('sixty', 0)],
    ['AD', 'deep', 'sixty', W('sixty', 0), W('sixtyfour', 0)],
    ['AE', 'deep', 'sixtyfour', W('sixtyfour', 0), W('climb', 0)],
    ['AF', 'deep', 'climb', W('climb', 0), W('seventy', 0)],
    ['AG', 'deep', 'milkyway', W('seventy', 0), w('seventy', 'and')],
    ['AH', 'deep', 'mwHere', w('seventy', 'and'), W('humans', 0)],
    ['AI', 'deep', 'humans', W('humans', 0), W('andromeda', 0)],
    ['AJ', 'deep', 'andromeda', W('andromeda', 0), W('dust', 0)],
    ['AK', 'deep', 'dust', W('dust', 0), W('web', 0)],
    ['AL', 'deep', 'web', W('web', 0), w('web', 'nobody')],
    ['AM', 'deep', 'webOut', w('web', 'nobody'), W('sundies', 0)],
    ['AN', 'space', 'redgiant', W('sundies', 0), w('sundies', 'it', 0, 0.4)],
    ['AO', 'space', 'swallow', w('sundies', 'it', 0, 0.4), W('ninety', 0)],
    ['AP', 'deep', 'ninety', W('ninety', 0), W('last', 0)],
    ['AQ', 'deep', 'last', W('last', 0), W('or', 0)],
    ['AR', 'deep', 'or', W('or', 0), W('question', 0)],
    ['AS', 'deep', 'question', W('question', 0), TW.end + 1],
  ];
  for (const [id, set, mode, t0, t1] of L) TW_SHOTS.push({ id, set, mode, t0, t1 });
  for (let i = 1; i < TW_SHOTS.length; i++) {
    const a = TW_SHOTS[i - 1], b = TW_SHOTS[i];
    if (Math.abs(a.t1 - b.t0) > 1e-6 || !(b.t1 > b.t0 + 0.6)) throw new Error(`shots.js: ${a.id} → ${b.id} (${a.t1.toFixed(2)} / ${b.t0.toFixed(2)} → ${b.t1.toFixed(2)})`);
  }
}
function twShotAt(t) { for (const s of TW_SHOTS) if (t >= s.t0 && t < s.t1) return s; return t < 0 ? TW_SHOTS[0] : TW_SHOTS[TW_SHOTS.length - 1]; }
function twCutTimes() { return TW_SHOTS.map((s) => s.t0).filter((t) => t > 0); }
SCRIPT.events = TW_SHOTS.map((s) => ({ id: s.id, time: Math.max(0, s.t0), label: s.id + ' ' + s.mode }));
