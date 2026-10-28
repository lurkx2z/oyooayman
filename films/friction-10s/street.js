/* =====================================================================
   STREET — the hill outside: a Victorian terrace either side of a bus route that drops 8 % towards the east (+x).
   Your house is the south terrace's house at x = 0 (home.js builds it, inside and out); street.js builds the rest.
     static   the road (crowned, a kerb each side), the pavements, the little front yards and their walls, two terraces
              of brick and painted houses stepping down the hill (5 m a house, 0.4 m a step), roofs, chimneys, lamp
              posts, three street trees, the bus stop
     moving   the parked cars, the wheelie bins (bin day), the double-decker, the braking car, the bicycle, the
              scaffold on the houses opposite (every clamp lets go), the builders' sand, the window cleaner's ladder
   Everything that moves is posed by update(s) from physics.js (pure).
     fzBuildStreet(S) → T
   ===================================================================== */

const FZ_ST = { x0: -125, x1: 210, pitch: 5.0 };
const fzSlopeA = Math.atan(FZP.grade);                         // the hill's angle (4.57°)

// a terrace house's front: brick or paint, a bay or a flat sash, the door and its fanlight, two sashes upstairs.
// 512 × 704 px = 5.0 m × 6.875 m (from 0.875 m below the floor to the eaves at 6.0)
function fzFacadeCanvas(seed, o = {}) {
  const r = new RNG(seed * 31 + 7), W = 512, H = 704, px = W / 5.0, y0 = 0.875;
  const Y = (y) => H - (y + y0) * px;                          // metres above the floor → canvas y
  const X = (x) => (x + 2.5) * px;                             // metres from the house's middle → canvas x
  const walls = [[132, 72, 56], [150, 98, 70], [176, 140, 98], [120, 66, 52], [158, 120, 88]];
  const paints = ['#e8e2d4', '#d9c9a8', '#a9bccb', '#e3c9c0', '#c9d3bd', '#f0ece2'];
  const paint = o.paint ?? (r.next() < 0.3 ? paints[r.int(0, paints.length - 1)] : null);
  const doors = ['#1f3a5a', '#7a1f24', '#2e5a3a', '#1c1c1e', '#5a2a5e', '#c9a23a', '#3a6a7a'];
  const doorC = o.door || doors[r.int(0, doors.length - 1)];
  const c = paint ? fzCanvas(W, H, (g) => { g.fillStyle = paint; g.fillRect(0, 0, W, H); const im = g.getImageData(0, 0, W, H), d = im.data; for (let i = 0; i < d.length; i += 4) { const n = (hash1(i * 0.13 + seed) - 0.5) * 10; d[i] += n; d[i + 1] += n; d[i + 2] += n; } g.putImageData(im, 0, 0); })
    : fzBrickCanvas(seed + 3, walls[r.int(0, walls.length - 1)], W, H);
  const g = c.getContext('2d');
  // a plinth (painted dark) below the floor
  g.fillStyle = paint ? 'rgba(60,60,58,0.85)' : 'rgba(40,30,26,0.35)'; g.fillRect(0, Y(0.25), W, H - Y(0.25));
  const glass = (x0, y0g, w, h) => { const gr = g.createLinearGradient(0, Y(y0g + h), 0, Y(y0g)); gr.addColorStop(0, '#5d7487'); gr.addColorStop(0.45, '#2a3540'); gr.addColorStop(1, '#161c22'); g.fillStyle = gr; g.fillRect(X(x0), Y(y0g + h), w * px, h * px); };
  const sash = (x0, y0g, w, h, bars = 1) => {
    g.fillStyle = '#f2efe8'; g.fillRect(X(x0) - 6, Y(y0g + h) - 6, w * px + 12, h * px + 12);
    glass(x0, y0g, w, h);
    // net curtains or blinds in some
    if (r.next() < 0.45) { g.fillStyle = `rgba(235,232,224,${r.range(0.25, 0.6)})`; g.fillRect(X(x0), Y(y0g + h * 0.55), w * px, h * 0.55 * px); }
    g.fillStyle = '#f2efe8'; g.fillRect(X(x0), Y(y0g + h * 0.5) - 3, w * px, 6);
    for (let k = 1; k <= bars; k++) g.fillRect(X(x0 + (w * k) / (bars + 1)) - 2, Y(y0g + h), 4, h * px);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(X(x0) - 6, Y(y0g) + 6, w * px + 12, 6);
    g.fillStyle = paint ? '#f4f1ea' : '#d8d2c4'; g.fillRect(X(x0) - 10, Y(y0g + h) - 22, w * px + 20, 16);     // the lintel
  };
  // ground floor: the window (left), the door (middle-right); upstairs two windows
  const left = o.flip ? 1 : -1;
  sash(left < 0 ? -2.05 : 0.55, 0.62, 1.5, 1.76, 2);
  const dx0 = left < 0 ? -0.2 : -0.7, dw = 0.9;
  g.fillStyle = '#efebe2'; g.fillRect(X(dx0) - 8, Y(2.6) - 8, dw * px + 16, 2.6 * px + 8);
  g.fillStyle = doorC; g.fillRect(X(dx0), Y(2.15), dw * px, 2.15 * px);
  g.fillStyle = 'rgba(0,0,0,0.18)'; for (const [a, b] of [[0.12, 0.3], [0.55, 0.3]]) for (const [cc, dd] of [[0.15, 0.55], [1.05, 0.75]]) g.fillRect(X(dx0 + a), Y(cc + dd), b * px, dd * px);
  glass(dx0 + 0.05, 2.2, dw - 0.1, 0.35);
  g.fillStyle = '#c9a45a'; g.beginPath(); g.arc(X(dx0 + dw * 0.5), Y(1.5), 5, 0, 6.28); g.fill(); g.fillRect(X(dx0 + dw * 0.5) - 14, Y(1.05), 28, 6);
  g.fillStyle = '#f2efe8'; g.font = '600 18px Georgia'; g.textAlign = 'center'; g.fillText(String(o.num ?? r.int(2, 90)), X(dx0 + dw * 0.5), Y(2.3) + 6);
  sash(left < 0 ? 1.2 : -2.05, 0.62, 0.85, 1.76, 1);
  for (const ux of [-1.95, 0.65]) sash(ux, 3.45, 1.3, 1.5, 1);
  // a string course at the first floor, the eaves' gutter shadow
  g.fillStyle = paint ? 'rgba(0,0,0,0.08)' : 'rgba(230,220,200,0.55)'; g.fillRect(0, Y(2.95), W, 10);
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, 0, W, 10);
  // grime: a little darker towards the bottom
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(20,15,10,0.18)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  return c;
}
// paving slabs, 60 cm (a lighter, warmer stone than the city's)
function fzPavingCanvas(seed, w = 512, h = 512) {
  const r = new RNG(seed);
  return fzCanvas(w, h, (g) => {
    g.fillStyle = '#7d7870'; g.fillRect(0, 0, w, h);
    const s = 128;
    for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) {
      const k = r.range(-12, 12); g.fillStyle = `rgb(${158 + k},${152 + k},${142 + k})`; g.fillRect(x + 2, y + 2, s - 4, s - 4);
      for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${r.next() < 0.5 ? '255,255,255' : '0,0,0'},0.05)`; g.fillRect(x + r.range(2, s - 4), y + r.range(2, s - 4), 2, 2); }
      if (r.next() < 0.2) { g.fillStyle = 'rgba(40,36,30,0.12)'; g.beginPath(); g.arc(x + r.range(20, s - 20), y + r.range(20, s - 20), r.range(6, 20), 0, 6.28); g.fill(); }
    }
  });
}
// a strip of ground along x (from x0 to x1, step dx) between z edges, with height y(x, z): a grid mesh
function fzStrip(x0, x1, dx, zs, yf, mat, uvScale = 1) {
  const nx = Math.ceil((x1 - x0) / dx), nz = zs.length, pos = [], uv = [], idx = [];
  for (let i = 0; i <= nx; i++) { const x = x0 + (x1 - x0) * i / nx; for (let k = 0; k < nz; k++) { const z = zs[k]; pos.push(x, yf(x, z), z); uv.push(x / uvScale, z / uvScale); } }
  for (let i = 0; i < nx; i++) for (let k = 0; k < nz - 1; k++) { const a = i * nz + k, b = a + 1, c = a + nz, d = c + 1; idx.push(a, c, b, b, c, d); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  // (normals must face up: flip the winding if needed)
  if (geo.attributes.normal.getY(0) < 0) { for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } geo.setIndex(idx); geo.computeVertexNormals(); }
  const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; return m;
}

// ---- the double-decker (a London-style red bus, 11 m × 2.55 m × 4.38 m), nose +x, origin on the ground at its middle
function fzBuildBus() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const B = FZ_BUS, L = B.L, W = B.W, Hh = B.H;
  const red = new THREE.MeshPhysicalMaterial({ color: '#b3161b', roughness: 0.35, metalness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.1 });
  const glass = fzStd('#1d2730', 0.08, 0.5, { envMapIntensity: 1.6 }), black = fzStd('#141416', 0.6), grey = fzStd('#5d6166', 0.6, 0.3), cream = fzStd('#e8e2d2', 0.6);
  const yb = 0.42;
  fzMesh(fzRoundBox(L, Hh - yb - 0.06, W, 0.18, 0.05), red, 0, yb, 0, body);
  // window bands both decks (sides) and the fronts
  for (const [y0, y1] of [[1.25, 2.15], [2.75, 3.75]]) {
    for (const sz of [-1, 1]) fzBox(L - 0.9, y1 - y0, 0.03, glass, -0.1, (y0 + y1) / 2, sz * (W / 2 + 0.005), body);
    fzBox(0.03, y1 - y0 - (y0 < 2 ? 0 : 0.1), W - 0.3, glass, L / 2 + 0.005, (y0 + y1) / 2, 0, body);
    for (let x = -L / 2 + 0.6; x < L / 2 - 0.4; x += 1.25) for (const sz of [-1, 1]) fzBox(0.09, y1 - y0, 0.04, red, x, (y0 + y1) / 2, sz * (W / 2 + 0.01), body);
  }
  fzBox(0.03, 0.8, W - 0.6, glass, -L / 2 - 0.005, 3.25, 0, body);
  // the destination blind, the route number
  const can = fzCanvas(256, 48, (q) => { q.fillStyle = '#101010'; q.fillRect(0, 0, 256, 48); q.fillStyle = '#ffd25a'; q.font = '700 30px Arial'; q.textAlign = 'center'; q.fillText('42  TOWN CENTRE', 128, 34); });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.3), new THREE.MeshStandardMaterial({ color: '#000', emissive: '#ffffff', emissiveMap: fzTex(can, { repeat: false }), emissiveIntensity: 1.2 }));
  sign.position.set(L / 2 + 0.02, 2.42, 0); sign.rotation.y = Math.PI / 2; body.add(sign);
  // the doors (nearside, the left: −z side for a bus heading +x… in the UK the door is on the left), bumpers, lamps
  fzBox(1.1, 2.0, 0.03, glass, L / 2 - 1.5, 1.42, -W / 2 - 0.01, body);
  fzBox(0.2, 0.32, W, black, L / 2 + 0.02, 0.6, 0, body); fzBox(0.2, 0.32, W, black, -L / 2 - 0.02, 0.6, 0, body);
  for (const sz of [-1, 1]) { fzBox(0.06, 0.18, 0.32, fzStd('#f4f2ea', 0.2, 0, { emissive: '#fff4e0', emissiveIntensity: 0.4 }), L / 2 + 0.03, 0.85, sz * (W / 2 - 0.35), body);
    fzBox(0.06, 0.3, 0.16, fzStd('#5a0d0d', 0.3, 0, { emissive: '#ff1a0e', emissiveIntensity: 0.5 }), -L / 2 - 0.03, 1.0, sz * (W / 2 - 0.2), body); }
  fzBox(L - 0.4, 0.12, 0.03, cream, 0, 2.55, W / 2 + 0.012, body); fzBox(L - 0.4, 0.12, 0.03, cream, 0, 2.55, -W / 2 - 0.012, body);
  // the underside (seen when it goes over): a dark chassis, axles, the engine box
  fzBox(L - 1.2, 0.3, W - 0.5, grey, 0, 0.45, 0, body);
  // wheels
  const wheels = [];
  const wg = new THREE.CylinderGeometry(0.5, 0.5, 0.32, 24); wg.rotateX(Math.PI / 2);
  const tire = fzStd('#18181a', 0.9), hub = fzStd('#9aa0a6', 0.35, 0.7);
  for (const ax of [L / 2 - 2.4, -L / 2 + 2.7]) for (const sz of [-1, 1]) {
    const w = new THREE.Group(); w.position.set(ax, 0.5, sz * (W / 2 - 0.2)); g.add(w);
    fzMesh(wg, tire, 0, 0, 0, w); fzMesh(new THREE.CylinderGeometry(0.28, 0.28, 0.34, 16).rotateX(Math.PI / 2), hub, 0, 0, 0, w);
    wheels.push(w);
  }
  // the people on board (dark silhouettes at the windows)
  const pm = fzStd('#2a2420', 0.9);
  for (let i = 0; i < 9; i++) { const x = -L / 2 + 1.2 + i * 1.05, deck = i % 3 === 0 ? 1.75 : 3.3, sz = i % 2 ? 1 : -1; if (fzR(i, 51) < 0.35) continue; fzMesh(new THREE.SphereGeometry(0.11, 10, 8), pm, x, deck + 0.2, sz * (W / 2 - 0.35), body); fzBox(0.36, 0.4, 0.3, pm, x, deck - 0.12, sz * (W / 2 - 0.35), body); }
  return { g, body, wheels };
}
// a bicycle (frame along +x), origin on the ground under the bottom bracket
function fzBuildBike(color = '#2a6a8a') {
  const g = new THREE.Group(), fr = fzStd(color, 0.35, 0.4), blk = fzStd('#141414', 0.7), steel = fzStd('#b8bcc0', 0.3, 0.8);
  const wheel = (x) => { const w = new THREE.Group(); w.position.set(x, 0.34, 0); g.add(w); const t = fzMesh(new THREE.TorusGeometry(0.33, 0.018, 8, 32), blk, 0, 0, 0, w); fzMesh(new THREE.TorusGeometry(0.3, 0.006, 4, 32), steel, 0, 0, 0, w); for (let k = 0; k < 8; k++) { const sp = fzBox(0.003, 0.6, 0.003, steel, 0, 0, 0, w); sp.rotation.z = k * Math.PI / 8; } return w; };
  const wb = wheel(-0.52), wf = wheel(0.52);
  const tube = (a, b, r = 0.016, m = fr) => { const mm = fzMesh(new THREE.CylinderGeometry(1, 1, 1, 8).translate(0, 0.5, 0), m, 0, 0, 0, g); fzStrut(mm, a, b, r); return mm; };
  const bb = [0, 0.3, 0], seat = [-0.15, 0.82, 0], head = [0.4, 0.86, 0];
  tube(bb, seat); tube(seat, head); tube(bb, head, 0.02); tube(bb, [-0.52, 0.34, 0]); tube(seat, [-0.52, 0.34, 0], 0.012); tube(head, [0.52, 0.34, 0], 0.014, steel);
  tube([0.4, 0.86, 0], [0.38, 0.98, 0], 0.014, steel); tube([0.38, 0.98, -0.24], [0.38, 0.98, 0.24], 0.012, blk);
  fzBox(0.24, 0.04, 0.1, blk, -0.17, 0.86, 0, g);
  return { g, wb, wf };
}
// a wheelie bin (240 l): body, lid, two wheels; origin on the ground at its middle, handle side towards +z
function fzBuildBin(color) {
  const g = new THREE.Group(), m = fzStd(color, 0.55);
  fzMesh(new THREE.CylinderGeometry(0.33, 0.27, 0.98, 4, 1).rotateY(Math.PI / 4).scale(1.0, 1, 1.25), m, 0, 0.53, 0, g);
  fzBox(0.6, 0.05, 0.76, m, 0, 1.05, 0, g);
  for (const sx of [-1, 1]) { const w = fzCyl(0.1, 0.1, 0.05, fzStd('#141414', 0.8), sx * 0.24, 0.1, 0.3, g, 14); w.rotation.z = Math.PI / 2; }
  return g;
}

function fzBuildStreet(S) {
  const scene = S.scene, T = { M: {} }, root = new THREE.Group(); root.name = 'street'; scene.add(root); T.root = root;
  const as = Tex.asphalt(41); for (const t of [as.map, as.roughnessMap, as.bumpMap]) t.repeat.set(1, 1);
  const M = T.M = {
    road: fzStd('#ffffff', 0.92, 0, { map: as.map, roughnessMap: as.roughnessMap, bumpMap: as.bumpMap, bumpScale: 0.6 }),
    pav: fzStd('#ffffff', 0.85, 0, { map: fzTex(fzPavingCanvas(43)) }),
    kerb: fzStd('#9a968c', 0.8), yard: fzStd('#8a8478', 0.9), tilesY: fzStd('#a34a3a', 0.7),
    brick: fzStd('#ffffff', 0.92, 0, { map: (() => { const t = fzTex(fzBrickCanvas(25, [128, 72, 56])); t.repeat.set(2, 1); return t; })() }),
    side: fzStd('#6e5446', 0.95), roof: fzStd('#4a4644', 0.85), roof2: fzStd('#5a4a44', 0.85), sill: fzStd('#e2ddd2', 0.6), step: fzStd('#b8b2a6', 0.75),
    white: fzStd('#f2efe8', 0.5), yellow: fzStd('#e8c02a', 0.6), black: fzStd('#141414', 0.5, 0.3), post: fzStd('#2a2e32', 0.5, 0.5),
    leaf: fzStd('#4f7a3a', 0.85, 0, { flatShading: true }), leaf2: fzStd('#3e6a30', 0.85, 0, { flatShading: true }), bark: fzStd('#5a4a3a', 0.95),
    glassStop: new THREE.MeshStandardMaterial({ color: '#cfe0e8', transparent: true, opacity: 0.18, roughness: 0.05, depthWrite: false, side: THREE.DoubleSide }),
  };
  // ------------------------------------------------------------------ the ground
  const X0 = FZ_ST.x0, X1 = FZ_ST.x1, R = FZ_W.road;
  const roadZ = []; for (let k = 0; k <= 12; k++) roadZ.push(R[0] + (R[1] - R[0]) * k / 12);
  const road = fzStrip(X0, X1, 4, roadZ, (x, z) => fzRoadY(x, z), M.road, 6); root.add(road);
  M.road.map.repeat.set(1, 1);
  const pavS = fzStrip(X0, X1, 4, [FZ_W.front - FZ_W.wallT, FZ_W.pavS[0], FZ_W.pavS[1]], (x) => fzPavY(x) + 0.002, M.pav, 2.4); root.add(pavS);
  const pavN = fzStrip(X0, X1, 4, [FZ_W.pavN[0], FZ_W.pavN[1], FZ_W.yardN], (x) => fzPavY(x) + 0.002, M.pav, 2.4); root.add(pavN);
  // the kerbs (12 cm faces) and their stone tops
  for (const [zk, dir] of [[R[0], -1], [R[1], 1]]) {
    const pos = [], idx = []; const n = Math.ceil((X1 - X0) / 4);
    for (let i = 0; i <= n; i++) { const x = X0 + (X1 - X0) * i / n; pos.push(x, fzPavY(x), zk, x, fzRoadY(x, zk) - 0.01, zk); }
    for (let i = 0; i < n; i++) { const a = i * 2; if (dir < 0) idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); else idx.push(a, a + 2, a + 1, a + 2, a + 3, a + 1); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const k = new THREE.Mesh(geo, M.kerb); k.receiveShadow = true; root.add(k);
    const top = fzStrip(X0, X1, 4, dir < 0 ? [zk + 0.15, zk] : [zk, zk - 0.15], (x) => fzPavY(x) + 0.004, M.kerb, 1); root.add(top);
  }
  // road markings: the centre line (dashed), the bus stop box (yellow, "BUS STOP"), give-way-free; parking bays' ends
  { const B = new Batcher(), wm = fzStd('#ecebe4', 0.6), ym = M.yellow;
    for (let x = X0 + 2; x < X1 - 4; x += 9) { const geo = new THREE.PlaneGeometry(4, 0.1); geo.rotateX(-Math.PI / 2); B.add(geo, wm, Geo.matrix(x + 2, fzRoadY(x + 2, FZ_W.mid) + 0.006, FZ_W.mid, 0, 0, -fzSlopeA)); }
    // the bus stop box on the north side, x 18 … 34
    for (const [x, w, z, d] of [[26, 16, R[1] + 2.2, 0.15], [18, 0.15, R[1] + 1.1, 2.2], [34, 0.15, R[1] + 1.1, 2.2]]) { const geo = new THREE.PlaneGeometry(w, d); geo.rotateX(-Math.PI / 2); B.add(geo, ym, Geo.matrix(x, fzRoadY(x, z) + 0.006, z, 0, 0, -fzSlopeA)); }
    for (const z of [R[0] + 0.25, R[0] + 0.4, R[1] - 0.25, R[1] - 0.4]) for (let x = X0; x < X1; x += 6) {
      if (z < -20 && x > 16 && x < 60) continue;
      const geo = new THREE.PlaneGeometry(6, 0.08); geo.rotateX(-Math.PI / 2); if (Math.abs(z - (R[0] + 0.25)) < 0.01 || Math.abs(z - (R[1] - 0.25)) < 0.01) continue; }
    // double yellow lines by the bus stop, south side opposite (no parking 18 … 52)
    for (const z of [R[0] + 0.22, R[0] + 0.36]) for (let x = 18; x < 52; x += 2) { const geo = new THREE.PlaneGeometry(2, 0.08); geo.rotateX(-Math.PI / 2); B.add(geo, ym, Geo.matrix(x + 1, fzRoadY(x + 1, z) + 0.006, z, 0, 0, -fzSlopeA)); }
    for (const z of [R[1] - 0.22, R[1] - 0.36]) for (let x = 34; x < 64; x += 2) { const geo = new THREE.PlaneGeometry(2, 0.08); geo.rotateX(-Math.PI / 2); B.add(geo, ym, Geo.matrix(x + 1, fzRoadY(x + 1, z) + 0.006, z, 0, 0, -fzSlopeA)); }
    for (const m of B.build(root, 'marks')) { m.castShadow = false; m.renderOrder = 1; }
    const can = fzCanvas(512, 96, (q) => { q.clearRect(0, 0, 512, 96); q.fillStyle = '#e8c02a'; q.font = '700 78px Arial'; q.textAlign = 'center'; q.fillText('BUS STOP', 256, 80); });
    const txt = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 0.95), new THREE.MeshStandardMaterial({ map: fzTex(can, { repeat: false }), transparent: true, roughness: 0.6, depthWrite: false }));
    txt.rotation.set(-Math.PI / 2, 0, Math.PI / 2); txt.position.set(26, fzRoadY(26, R[1] + 1.15) + 0.008, R[1] + 1.15); txt.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), -fzSlopeA); root.add(txt); }
  // ------------------------------------------------------------------ the terraces (batched)
  const B = new Batcher();
  const facadeMats = [];
  const fmat = (seed, o) => { const m = fzStd('#ffffff', 0.85, 0, { map: fzTex(fzFacadeCanvas(seed, o), { repeat: false }) }); facadeMats.push(m); return m; };
  const nVar = 8, south = [], north = [];
  for (let v = 0; v < nVar; v++) { south.push(fmat(100 + v, { num: 0 })); north.push(fmat(200 + v, { flip: true, num: 0 })); }
  const house = (xc, side, k) => {
    // side: +1 the south terrace (fronts face −z at z −8.3), −1 the north (fronts face +z at yardN)
    const zf = side > 0 ? FZ_W.front - FZ_W.wallT : FZ_W.yardN, depth = 8.6, zc = zf + side * depth / 2;
    const fl = side > 0 ? -FZP.grade * xc : fzPavY(xc) + 0.45;          // the floor (y)
    const yb = fzPavY(xc) - 0.9, eaves = fl + FZ_H.eaves;
    // the body (brick sides: only seen where the terrace steps), the roof, the facade plane
    B.box(5.0, eaves - yb, depth, xc, (eaves + yb) / 2, zc, M.side);
    const fgeo = new THREE.PlaneGeometry(5.0, 6.875); fgeo.translate(0, 6.875 / 2 - 0.875, 0);
    const mats = side > 0 ? south : north, m = mats[((k % nVar) + nVar) % nVar];
    B.add(fgeo, m, Geo.matrix(xc, fl, zf - side * 0.003, 0, side > 0 ? Math.PI : 0, 0));
    // the roof: a gable along x
    const s = new THREE.Shape(); s.moveTo(-depth / 2 - 0.3, 0); s.lineTo(depth / 2 + 0.3, 0); s.lineTo(0, 2.6); s.closePath();
    const rg = new THREE.ExtrudeGeometry(s, { depth: 5.0, bevelEnabled: false }); rg.rotateY(Math.PI / 2); rg.translate(-2.5, 0, 0);
    B.add(rg, (k % 3) ? M.roof : M.roof2, Geo.matrix(xc, eaves, zc));
    B.box(0.75, 1.2, 0.7, xc + 2.5, eaves + 2.6 + 0.1, zc + side * 0.2, M.brick);
    for (const dx of [-0.15, 0, 0.15]) B.add(new THREE.CylinderGeometry(0.07, 0.08, 0.3, 8), fzStd('#a0522d', 0.8), Geo.matrix(xc + 2.5 + dx, eaves + 3.4, zc + side * 0.2));
    // the steps up to the door, the sills, the yard wall (with the gate gap) and its coping
    const dx0 = side > 0 ? -0.2 : -0.7, dmid = xc + (side > 0 ? -(dx0 + 0.45) : dx0 + 0.45) * (side > 0 ? -1 : 1);
    const doorX = side > 0 ? xc + 0.25 : xc - 0.25;
    const pav = fzPavY(doorX), steps = Math.max(1, Math.round((fl - pav) / 0.15));
    for (let j = 0; j < steps; j++) { const h = (fl - pav) * (j + 1) / steps; B.box(1.3, h, 0.3, doorX, pav + h / 2, zf - side * (0.15 + 0.28 * (steps - 1 - j)), M.step); }
    const wz = side > 0 ? FZ_W.pavS[0] + 0.12 : FZ_W.pavN[1] - 0.12;
    for (const [a, b] of [[xc - 2.5, doorX - 0.55], [doorX + 0.55, xc + 2.5]]) {
      const w = b - a, mx = (a + b) / 2, py = fzPavY(mx);
      B.add(new THREE.BoxGeometry(w, 0.75, 0.22), M.brick, Geo.matrix(mx, py + 0.375, wz, 0, 0, -fzSlopeA));
      B.add(new THREE.BoxGeometry(w, 0.06, 0.28), M.kerb, Geo.matrix(mx, py + 0.78, wz, 0, 0, -fzSlopeA));
    }
    // (the yard: tiles under the path, gravel either side)
    for (const [a, b, mm] of [[xc - 2.5, doorX - 0.55, M.yard], [doorX - 0.55, doorX + 0.55, M.tilesY], [doorX + 0.55, xc + 2.5, M.yard]]) {
      const zy0 = side > 0 ? zf : FZ_W.pavN[1], zy1 = side > 0 ? FZ_W.pavS[0] : zf, mx = (a + b) / 2;
      const geo = new THREE.PlaneGeometry(b - a, Math.abs(zy1 - zy0)); geo.rotateX(-Math.PI / 2);
      B.add(geo, mm, Geo.matrix(mx, fzPavY(mx) + 0.01, (zy0 + zy1) / 2, 0, 0, -fzSlopeA));
    }
    // window sills and door canopy (depth)
    const wx = side > 0 ? [[xc + 1.3, 1.5], [xc - 1.62, 0.85], [xc + 1.3, 1.3], [xc - 1.3, 1.3]] : [[xc - 1.3, 1.5], [xc + 1.62, 0.85], [xc - 1.3, 1.3], [xc + 1.3, 1.3]];
    wx.forEach(([x, w], j) => B.box(w + 0.2, 0.07, 0.16, x, fl + (j < 2 ? 0.58 : 3.41), zf - side * 0.07, M.sill));
  };
  for (let k = Math.ceil(X0 / 5); k <= Math.floor(X1 / 5); k++) if (k !== 0) house(5 * k, 1, k);
  for (let k = Math.ceil(X0 / 5); k <= Math.floor(X1 / 5); k++) house(5 * k + 2.5, -1, k + 3);
  // our house's own yard wall and gravel (home.js has the facade and the steps)
  { const doorX = 0.25, wz = FZ_W.pavS[0] + 0.12;
    for (const [a, b] of [[-2.5, doorX - 0.55], [doorX + 0.55, 2.5]]) { const w = b - a, mx = (a + b) / 2, py = fzPavY(mx);
      B.add(new THREE.BoxGeometry(w, 0.75, 0.22), M.brick, Geo.matrix(mx, py + 0.375, wz, 0, 0, -fzSlopeA));
      B.add(new THREE.BoxGeometry(w, 0.06, 0.28), M.kerb, Geo.matrix(mx, py + 0.78, wz, 0, 0, -fzSlopeA)); }
    for (const [a, b, mm] of [[-2.5, doorX - 0.55, M.yard], [doorX - 0.55, doorX + 0.55, M.tilesY], [doorX + 0.55, 2.5, M.yard]]) { const mx = (a + b) / 2, z0 = FZ_W.front - FZ_W.wallT, z1 = FZ_W.pavS[0], geo = new THREE.PlaneGeometry(b - a, z0 - z1); geo.rotateX(-Math.PI / 2); B.add(geo, mm, Geo.matrix(mx, fzPavY(mx) + 0.01, (z0 + z1) / 2, 0, 0, -fzSlopeA)); }
    // (a brass number on our gate post)
  }
  // lamp posts, trees, the bus stop
  for (let x = X0 + 10; x < X1; x += 30) for (const [z, f] of [[FZ_W.pavS[1] + 0.35, 1], [FZ_W.pavN[0] - 0.35, -1]]) {
    const xx = x + (f < 0 ? 15 : 0), y = fzPavY(xx);
    B.add(new THREE.CylinderGeometry(0.06, 0.08, 6.0, 8), M.post, Geo.matrix(xx, y + 3.0, z));
    B.add(new THREE.BoxGeometry(0.06, 0.06, 0.9), M.post, Geo.matrix(xx, y + 5.95, z - f * 0.42));
    B.add(new THREE.BoxGeometry(0.3, 0.1, 0.55), M.post, Geo.matrix(xx, y + 5.9, z - f * 0.85));
  }
  for (const x of [-38, -62, 44, 71, 98]) { const z = FZ_W.pavN[0] - 0.6, y = fzPavY(x); B.add(new THREE.CylinderGeometry(0.13, 0.18, 3.4, 8), M.bark, Geo.matrix(x, y + 1.7, z)); B.add(fzBlobGeo(1.9, x), x % 2 ? M.leaf : M.leaf2, Geo.matrix(x, y + 4.6, z)); B.add(fzBlobGeo(1.3, x + 1), M.leaf2, Geo.matrix(x + 1.1, y + 3.9, z + 0.6)); }
  { const x = 27.0, z = FZ_W.pavN[0] - 1.1, y = fzPavY(x);
    for (const dx of [-1.8, 1.8]) B.add(new THREE.BoxGeometry(0.06, 2.4, 0.06), M.post, Geo.matrix(x + dx, y + 1.2, z - 0.5));
    B.add(new THREE.BoxGeometry(3.8, 0.08, 1.4), M.post, Geo.matrix(x, y + 2.42, z - 0.2, 0, 0, -fzSlopeA));
    B.add(new THREE.BoxGeometry(3.6, 0.06, 0.4), M.post, Geo.matrix(x, y + 0.5, z - 0.75, 0, 0, -fzSlopeA));
    B.add(new THREE.CylinderGeometry(0.04, 0.04, 2.8, 8), M.post, Geo.matrix(31.5, fzPavY(31.5) + 1.4, FZ_W.pavN[0] - 0.4));
    const sg = new THREE.CircleGeometry(0.22, 24); B.add(sg, fzStd('#c8202a', 0.5), Geo.matrix(31.5, fzPavY(31.5) + 2.65, FZ_W.pavN[0] - 0.36));
    T.stopGlass = fzBox(3.6, 1.9, 0.02, M.glassStop, x, y + 1.25, z - 0.9, root); T.stopGlass.castShadow = false; }
  B.build(root, 'terrace');

  // ------------------------------------------------------------------ parked cars, bins
  const VF = new VehicleFactory();
  T.parked = FZ_PARKED.map((c) => { const v = VF.build(c.type, c.color), pg = new THREE.Group(); pg.add(v.group); root.add(pg); v.group.rotation.y = c.dir > 0 ? 0 : Math.PI; return { c, v, pg }; });
  const binC = ['#2a2d30', '#2f5a3a', '#6a4a2a', '#2a4a7a'];
  T.bins = FZ_BINS.map((b, i) => { const g = fzBuildBin(binC[i % binC.length]), pg = new THREE.Group(); pg.add(g); root.add(pg); g.rotation.y = b.z > -15 ? 0 : Math.PI; return { b, g, pg }; });
  // the braking car (silver hatch), the bus, the bike
  T.car = VF.build('hatch', '#a9adb2'); { const pg = new THREE.Group(); pg.add(T.car.group); root.add(pg); T.carPg = pg; }
  T.car.tail.emissiveIntensity = 1.8;
  T.bus = fzBuildBus(); { const pg = new THREE.Group(), tip = new THREE.Group(); pg.add(tip); tip.add(T.bus.g); root.add(pg); T.busPg = pg; T.busTip = tip; }
  T.bike = fzBuildBike(); { const pg = new THREE.Group(), lean = new THREE.Group(); pg.add(lean); lean.add(T.bike.g); root.add(pg); T.bikePg = pg; T.bikeLean = lean; }
  // ------------------------------------------------------------------ the scaffold (opposite: the north houses x 3.5 … 11.5)
  { const SC = FZ_SCAF, tube = fzStd('#9aa0a4', 0.4, 0.8), board = fzStd('#b08850', 0.85), clampM = fzStd('#6a6e72', 0.5, 0.7), net = fzStd('#3a6a9a', 0.9, 0, { transparent: true, opacity: 0.0 });
    const tg = new THREE.CylinderGeometry(0.024, 0.024, 1, 8); tg.translate(0, 0.5, 0);
    const pieces = [];   // { m, kind, a: [x,y,z], b: [x,y,z], lift }
    const xs = SC.x, zs = [SC.zIn, SC.zOut], baseY = (x) => fzPavY(x) + 0.01;
    // standards (vertical), each on a base plate
    T.standards = [];
    for (const [i, x] of xs.entries()) for (const [j, z] of zs.entries()) {
      const m = new THREE.Mesh(tg, tube); m.castShadow = true; root.add(m);
      const plate = fzBox(0.15, 0.01, 0.15, clampM, x, baseY(x), z, root);
      T.standards.push({ m, x, z, i: i * 2 + j, h: SC.top, y0: baseY(x) });
    }
    // ledgers (along x, each lift, both rows), transoms (across), boards (on each lift), braces (diagonals on the outer face)
    for (const [li, ly] of SC.lifts.entries()) {
      for (const z of zs) for (let i = 0; i < xs.length - 1; i++) pieces.push({ kind: 'tube', a: [xs[i] - 0.15, ly, z], b: [xs[i + 1] + 0.15, ly, z], lift: li });
      for (const x of xs) pieces.push({ kind: 'tube', a: [x, ly + 0.05, SC.zIn - 0.25], b: [x, ly + 0.05, SC.zOut + 0.15], lift: li, across: true });
      for (let i = 0; i < xs.length - 1; i++) for (let k = 0; k < 4; k++) pieces.push({ kind: 'board', a: [(xs[i] + xs[i + 1]) / 2, ly + 0.1, SC.zIn + 0.12 + k * 0.24], lift: li, len: xs[i + 1] - xs[i] + 0.2 });
      if (li < 2) for (let i = 0; i < xs.length - 1; i += 2) pieces.push({ kind: 'tube', a: [xs[i], ly + 0.1, SC.zOut + 0.05], b: [xs[i + 1], ly + 2.0, SC.zOut + 0.05], lift: li, brace: true });
      // toe boards and a guard rail on the outer face of the top lifts
      if (li > 0) for (let i = 0; i < xs.length - 1; i++) pieces.push({ kind: 'tube', a: [xs[i] - 0.1, ly + 1.0, SC.zOut + 0.06], b: [xs[i + 1] + 0.1, ly + 1.0, SC.zOut + 0.06], lift: li + 0.5, rail: true });
    }
    T.scafPieces = pieces.map((p, n) => {
      const m = p.kind === 'board' ? fzBox(p.len, 0.04, 0.22, board, 0, 0, 0, root) : new THREE.Mesh(tg, tube);
      if (p.kind !== 'board') { m.castShadow = true; root.add(m); }
      const cl = p.kind === 'tube' ? [fzBox(0.08, 0.09, 0.08, clampM, 0, 0, 0, root), fzBox(0.08, 0.09, 0.08, clampM, 0, 0, 0, root)] : [];
      return Object.assign(p, { m, cl, n, r1: fzR(n, 61), r2: fzR(n, 62), r3: fzR(n, 63) });
    });
    // a builder's bucket and a cement mixer at the foot (they slide with everything)
    T.mixer = new THREE.Group(); root.add(T.mixer);
    fzMesh(new THREE.CylinderGeometry(0.28, 0.4, 0.6, 16).rotateZ(0.6), fzStd('#d24a2a', 0.5), 0, 0.85, 0, T.mixer); fzBox(0.7, 0.5, 0.5, fzStd('#2a2a2a', 0.6), 0, 0.3, 0, T.mixer);
    T.mixerX = 14.6; }
  // ------------------------------------------------------------------ the builders' sand (heap on the north pavement) and its bag
  { const SA = FZ_SAND, n = SA.n, geo = new THREE.IcosahedronGeometry(0.032, 0), m = fzStd('#c9a46a', 0.95, 0, { flatShading: true }), im = new THREE.InstancedMesh(geo, m, n);
    im.castShadow = true; im.receiveShadow = true; root.add(im); T.sand = im;
    const bag = T.sandBag = new THREE.Group(); root.add(bag);
    fzMesh(fzRoundBox(0.95, 0.9, 0.95, 0.08, 0.02), fzStd('#e8e4da', 0.9), 0, 0, 0, bag);
    for (const [sx, sz] of [[-0.42, -0.42], [0.42, -0.42], [-0.42, 0.42], [0.42, 0.42]]) fzBox(0.06, 0.3, 0.02, fzStd('#2a5a9a', 0.8), sx, 1.0, sz, bag); }
  // ------------------------------------------------------------------ the window cleaner's ladder (against the north house at x −8.8) and his bucket
  { const g = T.ladder = new THREE.Group(), al = fzStd('#c8ccd0', 0.35, 0.8); root.add(g);
    const L = FZ_LADDER.L;
    for (const sx of [-0.22, 0.22]) fzBox(0.05, L, 0.03, al, sx, L / 2, 0, g);
    for (let y = 0.28; y < L - 0.1; y += 0.28) fzBox(0.44, 0.03, 0.03, al, 0, y, 0, g);
    T.bucket = fzCyl(0.15, 0.12, 0.26, fzStd('#2a6ad2', 0.5), 0, 0, 0, root, 14); }
  T.update = (s, o) => fzStreetUpdate(T, s, o || {});
  return T;
}
// a lumpy blob geometry (a tree crown)
function fzBlobGeo(r, seed) {
  const geo = new THREE.IcosahedronGeometry(r, 1), p = geo.attributes.position, rr = new RNG(Math.round(seed * 13) + 5);
  const k = [rr.range(0, 9), rr.range(0, 9), rr.range(0, 9)];
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), f = 1 + 0.16 * Math.sin(x * 3.1 + k[0]) * Math.sin(y * 2.7 + k[1]) + 0.1 * Math.sin(z * 4.3 + k[2]); p.setXYZ(i, x * f, y * f * 0.85, z * f); }
  geo.computeVertexNormals(); return geo;
}

// ---------------------------------------------------------------------------------------------------------------------
// STREET · UPDATE (story time s)
// ---------------------------------------------------------------------------------------------------------------------
const _fzV = new THREE.Vector3(), _fzQ = new THREE.Quaternion(), _fzE = new THREE.Euler(), _fzM = new THREE.Matrix4(), _fzOne = new THREE.Vector3(1, 1, 1);
// put a vehicle group on the hill at (x, z): the slope's pitch; heading set by the caller (yaw in the slope's frame)
function fzOnHill(pg, x, z, y) { pg.position.set(x, y ?? fzRoadY(x, z), z); pg.rotation.set(0, 0, -fzSlopeA); }

function fzStreetUpdate(T, s, o) {
  // ---- parked cars: slide together; after 10 s they skid to a stop (a nose-dip as they stop)
  for (const P of T.parked) {
    const r = fzParked(P.c, s); fzOnHill(P.pg, r.x, P.c.z);
    const tau = s - FZP.tBack, st = r.v > 0 && tau > 0;
    P.v.body.rotation.z = st ? -P.c.dir * 0.035 * Math.min(1, tau * 6) : (tau > 0 ? -P.c.dir * 0.035 * Math.exp(-(tau - 1.27) * 7) * Math.cos((tau - 1.27) * 18) * (tau > 1.27 ? 1 : 0) : 0);
    for (const w of P.v.wheels) w.rotation.z = 0;
  }
  // ---- bins: slide; when friction returns they trip over their bottoms and tumble downhill
  for (const B of T.bins) {
    const r = fzBin(B.b, s); fzOnHill(B.pg, r.x, B.b.z, fzPavY(r.x));
    const tau = s - FZP.tBack;
    if (tau > 0) { const u = MathX.clamp(tau / 0.55, 0, 1), a = Math.PI / 2 * (u * u * (3 - 2 * u)) * 1.0; B.g.position.set(0.3 * u, 0, 0); B.g.rotation.set(0, B.g.rotation.y, 0); B.pg.rotateZ(-a); }
  }
  // ---- the bus
  { const b = fzBusAt(s), pg = T.busPg;
    pg.position.set(b.x, fzRoadY(b.x, b.z), b.z); pg.rotation.set(0, 0, 0);
    // (heading towards +z by yaw: three.js rotation.y = −yaw; the slope: pitch about the bus's own sideways axis, approx)
    pg.rotation.order = 'YXZ'; pg.rotation.y = -b.yaw; pg.rotation.z = -fzSlopeA * Math.cos(b.yaw); pg.rotation.x = -fzSlopeA * Math.sin(b.yaw) * -1;
    // tipping: about the edge on the side it's sliding towards (local −z when sliding along +x at this yaw)
    const lat = -b.vx * Math.sin(b.yaw) + (b.vz || 0) * Math.cos(b.yaw), sd = lat < 0 ? -1 : 1, W2 = FZ_BUS.W / 2;
    T.busTip.position.set(0, 0, sd * W2); T.bus.g.position.set(0, 0, -sd * W2); T.busTip.rotation.set(sd * (b.roll || 0), 0, 0);
    for (const w of T.bus.wheels) w.rotation.z = s < 0 ? s * 2.8 : 0; }
  // ---- the braking car: its wheels locked (not turning), front wheels steered by the driver (no effect), brake lights
  { const c = fzCarAt(s), pg = T.carPg;
    fzOnHill(pg, c.x, c.z); pg.rotation.order = 'YXZ'; pg.rotation.y = c.yaw; pg.rotation.z = -fzSlopeA * Math.cos(c.yaw); pg.rotation.x = 0;
    T.car.group.rotation.x = -(c.roll || 0);
    const steer = s < -0.1 ? 0 : 0.42 * MathX.smooth(s, 0.2, 0.9) * (s < 9.8 ? 1 : 0);
    T.car.wheels.forEach((w, i) => { w.rotation.set(0, i >= 2 ? 0 : steer, 0); });
    T.car.tail.emissiveIntensity = s < 10.6 ? 1.8 : 0.6; }
  // ---- the bike: leans over (it can't be steered upright), slides on its side
  { const b = fzBike(s);
    fzOnHill(T.bikePg, b.x, b.z); T.bikeLean.rotation.set(-b.lean, 0, 0);
    const spin = s <= 0 ? s * 6.5 / 0.34 : -0;
    T.bike.wb.rotation.z = -(FZ_BIKE.x0 + 6.5 * Math.min(0, s)) / 0.34 - (s > 0 ? s * 6.5 / 0.34 * Math.exp(-s * 0.2) : 0); T.bike.wf.rotation.z = T.bike.wb.rotation.z;
    if (s > FZP.tBack) { const u = MathX.clamp((s - FZP.tBack) / 0.5, 0, 1); T.bikeLean.rotation.x = -b.lean - u * 0.3; } }
  // ---- the scaffold
  fzScaffoldUpdate(T, s);
  // ---- the sand
  { const im = T.sand, n = FZ_SAND.n;
    for (let i = 0; i < n; i++) { const p = fzGrain(i, s), g = FZ_SAND.g[i], y = (p.z > FZ_W.pavN[0] - 0.02 ? fzRoadY(p.x, p.z) : fzPavY(p.x)) + p.y + 0.02;
      _fzE.set(g.a * 3, g.c * 5, g.a); _fzQ.setFromEuler(_fzE); _fzV.set(p.x, y, p.z); _fzM.compose(_fzV, _fzQ, _fzOne); im.setMatrixAt(i, _fzM); }
    im.instanceMatrix.needsUpdate = true;
    const bx = FZ_SAND.x - 1.0 + fzSlide(0, 0, FZP.aHill, s, FZP.decBody).p; T.sandBag.position.set(bx, fzPavY(bx), FZ_SAND.z - 0.9); T.sandBag.rotation.set(0, 0.2, -fzSlopeA); }
  // ---- the ladder (and the bucket)
  { const L = fzLadder(s), D = FZ_LADDER, g = T.ladder;
    g.position.set(L.x, fzPavY(L.x) + 0.02, L.footZ); g.rotation.set(-(Math.PI / 2 - L.th), 0, 0, 'XYZ');
    const bx = L.x + 0.4 + (s > 0 ? fzSlide(0, 0, FZP.aHill, Math.max(0, s - 0.6), FZP.decBody).p : 0), by = s < 0.6 ? fzPavY(L.x) + 0.13 + Math.max(0, 2.5 - 0.5 * FZP.g * Math.max(0, s - 0.0) ** 2 * (s > 0 ? 1 : 0)) * 0 : fzPavY(bx) + 0.13;
    T.bucket.position.set(bx, s <= 0 ? fzPavY(L.x) + 0.13 : fzPavY(bx) + 0.13, FZ_LADDER.zWall + 0.5); }
  // ---- the mixer slides too
  { const x = T.mixerX + fzSlide(0, 0, FZP.aHill, s, FZP.decBody).p; T.mixer.position.set(x, fzPavY(x), FZ_W.pavN[1] + 0.6); T.mixer.rotation.set(0, 0.3, -fzSlopeA);
    if (s > FZP.tBack) T.mixer.rotateZ(-Math.PI / 2 * MathX.smooth(s, FZP.tBack, FZP.tBack + 0.5)); }
}

// the scaffold: every horizontal piece drops at g until it lands on the pile (the pavement, then whatever landed
// first: lower lifts land first, the higher ones on top); the standards topple outwards into the road; the heap
// then slides downhill with everything else
function fzScaffoldUpdate(T, s) {
  const SC = FZ_SCAF;
  for (const p of T.scafPieces) {
    const h0 = p.kind === 'board' ? p.a[1] : Math.min(p.a[1], p.b ? p.b[1] : p.a[1]);
    const rest = 0.05 + 0.06 * Math.floor(p.lift) + 0.04 * p.r1 + (p.kind === 'board' ? 0.05 : 0);
    const F = fzFall(h0, rest, s);
    // scatter on landing: a sideways kick (out towards the road, +z) and a spin; then the slide downhill
    const after = F.landed ? F.after : 0, kick = F.landed ? (1 - Math.exp(-after * 3)) : 0;
    const dzK = kick * (0.4 + 1.6 * p.r2) * (p.across ? 0.6 : 1), dxK = kick * (p.r3 - 0.5) * 0.8, rot = kick * (p.r1 - 0.5) * 0.9;
    const slide = F.landed ? fzSlide(0, 0, FZP.aHill, after, FZP.decBody, FZP.tBack - (F.tl || 0)).p : 0;
    const dy = F.y - h0;
    if (p.kind === 'board') {
      const x = p.a[0] + dxK + slide, z = p.a[2] + dzK, y = fzPavY(x) + p.a[1] + dy + 0.02;
      p.m.position.set(x, y, z); p.m.rotation.set(0, rot, -fzSlopeA + (F.landed ? 0 : 0.02 * s * (p.r1 - 0.5)));
      continue;
    }
    const a = p.a.slice(), b = p.b.slice();
    for (const q of [a, b]) { q[0] += dxK + slide; q[2] += dzK; }
    // (a falling brace keeps its slant until it lands, then lies flat)
    const flat = F.landed ? 1 : 0;
    const ay = fzPavY(a[0]) + (p.brace ? (a[1] + dy) * (1 - flat) + rest * flat : a[1] + dy), by = fzPavY(b[0]) + (p.brace ? Math.max(rest, (b[1] + dy)) * (1 - flat) + (rest + 0.03) * flat : b[1] + dy);
    // rotate the landed tube about its middle by rot (in the xz plane)
    if (rot) { const mx = (a[0] + b[0]) / 2, mz = (a[2] + b[2]) / 2, c = Math.cos(rot), sn = Math.sin(rot); for (const q of [a, b]) { const dx = q[0] - mx, dz = q[2] - mz; q[0] = mx + dx * c - dz * sn; q[2] = mz + dx * sn + dz * c; } }
    fzStrut(p.m, [a[0], ay, a[2]], [b[0], by, b[2]], 1);
    p.m.scale.x = p.m.scale.z = 1;
    p.cl[0].position.set(a[0] + (b[0] - a[0]) * 0.03, ay, a[2]); p.cl[1].position.set(b[0] - (b[0] - a[0]) * 0.03, by, b[2]);
    for (const c of p.cl) c.visible = true;
  }
  for (const st of T.standards) {
    const th = fzStandard(st.i, s), base = fzPavY(st.x) + 0.01;
    // (falls outwards: towards +z, the road; once flat it lies on the pavement and slides downhill)
    const tFlat = th >= Math.PI / 2 - 0.12 ? s : null;
    const slide = s > 1.4 ? fzSlide(0, 0, FZP.aHill, s - 1.4, FZP.decBody, FZP.tBack - 1.4).p : 0;
    const x = st.x + slide, top = [x, base + Math.cos(th) * st.h, st.z + Math.sin(th) * st.h];
    fzStrut(st.m, [x, base, st.z], top, 1); st.m.scale.x = st.m.scale.z = 1;
  }
}
