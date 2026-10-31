/* =====================================================================
   ROOM — your living room, on the top (fifth) floor of a concrete block of flats, 12.0 m above the street; its window
   looks across the street to the park, into the afternoon sun. Room-local coordinates (layout.js: LA_ROOM): floor
   y 0 … ceiling 2.6, x −2.5 … 2.5, z −2 (the window wall) … 2 (the door). (The room is the gravity-keeps-tilting
   film's; here nothing moves: it rains in it, the light goes, the sealed things shrink, the cat watches.)
   On the coffee table: your glass of water, a crisp packet, a bottle with its cap on; the cat's water bowl by the
   sideboard; the football by the window (it goes soft). After 3:10 the room is in a vacuum: the water in the glass
   and the bowl boils at 15 °C, then freezes.
     laBuildRoom(S) → R
   ===================================================================== */

// ---- canvases
function laFloorCanvas(seed, w = 512, h = 1024) {                 // oak floorboards
  const r = new RNG(seed);
  return laCanvas(w, h, (g) => {
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
function laPaintCanvas(seed, col, w = 256, h = 256) {
  return laCanvas(w, h, (g) => {
    g.fillStyle = col; g.fillRect(0, 0, w, h);
    const im = g.getImageData(0, 0, w, h), d = im.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const n = (hash2(x >> 1, y >> 1 + seed) - 0.5) * 6 + (hash2(x >> 4, y >> 3) - 0.5) * 5, i = (y * w + x) * 4; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(im, 0, 0);
  });
}
function laFabricCanvas(col, seed, w = 256, h = 256) {            // a woven fabric
  const c = new THREE.Color(col), b = [c.r * 255, c.g * 255, c.b * 255];
  return laCanvas(w, h, (g) => {
    const im = g.createImageData(w, h), d = im.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const wv = ((x >> 1) + (y >> 1)) % 2 ? 1.04 : 0.96, n = 1 + (hash2(x + seed, y) - 0.5) * 0.1, i = (y * w + x) * 4;
      d[i] = b[0] * wv * n; d[i + 1] = b[1] * wv * n; d[i + 2] = b[2] * wv * n; d[i + 3] = 255;
    }
    g.putImageData(im, 0, 0);
  });
}
function laRugCanvas(w = 512, h = 384) {                          // a rug: navy, rust and cream, a geometric border
  return laCanvas(w, h, (g) => {
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
function laPrintCanvas(kind, w = 256, h = 320) {                  // two framed prints
  return laCanvas(w, h, (g) => {
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
function laClockFaceCanvas(w = 256) {
  return laCanvas(w, w, (g) => {
    g.fillStyle = '#f6f3ec'; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 2, 0, 6.28); g.fill();
    g.strokeStyle = '#1d1f22'; g.lineWidth = 10; g.stroke();
    for (let i = 0; i < 60; i++) { const a = i / 60 * 6.283, L = i % 5 ? 8 : 20, r0 = w / 2 - 16; g.lineWidth = i % 5 ? 2 : 5; g.beginPath(); g.moveTo(w / 2 + Math.sin(a) * r0, w / 2 - Math.cos(a) * r0); g.lineTo(w / 2 + Math.sin(a) * (r0 - L), w / 2 - Math.cos(a) * (r0 - L)); g.stroke(); }
  });
}
// the TV picture: the football results (Saturday, 4 PM), then the crack and black
function laTvDraw(g, w, h, st) {
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

function laBuildRoom(S) {
  const scene = S.scene, R = { M: {}, bodies: {} }, tex = (c, rx, ry) => { const t = laTex(c); t.repeat.set(rx, ry); return t; };
  const M = R.M = {
    floor: laStd('#ffffff', 0.55, 0, { map: tex(laFloorCanvas(13), 1.4, 1.6) }),
    wall: laStd('#ffffff', 0.92, 0, { map: tex(laPaintCanvas(3, '#e6dfd2'), 3, 2) }),
    wallN: laStd('#ffffff', 0.92, 0, { map: tex(laPaintCanvas(4, '#e6dfd2'), 3, 2) }),
    wallW: laStd('#ffffff', 0.92, 0, { map: tex(laPaintCanvas(5, '#a9b8b0'), 3, 2) }),     // (a feature wall, sage)
    ceil: laStd('#f4f2ec', 0.95), skirt: laStd('#f1efe8', 0.5), frame: laStd('#f6f4ef', 0.45),
    glass: new THREE.MeshStandardMaterial({ color: '#2c3338', transparent: true, opacity: 0.3, roughness: 0.04, metalness: 0.0, envMapIntensity: 0.4, depthWrite: false, side: THREE.DoubleSide }),
    rad: laStd('#f2f1ed', 0.4, 0.2), door: laStd('#f3f1eb', 0.5), handle: laStd('#b9b3a6', 0.3, 0.8),
    sofa: laStd('#ffffff', 0.95, 0, { map: tex(laFabricCanvas('#5f6e7c', 1), 3, 3) }), sofaD: laStd('#ffffff', 0.95, 0, { map: tex(laFabricCanvas('#526170', 2), 3, 3) }),
    arm: laStd('#ffffff', 0.95, 0, { map: tex(laFabricCanvas('#b8693f', 3), 2, 2) }),
    cush: ['#d9a441', '#e8e0d0', '#9a4b3b'].map((c, i) => laStd('#ffffff', 0.95, 0, { map: tex(laFabricCanvas(c, 7 + i), 1, 1) })),
    pouffe: laStd('#ffffff', 0.95, 0, { map: tex(laFabricCanvas('#c9b99a', 11), 2, 1) }),
    wood: laStd('#ffffff', 0.55, 0, { map: (() => { const t = laTex(laWoodCanvas(21, 256, 1024, [150, 104, 66])); t.repeat.set(1, 1); return t; })() }),
    woodL: laStd('#ffffff', 0.55, 0, { map: (() => { const t = laTex(laWoodCanvas(23, 256, 1024, [196, 160, 118])); t.rotation = Math.PI / 2; return t; })() }),
    white: laStd('#f1efe9', 0.55), black: laStd('#141518', 0.35, 0.3), metal: laStd('#2b2c2e', 0.35, 0.7), brass: laStd('#b89a5a', 0.3, 0.85),
    rug: laStd('#ffffff', 0.97, 0, { map: laTex(laRugCanvas(), { repeat: false }) }),
    shade: laStd('#f2e9d6', 0.85, 0, { side: THREE.DoubleSide, emissive: new THREE.Color('#ffcf8a'), emissiveIntensity: 0.0 }),
    shadeC: laStd('#e9e2d2', 0.85, 0, { side: THREE.DoubleSide, emissive: new THREE.Color('#ffcf8a'), emissiveIntensity: 0.0 }),
    bulb: new THREE.MeshBasicMaterial({ color: '#fff1d0' }), flex: laStd('#f0eee8', 0.6),
    ceramic: laStd('#3f6f7a', 0.3), terracotta: laStd('#b0603e', 0.8), leaf: laStd('#3f6b35', 0.85), leaf2: laStd('#557f3f', 0.85), soil: laStd('#3a2c22', 1),
    pages: laStd('#efe8d8', 0.9), cup: new THREE.MeshStandardMaterial({ color: '#eef4f6', transparent: true, opacity: 0.3, roughness: 0.05, envMapIntensity: 1.4, depthWrite: false }),
    water: new THREE.MeshStandardMaterial({ color: '#bcd6e0', transparent: true, opacity: 0.55, roughness: 0.04, envMapIntensity: 1.6, depthWrite: false, side: THREE.DoubleSide }),
    bowl: laStd('#d8d2c6', 0.35), clock: laStd('#ffffff', 0.5, 0, { map: laTex(laClockFaceCanvas(), { repeat: false }) }),
    prints: [0, 1].map((k) => laStd('#ffffff', 0.8, 0, { map: laTex(laPrintCanvas(k), { repeat: false }) })),
    stem: laStd('#4a6a3a', 0.8), flower: laStd('#e8c24a', 0.7),
  };
  M.books = ['#7a2e2a', '#2f4a6b', '#d9c9a3', '#3c5a3c', '#b8862e', '#1f2a36', '#a35a3a', '#e3ddd0', '#5b3c5e', '#2d2d2d', '#3d6f7a', '#c98a5a'].map((c) => laStd(c, 0.8));

  const L = LA_ROOM, W = L.W / 2, D = L.D / 2, H = L.H;
  const room = new THREE.Group(); room.name = 'room'; room.position.set(...L.origin); scene.add(room); R.room = room;
  room.updateMatrixWorld(true);
  R.toWorld = (x, y, z, out) => (out || new THREE.Vector3()).set(x, y, z).applyMatrix4(room.matrixWorld);
  const T = 0.25;                                                 // (the walls' thickness: they cast the shadows)
  // ---- floor, ceiling, walls (the north wall with the window; the south wall with the door)
  laBox(L.W, 0.2, L.D, M.floor, 0, -0.1, 0, room);
  laBox(L.W + 0.5, 0.25, L.D + 0.5, M.ceil, 0, H + 0.125, 0, room);
  laBox(T, H, L.D + 0.5, M.wallW, -W - T / 2, H / 2, 0, room);
  laBox(T, H, L.D + 0.5, M.wall, W + T / 2, H / 2, 0, room);
  const wi = L.win;
  for (const c of laWallCells(-W - T, W + T, 0, H, [[wi.x[0], wi.x[1], wi.y[0], wi.y[1]]])) laBox(c[1] - c[0], c[3] - c[2], T, M.wallN, (c[0] + c[1]) / 2, (c[2] + c[3]) / 2, -D - T / 2, room);
  const dr = L.door;
  for (const c of laWallCells(-W - T, W + T, 0, H, [[dr.x[0], dr.x[1], 0, dr.h]])) laBox(c[1] - c[0], c[3] - c[2], T, M.wall, (c[0] + c[1]) / 2, (c[2] + c[3]) / 2, D + T / 2, room);
  { const dd = laBox(dr.x[1] - dr.x[0] - 0.02, dr.h - 0.01, 0.04, M.door, (dr.x[0] + dr.x[1]) / 2, dr.h / 2, D + 0.06, room); laBox(0.12, 0.03, 0.05, M.handle, dr.x[0] + 0.12, 1.02, D + 0.0, room); dd.castShadow = true; }
  for (const [a, b, y] of [[dr.x[0] - 0.05, dr.x[0], 0], [dr.x[1], dr.x[1] + 0.05, 0]]) laBox(b - a, dr.h + 0.05, 0.06, M.frame, (a + b) / 2, dr.h / 2, D - 0.02, room);
  // skirting
  for (const [x, z, w, d] of [[0, -D + 0.01, L.W, 0.02], [-W + 0.01, 0, 0.02, L.D], [W - 0.01, 0, 0.02, L.D]]) laBox(w, 0.1, d, M.skirt, x, 0.05, z, room);
  for (const [a, b] of [[-W, dr.x[0] - 0.05], [dr.x[1] + 0.05, W]]) laBox(b - a, 0.1, 0.02, M.skirt, (a + b) / 2, 0.05, D - 0.01, room);
  // ---- the window: frame, a mullion, the glass, the sill; the radiator under it; the curtain rail
  { const cx = (wi.x[0] + wi.x[1]) / 2, cy = (wi.y[0] + wi.y[1]) / 2, ww = wi.x[1] - wi.x[0], hh = wi.y[1] - wi.y[0], z = -D - 0.12;
    for (const [bx, by, bw, bh] of [[cx, wi.y[1] - 0.03, ww, 0.06], [cx, wi.y[0] + 0.03, ww, 0.06], [wi.x[0] + 0.03, cy, 0.06, hh], [wi.x[1] - 0.03, cy, 0.06, hh], [cx + 0.25, cy, 0.05, hh - 0.1]]) laBox(bw, bh, 0.08, M.frame, bx, by, z, room);
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(ww - 0.1, hh - 0.1), M.glass); gl.position.set(cx, cy, z); gl.renderOrder = 4; room.add(gl); R.glass = gl;
    const sl = L.sill; laBox(sl.x[1] - sl.x[0], sl.y[1] - sl.y[0], sl.z[1] - sl.z[0], M.frame, (sl.x[0] + sl.x[1]) / 2, (sl.y[0] + sl.y[1]) / 2, (sl.z[0] + sl.z[1]) / 2, room);
    const rd = L.rad, rx = (rd.x[0] + rd.x[1]) / 2, rw = rd.x[1] - rd.x[0];
    for (let i = 0; i < 18; i++) laBox(0.05, rd.y[1] - rd.y[0], 0.06, M.rad, rd.x[0] + 0.05 + i * (rw - 0.1) / 17, (rd.y[0] + rd.y[1]) / 2, -D + 0.05, room);
    laBox(rw, 0.03, 0.08, M.rad, rx, rd.y[1] - 0.015, -D + 0.05, room); laBox(rw, 0.03, 0.08, M.rad, rx, rd.y[0] + 0.015, -D + 0.05, room);
    laCyl(0.012, 0.012, 2.95, M.metal, (L.rail.x[0] + L.rail.x[1]) / 2, L.rail.y, -D + 0.09, room, 8).rotation.z = Math.PI / 2;
    for (const x of L.rail.x) laBox(0.03, 0.06, 0.1, M.metal, x, L.rail.y + 0.02, -D + 0.05, room);
  }
  // ---- the curtains: two panels hanging from the rail (they hang along down: sheared in the wall's plane)
  R.curtains = [];
  { const mat = laStd('#ffffff', 0.95, 0, { map: tex(laFabricCanvas('#c98e5a', 21), 2, 3), side: THREE.DoubleSide });
    for (const [x0, x1] of [[L.rail.x[0], L.rail.x[0] + 0.62], [L.rail.x[1] - 0.62, L.rail.x[1]]]) {
      const len = 2.25, nx = 10, ny = 12, geo = new THREE.PlaneGeometry(x1 - x0, len, nx, ny);
      const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.position.set(0, 0, -D + 0.12); room.add(m);
      R.curtains.push({ m, geo, x0, x1, len, nx, ny, base: Float32Array.from(geo.attributes.position.array) });
    } }
  // ---- the ceiling lamp: a rose, the flex, a drum shade with its bulb (pivots at the rose)
  { const lp = L.lamp, g = new THREE.Group(); g.position.set(lp.x, H, lp.z); room.add(g); R.lamp = g;
    laCyl(0.06, 0.06, 0.03, M.white, 0, -0.015, 0, g, 18);
    const swing = new THREE.Group(); g.add(swing); R.lampSwing = swing;
    laCyl(0.004, 0.004, lp.cord, M.flex, 0, -lp.cord / 2, 0, swing, 6);
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.24, 0.24, 28, 1, true), M.shadeC); sh.position.y = -lp.cord - 0.1; sh.castShadow = false; swing.add(sh); R.lampShade = sh;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), M.bulb); bulb.position.y = -lp.cord - 0.1; swing.add(bulb); R.lampBulb = bulb;
    const light = new THREE.PointLight('#ffd7a0', 0, 9, 1.6); light.position.y = -lp.cord - 0.1; swing.add(light); R.lampLight = light; }
  // ---- the clock and two prints on the south wall (they hang on nails: they swing along down, then drop off)
  R.hung = [];
  { const mk = (x, y, build, drop) => { const g = new THREE.Group(); g.position.set(x, y, D - 0.02); room.add(g); const inner = new THREE.Group(); g.add(inner); build(inner); R.hung.push({ g, inner, drop, x, y }); };
    mk(-0.6, 2.05, (g) => { const f = laCyl(0.17, 0.17, 0.04, M.black, 0, -0.17, -0.02, g, 32); f.rotation.x = Math.PI / 2; const face = new THREE.Mesh(new THREE.CircleGeometry(0.155, 32), M.clock); face.position.set(0, -0.17, -0.045); face.rotation.y = Math.PI; g.add(face);
      R.hands = [0.1, 0.13, 0.15].map((l, i) => { const h = new THREE.Group(); h.position.set(0, -0.17, -0.05); g.add(h); laBox([0.012, 0.008, 0.003][i], l, 0.004, i === 2 ? laStd('#b8322a', 0.5) : M.black, 0, l / 2 - 0.02, 0, h); return h; }); }, 97);
    mk(0.25, 1.95, (g) => { laBox(0.46, 0.58, 0.03, M.black, 0, -0.29, -0.015, g); const p = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.52), M.prints[0]); p.position.set(0, -0.29, -0.032); p.rotation.y = Math.PI; g.add(p); }, 101);
    mk(-1.75, 1.9, (g) => { laBox(0.36, 0.46, 0.03, laStd('#e8e4da', 0.5), 0, -0.23, -0.015, g); const p = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.38), M.prints[1]); p.position.set(0, -0.23, -0.032); p.rotation.y = Math.PI; g.add(p); }, 104); }

  // ==================================================================== THE SIMULATED THINGS (one group per body)
  const bk = (b) => b.parts;
  const P = (p) => ({ hx: p[1], hy: p[2], hz: p[3], o: p[0] === 'box' ? p.slice(4, 7) : p[0] === 'cyl' ? p.slice(3, 6) : p.slice(2, 5) });
  let bi = 0;
  for (const b of L.bodies) {
    const g = new THREE.Group(); g.position.set(b.pos[0], b.pos[1], b.pos[2]); room.add(g); R.bodies[b.id] = g; g.userData.b = b;
    const pp = b.parts.map(P), box = (k, m, s = [1, 1, 1], r = 0.02) => { const q = pp[k]; const o = laMesh(laRoundBox(2 * q.hx * s[0], 2 * q.hy * s[1], 2 * q.hz * s[2], Math.min(r, q.hx * 0.9, q.hz * 0.9), Math.min(r * 0.6, q.hy * 0.4)), m, q.o[0], q.o[1] - q.hy * s[1], q.o[2], g); return o; };
    const cyl = (k, m, seg = 20) => { const p = b.parts[k]; return laCyl(p[2], p[2], 2 * p[1], m, p[3], p[4], p[5], g, seg); };
    switch (b.kind) {
      case 'sofa': box(0, M.sofaD, [1, 1, 1], 0.06); box(1, M.sofa, [1, 1, 1], 0.08); box(2, M.sofa, [1, 1, 1], 0.06); box(3, M.sofa, [1, 1, 1], 0.06);
        for (const z of [-0.62, 0.0, 0.62]) laMesh(laRoundBox(0.66, 0.14, 0.6, 0.06, 0.04), M.sofa, -0.08, 0.42, z, g);
        for (const [x, z] of [[-0.4, -0.98], [0.4, -0.98], [-0.4, 0.98], [0.4, 0.98]]) laCyl(0.025, 0.02, 0.06, M.wood, x, 0.03, z, g, 8); break;
      case 'cushion': box(0, M.cush[bi % 3], [1, 1, 1], 0.07); break;
      case 'rug': { const q = pp[0], m = new THREE.Mesh(new THREE.BoxGeometry(2 * q.hx, 2 * q.hy, 2 * q.hz), [M.rug, M.rug, M.rug, M.rug, M.rug, M.rug]); m.position.set(0, q.hy, 0); m.receiveShadow = true; g.add(m); break; }
      case 'table': box(0, M.woodL, [1, 1, 1], 0.01); for (let k = 1; k < 5; k++) box(k, M.wood, [1, 1, 1], 0.005); break;
      case 'glass': { const p = b.parts[0], cup = new THREE.Mesh(new THREE.CylinderGeometry(p[2], p[2] * 0.85, 2 * p[1], 20, 1, true), M.cup); cup.position.set(0, p[1], 0); g.add(cup);
        const wg = new THREE.Group(); wg.position.set(0, p[1], 0); g.add(wg); const wt = new THREE.Mesh(new THREE.CircleGeometry(p[2] * 0.95, 20), M.water); wt.rotation.x = -Math.PI / 2; wg.add(wt);
        const body = new THREE.Mesh(new THREE.CylinderGeometry(p[2] * 0.95, p[2] * 0.82, 2 * p[1] * 0.82, 20), M.water); body.position.y = -p[1] * 0.18 - 0.0; wg.add(body);
        R.glassWater = { wg, wt, body, h: p[1] }; break; }
      case 'bowl': { const p = b.parts[0], pts = []; for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI / 2; pts.push(new THREE.Vector2(p[2] * Math.sin(a) + 0.001, p[1] * 2 * (1 - Math.cos(a)))); } const m = laMesh(new THREE.LatheGeometry(pts, 24), M.bowl, 0, 0, 0, g); m.material = M.bowl; M.bowl.side = THREE.DoubleSide;
        for (const [x, z, c] of [[0.03, 0.02, '#d9832e'], [-0.04, 0.01, '#c4302a'], [0.0, -0.045, '#9ab83a']]) laMesh(new THREE.SphereGeometry(0.035, 12, 8), laStd(c, 0.5), x, 0.05, z, g); break; }
      case 'book': { const q = pp[0], mats = [M.pages, M.books[(bi * 7) % 12], M.books[(bi * 7) % 12], M.books[(bi * 7) % 12], M.books[(bi * 7) % 12], M.books[(bi * 7) % 12]];
        const spineE = b.id.startsWith('book');                    // (shelf books: the spine faces east, out of the bookcase)
        const m = new THREE.Mesh(new THREE.BoxGeometry(2 * q.hx, 2 * q.hy, 2 * q.hz), spineE ? [M.books[(bi * 7) % 12], M.pages, M.pages, M.pages, M.books[(bi * 7) % 12], M.books[(bi * 7) % 12]] : mats);
        m.position.set(q.o[0], q.o[1], q.o[2]); m.castShadow = m.receiveShadow = true; g.add(m); break; }
      case 'remote': box(0, M.black, [1, 1, 1], 0.008); break;
      case 'stand': box(0, M.wood, [1, 1, 1], 0.01); laBox(0.005, 0.02, 1.3, M.metal, pp[0].hx + 0.002, 0.3, 0, g); break;
      case 'tv': { box(0, M.black, [1, 1, 1], 0.01); box(1, M.black, [1, 1, 1], 0.005); box(2, M.black, [1, 1, 1], 0.008);
        const q = pp[2], ct = laCanvasTex(512, 288, laTvDraw), scr = new THREE.Mesh(new THREE.PlaneGeometry(2 * q.hz * 0.96, 2 * q.hy * 0.94), new THREE.MeshBasicMaterial({ map: ct.tex, toneMapped: false }));
        scr.position.set(q.o[0] + q.hx + 0.001, q.o[1], q.o[2]); scr.rotation.y = Math.PI / 2; g.add(scr); R.tv = { ct, scr }; break; }
      case 'bookcase': for (let k = 0; k < b.parts.length; k++) box(k, M.white, [1, 1, 1], 0.004); break;
      case 'armchair': box(0, M.arm, [1, 1, 1], 0.06); box(1, M.arm, [1, 1, 1], 0.07); box(2, M.arm, [1, 1, 1], 0.05); box(3, M.arm, [1, 1, 1], 0.05);
        laMesh(laRoundBox(0.62, 0.12, 0.62, 0.05, 0.04), M.arm, 0, 0.42, -0.06, g); break;
      case 'sidetable': box(0, M.metal, [1, 1, 1], 0.01); box(1, M.metal, [1, 1, 1], 0.01); box(2, M.woodL, [1, 1, 1], 0.01); break;
      case 'tablelamp': { const p0 = b.parts[0], p1 = b.parts[1];
        laMesh(new THREE.SphereGeometry(p0[2] * 1.15, 18, 12).scale(1, p0[1] / p0[2], 1), M.ceramic, 0, p0[4], 0, g);
        const sh = new THREE.Mesh(new THREE.CylinderGeometry(p1[2] * 0.75, p1[2], 2 * p1[1], 24, 1, true), M.shade); sh.position.set(0, p1[4], 0); g.add(sh);
        const lt = new THREE.PointLight('#ffcf8a', 0, 5, 1.8); lt.position.set(0, p1[4] - 0.02, 0); g.add(lt); R.tlampLight = lt; break; }
      case 'sideboard': box(0, M.wood, [1, 1, 1], 0.01); for (const z of [-0.35, 0.35]) laBox(0.005, 0.5, 0.62, M.woodL, pp[0].hx * -1 - 0.003, 0.42, z, g); for (const z of [-0.35, 0.35]) laBox(0.02, 0.02, 0.12, M.brass, -pp[0].hx - 0.01, 0.62, z, g); break;
      case 'vase': { const p = b.parts[0]; cyl(0, M.ceramic, 18); for (let k = 0; k < 5; k++) { const a = k * 1.3, st = laCyl(0.003, 0.003, 0.32, M.stem, Math.cos(a) * 0.02, 2 * p[1] + 0.14, Math.sin(a) * 0.02, g, 5); st.rotation.set(Math.sin(a) * 0.2, 0, Math.cos(a) * 0.2); laMesh(new THREE.SphereGeometry(0.025, 8, 6), M.flower, Math.cos(a) * 0.05, 2 * p[1] + 0.3, Math.sin(a) * 0.05, g); } break; }
      case 'photo': { box(0, M.black, [1, 1, 1], 0.003); const q = pp[0], pic = new THREE.Mesh(new THREE.PlaneGeometry(2 * q.hz * 0.8, 2 * q.hy * 0.8), M.prints[0]); pic.position.set(-q.hx - 0.001, q.o[1], 0); pic.rotation.y = -Math.PI / 2; g.add(pic); break; }
      case 'bookpile': { const q = pp[0]; for (let k = 0; k < 3; k++) laBox(2 * q.hx * (1 - 0.06 * k), 2 * q.hy / 3, 2 * q.hz * (1 - 0.05 * k), M.books[(k * 5 + 2) % 12], 0, q.hy / 3 * (2 * k + 1), 0, g); break; }
      case 'floorlamp': { cyl(0, M.metal, 24); cyl(1, M.brass, 8); const p = b.parts[2]; const sh = new THREE.Mesh(new THREE.CylinderGeometry(p[2] * 0.7, p[2], 2 * p[1], 24, 1, true), M.shade); sh.position.set(0, p[4], 0); g.add(sh);
        const lt = new THREE.PointLight('#ffcf8a', 0, 6, 1.8); lt.position.set(0, p[4] - 0.05, 0); g.add(lt); R.flampLight = lt; break; }
      case 'plant': { const p = b.parts[0]; laCyl(p[2], p[2] * 0.8, 2 * p[1], M.terracotta, 0, p[1], 0, g, 18); laCyl(p[2] * 0.95, p[2] * 0.95, 0.02, M.soil, 0, 2 * p[1] - 0.02, 0, g, 18);
        const r = new RNG(77); for (let k = 0; k < 9; k++) { const a = r.range(0, 6.28), e = r.range(0.2, 1.1), d = r.range(0.12, 0.3), lf = laMesh(new THREE.SphereGeometry(r.range(0.12, 0.2), 8, 6).scale(1.4, 0.35, 0.9), k % 2 ? M.leaf : M.leaf2, Math.cos(a) * d, 0.5 + e * 0.4, Math.sin(a) * d, g); lf.rotation.set(r.range(-0.6, 0.6), a, r.range(-0.5, 0.5)); } break; }
      case 'pouffe': { const p = b.parts[0]; laMesh(laRoundBox(2 * p[2], 2 * p[1], 2 * p[2], p[2] * 0.95, 0.06), M.pouffe, 0, 0, 0, g); break; }
      default: for (let k = 0; k < b.parts.length; k++) if (b.parts[k][0] === 'box') box(k, M.white);
    }
    bi++;
  }
  // ---- the football by the window (it goes soft), the crisp packet and the bottle on the table, the cat's bowl
  { const geo = new THREE.IcosahedronGeometry(0.11, 2).toNonIndexed(), n = geo.attributes.position.count, col = new Float32Array(n * 3);
    for (let f = 0; f < n / 3; f++) { const c = f % 5 === 0 ? 0.08 : 0.92; for (let k = 0; k < 3; k++) col.set([c, c, c * 0.98], (f * 3 + k) * 3); }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
    R.ball = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, flatShading: true })); R.ball.castShadow = true;
    R.ball.position.set(1.55, 0.11, -1.45); room.add(R.ball); R.ballBase = Float32Array.from(geo.attributes.position.array); }
  { const top = 0.0125 + 0.425, g = new THREE.Group(); g.position.set(-0.7, top, 0.08); g.rotation.y = 0.5; room.add(g);
    // a crisp packet: a pillow of foil (sealed with air in it, it shrinks onto its crisps)
    const geo = new THREE.SphereGeometry(1, 20, 12); geo.scale(0.085, 0.045, 0.12); geo.translate(0, 0.045, 0);
    const ct = laCanvas(128, 128, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#c4262a'); gr.addColorStop(0.5, '#e8443a'); gr.addColorStop(1, '#b01f24'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = '#ffd34a'; c.beginPath(); c.arc(w / 2, h / 2, 26, 0, 6.28); c.fill(); c.fillStyle = '#fff'; c.fillRect(0, 54, w, 6); });
    const m = new THREE.Mesh(geo, laStd('#ffffff', 0.35, 0.45, { map: laTex(ct, { repeat: false }) })); m.castShadow = true; g.add(m);
    R.packet = { m, geo, base: Float32Array.from(geo.attributes.position.array) };
    // a plastic bottle, cap on (it crumples)
    const b = new THREE.Group(); b.position.set(-0.98, top, 0.42); room.add(b);
    const bg = new THREE.CylinderGeometry(0.035, 0.035, 0.2, 16, 6); bg.translate(0, 0.1, 0);
    const bm = new THREE.Mesh(bg, new THREE.MeshStandardMaterial({ color: '#cfe4ee', transparent: true, opacity: 0.45, roughness: 0.08, envMapIntensity: 1.4 })); b.add(bm);
    laCyl(0.014, 0.014, 0.02, laStd('#2a6ad0', 0.4), 0, 0.235, 0, b, 12); laCyl(0.02, 0.035, 0.03, bm.material, 0, 0.215, 0, b, 16);
    R.bottle = { bm, bg, base: Float32Array.from(bg.attributes.position.array) };
    // the cat's bowl, by the sideboard, with water in it
    const cb = new THREE.Group(); cb.position.set(1.85, 0, 0.45); room.add(cb);
    const pts = []; for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2; pts.push(new THREE.Vector2(0.075 + 0.025 * Math.sin(a), 0.055 * (1 - Math.cos(a)))); }
    laMesh(new THREE.LatheGeometry([new THREE.Vector2(0, 0.004), new THREE.Vector2(0.06, 0.004), ...pts], 24), laStd('#c95a3a', 0.35), 0, 0, 0, cb);
    const w = new THREE.Mesh(new THREE.CircleGeometry(0.072, 24), M.water); w.rotation.x = -Math.PI / 2; w.position.y = 0.04; cb.add(w);
    R.bowlW = w;
  }
  // ---- the film of liquid on the floor (millimetres: it shines), drops on the table and the sill
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(L.W - 0.02, L.D - 0.02), new THREE.MeshStandardMaterial({ color: '#9fb6c4', transparent: true, opacity: 0, roughness: 0.03, metalness: 0.0, envMapIntensity: 1.8, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.004; m.renderOrder = 2; room.add(m); R.film = m; }
  R.update = (s, o) => laRoomUpdate(R, s, o || {});
  return R;
}

