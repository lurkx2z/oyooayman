/* =====================================================================
   SCRIPT — "What if everything kept shrinking and couldn't stop?" (16:9, 1920×1080, 30 fps, voiceless).
   ★ The edit is built AROUND THE CAPTIONS (window.EKT, written by build-timing.cjs from CAPTIONS.md); the story clock
   (clock.js) is placed on them. This file checks that every caption that names a moment sits on it and that every
   number in a caption is the one physics.js gives (the page shows the error instead of a film that says something
   untrue); then it configures the engine.
   ===================================================================== */

const EK_CHECKS = (() => {
  const out = [], bad = [];
  const fail = (m) => bad.push(m);
  const P = EKP, at = (id, k) => ekSC(id, k);
  const num = (id, k, re, v, tol, what) => {
    const m = re.exec(ekCap(id, k).text); if (!m) { fail(`caption ${id}:${k}: no number for ${what}`); return; }
    const x = parseFloat(m[1].replace(/,/g, '')); out.push([`${id}:${k}`, what, x, v]);
    if (Math.abs(x - v) > tol) fail(`caption ${id}:${k} says ${x}, physics says ${(+v).toFixed(4)} (${what})`);
  };
  const is = (cond, msg) => { if (!cond) fail(msg); out.push(['is', msg, !!cond]); };
  const inR = (v, a, b, msg) => is(v >= a && v <= b, `${msg}: ${(+v).toFixed(3)} (want ${a}…${b})`);
  { const c = ekClockParts(at('start', 0)); is(c.h === 6 && c.m === 49 && !c.pm, `start:0 says 6:49 AM: the clock says ${c.h}:${c.m}`); }
  num('start', 1, /Every ([\d]+) seconds it halves/, P.half, 0, 'the halving time');
  is(at('start', 0) >= 0 && at('start', 0) < 6, 'start:0 just after 6:49:00');
  num('voice', 1, /already ([\d]+) octaves/, P.octaves(at('voice', 1)), 0.25, 'octaves up');
  num('weight', 1, /You weigh ([\d.]+) kg/, P.weight(at('weight', 1)), 0.25, 'your weight (kg)');
  num('neighbours', 1, /you're ([\d]+) metres tall/, P.tallToThem(at('neighbours', 1)), 0.5, 'your height to them (m)');
  is(P.youF(at('rumble', 0)) < P.infra, `rumble:0: your voice to them ${P.youF(at('rumble', 0)).toFixed(1)} Hz is below hearing`);
  inR(P.leoF(at('hush', 0)), P.bird[0], P.bird[1], 'hush:0 his voice sounds like a bird (Hz)');
  inR(P.leoF(at('hush', 1)), P.whistle[0], P.whistle[1], 'hush:1 a whistle (Hz)');
  is(P.leoF(at('hush', 2)) > P.hear, `hush:2: his voice ${P.leoF(at('hush', 2)).toFixed(0)} Hz above your hearing`);
  is(at('quiet', 0) >= P.tauQuiet, `quiet:0: the valley's ${P.valleyLow} Hz at ${(P.valleyLow / P.sAt(at('quiet', 0))).toFixed(0)} Hz`);
  is(P.sunClear(at('sunrise', 0)) > 0, 'sunrise:0: the Sun is up for your eye');
  is(P.sunClear(at('sunrise', 0), 0) < -2, 'sunrise:0: the valley is still in the dark');
  is(P.tallToThem(at('shadow', 1)) > 1820, `shadow:1: you (${P.tallToThem(at('shadow', 1)).toFixed(0)} m to them) are taller than the highest peak (1,820 m)`);
  num('peaks', 1, /are ([\d,]+) metres high/, P.peaksH, 0, 'the peaks round the lake');
  inR(P.peaksH * P.sAt(at('peaks', 1)) / P.you.waist, 0.95, 1.05, 'peaks:1 the peaks / your waist');
  num('air', 0, /now ([\d.]+) km up/, P.toThem(P.you.hand, at('air', 0)) / 1000, 0.1, 'your hand, to him (km)');
  num('air', 0, /and ([\d]+) degrees below/, -P.tempAt(P.toThem(P.you.hand, at('air', 0))), 0.6, 'the cold up there (°C below 0)');
  num('escape', 0, /You weigh ([\d.]+) grams/, P.weight(at('escape', 0)) * 1000, 0.5, 'your weight (g)');
  is(P.vesc(at('escape', 0)) < P.jump, `escape:0: the escape speed ${P.vesc(at('escape', 0)).toFixed(2)} m/s is less than a jump`);
  num('plane', 0, /airliner, ([\d]+) km up/, P.plane.alt / 1000, 0, 'the airliner\'s height');
  num('plane', 0, /It's ([\d]+) millimetres long/, P.plane.len * P.sAt(at('plane', 0)) * 1000, 0.5, 'the airliner to you (mm)');
  inR((P.plane.alt - EK_F.asl) * P.sAt(at('plane', 0)) / P.you.kneelEye, 0.9, 1.1, 'plane:0 the airliner at your (kneeling) eyes');
  num('curve', 0, /is ([\d,]+) metres across/, P.earthD(at('curve', 0)), 20, 'the Earth (m)');
  is(P.airAbove(P.you.kneelEye, at('sky', 0)) < 0.01, `sky:0: the air above your eyes ${(100 * P.airAbove(P.you.kneelEye, at('sky', 0))).toFixed(2)} %`);
  { const c = ekClockParts(at('sky', 1)); is(c.h === 6 && c.m === 57, `sky:1 says 6:57: the clock says ${c.h}:${c.m}`); }
  is(P.vesc(at('lift', 0)) < 0.1, `lift:0: the escape speed ${P.vesc(at('lift', 0)).toFixed(3)} m/s`);
  inR(P.earthD(at('house', 0)), 8, 15, 'house:0 the Earth, a house (m)');
  inR(P.earthD(at('house', 1)), 3.5, 5.5, 'house:1 a car (m)');
  is(P.earthD(at('house', 2)) < P.you.h, 'house:2 smaller than you');
  num('ball', 0, /It's ([\d]+) cm across/, P.earthD(at('ball', 0)) * 100, 1, 'the Earth (cm)');
  num('ball', 0, /Its mass is now ([\d]+) kg/, P.earthMass(at('ball', 0)), 3, 'the Earth\'s mass (kg)');
  num('end', 1, /In ([\d]+) minutes, it'll be a grain/, (P.tauEarthD(P.grain) - at('end', 1)) / 60, 0.45, 'minutes to a grain of sand');
  num('end', 1, /In ([\d]+), too small for light/, (P.tauEarthD(P.lightLimit) - at('end', 1)) / 60, 0.5, 'minutes to smaller than light');
  if (bad.length) throw new Error('script.js: ' + bad.join(' · '));
  return out;
})();

CONFIG.duration = EK.end;
CONFIG.seed = 20270828;
Object.assign(CONFIG.camera, { cameraHeight: 1.66, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 50, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;

const SCRIPT = {
  meta: { title: 'What if everything kept shrinking and couldn\'t stop?', wav: 'everything-shrinking-soundtrack.wav' },
  events: [],                                            // (filled from the shots by shots.js)
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.66]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 50]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: {
    title: { in: EK.title[0], out: EK.title[1], fi: 0.25, fo: 0.4, cls: 'big center', html: '<span class="kick">WHAT IF EVERYTHING KEPT</span><span class="hero">SHRINKING</span><span class="kick k2">AND COULDN’T STOP?</span>' },
    captions: [],
    readouts: [],
  },
};
const SCRIPT_TRACKS = {};
