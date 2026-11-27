/* =====================================================================
   SCRIPT — "What If Every Step You Took Was Twice as Long?" (16:9, 1920×1080, 30 fps, narrated: Michael).
   The edit is built on the narration (narration-timing.js, made by build-timing.cjs from the real clips): steps.js
   pins every step to a word, shots.js every cut. This file checks that what the narrator says is what the film's
   numbers say (they throw: the page shows the error instead of a film that says something untrue), then configures
   the engine.
   ===================================================================== */

const TW_CHECKS = (() => {
  const bad = [], out = [];
  const near = (what, v, want, tol) => { out.push([what, v, want]); if (Math.abs(v - want) > tol) bad.push(`${what}: ${v} (want ${want} ± ${tol})`); };
  const km = (n) => twL(n) / 1000;
  near('step 2 is 1.5 m', twL(2), 1.5, 0.001);
  near('step 5 is 12 m (a bus)', twL(5), 12, 0.001);
  near('step 6 is 24 m', twL(6), 24, 0.001);
  near('step 7: 48 m, 173 km/h', twL(7) * 3.6, 172.8, 0.5);
  near('step 8 (96 m) is longer than the Statue of Liberty (93 m to the torch)', twL(8) > 93 ? 1 : 0, 1, 0);
  near('step 9: almost 200 m', twL(9), 192, 0.1);
  near('step 10: 384 m ≈ the Empire State Building (381 m roof)', twL(10), 384, 0.1);
  near('step 10 is faster than sound', twL(10) > 343 ? 1 : 0, 1, 0);
  near('step 11: almost a kilometre, twice the speed of sound', twL(11) / 343, 2.24, 0.05);
  near('step 12: 1.5 km', km(12), 1.536, 0.001);
  near('step 13: 3 km, Mach 9', twL(13) / 343, 8.96, 0.05);
  near('step 14: 6 km', km(14), 6.144, 0.001);
  near('missed the office by 4 km (8 km on foot from your door: steps 6–14)', (twSum(14) - twSum(5) - 8000) / 1000, 4.26, 0.3);
  near('step 15: 12 km/s, over escape velocity (11.2)', km(15) > 11.2 ? 1 : 0, 1, 0);
  near('step 22 is higher than the Space Station (420 km)', Math.sqrt(6371 ** 2 + (twSum(22) - twSum(14)) ** 2 / 1e6) - 6371 > 420 ? 1 : 0, 1, 0);
  near('step 24 ≈ the Earth\'s radius (6,371 km)', km(24), 6291, 120);
  near('step 25 ≈ the Earth\'s diameter (12,742 km)', km(25), 12583, 200);
  near('step 27: 50,000 km/s', km(27), 50332, 400);
  near('step 29: more than half the speed of light (one second of your time over 402,653 km… 201,327 km)', twBeta(29), 0.558, 0.01);
  near('you pass the Moon (384,400 km) during step 29', twSum(28) < 384.4e6 && twSum(29) > 384.4e6 ? 1 : 0, 1, 0);
  near('step 30 is longer than the trip to the Moon', twL(30) > 384.4e6 ? 1 : 0, 1, 0);
  near('on Earth, step 30 takes 1.7 s', twStepEarthS(30), 1.674, 0.03);
  near('step 37 ≈ Mars at its closest (54.6 million km)', km(37) / 1e6, 51.5, 4);
  near('on Earth, step 37 takes 3 minutes', twStepEarthS(37) / 60, 2.86, 0.3);
  near('step 39 is longer than the Earth–Sun trip (149.6 million km)', km(39) > 149.6e6 ? 1 : 0, 1, 0);
  near('step 41 is longer than Jupiter–Sun (778 million km)', km(41) > 778e6 ? 1 : 0, 1, 0);
  near('step 42 is longer than Saturn–Sun (1,433 million km)', km(42) > 1433e6 ? 1 : 0, 1, 0);
  near('after step 43 you are past Pluto (5.9 billion km)', twSum(43) / 1e3 > 5.9e9 ? 1 : 0, 1, 0);
  near('you pass Voyager 1 (about 25.4 billion km out, late 2026) during step 45', twSum(44) / 1e3 < 25.4e9 && twSum(45) / 1e3 > 25.4e9 ? 1 : 0, 1, 0);
  near('on Earth, step 46 takes a day', twStepEarthS(46) / 86400, 1.02, 0.05);
  near('on Earth, a month by step 50', TW_ET[50] / 86400, 32.6, 2);
  near('on Earth, almost nine months by step 53', TW_ET[53] / (86400 * 30.44), 8.6, 0.4);
  near('you pass Proxima Centauri (4.24 ly) during step 56', twSum(55) / TW_LY < 4.24 && twSum(56) / TW_LY > 4.24 ? 1 : 0, 1, 0);
  near('on Earth, almost six years by step 56', TW_ET[56] / (86400 * 365.25), 5.7, 0.3);
  near('turned round, step 57 lands 0.75 m behind your door, 11 years after you left', TW_ET[57] / (86400 * 365.25), 11.4, 0.5);
  near('on Earth, ninety years by step 60', TW_ET[60] / (86400 * 365.25), 91, 2);
  near('almost fifteen hundred years by step 64', TW_ET[64] / (86400 * 365.25), 1462, 40);
  near('step 70: the Milky Way (100,000 ly) in sight, 94,000 ly out', twSum(70) / TW_LY, 94000, 2000);
  near('step 72: longer than humans have existed (300,000 years)', TW_ET[72] / (86400 * 365.25) > 300000 ? 1 : 0, 1, 0);
  near('step 75: farther than Andromeda (2.5 million ly)', twSum(75) / TW_LY > 2.5e6 ? 1 : 0, 1, 0);
  near('step 86: six billion years', TW_ET[86] / (86400 * 365.25e9), 6.1, 0.2);
  near('step 90: farther than the observable universe is wide (93 billion ly)', twSum(90) / TW_LY > 93e9 ? 1 : 0, 1, 0);
  if (bad.length) throw new Error('script.js: ' + bad.join(' · '));
  return out;
})();

CONFIG.duration = TW.end;
CONFIG.seed = 20261130;
Object.assign(CONFIG.camera, { cameraHeight: 1.63, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 50, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;

const SCRIPT = {
  meta: { title: 'What If Every Step You Took Was Twice as Long?', wav: 'twice-as-long-soundtrack.wav' },
  events: [],                                            // (filled from the shots by shots.js)
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.63]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 50]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: { captions: [], readouts: [] },                   // (no title card: the new recipe opens on step ninety)
};
const SCRIPT_TRACKS = {};
