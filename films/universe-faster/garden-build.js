/* =====================================================================
   GARDEN · BUILD — your back garden on a late-October night, built once (metres; the house's back wall is z = 0, the
   garden runs to −z, which faces SSE; +x is to the right, west-ish; y up).
     the house      two storeys of brick, the kitchen window and the back door lit, one bedroom window lit upstairs
     the patio      stone slabs, the bistro table (your mug of tea, a candle lantern), two chairs, pots
     the lawn       to the brick back wall (the cat's wall), wooden fences either side with solar string lights
     the telescope  a small white refractor on its tripod, pointed at Saturn
     the bird bath  a stone bowl on a pedestal with a little solar fountain jet
     beyond         the houses behind and either side (some windows lit), an apple tree, the shed, the town's glow
   The ground is in PLATES, so that later tonight it can come apart: A (the house, the patio and the near lawn), B (the
   far lawn, the bird bath, the tree, the shed, the back wall) and the neighbours' plots. Each plate is a slab of turf,
   soil and rock; the crack between A and B is a zig-zag across the lawn.
     uxBuildGarden(app, S) → { plates, parts… }
   ===================================================================== */

const UX_G = {
  houseW: 12, lawnW: 9.2, depth: 17,
  crack: [[-4.6, -9.1], [-3.0, -9.6], [-1.6, -9.0], [-0.2, -9.9], [1.1, -9.3], [2.6, -10.0], [3.6, -9.5], [4.6, -9.8]],   // A | B
  scope: [1.25, 0, -5.6], table: [-2.5, 0, -1.7], bath: [2.4, 0, -11.6], tree: [-3.0, 0, -12.6], shed: [3.2, 0, -15.0],
  wallZ: -16.8, wallH: 1.62, catAt: [-0.6, 1.62, -16.8],
};

