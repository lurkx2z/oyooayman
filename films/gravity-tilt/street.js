/* =====================================================================
   STREET — your street, outside your window: 285 m long and dead straight, running east from your front gate to the
   foot of the hill, where a stone retaining wall holds the hillside up. The ground (the road, the pavements, the
   gardens, the wall, the hill) keeps its old down: it is the frame of the story. Everything else obeys the new one.
     north side   detached timber houses like yours (nailed, bolted down: they lean and hold), front gardens, fences
     south side   a brick terrace of 30 houses (x 14 → 164) on a damp-proof course; then the green, with its trees
     both         lamp posts (set in concrete: they hold), street trees (rooted: they bend), parked cars, bins (bin day)
     moving       the cars and the bins falling to the end of the street and piling up; a white garden chair; roof
                  tiles all hour; the terrace (it creeps, lets go at 8:09 and crumples into the end of the street);
                  the dust (it rises the old way: the air keeps its old down); the river's rain; the rainbow
   Everything that moves is posed by update(s) from physics.js (pure).
     gtBuildStreet(S) → T
   ===================================================================== */

const GT_ST = { hillX: 285, wallH: 4.0 };

// a timber house's street front (weatherboard, painted): two windows up, a window and the door down. 9 m × 6 m
function gtTimberFacade(seed, col) {
  const r = new RNG(seed * 17 + 3), W = 512, H = 342, px = W / 9;
  return gtCanvas(W, H, (g) => {
    const c = new THREE.Color(col), base = [c.r * 255, c.g * 255, c.b * 255], bh = 10;
    for (let y = 0; y < H; y += bh) {
      const k = r.range(-5, 5), gr = g.createLinearGradient(0, y, 0, y + bh);
      gr.addColorStop(0, `rgb(${base[0] - 30 + k},${base[1] - 30 + k},${base[2] - 28 + k})`); gr.addColorStop(0.25, `rgb(${base[0] + k},${base[1] + k},${base[2] + k})`); gr.addColorStop(1, `rgb(${base[0] - 10 + k},${base[1] - 10 + k},${base[2] - 10 + k})`);
      g.fillStyle = gr; g.fillRect(0, y, W, bh);
    }
    const Y = (y) => H - y * px, X = (x) => x * px;
    const win = (x0, y0, w, h) => {
      g.fillStyle = '#f4f2ec'; g.fillRect(X(x0) - 5, Y(y0 + h) - 5, w * px + 10, h * px + 10);
      const gr = g.createLinearGradient(0, Y(y0 + h), 0, Y(y0)); gr.addColorStop(0, '#6d8396'); gr.addColorStop(0.5, '#2c3742'); gr.addColorStop(1, '#151b21');
      g.fillStyle = gr; g.fillRect(X(x0), Y(y0 + h), w * px, h * px);
      if (r.next() < 0.5) { g.fillStyle = `rgba(232,228,218,${r.range(0.3, 0.6)})`; g.fillRect(X(x0), Y(y0 + h), w * px * r.range(0.2, 0.45), h * px); }
      g.fillStyle = '#f4f2ec'; g.fillRect(X(x0 + w / 2) - 2, Y(y0 + h), 4, h * px); g.fillRect(X(x0), Y(y0 + h / 2) - 2, w * px, 4);
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(X(x0) - 5, Y(y0) + 5, w * px + 10, 4);
    };
    const flip = r.next() < 0.5;
    win(flip ? 5.6 : 1.2, 3.5, 2.0, 1.4); win(flip ? 1.4 : 5.8, 3.5, 2.0, 1.4);
    win(flip ? 5.2 : 1.0, 0.9, 2.6, 1.4);
    const dx = flip ? 1.6 : 6.4, doors = ['#2f4c5e', '#7a1f24', '#2e5a3a', '#1c1c1e', '#c9a23a', '#4a3a6a'];
    g.fillStyle = '#f4f2ec'; g.fillRect(X(dx) - 6, Y(2.2) - 6, 1.0 * px + 12, 2.2 * px + 6);
    g.fillStyle = doors[r.int(0, doors.length - 1)]; g.fillRect(X(dx), Y(2.1), 1.0 * px, 2.1 * px);
    g.fillStyle = '#c9a45a'; g.beginPath(); g.arc(X(dx + 0.8), Y(1.05), 3, 0, 6.28); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, 0, W, 6);
  });
}
// a terrace house's front (brick): the bay downstairs, the door with its fanlight, two sashes up. 5 m × 6.45 m
// (from the damp-proof course at 0.15 m to the eaves at 6.6 m)
function gtTerraceFacade(seed, brickC) {
  const r = new RNG(seed * 31 + 7), W = 512, H = 660, px = W / 5;
  const c = gtBrickCanvas(seed + 3, brickC, W, H), g = c.getContext('2d');
  const Y = (y) => H - (y - 0.15) * px, X = (x) => x * px;
  const glass = (x0, y0, w, h) => { const gr = g.createLinearGradient(0, Y(y0 + h), 0, Y(y0)); gr.addColorStop(0, '#5d7487'); gr.addColorStop(0.45, '#2a3540'); gr.addColorStop(1, '#161c22'); g.fillStyle = gr; g.fillRect(X(x0), Y(y0 + h), w * px, h * px); };
  const sash = (x0, y0, w, h) => {
    g.fillStyle = '#f2efe8'; g.fillRect(X(x0) - 6, Y(y0 + h) - 6, w * px + 12, h * px + 12);
    glass(x0, y0, w, h);
    if (r.next() < 0.45) { g.fillStyle = `rgba(235,232,224,${r.range(0.25, 0.6)})`; g.fillRect(X(x0), Y(y0 + h * 0.55), w * px, h * 0.55 * px); }
    g.fillStyle = '#f2efe8'; g.fillRect(X(x0), Y(y0 + h * 0.5) - 3, w * px, 6); g.fillRect(X(x0 + w / 2) - 2, Y(y0 + h), 4, h * px);
    g.fillStyle = '#d8d2c4'; g.fillRect(X(x0) - 10, Y(y0 + h) - 20, w * px + 20, 14);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(X(x0) - 6, Y(y0) + 6, w * px + 12, 6);
  };
  const flip = seed % 2 === 1;
  sash(flip ? 2.6 : 0.5, 1.0, 1.9, 1.7);
  const dx0 = flip ? 0.7 : 3.4, dw = 0.95, doors = ['#1f3a5a', '#7a1f24', '#2e5a3a', '#1c1c1e', '#5a2a5e', '#c9a23a', '#3a6a7a'];
  g.fillStyle = '#efebe2'; g.fillRect(X(dx0) - 7, Y(2.75) - 7, dw * px + 14, 2.6 * px + 8);
  g.fillStyle = doors[r.int(0, doors.length - 1)]; g.fillRect(X(dx0), Y(2.3), dw * px, 2.15 * px);
  glass(dx0 + 0.05, 2.35, dw - 0.1, 0.35);
  g.fillStyle = '#c9a45a'; g.fillRect(X(dx0 + dw * 0.5) - 12, Y(1.2), 24, 5);
  g.fillStyle = '#f2efe8'; g.font = '600 18px Georgia'; g.textAlign = 'center'; g.fillText(String(2 + 2 * (seed % 40)), X(dx0 + dw * 0.5), Y(2.45) + 6);
  for (const ux of [0.55, 2.95]) sash(ux, 3.65, 1.4, 1.5);
  g.fillStyle = 'rgba(230,220,200,0.45)'; g.fillRect(0, Y(3.1), W, 8);
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(0,0,0,0.15)'); gr.addColorStop(0.1, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(20,15,10,0.2)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  return c;
}
// a wheelie bin (240 l): body, lid, wheels; origin on the ground at its middle
function gtBuildBin(color) {
  const g = new THREE.Group(), m = gtStd(color, 0.55);
  gtMesh(new THREE.CylinderGeometry(0.33, 0.27, 0.98, 4, 1).rotateY(Math.PI / 4).scale(1.0, 1, 1.25), m, 0, 0.53, 0, g);
  gtBox(0.6, 0.05, 0.76, m, 0, 1.05, 0, g);
  for (const sx of [-1, 1]) { const w = gtCyl(0.1, 0.1, 0.05, gtStd('#141414', 0.8), sx * 0.24, 0.1, 0.3, g, 14); w.rotation.z = Math.PI / 2; }
  return g;
}
// a white plastic garden chair; origin on the ground at its middle
function gtBuildGardenChair() {
  const g = new THREE.Group(), m = gtStd('#f2f0ea', 0.45);
  gtBox(0.48, 0.04, 0.46, m, 0, 0.44, 0, g);
  gtBox(0.46, 0.5, 0.04, m, 0, 0.72, -0.22, g).rotation.x = -0.15;
  for (const [x, z] of [[-0.21, -0.2], [0.21, -0.2], [-0.21, 0.2], [0.21, 0.2]]) gtBox(0.04, 0.44, 0.04, m, x, 0.22, z, g);
  for (const x of [-0.24, 0.24]) gtBox(0.04, 0.04, 0.42, m, x, 0.64, -0.02, g);
  return g;
}
// a street tree (a trunk in three segments that bend in turn, a crown of blobs): bend(θ) curves it east
function gtBuildTree(parent, x, z, h, seed, M) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = seed * 6.28; parent.add(g);
  const segs = [], r0 = 0.11 + 0.06 * (h / 9);
  let par = g;
  for (let k = 0; k < 3; k++) {
    const sg = new THREE.Group(); sg.position.y = k ? h * 0.55 / 3 : 0; par.add(sg); segs.push(sg);
    gtCyl(r0 * (1 - 0.22 * k) * 0.8, r0 * (1 - 0.22 * k), h * 0.55 / 3 + 0.05, M.bark, 0, h * 0.55 / 6, 0, sg, 8);
    par = sg;
  }
  const top = segs[2], cr = h * 0.3;
  gtMesh(gtBlobGeo(cr, seed * 9 + 1), seed > 0.5 ? M.leaf : M.leaf2, 0, h * 0.55 / 3 + cr * 0.75, 0, top);
  gtMesh(gtBlobGeo(cr * 0.75, seed * 9 + 2), M.leaf2, cr * 0.6, h * 0.55 / 3 + cr * 0.3, cr * 0.3, top);
  gtMesh(gtBlobGeo(cr * 0.7, seed * 9 + 3), M.leaf, -cr * 0.55, h * 0.55 / 3 + cr * 0.4, -cr * 0.35, top);
  return { g, segs, stiff: 1.0 + 0.7 * gtR(Math.round(seed * 100), 3), seed, yaw: g.rotation.y };
}

