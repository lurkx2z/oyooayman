/* =====================================================================
   PHYSICS — the one rule of "What if the universe kept expanding faster and faster?" and everything that follows from
   it. Pure functions of NIGHT time n (seconds after 19:30:00 tonight, when it starts); script.js maps film time to n.
   Works in the page and in Node (build-timing.cjs / the checks in PLAN.md use it too).

   The rule. Space grows by a scale factor a(n) (a = 1 at 19:30). Its growth rate H = ȧ/a starts at today's value and
   rises without limit, reaching infinity at midnight (a "Big Rip"):
       H(n) = H0 + b·n + h·[1/(R − n) − 1/R − n/R²]                 R = 4.5 h, h = 4/3, b = 1.5e-8 /s²
   The last term is the classic phantom-energy rip (w = −1.5: H = h/(time left)), started from rest tonight; the b·n
   term is the onset. ln a(n) = ∫ H dn has a closed form. Everything else is computed from H:
     · doubling time        T = ln 2 / H                        (the readout)
     · the edge             c / H: beyond it, space carries things away faster than light; nothing out there can ever
                            reach you again (with H rising, the true event horizon is even closer)
     · the pull             a free thing at distance r from a centre feels the expansion as an outward pull
                            (ä/a)·r, with ä/a = Ḣ + H². A system comes apart when this beats what holds it.
                            Your weight: g − (ä/a)·R⊕. The air presses down with its weight, so pressure ∝ weight.
     · the stretch          light crossing growing space is stretched by a(now)/a(sent). A blackbody of temperature θ
                            stretched by s looks EXACTLY like a blackbody of θ/s (same angular size): red stars go dark
                            first, the hottest last. Old starlight is stretched by a(n) itself.
     · things set free      the Moon, the Sun, Saturn: once let go they ride the growth, distance ∝ a(n) (checked
                            against an orbit integration: the Moon's distance tracks a(n) to within 1%).
   ===================================================================== */

const UXP = {
  c: 299792458, H0: 2.2e-18,                 // today: space doubles every ≈ 10 billion years (H0 ≈ 68 km/s/Mpc)
  R: 4.5 * 3600, h: 4 / 3, b: 1.5e-8,
  g: 9.81, RE: 6.371e6, ly: 9.4607e15, AU: 1.496e11,
  onset: 19.5 * 3600,                        // 19:30:00, as seconds after midnight the day before
};

