/* =====================================================================
   ROOM — your kitchen on the top (fifth) floor (layout.js: FU_ROOM). Its window looks south over the street and the
   park; the afternoon sun comes in at it. The counter runs along the left wall (the sink, the kettle, the hob), the
   fridge at its far end, wall cupboards over it; the table in the middle under its lamp; open shelves and the clock on
   the right; the door to the hall behind you.
   What falls up in here (story time s, physics.js fuHop: no drag over a metre or two):
     3:00:00  the glass of water (out of your hand): mouth first into the ceiling; the water splashes, the glass breaks
     3:00:17  the spoon and the grape, let go together: they land together
     3:00:42  the tea (out of the kettle's spout): a stream that curves up and pools on the ceiling
     3:01:10  the cat (animals.js), off the counter: it rights itself and lands on its feet on the ceiling
     by 3:08  the ceiling over the table is full: what was dropped in the minutes we don't see
     3:10:00  everything up there comes down at once (fuDropBack): onto the table, or the floor
   Posed by update(s, o), pure (o.rel: where your hands let go of things, room-local: world.js works it out).
     fuBuildRoom(S) → R
   ===================================================================== */

// ---- canvases
function fuTileCanvas(seed, w = 512, h = 512) {                    // the floor: terracotta tiles, 30 cm
  const r = new RNG(seed);
  return fuCanvas(w, h, (g) => {
    g.fillStyle = '#8a6a55'; g.fillRect(0, 0, w, h);
    const s = 128;
    for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) {
      const k = r.range(-14, 12); g.fillStyle = `rgb(${176 + k},${104 + k * 0.7},${72 + k * 0.5})`; g.fillRect(x + 3, y + 3, s - 6, s - 6);
      for (let i = 0; i < 140; i++) { g.fillStyle = `rgba(${r.next() < 0.5 ? '255,220,190' : '70,30,15'},${r.range(0.03, 0.08)})`; g.fillRect(x + r.range(3, s - 6), y + r.range(3, s - 6), r.range(1, 4), r.range(1, 3)); }
      const gr = g.createLinearGradient(x, y, x + s, y + s); gr.addColorStop(0, 'rgba(255,255,255,0.05)'); gr.addColorStop(1, 'rgba(0,0,0,0.06)'); g.fillStyle = gr; g.fillRect(x + 3, y + 3, s - 6, s - 6);
    }
  });
}
function fuPaintCanvas(seed, col, w = 256, h = 256) {
  return fuCanvas(w, h, (g) => {
    g.fillStyle = col; g.fillRect(0, 0, w, h);
    const im = g.getImageData(0, 0, w, h), d = im.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const n = (hash2(x >> 1, (y >> 1) + seed) - 0.5) * 6 + (hash2(x >> 4, y >> 3) - 0.5) * 5, i = (y * w + x) * 4; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(im, 0, 0);
  });
}
function fuSplashCanvas(w = 512, h = 256) {                         // white metro tiles (the splashback)
  const r = new RNG(5);
  return fuCanvas(w, h, (g) => {
    g.fillStyle = '#b9b4aa'; g.fillRect(0, 0, w, h);
    const tw = 64, th = 32;
    for (let y = 0, row = 0; y < h; y += th, row++) for (let x = row % 2 ? -tw / 2 : 0; x < w; x += tw) {
      const k = r.range(-6, 6), gr = g.createLinearGradient(0, y, 0, y + th); gr.addColorStop(0, `rgb(${246 + k},${245 + k},${240 + k})`); gr.addColorStop(1, `rgb(${226 + k},${224 + k},${218 + k})`);
      g.fillStyle = gr; g.fillRect(x + 1.5, y + 1.5, tw - 3, th - 3);
    }
  });
}
function fuClockFaceCanvas(w = 256) {
  return fuCanvas(w, w, (g) => {
    g.fillStyle = '#f6f3ec'; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 2, 0, 6.28); g.fill();
    g.strokeStyle = '#1d1f22'; g.lineWidth = 10; g.stroke();
    for (let i = 0; i < 60; i++) { const a = i / 60 * 6.283, L = i % 5 ? 8 : 20, r0 = w / 2 - 16; g.lineWidth = i % 5 ? 2 : 5; g.beginPath(); g.moveTo(w / 2 + Math.sin(a) * r0, w / 2 - Math.cos(a) * r0); g.lineTo(w / 2 + Math.sin(a) * (r0 - L), w / 2 - Math.cos(a) * (r0 - L)); g.stroke(); }
  });
}
function fuLabelCanvas(text, bg, fg, w = 128, h = 160) {
  return fuCanvas(w, h, (c) => { c.fillStyle = bg; c.fillRect(0, 0, w, h); c.fillStyle = fg; c.font = '700 26px Arial'; c.textAlign = 'center'; c.fillText(text, w / 2, h * 0.55); c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(0, h * 0.7, w, 6); });
}

// a glass shard (a thin irregular triangle), a seeded one per i
function fuShardGeo(i) {
  const a = 0.018 + 0.045 * fuR(i, 3), b = 0.015 + 0.035 * fuR(i, 4), c = fuR(i, 5) * 2 - 1;
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-a, 0, -b * 0.4, a * (0.3 + 0.6 * c), 0, -b, a * 0.6, 0, b], 3)); g.computeVertexNormals(); return g;
}

// ---------------------------------------------------------------------------------------------------------------------
// THE THINGS THAT GO UP IN HERE: their rest on the ceiling (room-local x, z, a turn), how far they hang below it (half
// their thickness), and where they come down at 3:10 (on the table if they're over it, else on the floor)
// ---------------------------------------------------------------------------------------------------------------------
const FU_CEIL = FUP.ceil;
const fuOverTable = (x, z) => { const T = FU_ROOM.table; return Math.abs(x - T.x) < T.w / 2 - 0.03 && Math.abs(z - T.z) < T.d / 2 - 0.03; };
const fuRestY = (x, z) => (fuOverTable(x, z) ? FU_ROOM.table.top : 0);
// what was dropped while we were away (it is up there by the time we come back, at 3:08): [id, kind, x, z, turn, at]
const FU_CLUTTER = [
  ['towel', 'towel', 0.05, -0.3, 0.6, 140], ['orange1', 'orange', 0.62, 0.05, 0, 150], ['orange2', 'orange', 0.74, -0.2, 0, 151], ['fork', 'fork', -0.12, 0.08, 1.9, 200],
  ['bread', 'bread', 0.38, -0.42, 0.3, 230], ['pen', 'pen', 0.9, 0.12, 2.4, 260], ['napkin', 'napkin', -0.25, -0.38, 0.9, 300], ['wspoon', 'wspoon', 0.55, 0.22, -0.5, 330],
  ['cereal', 'cereal', -0.3, 0.0, 0.2, 360], ['bottle', 'bottle', 0.18, 0.18, 1.2, 390], ['ball', 'catball', 1.05, -0.32, 0, 410], ['keys', 'keys', 0.82, -0.48, 0.7, 430],
  ['plate', 'plate', 0.28, -0.12, 0, 455], ['crumbs', 'crumbs', 0.15, -0.2, 0, 460],
  ['book', 'book', -0.22, 0.14, 0.4, 170], ['mug2', 'mug', 0.7, -0.06, 1.1, 210], ['board', 'board', -0.04, -0.2, 0.25, 240], ['roll', 'roll', 0.9, 0.2, 1.4, 280],
  ['orange3', 'orange', 0.48, -0.34, 0, 152], ['orange4', 'orange', -0.1, -0.46, 0, 153], ['banana', 'banana', 0.32, 0.12, 0.8, 310], ['tin', 'tin', -0.38, -0.22, 0.6, 340],
  ['remote', 'remote', 0.64, 0.27, -0.3, 370], ['paper', 'paper', 0.12, -0.36, 0.15, 400], ['slipper', 'slipper', 1.95, -1.25, 2.0, 420], ['lid', 'lid', -0.3, 0.26, 0, 440],
  ['cushion', 'cushion', 1.8, 1.62, 0.3, 445], ['phone', 'phone', 0.02, 0.06, 0.9, 450], ['jar', 'jar', 0.82, -0.36, 0, 465], ['sock', 'sock', -0.6, 0.55, 1.7, 470],
];

