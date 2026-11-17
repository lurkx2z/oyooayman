/* =====================================================================
   SCRIPT — "What if there was no light in the universe?" (16:9, 1920×1080, 30 fps, voiceless).
   ★ The edit is built AROUND THE CAPTIONS (window.NLT, written by build-timing.cjs from CAPTIONS.md); the story clock
   (clock.js) and everything that moves (physics.js) are placed on them. This file checks that every caption that names
   a moment sits on it (the clock only runs forward: there is no second chance) and that every number in a caption is
   the one physics.js gives; then it configures the engine.
   ===================================================================== */

// ---------------------------------------------------------------------------------------------------------------------
// THE CHECKS (they throw: the page shows the error instead of a film that says something untrue)
// ---------------------------------------------------------------------------------------------------------------------
const NL_CHECKS = (() => {
  const out = [], bad = [];
  const fail = (m) => bad.push(m);
  // a caption must come up between lo and hi film seconds after story moment s is on screen
  const near = (id, k, s, lo, hi, what) => { const d = nlC(id, k) - nlFilmAt(s); out.push([`${id}:${k}`, what, d]); if (d < lo || d > hi) fail(`caption ${id}:${k} shows ${d.toFixed(2)} s after ${what} (want ${lo}…${hi})`); };
  const E = NLE, Y = NLY, V = NLV, P = NLP;
  near('start', 0, 0, 0.1, 0.8, 'the light goes');
  near('skaters', 1, E.fall, -1.4, -0.6, 'you hit someone on the ice');
  near('body', 1, E.hand[1], 0.6, 6, 'you lift your hand');
  near('grab', 0, E.grab, 0.2, 0.8, 'she grabs your arm');
  near('fire', 2, E.manStop, 0.2, 1.2, 'the man stops');
  near('road', 2, E.hear, 0.1, 0.8, 'the bang reaches you');
  near('ice', 1, E.crack, 0.0, 0.8, 'the ice cracks under the car');
  near('ice', 2, E.sink, 0.3, 1.1, 'the ice gives way');
  near('plane', 0, E.plane, -0.9, -0.3, 'the plane passes over');
  near('edge', 0, E.iceCrack, 0.0, 0.5, 'the ice cracks under your hands');
  { const fin = E.edge3 + (Y.dist(E.edge3) - Y.dFin) / Y.crawlV; near('reach', 0, fin, -3.0, 0.0, 'your fingers reach his sleeve'); }
  // the numbers
  const num = (id, k, re, v, tol, what) => { const m = re.exec(nlCap(id, k).text); if (!m) { fail(`caption ${id}:${k}: no number for ${what}`); return; } const x = parseFloat(m[1].replace(/,/g, '').replace('−', '-')); out.push([`${id}:${k}`, what, x, v]); if (Math.abs(x - v) > tol) fail(`caption ${id}:${k} says ${x}, physics says ${v.toFixed(3)} (${what})`); };
  { const c = nlClockParts(nlSC('start', 0)); if (!(c.h === 2 && c.m === 40 && c.pm)) fail(`start:0 says 2:40 PM: the clock says ${c.h}:${c.m}`); }
  num('skaters', 0, /at ([\d.]+) km\/h/, (P.v0 - P.glide * nlSC('skaters', 0, 1.0)) * 3.6, 0.6, 'your speed while the caption is read');
  num('rule', 2, /([\d.]+) to \d+ nanometres/, P.band[0], 0, 'violet end of the visible band');
  num('rule', 2, /to ([\d.]+) nanometres/, P.band[1], 0, 'red end of the visible band');
  num('body', 0, /at ([\d.]+) micrometres/, P.peakUm, 0.06, "the peak of your skin's glow (Wien)");
  num('body', 0, /([\d.]+) times too long/, P.timesRed, 0.5, 'the peak over the reddest visible light');
  num('count', 0, /^([\d,]+) people/, NLK.list.length + NL_FAR.length, 0, 'skaters on the ice (the set)');
  num('count', 0, /^([\d,]+) people/, P.skaters, 0, 'skaters on the ice');
  num('count', 1, /It's ([−\d.]+) °C/, P.air, 0, 'the air');
  { const a = P.sunAlt(nlSC('sun', 0)); out.push(['sun:0', "the Sun's altitude (NOAA)", a]); if (!(a < 3 && a > 2)) fail(`sun:0 says less than 3° up: ${a.toFixed(2)}`); }
  if (!(1 - P.sunVisible > 0.5)) fail('the sun inset says more than half of sunlight is not visible light');
  { const m = /at (\d+):(\d+) PM/.exec(nlCap('sun', 1).text); if (!m || +m[1] !== P.sunset[0] - 12 || +m[2] !== P.sunset[1]) fail('sun:1: the sunset time'); }
  num('fire', 0, /burning at ([\d.]+) °C/, P.fireC, 0, 'the fire');
  num('road', 2, /takes ([\d.]+) seconds/, V.delay, 0.06, 'the bang from the road to you, through −12 °C air');
  num('ice', 0, /ice ([\d.]+) cm thick/, P.icePerson, 0, 'ice for a person');
  num('ice', 0, /needs about ([\d.]+)/, P.iceCar, 0, 'ice for a car');
  num('ice', 1, /only ([\d.]+)/, P.iceInlet, 0, 'the ice by the stream');
  num('steam', 0, /at ([\d.]+) °C/, P.water, 0, 'the water');
  num('steam', 0, /That's ([\d.]+) degrees warmer/, P.water - P.air, 0, 'water minus air');
  num('world', 0, /Right now, ([\d.]+) billion/, P.people / 1e9, 0.5, 'people on Earth');
  num('plane', 0, /is ([\d.]+) km from/, P.plane.dist / 1000, 0, 'the plane from its runway');
  num('plane', 0, /, ([\d.]+) metres up/, P.plane.alt, 5, 'its height on a 3° glide path');
  num('water', 2, /have ([\d.]+) minute/, P.coldMin[0], 0, 'cold shock');
  num('water', 2, /About ([\d.]+) before/, P.coldMin[1], 0, 'useful movement');
  num('crawl', 2, /He's ([\d.]+) metres away/, Y.dist(nlSC('crawl', 2, 0.6)) - Y.head - Y.dDriver, 0.6, 'your head to him');
  num('edge', 2, /water for ([\d.]+) minutes/, NLD.inWater(nlSC('edge', 2)) / 60, 0.3, 'the driver in the water');
  num('edge', 2, /You're ([\d.]+) metres from the edge/, Y.dist(nlSC('edge', 2, 0.6)) - Y.head - NLV.holeR(nlSC('edge', 2)), 0.25, 'your head to the edge');
  if (bad.length) throw new Error('script.js: ' + bad.join(' · '));
  return out;
})();

CONFIG.duration = NL.end;
CONFIG.seed = 20270110;
Object.assign(CONFIG.camera, { cameraHeight: 1.63, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 50, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;

const SCRIPT = {
  meta: { title: 'What if there was no light in the universe?', wav: 'no-light-soundtrack.wav' },
  events: [],                                            // (filled from the shots by shots.js)
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.63]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 50]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: {
    title: { in: NL.title[0], out: NL.title[1], fi: 0.25, fo: 0.4, cls: 'big center', html: '<span class="kick">WHAT IF THERE WAS</span><span class="hero">NO LIGHT</span><span class="kick k2">IN THE UNIVERSE?</span>' },
    captions: [],
    readouts: [],
  },
};
const SCRIPT_TRACKS = {};
