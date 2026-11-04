/* =====================================================================
   ROOM — your kitchen on the top (fifth) floor (layout.js: SA_ROOM). Its window looks south over the street and the
   park; the afternoon sun comes in at it. The counter runs along the left wall (the sink, the kettle, the hob), the
   fridge at its far end, wall cupboards over it; the table in the middle under its lamp; open shelves and the clock on
   the right; the door to the hall behind you.
   At 2:00 you are at the table pouring water from a jug into a glass; your tea steams beside it; the radio on the sill
   is playing; your cat jumps off the far side of the table (world.js poses the jug, the stream, the cat and the steam).
   Posed by update(s, o), pure (o.rel: where your hands let go of things, room-local: world.js works it out).
     saBuildRoom(S) → R
   ===================================================================== */

// ---- canvases
function saTileCanvas(seed, w = 512, h = 512) {                    // the floor: terracotta tiles, 30 cm
  const r = new RNG(seed);
  return saCanvas(w, h, (g) => {
    g.fillStyle = '#8a6a55'; g.fillRect(0, 0, w, h);
    const s = 128;
    for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) {
      const k = r.range(-14, 12); g.fillStyle = `rgb(${176 + k},${104 + k * 0.7},${72 + k * 0.5})`; g.fillRect(x + 3, y + 3, s - 6, s - 6);
      for (let i = 0; i < 140; i++) { g.fillStyle = `rgba(${r.next() < 0.5 ? '255,220,190' : '70,30,15'},${r.range(0.03, 0.08)})`; g.fillRect(x + r.range(3, s - 6), y + r.range(3, s - 6), r.range(1, 4), r.range(1, 3)); }
      const gr = g.createLinearGradient(x, y, x + s, y + s); gr.addColorStop(0, 'rgba(255,255,255,0.05)'); gr.addColorStop(1, 'rgba(0,0,0,0.06)'); g.fillStyle = gr; g.fillRect(x + 3, y + 3, s - 6, s - 6);
    }
  });
}
function saPaintCanvas(seed, col, w = 256, h = 256) {
  return saCanvas(w, h, (g) => {
    g.fillStyle = col; g.fillRect(0, 0, w, h);
    const im = g.getImageData(0, 0, w, h), d = im.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const n = (hash2(x >> 1, (y >> 1) + seed) - 0.5) * 6 + (hash2(x >> 4, y >> 3) - 0.5) * 5, i = (y * w + x) * 4; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(im, 0, 0);
  });
}
function saSplashCanvas(w = 512, h = 256) {                         // white metro tiles (the splashback)
  const r = new RNG(5);
  return saCanvas(w, h, (g) => {
    g.fillStyle = '#b9b4aa'; g.fillRect(0, 0, w, h);
    const tw = 64, th = 32;
    for (let y = 0, row = 0; y < h; y += th, row++) for (let x = row % 2 ? -tw / 2 : 0; x < w; x += tw) {
      const k = r.range(-6, 6), gr = g.createLinearGradient(0, y, 0, y + th); gr.addColorStop(0, `rgb(${246 + k},${245 + k},${240 + k})`); gr.addColorStop(1, `rgb(${226 + k},${224 + k},${218 + k})`);
      g.fillStyle = gr; g.fillRect(x + 1.5, y + 1.5, tw - 3, th - 3);
    }
  });
}
function saClockFaceCanvas(w = 256) {
  return saCanvas(w, w, (g) => {
    g.fillStyle = '#f6f3ec'; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 2, 0, 6.28); g.fill();
    g.strokeStyle = '#1d1f22'; g.lineWidth = 10; g.stroke();
    for (let i = 0; i < 60; i++) { const a = i / 60 * 6.283, L = i % 5 ? 8 : 20, r0 = w / 2 - 16; g.lineWidth = i % 5 ? 2 : 5; g.beginPath(); g.moveTo(w / 2 + Math.sin(a) * r0, w / 2 - Math.cos(a) * r0); g.lineTo(w / 2 + Math.sin(a) * (r0 - L), w / 2 - Math.cos(a) * (r0 - L)); g.stroke(); }
  });
}
function saLabelCanvas(text, bg, fg, w = 128, h = 160) {
  return saCanvas(w, h, (c) => { c.fillStyle = bg; c.fillRect(0, 0, w, h); c.fillStyle = fg; c.font = '700 26px Arial'; c.textAlign = 'center'; c.fillText(text, w / 2, h * 0.55); c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(0, h * 0.7, w, 6); });
}

// the ceiling; the table's top (where things come to rest)
const SA_CEIL = SAP.ceil;
const saOverTable = (x, z) => { const T = SA_ROOM.table; return Math.abs(x - T.x) < T.w / 2 - 0.03 && Math.abs(z - T.z) < T.d / 2 - 0.03; };
const saRestY = (x, z) => (saOverTable(x, z) ? SA_ROOM.table.top : 0);

