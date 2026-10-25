/* =====================================================================
   PHYSICS — "Is it true time moves slower on your feet than your head?" Every number the film shows comes from here
   (PLAN.md § 2 lists them with their sources). Gravitational time dilation, nothing else changed:
     weak field (Earth, the Moon, a white dwarf, a neutron star's surface, the local gap between two heights):
       Δrate = g·Δh / c²                        (g measured locally, Δh the proper height difference)
     a clock deep in a star's gravity against a faraway one:  rate = √(1 − r_s / r)
     hovering just above a black hole's edge (proper distance ρ ≪ r_s):  rate ∝ ρ  →  head : feet = (ρ + h) / ρ,
       and against the far universe  rate = ρ / (2 r_s)
     light climbing out of gravity loses energy in the same ratio (it arrives redder); light falling in gains it.
   ===================================================================== */

const TFP = {
  c: 299792458, G: 6.674e-11, Msun: 1.98892e30, year: 365.25 * 86400, day: 86400,
  h: 1.7,                      // you: feet to the top of your head, m
  life: 80,                    // a lifetime, years
  gE: 9.81,                    // the Earth's surface
};
TFP.perMetre = TFP.gE / (TFP.c * TFP.c);            // 1.09e-16: the rate gained per metre climbed on Earth
TFP.gapE = TFP.perMetre * TFP.h;                    // 1.86e-16: head faster than feet

// the gap between your head and feet as a fraction of a second per second, in gravity g (m/s², measured locally)
const tfGapFrac = (g) => g * TFP.h / (TFP.c * TFP.c);
// how much younger your feet stay over a lifetime (80 years at your feet), s, where frac = head rate / feet rate − 1
// (passed as the fraction itself: 1 + 1.9e-16 can't be held in a double)
const tfLifeGap = (frac) => frac * TFP.life * TFP.year;

// ---- the places (g is the gravity you'd stand in; the stars' figures from their measured masses and radii)
TFP.moon = { g: 1.62 };
TFP.sun = { g: 274 };
// Sirius B: 1.018 solar masses, 0.00864 solar radii (6,010 km); surface ≈ 25,000 K; measured gravitational redshift
// ≈ 80 km/s (Hubble, 2005)
TFP.wd = (() => {
  const M = 1.018 * TFP.Msun, R = 0.00864 * 6.957e8, rs = 2 * TFP.G * M / TFP.c ** 2, x = rs / R;
  const g = TFP.G * M / (R * R) / Math.sqrt(1 - x);
  return { M, R, rs, x, g, gx: g / TFP.gE, rate: Math.sqrt(1 - x), frac: tfGapFrac(g), weightT: 70 * g / TFP.gE / 1000, zKms: (1 / Math.sqrt(1 - x) - 1) * TFP.c / 1000 };
})();
// a neutron star: 1.4 solar masses, radius 12 km
TFP.ns = (() => {
  const M = 1.4 * TFP.Msun, R = 12e3, rs = 2 * TFP.G * M / TFP.c ** 2, x = rs / R;
  const g = TFP.G * M / (R * R) / Math.sqrt(1 - x);
  // the share of its surface you can see at once from far away: the grazing ray's exact bending angle
  // ψ_max = ∫₀¹ dy / √((1 − x) − y²(1 − x·y)), y = R/r (integrated with y = 1 − s² to tame the end point)
  let psi = 0; for (let i = 0, N = 4000; i < N; i++) { const s = (i + 0.5) / N, y = 1 - s * s; psi += 2 * s / N / Math.sqrt((1 - x) - y * y * (1 - x * y)); }
  const cosPsiMax = Math.cos(psi);
  return { M, R, rs, x, g, gx: g / TFP.gE, rate: Math.sqrt(1 - x), blue: 1 / Math.sqrt(1 - x), frac: tfGapFrac(g), vesc: Math.sqrt(x), visible: (1 - cosPsiMax) / 2, bmax: R / Math.sqrt(1 - x) };
})();
// Sagittarius A*: 4.3 million solar masses (GRAVITY / Keck), 27,000 light-years away (8.2 kpc)
TFP.bh = (() => {
  const M = 4.3e6 * TFP.Msun, rs = 2 * TFP.G * M / TFP.c ** 2;
  return { M, rs, bc: 1.5 * Math.sqrt(3) * rs };
})();
// hovering with your feet a proper distance ρ (m) above the edge: head : feet, and the push you'd need (in g)
const tfBhRatio = (rho) => (rho + TFP.h) / rho;
const tfBhPush = (rho) => TFP.c * TFP.c / rho / TFP.gE;
// how fast the far universe runs as seen from a height ρ above the edge (×)
const tfBhOutside = (rho) => 2 * TFP.bh.rs / rho;

