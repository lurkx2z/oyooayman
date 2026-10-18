/* =====================================================================
   HOME · ROOM — the flat (metres; y up; north = −z). A fifth-floor flat on a harbour, at about 15 m above the water.
     living room   x −3.2…3.2, z −2.6…2.6, 2.65 m high; the north wall is glass (a sliding door to the balcony in the
                   middle); sofa facing the view, coffee table, rug, the floor lamp in the north-east corner, dining
                   table by the window (north-west), bookcase (west wall), sideboard + clock (east wall), a light
                   switch on the east wall by the hall door
     balcony       z −4.1…−2.6, glass balustrade
     hallway       z 2.6…4.0, x −0.5…6.0; the full-length mirror on its east end wall, the front door beside it
     outside       the harbour: the promenade 15 m below, the water, the town on the far shore 2 km north, hills, sky
   slBuildHome(app, set) → parts. The lamp is the only point light that obeys the light front (kit.js).
   ===================================================================== */

const SL_HOME = {
  lamp: [2.55, 1.5, -1.95],            // the bulb
  sw: [3.17, 1.12, 1.62],              // the light switch (east wall)
  mirror: { x: 5.98, z: 3.3, y: 1.05, w: 0.66, h: 1.75 },
  table: [-2.3, 0.75, -1.45],          // dining table top centre
  wallDot: [3.18, 0.62, 0.74],         // where the laser points (east wall, above the cat's head)
  floorY: 0, ceil: 2.65,
  water: -16.5, street: -15,
};

// oak planks: 8 boards across, staggered end joints, each board a slice of a grain texture with its own tint
function slFloorCanvas() {
  const W = 1024, H = 2048, wood = [slWoodCanvas(11, 256, 2048, [158, 112, 72]), slWoodCanvas(12, 256, 2048, [146, 101, 64]), slWoodCanvas(13, 256, 2048, [165, 120, 80])];
  const r = new RNG(77);
  return slCanvas(W, H, (g) => {
    for (let i = 0; i < 8; i++) {
      const x = i * W / 8; let y = -r.range(0, H);
      while (y < H) {
        const len = r.range(700, 1500), src = wood[r.int(0, 2)], sy = r.range(0, 2048 - len);
        g.drawImage(src, r.range(0, 128), sy, 128, len, x, y, W / 8, len);
        g.fillStyle = `rgba(${r.next() < 0.5 ? '255,235,210' : '40,24,10'},${r.range(0.02, 0.08)})`; g.fillRect(x, y, W / 8, len);
        g.fillStyle = 'rgba(30,18,8,0.55)'; g.fillRect(x, y, W / 8, 3);
        y += len;
      }
      g.fillStyle = 'rgba(28,16,6,0.6)'; g.fillRect(x, 0, 2, H);
    }
  });
}
// painted plaster: a warm off-white with a faint roller texture
function slPlasterCanvas(base = [222, 214, 200]) {
  return slCanvas(512, 512, (g, w, h) => {
    const img = g.createImageData(w, h), d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = (hash2(x >> 1, y >> 1) - 0.5) * 0.035 + (hash2(x >> 4, y >> 3) - 0.5) * 0.03;
      const i = (y * w + x) * 4; for (let c = 0; c < 3; c++) d[i + c] = MathX.clamp(base[c] * (1 + n), 0, 255); d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
}
// a woven rug: a muted border and a soft diamond field
function slRugCanvas() {
  return slCanvas(1024, 768, (g, w, h) => {
    g.fillStyle = '#8a5a44'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#d8ccb6'; g.fillRect(40, 40, w - 80, h - 80);
    g.fillStyle = '#7d4f3c'; g.fillRect(70, 70, w - 140, h - 140);
    g.fillStyle = '#cfc0a6'; g.fillRect(90, 90, w - 180, h - 180);
    g.strokeStyle = 'rgba(122,78,58,0.55)'; g.lineWidth = 6;
    for (let k = -12; k < 24; k++) { g.beginPath(); g.moveTo(90 + k * 70, 90); g.lineTo(90 + k * 70 + (h - 180), h - 90); g.stroke(); g.beginPath(); g.moveTo(90 + k * 70, h - 90); g.lineTo(90 + k * 70 + (h - 180), 90); g.stroke(); }
    const img = g.getImageData(0, 0, w, h), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const n = (hash1(i * 0.37) - 0.5) * 22; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(img, 0, 0);
  });
}
// a lit window grid for a far building: rows of windows, some warm, some cool, some dark
function slTownCanvas(seed) {
  const r = new RNG(seed);
  return slCanvas(256, 256, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    for (let y = 8; y < h; y += 16) for (let x = 6; x < w; x += 12) {
      const k = r.next(); if (k < 0.42) continue;
      g.fillStyle = k < 0.8 ? `rgb(255,${180 + r.int(0, 40)},${100 + r.int(0, 50)})` : k < 0.93 ? 'rgb(200,220,255)' : 'rgb(255,240,200)';
      g.globalAlpha = r.range(0.45, 1); g.fillRect(x, y, 7, 9);
    }
    g.globalAlpha = 1;
  });
}
// an abstract print for the walls (seeded shapes in a warm palette)
function slPrintCanvas(seed) {
  const r = new RNG(seed), pal = ['#d9a066', '#b5543c', '#3d5a6c', '#e8dcc4', '#7a8f6a', '#2b2b30'];
  return slCanvas(512, 640, (g, w, h) => {
    g.fillStyle = '#efe7d6'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 7; i++) {
      g.fillStyle = pal[r.int(0, pal.length - 1)]; g.globalAlpha = r.range(0.7, 1);
      if (r.next() < 0.5) { g.beginPath(); g.arc(r.range(80, w - 80), r.range(80, h - 80), r.range(40, 160), 0, 7); g.fill(); }
      else g.fillRect(r.range(0, w - 100), r.range(0, h - 100), r.range(60, 260), r.range(30, 200));
    }
    g.globalAlpha = 1;
  });
}

