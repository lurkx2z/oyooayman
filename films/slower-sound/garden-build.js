/* =====================================================================
   GARDEN · BUILD — your back garden on a late-October night, built once (metres; the house's back wall is z = 0, the
   garden runs to −z, which faces SSE; +x is to the right, west-ish; y up).
     the house      two storeys of brick round a real kitchen (its window looks down the garden: later you watch from
                    it) and a hall behind the back door (with a cat flap); one bedroom window lit upstairs
     the patio      stone slabs, the bistro table (a mug, a lantern), two chairs, pots
     the lawn       to the brick back wall (the cat's wall), wooden fences either side with solar string lights
     the telescope  a small white refractor on its tripod, pointed at the Andromeda galaxy (by Mirach)
     the bird bath  a stone bowl on a pedestal, its water under a skin of ice
     beyond         the houses behind and either side (some windows lit), an apple tree, the shed, the town
   The ground is in plates (A: the house, the patio, the near lawn; B: the far lawn to the back wall; the neighbours'
   plots), as in the faster film; tonight they stay put.
     ssBuildGarden(app, S) → { parts… }
   ===================================================================== */

const SS_G = {
  houseW: 12, lawnW: 9.2, depth: 17,
  crack: [[-4.6, -9.1], [-3.0, -9.6], [-1.6, -9.0], [-0.2, -9.9], [1.1, -9.3], [2.6, -10.0], [3.6, -9.5], [4.6, -9.8]],   // A | B
  scope: [1.25, 0, -5.6], table: [-2.5, 0, -1.7], bath: [2.4, 0, -11.6], tree: [-3.0, 0, -12.6], shed: [3.2, 0, -15.0],
  wallZ: -16.8, wallH: 1.62, catAt: [-0.6, 1.62, -16.8],
  kWin: [-2.5, -0.7, 0.975, 2.125],          // the kitchen window's opening: x0, x1, y0, y1
  door: [1.11, 2.09, 0, 2.13],                // the back door's opening
  kitchen: [-4.6, 0.95, 3.7],                 // the kitchen: x0, x1, its far wall's z
  frostAt: [0.35, 0, -3.9],                   // the patch of frosty grass in the close-up
};

