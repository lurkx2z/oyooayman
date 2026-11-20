/* =====================================================================
   LAYOUT — where everything is (classic script: globals). Metres. Axes: x EAST, y up, z SOUTH (north is −z).
   A lake in the Canadian Rockies (51.4° N, 116.2° W, the water 1,890 m above the sea), Saturday 28 August 2027,
   6:49 AM MDT: the Sun is 1.2° below the horizon (azimuth 71°, east-north-east). The valley runs east–west; it opens
   to the east (the dawn), and its head is a ring of peaks 1,300–1,650 m above the lake, 4–7 km to the west.
     P (the origin)  the tent, on a meadow at the lake's south-east corner: you lie here, then stand up here; everything
                     shrinks towards this point (EK_P)
     the lake       x −3,100 … −60, z −770 … −35 (turquoise, 3 km long); its outflow runs east past the lodge
     the camp       your tent, your car, a picnic table, a fire pit; the next campsite (a camper van, two people)
     around         spruce forest, the lodge at the lake's outlet, the access road east along the valley
   ===================================================================== */

const EK_F = {
  lat: 51.4, lon: -116.2, asl: 1890,                  // the meadow's height above the sea (m)
  lakeY: -1.6,                                         // the lake's surface (y)
  tent: { x: 0, z: 0, yaw: 0.35, w: 2.15, d: 1.55, h: 1.12 },
  car: { x: 5.8, z: 6.4, yaw: 1.2 },
  table: { x: -3.6, z: 4.4, yaw: 0.2 },
  fire: { x: -2.9, z: 1.6 },
  van: { x: 27, z: 3, yaw: -1.35 },                    // the next campsite (east)
  vanPeople: [[24.6, 5.4], [25.9, 6.6]],               // the two neighbours, beside their van
  dock: { x: -96, z: -28, len: 22, yaw: -0.65 },
  canoe: { x: -420, z: -260, yaw: 1.1 },
  lodge: { x: 140, z: -330, w: 46, d: 18 },            // at the outlet, across the bay from the camp (north-east)
  lake: { cx: -1580, cz: -402, hx: 1520, hz: 367, r: 70 },
  road: { z: 60 },
};
const EK_P = [0, 0];                                    // the point everything shrinks towards (the tent)

// the Sun (NOAA's formulas; the slow-light film's code): altitude and azimuth (°) at lat, lon, UTC date and hour
function ekSunPos(lat, lon, y, mo, d, hUTC) {
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
  return { alt: 90 - zen, az, dec };
}
// story time τ = 0 is 6:49:00 AM MDT (UTC−6) = 12:49 UTC on 28 August 2027
const ekSunAt = (tau) => ekSunPos(EK_F.lat, EK_F.lon, 2027, 8, 28, 12 + 49 / 60 + tau / 3600);
// a unit direction (x east, y up, z south) from altitude and azimuth (° clockwise from north)
function ekDirAltAz(alt, az) { const a = alt * Math.PI / 180, z = az * Math.PI / 180; return [Math.sin(z) * Math.cos(a), Math.sin(a), -Math.cos(z) * Math.cos(a)]; }
// the waning crescent Moon (26 days old) in the dawn sky: ~52° west of the Sun along the ecliptic, about 30° up in
// the east-south-east at 6:49 (an illustration of its place, computed roughly: it only appears as a crescent in the sky)
const EK_MOON_DIR = ekDirAltAz(29, 112);

