/* =====================================================================
   WORLD — the lake's scenery (built once; the lake set in lake.js adds what moves). Every mesh carries two looks:
   its colour material (the title's four seconds of daylight) and its heat material (heat.js; the rest of the film).
   Long things are built in short pieces (the cloud renderer drops or mis-sorts kilometre-long triangles: picture
   pitfalls), and flat overlays (the track, the road, the hole) sit 3 cm or more above what's under them with a
   polygon offset (no z-fighting).
     nlTerrain   the ice, the shores and the hills: one height field, finer near the camera's ground
     nlTrack     the ploughed oval (clear ice, warmer than the snow) and its snow banks
     nlShore     the road on its bank, the railing, the lamp posts, the culvert, the town, the kiosk and the bonfire
     nlTrees     spruce on every shore and hill (instanced)
   ===================================================================== */

// the grid's lines: fine where the camera works, coarse far away
function nlGridLines(a, b, bands) {
  const out = [a]; let x = a;
  while (x < b) { let step = bands[bands.length - 1][2]; for (const [lo, hi, st] of bands) if (x >= lo && x < hi) { step = st; break; } x = Math.min(b, x + step); out.push(x); }
  return out;
}
function nlTerrain(set) {
  const xs = nlGridLines(-2600, 2600, [[-420, 420, 6], [-1100, 1100, 22]].concat([[-1e9, 1e9, 90]]));
  const zs = nlGridLines(-2400, 2800, [[-470, -398, 3], [-398, 260, 10], [-1000, 1300, 30]].concat([[-1e9, 1e9, 110]]));
  const nx = xs.length, nz = zs.length, pos = new Float32Array(nx * nz * 3), col = new Float32Array(nx * nz * 3), aT = new Float32Array(nx * nz);
  const snowLake = new THREE.Color('#e3e9f1'), snowLand = new THREE.Color('#eef0f3'), rock = new THREE.Color('#8f9196'), r = new RNG(77);
  const F = NL_F;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = xs[i], z = zs[j], y = nlGroundY(x, z), k = j * nx + i, d = nlOut(x, z);
    pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z;
    const c = (d <= 0 ? snowLake : snowLand).clone();
    if (d > 0) { const sl = Math.abs(nlGroundY(x + 3, z) - nlGroundY(x - 3, z)) + Math.abs(nlGroundY(x, z + 3) - nlGroundY(x, z - 3)); c.lerp(rock, MathX.smooth(sl, 2.5, 6) * 0.6); }
    const v = 0.97 + 0.03 * noise1(x * 0.05 + z * 0.031, 3); c.multiplyScalar(v);
    col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
    // °C: snow on the lake −14 (it insulates: colder than the ice under it), thinner and wetter by the stream's mouth,
    // the land's snow −15, the bank's south face (in the low Sun all day) a little warmer
    let T = d <= 0 ? -14 : -15.5;
    const di = Math.hypot(x - F.inlet.x, (z - nlShoreZ(F.inlet.x)) * 1.2);
    if (d <= 0) T += 8 * Math.exp(-((di / 34) ** 2));
    if (d > 0 && d < 14) T += 2.5;
    T += 0.8 * noise1(x * 0.11 + z * 0.07, 9) + 0.5 * (r.next() - 0.5);
    aT[k] = T + 14;                                                       // (relative to the material's base, −14)
  }
  const idx = [];
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, e = c + 1; idx.push(a, c, b, b, c, e); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aT', new THREE.BufferAttribute(aT, 1));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.86, metalness: 0, envMapIntensity: 0.6 }));
  m.receiveShadow = true; set.scene.add(m);
  nlReg(set, m, nlHeatMat(-14, { vT: 1, var: 0.6, emis: 0.97 }));
  return m;
}

