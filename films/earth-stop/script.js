/* =====================================================================
   SCRIPT — "What if Earth stopped spinning for 1 second?" (16:9, 1920×1080, 30 fps, voiceless).
   ★ The edit is built AROUND THE CAPTIONS: every beat below comes from the caption times (window.EST, written by
   build-timing.cjs from CAPTIONS.md). Change a pause → edit PAUSE there and re-run it.
   The physics (physics.js) runs on STORY time s: seconds after Sunday 5:42:00.000 PM, when the ground stops turning
   (for one second). This file maps film time t to story time s with ONE clock for the whole film (ES_CLOCK): it only
   ever runs forward (the owner's rule of 2026-10-29: no replays; every new angle or place moves the clock on). The
   whole film after the title is that one second and the 0.29 s after it, 150 to 900 times slower (the HUD says how
   slowly), with short bursts 30 to 50 times slower where something hits.
   ===================================================================== */

const EST_ID = Object.fromEntries(EST.groups.map((g) => [g.id, g]));
const esS = (id) => EST_ID[id].first;         // the beat's first caption appears
const esE = (id) => EST_ID[id].end;           // its last caption goes
const esCap = (id, k) => EST_ID[id].caps[k];  // a caption: { text, show, hide, words }
const esC = (id, k) => EST_ID[id].caps[k].show;
const esB = (id, d = 0.6) => esS(id) - d;     // a cut just before beat id's first caption

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (film seconds)
// ---------------------------------------------------------------------------------------------------------------------
const ES = {};
ES.title = [-0.4, esE('title') + 0.25];
ES.end = EST.duration;
ES.tOn = 2.85;                                          // ★ (film) 5:42:00 PM: the ground stops turning (s = 0)

