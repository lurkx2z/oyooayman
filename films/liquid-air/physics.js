/* =====================================================================
   PHYSICS — "What if the air turned into a breathable liquid for one hour?" Every number on screen comes from here or
   from column.js (build-column.cjs: the sky raining down, computed once). Story time s = seconds after 3:00:00 PM.
   THE RULE (PLAN.md § 1): from 3:00:00 the air turns into a clear liquid, the same amount every second (1/600 of the
   original: a growing share of what's left), all of it by 3:10:00; at 4:00:00 it turns back the same way, by 4:10:00. The liquid is at the air's temperature
   (15 °C), weighs 875 kg/m³ (liquid air's density) and holds oxygen you can breathe. Pure functions of s.
   ===================================================================== */

const LA_N_PHYS = 1.21;                              // liquid air's refractive index (N2 1.20, O2 1.22)
const LAP = {
  g: 9.81, P0: 101325, rhoL: 875, rhoAir: 1.225, T: 600, back: 3600,
  D: LA_COL.D,                                      // 11.80 m: the whole sky's weight, as this liquid
  ratio: 875 / 1.225,                               // 714: a litre of it is 714 litres of air
  armstrong: 6300 / (875 * 9.81),                   // 0.73 m: the top layer where the pressure is under 6.3 kPa (blood boils)
  bodyRho: 1060,                                    // you, with your lungs full of it
  floorY: 12.0,                                     // your floor (LA_ROOM.origin[1])
  carFloat: 0.7,                                    // the depth at which a parked car lifts off (≈ 60 cm of water floats most cars)
  airBreath: 3.0,                                   // litres of it in your lungs
};
LAP.weightK = (LAP.bodyRho - LAP.rhoL) / LAP.bodyRho;          // 0.175 of your weight is left (the Moon: 0.165)
LAP.you = 70 * LAP.weightK;                                     // 12 kg
LAP.margin = LAP.floorY - LAP.D;                                // 0.20 m between the surface and your floor
LAP.backL = LAP.airBreath * LAP.ratio;                          // 2,140 litres of air from your lungs

