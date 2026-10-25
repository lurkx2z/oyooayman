/* =====================================================================
   PHYSICS — the one rule of "What if the universe kept shrinking and couldn't stop?" and everything that follows
   from it. Pure functions of NIGHT time n (seconds after 19:30:00 tonight, when it starts); script.js maps film time
   to n. Works in the page and in Node (build-timing.cjs and the checks in PLAN.md § 2 use it too).

   The rule (a thought experiment, said on screen). From 7:30 space shrinks: every free distance in the universe is
   multiplied by a(n) = 1 / s(n), and s, the shrink, grows without limit, reaching infinity at midnight (a "Big
   Crunch"). Things held together (atoms, you, the Earth, the solar system, the Milky Way) keep their size. Its rate
   |H| = ṡ / s starts at zero and keeps rising:
       |H|(n) = b·n + h·[1/(R − n) − 1/R − n/R²]                    R = 4.5 h, h = 4/3, b = 3.4e-8 /s²
   (the last term is the mirror of the textbook phantom rip, started from rest at 7:30, so that midnight is the end;
   b·n is the onset). ln s has a closed form (ucLnS). Everything else is computed from s:
     · the squeeze       light crossing shrinking space is squeezed: anything that set out before 7:30 arrives
                         with every wavelength divided by s(n). A blackbody of temperature θ squeezed by s looks
                         EXACTLY like a blackbody of θ·s (same angular size): stars turn whiter, then bluer, and
                         brighter. Fresh light (the Moon's, a second old; the Sun's) is not squeezed.
     · what fills space  the light of every galaxy that ever shone (the extragalactic background light, mostly far
                         infrared from warm dust) and the Big Bang's afterglow (the cosmic microwave background,
                         2.7255 K). Squeezed by s: wavelengths ÷ s, so νIν(λ) → s⁴·νIν(λ·s); the afterglow stays a
                         blackbody at 2.7255·s K. Both are invisible tonight and both slide into the colours you can
                         see: the dark between the stars starts to glow, then the whole sky.
     · heat              the sky radiates σ·T⁴ (afterglow + background light) onto everything; things warm towards
                         it at a rate set by how much heat they hold (ucThermal: frost, grass, the fence, the bird
                         bath, brick, glass…). Fire needs air: the air is still here, so dry things burn.
     · the past, reversed  space at shrink s is as hot as the whole universe was when it was 1/s of today's size
                         (redshift z = s − 1); ucAgeAtZ gives the age of the universe then (ΛCDM, Planck 2018).
   ===================================================================== */

const UCP = {
  c: 299792458, R: 4.5 * 3600, h: 4 / 3, b: 3.4e-8,
  T0: 2.7255,                                 // the afterglow today (K)
  sigma: 5.670374e-8, hP: 6.62607e-34, kB: 1.380649e-23,
  onset: 19.5 * 3600,                         // 19:30:00, as seconds after midnight the day before
  H0: 67.7, Om: 0.311, Or: 9.1e-5,            // ΛCDM (Planck 2018) for "the past, reversed"
};

function ucH(n) { if (n <= 0) return 0; const R = UCP.R, D = Math.max(1e-30, R - n); return UCP.b * n + UCP.h * (1 / D - 1 / R - n / (R * R)); }
// ln s(n), s(0) = 1 (exact integral of ucH); near midnight s ∝ (time left)^(−h)
function ucLnS(n) {
  if (n <= 0) return 0;
  const R = UCP.R, x = Math.min(n / R, 1 - 1e-30);
  return 0.5 * UCP.b * n * n + UCP.h * (-Math.log1p(-x) - x - 0.5 * x * x);
}
// ln s from the time LEFT to midnight (s, keeps precision in the last second)
function ucLnSLeft(left) {
  const R = UCP.R, x = 1 - left / R, n = R - left;
  return 0.5 * UCP.b * n * n + UCP.h * (Math.log(R / Math.max(1e-300, left)) - x - 0.5 * x * x);
}
function ucShrink(n) { return Math.exp(ucLnS(n)); }
function ucHalve(n) { const H = ucH(n); return H > 0 ? Math.LN2 / H : Infinity; }       // the halving time (s)
// the night time at which s reaches S (bisection; s rises monotonically)
function ucNightForS(S) { const L = Math.log(S); let lo = 0, hi = UCP.R * (1 - 1e-15); for (let i = 0; i < 200; i++) { const m = 0.5 * (lo + hi); if (ucLnS(m) < L) lo = m; else hi = m; } return 0.5 * (lo + hi); }
// the time left at which s reaches S (for the last minutes)
function ucLeftForS(S) { const L = Math.log(S); let lo = 1e-30, hi = UCP.R; for (let i = 0; i < 400; i++) { const m = Math.sqrt(lo * hi); if (ucLnSLeft(m) > L) lo = m; else hi = m; } return Math.sqrt(lo * hi); }

