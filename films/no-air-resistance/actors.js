/* =====================================================================
   ACTORS — the party on the roof (a man flying a kite, a girl holding a
   bunch of balloons and her mum, a guest with a confetti cannon, one at
   the table, one with a drink), a few people on the avenue below, the
   traffic, and the balloons. The rain sends the guests in; the mum and
   the girl go last, after the balloons. The street is empty well before
   the ice. All on story time S. Numbers: physics.js.
   ===================================================================== */

(() => {
  Object.assign(ACTIONS, {
    // holding a balloon's string up
    holdUp(τ, c) { const p = ACTIONS.idle(τ, c); p.rSh = [2.5, 0.12]; p.rEl = 0.35; p.neck = -0.1; p.headYaw = 0.1 * Math.sin(τ * 0.7); return p; },
    // letting the balloons go: the arm goes up and opens
    reachUp(τ, c) { const p = ACTIONS.idle(τ, c), k = Math.min(1, τ / 0.35); p.rSh = [2.5 + 0.35 * k, 0.12]; p.rEl = 0.35 - 0.3 * k; p.lSh = [2.4 * k, 0.1]; p.lEl = 0.2; p.neck = -0.6 * k; p.spine = -0.08 * k; p.hipY = 0.93 + 0.02 * k; return p; },
    lookUp(τ, c) { const p = ACTIONS.idle(τ, c), k = Math.min(1, τ / 0.5); p.neck = -0.75 * k; p.spine = -0.06 * k; p.headYaw = 0; p.rSh = [0.35 * k, 0.1]; p.rEl = 0.9 * k; return p; },
    // flying a kite: both hands out in front holding the line, small tugs
    kite(τ, c) { const p = ACTIONS.idle(τ, c), w = Math.sin(τ * 2.3 + c.seed * 5) * 0.08; p.rSh = [1.35 + w, 0.08]; p.rEl = 0.35; p.lSh = [1.15 - w, 0.1]; p.lEl = 0.6; p.neck = -0.35; p.spine = -0.05; return p; },
    // the line goes slack: the arms drop, he looks over the edge
    slack(τ, c) { const p = ACTIONS.idle(τ, c), k = MathX.smooth(τ, 0, 0.5); p.rSh = [1.35 - 0.6 * k, 0.08]; p.rEl = 0.35 + 0.3 * k; p.lSh = [1.15 - 0.9 * k, 0.1]; p.lEl = 0.6; p.neck = -0.35 + 0.85 * k; p.spine = 0.2 * k; return p; },
    // the confetti cannon held up in the right hand (a recoil when it fires)
    cannon(τ, c) { const p = ACTIONS.idle(τ, c); p.rSh = [2.1, 0.12]; p.rEl = 0.5; p.lSh = [1.6, 0.25]; p.lEl = 1.2; p.neck = -0.25; return p; },
    fired(τ, c) { const p = ACTIONS.idle(τ, c), k = Math.exp(-τ * 5); p.rSh = [2.1 + 0.25 * k, 0.12]; p.rEl = 0.5 + 0.3 * k; p.lSh = [1.6 * Math.exp(-τ * 2), 0.25]; p.lEl = 1.2 * Math.exp(-τ * 2); p.neck = -0.6 * Math.exp(-τ * 1.2) + 0.45 * MathX.smooth(τ, 1.2, 1.9); p.spine = 0.1 * MathX.smooth(τ, 1.2, 1.9); return p; },
    // holding a drink
    drink(τ, c) { const p = ACTIONS.idle(τ, c); p.rSh = [0.5, 0.1]; p.rEl = 1.6 + 0.1 * Math.sin(τ * 0.5 + c.seed * 3); return p; },
    // hurrying in out of the rain, a hand over the head
    hurry(τ, c) { const p = ACTIONS.jog(τ, c); p.rSh = [2.6, 0.4]; p.rEl = 2.2; p.spine = 0.25; p.neck = 0.25; return p; },
  });
  Object.assign(BLEND, { holdUp: 0.4, reachUp: 0.12, lookUp: 0.5, kite: 0.4, slack: 0.15, cannon: 0.5, fired: 0.06, drink: 0.5, hurry: 0.35 });
  LOOKS.nrChild = { skin: 1, build: 'slim', shirt: '#e2a33a', sleeves: 'short', pants: '#3d5a80', shoes: '#e8e4dc', sole: '#f0ede6', hair: '#5a3a22', hairStyle: 'pony' };
  LOOKS.nrMum = { skin: 1, build: 'slim', shirt: '#6d4b5e', sleeves: 'long', pants: '#22262c', shoes: '#2a2a2a', sole: '#3a3a3a', hair: '#3a2416', hairStyle: 'long', jacket: true };
})();

