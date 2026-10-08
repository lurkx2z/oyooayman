/* =====================================================================
   ACTORS — the people on the avenue (café customers, walkers, a man who
   walks through the pigeons, a child with a balloon and her mother), the
   pigeons that can't take off, the traffic, the red car that coasts, its
   "normal air" ghost, and the leaflets thrown from its window.
   All on story time S. Numbers: physics.js.
   ===================================================================== */

(() => {
  Object.assign(ACTIONS, {
    // a child holding a balloon's string up; the slip; looking up after it
    holdUp(τ, c) { const p = ACTIONS.idle(τ, c); p.rSh = [2.5, 0.12]; p.rEl = 0.35; p.neck = -0.1; p.headYaw = 0.1 * Math.sin(τ * 0.7); return p; },
    reachUp(τ, c) { const p = ACTIONS.idle(τ, c), k = Math.min(1, τ / 0.35); p.rSh = [2.5 + 0.35 * k, 0.12]; p.rEl = 0.35 - 0.3 * k; p.lSh = [2.4 * k, 0.1]; p.lEl = 0.2; p.neck = -0.6 * k; p.spine = -0.08 * k; p.hipY = 0.93 + 0.02 * k; return p; },
    lookUp(τ, c) { const p = ACTIONS.idle(τ, c), k = Math.min(1, τ / 0.5); p.neck = -0.75 * k; p.spine = -0.06 * k; p.headYaw = 0; p.rSh = [0.35 * k, 0.1]; p.rEl = 0.9 * k; return p; },
    // flinch away, then crouch with the arms over the head
    duck(τ, c) { const p = basePose(), w = Math.sin(τ * 2.2 + c.seed * 4) * 0.02, k = Math.min(1, τ / 0.35); p.spine = 0.7 * k + w; p.neck = 0.45 * k; p.lSh = [2.2 * k, 0.3]; p.rSh = [2.2 * k, 0.3]; p.lEl = 2.2 * k; p.rEl = 2.2 * k;
      p.lHip = [0.9 * k, 0.15]; p.rHip = [0.9 * k, 0.15]; p.lKnee = 1.5 * k; p.rKnee = 1.5 * k; p.hipY = 0.93 - 0.36 * k; return p; },
    sitDuck(τ, c) { const p = ACTIONS.sit(τ, c), k = Math.min(1, τ / 0.3); p.spine = 0.85 * k; p.neck = 0.5 * k; p.lSh = [2.2 * k, 0.3]; p.rSh = [2.2 * k, 0.3]; p.lEl = 2.1 * k; p.rEl = 2.1 * k; return p; },
  });
  Object.assign(BLEND, { holdUp: 0.4, reachUp: 0.12, lookUp: 0.5, duck: 0.15, sitDuck: 0.15 });
  LOOKS.nrChild = { skin: 1, build: 'slim', shirt: '#e2a33a', sleeves: 'short', pants: '#3d5a80', shoes: '#e8e4dc', sole: '#f0ede6', hair: '#5a3a22', hairStyle: 'pony' };
  LOOKS.nrMum = { skin: 1, build: 'slim', shirt: '#6d4b5e', sleeves: 'long', pants: '#22262c', shoes: '#2a2a2a', sole: '#3a3a3a', hair: '#3a2416', hairStyle: 'long', jacket: true, shoulderBag: '#8a6a44' };
})();

