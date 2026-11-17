/* =====================================================================
   WORLD — the farm's scenery, built once (the set in farm.js adds what moves). Long things are built in short pieces
   (the renderer drops or mis-sorts kilometre-long triangles: picture pitfalls); flat overlays (the road, the drive)
   sit 4 cm or more over what's under them with a polygon offset (no z-fighting).
     sfTerrain   the ground to the horizon: one height field in tiles, finer near the farm (yard, lawn, soil, fields)
     sfRoad      the gravel county road, the drive, the mailbox; the power poles and their wires
     sfHouse     the white farmhouse (porch to the south, lit windows), the storm cellar
     sfBarn      the red gambrel barn (big doors, the hay loft door the bats use)
     sfYard      the windmill, the yard light, two grain bins, the pickup, the trees and the tyre swing
     sfHansen    the Hansen farm, 1.4 km west (its own yard light, house, barn, bins, trees)
     sfTown      the town 6 km south-east (the water tower and its red light, street lamps, the elevator)
   ===================================================================== */

function sfGridLines(a, b, bands) {
  const out = [a]; let x = a;
  while (x < b) { let step = bands[bands.length - 1][2]; for (const [lo, hi, st] of bands) if (x >= lo && x < hi) { step = st; break; } x = Math.min(b, x + step); out.push(x); }
  return out;
}
// what grows where (for the ground's colour): 'yard', 'lawn', 'corn', 'soy', 'road', 'far'
function sfGroundColor(x, z, out) {
  const F = SF_F, n = noise1(x * 0.07 + z * 0.05, 3), n2 = noise1(x * 0.011 - z * 0.013, 5);
  let c;
  if (Math.abs(z - F.road.z) < F.road.w / 2 + 0.4) c = [0.36, 0.33, 0.29];
  else if (sfIsCorn(x, z) && Math.hypot(x, z) < 1600) c = [0.17, 0.13, 0.09];                    // soil under the corn
  else if (Math.hypot(x, z) < 1600 && x > F.field.westX && z > -52 && x < 70 && z < F.road.z - 6) {
    const yard = (x > -6 && x < 46 && z > -24 && z < 24) || (Math.abs(x - F.drive.x) < 3 && z > 18);
    c = yard ? [0.33, 0.31, 0.27] : [0.17, 0.24, 0.1];                                              // gravel · mown grass
  } else if (Math.hypot(x, z) < 1600 && x >= 64 && z < F.road.z - 6) c = [0.13, 0.2, 0.08];       // soybeans east
  else {   // the plain: quarter sections of corn and beans, some pasture, darker shelterbelts at their edges
    const sx = Math.floor(x / 800), sz = Math.floor(z / 800), h = hash2(sx + 50, sz + 50);
    c = h < 0.5 ? [0.1, 0.16, 0.07] : h < 0.85 ? [0.15, 0.22, 0.09] : [0.2, 0.22, 0.12];
    const ex = Math.min(x - sx * 800, (sx + 1) * 800 - x), ez = Math.min(z - sz * 800, (sz + 1) * 800 - z);
    if (Math.min(ex, ez) < 14) c = [c[0] * 0.8, c[1] * 0.85, c[2] * 0.8];
  }
  const v = 0.9 + 0.12 * n + 0.08 * n2; out[0] = c[0] * v; out[1] = c[1] * v; out[2] = c[2] * v;
  return out;
}
function sfTerrain(set) {
  const bands = [[-170, 170, 6], [-900, 900, 20], [-3200, 3200, 50]].concat([[-1e9, 1e9, 100]]);
  const XS = sfGridLines(-9000, 9000, bands), ZS = sfGridLines(-12000, 8000, bands);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, envMapIntensity: 0.4 });
  const tiles = [], col = [0, 0, 0], T = 1500;
  for (let tx = -9000; tx < 9000; tx += T) for (let tz = -12000; tz < 8000; tz += T) {
    const xs = XS.filter((v) => v >= tx && v <= tx + T), zs = ZS.filter((v) => v >= tz && v <= tz + T);
    if (xs[0] > tx) xs.unshift(tx); if (zs[0] > tz) zs.unshift(tz);
    const nx = xs.length, nz = zs.length, pos = new Float32Array(nx * nz * 3), cl = new Float32Array(nx * nz * 3);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const x = xs[i], z = zs[j], k = j * nx + i; pos[k * 3] = x; pos[k * 3 + 1] = sfGroundY(x, z); pos[k * 3 + 2] = z;
      sfGroundColor(x, z, col); cl[k * 3] = col[0]; cl[k * 3 + 1] = col[1]; cl[k * 3 + 2] = col[2];
    }
    const idx = [];
    for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, e = c + 1; idx.push(a, c, b, b, c, e); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(cl, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.receiveShadow = true; set.scene.add(m); tiles.push(m);
  }
  return tiles;
}

