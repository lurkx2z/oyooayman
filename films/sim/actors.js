/* =====================================================================
   ACTORS — everything that moves in the world, on the world's clocks
   (script.js): traffic (with the red sedan that freezes and the taxi that
   drives through it), parked cars, the bus, the cyclist, people (who snap
   back to their spawn points at the repair), a dog, the pigeons, the ball
   that bounces and then runs backwards, and the cloud that loops.
   ===================================================================== */

(() => {
  Object.assign(ACTIONS, {
    // talking: one hand gestures, small nods
    talk(τ, c) {
      const p = ACTIONS.idle(τ, c), g = Math.sin(τ * 2.3 + c.seed * 5), g2 = Math.sin(τ * 3.7 + 1.2);
      p.lSh = [0.42 + 0.14 * g, 0.16]; p.lEl = 1.25 + 0.3 * g2; p.neck = 0.05 + 0.05 * Math.sin(τ * 2.9); p.headYaw = 0.1 * Math.sin(τ * 0.9);
      p.mouth = Math.max(0, Math.sin(τ * 11)) * 0.5;
      return p;
    },
    // pedalling: crank turns with the distance travelled (walkPhase)
    pedal(τ, c) {
      const p = basePose(), φ = c.walkPhase, s = Math.sin(φ), co = Math.cos(φ);
      p.hipY = 0.93; p.spine = 0.42; p.neck = -0.28;
      p.lHip = [1.05 + 0.38 * s, 0.07]; p.rHip = [1.05 - 0.38 * s, 0.07];
      p.lKnee = 1.15 + 0.45 * co; p.rKnee = 1.15 - 0.45 * co; p.lFoot = 0.25; p.rFoot = 0.25;
      p.lSh = [1.12, 0.14]; p.rSh = [1.12, 0.14]; p.lEl = 0.45; p.rEl = 0.45;
      return p;
    },
  });
  Object.assign(BLEND, { talk: 0.5, pedal: 0.3 });
  LOOKS.cyclist = { skin: 2, build: 'slim', shirt: '#c8462e', sleeves: 'short', pants: '#22262c', shoes: '#d8d4ca', sole: '#f0ede6', hair: '#2a1a12', hat: { type: 'helmet', color: '#f2f0ea' } };
})();

// the people: [id, look, path [[N, x, z]…] on the people clock sxN, states [[N, action]…], opts { face (deg, direction they face when still), seat }]
const SX_PEOPLE = [
  ['A1', 'casual3', [[0, 10.3, -4.0], [60, 10.3, -76]], [[0, 'walk']]],
  ['A3', 'casual2', [[0, 11.35, -23.94]], [[0, 'sit']], { face: 0, seat: 0.45 }],
  ['A4', 'casual8', [[0, 11.35, -27.26]], [[0, 'sit']], { face: 180, seat: 0.45 }],
  ['A5', 'casual6', [[0, 11.3, -17.1]], [[0, 'talk']], { face: 43.4 }],
  ['B1', 'casual1', [[0, -9.6, -46], [22, -9.6, -19], [28, -9.6, -19], [50, -9.6, -45], [56, -9.6, -45], [80, -9.6, -16]], [[0, 'walk'], [22, 'look'], [28, 'walk'], [50, 'phone'], [56, 'walk']]],
  ['B2', 'casual4', [[0, -10.4, -4], [30, -10.4, -35.5]], [[0, 'walk'], [30, 'phone']], { face: 90 }],
  ['B3', 'casual5', [[0, -9.3, -80], [70, -9.3, -10]], [[0, 'walk']]],
  ['B5', 'casual3', [[0, -10.8, 30], [80, -10.8, -70]], [[0, 'walk']]],
  ['B6', 'casual7', [[0, -11.6, -36.6]], [[0, 'idle']], { face: 10 }],
  ['C1', 'casual7', [[0, 9.5, -70], [80, 9.5, -160]], [[0, 'walk']]],
  ['C2', 'casual2', [[0, -9.5, -150], [80, -9.5, -62]], [[0, 'walk']]],
  ['C3', 'casual6', [[0, 10.2, -110], [80, 10.2, -60]], [[0, 'walk']]],
];
const SX_DOG = { owner: 'B3', lead: 1.15 };

/* ---------------- traffic ---------------- */
// moving vehicles: path keys [[clock, x, z]…] (piecewise linear; heading follows the motion), a clock, a body type and colour
function sxLaneCar(id, type, color, x, dir, v, w0, z0, clock) { return { id, type, color, keys: [[w0 - 200, x, z0 - dir * v * 200], [w0 + 200, x, z0 + dir * v * 200]], clock, lane: x }; }

