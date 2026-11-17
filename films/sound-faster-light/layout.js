/* =====================================================================
   LAYOUT — where everything is (classic script: globals). Metres. Axes: x EAST, y up, z SOUTH (north is −z).
   A corn farm in central Iowa (41.9° N, 93.9° W), Saturday 24 July 2027, 8:52 PM CDT: the Sun set 11 minutes ago
   (2.3° below the horizon, azimuth 299°: a band of glow low in the west-north-west, under the storm).
     the yard     the farmhouse (white clapboard, porch to the south), its storm cellar, the red barn with its hay loft
                  door (the bats' way out), the windmill, the yard light on its pole, two grain bins, the pickup
     the road     a gravel county road along the south of the farm (z = 74), power poles on its north verge
     the corn     west of the yard (x < −42) and north of it (z < −48), 2.4 m tall, rows running east–west
     around       soybeans east, a grove of trees north-east, the flat fields of Iowa; the Hansen farm 1.5 km west;
                  the town (water tower, sirens) 6 km south-east; a railway 11 km north-east
   ===================================================================== */

const SF_F = {
  lat: 41.9, lon: -93.9,
  air: 20,                                                     // °C (the storm's outflow has cooled the evening)
  house: { x: -14, z: 8, w: 10.5, d: 8.5, eave: 5.7, ridge: 8.6, porch: 3.2 },
  cellar: { x: -28, z: 5.5 },                                // the storm cellar's doors, west of the house
  barn: { x: 27, z: -15, w: 16, d: 26, eave: 5.6, knee: 9.4, ridge: 12.4 },   // its south gable (the big doors, the loft door) at z = −2
  windmill: { x: -1, z: -27, h: 13 },
  yardLight: { x: 9, z: -5, h: 9 },
  bins: [[52, -6, 5.2, 8.5], [52, 9, 4.2, 7.2]],               // [x, z, radius, wall height]
  pickup: { x: -2, z: 17, yaw: 0.25 },
  road: { z: 74, w: 7 },
  drive: { x: 2 },
  poles: Array.from({ length: 30 }, (_, k) => -880 + 60 * k),  // power poles on the road's north verge (z = 68)
  poleZ: 67.5,
  field: { westX: -42, northZ: -48, eastX: 64 },               // the corn: x < westX (all z north of the road), and z < northZ for x < eastX
  rowW: 0.76,                                                  // 30-inch rows
  cornH: 2.4,
  town: [4300, 4250],                                          // the town's centre (its water tower and its siren)
  rail: [7400, -8150],                                         // the railway crossing where the freight train sounds its horn
};
// NOAA solar position (geometric altitude °, azimuth °) at lat, lon, UTC date and hour (the no-light film's)
function sfSunPos(lat, lon, y, mo, d, hUTC) {
  const rad = Math.PI / 180;
  let Y = y, M0 = mo; if (M0 <= 2) { Y--; M0 += 12; }
  const A = Math.floor(Y / 100), B = 2 - A + Math.floor(A / 4), JD = Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M0 + 1)) + d + B - 1524.5 + hUTC / 24;
  const T = (JD - 2451545) / 36525, L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360, M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T), C = Math.sin(M * rad) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(2 * M * rad) * (0.019993 - 0.000101 * T) + Math.sin(3 * M * rad) * 0.000289;
  const om = 125.04 - 1934.136 * T, lam = L0 + C - 0.00569 - 0.00478 * Math.sin(om * rad);
  const eps = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60 + 0.00256 * Math.cos(om * rad);
  const dec = Math.asin(Math.sin(eps * rad) * Math.sin(lam * rad)) / rad, yv = Math.tan(eps / 2 * rad) ** 2;
  const Eq = 4 * (yv * Math.sin(2 * L0 * rad) - 2 * e * Math.sin(M * rad) + 4 * e * yv * Math.sin(M * rad) * Math.cos(2 * L0 * rad) - 0.5 * yv * yv * Math.sin(4 * L0 * rad) - 1.25 * e * e * Math.sin(2 * M * rad)) / rad;
  const tst = (hUTC * 60 + Eq + 4 * lon) % 1440, ha = tst / 4 < 0 ? tst / 4 + 180 : tst / 4 - 180;
  const zen = Math.acos(Math.sin(lat * rad) * Math.sin(dec * rad) + Math.cos(lat * rad) * Math.cos(dec * rad) * Math.cos(ha * rad)) / rad;
  let az = Math.acos((Math.sin(lat * rad) * Math.cos(zen * rad) - Math.sin(dec * rad)) / (Math.cos(lat * rad) * Math.sin(zen * rad))) / rad;
  az = ha > 0 ? (az + 180) % 360 : (540 - az) % 360;
  return { alt: 90 - zen, az };
}
// the Sun from the farm at story time s (s = 0 is 8:52:00 PM CDT = 01:52 UTC on 25 July 2027): 2.3° below the
// horizon, azimuth 299°; it set (upper limb, with refraction: −0.833°) at 8:41 PM
const sfSunAt = (s) => sfSunPos(SF_F.lat, SF_F.lon, 2027, 7, 25, 1 + 52 / 60 + s / 3600);
// the direction of the Sun's glow (unit; y kept slightly above the horizon: the glow under the cloud base)
const SF_SUN = (() => { const p = sfSunAt(0), az = p.az * Math.PI / 180; return [Math.sin(az) * 0.995, 0.1, -Math.cos(az) * 0.995]; })();

// the field: is (x, z) corn?
function sfIsCorn(x, z) { const F = SF_F.field; if (z > SF_F.road.z - 9) return false; if (x < F.westX) return z < SF_F.road.z - 9; return z < F.northZ && x < F.eastX; }
// how far inside the corn (x, z) is (m; < 0 = outside)
function sfCornIn(x, z) { const F = SF_F.field; const a = Math.min(F.westX - x, SF_F.road.z - 9 - z), b = Math.min(F.northZ - z, F.eastX - x); return Math.max(a, b); }
// the ground (y): flat where the farm is, gently rolling beyond (Iowa); the road's ditches
function sfGroundY(x, z) {
  const r = Math.hypot(x - 0, z - 0), far = MathX.smooth(r, 160, 900);
  let y = far * (3.2 * noise1(x * 0.0011 + 3.1, 21) + 2.2 * noise1(z * 0.0013 - 1.7, 23) + 9 * MathX.smooth(r, 1500, 6000) * noise1(x * 0.00031 + z * 0.00027, 25));
  y += 0.25 * noise1(x * 0.02, 27) * noise1(z * 0.02, 29);
  const dz = Math.abs(z - SF_F.road.z);
  if (dz < 9) { const k = dz < SF_F.road.w / 2 ? 0.12 : -0.75 * Math.sin(Math.PI * MathX.clamp((dz - SF_F.road.w / 2) / (9 - SF_F.road.w / 2), 0, 1)); y = y * MathX.smooth(dz, 0, 9) + k; }
  return y;
}
// a horizontal distance and a bearing (° clockwise from north) from a to b ([x, z])
const sfDist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const sfBearing = (a, b) => ((Math.atan2(b[0] - a[0], -(b[1] - a[1])) * 180 / Math.PI) + 360) % 360;
// a unit direction from a bearing
const sfDirOf = (deg) => [Math.sin(deg * Math.PI / 180), -Math.cos(deg * Math.PI / 180)];
