/* =====================================================================
   SCRIPT — "Would you actually be generous if you suddenly became a billionaire?" (16:9, 1920×1080, 30 fps,
   ≈ 7.6 min, voiceless).
   ★ The edit is built AROUND THE CAPTIONS: every beat below comes from the caption times (window.SBT, written by
   build-timing.cjs from CAPTIONS.md). Change a pause → edit PAUSE there and re-run it.
   The places: your car at a crossing ten years from now (the cold open), your flat, the house, your old street, a
   lab (the studies), the marina, downtown, a Dutch street, the crossing again. The money is in money.js.
   Everything is a pure function of film time.
   ===================================================================== */

const SBT_ID = Object.fromEntries(SBT.groups.map((g) => [g.id, g]));
// the first word of beat `id` (from word index `from`, counted across its captions) that starts with `txt`
function sbW(id, txt, from = 0) {
  const k = txt.toLowerCase(), ws = SBT_ID[id].caps.flatMap((c) => c.words);
  for (let i = from; i < ws.length; i++) if (ws[i].text.toLowerCase().replace(/[^a-z0-9']/g, '').startsWith(k)) return ws[i];
  throw new Error(`sbW: "${txt}" not found in beat ${id}`);
}
const sbS = (id) => SBT_ID[id].first;         // the beat's first caption appears
const sbE = (id) => SBT_ID[id].end;           // its last caption goes
const sbCap = (id, k) => SBT_ID[id].caps[k];  // a caption: { text, show, hide, words }

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (film seconds). Every other file keys off these.
// ---------------------------------------------------------------------------------------------------------------------
const SB = {};
// 1 — the cold open (ten years from now: your car, the crossing in the rain), the title
SB.titleShot = sbS('title') - 0.55;
SB.title = [sbS('title') - 0.3, sbE('title') + 0.6];
SB.coldPass = sbCap('open', 2).show + 0.2;             // you roll over the crossing, eyes on your phone (she steps back)
// 2 — the flat, the draw
SB.flat = sbS('flat') - 0.45;
SB.rent = sbCap('flat', 1).show;
SB.draw = sbS('draw') - 0.45;
SB.ticket = sbCap('draw', 1).show - 0.2;
SB.balls = sbS('balls') - 0.5;
// the six balls: the moment each one settles (the first with "First", the last with "last")
SB.ball = [sbW('balls', 'first').start + 0.25, sbW('balls', 'second').start + 0.1, sbW('balls', 'third').start + 0.05, sbW('balls', 'fourth').start + 0.05,
  sbW('balls', 'fifth').start + 0.05, sbW('balls', 'last').start + 0.55];
SB.won = sbS('won') - 0.7;
SB.billion = sbW('won', 'one').start - 0.1;            // the readout rolls to a billion
SB.scale = sbS('scale') - 0.45;
SB.cashUp = sbCap('scale', 1).show - 0.2;              // the notes rise to your chest
SB.cashTop = sbCap('scale', 1).hide - 0.3;
SB.promise = sbS('promise') - 0.45;
SB.write = sbCap('promise', 1).show + 0.3;             // you write the note …
SB.stick = sbCap('promise', 2).show + 0.4;             // … and stick it on the fridge
// 3 — day one: giving; day three: everyone wants some
SB.mum = sbS('mum') - 0.6;
SB.sendMum = sbCap('mum', 0).show + 1.6;
SB.sendFriend = sbCap('mum', 1).show + 1.0;
SB.dunn = sbS('dunn') - 0.45;
SB.out = sbS('out') - 0.6;
SB.who = sbS('who') - 0.4;
SB.trust = sbS('trust') - 0.45;
SB.knock = sbCap('trust', 1).show - 0.6;               // someone at the door
SB.interest = sbS('interest') - 0.6;
// 4 — the house, your old street, month six
SB.house = sbS('house') - 0.6;
SB.buyHouse = sbCap('house', 0).show + 1.0;
SB.garage = sbCap('house', 2).show - 0.5;
SB.buyCar = sbCap('house', 2).show + 0.5;
SB.neighbours = sbS('neighbours') - 0.6;
SB.six = sbS('six') - 0.6;
SB.brick = sbS('brick') - 0.45;
SB.sweden = sbCap('brick', 3).show - 0.3;
SB.enough = sbS('enough') - 0.5;
SB.compare = sbS('compare') - 0.45;
// 5 — power: the company, the studies
SB.boss = sbS('boss') - 0.6;
SB.cookies = sbS('cookies') - 0.6;
SB.charge = sbCap('cookies', 1).show + 0.4;            // the card that says you're in charge
SB.plate = sbCap('cookies', 2).show + 0.5;             // five cookies
SB.cookie2 = sbS('cookie2') - 0.45;
SB.extra = sbCap('cookie2', 0).show + 1.4;             // you take the extra one
SB.game = sbS('game') - 0.6;
SB.flip = sbCap('game', 1).show + 0.2;                 // the coin
SB.game2 = sbS('game2') - 0.45;
SB.slap = sbCap('game2', 0).show + 0.5;
SB.pretzel = sbCap('game2', 1).show + 0.3;
SB.winGame = sbCap('game2', 2).show + 0.2;
SB.candy = sbS('candy') - 0.5;
SB.grab = sbCap('candy', 1).show + 0.2;
SB.views = sbS('views') - 0.5;
SB.channel = sbCap('views', 1).show + 1.2;             // you change the channel
// 6 — year two: the yacht, the wall
SB.yacht = sbS('yacht') - 0.6;
SB.buyYacht = sbCap('yacht', 0).show + 1.1;
SB.bigYacht = sbCap('yacht', 1).show - 0.3;
SB.wall = sbS('wall') - 0.5;
SB.buyWall = sbCap('wall', 0).show + 1.2;
SB.gateShut = sbCap('wall', 1).show - 0.2;
// 7 — year three: downtown; the crossing
SB.walk = sbS('walk') - 0.6;
SB.glass = sbS('glass') - 0.45;
SB.glass2 = sbS('glass2') - 0.4;
SB.drive = sbS('drive') - 0.6;
SB.nostop = sbS('nostop') - 0.45;
SB.dayPass = sbCap('nostop', 0).show + 0.8;            // you roll over the crossing (daylight)
// 8 — years five to nine; the note; the Giving Pledge
SB.years = sbS('years') - 0.6;
SB.give10 = sbCap('years', 1).show + 0.9;
SB.give5 = sbW('years', '5').start + 0.2;
SB.note = sbS('note') - 0.6;
SB.pledge = sbS('pledge') - 0.45;
// 9 — is any of this real; the counter-evidence; Feeney
SB.real = sbS('real') - 0.7;
SB.letters = sbS('letters') - 0.6;
SB.scott = sbS('scott') - 0.6;
SB.scottGive = sbCap('scott', 2).show - 0.2;               // her gifts light the wall
SB.feeney = sbS('feeney') - 0.6;
// 10 — the crossing again; the question
SB.point = sbS('point') - 0.7;
SB.again = sbS('again') - 0.6;
SB.brakeAt = sbCap('again', 1).show - 0.2;             // this time, you stop
SB.herCross = sbCap('again', 1).show + 0.6;            // she crosses in your headlights
SB.herLook = sbCap('again', 2).show + 0.2;             // she looks at you; you lift a hand
SB.question = sbS('question') - 0.6;
SB.end = SBT.duration;

CONFIG.duration = SB.end;
CONFIG.seed = 20261026;
Object.assign(CONFIG.camera, { cameraHeight: 1.62, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 55, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;

const SCRIPT = {
  meta: { title: 'Would you actually be generous if you suddenly became a billionaire?', wav: 'sudden-billionaire-soundtrack.wav' },
  events: [
    { id: 's1', time: 0, label: '1 · ten years from now' }, { id: 'title', time: SB.title[0], label: 'title' },
    { id: 's2', time: SB.flat, label: '2 · your flat · the draw' }, { id: 'won', time: SB.billion, label: '★ a billion' },
    { id: 's3', time: SB.mum, label: '3 · day one · day three' }, { id: 's4', time: SB.house, label: '4 · the house · month six' },
    { id: 's5', time: SB.boss, label: '5 · power' }, { id: 's6', time: SB.yacht, label: '6 · year two' },
    { id: 's7', time: SB.walk, label: '7 · year three' }, { id: 's8', time: SB.years, label: '8 · years 5–9 · the note' },
    { id: 's9', time: SB.real, label: '9 · is any of this real' }, { id: 's10', time: SB.point, label: '10 · the crossing again' },
    { id: 'q', time: SB.question, label: 'question' },
  ],
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.62]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 55]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: {
    title: { in: SB.title[0], out: SB.title[1], fi: 0.25, fo: 0.5, cls: 'big center', html: '<span class="kick">WOULD YOU ACTUALLY BE</span><span class="hero">GENEROUS</span><span class="kick k2">IF YOU SUDDENLY BECAME A BILLIONAIRE?</span>' },
    captions: [],
    readouts: [],
  },
};
const SCRIPT_TRACKS = {};
