/* =====================================================================
   SCRIPT — "What if the universe kept shrinking and couldn't stop?" (16:9, 1920×1080, 30 fps, ≈ 5 min, voiceless).
   ★ The edit is built AROUND THE CAPTIONS: every beat below comes from the caption times (window.UCT, written by
   build-timing.cjs from CAPTIONS.md). Change a pause → edit PAUSE there and re-run it.
   The physics (physics.js, PLAN.md § 2) runs on NIGHT time n (s after 19:30:00, when it starts). This file maps film
   time to night time: real time before 7:30, then the night sped up, scene by scene, with every caption's clock time
   pinned to the moment it really happens, and the last second slowed down. The clock on screen always shows n.
   Everything is a pure function of film time.
   ===================================================================== */

const UCT_ID = Object.fromEntries(UCT.groups.map((g) => [g.id, g]));
// the first word of beat `id` (from word index `from`, counted across its captions) that starts with `txt`
function ucW(id, txt, from = 0) {
  const k = txt.toLowerCase(), ws = UCT_ID[id].caps.flatMap((c) => c.words);
  for (let i = from; i < ws.length; i++) if (ws[i].text.toLowerCase().replace(/[^a-z0-9']/g, '').startsWith(k)) return ws[i];
  throw new Error(`ucW: "${txt}" not found in beat ${id}`);
}
const ucS = (id) => UCT_ID[id].first;         // the beat's first caption appears
const ucE = (id) => UCT_ID[id].end;           // its last caption goes
const ucCap = (id, k) => UCT_ID[id].caps[k];  // a caption: { text, show, hide, words }
// a clock time tonight → night seconds (after 19:30:00)
const ucAt = (h, m, s = 0) => (h + m / 60 + s / 3600) * 3600 - UCP.onset;

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (film seconds). Every other file keys off these.
// ---------------------------------------------------------------------------------------------------------------------
const UC = {};
// 1 — the cold open (11:44 tonight), the title, 7:29, the rule, the promise
UC.titleShot = ucS('title') - 0.55;                    // cut from the cold open to the garden at 7:29, under the title
UC.title = [ucS('title') - 0.3, ucE('title') + 0.7];
UC.frost0 = ucCap('frozen', 1).show - 0.45;            // close: the frost, the ice on the bird bath
UC.rule = ucS('rule') - 0.45;                          // the galaxies (illustrated): growing, then shrinking
UC.shrinkAt = ucW('rule', 'shrink').start;             // ★ the illustration turns round
UC.held = ucS('held') - 0.3;
UC.runout = ucCap('held', 2).show - 0.2;               // "At midnight, it runs out."
UC.promise = ucS('promise') - 0.35;                    // the history, rewound: out to the Big Bang's glow
UC.begin = ucS('begin') - 0.55;                        // ★ 7:30:00 in the garden
UC.onsetT = ucS('begin') + 0.15;                       // (the clock reads 7:30:00 here)
// 2 — the squeeze
UC.mirach = ucS('mirach') - 0.45;
UC.squeeze = ucS('squeeze') - 0.35;
UC.half = ucS('half') - 0.45;
UC.more = ucS('more') - 0.4;
UC.best = ucS('best') - 0.6;
// 3 — the glow
UC.glow = ucS('glow') - 0.7;
UC.ebl = ucS('ebl') - 0.3;
UC.city = ucS('city') - 0.5;
UC.drown = ucS('drown') - 0.45;
UC.close = ucS('close') - 0.45;                        // out there (illustrated)
UC.crashAt = ucCap('close', 1).show;
// 4 — the heat
UC.frost = ucS('frost') - 0.55;                        // macro: the frost melting
UC.zero = ucS('zero') - 0.45;                          // the Milky Way, inside out
UC.zeroAt = ucW('zero', '0').start;                    // ★ 23:27:51: 0 °C
UC.warm = ucS('warm') - 0.45;                          // the cat runs for her flap
UC.catRun = ucCap('warm', 1).show - 0.3;
UC.boil = ucS('boil') - 0.4;
UC.goIn = ucCap('boil', 1).show - 0.35;                // you go in
// 5 — the fire (from the kitchen window)
UC.steam = ucS('steam') - 0.6;
UC.leaves = ucS('leaves') - 0.4;
UC.lawn = ucS('lawn') - 0.6;
UC.noon = ucS('noon') - 0.5;
UC.shedAt = ucCap('noon', 1).show;                     // the shed and the fence catch
UC.shed = ucS('shed') - 0.4;
UC.scopeAt = ucW('shed', 'melts').start;               // ★ the telescope melts
UC.moonGo = ucCap('shed', 1).show;                     // the Moon fades into the sky
UC.glass = ucS('glass') - 0.5;
UC.pretend = ucCap('glass', 1).show - 0.2;
// 6 — the afterglow
UC.bath = ucS('bath') - 0.6;
UC.red = ucS('red') - 0.7;
UC.melt = ucS('melt') - 0.6;
UC.bigbang = ucS('bigbang') - 0.6;
UC.vanish = ucS('vanish') - 0.7;
UC.sun = ucS('sun') - 0.6;
// 7 — the last second
UC.last = ucS('last') - 0.6;
UC.core = ucCap('last', 1).show;                       // 0.87 s to midnight: hotter than the Sun's core
UC.nuclei = ucCap('last', 2).show;                     // 0.039 s: nuclei come apart
UC.protons = ucCap('last', 3).show;                    // 0.0002 s: protons melt
UC.planck = ucCap('last', 4).show;                     // 10⁻¹⁹ s: physics runs out
UC.midnight = ucE('last') + 0.75;                      // ★ black
// 8 — is any of this real; the question
UC.real = ucS('real') - 1.0;
UC.map = ucCap('real', 1).show - 0.3;                  // today's universe (illustrated)
UC.clue = ucS('clue') - 0.4;                           // the 3D map
UC.turn = ucS('turn') - 0.4;                           // the size of the universe, past and future
UC.same = ucS('same') - 0.4;
UC.question = ucS('question') - 0.6;
UC.end = UCT.duration;

// ---------------------------------------------------------------------------------------------------------------------
// FILM TIME → NIGHT TIME. Keys [film t, night n, how to get to the next key]: 'lin' (the clock runs at a steady
// speed), 'log' (log n: the clock speeding up), 'rip' (log of the time left: the last second, slowed down; the key's
// time left is its 4th entry when n can't hold it).
// ---------------------------------------------------------------------------------------------------------------------
UC.nOpen = ucAt(23, 44, 0);
const UC_NKEYS = [
  [UC.titleShot, UC.titleShot - UC.onsetT, 'lin'],                // real time: 7:29:1x …
  [UC.onsetT, 0, 'lin'],                                          // ★ 7:30:00
  [ucE('begin') - 0.2, 1.6, 'log'],
  [UC.mirach, ucAt(19, 57), 'lin'],                               // then the night speeds up
  [ucCap('mirach', 1).show + 0.5, ucAt(20, 50), 'lin'],           // Mirach is white by 8:50
  [ucE('mirach') + 0.2, ucAt(20, 52), 'lin'],
  [ucE('squeeze') + 0.4, ucAt(21, 9), 'lin'],
  [ucS('half') + 0.35, ucAt(21, 14, 0), 'lin'],                   // ★ half the size (s = 2.0)
  [ucE('half'), ucAt(21, 16), 'lin'],
  [ucE('more') + 0.5, ucAt(21, 52), 'lin'],
  [ucS('best') + 0.1, ucAt(22, 0, 0), 'lin'],                     // the most stars: 130,000
  [ucE('best') + 0.8, ucAt(22, 4), 'lin'],
  [ucE('glow'), ucAt(22, 14), 'lin'],
  [ucE('ebl') + 0.6, ucAt(22, 27), 'lin'],
  [ucS('city') + 0.1, ucAt(22, 30, 0), 'lin'],
  [ucCap('city', 0).hide, ucAt(22, 32), 'lin'],
  [ucCap('city', 1).show + 0.1, ucAt(23, 0, 0), 'lin'],
  [ucE('city') + 0.5, ucAt(23, 1, 30), 'lin'],
  [ucE('drown') + 0.5, ucAt(23, 12), 'lin'],
  [ucE('close') + 0.6, ucAt(23, 24, 50), 'lin'],                  // (out there: the clock is off screen)
  [ucS('frost') + 0.1, ucAt(23, 25, 10), 'lin'],
  [ucCap('frost', 1).show, ucAt(23, 25, 44), 'lin'],              // the frost melts at 23:25:37
  [ucE('frost') + 0.4, ucAt(23, 26, 40), 'lin'],
  [UC.zeroAt, ucAt(23, 27, 51), 'lin'],                           // ★ 0 °C
  [ucE('zero') + 0.5, ucAt(23, 29, 25), 'lin'],
  [ucS('warm') + 0.1, ucAt(23, 29, 56), 'lin'],                   // 37 °C
  [ucE('warm') + 0.4, ucAt(23, 31, 40), 'lin'],
  [ucS('boil') + 0.1, ucAt(23, 32, 40), 'lin'],                   // 100 °C
  [ucE('boil') + 0.6, ucAt(23, 34, 40), 'lin'],
  [ucS('steam') + 0.1, ucAt(23, 36, 15), 'lin'],                  // the lawn at 100 °C
  [ucE('steam') + 0.5, ucAt(23, 37, 0), 'lin'],
  [ucS('leaves') + 0.1, ucAt(23, 37, 35), 'lin'],                 // the leaves light
  [ucE('leaves') + 0.7, ucAt(23, 39, 30), 'lin'],
  [ucS('lawn') + 0.1, ucAt(23, 40, 32), 'lin'],                   // the tree and the lawn light
  [ucE('lawn') + 0.6, ucAt(23, 41, 40), 'lin'],
  [ucS('noon') + 0.1, ucAt(23, 42, 0), 'lin'],
  [UC.shedAt + 0.1, ucAt(23, 42, 52), 'lin'],                     // the shed lights (23:42:50)
  [ucE('noon') + 0.4, ucAt(23, 43, 41), 'lin'],                   // the fence (23:43:40)
  [UC.scopeAt + 0.15, ucAt(23, 43, 50), 'lin'],                   // the telescope's tube melts (660 °C, 23:43:49)
  [UC.moonGo + 0.1, ucAt(23, 44, 6), 'lin'],
  [ucE('shed') + 0.5, ucAt(23, 44, 30), 'lin'],                   // the Moon is gone (23:44:25)
  [ucS('glass') + 0.1, ucAt(23, 45, 45), 'lin'],                  // the glass softens
  [ucE('glass') + 0.6, ucAt(23, 46, 50), 'lin'],
  [ucS('bath') + 0.1, ucAt(23, 47, 47), 'lin'],                   // the bird bath boils
  [ucE('bath') + 0.6, ucAt(23, 48, 30), 'lin'],
  [ucS('red') + 0.1, ucAt(23, 48, 45), 'lin'],                    // the afterglow overtakes the galaxies' light
  [ucE('red') + 0.6, ucAt(23, 50, 20), 'lin'],
  [ucS('melt') + 0.1, ucAt(23, 50, 45), 'lin'],                   // brick melts
  [ucE('melt') + 0.6, ucAt(23, 51, 40), 'lin'],
  [ucW('bigbang', '2700').start, ucAt(23, 52, 10), 'lin'],        // ★ 3,000 K
  [ucE('bigbang') + 0.6, ucAt(23, 52, 58), 'lin'],
  [ucE('vanish') + 0.6, ucAt(23, 54, 40), 'lin'],
  [ucS('sun') + 0.1, ucAt(23, 55, 0), 'lin'],                     // the Sun's surface
  [ucE('sun') + 0.3, ucAt(23, 55, 30), 'log'],
  [UC.last - 0.1, UCP.R - 3, 'lin'],
  [UC.last + 0.7, UCP.R - 1.2, 'rip', 1.2],                       // the last second, slowed down
  [UC.core + 0.2, UCP.R - 0.873, 'rip', 0.873],                   // 15.7 million K
  [UC.nuclei + 0.2, UCP.R - 0.0387, 'rip', 0.0387],               // 1 billion K
  [UC.protons + 0.2, UCP.R, 'rip', 2.18e-4],                      // 1 trillion K
  [UC.planck + 0.3, UCP.R, 'rip', 1.69e-19],                      // the Planck temperature
  [UC.midnight - 0.2, UCP.R, 'lin', 1e-40],
  [UC.midnight, UCP.R, 'lin', 0],
];
function ucNight(t) {
  if (t < UC.titleShot) return UC.nOpen + t;                      // the flash-forward
  if (t >= UC.midnight) return UCP.R;
  const K = UC_NKEYS;
  if (t <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (t <= K[i][0]) {
    const [t0, n0, how] = K[i - 1], [t1, n1] = K[i], u = (t - t0) / Math.max(1e-9, t1 - t0);
    if (how === 'log') return Math.exp(Math.log(Math.max(1e-9, n0)) + (Math.log(n1) - Math.log(Math.max(1e-9, n0))) * u);
    if (how === 'rip') return UCP.R - ucLeftAt(K[i - 1], K[i], u);
    return n0 + (n1 - n0) * u;
  }
  return K[K.length - 1][1];
}
function ucLeftAt(a, b, u) { const d0 = a[3] ?? UCP.R - a[1], d1 = b[3] ?? UCP.R - b[1]; return Math.exp(Math.log(d0) + (Math.log(Math.max(1e-300, d1)) - Math.log(d0)) * u); }
// the time left until midnight, without losing precision in the last second (s)
function ucLeft(t) {
  const K = UC_NKEYS;
  if (t >= UC.midnight) return 0;
  for (let i = 1; i < K.length; i++) if (t <= K[i][0]) {
    if (K[i - 1][2] !== 'rip') break;
    return ucLeftAt(K[i - 1], K[i], (t - K[i - 1][0]) / Math.max(1e-9, K[i][0] - K[i - 1][0]));
  }
  return Math.max(0, UCP.R - ucNight(t));
}
// the shrink and the temperature of space at film time t (exact in the last second, from the time left)
function ucShrinkAt(t) { const n = ucNight(t); if (n < UCP.R - 60) return ucShrink(Math.max(0, n)); const L = ucLeft(t); return L > 0 ? Math.exp(ucLnSLeft(L)) : Infinity; }
const ucTempK = (t) => UCP.T0 * ucShrinkAt(t);

CONFIG.duration = UC.end;
CONFIG.seed = 20261025;
Object.assign(CONFIG.camera, { cameraHeight: 1.62, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 55, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;

const SCRIPT = {
  meta: { title: 'What if the universe kept shrinking and couldn\'t stop?', wav: 'universe-shrinking-soundtrack.wav' },
  events: [
    { id: 's1', time: 0, label: '1 · 11:44 tonight' }, { id: 'title', time: UC.title[0], label: 'title' }, { id: 'rule', time: UC.rule, label: 'the rule' },
    { id: 'begin', time: UC.begin, label: '★ 7:30' }, { id: 's2', time: UC.mirach, label: '2 · the squeeze' }, { id: 'best', time: UC.best, label: 'the best sky' },
    { id: 's3', time: UC.glow, label: '3 · the glow' }, { id: 'close', time: UC.close, label: 'out there' },
    { id: 's4', time: UC.frost, label: '4 · the heat' }, { id: 'zero', time: UC.zeroAt, label: '0 °C' }, { id: 'in', time: UC.goIn, label: 'inside' },
    { id: 's5', time: UC.steam, label: '5 · the fire' }, { id: 'pretend', time: UC.pretend, label: 'pretend' },
    { id: 's6', time: UC.bath, label: '6 · the afterglow' }, { id: 'red', time: UC.red, label: 'the red sky' }, { id: 'bb', time: UC.bigbang, label: '3,000 K' },
    { id: 's7', time: UC.last, label: '7 · the last second' }, { id: 'mid', time: UC.midnight, label: '★ midnight' },
    { id: 's8', time: UC.real, label: '8 · real' }, { id: 'q', time: UC.question, label: 'question' },
  ],
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.62]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 55]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: {
    title: { in: UC.title[0], out: UC.title[1], fi: 0.25, fo: 0.5, cls: 'big center', html: '<span class="kick">WHAT IF THE UNIVERSE</span><span class="hero">KEPT SHRINKING</span><span class="kick k2">AND COULDN\'T STOP?</span>' },
    captions: [],
    readouts: [],
  },
};
const SCRIPT_TRACKS = {};
