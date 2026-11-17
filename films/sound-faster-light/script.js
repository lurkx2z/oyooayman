/* =====================================================================
   SCRIPT — "What if sound travelled faster than light?" (16:9, 1920×1080, 30 fps, voiceless).
   ★ The edit is built AROUND THE CAPTIONS (window.SFT, written by build-timing.cjs from CAPTIONS.md); the story clock
   (clock.js) and everything that moves (physics.js) are placed on them. This file checks that every caption that names
   a moment sits on it (the clock only runs forward: there is no second chance) and that every number in a caption is
   the one physics.js gives; then it configures the engine.
   ===================================================================== */

// ---------------------------------------------------------------------------------------------------------------------
// THE CHECKS (they throw: the page shows the error instead of a film that says something untrue)
// ---------------------------------------------------------------------------------------------------------------------
const SF_CHECKS = (() => {
  const out = [], bad = [];
  const fail = (m) => bad.push(m);
  // a caption must come up between lo and hi film seconds after story moment s is on screen
  const near = (id, k, s, lo, hi, what) => { const d = sfC(id, k) - sfFilmAt(s); out.push([`${id}:${k}`, what, d]); if (d < lo || d > hi) fail(`caption ${id}:${k} shows ${d.toFixed(2)} s after ${what} (want ${lo}…${hi})`); };
  const E = SFE, P = SFP, Q = SF_PLACES, key = (k) => SF_STRIKES.find((q) => q.key === k);
  const you = (s) => { const a = SFY.at(s); return [a.x, a.z]; };
  near('start', 0, 0, 0.1, 1.0, 'sound goes faster than light');
  near('flash', 1, key('flash3').s, 0.2, 0.9, 'the strike 3 km away');
  near('rumble', 0, key('long').s, 0.8, 2.5, 'the 6 km bolt');
  near('call', 1, E.call, 0.3, 3.5, 'you call her name');
  near('answer', 0, E.answer, 0.6, 2.0, 'she calls back');
  near('siren', 0, E.siren, 0.8, 2.5, 'the sirens start');
  near('tornado', 0, E.tornado, 0.8, 2.5, 'the flash that shows the tornado');
  near('strike', 0, E.yardHit, 0.2, 1.0, 'lightning hits the yard light');
  near('neighbour', 0, E.hansen, 0.5, 3.0, 'the tornado on the Hansen farm');
  near('found', 0, E.found, 0.0, 0.6, 'the flash that shows her');
  // the numbers
  const num = (id, k, re, v, tol, what) => { const m = re.exec(sfCap(id, k).text); if (!m) { fail(`caption ${id}:${k}: no number for ${what}`); return; } const x = parseFloat(m[1].replace(/,/g, '').replace('−', '-')); out.push([`${id}:${k}`, what, x, v]); if (Math.abs(x - v) > tol) fail(`caption ${id}:${k} says ${x}, physics says ${(+v).toFixed(4)} (${what})`); };
  const is = (cond, msg) => { if (!cond) fail(msg); };
  { const c = sfClockParts(sfSC('start', 0)); is(c.h === 8 && c.m === 52 && c.pm, `start:0 says 8:52 PM: the clock says ${c.h}:${c.m}`); }
  num('start', 1, /at ([\d.]+) million km/, P.c1 / 1e9, 0, 'the new speed of sound (million km/s)');
  num('start', 2, /^([\d]+) thunderclaps/, P.inAir, 0, 'strikes whose thunder was in the air at 8:52:00');
  num('flash', 0, /at ([\d.]+) m\/s/, P.c0, 0.5, 'the speed of sound in 20 °C air');
  num('flash', 0, /: ([\d.]+) seconds for every/, P.sPerKm, 0.1, 'seconds per kilometre');
  num('rule', 0, /be ([\d.]+) million times stiffer/, Math.floor(P.stiff / 1e6), 0, 'air stiffness needed / steel (millions)');
  num('rumble', 0, /That one was ([\d.]+) km long/, SFP.longBolt.len / 1000, 0.1, 'the bolt\'s channel');
  num('rumble', 0, /roll on for ([\d.]+) seconds/, SFP.longBolt.rumble, 0.3, 'its rumble at 343 m/s');
  num('ears', 0, /up to ([\d.]+) thousandths/, P.itd0 * 1000, 0.01, 'the gap between your ears before (ms)');
  num('ears', 1, /it's ([\d.]+) billionths/, P.itd1 * 1e9, 0.05, 'the gap now (ns)');
  num('ears', 1, /: ([\d,]+) times too short/, P.itdTimes, 600, 'the smallest gap a brain uses over the gap now');
  num('ears', 2, /now ([\d,]+) km long/, P.voiceLambda / 1000, 40, 'her voice\'s wavelength');
  num('far', 0, /horn ([\d.]+) km away/, sfDist(you(E.train), SF_F.rail) / 1000, 0.3, 'the railway crossing');
  num('far', 1, /dogs, ([\d.]+) km away/, sfDist(you(sfSC('far', 1)), Q.hansen) / 1000, 0.05, 'the Hansen farm');
  num('siren', 0, /in town, ([\d.]+) km away/, sfDist(you(E.siren), SF_F.town) / 1000, 0.3, 'the town');
  num('tornado', 0, /tornado, ([\d.]+) km west/, sfDist(you(E.tornado), SFN.at(E.tornado)) / 1000, 0.15, 'the tornado when you see it');
  { const b = sfBearing(you(E.tornado), SFN.at(E.tornado)); is(b > 225 && b < 300, `tornado:0 says west: bearing ${b.toFixed(0)}°`); }
  num('phone', 2, /she's ([\d.]+) metres into/, sfDist(you(sfSC('phone', 2)), Q.kid), 2, 'you to her phone');
  { const b = sfBearing(you(sfSC('phone', 3)), Q.kid); is(b > 240 && b < 300, `phone:3 says west: bearing ${b.toFixed(0)}°`); const bt = sfBearing(you(sfSC('phone', 3)), SFN.at(sfSC('phone', 3))); is(Math.abs(b - bt) < 25, `phone:3 says towards the tornado: ${b.toFixed(0)}° vs ${bt.toFixed(0)}°`); }
  num('corn', 0, /It's ([\d.]+) metres tall/, P.cornH, 0, 'the corn');
  num('corn', 2, /She's ([\d.]+) metres away/, sfDist(you(sfSC('corn', 2)), Q.kid), 3, 'you to her');
  num('wind', 0, /at ([\d.]+) km\/h/, P.inflow, 0, 'the inflow');
  num('neighbour', 0, /farm, ([\d.]+) km west/, sfDist(you(sfSC('neighbour', 0)), Q.hansen) / 1000, 0.05, 'the Hansen farm');
  num('found', 0, /raincoat, ([\d.]+) metres away/, sfDist(you(sfSC('found', 0)), Q.kid), 0.5, 'you to her');
  num('back', 0, /cellar is ([\d.]+) metres/, sfDist(you(sfSC('back', 0)), [SF_F.cellar.x, SF_F.cellar.z]), 3, 'you to the storm cellar');
  num('back', 0, /that's ([\d.]+) seconds/, sfDist(you(sfSC('back', 0)), [SF_F.cellar.x, SF_F.cellar.z]) / P.carryV, 1, 'carrying her to the cellar (s)');
  { const s1 = sfSC('back', 1); num('back', 1, /the cellar in ([\d.]+)/, (sfDist(SFN.at(s1), [SF_F.cellar.x, SF_F.cellar.z]) - SFN.r(s1)) / P.tornadoV, 1.5, 'its winds to the cellar (s)'); }
  if (bad.length) throw new Error('script.js: ' + bad.join(' · '));
  return out;
})();

CONFIG.duration = SF.end;
CONFIG.seed = 20270724;
Object.assign(CONFIG.camera, { cameraHeight: 1.7, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 50, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;

const SCRIPT = {
  meta: { title: 'What if sound travelled faster than light?', wav: 'sound-faster-light-soundtrack.wav' },
  events: [],                                            // (filled from the shots by shots.js)
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.7]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 50]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: {
    title: { in: SF.title[0], out: SF.title[1], fi: 0.25, fo: 0.4, cls: 'big center', html: '<span class="kick">WHAT IF SOUND TRAVELLED</span><span class="hero">FASTER</span><span class="kick k2">THAN LIGHT?</span>' },
    captions: [],
    readouts: [],
  },
};
const SCRIPT_TRACKS = {};