// where the cat comes down at 3:10 (room-local x, z: on the table, clear of the lamp); nothing else lands there
const FU_CAT_TABLE = [-0.2, 0.1];
// keep everything that comes down clear of the lamp's shade (it would fall through it) and of the cat's spot
const fuClear = (x, z) => {
  for (const [cx, cz, r] of [[FU_ROOM.lamp.x, FU_ROOM.lamp.z, 0.3], [FU_CAT_TABLE[0], FU_CAT_TABLE[1], 0.2]]) {
    const dx = x - cx, dz = z - cz, d = Math.hypot(dx, dz);
    if (d < r) { if (d < 1e-4) { x = cx + r; continue; } x = cx + dx * r / d; z = cz + dz * r / d; }
  }
  return [x, z];
};
FU_CLUTTER.forEach((c) => { const [x, z] = fuClear(c[2], c[3]); c[2] = x; c[3] = z; });
// how much each kind bounces when it comes down (restitution), and whether it rolls
const FU_BOUNCE = { orange: [0.35, 1], catball: [0.55, 1], tin: [0.25, 1], bottle: [0.2, 1], jar: [0.2, 1], lid: [0.3, 0], mug: [0.15, 0], pen: [0.3, 1], fork: [0.25, 0], wspoon: [0.3, 0],
  keys: [0.12, 0], remote: [0.2, 0], phone: [0.2, 0], book: [0.06, 0], cereal: [0.1, 0], board: [0.15, 0], plate: [0.12, 0], roll: [0.15, 1], banana: [0.08, 0] };

