/* =====================================================================
   SCRIPT — "Is it true time moves slower on your feet than your head?" (16:9, 1920×1080, 30 fps, ≈ 7.5 min, voiceless).
   ★ The edit is built AROUND THE CAPTIONS: every beat below comes from the caption times (window.TFT, written by
   build-timing.cjs from CAPTIONS.md). Change a pause → edit PAUSE there and re-run it.
   The places: a black hole's edge (the cold open), your hallway, a lab, the sky over Tokyo, orbit, Sirius B, a neutron
   star, Sagittarius A*, home again. Each place's own clock (the two clocks on the pole, head and feet) is set here.
   Everything is a pure function of film time.
   ===================================================================== */

const TFT_ID = Object.fromEntries(TFT.groups.map((g) => [g.id, g]));
// the first word of beat `id` (from word index `from`, counted across its captions) that starts with `txt`
function tfW(id, txt, from = 0) {
  const k = txt.toLowerCase(), ws = TFT_ID[id].caps.flatMap((c) => c.words);
  for (let i = from; i < ws.length; i++) if (ws[i].text.toLowerCase().replace(/[^a-z0-9']/g, '').startsWith(k)) return ws[i];
  throw new Error(`tfW: "${txt}" not found in beat ${id}`);
}
const tfS = (id) => TFT_ID[id].first;         // the beat's first caption appears
const tfE = (id) => TFT_ID[id].end;           // its last caption goes
const tfCap = (id, k) => TFT_ID[id].caps[k];  // a caption: { text, show, hide, words }

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (film seconds). Every other file keys off these.
// ---------------------------------------------------------------------------------------------------------------------
const TF = {};
// 1 — the cold open (the black hole's edge), the title
TF.titleShot = tfS('title') - 0.55;
TF.title = [tfS('title') - 0.3, tfE('title') + 0.6];
TF.coldUp = tfCap('open', 1).show - 0.6;               // the camera climbs the pole to your head's clock
TF.coldSky = tfCap('open', 2).show - 0.4;              // … and up to the sky: one bright point
// 2 — your hallway
TF.hall = tfS('hall') - 0.45;
TF.precise = tfCap('hall', 2).show - 0.3;
TF.pole = tfS('pole') - 0.4;
TF.start = tfW('pole', 'started').start + 0.35;        // ★ both clocks start (a beep)
TF.drift = tfS('drift') - 0.4;
TF.yes = tfS('yes') - 0.45;
TF.year = tfS('year') - 0.45;
TF.yearGo = tfCap('year', 0).hide - 0.2;               // the year runs (sped up)
TF.yearEnd = tfCap('year', 1).show - 0.1;
TF.life = tfS('life') - 0.5;
TF.lifeEnd = tfCap('life', 0).hide - 0.4;
TF.bigBang = tfCap('life', 1).show - 0.2;
TF.cat = tfS('cat') - 0.5;
TF.lie = tfS('lie') - 0.45;
TF.hand = tfS('hand') - 0.45;
TF.upstairs = tfS('upstairs') - 0.45;
// 3 — measured
TF.measured = tfS('measured') - 0.7;
TF.pound = tfS('pound') - 0.45;
TF.planes = tfS('planes') - 0.45;
TF.nist = tfS('nist') - 0.45;
TF.lift = tfW('nist', 'raised').start;                 // the clock goes up 33 cm
TF.skytree = tfS('skytree') - 0.9;
TF.jila = tfS('jila') - 0.5;
// 4 — GPS, the Moon
TF.gps = tfS('gps') - 1.2;
TF.gps2 = tfS('gps2') - 0.4;
TF.gps3 = tfS('gps3') - 0.4;
TF.phone = tfCap('gps3', 2).show - 0.3;
TF.moon = tfS('moon') - 0.7;
// 5 — why: gravity is time
TF.why = tfS('why') - 0.7;
TF.fall = tfS('fall') - 0.4;
TF.drop = tfW('fall', 'things').start - 0.3;           // the ball drops
TF.maths = tfS('maths') - 0.4;
TF.pull = tfS('pull') - 0.4;
// 6 — stronger: Sirius B
TF.bigger = tfS('bigger') - 0.5;
TF.go = tfCap('bigger', 2).show + 0.4;                 // up through the window, out to the stars
TF.wd = tfS('wd') - 2.6;                               // the flight to Sirius
TF.wdLand = tfCap('wd', 2).show - 0.4;                 // on the surface
TF.wd2 = tfS('wd2') - 0.4;
TF.wd3 = tfS('wd3') - 0.4;
TF.wd4 = tfS('wd4') - 0.4;
// 7 — a neutron star
TF.ns = tfS('ns') - 2.4;
TF.ns2 = tfS('ns2') - 0.4;
TF.nsLand = tfS('ns3') - 1.2;
TF.ns4 = tfS('ns4') - 0.4;
TF.ns5 = tfS('ns5') - 0.4;
// 8 — Sagittarius A*
TF.bh = tfS('bh') - 2.6;
TF.bh2 = tfS('bh2') - 0.4;
TF.board = tfCap('bh2', 1).show - 0.2;                  // the platform
TF.sphere = tfS('sphere') - 2.2;                       // down to the photon sphere
TF.lower = tfS('lower') - 0.5;
TF.ten = tfS('ten') - 0.8;
TF.red = tfS('red') - 0.3;
TF.two = tfS('two') - 0.4;
TF.slow = tfS('slow') - 0.4;
TF.wiggle = tfCap('slow', 0).show + 0.4;               // you wiggle your toes
TF.eleven = tfS('eleven') - 0.4;
TF.day = tfS('day') - 0.45;
TF.outside = tfS('outside') - 0.45;
TF.edge = tfS('edge') - 0.45;
TF.freeze = tfCap('edge', 1).show;
TF.feel = tfS('feel') - 0.45;
TF.feetView = tfCap('feel', 1).show - 0.25;             // from your feet: your head racing
// 9 — is any of this real; home; the question
TF.real = tfS('real') - 1.2;
TF.made = tfS('made') - 0.3;
TF.home = tfS('home') - 0.5;
TF.question = tfS('question') - 0.6;
TF.end = TFT.duration;

// ---------------------------------------------------------------------------------------------------------------------
// THE PLATFORM ABOVE THE BLACK HOLE: your feet's height above the edge ρ (m), and the camera's distance from the hole
// in r_s (for the sky). Keys [t, ρ] interpolated in log ρ. The cold open is ρ = 4.7 mm (365×).
// ---------------------------------------------------------------------------------------------------------------------
TF.rhoDay = TFP.h / (365 - 1);
const TF_RHO = [
  [TF.ten - 0.4, 10], [tfS('ten') + 0.6, 10], [tfS('red') + 2.2, 4.2], [tfE('red'), 2.6], [tfS('two') + 0.5, TFP.h], [tfE('two') + 3.0, TFP.h],
  [tfS('eleven') + 0.3, 0.17], [tfE('eleven') + 0.6, 0.17], [tfS('day') + 0.3, TF.rhoDay], [tfE('outside'), TF.rhoDay],
  [TF.freeze - 0.2, TF.rhoDay * 0.7], [TF.freeze + 2.6, 2e-5], [TF.end, 2e-5],
];
function tfRho(t) {
  if (t < TF.titleShot) return TF.rhoDay;
  const K = TF_RHO; if (t <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (t <= K[i][0]) { const [t0, a] = K[i - 1], [t1, b] = K[i], u = Ease.inOutSine((t - t0) / (t1 - t0)); return Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * u); }
  return K[K.length - 1][1];
}
// the camera's radius (in r_s) during the fall: far away → the platform's start → the photon sphere → just above the
// edge (the platform scenes use the shrinking circle directly: the sky there is one bright point)
const TF_BHR = [[TF.bh, 40], [TF.bh2 + 0.5, 14], [TF.board + 1.5, 5], [TF.sphere, 3.2], [tfS('sphere') + 0.6, 1.5], [tfE('sphere') + 0.2, 1.5], [tfS('lower') + 1.2, 1.05], [tfE('lower'), 1.0004], [TF.ten, 1.0004]];
function tfBhR(t) {
  const K = TF_BHR; if (t <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (t <= K[i][0]) { const [t0, a] = K[i - 1], [t1, b] = K[i], u = Ease.inOutSine((t - t0) / (t1 - t0)); return 1 + Math.exp(Math.log(a - 1) + (Math.log(b - 1) - Math.log(a - 1)) * u); }
  return K[K.length - 1][1];
}

// ---------------------------------------------------------------------------------------------------------------------
// THE TWO CLOCKS ON THE POLE (head and feet): seconds since they started at 7:00:00, and the gap between them.
// clock(t) → { T (head), gap (s), feetRate (feet s per head s), sped (how much faster than real time), place }
// ---------------------------------------------------------------------------------------------------------------------
// the sped-up stretches at home: a year in about 5 s, then a lifetime
const TF_HOME_T = [[TF.start, 0], [TF.yearGo, (TF.yearGo - TF.start)], [TF.yearEnd, TFP.year], [TF.life + 0.3, TFP.year * 1.0001], [TF.lifeEnd, TFP.year * 80], [TF.upstairs + 6, TFP.year * 80 + 30]];
function tfHomeT(t) {
  const K = TF_HOME_T; if (t <= K[0][0]) return 0;
  for (let i = 1; i < K.length; i++) if (t <= K[i][0]) {
    const [t0, a] = K[i - 1], [t1, b] = K[i], u = (t - t0) / (t1 - t0);
    // (log-speed within a sped-up stretch: it starts slow, gathers pace)
    if (b > a * 50 && a > 0) return Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * Ease.inOutSine(u));
    if (b > 1e5 && a < 100) return a + (b - a) * Math.pow(u, 3.2);
    return a + (b - a) * u;
  }
  return K[K.length - 1][1] + (t - K[K.length - 1][0]);
}
// the pole lies down (both clocks level: the gap stops growing), then stands on its head (it shrinks): how much less
// gap than standing would have given, s (the pole's own moves are in home.js: TF.poleDown … TF.poleUp)
TF.poleDown = tfS('lie') + 0.9; TF.poleLevel = TF.poleDown + 1.1;
TF.poleFlip = tfS('hand') + 0.6; TF.poleFlipped = TF.poleFlip + 1.2;
TF.poleBack = TF.upstairs + 0.2;
function tfPoseGap(t) {
  const lie = MathX.clamp(t, TF.poleLevel, TF.poleFlip) - TF.poleLevel, hand = MathX.clamp(t, TF.poleFlipped, TF.poleBack) - TF.poleFlipped;
  return TFP.gapE * (Math.max(0, lie) + 2 * Math.max(0, hand));
}
// a day at a dead star, sped up (white dwarf, neutron star): real time, then a day in a few seconds
function tfDayT(t, a, b) { if (t < a) return Math.max(0, t - (a - 6)); const u = MathX.clamp((t - a) / (b - a), 0, 1); return 6 + (TFP.day - 6) * Math.pow(Ease.inOutSine(u), 2.2) + Math.max(0, t - b); }
function tfClock(t) {
  // the cold open: you've stood here a year (by your head); real time now, your feet 365× slower
  // (frac = head rate / feet rate − 1; ratio = 1 + frac, which rounds to 1 for the tiny ones)
  const out = (head, gap, frac, place, fmt) => ({ head, gap, frac, ratio: 1 + frac, place, fmt });
  if (t < TF.titleShot) { const f = TFP.h / TF.rhoDay, head = 365 * TFP.day + t; return out(head, head - head / (1 + f), f, 'bh', 'days'); }
  if (t < TF.measured) { const head = tfHomeT(t); return out(head, head * TFP.gapE - tfPoseGap(t), TFP.gapE, 'home', 'fine'); }
  if (t >= TF.wd - 1 && t < TF.ns) { const head = tfDayT(t, tfS('wd3') + 0.6, tfE('wd3') - 0.4); return out(head, head * TFP.wd.frac, TFP.wd.frac, 'wd', 'fine'); }
  if (t >= TF.ns && t < TF.bh) { const head = tfDayT(t, tfS('ns5') + 0.4, tfCap('ns5', 0).hide - 0.2); return out(head, head * TFP.ns.frac, TFP.ns.frac, 'ns', 'ms'); }
  if (t >= TF.bh && t < TF.real) { const head = Math.max(0, t - (TF.ten - 30)); return out(head, tfBhGapAt(t), TFP.h / tfRho(t), 'bh', 'ms'); }
  // home again: the clocks as if they'd started with the video (at 7:00:00) and you'd been standing since
  return out(t, t * TFP.gapE, TFP.gapE, 'home', 'fine');
}
// the head–feet gap on the platform since the platform scenes began (s), by integrating 1 − 1/ratio at 30 Hz
let TF_BHGAP = null;
function tfBhGapAt(t) {
  if (!TF_BHGAP) { const t0 = TF.ten - 30, n = Math.ceil((TF.real - t0) * 30) + 2, a = new Float64Array(n); let s = 0; for (let i = 0; i < n; i++) { a[i] = s; const tt = t0 + i / 30; s += (1 - 1 / tfBhRatio(tfRho(tt))) / 30; } TF_BHGAP = { t0, a }; }
  const x = MathX.clamp((t - TF_BHGAP.t0) * 30, 0, TF_BHGAP.a.length - 1.001), i = Math.floor(x);
  return TF_BHGAP.a[i] + (TF_BHGAP.a[i + 1] - TF_BHGAP.a[i]) * (x - i);
}

CONFIG.duration = TF.end;
CONFIG.seed = 20261025;
Object.assign(CONFIG.camera, { cameraHeight: 1.62, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 55, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;

const SCRIPT = {
  meta: { title: 'Is it true time moves slower on your feet than your head?', wav: 'time-on-your-feet-soundtrack.wav' },
  events: [
    { id: 's1', time: 0, label: '1 · the edge of a black hole' }, { id: 'title', time: TF.title[0], label: 'title' },
    { id: 's2', time: TF.hall, label: '2 · your hallway' }, { id: 'start', time: TF.start, label: '★ the clocks start' }, { id: 'year', time: TF.yearGo, label: 'a year' },
    { id: 's3', time: TF.measured, label: '3 · measured' }, { id: 's4', time: TF.gps, label: '4 · GPS' },
    { id: 's5', time: TF.why, label: '5 · gravity is time' }, { id: 's6', time: TF.wd, label: '6 · Sirius B' },
    { id: 's7', time: TF.ns, label: '7 · a neutron star' }, { id: 's8', time: TF.bh, label: '8 · Sagittarius A*' }, { id: 'two', time: TF.two, label: '× 2' }, { id: 'day', time: TF.day, label: '× 365' },
    { id: 's9', time: TF.real, label: '9 · real' }, { id: 'q', time: TF.question, label: 'question' },
  ],
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.62]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 55]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: {
    title: { in: TF.title[0], out: TF.title[1], fi: 0.25, fo: 0.5, cls: 'big center', html: '<span class="kick">IS IT TRUE</span><span class="hero">TIME MOVES SLOWER</span><span class="kick k2">ON YOUR FEET THAN YOUR HEAD?</span>' },
    captions: [],
    readouts: [],
  },
};
const SCRIPT_TRACKS = {};
