/* =====================================================================
   PHYSICS — every number in "What if everything kept shrinking and couldn't stop?" (classic script: globals).
   THE RULE: at 6:49:00 AM (story τ = 0) everything except you starts shrinking towards the tent (EK_P) like a scale
   model: the same shapes, the same materials, the same density. Every 30 seconds it is half the size it was:
       s(τ) = 2^(−τ / 30)            (the world's scale; you stay 1)
   Everything here follows from s, with the textbook values below. Captions quote these numbers; script.js refuses
   to run if a caption drifts from them.
     gravity     at the same density, the pull at a planet's surface is proportional to its radius:
                 g = (4/3)·π·G·ρ·R, so g(τ) = 9.81·s m/s²: your weight is 75·s kg; escape speed 11,186·s m/s
     sound       an object of the same shape and material rings at a frequency ∝ 1 / its size: half the size, an
                 octave up; Leo's voice (275 Hz) is above your hearing (17 kHz, an adult's) once 275/s > 17,000
     the air     the atmosphere shrinks with the rest (scale height 8.4 km → 8.4·s km): the air above your eyes,
                 exp(−h / (8,400·s)); the cold with height: 6.5 °C a kilometre (the standard atmosphere)
     the view    your eyes 1.66 m above the meadow are, to the world, 1.66 / s metres up: you see the sunrise first
                 (the horizon dips by √(2h/R)); your shadow runs out from your feet for (1.78/s) / tan(Sun's altitude)
     the Earth   6,371 km · s in radius; its mass 5.972 × 10²⁴ · s³ kg (75 kg, your mass, when 14.8 cm in radius)
   ===================================================================== */

const EKP = (() => {
  const P = {
    half: 30,                // s: everything halves in size
    you: { h: 1.78, eye: 1.66, kneelEye: 1.18, hand: 1.08, mass: 75, waist: 1.05 },
    leo: { h: 1.16, f0: 275, age: 6 },   // a six-year-old: 116 cm, his voice's fundamental ~275 Hz
    hear: 17000,             // Hz: the top of an adult's hearing
    youVoice: 120,           // Hz: your voice's fundamental (an adult)
    infra: 20,               // Hz: below this, a sound is felt, not heard
    g0: 9.81, R: 6371000, M: 5.972e24, rho: 5514, vesc0: 11186, G: 6.674e-11,
    H: 8400,                 // m: the air's scale height
    lapse: 6.5,              // °C per km
    dawnT: 5,                // °C at the lake at dawn (late August)
    jump: 3.0,               // m/s: a standing jump's take-off speed
    plane: { alt: 11000, len: 39.5, v: 250 },   // a Boeing 737-800 at cruise (m above the sea, m, m/s)
    moonR: 1737400, moonD: 384400000,
    grain: 0.001, lightLimit: 4e-7,             // m: a grain of sand; smaller than light can show (violet light's wavelength)
    valleyLow: 100,          // Hz: the valley's deepest steady sound (the outflow over its rocks, the wind in the spruce)
    peaksH: 1500,            // m: the peaks round the lake, above it (the cirque's crest: 1,300–1,800 m)
    bird: [2500, 9500], whistle: [9500, 16000],   // Hz: what a voice that high sounds like (songbirds sing up to ~9.5 kHz)
  };
  P.sAt = (tau) => (tau <= 0 ? 1 : Math.pow(2, -tau / P.half));
  P.tauAt = (s) => -P.half * Math.log2(s);                      // story time when the scale is s
  P.weight = (tau) => P.you.mass * P.sAt(tau);                  // kg (what a bathroom scale would read)
  P.tallToThem = (tau) => P.you.h / P.sAt(tau);                 // m: your height in the world's metres
  P.leoH = (tau) => P.leo.h * P.sAt(tau);                       // m: Leo's height to you
  P.octaves = (tau) => Math.log2(1 / P.sAt(tau));               // how far up every sound of the world has gone
  P.leoF = (tau) => P.leo.f0 / P.sAt(tau);                      // Hz: his voice, to you
  P.youF = (tau) => P.youVoice * P.sAt(tau);                    // Hz: your voice, to them
  P.vesc = (tau) => P.vesc0 * P.sAt(tau);                       // m/s
  P.earthD = (tau) => 2 * P.R * P.sAt(tau);                     // m
  P.earthMass = (tau) => P.M * Math.pow(P.sAt(tau), 3);         // kg
  P.airAbove = (h, tau) => Math.exp(-h / (P.H * P.sAt(tau)));   // the fraction of the air above a height h (m) of yours
  P.toThem = (h, tau) => h / P.sAt(tau);                        // a height of yours, in the world's metres
  P.tempAt = (hThem) => P.dawnT - P.lapse * hThem / 1000;      // °C at a height (world metres) above the lake
  // the horizon's dip for an eye h (world metres) above the ground (rad), and the shadow of you (world metres)
  P.dip = (hThem) => Math.sqrt(2 * hThem / P.R);
  P.shadow = (tau, altDeg) => P.tallToThem(tau) / Math.tan(Math.max(0.05, altDeg) * Math.PI / 180);
  // when Earth is as heavy as you: (4/3)πr³ρ = 75 kg
  P.rYouMass = Math.cbrt(P.you.mass / (P.rho * 4 / 3 * Math.PI));
  P.tauYouMass = P.tauAt(P.rYouMass / P.R);
  // when the Earth is a given diameter (m)
  P.tauEarthD = (d) => P.tauAt(d / (2 * P.R));
  // the escape speed equals a jump; equals 0.1 m/s (a flick of your toes)
  P.tauJump = P.tauAt(P.jump / P.vesc0);
  P.tauHold = P.tauAt(0.1 / P.vesc0);
  // Leo's voice goes above your hearing
  P.tauSilent = P.tauAt(P.leo.f0 / P.hear);
  // the plane at your kneeling eye height (the meadow is EK_F.asl above the sea)
  P.tauPlane = (asl) => P.tauAt(P.you.kneelEye / (P.plane.alt - asl));
  // the Sun from your eye: its apparent altitude (refraction lifts it ~0.5° at the horizon: the same rule as the
  // shader's) against the skyline towards it (the ranges to the east-north-east, then the curve of the Earth)
  P.refr = (alt) => alt + 0.55 * ekSmooth(4, -0.5, alt);
  P.skyline = (h, az) => {
    const dx = Math.sin(az * Math.PI / 180), dz = -Math.cos(az * Math.PI / 180), R = 6371000 + 1890; let best = -90;
    for (let d = 40; d < 400000; d *= 1.045) { const y = ekGroundY(dx * d, dz * d) - d * d / (2 * R); const e = Math.atan2(y - h, d); if (e > best) best = e; }
    return best * 180 / Math.PI;
  };
  P.sunClear = (tau, eye = P.you.eye) => { const sp = ekSunAt(tau); return P.refr(sp.alt) + 0.27 - P.skyline(eye / P.sAt(tau), sp.az); };   // > 0: its top edge is up
  P.tauSunrise = (() => { let a = 150, b = 340; for (let k = 0; k < 24; k++) { const m = (a + b) / 2; if (P.sunClear(m) > 0) b = m; else a = m; } return (a + b) / 2; })();
  P.meadowSun = P.sunClear(0, 0) - 0.27;                          // the Sun from the meadow at 6:49 (° under its skyline)
  // the deepest sound of the valley goes above your hearing
  P.tauQuiet = P.tauAt(P.valleyLow / P.hear);
  return P;
})();
