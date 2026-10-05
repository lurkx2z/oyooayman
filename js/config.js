/* =====================================================================
   CONFIG — global tunables. Change numbers here, not deep in the code.
   ===================================================================== */

const URLP = new URLSearchParams(location.search);

const CONFIG = {
  // Output format (design resolution — the HUD is laid out for this)
  width: 1080,
  height: 1920,
  fps: 30,

  // Phase 1 covers the first 15 seconds of the ~80 s video.
  duration: 15.0,

  // One seed drives every "random" choice → identical playback every run.
  seed: 20261005,

  // First-person camera ("the viewer's head")
  camera: {
    cameraHeight: 1.70,      // eye height above the ground under your feet (m)
    walkSpeed: 1.15,         // m/s, used to scale walking bob
    runSpeed: 4.2,           // m/s (reserved for later phases)
    bobStrength: 0.032,      // vertical head bob per step (m)
    bobFrequency: 1.75,      // steps per metre walked
    breathingStrength: 0.006,// chest-rise head motion (m)
    shakeStrength: 1.0,      // global multiplier for all shakes
    fov: 74,                 // vertical field of view (deg) for 9:16
  },

  render: {
    // Internal render scale: 1 = exactly 1080x1920. "auto" = match screen pixels.
    resolution: URLP.get('res') || 'auto',
    msaa: 4,
    shadows: true,
    shadowMapSize: 4096,
    bloom: true,
    exposure: 1.0,
  },

  // Start options (for development): ?t=6.5 starts at 6.5 s, ?record starts in recording mode
  startTime: parseFloat(URLP.get('t') || '0') || 0,
  startInRecordingMode: URLP.has('record'),
  captureMode: URLP.has('capture'),     // used by tools/render-preview.mjs
  captureWidth: parseInt(URLP.get('w') || '540', 10),
  captureHeight: parseInt(URLP.get('h') || '960', 10),
};