class SxTraffic {
  constructor(scene) {
    this.scene = scene;
    this.F = new VehicleFactory();
    this.blobs = new BlobShadows(scene, 40);
    const rng = new RNG(4401), list = [];
    // the red sedan (VEHICLE_SEDAN_03): toward you in the inner lane, slowly; it freezes, the taxi drives through it, it is repaired
    list.push(sxLaneCar('red', 'sedan', '#b3221d', -1.75, 1, 4.5, SX.brk.freeze, -24, (t) => this.redClock(t)));
    list.push(sxLaneCar('taxi', 'taxi', '#e8b71a', -1.75, 1, 7.0, 35.3, -24, sxW));
    // the bus: waiting at the stop across the street, pulls out and comes toward you
    list.push({ id: 'bus', type: 'bus', color: '#2d6fa3', keys: [[-30, -5.0, -40], [1.2, -5.0, -40], [2.6, -4.2, -36.5], [4.0, -2.2, -28], [5.5, -1.75, -16], [200, -1.75, 1540]], clock: sxW });
    // the rest of the traffic: steady streams (same speed per lane, so nobody overtakes); the inner lane toward you stays clear
    // around the red car's scene and behind the bus
    const types = ['sedan', 'hatch', 'suv', 'ev', 'hatch', 'sedan', 'taxi', 'van', 'suv', 'pickup'];
    const colors = ['#e8e6e0', '#2b2f36', '#8a929a', '#3b5a7a', '#5b2f2a', '#c9c3b5', '#1e2a24', '#d8d4ca', '#46505a', '#7a1f1a'];
    let k = 0;
    for (let w = -40; w < 90; w += rng.range(4.5, 10)) list.push(sxLaneCar('s' + k, types[k % types.length], colors[(k * 3) % colors.length], 1.75, -1, 9.0, w, 60, sxW)), k++;
    for (let w = -50; w < 90; w += rng.range(5, 11)) {
      const passWin = (w0) => [w0 + (-60 - -420) / 8.5, w0 + (80 + 420) / 8.5];   // when this car is anywhere on the street
      const [a, b] = passWin(w);
      if (b > 12 && a < 54) continue;                          // keep the lane clear for the red car and the taxi
      if (a < 6 && b > -2 && w > -45) continue;                // and behind the bus
      list.push(sxLaneCar('n' + k, types[k % types.length], colors[(k * 7) % colors.length], -1.75, 1, 8.5, w, -420, sxW)); k++;
    }
    this.cars = list.map((c) => {
      const v = this.F.build(c.type, c.color);
      v.group.traverse((o) => { if (o.isMesh) { o.receiveShadow = true; } });
      scene.add(v.group);
      return Object.assign(c, { v, shadows: [] });
    });
    // parked cars (left curb; one on your side) — one of them is swapped for a crude low-detail copy (the LOD pop)
    this.parked = [[-5.55, -22.5, 'sedan', '#6b7a86', true], [-5.55, -29.6, 'hatch', '#c9c3b5'], [-5.55, 8.0, 'suv', '#2b2f36'], [-5.55, 15.4, 'ev', '#9c2f2a'], [-5.55, -60, 'van', '#e8e6e0'],
      [6.15, 14.5, 'hatch', '#3b5a7a'], [6.15, -1.6, 'sedan', '#d8d4ca'], [6.15, -64, 'suv', '#46505a']].map(([x, z, type, color, lod]) => {
      const v = this.F.build(type, color);
      v.group.position.set(x, 0, z); v.group.rotation.y = x < 0 ? -Math.PI / 2 : Math.PI / 2;
      scene.add(v.group);
      if (lod) this.lodCar = { v, x, z, type };
      return v;
    });
    this._v = new THREE.Vector3();
  }

  // the red car's own clock: frozen from the freeze until the repair, then on again from where it stopped
  redClock(t) {
    const W = sxW(t), f = SX.brk.freeze, r = SX.repair;
    if (t < f || t >= SX.restart) return W;
    if (t < r) return f;
    return W - (sxW(r) - f);
  }
  frozen(t) { return t >= SX.brk.freeze && t < SX.repair; }

