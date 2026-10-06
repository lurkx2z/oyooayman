/* =====================================================================
   MERGER — a deterministic simulation of the Milky Way and Andromeda.

   A restricted N-body model in the spirit of Toomre & Toomre (1972):
   each galaxy is a rigid gravitational potential (a dark-matter halo, a
   disc and a bulge, each a Hernquist sphere) whose centre moves under the
   other's pull, with dynamical friction draining their orbit so they pass,
   separate, fall back and merge. The stars, gas/dust clouds and young
   star-forming regions are test particles that start on circular orbits
   and respond to both potentials — so spiral arms shear, tidal tails and
   bridges form, discs are torn up and finally mix into one galaxy.
   You watch from the Sun's place, 8.2 kpc from the Milky Way's centre, held
   fixed relative to it (were the Sun to orbit, a compressed night would
   swing the whole sky round the galaxy seventeen times).

   Units: kpc, km/s, G = 1 (mass unit 2.325e5 Msun, time unit 0.978 Gyr).
   Everything is computed once at load (fixed steps on a global grid, state
   kept in float32, so any time can be rebuilt exactly from the nearest
   checkpoint) and sampled by time.
   ===================================================================== */

const AM_SIM = {
  dt: 0.0015,          // ≈ 1.5 Myr
  tEnd: 3.7,           // ≈ 3.6 Gyr: approach, first passage, separation, return, merger
  chkEvery: 100,       // checkpoint spacing (steps)
  soft: 0.15,          // softening (kpc)
  orbit: { r0: 280, vr: 150, vt: 70, K: 1.0, rd: 40, K2: 6, r2: 12, side: [1, 0, 0] },   // (drag: broad, plus a stronger close-range term that finishes the merger)
  // [mass, scale] of each Hernquist component
  MW: { halo: [4.3e6, 26], disc: [2.6e5, 4], bulge: [1.4e5, 1.0], Rd: 2.6, Rmax: 15.5, z0: 0.15, arms: 4, pitch: 13, armA: 0.45, ringR: 0, lum: 1.0, omegaP: 3 },
  M31: { halo: [5.6e6, 30], disc: [3.2e5, 5], bulge: [2.5e5, 1.2], Rd: 6.5, Rmax: 30, z0: 0.3, arms: 2, pitch: 14, armA: 0.8, ringR: 10.5, lum: 1.25, omegaP: 2.5 },
  // particle counts per population
  N: {
    MW: { old: 15000, young: 5200, bulge: 3600, halo: 1600, dust: 5600, hii: 700 },
    M31: { old: 23000, young: 8000, bulge: 5200, halo: 2800, dust: 7400, hii: 1100 },
  },
  // where things are at the start, in galactic coordinates centred on the Milky Way
  sun: { R: 8.2, z: 0.02 },
  m31: { l: 121.2, b: -21.6, spinTilt: 66, spinRoll: 25 },
};
const AM_POP = { old: 0, young: 1, bulge: 2, halo: 3, dust: 4, hii: 5 };

function amRng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function amGauss(r) { const u = Math.max(1e-9, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283185307 * v); }

class MergerSim {
  constructor(spec = AM_SIM) {
    this.S = spec;
    this.nSteps = Math.ceil(spec.tEnd / spec.dt);
  }

  // acceleration magnitude / r from one galaxy's components at distance r
  static _gr(G, r) { let f = 0; for (const [M, a] of [G.halo, G.disc, G.bulge]) f += M / (r * (r + a) * (r + a)); return f; }
  // circular speed in a galaxy's own potential at radius R
  static _vc(G, R) { return Math.sqrt(MergerSim._gr(G, R) * R * R); }

