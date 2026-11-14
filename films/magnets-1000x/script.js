/* =====================================================================
   SCRIPT — "What if magnets got 1,000 times stronger for 10 seconds?" (16:9, 1920×1080, 30 fps, voiceless).
   ★ The edit is built AROUND THE CAPTIONS: every beat below comes from the caption times (window.MGT, written by
   build-timing.cjs from CAPTIONS.md). Change a pause → edit PAUSE there and re-run it.
   The physics (physics.js) runs on STORY time s: seconds after Saturday 10:42:00.000 AM, when every magnet gets 1,000
   times stronger (for ten seconds). This file maps film time t to story time s with ONE clock for the whole film
   (MG_CLOCK): it only ever runs forward (the owner's rule of 2026-10-29: no replays; every new angle or place moves the
   clock on). The first tenth of a second plays about 380 times slower (the pile leaving the ground), then 260, 100, 35,
   18 times slower, the last three seconds about 7 times (the HUD says how slowly); after 10:42:10 the clock eases back
   to real speed and jumps forward only at a cut (the HUD says how far): one minute.
   ===================================================================== */

const MGT_ID = Object.fromEntries(MGT.groups.map((g) => [g.id, g]));
const mgS = (id) => MGT_ID[id].first;         // the beat's first caption appears
const mgE = (id) => MGT_ID[id].end;           // its last caption goes
const mgCap = (id, k) => MGT_ID[id].caps[k];  // a caption: { text, show, hide, words }
const mgC = (id, k) => MGT_ID[id].caps[k].show;
const mgB = (id, d = 0.6) => mgS(id) - d;     // a cut just before beat id's first caption

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (film seconds)
// ---------------------------------------------------------------------------------------------------------------------
const MG = {};
MG.title = [-0.4, mgE('title') + 0.25];
MG.end = MGT.duration;
MG.tOn = 2.85;                                          // ★ (film) 10:42:00 AM: every magnet 1,000 times stronger (s = 0)

// story moments the captions must sit on (physics.js)
const MG_AT = (() => {
  const P = MGP, B = MGB, A = {};
  // the boat: when the ball's upward pull first beats its weight, and how far from the wall it is then
  for (let s = 5; s < P.T; s += 0.002) if (B.Fy(s) > P.boatKg * P.g) { A.liftS = s; A.liftGap = B.gap(s); break; }
  for (let s = 3; s < P.T; s += 0.002) if (B.gap(s) < 9) { A.gap9 = s; break; }
  for (let s = 5; s < P.T; s += 0.002) if (B.heave(s) > 0.45) { A.outS = s; break; }
  A.ratio40 = P.pull(10) / P.pull(20);
  A.engine8 = (s) => P.boatPull(s) / P.thrust;
  // the nearest car leaves the ground
  const c0 = MGY.cars[0]; for (let s = 0.5; s < c0.firstHit; s += 0.002) if (MGY.pos(c0, s)[1] > c0.p0[1] + 0.25) { A.carUp = s; break; }
  // a blade still in the air (the last one to land)
  A.bladeLast = Math.max(...MGT_FAR.blades.map((b) => MGT_FAR.blade(b, 9, (x, z) => mgGroundY(x, z)).landed || 99));
  return A;
})();

