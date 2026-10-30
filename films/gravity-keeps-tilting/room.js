/* =====================================================================
   ROOM — your living room, on the top floor of a concrete block of flats, its window looking north across the street
   to the park. Room-local coordinates (layout.js: GK_ROOM): floor y 0 … ceiling 2.6, x −2.5 (west) … 2.5 (east),
   z −2 (north: the window wall) … 2 (south: the door). The furniture and everything on it are posed from the baked
   simulation (simdata.js); the ceiling lamp, the curtains and the clock hang along down (physics.js: gkHang).
   Three lamps are on at 4 PM in late October: the table lamp and the floor lamp go out as they fall; the ceiling lamp
   when the furniture sliding along the ceiling smashes it.
     gkBuildRoom(S) → R
   ===================================================================== */

// ---- canvases
function gkFloorCanvas(seed, w = 512, h = 1024) {                 // oak floorboards
  const r = new RNG(seed);
  return gkCanvas(w, h, (g) => {
    const bw = w / 4;
    for (let i = 0; i < 4; i++) {
      let y = -r.range(0, h);
      while (y < h) {
        const L = r.range(h * 0.4, h * 0.8), k = r.range(-14, 14), x = i * bw;
        g.fillStyle = `rgb(${170 + k},${128 + k},${86 + k * 0.7})`; g.fillRect(x, y, bw, L);
        for (let j = 0; j < 24; j++) { g.fillStyle = `rgba(${r.next() < 0.5 ? '80,50,24' : '220,186,140'},${r.range(0.04, 0.1)})`; g.fillRect(x + r.range(2, bw - 2), y, r.range(0.6, 1.8), L); }
        g.fillStyle = 'rgba(50,32,16,0.55)'; g.fillRect(x, y, bw, 2);
        y += L;
      }
      g.fillStyle = 'rgba(40,24,10,0.6)'; g.fillRect(i * bw, 0, 2, h);
    }
  });
}
function gkPaintCanvas(seed, col, w = 256, h = 256) {
  return gkCanvas(w, h, (g) => {
    g.fillStyle = col; g.fillRect(0, 0, w, h);
    const im = g.getImageData(0, 0, w, h), d = im.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const n = (hash2(x >> 1, y >> 1 + seed) - 0.5) * 6 + (hash2(x >> 4, y >> 3) - 0.5) * 5, i = (y * w + x) * 4; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(im, 0, 0);
  });
}
function gkFabricCanvas(col, seed, w = 256, h = 256) {            // a woven fabric
  const c = new THREE.Color(col), b = [c.r * 255, c.g * 255, c.b * 255];
  return gkCanvas(w, h, (g) => {
    const im = g.createImageData(w, h), d = im.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const wv = ((x >> 1) + (y >> 1)) % 2 ? 1.04 : 0.96, n = 1 + (hash2(x + seed, y) - 0.5) * 0.1, i = (y * w + x) * 4;
      d[i] = b[0] * wv * n; d[i + 1] = b[1] * wv * n; d[i + 2] = b[2] * wv * n; d[i + 3] = 255;
    }
    g.putImageData(im, 0, 0);
  });
}
function gkRugCanvas(w = 512, h = 384) {                          // a rug: navy, rust and cream, a geometric border
  return gkCanvas(w, h, (g) => {
    g.fillStyle = '#e4d8c0'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#273a52'; g.fillRect(22, 22, w - 44, h - 44);
    g.fillStyle = '#e4d8c0'; g.fillRect(44, 44, w - 88, h - 88);
    g.fillStyle = '#b5532f';
    for (let x = 70; x < w - 60; x += 40) for (const y of [70, h - 70]) { g.beginPath(); g.moveTo(x, y - 14); g.lineTo(x + 14, y); g.lineTo(x, y + 14); g.lineTo(x - 14, y); g.fill(); }
    g.strokeStyle = '#273a52'; g.lineWidth = 8; g.strokeRect(w * 0.3, h * 0.32, w * 0.4, h * 0.36);
    const im = g.getImageData(0, 0, w, h), d = im.data;
    for (let i = 0; i < d.length; i += 4) { const n = (hash1(i * 0.29 + 3) - 0.5) * 20; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(im, 0, 0);
  });
}
function gkPrintCanvas(kind, w = 256, h = 320) {                  // two framed prints
  return gkCanvas(w, h, (g) => {
    if (kind === 0) {                                             // a coast at sunset
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f2c58e'); gr.addColorStop(0.5, '#e8876a'); gr.addColorStop(0.52, '#4d6f8a'); gr.addColorStop(1, '#2a3e52');
      g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#fff1d0'; g.beginPath(); g.arc(w * 0.38, h * 0.47, 22, 0, 6.28); g.fill();
      g.fillStyle = '#1f2c3a'; g.beginPath(); g.moveTo(w * 0.6, h * 0.52); g.lineTo(w, h * 0.3); g.lineTo(w, h * 0.52); g.fill();
    } else {                                                      // a botanical print
      g.fillStyle = '#efe9dc'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3d5a3a'; g.lineWidth = 4;
      g.beginPath(); g.moveTo(w / 2, h * 0.9); g.quadraticCurveTo(w * 0.45, h * 0.5, w * 0.55, h * 0.12); g.stroke();
      g.fillStyle = '#4f7a46'; for (let i = 0; i < 7; i++) { const y = h * (0.8 - i * 0.1), sd = i % 2 ? 1 : -1; g.beginPath(); g.ellipse(w / 2 + sd * 34, y, 34, 12, sd * 0.5, 0, 6.28); g.fill(); }
    }
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
  });
}
function gkClockFaceCanvas(w = 256) {
  return gkCanvas(w, w, (g) => {
    g.fillStyle = '#f6f3ec'; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 2, 0, 6.28); g.fill();
    g.strokeStyle = '#1d1f22'; g.lineWidth = 10; g.stroke();
    for (let i = 0; i < 60; i++) { const a = i / 60 * 6.283, L = i % 5 ? 8 : 20, r0 = w / 2 - 16; g.lineWidth = i % 5 ? 2 : 5; g.beginPath(); g.moveTo(w / 2 + Math.sin(a) * r0, w / 2 - Math.cos(a) * r0); g.lineTo(w / 2 + Math.sin(a) * (r0 - L), w / 2 - Math.cos(a) * (r0 - L)); g.stroke(); }
  });
}
// the TV picture: the football results (Saturday, 4 PM), then the crack and black
function gkTvDraw(g, w, h, st) {
  g.fillStyle = '#05070a'; g.fillRect(0, 0, w, h);
  if (st.off) { if (st.crack) { g.strokeStyle = 'rgba(200,210,220,0.35)'; g.lineWidth = 2; const r = new RNG(5); for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(w * 0.4, h * 0.55); let x = w * 0.4, y = h * 0.55; const a = r.range(0, 6.28); for (let k = 0; k < 6; k++) { x += Math.cos(a + r.range(-0.4, 0.4)) * w * 0.07; y += Math.sin(a + r.range(-0.4, 0.4)) * w * 0.07; g.lineTo(x, y); } g.stroke(); } } return; }
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1b5a3a'); gr.addColorStop(1, '#0f3a24'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,0.08)'; for (let x = 0; x < w; x += 40) g.fillRect(x, 0, 20, h);
  g.fillStyle = 'rgba(8,16,30,0.82)'; g.fillRect(w * 0.08, h * 0.12, w * 0.84, h * 0.76);
  g.fillStyle = '#f2f2f2'; g.font = '700 26px Arial'; g.textAlign = 'left'; g.fillText('HALF-TIME SCORES', w * 0.12, h * 0.24);
  g.font = '600 20px Arial';
  const L = [['CITY', 1, 0, 'ROVERS'], ['UNITED', 2, 2, 'ALBION'], ['TOWN', 0, 1, 'WANDERERS'], ['ATHLETIC', 3, 1, 'COUNTY']];
  L.forEach(([a, x, y, b], i) => { const yy = h * (0.38 + i * 0.12); g.textAlign = 'left'; g.fillText(a, w * 0.12, yy); g.textAlign = 'center'; g.fillText(`${x} – ${y}`, w * 0.55, yy); g.textAlign = 'right'; g.fillText(b, w * 0.88, yy); });
}

