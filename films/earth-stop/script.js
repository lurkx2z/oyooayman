/* =====================================================================
   SCRIPT — "What if Earth stopped spinning for 1 second?" (16:9, 1920×1080, 30 fps, voiceless).
   ★ The edit is built AROUND THE CAPTIONS: every beat below comes from the caption times (window.EST, written by
   build-timing.cjs from CAPTIONS.md). Change a pause → edit PAUSE there and re-run it.
   The physics (physics.js) runs on STORY time s: seconds after Sunday 5:42:00.000 PM, when the ground stops turning
   (for one second). This file maps film time t to story time s with ONE clock for the whole film (ES_CLOCK): it only
   ever runs forward (the owner's rule of 2026-10-29: no replays; every new angle or place moves the clock on). The
   whole film after the title is that one second and the 0.32 s after it. Most shots open fast (30 to 250 times
   slower than life) and settle to almost a held breath; the last 0.25 s runs about 40, 72 and then, into the last
   frame, 120 down to 32 times slower.
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
ES.tOn = 1.5;                                           // ★ (film) 5:42:00 PM: the ground stops turning (s = 0)
ES.tHit = esB('question') + 3.1;                        // ★ (film) the blast reaches your train; the rest is black

// THE CLOCK: [film t where a segment starts, story s there (at least), how it runs]
//   'real' = real speed; 'to' = a steady rate that reaches the next segment's s exactly when it starts
const ES_CLOCK = (() => {
  const B = esB, C = esC, P = ESP;
  const S = [
    [-2, -ES.tOn - 2, 'real'],
    [ES.tOn, 0, 'to'],                                     // ★ 5:42:00.000: a burst (25 times slower: the whole station comes at you)…
    [ES.tOn + 0.3, 0.012, 'to'],                           // …slowing…
    [ES.tOn + 1.2, 0.022, 'to', 1.6],                      // …and it keeps sliding past, 11 m more
    // the hill: a house 25 m from its rock gets there (s 0.052), then the palms along its foot, in a volley
    [B('first'), 0.040, 'to'], [C('first', 0) + 0.9, P.house0, 'to'], [C('first', 0) + 1.6, P.house0 + 0.0077, 'to'],
    [C('first', 1) - 0.8, 0.066, 'to', 2],                 // along the rock face: palm after palm
    [B('speed'), 0.095, 'to', 2],                          // riding with the station: the ground leaves under it (13 m)
    [C('speed', 1) - 0.6, 0.124, 'to', 2],                 // the sea's wall climbing across the Sun
    [B('bolts'), 0.1414, 'to'],                            // a column's foot skating over the next column's sheared bolts (s 0.1425)
    [C('bolts', 1) - 0.5, 0.1474, 'to', 1.6],              // the building, off its floor (13 m)
    [B('town'), 0.176, 'to', 1.6],
    [C('town', 1) - 0.6, 0.192, 'to', 2],                  // the car park behind the station
    [B('people'), 0.212, 'to'],                            // the people on the platform…
    [C('people', 1) - 0.6, 0.221, 'to', 1.6],              // …its end (the first of them gets there at s 0.247)…
    [C('people', 2) - 0.6, 0.252, 'to', 1.6],              // …and past it
    [B('train'), 0.277, 'to', 1.5], [C('train', 1) - 0.5, 0.287, 'to'], [C('train', 2) - 0.5, 0.296, 'to', 2],
    [B('energy'), 0.332, 'to', 1.6], [C('energy', 1) - 0.5, 0.345, 'to', 1.6],
    // the hill: the second house gets there as you look (s 0.3605), then the depot's shed (0.387)
    [B('hill'), 0.356, 'to'], [C('hill', 0) + 0.5, P.house1, 'to'], [C('hill', 0) + 1.3, P.house1 + 0.0095, 'to'],
    [C('hill', 1) - 1.4, P.shed - 0.006, 'to'], [C('hill', 1) - 0.15, P.shed, 'to'], [C('hill', 1) + 0.9, P.shed + 0.011, 'to'],
    [B('depot'), 0.405, 'to', 1.6],
    [esCap('depot', 0).hide + 0.3, 0.428, 'to'],            // from the rock: they are coming
    [C('depot', 1) - 1.4, P.wagon0 - 0.007, 'to'], [C('depot', 1) - 0.15, P.wagon0, 'to'], [C('depot', 1) + 0.6, P.wagon0 + 0.024, 'to'],   // ★ the first wagon
    [C('depot', 1) + 2.1, P.wagonHit(1) - 0.004, 'to'], [C('depot', 1) + 2.6, P.wagonHit(1), 'to'], [C('depot', 1) + 3.3, P.wagonHit(1) + 0.017, 'to'],
    [B('wind'), 0.505, 'to'], [B('wind') + 1.2, P.wagonHit(2), 'to'], [B('wind') + 1.9, P.wagonHit(2) + 0.016, 'to'],
    [C('wind', 1) - 0.5, 0.540, 'to'], [C('wind', 1) + 0.5, P.wagonHit(3), 'to'], [C('wind', 1) + 1.2, P.wagonHit(3) + 0.011, 'to'],
    [C('wind', 2) - 0.6, 0.560, 'to', 1.5],                // the fire, over the top (the fifth wagon: s 0.5785)
    [B('sea'), 0.582, 'to', 1.5],                          // the harbour: the wall of water, in profile
    [C('sea', 2) - 0.7, 0.594, 'to', 1.4],                 // along the foot of it, to the ferry
    [C('sea', 3) - 0.6, 0.606, 'to'], [C('sea', 3) + 0.5, P.ferryHit, 'to'], [C('sea', 3) + 2.4, P.ferryHit + 0.045, 'to'],   // ★ the ferry
    [B('up'), 0.675, 'to', 1.4],                            // the water climbs 49 m against the tower's outline
    [B('fall'), 0.80, 'to', 1.6], [C('fall', 1) - 0.8, 0.822, 'to', 1.5],
    [B('sky'), 0.845, 'to', 1, 0.851],
    // the last 0.15 s: your train and the hill (the pickup from the crossing reaches the rock at s 0.856, the water tower at 0.942)
    [B('count'), 0.852, 'to'], [C('count', 1) - 0.5, 0.898, 'to'], [C('count', 2) - 0.6, 0.936, 'to'], [C('count', 2), 0.950, 'to'],
    [C('back', 0) - 1.75, 0.975, 'to', -2.6],              // …and the last 7 m come in a rush
    [C('back', 0) - 0.55, P.T, 'to'],                      // ★ 5:42:01.000: the ground turns again. Everything stops dead
    [C('back', 1) - 0.4, 1.010, 'to'],
    [B('twist'), 1.03, 'to'],                              // the hill leaves its fire behind…
    [C('twist', 1) - 0.6, 1.075, 'to', 1.3],               // …and the ground carries you into it: 63 m of it in this shot
    [C('twist', 2) - 0.5, 1.21, 'to'],
    [B('question'), 1.26, 'to', -1.8],
    [ES.tHit, P.blastHit, 'to'],                           // ★ it reaches your train: white, then black
    [ES.end, P.blastHit + 0.02, 'real'],
  ];
  // [t, s, 'to', p, e]: p > 1 = the segment starts fast and settles (a burst, then almost a held breath); e = where its
  // story time ends, if that is before the next segment's start (the clock then jumps forward, on a cut)
  const out = [];
  S.forEach((g, i) => {
    const t0 = g[0], nx = S[i + 1], t1 = nx ? nx[0] : ES.end + 10, pv = out[i - 1];
    let s0 = g[1];
    if (pv && pv.mode !== 'to') s0 = Math.max(s0, pv.s1);
    const s1 = g[2] === 'real' ? s0 + (t1 - t0) : g[4] != null ? g[4] : nx[1];
    out.push({ t0, t1, s0, s1, rate: (s1 - s0) / (t1 - t0), p: g[2] === 'to' ? g[3] || 1 : 1, mode: g[2] === 'to' ? 'to' : 'run' });      // (p < −1: it starts slow and ends in a rush)
  });
  out.forEach((g, i) => {
    if (!(g.t1 > g.t0) || g.rate <= 0) throw new Error(`ES_CLOCK: segment ${i} (t ${g.t0.toFixed(2)}–${g.t1.toFixed(2)}) runs backwards`);
    if (i && g.s0 < out[i - 1].s1 - 1e-6) throw new Error(`ES_CLOCK: segment ${i} starts before the last one ended (s ${g.s0.toFixed(3)} < ${out[i - 1].s1.toFixed(3)})`);
  });
  return out;
})();
const ES_EASE = 0.3;                                      // an eased segment never runs slower than 30% of its average
function esSegAt(t) { const K = ES_CLOCK; let i = 0; while (i < K.length - 1 && t >= K[i + 1].t0) i++; return K[i]; }
function esStoryAt(t) {
  const g = esSegAt(t), u = (t - g.t0) / (g.t1 - g.t0), p = Math.abs(g.p);
  if (!(p > 1) || u <= 0 || u >= 1) return g.s0 + g.rate * (t - g.t0);
  return g.s0 + (g.s1 - g.s0) * (ES_EASE * u + (1 - ES_EASE) * (g.p > 0 ? 1 - Math.pow(1 - u, p) : Math.pow(u, p)));
}
// story seconds per film second (1 = real speed)
function esRateAt(t) {
  const g = esSegAt(t), u = Math.min(1, Math.max(0, (t - g.t0) / (g.t1 - g.t0))), p = Math.abs(g.p);
  return p > 1 ? g.rate * (ES_EASE + (1 - ES_EASE) * p * Math.pow(g.p > 0 ? 1 - u : u, p - 1)) : g.rate;
}
const ES_JUMPS = ES_CLOCK.slice(1).map((g, i) => ({ t: g.t0, ds: g.s0 - ES_CLOCK[i].s1 })).filter((j) => j.ds > 1e-5);
// the film time at which story time s is on screen (the clock is monotonic: bisect)
function esFilmAt(s) { let a = -2, b = ES.end + 1; for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (esStoryAt(m) < s) a = m; else b = m; } return (a + b) / 2; }

// the captions that name a moment must sit on it (the clock only runs forward: there is no second chance), and every
// number in a caption must be the one physics.js gives
{
  const P = ESP, F = ES_F;
  const near = (id, k, s, lo, hi) => { const d = esC(id, k) - esFilmAt(s); if (d < lo || d > hi) throw new Error(`caption ${id}:${k} shows ${d.toFixed(2)} s from story ${s.toFixed(3)} (want ${lo}…${hi})`); };
  near('hill', 1, P.shed, -0.1, 0.6);                       // "The depot's shed just got there"
  near('depot', 1, P.wagon0, -0.1, 0.6);                    // "The first one just reached the rock"
  near('back', 0, P.T, 0.2, 1.0);                           // "5:42:01 PM. The ground is turning again"
  const sAt = (id, k, d = 0.4) => esStoryAt(esC(id, k) + d);
  const num = (id, k, re, v, tol) => { const m = re.exec(esCap(id, k).text); if (!m) throw new Error(`caption ${id}:${k}: no number`); const x = parseFloat(m[1].replace(/,/g, '')); if (Math.abs(x - v) > tol) throw new Error(`caption ${id}:${k} says ${x}, physics says ${v.toFixed(3)}`); };
  num('speed', 0, /at ([\d,]+) km\/h/, P.kmh, 8);
  num('people', 0, /doing ([\d,]+) km\/h/, P.kmh, 8);
  num('people', 1, /by ([\d.]+) km\/h/, P.personKmh, 0.6);
  num('people', 1, /ends ([\d,]+) metres/, 12, 0.01);                 // (station.js puts the first of them 12 m from the end as this caption appears)
  num('people', 2, /ground ([\d,]+) metres/, P.v * Math.sqrt(2 * F.plat.h / P.g), 3);
  num('bolts', 1, /be ([\d.]+) times/, P.steelK, 3);
  num('train', 0, /weighs ([\d,]+) tonnes/, P.trainT, 0.5);
  num('train', 2, /is ([\d.]+) km\/h/, P.record, 0.5);
  num('train', 2, /doing ([\d,]+)\./, P.kmh, 8);
  num('energy', 0, /of ([\d.]+) grams/, P.tntG, 0.5);
  num('energy', 1, /almost ([\d.]+) tonnes/, P.tntT(P.trainT), 0.4);
  num('hill', 0, /^([\d,]+) metres/, F.hill.x - F.plat.x[1], 1);
  num('depot', 0, /parked ([\d,]+) metres/, P.parked, 2);
  num('depot', 0, /\. ([\d,]+) tonnes each/, P.wagonT, 0.5);
  num('wind', 0, /at ([\d.]+) times/, P.mach, 0.04);
  num('wind', 1, /by ([\d.]+) °C/, P.heat, 0.6);
  num('sea', 2, /by ([\d,]+) tonnes/, P.waterT, 60);
  num('sea', 3, /was ([\d,]+) metres/, P.ferryOut, 1);
  num('sea', 3, /weighs ([\d,]+) tonnes/, P.ferryT, 1);
  if (!(P.wallKmh > 1000)) throw new Error('up:0 says over 1,000 km/h');
  num('fall', 0, /fall ([\d.]+) metres/, P.drop, 0.02);
  if (!(P.roofY(sAt('fall', 0, 4)) > P.roofRest + 0.5)) throw new Error('fall:0 says the roof is still in the air');
  if (!(P.womanY(sAt('fall', 1, 3)) > 0.5)) throw new Error('fall:1 says she is still in the air');
  num('count', 0, /slid ([\d,]+) metres/, P.trainX(sAt('count', 0, 1.0)), 12);
  if (!(P.mach > 1)) throw new Error('count:1 says the hill is coming faster than its own sound');
  num('count', 2, /in ([\d.]+) seconds/, P.T - sAt('count', 2, 0), 0.006);
  num('back', 2, /is ([\d,]+) metres/, P.gapEnd, 1.5);
  num('twist', 1, /again at ([\d,]+) km\/h/, P.kmh, 8);
  num('twist', 2, /in ([\d.]+) seconds/, P.blastHit - sAt('twist', 2, 0), 0.012);
  if (Math.abs(esFilmAt(P.blastHit) - ES.tHit) > 0.05) throw new Error('the blast must reach the train at ES.tHit');
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