// ---- the afterglow
const ucSpaceK = (s) => UCP.T0 * s;                                   // the temperature of space itself (K)

// ---- light, as the eye sees it
// photopic sensitivity V(λ) (λ in nm), a two-sided Gaussian fit
function ucPhot(l) { const q = (l - 559) / (l < 559 ? 41.9 : 41.4); return Math.exp(-0.5 * q * q); }
// a blackbody's spectral radiance B_λ (W m⁻² sr⁻¹ m⁻¹), λ in m
function ucBl(lm, T) { const x = 1.4388e-2 / (lm * T); if (x > 700) return 0; return 1.191043e-16 / (Math.pow(lm, 5) * Math.expm1(x)); }
// a blackbody's luminance (cd/m²)
function ucBBLum(T) { if (!(T > 250)) return 0; let s = 0; for (let l = 380; l <= 780; l += 5) s += ucBl(l * 1e-9, T) * ucPhot(l) * 5e-9; return 683 * s; }
// the colour (linear sRGB, max channel 1) of a blackbody at θ (CIE 1931 fit, as in the slow-light film's kit)
function ucBBRGB(th) { return ucSpecRGB((l) => ucBl(l * 1e-9, Math.max(th, 300))); }
// the colour (linear sRGB, max 1) of any spectrum f(λ nm)
function ucSpecRGB(f) {
  const g = (l, m, s1, s2) => { const q = (l - m) / (l < m ? s1 : s2); return Math.exp(-0.5 * q * q); };
  let X = 0, Y = 0, Z = 0;
  for (let l = 380; l <= 780; l += 5) {
    const B = f(l);
    X += B * (1.056 * g(l, 599.8, 37.9, 31) + 0.362 * g(l, 442, 16, 26.7) - 0.065 * g(l, 501.1, 20.4, 26.2));
    Y += B * (0.821 * g(l, 568.8, 46.9, 40.5) + 0.286 * g(l, 530.9, 16.3, 31.1));
    Z += B * (1.217 * g(l, 437, 11.8, 36) + 0.681 * g(l, 459, 26, 13.8));
  }
  const r = 3.2406 * X - 1.5372 * Y - 0.4986 * Z, gg = -0.9689 * X + 1.8758 * Y + 0.0415 * Z, bb = 0.0557 * X - 0.204 * Y + 1.057 * Z;
  const m = Math.max(r, gg, bb, 1e-300);
  return [Math.max(0, r / m), Math.max(0, gg / m), Math.max(0, bb / m)];
}
// the visible brightness of a blackbody θ, per unit area (relative units), for star magnitudes
function ucBBVis(th) { if (!(th > 200)) return 0; let s = 0; for (let l = 380; l <= 780; l += 5) s += ucBl(l * 1e-9, th) * ucPhot(l); return s * 1e-20; }

