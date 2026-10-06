/* =====================================================================
   ACTORS — the people (two playing catch, café customers, walkers who
   lean into the gale and then shelter), two cyclists, the traffic, the
   red car that coasts, the car that brakes and swerves under the
   billboard, and the ball. All on story time S.
   ===================================================================== */

(() => {
  Object.assign(ACTIONS, {
    // a throw: wind up, release at 0.5 s, follow through
    throwBall(τ, c) {
      const p = ACTIONS.idle(τ, c), k = MathX.clamp(τ / 0.45, 0, 1), f = MathX.clamp((τ - 0.45) / 0.3, 0, 1);
      p.rSh = [MathX.lerp(MathX.lerp(0.2, -0.9, k), 1.9, Ease.outQuad(f)), 0.25]; p.rEl = MathX.lerp(MathX.lerp(0.3, 1.6, k), 0.2, f);
      p.spineYaw = MathX.lerp(MathX.lerp(0, 0.35, k), -0.3, f); p.spine = 0.05 + 0.15 * f; p.lSh = [0.6 * k, 0.15]; p.lEl = 0.5;
      p.lHip = [0.25 * f, 0.03]; p.headYaw = 0; return p;
    },
    catchReady(τ, c) { const p = ACTIONS.idle(τ, c), k = Math.min(1, τ / 0.4); p.lSh = [0.95 * k, 0.12]; p.rSh = [0.95 * k, 0.12]; p.lEl = 0.6; p.rEl = 0.6; p.spine = 0.08; p.headYaw = 0; return p; },
    pickUp(τ, c) { const p = basePose(), k = Math.sin(Math.min(1, τ / 1.2) * Math.PI); p.spine = 1.0 * k; p.neck = 0.4 * k; p.rSh = [1.1 * k, 0.1]; p.rEl = 0.2; p.lHip = [0.5 * k, 0.05]; p.rHip = [0.5 * k, 0.05]; p.lKnee = 0.7 * k; p.rKnee = 0.7 * k; p.hipY = 0.93 - 0.18 * k; return p; },
    // into the gale: lean forward into it, one arm up over the face, knees bent
    braceWind(τ, c) { const p = basePose(), w = Math.sin(τ * 2.7 + c.seed * 5) * 0.04; p.spine = 0.42 + w; p.neck = 0.25; p.lSh = [1.4, 0.2]; p.lEl = 2.1; p.rSh = [0.35, 0.3]; p.rEl = 0.5;
      p.lHip = [0.35, 0.12]; p.rHip = [-0.15, 0.12]; p.lKnee = 0.35; p.rKnee = 0.2; p.hipY = 0.88; p.spineRoll = w; return p; },
    shelter(τ, c) { const p = basePose(), w = Math.sin(τ * 2.2 + c.seed * 4) * 0.03; p.spine = 0.65 + w; p.neck = 0.5; p.lSh = [2.2, 0.3]; p.rSh = [2.2, 0.3]; p.lEl = 2.2; p.rEl = 2.2;
      p.lHip = [0.9, 0.15]; p.rHip = [0.9, 0.15]; p.lKnee = 1.4; p.rKnee = 1.4; p.hipY = 0.58; return p; },
    walkWind(τ, c) { const p = ACTIONS.walk(τ, c); p.spine = 0.3; p.lSh = [1.2, 0.2]; p.lEl = 2.0; return p; },
    pedal(τ, c) {
      const p = basePose(), φ = c.walkPhase, s = Math.sin(φ), co = Math.cos(φ), e = c.effort || 0;
      p.hipY = 0.93 + 0.05 * e; p.spine = 0.42 + 0.2 * e; p.neck = -0.28 - 0.1 * e; p.spineRoll = 0.08 * e * s;
      p.lHip = [1.05 + 0.38 * s, 0.07]; p.rHip = [1.05 - 0.38 * s, 0.07]; p.lKnee = 1.15 + 0.45 * co; p.rKnee = 1.15 - 0.45 * co; p.lFoot = 0.25; p.rFoot = 0.25;
      p.lSh = [1.12, 0.14]; p.rSh = [1.12, 0.14]; p.lEl = 0.45 + 0.2 * e; p.rEl = 0.45 + 0.2 * e; return p;
    },
    footDown(τ, c) { const p = ACTIONS.pedal(0, Object.assign({}, c, { walkPhase: 1.2, effort: 0 })); p.lHip = [0.35, 0.35]; p.lKnee = 0.25; p.lFoot = -0.1; p.spineRoll = 0.12; p.spine = 0.3; return p; },
  });
  Object.assign(BLEND, { throwBall: 0.15, catchReady: 0.3, pickUp: 0.3, braceWind: 0.6, shelter: 0.7, walkWind: 0.5, pedal: 0.3, footDown: 0.3 });
  LOOKS.cyclistA = { skin: 2, build: 'slim', shirt: '#c8462e', sleeves: 'short', pants: '#22262c', shoes: '#d8d4ca', sole: '#f0ede6', hair: '#2a1a12', hat: { type: 'helmet', color: '#f2f0ea' } };
  LOOKS.cyclistB = { skin: 4, build: 'avg', shirt: '#2f5d8a', sleeves: 'long', pants: '#3a3f46', shoes: '#222', sole: '#444', hair: '#111', hat: { type: 'helmet', color: '#2a2a2a' }, jacket: true };
})();