// the ploughed oval: clear ice (dark and glossy in daylight; to the heat camera warmer than the snow, because the lake
// under it is at 0 °C and nothing insulates it), with the ploughed snow in low banks on both sides
function nlTrack(set) {
  const T = NL_F.track, N = 220, pos = [], idx = [], bank = [], bidx = [];
  for (let i = 0; i <= N; i++) {
    const a = i / N * Math.PI * 2, p = nlTrackP(a), dx = -T.a * Math.sin(a), dz = -T.b * Math.cos(a), l = Math.hypot(dx, dz), n = [-dz / l, dx / l];
    for (const sd of [-1, 1]) pos.push(p[0] + n[0] * sd * T.w / 2, 0.04, p[1] + n[1] * sd * T.w / 2);
    // banks: [inner foot, inner top, outer foot] on each side
    for (const sd of [-1, 1]) { const e = T.w / 2; for (const [o, h] of [[e - 0.05, 0.02], [e + 0.55, 0.32], [e + 1.5, 0.0]]) bank.push(p[0] + n[0] * sd * o, h, p[1] + n[1] * sd * o); }
    if (i < N) { const b = i * 2; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); for (let sd = 0; sd < 2; sd++) for (let q = 0; q < 2; q++) { const c = i * 6 + sd * 3 + q, d = c + 6; if (sd === 0) bidx.push(c, c + 1, d, c + 1, d + 1, d); else bidx.push(c, d, c + 1, c + 1, d, d + 1); } }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#7f97ab', roughness: 0.16, metalness: 0.05, envMapIntensity: 1.3, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6 }));
  m.receiveShadow = true; set.scene.add(m); nlReg(set, m, nlHeatMat(-7.5, { var: 1.4, emis: 0.97, po: [-2, -6] }));
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bank, 3)); bg.setIndex(bidx); bg.computeVertexNormals();
  const bm = new THREE.Mesh(bg, new THREE.MeshStandardMaterial({ color: '#eef2f7', roughness: 0.9, side: THREE.DoubleSide }));
  bm.receiveShadow = true; bm.castShadow = true; set.scene.add(bm); nlReg(set, bm, nlHeatMat(-15, { var: 1.0, side: 1 }));
}

// a gabled house: walls, windows (lamps on inside), a snowy roof, a chimney; returns its chimney top (for smoke)
function nlHouse(set, h, r) {
  const [x, z, w, d, hh, colr, yaw] = h, S = set.scene, g = new THREE.Group(); g.position.set(x, nlGroundY(x, z) - 0.3, z); g.rotation.y = yaw; S.add(g);
  const wall = nlStd(colr, 0.85), wm = nlMesh(new THREE.BoxGeometry(w, hh + 0.3, d), wall, 0, (hh + 0.3) / 2, 0, g);
  nlReg(set, wm, nlHeatMat(-5, { var: 2.2 }));
  // the roof: a prism along x, with eaves; snow on it
  const rh = d * 0.42, sh = new THREE.Shape(); sh.moveTo(-d / 2 - 0.45, 0); sh.lineTo(0, rh); sh.lineTo(d / 2 + 0.45, 0); sh.lineTo(-d / 2 - 0.45, 0);
  const rg = new THREE.ExtrudeGeometry(sh, { depth: w + 0.7, bevelEnabled: false }); rg.translate(0, 0, -(w + 0.7) / 2); rg.rotateY(Math.PI / 2);
  const roof = nlMesh(rg, nlStd('#f3f4f6', 0.9), 0, hh + 0.3, 0, g); nlReg(set, roof, nlHeatMat(-13.5, { var: 0.8 }));
  const cx = (r.next() - 0.5) * w * 0.5, cz = (r.next() < 0.5 ? -1 : 1) * d * 0.16;
  const ch = nlMesh(new THREE.BoxGeometry(0.55, 1.6, 0.55), nlStd('#5a3a2c', 0.9), cx, hh + 0.3 + rh * 0.62 + 0.4, cz, g);
  nlReg(set, ch, nlHeatMat(14, { hot: [0, 0.8, 0, 0.6, 70] }));
  // windows on both long sides (and a door), lit inside: warm glass to the heat camera
  const winC = new THREE.MeshStandardMaterial({ color: '#40362a', emissive: '#ffcf8a', emissiveIntensity: 0.9, roughness: 0.3 });
  const frameC = nlStd('#f2efe8', 0.7);
  const nW = Math.max(2, Math.floor(w / 2.8));
  for (const sd of [-1, 1]) for (let i = 0; i < nW; i++) {
    const wx = -w / 2 + (i + 0.5) * w / nW, lit = r.next() < 0.75;
    const fr = nlMesh(new THREE.BoxGeometry(1.1, 1.3, 0.06), frameC, wx, hh * 0.55, sd * (d / 2 + 0.03), g); fr.castShadow = false; nlReg(set, fr, nlHeatMat(-2));
    const gl = nlMesh(new THREE.PlaneGeometry(0.9, 1.1), lit ? winC : nlStd('#20242a', 0.2), wx, hh * 0.55, sd * (d / 2 + 0.065), g); gl.rotation.y = sd > 0 ? 0 : Math.PI; gl.castShadow = false;
    nlReg(set, gl, nlHeatMat(lit ? 7 : 2, { var: 1.5 }));
  }
  return [x + Math.cos(yaw) * cx + Math.sin(yaw) * cz, nlGroundY(x, z) + hh + rh * 0.62 + 1.3, z - Math.sin(yaw) * cx + Math.cos(yaw) * cz];
}