// ---- what fills space: the light of every galaxy (νIν, nW m⁻² sr⁻¹, at λ µm, as measured today) — starlight
// (≈ 1 µm), warm dust (≈ 12 µm), cold dust (≈ 150 µm). Fits to the measured background (Driver 2016, Dole 2006,
// Hill 2018), good to a factor of about 1.5. Total ≈ 65 nW m⁻² sr⁻¹ (the afterglow: ≈ 960).
const UC_EBL = [[14, 1.1, 0.95], [3, 12, 0.9], [16, 150, 0.65]];
function ucEBL0(lum) { let v = 0; for (const [A, l0, sg] of UC_EBL) { const q = Math.log(lum / l0) / sg; v += A * Math.exp(-0.5 * q * q); } return v; }
// the Milky Way's cold dust (18 K, emissivity ∝ ν^1.8), νIν at λ µm in the same units, along its band (×1) and in the
// dark lanes (UC_LANE ×); the band is about 30× the background at its far-infrared peak (IRAS/Planck maps)
const UC_DUST = { T: 18, beta: 1.8, band: 30, lane: 3.2 };
function ucDust0(lum) {
  const f = (lu) => { const lm = lu * 1e-6, x = 1.4388e-2 / (lm * UC_DUST.T); return x > 700 ? 0 : Math.pow(1 / lm, 4 + UC_DUST.beta) / Math.expm1(x); };
  return UC_DUST.band * 16 * f(lum) / f(160);
}
// a squeezed diffuse source: luminance (cd/m²) and colour, given νIν0(λ µm) and the shrink s
function ucSqueezed(nuI0, s) {
  let Y = 0;
  const L = (l) => { const lu = l * 1e-3; return Math.pow(s, 4) * nuI0(lu * s) * 1e-9 / (l * 1e-9); };   // W m⁻² sr⁻¹ m⁻¹
  for (let l = 380; l <= 780; l += 5) Y += L(l) * ucPhot(l) * 5e-9;
  return { lum: 683 * Y, rgb: ucSpecRGB(L) };
}
// the sky tonight at shrink s (no Moon, no stars): luminance and colour of each part, and the heat it sends down
function ucSkyAt(s) {
  const T = ucSpaceK(s), cmbL = ucBBLum(T), ebl = ucSqueezed(ucEBL0, s), dust = ucSqueezed(ucDust0, s);
  const lum = cmbL + ebl.lum, w = cmbL / Math.max(1e-300, lum), crgb = T > 300 ? ucBBRGB(T) : [1, 0.3, 0.1];
  const rgb = [0, 1, 2].map((k) => w * crgb[k] + (1 - w) * ebl.rgb[k]), m = Math.max(...rgb);
  // the heat: the afterglow (σT⁴) and the background light (≈ 65 nW m⁻² sr⁻¹ × π × s⁴), both from the whole sky
  const flux = UCP.sigma * Math.pow(T, 4) + 65e-9 * Math.PI * Math.pow(s, 4);
  return { T, lum, rgb: rgb.map((x) => x / m), cmbLum: cmbL, eblLum: ebl.lum, dustLum: dust.lum, dustRGB: dust.rgb, flux, Teff: Math.pow(flux / UCP.sigma, 0.25) };
}
// the sky's surface brightness (magnitudes per square arcsecond) for a luminance (cd/m²), and the faintest star you
// can see against it (Schaefer's fit; 6.6 under a dark sky)
const ucSB = (L) => 12.58 - 2.5 * Math.log10(Math.max(1e-30, L));
function ucLimitMag(L) { return 7.93 - 5 * Math.log10(Math.pow(10, 4.316 - ucSB(L) / 5) + 1); }
// how many magnitudes brighter a star of temperature θ looks, squeezed by s (negative = brighter)
function ucStarDm(th, s) { const a = ucBBVis(th), b = ucBBVis(th * s); return b > 0 && a > 0 ? -2.5 * Math.log10(b / a) : 0; }

// ---- the past, reversed: the age of the universe (years) when it was 1/s of today's size (z = s − 1)
function ucAgeAtS(s) {
  const H0 = UCP.H0 * 1000 / 3.0857e22, Om = UCP.Om, Or = UCP.Or, OL = 1 - Om - Or;
  // t = ∫ da / (a H(a)) from 0 to 1/s, in u = ln a (Simpson, from a = 1e-16)
  const a1 = 1 / s, u0 = Math.log(1e-16), u1 = Math.log(a1), N = 2000, du = (u1 - u0) / N;
  const f = (u) => { const a = Math.exp(u); return 1 / Math.sqrt(Or / (a ** 4) + Om / (a ** 3) + OL); };
  let S = f(u0) + f(u1); for (let i = 1; i < N; i++) S += f(u0 + i * du) * (i % 2 ? 4 : 2);
  // (the part before a = 1e-16, radiation only: t = a² / (2 H0 √Or))
  const t = S * du / 3 / H0 + 1e-32 / (2 * H0 * Math.sqrt(Or));
  return t / 3.156e7;
}

