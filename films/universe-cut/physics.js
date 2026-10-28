/* =====================================================================
   PHYSICS — "What if the universe got cut in half?" Every number the film shows comes from here or from calc/
   (PLAN.md § 2 has the table and how each was worked out).
   THE RULE: at 10:00:00 PM GMT tonight (28 October 2026) everything on one side of a flat cut through the universe
   disappears: matter, light in flight, everything. The universe we can see is a ball centred on us, so a cut that
   halves it passes through the centre of the Earth; this film's cut also passes through the centre of the Moon (where
   the real Moon is tonight). That fixes it up to one turn; of the two cuts that put your garden 20° from it, the one
   that keeps the Sun. Your garden (London) is on the side that stays, 2,197 km from the cut.
   Story time s = seconds after 10:00:00 PM GMT (negative before). Directions are unit vectors in the equatorial frame
   (x: the March equinox, z: the north celestial pole) until hvToGarden() turns them into the garden's frame
   (metres, y up, −z down the garden, which faces SSE: azimuth HVP.az0).
   ===================================================================== */

const HVP = {
  R: 6371, c: 299792.458,                       // Earth radius (km), light (km/s)
  lat: 51.5, lon: -0.1,                         // your garden (London)
  gm0: 2.4238, utc0: 22,                        // GMST at 0h UT on 28 Oct 2026 (h); the cut at 22:00:00 UT
  lam0: 215.50, eps: 23.44,                     // the Sun's ecliptic longitude tonight (°), the obliquity
  moonRa: 4.71508, moonDec: 27.15163, moonDist: 364424, Rmoon: 1737.4,   // the Moon tonight (geocentric; 90 % lit, waning)
  n: [-0.464399, -0.291896, 0.83614],           // the cut's normal (equatorial, at 10:00:00), pointing to the half that stays
  nEF: [-0.497565, -0.230864, 0.836140],        // the same in the Earth-fixed frame (x: lon 0, y: lon 90° E, z: north)
  az0: 150,                                     // the garden looks down to azimuth 150° (SSE)
  hgt: 0.002,                                   // your eyes: 2 m up (km)
  tHit: 222.5,                                  // ★ the first shock from the cut reaches the garden: 10:03:42.5 (calc/travel.py)
  g0: 9.82, g1: 6.78, tilt1: 13.1, tiltAz: 346, // gravity here now / the half-Earth's pull here (m/s², calc/grav.py), its tilt (°) and the way "down" tips
  feltK: 0.3,                                   // how far your felt weight has moved towards the new pull by 10:03:42 (an estimate: PLAN § 2)
};

// ---- vectors (plain arrays)
const hvDot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const hvAdd = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const hvSc = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const hvLen = (a) => Math.hypot(a[0], a[1], a[2]);
const hvNrm = (a) => hvSc(a, 1 / (hvLen(a) || 1));
const hvCross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const HV_D2R = Math.PI / 180;