function gtBuildStreet(S) {
  const scene = S.scene, T = { M: {} }, root = new THREE.Group(); root.name = 'street'; scene.add(root); T.root = root;
  const as = Tex.asphalt(41); for (const t of [as.map, as.roughnessMap, as.bumpMap]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(40, 1); }
  const tex = (c, rx, ry) => { const t = gtTex(c); t.repeat.set(rx, ry); return t; };
  const M = T.M = {
    road: gtStd('#ffffff', 0.92, 0, { map: as.map, roughnessMap: as.roughnessMap, bumpMap: as.bumpMap, bumpScale: 0.5 }),
    pav: gtStd('#ffffff', 0.85, 0, { map: tex(gtPavingCanvas(43), 120, 1) }),
    kerb: gtStd('#9a968c', 0.8), grass: gtStd('#ffffff', 1.0, 0, { map: tex(gtGrassCanvas(5), 300, 300) }),
    lawn: gtStd('#ffffff', 1.0, 0, { map: tex(gtGrassCanvas(6), 2, 2) }), path: gtStd('#b9b2a4', 0.9),
    brickSide: gtStd('#ffffff', 0.92, 0, { map: tex(gtBrickCanvas(25, [118, 70, 54]), 2, 2) }),
    stub: gtStd('#ffffff', 0.92, 0, { map: tex(gtBrickCanvas(26, [104, 64, 50]), 40, 1) }), dpc: gtStd('#141414', 0.5),
    slab: gtStd('#8f8b84', 0.95), roof: gtStd('#4a4644', 0.85), roof2: gtStd('#5a4a44', 0.85), roofT: gtStd('#56585c', 0.85),
    boards: gtStd('#ffffff', 0.85, 0, { map: tex(gtBoardsCanvas(9), 3, 2) }), trim: gtStd('#f2efe8', 0.5),
    stone: gtStd('#ffffff', 0.95, 0, { map: tex(gtBrickCanvas(61, [150, 142, 128], 512, 512, '#8a847a'), 30, 2) }),
    post: gtStd('#2a2e32', 0.5, 0.5), lampGlass: gtStd('#fff4dd', 0.3, 0, { emissive: new THREE.Color('#ffe2a8'), emissiveIntensity: 0.2 }),
    fence: gtStd('#efede6', 0.6), rail: gtStd('#1c1f22', 0.5, 0.4),
    leaf: gtStd('#56803c', 0.85, 0, { flatShading: true }), leaf2: gtStd('#45703a', 0.85, 0, { flatShading: true }), leafA: gtStd('#a07a2c', 0.85, 0, { flatShading: true }), bark: gtStd('#5a4a3a', 0.95),
    tile: gtStd('#7a3d2c', 0.8), bench: gtStd('#6a5038', 0.8),
  };
  const B = new Batcher();
  // ------------------------------------------------------------------ the ground (it keeps its old down)
  { const gm = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), M.grass); gm.rotation.x = -Math.PI / 2; gm.position.set(0, -0.02, 0); gm.receiveShadow = true; root.add(gm); }
  const X0 = GT_W.x0, X1 = GT_ST.hillX, R = GT_W.road, L = X1 - X0;
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(L, R[1] - R[0]), M.road); m.rotation.x = -Math.PI / 2; m.position.set((X0 + X1) / 2, 0.0, 0); m.receiveShadow = true; root.add(m); }
  for (const P of [GT_W.pavN, GT_W.pavS]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(L, P[1] - P[0]), M.pav); m.rotation.x = -Math.PI / 2; m.position.set((X0 + X1) / 2, 0.12, (P[0] + P[1]) / 2); m.receiveShadow = true; root.add(m);
    B.box(L, 0.12, P[1] - P[0], (X0 + X1) / 2, 0.06, (P[0] + P[1]) / 2, M.kerb); }
  // road markings: the centre line, the edge lines
  { const wm = gtStd('#ecebe4', 0.6);
    for (let x = X0 + 3; x < X1 - 6; x += 9) { const geo = new THREE.PlaneGeometry(4, 0.1); geo.rotateX(-Math.PI / 2); B.add(geo, wm, Geo.matrix(x + 2, 0.006, 0)); }
    for (const z of [R[0] + 0.3, R[1] - 0.3]) { const geo = new THREE.PlaneGeometry(L - 4, 0.08); geo.rotateX(-Math.PI / 2); B.add(geo, gtStd('#d9c25a', 0.6), Geo.matrix((X0 + X1) / 2, 0.006, z)); } }
  // ------------------------------------------------------------------ the end of the street: the retaining wall and the hill above it
  { const H = GT_ST.wallH;
    B.box(3, H + 0.6, 120, X1 + 1.5, (H + 0.6) / 2 - 0.3, 0, M.stone);
    B.box(3.4, 0.25, 120, X1 + 1.5, H + 0.35, 0, M.kerb);
    // the hill: rising from the top of the wall (y 4 at x 288) to y 16 at x 360, then gently to y 22
    const hill = new THREE.PlaneGeometry(1, 1, 1, 1), pos = [], idx = [], uv = [];
    const prof = [[288, H + 0.2], [300, H + 4], [330, H + 9], [360, 16], [480, 20], [900, 24]], zs = [-600, -60, 0, 60, 600];
    prof.forEach(([x, y], i) => zs.forEach((z, k) => { pos.push(x, y + (k % 2 ? 0 : -1) * 0.0, z); uv.push(x / 8, z / 8); }));
    for (let i = 0; i < prof.length - 1; i++) for (let k = 0; k < zs.length - 1; k++) { const a = i * zs.length + k, b = a + 1, c = a + zs.length, d = c + 1; idx.push(a, b, c, b, d, c); }
    const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); hg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); hg.setIndex(idx); hg.computeVertexNormals();
    hill.dispose(); const hm = new THREE.Mesh(hg, gtStd('#ffffff', 1.0, 0, { map: tex(gtGrassCanvas(7), 1, 1) })); hm.receiveShadow = true; root.add(hm);
    // trees on the hill (far: static)
    const r = new RNG(5);
    for (let i = 0; i < 60; i++) { const x = r.range(300, 420), z = r.range(-120, 120), y = x < 330 ? H + 4 + (x - 300) / 30 * 5 : 13 + (x - 330) / 30 * 3, h = r.range(7, 12);
      B.add(new THREE.CylinderGeometry(0.15, 0.22, h * 0.5, 6), M.bark, Geo.matrix(x, y + h * 0.25, z)); B.add(gtBlobGeo(h * 0.32, i), i % 3 ? M.leaf2 : M.leafA, Geo.matrix(x, y + h * 0.62, z)); } }
  // ------------------------------------------------------------------ the north side: timber houses like yours (they lean with it)
  const north = new THREE.Group(); north.name = 'north'; north.matrixAutoUpdate = false; root.add(north); T.north = north;
  const NB = new Batcher();
  { const r = new RNG(19), cols = ['#f0ede4', '#c9d6dc', '#d9dcc8', '#efe2c6', '#c3c8cc', '#e8d6cf', '#b8c9b4'];
    const fmats = cols.map((c, i) => gtStd('#ffffff', 0.85, 0, { map: gtTex(gtTimberFacade(i + 1, c), { repeat: false }) }));
    const sides = cols.map((c) => gtStd(c, 0.88, 0, { map: M.boards.map }));
    let x = 9; T.northHouses = [];
    while (x < X1 - 12) {
      const w = r.range(8.6, 10.2), v = r.int(0, cols.length - 1), zf = GT_W.frontN, d = 8.5, eaves = 5.9, ridge = 8.2, xc = x + w / 2, zc = zf - d / 2;
      NB.box(w, eaves + 0.4, d, xc, (eaves + 0.4) / 2 - 0.4, zc, sides[v]);
      const fg = new THREE.PlaneGeometry(w, eaves); fg.translate(0, eaves / 2, 0); NB.add(fg, fmats[v], Geo.matrix(xc, 0, zf + 0.004));
      const sh = new THREE.Shape(); sh.moveTo(-d / 2 - 0.4, 0); sh.lineTo(d / 2 + 0.4, 0); sh.lineTo(0, ridge - eaves); sh.closePath();
      const rg = new THREE.ExtrudeGeometry(sh, { depth: w + 0.4, bevelEnabled: false }); rg.rotateY(Math.PI / 2); rg.translate(-(w + 0.4) / 2, 0, 0);
      NB.add(rg, v % 2 ? M.roof : M.roofT, Geo.matrix(xc, eaves, zc));
      NB.box(1.6, 0.08, 1.2, xc + (v % 2 ? -2.0 : 2.0), 2.45, zf + 0.6, M.trim);                     // the porch canopy
      for (const ex of [x, x + w]) NB.box(0.12, eaves, 0.12, ex, eaves / 2, zf + 0.02, M.trim);       // corner boards
      T.northHouses.push({ x0: x, x1: x + w });
      // the front garden: a path, a picket fence along the pavement (posts in the ground: they stay)
      B.box(1.1, 0.03, GT_W.pavN[0] - zf, xc + (v % 2 ? -2.0 : 2.0), 0.015, (zf + GT_W.pavN[0]) / 2, M.path);
      for (let px = x + 0.1; px < x + w; px += 0.22) if (Math.abs(px - (xc + (v % 2 ? -2.0 : 2.0))) > 0.6) B.box(0.04, 0.85, 0.06, px, 0.42, GT_W.pavN[0] - 0.12, M.fence);
      for (const y of [0.25, 0.65]) B.box(w, 0.07, 0.03, xc, y, GT_W.pavN[0] - 0.16, M.fence);
      x += w + r.range(3.5, 5.5);
    } }
  NB.build(north, 'northHouses');
  // ------------------------------------------------------------------ the south side: the brick terrace (30 houses, each its own group)
  { const TER = GT_TER, X = GT_W.terrace, zf = GT_W.terraceZ[0], d = GT_TER.depth, zc = zf + d / 2;
    const bricks = [[128, 72, 56], [150, 98, 70], [120, 66, 52], [158, 120, 88], [138, 80, 60]];
    const fm = Array.from({ length: 8 }, (_, v) => gtStd('#ffffff', 0.85, 0, { map: gtTex(gtTerraceFacade(100 + v, bricks[v % bricks.length]), { repeat: false }) }));
    const rs = new THREE.Shape(); rs.moveTo(-d / 2 - 0.3, 0); rs.lineTo(d / 2 + 0.3, 0); rs.lineTo(0, TER.ridge - TER.eaves); rs.closePath();
    const roofG = new THREE.ExtrudeGeometry(rs, { depth: TER.L, bevelEnabled: false }); roofG.rotateY(Math.PI / 2); roofG.translate(-TER.L, 0, 0);
    const bodyG = new THREE.BoxGeometry(TER.L, TER.eaves - 0.15, d); bodyG.translate(-TER.L / 2, (TER.eaves - 0.15) / 2 + 0.15, zc);
    const faceG = new THREE.PlaneGeometry(TER.L, TER.eaves - 0.15); faceG.rotateY(Math.PI); faceG.translate(-TER.L / 2, (TER.eaves - 0.15) / 2 + 0.15, zf - 0.004);
    const backG = new THREE.PlaneGeometry(TER.L, TER.eaves - 0.15); backG.translate(-TER.L / 2, (TER.eaves - 0.15) / 2 + 0.15, zf + d + 0.004);
    const chimG = new THREE.BoxGeometry(0.7, 1.3, 0.9); chimG.translate(0, TER.ridge + 0.2, zc);
    T.terrace = [];
    for (let i = 0; i < TER.n; i++) {
      const g = new THREE.Group(), x0 = X[1] - i * TER.L; g.position.x = x0; root.add(g);
      const parts = [new THREE.Mesh(bodyG, M.brickSide), new THREE.Mesh(faceG, fm[(i * 5) % 8]), new THREE.Mesh(backG, M.brickSide), new THREE.Mesh(roofG, i % 3 ? M.roof : M.roof2)];
      parts[3].position.set(0, TER.eaves, zc);
      if (i % 2 === 0) parts.push(new THREE.Mesh(chimG, M.brickSide));
      for (const p of parts) { p.castShadow = p.receiveShadow = true; g.add(p); }
      T.terrace.push({ g, i, x0, r1: gtR(i, 71), r2: gtR(i, 72), r3: gtR(i, 73) });
    }
    // what stays: the brick below the damp-proof course, the black strip of plastic on it, the floor slabs, the front
    // gardens' railings (set in the ground)
    B.box(X[1] - X[0], 0.15, 0.3, (X[0] + X[1]) / 2, 0.075, zf + 0.15, M.stub); B.box(X[1] - X[0], 0.15, 0.3, (X[0] + X[1]) / 2, 0.075, zf + d - 0.15, M.stub);
    for (let i = 0; i <= TER.n; i++) B.box(0.25, 0.15, d, X[0] + i * TER.L, 0.075, zc, M.stub);
    B.box(X[1] - X[0], 0.008, 0.3, (X[0] + X[1]) / 2, 0.154, zf + 0.15, M.dpc);
    B.box(X[1] - X[0] - 0.4, 0.1, d - 0.6, (X[0] + X[1]) / 2, 0.05, zc, M.slab);
    for (let x = X[0] + 0.1; x < X[1]; x += 0.14) B.box(0.02, 0.9, 0.02, x, 0.45, GT_W.pavS[1] + 0.1, M.rail);
    B.box(X[1] - X[0], 0.04, 0.04, (X[0] + X[1]) / 2, 0.88, GT_W.pavS[1] + 0.1, M.rail);
    for (let i = 0; i < TER.n; i++) { const x = X[1] - i * TER.L - 2.5; B.box(1.0, 0.03, zf - GT_W.pavS[1], x + (i % 2 ? -1.0 : 1.4), 0.015, (zf + GT_W.pavS[1]) / 2, M.path); } }
  // ------------------------------------------------------------------ the green (south, after the terrace): a path, benches (bolted down)
  { const P = GT_W.park;
    B.box(P[1] - P[0] - 4, 0.03, 2.0, (P[0] + P[1]) / 2, 0.015, 12, M.path);
    for (const x of [180, 214, 248]) { B.box(1.6, 0.06, 0.45, x, 0.45, 10.6, M.bench); B.box(1.6, 0.4, 0.06, x, 0.7, 10.85, M.bench); for (const dx of [-0.7, 0.7]) B.box(0.06, 0.45, 0.4, x + dx, 0.22, 10.6, M.post); }
    for (let x = P[0] + 0.1; x < P[1] - 1; x += 0.14) B.box(0.02, 0.9, 0.02, x, 0.45, GT_W.pavS[1] + 0.1, M.rail); }
  // ------------------------------------------------------------------ lamp posts (6 m, set in concrete: they hold). The jogger's is the
  // north one at x 24
  T.posts = [];
  for (let x = 24; x < X1 - 4; x += 30) T.posts.push([x, GT_JOG.post.z, -1]);
  for (let x = 9; x < X1 - 4; x += 30) T.posts.push([x, -GT_JOG.post.z, 1]);
  for (const [x, z, f] of T.posts) {
    B.add(new THREE.CylinderGeometry(0.06, 0.085, 6.0, 10), M.post, Geo.matrix(x, 3.12, z));
    B.add(new THREE.CylinderGeometry(0.11, 0.11, 0.5, 10), M.post, Geo.matrix(x, 0.37, z));
    B.add(new THREE.BoxGeometry(0.06, 0.06, 0.9), M.post, Geo.matrix(x, 6.07, z + f * 0.42));
    B.add(new THREE.BoxGeometry(0.3, 0.1, 0.55), M.post, Geo.matrix(x, 6.02, z + f * 0.85));
    B.add(new THREE.BoxGeometry(0.24, 0.02, 0.45), M.lampGlass, Geo.matrix(x, 5.96, z + f * 0.85));
  }
  // ------------------------------------------------------------------ the town around (far: houses and trees, static)
  { const r = new RNG(83), cols = ['#d9d4c8', '#b8a898', '#c9b8a4', '#9a8a7a', '#e2ddd2', '#a8b4bc'];
    const mats = cols.map((c) => gtStd(c, 0.9)), roofs = [M.roof, M.roof2, M.roofT];
    const block = (x, z, w, d, h, ry) => { B.box(w, h, d, x, h / 2, z, mats[r.int(0, mats.length - 1)], ry);
      const sh = new THREE.Shape(); sh.moveTo(-d / 2 - 0.3, 0); sh.lineTo(d / 2 + 0.3, 0); sh.lineTo(0, 2.4); sh.closePath();
      const rg = new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: false }); rg.rotateY(Math.PI / 2); rg.translate(-w / 2, 0, 0); B.add(rg, roofs[r.int(0, 2)], Geo.matrix(x, h, z, 0, ry, 0)); };
    for (let k = 0; k < 4; k++) for (let x = -60; x < 280; x += r.range(11, 16)) { block(x, -32 - k * 16 - r.range(0, 4), r.range(8, 11), r.range(7, 9), r.range(5.5, 6.6), 0); if (k < 3 || x > 170) block(x + 4, 30 + k * 16 + r.range(0, 4), r.range(8, 11), r.range(7, 9), r.range(5.5, 6.6), 0); }
    for (let k = 0; k < 6; k++) for (let z = -90; z < 90; z += r.range(12, 16)) block(-26 - k * 15 - r.range(0, 4), z, r.range(7, 9), r.range(8, 11), r.range(5.5, 6.6), Math.PI / 2);
    for (let x = 175; x < 282; x += r.range(9, 13)) block(x, 24 + r.range(0, 4), r.range(8, 11), r.range(7, 9), r.range(5.5, 6.6), 0);
    for (let i = 0; i < 90; i++) { const x = r.range(-160, 280), z = (r.next() < 0.5 ? -1 : 1) * r.range(22, 110), h = r.range(6, 11);
      B.add(new THREE.CylinderGeometry(0.15, 0.22, h * 0.5, 6), M.bark, Geo.matrix(x, h * 0.25, z)); B.add(gtBlobGeo(h * 0.3, i + 7), i % 4 ? M.leaf2 : M.leafA, Geo.matrix(x, h * 0.62, z)); }
    // your neighbours either side of you (timber, like yours)
    for (const z of [-15.5, 15.5]) { B.box(10, 6.2, 9, -5, 3.1, z, M.boards); const sh = new THREE.Shape(); sh.moveTo(-4.8, 0); sh.lineTo(4.8, 0); sh.lineTo(0, 2.6); sh.closePath(); const rg = new THREE.ExtrudeGeometry(sh, { depth: 10.4, bevelEnabled: false }); rg.translate(0, 0, -5.2); rg.rotateY(Math.PI / 2); B.add(rg, M.roofT, Geo.matrix(-5, 6.2, z)); } }
  B.build(root, 'street');
  // ------------------------------------------------------------------ trees (rooted: they bend and hold)
  T.trees = [];
  { const r = new RNG(29);
    for (let x = GT_W.park[0] + 8; x < GT_W.park[1] - 4; x += r.range(13, 17)) T.trees.push(gtBuildTree(root, x, r.range(13.5, 16.5), r.range(8, 10.5), r.next(), M));
    for (const x of [40, 95, 151, 207, 262]) T.trees.push(gtBuildTree(root, x, -8.2, r.range(6.5, 8.5), r.next(), M)); }
  // ------------------------------------------------------------------ the things that fall: the parked cars, the bins, the chair
  const VF = new VehicleFactory();
  T.fallers = GT_FALLERS.map((f) => {
    let o, L = f.len;
    if (f.k === 'car') { o = VF.build(f.type, f.col); o.group.rotation.y = f.dir > 0 ? 0 : Math.PI; }
    else if (f.k === 'bin') { o = { group: gtBuildBin(f.col) }; o.group.rotation.y = f.z > 0 ? -Math.PI / 2 : Math.PI / 2; }
    else { o = { group: gtBuildGardenChair() }; }
    const pg = new THREE.Group(), sq = new THREE.Group(); pg.add(sq); sq.add(o.group); root.add(pg);
    o.group.position.x = -L / 2;                                  // (the squash group's origin is the east end)
    return { f, o, pg, sq, L };
  });
  // ------------------------------------------------------------------ roof tiles (instanced)
  { const geo = new THREE.BoxGeometry(0.42, 0.014, 0.33), im = new THREE.InstancedMesh(geo, M.tile, GT_TILES.length); im.castShadow = true; im.frustumCulled = false; root.add(im); T.tiles = im; }
  // ------------------------------------------------------------------ dust (rises the old way), rain, the rainbow
  T.dust = gtPuffs(scene, 2600, { soft: 1.3 });
  // the rain: streaks near the camera (thin quads turned to face it), and the rain as a mass far off (a soft grey volume
  // behind the front of the river's water; you see its front coming down the street)
  { const N = 7000, geo = new THREE.BufferGeometry(), pos = new Float32Array(N * 12), uv = new Float32Array(N * 8), idx = new Uint32Array(N * 6);
    for (let i = 0; i < N; i++) { uv.set([0, 0, 1, 0, 1, 1, 0, 1], i * 8); idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6); }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
    const st = gtCanvas(8, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0.2)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    const mat = new THREE.MeshBasicMaterial({ color: '#e6edf2', map: gtTex(st, { repeat: false }), transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide, fog: true });
    const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = 7; scene.add(mesh);
    const wall = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { k: { value: 0 }, inside: { value: 0 }, front: { value: 0 }, col: { value: new THREE.Color('#8e99a2') } },
      vertexShader: 'varying vec3 vW; varying float vD; varying float vF; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vF = abs(normal.x); vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }',
      fragmentShader: `uniform float k; uniform float inside; uniform float front; uniform vec3 col; varying vec3 vW; varying float vD; varying float vF;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
        void main(){ float m = 0.7 + 0.3 * n(vW.yz * 0.025 + vW.x * 0.004) + 0.15 * n(vW.yz * 0.11);
          float a = k * mix(0.62, 0.07, inside) * m * smoothstep(0.0, 40.0, vD) * mix(smoothstep(0.0, 60.0, front - vW.x), 1.0, step(0.5, vF));
          gl_FragColor = vec4(col * (0.92 + 0.12 * m), a); }`,
    })); wall.frustumCulled = false; wall.renderOrder = 5; scene.add(wall);
    T.rain = { mesh, geo, pos, mat, N, wall }; }
  { const m = new THREE.Mesh(new THREE.RingGeometry(0.93, 1.0, 128, 1), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { a: { value: 0 } },
      vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform float a; varying vec2 vP;
        vec3 spec(float x){ return clamp(vec3(1.5 - abs(4.0*x - 3.4), 1.5 - abs(4.0*x - 2.2), 1.5 - abs(4.0*x - 0.9)), 0.0, 1.0); }
        void main(){ float r = length(vP); float x = (r - 0.93) / 0.07; float e = smoothstep(0.0, 0.12, x) * smoothstep(1.0, 0.82, x);
          gl_FragColor = vec4(spec(x) * e * a, 1.0); }`,
    })); m.frustumCulled = false; m.renderOrder = 6; scene.add(m); T.bow = m; }
  // (the impacts that raise dust: [s, x, z, size])
  T.impacts = GT_FALLERS.filter((f) => f.k === 'car').map((f) => [f.tHit, f.stop + f.len * f.crush, f.z, 1.0]);
  T.update = (s, o) => gtStreetUpdate(T, s, o || {});
  return T;
}

// ---------------------------------------------------------------------------------------------------------------------
// STREET · UPDATE (story time s)
// ---------------------------------------------------------------------------------------------------------------------
const _gtY = new THREE.Vector3(0, 1, 0), _gtV = new THREE.Vector3(), _gtQ = new THREE.Quaternion(), _gtE = new THREE.Euler(), _gtM = new THREE.Matrix4(), _gtS = new THREE.Vector3(1, 1, 1);

function gtStreetUpdate(T, s, o) {
  // ---- the timber houses opposite lean with yours (a little less: they're shorter)
  gtShear(T.north.matrix, gtLean(s) * 0.85, 0, 0, 0); T.north.matrixWorldNeedsUpdate = true;
  // ---- the cars, the bins, the chair: fall east, crumple into what's in front of them
  for (const F of T.fallers) {
    const f = F.f, r = gtFall(s, f.d, { vt: f.vt, e: f.k === 'gchair' ? 0.1 : 0.02 }), xw = f.x + r.x;
    const front = f.stop + f.len * f.crush, k = MathX.clamp((front - xw) / F.L, f.crush, 1);
    F.pg.position.set(xw + F.L * k, 0, f.z); F.sq.scale.set(k, 1 - 0.12 * (1 - k), 1);
    const hit = r.hit && s >= r.hit;
    F.pg.rotation.set(0, 0, 0);
    if (f.k === 'car') {
      if (hit) { const u = MathX.clamp((s - r.hit) / 0.15, 0, 1); F.pg.rotation.set(0.12 * (gtR(f.x, 3) - 0.5) * u, 0.3 * (gtR(f.x, 4) - 0.5) * u, 0.05 * u); }
      for (const w of F.o.wheels) w.rotation.z = 0;
    } else if (f.k === 'bin') {
      if (hit) F.pg.rotation.set(0.5 * (gtR(f.x, 5) - 0.5), 0.8 * gtR(f.x, 6), 0);
      F.o.group.position.y = 0;
    } else {                                                                        // the chair tumbles as it falls (drag)
      const u = Math.max(0, Math.min(s, r.hit || s)); F.pg.position.y = 0.35;
      F.pg.rotation.set(u * 0.9, u * 0.35, u * 1.3);
    }
  }
  // ---- the terrace: creeps, lets go, falls as one block, crumples house by house into the end of the street
  for (const H of T.terrace) {
    const r = gtTerHouse(H.i, s), g = H.g, k = r.k, sq = 1 - k * (1 - GT_TER.crushL / GT_TER.L);
    g.position.set(H.x0 + r.dx, 0, 0); g.scale.set(sq, 1 - 0.35 * k * H.r1, 1);
    g.rotation.set(0.04 * k * (H.r2 - 0.5), 0.12 * k * (H.r3 - 0.5), -0.06 * k * H.r1);
    g.visible = true;
  }
  // ---- the trees bend east (and whip back at the return)
  for (const tr of T.trees) {
    const b = gtTreeBend(s, tr.stiff, tr.seed);
    // (the bend is about the world's z axis, seen from inside the tree's own yaw; each segment takes a third of it)
    const ax = _gtV.set(0, 0, 1).applyAxisAngle(_gtY, -tr.yaw);
    for (const sg of tr.segs) sg.quaternion.setFromAxisAngle(ax, -b / 3);
  }
  // ---- roof tiles
  { const im = T.tiles; let n = 0;
    for (const t of GT_TILES) { const p = gtTile(t, s); if (!p) continue;
      _gtE.set(p.a * 0.7, p.a * 0.4, p.a); _gtQ.setFromEuler(_gtE); _gtV.set(p.x, p.y, p.z); _gtM.compose(_gtV, _gtQ, _gtS); im.setMatrixAt(n++, _gtM); }
    im.count = n; im.instanceMatrix.needsUpdate = true; }
}

// the dust: every impact at the end of the street raises a cloud that rises (the old way: the air keeps its old down)
// and spreads; the terrace's is a wall of it. Pure: each puff's place from (s − impact time)
function gtDust(T, s, cam) {
  const P = T.dust; P.begin();
  const add = (s0, x, z, size, n, seed, life) => {
    const u = s - s0; if (u <= 0 || u > life) return;
    for (let i = 0; i < n; i++) {
      const a = gtR(i, seed), b = gtR(i, seed + 1), c = gtR(i, seed + 2), rise = (1.2 + 2.6 * a) * Math.log(1 + u * 0.9) * size;
      const spread = (0.6 + 2.2 * Math.sqrt(u) * 0.35) * size;
      const x0 = x - 0.5 - 2.5 * b * size + 0.6 * Math.log(1 + u);                 // (falling dust drifts east, slowly)
      const al = 0.11 * Math.min(1, u * 3) * Math.pow(1 - u / life, 1.6) * (0.5 + 0.5 * c);
      const tone = 0.5 + 0.16 * c;
      P.add(x0, 0.4 + rise + 1.5 * c * size, z + (b - 0.5) * 2 * spread, (0.8 + 2.2 * a + 0.9 * Math.sqrt(u)) * size, al, tone, tone * 0.96, tone * 0.9);
    }
  };
  for (const [s0, x, z, sz] of T.impacts) add(s0, x, z, sz, 16, Math.round(x * 7 + z), 90);
  // the terrace: a cloud along the whole pile, the length of the hit; it rises 40 m and hangs there for minutes
  { const s0 = GT_TER.hit0, u = s - s0;
    if (u > 0 && u < 900) for (let i = 0; i < 900; i++) {
      const a = gtR(i, 401), b = gtR(i, 402), c = gtR(i, 403), d = gtR(i, 404);
      const rise = (4 + 32 * a) * (1 - Math.exp(-u / (8 + 20 * d)));
      const x = GT_W.end - 2 - 55 * b * b + 3 * Math.log(1 + u * 0.2) - 12 * a * Math.min(1, u / 40), z = 6 + 18 * (c - 0.3) * (1 + 0.6 * Math.min(1, u / 60));
      const al = 0.55 * Math.min(1, u * 1.5) * Math.exp(-u / (260 + 300 * d)) * (0.4 + 0.6 * c);
      const tone = 0.58 + 0.2 * c;
      P.add(x, 0.5 + rise, z, 2.2 + 6 * a + 0.22 * Math.sqrt(u) * (2 + 4 * c), al, tone, tone * 0.95, tone * 0.88);
    } }
  // the window going (the water and what fell with it, hitting the pile): a little spray, later
  P.end();
}

// the rain: the river's water arriving as drops, falling east at ~9.5 m/s (horizontally, to us), from the river's
// front onwards; at the return, everything still in the air falls down at once (the last of it ~9 s later). Drawn as
// streaks in a box around the camera; pure: every streak's place from s
function gtRainUpdate(T, s, cam) {
  const R = T.rain, k = gtRain(s), front = -GT_RIVER.dist + GT_RIVER.vDrop * (s - GT_RIVER.leave), back = s >= GTP.tBack, u = s - GTP.tBack;
  cam.getWorldPosition(_gtV);
  const cx = _gtV.x, cy = _gtV.y, cz = _gtV.z;
  // ---- the mass of rain, far off: from its front back to the river (it arrives as a wall); at the return it falls out
  const TOP = 100;                                                         // (the sheet spread as it fell: rain up to 100 m)
  const fallB = back ? 9 * (u - 0.9 * (1 - Math.exp(-u / 0.9))) : 0;
  { const W = R.wall; W.visible = back ? fallB < TOP : front > -2600;
    if (W.visible) { const x0 = back ? -2600 : Math.max(-2600, front - 2400), x1 = back ? 2600 : front, H = TOP - fallB;
      W.position.set((x0 + x1) / 2, H / 2, 0); W.scale.set(x1 - x0, H, 700); W.material.uniforms.k.value = 1; W.material.uniforms.front.value = back ? 1e6 : front; W.material.uniforms.inside.value = back || cx < front ? 1 : 0; } }
  // ---- the streaks round the camera
  R.mesh.visible = back ? fallB < TOP : front > cx - 40;
  if (!R.mesh.visible) return;
  const BX = 30, BY = 22, BZ = 30, v = GT_RIVER.vDrop, P = R.pos, N = R.N, L = 0.75, hw = 0.006;
  const kAt = (x) => gtSm(front - x, 0, 60) * (0.85 + 0.15 * Math.sin(s * 0.013));   // (the rain thickens over 60 m behind its front)
  let n = 0;
  const put = (x, y, z, dx, dy) => {
    // a quad from (x, y, z) to (x + dx·L, y + dy·L, z), turned to face the camera (none right at the lens)
    const ex = x + dx * L, ey = y + dy * L, ax = ex - x, ay = ey - y, vx = cx - x, vy = cy - y, vz = cz - z, dist = Math.hypot(vx, vy, vz);
    if (dist < 1.4) return;
    let wx = ay * vz, wy = -ax * vz, wz = ax * vy - ay * vx; const wl = Math.hypot(wx, wy, wz) || 1, sc = hw * Math.max(1, dist / 8) / wl;
    wx *= sc; wy *= sc; wz *= sc;
    const o = n * 12;
    P[o] = x - wx; P[o + 1] = y - wy; P[o + 2] = z - wz; P[o + 3] = x + wx; P[o + 4] = y + wy; P[o + 5] = z + wz;
    P[o + 6] = ex + wx; P[o + 7] = ey + wy; P[o + 8] = z + wz; P[o + 9] = ex - wx; P[o + 10] = ey - wy; P[o + 11] = z - wz;
    n++;
  };
  const dry = (x, y, z) => {
    if (x > GT_W.house.x[0] - 0.3 && x < 0.4 && Math.abs(z) < 5.5 && y < 8.9) return true;                 // your house (and your room)
    if (x > 0.4 && Math.abs(z) < 5.2 && y < 8.6 && gtR(Math.floor(x * 7 + z * 13 + y * 5), 811) > x / 45) return true;    // its rain shadow (filling in)
    if (z < -9.4 && z > -17.6 && y < 9.2 && x > 8 && x < GT_ST.hillX - 10) return true;                    // the houses opposite
    if (!back && s < GT_TER.release && z > 9.4 && z < 17.6 && y < 9.5 && x > 13 && x < 165) return true;  // the terrace (while it stands)
    return y < 0.03;
  };
  for (let i = 0; i < N; i++) {
    const a = gtR(i, 802), b = gtR(i, 803), c = gtR(i, 804);
    let x, y, z = cz + (c - 0.5) * BZ, dx, dy;
    if (!back) {
      // (the lattice moves east with the drops: x wraps inside the box)
      const xs = a * BX + v * s; x = cx - BX / 2 + (((xs - cx) % BX) + BX) % BX; y = cy + (b - 0.5) * BY;
      if (x > front || y > TOP || gtR(i, 801) > kAt(x) || dry(x, y, z)) continue;
      dx = -1; dy = 0;
    } else {
      // (at the return each drop keeps its eastward speed for a moment and falls from where it was, from up to 100 m; the
      // ground ends it)
      const xs = a * BX + v * GTP.tBack; x = cx - BX / 2 + (((xs - cx) % BX) + BX) % BX + v * 0.6 * (1 - Math.exp(-u / 0.6));
      const y0 = b * TOP; y = y0 - fallB;
      if (y < 0.02 || Math.abs(y - cy) > BY / 2 || gtR(i, 801) > 0.95) continue;
      if (dry(x, y0, z)) continue;
      const vx = v * Math.exp(-u / 0.6), vy = -9 * (1 - Math.exp(-u / 0.9)), vl = Math.hypot(vx, vy) || 1;
      dx = -vx / vl; dy = -vy / vl;
    }
    put(x, y, z, dx, dy);
  }
  R.geo.setDrawRange(0, n * 6); R.geo.attributes.position.needsUpdate = true;
  R.mat.opacity = 0.55;
}
// the rainbow: a ring 40.5°–42.5° round the point opposite the sun, where the rain is, facing the camera
function gtBowUpdate(T, s, cam, sun) {
  const k = gtRain(s) * (s < GTP.tBack ? 1 : 0), m = T.bow;
  m.visible = k > 0.02;
  if (!m.visible) return;
  cam.getWorldPosition(_gtV);
  const D = 90, anti = [-sun[0], -sun[1], -sun[2]];
  m.position.set(_gtV.x + anti[0] * D, _gtV.y + anti[1] * D, _gtV.z + anti[2] * D);
  m.lookAt(_gtV); const R = D * Math.tan(MathX.deg(42.5)); m.scale.set(R, R, 1);
  m.material.uniforms.a.value = 0.55 * k;
}