// ---------------------------------------------------------------------------------------------------------------------
// THE ROAD, THE DRIVE, THE POWER LINE
// ---------------------------------------------------------------------------------------------------------------------
function sfStrip(set, pts, w, mat, lift = 0.05) {
  const pos = [], idx = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1, n = [-dz / L, dx / L];
    for (const sd of [-1, 1]) { const x = pts[i][0] + n[0] * sd * w / 2, z = pts[i][1] + n[1] * sd * w / 2; pos.push(x, sfGroundY(x, z) + lift, z); }
    if (i < pts.length - 1) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; set.scene.add(m); return m;
}
function sfRoad(set) {
  const F = SF_F, S = set.scene;
  const gravel = sfTex(sfCanvas(256, 256, (g) => { g.fillStyle = '#6e675d'; g.fillRect(0, 0, 256, 256); const r = new RNG(41); for (let i = 0; i < 5000; i++) { const v = r.range(70, 170); g.fillStyle = `rgba(${v},${v * 0.95},${v * 0.88},${r.range(0.2, 0.6)})`; g.fillRect(r.range(0, 256), r.range(0, 256), r.range(1, 3), r.range(1, 3)); } }));
  gravel.repeat.set(1, 1);
  const rm = new THREE.MeshStandardMaterial({ color: '#b3aa9c', map: gravel, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
  // the road: in 600 m pieces of 3 m steps (no long triangles), wheel tracks darker
  for (let x0 = -3000; x0 < 3000; x0 += 600) { const pts = []; for (let x = x0; x <= x0 + 600; x += 3) pts.push([x, F.road.z]); const m = sfStrip(set, pts, F.road.w, rm, 0.05); m.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(pts.flatMap((p) => [p[0] / 4, 0, p[0] / 4, F.road.w / 4]), 2)); }
  { const pts = []; for (let z = F.road.z - 3; z >= 14; z -= 2) pts.push([F.drive.x, z]); const m = sfStrip(set, pts, 4.2, rm, 0.06); m.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(pts.flatMap((p) => [0, p[1] / 4, 1, p[1] / 4]), 2)); }
  // the mailbox by the drive
  { const post = sfBox(0.1, 1.1, 0.1, sfStd('#5a4430', 0.9), F.drive.x + 3.0, 0.55, F.road.z - 4.6, S); const box = sfMesh(new THREE.CapsuleGeometry(0.12, 0.3, 4, 10), sfStd('#2a2c30', 0.5, 0.4), F.drive.x + 3.0, 1.2, F.road.z - 4.6, S); box.rotation.x = Math.PI / 2; void post; }
  // the power line: poles every 60 m on the north verge, three wires sagging between them (each span in 8 pieces)
  const pm = sfStd('#4a3a2c', 0.9), wm = new THREE.LineBasicMaterial({ color: '#0c0c0e' }), tops = [];
  for (const x of F.poles) {
    const y0 = sfGroundY(x, F.poleZ);
    sfCyl(0.13, 0.16, 10.5, pm, x, y0 + 5.25, F.poleZ, S, 7);
    sfBox(0.12, 0.12, 2.4, pm, x, y0 + 9.8, F.poleZ, S);
    for (const dz of [-1.05, 0, 1.05]) { tops.push([x, y0 + (dz ? 9.9 : 10.4), F.poleZ + dz]); sfCyl(0.04, 0.04, 0.14, sfStd('#6a7a6a', 0.3), x, y0 + (dz ? 9.94 : 10.44), F.poleZ + dz, S, 5); }
  }
  const pts = [];
  for (let i = 0; i + 3 < tops.length; i++) { const a = tops[i], b = tops[i + 3]; for (let k = 0; k < 8; k++) { const u0 = k / 8, u1 = (k + 1) / 8, sag = (u) => -0.9 * 4 * u * (1 - u); pts.push(a[0] + (b[0] - a[0]) * u0, a[1] + (b[1] - a[1]) * u0 + sag(u0), a[2], a[0] + (b[0] - a[0]) * u1, a[1] + (b[1] - a[1]) * u1 + sag(u1), a[2]); } }
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); const lines = new THREE.LineSegments(lg, wm); S.add(lines);
  // the farm's own line: from the road to the yard light pole and the house
  return { lines };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE FARMHOUSE: two storeys of white clapboard, a gabled roof (ridge east–west), a porch along the south front; some