  // position + heading of a car at clock value w
  sample(c, w, out) {
    const K = c.keys;
    let i = 1; while (i < K.length - 1 && K[i][0] < w) i++;
    const a = K[i - 1], b = K[i], f = MathX.clamp((w - a[0]) / (b[0] - a[0]), 0, 1);
    out.x = a[1] + (b[1] - a[1]) * f; out.z = a[2] + (b[2] - a[2]) * f;
    out.h = Math.atan2(b[2] - a[2], b[1] - a[1]);          // angle of travel in the x–z plane
    out.moving = f > 0 && f < 1 && (b[1] !== a[1] || b[2] !== a[2]);
    out.dist = this._dist(c, w);
    return out;
  }
  _dist(c, w) {
    let d = 0; const K = c.keys;
    for (let i = 1; i < K.length; i++) {
      const a = K[i - 1], b = K[i], L = Math.hypot(b[1] - a[1], b[2] - a[2]);
      if (w >= b[0]) d += L; else { if (w > a[0]) d += L * (w - a[0]) / (b[0] - a[0]); break; }
    }
    return d;
  }

  update(t) {
    const s = this._s || (this._s = {});
    this.blobs.begin();
    for (const c of this.cars) {
      const w = c.clock(t);
      this.sample(c, w, s);
      const g = c.v.group, onStreet = s.z > -470 && s.z < 90;
      g.visible = onStreet;
      if (!onStreet) continue;
      g.position.set(s.x, 0, s.z);
      g.rotation.set(0, -s.h, 0);                              // (cars face +X)
      for (const wh of c.v.wheels) wh.rotation.z = -s.dist / c.v.r;
      // the red car, frozen: a physics glitch — it shivers and slews across the line, then hangs there; no shadow after a moment
      if (c.id === 'red' && this.frozen(t)) {
        const a = MathX.smooth(t, SX.brk.freeze + 0.5, SX.brk.freeze + 1.1), jit = (1 - a) * MathX.smooth(t, SX.brk.freeze + 0.35, SX.brk.freeze + 0.5);
        g.rotation.y += MathX.deg(24) * a + noise1(t * 40, 3) * 0.03 * jit;
        g.position.x += 0.85 * a + noise1(t * 37, 4) * 0.04 * jit;
        g.position.y = 0.02 * a;
      }
      const shadowOn = !(c.id === 'red' && t >= SX.brk.shadow && t < SX.repair);
      if (c._shadow !== shadowOn) { c.v.group.traverse((o) => { if (o.isMesh && o.userData.cs === undefined) o.userData.cs = o.castShadow; if (o.isMesh) o.castShadow = shadowOn && o.userData.cs; }); c._shadow = shadowOn; }
      if (shadowOn) this.blobs.push(g.position.x, 0.012, g.position.z, (c.v.L || 4.5) * 0.62, 0.45, (c.v.W || 1.8) * 0.75, g.rotation.y);
    }
    for (const v of this.parked) this.blobs.push(v.group.position.x, 0.012, v.group.position.z, 2.8, 0.45, 1.3, v.group.rotation.y);
    this.blobs.end();
  }

  // world-space bounding box of a car (for the debug labels)
  box(id, out) { const c = this.cars.find((q) => q.id === id); if (!c || !c.v.group.visible) return null; return out.setFromObject(c.v.group); }
}