function uxH(n) { if (n <= 0) return UXP.H0; const R = UXP.R, D = Math.max(1e-30, R - n); return UXP.H0 + UXP.b * n + UXP.h * (1 / D - 1 / R - n / (R * R)); }
function uxHdot(n) { if (n <= 0) return 0; const R = UXP.R, D = Math.max(1e-30, R - n); return UXP.b + UXP.h * (1 / (D * D) - 1 / (R * R)); }
function uxAcc(n) { return uxHdot(n) + uxH(n) * uxH(n); }          // ä/a (1/s²)
// ln a(n), a(0) = 1 (exact integral of uxH)
function uxLnA(n) {
  if (n <= 0) return UXP.H0 * n;
  const R = UXP.R, x = Math.min(n / R, 1 - 1e-30);
  return UXP.H0 * n + 0.5 * UXP.b * n * n + UXP.h * (-Math.log1p(-x) - x - 0.5 * x * x);
}
function uxA(n) { return Math.exp(uxLnA(n)); }
function uxT(n) { return Math.LN2 / uxH(n); }                        // doubling time (s)
function uxEdge(n) { return UXP.c / uxH(n); }                        // m
// your weight, as a fraction of normal (negative: you are pulled off the ground)
function uxWeight(n) { return 1 - uxAcc(n) * UXP.RE / UXP.g; }
// the night time at which the pull reaches ä/a = A (bisection; uxAcc rises monotonically)
function uxNightForAcc(A) { let lo = 0, hi = UXP.R; for (let i = 0; i < 200; i++) { const m = 0.5 * (lo + hi); if (uxAcc(m) < A) lo = m; else hi = m; } return 0.5 * (lo + hi); }
// when a thing set free at the onset (comoving distance chi, m) goes over the edge: its distance a·chi reaches c/H,
// i.e. it recedes at the speed of light (ȧ·chi = c). (The Sun at 22:55, Saturn at 21:34: later than chi alone says.)
function uxNightForEdge(chi) { let lo = 0, hi = UXP.R * (1 - 1e-12); for (let i = 0; i < 300; i++) { const m = 0.5 * (lo + hi); if (uxH(m) * uxA(m) * chi < UXP.c) lo = m; else hi = m; } return 0.5 * (lo + hi); }
function uxNightForH(Hx) { let lo = 0, hi = UXP.R; for (let i = 0; i < 200; i++) { const m = 0.5 * (lo + hi); if (uxH(m) < Hx) lo = m; else hi = m; } return 0.5 * (lo + hi); }
// the comoving distance light covers between n0 and n1 (m, in units of tonight's 19:30 metres)
function uxChi(n0, n1, steps = 400) { let s = 0; const dn = (n1 - n0) / steps; for (let i = 0; i < steps; i++) s += UXP.c * dn / uxA(n0 + (i + 0.5) * dn); return s; }
// when light now arriving set out from comoving distance chi (m): n_sent
function uxSent(n, chi) {
  let lo = n - chi / UXP.c * 1.0001 - 1, hi = n;
  // (light covers less comoving distance per second as space grows, so it left earlier than chi/c)
  for (let k = 0; k < 60 && uxChi(lo, n, 120) < chi; k++) lo = n - (n - lo) * 2;
  for (let i = 0; i < 60; i++) { const m = 0.5 * (lo + hi); if (uxChi(m, n, 120) > chi) lo = m; else hi = m; }
  return 0.5 * (lo + hi);
}
// the stretch of light that arrives now after crossing comoving distance chi
function uxStretch(n, chi) { return Math.exp(uxLnA(n) - uxLnA(uxSent(n, chi))); }
// pressure (atm) and the boiling point of water (°C, Antoine) under it
function uxPressure(n) { return Math.max(0, uxWeight(n)); }
function uxBoil(p) { if (!(p > 1e-4)) return 0; return 1730.63 / (8.07131 - Math.log10(p * 760)) - 233.426; }
// the visible brightness of a blackbody at temperature θ (K), per unit area, relative units (Planck × the eye's
// photopic response): stretched light of a θ star looks like a θ / s star of the same size
function uxBBVis(th) {
  if (!(th > 200)) return 0;
  let s = 0;
  for (let l = 380; l <= 780; l += 5) {
    const lm = l * 1e-9, x = 1.4388e-2 / (lm * th), B = x > 700 ? 0 : 1 / (Math.pow(lm, 5) * (Math.exp(x) - 1));
    const q = (l - 559) / (l < 559 ? 41.9 : 41.4), V = Math.exp(-0.5 * q * q);
    s += B * V;
  }
  return s * 1e-28;
}
// the colour (linear sRGB, max channel 1) of a blackbody at θ (CIE 1931 fit, as in the slow-light film's kit)
function uxBBRGB(th) {
  const g = (l, m, s1, s2) => { const q = (l - m) / (l < m ? s1 : s2); return Math.exp(-0.5 * q * q); };
  let X = 0, Y = 0, Z = 0;
  for (let l = 380; l <= 780; l += 5) {
    const lm = l * 1e-9, x = 1.4388e-2 / (lm * Math.max(th, 300)), B = x > 700 ? 0 : 1 / (Math.pow(lm, 5) * (Math.exp(x) - 1));
    X += B * (1.056 * g(l, 599.8, 37.9, 31) + 0.362 * g(l, 442, 16, 26.7) - 0.065 * g(l, 501.1, 20.4, 26.2));
    Y += B * (0.821 * g(l, 568.8, 46.9, 40.5) + 0.286 * g(l, 530.9, 16.3, 31.1));
    Z += B * (1.217 * g(l, 437, 11.8, 36) + 0.681 * g(l, 459, 26, 13.8));
  }
  const r = 3.2406 * X - 1.5372 * Y - 0.4986 * Z, gg = -0.9689 * X + 1.8758 * Y + 0.0415 * Z, bb = 0.0557 * X - 0.204 * Y + 1.057 * Z;
  const m = Math.max(r, gg, bb, 1e-30);
  return [Math.max(0, r / m), Math.max(0, gg / m), Math.max(0, bb / m)];
}

// distances (comoving, m) of the things we look at
const UX_D = {
  moon: 3.844e8, sunMoon: UXP.AU, saturn: 8.55 * UXP.AU, sunSaturn: 9.55 * UXP.AU, sun: UXP.AU,
  andromeda: 2.5e6 * UXP.ly, virgo: 54e6 * UXP.ly, gc: 26e3 * UXP.ly, lmc: 160e3 * UXP.ly, sirius: 8.6 * UXP.ly, acen: 4.37 * UXP.ly,
};
// the Moon and Saturn as you see them: size (× normal), the stretch of their light, brightness (× normal)
// (the Moon's is approximate: the age of its sunlight and its shrinking disc are simplified, two small errors that
// nearly cancel; an exact check gives the same "goes out" time, magnitude 5.4 at 11:21. Don't reuse it as exact.)
function uxMoonSeen(n) {
  const s = uxStretch(n, UX_D.sunMoon + UX_D.moon), A = uxA(n);
  const sent = uxSent(n, UX_D.moon), Am = uxA(sent);                // where it was when this light left it
  const size = 1 / Am;                                              // (angular size: set by its distance then)
  const lit = 1 / (Am * Am);                                        // sunlight at the Moon falls with its distance from the Sun
  return { size, stretch: s, bright: lit * uxBBVis(5772 / s) / uxBBVis(5772), dist: Am * UX_D.moon, A };
}
function uxSaturnSeen(n) {
  const s = uxStretch(n, UX_D.sunSaturn + UX_D.saturn), sent = uxSent(n, UX_D.saturn), As = uxA(sent);
  return { size: 1 / As, stretch: s, bright: (1 / (As * As)) * uxBBVis(5772 / s) / uxBBVis(5772) };
}

if (typeof module !== 'undefined') module.exports = { UXP, UX_D, uxH, uxHdot, uxAcc, uxLnA, uxA, uxT, uxEdge, uxWeight, uxNightForAcc, uxNightForEdge, uxNightForH, uxChi, uxSent, uxStretch, uxPressure, uxBoil, uxBBVis, uxBBRGB, uxMoonSeen, uxSaturnSeen };
