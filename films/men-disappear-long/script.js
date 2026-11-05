/* =====================================================================
   SCRIPT — "What if all men suddenly disappeared?" (16:9, 1920×1080, 30 fps, voiceless).
   ★ The edit is built AROUND THE CAPTIONS: every beat below comes from the caption times (window.MGT, written by
   build-timing.cjs from CAPTIONS.md). Change a pause → edit PAUSE there and re-run it.
   The physics (physics.js) runs on STORY time s: seconds after Tuesday 7:42:00.000 AM, when every man and boy on
   Earth vanishes. This file maps film time t to story time s with ONE clock for the whole film (MG_CLOCK): it only
   ever runs forward (the owner's rule of 2026-10-29: no replays; every new angle or place moves the clock on). The
   first 8 seconds after 7:42 are in slow motion (the HUD says how slowly): your car, the lorry; from the radio on it
   runs at real speed, and jumps forward only at cuts (the HUD says how far): to 7:51, 8:04, 9:10, 9:31, 9:47, 10:14,
   10:21.
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
MG.tLock = 2.85;                                         // ★ (film) 7:42:00 AM: every man and boy vanishes (s = 0)
const MG_AT = (h, m, sec = 0) => (h - 7) * 3600 + (m - 42) * 60 + sec;   // story s of a time this morning

// THE CLOCK: [film t where a segment starts, story s there (at least), how it runs]
//   ['rate', r]  a steady rate r (0.1 = ten times slower); 'real' = real speed. The next segment starts at
//                max(where this one got to, its own s): a jump forward, always at a cut (shots.js checks)
//   'to'         a steady rate that reaches the next segment's s exactly when it starts
const MG_CLOCK = (() => {
  const B = mgB, C = mgC, D = MGP.door;
  const S = [
    [-2, -2.85 - 2, 'real'],
    [MG.tLock, 0, 'to'],                                  // ★ 7:42:00.000: the cup in the air, the lorry starts to drift
    [B('wheel'), 1.0, 'to'],                              // you reach for the wheel (at 2.0 s)
    [B('brake'), 2.05, 'to'],                             // the parking brake at 3.2 s
    [B('lorry'), 3.25, 'to'],                             // the lorry hits the barrier at 3.54 s
    [B('cab'), 4.0, 'to'],                                // its empty cab, sparks along the barrier
    [B('stop'), 6.9, 'to'],                               // you stop at 7.67 s, the lorry at 7.69 s
    [B('cars'), 8.1, 'to'],                               // the cars all round stop themselves, or drift
    [B('radio'), 15.5, 'real'],                           // from here: real speed
    [B('smoke'), MG_AT(7, 51, 2), 'real'],                // 7:51
    [B('ward'), MG_AT(8, 3, 59.6), 'real'],               // 8:04: the boy is born on the third caption, at 8:04:13
    [B('walk'), MG_AT(9, 10, 2), 'real'],                 // 9:10
    [B('alert'), MG_AT(9, 31, 2), 'real'],                // 9:31
    [B('hold'), MG_AT(9, 47, 2), 'real'],                 // 9:47
    [B('autoland'), MG_AT(10, 14, 30), 'real'],           // 10:14
    [B('final'), MG_AT(10, 21, 2), 'real'],               // 10:21: touchdown on the second caption
  ];
  void C; void D;
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
// the clock's jumps (film times where the story skips ahead), for the HUD's "+6 min"
const MG_JUMPS = MG_CLOCK.slice(1).map((g, i) => ({ t: g.t0, ds: g.s0 - MG_CLOCK[i].s1 })).filter((j) => j.ds > 0.5);
// the film time at which story time s is on screen (the clock is monotonic: bisect)
function mgFilmAt(s) { let a = -2, b = MG.end + 1; for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (mgStoryAt(m) < s) a = m; else b = m; } return (a + b) / 2; }

// ---- story moments set by the captions (the physics reads them)
MG.sBargeHit = mgStoryAt(mgC('barge', 1) + 1.4);          // the barge's bow runs into the bank
MGP.barge.sHit = MG.sBargeHit;
MG.sCode = mgStoryAt(mgC('door', 1) + 0.4);               // the flight attendant enters the emergency code
MG.sDoor = MG.sCode + MGP.door;                           // the door unlocks (real time: the clock doesn't jump here)
MG.sBirth = mgStoryAt(mgC('ward', 2) + 0.2);              // the boy is born
MG.sOverViaduct = mgStoryAt(mgC('final', 0) + 3.5);       // flight 2207 crosses the motorway (2,120 m before touchdown)
MG.sTD = MG.sOverViaduct + 2120 / 72;                     // and touches down 29 s later (72 m/s down the beam)
MG.sFlap = mgStoryAt(mgC('autoland', 1) + 1.0);           // she sets the flaps, the wheels
MG.sLand3 = mgStoryAt(mgC('autoland', 3) + 0.3);          // the three autopilots lock on to the beam
MG.sOverhead = mgStoryAt(mgC('plane', 0) + 0.4);          // flight 2207 passes overhead at 11,000 m
MGP.sEmpty = Math.round(mgStoryAt(mgC('alone', 0) + 0.5) + 3 * 3600 + 20 * 60 + 25);   // "3 hours 20 minutes of fuel"
if (MG.sDoor > mgStoryAt(mgS('alone'))) throw new Error('the cockpit door opens after the "alone" beat starts');
for (const j of MG_JUMPS) if (j.t > mgB('door') && j.t < mgB('tower')) throw new Error('the clock jumps during the door\'s 30 seconds');

// every clock time a caption says ("7:51 AM") must be what the HUD says while it is on screen
for (const g of MGT.groups) for (const c of g.caps) {
  const m = /\b(\d{1,2}):(\d{2}) AM\b/.exec(c.text);
  if (m) { const want = MG_AT(+m[1], +m[2]), at = mgStoryAt(c.show + 0.3); if (at < want - 0.5 || at >= want + 60) throw new Error(`caption "${c.text}" says ${m[1]}:${m[2]}, but the clock has s ${at.toFixed(1)} (want ${want}…${want + 60})`); }
  const f = /(\d+) hours? (\d+) minutes of fuel/.exec(c.text);
  if (f) { const want = +f[1] * 60 + +f[2], got = Math.floor(MGP.fuel(mgStoryAt(c.show + 0.3)) / 60); if (got !== want) throw new Error(`caption "${c.text}" says ${want} min of fuel, the HUD has ${got}`); }
}

// the clock as Tuesday h:m:s.ms (s = 0 is 7:42:00.000 AM)
function mgClockParts(s) {
  const T = 7 * 3600 + 42 * 60 + s, ms = Math.floor((((T % 1) + 1) % 1) * 1000 + 1e-6), sec = Math.floor(T) % 60, mi = Math.floor(T / 60) % 60, h24 = Math.floor(T / 3600) % 24;
  return { day: 'TUESDAY', h: ((h24 + 11) % 12) + 1, m: mi, sec, ms, pm: h24 >= 12 };
}

CONFIG.duration = MG.end;
CONFIG.seed = 20261110;
Object.assign(CONFIG.camera, { cameraHeight: 1.63, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 50, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;

const SCRIPT = {
  meta: { title: 'What if all men suddenly disappeared?', wav: 'men-disappear-long-soundtrack.wav' },
  events: [],                                            // (filled from the shots by shots.js)
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.63]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 50]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: {
    title: { in: MG.title[0], out: MG.title[1], fi: 0.25, fo: 0.5, cls: 'big center', html: '<span class="kick">WHAT IF ALL MEN</span><span class="hero">SUDDENLY</span><span class="kick k2">DISAPPEARED?</span>' },
    captions: [],
    readouts: [],
  },
};
const SCRIPT_TRACKS = {};