// ---- canvases
function ssBrickCanvas(seed, base = [128, 74, 58], w = 512, h = 512) {
  const r = new RNG(seed);
  return ssCanvas(w, h, (g) => {
    g.fillStyle = '#5b544c'; g.fillRect(0, 0, w, h);                       // mortar
    const bh = 16, bw = 46;
    for (let y = 0, row = 0; y < h; y += bh, row++) for (let x = row % 2 ? -bw / 2 : 0; x < w; x += bw) {
      const k = r.range(-18, 14), c = base.map((v) => MathX.clamp(v + k + r.range(-6, 6), 0, 255));
      g.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`; g.fillRect(x + 1.5, y + 1.5, bw - 3, bh - 3);
      if (r.next() < 0.25) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x + 1.5, y + bh - 5, bw - 3, 3.5); }
    }
  });
}
function ssBoardsCanvas(seed, w = 256, h = 256) {
  const r = new RNG(seed);
  return ssCanvas(w, h, (g) => {
    for (let x = 0; x < w; x += 32) {
      const k = r.range(-12, 12); g.fillStyle = `rgb(${86 + k},${62 + k},${44 + k})`; g.fillRect(x, 0, 32, h);
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x, 0, 2, h);
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${r.next() < 0.5 ? '255,255,255' : '0,0,0'},0.05)`; g.fillRect(x + r.range(2, 30), r.range(0, h), 1, r.range(10, 60)); }
    }
  });
}
function ssGrassCanvas(seed, w = 512, h = 512) {
  const r = new RNG(seed);
  return ssCanvas(w, h, (g) => {
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
function ssSlabCanvas(seed, w = 512, h = 512) {
  const r = new RNG(seed);
  return ssCanvas(w, h, (g) => {
    g.fillStyle = '#3c3a37'; g.fillRect(0, 0, w, h);
    const s = 128;
    for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) {
      const k = r.range(-14, 14); g.fillStyle = `rgb(${132 + k},${126 + k},${116 + k})`; g.fillRect(x + 3, y + 3, s - 6, s - 6);
      for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(${r.next() < 0.5 ? '255,255,255' : '0,0,0'},0.06)`; g.fillRect(x + r.range(3, s - 6), y + r.range(3, s - 6), 2, 2); }
    }
  });
}
// the side of a slab: turf, soil, then rock strata (v down)
function ssStrataCanvas(seed, w = 256, h = 1024) {
  const r = new RNG(seed);
  return ssCanvas(w, h, (g) => {
    const band = (y0, y1, c) => { g.fillStyle = c; g.fillRect(0, y0, w, y1 - y0); };
    band(0, 10, '#2e4a22'); band(10, 70, '#3b2a1c'); band(70, 160, '#4a3a2c'); band(160, 330, '#5a5048'); band(330, 600, '#4a4440'); band(600, 1024, '#2e2a28');
    for (let i = 0; i < 1600; i++) { const y = r.range(10, h); g.fillStyle = `rgba(${r.next() < 0.5 ? '255,240,220' : '0,0,0'},${r.range(0.03, 0.12)})`; g.fillRect(r.range(0, w), y, r.range(2, 12), r.range(1, 6)); }
  });
}
// the bird bath's ice (seen from above, the disc's top cap): grey-blue, white frost round the rim and in patches,
// trapped bubbles, two cracks
function ssIceCanvas(seed, w = 512) {
  const r = new RNG(seed);
  return ssCanvas(w, w, (g) => {
    const c = w / 2, gr = g.createRadialGradient(c, c, 0, c, c, c);
    gr.addColorStop(0, '#8496a4'); gr.addColorStop(0.7, '#9aabb7'); gr.addColorStop(0.9, '#cfd8de'); gr.addColorStop(1, '#e8edf0');
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
    for (let i = 0; i < 26; i++) { const a = r.range(0, 6.28), d = r.range(0.1, 0.8) * c, rr = r.range(12, 46); const p = g.createRadialGradient(c + Math.cos(a) * d, c + Math.sin(a) * d, 0, c + Math.cos(a) * d, c + Math.sin(a) * d, rr); p.addColorStop(0, 'rgba(235,240,244,0.5)'); p.addColorStop(1, 'rgba(235,240,244,0)'); g.fillStyle = p; g.fillRect(0, 0, w, w); }
    for (let i = 0; i < 260; i++) { const a = r.range(0, 6.28), d = Math.sqrt(r.next()) * c * 0.85, rr = r.range(1, 4.5); g.fillStyle = `rgba(245,248,250,${r.range(0.35, 0.8)})`; g.beginPath(); g.ellipse(c + Math.cos(a) * d, c + Math.sin(a) * d, rr, rr * r.range(0.6, 1), r.range(0, 3), 0, 6.28); g.fill(); }
    g.strokeStyle = 'rgba(240,244,248,0.7)'; g.lineWidth = 1.6;
    for (let k = 0; k < 2; k++) { let x = c + r.range(-0.3, 0.3) * c, y = c + r.range(-0.3, 0.3) * c, a = r.range(0, 6.28); g.beginPath(); g.moveTo(x, y); for (let i = 0; i < 14; i++) { a += r.range(-0.5, 0.5); x += Math.cos(a) * 18; y += Math.sin(a) * 18; g.lineTo(x, y); } g.stroke(); }
  });
}
// a terrace's back: brick or render, windows (some lit, curtains), a door. → { map, glow }
function ssBackFacade(seed, W = 512, H = 512) {
  const r = new RNG(seed * 13 + 5), lit = [];
  const walls = [[128, 74, 58], [150, 120, 96], [196, 186, 168], [112, 96, 86]], base = walls[r.int(0, walls.length - 1)];
  const map = ssBrickCanvas(seed, base, W, H);
  const g = map.getContext('2d');
  const win = (x, y, w, h, on) => {
    g.fillStyle = '#e8e2d8'; g.fillRect(x - 5, y - 5, w + 10, h + 10);
    g.fillStyle = on ? '#e9b56a' : '#1b2026'; g.fillRect(x, y, w, h);
    if (on) { g.fillStyle = 'rgba(120,60,30,0.45)'; g.fillRect(x, y, w * 0.22, h); g.fillRect(x + w * 0.78, y, w * 0.22, h); lit.push([x, y, w, h]); }
    g.fillStyle = '#d8d2c8'; g.fillRect(x + w / 2 - 2, y, 4, h); g.fillRect(x, y + h * 0.45, w, 4);
  };
  win(60, 90, 120, 130, r.next() < 0.45); win(300, 90, 120, 130, r.next() < 0.4);
  win(60, 320, 140, 120, r.next() < 0.6); g.fillStyle = '#2a2622'; g.fillRect(330, 300, 90, 212);
  const glow = ssCanvas(W, H, (q) => { q.fillStyle = '#000'; q.fillRect(0, 0, W, H); for (const [x, y, w, h] of lit) { q.fillStyle = '#ffc070'; q.fillRect(x, y, w, h); q.fillStyle = 'rgba(0,0,0,0.5)'; q.fillRect(x, y, w * 0.22, h); q.fillRect(x + w * 0.78, y, w * 0.22, h); } });
  return { map, glow, lit: lit.length };
}

// ---- small builders
// a rod (cylinder) from point a to point b
function ssRod(a, b, r, mat, parent, seg = 8) {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length() || 1e-6;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, seg), mat);
  m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.divideScalar(L));
  m.castShadow = m.receiveShadow = true; parent.add(m);
  return m;
}
function ssGable(w, d, h, mat) {                         // a pitched roof (ridge along x), sitting on y = 0
  const s = new THREE.Shape(); s.moveTo(-d / 2, 0); s.lineTo(d / 2, 0); s.lineTo(0, h); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false }); geo.rotateY(Math.PI / 2); geo.translate(-w / 2, 0, 0);
  return new THREE.Mesh(geo, mat);
}
function ssBlob(r, seed, detail = 1) {                  // a lumpy low-poly blob (a shrub, a tree's crown)
  const geo = new THREE.IcosahedronGeometry(r, detail), p = geo.attributes.position, rr = new RNG(seed);
  const k = [rr.range(0, 9), rr.range(0, 9), rr.range(0, 9)];
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), f = 1 + 0.16 * Math.sin(x * 3.1 + k[0]) * Math.sin(y * 2.7 + k[1]) + 0.1 * Math.sin(z * 4.3 + k[2]); p.setXYZ(i, x * f, y * f * 0.85, z * f); }
  geo.computeVertexNormals();
  return geo;
}
// a slab under a polygon (x, z points, counter-clockwise from above): turf on top, strata down its sides
function ssSlab(poly, depth, topMat, sideMat) {
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

// the kitchen behind the window, and the hall behind the back door: inner faces only (the house's boxes are round
// them). Its materials are marked indoor: the sky reaches them only through the window (garden.js lights them).
function ssTileCanvas(seed, w = 256, h = 256) {
  const r = new RNG(seed);
  return ssCanvas(w, h, (g) => {
    g.fillStyle = '#6a625a'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 64) { const k = r.range(-10, 10); g.fillStyle = `rgb(${182 + k},${172 + k},${158 + k})`; g.fillRect(x + 2, y + 2, 60, 60); }
  });
}
function ssBuildKitchen(P, M, house) {
  const KD = SS_G.kitchen, KW = SS_G.kWin, x0 = KD[0], x1 = KD[1], z1 = KD[2], H = 2.5, z0 = 0.36;
  const ind = (m) => { m.userData.indoor = true; return m; };
  const plaster = ind(ssStd('#d8cfbf', 0.92)), ceil = ind(ssStd('#e6e0d4', 0.95)), dark = ind(ssStd('#2a2724', 0.9));
  const floorT = ssTex(ssTileCanvas(61)); floorT.repeat.set(5, 3);
  const floor = ind(ssStd('#ffffff', 0.7, 0, { map: floorT }));
  const cab = ind(ssStd('#5f7469', 0.6)), top = ind(ssStd('#c9c3b6', 0.35)), steel = ind(ssStd('#b8bcc0', 0.25, 0.85)), wood = ind(ssStd('#8a6a4a', 0.7));
  M.indoor = { plaster, ceil, dark, floor, cab, top, steel, wood };
  const K = P.kitchenRoom = new THREE.Group(); house.add(K);
  const plane = (w, h, m, x, y, z, rx, ry) => { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.position.set(x, y, z); o.rotation.set(rx, ry, 0); o.receiveShadow = true; K.add(o); return o; };
  const W = x1 - x0, D = z1 - z0;
  plane(W, D, floor, (x0 + x1) / 2, 0.002, (z0 + z1) / 2, -Math.PI / 2, 0);
  plane(W, D, ceil, (x0 + x1) / 2, H, (z0 + z1) / 2, Math.PI / 2, 0);
  plane(D, H, plaster, x0 + 0.002, H / 2, (z0 + z1) / 2, 0, Math.PI / 2);
  plane(D, H, plaster, x1 - 0.002, H / 2, (z0 + z1) / 2, 0, -Math.PI / 2);
  plane(W, H, plaster, (x0 + x1) / 2, H / 2, z1 - 0.002, 0, Math.PI);
  // the back wall from inside: plaster round the window (and the window's reveal)
  const inner = (a, b, c, d) => plane(b - a, d - c, plaster, (a + b) / 2, (c + d) / 2, z0 + 0.004, 0, 0);
  inner(x0, KW[0], 0, H); inner(KW[1], x1, 0, H); inner(KW[0], KW[1], 0, KW[2]); inner(KW[0], KW[1], KW[3], H);
  for (const [w, h, x, y, z, rx, ry] of [[KW[1] - KW[0], 0.36, (KW[0] + KW[1]) / 2, KW[2] + 0.001, 0.18, -Math.PI / 2, 0], [KW[1] - KW[0], 0.36, (KW[0] + KW[1]) / 2, KW[3] - 0.001, 0.18, Math.PI / 2, 0],
    [0.36, KW[3] - KW[2], KW[0] + 0.001, (KW[2] + KW[3]) / 2, 0.18, 0, Math.PI / 2], [0.36, KW[3] - KW[2], KW[1] - 0.001, (KW[2] + KW[3]) / 2, 0.18, 0, -Math.PI / 2]]) plane(w, h, plaster, x, y, z, rx, ry);
  // the units under the window: cupboards, the worktop, the sink and its tap
  const box = (w, h, d, m, x, y, z) => { const o = ssMesh(new THREE.BoxGeometry(w, h, d), m, x, y, z, K); return o; };
  box(x1 - x0 - 0.1, 0.86, 0.6, cab, (x0 + x1) / 2, 0.43, z0 + 0.3);
  for (let x = x0 + 0.35; x < x1 - 0.2; x += 0.6) box(0.012, 0.7, 0.01, dark, x + 0.27, 0.45, z0 + 0.605);
  box(x1 - x0 - 0.06, 0.04, 0.64, top, (x0 + x1) / 2, 0.88, z0 + 0.32);
  box(0.62, 0.012, 0.42, dark, (KW[0] + KW[1]) / 2, 0.9, z0 + 0.26);
  const tap = ssCyl(0.015, 0.015, 0.3, steel, (KW[0] + KW[1]) / 2, 1.04, z0 + 0.06, K, 10);
  const sp = ssCyl(0.012, 0.012, 0.16, steel, (KW[0] + KW[1]) / 2, 1.18, z0 + 0.13, K, 10); sp.rotation.x = Math.PI / 2;
  // wall cupboards either side of the window, a fridge at the end, a kettle, a plant on the sill, a chopping board
  box(KW[0] - x0 - 0.25, 0.72, 0.34, cab, (x0 + KW[0]) / 2 - 0.05, 1.86, z0 + 0.17);
  box(x1 - KW[1] - 0.2, 0.72, 0.34, cab, (KW[1] + x1) / 2, 1.86, z0 + 0.17);
  box(0.62, 1.85, 0.64, ind(ssStd('#e8e8e4', 0.3, 0.05)), x0 + 0.36, 0.925, z0 + 0.34);
  const kettle = ssCyl(0.08, 0.1, 0.22, steel, KW[0] - 0.55, 1.01, z0 + 0.25, K, 16);
  ssCyl(0.06, 0.07, 0.11, ind(ssStd('#9a5a3e', 0.85)), KW[1] - 0.25, 1.04, z0 + 0.14, K, 12);
  ssMesh(new THREE.IcosahedronGeometry(0.1, 1), ind(ssStd('#3c5a32', 0.9, 0, { flatShading: true })), KW[1] - 0.25, 1.17, z0 + 0.14, K);
  box(0.4, 0.02, 0.26, wood, KW[1] + 0.45, 0.91, z0 + 0.3);
  // the pendant over the table in the middle of the room
  ssCyl(0.004, 0.004, 0.5, dark, -1.9, H - 0.25, 1.9, K, 4);
  P.pendant = ssMesh(new THREE.ConeGeometry(0.16, 0.14, 18, 1, true), ind(ssStd('#2f3a34', 0.6, 0.2, { side: THREE.DoubleSide })), -1.9, H - 0.55, 1.9, K);
  P.bulbIn = ssMesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd8a0' }), -1.9, H - 0.6, 1.9, K);
  P.lampAt = [-1.9, H - 0.62, 1.9];
  // the hall behind the back door (dark)
  const DR = SS_G.door, hx0 = KD[1], hx1 = 2.5, hz1 = 2.0, hh = 2.5;
  plane(hx1 - hx0, hz1 - z0, dark, (hx0 + hx1) / 2, 0.002, (z0 + hz1) / 2, -Math.PI / 2, 0);
  plane(hx1 - hx0, hh, dark, (hx0 + hx1) / 2, hh / 2, hz1 - 0.002, 0, Math.PI);
  plane(hz1 - z0, hh, dark, hx0 + 0.002, hh / 2, (z0 + hz1) / 2, 0, Math.PI / 2);
  plane(hz1 - z0, hh, dark, hx1 - 0.002, hh / 2, (z0 + hz1) / 2, 0, -Math.PI / 2);
  plane(hx1 - hx0, hz1 - z0, dark, (hx0 + hx1) / 2, hh, (z0 + hz1) / 2, Math.PI / 2, 0);
  K.traverse((o) => { if (o.isMesh) { o.castShadow = false; } });
}

function ssBuildGarden(app, S) {
  const scene = S.scene, G = SS_G, P = {};
  const tex = (c, rx, ry) => { const t = ssTex(c); t.repeat.set(rx, ry); return t; };
  const M = {
    brick: ssStd('#ffffff', 0.92, 0, { map: tex(ssBrickCanvas(3), 3, 2) }),
    wallBrick: ssStd('#ffffff', 0.92, 0, { map: tex(ssBrickCanvas(4, [118, 70, 56]), 4, 0.6) }),
    coping: ssStd('#8d877d', 0.85),
    fence: ssStd('#ffffff', 0.9, 0, { map: tex(ssBoardsCanvas(5), 4, 1) }),
    post: ssStd('#4a3626', 0.9),
    grass: ssStd('#ffffff', 0.97, 0, { map: tex(ssGrassCanvas(6), 3, 4) }),
    slab: ssStd('#ffffff', 0.8, 0, { map: tex(ssSlabCanvas(7), 3, 1) }),
    strata: ssStd('#ffffff', 0.95, 0, { map: (() => { const t = ssTex(ssStrataCanvas(8)); t.wrapT = THREE.ClampToEdgeWrapping; return t; })() }),
    soil: ssStd('#3a2c20', 0.95),
    sill: ssStd('#e4ded2', 0.6),
    frame: ssStd('#ece8e0', 0.5),
    glassLit: new THREE.MeshStandardMaterial({ color: '#2a1e12', emissive: '#ffb45c', emissiveIntensity: 1.25, roughness: 0.2 }),
    glassDark: ssStd('#141a22', 0.15, 0.2),
    pane: new THREE.MeshStandardMaterial({ color: '#dfe8ee', roughness: 0.04, metalness: 0.0, transparent: true, opacity: 0.12, envMapIntensity: 1.2, depthWrite: false, side: THREE.DoubleSide }),
    door: ssStd('#2f3e4a', 0.6),
    roof: ssStd('#3a3634', 0.85),
    leaf: ssStd('#1f3320', 0.9, 0, { flatShading: true }),
    leaf2: ssStd('#2c4226', 0.9, 0, { flatShading: true }),
    bark: ssStd('#3a2c22', 0.95),
    stone: ssStd('#8c877c', 0.85),
    stoneDark: ssStd('#6e6a62', 0.9),
    water: new THREE.MeshStandardMaterial({ color: '#16202a', roughness: 0.05, metalness: 0.4 }),
    ice: ssStd('#ffffff', 0.45, 0.05, { map: (() => { const t = ssTex(ssIceCanvas(12), { repeat: false }); return t; })() }),
    metal: ssStd('#24332c', 0.45, 0.6),
    white: ssStd('#e8e6e2', 0.35, 0.1),
    black: ssStd('#141414', 0.5, 0.3),
    ceramic: ssStd('#f0ece4', 0.25),
    tea: new THREE.MeshStandardMaterial({ color: '#6a3a18', roughness: 0.1 }),
    wax: ssStd('#d8cdb4', 0.75),
    pot: ssStd('#9a5a3e', 0.85),
    shed: ssStd('#55604e', 0.9, 0, { map: tex(ssBoardsCanvas(9), 2, 1) }),
    bulb: new THREE.MeshBasicMaterial({ color: '#ffcf86' }),
    wire: ssStd('#111111', 0.6),
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
  const slabA = ssSlab(ccw(polyA), 9, M.grass, M.strata); A.add(slabA);
  const slabB = ssSlab(ccw(polyB), 9, M.grass, M.strata); B.add(slabB);
  P.slabA = slabA; P.slabB = slabB;
  // the patio (on A)
  ssBox(G.lawnW, 0.06, 3.0, M.slab, 0, 0.03, -1.5, A);
  ssBox(G.lawnW, 0.12, 0.08, M.stoneDark, 0, 0.06, -3.02, A);
  // ---------------------------------------------------------------- the house (on A)
  // the back wall has openings for the kitchen window and the back door: later you watch from the kitchen. The house
  // is boxes round a hollow kitchen and hall (subdivided, so that they can slump when the brick melts)
  const house = P.house = new THREE.Group(); A.add(house);
  const HW = G.houseW / 2, KW = SS_G.kWin, DR = SS_G.door, KD = SS_G.kitchen;
  const part = (x0, x1, y0, y1, z0, z1, m = M.brick) => { const w = x1 - x0, h = y1 - y0, d = z1 - z0; return ssMesh(new THREE.BoxGeometry(w, h, d, Math.max(1, Math.round(w * 1.5)), Math.max(1, Math.round(h * 1.5)), Math.max(1, Math.round(d))), m, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, house); };
  // the back wall
  part(-HW, KW[0], 0, 6.2, 0, 0.36); part(KW[1], DR[0], 0, 6.2, 0, 0.36); part(DR[1], HW, 0, 6.2, 0, 0.36);
  part(KW[0], KW[1], 0, KW[2], 0, 0.36); part(KW[0], KW[1], KW[3], 6.2, 0, 0.36); part(DR[0], DR[1], DR[3], 6.2, 0, 0.36);
  // round the kitchen (x KD[0]…KD[1], z 0.36…KD[2], up to 2.5 m) and the hall behind the door (to x 2.5, z 2.0)
  part(-HW, KD[0], 0, 6.2, 0.36, KD[2]); part(2.5, HW, 0, 6.2, 0.36, KD[2]); part(KD[1], 2.5, 0, 6.2, 2.0, KD[2]);
  part(KD[0], KD[1], 2.5, 6.2, 0.36, KD[2]); part(KD[1], 2.5, 2.5, 6.2, 0.36, 2.0);
  part(-HW, HW, 0, 6.2, KD[2], 8.4);
  const roof = ssGable(G.houseW + 0.4, 8.6, 3.0, M.roof); roof.position.set(0, 6.2, 4.4); roof.castShadow = true; house.add(roof);
  ssBox(0.9, 1.4, 0.7, M.brick, 3.4, 9.4, 4.4, house);                                                   // a chimney
  const win = (x, y, w, h, lit, parent = house) => {
    ssBox(w + 0.16, 0.08, 0.2, M.sill, x, y - h / 2 - 0.05, -0.05, parent);
    ssBox(w + 0.06, h + 0.06, 0.06, M.frame, x, y, -0.01, parent);
    const pane = ssBox(w, h, 0.03, lit ? M.glassLit : M.glassDark, x, y, -0.05, parent);
    ssBox(0.05, h, 0.05, M.frame, x, y, -0.07, parent); ssBox(w, 0.05, 0.05, M.frame, x, y + h * 0.1, -0.07, parent);
    return pane;
  };
  // the kitchen window: a real opening, its frame round the edge and two panes you can see through (they sag later)
  {
    const x = (KW[0] + KW[1]) / 2, y = (KW[2] + KW[3]) / 2, w = KW[1] - KW[0], h = KW[3] - KW[2];
    ssBox(w + 0.16, 0.08, 0.2, M.sill, x, KW[2] - 0.04, -0.05, house);
    for (const [bx, by, bw, bh] of [[x, KW[3] - 0.03, w, 0.06], [x, KW[2] + 0.03, w, 0.06], [KW[0] + 0.03, y, 0.06, h], [KW[1] - 0.03, y, 0.06, h], [x, y, 0.05, h]]) ssBox(bw, bh, 0.07, M.frame, bx, by, 0.02, house);
    P.panes = [-1, 1].map((sd) => {
      const pw = w / 2 - 0.08, ph = h - 0.12, g = new THREE.PlaneGeometry(pw, ph, 10, 14);
      const m = new THREE.Mesh(g, M.pane); m.position.set(x + sd * (w / 4), y, 0.03); m.renderOrder = 4; house.add(m);
      m.userData.base = Float32Array.from(g.attributes.position.array); m.userData.h = ph; return m;
    });
    P.kitchen = P.panes[0];
  }
  win(-3.9, 1.55, 1.2, 1.15, false);
  P.bedroom = win(-1.6, 4.3, 1.3, 1.1, true); win(2.2, 4.3, 1.3, 1.1, false); win(-4.4, 4.3, 1.0, 1.1, false);
  // the back door: glazed top half, lit; a cat flap at the bottom; it swings in on its right-hand hinge
  {
    const door = P.door = new THREE.Group(); door.position.set(DR[1] - 0.02, 0, 0.0); house.add(door);
    const dw = DR[1] - DR[0] - 0.04, cx = -dw / 2;
    ssBox(dw, 0.7, 0.06, M.door, cx, 0.35 + 0.0, 0, door); ssBox(dw, 0.55, 0.06, M.door, cx, 1.86, 0, door);
    ssBox(0.19, 0.8, 0.06, M.door, cx - dw / 2 + 0.095, 1.2, 0, door); ssBox(0.19, 0.8, 0.06, M.door, cx + dw / 2 - 0.095, 1.2, 0, door);
    ssBox(dw - 0.38, 0.8, 0.03, M.glassLit, cx, 1.2, -0.01, door);
    // (the flap: a hole in the lower panel's face, drawn as a dark square with a hinged flap)
    ssBox(0.24, 0.24, 0.065, M.black, cx, 0.2, 0, door);
    const flap = P.flap = new THREE.Group(); flap.position.set(cx, 0.31, -0.035); door.add(flap);
    ssBox(0.2, 0.2, 0.012, ssStd('#3c4650', 0.4, 0.1, { transparent: true, opacity: 0.85 }), 0, -0.1, 0, flap);
    const hd = ssCyl(0.015, 0.015, 0.12, ssStd('#c8c2b0', 0.3, 0.8), 0, 0, 0, door, 10); hd.rotation.z = Math.PI / 2; hd.position.set(cx - dw / 2 + 0.1, 1.0, -0.06);
    ssBox(1.2, 0.1, 0.5, M.stone, (DR[0] + DR[1]) / 2, 0.05, -0.25, house);
  }
  // a drainpipe
  ssCyl(0.04, 0.04, 6.0, M.black, 3.0, 3.0, -0.08, house, 8);
  ssBuildKitchen(P, M, house);
  // ---------------------------------------------------------------- the fences, the back wall
  const fenceRun = (x, z0, z1, parent) => {
    const L = Math.abs(z1 - z0), zc = (z0 + z1) / 2;
    const f = ssBox(0.05, 1.8, L, M.fence, x, 0.9, zc, parent); f.material = M.fence;
    for (let z = z0; z >= z1 - 1e-6; z -= 1.83) ssBox(0.1, 1.9, 0.1, M.post, x, 0.95, z, parent);
    return f;
  };
  fenceRun(-W2 - 0.06, -0.2, crack[0][1], A); fenceRun(W2 + 0.06, -0.2, crack[crack.length - 1][1], A);
  fenceRun(-W2 - 0.06, crack[0][1] - 0.05, G.wallZ, B); fenceRun(W2 + 0.06, crack[crack.length - 1][1] - 0.05, G.wallZ, B);
  ssBox(G.lawnW + 0.3, G.wallH, 0.26, M.wallBrick, 0, G.wallH / 2, G.wallZ, B);
  ssBox(G.lawnW + 0.36, 0.08, 0.34, M.coping, 0, G.wallH + 0.04, G.wallZ, B);
  // ---------------------------------------------------------------- borders: shrubs, a flower bed, pots
  const r = new RNG(41);
  P.foliage = [];                                   // (every shrub and crown: they burn and shrink to char later)
  const shrub = (x, z, s, parent, m = M.leaf) => { const o = ssMesh(ssBlob(s, r.int(0, 999)), m, x, s * 0.7, z, parent); o.rotation.y = r.range(0, 6); P.foliage.push(o); return o; };
  for (let z = -3.6; z > G.wallZ + 0.6; z -= r.range(0.9, 1.5)) {
    const parent = z > -9.4 ? A : B;
    if (r.next() < 0.75) shrub(-W2 + 0.45, z, r.range(0.35, 0.6), parent, r.next() < 0.5 ? M.leaf : M.leaf2);
    if (r.next() < 0.6) shrub(W2 - 0.45, z, r.range(0.3, 0.55), parent, r.next() < 0.5 ? M.leaf : M.leaf2);
  }
  ssBox(G.lawnW - 0.2, 0.05, 0.9, M.soil, 0, 0.02, G.wallZ + 0.6, B);
  for (let i = 0; i < 7; i++) shrub(-3.6 + i * 1.2 + r.range(-0.2, 0.2), G.wallZ + 0.6, r.range(0.25, 0.42), B, i % 2 ? M.leaf2 : M.leaf);
  for (const [x, z, s] of [[-4.0, -0.6, 0.32], [-0.2, -0.5, 0.26], [4.0, -0.7, 0.36], [4.0, -2.6, 0.28]]) {
    ssCyl(s * 0.9, s * 0.7, s * 1.3, M.pot, x, s * 0.65, z, A, 14); shrub(x, z + 0.0, s * 0.95, A, M.leaf2).position.y = s * 1.5;
  }
  // ---------------------------------------------------------------- the apple tree, the shed (on B)
  const tree = P.tree = new THREE.Group(); tree.position.set(G.tree[0], 0, G.tree[2]); B.add(tree);
  ssCyl(0.13, 0.18, 2.1, M.bark, 0, 1.05, 0, tree, 9);
  const br = ssCyl(0.06, 0.09, 1.3, M.bark, 0.35, 2.2, 0.1, tree, 7); br.rotation.z = -0.6;
  const br2 = ssCyl(0.05, 0.08, 1.2, M.bark, -0.3, 2.3, -0.1, tree, 7); br2.rotation.z = 0.7;
  for (const [x, y, z, s] of [[0, 3.0, 0, 1.25], [0.9, 2.7, 0.2, 0.9], [-0.9, 2.8, -0.2, 0.95], [0.2, 3.6, -0.3, 0.85], [-0.3, 2.5, 0.6, 0.8]]) P.foliage.push(ssMesh(ssBlob(s, r.int(0, 999)), r.next() < 0.5 ? M.leaf : M.leaf2, x, y, z, tree));
  const shed = P.shed = new THREE.Group(); shed.position.set(G.shed[0], 0, G.shed[2]); B.add(shed);
  ssBox(2.2, 2.0, 1.8, M.shed, 0, 1.0, 0, shed);
  const sr = P.shedRoof = ssGable(2.4, 2.1, 0.55, M.roof); sr.position.set(0, 2.0, 0); sr.rotation.y = Math.PI / 2; sr.castShadow = true; shed.add(sr);
  ssBox(0.8, 1.7, 0.04, ssStd('#3d4638', 0.9), -0.4, 0.9, 0.92, shed);
  // ---------------------------------------------------------------- the telescope (on A, loose: it can float)
  const scope = P.scope = new THREE.Group(); scope.position.set(...G.scope); A.add(scope);
  const head = new THREE.Group(); head.position.set(0, 1.18, 0); scope.add(head);
  for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.3; ssRod([Math.sin(a) * 0.48, 0, Math.cos(a) * 0.48], [Math.sin(a) * 0.05, 1.15, Math.cos(a) * 0.05], 0.017, M.black, scope, 6); }
  ssCyl(0.06, 0.06, 0.12, M.black, 0, 0, 0, head, 12);
  const tube = P.tube = new THREE.Group(); tube.position.set(0, 0.1, 0); head.add(tube);
  tube.rotation.x = 0.6;
  // (the tube is subdivided along its length: it melts and sags later)
  const tb = ssMesh(new THREE.CylinderGeometry(0.058, 0.058, 0.95, 20, 18), M.white, 0, 0, 0, tube); tb.rotation.x = Math.PI / 2; tb.position.z = 0.12;
  const dew = ssMesh(new THREE.CylinderGeometry(0.068, 0.066, 0.24, 20, 5), M.black, 0, 0, 0, tube); dew.rotation.x = Math.PI / 2; dew.position.z = 0.66;
  P.scopeHead = head;
  const fo = ssCyl(0.03, 0.03, 0.12, M.black, 0, 0, 0, tube, 10); fo.rotation.x = Math.PI / 2; fo.position.z = -0.4;
  const ep = ssCyl(0.016, 0.018, 0.08, M.black, 0, 0.04, -0.46, tube, 8); ep.rotation.x = -0.6;
  const fi = ssCyl(0.014, 0.014, 0.22, M.white, 0.07, 0.07, 0.15, tube, 8); fi.rotation.x = Math.PI / 2;
  // ---------------------------------------------------------------- the bird bath (on B)
  const bath = P.bath = new THREE.Group(); bath.position.set(...G.bath); B.add(bath);
  ssCyl(0.3, 0.36, 0.08, M.stoneDark, 0, 0.04, 0, bath, 16);
  ssCyl(0.11, 0.15, 0.78, M.stone, 0, 0.45, 0, bath, 14);
  const bowl = new THREE.Mesh(new THREE.LatheGeometry([[0.04, 0], [0.32, 0.05], [0.42, 0.14], [0.44, 0.16], [0.4, 0.16], [0.3, 0.08], [0, 0.07]].map(([x, y]) => new THREE.Vector2(x, y)), 24), M.stone);
  bowl.position.y = 0.84; bowl.castShadow = bowl.receiveShadow = true; bath.add(bowl);
  // the water (8 cm deep, its top at 0.98 m) under a skin of ice, white with frost (garden.js turns one into the other)
  P.bathWater = ssCyl(0.38, 0.38, 0.01, M.water, 0, 0.98, 0, bath, 24);
  P.bathIce = ssCyl(0.385, 0.385, 0.012, M.ice, 0, 0.985, 0, bath, 24);
  // ---------------------------------------------------------------- the bistro set (on A), the mug, the lantern
  const table = P.table = new THREE.Group(); table.position.set(...G.table); A.add(table);
  ssCyl(0.36, 0.36, 0.025, M.metal, 0, 0.72, 0, table, 28); ssCyl(0.02, 0.02, 0.7, M.metal, 0, 0.36, 0, table, 8); ssCyl(0.22, 0.24, 0.02, M.metal, 0, 0.01, 0, table, 18);
  const chair = (x, z, ry) => {
    const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry; A.add(c);
    ssCyl(0.2, 0.2, 0.025, M.metal, 0, 0.46, 0, c, 20);
    for (const [lx, lz] of [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]]) ssCyl(0.012, 0.012, 0.46, M.metal, lx, 0.23, lz, c, 6);
    ssBox(0.36, 0.42, 0.025, M.metal, 0, 0.7, 0.19, c); return c;
  };
  P.chairs = [chair(-2.5, -1.0, 0.1), chair(-3.2, -2.1, -2.0)];
  const mug = P.mug = new THREE.Group(); mug.position.set(0.12, 0.735, 0.08); table.add(mug);
  const mb = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.04, 0], [0.042, 0.01], [0.042, 0.095], [0.038, 0.095], [0.038, 0.012], [0, 0.012]].map(([x, y]) => new THREE.Vector2(x, y)), 20), M.ceramic);
  mb.castShadow = true; mug.add(mb);
  const hd = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.007, 8, 14, Math.PI * 1.2), M.ceramic); hd.position.set(0.045, 0.05, 0); hd.rotation.z = -Math.PI * 0.6; mug.add(hd);
  P.teaTop = ssCyl(0.037, 0.037, 0.004, M.tea, 0, 0.082, 0, mug, 20);
  const lantern = P.lantern = new THREE.Group(); lantern.position.set(-0.14, 0.735, -0.06); table.add(lantern);
  ssBox(0.13, 0.015, 0.13, M.black, 0, 0.008, 0, lantern); ssBox(0.13, 0.015, 0.13, M.black, 0, 0.23, 0, lantern);
  for (const [x, z] of [[-0.06, -0.06], [0.06, -0.06], [-0.06, 0.06], [0.06, 0.06]]) ssBox(0.01, 0.22, 0.01, M.black, x, 0.12, z, lantern);
  const roofL = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.07, 4), M.black); roofL.position.y = 0.27; roofL.rotation.y = Math.PI / 4; lantern.add(roofL);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.21, 0.12), new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.07, roughness: 0.35, metalness: 0, envMapIntensity: 0.15, depthWrite: false }));
  glass.position.y = 0.12; lantern.add(glass);
  ssCyl(0.022, 0.022, 0.07, M.wax, 0, 0.05, 0, lantern, 12);
  P.wickAt = [0, 0.095, 0];
  // ---------------------------------------------------------------- the string lights (on A and B fences, the left one)
  P.bulbs = [];
  const string = (x, z0, z1, parent, n) => {
    const pts = []; for (let i = 0; i <= n; i++) { const u = i / n, z = z0 + (z1 - z0) * u, sag = 0.16 * Math.sin(Math.PI * ((u * 4) % 1)); pts.push([x, 1.86 - sag, z]); }
    for (let i = 0; i < pts.length; i++) {
      const b = ssMesh(new THREE.SphereGeometry(0.03, 8, 6), M.bulb, pts[i][0], pts[i][1] - 0.04, pts[i][2], parent); b.castShadow = false; P.bulbs.push(b);
      if (i) ssRod(pts[i - 1], pts[i], 0.004, M.wire, parent, 4).castShadow = false;
    }
  };
  string(-W2 + 0.02, -0.4, crack[0][1] + 0.1, A, 18); string(-W2 + 0.02, crack[0][1] - 0.2, G.wallZ + 0.2, B, 16);
  // ---------------------------------------------------------------- the neighbours: houses behind and either side
  const facade = (seed, w, h, x, z, ry, parent, depth = 7) => {
    const F = ssBackFacade(seed), hs = new THREE.Group(); hs.position.set(x, 0, z); hs.rotation.y = ry; parent.add(hs);
    const fm = new THREE.MeshStandardMaterial({ map: ssTex(F.map, { repeat: false }), emissiveMap: ssTex(F.glow, { repeat: false }), emissive: '#ffffff', emissiveIntensity: 1.0, roughness: 0.9 });
    const front = new THREE.Mesh(new THREE.PlaneGeometry(w, h), fm); front.position.set(0, h / 2, 0); front.receiveShadow = true; hs.add(front);
    (P.neighbours = P.neighbours || []).push(front);                  // (their lit windows go out with yours)
    ssBox(w, h, depth, M.brick, 0, h / 2, -depth / 2 - 0.01, hs).material = ssStd('#4a3a32', 0.95);      // (the body behind its front)
    const rf = ssGable(w + 0.3, depth + 0.6, 2.4, M.roof); rf.position.set(0, h, -depth / 2); hs.add(rf);
    if (seed % 2) ssBox(0.7, 1.0, 0.6, M.brick, w * 0.3, h + 1.9, -depth / 2, hs);
    return hs;
  };
  { // behind the back wall: their gardens, then a terrace facing you
    const gnd = ssSlab(ccw([[-30, G.wallZ - 0.32], [30, G.wallZ - 0.32], [30, -60], [-30, -60]]), 9, M.grass, M.strata); NB.add(gnd);
    for (let i = 0; i < 6; i++) facade(11 + i, 5.4, 6.0, -13.5 + i * 5.45, -32, 0, NB);
    for (let i = 0; i < 5; i++) { ssBox(0.05, 1.8, 14, M.fence, -10.9 + i * 5.45, 0.9, -24.6, NB); }
    for (let i = 0; i < 9; i++) shrub(-14 + i * 3.6 + r.range(-0.6, 0.6), -19 - r.range(0, 9), r.range(0.5, 1.1), NB, i % 2 ? M.leaf : M.leaf2);
    const t2 = new THREE.Group(); t2.position.set(6.5, 0, -22); NB.add(t2); ssCyl(0.2, 0.28, 3.2, M.bark, 0, 1.6, 0, t2, 8);
    for (const [x, y, z, s] of [[0, 4.6, 0, 2.0], [1.4, 4.0, 0.5, 1.4], [-1.3, 4.2, -0.4, 1.5], [0.2, 5.6, 0, 1.3]]) P.foliage.push(ssMesh(ssBlob(s, r.int(0, 999)), M.leaf, x, y, z, t2));
  }
  { // either side: next door's gardens and the backs of their houses (in line with yours)
    const gl = ssSlab(ccw([[-30, 6], [-W2 - 0.22, 6], [-W2 - 0.22, G.wallZ - 0.32], [-30, G.wallZ - 0.32]]), 9, M.grass, M.strata); NL.add(gl);
    const gr = ssSlab(ccw([[W2 + 0.22, 6], [30, 6], [30, G.wallZ - 0.32], [W2 + 0.22, G.wallZ - 0.32]]), 9, M.grass, M.strata); NR.add(gr);
    facade(31, 11.6, 6.2, -6 - 6.2, 0.02, Math.PI, NL, 8); facade(32, 11.6, 6.2, 6 + 6.2, 0.02, Math.PI, NR, 8);
    for (let i = 0; i < 4; i++) { shrub(-6 - r.range(0, 4), -4 - i * 3, r.range(0.5, 0.9), NL); shrub(6 + r.range(0, 4), -5 - i * 3, r.range(0.5, 0.9), NR); }
    ssBox(0.05, 1.8, 17, M.fence, -W2 - 6.4, 0.9, -8.4, NL); ssBox(0.05, 1.8, 17, M.fence, W2 + 6.4, 0.9, -8.4, NR);
  }
  // the far town: a band of rooftops and a church spire against the glow (not part of any plate: it is far away)
  const far = P.far = new THREE.Group(); scene.add(far);
  const roofM = ssStd('#141618', 0.95);
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 1.2 - Math.PI * 0.6, d = r.range(70, 110), x = Math.sin(a) * d, z = -Math.cos(a) * d - 10;
    const h = r.range(5, 9), w = r.range(5, 9), o = ssGable(w, 6, 2.2, roofM); o.position.set(x, h, z); o.rotation.y = -a + Math.PI / 2; far.add(o);
    ssBox(w, h, 6, roofM, x, h / 2, z, far).rotation.y = -a + Math.PI / 2;
  }
  { const sp = new THREE.Mesh(new THREE.ConeGeometry(1.3, 9, 6), roofM); sp.position.set(-24, 18, -96); far.add(sp); ssBox(3, 13.5, 3, roofM, -24, 6.75, -96, far); }
  far.traverse((m) => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; } });
  return P;
}
