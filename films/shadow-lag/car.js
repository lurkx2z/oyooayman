/* =====================================================================
   CAR — your car (a small five-door hatchback, right-hand drive), the other parked cars, and the guard's white van.
   A car faces +z in its own frame; its right side is −x; the ground is y = 0. The cabin is pillars, a roof and glass
   that casts no shadow, so light comes through the windows (and so does the shape of whoever sits inside).
     shBuildCar(colour, o) → { g, door (the driver's door, hinged at its front edge), head, tail, seat, back, setLights }
     shBuildVan(colour)    → { g }
   ===================================================================== */

function shBuildCar(colour, o = {}) {
  const g = new THREE.Group(), W = 1.74, bev = 0.07;
  const paint = new THREE.MeshStandardMaterial({ color: colour, roughness: 0.32, metalness: 0.45 });
  const trim = shStd('#16181b', 0.6, 0.1), rubber = shStd('#121214', 0.85), inner = shStd('#2a2c30', 0.85), seatM = shStd(o.seat || '#33363b', 0.9);
  const chrome = shStd('#9aa0a6', 0.25, 0.9);
  // the lower body: a side profile (z forward, y up) extruded across the car, with the wheel arches cut out
  const prof = new THREE.Shape(), ax = 1.27, rA = 0.385;
  prof.moveTo(-2.0, 0.24);
  prof.lineTo(-ax - rA, 0.24); prof.absarc(-ax, 0.24, rA, Math.PI, 0, true);
  prof.lineTo(ax - rA, 0.24); prof.absarc(ax, 0.24, rA, Math.PI, 0, true);
  prof.lineTo(1.98, 0.24); prof.quadraticCurveTo(2.06, 0.3, 2.05, 0.5); prof.quadraticCurveTo(2.02, 0.66, 1.9, 0.72);
  prof.lineTo(0.98, 0.9); prof.lineTo(-1.92, 0.94); prof.quadraticCurveTo(-2.03, 0.9, -2.04, 0.7); prof.lineTo(-2.06, 0.36); prof.quadraticCurveTo(-2.05, 0.26, -2.0, 0.24);
  const body = new THREE.ExtrudeGeometry(prof, { depth: W - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 10 });
  body.rotateY(-Math.PI / 2); body.translate(W / 2 - bev, 0, 0); body.computeVertexNormals();
  shMesh(body, paint, 0, 0, 0, g);
  // the greenhouse: pillars and a roof (tumblehome: narrower at the top)
  const belt = 0.93, roofY = 1.42, xb = 0.8, xr = 0.68;
  const pil = (z0, y0, z1, y1, side, th = 0.07) => { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), paint); m.castShadow = m.receiveShadow = true; const a = [side * xb, y0, z0], b = [side * xr, y1, z1];
    const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length(); m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); m.scale.set(th, L, th * 1.4); g.add(m); return m; };
  for (const sd of [-1, 1]) { pil(0.97, belt, 0.16, roofY, sd, 0.075); pil(-0.38, belt, -0.38, roofY, sd, 0.1); pil(-1.88, belt + 0.02, -1.55, roofY, sd, 0.16); }
  const roof = shMesh(new THREE.BoxGeometry(2 * xr + 0.08, 0.06, 1.78), paint, 0, roofY + 0.01, -0.69, g);
  roof.castShadow = true;
  // the tailgate's top and the windscreen's foot (dark trim) and the glass (no shadow)
  shMesh(new THREE.BoxGeometry(2 * xr, 0.06, 0.08), paint, 0, roofY - 0.02, -1.58, g);
  const glass = new THREE.MeshStandardMaterial({ color: '#0e1418', roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.32, depthWrite: false });
  const pane = (pts) => { const ge = new THREE.BufferGeometry(); const v = []; for (const i of [0, 1, 2, 0, 2, 3]) v.push(...pts[i]); ge.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); ge.computeVertexNormals();
    const m = new THREE.Mesh(ge, glass); m.castShadow = false; m.receiveShadow = false; m.renderOrder = 2; m.material.side = THREE.DoubleSide; g.add(m); return m; };
  pane([[-xb + 0.04, belt + 0.01, 0.95], [xb - 0.04, belt + 0.01, 0.95], [xr - 0.03, roofY - 0.01, 0.17], [-xr + 0.03, roofY - 0.01, 0.17]]);   // windscreen
  pane([[-xb + 0.05, belt + 0.03, -1.88], [xb - 0.05, belt + 0.03, -1.88], [xr - 0.05, roofY - 0.04, -1.56], [-xr + 0.05, roofY - 0.04, -1.56]]);   // rear window
  for (const sd of [-1, 1]) for (const [z0, z1] of [[0.93, -0.35], [-0.42, -1.82]]) {
    const xs = sd * (xb - 0.015), xt = sd * (xr - 0.012);
    pane([[xs, belt + 0.02, z0], [xs, belt + 0.02, z1], [xt, roofY - 0.03, Math.max(z1 + 0.25, -1.56)], [xt, roofY - 0.03, Math.min(z0 - 0.8, 0.12)]]);
  }
  // bumpers, grille, lamps, plates (each a few cm proud of the body: nothing coplanar)
  shMesh(new THREE.BoxGeometry(W + 0.02, 0.16, 0.12), trim, 0, 0.36, 2.0, g);
  shMesh(new THREE.BoxGeometry(W + 0.02, 0.16, 0.12), trim, 0, 0.38, -2.02, g);
  shMesh(new THREE.BoxGeometry(0.9, 0.12, 0.04), shStd('#0c0d0f', 0.5), 0, 0.58, 2.035, g);
  const headM = new THREE.MeshStandardMaterial({ color: '#d8dde2', roughness: 0.2, emissive: '#fff4e0', emissiveIntensity: 0 });
  const tailM = new THREE.MeshStandardMaterial({ color: '#5a1012', roughness: 0.3, emissive: '#ff2016', emissiveIntensity: 0.0 });
  for (const sd of [-1, 1]) {
    shMesh(new THREE.BoxGeometry(0.34, 0.11, 0.06), headM, sd * 0.62, 0.66, 1.955, g).castShadow = false;
    shMesh(new THREE.BoxGeometry(0.12, 0.24, 0.06), tailM, sd * 0.76, 0.76, -2.03, g).castShadow = false;
  }
  const plate = (z, c, rot) => { const m = shMesh(new THREE.BoxGeometry(0.52, 0.12, 0.012), shStd(c, 0.5), 0, 0.42, z, g); m.rotation.y = rot; m.castShadow = false; return m; };
  plate(2.066, '#e8e6dc', 0); plate(-2.088, '#e2c43a', 0);
  // wheels
  for (const [x, z] of [[-0.74, ax], [0.74, ax], [-0.74, -ax], [0.74, -ax]]) {
    const w = new THREE.Group(); w.position.set(x, 0.31, z); g.add(w);
    const tyre = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.2, 22), rubber); tyre.rotation.z = Math.PI / 2; tyre.castShadow = true; w.add(tyre);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.205, 16), chrome); hub.rotation.z = Math.PI / 2; w.add(hub);
  }
  // inside: the dashboard, the wheel (right-hand drive), two front seats, the back bench
  shMesh(new THREE.BoxGeometry(1.5, 0.22, 0.42), inner, 0, 0.86, 0.72, g);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.025, 8, 24), trim); wheel.position.set(SH_SEAT.x, 0.98, 0.42); wheel.rotation.x = -0.45; wheel.castShadow = true; g.add(wheel);
  const seat = (x, z, back = false) => {
    const sg = new THREE.Group(); sg.position.set(x, 0, z); g.add(sg);
    const w2 = back ? 1.32 : 0.52;
    shMesh(new THREE.BoxGeometry(w2, 0.14, 0.5), seatM, 0, 0.36, 0.05, sg);
    const bk = shMesh(new THREE.BoxGeometry(w2, 0.62, 0.12), seatM, 0, 0.72, -0.22, sg); bk.rotation.x = -0.18;
    for (const hx of back ? [-0.4, 0.4] : [0]) { const h = shMesh(new THREE.BoxGeometry(0.26, 0.18, 0.1), seatM, hx, 1.14, -0.31, sg); h.rotation.x = -0.12; }
    return sg;
  };
  seat(SH_SEAT.x, SH_SEAT.z); seat(-SH_SEAT.x, SH_SEAT.z); seat(0, -1.12, true);
  // the driver's door: the lower door (a slab of the body's side) and its window frame, hinged at its front edge
  const door = new THREE.Group(); door.position.set(-W / 2 - 0.005, 0, 0.95); g.add(door);
  const dl = shMesh(new THREE.BoxGeometry(0.05, 0.58, 1.26), paint, -0.01, 0.62, -0.66, door); dl.castShadow = true;
  shMesh(new THREE.BoxGeometry(0.03, 0.04, 0.2), chrome, -0.045, 0.82, -1.12, door);
  // anchors: where you sit (and the back seat), for the people
  const seatA = new THREE.Object3D(); seatA.position.set(SH_SEAT.x, SH_SEAT.y, SH_SEAT.z); g.add(seatA);
  const backA = new THREE.Object3D(); backA.position.set(SH_BACKSEAT.x, SH_BACKSEAT.y, SH_BACKSEAT.z); g.add(backA);
  return {
    g, door, seat: seatA, back: backA, headM, tailM, wheel,
    setLights(head, tail) { headM.emissiveIntensity = 2.4 * head; tailM.emissiveIntensity = 1.6 * tail; },
  };
}