// windows lit (the kitchen, the hall); a brick chimney. The storm cellar's sloping doors to the west.
// ---------------------------------------------------------------------------------------------------------------------
function sfClapboard(seed, base = '#e8e4da') {
  return sfTex(sfCanvas(256, 256, (g) => { g.fillStyle = base; g.fillRect(0, 0, 256, 256); const r = new RNG(seed);
    for (let y = 0; y < 256; y += 16) { g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(0, y + 13, 256, 3); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, y, 256, 2); for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(80,70,60,${r.range(0.02, 0.06)})`; g.fillRect(r.range(0, 256), y + 2, r.range(20, 80), 10); } } }));
}
function sfWindowMesh(parent, w, h, x, y, z, ry, lit, out) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  const trim = sfStd('#f4f2ec', 0.6);
  sfBox(w + 0.16, 0.08, 0.06, trim, 0, h / 2 + 0.04, 0.03, g); sfBox(w + 0.22, 0.07, 0.1, trim, 0, -h / 2 - 0.035, 0.05, g);
  sfBox(0.08, h, 0.06, trim, -w / 2 - 0.04, 0, 0.03, g); sfBox(0.08, h, 0.06, trim, w / 2 + 0.04, 0, 0.03, g);
  const glass = new THREE.MeshStandardMaterial({ color: lit ? '#3a2a18' : '#0e1216', roughness: 0.12, metalness: 0.2, emissive: lit ? '#ffb45c' : '#000', emissiveIntensity: lit ? 1.6 : 0 });
  const pane = sfMesh(new THREE.PlaneGeometry(w, h), glass, 0, 0, 0.005, g); pane.castShadow = false;
  sfBox(w, 0.04, 0.03, trim, 0, 0, 0.02, g); sfBox(0.04, h, 0.03, trim, 0, 0, 0.02, g);
  if (out) out.push(glass);
  return g;
}
function sfHouse(set) {
  const H = SF_F.house, S = set.scene, g = new THREE.Group(); g.position.set(H.x, 0, H.z); S.add(g);
  const cl = sfClapboard(11); cl.repeat.set(H.w / 3, H.eave / 3);
  const cl2 = sfClapboard(12); cl2.repeat.set(H.d / 3, H.eave / 3);
  const wallX = new THREE.MeshStandardMaterial({ color: '#ffffff', map: cl, roughness: 0.8 }), wallZ = new THREE.MeshStandardMaterial({ color: '#ffffff', map: cl2, roughness: 0.8 });
  const found = sfStd('#6a6258', 0.95);
  sfBox(H.w + 0.2, 0.6, H.d + 0.2, found, 0, 0.3, 0, g);
  const body = new THREE.Mesh(new THREE.BoxGeometry(H.w, H.eave - 0.6, H.d), [wallZ, wallZ, found, found, wallX, wallX]); body.position.y = 0.6 + (H.eave - 0.6) / 2; body.castShadow = body.receiveShadow = true; g.add(body);
  // gable ends (east and west): triangles up to the ridge
  const tri = new THREE.Shape(); tri.moveTo(-H.d / 2, 0); tri.lineTo(H.d / 2, 0); tri.lineTo(0, H.ridge - H.eave); tri.closePath();
  for (const sx of [-1, 1]) { const tg = new THREE.ShapeGeometry(tri); const m = new THREE.Mesh(tg, wallZ); m.position.set(sx * H.w / 2, H.eave, 0); m.rotation.y = sx * Math.PI / 2; m.castShadow = m.receiveShadow = true; g.add(m);
    const uv = tg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 3, uv.getY(i) / 3); }
  // the roof: two slabs with an overhang
  const roofM = sfStd('#3a3c40', 0.85), rh = H.ridge - H.eave, half = H.d / 2 + 0.5, slope = Math.atan2(rh, H.d / 2), len = Math.hypot(half, rh * half / (H.d / 2));
  for (const sz of [-1, 1]) { const r = sfBox(H.w + 0.7, 0.14, len, roofM, 0, H.eave + rh / 2 - 0.02 + 0.05, sz * (half / 2 - 0.25), g); r.rotation.x = sz * slope; }
  sfBox(0.7, 2.0, 0.7, new THREE.MeshStandardMaterial({ color: '#7a3a2a', map: sfTex(sfBrickCanvas(5, [130, 64, 48])), roughness: 0.9 }), H.w / 2 - 1.6, H.ridge - 0.2, -0.9, g);
  // windows: [face, along, y, lit]
  const lit = [];
  const front = H.d / 2 + 0.005, side = H.w / 2 + 0.005;
  for (const [x, y, L] of [[-3.6, 1.75, 1], [-1.6, 1.75, 0], [2.6, 1.75, 1], [-3.6, 4.3, 0], [-1.2, 4.3, 0], [1.2, 4.3, 1], [3.6, 4.3, 0]]) sfWindowMesh(g, 0.95, 1.5, x, y, front, 0, !!L, lit);
  for (const [x, y, L] of [[-3.0, 1.75, 1], [0.0, 1.75, 1], [3.0, 1.75, 0], [-1.6, 4.3, 0], [1.6, 4.3, 1]]) sfWindowMesh(g, 0.95, 1.5, x, y, -front, Math.PI, !!L, lit);
  for (const sx of [-1, 1]) for (const [z, y, L] of [[-1.8, 1.75, sx > 0 ? 1 : 0], [1.8, 1.75, 0], [0, 4.3, sx > 0 ? 0 : 1]]) sfWindowMesh(g, 0.95, 1.5, sx * side, y, z, sx * Math.PI / 2, !!L, lit);
  // the front door (a warm glass panel), the porch: deck, posts, roof, rail, steps; the porch light
  const door = sfBox(1.0, 2.1, 0.06, sfStd('#2a3a4a', 0.6), 0.4, 0.6 + 1.05, front + 0.02, g);
  const dl = sfWindowMesh(g, 0.4, 0.5, 0.4, 2.2, front + 0.06, 0, true, lit); void door; void dl;
  const P = H.porch, deck = sfStd('#8a8378', 0.85), white = sfStd('#f1efe8', 0.6);
  sfBox(H.w - 0.4, 0.15, P, deck, 0, 0.55, H.d / 2 + P / 2, g);
  for (const x of [-H.w / 2 + 0.4, -1.8, 1.8, H.w / 2 - 0.4]) sfBox(0.16, 2.55, 0.16, white, x, 0.62 + 1.28, H.d / 2 + P - 0.15, g);
  const pr = sfBox(H.w - 0.1, 0.12, P + 0.5, roofM, 0, 3.32, H.d / 2 + P / 2 + 0.1, g); pr.rotation.x = 0.12;
  for (const sx of [-1, 1]) { sfBox(H.w / 2 - 1.4, 0.06, 0.06, white, sx * (H.w / 4 + 0.55), 1.5, H.d / 2 + P - 0.15, g); for (let i = 0; i < 14; i++) sfBox(0.035, 0.85, 0.035, white, sx * (1.3 + i * 0.27), 1.05, H.d / 2 + P - 0.15, g); }
  for (let i = 0; i < 3; i++) sfBox(2.2, 0.16, 0.32, deck, 0, 0.45 - i * 0.17, H.d / 2 + P + 0.16 + i * 0.32, g);
  const pl = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 2.9, 1.6) })); pl.position.set(-0.6, 2.75, front + 0.12); g.add(pl);
  // the storm cellar: a low concrete box with two sloping steel doors
  const C = SF_F.cellar, cg = new THREE.Group(); cg.position.set(C.x, 0, C.z); S.add(cg);
  sfBox(2.6, 0.5, 2.8, sfStd('#8c8880', 0.95), 0, 0.25, 0, cg);
  for (const sx of [-1, 1]) { const d = sfBox(1.2, 0.06, 2.4, sfStd('#5a6a5a', 0.5, 0.5), sx * 0.62, 0.62, 0, cg); d.rotation.z = -sx * 0.22; }
  return { g, lit, porchLight: [H.x - 0.6, 2.75, H.z + front + 0.12] };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE BARN: red board-and-batten walls, a gambrel roof (eave 5.6 m, knee 9.4 m, ridge 12.4 m), white trim; on the south
// gable the big sliding doors (an X on each) and, high up, the open hay loft door under its hood
// ---------------------------------------------------------------------------------------------------------------------
function sfBarn(set) {
  const B = SF_F.barn, S = set.scene, g = new THREE.Group(); g.position.set(B.x, 0, B.z); S.add(g);
  const boards = sfTex(sfCanvas(256, 256, (gc) => { gc.fillStyle = '#8e2a20'; gc.fillRect(0, 0, 256, 256); const r = new RNG(9); for (let x = 0; x < 256; x += 32) { gc.fillStyle = 'rgba(0,0,0,0.25)'; gc.fillRect(x, 0, 4, 256); gc.fillStyle = `rgba(255,220,200,${r.range(0.02, 0.07)})`; gc.fillRect(x + 6, 0, 22, 256); }
    for (let i = 0; i < 400; i++) { gc.fillStyle = `rgba(40,10,5,${r.range(0.03, 0.1)})`; gc.fillRect(r.range(0, 256), r.range(0, 256), r.range(2, 6), r.range(10, 60)); } }));
  const red = new THREE.MeshStandardMaterial({ color: '#ffffff', map: boards, roughness: 0.85 }), white = sfStd('#ece8de', 0.7), roofM = sfStd('#5c5f63', 0.55, 0.45, { side: THREE.DoubleSide });
  const hw = B.w / 2, kx = 5.2;   // the knee's half-width
  const prof = [[-hw, 0], [hw, 0], [hw, B.eave], [kx, B.knee], [0, B.ridge], [-kx, B.knee], [-hw, B.eave]];
  // the long walls (east and west)
  boards.repeat.set(B.d / 4, B.eave / 4);
  for (const sx of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(B.d, B.eave), red); w.position.set(sx * hw, B.eave / 2, 0); w.rotation.y = sx * Math.PI / 2; w.castShadow = w.receiveShadow = true; g.add(w); }
  // the gables: the profile as a shape, with the big door opening and the loft door cut out on the south
  const bm2 = red.clone(); bm2.map = boards.clone(); bm2.map.repeat.set(1 / 4, 1 / 4); bm2.map.needsUpdate = true;
  for (const sz of [-1, 1]) {
    const sh = new THREE.Shape(prof.map(([x, y]) => new THREE.Vector2(x, y)));
    if (sz > 0) { const ld = new THREE.Path(); ld.moveTo(-1.1, B.ridge - 4.2); ld.lineTo(1.1, B.ridge - 4.2); ld.lineTo(1.1, B.ridge - 2.0); ld.lineTo(-1.1, B.ridge - 2.0); ld.closePath(); sh.holes.push(ld); }
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), bm2); m.position.z = sz * B.d / 2; if (sz < 0) m.rotation.y = Math.PI; m.castShadow = m.receiveShadow = true; g.add(m);
  }
  // inside the loft door: dark hay, a beam
  sfBox(2.2, 2.2, 0.1, sfStd('#140d08', 1.0), 0, B.ridge - 3.1, B.d / 2 - 1.2, g);
  sfBox(0.2, 0.2, 2.6, sfStd('#3a2a1a', 0.9), 0, B.ridge - 1.4, B.d / 2 + 0.6, g);   // the hay hood's beam
  { const hood = new THREE.Shape(); hood.moveTo(-1.5, 0); hood.lineTo(1.5, 0); hood.lineTo(0, 1.0); hood.closePath(); const hg = new THREE.ExtrudeGeometry(hood, { depth: 1.6, bevelEnabled: false }); const hm = new THREE.Mesh(hg, roofM); hm.position.set(0, B.ridge - 1.35, B.d / 2 - 0.2); hm.castShadow = true; g.add(hm); }
  // trim: the gable's edges, the doors with their X braces, the corner boards
  const T = (a, b, w = 0.18) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy); const m = sfBox(L, w, 0.08, white, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, B.d / 2 + 0.04, g); m.rotation.z = Math.atan2(dy, dx); return m; };
  for (let i = 2; i < prof.length; i++) T(prof[i], prof[(i + 1) % prof.length === 0 ? 0 : (i + 1) % prof.length]);
  for (const sx of [-1, 1]) {
    const x0 = sx * 0.05, x1 = sx * 2.6, y0 = 0.05, y1 = 4.2; T([x0, y0], [x1, y0]); T([x0, y1], [x1, y1]); T([x0, y0], [x0, y1]); T([x1, y0], [x1, y1]); T([x0, y0], [x1, y1], 0.14); T([x0, y1], [x1, y0], 0.14);
  }
  for (const [a, b] of [[[-1.1, B.ridge - 4.2], [1.1, B.ridge - 4.2]], [[-1.1, B.ridge - 4.2], [-1.1, B.ridge - 2.0]], [[1.1, B.ridge - 4.2], [1.1, B.ridge - 2.0]], [[-1.1, B.ridge - 2.0], [1.1, B.ridge - 2.0]]]) T(a, b, 0.14);
  for (const sx of [-1, 1]) sfBox(0.2, B.eave, 0.2, white, sx * (hw + 0.02), B.eave / 2, B.d / 2 + 0.02, g);
  // the roof: four planes along the length (lower and upper slopes), with a small overhang
  for (const sx of [-1, 1]) for (const [a, b] of [[[hw + 0.4, B.eave - 0.25], [kx, B.knee]], [[kx, B.knee], [0, B.ridge]]]) {
    const L = Math.hypot(a[0] - b[0], a[1] - b[1]), r = new THREE.Mesh(new THREE.BoxGeometry(L, 0.1, B.d + 0.6), roofM);
    r.position.set(sx * (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 0.06, 0); r.rotation.z = sx * Math.atan2(b[1] - a[1], b[0] - a[0]) * -1 + (sx < 0 ? 0 : 0); if (sx < 0) r.rotation.z = -r.rotation.z;
    r.rotation.z = Math.atan2(b[1] - a[1], sx * (b[0] - a[0])); r.castShadow = r.receiveShadow = true; g.add(r);
  }
  // a lamp over the big doors
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.6, 1.8) })); lamp.position.set(0, 4.9, B.d / 2 + 0.35); g.add(lamp);
  return { g, door: [B.x, B.ridge - 3.1, B.z + B.d / 2], lamp: [B.x, 4.9, B.z + B.d / 2 + 0.35] };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE YARD: the windmill (it turns into the wind), the yard light (a 9 m pole and its lamp), the grain bins, the
// pickup, the trees (a windbreak of spruce to the north-west, maples round the house, the tyre swing)
// ---------------------------------------------------------------------------------------------------------------------
function sfYard(set) {
  const F = SF_F, S = set.scene, out = {};
  // the windmill: four galvanised legs tapering to the head, girts and braces; the wheel and the tail vane
  { const W = F.windmill, g = new THREE.Group(); g.position.set(W.x, 0, W.z); S.add(g);
    const gm = sfStd('#8a8e92', 0.45, 0.7), b0 = 1.6, b1 = 0.32, H = W.h, leg = (sx, sz, y) => [sx * MathX.lerp(b0, b1, y / H), y, sz * MathX.lerp(b0, b1, y / H)];
    const U6 = new THREE.CylinderGeometry(1, 1, 1, 6).translate(0, 0.5, 0), U4 = new THREE.CylinderGeometry(1, 1, 1, 4).translate(0, 0.5, 0);
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) sfStrut(sfMesh(U6, gm, 0, 0, 0, g), leg(sx, sz, 0), leg(sx, sz, H + 0.05), 0.075);
    for (let k = 1; k < 7; k++) { const y = H * k / 7, y2 = H * (k - 1) / 7; for (const [a, b] of [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]]) {
      sfStrut(sfMesh(U6, gm, 0, 0, 0, g), leg(a[0], a[1], y), leg(b[0], b[1], y), 0.042);
      sfStrut(sfMesh(U4, gm, 0, 0, 0, g), leg(a[0], a[1], y2), leg(b[0], b[1], y), 0.026); } }
    const head = new THREE.Group(); head.position.y = H + 0.2; g.add(head);
    sfBox(0.3, 0.3, 0.9, gm, 0, 0, 0, head);
    const wheel = new THREE.Group(); wheel.position.set(0, 0, 0.6); head.add(wheel);
    const bm = sfStd('#b4b8bc', 0.5, 0.6, { side: THREE.DoubleSide });
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, bl = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 1.5), bm); bl.position.set(Math.cos(a) * 1.35, Math.sin(a) * 1.35, 0); bl.rotation.set(0, 0.5, a - Math.PI / 2); bl.castShadow = true; wheel.add(bl); }
    for (const r of [0.6, 2.05]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.025, 4, 36), gm); wheel.add(ring); }
    const vane = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.1, 1.7), sfStd('#c8ccd0', 0.5, 0.5)); vane.position.set(0, 0.2, -2.0); head.add(vane); vane.castShadow = true;
    sfBox(0.06, 0.06, 1.5, gm, 0, 0, -1.1, head);
    out.windmill = { g, head, wheel };
  }
  // the yard light: a creosoted pole, a short arm, the cobra-head lamp (its lens glows)
  { const L = F.yardLight, g = new THREE.Group(); g.position.set(L.x, 0, L.z); S.add(g);
    sfCyl(0.12, 0.15, L.h + 0.6, sfStd('#3a2c22', 0.9), 0, (L.h + 0.6) / 2, 0, g, 8);
    const arm = sfBox(0.08, 0.08, 1.4, sfStd('#9a9ea2', 0.4, 0.6), 0, L.h - 0.15, 0.65, g);
    const head = sfMesh(new THREE.CapsuleGeometry(0.16, 0.42, 4, 10), sfStd('#a8acb0', 0.4, 0.5), 0, L.h - 0.22, 1.4, g); head.rotation.x = Math.PI / 2;
    const lensM = new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 4.2, 2.2) });
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.15, 16), lensM); lens.rotation.x = Math.PI / 2; lens.position.set(0, L.h - 0.39, 1.45); g.add(lens);
    void arm; out.yardLight = { g, lensM, head, lamp: [L.x, L.h - 0.4, L.z + 1.45] };
  }
  // the grain bins: corrugated steel, a cone roof, a ladder
  { const corr = sfTex(sfCanvas(64, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 16); for (let y = 0; y < 256; y += 16) { g.fillStyle = 'rgba(255,255,255,0.0)'; } g.fillStyle = '#9ca0a4'; g.fillRect(0, 0, 64, 256); for (let y = 0; y < 256; y += 8) { g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, y, 64, 3); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, y + 4, 64, 2); } void gr; }));
    for (const [x, z, r, h] of F.bins) {
      const t = corr.clone(); t.needsUpdate = true; t.repeat.set(Math.round(r * 3), h / 1.2);
      const m = new THREE.MeshStandardMaterial({ color: '#ffffff', map: t, roughness: 0.4, metalness: 0.65 });
      sfCyl(r, r, h, m, x, h / 2, z, S, 40);
      sfMesh(new THREE.ConeGeometry(r + 0.15, r * 0.55, 40), sfStd('#a4a8ac', 0.4, 0.65), x, h + r * 0.275, z, S);
      sfCyl(0.35, 0.35, 0.5, sfStd('#a4a8ac', 0.4, 0.65), x, h + r * 0.55 + 0.2, z, S, 12);
      for (const dx of [-0.22, 0.22]) sfBox(0.04, h, 0.04, sfStd('#6a6e72', 0.5, 0.6), x - r - 0.18, h / 2, z + dx, S);
    }
  }
  // the pickup
  { const VF = new VehicleFactory(), v = VF.build('pickup', '#6e1c18'), g = new THREE.Group(); g.position.set(F.pickup.x, 0.02, F.pickup.z); g.rotation.y = F.pickup.yaw; g.add(v.group); S.add(g); out.pickup = { g, v }; }
  // trees: [x, z, height, kind] (kind 0 maple, 1 spruce)
  const trees = [[-26, 18, 13, 0], [-2, 2, 11, 0], [-6, 32, 10, 0], [12, 36, 9, 0], [42, 28, 11, 0], [-30, 40, 11, 0]];
  for (let i = 0; i < 10; i++) trees.push([6 + i * 3.8, -38 - (i % 2) * 2.4, 9 + (i % 3), 1]);   // the windbreak, north of the barn
  const trunk = sfStd('#3a2e24', 0.95), leafM = sfStd('#2f4a22', 0.9), spruceM = sfStd('#1e3020', 0.9);
  out.crowns = [];
  trees.forEach(([x, z, h, k], i) => {
    if (sfIsCorn(x, z)) return;
    const g = new THREE.Group(); g.position.set(x, sfGroundY(x, z), z); S.add(g);
    sfCyl(0.18 + h * 0.012, 0.28 + h * 0.018, h * 0.55, trunk, 0, h * 0.275, 0, g, 8);
    const crown = new THREE.Group(); crown.position.y = h * 0.45; g.add(crown);
    if (k === 0) { for (let j = 0; j < 4; j++) { const r = h * (0.24 + 0.06 * sfR(i, j)); const b = sfMesh(sfBlobGeo(r, i * 7 + j), leafM, (sfR(i, j + 5) - 0.5) * h * 0.3, h * (0.25 + 0.2 * sfR(i, j + 9)), (sfR(i, j + 13) - 0.5) * h * 0.3, crown); b.castShadow = true; } }
    else { for (let j = 0; j < 4; j++) sfMesh(new THREE.ConeGeometry(h * (0.22 - j * 0.04), h * 0.36, 9), spruceM, 0, h * (0.05 + j * 0.16), 0, crown); }
    out.crowns.push({ crown, i, h, k });
  });
  // the tyre swing on the big maple by the house
  { const T = trees[0], g = new THREE.Group(); g.position.set(T[0] + 2.4, T[2] * 0.62, T[1] + 0.5); S.add(g);
    const rope = sfMesh(new THREE.CylinderGeometry(0.015, 0.015, T[2] * 0.62 - 0.8, 5), sfStd('#b8a888', 0.9), 0, -(T[2] * 0.62 - 0.8) / 2, 0, g);
    const tyre = sfMesh(new THREE.TorusGeometry(0.32, 0.11, 8, 18), sfStd('#141414', 0.85), 0, -(T[2] * 0.62 - 0.8) - 0.1, 0, g); tyre.rotation.x = Math.PI / 2 * 0.0;
    void rope; out.swing = g; }
  // a white board fence along the lawn's south edge
  { const fm = sfStd('#e6e2d8', 0.7); for (let x = -36; x < -4; x += 2.4) { sfBox(0.1, 1.2, 0.1, fm, x, 0.6, 38, S); sfBox(2.4, 0.14, 0.04, fm, x + 1.2, 1.0, 38, S); sfBox(2.4, 0.14, 0.04, fm, x + 1.2, 0.55, 38, S); } }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// THE HANSEN FARM (1.4 km west, on the tornado's track): a house, a barn, two bins, a yard light, trees. Each roof and
// wall is its own piece, so the tornado can take them (farm.js).
// ---------------------------------------------------------------------------------------------------------------------
function sfHansen(set) {
  const Q = SF_PLACES.hansen, S = set.scene, g = new THREE.Group(); g.position.set(Q[0], sfGroundY(Q[0], Q[1]), Q[1]); S.add(g);
  const parts = [];
  const add = (m) => { parts.push({ m, p0: m.position.clone(), r0: m.rotation.clone(), seed: parts.length }); return m; };
  const wall = sfStd('#d8d4ca', 0.85), red = sfStd('#7a2a20', 0.85), roof = sfStd('#3a3c40', 0.8), steel = sfStd('#9ca0a4', 0.4, 0.6);
  add(sfBox(9, 5, 7, wall, -10, 2.5, 6, g)); add(sfBox(9.6, 0.3, 7.8, roof, -10, 5.6, 6, g));
  const win = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.6, 0.8) });
  for (const x of [-12.5, -8]) { const w = sfMesh(new THREE.PlaneGeometry(0.9, 1.2), win, x, 2.2, 9.52, g); w.castShadow = false; add(w); }
  add(sfBox(14, 6, 22, red, 14, 3, -8, g)); add(sfBox(15, 0.4, 23, roof, 14, 6.6, -8, g)); add(sfBox(10, 0.4, 23, roof, 14, 8.4, -8, g));
  for (const [x, z, r, h] of [[30, 6, 4, 7], [30, 16, 3.5, 6]]) { add(sfCyl(r, r, h, steel, x, h / 2, z, g, 24)); add(sfMesh(new THREE.ConeGeometry(r + 0.1, r * 0.5, 24), steel, x, h + r * 0.25, z, g)); }
  add(sfCyl(0.12, 0.14, 9, sfStd('#3a2c22', 0.9), 4, 4.5, 4, g, 6));
  const lampM = new THREE.MeshBasicMaterial({ color: new THREE.Color(8, 5.5, 2.8) }), lamp = add(sfMesh(new THREE.SphereGeometry(0.35, 10, 8), lampM, 4, 8.8, 4.8, g));
  for (let i = 0; i < 8; i++) { const t = sfMesh(sfBlobGeo(4 + 2 * sfR(i, 61), i + 61), sfStd('#22341c', 0.9), -24 + i * 4, 6, -16 - 3 * sfR(i, 62), g); add(t); }
  return { g, parts, lamp, lampM, win, at: Q };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE TOWN (6 km south-east): the water tower (a red light on top), the grain elevator, street lamps and windows (lights
// only, drawn by farm.js as glows), the siren on its pole
// ---------------------------------------------------------------------------------------------------------------------
function sfTown(set) {
  const [tx, tz] = SF_F.town, S = set.scene, y0 = sfGroundY(tx, tz), m = sfStd('#8e9296', 0.5, 0.4);
  const g = new THREE.Group(); g.position.set(tx, y0, tz); S.add(g);
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) sfCyl(0.4, 0.5, 34, m, sx * 4, 17, sz * 4, g, 6);
  sfMesh(new THREE.SphereGeometry(9, 20, 14), m, 0, 40, 0, g);
  sfCyl(0.6, 0.6, 3, m, 0, 50, 0, g, 6);
  const red = new THREE.MeshBasicMaterial({ color: new THREE.Color(10, 0.6, 0.3) }), rl = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 6), red); rl.position.set(0, 52, 0); g.add(rl);
  const el = sfBox(26, 42, 14, sfStd('#bcb6aa', 0.9), -340, 21, 160, g); void el;
  sfBox(10, 52, 10, sfStd('#a8a296', 0.9), -322, 26, 160, g);
  const lights = [], r = new RNG(4250);
  for (let i = 0; i < 160; i++) { const x = r.range(-700, 700), z = r.range(-600, 600); if (Math.hypot(x, z) > 750) continue; lights.push([tx + x, y0 + (r.next() < 0.7 ? 7 : 3), tz + z, r.next() < 0.7 ? 0 : 1]); }
  return { g, red, lights, tower: [tx, y0 + 52, tz] };
}