function slBuildHome(app, S) {
  const scene = S.scene, H = SL_HOME, P = {};
  const M = {
    floor: slStd('#ffffff', 0.55, 0, { map: (() => { const t = slTex(slFloorCanvas()); t.repeat.set(1 / 1.7, 1 / 3.4); return t; })() }),
    wall: slStd('#ffffff', 0.92, 0, { map: (() => { const t = slTex(slPlasterCanvas()); t.repeat.set(0.5, 0.5); return t; })() }),
    hallWall: slStd('#ffffff', 0.92, 0, { map: (() => { const t = slTex(slPlasterCanvas([206, 210, 204])); t.repeat.set(0.5, 0.5); return t; })() }),
    ceil: slStd('#e9e6df', 0.95),
    trim: slStd('#f1eee8', 0.6),
    frame: slStd('#2a2d32', 0.45, 0.6),
    glass: new THREE.MeshStandardMaterial({ color: '#9fb4c0', roughness: 0.05, metalness: 0.0, transparent: true, opacity: 0.1, depthWrite: false }),
    sofa: slStd('#55687a', 0.95), sofaDark: slStd('#435564', 0.95),
    cush1: slStd('#c99a5b', 0.9), cush2: slStd('#8a9a6e', 0.9), throwM: slStd('#d8cbb3', 0.95),
    oak: slStd('#ffffff', 0.5, 0, { map: slTex(slWoodCanvas(21, 256, 1024, [170, 124, 82])) }),
    black: slStd('#1d1e21', 0.5, 0.3), brass: slStd('#b58b4a', 0.35, 0.85),
    shade: slStd('#efe2c8', 0.9, 0, { side: THREE.DoubleSide, emissive: new THREE.Color('#ffcf8f'), emissiveIntensity: 0.0 }),
    bulb: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: new THREE.Color('#ffd9a0'), emissiveIntensity: 6 }),
    rug: slStd('#ffffff', 1.0, 0, { map: slTex(slRugCanvas(), { repeat: false }) }),
    pot: slStd('#c9b9a3', 0.8), leaf: slStd('#3f6b3a', 0.8, 0, { side: THREE.DoubleSide }), soil: slStd('#3b2b20', 1),
    door: slStd('#2f4a40', 0.55), tile: slStd('#8c8e8a', 0.6), concrete: slStd('#8b8a86', 0.9),
    book: ['#7a2f2a', '#2f4a6a', '#c9a24a', '#3d5a3a', '#d8d0c0', '#5a3a5a', '#1f1f22', '#a8562a'].map((c) => slStd(c, 0.8)),
  };
  const F = H.floorY, C = H.ceil;
  // ---------------------------------------------------------------- the living room shell
  const floor = slMesh(new THREE.PlaneGeometry(6.4, 5.2), M.floor, 0, F, 0); floor.rotation.x = -Math.PI / 2;
  const ceil = slMesh(new THREE.PlaneGeometry(6.4, 5.2), M.ceil, 0, C, 0); ceil.rotation.x = Math.PI / 2; P.ceil = [ceil];
  const wallX = (x, z0, z1, ry, y0 = 0, y1 = C, m = M.wall) => { const w = slMesh(new THREE.PlaneGeometry(z1 - z0, y1 - y0), m, x, (y0 + y1) / 2, (z0 + z1) / 2); w.rotation.y = ry; return w; };
  const wallZ = (z, x0, x1, ry, y0 = 0, y1 = C, m = M.wall) => { const w = slMesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0), m, (x0 + x1) / 2, (y0 + y1) / 2, z); w.rotation.y = ry; return w; };
  wallX(-3.2, -2.6, 2.6, Math.PI / 2);                  // west
  wallX(3.2, -2.6, 2.6, -Math.PI / 2);                  // east
  // south wall with the hall doorway (x 1.3…2.2, 2.1 high)
  wallZ(2.6, -3.2, 1.3, Math.PI); wallZ(2.6, 2.2, 3.2, Math.PI); wallZ(2.6, 1.3, 2.2, Math.PI, 2.1, C);
  // north: the window wall (a low upstand, the head above, slim frames)
  wallZ(-2.6, -3.2, 3.2, 0, 0, 0.06); wallZ(-2.6, -3.2, 3.2, 0, 2.45, C);
  wallZ(-2.6, -3.2, -3.0, 0, 0.06, 2.45); wallZ(-2.6, 3.0, 3.2, 0, 0.06, 2.45);
  for (const x of [-3.0, -1.0, 1.0, 3.0]) slBox(0.06, 2.42, 0.1, M.frame, x, 1.26, -2.6);
  slBox(6.0, 0.06, 0.1, M.frame, 0, 0.08, -2.6); slBox(6.0, 0.06, 0.1, M.frame, 0, 2.43, -2.6);
  const glass = slMesh(new THREE.PlaneGeometry(6.0, 2.36), M.glass, 0, 1.26, -2.6); glass.castShadow = false; glass.receiveShadow = false; glass.renderOrder = 4;
  P.glass = glass;
  // skirting
  for (const [x, z, w, d] of [[-3.18, 0, 0.03, 5.2], [3.18, 0, 0.03, 5.2], [-0.95, 2.58, 4.5, 0.03], [2.7, 2.58, 1.0, 0.03]]) slBox(w, 0.09, d, M.trim, x, 0.045, z);
  // ---------------------------------------------------------------- the balcony and the facade outside
  slBox(3.4, 0.2, 1.55, M.concrete, 0, -0.1, -3.35);
  for (const [x0, x1, z0, z1] of [[-1.7, 1.7, -4.12, -4.08], [-1.72, -1.68, -4.1, -2.62], [1.68, 1.72, -4.1, -2.62]]) {
    const gl = slBox(x1 - x0, 1.0, z1 - z0, M.glass, (x0 + x1) / 2, 0.5, (z0 + z1) / 2); gl.castShadow = false; gl.renderOrder = 4;
    slBox(x1 - x0 + 0.02, 0.04, z1 - z0 + 0.02, M.frame, (x0 + x1) / 2, 1.02, (z0 + z1) / 2);
  }
  // the building's own face below and beside the balcony (seen from it, looking down)
  const facade = slStd('#9c958a', 0.9);
  slBox(30, 15, 0.3, facade, 0, -7.6, -2.75);
  // ---------------------------------------------------------------- furniture
  // the sofa (facing north), cushions, a throw
  { const g = new THREE.Group(); g.position.set(-0.6, 0, 1.45); scene.add(g);
    slMesh(slRoundBox(2.25, 0.3, 0.95, 0.08, 0.03), M.sofaDark, 0, 0.12, 0, g);
    for (const x of [-0.55, 0.55]) slMesh(slRoundBox(1.08, 0.16, 0.7, 0.07, 0.05), M.sofa, x, 0.42, -0.06, g);
    slMesh(slRoundBox(2.25, 0.5, 0.24, 0.08, 0.06), M.sofa, 0, 0.42, 0.36, g);
    for (const x of [-1.04, 1.04]) slMesh(slRoundBox(0.18, 0.62, 0.95, 0.07, 0.06), M.sofa, x, 0.12, 0, g);
    for (const [x, m, r] of [[-0.82, M.cush1, 0.15], [0.78, M.cush2, -0.2]]) { const c = slMesh(slRoundBox(0.46, 0.42, 0.14, 0.06, 0.05), m, x, 0.56, 0.22, g); c.rotation.x = -0.25; c.rotation.z = r; }
    const th = slMesh(slRoundBox(0.6, 0.03, 0.9, 0.02, 0.01), M.throwM, 0.82, 0.585, -0.05, g); th.rotation.y = 0.08;
    for (const [x, z] of [[-1.05, -0.4], [1.05, -0.4], [-1.05, 0.4], [1.05, 0.4]]) slCyl(0.025, 0.02, 0.12, M.black, x, 0.06, z, g, 8);
    P.sofa = g; }
  // the coffee table and the rug
  slMesh(slRoundBox(1.15, 0.04, 0.58, 0.04, 0.012), M.oak, -0.6, 0.38, 0.25);
  slMesh(slRoundBox(1.05, 0.02, 0.5, 0.03, 0.006), M.oak, -0.6, 0.12, 0.25);
  for (const [x, z] of [[-1.12, 0.0], [-0.08, 0.0], [-1.12, 0.5], [-0.08, 0.5]]) slCyl(0.018, 0.018, 0.38, M.black, x, 0.19, z, null, 8);
  { const mug = slCyl(0.04, 0.036, 0.09, slStd('#d8d4cc', 0.4), -0.35, 0.465, 0.15); const bk = slBox(0.22, 0.03, 0.3, M.book[1], -0.9, 0.435, 0.3, null, 0.3); }
  const rug = slMesh(new THREE.PlaneGeometry(3.3, 2.5), M.rug, -0.55, 0.004, 0.45); rug.rotation.x = -Math.PI / 2; rug.castShadow = false;
  // the floor lamp (north-east corner): a weighted base, a brass pole, a linen drum shade with the bulb inside
  { const g = new THREE.Group(); g.position.set(H.lamp[0], 0, H.lamp[2]); scene.add(g);
    slCyl(0.17, 0.19, 0.035, M.black, 0, 0.018, 0, g, 24);
    slCyl(0.012, 0.012, 1.42, M.brass, 0, 0.74, 0, g, 10);
    const sh = slMesh(new THREE.CylinderGeometry(0.2, 0.24, 0.32, 32, 1, true), M.shade, 0, H.lamp[1] + 0.06, 0, g); sh.castShadow = false;
    const b = slMesh(new THREE.SphereGeometry(0.045, 16, 12), M.bulb, 0, H.lamp[1], 0, g); b.castShadow = false;
    P.lampG = g; }
  // a side table and a plant by the lamp, plants by the window
  slCyl(0.24, 0.24, 0.03, M.oak, 1.95, 0.55, -2.05, null, 24); slCyl(0.02, 0.02, 0.54, M.black, 1.95, 0.27, -2.05, null, 8);
  const plant = (x, z, s = 1) => {
    slCyl(0.17 * s, 0.13 * s, 0.34 * s, M.pot, x, 0.17 * s, z, null, 18); slCyl(0.16 * s, 0.16 * s, 0.01, M.soil, x, 0.33 * s, z, null, 18);
    const r = new RNG(Math.round(x * 100 + z * 7));
    for (let i = 0; i < 9; i++) {
      const a = r.range(0, 6.283), el = r.range(0.35, 1.1), L = r.range(0.35, 0.6) * s;
      const lf = slMesh(new THREE.SphereGeometry(1, 10, 6), M.leaf, x + Math.cos(a) * 0.12 * s, 0.34 * s + Math.sin(el) * L * 0.6 + 0.15 * s, z + Math.sin(a) * 0.12 * s);
      lf.scale.set(0.09 * s, 0.02 * s, L * 0.5); lf.rotation.set(-el * 0.6, -a + Math.PI / 2, 0);
    }
  };
  plant(-2.9, -2.25, 1.25); plant(2.9, -1.55, 0.9); plant(-3.0, 2.25, 1.1);
  // the dining table (north-west) and two chairs
  { const [tx, ty, tz] = H.table;
    slCyl(0.5, 0.5, 0.035, M.oak, tx, ty - 0.017, tz, null, 40);
    slCyl(0.035, 0.035, ty - 0.05, M.black, tx, (ty - 0.05) / 2, tz, null, 10); slCyl(0.24, 0.26, 0.03, M.black, tx, 0.015, tz, null, 24);
    const chair = (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
      slMesh(slRoundBox(0.44, 0.04, 0.42, 0.04, 0.01), M.oak, 0, 0.44, 0, g);
      slMesh(slRoundBox(0.42, 0.24, 0.03, 0.03, 0.01), M.oak, 0, 0.62, 0.2, g);
      for (const [a, b] of [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]]) slCyl(0.015, 0.013, 0.44, M.black, a, 0.22, b, g, 6);
      for (const a of [-0.19, 0.19]) slCyl(0.012, 0.012, 0.36, M.black, a, 0.62, 0.2, g, 6);
      return g; };
    chair(tx, tz + 0.72, 0); chair(tx + 0.75, tz - 0.05, Math.PI / 2);
    // a fruit bowl and a glass on the table
    slMesh(new THREE.SphereGeometry(0.13, 20, 10, 0, 6.283, Math.PI / 2, Math.PI / 2), slStd('#e7dfd2', 0.4, 0, { side: THREE.DoubleSide }), tx + 0.12, ty + 0.13, tz - 0.18);
    for (const [dx, dz, c] of [[0.075, -0.17, '#d4762c'], [0.16, -0.215, '#c9a43a'], [0.13, -0.135, '#9c2b25']]) slMesh(new THREE.SphereGeometry(0.045, 14, 10), slStd(c, 0.5), tx + dx, ty + 0.062, tz + dz);
  }
  // the bookcase (west wall), books
  { const x = -3.05, z0 = 0.15, z1 = 1.75, h = 1.95;
    for (const y of [0.02, 0.5, 0.98, 1.46, 1.93]) slBox(0.32, 0.03, z1 - z0, M.oak, x, y, (z0 + z1) / 2);
    for (const z of [z0, z1]) slBox(0.32, h, 0.03, M.oak, x, h / 2, z);
    const r = new RNG(5);
    for (const y of [0.035, 0.515, 0.995, 1.475]) { let z = z0 + 0.04; while (z < z1 - 0.08) { const w = r.range(0.025, 0.06), bh = r.range(0.24, 0.36); if (r.next() < 0.1) { z += 0.12; continue; }
      slBox(r.range(0.18, 0.24), bh, w, M.book[r.int(0, 7)], x + 0.02, y + bh / 2, z + w / 2, null, r.range(-0.03, 0.03)); z += w + 0.004; } }
  }
  // the sideboard (east wall), a radio, the clock above it
  slMesh(slRoundBox(0.45, 0.62, 1.2, 0.02, 0.01), M.oak, 2.96, 0.12, 2.0);
  for (const z of [1.62, 2.38]) slCyl(0.015, 0.015, 0.12, M.black, 2.96, 0.06, z, null, 6);
  slBox(0.16, 0.14, 0.3, slStd('#8a3a2a', 0.5), 2.96, 0.81, 2.2);
  P.clock = slCanvasTex(256, 256, (g, w, h, st) => {
    g.fillStyle = '#f4efe6'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#2a2a2c'; g.lineWidth = 10; g.beginPath(); g.arc(128, 128, 118, 0, 7); g.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.lineWidth = i % 3 ? 4 : 8; g.beginPath(); g.moveTo(128 + Math.sin(a) * 92, 128 - Math.cos(a) * 92); g.lineTo(128 + Math.sin(a) * 108, 128 - Math.cos(a) * 108); g.stroke(); }
    const m = st.m, ah = (m / 720) * 6.283, am = ((m % 60) / 60) * 6.283;
    g.lineCap = 'round'; g.lineWidth = 10; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.sin(ah) * 58, 128 - Math.cos(ah) * 58); g.stroke();
    g.lineWidth = 6; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.sin(am) * 88, 128 - Math.cos(am) * 88); g.stroke();
    g.fillStyle = '#b5543c'; g.beginPath(); g.arc(128, 128, 9, 0, 7); g.fill();
  });
  { const ck = slMesh(new THREE.CircleGeometry(0.17, 40), slStd('#ffffff', 0.5, 0, { map: P.clock.tex }), 3.185, 1.85, 2.0); ck.rotation.y = -Math.PI / 2;
    slMesh(new THREE.TorusGeometry(0.17, 0.012, 8, 40), M.black, 3.18, 1.85, 2.0).rotation.y = -Math.PI / 2; }
  // the light switch (east wall, by the hall door)
  slBox(0.012, 0.09, 0.09, slStd('#f4f2ee', 0.4), H.sw[0] + 0.02, H.sw[1], H.sw[2]);
  P.rocker = slBox(0.012, 0.035, 0.05, slStd('#e9e6e0', 0.4), H.sw[0], H.sw[1], H.sw[2]);
  // prints on the walls
  const print = (x, y, z, ry, w, h, seed) => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; scene.add(g);
    slBox(w + 0.06, h + 0.06, 0.03, M.black, 0, 0, 0, g);
    slMesh(new THREE.PlaneGeometry(w, h), slStd('#ffffff', 0.7, 0, { map: slTex(slPrintCanvas(seed), { repeat: false }) }), 0, 0, 0.017, g);
  };
  print(-0.6, 1.72, 2.57, Math.PI, 1.0, 0.7, 3); print(-3.17, 1.6, -0.9, Math.PI / 2, 0.55, 0.7, 8); print(3.17, 1.55, -0.3, -Math.PI / 2, 0.5, 0.62, 13);
  // ---------------------------------------------------------------- the hallway
  { const z0 = 2.6, z1 = 4.0, x0 = -0.5, x1 = 6.0;
    const hf = slMesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), M.tile, (x0 + x1) / 2, 0.001, (z0 + z1) / 2); hf.rotation.x = -Math.PI / 2;
    const hc = slMesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), M.ceil, (x0 + x1) / 2, 2.5, (z0 + z1) / 2); hc.rotation.x = Math.PI / 2; P.ceil.push(hc);
    // the hall side of the south living-room wall (with the doorway), the south hall wall (with the front door), the ends
    wallZ(z0 + 0.001, x0, 1.3, 0, 0, 2.5, M.hallWall); wallZ(z0 + 0.001, 2.2, x1, 0, 0, 2.5, M.hallWall); wallZ(z0 + 0.001, 1.3, 2.2, 0, 2.1, 2.5, M.hallWall);
    wallZ(z1, x0, 4.6, Math.PI, 0, 2.5, M.hallWall); wallZ(z1, 5.5, x1, Math.PI, 0, 2.5, M.hallWall); wallZ(z1, 4.6, 5.5, Math.PI, 2.1, 2.5, M.hallWall);
    wallX(x1, z0, z1, -Math.PI / 2, 0, 2.5, M.hallWall); wallX(x0, z0, z1, Math.PI / 2, 0, 2.5, M.hallWall);
    // the doorway's frame, the front door
    for (const x of [1.3, 2.2]) slBox(0.05, 2.12, 0.14, M.trim, x, 1.06, 2.6);
    slBox(0.95, 0.05, 0.14, M.trim, 1.75, 2.12, 2.6);
    const door = new THREE.Group(); door.position.set(4.6, 0, 3.98); scene.add(door); P.door = door;
    slBox(0.88, 2.06, 0.05, M.door, 0.45, 1.04, 0, door);
    for (const [y, h] of [[0.55, 0.7], [1.45, 0.7]]) slBox(0.62, h, 0.012, slStd('#284038', 0.55), 0.45, y, -0.03, door);
    slCyl(0.03, 0.03, 0.04, M.brass, 0.8, 1.02, -0.05, door, 12).rotation.x = Math.PI / 2;
    for (const x of [4.58, 5.52]) slBox(0.05, 2.12, 0.14, M.trim, x, 1.06, 4.0);
    // coat hooks and coats, a shoe bench, a hall pendant
    for (const [x, c] of [[2.9, '#5a3f2e'], [3.25, '#2d3a4a'], [3.55, '#7a7a72']]) { slCyl(0.012, 0.012, 0.08, M.black, x, 1.72, 3.97, null, 6).rotation.x = Math.PI / 2;
      const coat = slMesh(slLoft([[0, 1.7, 0, 0.06, 0.04], [0, 1.45, 0, 0.18, 0.09], [0, 0.95, 0, 0.21, 0.1]], 12, 0.3), slStd(c, 0.95), x, 0, 3.86); }
    slMesh(slRoundBox(1.0, 0.42, 0.36, 0.02, 0.01), M.oak, 3.2, 0, 3.78);
    slBox(0.3, 0.1, 0.22, slStd('#1f1f22', 0.7), 3.0, 0.07, 3.55); slBox(0.3, 0.1, 0.22, slStd('#8a3a2a', 0.7), 3.4, 0.07, 3.6);
    slCyl(0.13, 0.16, 0.18, slStd('#e8e2d6', 0.6, 0, { emissive: new THREE.Color('#ffd7a0'), emissiveIntensity: 0.3 }), 4.9, 2.32, 3.3, null, 24);
    slCyl(0.006, 0.006, 0.2, M.black, 4.9, 2.42, 3.3, null, 4);
    // the mirror (its frame; the glass is the engine's Mirror)
    const Mi = H.mirror;
    slBox(0.03, Mi.h + 0.08, Mi.w + 0.08, M.black, Mi.x + 0.005, Mi.y, Mi.z);
    const mirror = new Mirror(Mi.w, Mi.h, { resolution: 720, tint: '#e2e6e8', see: [0, 1], smudge: 0.05, clip: true, clipBias: 0.004 });   // (its frame stands behind the glass: clip it)
    mirror.mesh.position.set(Mi.x - 0.012, Mi.y, Mi.z); mirror.mesh.rotation.y = -Math.PI / 2; scene.add(mirror.mesh);
    P.mirror = mirror;
  }
  // ---------------------------------------------------------------- outside: the harbour town at dusk / night
  P.outside = slBuildHarbour(scene);
  // ---------------------------------------------------------------- lights
  const lamp = new THREE.PointLight('#ffc98a', 7.5, 0, 1.6);
  lamp.position.set(H.lamp[0], H.lamp[1], H.lamp[2]); lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.bias = -0.002; lamp.shadow.radius = 3;
  lamp.shadow.camera.near = 0.08; lamp.shadow.camera.far = 14; scene.add(lamp); P.lamp = lamp;
  const hall = new THREE.PointLight('#ffd9a8', 0, 0, 1.6); hall.position.set(4.9, 2.15, 3.3); scene.add(hall); P.hall = hall;
  // the living room's pendant over the coffee table (on at night)
  M.pend = slStd('#e8dccb', 0.7, 0, { side: THREE.DoubleSide, emissive: new THREE.Color('#ffcf98'), emissiveIntensity: 0 });
  { const sh = slMesh(new THREE.CylinderGeometry(0.09, 0.26, 0.2, 32, 1, true), M.pend, -0.6, 2.2, 0.25); sh.castShadow = false;
    slCyl(0.005, 0.005, 0.35, M.black, -0.6, 2.47, 0.25, null, 4); }
  const pend = new THREE.PointLight('#ffd2a0', 0, 0, 1.5); pend.position.set(-0.6, 2.12, 0.25); pend.castShadow = true; pend.shadow.mapSize.set(512, 512); pend.shadow.bias = -0.003;
  pend.shadow.camera.near = 0.1; pend.shadow.camera.far = 10; scene.add(pend); P.pend = pend;
  P.M = M;
  // ---------------------------------------------------------------- the cut-away plan (the illustration only)
  { const g = new THREE.Group(); g.visible = false; scene.add(g); P.slab = g;
    const slabM = slStd('#3b3e46', 0.95), capM = slStd('#e6eaf2', 0.7, 0, { emissive: new THREE.Color('#9fb2d8'), emissiveIntensity: 0.35 });
    const glassM = slStd('#9cc4e8', 0.4, 0, { emissive: new THREE.Color('#6fa0d8'), emissiveIntensity: 0.6 });
    slBox(6.6, 0.3, 5.4, slabM, 0, -0.16, 0, g); slBox(6.7, 0.3, 1.6, slabM, 2.75, -0.16, 3.3, g);
    // a line along the top of every wall, a gap at every door, the glass in blue
    const capX = (x, z0, z1, y) => slBox(0.1, 0.03, z1 - z0, capM, x, y, (z0 + z1) / 2, g);
    const capZ = (z, x0, x1, y, m = capM) => slBox(x1 - x0, 0.03, 0.1, m, (x0 + x1) / 2, y, z, g);
    capX(-3.2, -2.65, 2.65, C); capX(3.2, -2.65, 2.65, C);
    capZ(2.6, -3.25, 1.3, C); capZ(2.6, 2.2, 3.25, C); capZ(-2.6, -3.25, 3.25, C, glassM);
    capZ(4.0, -0.55, 4.6, 2.5); capZ(4.0, 5.5, 6.05, 2.5); capX(-0.5, 2.6, 4.0, 2.5); capX(6.0, 2.6, 4.05, 2.5);
  }
  return P;
}

