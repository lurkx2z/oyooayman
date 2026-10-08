/* =====================================================================
   CARS — vehicles whose tyres and springs never recover.
   Each car is the shared VehicleFactory body (js/world/vehicles.js) on a
   rig of its own: four corners with a permanent spring "set" (how far
   each steel spring has been pushed in and stayed). Tyres stay round: the
   air inside them is unchanged and still pushes the rubber back out (an
   open question for the comments). Every load event (climbing onto the
   speed table, landing off it) is found once at load time by scanning the
   car's path, so a frame is still a pure function of time.
   Also here: the box truck (copied from Friction's, then owned), the
   sparks of cars scraping on their bump stops, and the crash: an SUV
   T-bones a crossing sedan and a van piles in; momentum is conserved,
   nothing rebounds, the three stay locked together and slide as one.
   ===================================================================== */

// ---------------------------------------------------------------------------------------------------------------------
// the box truck (local frame like the factory's cars: forward +X, right +Z, origin on the ground at the centre)
// ---------------------------------------------------------------------------------------------------------------------
function neBuildTruck(factory, color) {
  const group = new THREE.Group(), body = new THREE.Group(), box = new THREE.Group(); group.add(body); body.add(box);
  const L = 7.6, W = 2.3, r = 0.5;
  const paint = factory.paint(color), cabPaint = factory.paint('#7a2f2a'), M = factory.m;
  const tail = new THREE.MeshStandardMaterial({ color: '#5a0d0d', emissive: new THREE.Color('#ff1a0e'), emissiveIntensity: 0.6, roughness: 0.3 });
  const hazard = new THREE.MeshStandardMaterial({ color: '#7a4a10', emissive: new THREE.Color('#ff9a1a'), emissiveIntensity: 0, roughness: 0.3 });
  const add = (geo, mat, x, y, z, parent = body) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
  const x0 = -L / 2, boxL = 5.45, boxX = x0 + boxL / 2, floorY = 1.22, boxH = 2.45;
  add(new THREE.BoxGeometry(L - 0.4, 0.25, 1.1), M.trim, 0, 0.78, 0);
  for (const sz of [-1, 1]) add(new THREE.BoxGeometry(boxL - 0.3, floorY - 0.84, 0.1), M.trim, boxX, (floorY + 0.84) / 2, sz * 0.5);   // the subframe under the box
  add(new THREE.BoxGeometry(boxL, boxH, W), paint, boxX, floorY + boxH / 2, 0, box);
  add(new THREE.BoxGeometry(boxL + 0.04, 0.12, W + 0.04), M.trim, boxX, floorY + 0.06, 0, box);
  const logo = Tex.label([['NORTHSIDE', 64], ['BUILDING SUPPLY', 32]], { w: 1024, h: 256, bg: '#efece4', fg: '#7a2f2a' });
  const lm = new THREE.MeshStandardMaterial({ map: logo, roughness: 0.6 });
  for (const sz of [-1, 1]) { const p = add(new THREE.PlaneGeometry(4.2, 1.05), lm, boxX + 0.2, floorY + 1.45, sz * (W / 2 + 0.006), box); p.rotation.y = sz > 0 ? 0 : Math.PI; p.castShadow = false; }
  const back = add(new THREE.PlaneGeometry(W - 0.1, boxH - 0.08), Mat.std('#d9d6cc', { roughness: 0.6 }), x0 - 0.012, floorY + boxH / 2, 0, box); back.rotation.y = -Math.PI / 2;
  // the rear underride bar (it drags on the road once the rear springs give up)
  const bar = add(new THREE.BoxGeometry(0.12, 0.12, W - 0.2), M.trim, x0 + 0.05, 0.52, 0, box);
  const cabX = x0 + boxL + 1.05;
  add(new THREE.BoxGeometry(2.0, 1.25, W - 0.1), cabPaint, cabX, 0.95 + 0.62, 0);
  add(new THREE.BoxGeometry(1.45, 0.95, W - 0.14), cabPaint, cabX - 0.27, 2.2 + 0.47 - 0.05, 0);
  const ws = add(new THREE.BoxGeometry(0.06, 0.9, W - 0.3), M.glass, cabX + 0.55, 2.62, 0); ws.rotation.z = 0.32;
  for (const sz of [-1, 1]) add(new THREE.BoxGeometry(0.9, 0.62, 0.02), M.glass, cabX - 0.2, 2.62, sz * (W / 2 - 0.04));
  add(new THREE.BoxGeometry(0.06, 0.55, W * 0.62), M.trim, cabX + 1.0, 1.25, 0);
  add(new THREE.BoxGeometry(0.2, 0.3, W), M.trim, cabX + 1.02, 0.72, 0);
  for (const sz of [-1, 1]) {
    add(new THREE.BoxGeometry(0.06, 0.18, 0.32), M.head, cabX + 1.02, 1.0, sz * (W / 2 - 0.3));
    add(new THREE.BoxGeometry(0.05, 0.22, 0.14), tail, x0 - 0.03, floorY + 0.2, sz * (W / 2 - 0.16), box);
    add(new THREE.BoxGeometry(0.06, 0.08, 0.14), hazard, cabX + 1.02, 0.82, sz * (W / 2 - 0.12));
    add(new THREE.BoxGeometry(0.06, 0.08, 0.14), hazard, x0 - 0.03, floorY - 0.04, sz * (W / 2 - 0.12), box);
    add(new THREE.BoxGeometry(0.08, 0.32, 0.06), M.trim, cabX + 0.45, 2.45, sz * (W / 2 + 0.22));
  }
  const wheels = [];
  for (const [ax, dual] of [[x0 + 1.25, true], [cabX + 0.2, false]]) for (const sz of [-1, 1]) {
    const w = new THREE.Mesh(factory.wheelGeo(r, 0.28), [M.tire, M.rim, M.rim]); w.position.set(ax, r, sz * (W / 2 - 0.2)); group.add(w); wheels.push(w);
    if (dual) { const w2 = new THREE.Mesh(factory.wheelGeo(r, 0.28), [M.tire, M.rim, M.rim]); w2.position.set(ax, r, sz * (W / 2 - 0.5)); group.add(w2); w.userData.twin = w2; }
  }
  return { group, body, box, wheels, r, tail, hazard, L, W, height: floorY + boxH, bar, axles: [x0 + 1.25 + L / 2, cabX + 0.2 + L / 2], exhaust: new THREE.Vector3(x0 + boxL + 0.2, 0.4, -W / 2 + 0.2) };
}

