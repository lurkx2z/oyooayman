/* =====================================================================
   ROOM — your kitchen on the top (fifth) floor (layout.js: SO_ROOM). Its window looks south over the street and the
   park; the afternoon sun comes in at it. The counter runs along the left wall (the sink, the kettle, the hob), the
   fridge at its far end, wall cupboards over it; the table in the middle under its lamp; open shelves and the clock on
   the right; the door to the hall behind you.
   What falls up in here (story time s, physics.js soHop: no drag over a metre or two):
     3:00:00  the glass of water (out of your hand): mouth first into the ceiling; the water splashes, the glass breaks
     3:00:17  the spoon and the grape, let go together: they land together
     3:00:42  the tea (out of the kettle's spout): a stream that curves up and pools on the ceiling
     3:01:10  the cat (animals.js), off the counter: it rights itself and lands on its feet on the ceiling
     by 3:08  the ceiling over the table is full: what was dropped in the minutes we don't see
     3:10:00  everything up there comes down at once (soDropBack): onto the table, or the floor
   Posed by update(s, o), pure (o.rel: where your hands let go of things, room-local: world.js works it out).
     soBuildRoom(S) → R
   ===================================================================== */

// ---- canvases
function soTileCanvas(seed, w = 512, h = 512) {                    // the floor: terracotta tiles, 30 cm
  const r = new RNG(seed);
  return soCanvas(w, h, (g) => {
    g.fillStyle = '#8a6a55'; g.fillRect(0, 0, w, h);
    const s = 128;
    for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) {
      const k = r.range(-14, 12); g.fillStyle = `rgb(${176 + k},${104 + k * 0.7},${72 + k * 0.5})`; g.fillRect(x + 3, y + 3, s - 6, s - 6);
      for (let i = 0; i < 140; i++) { g.fillStyle = `rgba(${r.next() < 0.5 ? '255,220,190' : '70,30,15'},${r.range(0.03, 0.08)})`; g.fillRect(x + r.range(3, s - 6), y + r.range(3, s - 6), r.range(1, 4), r.range(1, 3)); }
      const gr = g.createLinearGradient(x, y, x + s, y + s); gr.addColorStop(0, 'rgba(255,255,255,0.05)'); gr.addColorStop(1, 'rgba(0,0,0,0.06)'); g.fillStyle = gr; g.fillRect(x + 3, y + 3, s - 6, s - 6);
    }
  });
}
function soPaintCanvas(seed, col, w = 256, h = 256) {
  return soCanvas(w, h, (g) => {
    g.fillStyle = col; g.fillRect(0, 0, w, h);
    const im = g.getImageData(0, 0, w, h), d = im.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const n = (hash2(x >> 1, (y >> 1) + seed) - 0.5) * 6 + (hash2(x >> 4, y >> 3) - 0.5) * 5, i = (y * w + x) * 4; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(im, 0, 0);
  });
}
function soSplashCanvas(w = 512, h = 256) {                         // white metro tiles (the splashback)
  const r = new RNG(5);
  return soCanvas(w, h, (g) => {
    g.fillStyle = '#b9b4aa'; g.fillRect(0, 0, w, h);
    const tw = 64, th = 32;
    for (let y = 0, row = 0; y < h; y += th, row++) for (let x = row % 2 ? -tw / 2 : 0; x < w; x += tw) {
      const k = r.range(-6, 6), gr = g.createLinearGradient(0, y, 0, y + th); gr.addColorStop(0, `rgb(${246 + k},${245 + k},${240 + k})`); gr.addColorStop(1, `rgb(${226 + k},${224 + k},${218 + k})`);
      g.fillStyle = gr; g.fillRect(x + 1.5, y + 1.5, tw - 3, th - 3);
    }
  });
}
function soClockFaceCanvas(w = 256) {
  return soCanvas(w, w, (g) => {
    g.fillStyle = '#f6f3ec'; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 2, 0, 6.28); g.fill();
    g.strokeStyle = '#1d1f22'; g.lineWidth = 10; g.stroke();
    for (let i = 0; i < 60; i++) { const a = i / 60 * 6.283, L = i % 5 ? 8 : 20, r0 = w / 2 - 16; g.lineWidth = i % 5 ? 2 : 5; g.beginPath(); g.moveTo(w / 2 + Math.sin(a) * r0, w / 2 - Math.cos(a) * r0); g.lineTo(w / 2 + Math.sin(a) * (r0 - L), w / 2 - Math.cos(a) * (r0 - L)); g.stroke(); }
  });
}
function soLabelCanvas(text, bg, fg, w = 128, h = 160) {
  return soCanvas(w, h, (c) => { c.fillStyle = bg; c.fillRect(0, 0, w, h); c.fillStyle = fg; c.font = '700 26px Arial'; c.textAlign = 'center'; c.fillText(text, w / 2, h * 0.55); c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(0, h * 0.7, w, 6); });
}