  // ---------- the two centres: relative orbit with dynamical friction (stored for every step) ----------
  _orbit() {
    const S = this.S, O = S.orbit, n = this.nSteps, dt = S.dt;
    const m1 = S.MW.halo[0] + S.MW.disc[0] + S.MW.bulge[0], m2 = S.M31.halo[0] + S.M31.disc[0] + S.M31.bulge[0];
    // the start: Andromeda r0 from the Milky Way in its real direction (l, b), falling in with a little sideways motion
    const l = S.m31.l * Math.PI / 180, b = S.m31.b * Math.PI / 180;
    const sun = [-S.sun.R, 0, S.sun.z];
    const dir = [Math.cos(b) * Math.cos(l), Math.cos(b) * Math.sin(l), Math.sin(b)];
    let r = [sun[0] + dir[0] * O.r0, sun[1] + dir[1] * O.r0, sun[2] + dir[2] * O.r0];
    const rn = Math.hypot(...r), rh = r.map((c) => c / rn);
    // the sideways drift (unknown in reality; chosen so it swings past the Milky Way's centre on the far side from us — the
    // whole story then plays out in one half of the sky): toward the galactic centre's side, perpendicular to the line
    let tv = S.orbit.side.slice(); const td = tv[0] * rh[0] + tv[1] * rh[1] + tv[2] * rh[2]; tv = tv.map((c, i) => c - td * rh[i]); const tn = Math.hypot(...tv); tv = tv.map((c) => c / tn);
    let v = rh.map((c, i) => -O.vr * c + O.vt * tv[i]);
    const C = new Float64Array((n + 2) * 12);   // per step: MW pos, MW vel, M31 pos, M31 vel
    const put = (k) => {
      const f1 = -m2 / (m1 + m2), f2 = m1 / (m1 + m2), o = k * 12;
      for (let i = 0; i < 3; i++) { C[o + i] = r[i] * f1; C[o + 3 + i] = v[i] * f1; C[o + 6 + i] = r[i] * f2; C[o + 9 + i] = v[i] * f2; }
    };
    const acc = (r, v) => {
      const d = Math.sqrt(r[0] * r[0] + r[1] * r[1] + r[2] * r[2]) + 0.5, g = MergerSim._gr(S.MW, d) + MergerSim._gr(S.M31, d), k = O.K / (1 + (d / O.rd) ** 2) + O.K2 * Math.exp(-d / O.r2);
      return [-g * r[0] - k * v[0], -g * r[1] - k * v[1], -g * r[2] - k * v[2]];
    };
    put(0);
    for (let k = 0; k <= n; k++) {
      // (finer substeps for the centres: they swing fast at the end)
      for (let s = 0; s < 4; s++) {
        const h = dt / 4; let a = acc(r, v);
        for (let i = 0; i < 3; i++) v[i] += a[i] * h / 2;
        for (let i = 0; i < 3; i++) r[i] += v[i] * h;
        a = acc(r, v);
        for (let i = 0; i < 3; i++) v[i] += a[i] * h / 2;
      }
      put(k + 1);
    }
    this.C = C;
  }