function gkBuildRoom(S) {
  const scene = S.scene, R = { M: {}, bodies: {} }, tex = (c, rx, ry) => { const t = gkTex(c); t.repeat.set(rx, ry); return t; };
  const M = R.M = {
    floor: gkStd('#ffffff', 0.55, 0, { map: tex(gkFloorCanvas(13), 1.4, 1.6) }),
    wall: gkStd('#ffffff', 0.92, 0, { map: tex(gkPaintCanvas(3, '#e6dfd2'), 3, 2) }),
    wallN: gkStd('#ffffff', 0.92, 0, { map: tex(gkPaintCanvas(4, '#e6dfd2'), 3, 2) }),
    wallW: gkStd('#ffffff', 0.92, 0, { map: tex(gkPaintCanvas(5, '#a9b8b0'), 3, 2) }),     // (a feature wall, sage)
    ceil: gkStd('#f4f2ec', 0.95), skirt: gkStd('#f1efe8', 0.5), frame: gkStd('#f6f4ef', 0.45),
    glass: new THREE.MeshStandardMaterial({ color: '#2c3338', transparent: true, opacity: 0.3, roughness: 0.04, metalness: 0.0, envMapIntensity: 0.4, depthWrite: false, side: THREE.DoubleSide }),
    rad: gkStd('#f2f1ed', 0.4, 0.2), door: gkStd('#f3f1eb', 0.5), handle: gkStd('#b9b3a6', 0.3, 0.8),
    sofa: gkStd('#ffffff', 0.95, 0, { map: tex(gkFabricCanvas('#5f6e7c', 1), 3, 3) }), sofaD: gkStd('#ffffff', 0.95, 0, { map: tex(gkFabricCanvas('#526170', 2), 3, 3) }),
    arm: gkStd('#ffffff', 0.95, 0, { map: tex(gkFabricCanvas('#b8693f', 3), 2, 2) }),
    cush: ['#d9a441', '#e8e0d0', '#9a4b3b'].map((c, i) => gkStd('#ffffff', 0.95, 0, { map: tex(gkFabricCanvas(c, 7 + i), 1, 1) })),
    pouffe: gkStd('#ffffff', 0.95, 0, { map: tex(gkFabricCanvas('#c9b99a', 11), 2, 1) }),
    wood: gkStd('#ffffff', 0.55, 0, { map: (() => { const t = gkTex(gkWoodCanvas(21, 256, 1024, [150, 104, 66])); t.repeat.set(1, 1); return t; })() }),
    woodL: gkStd('#ffffff', 0.55, 0, { map: (() => { const t = gkTex(gkWoodCanvas(23, 256, 1024, [196, 160, 118])); t.rotation = Math.PI / 2; return t; })() }),
    white: gkStd('#f1efe9', 0.55), black: gkStd('#141518', 0.35, 0.3), metal: gkStd('#2b2c2e', 0.35, 0.7), brass: gkStd('#b89a5a', 0.3, 0.85),
    rug: gkStd('#ffffff', 0.97, 0, { map: gkTex(gkRugCanvas(), { repeat: false }) }),
    shade: gkStd('#f2e9d6', 0.85, 0, { side: THREE.DoubleSide, emissive: new THREE.Color('#ffcf8a'), emissiveIntensity: 0.0 }),
    shadeC: gkStd('#e9e2d2', 0.85, 0, { side: THREE.DoubleSide, emissive: new THREE.Color('#ffcf8a'), emissiveIntensity: 0.0 }),
    bulb: new THREE.MeshBasicMaterial({ color: '#fff1d0' }), flex: gkStd('#f0eee8', 0.6),
    ceramic: gkStd('#3f6f7a', 0.3), terracotta: gkStd('#b0603e', 0.8), leaf: gkStd('#3f6b35', 0.85), leaf2: gkStd('#557f3f', 0.85), soil: gkStd('#3a2c22', 1),
    pages: gkStd('#efe8d8', 0.9), cup: new THREE.MeshStandardMaterial({ color: '#eef4f6', transparent: true, opacity: 0.3, roughness: 0.05, envMapIntensity: 1.4, depthWrite: false }),
    water: new THREE.MeshStandardMaterial({ color: '#bcd6e0', transparent: true, opacity: 0.55, roughness: 0.04, envMapIntensity: 1.6, depthWrite: false, side: THREE.DoubleSide }),
    bowl: gkStd('#d8d2c6', 0.35), clock: gkStd('#ffffff', 0.5, 0, { map: gkTex(gkClockFaceCanvas(), { repeat: false }) }),
    prints: [0, 1].map((k) => gkStd('#ffffff', 0.8, 0, { map: gkTex(gkPrintCanvas(k), { repeat: false }) })),
    stem: gkStd('#4a6a3a', 0.8), flower: gkStd('#e8c24a', 0.7),
  };
  M.books = ['#7a2e2a', '#2f4a6b', '#d9c9a3', '#3c5a3c', '#b8862e', '#1f2a36', '#a35a3a', '#e3ddd0', '#5b3c5e', '#2d2d2d', '#3d6f7a', '#c98a5a'].map((c) => gkStd(c, 0.8));

  const L = GK_ROOM, W = L.W / 2, D = L.D / 2, H = L.H;
  const room = new THREE.Group(); room.name = 'room'; room.position.set(...L.origin); scene.add(room); R.room = room;
  room.updateMatrixWorld(true);
  R.toWorld = (x, y, z, out) => (out || new THREE.Vector3()).set(x, y, z).applyMatrix4(room.matrixWorld);
  const T = 0.25;                                                 // (the walls' thickness: they cast the shadows)
  // ---- floor, ceiling, walls (the north wall with the window; the south wall with the door)
  gkBox(L.W, 0.2, L.D, M.floor, 0, -0.1, 0, room);
  gkBox(L.W + 0.5, 0.25, L.D + 0.5, M.ceil, 0, H + 0.125, 0, room);
  gkBox(T, H, L.D + 0.5, M.wallW, -W - T / 2, H / 2, 0, room);
  gkBox(T, H, L.D + 0.5, M.wall, W + T / 2, H / 2, 0, room);
  const wi = L.win;
  for (const c of gkWallCells(-W - T, W + T, 0, H, [[wi.x[0], wi.x[1], wi.y[0], wi.y[1]]])) gkBox(c[1] - c[0], c[3] - c[2], T, M.wallN, (c[0] + c[1]) / 2, (c[2] + c[3]) / 2, -D - T / 2, room);
  const dr = L.door;
  for (const c of gkWallCells(-W - T, W + T, 0, H, [[dr.x[0], dr.x[1], 0, dr.h]])) gkBox(c[1] - c[0], c[3] - c[2], T, M.wall, (c[0] + c[1]) / 2, (c[2] + c[3]) / 2, D + T / 2, room);
  { const dd = gkBox(dr.x[1] - dr.x[0] - 0.02, dr.h - 0.01, 0.04, M.door, (dr.x[0] + dr.x[1]) / 2, dr.h / 2, D + 0.06, room); gkBox(0.12, 0.03, 0.05, M.handle, dr.x[0] + 0.12, 1.02, D + 0.0, room); dd.castShadow = true; }
  for (const [a, b, y] of [[dr.x[0] - 0.05, dr.x[0], 0], [dr.x[1], dr.x[1] + 0.05, 0]]) gkBox(b - a, dr.h + 0.05, 0.06, M.frame, (a + b) / 2, dr.h / 2, D - 0.02, room);
  // skirting
  for (const [x, z, w, d] of [[0, -D + 0.01, L.W, 0.02], [-W + 0.01, 0, 0.02, L.D], [W - 0.01, 0, 0.02, L.D]]) gkBox(w, 0.1, d, M.skirt, x, 0.05, z, room);
  for (const [a, b] of [[-W, dr.x[0] - 0.05], [dr.x[1] + 0.05, W]]) gkBox(b - a, 0.1, 0.02, M.skirt, (a + b) / 2, 0.05, D - 0.01, room);
  // ---- the window: frame, a mullion, the glass, the sill; the radiator under it; the curtain rail
  { const cx = (wi.x[0] + wi.x[1]) / 2, cy = (wi.y[0] + wi.y[1]) / 2, ww = wi.x[1] - wi.x[0], hh = wi.y[1] - wi.y[0], z = -D - 0.12;
    for (const [bx, by, bw, bh] of [[cx, wi.y[1] - 0.03, ww, 0.06], [cx, wi.y[0] + 0.03, ww, 0.06], [wi.x[0] + 0.03, cy, 0.06, hh], [wi.x[1] - 0.03, cy, 0.06, hh], [cx + 0.25, cy, 0.05, hh - 0.1]]) gkBox(bw, bh, 0.08, M.frame, bx, by, z, room);
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(ww - 0.1, hh - 0.1), M.glass); gl.position.set(cx, cy, z); gl.renderOrder = 4; room.add(gl); R.glass = gl;
    const sl = L.sill; gkBox(sl.x[1] - sl.x[0], sl.y[1] - sl.y[0], sl.z[1] - sl.z[0], M.frame, (sl.x[0] + sl.x[1]) / 2, (sl.y[0] + sl.y[1]) / 2, (sl.z[0] + sl.z[1]) / 2, room);
    const rd = L.rad, rx = (rd.x[0] + rd.x[1]) / 2, rw = rd.x[1] - rd.x[0];
    for (let i = 0; i < 18; i++) gkBox(0.05, rd.y[1] - rd.y[0], 0.06, M.rad, rd.x[0] + 0.05 + i * (rw - 0.1) / 17, (rd.y[0] + rd.y[1]) / 2, -D + 0.05, room);
    gkBox(rw, 0.03, 0.08, M.rad, rx, rd.y[1] - 0.015, -D + 0.05, room); gkBox(rw, 0.03, 0.08, M.rad, rx, rd.y[0] + 0.015, -D + 0.05, room);
    gkCyl(0.012, 0.012, 2.95, M.metal, (L.rail.x[0] + L.rail.x[1]) / 2, L.rail.y, -D + 0.09, room, 8).rotation.z = Math.PI / 2;
    for (const x of L.rail.x) gkBox(0.03, 0.06, 0.1, M.metal, x, L.rail.y + 0.02, -D + 0.05, room);
  }
  // ---- the curtains: two panels hanging from the rail (they hang along down: sheared in the wall's plane)
  R.curtains = [];
  { const mat = gkStd('#ffffff', 0.95, 0, { map: tex(gkFabricCanvas('#c98e5a', 21), 2, 3), side: THREE.DoubleSide });
    for (const [x0, x1] of [[L.rail.x[0], L.rail.x[0] + 0.62], [L.rail.x[1] - 0.62, L.rail.x[1]]]) {
      const len = 2.25, nx = 10, ny = 12, geo = new THREE.PlaneGeometry(x1 - x0, len, nx, ny);
      const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.position.set(0, 0, -D + 0.12); room.add(m);
      R.curtains.push({ m, geo, x0, x1, len, nx, ny, base: Float32Array.from(geo.attributes.position.array) });
    } }
  // ---- the ceiling lamp: a rose, the flex, a drum shade with its bulb (pivots at the rose)
  { const lp = L.lamp, g = new THREE.Group(); g.position.set(lp.x, H, lp.z); room.add(g); R.lamp = g;
    gkCyl(0.06, 0.06, 0.03, M.white, 0, -0.015, 0, g, 18);
    const swing = new THREE.Group(); g.add(swing); R.lampSwing = swing;
    gkCyl(0.004, 0.004, lp.cord, M.flex, 0, -lp.cord / 2, 0, swing, 6);
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.24, 0.24, 28, 1, true), M.shadeC); sh.position.y = -lp.cord - 0.1; sh.castShadow = false; swing.add(sh); R.lampShade = sh;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), M.bulb); bulb.position.y = -lp.cord - 0.1; swing.add(bulb); R.lampBulb = bulb;
    const light = new THREE.PointLight('#ffd7a0', 0, 9, 1.6); light.position.y = -lp.cord - 0.1; swing.add(light); R.lampLight = light; }
  // ---- the clock and two prints on the south wall (they hang on nails: they swing along down, then drop off)
  R.hung = [];
  { const mk = (x, y, build, drop) => { const g = new THREE.Group(); g.position.set(x, y, D - 0.02); room.add(g); const inner = new THREE.Group(); g.add(inner); build(inner); R.hung.push({ g, inner, drop, x, y }); };
    mk(-0.6, 2.05, (g) => { const f = gkCyl(0.17, 0.17, 0.04, M.black, 0, -0.17, -0.02, g, 32); f.rotation.x = Math.PI / 2; const face = new THREE.Mesh(new THREE.CircleGeometry(0.155, 32), M.clock); face.position.set(0, -0.17, -0.045); face.rotation.y = Math.PI; g.add(face);
      R.hands = [0.1, 0.13, 0.15].map((l, i) => { const h = new THREE.Group(); h.position.set(0, -0.17, -0.05); g.add(h); gkBox([0.012, 0.008, 0.003][i], l, 0.004, i === 2 ? gkStd('#b8322a', 0.5) : M.black, 0, l / 2 - 0.02, 0, h); return h; }); }, 97);
    mk(0.25, 1.95, (g) => { gkBox(0.46, 0.58, 0.03, M.black, 0, -0.29, -0.015, g); const p = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.52), M.prints[0]); p.position.set(0, -0.29, -0.032); p.rotation.y = Math.PI; g.add(p); }, 101);
    mk(-1.75, 1.9, (g) => { gkBox(0.36, 0.46, 0.03, gkStd('#e8e4da', 0.5), 0, -0.23, -0.015, g); const p = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.38), M.prints[1]); p.position.set(0, -0.23, -0.032); p.rotation.y = Math.PI; g.add(p); }, 104); }

  // ==================================================================== THE SIMULATED THINGS (one group per body)
  const bk = (b) => b.parts;
  const P = (p) => ({ hx: p[1], hy: p[2], hz: p[3], o: p[0] === 'box' ? p.slice(4, 7) : p[0] === 'cyl' ? p.slice(3, 6) : p.slice(2, 5) });
  let bi = 0;
  for (const b of L.bodies) {
    const g = new THREE.Group(); room.add(g); R.bodies[b.id] = g; g.userData.b = b;
    const pp = b.parts.map(P), box = (k, m, s = [1, 1, 1], r = 0.02) => { const q = pp[k]; const o = gkMesh(gkRoundBox(2 * q.hx * s[0], 2 * q.hy * s[1], 2 * q.hz * s[2], Math.min(r, q.hx * 0.9, q.hz * 0.9), Math.min(r * 0.6, q.hy * 0.4)), m, q.o[0], q.o[1] - q.hy * s[1], q.o[2], g); return o; };
    const cyl = (k, m, seg = 20) => { const p = b.parts[k]; return gkCyl(p[2], p[2], 2 * p[1], m, p[3], p[4], p[5], g, seg); };
    switch (b.kind) {
      case 'sofa': box(0, M.sofaD, [1, 1, 1], 0.06); box(1, M.sofa, [1, 1, 1], 0.08); box(2, M.sofa, [1, 1, 1], 0.06); box(3, M.sofa, [1, 1, 1], 0.06);
        for (const z of [-0.62, 0.0, 0.62]) gkMesh(gkRoundBox(0.66, 0.14, 0.6, 0.06, 0.04), M.sofa, -0.08, 0.42, z, g);
        for (const [x, z] of [[-0.4, -0.98], [0.4, -0.98], [-0.4, 0.98], [0.4, 0.98]]) gkCyl(0.025, 0.02, 0.06, M.wood, x, 0.03, z, g, 8); break;
      case 'cushion': box(0, M.cush[bi % 3], [1, 1, 1], 0.07); break;
      case 'rug': { const q = pp[0], m = new THREE.Mesh(new THREE.BoxGeometry(2 * q.hx, 2 * q.hy, 2 * q.hz), [M.rug, M.rug, M.rug, M.rug, M.rug, M.rug]); m.position.set(0, q.hy, 0); m.receiveShadow = true; g.add(m); break; }
      case 'table': box(0, M.woodL, [1, 1, 1], 0.01); for (let k = 1; k < 5; k++) box(k, M.wood, [1, 1, 1], 0.005); break;
      case 'glass': { const p = b.parts[0], cup = new THREE.Mesh(new THREE.CylinderGeometry(p[2], p[2] * 0.85, 2 * p[1], 20, 1, true), M.cup); cup.position.set(0, p[1], 0); g.add(cup);
        const wg = new THREE.Group(); wg.position.set(0, p[1], 0); g.add(wg); const wt = new THREE.Mesh(new THREE.CircleGeometry(p[2] * 0.95, 20), M.water); wt.rotation.x = -Math.PI / 2; wg.add(wt);
        const body = new THREE.Mesh(new THREE.CylinderGeometry(p[2] * 0.95, p[2] * 0.82, 2 * p[1] * 0.82, 20), M.water); body.position.y = -p[1] * 0.18 - 0.0; wg.add(body);
        R.glassWater = { wg, wt, body, h: p[1] }; break; }
      case 'bowl': { const p = b.parts[0], pts = []; for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI / 2; pts.push(new THREE.Vector2(p[2] * Math.sin(a) + 0.001, p[1] * 2 * (1 - Math.cos(a)))); } const m = gkMesh(new THREE.LatheGeometry(pts, 24), M.bowl, 0, 0, 0, g); m.material = M.bowl; M.bowl.side = THREE.DoubleSide;
        for (const [x, z, c] of [[0.03, 0.02, '#d9832e'], [-0.04, 0.01, '#c4302a'], [0.0, -0.045, '#9ab83a']]) gkMesh(new THREE.SphereGeometry(0.035, 12, 8), gkStd(c, 0.5), x, 0.05, z, g); break; }
      case 'book': { const q = pp[0], mats = [M.pages, M.books[(bi * 7) % 12], M.books[(bi * 7) % 12], M.books[(bi * 7) % 12], M.books[(bi * 7) % 12], M.books[(bi * 7) % 12]];
        const spineE = b.id.startsWith('book');                    // (shelf books: the spine faces east, out of the bookcase)
        const m = new THREE.Mesh(new THREE.BoxGeometry(2 * q.hx, 2 * q.hy, 2 * q.hz), spineE ? [M.books[(bi * 7) % 12], M.pages, M.pages, M.pages, M.books[(bi * 7) % 12], M.books[(bi * 7) % 12]] : mats);
        m.position.set(q.o[0], q.o[1], q.o[2]); m.castShadow = m.receiveShadow = true; g.add(m); break; }
      case 'remote': box(0, M.black, [1, 1, 1], 0.008); break;
      case 'stand': box(0, M.wood, [1, 1, 1], 0.01); gkBox(0.005, 0.02, 1.3, M.metal, pp[0].hx + 0.002, 0.3, 0, g); break;
      case 'tv': { box(0, M.black, [1, 1, 1], 0.01); box(1, M.black, [1, 1, 1], 0.005); box(2, M.black, [1, 1, 1], 0.008);
        const q = pp[2], ct = gkCanvasTex(512, 288, gkTvDraw), scr = new THREE.Mesh(new THREE.PlaneGeometry(2 * q.hz * 0.96, 2 * q.hy * 0.94), new THREE.MeshBasicMaterial({ map: ct.tex, toneMapped: false }));
        scr.position.set(q.o[0] + q.hx + 0.001, q.o[1], q.o[2]); scr.rotation.y = Math.PI / 2; g.add(scr); R.tv = { ct, scr }; break; }
      case 'bookcase': for (let k = 0; k < b.parts.length; k++) box(k, M.white, [1, 1, 1], 0.004); break;
      case 'armchair': box(0, M.arm, [1, 1, 1], 0.06); box(1, M.arm, [1, 1, 1], 0.07); box(2, M.arm, [1, 1, 1], 0.05); box(3, M.arm, [1, 1, 1], 0.05);
        gkMesh(gkRoundBox(0.62, 0.12, 0.62, 0.05, 0.04), M.arm, 0, 0.42, -0.06, g); break;
      case 'sidetable': box(0, M.metal, [1, 1, 1], 0.01); box(1, M.metal, [1, 1, 1], 0.01); box(2, M.woodL, [1, 1, 1], 0.01); break;
      case 'tablelamp': { const p0 = b.parts[0], p1 = b.parts[1];
        gkMesh(new THREE.SphereGeometry(p0[2] * 1.15, 18, 12).scale(1, p0[1] / p0[2], 1), M.ceramic, 0, p0[4], 0, g);
        const sh = new THREE.Mesh(new THREE.CylinderGeometry(p1[2] * 0.75, p1[2], 2 * p1[1], 24, 1, true), M.shade); sh.position.set(0, p1[4], 0); g.add(sh);
        const lt = new THREE.PointLight('#ffcf8a', 0, 5, 1.8); lt.position.set(0, p1[4] - 0.02, 0); g.add(lt); R.tlampLight = lt; break; }
      case 'sideboard': box(0, M.wood, [1, 1, 1], 0.01); for (const z of [-0.35, 0.35]) gkBox(0.005, 0.5, 0.62, M.woodL, pp[0].hx * -1 - 0.003, 0.42, z, g); for (const z of [-0.35, 0.35]) gkBox(0.02, 0.02, 0.12, M.brass, -pp[0].hx - 0.01, 0.62, z, g); break;
      case 'vase': { const p = b.parts[0]; cyl(0, M.ceramic, 18); for (let k = 0; k < 5; k++) { const a = k * 1.3, st = gkCyl(0.003, 0.003, 0.32, M.stem, Math.cos(a) * 0.02, 2 * p[1] + 0.14, Math.sin(a) * 0.02, g, 5); st.rotation.set(Math.sin(a) * 0.2, 0, Math.cos(a) * 0.2); gkMesh(new THREE.SphereGeometry(0.025, 8, 6), M.flower, Math.cos(a) * 0.05, 2 * p[1] + 0.3, Math.sin(a) * 0.05, g); } break; }
      case 'photo': { box(0, M.black, [1, 1, 1], 0.003); const q = pp[0], pic = new THREE.Mesh(new THREE.PlaneGeometry(2 * q.hz * 0.8, 2 * q.hy * 0.8), M.prints[0]); pic.position.set(-q.hx - 0.001, q.o[1], 0); pic.rotation.y = -Math.PI / 2; g.add(pic); break; }
      case 'bookpile': { const q = pp[0]; for (let k = 0; k < 3; k++) gkBox(2 * q.hx * (1 - 0.06 * k), 2 * q.hy / 3, 2 * q.hz * (1 - 0.05 * k), M.books[(k * 5 + 2) % 12], 0, q.hy / 3 * (2 * k + 1), 0, g); break; }
      case 'floorlamp': { cyl(0, M.metal, 24); cyl(1, M.brass, 8); const p = b.parts[2]; const sh = new THREE.Mesh(new THREE.CylinderGeometry(p[2] * 0.7, p[2], 2 * p[1], 24, 1, true), M.shade); sh.position.set(0, p[4], 0); g.add(sh);
        const lt = new THREE.PointLight('#ffcf8a', 0, 6, 1.8); lt.position.set(0, p[4] - 0.05, 0); g.add(lt); R.flampLight = lt; break; }
      case 'plant': { const p = b.parts[0]; gkCyl(p[2], p[2] * 0.8, 2 * p[1], M.terracotta, 0, p[1], 0, g, 18); gkCyl(p[2] * 0.95, p[2] * 0.95, 0.02, M.soil, 0, 2 * p[1] - 0.02, 0, g, 18);
        const r = new RNG(77); for (let k = 0; k < 9; k++) { const a = r.range(0, 6.28), e = r.range(0.2, 1.1), d = r.range(0.12, 0.3), lf = gkMesh(new THREE.SphereGeometry(r.range(0.12, 0.2), 8, 6).scale(1.4, 0.35, 0.9), k % 2 ? M.leaf : M.leaf2, Math.cos(a) * d, 0.5 + e * 0.4, Math.sin(a) * d, g); lf.rotation.set(r.range(-0.6, 0.6), a, r.range(-0.5, 0.5)); } break; }
      case 'pouffe': { const p = b.parts[0]; gkMesh(gkRoundBox(2 * p[2], 2 * p[1], 2 * p[2], p[2] * 0.95, 0.06), M.pouffe, 0, 0, 0, g); break; }
      default: for (let k = 0; k < b.parts.length; k++) if (b.parts[k][0] === 'box') box(k, M.white);
    }
    bi++;
  }
  // ---- the football by the window (physics.js GK_BALL): low-poly, black and white panels
  { const geo = new THREE.IcosahedronGeometry(GK_BALL.r, 1).toNonIndexed(), n = geo.attributes.position.count, col = new Float32Array(n * 3);
    for (let f = 0; f < n / 3; f++) { const c = f % 5 === 0 ? 0.08 : 0.92; for (let k = 0; k < 3; k++) col.set([c, c, c * 0.98], (f * 3 + k) * 3); }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
    R.ball = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, flatShading: true })); R.ball.castShadow = true; room.add(R.ball); }
  R.update = (s, o) => gkRoomUpdate(R, s, o || {});
  return R;
}

