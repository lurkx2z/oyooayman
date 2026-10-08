/* =====================================================================
   PHYSICS — "What if air resistance suddenly disappeared?"
   One rule: from story NR.loss, solids feel no aerodynamic force (drag 0,
   lift 0). Gravity, buoyancy and liquids are unchanged. Every hero motion
   below comes from these formulas, so every playback is identical and can
   be scrubbed. Numbers and their checks: films/no-air-resistance/PLAN.md §1.
   ===================================================================== */

const NR_G = 9.81, NR_RHO = 1.225;

// the share of normal aerodynamic force still acting (1 → 0 at the change)
function nrAero(S) { return 1 - MathX.smooth(S, NR.loss, NR.loss + 0.35); }

// the wind (km/h; the air keeps moving after the change): 50 km/h, then the storm's gust front brings 110 km/h (and rain)
function nrWindKmh(S) {
  if (S < NR.gale[0]) return 50;
  return MathX.lerp(50, 110, MathX.smooth(S, NR.gale[0], NR.gale[1]));
}
function nrGust(S, z = 0) { const s = S + z * 0.012; return 1 + 0.18 * noise1(s * 0.9, 41) + 0.07 * noise1(s * 3.1, 42); }
// how far the air itself has moved (m): clouds, steam, rain and spray ride it
const NR_WIND_DIST = (() => { const tab = [0]; let d = 0; for (let i = 1; i <= 80 * 30; i++) { d += nrWindKmh(i / 30) / 3.6 / 30; tab.push(d); } return tab; })();
function nrWindDist(S) { const f = MathX.clamp(S * 30, 0, NR_WIND_DIST.length - 1.001), k = Math.floor(f); return NR_WIND_DIST[k] + (NR_WIND_DIST[k + 1] - NR_WIND_DIST[k]) * (f - k); }
// how hard the wind pushes solids, relative to the 50 km/h wind in normal air (0 after the change)
function nrLoad(S, z = 0) { const U = nrWindKmh(S) / 50 * nrGust(S, z); return U * U * nrAero(S); }
// the push at the moment of the change (what bent things spring back from)
function nrLoadAtLoss(z = 0) { const U = nrWindKmh(NR.loss) / 50 * nrGust(NR.loss, z); return U * U; }

// a bent thing (bunting, a balloon string) released at the change: a lightly damped spring around its rest position.
// before: follows the push; after: rings down from where it was (no air damping now, only its own)
function nrSpring(S, z, freq = 0.55, damp = 0.12) {
  const L0 = nrLoadAtLoss(z);
  if (S < NR.loss) return nrLoad(S, z);
  const u = S - NR.loss, w = 2 * Math.PI * freq;
  return L0 * Math.exp(-damp * w * u) * Math.cos(w * u) * (1 - nrAero(S)) + nrLoad(S, z);
}

/* ---------------- the drop: a sheet of paper and a tennis ball held out over the parapet, let go together ---------------- */
// without air: both fall ½gt² — 22.4 m to the pavement in 2.14 s, arriving at 21 m/s (75 km/h).
// The ghost: what the same sheet does in normal air in a 50 km/h wind (it sails off with the wind, sinking slowly)
// in still air (the stairwell) a sheet of paper flutters down at ~1 m/s, rocking side to side: when the real one lands,
// 22 m down, its normal-air ghost has dropped about two metres
const NR_DROP = {
  fall(u) { return u <= 0 ? 0 : 0.5 * NR_G * u * u; },
  ghost(u) {      // [down, sway x, sway z, rock] for the normal-air sheet
    if (u <= 0) return [0, 0, 0, 0];
    const down = 0.5 * NR_G * Math.min(u, 0.12) ** 2 + 0.95 * Math.max(0, u - 0.12) + 0.06 * Math.sin(u * 5.6);
    return [down, 0.15 * Math.sin(u * 2.8), 0.28 * (Math.sin(u * 1.9 + 0.4) - Math.sin(0.4)), 0.9 * Math.sin(u * 2.8)];
  },
};

/* ---------------- the kite: 12 m above the roof when its lift goes; it falls ½gt² into the street (33 m, 2.6 s) ---------------- */
const NR_KITE = { fall(u) { return u <= 0 ? 0 : 0.5 * NR_G * u * u; } };

/* ---------------- one piece of the cloud's ice: the cut-away rides down beside it ---------------- */
// A 4 cm hailstone held up 9.5 km high in the storm's updraft. At the change it falls from rest like everything else
// solid (½gt²); the cloud's droplets (water) stay up with the air, so the cloud streams up past it. It lands on the roof
// √(2h/g) = 44 s after the change (story NR_STONE.lands), at 432 m/s. Normal air would hold it to ≈ 30 m/s (≈ 100 km/h).
const NR_STONE = {
  H0: 9500,
  alt(S) { const t = Math.max(0, S - NR.loss); return this.H0 - 0.5 * NR_G * t * t; },
  speed(S) { return NR_G * Math.max(0, S - NR.loss); },
  get lands() { return NR.loss + Math.sqrt(2 * this.H0 / NR_G); },
};

