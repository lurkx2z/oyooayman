/* =====================================================================
   PHYSICS — "What if light started moving backward?" Every number the film shows comes from here (PLAN.md § 2).
   THE RULE: at 10:00:00 PM GMT every photon in the universe reverses its direction, once (in the frame of the solar
   system's centre of mass: the Sun itself wobbles round it at ~13 m/s, so in the Sun's own frame the old light would
   come back to a point drifting 0.27 AU per 50 years away from it). Matter is untouched: lamps, fires and the Sun go
   on shining as before.
   Story time s = seconds after 10:00:00 PM GMT (negative before). Directions are unit vectors in the equatorial frame
   (x: the March equinox, z: the north celestial pole) until lbToGarden() turns them into the garden's frame
   (metres, y up, −z down the garden, which faces SSE: azimuth LBP.az0).
   THE ONE IDEA EVERYTHING USES: light reversed at 10:00 retraces its path, so what reaches a point P at time t is the
   light that passed P at time −t, sent back. The Earth (or the Moon) has moved 2·v·t since then, so P sat at
   X + 2vt (relative to where the Earth was at −t). If that spot was inside the Earth, or in its shadow for a source,
   nothing comes back from that source yet: lbExitTime() is the moment it gets out.
   ===================================================================== */

const LBP = {
  R: 6371, v: 29.78, c: 299792.458,           // Earth radius (km), Earth's orbital speed (km/s), light (km/s)
  tSun: 495.85,                                 // sunlight's trip to Earth tonight (s): 0.9937 AU (late October)
  tLimb: 2.32,                                  // the Sun's radius in light-seconds: the disc's centre arrives first
  tResp: 4.0,                                   // the Sun's surface warming up to its new brightness (s, e-folding; a guess)
  lat: 51.5, lon: -0.1,                         // your garden (southern England)
  hawaii: { lat: 21.28, lon: -157.83 },         // Waikiki
  gm0: 2.298, utc0: 22,                         // GMST at 0h UT (late October, h); the reversal at 22:00:00 UT
  lam0: 213.5, eps: 23.44,                      // the Sun's ecliptic longitude tonight (°; 26 Oct 2026, 22h UT), the obliquity
  moonElong: 135, moonBeta: 2, moonDist: 384400, Rmoon: 1737.4, vMoon: 1.02,   // a waxing gibbous Moon
  az0: 150,                                     // the garden looks down to azimuth 150° (SSE)
  hgt: 0.002,                                   // your eyes: 2 m up (km)
};
LBP.tMoon = LBP.moonDist / LBP.c;               // moonlight's trip: 1.28 s
LBP.tFirst = LBP.tSun - LBP.tLimb;              // the first new sunlight (the middle of the disc, 2.3 light-s closer): 10:08:13.5

// ---- vectors (plain arrays)
const lbDot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const lbAdd = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const lbSc = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const lbLen = (a) => Math.hypot(a[0], a[1], a[2]);
const lbNrm = (a) => lbSc(a, 1 / (lbLen(a) || 1));
const lbCross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const LB_D2R = Math.PI / 180;

