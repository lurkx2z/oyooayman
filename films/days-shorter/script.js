/* =====================================================================
   SCRIPT — "What if days kept getting shorter and couldn't stop?" (16:9, 1920×1080, 30 fps, voiceless).
   ★ The edit is built AROUND THE CAPTIONS: every beat below comes from the caption times (window.DST, written by
   build-timing.cjs from CAPTIONS.md). Change a pause → edit PAUSE there and re-run it.
   The physics (physics.js) runs on STORY time s: seconds after Sunday 12:00:00 noon, when the rule starts. This file
   maps film time t to story time s with ONE clock for the whole film (DS_CLOCK): it only ever runs forward (the
   owner's rule of 2026-10-29: no replays; every new angle or place moves the week on). Time-lapse where we watch days
   go by (the HUD says how fast), real speed for the human moments (the quake, the sofa, the spire, the cars, the
   9-second sunset, the last sunrise), and jumps forward only at cuts (the HUD says how far). Pure function of film time.
   ===================================================================== */

const DST_ID = Object.fromEntries(DST.groups.map((g) => [g.id, g]));
const dsS = (id) => DST_ID[id].first;         // the beat's first caption appears
const dsE = (id) => DST_ID[id].end;           // its last caption goes
const dsCap = (id, k) => DST_ID[id].caps[k];  // a caption: { text, show, hide, words }
const dsC = (id, k) => DST_ID[id].caps[k].show;
const dsB = (id, d = 0.6) => dsS(id) - d;     // a cut just before beat id's first caption

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (film seconds)
// ---------------------------------------------------------------------------------------------------------------------
const DS = {};
DS.t0 = 1.6;                                             // ★ the rule starts (story s = 0, Sunday noon), under the title
DS.title = [-0.4, dsE('title') + 0.25];
DS.end = DST.duration;
const H_ = 3600;
const dsAt = (day, h, m = 0, sec = 0) => (day * 24 + h - 12) * H_ + m * 60 + sec;      // story s of a clock time (day 0 = Sunday)
// the moments the beats are built on (story s)
DS.sSunset1 = dsSunset(0);                               // Sunday 5:52:36 PM
DS.sQuake = dsAt(0, 23, 40);
DS.sSunrise1 = dsSunrise(0);                             // Monday 4:55 AM
DS.sTueRise = dsSunrise(1);                              // Tuesday 0:25 AM
DS.sTueSet = dsSunset(2);                                // Tuesday 9:01 AM
DS.sMarble = dsAt(3, 13, 0);                             // Wednesday 1:00 PM (0.29°)
DS.sSofa = dsAt(6, 0, 4, 30);                            // Saturday 0:04:30 (19.6°): the sofa breaks loose
DS.sSpire = dsAt(6, 0, 15, 0);                           // the spire goes (21°)
DS.sCars = dsAt(6, 2, 15, 0);                            // the parked cars go (35°)
DS.sSunset2 = dsSunset(17);                              // Saturday 3:52:33 AM (the sun sets in 9 s)
DS.sDawn = dsSunrise(17);                                // Saturday 4:31:32 AM (the last sunrise)
DS.sCar = dsAt(4, 15, 30);                               // Thursday 3:30 PM: the car without its handbrake
DS.r0 = dsAt(0, 17, 0) / (dsB('dish') - DS.t0);          // the opening's time-lapse (story s per film s): noon at DS.t0, 5 PM at the dishes

