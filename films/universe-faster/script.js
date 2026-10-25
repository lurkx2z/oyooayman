/* =====================================================================
   SCRIPT — "What if the universe kept expanding faster and faster?" (16:9, 1920×1080, 30 fps, ≈ 6 min, voiceless).
   ★ The edit is built AROUND THE CAPTIONS: every beat below comes from the caption times (window.UXT, written by
   build-timing.cjs from CAPTIONS.md). Change a pause → edit PAUSE there and re-run it.
   The physics (physics.js, PLAN.md § 2) runs on NIGHT time n (s after 19:30:00, when it starts). This file maps film
   time to night time: real time before 7:30, the first second slowed down about a hundred million times, then the
   night sped up, scene by scene, and the last second slowed down again. The clock on screen always shows n.
   Everything is a pure function of film time.
   ===================================================================== */

const UXT_ID = Object.fromEntries(UXT.groups.map((g) => [g.id, g]));
// the first word of beat `id` (from word index `from`, counted across its captions) that starts with `txt`
function uxW(id, txt, from = 0) {
  const k = txt.toLowerCase(), ws = UXT_ID[id].caps.flatMap((c) => c.words);
  for (let i = from; i < ws.length; i++) if (ws[i].text.toLowerCase().replace(/[^a-z0-9']/g, '').startsWith(k)) return ws[i];
  throw new Error(`uxW: "${txt}" not found in beat ${id}`);
}
const uxS = (id) => UXT_ID[id].first;         // the beat's first caption appears
const uxE = (id) => UXT_ID[id].end;           // its last caption goes
const uxCap = (id, k) => UXT_ID[id].caps[k];  // a caption: { text, show, hide, words }
// a clock time tonight → night seconds (after 19:30:00)
const uxAt = (h, m, s = 0) => (h + m / 60 + s / 3600) * 3600 - UXP.onset;

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (film seconds). Every other file keys off these.
// ---------------------------------------------------------------------------------------------------------------------
const UX = {};
// 1 — the cold open (later tonight), the title, space grows, held together, Saturn, the rule
UX.titleShot = uxS('title') - 0.6;                     // cut from the cold open to the garden, under the title
UX.title = [uxS('title') - 0.35, uxE('title') + 0.9];
UX.grow = uxS('grow') - 0.5;                           // the galaxies (real, sped up)
UX.held = uxS('held') - 0.3;                           // a galaxy holds together while the gaps grow
UX.scope = uxS('scope') - 0.5;                         // Saturn in the eyepiece
UX.rule = uxS('rule') - 0.5;                           // the garden: the cat on the wall
UX.onset = uxE('rule') + 0.25;                         // ★ 19:30:00: it starts (the cat is in mid-leap)
// 2 — the first second, slowed down
UX.second = uxS('second') - 0.4;
UX.far = uxS('far') - 0.6;                             // the galaxies and the edge
UX.andro = uxS('andromeda') - 0.5;                     // Andromeda in the sky
UX.andGone = uxW('andromeda', 'over').start;           // ★ the edge passes it
UX.letgo = uxS('letgo') - 0.5;
UX.stars = uxS('stars') - 0.5;
UX.same = uxS('same') - 0.4;
UX.resume = uxS('resume') - 0.9;                       // ★ time runs again: the cat lands
// 3 — the sky goes out
UX.stretch = uxS('stretch') - 1.2;
UX.red = uxS('red') - 0.5;
UX.moon = uxS('moon') - 0.6;                           // the Moon (long lens)
UX.saturn = uxS('saturn') - 0.5;                       // back to the eyepiece
UX.satGone = uxW('saturn', 'went').start;              // ★ 21:34:22: Saturn over the edge
UX.blue = uxS('blue') - 0.6;
UX.moon2 = uxS('moon2') - 0.5;
UX.sun = uxS('sun') - 0.3;
UX.sunGone = uxW('sun', 'goes').start;                  // ★ 22:55:34: the Sun over the edge
// 4 — lighter
UX.weight = uxS('weight') - 0.6;
UX.jumpShot = uxS('jump') - 0.4;                      // ("Jump.") you get ready
UX.jump = uxCap('jump', 1).show - 0.25;                // you jump, just before "You hang in the air."
UX.fountain = uxS('fountain') - 0.6;
UX.moongo = uxS('moongo') - 1.4;
UX.air = uxS('air') - 0.5;
UX.pop = uxW('air', 'pop').start - 0.15;               // your ears pop
UX.tea = uxS('tea') - 0.8;
UX.flame = uxS('flame') - 0.6;
// 5 — weightless; Earth comes apart
UX.zero = uxS('zero') - 0.6;
UX.zeroAt = uxW('zero', 'weigh').start;                // ★ 23:35:15: you weigh nothing
UX.rise = uxS('rise') - 0.6;
UX.crack = uxS('crack') - 0.8;
UX.crackAt = uxW('crack', 'cracks').start - 0.2;       // ★ the lawn splits
UX.drift = uxS('drift') - 0.8;
UX.pieces = uxS('pieces') - 0.8;
// 6 — the last second
UX.last = uxS('last') - 0.6;
UX.house = uxW('last', 'house').start;                 // ★ 0.79 s to midnight: the house lets go
UX.you = uxW('last', 'then').start;                    // 0.056 s: you
UX.atoms = uxW('last', 'atoms').start;                 // 4 × 10⁻¹⁷ s: the atoms
UX.midnight = uxE('last') + 0.9;                       // ★ black
// 7 — is any of this real; the question
UX.real = uxS('real') - 1.2;
UX.future = uxS('future') - 0.5;
UX.question = uxS('question') - 0.6;
UX.end = UXT.duration;

// ---------------------------------------------------------------------------------------------------------------------
// FILM TIME → NIGHT TIME. Keys [film t, night n, how to get to the next key]: 'lin' (the clock runs at a steady
// speed), 'log' (log n: the first second, slowed down), 'rip' (log of the time left: the last second, slowed down).
// The cold open is a flash-forward to 23:41.
// ---------------------------------------------------------------------------------------------------------------------
UX.nOpen = uxAt(23, 41, 0);
const UX_NKEYS = [
  [UX.titleShot, UX.titleShot - UX.onset, 'lin'],                 // real time: 19:29:1x …
  [UX.onset, 0, 'jump'],                                         // ★ 19:30:00.000
  [UX.onset + 1e-6, 1e-12, 'log'],
  [UX.second + 1.6, 3e-10, 'log'],
  [UX.far + 1.0, 2e-9, 'log'],
  [uxW('far', 'faster').start, 4.5e-8, 'log'],                   // the Virgo cluster: 39 ns
  [UX.andro + 0.5, 2.0e-7, 'log'],
  [UX.andGone, 8.45e-7, 'log'],                                  // ★ Andromeda: 0.85 µs
  [uxE('andromeda'), 6e-6, 'log'],
  [uxCap('letgo', 1).show, 8.1e-5, 'log'],                       // the centre of the galaxy: 81 µs
  [uxE('letgo'), 2e-3, 'log'],
  [uxW('stars', 'half').start, 0.48, 'log'],                     // the nearest star: 0.48 s
  [uxE('stars'), 0.6, 'lin'],
  [UX.resume - 0.3, 0.9, 'lin'],
  [UX.resume + 0.4, 1.1, 'lin'],                                 // ★ the first second is over (1×)
  [uxE('resume') + 0.2, 7.5, 'lin'],
  [UX.stretch + 1.0, uxAt(19, 58), 'lin'],                       // the night speeds up
  [uxE('stretch'), uxAt(20, 40), 'lin'],
  [uxE('red'), uxAt(21, 10), 'lin'],
  [UX.saturn - 0.1, uxAt(21, 28), 'lin'],
  [UX.saturn + 0.2, uxAt(21, 32, 30), 'lin'],
  [UX.satGone, uxAt(21, 34, 22), 'lin'],                         // ★ Saturn over the edge
  [uxE('saturn') + 0.4, uxAt(21, 35, 30), 'lin'],
  [uxE('blue') + 0.5, uxAt(22, 40), 'lin'],
  [uxE('moon2') + 0.3, uxAt(22, 50), 'lin'],
  [UX.sunGone, uxAt(22, 55, 34), 'lin'],                         // ★ the Sun over the edge
  [uxE('sun') + 0.3, uxAt(22, 57), 'lin'],
  [UX.weight + 0.2, uxAt(22, 59, 30), 'lin'],
  [uxE('weight'), uxAt(23, 4), 'lin'],
  [uxE('fountain'), uxAt(23, 16), 'lin'],
  [uxE('moongo') - 0.2, uxAt(23, 23, 30), 'lin'],                 // the Moon goes out, by the caption's end (magnitude 2.7 → 5)
  [UX.jump, uxAt(23, 24), 'lin'],                                 // you jump at half your weight
  [uxE('jump'), uxAt(23, 24, 40), 'lin'],
  [uxE('air'), uxAt(23, 26, 30), 'lin'],
  [UX.tea + 0.8, uxAt(23, 27, 15), 'lin'],
  [uxE('tea'), uxAt(23, 30), 'lin'],
  [uxE('flame') + 0.3, uxAt(23, 34), 'lin'],
  [UX.zeroAt, uxAt(23, 35, 15), 'lin'],                          // ★ weightless
  [uxE('zero'), uxAt(23, 36, 10), 'lin'],
  [uxE('rise'), uxAt(23, 37, 40), 'lin'],
  [UX.crackAt, uxAt(23, 38, 20), 'lin'],
  [uxE('crack'), uxAt(23, 40, 10), 'lin'],
  [uxE('drift') + 0.4, uxAt(23, 42, 0), 'lin'],
  [UX.pieces + 0.6, uxAt(23, 49, 30), 'lin'],
  [uxE('pieces') + 0.6, uxAt(23, 52), 'lin'],
  [UX.last - 0.1, UXP.R - 3, 'lin'],
  [UX.last + 0.8, UXP.R - 1.2, 'rip', 1.2],                      // the last second, slowed down
  [UX.house, UXP.R - 0.79, 'rip', 0.79],                         // ★ the house: 0.79 s
  [UX.you, UXP.R - 0.056, 'rip', 0.056],                         // you: 56 ms
  [UX.atoms, UXP.R, 'rip', 4.3e-17],                             // atoms: 4 × 10⁻¹⁷ s (too small to show in n)
  [UX.midnight - 0.3, UXP.R, 'lin', 1e-24],
  [UX.midnight, UXP.R, 'lin', 0],
];
function uxNight(t) {
  if (t < UX.titleShot) return UX.nOpen + t;                      // the flash-forward
  if (t >= UX.midnight) return UXP.R;
  const K = UX_NKEYS;
  if (t <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (t <= K[i][0]) {
    const [t0, n0, how] = K[i - 1], [t1, n1] = K[i], u = (t - t0) / Math.max(1e-9, t1 - t0);
    if (how === 'log') return Math.exp(Math.log(n0) + (Math.log(n1) - Math.log(n0)) * u);
    if (how === 'rip') return UXP.R - uxLeftAt(K[i - 1], K[i], u);
    if (how === 'jump') return n1;
    return n0 + (n1 - n0) * u;
  }
  return K[K.length - 1][1];
}
// the time left until midnight, without losing precision in the last second (s)
// (a key's time left is its 4th entry when n can't hold it: R − 4 × 10⁻¹⁷ s is just R in a double)
function uxLeftAt(a, b, u) { const d0 = a[3] ?? UXP.R - a[1], d1 = b[3] ?? UXP.R - b[1]; return Math.exp(Math.log(d0) + (Math.log(d1) - Math.log(d0)) * u); }
function uxLeft(t) {
  const K = UX_NKEYS;
  if (t >= UX.midnight) return 0;
  for (let i = 1; i < K.length; i++) if (t <= K[i][0]) {
    if (K[i - 1][2] !== 'rip') break;
    return uxLeftAt(K[i - 1], K[i], (t - K[i - 1][0]) / Math.max(1e-9, K[i][0] - K[i - 1][0]));
  }
  return Math.max(0, UXP.R - uxNight(t));
}
// the pull in the last second (phantom asymptote: ä/a = h(1 + h) / left²), for the ladder
const uxAccLeft = (left) => UXP.h * (1 + UXP.h) / (left * left);

CONFIG.duration = UX.end;
CONFIG.seed = 20261025;
Object.assign(CONFIG.camera, { cameraHeight: 1.62, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 55, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;

const SCRIPT = {
  meta: { title: 'What if the universe kept expanding faster and faster?', wav: 'universe-faster-soundtrack.wav' },
  events: [
    { id: 's1', time: 0, label: '1 · 11:41 tonight' }, { id: 'title', time: UX.title[0], label: 'title' }, { id: 'grow', time: UX.grow, label: 'space grows' },
    { id: 'scope', time: UX.scope, label: 'Saturn' }, { id: 'onset', time: UX.onset, label: '★ 7:30' },
    { id: 's2', time: UX.second, label: '2 · the first second' }, { id: 'and', time: UX.andGone, label: 'Andromeda' }, { id: 'res', time: UX.resume, label: 'resume' },
    { id: 's3', time: UX.stretch, label: '3 · the sky goes out' }, { id: 'moon', time: UX.moon, label: 'Moon' }, { id: 'sat', time: UX.saturn, label: 'Saturn' },
    { id: 'sun', time: UX.sunGone, label: 'the Sun' }, { id: 's4', time: UX.weight, label: '4 · lighter' }, { id: 'tea', time: UX.tea, label: 'tea' },
    { id: 's5', time: UX.zero, label: '5 · weightless' }, { id: 'crack', time: UX.crack, label: 'crack' }, { id: 'pieces', time: UX.pieces, label: 'pieces' },
    { id: 's6', time: UX.last, label: '6 · the last second' }, { id: 'mid', time: UX.midnight, label: '★ midnight' },
    { id: 's7', time: UX.real, label: '7 · real' }, { id: 'q', time: UX.question, label: 'question' },
  ],
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.62]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 55]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: {
    title: { in: UX.title[0], out: UX.title[1], fi: 0.25, fo: 0.5, cls: 'big center', html: '<span class="kick">WHAT IF THE UNIVERSE</span><span class="hero">KEPT EXPANDING</span><span class="kick k2">FASTER AND FASTER?</span>' },
    captions: [],
    readouts: [],
  },
};
const SCRIPT_TRACKS = {};