// the guard's van: a boxy white panel van, low roof (it fits under the beams), its long flat side a screen
function shBuildVan(colour = '#e9e8e2') {
  const g = new THREE.Group(), W = 2.0, L = 5.3, H = 1.98;
  const paint = new THREE.MeshStandardMaterial({ color: colour, roughness: 0.42, metalness: 0.15 });
  const trim = shStd('#1a1c1f', 0.6), rubber = shStd('#121214', 0.85);
  // the load box (flat sides) and the cab (a raked windscreen, a short bonnet)
  shMesh(shRoundBox(W, H - 0.32, 3.55, 0.08, 0.05), paint, 0, 0.32, -0.82, g);
  const cab = new THREE.Shape(); cab.moveTo(0.95, 0.32); cab.lineTo(2.62, 0.32); cab.quadraticCurveTo(2.68, 0.55, 2.62, 0.95); cab.lineTo(2.2, 1.05); cab.lineTo(1.35, H - 0.06); cab.lineTo(0.95, H - 0.06); cab.lineTo(0.95, 0.32);
  const cg = new THREE.ExtrudeGeometry(cab, { depth: W - 0.12, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 2, curveSegments: 6 });
  cg.rotateY(-Math.PI / 2); cg.translate(W / 2 - 0.06, 0, 0); cg.computeVertexNormals();
  shMesh(cg, paint, 0, 0, 0, g);
  // the windscreen and cab windows (dark glass, a few cm proud), bumpers, wheels, lamps
  const dark = shStd('#0c1014', 0.12, 0.3);
  const ws = shMesh(new THREE.BoxGeometry(W - 0.2, 0.86, 0.02), dark, 0, 1.47, 1.79, g); ws.rotation.x = -0.86; ws.position.z = 1.8; ws.castShadow = false;
  for (const sd of [-1, 1]) { const sw = shMesh(new THREE.BoxGeometry(0.02, 0.5, 0.62), dark, sd * (W / 2 + 0.07), 1.45, 1.22, g); sw.castShadow = false; }
  shMesh(new THREE.BoxGeometry(W + 0.04, 0.2, 0.14), trim, 0, 0.4, 2.62, g);
  shMesh(new THREE.BoxGeometry(W + 0.04, 0.2, 0.14), trim, 0, 0.4, -2.68, g);
  for (const [x, z] of [[-0.86, 1.95], [0.86, 1.95], [-0.86, -1.75], [0.86, -1.75]]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.22, 20), rubber); t.rotation.z = Math.PI / 2; t.position.set(x, 0.33, z); t.castShadow = true; g.add(t); }
  for (const sd of [-1, 1]) shMesh(new THREE.BoxGeometry(0.14, 0.3, 0.05), shStd('#6a1414', 0.3), sd * 0.86, 1.0, -2.63, g).castShadow = false;
  // rear doors' seam and handles (proud of the panel)
  shMesh(new THREE.BoxGeometry(0.02, 1.4, 0.02), trim, 0, 1.04, -2.61, g).castShadow = false;
  return { g };
}
