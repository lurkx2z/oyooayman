/* =====================================================================
   SCRIPT — "What If Earthquakes Got 1 Magnitude Stronger Every Minute?" (16:9, 1920×1080, 30 fps, narrated: Michael).
   The edit is built on the narration (narration-timing.js, made by build-timing.cjs from the real clips) and on the
   film's real-time clock (quake.js: minute k starts at eqTick(k), magnitude 2 + k). quake.js checks every number the
   narrator says against the code (EQ_CHECKS: the page shows the error instead of a film that says something untrue);
   this file configures the engine.
   ===================================================================== */

CONFIG.duration = EQ.end;
CONFIG.seed = 20261128;
Object.assign(CONFIG.camera, { cameraHeight: 1.63, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 50, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;

const SCRIPT = {
  meta: { title: 'What If Earthquakes Got 1 Magnitude Stronger Every Minute?', wav: 'earthquakes-stronger-soundtrack.wav' },
  events: [],                                            // (filled from the shots by shots.js)
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.63]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 50]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: { captions: [], readouts: [] },                   // (no title card: the new recipe opens on magnitude twelve)
};
const SCRIPT_TRACKS = {};