function saBuildRoom(S) {
  const scene = S.scene, R = { M: {}, ceil: [] }, tex = (c, rx, ry) => { const t = saTex(c); t.repeat.set(rx, ry); return t; };
  const M = R.M = {
    floor: saStd('#ffffff', 0.6, 0, { map: tex(saTileCanvas(13), 3.4, 2.7) }),
    wall: saStd('#ffffff', 0.92, 0, { map: tex(saPaintCanvas(3, '#ece4d4'), 3, 2) }),
    wallL: saStd('#ffffff', 0.92, 0, { map: tex(saPaintCanvas(5, '#e8dfcc'), 3, 2) }),
    ceil: saStd('#ffffff', 0.95, 0, { map: tex(saPaintCanvas(7, '#f5f3ee'), 4, 3) }),
    splash: saStd('#ffffff', 0.25, 0, { map: tex(saSplashCanvas(), 1.6, 0.9) }),
    skirt: saStd('#f1efe8', 0.5), frame: saStd('#f6f4ef', 0.45),
    glass: new THREE.MeshStandardMaterial({ color: '#2c3338', transparent: true, opacity: 0.22, roughness: 0.4, envMapIntensity: 0.4, depthWrite: false, side: THREE.DoubleSide }),
    rad: saStd('#f2f1ed', 0.4, 0.2), door: saStd('#f3f1eb', 0.5), handle: saStd('#b9b3a6', 0.3, 0.8),
    cab: saStd('#7e9483', 0.55), cabD: saStd('#6f8574', 0.6), top: saStd('#ffffff', 0.45, 0, { map: (() => { const t = saTex(saWoodCanvas(31, 256, 1024, [176, 128, 84])); t.rotation = Math.PI / 2; t.repeat.set(1, 3); return t; })() }),
    wood: saStd('#ffffff', 0.55, 0, { map: (() => { const t = saTex(saWoodCanvas(21, 256, 1024, [168, 120, 78])); t.rotation = Math.PI / 2; return t; })() }),
    woodD: saStd('#ffffff', 0.6, 0, { map: saTex(saWoodCanvas(23, 256, 1024, [120, 82, 52])) }),
    white: saStd('#f1efe9', 0.5), black: saStd('#141518', 0.35, 0.3), steel: saStd('#c9ccce', 0.28, 0.85), steelD: saStd('#8d9194', 0.35, 0.8),
    hob: saStd('#0d0e10', 0.12, 0.2), ring: saStd('#3a3c40', 0.3, 0.1),
    fridge: saStd('#e9e9e6', 0.3, 0.1),
    ceramic: saStd('#f3efe6', 0.25), ceramicB: saStd('#3f6f7a', 0.3), ceramicR: saStd('#b8533a', 0.35), terracotta: saStd('#b0603e', 0.8),
    leaf: saStd('#3f6b35', 0.85), leaf2: saStd('#557f3f', 0.85), soil: saStd('#3a2c22', 1),
    shade: saStd('#2f4a52', 0.5, 0.2, { side: THREE.DoubleSide }), shadeIn: saStd('#f2e9d6', 0.6, 0, { side: THREE.BackSide, emissive: new THREE.Color('#ffcf8a'), emissiveIntensity: 0.0 }),
    bulb: new THREE.MeshBasicMaterial({ color: '#fff1d0' }), flex: saStd('#1c1c1e', 0.6),
    cup: new THREE.MeshPhysicalMaterial({ color: '#dfeaee', transparent: true, opacity: 0.46, roughness: 0.04, envMapIntensity: 1.6, depthWrite: false, side: THREE.DoubleSide }),
    water: new THREE.MeshStandardMaterial({ color: '#9cc9e4', transparent: true, opacity: 0.6, roughness: 0.02, metalness: 0.15, envMapIntensity: 2.6, depthWrite: false, side: THREE.DoubleSide }),
    wet: new THREE.MeshStandardMaterial({ color: '#a4bccb', transparent: true, opacity: 0.72, roughness: 0.02, metalness: 0.2, envMapIntensity: 2.2, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }),
    tea: new THREE.MeshStandardMaterial({ color: '#9a5a1e', transparent: true, opacity: 0.8, roughness: 0.04, metalness: 0.05, envMapIntensity: 1.8, side: THREE.DoubleSide }),
    teaPool: new THREE.MeshStandardMaterial({ color: '#8a4e18', transparent: true, opacity: 0.74, roughness: 0.02, metalness: 0.1, envMapIntensity: 2.0, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }),
    shard: new THREE.MeshStandardMaterial({ color: '#f4fbff', transparent: true, opacity: 0.85, roughness: 0.02, metalness: 0.3, envMapIntensity: 2.4, side: THREE.DoubleSide, depthWrite: false }),
    clock: saStd('#ffffff', 0.5, 0, { map: saTex(saClockFaceCanvas(), { repeat: false }) }),
    grape: saStd('#6e8f2e', 0.28, 0.0, { envMapIntensity: 1.3 }), orange: saStd('#e88a22', 0.55), towel: saStd('#ffffff', 0.95, 0, { map: saTex(saCanvas(64, 64, (g, w, h) => { g.fillStyle = '#f2efe8'; g.fillRect(0, 0, w, h); g.fillStyle = '#b8322a'; for (let x = 0; x < w; x += 16) g.fillRect(x, 0, 5, h); for (let y = 0; y < h; y += 16) g.fillRect(0, y, w, 4); }), { repeat: false }), side: THREE.DoubleSide }),
    bread: saStd('#c88a48', 0.85), crumb: saStd('#d8a868', 0.9),
  };
  M.jars = ['#e8d9b0', '#c9a36a', '#7a5a3a', '#e8e4dc'].map((c) => saStd(c, 0.6));
  M.books = ['#7a2e2a', '#2f4a6b', '#d9c9a3', '#3c5a3c', '#b8862e', '#1f2a36'].map((c) => saStd(c, 0.8));

  const L = SA_ROOM, W = L.W / 2, D = L.D / 2, H = L.H;
  const room = new THREE.Group(); room.name = 'room'; room.position.set(...L.origin); scene.add(room); R.room = room;
  room.updateMatrixWorld(true);
  R.toWorld = (x, y, z, out) => (out || new THREE.Vector3()).set(x, y, z).applyMatrix4(room.matrixWorld);
  R.toLocal = (v, out) => (out || new THREE.Vector3()).copy(v).applyMatrix4(new THREE.Matrix4().copy(room.matrixWorld).invert());
  const T = 0.25;
  // ---- floor, ceiling, walls (south: the window; north: the door)
  saBox(L.W, 0.2, L.D, M.floor, 0, -0.1, 0, room);
  saBox(L.W + 0.5, 0.25, L.D + 0.5, M.ceil, 0, H + 0.125, 0, room);
  saBox(T, H, L.D + 0.5, M.wallL, -W - T / 2, H / 2, 0, room);
  saBox(T, H, L.D + 0.5, M.wall, W + T / 2, H / 2, 0, room);
  const wi = L.win;
  for (const c of saWallCells(-W - T, W + T, 0, H, [[wi.x[0], wi.x[1], wi.y[0], wi.y[1]]])) saBox(c[1] - c[0], c[3] - c[2], T, M.wall, (c[0] + c[1]) / 2, (c[2] + c[3]) / 2, -D - T / 2, room);
  const dr = L.door;
  for (const c of saWallCells(-W - T, W + T, 0, H, [[dr.x[0], dr.x[1], 0, dr.h]])) saBox(c[1] - c[0], c[3] - c[2], T, M.wall, (c[0] + c[1]) / 2, (c[2] + c[3]) / 2, D + T / 2, room);
  { const dd = saBox(dr.x[1] - dr.x[0] - 0.02, dr.h - 0.01, 0.04, M.door, (dr.x[0] + dr.x[1]) / 2, dr.h / 2, D + 0.06, room); saBox(0.12, 0.03, 0.05, M.handle, dr.x[0] + 0.12, 1.02, D + 0.02, room); dd.castShadow = true; }
  for (const [a, b] of [[dr.x[0] - 0.05, dr.x[0]], [dr.x[1], dr.x[1] + 0.05]]) saBox(b - a, dr.h + 0.05, 0.06, M.frame, (a + b) / 2, dr.h / 2, D - 0.02, room);
  saBox(dr.x[1] - dr.x[0] + 0.1, 0.05, 0.06, M.frame, (dr.x[0] + dr.x[1]) / 2, dr.h + 0.025, D - 0.02, room);
  for (const [x, z, w, d] of [[0.3, -D + 0.01, L.W - 1, 0.02], [W - 0.01, 0, 0.02, L.D]]) saBox(w, 0.1, d, M.skirt, x, 0.05, z, room);
  // ---- the window: the left pane fixed, the right one a casement hinged on its right (it opens outwards, for the apple)
  { const z = -D - 0.12, x0 = wi.x[0], x1 = wi.x[1], sp = wi.split, y0 = wi.y[0], y1 = wi.y[1], cy = (y0 + y1) / 2, hh = y1 - y0;
    for (const [bx, by, bw, bh] of [[(x0 + x1) / 2, y1 - 0.03, x1 - x0, 0.06], [(x0 + x1) / 2, y0 + 0.03, x1 - x0, 0.06], [x0 + 0.03, cy, 0.06, hh], [x1 - 0.03, cy, 0.06, hh], [sp, cy, 0.06, hh]]) saBox(bw, bh, 0.08, M.frame, bx, by, z, room);
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(sp - x0 - 0.09, hh - 0.1), M.glass); gl.position.set((x0 + sp) / 2, cy, z); gl.renderOrder = 4; room.add(gl);
    // the casement: hinged at x1 (outer face of the wall), its sash and glass
    const cs = new THREE.Group(); cs.position.set(x1 - 0.06, cy, -D - 0.2); room.add(cs); R.casement = cs;
    const w = x1 - 0.06 - (sp + 0.03);
    for (const [bx, by, bw, bh] of [[-w / 2, hh / 2 - 0.1, w, 0.05], [-w / 2, -hh / 2 + 0.1, w, 0.05], [-0.025, 0, 0.05, hh - 0.15], [-w + 0.025, 0, 0.05, hh - 0.15]]) saBox(bw, bh, 0.05, M.frame, bx, by, 0, cs);
    const g2 = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.08, hh - 0.25), M.glass); g2.position.set(-w / 2, 0, 0); g2.renderOrder = 4; cs.add(g2);
    saBox(0.025, 0.12, 0.03, M.handle, -w + 0.05, 0, 0.04, cs);
    const sl = L.sill; saBox(sl.x[1] - sl.x[0], sl.y[1] - sl.y[0], sl.z[1] - sl.z[0], M.frame, (sl.x[0] + sl.x[1]) / 2, (sl.y[0] + sl.y[1]) / 2, (sl.z[0] + sl.z[1]) / 2, room);
    const rd = L.rad, rx = (rd.x[0] + rd.x[1]) / 2, rw = rd.x[1] - rd.x[0];
    for (let i = 0; i < 16; i++) saBox(0.05, rd.y[1] - rd.y[0], 0.06, M.rad, rd.x[0] + 0.05 + i * (rw - 0.1) / 15, (rd.y[0] + rd.y[1]) / 2, -D + 0.05, room);
    saBox(rw, 0.03, 0.08, M.rad, rx, rd.y[1] - 0.015, -D + 0.05, room); saBox(rw, 0.03, 0.08, M.rad, rx, rd.y[0] + 0.015, -D + 0.05, room);
    // on the sill: a basil pot, a little cactus
    saCyl(0.07, 0.055, 0.12, M.terracotta, -0.7, 0.86 + 0.06, -1.94, room, 14);
    for (let k = 0; k < 7; k++) { const a = k * 0.9; saMesh(new THREE.SphereGeometry(0.035, 8, 6).scale(1.3, 0.5, 0.9), k % 2 ? M.leaf : M.leaf2, -0.7 + Math.cos(a) * 0.04, 1.0 + 0.03 * (k % 3), -1.94 + Math.sin(a) * 0.04, room); }
    saCyl(0.04, 0.035, 0.07, M.ceramicB, 1.15, 0.86 + 0.035, -1.94, room, 12); saMesh(new THREE.SphereGeometry(0.03, 10, 8).scale(1, 1.6, 1), M.leaf, 1.15, 0.96, -1.94, room);
  }
  // ---- the counter run along the left wall: base units (sage doors), the oak worktop, the sink, the hob; the splashback
  { const C = L.counter, x0 = C.x[0], x1 = C.x[1], dz = C.z[1] - C.z[0], cz = (C.z[0] + C.z[1]) / 2;
    saBox(x1 - x0 - 0.06, 0.1, dz, M.black, (x0 + x1) / 2 - 0.03, 0.05, cz, room);                 // plinth
    saBox(x1 - x0 - 0.02, C.top - 0.14, dz, M.cab, (x0 + x1) / 2 - 0.01, 0.1 + (C.top - 0.14) / 2, cz, room);
    const nD = 5; for (let i = 0; i < nD; i++) { const z0 = C.z[0] + i * dz / nD, z1 = z0 + dz / nD;
      saMesh(saRoundBox(0.02, C.top - 0.2, z1 - z0 - 0.008, 0.004, 0.003), M.cabD, x1 + 0.0, 0.12, (z0 + z1) / 2, room);
      saBox(0.025, 0.012, 0.16, M.steel, x1 + 0.025, C.top - 0.18, (z0 + z1) / 2, room); }
    saBox(x1 - x0 + 0.03, 0.04, dz + 0.02, M.top, (x0 + x1) / 2 + 0.015, C.top - 0.02, cz, room);
    // the splashback (tiles) up to the wall cupboards
    const sb = new THREE.Mesh(new THREE.PlaneGeometry(dz, 0.58), M.splash); sb.position.set(-W + 0.004, C.top + 0.29, cz); sb.rotation.y = Math.PI / 2; sb.receiveShadow = true; room.add(sb);
    // the sink (a steel basin set in the top) and its tap
    const sk = L.sink; saBox(0.42, 0.005, sk.w, M.steelD, -2.2, C.top + 0.001, sk.z, room); saBox(0.36, 0.004, sk.w - 0.08, saStd('#4a4e52', 0.3, 0.8), -2.2, C.top + 0.004, sk.z, room);
    { const tp = saCyl(0.015, 0.018, 0.28, M.steel, -2.42, C.top + 0.14, sk.z, room, 12); void tp; const sp = saCyl(0.012, 0.012, 0.2, M.steel, -2.33, C.top + 0.28, sk.z, room, 10); sp.rotation.z = Math.PI / 2; }
    // the hob: black glass, four rings
    saBox(0.52, 0.006, 0.56, M.hob, -2.2, C.top + 0.003, L.hob.z, room);
    for (const [dx, dz2, r] of [[-0.12, -0.13, 0.09], [-0.12, 0.13, 0.07], [0.12, -0.13, 0.07], [0.12, 0.13, 0.09]]) { const rg = new THREE.Mesh(new THREE.RingGeometry(r - 0.006, r, 32), M.ring); rg.rotation.x = -Math.PI / 2; rg.position.set(-2.2 + dx, C.top + 0.0075, L.hob.z + dz2); room.add(rg); }
    // the kettle's base, a knife block, the bread board, a fruit bowl by the window
    saCyl(0.09, 0.095, 0.02, M.black, ...[L.kettle[0], C.top + 0.01, L.kettle[2]], room, 24);
    { const kb = saBox(0.1, 0.22, 0.12, M.woodD, -2.38, C.top + 0.11, 0.05, room); kb.rotation.x = -0.15; for (let k = 0; k < 4; k++) saBox(0.016, 0.08, 0.012, M.black, -2.38, C.top + 0.25, 0.01 + k * 0.026, room); }
    saBox(0.3, 0.02, 0.42, M.wood, -2.22, C.top + 0.01, 0.95, room);
    { const fb = saCyl(0.13, 0.08, 0.07, M.ceramicR, -2.25, C.top + 0.035, -1.62, room, 20); void fb; for (const [dx, dz2, c] of [[0.03, 0.02, M.orange], [-0.04, -0.02, saStd('#c8321e', 0.45)], [0.0, 0.05, saStd('#e2c43a', 0.5)]]) saMesh(new THREE.SphereGeometry(0.04, 12, 9), c, -2.25 + dx, C.top + 0.1, -1.62 + dz2, room); }
    // the wall cupboards (with a light strip under them)
    const wc = L.wallCab, wz = (wc.z[0] + wc.z[1]) / 2, wd = wc.z[1] - wc.z[0];
    saBox(wc.x[1] - wc.x[0], wc.y[1] - wc.y[0], wd, M.cab, (wc.x[0] + wc.x[1]) / 2, (wc.y[0] + wc.y[1]) / 2, wz, room);
    for (let i = 0; i < 4; i++) { const z0 = wc.z[0] + i * wd / 4; saMesh(saRoundBox(0.02, wc.y[1] - wc.y[0] - 0.02, wd / 4 - 0.008, 0.004, 0.003), M.cabD, wc.x[1], wc.y[0] + 0.01, z0 + wd / 8, room); saBox(0.025, 0.14, 0.012, M.steel, wc.x[1] + 0.025, wc.y[0] + 0.12, z0 + wd / 8 + (i % 2 ? -1 : 1) * (wd / 8 - 0.06), room); }
    saBox(0.02, 0.01, wd - 0.1, new THREE.MeshBasicMaterial({ color: '#fff3dc' }), wc.x[1] - 0.06, wc.y[0] - 0.006, wz, room);
    const ul = new THREE.RectAreaLight ? null : null; void ul;
  }
  // ---- the fridge
  { const F = L.fridge, cx = (F.x[0] + F.x[1]) / 2, cz = (F.z[0] + F.z[1]) / 2;
    saMesh(saRoundBox(F.x[1] - F.x[0], F.h, F.z[1] - F.z[0], 0.03, 0.02), M.fridge, cx, 0, cz, room);
    saBox(0.004, 0.006, F.z[1] - F.z[0] - 0.04, M.steelD, F.x[1] + 0.001, 1.2, cz, room);
    saBox(0.03, 0.4, 0.025, M.steel, F.x[1] + 0.02, 1.45, F.z[0] + 0.08, room); saBox(0.03, 0.3, 0.025, M.steel, F.x[1] + 0.02, 0.92, F.z[0] + 0.08, room);
    // magnets and a child's drawing
    const dw = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.29), saStd('#ffffff', 0.9, 0, { map: saTex(saCanvas(128, 176, (g, w, h) => { g.fillStyle = '#fbf8f0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2a6ac8'; g.lineWidth = 5; g.beginPath(); g.arc(64, 60, 30, 0, 6.28); g.stroke(); g.fillStyle = '#e8b42a'; g.beginPath(); g.arc(98, 28, 16, 0, 6.28); g.fill(); g.strokeStyle = '#3a8a3a'; g.beginPath(); g.moveTo(10, 150); g.lineTo(118, 150); g.stroke(); g.strokeStyle = '#c8321e'; g.beginPath(); g.moveTo(64, 90); g.lineTo(64, 140); g.moveTo(40, 110); g.lineTo(88, 110); g.stroke(); }), { repeat: false }) }));
    dw.position.set(F.x[1] + 0.003, 1.5, cz + 0.12); dw.rotation.y = Math.PI / 2; room.add(dw);
  }
  // ---- the table, its chairs
  { const tb = L.table, t = tb.top;
    saMesh(saRoundBox(tb.w, 0.04, tb.d, 0.015, 0.008), M.wood, tb.x, t - 0.04, tb.z, room);
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) saBox(0.05, t - 0.04, 0.05, M.woodD, tb.x + dx * (tb.w / 2 - 0.08), (t - 0.04) / 2, tb.z + dz * (tb.d / 2 - 0.08), room);
    // a runner and a jug of flowers at the far end
    saBox(0.36, 0.003, tb.d - 0.1, saStd('#c9b99a', 0.95), tb.x - 0.45, t + 0.0015, tb.z, room);
    saCyl(0.045, 0.055, 0.16, M.ceramicB, tb.x - 0.45, t + 0.08, tb.z - 0.1, room, 14);
    for (let k = 0; k < 6; k++) { const a = k * 1.05; saMesh(new THREE.SphereGeometry(0.025, 8, 6), saStd(k % 2 ? '#e8c24a' : '#f2efe6', 0.7), tb.x - 0.45 + Math.cos(a) * 0.05, t + 0.25 + 0.03 * (k % 2), tb.z - 0.1 + Math.sin(a) * 0.05, room); }
    // your mug of tea, a bowl of grapes
    saCyl(0.11, 0.05, 0.06, M.ceramic, tb.x + 0.35, t + 0.03, tb.z + 0.05, room, 20);
    for (let k = 0; k < 9; k++) saMesh(new THREE.SphereGeometry(0.012, 10, 8).scale(1, 1.15, 1), M.grape, tb.x + 0.35 + 0.035 * Math.cos(k * 2.4) * (k % 3 ? 1 : 0.4), t + 0.06 + 0.012 * (k % 3), tb.z + 0.05 + 0.035 * Math.sin(k * 2.4) * (k % 3 ? 1 : 0.4), room);
    const chair = (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; room.add(g);
      saMesh(saRoundBox(0.42, 0.035, 0.42, 0.02, 0.01), M.wood, 0, 0.44, 0, g);
      for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) saBox(0.035, 0.44, 0.035, M.woodD, dx * 0.18, 0.22, dz * 0.18, g);
      for (const dx of [-1, 1]) saBox(0.035, 0.45, 0.035, M.woodD, dx * 0.18, 0.69, 0.19, g);
      for (const y of [0.72, 0.86]) saBox(0.38, 0.05, 0.025, M.wood, 0, y, 0.19, g); };
    chair(tb.x - 0.35, tb.z + 0.62, 0); chair(tb.x + 0.35, tb.z - 0.62, Math.PI); chair(tb.x - 0.35, tb.z - 0.62, Math.PI); chair(tb.x + 0.98, tb.z, -Math.PI / 2);
  }
  // ---- the lamp over the table: a ceiling rose, the flex, a dome shade
  { const lp = L.lamp, g = new THREE.Group(); g.position.set(lp.x, H, lp.z); room.add(g); R.lamp = g;
    saCyl(0.05, 0.05, 0.03, M.white, 0, -0.015, 0, g, 18);
    saCyl(0.004, 0.004, lp.cord, M.flex, 0, -lp.cord / 2, 0, g, 6);
    const pts = []; for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI / 2; pts.push(new THREE.Vector2(0.03 + 0.2 * Math.sin(a), -0.17 * (1 - Math.cos(a)) * 0 - 0.17 * Math.sin(a) * 0 + 0.17 * Math.cos(a) - 0.17)); }
    const sh = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), M.shade); sh.position.y = -lp.cord; sh.castShadow = true; g.add(sh);
    const shi = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), M.shadeIn); shi.position.y = -lp.cord - 0.002; shi.scale.setScalar(0.985); g.add(shi);
    saMesh(new THREE.SphereGeometry(0.035, 12, 8), M.bulb, 0, -lp.cord - 0.1, 0, g);
  }
  // ---- the open shelves on the right wall: jars, plates, bowls, cookbooks, a trailing plant; the clock by the door
  { const sh = L.shelves, z0 = sh.z[0], z1 = sh.z[1], zc = (z0 + z1) / 2, x = W - 0.13;
    for (const y of sh.y) { saBox(0.26, 0.03, z1 - z0, M.wood, x, y, zc, room); for (const z of [z0 + 0.1, z1 - 0.1]) saBox(0.03, 0.12, 0.03, M.black, W - 0.03, y - 0.07, z, room); }
    const r = new RNG(41);
    // shelf 1: jars
    for (let k = 0; k < 5; k++) { const z = z0 + 0.22 + k * 0.33, h = r.range(0.12, 0.2); saCyl(0.05, 0.05, h, M.cup, x, sh.y[0] + 0.015 + h / 2, z, room, 14); saCyl(0.046, 0.046, h * 0.7, M.jars[k % 4], x, sh.y[0] + 0.015 + h * 0.35, z, room, 12); saCyl(0.052, 0.052, 0.02, M.woodD, x, sh.y[0] + 0.025 + h, z, room, 14); }
    // shelf 2: plates on edge, bowls
    for (let k = 0; k < 6; k++) { const p = saCyl(0.11, 0.11, 0.012, k % 2 ? M.ceramic : M.ceramicB, x + 0.02, sh.y[1] + 0.12, z0 + 0.2 + k * 0.03, room, 24); p.rotation.x = Math.PI / 2 - 0.12; }
    for (let k = 0; k < 3; k++) saCyl(0.07, 0.045, 0.06 - k * 0.008, M.ceramicR, x, sh.y[1] + 0.045 + k * 0.03, z0 + 0.95, room, 18);
    for (let k = 0; k < 5; k++) saBox(0.17, 0.22 + 0.02 * (k % 2), 0.035, M.books[k % 6], x, sh.y[1] + 0.13, z0 + 1.45 + k * 0.04, room);
    // shelf 3: a trailing plant, a teapot
    saCyl(0.08, 0.06, 0.12, M.terracotta, x, sh.y[2] + 0.075, z0 + 0.4, room, 14);
    for (let k = 0; k < 14; k++) { const a = r.range(0, 6.28), dd = r.range(0.02, 0.12); const lf = saMesh(new THREE.SphereGeometry(0.03, 8, 6).scale(1.4, 0.4, 0.9), k % 2 ? M.leaf : M.leaf2, x + Math.cos(a) * dd * 0.6, sh.y[2] + 0.15 - k * 0.025 * (k % 3 === 0 ? 1 : 0.2), z0 + 0.4 + Math.sin(a) * dd, room); lf.rotation.set(r.range(-1, 1), a, r.range(-0.6, 0.6)); }
    saMesh(new THREE.SphereGeometry(0.08, 18, 12).scale(1, 0.8, 1), M.ceramic, x, sh.y[2] + 0.08, z0 + 1.3, room);
  }
  // the clock on the right wall, near the door (it shows the time: 3 PM and the minutes going by)
  { const ck = L.clock, g = new THREE.Group(); g.position.set(ck.x, ck.y, ck.z); g.rotation.y = -Math.PI / 2; room.add(g);
    const f = saCyl(0.15, 0.15, 0.035, M.black, 0, 0, -0.0175, g, 32); f.rotation.x = Math.PI / 2;
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.137, 32), M.clock); face.position.z = 0.001; g.add(face);
    R.hands = [0.085, 0.115, 0.125].map((l, i) => { const h = new THREE.Group(); h.position.z = 0.004 + i * 0.002; g.add(h); saBox([0.01, 0.007, 0.003][i], l, 0.003, i === 2 ? saStd('#b8322a', 0.5) : M.black, 0, l / 2 - 0.015, 0, h); return h; }); }
  // the cat's bowl by the fridge
  { const pts = []; for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2; pts.push(new THREE.Vector2(0.075 + 0.025 * Math.sin(a), 0.05 * (1 - Math.cos(a)))); }
    saMesh(new THREE.LatheGeometry([new THREE.Vector2(0, 0.004), new THREE.Vector2(0.06, 0.004), ...pts], 24), saStd('#c95a3a', 0.35), -1.55, 0, 1.55, room).material.side = THREE.DoubleSide; }

  // ==================================================================== WHAT YOU ARE DOING AT 2:00
  // ---- the glass on the table (you are filling it from the jug): a tumbler 12 cm tall; the water in it rises
  { const g = new THREE.Group(); room.add(g); R.glassG = g; const G = SA_GLASS;
    g.position.set(G.at[0], G.at[1], G.at[2]);
    const pts = [new THREE.Vector2(0.0, 0), new THREE.Vector2(0.03, 0), new THREE.Vector2(0.032, 0.008), new THREE.Vector2(0.036, 0.12), new THREE.Vector2(0.034, 0.12), new THREE.Vector2(0.03, 0.012), new THREE.Vector2(0.0, 0.012)];
    const gm = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), M.cup); gm.renderOrder = 6; g.add(gm);
    const wm = new THREE.Mesh(new THREE.CylinderGeometry(0.0315, 0.0285, 1, 24).translate(0, 0.5, 0), M.water); wm.position.y = 0.012; wm.renderOrder = 5; g.add(wm); R.glassWater = wm; }
  // ---- the water stream from the jug's lip (a tube rebuilt each frame along its path) and the drops round it
  { const m = new THREE.Mesh(new THREE.BufferGeometry(), M.water); m.visible = false; m.frustumCulled = false; m.renderOrder = 5; room.add(m); R.stream = m;
    const m2 = new THREE.Mesh(new THREE.BufferGeometry(), M.water); m2.visible = false; m2.frustumCulled = false; m2.renderOrder = 5; room.add(m2); R.stream2 = m2; }
  // ---- the radio on the sill (playing at 2:00; its speaker can't move the air for three seconds)
  { const g = new THREE.Group(); g.position.set(SA_RADIO[0], SA_RADIO[1], SA_RADIO[2]); g.rotation.y = 0.25; room.add(g); R.radio = g;
    const body = saStd('#c8a46a', 0.5), grill = saStd('#3a3330', 0.8), knob = saStd('#e8e2d4', 0.4, 0.3);
    saMesh(saRoundBox(0.22, 0.13, 0.08, 0.02, 0.012), body, 0, 0, 0, g);
    const gr = saCanvas(128, 96, (x, w, h) => { x.fillStyle = '#3a3330'; x.fillRect(0, 0, w, h); x.fillStyle = '#5a504a'; for (let yy = 4; yy < h; yy += 8) for (let xx = 4 + (yy % 16 ? 4 : 0); xx < w; xx += 8) { x.beginPath(); x.arc(xx, yy, 2.2, 0, 6.283); x.fill(); } });
    const gp = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.09), saStd('#ffffff', 0.85, 0, { map: saTex(gr, { repeat: false }) })); gp.position.set(-0.035, 0.065, 0.0405); g.add(gp);
    for (const yy of [0.04, 0.09]) { const k = saCyl(0.012, 0.012, 0.012, knob, 0.07, yy, 0.044, g, 12); k.rotation.x = Math.PI / 2; }
    const ant = saCyl(0.0025, 0.0025, 0.24, M.steel, 0.08, 0.24, -0.02, g, 6); ant.rotation.z = -0.35;
    const lit = new THREE.Mesh(new THREE.PlaneGeometry(0.035, 0.012), new THREE.MeshBasicMaterial({ color: '#ffcf8a' })); lit.position.set(0.07, 0.115, 0.041); g.add(lit); }
  // ---- the jug you are pouring from (white, a blue band): its base at the origin, the lip along +x, the handle at −x
  { const g = new THREE.Group(); room.add(g); R.jug = g; const m = saStd('#f1ede4', 0.3), band = saStd('#3f6f9a', 0.35);
    const pts = [[0, 0], [0.05, 0], [0.056, 0.01], [0.06, 0.06], [0.058, 0.13], [0.05, 0.18], [0.052, 0.2], [0.048, 0.2], [0.046, 0.182], [0.054, 0.13], [0.056, 0.06], [0.05, 0.012], [0, 0.012]].map(([x, y]) => new THREE.Vector2(x, y));
    const b = saMesh(new THREE.LatheGeometry(pts, 32), m, 0, 0, 0, g); b.material.side = THREE.DoubleSide;
    const bd = saMesh(new THREE.CylinderGeometry(0.0605, 0.0605, 0.022, 32, 1, true), band, 0, 0.1, 0, g); bd.material.side = THREE.DoubleSide;
    const lip = saMesh(new THREE.ConeGeometry(0.022, 0.04, 12, 1, true).rotateZ(-Math.PI / 2), m, 0.058, 0.19, 0, g); lip.scale.set(1, 0.55, 1); lip.material.side = THREE.DoubleSide;
    const h = saMesh(new THREE.TorusGeometry(0.05, 0.011, 8, 18, Math.PI * 1.1), m, -0.062, 0.11, 0, g); h.rotation.z = Math.PI / 2 + 0.15;
    const wtr = saMesh(new THREE.CircleGeometry(0.05, 24), M.water, 0, 0.15, 0, g); wtr.rotation.x = -Math.PI / 2; R.jugWater = wtr; }
  // ---- your mug of tea (steaming) by the glass
  { const g = new THREE.Group(); room.add(g); g.position.set(SA_MUG[0], SA_MUG[1], SA_MUG[2]); g.rotation.y = 2.2; R.mug = g; const m = saStd('#c8553a', 0.35);
    const pts = [[0, 0.002], [0.036, 0.002], [0.04, 0.008], [0.042, 0.095], [0.039, 0.095], [0.036, 0.012], [0, 0.012]].map(([x, y]) => new THREE.Vector2(x, y));
    const b = saMesh(new THREE.LatheGeometry(pts, 28), m, 0, 0, 0, g); b.material.side = THREE.DoubleSide;
    const hd = saMesh(new THREE.TorusGeometry(0.026, 0.006, 8, 16, Math.PI * 1.2), m, 0.04, 0.05, 0, g); hd.rotation.z = -Math.PI * 0.6;
    const tea = saMesh(new THREE.CircleGeometry(0.037, 20), M.tea, 0, 0.08, 0, g); tea.rotation.x = -Math.PI / 2; }
  R.update = (s, o) => saRoomUpdate(R, s, o || {});
  return R;
}

function saRoomUpdate(R, s, o) {
  // ---- the clock on the wall: its second hand sticks in the air for three seconds (its motor keeps pushing), so after
  // 2:00:03 it runs three seconds slow
  { const c = saClockParts(s), cs = saClockParts(s < 0 ? s : s < SAP.T ? 0 : s - SAP.T);
    R.hands[0].rotation.z = -((c.h % 12) + c.m / 60) / 12 * Math.PI * 2; R.hands[1].rotation.z = -(c.m + c.sec / 60) / 60 * Math.PI * 2;
    R.hands[2].rotation.z = -cs.sec / 60 * Math.PI * 2 - (saLocked(s) ? 0.012 * Math.sin(s * 900) * 0 : 0); }
  R.casement.rotation.y = 0;
  // ---- the glass's water: it rises while you pour (held still for the three seconds)
  { const lv = saGlassLevel(s); R.glassWater.scale.set(1, Math.max(0.001, lv), 1); R.glassWater.visible = lv > 0.002; }
  R.room.updateMatrixWorld(true);
}
