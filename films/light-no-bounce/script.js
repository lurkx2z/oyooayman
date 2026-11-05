/* =====================================================================
   SCRIPT — "What if light stopped bouncing for 10 seconds?" (16:9, 1920×1080, 30 fps, voiceless).
   ★ The edit is built AROUND THE CAPTIONS: every beat below comes from the caption times (window.NBT, written by
   build-timing.cjs from CAPTIONS.md). Change a pause → edit PAUSE there and re-run it.
   The physics (physics.js) runs on STORY time s: seconds after Saturday 3:30:00.000 PM, when light stops bouncing (for
   ten seconds). This file maps film time t to story time s with ONE clock for the whole film (NB_CLOCK): it only ever
   runs forward (the owner's rule of 2026-10-29: no replays; every new angle or place moves the clock on). The ten
   seconds play about 26 times slower (the HUD says how slowly), then the clock slows out of the return to the Moon's,
   runs at real speed, and jumps forward only at cuts (the HUD says how far): two minutes, then to 4:42 PM.
   ===================================================================== */

const NBT_ID = Object.fromEntries(NBT.groups.map((g) => [g.id, g]));
const nbS = (id) => NBT_ID[id].first;         // the beat's first caption appears
const nbE = (id) => NBT_ID[id].end;           // its last caption goes
const nbCap = (id, k) => NBT_ID[id].caps[k];  // a caption: { text, show, hide, words }
const nbC = (id, k) => NBT_ID[id].caps[k].show;
const nbB = (id, d = 0.6) => nbS(id) - d;     // a cut just before beat id's first caption

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (film seconds)
// ---------------------------------------------------------------------------------------------------------------------
const NB = {};
NB.title = [-0.4, nbE('title') + 0.25];
NB.end = NBT.duration;
NB.tLock = 2.85;                                         // ★ (film) 3:30:00 PM: light stops bouncing (s = 0)

// THE CLOCK: [film t where a segment starts, story s there (at least), how it runs]
//   ['rate', r]  a steady rate r (0.04 = 25 times slower); 'real' = real speed. The next segment starts at
//                max(where this one got to, its own s): a jump forward, always at a cut (shots.js checks)
//   'to'         a steady rate that reaches the next segment's s exactly when it starts
const NB_CLOCK = (() => {
  const B = nbB, C = nbC, P = NBP;
  const S = [
    [-2, -2.85 - 2, 'real'],
    [NB.tLock, 0, 'to'],                                  // ★ 3:30:00.000: the ten seconds, one steady slow motion…
    [C('back', 0) - 0.6, P.T, 'to'],                      // …to 3:30:10.000, as "Light bounces again" comes up
    [C('moonback', 0) + 0.25, P.T + P.moonS + 0.02, 'real'],   // the Moon's light returns 1.28 s late; then real speed
    [B('after'), 130, 'real'],                            // +2 min
    [B('echo'), P.sEcho - (C('echo', 2) - 1.0 - B('echo')), 'real'],   // 4:42 PM: everyone watching Saturn (it goes out 1 s before "There's nothing to arrive")
  ];
  const out = [];
  S.forEach((g, i) => {
    const t0 = g[0], nx = S[i + 1], t1 = nx ? nx[0] : NB.end + 5, pv = out[i - 1];
    let s0 = g[1];
    if (pv && pv.mode !== 'to') s0 = Math.max(s0, pv.s1);
    const rate = g[2] === 'real' ? 1 : g[2] === 'to' ? (nx[1] - s0) / (t1 - t0) : g[2][1];
    out.push({ t0, t1, s0, s1: s0 + rate * (t1 - t0), rate, mode: g[2] === 'to' ? 'to' : 'run' });
  });
  out.forEach((g, i) => {
    if (!(g.t1 > g.t0) || g.rate <= 0) throw new Error(`NB_CLOCK: segment ${i} (t ${g.t0.toFixed(2)}–${g.t1.toFixed(2)}) runs backwards`);
    if (i && g.s0 < out[i - 1].s1 - 1e-6) throw new Error(`NB_CLOCK: segment ${i} starts before the last one ended (s ${g.s0.toFixed(3)} < ${out[i - 1].s1.toFixed(3)})`);
  });
  return out;
})();
function nbSegAt(t) { const K = NB_CLOCK; let i = 0; while (i < K.length - 1 && t >= K[i + 1].t0) i++; return K[i]; }
function nbStoryAt(t) { const g = nbSegAt(t); return g.s0 + g.rate * (t - g.t0); }
const nbRateAt = (t) => nbSegAt(t).rate;                  // story seconds per film second (1 = real speed)
// the clock's jumps (film times where the story skips ahead), for the HUD's "+2 min"
const NB_JUMPS = NB_CLOCK.slice(1).map((g, i) => ({ t: g.t0, ds: g.s0 - NB_CLOCK[i].s1 })).filter((j) => j.ds > 0.5);
// the film time at which story time s is on screen (the clock is monotonic: bisect)
function nbFilmAt(s) { let a = -2, b = NB.end + 1; for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (nbStoryAt(m) < s) a = m; else b = m; } return (a + b) / 2; }

// the captions that name a moment must sit on it (the clock only runs forward: there is no second chance)
{
  const near = (id, k, s, lo, hi) => { const d = nbC(id, k) - nbFilmAt(s); if (d < lo || d > hi) throw new Error(`caption ${id}:${k} shows ${d.toFixed(2)} s from story ${s} (want ${lo}…${hi})`); };
  near('moongone', 0, NBP.moonS, -0.4, 1.6);             // "There goes the Moon": just after it goes
  near('moonback', 0, NBP.T + NBP.moonS, -0.6, 1.2);      // "The Moon comes back last"
  near('echo', 2, NBP.sEcho, -0.5, 1.5);                  // "There's nothing to arrive": Saturn has just gone out
  if (nbStoryAt(NB.end) >= NBP.sEchoEnd - 0.3) throw new Error('the film must end while Saturn is still dark');
}

CONFIG.duration = NB.end;
CONFIG.seed = 20261121;
Object.assign(CONFIG.camera, { cameraHeight: 1.62, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 50, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;

const SCRIPT = {
  meta: { title: 'What if light stopped bouncing for 10 seconds?', wav: 'light-no-bounce-soundtrack.wav' },
  events: [],                                            // (filled from the shots by shots.js)
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.62]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 50]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: {
    title: { in: NB.title[0], out: NB.title[1], fi: 0.25, fo: 0.5, cls: 'big center', html: '<span class="kick">WHAT IF LIGHT</span><span class="hero">STOPPED BOUNCING</span><span class="kick k2">FOR 10 SECONDS?</span>' },
    captions: [],
    readouts: [],
  },
};
const SCRIPT_TRACKS = {};