function laRoomUpdate(R, s, o) {
  const L = LA_ROOM, dusk = laDusk(s), lit = o.lights ?? 1;
  // ---- the lamps: on at 3:00:20 (you switch them on as the light goes); after 3:10 nobody is here
  const on = laSm(s, 18, 19) * (s < 600 ? 1 : 0.0);
  R.lampLight.intensity = 3.0 * on * lit; R.M.shadeC.emissiveIntensity = 0.6 * on; R.lampBulb.visible = true;
  if (R.tlampLight) R.tlampLight.intensity = 1.6 * on * lit;
  if (R.flampLight) R.flampLight.intensity = 2.2 * on * lit;
  R.M.shade.emissiveIntensity = 0.55 * on;
  R.lampSwing.rotation.set(0, 0, 0);
  if (R.tv) R.tv.ct.update({ off: false, crack: false });
  // ---- the curtains hang still
  for (const C of R.curtains) {
    if (C.done) continue;
    const p = C.geo.attributes.position, top = L.rail.y, cx = (C.x0 + C.x1) / 2;
    for (let i = 0; i < p.count; i++) { const bx = C.base[i * 3], by = C.base[i * 3 + 1], v = (C.len / 2 - by); p.setXYZ(i, cx + bx, top - v, 0.03 * Math.sin(bx * 22 + v * 3)); }
    p.needsUpdate = true; C.geo.computeVertexNormals(); C.done = true;
  }
  if (R.hands) { const c = laClockParts(s); R.hands[0].rotation.z = -((c.h % 12) + c.m / 60) / 12 * Math.PI * 2; R.hands[1].rotation.z = -(c.m + c.sec / 60) / 60 * Math.PI * 2; R.hands[2].rotation.z = -c.sec / 60 * Math.PI * 2; }
  // ---- the sealed things: the crisp packet (1 atm inside) and the bottle (1 atm) shrink; the football (1.8 atm) goes soft
  { const k = Math.min(1, 2.6 * laSealed(s, 1.0).squash), P = R.packet, p = P.geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = P.base[i * 3], y = P.base[i * 3 + 1], z = P.base[i * 3 + 2], cr = 1 + 0.25 * k * Math.sin(x * 140 + z * 90);
      p.setXYZ(i, x * (1 - 0.12 * k) * cr, Math.max(0.006, y * (1 - 0.72 * k)) , z * (1 - 0.06 * k)); }
    p.needsUpdate = true; P.geo.computeVertexNormals(); }
  { const k = Math.min(1, 2.6 * laSealed(s, 1.0).squash), B = R.bottle, p = B.bg.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = B.base[i * 3], y = B.base[i * 3 + 1], z = B.base[i * 3 + 2], a = Math.atan2(z, x), dent = 1 - 0.55 * k * (0.5 + 0.5 * Math.cos(2 * a + y * 30)) * laSm(y, 0.02, 0.06) * (1 - laSm(y, 0.17, 0.2));
      p.setXYZ(i, x * dent, y * (1 - 0.06 * k), z * dent); }
    p.needsUpdate = true; B.bg.computeVertexNormals(); }
  { const k = laSealed(s, 1.8).squash, p = R.ball.geometry.attributes.position, b = R.ballBase;
    for (let i = 0; i < p.count; i++) { const x = b[i * 3], y = b[i * 3 + 1], z = b[i * 3 + 2], sag = 1 - 0.5 * k * laSm(y, 0.04, -0.11) * 0 - 0.45 * k * (0.5 + 0.5 * y / 0.11);
      p.setXYZ(i, x * (1 + 0.25 * k * (1 - Math.abs(y) / 0.11)), y * sag - 0.03 * k * (y > 0 ? 1 : 0), z * (1 + 0.25 * k * (1 - Math.abs(y) / 0.11))); }
    p.needsUpdate = true; R.ball.geometry.computeVertexNormals(); R.ball.position.y = 0.11 - 0.035 * k; }
  // ---- the liquid on the floor: a wet shine from 3:00 (≈ 1 cm by 3:10)
  R.film.material.opacity = 0.45 * laSm(s, 4, 90);
  // ---- after 3:10, in the vacuum: the glass and the cat's bowl boil (bubbles: liquid.js), then freeze over
  { const ice = laSm(s, LA_BOIL.freeze0, LA_BOIL.freeze1);
    R.M.water.color.setRGB(0.74 + 0.2 * ice, 0.84 + 0.12 * ice, 0.88 + 0.1 * ice); R.M.water.opacity = 0.55 + 0.35 * ice; R.M.water.roughness = 0.04 + 0.5 * ice; }
  R.room.updateMatrixWorld(true);
}