/* ---------------- the confetti cannon: a spring-loaded toy, fired straight up at 11 m/s ---------------- */
// no drag: every flake flies the same parabola as a pebble would (6.2 m up, back in 2.2 s), so the cloud stays a clump
// and lands like a handful of gravel. In normal air it would stop within a metre and blow away on the wind. A toy
// paratrooper rides out with it: its canopy can't fill, so it flies the same parabola and lands with the confetti.
const NR_CONFETTI = {
  v0: 11.0,
  at(u, d, p0, out) {      // d: { dx, dz (spread, m/s), vk (speed factor) }; → out { x, y, z, air }
    const vy = this.v0 * d.vk, y = p0.y + vy * u - 0.5 * NR_G * u * u, floor = d.floor;
    if (y > floor || u < 0.1) { out.set(p0.x + d.dx * u, Math.max(floor, y), p0.z + d.dz * u); out.air = 1; return out; }
    const tl = (vy + Math.sqrt(vy * vy + 2 * NR_G * (p0.y - floor))) / NR_G;
    out.set(p0.x + d.dx * tl, floor, p0.z + d.dz * tl); out.air = 0; out.tl = tl; return out;
  },
};

/* ---------------- the balloons: 30 cm, helium; buoyancy kept, drag gone ---------------- */
const NR_BALLOON = (() => {
  const V = 4 / 3 * Math.PI * 0.15 ** 3, mAir = NR_RHO * V, mHe = 0.17 * V, mRub = 0.003, a = (mAir - mHe - mRub) * NR_G / (mHe + mRub);
  return { a, rise(u) { return u <= 0 ? 0 : 0.5 * a * u * u; } };       // a ≈ 21 m/s² (≈ 2 g)
})();

/* ---------------- the storm cloud's ice ---------------- */
// In a thunderstorm, updrafts (drag) hold the ice up. With no drag every piece of ice in the cloud falls from rest at the
// same moment, so the whole column of ice drops as one block, ½gt²: the lowest ice (6 km) lands first, 35 s after the
// change, at √(2gh) = 343 m/s (1,235 km/h); ice from higher up lands later and faster; the last (13 km, the cloud top)
// lands 51.5 s after the change at 505 m/s (1,818 km/h). Nothing slows it: it pushes no air, so no sonic boom either.
// (6 km is roughly where a summer storm's air reaches −10 °C: below it most of the cloud is liquid water, which stays up;
// above it the ice, from small hail to snow, is what the updrafts hold.) Ice per cubic metre peaks at ~10.5 km (the
// profile below), and the flux (∝ ice content × speed) peaks ~46 s after the change. The column holds ~5.5 kg of ice over
// every square metre (1.5 g/m³ at the peak): landing at 340–505 m/s that is ~50 J on every square centimetre, enough to
// shred cloth and timber. The surface wind can't push the ice either: it falls almost straight down (upper winds of
// ~20 m/s tilt it by ~3°).
const NR_ICE = (() => {
  const I = {
    base: 6000, top: 13000, peak: 10500,
    tOf(h) { return NR.loss + Math.sqrt(2 * h / NR_G); },          // when ice from height h lands
    h(S) { const t = Math.max(0, S - NR.loss); return 0.5 * NR_G * t * t; },   // where the ice landing now fell from
    v(S) { return NR_G * Math.max(0, S - NR.loss); },
    kmh(S) { return this.v(S) * 3.6; },
    // ice content (relative, 0..1) at height h: a few big stones low down, the bulk at ~10.5 km, thinning to the top
    iwc(h) {
      if (h < this.base || h > this.top) return 0;
      if (h < this.peak) return 0.1 + 0.9 * MathX.smooth(h, this.base, this.peak);
      return 1 - MathX.smooth(h, this.peak, this.top);
    },
  };
  I.first = I.tOf(I.base); I.last = I.tOf(I.top);
  // flux landing at S (kg/m²/s ∝ iwc · g · t), normalised to 1 at its peak; and the share of all the ice landed so far
  const rows = [], dt = 1 / 60; let acc = 0;
  for (let S = I.first - 0.05; S <= I.last + 0.1; S += dt) { const f = I.iwc(I.h(S)) * NR_G * (S - NR.loss); rows.push([S, f, acc]); acc += f * dt; }
  const fmax = Math.max(...rows.map((r) => r[1]));
  I.total = acc;
  const look = (S, k) => { const f = MathX.clamp((S - rows[0][0]) / dt, 0, rows.length - 1.001), i = Math.floor(f); return rows[i][k] + (rows[i + 1][k] - rows[i][k]) * (f - i); };
  I.flux = (S) => (S < I.first || S > I.last ? 0 : look(S, 1) / fmax);
  I.landed = (S) => (S <= I.first ? 0 : S >= I.last ? 1 : look(S, 2) / acc);
  I.drift = [0.055, 0.02];      // horizontal drift per metre of fall (the upper wind): ≈ 3°
  return I;
})();
// (script.js keys its beats to these two moments)
if (Math.abs(NR_ICE.first - NR.ice0) > 0.02 || Math.abs(NR_ICE.last - NR.quiet) > 0.02) console.warn(`NR: the ice lands ${NR_ICE.first.toFixed(2)}–${NR_ICE.last.toFixed(2)}; script.js says ${NR.ice0}–${NR.quiet}`);

/* ---------------- soot from the chimney ---------------- */
// Soot is a solid: only the hot gas's drag carries it up the flue. After the change the gas still rises (and the steam
// with it), but no new soot can be lifted: the smoke turns white. Soot already out in the plume falls out of it.
