/* =====================================================================
   SHOTS — every shot of "What If Earthquakes Got 1 Magnitude Stronger Every Minute?", in order:
   { id, set, mode, t0, t1, dia?, s? }. Cuts sit just before the narration's words (quake.js: eqW, eqWord) or just
   before a tick (eqTick: a new magnitude lands as a jolt on the cut). The new recipe: a new picture every 2–3 s in the
   first 15 s, 6–10 shots a minute. The cold open pins story time (s) to just after the film's last second (magnitude
   twelve: the planet cracking, the city tilting, your face), so no second is shown twice.
   Sets: sf (sf-set.js), world (world.js: the other cities), globe (globe.js). dia: a full-frame diagram (hud.js).
   ===================================================================== */

const EQ_SHOTS = [];
{
  const w = (id, text, i = 0, d = 0.3) => eqWord(id, text, i).start - d;      // just before a word
  const W = (id, k = 0, d = 0.3) => eqW(id, k) - d;                            // just before word k
  const T = (k, d = 0.1) => eqTick(k) - d;                                     // just before minute k's tick
  const E = (id, d = 0.3) => eqE_(id) + d;                                     // just after a line
  const END = EQN.duration - EQ.tick0;                                         // the last story second
  const L = [
    // ---- the cold open: magnitude twelve (pinned just after the last second)
    ['O1', 'globe', 'open', -1, 0.95, { s: END + 0.2 }],
    ['O2', 'sf', 'openSF', 0.95, 1.85, { s: END + 1.4 }],
    ['O3', 'sf', 'openFace', 1.85, 2.75, { s: END + 2.6 }],
    // ---- minute 1: magnitude 3 (the café)
    ['A1', 'sf', 'cafeWide', 2.75, w('sat', 'saturday')],
    ['A2', 'sf', 'aerialSF', w('sat', 'saturday'), w('sat', "you're")],
    ['A3', 'sf', 'helipad', w('sat', "you're"), E('sat', 0.2)],
    ['A4', 'sf', 'cupRipple', E('sat', 0.2), W('felt')],
    ['A5', 'sf', 'faceFelt', W('felt'), w('felt', 'california', 0, 0.25)],
    ['A6', 'globe', 'california', w('felt', 'california', 0, 0.25), W('lightning')],
    ['A7', 'sf', 'bayView', W('lightning'), W('but'), { dia: 'lightning' }],
    ['A8', 'sf', 'street', W('but'), W('rule')],
    ['A9', 'sf', 'ruleFace', W('rule'), W('x32')],
    ['AA', 'sf', 'terraceTop', W('x32'), w('x32', 'two'), { dia: 'x32' }],
    ['AB', 'sf', 'bayView2', w('x32', 'two'), W('realtime'), { dia: 'x1000' }],
    ['AC', 'sf', 'clock', W('realtime'), E('realtime', 0.6)],
    ['AD', 'sf', 'terraceRise', E('realtime', 0.6), W('cup')],
    ['AE', 'sf', 'cup', W('cup'), w('cup', 'except')],
    ['AF', 'sf', 'cupMacro', w('cup', 'except'), E('cup', 2.4)],
    ['AG', 'sf', 'calmWide', E('cup', 2.4), T(2)],
    // ---- minute 2: magnitude 4
    ['B1', 'sf', 'jolt4', T(2), W('truck')],
    ['B2', 'sf', 'truck', W('truck'), w('truck', 'locals')],
    ['B3', 'sf', 'locals', w('truck', 'locals'), W('long')],
    ['B4', 'sf', 'youSide', W('long'), W('faults'), { dia: 'seismo' }],
    ['B5', 'sf', 'faultMap', W('faults'), W('moab')],
    ['B6', 'sf', 'drone', W('moab'), W('birds'), { dia: 'moab' }],
    ['B7', 'sf', 'birds', W('birds'), W('tour')],
    ['B8', 'sf', 'pier', W('tour'), W('pilot')],
    ['B9', 'sf', 'pilotWave', W('pilot'), E('pilot', 3.5)],
    ['BA', 'sf', 'youSee', E('pilot', 3.5), T(3)],
    // ---- minute 3: magnitude 5
    ['C1', 'sf', 'jolt5', T(3), W('everyone')],
    ['C2', 'sf', 'everyone', W('everyone'), W('alert')],
    ['C3', 'sf', 'alert', W('alert'), E('alert', 0.1), { dia: 'alert' }],
    ['C4', 'sf', 'phones', E('alert', 0.1), W('tnt')],
    ['C5', 'sf', 'lowStreet', W('tnt'), W('crowd'), { dia: 'tnt' }],
    ['C6', 'sf', 'crowd', W('crowd'), W('drop')],
    ['C7', 'sf', 'drop', W('drop'), W('never')],
    ['C8', 'sf', 'never', W('never'), W('run')],
    ['C9', 'sf', 'run', W('run'), W('ferry')],
    ['CA', 'sf', 'ferry', W('ferry'), E('ferry', 0.4)],
    ['CB', 'sf', 'pierRun', E('ferry', 0.4), E('ferry', 5.0)],
    ['CC', 'sf', 'pierTrack', E('ferry', 5.0), E('ferry', 9.6)],
    ['CD', 'sf', 'pierHeli', E('ferry', 9.6), T(4)],
    // ---- minute 4: magnitude 6
    ['D1', 'sf', 'jolt6', T(4), W('hiro')],
    ['D2', 'sf', 'skyline', W('hiro'), W('smash'), { dia: 'hiro' }],
    ['D3', 'sf', 'windows', W('smash'), w('smash', 'chimneys')],
    ['D4', 'sf', 'chimneys', w('smash', 'chimneys'), w('smash', 'every')],
    ['D5', 'sf', 'alarms', w('smash', 'every'), W('streetcar')],
    ['D6', 'sf', 'streetcar', W('streetcar'), W('in')],
    ['D7', 'sf', 'in', W('in'), W('start')],
    ['D8', 'sf', 'start', W('start'), w('start', 'and')],
    ['D9', 'sf', 'startTwo', w('start', 'and'), W('mud'), { dia: 'twoMin' }],
    ['DA', 'sf', 'fillDia', W('mud'), w('mud', 'shaking'), { dia: 'mud' }],
    ['DB', 'sf', 'mudBoil', w('mud', 'shaking'), W('sink')],
    ['DC', 'sf', 'sink', W('sink'), E('sink', 3.5)],
    ['DD', 'sf', 'cockpitWait', E('sink', 3.5), E('sink', 8.0)],
    ['DE', 'sf', 'rotorUp', E('sink', 8.0), T(5)],
    // ---- minute 5: magnitude 7
    ['E1', 'sf', 'jolt7', T(5), W('haiti')],
    ['E2', 'sf', 'haiti', W('haiti'), W('brick')],
    ['E3', 'sf', 'brick', W('brick'), W('split')],
    ['E4', 'sf', 'split', W('split'), W('pier')],
    ['E5', 'sf', 'pierBreak', W('pier'), W('lift')],
    ['E6', 'sf', 'lift', W('lift'), W('sky')],
    ['E7', 'sf', 'sky', W('sky'), w('sky', 'the', 0, 0.25)],
    ['E8', 'sf', 'skyWide', w('sky', 'the', 0, 0.25), W('baybridge')],
    ['E9', 'sf', 'bayBridge', W('baybridge'), w('baybridge', 'this')],
    ['EA', 'sf', 'bayDrop', w('baybridge', 'this'), E('baybridge', 3.5)],
    ['EB', 'sf', 'heliOverBay', E('baybridge', 3.5), E('baybridge', 8.6)],
    ['EC', 'sf', 'downtown', E('baybridge', 8.6), T(6)],
    // ---- minute 6: magnitude 8 (it's not just yours)
    ['F1', 'sf', 'jolt8', T(6), W('y1906')],
    ['F2', 'sf', 'y1906', W('y1906'), W('fires'), { dia: 'y1906' }],
    ['F3', 'sf', 'fires', W('fires'), W('bravo')],
    ['F4', 'sf', 'wideCity', W('bravo'), W('pyramid'), { dia: 'bravo' }],
    ['F5', 'sf', 'pyramid', W('pyramid'), w('pyramid', 'not', 0, 0.9)],
    ['F5b', 'sf', 'pyramidFall', w('pyramid', 'not', 0, 0.9), W('golden')],
    ['F6', 'sf', 'golden', W('golden'), E('golden', 2.0)],
    ['F7', 'sf', 'ggFall', E('golden', 2.0), W('phone')],
    ['F8', 'sf', 'phoneLap', W('phone'), W('notjust'), { dia: 'phone' }],
    ['F9', 'globe', 'notjust', W('notjust'), w('notjust', 'and')],
    ['FA', 'globe', 'growing', w('notjust', 'and'), T(7)],
    // ---- minute 7: magnitude 9 (the bay drains, the wave)
    ['G1', 'sf', 'jolt9', T(7), W('japan')],
    ['G2', 'sf', 'japan', W('japan'), W('tsar')],
    ['G3', 'sf', 'tsarBg', W('tsar'), W('calm'), { dia: 'tsar' }],
    ['G4', 'sf', 'calm', W('calm'), W('empty')],
    ['G5', 'sf', 'empty', W('empty'), w('empty', 'sloshing')],
    ['G6', 'sf', 'drained', w('empty', 'sloshing'), W('back')],
    ['G7', 'sf', 'back', W('back'), W('cafe')],
    ['G8', 'sf', 'cafe', W('cafe'), W('la')],
    ['G9', 'world', 'la', W('la'), W('mexico')],
    ['GA', 'world', 'mexico', W('mexico'), w('mexico', 'so')],
    ['GB', 'world', 'jelly', w('mexico', 'so'), T(8), { dia: 'lakebed' }],
    // ---- minute 8: magnitude 10 (it has never happened)
    ['H1', 'sf', 'jolt10', T(8), W('never2')],
    ['H2', 'sf', 'recordBg', W('never2'), w('never2', 'nine'), { dia: 'record' }],
    ['H2b', 'sf', 'chile', w('never2', 'nine'), W('fault'), { dia: 'record' }],
    ['H3', 'sf', 'faultCrack', W('fault'), W('gravity')],
    ['H4', 'sf', 'gravity', W('gravity'), W('month')],
    ['H5', 'sf', 'ruins', W('month'), W('dam'), { dia: 'month' }],
    ['H6', 'world', 'dam', W('dam'), W('needle')],
    ['H7', 'world', 'needle', W('needle'), W('crack')],
    ['H8', 'globe', 'crackCoast', W('crack'), w('crack', 'it')],
    ['H8b', 'globe', 'crackLine', w('crack', 'it'), E('crack', 3.6)],
    ['H9', 'sf', 'crackSF', E('crack', 3.6), T(9)],
    // ---- minute 9: magnitude 11 (the world)
    ['I1', 'sf', 'jolt11', T(9), W('years')],
    ['I2', 'sf', 'yearsBg', W('years'), W('air'), { dia: 'years' }],
    ['I3', 'sf', 'air', W('air'), W('tokyo')],
    ['I4', 'world', 'tokyo', W('tokyo'), W('dubai')],
    ['I5', 'world', 'dubai', W('dubai'), W('istanbul')],
    ['I6', 'world', 'istanbul', W('istanbul'), W('dozens')],
    ['I7', 'globe', 'dozens', W('dozens'), W('fuel')],
    ['I8', 'sf', 'fuel', W('fuel'), W('nowhere')],
    ['I9', 'sf', 'nowhere', W('nowhere'), E('nowhere', 2.6)],
    ['IA', 'sf', 'below', E('nowhere', 2.6), T(10)],
    // ---- minute 10: magnitude 12
    ['J1', 'globe', 'jolt12', T(10), W('sun')],
    ['J2', 'globe', 'sun', W('sun'), W('cracking'), { dia: 'sun' }],
    ['J3', 'globe', 'cracking', W('cracking'), W('melt')],
    ['J4', 'sf', 'melt', W('melt'), W('dino')],
    ['J5', 'globe', 'dino', W('dino'), W('seven'), { dia: 'dino' }],
    ['J6', 'globe', 'seven', W('seven'), W('last'), { dia: 'seven' }],
    ['J7', 'sf', 'last', W('last'), W('question')],
    ['J8', 'sf', 'question', W('question'), EQN.duration + 1, { dia: 'question' }],
  ];
  for (const [id, set, mode, t0, t1, o] of L) EQ_SHOTS.push(Object.assign({ id, set, mode, t0, t1 }, o || {}));
  // (a diagram that runs on across a cut keeps its own clock: diaT0, the film time it started)
  EQ_SHOTS.forEach((s, i) => { if (s.dia) { const p = EQ_SHOTS[i - 1]; s.diaT0 = p && p.dia === s.dia ? p.diaT0 : s.t0; } });
  for (let i = 1; i < EQ_SHOTS.length; i++) {
    const a = EQ_SHOTS[i - 1], b = EQ_SHOTS[i];
    if (Math.abs(a.t1 - b.t0) > 1e-6 || !(b.t1 > b.t0 + 0.6)) throw new Error(`shots.js: ${a.id} → ${b.id} (${a.t1.toFixed(2)} / ${b.t0.toFixed(2)} → ${b.t1.toFixed(2)})`);
  }
}
function eqShotAt(t) { for (const s of EQ_SHOTS) if (t >= s.t0 && t < s.t1) return s; return t < 0 ? EQ_SHOTS[0] : EQ_SHOTS[EQ_SHOTS.length - 1]; }
function eqCutTimes() { return EQ_SHOTS.map((s) => s.t0).filter((t) => t > 0); }
SCRIPT.events = EQ_SHOTS.map((s) => ({ id: s.id, time: Math.max(0, s.t0), label: s.id + ' ' + s.mode }));
