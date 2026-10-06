/* =====================================================================
   PROPS — the loose things of the friction film (café chairs, shopping
   carts, bikes, wheelie bins, pipes, the truck's cargo, your phone) and
   the restraints that hold some of them (bollards, the corral rail, the
   bike rack, the site fence). Every loose thing is a body in the
   simulation; this file only builds and places the meshes.
   Local frame: forward +X (the body's heading), up +Y, origin on the ground.
   ===================================================================== */

const FrPropKit = {
  mats: null,
  m() {
    if (this.mats) return this.mats;
    this.mats = {
      green: Mat.std('#2f4a3d', { roughness: 0.5, metalness: 0.5 }),
      chrome: Mat.std('#b9bec4', { roughness: 0.3, metalness: 0.9 }),
      red: Mat.std('#b8231d', { roughness: 0.5 }),
      dark: Mat.std('#1e2022', { roughness: 0.7 }),
      bin: Mat.std('#2e5b3c', { roughness: 0.65 }),
      binLid: Mat.std('#244a30', { roughness: 0.6 }),
      orange: Mat.std('#d0662a', { roughness: 0.55 }),
      steel: Mat.std('#8d949b', { roughness: 0.4, metalness: 0.8 }),
      card: Mat.std('#b98d58', { roughness: 0.9 }),
      tape: Mat.std('#d9c79c', { roughness: 0.6 }),
      bikeA: Mat.std('#2f6fa8', { roughness: 0.4, metalness: 0.3 }),
      bikeB: Mat.std('#b23a3a', { roughness: 0.4, metalness: 0.3 }),
      bikeC: Mat.std('#e2b23a', { roughness: 0.4, metalness: 0.3 }),
      tyre: Mat.std('#171718', { roughness: 0.9 }),
      yellow: Mat.std('#e8b91c', { roughness: 0.5 }),
      phone: Mat.std('#22252b', { roughness: 0.35, metalness: 0.4 }),
      screen: new THREE.MeshBasicMaterial({ color: '#3b5f8f' }),
      wire: null,
    };
    const lat = Tex.lattice('#c9ced3'); lat.repeat.set(2, 1);
    this.mats.wire = new THREE.MeshStandardMaterial({ map: lat, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.4, metalness: 0.7 });
    return this.mats;
  },
  _g(parts) {
    const g = new THREE.Group();
    for (const [geo, mat, x, y, z, rx = 0, ry = 0, rz = 0] of parts) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; m.receiveShadow = true; g.add(m); }
    return g;
  },
  chair() {
    const M = this.m(), B = (w, h, d) => new THREE.BoxGeometry(w, h, d), P = [];
    for (const [x, z] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) P.push([new THREE.CylinderGeometry(0.014, 0.014, 0.45, 5), M.green, x, 0.225, z]);
    P.push([B(0.42, 0.03, 0.42), M.green, 0, 0.46, 0], [B(0.03, 0.42, 0.4), M.green, -0.2, 0.69, 0], [B(0.03, 0.05, 0.38), M.green, -0.2, 0.86, 0]);
    return this._g(P);
  },
  cart() {
    const M = this.m(), P = [];
    // wire basket (tapered: wider at the back), handle, frame and four castors
    P.push([new THREE.BoxGeometry(0.85, 0.5, 0.52), M.wire, 0, 0.72, 0], [new THREE.BoxGeometry(0.85, 0.02, 0.52), M.chrome, 0, 0.47, 0]);
    P.push([new THREE.CylinderGeometry(0.02, 0.02, 0.56, 6), M.red, -0.46, 1.02, 0, Math.PI / 2], [new THREE.BoxGeometry(0.06, 0.32, 0.03), M.chrome, -0.44, 0.86, 0.26], [new THREE.BoxGeometry(0.06, 0.32, 0.03), M.chrome, -0.44, 0.86, -0.26]);
    P.push([new THREE.BoxGeometry(0.8, 0.03, 0.03), M.chrome, 0, 0.16, 0.22], [new THREE.BoxGeometry(0.8, 0.03, 0.03), M.chrome, 0, 0.16, -0.22], [new THREE.BoxGeometry(0.4, 0.02, 0.4), M.wire, 0.05, 0.2, 0]);
    for (const [x, z] of [[0.36, 0.2], [0.36, -0.2], [-0.36, 0.22], [-0.36, -0.22]]) { P.push([new THREE.CylinderGeometry(0.06, 0.06, 0.035, 10), M.dark, x, 0.06, z, Math.PI / 2], [new THREE.BoxGeometry(0.03, 0.12, 0.03), M.chrome, x, 0.13, z]); }
    for (const z of [0.25, -0.25]) P.push([new THREE.BoxGeometry(0.03, 0.55, 0.03), M.chrome, 0.38, 0.45, z, 0, 0, 0.35]);
    return this._g(P);
  },
  bike(i = 0) {
    const M = this.m(), col = [M.bikeA, M.bikeB, M.bikeC][i % 3], P = [];
    for (const x of [-0.52, 0.52]) { P.push([new THREE.TorusGeometry(0.33, 0.025, 6, 22), M.tyre, x, 0.34, 0], [new THREE.CylinderGeometry(0.012, 0.012, 0.62, 4), M.chrome, x, 0.34, 0, 0, 0, 0.6], [new THREE.CylinderGeometry(0.012, 0.012, 0.62, 4), M.chrome, x, 0.34, 0, 0, 0, -0.9]); }
    const tube = (x0, y0, x1, y1, r = 0.02) => { const len = Math.hypot(x1 - x0, y1 - y0); return [new THREE.CylinderGeometry(r, r, len, 6), col, (x0 + x1) / 2, (y0 + y1) / 2, 0, 0, 0, Math.atan2(x0 - x1, y1 - y0)]; };
    P.push(tube(-0.52, 0.34, -0.05, 0.36), tube(-0.05, 0.36, 0.4, 0.78), tube(-0.12, 0.8, 0.42, 0.78), tube(-0.05, 0.36, -0.12, 0.8), tube(-0.52, 0.34, -0.12, 0.8), tube(0.52, 0.34, 0.42, 0.82));
    P.push([new THREE.BoxGeometry(0.2, 0.04, 0.09), M.dark, -0.14, 0.86, 0], [new THREE.CylinderGeometry(0.014, 0.014, 0.5, 5), M.dark, 0.42, 0.88, 0, Math.PI / 2]);
    return this._g(P);
  },
  bin() {
    const M = this.m(), P = [];
    // a two-wheeled wheelie bin (handle at the back)
    const g = new THREE.CylinderGeometry(0.33, 0.28, 0.95, 4, 1); g.rotateY(Math.PI / 4);
    P.push([g, M.bin, 0, 0.5, 0], [new THREE.BoxGeometry(0.62, 0.06, 0.62), M.binLid, 0.02, 1.0, 0], [new THREE.BoxGeometry(0.05, 0.04, 0.5), M.dark, -0.33, 1.0, 0]);
    for (const z of [0.25, -0.25]) P.push([new THREE.CylinderGeometry(0.1, 0.1, 0.05, 10), M.tyre, -0.3, 0.1, z, Math.PI / 2]);
    return this._g(P);
  },
  pipe() {
    const M = this.m();
    return this._g([[new THREE.CylinderGeometry(0.16, 0.16, 4.3, 14, 1, true), M.orange, 0, 0.16, 0, 0, 0, Math.PI / 2], [new THREE.RingGeometry(0.12, 0.16, 14), M.orange, 2.15, 0.16, 0, 0, Math.PI / 2], [new THREE.RingGeometry(0.12, 0.16, 14), M.orange, -2.15, 0.16, 0, 0, -Math.PI / 2]]);
  },
  box(i = 0) {
    const M = this.m(), s = [0.62, 0.55, 0.7, 0.5, 0.6][i % 5], h = [0.5, 0.6, 0.45, 0.55, 0.5][i % 5];
    return this._g([[new THREE.BoxGeometry(s, h, s * 0.9), M.card, 0, h / 2, 0], [new THREE.BoxGeometry(s + 0.004, 0.05, 0.1), M.tape, 0, h - 0.02, 0]]);
  },
  // a delivery roll cage: wire sides, shelves of boxed goods, four castors
  cage() {
    const M = this.m(), P = [];
    P.push([new THREE.BoxGeometry(0.8, 0.04, 0.7), M.chrome, 0, 0.14, 0]);
    for (const [x, z, ry] of [[0, 0.35, 0], [0, -0.35, 0], [-0.4, 0, Math.PI / 2]]) P.push([new THREE.PlaneGeometry(x ? 0.7 : 0.8, 1.55), M.wire, x, 0.92, z, 0, ry, 0]);
    for (let i = 0; i < 6; i++) P.push([new THREE.BoxGeometry(0.34, 0.28, 0.3), [M.card, M.tape][i % 2 ? 0 : 0], -0.18 + (i % 2) * 0.36, 0.3 + Math.floor(i / 2) * 0.45, (i % 3 - 1) * 0.12]);
    for (const [x, z] of [[0.34, 0.29], [0.34, -0.29], [-0.34, 0.29], [-0.34, -0.29]]) P.push([new THREE.CylinderGeometry(0.06, 0.06, 0.04, 10), M.dark, x, 0.07, z, Math.PI / 2]);
    return this._g(P);
  },
  phone() {
    const M = this.m();
    return this._g([[new THREE.BoxGeometry(0.152, 0.009, 0.072), M.phone, 0, 0.005, 0], [new THREE.PlaneGeometry(0.14, 0.064), M.screen, 0, 0.0101, 0, -Math.PI / 2]]);
  },
};

