/* =====================================================================
   SCRIPT — "What if your shadow lagged 1 second behind you?" (16:9, 1920×1080, 30 fps, voiceless).
   ★ The edit is built AROUND THE CAPTIONS (window.SHT, written by build-timing.cjs from CAPTIONS.md); the story clock
   (clock.js) and everything that moves (physics.js) are placed on them. This file checks that every caption that names
   a moment sits on it (the clock only runs forward: there is no second chance) and that every number in a caption is
   the one physics.js gives; then it configures the engine.
   ===================================================================== */

// ---------------------------------------------------------------------------------------------------------------------
// THE CHECKS (they throw: the page shows the error instead of a film that says something untrue)
// ---------------------------------------------------------------------------------------------------------------------
const SH_CHECKS = (() => {
  const out = [], bad = [];
  const fail = (m) => bad.push(m);
  // a caption must come up between lo and hi film seconds after story moment s is on screen
  const near = (id, k, s, lo, hi, what) => { const d = shC(id, k) - shFilmAt(s); out.push([`${id}:${k}`, what, d]); if (d < lo || d > hi) fail(`caption ${id}:${k} shows ${d.toFixed(2)} s after ${what} (want ${lo}…${hi})`); };
  const E = SHE, Y = SHY;
  near('start', 1, E.step + 1, -0.2, 1.4, 'your shadow steps out');
  near('hand', 1, E.hand + 0.45, -0.3, 0.6, 'your hand is up');
  near('hand', 2, E.hand + 1.45, -0.6, 0.4, "the shadow's hand is up");
  if (shFilmAt(E.hand + 1) < shC('hand', 1) + 1.0) fail('hand:1 "Its shadow waits": the shadow starts to move too soon after it');
  near('stop', 1, E.stop + 1, -1.2, 0.0, 'the shadow reaches you');
  near('turn', 0, E.turn, -0.6, 0.1, 'you turn');
  near('jump', 1, E.jump + 1, -0.6, 0.1, "the shadow's take-off");
  if (shFilmAt(E.jump + 0.45) > shC('jump', 1)) fail('jump:1: you have not landed yet');
  near('hide', 1, E.hidden, 0.2, 1.2, 'you are behind the pillar');
  if (shFilmAt(E.hidden + 1) < shC('hide', 1) + 1.6) fail('hide:1: your shadow goes behind the pillar before the caption can be read');
  near('still', 1, E.shuffle + 0.6, -0.5, 0.4, 'you stand still');
  near('guard', 2, E.shield, -0.4, 0.2, 'you shield your eyes');
  near('run', 0, E.run, -1.6, 0.0, 'you start to run');
  if (!(shC('run', 1) > shFilmAt(E.run) && shC('run', 1) < shFilmAt(E.run + 1) - 0.8)) fail('run:1 "For 1 second, your shadow just stands there" is not shown while it stands');
  near('run', 2, E.run + 1, -0.5, 2.4, 'your shadow starts to run');
  near('exit', 0, E.exitStop, -2.2, 0.2, 'your car stops');
  near('exit', 1, E.exitStop + 1, -0.8, 0.8, 'your shadow stops');
  near('question', 0, E.rise[1], 0.0, 0.8, 'the one in the back has sat up');
  // the numbers
  const num = (id, k, re, v, tol, what) => { const m = re.exec(shCap(id, k).text); if (!m) fail(`caption ${id}:${k}: no number`); const x = parseFloat(m[1].replace(/,/g, '')); out.push([`${id}:${k}`, what, x, v]); if (Math.abs(x - v) > tol) fail(`caption ${id}:${k} says ${x}, physics says ${v.toFixed(3)} (${what})`); };
  const P = SHP;
  num('only', 0, /Of ([\d.]+) billion/, P.people / 1e9, 0.5, 'people on Earth');
  num('light', 1, /in ([\d.]+) billionths/, P.lightNs, 0.5, 'lamp to floor, ns');
  num('light', 2, /normally ([\d.]+) billionths/, P.lightNs, 0.5, 'lamp to floor, ns');
  num('light', 3, /more than ([\d.]+) million/, Math.floor(P.ratio / 1e8) * 100, 0, '1 s / 9 ns (more than 100 million)');
  const sW = shSC('walk', 1, 0.5);
  num('walk', 0, /at ([\d.]+) metres a second/, Y.speed(shSC('walk', 0, 0.8)), 0.05, 'your walking speed');
  num('walk', 1, /walks ([\d.]+) metres behind/, Y.dist(sW) - Y.dist(sW - 1), 0.05, 'how far behind your shadow walks');
  num('where', 1, /at ([\d,]+) metres a second/, P.spin, 5, "the Earth's spin here");
  num('where', 1, /orbit at ([\d.]+) km a second/, P.orbitKms, 0.5, "the Earth's orbit");
  num('where', 2, /be ([\d.]+) km from here/, P.orbitKms * P.lag, 0.5, 'how far the orbit carries you in 1 s');
  const sR = shSC('run', 2, 0.6);
  num('run', 2, /too, ([\d.]+) metres behind/, Y.dist(sR) - Y.dist(sR - 1), 0.3, 'how far behind your running shadow is');
  num('speed', 0, /at ([\d.]+) km\/h/, SHC.l4(E.ramp).v * 3.6, 0.5, 'your speed at the top of the ramp');
  num('speed', 1, /is ([\d.]+) metres behind/, SHC.l4(E.ramp).v * P.lag, 0.5, 'how far behind the car your shadow is');
  if (Math.round(P.overLimit) !== 3) fail(`speed:0 says three times the limit: ${P.overLimit.toFixed(2)}`);
  // "Right now you have 4" (the four strongest: the 'top' shot casts from the four nearest lit lamps)
  num('lamps', 0, /you have (\d+)/, 4, 0, 'lamps casting your shadow in the top shot');
  // the wall clock: "11:58 PM" when the first caption comes up; midnight 0.8 s before "12:00 AM"
  { const c = shClockParts(shSC('start', 0)); if (!(c.h === 11 && c.m === 58 && c.pm)) fail(`start:0 says 11:58 PM: the clock says ${c.h}:${c.m}`); }
  { const c = shClockParts(shSC('midnight', 0)); if (!(c.h === 12 && c.m === 0 && !c.pm)) fail(`midnight:0 says 12:00 AM: the clock says ${c.h}:${c.m}`); }
  if (bad.length) throw new Error('script.js: ' + bad.join(' · '));
  return out;
})();

CONFIG.duration = SH.end;
CONFIG.seed = 20261113;
Object.assign(CONFIG.camera, { cameraHeight: 1.63, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 50, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 1024;

const SCRIPT = {
  meta: { title: 'What if your shadow lagged 1 second behind you?', wav: 'shadow-lag-soundtrack.wav' },
  events: [],                                            // (filled from the shots by shots.js)
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.63]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 50]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: {
    title: { in: SH.title[0], out: SH.title[1], fi: 0.25, fo: 0.5, cls: 'big center', html: '<span class="kick">WHAT IF YOUR SHADOW</span><span class="hero">LAGGED 1 SECOND</span><span class="kick k2">BEHIND YOU?</span>' },
    captions: [],
    readouts: [],
  },
};
const SCRIPT_TRACKS = {};
