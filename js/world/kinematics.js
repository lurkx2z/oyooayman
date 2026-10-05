/* =====================================================================
   Vehicle kinematics — pure functions of time (scrub-safe).

   You tell a car WHERE it should end up ("roll to a stop at z = -30
   braking at 2.5 m/s²") and the code works backwards to find where it
   must be at t = 0. That makes choreography easy.
   ===================================================================== */

const VEHICLE_DIMS = {
  sedan: { L: 4.72, W: 1.82 }, hatch: { L: 4.12, W: 1.78 }, suv: { L: 4.78, W: 1.92 }, taxi: { L: 4.72, W: 1.82 },
  pickup: { L: 5.5, W: 1.98 }, van: { L: 5.3, W: 2.02 }, ev: { L: 4.72, W: 1.88 }, bus: { L: 12.0, W: 2.55 }, moto: { L: 2.1, W: 0.8 },
};

/* ---------------- paths: at(s) → {x, z, hx, hz} ---------------- */
class LinePath {
  constructor(x, z, dx, dz) { this.x = x; this.z = z; this.dx = dx; this.dz = dz; }
  at(s) { return { x: this.x + this.dx * s, z: this.z + this.dz * s, hx: this.dx, hz: this.dz }; }
}

// straight (heading -Z) → quarter-turn left (toward -X) → straight (heading -X)
class TurnPath {
  constructor(x, zStart, zArc, R) {
    this.x = x; this.z0 = zStart; this.zArc = zArc; this.R = R;
    this.l1 = zStart - zArc;
    this.arcLen = (Math.PI / 2) * R;
    this.cx = x - R; this.cz = zArc;
  }
  at(s) {
    if (s <= this.l1) return { x: this.x, z: this.z0 - s, hx: 0, hz: -1 };
    if (s <= this.l1 + this.arcLen) {
      const phi = -(s - this.l1) / this.R;
      return { x: this.cx + this.R * Math.cos(phi), z: this.cz + this.R * Math.sin(phi), hx: Math.sin(phi), hz: -Math.cos(phi) };
    }
    const d = s - this.l1 - this.arcLen;
    return { x: this.cx - d, z: this.cz - this.R, hx: -1, hz: 0 };
  }
}

// centripetal Catmull-Rom through [x, z] points, arc-length parameterised
class SplinePath {
  constructor(points, samplesPerSeg = 40) {
    const P = points.map(([x, z]) => ({ x, z }));
    const pts = [];
    const n = P.length;
    for (let i = 0; i < n - 1; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n - 1, i + 2)];
      for (let k = 0; k < samplesPerSeg; k++) pts.push(SplinePath.cr(p0, p1, p2, p3, k / samplesPerSeg));
    }
    pts.push(P[n - 1]);
    this.pts = pts;
    this.cum = [0];
    for (let i = 1; i < pts.length; i++) this.cum.push(this.cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
    this.length = this.cum[this.cum.length - 1];
  }
  static cr(p0, p1, p2, p3, t) {
    const al = 0.5;
    const tj = (ti, a, b) => ti + Math.pow(Math.hypot(b.x - a.x, b.z - a.z) || 1e-4, al);
    const t0 = 0, t1 = tj(t0, p0, p1), t2 = tj(t1, p1, p2), t3 = tj(t2, p2, p3);
    const u = t1 + (t2 - t1) * t;
    const L = (a, b, ta, tb) => ({ x: ((tb - u) * a.x + (u - ta) * b.x) / (tb - ta), z: ((tb - u) * a.z + (u - ta) * b.z) / (tb - ta) });
    const A1 = L(p0, p1, t0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3);
    const B1 = L(A1, A2, t0, t2), B2 = L(A2, A3, t1, t3);
    return L(B1, B2, t1, t2);
  }
  at(s) {
    if (s < 0) {
      const a = this.pts[0], b = this.pts[1], l = Math.hypot(b.x - a.x, b.z - a.z) || 1;
      const hx = (b.x - a.x) / l, hz = (b.z - a.z) / l;
      return { x: a.x + hx * s, z: a.z + hz * s, hx, hz };
    }
    s = Math.min(this.length, s);
    let lo = 0, hi = this.cum.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (this.cum[mid] < s) lo = mid; else hi = mid; }
    const f = (s - this.cum[lo]) / (this.cum[hi] - this.cum[lo] || 1);
    const a = this.pts[lo], b = this.pts[hi];
    const hx = b.x - a.x, hz = b.z - a.z, hl = Math.hypot(hx, hz) || 1;
    return { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f, hx: hx / hl, hz: hz / hl };
  }
}

