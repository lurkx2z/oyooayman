/* =====================================================================
   SCRIPT — "What if gravity kept tilting sideways every second and couldn't stop?" (16:9, 1920×1080, 30 fps, voiceless).
   ★ The story clock runs at REAL SPEED from the first frame to the last: story time s = film time t − GK.t0 (s is
   seconds after 4:00:00 PM; down has turned floor(s) degrees). Nothing is sped up, nothing jumps, nothing replays: every
   cut lands on the next moment of the same turn (the owner's rule of 2026-10-29, at its strictest).
   The captions (window.GKT, written by build-timing.cjs from CAPTIONS.md) are pinned to the angles they talk about;
   the shots (shots.js) key off them. Everything is a pure function of film time.
   ===================================================================== */

const GKT_ID = Object.fromEntries(GKT.groups.map((g) => [g.id, g]));
const gkS = (id) => GKT_ID[id].first;         // the beat's first caption appears (film t)
const gkE = (id) => GKT_ID[id].end;           // its last caption goes
const gkCap = (id, k) => GKT_ID[id].caps[k];
const gkC = (id, k) => GKT_ID[id].caps[k].show;
const gkB = (id, d = 0.6) => gkS(id) - d;     // a cut just before beat id's first caption

const GK = {};
GK.t0 = GKT.t0;                                          // film t of story s = 0 (4:00:00 PM); the first tick at s = 1
GK.title = [-0.4, gkE('title') + 0.25];
GK.end = GKT.duration;
// THE CLOCK: one segment, real speed (kept in this form so the HUD and the sound read it like the other films)
const GK_CLOCK = [{ t0: -2, t1: GK.end + 5, s0: -2 - GK.t0, s1: GK.end + 5 - GK.t0, rate: 1 }];
function gkStoryAt(t) { return t - GK.t0; }
function gkFilmAt(s) { return s + GK.t0; }
function gkRate() { return 1; }
const gkTickT = (k) => gkFilmAt(k);                      // the film time of tick k (down reaches k°)

CONFIG.duration = GK.end;
CONFIG.seed = 20261030;
Object.assign(CONFIG.camera, { cameraHeight: 1.62, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 50, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;

const SCRIPT = {
  meta: { title: "What if gravity kept tilting sideways every second and couldn't stop?", wav: 'gravity-keeps-tilting-soundtrack.wav' },
  events: [],
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.62]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 50]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: {
    title: { in: GK.title[0], out: GK.title[1], fi: 0.25, fo: 0.5, cls: 'big center', html: '<span class="kick">WHAT IF GRAVITY KEPT</span><span class="hero">TILTING SIDEWAYS</span><span class="kick k2">EVERY SECOND · AND COULDN\'T STOP?</span>' },
    captions: [],
    readouts: [],
  },
};
const SCRIPT_TRACKS = {};