// THE CLOCK: [film t where a segment starts, story s there (at least), how it runs]
//   'real' = real speed; 'to' = a steady rate that reaches the next segment's s exactly when it starts
const ES_CLOCK = (() => {
  const B = esB, C = esC, P = ESP;
  const S = [
    [-2, -2.85 - 2, 'real'],
    [ES.tOn, 0, 'to'],                                     // ★ 5:42:00.000: a burst (25 times slower: the whole station lurches east)…
    [ES.tOn + 0.3, 0.012, 'to'],                           // …slowing…
    [ES.tOn + 1.2, 0.020, 'to'],
    [C('start', 0) + 1.4, 0.026, 'to'],                    // the whole station, gliding off its floor (200 times slower)
    [B('speed'), 0.062, 'to'],
    [B('bolts'), 0.0975, 'to'],                            // a column's foot skating over the next column's sheared bolts
    [C('bolts', 1) - 0.5, 0.106, 'to'],
    [C('bolts', 2) - 0.8, 0.112, 'to'],                    // the building sliding off its floor
    [B('town'), 0.135, 'to'],
    [B('people'), 0.16, 'to'],                             // the people on the platform…
    [C('people', 2) - 0.6, 0.172, 'to'],                   // …and its end (90 times slower)
    [C('people', 3) - 0.8, 0.238, 'to'],                   // the pigeons
    [B('train'), 0.25, 'to'],                              // your train, skidding
    [C('train', 3) - 0.5, 0.285, 'to'],                    // it passes (110 times slower)
    [B('energy'), 0.325, 'to'],
    [B('hill'), 0.36, 'to'],
    [C('hill', 2) - 0.8, 0.38, 'to'],                      // the palms (and the depot's shed) reaching the rock
    [B('depot'), 0.405, 'to'],
    [C('depot', 2) - 1.4, P.wagon0 - 0.007, 'to'],         // the first wagon's last 3 metres…
    [C('depot', 2) - 0.15, P.wagon0, 'to'],                // …it meets the rock as "The first one just reached the rock" comes up:
    [C('depot', 2) + 0.75, P.wagon0 + 0.024, 'to'],        // a burst (38 times slower)
    [B('wind'), 0.5, 'to'],
    [B('sea'), 0.555, 'to'],
    [C('sea', 4) - 0.7, P.ferryHit - 0.012, 'to'],         // the ferry's last 6 metres
    [C('sea', 4) + 0.2, P.ferryHit + 0.004, 'to'],
    [B('up'), 0.665, 'to'],
    [B('fall'), 0.72, 'to'],
    [B('sky'), 0.8, 'to'],
    [B('count'), 0.86, 'to'],
    [C('count', 1), 0.95, 'to'],                           // "…again in 0.05 seconds"
    [C('back', 0) - 0.55, P.T, 'to'],                      // ★ 5:42:01.000 as "The ground is turning again" comes up
    [C('back', 1) - 0.4, 1.010, 'to'],
    [B('twist'), 1.03, 'to'],
    [B('second'), 1.10, 'to'],
    [C('second', 1) - 0.5, 1.12, 'to'],                    // "It reaches your train in 0.2 seconds": 40 times slower to the end
    [B('question'), 1.225, 'to'],
    [ES.end + 0.3, P.blastHit - 0.004, 'real'],
  ];
  const out = [];
  S.forEach((g, i) => {
    const t0 = g[0], nx = S[i + 1], t1 = nx ? nx[0] : ES.end + 10, pv = out[i - 1];
    let s0 = g[1];
    if (pv && pv.mode !== 'to') s0 = Math.max(s0, pv.s1);
    const rate = g[2] === 'real' ? 1 : g[2] === 'to' ? (nx[1] - s0) / (t1 - t0) : g[2][1];
    out.push({ t0, t1, s0, s1: s0 + rate * (t1 - t0), rate, mode: g[2] === 'to' ? 'to' : 'run' });
  });
  out.forEach((g, i) => {
    if (!(g.t1 > g.t0) || g.rate <= 0) throw new Error(`ES_CLOCK: segment ${i} (t ${g.t0.toFixed(2)}–${g.t1.toFixed(2)}) runs backwards`);
    if (i && g.s0 < out[i - 1].s1 - 1e-6) throw new Error(`ES_CLOCK: segment ${i} starts before the last one ended (s ${g.s0.toFixed(3)} < ${out[i - 1].s1.toFixed(3)})`);
  });
  return out;
})();
function esSegAt(t) { const K = ES_CLOCK; let i = 0; while (i < K.length - 1 && t >= K[i + 1].t0) i++; return K[i]; }
function esStoryAt(t) { const g = esSegAt(t); return g.s0 + g.rate * (t - g.t0); }
const esRateAt = (t) => esSegAt(t).rate;                  // story seconds per film second (1 = real speed)
const ES_JUMPS = ES_CLOCK.slice(1).map((g, i) => ({ t: g.t0, ds: g.s0 - ES_CLOCK[i].s1 })).filter((j) => j.ds > 0.5);
// the film time at which story time s is on screen (the clock is monotonic: bisect)
function esFilmAt(s) { let a = -2, b = ES.end + 1; for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (esStoryAt(m) < s) a = m; else b = m; } return (a + b) / 2; }

