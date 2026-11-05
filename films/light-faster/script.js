/* =====================================================================
   SCRIPT — "What if the speed of light increased and couldn't stop?" (16:9, 1920×1080, 30 fps, voiceless).
   ★ The edit is built AROUND THE CAPTIONS: every beat below comes from the caption times (window.LFT, written by
   build-timing.cjs from CAPTIONS.md). Change a pause → edit PAUSE there and re-run it.
   The physics (physics.js) runs on STORY time s: seconds after Saturday 9:00:00.000 PM, when light starts speeding
   up (1% a second, compounding). This file maps film time t to story time s with ONE clock for the whole film
   (LF_CLOCK): it only ever runs forward (the owner's rule of 2026-10-29: no replays; every new angle or place moves
   the clock on). The first 40 seconds after 9 PM are in slow motion (the HUD says how slowly), because everything
   built on magnets fails in them; from the beach on it runs at real speed, and jumps forward only at cuts (the HUD
   says how far), to 9:07 PM and to 9:23 PM.
   ===================================================================== */

const LFT_ID = Object.fromEntries(LFT.groups.map((g) => [g.id, g]));
const lfS = (id) => LFT_ID[id].first;         // the beat's first caption appears
const lfE = (id) => LFT_ID[id].end;           // its last caption goes
const lfCap = (id, k) => LFT_ID[id].caps[k];  // a caption: { text, show, hide, words }
const lfC = (id, k) => LFT_ID[id].caps[k].show;
const lfB = (id, d = 0.6) => lfS(id) - d;     // a cut just before beat id's first caption

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (film seconds)
// ---------------------------------------------------------------------------------------------------------------------
const LF = {};
LF.title = [-0.4, lfE('title') + 0.25];
LF.end = LFT.duration;
LF.tLock = 2.85;                                         // ★ (film) 9:00:00 PM: light starts speeding up (s = 0)