// ---- the sky
function hvEcl(lam, beta = 0) {
  const l = lam * HV_D2R, b = beta * HV_D2R, e = HVP.eps * HV_D2R, x = Math.cos(b) * Math.cos(l), y = Math.cos(b) * Math.sin(l), z = Math.sin(b);
  return [x, y * Math.cos(e) - z * Math.sin(e), y * Math.sin(e) + z * Math.cos(e)];
}
function hvRaDec(raH, dec) { const r = raH * 15 * HV_D2R, d = dec * HV_D2R; return [Math.cos(d) * Math.cos(r), Math.cos(d) * Math.sin(r), Math.sin(d)]; }
const hvSunDir = (s) => hvEcl(HVP.lam0 + 0.98565 * s / 86400);    // towards the Sun (geocentric)
const hvGmst = (s) => HVP.gm0 + (HVP.utc0 + s / 3600) * 1.0027379;
// the local frame of a place at story time s: up, north, east (equatorial unit vectors)
function hvFrame(s, lat = HVP.lat, lon = HVP.lon) {
  const th = (hvGmst(s) + lon / 15) * 15 * HV_D2R, p = lat * HV_D2R;
  const up = [Math.cos(p) * Math.cos(th), Math.cos(p) * Math.sin(th), Math.sin(p)];
  const north = [-Math.sin(p) * Math.cos(th), -Math.sin(p) * Math.sin(th), Math.cos(p)];
  return { up, north, east: hvCross(north, up) };
}
function hvAltAz(v, F) { const u = hvDot(v, F.up), n = hvDot(v, F.north), e = hvDot(v, F.east); return { alt: Math.asin(Math.max(-1, Math.min(1, u))) / HV_D2R, az: ((Math.atan2(e, n) / HV_D2R) % 360 + 360) % 360 }; }
function hvGardenDir(az, alt) { const r = (az - HVP.az0) * HV_D2R, a = alt * HV_D2R; return [Math.sin(r) * Math.cos(a), Math.sin(a), -Math.cos(r) * Math.cos(a)]; }
function hvGardenAltAz(g) { const a = HVP.az0 * HV_D2R, e = g[0] * Math.cos(a) - g[2] * Math.sin(a), n = -g[2] * Math.cos(a) - g[0] * Math.sin(a);
  return { alt: Math.asin(Math.max(-1, Math.min(1, g[1]))) / HV_D2R, az: ((Math.atan2(e, n) / HV_D2R) % 360 + 360) % 360 }; }

// ---------------------------------------------------------------------------------------------------------------------
// THE CUT, seen from the garden. The plane is fixed in space (it cut at one instant; the void beyond it stays where it
// is while the Earth turns under it). X: your position (km, from the Earth's centre, equatorial, at 10:00:00).
// ---------------------------------------------------------------------------------------------------------------------
const HV_CUT = (() => {
  const F = hvFrame(0), X = hvSc(F.up, HVP.R + HVP.hgt), n = HVP.n, d = hvDot(X, n);           // d: 2,197 km
  const M = hvSc(hvRaDec(HVP.moonRa, HVP.moonDec), HVP.moonDist), toM = hvAdd(M, X, -1), L = hvLen(toM);
  return { F, X, n, d, M, Mdir: hvNrm(toM), L, tMoon: L / HVP.c };
})();
// a star in direction v (equatorial): when it goes out here (s). Its light already on this side of the cut is the
// stretch from where the line of sight crosses the cut to you: d / sin β km, β its angle past the line
function hvStarGone(v) { const k = -hvDot(v, HVP.n); return k <= 0 ? Infinity : HV_CUT.d / (HVP.c * k); }
// a point on the Moon (unit normal nm from its centre, equatorial): does it stay, and if not, when its last light
// reaches you (s): the light on this side of the cut is the part of the path from where it crosses the cut to you
function hvMoonPoint(nm) {
  const Q = hvAdd(HV_CUT.M, nm, HVP.Rmoon), depth = -hvDot(Q, HVP.n);                    // km beyond the cut
  if (depth <= 0) return { keep: true, t: Infinity };
  const path = hvLen(hvAdd(Q, HV_CUT.X, -1)), f = depth / (depth + HV_CUT.d);
  return { keep: false, t: (1 - f) * path / HVP.c };
}
// the felt pull in the garden: you, the ground and the air all fall together under the new gravity, so at first you
// feel exactly what you felt before; as the rock's stresses change your felt pull drifts towards the half-Earth's.
// k: how far it has drifted (0 → HVP.feltK by the shock, an estimate). Returns weight (fraction) and tilt (°, to tiltAz)
function hvFelt(s) {
  const k = s <= 0 ? 0 : HVP.feltK * Math.pow(Math.min(s, HVP.tHit) / HVP.tHit, 2);
  const g1n = HVP.g1 * Math.cos(HVP.tilt1 * HV_D2R), g1t = HVP.g1 * Math.sin(HVP.tilt1 * HV_D2R);
  const n = HVP.g0 + k * (g1n - HVP.g0), t = k * g1t;
  return { k, weight: Math.hypot(n, t) / HVP.g0, tilt: Math.atan2(t, n) / HV_D2R };
}
// the first shock from the cut: arrival time (s) at a place φ° from the cut (2-D first arrivals on PREM P speeds,
// calc/travel.py), every 2° from 0 to 90
const HV_ARR = [0, 23.4, 50.6, 77.8, 105.1, 129.7, 150.8, 169.4, 186.5, 205.1, 221.6, 237.9, 254.1, 268.8, 283.8, 297.9, 311.0, 324.4, 336.3, 348.6,
  359.4, 370.0, 379.8, 389.4, 398.5, 407.8, 416.8, 425.2, 435.3, 444.6, 453.3, 462.6, 471.2, 480.9, 488.8, 497.7, 507.5, 515.5, 524.3, 533.0, 541.5, 550.8, 558.5, 567.2, 575.9, 585.3];
