/* =====================================================================
   SCRIPT — "What if air became solid for 3 seconds?" (16:9, 1920×1080, 30 fps, voiceless).
   ★ The edit is built AROUND THE CAPTIONS: every beat below comes from the caption times (window.SAT, written by
   build-timing.cjs from CAPTIONS.md). Change a pause → edit PAUSE there and re-run it.
   The physics (physics.js) runs on STORY time s: seconds after Sunday 2:00:00.000 PM, when the air sets; it lets go at
   s = 3. This file maps film time t to story time s with ONE clock for the whole film (SA_CLOCK): it only ever runs
   forward (the owner's rule of 2026-10-29: no replays; every new angle or place moves the clock on). The three seconds
   are stretched over three and a half minutes (the HUD says how slowly); the release is in slow motion; after it the
   clock runs at real speed and jumps forward only at cuts (the HUD says how far).
   ===================================================================== */

const SAT_ID = Object.fromEntries(SAT.groups.map((g) => [g.id, g]));
const saS = (id) => SAT_ID[id].first;         // the beat's first caption appears
const saE = (id) => SAT_ID[id].end;           // its last caption goes
const saCap = (id, k) => SAT_ID[id].caps[k];  // a caption: { text, show, hide, words }
const saC = (id, k) => SAT_ID[id].caps[k].show;
const saB = (id, d = 0.6) => saS(id) - d;     // a cut just before beat id's first caption

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (film seconds) and the moments they are built on (story seconds)
// ---------------------------------------------------------------------------------------------------------------------
const SA = {};
SA.title = [-0.4, saE('title') + 0.25];
SA.end = SAT.duration;
SA.tLock = 2.85;                                         // ★ (film) the air sets (s = 0), just before the title goes
SA.sJump = -0.30;                                        // your cat leaves the table
SA.sCount = 2.0;                                         // "One second left."
SA.sR0 = 2.98;                                           // (the release shot starts a moment before 2:00:03)
SA.sFall = 3.34;                                         // the park, in slow motion
SA.tRel = saB('release') - 2.25;                         // (film) the cut back home for the release

// THE CLOCK: segments [film t where it starts, story s there ('cont': carries on), 'real' | ['rate', r] | ['to', s1]].
// ['to', s1]: a steady rate that reaches story s1 when the next segment starts. Inside a segment time runs at a steady
// rate; between two segments it may jump forward (always at a cut, never back)
const SA_CLOCK = (() => {
  const B = saB, c = saC;
  const S = [
    [-2, -1.72 - 2, 'real'],
    [1.0, 'cont', ['to', 0]],                                          // the cat jumps: slow motion into the lock
    [SA.tLock, 0, ['to', SA.sCount]],                                  // ★ 2:00:00.000 → 2:00:02: three and a half minutes
    [B('count'), SA.sCount, ['to', SA.sR0]],                           // the last second (×0.1)
    [SA.tRel, SA.sR0, ['to', SA.sFall]],                               // home: the air lets go (×0.05)
    [B('fall'), SA.sFall, ['rate', 0.2]],                              // the park (×0.2)
    [B('echo'), 8.0, 'real'],
    [B('fine'), 23.0 - (c('fine', 0) - B('fine')), 'real'],           // "20 seconds later"
    [B('stalled'), 43.0 - (c('stalled', 0) - B('stalled')), 'real'], // "40 seconds later"
    [B('sirens'), 63.0 - (c('sirens', 0) - B('sirens')), 'real'],     // "A minute later"
    [B('still'), 123.0 - (c('still', 0) - B('still')), 'real'],       // "Two minutes later"
    [B('planes'), 146.0, 'real'],
    [B('question'), 166.0, 'real'],
  ];
  const out = [];
  let prev = null;
  S.forEach((g, i) => {
    const t0 = g[0], tn = i + 1 < S.length ? S[i + 1][0] : SA.end + 5;
    const s0 = g[1] === 'cont' ? prev.s0 + prev.rate * (t0 - prev.t0) : g[1];
    const nx = i + 1 < S.length ? S[i + 1] : null;
    const rate = g[2] === 'real' ? 1 : g[2][0] === 'to' ? (g[2][1] - s0) / (tn - t0) : g[2][1];
    const seg = { t0, t1: tn, s0, s1: s0 + rate * (tn - t0), rate };
    out.push(seg); prev = seg; void nx;
  });
  out.forEach((g, i) => {
    if (!(g.t1 > g.t0) || g.rate <= 0) throw new Error(`SA_CLOCK: segment ${i} (t ${g.t0.toFixed(2)}–${g.t1.toFixed(2)}) runs backwards`);
    if (i && g.s0 < out[i - 1].s1 - 1e-6) throw new Error(`SA_CLOCK: segment ${i} starts before the last one ended (s ${g.s0.toFixed(3)} < ${out[i - 1].s1.toFixed(3)})`);
  });
  return out;
})();
function saSegAt(t) { const K = SA_CLOCK; let i = 0; while (i < K.length - 1 && t >= K[i + 1].t0) i++; return K[i]; }
function saStoryAt(t) { const g = saSegAt(t); return g.s0 + g.rate * (t - g.t0); }
const saRateAt = (t) => saSegAt(t).rate;                  // story seconds per film second (1 = real speed)
// the clock's jumps (film times where the story skips ahead), for the HUD's "+20 s"
const SA_JUMPS = SA_CLOCK.slice(1).map((g, i) => ({ t: g.t0, ds: g.s0 - SA_CLOCK[i].s1 })).filter((j) => j.ds > 0.5);
// the film time at which story time s is on screen (the clock is monotonic: bisect)
function saFilmAt(s) { let a = -2, b = SA.end + 1; for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (saStoryAt(m) < s) a = m; else b = m; } return (a + b) / 2; }
SA.tRelease = saFilmAt(SAP.T);                           // (film) 2:00:03.000

CONFIG.duration = SA.end;
CONFIG.seed = 20261104;
Object.assign(CONFIG.camera, { cameraHeight: 1.63, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 50, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;

const SCRIPT = {
  meta: { title: 'What if air became solid for 3 seconds?', wav: 'air-solid-soundtrack.wav' },
  events: [],                                            // (filled from the shots by shots.js)
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.63]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 50]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: {
    title: { in: SA.title[0], out: SA.title[1], fi: 0.25, fo: 0.5, cls: 'big center', html: '<span class="kick">WHAT IF AIR BECAME</span><span class="hero">SOLID</span><span class="kick k2">FOR 3 SECONDS?</span>' },
    captions: [],
    readouts: [],
  },
};
const SCRIPT_TRACKS = {};
