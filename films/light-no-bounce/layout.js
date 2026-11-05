/* =====================================================================
   LAYOUT — where everything is (classic script: globals). Metres. Axes: x EAST, y up, z SOUTH (north is −z).
   A travelling funfair on a hilltop common above a market town in southern England (51.5° N), Saturday 21 November
   2026, 3:30 PM: the Sun 3.8° up in the south-west (azimuth 230°), the waxing gibbous Moon rising in the east with Saturn
   near it. The hill falls away to the east into a valley: the motorway along its floor, the town beyond, the airport's
   runway to the south-east. You stand on the fair's main path in front of the Fun House's mirrors.
   ===================================================================== */

const NB_F = {
  you: [0, 0, 0.6],                         // where you stand (feet), on the main path, facing the Fun House (north)
  eye: 1.62,
  path: { z: [-1.2, 4.2] },                 // the main path (east–west) through the fair
  // the Fun House: façade along x, facing south (+z), its three tall wavy mirrors in front of you
  fun: { x: [-9, 9], z: -2.2, h: 7.0, d: 9, mirrors: [-2.45, 0, 2.45], mirW: 2.2, mirY: [0.3, 2.75] },
  // the rollercoaster south-east of you, behind the stalls (the train runs on its own, round and round)
  coaster: { x: [12, 64], z: [18, 52], top: 18 },
  // the Ferris wheel south-west of you, between you and the low Sun
  wheel: { c: [-31, 0, 30], R: 15.5, hub: 17.8, n: 16, period: 220 },
  carousel: { c: [-24, 0, 8.5], R: 7.6 },
  dodgems: { c: [-30, 0, -20], w: 22, d: 14 },
  stalls: { z: 10.5, x: [-6, 30], n: 6 },
  juggler: [8.0, 0, 5.0],
  plateau: 92,                              // the flat hilltop's radius; beyond it the ground falls away
  // the valley to the east (the hilltop is 70 m above it)
  valleyY: -70,
  motorway: { x: 430, w: 26, z: [-3000, 3000], y: -70 },
  town: { x: [520, 1700], z: [-900, 700] },
  runway: { x: [900, 2900], z: 1650, y: -62 },     // the airport across the valley (south-east), runway east–west (landing westward)
};

// the sky at 3:30 PM, 21 November 2026, 51.5° N: local sidereal time 19.6 h (Vega and Altair high in the south-west,
// Capella in the north-east, the Plough low in the north)
const NB_SKY = { lat: 51.5, lst: 19.58 };
// sun, moon, planet (RA hours, Dec degrees; the Sun's is 3:30 PM's; the Moon 11.6 days old, 85% lit)
const NB_BODIES = { sun: [15.93, -20.2], moon: [1.32, 6.5], saturn: [0.30, -1.9] };

// the ground's height (x east): the flat hilltop, the fall into the valley all round, the far side rising to the east;
// flattened under the motorway (a shallow cutting) and the airport
function nbGroundY(x, z) {
  const r = Math.hypot(x * 0.9, z * 1.1), P = NB_F.plateau;
  if (r < P) return 0.006 * noise1(x * 0.05 + z * 0.03, 5);
  const u = MathX.clamp((r - P) / 230, 0, 1), fall = NB_F.valleyY * (u * u * (3 - 2 * u));
  const far = x > 470 ? Math.min(45, (x - 470) * 0.03) : 0;
  let y = fall + far + 1.5 * noise1(x * 0.01 + z * 0.013, 3) * Math.min(1, u * 3);
  const dm = Math.abs(x - NB_F.motorway.x);
  if (dm < 46) y = MathX.lerp(NB_F.motorway.y - 0.3, y, MathX.smooth(dm, 24, 46));
  const R = NB_F.runway, da = Math.max(0, R.x[0] - x, x - R.x[1] - 300, Math.abs(z - R.z) - 160);
  if (da < 220) y = MathX.lerp(R.y - 0.3, y, MathX.smooth(da, 0, 220));
  return y;
}

if (typeof module !== 'undefined') module.exports = { NB_F, NB_SKY, NB_BODIES };
