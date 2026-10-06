/* =====================================================================
   SLIDE — the friction film's deterministic physics (ground plane, 2-D
   rigid bodies). The whole film is simulated once at load at 240 Hz and
   stored at 60 Hz; the film samples it by time, so playback, scrubbing and
   rendering agree frame for frame. Plain JS (no three.js): the tuning
   harness runs the same code in node.

   Shapes: cars are oriented boxes (L × W); everything else is a union of
   circles in its local frame (x = forward, z = right). Forces: the slope
   (m·g·sin θ downhill), air drag (½ρ·CdA·v²), and — only before 3.0 s and
   after 64.0 s — friction (tyre grip for cars, sliding friction for the
   rest). Contacts: impulses between bodies, against walls (kerbs, building
   fronts) and posts (poles, bollards — some breakable), clamped.
   Yaw convention: heading h = (−sin yaw, −cos yaw) — yaw 0 faces −Z,
   like the camera; right = (cos yaw, −sin yaw).
   ===================================================================== */

const FR = { g: 9.81, rho: 1.2, tLoss: 3.0, tBack: 64.0, mu: 0.8, end: 78 };

// the street surface: flat, then a 7° hill climbing toward −Z (smoothed over `ramp` metres); kerbs are 0.15 m
// (the hill rounds over into a level crest after `crest` metres, ≈ 36 m up)
const FrGround = {
  z0: -44, ramp: 12, crest: 290, crestLen: 24, tan: Math.tan(7 * Math.PI / 180), curb: 0.15, junction: [-37, -23], half: 7, front: 12.5,
  road(z) {
    const d = this.z0 - z, T = this.tan, c = this.crest, cl = this.crestLen;
    if (d <= 0) return 0;
    if (d < this.ramp) return T * d * d / (2 * this.ramp);
    if (d < c) return T * (d - this.ramp / 2);
    const u = Math.min(d - c, cl);
    return T * (c - this.ramp / 2) + T * (u - u * u / (2 * cl));
  },
  // dh/dz of the road (≤ 0: the ground rises toward −Z)
  dz(z) {
    const d = this.z0 - z;
    if (d <= 0) return 0;
    if (d < this.crest) return -this.tan * Math.min(1, d / this.ramp);
    return -this.tan * Math.max(0, 1 - (d - this.crest) / this.crestLen);
  },
  walk(x, z) { return Math.abs(x) > this.half && !(z < this.junction[1] && z > this.junction[0]); },
  h(x, z) { return this.road(z) + (this.walk(x, z) ? this.curb : 0); },
};

class FrTrack {
  constructor(n) { for (const k of ['x', 'z', 'yaw', 'vx', 'vz', 'wheel', 'w']) this[k] = new Float32Array(n); }
}

class SlideWorld {
  constructor({ dt = 1 / 240, store = 1 / 60, end = FR.end } = {}) {
    this.dt = dt; this.store = store; this.end = end;
    this.bodies = []; this.byId = {};
    this.walls = []; this.posts = [];
    this.events = [];          // contacts with a real hit: { t, a, b, dv, x, z, j }
    this.breaks = [];          // posts / walls that gave way: { t, id, by }
    this.ground = FrGround;
  }