// the way in: everyone heads for the stair door (and is gone once through it)
const NR_DOOR = [[25.9, -0.3], [26.7, -0.8], [27.8, -0.8]];
function nrWayIn(t0, x, z, speed) {
  const pts = [[t0, x, z]]; let t = t0, px = x, pz = z;
  for (const [qx, qz] of NR_DOOR) { t += Math.hypot(qx - px, qz - pz) / speed; pts.push([t, qx, qz]); px = qx; pz = qz; }
  return pts;
}

// the people: [id, look, path [[S, x, z]…], states [[S, action]…], { face (deg; 0 = down the avenue, 90 = towards the street), faceUntil, y, seat, scale, from, until, stride, roof }]
// (the roof's deck is NR_ROOF.y; the party's timber platform 4 cm above it)
const NR_PEOPLE = (() => {
  const Y = NR_ROOF.y, P = Y + 0.04;
  return [
    // the kite flyer, at the front corner, flying it downwind; after the change he stares over the edge; the rain sends him in
    ['K', 'casual4', [[0, 13.9, 2.3], [26.4, 13.9, 2.3], ...nrWayIn(26.4, 14.6, 1.9, 2.6).slice(1)], [[0, 'kite'], [NR.loss + 0.12, 'slack'], [26.4, 'hurry']], { face: 36.9, faceUntil: 26.4, y: Y, stride: 1.6 }],
    // the girl with the balloons and her mum: they stay out for the balloons, then go in
    ['C', 'nrChild', [[0, 19.6, 1.15], [NR.balloon + 0.9, 19.6, 1.15], ...nrWayIn(NR.balloon + 0.9, 20.2, 0.9, 2.4).slice(1)], [[0, 'holdUp'], [NR.loss + 0.1, 'flinch'], [NR.loss + 0.7, 'holdUp'], [NR.balloon - 0.12, 'reachUp'], [NR.balloon + 0.3, 'lookUp'], [NR.balloon + 0.9, 'hurry']], { face: -75, faceUntil: NR.balloon + 0.9, y: P, scale: 0.62, stride: 0.95 }],
    ['M', 'nrMum', [[0, 20.4, 1.75], [NR.balloon + 0.8, 20.4, 1.75], ...nrWayIn(NR.balloon + 0.8, 20.9, 1.4, 2.4).slice(1)], [[0, 'drink'], [NR.loss + 0.05, 'flinch'], [NR.loss + 0.6, 'look'], [NR.pop + 0.3, 'lookUp'], [23.6, 'idle'], [NR.balloon + 0.2, 'lookUp'], [NR.balloon + 0.8, 'hurry']], { face: -120, faceUntil: NR.balloon + 0.8, y: P }],
    // the confetti cannon
    ['G1', 'casual2', [[0, 19.0, -1.4], [25.0, 19.0, -1.4], ...nrWayIn(25.0, 19.5, -0.9, 2.7).slice(1)], [[0, 'cannon'], [NR.loss + 0.1, 'flinch'], [NR.loss + 0.6, 'cannon'], [NR.pop, 'fired'], [25.0, 'hurry']], { face: -54, faceUntil: 25.0, y: P, stride: 1.6 }],
    // at the table (stands up when the rain comes)
    ['G2', 'casual8', [[0, 20.65, -1.05], [24.9, 20.65, -1.05], [25.4, 20.65, -1.5], ...nrWayIn(25.4, 21.2, -1.6, 2.5).slice(1)], [[0, 'sit'], [24.9, 'idle'], [25.4, 'hurry']], { face: 180, faceUntil: 25.4, y: P, seat: 0.45, stride: 1.6 }],
    ['G3', 'casual5', [[0, 22.6, 1.2], [24.5, 22.6, 1.2], ...nrWayIn(24.5, 23.2, 0.8, 2.6).slice(1)], [[0, 'drink'], [NR.loss + 0.08, 'flinch'], [NR.loss + 0.6, 'drink'], [NR.pop + 0.2, 'lookUp'], [23.8, 'idle'], [24.5, 'hurry']], { face: 145, faceUntil: 24.5, y: P, stride: 1.6 }],
    // the avenue below (seen in the drop): walkers, someone on the phone; all gone in before the storm
    ['S1', 'casual1', [[0, 9.7, -22], [30, 9.7, 18]], [[0, 'walk']], { until: NR.gale[0] }],
    ['S2', 'casual3', [[0, -9.6, 14], [30, -9.6, -26]], [[0, 'walk']], { until: NR.gale[0] }],
    ['S3', 'casual7', [[0, -10.4, -3.2]], [[0, 'phone']], { face: 80, until: NR.gale[0] }],
    ['S4', 'casual6', [[0, 9.2, 16], [30, 9.2, -20]], [[0, 'walk']], { until: NR.gale[0] }],
    ['S5', 'casual8', [[0, -9.9, -16], [30, -9.9, 20]], [[0, 'walk']], { until: NR.gale[0] }],
  ];
})();