// the people: [id, look, path [[S, x, z]…], states [[S, action]…], { face (deg; 0 = down the avenue), seat, from, scale }]
const NR_PEOPLE = [
  ['K1', 'casual6', [[0, 11.1, -14.0]], [[0, 'sit'], [59.7, 'sitDuck']], { face: 0, seat: 0.45 }],
  ['K2', 'casual2', [[0, 11.1, -15.4]], [[0, 'sit'], [59.85, 'sitDuck']], { face: 180, seat: 0.45 }],
  ['K3', 'casual8', [[0, 11.1, -18.6]], [[0, 'sit'], [60.0, 'sitDuck']], { face: 0, seat: 0.45 }],
  // the man who walks through the pigeons (and past you)
  ['P', 'casual4', [[0, 9.7, -36], [27.6, 9.7, -5.4], [29.6, 9.85, -3.1], [33.8, 9.85, -3.1], [62, 9.6, -40]], [[0, 'walk'], [29.5, 'look'], [30.3, 'idle'], [33.8, 'walk']], {}],
  // the child with the balloon and her mother: out of the shop at 38 s; they stop beside you
  ['C', 'nrChild', [[0, 12.2, -6.6], [38.0, 12.2, -6.6], [43.4, 11.25, -3.0]], [[0, 'holdUp'], [38.0, 'walk'], [43.4, 'holdUp'], [NR.balloon, 'reachUp'], [45.4, 'lookUp'], [59.7, 'duck']], { from: 38.0, scale: 0.62, stride: 0.9, faceAfter: [43.4, 120] }],
  ['M', 'nrMum', [[0, 12.4, -7.4], [38.0, 12.4, -7.4], [43.6, 11.95, -3.7]], [[0, 'idle'], [38.0, 'walk'], [43.6, 'idle'], [NR.balloon + 0.25, 'lookUp'], [59.6, 'duck']], { from: 38.0, faceAfter: [43.6, 135] }],
  // the far side: walkers, a woman on the phone, the bus stop
  ['W2', 'casual1', [[0, -9.4, -40], [50.4, -9.4, 25.5], [62, -9.4, 25.5]], [[0, 'walk'], [50.4, 'look'], [59.7, 'duck']], {}],
  ['W3', 'casual5', [[0, -9.8, 14], [40, -9.8, -38], [62, -9.8, -38]], [[0, 'walk'], [40, 'idle'], [50.5, 'look']], {}],
  ['W4', 'casual7', [[0, -10.6, -26]], [[0, 'phone'], [50.5, 'look'], [59.8, 'duck']], { face: 160 }],
  ['W5', 'casual3', [[0, -9.2, -70], [62, -9.2, 10]], [[0, 'walk']], {}],
  ['B1', 'casual8', [[0, -10.6, -39.2]], [[0, 'idle'], [50.5, 'look']], { face: 90 }],
  ['B2', 'casual2', [[0, -10.9, -41.6]], [[0, 'phone'], [50.6, 'look']], { face: 70 }],
  ['W6', 'casual6', [[0, 10.4, -80], [62, 10.4, -52]], [[0, 'walk']], {}],
];

class NrPeople {
  constructor(scene) {
    this.list = NR_PEOPLE.map(([id, look, path, states, o]) => {
      const spec = { id, look, path, states, y: LAYOUT.curbH, seat: o.seat, stride: o.stride || 1.32 };
      if (o.face !== undefined) spec.face = o.face;
      const p = new Person(spec, scene);
      if (o.scale) p.root.scale.setScalar(o.scale);
      p.root.traverse((q) => { if (q.isMesh) q.castShadow = true; });
      return { p, o, id };
    });
    this.byId = Object.fromEntries(this.list.map((q) => [q.id, q.p]));
    this.blobs = new BlobShadows(scene, this.list.length + 4);
    this._v = new THREE.Vector3();
  }
  update(S) {
    this.blobs.begin();
    for (const { p, o } of this.list) {
      p.root.visible = !(o.from !== undefined && S < o.from);
      if (!p.root.visible) continue;
      p.update(S);
      if (o.faceAfter && S >= o.faceAfter[0]) { p.root.rotation.y = MathX.angleLerp(p.root.rotation.y, Math.PI + MathX.deg(o.faceAfter[1]), MathX.smooth(S, o.faceAfter[0], o.faceAfter[0] + 0.6)); p.root.updateMatrixWorld(true); }
      const w = p.worldOf('hips', this._v); this.blobs.push(w.x, LAYOUT.curbH + 0.012, w.z, 0.55 * (o.scale || 1), 0.42);
    }
    this.blobs.end();
  }
}

/* ---------------- the pigeons ---------------- */
// six on the pavement ahead of you (startled at NR.startle: they flap hard and only hop), one on a window ledge that steps off
const NR_PIGEONS = [[9.6, -2.4, 0.4], [10.1, -3.1, 2.2], [10.6, -2.2, 4.0], [9.95, -1.8, 1.1], [10.8, -3.4, 5.1], [9.35, -3.6, 3.3], [10.35, -4.0, 6.2]];
const NR_LEDGE = { x: 12.24, y: 3.62, z: -3.0 };