// the people: [id, look, path [[S, x, z]…], states [[S, action]…], { face (deg; for standing), y }]
const FACE_WIND = -180 + 59.8;          // facing into the wind (it comes from your buildings and up the street)
const AIR_PEOPLE = [
  ['T', 'casual4', [[0, -10.2, -19.6], [29, -10.2, -19.6], [30.5, -11.6, -21.0]], [[0, 'idle'], [8.3, 'throwBall'], [9.2, 'idle'], [10.4, 'look'], [29, 'walkWind'], [30.5, 'shelter']], { face: 180 }],
  ['C', 'casual3', [[0, -10.2, -4.4], [10.6, -10.2, -4.4], [13.2, -10.0, -14.2], [14.6, -10.0, -14.2], [29, -10.4, -15.0], [30.6, -11.7, -15.6]], [[0, 'idle'], [8.3, 'catchReady'], [10.4, 'walk'], [13.2, 'pickUp'], [14.6, 'idle'], [29, 'walkWind'], [30.6, 'shelter']], { face: 0 }],
  ['K1', 'casual6', [[0, 11.1, -8.45]], [[0, 'sit'], [28.4, 'braceWind']], { face: 0, seat: 0.45, rise: 28.4, to: [11.9, -10.2] }],
  ['K2', 'casual2', [[0, 11.1, -12.0]], [[0, 'sit'], [28.8, 'braceWind']], { face: 180, seat: 0.45, rise: 28.8, to: [12.0, -11.1] }],
  ['W1', 'casual1', [[0, 9.3, -2.0], [24, 9.3, -30.0], [29, 9.3, -34.5], [30.2, 11.2, -35.2]], [[0, 'walk'], [26, 'walkWind'], [30.2, 'braceWind']], {}],
  ['W2', 'casual8', [[0, -9.4, -40], [26, -9.4, -12], [29, -9.4, -9.8], [30.4, -11.6, -9.4]], [[0, 'walk'], [26, 'walkWind'], [30.4, 'shelter']], {}],
  ['W3', 'casual5', [[0, -9.8, 14], [26, -9.8, -16], [29, -9.8, -18.5]], [[0, 'walk'], [26, 'walkWind'], [29, 'braceWind']], {}],
  ['W4', 'casual7', [[0, -10.6, -42.0]], [[0, 'phone'], [27, 'braceWind']], { face: 20 }],
  ['W5', 'casual4', [[0, 10.4, -55], [26, 10.4, -36.5]], [[0, 'walk'], [26, 'braceWind']], {}],
  ['W6', 'casual6', [[0, -9.6, -70], [40, -9.6, -50]], [[0, 'walk'], [27, 'walkWind']], {}],
];