class FrProps {
  constructor(scene, world) {
    this.world = world;
    this.items = [];
    let bi = 0, xi = 0;
    for (const [id, kind] of FR_PROPS) {
      const g = kind === 'bike' ? FrPropKit.bike(bi++) : kind === 'box' ? FrPropKit.box(xi++) : FrPropKit[kind]();
      g.name = 'prop:' + id;
      scene.add(g);
      this.items.push({ id, kind, g });
    }
    this.byId = Object.fromEntries(this.items.map((p) => [p.id, p]));
    this._restraints(scene);
    this._lamps(scene);
    this.blobs = new BlobShadows(scene, this.items.length);
    // friction returns: anything tall still sliding catches its base and tips over the way it was going; boxes tumble
    for (const p of this.items) {
      const s = world.sample(p.id, FR.tBack - 0.01);
      if (s.speed > 1.0 && p.kind !== 'phone') p.tip = { dir: Math.atan2(s.vx, s.vz), ang: p.kind === 'box' ? Math.PI * (s.speed > 2.5 ? 2 : 1) : p.kind === 'pipe' ? 0 : Math.PI / 2, dur: p.kind === 'box' ? 0.7 : 0.45 };
    }
    this._ax = new THREE.Vector3();
    this._q = new THREE.Quaternion(); this._q2 = new THREE.Quaternion(); this._x = new THREE.Vector3(1, 0, 0); this._y = new THREE.Vector3(0, 1, 0); this._s = {};
  }