// THE CLOCK: segments [film t where it starts, story s there, story s when the next segment starts | 'real']. Inside a
// segment the week runs at a steady rate; between two segments it may jump forward (always at a cut, never back)
const DS_CLOCK = (() => {
  const S = [
    [-2, -(DS.t0 + 2) * DS.r0, dsAt(0, 17, 0)],                            // the opening: about 18 minutes a second (11:30 AM on frame 1)
    [dsB('dish'), dsAt(0, 17, 4), dsAt(0, 17, 22)], [dsC('dish', 1) - 0.4, dsAt(0, 17, 24), dsAt(0, 17, 33)],
    [dsB('sunset'), DS.sSunset1 - 420, DS.sSunset1 + 240],                // the sun down the street, sinking
    [dsB('real'), dsAt(0, 19, 40), dsAt(0, 21, 40)],                      // the Moon racing across the night sky
    [dsB('quake'), DS.sQuake - 2.5, 'real'],                              // ★ the first quake: real speed
    [dsB('sunrise'), DS.sSunrise1 - 500, DS.sSunrise1 + 300],
    [dsB('node'), dsAt(1, 10, 0), dsAt(1, 10, 25)],
    [dsB('midnight'), DS.sTueRise - 420, DS.sTueRise + 120], [dsC('midnight', 1) - 0.5, DS.sTueRise + 600, 'real'],          // people out at 12:35 AM, in daylight
    [dsB('birds'), DS.sTueRise + 1300, 'real'],
    [dsB('lamps'), DS.sTueSet - 300, DS.sTueSet + 360],
    [dsB('wed'), dsAt(3, 6, 0), dsAt(3, 12, 38)],                          // Wednesday: a whole day across your floor
    [dsB('scale'), dsAt(3, 12, 42), dsAt(3, 12, 50)], [dsB('push'), dsAt(3, 12, 52), dsAt(3, 12, 59)],
    [dsB('marble'), DS.sMarble, 'real'],                                  // the marble: real speed
    [dsB('quake2'), dsAt(3, 20, 10), 'real'],
    [dsB('pond'), dsAt(4, 13, 0), dsAt(4, 14, 50)],                       // Thursday morning light (sunrise 12:40 PM)
    [dsB('car'), DS.sCar, 'real'], [dsC('car', 1) - 0.3, DS.sCar + 14.2, 'real'],   // the new angle skips ahead 7 s: the car meets the railings 4 s in (+18.4 s)
    [dsB('friday'), dsAt(5, 10, 50), dsAt(5, 18, 55)],                    // Friday: the days strobe
    [dsB('swings'), dsAt(5, 19, 0), dsAt(5, 19, 5)], [dsB('lighter'), dsAt(5, 19, 30), 'real'],
    [dsB('jump'), dsAt(5, 19, 45), 'real'], [dsB('glass'), dsAt(5, 21, 40), dsAt(5, 21, 43)],
    [dsB('sat'), dsAt(6, 0, 0), 'real'],
    [dsB('slide'), DS.sSofa - 2.0, 'real'],                               // ★ the sofa: real speed
    [dsB('spire'), DS.sSpire - 2.5, 'real'],                              // ★ the spire
    [dsB('lean'), dsAt(6, 1, 44), 'real'], [dsB('cars'), DS.sCars - 3.0, 'real'],
    [dsB('equator'), dsAt(6, 3, 33, 28), 'real'],                        // (the equator goes weightless at 3:33:40, in this shot)
    [dsB('sunset2'), DS.sSunset2 - 4.2, 'real'],                          // ★ the 9-second sunset
    [dsB('stars'), dsAt(6, 4, 8), dsAt(6, 4, 20)],                        // the stars wheeling: a short time-lapse
    [dsB('dawn'), DS.sDawn - 3.0, 'real'],                                // ★ the last sunrise, to the end
  ];
  const out = [];
  S.forEach((g, i) => {
    const t0 = g[0], tn = i + 1 < S.length ? S[i + 1][0] : DS.end + 5;
    const s0 = g[1], s1 = g[2] === 'real' ? s0 + (tn - t0) : g[2];
    out.push({ t0, t1: tn, s0, s1, rate: (s1 - s0) / (tn - t0) });
  });
  out.forEach((g, i) => {
    if (!(g.t1 > g.t0) || g.rate < 0) throw new Error(`DS_CLOCK: segment ${i} (t ${g.t0.toFixed(2)}–${g.t1.toFixed(2)}, s ${g.s0}–${g.s1}) runs backwards`);
    if (i && g.s0 < out[i - 1].s1 - 1e-6) throw new Error(`DS_CLOCK: segment ${i} starts before the last one ended (s ${g.s0} < ${out[i - 1].s1})`);
  });
  return out;
})();
function dsSegAt(t) { const K = DS_CLOCK; let i = 0; while (i < K.length - 1 && t >= K[i + 1].t0) i++; return K[i]; }
function dsStoryAt(t) { const g = dsSegAt(t); return g.s0 + g.rate * (t - g.t0); }
const dsRateAt = (t) => dsSegAt(t).rate;                  // story seconds per film second (1 = real speed)
// the clock's jumps (film times where the week skips ahead), for the HUD's "+2 h 10 min"
const DS_JUMPS = DS_CLOCK.slice(1).map((g, i) => ({ t: g.t0, ds: g.s0 - DS_CLOCK[i].s1 })).filter((j) => j.ds > 1);
// the film time at which story time s is on screen (the clock is monotonic: bisect)
function dsFilmAt(s) { let a = -2, b = DS.end + 1; for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (dsStoryAt(m) < s) a = m; else b = m; } return (a + b) / 2; }

// the things that break loose (physics.js dsSlider): friction set so each goes during its shot (values in PLAN.md)
const DS_MU = { marble: Math.tan(dsTilt(DS.sMarble + 1.5)), car: Math.tan(dsTilt(DS.sCar + 2.0)), bins: Math.tan(dsTilt(dsAt(5, 19, 31))), sofa: Math.tan(dsTilt(DS.sSofa)), chair: Math.tan(dsTilt(DS.sSofa + 1.6)),
  table: Math.tan(dsTilt(DS.sSofa + 3.0)), pouffe: Math.tan(dsTilt(DS.sSofa + 0.8)), cars: Math.tan(dsTilt(DS.sCars)), cars2: Math.tan(dsTilt(DS.sCars + 1.2)) };

CONFIG.duration = DS.end;
CONFIG.seed = 20261031;
Object.assign(CONFIG.camera, { cameraHeight: 1.63, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 50, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;

const SCRIPT = {
  meta: { title: 'What if days kept getting shorter and couldn’t stop?', wav: 'days-shorter-soundtrack.wav' },
  events: [],                                            // (filled from the shots by shots.js)
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.63]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 50]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: {
    title: { in: DS.title[0], out: DS.title[1], fi: 0.25, fo: 0.5, cls: 'big center', html: '<span class="kick">WHAT IF DAYS KEPT</span><span class="hero">GETTING SHORTER</span><span class="kick k2">AND COULDN’T STOP?</span>' },
    captions: [],
    readouts: [],
  },
};
const SCRIPT_TRACKS = {};
