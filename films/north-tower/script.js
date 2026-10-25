/* =====================================================================
   SCRIPT — "What if you were in the North Tower on September 11, 2001?" (16:9, 1920×1080, 30 fps, ≈ 6 min,
   voiceless, a memorial). Every fact on screen: RESEARCH.md.
   ★ The edit is built AROUND THE CAPTIONS: every beat below comes from the caption times (window.NTT, written by
   build-timing.cjs from CAPTIONS.md). Change a pause → edit PAUSE there and re-run it.
   The story clock (the morning, in seconds after midnight) and the floor you are on are keyed to those beats here.
   Everything is a pure function of film time.
   ===================================================================== */

const NTT_ID = Object.fromEntries(NTT.groups.map((g) => [g.id, g]));
// the first word of beat `id` (from word index `from`, counted across its captions) that starts with `txt`
function ntW(id, txt, from = 0) {
  const k = txt.toLowerCase(), ws = NTT_ID[id].caps.flatMap((c) => c.words);
  for (let i = from; i < ws.length; i++) if (ws[i].text.toLowerCase().replace(/[^a-z0-9']/g, '').startsWith(k)) return ws[i];
  throw new Error(`ntW: "${txt}" not found in beat ${id}`);
}
const ntS = (id) => NTT_ID[id].first;         // the beat's first caption appears
const ntE = (id) => NTT_ID[id].end;           // its last caption goes
const ntCap = (id, k) => NTT_ID[id].caps[k];  // a caption: { text, show, hide, words }
// a clock time this morning → seconds after midnight
const ntAt = (h, m, s = 0) => h * 3600 + m * 60 + s;

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (film seconds). Every other file keys off these.
// ---------------------------------------------------------------------------------------------------------------------
const NT = {};
// 1 — the office, floor 73
NT.title = [0, ntE('title') + 0.6];
NT.morning = ntS('morning') - 0.8;                       // your desk
NT.sky = ntS('sky') - 0.6;                               // at the window
NT.tower = ntS('tower') - 0.6;                           // the South Tower across the way
NT.windows = ntS('windows') - 0.6;                       // between two columns, looking down
NT.impactShot = ntS('impact') - 0.9;                     // back at your desk
NT.hit = ntS('impact') + 0.75;                           // ★ 8:46:40 — the jolt
NT.after = ntS('after') - 0.5;                           // the tiles, the lights
NT.outside = ntS('outside') - 0.7;                       // paper and smoke past the windows
NT.nobody = ntS('nobody') - 0.5;                         // people standing; you go
NT.go = ntCap('nobody', 2).show - 0.2;                   // you pick up your bag and walk
NT.known = ntS('known') - 0.6;                           // the core corridor, the stair door
// 2 — the stairs
NT.stair = ntS('stair') - 0.9;                           // through the door: stairway C
NT.glow = ntS('glow') - 0.6;
NT.pace = ntS('pace') - 0.5;
NT.second = ntS('second') - 0.5;
NT.shake = ntCap('second', 1).show - 0.45;               // ★ 9:03:11 — the stairway shakes
NT.calm = ntS('calm') - 0.5;
NT.right = ntS('right') - 0.7;                           // "Stay to the right!"
NT.hurt = ntCap('right', 1).show - 0.4;                  // the injured person passes
NT.transfer = ntS('transfer') - 0.7;                     // floor 48: the hallway
NT.ff = ntS('ff') - 0.8;                                 // floor 37: firefighters
NT.ff2 = ntS('ff2') - 0.4;
NT.water = ntS('water') - 0.8;
NT.thin = ntS('thin') - 0.6;
// 3 — out
NT.mezz = ntS('mezz') - 0.9;
NT.police = ntS('police') - 0.5;
NT.esc = ntS('conc') - 0.6;                              // down the escalator
NT.conc = ntCap('conc', 1).show - 0.5;                   // the concourse
NT.five = ntS('five') - 0.6;                             // up the stairs, out onto Vesey Street
NT.back = ntS('back') - 0.5;                             // you look back
// 4 — 9:59, 10:28
NT.roarShot = ntS('nine59') - 0.6;
NT.roar = ntS('nine59') - 0.2;                           // ★ 9:58:59 (+1.2 s) — the South Tower starts to fall
NT.run = ntCap('nine59', 2).show + 0.8;                  // you turn and run
NT.cloudHit = ntS('cloud') - 0.4;                        // ★ the cloud reaches you
NT.cloud = ntS('cloud') - 1.6;
NT.grey = ntS('grey') - 1.6;
NT.walk = ntS('walk') - 0.6;
NT.fallShot = ntS('ten28') - 0.8;
NT.fall = ntCap('ten28', 1).show - 0.9;                  // ★ 10:28:25 — the North Tower falls
// 5 — remembrance
NT.out = ntS('out') - 1.6;
NT.how = ntS('how') - 0.6;
NT.cost = ntS('cost') - 1.2;
NT.light = ntS('light') - 1.4;
NT.card = ntE('light') + 3.5;                            // the remembrance card (the beams alone first)
NT.end = NTT.duration;

// ---------------------------------------------------------------------------------------------------------------------
// FILM TIME → THE CLOCK THIS MORNING (s after midnight), linear between keys (the film runs about real time in the
// moments that matter and sped up between them; the clock never runs backwards)
// ---------------------------------------------------------------------------------------------------------------------
// a stair shot's two clock keys: it starts at c0 and runs 3× until just before the cut
const ntShotClock = (t0, t1, c0) => [[t0, c0], [t1 - 0.001, c0 + 3 * (t1 - t0)]];
const NT_CKEYS = [
  [0, ntAt(8, 40, 52)],
  [NT.sky + 1.5, ntAt(8, 41, 6)],
  [NT.impactShot, ntAt(8, 46, 30)],
  [NT.hit, ntAt(8, 46, 40)],                                       // ★ Flight 11 (9/11 Commission time)
  [NT.after, ntAt(8, 46, 58)],
  [NT.nobody, ntAt(8, 47, 50)],
  [NT.go, ntAt(8, 49, 20)],
  // (on the stairs the clock runs 3× inside a shot, about your pace on screen, and jumps at the cuts)
  ...ntShotClock(NT.stair, NT.glow, ntAt(8, 50, 10)),
  ...ntShotClock(NT.glow, NT.pace, ntAt(8, 53, 30)),
  ...ntShotClock(NT.pace, NT.second, ntAt(8, 57, 0)),
  [NT.second, ntAt(9, 3, 11) - (NT.shake - NT.second)],
  [NT.shake, ntAt(9, 3, 11)],                                      // ★ Flight 175
  [NT.calm - 0.001, ntAt(9, 3, 11) + 3 * (NT.calm - NT.shake)],
  ...ntShotClock(NT.calm, NT.right, ntAt(9, 5, 0)),
  ...ntShotClock(NT.right, NT.transfer, ntAt(9, 9, 0)),
  ...ntShotClock(NT.transfer, NT.ff, ntAt(9, 15, 0)),
  ...ntShotClock(NT.ff, NT.water, ntAt(9, 27, 0)),
  ...ntShotClock(NT.water, NT.thin, ntAt(9, 38, 0)),
  ...ntShotClock(NT.thin, NT.mezz, ntAt(9, 43, 0)),
  [NT.mezz, ntAt(9, 45, 0)],
  [NT.esc, ntAt(9, 47, 30)],
  [NT.five, ntAt(9, 52, 0)],
  [NT.back, ntAt(9, 56, 0)],
  [ntS('nine59') - 0.05, ntAt(9, 58, 59)],                         // ★ the South Tower (it starts to fall a second later)
  [NT.cloudHit, ntAt(9, 59, 25)],
  [NT.grey, ntAt(10, 0, 30)],
  [NT.walk, ntAt(10, 6, 0)],
  [NT.fallShot, ntAt(10, 28, 0)],
  [NT.fall, ntAt(10, 28, 25)],                                     // ★ the North Tower
  [NT.out, ntAt(10, 29, 30)],
];
function ntClock(t) {
  const K = NT_CKEYS;
  if (t <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (t <= K[i][0]) return K[i - 1][1] + (K[i][1] - K[i - 1][1]) * (t - K[i - 1][0]) / Math.max(1e-6, K[i][0] - K[i - 1][0]);
  return K[K.length - 1][1];
}
// the clock time → film time (bisection; the clock never runs backwards)
function ntFilmAt(c) { let lo = 0, hi = NT.out; for (let i = 0; i < 50; i++) { const m = 0.5 * (lo + hi); if (ntClock(m) < c) lo = m; else hi = m; } return 0.5 * (lo + hi); }

// the floor you are on, keyed to the clock (linear in clock time between keys; shown as a whole floor)
// (each stair shot starts on its key floor and walks down from there at the crowd's pace: stair.js)
const NT_FKEYS = [
  [ntAt(8, 50, 10), 73], [ntAt(8, 53, 30), 70], [ntAt(8, 57, 0), 67], [ntAt(9, 3, 0), 62], [ntAt(9, 5, 0), 60],
  [ntAt(9, 9, 0), 55], [ntAt(9, 15, 0), 48], [ntAt(9, 27, 0), 37], [ntAt(9, 38, 0), 20], [ntAt(9, 43, 0), 8], [ntAt(9, 44, 40), 1],
];
function ntFloorF(t) {
  const c = ntClock(t), K = NT_FKEYS;
  if (c <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (c <= K[i][0]) return K[i - 1][1] + (K[i][1] - K[i - 1][1]) * (c - K[i - 1][0]) / (K[i][0] - K[i - 1][0]);
  return K[K.length - 1][1];
}
const ntFloor = (t) => Math.max(1, Math.ceil(ntFloorF(t) - 1e-6));

CONFIG.duration = NT.end;
CONFIG.seed = 20010911;
Object.assign(CONFIG.camera, { cameraHeight: 1.62, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 55, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;

const SCRIPT = {
  meta: { title: 'What if you were in the North Tower on September 11, 2001?', wav: 'north-tower-soundtrack.wav' },
  events: [
    { id: 's1', time: 0, label: '1 · floor 73' }, { id: 'hit', time: NT.hit, label: '★ 8:46' }, { id: 'known', time: NT.known, label: 'the door' },
    { id: 's2', time: NT.stair, label: '2 · the stairs' }, { id: 'shake', time: NT.shake, label: '★ 9:03' }, { id: 'tr', time: NT.transfer, label: 'floor 48' },
    { id: 'ff', time: NT.ff, label: 'firefighters' }, { id: 'water', time: NT.water, label: 'water' },
    { id: 's3', time: NT.mezz, label: '3 · out' }, { id: 'conc', time: NT.conc, label: 'concourse' }, { id: 'five', time: NT.five, label: 'Vesey St' },
    { id: 's4', time: NT.roarShot, label: '4 · 9:59' }, { id: 'grey', time: NT.grey, label: 'grey' }, { id: 'fall', time: NT.fall, label: '★ 10:28' },
    { id: 's5', time: NT.out, label: '5 · remembrance' }, { id: 'light', time: NT.light, label: 'light' }, { id: 'card', time: NT.card, label: 'card' },
  ],
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.62]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 55]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: {
    title: { in: NT.title[0], out: NT.title[1], fi: 0.01, fo: 0.6, cls: 'big center', html: '<span class="kick">WHAT IF YOU WERE</span><span class="hero">IN THE NORTH TOWER</span><span class="kick k2">ON SEPTEMBER 11, 2001?</span>' },
    captions: [],
    readouts: [],
  },
};
const SCRIPT_TRACKS = {};
