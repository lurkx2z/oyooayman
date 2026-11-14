/* =====================================================================
   YARD — the scrapyard on the north bank (layout.js, physics.js MGY): the crawler crane and its lifting magnet (with the
   car it was lifting at 10:42:00), the pile, the scrap around the yard, the skips, the old cars, the site office; the
   ball that forms on the magnet, its sparks and dust; at 10:42:10 the heap it falls into.
     mgBuildYard(S) → { update(s, cam, fx), magnet, crane, rings }
   Every piece is drawn where MGY.pos(body, s) puts it (a pure function of story time).
   ===================================================================== */

// a crumpled box (a crushed car body, a bent sheet): a segmented box with seeded dents
function mgCrumpleGeo(w, h, d, seed, amt = 0.12, seg = [4, 2, 3]) {
  const g = new THREE.BoxGeometry(w, h, d, seg[0], seg[1], seg[2]), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = hash2(Math.round(x * 13 + seed), Math.round(y * 17 + z * 11));
    p.setXYZ(i, x * (1 + amt * (k - 0.5)), y * (1 + 2 * amt * (hash2(Math.round(z * 9), Math.round(x * 7 + seed)) - 0.5)), z * (1 + amt * (k - 0.5))); }
  g.computeVertexNormals(); return g;
}
function mgIBeamGeo(L, h, w) {
  const s = new THREE.Shape(), t = 0.022, f = 0.026;
  s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, -h / 2 + f); s.lineTo(t / 2, -h / 2 + f); s.lineTo(t / 2, h / 2 - f); s.lineTo(w / 2, h / 2 - f); s.lineTo(w / 2, h / 2);
  s.lineTo(-w / 2, h / 2); s.lineTo(-w / 2, h / 2 - f); s.lineTo(-t / 2, h / 2 - f); s.lineTo(-t / 2, -h / 2 + f); s.lineTo(-w / 2, -h / 2 + f); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: L, bevelEnabled: false }); g.translate(0, 0, -L / 2); g.rotateY(Math.PI / 2); g.computeVertexNormals(); return g;
}

// a rust texture (tinted per instance)
function mgRustCanvas(seed, w = 256, h = 256) {
  const r = new RNG(seed);
  return mgCanvas(w, h, (g) => {
    g.fillStyle = '#b0a090'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) { const k = r.next(); g.fillStyle = k < 0.4 ? `rgba(120,60,30,${r.range(0.1, 0.4)})` : k < 0.7 ? `rgba(60,40,30,${r.range(0.1, 0.35)})` : `rgba(230,220,200,${r.range(0.05, 0.2)})`; g.beginPath(); g.arc(r.range(0, w), r.range(0, h), r.range(1, 7), 0, 7); g.fill(); }
  });
}