// ---- the ground
// smooth 2-D gradient (Perlin) noise in about [-1, 1] (seeded, stateless; a table of 256 gradients, no trigonometry)
const EK_GRAD = (() => { const g = new Float32Array(512); for (let i = 0; i < 256; i++) { const a = hash1(i * 7 + 3) * 6.283185307; g[2 * i] = Math.cos(a); g[2 * i + 1] = Math.sin(a); } return g; })();
function ekN2(x, z, seed = 0) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, G = EK_GRAD, sd = Math.imul(seed + 1, 83492791);
  const gi = (a, b) => { let n = Math.imul(a, 73856093) ^ Math.imul(b, 19349663) ^ sd; n = Math.imul(n ^ (n >>> 13), 0x5bd1e995); n ^= n >>> 15; return (n & 255) << 1; };
  const i00 = gi(ix, iz), i10 = gi(ix + 1, iz), i01 = gi(ix, iz + 1), i11 = gi(ix + 1, iz + 1);
  const n00 = G[i00] * fx + G[i00 + 1] * fz, n10 = G[i10] * (fx - 1) + G[i10 + 1] * fz;
  const n01 = G[i01] * fx + G[i01 + 1] * (fz - 1), n11 = G[i11] * (fx - 1) + G[i11 + 1] * (fz - 1);
  const u = fx * fx * fx * (fx * (fx * 6 - 15) + 10), v = fz * fz * fz * (fz * (fz * 6 - 15) + 10);
  const a = n00 + (n10 - n00) * u, b = n01 + (n11 - n01) * u;
  return 1.41 * (a + (b - a) * v);
}
function ekFbm(x, z, seed = 0, oct = 4) { let v = 0, a = 0.5, n = 0; for (let o = 0; o < oct; o++) { v += ekN2(x, z, seed + o * 17) * a; n += a; x = x * 2.03 + 3.1; z = z * 2.03 - 1.7; a *= 0.5; } return v / n; }
// a ridged fractal (0…1): sharp crests (the Rockies' limestone ridges)
function ekRidged(x, z, seed = 0, oct = 5) {
  let v = 0, a = 0.5, n = 0, w = 1;
  for (let o = 0; o < oct; o++) { let q = 1 - Math.abs(ekN2(x, z, seed + o * 29)); q *= q; v += q * a * w; n += a; w = MathX.clamp(q * 1.6, 0.3, 1); x = x * 2.07 + 5.3; z = z * 2.07 - 2.9; a *= 0.5; }
  return v / n;
}
const ekSmooth = (a, b, v) => { const u = MathX.clamp((v - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };

// the lake: a rounded box (signed distance, m; < 0 = water), its shore wavy
function ekLakeSD(x, z) {
  const L = EK_F.lake, qx = Math.abs(x - L.cx) - (L.hx - L.r), qz = Math.abs(z - L.cz) - (L.hz - L.r);
  const d = Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - L.r;
  return d + 16 * ekN2(x * 0.004, z * 0.004, 41) + 6 * ekN2(x * 0.012, z * 0.012, 43);
}
// the ranges run north-west to south-east (bearing 140°): u along them, v across (north-east +)
const ekAlong = (x, z) => 0.643 * x + 0.766 * z, ekAcross = (x, z) => 0.766 * x - 0.643 * z;
// the valleys: a polyline, its floor (height by x for ours, by u for the others), the floor's half-width w0, the walls' w1
const EK_VALLEYS = [
  { id: 'lake', pts: [[-4300, -430], [-3000, -405], [-1500, -395], [0, -335], [1800, -250], [3600, -150], [5600, -60], [7400, 10]],
    floor: (x, u) => (x < -3200 ? 150 * ekSmooth(-3200, -4400, x) - 3 : x < 0 ? -3 + 3 * ekSmooth(-400, 0, x) : -330 * ekSmooth(600, 7400, x) ** 1.3), w0: 560, w1: 2100 },
  { id: 'bow', line: { v: 6200 }, floor: (x, u) => -340 - 0.006 * u, w0: 900, w1: 3900 },          // the main valley (north-east)
  { id: 'trench', line: { v: -61000 }, floor: (x, u) => -1080 - 0.002 * u, w0: 2500, w1: 9000 },   // the Rocky Mountain Trench (west)
];
(() => { for (const V of EK_VALLEYS) if (V.pts) V.seg = V.pts.slice(1).map((b, i) => { const a = V.pts[i], dx = b[0] - a[0], dz = b[1] - a[1]; return [a[0], a[1], dx, dz, dx * dx + dz * dz]; }); })();
function ekValleyD(V, x, z) {
  if (V.line) return Math.abs(ekAcross(x, z) - V.line.v + 900 * ekN2(ekAlong(x, z) * 0.00004, 0.5, 61));
  let best = 1e12;
  for (const [ax, az, dx, dz, l2] of V.seg) { const t = MathX.clamp(((x - ax) * dx + (z - az) * dz) / l2, 0, 1), ex = x - ax - dx * t, ez = z - az - dz * t; best = Math.min(best, ex * ex + ez * ez); }
  return Math.sqrt(best);
}
// the named peaks (x, z, height above the meadow m, footprint radius m): horns on the walls round the lake, the cirque
const EK_PEAKS = [
  [-5700, -1250, 1820, 1500], [-6400, 350, 1760, 1500], [-4900, 1500, 1580, 1400], [-3500, -2050, 1520, 1300], [-1900, -2200, 1430, 1300],
  [-200, -2300, 1330, 1400], [1600, -2350, 1180, 1400], [-2700, 1650, 1420, 1300], [-800, 1750, 1300, 1300], [1200, 1850, 1150, 1300],
];
// the height of the mountains before the valleys cut them (m above the meadow)
function ekMass(x, z) {
  const v = ekAcross(x, z), u = ekAlong(x, z);
  const band0 = 0.5 + 0.5 * Math.cos(6.2832 * v / 11500 + 2.4 * ekN2(u * 0.00005, v * 0.00009, 5));
  const band = MathX.lerp(band0, 0.55, 0.45 + 0.45 * ekN2(u * 0.000035, v * 0.00004, 6));
  const r1 = ekRidged(x * 0.00013, z * 0.00013, 3, 3), r2 = ekRidged(x * 0.0009, z * 0.0009, 7, 4);
  let m = 380 + 980 * r1 * (0.4 + 0.6 * band) + 240 * band + 210 * (r2 - 0.45);
  // a network of side valleys (drainages cut across the ranges)
  { const n1 = ekN2(x * 0.00011 + 0.3 * ekN2(x * 0.0004, z * 0.0004, 21), z * 0.00011, 19), n2 = ekN2(x * 0.00027, z * 0.00027, 23);
    m -= 620 * Math.pow(1 - Math.abs(n1), 7) + 260 * Math.pow(1 - Math.abs(n2), 9); }
  // cliff bands (the limestone's layers) and gullies
  const layer = m / 95 + 1.3 * ekN2(x * 0.0007, z * 0.0007, 9), fl = layer - Math.floor(layer);
  m += 26 * ekSmooth(0.55, 0.95, fl) + 70 * (ekRidged(x * 0.0042, z * 0.0042, 11, 3) - 0.5);
  // the front ranges end to the north-east, in foothills and then the prairie; the Purcells beyond the trench (west)
  m -= 260 * ekSmooth(5000, 14000, v);
  const east = ekSmooth(36000, 72000, v), prairie = -955 + 70 * ekFbm(x * 0.00003, z * 0.00003, 13, 3) + 90 * ekSmooth(140000, 60000, v) * ekRidged(x * 0.00012, z * 0.00012, 15, 3);
  m = MathX.lerp(m, prairie, east);
  if (v < -66000) m = MathX.lerp(m, m - 380, ekSmooth(-66000, -90000, v));
  return m;
}
// the height of the ground (m above the meadow) at (x, z), out to ~600 km: the valleys cut into the mountains
function ekGroundY(x, z) {
  let M = ekMass(x, z);
  // the lake valley's walls: a crest ~2 km either side (and round the cirque), jagged
  { const dl = ekValleyD(EK_VALLEYS[0], x, z); if (dl < 4600) { const crest = 760 + 820 * ekRidged(x * 0.0004, z * 0.0004, 37, 4) + 160 * (ekRidged(x * 0.0019, z * 0.0019, 39, 3) - 0.5);
    M = Math.max(M, crest * ekSmooth(4600, 2500, dl) * (1 - 0.35 * ekSmooth(1500, 6500, x))); } }
  let w = 1, F = 0, wsum = 0, fsum = 0;
  for (const V of EK_VALLEYS) {
    const d = ekValleyD(V, x, z); if (d > V.w1) continue;
    const wi = ekSmooth(V.w0, V.w1, d), k = 1 - wi;
    const fl = V.floor(x, ekAlong(x, z));
    w = Math.min(w, wi); wsum += k * k + 1e-6; fsum += (k * k + 1e-6) * fl;
  }
  if (wsum > 0) F = fsum / wsum;
  const r = Math.hypot(x, z);
  // the valley floor: the meadow (gently uneven), the lake's basin, a little moraine at the lake's foot
  let floor = F + 0.35 * ekN2(x * 0.05, z * 0.05, 11) + 2.4 * ekSmooth(40, 700, r) * ekN2(x * 0.003, z * 0.003, 17);
  const lk = ekLakeSD(x, z);
  if (lk < 40) floor = MathX.lerp(EK_F.lakeY - 1.5 - 0.06 * Math.min(120, -lk), floor, ekSmooth(-25, 40, lk));
  let y = wsum === 0 ? M : floor + Math.max(0, M - floor) * Math.pow(w, 1.45);
  // the named peaks: horns on the walls (after the valleys: their feet stay on the valley's walls)
  for (const [px, pz, ph, pr] of EK_PEAKS) {
    const dx = x - px, dz = z - pz; if (Math.abs(dx) > pr * 1.8 || Math.abs(dz) > pr * 1.8) continue;
    const d = Math.hypot(dx * 0.8, dz * 1.15) / pr * (1 + 0.28 * ekN2(x * 0.0012, z * 0.0012, 35)); if (d >= 1.8) continue;
    const r2 = ekRidged(x * 0.0021, z * 0.0021, 31, 3);
    const py = ph * Math.pow(1 - d / 1.8, 1.5) * (0.9 + 0.16 * r2) + 30 * (1 - d / 1.8) * ekN2(x * 0.004, z * 0.004, 33);
    if (py > y) y = MathX.lerp(y, py, wsum === 0 ? 1 : ekSmooth(0.02, 0.4, w));
  }
  return y;
}
// a horizontal distance and a bearing (° clockwise from north) from a to b ([x, z])
const ekDist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const ekBearing = (a, b) => ((Math.atan2(b[0] - a[0], -(b[1] - a[1])) * 180 / Math.PI) + 360) % 360;
