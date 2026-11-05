/* =====================================================================
   PHYSICS — "What if light stopped bouncing for 10 seconds?" Every number on screen comes from here.
   STORY time s: seconds after Saturday 21 November 2026, 3:30:00.000 PM, on a hilltop funfair in southern England
   (latitude 51.5° N; the Sun 3.8° up in the south-west, a waxing gibbous Moon rising in the east, Saturn near it).
   THE RULE: from s = 0 to s = 10, nothing anywhere reflects or scatters light, of any colour (radio to X-rays). A photon
   either goes straight on (through air, glass, water, the lens of your eye: refraction stays) or is absorbed.
   Everything that MAKES light carries on: the Sun, stars, flames, filaments, LEDs, neon, screens.
   THE ONE IMPOSSIBLE THING: reflection, scattering, refraction and absorption are all the same electrons shaking in
   step with the light; there is no switch for one of them. That is what the film breaks, and nothing else.
   What follows (each in its function or note below):
     what you see          only light sources; everything else is pure black (no light comes off it). Things show only
                           as shapes against sources: a person crossing a bulb, the hills cutting off the stars
     the sky               Rayleigh scattering makes the sky blue (∝ 1/λ⁴: 450 nm scatters 4.3× more than 650 nm). Off:
                           the sky is black and the stars show at 3:30 PM. The low Sun (3.8° up, through ~11 air masses)
                           lost its blue to scattering: now it arrives whole: white, about 3× brighter
     light-time            light already bounced before 3:30 is still on its way: the Moon (1.28 light-seconds) shines
                           on for 1.28 s, then goes; it comes back 1.28 s after everything else. Saturn (72 light-minutes)
                           shines on through the whole ten seconds, and goes out for ten seconds at 4:42:10 PM
     your pupils           in the dark they open from about 2.5 mm towards 7 mm over seconds (×5 the light by s = 10:
                           more stars appear); when light returns you are dazzled until they close (about half a second)
     glass fibres          light is kept inside a fibre by total internal reflection (a bounce): every fibre goes dark,
                           and with it the internet's ~600 undersea cables (≈ 99% of traffic between continents)
     lasers                a laser is light bouncing between two mirrors (or a diode's two facets): every laser stops
     driving               ~1.45 billion cars, ~4% of them moving at any moment: ~60 million drivers see only lights.
                           At 110 km/h ten seconds is 306 m
     heat                  everything absorbs what it used to reflect: Earth's albedo 0.30 → 0 for ten seconds:
                           0.30 × 1361 W/m² × πR² × 10 s = 5.2 × 10¹⁷ J (≈ 8,000 Hiroshima bombs, 63 TJ each), spread
                           over the day side: a white shirt in the low Sun warms by a fraction of a degree
   ===================================================================== */

const NBP = {
  T: 10,                                  // s: how long nothing bounces
  C: 299792.458,                          // km/s
  moonKm: 384400,
  saturnS: 4330,                          // light-seconds, Earth → Saturn, late November 2026 (≈ 72.2 min)
  sunAlt: 3.8, sunAz: 230,                // degrees (3:30 PM, 21 Nov, 51.5° N)
  rayleigh: Math.pow(650 / 450, 4),       // 4.35: blue scatters this much more than red
  sunBoost: 3.0,                          // the low Sun without scattering (11 air masses): about 3× (green), white
  cars: 1.45e9, moving: 0.04,             // cars in the world; the share moving at any moment (rough)
  motorway: 110 / 3.6,                    // m/s
  cables: 600, cableShare: 0.99,
  albedo: 0.30, solar: 1361, earthR: 6.371e6,
  hiroshima: 6.3e13,                      // J
  pupil0: 2.5, pupil1: 7.0, pupilTau: 4.0,  // mm, mm, s (opening in the dark; rough)
};
NBP.moonS = NBP.moonKm / NBP.C;                                   // 1.282 s
NBP.driversNow = NBP.cars * NBP.moving;                            // 58 million
NBP.blindM = NBP.motorway * NBP.T;                                 // 306 m
NBP.extraJ = NBP.albedo * NBP.solar * Math.PI * NBP.earthR * NBP.earthR * NBP.T;   // 5.2e17 J
NBP.bombs = NBP.extraJ / NBP.hiroshima;                            // ≈ 8,300
NBP.sEcho = NBP.saturnS;                                           // Saturn goes out at 4:42:10 PM…
NBP.sEchoEnd = NBP.saturnS + NBP.T;                                // …for ten seconds

// does light bounce at story time s? (1 = as always, 0 = not at all)
NBP.bounce = (s) => (s >= 0 && s < NBP.T ? 0 : 1);
// is the Moon lit, as you see it (its light is 1.28 s old)?
NBP.moonOn = (s) => !(s >= NBP.moonS && s < NBP.T + NBP.moonS);
// is Saturn lit, as you see it (72 minutes old)?
NBP.saturnOn = (s) => !(s >= NBP.sEcho && s < NBP.sEchoEnd);
// your pupil's diameter (mm): it opens in the dark, closes fast when light comes back (0.5 s)
NBP.pupil = (s) => {
  const P = NBP, open = (u) => P.pupil1 - (P.pupil1 - P.pupil0) * Math.exp(-u / P.pupilTau);
  if (s < 0) return P.pupil0;
  if (s < P.T) return open(s);
  const d0 = open(P.T); return P.pupil0 + (d0 - P.pupil0) * Math.exp(-(s - P.T) / 0.18);
};
// how much more light gets in than in daylight (pupil area)
NBP.pupilGain = (s) => Math.pow(NBP.pupil(s) / NBP.pupil0, 2);
// the faintest star you can see (magnitude): about 1.2 with daylight-adapted eyes as the sky goes, +2.5 log₁₀ of the
// pupil's gain, plus the first seconds of the eye's own adaptation (rough)
NBP.limMag = (s) => (s < 0 ? -5 : 1.2 + 2.5 * Math.log10(NBP.pupilGain(s)) + 0.9 * (1 - Math.exp(-Math.max(0, Math.min(s, NBP.T)) / 6)));

// the clock, h:m:s (s = 0 is 3:30:00.000 PM)
function nbClockParts(s) {
  const T = 15 * 3600 + 30 * 60 + s, ms = Math.floor((((T % 1) + 1) % 1) * 1000 + 1e-6), sec = Math.floor(T) % 60, mi = Math.floor(T / 60) % 60, h24 = Math.floor(T / 3600) % 24;
  return { day: 'SATURDAY', h: ((h24 + 11) % 12) + 1, m: mi, sec, ms, pm: h24 >= 12 };
}

if (typeof module !== 'undefined') module.exports = { NBP };