// ---- the sky
function lbEcl(lam, beta = 0) {
  const l = lam * LB_D2R, b = beta * LB_D2R, e = LBP.eps * LB_D2R, x = Math.cos(b) * Math.cos(l), y = Math.cos(b) * Math.sin(l), z = Math.sin(b);
  return [x, y * Math.cos(e) - z * Math.sin(e), y * Math.sin(e) + z * Math.cos(e)];
}
function lbRaDec(raH, dec) { const r = raH * 15 * LB_D2R, d = dec * LB_D2R; return [Math.cos(d) * Math.cos(r), Math.cos(d) * Math.sin(r), Math.sin(d)]; }
const lbSunLam = (s) => LBP.lam0 + 0.98565 * s / 86400;
const lbSunDir = (s) => lbEcl(lbSunLam(s));                       // towards the Sun (geocentric)
const lbVelDir = (s) => lbEcl(lbSunLam(s) - 90);                  // the Earth's velocity (the apex)
const lbGmst = (s) => LBP.gm0 + (LBP.utc0 + s / 3600) * 1.0027379;
// the local frame of a place at story time s: up, north, east (equatorial unit vectors)
function lbFrame(s, lat = LBP.lat, lon = LBP.lon) {
  const th = (lbGmst(s) + lon / 15) * 15 * LB_D2R, p = lat * LB_D2R;
  const up = [Math.cos(p) * Math.cos(th), Math.cos(p) * Math.sin(th), Math.sin(p)];
  const north = [-Math.sin(p) * Math.cos(th), -Math.sin(p) * Math.sin(th), Math.cos(p)];
  return { up, north, east: lbCross(north, up) };
}
function lbAltAz(v, F) { const u = lbDot(v, F.up), n = lbDot(v, F.north), e = lbDot(v, F.east); return { alt: Math.asin(Math.max(-1, Math.min(1, u))) / LB_D2R, az: ((Math.atan2(e, n) / LB_D2R) % 360 + 360) % 360 }; }
// an equatorial direction → the garden's frame (x right / WSW, y up, −z down the garden / SSE)
function lbToGarden(v, F) {
  const u = lbDot(v, F.up), n = lbDot(v, F.north), e = lbDot(v, F.east), a = LBP.az0 * LB_D2R;
  return [e * Math.cos(a) - n * Math.sin(a), u, -(n * Math.cos(a) + e * Math.sin(a))];
}
function lbGardenDir(az, alt) { const r = (az - LBP.az0) * LB_D2R, a = alt * LB_D2R; return [Math.sin(r) * Math.cos(a), Math.sin(a), -Math.cos(r) * Math.cos(a)]; }
function lbGardenAltAz(g) { const a = LBP.az0 * LB_D2R, e = g[0] * Math.cos(a) - g[2] * Math.sin(a), n = -g[2] * Math.cos(a) - g[0] * Math.sin(a);
  return { alt: Math.asin(Math.max(-1, Math.min(1, g[1]))) / LB_D2R, az: ((Math.atan2(e, n) / LB_D2R) % 360 + 360) % 360 }; }

// ---------------------------------------------------------------------------------------------------------------------
// THE EXIT TIME: when does reversed light from a source in direction src (towards the source) reach a point X (km,
// relative to the body's centre at 10:00)? U is twice the body's velocity (km/s), Rb its radius. The light reaching
// X at t passed X + U·t (relative to the body at −t): it must be outside the body and outside the body's shadow for
// that source (behind it, within Rb of the axis). Exact: the candidate moments are the roots of three simple
// equations; between them the answer can't change. Returns seconds (0 = at once; Infinity = never).
// ---------------------------------------------------------------------------------------------------------------------
function lbExitTime(X, src, U, Rb) {
  const s = lbNrm(src), Xp = lbAdd(X, s, -lbDot(X, s)), Up = lbAdd(U, s, -lbDot(U, s));
  const lit = (t) => { const w = lbAdd(X, U, t), wp = lbAdd(Xp, Up, t); return lbDot(w, w) >= Rb * Rb - 1e-6 && (lbDot(w, s) >= 0 || lbDot(wp, wp) >= Rb * Rb); };
  const roots = (a, b, c) => { if (Math.abs(a) < 1e-12) return Math.abs(b) < 1e-12 ? [] : [-c / b]; const D = b * b - 4 * a * c; if (D < 0) return []; const q = Math.sqrt(D); return [(-b - q) / (2 * a), (-b + q) / (2 * a)]; };
  const cand = [0,
    ...roots(lbDot(U, U), 2 * lbDot(X, U), lbDot(X, X) - Rb * Rb),
    ...roots(lbDot(Up, Up), 2 * lbDot(Xp, Up), lbDot(Xp, Xp) - Rb * Rb),
    ...roots(0, lbDot(U, s), lbDot(X, s)),
  ].filter((t) => t >= 0 && isFinite(t)).sort((a, b) => a - b);
  cand.push(1e9);
  if (lit(1e-7)) return 0;
  for (let i = 0; i < cand.length - 1; i++) { const m = 0.5 * (cand[i] + cand[i + 1]); if (cand[i + 1] - cand[i] > 1e-9 && lit(m)) return cand[i]; }
  return Infinity;
}
// a place on Earth at story time 0, height h km: its position (km) and the Earth's U
function lbEarthPoint(F, h = LBP.hgt) { return lbSc(F.up, LBP.R + h); }
const lbEarthU = () => lbSc(lbVelDir(0), 2 * LBP.v);