// ---- canvases
function uxBrickCanvas(seed, base = [128, 74, 58], w = 512, h = 512) {
  const r = new RNG(seed);
  return uxCanvas(w, h, (g) => {
    g.fillStyle = '#5b544c'; g.fillRect(0, 0, w, h);                       // mortar
    const bh = 16, bw = 46;
    for (let y = 0, row = 0; y < h; y += bh, row++) for (let x = row % 2 ? -bw / 2 : 0; x < w; x += bw) {
      const k = r.range(-18, 14), c = base.map((v) => MathX.clamp(v + k + r.range(-6, 6), 0, 255));
      g.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`; g.fillRect(x + 1.5, y + 1.5, bw - 3, bh - 3);
      if (r.next() < 0.25) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x + 1.5, y + bh - 5, bw - 3, 3.5); }
    }
  });
}
function uxBoardsCanvas(seed, w = 256, h = 256) {
  const r = new RNG(seed);
  return uxCanvas(w, h, (g) => {
    for (let x = 0; x < w; x += 32) {
      const k = r.range(-12, 12); g.fillStyle = `rgb(${86 + k},${62 + k},${44 + k})`; g.fillRect(x, 0, 32, h);
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x, 0, 2, h);
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${r.next() < 0.5 ? '255,255,255' : '0,0,0'},0.05)`; g.fillRect(x + r.range(2, 30), r.range(0, h), 1, r.range(10, 60)); }
    }
  });
}
function uxGrassCanvas(seed, w = 512, h = 512) {
  const r = new RNG(seed);
  return uxCanvas(w, h, (g) => {
    const im = g.createImageData(w, h), d = im.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = (hash2(x, y) - 0.5) * 0.5 + (hash2(x >> 2, y >> 2) - 0.5) * 0.3 + (hash2(x >> 4, y >> 4) - 0.5) * 0.25;
      const stripe = 0.06 * Math.sign(Math.sin(x / w * Math.PI * 8));
      const v = 1 + n * 0.5 + stripe, i = (y * w + x) * 4;
      d[i] = 54 * v; d[i + 1] = 82 * v; d[i + 2] = 40 * v; d[i + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${r.next() < 0.6 ? '120,110,70' : '20,30,15'},0.25)`; g.fillRect(r.range(0, w), r.range(0, h), r.range(1, 3), r.range(1, 3)); }
  });
}
function uxSlabCanvas(seed, w = 512, h = 512) {
  const r = new RNG(seed);
  return uxCanvas(w, h, (g) => {
    g.fillStyle = '#3c3a37'; g.fillRect(0, 0, w, h);
    const s = 128;
    for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) {
      const k = r.range(-14, 14); g.fillStyle = `rgb(${132 + k},${126 + k},${116 + k})`; g.fillRect(x + 3, y + 3, s - 6, s - 6);
      for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(${r.next() < 0.5 ? '255,255,255' : '0,0,0'},0.06)`; g.fillRect(x + r.range(3, s - 6), y + r.range(3, s - 6), 2, 2); }
    }
  });
}
// the side of a slab: turf, soil, then rock strata (v down)
function uxStrataCanvas(seed, w = 256, h = 1024) {
  const r = new RNG(seed);
  return uxCanvas(w, h, (g) => {
    const band = (y0, y1, c) => { g.fillStyle = c; g.fillRect(0, y0, w, y1 - y0); };
    band(0, 10, '#2e4a22'); band(10, 70, '#3b2a1c'); band(70, 160, '#4a3a2c'); band(160, 330, '#5a5048'); band(330, 600, '#4a4440'); band(600, 1024, '#2e2a28');
    for (let i = 0; i < 1600; i++) { const y = r.range(10, h); g.fillStyle = `rgba(${r.next() < 0.5 ? '255,240,220' : '0,0,0'},${r.range(0.03, 0.12)})`; g.fillRect(r.range(0, w), y, r.range(2, 12), r.range(1, 6)); }
  });
}
// a terrace's back: brick or render, windows (some lit, curtains), a door. → { map, glow }
function uxBackFacade(seed, W = 512, H = 512) {
  const r = new RNG(seed * 13 + 5), lit = [];
  const walls = [[128, 74, 58], [150, 120, 96], [196, 186, 168], [112, 96, 86]], base = walls[r.int(0, walls.length - 1)];
  const map = uxBrickCanvas(seed, base, W, H);
  const g = map.getContext('2d');
  const win = (x, y, w, h, on) => {
    g.fillStyle = '#e8e2d8'; g.fillRect(x - 5, y - 5, w + 10, h + 10);
    g.fillStyle = on ? '#e9b56a' : '#1b2026'; g.fillRect(x, y, w, h);
    if (on) { g.fillStyle = 'rgba(120,60,30,0.45)'; g.fillRect(x, y, w * 0.22, h); g.fillRect(x + w * 0.78, y, w * 0.22, h); lit.push([x, y, w, h]); }
    g.fillStyle = '#d8d2c8'; g.fillRect(x + w / 2 - 2, y, 4, h); g.fillRect(x, y + h * 0.45, w, 4);
  };
  win(60, 90, 120, 130, r.next() < 0.45); win(300, 90, 120, 130, r.next() < 0.4);
  win(60, 320, 140, 120, r.next() < 0.6); g.fillStyle = '#2a2622'; g.fillRect(330, 300, 90, 212);
  const glow = uxCanvas(W, H, (q) => { q.fillStyle = '#000'; q.fillRect(0, 0, W, H); for (const [x, y, w, h] of lit) { q.fillStyle = '#ffc070'; q.fillRect(x, y, w, h); q.fillStyle = 'rgba(0,0,0,0.5)'; q.fillRect(x, y, w * 0.22, h); q.fillRect(x + w * 0.78, y, w * 0.22, h); } });
  return { map, glow, lit: lit.length };
}