// THE CLOCK: [film t where a segment starts, story s there (at least), how it runs]
//   ['rate', r]  a steady rate r; 'real' = real speed. The next segment starts at max(where this one got to, its own s):
//                a jump forward, always at a cut (shots.js checks)
//   'to'         a steady rate that reaches the next segment's s exactly when it starts
const MG_CLOCK = (() => {
  const B = mgB, C = mgC, P = MGP, A = MG_AT, Y = MGY, Sm = MG_SMALL;
  const S = [
    [-2, -2.85 - 2, 'real'],
    [MG.tOn, 0, 'to'],                                     // ★ 10:42:00.000: the pile starts to leave the ground; the radio dies
    [B('pile'), 0.072, 'to'],                              // the pile leaves the ground, pieces streaking up…
    [C('pile', 2) - 0.6, 0.118, 'to'],                     // …the snapped rope
    [B('reach'), 0.128, 'to'],                             // the cube law (from above: the ball grows; your boat)
    [B('mri'), 0.142, 'to'],                               // the hospital: the cylinder, pulled off its trolley…
    [B('cylinder'), 0.15, 'to'],                           // …in the corridor, flying at the wall (120 times slower)…
    [C('cylinder', 1) - 0.9, Sm.cyl.wall - 0.006, 'to'],    // …it hits the wall as "It's coming through the wall" comes up
    [B('water'), Sm.cyl.hit + 0.012, 'to'],                 // the cup of water; the waiting room's phones…
    [B('speed'), 0.86, 'to'],                              // the yard: the scattered scrap arriving…
    [B('cars'), 1.62, 'to'],                               // the cars: the nearest leaves the ground at "The nearest are flying"
    [C('cars', 1) - 0.4, A.carUp - 0.003, 'to'],
    [B('road'), 1.95, 'to'],
    [B('turbine'), 2.55, 'to'],
    [B('boat2'), 3.45, 'to'],
    [C('boat2', 1) - 0.3, 3.96, 'to'],                     // "8 times harder"
    [B('inside'), 5.85, 'to'],                             // inside the boat: the pull reaches a sixth of g; things start to slide
    [C('inside', 2) - 0.2, 6.085, 'to'],                  // "The kettle just slid off the stove": it's going over the edge
    [B('phonehit'), 6.13, 'to'],                           // your phone, in your hand: the pull nears 5 times its weight…
    [C('phonehit', 0) + 1.3, Sm.phone.rel, 'to'],          // …and tears it out of your fingers as "You can't hold it" is read
    [C('phonehit', 1) - 1.6, Sm.phone.hit - 0.02, 'to'],   // side-on to its last 4 metres (70 times slower)…
    [C('phonehit', 1) - 0.2, Sm.phone.hit, 'to'],          // …it hits the ball just before "It just hit the ball"
    [C('phonehit', 1) + 0.7, Sm.phone.hit + 0.006, 'to'],  // (the sparks)
    [B('close'), 6.8, 'to'],                               // "You're less than 9 metres from the wall"
    [B('count'), 7.0, 'to'],                                                       // the count (3 · 2 · 1)…
    [C('count', 1) - 0.6, P.bikeRel - 0.03, 'to'],          // …your bike leaves the roof as "There goes your bike" comes up
    [C('count', 2) - 0.4, A.outS - 0.05, 'to'],             // "It's pulling the boat out of the water": it's out
    [C('back', 0) - 0.6, P.T, 'to'],                        // …to 10:42:10.000, as "10:42:10 AM. Back to normal" comes up
    [C('back', 1) + 0.2, P.T + 0.62, 'to'],                 // the clock eases back to real speed (the boat falls; the ball lets go)
    [C('back', 2) + 1.2, P.T + 2.2, 'real'],
    [B('after'), 70, 'real'],                               // +1 min
  ];
  const out = [];
  S.forEach((g, i) => {
    const t0 = g[0], nx = S[i + 1], t1 = nx ? nx[0] : MG.end + 5, pv = out[i - 1];
    let s0 = g[1];
    if (pv && pv.mode !== 'to') s0 = Math.max(s0, pv.s1);
    const rate = g[2] === 'real' ? 1 : g[2] === 'to' ? (nx[1] - s0) / (t1 - t0) : g[2][1];
    out.push({ t0, t1, s0, s1: s0 + rate * (t1 - t0), rate, mode: g[2] === 'to' ? 'to' : 'run' });
  });
  out.forEach((g, i) => {
    if (!(g.t1 > g.t0) || g.rate <= 0) throw new Error(`MG_CLOCK: segment ${i} (t ${g.t0.toFixed(2)}–${g.t1.toFixed(2)}) runs backwards`);
    if (i && g.s0 < out[i - 1].s1 - 1e-6) throw new Error(`MG_CLOCK: segment ${i} starts before the last one ended (s ${g.s0.toFixed(3)} < ${out[i - 1].s1.toFixed(3)})`);
  });
  return out;
})();
function mgSegAt(t) { const K = MG_CLOCK; let i = 0; while (i < K.length - 1 && t >= K[i + 1].t0) i++; return K[i]; }
function mgStoryAt(t) { const g = mgSegAt(t); return g.s0 + g.rate * (t - g.t0); }
const mgRateAt = (t) => mgSegAt(t).rate;                  // story seconds per film second (1 = real speed)
// the clock's jumps (film times where the story skips ahead), for the HUD's "+1 min"
const MG_JUMPS = MG_CLOCK.slice(1).map((g, i) => ({ t: g.t0, ds: g.s0 - MG_CLOCK[i].s1 })).filter((j) => j.ds > 0.5);
// the film time at which story time s is on screen (the clock is monotonic: bisect)
function mgFilmAt(s) { let a = -2, b = MG.end + 1; for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (mgStoryAt(m) < s) a = m; else b = m; } return (a + b) / 2; }