/* ---------------- speed profiles ---------------- */
class Kinematics {
  /**
   * spec: from SCRIPT.vehicles. Resolves s0/decel from stopS or contact.
   */
  constructor(spec, path, leaderKin) {
    this.spec = spec;
    this.path = path;
    this.dt = 1 / 120;
    this.T = CONFIG.duration + 3;
    this.L = VEHICLE_DIMS[spec.type].L;
    this.sputter = spec.sputter || 0.65;   // engines die while O₂ is still falling (~14 % → ~5 %)
    this.seed = hash1(spec.id.length * 131 + spec.id.charCodeAt(0) * 7 + spec.id.charCodeAt(spec.id.length - 1));
    this.contactT = null;
    this.tStop = Infinity;

    if (spec.speed) {
      // explicit speed track (electric car keeps driving)
      const tr = new Track(spec.speed, 'linear');
      this.vFn = (t) => tr.value(t);
      this.s0 = spec.s0 || 0;
      if (spec.passAt) {
        // find the path distance where z = passAt.z, then start so we get there at passAt.t
        let sTarget = 0;
        for (let s = 0; s < path.length; s += 0.05) { if (Math.abs(path.at(s).z - spec.passAt.z) < 0.06) { sTarget = s; break; } }
        let d = 0;
        for (let t = 0; t < spec.passAt.t; t += 1 / 240) d += tr.value(t) / 240;
        this.s0 = sTarget - d;
      }
    } else if (!spec.v0) {
      this.vFn = () => 0;
      this.s0 = spec.s0 || 0;
    } else {
      const v0 = spec.v0, tf = spec.fail, sp = this.sputter;
      const dSp = this._sputterDist();
      const v1 = v0 * 0.8;
      if (spec.contact) {
        // reach the leader's rear bumper at time tc with speed vc
        const tc = spec.contact.t, vc = spec.contact.vc;
        const dur = tc - (tf + sp);
        this.decel = (v1 - vc) / dur;
        const dist = ((v1 + vc) / 2) * dur;
        const cS = leaderKin.spec.stopS - (leaderKin.L + this.L) / 2;
        this.contactS = cS;
        this.s0 = cS - dist - dSp - v0 * tf;
        this.contactT = tc;
        this.vc = vc;
      } else {
        this.decel = spec.decel || 2.5;
        this.s0 = spec.stopS - v0 * tf - dSp - (v1 * v1) / (2 * this.decel);
      }
      const decel = this.decel;
      this.vFn = (t) => {
        if (t < tf) return v0;
        if (t < tf + sp) {
          const u = (t - tf) / sp;
          return v0 * (1 - 0.2 * u) * (1 + 0.08 * Math.sin(u * Math.PI * 7 + this.seed * 6) * (1 - u));
        }
        const v = v1 - decel * (t - tf - sp);
        if (this.contactT !== null && t >= this.contactT) return 0;
        return Math.max(0, v);
      };
    }
    this._integrate();
    this.leaderShoveT = null;
  }