// ---- GPS (orbit radius 26,562 km) against a clock on the ground (on the rotating geoid): Ashby (2003) +45.7 µs/day from
// gravity, −7.1 from speed; the clocks are set to 10.229 999 995 43 MHz, 4.4647e-10 slow: 38.6 µs a day, 11.6 km of light
TFP.gps = (() => {
  const off = 4.4647e-10;
  return { alt: 26561.75 - 6371, grav: 45.7e-6, speed: 7.1e-6, net: off * TFP.day, km: off * TFP.day * TFP.c / 1000, f: 10.23e6 * (1 - off) };
})();
TFP.moonClock = 56e-6;      // s/day a clock on the Moon gains on one on the Earth (NASA, 2024: ≈ 56 µs)

// ---- light climbing out of gravity: the colour of a white glow (flat across 400–700 nm) seen after its wavelengths
// are stretched by k (k > 1 redder, k < 1 bluer), as linear RGB, with the brightness falling as k⁻⁴ (a glowing surface:
// fewer photons per second, each with less energy, and the same for its spread). Colour matching: Wyman–Sloan–Shirley
// fits of the CIE 1931 curves.
function tfCie(l) {
  const g = (x, m, s1, s2) => { const t = (x - m) / (x < m ? s1 : s2); return Math.exp(-0.5 * t * t); };
  return [1.056 * g(l, 599.8, 37.9, 31.0) + 0.362 * g(l, 442.0, 16.0, 26.7) - 0.065 * g(l, 501.1, 20.4, 26.2),
    0.821 * g(l, 568.8, 46.9, 40.5) + 0.286 * g(l, 530.9, 16.3, 31.1),
    1.217 * g(l, 437.0, 11.8, 36.0) + 0.681 * g(l, 459.0, 26.0, 13.8)];
}
function tfShiftRGB(k, l0 = 400, l1 = 700) {
  let X = 0, Y = 0, Z = 0, X0 = 0, Y0 = 0, Z0 = 0;
  for (let l = l0; l <= l1; l += 2) {
    const a = tfCie(l * k), b = tfCie(l);
    X += a[0]; Y += a[1]; Z += a[2]; X0 += b[0]; Y0 += b[1]; Z0 += b[2];
  }
  const toRGB = (x, y, z) => [3.2406 * x - 1.5372 * y - 0.4986 * z, -0.9689 * x + 1.8758 * y + 0.0415 * z, 0.0557 * x - 0.2040 * y + 1.0570 * z];
  const w = toRGB(X0, Y0, Z0), c = toRGB(X, Y, Z), dim = Math.pow(k, -4);
  return c.map((v, i) => Math.max(0, v / w[i]) * dim);
}

