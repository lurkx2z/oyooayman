/* =====================================================================
   SCRIPT — "What if light started moving backward?" (16:9, 1920×1080, 30 fps, ≈ 7½ min, voiceless).
   ★ The edit is built AROUND THE CAPTIONS: every beat below comes from the caption times (window.LBT, written by
   build-timing.cjs from CAPTIONS.md). Change a pause → edit PAUSE there and re-run it.
   The physics (physics.js, PLAN.md § 2) runs on STORY time s (seconds after 10:00:00 PM GMT). This file maps film
   time to story time: REAL TIME from 9:59:39 to 10:02:40 (the stars, the Moon, the second Sun at 10:01:21 all happen
   exactly when they would), then Hawaii from 11:59:52 their time, a time-lapse through the 8-minute wait, real time
   for the Sun's return, and time-lapses through the night, the sunrise, the next noon and the days after.
   Everything is a pure function of film time.
   ===================================================================== */

const LBT_ID = Object.fromEntries(LBT.groups.map((g) => [g.id, g]));
// the first word of beat `id` (from word index `from`, counted across its captions) that starts with `txt`
function lbW(id, txt, from = 0) {
  const k = txt.toLowerCase(), ws = LBT_ID[id].caps.flatMap((c) => c.words);
  for (let i = from; i < ws.length; i++) if (ws[i].text.toLowerCase().replace(/[^a-z0-9']/g, '').startsWith(k)) return ws[i];
  throw new Error(`lbW: "${txt}" not found in beat ${id}`);
}
const lbS = (id) => LBT_ID[id].first;         // the beat's first caption appears
const lbE = (id) => LBT_ID[id].end;           // its last caption goes
const lbCap = (id, k) => LBT_ID[id].caps[k];  // a caption: { text, show, hide, words }

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (film seconds). Every other file keys off these.
// ---------------------------------------------------------------------------------------------------------------------
const LB = {};
LB.t0 = LBT.t0;                                          // ★ 10:00:00 PM: the light turns around (the "10:00:00." caption)
const lbStory = (s) => LB.t0 + s;                        // the film time of story second s, inside the real-time stretch
// 1 — the cold open (10:02 PM, daylight), the title
LB.secondSun = lbCap('open', 1).show - 0.6;              // the camera finds the second Sun
LB.titleShot = lbS('title') - 0.55;
LB.title = [lbS('title') - 0.3, lbE('title') + 0.6];
// 2 — 9:59 PM: the night, the rule, the countdown
LB.before = lbS('before') - 0.5;
LB.rule = lbS('rule') - 0.4;
LB.flipRule = lbW('rule', 'turns').start + 0.2;          // the diagram's rays turn round
LB.count = lbE('rule') + 0.25;                           // the last seconds: the whole sky
// 3 — real time from 10:00:00
LB.zero = LB.t0;
LB.moonCut = LB.t0 + 1.6;                                // the telephoto on the Moon (its sliver lights from 1.3 s)
LB.lights = lbStory(6.2);                               // the sky, just before the mirror Earth appears (7.1 s)
LB.siriusCut = lbStory(18.3);                            // facing west before Sirius appears (20.5 s)
LB.mirror = lbS('mirror') - 0.45;
LB.replay = lbS('replay') - 0.45;                        // the lantern, slowed down a billion times (a cutaway)
LB.replayEnd = lbE('replay') + 0.35;
LB.europeCut = Math.max(lbS('europe') - 0.4, LB.replayEnd);                   // the upside-down Europe, shrinking to the north-east
LB.north = lbS('north') - 0.5;
LB.switchCut = lbStory(75.8);                            // down the garden, up at where the second Sun will be
// 4 — the second Sun
LB.day = lbS('day') - 0.6;
LB.robin = lbCap('day', 1).show - 0.2;
LB.lampsOff = lbCap('day', 2).show + 0.4;
LB.why = lbS('why') - 0.5;                               // space (an illustration)
LB.flip = lbCap('why', 0).show + 2.4;                    // the stream of old sunlight turns round
LB.shadow = lbS('shadow') - 0.4;
LB.wave = lbS('wave') - 0.5;
LB.moonwhy = lbS('moonwhy') - 0.5;
LB.project = lbS('project') - 0.5;
LB.past = lbS('past') - 0.4;
// 5 — Hawaii
LB.hawaii = lbS('hawaii') - 0.6;
LB.out = lbCap('hawaii', 1).show - 0.3;                  // ★ noon in Hawaii: their Sun goes out (s = 0)
LB.black = lbS('black') - 0.4;
LB.shrink = lbS('shrink') - 0.4;                         // the mirror Earth shrinking away, 25× faster
LB.half = lbS('half') - 0.5;                             // space: the whole day side at once
LB.wait = lbS('wait') - 0.5;
LB.voyager = lbS('voyager') - 0.5;
LB.ret = lbS('return') - 0.6;
LB.back = lbS('return') + 0.55;                          // ★ 10:08:13.5: the first new sunlight (the middle of the disc)
LB.double = lbS('double') - 0.4;
LB.sunClose = lbCap('double', 1).show - 0.3;             // from the Sun through a filter to the beach in its light
// 6 — home: the Moon, the night that never comes, the morning, noon, the days
LB.full = lbS('full') - 0.5;
LB.moonFull = lbS('full') + 0.45;                        // ★ 10:08:18: the Moon's day side lights again
LB.three = lbS('three') - 0.4;
LB.midnight = lbS('midnight') - 0.6;
LB.sunrise = lbS('sunrise') - 0.6;
LB.bothDown = lbCap('sunrise', 1).show + 0.2;            // ★ 6:45 AM: one rises as the other sets
LB.little = lbS('little') - 0.5;                         // the mirror Earth at dawn: Moon-sized, high in the south
LB.noon = lbS('noon') - 0.5;
LB.never = lbS('never') - 0.5;
// 7 — the planet, the years
LB.summer = lbS('summer') - 0.5;
LB.heat = lbS('heat') - 0.4;
LB.ice = lbCap('heat', 2).show - 0.4;
LB.boil = lbS('boil') - 0.5;
LB.birth = lbS('birth') - 0.5;
LB.nightBack = lbCap('birth', 2).show - 0.3;               // the last starry night (9:56 PM, tonight)
// 8 — is any of this real; the question
LB.real = lbS('real') - 0.8;
LB.real2 = lbS('real2') - 0.3;
LB.real3 = lbS('real3') - 0.4;
LB.real4 = lbS('real4') - 0.4;
LB.question = lbS('question') - 0.6;
LB.end = LBT.duration;

// ---------------------------------------------------------------------------------------------------------------------
// FILM TIME → STORY TIME s. Keys [film t, s], linear between them (slope 1 = real time).
// ---------------------------------------------------------------------------------------------------------------------
// 6:45 AM tomorrow: sunrise as the almanac gives it (the real Sun's top edge appears: its centre 0.83° below the
// horizon, the air lifting it); the second Sun, opposite, is then 0.83° up and sets ~11 minutes later
const LB_SUNRISE = (() => {
  let lo = lbAt(6, 0), hi = lbAt(8, 0);
  for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (lbAltAz(lbSunDir(m), lbFrame(m)).alt > -0.833) hi = m; else lo = m; }
  return { s: hi };
})();
const LB_SKEYS = [], LB_SLOW_T = 3.2;                      // (film seconds of the slowed-down return)
{
  const K = LB_SKEYS, real = (t0, t1, tp, sp) => { K.push([t0, sp + (t0 - tp)], [t1, sp + (t1 - tp)]); };
  real(-1, LB.before, 0, 150);                                         // the cold open: 10:02:30
  real(LB.before, LB.hawaii, LB.t0, 0);                               // 9:59:39 → 10:02:40, real time
  // Hawaii: 11:59:52 → the Sun out at noon; real time while the sky fills with the sea; the mirror Earth shrinking
  // away 25× faster (to 3½ minutes); then a steady lapse (the day side from space has its own clock) to just before
  // the Sun's return, and real time over it
  const sS = 214, sRet = LBP.tFirst - (LB.back - (LB.ret - 0.4));
  real(LB.hawaii, LB.shrink, LB.out, 0); K.push([LB.half - 1e-3, sS]);
  K.push([LB.ret - 0.4, sRet]);
  // (the Sun's return slowed 8×, so the dot can be seen growing into a disc; then a gentle catch-up to real time)
  real(LB.ret - 0.4 + 1e-3, LB.back, LB.back, LBP.tFirst);
  K.push([LB.back + LB_SLOW_T, LBP.tFirst + LB_SLOW_T / 8], [LB.full, LBP.tFirst + (LB.full - LB.back)]);
  real(LB.full, LB.three + 2.5, LB.moonFull, LB_MOON.dayBack);         // home: 10:08:18 on the Moon's return
  // (the night: a time-lapse to midnight, slow over it; to 6:47 AM, slow over it; to noon; then the days)
  // (each lapse speed holds for a whole shot, so no shot opens with a jump)
  const mid = lbAt(0, 0, 0), sRise = LB_SUNRISE.s, noon = lbAt(12, 0, 0);
  K.push([LB.midnight, mid - 30 * 1.2], [LB.sunrise - 1e-3, mid + 30 * (LB.sunrise - LB.midnight - 1.2)]);
  K.push([LB.sunrise, sRise - 20 * (LB.bothDown - LB.sunrise)], [LB.little - 1e-3, sRise + 20 * (LB.little - LB.bothDown)]);
  K.push([LB.little, sRise + 20 * (LB.little - LB.bothDown) + 1e-3], [LB.noon - 1e-3, noon - 900]);   // (the little Earth: 7 AM → 11:45)
  real(LB.noon, LB.never, lbCap('noon', 0).show, noon);               // noon tomorrow, real time
  K.push([LB.summer - 0.2, noon + 86400 * 3]);                        // three days in a few seconds
  real(LB.summer - 0.2 + 1e-3, LB.end + 2, LB.summer - 0.2 + 1e-3, lbAt(12, 0, 0) + 86400 * 3);
  // (the summer shot runs on its own clock: lbStoryAt below)
  for (let i = 1; i < K.length; i++) if (K[i][0] <= K[i - 1][0]) K[i][0] = K[i - 1][0] + 1e-3;
}
// the weeks with no winter (the summer shot): a whole day per step, so the date runs on (to day 60) while the light
// moves only as it would over a slow afternoon (the time of day advances 1.2 hours per second)
const LB_WEEKS = { t0: 0, t1: 0, d0: 3, d1: 60 };
function lbStoryAt(t) {
  if (t >= LB_WEEKS.t0 && t < LB_WEEKS.t1) {
    const u = (t - LB_WEEKS.t0) / (LB_WEEKS.t1 - LB_WEEKS.t0), d = Math.floor(LB_WEEKS.d0 + (LB_WEEKS.d1 - LB_WEEKS.d0) * u * u);
    return lbAt(13, 0, 0) + 86400 * d + 3600 * 1.2 * (t - LB_WEEKS.t0);
  }
  const K = LB_SKEYS;
  if (t <= K[0][0]) return K[0][1] + (t - K[0][0]);
  for (let i = 1; i < K.length; i++) if (t <= K[i][0]) { const [t0, s0] = K[i - 1], [t1, s1] = K[i]; return s0 + (s1 - s0) * (t - t0) / (t1 - t0); }
  const L = K[K.length - 1]; return L[1] + (t - L[0]);
}
// the film time in [a, b] at which the story clock reads s (it only runs forwards there)
function lbFilmAt(s, a, b) { let lo = a, hi = b; for (let i = 0; i < 50; i++) { const m = 0.5 * (lo + hi); if (lbStoryAt(m) < s) lo = m; else hi = m; } return 0.5 * (lo + hi); }
// is the clock lapsing at t (faster than real time)?
function lbLapsing(t) { const a = lbStoryAt(t - 0.02), b = lbStoryAt(t + 0.02); return (b - a) / 0.04 > 1.5; }
const lbInHawaii = (t) => t >= LB.hawaii && t < LB.full;
LB_WEEKS.t0 = LB.summer; LB_WEEKS.t1 = LB.heat;
LB.disc = lbFilmAt(LBP.tFirst + LBP.tLimb, LB.back, LB.full);   // the Sun's whole disc is back (slowed down 8×, then catching up)

CONFIG.duration = LB.end;
CONFIG.seed = 20261026;
Object.assign(CONFIG.camera, { cameraHeight: 1.62, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 55, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;

const SCRIPT = {
  meta: { title: 'What if light started moving backward?', wav: 'light-backward-soundtrack.wav' },
  events: [
    { id: 's1', time: 0, label: '1 · 10:02 PM' }, { id: 'title', time: LB.title[0], label: 'title' },
    { id: 's2', time: LB.before, label: '2 · 9:59' }, { id: 'zero', time: LB.zero, label: '★ 10:00' },
    { id: 'sw', time: lbStory(LB_SKY.on), label: '★ 2nd Sun' }, { id: 's4', time: LB.why, label: '4 · why' },
    { id: 's5', time: LB.hawaii, label: '5 · Hawaii' }, { id: 'back', time: LB.back, label: '★ Sun back' },
    { id: 's6', time: LB.full, label: '6 · home' }, { id: 's7', time: LB.summer, label: '7 · the years' },
    { id: 's8', time: LB.real, label: '8 · real' }, { id: 'q', time: LB.question, label: 'question' },
  ],
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.62]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 55]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: {
    title: { in: LB.title[0], out: LB.title[1], fi: 0.25, fo: 0.5, cls: 'big center', html: '<span class="kick">WHAT IF LIGHT STARTED</span><span class="hero">MOVING BACKWARD?</span>' },
    captions: [],
    readouts: [],
  },
};
const SCRIPT_TRACKS = {};