class NrPeople {
  constructor(scene) {
    this.list = NR_PEOPLE.map(([id, look, path, states, o]) => {
      const spec = { id, look, path, states, y: o.y !== undefined ? o.y : LAYOUT.curbH, seat: o.seat, stride: o.stride || 1.32 };
      if (o.face !== undefined) spec.face = o.face;
      if (o.faceUntil !== undefined) spec.faceUntil = o.faceUntil;
      const p = new Person(spec, scene);
      if (o.scale) p.root.scale.setScalar(o.scale);
      p.root.traverse((q) => { if (q.isMesh) q.castShadow = true; });
      return { p, o, id, roof: o.y !== undefined };
    });
    this.byId = Object.fromEntries(this.list.map((q) => [q.id, q.p]));
    this.blobs = new BlobShadows(scene, this.list.length + 4);
    this._v = new THREE.Vector3();
  }
  update(S) {
    this.blobs.begin();
    for (const { p, o, roof } of this.list) {
      let vis = !(o.until !== undefined && S >= o.until);
      if (vis && roof) { const P = p.pathPts, last = P[P.length - 1]; vis = !(S >= last[0] - 0.4 && last[1] > 27); }     // through the door
      p.root.visible = vis;
      if (!vis) continue;
      p.update(S);
      // (gone through the door: hidden once past its frame)
      if (roof && p.root.position.x > NR_ROOF.hut.x0 + 0.15) { p.root.visible = false; continue; }
      const w = p.worldOf('hips', this._v); this.blobs.push(w.x, (o.y !== undefined ? o.y : LAYOUT.curbH) + 0.012, w.z, 0.55 * (o.scale || 1), 0.42);
    }
    this.blobs.end();
  }
}

/* ---------------- traffic ---------------- */
// the avenue's traffic runs at 36 km/h; when the ice arrives the drivers stop where they are
const NR_TRAFFIC_D = (() => { const tab = []; let d = 0; for (let i = 0; i <= 70 * 60; i++) { const S = i / 60; tab.push(d); d += MathX.lerp(10, 0, MathX.smooth(S, NR_ICE.first + 0.2, NR_ICE.first + 2.4)) / 60; } return (S) => { const f = MathX.clamp(S * 60, 0, tab.length - 1.001), k = Math.floor(f); return tab[k] + (tab[k + 1] - tab[k]) * (f - k); }; })();

class NrTraffic {
  constructor(scene) {
    this.F = new VehicleFactory();
    this.blobs = new BlobShadows(scene, 34);
    const types = ['sedan', 'hatch', 'suv', 'ev', 'hatch', 'sedan', 'taxi', 'van', 'suv'], colors = ['#e8e6e0', '#2b2f36', '#8a929a', '#3b5a7a', '#5b2f2a', '#c9c3b5', '#1e2a24', '#d8d4ca', '#46505a'];
    const rng = new RNG(818);
    this.cars = [];
    const mk = (type, color) => { const v = this.F.build(type, color); scene.add(v.group); v.group.traverse((q) => { if (q.isMesh) q.castShadow = true; }); return v; };
    let k = 0;
    for (let off = -60; off < 420; off += rng.range(26, 44)) { this.cars.push({ v: mk(types[k % 9], colors[(k * 4) % 9]), x: -1.75, dir: 1, off }); k++; }
    for (let off = -300; off < 400; off += rng.range(40, 70)) { this.cars.push({ v: mk(types[k % 9], colors[(k * 2) % 9]), x: 1.75, dir: -1, off }); k++; }
    for (const z of [10, 18, -22, -29.5]) { const v = mk(rng.pick(types), rng.pick(colors)); v.group.position.set(-5.55, 0, z); v.group.rotation.y = -Math.PI / 2; }
  }
  _z(dir, off, D) { return dir > 0 ? -420 + ((off + D) % 480) : 60 - ((off + D + 480 * 3) % 480); }
  update(S) {
    this.blobs.begin();
    const D = NR_TRAFFIC_D(S), stopped = S > NR_ICE.first + 2.4;
    for (const c of this.cars) {
      const z = this._z(c.dir, c.off, D);
      c.v.group.visible = z > -440 && z < 70;
      c.v.group.position.set(c.x, 0, z); c.v.group.rotation.y = c.dir > 0 ? -Math.PI / 2 : Math.PI / 2;
      for (const w of c.v.wheels) w.rotation.z = -(D + c.off) / c.v.r;
      c.v.tail.emissiveIntensity = S > NR_ICE.first + 0.2 ? 4.5 : 0.6;
      if (c.v.group.visible) this.blobs.push(c.x, 0.012, z, 2.9, 0.45, 1.3, c.v.group.rotation.y);
    }
    this.blobs.end();
  }
}