// the captions that name a moment must sit on it (the clock only runs forward: there is no second chance), and every
// number in a caption must be the one physics.js gives
{
  const P = ESP, F = ES_F;
  const near = (id, k, s, lo, hi) => { const d = esC(id, k) - esFilmAt(s); if (d < lo || d > hi) throw new Error(`caption ${id}:${k} shows ${d.toFixed(2)} s from story ${s.toFixed(3)} (want ${lo}…${hi})`); };
  near('depot', 2, P.wagon0, -0.1, 0.6);                    // "The first one just reached the rock"
  near('back', 0, P.T, 0.2, 1.0);                           // "5:42:01 PM. The ground is turning again"
  const sAt = (id, k, d = 0.4) => esStoryAt(esC(id, k) + d);
  const num = (id, k, re, v, tol) => { const m = re.exec(esCap(id, k).text); if (!m) throw new Error(`caption ${id}:${k}: no number`); const x = parseFloat(m[1].replace(/,/g, '')); if (Math.abs(x - v) > tol) throw new Error(`caption ${id}:${k} says ${x}, physics says ${v.toFixed(3)}`); };
  num('speed', 0, /at ([\d,]+) km\/h/, P.kmh, 8);
  num('speed', 2, /in ([\d.]+) minutes/, P.sunMin, 0.5);
  num('people', 1, /doing ([\d,]+) km\/h/, P.kmh, 8);
  num('people', 2, /by ([\d.]+) km\/h/, P.personKmh, 0.6);
  num('bolts', 1, /be ([\d.]+) times/, P.steelK, 3);
  num('train', 0, /weighs ([\d,]+) tonnes/, P.trainT, 0.5);
  num('train', 2, /at ([\d,]+) km\/h/, P.kmh, 8);
  num('train', 3, /is ([\d.]+)\./, P.record, 0.5);
  num('energy', 0, /of ([\d.]+) grams/, P.tntG, 0.5);
  num('energy', 1, /almost ([\d.]+) tonnes/, P.tntT(P.trainT), 0.4);
  num('hill', 0, /^([\d,]+) metres/, F.hill.x - F.plat.x[1], 1);
  num('depot', 0, /parked ([\d,]+) metres/, P.parked, 2);
  num('depot', 0, /\. ([\d,]+) tonnes each/, P.wagonT, 0.5);
  num('depot', 1, /That's ([\d.]+) tonnes/, P.tntT(P.wagonT), 0.15);
  num('wind', 0, /at ([\d.]+) times/, P.mach, 0.04);
  num('wind', 1, /by ([\d.]+) °C/, P.heat, 0.6);
  num('sea', 2, /by ([\d,]+) tonnes/, P.waterT, 60);
  num('sea', 3, /of ([\d,]+) tonnes/, P.waterTnt, 5);
  num('sea', 4, /was ([\d,]+) metres/, P.ferryOut, 1);
  num('sea', 4, /weighs ([\d,]+) tonnes/, P.ferryT, 1);
  if (!(P.wallKmh > 1000)) throw new Error('up:0 says over 1,000 km/h');
  num('fall', 0, /fall ([\d.]+) metres/, P.drop, 0.02);
  num('fall', 1, /was ([\d.]+) metres/, F.can1.y, 0.01);
  if (!(P.roofY(sAt('fall', 1)) > P.roofRest + 0.5)) throw new Error('fall:1 says the roof is still in the air');
  if (!(P.womanY(sAt('fall', 2)) > 0.5)) throw new Error('fall:2 says she is still in the air');
  num('count', 0, /slid ([\d,]+) metres/, P.trainX(sAt('count', 0, 1.0)), 12);
  num('count', 1, /in ([\d.]+) seconds/, P.T - sAt('count', 1, 0), 0.006);
  num('back', 2, /is ([\d,]+) metres/, P.gapEnd, 1.5);
  num('back', 3, /, ([\d,]+) metres from/, P.v * P.T, 1);
  num('twist', 0, /doing ([\d,]+) km\/h/, P.kmh, 8);
  num('second', 1, /in ([\d.]+) seconds/, P.blastHit - sAt('second', 1, 0), 0.012);
  if (esStoryAt(ES.end) > P.blastHit - 0.005) throw new Error('the film runs past the moment the blast reaches the train');
}

CONFIG.duration = ES.end;
CONFIG.seed = 20261115;
Object.assign(CONFIG.camera, { cameraHeight: 1.66, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 50, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;

const SCRIPT = {
  meta: { title: 'What if Earth stopped spinning for 1 second?', wav: 'earth-stop-soundtrack.wav' },
  events: [],                                            // (filled from the shots by shots.js)
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.66]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 50]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: {
    title: { in: ES.title[0], out: ES.title[1], fi: 0.25, fo: 0.5, cls: 'big center', html: '<span class="kick">WHAT IF EARTH</span><span class="hero">STOPPED SPINNING</span><span class="kick k2">FOR 1 SECOND?</span>' },
    captions: [],
    readouts: [],
  },
};
const SCRIPT_TRACKS = {};