// the view from the balcony: the promenade and its lamps 15 m below, the harbour water, the town on the far shore 2 km
// north (lit windows), the hills behind, the sky dome (sunset → night: set k), the Sun's disc, the fireworks
function slBuildHarbour(scene) {
  const O = {}, Y = SL_HOME.water;
  O.sky = slSky(scene, '#2d4f7c', '#f2a35c', '#1a1d24', { sunDir: [-0.78, 0.07, -0.62], sunGlow: '#ffb46a', hw: 0.3 });
  O.skyNight = { a: new THREE.Color('#05070d'), b: new THREE.Color('#141a28'), c: new THREE.Color('#06070a'), g: new THREE.Color('#000000') };
  O.skyDusk = { a: new THREE.Color('#2d4f7c'), b: new THREE.Color('#f2a35c'), c: new THREE.Color('#1a1d24'), g: new THREE.Color('#ffb46a') };
  // the Sun: a soft disc low in the west-north-west
  const sunM = new THREE.SpriteMaterial({ map: slDotTex(0.25), color: '#ffe1a8', transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending });
  O.sun = new THREE.Sprite(sunM); O.sun.position.set(-0.78 * 3000, 0.07 * 3000 + Y, -0.62 * 3000); O.sun.scale.setScalar(180); scene.add(O.sun);
  // the water: a dark mirror of the sky (an environment map does the reflection)
  const water = new THREE.Mesh(new THREE.PlaneGeometry(6000, 3000), new THREE.MeshStandardMaterial({ color: '#0d1a24', roughness: 0.22, metalness: 0.6 }));
  water.rotation.x = -Math.PI / 2; water.position.set(0, Y, -1520); scene.add(water); O.water = water;
  // the promenade under the flat, its lamps, the quay
  const prom = new THREE.Mesh(new THREE.PlaneGeometry(400, 26), slStd('#3b3a38', 0.95)); prom.rotation.x = -Math.PI / 2; prom.position.set(0, SL_HOME.street, -14); scene.add(prom);
  const quay = new THREE.Mesh(new THREE.BoxGeometry(400, 1.5, 0.6), slStd('#57534c', 0.9)); quay.position.set(0, Y + 0.75, -27); scene.add(quay);
  // lights strung along the shores: points (promenade lamps, the far town's streets), drawn as soft sprites
  const pts = [], cols = [];
  const r = new RNG(9);
  for (let x = -190; x <= 190; x += 14) { pts.push(x, SL_HOME.street + 4.5, -26); cols.push(1, 0.82, 0.55); }
  for (let i = 0; i < 900; i++) { const x = r.range(-2200, 2200), z = r.range(-2080, -2350), y = Y + 2 + Math.max(0, (-z - 2080)) * r.range(0.05, 0.25); pts.push(x, y, z); const w = r.next(); cols.push(1, w < 0.7 ? 0.78 : 0.95, w < 0.7 ? 0.5 : 0.9); }
  for (let i = 0; i < 240; i++) { const s = r.next() < 0.5 ? -1 : 1, x = s * r.range(260, 900), z = r.range(-60, -1900); pts.push(x, Y + 2 + r.range(0, 30), z); cols.push(1, 0.8, 0.55); }
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); lg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  O.lights = new THREE.Points(lg, new THREE.PointsMaterial({ size: 3.2, sizeAttenuation: false, vertexColors: true, map: slDotTex(0.3), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  O.lights.frustumCulled = false; scene.add(O.lights);
  // their reflections in the harbour (the water is a dark mirror)
  const rp = pts.slice(); for (let i = 1; i < rp.length; i += 3) rp[i] = 2 * Y - rp[i];
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  O.lightsRefl = new THREE.Points(rg, new THREE.PointsMaterial({ size: 4.2, sizeAttenuation: false, vertexColors: true, map: slDotTex(0.2), transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  O.lightsRefl.frustumCulled = false; scene.add(O.lightsRefl);
  // the far town: blocks with lit windows; the hills behind it; the side shores
  const townTex = [slTex(slTownCanvas(1)), slTex(slTownCanvas(2)), slTex(slTownCanvas(3))];
  O.townMats = townTex.map((t) => new THREE.MeshStandardMaterial({ color: '#2a2b30', roughness: 0.9, emissive: new THREE.Color('#ffffff'), emissiveMap: t, emissiveIntensity: 0.0 }));
  const blk = new THREE.BoxGeometry(1, 1, 1);
  for (let i = 0; i < 260; i++) {
    const w = r.range(18, 60), h = r.range(10, 55), d = r.range(15, 40), x = r.range(-2100, 2100), z = r.range(-2060, -2260);
    const m = new THREE.Mesh(blk, O.townMats[i % 3]); m.scale.set(w, h, d); m.position.set(x, Y + h / 2 + Math.max(0, -z - 2060) * 0.12, z); scene.add(m);
  }
  for (const s of [-1, 1]) for (let i = 0; i < 60; i++) {
    const w = r.range(20, 50), h = r.range(12, 45), d = r.range(20, 50), x = s * r.range(240, 700), z = r.range(-80, -1700);
    const m = new THREE.Mesh(blk, O.townMats[i % 3]); m.scale.set(w, h, d); m.position.set(x, Y + h / 2, z); scene.add(m);
  }
  const hill = new THREE.Mesh(new THREE.CylinderGeometry(3200, 3200, 260, 96, 1, true, Math.PI * 0.62, Math.PI * 0.76), new THREE.MeshStandardMaterial({ color: '#1c2026', roughness: 1, side: THREE.BackSide }));
  hill.position.set(0, Y + 60, 900); scene.add(hill); O.hill = hill;
  { // the hills' ridge: a jagged top edge
    const p = hill.geometry.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) p.setY(i, p.getY(i) + (slF2(i * 0.37, 1.3) - 0.5) * 140 + 40 * Math.sin(i * 0.11)); hill.geometry.computeVertexNormals(); }
  O.puffs = slPuffs(scene, 9000, { additive: true, soft: 1.2 });
  O.flash = new THREE.PointLight('#ffffff', 0, 0, 0); O.flash.position.set(0, Y + 220, -2000); scene.add(O.flash);
  return O;
}

// 2-D value noise and fbm (seeded, smooth) — the hills' ridge
function slN2(x, z) {
  const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), w = fz * fz * (3 - 2 * fz);
  return slLerp(slLerp(hash2(i, j), hash2(i + 1, j), u), slLerp(hash2(i, j + 1), hash2(i + 1, j + 1), u), w);
}
function slF2(x, z, o = 4) { let s = 0, a = 0.5, f = 1; for (let k = 0; k < o; k++) { s += a * slN2(x * f + k * 17.3, z * f - k * 9.1); a *= 0.5; f *= 2.03; } return s / (1 - Math.pow(0.5, o)); }
