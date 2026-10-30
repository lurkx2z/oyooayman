/* =====================================================================
   STREET — what you see from your window and around it (layout.js: GK_ST). The ground keeps its old down: the road,
   the pavements, the grass, the pond's basin, and everything set in it (lamp posts, railings, benches, the climbing
   dome, the swings' frame, the trees' roots, the buildings' foundations). Everything else follows the turning down.
     your block    x −22…22, z 0…12, four floors; your window on the top floor (the room behind it is room.js)
     the next block x 34…74, with balconies (four of them snap off and fall into the sky)
     the street    z −9…−2, parked cars and the bins (simdata.js), lamp posts; the cross street at x 76…84
     the church    at the end of the street (x 86…118): its spire goes over at 16°
     the park      z −12.6…−100: the pond, autumn trees, paths, benches, the playground (the dome, the swings, a slide)
     beyond        a terrace of brick houses along the park's north side (their roof tiles go up), the town around
   Moving: the simulated bodies; the pond and the sheet of water it becomes; the leaves (on the grass and in the trees);
   the drops that were the pond; roof tiles; the spire; the balconies; dust. All posed by update(s) (pure).
     gkBuildStreet(S) → T
   ===================================================================== */

// ---- canvases
// a concrete block's front: panels, floor bands, a grid of windows (some with curtains, a few lit)
function gkBlockFacade(seed, wM, hM, o = {}) {
  const r = new RNG(seed), px = 22, W = Math.round(wM * px), H = Math.round(hM * px);
  return gkCanvas(W, H, (g) => {
    g.fillStyle = o.base || '#c9c2b4'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${r.next() < 0.5 ? '255,255,255' : '40,36,30'},${r.range(0.02, 0.06)})`; g.fillRect(r.range(0, W), r.range(0, H), r.range(1, 4), r.range(1, 3)); }
    for (let x = 0; x < W; x += 3 * px) { g.fillStyle = 'rgba(60,55,48,0.18)'; g.fillRect(x, 0, 1.5, H); }
    const Y = (y) => H - y * px;
    for (let f = 0; f < 4; f++) { g.fillStyle = o.band || 'rgba(120,112,100,0.55)'; g.fillRect(0, Y(f * 3 + 0.25), W, 0.25 * px); }
    g.fillStyle = 'rgba(70,64,56,0.75)'; g.fillRect(0, 0, W, 0.4 * px);                    // the parapet's cap
    for (let f = 0; f < 4; f++) for (const cx of o.cols) {
      if (o.skip && o.skip(f, cx)) continue;
      const x0 = (cx - 1.2 - o.x0) * px, y1 = Y(f * 3 + 2.3), w = 2.4 * px, h = 1.45 * px, lit = r.next() < 0.22;
      g.fillStyle = '#efece4'; g.fillRect(x0 - 4, y1 - 4, w + 8, h + 8);
      const gr = g.createLinearGradient(0, y1, 0, y1 + h); gr.addColorStop(0, lit ? '#e8c890' : '#7d93a6'); gr.addColorStop(0.5, lit ? '#a8865a' : '#34404c'); gr.addColorStop(1, lit ? '#6a5236' : '#1a2128');
      g.fillStyle = gr; g.fillRect(x0, y1, w, h);
      if (r.next() < 0.55) { g.fillStyle = `rgba(${r.next() < 0.5 ? '226,214,196' : '186,120,90'},${r.range(0.55, 0.85)})`; const cw = w * r.range(0.15, 0.3); g.fillRect(x0, y1, cw, h); g.fillRect(x0 + w - cw, y1, cw, h); }
      g.fillStyle = '#efece4'; g.fillRect(x0 + w * 0.6, y1, 4, h);
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x0 - 4, y1 + h + 4, w + 8, 4);
    }
    if (o.door) { g.fillStyle = '#3a4a56'; g.fillRect((o.door - 0.9 - o.x0) * px, Y(2.4), 1.8 * px, 2.4 * px); g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect((o.door - 0.8 - o.x0) * px, Y(2.3), 1.6 * px, 1.0 * px); }
  });
}
// a terrace house's front (brick): the bay downstairs, the door with its fanlight, two sashes up. 5 m × 6.45 m
function gkTerraceFacade(seed, brickC) {
  const r = new RNG(seed * 31 + 7), W = 256, H = 330, px = W / 5;
  const c = gkBrickCanvas(seed + 3, brickC, W, H), g = c.getContext('2d');
  const Y = (y) => H - (y - 0.15) * px, X = (x) => x * px;
  const glass = (x0, y0, w, h) => { const gr = g.createLinearGradient(0, Y(y0 + h), 0, Y(y0)); gr.addColorStop(0, '#5d7487'); gr.addColorStop(0.45, '#2a3540'); gr.addColorStop(1, '#161c22'); g.fillStyle = gr; g.fillRect(X(x0), Y(y0 + h), w * px, h * px); };
  const sash = (x0, y0, w, h) => { g.fillStyle = '#f2efe8'; g.fillRect(X(x0) - 3, Y(y0 + h) - 3, w * px + 6, h * px + 6); glass(x0, y0, w, h); g.fillStyle = '#f2efe8'; g.fillRect(X(x0), Y(y0 + h * 0.5) - 2, w * px, 3); };
  const flip = seed % 2 === 1;
  sash(flip ? 2.6 : 0.5, 1.0, 1.9, 1.7);
  const dx0 = flip ? 0.7 : 3.4, doors = ['#1f3a5a', '#7a1f24', '#2e5a3a', '#1c1c1e', '#5a2a5e', '#c9a23a', '#3a6a7a'];
  g.fillStyle = '#efebe2'; g.fillRect(X(dx0) - 4, Y(2.75) - 4, 0.95 * px + 8, 2.6 * px + 4);
  g.fillStyle = doors[r.int(0, doors.length - 1)]; g.fillRect(X(dx0), Y(2.3), 0.95 * px, 2.15 * px);
  for (const ux of [0.55, 2.95]) sash(ux, 3.65, 1.4, 1.5);
  return c;
}
// church stone (coursed rubble), with a few dark arched windows drawn on
function gkStoneCanvas(seed, w = 512, h = 512) {
  const r = new RNG(seed);
  return gkCanvas(w, h, (g) => {
    g.fillStyle = '#8f877a'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 22) for (let x = -r.range(0, 40); x < w; x += r.range(30, 60)) { const k = r.range(-18, 18); g.fillStyle = `rgb(${168 + k},${158 + k},${140 + k})`; g.fillRect(x + 2, y + 2, r.range(26, 56), 18); }
  });
}
function gkSlateCanvas(seed, w = 256, h = 256) {
  const r = new RNG(seed);
  return gkCanvas(w, h, (g) => { g.fillStyle = '#3c4148'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 12) for (let x = (y / 12) % 2 ? -10 : 0; x < w; x += 20) { const k = r.range(-10, 10); g.fillStyle = `rgb(${66 + k},${72 + k},${80 + k})`; g.fillRect(x + 1, y + 1, 18, 10); } });
}
function gkBallCanvas() {
  return gkCanvas(128, 64, (g, w, h) => { g.fillStyle = '#f4f2ec'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a1a1a'; for (let i = 0; i < 6; i++) { const x = (i * 23 + 8) % w, y = i % 2 ? 18 : 44; g.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283; g.lineTo(x + Math.cos(a) * 8, y + Math.sin(a) * 8); } g.fill(); } });
}
// a wheelie bin (240 l): body, lid, wheels; origin on the ground at its middle
function gkBuildBin(color) {
  const g = new THREE.Group(), m = gkStd(color, 0.55);
  gkMesh(new THREE.CylinderGeometry(0.33, 0.27, 0.98, 4, 1).rotateY(Math.PI / 4).scale(1.0, 1, 1.25), m, 0, 0.53, 0, g);
  gkBox(0.6, 0.05, 0.76, m, 0, 1.05, 0, g);
  for (const sx of [-1, 1]) { const w = gkCyl(0.1, 0.1, 0.05, gkStd('#141414', 0.8), sx * 0.24, 0.1, 0.3, g, 14); w.rotation.z = Math.PI / 2; }
  return g;
}
// a park tree: a trunk in three segments that bend in turn, a crown of blobs in autumn colours
function gkBuildTree(parent, x, z, h, seed, M) {
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
  const segs = [], r0 = 0.14 + 0.07 * (h / 10);
  let par = g;
  for (let k = 0; k < 3; k++) {
    const sg = new THREE.Group(); sg.position.y = k ? h * 0.5 / 3 : 0; par.add(sg); segs.push(sg);
    gkCyl(r0 * (1 - 0.22 * k) * 0.8, r0 * (1 - 0.22 * k), h * 0.5 / 3 + 0.05, M.bark, 0, h * 0.5 / 6, 0, sg, 8);
    par = sg;
  }
  const top = segs[2], cr = h * 0.27, crown = new THREE.Group(); crown.position.y = h * 0.5 / 3; top.add(crown);
  const mats = [M.leafO, M.leafY, M.leafR, M.leafG], k0 = Math.floor(seed * 4);
  gkMesh(gkBlobGeo(cr, seed * 9 + 1), mats[k0 % 4], 0, cr * 0.75, 0, crown);
  gkMesh(gkBlobGeo(cr * 0.75, seed * 9 + 2), mats[(k0 + 1) % 4], cr * 0.6, cr * 0.35, cr * 0.3, crown);
  gkMesh(gkBlobGeo(cr * 0.7, seed * 9 + 3), mats[(k0 + 2) % 4], -cr * 0.55, cr * 0.45, -cr * 0.35, crown);
  gkMesh(gkBlobGeo(cr * 0.6, seed * 9 + 4), mats[k0 % 4], 0.1 * cr, cr * 1.35, -0.2 * cr, crown);
  return { g, segs, crown, h, cr, x, z, stiff: 1.0 + 0.8 * gkR(Math.round(seed * 100), 3), seed };
}
// a bird (pigeon / duck): a body, a head, two wings that flap
function gkBuildBird(col, s = 1) {
  const g = new THREE.Group(), m = gkStd(col, 0.8), w = [];
  gkMesh(new THREE.SphereGeometry(0.12 * s, 8, 6).scale(1.6, 0.8, 0.9), m, 0, 0, 0, g);
  gkMesh(new THREE.SphereGeometry(0.06 * s, 8, 6), m, 0.18 * s, 0.05 * s, 0, g);
  for (const sd of [-1, 1]) { const p = new THREE.Group(); p.position.set(0, 0.03 * s, sd * 0.06 * s); g.add(p); const wing = gkBox(0.16 * s, 0.01 * s, 0.26 * s, m, 0, 0, sd * 0.13 * s, p); wing.castShadow = false; w.push(p); }
  g.userData.wings = w; return g;
}

function gkBuildStreet(S) {
  const scene = S.scene, T = { M: {} }, root = new THREE.Group(); root.name = 'street'; scene.add(root); T.root = root;
  const as = Tex.asphalt(41); for (const t of [as.map, as.roughnessMap, as.bumpMap]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(60, 1); }
  const tex = (c, rx, ry) => { const t = gkTex(c); t.repeat.set(rx, ry); return t; };
  const M = T.M = {
    road: gkStd('#ffffff', 0.92, 0, { map: as.map, roughnessMap: as.roughnessMap, bumpMap: as.bumpMap, bumpScale: 0.5 }),
    pav: gkStd('#ffffff', 0.85, 0, { map: tex(gkPavingCanvas(43), 160, 1) }), kerb: gkStd('#9a968c', 0.8),
    grass: gkStd('#ffffff', 1.0, 0, { map: tex(gkGrassCanvas(5), 300, 300) }), park: gkStd('#ffffff', 1.0, 0, { map: tex(gkGrassCanvas(9), 40, 30) }),
    path: gkStd('#c2b59c', 0.95), rubber: gkStd('#a8473a', 0.95), mud: gkStd('#3d3428', 1.0), stoneEdge: gkStd('#a39d90', 0.85),
    stone: gkStd('#ffffff', 0.95, 0, { map: tex(gkStoneCanvas(61), 4, 2) }), slate: gkStd('#ffffff', 0.85, 0, { map: tex(gkSlateCanvas(3), 8, 4) }),
    roofFlat: gkStd('#5a5754', 0.95), concrete: gkStd('#b9b2a5', 0.95), roof: gkStd('#4a4644', 0.85), roof2: gkStd('#5a4a44', 0.85), roofT: gkStd('#7a3d2c', 0.85),
    brickSide: gkStd('#ffffff', 0.92, 0, { map: tex(gkBrickCanvas(25, [118, 70, 54]), 2, 2) }),
    post: gkStd('#2a2e32', 0.5, 0.5), rail: gkStd('#1c1f22', 0.5, 0.4), metal: gkStd('#c8463a', 0.5, 0.3), metal2: gkStd('#2f6f8a', 0.5, 0.3), chain: gkStd('#8d9297', 0.4, 0.8),
    lampGlass: gkStd('#fff4dd', 0.3, 0, { emissive: new THREE.Color('#ffe2a8'), emissiveIntensity: 0.15 }),
    bark: gkStd('#4f4236', 0.95), bench: gkStd('#6a5038', 0.8),
    leafO: gkStd('#c8742c', 0.85, 0, { flatShading: true }), leafY: gkStd('#d9a63a', 0.85, 0, { flatShading: true }), leafR: gkStd('#a8402a', 0.85, 0, { flatShading: true }), leafG: gkStd('#6f7f3a', 0.85, 0, { flatShading: true }),
    water: new THREE.MeshStandardMaterial({ color: '#2f4f4c', transparent: true, opacity: 0.9, roughness: 0.12, metalness: 0.0, envMapIntensity: 0.8, side: THREE.DoubleSide }),
    sheet: new THREE.MeshStandardMaterial({ color: '#7f9aa2', transparent: true, opacity: 0.5, roughness: 0.05, envMapIntensity: 1.4, depthWrite: false }),
    tile: gkStd('#7a3d2c', 0.8), batten: gkStd('#3b302a', 0.95), glassB: gkStd('#9fb4bf', 0.2, 0.3, { transparent: true, opacity: 0.45 }),
  };
  const B = new Batcher();
  const S0 = GK_ST, k = S0.kerbH, E = S0.east;
  // ------------------------------------------------------------------ the ground (cut into tiles: depth precision in software rendering)
  Object.assign(M.grass, { polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 8 });
  { const gm = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000, 80, 80), M.grass); gm.rotation.x = -Math.PI / 2; gm.position.set(0, -0.02, 0); gm.receiveShadow = true; root.add(gm); }
  { const P = S0.park, m = new THREE.Mesh(new THREE.PlaneGeometry(P.x[1] - P.x[0], P.z[1] - P.z[0], 28, 18), M.park); m.rotation.x = -Math.PI / 2; m.position.set((P.x[0] + P.x[1]) / 2, -0.005, (P.z[0] + P.z[1]) / 2); m.receiveShadow = true; root.add(m); }
  // the street: road (x −320 … the church), pavements, kerbs, markings; the cross street (x 76…84) north and south
  Object.assign(M.road, { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 3 });
  const X0 = -320, RD = S0.road.z;
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(E - X0, RD[1] - RD[0], 80, 1), M.road); m.rotation.x = -Math.PI / 2; m.position.set((X0 + E) / 2, 0.0, (RD[0] + RD[1]) / 2); m.receiveShadow = true; root.add(m);
    const c = new THREE.Mesh(new THREE.PlaneGeometry(8, 400, 1, 40), M.road); c.rotation.x = -Math.PI / 2; c.position.set(80, 0.001, -120); c.receiveShadow = true; root.add(c);
    const c2 = new THREE.Mesh(new THREE.PlaneGeometry(8, 300, 1, 30), M.road); c2.rotation.x = -Math.PI / 2; c2.position.set(29, 0.001, 150); c2.receiveShadow = true; root.add(c2); }
  for (const P of S0.pav) { const m = new THREE.Mesh(new THREE.PlaneGeometry(E - X0, P[1] - P[0], 80, 1), M.pav); m.rotation.x = -Math.PI / 2; m.position.set((X0 + E) / 2, k, (P[0] + P[1]) / 2); m.receiveShadow = true; root.add(m);
    B.box(E - X0, k, P[1] - P[0], (X0 + E) / 2, k / 2, (P[0] + P[1]) / 2, M.kerb); }
  { const wm = gkStd('#ecebe4', 0.6);
    for (let x = X0 + 3; x < E - 6; x += 9) { const geo = new THREE.PlaneGeometry(4, 0.1); geo.rotateX(-Math.PI / 2); B.add(geo, wm, Geo.matrix(x + 2, 0.006, (RD[0] + RD[1]) / 2)); }
    for (const z of [RD[0] + 0.3, RD[1] - 0.3]) { const geo = new THREE.PlaneGeometry(E - X0 - 4, 0.08); geo.rotateX(-Math.PI / 2); B.add(geo, gkStd('#d9c25a', 0.6), Geo.matrix((X0 + E) / 2, 0.006, z)); } }
  // lamp posts along both pavements (set in concrete: they hold)
  T.posts = [];
  for (let x = -60; x < E - 4; x += 26) { T.posts.push([x, -10.2, 1]); T.posts.push([x + 13, -1.6, -1]); }
  for (const [x, z, f] of T.posts) {
    B.add(new THREE.CylinderGeometry(0.06, 0.085, 6.0, 10), M.post, Geo.matrix(x, 3.12, z));
    B.add(new THREE.BoxGeometry(0.06, 0.06, 0.9), M.post, Geo.matrix(x, 6.07, z + f * 0.42));
    B.add(new THREE.BoxGeometry(0.3, 0.1, 0.55), M.post, Geo.matrix(x, 6.02, z + f * 0.85));
    B.add(new THREE.BoxGeometry(0.24, 0.02, 0.45), M.lampGlass, Geo.matrix(x, 5.96, z + f * 0.85));
  }
  // ------------------------------------------------------------------ your block (its front has the hole of your window; hollow behind it)
  { const A = S0.blockA, cols = [-17.8, -12.3, -6.8, -1.3, 4.2, 9.7, 15.2];
    const fc = gkBlockFacade(11, A.x[1] - A.x[0], A.h, { cols, x0: A.x[0], door: -4.0 });
    const fm = gkStd('#ffffff', 0.9, 0, { map: gkTex(fc, { repeat: false }) });
    const wi = GK_ROOM.win, ox = GK_ROOM.origin[0], oy = GK_ROOM.origin[1];
    const hole = [ox + wi.x[0], ox + wi.x[1], oy + wi.y[0], oy + wi.y[1]];
    // the front: cells round the hole, uv from position (the facade texture spans the whole front)
    const pos = [], uv = [], idx = [];
    for (const c of gkWallCells(A.x[0], A.x[1], 0, A.h, [hole])) {
      const n = pos.length / 3, U = (x) => (x - A.x[0]) / (A.x[1] - A.x[0]), V = (y) => y / A.h;
      for (const [x, y] of [[c[0], c[2]], [c[1], c[2]], [c[1], c[3]], [c[0], c[3]]]) { pos.push(x, y, -0.002); uv.push(U(x), V(y)); }
      idx.push(n, n + 2, n + 1, n, n + 3, n + 2);
    }
    const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); fg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); fg.setIndex(idx); fg.computeVertexNormals();
    const front = new THREE.Mesh(fg, fm); front.receiveShadow = true; root.add(front);
    // your window's reveal (the wall's thickness round the hole), its outer frame
    const [hx0, hx1, hy0, hy1] = hole;
    for (const [x, y, w, h, d] of [[(hx0 + hx1) / 2, hy0 - 0.02, hx1 - hx0, 0.04, 0.25], [(hx0 + hx1) / 2, hy1 + 0.02, hx1 - hx0, 0.04, 0.25], [hx0 - 0.02, (hy0 + hy1) / 2, 0.04, hy1 - hy0, 0.25], [hx1 + 0.02, (hy0 + hy1) / 2, 0.04, hy1 - hy0, 0.25]]) B.box(w, h, d, x, y, 0.125, M.concrete);
    B.box(hx1 - hx0 + 0.2, 0.05, 0.12, (hx0 + hx1) / 2, hy0 - 0.03, -0.05, M.kerb);
    // the rest of the block: boxes round your flat (x 1.25…6.75, y up to 11.85, z 0…4.5), facades on the sides and back
    const side = gkStd('#ffffff', 0.9, 0, { map: gkTex(gkBlockFacade(12, 12, A.h, { cols: [2.5, 8.5], x0: 0 }), { repeat: false }) });
    const back = gkStd('#ffffff', 0.9, 0, { map: gkTex(gkBlockFacade(13, 44, A.h, { cols, x0: A.x[0] }), { repeat: false }) });
    const bx = (x0, x1, y0, y1, z0, z1, mats) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mats); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); m.castShadow = m.receiveShadow = true; root.add(m); return m; };
    const c = M.concrete, rf = M.roofFlat;
    bx(A.x[0], 1.25, 0, A.h, 0.02, 4.5, [c, side, rf, c, c, c]); bx(6.75, A.x[1], 0, A.h, 0.02, 4.5, [side, c, rf, c, c, c]);
    bx(1.25, 6.75, 0, 8.8, 0.02, 4.5, [c, c, c, c, c, c]); bx(1.25, 6.75, 11.85, A.h, 0.02, 4.5, [c, c, rf, c, c, c]);
    bx(A.x[0], A.x[1], 0, A.h, 4.5, A.z[1], [side, side, rf, c, back, c]);
    B.box(A.x[1] - A.x[0] + 0.2, 0.4, 0.25, 0, A.h - 0.2, 0.0, M.kerb);                                  // the parapet
  }
  // ------------------------------------------------------------------ the next block (balconies: each its own group, on its north face)
  { const Bb = S0.blockB, cols = [38, 46, 54, 62, 70];
    const fm = gkStd('#ffffff', 0.9, 0, { map: gkTex(gkBlockFacade(21, Bb.x[1] - Bb.x[0], Bb.h, { cols, x0: Bb.x[0], base: '#cdb9a2', door: 50 }), { repeat: false }) });
    const side = gkStd('#ffffff', 0.9, 0, { map: gkTex(gkBlockFacade(22, 12, Bb.h, { cols: [2.5, 8.5], x0: 0, base: '#cdb9a2' }), { repeat: false }) });
    const m = new THREE.Mesh(new THREE.BoxGeometry(Bb.x[1] - Bb.x[0], Bb.h, Bb.z[1] - Bb.z[0]), [side, side, M.roofFlat, M.concrete, side, fm]);
    m.position.set((Bb.x[0] + Bb.x[1]) / 2, Bb.h / 2, (Bb.z[0] + Bb.z[1]) / 2); m.castShadow = m.receiveShadow = true; root.add(m);
    T.balc = GK_BALC.map((b) => {
      const pv = new THREE.Group(); pv.position.set(b.x, b.y + 0.15, b.z); root.add(pv);           // (the hinge: its root on the wall, at the slab's top)
      const g = new THREE.Group(); pv.add(g);
      gkBox(b.w, 0.18, b.d, M.concrete, 0, -0.09, -b.d / 2, g);
      gkBox(b.w, 1.0, 0.02, M.glassB, 0, 0.5, -b.d + 0.02, g); gkBox(0.02, 1.0, b.d, M.glassB, -b.w / 2 + 0.02, 0.5, -b.d / 2, g); gkBox(0.02, 1.0, b.d, M.glassB, b.w / 2 - 0.02, 0.5, -b.d / 2, g);
      gkBox(b.w, 0.04, 0.05, M.post, 0, 1.0, -b.d + 0.02, g);
      if (b.i % 2 === 0) { gkBox(b.w - 0.1, 0.3, 0.28, M.concrete, 0, 0.15, -b.d + 0.18, g); gkMesh(gkBlobGeo(0.22, b.i), M.leafG, -0.6, 0.38, -b.d + 0.18, g); }   // (a built-in planter)
      return { b, pv, g };
    });
  }
  // ------------------------------------------------------------------ the church at the end of the street: nave, slate roof, tower; the spire
  { const C = S0.church, N = C.nave, Tw = C.tower;
    const nm = new THREE.Mesh(new THREE.BoxGeometry(N.x[1] - N.x[0], N.h, N.z[1] - N.z[0]), M.stone); nm.position.set((N.x[0] + N.x[1]) / 2, N.h / 2, (N.z[0] + N.z[1]) / 2); nm.castShadow = nm.receiveShadow = true; root.add(nm);
    const sh = new THREE.Shape(), d = (N.z[1] - N.z[0]) / 2; sh.moveTo(-d - 0.4, 0); sh.lineTo(d + 0.4, 0); sh.lineTo(0, N.ridge - N.h); sh.closePath();
    const rg = new THREE.ExtrudeGeometry(sh, { depth: N.x[1] - N.x[0] + 0.6, bevelEnabled: false }); rg.rotateY(Math.PI / 2); rg.translate(N.x[0] - 0.3, N.h, (N.z[0] + N.z[1]) / 2);
    const rm = new THREE.Mesh(rg, M.slate); rm.castShadow = rm.receiveShadow = true; root.add(rm);
    const tm = new THREE.Mesh(new THREE.BoxGeometry(Tw.x[1] - Tw.x[0], Tw.h, Tw.z[1] - Tw.z[0]), M.stone); tm.position.set((Tw.x[0] + Tw.x[1]) / 2, Tw.h / 2, (Tw.z[0] + Tw.z[1]) / 2); tm.castShadow = tm.receiveShadow = true; root.add(tm);
    for (const [x, z] of [[Tw.x[0], Tw.z[0]], [Tw.x[1], Tw.z[0]], [Tw.x[0], Tw.z[1]], [Tw.x[1], Tw.z[1]]]) B.box(0.8, 1.4, 0.8, x + (x === Tw.x[0] ? 0.4 : -0.4), Tw.h + 0.7, z + (z === Tw.z[0] ? 0.4 : -0.4), M.stone);
    // dark windows: lancets on the nave's north side, louvres in the tower
    for (let x = N.x[0] + 4; x < N.x[1] - 2; x += 5) B.box(1.4, 4.2, 0.1, x, 5.5, N.z[0] - 0.05, M.post);
    for (const z of [Tw.z[0] - 0.05, Tw.z[1] + 0.05]) B.box(1.6, 3.0, 0.1, (Tw.x[0] + Tw.x[1]) / 2, Tw.h - 4, z, M.post);
    B.box(0.1, 3.0, 1.6, Tw.x[0] - 0.05, Tw.h - 4, (Tw.z[0] + Tw.z[1]) / 2, M.post);
    // the spire (an octagonal cone), pivoting on the tower top's east edge
    const pv = new THREE.Group(); pv.position.set((Tw.x[0] + Tw.x[1]) / 2 + C.spireR, Tw.h, (Tw.z[0] + Tw.z[1]) / 2); root.add(pv);
    const sp = new THREE.Mesh(new THREE.ConeGeometry(C.spireR, C.spire, 8), M.stone); sp.position.set(-C.spireR, C.spire / 2, 0); sp.castShadow = true; pv.add(sp);
    gkCyl(C.spireR * 1.08, C.spireR * 1.12, 0.5, M.stone, -C.spireR, 0.25, 0, pv, 8);
    gkCyl(0.05, 0.05, 2.0, M.post, sp.position.x, C.spire + 1.0, 0, pv, 6);
    T.spire = { pv, sp, base: pv.position.clone() };
    // the churchyard wall
    B.box(0.5, 1.2, 28, E - 1, 0.6, -36, M.stone);
  }
  // ------------------------------------------------------------------ the park: railings, paths, benches, lamp posts, the pond
  { const P = S0.park;
    for (let x = P.x[0]; x < P.x[1]; x += 0.15) B.box(0.02, 1.1, 0.02, x, 0.55, P.z[1] + 0.25, M.rail);
    for (const y of [0.1, 1.05]) B.box(P.x[1] - P.x[0], 0.04, 0.04, (P.x[0] + P.x[1]) / 2, y, P.z[1] + 0.25, M.rail);
    for (let z = P.z[0]; z < P.z[1]; z += 0.15) B.box(0.02, 1.1, 0.02, P.x[1], 0.55, z, M.rail);
    for (const y of [0.1, 1.05]) B.box(0.04, 0.04, P.z[1] - P.z[0], P.x[1], y, (P.z[0] + P.z[1]) / 2, M.rail);
    // paths: one along the railings, two crossing the park, a ring round the pond
    const path = (x0, z0, x1, z1, w = 2.6) => { const L = Math.hypot(x1 - x0, z1 - z0), geo = new THREE.PlaneGeometry(L, w); geo.rotateX(-Math.PI / 2); B.add(geo, M.path, Geo.matrix((x0 + x1) / 2, 0.006, (z0 + z1) / 2, 0, -Math.atan2(z1 - z0, x1 - x0), 0)); };
    path(P.x[0], -15.5, P.x[1], -15.5); path(-60, -15.5, -10, -95); path(60, -15.5, 12, -95); path(-66, -80, 66, -80, 2.2);
    { const pd = S0.pond, ring = new THREE.RingGeometry(1, 1.16, 48); ring.rotateX(-Math.PI / 2); ring.scale(pd.rx, 1, pd.rz); B.add(ring, M.path, Geo.matrix(pd.x, 0.007, pd.z)); }
    for (const [x, z, ry] of [[-34, -17.2, 0], [-8, -17.2, 0], [20, -17.2, 0], [-20, -40, 0.5], [22, -64, -0.4], [-30, -78.4, 0]]) {
      B.box(1.6, 0.06, 0.45, x, 0.45, z, M.bench, ry); B.box(1.6, 0.4, 0.06, x, 0.7, z - 0.22 * Math.cos(ry), M.bench, ry); for (const dx of [-0.7, 0.7]) B.box(0.06, 0.45, 0.4, x + dx * Math.cos(ry), 0.22, z + dx * Math.sin(ry), M.post, ry); }
    for (const [x, z] of [[-45, -15.5], [0, -15.5], [45, -15.5], [-20, -80], [24, -80]]) { B.add(new THREE.CylinderGeometry(0.05, 0.07, 4.0, 8), M.post, Geo.matrix(x, 2.0, z + 1.4)); B.add(new THREE.SphereGeometry(0.22, 10, 8), M.lampGlass, Geo.matrix(x, 4.15, z + 1.4)); }
    // the pond's basin (ground: it stays): a stone edge, the muddy bottom 0.7 m down
    const pd = S0.pond;
    { const e = new THREE.RingGeometry(0.97, 1.02, 64); e.rotateX(-Math.PI / 2); e.scale(pd.rx, 1, pd.rz); B.add(e, M.stoneEdge, Geo.matrix(pd.x, 0.03, pd.z));
      const bot = new THREE.CircleGeometry(1, 48); bot.rotateX(-Math.PI / 2); bot.scale(pd.rx * 0.97, 1, pd.rz * 0.97); B.add(bot, M.mud, Geo.matrix(pd.x, -0.012, pd.z)); }
  }
  // ------------------------------------------------------------------ the playground: rubber surface, the climbing dome, the swings, a slide
  { const D = S0.dome, Sw = S0.swings;
    const pad = new THREE.PlaneGeometry(26, 24); pad.rotateX(-Math.PI / 2); B.add(pad, M.rubber, Geo.matrix(D.x + 6, 0.008, D.z + 3));
    // a geodesic half-dome of bars (an icosahedron, split once, its upper half; the bars are its edges)
    const ico = new THREE.IcosahedronGeometry(D.r, 1), p = ico.attributes.position, edges = new Map();
    for (let i = 0; i < p.count; i += 3) for (let a = 0; a < 3; a++) {
      const v1 = new THREE.Vector3().fromBufferAttribute(p, i + a), v2 = new THREE.Vector3().fromBufferAttribute(p, i + (a + 1) % 3);
      if (v1.y < -0.05 * D.r || v2.y < -0.05 * D.r) continue;
      const key = [v1, v2].map((v) => v.toArray().map((x) => x.toFixed(3)).join(',')).sort().join('|'); if (!edges.has(key)) edges.set(key, [v1, v2]);
    }
    T.domeBars = [];
    for (const [v1, v2] of edges.values()) { const a = [v1.x + D.x, Math.max(0, v1.y), v1.z + D.z], b = [v2.x + D.x, Math.max(0, v2.y), v2.z + D.z], L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      const geo = new THREE.CylinderGeometry(0.03, 0.03, L, 6); geo.translate(0, L / 2, 0); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize());
      B.add(geo, (T.domeBars.length % 3) ? M.metal : M.metal2, new THREE.Matrix4().compose(new THREE.Vector3(...a), q, new THREE.Vector3(1, 1, 1))); T.domeBars.push([a, b]); }
    // the swings: an A-frame each end, the top bar along z (so the swings turn round it in the plane down turns in)
    const zx = [Sw.z - 3.2, Sw.z + 3.2];
    for (const z of zx) for (const dx of [-1, 1]) { const geo = new THREE.CylinderGeometry(0.05, 0.05, 2.7, 8); B.add(geo, M.metal2, Geo.matrix(Sw.x + dx * 0.6, 1.25, z, 0, 0, dx * 0.25)); }
    { const geo = new THREE.CylinderGeometry(0.055, 0.055, 6.6, 8); geo.rotateX(Math.PI / 2); B.add(geo, M.metal2, Geo.matrix(Sw.x, Sw.top, Sw.z)); }
    T.swings = [];
    for (let i = 0; i < Sw.n; i++) { const pv = new THREE.Group(); pv.position.set(Sw.x, Sw.top, Sw.z - 1.6 + i * 1.6); root.add(pv);
      for (const dz of [-0.22, 0.22]) gkCyl(0.008, 0.008, 1.95, M.chain, 0, -0.975, dz, pv, 4);
      gkBox(0.22, 0.04, 0.5, gkStd('#222', 0.7), 0, -1.97, 0, pv); T.swings.push({ pv, ph: i * 1.9 }); }
    // a slide (fixed)
    B.box(0.5, 0.06, 3.2, D.x + 12, 1.0, D.z + 8, M.metal, 0); for (const dz of [-1.5]) B.box(0.6, 2.0, 0.06, D.x + 12, 1.0, D.z + 8 + dz, M.metal2);
  }
  // ------------------------------------------------------------------ trees in the park (rooted: they bend and hold); their leaves (below)
  T.trees = [];
  { const r = new RNG(29), spots = [[-58, -24], [-46, -36], [-60, -58], [-38, -70], [-22, -28], [24, -38], [16, -70], [42, -60], [58, -40], [-6, -88], [34, -88], [58, -76], [-52, -92], [-30, -50]];
    for (const [x, z] of spots) T.trees.push(gkBuildTree(root, x + r.range(-2, 2), z + r.range(-2, 2), r.range(10, 14), r.next(), M)); }
  // ------------------------------------------------------------------ the terrace along the park's north side (front z −104, facing south)
  T.roofs = [];
  { const r = new RNG(19), bricks = [[128, 72, 56], [150, 98, 70], [120, 66, 52], [158, 120, 88], [138, 80, 60]];
    const fm = Array.from({ length: 6 }, (_, v) => gkStd('#ffffff', 0.85, 0, { map: gkTex(gkTerraceFacade(100 + v, bricks[v % bricks.length]), { repeat: false }) }));
    const zf = -104, d = 8, eaves = 6.6, ridge = 9.2;
    for (let x = -92; x < 92; x += 5) {
      const v = r.int(0, 5);
      B.box(5, eaves, d, x + 2.5, eaves / 2, zf - d / 2, M.brickSide);
      const fg = new THREE.PlaneGeometry(5, eaves); fg.translate(0, eaves / 2, 0); B.add(fg, fm[v], Geo.matrix(x + 2.5, 0, zf + 0.004));
      const sh = new THREE.Shape(); sh.moveTo(-d / 2 - 0.3, 0); sh.lineTo(d / 2 + 0.3, 0); sh.lineTo(0, ridge - eaves); sh.closePath();
      const rg = new THREE.ExtrudeGeometry(sh, { depth: 5, bevelEnabled: false }); rg.rotateY(Math.PI / 2); rg.translate(-2.5, 0, 0);
      B.add(rg, x >= -7 && x <= 8 ? M.batten : M.roofT, Geo.matrix(x + 2.5, eaves, zf - d / 2));
      if (((x + 92) / 5) % 2 === 0) B.box(0.7, 1.3, 0.9, x, ridge + 0.3, zf - d / 2, M.brickSide);
      T.roofs.push({ x0: x, x1: x + 5, zf, d, eaves, ridge });
    } }
  // ------------------------------------------------------------------ the town around (far: static)
  { const r = new RNG(83), cols = ['#d9d4c8', '#b8a898', '#c9b8a4', '#9a8a7a', '#e2ddd2', '#a8b4bc'];
    const mats = cols.map((c) => gkStd(c, 0.9)), roofs = [M.roof, M.roof2, M.roofT];
    const house = (x, z, w, d, h, ry) => { B.box(w, h, d, x, h / 2, z, mats[r.int(0, mats.length - 1)], ry);
      const sh = new THREE.Shape(); sh.moveTo(-d / 2 - 0.3, 0); sh.lineTo(d / 2 + 0.3, 0); sh.lineTo(0, 2.4); sh.closePath();
      const rg = new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: false }); rg.rotateY(Math.PI / 2); rg.translate(-w / 2, 0, 0); B.add(rg, roofs[r.int(0, 2)], Geo.matrix(x, h, z, 0, ry, 0)); };
    const flats = (x, z, w, d, h) => B.box(w, h, d, x, h / 2, z, mats[r.int(0, mats.length - 1)]);
    for (let k = 0; k < 4; k++) for (let x = -150; x < 150; x += r.range(11, 16)) house(x, -122 - k * 16 - r.range(0, 4), r.range(8, 11), r.range(7, 9), r.range(5.5, 6.6), 0);
    for (let k = 0; k < 3; k++) for (let x = -200; x < 200; x += r.range(30, 46)) flats(x, 30 + k * 26 + r.range(0, 6), r.range(26, 40), 12, r.range(9, 15));
    for (let x = -300; x < -40; x += r.range(34, 46)) flats(x, 6, r.range(26, 36), 12, r.range(10, 13));
    for (let k = 0; k < 3; k++) for (let z = -120; z < 60; z += r.range(12, 16)) house(96 + k * 15 + r.range(0, 3), z, r.range(7, 9), r.range(8, 11), r.range(5.5, 6.6), Math.PI / 2);
    for (let i = 0; i < 70; i++) { const x = r.range(-260, 260), z = (r.next() < 0.5 ? -1 : 1) * r.range(110, 260), h = r.range(7, 12);
      if (Math.abs(z) < 108) continue;
      B.add(new THREE.CylinderGeometry(0.15, 0.22, h * 0.5, 6), M.bark, Geo.matrix(x, h * 0.25, z)); B.add(gkBlobGeo(h * 0.3, i + 7), [M.leafO, M.leafY, M.leafG][i % 3], Geo.matrix(x, h * 0.62, z)); } }
  B.build(root, 'street');

  // ==================================================================== MOVING THINGS
  // ---- the simulated bodies: cars, bins, balls, the bike
  const VF = new VehicleFactory();
  T.sim = GK_ST.bodies.map((b) => {
    const g = new THREE.Group(); root.add(g);
    if (b.kind === 'car') { const o = VF.build(b.type, b.col); o.group.position.x = -b.L / 2; const turn = new THREE.Group(); turn.rotation.y = b.dir > 0 ? 0 : Math.PI; turn.add(o.group); g.add(turn); }
    else if (b.kind === 'bin') g.add(gkBuildBin(b.col));
    else if (b.kind === 'ball') { const m = gkMesh(new THREE.SphereGeometry(0.11, 16, 12), b.col === '#f2f0ea' ? gkStd('#ffffff', 0.5, 0, { map: gkTex(gkBallCanvas(), { repeat: false }) }) : gkStd(b.col, 0.5), 0, 0, 0, g); m.castShadow = true; }
    else if (b.kind === 'bike') { const fm = gkStd(b.col, 0.4, 0.4), tm = gkStd('#151515', 0.8);
      for (const x of [-0.55, 0.55]) { const w = gkMesh(new THREE.TorusGeometry(0.33, 0.025, 6, 20), tm, x, 0.03, 0, g); w.rotation.x = Math.PI / 2; }
      for (const [a, b2] of [[[-0.55, 0.05, 0], [0, 0.05, 0.05]], [[0, 0.05, 0.05], [0.45, 0.05, -0.05]], [[-0.55, 0.05, 0], [-0.1, 0.05, -0.25]], [[-0.1, 0.05, -0.25], [0.45, 0.05, -0.05]], [[0.45, 0.05, -0.05], [0.55, 0.05, 0]]]) { const st = gkCyl(1, 1, 1, fm, 0, 0, 0, g, 6); st.geometry = new THREE.CylinderGeometry(1, 1, 1, 6).translate(0, 0.5, 0); gkStrut(st, a, b2, 0.016); }
      gkBox(0.08, 0.04, 0.5, tm, 0.5, 0.06, 0.0, g); }
    return { b, g };
  });
  // ---- the pond's water (a disc that stays level with down and empties east) and the sheet it becomes on the grass
  { const pd = S0.pond, geo = new THREE.CircleGeometry(1, 40, 0, Math.PI * 2); geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, M.water); m.position.set(pd.x, -0.02, pd.z); m.scale.set(pd.rx * 0.97, 1, pd.rz * 0.97); m.receiveShadow = true; root.add(m);
    T.pond = { m, geo, base: Float32Array.from(geo.attributes.position.array) };
    const sg = new THREE.PlaneGeometry(1, 1, 24, 10); sg.rotateX(-Math.PI / 2); sg.translate(0.5, 0, 0);
    const sm = new THREE.Mesh(sg, M.sheet); sm.renderOrder = 3; root.add(sm); T.sheet = { m: sm };
  }
  // ---- leaves: on the grass and in the crowns; they slide east, then lift off and go round (gkFly)
  { const N = 3200, r = new RNG(311), L = [];
    for (let i = 0; i < N; i++) {
      const tree = r.next() < 0.55 ? T.trees[r.int(0, T.trees.length - 1)] : null, vt = r.range(0.9, 2.2);
      let x, y, z, det;
      if (tree) { const a = r.range(0, 6.28), d = r.range(0, tree.cr * 1.1); x = tree.x + Math.cos(a) * d; z = tree.z + Math.sin(a) * d; y = tree.h * 0.5 + tree.cr * r.range(0.2, 1.6); det = r.next() < 0.22 ? r.range(18, 70) : r.range(92, 215); }
      else { const P = S0.park; x = r.range(P.x[0] + 2, P.x[1] - 2); z = r.range(P.z[0] + 2, P.z[1] - 2); y = 0.02; det = r.range(24, 52); }
      L.push({ x, y, z, vt, det, tree: tree ? T.trees.indexOf(tree) : -1, vg: r.range(0.8, 2.2), ph: r.range(0, 6.28), sp: r.range(2, 6), c: r.int(0, 3) });
    }
    const geo = new THREE.PlaneGeometry(0.2, 0.15), cols = ['#c8742c', '#d9a63a', '#a8402a', '#8a6a2a'].map((c) => new THREE.Color(c));
    const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.8, side: THREE.DoubleSide }), N); im.frustumCulled = false; im.castShadow = false;
    L.forEach((l, i) => im.setColorAt(i, cols[l.c])); root.add(im);
    T.leaves = { L, im, fly: new Uint8Array(N) };
  }
  // ---- drops (the pond, going up): streaks, each turned to face the camera along its velocity
  { const N = 6000, r = new RNG(421), D = [];
    for (let i = 0; i < N; i++) D.push({ x: r.range(52, 74), z: r.range(-96, -14), deg1: r.range(GK_POND.lift[0], GK_POND.lift[1]), vt: 1.5 + 7.5 * Math.pow(r.next(), 0.7), y0: r.range(0, 0.6), j: r.range(0, 1) });
    const geo = new THREE.BufferGeometry(), pos = new Float32Array(N * 12), uv = new Float32Array(N * 8), idx = new Uint32Array(N * 6);
    for (let i = 0; i < N; i++) { uv.set([0, 0, 1, 0, 1, 1, 0, 1], i * 8); idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6); }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
    const st = gkCanvas(8, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0.3)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    const mat = new THREE.MeshBasicMaterial({ color: '#e8f0f4', map: gkTex(st, { repeat: false }), transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide, fog: true });
    const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = 7; root.add(mesh);
    T.drops = { D, mesh, geo, pos, mat };
  }
  // ---- roof tiles: the south slopes of the four houses in front of the park's middle, course by course (19 courses of
  // 12); they lift off their battens from ~100° (held only by their weight and a little grip)
  { const r = new RNG(521), Tl = [];
    for (const R of T.roofs) if (R.x0 >= -7 && R.x0 <= 8) for (let j = 0; j < 19; j++) for (let i = 0; i < 12; i++) { const side = 1, u = (j + 0.5) / 19;
      Tl.push({ x: R.x0 + 0.21 + 0.4 * i + 0.1 + r.range(-0.01, 0.01), y: R.eaves + (R.ridge - R.eaves) * u + 0.02, z: R.zf - R.d / 2 + side * (R.d / 2 + 0.3) * (1 - u) + 0.02, side, go: 100 + 95 * Math.pow(r.next(), 1.4), vt: r.range(14, 21), spin: r.range(1, 4), ax: r.range(0, 6.28) }); }
    const N = Tl.length;
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.42, 0.014, 0.3), M.tile, N); im.frustumCulled = false; im.castShadow = true; root.add(im);
    T.tiles = { Tl, im };
  }
  // ---- dust (crashes), steam-free: the air keeps its old down, so dust rises the old way
  T.dust = gkPuffs(scene, 2400, { soft: 1.3, near: [3, 12] });
  T.hits = gkSimHits('street', 4).map((e) => ({ s: e[0], x: e[3], y: e[4], z: e[5], a: Math.min(1.5, e[2] / 10) }));
  T.update = (s, o) => gkStreetUpdate(T, s, o || {});
  return T;
}

const _gkM4 = new THREE.Matrix4(), _gkV = new THREE.Vector3(), _gkQ2 = new THREE.Quaternion(), _gkS = new THREE.Vector3(1, 1, 1), _gkE = new THREE.Euler(), _gkF = [0, 0];
function gkStreetUpdate(T, s, o) {
  const deg = gkDeg(s), degC = gkDegC(s);
  // ---- the simulated bodies
  for (const it of T.sim) { gkSimPose('street', it.b.id, s, _gkP, _gkQ); it.g.position.set(_gkP[0], _gkP[1], _gkP[2]); it.g.quaternion.set(_gkQ[0], _gkQ[1], _gkQ[2], _gkQ[3]); }
  // ---- trees: the trunk bends along down (three segments in turn); the crowns thin as their leaves go
  for (const tr of T.trees) { const b = gkTreeBend(s, tr.stiff); for (let k = 0; k < 3; k++) tr.segs[k].rotation.z = -b * (0.25 + 0.15 * k); const left = 1 - 0.75 * gkSm(degC, 60, 210); tr.crown.scale.setScalar(0.45 + 0.55 * left); }
  // ---- swings: round the top bar with down
  for (const sw of T.swings) sw.pv.rotation.z = gkSwing(s, 3.1, sw.ph) * Math.PI / 180;
  // ---- the spire: over at 16°, then it drops off the tower and breaks on the ground; the stones go up from ~95°
  { const SP = T.spire, a = gkSpireAngle(s), u = s - GK_SPIRE.hitS;
    SP.pv.position.copy(SP.base); SP.pv.rotation.set(0, 0, -a); SP.sp.visible = true;
    if (u > 0) { const f = Math.min(1, u / 1.9), dy = -0.5 * GKP.g * Math.min(u, 1.9) ** 2 * 1.0; SP.pv.position.set(SP.base.x + 2.0 + 4 * f, Math.max(-SP.base.y + 2.5, dy), SP.base.z); SP.pv.rotation.set(0, 0, -a - 0.5 * f); }
    if (u > 1.9) { SP.pv.position.set(SP.base.x + 6, -SP.base.y + 2.5, SP.base.z); SP.pv.rotation.set(0, 0, -Math.PI / 2 - 0.12); }
    if (deg >= 95 && deg < 400) { if (!SP.fl) SP.fl = gkFlight(0, 2.5, 95, 70); const P = gkFlightAt(SP.fl, s); SP.pv.position.set(SP.base.x + 6 + P[0], -SP.base.y + P[1], SP.base.z); SP.pv.rotation.set(0.2 * (s - 95) * 0.05, 0, -Math.PI / 2 - 0.12 - 0.02 * (s - 95)); }
  }
  // ---- the balconies
  for (const B of T.balc) { const st = gkBalcony(B.b, s); B.pv.rotation.x = st.fold; B.g.position.set(st.off[0], st.off[1], st.off[2]); }
  // ---- the pond: its surface tilts with down (it rises to the east) and it empties over its east bank; the sheet of
  // water runs east across the grass and piles against the railings; from 90° it leaves the ground
  { const P = T.pond, pd = GK_ST.pond, left = GK_POND.left(s), tg = Math.tan(Math.min(80, deg) * Math.PI / 180), p = P.geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const bx = P.base[i * 3] * pd.rx * 0.97, y = -pd.depth * (1 - left) + tg * bx * 0.97 * Math.min(1, left * 4); p.setY(i, Math.min(0.02, Math.max(-pd.depth + 0.02, y)) + 0.0); }
    p.needsUpdate = true; P.m.visible = left > 0.02;
    const front = GK_POND.sheetFront(s), x0 = pd.x + pd.rx * 0.6, on = s > 1 && deg < GK_POND.lift[1];
    T.sheet.m.visible = on && front > x0 + 0.5;
    if (T.sheet.m.visible) { T.sheet.m.position.set(x0, 0.03 + 0.04 * gkSm(deg, 30, 70), pd.z); T.sheet.m.scale.set(front - x0, 1, 2 * pd.rz * (1 + 1.6 * gkSm(s, 2, 40))); T.sheet.m.material.opacity = 0.5 * (1 - gkSm(deg, 92, GK_POND.lift[1])); }
  }
  // ---- leaves
  { const { L, im } = T.leaves, a = degC * Math.PI / 180;
    for (let i = 0; i < L.length; i++) {
      const l = L[i]; let x = l.x, y = l.y, z = l.z, fl = 0;
      if (l.tree >= 0 && degC < l.det) {                        // (still on its tree: it bends with the crown)
        const tr = T.trees[l.tree], b = gkTreeBend(s, tr.stiff) * 0.55, k = (y / tr.h); x += Math.sin(b) * y * k * 0.9; y -= (1 - Math.cos(b)) * y * k * 0.5;
      } else if (l.tree >= 0 && l.det >= 90) {                  // (let go up in the turn: straight into its circle)
        gkFly(x, y, l.det, l.vt, Math.max(l.det, degC), _gkF); x = _gkF[0]; y = _gkF[1]; fl = 1;
      } else {
        // on the grass (or fallen onto it): it tumbles east once the slope beats its grip, then lifts off at 90°
        const d0 = l.tree >= 0 ? l.det : l.det, yg = l.tree >= 0 ? Math.max(0.02, y - 0.5 * GKP.g * Math.max(0, s - d0) ** 2) : 0.02;
        const dc = Math.min(degC, 90), slide = degC > d0 ? l.vg * 57.3 * (Math.cos(d0 * Math.PI / 180) - Math.cos(dc * Math.PI / 180)) : 0;
        x = l.x + slide; y = l.tree >= 0 && yg > 0.03 ? yg : 0.02;
        if (degC > 90) { gkFly(x, 0.02, 90, l.vt, degC, _gkF); x = _gkF[0]; y = _gkF[1]; fl = 1; }
      }
      T.leaves.fly[i] = fl;
      const fx = fl ? 0.6 * Math.sin(s * 1.3 + l.ph) : 0, fz = fl ? 0.6 * Math.cos(s * 1.1 + l.ph * 1.7) : 0;
      _gkV.set(x + fx, y + (fl ? 0.3 * Math.sin(s * 0.9 + l.ph) : 0), z + fz);
      _gkE.set(fl ? s * l.sp + l.ph : -Math.PI / 2 + 0.3 * Math.sin(l.ph), fl ? s * l.sp * 0.7 : l.ph, fl ? s * 0.5 : 0); _gkQ2.setFromEuler(_gkE);
      im.setMatrixAt(i, _gkM4.compose(_gkV, _gkQ2, _gkS));
    }
    im.instanceMatrix.needsUpdate = true;
  }
  // ---- drops: each from where the water pooled, round its circle (velocity along down: vt)
  { const { D, pos, geo, mesh, mat } = T.drops, cam = o.cam, N = D.length;
    const on = deg >= GK_POND.lift[0] - 1; mesh.visible = on && !!cam;
    if (mesh.visible) {
      const cp = cam.position, dv = gkDown(degC);
      let n = 0;
      for (let i = 0; i < N; i++) {
        const d = D[i]; if (degC < d.deg1) { pos.fill(0, i * 12, i * 12 + 12); continue; }
        gkFly(d.x, d.y0, d.deg1, d.vt, degC, _gkF); const x = _gkF[0], y = _gkF[1], z = d.z + 3 * Math.sin(d.j * 9 + s * 0.05);
        const L = 0.12 + 0.06 * d.vt, ex = dv[0] * L, ey = dv[1] * L;
        // (a quad from the drop back along its path, turned to the camera)
        const vx = x - cp.x, vy = y - cp.y, vz = z - cp.z, sx = ey * vz - 0 * vy, sy = 0 * vx - ex * vz, sz = ex * vy - ey * vx, sl = Math.hypot(sx, sy, sz) || 1, w = 0.02 + 0.0016 * Math.hypot(vx, vy, vz);
        const wx = sx / sl * w, wy = sy / sl * w, wz = sz / sl * w, o12 = i * 12;
        pos[o12] = x - ex - wx; pos[o12 + 1] = y - ey - wy; pos[o12 + 2] = z - wz; pos[o12 + 3] = x - ex + wx; pos[o12 + 4] = y - ey + wy; pos[o12 + 5] = z + wz;
        pos[o12 + 6] = x + wx; pos[o12 + 7] = y + wy; pos[o12 + 8] = z + wz; pos[o12 + 9] = x - wx; pos[o12 + 10] = y - wy; pos[o12 + 11] = z - wz; n++;
      }
      geo.attributes.position.needsUpdate = true; mat.opacity = 0.8 * gkSm(degC, GK_POND.lift[0], GK_POND.lift[0] + 6);
    }
  }
  // ---- roof tiles: lift off and tumble up, round their circles
  { const { Tl, im } = T.tiles;
    for (let i = 0; i < Tl.length; i++) {
      const t = Tl[i];
      if (degC < t.go) { _gkV.set(t.x, t.y, t.z); _gkE.set(t.side * 0.55, 0, 0); }
      else { if (!t.fl) t.fl = gkFlight(t.x, t.y, t.go, t.vt); const P = gkFlightAt(t.fl, s), u = s - t.go; _gkV.set(P[0], P[1], t.z + t.side * Math.min(6, u * 0.4)); _gkE.set(t.side * 0.55 + u * t.spin, u * t.spin * 0.6 + t.ax, u * 0.8); }
      _gkQ2.setFromEuler(_gkE); im.setMatrixAt(i, _gkM4.compose(_gkV, _gkQ2, _gkS));
    }
    im.instanceMatrix.needsUpdate = true;
  }
  // ---- dust from the crashes (it rises the old way and drifts; it fades in ~6 s)
  { const P = T.dust; P.begin();
    // (light, and short: the crash itself must stay visible; lighter still once the stack lifts off, from 90°)
    for (const h of T.hits) { const u = s - h.s; if (u < 0 || u > 5) continue; const al = 0.17 * h.a * (1 - u / 5) * (h.s > 90 ? 0.35 : 1);
      for (let k = 0; k < 10; k++) { const a = k * 2.4, rr = (0.6 + 1.4 * Math.sqrt(u)) * (0.4 + 0.6 * gkR(k, 3)); P.add(h.x + Math.cos(a) * rr, h.y + 0.3 + u * 0.3 * (0.5 + gkR(k, 5)), h.z + Math.sin(a) * rr, 1.0 + 1.0 * u, al, 0.62, 0.58, 0.52); } }
    { const u = s - GK_SPIRE.hitS - 1.9; if (u > 0 && u < 9) for (let k = 0; k < 40; k++) { const a = k * 2.4, rr = (1 + 3 * Math.sqrt(u)) * (0.4 + 0.6 * gkR(k, 7)); P.add(T.spire.base.x + 8 + Math.cos(a) * rr * 1.6, 1 + u * 0.6 * (0.5 + gkR(k, 9)), T.spire.base.z + Math.sin(a) * rr, 2.5 + 2 * u, 0.4 * (1 - u / 9), 0.66, 0.62, 0.56); } }
    P.end(); }
}