function fuBuildRoom(S) {
  const scene = S.scene, R = { M: {}, ceil: [] }, tex = (c, rx, ry) => { const t = fuTex(c); t.repeat.set(rx, ry); return t; };
  const M = R.M = {
    floor: fuStd('#ffffff', 0.6, 0, { map: tex(fuTileCanvas(13), 3.4, 2.7) }),
    wall: fuStd('#ffffff', 0.92, 0, { map: tex(fuPaintCanvas(3, '#ece4d4'), 3, 2) }),
    wallL: fuStd('#ffffff', 0.92, 0, { map: tex(fuPaintCanvas(5, '#e8dfcc'), 3, 2) }),
    ceil: fuStd('#ffffff', 0.95, 0, { map: tex(fuPaintCanvas(7, '#f5f3ee'), 4, 3) }),
    splash: fuStd('#ffffff', 0.25, 0, { map: tex(fuSplashCanvas(), 1.6, 0.9) }),
    skirt: fuStd('#f1efe8', 0.5), frame: fuStd('#f6f4ef', 0.45),
    glass: new THREE.MeshStandardMaterial({ color: '#2c3338', transparent: true, opacity: 0.22, roughness: 0.4, envMapIntensity: 0.4, depthWrite: false, side: THREE.DoubleSide }),
    rad: fuStd('#f2f1ed', 0.4, 0.2), door: fuStd('#f3f1eb', 0.5), handle: fuStd('#b9b3a6', 0.3, 0.8),
    cab: fuStd('#7e9483', 0.55), cabD: fuStd('#6f8574', 0.6), top: fuStd('#ffffff', 0.45, 0, { map: (() => { const t = fuTex(fuWoodCanvas(31, 256, 1024, [176, 128, 84])); t.rotation = Math.PI / 2; t.repeat.set(1, 3); return t; })() }),
    wood: fuStd('#ffffff', 0.55, 0, { map: (() => { const t = fuTex(fuWoodCanvas(21, 256, 1024, [168, 120, 78])); t.rotation = Math.PI / 2; return t; })() }),
    woodD: fuStd('#ffffff', 0.6, 0, { map: fuTex(fuWoodCanvas(23, 256, 1024, [120, 82, 52])) }),
    white: fuStd('#f1efe9', 0.5), black: fuStd('#141518', 0.35, 0.3), steel: fuStd('#c9ccce', 0.28, 0.85), steelD: fuStd('#8d9194', 0.35, 0.8),
    hob: fuStd('#0d0e10', 0.12, 0.2), ring: fuStd('#3a3c40', 0.3, 0.1),
    fridge: fuStd('#e9e9e6', 0.3, 0.1),
    ceramic: fuStd('#f3efe6', 0.25), ceramicB: fuStd('#3f6f7a', 0.3), ceramicR: fuStd('#b8533a', 0.35), terracotta: fuStd('#b0603e', 0.8),
    leaf: fuStd('#3f6b35', 0.85), leaf2: fuStd('#557f3f', 0.85), soil: fuStd('#3a2c22', 1),
    shade: fuStd('#2f4a52', 0.5, 0.2, { side: THREE.DoubleSide }), shadeIn: fuStd('#f2e9d6', 0.6, 0, { side: THREE.BackSide, emissive: new THREE.Color('#ffcf8a'), emissiveIntensity: 0.0 }),
    bulb: new THREE.MeshBasicMaterial({ color: '#fff1d0' }), flex: fuStd('#1c1c1e', 0.6),
    cup: new THREE.MeshPhysicalMaterial({ color: '#dfeaee', transparent: true, opacity: 0.46, roughness: 0.04, envMapIntensity: 1.6, depthWrite: false, side: THREE.DoubleSide }),
    water: new THREE.MeshStandardMaterial({ color: '#9cc9e4', transparent: true, opacity: 0.6, roughness: 0.02, metalness: 0.15, envMapIntensity: 2.6, depthWrite: false, side: THREE.DoubleSide }),
    wet: new THREE.MeshStandardMaterial({ color: '#a4bccb', transparent: true, opacity: 0.72, roughness: 0.02, metalness: 0.2, envMapIntensity: 2.2, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }),
    tea: new THREE.MeshStandardMaterial({ color: '#9a5a1e', transparent: true, opacity: 0.8, roughness: 0.04, metalness: 0.05, envMapIntensity: 1.8, side: THREE.DoubleSide }),
    teaPool: new THREE.MeshStandardMaterial({ color: '#8a4e18', transparent: true, opacity: 0.74, roughness: 0.02, metalness: 0.1, envMapIntensity: 2.0, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }),
    shard: new THREE.MeshStandardMaterial({ color: '#f4fbff', transparent: true, opacity: 0.85, roughness: 0.02, metalness: 0.3, envMapIntensity: 2.4, side: THREE.DoubleSide, depthWrite: false }),
    clock: fuStd('#ffffff', 0.5, 0, { map: fuTex(fuClockFaceCanvas(), { repeat: false }) }),
    grape: fuStd('#6e8f2e', 0.28, 0.0, { envMapIntensity: 1.3 }), orange: fuStd('#e88a22', 0.55), towel: fuStd('#ffffff', 0.95, 0, { map: fuTex(fuCanvas(64, 64, (g, w, h) => { g.fillStyle = '#f2efe8'; g.fillRect(0, 0, w, h); g.fillStyle = '#b8322a'; for (let x = 0; x < w; x += 16) g.fillRect(x, 0, 5, h); for (let y = 0; y < h; y += 16) g.fillRect(0, y, w, 4); }), { repeat: false }), side: THREE.DoubleSide }),
    bread: fuStd('#c88a48', 0.85), crumb: fuStd('#d8a868', 0.9),
  };
  M.jars = ['#e8d9b0', '#c9a36a', '#7a5a3a', '#e8e4dc'].map((c) => fuStd(c, 0.6));
  M.books = ['#7a2e2a', '#2f4a6b', '#d9c9a3', '#3c5a3c', '#b8862e', '#1f2a36'].map((c) => fuStd(c, 0.8));

  const L = FU_ROOM, W = L.W / 2, D = L.D / 2, H = L.H;
  const room = new THREE.Group(); room.name = 'room'; room.position.set(...L.origin); scene.add(room); R.room = room;
  room.updateMatrixWorld(true);
  R.toWorld = (x, y, z, out) => (out || new THREE.Vector3()).set(x, y, z).applyMatrix4(room.matrixWorld);
  R.toLocal = (v, out) => (out || new THREE.Vector3()).copy(v).applyMatrix4(new THREE.Matrix4().copy(room.matrixWorld).invert());
  const T = 0.25;
  // ---- floor, ceiling, walls (south: the window; north: the door)
  fuBox(L.W, 0.2, L.D, M.floor, 0, -0.1, 0, room);
  fuBox(L.W + 0.5, 0.25, L.D + 0.5, M.ceil, 0, H + 0.125, 0, room);
  fuBox(T, H, L.D + 0.5, M.wallL, -W - T / 2, H / 2, 0, room);
  fuBox(T, H, L.D + 0.5, M.wall, W + T / 2, H / 2, 0, room);
  const wi = L.win;
  for (const c of fuWallCells(-W - T, W + T, 0, H, [[wi.x[0], wi.x[1], wi.y[0], wi.y[1]]])) fuBox(c[1] - c[0], c[3] - c[2], T, M.wall, (c[0] + c[1]) / 2, (c[2] + c[3]) / 2, -D - T / 2, room);
  const dr = L.door;
  for (const c of fuWallCells(-W - T, W + T, 0, H, [[dr.x[0], dr.x[1], 0, dr.h]])) fuBox(c[1] - c[0], c[3] - c[2], T, M.wall, (c[0] + c[1]) / 2, (c[2] + c[3]) / 2, D + T / 2, room);
  { const dd = fuBox(dr.x[1] - dr.x[0] - 0.02, dr.h - 0.01, 0.04, M.door, (dr.x[0] + dr.x[1]) / 2, dr.h / 2, D + 0.06, room); fuBox(0.12, 0.03, 0.05, M.handle, dr.x[0] + 0.12, 1.02, D + 0.02, room); dd.castShadow = true; }
  for (const [a, b] of [[dr.x[0] - 0.05, dr.x[0]], [dr.x[1], dr.x[1] + 0.05]]) fuBox(b - a, dr.h + 0.05, 0.06, M.frame, (a + b) / 2, dr.h / 2, D - 0.02, room);
  fuBox(dr.x[1] - dr.x[0] + 0.1, 0.05, 0.06, M.frame, (dr.x[0] + dr.x[1]) / 2, dr.h + 0.025, D - 0.02, room);
  for (const [x, z, w, d] of [[0.3, -D + 0.01, L.W - 1, 0.02], [W - 0.01, 0, 0.02, L.D]]) fuBox(w, 0.1, d, M.skirt, x, 0.05, z, room);
  // ---- the window: the left pane fixed, the right one a casement hinged on its right (it opens outwards, for the apple)
  { const z = -D - 0.12, x0 = wi.x[0], x1 = wi.x[1], sp = wi.split, y0 = wi.y[0], y1 = wi.y[1], cy = (y0 + y1) / 2, hh = y1 - y0;
    for (const [bx, by, bw, bh] of [[(x0 + x1) / 2, y1 - 0.03, x1 - x0, 0.06], [(x0 + x1) / 2, y0 + 0.03, x1 - x0, 0.06], [x0 + 0.03, cy, 0.06, hh], [x1 - 0.03, cy, 0.06, hh], [sp, cy, 0.06, hh]]) fuBox(bw, bh, 0.08, M.frame, bx, by, z, room);
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(sp - x0 - 0.09, hh - 0.1), M.glass); gl.position.set((x0 + sp) / 2, cy, z); gl.renderOrder = 4; room.add(gl);
    // the casement: hinged at x1 (outer face of the wall), its sash and glass
    const cs = new THREE.Group(); cs.position.set(x1 - 0.06, cy, -D - 0.2); room.add(cs); R.casement = cs;
    const w = x1 - 0.06 - (sp + 0.03);
    for (const [bx, by, bw, bh] of [[-w / 2, hh / 2 - 0.1, w, 0.05], [-w / 2, -hh / 2 + 0.1, w, 0.05], [-0.025, 0, 0.05, hh - 0.15], [-w + 0.025, 0, 0.05, hh - 0.15]]) fuBox(bw, bh, 0.05, M.frame, bx, by, 0, cs);
    const g2 = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.08, hh - 0.25), M.glass); g2.position.set(-w / 2, 0, 0); g2.renderOrder = 4; cs.add(g2);
    fuBox(0.025, 0.12, 0.03, M.handle, -w + 0.05, 0, 0.04, cs);
    const sl = L.sill; fuBox(sl.x[1] - sl.x[0], sl.y[1] - sl.y[0], sl.z[1] - sl.z[0], M.frame, (sl.x[0] + sl.x[1]) / 2, (sl.y[0] + sl.y[1]) / 2, (sl.z[0] + sl.z[1]) / 2, room);
    const rd = L.rad, rx = (rd.x[0] + rd.x[1]) / 2, rw = rd.x[1] - rd.x[0];
    for (let i = 0; i < 16; i++) fuBox(0.05, rd.y[1] - rd.y[0], 0.06, M.rad, rd.x[0] + 0.05 + i * (rw - 0.1) / 15, (rd.y[0] + rd.y[1]) / 2, -D + 0.05, room);
    fuBox(rw, 0.03, 0.08, M.rad, rx, rd.y[1] - 0.015, -D + 0.05, room); fuBox(rw, 0.03, 0.08, M.rad, rx, rd.y[0] + 0.015, -D + 0.05, room);
    // on the sill: a basil pot, a little cactus
    fuCyl(0.07, 0.055, 0.12, M.terracotta, -0.7, 0.86 + 0.06, -1.94, room, 14);
    for (let k = 0; k < 7; k++) { const a = k * 0.9; fuMesh(new THREE.SphereGeometry(0.035, 8, 6).scale(1.3, 0.5, 0.9), k % 2 ? M.leaf : M.leaf2, -0.7 + Math.cos(a) * 0.04, 1.0 + 0.03 * (k % 3), -1.94 + Math.sin(a) * 0.04, room); }
    fuCyl(0.04, 0.035, 0.07, M.ceramicB, 1.15, 0.86 + 0.035, -1.94, room, 12); fuMesh(new THREE.SphereGeometry(0.03, 10, 8).scale(1, 1.6, 1), M.leaf, 1.15, 0.96, -1.94, room);
  }
  // ---- the counter run along the left wall: base units (sage doors), the oak worktop, the sink, the hob; the splashback
  { const C = L.counter, x0 = C.x[0], x1 = C.x[1], dz = C.z[1] - C.z[0], cz = (C.z[0] + C.z[1]) / 2;
    fuBox(x1 - x0 - 0.06, 0.1, dz, M.black, (x0 + x1) / 2 - 0.03, 0.05, cz, room);                 // plinth
    fuBox(x1 - x0 - 0.02, C.top - 0.14, dz, M.cab, (x0 + x1) / 2 - 0.01, 0.1 + (C.top - 0.14) / 2, cz, room);
    const nD = 5; for (let i = 0; i < nD; i++) { const z0 = C.z[0] + i * dz / nD, z1 = z0 + dz / nD;
      fuMesh(fuRoundBox(0.02, C.top - 0.2, z1 - z0 - 0.008, 0.004, 0.003), M.cabD, x1 + 0.0, 0.12, (z0 + z1) / 2, room);
      fuBox(0.025, 0.012, 0.16, M.steel, x1 + 0.025, C.top - 0.18, (z0 + z1) / 2, room); }
    fuBox(x1 - x0 + 0.03, 0.04, dz + 0.02, M.top, (x0 + x1) / 2 + 0.015, C.top - 0.02, cz, room);
    // the splashback (tiles) up to the wall cupboards
    const sb = new THREE.Mesh(new THREE.PlaneGeometry(dz, 0.58), M.splash); sb.position.set(-W + 0.004, C.top + 0.29, cz); sb.rotation.y = Math.PI / 2; sb.receiveShadow = true; room.add(sb);
    // the sink (a steel basin set in the top) and its tap
    const sk = L.sink; fuBox(0.42, 0.005, sk.w, M.steelD, -2.2, C.top + 0.001, sk.z, room); fuBox(0.36, 0.004, sk.w - 0.08, fuStd('#4a4e52', 0.3, 0.8), -2.2, C.top + 0.004, sk.z, room);
    { const tp = fuCyl(0.015, 0.018, 0.28, M.steel, -2.42, C.top + 0.14, sk.z, room, 12); void tp; const sp = fuCyl(0.012, 0.012, 0.2, M.steel, -2.33, C.top + 0.28, sk.z, room, 10); sp.rotation.z = Math.PI / 2; }
    // the hob: black glass, four rings
    fuBox(0.52, 0.006, 0.56, M.hob, -2.2, C.top + 0.003, L.hob.z, room);
    for (const [dx, dz2, r] of [[-0.12, -0.13, 0.09], [-0.12, 0.13, 0.07], [0.12, -0.13, 0.07], [0.12, 0.13, 0.09]]) { const rg = new THREE.Mesh(new THREE.RingGeometry(r - 0.006, r, 32), M.ring); rg.rotation.x = -Math.PI / 2; rg.position.set(-2.2 + dx, C.top + 0.0075, L.hob.z + dz2); room.add(rg); }
    // the kettle's base, a knife block, the bread board, a fruit bowl by the window
    fuCyl(0.09, 0.095, 0.02, M.black, ...[L.kettle[0], C.top + 0.01, L.kettle[2]], room, 24);
    { const kb = fuBox(0.1, 0.22, 0.12, M.woodD, -2.38, C.top + 0.11, 0.05, room); kb.rotation.x = -0.15; for (let k = 0; k < 4; k++) fuBox(0.016, 0.08, 0.012, M.black, -2.38, C.top + 0.25, 0.01 + k * 0.026, room); }
    fuBox(0.3, 0.02, 0.42, M.wood, -2.22, C.top + 0.01, 0.95, room);
    { const fb = fuCyl(0.13, 0.08, 0.07, M.ceramicR, -2.25, C.top + 0.035, -1.62, room, 20); void fb; for (const [dx, dz2, c] of [[0.03, 0.02, M.orange], [-0.04, -0.02, fuStd('#c8321e', 0.45)], [0.0, 0.05, fuStd('#e2c43a', 0.5)]]) fuMesh(new THREE.SphereGeometry(0.04, 12, 9), c, -2.25 + dx, C.top + 0.1, -1.62 + dz2, room); }
    // the wall cupboards (with a light strip under them)
    const wc = L.wallCab, wz = (wc.z[0] + wc.z[1]) / 2, wd = wc.z[1] - wc.z[0];
    fuBox(wc.x[1] - wc.x[0], wc.y[1] - wc.y[0], wd, M.cab, (wc.x[0] + wc.x[1]) / 2, (wc.y[0] + wc.y[1]) / 2, wz, room);
    for (let i = 0; i < 4; i++) { const z0 = wc.z[0] + i * wd / 4; fuMesh(fuRoundBox(0.02, wc.y[1] - wc.y[0] - 0.02, wd / 4 - 0.008, 0.004, 0.003), M.cabD, wc.x[1], wc.y[0] + 0.01, z0 + wd / 8, room); fuBox(0.025, 0.14, 0.012, M.steel, wc.x[1] + 0.025, wc.y[0] + 0.12, z0 + wd / 8 + (i % 2 ? -1 : 1) * (wd / 8 - 0.06), room); }
    fuBox(0.02, 0.01, wd - 0.1, new THREE.MeshBasicMaterial({ color: '#fff3dc' }), wc.x[1] - 0.06, wc.y[0] - 0.006, wz, room);
    const ul = new THREE.RectAreaLight ? null : null; void ul;
  }
  // ---- the fridge
  { const F = L.fridge, cx = (F.x[0] + F.x[1]) / 2, cz = (F.z[0] + F.z[1]) / 2;
    fuMesh(fuRoundBox(F.x[1] - F.x[0], F.h, F.z[1] - F.z[0], 0.03, 0.02), M.fridge, cx, 0, cz, room);
    fuBox(0.004, 0.006, F.z[1] - F.z[0] - 0.04, M.steelD, F.x[1] + 0.001, 1.2, cz, room);
    fuBox(0.03, 0.4, 0.025, M.steel, F.x[1] + 0.02, 1.45, F.z[0] + 0.08, room); fuBox(0.03, 0.3, 0.025, M.steel, F.x[1] + 0.02, 0.92, F.z[0] + 0.08, room);
    // magnets and a child's drawing
    const dw = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.29), fuStd('#ffffff', 0.9, 0, { map: fuTex(fuCanvas(128, 176, (g, w, h) => { g.fillStyle = '#fbf8f0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2a6ac8'; g.lineWidth = 5; g.beginPath(); g.arc(64, 60, 30, 0, 6.28); g.stroke(); g.fillStyle = '#e8b42a'; g.beginPath(); g.arc(98, 28, 16, 0, 6.28); g.fill(); g.strokeStyle = '#3a8a3a'; g.beginPath(); g.moveTo(10, 150); g.lineTo(118, 150); g.stroke(); g.strokeStyle = '#c8321e'; g.beginPath(); g.moveTo(64, 90); g.lineTo(64, 140); g.moveTo(40, 110); g.lineTo(88, 110); g.stroke(); }), { repeat: false }) }));
    dw.position.set(F.x[1] + 0.003, 1.5, cz + 0.12); dw.rotation.y = Math.PI / 2; room.add(dw);
  }
  // ---- the table, its chairs
  { const tb = L.table, t = tb.top;
    fuMesh(fuRoundBox(tb.w, 0.04, tb.d, 0.015, 0.008), M.wood, tb.x, t - 0.04, tb.z, room);
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) fuBox(0.05, t - 0.04, 0.05, M.woodD, tb.x + dx * (tb.w / 2 - 0.08), (t - 0.04) / 2, tb.z + dz * (tb.d / 2 - 0.08), room);
    // a runner and a jug of flowers at the far end
    fuBox(0.36, 0.003, tb.d - 0.1, fuStd('#c9b99a', 0.95), tb.x - 0.45, t + 0.0015, tb.z, room);
    fuCyl(0.045, 0.055, 0.16, M.ceramicB, tb.x - 0.45, t + 0.08, tb.z - 0.1, room, 14);
    for (let k = 0; k < 6; k++) { const a = k * 1.05; fuMesh(new THREE.SphereGeometry(0.025, 8, 6), fuStd(k % 2 ? '#e8c24a' : '#f2efe6', 0.7), tb.x - 0.45 + Math.cos(a) * 0.05, t + 0.25 + 0.03 * (k % 2), tb.z - 0.1 + Math.sin(a) * 0.05, room); }
    // your mug of tea, a bowl of grapes
    fuCyl(0.11, 0.05, 0.06, M.ceramic, tb.x + 0.35, t + 0.03, tb.z + 0.05, room, 20);
    for (let k = 0; k < 9; k++) fuMesh(new THREE.SphereGeometry(0.012, 10, 8).scale(1, 1.15, 1), M.grape, tb.x + 0.35 + 0.035 * Math.cos(k * 2.4) * (k % 3 ? 1 : 0.4), t + 0.06 + 0.012 * (k % 3), tb.z + 0.05 + 0.035 * Math.sin(k * 2.4) * (k % 3 ? 1 : 0.4), room);
    const chair = (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; room.add(g);
      fuMesh(fuRoundBox(0.42, 0.035, 0.42, 0.02, 0.01), M.wood, 0, 0.44, 0, g);
      for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) fuBox(0.035, 0.44, 0.035, M.woodD, dx * 0.18, 0.22, dz * 0.18, g);
      for (const dx of [-1, 1]) fuBox(0.035, 0.45, 0.035, M.woodD, dx * 0.18, 0.69, 0.19, g);
      for (const y of [0.72, 0.86]) fuBox(0.38, 0.05, 0.025, M.wood, 0, y, 0.19, g); };
    chair(tb.x - 0.35, tb.z + 0.62, 0); chair(tb.x + 0.35, tb.z - 0.62, Math.PI); chair(tb.x - 0.35, tb.z - 0.62, Math.PI); chair(tb.x + 0.98, tb.z, -Math.PI / 2);
  }
  // ---- the lamp over the table: a ceiling rose, the flex, a dome shade
  { const lp = L.lamp, g = new THREE.Group(); g.position.set(lp.x, H, lp.z); room.add(g); R.lamp = g;
    fuCyl(0.05, 0.05, 0.03, M.white, 0, -0.015, 0, g, 18);
    fuCyl(0.004, 0.004, lp.cord, M.flex, 0, -lp.cord / 2, 0, g, 6);
    const pts = []; for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI / 2; pts.push(new THREE.Vector2(0.03 + 0.2 * Math.sin(a), -0.17 * (1 - Math.cos(a)) * 0 - 0.17 * Math.sin(a) * 0 + 0.17 * Math.cos(a) - 0.17)); }
    const sh = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), M.shade); sh.position.y = -lp.cord; sh.castShadow = true; g.add(sh);
    const shi = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), M.shadeIn); shi.position.y = -lp.cord - 0.002; shi.scale.setScalar(0.985); g.add(shi);
    fuMesh(new THREE.SphereGeometry(0.035, 12, 8), M.bulb, 0, -lp.cord - 0.1, 0, g);
  }
  // ---- the open shelves on the right wall: jars, plates, bowls, cookbooks, a trailing plant; the clock by the door
  { const sh = L.shelves, z0 = sh.z[0], z1 = sh.z[1], zc = (z0 + z1) / 2, x = W - 0.13;
    for (const y of sh.y) { fuBox(0.26, 0.03, z1 - z0, M.wood, x, y, zc, room); for (const z of [z0 + 0.1, z1 - 0.1]) fuBox(0.03, 0.12, 0.03, M.black, W - 0.03, y - 0.07, z, room); }
    const r = new RNG(41);
    // shelf 1: jars
    for (let k = 0; k < 5; k++) { const z = z0 + 0.22 + k * 0.33, h = r.range(0.12, 0.2); fuCyl(0.05, 0.05, h, M.cup, x, sh.y[0] + 0.015 + h / 2, z, room, 14); fuCyl(0.046, 0.046, h * 0.7, M.jars[k % 4], x, sh.y[0] + 0.015 + h * 0.35, z, room, 12); fuCyl(0.052, 0.052, 0.02, M.woodD, x, sh.y[0] + 0.025 + h, z, room, 14); }
    // shelf 2: plates on edge, bowls
    for (let k = 0; k < 6; k++) { const p = fuCyl(0.11, 0.11, 0.012, k % 2 ? M.ceramic : M.ceramicB, x + 0.02, sh.y[1] + 0.12, z0 + 0.2 + k * 0.03, room, 24); p.rotation.x = Math.PI / 2 - 0.12; }
    for (let k = 0; k < 3; k++) fuCyl(0.07, 0.045, 0.06 - k * 0.008, M.ceramicR, x, sh.y[1] + 0.045 + k * 0.03, z0 + 0.95, room, 18);
    for (let k = 0; k < 5; k++) fuBox(0.17, 0.22 + 0.02 * (k % 2), 0.035, M.books[k % 6], x, sh.y[1] + 0.13, z0 + 1.45 + k * 0.04, room);
    // shelf 3: a trailing plant, a teapot
    fuCyl(0.08, 0.06, 0.12, M.terracotta, x, sh.y[2] + 0.075, z0 + 0.4, room, 14);
    for (let k = 0; k < 14; k++) { const a = r.range(0, 6.28), dd = r.range(0.02, 0.12); const lf = fuMesh(new THREE.SphereGeometry(0.03, 8, 6).scale(1.4, 0.4, 0.9), k % 2 ? M.leaf : M.leaf2, x + Math.cos(a) * dd * 0.6, sh.y[2] + 0.15 - k * 0.025 * (k % 3 === 0 ? 1 : 0.2), z0 + 0.4 + Math.sin(a) * dd, room); lf.rotation.set(r.range(-1, 1), a, r.range(-0.6, 0.6)); }
    fuMesh(new THREE.SphereGeometry(0.08, 18, 12).scale(1, 0.8, 1), M.ceramic, x, sh.y[2] + 0.08, z0 + 1.3, room);
  }
  // the clock on the right wall, near the door (it shows the time: 3 PM and the minutes going by)
  { const ck = L.clock, g = new THREE.Group(); g.position.set(ck.x, ck.y, ck.z); g.rotation.y = -Math.PI / 2; room.add(g);
    const f = fuCyl(0.15, 0.15, 0.035, M.black, 0, 0, -0.0175, g, 32); f.rotation.x = Math.PI / 2;
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.137, 32), M.clock); face.position.z = 0.001; g.add(face);
    R.hands = [0.085, 0.115, 0.125].map((l, i) => { const h = new THREE.Group(); h.position.z = 0.004 + i * 0.002; g.add(h); fuBox([0.01, 0.007, 0.003][i], l, 0.003, i === 2 ? fuStd('#b8322a', 0.5) : M.black, 0, l / 2 - 0.015, 0, h); return h; }); }
  // the cat's bowl by the fridge
  { const pts = []; for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2; pts.push(new THREE.Vector2(0.075 + 0.025 * Math.sin(a), 0.05 * (1 - Math.cos(a)))); }
    fuMesh(new THREE.LatheGeometry([new THREE.Vector2(0, 0.004), new THREE.Vector2(0.06, 0.004), ...pts], 24), fuStd('#c95a3a', 0.35), -1.55, 0, 1.55, room).material.side = THREE.DoubleSide; }

  // ==================================================================== THE THINGS THAT FALL UP
  // ---- the glass of water (in your hand under the title): a tumbler 12 cm tall, two-thirds full
  { const g = new THREE.Group(); room.add(g); R.glassG = g;
    const pts = [new THREE.Vector2(0.0, 0), new THREE.Vector2(0.03, 0), new THREE.Vector2(0.032, 0.008), new THREE.Vector2(0.036, 0.12), new THREE.Vector2(0.034, 0.12), new THREE.Vector2(0.03, 0.012), new THREE.Vector2(0.0, 0.012)];
    const gm = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), M.cup); gm.position.y = -0.06; gm.renderOrder = 6; g.add(gm);
    const wm = new THREE.Mesh(new THREE.CylinderGeometry(0.0315, 0.0285, 0.068, 24), M.water); wm.position.y = -0.06 + 0.012 + 0.034; wm.renderOrder = 5; g.add(wm); R.glassWater = wm; }
  R.shards = Array.from({ length: 26 }, (_, i) => { const m = new THREE.Mesh(fuShardGeo(i), M.shard); m.visible = false; m.renderOrder = 6; room.add(m); return m; });
  // ---- the puddles on the ceiling (water from the glass, the tea), and the drops (fuPuffs: world.js draws them)
  // a puddle's shading: darker towards its edge (the meniscus), a bright rim, a soft sheen (ShapeGeometry uv = x, y ∈ ±1.25)
  { const c = fuCanvas(256, 256, (g, w, h) => { const cx = w / 2, R0 = w / 2 / 1.25; g.fillStyle = '#9a9a9a'; g.fillRect(0, 0, w, h);
      const gr = g.createRadialGradient(cx, cx, 0, cx, cx, R0 * 1.25); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.55, '#e8e8e8'); gr.addColorStop(0.74, '#a8a8a8'); gr.addColorStop(0.8, '#f2f2f2'); gr.addColorStop(0.86, '#9a9a9a'); gr.addColorStop(1, '#9a9a9a');
      g.fillStyle = gr; g.fillRect(0, 0, w, h); g.globalAlpha = 0.5; g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(cx - 30, cx - 26, 46, 14, -0.5, 0, 6.283); g.fill(); });
    for (const mm of [M.teaPool, M.wet]) { const t = fuTex(c, { repeat: false }); t.repeat.set(0.4, 0.4); t.offset.set(0.5, 0.5); mm.map = t; mm.needsUpdate = true; } }
  const pool = (mat) => { const m = new THREE.Mesh(fuBlobDisc(), mat); m.rotation.x = Math.PI / 2; m.visible = false; m.renderOrder = 3; room.add(m); return m; };
  R.poolW = pool(M.wet); R.poolT = pool(M.teaPool);
  R.poolT2 = pool(M.teaPool); R.poolW2 = pool(M.wet);                                   // (after 3:10: on the table)
  // ---- the spoon and the grape
  { const g = new THREE.Group(); room.add(g); R.spoon = g;
    const bowl = fuMesh(new THREE.SphereGeometry(0.02, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(0.8, 0.35, 1.25), M.steel, 0, 0, 0.055, g); bowl.rotation.x = Math.PI; bowl.material.side = THREE.DoubleSide;
    const h = fuBox(0.008, 0.003, 0.11, M.steel, 0, 0.002, -0.025, g); void h; }
  R.grape = fuMesh(new THREE.SphereGeometry(0.011, 14, 10).scale(1, 1.18, 1), M.grape, 0, 0, 0, room);
  // ---- the tea: the stream (a tube rebuilt each frame along its path) and its splash
  { const m = new THREE.Mesh(new THREE.BufferGeometry(), M.tea); m.visible = false; m.frustumCulled = false; m.renderOrder = 5; room.add(m); R.stream = m; }
  // ---- what was dropped while we were away (FU_CLUTTER)
  R.clutter = FU_CLUTTER.map(([id, kind, x, z, ry, at]) => { const g = new THREE.Group(); room.add(g); const h = fuClutterBuild(kind, g, M); return { id, kind, x, z, ry, at, g, h }; });
  R.update = (s, o) => fuRoomUpdate(R, s, o || {});
  return R;
}