// a coil spring + damper (unit height along +Y, scaled to the current spring length)
function neCoilGeo() {
  const pts = []; for (let i = 0; i <= 120; i++) { const a = i / 120 * Math.PI * 2 * 6; pts.push(new THREE.Vector3(Math.cos(a) * 0.055, i / 120, Math.sin(a) * 0.055)); }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, 0.011, 6, false);
}

// ---------------------------------------------------------------------------------------------------------------------
// one car on the rig
//   spec: { id, type, color, pose(t) → {x, z, yaw, dist}, k: [rear, front] load multipliers (axle 0 is the rear), preset: [rear, front] spring set
//           already taken before the film, coils, low (scrapes), hazardFrom, brake(t),
//           crush(t) → {front, rear, left, right, xc} }
// ---------------------------------------------------------------------------------------------------------------------
class NeCar {
  constructor(scene, factory, spec) {
    this.spec = spec;
    const v = spec.type === 'truck' ? neBuildTruck(factory, spec.color) : factory.build(spec.type, spec.color);
    this.v = v; this.g = v.group; this.g.name = 'veh:' + spec.type; scene.add(this.g);
    const P = CAR_PROFILES[spec.type];
    this.L = v.L || (P && P.L) || 12; this.W = v.W || (P && P.W) || 2.55; this.r = v.r;
    this.axles = v.axles ? v.axles.map((a) => a - this.L / 2) : spec.type === 'bus' ? [2.4 - 6, 8.4 - 6] : P.axles.map((a) => a - P.L / 2);
    this.yb = spec.type === 'bus' ? 0.38 : spec.type === 'truck' ? 0.6 : P.yb;
    // own tyre geometry per wheel (so each can keep its own flat spots)
    this.wheels = v.wheels.map((w) => {
      const r = this.r, geo = new THREE.CylinderGeometry(r, r, spec.type === 'truck' ? 0.28 : spec.type === 'bus' ? 0.3 : 0.23, 40, 1); geo.rotateX(Math.PI / 2);
      w.geometry = geo; if (w.userData.twin) w.userData.twin.geometry = geo;
      return { m: w, geo, base: geo.attributes.position.array.slice(), axle: w.position.x > 0 ? 1 : 0, side: w.position.z > 0 ? 1 : 0, flats: [], key: '' };
    });
    // coil springs in the front and rear arches (the hero car only; seen from the low wheel shot)
    if (spec.coils) {
      const cg = neCoilGeo(), cm = Mat.std('#3b6f9e', { roughness: 0.35, metalness: 0.6 }), dm = Mat.std('#1c1e20', { roughness: 0.4, metalness: 0.6 });
      this.coils = [];
      for (const w of this.wheels) {
        const c = new THREE.Mesh(cg, cm), d = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 8), dm);
        d.geometry.translate(0, 0.5, 0);
        const z = (w.side ? 1 : -1) * (this.W / 2 - 0.36);
        c.position.set(w.m.position.x, 0, z); d.position.set(w.m.position.x, 0, z);
        this.g.add(c, d); this.coils.push({ c, d, w });
      }
      // narrow the dark wheel-well blocks so the coils show in the arch
      v.body.children.forEach((m) => { if (m.material && m.material.name === 'well') m.scale.z = 0.5; });
    }
    this.lift = spec.lift || 0;
    // crushable bodies: keep every body mesh's rest positions (deformed from them each time the crush changes)
    if (spec.crush) { this.crushables = []; v.body.traverse((m) => { if (m.isMesh) { m.geometry = m.geometry.clone(); this.crushables.push({ m, base: m.geometry.attributes.position.array.slice() }); } }); this._ck = ''; }
    this._findEvents();
  }

  // where axle i is in the world (z), from the pose
  _axleZ(ps, i) { return ps.z - Math.cos(ps.yaw) * this.axles[i]; }
  _axleX(ps, i) { return ps.x - Math.sin(ps.yaw) * this.axles[i]; }

  // scan the path once: every time an axle climbs onto the table or lands off it (after the rule has bitten), the springs
  // on that axle take a permanent set
  _findEvents() {
    const S = this.spec, k = S.k || [1, 1], ev = [];
    this.events = ev;
    const t0 = Math.max(NE.rule[1], S.from || 0), dt = 1 / 120;
    const prevH = [null, null], prevS = [0, 0];
    for (let t = t0; t <= CONFIG.duration; t += dt) {
      const ps = S.pose(t);
      if (!ps || ps.hidden) continue;
      for (let i = 0; i < 2; i++) {
        const h = neRoadY(this._axleZ(ps, i)), slope = prevH[i] === null ? 0 : (h - prevH[i]) / dt;
        if (prevH[i] !== null) {
          // (one event per axle per ramp: ignore a repeat within 0.3 s)
          const fresh = (kind) => !ev.some((e) => e.axle === i && e.kind === kind && t - e.t < 0.3);
          if (prevS[i] <= 1e-4 && slope > 1e-3 && fresh('climb')) ev.push({ t, axle: i, kind: 'climb', a: 0.042 * k[i] });
          if (prevS[i] < -1e-3 && h <= 1e-5 && fresh('land')) ev.push({ t, axle: i, kind: 'land', a: 0.034 * k[i] });
        }
        prevH[i] = h; prevS[i] = slope;
      }
    }
  }

  // permanent spring set on axle i at time t (smoothly applied over ~0.07 s per event, capped at the bump stop)
  set(t, i) {
    let c = (this.spec.preset || [0, 0])[i];
    for (const e of this.events) if (e.axle === i && t > e.t) c += e.a * MathX.smooth(t, e.t, e.t + 0.07);
    return Math.min(c, this.spec.stop || 0.16);
  }

  // radius of support under a wheel at contact angle phi (the flat spots make it a polygon)
  _support(w, t, phi) {
    let R = this.r;
    for (const f of w.flats) {
      if (t < f.t) continue;
      const d = f.d * MathX.smooth(t, f.t, f.t + 0.06), da = Math.atan2(Math.sin(phi - f.phi), Math.cos(phi - f.phi));
      if (Math.abs(da) < Math.PI / 2) R = Math.min(R, (this.r - d) / Math.cos(da));
    }
    return R;
  }

  _tyre(w, t) {
    const parts = []; for (const f of w.flats) if (t >= f.t) parts.push((f.d * MathX.smooth(t, f.t, f.t + 0.06)).toFixed(4));
    const key = parts.join(','); if (key === w.key) return; w.key = key;
    const p = w.geo.attributes.position.array, b = w.base, r = this.r;
    for (let i = 0; i < p.length; i += 3) {
      const x = b[i], y = b[i + 1], rr = Math.hypot(x, y);
      if (rr < r * 0.7) { p[i] = x; p[i + 1] = y; p[i + 2] = b[i + 2]; continue; }
      const phi = Math.atan2(y, x), R = this._support(w, t, phi), k = R / r;
      // pushed-in rubber bulges the sidewall out where it was flattened
      p[i] = x * k; p[i + 1] = y * k; p[i + 2] = b[i + 2] * (1 + 1.6 * (1 - k));
    }
    w.geo.attributes.position.needsUpdate = true; w.geo.computeVertexNormals();
  }

  _crush(c) {
    const key = `${c.front.toFixed(3)}_${c.rear.toFixed(3)}_${c.left.toFixed(3)}_${c.right.toFixed(3)}`;
    if (key === this._ck) return; this._ck = key;
    const L = this.L, W = this.W, Z = 0.95;
    for (const { m, base } of this.crushables) {
      const p = m.geometry.attributes.position.array;
      for (let i = 0; i < p.length; i += 3) {
        let x = base[i], y = base[i + 1], z = base[i + 2];
        const wob = (hash2(Math.round(x * 31), Math.round(y * 37 + z * 13)) - 0.5);
        if (c.front > 0 && x > L / 2 - Z) { const u = (x - (L / 2 - Z)) / Z; x = (L / 2 - Z) + (x - (L / 2 - Z)) * (Z - c.front) / Z; y += c.front * (0.28 * Math.sin(u * Math.PI) * (y > 0.6 ? 1 : 0.3) + 0.12 * wob); z *= 1 + 0.06 * c.front * u; }
        if (c.rear > 0 && x < -L / 2 + Z) { const u = ((-L / 2 + Z) - x) / Z; x = (-L / 2 + Z) - ((-L / 2 + Z) - x) * (Z - c.rear) / Z; y += c.rear * (0.2 * Math.sin(u * Math.PI) * (y > 0.6 ? 1 : 0.3) + 0.1 * wob); }
        for (const [s, amt] of [[1, c.right], [-1, c.left]]) {
          if (amt <= 0) continue;
          const zz = s * z, z0 = W / 2 - 0.75;
          if (zz > z0) { const g = Math.exp(-(((x - c.xc) / 1.05) ** 2)), h = MathX.smooth(zz, z0, W / 2); z -= s * amt * g * h * (1 + 0.15 * wob); y -= amt * 0.12 * g * h * (y > 1.0 ? 1 : 0); }
        }
        p[i] = x; p[i + 1] = y; p[i + 2] = z;
      }
      m.geometry.attributes.position.needsUpdate = true; m.geometry.computeVertexNormals();
    }
  }

  update(t) {
    const S = this.spec, ps = S.pose(t), g = this.g;
    g.visible = !!ps && !ps.hidden;
    if (!g.visible) return;
    g.position.set(ps.x, 0, ps.z); g.rotation.set(0, ps.yaw + Math.PI / 2, 0);
    // corners: wheel centre heights from the road + the support radius at the current contact angle
    const corner = [[0, 0], [0, 0]];
    for (const w of this.wheels) {
      this._tyre(w, t);
      const ang = ps.dist / this.r, phi = -Math.PI / 2 + ang, R = this._support(w, t, phi);
      const az = ps.z - Math.cos(ps.yaw) * w.m.position.x, road = neRoadY(az);
      w.m.position.y = road + R;
      w.m.rotation.z = -ang;
      if (w.m.userData.twin) { w.m.userData.twin.position.y = w.m.position.y; w.m.userData.twin.rotation.z = -ang; }
      corner[w.axle][w.side] = road + R - this.r - this.set(t, w.axle) - (S.kneel && w.side === S.kneel.side ? S.kneel.a * MathX.smooth(t, S.kneel.t, S.kneel.t + 0.5) : 0);
    }
    const front = (corner[1][0] + corner[1][1]) / 2, rear = (corner[0][0] + corner[0][1]) / 2, wb = this.axles[1] - this.axles[0];
    const left = (corner[0][0] + corner[1][0]) / 2, right = (corner[0][1] + corner[1][1]) / 2;
    const b = this.v.body;
    b.position.y = (front + rear) / 2 + this.lift + (ps.lift || 0);
    b.rotation.z = Math.atan2(front - rear, wb) + (ps.pitch || 0);
    b.rotation.x = Math.atan2(left - right, this.W - 0.3) * -1 + (ps.roll || 0);
    // the truck's box tips back on its crushed rear springs
    if (this.v.box && S.boxTilt) this.v.box.rotation.z = S.boxTilt(t);
    if (this.coils) for (const { c, d, w } of this.coils) {
      const wy = w.m.position.y, top = this.r * 2 + 0.06 + this.lift + b.position.y + (w.axle ? 1 : -1) * Math.tan(b.rotation.z) * wb / 2;
      const len = Math.max(0.03, top - (wy + this.r * 0.35));
      c.position.y = wy + this.r * 0.35; c.scale.set(1, len, 1); d.position.y = wy + this.r * 0.35; d.scale.set(1, len, 1);
    }
    // lights
    const br = S.brake ? S.brake(t) : 0;
    this.v.tail.emissiveIntensity = 0.6 + 2.6 * br;
    if (this.v.hazard) this.v.hazard.emissiveIntensity = S.hazardFrom !== undefined && t > S.hazardFrom ? (Math.floor((t - S.hazardFrom) * 2.4) % 2 ? 0 : 3.2) : 0;
    if (this.crushables) this._crush(S.crush(t));
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// lane motion helpers
// ---------------------------------------------------------------------------------------------------------------------
// a car in lane x heading −Z (dir −1) or +Z (dir +1), with speed keys [[t, v], …] (m/s, linear between keys), at z0 at time t0
function neLane(x, dir, t0, z0, vkeys, extra = {}) {
  const tab = [], dt = 1 / 60;
  let z = z0, d = 0;
  const vAt = (t) => { if (t <= vkeys[0][0]) return vkeys[0][1]; for (let i = 1; i < vkeys.length; i++) if (t <= vkeys[i][0]) { const [ta, va] = vkeys[i - 1], [tb, vb] = vkeys[i]; return va + (vb - va) * (t - ta) / (tb - ta); } return vkeys[vkeys.length - 1][1]; };
  for (let t = t0; t <= CONFIG.duration + 1; t += dt) { tab.push([z, d]); const v = vAt(t); z += dir * v * dt; d += v * dt; }
  const yaw = dir < 0 ? 0 : Math.PI;
  return (t) => {
    if (extra.until !== undefined && t > extra.until) return null;
    if (t < t0) { const v = vAt(t0); return { x, z: z0 - dir * v * (t0 - t), yaw, dist: -v * (t0 - t) }; }
    const f = (t - t0) / dt, i = Math.min(tab.length - 2, Math.floor(f)), u = f - i;
    return { x, z: tab[i][0] + (tab[i + 1][0] - tab[i][0]) * u, yaw, dist: tab[i][1] + (tab[i + 1][1] - tab[i][1]) * u };
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// the crash (story time). SUV (2000 kg) runs the red at 34 km/h, braking late, into the side of a crossing sedan
// (1450 kg, 36 km/h). Perfectly inelastic: one body afterwards, momentum and angular momentum conserved, then tyre drag
// stops it. A following van (2100 kg) can't stop and locks on too.
// ---------------------------------------------------------------------------------------------------------------------
const NE_CRASH = (() => {
  const ti = NE.crash, mS = 2000, mD = 1450, mV = 2100;
  const S = CAR_PROFILES.suv, D = CAR_PROFILES.sedan, VN = CAR_PROFILES.van;
  const pS = [-1.75, -44.25 - D.W / 2 - S.L / 2 + 0.05], pD = [-1.75, -44.25];   // positions at contact (x, z)
  const vS = [0, 9.6], vD = [10.0, 0];
  const M1 = mS + mD, c1 = [(mS * pS[0] + mD * pD[0]) / M1, (mS * pS[1] + mD * pD[1]) / M1];
  const V1 = [(mS * vS[0] + mD * vD[0]) / M1, (mS * vS[1] + mD * vD[1]) / M1];
  const Iown = (m, P) => m * (P.L * P.L + P.W * P.W) / 12;
  const cross = (r, v) => r[0] * v[1] - r[1] * v[0];   // (x, z) plane; + = turning from +x toward +z
  const rS = [pS[0] - c1[0], pS[1] - c1[1]], rD = [pD[0] - c1[0], pD[1] - c1[1]];
  const L1 = mS * cross(rS, vS) + mD * cross(rD, vD);
  const I1 = Iown(mS, S) + Iown(mD, D) + mS * (rS[0] ** 2 + rS[1] ** 2) + mD * (rD[0] ** 2 + rD[1] ** 2);
  const w1 = 0.7 * L1 / I1;            // (30 % of the spin lost to the tyres scrubbing during the crush)
  const decel = 6.2;
  // a rigid "wreck" sliding from c at velocity V spinning at w (rad/s about +Y, x→z positive) and braked by its tyres
  const slide = (c, V, w, ts, τ) => {
    const sp = Math.hypot(V[0], V[1]), Ts = sp / decel, k = Math.min(τ, Ts), s = sp * k - 0.5 * decel * k * k, dir = sp > 0 ? [V[0] / sp, V[1] / sp] : [0, 0];
    const ang = w * (k - 0.5 * k * k / Ts);
    return { x: c[0] + dir[0] * s, z: c[1] + dir[1] * s, ang, v: [dir[0] * (sp - decel * k), dir[1] * (sp - decel * k)], w: w * (1 - k / Ts) };
  };
  // the van: 15.5 m behind the SUV's centre, 12 m/s; brakes 0.65 s after the hit (7 m/s²); find when it reaches the SUV's rear
  const v0 = 12, tb = ti + 0.65, zv0 = pS[1] - 15.5;
  const vanZ = (t) => { if (t <= tb) return zv0 + v0 * (t - ti); const k = Math.min(t - tb, v0 / 7); return zv0 + v0 * (tb - ti) + v0 * k - 3.5 * k * k; };
  const vanV = (t) => (t <= tb ? v0 : Math.max(0, v0 - 7 * (t - tb)));
  const rot = (x, z, a) => [x * Math.cos(a) - z * Math.sin(a), x * Math.sin(a) + z * Math.cos(a)];
  let tv = null;
  for (let t = ti; t < ti + 3; t += 1 / 480) {
    const w = slide(c1, V1, w1, ti, t - ti), rel = rot(rS[0], rS[1], w.ang);
    // the SUV's rear corners (its heading turns with the wreck: initially +z)
    let minZ = 1e9;
    for (const sx of [-1, 1]) { const corner = rot(sx * S.W / 2, -S.L / 2, w.ang); const cx = w.x + rel[0] + corner[0], cz = w.z + rel[1] + corner[1]; if (Math.abs(cx - -1.75) < VN.W / 2 + 0.2) minZ = Math.min(minZ, cz); }
    if (vanZ(t) + VN.L / 2 >= minZ) { tv = t; break; }
  }
  if (tv === null) tv = ti + 1.2;
  const w2s = slide(c1, V1, w1, ti, tv - ti);
  const pV = [-1.75, vanZ(tv)], vV = [0, vanV(tv)];
  const M2 = M1 + mV, c2 = [(M1 * w2s.x + mV * pV[0]) / M2, (M1 * w2s.z + mV * pV[1]) / M2];
  const V2 = [(M1 * w2s.v[0] + mV * vV[0]) / M2, (M1 * w2s.v[1] + mV * vV[1]) / M2];
  const rW = [w2s.x - c2[0], w2s.z - c2[1]], rV = [pV[0] - c2[0], pV[1] - c2[1]];
  const I1c = I1 + M1 * (rW[0] ** 2 + rW[1] ** 2), I2 = I1c + Iown(mV, VN) + mV * (rV[0] ** 2 + rV[1] ** 2);
  const L2 = I1 * w2s.w + M1 * cross(rW, w2s.v) + mV * cross(rV, vV);
  const w2 = 0.7 * L2 / I2;
  return { ti, tv, pS, pD, vS, vD, c1, V1, w1, rS, rD, c2, V2, w2, rW, rV, pV, w2s, vanZ, slide, rot, zv0, v0, tb, S, D, VN };
})();

// pose of crash car `who` ('suv' | 'sedan' | 'van') at time t
function neCrashPose(who, t) {
  const C = NE_CRASH, rot = C.rot;
  const baseYaw = { suv: Math.PI, sedan: -Math.PI / 2, van: Math.PI }[who];
  if (who === 'van' && t < C.tv) { const z = C.vanZ(t); return { x: -1.75, z, yaw: Math.PI, dist: z - C.zv0 }; }
  if (t < C.ti) {
    if (who === 'suv') { const tb = C.ti - 0.32, vi = C.vS[1], a = 7; let z; if (t > tb) { const k = C.ti - t; z = C.pS[1] - (vi * k + 0.5 * a * k * k); } else { const zb = C.pS[1] - (vi * 0.32 + 0.5 * a * 0.32 * 0.32); z = zb - (vi + a * 0.32) * (tb - t); } return { x: C.pS[0], z, yaw: Math.PI, dist: z + 100 }; }
    if (who === 'sedan') { const x = C.pD[0] + C.vD[0] * (t - C.ti); return { x, z: C.pD[1], yaw: -Math.PI / 2, dist: x + 100 }; }
  }
  // locked: first wreck (suv + sedan), then the bigger wreck (all three)
  let x, z, ang;
  // the crush draws the SUV's nose 0.55 m into the sedan during the first 0.09 s (its centre moves with it)
  const dig = (who === 'suv' ? 0.42 : 0) * MathX.smooth(t, C.ti, C.ti + 0.09);
  if (t < C.tv || who === 'van') {
    if (who !== 'van' && t < C.tv) {
      const w = C.slide(C.c1, C.V1, C.w1, C.ti, t - C.ti), r0 = who === 'suv' ? [C.rS[0], C.rS[1] + dig] : C.rD, r = rot(r0[0], r0[1], w.ang);
      return { x: w.x + r[0], z: w.z + r[1], yaw: baseYaw - w.ang, dist: 0 };
    }
  }
  const w = C.slide(C.c2, C.V2, C.w2, C.tv, t - C.tv), a1 = C.w2s.ang;
  if (who === 'van') { const digV = 0.3 * MathX.smooth(t, C.tv, C.tv + 0.08), r = rot(C.rV[0], C.rV[1] + digV, w.ang); return { x: w.x + r[0], z: w.z + r[1], yaw: Math.PI - w.ang, dist: 0 }; }
  const r0 = who === 'suv' ? rot(C.rS[0], C.rS[1] + 0.42, a1) : rot(C.rD[0], C.rD[1], a1);
  const rel = [r0[0] + C.rW[0], r0[1] + C.rW[1]], r = rot(rel[0], rel[1], w.ang);
  x = w.x + r[0]; z = w.z + r[1]; ang = a1 + w.ang;
  return { x, z, yaw: baseYaw - ang, dist: 0 };
}

// ---------------------------------------------------------------------------------------------------------------------
// the tap (story time): a hatch arriving late behind the wreck brakes from 36 km/h but still meets the van's rear at
// 5 km/h (1.4 m/s): a speed bumpers normally shrug off. It stops dead against the wreck (perfectly inelastic: the
// wreck is braked and five times heavier, so they move on together by about a centimetre). Its bumper stays pushed in.
// ---------------------------------------------------------------------------------------------------------------------
const NE_TAP = (() => {
  const VN = CAR_PROFILES.van, HB = CAR_PROFILES.hatch, v = neCrashPose('van', NE.tap), back = v.z - Math.cos(v.yaw - Math.PI) * VN.L / 2;
  const vc = 1.4, v0 = 10, a = 6, zc = back - HB.L / 2 + 0.02, tb = NE.tap - (v0 - vc) / a, zb = zc - (v0 * v0 - vc * vc) / (2 * a);
  return { vc, v0, a, zc, tb, zb, x: -1.75, dent: 0.075, dentVan: 0.03 };
})();
function neTapPose(t) {
  const T = NE_TAP;
  if (t < 44) return null;
  let z, d;
  if (t < T.tb) { z = T.zb - T.v0 * (T.tb - t); }
  else if (t < NE.tap) { const k = t - T.tb; z = T.zb + T.v0 * k - 0.5 * T.a * k * k; }
  else z = T.zc + T.dent * 0.6 * MathX.smooth(t, NE.tap, NE.tap + 0.12);   // (the crush takes up most of the last bit)
  d = z + 400;
  return { x: T.x, z, yaw: Math.PI, dist: d };
}

// ---------------------------------------------------------------------------------------------------------------------
// all the traffic
// ---------------------------------------------------------------------------------------------------------------------
class NeTraffic {
  constructor(scene) {
    const F = new VehicleFactory(); this.factory = F;
    const T = NE.car;
    const cars = [];
    const add = (spec) => { const c = new NeCar(scene, F, spec); cars.push(c); return c; };
    // H — the red hatch that crosses the speed table in front of you (coil springs visible in its arches), then drives on
    this.H = add({ id: 'H', type: 'hatch', color: '#9a2e26', coils: true, lift: 0.07, stop: 0.2, preset: [0.012, 0.01],
      pose: neLane(5.25, -1, T.t0, 10.2, [[T.t0, 4.2], [23.3, 4.2], [23.7, 3.4], [26.8, 3.4], [29.5, 8.0], [75, 8.0]]) });
    // background life during the opening (they cross the table before the rule bites, or far away)
    add({ id: 'B1', type: 'sedan', color: '#6c7a86', pose: neLane(1.75, -1, 0, 6, [[0, 9.0]], { until: 12 }) });
    add({ id: 'B2', type: 'suv', color: '#3d4a44', pose: neLane(-5.25, 1, 0, -60, [[0, 8.0]], { until: 14 }) });
    add({ id: 'B3', type: 'taxi', color: '#c9a64a', pose: neLane(-1.75, 1, 0, -120, [[0, 10.0]], { until: 16 }) });
    // the traffic beat. The loaded box truck comes past you (lane 1.75, away from you) and over the table: the heavy rear
    // axle's leaf springs take most of the set and end on their bump stops (≈ 12 cm), so it sits tail-down. Oncoming cars
    // already ride low and scrape on the table.
    this.truck = add({ id: 'TR', type: 'truck', color: '#e9e5da', k: [1.45, 0.35], stop: 0.125, preset: [0.015, 0.012], pose: neLane(1.75, -1, 28, 30, [[28, 7], [32.5, 4.0], [75, 4.0]]) });
    this.c1 = add({ id: 'C1', type: 'sedan', color: '#55606b', low: true, preset: [0.1, 0.11], pose: neLane(-1.75, 1, 27, -70, [[27, 9], [31.0, 5.2], [36, 5.2]]), brake: (t) => MathX.window(t, 30.4, 31.6, 0.2, 0.2) });
    add({ id: 'C2', type: 'suv', color: '#4a5546', low: true, preset: [0.09, 0.1], pose: neLane(-5.25, 1, 28, -72, [[28, 8], [32.4, 4.8], [40, 4.8]]) });
    // the bus pulls in at the stop on the far side (air suspension: air is unchanged, so it rides normally)
    this.bus = add({ id: 'BUS', type: 'bus', color: '#d8d4c6', pose: neLane(-5.25, 1, 30, -95, [[30, 6], [37.5, 4.6], [43.0, 4.6], [45.5, 0]]) });
    add({ id: 'C5', type: 'hatch', color: '#6e5a48', low: true, preset: [0.1, 0.1], pose: neLane(1.75, -1, 37, 30, [[37, 6.0]], { until: 56 }) });
    // traffic held up by the wreck: one that arrives late and taps the van (see NE_TAP), one at the red on the far lane
    this.q1 = add({ id: 'Q1', type: 'hatch', color: '#3f8a8c', preset: [0.03, 0.03], pose: neTapPose, brake: (t) => (t > NE_TAP.tb ? 1 : 0), crush: (t) => ({ front: NE_TAP.dent * MathX.smooth(t, NE.tap, NE.tap + 0.12), rear: 0, left: 0, right: 0, xc: 0 }) });
    add({ id: 'Q2', type: 'van', color: '#8a8f96', preset: [0.05, 0.06], pose: neLane(-5.25, 1, 44, -150, [[44, 9], [53.5, 9], [55.5, 0]]), brake: (t) => (t > 53.5 ? 1 : 0) });
    // the crash cars
    const crushOf = (who) => (t) => {
      const C = NE_CRASH, a = MathX.smooth(t, C.ti, C.ti + 0.09), b = MathX.smooth(t, C.tv, C.tv + 0.08);
      if (who === 'suv') return { front: 0.6 * a, rear: 0.38 * b, left: 0, right: 0, xc: 0 };
      if (who === 'sedan') return { front: 0, rear: 0, left: 0.55 * a, right: 0, xc: 0.15 };
      return { front: 0.42 * b, rear: NE_TAP.dentVan * MathX.smooth(t, NE.tap, NE.tap + 0.12), left: 0, right: 0, xc: 0 };
    };
    this.suv = add({ id: 'X1', type: 'suv', color: '#c98a2b', preset: [0.07, 0.06], pose: (t) => (t < 44 ? null : neCrashPose('suv', t)), crush: crushOf('suv'), brake: (t) => (t > NE.crash - 0.32 ? 1 : 0) });
    this.sedan = add({ id: 'X2', type: 'sedan', color: '#8b9aa8', preset: [0.05, 0.05], pose: (t) => (t < 44 ? null : neCrashPose('sedan', t)), crush: crushOf('sedan') });
    this.van = add({ id: 'X3', type: 'van', color: '#dcd8ce', preset: [0.05, 0.07], pose: (t) => (t < 44 ? null : neCrashPose('van', t)), crush: crushOf('van'), brake: (t) => (t > NE_CRASH.tb ? 1 : 0), hazardFrom: 57 });
    this.cars = cars;
    this.truck.spec.boxTilt = null;
    // sparks (scraping bump stops / the truck's dragging bar) and crash debris
    this.sparks = new StreakSystem(scene, 400);
    this.dust = new BillboardSystem(scene, 260);
    this.bits = new BillboardSystem(scene, 200, false);
    this._sp = this._sparkSources();
    this._v = new THREE.Vector3();
  }

  // every "scrape": a low car's bumper meeting the table
  _sparkSources() {
    const out = [];
    for (const c of this.cars) {
      if (!c.spec.low) continue;
      for (const e of c.events) out.push({ c, t0: e.t + (e.kind === 'climb' ? -0.05 : 0.02), dur: 0.35, end: e.kind === 'climb' ? (e.axle ? 1 : -1) : (e.axle ? 1 : -1), seed: out.length * 7 + 1 });
    }
    return out;
  }

  heroRide(t) { const H = this.H; return Math.round(((H.set(t, 0) + H.set(t, 1)) / 2 - 0.011) * 100 + 0.4); }

  update(t, camera, fog) {
    for (const c of this.cars) c.update(t);
    // sparks: short streaks fired backward from the scraping point; brighter at the start
    const S = this.sparks; S.begin();
    for (const s of this._sp) {
      const a = t - s.t0; if (a < 0 || a > s.dur) continue;
      const c = s.c, ps = c.spec.pose(t); if (!ps) continue;
      const hx = -Math.sin(ps.yaw), hz = -Math.cos(ps.yaw), off = s.end * (c.L / 2 - 0.1);
      const bx = ps.x + hx * off, bz = ps.z + hz * off, by = neRoadY(bz) + 0.02;
      const n = s.drag ? 7 : 16;
      for (let i = 0; i < n; i++) {
        const k = s.seed * 31 + i * 7 + Math.floor(t * 30) * 113, life = 0.25 + 0.2 * hash1(k);
        const age = ((t * 30 + i * 0.37) % 9) / 30 * (s.drag ? 1 : 0.6) + (s.drag ? 0 : a * 0.3);
        if (age > life) continue;
        const sx = (hash1(k + 1) - 0.5) * 1.6, sp = 3 + 4 * hash1(k + 2);
        const vx = -hx * sp + -hz * sx, vz = -hz * sp + hx * sx, vy = 1.2 + 2.2 * hash1(k + 3);
        const px = bx + (hash1(k + 4) - 0.5) * c.W * 0.7 * hz, pz = bz + (hash1(k + 4) - 0.5) * c.W * 0.7 * -hx;
        const x1 = px + vx * age, y1 = by + vy * age - 4.9 * age * age, z1 = pz + vz * age;
        if (y1 < 0) continue;
        const fade = (1 - age / life) * (s.drag ? 0.8 : 1) * (1 - MathX.smooth(a, s.dur * 0.6, s.dur));
        S.push(x1, y1, z1, x1 - vx * 0.03, y1 - (vy - 9.8 * age) * 0.03, z1 - vz * 0.03, 1.0, 0.62, 0.22, fade, 0.012);
      }
    }
    S.end();
    // crash dust and glass: at the hit and at the van's hit (puffs that spread and settle), glass bits that scatter and stay
    const D = this.dust; D.begin(fog);
    const B = this.bits; B.begin(fog);
    const C = NE_CRASH;
    for (const [tc, n, who] of [[C.ti, 46, 'sedan'], [C.tv, 30, 'van']]) {
      const a = t - tc; if (a < 0) continue;
      const ps = neCrashPose(who === 'sedan' ? 'sedan' : 'suv', tc + 0.02);
      for (let i = 0; i < n; i++) {
        const k = i * 13 + (who === 'van' ? 500 : 0), life = 1.8 + 1.6 * hash1(k);
        if (a < life) {
          const ang = hash1(k + 1) * 6.283, sp = 0.6 + 2.0 * hash1(k + 2), sl = Math.min(a, 1.2);
          const x = ps.x + Math.cos(ang) * (0.5 + sp * sl), z = ps.z + Math.sin(ang) * (0.5 + sp * sl), y = 0.12 + 0.5 * hash1(k + 3) + 0.3 * sl;
          if (i % 3 === 0) D.push(x, y, z, 0.45 + 0.7 * sl, hash1(k + 4) * 6, 0.075 * (1 - a / life), 0.9, 0.74, 0.72, 0.68);
        }
        // glass: ballistic, then lying on the road (bright little chips)
        const g0 = k + 9, vx = (hash1(g0) - 0.5) * 5, vz = (hash1(g0 + 1) - 0.2) * 5, vy = 1 + 2.5 * hash1(g0 + 2), tl = (vy + Math.sqrt(vy * vy + 2 * 9.8 * 1.0)) / 9.8, aa = Math.min(a, tl);
        const gx = ps.x + vx * aa, gz = ps.z + vz * aa, gy = Math.max(0.02, 1.0 + vy * aa - 4.9 * aa * aa);
        B.push(gx, gy, gz, 0.022 + 0.02 * hash1(g0 + 3), hash1(g0 + 4) * 6, 0.75, 1.15, 0.82, 0.9, 0.96);
      }
    }
    D.end(); B.end();
  }
}

// HUD values: how much lower the red hatch sits than before the rule (average of its axles), and the truck's rear
const neRideText = (t) => `${FILM._app && FILM._app.traffic ? FILM._app.traffic.heroRide(t) : 0} cm`;
const neTruckText = (t) => { const T = FILM._app && FILM._app.traffic ? FILM._app.traffic.truck : null; return `${T ? Math.max(0, Math.round((T.set(t, 0) - T.spec.preset[0]) * 100)) : 0} cm`; };
