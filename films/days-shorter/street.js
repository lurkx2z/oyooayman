/* =====================================================================
   STREET — what you see from your window and around it (layout.js: DS_ST): your block (five floors; your flat on the
   top one, 12.0 m up), the street (it runs dead straight east–west: the sun rises down it at the east end and sets down
   it at the west end, past the church), the next block (a café, balconies with satellite dishes), the church and its
   spire on the corner, the houses down to the sunset, the park south of
   the street (the pond, autumn trees, paths, picnic tables, the swings), the terrace beyond it and the town around.
   (The gravity / liquid-air films' street; at night its windows and lamps light up.)
   Moving, as down leans south (physics.js dsSlider): a car without its handbrake rolls out of the side street; the
   pond's water slides to its south end; the bins, the café's chairs, the picnic tables and finally the parked cars break
   loose and slide south; the swings hang crooked; the spire is pushed over. Posed by update(s), pure.
     dsBuildStreet(S) → T
   ===================================================================== */

// ---- canvases
// a concrete block's front: panels, floor bands, a grid of windows (some with curtains, a few lit)
function dsBlockFacade(seed, wM, hM, o = {}) {
  const r = new RNG(seed), px = 22, W = Math.round(wM * px), H = Math.round(hM * px), litR = [];
  const c = dsCanvas(W, H, (g) => {
    g.fillStyle = o.base || '#c9c2b4'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${r.next() < 0.5 ? '255,255,255' : '40,36,30'},${r.range(0.02, 0.06)})`; g.fillRect(r.range(0, W), r.range(0, H), r.range(1, 4), r.range(1, 3)); }
    for (let x = 0; x < W; x += 3 * px) { g.fillStyle = 'rgba(60,55,48,0.18)'; g.fillRect(x, 0, 1.5, H); }
    const Y = (y) => H - y * px;
    for (let f = 0; f < (o.floors || 5); f++) { g.fillStyle = o.band || 'rgba(120,112,100,0.55)'; g.fillRect(0, Y(f * 3 + 0.25), W, 0.25 * px); }
    g.fillStyle = 'rgba(70,64,56,0.75)'; g.fillRect(0, 0, W, 0.4 * px);                    // the parapet's cap
    for (let f = 0; f < (o.floors || 5); f++) for (const cx of o.cols) {
      if (o.skip && o.skip(f, cx)) continue;
      const x0 = (cx - 1.2 - o.x0) * px, y1 = Y(f * 3 + 2.3), w = 2.4 * px, h = 1.45 * px, lit = r.next() < 0.22;
      if (r.next() < 0.55) litR.push([x0, y1, w, h, r.next()]);
      g.fillStyle = '#efece4'; g.fillRect(x0 - 4, y1 - 4, w + 8, h + 8);
      const gr = g.createLinearGradient(0, y1, 0, y1 + h); gr.addColorStop(0, lit ? '#e8c890' : '#7d93a6'); gr.addColorStop(0.5, lit ? '#a8865a' : '#34404c'); gr.addColorStop(1, lit ? '#6a5236' : '#1a2128');
      g.fillStyle = gr; g.fillRect(x0, y1, w, h);
      if (r.next() < 0.55) { g.fillStyle = `rgba(${r.next() < 0.5 ? '226,214,196' : '186,120,90'},${r.range(0.55, 0.85)})`; const cw = w * r.range(0.15, 0.3); g.fillRect(x0, y1, cw, h); g.fillRect(x0 + w - cw, y1, cw, h); }
      g.fillStyle = '#efece4'; g.fillRect(x0 + w * 0.6, y1, 4, h);
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x0 - 4, y1 + h + 4, w + 8, 4);
    }
    if (o.door) { g.fillStyle = '#3a4a56'; g.fillRect((o.door - 0.9 - o.x0) * px, Y(2.4), 1.8 * px, 2.4 * px); g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect((o.door - 0.8 - o.x0) * px, Y(2.3), 1.6 * px, 1.0 * px); }
  });
  // the windows lit at night (an emissive map: warm, some behind curtains)
  c.lit = dsCanvas(W, H, (g) => { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); for (const [x0, y1, w, h, k] of litR) { g.fillStyle = k < 0.5 ? '#ffd9a0' : k < 0.8 ? '#ffc070' : '#e8ecf0'; g.fillRect(x0, y1, w, h); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x0 + w * 0.6, y1, 4, h); } });
  return c;
}
// a facade material that lights its windows at night (T.litMats: emissiveIntensity set by update)
const DS_LIT = [];
function dsFacadeMat(c, o = {}) { const m = dsStd('#ffffff', 0.9, 0, Object.assign({ map: dsTex(c, { repeat: false }) }, c.lit ? { emissiveMap: dsTex(c.lit, { repeat: false }), emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0 } : {}, o)); if (c.lit) DS_LIT.push(m); return m; }
// a terrace house's front (brick): the bay downstairs, the door with its fanlight, two sashes up. 5 m × 6.45 m
function dsTerraceFacade(seed, brickC) {
  const r = new RNG(seed * 31 + 7), W = 256, H = 330, px = W / 5;
  const c = dsBrickCanvas(seed + 3, brickC, W, H), g = c.getContext('2d');
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
function dsStoneCanvas(seed, w = 512, h = 512) {
  const r = new RNG(seed);
  return dsCanvas(w, h, (g) => {
    g.fillStyle = '#8f877a'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 22) for (let x = -r.range(0, 40); x < w; x += r.range(30, 60)) { const k = r.range(-18, 18); g.fillStyle = `rgb(${168 + k},${158 + k},${140 + k})`; g.fillRect(x + 2, y + 2, r.range(26, 56), 18); }
  });
}
function dsSlateCanvas(seed, w = 256, h = 256) {
  const r = new RNG(seed);
  return dsCanvas(w, h, (g) => { g.fillStyle = '#3c4148'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 12) for (let x = (y / 12) % 2 ? -10 : 0; x < w; x += 20) { const k = r.range(-10, 10); g.fillStyle = `rgb(${66 + k},${72 + k},${80 + k})`; g.fillRect(x + 1, y + 1, 18, 10); } });
}
function dsBallCanvas() {
  return dsCanvas(128, 64, (g, w, h) => { g.fillStyle = '#f4f2ec'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a1a1a'; for (let i = 0; i < 6; i++) { const x = (i * 23 + 8) % w, y = i % 2 ? 18 : 44; g.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283; g.lineTo(x + Math.cos(a) * 8, y + Math.sin(a) * 8); } g.fill(); } });
}
// a wheelie bin (240 l): body, lid, wheels; origin on the ground at its middle
function dsBuildBin(color) {
  const g = new THREE.Group(), m = dsStd(color, 0.55);
  dsMesh(new THREE.CylinderGeometry(0.33, 0.27, 0.98, 4, 1).rotateY(Math.PI / 4).scale(1.0, 1, 1.25), m, 0, 0.53, 0, g);
  dsBox(0.6, 0.05, 0.76, m, 0, 1.05, 0, g);
  for (const sx of [-1, 1]) { const w = dsCyl(0.1, 0.1, 0.05, dsStd('#141414', 0.8), sx * 0.24, 0.1, 0.3, g, 14); w.rotation.z = Math.PI / 2; }
  return g;
}
// a park tree: a trunk in three segments that bend in turn, a crown of blobs in autumn colours
function dsBuildTree(parent, x, z, h, seed, M) {
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
  const segs = [], r0 = 0.14 + 0.07 * (h / 10);
  let par = g;
  for (let k = 0; k < 3; k++) {
    const sg = new THREE.Group(); sg.position.y = k ? h * 0.5 / 3 : 0; par.add(sg); segs.push(sg);
    dsCyl(r0 * (1 - 0.22 * k) * 0.8, r0 * (1 - 0.22 * k), h * 0.5 / 3 + 0.05, M.bark, 0, h * 0.5 / 6, 0, sg, 8);
    par = sg;
  }
  const top = segs[2], cr = h * 0.27, crown = new THREE.Group(); crown.position.y = h * 0.5 / 3; top.add(crown);
  const mats = [M.leafO, M.leafY, M.leafR, M.leafG], k0 = Math.floor(seed * 4);
  dsMesh(dsBlobGeo(cr, seed * 9 + 1), mats[k0 % 4], 0, cr * 0.75, 0, crown);
  dsMesh(dsBlobGeo(cr * 0.75, seed * 9 + 2), mats[(k0 + 1) % 4], cr * 0.6, cr * 0.35, cr * 0.3, crown);
  dsMesh(dsBlobGeo(cr * 0.7, seed * 9 + 3), mats[(k0 + 2) % 4], -cr * 0.55, cr * 0.45, -cr * 0.35, crown);
  dsMesh(dsBlobGeo(cr * 0.6, seed * 9 + 4), mats[k0 % 4], 0.1 * cr, cr * 1.35, -0.2 * cr, crown);
  return { g, segs, crown, h, cr, x, z, stiff: 1.0 + 0.8 * dsR(Math.round(seed * 100), 3), seed };
}
// a bird (pigeon / duck): a body, a head, two wings that flap
function dsBuildBird(col, s = 1) {
  const g = new THREE.Group(), m = dsStd(col, 0.8), w = [];
  dsMesh(new THREE.SphereGeometry(0.12 * s, 8, 6).scale(1.6, 0.8, 0.9), m, 0, 0, 0, g);
  dsMesh(new THREE.SphereGeometry(0.06 * s, 8, 6), m, 0.18 * s, 0.05 * s, 0, g);
  for (const sd of [-1, 1]) { const p = new THREE.Group(); p.position.set(0, 0.03 * s, sd * 0.06 * s); g.add(p); const wing = dsBox(0.16 * s, 0.01 * s, 0.26 * s, m, 0, 0, sd * 0.13 * s, p); wing.castShadow = false; w.push(p); }
  g.userData.wings = w; return g;
}

function dsBuildStreet(S) {
  const scene = S.scene, T = { M: {} }, root = new THREE.Group(); root.name = 'street'; scene.add(root); T.root = root;
  const as = Tex.asphalt(41); for (const t of [as.map, as.roughnessMap, as.bumpMap]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(60, 1); }
  const tex = (c, rx, ry) => { const t = dsTex(c); t.repeat.set(rx, ry); return t; };
  const M = T.M = {
    road: dsStd('#ffffff', 0.92, 0, { map: as.map, roughnessMap: as.roughnessMap, bumpMap: as.bumpMap, bumpScale: 0.5 }),
    pav: dsStd('#ffffff', 0.85, 0, { map: tex(dsPavingCanvas(43), 160, 1) }), kerb: dsStd('#9a968c', 0.8),
    grass: dsStd('#ffffff', 1.0, 0, { map: tex(dsGrassCanvas(5), 300, 300) }), park: dsStd('#ffffff', 1.0, 0, { map: tex(dsGrassCanvas(9), 40, 30) }),
    path: dsStd('#c2b59c', 0.95), rubber: dsStd('#a8473a', 0.95), mud: dsStd('#3d3428', 1.0), stoneEdge: dsStd('#a39d90', 0.85),
    stone: dsStd('#ffffff', 0.95, 0, { map: tex(dsStoneCanvas(61), 4, 2) }), slate: dsStd('#ffffff', 0.85, 0, { map: tex(dsSlateCanvas(3), 8, 4) }),
    roofFlat: dsStd('#5a5754', 0.95), concrete: dsStd('#b9b2a5', 0.95), roof: dsStd('#4a4644', 0.85), roof2: dsStd('#5a4a44', 0.85), roofT: dsStd('#7a3d2c', 0.85),
    brickSide: dsStd('#ffffff', 0.92, 0, { map: tex(dsBrickCanvas(25, [118, 70, 54]), 2, 2) }),
    post: dsStd('#2a2e32', 0.5, 0.5), rail: dsStd('#1c1f22', 0.5, 0.4), metal: dsStd('#c8463a', 0.5, 0.3), metal2: dsStd('#2f6f8a', 0.5, 0.3), chain: dsStd('#8d9297', 0.4, 0.8),
    lampGlass: dsStd('#fff4dd', 0.3, 0, { emissive: new THREE.Color('#ffe2a8'), emissiveIntensity: 0.15 }),
    bark: dsStd('#4f4236', 0.95), bench: dsStd('#6a5038', 0.8),
    leafO: dsStd('#c8742c', 0.85, 0, { flatShading: true }), leafY: dsStd('#d9a63a', 0.85, 0, { flatShading: true }), leafR: dsStd('#a8402a', 0.85, 0, { flatShading: true }), leafG: dsStd('#6f7f3a', 0.85, 0, { flatShading: true }),
    water: new THREE.MeshStandardMaterial({ color: '#2f4f4c', transparent: true, opacity: 0.9, roughness: 0.12, metalness: 0.0, envMapIntensity: 0.8, side: THREE.DoubleSide }),
    sheet: new THREE.MeshStandardMaterial({ color: '#7f9aa2', transparent: true, opacity: 0.5, roughness: 0.05, envMapIntensity: 1.4, depthWrite: false }),
    tile: dsStd('#7a3d2c', 0.8), batten: dsStd('#3b302a', 0.95), glassB: dsStd('#9fb4bf', 0.2, 0.3, { transparent: true, opacity: 0.45 }),
  };
  const B = new Batcher();
  const S0 = DS_ST, k = S0.kerbH, E = S0.roadEnd;
  // ------------------------------------------------------------------ the ground (cut into tiles: depth precision in software rendering)
  Object.assign(M.grass, { polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 8 });
  { const P = S0.park, strip = (x0, x1, z0, z1) => { const gm = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0, Math.max(1, Math.round((x1 - x0) / 50)), Math.max(1, Math.round((z1 - z0) / 50))), M.grass);
      M.grass.map.repeat.set(300, 300); gm.rotation.x = -Math.PI / 2; gm.position.set((x0 + x1) / 2, -0.02, (z0 + z1) / 2); gm.receiveShadow = true; root.add(gm);
      const u = gm.geometry.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, ((x0 + u.getX(i) * (x1 - x0)) + 2000) / 4000, ((z0 + (1 - u.getY(i)) * (z1 - z0)) + 2000) / 4000); };
    strip(-2000, P.x[0], -2000, 2000); strip(P.x[1], 2000, -2000, 2000); strip(P.x[0], P.x[1], -2000, P.z[0]); strip(P.x[0], P.x[1], P.z[1], 2000); }
  // the park's lawn, with the pond's hole cut in it (the pond is a real basin now: its water can slide to one end)
  { const P = S0.park, pd = S0.pond, sh = new THREE.Shape();
    sh.moveTo(P.x[0], -P.z[0]); sh.lineTo(P.x[1], -P.z[0]); sh.lineTo(P.x[1], -P.z[1]); sh.lineTo(P.x[0], -P.z[1]); sh.closePath();
    const hole = new THREE.Path(); for (let i = 0; i <= 64; i++) { const a = -i / 64 * 6.283; const x = pd.x + pd.rx * Math.cos(a), y = -(pd.z + pd.rz * Math.sin(a)); if (i) hole.lineTo(x, y); else hole.moveTo(x, y); } sh.holes.push(hole);
    const geo = new THREE.ShapeGeometry(sh, 24), pm = M.park.clone(); pm.map = M.park.map.clone(); pm.map.repeat.set(40 / (P.x[1] - P.x[0]), 30 / (P.z[1] - P.z[0])); pm.map.needsUpdate = true;
    const m = new THREE.Mesh(geo, pm); m.rotation.x = -Math.PI / 2; m.position.y = -0.005; m.receiveShadow = true; root.add(m); }
  // the street: road (x −320 … 430: past the church to the sunset), pavements, kerbs, markings; the cross street (x 76…84) north and south
  Object.assign(M.road, { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 3 });
  const X0 = -320, RD = S0.road.z;
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(E - X0, RD[1] - RD[0], 80, 1), M.road); m.rotation.x = -Math.PI / 2; m.position.set((X0 + E) / 2, 0.0, (RD[0] + RD[1]) / 2); m.receiveShadow = true; root.add(m);
    const c = new THREE.Mesh(new THREE.PlaneGeometry(8, 400, 1, 40), M.road); c.rotation.x = -Math.PI / 2; c.position.set(80, 0.001, -120); c.receiveShadow = true; root.add(c);
    const c2 = new THREE.Mesh(new THREE.PlaneGeometry(8, 300, 1, 30), M.road); c2.rotation.x = -Math.PI / 2; c2.position.set(29, 0.001, 150); c2.receiveShadow = true; root.add(c2); }
  for (const P of S0.pav) { const m = new THREE.Mesh(new THREE.PlaneGeometry(E - X0, P[1] - P[0], 80, 1), M.pav); m.rotation.x = -Math.PI / 2; m.position.set((X0 + E) / 2, k, (P[0] + P[1]) / 2); m.receiveShadow = true; root.add(m);
    B.box(E - X0, k, P[1] - P[0], (X0 + E) / 2, k / 2, (P[0] + P[1]) / 2, M.kerb); }
  { const wm = dsStd('#ecebe4', 0.6);
    for (let x = X0 + 3; x < E - 6; x += 9) { const geo = new THREE.PlaneGeometry(4, 0.1); geo.rotateX(-Math.PI / 2); B.add(geo, wm, Geo.matrix(x + 2, 0.006, (RD[0] + RD[1]) / 2)); }
    for (const z of [RD[0] + 0.3, RD[1] - 0.3]) { const geo = new THREE.PlaneGeometry(E - X0 - 4, 0.08); geo.rotateX(-Math.PI / 2); B.add(geo, dsStd('#d9c25a', 0.6), Geo.matrix((X0 + E) / 2, 0.006, z)); } }
  // lamp posts along both pavements (set in concrete: they hold)
  T.posts = [];
  for (let x = -164; x < 320; x += 26) { T.posts.push([x, -10.2, 1]); T.posts.push([x + 13, -1.6, -1]); }
  for (const [x, z, f] of T.posts) {
    B.add(new THREE.CylinderGeometry(0.06, 0.085, 6.0, 10), M.post, Geo.matrix(x, 3.12, z));
    B.add(new THREE.BoxGeometry(0.06, 0.06, 0.9), M.post, Geo.matrix(x, 6.07, z + f * 0.42));
    B.add(new THREE.BoxGeometry(0.3, 0.1, 0.55), M.post, Geo.matrix(x, 6.02, z + f * 0.85));
    B.add(new THREE.BoxGeometry(0.24, 0.02, 0.45), M.lampGlass, Geo.matrix(x, 5.96, z + f * 0.85));
  }
  // ------------------------------------------------------------------ your block (its front has the hole of your window; hollow behind it)
  { const A = S0.blockA, cols = [-17.8, -12.3, -6.8, -1.3, 4.2, 9.7, 15.2];
    const fc = dsBlockFacade(11, A.x[1] - A.x[0], A.h, { cols, x0: A.x[0], door: -4.0 });
    const fm = dsFacadeMat(fc);
    const wi = DS_ROOM.win, ox = DS_ROOM.origin[0], oy = DS_ROOM.origin[1];
    const hole = [ox + wi.x[0], ox + wi.x[1], oy + wi.y[0], oy + wi.y[1]];
    // the front: cells round the hole, uv from position (the facade texture spans the whole front)
    const pos = [], uv = [], idx = [];
    for (const c of dsWallCells(A.x[0], A.x[1], 0, A.h, [hole])) {
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
    const side = dsFacadeMat(dsBlockFacade(12, 12, A.h, { cols: [2.5, 8.5], x0: 0 }));
    const back = dsFacadeMat(dsBlockFacade(13, 44, A.h, { cols, x0: A.x[0] }));
    const bx = (x0, x1, y0, y1, z0, z1, mats) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mats); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); m.castShadow = m.receiveShadow = true; root.add(m); return m; };
    const c = M.concrete, rf = M.roofFlat;
    bx(A.x[0], -6.2, 0, A.h, 0.02, 4.5, [c, side, rf, c, c, c]); bx(-1.8, 1.25, 0, A.h, 0.02, 4.5, [c, c, rf, c, c, c]); bx(-6.2, -1.8, 0, A.h, 4.2, 4.5, [c, c, rf, c, c, c]); bx(-6.2, -1.8, A.h - 0.3, A.h, 0.02, 4.2, [c, c, rf, c, c, c]); bx(6.75, A.x[1], 0, A.h, 0.02, 4.5, [side, c, rf, c, c, c]);
    bx(1.25, 6.75, 0, 11.8, 0.02, 4.5, [c, c, c, c, c, c]); bx(1.25, 6.75, 14.85, A.h, 0.02, 4.5, [c, c, rf, c, c, c]);
    bx(A.x[0], A.x[1], 0, A.h, 4.5, A.z[1], [side, side, rf, c, back, c]);
    B.box(A.x[1] - A.x[0] + 0.2, 0.4, 0.25, 0, A.h - 0.2, 0.0, M.kerb);                                  // the parapet
  }
  // ------------------------------------------------------------------ the next block (balconies: each its own group, on its north face)
  { const Bb = S0.blockB, cols = [38, 46, 54, 62, 70];
    const fm = dsFacadeMat(dsBlockFacade(21, Bb.x[1] - Bb.x[0], Bb.h, { cols, x0: Bb.x[0], base: '#cdb9a2', door: 50 }));
    const side = dsFacadeMat(dsBlockFacade(22, 12, Bb.h, { cols: [2.5, 8.5], x0: 0, base: '#cdb9a2' }));
    const m = new THREE.Mesh(new THREE.BoxGeometry(Bb.x[1] - Bb.x[0], Bb.h, Bb.z[1] - Bb.z[0]), [side, side, M.roofFlat, M.concrete, side, fm]);
    m.position.set((Bb.x[0] + Bb.x[1]) / 2, Bb.h / 2, (Bb.z[0] + Bb.z[1]) / 2); m.castShadow = m.receiveShadow = true; root.add(m);
    T.balc = [];
    for (let f = 1; f < 5; f++) for (const x of [42, 58, 66]) {
      const g = new THREE.Group(); g.position.set(x, f * 3 + 0.15, 0); root.add(g); const w = 3.2, d = 1.4;
      dsBox(w, 0.18, d, M.concrete, 0, -0.09, -d / 2, g);
      dsBox(w, 1.0, 0.02, M.glassB, 0, 0.5, -d + 0.02, g); dsBox(0.02, 1.0, d, M.glassB, -w / 2 + 0.02, 0.5, -d / 2, g); dsBox(0.02, 1.0, d, M.glassB, w / 2 - 0.02, 0.5, -d / 2, g);
      dsBox(w, 0.04, 0.05, M.post, 0, 1.0, -d + 0.02, g);
      if ((f + x) % 2 === 0) { dsBox(w - 0.1, 0.3, 0.28, M.concrete, 0, 0.15, -d + 0.18, g); dsMesh(dsBlobGeo(0.22, f * 7 + x), M.leafG, -0.6, 0.38, -d + 0.18, g); }
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
    // dark windows: lancets on the nave's street side, louvres in the tower
    for (let x = N.x[0] + 4; x < N.x[1] - 2; x += 5) B.box(1.4, 4.2, 0.1, x, 5.5, N.z[1] + 0.05, M.post);
    for (const z of [Tw.z[0] - 0.05, Tw.z[1] + 0.05]) B.box(1.6, 3.0, 0.1, (Tw.x[0] + Tw.x[1]) / 2, Tw.h - 4, z, M.post);
    B.box(0.1, 3.0, 1.6, Tw.x[0] - 0.05, Tw.h - 4, (Tw.z[0] + Tw.z[1]) / 2, M.post);
    // the spire (an octagonal cone) on the tower: it pivots at its foot when it's pushed over (south)
    { const sg = new THREE.Group(); sg.position.set((Tw.x[0] + Tw.x[1]) / 2, Tw.h, (Tw.z[0] + Tw.z[1]) / 2); root.add(sg); T.spire = sg;
      const sp = new THREE.Mesh(new THREE.ConeGeometry(C.spireR, C.spire, 8), M.slate); sp.position.set(0, C.spire / 2 + 0.5, 0); sp.castShadow = true; sg.add(sp);
      dsCyl(C.spireR * 1.08, C.spireR * 1.12, 0.5, M.stone, 0, 0.25, 0, sg, 8); dsCyl(0.05, 0.05, 2.0, M.post, 0, C.spire + 1.5, 0, sg, 6);
      sp.position.x += 0; const spx = sg.position.x, spz = sg.position.z;
      // the clock face on the tower's street side (it says 3:30 at the bell)
      const ck = dsCanvasTex(256, 256, (g, w, h, st) => { g.clearRect(0, 0, w, h); g.fillStyle = '#1c2630'; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 4, 0, 6.283); g.fill(); g.strokeStyle = '#d8c48a'; g.lineWidth = 8; g.stroke();
        g.fillStyle = '#d8c48a'; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.fillRect(w / 2 + Math.sin(a) * 100 - 5, h / 2 - Math.cos(a) * 100 - 5, 10, 10); }
        g.strokeStyle = '#d8c48a'; g.lineCap = 'round'; const hd = (a, L, wd) => { g.lineWidth = wd; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + Math.sin(a) * L, h / 2 - Math.cos(a) * L); g.stroke(); };
        hd((st.h % 12 + st.m / 60) / 12 * 6.283, 60, 12); hd(st.m / 60 * 6.283, 92, 8); });
      const cf = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32), new THREE.MeshStandardMaterial({ map: ck.tex, transparent: true, roughness: 0.6 })); cf.position.set(Tw.x[0] - 0.06, Tw.h - 8.5, (Tw.z[0] + Tw.z[1]) / 2); cf.rotation.y = -Math.PI / 2; root.add(cf); T.towerClock = ck; void spx; void spz; }
    // the churchyard walls (along the cross street, and a low one along the pavement)
    B.box(0.5, 1.2, 30, 85.4, 0.6, -41, M.stone); B.box(41, 0.9, 0.5, 106.4, 0.45, -12.8, M.stone);
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
    { const e = new THREE.RingGeometry(0.985, 1.03, 64); e.rotateX(-Math.PI / 2); e.scale(pd.rx, 1, pd.rz); B.add(e, M.stoneEdge, Geo.matrix(pd.x, 0.03, pd.z));
      // the basin: a saucer 0.7 m deep with gentle banks (the outer 30 % slopes up to the rim), muddy: when the water
      // leans, a band of wet mud shows at the north end
      const pts = []; for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push(new THREE.Vector2(Math.max(0.001, u), -pd.depth * Math.pow(Math.min(1, (1 - u) / 0.3), 0.8))); }
      const bowl = new THREE.LatheGeometry(pts, 48); bowl.scale(pd.rx, 1, pd.rz); const bm = M.mud.clone(); bm.side = THREE.DoubleSide; B.add(bowl, bm, Geo.matrix(pd.x, 0.0, pd.z)); }
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
    // the swings: an A-frame each end, the top bar along x (east–west), so the seats hang free towards the south
    const xs = [Sw.x - 3.2, Sw.x + 3.2];
    for (const x of xs) for (const dz of [-1, 1]) { const geo = new THREE.CylinderGeometry(0.05, 0.05, 2.7, 8); B.add(geo, M.metal2, Geo.matrix(x, 1.25, Sw.z + dz * 0.6, -dz * 0.25, 0, 0)); }
    { const geo = new THREE.CylinderGeometry(0.055, 0.055, 6.6, 8); geo.rotateZ(Math.PI / 2); B.add(geo, M.metal2, Geo.matrix(Sw.x, Sw.top, Sw.z)); }
    T.swings = [];
    for (let i = 0; i < Sw.n; i++) { const pv = new THREE.Group(); pv.position.set(Sw.x - 1.6 + i * 1.6, Sw.top, Sw.z); root.add(pv);
      for (const dx of [-0.22, 0.22]) dsCyl(0.008, 0.008, 1.95, M.chain, dx, -0.975, 0, pv, 4);
      dsBox(0.5, 0.04, 0.22, dsStd('#222', 0.7), 0, -1.97, 0, pv); T.swings.push({ pv, ph: i * 1.9 }); }
    // a slide (fixed)
    B.box(0.5, 0.06, 3.2, D.x + 12, 1.0, D.z + 8, M.metal, 0); for (const dz of [-1.5]) B.box(0.6, 2.0, 0.06, D.x + 12, 1.0, D.z + 8 + dz, M.metal2);
  }
  // ------------------------------------------------------------------ trees in the park (rooted: they bend and hold); their leaves (below)
  T.trees = [];
  { const r = new RNG(29), spots = [[-58, -24], [-46, -36], [-60, -58], [-38, -70], [-22, -28], [24, -38], [16, -70], [42, -60], [58, -40], [-6, -88], [34, -88], [58, -76], [-52, -92], [-30, -50]];
    for (const [x, z] of spots) T.trees.push(dsBuildTree(root, x + r.range(-2, 2), z + r.range(-2, 2), r.range(10, 14), r.next(), M)); }
  // ------------------------------------------------------------------ the terrace along the park's north side (front z −104, facing south)
  T.roofs = [];
  { const r = new RNG(19), bricks = [[128, 72, 56], [150, 98, 70], [120, 66, 52], [158, 120, 88], [138, 80, 60]];
    const fm = Array.from({ length: 6 }, (_, v) => dsStd('#ffffff', 0.85, 0, { map: dsTex(dsTerraceFacade(100 + v, bricks[v % bricks.length]), { repeat: false }) }));
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
    const mats = cols.map((c) => dsStd(c, 0.9)), roofs = [M.roof, M.roof2, M.roofT];
    const house = (x, z, w, d, h, ry) => { B.box(w, h, d, x, h / 2, z, mats[r.int(0, mats.length - 1)], ry);
      const sh = new THREE.Shape(); sh.moveTo(-d / 2 - 0.3, 0); sh.lineTo(d / 2 + 0.3, 0); sh.lineTo(0, 2.4); sh.closePath();
      const rg = new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: false }); rg.rotateY(Math.PI / 2); rg.translate(-w / 2, 0, 0); B.add(rg, roofs[r.int(0, 2)], Geo.matrix(x, h, z, 0, ry, 0)); };
    const flats = (x, z, w, d, h) => B.box(w, h, d, x, h / 2, z, mats[r.int(0, mats.length - 1)]);
    for (let k = 0; k < 4; k++) for (let x = -150; x < 150; x += r.range(11, 16)) house(x, -122 - k * 16 - r.range(0, 4), r.range(8, 11), r.range(7, 9), r.range(5.5, 6.6), 0);
    for (let k = 0; k < 3; k++) for (let x = -200; x < 200; x += r.range(30, 46)) flats(x, 30 + k * 26 + r.range(0, 6), r.range(26, 40), 12, r.range(9, 15));
    for (let x = -300; x < -40; x += r.range(34, 46)) flats(x, 6, r.range(26, 36), 12, r.range(10, 13));
    for (let k = 0; k < 3; k++) for (let z = -120; z < 60; z += r.range(12, 16)) { const x = 96 + k * 15 + r.range(0, 3); if (z > -48 && z < 18 && x < 136 || z > -30 && z < 18) continue; house(x, z, r.range(7, 9), r.range(8, 11), r.range(5.5, 6.6), Math.PI / 2); }
    // the houses lining the street to the west (the sunset goes down between them) and to the east (the sunrise)
    for (let x = 90; x < 350; x += r.range(10, 13)) house(x, 7.6, r.range(8.4, 9.8), 9, r.range(5.6, 7.2), 0);
    for (let x = 140; x < 350; x += r.range(10, 13)) house(x, -19.6, r.range(8.4, 9.8), 9, r.range(5.6, 7.2), 0);
    for (let x = -330; x < -80; x += r.range(10, 13)) house(x, -19.6, r.range(8.4, 9.8), 9, r.range(5.6, 7.2), 0);
    for (let i = 0; i < 70; i++) { const x = r.range(-260, 260), z = (r.next() < 0.5 ? -1 : 1) * r.range(110, 260), h = r.range(7, 12);
      if (Math.abs(z) < 108) continue;
      B.add(new THREE.CylinderGeometry(0.15, 0.22, h * 0.5, 6), M.bark, Geo.matrix(x, h * 0.25, z)); B.add(dsBlobGeo(h * 0.3, i + 7), [M.leafO, M.leafY, M.leafG][i % 3], Geo.matrix(x, h * 0.62, z)); } }
  B.build(root, 'street');

  // ==================================================================== MOVING THINGS
  // ---- satellite dishes: on the next block's balconies and your block's front, all aimed at the same point in the sky
  //      (a geostationary satellite: due south, 49° up from 35° N)
  { const dm = dsStd('#e8e8e4', 0.45, 0.2, { side: THREE.DoubleSide }), arm = dsStd('#8a8d90', 0.4, 0.6);
    const pts = []; for (let i = 0; i <= 8; i++) { const r = i / 8 * 0.3; pts.push(new THREE.Vector2(r, r * r * 0.9)); }
    const dg = new THREE.LatheGeometry(pts, 20);
    const aim = new THREE.Vector3(0, Math.sin(49 * Math.PI / 180), -Math.cos(49 * Math.PI / 180));
    const dish = (x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); root.add(g); const d = dsMesh(dg, dm, 0, 0, 0, g); d.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), aim);
      const lnb = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.08, 8), arm); lnb.position.copy(aim.clone().multiplyScalar(0.34)); g.add(lnb);
      const a2 = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.36, 5), arm); a2.position.copy(aim.clone().multiplyScalar(0.17)).add(new THREE.Vector3(0, -0.06, 0)); a2.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), aim); g.add(a2);
      dsCyl(0.015, 0.015, 0.35, arm, 0, -0.2, 0.05, g, 6); return g; };
    T.dishes = [];
    for (const g of T.balc) T.dishes.push(dish(g.position.x + 1.15, g.position.y + 1.25, g.position.z - 1.25));
    for (const [x, f] of [[-12.3, 1], [-1.3, 2], [9.7, 3], [15.2, 1], [-17.8, 3]]) T.dishes.push(dish(x + 1.5, f * 3 + 1.2, -0.25));
    // the dish shot: the dish on the second-floor balcony at x 58, seen from behind it; its beam drawn as amber dashes
    // out to empty sky; the satellite where it really is now (the old spin's sky: the dish's aim turned west about the
    // pole by how far the ground has run ahead)
    { const d = new THREE.Vector3(58 + 1.15, 2 * 3 + 0.15 + 1.25, -1.25), A = aim.clone(), pole = new THREE.Vector3(0, DS_SL, DS_CL), L = 70;
      const n = Math.floor((L - 0.6) / 0.9), geo = new THREE.BoxGeometry(1, 1, 1), im = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: '#ffc870', transparent: true, opacity: 0.85, depthWrite: false, fog: false }), n);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), A), M4 = new THREE.Matrix4();
      for (let i = 0; i < n; i++) { const r = 0.6 + i * 0.9 + 0.25, w = 0.012 + 0.0045 * r; M4.compose(d.clone().addScaledVector(A, r), q, new THREE.Vector3(w, w, 0.5)); im.setMatrixAt(i, M4); }
      im.visible = false; im.renderOrder = 5; root.add(im); T.beam = im;
      const far = 300, aimPt = d.clone().addScaledVector(A, far);
      T.dishShot = { d: d.toArray(), c0: [d.x - 0.7, d.y - 0.75, d.z + 1.05], c1: [d.x - 0.76, d.y - 0.74, d.z + 1.0], at: d.clone().addScaledVector(A, 40).add(new THREE.Vector3(-1.5, -3.5, 0)).toArray(), aimPt: aimPt.toArray(),
        satAt: (off) => d.clone().addScaledVector(A.clone().applyAxisAngle(pole, -off), far).toArray() }; } }
  // ---- the parked cars (and one in the side street, facing north, its handbrake off)
  const VF = new VehicleFactory();
  T.cars = DS_ST.bodies.filter((b) => b.kind === 'car').map((b) => {
    const g = new THREE.Group(); g.position.set(b.pos[0], 0, b.pos[2]); root.add(g);
    const o = VF.build(b.type, b.col); o.group.position.x = -b.L / 2; const turn = new THREE.Group(); turn.rotation.y = b.dir === 'n' ? -Math.PI / 2 : b.dir > 0 ? 0 : Math.PI; turn.add(o.group); g.add(turn);
    const f = b.id === 'car10' ? dsSlider(DS_MU.car, 1, 200, 0.35) : dsSlider(b.dir > 0 ? DS_MU.cars : DS_MU.cars2, 1, 300);
    return { b, g, base: [b.pos[0], 0, b.pos[2]], f, stop: b.id === 'car10' ? b.pos[2] - (-12.35 + b.L / 2 + 0.15) : b.pos[2] - (-12.35 + 1.0) };
  });
  T.rollCar = T.cars.find((c) => c.b.id === 'car10');
  T.rollCarZ = () => T.rollCar.g.position.z;
  // ---- the bins (out for collection on your pavement): they slide on Friday evening
  T.bins = DS_ST.bodies.filter((b) => b.kind === 'bin').map((b) => { const g = dsBuildBin(b.col); g.position.set(b.pos[0], b.pos[1], b.pos[2]); root.add(g); return { g, b, f: dsSlider(DS_MU.bins * (1 + 0.01 * (b.pos[0] % 3)), 1, 300) }; });
  // ---- the footballs in the park: they roll away on Friday (≈ 3°)
  T.balls = DS_ST.bodies.filter((b) => b.kind === 'ball').map((b, i) => {
    const m = dsMesh(new THREE.SphereGeometry(0.11, 16, 12), b.col === '#f2f0ea' ? dsStd('#ffffff', 0.5, 0, { map: dsTex(dsBallCanvas(), { repeat: false }) }) : dsStd(b.col, 0.5), b.pos[0], 0.11, b.pos[2], root);
    return { m, b, f: dsSlider(Math.tan((2.6 + 0.4 * i) * Math.PI / 180), 5 / 7, 1200, 0.5) };
  });
  // ---- the café on the next block's ground floor: an awning, metal tables and chairs on the pavement; picnic tables, branches
  { const wood = dsStd('#ffffff', 0.7, 0, { map: (() => { const t = dsTex(dsWoodCanvas(57, 256, 512, [150, 112, 74])); return t; })() });
    const aw = dsCanvas(256, 64, (g, w, h) => { for (let x = 0; x < w; x += 32) { g.fillStyle = (x / 32) % 2 ? '#f2ede2' : '#2f6a5a'; g.fillRect(x, 0, 32, h); } });
    const am = dsStd('#ffffff', 0.85, 0, { map: (() => { const t = dsTex(aw); t.repeat.set(3, 1); return t; })(), side: THREE.DoubleSide });
    const awn = new THREE.Mesh(new THREE.PlaneGeometry(14, 1.6), am); awn.position.set(46, 2.75, -0.7); awn.rotation.x = -Math.PI / 2 + 0.45; root.add(awn);
    const glassF = dsStd('#ffffff', 0.25, 0.1, { map: dsTex(dsCanvas(512, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffe2a8'); gr.addColorStop(1, '#a8742e'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(40,24,12,0.6)'; for (let x = 20; x < w; x += 90) g.fillRect(x, 30, 40, 70); g.fillStyle = '#1a1a1a'; g.font = '700 30px Georgia'; g.fillText('CAFÉ', 20, 26); }), { repeat: false }), emissive: new THREE.Color('#ffcf8a'), emissiveIntensity: 0.0 });
    const shop = new THREE.Mesh(new THREE.PlaneGeometry(13, 2.4), glassF); shop.position.set(46, 1.3, -0.02); root.add(shop); T.cafeGlass = glassF;
    T.cafe = [];
    const r = new RNG(71), met = dsStd('#3a3d40', 0.45, 0.6);
    for (const [x, z] of [[41.5, -1.0], [46, -1.1], [50.5, -0.95]]) {
      const tg = new THREE.Group(); root.add(tg); dsCyl(0.36, 0.36, 0.04, wood, 0, 0.74, 0, tg, 20); dsCyl(0.035, 0.035, 0.72, met, 0, 0.36, 0, tg, 8); dsCyl(0.22, 0.22, 0.03, met, 0, 0.015, 0, tg, 16);
      T.cafe.push({ g: tg, x, z, k: r.next(), mu: 0.42 + 0.06 * r.next() });
      for (const a of [0.3, 2.6]) { const cg = new THREE.Group(); root.add(cg); dsBox(0.42, 0.04, 0.42, wood, 0, 0.45, 0, cg); dsBox(0.42, 0.42, 0.04, wood, 0, 0.68, -0.2, cg); for (const [dx, dz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) dsBox(0.035, 0.45, 0.035, met, dx, 0.225, dz, cg);
        T.cafe.push({ g: cg, x: x + Math.cos(a) * 0.75, z: z + Math.sin(a) * 0.55, ry: a + Math.PI / 2, k: r.next(), mu: 0.38 + 0.08 * r.next() }); }
    }
    for (const [x, z, ry] of [[-14, -24, 0.2], [10, -27, -0.3], [-30, -32, 0.6]]) { const g = new THREE.Group(); root.add(g);
      dsBox(1.9, 0.05, 0.75, wood, 0, 0.75, 0, g); for (const dz of [-0.6, 0.6]) dsBox(1.9, 0.05, 0.28, wood, 0, 0.45, dz, g); for (const dx of [-0.7, 0.7]) dsBox(0.06, 0.75, 1.5, wood, dx, 0.37, 0, g, 0);
      T.cafe.push({ g, x, z, ry, k: r.next(), mu: 0.55 + 0.1 * r.next() }); }
    for (let i = 0; i < 14; i++) { const g = new THREE.Group(); root.add(g); const L = r.range(1.2, 3.4); const br = dsCyl(0.03, 0.05, L, M.bark, 0, 0, 0, g, 6); br.rotation.z = Math.PI / 2; for (let k = 0; k < 3; k++) { const tw = dsCyl(0.01, 0.02, L * 0.35, M.bark, r.range(-L / 3, L / 3), 0.1, 0, g, 5); tw.rotation.set(r.range(-1, 1), 0, r.range(0.5, 1.2)); }
      T.cafe.push({ g, x: r.range(-60, 60), z: r.range(-90, -18), ry: r.range(0, 6.28), k: r.next(), mu: 0.5 + 0.2 * r.next() }); }
    for (const F of T.cafe) F.f = dsSlider(F.mu, 1, 400);
  }
  // ---- leaves on the grass and the pavements
  { const N = 2600, r = new RNG(311), L = [];
    for (let i = 0; i < N; i++) { const P = DS_ST.park, onPark = r.next() < 0.8; L.push({ x: onPark ? r.range(P.x[0] + 2, P.x[1] - 2) : r.range(-60, 80), z: onPark ? r.range(P.z[0] + 2, P.z[1] - 2) : r.range(-12, -0.3), ph: r.range(0, 6.28), c: r.int(0, 3), sp: r.range(0.2, 1.0) }); }
    const geo = new THREE.PlaneGeometry(0.2, 0.15), cols = ['#c8742c', '#d9a63a', '#a8402a', '#8a6a2a'].map((c) => new THREE.Color(c));
    const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.8, side: THREE.DoubleSide }), N); im.frustumCulled = false; im.castShadow = false;
    L.forEach((l, i) => im.setColorAt(i, cols[l.c])); root.add(im);
    T.leaves = { L, im, f: dsSlider(0.62, 1, 900) };
  }
  // ---- the pond's water: a level surface in its basin; it lies along the new level (higher at the south end)
  { const pd = DS_ST.pond, g = new THREE.Group(); g.position.set(pd.x, -0.03, pd.z); root.add(g);
    const geo = new THREE.CircleGeometry(1, 64); geo.rotateX(-Math.PI / 2); geo.scale(pd.rx * 1.12, 1, pd.rz * 1.25);
    const m = new THREE.Mesh(geo, M.water); m.receiveShadow = true; g.add(m); T.pond = g;
    // two depth gauges (white boards, a tick every 5 cm) near the north and south ends: the water falls on one, rises on the other
    const wb = dsStd('#f1efe8', 0.6), tk = dsStd('#1d232b', 0.6), red = dsStd('#c8432f', 0.5); T.gauges = [];
    for (const dz of [8.6, -8.6]) { const gg = new THREE.Group(); gg.position.set(pd.x + 1.5, 0, pd.z + dz); root.add(gg); dsBox(0.12, 1.3, 0.04, wb, 0, -0.2, 0, gg);
      for (let i = -10; i <= 8; i++) dsBox(i % 2 ? 0.05 : 0.09, 0.008, 0.012, i === 0 ? red : tk, 0.0, -0.03 + i * 0.05, dz > 0 ? -0.025 : 0.025, gg);
      T.gauges.push({ x: pd.x + 1.5, z: pd.z + dz, dz }); } }
  T.lampMat = M.lampGlass;
  T.dust = [];
  T.update = (s, o) => dsStreetUpdate(T, s, o || {});
  return T;
}

const _dsM4 = new THREE.Matrix4(), _dsV = new THREE.Vector3(), _dsQ2 = new THREE.Quaternion(), _dsS = new THREE.Vector3(1, 1, 1), _dsE = new THREE.Euler();
// the spire: it cracks at its base and is pushed over towards the south (a rod turning about its foot under the leaning
// down: φ'' = 3 g_eff sin(φ + θ) / 2L); at 66° its foot snaps and it tumbles on, falling under the leaning down
// (towards the ground and south), until it hits the churchyard and lies flat. Integrated once (pure): out[i] = [foot y,
// foot z, φ] of the spire's group (its origin is the spire's foot)
const DS_SPIRE = (() => { const C = DS_ST.church, Tw = C.tower, L = 17, Lc = C.spire / 2 + 0.5, Lt = C.spire + 0.5, R = C.spireR, dt = 1 / 120, s0 = DS.sSpire + 1.2;
  const fz0 = (Tw.z[0] + Tw.z[1]) / 2, out = []; let phi = 0, w = 0, mode = 0, cy = 0, cz = 0, vy = 0, vz = 0, sLand = 0, pL = 0, fL = 0, cL = 0;
  for (let i = 0; i <= 120 * 12; i++) { const s = s0 + i * dt, th = dsTilt(s), ge = dsGEff(s);
    if (mode === 0) { out.push([Tw.h, fz0, phi]); w += 1.5 * ge * Math.sin(phi + th) / L * dt; phi += w * dt;
      if (phi > 1.15) { mode = 1; cy = Tw.h + Lc * Math.cos(phi); cz = fz0 - Lc * Math.sin(phi); vy = -Lc * w * Math.sin(phi); vz = -Lc * w * Math.cos(phi); } }
    else if (mode === 1) { const fy = cy - Lc * Math.cos(phi), fz = cz + Lc * Math.sin(phi); out.push([fy, fz, phi]);
      vy -= ge * Math.cos(th) * dt; vz -= ge * Math.sin(th) * dt; cy += vy * dt; cz += vz * dt; phi += w * dt;
      if (Math.min(fy, fy + Lt * Math.cos(phi)) < 0.4) { mode = 2; sLand = s; pL = phi; fL = fz; cL = cy; } }
    else { const u = dsSm(s - sLand, 0, 0.35), pt = Math.round((pL - Math.PI / 2) / Math.PI) * Math.PI + Math.PI / 2, ph = pL + (pt - pL) * u;
      out.push([(1 - u) * Math.max(0.4, cL - Lc * Math.cos(pL)) + u * R, fL, ph]); } }
  return { s0, dt, out, sLand, fz0 }; })();
function dsSpirePose(s) { const D = DS_SPIRE; if (s <= D.s0) return [DS_ST.church.tower.h, D.fz0, 0]; const u = (s - D.s0) / D.dt, i = Math.min(D.out.length - 2, Math.floor(u)), f = Math.min(1, u - i), A = D.out[i], B = D.out[i + 1];
  return [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, A[2] + (B[2] - A[2]) * f]; }
function dsSpireAngle(s) { return dsSpirePose(s)[2]; }

function dsStreetUpdate(T, s, o) {
  if (T.beam) T.beam.visible = o.mode === 'dish';
  const th = dsTilt(s), day = dsDaylight(s), late = s > DS.sCars + 120;
  // the parked cars: the one without its handbrake (Thursday); the rest break loose at 35° and slide into the railings,
  // which give way a few minutes later
  for (const C of T.cars) { let dz = C.f(s); if (!late) dz = Math.min(dz, C.stop); C.g.position.set(C.base[0], 0, C.base[2] - dz);
    const hit = C.b.id === 'car10' ? dsSm(dz, C.stop - 0.3, C.stop) : 0; C.g.rotation.set(0.02 * hit * Math.sin(s * 9), 0, 0); C.g.visible = C.base[2] - dz > -90; }
  // the bins (Friday evening), the footballs, the café furniture, picnic tables and branches: south until something stops them
  for (const Bn of T.bins) { const dz = Math.min(Bn.f(s), Bn.b.pos[2] - (-12.35 + 0.42) + (s > DS.sCars ? 1e4 : 0)); Bn.g.position.set(Bn.b.pos[0], Bn.b.pos[1], Bn.b.pos[2] - dz); Bn.g.visible = Bn.g.position.z > -95;
    Bn.g.rotation.x = -Math.min(0.5, dz * 0.04) * (dz < 10.5 ? 1 : 0); }
  for (const Bl of T.balls) { const dz = Math.min(Bl.f(s), Bl.b.pos[2] + 98); Bl.m.position.set(Bl.b.pos[0], 0.11, Bl.b.pos[2] - dz); Bl.m.rotation.x = -dz / 0.11; }
  for (const F of T.cafe) { const dz = F.f(s), z = F.z - dz; F.g.position.set(F.x + 0.6 * Math.sin(F.k * 9) * Math.min(1, dz / 8), 0, Math.max(F.z < -12 ? -99 : -12.0, z)); if (F.z > -12 && z < -12 && s > DS.sCars) F.g.position.z = z;
    F.g.rotation.set(0, (F.ry || 0) + 0.4 * Math.min(1, dz / 6) * (F.k - 0.5), 0); F.g.visible = F.g.position.z > -99; }
  // leaves: from 32° the leaves slide off south (they're gone from the street by dawn)
  { const { L, im, f } = T.leaves, dz0 = f(s);
    if (T._lz !== dz0) { T._lz = dz0;
      for (let i = 0; i < L.length; i++) { const l = L[i], dz = dz0 * (0.6 + 0.8 * l.sp); _dsV.set(l.x, 0.02, l.z - dz); _dsE.set(-Math.PI / 2 + 0.3 * Math.sin(l.ph), 0, l.ph + dz * 0.3); _dsQ2.setFromEuler(_dsE);
        im.setMatrixAt(i, _dsM4.compose(_dsV, _dsQ2, l.z - dz < -100 ? _dsV.set(0, 0, 0) : _dsS)); }
      im.instanceMatrix.needsUpdate = true; } }
  // the pond: its surface lies along the new level (rising to the south), until the water spills out of the south end
  T.pond.rotation.x = Math.min(th, 0.25); T.pond.visible = s < dsAt(6, 0, 30);
  // the swings hang along down (a little sway)
  for (const Sg of T.swings) Sg.pv.rotation.set(th + 0.02 * Math.sin(s * 1.3 + Sg.ph) * (o.rate < 5 ? 1 : 0), 0, 0);
  // the spire
  { const P = dsSpirePose(s), D = DS_SPIRE; T.spire.rotation.set(-P[2], 0, 0); T.spire.position.y = P[0]; T.spire.position.z = P[1];
    T.dust.length = 0; const cx = T.spire.position.x;
    // a puff of grit where it cracks off the tower, then the dust where it lands (it lies along the churchyard, tip south)
    if (s > D.s0 && s < D.s0 + 6) { const u = MathX.clamp((s - D.s0) / 6, 0, 1); for (let i = 0; i < 40; i++) { const r = 0.5 + 3 * u * dsR(i, 64), a2 = dsR(i, 65) * 6.283; T.dust.push([cx + r * Math.cos(a2), DS_ST.church.tower.h + 0.5 - 4 * u * dsR(i, 66), D.fz0 + r * Math.sin(a2), 0.8 + 1.5 * u, 0.45 * (1 - u)]); } }
    if (s > D.sLand && s < D.sLand + 16) { const u = MathX.clamp((s - D.sLand) / 16, 0, 1), e = 1 - (1 - u) * (1 - u), cz = P[1] - DS_ST.church.spire / 2;
      for (let i = 0; i < 200; i++) { const along = (dsR(i, 67) - 0.5) * DS_ST.church.spire * 1.1, r = 1 + 8 * e * dsR(i, 61), a2 = dsR(i, 62) * 6.283; T.dust.push([cx + r * Math.cos(a2), 0.6 + 9 * e * dsR(i, 63), cz + along + r * Math.sin(a2) * 0.5, 2.0 + 3.5 * e, 0.6 * (1 - u)]); } } }
  // the street lamps and the café's window light up in the dark; the windows of the blocks too
  const dark = 1 - dsSm(day, 0.25, 0.6); T.lampOn = dark; T.lampMat.emissiveIntensity = 0.15 + 2.6 * dark; T.cafeGlass.emissiveIntensity = 0.45 * dark;
  for (const m of DS_LIT) m.emissiveIntensity = 0.9 * dark;
  if (T.towerClock) { const c = dsClockParts(s); T.towerClock.update({ h: c.h24, m: c.m }); }
}
