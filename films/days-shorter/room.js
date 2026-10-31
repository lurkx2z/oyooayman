/* =====================================================================
   ROOM — your living room on the top (fifth) floor (layout.js: DS_ROOM; the liquid-air / gravity films' room). Its
   window looks south over the park, so the sun crosses it every day: its patch of light sweeps the floor. New here:
   the TV (a show, then NO SIGNAL once the satellites are gone, then the news), a kitchen scale with a 1 kg bag of
   sugar, a marble on the floor. As down leans south the ceiling lamp and the pictures hang crooked, the water in the
   glass and the cat's bowl lies crooked, the marble rolls, and on Saturday the furniture breaks loose and slides to the
   window wall (physics.js dsSlider: the friction values are in script.js DS_MU). Posed by update(s), pure.
     dsBuildRoom(S) → R
   ===================================================================== */

// ---- canvases
function dsFloorCanvas(seed, w = 512, h = 1024) {                 // oak floorboards
  const r = new RNG(seed);
  return dsCanvas(w, h, (g) => {
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
function dsPaintCanvas(seed, col, w = 256, h = 256) {
  return dsCanvas(w, h, (g) => {
    g.fillStyle = col; g.fillRect(0, 0, w, h);
    const im = g.getImageData(0, 0, w, h), d = im.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const n = (hash2(x >> 1, y >> 1 + seed) - 0.5) * 6 + (hash2(x >> 4, y >> 3) - 0.5) * 5, i = (y * w + x) * 4; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(im, 0, 0);
  });
}
function dsFabricCanvas(col, seed, w = 256, h = 256) {            // a woven fabric
  const c = new THREE.Color(col), b = [c.r * 255, c.g * 255, c.b * 255];
  return dsCanvas(w, h, (g) => {
    const im = g.createImageData(w, h), d = im.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const wv = ((x >> 1) + (y >> 1)) % 2 ? 1.04 : 0.96, n = 1 + (hash2(x + seed, y) - 0.5) * 0.1, i = (y * w + x) * 4;
      d[i] = b[0] * wv * n; d[i + 1] = b[1] * wv * n; d[i + 2] = b[2] * wv * n; d[i + 3] = 255;
    }
    g.putImageData(im, 0, 0);
  });
}
function dsRugCanvas(w = 512, h = 384) {                          // a rug: navy, rust and cream, a geometric border
  return dsCanvas(w, h, (g) => {
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
function dsPrintCanvas(kind, w = 256, h = 320) {                  // two framed prints
  return dsCanvas(w, h, (g) => {
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
function dsClockFaceCanvas(w = 256) {
  return dsCanvas(w, w, (g) => {
    g.fillStyle = '#f6f3ec'; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 2, 0, 6.28); g.fill();
    g.strokeStyle = '#1d1f22'; g.lineWidth = 10; g.stroke();
    for (let i = 0; i < 60; i++) { const a = i / 60 * 6.283, L = i % 5 ? 8 : 20, r0 = w / 2 - 16; g.lineWidth = i % 5 ? 2 : 5; g.beginPath(); g.moveTo(w / 2 + Math.sin(a) * r0, w / 2 - Math.cos(a) * r0); g.lineTo(w / 2 + Math.sin(a) * (r0 - L), w / 2 - Math.cos(a) * (r0 - L)); g.stroke(); }
  });
}
// the TV picture: the football results (Saturday, 4 PM), then the crack and black
function dsTvDraw(g, w, h, st) {
  g.fillStyle = '#05070a'; g.fillRect(0, 0, w, h);
  if (st.mode === 'nosignal') {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1d3f8a'); gr.addColorStop(1, '#0f2456'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(w * 0.18, h * 0.36, w * 0.64, h * 0.3);
    g.fillStyle = '#f2f2f2'; g.font = '700 46px Arial'; g.textAlign = 'center'; g.fillText('NO SIGNAL', w / 2, h * 0.5);
    g.font = '600 20px Arial'; g.fillText('CHECK YOUR SATELLITE DISH', w / 2, h * 0.6); return;
  }
  if (st.mode === 'news') {
    g.fillStyle = '#0b1a2e'; g.fillRect(0, 0, w, h);
    // a map strip: the equator band rising (blue, arrows in), the north draining
    const cx = w * 0.5, cy = h * 0.47, R = h * 0.33;
    g.fillStyle = '#123a66'; g.beginPath(); g.arc(cx, cy, R, 0, 6.283); g.fill();
    g.fillStyle = '#3c7a3a'; for (const [x, y, rx, ry] of [[-0.35, -0.35, 0.3, 0.22], [0.2, -0.4, 0.38, 0.2], [-0.25, 0.25, 0.16, 0.3], [0.3, 0.1, 0.14, 0.26]]) { g.beginPath(); g.ellipse(cx + x * R, cy + y * R, rx * R, ry * R, 0, 0, 6.283); g.fill(); }
    g.fillStyle = 'rgba(90,170,255,0.55)'; g.fillRect(cx - R, cy - R * 0.12, 2 * R, R * 0.24);
    g.strokeStyle = '#ffcf8a'; g.lineWidth = 5; for (const sy of [-1, 1]) for (const sx of [-0.5, 0, 0.5]) { const x = cx + sx * R, y0 = cy + sy * R * 0.62, y1 = cy + sy * R * 0.2; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.lineTo(x - 8, y1 + sy * 12); g.moveTo(x, y1); g.lineTo(x + 8, y1 + sy * 12); g.stroke(); }
    g.fillStyle = '#b8202a'; g.fillRect(0, h * 0.82, w, h * 0.18); g.fillStyle = '#fff'; g.font = '700 26px Arial'; g.textAlign = 'left'; g.fillText('BREAKING: OCEANS FLOWING TOWARDS THE EQUATOR', 18, h * 0.93);
    g.fillStyle = '#fff'; g.font = '700 22px Arial'; g.fillText('LIVE', 18, 34); return;
  }
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1b5a3a'); gr.addColorStop(1, '#0f3a24'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,0.08)'; for (let x = 0; x < w; x += 40) g.fillRect(x, 0, 20, h);
  g.fillStyle = 'rgba(8,16,30,0.82)'; g.fillRect(w * 0.08, h * 0.12, w * 0.84, h * 0.76);
  g.fillStyle = '#f2f2f2'; g.font = '700 26px Arial'; g.textAlign = 'left'; g.fillText('HALF-TIME SCORES', w * 0.12, h * 0.24);
  g.font = '600 20px Arial';
  const L = [['CITY', 1, 0, 'ROVERS'], ['UNITED', 2, 2, 'ALBION'], ['TOWN', 0, 1, 'WANDERERS'], ['ATHLETIC', 3, 1, 'COUNTY']];
  L.forEach(([a, x, y, b], i) => { const yy = h * (0.38 + i * 0.12); g.textAlign = 'left'; g.fillText(a, w * 0.12, yy); g.textAlign = 'center'; g.fillText(`${x} – ${y}`, w * 0.55, yy); g.textAlign = 'right'; g.fillText(b, w * 0.88, yy); });
}

// the things in your room that slide on Saturday: { id, f (south distance at s), max (the farthest it can go: to the
// window wall), y0, hit (story s it reaches the wall) }. Pure, built once at load
const DS_ROOM_SLIDE = [['sofa', 'sofa'], ['armchair', 'chair'], ['pouffe', 'pouffe'], ['table', 'table'], ['side', 'chair'], ['tlamp', 'chair'], ['rug', 'table'], ['flamp', 'chair'], ['stand', 'table'], ['tv', 'table']]
  .map(([id, mk]) => {
    const b = DS_ROOM.bodies.find((x) => x.id === id), hz = Math.max(...b.parts.map((p) => (p[0] === 'box' ? p[3] + Math.abs(p[6]) : p[0] === 'cyl' ? p[2] + Math.abs(p[5]) : p[1])));
    const f = dsSlider(DS_MU[mk], 1, 600), max = b.pos[2] - (-DS_ROOM.D / 2 + 0.12 + hz);
    let a = f.s0, c = f.s0 + 600; for (let k = 0; k < 50; k++) { const m = (a + c) / 2; if (f(m) < max) a = m; else c = m; }
    return { id, f, max, y0: b.pos[1], hit: c };
  });

function dsBuildRoom(S) {
  const scene = S.scene, R = { M: {}, bodies: {} }, tex = (c, rx, ry) => { const t = dsTex(c); t.repeat.set(rx, ry); return t; };
  const M = R.M = {
    floor: dsStd('#ffffff', 0.55, 0, { map: tex(dsFloorCanvas(13), 1.4, 1.6) }),
    wall: dsStd('#ffffff', 0.92, 0, { map: tex(dsPaintCanvas(3, '#e6dfd2'), 3, 2) }),
    wallN: dsStd('#ffffff', 0.92, 0, { map: tex(dsPaintCanvas(4, '#e6dfd2'), 3, 2) }),
    wallW: dsStd('#ffffff', 0.92, 0, { map: tex(dsPaintCanvas(5, '#a9b8b0'), 3, 2) }),     // (a feature wall, sage)
    ceil: dsStd('#f4f2ec', 0.95), skirt: dsStd('#f1efe8', 0.5), frame: dsStd('#f6f4ef', 0.45),
    glass: new THREE.MeshStandardMaterial({ color: '#2c3338', transparent: true, opacity: 0.3, roughness: 0.45, metalness: 0.0, envMapIntensity: 0.4, depthWrite: false, side: THREE.DoubleSide }),
    rad: dsStd('#f2f1ed', 0.4, 0.2), door: dsStd('#f3f1eb', 0.5), handle: dsStd('#b9b3a6', 0.3, 0.8),
    sofa: dsStd('#ffffff', 0.95, 0, { map: tex(dsFabricCanvas('#5f6e7c', 1), 3, 3) }), sofaD: dsStd('#ffffff', 0.95, 0, { map: tex(dsFabricCanvas('#526170', 2), 3, 3) }),
    arm: dsStd('#ffffff', 0.95, 0, { map: tex(dsFabricCanvas('#b8693f', 3), 2, 2) }),
    cush: ['#d9a441', '#e8e0d0', '#9a4b3b'].map((c, i) => dsStd('#ffffff', 0.95, 0, { map: tex(dsFabricCanvas(c, 7 + i), 1, 1) })),
    pouffe: dsStd('#ffffff', 0.95, 0, { map: tex(dsFabricCanvas('#c9b99a', 11), 2, 1) }),
    wood: dsStd('#ffffff', 0.55, 0, { map: (() => { const t = dsTex(dsWoodCanvas(21, 256, 1024, [150, 104, 66])); t.repeat.set(1, 1); return t; })() }),
    woodL: dsStd('#ffffff', 0.55, 0, { map: (() => { const t = dsTex(dsWoodCanvas(23, 256, 1024, [196, 160, 118])); t.rotation = Math.PI / 2; return t; })() }),
    white: dsStd('#f1efe9', 0.55), black: dsStd('#141518', 0.35, 0.3), metal: dsStd('#2b2c2e', 0.35, 0.7), brass: dsStd('#b89a5a', 0.3, 0.85),
    rug: dsStd('#ffffff', 0.97, 0, { map: dsTex(dsRugCanvas(), { repeat: false }) }),
    shade: dsStd('#f2e9d6', 0.85, 0, { side: THREE.DoubleSide, emissive: new THREE.Color('#ffcf8a'), emissiveIntensity: 0.0 }),
    shadeC: dsStd('#e9e2d2', 0.85, 0, { side: THREE.DoubleSide, emissive: new THREE.Color('#ffcf8a'), emissiveIntensity: 0.0 }),
    bulb: new THREE.MeshBasicMaterial({ color: '#fff1d0' }), flex: dsStd('#f0eee8', 0.6),
    ceramic: dsStd('#3f6f7a', 0.3), terracotta: dsStd('#b0603e', 0.8), leaf: dsStd('#3f6b35', 0.85), leaf2: dsStd('#557f3f', 0.85), soil: dsStd('#3a2c22', 1),
    pages: dsStd('#efe8d8', 0.9), cup: new THREE.MeshStandardMaterial({ color: '#eef4f6', transparent: true, opacity: 0.3, roughness: 0.05, envMapIntensity: 1.4, depthWrite: false }),
    water: new THREE.MeshStandardMaterial({ color: '#86bcd6', transparent: true, opacity: 0.68, roughness: 0.04, envMapIntensity: 1.6, depthWrite: false, side: THREE.DoubleSide }),
    bowl: dsStd('#d8d2c6', 0.35), clock: dsStd('#ffffff', 0.5, 0, { map: dsTex(dsClockFaceCanvas(), { repeat: false }) }),
    prints: [0, 1].map((k) => dsStd('#ffffff', 0.8, 0, { map: dsTex(dsPrintCanvas(k), { repeat: false }) })),
    stem: dsStd('#4a6a3a', 0.8), flower: dsStd('#e8c24a', 0.7),
  };
  M.books = ['#7a2e2a', '#2f4a6b', '#d9c9a3', '#3c5a3c', '#b8862e', '#1f2a36', '#a35a3a', '#e3ddd0', '#5b3c5e', '#2d2d2d', '#3d6f7a', '#c98a5a'].map((c) => dsStd(c, 0.8));

  const L = DS_ROOM, W = L.W / 2, D = L.D / 2, H = L.H;
  const room = new THREE.Group(); room.name = 'room'; room.position.set(...L.origin); scene.add(room); R.room = room;
  room.updateMatrixWorld(true);
  R.toWorld = (x, y, z, out) => (out || new THREE.Vector3()).set(x, y, z).applyMatrix4(room.matrixWorld);
  const T = 0.25;                                                 // (the walls' thickness: they cast the shadows)
  // ---- floor, ceiling, walls (the north wall with the window; the south wall with the door)
  dsBox(L.W, 0.2, L.D, M.floor, 0, -0.1, 0, room);
  dsBox(L.W + 0.5, 0.25, L.D + 0.5, M.ceil, 0, H + 0.125, 0, room);
  dsBox(T, H, L.D + 0.5, M.wallW, -W - T / 2, H / 2, 0, room);
  dsBox(T, H, L.D + 0.5, M.wall, W + T / 2, H / 2, 0, room);
  const wi = L.win;
  for (const c of dsWallCells(-W - T, W + T, 0, H, [[wi.x[0], wi.x[1], wi.y[0], wi.y[1]]])) dsBox(c[1] - c[0], c[3] - c[2], T, M.wallN, (c[0] + c[1]) / 2, (c[2] + c[3]) / 2, -D - T / 2, room);
  const dr = L.door;
  for (const c of dsWallCells(-W - T, W + T, 0, H, [[dr.x[0], dr.x[1], 0, dr.h]])) dsBox(c[1] - c[0], c[3] - c[2], T, M.wall, (c[0] + c[1]) / 2, (c[2] + c[3]) / 2, D + T / 2, room);
  { const dd = dsBox(dr.x[1] - dr.x[0] - 0.02, dr.h - 0.01, 0.04, M.door, (dr.x[0] + dr.x[1]) / 2, dr.h / 2, D + 0.06, room); dsBox(0.12, 0.03, 0.05, M.handle, dr.x[0] + 0.12, 1.02, D + 0.0, room); dd.castShadow = true; }
  for (const [a, b, y] of [[dr.x[0] - 0.05, dr.x[0], 0], [dr.x[1], dr.x[1] + 0.05, 0]]) dsBox(b - a, dr.h + 0.05, 0.06, M.frame, (a + b) / 2, dr.h / 2, D - 0.02, room);
  // skirting
  for (const [x, z, w, d] of [[0, -D + 0.01, L.W, 0.02], [-W + 0.01, 0, 0.02, L.D], [W - 0.01, 0, 0.02, L.D]]) dsBox(w, 0.1, d, M.skirt, x, 0.05, z, room);
  for (const [a, b] of [[-W, dr.x[0] - 0.05], [dr.x[1] + 0.05, W]]) dsBox(b - a, 0.1, 0.02, M.skirt, (a + b) / 2, 0.05, D - 0.01, room);
  // ---- the window: frame, a mullion, the glass, the sill; the radiator under it; the curtain rail
  { const cx = (wi.x[0] + wi.x[1]) / 2, cy = (wi.y[0] + wi.y[1]) / 2, ww = wi.x[1] - wi.x[0], hh = wi.y[1] - wi.y[0], z = -D - 0.12;
    for (const [bx, by, bw, bh] of [[cx, wi.y[1] - 0.03, ww, 0.06], [cx, wi.y[0] + 0.03, ww, 0.06], [wi.x[0] + 0.03, cy, 0.06, hh], [wi.x[1] - 0.03, cy, 0.06, hh], [cx + 0.25, cy, 0.05, hh - 0.1]]) dsBox(bw, bh, 0.08, M.frame, bx, by, z, room);
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(ww - 0.1, hh - 0.1), M.glass); gl.position.set(cx, cy, z); gl.renderOrder = 4; room.add(gl); R.glass = gl;
    const sl = L.sill; dsBox(sl.x[1] - sl.x[0], sl.y[1] - sl.y[0], sl.z[1] - sl.z[0], M.frame, (sl.x[0] + sl.x[1]) / 2, (sl.y[0] + sl.y[1]) / 2, (sl.z[0] + sl.z[1]) / 2, room);
    const rd = L.rad, rx = (rd.x[0] + rd.x[1]) / 2, rw = rd.x[1] - rd.x[0];
    for (let i = 0; i < 18; i++) dsBox(0.05, rd.y[1] - rd.y[0], 0.06, M.rad, rd.x[0] + 0.05 + i * (rw - 0.1) / 17, (rd.y[0] + rd.y[1]) / 2, -D + 0.05, room);
    dsBox(rw, 0.03, 0.08, M.rad, rx, rd.y[1] - 0.015, -D + 0.05, room); dsBox(rw, 0.03, 0.08, M.rad, rx, rd.y[0] + 0.015, -D + 0.05, room);
    dsCyl(0.012, 0.012, 2.95, M.metal, (L.rail.x[0] + L.rail.x[1]) / 2, L.rail.y, -D + 0.09, room, 8).rotation.z = Math.PI / 2;
    for (const x of L.rail.x) dsBox(0.03, 0.06, 0.1, M.metal, x, L.rail.y + 0.02, -D + 0.05, room);
  }
  // ---- the curtains: two panels hanging from the rail (they hang along down: sheared in the wall's plane)
  R.curtains = [];
  { const mat = dsStd('#ffffff', 0.95, 0, { map: tex(dsFabricCanvas('#c98e5a', 21), 2, 3), side: THREE.DoubleSide });
    for (const [x0, x1] of [[L.rail.x[0], L.rail.x[0] + 0.62], [L.rail.x[1] - 0.62, L.rail.x[1]]]) {
      const len = 2.25, nx = 10, ny = 12, geo = new THREE.PlaneGeometry(x1 - x0, len, nx, ny);
      const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.position.set(0, 0, -D + 0.12); room.add(m);
      R.curtains.push({ m, geo, x0, x1, len, nx, ny, base: Float32Array.from(geo.attributes.position.array) });
    } }
  // ---- the ceiling lamp: a rose, the flex, a drum shade with its bulb (pivots at the rose)
  { const lp = L.lamp, g = new THREE.Group(); g.position.set(lp.x, H, lp.z); room.add(g); R.lamp = g;
    dsCyl(0.06, 0.06, 0.03, M.white, 0, -0.015, 0, g, 18);
    const swing = new THREE.Group(); g.add(swing); R.lampSwing = swing;
    dsCyl(0.004, 0.004, lp.cord, M.flex, 0, -lp.cord / 2, 0, swing, 6);
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.24, 0.24, 28, 1, true), M.shadeC); sh.position.y = -lp.cord - 0.1; sh.castShadow = false; swing.add(sh); R.lampShade = sh;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), M.bulb); bulb.position.y = -lp.cord - 0.1; swing.add(bulb); R.lampBulb = bulb;
    const light = new THREE.PointLight('#ffd7a0', 0, 9, 1.6); light.position.y = -lp.cord - 0.1; swing.add(light); R.lampLight = light; }
  // ---- the clock and two prints on the north wall (they hang on nails: they swing along down, then drop off)
  R.hung = [];
  { const mk = (x, y, build, drop) => { const g = new THREE.Group(); g.position.set(x, y, D - 0.02); room.add(g); const inner = new THREE.Group(); g.add(inner); build(inner); R.hung.push({ g, inner, drop, x, y }); };
    mk(-0.6, 2.05, (g) => { const f = dsCyl(0.17, 0.17, 0.04, M.black, 0, -0.17, -0.02, g, 32); f.rotation.x = Math.PI / 2; const face = new THREE.Mesh(new THREE.CircleGeometry(0.155, 32), M.clock); face.position.set(0, -0.17, -0.045); face.rotation.y = Math.PI; g.add(face);
      R.hands = [0.1, 0.13, 0.15].map((l, i) => { const h = new THREE.Group(); h.position.set(0, -0.17, -0.05); g.add(h); dsBox([0.012, 0.008, 0.003][i], l, 0.004, i === 2 ? dsStd('#b8322a', 0.5) : M.black, 0, l / 2 - 0.02, 0, h); return h; }); }, 97);
    mk(0.25, 1.95, (g) => { dsBox(0.46, 0.58, 0.03, M.black, 0, -0.29, -0.015, g); const p = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.52), M.prints[0]); p.position.set(0, -0.29, -0.032); p.rotation.y = Math.PI; g.add(p); }, 101);
    mk(-1.75, 1.9, (g) => { dsBox(0.36, 0.46, 0.03, dsStd('#e8e4da', 0.5), 0, -0.23, -0.015, g); const p = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.38), M.prints[1]); p.position.set(0, -0.23, -0.032); p.rotation.y = Math.PI; g.add(p); }, 104); }

  // ==================================================================== THE SIMULATED THINGS (one group per body)
  const bk = (b) => b.parts;
  const P = (p) => ({ hx: p[1], hy: p[2], hz: p[3], o: p[0] === 'box' ? p.slice(4, 7) : p[0] === 'cyl' ? p.slice(3, 6) : p.slice(2, 5) });
  let bi = 0;
  for (const b of L.bodies) {
    const g = new THREE.Group(); g.position.set(b.pos[0], b.pos[1], b.pos[2]); room.add(g); R.bodies[b.id] = g; g.userData.b = b;
    const pp = b.parts.map(P), box = (k, m, s = [1, 1, 1], r = 0.02) => { const q = pp[k]; const o = dsMesh(dsRoundBox(2 * q.hx * s[0], 2 * q.hy * s[1], 2 * q.hz * s[2], Math.min(r, q.hx * 0.9, q.hz * 0.9), Math.min(r * 0.6, q.hy * 0.4)), m, q.o[0], q.o[1] - q.hy * s[1], q.o[2], g); return o; };
    const cyl = (k, m, seg = 20) => { const p = b.parts[k]; return dsCyl(p[2], p[2], 2 * p[1], m, p[3], p[4], p[5], g, seg); };
    switch (b.kind) {
      case 'sofa': box(0, M.sofaD, [1, 1, 1], 0.06); box(1, M.sofa, [1, 1, 1], 0.08); box(2, M.sofa, [1, 1, 1], 0.06); box(3, M.sofa, [1, 1, 1], 0.06);
        for (const z of [-0.62, 0.0, 0.62]) dsMesh(dsRoundBox(0.66, 0.14, 0.6, 0.06, 0.04), M.sofa, -0.08, 0.42, z, g);
        for (const [x, z] of [[-0.4, -0.98], [0.4, -0.98], [-0.4, 0.98], [0.4, 0.98]]) dsCyl(0.025, 0.02, 0.06, M.wood, x, 0.03, z, g, 8); break;
      case 'cushion': box(0, M.cush[bi % 3], [1, 1, 1], 0.07); break;
      case 'rug': { const q = pp[0], m = new THREE.Mesh(new THREE.BoxGeometry(2 * q.hx, 2 * q.hy, 2 * q.hz), [M.rug, M.rug, M.rug, M.rug, M.rug, M.rug]); m.position.set(0, q.hy, 0); m.receiveShadow = true; g.add(m); break; }
      case 'table': box(0, M.woodL, [1, 1, 1], 0.01); for (let k = 1; k < 5; k++) box(k, M.wood, [1, 1, 1], 0.005); break;
      case 'glass': { const p = b.parts[0], cup = new THREE.Mesh(new THREE.CylinderGeometry(p[2], p[2] * 0.85, 2 * p[1], 20, 1, true), M.cup); cup.position.set(0, p[1], 0); g.add(cup);
        // the water: an upright column filled to hw whose top follows the new level (the top ring's heights are set every
        // frame: y = hw − z tan θ, higher on the south side); a bright disc marks the surface
        const hw = 1.15 * p[1], rr = (y) => (0.85 + 0.15 * y / (2 * p[1])) * p[2] * 0.95;
        const bg = new THREE.CylinderGeometry(rr(hw), rr(0), hw - 0.004, 24, 1, false); bg.translate(0, (hw + 0.004) / 2, 0);
        const body = new THREE.Mesh(bg, M.water); g.add(body); body.renderOrder = 3;
        const wg = new THREE.Group(); wg.position.set(0, hw, 0); g.add(wg); const wt = new THREE.Mesh(new THREE.CircleGeometry(rr(hw) * 0.995, 24), M.water); wt.rotation.x = -Math.PI / 2; wg.add(wt);
        R.glassWater = { wg, wt, body, h: p[1], hw, base: bg.attributes.position.array.slice() }; break; }
      case 'bowl': { const p = b.parts[0], pts = []; for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI / 2; pts.push(new THREE.Vector2(p[2] * Math.sin(a) + 0.001, p[1] * 2 * (1 - Math.cos(a)))); } const m = dsMesh(new THREE.LatheGeometry(pts, 24), M.bowl, 0, 0, 0, g); m.material = M.bowl; M.bowl.side = THREE.DoubleSide;
        for (const [x, z, c] of [[0.03, 0.02, '#d9832e'], [-0.04, 0.01, '#c4302a'], [0.0, -0.045, '#9ab83a']]) dsMesh(new THREE.SphereGeometry(0.035, 12, 8), dsStd(c, 0.5), x, 0.05, z, g); break; }
      case 'book': { const q = pp[0], mats = [M.pages, M.books[(bi * 7) % 12], M.books[(bi * 7) % 12], M.books[(bi * 7) % 12], M.books[(bi * 7) % 12], M.books[(bi * 7) % 12]];
        const spineE = b.id.startsWith('book');                    // (shelf books: the spine faces east, out of the bookcase)
        const m = new THREE.Mesh(new THREE.BoxGeometry(2 * q.hx, 2 * q.hy, 2 * q.hz), spineE ? [M.books[(bi * 7) % 12], M.pages, M.pages, M.pages, M.books[(bi * 7) % 12], M.books[(bi * 7) % 12]] : mats);
        m.position.set(q.o[0], q.o[1], q.o[2]); m.castShadow = m.receiveShadow = true; g.add(m); break; }
      case 'remote': box(0, M.black, [1, 1, 1], 0.008); break;
      case 'stand': box(0, M.wood, [1, 1, 1], 0.01); dsBox(0.005, 0.02, 1.3, M.metal, pp[0].hx + 0.002, 0.3, 0, g); break;
      case 'tv': { box(0, M.black, [1, 1, 1], 0.01); box(1, M.black, [1, 1, 1], 0.005); box(2, M.black, [1, 1, 1], 0.008);
        const q = pp[2], ct = dsCanvasTex(512, 288, dsTvDraw), scr = new THREE.Mesh(new THREE.PlaneGeometry(2 * q.hz * 0.96, 2 * q.hy * 0.94), new THREE.MeshBasicMaterial({ map: ct.tex, toneMapped: false }));
        scr.position.set(q.o[0] + q.hx + 0.001, q.o[1], q.o[2]); scr.rotation.y = Math.PI / 2; g.add(scr); R.tv = { ct, scr }; break; }
      case 'bookcase': for (let k = 0; k < b.parts.length; k++) box(k, M.white, [1, 1, 1], 0.004); break;
      case 'armchair': box(0, M.arm, [1, 1, 1], 0.06); box(1, M.arm, [1, 1, 1], 0.07); box(2, M.arm, [1, 1, 1], 0.05); box(3, M.arm, [1, 1, 1], 0.05);
        dsMesh(dsRoundBox(0.62, 0.12, 0.62, 0.05, 0.04), M.arm, 0, 0.42, -0.06, g); break;
      case 'sidetable': box(0, M.metal, [1, 1, 1], 0.01); box(1, M.metal, [1, 1, 1], 0.01); box(2, M.woodL, [1, 1, 1], 0.01); break;
      case 'tablelamp': { const p0 = b.parts[0], p1 = b.parts[1];
        dsMesh(new THREE.SphereGeometry(p0[2] * 1.15, 18, 12).scale(1, p0[1] / p0[2], 1), M.ceramic, 0, p0[4], 0, g);
        const sh = new THREE.Mesh(new THREE.CylinderGeometry(p1[2] * 0.75, p1[2], 2 * p1[1], 24, 1, true), M.shade); sh.position.set(0, p1[4], 0); g.add(sh);
        const lt = new THREE.PointLight('#ffcf8a', 0, 5, 1.8); lt.position.set(0, p1[4] - 0.02, 0); g.add(lt); R.tlampLight = lt; break; }
      case 'sideboard': box(0, M.wood, [1, 1, 1], 0.01); for (const z of [-0.35, 0.35]) dsBox(0.005, 0.5, 0.62, M.woodL, pp[0].hx * -1 - 0.003, 0.42, z, g); for (const z of [-0.35, 0.35]) dsBox(0.02, 0.02, 0.12, M.brass, -pp[0].hx - 0.01, 0.62, z, g); break;
      case 'vase': { const p = b.parts[0]; cyl(0, M.ceramic, 18); for (let k = 0; k < 5; k++) { const a = k * 1.3, st = dsCyl(0.003, 0.003, 0.32, M.stem, Math.cos(a) * 0.02, 2 * p[1] + 0.14, Math.sin(a) * 0.02, g, 5); st.rotation.set(Math.sin(a) * 0.2, 0, Math.cos(a) * 0.2); dsMesh(new THREE.SphereGeometry(0.025, 8, 6), M.flower, Math.cos(a) * 0.05, 2 * p[1] + 0.3, Math.sin(a) * 0.05, g); } break; }
      case 'photo': { box(0, M.black, [1, 1, 1], 0.003); const q = pp[0], pic = new THREE.Mesh(new THREE.PlaneGeometry(2 * q.hz * 0.8, 2 * q.hy * 0.8), M.prints[0]); pic.position.set(-q.hx - 0.001, q.o[1], 0); pic.rotation.y = -Math.PI / 2; g.add(pic); break; }
      case 'bookpile': { const q = pp[0]; for (let k = 0; k < 3; k++) dsBox(2 * q.hx * (1 - 0.06 * k), 2 * q.hy / 3, 2 * q.hz * (1 - 0.05 * k), M.books[(k * 5 + 2) % 12], 0, q.hy / 3 * (2 * k + 1), 0, g); break; }
      case 'floorlamp': { cyl(0, M.metal, 24); cyl(1, M.brass, 8); const p = b.parts[2]; const sh = new THREE.Mesh(new THREE.CylinderGeometry(p[2] * 0.7, p[2], 2 * p[1], 24, 1, true), M.shade); sh.position.set(0, p[4], 0); g.add(sh);
        const lt = new THREE.PointLight('#ffcf8a', 0, 6, 1.8); lt.position.set(0, p[4] - 0.05, 0); g.add(lt); R.flampLight = lt; break; }
      case 'plant': { const p = b.parts[0]; dsCyl(p[2], p[2] * 0.8, 2 * p[1], M.terracotta, 0, p[1], 0, g, 18); dsCyl(p[2] * 0.95, p[2] * 0.95, 0.02, M.soil, 0, 2 * p[1] - 0.02, 0, g, 18);
        const r = new RNG(77); for (let k = 0; k < 9; k++) { const a = r.range(0, 6.28), e = r.range(0.2, 1.1), d = r.range(0.12, 0.3), lf = dsMesh(new THREE.SphereGeometry(r.range(0.12, 0.2), 8, 6).scale(1.4, 0.35, 0.9), k % 2 ? M.leaf : M.leaf2, Math.cos(a) * d, 0.5 + e * 0.4, Math.sin(a) * d, g); lf.rotation.set(r.range(-0.6, 0.6), a, r.range(-0.5, 0.5)); } break; }
      case 'pouffe': { const p = b.parts[0]; dsMesh(dsRoundBox(2 * p[2], 2 * p[1], 2 * p[2], p[2] * 0.95, 0.06), M.pouffe, 0, 0, 0, g); break; }
      default: for (let k = 0; k < b.parts.length; k++) if (b.parts[k][0] === 'box') box(k, M.white);
    }
    bi++;
  }
  // ---- the kitchen scale on the coffee table, a 1 kg bag of sugar on it (its display reads what gravity's part against
  //      the floor makes of 1 kg)
  { const top = 0.0125 + 0.425, g = new THREE.Group(); g.position.set(-0.62, top, 0.22); g.rotation.y = -0.35; room.add(g);
    const bx = (w, h, d, m, x, y, z) => dsMesh(dsRoundBox(w, h, d, Math.min(0.008, w * 0.2), Math.min(0.004, h * 0.3)), m, x, y, z, g);
    bx(0.2, 0.03, 0.2, dsStd('#e9e6df', 0.35), 0, 0.0, 0);
    bx(0.17, 0.006, 0.17, dsStd('#c9ccce', 0.25, 0.7), 0, 0.03, 0);
    const disp = dsCanvasTex(256, 96, (c, w, h, st) => { c.fillStyle = '#0d1a14'; c.fillRect(0, 0, w, h); c.fillStyle = '#9dffb8'; c.font = '700 64px "Courier New", monospace'; c.textAlign = 'right'; c.fillText(st.v, w - 54, 70); c.font = '700 30px Arial'; c.fillText('g', w - 16, 70); });
    const dm = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.04), new THREE.MeshBasicMaterial({ map: disp.tex, toneMapped: false })); dm.position.set(0, 0.016, 0.1005); g.add(dm); R.scaleDisp = disp;
    // the bag: paper, folded top, a label
    const lab = dsCanvas(128, 160, (c, w, h) => { c.fillStyle = '#f4f1ea'; c.fillRect(0, 0, w, h); c.fillStyle = '#2f5aa8'; c.fillRect(0, 40, w, 70); c.fillStyle = '#fff'; c.font = '700 26px Arial'; c.textAlign = 'center'; c.fillText('SUGAR', w / 2, 84); c.fillStyle = '#2f5aa8'; c.font = '700 22px Arial'; c.fillText('1 kg', w / 2, 140); });
    const bag = dsMesh(dsRoundBox(0.1, 0.17, 0.065, 0.012, 0.01), dsStd('#ffffff', 0.85, 0, { map: dsTex(lab, { repeat: false }) }), 0, 0.036, 0, g);
    dsMesh(dsRoundBox(0.1, 0.03, 0.03, 0.006, 0.004), dsStd('#f4f1ea', 0.85), 0, 0.2, 0, g);
  }
  // ---- a marble on the floor, between the sofa and the window
  { const mat = new THREE.MeshStandardMaterial({ color: '#7fb6e6', roughness: 0.08, metalness: 0.0, transparent: true, opacity: 0.9, envMapIntensity: 1.6 });
    R.marble = dsMesh(new THREE.SphereGeometry(0.0125, 20, 14), mat, 0.6, 0.0125, -0.55, room); R.marble0 = -0.55;
    const swirl = dsMesh(new THREE.SphereGeometry(0.007, 10, 8), dsStd('#e8742c', 0.4), 0.003, 0, 0, R.marble); swirl.scale.set(1.4, 0.5, 0.8); R.marbleZ = R.marble0; }
  // ---- the cat's bowl, by the sideboard, with water in it
  { const cb = new THREE.Group(); cb.position.set(1.85, 0, 0.45); room.add(cb);
    const pts = []; for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2; pts.push(new THREE.Vector2(0.075 + 0.025 * Math.sin(a), 0.055 * (1 - Math.cos(a)))); }
    dsMesh(new THREE.LatheGeometry([new THREE.Vector2(0, 0.004), new THREE.Vector2(0.06, 0.004), ...pts], 24), dsStd('#c95a3a', 0.35), 0, 0, 0, cb);
    const wg = new THREE.Group(); wg.position.y = 0.04; cb.add(wg); const w = new THREE.Mesh(new THREE.CircleGeometry(0.072, 24), M.water); w.rotation.x = -Math.PI / 2; wg.add(w); R.bowlW = wg; }
  // the things that slide on Saturday (DS_ROOM_SLIDE, below: the sound uses it too)
  R.sliders = DS_ROOM_SLIDE;
  // things on the coffee table ride with it
  R.onTable = ['glass', 'bowl', 'tbook', 'remote'];
  R.marbleF = dsSlider(DS_MU.marble, 5 / 7, 120, 0.12);
  R.update = (s, o) => dsRoomUpdate(R, s, o || {});
  return R;
}

