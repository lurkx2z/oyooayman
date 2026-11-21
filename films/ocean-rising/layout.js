/* =====================================================================
   LAYOUT — where everything is (classic script: globals). Metres. Axes: x points EAST, y up, z points SOUTH (north is
   −z). y = 0 is the sea at high water at 6:42 PM (the datum lighthouse heights are charted from). The origin is the
   middle of the tower's base.
   Harrow Rock (fictional): a granite island 105 m by 70 m, 22 km off the coast of Maine (43.95° N, 68.85° W), with a
   light station on it: the tower, the keeper's house, the fog signal house, the landing and the path between them.
     tower         a white stone cone on the rock's top (base +15.0, door sill +15.3 facing west), 142 steps up the wall
                   to the watch room (+42.0); the gallery (+45.0) round the lantern; the lamp's focal plane +47.0;
                   the lantern's roof: eave +48.8, dome top +50.6
     house         the keeper's house, west of the tower: two storeys, white clapboard, a red roof; floor +13.0,
                   its front door on the east side (towards the tower)
     fog signal    the fog signal house on the east cliff (floor +10.5), its horn facing the open sea
     landing       a concrete landing on the west shore (deck +1.2), steps down its south side, a ring in its west face
                   for the boat; the path climbs east from it to the house
   The town (Port Ellery, fictional) is on the mainland 22 km to the north-west, under the hill (240 m) behind it.
   ===================================================================== */

const OC_F = {
  lat: 43.95, lon: -68.85, utc: -4,                    // EDT
  date: [2027, 9, 9],                                   // Thursday 9 September 2027: high water near 6:42 PM (the Gulf of Maine's
                                                        // high tides come ~11 h after the Moon's transit); a gibbous Moon in the south-south-east; sunset 6:52 PM
  t0: 18 * 3600 + 42 * 60,                              // s = 0: 6:42:00 PM, high water
  tower: { x: 0, z: 0, base: 15.0, sill: 15.3, rB: 4.0, rT: 2.85, top: 45.0, inner: 2.35, well: 1.25, watch: 42.0, steps: 142,
    door: { w: 1.0, h: 2.0 }, lamp: 47.0, glass: [45.55, 48.55], lanternR: 1.7, eave: 48.8, dome: 50.6, ball: 51.1, rod: 52.6, galleryR: 3.25, rail: 1.1 },
  house: { x0: -25.0, x1: -15.0, z0: 0.5, z1: 8.0, floor: 13.0, ceil: 15.6, eave: 18.3, ridge: 21.0, door: { z: 4.25, w: 0.95, h: 2.05, sill: 0.1 } },
  fog: { x: 22.0, z: -9.0, w: 6.0, d: 4.4, floor: 10.5, eave: 13.4, built: 1907 },
  landing: { x0: -74.0, x1: -65.0, z0: 2.5, z1: 9.0, top: 1.2, foot: -1.6 },
  ring: [-74.08, 0.85, 3.9],                             // the ring bolt in the landing's west face
  boat: { L: 5.4, B: 1.9, bowZ: 3.9, x: -75.2, free: 0.55, rope: 1.15 },   // moored along the west face, bow north
  tideBoard: [-70.0, 2.45],                              // the tide board's face (x, z): on the landing's north face
  bell: { x: 337, z: 25.4, depth: 18.0, chain: 26.0 },    // the bell buoy, ~320 m east (out in the sunset's afterglow), on 26 m of chain in 18 m of water
  town: { az: 315, d: 22000 }, hill: { az: 318, d: 24000, h: 240 },
  // other lights along the coast: [az °, km, focal height m, period s, flashes (0: occulting), name]
  lights: [[291, 14.5, 18, 6, 1, 'Ram Ledge'], [338, 19, 29, 4, 0, 'Owl Point'], [262, 27, 26, 4, 1, 'Cape Turner']],
};
OC_F.tower.rise = (OC_F.tower.watch - OC_F.tower.sill) / OC_F.tower.steps;   // 0.188 m a step

