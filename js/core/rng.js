/* =====================================================================
   Deterministic randomness + small math helpers.
   Everything "random" in the film comes from here, so every playback
   (and every recorded take) is identical.
   ===================================================================== */

class RNG {
  constructor(seed) { this.s = (seed >>> 0) || 1; }
  // mulberry32
  next() {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a, b) { return a + (b - a) * this.next(); }
  int(a, b) { return Math.floor(this.range(a, b + 1)); }
  pick(arr) { return arr[Math.floor(this.next() * arr.length) % arr.length]; }
  chance(p) { return this.next() < p; }
  sign() { return this.next() < 0.5 ? -1 : 1; }
  gauss() { return (this.next() + this.next() + this.next() - 1.5) / 1.5; }
  fork(salt) { return new RNG(Math.imul(this.s ^ 0x9e3779b9, 2654435761) + salt * 7919); }
}

// Stateless hash: integer(s) → [0,1). Used for particles so they can be
// evaluated at any time t without running a simulation (scrub-safe).
function hash1(n) {
  n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1) ^ (n >>> 15);
  n = Math.imul(n ^ (n >>> 13), 0x85ebca6b);
  n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
}
function hash2(a, b) { return hash1(Math.imul(a, 73856093) ^ Math.imul(b + 17, 19349663)); }

// Smooth 1-D value noise in [-1, 1]
function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i;
  const u = f * f * (3 - 2 * f);
  const a = hash2(i, seed), b = hash2(i + 1, seed);
  return (a + (b - a) * u) * 2 - 1;
}
function fbm1(x, seed = 0, oct = 3) {
  let v = 0, amp = 0.5, fr = 1;
  for (let o = 0; o < oct; o++) { v += noise1(x * fr, seed + o * 31) * amp; fr *= 2.03; amp *= 0.5; }
  return v;
}

const MathX = {
  clamp: (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v),
  lerp: (a, b, t) => a + (b - a) * t,
  // map v from [a,b] to [0,1], clamped
  ramp: (v, a, b) => MathX.clamp((v - a) / (b - a)),
  smooth: (v, a, b) => { const x = MathX.clamp((v - a) / (b - a)); return x * x * (3 - 2 * x); },
  // 0→1→0 window with soft edges
  window: (v, a, b, fadeIn = 0.3, fadeOut = 0.3) =>
    MathX.smooth(v, a, a + fadeIn) * (1 - MathX.smooth(v, b - fadeOut, b)),
  deg: (d) => (d * Math.PI) / 180,
  // decaying impulse starting at t0 (0 before t0)
  impulse: (t, t0, decay) => (t < t0 ? 0 : Math.exp(-(t - t0) / decay)),
  angleLerp: (a, b, t) => {
    let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (d < -Math.PI) d += Math.PI * 2;
    return a + d * t;
  },
};