// the road, its railing, the lamp posts, the culvert, the town, the kiosk and its bonfire; returns handles
function nlShore(set) {
  const F = NL_F, S = set.scene, out = { chimneys: [], lamps: [], rails: [] };
  // the road: 25 m pieces, on the bank's flat top (3 cm above the ground there)
  const roadM = nlStd('#3d3f44', 0.55), roadH = nlHeatMat(-8.5, { var: 1.2, po: [-2, -6] });
  roadM.polygonOffset = true; roadM.polygonOffsetFactor = -2; roadM.polygonOffsetUnits = -6;
  for (let x = -900; x < 900; x += 25) { const m = new THREE.Mesh(new THREE.PlaneGeometry(25, F.road.w), roadM); m.rotation.x = -Math.PI / 2; m.position.set(x + 12.5, F.road.y + 0.03, F.road.z); m.receiveShadow = true; S.add(m); nlReg(set, m, roadH); }
  // snow ploughed to the verges
  const vergeM = nlStd('#f2f3f5', 0.9);
  for (const sd of [-1, 1]) for (let x = -900; x < 900; x += 25) { const m = nlMesh(new THREE.BoxGeometry(25, 0.35, 1.2), vergeM, x + 12.5, F.road.y + 0.12, F.road.z + sd * (F.road.w / 2 + 0.7), S); m.castShadow = false; nlReg(set, m, nlHeatMat(-14.5)); }
  // the railing on the lake side: posts every 2.5 m, two rails in 25 m pieces (the piece the car goes through is its own)
  const rz = F.road.z + F.road.w / 2 + 1.6, railM = nlStd('#9aa2a8', 0.4, 0.7), railH = nlHeatMat(-11, { emis: 0.35 });
  for (let x = -700; x < 700; x += 2.5) { const p = nlMesh(new THREE.BoxGeometry(0.1, 0.9, 0.1), railM, x, F.road.y + 0.45, rz, S); p.castShadow = false; nlReg(set, p, railH); }
  const gapX = NLV.car0[0] + NLV.dir[0] * (rz - NLV.car0[1]) / NLV.dir[1];
  for (let x = -700; x < 700; x += 25) {
    const pieces = (gapX > x && gapX < x + 25) ? [[x, gapX - 1.5], [gapX - 1.5, gapX + 1.5], [gapX + 1.5, x + 25]] : [[x, x + 25]];
    for (const [a, b] of pieces) for (const y of [0.55, 0.85]) {
      const m = nlMesh(new THREE.BoxGeometry(b - a, 0.09, 0.05), railM, (a + b) / 2, F.road.y + y, rz, S); m.castShadow = false; nlReg(set, m, railH);
      if (b - a < 3.1) out.rails.push({ m, x0: (a + b) / 2, y0: F.road.y + y, z0: rz });
    }
  }
  out.gapX = gapX;
  // lamp posts on the town side; their heads are lit (hot)
  const poleM = nlStd('#5a5f66', 0.5, 0.5), headC = new THREE.MeshStandardMaterial({ color: '#fff5e0', emissive: '#ffd9a0', emissiveIntensity: 2.4 });
  for (const x of F.lamps) {
    const z = F.road.z - F.road.w / 2 - 1.2, y0 = F.road.y;
    const p = nlCyl(0.07, 0.1, 7.2, poleM, x, y0 + 3.6, z, S, 8); nlReg(set, p, nlHeatMat(-11, { emis: 0.5 }));
    const arm = nlMesh(new THREE.BoxGeometry(0.08, 0.08, 1.5), poleM, x, y0 + 7.15, z + 0.7, S); nlReg(set, arm, nlHeatMat(-11, { emis: 0.5 }));
    const hd = nlMesh(new THREE.BoxGeometry(0.34, 0.12, 0.6), headC, x, y0 + 7.05, z + 1.35, S); hd.castShadow = false; nlReg(set, hd, nlHeatMat(62, { over: 1.4 }));
    out.lamps.push([x, y0 + 7.0, z + 1.35]);
  }
  // the culvert: the stream comes out under the road, open water for a few metres (it never freezes over there)
  const cv = nlMesh(new THREE.CylinderGeometry(0.9, 0.9, 12, 16, 1, true), nlStd('#3a3c40', 0.8), F.inlet.x, 0.7, F.road.z + 3, S); cv.rotation.x = Math.PI / 2; nlReg(set, cv, nlHeatMat(-3));
  const strm = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 9), nlStd('#1a2228', 0.15)); strm.rotation.x = -Math.PI / 2; strm.position.set(F.inlet.x, 0.06, nlShoreZ(F.inlet.x) - 1.5); S.add(strm);
  strm.material.polygonOffset = true; strm.material.polygonOffsetFactor = -3; strm.material.polygonOffsetUnits = -8;
  nlReg(set, strm, nlHeatMat(1.5, { var: 0.8, po: [-3, -8] }));
  // the town
  const rr = new RNG(31);
  for (const h of NL_HOUSES) out.chimneys.push(nlHouse(set, h, rr));
  // the kiosk on its beach, its benches, the bonfire's ring of stones and its logs
  const K = F.kiosk, ky = nlGroundY(K.x, K.z), kg = new THREE.Group(); kg.position.set(K.x, ky, K.z); kg.rotation.y = 0.15; S.add(kg);
  const wood = nlStd('#6a3420', 0.85);
  nlReg(set, nlMesh(new THREE.BoxGeometry(3.4, 2.6, 2.6), wood, 0, 1.3, 0, kg), nlHeatMat(-3, { var: 2.5, hot: [0, 1.3, 1.2, 1.2, 9] }));
  nlReg(set, nlMesh(new THREE.BoxGeometry(3.9, 0.25, 3.1), nlStd('#eef0f2', 0.9), 0, 2.72, 0, kg), nlHeatMat(-12));
  const kw = nlMesh(new THREE.PlaneGeometry(1.8, 0.9), new THREE.MeshStandardMaterial({ color: '#40362a', emissive: '#ffcf8a', emissiveIntensity: 1.0 }), 0, 1.45, 1.33, kg); kw.castShadow = false; nlReg(set, kw, nlHeatMat(3));
  nlReg(set, nlMesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), nlStd('#333', 0.5, 0.5), 1.1, 3.4, -0.6, kg), nlHeatMat(55, { over: 1.2 }));
  for (const [bx, bz, by] of [[-3.5, 4.2, 0.4], [3.6, 4.6, -0.5]]) { const b = nlMesh(new THREE.BoxGeometry(2.2, 0.45, 0.5), wood, bx, 0.22, bz, kg); b.rotation.y = by; nlReg(set, b, nlHeatMat(-8)); }
  const fx = F.fire.x, fz = F.fire.z, fy = nlGroundY(fx, fz), fr = new RNG(66);
  for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2, st = nlMesh(new THREE.DodecahedronGeometry(fr.range(0.17, 0.26), 0), nlStd('#6a6866', 0.9), fx + Math.cos(a) * 0.95, fy + 0.1, fz + Math.sin(a) * 0.95, S); nlReg(set, st, nlHeatMat(fr.range(60, 140), { over: 1.2 })); }
  for (let i = 0; i < 6; i++) { const lg = nlMesh(new THREE.CylinderGeometry(0.08, 0.1, 1.3, 7), nlStd('#2a1a10', 0.9), fx, fy + 0.35, fz, S); lg.rotation.set(0.9, i * 1.05, 0); nlReg(set, lg, nlHeatMat(fr.range(250, 450), { over: 1.0 })); }
  out.fire = [fx, fy, fz];
  return out;
}