  // ---- building the world ----
  // spec: { id, kind: 'car'|'disc'|'pov'|'person', m, L, W (cars) | circles [[lx, lz, r]] | r, x, z, yaw, v: [vx, vz] | speed, w,
  //   CdA, e, curbs: 'both'|'up'|'none', drive(t) → {x,z,yaw,vx,vz,w} | null (kinematic until null), hold: [[t0, t1, fn(t) → {x,z,yaw}]],
  //   kicks: [[t, dvx, dvz, dw]], wheels: { r, actions: [[t, 'roll'|'gas'|'brake'|'coast']] }, ghost(t, other) → skip contact }
  add(spec) {
    const b = Object.assign({ kind: 'disc', m: 50, yaw: 0, w: 0, CdA: 0.4, e: 0.2, curbs: 'up', kicks: [], hold: [], vx: 0, vz: 0, I: 0 }, spec);
    b.box = b.kind === 'car';
    if (b.box) { b.hl = b.L / 2; b.hw = b.W / 2; b.bound = Math.hypot(b.hl, b.hw); }
    else {
      if (!b.circles) b.circles = [[0, 0, b.r || 0.3]];
      b.bound = 0; for (const c of b.circles) b.bound = Math.max(b.bound, Math.hypot(c[0], c[1]) + c[2]);
    }
    if (spec.v) { b.vx = spec.v[0]; b.vz = spec.v[1]; }
    if (spec.speed !== undefined) { b.vx = -Math.sin(b.yaw) * spec.speed; b.vz = -Math.cos(b.yaw) * spec.speed; }
    if (!b.I) {
      if (b.box) b.I = b.m * (b.L * b.L + b.W * b.W) / 12;
      else { let r2 = 0; for (const c of b.circles) r2 = Math.max(r2, c[0] * c[0] + c[1] * c[1] + c[2] * c[2] * 0.5); b.I = b.m * Math.max(0.03, r2) * 0.6; }
    }
    b.wheelAngle = 0; b.wheelRate = 0;
    b.kickI = 0; b.kicks.sort((p, q) => p[0] - q[0]);
    b.held = false; b.free = !b.drive;
    this.bodies.push(b); this.byId[b.id] = b;
    return b;
  }
  // wall a→b; oneWay: loose things only collide from the n side (n = left of a→b), i.e. they drop off a kerb freely
  // toward: [x, z] direction the n side faces (for kerbs: the road); breakIf(world, t) → true tears it down
  wall(id, ax, az, bx, bz, { oneWay = false, e = 0.15, breakJ = 0, cars = true, toward = null, breakIf = null } = {}) {
    if (toward && (-(bz - az)) * toward[0] + (bx - ax) * toward[1] < 0) { [ax, az, bx, bz] = [bx, bz, ax, az]; }
    const dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz);
    this.walls.push({ id, ax, az, bx, bz, ux: dx / len, uz: dz / len, len, nx: -dz / len, nz: dx / len, oneWay, e, breakJ, breakIf, cars, broken: Infinity,
      x0: Math.min(ax, bx), x1: Math.max(ax, bx), z0: Math.min(az, bz), z1: Math.max(az, bz) });
  }
  post(id, x, z, r, { e = 0.2, breakJ = 0 } = {}) { this.posts.push({ id, x, z, r, e, breakJ, broken: Infinity }); }

  // ---- run ----
  run() {
    const dt = this.dt, nStore = Math.ceil(this.end / this.store) + 2, every = Math.round(this.store / dt);
    for (const b of this.bodies) b.track = new FrTrack(nStore);
    this.posts.sort((a, b) => a.z - b.z);
    this._postZ = Float64Array.from(this.posts.map((p) => p.z));
    const steps = Math.ceil(this.end / dt);
    for (let i = 0; i <= steps; i++) {
      const t = i * dt;
      if (i % every === 0) this._record(i / every);
      this._step(t, dt);
    }
    this.nStore = nStore;
    return this;
  }

  _record(k) {
    if (k >= this.bodies[0].track.x.length) return;
    for (const b of this.bodies) { const T = b.track; T.x[k] = b.x; T.z[k] = b.z; T.yaw[k] = b.yaw; T.vx[k] = b.vx; T.vz[k] = b.vz; T.wheel[k] = b.wheelAngle; T.w[k] = b.wheelRate; }
  }

  _mu(t) { return t < FR.tLoss ? FR.mu : t < FR.tBack ? 0 : FR.mu * Math.min(1, (t - FR.tBack) / 0.08); }

  _step(t, dt) {
    const G = this.ground, mu = this._mu(t);
    // 1. kinematic bodies, holds, kicks
    for (const b of this.bodies) {
      b.held = false;
      if (b.drive && !b.free) {
        const s = b.drive(t);
        if (s) { b.x = s.x; b.z = s.z; b.yaw = s.yaw; b.vx = s.vx; b.vz = s.vz; b.w = s.w || 0; b.held = true; }
        else b.free = true;
      }
      for (const H of b.hold) {
        const [t0, t1, fn, o] = H;
        if (o && o.until && !H.done && o.until(this, t)) { H.done = true; if (o.kick) { b.vx += o.kick[0]; b.vz += o.kick[1]; b.w += o.kick[2] || 0; } }
        if (!(t >= t0 && t < t1) || (o && (H.broken <= t || H.done))) continue;
        b.holdEntry = H;
        const s = fn(t), s2 = fn(Math.min(t1 - 1e-6, t + dt));
        b.vx = (s2.x - s.x) / dt; b.vz = (s2.z - s.z) / dt; b.w = (s2.yaw - s.yaw) / dt;
        b.x = s.x; b.z = s.z; b.yaw = s.yaw; b.held = true;
      }
      while (b.kickI < b.kicks.length && b.kicks[b.kickI][0] <= t) {
        const [, dvx, dvz, dw] = b.kicks[b.kickI++];
        b.vx += dvx; b.vz += dvz; b.w += dw || 0;
      }
    }
    // 2. forces on free bodies
    for (const b of this.bodies) {
      if (b.held) { this._wheels(b, t, dt, mu); continue; }
      let ax = 0, az = 0;
      const s = G.dz(b.z);                                     // the slope (the hill runs along z only)
      if (s !== 0) az += -FR.g * s / Math.sqrt(1 + s * s);
      const sp = Math.hypot(b.vx, b.vz);                       // air drag
      if (sp > 1e-4) { const k = 0.5 * FR.rho * b.CdA / b.m * sp; ax -= k * b.vx; az -= k * b.vz; }
      b.vx += ax * dt; b.vz += az * dt;
      if (mu > 0) this._friction(b, t, dt, mu);
      this._wheels(b, t, dt, mu);
      b.x += b.vx * dt; b.z += b.vz * dt; b.yaw += b.w * dt;
    }
    // 3. contacts (two passes; only the first logs events)
    const B = this.bodies, n = B.length;
    for (let it = 0; it < 2; it++) {
      for (let i = 0; i < n; i++) {
        const a = B[i];
        for (let j = i + 1; j < n; j++) {
          const c = B[j], dx = c.x - a.x, dz = c.z - a.z, R = a.bound + c.bound;
          if (dx * dx + dz * dz > R * R) continue;
          if (a.held && c.held) continue;
          if ((a.ghost && a.ghost(t, c)) || (c.ghost && c.ghost(t, a))) continue;
          if (a.box && c.box) this._boxBox(a, c, t, it === 0);
          else if (a.box) this._boxCircles(a, c, t, it === 0);
          else if (c.box) this._boxCircles(c, a, t, it === 0);
          else this._circles(a, c, t, it === 0);
        }
        this._statics(a, t, it === 0);
      }
    }
  }

  // tyres (cars) or plain sliding friction (everything else)
  _friction(b, t, dt, mu) {
    const hx = -Math.sin(b.yaw), hz = -Math.cos(b.yaw);
    if (b.box) {
      const rx = -hz, rz = hx, lon = b.vx * hx + b.vz * hz, lat = b.vx * rx + b.vz * rz;
      const act = this._action(b, t);
      const dLat = Math.sign(lat) * Math.min(Math.abs(lat), mu * FR.g * dt * 1.1);                 // tyres grip sideways
      const dLon = Math.sign(lon) * Math.min(Math.abs(lon), (act === 'brake' ? mu * FR.g * 0.95 : 0.25) * dt);   // rolling, or locked
      b.vx -= rx * dLat + hx * dLon; b.vz -= rz * dLat + hz * dLon;
      b.w *= Math.exp(-dt * 6 * mu);
    } else {
      const sp = Math.hypot(b.vx, b.vz);
      if (sp > 1e-6) { const d = Math.min(sp, mu * FR.g * 0.75 * dt); b.vx -= b.vx / sp * d; b.vz -= b.vz / sp * d; }
      b.w *= Math.exp(-dt * 5 * mu);
    }
  }

  _action(b, t) {
    const A = b.wheels && b.wheels.actions;
    if (!A) return 'roll';
    let a = 'roll';
    for (const k of A) if (k[0] <= t) a = k[1]; else break;
    return a;
  }

  // wheel spin (for the picture, but integrated here so it is continuous)
  _wheels(b, t, dt, mu) {
    if (!b.wheels) return;
    const W = b.wheels, lon = b.vx * -Math.sin(b.yaw) + b.vz * -Math.cos(b.yaw);
    const act = this._action(b, t);
    let target, tau;
    if (mu > 0 && act !== 'brake') { target = lon / W.r; tau = 0.03; }                 // gripping: wheels roll with the road
    else if (act === 'brake') { target = 0; tau = 0.06; }                              // locked
    else if (act === 'gas') { target = (W.gasRate || 50) * (W.dir || 1); tau = 0.7; }  // floored: the wheels spin up, the car doesn't move
    else { target = 0; tau = 9; }                                                      // coasting: the spin dies slowly
    b.wheelRate += (target - b.wheelRate) * (1 - Math.exp(-dt / tau));
    b.wheelAngle += b.wheelRate * dt;
  }

  /* ---------------- contact geometry ---------------- */
  _wp(b, lx, lz) { const c = Math.cos(b.yaw), s = Math.sin(b.yaw); return [b.x - s * lx + c * lz, b.z - c * lx - s * lz]; }   // local → world
  _corners(b) {
    const c = Math.cos(b.yaw), s = Math.sin(b.yaw), fx = -s, fz = -c, rx = c, rz = -s, L = b.hl, W = b.hw;
    return [[b.x + fx * L + rx * W, b.z + fz * L + rz * W], [b.x + fx * L - rx * W, b.z + fz * L - rz * W],
      [b.x - fx * L - rx * W, b.z - fz * L - rz * W], [b.x - fx * L + rx * W, b.z - fz * L + rz * W]];
  }
  // point inside box c? → { pen, nx, nz } (normal out of c through the nearest face)
  _inBox(c, px, pz, pad = 0) {
    const s = Math.sin(c.yaw), co = Math.cos(c.yaw), dx = px - c.x, dz = pz - c.z;
    const lx = dx * -s + dz * -co, lz = dx * co + dz * -s;                  // forward, right
    const ex = c.hl + pad - Math.abs(lx), ez = c.hw + pad - Math.abs(lz);
    if (ex <= 0 || ez <= 0) return null;
    if (ex < ez) { const sg = Math.sign(lx) || 1; return { pen: ex, nx: -s * sg, nz: -co * sg }; }
    const sg = Math.sign(lz) || 1; return { pen: ez, nx: co * sg, nz: -s * sg };
  }
  // corners of each box inside the other; corners pushing along the same face are merged into one contact at their
  // midpoint (resolving them one by one would twist two aligned bumpers apart)
  _boxBox(a, c, t, log) {
    for (const [A, C] of [[a, c], [c, a]]) {
      let m = null;
      for (const [px, pz] of this._corners(A)) {
        const h = this._inBox(C, px, pz);
        if (!h) continue;
        if (m && m.nx * h.nx + m.nz * h.nz > 0.99) { m.x = (m.x * m.n + px) / (m.n + 1); m.z = (m.z * m.n + pz) / (m.n + 1); m.n++; m.pen = Math.max(m.pen, h.pen); continue; }
        if (m) this._resolve(C, A, m.x, m.z, m.nx, m.nz, m.pen, Math.min(a.e, c.e), t, log);
        m = { x: px, z: pz, nx: h.nx, nz: h.nz, pen: h.pen, n: 1 };
      }
      if (m) this._resolve(C, A, m.x, m.z, m.nx, m.nz, m.pen, Math.min(a.e, c.e), t, log);
    }
  }
  _boxCircles(box, d, t, log) {
    const s = Math.sin(box.yaw), co = Math.cos(box.yaw);
    for (const q of d.circles) {
      const [px, pz] = this._wp(d, q[0], q[1]), r = q[2];
      const dx = px - box.x, dz = pz - box.z, lx = dx * -s + dz * -co, lz = dx * co + dz * -s;
      const cx = Math.max(-box.hl, Math.min(box.hl, lx)), cz = Math.max(-box.hw, Math.min(box.hw, lz));
      let nlx = lx - cx, nlz = lz - cz, dist = Math.hypot(nlx, nlz), pen;
      if (dist > 1e-6) { if (dist >= r) continue; nlx /= dist; nlz /= dist; pen = r - dist; }
      else { // centre inside the box
        const ex = box.hl - Math.abs(lx), ez = box.hw - Math.abs(lz);
        if (ex < ez) { nlx = Math.sign(lx) || 1; nlz = 0; pen = ex + r; } else { nlx = 0; nlz = Math.sign(lz) || 1; pen = ez + r; }
      }
      const nx = -s * nlx + co * nlz, nz = -co * nlx - s * nlz;            // local (fwd, right) → world
      const wx = box.x + -s * cx + co * cz, wz = box.z + -co * cx - s * cz;
      this._resolve(box, d, wx, wz, nx, nz, pen, Math.min(box.e, d.e), t, log);
    }
  }
  _circles(a, c, t, log) {
    for (const p of a.circles) {
      const [px, pz] = this._wp(a, p[0], p[1]);
      for (const q of c.circles) {
        const [qx, qz] = this._wp(c, q[0], q[1]);
        const dx = qx - px, dz = qz - pz, d2 = dx * dx + dz * dz, R = p[2] + q[2];
        if (d2 >= R * R || d2 < 1e-12) continue;
        const d = Math.sqrt(d2), nx = dx / d, nz = dz / d;
        this._resolve(a, c, px + nx * p[2], pz + nz * p[2], nx, nz, R - d, Math.min(a.e, c.e), t, log);
      }
    }
  }

  _inv(b) { return b.held ? [0, 0] : [1 / b.m, 1 / b.I]; }

  // impulse between a and c (c null = static) at contact point (cx, cz), normal n from a toward c; returns the impulse
  _resolve(a, c, cx, cz, nx, nz, pen, e, t, log) {
    const [ima, iia] = this._inv(a), [imc, iic] = c ? this._inv(c) : [0, 0];
    const sum = ima + imc;
    if (sum <= 0) return 0;
    const corr = Math.max(0, pen - 0.004) * 0.7 / sum;                    // positional correction
    a.x -= nx * corr * ima; a.z -= nz * corr * ima;
    if (c) { c.x += nx * corr * imc; c.z += nz * corr * imc; }
    // contact point velocities: v + ω × r, ω about +Y (yaw grows counter-clockwise seen from above): ω × r = (ω·rz, −ω·rx)
    const rax = cx - a.x, raz = cz - a.z, vax = a.vx + a.w * raz, vaz = a.vz - a.w * rax;
    let vcx = 0, vcz = 0, rcx = 0, rcz = 0;
    if (c) { rcx = cx - c.x; rcz = cz - c.z; vcx = c.vx + c.w * rcz; vcz = c.vz - c.w * rcx; }
    const vn = (vcx - vax) * nx + (vcz - vaz) * nz;
    if (vn > 0) return 0;                                                  // separating
    const rna = raz * nx - rax * nz, rnc = rcz * nx - rcx * nz;
    const k = sum + rna * rna * iia + rnc * rnc * iic;
    let j = -(1 + (Math.abs(vn) < 0.3 ? 0 : e)) * vn / k;                 // resting contacts don't bounce
    const jMax = 14 / k;                                                   // clamp: no contact changes a velocity by more than ~14 m/s
    if (j > jMax) j = jMax;
    // a hard enough hit tears a held thing loose first (a chain, a rack, your grip): then it takes the hit as a free body
    for (const q of [a, c]) if (q && q.held && q.holdEntry && q.holdEntry[3] && q.holdEntry[3].breakJ && j > q.holdEntry[3].breakJ && !(q.holdEntry.broken <= t)) {
      q.holdEntry.broken = t; q.held = false; this.breaks.push({ t, id: q.id + ':hold', by: q === a ? (c ? c.id : 'static') : a.id });
      return this._resolve(a, c, cx, cz, nx, nz, 0, e, t, log);
    }
    a.vx -= nx * j * ima; a.vz -= nz * j * ima; a.w -= rna * j * iia;
    if (c) { c.vx += nx * j * imc; c.vz += nz * j * imc; c.w += rnc * j * iic; }
    for (const q of [a, c]) if (q && q.bigHitJ && j > q.bigHitJ && !(q.bigHit <= t)) q.bigHit = t;
    if (log && -vn > 0.6) {
      const last = this._lastEv || (this._lastEv = {}), key = a.id + '|' + (c ? c.id : 'static');
      if (!(last[key] > t - 0.3)) { last[key] = t; this.events.push({ t, a: a.id, b: c ? c.id : null, dv: -vn, x: cx, z: cz, j }); }
    }
    return j;
  }

  _statics(b, t, log) {
    if (b.held) return;
    // posts near this body (posts are sorted by z)
    const P = this.posts, Z = this._postZ, lo = b.z - b.bound - 0.5, hi = b.z + b.bound + 0.5;
    let i0 = 0, i1 = P.length;
    while (i0 < i1) { const m = (i0 + i1) >> 1; if (Z[m] < lo) i0 = m + 1; else i1 = m; }
    for (let i = i0; i < P.length && Z[i] <= hi; i++) {
      const p = P[i];
      if (t >= p.broken || Math.abs(p.x - b.x) > b.bound + p.r) continue;
      let j = 0;
      if (b.box) {
        const s = Math.sin(b.yaw), co = Math.cos(b.yaw), dx = p.x - b.x, dz = p.z - b.z, lx = dx * -s + dz * -co, lz = dx * co + dz * -s;
        const cx = Math.max(-b.hl, Math.min(b.hl, lx)), cz = Math.max(-b.hw, Math.min(b.hw, lz));
        let nlx = lx - cx, nlz = lz - cz, d = Math.hypot(nlx, nlz), pen;
        if (d > 1e-6) { if (d >= p.r) continue; nlx /= d; nlz /= d; pen = p.r - d; }
        else { const ex = b.hl - Math.abs(lx), ez = b.hw - Math.abs(lz); if (ex < ez) { nlx = Math.sign(lx) || 1; nlz = 0; pen = ex + p.r; } else { nlx = 0; nlz = Math.sign(lz) || 1; pen = ez + p.r; } }
        const nx = -s * nlx + co * nlz, nz = -co * nlx - s * nlz;
        j = this._resolve(b, null, b.x + -s * cx + co * cz, b.z + -co * cx - s * cz, nx, nz, pen, Math.min(b.e, p.e), t, log);
      } else {
        for (const q of b.circles) {
          const [px, pz] = this._wp(b, q[0], q[1]), dx = p.x - px, dz = p.z - pz, R = q[2] + p.r, d2 = dx * dx + dz * dz;
          if (d2 >= R * R || d2 < 1e-12) continue;
          const d = Math.sqrt(d2);
          j = Math.max(j, this._resolve(b, null, px + dx / d * q[2], pz + dz / d * q[2], dx / d, dz / d, R - d, Math.min(b.e, p.e), t, log));
        }
      }
      if (p.breakJ && j > p.breakJ) { p.broken = t; this.breaks.push({ t, id: p.id, by: b.id }); }
    }
    // walls
    for (const W of this.walls) {
      if (t >= W.broken) continue;
      if (W.breakIf && W.breakIf(this, t)) { W.broken = t; this.breaks.push({ t, id: W.id, by: 'script' }); continue; }
      if (b.x < W.x0 - b.bound || b.x > W.x1 + b.bound || b.z < W.z0 - b.bound || b.z > W.z1 + b.bound) continue;
      if (b.box && !W.cars) continue;
      if (b.curbs === 'none' && W.oneWay) continue;
      const side = (b.x - W.ax) * W.nx + (b.z - W.az) * W.nz >= 0 ? 1 : -1;
      if (W.oneWay && !b.box && side < 0) continue;                         // dropping off a kerb is free
      let j = 0;
      const pts = b.box ? this._corners(b).map((q) => [q[0], q[1], 0]) : b.circles.map((q) => { const w = this._wp(b, q[0], q[1]); return [w[0], w[1], q[2]]; });
      // something hitting a kerb hard enough hops over it (a car sliding into it sideways, a cart, a bin)
      if (W.oneWay && side > 0) {
        let vMax = 0;
        for (const [px, pz] of pts) { const vx = b.vx + b.w * (pz - b.z), vz = b.vz - b.w * (px - b.x); vMax = Math.max(vMax, -(vx * W.nx + vz * W.nz)); }
        if (vMax > (b.box ? 2.4 : 2.2)) { if (!b.hops) b.hops = []; if (!b.hops.length || t - b.hops[b.hops.length - 1] > 0.5) b.hops.push(t); continue; }
      }
      const nx = -W.nx * side, nz = -W.nz * side;
      let mx = 0, mz = 0, mn = 0, mp = 0;
      for (const [px, pz, r] of pts) {
        const rx = px - W.ax, rz = pz - W.az, along = rx * W.ux + rz * W.uz;
        if (along < -r || along > W.len + r) continue;
        const dn = (rx * W.nx + rz * W.nz) * side;
        if (dn >= r) continue;
        if (dn < -0.6) continue;                                           // far behind the line: not this wall
        // (all points against one wall share its normal: merge them into one contact)
        mx += px + nx * r; mz += pz + nz * r; mn++; mp = Math.max(mp, r - dn);
      }
      if (mn) j = this._resolve(b, null, mx / mn, mz / mn, nx, nz, mp, Math.min(b.e, W.e), t, log);
      if (W.breakJ && j > W.breakJ) { W.broken = t; this.breaks.push({ t, id: W.id, by: b.id }); }
    }
  }

  // ---- sampling ----
  sample(id, t, out = {}) {
    const b = this.byId[id], T = b.track, f = Math.max(0, Math.min(this.nStore - 1.001, t / this.store)), i = Math.floor(f), u = f - i;
    const L = (A) => A[i] + (A[i + 1] - A[i]) * u;
    out.x = L(T.x); out.z = L(T.z); out.yaw = L(T.yaw); out.vx = L(T.vx); out.vz = L(T.vz); out.wheel = L(T.wheel); out.wheelRate = L(T.w);
    out.speed = Math.hypot(out.vx, out.vz);
    out.y = this.ground.h(out.x, out.z);
    return out;
  }
  brokeAt(id) { const P = this.posts.find((p) => p.id === id) || this.walls.find((w) => w.id === id); return P ? P.broken : Infinity; }
  // the first contact between two bodies (or body and a static) after t0
  hit(a, b, t0 = 0) { const e = this.events.find((v) => v.t >= t0 && ((v.a === a && v.b === b) || (v.a === b && v.b === a))); return e ? e.t : Infinity; }
}

if (typeof module !== 'undefined') module.exports = { FR, FrGround, SlideWorld };