// the captions that name a moment must sit on it (the clock only runs forward: there is no second chance), and every
// number in a caption must be the one physics.js gives
{
  const near = (id, k, s, lo, hi) => { const d = mgC(id, k) - mgFilmAt(s); if (d < lo || d > hi) throw new Error(`caption ${id}:${k} shows ${d.toFixed(2)} s from story ${s.toFixed(3)} (want ${lo}…${hi})`); };
  near('cylinder', 1, MG_SMALL.cyl.wall, -0.2, 1.5);       // "It's coming through the wall"
  near('phonehit', 0, MG_SMALL.phone.rel, -1.8, -0.6);      // "You can't hold it": read just before it's torn away
  near('phonehit', 1, MG_SMALL.phone.hit, -0.1, 1.2);       // "It just hit the ball"
  near('cars', 1, MG_AT.carUp, -0.3, 1.5);                  // "The nearest are flying"
  near('count', 1, MGP.bikeRel, -0.2, 2.5);                 // "There goes your bike"
  near('count', 2, MG_AT.outS, -0.2, 1.5);                  // "It's pulling the boat out of the water"
  { const g = MGB.gap(mgStoryAt(mgC('close', 0))), g1 = MGB.gap(mgStoryAt(mgCap('close', 0).hide)); if (!(g < 9 && g1 > 8)) throw new Error(`caption close:0 says less than 9 metres: the gap is ${g.toFixed(2)}…${g1.toFixed(2)}`); }
  const sAt = (id, k) => mgStoryAt(mgC(id, k) + 0.5);
  if (MGT_FAR.blades.every((b) => { const q = MGT_FAR.blade(b, sAt('turbine', 2), (x, z) => mgGroundY(x, z)); return q.landed; })) throw new Error('turbine:2 says they are still falling: none is');
  const num = (id, k, re, v, tol) => { const m = re.exec(mgCap(id, k).text); if (!m) throw new Error(`caption ${id}:${k}: no number`); const x = parseFloat(m[1].replace(/,/g, '')); if (Math.abs(x - v) > tol) throw new Error(`caption ${id}:${k} says ${x}, physics says ${v.toFixed(3)}`); };
  num('phonehit', 0, /at ([\d.]+) times/, MGP.phoneGrip, 0.05);
  num('phonehit', 1, /at ([\d,]+) km\/h/, MGP.phoneKmh, 60);
  num('speed', 0, /up to ([\d,]+) km\/h/, MGP.vMaxKmh, 15);
  num('speed', 1, /need ([\d,]+) km\/h/, MGP.escapeKmh, 15);
  num('boat2', 2, /Still ([\d.]+) metres/, MGB.dist(sAt('boat2', 2)), 0.6);
  num('real', 1, /with ([\d.]+) million/, MGP.atm / 1e6, 0.2);
  num('water', 2, /up to ([\d,]+) g/, MGP.patientG, 300);
  num('waiting', 0, /about ([\d.]+) times/, MGP.waitG, 0.08);
  num('mri', 2, /about ([\d.]+) metres/, MGP.mriReach, 0.3);
  num('boat', 2, /about ([\d.]+) times/, MG_AT.ratio40, 6);
  num('boat2', 1, /pulling ([\d.]+) times/, MG_AT.engine8(sAt('boat2', 1)), 1.2);
  num('close', 1, /At ([\d.]+) metres/, MG_AT.liftGap, 0.6);
}

CONFIG.duration = MG.end;
CONFIG.seed = 20261128;
Object.assign(CONFIG.camera, { cameraHeight: 1.66, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 50, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;

const SCRIPT = {
  meta: { title: 'What if magnets got 1,000 times stronger for 10 seconds?', wav: 'magnets-1000x-soundtrack.wav' },
  events: [],                                            // (filled from the shots by shots.js)
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.66]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 50]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: {
    title: { in: MG.title[0], out: MG.title[1], fi: 0.25, fo: 0.5, cls: 'big center', html: '<span class="kick">WHAT IF MAGNETS GOT</span><span class="hero">1,000× STRONGER</span><span class="kick k2">FOR 10 SECONDS?</span>' },
    captions: [],
    readouts: [],
  },
};
const SCRIPT_TRACKS = {};