class NrPigeons {
  constructor(scene) {
    const grey = Mat.std('#8a8f99', { roughness: 0.85 }), dark = Mat.std('#4d525b', { roughness: 0.85 }), neck = Mat.std('#5f7a6e', { roughness: 0.6, metalness: 0.2 }),
      pink = Mat.std('#c27a74', { roughness: 0.8 }), beak = Mat.std('#3a3530', { roughness: 0.6 });
    const wingMat = new THREE.MeshStandardMaterial({ color: '#8f949e', roughness: 0.85, side: THREE.DoubleSide });
    const wingG = new THREE.BufferGeometry();
    // one wing: a fan from the shoulder (x 0) out to the tip (x 0.3), chord along z, with dark bars
    wingG.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.06, 0.3, 0, 0.04, 0, 0, 0.07, 0, 0, -0.06, 0.18, 0, -0.05, 0.3, 0, 0.04], 3));
    wingG.computeVertexNormals();
    const mk = () => {
      const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), grey); b.scale.set(0.95, 0.85, 1.55); body.add(b);
      const nk = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), neck); nk.position.set(0, 0.06, 0.08); body.add(nk);
      const head = new THREE.Group(); head.position.set(0, 0.105, 0.11); body.add(head);
      head.add(new THREE.Mesh(new THREE.SphereGeometry(0.034, 8, 6), dark));
      const bk = new THREE.Mesh(new THREE.ConeGeometry(0.009, 0.03, 5), beak); bk.rotation.x = Math.PI / 2; bk.position.set(0, -0.004, 0.042); head.add(bk);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.012, 0.11), dark); tail.position.set(0, 0.0, -0.15); tail.rotation.x = 0.25; body.add(tail);
      const wl = new THREE.Group(), wr = new THREE.Group(); wl.position.set(0.05, 0.04, 0.02); wr.position.set(-0.05, 0.04, 0.02); body.add(wl, wr);
      wl.add(new THREE.Mesh(wingG, wingMat)); const r = new THREE.Mesh(wingG, wingMat); r.scale.x = -1; wr.add(r);
      const legs = [];
      for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.07, 4), pink); l.position.set(s * 0.025, -0.075, 0.01); body.add(l); legs.push(l); }
      g.traverse((q) => { if (q.isMesh) q.castShadow = true; });
      scene.add(g);
      return { g, body, head, wl, wr };
    };
    this.birds = NR_PIGEONS.map(([x, z, s], i) => Object.assign(mk(), { x, z, s, i, t0: NR.startle + 0.06 * i + 0.04 * Math.sin(s * 5), dir: Math.atan2((x - 9.85) * 2.2, 1.0 + 0.2 * Math.sin(s)) }));
    this.ledge = Object.assign(mk(), { s: 7.7 });
    // the ledge (a stone window sill) it stands on
    const sill = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 1.5), Mat.std('#d6cebd', { roughness: 0.8 })); sill.position.set(NR_LEDGE.x + 0.09, NR_LEDGE.y - 0.05, NR_LEDGE.z);
    sill.castShadow = true; sill.receiveShadow = true; scene.add(sill);
    this.blobs = new BlobShadows(scene, 8);
  }
  _flap(B, S, rate, amp, open) { const f = Math.sin(S * rate * 6.283 + B.s * 9); B.wl.rotation.z = open + amp * f; B.wr.rotation.z = -(open + amp * f); B.wl.rotation.y = -0.2 * amp; B.wr.rotation.y = 0.2 * amp; }
  _fold(B, k = 0) { B.wl.rotation.set(0, 1.35 - 0.6 * k, 0.15 + 0.4 * k); B.wr.rotation.set(0, -(1.35 - 0.6 * k), -(0.15 + 0.4 * k)); }
  update(S) {
    const vis = (S > 27.5 && S < 34.5) || S < 12.4 || S > 40.5, h = LAYOUT.curbH + 0.085;
    this.blobs.begin();
    for (const B of this.birds) {
      B.g.visible = vis; if (!vis) continue;
      const u = S - B.t0, s = B.s;
      let x = B.x, z = B.z, y = h, yaw = s * 1.3 + 0.4 * Math.sin(S * 0.4 + s), pitch = 0;
      if (u < 0) {        // pecking about
        const pk = Math.max(0, Math.sin(S * 2.1 + s * 3)) ** 6;
        B.head.position.set(0, 0.105 - 0.07 * pk, 0.11 + 0.04 * pk); pitch = 0.35 * pk;
        x += 0.12 * Math.sin(S * 0.3 + s); z += 0.1 * Math.cos(S * 0.27 + s);
        this._fold(B);
      } else {            // startled: frantic flapping; the legs give three little hops; nothing lifts it
        const hopU = Math.min(u, 1.65), run = Math.min(u, 1.9);
        const hop = u < 1.65 ? nrHop(hopU, 1.9 + 0.3 * Math.sin(s)) : 0;
        y += hop; yaw = B.dir;
        x += Math.sin(B.dir) * 1.15 * run - 0.15 * run * run * Math.sin(B.dir); z += Math.cos(B.dir) * 1.15 * run - 0.15 * run * run * Math.cos(B.dir);
        x += 0.12 * Math.sin(S * 0.3 + s); z += 0.1 * Math.cos(S * 0.27 + s);
        B.head.position.set(0, 0.11, 0.1);
        const fr = MathX.smooth(u, 2.0, 3.4);
        if (fr < 1) this._flap(B, S, 9.5 + 2 * Math.sin(s), 1.05 * (1 - fr), 0.15 * (1 - fr) + 0.25 * fr); else this._fold(B, 0.4 * Math.max(0, 1 - (u - 3.4) / 2));
        pitch = -0.35 * (1 - fr) + 0.08 * Math.sin(S * 7 + s) * (1 - fr);
      }
      B.g.position.set(x, y, z); B.g.rotation.set(0, yaw, 0); B.body.rotation.set(-pitch, 0, 0);
      this.blobs.push(x, LAYOUT.curbH + 0.01, z, 0.24, 0.5 * (1 - MathX.clamp((y - h) * 3, 0, 0.6)));
    }
    // the ledge pigeon: steps off at NR.ledge, flaps frantically and drops straight down (3.5 m in 0.84 s), lands hard, gets up
    const L = this.ledge, u = S - NR.ledge, y0 = NR_LEDGE.y + 0.085, yG = LAYOUT.curbH + 0.085, tf = Math.sqrt(2 * (y0 - yG) / NR_G);
    L.g.visible = vis;
    if (vis) {
      let x = NR_LEDGE.x, y = y0, z = NR_LEDGE.z, roll = 0, pitch = 0, yaw = -Math.PI / 2 + 0.2;
      if (u < 0) { this._fold(L); if (u > -0.5) this._flap(L, S, 4, 0.5 * MathX.smooth(u, -0.5, -0.2), 0.3); L.head.position.set(0, 0.105 - 0.03 * Math.max(0, Math.sin(S * 3)), 0.11); }
      else if (u < tf) { x -= 0.35 * Math.min(u, 0.25) / 0.25 * 0.6 + 0.12 * u; y = y0 - NR_DROP.fall(u); this._flap(L, S, 11, 1.1, 0.2); pitch = -0.5 + 0.15 * Math.sin(S * 23); roll = 0.3 * Math.sin(S * 6); }
      else { const w = u - tf; x -= 0.15 + 0.12 * tf + 0.25 * Math.min(w, 0.4); y = yG + 0.06 * Math.abs(Math.sin(Math.min(w, 0.35) * 9)) * (1 - w / 0.35); roll = 1.3 * Math.exp(-w * 3) * (w < 0.7 ? 1 : 0) + (w >= 0.7 ? 0 : 0);
        if (w < 0.7) this._flap(L, S, 5, 0.5 * (1 - w / 0.7), 0.6); else this._fold(L, 0.6 * Math.max(0, 1 - (w - 0.7)));
        pitch = 0.3 * Math.exp(-w * 2); yaw += 0.8 * MathX.smooth(w, 0.8, 1.6); }
      L.g.position.set(x, y, z); L.g.rotation.set(0, yaw, roll); L.body.rotation.set(-pitch, 0, 0);
      if (y < yG + 1.5) this.blobs.push(x, LAYOUT.curbH + 0.01, z, 0.26, 0.5 * (1 - (y - yG) / 1.5));
    }
    this.blobs.end();
  }
}

