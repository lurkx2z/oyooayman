/* =====================================================================
   STREET — what you see from your window and around it (layout.js: LA_ST): your block (five floors; your flat on the
   top one, 12.0 m up), the street, the next block (a café on its ground floor, balconies), the church at the end of
   the street (its tower and spire stand out of the liquid, into the vacuum), the park (the pond, autumn trees, paths,
   picnic tables, the playground), the terrace beyond it and the town around. (The gravity-keeps-tilting film's street,
   with five floors, a café and a stairwell; nothing here is simulated.)
   Moving: the parked cars (they float, fill and sink; two ride the surface up first), the café's chairs and tables, picnic tables and
   branches (wood floats), fallen leaves (they ride on the surface), the footballs (they go soft). Posed by update(s).
     laBuildStreet(S) → T
   ===================================================================== */

// ---- canvases
// a concrete block's front: panels, floor bands, a grid of windows (some with curtains, a few lit)
function laBlockFacade(seed, wM, hM, o = {}) {
  const r = new RNG(seed), px = 22, W = Math.round(wM * px), H = Math.round(hM * px);
  return laCanvas(W, H, (g) => {
    g.fillStyle = o.base || '#c9c2b4'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${r.next() < 0.5 ? '255,255,255' : '40,36,30'},${r.range(0.02, 0.06)})`; g.fillRect(r.range(0, W), r.range(0, H), r.range(1, 4), r.range(1, 3)); }
    for (let x = 0; x < W; x += 3 * px) { g.fillStyle = 'rgba(60,55,48,0.18)'; g.fillRect(x, 0, 1.5, H); }
    const Y = (y) => H - y * px;
    for (let f = 0; f < (o.floors || 5); f++) { g.fillStyle = o.band || 'rgba(120,112,100,0.55)'; g.fillRect(0, Y(f * 3 + 0.25), W, 0.25 * px); }
    g.fillStyle = 'rgba(70,64,56,0.75)'; g.fillRect(0, 0, W, 0.4 * px);                    // the parapet's cap
    for (let f = 0; f < (o.floors || 5); f++) for (const cx of o.cols) {
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
function laTerraceFacade(seed, brickC) {
  const r = new RNG(seed * 31 + 7), W = 256, H = 330, px = W / 5;
  const c = laBrickCanvas(seed + 3, brickC, W, H), g = c.getContext('2d');
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
function laStoneCanvas(seed, w = 512, h = 512) {
  const r = new RNG(seed);
  return laCanvas(w, h, (g) => {
    g.fillStyle = '#8f877a'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 22) for (let x = -r.range(0, 40); x < w; x += r.range(30, 60)) { const k = r.range(-18, 18); g.fillStyle = `rgb(${168 + k},${158 + k},${140 + k})`; g.fillRect(x + 2, y + 2, r.range(26, 56), 18); }
  });
}
function laSlateCanvas(seed, w = 256, h = 256) {
  const r = new RNG(seed);
  return laCanvas(w, h, (g) => { g.fillStyle = '#3c4148'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 12) for (let x = (y / 12) % 2 ? -10 : 0; x < w; x += 20) { const k = r.range(-10, 10); g.fillStyle = `rgb(${66 + k},${72 + k},${80 + k})`; g.fillRect(x + 1, y + 1, 18, 10); } });
}
function laBallCanvas() {
  return laCanvas(128, 64, (g, w, h) => { g.fillStyle = '#f4f2ec'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a1a1a'; for (let i = 0; i < 6; i++) { const x = (i * 23 + 8) % w, y = i % 2 ? 18 : 44; g.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283; g.lineTo(x + Math.cos(a) * 8, y + Math.sin(a) * 8); } g.fill(); } });
}
// a wheelie bin (240 l): body, lid, wheels; origin on the ground at its middle
function laBuildBin(color) {
  const g = new THREE.Group(), m = laStd(color, 0.55);
  laMesh(new THREE.CylinderGeometry(0.33, 0.27, 0.98, 4, 1).rotateY(Math.PI / 4).scale(1.0, 1, 1.25), m, 0, 0.53, 0, g);
  laBox(0.6, 0.05, 0.76, m, 0, 1.05, 0, g);
  for (const sx of [-1, 1]) { const w = laCyl(0.1, 0.1, 0.05, laStd('#141414', 0.8), sx * 0.24, 0.1, 0.3, g, 14); w.rotation.z = Math.PI / 2; }
  return g;
}
// a park tree: a trunk in three segments that bend in turn, a crown of blobs in autumn colours
function laBuildTree(parent, x, z, h, seed, M) {
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
  const segs = [], r0 = 0.14 + 0.07 * (h / 10);
  let par = g;
  for (let k = 0; k < 3; k++) {
    const sg = new THREE.Group(); sg.position.y = k ? h * 0.5 / 3 : 0; par.add(sg); segs.push(sg);
    laCyl(r0 * (1 - 0.22 * k) * 0.8, r0 * (1 - 0.22 * k), h * 0.5 / 3 + 0.05, M.bark, 0, h * 0.5 / 6, 0, sg, 8);
    par = sg;
  }
  const top = segs[2], cr = h * 0.27, crown = new THREE.Group(); crown.position.y = h * 0.5 / 3; top.add(crown);
  const mats = [M.leafO, M.leafY, M.leafR, M.leafG], k0 = Math.floor(seed * 4);
  laMesh(laBlobGeo(cr, seed * 9 + 1), mats[k0 % 4], 0, cr * 0.75, 0, crown);
  laMesh(laBlobGeo(cr * 0.75, seed * 9 + 2), mats[(k0 + 1) % 4], cr * 0.6, cr * 0.35, cr * 0.3, crown);
  laMesh(laBlobGeo(cr * 0.7, seed * 9 + 3), mats[(k0 + 2) % 4], -cr * 0.55, cr * 0.45, -cr * 0.35, crown);
  laMesh(laBlobGeo(cr * 0.6, seed * 9 + 4), mats[k0 % 4], 0.1 * cr, cr * 1.35, -0.2 * cr, crown);
  return { g, segs, crown, h, cr, x, z, stiff: 1.0 + 0.8 * laR(Math.round(seed * 100), 3), seed };
}
// a bird (pigeon / duck): a body, a head, two wings that flap
function laBuildBird(col, s = 1) {
  const g = new THREE.Group(), m = laStd(col, 0.8), w = [];
  laMesh(new THREE.SphereGeometry(0.12 * s, 8, 6).scale(1.6, 0.8, 0.9), m, 0, 0, 0, g);
  laMesh(new THREE.SphereGeometry(0.06 * s, 8, 6), m, 0.18 * s, 0.05 * s, 0, g);
  for (const sd of [-1, 1]) { const p = new THREE.Group(); p.position.set(0, 0.03 * s, sd * 0.06 * s); g.add(p); const wing = laBox(0.16 * s, 0.01 * s, 0.26 * s, m, 0, 0, sd * 0.13 * s, p); wing.castShadow = false; w.push(p); }
  g.userData.wings = w; return g;
}

function laBuildStreet(S) {
  const scene = S.scene, T = { M: {} }, root = new THREE.Group(); root.name = 'street'; scene.add(root); T.root = root;
  const as = Tex.asphalt(41); for (const t of [as.map, as.roughnessMap, as.bumpMap]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(60, 1); }
  const tex = (c, rx, ry) => { const t = laTex(c); t.repeat.set(rx, ry); return t; };
  const M = T.M = {
    road: laStd('#ffffff', 0.92, 0, { map: as.map, roughnessMap: as.roughnessMap, bumpMap: as.bumpMap, bumpScale: 0.5 }),
    pav: laStd('#ffffff', 0.85, 0, { map: tex(laPavingCanvas(43), 160, 1) }), kerb: laStd('#9a968c', 0.8),
    grass: laStd('#ffffff', 1.0, 0, { map: tex(laGrassCanvas(5), 300, 300) }), park: laStd('#ffffff', 1.0, 0, { map: tex(laGrassCanvas(9), 40, 30) }),
    path: laStd('#c2b59c', 0.95), rubber: laStd('#a8473a', 0.95), mud: laStd('#3d3428', 1.0), stoneEdge: laStd('#a39d90', 0.85),
    stone: laStd('#ffffff', 0.95, 0, { map: tex(laStoneCanvas(61), 4, 2) }), slate: laStd('#ffffff', 0.85, 0, { map: tex(laSlateCanvas(3), 8, 4) }),
    roofFlat: laStd('#5a5754', 0.95), concrete: laStd('#b9b2a5', 0.95), roof: laStd('#4a4644', 0.85), roof2: laStd('#5a4a44', 0.85), roofT: laStd('#7a3d2c', 0.85),
    brickSide: laStd('#ffffff', 0.92, 0, { map: tex(laBrickCanvas(25, [118, 70, 54]), 2, 2) }),
    post: laStd('#2a2e32', 0.5, 0.5), rail: laStd('#1c1f22', 0.5, 0.4), metal: laStd('#c8463a', 0.5, 0.3), metal2: laStd('#2f6f8a', 0.5, 0.3), chain: laStd('#8d9297', 0.4, 0.8),
    lampGlass: laStd('#fff4dd', 0.3, 0, { emissive: new THREE.Color('#ffe2a8'), emissiveIntensity: 0.15 }),
    bark: laStd('#4f4236', 0.95), bench: laStd('#6a5038', 0.8),
    leafO: laStd('#c8742c', 0.85, 0, { flatShading: true }), leafY: laStd('#d9a63a', 0.85, 0, { flatShading: true }), leafR: laStd('#a8402a', 0.85, 0, { flatShading: true }), leafG: laStd('#6f7f3a', 0.85, 0, { flatShading: true }),
    water: new THREE.MeshStandardMaterial({ color: '#2f4f4c', transparent: true, opacity: 0.9, roughness: 0.12, metalness: 0.0, envMapIntensity: 0.8, side: THREE.DoubleSide }),
    sheet: new THREE.MeshStandardMaterial({ color: '#7f9aa2', transparent: true, opacity: 0.5, roughness: 0.05, envMapIntensity: 1.4, depthWrite: false }),
    tile: laStd('#7a3d2c', 0.8), batten: laStd('#3b302a', 0.95), glassB: laStd('#9fb4bf', 0.2, 0.3, { transparent: true, opacity: 0.45 }),
  };
  const B = new Batcher();
  const S0 = LA_ST, k = S0.kerbH, E = S0.east;
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
  { const wm = laStd('#ecebe4', 0.6);
    for (let x = X0 + 3; x < E - 6; x += 9) { const geo = new THREE.PlaneGeometry(4, 0.1); geo.rotateX(-Math.PI / 2); B.add(geo, wm, Geo.matrix(x + 2, 0.006, (RD[0] + RD[1]) / 2)); }
    for (const z of [RD[0] + 0.3, RD[1] - 0.3]) { const geo = new THREE.PlaneGeometry(E - X0 - 4, 0.08); geo.rotateX(-Math.PI / 2); B.add(geo, laStd('#d9c25a', 0.6), Geo.matrix((X0 + E) / 2, 0.006, z)); } }
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
    const fc = laBlockFacade(11, A.x[1] - A.x[0], A.h, { cols, x0: A.x[0], door: -4.0 });
    const fm = laStd('#ffffff', 0.9, 0, { map: laTex(fc, { repeat: false }) });
    const wi = LA_ROOM.win, ox = LA_ROOM.origin[0], oy = LA_ROOM.origin[1];
    const hole = [ox + wi.x[0], ox + wi.x[1], oy + wi.y[0], oy + wi.y[1]];
    // the front: cells round the hole, uv from position (the facade texture spans the whole front)
    const pos = [], uv = [], idx = [];
    for (const c of laWallCells(A.x[0], A.x[1], 0, A.h, [hole])) {
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
    // the rest of the block: boxes round your flat (x 1.25…6.75, y 11.8…14.85, z 0…4.5), facades on the sides and back
    const side = laStd('#ffffff', 0.9, 0, { map: laTex(laBlockFacade(12, 12, A.h, { cols: [2.5, 8.5], x0: 0 }), { repeat: false }) });
    const back = laStd('#ffffff', 0.9, 0, { map: laTex(laBlockFacade(13, 44, A.h, { cols, x0: A.x[0] }), { repeat: false }) });
    const bx = (x0, x1, y0, y1, z0, z1, mats) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mats); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); m.castShadow = m.receiveShadow = true; root.add(m); return m; };
    const c = M.concrete, rf = M.roofFlat;
    bx(A.x[0], -6.2, 0, A.h, 0.02, 4.5, [c, side, rf, c, c, c]); bx(-1.8, 1.25, 0, A.h, 0.02, 4.5, [c, c, rf, c, c, c]); bx(-6.2, -1.8, 0, A.h, 4.2, 4.5, [c, c, rf, c, c, c]); bx(-6.2, -1.8, A.h - 0.3, A.h, 0.02, 4.2, [c, c, rf, c, c, c]); bx(6.75, A.x[1], 0, A.h, 0.02, 4.5, [side, c, rf, c, c, c]);
    bx(1.25, 6.75, 0, 11.8, 0.02, 4.5, [c, c, c, c, c, c]); bx(1.25, 6.75, 14.85, A.h, 0.02, 4.5, [c, c, rf, c, c, c]);
    bx(A.x[0], A.x[1], 0, A.h, 4.5, A.z[1], [side, side, rf, c, back, c]);
    B.box(A.x[1] - A.x[0] + 0.2, 0.4, 0.25, 0, A.h - 0.2, 0.0, M.kerb);                                  // the parapet
  }
  // ------------------------------------------------------------------ the next block (balconies: each its own group, on its north face)
  { const Bb = S0.blockB, cols = [38, 46, 54, 62, 70];
    const fm = laStd('#ffffff', 0.9, 0, { map: laTex(laBlockFacade(21, Bb.x[1] - Bb.x[0], Bb.h, { cols, x0: Bb.x[0], base: '#cdb9a2', door: 50 }), { repeat: false }) });
    const side = laStd('#ffffff', 0.9, 0, { map: laTex(laBlockFacade(22, 12, Bb.h, { cols: [2.5, 8.5], x0: 0, base: '#cdb9a2' }), { repeat: false }) });
    const m = new THREE.Mesh(new THREE.BoxGeometry(Bb.x[1] - Bb.x[0], Bb.h, Bb.z[1] - Bb.z[0]), [side, side, M.roofFlat, M.concrete, side, fm]);
    m.position.set((Bb.x[0] + Bb.x[1]) / 2, Bb.h / 2, (Bb.z[0] + Bb.z[1]) / 2); m.castShadow = m.receiveShadow = true; root.add(m);
    T.balc = [];
    for (let f = 1; f < 5; f++) for (const x of [42, 58, 66]) {
      const g = new THREE.Group(); g.position.set(x, f * 3 + 0.15, 0); root.add(g); const w = 3.2, d = 1.4;
      laBox(w, 0.18, d, M.concrete, 0, -0.09, -d / 2, g);
      laBox(w, 1.0, 0.02, M.glassB, 0, 0.5, -d + 0.02, g); laBox(0.02, 1.0, d, M.glassB, -w / 2 + 0.02, 0.5, -d / 2, g); laBox(0.02, 1.0, d, M.glassB, w / 2 - 0.02, 0.5, -d / 2, g);
      laBox(w, 0.04, 0.05, M.post, 0, 1.0, -d + 0.02, g);
      if ((f + x) % 2 === 0) { laBox(w - 0.1, 0.3, 0.28, M.concrete, 0, 0.15, -d + 0.18, g); laMesh(laBlobGeo(0.22, f * 7 + x), M.leafG, -0.6, 0.38, -d + 0.18, g); }
      T.balc.push(g);
    }
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
    // the spire (an octagonal cone) on the tower: it stands out of the liquid, into the vacuum
    { const sp = new THREE.Mesh(new THREE.ConeGeometry(C.spireR, C.spire, 8), M.stone); sp.position.set((Tw.x[0] + Tw.x[1]) / 2, Tw.h + C.spire / 2 + 0.5, (Tw.z[0] + Tw.z[1]) / 2); sp.castShadow = true; root.add(sp);
      laCyl(C.spireR * 1.08, C.spireR * 1.12, 0.5, M.stone, sp.position.x, Tw.h + 0.25, sp.position.z, root, 8); laCyl(0.05, 0.05, 2.0, M.post, sp.position.x, Tw.h + C.spire + 1.5, sp.position.z, root, 6);
      // the clock face on the tower's street side (it says 3:30 at the bell)
      const ck = laCanvasTex(256, 256, (g, w, h, st) => { g.clearRect(0, 0, w, h); g.fillStyle = '#1c2630'; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 4, 0, 6.283); g.fill(); g.strokeStyle = '#d8c48a'; g.lineWidth = 8; g.stroke();
        g.fillStyle = '#d8c48a'; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.fillRect(w / 2 + Math.sin(a) * 100 - 5, h / 2 - Math.cos(a) * 100 - 5, 10, 10); }
        g.strokeStyle = '#d8c48a'; g.lineCap = 'round'; const hd = (a, L, wd) => { g.lineWidth = wd; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + Math.sin(a) * L, h / 2 - Math.cos(a) * L); g.stroke(); };
        hd((st.h % 12 + st.m / 60) / 12 * 6.283, 60, 12); hd(st.m / 60 * 6.283, 92, 8); });
      const cf = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32), new THREE.MeshStandardMaterial({ map: ck.tex, transparent: true, roughness: 0.6 })); cf.position.set(Tw.x[0] - 0.06, Tw.h - 8.5, (Tw.z[0] + Tw.z[1]) / 2); cf.rotation.y = -Math.PI / 2; root.add(cf); T.towerClock = ck; }
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
      for (const dz of [-0.22, 0.22]) laCyl(0.008, 0.008, 1.95, M.chain, 0, -0.975, dz, pv, 4);
      laBox(0.22, 0.04, 0.5, laStd('#222', 0.7), 0, -1.97, 0, pv); T.swings.push({ pv, ph: i * 1.9 }); }
    // a slide (fixed)
    B.box(0.5, 0.06, 3.2, D.x + 12, 1.0, D.z + 8, M.metal, 0); for (const dz of [-1.5]) B.box(0.6, 2.0, 0.06, D.x + 12, 1.0, D.z + 8 + dz, M.metal2);
  }
  // ------------------------------------------------------------------ trees in the park (rooted: they bend and hold); their leaves (below)
  T.trees = [];
  { const r = new RNG(29), spots = [[-58, -24], [-46, -36], [-60, -58], [-38, -70], [-22, -28], [24, -38], [16, -70], [42, -60], [58, -40], [-6, -88], [34, -88], [58, -76], [-52, -92], [-30, -50]];
    for (const [x, z] of spots) T.trees.push(laBuildTree(root, x + r.range(-2, 2), z + r.range(-2, 2), r.range(10, 14), r.next(), M)); }
  // ------------------------------------------------------------------ the terrace along the park's north side (front z −104, facing south)
  T.roofs = [];
  { const r = new RNG(19), bricks = [[128, 72, 56], [150, 98, 70], [120, 66, 52], [158, 120, 88], [138, 80, 60]];
    const fm = Array.from({ length: 6 }, (_, v) => laStd('#ffffff', 0.85, 0, { map: laTex(laTerraceFacade(100 + v, bricks[v % bricks.length]), { repeat: false }) }));
    const zf = -104, d = 8, eaves = 6.6, ridge = 9.2;
    for (let x = -92; x < 92; x += 5) {
      const v = r.int(0, 5);
      B.box(5, eaves, d, x + 2.5, eaves / 2, zf - d / 2, M.brickSide);
      const fg = new THREE.PlaneGeometry(5, eaves); fg.translate(0, eaves / 2, 0); B.add(fg, fm[v], Geo.matrix(x + 2.5, 0, zf + 0.004));
      const sh = new THREE.Shape(); sh.moveTo(-d / 2 - 0.3, 0); sh.lineTo(d / 2 + 0.3, 0); sh.lineTo(0, ridge - eaves); sh.closePath();
      const rg = new THREE.ExtrudeGeometry(sh, { depth: 5, bevelEnabled: false }); rg.rotateY(Math.PI / 2); rg.translate(-2.5, 0, 0);
      B.add(rg, M.roofT, Geo.matrix(x + 2.5, eaves, zf - d / 2));
      if (((x + 92) / 5) % 2 === 0) B.box(0.7, 1.3, 0.9, x, ridge + 0.3, zf - d / 2, M.brickSide);
      T.roofs.push({ x0: x, x1: x + 5, zf, d, eaves, ridge });
    } }
  // ------------------------------------------------------------------ the town around (far: static)
  { const r = new RNG(83), cols = ['#d9d4c8', '#b8a898', '#c9b8a4', '#9a8a7a', '#e2ddd2', '#a8b4bc'];
    const mats = cols.map((c) => laStd(c, 0.9)), roofs = [M.roof, M.roof2, M.roofT];
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
      B.add(new THREE.CylinderGeometry(0.15, 0.22, h * 0.5, 6), M.bark, Geo.matrix(x, h * 0.25, z)); B.add(laBlobGeo(h * 0.3, i + 7), [M.leafO, M.leafY, M.leafG][i % 3], Geo.matrix(x, h * 0.62, z)); } }
  B.build(root, 'street');

  // ==================================================================== MOVING THINGS
  // ---- the parked cars: they float off at 70 cm, drift, fill and sink; two stay sealed and rise to the surface
  const VF = new VehicleFactory();
  T.cars = LA_ST.bodies.filter((b) => b.kind === 'car').map((b) => {
    const g = new THREE.Group(); g.position.set(b.pos[0], 0, b.pos[2]); root.add(g);
    const o = VF.build(b.type, b.col); o.group.position.x = -b.L / 2; const turn = new THREE.Group(); turn.rotation.y = b.dir > 0 ? 0 : Math.PI; turn.add(o.group); g.add(turn);
    return { b, g, base: [b.pos[0], 0, b.pos[2]] };
  });
  // ---- the bins (plastic is heavier than the liquid: they stay where they are)
  T.bins = LA_ST.bodies.filter((b) => b.kind === 'bin').map((b) => { const g = laBuildBin(b.col); g.position.set(b.pos[0], b.pos[1], b.pos[2]); root.add(g); return g; });
  // ---- the footballs in the park (they go soft) and a bike on the path
  T.balls = LA_ST.bodies.filter((b) => b.kind === 'ball').map((b) => {
    const geo = new THREE.SphereGeometry(0.11, 16, 12), m = laMesh(geo, b.col === '#f2f0ea' ? laStd('#ffffff', 0.5, 0, { map: laTex(laBallCanvas(), { repeat: false }) }) : laStd(b.col, 0.5), b.pos[0], 0.11, b.pos[2], root);
    return { m, base: Float32Array.from(geo.attributes.position.array) };
  });
  // ---- the café on the next block's ground floor: an awning, wooden tables and chairs on the pavement (they float)
  { const wood = laStd('#ffffff', 0.7, 0, { map: (() => { const t = laTex(laWoodCanvas(57, 256, 512, [150, 112, 74])); return t; })() });
    const aw = laCanvas(256, 64, (g, w, h) => { for (let x = 0; x < w; x += 32) { g.fillStyle = (x / 32) % 2 ? '#f2ede2' : '#2f6a5a'; g.fillRect(x, 0, 32, h); } });
    const am = laStd('#ffffff', 0.85, 0, { map: (() => { const t = laTex(aw); t.repeat.set(3, 1); return t; })(), side: THREE.DoubleSide });
    const awn = new THREE.Mesh(new THREE.PlaneGeometry(14, 1.6), am); awn.position.set(46, 2.75, -0.7); awn.rotation.x = -Math.PI / 2 + 0.45; root.add(awn);
    const glassF = laStd('#ffffff', 0.25, 0.1, { map: laTex(laCanvas(512, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffe2a8'); gr.addColorStop(1, '#a8742e'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(40,24,12,0.6)'; for (let x = 20; x < w; x += 90) g.fillRect(x, 30, 40, 70); g.fillStyle = '#1a1a1a'; g.font = '700 30px Georgia'; g.fillText('CAFÉ', 20, 26); }), { repeat: false }), emissive: new THREE.Color('#ffcf8a'), emissiveIntensity: 0.0 });
    const shop = new THREE.Mesh(new THREE.PlaneGeometry(13, 2.4), glassF); shop.position.set(46, 1.3, -0.02); shop.rotation.y = Math.PI; shop.rotation.y = 0; root.add(shop); T.cafeGlass = glassF;
    T.cafe = [];
    const r = new RNG(71);
    for (const [x, z] of [[41.5, -1.0], [46, -1.1], [50.5, -0.95]]) {
      const tg = new THREE.Group(); root.add(tg); laCyl(0.36, 0.36, 0.04, wood, 0, 0.74, 0, tg, 20); laCyl(0.035, 0.035, 0.72, wood, 0, 0.36, 0, tg, 8); laCyl(0.22, 0.22, 0.03, wood, 0, 0.015, 0, tg, 16);
      T.cafe.push({ g: tg, x, z, k: r.next(), kind: 'table' });
      for (const a of [0.3, 2.6]) { const cg = new THREE.Group(); root.add(cg); laBox(0.42, 0.04, 0.42, wood, 0, 0.45, 0, cg); laBox(0.42, 0.42, 0.04, wood, 0, 0.68, -0.2, cg); for (const [dx, dz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) laBox(0.035, 0.45, 0.035, wood, dx, 0.225, dz, cg);
        T.cafe.push({ g: cg, x: x + Math.cos(a) * 0.75, z: z + Math.sin(a) * 0.55, ry: a + Math.PI / 2, k: r.next(), kind: 'chair' }); }
    }
    // the picnic tables in the park (wood, free-standing) and fallen branches
    for (const [x, z, ry] of [[-14, -24, 0.2], [10, -27, -0.3], [-30, -32, 0.6]]) { const g = new THREE.Group(); root.add(g);
      laBox(1.9, 0.05, 0.75, wood, 0, 0.75, 0, g); for (const dz of [-0.6, 0.6]) laBox(1.9, 0.05, 0.28, wood, 0, 0.45, dz, g); for (const dx of [-0.7, 0.7]) laBox(0.06, 0.75, 1.5, wood, dx, 0.37, 0, g, 0);
      T.cafe.push({ g, x, z, ry, k: r.next(), kind: 'picnic' }); }
    for (let i = 0; i < 14; i++) { const g = new THREE.Group(); root.add(g); const L = r.range(1.2, 3.4); const br = laCyl(0.03, 0.05, L, M.bark, 0, 0, 0, g, 6); br.rotation.z = Math.PI / 2; for (let k = 0; k < 3; k++) { const tw = laCyl(0.01, 0.02, L * 0.35, M.bark, r.range(-L / 3, L / 3), 0.1, 0, g, 5); tw.rotation.set(r.range(-1, 1), 0, r.range(0.5, 1.2)); }
      T.cafe.push({ g, x: r.range(-60, 60), z: r.range(-90, -18), ry: r.range(0, 6.28), k: r.next(), kind: 'branch' }); }
  }
  // ---- leaves (on the grass and the pavements): fallen leaves are lighter than the liquid, so they float up with it
  { const N = 2600, r = new RNG(311), L = [];
    for (let i = 0; i < N; i++) { const P = LA_ST.park, onPark = r.next() < 0.8; L.push({ x: onPark ? r.range(P.x[0] + 2, P.x[1] - 2) : r.range(-60, 80), z: onPark ? r.range(P.z[0] + 2, P.z[1] - 2) : r.range(-12, -0.3), ph: r.range(0, 6.28), c: r.int(0, 3), sp: r.range(0.2, 1.0) }); }
    const geo = new THREE.PlaneGeometry(0.2, 0.15), cols = ['#c8742c', '#d9a63a', '#a8402a', '#8a6a2a'].map((c) => new THREE.Color(c));
    const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.8, side: THREE.DoubleSide }), N); im.frustumCulled = false; im.castShadow = false;
    L.forEach((l, i) => im.setColorAt(i, cols[l.c])); root.add(im);
    T.leaves = { L, im };
  }
  // ---- the pond's water (it stays: water is heavier than the liquid)
  { const pd = LA_ST.pond, geo = new THREE.CircleGeometry(1, 40); geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, M.water); m.position.set(pd.x, -0.06, pd.z); m.scale.set(pd.rx * 0.97, 1, pd.rz * 0.97); m.receiveShadow = true; root.add(m); T.pond = m; }
  // ---- the street lamps' light (on from ≈ 3:00:20, when it's dark enough for their sensors)
  T.lampMat = M.lampGlass;
  T.update = (s, o) => laStreetUpdate(T, s, o || {});
  return T;
}

const _laM4 = new THREE.Matrix4(), _laV = new THREE.Vector3(), _laQ2 = new THREE.Quaternion(), _laS = new THREE.Vector3(1, 1, 1), _laE = new THREE.Euler();
// a floating wooden thing: it lifts off once the level is over its float depth, rides just under the surface (wood is
// ~70 % as dense as the liquid), drifts; after 3:10 it lies against the surface, 11.8 m up
function laFloatY(s, h0, k) { const d = laDepth(s), lift = h0 + 0.04; return d < lift ? 0 : d - lift + 0.0 - 0.02 * Math.sin(s * 0.6 + k * 9); }
function laStreetUpdate(T, s, o) {
  const d = laDepth(s);
  for (const C of T.cars) { const st = laCarState(C.b.id, s); C.g.position.set(C.base[0] + st.x, st.y, C.base[2] + st.z); C.g.rotation.set(st.roll, st.yaw, st.pitch); }
  for (const B of T.balls) { const k = laSealed(s, 1.8).squash, p = B.m.geometry.attributes.position;
    if (Math.abs((B._k || 0) - k) > 0.01) { for (let i = 0; i < p.count; i++) { const x = B.base[i * 3], y = B.base[i * 3 + 1], z = B.base[i * 3 + 2], f = 1 + 0.25 * k * (1 - Math.abs(y) / 0.11); p.setXYZ(i, x * f, y * (1 - 0.45 * k * (0.5 + 0.5 * y / 0.11)), z * f); } p.needsUpdate = true; B.m.geometry.computeVertexNormals(); B._k = k; }
    B.m.position.y = 0.11 - 0.035 * k; }
  for (const F of T.cafe) {
    const h0 = F.kind === 'table' ? 0.55 : F.kind === 'chair' ? 0.45 : F.kind === 'picnic' ? 0.6 : 0.05, y = laFloatY(s, h0, F.k), u = Math.max(0, y);
    const drift = Math.min(1, u / 6), dx = 1.5 * drift * Math.sin(F.k * 9) + 0.3 * Math.sin(s * 0.03 + F.k * 5) * drift, dz = 0.8 * drift * Math.cos(F.k * 7);
    F.g.position.set(F.x + dx, y, F.z + dz); F.g.rotation.set(0.15 * drift * Math.sin(s * 0.4 + F.k * 6), (F.ry || 0) + 0.6 * drift * F.k, (F.kind === 'chair' ? 0.5 : 0.12) * drift * Math.sin(F.k * 11));
  }
  // leaves: on the ground until the liquid reaches them, then at its surface
  { const { L, im } = T.leaves;
    for (let i = 0; i < L.length; i++) { const l = L[i], fl = d > 0.02, y = fl ? d - 0.004 : 0.02, dr = fl ? Math.min(2.0, (s - 20) * 0.004) : 0;
      _laV.set(l.x + dr * Math.sin(l.ph), y, l.z + dr * Math.cos(l.ph * 1.3)); _laE.set(-Math.PI / 2 + (fl ? 0.08 * Math.sin(s * 0.8 + l.ph) : 0.3 * Math.sin(l.ph)), 0, l.ph + (fl ? s * 0.01 * l.sp : 0)); _laQ2.setFromEuler(_laE);
      im.setMatrixAt(i, _laM4.compose(_laV, _laQ2, _laS)); }
    im.instanceMatrix.needsUpdate = true; }
  // the street lamps and the café's window light up as it gets dark
  const lampOn = laSm(s, 14, 20); T.lampMat.emissiveIntensity = 0.15 + 2.6 * lampOn; T.cafeGlass.emissiveIntensity = 0.35 * lampOn;
  if (T.towerClock) { const c = laClockParts(s); T.towerClock.update({ h: c.h, m: c.m }); }
}