  // bollards at the foot of both parking lanes, the corral front rail, the bike rack, the site fence
  _restraints(scene) {
    const M = FrPropKit.m(), G = FrGround;
    this.bollards = [];
    for (const s of [-1, 1]) for (const x of [4.95, 5.85, 6.75]) {
      const g = FrPropKit._g([[new THREE.CylinderGeometry(0.11, 0.11, 0.95, 10), M.steel, 0, 0.475, 0], [new THREE.CylinderGeometry(0.115, 0.115, 0.1, 10), M.yellow, 0, 0.82, 0]]);
      g.position.set(s * x, G.road(-48.45), -48.45);
      scene.add(g);
      this.bollards.push({ g, side: s, x });
    }
    const y = (z) => G.road(z) + G.curb;
    // corral: side rails (fixed) and the front rail (knocked flat when the carts break loose)
    const rail = (x0, z0, x1, z1) => { const len = Math.hypot(x1 - x0, z1 - z0), g = FrPropKit._g([[new THREE.BoxGeometry(len, 0.05, 0.05), M.steel, len / 2, 0.85, 0], [new THREE.BoxGeometry(0.05, 0.85, 0.05), M.steel, 0.03, 0.42, 0], [new THREE.BoxGeometry(0.05, 0.85, 0.05), M.steel, len - 0.03, 0.42, 0]]); g.position.set(x0, y(z0), z0); g.rotation.y = -Math.atan2(z1 - z0, x1 - x0); scene.add(g); return g; };
    rail(10.3, -57.05, 10.3, -60.4); rail(12.3, -57.05, 12.3, -60.4);
    this.corral = rail(10.3, -57.05, 12.3, -57.05);
    const cs = Tex.label([['RETURN', 34], ['CARTS', 34]], { w: 256, h: 128, bg: '#2f6b3a' });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), new THREE.MeshStandardMaterial({ map: cs, side: THREE.DoubleSide })); sign.position.set(1.0, 1.05, 0); this.corral.add(sign);
    // bike rack hoops
    for (let i = 0; i < 4; i++) { const g = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.03, 6, 12, Math.PI), M.steel); const z = -63.85 - i * 0.9; g.position.set(11.6, y(z), z); g.rotation.y = Math.PI / 2; g.castShadow = true; scene.add(g); }
    // site fence panel in front of the pipe rack (falls flat when the pipes break loose), and the pipe rack trestles
    const fl = Tex.lattice('#9aa3aa'); fl.repeat.set(3, 1);
    const fm = new THREE.MeshStandardMaterial({ map: fl, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.6 });
    this.fence = FrPropKit._g([[new THREE.PlaneGeometry(2.3, 1.8), fm, 1.15, 0.95, 0], [new THREE.BoxGeometry(0.4, 0.12, 0.6), M.orange, 0.05, 0.06, 0], [new THREE.BoxGeometry(0.4, 0.12, 0.6), M.orange, 2.25, 0.06, 0]]);
    this.fence.position.set(10.0, y(-77.85), -77.85); scene.add(this.fence);
    for (const dz of [-0.3, -1.4]) { const g = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.08), M.steel); g.position.set(10.9, y(-78.4 + dz) + 0.02, -78.4 + dz); scene.add(g); }
  }

  // the lamp posts on your block: knocked down (falling about their base, away from what hit them) if a car snaps them
  _lamps(scene) {
    const M = FrPropKit.m(), metal = Mat.std('#2c3034', { roughness: 0.45, metalness: 0.6 }), white = Mat.std('#f0efe9', { roughness: 0.6 });
    this.lamps = [];
    for (const [side, list] of [[1, FR_STATIC.lampsR], [-1, FR_STATIC.lampsL]]) for (const z of list) {
      if (z <= -40) continue;
      const x = side * 7.45, g = new THREE.Group(); g.position.set(x, FrGround.curb, z); scene.add(g);
      const parts = FrPropKit._g([[new THREE.CylinderGeometry(0.07, 0.11, 8.0, 8), metal, 0, 4.0, 0], [new THREE.CylinderGeometry(0.16, 0.2, 0.5, 8), metal, 0, 0.25, 0],
        [new THREE.CylinderGeometry(0.045, 0.05, 2.2, 6), metal, -side * 1.0, 7.95, 0, 0, 0, Math.PI / 2 - side * 0.12], [new THREE.BoxGeometry(0.75, 0.16, 0.36), metal, -side * 2.05, 7.95, 0], [new THREE.BoxGeometry(0.6, 0.03, 0.26), white, -side * 2.05, 7.86, 0]]);
      g.add(parts);
      const id = (side > 0 ? 'lampR' : 'lampL') + z, br = this.world.breaks.find((b) => b.id === id);
      let dir = null;
      if (br) { const s = this.world.sample(br.by, br.t); const sp = Math.hypot(s.vx, s.vz) || 1; dir = [s.vx / sp, s.vz / sp]; }
      this.lamps.push({ g, t: br ? br.t : Infinity, dir });
    }
  }

  update(t) {
    const W = this.world, s = this._s, G = FrGround;
    for (const L of this.lamps) {
      if (t < L.t) { L.g.rotation.set(0, 0, 0); continue; }
      // a falling pole: slow at first, then fast; it lands flat and bounces once
      const a = t - L.t, th = Math.min(Math.PI / 2 - 0.04, 0.2 + 2.2 * a * a) - (a > 0.95 ? 0.05 * Math.exp(-(a - 0.95) / 0.12) * Math.abs(Math.sin((a - 0.95) * 25)) : 0);
      const [dx, dz] = L.dir; L.g.rotation.set(dz * th, 0, -dx * th);
    }
    this.blobs.begin();
    for (const p of this.items) {
      W.sample(p.id, t, s);
      // the cargo is invisible inside the closed truck; the phone rides in your hand until it leaves it (film.js)
      if (p.kind === 'box') { const h = W.byId.T.bigHit; p.g.visible = h !== undefined && t > h + 0.1; }
      if (p.kind === 'phone') p.g.visible = t >= FR.tLoss + 0.05;
      if (!p.g.visible) continue;
      const y = FrTraffic.place(p.g, s, this._q, this._q2, this._x, this._y);
      // a dropped phone falls from your hand for a moment before it skates
      if (p.kind === 'phone') { const a = t - FR.tLoss - 0.05; if (a < 0.42) p.g.position.y = y + 1.12 - 6.3 * a * a; p.g.rotateZ(Math.max(0, 0.42 - a) * 3.2); }
      if (p.tip && t > FR.tBack) {
        const u = MathX.clamp((t - FR.tBack) / p.tip.dur, 0, 1), a = p.tip.ang * (1 - (1 - u) * (1 - u));
        this._ax.set(Math.cos(p.tip.dir), 0, -Math.sin(p.tip.dir));      // horizontal, across the direction of travel
        p.g.rotateOnWorldAxis(this._ax, a);
        if (p.kind === 'box') p.g.position.y += 0.25 * Math.abs(Math.sin(a));
      }
      // bikes stand on their stands until they come loose, then lie on their side
      if (p.kind === 'bike') { const free = this._freeAt(p.id); const k = MathX.smooth(t, free, free + 0.5); p.g.rotateX(0.12 + k * 1.35); }
      this.blobs.push(s.x, y + 0.012, s.z, p.kind === 'pipe' ? 4.2 : p.kind === 'bike' ? 1.4 : 0.8, 0.45, p.kind === 'pipe' ? 0.5 : 0.8, s.yaw + Math.PI / 2);
    }
    this.blobs.end();
    // restraints: bollards fold over when their bar gives way, the rail and the fence drop when their loads break loose
    const bAt = W.brokeAt('bollards1');
    for (const b of this.bollards) {
      const k = b.side > 0 ? MathX.smooth(t, bAt, bAt + 0.25) : 0;
      b.g.rotation.set(k * 1.25, 0, k * (b.x - 5.85) * 0.4);
    }
    const cAt = Math.min(...['ca1', 'ca2', 'ca3', 'ca4', 'ca5'].map((id) => this._freeAt(id)));
    this.corral.rotation.x = MathX.smooth(t, cAt, cAt + 0.3) * 1.45;
    const fAt = Math.min(...['pp1', 'pp2', 'pp3'].map((id) => this._freeAt(id)));
    this.fence.rotation.x = MathX.smooth(t, fAt, fAt + 0.45) * 1.5;
  }

  // when a tethered thing broke loose (Infinity if never)
  _freeAt(id) {
    if (!this._free) { this._free = {}; for (const b of this.world.breaks) { const m = /^(.*):hold$/.exec(b.id); if (m && !(m[1] in this._free)) this._free[m[1]] = b.t; } }
    return this._free[id] !== undefined ? this._free[id] : Infinity;
  }
}