// ---- the black hole's sky for a camera hovering at r (in units of r_s, r > 1): where each view ray came from.
// A ray leaving the camera at angle ψ from straight up (away from the hole) has impact parameter
// b = r·sin ψ / √(1 − 1/r); traced back with u = 1/r it obeys (du/dφ)² = 1/b² − u²(1 − u). It either reaches the far
// sky after sweeping an angle φ round the hole, or falls in (black). Returns { phi: Float32Array (−1 = falls in),
// ring: how close the ray came to circling the hole (0…1), cone: the angle of the shrinking circle of sky }.
function tfBhTable(r, N = 512) {
  const phi = new Float32Array(N), ring = new Float32Array(N), lapse = Math.sqrt(1 - 1 / r), uo = 1 / r, bc = 1.5 * Math.sqrt(3);
  const Gf = (u, ib2) => ib2 - u * u * (1 - u);
  // ∫ du / √G between u0 and u1 (G > 0 inside, may vanish at one end like √): substitution u = u_t − s² near a turning
  // point keeps it smooth; here plain Simpson on a stretched variable is enough at this resolution
  const integ = (a, b, ib2, M = 160) => {
    // u = a + (b − a)·(1 − (1 − s)²): dense near b (where a turning point sits)
    let sum = 0;
    for (let i = 0; i <= M; i++) {
      const s = i / M, w = i === 0 || i === M ? 1 : (i % 2 ? 4 : 2);
      const s2 = Math.min(s, 1 - 1e-7), u = a + (b - a) * (1 - (1 - s2) * (1 - s2)), du = (b - a) * 2 * (1 - s2);
      const G = Gf(u, ib2); sum += w * (G > 0 ? du / Math.sqrt(G) : 0);
    }
    return sum / (3 * M);
  };
  // the turning point of G between u_lo and u_hi (G changes sign there), by bisection
  const root = (lo, hi, ib2) => { for (let i = 0; i < 60; i++) { const m = 0.5 * (lo + hi); if (Gf(m, ib2) > 0) lo = m; else hi = m; } return 0.5 * (lo + hi); };
  for (let i = 0; i < N; i++) {
    const psi = (i + 0.5) / N * Math.PI, sp = Math.sin(psi), cp = Math.cos(psi);
    const b = r * sp / lapse, ib2 = b > 1e-9 ? 1 / (b * b) : 1e18;
    let f = -1, rg = 0;
    if (b < 1e-6) f = cp > 0 ? 0 : -1;
    else if (cp >= 0) {
      // going out (u falls from uo to 0): inside the photon sphere (uo > 2/3) a ray with b > b_c turns back and falls in;
      // otherwise it escapes
      f = uo > 2 / 3 && b > bc ? -1 : Math.abs(integ(uo, 0, ib2));
    } else if (b > bc && uo < 2 / 3) {
      // going in from outside the photon sphere with b > b_c: it turns round where G = 0, then escapes
      const ut = root(uo, 2 / 3, ib2); f = integ(uo, ut, ib2) + integ(0, ut, ib2);
    }
    if (f >= 0) rg = Math.exp(-Math.abs(b - bc) * 9) * Math.min(1, 0.4 + Math.abs(f) / (2 * Math.PI));
    phi[i] = f; ring[i] = rg;
  }
  // the circle of sky (outward rays escape only inside it, below the photon sphere): sin ψc = b_c √(1 − 1/r) / r
  const cone = r < 1.5 ? Math.asin(Math.min(1, bc * lapse / r)) : Math.PI - Math.asin(Math.min(1, bc * lapse / r));
  return { phi, ring, cone, blue: 1 / lapse };
}

// ---- a star's colour from its surface temperature T (K): Planck's law through the same colour matching, as linear
// RGB scaled so the brightest channel is 1 (white = 6,500 K). Light falling in by a factor k arrives as a star of k·T.
function tfStarRGB(T) {
  const pl = (l, T) => { const m = l * 1e-9; return 1 / (Math.pow(m, 5) * (Math.exp(0.0143878 / (m * T)) - 1)); };
  const xyz = (T) => { let X = 0, Y = 0, Z = 0; for (let l = 380; l <= 780; l += 4) { const c = tfCie(l), p = pl(l, T); X += c[0] * p; Y += c[1] * p; Z += c[2] * p; } return [X, Y, Z]; };
  const toRGB = (v) => [3.2406 * v[0] - 1.5372 * v[1] - 0.4986 * v[2], -0.9689 * v[0] + 1.8758 * v[1] + 0.0415 * v[2], 0.0557 * v[0] - 0.2040 * v[1] + 1.0570 * v[2]];
  const w = toRGB(xyz(6500)), c = toRGB(xyz(T)), r = c.map((v, i) => Math.max(0, v / w[i]));
  const mx = Math.max(...r); return r.map((v) => v / mx);
}