class AirPeople {
  constructor(scene) {
    this.list = AIR_PEOPLE.map(([id, look, path, states, o]) => {
      const spec = { id, look, path, states, y: LAYOUT.curbH, seat: o.seat, stride: 1.32 };
      if (o.face !== undefined && !o.rise) spec.face = o.face;
      const p = new Person(spec, scene);
      p.root.traverse((q) => { if (q.isMesh) q.castShadow = true; });
      return { p, o, id };
    });
    this.byId = Object.fromEntries(this.list.map((q) => [q.id, q.p]));
    this.blobs = new BlobShadows(scene, this.list.length + 4);
    this._v = new THREE.Vector3();
  }
  update(S) {
    this.blobs.begin();
    for (const { p, o, id } of this.list) {
      p.update(S);
      // café customers: sit, then get up into the wind and huddle by the door
      if (o.rise !== undefined) {
        const k = MathX.smooth(S, o.rise, o.rise + 1.2), x0 = p.spec.path[0][1], z0 = p.spec.path[0][2];
        p.root.position.set(MathX.lerp(x0, o.to[0], k), LAYOUT.curbH, MathX.lerp(z0, o.to[1], k));
        p.root.rotation.y = k > 0.01 ? MathX.lerp(Math.PI + MathX.deg(o.face), MathX.deg(59.8), k) : Math.PI + MathX.deg(o.face);
      }
      // braced or sheltering in the gale: turned to face it
      let st = p.states[0][1]; for (const [ts, nm] of p.states) if (ts <= S) st = nm;
      if (o.rise === undefined && (st === 'braceWind' || st === 'shelter')) p.root.rotation.y = MathX.angleLerp(p.root.rotation.y, MathX.deg(59.8), MathX.smooth(airLoad(S), 0.3, 0.8));
      p.root.updateMatrixWorld(true);
      const w = p.worldOf('hips', this._v); this.blobs.push(w.x, LAYOUT.curbH + 0.012, w.z, 0.55, 0.42);
    }
    this.blobs.end();
  }
}

/* ---------------- the ball (with the thrower until it leaves his hand) ---------------- */
class AirBall {
  constructor(scene, people) {
    this.people = people;
    const c = Tex.canvas(128, 64), x = c.getContext('2d'); x.fillStyle = '#f4f1ea'; x.fillRect(0, 0, 128, 64); x.fillStyle = '#e8b51c'; x.fillRect(0, 22, 128, 10); x.fillStyle = '#2f62a8'; x.fillRect(0, 40, 128, 8);
    this.m = new THREE.Mesh(new THREE.SphereGeometry(AIR_BALL.r, 18, 12), new THREE.MeshStandardMaterial({ map: Tex.tex(c), roughness: 0.5 }));
    this.m.castShadow = true; scene.add(this.m);
    this.rel = new THREE.Vector3(-10.42, 1.9, -19.3);          // where it leaves the hand
    // the normal-air ghost: a dotted arc, drawn as the ball would have flown
    const pts = []; for (let i = 0; i < AIR_BALL.normal.rows.length; i++) { const r = AIR_BALL.normal.rows[i]; if (r.y > 0.3 || i === 0) pts.push(new THREE.Vector3(this.rel.x, r.y + 0.15, this.rel.z + r.x)); }
    this.ghostPts = pts;
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    this.ghost = new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffffff', size: 0.12, transparent: true, opacity: 0.0, depthWrite: false }));
    this.ghost.frustumCulled = false; scene.add(this.ghost);
    this._h = new THREE.Vector3();
  }
  update(S) {
    const u = S - AR.throwT, B = this.m;
    if (u < 0 || S > 60) {
      this.people.byId.T.handWorld(-1, this._h); B.position.set(this._h.x, this._h.y - 0.08, this._h.z + 0.05);
    } else if (S < 13.35) {
      const r = AIR_BALL.dense.at(u); B.position.set(this.rel.x, r.y + 0.15 - AIR_BALL.r * 0 , this.rel.z + r.x); B.rotation.x = r.spin;
      if (r.y + 0.15 < 0.15 + AIR_BALL.r) B.position.y = 0.15 + AIR_BALL.r;
    } else { this.people.byId.C.handWorld(-1, this._h); B.position.set(this._h.x, this._h.y - 0.08, this._h.z); }
    // the ghost arc: grows with normal-air time, fades
    const n = Math.max(0, Math.min(this.ghostPts.length, Math.floor((u / 1.67) * this.ghostPts.length)));
    this.ghost.geometry.setDrawRange(0, n);
    this.ghost.material.opacity = 0.75 * MathX.smooth(S, AR.throwT + 0.05, AR.throwT + 0.3) * (1 - MathX.smooth(S, 11.6, 12.2));
  }
  landing() { return new THREE.Vector3(this.rel.x, 0.15, this.rel.z + AIR_BALL.dense.rows[AIR_BALL.dense.rows.length - 1].x); }
}