// ---- heat: how things in the garden warm up under the sky (lumped: one temperature per kind of thing)
// C (J m⁻² K⁻¹) the heat held per square metre of surface, f the share of sky it sees, k (W m⁻² K⁻¹) the heat it
// loses into what's under or behind it (soil, the rest of the wall, the air) at T0, boil: a latent plateau.
// Each burns (if it can) once it passes ign (K); then it is char, which keeps warming.
const UC_STUFF = {
  frost: { C: 500, f: 0.6, k: 9, T0: 271.0, melt: 273.15 },             // grass blades with frost on them
  grass: { C: 900, f: 0.6, k: 9, T0: 271.0, ign: 600 },                 // the lawn, damp (it must dry first)
  leaves: { C: 250, f: 0.9, k: 2, T0: 271.0, ign: 530 },                // dry fallen leaves, paper
  fence: { C: 9000, f: 0.5, k: 2, T0: 271.5, ign: 590 },                // 18 mm softwood boards (the outer half)
  shed: { C: 9000, f: 0.7, k: 2, T0: 271.5, ign: 590 },
  tree: { C: 3000, f: 0.8, k: 3, T0: 271.5, ign: 600 },                 // twigs and leaves
  water: { C: 3.3e5, f: 0.95, k: 3, T0: 273.15, boil: 373.15, L: 1.8e8, ice: 1.7e6 }, // the bird bath: 8 cm of water under 5 mm of ice
  glass: { C: 8000, f: 0.5, k: 6, T0: 285, soft: 950 },                 // window panes (warm room behind)
  brick: { C: 4.2e4, f: 0.5, k: 8, T0: 275 },                           // the outer 3 cm of the walls
  roof: { C: 3.0e4, f: 0.9, k: 4, T0: 272 },                            // concrete tiles
  metal: { C: 7000, f: 0.8, k: 1, T0: 271.5 },                          // the bistro table (2 mm steel)
  scope: { C: 2400, f: 0.8, k: 1, T0: 271.5, melt: 933 },               // the telescope's aluminium tube
  soil: { C: 6e4, f: 1.0, k: 25, T0: 276 },                             // the ground under the lawn
  stone: { C: 5e4, f: 0.9, k: 15, T0: 275 },                            // the patio slabs, the wall's coping
};
// integrate every kind of thing over the night (deterministic: fixed steps in log time-left near the end). → a table
// of { n, T{kind} } sampled densely; ucTempAt(kind, n) reads it back.
let UC_THERM = null;
function ucThermal() {
  if (UC_THERM) return UC_THERM;
  const kinds = Object.keys(UC_STUFF), st = {}, rows = [];
  for (const k of kinds) st[k] = { T: UC_STUFF[k].T0, q: 0, qi: 0 };
  const sig = UCP.sigma, eps = 0.92;
  // the night sky before tonight is cold (an effective −35 °C through the air): that is why frost forms
  const skyT = (n) => { const Ts = ucSkyAt(ucShrink(n)).Teff; return Math.pow(Math.pow(238, 4) + Math.pow(Ts, 4), 0.25); };
  let n = 0;
  const push = () => { const r = { n, ice: st.water.qi / UC_STUFF.water.ice, dry: st.water.q / UC_STUFF.water.L }; for (const k of kinds) r[k] = st[k].T; rows.push(r); };
  push();
  while (n < UCP.R - 1e-4) {
    const left = UCP.R - n, dn = Math.min(30, Math.max(1e-5, left * 0.004));
    const Ts = skyT(n + dn / 2), Ts4 = Math.pow(Ts, 4);
    for (const k of kinds) {
      const P = UC_STUFF[k], S = st[k];
      const net = eps * sig * P.f * (Ts4 - Math.pow(S.T, 4)) - P.k * (S.T - P.T0);
      let dT = net * dn / P.C;
      if (P.ice && S.qi < P.ice) { S.qi += Math.max(0, net * dn); continue; }            // (the ice skin melts first, at 0 °C)
      if (P.boil && S.T + dT > P.boil && S.q < P.L) { const room = Math.max(0, P.boil - S.T); S.q += Math.max(0, net * dn - room * P.C); dT = room; }
      if (P.melt && k === 'frost' && S.T < P.melt && S.T + dT > P.melt) { S.T = P.melt; continue; }
      S.T = Math.max(150, S.T + dT);
      // implicit cap: never past the sky (radiative balance), which also keeps the big steps stable
      if (S.T > Ts && net > 0) S.T = Ts;
    }
    n += dn; push();
  }
  UC_THERM = { kinds, rows, N: rows.length };
  return UC_THERM;
}
function ucTempAt(kind, n) {
  const R = ucThermal().rows; if (n <= 0) return kind === 'ice' || kind === 'dry' ? 0 : UC_STUFF[kind].T0;
  let lo = 0, hi = R.length - 1; if (n >= R[hi].n) return R[hi][kind];
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (R[m].n <= n) lo = m; else hi = m; }
  const u = (n - R[lo].n) / Math.max(1e-12, R[hi].n - R[lo].n); return R[lo][kind] + (R[hi][kind] - R[lo][kind]) * u;
}
// the night time something first reaches temperature T (or Infinity)
function ucNightForTemp(kind, T) { const R = ucThermal().rows; for (let i = 1; i < R.length; i++) if (R[i][kind] >= T) return R[i - 1].n + (R[i].n - R[i - 1].n) * (T - R[i - 1][kind]) / Math.max(1e-9, R[i][kind] - R[i - 1][kind]); return Infinity; }