/* ---------------- traffic ---------------- */
// the street's traffic runs at 36 km/h; after the flash at the impact, drivers stop
const NR_TRAFFIC_D = (() => { const tab = []; let d = 0; for (let i = 0; i <= 70 * 60; i++) { const S = i / 60; tab.push(d); d += MathX.lerp(10, 0, MathX.smooth(S, NR.impact + 0.3, NR.impact + 2.6)) / 60; } return (S) => { const f = MathX.clamp(S * 60, 0, tab.length - 1.001), k = Math.floor(f); return tab[k] + (tab[k + 1] - tab[k]) * (f - k); }; })();

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
    // the coasting car (red), its "normal air" ghost
    this.hero = mk('sedan', '#b3221d');
    this.ghost = this._ghost(this.F.build('sedan', '#ffffff')); scene.add(this.ghost.group);
    // the passenger's arm out of the window with the leaflets
    const arm = new THREE.Group(), sk = Mat.std('#c99a7c', { roughness: 0.7 }), sl = Mat.std('#2f4f6e', { roughness: 0.9 });
    const fa = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.42), sl); fa.position.set(0, 0, -0.1); arm.add(fa);
    const hd = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.11), sk); hd.position.set(0, 0.0, 0.16); arm.add(hd);
    this.stack = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.16), Mat.std('#f2efe6', { roughness: 0.9 })); this.stack.position.set(0, 0.04, 0.2); arm.add(this.stack);
    arm.position.set(0.35, 1.18, 0.95);    // car space: +x forward, +z its right side
    this.arm = arm; this.hero.group.add(arm);
    // the leaflets
    const lr = new RNG(612), sheetG = new THREE.PlaneGeometry(0.21, 0.15); sheetG.rotateX(-Math.PI / 2);
    const sm = new THREE.MeshStandardMaterial({ color: '#f4f1e8', roughness: 0.9, side: THREE.DoubleSide });
    this.sheets = [];
    for (let i = 0; i < 12; i++) {
      const m = new THREE.Mesh(sheetG, sm); m.castShadow = true; scene.add(m);
      this.sheets.push({ m, vx: lr.range(1.3, 2.6), vy: lr.range(0.2, 1.6), dv: lr.range(-0.6, 0.4), dz: lr.range(-0.1, 0.1), sx: lr.range(-9, 9), sy: lr.range(-6, 6), sz: lr.range(-9, 9) });
    }
    this._so = {};
    // parked cars on the far side
    for (const z of [10, 18, -22, -29.5]) { const v = mk(rng.pick(types), rng.pick(colors)); v.group.position.set(-5.55, 0, z); v.group.rotation.y = -Math.PI / 2; }
  }
  // a see-through white copy of the car with bright edges
  _ghost(v) {
    const fill = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.16, depthWrite: false }), edge = new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85 });
    const lines = [];
    v.group.traverse((q) => { if (q.isMesh) { q.material = fill; q.castShadow = false; const e = new THREE.LineSegments(new THREE.EdgesGeometry(q.geometry, 30), edge); q.add(e); lines.push(e); } });
    v.fill = fill; v.edge = edge; v.group.renderOrder = 5; return v;
  }
  _z(dir, off, D) { return dir > 0 ? -420 + ((off + D) % 480) : 60 - ((off + D + 480 * 3) % 480); }
  heroZ(S) { return NR_CAM.z - NR_CAR.dist(S); }
  ghostZ(S) { return NR_CAM.z - NR_CAR.dist(S, true); }
  update(S) {
    this.blobs.begin();
    const D = NR_TRAFFIC_D(S), hz = this.heroZ(S), gz = this.ghostZ(S), carT = S > 18 && S < 34;
    for (const c of this.cars) {
      const z = this._z(c.dir, c.off, D);
      // (both lanes are kept clear around the red car and its ghost)
      const near = carT && (c.dir < 0 ? Math.abs(z - hz) < 70 : Math.abs(z - gz) < 70 || (z > -30 && z < 60));
      c.v.group.visible = !near && z > -440 && z < 70;
      c.v.group.position.set(c.x, 0, z); c.v.group.rotation.y = c.dir > 0 ? -Math.PI / 2 : Math.PI / 2;
      for (const w of c.v.wheels) w.rotation.z = -(D + c.off) / c.v.r;
      c.v.tail.emissiveIntensity = S > NR.impact + 0.3 && S < NR.impact + 3 ? 4.5 : 0.6;
      if (c.v.group.visible) this.blobs.push(c.x, 0.012, z, 2.9, 0.45, 1.3, c.v.group.rotation.y);
    }
    // the coasting car: no brake lights — throttle off, it just rolls
    const H = this.hero;
    H.group.visible = carT && hz > -420; H.group.position.set(1.75, 0, hz); H.group.rotation.y = Math.PI / 2;
    for (const w of H.wheels) w.rotation.z = -(NR_CAM.z - hz) / H.r;
    if (H.group.visible) this.blobs.push(1.75, 0.012, hz, 2.9, 0.45, 1.3, Math.PI / 2);
    this.arm.visible = S < NR.car.toss + 0.25; this.arm.rotation.x = -0.5 * MathX.smooth(S, NR.car.toss - 0.15, NR.car.toss + 0.05);
    this.stack.visible = S < NR.car.toss;
    // the ghost (the same car in normal air), in the other lane so the two can be compared
    const G = this.ghost;
    G.group.visible = carT && gz > -420; G.group.position.set(-1.75, 0, gz); G.group.rotation.y = Math.PI / 2;
    const ga = MathX.smooth(S, 20.5, 21.0) * (1 - MathX.smooth(S, 28.2, 28.6));
    G.fill.opacity = 0.16 * ga; G.edge.opacity = 0.85 * ga;
    for (const w of G.wheels) w.rotation.z = -(NR_CAM.z - gz) / G.r;
    // the leaflets: out of the window together, keeping the car's speed; on the road they slide (and spin) to a stop
    const u = S - NR.car.toss, z0 = this.heroZ(NR.car.toss) - 0.35, v0 = NR_CAR.speed(NR.car.toss), o = this._so;
    for (const [i, L] of this.sheets.entries()) {
      L.m.visible = u > 0 && S < 34;
      if (!L.m.visible) continue;
      NR_SHEETS.at(u, v0 + L.dv, L.vx, L.vy, 1.15, o);
      L.m.position.set(1.75 + 0.95 + o.x, Math.max(0.006 + i * 0.0006, o.y), z0 - o.s + L.dz);
      if (o.air) L.m.rotation.set(L.sx * u, L.sy * u, L.sz * u); else L.m.rotation.set(0, L.sy * u * 0.4 * o.k + i, 0);
    }
    this.blobs.end();
  }
}