/* ---------------- bicycles ---------------- */
class AirBike {
  constructor(scene, look) {
    const g = new THREE.Group(), m = Mat.std(look === 'cyclistA' ? '#1f6f8b' : '#7a7f86', { roughness: 0.4, metalness: 0.3 }), dark = Mat.std('#18191b', { roughness: 0.6 }), steel = Mat.std('#a7adb2', { roughness: 0.35, metalness: 0.8 });
    const tube = (a, b, r, mat) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, A.distanceTo(B), 6), mat); c.position.copy(A).add(B).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); c.castShadow = true; g.add(c); };
    const R = 0.34, rear = [-0.52, R, 0], front = [0.54, R, 0], bb = [0, 0.3, 0], seat = [-0.16, 0.86, 0], head = [0.42, 0.88, 0];
    tube(rear, bb, 0.018, m); tube(bb, seat, 0.02, m); tube(seat, head, 0.02, m); tube(bb, head, 0.024, m); tube(rear, seat, 0.014, m); tube(head, front, 0.016, steel); tube([0.4, 1.0, -0.26], [0.4, 1.0, 0.26], 0.014, steel); tube(head, [0.4, 1.0, 0], 0.016, steel);
    const sad = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.12), dark); sad.position.set(-0.18, 0.9, 0); g.add(sad);
    this.wheels = [rear, front].map((p) => { const w = new THREE.Group(); w.position.set(...p); g.add(w); const tire = new THREE.Mesh(new THREE.TorusGeometry(R - 0.02, 0.022, 6, 24), dark); tire.castShadow = true; w.add(tire);
      for (let i = 0; i < 6; i++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.006, (R - 0.04) * 2, 0.006), steel); sp.rotation.z = (i / 6) * Math.PI; w.add(sp); } return w; });
    this.rider = new Person({ id: 'bike' + look, look, states: [[0, 'pedal']] }, null);
    this.rider.root.position.set(-0.2, 0, 0); this.rider.root.rotation.y = Math.PI / 2; g.add(this.rider.root);
    this.rider.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    this.g = g; this.R = R; scene.add(g);
  }
  set(x, z, heading, dist, effort, lean, act = 'pedal') {
    this.g.position.set(x, 0, z); this.g.rotation.set(lean, heading, 0, 'YXZ');
    for (const w of this.wheels) w.rotation.z = -dist / this.R;
    const ctx = { seed: this.rider.seed, seedI: this.rider.seedI, walkPhase: dist / 2.1 * Math.PI * 2 * 0.36 * (1 + 0.5 * effort), effort };
    this.rider.apply(ACTIONS[act](0, ctx)); this.rider.root.updateMatrixWorld(true);
  }
}

