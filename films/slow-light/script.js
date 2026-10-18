/* =====================================================================
   SCRIPT — "What if light kept getting slower and couldn't stop?" (16:9, 1920×1080, 30 fps, ≈ 6 min, voiceless).
   ★ The edit is built AROUND THE CAPTIONS: every beat below comes from the caption times (window.SLT, written by
   build-timing.cjs from CAPTIONS.md). Change a pause → edit PAUSE there and re-run it.
   The physics: PLAN.md § 2. Only light slows; everything else (sound, cats, cars, you) stays the same, and light
   moves at c(t) through the air of this one world. Everything is a pure function of film time.
   ===================================================================== */

const SLT_ID = Object.fromEntries(SLT.groups.map((g) => [g.id, g]));
// the first word of beat `id` (from word index `from`, counted across its captions) that starts with `txt`
function slW(id, txt, from = 0) {
  const k = txt.toLowerCase(), ws = SLT_ID[id].caps.flatMap((c) => c.words);
  for (let i = from; i < ws.length; i++) if (ws[i].text.toLowerCase().replace(/[^a-z0-9']/g, '').startsWith(k)) return ws[i];
  throw new Error(`slW: "${txt}" not found in beat ${id}`);
}
const slS = (id) => SLT_ID[id].first;         // the beat's first caption appears
const slE = (id) => SLT_ID[id].end;           // its last caption goes
const slCap = (id, k) => SLT_ID[id].caps[k];  // a caption: { text, show, hide, words }

const SL_C0 = 299792458;                       // m/s
const SL_VSOUND = 343;                         // m/s, sound in air (unchanged all film)

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (film seconds). Every other file keys off these.
// ---------------------------------------------------------------------------------------------------------------------
const SL = {};
// 1 — the cold open (later tonight), the title, light is fast, the rule
SL.title = [slS('title') - 0.35, slE('title') + 0.9];
SL.titleShot = slS('title') - 0.6;                     // cut from the cold open to the room, under the title
SL.fast = slS('fast') - 0.5;                           // the Earth: light laps it
SL.rule = slS('rule') - 0.4;                           // the living room, early evening
SL.slow0 = slW('rule', 'starts').start;                // ★ light starts slowing
// 2 — the call, the map, the Sun
SL.call = slS('call') - 0.5;
SL.cable = slW('call', 'cross').start;                 // the cable map comes up
SL.lagFrac = slW('lag', 'fraction').start;
SL.lagOne = slW('lag', 'whole').start;
SL.lagThree = slW('lag', 'three').start;
SL.joke = slE('lag') + 0.6;                            // you tell the joke (you laugh)
SL.jokeLaugh = slE('joke') + 1.2;                      // ★ she laughs, late
SL.map = slS('map') - 0.4;                             // the map app
SL.mapSea = slCap('map', 2).show - 0.6;                 // the dot runs out to sea
SL.sun = slS('sun') - 0.5;                             // at the window: night comes early
// 3 — fireworks over the harbour (2 km)
SL.fw = slS('fireworks') - 0.6;
SL.fwDist = 2000;
SL.f1 = slW('count', 'flash').start - 0.05;            // pair 1: the flash, then the bang ≈ 5.8 s later
SL.b1 = SL.f1 + SL.fwDist / SL_VSOUND;
SL.f2 = SL.b1 + 0.9;                                   // pair 2: 4 s
SL.b2 = SL.f2 + 4.0;
SL.f3 = SL.b2 + 0.45;                                  // pair 3: 2 s
SL.b3 = SL.f3 + 2.0;
SL.fb4 = slW('together', 'together').start - 0.05;     // pair 4: together
SL.b5 = slW('first', 'hear').start - 0.1;              // pair 5: bang first …
SL.f5 = SL.b5 + 1.6;                                   // … then the flash
SL.b6 = slE('slower') + 0.35;                          // pair 6: the big one, heard 2.4 s before it is seen
SL.f6 = SL.b6 + 2.4;
// 4 — the street at night
SL.street = slS('street') - 1.2;
SL.car1Pass = slS('red') + 0.3;                        // car 1 (slower than light) passes you
SL.redGone = slW('red', 'gone').start;
SL.faster = slS('faster') - 0.5;
SL.car2Seen = slCap('two', 1).show - 0.5;              // ★ car 2 (faster than light) appears, and splits in two at once
SL.car2Split = SL.car2Seen;
// 5 — the cat and the laser
SL.cat = slS('cat') - 0.6;
SL.laserOn = slCap('laser', 1).show + 0.35;            // ("And wait.") the button
SL.beat = slS('beat') - 0.4;
// 6 — the mirror
SL.mirror = slS('mirror') - 0.6;
SL.wave = slE('mirror') + 0.15;                        // you wave …
SL.walk = slS('walk') - 0.3;                           // you walk towards the mirror
SL.behind = slS('behind') - 0.2;                       // you look back
// 7 — the lamp
SL.lamp = slS('lamp') - 0.6;
SL.lampOff = slE('lamp') + 0.25;                       // the switch
SL.lampOn = slS('on') + 0.3;                           // ("Switch it back on.")
SL.egg = slS('egg') - 0.2;
// 8 — the knock, the freeze, the stop
SL.knock = slS('knock') - 0.6;
SL.knockHit = slE('knock') + 0.45;                     // you knock (heard at once)
SL.knockSeen = slS('see') - 0.2;                       // ★ you see your hand land
SL.freeze = slS('freeze') - 0.4;
SL.stop = slW('stop', 'stops').start;                  // ★ light stops (the last of the picture goes)
SL.last = slS('last') - 0.3;
// 9 — the dark
SL.door = slS('door') - 2.4;                           // keys, the lock, the door
SL.on2 = slS('on2') - 0.3;
SL.text = slS('text') - 0.3;
// 10 — the real experiments, the question
SL.real = slS('real') - 1.4;                           // ★ the lights come back: the lab
SL.lab = slS('lab') - 0.3;
SL.held = slW('stopped', 'stopped').start;
SL.release = slW('stopped', 'let').start;
SL.question = slS('question') - 0.5;
SL.end = SLT.duration;

// ---------------------------------------------------------------------------------------------------------------------
// THE SPEED OF LIGHT c(t) (m/s): keys [t, c], interpolated smoothly in log c. Plateaus where a scene's physics needs a
// constant c (the lamp's light front, the knock, the mirror): see PLAN.md § 2 for every number.
// ---------------------------------------------------------------------------------------------------------------------
const SL_CABLE = 20000e3, SL_GLASS = 1.47;              // London–Sydney by sea cable (≈ 20,000 km); light in glass is 1.47× slower
const slGranDelay = (c) => SL_CABLE / (c / SL_GLASS) + 0.1;            // one way, + ≈ 0.1 s of processing
const slCForGran = (d) => SL_GLASS * SL_CABLE / (d - 0.1);
const slCForGap = (gap) => SL.fwDist / (SL.fwDist / SL_VSOUND - gap);   // fireworks: flash → bang gap (s) → c
SL.cLamp = 0.75;                                       // the lamp scene: 2.7 km/h, slower than you walk
SL.cMirror = 1.4;                                      // walking pace: 5 km/h
SL.mirrorDist = 1.4;                                   // you stand 1.4 m from the glass: 2.8 m there and back = 2 s
SL.knockDist = 0.39;                                   // eye → knuckles on the table (m)
SL.cKnock = SL.knockDist / (SL.knockSeen - SL.knockHit);   // the knock is seen exactly when the caption says "There."
SL.cCat = 2.5;                                         // 9 km/h: a sprinting cat (≈ 30 km/h) beats it
SL.cStreet = 27.8;                                     // 100 km/h
SL.cCar2 = 3.5;                                        // 12.6 km/h: car 2 does 25 km/h, twice as fast as light
const SL_CKEYS = [
  [-1e3, SL_C0], [SL.slow0, SL_C0],
  [slS('call'), 2.0e8], [SL.lagFrac, slCForGran(0.4)], [SL.lagOne, slCForGran(1.0)], [SL.lagThree, slCForGran(3.0)],
  [SL.jokeLaugh, slCForGran(4.2)], [SL.map, 6e6], [slE('map'), 2.2e6], [SL.sun, 1.5e6], [slE('sun'), 4e5],
  [SL.fw, 2e5], [SL.f1, 1e5], [SL.b1, 4e3], [SL.f2, slCForGap(4.0)], [SL.b2, slCForGap(4.0) * 0.97],
  [SL.f3, slCForGap(2.0)], [SL.b3, slCForGap(2.0) * 0.96], [SL.fb4, SL_VSOUND], [SL.b5, slCForGap(-1.6)], [SL.b6, slCForGap(-2.4)], [SL.f6 + 0.6, 225],
  [SL.street, 34], [slS('blue'), SL.cStreet], [SL.redGone + 1.0, SL.cStreet], [SL.faster, 12], [slS('cantsee') - 0.6, SL.cCar2], [slE('past') + 0.5, SL.cCar2],
  [SL.cat - 0.3, 5.0], [SL.laserOn - 0.4, SL.cCat], [slE('beat') + 0.6, SL.cCat],
  [SL.mirror - 0.3, 1.7], [SL.wave - 0.5, SL.cMirror], [slE('behind') + 0.6, SL.cMirror],
  [SL.lamp - 0.3, SL.cLamp], [slE('egg') + 0.8, SL.cLamp],
  [SL.knock - 0.3, 0.12], [SL.knockHit - 0.6, SL.cKnock], [SL.knockSeen + 0.8, SL.cKnock],
  [SL.freeze + 0.5, 0.02], [slE('freeze'), 0.0025], [SL.stop - 0.35, 0.0006],
];
function slC(t) {
  if (t >= SL.stop) return 0;
  const K = SL_CKEYS;
  if (t <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (t <= K[i][0]) {
    const [t0, c0] = K[i - 1], [t1, c1] = K[i], u = Ease.inOutSine((t - t0) / Math.max(1e-6, t1 - t0));
    return Math.exp(Math.log(c0) + (Math.log(c1) - Math.log(c0)) * u);
  }
  // the last fraction of a second before the stop: down to nothing
  return K[K.length - 1][1] * (1 - MathX.smooth(t, K[K.length - 1][0], SL.stop));
}

// the clock on the wall (minutes after midnight) and Mum's text: one evening, compressed
const SL_CLOCK = [[0, 19 * 60 + 18], [SL.rule, 19 * 60 + 24], [SL.map + 6, 19 * 60 + 41], [SL.sun, 19 * 60 + 47], [SL.fw - 0.01, 19 * 60 + 58],
  [SL.fw, 20 * 60 + 31], [SL.street - 0.01, 20 * 60 + 44], [SL.street, 21 * 60 + 5], [SL.cat - 0.01, 21 * 60 + 12], [SL.cat, 21 * 60 + 19],
  [SL.mirror, 21 * 60 + 27], [SL.lamp, 21 * 60 + 33], [SL.knock, 21 * 60 + 44], [SL.stop, 21 * 60 + 52], [SL.door, 22 * 60 + 6], [SL.real, 22 * 60 + 9]];
function slClock(t) { const K = SL_CLOCK; for (let i = 1; i < K.length; i++) if (t <= K[i][0]) return K[i - 1][1] + (K[i][1] - K[i - 1][1]) * (t - K[i - 1][0]) / (K[i][0] - K[i - 1][0]); return K[K.length - 1][1]; }
SL.textSent = SL.cat + 1.0;                            // Mum sends "On my way x" (it never arrives)

CONFIG.duration = SL.end;
CONFIG.seed = 20261018;
Object.assign(CONFIG.camera, { cameraHeight: 1.62, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 55, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;

const SCRIPT = {
  meta: { title: 'What if light kept getting slower?', wav: 'slow-light-soundtrack.wav' },
  events: [
    { id: 's1', time: 0, label: '1 · later tonight' }, { id: 'title', time: SL.title[0], label: 'title' }, { id: 'fast', time: SL.fast, label: 'light is fast' },
    { id: 's2', time: SL.call, label: '2 · the call' }, { id: 'map', time: SL.map, label: 'map' }, { id: 'sun', time: SL.sun, label: 'sun' },
    { id: 's3', time: SL.fw, label: '3 · fireworks' }, { id: 'fb4', time: SL.fb4, label: 'together' },
    { id: 's4', time: SL.street, label: '4 · street' }, { id: 'car2', time: SL.faster, label: 'faster car' },
    { id: 's5', time: SL.cat, label: '5 · cat' }, { id: 's6', time: SL.mirror, label: '6 · mirror' }, { id: 's7', time: SL.lamp, label: '7 · lamp' },
    { id: 's8', time: SL.knock, label: '8 · knock' }, { id: 'stop', time: SL.stop, label: '★ stop' }, { id: 's9', time: SL.door, label: '9 · the dark' },
    { id: 's10', time: SL.real, label: '10 · real' }, { id: 'q', time: SL.question, label: 'question' },
  ],
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.62]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 55]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: {
    title: { in: SL.title[0], out: SL.title[1], fi: 0.25, fo: 0.5, cls: 'big center', html: '<span class="kick">WHAT IF LIGHT KEPT</span><span class="hero">GETTING SLOWER?</span>' },
    captions: [],
    readouts: [],
  },
};
const SCRIPT_TRACKS = {};
