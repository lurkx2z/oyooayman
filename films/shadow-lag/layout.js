/* =====================================================================
   LAYOUT — where everything is (classic script: globals). Metres. Axes: x EAST, y up, z SOUTH (north is −z).
   A multi-storey car park in an English town centre (52.6° N), Friday 13 November 2026, 11:58 PM. No Moon (a thin
   crescent that set at about 8 PM); a damp, still night; the town's sodium glow on low cloud.
     level 4    the deck you are on (y = 0): two modules side by side, each a 6.2 m aisle between two rows of bays,
                with a column at each aisle edge every 7.2 m (three bays). Concrete soffit at 2.95 m, downstand beams
                across every column line (bottom 2.45 m), LED battens between the beams, their faces 2.70 m above the
                floor. Open sides above a 1.1 m parapet: the town below.
     west end   the stair core (the lit door you come out of onto the north aisle)
     north row  a white-painted plant room (its long wall faces the aisle: your shadow's screen), the convex mirror,
                the guard's white van, your car (the last one on the north side)
     east end   the north aisle runs on into the ramp down (walled both sides)
   Level 2 is the same deck (other paint, another night's cars). The exit lane at street level is its own set (exit.js).
   ===================================================================== */

const SH_F = {
  lat: 52.6,
  deck: { x: [-38.6, 40.6], z: [-16.9, 16.9], soffit: 2.95, slab: 0.3, parapet: 1.1 },
  colX: Array.from({ length: 11 }, (_, k) => -36 + 7.2 * k),          // −36 … 36
  colZ: [-11.6, -4.8, 4.8, 11.6],                                      // the aisle edges (both modules)
  colW: 0.6,
  beamY: 2.45, beamW: 0.45,
  aisle: { n: -8.2, s: 8.2, half: 3.1 },                               // aisle centrelines; half-width (kerb to kerb)
  lampY: 2.70,                                                         // the battens' light-emitting faces
  lampRows: [-14.2, -8.2, -2.3, 2.3, 8.2, 14.2],
  lampX: Array.from({ length: 10 }, (_, k) => -32.4 + 7.2 * k),
  core: { x: [-44.6, -38.6], z: [-12.6, -3.8], door: { z: -8.2, w: 1.0, h: 2.1 } },
  plant: { x: [-35.4, -15.0], z: [-5.0, -0.3] },                       // the white plant room (its north face z = −5.0)
  mirror: { col: [-7.2, -4.8], y: 2.0 },                               // a convex mirror on that column's west face
  van: { x: 3.9, z: -2.35, yaw: 0 },                                   // nose-in (to the south), its back doors to the aisle
  car: { x: 25.2, z: -14.0, yaw: Math.PI },                            // your car, nose-in to the north wall (rear to the aisle)
  hide: [0.85, -4.25],                                                 // where you stand behind the column at x = 0
  ramp: { x: [36.9, 55.0], z: [-11.3, -5.1], drop: 3.25 },
  bays: 2.4,
};
// parked cars on level 4 (x, z, yaw, colour): few, at midnight
const SH_PARKED = [
  [-24.6, 14.0, 0, '#3a4a5c'], [-10.2, 2.4, 0, '#7a2a24'], [12.0, 14.0, 0, '#c9c6bd'], [19.2, 2.4, 0, '#2a2d33'],
  [33.6, 2.4, 0, '#5a6a4a'], [-3.0, 14.0, 0, '#1f2a3a'], [24.0, -2.35, Math.PI, '#6a6d72'],
];
// level 2's cars (a different spread)
const SH_PARKED2 = [
  [-31.8, -14.0, Math.PI, '#5a3a2a'], [-17.4, -2.35, Math.PI, '#2a3a5c'], [-7.8, 2.4, 0, '#c9c6bd'], [4.8, -14.0, Math.PI, '#3a3a3a'],
  [16.8, 2.4, 0, '#7a6a2a'], [26.4, -2.35, Math.PI, '#2a4a3a'], [-24.6, 14.0, 0, '#8a8d92'],
];
const SH_LAT = SH_F.lat * Math.PI / 180;

// the deck's floor height at (x, z): flat, except the ramp down at the east end of the north aisle
function shFloorY(x, z) {
  const R = SH_F.ramp;
  if (x > R.x[0] && z > R.z[0] - 0.3 && z < R.z[1] + 0.3) return -R.drop * MathX.clamp((x - R.x[0]) / (R.x[1] - R.x[0]), 0, 1);
  return 0;
}

if (typeof module !== 'undefined') module.exports = { SH_F, SH_PARKED, SH_PARKED2, shFloorY };