// a glass shard (a thin irregular triangle), a seeded one per i
function soShardGeo(i) {
  const a = 0.018 + 0.045 * soR(i, 3), b = 0.015 + 0.035 * soR(i, 4), c = soR(i, 5) * 2 - 1;
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-a, 0, -b * 0.4, a * (0.3 + 0.6 * c), 0, -b, a * 0.6, 0, b], 3)); g.computeVertexNormals(); return g;
}

function soBuildRoom(S) {
  const scene = S.scene, R = { M: {}, ceil: [] }, tex = (c, rx, ry) => { const t = soTex(c); t.repeat.set(rx, ry); return t; };
  const M = R.M = {
    floor: soStd('#ffffff', 0.6, 0, { map: tex(soTileCanvas(13), 3.4, 2.7) }),
    wall: soStd('#ffffff', 0.92, 0, { map: tex(soPaintCanvas(3, '#ece4d4'), 3, 2) }),
    wallL: soStd('#ffffff', 0.92, 0, { map: tex(soPaintCanvas(5, '#e8dfcc'), 3, 2) }),
    ceil: soStd('#ffffff', 0.95, 0, { map: tex(soPaintCanvas(7, '#f5f3ee'), 4, 3) }),
    splash: soStd('#ffffff', 0.25, 0, { map: tex(soSplashCanvas(), 1.6, 0.9) }),
    skirt: soStd('#f1efe8', 0.5), frame: soStd('#f6f4ef', 0.45),
    glass: new THREE.MeshStandardMaterial({ color: '#2c3338', transparent: true, opacity: 0.22, roughness: 0.4, envMapIntensity: 0.4, depthWrite: false, side: THREE.DoubleSide }),
    rad: soStd('#f2f1ed', 0.4, 0.2), door: soStd('#f3f1eb', 0.5), handle: soStd('#b9b3a6', 0.3, 0.8),
    cab: soStd('#7e9483', 0.55), cabD: soStd('#6f8574', 0.6), top: soStd('#ffffff', 0.45, 0, { map: (() => { const t = soTex(soWoodCanvas(31, 256, 1024, [176, 128, 84])); t.rotation = Math.PI / 2; t.repeat.set(1, 3); return t; })() }),
    wood: soStd('#ffffff', 0.55, 0, { map: (() => { const t = soTex(soWoodCanvas(21, 256, 1024, [168, 120, 78])); t.rotation = Math.PI / 2; return t; })() }),
    woodD: soStd('#ffffff', 0.6, 0, { map: soTex(soWoodCanvas(23, 256, 1024, [120, 82, 52])) }),
    white: soStd('#f1efe9', 0.5), black: soStd('#141518', 0.35, 0.3), steel: soStd('#c9ccce', 0.28, 0.85), steelD: soStd('#8d9194', 0.35, 0.8),
    hob: soStd('#0d0e10', 0.12, 0.2), ring: soStd('#3a3c40', 0.3, 0.1),
    fridge: soStd('#e9e9e6', 0.3, 0.1),
    ceramic: soStd('#f3efe6', 0.25), ceramicB: soStd('#3f6f7a', 0.3), ceramicR: soStd('#b8533a', 0.35), terracotta: soStd('#b0603e', 0.8),
    leaf: soStd('#3f6b35', 0.85), leaf2: soStd('#557f3f', 0.85), soil: soStd('#3a2c22', 1),
    shade: soStd('#2f4a52', 0.5, 0.2, { side: THREE.DoubleSide }), shadeIn: soStd('#f2e9d6', 0.6, 0, { side: THREE.BackSide, emissive: new THREE.Color('#ffcf8a'), emissiveIntensity: 0.0 }),
    bulb: new THREE.MeshBasicMaterial({ color: '#fff1d0' }), flex: soStd('#1c1c1e', 0.6),
    cup: new THREE.MeshPhysicalMaterial({ color: '#dfeaee', transparent: true, opacity: 0.46, roughness: 0.04, envMapIntensity: 1.6, depthWrite: false, side: THREE.DoubleSide }),
    water: new THREE.MeshStandardMaterial({ color: '#9cc9e4', transparent: true, opacity: 0.6, roughness: 0.02, metalness: 0.15, envMapIntensity: 2.6, depthWrite: false, side: THREE.DoubleSide }),
    wet: new THREE.MeshStandardMaterial({ color: '#3a3026', transparent: true, opacity: 0.42, roughness: 0.02, metalness: 0.2, envMapIntensity: 2.2, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }),
    tea: new THREE.MeshStandardMaterial({ color: '#9a5a1e', transparent: true, opacity: 0.8, roughness: 0.04, metalness: 0.05, envMapIntensity: 1.8, side: THREE.DoubleSide }),
    teaPool: new THREE.MeshStandardMaterial({ color: '#8a4e18', transparent: true, opacity: 0.74, roughness: 0.02, metalness: 0.1, envMapIntensity: 2.0, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }),
    shard: new THREE.MeshStandardMaterial({ color: '#f4fbff', transparent: true, opacity: 0.85, roughness: 0.02, metalness: 0.3, envMapIntensity: 2.4, side: THREE.DoubleSide, depthWrite: false }),
    clock: soStd('#ffffff', 0.5, 0, { map: soTex(soClockFaceCanvas(), { repeat: false }) }),
    grape: soStd('#6e8f2e', 0.28, 0.0, { envMapIntensity: 1.3 }), orange: soStd('#e88a22', 0.55), towel: soStd('#ffffff', 0.95, 0, { map: soTex(soCanvas(64, 64, (g, w, h) => { g.fillStyle = '#f2efe8'; g.fillRect(0, 0, w, h); g.fillStyle = '#b8322a'; for (let x = 0; x < w; x += 16) g.fillRect(x, 0, 5, h); for (let y = 0; y < h; y += 16) g.fillRect(0, y, w, 4); }), { repeat: false }), side: THREE.DoubleSide }),
    bread: soStd('#c88a48', 0.85), crumb: soStd('#d8a868', 0.9),
  };
  M.jars = ['#e8d9b0', '#c9a36a', '#7a5a3a', '#e8e4dc'].map((c) => soStd(c, 0.6));
  M.books = ['#7a2e2a', '#2f4a6b', '#d9c9a3', '#3c5a3c', '#b8862e', '#1f2a36'].map((c) => soStd(c, 0.8));

  const L = SO_ROOM, W = L.W / 2, D = L.D / 2, H = L.H;
  const room = new THREE.Group(); room.name = 'room'; room.position.set(...L.origin); scene.add(room); R.room = room;
  room.updateMatrixWorld(true);
  R.toWorld = (x, y, z, out) => (out || new THREE.Vector3()).set(x, y, z).applyMatrix4(room.matrixWorld);
  R.toLocal = (v, out) => (out || new THREE.Vector3()).copy(v).applyMatrix4(new THREE.Matrix4().copy(room.matrixWorld).invert());
  const T = 0.25;
  // ---- floor, ceiling, walls (south: the window; north: the door)
  soBox(L.W, 0.2, L.D, M.floor, 0, -0.1, 0, room);
  soBox(L.W + 0.5, 0.25, L.D + 0.5, M.ceil, 0, H + 0.125, 0, room);
  soBox(T, H, L.D + 0.5, M.wallL, -W - T / 2, H / 2, 0, room);
  soBox(T, H, L.D + 0.5, M.wall, W + T / 2, H / 2, 0, room);
  const wi = L.win;
  for (const c of soWallCells(-W - T, W + T, 0, H, [[wi.x[0], wi.x[1], wi.y[0], wi.y[1]]])) soBox(c[1] - c[0], c[3] - c[2], T, M.wall, (c[0] + c[1]) / 2, (c[2] + c[3]) / 2, -D - T / 2, room);
  const dr = L.door;
  for (const c of soWallCells(-W - T, W + T, 0, H, [[dr.x[0], dr.x[1], 0, dr.h]])) soBox(c[1] - c[0], c[3] - c[2], T, M.wall, (c[0] + c[1]) / 2, (c[2] + c[3]) / 2, D + T / 2, room);
  { const dd = soBox(dr.x[1] - dr.x[0] - 0.02, dr.h - 0.01, 0.04, M.door, (dr.x[0] + dr.x[1]) / 2, dr.h / 2, D + 0.06, room); soBox(0.12, 0.03, 0.05, M.handle, dr.x[0] + 0.12, 1.02, D + 0.02, room); dd.castShadow = true; }
  for (const [a, b] of [[dr.x[0] - 0.05, dr.x[0]], [dr.x[1], dr.x[1] + 0.05]]) soBox(b - a, dr.h + 0.05, 0.06, M.frame, (a + b) / 2, dr.h / 2, D - 0.02, room);
  soBox(dr.x[1] - dr.x[0] + 0.1, 0.05, 0.06, M.frame, (dr.x[0] + dr.x[1]) / 2, dr.h + 0.025, D - 0.02, room);
  for (const [x, z, w, d] of [[0.3, -D + 0.01, L.W - 1, 0.02], [W - 0.01, 0, 0.02, L.D]]) soBox(w, 0.1, d, M.skirt, x, 0.05, z, room);
  // ---- the window: the left pane fixed, the right one a casement hinged on its right (it opens outwards, for the apple)
  { const z = -D - 0.12, x0 = wi.x[0], x1 = wi.x[1], sp = wi.split, y0 = wi.y[0], y1 = wi.y[1], cy = (y0 + y1) / 2, hh = y1 - y0;
    for (const [bx, by, bw, bh] of [[(x0 + x1) / 2, y1 - 0.03, x1 - x0, 0.06], [(x0 + x1) / 2, y0 + 0.03, x1 - x0, 0.06], [x0 + 0.03, cy, 0.06, hh], [x1 - 0.03, cy, 0.06, hh], [sp, cy, 0.06, hh]]) soBox(bw, bh, 0.08, M.frame, bx, by, z, room);
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(sp - x0 - 0.09, hh - 0.1), M.glass); gl.position.set((x0 + sp) / 2, cy, z); gl.renderOrder = 4; room.add(gl);
    // the casement: hinged at x1 (outer face of the wall), its sash and glass
    const cs = new THREE.Group(); cs.position.set(x1 - 0.06, cy, -D - 0.2); room.add(cs); R.casement = cs;
    const w = x1 - 0.06 - (sp + 0.03);
    for (const [bx, by, bw, bh] of [[-w / 2, hh / 2 - 0.1, w, 0.05], [-w / 2, -hh / 2 + 0.1, w, 0.05], [-0.025, 0, 0.05, hh - 0.15], [-w + 0.025, 0, 0.05, hh - 0.15]]) soBox(bw, bh, 0.05, M.frame, bx, by, 0, cs);
    const g2 = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.08, hh - 0.25), M.glass); g2.position.set(-w / 2, 0, 0); g2.renderOrder = 4; cs.add(g2);
    soBox(0.025, 0.12, 0.03, M.handle, -w + 0.05, 0, 0.04, cs);
    const sl = L.sill; soBox(sl.x[1] - sl.x[0], sl.y[1] - sl.y[0], sl.z[1] - sl.z[0], M.frame, (sl.x[0] + sl.x[1]) / 2, (sl.y[0] + sl.y[1]) / 2, (sl.z[0] + sl.z[1]) / 2, room);
    const rd = L.rad, rx = (rd.x[0] + rd.x[1]) / 2, rw = rd.x[1] - rd.x[0];
    for (let i = 0; i < 16; i++) soBox(0.05, rd.y[1] - rd.y[0], 0.06, M.rad, rd.x[0] + 0.05 + i * (rw - 0.1) / 15, (rd.y[0] + rd.y[1]) / 2, -D + 0.05, room);
    soBox(rw, 0.03, 0.08, M.rad, rx, rd.y[1] - 0.015, -D + 0.05, room); soBox(rw, 0.03, 0.08, M.rad, rx, rd.y[0] + 0.015, -D + 0.05, room);
    // on the sill: a basil pot, a little cactus
    soCyl(0.07, 0.055, 0.12, M.terracotta, -0.7, 0.86 + 0.06, -1.94, room, 14);
    for (let k = 0; k < 7; k++) { const a = k * 0.9; soMesh(new THREE.SphereGeometry(0.035, 8, 6).scale(1.3, 0.5, 0.9), k % 2 ? M.leaf : M.leaf2, -0.7 + Math.cos(a) * 0.04, 1.0 + 0.03 * (k % 3), -1.94 + Math.sin(a) * 0.04, room); }
    soCyl(0.04, 0.035, 0.07, M.ceramicB, 1.15, 0.86 + 0.035, -1.94, room, 12); soMesh(new THREE.SphereGeometry(0.03, 10, 8).scale(1, 1.6, 1), M.leaf, 1.15, 0.96, -1.94, room);
  }
  // ---- the counter run along the left wall: base units (sage doors), the oak worktop, the sink, the hob; the splashback
  { const C = L.counter, x0 = C.x[0], x1 = C.x[1], dz = C.z[1] - C.z[0], cz = (C.z[0] + C.z[1]) / 2;
    soBox(x1 - x0 - 0.06, 0.1, dz, M.black, (x0 + x1) / 2 - 0.03, 0.05, cz, room);                 // plinth
    soBox(x1 - x0 - 0.02, C.top - 0.14, dz, M.cab, (x0 + x1) / 2 - 0.01, 0.1 + (C.top - 0.14) / 2, cz, room);
    const nD = 5; for (let i = 0; i < nD; i++) { const z0 = C.z[0] + i * dz / nD, z1 = z0 + dz / nD;
      soMesh(soRoundBox(0.02, C.top - 0.2, z1 - z0 - 0.008, 0.004, 0.003), M.cabD, x1 + 0.0, 0.12, (z0 + z1) / 2, room);
      soBox(0.025, 0.012, 0.16, M.steel, x1 + 0.025, C.top - 0.18, (z0 + z1) / 2, room); }
    soBox(x1 - x0 + 0.03, 0.04, dz + 0.02, M.top, (x0 + x1) / 2 + 0.015, C.top - 0.02, cz, room);
    // the splashback (tiles) up to the wall cupboards
    const sb = new THREE.Mesh(new THREE.PlaneGeometry(dz, 0.58), M.splash); sb.position.set(-W + 0.004, C.top + 0.29, cz); sb.rotation.y = Math.PI / 2; sb.receiveShadow = true; room.add(sb);
    // the sink (a steel basin set in the top) and its tap
    const sk = L.sink; soBox(0.42, 0.005, sk.w, M.steelD, -2.2, C.top + 0.001, sk.z, room); soBox(0.36, 0.004, sk.w - 0.08, soStd('#4a4e52', 0.3, 0.8), -2.2, C.top + 0.004, sk.z, room);
    { const tp = soCyl(0.015, 0.018, 0.28, M.steel, -2.42, C.top + 0.14, sk.z, room, 12); void tp; const sp = soCyl(0.012, 0.012, 0.2, M.steel, -2.33, C.top + 0.28, sk.z, room, 10); sp.rotation.z = Math.PI / 2; }
    // the hob: black glass, four rings
    soBox(0.52, 0.006, 0.56, M.hob, -2.2, C.top + 0.003, L.hob.z, room);
    for (const [dx, dz2, r] of [[-0.12, -0.13, 0.09], [-0.12, 0.13, 0.07], [0.12, -0.13, 0.07], [0.12, 0.13, 0.09]]) { const rg = new THREE.Mesh(new THREE.RingGeometry(r - 0.006, r, 32), M.ring); rg.rotation.x = -Math.PI / 2; rg.position.set(-2.2 + dx, C.top + 0.0075, L.hob.z + dz2); room.add(rg); }
    // the kettle's base, a knife block, the bread board, a fruit bowl by the window
    soCyl(0.09, 0.095, 0.02, M.black, ...[L.kettle[0], C.top + 0.01, L.kettle[2]], room, 24);
    { const kb = soBox(0.1, 0.22, 0.12, M.woodD, -2.38, C.top + 0.11, 0.05, room); kb.rotation.x = -0.15; for (let k = 0; k < 4; k++) soBox(0.016, 0.08, 0.012, M.black, -2.38, C.top + 0.25, 0.01 + k * 0.026, room); }
    soBox(0.3, 0.02, 0.42, M.wood, -2.22, C.top + 0.01, 0.95, room);
    { const fb = soCyl(0.13, 0.08, 0.07, M.ceramicR, -2.25, C.top + 0.035, -1.62, room, 20); void fb; for (const [dx, dz2, c] of [[0.03, 0.02, M.orange], [-0.04, -0.02, soStd('#c8321e', 0.45)], [0.0, 0.05, soStd('#e2c43a', 0.5)]]) soMesh(new THREE.SphereGeometry(0.04, 12, 9), c, -2.25 + dx, C.top + 0.1, -1.62 + dz2, room); }
    // the wall cupboards (with a light strip under them)
    const wc = L.wallCab, wz = (wc.z[0] + wc.z[1]) / 2, wd = wc.z[1] - wc.z[0];
    soBox(wc.x[1] - wc.x[0], wc.y[1] - wc.y[0], wd, M.cab, (wc.x[0] + wc.x[1]) / 2, (wc.y[0] + wc.y[1]) / 2, wz, room);
    for (let i = 0; i < 4; i++) { const z0 = wc.z[0] + i * wd / 4; soMesh(soRoundBox(0.02, wc.y[1] - wc.y[0] - 0.02, wd / 4 - 0.008, 0.004, 0.003), M.cabD, wc.x[1], wc.y[0] + 0.01, z0 + wd / 8, room); soBox(0.025, 0.14, 0.012, M.steel, wc.x[1] + 0.025, wc.y[0] + 0.12, z0 + wd / 8 + (i % 2 ? -1 : 1) * (wd / 8 - 0.06), room); }
    soBox(0.02, 0.01, wd - 0.1, new THREE.MeshBasicMaterial({ color: '#fff3dc' }), wc.x[1] - 0.06, wc.y[0] - 0.006, wz, room);
    const ul = new THREE.RectAreaLight ? null : null; void ul;
  }
  // ---- the fridge
  { const F = L.fridge, cx = (F.x[0] + F.x[1]) / 2, cz = (F.z[0] + F.z[1]) / 2;
    soMesh(soRoundBox(F.x[1] - F.x[0], F.h, F.z[1] - F.z[0], 0.03, 0.02), M.fridge, cx, 0, cz, room);
    soBox(0.004, 0.006, F.z[1] - F.z[0] - 0.04, M.steelD, F.x[1] + 0.001, 1.2, cz, room);
    soBox(0.03, 0.4, 0.025, M.steel, F.x[1] + 0.02, 1.45, F.z[0] + 0.08, room); soBox(0.03, 0.3, 0.025, M.steel, F.x[1] + 0.02, 0.92, F.z[0] + 0.08, room);
    // magnets and a child's drawing
    const dw = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.29), soStd('#ffffff', 0.9, 0, { map: soTex(soCanvas(128, 176, (g, w, h) => { g.fillStyle = '#fbf8f0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2a6ac8'; g.lineWidth = 5; g.beginPath(); g.arc(64, 60, 30, 0, 6.28); g.stroke(); g.fillStyle = '#e8b42a'; g.beginPath(); g.arc(98, 28, 16, 0, 6.28); g.fill(); g.strokeStyle = '#3a8a3a'; g.beginPath(); g.moveTo(10, 150); g.lineTo(118, 150); g.stroke(); g.strokeStyle = '#c8321e'; g.beginPath(); g.moveTo(64, 90); g.lineTo(64, 140); g.moveTo(40, 110); g.lineTo(88, 110); g.stroke(); }), { repeat: false }) }));
    dw.position.set(F.x[1] + 0.003, 1.5, cz + 0.12); dw.rotation.y = Math.PI / 2; room.add(dw);
  }
  // ---- the table, its chairs
  { const tb = L.table, t = tb.top;
    soMesh(soRoundBox(tb.w, 0.04, tb.d, 0.015, 0.008), M.wood, tb.x, t - 0.04, tb.z, room);
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) soBox(0.05, t - 0.04, 0.05, M.woodD, tb.x + dx * (tb.w / 2 - 0.08), (t - 0.04) / 2, tb.z + dz * (tb.d / 2 - 0.08), room);
    // a runner and a jug of flowers at the far end
    soBox(0.36, 0.003, tb.d - 0.1, soStd('#c9b99a', 0.95), tb.x - 0.45, t + 0.0015, tb.z, room);
    soCyl(0.045, 0.055, 0.16, M.ceramicB, tb.x - 0.45, t + 0.08, tb.z - 0.1, room, 14);
    for (let k = 0; k < 6; k++) { const a = k * 1.05; soMesh(new THREE.SphereGeometry(0.025, 8, 6), soStd(k % 2 ? '#e8c24a' : '#f2efe6', 0.7), tb.x - 0.45 + Math.cos(a) * 0.05, t + 0.25 + 0.03 * (k % 2), tb.z - 0.1 + Math.sin(a) * 0.05, room); }
    // your mug of tea, a bowl of grapes
    soCyl(0.11, 0.05, 0.06, M.ceramic, tb.x + 0.35, t + 0.03, tb.z + 0.05, room, 20);
    for (let k = 0; k < 9; k++) soMesh(new THREE.SphereGeometry(0.012, 10, 8).scale(1, 1.15, 1), M.grape, tb.x + 0.35 + 0.035 * Math.cos(k * 2.4) * (k % 3 ? 1 : 0.4), t + 0.06 + 0.012 * (k % 3), tb.z + 0.05 + 0.035 * Math.sin(k * 2.4) * (k % 3 ? 1 : 0.4), room);
    const chair = (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; room.add(g);
      soMesh(soRoundBox(0.42, 0.035, 0.42, 0.02, 0.01), M.wood, 0, 0.44, 0, g);
      for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) soBox(0.035, 0.44, 0.035, M.woodD, dx * 0.18, 0.22, dz * 0.18, g);
      for (const dx of [-1, 1]) soBox(0.035, 0.45, 0.035, M.woodD, dx * 0.18, 0.69, 0.19, g);
      for (const y of [0.72, 0.86]) soBox(0.38, 0.05, 0.025, M.wood, 0, y, 0.19, g); };
    chair(tb.x - 0.35, tb.z + 0.62, 0); chair(tb.x + 0.35, tb.z - 0.62, Math.PI); chair(tb.x - 0.35, tb.z - 0.62, Math.PI); chair(tb.x + 0.98, tb.z, -Math.PI / 2);
  }
  // ---- the lamp over the table: a ceiling rose, the flex, a dome shade
  { const lp = L.lamp, g = new THREE.Group(); g.position.set(lp.x, H, lp.z); room.add(g); R.lamp = g;
    soCyl(0.05, 0.05, 0.03, M.white, 0, -0.015, 0, g, 18);
    soCyl(0.004, 0.004, lp.cord, M.flex, 0, -lp.cord / 2, 0, g, 6);
    const pts = []; for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI / 2; pts.push(new THREE.Vector2(0.03 + 0.2 * Math.sin(a), -0.17 * (1 - Math.cos(a)) * 0 - 0.17 * Math.sin(a) * 0 + 0.17 * Math.cos(a) - 0.17)); }
    const sh = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), M.shade); sh.position.y = -lp.cord; sh.castShadow = true; g.add(sh);
    const shi = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), M.shadeIn); shi.position.y = -lp.cord - 0.002; shi.scale.setScalar(0.985); g.add(shi);
    soMesh(new THREE.SphereGeometry(0.035, 12, 8), M.bulb, 0, -lp.cord - 0.1, 0, g);
  }
  // ---- the open shelves on the right wall: jars, plates, bowls, cookbooks, a trailing plant; the clock by the door
  { const sh = L.shelves, z0 = sh.z[0], z1 = sh.z[1], zc = (z0 + z1) / 2, x = W - 0.13;
    for (const y of sh.y) { soBox(0.26, 0.03, z1 - z0, M.wood, x, y, zc, room); for (const z of [z0 + 0.1, z1 - 0.1]) soBox(0.03, 0.12, 0.03, M.black, W - 0.03, y - 0.07, z, room); }
    const r = new RNG(41);
    // shelf 1: jars
    for (let k = 0; k < 5; k++) { const z = z0 + 0.22 + k * 0.33, h = r.range(0.12, 0.2); soCyl(0.05, 0.05, h, M.cup, x, sh.y[0] + 0.015 + h / 2, z, room, 14); soCyl(0.046, 0.046, h * 0.7, M.jars[k % 4], x, sh.y[0] + 0.015 + h * 0.35, z, room, 12); soCyl(0.052, 0.052, 0.02, M.woodD, x, sh.y[0] + 0.025 + h, z, room, 14); }
    // shelf 2: plates on edge, bowls
    for (let k = 0; k < 6; k++) { const p = soCyl(0.11, 0.11, 0.012, k % 2 ? M.ceramic : M.ceramicB, x + 0.02, sh.y[1] + 0.12, z0 + 0.2 + k * 0.03, room, 24); p.rotation.x = Math.PI / 2 - 0.12; }
    for (let k = 0; k < 3; k++) soCyl(0.07, 0.045, 0.06 - k * 0.008, M.ceramicR, x, sh.y[1] + 0.045 + k * 0.03, z0 + 0.95, room, 18);
    for (let k = 0; k < 5; k++) soBox(0.17, 0.22 + 0.02 * (k % 2), 0.035, M.books[k % 6], x, sh.y[1] + 0.13, z0 + 1.45 + k * 0.04, room);
    // shelf 3: a trailing plant, a teapot
    soCyl(0.08, 0.06, 0.12, M.terracotta, x, sh.y[2] + 0.075, z0 + 0.4, room, 14);
    for (let k = 0; k < 14; k++) { const a = r.range(0, 6.28), dd = r.range(0.02, 0.12); const lf = soMesh(new THREE.SphereGeometry(0.03, 8, 6).scale(1.4, 0.4, 0.9), k % 2 ? M.leaf : M.leaf2, x + Math.cos(a) * dd * 0.6, sh.y[2] + 0.15 - k * 0.025 * (k % 3 === 0 ? 1 : 0.2), z0 + 0.4 + Math.sin(a) * dd, room); lf.rotation.set(r.range(-1, 1), a, r.range(-0.6, 0.6)); }
    soMesh(new THREE.SphereGeometry(0.08, 18, 12).scale(1, 0.8, 1), M.ceramic, x, sh.y[2] + 0.08, z0 + 1.3, room);
  }
  // the clock on the right wall, near the door (it shows the time: 3 PM and the minutes going by)
  { const ck = L.clock, g = new THREE.Group(); g.position.set(ck.x, ck.y, ck.z); g.rotation.y = -Math.PI / 2; room.add(g);
    const f = soCyl(0.15, 0.15, 0.035, M.black, 0, 0, -0.0175, g, 32); f.rotation.x = Math.PI / 2;
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.137, 32), M.clock); face.position.z = 0.001; g.add(face);
    R.hands = [0.085, 0.115, 0.125].map((l, i) => { const h = new THREE.Group(); h.position.z = 0.004 + i * 0.002; g.add(h); soBox([0.01, 0.007, 0.003][i], l, 0.003, i === 2 ? soStd('#b8322a', 0.5) : M.black, 0, l / 2 - 0.015, 0, h); return h; }); }
  // the cat's bowl by the fridge
  { const pts = []; for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2; pts.push(new THREE.Vector2(0.075 + 0.025 * Math.sin(a), 0.05 * (1 - Math.cos(a)))); }
    soMesh(new THREE.LatheGeometry([new THREE.Vector2(0, 0.004), new THREE.Vector2(0.06, 0.004), ...pts], 24), soStd('#c95a3a', 0.35), -1.55, 0, 1.55, room).material.side = THREE.DoubleSide; }

  // ==================================================================== TONIGHT: the glass the cat knocks off, its shards
  { const g = new THREE.Group(); room.add(g); R.glassG = g;
    const pts = [new THREE.Vector2(0.0, 0), new THREE.Vector2(0.03, 0), new THREE.Vector2(0.032, 0.008), new THREE.Vector2(0.036, 0.12), new THREE.Vector2(0.034, 0.12), new THREE.Vector2(0.03, 0.012), new THREE.Vector2(0.0, 0.012)];
    const gm = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), M.cup); gm.renderOrder = 6; g.add(gm);
    const wm = new THREE.Mesh(new THREE.CylinderGeometry(0.0315, 0.0285, 0.068, 24), M.water); wm.position.y = 0.012 + 0.034; wm.renderOrder = 5; g.add(wm); }
  R.shards = Array.from({ length: 30 }, (_, i) => { const m = new THREE.Mesh(soShardGeo(i), M.shard); m.visible = false; m.renderOrder = 6; room.add(m); return m; });
  { const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), M.wet); m.rotation.x = -Math.PI / 2; m.visible = false; m.renderOrder = 3; room.add(m); R.spill = m; }
  R.update = (s, o) => soRoomUpdate(R, s, o || {});
  return R;
}