// a direction from an azimuth (degrees from north, clockwise) → [x, z]
const ocAzXZ = (az) => [Math.sin(az * Math.PI / 180), -Math.cos(az * Math.PI / 180)];
// the tower's outer radius at height y (a straight cone from the base to the gallery)
const ocTowerR = (y) => MathX.lerp(OC_F.tower.rB, OC_F.tower.rT, MathX.clamp((y - OC_F.tower.base) / (OC_F.tower.top - OC_F.tower.base), 0, 1));

// NOAA solar position (geometric altitude °, azimuth °) at lat, lon, UTC date and hour
function ocSunPos(lat, lon, y, mo, d, hUTC) {
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
// the Moon (Meeus ch. 47, the largest terms; ~0.1°): topocentric altitude and azimuth (degrees) at the Julian day jd
function ocMoonPos(lat, lon, jd) {
  const r = Math.PI / 180, s = (x) => Math.sin(x * r), T = (jd - 2451545) / 36525;
  const Lp = 218.3164477 + 481267.88123421 * T, D = 297.8501921 + 445267.1114034 * T, M = 357.5291092 + 35999.0502909 * T, Mp = 134.9633964 + 477198.8675055 * T, F = 93.272095 + 483202.0175233 * T;
  const L = Lp + 6.288774 * s(Mp) + 1.274027 * s(2 * D - Mp) + 0.658314 * s(2 * D) + 0.213618 * s(2 * Mp) - 0.185116 * s(M) - 0.114332 * s(2 * F) + 0.058793 * s(2 * D - 2 * Mp)
    + 0.057066 * s(2 * D - M - Mp) + 0.053322 * s(2 * D + Mp) + 0.045758 * s(2 * D - M) - 0.040923 * s(M - Mp) - 0.03472 * s(D) - 0.030383 * s(M + Mp);
  const B = 5.128122 * s(F) + 0.280602 * s(Mp + F) + 0.277693 * s(Mp - F) + 0.173237 * s(2 * D - F) + 0.055413 * s(2 * D - Mp + F) + 0.046271 * s(2 * D - Mp - F);
  const dist = 385000.56 - 20905.355 * Math.cos(Mp * r) - 3699.111 * Math.cos((2 * D - Mp) * r) - 2955.968 * Math.cos(2 * D * r), e = (23.439291 - 0.0130042 * T) * r;
  const l = L * r, b = B * r, ra = Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l)), dec = Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l));
  const gmst = (280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T) % 360, H = (gmst + lon) * r - ra, la = lat * r;
  const alt = Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(H)), az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(la) - Math.tan(dec) * Math.cos(la));
  return { alt: (alt - Math.asin(6378.14 / dist * Math.cos(alt))) / r, az: ((az / r) + 540) % 360 };
}
const ocJD = (y, mo, d, h) => { if (mo <= 2) { y--; mo += 12; } const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4); return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (mo + 1)) + d + B - 1524.5 + h / 24; };
// a unit vector towards an (alt, az) in the set's frame
const ocSkyV = (alt, az) => { const al = alt * Math.PI / 180, [x, z] = ocAzXZ(az); return [x * Math.cos(al), Math.sin(al), z * Math.cos(al)]; };
// the Sun and the Moon at story time s (s = 0 is 6:42:00 PM EDT = 22:42 UTC)
function ocSunAt(s) { const p = ocSunPos(OC_F.lat, OC_F.lon, ...OC_F.date, (OC_F.t0 + s) / 3600 - OC_F.utc); return { alt: p.alt, az: p.az, v: ocSkyV(p.alt, p.az) }; }
function ocMoonAt(s) { const p = ocMoonPos(OC_F.lat, OC_F.lon, ocJD(...OC_F.date, (OC_F.t0 + s) / 3600 - OC_F.utc)); return { alt: p.alt, az: p.az, v: ocSkyV(p.alt, p.az) }; }

if (typeof module !== 'undefined') module.exports = { OC_F, ocSunPos, ocMoonPos, ocJD };