// ---------------------------------------------------------------------------------------------------------------------
// THE SUN. lbSunGain(τ): how bright the Sun's surface is τ seconds after 10:00 (as it sent the light, ×1 before): its
// old light starts landing on it at once and its surface warms until it sends out both (×2). lbSunSeen(s, place):
// the real Sun as a place sees it: { k: disc brightness ×, r: the part of the disc that has arrived (0…1, the centre
// first), on: any light at all }. The Sun's light in flight at 10:00 turned back, so from 10:00:00 until it has sent
// more and that has crossed the gap (8 min 16 s), there is none.
// ---------------------------------------------------------------------------------------------------------------------
const lbSunGain = (tau) => (tau <= 0 ? 1 : 1 + (1 - Math.exp(-tau / LBP.tResp)));
function lbSunSeen(s) {
  if (s < 0) return { k: 1, r: 1, on: 1 };
  const tau = s - LBP.tFirst;                                     // since the first new light reached the Earth
  if (tau <= 0) return { k: 0, r: 0, on: 0 };
  const u = Math.min(1, tau / LBP.tLimb), r = Math.sqrt(Math.max(0, 1 - (1 - u) * (1 - u)));   // (the centre is closest)
  return { k: lbSunGain(tau), r, on: 1 };
}
// the second Sun: old sunlight coming back from the opposite side. On at your place at LB_SKY.on; it shows the Sun as
// it was when that light left it (s − 2·its age): emitted at 10:00:00 − (s + tSun)
const lbSecondShows = (s) => -(s + LBP.tSun);                     // story seconds (negative: before 10 PM)

// ---------------------------------------------------------------------------------------------------------------------
// THE NIGHT AT 10 PM (s = 0, the garden): where things are, and when the reversed light of each reaches you
// ---------------------------------------------------------------------------------------------------------------------
const LB_SKY = (() => {
  const F = lbFrame(0), S = lbSunDir(0), V = lbVelDir(0), U = lbEarthU(), X = lbEarthPoint(F);
  const lm = LBP.lam0 + LBP.moonElong, M = lbEcl(lm, LBP.moonBeta);
  const o = { F, S, V, U, X, M, lamMoon: lm };
  o.on = lbExitTime(X, S, U, LBP.R);                               // ★ the second Sun switches on here (80.35 s)
  o.sun2 = lbAltAz(lbSc(S, -1), F); o.moon = lbAltAz(M, F); o.apex = lbAltAz(V, F);
  // (where you leave the shadow: the direction e of the edge you cross; the second Sun's disc arrives from −e)
  { const w = lbAdd(X, U, o.on); o.edge = lbNrm(lbAdd(w, S, -lbDot(w, S))); }
  return o;
})();
// the time the reversed light from a source in direction src reaches a place (default: your garden)
const lbAppearAt = (src, X = LB_SKY.X) => lbExitTime(X, src, LB_SKY.U, LBP.R);
// the time the air at height h km, D km away along azimuth az, gets the second Sun's light (the glow before it rises)
function lbAirOn(az, D, h, F = LB_SKY.F) {
  const a = az * LB_D2R, hd = lbAdd(lbSc(F.north, Math.cos(a)), F.east, Math.sin(a)), g = D / LBP.R;
  return lbExitTime(lbSc(lbAdd(lbSc(F.up, Math.cos(g)), hd, Math.sin(g)), LBP.R + h), LB_SKY.S, LB_SKY.U, LBP.R);
}

// ---------------------------------------------------------------------------------------------------------------------
// THE MOON tonight: a waxing gibbous, 135° from the Sun. A point of its surface with outward normal n (equatorial):
//   the day side (n·S > 0): dark from 10:00:00 (the sunlight on its way there turned back) until new sunlight arrives
//     (tSun + 0.91 s further from the Sun) and its light gets here (1.28 s): 10:08:18, then ×2 as the Sun brightens
//   the night side: lit by the old sunlight coming back the other way once that point is out of the Moon's own shadow
//     (the same rule; the Moon moves at 29.8 + 1.0 km/s), seen 1.28 s later
// ---------------------------------------------------------------------------------------------------------------------
const LB_MOON = (() => {
  const S = LB_SKY.S, M = LB_SKY.M, vel = lbAdd(lbSc(LB_SKY.V, LBP.v), lbEcl(LB_SKY.lamMoon + 90), LBP.vMoon);
  const extra = -lbDot(M, S) * LBP.moonDist / LBP.c;              // the Moon is this much further from the Sun (s)
  return { U: lbSc(vel, 2), dayBack: LBP.tSun + extra + LBP.tMoon, extra };
})();
// the Moon's day side between 10:00:00 and 10:08:18: lit only by its own reflected light falling back (its albedo,
// ≈ 11 %, while the Moon still sits where that light left from; less as it moves on at 2 × 30.8 km/s), seen 1.28 s later
function lbMoonGhost(s) {
  const tau = s - LBP.tMoon; if (tau <= 0) return 0;
  const k = 2 * (LBP.v + LBP.vMoon) * tau / LBP.Rmoon; return 0.11 / (1 + k * k);
}
// the same for the Earth's day side seen from space: lit by its own reflected sunlight (albedo ≈ 0.3) falling back
function lbEarthGhost(s) { if (s <= 0) return 0; const k = 2 * LBP.v * s / LBP.R; return 0.3 / (1 + k * k); }
function lbMoonPoint(n) {                                          // n: unit normal (equatorial) → { day, t (seen here) }
  const S = LB_SKY.S;
  if (lbDot(n, S) >= 0) return { day: 1, t: LB_MOON.dayBack };
  return { day: 0, t: lbExitTime(lbSc(n, LBP.Rmoon * (1 + 1e-7)), S, LB_MOON.U, LBP.Rmoon) + LBP.tMoon };
}