// the room tonight: the clock; the glass the cat knocks off the counter's edge at SO.sKnock (it tips, falls 0.92 m in
// 0.43 s and breaks on the tiles: 30 shards fan out and slide to a stop; the water spreads)
function soRoomUpdate(R, s, o) {
  { const c = soClockParts(s); R.hands[0].rotation.z = -((c.h % 12) + c.m / 60) / 12 * Math.PI * 2; R.hands[1].rotation.z = -(c.m + c.sec / 60) / 60 * Math.PI * 2; R.hands[2].rotation.z = -c.sec / 60 * Math.PI * 2; }
  const G = SO_K.glass, k0 = SO.sKnock, tau = s - k0, top = SO_ROOM.counter.top, fall = 0.43;
  const g = R.glassG;
  if (tau < 0) { g.visible = true; g.position.set(G[0], top, G[2]); g.rotation.set(0, 0, 0); }
  else if (tau < fall) {                                   // tipped over the edge (+x, into the room), turning as it falls
    const u = tau / fall; g.visible = true; g.position.set(G[0] + 0.18 * tau + 0.05, top - 4.905 * tau * tau, G[2] + 0.02 * u); g.rotation.set(0.3 * u, 0, -0.6 - 2.6 * u);
  } else g.visible = false;
  const broke = tau >= fall, hit = [G[0] + 0.18 * fall + 0.05, 0.004, G[2] + 0.02];
  R.shards.forEach((m, i) => {
    m.visible = broke;
    if (!broke) return;
    const a = soR(i, 11) * Math.PI * 2, v = 0.4 + 1.6 * soR(i, 12), d = v * 0.35 * (1 - Math.exp(-(tau - fall) / 0.35)), up = Math.max(0, 0.6 * soR(i, 13) * (tau - fall) - 4.9 * (tau - fall) ** 2);
    m.position.set(hit[0] + Math.cos(a) * d, 0.003 + up, hit[2] + Math.sin(a) * d * 0.9);
    m.rotation.set(0, a + soR(i, 14) * 3, 0);
  });
  R.spill.visible = broke;
  if (broke) { const r = 0.06 + 0.22 * (1 - Math.exp(-(tau - fall) / 1.2)); R.spill.position.set(hit[0], 0.002, hit[2]); R.spill.scale.set(r * 1.3, r, 1); }
  void o;
}
