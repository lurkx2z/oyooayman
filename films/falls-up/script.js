/* =====================================================================
   SCRIPT — "What if everything you dropped fell up for 10 minutes?" (16:9, 1920×1080, 30 fps, voiceless).
   ★ The edit is built AROUND THE CAPTIONS: every beat below comes from the caption times (window.FUT, written by
   build-timing.cjs from CAPTIONS.md). Change a pause → edit PAUSE there and re-run it.
   The physics (physics.js) runs on STORY time s: seconds after 3:00:00 PM, when the rule starts; it ends at s = 600.
   This file maps film time t to story time s with ONE clock for the whole film (FU_CLOCK): it only ever runs forward
   (the owner's rule of 2026-10-29: no replays; every new angle or place moves the ten minutes on). Real speed for
   almost everything, slow motion for the moments the eye needs (the glass, the spoon and the grape, the cat, the
   runner, the ceiling coming down: the HUD says so), and jumps forward only at cuts (the HUD says how far).
   ===================================================================== */

const FUT_ID = Object.fromEntries(FUT.groups.map((g) => [g.id, g]));
const fuS = (id) => FUT_ID[id].first;         // the beat's first caption appears
const fuE = (id) => FUT_ID[id].end;           // its last caption goes
const fuCap = (id, k) => FUT_ID[id].caps[k];  // a caption: { text, show, hide, words }
const fuC = (id, k) => FUT_ID[id].caps[k].show;
const fuB = (id, d = 0.6) => fuS(id) - d;     // a cut just before beat id's first caption

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (film seconds) and the moments they are built on (story seconds)
// ---------------------------------------------------------------------------------------------------------------------
const FU = {};
FU.title = [-0.4, fuE('title') + 0.25];
FU.end = FUT.duration;
FU.tGlass = 0.6;                                         // ★ (film) the slow motion under the title starts; the glass goes at s = 0
FU.sSG = 16.6;                                           // the spoon and the grape are let go of
FU.sPour = [41.6, 46.2];                                 // the kettle tipped: the stream runs (story s)
FU.sCat = 70.0;                                          // the cat jumps off the counter
FU.sApple = FU_FLY.apple.s0;                             // 3:01:30: the apple
FU.sKeys = FU_FLY.keys.s0; FU.sPhone = FU_FLY.phone.s0; FU.sCoffee = 133.0;
FU.sFish = 211.0;
FU.sKick = FU_FLY.ball.s0; FU.sScoop = 225.6;
FU.sRun = 256.9;                                         // she starts her run (the first stride's push: 258.0)
FU.sLift = FU_FLY.jogger.s0;                             // ...and she leaves the ground
FU.sCoat = FU_FLY.coat.s0;
FU.sDog = 329.4;
FU.sSpace = FU_SPACE_S;                                  // 3:09:40: the apple crosses 100 km
FU.sCount = 590;                                         // "Ten seconds."

