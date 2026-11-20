/* =====================================================================
   SCRIPT — "What if the air got 1% thinner every minute?" (16:9, 1920×1080, 30 fps, voiceless).
   ★ The edit is built AROUND THE CAPTIONS (window.ATT, written by build-timing.cjs from CAPTIONS.md); the story clock
   (clock.js) and everything that moves (physics.js) are placed on them. This file checks that every caption that names
   a moment sits on it (the clock only runs forward: there is no second chance), that every clock time a caption reads
   is the one on the HUD's clock, and that every number in a caption is the one physics.js gives; then it configures
   the engine.
   ===================================================================== */

// ---------------------------------------------------------------------------------------------------------------------
// THE CHECKS (they throw: the page shows the error instead of a film that says something untrue)
// ---------------------------------------------------------------------------------------------------------------------
const AT_CHECKS = (() => {
  const out = [], bad = [];
  const fail = (m) => bad.push(m);
  const P = ATP, E = ATE;
  // a caption must come up between lo and hi film seconds after story moment s is on screen
  const near = (id, k, s, lo, hi, what) => { const d = atC(id, k) - atFilmAt(s); out.push([`${id}:${k}`, what, d]); if (d < lo || d > hi) fail(`caption ${id}:${k} shows ${d.toFixed(2)} s after ${what} (want ${lo}…${hi})`); };
  near('start', 0, 0, 0.0, 0.8, 'the first 1% goes');
  near('storm', 0, E.tip, 0.3, 2.2, 'the barometer drops below Typhoon Tip');
  near('cabin', 2, E.balloonPop, 0.3, 2.2, 'her balloon bursts');
  near('engines', 0, E.half, 0.4, 2.4, 'half the air is gone');
  near('engines', 1, E.blackout, 0.3, 2.2, 'the power fails');
  near('dive', 1, E.roll, -1.8, -0.6, 'you roll in');
  near('everest', 0, E.everest, 0.3, 2.0, 'the air is as thin as on Everest');
  near('rise', 0, E.letGo, -0.2, 0.6, 'she lets go');
  near('rise', 2, E.catch, -0.6, 0.2, 'you catch her fin');
  near('tubs', 0, E.tub, 0.5, 3.0, 'the hot tubs start to boil');
  near('tubs', 1, E.body, 0.2, 2.0, 'water at body temperature boils');
  near('sea', 0, E.pool, 0.5, 3.0, 'the pool starts to boil');
  near('sea', 1, E.sea, 0.5, 3.0, 'the ocean starts to boil');
  // every clock time a caption reads (h:mm, AM/PM optional) must be the HUD clock's while it's up
  for (const g of ATT.groups) g.caps.forEach((c, k) => {
    const re = /\b(\d{1,2}):(\d{2})(?:\s?(AM|PM))?\b/g; let m;
    while ((m = re.exec(c.text))) {
      if (/at \d{1,2}:\d{2} (this afternoon|tonight)/.test(c.text.slice(Math.max(0, m.index - 3), m.index + 30))) continue;   // (a forecast, checked below)
      const cp = atClockParts(atSC(g.id, k, 0.3)); out.push([`${g.id}:${k}`, 'clock', m[0], `${cp.h}:${cp.m}`]);
      if (+m[1] !== cp.h || +m[2] !== cp.m || (m[3] && (m[3] === 'PM') !== cp.pm)) fail(`caption ${g.id}:${k} reads ${m[0]}, the clock says ${cp.h}:${String(cp.m).padStart(2, '0')}`);
    }
  });
  // forecasts
  const hm = (s) => { const c = atClockParts(s); return `${c.h}:${String(c.m).padStart(2, '0')}`; };
  if (!atCap('boil', 0).text.includes(`boil at ${hm(E.sea)} this afternoon`)) fail(`boil:0: the sea boils at ${hm(E.sea)}`);
  if (!atCap('last', 0).text.includes(`runs out at ${hm(ATK.out)} tonight`)) fail(`last:0: the last tank runs out at ${hm(ATK.out)}`);
  // the numbers
  const num = (id, k, re, v, tol, what) => { const m = re.exec(atCap(id, k).text); if (!m) { fail(`caption ${id}:${k}: no number for ${what}`); return; } const x = parseFloat(m[1].replace(/,/g, '')); out.push([`${id}:${k}`, what, x, v]); if (Math.abs(x - v) > tol) fail(`caption ${id}:${k} says ${x}, physics says ${v.toFixed(3)} (${what})`); };
  num('start', 0, /([\d,]+) km from land/, P.kmToLand, 50, 'the nearest land');
  num('start', 0, /got (\d+)% thinner/, (1 - P.k) * 100, 1e-6, 'each step');
  num('weight', 0, /: ([\d.]+) tonnes/, P.tonnes, 0.5, 'the air over a square metre');
  num('weight', 2, /like climbing ([\d.]+) metres/, P.climb1, 1, 'the first 1% as height');
  num('stairs', 2, /is (\d+) decks down/, 15 - 2, 0, 'deck 15 to deck 2');
  num('tanks', 0, /on deck (\d+)/, 2, 0, 'the dive shop');
  num('tanks', 2, /under (\d+) metres of sea/, P.oneAtmDepth, 0.2, 'the sea that weighs as much as the whole sky');
  num('tanks', 3, /have (\d+) full tanks/, P.tanks, 0, 'tanks');
  num('down', 0, /stairs: (\d+) decks down/, 15 - 2, 0, 'deck 15 to deck 2');
  num('marina', 0, /thin as ([\d,]+) metres/, P.altAt(atSC('marina', 0)), 60, 'like how high at 11:20');
  num('dive', 0, /all (\d+) tanks/, P.tanks, 0, 'tanks');
  num('under', 0, /^(\d+) metres down/, AT_F.depth, 0.15, 'your depth');
  num('under', 2, /you, ([\d,]+) people/, P.passengers + P.crew, 0, 'people on board');
  num('rise', 1, /pass out in (\d+) seconds/, P.tucS, 0, 'time of useful consciousness at ~45,000 ft');
  num('tubs', 0, /only (\d+) °C/, P.tubC, 0, 'the hot tubs');
  num('stars', 1, /Only (\d+)% of the air/, P.air(atSC('stars', 1)) * 100, 0.5, 'the air left at 3:00');
  // what the captions claim about the moment
  if (!(P.air(atSC('engines', 0, 0.3)) < 0.5)) fail('engines:0: half the air is gone');
  if (!(P.altAt(atSC('cabin', 0, 0.3)) >= P.cabinAlt)) fail('cabin:0: as thin as an airliner cabin');
  if (!(P.hpa(atSC('storm', 0, 0.3)) < P.tip)) fail('storm:0: below Typhoon Tip');
  if (!(P.altAt(atSC('everest', 0, 0.3)) >= P.everest)) fail('everest:0: as thin as Everest');
  if (!(P.altAt(atSC('oxygen', 0, 0.3)) >= P.o2Limit)) fail('oxygen:0: pure oxygen not enough');
  if (!(P.altAt(atSC('rise', 1, 0.3)) >= P.o2Limit)) fail('rise:1: 15 seconds up there');
  if (!(P.hpa(atSC('tubs', 1, 0.3)) < P.pvap(P.bodyC))) fail('tubs:1: body temperature boils');
  if (!(P.hpa(atSC('sea', 2, 0.3)) < P.pvap(P.seaC) && P.seaBar(AT_F.depth) * 1000 > P.pvap(P.seaC))) fail('sea:2: only the top boils');
  if (!(ATE.youOut > ATE.roll)) fail('marina: you would pass out before you went in');
  if (bad.length) throw new Error('script.js: ' + bad.join(' · '));
  return out;
})();

CONFIG.duration = AT.end;
CONFIG.seed = 20271113;
Object.assign(CONFIG.camera, { cameraHeight: 1.63, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 50, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;

const SCRIPT = {
  meta: { title: 'What if the air got 1% thinner every minute?', wav: 'air-thinner-soundtrack.wav' },
  events: [],                                            // (filled from the shots by shots.js)
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.63]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 50]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: {
    title: { in: AT.title[0], out: AT.title[1], fi: 0.25, fo: 0.4, cls: 'big center', html: '<span class="kick">WHAT IF THE AIR GOT</span><span class="hero">1% THINNER</span><span class="kick k2">EVERY MINUTE?</span>' },
    captions: [],
    readouts: [],
  },
};
const SCRIPT_TRACKS = {};