// spruce everywhere on land (instanced cones: two tiers), a few near the shore and the houses, dense on the hills
function nlTrees(set) {
  const r = new RNG(9001), M = [], F = NL_F;
  const tryAt = (x, z, hMin, hMax) => {
    const d = nlOut(x, z); if (d < 6) return;
    if (z > F.road.z - F.road.w / 2 - 6 && z < nlShoreZ(x) + 6 && Math.abs(x) < 900) return;                 // not on the road or the bank
    for (const h of NL_HOUSES) if (Math.abs(x - h[0]) < h[2] / 2 + 3 && Math.abs(z - h[1]) < h[3] / 2 + 3) return;
    if (Math.hypot(x - F.kiosk.x, z - F.kiosk.z) < 14) return;
    // (a felled strip on the far hills, just where the low Sun sets: from the ice it stays above the treeline)
    if (z > F.lake.zS - 200 && Math.abs(Math.atan2(x - F.track.cx, z - F.track.cz) - Math.atan2(NL_SUN[0], NL_SUN[2])) < 0.12) return;
    M.push([x, nlGroundY(x, z), z, r.range(hMin, hMax), r.range(0, 6.28), r.next()]);
  };
  for (let i = 0; i < 900; i++) tryAt(r.range(-700, 700), r.range(-470, -760), 5, 14);
  // a stand of spruce on the bank west of the kiosk, close to the ice (seen up close in the world beat)
  for (const [x, h] of [[-132, 11], [-126.5, 14], [-121, 9.5], [-116.5, 13], [-111, 10.5], [-137.5, 8.5]]) { const z = nlShoreZ(x) - 5.5 - 1.5 * Math.sin(x); M.push([x, nlGroundY(x, z), z, h, x * 0.7, 0.5]); }
  for (let i = 0; i < 9000; i++) { const a = r.range(0, Math.PI * 2), rad = r.range(1100, 2500); tryAt(rad * Math.cos(a) * 1.05, 300 + rad * Math.sin(a) * 1.1, 12, 24); }
  const g1 = new THREE.ConeGeometry(1, 1, 7, 1, true); g1.translate(0, 0.5, 0);
  const geo = THREE.mergeGeometries([g1.clone().scale(0.42, 0.62, 0.42).translate(0, 0.08, 0), g1.clone().scale(0.3, 0.55, 0.3).translate(0, 0.45, 0), new THREE.CylinderGeometry(0.03, 0.04, 0.2, 5).translate(0, 0.1, 0)].map((x) => x.toNonIndexed()));
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: '#22311f', roughness: 0.95, side: THREE.DoubleSide }), M.length);
  const o = new THREE.Object3D(), c = new THREE.Color();
  M.forEach(([x, y, z, h, ry, v], i) => { o.position.set(x, y - 0.2, z); o.rotation.set(0, ry, 0); o.scale.set(h * 0.9, h, h * 0.9); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); c.setRGB(0.5 + (v - 0.5) * 0.06, 0.5, 0.5); mesh.setColorAt(i, c); });
  // (instanceColor.r carries a temperature offset for the heat view: ±2 °C; in daylight it would tint, so the colour
  // material ignores it)
  mesh.castShadow = true; mesh.receiveShadow = true; set.scene.add(mesh);
  mesh.material.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <color_vertex>', '#include <color_vertex>\n#ifdef USE_INSTANCING_COLOR\nvColor = vColor * 0.0 + 1.0;\n#endif'); };
  nlReg(set, mesh, nlHeatMat(-10.5, { var: 1.6, side: 1 }));
  return mesh;
}