/* ---------------- the balloons: six on 1.1 m strings, in the girl's hand ---------------- */
// Before the change the 50 km/h wind lays them over downwind (drag against buoyancy). At the change they swing up and,
// with no air to damp them, keep swinging (an upside-down pendulum: buoyancy pulls up at ≈ 2 g). In the storm they stand
// dead upright. Let go, each shoots up at ≈ 2 g (21 m/s²), its string hanging straight down under it.
class NrBalloons {
  constructor(scene, people) {
    this.people = people;
    const cols = ['#d4232a', '#f2c14e', '#3d8fd9', '#f4f1e8', '#5bb36a', '#e8577e'], g = new THREE.SphereGeometry(0.15, 18, 14);
    this.list = cols.map((c, i) => {
      const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: c, roughness: 0.25, metalness: 0.05 }));
      m.scale.set(1, 1.12, 1); m.castShadow = true; scene.add(m);
      const knot = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.04, 6), m.material); knot.position.y = -0.17; knot.rotation.x = Math.PI; m.add(knot);
      const a = (i / cols.length) * Math.PI * 2;
      return { m, L: 0.95 + 0.25 * hash1(i * 7 + 1), ox: Math.cos(a) * 0.17, oz: Math.sin(a) * 0.17, ph: i * 1.3, ak: 0.92 + 0.16 * hash1(i * 7 + 2) };
    });
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(cols.length * 6), 3));
    this.str = new THREE.LineSegments(sg, new THREE.LineBasicMaterial({ color: '#f2f2ee' })); this.str.frustumCulled = false; scene.add(this.str);
    this._h = new THREE.Vector3(); this.p0 = null;
  }
  _release() {
    if (!this.p0) { const C = this.people.byId.C; C.update(NR.balloon); this.p0 = C.handWorld(-1, new THREE.Vector3()); }
    return this.p0;
  }
  // the lean (rad, downwind) of the bunch: pushed over before the change; after it, swinging free and slowly settling
  lean(S, i) {
    const L0 = Math.min(1.5, nrLoadAtLoss(i)), th0 = 1.15 * L0 / (L0 + 0.35);
    if (S < NR.loss) return th0 * Math.min(1.5, nrLoad(S, i)) / L0 + 0.08 * Math.sin(S * 3.1 + i);
    const u = S - NR.loss, w = Math.sqrt(NR_BALLOON.a / 1.05);
    return th0 * Math.exp(-0.18 * u) * Math.cos(w * u + 0.05 * i);
  }
  speed(S) { return NR_BALLOON.a * Math.max(0, S - NR.balloon); }
  // the bunch's centre (for the tag)
  centre(S, out) { const b = this.list[0]; return out.copy(b.m.position); }
  update(S, people) {
    const C = this.people.byId.C, on = S < NR.balloon + 6 && (C.root.visible || S >= NR.balloon);
    this.str.visible = on; for (const b of this.list) b.m.visible = on;
    if (!on) return;
    const D = NR_WIND_DIR, a = this.str.geometry.attributes.position.array, u = S - NR.balloon;
    let h;
    if (u < 0) h = C.handWorld(-1, this._h);
    else { h = this._release(); C.update(S); }
    this.list.forEach((b, i) => {
      let x, y, z, hx = h.x, hy = h.y, hz = h.z;
      if (u < 0) {
        const th = this.lean(S, i), s = Math.sin(th), c = Math.cos(th);
        x = hx + (D.x * s) * b.L + b.ox * c; y = hy + c * b.L + 0.17; z = hz + (D.z * s) * b.L + b.oz * c;
      } else {
        const rise = 0.5 * NR_BALLOON.a * b.ak * u * u;
        x = hx + b.ox; y = hy + b.L + 0.17 + rise; z = hz + b.oz;
        hx = x; hz = z; hy = y - b.L - 0.17;       // the string's free end hangs straight down under it
      }
      b.m.position.set(x, y, z);
      a.set([x, y - 0.17, z, hx, hy, hz], i * 6);
    });
    this.str.geometry.attributes.position.needsUpdate = true;
  }
}