// ---- small builders
// a rod (cylinder) from point a to point b
function uxRod(a, b, r, mat, parent, seg = 8) {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length() || 1e-6;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, seg), mat);
  m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.divideScalar(L));
  m.castShadow = m.receiveShadow = true; parent.add(m);
  return m;
}
function uxGable(w, d, h, mat) {                         // a pitched roof (ridge along x), sitting on y = 0
  const s = new THREE.Shape(); s.moveTo(-d / 2, 0); s.lineTo(d / 2, 0); s.lineTo(0, h); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false }); geo.rotateY(Math.PI / 2); geo.translate(-w / 2, 0, 0);
  return new THREE.Mesh(geo, mat);
}
function uxBlob(r, seed, detail = 1) {                  // a lumpy low-poly blob (a shrub, a tree's crown)
  const geo = new THREE.IcosahedronGeometry(r, detail), p = geo.attributes.position, rr = new RNG(seed);
  const k = [rr.range(0, 9), rr.range(0, 9), rr.range(0, 9)];
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), f = 1 + 0.16 * Math.sin(x * 3.1 + k[0]) * Math.sin(y * 2.7 + k[1]) + 0.1 * Math.sin(z * 4.3 + k[2]); p.setXYZ(i, x * f, y * f * 0.85, z * f); }
  geo.computeVertexNormals();
  return geo;
}
// a slab under a polygon (x, z points, counter-clockwise from above): turf on top, strata down its sides
function uxSlab(poly, depth, topMat, sideMat) {
  const s = new THREE.Shape(); poly.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2); geo.translate(0, -depth, 0);          // top at y = 0
  // side UVs: u along the edge, v down
  const P = geo.attributes.position, N = geo.attributes.normal, UV = geo.attributes.uv;
  for (let i = 0; i < P.count; i++) {
    if (Math.abs(N.getY(i)) > 0.5) { UV.setXY(i, P.getX(i) / 4, P.getZ(i) / 4); continue; }
    UV.setXY(i, (P.getX(i) + P.getZ(i)) / 6, -P.getY(i) / depth);
  }
  geo.clearGroups(); const idx = geo.index ? geo.index.array : null;
  // (one material per face: top/bottom vs sides)
  const n = idx ? idx.length : P.count, mats = [topMat, sideMat];
  const tri = [];
  for (let i = 0; i < n; i += 3) { const a = idx ? idx[i] : i; tri.push(Math.abs(N.getY(a)) > 0.5 ? 0 : 1); }
  let start = 0;
  for (let i = 1; i <= tri.length; i++) if (i === tri.length || tri[i] !== tri[start]) { geo.addGroup(start * 3, (i - start) * 3, tri[start]); start = i; }
  const m = new THREE.Mesh(geo, mats); m.receiveShadow = true; m.castShadow = true;
  return m;
}

