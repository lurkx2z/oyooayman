/* =====================================================================
   SCRIPT — "What if the air turned into a breathable liquid for one hour?" (16:9, 1920×1080, 30 fps, voiceless).
   ★ The edit is built AROUND THE CAPTIONS: every beat below comes from the caption times (window.LAT, written by
   build-timing.cjs from CAPTIONS.md). Change a pause → edit PAUSE there and re-run it.
   The physics (physics.js) runs on STORY time s: seconds after 3:00:00 PM, when the air starts to turn; it turns back
   at s = 3600 (4:00:00). This file maps film time t to story time s with ONE clock for the whole film (LA_CLOCK): it
   only ever runs forward (the owner's rule of 2026-10-29: no replays; every new angle or place moves the hour on).
   Real speed for the first minute, the dive, the crash and the sun, the bell and the last ten seconds; faster in
   between, with jumps only at cuts (the HUD says how much). Everything is a pure function of film time.
   ===================================================================== */

const LAT_ID = Object.fromEntries(LAT.groups.map((g) => [g.id, g]));
const laS = (id) => LAT_ID[id].first;         // the beat's first caption appears
const laE = (id) => LAT_ID[id].end;           // its last caption goes
const laCap = (id, k) => LAT_ID[id].caps[k];  // a caption: { text, show, hide, words }
const laC = (id, k) => LAT_ID[id].caps[k].show;
const laB = (id, d = 0.6) => laS(id) - d;     // a cut just before beat id's first caption

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (film seconds)
// ---------------------------------------------------------------------------------------------------------------------
const LA = {};
LA.t0 = 1.6;                                             // ★ the air starts to turn (story s = 0), under the title
LA.title = [-0.4, laE('title') + 0.25];
LA.end = LAT.duration;
LA.tCrash = laC('crash', 0) - 0.3;                       // (the crash's segment starts here, at 3:09:59)

// THE CLOCK: segments [film t where it starts, story s there, story s when the next segment starts | 'real']. Inside a
// segment the hour runs at a steady rate; between two segments it may jump forward (always at a cut, never back). Each
// one is where a beat needs the hour to be (PLAN.md § 3)
const LA_CLOCK = (() => {
  const S = [
    [-2, -LA.t0 - 2, 'real'],                                             // the first minute: real speed
    [laB('ears'), 60, 70], [laB('packet'), 76, 96], [laB('go'), 98, 104],
    [laB('stairs'), 118, 140], [laB('street'), 150, 168], [laB('lamps'), 180, 196],
    [laB('cars'), 300, 330], [laB('light'), 334, 350], [laB('rising'), 356, 372], [laB('ball'), 384, 416],
    [laB('chin'), 427, 'real'], [laB('breathe'), 446, 'real'],            // chin deep; under (3:07:30): real speed
    [laB('first'), 466, 484], [laB('under'), 488, 504], [laB('voice'), 507, 520], [laB('sink'), 524, 548],
    [laB('last'), 556, 597],
    [LA.tCrash, 598.9, 'real'],                                           // ★ 3:10: the crash, and the sun, at real speed
    [laB('deep'), 640, 680], [laB('flat'), 696, 900], [laB('snell'), 920, 960], [laB('moon'), 990, 1030],
    [laB('float'), 1080, 1130], [laB('pond'), 1200, 1240], [laB('birds'), 1400, 1430],
    [laB('bell'), 'bell', 'real'],                                        // ★ the bell at 3:30:00 sharp
    [laB('top'), 2000, 2030], [laB('cold'), 2400, 2440], [laB('work'), 2700, 2730], [laB('back'), 3420, 3490],
    [laC('fizz', 0) - 10, 3590, 'real'],                                  // ★ the last ten seconds, and 4:00
  ];
  const sb = 1800 - (laC('bell', 0) + 0.4 - laB('bell'));
  const out = [];
  S.forEach((g, i) => {
    const t0 = g[0], tn = i + 1 < S.length ? S[i + 1][0] : LA.end + 5;
    const s0 = g[1] === 'bell' ? sb : g[1], s1 = g[2] === 'real' ? s0 + (tn - t0) : g[2];
    out.push({ t0, t1: tn, s0, s1, rate: (s1 - s0) / (tn - t0) });
  });
  out.forEach((g, i) => {
    if (!(g.t1 > g.t0) || g.rate < 0) throw new Error(`LA_CLOCK: segment ${i} (t ${g.t0.toFixed(2)}–${g.t1.toFixed(2)}, s ${g.s0}–${g.s1}) runs backwards`);
    if (i && g.s0 < out[i - 1].s1 - 1e-6) throw new Error(`LA_CLOCK: segment ${i} starts before the last one ended (s ${g.s0} < ${out[i - 1].s1})`);
  });
  return out;
})();
function laSegAt(t) { const K = LA_CLOCK; let i = 0; while (i < K.length - 1 && t >= K[i + 1].t0) i++; return K[i]; }
function laStoryAt(t) { const g = laSegAt(t); return g.s0 + g.rate * (t - g.t0); }
// the clock's jumps (film times where the hour skips ahead), for the HUD's "+12 MIN"
const LA_JUMPS = LA_CLOCK.slice(1).map((g, i) => ({ t: g.t0, ds: g.s0 - LA_CLOCK[i].s1 })).filter((j) => j.ds > 1);
// the film time at which story time s is on screen (the clock is monotonic: bisect)
function laFilmAt(s) { let a = -2, b = LA.end + 1; for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (laStoryAt(m) < s) a = m; else b = m; } return (a + b) / 2; }

// after 3:10, in your empty flat (a vacuum): the glass of water boils from 3:10, then freezes over (evaporation takes
// the heat: minutes, shown inside the [flat] beat's fast clock)
const LA_BOIL = { s0: 600, freeze0: laStoryAt(laC('flat', 2)) - 70, freeze1: laStoryAt(laC('flat', 2)) + 30 };
LA.tBack = laFilmAt(LAP.back);                           // 4:00:00

CONFIG.duration = LA.end;
CONFIG.seed = 20261031;
Object.assign(CONFIG.camera, { cameraHeight: 1.63, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 50, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;

const SCRIPT = {
  meta: { title: 'What if the air turned into a breathable liquid for one hour?', wav: 'liquid-air-soundtrack.wav' },
  events: [],                                            // (filled from the shots by shots.js)
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.63]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 50]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: {
    title: { in: LA.title[0], out: LA.title[1], fi: 0.25, fo: 0.5, cls: 'big center', html: '<span class="kick">WHAT IF THE AIR TURNED INTO</span><span class="hero">A BREATHABLE LIQUID</span><span class="kick k2">FOR ONE HOUR?</span>' },
    captions: [],
    readouts: [],
  },
};
const SCRIPT_TRACKS = {};