// ---- the starlight of our own galaxy, and the Moon
// the Milky Way's band at its brightest (Cygnus, overhead at 7:30): 21.0 mag per square arcsecond of old light from a
// ≈ 4,800 K population; squeezed, it brightens like that population's blackbody at 4,800·s
const UC_MW = { SB: 21.0, T: 4800 };
const ucMWLum = (s) => Math.pow(10, (12.58 - UC_MW.SB) / 2.5) * Math.pow(10, -0.4 * ucStarDm(UC_MW.T, s));
// the night sky's own glow at the garden (airglow, zodiacal light, the town's light on the haze): 21.1 mag/arcsec²,
// so the faintest star you can see from the garden tonight is magnitude ≈ 6.2
const UC_NIGHT_L = 4e-4;
// moonlight is sunlight that left the Sun 8 minutes ago (and the Moon 1.3 s ago): it is squeezed only by how much space
// shrank in those 500 s
const ucMoonSqueeze = (n) => n <= 0 ? 1 : Math.exp(ucLnS(n) - ucLnS(Math.max(0, n - 500.3)));
const ucMoonLum = (n) => 2500 * ucBBVis(5772 * ucMoonSqueeze(n)) / ucBBVis(5772);      // the full Moon's face (cd/m²)
// how many stars you can see from the garden (above the horizon), at shrink s against a sky of luminance L: each kind
// of star brightens by its own amount (ucStarDm); the count of stars brighter than m above the horizon is ≈ ½·10^(0.95 +
// 0.45 m), flattening fainter than magnitude 9
const UC_STAR_MIX = [[15000, 0.08], [9000, 0.2], [6800, 0.17], [5600, 0.15], [4500, 0.3], [3500, 0.1]];
const ucCountTo = (m) => 0.5 * Math.pow(10, 0.95 + 0.45 * Math.min(m, 9) + 0.35 * Math.max(0, m - 9));
function ucStarCount(s, L) {
  const lim = ucLimitMag(L) - 0.3;                 // (≈ the air's dimming, on average over the sky)
  let N = 0;
  for (const [T, w] of UC_STAR_MIX) { const m = lim - ucStarDm(T, s); if (m > -1.6) N += w * ucCountTo(m) * MathX_sm(m, -1.6, -0.6); }
  return N;
}
function MathX_sm(x, a, b) { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); }