function dsRoomUpdate(R, s, o) {
  const L = DS_ROOM, th = dsTilt(s), day = dsDaylight(s);
  // ---- the lamps: on when it's dark (somebody lives here)
  const on = 1 - dsSm(day, 0.35, 0.7);
  R.lampLight.intensity = 3.0 * on; R.M.shadeC.emissiveIntensity = 0.6 * on; R.lampBulb.visible = true;
  if (R.tlampLight) R.tlampLight.intensity = 1.6 * on;
  if (R.flampLight) R.flampLight.intensity = 2.2 * on;
  R.M.shade.emissiveIntensity = 0.55 * on;
  // ---- the ceiling lamp hangs along down (and swings in a quake)
  const q = dsQuake(s);
  R.lampSwing.rotation.set(th + 0.12 * q * Math.sin(s * 2.4), 0, 0.1 * q * Math.sin(s * 1.9 + 1));
  // ---- the TV: a show; NO SIGNAL once the satellites are out of the dishes' aim; the news from Monday
  if (R.tv) { const mode = s < dsAt(0, 17, 10) ? 'show' : s < dsAt(1, 9, 0) ? 'nosignal' : 'news'; R.tv.ct.update({ mode }); }
  // ---- the curtains hang still
  for (const C of R.curtains) {
    if (C.done) continue;
    const p = C.geo.attributes.position, top = L.rail.y, cx = (C.x0 + C.x1) / 2;
    for (let i = 0; i < p.count; i++) { const bx = C.base[i * 3], by = C.base[i * 3 + 1], v = (C.len / 2 - by); p.setXYZ(i, cx + bx, top - v, 0.03 * Math.sin(bx * 22 + v * 3)); }
    p.needsUpdate = true; C.geo.computeVertexNormals(); C.done = true;
  }
  if (R.hands) { const c = dsClockParts(s); R.hands[0].rotation.z = ((c.h % 12) + c.m / 60) / 12 * Math.PI * 2; R.hands[1].rotation.z = (c.m + c.sec / 60) / 60 * Math.PI * 2; R.hands[2].rotation.z = c.sec / 60 * Math.PI * 2; }   // (seen from inside the room: clockwise)
  // ---- the pictures hang from their nails: they swing out from the wall along down
  for (const H of R.hung) H.inner.rotation.x = th + 0.05 * q * Math.sin(s * 3 + H.drop);
  // ---- the scale: 1 kg of sugar, read along the floor's normal
  if (R.scaleDisp) R.scaleDisp.update({ v: String(Math.round(1000 * dsScale(s) * Math.cos(0))) });
  // ---- the water in the glass and the bowl lies along the new level (it can't tilt more than the rim allows)
  if (R.glassWater) { const G = R.glassWater, tn = Math.tan(Math.min(th, 0.5)), P = G.body.geometry.attributes.position, B = G.base;
    if (G._tn !== tn) { G._tn = tn; for (let i = 0; i < P.count; i++) { const y = B[i * 3 + 1]; if (y > G.hw * 0.5) P.setY(i, G.hw - B[i * 3 + 2] * tn); } P.needsUpdate = true; G.body.geometry.computeVertexNormals(); }
    G.wg.rotation.x = Math.min(th, 0.5); G.wt.scale.set(1, 1 / Math.max(0.3, Math.cos(Math.min(th, 0.5))), 1); }
  if (R.bowlW) R.bowlW.rotation.x = Math.min(th, 0.5);
  // ---- the marble (from Wednesday 1 PM) rolls south, towards the window, until the radiator stops it
  { const z = Math.max(-L.D / 2 + 0.12, R.marble0 - R.marbleF(s)); R.marble.position.z = z; R.marble.rotation.x = -(R.marble0 - z) / 0.0125; R.marbleZ = z; }
  // ---- Saturday: the furniture breaks loose and slides to the window wall
  let tableDz = 0;
  for (const S of R.sliders) { const g = R.bodies[S.id], b = g.userData.b, dz = Math.min(Math.max(0, S.max), S.f(s)); g.position.z = b.pos[2] - dz; if (S.id === 'table') tableDz = dz;
    g.rotation.z = 0; g.rotation.x = 0; }
  for (const id of R.onTable) { const g = R.bodies[id]; if (g) g.position.z = g.userData.b.pos[2] - tableDz; }
  if (R.scaleG) R.scaleG.position.z = 0.22 - tableDz;
  R.room.updateMatrixWorld(true);
}