function mgBuildYard(S) {
  const scene = S.scene, F = MG_F, Y = MGY, P = MGP;
  const out = {};
  const rust = mgTex(mgRustCanvas(7));
  // ------------------------------------------------------------------ the crawler crane
  {
    const C = F.crane, yel = new THREE.MeshStandardMaterial({ color: '#d39a1c', roughness: 0.55, metalness: 0.2, map: rust }), dark = mgStd('#26282a', 0.8, 0.3);
    const g = new THREE.Group(); g.position.set(C.base[0], C.base[1], C.base[2]); g.rotation.y = C.yaw; scene.add(g);
    for (const sx of [-1.9, 1.9]) { mgBox(1.0, 1.15, 7.2, dark, sx, 0.58, 0, g); for (let z = -3.4; z <= 3.4; z += 0.35) mgBox(1.04, 0.06, 0.1, mgStd('#1a1a1a', 0.9), sx, 1.18, z, g); }
    mgBox(3.0, 0.8, 4.2, dark, 0, 1.4, 0, g);
    const up = new THREE.Group(); up.position.set(0, 1.8, 0); g.add(up);
    mgBox(3.4, 2.6, 6.2, yel, 0, 1.3, -0.4, up);                         // the machinery house
    mgBox(3.5, 1.9, 2.2, yel, 0, 0.95, -4.1, up);                        // the counterweight (north)
    const cab = mgBox(1.4, 2.0, 1.7, yel, -1.45, 1.1, 2.4, up);
    const glass = new THREE.MeshStandardMaterial({ color: '#1c2a32', roughness: 0.08, metalness: 0.3 });
    mgBox(1.42, 1.1, 0.04, glass, -1.45, 1.45, 3.26, up); mgBox(0.04, 1.0, 1.2, glass, -2.16, 1.45, 2.4, up);
    void cab;
    out.crane = { g, up, yel };
    // the boom: a lattice of four chords and the lacing between them, from its foot to its tip
    const A = new THREE.Vector3(...C.foot), Bt = new THREE.Vector3(...C.tip), ax = Bt.clone().sub(A), L = ax.length(); ax.normalize();
    const side = new THREE.Vector3().crossVectors(ax, new THREE.Vector3(0, 1, 0)).normalize(), upv = new THREE.Vector3().crossVectors(side, ax).normalize();
    const half = (u) => 0.32 + 0.42 * Math.sin(Math.PI * Math.min(1, Math.max(0, u)));
    const cornerAt = (u, i) => { const h = half(u), a = [[-1, -1], [1, -1], [1, 1], [-1, 1]][i]; return A.clone().addScaledVector(ax, L * u).addScaledVector(side, a[0] * h).addScaledVector(upv, a[1] * h); };
    const n = 34, struts = [];
    for (let i = 0; i < 4; i++) for (let k = 0; k < n; k++) struts.push([cornerAt(k / n, i), cornerAt((k + 1) / n, i), 0.075]);
    for (let k = 0; k < n; k++) for (let i = 0; i < 4; i++) { struts.push([cornerAt(k / n, i), cornerAt((k + 1) / n, (i + 1) % 4), 0.035]); struts.push([cornerAt(k / n, i), cornerAt(k / n, (i + 1) % 4), 0.03]); }
    const unit = new THREE.CylinderGeometry(1, 1, 1, 6); unit.translate(0, 0.5, 0);
    const im = new THREE.InstancedMesh(unit, yel, struts.length), dm = new THREE.Object3D();
    struts.forEach(([a, b, r], i) => { mgStrut(dm, [a.x, a.y, a.z], [b.x, b.y, b.z], r); dm.updateMatrix(); im.setMatrixAt(i, dm.matrix); });
    im.castShadow = true; im.receiveShadow = true; scene.add(im);
    // the A-frame and the pendant ropes to the tip; the tip's sheaves
    const af = new THREE.Vector3(C.base[0] + Math.sin(C.yaw) * -3.2, C.base[1] + 7.6, C.base[2] - Math.cos(C.yaw) * 3.2);
    const pend = new THREE.InstancedMesh(unit, mgStd('#2a2a2a', 0.6, 0.5), 4);
    [[-0.5, 0], [0.5, 0]].forEach(([sx], i) => { const a = af.clone().addScaledVector(side, sx), b = Bt.clone().addScaledVector(side, sx * 0.6); mgStrut(dm, [a.x, a.y, a.z], [b.x, b.y, b.z], 0.03); dm.updateMatrix(); pend.setMatrixAt(i, dm.matrix); });
    [[-1.2, 0], [1.2, 0]].forEach(([sx], i) => { const a = new THREE.Vector3(C.base[0], C.base[1] + 4.4, C.base[2]).addScaledVector(side, sx), b = af.clone().addScaledVector(side, sx * 0.4); mgStrut(dm, [a.x, a.y, a.z], [b.x, b.y, b.z], 0.12); dm.updateMatrix(); pend.setMatrixAt(2 + i, dm.matrix); });
    pend.castShadow = true; scene.add(pend);
    const sheave = mgCyl(0.55, 0.55, 0.3, dark, Bt.x, Bt.y - 0.2, Bt.z + 0.3); sheave.rotation.z = Math.PI / 2; sheave.rotation.y = -C.yaw;
    out.tip = [Bt.x, Bt.y - 0.75, Bt.z + 0.35];
  }
  // ------------------------------------------------------------------ the magnet, its chains and hook block, the rope
  {
    const mg = new THREE.Group(); scene.add(mg);
    const body = mgCyl(F.magR, F.magR, F.magH, mgStd('#2c2e30', 0.55, 0.55), 0, 0, 0, mg, 36);
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; const rib = mgBox(0.1, F.magH * 0.96, 0.08, mgStd('#3a3c3e', 0.5, 0.5), Math.cos(a) * F.magR, 0, Math.sin(a) * F.magR, mg); rib.rotation.y = -a; }
    mgCyl(0.42, 0.5, 0.14, mgStd('#e0b020', 0.5, 0.3), 0, F.magH / 2 + 0.07, 0, mg, 20);           // the junction box (yellow)
    const hook = mgBox(0.5, 0.75, 0.32, mgStd('#d0a020', 0.5, 0.4), 0, 1.75, 0, mg);
    const chainM = mgStd('#3a3a3a', 0.5, 0.7), unit = new THREE.CylinderGeometry(1, 1, 1, 5); unit.translate(0, 0.5, 0);
    for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2 + 0.5, m = new THREE.Mesh(unit, chainM); mgStrut(m, [Math.cos(a) * 0.7, F.magH / 2, Math.sin(a) * 0.7], [0, 1.45, 0], 0.035); m.castShadow = true; mg.add(m); }
    void body; void hook;
    // the car it was lifting (held flat under its face)
    const vf = new VehicleFactory(), car = vf.build('sedan', '#6a7078'); car.group.scale.setScalar(0.98); scene.add(car.group); car.h = new THREE.Box3().setFromObject(car.group).max.y;
    car.group.traverse((o) => { if (o.isMesh) { o.castShadow = true; if (o.material && o.material.color) { o.material = o.material.clone(); o.material.color.multiplyScalar(0.62); o.material.roughness = 0.8; } } });
    out.magnet = mg; out.liftCar = car;
    // the rope: 14 segments from the boom's tip to the hook (it parts at s = 0.012 and the broken end whips back up)
    const rope = []; for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(unit, mgStd('#d9cfb2', 0.75, 0.05)); m.castShadow = true; scene.add(m); rope.push(m); }
    out.rope = rope;
  }
  // ------------------------------------------------------------------ the pieces (instanced by kind; tinted; tumbling in flight)
  const kinds = [
    { g: mgCrumpleGeo(2.0, 0.5, 1.3, 3, 0.18), cols: ['#6a2a24', '#3a4a5a', '#7a7a74', '#4a5a3a', '#8a6a3a', '#2a2a2c', '#9a9690', '#5a3a5a'] },
    { g: mgIBeamGeo(3.0, 0.2, 0.18), cols: ['#5a3a28', '#6a4a30', '#4a3a30'] },
    { g: (() => { const g = new THREE.CylinderGeometry(0.1, 0.1, 2.4, 10, 1, true); g.rotateZ(Math.PI / 2); return g; })(), cols: ['#5a4030', '#6a6660', '#3a3a3c'] },
    { g: mgCrumpleGeo(1.4, 0.05, 1.0, 9, 0.5, [4, 1, 3]), cols: ['#7a5a40', '#8a8a84', '#4a4a50', '#6a3a26'] },
    { g: new THREE.CylinderGeometry(0.3, 0.3, 0.9, 14), cols: ['#2a4a7a', '#7a2a24', '#3a5a3a', '#5a4a3a'] },
    { g: (() => { const g = new THREE.TorusGeometry(0.24, 0.075, 8, 16); g.rotateX(Math.PI / 2); return g; })(), cols: ['#4a4a4c', '#6a5a4a', '#8a8a8a'] },
    { g: (() => { const g = new THREE.DodecahedronGeometry(0.24, 0); g.scale(1.2, 0.8, 1); return g; })(), cols: ['#5a4030', '#4a4440', '#6a5040'] },
    { g: (() => { const g = new THREE.BoxGeometry(3.6, 1.6, 1.8, 1, 1, 1); const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) < 0) p.setX(i, p.getX(i) * 0.72); g.computeVertexNormals(); return g; })(), cols: ['#d8a818', '#c84a1c', '#2a6a3a'] },
  ];
  const mats = kinds.map(() => new THREE.MeshStandardMaterial({ map: rust, roughness: 0.62, metalness: 0.45 }));
  const groups = kinds.map((k, i) => { const list = Y.bodies.filter((b) => b.kind === i && !b.onMag); const m = new THREE.InstancedMesh(k.g, mats[i], Math.max(1, list.length)); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; scene.add(m); return { m, list }; });
  const cc = new THREE.Color();
  groups.forEach((G, i) => G.list.forEach((b, j) => { const c = kinds[i].cols[Math.floor(hash1(b.seed * 3) * kinds[i].cols.length)]; cc.set(c).multiplyScalar(0.55 + 0.3 * hash1(b.seed * 7)); G.m.setColorAt(j, cc); }));
  groups.forEach((G) => { if (G.m.instanceColor) G.m.instanceColor.needsUpdate = true; });
  // each body's resting orientation (lying in the pile, or on the ground) and its tumbling axis
  for (const b of Y.bodies) {
    const r = mgRand(b.seed * 13 + 1), q = new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * (b.pile ? 1.2 : 0.2), b.yaw, (r() - 0.5) * (b.pile ? 1.2 : 0.2)));
    b.q0 = q; b.axis = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(); b.tumble = 0.9 + 1.6 * r();
  }
  // the old cars (vehicles.js), facing the ball (they roll straight at it)
  {
    const vf = new VehicleFactory(), cols = ['#8a2a22', '#d8d4cc', '#2a4a6a', '#4a5a3a', '#9a8a6a', '#5a5a60'];
    out.cars = Y.cars.map((b, i) => {
      const v = vf.build(i % 3 === 1 ? 'hatch' : 'sedan', cols[i]); scene.add(v.group);
      v.group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; if (o.material && o.material.color) { o.material = o.material.clone(); o.material.color.multiplyScalar(0.7); o.material.roughness = Math.max(0.6, o.material.roughness || 0.6); } } });
      const d = [F.ballC[0] - b.p0[0], F.ballC[2] - b.p0[2]];
      b.carYaw = Math.atan2(-d[1], d[0]);                   // (the car's nose, +x, towards the ball)
      return { b, v };
    });
  }
  // the site office (it stays put: too far, too heavy)
  {
    const O = F.office, m = mgStd('#4a6a7a', 0.6, 0.3), g = new THREE.Group(); g.position.set(O[0], O[1], O[2]); scene.add(g);
    mgBox(6.0, 2.6, 2.4, m, 0, 1.3 + 0.15, 0, g);
    for (const x of [-1.8, 1.4]) mgBox(1.2, 0.8, 0.04, new THREE.MeshStandardMaterial({ color: '#2a3438', roughness: 0.1, metalness: 0.2 }), x, 1.8, 1.21, g);
    mgBox(0.9, 2.0, 0.04, mgStd('#3a4a52', 0.6, 0.3), 0, 1.15, 1.21, g);
    mgBox(1.2, 0.3, 0.9, mgStd('#5a5a58', 0.8), 0, 0.15, 1.65, g);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.5), new THREE.MeshStandardMaterial({ map: mgTex(mgCanvas(520, 100, (gg, w, h) => { gg.fillStyle = '#f2f0ea'; gg.fillRect(0, 0, w, h); gg.fillStyle = '#c8281e'; gg.font = '800 50px Arial'; gg.fillText('METAL RECYCLING', 14, 68); }), { repeat: false }), roughness: 0.6 }));
    sign.position.set(0, 2.55, 1.23); g.add(sign);
  }
  // the ball's inside (between the pieces: dark, packed steel), and the heap it leaves at 10:42:10
  const core = mgMesh(new THREE.IcosahedronGeometry(1, 3), new THREE.MeshStandardMaterial({ color: '#3a2c22', map: rust, roughness: 0.85, metalness: 0.35 }), 0, 0, 0);
  core.geometry = (() => { const g = new THREE.IcosahedronGeometry(1, 3), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)), k = 1 + 0.07 * (hash2(Math.round(v.x * 9), Math.round(v.y * 9 + v.z * 5)) - 0.5); p.setXYZ(i, v.x * k, v.y * k, v.z * k); } g.computeVertexNormals(); return g; })();
  const heap = (() => {
    const R = Y.HEAP.R, n = 48, rings = 14, pos = [], idx = [];
    for (let j = 0; j <= rings; j++) for (let i = 0; i <= n; i++) { const u = j / rings, a = i / n * Math.PI * 2, d = R * u, x = Math.cos(a) * d, z = Math.sin(a) * d; const y = Y.HEAP.h * Math.max(0, 1 - Math.pow(u, 1.4)) * (1 + 0.12 * (hash2(i, j) - 0.5)) - 0.35; pos.push(x, y, z); }
    for (let j = 0; j < rings; j++) for (let i = 0; i < n; i++) { const a = j * (n + 1) + i, b = a + 1, c = a + n + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#4a3a2e', map: rust, roughness: 0.9, metalness: 0.2 })); m.receiveShadow = true; m.castShadow = true;
    m.position.set(F.ballC[0], F.wharf.top, F.ballC[2]); scene.add(m); return m;
  })();
  // after 10:42:10: a spanner that fell off the ball at the heap's edge, a little magnetised now: nails cling to its jaw
  const spanner = (() => {
    const g = new THREE.Group(), st = mgStd('#b9bcbf', 0.32, 0.85), nm = mgStd('#8d8f92', 0.4, 0.8);
    mgMesh(new THREE.BoxGeometry(0.2, 0.011, 0.026), st, 0, 0.0055, 0, g);
    const jaw = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.009, 6, 16, Math.PI * 1.35), st); jaw.rotation.set(-Math.PI / 2, 0, Math.PI * 0.82); jaw.position.set(0.118, 0.006, 0); g.add(jaw);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.019, 0.008, 6, 18), st); ring.rotation.x = -Math.PI / 2; ring.position.set(-0.112, 0.006, 0); g.add(ring);
    const nail = (x, y, z, rx, ry, rz) => { const n = new THREE.Group(); mgMesh(new THREE.CylinderGeometry(0.0016, 0.0012, 0.05, 5), nm, 0, 0.025, 0, n); mgMesh(new THREE.CylinderGeometry(0.0042, 0.0042, 0.0012, 8), nm, 0, 0.05, 0, n); n.position.set(x, y, z); n.rotation.set(rx, ry, rz); g.add(n); };
    // clinging to the jaw (each held at its point or along its side)
    [[0.14, 0.012, 0.012, 0.3, 0, -1.1], [0.146, 0.014, -0.006, -0.5, 0.4, -0.7], [0.128, 0.02, -0.02, -1.2, 0.2, 0.2], [0.135, 0.016, 0.026, 1.0, 0, -0.4], [0.15, 0.03, 0.004, 0.1, 0.9, -1.5]].forEach((q) => nail(...q));
    // lying loose on the ground nearby
    for (let i = 0; i < 7; i++) { const r = mgRand(i * 31 + 7); nail(-0.05 + 0.3 * r(), 0.002, -0.12 + 0.24 * r(), Math.PI / 2, r() * 6.28, 0); }
    g.position.set(8.4, F.wharf.top + 0.006, -21.7); g.rotation.y = 0.75; g.scale.setScalar(1.3); g.visible = false; scene.add(g); return g;
  })();
  // the reach of the magnet at 1 g, normally and now (rings on the ground; shown only in the 'reach' shot)
  const ringM = (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, fog: false });
  const rings = [[P.reach1, '#ffd7a8', 0.12], [P.reachK, '#ff6a4a', 0.28]].map(([r, c, w]) => { const m = new THREE.Mesh(new THREE.RingGeometry(r - w, r + w, 96), ringM(c)); m.rotation.x = -Math.PI / 2; m.position.set(F.ballC[0], F.wharf.top + 0.04, F.ballC[2]); m.renderOrder = 4; scene.add(m); return m; });
  out.rings = rings;

  const mt = new THREE.Matrix4(), qq = new THREE.Quaternion(), qa = new THREE.Quaternion(), pv = new THREE.Vector3(), sv = new THREE.Vector3(1, 1, 1), zero = new THREE.Vector3(0, 0, 0);
  out.update = (s, fx, o = {}) => {
    const M = Y.magAt(Math.min(s, P.T)), R = Y.R(Math.min(s, P.T - 1e-6));
    // the magnet (after 10:42:10 it lies under the heap)
    out.magnet.position.set(M[0], M[1], M[2]); out.magnet.visible = s < P.T + 0.6;
    // the car it was lifting: under its face
    { const b = Y.bodies.find((x) => x.onMag), p = Y.pos(b, s), cg = out.liftCar.group; cg.position.set(p[0], p[1] + 0.6 - out.liftCar.h - 0.03, p[2]); cg.rotation.set(0, 0.3, s > P.T ? Math.min(0.5, (s - P.T) * 0.8) : 0); cg.visible = true; }
    // the rope
    {
      const tip = out.tip, hookTop = [M[0], M[1] + 2.1, M[2]], S0 = Y.S0, n = out.rope.length;
      const pts = [];
      if (s < S0) for (let i = 0; i <= n; i++) pts.push(mgV(tip, hookTop, i / n));
      else {
        // the broken end flies back up past the tip, then falls and hangs swinging (14 m of rope)
        const u = s - S0, rec = 1 - Math.exp(-u / 0.05), sway = Math.exp(-u / 3) * Math.sin(u * 2.4);
        const snap = [tip[0] + (hookTop[0] - tip[0]) * 0.96, hookTop[1] + 1.5, tip[2] + (hookTop[2] - tip[2]) * 0.96];
        const hang = [tip[0] + 1.6 * sway, tip[1] - 13.5, tip[2] + 0.8 * sway];
        const up2 = [tip[0] + 2.5, tip[1] + 4, tip[2] + 1.2];
        const e = u < 0.18 ? mgV(snap, up2, Math.min(1, rec * 1.05)) : mgV(up2, hang, mgK(u, 0.18, 1.6, Ease.inOutSine));
        for (let i = 0; i <= n; i++) { const k = i / n, mid = mgV(tip, e, k), bow = Math.sin(Math.PI * k) * (u < 1.2 ? 1.2 * Math.exp(-u) : 0.2); pts.push([mid[0] + bow, mid[1] - bow * 0.4, mid[2] + bow * 0.5]); }
      }
      for (let i = 0; i < n; i++) mgStrut(out.rope[i], pts[i], pts[i + 1], 0.075);
    }
    // the pieces
    groups.forEach((G) => {
      G.list.forEach((b, j) => {
        const p = Y.pos(b, s), moved = Math.hypot(p[0] - b.p0[0], p[1] - b.p0[1], p[2] - b.p0[2]);
        let ang;
        if (b.firstHit != null && s >= b.firstHit && s < P.T) { const ph = Y.pos(b, b.firstHit - 1e-4); ang = Math.hypot(ph[0] - b.p0[0], ph[1] - b.p0[1], ph[2] - b.p0[2]); }
        else ang = moved;
        qa.setFromAxisAngle(b.axis, ang * b.tumble * 0.35); qq.copy(b.q0).premultiply(qa);
        pv.set(p[0], p[1], p[2]); mt.compose(pv, qq, sv); G.m.setMatrixAt(j, mt);
      });
      G.m.instanceMatrix.needsUpdate = true;
    });
    // the old cars
    for (const { b, v } of out.cars) {
      const p = Y.pos(b, s), g = v.group, lifted = p[1] - b.p0[1];
      g.position.set(p[0], p[1] - 0.72, p[2]);
      const flying = b.firstHit != null && s >= b.firstHit && s < P.T;
      if (flying) { const ph = Y.pos(b, b.firstHit - 1e-4); g.position.set(ph[0], ph[1] - 0.72, ph[2]); }
      let pitch = Math.min(0.9, Math.max(0, lifted) * 0.5);
      if (b.firstHit != null && s >= P.T && b.track2) pitch = 0.35 + 0.4 * Math.min(1, (s - P.T) * 0.8);
      g.rotation.set(0, b.carYaw, pitch, 'YXZ');
      if (v.wheels) for (const w of v.wheels) w.rotation.z = -Math.hypot(p[0] - b.p0[0], p[2] - b.p0[2]) / 0.31;
    }
    // the ball's inside
    const inball = s >= 0.025 && s < P.T;
    core.visible = s >= 0.025; if (inball) { const r = Math.max(0.6, R - 0.42); core.position.set(M[0], M[1], M[2]); core.scale.setScalar(r); core.rotation.set(0, 0, 0); }
    // at 10:42:10 the outside falls away; the middle (crushed, partly welded) drops as one lump onto the heap
    else if (s >= P.T) { const r = 0.6 * R, u = s - P.T, y1 = F.wharf.top + Y.HEAP.h * 0.75 + r * 0.55, y = Math.max(y1, M[1] - 4.9 * u * u);
      core.position.set(M[0] + 0.3 * Math.min(1, u * 2), y, M[2]); core.scale.set(r * 1.08, r * 0.86, r); core.rotation.set(0.12 * Math.min(1, u * 3), 0, -0.18 * Math.min(1, u * 3)); }
    spanner.visible = s > P.T + 0.5;
    // the heap: it grows as the ball lets go
    { const k = s < P.T ? 0 : mgK(s - P.T, 0.0, 0.9, Ease.outCubic); heap.visible = k > 0.002; heap.scale.set(0.55 + 0.45 * k, Math.max(0.01, k), 0.55 + 0.45 * k); }
    // reach rings
    for (const r of rings) r.visible = !!o.rings;
    if (o.rings) { rings[0].material.opacity = 0.95 * mgWin(o.ringT ?? 0, 0, 99, 0.6, 0.4); rings[1].material.opacity = 0.9 * MathX.smooth(o.ringT ?? 0, 2.0, 3.2); }
    // sparks and dust: each hit throws sparks (faster hits, more), each piece that leaves the ground raises dust
    if (fx) {
      for (const b of Y.bodies) {
        if (b.firstHit != null && b.vHit > 40) {
          const u = s - b.firstHit;
          if (u >= 0 && u < 0.06) {
            const hp = Y.pos(b, b.firstHit), n = Math.min(10, 2 + Math.floor(b.vHit / 30)), r = mgRand(b.seed * 5 + 3);
            for (let i = 0; i < n; i++) { const d = [r() - 0.5, r() - 0.3, r() - 0.5], sp = 6 + 20 * r(), a = 1 - u / 0.06; fx.sp.add(hp[0] + d[0] * sp * u, hp[1] + d[1] * sp * u - 4.9 * u * u, hp[2] + d[2] * sp * u, 0.05 + 0.05 * r(), 0.9 * a, 1.0, 0.75, 0.4); }
          }
        }
        if (b.pile || b.scatter) {
          const u = s - (b.scatter ? 0.02 : 0.0);
          if (u > 0 && u < 0.9 && (b.seed % 3 === 0)) { const r = mgRand(b.seed * 9 + 1), a = 0.22 * (1 - u / 0.9) * Math.min(1, u * 30); fx.du.add(b.p0[0] + (r() - 0.5) * 1.2, b.p0[1] - 0.2 + u * 1.2, b.p0[2] + (r() - 0.5) * 1.2, 0.5 + 1.6 * u, a, 0.55, 0.48, 0.4); }
        }
      }
      // the heap's dust at 10:42:10
      if (s > P.T && s < P.T + 3) { const u = s - P.T; for (let i = 0; i < 40; i++) { const r = mgRand(i * 17 + 5), a = 0.35 * Math.min(1, u * 3) * (1 - u / 3), d = 2 + 4 * r() * Math.min(1, u * 1.5), an = r() * 6.28; fx.du.add(F.ballC[0] + Math.cos(an) * d, F.wharf.top + 0.5 + 2.5 * r() * u, F.ballC[2] + Math.sin(an) * d, 1.2 + 2.5 * u, a, 0.5, 0.44, 0.38); } }
    }
    void zero;
  };
  return out;
}