/* ---------------- the cyclist (bell, then again) ---------------- */
class SxCyclist {
  constructor(scene) {
    const g = new THREE.Group(), m = Mat.std('#1f6f8b', { roughness: 0.4, metalness: 0.3 }), dark = Mat.std('#18191b', { roughness: 0.6 }), steel = Mat.std('#a7adb2', { roughness: 0.35, metalness: 0.8 });
    const tube = (a, b, r, mat) => {
      const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), L = A.distanceTo(B);
      const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 6), mat);
      c.position.copy(A).add(B).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); c.castShadow = true; g.add(c); return c;
    };
    const R = 0.34, rear = [-0.52, R, 0], front = [0.54, R, 0], bb = [0, 0.3, 0], seat = [-0.16, 0.86, 0], head = [0.42, 0.88, 0];
    tube(rear, bb, 0.018, m); tube(bb, seat, 0.02, m); tube(seat, head, 0.02, m); tube(bb, head, 0.024, m); tube(rear, seat, 0.014, m); tube(head, front, 0.016, steel);
    tube([0.4, 1.0, -0.26], [0.4, 1.0, 0.26], 0.014, steel); tube(head, [0.4, 1.0, 0], 0.016, steel);
    const sad = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.12), dark); sad.position.set(-0.18, 0.9, 0); g.add(sad);
    this.wheels = [rear, front].map((p) => {
      const w = new THREE.Group(); w.position.set(...p); g.add(w);
      const tire = new THREE.Mesh(new THREE.TorusGeometry(R - 0.02, 0.022, 6, 24), dark); w.add(tire); tire.castShadow = true;
      for (let i = 0; i < 6; i++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.006, (R - 0.04) * 2, 0.006), steel); sp.rotation.z = (i / 6) * Math.PI; w.add(sp); }
      return w;
    });
    const rider = new Person({ id: 'cyclist', look: 'cyclist', states: [[0, 'pedal']] }, null);
    rider.root.position.set(-0.2, 0, 0); rider.root.rotation.y = Math.PI / 2; g.add(rider.root);
    rider.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    this.rider = rider; this.g = g; this.R = R;
    scene.add(g);
  }
  // he passes you at R = 12.0 (rings at 11.75), riding the bike lane at 6 m/s
  zAt(r) { return -9.8 - 6.0 * (r - 12.0); }
  update(t) {
    const r = sxR(t), z = this.zAt(r), on = r > 8.5 && r < 18.5;
    this.g.visible = on; if (!on) return;
    this.g.position.set(4.35, 0, z); this.g.rotation.y = Math.PI / 2;
    const d = 6.0 * (r - 8.5);
    for (const w of this.wheels) w.rotation.z = -d / this.R;
    const ctx = { seed: this.rider.seed, seedI: this.rider.seedI, walkPhase: d / 2.1 * Math.PI * 2 * 0.35 };
    this.rider.apply(ACTIONS.pedal(r, ctx));
    this.rider.root.updateMatrixWorld(true);
  }
}

/* ---------------- people (+ the dog) ---------------- */
class SxPeople {
  constructor(scene) {
    this.list = SX_PEOPLE.map(([id, look, path, states, o = {}]) => {
      const spec = { id, look, path, states, y: LAYOUT.curbH, seat: o.seat, stride: 1.32 };
      if (o.face !== undefined && path.length === 1) spec.face = o.face;
      const p = new Person(spec, scene);
      p.root.traverse((q) => { if (q.isMesh) q.castShadow = true; });
      return p;
    });
    this.byId = Object.fromEntries(this.list.map((p) => [p.spec.id, p]));
    this.blobs = new BlobShadows(scene, this.list.length + 2);
    this.dog = new SxDog(scene);
    this._v = new THREE.Vector3();
  }
  update(t) {
    const n = sxN(t);
    this.blobs.begin();
    for (const p of this.list) {
      p.update(n);
      const w = p.worldOf('hips', this._v);
      this.blobs.push(w.x, LAYOUT.curbH + 0.012, w.z, 0.55, 0.42);
    }
    // the dog trots ahead of its owner
    const o = this.byId[SX_DOG.owner], loc = o.locate(n);
    this.dog.update(n, loc.x + 0.35, loc.z + SX_DOG.lead, loc.dir, loc.dist, o);
    this.blobs.push(this.dog.g.position.x, LAYOUT.curbH + 0.012, this.dog.g.position.z, 0.5, 0.35, 0.3);
    this.blobs.end();
  }
}