// THE CLOCK: [film t where a segment starts, story s there (at least), how it runs]
//   ['rate', r]  a steady rate r (0.1 = ten times slower); 'real' = real speed. The next segment starts at
//                max(where this one got to, its own s): a jump forward, always at a cut (shots.js checks)
//   'to'         a steady rate that reaches the next segment's s exactly when it starts
const LF_SLOW = 0.1;                                     // the first forty seconds after 9 PM: ten times slower
const LF_CLOCK = (() => {
  const B = lfB, C = lfC, P = LFP, slow = ['rate', LF_SLOW];
  const S = [
    [-2, -2.85 - 2, 'real'],
    [LF.tLock, 0, slow],                                  // ★ 9:00:00.000
    [B('flicker'), 7.85, slow],                           // the transformers saturate at 8.2 s (×1.085)
    [B('mri'), 8.45, slow],                               // the MRI quenches at 9.58 s (×1.1), on its third caption
    [B('blackout'), 13.85, slow],                         // the grid trips at 14.05 s (×1.15); the stadium's own feed at 14.45
    [B('road'), 25.2, slow],                              // cars cut out around 26.4 s (×1.3)
    [B('mercury'), 26.5, slow],                           // mercury freezes at 28.0 s on the mountain (6 °C), on its third caption
    [B('ring'), 38.3, slow],                              // gold's edge leaves the visible at 38.9 s (×1.47)
    [B('beach'), 55.0, 'real'],                           // from here: real speed (the train stops at 61 s)
    [B('colour'), 151.5, 'real'],                         // ×5 at 161.7 s
    [B('day'), 165.0, 'real'],                            // 9:03:00: the Sun's old light runs out (×6)
    [B('heat'), 230.7, 'real'],                           // ×10 at 231.4 s
    [B('saturn'), P.sSaturn - 1.6, 'real'],               // 9:07:33: Saturn goes out
    [B('nearest'), P.sAlphaCen - 2.4, 'real'],            // 9:23:40: the nearest star goes out
  ];
  void C;
  const out = [];
  S.forEach((g, i) => {
    const t0 = g[0], nx = S[i + 1], t1 = nx ? nx[0] : LF.end + 5, pv = out[i - 1];
    let s0 = g[1];
    if (pv && pv.mode !== 'to') s0 = Math.max(s0, pv.s1);
    const rate = g[2] === 'real' ? 1 : g[2] === 'to' ? (nx[1] - s0) / (t1 - t0) : g[2][1];
    out.push({ t0, t1, s0, s1: s0 + rate * (t1 - t0), rate, mode: g[2] === 'to' ? 'to' : 'run' });
  });
  out.forEach((g, i) => {
    if (!(g.t1 > g.t0) || g.rate <= 0) throw new Error(`LF_CLOCK: segment ${i} (t ${g.t0.toFixed(2)}–${g.t1.toFixed(2)}) runs backwards`);
    if (i && g.s0 < out[i - 1].s1 - 1e-6) throw new Error(`LF_CLOCK: segment ${i} starts before the last one ended (s ${g.s0.toFixed(3)} < ${out[i - 1].s1.toFixed(3)})`);
  });
  return out;
})();
function lfSegAt(t) { const K = LF_CLOCK; let i = 0; while (i < K.length - 1 && t >= K[i + 1].t0) i++; return K[i]; }
function lfStoryAt(t) { const g = lfSegAt(t); return g.s0 + g.rate * (t - g.t0); }
const lfRateAt = (t) => lfSegAt(t).rate;                  // story seconds per film second (1 = real speed)
const lfKAt = (t) => LFP.k(lfStoryAt(t));
// the clock's jumps (film times where the story skips ahead), for the HUD's "+20 s"
const LF_JUMPS = LF_CLOCK.slice(1).map((g, i) => ({ t: g.t0, ds: g.s0 - LF_CLOCK[i].s1 })).filter((j) => j.ds > 0.5);
// the film time at which story time s is on screen (the clock is monotonic: bisect)
function lfFilmAt(s) { let a = -2, b = LF.end + 1; for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (lfStoryAt(m) < s) a = m; else b = m; } return (a + b) / 2; }

// every "×N" a caption says must be what the counter says while it is on screen (within 6%)
for (const g of LFT.groups) for (const c of g.caps) {
  const m = /×(\d+(?:\.\d+)?)/.exec(c.text);
  if (!m) continue;
  const want = +m[1], at = lfStoryAt(c.show + 0.6), got = LFP.k(at);
  if (Math.abs(got / want - 1) > 0.06) throw new Error(`caption "${c.text}" says ×${want}, but the clock has ×${got.toFixed(3)} (s ${at.toFixed(2)})`);
}

// the clock as Saturday h:m:s.ms (s = 0 is 9:00:00.000 PM)
function lfClockParts(s) {
  const T = 21 * 3600 + s, ms = Math.floor((((T % 1) + 1) % 1) * 1000 + 1e-6), sec = Math.floor(T) % 60, mi = Math.floor(T / 60) % 60, h24 = Math.floor(T / 3600) % 24;
  return { day: 'SATURDAY', h: ((h24 + 11) % 12) + 1, m: mi, sec, ms, pm: h24 >= 12 };
}

CONFIG.duration = LF.end;
CONFIG.seed = 20261107;
Object.assign(CONFIG.camera, { cameraHeight: 1.63, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 50, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;

const SCRIPT = {
  meta: { title: 'What if the speed of light increased and couldn’t stop?', wav: 'light-faster-soundtrack.wav' },
  events: [],                                            // (filled from the shots by shots.js)
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.63]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 50]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: {
    title: { in: LF.title[0], out: LF.title[1], fi: 0.25, fo: 0.5, cls: 'big center', html: '<span class="kick">WHAT IF THE SPEED OF LIGHT</span><span class="hero">INCREASED</span><span class="kick k2">AND COULDN’T STOP?</span>' },
    captions: [],
    readouts: [],
  },
};
const SCRIPT_TRACKS = {};