class AirCyclists {
  constructor(scene) { this.a = new AirBike(scene, 'cyclistA'); this.b = new AirBike(scene, 'cyclistB'); }
  // A: passes you flat out, can't get past ~17 km/h. B: in the gale, shoved sideways by a gust; foot down, stops
  speedA(S) { return AIR_CYCLIST.at(Math.max(0, S - AR.cyc)).v; }
  update(S) {
    const ua = S - AR.cyc, da = ua < 0 ? 3.333 * ua : AIR_CYCLIST.at(ua).d, za = 7.2 - da;
    this.a.g.visible = S > 9 && S < 24;
    if (this.a.g.visible) this.a.set(4.35, za, Math.PI / 2, da + 40, MathX.smooth(ua, 0.5, 2.5), 0.02 * Math.sin(da * 1.6));
    const B = AR.brk.cyclist, vb = 2.0, stop = B + 0.75;
    const zb = S < B ? -4 - vb * (S - 33.4) : -4 - vb * (B - 33.4) - vb * Math.min(S - B, 0.75) * (1 - 0.5 * Math.min(1, (S - B) / 0.75));
    const xb = 4.35 - 0.85 * MathX.smooth(S, B, B + 0.6), lean = S < B ? 0.03 * Math.sin(S * 3) : -0.25 * Math.sin(MathX.clamp((S - B) / 0.8, 0, 1) * Math.PI) + (S > stop ? -0.12 : 0);
    this.b.g.visible = S > 33.0 && S < 60;
    if (this.b.g.visible) this.b.set(xb, zb, Math.PI / 2 + 0.25 * MathX.smooth(S, B, B + 0.5) * Math.sin(Math.min(1, (S - B) / 0.6) * Math.PI), -zb * 1.0, 0.6, lean, S > stop ? 'footDown' : 'pedal');
  }
}

/* ---------------- traffic ---------------- */
// a lane car: position by distance along the lane; the street's traffic crawls once the gale is up
const AIR_TRAFFIC_D = (() => { const tab = []; let d = 0; for (let i = 0; i <= 60 * 60; i++) { const S = i / 60; tab.push(d); const v = MathX.lerp(10, 4.5, MathX.smooth(S, 26, 31)); d += v / 60; } return (S) => { const f = MathX.clamp(S * 60, 0, tab.length - 1.001), k = Math.floor(f); return tab[k] + (tab[k + 1] - tab[k]) * (f - k); }; })();