// a puddle: a disc with a wobbly edge (unit radius; scaled), its own seed
function fuBlobDisc(seed = 3) {
  const sh = new THREE.Shape(), n = 120;
  for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, r = 1 + 0.12 * Math.sin(a * 3 + seed) + 0.07 * Math.sin(a * 7 + seed * 2) + 0.05 * Math.sin(a * 11 + seed * 3); if (i) sh.lineTo(Math.cos(a) * r, Math.sin(a) * r); else sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  return new THREE.ShapeGeometry(sh, 2);
}
// the clutter's meshes (origin: its centre); returns its half-thickness (how far it hangs below the ceiling)
function fuClutterBuild(kind, g, M) {
  switch (kind) {
    case 'towel': { const geo = new THREE.PlaneGeometry(0.45, 0.32, 8, 6), p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, 0.015 * Math.sin(p.getX(i) * 18) * Math.cos(p.getY(i) * 14)); geo.computeVertexNormals(); const m = fuMesh(geo, M.towel, 0, 0, 0, g); m.rotation.x = -Math.PI / 2; return 0.01; }
    case 'orange': fuMesh(new THREE.SphereGeometry(0.037, 16, 12), M.orange, 0, 0, 0, g); return 0.037;
    case 'fork': fuBox(0.012, 0.004, 0.18, M.steel, 0, 0, 0, g); for (let k = 0; k < 4; k++) fuBox(0.003, 0.003, 0.045, M.steel, -0.009 + k * 0.006, 0, 0.11, g); return 0.003;
    case 'bread': fuMesh(fuRoundBox(0.22, 0.1, 0.11, 0.04, 0.03), M.bread, 0, -0.05, 0, g); return 0.05;
    case 'pen': { const p = fuCyl(0.005, 0.005, 0.14, fuStd('#1f4a9a', 0.4), 0, 0, 0, g, 8); p.rotation.x = Math.PI / 2; return 0.005; }
    case 'napkin': { const m = fuMesh(new THREE.PlaneGeometry(0.2, 0.2), fuStd('#f6f2e8', 0.95, 0, { side: THREE.DoubleSide }), 0, 0, 0, g); m.rotation.x = -Math.PI / 2; return 0.002; }
    case 'wspoon': fuBox(0.025, 0.012, 0.28, M.wood, 0, 0, 0, g); fuMesh(new THREE.SphereGeometry(0.03, 10, 6).scale(1, 0.3, 1.4), M.wood, 0, 0, 0.14, g); return 0.01;
    case 'cereal': { const lab = fuLabelCanvas('OATS', '#d9a63a', '#5a2a10', 128, 192); fuMesh(new THREE.BoxGeometry(0.19, 0.06, 0.27), [fuStd('#c99a3a', 0.8), fuStd('#c99a3a', 0.8), fuStd('#ffffff', 0.8, 0, { map: fuTex(lab, { repeat: false }) }), fuStd('#ffffff', 0.8, 0, { map: fuTex(lab, { repeat: false }) }), fuStd('#c99a3a', 0.8), fuStd('#c99a3a', 0.8)], 0, 0, 0, g); return 0.03; }
    case 'bottle': { const b = fuCyl(0.032, 0.032, 0.22, new THREE.MeshStandardMaterial({ color: '#7ab0d0', transparent: true, opacity: 0.5, roughness: 0.1 }), 0, 0, 0, g, 14); b.rotation.x = Math.PI / 2; const c = fuCyl(0.014, 0.014, 0.02, fuStd('#2a5aa8', 0.5), 0, 0, 0.12, g, 10); c.rotation.x = Math.PI / 2; return 0.032; }
    case 'catball': fuMesh(new THREE.SphereGeometry(0.022, 12, 9), fuStd('#e8322a', 0.5), 0, 0, 0, g); return 0.022;
    case 'keys': fuMesh(new THREE.TorusGeometry(0.014, 0.0025, 6, 16), M.steel, 0, 0, 0, g).rotation.x = Math.PI / 2; for (let k = 0; k < 3; k++) { const kk = fuBox(0.012, 0.003, 0.05, k ? M.steel : fuStd('#c8a24a', 0.3, 0.8), 0, 0, 0.035, g); kk.position.x = (k - 1) * 0.012; kk.rotation.y = (k - 1) * 0.35; } return 0.003;
    case 'plate': { // broken in three
      for (let k = 0; k < 3; k++) { const m = fuMesh(new THREE.CylinderGeometry(0.12, 0.11, 0.012, 16, 1, false, k * 2.1, 1.9), M.ceramic, Math.cos(k * 2.1 + 0.95) * 0.03, 0, Math.sin(k * 2.1 + 0.95) * 0.03, g); void m; } return 0.006; }
    case 'book': fuBox(0.13, 0.026, 0.2, M.books[1], 0, 0, 0, g); fuBox(0.122, 0.022, 0.19, fuStd('#f2ead8', 0.9), 0.006, 0, 0, g); return 0.013;
    case 'mug': { const m = fuCyl(0.04, 0.038, 0.095, M.ceramicB, 0, 0, 0, g, 18); m.rotation.x = Math.PI / 2; const h = fuMesh(new THREE.TorusGeometry(0.026, 0.007, 6, 14, Math.PI), M.ceramicB, 0.04, 0, 0, g); h.rotation.set(Math.PI / 2, 0, -Math.PI / 2); return 0.04; }
    case 'board': fuMesh(fuRoundBox(0.34, 0.018, 0.22, 0.02, 0.006), M.wood, 0, 0, 0, g); return 0.009;
    case 'roll': { const r = fuCyl(0.055, 0.055, 0.24, fuStd('#f7f5ef', 0.95), 0, 0, 0, g, 20); r.rotation.z = Math.PI / 2; return 0.055; }
    case 'banana': { const b = fuMesh(new THREE.TorusGeometry(0.09, 0.017, 8, 16, 1.6), fuStd('#e8c63a', 0.6), 0, 0, 0, g); b.rotation.x = Math.PI / 2; return 0.017; }
    case 'tin': { const l = fuLabelCanvas('TOMATOES', '#c8382a', '#f6efe0', 192, 96); const c = fuMesh(new THREE.CylinderGeometry(0.037, 0.037, 0.11, 18), [fuStd('#ffffff', 0.6, 0, { map: fuTex(l, { repeat: false }) }), M.steel, M.steel], 0, 0, 0, g); c.rotation.z = Math.PI / 2; return 0.037; }
    case 'remote': fuBox(0.045, 0.02, 0.17, M.black, 0, 0, 0, g); fuBox(0.012, 0.004, 0.012, fuStd('#c8322a', 0.5), 0, 0.011, 0.06, g); return 0.01;
    case 'paper': { const c = fuCanvas(128, 160, (x, w, h) => { x.fillStyle = '#e9e5da'; x.fillRect(0, 0, w, h); x.fillStyle = '#2a2a2a'; x.fillRect(8, 8, w - 16, 14); x.fillStyle = '#8a8a86'; for (let y = 30; y < h - 6; y += 6) for (let col = 0; col < 3; col++) x.fillRect(8 + col * 38, y, 34, 2); });
      const m = fuMesh(new THREE.PlaneGeometry(0.3, 0.38), fuStd('#ffffff', 0.95, 0, { map: fuTex(c, { repeat: false }), side: THREE.DoubleSide }), 0, 0, 0, g); m.rotation.x = -Math.PI / 2; return 0.003; }
    case 'slipper': fuMesh(fuRoundBox(0.1, 0.05, 0.26, 0.03, 0.02), fuStd('#7a8a9a', 0.95), 0, 0, 0, g); return 0.025;
    case 'lid': { fuCyl(0.1, 0.1, 0.01, M.steelD, 0, 0, 0, g, 24); fuCyl(0.015, 0.015, 0.025, M.black, 0, -0.015, 0, g, 10); return 0.02; }
    case 'cushion': fuMesh(fuRoundBox(0.38, 0.1, 0.38, 0.05, 0.04), fuStd('#b8533a', 0.95), 0, 0, 0, g); return 0.05;
    case 'phone': fuBox(0.072, 0.008, 0.15, M.black, 0, 0, 0, g); return 0.004;
    case 'jar': { const j = fuCyl(0.045, 0.045, 0.12, new THREE.MeshStandardMaterial({ color: '#d8e4e8', transparent: true, opacity: 0.5, roughness: 0.1 }), 0, 0, 0, g, 16); j.rotation.x = Math.PI / 2; fuCyl(0.04, 0.04, 0.11, fuStd('#c8932a', 0.5), 0, 0, 0, g, 12).rotation.x = Math.PI / 2; return 0.045; }
    case 'sock': fuMesh(fuRoundBox(0.08, 0.025, 0.24, 0.02, 0.012), fuStd('#3a6a4a', 0.95), 0, 0, 0, g); return 0.013;
    case 'crumbs': for (let k = 0; k < 18; k++) fuMesh(new THREE.BoxGeometry(0.008, 0.006, 0.01), M.crumb, (fuR(k, 8) - 0.5) * 0.3, 0, (fuR(k, 9) - 0.5) * 0.25, g); return 0.004;
  }
  return 0.01;
}

