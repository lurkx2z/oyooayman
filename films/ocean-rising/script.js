/* =====================================================================
   SCRIPT — "What if the ocean kept rising and couldn't stop?" (16:9, 1920×1080, 30 fps, voiceless).
   ★ The edit is built AROUND THE CAPTIONS (window.OCT, written by build-timing.cjs from CAPTIONS.md); the story clock
   (clock.js) and everything that moves (physics.js) are placed on them. This file checks that every caption that names
   a moment sits on it (the clock only runs forward: there is no second chance), that every clock time a caption reads
   is the one on the HUD's clock, and that every number in a caption is the one physics.js gives; then it configures
   the engine.
   ===================================================================== */

// ---------------------------------------------------------------------------------------------------------------------
// THE CHECKS (they throw: the page shows the error instead of a film that says something untrue)
// ---------------------------------------------------------------------------------------------------------------------
const OC_CHECKS = (() => {
  const out = [], bad = [];
  const fail = (m) => bad.push(m);
  const P = OCP, E = OCE, T = OC_F.tower, h = (id, k, d = 0.3) => P.h(ocSC(id, k, d));
  // a caption must come up between lo and hi film seconds after story moment s is on screen
  const near = (id, k, s, lo, hi, what) => { const d = ocC(id, k) - ocFilmAt(s); out.push([`${id}:${k}`, what, d]); if (d < lo || d > hi) fail(`caption ${id}:${k} shows ${d.toFixed(2)} s after ${what} (want ${lo}…${hi})`); };
  near('start', 0, 0, 0.0, 0.8, 'high water');
  near('boat', 0, E.taut, -5, 0, 'the line comes taut');
  near('boat', 1, E.flood, -2.2, 0.2, 'the sea pours in over the bow');
  near('boat', 2, E.sunk, 0.2, 2.6, 'the boat goes under');
  near('bell', 0, E.bell, -2.6, -1.0, 'the bell buoy\'s chain runs out');
  near('world', 1, E.tenM, 0.0, 2.0, 'the sea passes 10 m');
  near('fog', 1, E.fogLast, -1.6, 0.4, 'the horn\'s last blast');
  near('cottage', 0, E.houseIn, -0.5, 6.5, 'the sea at the house\'s door');
  near('island', 0, E.island, 0.0, 20, 'the top of the rock goes under');
  near('burst', 0, E.burst, 0.3, 2.0, 'the door gives');
  near('dark', 0, E.dark, 0.0, 3.0, 'the tower\'s lights go out');
  near('town', 1, E.grid, -1.5, 0.2, 'the mainland\'s power goes');
  near('lights', 1, P.sAt(OC_F.lights[1][2]), 0.0, 1.5, 'Owl Point\'s light goes under');
  near('watch', 0, E.watch, 0.0, 2.5, 'the watch room floods');
  near('lamp', 0, E.lamp, -0.6, 0.6, 'the sea reaches the lamp');
  // every clock time a caption reads (h:mm, AM/PM optional) must be the HUD clock's while it's up
  for (const g of OCT.groups) g.caps.forEach((c, k) => {
    const re = /\b(\d{1,2}):(\d{2})(?:\s?(AM|PM))?\b/g; let m;
    while ((m = re.exec(c.text))) { const cp = ocClockParts(ocSC(g.id, k, 0.3)); out.push([`${g.id}:${k}`, 'clock', m[0], `${cp.h}:${cp.m}`]);
      if (+m[1] !== cp.h || +m[2] !== cp.m || (m[3] && (m[3] === 'PM') !== cp.pm)) fail(`caption ${g.id}:${k} reads ${m[0]}, the clock says ${cp.h}:${String(cp.m).padStart(2, '0')}`); }
  });
  // the numbers
  const num = (id, k, re, v, tol, what) => { const m = re.exec(ocCap(id, k).text); if (!m) { fail(`caption ${id}:${k}: no number for ${what}`); return; } const x = parseFloat(m[1].replace(/,/g, '')); out.push([`${id}:${k}`, what, x, v]); if (Math.abs(x - v) > tol) fail(`caption ${id}:${k} says ${x}, physics says ${v.toFixed(3)} (${what})`); };
  num('start', 2, /rock, (\d+) km off/, OC_F.town.d / 1000, 0, 'the coast');
  num('start', 1, /rising (\d+) metre every minute/, P.rate * 60, 0, 'the rate');
  num('rule', 0, /oceans need ([\d,]+) cubic/, P.perMinKm3, 500, 'a minute\'s new water (km³)');
  num('rule', 1, /take (\d+) years/, P.riverYears, 0.5, 'the rivers\' years');
  num('height', 0, /is (\d+) metres above high tide/, T.lamp, 0, 'the lamp\'s height');
  num('height', 1, /you have (\d+) minutes/, P.lampLeft(ocSC('height', 1, 0.3)), 0.5, 'minutes to the lamp');
  num('phone', 0, /coast, (\d+) km away/, OC_F.town.d / 1000, 0, 'the town');
  num('world', 0, /less than (\d+) metres/, P.lowZone, 0, 'the low coastal zone');
  num('world', 1, /passed (\d+) metres/, P.lowZone, 0, 'the sea at 10 m');
  num('fog', 0, /for (\d+) years/, P.year - P.fogBuilt, 0, 'the fog signal\'s age');
  num('cottage', 1, /In (\d+) minutes/, P.houseFull / 60, 0.5, 'the ground floor fills');
  num('door', 1, /is (\d+) metres over it/, h('door', 1) - (T.sill + T.door.h), 0.4, 'the sea over the door');
  num('door', 1, /weight of (\d+) tonnes/, P.doorTonnes(h('door', 1)), 0.4, 'the push on the door');
  num('stairs', 0, /A step every (\d+) seconds/, P.stepS, 0.5, 'a step');
  num('stairs', 1, /It has (\d+) steps to go/, T.steps - (P.towerWater(ocSC('stairs', 1, 2.0)) - T.sill) / T.rise, 1.0, 'the steps the sea has left');
  num('ship', 1, /Yours is (\d+) metres down/, P.boatDepth(ocSC('ship', 1, 0.3)), 0.6, 'your boat\'s depth');
  num('ship', 2, /It needs (\d+) minutes/, P.shipMin, 0.7, 'the ship\'s time to you');
  num('ice', 0, /about (\d+) metres/, P.iceM, 0, 'all the ice melted');
  num('ice', 0, /In (\d+) minutes/, (P.iceM - h('ice', 0, 2.5)) / (P.rate * 60), 0.5, 'minutes to 66 m');
  num('hill', 1, /there, (\d+) km away/, OC_F.hill.d / 1000, 0, 'the hill');
  // what the captions claim about the moment
  if (!(h('start', 0) < 0.25)) fail('start:0: the tide should be turning now');
  if (!(h('lichen', 0) > 3.6)) fail('lichen:0: the sea over the orange lichen (it grows up to 3.6 m)');
  if (!(h('world', 1) > P.lowZone && h('world', 1) < P.lowZone + 0.2)) fail('world:1: the sea just past 10 m');
  if (!(h('island', 0) > T.base)) fail('island:0: the rock is under');
  if (!(h('door', 0) > T.sill && h('door', 0) < T.sill + T.door.h)) fail('door:0: the sea at the door as you bolt it');
  if (!(ocSC('dark', 0) > E.dark)) fail('dark:0: the lights are out');
  if (!(P.range(T.lamp - h('hill', 1), OC_F.hill.h - h('hill', 1) + 1.6) > OC_F.hill.d / 1000)) fail('hill:1: she can see the light from the hill');
  if (!(h('watch', 0) > T.watch)) fail('watch:0: the watch room floods');
  if (!(h('gallery', 0) < T.top && h('gallery', 0) > T.top - 0.5)) fail('gallery:0: the sea just under the gallery');
  if (!(h('lamp', 1) > T.lamp + 0.4)) fail('lamp:1: the lamp under the water');
  if (!(h('roof', 0) > T.eave + 0.25)) fail('roof:0: the sea over the lantern\'s eave, at your boots');
  // the texts sit on phone shots (shots.js checks it), and arrive in order
  for (let i = 1; i < OC_TEXTS.length; i++) if (!(OC_TEXTS[i][0] > OC_TEXTS[i - 1][0])) fail('OC_TEXTS out of order at ' + i);
  if (bad.length) throw new Error('script.js: ' + bad.join(' · '));
  return out;
})();

CONFIG.duration = OC.end;
CONFIG.seed = 20270915;
Object.assign(CONFIG.camera, { cameraHeight: 1.63, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 50, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;

const SCRIPT = {
  meta: { title: 'What if the ocean kept rising and couldn\'t stop?', wav: 'ocean-rising-soundtrack.wav' },
  events: [],                                            // (filled from the shots by shots.js)
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.63]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 50]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: {
    title: { in: OC.title[0], out: OC.title[1], fi: 0.25, fo: 0.4, cls: 'big center', html: '<span class="kick">WHAT IF THE OCEAN</span><span class="hero">KEPT RISING</span><span class="kick k2">AND COULDN’T STOP?</span>' },
    captions: [],
    readouts: [],
  },
};
const SCRIPT_TRACKS = {};