  centre(which, t, out = [0, 0, 0]) {
    const f = Math.max(0, Math.min(this.nSteps, t / this.S.dt)), k = Math.floor(f), u = f - k, o = which * 6, C = this.C;
    for (let i = 0; i < 3; i++) out[i] = C[k * 12 + o + i] * (1 - u) + C[(k + 1) * 12 + o + i] * u;
    return out;
  }
  // where you watch from: the Sun's place, a fixed step from the Milky Way's centre
  observer(t, out = [0, 0, 0]) { this.centre(0, t, out); out[0] -= this.S.sun.R; out[2] += this.S.sun.z; return out; }
  separation(t) { const a = this.centre(0, t), b = this.centre(1, t); return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); }

  // ---------- the particles ----------
  _particles() {
    const S = this.S, rnd = amRng(20261006), list = [];
    const add = (gal, pop, p, v, lum, col, h) => list.push({ gal, pop, p, v, lum, col, h });
    const C0 = [this.C.slice(0, 3), this.C.slice(6, 9)], V0 = [this.C.slice(3, 6), this.C.slice(9, 12)];
    // the Milky Way spins in its own plane (normal +z, clockwise seen from the north galactic pole → angular momentum −z);
    // Andromeda's disc is tipped (spinTilt from the line of sight toward us, spinRoll about it)
    const frames = [];
    frames.push({ n: [0, 0, -1], u: [1, 0, 0], w: [0, 1, 0] });
    {
      const c = C0[1], toSun = [-S.sun.R - c[0], -c[1], S.sun.z - c[2]], d = Math.hypot(...toSun), los = toSun.map((x) => x / d);
      let a = [los[1], -los[0], 0]; const an = Math.hypot(...a); a = a.map((x) => x / an);
      const b2 = [los[1] * a[2] - los[2] * a[1], los[2] * a[0] - los[0] * a[2], los[0] * a[1] - los[1] * a[0]];
      const ti = S.m31.spinTilt * Math.PI / 180, ro = S.m31.spinRoll * Math.PI / 180;
      const n = los.map((x, i) => x * Math.cos(ti) + (a[i] * Math.cos(ro) + b2[i] * Math.sin(ro)) * Math.sin(ti));
      let u = [n[1], -n[0], 0]; const un = Math.hypot(...u); u = u.map((x) => x / un);
      const w = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
      frames.push({ n, u, w });
    }
    const galList = [['MW', 0], ['M31', 1]];
    for (const [name, gi] of galList) {
      const G = S[name], N = S.N[name], F = frames[gi], c = C0[gi], cv = V0[gi];
      // a point in the disc at radius R, angle θ, height z → world position and circular velocity (spin along n)
      const place = (R, th, z, pop, lum, col, h, disp = 0.06) => {
        const cx = Math.cos(th), sx = Math.sin(th);
        const p = [0, 1, 2].map((i) => c[i] + (F.u[i] * cx + F.w[i] * sx) * R + F.n[i] * z);
        const vc = MergerSim._vc(G, Math.max(0.3, Math.hypot(R, z)));
        // tangential direction n × r̂ (so the disc turns about n)
        const rh = [0, 1, 2].map((i) => F.u[i] * cx + F.w[i] * sx);
        const tdir = [F.n[1] * rh[2] - F.n[2] * rh[1], F.n[2] * rh[0] - F.n[0] * rh[2], F.n[0] * rh[1] - F.n[1] * rh[0]];
        const v = [0, 1, 2].map((i) => cv[i] + tdir[i] * vc + amGauss(rnd) * vc * disp);
        add(gi, AM_POP[pop], p, v, lum * G.lum, col, h);
      };
      const drawR = () => { for (;;) { const R = -G.Rd * Math.log(Math.max(1e-6, rnd() * rnd())); if (R < G.Rmax && R > 0.6) return R; } };   // (gamma-2 ≈ exponential disc by area)
      // old disc: smooth (its arms, like the young stars' and the dust's, are a density wave applied when drawn — see AmSky)
      for (let i = 0; i < N.old; i++) {
        const R = drawR(), th = rnd() * 6.2832, k = rnd();
        place(R, th, amGauss(rnd) * G.z0, 'old', 1.0, [1.0, 0.8 - 0.06 * k, 0.56 - 0.1 * k], 0.5);
      }
      // young stars: a thinner, more extended disc (and Andromeda's star-forming ring)
      for (let i = 0; i < N.young; i++) {
        let R, th = rnd() * 6.2832;
        if (G.ringR && rnd() < 0.35) R = G.ringR + amGauss(rnd) * 1.1;
        else { do R = drawR() * 0.85 + 1.5; while (R > G.Rmax); }
        const k = rnd(); place(R, th, amGauss(rnd) * G.z0 * 0.4, 'young', 1.6, [0.5 + 0.1 * k, 0.68 + 0.08 * k, 1.0], 0.35, 0.04);
      }
      // HII regions / young clusters: knots (lit only where an arm passes)
      for (let i = 0; i < N.hii; i++) {
        let R, th = rnd() * 6.2832;
        if (G.ringR && rnd() < 0.3) R = G.ringR + amGauss(rnd) * 0.8; else { do R = drawR() * 0.8 + 2; while (R > G.Rmax); }
        const pink = rnd() < 0.6; place(R, th, amGauss(rnd) * 0.05, 'hii', pink ? 2.2 : 2.6, pink ? [1.0, 0.36, 0.55] : [0.6, 0.8, 1.0], 0.12, 0.03);
      }
      // dust: thin; Andromeda's dusty ring
      for (let i = 0; i < N.dust; i++) {
        let R, th = rnd() * 6.2832;
        if (G.ringR && rnd() < 0.4) R = G.ringR + amGauss(rnd) * 1.0; else { do R = drawR() * 0.9 + 0.8; while (R > G.Rmax * 0.95); }
        place(R, th, amGauss(rnd) * G.z0 * 0.35, 'dust', 1.0, [0, 0, 0], 0.4, 0.03);
      }
      // bulge: a warm spheroid (Hernquist-like), random orbits
      const ab = G.bulge[1];
      for (let i = 0; i < N.bulge; i++) {
        const q = rnd() * 0.9, r = ab * Math.sqrt(q) / (1 - Math.sqrt(q)), ct = rnd() * 2 - 1, ph = rnd() * 6.2832, st = Math.sqrt(1 - ct * ct);
        const d = [st * Math.cos(ph), st * Math.sin(ph), ct * 0.75], p = [0, 1, 2].map((k) => c[k] + d[k] * Math.min(r, 6));
        const s = MergerSim._vc(G, Math.max(0.2, r)) * 0.62, v = [0, 1, 2].map((k) => cv[k] + amGauss(rnd) * s);
        const k = rnd(); add(gi, AM_POP.bulge, p, v, 1.25 * G.lum, [1.0, 0.72 - 0.05 * k, 0.44 - 0.08 * k], 0.25);
      }
      // stellar halo: faint, big, slow random orbits
      for (let i = 0; i < N.halo; i++) {
        const r = 4 + 40 * Math.pow(rnd(), 1.6), ct = rnd() * 2 - 1, ph = rnd() * 6.2832, st = Math.sqrt(1 - ct * ct);
        const p = [0, 1, 2].map((k) => c[k] + [st * Math.cos(ph), st * Math.sin(ph), ct][k] * r);
        const s = MergerSim._vc(G, r) * 0.55, v = [0, 1, 2].map((k) => cv[k] + amGauss(rnd) * s);
        add(gi, AM_POP.halo, p, v, 0.55 * G.lum, [1.0, 0.85, 0.7], 2.0);
      }
    }
    this.frames = frames;
    return list;
  }

  build() {
    const S = this.S;
    this._orbit();
    const L = this._particles(), N = L.length;
    this.N = N;
    this.pos = new Float32Array(N * 3); this.vel = new Float32Array(N * 3);
    this.pop = new Uint8Array(N); this.gal = new Uint8Array(N); this.lum = new Float32Array(N); this.col = new Float32Array(N * 3); this.h0 = new Float32Array(N);
    L.forEach((q, i) => { for (let k = 0; k < 3; k++) { this.pos[i * 3 + k] = q.p[k]; this.vel[i * 3 + k] = q.v[k]; this.col[i * 3 + k] = q.col[k]; } this.pop[i] = q.pop < 0 ? 255 : q.pop; this.gal[i] = q.gal; this.lum[i] = q.lum; this.h0[i] = q.h; });
    // integrate the whole thing once, keeping checkpoints
    this.chk = [];
    this.acc = new Float32Array(N * 3);
    this._force(0);
    this.step = 0;
    this.chk.push({ k: 0, pos: this.pos.slice(), vel: this.vel.slice() });
    while (this.step < this.nSteps) {
      this._advance();
      if (this.step % S.chkEvery === 0) this.chk.push({ k: this.step, pos: this.pos.slice(), vel: this.vel.slice() });
    }
    this.cur = null;
    return this;
  }

  // accelerations of every particle at step k (from both centres at that step)
  _force(k) {
    const S = this.S, C = this.C, o = k * 12, P = this.pos, A = this.acc, N = this.N, e2 = S.soft * S.soft;
    const G1 = [S.MW.halo, S.MW.disc, S.MW.bulge], G2 = [S.M31.halo, S.M31.disc, S.M31.bulge];
    const c1x = C[o], c1y = C[o + 1], c1z = C[o + 2], c2x = C[o + 6], c2y = C[o + 7], c2z = C[o + 8];
    const M1a = G1[0][0], a1a = G1[0][1], M1b = G1[1][0], a1b = G1[1][1], M1c = G1[2][0], a1c = G1[2][1];
    const M2a = G2[0][0], a2a = G2[0][1], M2b = G2[1][0], a2b = G2[1][1], M2c = G2[2][0], a2c = G2[2][1];
    for (let i = 0, j = 0; i < N; i++, j += 3) {
      const x = P[j], y = P[j + 1], z = P[j + 2];
      let dx = x - c1x, dy = y - c1y, dz = z - c1z, r = Math.sqrt(dx * dx + dy * dy + dz * dz + e2);
      let ra = r + a1a, rb = r + a1b, rc = r + a1c, f = (M1a / (ra * ra) + M1b / (rb * rb) + M1c / (rc * rc)) / r;
      let ax = -f * dx, ay = -f * dy, az = -f * dz;
      dx = x - c2x; dy = y - c2y; dz = z - c2z; r = Math.sqrt(dx * dx + dy * dy + dz * dz + e2);
      ra = r + a2a; rb = r + a2b; rc = r + a2c; f = (M2a / (ra * ra) + M2b / (rb * rb) + M2c / (rc * rc)) / r;
      A[j] = ax - f * dx; A[j + 1] = ay - f * dy; A[j + 2] = az - f * dz;
    }
  }

  // one kick-drift-kick step (state at this.step → this.step + 1)
  _advance() {
    const dt = this.S.dt, P = this.pos, V = this.vel, A = this.acc, n3 = this.N * 3;
    for (let j = 0; j < n3; j++) { V[j] += A[j] * dt * 0.5; P[j] += V[j] * dt; }
    this.step++;
    this._force(this.step);
    for (let j = 0; j < n3; j++) V[j] += A[j] * dt * 0.5;
  }

  // positions of every particle at time t, into out (float32, length 3N). Rebuilt from the nearest checkpoint (or the last
  // state, when time only moved forward) — identical either way, so playback, scrubbing and rendering agree.
  positionsAt(t, out) {
    const S = this.S, dt = S.dt, f = Math.max(0, Math.min(this.nSteps, t / dt)), k = Math.min(this.nSteps, Math.floor(f));
    if (!this.cur || this.step > k || (k - this.step) > S.chkEvery) {
      let c = this.chk[0]; for (const q of this.chk) if (q.k <= k) c = q;
      if (!this.cur || this.step > k || c.k > this.step) { this.pos.set(c.pos); this.vel.set(c.vel); this.step = c.k; this._force(c.k); }
    }
    while (this.step < k) this._advance();
    this.cur = true;
    const u = (f - k) * dt, P = this.pos, V = this.vel, n3 = this.N * 3;
    for (let j = 0; j < n3; j++) out[j] = P[j] + V[j] * u;
    return out;
  }
}

if (typeof module !== 'undefined') module.exports = { AM_SIM, AM_POP, MergerSim };
