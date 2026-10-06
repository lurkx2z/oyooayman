/* =====================================================================
   MONTAGE — "meanwhile, everywhere" (48–56 s): five quick shots of other
   things that only work because of friction. They are scripted (not in
   the slide simulation) and built away from the street (x ≈ 700–900) or
   in quiet corners of it; each shot owns the camera for its window.
     CONVEYOR — the belt runs, the groceries stay where they are
     BIKES    — pedalling spins the wheel; the bike can't steer, so it falls and slides on its side
     CRANE    — the hoist brake slips: the load drops
     GRIP     — a slight tilt and every glass slides off the tray
     AMBULANCE — lights and siren, sliding sideways through a junction
   ===================================================================== */

const FR_MONTAGE = [
  { id: 'conveyor', t0: 46.5, t1: 48.1, label: 'CONVEYOR BELTS' },
  { id: 'bike', t0: 48.1, t1: 49.7, label: 'BIKES' },
  { id: 'crane', t0: 49.7, t1: 51.4, label: 'CRANE BRAKES' },
  { id: 'grip', t0: 51.4, t1: 52.95, label: 'GRIP' },
  { id: 'ambulance', t0: 52.95, t1: 54.5, label: 'AMBULANCES' },
];

class FrMontage {
  constructor(scene, factory) {
    this.scene = scene;
    this.root = new THREE.Group(); this.root.name = 'montage'; scene.add(this.root);
    this.factory = factory;
    this._conveyor(); this._bike(); this._crane(); this._grip(); this._ambulance();
    this.glints = new StreakSystem(scene, 240);
    this.dust = new BillboardSystem(scene, 120, false);
  }

  shotAt(t) { return FR_MONTAGE.find((s) => t >= s.t0 && t < s.t1) || null; }

  _add(geo, mat, x, y, z, parent, rx = 0, ry = 0, rz = 0) {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; m.receiveShadow = true; (parent || this.root).add(m); return m;
  }