// where the glass's water and the tea pool on the ceiling (room-local [x, z]) and how big they get
const FU_POOL = { waterR: 0.34, teaR: 0.4 };

function fuRoomUpdate(R, s, o) {
  const L = FU_ROOM, C = FU_CEIL, rel = o.rel || {}, out = o.drops;                     // out: [x, y, z, size, alpha, r, g, b] (room-local) for the drops
  const dropY = (top, rest) => fuDropBack(top, rest);
  // ---- the clock on the wall
  { const c = fuClockParts(s); R.hands[0].rotation.z = -((c.h % 12) + c.m / 60) / 12 * Math.PI * 2; R.hands[1].rotation.z = -(c.m + c.sec / 60) / 60 * Math.PI * 2; R.hands[2].rotation.z = -c.sec / 60 * Math.PI * 2; }
  // ---- the casement: opened for the apple (3:01:24), closed again by 3:08
  R.casement.rotation.y = 1.25 * fuSm(s, 83.5, 85.0) * (1 - fuSm(s, 300, 302));
  // ---- the glass: in your hand until s = 0 (world.js places it then: o.held.glass), then it falls up mouth first
  const G = R.glassG;
  if (o.held && o.held.glass) { G.visible = true; G.position.copy(o.held.glass); G.rotation.set(0, 0, 0); R.glassWater.visible = true; }
  else if (rel.glass) {
    const hop = fuHop(0, rel.glass[1], C - 0.06), hit = hop.hit;
    if (s < hit) { G.visible = true; G.position.set(rel.glass[0], hop.y(s), rel.glass[2]); G.rotation.set(0.03 * (s), 0, 0.05 * s); R.glassWater.visible = true; }
    else G.visible = false;
    // the shards: out from the hit, along the ceiling; a few drop off and fall back up; at 3:10 they all come down
    const u = s - hit;
    R.shards.forEach((m, i) => {
      if (u < 0) { m.visible = false; return; }
      const a = fuR(i, 11) * 6.283, d = 0.05 + 0.42 * Math.pow(fuR(i, 12), 1.6), k = 1 - Math.exp(-u / 0.09);
      let x = rel.glass[0] + Math.cos(a) * d * k, z = rel.glass[2] + Math.sin(a) * d * k;
      [x, z] = fuClear(x, z);
      let y = C - 0.002, bounce = fuR(i, 13) < 0.4 ? 0.25 * fuR(i, 14) : 0;
      if (bounce) { const v0 = Math.sqrt(2 * 9.81 * bounce), tb = 2 * v0 / 9.81; if (u < tb) y = C - 0.002 - (v0 * u - 4.905 * u * u); }
      if (s >= FUP.T) { const rest = fuRestY(x, z) + 0.002, f = dropY(C - 0.002, rest); y = f.y(s); }
      m.visible = true; m.position.set(x, y, z); const sp = s < FUP.T ? Math.exp(-u / 0.3) : 0; m.rotation.set(Math.PI + 0.3 * sp * Math.sin(u * 40 + i), a + 8 * (1 - Math.exp(-u / 0.2)) * fuR(i, 15), 0.2 * sp);
    });
    // the water: splashes out round the mouth, then a puddle on the ceiling
    R._wHit = [rel.glass[0], rel.glass[2], hit];
  } else G.visible = false;
  // ---- the spoon and the grape (o.held while in your hands; then up, together)
  for (const k of ['spoon', 'grape']) {
    const m = R[k], h = k === 'spoon' ? 0.006 : 0.012;
    if (o.held && o.held[k]) { m.visible = true; m.position.copy(o.held[k]); if (k === 'spoon') m.rotation.set(-1.25, 0.3, 0); continue; }
    if (!rel[k]) { m.visible = false; continue; }
    const hop = fuHop(FU.sSG, rel[k][1], C - h);
    let x = rel[k][0], z = rel[k][2], y = hop.y(s), u = s - hop.hit;
    if (k === 'grape' && u > 0) { const v0 = 0.35, tb = 2 * v0 / 9.81; if (u < tb) y -= v0 * u - 4.905 * u * u; x += 0.06 * (1 - Math.exp(-u / 0.6)); }
    if (s >= FUP.T) { const f = dropY(C - h, fuRestY(x, z) + h); y = f.y(s); }
    m.visible = true; m.position.set(x, y, z);
    if (k === 'spoon') m.rotation.set(u > 0 ? Math.PI : -1.25 + Math.min(1, Math.max(0, s - FU.sSG) / 0.6) * (Math.PI + 1.25), 0.3 + 0.2 * Math.max(0, Math.min(1, u / 0.1)), 0);
    else m.rotation.set(0, 0, u > 0 ? -x * 6 : 0);
  }
  // ---- the puddles: the glass's water (from its hit), the tea (where the stream lands, from the pour)
  const pools = [];
  if (R._wHit && s > R._wHit[2]) pools.push([R.poolW, R.poolW2, R._wHit[0], R._wHit[1], FU_POOL.waterR * (1 - Math.exp(-(s - R._wHit[2]) / 0.35)), M_WATER_ROT(0.4)]);
  if (o.teaHit && s > o.teaHit[2]) { const sp = Math.min(s, FU.sPour[1] + 0.6) - o.teaHit[2]; pools.push([R.poolT, R.poolT2, o.teaHit[0], o.teaHit[1], FU_POOL.teaR * Math.sqrt(Math.max(0, sp) / (FU.sPour[1] - FU.sPour[0] + 0.6)) * (1 + 0.15 * (1 - Math.exp(-Math.max(0, s - FU.sPour[1]) / 3))), 1.3]); }
  for (const P of [R.poolW, R.poolT, R.poolW2, R.poolT2]) P.visible = false;
  for (const [P, P2, x, z, r, rot] of pools) {
    if (r < 0.005) continue;
    if (s < FUP.T) { P.visible = true; P.position.set(x, C - 0.0015, z); P.scale.set(r, r, 1); P.rotation.set(Math.PI / 2, 0, rot); }
    else {                                                              // 3:10: it rains down onto whatever is under it
      const u = s - FUP.T, fall = Math.sqrt(2 * (C - fuRestY(x, z)) / 9.81);
      if (u < 0.15) { P.visible = true; P.position.set(x, C - 0.0015, z); P.scale.set(r * (1 - u / 0.15), r * (1 - u / 0.15), 1); }
      if (u > fall) { const k = Math.min(1, (u - fall) / 0.4); P2.visible = true; P2.position.set(x, fuRestY(x, z) + 0.002, z); P2.scale.set(r * 1.25 * k, r * 1.25 * k, 1); P2.rotation.set(-Math.PI / 2, 0, rot); }
      if (out) for (let i = 0; i < 70; i++) {                         // the drops: each leaves the ceiling a moment apart and falls
        const d0 = fuR(i, 41) * 0.15, uu = u - d0; if (uu < 0) continue; const y = C - 4.905 * uu * uu, rest = fuRestY(x, z); if (y < rest) continue;
        const a = fuR(i, 42) * 6.283, rr = r * Math.sqrt(fuR(i, 43)); out.push([x + Math.cos(a) * rr, y, z + Math.sin(a) * rr, 0.006 + 0.008 * fuR(i, 44), 0.75, P === R.poolT ? 0.6 : 0.85, P === R.poolT ? 0.36 : 0.92, P === R.poolT ? 0.14 : 0.98]); }
    }
  }
  // the glass's water splashing at the hit (drops flung out along the ceiling, falling back up to it)
  if (out && R._wHit) { const u = s - R._wHit[2]; if (u > 0 && u < 0.6) for (let i = 0; i < 60; i++) { const a = fuR(i, 51) * 6.283, v = 0.6 + 2.2 * fuR(i, 52), vd = 0.4 + 1.6 * fuR(i, 53), tb = 2 * vd / 9.81; if (u > tb) continue;
    out.push([R._wHit[0] + Math.cos(a) * v * u, C - (vd * u - 4.905 * u * u) - 0.004, R._wHit[1] + Math.sin(a) * v * u, 0.004 + 0.006 * fuR(i, 54), 0.85, 0.9, 0.95, 1.0]); } }
  // ---- the clutter: up there from its moment (we never see it go); at 3:10 it comes down
  for (const K of R.clutter) {
    if (s < K.at) { K.g.visible = false; continue; }
    K.g.visible = true; let y = C - K.h, x = K.x, z = K.z;
    const rest = fuRestY(K.x, K.z) + K.h, bo = FU_BOUNCE[K.kind] || [0, 0];
    if (s >= FUP.T) { const f = fuDropBounce(C - K.h, rest, bo[0]); y = f.y(s);
      if (bo[1] && s > f.land) { const a = fuR(K.at, 7) * 6.283, d = (0.08 + 0.14 * fuR(K.at, 8)) * (1 - Math.exp(-(s - f.land) / 0.45)); x += Math.cos(a) * d; z += Math.sin(a) * d; } }
    const tum = s >= FUP.T ? Math.min(1, (s - FUP.T) / 0.6) : 0;
    K.g.position.set(x, y, z); K.g.rotation.set(Math.PI * (1 - tum) + (K.kind === 'cereal' ? 0 : 0), K.ry + 0.4 * tum * fuR(K.at, 5), 0.3 * tum * (fuR(K.at, 6) - 0.5));
    if (K.kind === 'cereal' && s >= FUP.T) { K.g.rotation.set(Math.PI * (1 - tum), K.ry, 0); }
  }
  R.room.updateMatrixWorld(true);
}
const M_WATER_ROT = (x) => x;