  _sputterDist() {
    const v0 = this.spec.v0, sp = this.sputter, n = 400;
    let d = 0;
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n;
      d += v0 * (1 - 0.2 * u) * (1 + 0.08 * Math.sin(u * Math.PI * 7 + this.seed * 6) * (1 - u)) * (sp / n);
    }
    return d;
  }

  _integrate() {
    const n = Math.ceil(this.T / this.dt) + 2;
    this.sT = new Float32Array(n);
    let s = this.s0;
    for (let i = 0; i < n; i++) {
      this.sT[i] = s;
      const t = i * this.dt;
      const v = (this.vFn(t) + this.vFn(t + this.dt)) / 2;
      s += v * this.dt;
      if (this.contactT !== null && t + this.dt >= this.contactT && t < this.contactT) s = this.contactS;
      if (v <= 0 && this.tStop === Infinity && t > (this.spec.fail || 0)) this.tStop = t;
    }
  }

  s(t) {
    if (t <= 0) return this.s0 + this.vFn(0) * t;
    const f = t / this.dt, i = Math.floor(f);
    if (i >= this.sT.length - 1) return this.sT[this.sT.length - 1];
    let s = this.sT[i] + (this.sT[i + 1] - this.sT[i]) * (f - i);
    // small rebound after a collision
    if (this.contactT !== null && t > this.contactT) s -= 0.12 * (1 - Math.exp(-(t - this.contactT) / 0.07)) * Math.exp(-(t - this.contactT) / 0.6);
    // shoved by the car behind
    if (this.leaderShoveT !== null && t > this.leaderShoveT) s += 0.35 * (1 - Math.exp(-(t - this.leaderShoveT) / 0.09));
    return s;
  }
  v(t) { return (this.s(t + 0.02) - this.s(t - 0.02)) / 0.04; }
  a(t) { return (this.v(t + 0.05) - this.v(t - 0.05)) / 0.1; }

  pose(t) {
    const s = this.s(t);
    const p = this.path.at(s);
    let lat = this.spec.lateral || 0, yaw = 0;
    const sw = this.spec.swerve;
    if (sw) {
      const k = MathX.smooth(t, this.spec.fail + this.sputter, this.spec.fail + this.sputter + 2.2);
      lat += sw.lat * k;
      yaw = MathX.deg(sw.yaw) * k;
    }
    // lateral offset is to the vehicle's right
    const rx = -p.hz, rz = p.hx;
    return { x: p.x + rx * lat, z: p.z + rz * lat, heading: Math.atan2(-p.hz, p.hx) + yaw, s };
  }
}

function makeLanePath(spec) {
  if (spec.lane === 'PATH') return new SplinePath(spec.path);
  if (spec.lane === 'TURN') return new TurnPath(1.75, -20, -41, 8.75);
  const L = LAYOUT.lanes[spec.lane] || LAYOUT.crossLanes[spec.lane];
  if (L.axis === 'z') return new LinePath(L.x, 0, 0, L.dir);
  return new LinePath(0, L.z, L.dir, 0);
}

function buildKinematics(specs) {
  const out = {};
  const pending = specs.slice();
  // leaders first (contact vehicles depend on their leader's stop position)
  pending.sort((a, b) => (a.contact ? 1 : 0) - (b.contact ? 1 : 0));
  for (const spec of pending) {
    const leader = spec.contact ? out[spec.contact.leader] : null;
    out[spec.id] = new Kinematics(spec, makeLanePath(spec), leader);
    if (leader) leader.leaderShoveT = spec.contact.t;
  }
  return out;
}

// Development check: lists vehicles whose footprints overlap (except the scripted bump)
function checkTraffic(kin) {
  const issues = [];
  const ids = Object.keys(kin);
  for (let t = 0; t <= CONFIG.duration; t += 0.1) {
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const a = kin[ids[i]], b = kin[ids[j]];
      if ((a.spec.contact && a.spec.contact.leader === b.spec.id) || (b.spec.contact && b.spec.contact.leader === a.spec.id)) continue;
      const pa = a.pose(t), pb = b.pose(t);
      if (Math.abs(pa.x - pb.x) > 14 || Math.abs(pa.z - pb.z) > 14) continue;
      const gap = obbGap(pa, a.L, VEHICLE_DIMS[a.spec.type].W, pb, b.L, VEHICLE_DIMS[b.spec.type].W);
      if (gap < 0.15) issues.push(`${t.toFixed(1)}s ${a.spec.id}<->${b.spec.id} gap ${gap.toFixed(2)}m`);
    }
  }
  return issues;
}

// separating-axis gap between two oriented rectangles (negative = overlap)
function obbGap(pa, La, Wa, pb, Lb, Wb) {
  const axes = [pa.heading, pa.heading + Math.PI / 2, pb.heading, pb.heading + Math.PI / 2];
  const corners = (p, L, W) => {
    const fx = Math.cos(p.heading), fz = -Math.sin(p.heading), rx = -fz, rz = fx;
    return [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([i, j]) => [p.x + fx * L / 2 * i + rx * W / 2 * j, p.z + fz * L / 2 * i + rz * W / 2 * j]);
  };
  const A = corners(pa, La, Wa), B = corners(pb, Lb, Wb);
  let best = -Infinity;
  for (const ang of axes) {
    const ax = Math.cos(ang), az = -Math.sin(ang);
    const pA = A.map(([x, z]) => x * ax + z * az), pB = B.map(([x, z]) => x * ax + z * az);
    const g = Math.max(Math.min(...pB) - Math.max(...pA), Math.min(...pA) - Math.max(...pB));
    best = Math.max(best, g);
  }
  return best;
}