  /* ---- 1. a supermarket checkout: the belt runs under groceries that don't move ---- */
  _conveyor() {
    const g = new THREE.Group(); g.position.set(700, 0, 300); this.root.add(g); this.conv = g;
    const A = (geo, mat, x, y, z, rx, ry, rz) => this._add(geo, mat, x, y, z, g, rx, ry, rz);
    A(new THREE.BoxGeometry(14, 0.1, 10), Mat.std('#cfccc4', { roughness: 0.5 }), 0, -0.05, 0);
    // shelves behind: rows of colourful packs
    const shelf = Mat.std('#e7e5df', { roughness: 0.6 });
    for (let k = 0; k < 2; k++) {
      const z = -2.6 - k * 2.2;
      A(new THREE.BoxGeometry(7, 2.1, 0.5), shelf, 0, 1.05, z);
      for (let r = 0; r < 4; r++) for (let i = 0; i < 22; i++) {
        const col = ['#c0392b', '#e67e22', '#f1c40f', '#27ae60', '#2980b9', '#8e44ad', '#ecf0f1', '#d35400'][(i * 7 + r * 3 + k) % 8];
        A(new THREE.BoxGeometry(0.24, 0.32, 0.18), Mat.std(col, { roughness: 0.6 }), -3.2 + i * 0.3, 0.32 + r * 0.48, z + 0.27);
      }
    }
    // the counter and the belt
    const lam = Mat.std('#9aa2a8', { roughness: 0.4, metalness: 0.3 });
    A(new THREE.BoxGeometry(2.9, 0.86, 0.75), lam, 0, 0.43, 0);
    const bc = Tex.canvas(64, 256), bx = bc.getContext('2d');
    bx.fillStyle = '#1b1c1e'; bx.fillRect(0, 0, 64, 256);
    for (let y = 0; y < 256; y += 32) { bx.fillStyle = '#5d6166'; bx.fillRect(0, y, 64, 9); bx.fillStyle = '#2c2e31'; bx.fillRect(0, y + 9, 64, 3); }
    const bt = Tex.tex(bc); bt.wrapS = bt.wrapT = THREE.RepeatWrapping; bt.repeat.set(1, 6);
    this.beltTex = bt;
    const belt = A(new THREE.PlaneGeometry(0.48, 2.3), new THREE.MeshStandardMaterial({ map: bt, roughness: 0.75 }), 0, 0.875, 0, -Math.PI / 2, 0, Math.PI / 2);
    belt.castShadow = false;
    for (const z of [-0.29, 0.29]) A(new THREE.BoxGeometry(2.4, 0.05, 0.05), lam, 0, 0.9, z);
    A(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 12), Mat.std('#3a3c40'), 1.18, 0.87, 0, Math.PI / 2);
    A(new THREE.BoxGeometry(0.5, 0.06, 0.6), Mat.std('#2d2f33', { roughness: 0.3 }), 1.65, 0.9, 0);       // the scanner
    A(new THREE.BoxGeometry(0.5, 0.012, 0.42), new THREE.MeshStandardMaterial({ color: '#7fb2c9', roughness: 0.05, metalness: 0.5, emissive: '#36586a', emissiveIntensity: 0.4 }), 1.65, 0.935, 0);
    // groceries, perfectly still on the moving belt
    const P = [
      [new THREE.BoxGeometry(0.2, 0.3, 0.07), '#d6402b', -0.85, 0.15, 0.02, 0.1], [new THREE.BoxGeometry(0.09, 0.25, 0.09), '#f3f3ef', -0.45, 0.125, -0.12, 0.5],
      [new THREE.CylinderGeometry(0.04, 0.04, 0.12, 14), '#b8231d', -0.2, 0.06, 0.12, 0], [new THREE.CylinderGeometry(0.04, 0.04, 0.12, 14), '#b8231d', -0.11, 0.06, 0.12, 0],
      [new THREE.CylinderGeometry(0.04, 0.04, 0.12, 14), '#2a72b8', -0.15, 0.06, 0.03, 0], [new THREE.CylinderGeometry(0.035, 0.045, 0.3, 14), '#2e7d4f', 0.2, 0.15, -0.08, 0],
      [new THREE.BoxGeometry(0.36, 0.035, 0.04), '#8d949b', 0.48, 0.02, 0.0, 0], [new THREE.BoxGeometry(0.18, 0.12, 0.14), '#e8c26a', 0.72, 0.06, 0.06, 0.3],
    ];
    for (const [geo, col, x, y, z, ry] of P) A(geo, Mat.std(col, { roughness: 0.5 }), x, 0.88 + y, z, 0, ry, 0);
    for (let i = 0; i < 5; i++) A(new THREE.IcosahedronGeometry(0.042, 1), Mat.std(i % 2 ? '#c62828' : '#b71c1c', { roughness: 0.45 }), -0.62 + (i % 3) * 0.07, 0.92 + Math.floor(i / 3) * 0.06, -0.1 + (i % 2) * 0.07);
    // the cashier, baffled
    this.cashier = new Person({ id: 'cashier', look: 'casual6' }, null); g.add(this.cashier.root);
    this.cashier.root.position.set(1.75, 0, -0.85); this.cashier.root.rotation.y = 0.3;
  }

  /* ---- 2. a cyclist on the cross street: pedalling, wheels spinning, tipping over and sliding on ---- */
  _bike() {
    const g = new THREE.Group(); this.root.add(g); this.bikeG = g;
    this.bike = FrPropKit.bike(0); g.add(this.bike);
    this.rider = new Person({ id: 'cyclist', look: 'casual5' }, null); g.add(this.rider.root);
    this.rider.root.rotation.y = -Math.PI / 2;           // person forward (+Z) → bike forward (+X)
  }

  /* ---- 3. a tower crane: the hoist brake slips and the load drops ---- */
  _crane() {
    const g = new THREE.Group(); g.position.set(860, 0, 300); this.root.add(g); this.craneG = g;
    const A = (geo, mat, x, y, z, rx, ry, rz) => this._add(geo, mat, x, y, z, g, rx, ry, rz);
    A(new THREE.BoxGeometry(60, 0.1, 60), Mat.std('#8a7a63', { roughness: 1 }), 0, -0.05, 0);
    const lat = Tex.lattice('#e8b91c'); lat.repeat.set(1, 18);
    const lm = new THREE.MeshStandardMaterial({ map: lat, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 });
    A(new THREE.BoxGeometry(1.6, 34, 1.6), lm, -6, 17, -10);
    const lj = lat.clone(); lj.needsUpdate = true; lj.repeat.set(14, 1);
    A(new THREE.BoxGeometry(30, 1.4, 1.4), new THREE.MeshStandardMaterial({ map: lj, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 }), 6, 34.7, -10);
    A(new THREE.BoxGeometry(2.2, 2.0, 2.0), Mat.std('#e8b91c', { roughness: 0.5 }), -6, 33, -8.8);      // cab
    A(new THREE.BoxGeometry(3, 2.2, 1.8), Mat.std('#9a9690'), -14, 34, -10);                          // counterweights
    // a concrete frame going up behind
    const conc = Mat.std('#b3aea4', { roughness: 0.9 });
    for (const x of [-4, 2, 8, 14]) for (const z of [-22, -16]) A(new THREE.BoxGeometry(0.4, 12, 0.4), conc, x, 6, z);
    for (const y of [4, 8, 12]) A(new THREE.BoxGeometry(19, 0.3, 7), conc, 5, y, -19);
    // trolley, cables, hook block and the load (a pallet of bricks)
    this.trolleyX = 10;
    A(new THREE.BoxGeometry(1.2, 0.5, 1.2), Mat.std('#3a3c40'), this.trolleyX, 33.8, -10);
    this.cable = A(new THREE.CylinderGeometry(0.025, 0.025, 1, 5), Mat.std('#2a2a2a', { metalness: 0.7, roughness: 0.4 }), this.trolleyX, 20, -10);
    this.load = new THREE.Group(); g.add(this.load);
    this._add(new THREE.BoxGeometry(0.5, 0.5, 0.5), Mat.std('#e8b91c'), 0, 2.15, 0, this.load);
    this._add(new THREE.BoxGeometry(1.3, 0.12, 1.1), Mat.std('#9c7a4a'), 0, 0.06, 0, this.load);
    for (let i = 0; i < 4; i++) this._add(new THREE.BoxGeometry(1.2, 0.18, 1.0), Mat.std(i % 2 ? '#a5432e' : '#b04a33', { roughness: 0.9 }), 0, 0.21 + i * 0.19, 0, this.load);
    for (const [x, z] of [[-0.6, -0.5], [0.6, -0.5], [-0.6, 0.5], [0.6, 0.5]]) this._add(new THREE.CylinderGeometry(0.012, 0.012, 1.4, 4), Mat.std('#2a2a2a'), x * 0.5, 1.4, z * 0.5, this.load, z * 0.4, 0, -x * 0.4);
    this.workers = [0, 1].map((i) => { const p = new Person({ id: 'worker' + i, look: 'worker' }, null); g.add(p.root); p.root.position.set(this.trolleyX - 3.5 + i * 6.5, 0, -6 - i * 2); p.root.rotation.y = i ? 2.4 : -0.6; return p; });
  }

  /* ---- 4. a waiter's tray: a slight tilt and the glasses slide off ---- */
  _grip() {
    const g = new THREE.Group(); g.position.set(760, 0, 330); this.root.add(g); this.gripG = g;
    const A = (geo, mat, x, y, z, rx, ry, rz) => this._add(geo, mat, x, y, z, g, rx, ry, rz);
    A(new THREE.BoxGeometry(14, 0.1, 10), Mat.std('#b9b0a2', { roughness: 0.8 }), 0, -0.05, 0);
    const wall = Tex.storefront(SHOPS[0], 901);
    A(new THREE.PlaneGeometry(8, 4.2), new THREE.MeshStandardMaterial({ map: wall.map, emissiveMap: wall.emissiveMap, emissive: '#ffffff', emissiveIntensity: 0.5, roughness: 1 }), 0, 2.1, -2.5);
    for (const x of [-2.7, 2.4]) { A(new THREE.CylinderGeometry(0.36, 0.36, 0.03, 16), Mat.std('#e4e0d6'), x, 0.74, -1.2); A(new THREE.CylinderGeometry(0.03, 0.03, 0.72, 6), Mat.std('#2c3034'), x, 0.37, -1.2); }
    this.waiter = new Person({ id: 'waiter', look: 'casual7' }, null); g.add(this.waiter.root);
    this.waiter.root.position.set(0, 0, 0); this.waiter.root.rotation.y = 0.15;
    this.tray = new THREE.Group(); g.add(this.tray);
    this._add(new THREE.CylinderGeometry(0.22, 0.22, 0.015, 24), Mat.std('#c9ced3', { roughness: 0.25, metalness: 0.8 }), 0, 0, 0, this.tray);
    const glass = new THREE.MeshStandardMaterial({ color: '#dfeef2', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.55, name: 'glassCup' });
    const wine = Mat.std('#7a1c2c', { roughness: 0.2 }), beer = Mat.std('#e2a530', { roughness: 0.2 });
    this.glasses = [[-0.1, -0.06, wine], [0.06, -0.1, beer], [0.11, 0.06, wine], [-0.04, 0.1, beer]].map(([x, z, liquid], i) => {
      const gg = new THREE.Group(); this.tray.add(gg); gg.position.set(x, 0.008, z);
      this._add(new THREE.CylinderGeometry(0.035, 0.03, 0.12, 12, 1, true), glass, 0, 0.06, 0, gg);
      this._add(new THREE.CylinderGeometry(0.032, 0.029, 0.07, 12), liquid, 0, 0.04, 0, gg);
      return { g: gg, x, z, t: 0.35 + i * 0.22 };
    });
  }

  /* ---- 5. an ambulance sliding sideways through a junction ---- */
  _ambulance() {
    const v = this.factory.build('van', '#f4f4f0');
    v.group.name = 'veh:ambulance';
    const stripe = this.factory.paint('#c62828');
    for (const sz of [-1, 1]) { const s = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.22, 0.02), stripe); s.position.set(-0.3, 1.05, sz * 1.02); v.body.add(s); }
    const cross = Tex.label([['+', 160]], { w: 128, h: 128, bg: '#f4f4f0', fg: '#c62828' });
    for (const sz of [-1, 1]) { const c = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.MeshStandardMaterial({ map: cross })); c.position.set(-1.2, 1.7, sz * 1.025); c.rotation.y = sz > 0 ? 0 : Math.PI; v.body.add(c); }
    this.lightR = new THREE.MeshBasicMaterial({ color: '#ff2a2a', toneMapped: false }); this.lightB = new THREE.MeshBasicMaterial({ color: '#2a6bff', toneMapped: false });
    for (const [z, m] of [[-0.45, this.lightR], [0.45, this.lightB]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.5), m); l.position.set(1.4, 2.5, z); v.body.add(l); }
    this.root.add(v.group);
    this.amb = v;
  }

  /* ---------------- per frame: pose the shot that's on, hide the rest ---------------- */
  update(t, camera) {
    const S = this.shotAt(t);
    this.root.visible = !!S;
    for (const k of ['conv', 'bikeG', 'craneG', 'gripG']) this[k].visible = false;
    this.amb.group.visible = false;
    this.glints.begin(); this.dust.begin(this.scene.fog);
    if (!S) { this.glints.end(); this.dust.end(); return null; }
    const u = t - S.t0, cam = {};
    if (S.id === 'conveyor') {
      this.conv.visible = true;
      this.beltTex.offset.y = -t * 1.4;                                              // the belt runs at ~0.55 m/s
      const P = basePose(); P.lSh = [1.3, 0.5]; P.rSh = [1.2, 0.6]; P.lEl = 1.4; P.rEl = 1.5; P.neck = 0.35; P.spine = 0.1; P.headYaw = -0.4 + 0.15 * Math.sin(u * 3);
      this.cashier.apply(P); this.cashier.root.updateMatrixWorld(true);
      Object.assign(cam, { x: 700 - 0.5, y: 1.62, z: 300 + 1.15, yaw: 8 + u * 3, pitch: -42, fov: 62 });
    } else if (S.id === 'bike') {
      this.bikeG.visible = true;
      // gliding west along the cross street at 5 m/s; it can't steer to stay up, so it leans over and goes down, still sliding
      const x0 = -40, z0 = -33.5, x = x0 - 5 * u, lean = Math.min(1.45, 0.15 + Math.max(0, u - 0.35) ** 2 * 1.6);
      this.bikeG.position.set(x, 0, z0); this.bikeG.rotation.set(0, Math.PI, 0);
      this.bike.rotation.set(lean, 0, 0);
      this.bike.children.forEach((m, i) => { if (i < 6 && m.geometry.type === 'TorusGeometry') m.rotation.z = -t * 34; });
      this.rider.root.position.set(-0.05, 0, 0);
      this.rider.root.rotation.set(lean, -Math.PI / 2, 0, 'YXZ');
      const P = ACTIONS.ride(0, { seed: 0.3 }), c = t * 13;
      P.hipY = 0.9; P.lHip = [1.0 + 0.45 * Math.sin(c), 0.12]; P.rHip = [1.0 - 0.45 * Math.sin(c), 0.12]; P.lKnee = 1.1 + 0.5 * Math.cos(c); P.rKnee = 1.1 - 0.5 * Math.cos(c);
      P.spine = 0.5; P.neck = -0.2; if (u > 0.7) { const k = Math.min(1, (u - 0.7) / 0.4); P.lSh = [1.25 + 0.8 * k, 0.22 + 0.6 * k]; P.headYaw = 0.6 * k; }
      this.rider.apply(P); this.rider.root.position.y = 0.0; this.rider.root.updateMatrixWorld(true);
      // (the camera stands on the corner and pans with it as it comes)
      Object.assign(cam, { x: -50.5, y: 1.25, z: -27.5, yaw: Math.atan2(-(x + 50.5), -(z0 + 27.5)) * 180 / Math.PI + 4, pitch: -7, fov: 58 });
    } else if (S.id === 'crane') {
      this.craneG.visible = true;
      // the brake lets go at 0.25 s: the load falls (≈ 0.8 g — the drum spins up too) and hits at ~1.4 s
      const yTop = 9.0, a = 8.0, uf = Math.max(0, u - 0.25), y = Math.max(0, yTop - 0.5 * a * uf * uf), hitU = 0.25 + Math.sqrt(2 * yTop / a);
      this.load.position.set(this.trolleyX, y, -10);
      this.load.rotation.set(0, 0.3 + uf * 0.4, u > hitU ? 0.08 : 0);
      const top = 33.6, bot = y + 2.4; this.cable.position.set(this.trolleyX, (top + bot) / 2, -10); this.cable.scale.y = top - bot;
      this.workers.forEach((w, i) => { const P = u > 0.55 ? ACTIONS.recoil(u - 0.55, { seed: i }) : ACTIONS.look(u, { seed: i, seedI: i }); w.apply(P); w.root.updateMatrixWorld(true); });
      if (u > hitU) for (let i = 0; i < 26; i++) { const h = hash1(i * 7 + 3), age = u - hitU, a2 = h * Math.PI * 2, r = (1 + 3 * hash1(i * 3)) * (1 - Math.exp(-age / 0.4)); this.dust.push(860 + this.trolleyX + Math.cos(a2) * r, 0.3 + age * 1.2 * hash1(i), 290 + Math.sin(a2) * r, 1 + age * 3, h * 6, 0.45 * Math.exp(-age / 0.8), 0.7, 0.84, 0.76, 0.64); }
      const shake = u > hitU ? Math.exp(-(u - hitU) / 0.25) : 0;
      Object.assign(cam, { x: 860 + this.trolleyX - 1, y: 1.6, z: 300 + 3.5, yaw: 6 + shake * Math.sin(u * 70) * 1.5, pitch: 38 - Math.min(1, uf / 1.1) * 30 + shake * Math.sin(u * 60) * 1.5, fov: 64 });
    } else if (S.id === 'grip') {
      this.gripG.visible = true;
      // the tray tilts a few degrees as he flinches; on a frictionless tray that's all it takes
      const tilt = 0.05 + 0.06 * Math.min(1, u / 0.6);
      const P = basePose(); P.rSh = [1.05, 0.15]; P.rEl = 1.35; P.lSh = [0.95 + 0.4 * Math.min(1, Math.max(0, u - 0.6) / 0.3), 0.3]; P.lEl = 0.9; P.neck = 0.3; P.spine = 0.05;
      this.waiter.apply(P); this.waiter.root.updateMatrixWorld(true);
      const hand = this.gripG.worldToLocal(this.waiter.handWorld(-1, new THREE.Vector3()));
      this.tray.position.copy(hand).add(new THREE.Vector3(0, 0.09, 0.1)); this.tray.rotation.set(tilt, 0, -tilt * 0.6);
      for (const gl of this.glasses) {
        const a = Math.max(0, u - gl.t * 0.6), slide = 0.5 * 9.81 * Math.sin(tilt) * a * a;
        let x = gl.x - slide * 0.5, z = gl.z + slide * 0.86, y = 0.008;
        const off = Math.hypot(x, z) > 0.21;
        if (off) { const tOff = gl.t * 0.6 + Math.sqrt(Math.max(0, (0.21 - Math.hypot(gl.x, gl.z)) * 2 / (9.81 * Math.sin(tilt)))); const fa = Math.max(0, u - tOff); y = 0.008 - 4.9 * fa * fa; }
        const wy = this.tray.position.y + y;
        gl.g.position.set(x, y, z); gl.g.visible = wy > 0.05;
        if (!gl.g.visible && !gl.hitU) gl.hitU = u;
        if (gl.hitU && u >= gl.hitU) { const age = u - gl.hitU; for (let i = 0; i < 12; i++) { const h1 = hash1(i * 13 + gl.x * 100), a2 = h1 * 6.28, sp = 0.8 + 1.5 * hash1(i * 5), tt = Math.min(age, 0.6), wp = this.gripG.localToWorld(new THREE.Vector3(x, 0, z)); const px = wp.x + Math.cos(a2) * sp * tt, pz = wp.z + Math.sin(a2) * sp * tt, py = Math.max(0.01, 0.4 * hash1(i * 7) * tt * 6 - 4.9 * tt * tt); this.glints.push(px, py, pz, px + 0.03, py + 0.01, pz + 0.02, 1, 1, 1, 0.9 * (1 - age / 1.2), 0.01); } }
      }
      if (u < 0.05) for (const gl of this.glasses) gl.hitU = 0;
      // (looking down at the tray over his shoulder)
      const tw = this.gripG.localToWorld(this.tray.position.clone()), cx = tw.x + 0.8, cy = tw.y + 0.42, cz = tw.z + 1.0;
      Object.assign(cam, { x: cx, y: cy, z: cz, yaw: Math.atan2(-(tw.x - cx), -(tw.z - cz)) * 180 / Math.PI, pitch: Math.atan2(tw.y - 0.15 - cy, Math.hypot(tw.x - cx, tw.z - cz)) * 180 / Math.PI, fov: 52 });
    } else if (S.id === 'ambulance') {
      this.amb.group.visible = true;
      const x = 76 - 8.5 * u, z = -28.8 + u * 0.4, yaw = 0.9 + u * 1.1, flash = Math.floor(t * 7) % 2;
      this.amb.group.position.set(x, 0, z); this.amb.group.rotation.y = yaw;
      for (const w of this.amb.wheels) w.rotation.z = -t * 12;
      this.lightR.color.set(flash ? '#ff3030' : '#3a0a0a'); this.lightB.color.set(flash ? '#0a1a3a' : '#3a7bff');
      Object.assign(cam, { x: 63.5, y: 1.5, z: -21.0, yaw: -72 + u * 22, pitch: -3, fov: 60 });   // (further down the street than the taxi that slid this way)
    }
    this.glints.end(); this.dust.end();
    return cam;
  }
}