// ---------------------------------------------------------------------------------------------------------------------
// STARS: [name, RA h, Dec °, magnitude, temperature K]. A star's own light (if it is up) goes at 10:00:00 and won't be
// back for years (its new light is years away). Its light that had already passed the Earth comes back from the
// opposite direction: a mirror image at −dir, which you see once you are out of the Earth's shadow for that star.
// ---------------------------------------------------------------------------------------------------------------------
const LB_STARS = [
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
const LB_GAL = { pole: lbRaDec(12.857, 27.13), centre: lbRaDec(17.761, -28.94) };
// the faint stars: a seeded sky to magnitude 6.3 (about 8,000), crowding towards the Milky Way
function lbFaintStars(n = 8000, seed = 20261026) {
  const r = new RNG(seed), out = [], gs = () => Math.sqrt(-2 * Math.log(Math.max(1e-9, r.next()))) * Math.cos(6.2832 * r.next());
  let k = 0;
  while (out.length < n && k++ < 400000) {
    const m = 6.3 + Math.log10(Math.max(1e-9, r.next())) / 0.48;
    if (m < 3.0) continue;
    const v = lbNrm([gs(), gs(), gs()]), b = Math.abs(lbDot(v, LB_GAL.pole));
    if (r.next() > 0.35 + 0.65 * Math.exp(-b * b / 0.05)) continue;
    const u = r.next(), T = u < 0.12 ? r.range(9500, 22000) : u < 0.35 ? r.range(7000, 9500) : u < 0.55 ? r.range(5600, 7000) : u < 0.85 ? r.range(4200, 5600) : r.range(3200, 4200);
    out.push([null, v, m, T]);
  }
  return out;
}
// every star with its direction (equatorial) and the moment its mirror image appears at a place (X, km)
function lbStarTable(X = LB_SKY.X) {
  const all = LB_STARS.map(([name, ra, dec, m, T]) => [name, lbRaDec(ra, dec), m, T]).concat(lbFaintStars());
  return all.map(([name, d, m, T]) => ({ name, d, m, T, t: lbAppearAt(d, X) }));
}

// ---------------------------------------------------------------------------------------------------------------------
// THE CLOCK: story seconds → the time tonight (GMT; Hawaii is 10 hours behind)
// ---------------------------------------------------------------------------------------------------------------------
function lbClockParts(s, tz = 0) {
  const T = ((22 * 3600 + tz * 3600 + s) % 86400 + 86400) % 86400, h = Math.floor(T / 3600), m = Math.floor((T % 3600) / 60), sec = Math.floor(T % 60);
  return { h, m, s: sec, frac: T - Math.floor(T), pm: h >= 12, h12: ((h + 11) % 12) + 1, day: Math.floor((22 * 3600 + tz * 3600 + s) / 86400) };
}
function lbClockText(s, secs = false, tz = 0) { const c = lbClockParts(s, tz); return `${c.h12}:${String(c.m).padStart(2, '0')}${secs ? ':' + String(c.s).padStart(2, '0') : ''}`; }
const lbAmPm = (s, tz = 0) => (lbClockParts(s, tz).pm ? 'PM' : 'AM');
// a story time for a clock time tonight (GMT): hh (0–23, the next morning if before 22), mm, ss
const lbAt = (hh, mm = 0, ss = 0) => { let T = hh * 3600 + mm * 60 + ss - 22 * 3600; if (T < -2 * 3600) T += 86400; return T; };
// "1 min 20 s", "8 min 16 s", "2 hours"
function lbFmtSince(s) {
  if (s < 60) return Math.floor(s) + ' s';
  if (s < 3600) { const m = Math.floor(s / 60), r = Math.floor(s - 60 * m); return `${m} min ${String(r).padStart(2, '0')} s`; }
  if (s < 86400 * 2) return (s / 3600).toFixed(s < 36000 ? 1 : 0) + ' HOURS';
  return Math.round(s / 86400) + ' DAYS';
}