// ---- what you see: the eye adapts. A surface of luminance L (cd/m²) is shown at E(A)·L, where A is what the eye is
// adapted to (the sky, or the moonlit garden at night). E falls as A rises, so a sky a billion times brighter is shown
// only a little brighter; what makes it look brighter is everything else losing out to it (lamps, shadows, stars).
// V(A) = how bright a surface at the adapted level is shown (a table in log10 A)
const UC_V = [[-1.3, 0.25], [-0.3, 0.4], [0.7, 0.55], [2, 0.68], [4, 0.85], [6, 0.97], [9, 1.08], [13, 1.15]];
function ucVdisp(A) {
  const x = Math.log10(Math.max(1e-6, A)), K = UC_V;
  if (x <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (x <= K[i][0]) { const u = (x - K[i - 1][0]) / (K[i][0] - K[i - 1][0]); return K[i - 1][1] + (K[i][1] - K[i - 1][1]) * u; }
  return K[K.length - 1][1];
}
const UC_ADAPT0 = 0.05;                            // the moonlit garden (cd/m²): the eye's level at night
const ucExpoFor = (A) => ucVdisp(A) / A;               // display per cd/m², adapted to A

// ---- the sky tonight at night time n, everything the picture needs (cached per n)
const UC_SKYN = new Map();
function ucSkyNow(n) {
  const key = Math.max(0, n);
  const hit = UC_SKYN.get(key); if (hit) return hit;
  const s = ucShrink(key), sky = ucSkyAt(s), mw = ucMWLum(s);
  const L = UC_NIGHT_L + sky.lum;                  // the sky between the stars (no band, no Moon)
  const Lavg = L + 0.16 * mw + 0.05 * sky.dustLum; // the whole sky's average, the band included (it lights the garden)
  const o = { n: key, s, T: sky.T, C: sky.T - 273.15, L, Lavg, mw, mwRGB: ucBBRGB(UC_MW.T * s), ebl: sky.eblLum, eblRGB: sky.rgb, cmb: sky.cmbLum,
    cmbRGB: sky.T > 300 ? ucBBRGB(sky.T) : [1, 0.3, 0.1], dust: sky.dustLum, dustRGB: sky.dustRGB, flux: sky.flux, Teff: sky.Teff,
    lim: ucLimitMag(L), stars: ucStarCount(s, L), moonQ: ucMoonSqueeze(key), moonL: ucMoonLum(key), moonRGB: ucBBRGB(5772 * ucMoonSqueeze(key)) };
  // (the colour of the sky between the stars: the night glow, the light of every galaxy, the afterglow, by luminance)
  const mix = [0, 1, 2].map((k) => (UC_NIGHT_L * [0.55, 0.62, 0.85][k] + sky.eblLum * sky.rgb[k] + sky.cmbLum * o.cmbRGB[k]) / L);
  const mm = Math.max(...mix); o.rgb = mix.map((x) => x / mm);
  // what the eye adapts to: the sky between the stars and some of the band overhead (often out of the frame)
  o.A = UC_ADAPT0 + L + 0.1 * mw + 0.02 * sky.dustLum;
  o.E = ucExpoFor(o.A);
  if (UC_SKYN.size > 4000) UC_SKYN.clear();
  UC_SKYN.set(key, o);
  return o;
}

// ---- the milestones of the temperature of space (for the readout's NEXT line): [K, what]
const UC_MILESTONES = [[273.15, 'ICE MELTS'], [310.15, 'BODY HEAT'], [373.15, 'WATER BOILS'], [933.47, 'ALUMINIUM MELTS'], [1811, 'IRON MELTS'],
  [3000, 'THE BIG BANG\'S LIGHT, AS IT WAS MADE'], [5772, 'THE SURFACE OF THE SUN'], [1.57e7, 'THE CORE OF THE SUN']];
// the night time space reaches temperature T (K)
function ucNightForK(T) { const S = T / UCP.T0; return S < 1e5 ? ucNightForS(S) : UCP.R - ucLeftForS(S); }

if (typeof module !== 'undefined') module.exports = { UCP, UC_STUFF, ucH, ucLnS, ucLnSLeft, ucShrink, ucHalve, ucNightForS, ucLeftForS, ucSpaceK, ucPhot, ucBl, ucBBLum, ucBBRGB, ucSpecRGB, ucBBVis, ucEBL0, ucDust0, ucSqueezed, ucSkyAt, ucSB, ucLimitMag, ucStarDm, ucAgeAtS, ucThermal, ucTempAt, ucNightForTemp, UC_MW, ucMWLum, UC_NIGHT_L, ucMoonSqueeze, ucMoonLum, ucStarCount, ucVdisp, ucExpoFor, ucSkyNow, UC_MILESTONES, ucNightForK, UC_ADAPT0 };