const _gkP = [0, 0, 0], _gkQ = [0, 0, 0, 1], _gkQT = new THREE.Quaternion();
function gkRoomUpdate(R, s, o) {
  const L = GK_ROOM;
  // ---- the simulated things
  for (const id in R.bodies) { const g = R.bodies[id]; gkSimPose('room', id, s, _gkP, _gkQ); g.position.set(_gkP[0], _gkP[1], _gkP[2]); g.quaternion.set(_gkQ[0], _gkQ[1], _gkQ[2], _gkQ[3]); }
  // ---- the football: rolls east along the floor (its spin follows its roll)
  { const x = gkBallX(s); R.ball.visible = s < GK_BALL.end; R.ball.position.set(x, GK_BALL.r, GK_BALL.z); R.ball.rotation.set(0.4, 0, -(x - GK_BALL.x0) / GK_BALL.r); }
  // ---- the glass of water: the surface stays level with down (in the glass's own frame) until it has spilled
  if (R.glassWater) {
    const G = R.bodies.glass, d = gkDown(gkDeg(s) + gkRing(s, 0.5, 0.5) * 0.6), wv = new THREE.Vector3(-d[0], -d[1], 0);
    _gkQT.copy(G.quaternion).invert(); wv.applyQuaternion(_gkQT);           // (felt up, in the glass's frame)
    const tilt = Math.acos(Math.min(1, Math.max(-1, wv.y))), spilled = gkSm(tilt, 0.22, 0.6), gone = s > GK_LAMPS.glassGone;
    R.glassWater.wg.visible = !gone && spilled < 0.98;
    R.glassWater.wg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), wv.normalize());
    R.glassWater.wg.position.y = R.glassWater.h * (1 - 0.35 * spilled);
    R.glassWater.body.scale.y = 1 - 0.7 * spilled;
  }
  // ---- lamps: the table lamp and the floor lamp go out as they fall; the ceiling lamp when it's smashed
  const on = (t0) => (s < t0 ? 1 : 0), flick = (t0) => (s < t0 ? 1 : s < t0 + 0.25 ? (Math.sin(s * 90) > 0 ? 0.5 : 0) : 0);
  if (R.tlampLight) R.tlampLight.intensity = 1.6 * flick(GK_LAMPS.tlamp) * (o.lights ?? 1);
  if (R.flampLight) R.flampLight.intensity = 2.2 * flick(GK_LAMPS.flamp) * (o.lights ?? 1);
  R.M.shade.emissiveIntensity = 0.55 * Math.max(flick(GK_LAMPS.tlamp), 0);
  const broken = s > L.lamp.broken;
  R.lampLight.intensity = 3.0 * flick(L.lamp.broken) * (o.lights ?? 1);
  R.M.shadeC.emissiveIntensity = 0.6 * on(L.lamp.broken); R.lampBulb.visible = !broken;
  { const a = gkHang(s, 1.76) * Math.PI / 180; R.lampSwing.rotation.set(0, 0, a); R.lampShade.visible = !broken || s < L.lamp.broken + 0.05; }
  // ---- the TV: on until it falls; cracked and dark after
  if (R.tv) R.tv.ct.update({ off: s > GK_LAMPS.tv, crack: s > GK_LAMPS.tv + 0.3 });
  // ---- the curtains: each column of the cloth hangs along down from the rail (sheared in the wall's plane); with
  // down pointing up they fold up against the ceiling
  for (const C of R.curtains) {
    const p = C.geo.attributes.position, a = gkHang(s, 2.4) * Math.PI / 180, up = gkDeg(s) % 360 > 88 && gkDeg(s) % 360 < 272;
    const top = L.rail.y, cx = (C.x0 + C.x1) / 2, room = L.H - top - 0.02;
    for (let i = 0; i < p.count; i++) {
      const bx = C.base[i * 3], by = C.base[i * 3 + 1], v = (C.len / 2 - by);       // v: down the cloth from the rail (0 … len)
      let x = cx + bx, y = top - v, z = 0;
      if (!up) { x = cx + bx + Math.sin(a) * v; y = top - Math.cos(a) * v; z = 0.03 * Math.sin(bx * 22 + v * 3); }
      else { const lay = Math.min(v, room), rest = Math.max(0, v - room), side = a > 0 ? 1 : -1; x = cx + bx * (1 - 0.6 * Math.min(1, rest)) + side * rest * 0.35; y = top + lay - 0.02 * Math.sin(rest * 9); z = 0.04 + rest * 0.25 + 0.02 * Math.sin(bx * 22); }
      p.setXYZ(i, x, y, z);
    }
    p.needsUpdate = true; C.geo.computeVertexNormals();
  }
  // ---- the clock and the prints: they swing on their nails along down, then drop off (θ ≈ 97–104°)
  for (const h of R.hung) {
    const d = gkDeg(s) % 360, gone = gkDeg(s) >= h.drop && gkDeg(s) < 360 + 30;
    h.g.visible = !gone;
    if (!gone) h.inner.rotation.z = gkHang(s, 1.2) * Math.PI / 180 * (d < 100 ? 1 : 0);
  }
  if (R.hands) { const c = gkClock(s); R.hands[0].rotation.z = -((c.h % 12) + c.m / 60) / 12 * Math.PI * 2; R.hands[1].rotation.z = -(c.m + c.sec / 60) / 60 * Math.PI * 2; R.hands[2].rotation.z = -c.sec / 60 * Math.PI * 2; }
  R.room.updateMatrixWorld(true);
}