// THE CLOCK: segments [film t where it starts, story s there, story s when the next segment starts | 'real' | ['rate', r]].
// Inside a segment time runs at a steady rate; between two segments it may jump forward (always at a cut, never back)
const FU_CLOCK = (() => {
  const B = fuB, c = fuC, slow = 0.38;
  const sAt = (tFilm, tRef, sRef) => sRef + (tFilm - tRef);           // story s at a film time in a real-speed stretch from (tRef, sRef)
  const tLift = c('jogger', 1) + 1.85;                                 // (film) her first stride leaves the ground
  const tCount = c('count', 0);                                        // (film) "Ten seconds." (s = 590)
  const S = [
    [-2, -3.0, 'real'],
    [FU.tGlass, FU.tGlass - 3.0 + 2, ['rate', slow]],                  // the glass slips (slow motion: ×0.38)
    [FU.tGlass + 2.6, 'cont', 'real'],
    [B('rate'), FU.sSG - (c('rate', 0) + 2.05 - B('rate')), 'real'],   // the spoon and the grape
    [c('rate', 0) + 1.9, 'cont', ['rate', slow]], [c('rate', 0) + 4.1, 'cont', 'real'],
    [B('real'), 26.0, 'real'],
    [B('kettle'), FU.sPour[0] - (fuCap('kettle', 0).hide + 0.25 - B('kettle')), 'real'],
    [B('cat'), FU.sCat - (fuCap('cat', 0).hide + 0.35 - B('cat')), 'real'],
    [fuCap('cat', 0).hide + 0.15, 'cont', ['rate', slow]], [fuCap('cat', 0).hide + 2.9, 'cont', 'real'],
    [B('stuck'), 76.4, 'real'],                                        // (the cat on the ceiling: its two tries, FU.sCatHop)
    [B('apple'), FU.sApple - (c('apple', 0) + 2.9 - B('apple')), 'real'],
    [B('street'), 126.4, 'real'],
    [B('leaves'), 180.0, 'real'],                                      // 3:03:00
    [B('fountain'), 192.0, 'real'],
    [B('fish'), FU.sFish - 1.4, 'real'],
    [B('ball'), FU.sKick - 1.5, 'real'],
    [B('scoop'), FU.sScoop - 1.2, 'real'],
    [B('walk'), 231.0, 'real'],
    [B('jogger'), FU.sLift - (tLift - B('jogger')), 'real'],
    [tLift - 0.2, 'cont', ['rate', 0.33]], [tLift + 2.6, 'cont', 'real'],   // she leaves the ground (slow motion)
    [B('rope'), FU.sCoat - (c('rope', 1) - 1.0 - B('rope')), 'real'],
    [c('rope', 1) - 1.1, 'cont', ['rate', 0.33]], [c('rope', 1) + 1.6, 'cont', 'real'],   // the coat goes past her (slow motion)
    [B('dog'), FU.sDog - (c('dog', 0) + 1.6 - B('dog')), 'real'],
    [B('pigeons'), 345.0, 'real'],
    [B('height'), 360.0 - (c('height', 0) - B('height')) + 0.3, 'real'],   // "3:06"
    [B('planes'), 420.0 - (c('planes', 0) - B('planes')) + 0.3, 'real'],   // "3:07"
    [B('warn'), 440.0, 'real'],
    [B('home'), 480.0 - (c('home', 0) - B('home')) + 0.3, 'real'],         // "3:08"
    [B('hold2'), 540.0 - (c('hold2', 0) - B('hold2')) + 0.3, 'real'],      // "3:09"
    [B('space'), FU.sSpace - (c('space', 0) - B('space')) - 0.15, 'real'], // "3:09:40": the apple crosses 100 km
    [B('count'), FU.sCount - (tCount - B('count')), 'real'],              // "Ten seconds."
    [tCount + 9.75, 'cont', ['rate', 0.4]], [tCount + 9.75 + 2.6, 'cont', 'real'],   // ★ 3:10:00 in your kitchen: the ceiling comes down (slow motion)
    [B('down'), 604.6, 'real'],                                        // back in the park: she hangs from the branch the normal way
  ];
  const out = [];
  let prev = null;
  S.forEach((g, i) => {
    const t0 = g[0], tn = i + 1 < S.length ? S[i + 1][0] : FU.end + 5;
    const s0 = g[1] === 'cont' ? prev.s0 + prev.rate * (t0 - prev.t0) : g[1];
    const rate = g[2] === 'real' ? 1 : g[2][1];
    const seg = { t0, t1: tn, s0, s1: s0 + rate * (tn - t0), rate };
    out.push(seg); prev = seg;
  });
  out.forEach((g, i) => {
    if (!(g.t1 > g.t0) || g.rate <= 0) throw new Error(`FU_CLOCK: segment ${i} (t ${g.t0.toFixed(2)}–${g.t1.toFixed(2)}) runs backwards`);
    if (i && g.s0 < out[i - 1].s1 - 1e-6) throw new Error(`FU_CLOCK: segment ${i} starts before the last one ended (s ${g.s0.toFixed(2)} < ${out[i - 1].s1.toFixed(2)})`);
  });
  void sAt;
  return out;
})();
function fuSegAt(t) { const K = FU_CLOCK; let i = 0; while (i < K.length - 1 && t >= K[i + 1].t0) i++; return K[i]; }
function fuStoryAt(t) { const g = fuSegAt(t); return g.s0 + g.rate * (t - g.t0); }
const fuRateAt = (t) => fuSegAt(t).rate;                  // story seconds per film second (1 = real speed)
// the clock's jumps (film times where the ten minutes skip ahead), for the HUD's "+40 s"
const FU_JUMPS = FU_CLOCK.slice(1).map((g, i) => ({ t: g.t0, ds: g.s0 - FU_CLOCK[i].s1 })).filter((j) => j.ds > 0.5);
// the film time at which story time s is on screen (the clock is monotonic: bisect)
function fuFilmAt(s) { let a = -2, b = FU.end + 1; for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (fuStoryAt(m) < s) a = m; else b = m; } return (a + b) / 2; }
// the film time the ceiling comes down (3:10:00, in your kitchen)
FU.tDrop = fuFilmAt(FUP.T);
// the cat's two tries to jump down from the ceiling (story s)
FU.sCatHop = [fuStoryAt(fuC('stuck', 0) + 0.7), fuStoryAt(fuC('stuck', 0) + 3.1)];

CONFIG.duration = FU.end;
CONFIG.seed = 20261102;
Object.assign(CONFIG.camera, { cameraHeight: 1.63, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 50, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;

const SCRIPT = {
  meta: { title: 'What if everything you dropped fell up for 10 minutes?', wav: 'falls-up-soundtrack.wav' },
  events: [],                                            // (filled from the shots by shots.js)
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.63]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 50]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: {
    title: { in: FU.title[0], out: FU.title[1], fi: 0.25, fo: 0.5, cls: 'big center', html: '<span class="kick">WHAT IF EVERYTHING YOU DROPPED</span><span class="hero">FELL UP</span><span class="kick k2">FOR 10 MINUTES?</span>' },
    captions: [],
    readouts: [],
  },
};
const SCRIPT_TRACKS = {};
