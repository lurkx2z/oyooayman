/* =====================================================================
   SCRIPT — "What if the universe got cut in half?" (16:9, 1920×1080, 30 fps, 5:57, voiceless).
   ★ The edit is built AROUND THE CAPTIONS: every beat below comes from the caption times (window.HVT, written by
   build-timing.cjs from CAPTIONS.md). Change a pause → edit PAUSE there and re-run it.
   The physics (physics.js, PLAN.md § 2) runs on STORY time s (seconds after 10:00:00 PM GMT). This file maps film
   time to story time: the cold open at 10:03:31 (it ends as the shock arrives), the title over the night before,
   then REAL TIME from 9:59:40 to the shock at 10:03:42 (every event at its true second; the Moon's slowed-down replay
   is a cutaway inside it), then the planet's next hours from space (each shot its own clock, tagged TIME-LAPSE), then
   tonight again at 9:59.
   Everything is a pure function of film time.
   ===================================================================== */

const HVT_ID = Object.fromEntries(HVT.groups.map((g) => [g.id, g]));
// the first word of beat `id` (from word index `from`, counted across its captions) that starts with `txt`
function hvW(id, txt, from = 0) {
  const k = txt.toLowerCase(), ws = HVT_ID[id].caps.flatMap((c) => c.words);
  for (let i = from; i < ws.length; i++) if (ws[i].text.toLowerCase().replace(/[^a-z0-9']/g, '').startsWith(k)) return ws[i];
  throw new Error(`hvW: "${txt}" not found in beat ${id}`);
}
const hvS = (id) => HVT_ID[id].first;         // the beat's first caption appears
const hvE = (id) => HVT_ID[id].end;           // its last caption goes
const hvCap = (id, k) => HVT_ID[id].caps[k];  // a caption: { text, show, hide, words }

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (film seconds). Every other file keys off these.
// ---------------------------------------------------------------------------------------------------------------------
const HV = {};
HV.t0 = HVT.t0;                                          // ★ 10:00:00 PM: the cut (the "10:00:00." caption)
const hvStory = (s) => HV.t0 + s;                        // the film time of story second s, inside the real-time stretch
// 1 — the cold open (10:03:31: it ends as the shock arrives), the title
HV.titleShot = hvS('title') - 0.55;
HV.openHit = HV.titleShot - 0.5;                         // (the cold open's own shock: half a second of it, then the title)
HV.title = [hvS('title') - 0.3, hvE('title') + 0.6];
// 2 — 9:59:40: the night, the rule
HV.before = hvS('before') - 0.5;
HV.cat = hvW('before', 'your').start - 0.15;
HV.rule = hvS('rule') - 0.4;
HV.count = hvE('rule') + 0.25;                           // the last seconds: the whole sky
// 3 — real time from 10:00:00
HV.zero = HV.t0;
HV.line = hvS('line') - 0.4;                             // the line across the sky (labelled)
HV.moon = hvS('moon') - 0.5;                             // the Moon's replay, slowed down 8×
HV.moonEnd = hvE('moon') + 0.3;
HV.nothing = hvS('nothing') - 0.5;
HV.why = hvS('why') - 0.4;
HV.gone = hvS('gone') - 0.5;                             // space: what's left
HV.face = hvS('face') - 0.4;
HV.blow = hvS('blow') - 0.4;
HV.shock = hvS('shock') - 0.5;                           // the cross-section: the shock on its way
HV.calls = hvS('calls') - 0.5;
HV.tv = hvS('tv') - 0.5;
HV.front = hvS('front') - 0.5;                           // space: the front racing north
HV.edge = hvS('edge') - 0.5;
HV.moonedge = hvS('moonedge') - 0.5;
HV.others = hvS('others') - 0.5;
HV.compass = hvS('compass') - 0.5;
HV.nowhere = hvS('nowhere') - 0.5;
HV.saturn = hvS('saturn') - 0.5;                         // where Saturn was tonight (it went with the stars)
HV.cat2 = hvS('cat') - 0.5;                              // the cat on the wall, unbothered
HV.lighter = hvS('lighter') - 0.5;
HV.bath = hvS('bath') - 0.4;
HV.paris = hvS('paris') - 0.5;
HV.alarms = hvS('alarms') - 0.5;                         // the car alarms (they started at 10:02:58: their tilt sensors)
HV.count2 = hvS('count') - 0.5;
HV.hit = hvStory(HVP.tHit);                              // ★ 10:03:42.5: the shock arrives
HV.hitShot = HV.hit - 2.2;
HV.countCuts = [3.4, 5.2, 6.8, 8.2, 9.5].map((u) => HV.count2 + u);   // the last twelve seconds: quick cuts round the garden
// 4 — the planet's next hours, from space
HV.fall = hvS('fall') - 0.5;
HV.moonaway = hvS('moonaway') - 0.5;
HV.orbit = hvS('orbit') - 0.5;                           // the new Earth, still going round the Sun
HV.forever = hvS('forever') - 0.5;
// 5 — is any of this real; the question (tonight, 9:59)
HV.real = hvS('real') - 0.8;
HV.real2 = hvS('real2') - 0.3;
HV.real3 = hvS('real3') - 0.4;
HV.real4 = hvS('real4') - 0.4;
HV.real5 = hvS('real5') - 0.4;
HV.question = hvS('question') - 0.6;
HV.end = HVT.duration;
// the Moon's replay: 8× slower than life, from 0.1 s after 10:00:00 (its far limb goes at 0.67 s, the cut is done at 1.20 s)
HV.replay = { slow: 8, s0: 0.1, t0: HV.moon };
const hvReplayS = (t) => HV.replay.s0 + (t - HV.replay.t0) / HV.replay.slow;

// ---------------------------------------------------------------------------------------------------------------------
// FILM TIME → STORY TIME s
// ---------------------------------------------------------------------------------------------------------------------
function hvStoryAt(t) {
  if (t < HV.titleShot) return HVP.tHit + (t - HV.openHit);                   // the cold open: the shock at HV.openHit
  if (t < HV.before) return -21 - (HV.before - t);                             // the title: the night, a few seconds before 9:59:40
  if (t < HV.hit + 6) return t - HV.t0;                                        // real time (the replay is a cutaway)
  if (t < HV.real) return HVP.tHit + 6 + (t - HV.hit - 6);                     // (space shots run their own clocks: space.js)
  return t - HV.end - 1.0;                                                     // tonight again: 9:59, ticking towards 10
}
const hvInReal = (t) => t >= HV.before && t < HV.hit + 6;

CONFIG.duration = HV.end;
CONFIG.seed = 20261028;
Object.assign(CONFIG.camera, { cameraHeight: 1.62, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 55, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;

const SCRIPT = {
  meta: { title: 'What if the universe got cut in half?', wav: 'universe-cut-soundtrack.wav' },
  events: [
    { id: 's1', time: 0, label: '1 · 10:03:31' }, { id: 'title', time: HV.title[0], label: 'title' },
    { id: 's2', time: HV.before, label: '2 · 9:59:40' }, { id: 'zero', time: HV.zero, label: '★ 10:00' },
    { id: 'gone', time: HV.gone, label: 'space' }, { id: 'tv', time: HV.tv, label: 'tv' },
    { id: 'front', time: HV.front, label: 'front' }, { id: 'lighter', time: HV.lighter, label: '10:03' },
    { id: 'hit', time: HV.hit, label: '★ 10:03:42' }, { id: 's4', time: HV.fall, label: '4 · after' },
    { id: 's5', time: HV.real, label: '5 · real' }, { id: 'q', time: HV.question, label: 'question' },
  ],
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.62]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 55]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: {
    title: { in: HV.title[0], out: HV.title[1], fi: 0.25, fo: 0.5, cls: 'big center', html: '<span class="kick">WHAT IF THE UNIVERSE</span><span class="hero">GOT CUT IN HALF?</span>' },
    captions: [],
    readouts: [],
  },
};
const SCRIPT_TRACKS = {};