class SxDog {
  constructor(scene) {
    const g = new THREE.Group(), fur = Mat.std('#8a5a32', { roughness: 0.95 }), dark = Mat.std('#3a2414', { roughness: 0.9 });
    const add = (geo, mat, x, y, z, p = g) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; p.add(m); return m; };
    add(facetBall(0.2, 0.75, 0.62, 1.45, 1), fur, 0, 0.42, 0);                           // body
    const head = new THREE.Group(); head.position.set(0, 0.56, 0.3); g.add(head);
    add(facetBall(0.1, 1, 0.95, 1.1, 1), fur, 0, 0, 0, head);
    add(new THREE.BoxGeometry(0.08, 0.07, 0.12), fur, 0, -0.03, 0.1, head);              // muzzle
    add(facetBall(0.022, 1, 1, 1, 0), dark, 0, -0.01, 0.17, head);                       // nose
    for (const s of [-1, 1]) { const e = add(new THREE.BoxGeometry(0.05, 0.09, 0.02), dark, s * 0.06, 0.07, -0.02, head); e.rotation.z = s * 0.35; }
    this.tail = add(new THREE.CylinderGeometry(0.018, 0.012, 0.22, 5), fur, 0, 0.5, -0.3); this.tail.rotation.x = -0.9;
    this.legs = [[-0.09, 0.2], [0.09, 0.2], [-0.09, -0.2], [0.09, -0.2]].map(([x, z]) => {
      const L = new THREE.Group(); L.position.set(x, 0.36, z); g.add(L);
      add(new THREE.CylinderGeometry(0.032, 0.026, 0.36, 5), fur, 0, -0.18, 0, L);
      return L;
    });
    this.head = head; this.g = g;
    // the lead: a thin line from the owner's hand to the collar
    this.lead = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: '#1a1a1a' }));
    this.lead.frustumCulled = false;
    scene.add(g, this.lead);
    this._h = new THREE.Vector3();
  }
  update(n, x, z, dir, dist, owner) {
    this.g.position.set(x, LAYOUT.curbH, z); this.g.rotation.y = dir;
    const ph = dist / 0.55 * Math.PI * 2;
    this.legs.forEach((L, i) => { L.rotation.x = Math.sin(ph + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.5; });
    this.tail.rotation.z = Math.sin(n * 9) * 0.35;
    this.head.rotation.y = noise1(n * 0.5, 7) * 0.4;
    owner.handWorld(-1, this._h);
    const P = this.lead.geometry.attributes.position;
    P.setXYZ(0, this._h.x, this._h.y - 0.05, this._h.z);
    this.head.updateMatrixWorld(true);
    const c = new THREE.Vector3(0, 0.5, 0.22).applyMatrix4(this.g.matrixWorld);
    P.setXYZ(1, c.x, c.y, c.z); P.needsUpdate = true;
  }
}

/* ---------------- pigeons (take off; then again) ---------------- */
class SxPigeons {
  constructor(scene) {
    const body = Mat.std('#7d8590', { roughness: 0.85 }), wingM = Mat.std('#9aa2ac', { roughness: 0.85, side: THREE.DoubleSide }), dark = Mat.std('#3d434b', { roughness: 0.8 });
    this.birds = [[10.7, -16.1, 0.2], [11.2, -16.6, 1.9], [10.5, -17.0, 3.0], [11.6, -16.0, 4.4], [11.0, -17.4, 5.3]].map(([x, z, a], i) => {
      const g = new THREE.Group(), b = new THREE.Mesh(facetBall(0.075, 0.75, 0.75, 1.35, 1), body); b.position.y = 0.09; g.add(b); b.castShadow = true;
      const head = new THREE.Mesh(facetBall(0.04, 1, 1, 1.1, 0), dark); head.position.set(0, 0.16, 0.08); g.add(head);
      const wings = [-1, 1].map((s) => { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.1), wingM); w.geometry.translate(s * 0.11, 0, 0); w.position.set(s * 0.03, 0.12, -0.01); w.rotation.x = -Math.PI / 2; g.add(w); return w; });
      scene.add(g);
      return { g, head, wings, x, z, a, i, out: new THREE.Vector3(-3.5 - i * 1.3, 5.5 + i * 0.8, -22 - i * 1.6) };
    });
  }
  update(t) {
    const r = sxR(t);
    for (const B of this.birds) {
      const t0 = 12.7 + B.i * 0.06, f = r - t0;
      if (f < 0) {
        // on the ground: pecking and shuffling
        B.g.position.set(B.x + 0.06 * Math.sin(r * 0.7 + B.a), LAYOUT.curbH, B.z);
        B.g.rotation.set(0, B.a + 0.3 * Math.sin(r * 0.5 + B.a), 0);
        B.head.position.set(0, 0.16 - 0.06 * Math.max(0, Math.sin(r * 6 + B.a * 3)), 0.08 + 0.03 * Math.max(0, Math.sin(r * 6 + B.a * 3)));
        for (const w of B.wings) w.rotation.set(-Math.PI / 2, 0, 0);
        B.g.visible = true;
      } else {
        // take off: a quick climb away over the road, wings beating
        const k = Ease.outQuad(MathX.clamp(f / 1.6, 0, 1)), y = LAYOUT.curbH + (B.out.y - LAYOUT.curbH) * k + 0.4 * Math.sin(Math.min(1, f / 0.4) * Math.PI / 2) * (1 - k);
        B.g.position.set(B.x + (B.out.x - B.x) * k, y, B.z + (B.out.z - B.z) * k);
        B.g.rotation.set(-0.5 * (1 - k), Math.atan2(B.out.x - B.x, B.out.z - B.z), 0);
        const flap = Math.sin(f * 38 + B.i) * 0.9;
        B.wings[0].rotation.set(-Math.PI / 2, 0, flap); B.wings[1].rotation.set(-Math.PI / 2, 0, -flap);
        B.g.visible = f < 2.2;
      }
    }
  }
}

