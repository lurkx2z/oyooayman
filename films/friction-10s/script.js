/* =====================================================================
   SCRIPT — "What if friction disappeared for 10 seconds?" (16:9, 1920×1080, 30 fps, 5:58, voiceless).
   ★ The edit is built AROUND THE CAPTIONS: every beat below comes from the caption times (window.FZT, written by
   build-timing.cjs from CAPTIONS.md). Change a pause → edit PAUSE there and re-run it.
   The physics (physics.js) runs on STORY time s: seconds after friction disappears (at 8:14:07 AM); it comes back at
   s = 10. This file maps film time t to story time s. The film is ten seconds, told over six minutes:
     1  the cold open: the first second and a half in real time (the cat, the coffee, your feet, the phone), the title
        over it, then the clock all but stops (80× slower) while the rule is set out; a flash-forward to s = 10
     2  that first second again, 10× slower, from angle after angle in the kitchen
     3  the same second in the rest of the house; 4  the same second outside, in the street
     5  then everything slides (the floor's slope, the hill's), the count down to s = 10, the return, its replays, after
   Every shot has its own clock: keyframes [[t, s], …] (shots.js), straight lines between them; the HUD reads the speed
   off them (SLOWED DOWN 10×, REAL SPEED, REWIND, REPLAY, FLASH-FORWARD). Everything is a pure function of film time.
   ===================================================================== */

const FZT_ID = Object.fromEntries(FZT.groups.map((g) => [g.id, g]));
// the first word of beat `id` (from word index `from`, counted across its captions) that starts with `txt`
function fzW(id, txt, from = 0) {
  const k = txt.toLowerCase(), ws = FZT_ID[id].caps.flatMap((c) => c.words);
  for (let i = from; i < ws.length; i++) if (ws[i].text.toLowerCase().replace(/[^a-z0-9']/g, '').startsWith(k)) return ws[i];
  throw new Error(`fzW: "${txt}" not found in beat ${id}`);
}
const fzS = (id) => FZT_ID[id].first;         // the beat's first caption appears
const fzE = (id) => FZT_ID[id].end;           // its last caption goes
const fzCap = (id, k) => FZT_ID[id].caps[k];  // a caption: { text, show, hide, words }

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (film seconds). shots.js and every other file key off these.
// ---------------------------------------------------------------------------------------------------------------------
const FZ = {};
FZ.t0 = 0.62;                                            // ★ friction goes (story s = 0), under the title
FZ.title = [-0.4, fzE('title') + 0.25];                  // (fully up on frame 1)
FZ.end = FZT.duration;
// the cold open's clock: real time to t 2.2 (s 1.58: you're down, reaching for the oven handle), then it slows to
// 1/80 of real speed by t 3.4 and stays there while the rule is set out (section 1)
FZ.open = { real: 2.2, slow: 3.4, rate: 0.0125 };
FZ.open.sReal = FZ.open.real - FZ.t0;
FZ.open.sSlow = FZ.open.sReal + FZ.open.rate * (FZ.open.slow - FZ.open.real) + (1 - FZ.open.rate) * (FZ.open.slow - FZ.open.real) * 0.5;
function fzOpenS(t) {
  const O = FZ.open;
  if (t < O.real) return t - FZ.t0;
  if (t < O.slow) { const u = (t - O.real) / (O.slow - O.real), d = O.slow - O.real; return O.sReal + O.rate * d * u + (1 - O.rate) * d * (u - u * u / 2); }
  return O.sSlow + O.rate * (t - O.slow);
}

CONFIG.duration = FZ.end;
CONFIG.seed = 20261028;
Object.assign(CONFIG.camera, { cameraHeight: 1.63, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 50, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;

const SCRIPT = {
  meta: { title: 'What if friction disappeared for 10 seconds?', wav: 'friction-10s-soundtrack.wav' },
  events: [],                                            // (filled from the shots by shots.js)
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.63]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 50]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: {
    title: { in: FZ.title[0], out: FZ.title[1], fi: 0.25, fo: 0.5, cls: 'big center', html: '<span class="kick">WHAT IF FRICTION</span><span class="hero">DISAPPEARED</span><span class="kick k2">FOR 10 SECONDS?</span>' },
    captions: [],
    readouts: [],
  },
};
const SCRIPT_TRACKS = {};