class AirTraffic {
  constructor(scene) {
    this.F = new VehicleFactory();
    this.blobs = new BlobShadows(scene, 30);
    const types = ['sedan', 'hatch', 'suv', 'ev', 'hatch', 'sedan', 'taxi', 'van', 'suv'], colors = ['#e8e6e0', '#2b2f36', '#8a929a', '#3b5a7a', '#5b2f2a', '#c9c3b5', '#1e2a24', '#d8d4ca', '#46505a'];
    const rng = new RNG(818);
    this.cars = [];
    const mk = (type, color) => { const v = this.F.build(type, color); scene.add(v.group); return v; };
    let k = 0;
    // streams in both lanes, leaving clear: the view across the street during the throw, the cyclist's pass, and the swerving car's lane
    const keep = [[7.6, 12.6, -40, 16, 0], [12.2, 16.2, -14, 14, 0], [40.5, 47, -70, -15, 1]];
    const clear = (x, dir, off) => { for (let S = 0; S < 50; S += 0.1) { const D = AIR_TRAFFIC_D(S), z = this._z(dir, off, D); for (const [a, b, z0, z1, lane] of keep) if (S >= a && S <= b && z > z0 && z < z1 && (lane === 0 || dir > 0)) return false; } return true; };
    for (let off = -60; off < 420; off += rng.range(22, 40)) { if (!clear(-1.75, 1, off)) continue; this.cars.push({ v: mk(types[k % 9], colors[(k * 4) % 9]), x: -1.75, dir: 1, off }); k++; }
    for (let off = -300; off < 400; off += rng.range(45, 80)) { if (!clear(1.75, -1, off)) continue; this.cars.push({ v: mk(types[k % 9], colors[(k * 2) % 9]), x: 1.75, dir: -1, off }); k++; }
    // the coasting car (red), and the car that brakes and swerves under the billboard
    this.hero = { v: mk('sedan', '#b3221d') };
    this.swerve = { v: mk('suv', '#2b2f36') };
    // parked cars on the far side
    for (const z of [10, 18, -22, -29.5]) { const v = mk(rng.pick(types), rng.pick(colors)); v.group.position.set(-5.55, 0, z); v.group.rotation.y = -Math.PI / 2; }
  }
  _z(dir, off, D) { return dir > 0 ? -420 + ((off + D) % 480) : 60 - ((off + D + 480 * 3) % 480); }
  heroSpeed(S) { const u = S - AR.car; return u < 0 ? 25 : AIR_CAR.at(u).v; }
  heroZ(S) { const u = S - AR.car; return 6.3 - (u < 0 ? 25 * u : AIR_CAR.at(u).d); }
  update(S) {
    this.blobs.begin();
    const D = AIR_TRAFFIC_D(S);
    for (const c of this.cars) {
      const z = this._z(c.dir, c.off, D);
      // (the lane away from you is kept clear around the red car)
      const near = c.dir < 0 && S > 10 && S < 26 && Math.abs(z - this.heroZ(S)) < 60;
      c.v.group.visible = !near && z > -440 && z < 70;
      c.v.group.position.set(c.x, 0, z); c.v.group.rotation.y = c.dir > 0 ? -Math.PI / 2 : Math.PI / 2;
      for (const w of c.v.wheels) w.rotation.z = -(D + c.off) / c.v.r;
      if (c.v.group.visible) this.blobs.push(c.x, 0.012, z, 2.9, 0.45, 1.3, c.v.group.rotation.y);
    }
    // the coasting car: no brake lights — it just loses speed to the air
    const H = this.hero.v, hz = this.heroZ(S);
    H.group.visible = S > 13 && S < 30 && hz > -400; H.group.position.set(1.75, 0, hz); H.group.rotation.y = Math.PI / 2;
    for (const w of H.wheels) w.rotation.z = -(6.3 - hz) / H.r;
    H.tail.emissiveIntensity = 0.6;
    if (H.group.visible) this.blobs.push(1.75, 0.012, hz, 2.9, 0.45, 1.3, Math.PI / 2);
    // the swerving car: comes toward you; the billboard comes down across its path; it brakes hard and swerves
    const W = this.swerve.v, A = AR.bill, t0 = A.swerve, v0 = 7.5;
    const dz = S < t0 ? v0 * (S - t0) : v0 * Math.min(S - t0, 1.0) - 0.5 * 7.5 * Math.min(S - t0, 1.0) ** 2;
    const sz = -46 + dz, sx = -1.75 + 0.9 * MathX.smooth(S, t0, t0 + 0.9);
    W.group.visible = S > 36 && S < 60; W.group.position.set(sx, 0, sz); W.group.rotation.y = -Math.PI / 2 - 0.25 * Math.sin(MathX.clamp((S - t0) / 0.9, 0, 1) * Math.PI) * 0.8;
    W.body.rotation.z = S > t0 && S < t0 + 1.2 ? -0.05 * Math.sin((S - t0) / 1.2 * Math.PI) : 0;
    W.tail.emissiveIntensity = S > t0 ? 4.5 : 0.6;
    for (const w of W.wheels) w.rotation.z = -dz / W.r;
    if (W.group.visible) this.blobs.push(sx, 0.012, sz, 3.0, 0.45, 1.4, W.group.rotation.y);
    this.blobs.end();
  }
}
