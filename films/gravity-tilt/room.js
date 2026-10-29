/* =====================================================================
   ROOM — your house (a white weatherboard timber house at the head of the street, facing east down it) and your
   bedroom, upstairs at the front: the window you are standing at, the bed (the cat asleep on it), the wardrobe, the
   desk with the laptop and the lamp, the chair, the rug, the shelf of books, the clock, the ceiling light, the door.
   Everything loose is posed by update(s) from physics.js (pure): it falls east and stops against the wall.
   The bedroom is its own group in ROOM-LOCAL coordinates (floor y 0, east wall x 0; physics.js GT_ROOM), placed and
   leaned with the house (gtLean). gtBuildRoom(S) → R
   ===================================================================== */

// ---- canvases
// white-painted weatherboard: 18 cm boards, each a shadow under its lip
function gtBoardsCanvas(seed, w = 256, h = 512, base = [236, 233, 225]) {
  const r = new RNG(seed);
  return gtCanvas(w, h, (g) => {
    const bh = 32;
    for (let y = 0; y < h; y += bh) {
      const k = r.range(-6, 6), gr = g.createLinearGradient(0, y, 0, y + bh);
      gr.addColorStop(0, `rgb(${base[0] - 26 + k},${base[1] - 26 + k},${base[2] - 24 + k})`); gr.addColorStop(0.18, `rgb(${base[0] + k},${base[1] + k},${base[2] + k})`); gr.addColorStop(1, `rgb(${base[0] - 8 + k},${base[1] - 8 + k},${base[2] - 8 + k})`);
      g.fillStyle = gr; g.fillRect(0, y, w, bh);
      g.fillStyle = 'rgba(60,55,50,0.35)'; g.fillRect(0, y, w, 2);
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${r.next() < 0.5 ? '255,255,255' : '80,70,60'},0.05)`; g.fillRect(r.range(0, w), y + r.range(2, bh), r.range(10, 60), 1); }
    }
  });
}
// floorboards (pale oak) for the bedroom
function gtFloorCanvas(seed, w = 512, h = 1024) {
  const r = new RNG(seed);
  return gtCanvas(w, h, (g) => {
    const bw = w / 4;
    for (let i = 0; i < 4; i++) {
      let y = -r.range(0, h);
      while (y < h) {
        const L = r.range(h * 0.4, h * 0.8), k = r.range(-14, 14), x = i * bw;
        g.fillStyle = `rgb(${186 + k},${150 + k},${108 + k * 0.7})`; g.fillRect(x, y, bw, L);
        for (let j = 0; j < 24; j++) { g.fillStyle = `rgba(${r.next() < 0.5 ? '90,60,30' : '230,200,160'},${r.range(0.04, 0.1)})`; g.fillRect(x + r.range(2, bw - 2), y, r.range(0.6, 1.8), L); }
        g.fillStyle = 'rgba(60,40,20,0.5)'; g.fillRect(x, y, bw, 2);
        y += L;
      }
      g.fillStyle = 'rgba(50,30,15,0.55)'; g.fillRect(i * bw, 0, 2, h);
    }
  });
}
// a painted wall with a faint roller texture
function gtPaintCanvas(seed, col, w = 256, h = 256) {
  return gtCanvas(w, h, (g) => {
    g.fillStyle = col; g.fillRect(0, 0, w, h);
    const im = g.getImageData(0, 0, w, h), d = im.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const n = (hash2(x >> 1, y >> 1) - 0.5) * 7 + (hash2(x >> 4, y >> 3) - 0.5) * 5, i = (y * w + x) * 4; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(im, 0, 0);
  });
}
// the duvet: a soft blue-grey with a thin stripe
function gtDuvetCanvas(w = 256, h = 256) {
  return gtCanvas(w, h, (g) => {
    g.fillStyle = '#7f93a6'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) { g.fillStyle = 'rgba(240,236,226,0.55)'; g.fillRect(x + 12, 0, 3, h); }
    const im = g.getImageData(0, 0, w, h), d = im.data;
    for (let i = 0; i < d.length; i += 4) { const n = (hash1(i * 0.41) - 0.5) * 12; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(im, 0, 0);
  });
}
// a rug: cream with a terracotta and charcoal border
function gtRugCanvas(w = 512, h = 384) {
  return gtCanvas(w, h, (g) => {
    g.fillStyle = '#d9cdb6'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#a4553a'; g.lineWidth = 18; g.strokeRect(30, 30, w - 60, h - 60);
    g.strokeStyle = '#33373d'; g.lineWidth = 6; g.strokeRect(58, 58, w - 116, h - 116);
    for (let x = 90; x < w - 80; x += 46) { g.fillStyle = '#a4553a'; g.beginPath(); g.moveTo(x, h / 2 - 22); g.lineTo(x + 14, h / 2); g.lineTo(x, h / 2 + 22); g.lineTo(x - 14, h / 2); g.fill(); }
    const im = g.getImageData(0, 0, w, h), d = im.data;
    for (let i = 0; i < d.length; i += 4) { const n = (hash1(i * 0.29 + 3) - 0.5) * 22; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(im, 0, 0);
  });
}
// a poster: a print of mountains at dawn
function gtPosterCanvas(w = 256, h = 360) {
  return gtCanvas(w, h, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f0c9a0'); gr.addColorStop(0.55, '#e59a7a'); gr.addColorStop(1, '#6a4a6a');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff3d6'; g.beginPath(); g.arc(w * 0.62, h * 0.42, 26, 0, 6.28); g.fill();
    for (const [c, y0, a] of [['#8a5a74', 0.62, 0.9], ['#5a3a5c', 0.72, 1], ['#3a2640', 0.84, 1]]) {
      g.fillStyle = c; g.globalAlpha = a; g.beginPath(); g.moveTo(0, h);
      for (let x = 0; x <= w; x += 16) g.lineTo(x, h * y0 - 40 * Math.abs(Math.sin(x * 0.021 + y0 * 9)) - 20 * Math.sin(x * 0.07 + y0));
      g.lineTo(w, h); g.fill();
    }
    g.globalAlpha = 1; g.fillStyle = '#f4efe6'; g.fillRect(0, h - 40, w, 40);
    g.fillStyle = '#3a2640'; g.font = '600 16px Georgia'; g.textAlign = 'center'; g.fillText('DAWN', w / 2, h - 14);
  });
}
// the clock's face
function gtClockFaceCanvas(w = 256) {
  return gtCanvas(w, w, (g) => {
    g.fillStyle = '#f6f3ec'; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 2, 0, 6.28); g.fill();
    g.strokeStyle = '#1d1f22'; g.lineWidth = 10; g.stroke();
    for (let i = 0; i < 60; i++) { const a = i / 60 * 6.283, L = i % 5 ? 8 : 20, r0 = w / 2 - 16; g.lineWidth = i % 5 ? 2 : 5; g.beginPath(); g.moveTo(w / 2 + Math.sin(a) * r0, w / 2 - Math.cos(a) * r0); g.lineTo(w / 2 + Math.sin(a) * (r0 - L), w / 2 - Math.cos(a) * (r0 - L)); g.stroke(); }
  });
}
// the cracks in your window: a radial star where the mug hit, another from the chair's corner, then long runs that
// join them (grows with k 0…1); the coffee splash (from s = 0.19) and the water lying on it (o.pool)
function gtCrackDraw(g, w, h, st) {
  g.clearRect(0, 0, w, h);
  const k = st.k, r = new RNG(91), px = (z) => (z - GT_W.win.z[0]) / (GT_W.win.z[1] - GT_W.win.z[0]) * w, py = (y) => h - (y - GT_W.win.y[0]) / (GT_W.win.y[1] - GT_W.win.y[0]) * h;
  if (st.coffee > 0) {
    g.fillStyle = `rgba(70,38,16,${0.55 * st.coffee})`;
    for (let i = 0; i < 26; i++) { const a = r.range(0, 6.28), d = r.range(0, 40) * st.coffee; g.beginPath(); g.arc(px(0.2) + Math.cos(a) * d, py(1.32) + Math.sin(a) * d * 0.8, r.range(4, 16) * st.coffee, 0, 6.28); g.fill(); }
    if (st.drip > 0) { g.fillStyle = `rgba(70,38,16,0.5)`; for (let i = 0; i < 5; i++) g.fillRect(px(0.14 + i * 0.03) - 2, py(1.32), 4, h * 0.6 * st.drip * (0.5 + 0.5 * hash1(i))); }
  }
  if (k <= 0) return;
  g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineCap = 'round';
  const star = (cx, cy, n, R, kk, seed) => {
    const rr = new RNG(seed);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.283 + rr.range(-0.25, 0.25), L = R * rr.range(0.5, 1.2) * kk;
      g.lineWidth = rr.range(1.0, 2.2); g.beginPath(); g.moveTo(cx, cy);
      let x = cx, y = cy; const segs = 5;
      for (let s = 1; s <= segs; s++) { const d = L * s / segs; x = cx + Math.cos(a + rr.range(-0.15, 0.15)) * d; y = cy + Math.sin(a + rr.range(-0.15, 0.15)) * d; g.lineTo(x, y); }
      g.stroke();
    }
    g.lineWidth = 1; for (let j = 1; j <= 2; j++) { g.beginPath(); g.arc(cx, cy, R * 0.15 * j * kk, 0, 6.28); g.stroke(); }
  };
  star(px(0.2), py(1.32), 11, w * 0.35, Math.min(1, k / 0.25), 3);
  if (k > 0.3) star(px(0.55), py(0.95), 7, w * 0.3, Math.min(1, (k - 0.3) / 0.2), 7);
  // the long runs (they lengthen with k)
  const runs = Math.floor(18 * k);
  for (let i = 0; i < runs; i++) {
    const rr = new RNG(200 + i); let x = rr.range(0, w), y = rr.range(0, h); const a = rr.range(0, 6.28), L = rr.range(0.15, 0.6) * w * Math.min(1, k * 1.4);
    g.lineWidth = rr.range(0.8, 1.6); g.beginPath(); g.moveTo(x, y);
    for (let s = 0; s < 8; s++) { x += Math.cos(a + rr.range(-0.4, 0.4)) * L / 8; y += Math.sin(a + rr.range(-0.4, 0.4)) * L / 8; g.lineTo(x, y); }
    g.stroke();
  }
}

function gtBuildRoom(S) {
  const scene = S.scene, R = { M: {} }, tex = (c, rx, ry) => { const t = gtTex(c); t.repeat.set(rx, ry); return t; };
  const M = R.M = {
    boards: gtStd('#ffffff', 0.85, 0, { map: tex(gtBoardsCanvas(5), 2, 3) }),
    trim: gtStd('#f4f2ec', 0.5), shingle: gtStd('#4c5157', 0.9), shingleD: gtStd('#3b3f44', 0.9),
    found: gtStd('#8a8780', 0.95), door: gtStd('#2f4c5e', 0.45), lawn: gtStd('#5d7c3a', 1.0), path: gtStd('#b9b2a4', 0.9),
    floor: gtStd('#ffffff', 0.6, 0, { map: tex(gtFloorCanvas(13), 1.2, 1.4) }),
    wall: gtStd('#ffffff', 0.92, 0, { map: tex(gtPaintCanvas(3, '#c9d3c6'), 3, 2) }),
    wallE: gtStd('#ffffff', 0.92, 0, { map: tex(gtPaintCanvas(4, '#c9d3c6'), 3, 2) }),
    ceil: gtStd('#f3f1ea', 0.95), skirt: gtStd('#f1efe8', 0.5),
    glass: new THREE.MeshStandardMaterial({ color: '#dfe9ee', transparent: true, opacity: 0.12, roughness: 0.04, metalness: 0.0, envMapIntensity: 0.9, depthWrite: false, side: THREE.DoubleSide }),
    frame: gtStd('#f6f4ef', 0.45),
    bedWood: gtStd('#ffffff', 0.6, 0, { map: (() => { const t = gtTex(gtWoodCanvas(21, 256, 1024, [140, 98, 64])); t.repeat.set(1, 2); return t; })() }),
    mattress: gtStd('#eeeae2', 0.9), duvet: gtStd('#ffffff', 0.92, 0, { map: tex(gtDuvetCanvas(), 2, 2) }), pillow: gtStd('#f4f1ea', 0.95),
    wardrobe: gtStd('#e9e5dc', 0.55), handle: gtStd('#2b2d30', 0.4, 0.5),
    desk: gtStd('#ffffff', 0.55, 0, { map: (() => { const t = gtTex(gtWoodCanvas(23, 256, 1024, [176, 136, 92])); t.rotation = Math.PI / 2; t.repeat.set(1, 2); return t; })() }),
    black: gtStd('#18191c', 0.45, 0.2), alu: gtStd('#b8bcc0', 0.3, 0.8), screen: gtStd('#0d0f12', 0.12, 0.2, { emissive: new THREE.Color('#2a3a52'), emissiveIntensity: 0.25 }),
    chair: gtStd('#2c3036', 0.6), chairSeat: gtStd('#4a5866', 0.85),
    rug: gtStd('#ffffff', 0.95, 0, { map: gtTex(gtRugCanvas(), { repeat: false }) }),
    poster: gtStd('#ffffff', 0.8, 0, { map: gtTex(gtPosterCanvas(), { repeat: false }) }),
    clock: gtStd('#ffffff', 0.5, 0, { map: gtTex(gtClockFaceCanvas(), { repeat: false }) }),
    shade: gtStd('#efe7d6', 0.8, 0, { side: THREE.DoubleSide }), bulb: new THREE.MeshBasicMaterial({ color: '#fff4dd' }), flex: gtStd('#f0eee8', 0.6),
    mug: gtStd('#d9673e', 0.35), coffee: gtStd('#3a2112', 0.15),
    water: new THREE.MeshStandardMaterial({ color: '#ffffff', map: gtTex(gtRippleCanvas(), { repeat: [2, 2] }), transparent: true, opacity: 0.6, roughness: 0.04, metalness: 0.0, envMapIntensity: 1.6, depthWrite: false }),
    stream: new THREE.MeshStandardMaterial({ color: '#cfe0e8', transparent: true, opacity: 0.45, roughness: 0.05, envMapIntensity: 1.0, depthWrite: false }),
    shed: gtStd('#6f5a42', 0.85), shedRoof: gtStd('#3c3c3a', 0.9), fence: gtStd('#efede6', 0.6),
  };
  M.books = ['#7a2e2a', '#2f4a6b', '#d9c9a3', '#3c5a3c', '#b8862e', '#1f2a36', '#a35a3a', '#e3ddd0', '#5b3c5e', '#2d2d2d'].map((c) => gtStd(c, 0.8));

  // ==================================================================== THE HOUSE (outside)
  const HX = GT_W.house, house = new THREE.Group(); house.name = 'house'; scene.add(house); R.house = house;
  house.matrixAutoUpdate = false;
  const hw = HX.z[1] - HX.z[0], hd = HX.x[1] - HX.x[0], E = HX.eaves;
  // walls: the front (east, x 0) with its holes; the sides and the back plain boards
  const holesF = [
    [GT_W.win.z[0], GT_W.win.z[1], GT_W.floorY + GT_W.win.y[0], GT_W.floorY + GT_W.win.y[1]],      // your window
    [-3.4, -2.2, GT_W.floorY + 0.9, GT_W.floorY + 2.1], [2.2, 3.4, GT_W.floorY + 0.9, GT_W.floorY + 2.1],
    [-3.6, -1.8, 0.9, 2.3], [1.8, 3.6, 0.9, 2.3], [-0.5, 0.5, 0.05, 2.15],                          // ground floor: windows, the door
  ];
  for (const c of gtWallCells(HX.z[0], HX.z[1], 0.0, E, holesF)) { const b = gtBox(0.16, c[3] - c[2], c[1] - c[0], M.boards, -0.08, (c[2] + c[3]) / 2, (c[0] + c[1]) / 2, house); b.material = M.boards; }
  gtBox(0.18, 0.5, hw + 0.2, M.found, -0.08, -0.2, 0, house);                                        // the foundation's lip
  for (const sz of [-1, 1]) gtBox(hd, E + 0.5, 0.16, M.boards, (HX.x[0] + HX.x[1]) / 2, E / 2 - 0.25, sz * (hw / 2 - 0.08), house);
  gtBox(0.16, E + 0.5, hw, M.boards, HX.x[0] + 0.08, E / 2 - 0.25, 0, house);
  // corner boards, the eaves' fascia, the windows' frames and the glass of the other windows
  for (const sz of [-1, 1]) { gtBox(0.04, E + 0.5, 0.18, M.trim, 0.02, E / 2 - 0.25, sz * (hw / 2 - 0.09), house); gtBox(0.18, E + 0.5, 0.04, M.trim, -0.09, E / 2 - 0.25, sz * (hw / 2 + 0.02), house); }
  const frameWin = (z0, z1, y0, y1, glass = true) => {
    const cz = (z0 + z1) / 2, cy = (y0 + y1) / 2, w = z1 - z0, h = y1 - y0;
    for (const [bz, by, bw, bh] of [[cz, y1 + 0.05, w + 0.24, 0.1], [cz, y0 - 0.06, w + 0.3, 0.08], [z0 - 0.06, cy, 0.1, h + 0.2], [z1 + 0.06, cy, 0.1, h + 0.2]]) gtBox(0.06, bh, bw, M.trim, 0.03, by, bz, house);
    if (glass) { gtBox(0.04, h, 0.04, M.trim, -0.06, cy, cz, house); const gl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M.glass); gl.position.set(-0.07, cy, cz); gl.rotation.y = Math.PI / 2; gl.renderOrder = 4; house.add(gl);
      const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), gtStd('#2a2e33', 0.9)); back.position.set(-0.4, cy, cz); back.rotation.y = Math.PI / 2; house.add(back); }
  };
  for (const h of holesF.slice(1, 5)) frameWin(h[0], h[1], h[2], h[3]);
  frameWin(GT_W.win.z[0], GT_W.win.z[1], GT_W.floorY + GT_W.win.y[0], GT_W.floorY + GT_W.win.y[1], false);
  // the front door and a little porch roof
  gtBox(0.06, 2.1, 1.0, M.door, -0.05, 1.08, 0, house); gtBox(0.4, 0.06, 1.6, M.trim, 0.2, 2.45, 0, house);
  gtBox(0.03, 0.2, 0.04, M.handle, 0.0, 1.05, 0.35, house);
  // the roof: a gable facing the street (ridge along x); shingles; the gable end boarded
  {
    const pitch = Math.atan((HX.ridge - E) / (hw / 2)), slope = (hw / 2 + 0.4) / Math.cos(pitch);
    for (const sz of [-1, 1]) {
      const r = gtBox(hd + 0.6, 0.12, slope, M.shingle, (HX.x[0] + HX.x[1]) / 2 + 0.1, (E + HX.ridge) / 2 + 0.02, sz * (hw / 4 + 0.1), house);
      r.rotation.x = sz * pitch;
    }
    const sh = new THREE.Shape(); sh.moveTo(-hw / 2, 0); sh.lineTo(hw / 2, 0); sh.lineTo(0, HX.ridge - E); sh.closePath();
    for (const x of [0.0, HX.x[0]]) { const gg = new THREE.Mesh(new THREE.ShapeGeometry(sh), M.boards); gg.rotation.y = Math.PI / 2; gg.position.set(x - 0.04, E, 0); gg.castShadow = gg.receiveShadow = true; house.add(gg); const g2 = gg.clone(); g2.rotation.y = -Math.PI / 2; g2.position.x = x - 0.12; house.add(g2); }
    gtBox(0.08, 0.5, 0.5, M.trim, 0.02, E + 1.6, 0, house);                                     // (a little round vent → square)
  }
  // the front garden: lawn, the path to the door, a low white fence at the street
  gtBox(GT_W.x0 - 0.2, 0.06, 14, M.lawn, GT_W.x0 / 2, -0.03, 0, scene);
  gtBox(GT_W.x0, 0.07, 1.1, M.path, GT_W.x0 / 2, -0.02, 0, scene);
  for (let z = -6.8; z <= 6.8; z += 0.22) if (Math.abs(z) > 0.7) gtBox(0.04, 0.85, 0.08, M.fence, GT_W.x0 - 0.1, 0.42, z, scene);
  for (const y of [0.25, 0.65]) for (const sz of [-1, 1]) gtBox(0.03, 0.07, 6.1, M.fence, GT_W.x0 - 0.13, y, sz * 3.8, scene);
  // the back garden's shed (it falls 11 m onto your back wall in the first 1.5 s: update)
  R.shed = new THREE.Group(); scene.add(R.shed);
  gtBox(2.2, 2.0, 1.8, M.shed, 0, 1.0, 0, R.shed); gtBox(2.5, 0.08, 2.2, M.shedRoof, 0, 2.08, 0, R.shed);
  R.shedX0 = HX.x[0] - 12.5;

  // ==================================================================== THE BEDROOM (room-local)
  const RM = GT_W.room, room = new THREE.Group(); room.name = 'bedroom'; scene.add(room); R.room = room;
  room.matrixAutoUpdate = false;
  const X0 = RM.x[0], Zn = RM.z[0], Zs = RM.z[1], H = RM.h, W = GT_W.win, D = GT_W.door;
  gtPlane(-X0, Zs - Zn, M.floor, X0 / 2, 0, 0, '+y', room).rotation.z = 0;
  gtPlane(-X0, Zs - Zn, M.ceil, X0 / 2, H, 0, '-y', room);
  gtPlane(-X0, H, M.wall, X0 / 2, H / 2, Zn, '+z', room);
  gtPlane(-X0, H, M.wall, X0 / 2, H / 2, Zs, '-z', room);
  for (const c of gtWallCells(Zn, Zs, 0, H, [[W.z[0], W.z[1], W.y[0], W.y[1]]])) gtPlane(c[1] - c[0], c[3] - c[2], M.wallE, 0.0, (c[2] + c[3]) / 2, (c[0] + c[1]) / 2, '-x', room);
  for (const c of gtWallCells(Zn, Zs, 0, H, [[D.z[0], D.z[1], 0, D.h]])) gtPlane(c[1] - c[0], c[3] - c[2], M.wall, X0, (c[2] + c[3]) / 2, (c[0] + c[1]) / 2, '+x', room);
  // the window's reveal (the wall's thickness), sill, frame, the glass (with its cracks), the outside beyond (the house's
  // front wall boards are the reveal's outer edge)
  { const t = 0.16, cz = (W.z[0] + W.z[1]) / 2, cy = (W.y[0] + W.y[1]) / 2, ww = W.z[1] - W.z[0], wh = W.y[1] - W.y[0];
    gtBox(t, 0.02, ww, M.frame, t / 2, W.y[0] - 0.01, cz, room); gtBox(t, 0.02, ww, M.frame, t / 2, W.y[1] + 0.01, cz, room);
    for (const z of [W.z[0] - 0.01, W.z[1] + 0.01]) gtBox(t, wh, 0.02, M.frame, t / 2, cy, z, room);
    gtBox(0.05, 0.035, ww + 0.16, M.frame, -0.02, W.y[0] - 0.02, cz, room);                    // the sill (inside)
    for (const [bz, by, bw, bh] of [[cz, W.y[1] - 0.03, ww, 0.06], [cz, W.y[0] + 0.03, ww, 0.06], [W.z[0] + 0.03, cy, 0.06, wh], [W.z[1] - 0.03, cy, 0.06, wh]]) gtBox(0.05, bh, bw, M.frame, 0.06, by, bz, room);
    R.glass = new THREE.Mesh(new THREE.PlaneGeometry(ww - 0.1, wh - 0.1), M.glass); R.glass.position.set(0.06, cy, cz); R.glass.rotation.y = -Math.PI / 2; R.glass.renderOrder = 4; room.add(R.glass);
    R.crackTex = gtCanvasTex(512, 512, gtCrackDraw);
    R.crack = new THREE.Mesh(new THREE.PlaneGeometry(ww - 0.1, wh - 0.1), new THREE.MeshBasicMaterial({ map: R.crackTex.tex, transparent: true, depthWrite: false }));
    R.crack.position.set(0.058, cy, cz); R.crack.rotation.y = -Math.PI / 2; R.crack.renderOrder = 5; room.add(R.crack);
    R.winC = [0.06, cy, cz]; }
  // the door (shut, in the west wall), its frame and handle
  { const cz = (D.z[0] + D.z[1]) / 2, dw = D.z[1] - D.z[0];
    gtBox(0.04, D.h, dw, M.frame, X0 + 0.02, D.h / 2, cz, room);
    for (const [bz, by, bw, bh] of [[cz, D.h + 0.04, dw + 0.16, 0.08], [D.z[0] - 0.04, D.h / 2, 0.08, D.h], [D.z[1] + 0.04, D.h / 2, 0.08, D.h]]) gtBox(0.03, bh, bw, M.frame, X0 + 0.015, by, bz, room);
    for (const py of [0.55, 1.45]) gtBox(0.01, 0.7, dw * 0.7, M.frame, X0 + 0.045, py, cz, room);
    gtCyl(0.02, 0.02, 0.1, M.handle, X0 + 0.07, 1.0, D.z[0] + 0.1, room, 10).rotation.z = Math.PI / 2;
    R.doorC = [X0, D.h / 2, cz]; }
  // skirting
  gtBox(-X0, 0.1, 0.015, M.skirt, X0 / 2, 0.05, Zn + 0.008, room); gtBox(-X0, 0.1, 0.015, M.skirt, X0 / 2, 0.05, Zs - 0.008, room);
  gtBox(0.015, 0.1, Zs - Zn, M.skirt, -0.008, 0.05, 0, room);
  // the poster (south wall, over the desk), the clock (north wall, over the bed)
  gtPlane(0.5, 0.7, M.poster, -2.0, 1.95, Zs - 0.004, '-z', room);
  { const g = R.clockG = new THREE.Group(); g.position.set(GT_ROOM.clock.x, GT_ROOM.clock.y, Zn + 0.02); room.add(g);
    gtCyl(0.17, 0.17, 0.035, M.black, 0, 0, 0, g, 32).rotation.x = Math.PI / 2;
    const f = new THREE.Mesh(new THREE.CircleGeometry(0.16, 32), M.clock); f.position.z = 0.019; g.add(f);
    const hand = (L, W2, m) => { const p = new THREE.Group(); p.position.z = 0.024; g.add(p); gtBox(W2, L, 0.004, m, 0, L / 2 - 0.015, 0, p); return p; };
    R.hH = hand(0.09, 0.012, M.black); R.hM = hand(0.13, 0.008, M.black); R.hS = hand(0.14, 0.003, gtStd('#c0392b', 0.5)); }

  // ---- the loose things (each its own group, posed by update)
  const grp = () => { const g = new THREE.Group(); room.add(g); return g; };
  // the bed: frame, legs, headboard (west end), mattress, duvet, pillows
  { const B = GT_ROOM.bed, g = R.bed = grp(), L = B.x[1] - B.x[0], w = B.z[1] - B.z[0];
    gtBox(L, 0.18, w, M.bedWood, 0, 0.22, 0, g);
    for (const [lx, lz] of [[-L / 2 + 0.05, -w / 2 + 0.05], [L / 2 - 0.05, -w / 2 + 0.05], [-L / 2 + 0.05, w / 2 - 0.05], [L / 2 - 0.05, w / 2 - 0.05]]) gtBox(0.06, 0.14, 0.06, M.bedWood, lx, 0.07, lz, g);
    gtBox(0.06, 0.9, w, M.bedWood, -L / 2 - 0.03, 0.45, 0, g);
    gtMesh(gtRoundBox(L - 0.06, 0.2, w - 0.06, 0.06, 0.04), M.mattress, 0, 0.31, 0, g);
    gtMesh(gtRoundBox(L * 0.72, 0.07, w - 0.02, 0.05, 0.03), M.duvet, 0.27, 0.5, 0, g);
    for (const sz of [-1, 1]) gtMesh(gtRoundBox(0.42, 0.12, 0.6, 0.06, 0.05), M.pillow, -L / 2 + 0.3, 0.5, sz * 0.33, g);
    R.bedC = [(B.x[0] + B.x[1]) / 2, 0, (B.z[0] + B.z[1]) / 2]; }
  // the wardrobe: pivot at its lower east edge (it tips over onto the bed)
  { const W2 = GT_ROOM.wardrobe, g = R.wardrobe = grp(), d = W2.x[1] - W2.x[0], w = W2.z[1] - W2.z[0];
    const body = new THREE.Group(); g.add(body); R.wardBody = body;
    gtBox(d, W2.h, w, M.wardrobe, -d / 2, W2.h / 2, 0, body);
    gtBox(0.005, W2.h - 0.1, 0.004, M.handle, 0.0025, W2.h / 2, 0, body);
    for (const sz of [-1, 1]) gtBox(0.03, 0.22, 0.02, M.handle, 0.015, 1.05, sz * 0.05, body);
    R.wardC = [W2.x[1], 0, (W2.z[0] + W2.z[1]) / 2]; }
  // the desk, the laptop, the lamp
  { const D2 = GT_ROOM.desk, g = R.desk = grp(), L = D2.x[1] - D2.x[0], w = D2.z[1] - D2.z[0];
    gtBox(L, 0.035, w, M.desk, 0, D2.h - 0.018, 0, g);
    for (const [lx, lz] of [[-L / 2 + 0.03, -w / 2 + 0.03], [L / 2 - 0.03, -w / 2 + 0.03], [-L / 2 + 0.03, w / 2 - 0.03], [L / 2 - 0.03, w / 2 - 0.03]]) gtBox(0.035, D2.h - 0.035, 0.035, M.black, lx, (D2.h - 0.035) / 2, lz, g);
    R.deskC = [(D2.x[0] + D2.x[1]) / 2, 0, (D2.z[0] + D2.z[1]) / 2]; }
  { const g = R.laptop = grp(); gtBox(0.33, 0.012, 0.23, M.alu, 0, 0.006, 0, g);
    const lid = new THREE.Group(); lid.position.set(0, 0.012, -0.11); lid.rotation.x = -0.25; g.add(lid);
    gtBox(0.33, 0.21, 0.008, M.alu, 0, 0.105, 0, lid); gtBox(0.3, 0.18, 0.002, M.screen, 0, 0.105, 0.005, lid); }
  { const g = R.lamp = grp(); gtCyl(0.07, 0.08, 0.02, M.black, 0, 0.01, 0, g, 16); gtCyl(0.008, 0.008, 0.36, M.black, 0, 0.19, 0, g, 8);
    gtMesh(new THREE.ConeGeometry(0.09, 0.12, 18, 1, true), M.shade, 0.0, 0.4, 0, g); }
  // the chair (an office chair: five-star base, column, seat, back)
  { const g = R.chair = grp();
    for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283, leg = gtBox(0.3, 0.03, 0.04, M.chair, Math.cos(a) * 0.15, 0.08, Math.sin(a) * 0.15, g); leg.rotation.y = -a; gtCyl(0.025, 0.025, 0.04, M.black, Math.cos(a) * 0.29, 0.03, Math.sin(a) * 0.29, g, 8); }
    gtCyl(0.025, 0.025, 0.36, M.alu, 0, 0.27, 0, g, 10);
    gtMesh(gtRoundBox(0.48, 0.08, 0.46, 0.06, 0.03), M.chairSeat, 0, 0.45, 0, g);
    gtMesh(gtRoundBox(0.06, 0.48, 0.44, 0.03, 0.02), M.chairSeat, -0.24, 0.78, 0, g); }
  // the rug
  { const g = R.rug = grp(), Rg = GT_ROOM.rug; gtPlane(Rg.x[1] - Rg.x[0], Rg.z[1] - Rg.z[0], M.rug, 0, 0.004, 0, '+y', g); }
  // the shelf (screwed to the west wall: it stays) and its books (each a group whose origin is its west face's foot)
  { const SH = GT_ROOM.shelf; gtBox(SH.x[1] - SH.x[0], 0.025, SH.z[1] - SH.z[0], M.desk, (SH.x[0] + SH.x[1]) / 2, SH.y - 0.0125, (SH.z[0] + SH.z[1]) / 2, room);
    for (const z of [SH.z[0] + 0.12, SH.z[1] - 0.12]) gtBox(0.18, 0.12, 0.02, M.black, SH.x[0] + 0.09, SH.y - 0.07, z, room);
    R.books = GT_BOOKS.map((b) => { const g = grp(); const m = gtBox(b.dep, b.h, b.w, M.books[b.c], b.dep / 2, b.h / 2, 0, g); return { g, b, m }; }); }
  // the ceiling light: a pendulum (θ about z) from the middle of the ceiling
  { const L = GT_ROOM.light, g = R.lightG = new THREE.Group(); g.position.set(L.x, H, L.z); room.add(g);
    gtCyl(0.05, 0.05, 0.02, M.frame, 0, -0.01, 0, room === g ? g : g, 12);
    gtCyl(0.004, 0.004, L.L, M.flex, 0, -L.L / 2, 0, g, 6);
    gtMesh(new THREE.ConeGeometry(0.18, 0.2, 24, 1, true), M.shade, 0, -L.L - 0.05, 0, g);
    gtMesh(new THREE.SphereGeometry(0.04, 12, 8), M.bulb, 0, -L.L - 0.08, 0, g);
    R.bulb = new THREE.PointLight('#ffe6c4', 0.6, 5, 1.6); R.bulb.position.set(0, -L.L - 0.1, 0); g.add(R.bulb); }
  // the mug (in your hand, then on the glass) and its coffee
  { const g = R.mug = new THREE.Group(); scene.add(g);
    gtCyl(0.042, 0.04, 0.095, M.mug, 0, 0.0475, 0, g, 18); gtCyl(0.037, 0.037, 0.004, M.coffee, 0, 0.08, 0, g, 18);
    const hd2 = gtMesh(new THREE.TorusGeometry(0.026, 0.008, 8, 16, Math.PI), M.mug, 0.042, 0.05, 0, g); hd2.rotation.z = -Math.PI / 2; }
  // the bath water: streams through the door's edges across the room; the layer lying on the window wall
  R.jet = gtStreaks(room, 3 * 70, '#dceaf2', 0.75);
  // … and pouring out of the hole when the window goes: a sideways waterfall
  R.fall = gtStreaks(room, 700, '#dfeaf1', 0.8);
  R.pool = new THREE.Mesh(new THREE.PlaneGeometry(Zs - Zn, H), M.water); R.pool.rotation.y = -Math.PI / 2; R.pool.position.set(-0.02, H / 2, 0); R.pool.renderOrder = 6; room.add(R.pool);
  // the window's pieces when it goes (falling out, east)
  // what's left in the frame when it goes: jagged teeth of glass round the edges of the opening
  { const pts = [], Wn = GT_W.win, z0 = Wn.z[0] + 0.05, z1 = Wn.z[1] - 0.05, y0 = Wn.y[0] + 0.05, y1 = Wn.y[1] - 0.05;
    const tooth = (a, b, tip) => pts.push(new THREE.Vector3(0.06, a[1], a[0]), new THREE.Vector3(0.06, b[1], b[0]), new THREE.Vector3(0.06, tip[1], tip[0]));
    for (let i = 0; i < 18; i++) {
      const e = i % 4, u0 = hash1(i * 5.3), w = 0.06 + 0.12 * hash1(i * 2.9), h = 0.05 + 0.16 * hash1(i * 7.7), sk = 0.06 * (hash1(i * 3.3) - 0.5);
      if (e === 0) { const z = z0 + u0 * (z1 - z0 - w); tooth([z, y0], [z + w, y0], [z + w * 0.5 + sk, y0 + h]); }
      else if (e === 1) { const z = z0 + u0 * (z1 - z0 - w); tooth([z, y1], [z + w, y1], [z + w * 0.5 + sk, y1 - h]); }
      else if (e === 2) { const y = y0 + u0 * (y1 - y0 - w); tooth([z0, y], [z0, y + w], [z0 + h, y + w * 0.5 + sk]); }
      else { const y = y0 + u0 * (y1 - y0 - w); tooth([z1, y], [z1, y + w], [z1 - h, y + w * 0.5 + sk]); }
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts); g.computeVertexNormals();
    R.teeth = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#e8f1f5', transparent: true, opacity: 0.45, roughness: 0.04, envMapIntensity: 1.6, depthWrite: false, side: THREE.DoubleSide })); R.teeth.renderOrder = 4; R.teeth.visible = false; room.add(R.teeth); }
  R.shards = Array.from({ length: 14 }, (_, i) => { const m = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.12 + 0.2 * hash1(i * 3.1), 0.05), new THREE.Vector3(0, 0.03, 0.15 + 0.15 * hash1(i))]), M.glass); m.geometry.setIndex([0, 1, 2]); m.geometry.computeVertexNormals(); room.add(m); m.visible = false; return m; });

  R.update = (s, o) => gtRoomUpdate(R, s, o || {});
  R.toWorld = (x, y, z, out) => (out || new THREE.Vector3()).set(x, y, z).applyMatrix4(room.matrixWorld);
  return R;
}

// the house's lean: a shear about the ground (x += tan(lean)·y), applied to the shell and (as a move + shear) the room
function gtShear(m, lean, tx, ty, tz) {
  const k = Math.tan(MathX.deg(lean));
  m.set(1, k, 0, tx + k * ty, 0, 1, 0, ty, 0, 0, 1, tz, 0, 0, 0, 1);
}

function gtRoomUpdate(R, s, o) {
  const lean = gtLean(s);
  gtShear(R.house.matrix, lean, 0, 0, 0); R.house.matrixWorldNeedsUpdate = true;
  gtShear(R.room.matrix, lean, GT_W.roomX, GT_W.floorY, 0); R.room.matrixWorldNeedsUpdate = true;
  R.room.updateMatrixWorld(true); R.house.updateMatrixWorld(true);
  // ---- the shed (falls 11 m onto your back wall, lands at ~1.5 s, then lies against it)
  { const f = gtFall(s, 11.0, { e: 0.05 }); R.shed.position.set(R.shedX0 + f.x, 0, 3.0); R.shed.rotation.set(0, 0, f.hit && s > f.hit ? -0.08 : 0); }
  // ---- the loose things: each falls its distance east and stops
  const B = GT_ROOM, at = (g, c, dx, y = 0) => g.position.set(c[0] + dx, y, c[2]);
  const fb = gtRoomFall('bed', s); at(R.bed, R.bedC, fb.x);
  const wd = gtWardrobe(s); R.wardrobe.position.set(R.wardC[0] + wd.x, 0, R.wardC[2]); R.wardrobe.rotation.set(0, 0, 0);
  // (it pivots about its lower east edge onto the bed: its body is built east of the pivot… rotating −a about z)
  R.wardBody.rotation.z = -wd.a; R.wardBody.position.set(0, wd.a > 0 ? 0.55 * Math.sin(Math.min(wd.a, 1)) * 0 : 0, 0);
  const fd = gtRoomFall('desk', s); at(R.desk, R.deskC, fd.x);
  { const L = B.laptop, f = gtFall(s, L.d, { e: 0.05 }); R.laptop.position.set((L.x[0] + L.x[1]) / 2 + f.x, B.desk.h, (L.z[0] + L.z[1]) / 2); }
  { const L = B.lamp, f = gtFall(s, L.d, { e: 0.05 }), y = s < GTP.tBack ? B.desk.h : B.desk.h;
    R.lamp.position.set((L.x[0] + L.x[1]) / 2 + f.x, y, (L.z[0] + L.z[1]) / 2); R.lamp.rotation.z = f.hit && s > f.hit && s < GTP.tBack ? -0.2 : 0; }
  { const C = B.chair, f = gtRoomFall('chair', s); R.chair.position.set((C.x[0] + C.x[1]) / 2 + f.x, 0, (C.z[0] + C.z[1]) / 2); R.chair.rotation.y = 0.3; }
  { const Rg = B.rug, f = gtFall(s, Rg.d, { e: 0.0 }); R.rug.position.set((Rg.x[0] + Rg.x[1]) / 2 + f.x, 0, (Rg.z[0] + Rg.z[1]) / 2); }
  // the books: across the room onto the glass or the wall beside it; at the return the ones left drop to the floor
  R.books.forEach(({ g, b }, i) => {
    const r = gtBook(i, s);
    g.visible = !r.gone;
    g.position.set(r.x, r.y, b.z0 + b.w / 2);
    g.rotation.set(0, 0, 0);
    // (landed: it tips over onto its side; at the return it falls flat on the floor, scattered)
    if (r.f.hit && s > r.f.hit && s < GTP.tBack) { const u = MathX.clamp((s - r.f.hit) / 0.25, 0, 1); g.rotation.x = (i % 2 ? 1 : -1) * (0.3 + b.lean) * u; }
    if (s >= GTP.tBack && !b.glass) { const u = MathX.clamp((s - GTP.tBack) / gtDownT(GT_ROOM.shelf.y), 0, 1); g.rotation.set((i % 2 ? 1 : -1) * Math.PI / 2 * u, i * 0.7 * u, 0); g.position.x -= 0.3 * u * (i % 3); }
  });
  // ---- the ceiling light
  R.lightG.rotation.z = gtLight(s);
  // ---- the clock's hands
  { const c = gtClockParts(s); R.hS.rotation.z = -Math.floor(c.sec) / 60 * 6.283; R.hM.rotation.z = -(c.m + c.sec / 60) / 60 * 6.283; R.hH.rotation.z = -((c.h % 12) + c.m / 60) / 12 * 6.283; }
  // ---- the window: cracks, the coffee; the water lying on it; it goes at GT_GLASS.go
  const gone = s >= GT_GLASS.go;
  R.crackTex.update({ k: +gtCrack(s).toFixed(3), coffee: s > GT_YOU.hitGlass ? +Math.min(1, (s - GT_YOU.hitGlass) / 0.15).toFixed(2) : 0, drip: s >= GTP.tBack ? +Math.min(1, (s - GTP.tBack) / 3).toFixed(2) : 0 });
  R.glass.visible = R.crack.visible = !gone; R.teeth.visible = gone;
  R.shards.forEach((m, i) => {
    const u = s - GT_GLASS.go;
    m.visible = gone && u < 6;
    if (!m.visible) return;
    const z0 = GT_W.win.z[0] + 0.1 + (i % 4) * 0.28, y0 = GT_W.win.y[0] + 0.1 + Math.floor(i / 4) * 0.3, f = gtDrop(u + 0.02 * i);
    m.position.set(0.06 + f, y0 + 0.4 * u * (hash1(i) - 0.5), z0 + 0.3 * u * (hash1(i * 7) - 0.5)); m.rotation.set(u * 3 * hash1(i * 3), u * 2, u * 4 * hash1(i * 5));
  });
  // the pool: 1.9 cm over the wall (the window's glass included); it pours out when the glass goes
  { const d = gtPool(s) + (s >= GT_GLASS.go && s < GT_GLASS.go + 3 ? 0.019 * (1 - (s - GT_GLASS.go) / 3) : 0);
    R.pool.visible = d > 0.0005 && s < GTP.tBack; R.pool.position.x = -d; R.pool.material.map.offset.set(0.013 * s % 1, 0.007 * s % 1); }
  // the mug: in your hand (POV: hidden here, the hands carry their own), flies the 0.17 m with you, lands on the glass
  { const f = gtFall(s, GT_ROOM.you.d + 0.04, { e: 0.05 }), m = R.mug;
    m.visible = !o.pov || s > GT_YOU.hitGlass;
    const base = R.toWorld(-0.22 + f.x, 1.32, 0.2);
    m.position.copy(base); m.rotation.set(0, 0, s > GT_YOU.hitGlass ? -Math.PI / 2 : 0);
    if (s >= GT_GLASS.go) { const u = s - GT_GLASS.go; m.position.x += gtDrop(u) + 0.2; }
    if (s > GT_GLASS.go + 8) m.visible = false; }
}

// streaks of water (quads turned to face the camera each frame; room-local): N of them, a colour, an opacity
function gtStreaks(room, N, col, op) {
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(N * 12), uv = new Float32Array(N * 8), idx = new Uint32Array(N * 6);
  for (let i = 0; i < N; i++) { uv.set([0, 0, 1, 0, 1, 1, 0, 1], i * 8); idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6); }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
  const st = gtCanvas(8, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(255,255,255,0.5)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col, map: gtTex(st, { repeat: false }), transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide }));
  m.frustumCulled = false; m.renderOrder = 6; room.add(m);
  return { m, geo, pos, N };
}
// the window going: the water lying on it (and, over ~3 s, what drains to the hole off the rest of the wall) falls out
// and away east: x = g τ²/2 from the hole; long streaks, the faster the longer (room-local; after the camera is placed)
function gtFallUpdate(R, s, cam) {
  const F = R.fall, u = s - GT_GLASS.go;
  F.m.visible = u > 0 && u < 10;
  if (!F.m.visible) return;
  cam.getWorldPosition(_gtJC); R.room.worldToLocal(_gtJC);
  const cx = _gtJC.x, cy = _gtJC.y, cz = _gtJC.z, P = F.pos, Wn = GT_W.win, g = GTP.g;
  let n = 0;
  for (let i = 0; i < F.N; i++) {
    const a = gtR(i, 921), b = gtR(i, 922), c = gtR(i, 923), tau = u - 3.0 * a * a * a;    // (most of it at once)
    if (tau <= 0) continue;
    const x = 0.01 + 0.5 * g * tau * tau, v = g * tau; if (x > 90) continue;
    const L = Math.min(5, 0.12 + v * 0.07), ex = Math.max(-0.02, x - L);
    const sp = 0.25 * tau, z = Wn.z[0] + 0.04 + b * (Wn.z[1] - Wn.z[0] - 0.08) + (b - 0.5) * sp, y = Wn.y[0] + 0.04 + c * (Wn.y[1] - Wn.y[0] - 0.08) + (c - 0.5) * sp;
    const vx = cx - x, vy = cy - y, vz = cz - z, dist = Math.hypot(vx, vy, vz);
    if (dist < 0.3) continue;
    let wy = vz, wz = -vy; const wl = Math.hypot(wy, wz) || 1, hw = (0.01 + 0.016 * gtR(i, 924)) * Math.max(1, dist / 4);
    wy *= hw / wl; wz *= hw / wl;
    const o = n * 12;
    P[o] = x; P[o + 1] = y - wy; P[o + 2] = z - wz; P[o + 3] = x; P[o + 4] = y + wy; P[o + 5] = z + wz;
    P[o + 6] = ex; P[o + 7] = y + wy; P[o + 8] = z + wz; P[o + 9] = ex; P[o + 10] = y - wy; P[o + 11] = z - wz;
    n++;
  }
  F.geo.setDrawRange(0, n * 6); F.geo.attributes.position.needsUpdate = true;
}
// the bath water pouring through the gaps round your door (its two sides and its top), falling the 3.6 m across your
// room to the window wall: streaks turned to face the camera (room-local; called after the camera is placed)
const _gtJC = new THREE.Vector3();
function gtJetUpdate(R, s, cam) {
  const J = R.jet, on = s > GT_BATH.t0 && s < GT_BATH.t1 + 10, k = on ? gtSm(s, GT_BATH.t0, GT_BATH.t0 + 3) * (1 - gtSm(s, GT_BATH.t1 - 40, GT_BATH.t1 + 10)) : 0;
  J.m.visible = k > 0.02;
  if (!J.m.visible) return;
  cam.getWorldPosition(_gtJC); R.room.worldToLocal(_gtJC);
  const cx = _gtJC.x, cy = _gtJC.y, cz = _gtJC.z, P = J.pos, D = GT_W.door, x0 = GT_W.room.x[0] + 0.02, g = GTP.g, per = 70;
  let n = 0;
  for (let gap = 0; gap < 3; gap++) for (let j = 0; j < per; j++) {
    const id = gap * per + j; if (gtR(id, 901) > 0.35 + 0.65 * k) continue;
    // where it leaves the gap: along the door's side (y 0 … 2.05) or its top (z across the door)
    const a = gtR(id, 902), ph = gtR(id, 903), T = 0.86;
    const z0 = gap === 0 ? D.z[0] - 0.01 : gap === 1 ? D.z[1] + 0.01 : D.z[0] + a * (D.z[1] - D.z[0]);
    const y0 = gap === 2 ? D.h + 0.01 : 0.05 + a * (D.h - 0.1);
    const tau = ((s * 1.0 + ph * T) % T + T) % T, vx0 = 0.6 + 0.8 * gtR(id, 904);
    const x = x0 + vx0 * tau + 0.5 * g * tau * tau, v = vx0 + g * tau;
    if (x > -0.06) continue;
    const sp = 0.35 * tau * (gtR(id, 905) - 0.5), z = z0 + (gap === 2 ? sp * 0.4 : sp), y = y0 + (gap === 2 ? sp : sp * 0.3) - (gap === 2 ? 0.0 : 0);
    const L = Math.min(0.9, 0.05 + v * 0.045), ex = x - L;
    const ax = ex - x, vx = cx - x, vy = cy - y, vz = cz - z;
    let wy = -ax * vz, wz = ax * vy; const wl = Math.hypot(wy, wz) || 1, hw = 0.006 + 0.01 * gtR(id, 906);
    wy *= hw / wl; wz *= hw / wl;
    const o = n * 12;
    P[o] = x; P[o + 1] = y - wy; P[o + 2] = z - wz; P[o + 3] = x; P[o + 4] = y + wy; P[o + 5] = z + wz;
    P[o + 6] = ex; P[o + 7] = y + wy; P[o + 8] = z + wz; P[o + 9] = ex; P[o + 10] = y - wy; P[o + 11] = z - wz;
    n++;
  }
  J.geo.setDrawRange(0, n * 6); J.geo.attributes.position.needsUpdate = true;
}
// the water's surface: soft light ripples
function gtRippleCanvas() {
  return gtCanvas(256, 256, (g, w, h) => {
    g.fillStyle = '#7fa2b4'; g.fillRect(0, 0, w, h);
    const r = new RNG(61);
    for (let i = 0; i < 90; i++) { const x = r.range(0, w), y = r.range(0, h), rr = r.range(10, 40); g.strokeStyle = `rgba(230,244,250,${r.range(0.08, 0.3)})`; g.lineWidth = r.range(1, 3); g.beginPath(); g.ellipse(x, y, rr, rr * r.range(0.4, 0.8), r.range(0, 3), 0, Math.PI * 2); g.stroke(); }
  });
}