const laSm = (x, a, b) => { const u = MathX.clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
// column.js, interpolated
function laColAt(arr, s) { if (s <= 0) return arr[0]; const n = arr.length - 1; if (s >= n) return arr[n]; const i = Math.floor(s), u = s - i; return arr[i] + (arr[i + 1] - arr[i]) * u; }
// the depth of liquid on the street (m). From 4:00 it turns back: the level falls as the liquid fizzes away
function laDepth(s) { return s < LAP.back ? Math.max(0, laColAt(LA_COL.depth, s)) : LAP.D; }   // (the film ends 12 s into the fizz)
// the gas pressure at the street (atm); the share of the air turned (f); the share still falling (up)
const laP0 = (s) => (s < 0 ? 1 : laColAt(LA_COL.p0, s));
const laF = (s) => MathX.clamp(s / LAP.T, 0, 1);
const laUp = (s) => (s < 0 ? 0 : laColAt(LA_COL.up, s));
// the rain at the street: how fast the level rises (m/s), how fast what lands is falling (m/s)
const laRate = (s) => Math.max(0, (laDepth(s + 0.5) - laDepth(s - 0.5)));
const laVLand = (s) => laColAt(LA_COL.v, s);

// THE LIGHT. Drops scatter like a cloud: τ ≈ 1.5 · (mass of drops overhead) / (ρ · r), r ≈ 1 mm. In the first second
// there are already ~17 kg/m² overhead (a thundercloud holds 1 to 5): the sun is gone at once, and the day goes to
// dusk. Diffuse light through a thick cloud ≈ 1 / (1 + 0.75 τ (1 − g)), g ≈ 0.85 for drops. The film keeps it
// readable (exposure); PLAN.md § 2 has the real numbers.
const laTau = (s) => 1.5 * laUp(s) * (LAP.P0 / LAP.g) / (LAP.rhoL * 0.001);
const laSunK = (s) => Math.exp(-Math.min(60, laTau(s)));                                   // the direct sun (0 within 1 s)
const laDiffuse = (s) => 1 / (1 + 0.75 * laTau(s) * 0.15);                                  // the light through it
// how dark the outdoors reads on screen, 0 (day) … 1 (deep dusk): the film's exposure of laDiffuse
function laDusk(s) { if (s < 0) return 0; return MathX.clamp(Math.log10(1 / Math.max(1e-4, laDiffuse(s))) / 2.6, 0, 1); }
// the black sky: from 3:10:12 nothing is left up there (no air to scatter, no drops): the sun in a black sky with stars
const laBlack = (s) => laSm(s, 600, 612);
const laSunOut = (s) => (s < 600 ? laSunK(s) : laSm(s, 609, 613));

// THE CRASH (3:10:00–3:10:10): what's still falling lands in ten seconds (column.js); mean speed LA_COL.vCrash m/s
const LA_CRASH = { s0: 600, s1: LA_COL.sCrash[1], v: LA_COL.vCrash };

// SEALED THINGS. The gas inside keeps turning (its share left: 1 − f) and nothing replaces it, while the gas outside is
// pushed back in by the pressure of the rain above: a crisp packet (1 atm inside) shrinks from the first second; a
// football (1.8 atm) goes soft once 1.8 (1 − f) < p0 (≈ 3:04:30); tyres (3.2 atm): ≈ 3:06:40
function laSealed(s, pIn) { const f = laF(s), inside = pIn * (1 - f), out = laP0(s); return { inside, out, squash: MathX.clamp((out - inside) / Math.max(0.01, out), 0, 1) }; }
// your middle ears: sealed until you swallow; the gas behind your eardrums turns at 1/600 a second → 10 kPa a minute
const laEarKPa = (s) => 101.325 * MathX.clamp(s, 0, 600) / 600;

// THE CARS (parked; layout LA_ST cars): each lifts off at LAP.carFloat, drifts with the current, fills (minutes) and
// sinks. Two fill slowly (newer cars, good seals) and ride the surface up in the crash, then fill and sink. (None stays
// sealed: a cabin whose air has turned would have ~0 atm inside, and the windows would give.)
const LA_CARFLOAT = {};
LA_ST.bodies.filter((b) => b.kind === 'car').forEach((b, i) => {
  const r = hash1(i * 31 + 7), sealed = false; void sealed;
  LA_CARFLOAT[b.id] = { lift: 0, fill: 140 + 160 * r, sealed, drift: (hash1(i * 13 + 3) - 0.5) * 2, yaw: (hash1(i * 17 + 5) - 0.5) * 0.9 };
});
// the story second the level reaches d (bisect: the level only rises until 4:00)
function laSAtDepth(d) { let a = 0, b = 700; for (let k = 0; k < 40; k++) { const m = (a + b) / 2; if (laDepth(m) < d) a = m; else b = m; } return (a + b) / 2; }
LAP.sFloat = laSAtDepth(LAP.carFloat);                          // ≈ 3:05:15
for (const id in LA_CARFLOAT) LA_CARFLOAT[id].lift = LAP.sFloat + 4 * hash1(id.length * 7 + id.charCodeAt(3));
for (const id of ['car4', 'car6']) LA_CARFLOAT[id].fill = 650 + 25 * (id === 'car6') - LA_CARFLOAT[id].lift;
LA_CARFLOAT.car3.fill = 524 - LA_CARFLOAT.car3.lift; LA_CARFLOAT.car3.drift = 0.25;              // (the one the film watches go down, at 3:08:44)
// a car's pose: { x, y, z (offsets from its parked spot), yaw, roll } at s
function laCarState(id, s) {
  const C = LA_CARFLOAT[id], d = laDepth(s), out = { x: 0, y: 0, z: 0, yaw: 0, roll: 0, pitch: 0 };
  if (s < C.lift) return out;
  const u = s - C.lift, sink = C.sealed ? 0 : laSm(u, C.fill, C.fill + 40);
  // afloat: it rides with ~0.45 m under the surface line (its sills), bobbing; drifting slowly down the street
  const ride = Math.max(0, d - 0.45);
  out.y = ride * (1 - sink); out.x = C.drift * Math.min(18, u * 0.06) + 0.6 * Math.sin(u * 0.05 + C.yaw * 9); out.z = 0.4 * Math.sin(u * 0.04 + C.yaw * 4);
  out.yaw = C.yaw * laSm(u, 0, 120); out.roll = 0.04 * Math.sin(u * 0.7 + C.yaw * 5) * (1 - sink); out.pitch = 0.03 * Math.sin(u * 0.53 + C.drift) * (1 - sink) + 0.12 * sink * Math.sin(C.yaw * 7);
  return out;
}
const laLerpY = (a, b, k) => a + (b - a) * k;

// you: the level against your body (your eyes are at 1.62 m on the street); the breath you take
LAP.sWaist = laSAtDepth(0.95); LAP.sChin = laSAtDepth(1.5); LAP.sOver = laSAtDepth(1.66);

// THE FIZZ (4:00:00 on): 1/600 of it turns back every second; gas bubbles out of all of it (at the bottom,
// at 1 atm, 714 litres of gas from every litre over ten minutes: a gas flow up through the street of ~14 m/s)
const laFizz = (s) => laSm(s, LAP.back - 0.2, LAP.back + 1.2);

// the time on the clock: 3:mm:ss PM (s → parts)
function laClockParts(s) { const S = Math.floor(Math.max(-3599, s) + 3 * 3600); const h = Math.floor(S / 3600), m = Math.floor(S / 60) % 60, sec = S % 60; return { h: h > 12 ? h - 12 : h, m, sec }; }

// THE SUN: low in the west-north-west of the park side (−z, −x), 22° up; it shines in at your window. In the liquid
// it's refracted (n = 1.21): 68° from straight up outside is 50° inside, so the shafts come down steeper
const LA_SUN = (() => { const alt = 22 * Math.PI / 180, az = [-0.5, -0.866], c = Math.cos(alt); return [az[0] * c, Math.sin(alt), az[1] * c]; })();
const LA_SUN_UW = (() => { const z = Math.acos(LA_SUN[1]), zi = Math.asin(Math.sin(z) / LA_N_PHYS), h = Math.hypot(LA_SUN[0], LA_SUN[2]); return [LA_SUN[0] / h * Math.sin(zi), Math.cos(zi), LA_SUN[2] / h * Math.sin(zi)]; })();
