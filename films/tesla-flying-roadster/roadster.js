/* =====================================================================
   ROADSTER — the hero car, built from extruded side profiles (no logos, no third-party model): a low white two-seat
   wedge, a dark glass canopy, a front light bar, a red tail bar, big dark wheels. It carries the parts the film
   explains: two underbody fans (suction) and ten cold-gas nozzles (thrust), laid out as reported for the demo car:
   one at each corner (firing down), one on each front fender (firing sideways), four at the rear (firing back).
   The car's origin is the middle of its footprint on the ground; +x forward, +y up (its wheels' side is −y).
     trRoadster(scene)   → car: { root, body, wheels, nozzles[{p, d}], fans[], setXray(k), spin(t), lights(on) }
   ===================================================================== */

const TR_CAR = { L: 4.36, W: 1.98, r: 0.36, axles: [-1.38, 1.36] };

function trRoadster(scene) {
  const C = TR_CAR, root = new THREE.Group(), body = new THREE.Group();
  root.add(body); if (scene) scene.add(root);
  const paint = new THREE.MeshPhysicalMaterial({ color: '#eceef0', roughness: 0.28, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.1, transparent: false });
  const glass = new THREE.MeshPhysicalMaterial({ color: '#0e1318', roughness: 0.06, metalness: 0.6, clearcoat: 1, envMapIntensity: 1.6 });
  const trim = new THREE.MeshStandardMaterial({ color: '#15171a', roughness: 0.5, metalness: 0.2 });
  const carbon = new THREE.MeshStandardMaterial({ color: '#1d2024', roughness: 0.35, metalness: 0.4 });
  const head = new THREE.MeshStandardMaterial({ color: '#f6f8ff', emissive: new THREE.Color('#e8f0ff'), emissiveIntensity: 3.2, roughness: 0.2 });
  const tail = new THREE.MeshStandardMaterial({ color: '#4a0808', emissive: new THREE.Color('#ff1c10'), emissiveIntensity: 2.4, roughness: 0.3 });
  const tire = new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.92 });
  const rim = new THREE.MeshStandardMaterial({ color: '#2a2d31', roughness: 0.3, metalness: 0.85 });
  const brass = new THREE.MeshStandardMaterial({ color: '#4a4238', roughness: 0.35, metalness: 0.9 });
  const parts = { paint: [], glass: [], trim: [], carbon: [], head: [], tail: [] };
  const L2 = C.L / 2;

  // a side profile (x rear → front, y up) extruded across the width, then pinched: narrower at the nose and the tail,
  // and the upper body tucked in (tumblehome), so it reads as a sculpted car, not a slab
  function body3(pts, width, o = {}) {
    const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    if (o.arches) for (const ax of [C.axles[1], C.axles[0]]) { }   // (arches are cut below with wells)
    const bev = o.bevel ?? 0.07, depth = Math.max(0.02, width - bev * 2);
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bev, bevelSize: bev * 0.85, bevelSegments: 3, curveSegments: 10, steps: 1 });
    g.translate(0, 0, -depth / 2);
    const P = g.attributes.position;
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
      const nose = MathX.smooth(x, L2 - 1.2, L2), back = MathX.smooth(-x, L2 - 0.7, L2);
      let w = 1 - (o.noseK ?? 0.2) * nose - 0.1 * back - (o.tuck ?? 0.16) * MathX.smooth(y, o.tuckY0 ?? 0.62, o.tuckY1 ?? 1.15);
      P.setZ(i, z * w);
    }
    g.computeVertexNormals();
    return g;
  }
  // the body: long low nose, the cockpit set back, a short tail with a ducktail lip
  const top = [[-L2 + 0.02, 0.28], [-L2, 0.56], [-L2 + 0.05, 0.8], [-L2 + 0.32, 0.86], [-0.6, 0.95], [0.5, 0.86], [1.4, 0.72], [L2 - 0.35, 0.56], [L2, 0.4], [L2 - 0.08, 0.24]];
  const bottomArches = [];
  // close the profile along the floor, with wheel arches
  const prof = top.slice();
  const ra = C.r + 0.08, yb = 0.2;
  prof.push([C.axles[1] + ra + 0.03, yb]);
  for (let k = 0; k <= 10; k++) { const a = (k / 10) * Math.PI; prof.push([C.axles[1] + Math.cos(a) * ra, C.r + Math.sin(a) * ra * 0.92]); }
  prof.push([C.axles[0] + ra + 0.03, yb]);
  for (let k = 0; k <= 10; k++) { const a = (k / 10) * Math.PI; prof.push([C.axles[0] + Math.cos(a) * ra, C.r + Math.sin(a) * ra * 0.92]); }
  prof.push([-L2 + 0.05, yb]);
  parts.paint.push(body3(prof, C.W, { bevel: 0.09 }));
  // the canopy: a teardrop of dark glass from the windscreen to the tail
  const can = [[-1.55, 0.82], [-1.2, 1.02], [-0.5, 1.16], [0.1, 1.15], [0.75, 0.93], [1.05, 0.8], [-1.4, 0.8]];
  parts.glass.push(body3(can, C.W - 0.42, { bevel: 0.06, noseK: 0.05, tuck: 0.34, tuckY0: 0.85, tuckY1: 1.17 }));
  // a roof spine and A-pillars in body colour (the car has a fixed roof)
  const spineG = (body3([[-1.15, 1.08], [-0.5, 1.18], [0.1, 1.17], [0.45, 1.06], [0.45, 1.02], [0.1, 1.12], [-0.5, 1.13], [-1.15, 1.03]], 0.7, { bevel: 0.03, noseK: 0, tuck: 0.15, tuckY0: 1.0, tuckY1: 1.2 }));
  // side intakes, sills, a front splitter, a rear diffuser (carbon)
  const T = (g, x, y, z) => { g.translate(x, y, z); return g; };
  for (const sz of [-1, 1]) {
    parts.carbon.push(T(new THREE.BoxGeometry(1.7, 0.1, 0.06), 0, 0.27, sz * (C.W / 2 - 0.03)));
    parts.trim.push(T(new THREE.BoxGeometry(0.62, 0.2, 0.05), -0.62, 0.58, sz * (C.W / 2 - 0.1)));
  }
  parts.carbon.push(T(new THREE.BoxGeometry(0.5, 0.05, C.W - 0.3), L2 - 0.3, 0.22, 0));
  parts.carbon.push(T(new THREE.BoxGeometry(0.55, 0.14, C.W - 0.5), -L2 + 0.25, 0.26, 0));
  // the floor (where the fans are) and the wheel wells
  parts.trim.push(T(new THREE.BoxGeometry(C.L - 0.6, 0.06, C.W - 0.3), 0, 0.2, 0));
  for (const ax of C.axles) parts.trim.push(T(new THREE.BoxGeometry(ra * 2, C.r, C.W - 0.5), ax, C.r + 0.1, 0));
  // lights: a thin front bar, a full-width tail bar
  parts.head.push(T(new THREE.BoxGeometry(0.05, 0.03, C.W - 0.55), L2 - 0.13, 0.5, 0));
  for (const sz of [-1, 1]) parts.head.push(T(new THREE.BoxGeometry(0.16, 0.035, 0.32), L2 - 0.2, 0.5, sz * (C.W / 2 - 0.38)));
  parts.tail.push(T(new THREE.BoxGeometry(0.04, 0.045, C.W - 0.35), -L2 + 0.02, 0.72, 0));
  const matFor = { paint, glass, trim, carbon, head, tail };
  const meshes = {};
  for (const [k, geos] of Object.entries(parts)) {
    const mesh = new THREE.Mesh(THREE.mergeGeometries(geos.map((g) => Geo.prep(g)), false), matFor[k]);
    mesh.castShadow = k === 'paint' || k === 'glass'; mesh.receiveShadow = true; body.add(mesh); meshes[k] = mesh;
  }
  const spine = new THREE.Mesh(Geo.prep(spineG), paint); spine.castShadow = true; spine.receiveShadow = true; body.add(spine);
  // wheels: low-profile tyres on dark turbine rims (the rim is a separate disc so the spin reads)
  const wheels = [], tg = new THREE.CylinderGeometry(C.r, C.r, 0.3, 28); tg.rotateX(Math.PI / 2);
  const rg = new THREE.CylinderGeometry(C.r * 0.74, C.r * 0.74, 0.31, 12); rg.rotateX(Math.PI / 2);
  const sg = new THREE.BoxGeometry(C.r * 1.3, 0.05, 0.315);
  for (const ax of C.axles) for (const sz of [-1, 1]) {
    const w = new THREE.Group(); w.position.set(ax, C.r, sz * (C.W / 2 - 0.2)); body.add(w);
    const ty = new THREE.Mesh(tg, tire); ty.castShadow = true; w.add(ty);
    const ri = new THREE.Mesh(rg, rim); w.add(ri);
    for (let k = 0; k < 3; k++) { const sp = new THREE.Mesh(sg, brass); sp.rotation.z = k * Math.PI / 3; w.add(sp); }
    wheels.push(w);
  }
  // the fans: two discs in the floor, each a hub and seven blades in a dark shroud
  const fans = [];
  const shroudM = new THREE.MeshStandardMaterial({ color: '#2b3036', roughness: 0.4, metalness: 0.6 });
  const bladeM = new THREE.MeshStandardMaterial({ color: '#8aa0b4', roughness: 0.3, metalness: 0.7, emissive: new THREE.Color('#3a6a96'), emissiveIntensity: 0 });
  for (const fx of [0.55, -0.55]) {
    const f = new THREE.Group(); f.position.set(fx, 0.17, 0); body.add(f);
    const sh = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.045, 8, 28), shroudM); sh.rotation.x = Math.PI / 2; f.add(sh);
    const rot = new THREE.Group(); f.add(rot);
    rot.add(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 14), shroudM));
    for (let k = 0; k < 7; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.012, 0.1), bladeM); b.position.x = 0.19; b.rotation.x = 0.5; const p = new THREE.Group(); p.rotation.y = k * Math.PI * 2 / 7; p.add(b); rot.add(p); }
    f.visible = false; fans.push({ g: f, rot });
  }
  // the nozzles: dark bells with a bright throat that glows when they fire
  const nozzles = [];
  const bellM = new THREE.MeshStandardMaterial({ color: '#2a2c30', roughness: 0.35, metalness: 0.9 });
  const N = [
    // corners, firing down (lift, roll, the braking burst)
    [[1.55, 0.24, 0.78], [0, -1, 0], 'corner'], [[1.55, 0.24, -0.78], [0, -1, 0], 'corner'], [[-1.6, 0.24, 0.78], [0, -1, 0], 'corner'], [[-1.6, 0.24, -0.78], [0, -1, 0], 'corner'],
    // front fenders, firing sideways (yaw / roll trim)
    [[1.25, 0.6, 0.98], [0, 0, 1], 'fender'], [[1.25, 0.6, -0.98], [0, 0, -1], 'fender'],
    // four at the rear, firing back (the launch)
    [[-L2 - 0.02, 0.45, 0.32], [-1, 0, 0], 'rear'], [[-L2 - 0.02, 0.45, -0.32], [-1, 0, 0], 'rear'], [[-L2 - 0.02, 0.62, 0.62], [-1, 0, 0], 'rear'], [[-L2 - 0.02, 0.62, -0.62], [-1, 0, 0], 'rear'],
  ];
  for (const [p, d, kind] of N) {
    const glowM = new THREE.MeshStandardMaterial({ color: '#cfe6ff', emissive: new THREE.Color('#bfe2ff'), emissiveIntensity: 0, roughness: 0.3 });
    const g = new THREE.Group(); g.position.set(...p); body.add(g);
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.04, 0.09, 12, 1, true), bellM);
    const throat = new THREE.Mesh(new THREE.CircleGeometry(0.06, 12), glowM);
    const dir = new THREE.Vector3(...d);
    g.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
    bell.position.y = -0.02; throat.rotation.x = Math.PI / 2; throat.position.y = -0.05; g.add(bell, throat);
    nozzles.push({ p: new THREE.Vector3(...p), d: dir, kind, glowM, g });
  }
  // the cabin seen from the passenger seat (the last shot): a dash with a screen, the yoke, pillars, the roof edge
  const interior = new THREE.Group(); body.add(interior); interior.visible = false;
  {
    const dashM = new THREE.MeshStandardMaterial({ color: '#2b2d31', roughness: 0.6, emissive: new THREE.Color('#2a2118'), emissiveIntensity: 0.6 }), scr = new THREE.MeshStandardMaterial({ color: '#0a0f14', emissive: new THREE.Color('#5c8cc0'), emissiveIntensity: 0.9 });
    const add = (g, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); interior.add(o); return o; };
    // the dash sits above the body's top surface (the body is a solid shell), so it frames the windscreen
    add(new THREE.BoxGeometry(0.8, 0.12, 1.5), dashM, 0.5, 0.95, 0);
    add(new THREE.BoxGeometry(0.9, 0.2, 1.5), dashM, 0.5, 0.8, 0);
    add(new THREE.BoxGeometry(0.03, 0.12, 0.34), scr, 0.3, 1.04, 0.05, 0, 0, -0.45);
    add(new THREE.TorusGeometry(0.14, 0.024, 8, 24, Math.PI * 1.25), dashM, 0.18, 0.99, 0.38, 0, Math.PI / 2, -Math.PI * 0.12).rotation.order = 'YXZ';
    add(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8), dashM, 0.27, 0.97, 0.38, 0, 0, Math.PI / 2 - 0.35);
    // the A-pillars, the header over the windscreen, the door sills either side
    for (const sz of [-1, 1]) {
      add(new THREE.BoxGeometry(0.05, 0.42, 0.06), dashM, 0.62, 1.12, sz * 0.62, 0, 0, 0.9);
      add(new THREE.BoxGeometry(1.5, 0.06, 0.08), dashM, -0.25, 1.0, sz * 0.66);
    }
    add(new THREE.BoxGeometry(0.06, 0.03, 1.3), dashM, 0.78, 1.3, 0);
    // the cabin tub (covers the body's solid top between the seats) and a centre console
    add(new THREE.BoxGeometry(1.4, 0.06, 1.3), dashM, -0.6, 0.97, 0);
    add(new THREE.BoxGeometry(0.9, 0.12, 0.22), dashM, -0.25, 1.02, 0);
  }
  const xrayMats = [paint, glass];
  const car = {
    root, body, wheels, fans, nozzles, meshes, C, interior,
    // inside view: the glass and the roof spine hide, the cabin shows
    inside(on) { interior.visible = on; meshes.glass.visible = !on; spine.visible = !on; },
    // the body turns see-through (the fans and nozzles show): k 0…1
    setXray(k) {
      for (const m of xrayMats) { m.transparent = k > 0.001; m.opacity = 1 - 0.78 * k; m.depthWrite = k < 0.5; }
      meshes.paint.castShadow = k < 0.5;
      for (const f of fans) f.g.visible = k > 0.02;
    },
    // wheels roll with distance s (m); fans spin with their speed (turns per second × t)
    roll(s) { for (const w of wheels) w.rotation.z = -s / C.r; },
    fanSpin(phase, glow = 0) { for (const f of fans) f.rot.rotation.y = phase; bladeM.emissiveIntensity = glow; },
    // a nozzle firing (0…1): its throat glows
    fire(i, k) { nozzles[i].glowM.emissiveIntensity = 6 * k; },
    // world position / direction of nozzle i (after root.updateMatrixWorld)
    nozzleWorld(i, out = new THREE.Vector3(), dirOut = null) {
      out.copy(nozzles[i].p).applyMatrix4(root.matrixWorld);
      if (dirOut) dirOut.copy(nozzles[i].d).transformDirection(root.matrixWorld);
      return out;
    },
  };
  car.setXray(0);
  return car;
}

// place the car: a point on a surface, the direction of travel, the surface normal (the car's up), an extra roll
// about its own length (rad), plus an offset along its up
const _trQ = new THREE.Quaternion(), _trM = new THREE.Matrix4(), _trX = new THREE.Vector3(), _trY = new THREE.Vector3(), _trZ = new THREE.Vector3();
function trPlace(car, pos, fwd, up, roll = 0, lift = 0) {
  _trX.copy(fwd).normalize(); _trZ.crossVectors(_trX, up).normalize(); _trY.crossVectors(_trZ, _trX).normalize();
  _trM.makeBasis(_trX, _trY, _trZ);
  car.root.quaternion.setFromRotationMatrix(_trM);
  if (roll) car.root.quaternion.multiply(_trQ.setFromAxisAngle(new THREE.Vector3(1, 0, 0), roll));
  car.root.position.copy(pos).addScaledVector(_trY, lift);
  car.root.updateMatrixWorld(true);
}
