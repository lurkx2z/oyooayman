/* =====================================================================
   LAYOUT — where everything is (classic script: globals). Metres. Axes: x points to the STERN (east: the ship sails
   west, bow at −x), y up (the sea at rest is y = 0), z points to PORT (south). Starboard is −z (north).
   The cruise ship "Coral Meridian" (fictional): 290 m long, 36 m wide, 8.4 m draft, 17 decks, 3,100 passengers and
   1,200 crew, crossing the Atlantic (24° N, 38° W, 1,500 km from the nearest land) on Saturday 13 November 2027.
     hull          x −145 (the bow's tip) … +145 (the transom); white above a navy boot-top; decks 2–5 inside it
     cabins        decks 6–14, balconies down both sides; the bridge at the front of deck 13–14 (x −112)
     pool deck     deck 15 (y 39.7), open from x −78 to +44: the main pool, four hot tubs, loungers, the bar, the big
                   screen on the forward block's aft face, glass windbreaks down both sides
     funnel        x +52 … +86 (top 64 m); the waterslide wound round its forward face
     stern         the aft terraces step down decks 14 → 6 (x +118 … +145); the outside stairs between them
     marina        deck 2's water-sports platform folded out of the transom (x +145 … +151, y 1.3): the dive shop
   ===================================================================== */

const AT_F = {
  lat: 24.0, lon: -38.0, utc: -3,                     // ship's time: UTC−3 (nautical zone for 38° W)
  L: 290, B: 36, draft: 8.4, bow: -145, stern: 145,
  deck: (k) => 2.0 + 2.9 * (k - 2),                    // deck k's floor height above the sea
  pool: { x0: -22, x1: -8, z0: -4, z1: 4, depth: 1.6 },  // the main pool (water 0.15 m under deck 15)
  tubs: [[-30.5, -9.5], [-30.5, 9.5], [0.5, -9.5], [0.5, 9.5]],   // hot tubs (centres), 3.2 m across
  open: { x0: -78, x1: 44, z: 17.2 },                  // deck 15's open area; the windbreaks at z ±z
  screen: { x: -77.6, y: 46.4, w: 13.6, h: 7.6 },       // the big screen, facing aft
  bar: { x: 30, z: 0 },
  funnel: { x0: 52, x1: 86, top: 64 },
  marina: { x0: 145, x1: 151.2, y: 1.3, w: 14 },
  line: { x: 152.0, z: 0.8, y1: -12.2 },              // the line hung off the davit's arm (past the platform), its foot 12.2 m down
  depth: 10.1,                                        // where you two hang on it (10.08 m of seawater ≈ 1 atm)
  speed0: 10.3,                                       // 20 knots
};

// NOAA solar position (geometric altitude °, azimuth °) at lat, lon, UTC date and hour
function atSunPos(lat, lon, y, mo, d, hUTC) {
  const rad = Math.PI / 180;
  let Y = y, M0 = mo; if (M0 <= 2) { Y--; M0 += 12; }
  const A = Math.floor(Y / 100), B = 2 - A + Math.floor(A / 4), JD = Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M0 + 1)) + d + B - 1524.5 + hUTC / 24;
  const T = (JD - 2451545) / 36525, L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360, M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T), C = Math.sin(M * rad) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(2 * M * rad) * (0.019993 - 0.000101 * T) + Math.sin(3 * M * rad) * 0.000289;
  const om = 125.04 - 1934.136 * T, lam = L0 + C - 0.00569 - 0.00478 * Math.sin(om * rad);
  const eps = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60 + 0.00256 * Math.cos(om * rad);
  const dec = Math.asin(Math.sin(eps * rad) * Math.sin(lam * rad)) / rad, yv = Math.tan(eps / 2 * rad) ** 2;
  const Eq = 4 * (yv * Math.sin(2 * L0 * rad) - 2 * e * Math.sin(M * rad) + 4 * e * yv * Math.sin(M * rad) * Math.cos(2 * L0 * rad) - 0.5 * yv * yv * Math.sin(4 * L0 * rad) - 1.25 * e * e * Math.sin(2 * M * rad)) / rad;
  const tst = ((hUTC * 60 + Eq + 4 * lon) % 1440 + 1440) % 1440, ha = tst / 4 < 0 ? tst / 4 + 180 : tst / 4 - 180;
  const zen = Math.acos(Math.sin(lat * rad) * Math.sin(dec * rad) + Math.cos(lat * rad) * Math.cos(dec * rad) * Math.cos(ha * rad)) / rad;
  let az = Math.acos((Math.sin(lat * rad) * Math.cos(zen * rad) - Math.sin(dec * rad)) / (Math.cos(lat * rad) * Math.sin(zen * rad))) / rad;
  az = ha > 0 ? (az + 180) % 360 : (540 - az) % 360;
  return { alt: 90 - zen, az };
}
// the Sun at story time s (s = 0 is 10:00:00 AM ship's time = 13:00 UTC): its altitude, azimuth and a unit vector
// towards it in the ship's frame (the ship heads due west: −x is west, +z is south, −z north)
function atSunAt(s) {
  const p = atSunPos(AT_F.lat, AT_F.lon, 2027, 11, 13, 13 + s / 3600), al = p.alt * Math.PI / 180, az = p.az * Math.PI / 180;
  // azimuth from north, clockwise: north = −z, east = +x
  return { alt: p.alt, az: p.az, v: [Math.sin(az) * Math.cos(al), Math.sin(al), -Math.cos(az) * Math.cos(al)] };
}

if (typeof module !== 'undefined') module.exports = { AT_F, atSunPos, atSunAt };