/* ---------------- the ball: rolls off the awning, bounces twice, then runs exactly backwards ---------------- */
const SX_BALL = (() => {
  const A = SX_CITY.awning, r = 0.11, g = 9.81, e = 0.62, z = -19.4;
  const roll = 0.4, xs = 11.55, xe = A.x0 + 0.02, vx = -0.9;
  const ye = A.y0 + r + 0.02, yg = LAYOUT.curbH + r, tf = Math.sqrt(2 * (ye - yg) / g), v1 = g * tf * e, tb = 2 * v1 / g;
  const tImp1 = roll + tf, tImp2 = tImp1 + tb;
  return { r, z, roll, xs, xe, vx, ye, yg, tf, v1, tb, tImp1, tImp2, A };
})();
// ball position at "ball time" b (seconds since it starts to roll); the film plays b forward to the second bounce, then back
function sxBallAt(b, out) {
  const B = SX_BALL, A = B.A;
  if (b <= 0) { const y = A.y0 + (A.y1 - A.y0) * (B.xs - A.x0) / (A.x1 - A.x0) + B.r + 0.02; return out.set(B.xs, y, B.z); }
  if (b < B.roll) {
    const k = b / B.roll, x = B.xs + (B.xe - B.xs) * (k * k * 0.6 + k * 0.4);
    return out.set(x, A.y0 + (A.y1 - A.y0) * (x - A.x0) / (A.x1 - A.x0) + B.r + 0.02, B.z);
  }
  let s = b - B.roll, x = B.xe + B.vx * Math.min(s, B.tf), y;
  if (s < B.tf) y = B.ye - 0.5 * 9.81 * s * s;
  else { const u = s - B.tf, vx2 = B.vx * 0.8; x = B.xe + B.vx * B.tf + vx2 * Math.min(u, B.tb * 1.3); y = u < B.tb ? B.yg + B.v1 * u - 0.5 * 9.81 * u * u : B.yg; }
  return out.set(x, Math.max(B.yg, y), B.z);
}
function sxBallTime(t) {
  const b = t - SX.ball.t0, p = SX_BALL.tImp2;
  if (t >= SX.restart) return 0;
  return b < p ? Math.max(0, b) : Math.max(0, 2 * p - b);
}

class SxBall {
  constructor(scene) {
    const c = Tex.canvas(128, 64), x = c.getContext('2d');
    x.fillStyle = '#d2302a'; x.fillRect(0, 0, 128, 64); x.fillStyle = '#f2ede2'; x.fillRect(0, 28, 128, 8);
    this.m = new THREE.Mesh(new THREE.SphereGeometry(SX_BALL.r, 20, 14), new THREE.MeshStandardMaterial({ map: Tex.tex(c), roughness: 0.45 }));
    this.m.castShadow = true; scene.add(this.m);
    this._p = new THREE.Vector3();
  }
  update(t) {
    const b = sxBallTime(t);
    sxBallAt(b, this._p);
    this.m.position.copy(this._p);
    this.m.rotation.z = (SX_BALL.xs - this._p.x) / SX_BALL.r;
    this.m.visible = t > 8;
  }
}

/* ---------------- the cloud that loops ---------------- */
class SxCloud {
  constructor(scene) {
    const g = new THREE.Group(), rng = new RNG(808);
    const mat = new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: '#c9d4e2', emissiveIntensity: 0.55, flatShading: true, fog: false });
    for (let i = 0; i < 14; i++) {
      const r = rng.range(5, 10), p = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat);
      p.position.set(rng.range(-16, 16), rng.range(0, 7) + (Math.abs(p.position.x) < 8 ? 3 : 0), rng.range(-6, 6)); p.scale.y = 0.7;
      g.add(p);
    }
    this.g = g; scene.add(g);
    this.base = new THREE.Vector3(-100, 75, -150); this.v = 6.0;
  }
  // the loop: from the glitch until the repair it keeps jumping back to where it was (a 1.2 s loop)
  pos(t) {
    let w = sxW(t);
    const a = SX.brk.cloud, L = 1.2;
    if (t >= a && t < SX.repair) w = sxW(a) + ((sxW(t) - sxW(a)) % L);
    return w;
  }
  update(t, cam) {
    const w = this.pos(t);
    this.g.position.set(this.base.x + this.v * (w - SX.brk.cloud), this.base.y, this.base.z);
    this.g.lookAt(cam.position.x, this.base.y, cam.position.z);
  }
}