function uxBuildGarden(app, S) {
  const scene = S.scene, G = UX_G, P = {};
  const tex = (c, rx, ry) => { const t = uxTex(c); t.repeat.set(rx, ry); return t; };
  const M = {
    brick: uxStd('#ffffff', 0.92, 0, { map: tex(uxBrickCanvas(3), 3, 2) }),
    wallBrick: uxStd('#ffffff', 0.92, 0, { map: tex(uxBrickCanvas(4, [118, 70, 56]), 4, 0.6) }),
    coping: uxStd('#8d877d', 0.85),
    fence: uxStd('#ffffff', 0.9, 0, { map: tex(uxBoardsCanvas(5), 4, 1) }),
    post: uxStd('#4a3626', 0.9),
    grass: uxStd('#ffffff', 0.97, 0, { map: tex(uxGrassCanvas(6), 3, 4) }),
    slab: uxStd('#ffffff', 0.8, 0, { map: tex(uxSlabCanvas(7), 3, 1) }),
    strata: uxStd('#ffffff', 0.95, 0, { map: (() => { const t = uxTex(uxStrataCanvas(8)); t.wrapT = THREE.ClampToEdgeWrapping; return t; })() }),
    soil: uxStd('#3a2c20', 0.95),
    sill: uxStd('#e4ded2', 0.6),
    frame: uxStd('#ece8e0', 0.5),
    glassLit: new THREE.MeshStandardMaterial({ color: '#2a1e12', emissive: '#ffb45c', emissiveIntensity: 1.25, roughness: 0.2 }),
    glassDark: uxStd('#141a22', 0.15, 0.2),
    door: uxStd('#2f3e4a', 0.6),
    roof: uxStd('#3a3634', 0.85),
    leaf: uxStd('#1f3320', 0.9, 0, { flatShading: true }),
    leaf2: uxStd('#2c4226', 0.9, 0, { flatShading: true }),
    bark: uxStd('#3a2c22', 0.95),
    stone: uxStd('#8c877c', 0.85),
    stoneDark: uxStd('#6e6a62', 0.9),
    water: new THREE.MeshStandardMaterial({ color: '#16202a', roughness: 0.05, metalness: 0.4 }),
    metal: uxStd('#24332c', 0.45, 0.6),
    white: uxStd('#e8e6e2', 0.35, 0.1),
    black: uxStd('#141414', 0.5, 0.3),
    ceramic: uxStd('#f0ece4', 0.25),
    tea: new THREE.MeshStandardMaterial({ color: '#6a3a18', roughness: 0.1 }),
    wax: uxStd('#d8cdb4', 0.75),
    pot: uxStd('#9a5a3e', 0.85),
    shed: uxStd('#55604e', 0.9, 0, { map: tex(uxBoardsCanvas(9), 2, 1) }),
    bulb: new THREE.MeshBasicMaterial({ color: '#ffcf86' }),
    wire: uxStd('#111111', 0.6),
  };
  P.M = M;
  // ---------------------------------------------------------------- the plates
  const plates = P.plates = {};
  const plate = (name) => { const g = new THREE.Group(); g.name = name; scene.add(g); plates[name] = g; return g; };
  const A = plate('A'), B = plate('B'), NB = plate('back'), NL = plate('left'), NR = plate('right');
  const W2 = G.lawnW / 2, crack = G.crack;
  // plate A: from the house (z = +0.6, under the wall) to the crack; plate B: the crack to the back wall
  const polyA = [[-W2 - 0.2, 0.6], [W2 + 0.2, 0.6], ...crack.slice().reverse().map(([x, z]) => [Math.sign(x) * Math.min(Math.abs(x), W2 + 0.2), z])];
  const polyB = [...crack.map(([x, z]) => [Math.sign(x) * Math.min(Math.abs(x), W2 + 0.2), z]), [W2 + 0.2, G.wallZ - 0.3], [-W2 - 0.2, G.wallZ - 0.3]];
  const ccw = (p) => { let a = 0; for (let i = 0; i < p.length; i++) { const [x1, z1] = p[i], [x2, z2] = p[(i + 1) % p.length]; a += x1 * (-z2) - x2 * (-z1); } return a > 0 ? p : p.slice().reverse(); };
  const slabA = uxSlab(ccw(polyA), 9, M.grass, M.strata); A.add(slabA);
  const slabB = uxSlab(ccw(polyB), 9, M.grass, M.strata); B.add(slabB);
  P.slabA = slabA; P.slabB = slabB;
  // the patio (on A)
  uxBox(G.lawnW, 0.06, 3.0, M.slab, 0, 0.03, -1.5, A);
  uxBox(G.lawnW, 0.12, 0.08, M.stoneDark, 0, 0.06, -3.02, A);
  // ---------------------------------------------------------------- the house (on A)
  const house = P.house = new THREE.Group(); A.add(house);
  uxBox(G.houseW, 6.2, 0.35, M.brick, 0, 3.1, 0.18, house);
  uxBox(G.houseW, 6.2, 8, M.brick, 0, 3.1, 4.4, house);
  const roof = uxGable(G.houseW + 0.4, 8.6, 3.0, M.roof); roof.position.set(0, 6.2, 4.4); roof.castShadow = true; house.add(roof);
  uxBox(0.9, 1.4, 0.7, M.brick, 3.4, 9.4, 4.4, house);                                                   // a chimney
  const win = (x, y, w, h, lit, parent = house) => {
    uxBox(w + 0.16, 0.08, 0.2, M.sill, x, y - h / 2 - 0.05, -0.05, parent);
    uxBox(w + 0.06, h + 0.06, 0.06, M.frame, x, y, -0.01, parent);
    const pane = uxBox(w, h, 0.03, lit ? M.glassLit : M.glassDark, x, y, -0.05, parent);
    uxBox(0.05, h, 0.05, M.frame, x, y, -0.07, parent); uxBox(w, 0.05, 0.05, M.frame, x, y + h * 0.1, -0.07, parent);
    return pane;
  };
  P.kitchen = win(-1.6, 1.55, 1.8, 1.15, true);
  win(-3.9, 1.55, 1.2, 1.15, false);
  P.bedroom = win(-1.6, 4.3, 1.3, 1.1, true); win(2.2, 4.3, 1.3, 1.1, false); win(-4.4, 4.3, 1.0, 1.1, false);
  // the back door: glazed top half, lit
  uxBox(0.98, 2.1, 0.06, M.door, 1.6, 1.08, -0.02, house);
  uxBox(0.6, 0.8, 0.03, M.glassLit, 1.6, 1.62, -0.06, house);
  uxBox(1.2, 0.1, 0.5, M.stone, 1.6, 0.05, -0.25, house);
  // a wall light by the door (off) and a drainpipe
  uxCyl(0.04, 0.04, 6.0, M.black, 3.0, 3.0, -0.08, house, 8);
  // ---------------------------------------------------------------- the fences, the back wall
  const fenceRun = (x, z0, z1, parent) => {
    const L = Math.abs(z1 - z0), zc = (z0 + z1) / 2;
    const f = uxBox(0.05, 1.8, L, M.fence, x, 0.9, zc, parent); f.material = M.fence;
    for (let z = z0; z >= z1 - 1e-6; z -= 1.83) uxBox(0.1, 1.9, 0.1, M.post, x, 0.95, z, parent);
    return f;
  };
  fenceRun(-W2 - 0.06, -0.2, crack[0][1], A); fenceRun(W2 + 0.06, -0.2, crack[crack.length - 1][1], A);
  fenceRun(-W2 - 0.06, crack[0][1] - 0.05, G.wallZ, B); fenceRun(W2 + 0.06, crack[crack.length - 1][1] - 0.05, G.wallZ, B);
  uxBox(G.lawnW + 0.3, G.wallH, 0.26, M.wallBrick, 0, G.wallH / 2, G.wallZ, B);
  uxBox(G.lawnW + 0.36, 0.08, 0.34, M.coping, 0, G.wallH + 0.04, G.wallZ, B);
  // ---------------------------------------------------------------- borders: shrubs, a flower bed, pots
  const r = new RNG(41);
  const shrub = (x, z, s, parent, m = M.leaf) => { const o = uxMesh(uxBlob(s, r.int(0, 999)), m, x, s * 0.7, z, parent); o.rotation.y = r.range(0, 6); return o; };
  for (let z = -3.6; z > G.wallZ + 0.6; z -= r.range(0.9, 1.5)) {
    const parent = z > -9.4 ? A : B;
    if (r.next() < 0.75) shrub(-W2 + 0.45, z, r.range(0.35, 0.6), parent, r.next() < 0.5 ? M.leaf : M.leaf2);
    if (r.next() < 0.6) shrub(W2 - 0.45, z, r.range(0.3, 0.55), parent, r.next() < 0.5 ? M.leaf : M.leaf2);
  }
  uxBox(G.lawnW - 0.2, 0.05, 0.9, M.soil, 0, 0.02, G.wallZ + 0.6, B);
  for (let i = 0; i < 7; i++) shrub(-3.6 + i * 1.2 + r.range(-0.2, 0.2), G.wallZ + 0.6, r.range(0.25, 0.42), B, i % 2 ? M.leaf2 : M.leaf);
  for (const [x, z, s] of [[-4.0, -0.6, 0.32], [-0.2, -0.5, 0.26], [4.0, -0.7, 0.36], [4.0, -2.6, 0.28]]) {
    uxCyl(s * 0.9, s * 0.7, s * 1.3, M.pot, x, s * 0.65, z, A, 14); shrub(x, z + 0.0, s * 0.95, A, M.leaf2).position.y = s * 1.5;
  }
  // ---------------------------------------------------------------- the apple tree, the shed (on B)
  const tree = P.tree = new THREE.Group(); tree.position.set(G.tree[0], 0, G.tree[2]); B.add(tree);
  uxCyl(0.13, 0.18, 2.1, M.bark, 0, 1.05, 0, tree, 9);
  const br = uxCyl(0.06, 0.09, 1.3, M.bark, 0.35, 2.2, 0.1, tree, 7); br.rotation.z = -0.6;
  const br2 = uxCyl(0.05, 0.08, 1.2, M.bark, -0.3, 2.3, -0.1, tree, 7); br2.rotation.z = 0.7;
  for (const [x, y, z, s] of [[0, 3.0, 0, 1.25], [0.9, 2.7, 0.2, 0.9], [-0.9, 2.8, -0.2, 0.95], [0.2, 3.6, -0.3, 0.85], [-0.3, 2.5, 0.6, 0.8]]) uxMesh(uxBlob(s, r.int(0, 999)), r.next() < 0.5 ? M.leaf : M.leaf2, x, y, z, tree);
  const shed = P.shed = new THREE.Group(); shed.position.set(G.shed[0], 0, G.shed[2]); B.add(shed);
  uxBox(2.2, 2.0, 1.8, M.shed, 0, 1.0, 0, shed);
  const sr = uxGable(2.4, 2.1, 0.55, M.roof); sr.position.set(0, 2.0, 0); sr.rotation.y = Math.PI / 2; sr.castShadow = true; shed.add(sr);
  uxBox(0.8, 1.7, 0.04, uxStd('#3d4638', 0.9), -0.4, 0.9, 0.92, shed);
  // ---------------------------------------------------------------- the telescope (on A, loose: it can float)
  const scope = P.scope = new THREE.Group(); scope.position.set(...G.scope); A.add(scope);
  const head = new THREE.Group(); head.position.set(0, 1.18, 0); scope.add(head);
  for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.3; uxRod([Math.sin(a) * 0.48, 0, Math.cos(a) * 0.48], [Math.sin(a) * 0.05, 1.15, Math.cos(a) * 0.05], 0.017, M.black, scope, 6); }
  uxCyl(0.06, 0.06, 0.12, M.black, 0, 0, 0, head, 12);
  const tube = P.tube = new THREE.Group(); tube.position.set(0, 0.1, 0); head.add(tube);
  { const d = new THREE.Vector3(...uxSkyDir(UX_SKY.saturn.az, UX_SKY.saturn.alt)); tube.lookAt(d.x * 100, d.y * 100 + 1.28, d.z * 100); }
  const tb = uxCyl(0.058, 0.058, 0.95, M.white, 0, 0, 0, tube, 20); tb.rotation.x = Math.PI / 2; tb.position.z = 0.12;
  const dew = uxCyl(0.068, 0.066, 0.24, M.black, 0, 0, 0, tube, 20); dew.rotation.x = Math.PI / 2; dew.position.z = 0.66;
  const fo = uxCyl(0.03, 0.03, 0.12, M.black, 0, 0, 0, tube, 10); fo.rotation.x = Math.PI / 2; fo.position.z = -0.4;
  const ep = uxCyl(0.016, 0.018, 0.08, M.black, 0, 0.04, -0.46, tube, 8); ep.rotation.x = -0.6;
  const fi = uxCyl(0.014, 0.014, 0.22, M.white, 0.07, 0.07, 0.15, tube, 8); fi.rotation.x = Math.PI / 2;
  // ---------------------------------------------------------------- the bird bath and its fountain (on B)
  const bath = P.bath = new THREE.Group(); bath.position.set(...G.bath); B.add(bath);
  uxCyl(0.3, 0.36, 0.08, M.stoneDark, 0, 0.04, 0, bath, 16);
  uxCyl(0.11, 0.15, 0.78, M.stone, 0, 0.45, 0, bath, 14);
  const bowl = new THREE.Mesh(new THREE.LatheGeometry([[0.04, 0], [0.32, 0.05], [0.42, 0.14], [0.44, 0.16], [0.4, 0.16], [0.3, 0.08], [0, 0.07]].map(([x, y]) => new THREE.Vector2(x, y)), 24), M.stone);
  bowl.position.y = 0.84; bowl.castShadow = bowl.receiveShadow = true; bath.add(bowl);
  P.bathWater = uxCyl(0.38, 0.38, 0.01, M.water, 0, 0.98, 0, bath, 24);
  uxCyl(0.02, 0.025, 0.08, M.black, 0, 1.0, 0, bath, 8);                                                // the jet's nozzle
  // ---------------------------------------------------------------- the bistro set (on A), the mug, the lantern
  const table = P.table = new THREE.Group(); table.position.set(...G.table); A.add(table);
  uxCyl(0.36, 0.36, 0.025, M.metal, 0, 0.72, 0, table, 28); uxCyl(0.02, 0.02, 0.7, M.metal, 0, 0.36, 0, table, 8); uxCyl(0.22, 0.24, 0.02, M.metal, 0, 0.01, 0, table, 18);
  const chair = (x, z, ry) => {
    const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry; A.add(c);
    uxCyl(0.2, 0.2, 0.025, M.metal, 0, 0.46, 0, c, 20);
    for (const [lx, lz] of [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]]) uxCyl(0.012, 0.012, 0.46, M.metal, lx, 0.23, lz, c, 6);
    uxBox(0.36, 0.42, 0.025, M.metal, 0, 0.7, 0.19, c); return c;
  };
  P.chairs = [chair(-2.5, -1.0, 0.1), chair(-3.2, -2.1, -2.0)];
  const mug = P.mug = new THREE.Group(); mug.position.set(0.12, 0.735, 0.08); table.add(mug);
  const mb = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.04, 0], [0.042, 0.01], [0.042, 0.095], [0.038, 0.095], [0.038, 0.012], [0, 0.012]].map(([x, y]) => new THREE.Vector2(x, y)), 20), M.ceramic);
  mb.castShadow = true; mug.add(mb);
  const hd = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.007, 8, 14, Math.PI * 1.2), M.ceramic); hd.position.set(0.045, 0.05, 0); hd.rotation.z = -Math.PI * 0.6; mug.add(hd);
  P.teaTop = uxCyl(0.037, 0.037, 0.004, M.tea, 0, 0.082, 0, mug, 20);
  const lantern = P.lantern = new THREE.Group(); lantern.position.set(-0.14, 0.735, -0.06); table.add(lantern);
  uxBox(0.13, 0.015, 0.13, M.black, 0, 0.008, 0, lantern); uxBox(0.13, 0.015, 0.13, M.black, 0, 0.23, 0, lantern);
  for (const [x, z] of [[-0.06, -0.06], [0.06, -0.06], [-0.06, 0.06], [0.06, 0.06]]) uxBox(0.01, 0.22, 0.01, M.black, x, 0.12, z, lantern);
  const roofL = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.07, 4), M.black); roofL.position.y = 0.27; roofL.rotation.y = Math.PI / 4; lantern.add(roofL);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.21, 0.12), new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.07, roughness: 0.35, metalness: 0, envMapIntensity: 0.15, depthWrite: false }));
  glass.position.y = 0.12; lantern.add(glass);
  uxCyl(0.022, 0.022, 0.07, M.wax, 0, 0.05, 0, lantern, 12);
  P.wickAt = [0, 0.095, 0];
  // ---------------------------------------------------------------- the string lights (on A and B fences, the left one)
  P.bulbs = [];
  const string = (x, z0, z1, parent, n) => {
    const pts = []; for (let i = 0; i <= n; i++) { const u = i / n, z = z0 + (z1 - z0) * u, sag = 0.16 * Math.sin(Math.PI * ((u * 4) % 1)); pts.push([x, 1.86 - sag, z]); }
    for (let i = 0; i < pts.length; i++) {
      const b = uxMesh(new THREE.SphereGeometry(0.03, 8, 6), M.bulb, pts[i][0], pts[i][1] - 0.04, pts[i][2], parent); b.castShadow = false; P.bulbs.push(b);
      if (i) uxRod(pts[i - 1], pts[i], 0.004, M.wire, parent, 4).castShadow = false;
    }
  };
  string(-W2 + 0.02, -0.4, crack[0][1] + 0.1, A, 18); string(-W2 + 0.02, crack[0][1] - 0.2, G.wallZ + 0.2, B, 16);
  // ---------------------------------------------------------------- the neighbours: houses behind and either side
  const facade = (seed, w, h, x, z, ry, parent, depth = 7) => {
    const F = uxBackFacade(seed), hs = new THREE.Group(); hs.position.set(x, 0, z); hs.rotation.y = ry; parent.add(hs);
    const fm = new THREE.MeshStandardMaterial({ map: uxTex(F.map, { repeat: false }), emissiveMap: uxTex(F.glow, { repeat: false }), emissive: '#ffffff', emissiveIntensity: 1.0, roughness: 0.9 });
    const front = new THREE.Mesh(new THREE.PlaneGeometry(w, h), fm); front.position.set(0, h / 2, 0); front.receiveShadow = true; hs.add(front);
    (P.neighbours = P.neighbours || []).push(front);                  // (their lit windows go out with yours)
    uxBox(w, h, depth, M.brick, 0, h / 2, -depth / 2 - 0.01, hs).material = uxStd('#4a3a32', 0.95);      // (the body behind its front)
    const rf = uxGable(w + 0.3, depth + 0.6, 2.4, M.roof); rf.position.set(0, h, -depth / 2); hs.add(rf);
    if (seed % 2) uxBox(0.7, 1.0, 0.6, M.brick, w * 0.3, h + 1.9, -depth / 2, hs);
    return hs;
  };
  { // behind the back wall: their gardens, then a terrace facing you
    const gnd = uxSlab(ccw([[-30, G.wallZ - 0.32], [30, G.wallZ - 0.32], [30, -60], [-30, -60]]), 9, M.grass, M.strata); NB.add(gnd);
    for (let i = 0; i < 6; i++) facade(11 + i, 5.4, 6.0, -13.5 + i * 5.45, -32, 0, NB);
    for (let i = 0; i < 5; i++) { uxBox(0.05, 1.8, 14, M.fence, -10.9 + i * 5.45, 0.9, -24.6, NB); }
    for (let i = 0; i < 9; i++) shrub(-14 + i * 3.6 + r.range(-0.6, 0.6), -19 - r.range(0, 9), r.range(0.5, 1.1), NB, i % 2 ? M.leaf : M.leaf2);
    const t2 = new THREE.Group(); t2.position.set(6.5, 0, -22); NB.add(t2); uxCyl(0.2, 0.28, 3.2, M.bark, 0, 1.6, 0, t2, 8);
    for (const [x, y, z, s] of [[0, 4.6, 0, 2.0], [1.4, 4.0, 0.5, 1.4], [-1.3, 4.2, -0.4, 1.5], [0.2, 5.6, 0, 1.3]]) uxMesh(uxBlob(s, r.int(0, 999)), M.leaf, x, y, z, t2);
  }
  { // either side: next door's gardens and the backs of their houses (in line with yours)
    const gl = uxSlab(ccw([[-30, 6], [-W2 - 0.22, 6], [-W2 - 0.22, G.wallZ - 0.32], [-30, G.wallZ - 0.32]]), 9, M.grass, M.strata); NL.add(gl);
    const gr = uxSlab(ccw([[W2 + 0.22, 6], [30, 6], [30, G.wallZ - 0.32], [W2 + 0.22, G.wallZ - 0.32]]), 9, M.grass, M.strata); NR.add(gr);
    facade(31, 11.6, 6.2, -6 - 6.2, 0.02, Math.PI, NL, 8); facade(32, 11.6, 6.2, 6 + 6.2, 0.02, Math.PI, NR, 8);
    for (let i = 0; i < 4; i++) { shrub(-6 - r.range(0, 4), -4 - i * 3, r.range(0.5, 0.9), NL); shrub(6 + r.range(0, 4), -5 - i * 3, r.range(0.5, 0.9), NR); }
    uxBox(0.05, 1.8, 17, M.fence, -W2 - 6.4, 0.9, -8.4, NL); uxBox(0.05, 1.8, 17, M.fence, W2 + 6.4, 0.9, -8.4, NR);
  }
  // the far town: a band of rooftops and a church spire against the glow (not part of any plate: it is far away)
  const far = P.far = new THREE.Group(); scene.add(far);
  const roofM = uxStd('#141618', 0.95);
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 1.2 - Math.PI * 0.6, d = r.range(70, 110), x = Math.sin(a) * d, z = -Math.cos(a) * d - 10;
    const h = r.range(5, 9), w = r.range(5, 9), o = uxGable(w, 6, 2.2, roofM); o.position.set(x, h, z); o.rotation.y = -a + Math.PI / 2; far.add(o);
    uxBox(w, h, 6, roofM, x, h / 2, z, far).rotation.y = -a + Math.PI / 2;
  }
  { const sp = new THREE.Mesh(new THREE.ConeGeometry(1.3, 9, 6), roofM); sp.position.set(-24, 18, -96); far.add(sp); uxBox(3, 13.5, 3, roofM, -24, 6.75, -96, far); }
  far.traverse((m) => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; } });
  return P;
}