function hvArrival(phi) { const x = MathX.clamp(phi / 2, 0, HV_ARR.length - 1.001), i = Math.floor(x), u = x - i; return HV_ARR[i] + (HV_ARR[i + 1] - HV_ARR[i]) * u; }
// how far the shock has got (φ°, from the cut) at story time s
function hvFrontPhi(s) { if (s <= 0) return 0; for (let i = 1; i < HV_ARR.length; i++) if (HV_ARR[i] >= s) return 2 * (i - 1 + (s - HV_ARR[i - 1]) / (HV_ARR[i] - HV_ARR[i - 1])); return 90; }
// places (name, lat, lon): their angle from the cut (°, + stays) and the shock's arrival
const hvLonLatEF = (lat, lon) => { const p = lat * HV_D2R, l = lon * HV_D2R; return [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)]; };
const hvPhiOf = (lat, lon) => Math.asin(MathX.clamp(hvDot(hvLonLatEF(lat, lon), HVP.nEF), -1, 1)) / HV_D2R;
const HV_PLACES = [['LONDON', 51.5, -0.1], ['PARIS', 48.86, 2.35], ['MADRID', 40.42, -3.7], ['ROME', 41.9, 12.5], ['BARCELONA', 41.39, 2.17], ['LYON', 45.76, 4.84],
  ['ALGIERS', 36.75, 3.06], ['ATHENS', 37.98, 23.73], ['BERLIN', 52.52, 13.4], ['NEW YORK', 40.7, -74.0], ['TOKYO', 35.68, 139.7], ['BEIJING', 39.9, 116.4], ['MOSCOW', 55.75, 37.62]]
  .map(([name, lat, lon]) => { const phi = hvPhiOf(lat, lon); return { name, lat, lon, phi, t: hvArrival(phi) }; });
const hvCity = (name) => HV_PLACES.find((p) => p.name === name);