/* ---------------- the balloon: a vertical string in a 100 km/h wind; let go, it shoots up at ~2 g (buoyancy, no drag) ---------------- */
class NrBalloon {
  constructor(scene, people) {
    this.people = people;
    this.b = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 14), new THREE.MeshStandardMaterial({ color: '#d4232a', roughness: 0.25, metalness: 0.05 }));
    this.b.scale.set(1, 1.12, 1); this.b.castShadow = true; scene.add(this.b);
    const knot = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.04, 6), this.b.material); knot.position.y = -0.17; knot.rotation.x = Math.PI; this.b.add(knot);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(6), 3));
    this.str = new THREE.Line(g, new THREE.LineBasicMaterial({ color: '#f2f2ee' })); this.str.frustumCulled = false; scene.add(this.str);
    this._h = new THREE.Vector3(); this.p0 = null; this.L = 1.0;
  }
  // where it was let go (the child's hand at that moment; computed once, so every frame agrees)
  _release() {
    if (!this.p0) { const C = this.people.byId.C; C.update(NR.balloon); this.p0 = C.handWorld(-1, new THREE.Vector3()); }
    return this.p0;
  }
  pos(S, out) {
    const u = S - NR.balloon;
    if (u < 0) { const C = this.people.byId.C; C.handWorld(-1, this._h); return out.set(this._h.x + 0.02 * Math.sin(S * 1.3), this._h.y + this.L + 0.17, this._h.z + 0.02 * Math.cos(S * 1.1)); }
    const p = this._release(); return out.set(p.x, p.y + this.L + 0.17 + NR_BALLOON.rise(u), p.z);
  }
  speed(S) { return NR_BALLOON.a * Math.max(0, S - NR.balloon); }
  update(S) {
    const C = this.people.byId.C, on = S >= 38.0 && S < 53;
    this.b.visible = this.str.visible = on; if (!on) return;
    if (S >= NR.balloon) this._release();
    if (S >= NR.balloon) C.update(S);       // (restore the child's pose after computing the release point)
    this.pos(S, this.b.position);
    const a = this.str.geometry.attributes.position.array, p = this.b.position;
    a.set([p.x, p.y - 0.17, p.z, p.x, p.y - 0.17 - this.L, p.z]);
    this.str.geometry.attributes.position.needsUpdate = true;
  }
}
