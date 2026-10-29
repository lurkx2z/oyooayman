/* =====================================================================
   SCRIPT — "What if gravity tilted 90° for one hour?" (16:9, 1920×1080, 30 fps, voiceless).
   ★ The edit is built AROUND THE CAPTIONS: every beat below comes from the caption times (window.GTT, written by
   build-timing.cjs from CAPTIONS.md). Change a pause → edit PAUSE there and re-run it.
   The physics (physics.js) runs on STORY time s: seconds after 7:42:00 AM, when gravity turns east; it turns back at
   s = 3600 (8:42:00). This file maps film time t to story time s with ONE clock for the whole film (GT_CLOCK): it
   only ever runs forward (the owner's rule of 2026-10-29: no replays; every new angle or place moves the hour on).
   Real speed for the first 40 s of the hour, the rain arriving, the terrace letting go, the window, the bolt, the last
   ten seconds and the return; faster in between, with jumps at cuts (the HUD says how much and how far). Everything is a pure function of film time.
   ===================================================================== */

const GTT_ID = Object.fromEntries(GTT.groups.map((g) => [g.id, g]));
const gtS = (id) => GTT_ID[id].first;         // the beat's first caption appears
const gtE = (id) => GTT_ID[id].end;           // its last caption goes
const gtCap = (id, k) => GTT_ID[id].caps[k];  // a caption: { text, show, hide, words }
const gtC = (id, k) => GTT_ID[id].caps[k].show;
const gtB = (id, d = 0.6) => gtS(id) - d;     // a cut just before beat id's first caption

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (film seconds)
// ---------------------------------------------------------------------------------------------------------------------
const GT = {};
GT.t0 = 1.5;                                             // ★ gravity turns (story s = 0), under the title
GT.title = [-0.4, gtE('title') + 0.25];
GT.end = GTT.duration;
GT.tB = gtS('down') - 6.0;                               // ★ gravity turns back (s = 3600)
GT.hold = GT.tB - 0.4;                                   // (0.4 s of silence before it)
GT.tRel = null;                                          // (the terrace lets go: set below from the clock)

// THE CLOCK: segments [film t where it starts, story s there, story s when the next segment starts]. Inside a segment
// the hour runs at a steady rate; between two segments it may jump forward (always at a cut, never back). Each one
// is where a beat needs the hour to be (PLAN.md § 3)
const GT_CLOCK = (() => {
  const S = [
    [-2, -3.5, 'real'],                                                   // the first 40 s of the hour: real speed
    [gtE('crawl') + 0.6, 'cont', 80],                                     // (the rule and the nuance: ×1.2)
    [gtB('river'), 80, 92],                                               // the river
    [gtB('jogger'), 92, 100], [gtC('jogger', 2) - 2.6, 'cont', 133],      // the jogger (her climb: ×6)
    [gtB('pit'), 138, 168],                                               // the pit, the sickness, the cat
    [gtB('bath'), 170, 205], [gtB('phone'), 234, 252], [gtB('trees'), 256, 285], [gtB('sun'), 290, 297],
    [gtB('brick'), 300, 345], [gtB('slip'), 350, 365],
    [gtB('rain'), 438, 'real'], [gtC('rain', 2) - 0.6, 'cont', 470],     // the river arrives (446) at real speed
    [gtB('wood'), 520, 600], [gtB('creep'), 840, 905],
    [gtB('going'), GT_TER.s30 - 4, 1608],                                 // 30 cm, then faster and faster
    [gtE('going') + 0.3, 1612, 'real'],                                   // the terrace lets go (1620): real speed to the pool
    [gtB('pool'), 2150, 2520], [gtE('pool') + 0.3, 2526, 'real'],         // the window goes (2530): real speed
    [gtB('ready'), 2990, 3095],                                           // 10 minutes left (you, her: ×7)
    [gtB('bolt') - 2.6, 3327.4, 'real'],                                  // the bang (3330): real speed
    [gtB('last'), 3538, 3590], [GT.tB - 10, 3590, 'real'],               // the last minute; the last ten seconds
  ];
  // resolve 'real' (rate 1) and 'cont' (carries on from where the last one ended); then each segment's rate
  const out = [];
  S.forEach((g, i) => {
    const t0 = g[0], tn = i + 1 < S.length ? S[i + 1][0] : GT.end + 5;
    const s0 = g[1] === 'cont' ? out[i - 1].s1 : g[1], s1 = g[2] === 'real' ? s0 + (tn - t0) : g[2];
    out.push({ t0, t1: tn, s0, s1, rate: (s1 - s0) / (tn - t0) });
  });
  out.forEach((g, i) => {
    if (!(g.t1 > g.t0) || g.rate < 0) throw new Error(`GT_CLOCK: segment ${i} (t ${g.t0.toFixed(2)}–${g.t1.toFixed(2)}, s ${g.s0}–${g.s1}) runs backwards`);
    if (i && g.s0 < out[i - 1].s1 - 1e-6) throw new Error(`GT_CLOCK: segment ${i} starts before the last one ended (s ${g.s0} < ${out[i - 1].s1})`);
  });
  return out;
})();
function gtSegAt(t) { const K = GT_CLOCK; let i = 0; while (i < K.length - 1 && t >= K[i + 1].t0) i++; return K[i]; }
function gtStoryAt(t) { const g = gtSegAt(t); return g.s0 + g.rate * (t - g.t0); }
function gtRate(t) { return gtSegAt(t).rate; }
// the clock's jumps (film times where the hour skips ahead), for the HUD's "+12 MIN" and the cuts
const GT_JUMPS = GT_CLOCK.slice(1).map((g, i) => ({ t: g.t0, ds: g.s0 - GT_CLOCK[i].s1 })).filter((j) => j.ds > 1);
// the film time at which story time s is on screen (the clock is monotonic: bisect)
function gtFilmAt(s) { let a = -2, b = GT.end + 1; for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (gtStoryAt(m) < s) a = m; else b = m; } return (a + b) / 2; }
GT.tRel = gtFilmAt(GT_TER.release);                      // the terrace lets go
GT.tTerHit = gtFilmAt(GT_TER.hit0);                      // … and hits the end of the street
GT.tGlass = gtFilmAt(GT_GLASS.go);                       // your window lets go
GT.tBolt = gtFilmAt(GT_BOLT.snap);                       // the bolt snaps
GT.tRain = gtFilmAt(GT_RIVER.arrive);                    // the river arrives as rain

CONFIG.duration = GT.end;
CONFIG.seed = 20261029;
Object.assign(CONFIG.camera, { cameraHeight: 1.63, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 50, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;

const SCRIPT = {
  meta: { title: 'What if gravity tilted 90° for one hour?', wav: 'gravity-tilt-soundtrack.wav' },
  events: [],                                            // (filled from the shots by shots.js)
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.63]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 50]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: {
    title: { in: GT.title[0], out: GT.title[1], fi: 0.25, fo: 0.5, cls: 'big center', html: '<span class="kick">WHAT IF GRAVITY</span><span class="hero">TILTED 90°</span><span class="kick k2">FOR ONE HOUR?</span>' },
    captions: [],
    readouts: [],
  },
};
const SCRIPT_TRACKS = {};