// ---------------------------------------------------------------------------------------------------------------------
// STARS: [name, RA h, Dec °, magnitude, temperature K] (the light-backward film's table)
// ---------------------------------------------------------------------------------------------------------------------
const HV_STARS = [
  ['SIRIUS', 6.752, -16.72, -1.46, 9940], ['CANOPUS', 6.399, -52.70, -0.74, 7350], ['ARCTURUS', 14.261, 19.18, -0.05, 4290], ['ALPHA CENTAURI', 14.660, -60.83, -0.27, 5790],
  ['VEGA', 18.616, 38.78, 0.03, 9600], ['CAPELLA', 5.278, 46.00, 0.08, 4970], ['RIGEL', 5.242, -8.20, 0.13, 12100], ['PROCYON', 7.655, 5.22, 0.34, 6530],
  ['ACHERNAR', 1.629, -57.24, 0.46, 15000], ['BETELGEUSE', 5.919, 7.41, 0.50, 3600], ['HADAR', 14.064, -60.37, 0.61, 25000], ['ALTAIR', 19.846, 8.87, 0.76, 7670],
  ['ACRUX', 12.443, -63.10, 0.76, 24000], ['ALDEBARAN', 4.599, 16.51, 0.86, 3910], ['ANTARES', 16.490, -26.43, 0.96, 3400], ['SPICA', 13.420, -11.16, 0.97, 22400],
  ['POLLUX', 7.755, 28.03, 1.14, 4670], ['FOMALHAUT', 22.961, -29.62, 1.16, 8590], ['DENEB', 20.690, 45.28, 1.25, 8525], ['MIMOSA', 12.795, -59.69, 1.25, 27000],
  ['REGULUS', 10.139, 11.97, 1.40, 12460], ['ADHARA', 6.977, -28.97, 1.50, 22200], ['CASTOR', 7.577, 31.89, 1.58, 10300], ['SHAULA', 17.560, -37.10, 1.62, 25000],
  ['GACRUX', 12.519, -57.11, 1.64, 3600], ['BELLATRIX', 5.419, 6.35, 1.64, 22000], ['ELNATH', 5.438, 28.61, 1.65, 13600], ['MIAPLACIDUS', 9.220, -69.72, 1.67, 8900],
  ['ALNILAM', 5.604, -1.20, 1.69, 27000], ['ALNAIR', 22.137, -46.96, 1.73, 13900], ['ALNITAK', 5.679, -1.94, 1.77, 29000], ['ALIOTH', 12.900, 55.96, 1.77, 9020],
  ['DUBHE', 11.062, 61.75, 1.79, 4660], ['MIRFAK', 3.405, 49.86, 1.79, 6350], ['WEZEN', 7.140, -26.39, 1.83, 6100], ['SARGAS', 17.622, -43.00, 1.86, 7300],
  ['KAUS AUSTRALIS', 18.403, -34.38, 1.85, 9960], ['AVIOR', 8.375, -59.51, 1.86, 4000], ['ALKAID', 13.792, 49.31, 1.86, 15500], ['MENKALINAN', 5.992, 44.95, 1.90, 9350],
  ['ATRIA', 16.811, -69.03, 1.91, 4150], ['ALHENA', 6.629, 16.40, 1.93, 9260], ['PEACOCK', 20.427, -56.74, 1.94, 17000], ['POLARIS', 2.530, 89.26, 1.98, 6015],
  ['MIRZAM', 6.378, -17.96, 1.98, 25000], ['ALPHARD', 9.460, -8.66, 1.98, 4120], ['HAMAL', 2.120, 23.46, 2.00, 4480], ['ALGIEBA', 10.333, 19.84, 2.08, 4470],
  ['DIPHDA', 0.727, -17.99, 2.04, 4800], ['NUNKI', 18.921, -26.30, 2.05, 19000], ['MENKENT', 14.111, -36.37, 2.06, 4980], ['MIRACH', 1.162, 35.62, 2.05, 3840],
  ['ALPHERATZ', 0.140, 29.09, 2.06, 13800], ['RASALHAGUE', 17.582, 12.56, 2.07, 8000], ['KOCHAB', 14.845, 74.16, 2.08, 4030], ['SAIPH', 5.796, -9.67, 2.06, 26000],
  ['DENEBOLA', 11.818, 14.57, 2.13, 8500], ['ALGOL', 3.136, 40.96, 2.12, 13000], ['MIZAR', 13.399, 54.93, 2.23, 9000], ['SCHEDAR', 0.675, 56.54, 2.24, 4660],
  ['CAPH', 0.153, 59.15, 2.28, 7080], ['SADR', 20.370, 40.26, 2.23, 5790], ['ALMACH', 2.065, 42.33, 2.10, 4250], ['MERAK', 11.031, 56.38, 2.37, 9600],
  ['PHECDA', 11.897, 53.69, 2.44, 9300], ['MEGREZ', 12.257, 57.03, 3.31, 9000], ['ENIF', 21.736, 9.88, 2.39, 4380], ['SCHEAT', 23.063, 28.08, 2.42, 3690],
  ['MARKAB', 23.079, 15.21, 2.48, 9800], ['ALGENIB', 0.220, 15.18, 2.83, 21500], ['RUCHBAH', 1.430, 60.24, 2.68, 8400], ['SEGIN', 1.907, 63.67, 3.37, 14000],
  ['NAVI', 0.945, 60.72, 2.47, 25000], ['ALPHECCA', 15.578, 26.71, 2.23, 9700], ['IZAR', 14.750, 27.07, 2.37, 4550], ['DSCHUBBA', 16.006, -22.62, 2.29, 28000],
  ['ACRAB', 16.091, -19.81, 2.62, 28000], ['ANKAA', 0.438, -42.31, 2.40, 4440], ['SUHAIL', 9.133, -43.43, 2.21, 3950], ['ASPIDISKE', 9.285, -59.28, 2.25, 7400],
  ['MUHLIFAIN', 12.692, -48.96, 2.20, 10000], ['TIAKI', 22.711, -46.88, 2.07, 3500], ['DELTA CRUCIS', 12.252, -58.75, 2.79, 22000], ['ALNASL', 18.097, -30.42, 2.99, 4800],
  ['KAUS MEDIA', 18.350, -29.83, 2.70, 4500], ['ASCELLA', 19.043, -29.88, 2.60, 9600], ['LESATH', 17.513, -37.30, 2.70, 22000], ['ALBIREO', 19.512, 27.96, 3.05, 4400],
  ['ELTANIN', 17.943, 51.49, 2.24, 3930], ['RASTABAN', 17.507, 52.30, 2.79, 5160], ['MENKAR', 3.038, 4.09, 2.54, 3800], ['ZUBENELGENUBI', 14.848, -16.04, 2.75, 8000],
  ['ZUBENESCHAMALI', 15.283, -9.38, 2.61, 12000], ['UNUKALHAI', 15.738, 6.43, 2.63, 4500], ['ALCYONE', 3.791, 24.11, 2.87, 12300], ['MINTAKA', 5.533, -0.30, 2.23, 29000],
  ['MEISSA', 5.585, 9.93, 3.39, 35000], ['GIENAH', 12.263, -17.54, 2.59, 12000], ['KRAZ', 12.573, -23.40, 2.65, 5100], ['ALGORAB', 12.498, -16.52, 2.95, 10000],
  ['ARNEB', 5.546, -17.82, 2.58, 6900], ['NIHAL', 5.471, -20.76, 2.84, 5100], ['SHERATAN', 1.911, 20.81, 2.64, 8900], ['HASSALEH', 4.950, 33.17, 2.69, 4100],
  ['TEJAT', 6.383, 22.51, 2.87, 3600], ['ZOSMA', 11.235, 20.52, 2.56, 8300], ['VINDEMIATRIX', 13.036, 10.96, 2.85, 5100], ['PORRIMA', 12.694, -1.45, 2.74, 7100],
  ['COR CAROLI', 12.934, 38.32, 2.89, 11600], ['MUPHRID', 13.911, 18.40, 2.68, 6100], ['KORNEPHOROS', 16.504, 21.49, 2.78, 5000], ['SABIK', 17.173, -15.72, 2.43, 8700],
  ['TARAZED', 19.771, 10.61, 2.72, 4100], ['ALJANAH', 20.770, 33.97, 2.48, 4700], ['FAWARIS', 19.750, 45.13, 2.87, 10000], ['ALDERAMIN', 21.310, 62.59, 2.45, 7700],
  ['SADALSUUD', 21.526, -5.57, 2.87, 5700], ['SADALMELIK', 22.096, -0.32, 2.95, 5200], ['DENEB ALGEDI', 21.784, -16.13, 2.81, 7300], ['ZAURAK', 3.967, -13.51, 2.95, 3900],
  ['ACAMAR', 2.971, -40.30, 2.88, 8000], ['ATIK', 3.902, 31.88, 2.85, 21000], ['MIRA', 2.322, -2.98, 3.5, 3000], ['SKAT', 22.911, -15.82, 3.27, 9000],
];
// the galactic plane (for the faint stars and the Milky Way): the north galactic pole and the centre
const HV_GAL = { pole: hvRaDec(12.857, 27.13), centre: hvRaDec(17.761, -28.94) };
// the faint stars: a seeded sky to magnitude 6.3 (about 8,000), crowding towards the Milky Way
function hvFaintStars(n = 8000, seed = 20261028) {
  const r = new RNG(seed), out = [], gs = () => Math.sqrt(-2 * Math.log(Math.max(1e-9, r.next()))) * Math.cos(6.2832 * r.next());
  let k = 0;
  while (out.length < n && k++ < 400000) {
    const m = 6.3 + Math.log10(Math.max(1e-9, r.next())) / 0.48;
    if (m < 3.0) continue;
    const v = hvNrm([gs(), gs(), gs()]), b = Math.abs(hvDot(v, HV_GAL.pole));
    if (r.next() > 0.35 + 0.65 * Math.exp(-b * b / 0.05)) continue;
    const u = r.next(), T = u < 0.12 ? r.range(9500, 22000) : u < 0.35 ? r.range(7000, 9500) : u < 0.55 ? r.range(5600, 7000) : u < 0.85 ? r.range(4200, 5600) : r.range(3200, 4200);
    out.push([null, v, m, T]);
  }
  return out;
}
// every star with its direction (equatorial) and the moment it goes out here (Infinity: it stays)
// the planets beyond the cut tonight (J2000 places at 22:00 GMT; Saturn is 8.5 AU away, 71 light-minutes): they go out
// with the stars. (Mercury, Venus, Mars, Jupiter and the Sun are on this side: calc/planets.py)
const HV_PLANETS = [['SATURN', 0.6282, 1.133, 0.48, 5400], ['URANUS', 4.164, 20.871, 5.6, 6500], ['NEPTUNE', 0.1457, -0.596, 7.82, 7500]];
function hvStarTable() {
  const all = HV_STARS.map(([name, ra, dec, m, T]) => [name, hvRaDec(ra, dec), m, T]).concat(hvFaintStars());
  return all.map(([name, d, m, T]) => ({ name, d, m, T, t: hvStarGone(d) }))
    .concat(HV_PLANETS.map(([name, ra, dec, m, T]) => { const d = hvRaDec(ra, dec); return { name, d, m, T, t: hvStarGone(d), planet: true }; }));
}

// ---------------------------------------------------------------------------------------------------------------------
// THE CLOCK: story seconds → the time tonight (GMT)
// ---------------------------------------------------------------------------------------------------------------------
function hvClockParts(s, tz = 0) {
  const T = ((22 * 3600 + tz * 3600 + s) % 86400 + 86400) % 86400, h = Math.floor(T / 3600), m = Math.floor((T % 3600) / 60), sec = Math.floor(T % 60);
  return { h, m, s: sec, frac: T - Math.floor(T), pm: h >= 12, h12: ((h + 11) % 12) + 1, day: Math.floor((22 * 3600 + tz * 3600 + s) / 86400) };
}
function hvClockText(s, secs = false, tz = 0) { const c = hvClockParts(s, tz); return `${c.h12}:${String(c.m).padStart(2, '0')}${secs ? ':' + String(c.s).padStart(2, '0') : ''}`; }
const hvAmPm = (s, tz = 0) => (hvClockParts(s, tz).pm ? 'PM' : 'AM');
