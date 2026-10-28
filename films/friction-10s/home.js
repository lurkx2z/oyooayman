/* =====================================================================
   HOME — your ground floor: an old terraced house on a hill, opened up into one long room (metres; the back wall's
   inside face is z = 0, the front wall's z = −8; the party walls are at x = ±2.4; y = 0 is your floor).
     kitchen (z 0 … −3.7)   an L of navy units (the sink under the back window, the oven under the left run), two wall
                            cabinets on the left wall, a larder at the end of the run, the island (dark stone top: the
                            mug, the sugar bowl, the fruit), two stools, the fridge by the back door
     dining  (z −3 … −4.6)  the table and four chairs, on the right
     living  (z −4.3 … −8)  the mustard sofa on the left under a shelf of books, the rug and the coffee table, the TV on
                            the right wall over the sideboard, the armchair, the lamp, the plant; the front window (its
                            cotton curtains) and the open front door, three steps down to the street
   What moves (story time s, physics.js): the loose furniture (fzLoose), the wall cabinets (their screws spin out), the
   TV (its wall plugs slide out), the shelf, the curtains (the cotton comes apart), the mug and its pieces, the phone,
   the sugar. Built once; update(s) poses it all (pure).
     fzBuildHome(S) → H
   ===================================================================== */

const FZ_H = {
  W: 2.4, ceil: 2.7, eaves: 6.0,
  bWin: [-1.5, -0.3, 1.05, 2.2],           // the back window over the sink: x0, x1, y0, y1
  bDoor: [0.55, 1.4, 0, 2.1],              // the back door (glazed top half)
  fWin: [-2.05, -0.55, 0.62, 2.38],        // the front window (the curtains)
  fWin2: [1.25, 2.05, 0.62, 2.38],
  door: [-0.2, 0.7, 0, 2.15],              // the front door (open)
  upWin: [[-1.95, -0.65], [0.65, 1.95]], upY: [3.45, 4.95],
  runD: 0.62, top: 0.92,                   // the units' depth and the worktop's height
  back: [-2.4, 0.4],                       // the back run (x)
  left: [-0.62, -3.1],                     // the left run (z)
  larder: [-3.1, -3.7],
  oven: [-2.0, -2.64],
  cab: [[-0.72, -1.88], [-1.92, -3.08]], cabY: [1.45, 2.17], cabD: 0.34,
  shelf: { z: [-4.55, -6.05], y: 1.62, d: 0.24 },
  tv: { x: 2.4, z: -5.0, y: 1.3, w: 1.25, h: 0.72, d: 0.05 },
  sugar: [0.2, FZ_ISLAND.top, -2.27],
  fruit: [0.22, FZ_ISLAND.top, -1.62],
};

// ---- canvases
function fzBrickCanvas(seed, base = [128, 74, 58], w = 512, h = 512, mortar = '#6b645a') {
  const r = new RNG(seed);
  return fzCanvas(w, h, (g) => {
    g.fillStyle = mortar; g.fillRect(0, 0, w, h);
    const bh = 16, bw = 46;
    for (let y = 0, row = 0; y < h; y += bh, row++) for (let x = row % 2 ? -bw / 2 : 0; x < w; x += bw) {
      const k = r.range(-20, 14), c = base.map((v) => MathX.clamp(v + k + r.range(-7, 7), 0, 255));
      g.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`; g.fillRect(x + 1.5, y + 1.5, bw - 3, bh - 3);
      if (r.next() < 0.25) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x + 1.5, y + bh - 5, bw - 3, 3.5); }
      if (r.next() < 0.15) { g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(x + 4, y + 3, bw - 12, 3); }
    }
  });
}
// oak floorboards running front to back (along v), 14 cm wide, butt joints staggered
function fzBoardsCanvas(seed, w = 512, h = 1024) {
  const r = new RNG(seed);
  return fzCanvas(w, h, (g) => {
    const bw = w / 4;
    for (let i = 0; i < 4; i++) {
      let y = -r.range(0, h);
      while (y < h) {
        const L = r.range(h * 0.45, h * 0.9), k = r.range(-16, 16), x = i * bw;
        const gr = g.createLinearGradient(x, 0, x + bw, 0);
        gr.addColorStop(0, `rgb(${150 + k},${108 + k},${70 + k * 0.7})`); gr.addColorStop(0.5, `rgb(${162 + k},${118 + k},${78 + k * 0.7})`); gr.addColorStop(1, `rgb(${146 + k},${104 + k},${68 + k * 0.7})`);
        g.fillStyle = gr; g.fillRect(x, y, bw, L);
        for (let j = 0; j < 26; j++) { g.fillStyle = `rgba(${r.next() < 0.5 ? '60,35,15' : '210,170,120'},${r.range(0.04, 0.12)})`; const gx = x + r.range(2, bw - 2); g.fillRect(gx, y, r.range(0.6, 1.8), L); }
        g.fillStyle = 'rgba(40,24,12,0.55)'; g.fillRect(x, y, bw, 2);
        y += L;
      }
      g.fillStyle = 'rgba(30,18,8,0.6)'; g.fillRect(i * bw, 0, 2, h);
    }
  });
}
// a kilim-ish rug: red ground, indigo and cream bands of diamonds, a border
function fzRugCanvas(seed, w = 512, h = 768) {
  const r = new RNG(seed);
  return fzCanvas(w, h, (g) => {
    g.fillStyle = '#8e2f24'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e8dcc2'; g.fillRect(14, 14, w - 28, h - 28); g.fillStyle = '#9a3528'; g.fillRect(26, 26, w - 52, h - 52);
    g.fillStyle = '#2b3550'; g.fillRect(40, 40, w - 80, h - 80); g.fillStyle = '#a63a2b'; g.fillRect(52, 52, w - 104, h - 104);
    for (let y = 90; y < h - 90; y += 120) {
      for (let x = 100; x < w - 60; x += 104) {
        g.fillStyle = (y / 120 | 0) % 2 ? '#e8dcc2' : '#2b3550';
        g.beginPath(); g.moveTo(x, y - 46); g.lineTo(x + 38, y); g.lineTo(x, y + 46); g.lineTo(x - 38, y); g.closePath(); g.fill();
        g.fillStyle = '#d29a3a'; g.beginPath(); g.moveTo(x, y - 18); g.lineTo(x + 15, y); g.lineTo(x, y + 18); g.lineTo(x - 15, y); g.closePath(); g.fill();
      }
    }
    const im = g.getImageData(0, 0, w, h), d = im.data;
    for (let i = 0; i < d.length; i += 4) { const n = (hash1(i * 0.37 + seed) - 0.5) * 26; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(im, 0, 0);
    for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(255,240,220,${r.range(0.02, 0.06)})`; g.fillRect(0, r.range(0, h), w, 1); }
  });
}
// linen-cotton curtain: off-white, a slub weave, a faint stripe
function fzLinenCanvas(seed, w = 256, h = 256) {
  return fzCanvas(w, h, (g) => {
    const im = g.createImageData(w, h), d = im.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = (hash2(x, y >> 1) - 0.5) * 0.06 + (hash2(x >> 2, y) - 0.5) * 0.05 + (x % 32 < 3 ? -0.04 : 0);
      const i = (y * w + x) * 4; d[i] = 236 * (1 + n); d[i + 1] = 228 * (1 + n); d[i + 2] = 212 * (1 + n); d[i + 3] = 255;
    }
    g.putImageData(im, 0, 0);
  });
}
// the curtains' dissolve map: noise, darker towards the top (the fabric fails from the top down)
function fzDissolveCanvas(seed, w = 128, h = 256) {
  return fzCanvas(w, h, (g) => {
    const im = g.createImageData(w, h), d = im.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = 0.55 * hash2(x >> 1, y >> 1) + 0.3 * hash2(x >> 3, y >> 3) + 0.15 * hash2(x >> 4, y >> 5);
      const v = MathX.clamp(0.08 + 0.55 * (y / h) + 0.37 * n, 0, 1) * 255;     // (canvas y down = the curtain's top)
      const i = (y * w + x) * 4; d[i] = d[i + 1] = d[i + 2] = 255 - v; d[i + 3] = 255;
    }
    g.putImageData(im, 0, 0);
  });
}
// white metro tiles (the splashback)
function fzTileCanvas(w = 256, h = 256) {
  return fzCanvas(w, h, (g) => {
    g.fillStyle = '#b9b4aa'; g.fillRect(0, 0, w, h);
    for (let y = 0, row = 0; y < h; y += 32, row++) for (let x = row % 2 ? -32 : 0; x < w; x += 64) {
      const gr = g.createLinearGradient(0, y, 0, y + 30); gr.addColorStop(0, '#f6f4ef'); gr.addColorStop(1, '#e4e1da');
      g.fillStyle = gr; g.fillRect(x + 1.5, y + 1.5, 61, 29);
    }
  });
}
// charcoal stone (the island top), with pale flecks
function fzStoneCanvas(seed, w = 512, h = 512) {
  const r = new RNG(seed);
  return fzCanvas(w, h, (g) => {
    g.fillStyle = '#2b2d30'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${r.next() < 0.7 ? '200,200,205' : '90,92,96'},${r.range(0.08, 0.35)})`; g.fillRect(r.range(0, w), r.range(0, h), r.range(0.6, 2.2), r.range(0.6, 2.2)); }
  });
}
// a book's spine colours
const FZ_BOOKC = ['#7a2e2a', '#2f4a6b', '#d9c9a3', '#3c5a3c', '#b8862e', '#1f2a36', '#a35a3a', '#e3ddd0', '#5b3c5e', '#2d2d2d'];

// a wall with rectangular holes: the cells left over (x0, x1, y0, y1) for boxes / planes
function fzWallCells(x0, x1, y0, y1, holes) {
  const xs = [x0, x1], ys = [y0, y1];
  for (const h of holes) { xs.push(h[0], h[1]); ys.push(h[2], h[3]); }
  const ux = [...new Set(xs)].filter((v) => v >= x0 && v <= x1).sort((a, b) => a - b), uy = [...new Set(ys)].filter((v) => v >= y0 && v <= y1).sort((a, b) => a - b);
  const cells = [];
  for (let i = 0; i < ux.length - 1; i++) for (let j = 0; j < uy.length - 1; j++) {
    const cx = (ux[i] + ux[i + 1]) / 2, cy = (uy[j] + uy[j + 1]) / 2;
    if (holes.some((h) => cx > h[0] && cx < h[1] && cy > h[2] && cy < h[3])) continue;
    cells.push([ux[i], ux[i + 1], uy[j], uy[j + 1]]);
  }
  // merge vertical runs (fewer boxes)
  const out = [];
  for (const c of cells) { const o = out.find((q) => q[0] === c[0] && q[1] === c[1] && q[3] === c[2]); if (o) o[3] = c[3]; else out.push(c.slice()); }
  return out;
}
// a plane at (x, y, z) facing direction f: '+x' '-x' '+z' '-z' '+y' '-y'
function fzPlane(w, h, m, x, y, z, f, parent) {
  const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  o.position.set(x, y, z);
  const R = { '+x': [0, Math.PI / 2, 0], '-x': [0, -Math.PI / 2, 0], '+z': [0, 0, 0], '-z': [0, Math.PI, 0], '+y': [-Math.PI / 2, 0, 0], '-y': [Math.PI / 2, 0, 0] }[f];
  o.rotation.set(R[0], R[1], R[2]); o.receiveShadow = true; o.castShadow = false;
  parent.add(o); return o;
}
// a sash window (outside face at z, facing f = ±1 along z): frame, two sashes with glazing bars, glass
function fzSash(parent, M, x0, x1, y0, y1, z, f, o = {}) {
  const w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, fr = 0.06;
  for (const [bx, by, bw, bh] of [[cx, y1 - fr / 2, w, fr], [cx, y0 + fr / 2, w, fr], [x0 + fr / 2, cy, fr, h], [x1 - fr / 2, cy, fr, h], [cx, cy, w, 0.05]]) fzBox(bw, bh, 0.1, M.frame, bx, by, z + f * 0.02, parent);
  const bars = o.bars ?? 1;
  for (let k = 1; k <= bars; k++) fzBox(0.025, h, 0.04, M.frame, x0 + (w * k) / (bars + 1), cy, z + f * 0.03, parent);
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.1, h - 0.1), M.glass); gl.position.set(cx, cy, z + f * 0.01); if (f < 0) gl.rotation.y = Math.PI; gl.renderOrder = 4; parent.add(gl);
  if (o.sill !== false) fzBox(w + 0.2, 0.08, 0.2, M.sill, cx, y0 - 0.04, z + f * 0.08, parent);
  return gl;
}

function fzBuildHome(S) {
  const scene = S.scene, H = { M: {} }, root = new THREE.Group(); root.name = 'home'; scene.add(root); H.root = root;
  const tex = (c, rx, ry) => { const t = fzTex(c); t.repeat.set(rx, ry); return t; };
  const M = H.M = {
    plaster: fzStd('#e9e3d8', 0.92), plasterK: fzStd('#ece6db', 0.92), ceil: fzStd('#f1ede6', 0.95),
    floor: fzStd('#ffffff', 0.55, 0, { map: tex(fzBoardsCanvas(11), 1.4, 1.2) }),
    brick: fzStd('#ffffff', 0.92, 0, { map: tex(fzBrickCanvas(21, [132, 72, 56]), 2.2, 1.6) }),
    brickIn: fzStd('#ffffff', 0.92, 0, { map: tex(fzBrickCanvas(22, [124, 70, 55]), 2, 1) }),
    navy: fzStd('#26344a', 0.55), navyD: fzStd('#1d2838', 0.6),
    oak: fzStd('#ffffff', 0.5, 0, { map: (() => { const t = fzTex(fzWoodCanvas(31, 256, 1024, [176, 128, 82])); t.rotation = Math.PI / 2; t.repeat.set(1, 3); return t; })() }),
    oakD: fzStd('#ffffff', 0.6, 0, { map: (() => { const t = fzTex(fzWoodCanvas(32, 256, 1024, [120, 82, 52])); t.repeat.set(1, 2); return t; })() }),
    stone: fzStd('#ffffff', 0.32, 0.05, { map: tex(fzStoneCanvas(41), 1.5, 1.5) }),
    tiles: fzStd('#ffffff', 0.3, 0, { map: tex(fzTileCanvas(), 6, 2) }),
    brass: fzStd('#c9a45a', 0.3, 0.9), steel: fzStd('#c4c8cc', 0.25, 0.85), black: fzStd('#16171a', 0.45, 0.2), white: fzStd('#f2f0ec', 0.35, 0.05),
    frame: fzStd('#f3f1ec', 0.45), sill: fzStd('#e2ddd2', 0.6), doorRed: fzStd('#7a1f24', 0.4), doorBack: fzStd('#e8e4dc', 0.45),
    glass: new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.08, roughness: 0.05, envMapIntensity: 0.6, depthWrite: false, side: THREE.DoubleSide }),
    mustard: fzStd('#c2912e', 0.88), mustardD: fzStd('#a97c26', 0.9), teal: fzStd('#3d6668', 0.88),
    rug: fzStd('#ffffff', 0.95, 0, { map: fzTex(fzRugCanvas(51), { repeat: false }) }),
    linen: fzStd('#ffffff', 0.95, 0, { map: tex(fzLinenCanvas(61), 3, 3), side: THREE.DoubleSide }),
    pot: fzStd('#b86a48', 0.8), leaf: fzStd('#3c6a36', 0.85, 0, { flatShading: true }), leafD: fzStd('#2c5129', 0.85, 0, { flatShading: true }),
    ceramic: fzStd('#f4f1ea', 0.25), mugBlue: fzStd('#2f5f8a', 0.3), coffee: fzStd('#3a2112', 0.15),
    screen: fzStd('#0b0c0e', 0.15, 0.3), sugar: fzStd('#fbfaf6', 0.6), apple: fzStd('#b2302a', 0.4), apple2: fzStd('#8fae3a', 0.45),
    fridge: fzStd('#dfe2e4', 0.3, 0.2), lampShade: fzStd('#efe6d2', 0.8, 0, { side: THREE.DoubleSide }), paper: fzStd('#e9e4d8', 0.85),
    shadow: new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.3, depthWrite: false }),
  };
  M.books = FZ_BOOKC.map((c) => fzStd(c, 0.8));
  const W = FZ_H.W, C = FZ_H.ceil, F = FZ_W.front;

  // ------------------------------------------------------------------ the shell
  const shell = new THREE.Group(); root.add(shell); H.shell = shell;
  fzPlane(2 * W, -F, M.floor, 0, 0, F / 2, '+y', shell);
  fzPlane(2 * W, -F, M.ceil, 0, C, F / 2, '-y', shell);
  // party walls (inside faces); the kitchen's bit of the left wall is plaster too
  fzPlane(-F, C, M.plaster, -W, C / 2, F / 2, '+x', shell);
  fzPlane(-F, C, M.plaster, W, C / 2, F / 2, '-x', shell);
  // the back wall: brick outside (z 0 … 0.3), plaster inside, the window and the back door
  const BW = FZ_H.bWin, BD = FZ_H.bDoor, holesB = [[BW[0], BW[1], BW[2], BW[3]], [BD[0], BD[1], BD[2], BD[3]]];
  for (const c of fzWallCells(-W - 0.2, W + 0.2, 0, FZ_H.eaves, holesB)) fzBox(c[1] - c[0], c[3] - c[2], 0.3, M.brick, (c[0] + c[1]) / 2, (c[2] + c[3]) / 2, 0.15, shell);
  for (const c of fzWallCells(-W, W, 0, C, holesB)) fzPlane(c[1] - c[0], c[3] - c[2], M.plasterK, (c[0] + c[1]) / 2, (c[2] + c[3]) / 2, -0.002, '-z', shell);
  fzSash(shell, M, BW[0], BW[1], BW[2], BW[3], 0.18, -1, { sill: false });
  fzBox(BW[1] - BW[0] + 0.04, 0.04, 0.24, M.sill, (BW[0] + BW[1]) / 2, BW[2] - 0.02, 0.06, shell);
  // the back door (glazed top half), shut
  {
    const g = new THREE.Group(); g.position.set((BD[0] + BD[1]) / 2, 0, 0.12); shell.add(g); const dw = BD[1] - BD[0] - 0.04;
    fzBox(dw, 1.0, 0.05, M.doorBack, 0, 0.5, 0, g); fzBox(dw, 0.12, 0.05, M.doorBack, 0, 2.03, 0, g);
    fzBox(0.12, 1.0, 0.05, M.doorBack, -dw / 2 + 0.06, 1.5, 0, g); fzBox(0.12, 1.0, 0.05, M.doorBack, dw / 2 - 0.06, 1.5, 0, g);
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(dw - 0.24, 0.96), M.glass); gl.position.set(0, 1.5, 0); gl.renderOrder = 4; g.add(gl);
    fzCyl(0.012, 0.012, 0.13, M.brass, dw / 2 - 0.1, 1.0, -0.06, g, 8).rotation.z = Math.PI / 2;
  }
  // the front wall (z −8 … −8.3): the window, the door (open), the small window; upstairs two sashes
  const FW = FZ_H.fWin, FW2 = FZ_H.fWin2, DR = FZ_H.door, zo = F - FZ_W.wallT;
  const holesF = [[FW[0], FW[1], FW[2], FW[3]], [FW2[0], FW2[1], FW2[2], FW2[3]], [DR[0], DR[1], DR[2], DR[3]], ...FZ_H.upWin.map((u) => [u[0], u[1], FZ_H.upY[0], FZ_H.upY[1]])];
  for (const c of fzWallCells(-W - 0.2, W + 0.2, -0.7, FZ_H.eaves, holesF)) fzBox(c[1] - c[0], c[3] - c[2], 0.3, M.brick, (c[0] + c[1]) / 2, (c[2] + c[3]) / 2, F - 0.15, shell);
  for (const c of fzWallCells(-W, W, 0, C, holesF.slice(0, 3))) fzPlane(c[1] - c[0], c[3] - c[2], M.plaster, (c[0] + c[1]) / 2, (c[2] + c[3]) / 2, F + 0.002, '+z', shell);
  H.fGlass = fzSash(shell, M, FW[0], FW[1], FW[2], FW[3], zo + 0.08, -1, { bars: 2 });
  fzSash(shell, M, FW2[0], FW2[1], FW2[2], FW2[3], zo + 0.08, -1);
  for (const u of FZ_H.upWin) fzSash(shell, M, u[0], u[1], FZ_H.upY[0], FZ_H.upY[1], zo + 0.08, -1);
  // the window reveals (inside), the lintels (outside: stone)
  for (const h of [FW, FW2]) {
    fzBox(h[1] - h[0] + 0.02, 0.03, 0.3, M.sill, (h[0] + h[1]) / 2, h[2] - 0.015, F - 0.15, shell);
    fzBox(h[1] - h[0] + 0.3, 0.2, 0.06, M.sill, (h[0] + h[1]) / 2, h[3] + 0.1, zo - 0.03, shell);
  }
  for (const u of FZ_H.upWin) fzBox(u[1] - u[0] + 0.3, 0.2, 0.06, M.sill, (u[0] + u[1]) / 2, FZ_H.upY[1] + 0.1, zo - 0.03, shell);
  fzBox(DR[1] - DR[0] + 0.3, 0.22, 0.06, M.sill, (DR[0] + DR[1]) / 2, DR[3] + 0.11, zo - 0.03, shell);
  // the front door: open into the room against its hinge (x 0.7), a brass knocker; the fanlight over it
  {
    const g = H.frontDoor = new THREE.Group(); g.position.set(DR[1] - 0.03, 0, F + 0.02); g.rotation.y = 1.62; shell.add(g);
    const dw = DR[1] - DR[0] - 0.04, dh = DR[3] - 0.02;
    fzBox(dw, dh, 0.05, M.doorRed, -dw / 2, dh / 2, 0, g);
    for (const [px, py] of [[-dw * 0.28, 0.55], [-dw * 0.72, 0.55], [-dw * 0.28, 1.45], [-dw * 0.72, 1.45]]) fzBox(dw * 0.34, 0.6, 0.012, M.doorRed, px, py, -0.03, g);
    fzMesh(new THREE.TorusGeometry(0.05, 0.01, 6, 16), M.brass, -dw * 0.5, 1.5, -0.04, g);
    fzCyl(0.012, 0.012, 0.13, M.brass, -dw + 0.08, 1.0, 0.05, g, 8).rotation.z = Math.PI / 2;
  }
  // (the hall floor runs out of the door: a threshold; outside, three steps down, the tiled path, the low wall)
  fzBox(DR[1] - DR[0], 0.04, 0.3, M.sill, (DR[0] + DR[1]) / 2, -0.02, F - 0.15, shell);
  const ST = FZ_STEPS;
  for (let k = 0; k < ST.n; k++) fzBox(DR[1] - DR[0] + 0.5, 0.18, ST.run + 0.02, M.sill, (DR[0] + DR[1]) / 2, -(k + 1) * ST.rise + 0.09 - 0.02, zo - (k + 0.5) * ST.run, shell);
  // the inside skirting (a dark line where walls meet the floor reads the space)
  for (const [w, x, z, ry] of [[-F, -W + 0.006, F / 2, Math.PI / 2], [-F, W - 0.006, F / 2, -Math.PI / 2]]) { const b = fzBox(w, 0.12, 0.012, M.white, x, 0.06, z, shell); b.rotation.y = ry; }
  // the ceiling's spotlights
  for (const [x, z] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, -2.6], [1.2, -2.6], [0, -3.8], [-1.2, -5.4], [1.2, -5.4], [0, -6.8]]) fzCyl(0.04, 0.04, 0.01, M.white, x, C - 0.005, z, shell, 12);

  // ------------------------------------------------------------------ the kitchen
  const K = new THREE.Group(); root.add(K); H.kitchen = K;
  const T = FZ_H.top, RD = FZ_H.runD;
  // the back run: carcass, plinth, doors, worktop, the sink, the hob and its hood
  fzBox(FZ_H.back[1] - FZ_H.back[0], T - 0.04 - 0.1, RD - 0.02, M.navy, (FZ_H.back[0] + FZ_H.back[1]) / 2, 0.1 + (T - 0.14) / 2, -RD / 2, K);
  fzBox(FZ_H.back[1] - FZ_H.back[0], 0.1, RD - 0.08, M.black, (FZ_H.back[0] + FZ_H.back[1]) / 2, 0.05, -RD / 2 + 0.03, K);
  for (let x = FZ_H.back[0] + 0.62; x < FZ_H.back[1] - 0.1; x += 0.6) { fzBox(0.008, T - 0.2, 0.01, M.navyD, x, 0.1 + (T - 0.14) / 2, -RD + 0.005, K); fzBox(0.12, 0.012, 0.025, M.brass, x - 0.3, T - 0.12, -RD - 0.005, K); }
  fzBox(FZ_H.back[1] - FZ_H.back[0] + 0.02, 0.04, RD + 0.04, M.oak, (FZ_H.back[0] + FZ_H.back[1]) / 2, T - 0.02, -RD / 2 - 0.02, K);
  fzBox(FZ_H.back[1] - FZ_H.back[0], 0.6, 0.01, M.tiles, (FZ_H.back[0] + FZ_H.back[1]) / 2, T + 0.3, -0.006, K);
  fzBox(0.62, 0.012, 0.42, M.steel, (BW[0] + BW[1]) / 2, T + 0.002, -0.3, K);
  fzCyl(0.016, 0.016, 0.3, M.steel, (BW[0] + BW[1]) / 2, T + 0.15, -0.06, K, 10);
  fzCyl(0.013, 0.013, 0.18, M.steel, (BW[0] + BW[1]) / 2, T + 0.29, -0.14, K, 10).rotation.x = Math.PI / 2;
  fzBox(0.6, 0.012, 0.52, M.black, -2.02, T + 0.006, -0.3, K);
  for (const [dx, dz] of [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.12], [0.14, 0.12]]) fzCyl(0.07, 0.07, 0.004, M.navyD, -2.02 + dx, T + 0.014, -0.3 + dz, K, 16);
  fzBox(0.62, 0.12, 0.45, M.steel, -2.02, 1.72, -0.24, K); fzBox(0.22, 0.86, 0.22, M.steel, -2.02, 2.21, -0.12, K);
  // the kettle, a toaster, a tin, the knife block
  fzCyl(0.08, 0.095, 0.22, M.steel, -1.6, T + 0.11, -0.28, K, 18); fzBox(0.27, 0.19, 0.16, M.white, 0.05, T + 0.095, -0.25, K);
  fzBox(0.1, 0.24, 0.15, M.oakD, -0.05 + 0.25, T + 0.12, -0.18, K);
  // the left run (along the left wall): carcass, doors, the oven (its handle bar: where your hand hooks), the worktop
  const LZ = FZ_H.left, lx = -W + RD / 2;
  fzBox(RD - 0.02, T - 0.14, LZ[0] - LZ[1], M.navy, lx, 0.1 + (T - 0.14) / 2, (LZ[0] + LZ[1]) / 2, K);
  fzBox(RD - 0.08, 0.1, LZ[0] - LZ[1], M.black, lx - 0.03, 0.05, (LZ[0] + LZ[1]) / 2, K);
  fzBox(RD + 0.04, 0.04, LZ[0] - LZ[1] + RD, M.oak, lx + 0.02, T - 0.02, (LZ[0] + LZ[1] - RD) / 2 + RD / 2 - 0.3, K);
  const OV = FZ_H.oven;
  fzBox(0.02, 0.62, OV[0] - OV[1] - 0.02, M.black, -W + RD + 0.006, 0.5, (OV[0] + OV[1]) / 2, K);
  fzBox(0.012, 0.3, OV[0] - OV[1] - 0.16, fzStd('#22252a', 0.1, 0.4), -W + RD + 0.018, 0.48, (OV[0] + OV[1]) / 2, K);
  { const h = fzCyl(0.011, 0.011, FZ_OVEN.z[0] - FZ_OVEN.z[1] + 0.08, M.steel, FZ_OVEN.x, FZ_OVEN.y, (FZ_OVEN.z[0] + FZ_OVEN.z[1]) / 2, K, 10); h.rotation.x = Math.PI / 2;
    for (const z of FZ_OVEN.z) fzBox(0.04, 0.016, 0.016, M.steel, FZ_OVEN.x - 0.02, FZ_OVEN.y, z, K); }
  fzBox(0.012, 0.1, OV[0] - OV[1] - 0.02, M.black, -W + RD + 0.008, 0.88 - 0.07, (OV[0] + OV[1]) / 2, K);
  for (let z = LZ[0] - 0.6; z > LZ[1]; z -= 0.6) if (z > OV[0] + 0.02 || z < OV[1] - 0.6) fzBox(0.01, T - 0.2, 0.008, M.navyD, -W + RD + 0.005, 0.1 + (T - 0.14) / 2, z, K);
  fzBox(0.01, 0.6, LZ[0] - LZ[1], M.tiles, -W + 0.006, T + 0.3, (LZ[0] + LZ[1]) / 2, K);
  // the larder at the run's end (full height, screwed to the wall in shear: it stays)
  const LA = FZ_H.larder;
  fzBox(RD, 2.25, LA[0] - LA[1], M.navy, lx, 1.125, (LA[0] + LA[1]) / 2, K);
  fzBox(0.012, 2.1, 0.008, M.navyD, -W + RD + 0.005, 1.12, (LA[0] + LA[1]) / 2, K);
  for (const sz of [-1, 1]) fzBox(0.025, 0.14, 0.012, M.brass, -W + RD + 0.012, 1.1, (LA[0] + LA[1]) / 2 + sz * 0.05, K);
  // the island: carcass, the dark stone top (overhanging on the stools' side)
  const IS = FZ_ISLAND;
  fzBox(0.85, IS.top - 0.04 - 0.1, (IS.z[0] - IS.z[1]) - 0.1, M.navy, -0.075, 0.1 + (IS.top - 0.14) / 2, (IS.z[0] + IS.z[1]) / 2, K);
  fzBox(0.79, 0.1, (IS.z[0] - IS.z[1]) - 0.16, M.black, -0.075, 0.05, (IS.z[0] + IS.z[1]) / 2, K);
  fzBox(IS.x[1] - IS.x[0], 0.04, IS.z[0] - IS.z[1], M.stone, 0, IS.top - 0.02, (IS.z[0] + IS.z[1]) / 2, K);
  for (const z of [-1.75, -2.25]) fzBox(0.008, 0.68, 0.48, M.navyD, -0.505, 0.47, z, K);
  for (const z of [-1.75, -2.25]) fzBox(0.012, 0.025, 0.12, M.brass, -0.51, 0.76, z, K);
  // the fruit bowl
  const fr = FZ_H.fruit;
  fzMesh(new THREE.SphereGeometry(0.13, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), fzStd('#d8d0c0', 0.5, 0, { side: THREE.DoubleSide }), fr[0], fr[1] + 0.13, fr[2], K).scale.y = 0.55;
  for (const [dx, dz, dy, m] of [[-0.05, 0.02, 0.06, M.apple], [0.05, -0.03, 0.06, M.apple2], [0.0, 0.06, 0.07, M.apple], [0.02, -0.01, 0.12, M.apple2]]) fzMesh(new THREE.SphereGeometry(0.04, 14, 10), m, fr[0] + dx, fr[1] + dy, fr[2] + dz, K);
  // the wall cabinets (2): built as groups pivoting about their bottom-back edge (they fall: update)
  H.cabs = FZ_H.cab.map((cz, i) => {
    const g = new THREE.Group(), L = cz[0] - cz[1], h = FZ_H.cabY[1] - FZ_H.cabY[0], d = FZ_H.cabD;
    g.position.set(-W, FZ_H.cabY[0], (cz[0] + cz[1]) / 2); K.add(g);       // origin: the bottom-back edge's middle
    // the carcass (open at the front: the doors close it)
    fzBox(d, 0.018, L, M.navy, d / 2, 0.009, 0, g); fzBox(d, 0.018, L, M.navy, d / 2, h - 0.009, 0, g);
    fzBox(0.012, h, L, M.navy, 0.006, h / 2, 0, g);
    for (const sz of [-1, 1]) fzBox(d, h, 0.018, M.navy, d / 2, h / 2, sz * (L / 2 - 0.009), g);
    fzBox(d - 0.04, 0.012, L - 0.04, M.navy, d / 2, h * 0.5, 0, g);
    // its plates and glasses (fly out: update)
    const plates = [];
    for (let k = 0; k < 6; k++) { const p = fzCyl(0.12, 0.09, 0.016, M.ceramic, d / 2 + 0.01, 0.03 + 0.017 * k, -L / 4, g, 22); plates.push({ m: p, base: p.position.clone(), k }); }
    const glasses = [];
    for (let k = 0; k < 4; k++) { const q = fzCyl(0.035, 0.03, 0.12, M.glass, d / 2, h * 0.5 + 0.07, L / 4 + (k - 1.5) * 0.09, g, 12); glasses.push(q); }
    // the doors: hinged on the carcass's outer ends (they swing open when it lands)
    const doors = [-1, 1].map((sz) => {
      const dg = new THREE.Group(); dg.position.set(d + 0.01, 0, sz * L / 2); g.add(dg);
      fzBox(0.02, h, L / 2 - 0.006, M.navy, 0, h / 2, -sz * (L / 4), dg);
      fzBox(0.024, 0.13, 0.012, M.brass, 0.014, 0.12, -sz * (L / 2 - 0.06), dg);
      return { g: dg, sz };
    });
    // the screws: 3 through the carcass's back near the top, into the wall (heads inside: the close-up sees them
    // through the open top: the carcass has no back at the top 4 cm (the hanging rail)
    const screws = [-0.38, 0, 0.38].map((u) => {
      const sg = new THREE.Group(); sg.position.set(0.012, h - 0.05, u * L); g.add(sg);
      const head = fzCyl(0.0065, 0.0065, 0.0035, M.steel, 0, 0, 0, sg, 16); head.rotation.z = Math.PI / 2; head.position.x = 0.0018;
      for (const r of [0, Math.PI / 2]) { const sl = fzBox(0.002, 0.0095, 0.0016, M.black, 0.0037, 0, 0, sg); sl.rotation.x = r; }
      const shank = fzCyl(0.0022, 0.0022, 0.045, M.steel, -0.0225, 0, 0, sg, 10); shank.rotation.z = Math.PI / 2;
      return { g: sg, u };
    });
    return { g, i, L, h, d, cz, plates, glasses, doors, screws, z0: (cz[0] + cz[1]) / 2 };
  });
  // plate shards (a pool: 12 plates × 4 pieces) and the stools, the fridge, the bin (loose: update)
  H.plateShards = []; for (let i = 0; i < 48; i++) { const m = fzMesh(new THREE.CylinderGeometry(0.034, 0.03, 0.006, 3 + (i % 3)), M.ceramic, 0, -5, 0, K); m.visible = false; H.plateShards.push(m); }
  H.loose = {};
  const looseG = (id) => { const it = FZ_LOOSE_ID[id], g = new THREE.Group(); g.position.set((it.x[0] + it.x[1]) / 2, 0, (it.z[0] + it.z[1]) / 2); root.add(g); H.loose[id] = { g, it, z0: g.position.z }; return g; };
  for (const id of ['stool1', 'stool2']) {
    const g = looseG(id);
    fzCyl(0.17, 0.17, 0.05, M.oakD, 0, 0.73, 0, g, 20);
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4, l = fzCyl(0.014, 0.018, 0.72, M.black, Math.cos(a) * 0.12, 0.36, Math.sin(a) * 0.12, g, 8); l.rotation.set(Math.sin(a) * 0.09, 0, -Math.cos(a) * 0.09); }
    const ring = fzMesh(new THREE.TorusGeometry(0.12, 0.008, 6, 20), M.black, 0, 0.26, 0, g); ring.rotation.x = Math.PI / 2;
  }
  { const g = looseG('fridge'), it = FZ_LOOSE_ID.fridge, w = it.x[1] - it.x[0], d = it.z[0] - it.z[1];
    fzBox(w, it.h, d, M.fridge, 0, it.h / 2, 0, g); fzBox(w - 0.02, 0.006, 0.01, M.black, 0, 1.18, -d / 2 - 0.002, g);
    fzBox(0.025, 0.5, 0.03, M.steel, -w / 2 + 0.06, 1.45, -d / 2 - 0.02, g); fzBox(0.025, 0.36, 0.03, M.steel, -w / 2 + 0.06, 0.92, -d / 2 - 0.02, g);
    for (const [mx, my, mc] of [[0.1, 1.55, '#d24a3a'], [0.18, 1.4, '#3a7ad2'], [0.02, 1.32, '#e8c43a']]) fzBox(0.05, 0.05, 0.008, fzStd(mc, 0.5), mx, my, -d / 2 - 0.005, g);
    fzBox(0.12, 0.16, 0.003, M.paper, 0.12, 1.66, -d / 2 - 0.004, g); }
  { const g = looseG('bin'), it = FZ_LOOSE_ID.bin; fzCyl(0.16, 0.15, it.h, M.steel, 0, it.h / 2, 0, g, 22); fzCyl(0.165, 0.165, 0.03, M.black, 0, it.h + 0.01, 0, g, 22); }

  // ------------------------------------------------------------------ dining
  { const g = looseG('table'), it = FZ_LOOSE_ID.table, tz = (-3.35 - 4.25) / 2 - g.position.z;
    fzBox(1.6, 0.04, 0.9, M.oakD, 0, 0.73, tz, g);
    for (const [lx2, lz] of [[-0.74, -0.38], [0.74, -0.38], [-0.74, 0.38], [0.74, 0.38]]) fzBox(0.05, 0.71, 0.05, M.oakD, lx2, 0.355, tz + lz, g);
    // a newspaper, a vase of tulips
    fzBox(0.42, 0.006, 0.3, M.paper, -0.35, 0.755, tz + 0.1, g).rotation.y = 0.2;
    fzCyl(0.05, 0.04, 0.2, fzStd('#9fb7c4', 0.15, 0, { transparent: true, opacity: 0.7 }), 0.35, 0.85, tz, g, 14);
    for (let k = 0; k < 5; k++) { const a = k * 1.26; fzMesh(new THREE.SphereGeometry(0.025, 8, 6), fzStd(k % 2 ? '#d84a3a' : '#e8a43a', 0.6), 0.35 + Math.cos(a) * 0.04, 1.06 + 0.02 * (k % 2), tz + Math.sin(a) * 0.04, g).scale.y = 1.4; } }
  for (const id of ['chair1', 'chair2', 'chair3', 'chair4']) {
    const it = FZ_LOOSE_ID[id], g = new THREE.Group(), back = id === 'chair1' || id === 'chair2' ? 1 : -1;   // (their backs away from the table)
    g.position.set((it.x[0] + it.x[1]) / 2, 0, (it.z[0] + it.z[1]) / 2); root.add(g); H.loose[id] = { g, it, z0: g.position.z };
    fzBox(0.42, 0.035, 0.42, M.oakD, 0, 0.45, 0, g);
    for (const [cx, cz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) fzBox(0.03, 0.45, 0.03, M.oakD, cx, 0.225, cz, g);
    for (const sx of [-0.18, 0.18]) fzBox(0.03, 0.45, 0.03, M.oakD, sx, 0.68, back * 0.19, g);
    fzBox(0.4, 0.1, 0.025, M.oakD, 0, 0.85, back * 0.19, g);
  }

  // ------------------------------------------------------------------ living room
  { const g = looseG('sofa'), it = FZ_LOOSE_ID.sofa, L = it.z[0] - it.z[1], D = it.x[1] - it.x[0];
    fzMesh(fzRoundBox(D, 0.42, L, 0.05, 0.03), M.mustardD, 0, 0.06, 0, g);
    fzMesh(fzRoundBox(0.22, 0.48, L, 0.06, 0.04), M.mustard, -D / 2 + 0.11, 0.42, 0, g);
    for (const sz of [-1, 1]) fzMesh(fzRoundBox(D, 0.26, 0.2, 0.06, 0.04), M.mustard, 0, 0.42, sz * (L / 2 - 0.1), g);
    for (const k of [-1, 1]) fzMesh(fzRoundBox(D - 0.3, 0.14, L / 2 - 0.22, 0.05, 0.04), M.mustard, 0.08, 0.46, k * (L / 4 - 0.05), g);
    for (const k of [-1, 1]) { const c = fzMesh(fzRoundBox(0.16, 0.42, 0.42, 0.08, 0.05), k > 0 ? M.teal : fzStd('#d8cdb8', 0.9), -D / 2 + 0.3, 0.56, k * 0.45, g); c.rotation.z = -0.25; }
    for (const [fx, fz] of [[-D / 2 + 0.06, -L / 2 + 0.06], [D / 2 - 0.06, -L / 2 + 0.06], [-D / 2 + 0.06, L / 2 - 0.06], [D / 2 - 0.06, L / 2 - 0.06]]) fzCyl(0.02, 0.015, 0.06, M.oakD, fx, 0.03, fz, g, 8); }
  { const g = looseG('rug'), it = FZ_LOOSE_ID.rug; fzMesh(new THREE.BoxGeometry(it.x[1] - it.x[0], 0.008, it.z[0] - it.z[1]), M.rug, 0, 0.004, 0, g).castShadow = false; }
  { const g = looseG('ctable'), it = FZ_LOOSE_ID.ctable, w = it.x[1] - it.x[0], d = it.z[0] - it.z[1];
    g.position.y = 0.008;
    fzBox(w, 0.04, d, M.oakD, 0, 0.4, 0, g);
    for (const [cx, cz] of [[-w / 2 + 0.04, -d / 2 + 0.04], [w / 2 - 0.04, -d / 2 + 0.04], [-w / 2 + 0.04, d / 2 - 0.04], [w / 2 - 0.04, d / 2 - 0.04]]) fzBox(0.035, 0.38, 0.035, M.oakD, cx, 0.19, cz, g);
    fzBox(0.24, 0.035, 0.3, M.books[1], -0.12, 0.437, 0.1, g); fzBox(0.22, 0.03, 0.28, M.books[2], -0.12, 0.47, 0.1, g).rotation.y = 0.15;
    fzCyl(0.06, 0.05, 0.1, M.pot, 0.15, 0.47, -0.18, g, 14); fzMesh(new THREE.IcosahedronGeometry(0.08, 1), M.leaf, 0.15, 0.57, -0.18, g); }
  { const g = looseG('armchair'), it = FZ_LOOSE_ID.armchair, w = it.x[1] - it.x[0], d = it.z[0] - it.z[1];
    g.rotation.y = 0.35;                                                         // (angled towards the room)
    fzMesh(fzRoundBox(w, 0.4, d, 0.05, 0.03), M.teal, 0, 0.08, 0, g);
    fzMesh(fzRoundBox(0.2, 0.5, d, 0.06, 0.04), M.teal, w / 2 - 0.1, 0.42, 0, g);
    for (const sz of [-1, 1]) fzMesh(fzRoundBox(w, 0.24, 0.16, 0.06, 0.04), M.teal, 0, 0.42, sz * (d / 2 - 0.08), g);
    for (const [fx, fz] of [[-w / 2 + 0.06, -d / 2 + 0.06], [w / 2 - 0.06, -d / 2 + 0.06], [-w / 2 + 0.06, d / 2 - 0.06], [w / 2 - 0.06, d / 2 - 0.06]]) fzCyl(0.018, 0.014, 0.08, M.oakD, fx, 0.04, fz, g, 8); }
  { const g = looseG('lamp');
    fzCyl(0.15, 0.15, 0.03, M.black, 0, 0.015, 0, g, 20); fzCyl(0.012, 0.012, 1.42, M.brass, 0, 0.74, 0, g, 8);
    fzMesh(new THREE.CylinderGeometry(0.13, 0.2, 0.26, 24, 1, true), M.lampShade, 0, 1.5, 0, g); }
  { const g = looseG('plant');
    fzCyl(0.16, 0.12, 0.34, M.pot, 0, 0.17, 0, g, 18);
    for (let k = 0; k < 9; k++) { const a = k * 2.4, y = 0.45 + k * 0.07; const l = fzMesh(new THREE.IcosahedronGeometry(0.12, 0), k % 2 ? M.leaf : M.leafD, Math.cos(a) * 0.12, y, Math.sin(a) * 0.12, g); l.scale.set(1, 0.35, 1.5); l.rotation.set(0.4, a, 0.3); }
    fzCyl(0.012, 0.016, 0.6, fzStd('#4a3a2a', 0.9), 0, 0.6, 0, g, 6); }
  { const g = looseG('side'), it = FZ_LOOSE_ID.side, w = it.x[1] - it.x[0], d = it.z[0] - it.z[1];
    fzBox(w, it.h - 0.1, d, M.oakD, 0, 0.1 + (it.h - 0.1) / 2, 0, g);
    for (const z of [-d / 4, d / 4]) fzBox(0.006, it.h - 0.18, d / 2 - 0.02, fzStd('#7a5434', 0.6), -w / 2 - 0.003, 0.1 + (it.h - 0.1) / 2, z, g);
    for (const [fz] of [[-d / 2 + 0.05], [d / 2 - 0.05]]) for (const fx of [-w / 2 + 0.04, w / 2 - 0.04]) fzCyl(0.015, 0.012, 0.1, M.black, fx, 0.05, fz, g, 8);
    // (a speaker and a bowl of keys on it)
    fzBox(0.12, 0.2, 0.12, M.black, 0, it.h + 0.1, -d / 2 + 0.15, g);
    fzMesh(new THREE.SphereGeometry(0.08, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.ceramic, 0, it.h + 0.045, d / 2 - 0.2, g).scale.y = 0.5; }
  // the shelf of books over the sofa (two brackets on wall plugs): falls onto the sofa (update)
  { const SH = FZ_H.shelf, g = new THREE.Group(); g.position.set(-W, SH.y, (SH.z[0] + SH.z[1]) / 2); root.add(g);
    const L = SH.z[0] - SH.z[1]; fzBox(SH.d, 0.03, L, M.oakD, SH.d / 2, 0, 0, g);
    for (const z of [-L / 2 + 0.2, L / 2 - 0.2]) { fzBox(0.012, 0.16, 0.025, M.black, 0.006, -0.08, z, g); fzBox(0.18, 0.012, 0.025, M.black, 0.09, -0.02, z, g); }
    const books = [], br = new RNG(71); let z = -L / 2 + 0.08;
    while (z < L / 2 - 0.25) { const t = br.range(0.025, 0.05), h = br.range(0.18, 0.27), dp = br.range(0.13, 0.18), m = M.books[br.int(0, M.books.length - 1)];
      const b = fzBox(dp, h, t, m, dp / 2 + 0.02, 0.015 + h / 2, z + t / 2, g); books.push({ m: b, base: b.position.clone(), h, i: books.length }); z += t + 0.003; }
    const pp = fzCyl(0.05, 0.04, 0.09, M.pot, 0.1, 0.06, L / 2 - 0.12, g, 12); fzMesh(new THREE.IcosahedronGeometry(0.07, 1), M.leaf, 0, 0.08, 0, pp);
    H.shelf = { g, books, plant: pp, L }; }
  // the TV on its bracket (4 wall plugs): falls onto the sideboard and off it, face down (update)
  { const TV = FZ_H.tv, g = new THREE.Group(); root.add(g);
    // (origin: the TV's bottom edge middle, at the wall; the screen faces −x)
    const body = new THREE.Group(); g.add(body);
    fzBox(TV.d, TV.h, TV.w, M.black, -0.09 - TV.d / 2, TV.h / 2, 0, body);
    fzBox(0.004, TV.h - 0.03, TV.w - 0.03, M.screen, -0.09 - TV.d - 0.002, TV.h / 2, 0, body);
    fzBox(0.07, 0.3, 0.4, M.black, -0.04, TV.h / 2, 0, body);
    const plate = fzBox(0.012, 0.36, 0.42, M.black, -0.006, TV.h / 2, 0, body);
    const plugs = [[-0.13, -0.16], [-0.13, 0.16], [0.13, -0.16], [0.13, 0.16]].map(([dy, dz]) => {
      const pg = new THREE.Group(); pg.position.set(0, TV.h / 2 + dy, dz); body.add(pg);
      const sh = fzCyl(0.004, 0.004, 0.05, fzStd('#e8e2d0', 0.6), 0.025, 0, 0, pg, 8); sh.rotation.z = Math.PI / 2;     // (the plug, in the wall)
      const hd = fzCyl(0.007, 0.007, 0.004, M.steel, -0.014, 0, 0, pg, 12); hd.rotation.z = Math.PI / 2;
      return pg;
    });
    H.tv = { g, body, plugs, plate };
    // the cable hanging below it
    H.tvCable = fzCyl(0.004, 0.004, 0.75, M.black, TV.x - 0.03, TV.y - TV.h / 2 - 0.37, TV.z + 0.3, root, 6); }
  // the curtains: two panels on a pole over the front window (pleated; they come apart: update)
  { const FWc = FZ_H.fWin, poleY = FWc[3] + 0.16, z = F + 0.12;
    fzCyl(0.018, 0.018, FWc[1] - FWc[0] + 0.5, M.oakD, (FWc[0] + FWc[1]) / 2, poleY, z, root, 10).rotation.z = Math.PI / 2;
    for (const sx of [FWc[0] - 0.27, FWc[1] + 0.27]) fzMesh(new THREE.SphereGeometry(0.03, 10, 8), M.oakD, sx, poleY, z, root);
    const dis = fzTex(fzDissolveCanvas(81), { repeat: false });
    H.curtains = [[FWc[0] - 0.15, FWc[0] + 0.55], [FWc[1] - 0.55, FWc[1] + 0.15]].map(([x0, x1], i) => {
      const w = x1 - x0, h = poleY - 0.05, geo = new THREE.PlaneGeometry(w, h, 24, 30), P = geo.attributes.position;
      for (let k = 0; k < P.count; k++) { const u = (P.getX(k) + w / 2) / w; P.setZ(k, 0.045 * Math.sin(u * Math.PI * 9) + 0.012 * Math.sin(u * Math.PI * 23 + i)); }
      geo.computeVertexNormals(); geo.translate(0, -h / 2, 0);
      const mat = M.linen.clone(); mat.alphaMap = dis; mat.alphaTest = 0.0; mat.transparent = false;
      const m = fzMesh(geo, mat, (x0 + x1) / 2, poleY - 0.03, z, root); m.castShadow = true;
      for (let k = 0; k < 7; k++) fzMesh(new THREE.TorusGeometry(0.03, 0.005, 6, 12), M.brass, x0 + (k + 0.5) * w / 7, poleY, z, root);
      return { m, mat, x0, x1, h, top: poleY - 0.03 };
    }); }
  // pictures on the walls (hung on wire over nails: they stay)
  for (const [x, y, z, w, h, f, c] of [[-W + 0.015, 1.55, -3.6, 0.5, 0.36, '+x', '#3c5a7a'], [W - 0.015, 1.65, -2.9, 0.42, 0.56, '-x', '#b8862e'], [W - 0.015, 1.6, -7.0, 0.36, 0.46, '-x', '#7a2e2a']]) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = f === '+x' ? Math.PI / 2 : -Math.PI / 2; root.add(g);
    fzBox(w + 0.05, h + 0.05, 0.03, M.black, 0, 0, 0, g);
    const can = fzCanvas(128, 128, (q) => { const gr = q.createLinearGradient(0, 0, 128, 128); gr.addColorStop(0, c); gr.addColorStop(1, '#e8e0d0'); q.fillStyle = gr; q.fillRect(0, 0, 128, 128); q.fillStyle = 'rgba(255,255,255,0.35)'; q.beginPath(); q.arc(80, 50, 22, 0, 6.28); q.fill(); q.fillStyle = 'rgba(20,20,30,0.35)'; q.fillRect(0, 86, 128, 42); });
    fzMesh(new THREE.PlaneGeometry(w - 0.04, h - 0.04), fzStd('#ffffff', 0.6, 0, { map: fzTex(can, { repeat: false }) }), 0, 0, 0.017, g);
  }

  // ------------------------------------------------------------------ the island's things: the mug, the sugar
  { const g = H.mug = new THREE.Group(); root.add(g);
    fzMesh(new THREE.CylinderGeometry(0.042, 0.04, 0.095, 22, 1, true), fzStd('#2f5f8a', 0.3, 0, { side: THREE.DoubleSide }), 0, 0.0475, 0, g);
    fzCyl(0.04, 0.04, 0.006, M.mugBlue, 0, 0.003, 0, g, 22);
    fzCyl(0.038, 0.038, 0.004, M.coffee, 0, 0.078, 0, g, 22);
    const hd = fzMesh(new THREE.TorusGeometry(0.026, 0.007, 8, 16, Math.PI), M.mugBlue, 0.042, 0.05, 0, g); hd.rotation.z = -Math.PI / 2;
    H.shards = FZ_MUG.shards.map((sh, i) => { const m = fzMesh(new THREE.CylinderGeometry(sh.size, sh.size * 0.8, 0.006 + sh.size * 0.3, 3 + (i % 2)), i % 3 ? M.mugBlue : M.ceramic, 0, -5, 0, root); m.visible = false; return m; });
    H.puddle = fzMesh(new THREE.CircleGeometry(1, 28), fzStd('#2a160b', 0.08, 0.1, { transparent: true, opacity: 0.85, depthWrite: false }), 0, 0.003, 0, root); H.puddle.rotation.x = -Math.PI / 2; H.puddle.visible = false; H.puddle.castShadow = false; }
  { const sg = FZ_H.sugar, g = H.sugarBowl = new THREE.Group(); g.position.set(sg[0], sg[1], sg[2]); root.add(g);
    fzMesh(new THREE.CylinderGeometry(0.06, 0.04, 0.07, 20, 1, true), fzStd('#e9e4da', 0.3, 0, { side: THREE.DoubleSide }), 0, 0.035, 0, g);
    fzCyl(0.04, 0.04, 0.004, M.white, 0, 0.002, 0, g, 20);
    H.sugarMound = fzMesh(new THREE.SphereGeometry(0.058, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.sugar, 0, 0.062, 0, g); H.sugarMound.scale.y = 0.75;
    H.sugarFill = fzCyl(0.057, 0.057, 0.004, M.sugar, 0, 0.064, 0, g, 20);
    const sp = fzBox(0.012, 0.004, 0.15, M.steel, 0.02, 0.09, 0.03, g); sp.rotation.set(0.5, 0.4, 0); }
  // sugar grains: a pool of tiny boxes (instanced)
  { const n = 1800, geo = new THREE.BoxGeometry(0.0026, 0.0026, 0.0026), im = new THREE.InstancedMesh(geo, M.sugar, n); im.castShadow = false; im.receiveShadow = true; root.add(im);
    const r = new RNG(91), G = [];
    for (let i = 0; i < n; i++) { const a = r.range(0, Math.PI * 2), rr = Math.sqrt(r.next()) * 0.055, h = 0.044 * (1 - (rr / 0.058) ** 2); G.push({ a, rr, y: r.range(0, 1) * h, sp: r.range(0.5, 1.4), ang: a + r.range(-0.4, 0.4), late: r.range(0, 1), spin: r.range(0, 6) }); }
    H.sugarG = { im, G, n }; }
  // the phone (your hand until s = 0; then the floor, the door, the street: fzPhone)
  { const g = H.phone = new THREE.Group(); root.add(g);
    fzMesh(fzRoundBox(0.072, 0.008, 0.152, 0.008, 0.002), fzStd('#1a1c20', 0.3, 0.5), 0, -0.004, 0, g);
    const can = fzCanvas(180, 380, (q) => { const gr = q.createLinearGradient(0, 0, 180, 380); gr.addColorStop(0, '#2b3a5a'); gr.addColorStop(1, '#7a4a6a'); q.fillStyle = gr; q.fillRect(0, 0, 180, 380);
      q.fillStyle = '#fff'; q.font = '600 46px Arial'; q.textAlign = 'center'; q.fillText('8:14', 90, 100); q.font = '500 14px Arial'; q.fillText('Wednesday', 90, 124);
      q.fillStyle = 'rgba(255,255,255,0.85)'; fzRR(q, 14, 160, 152, 46, 10); q.fill(); q.fillStyle = '#222'; q.font = '600 12px Arial'; q.textAlign = 'left'; q.fillText('Train 8:32 · on time', 24, 182); q.font = '500 11px Arial'; q.fillText('Platform 2', 24, 198); });
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.144), new THREE.MeshBasicMaterial({ map: fzTex(can, { repeat: false }), toneMapped: false })); scr.rotation.x = -Math.PI / 2; scr.position.y = 0.0045; g.add(scr);
    H.phoneScreen = scr; }

  // ------------------------------------------------------------------ behind the house: the back yard (seen through the back window)
  { const yb = fzStd('#ffffff', 0.92, 0, { map: tex(fzBrickCanvas(23, [140, 92, 70]), 3, 1) });
    fzBox(5.2, 0.05, 6, fzStd('#7d7a72', 0.9), 0, -0.02, 3.3, root);
    fzBox(0.2, 1.9, 6, yb, -2.55, 0.95, 3.3, root); fzBox(0.2, 1.9, 6, yb, 2.55, 0.95, 3.3, root); fzBox(5.2, 1.9, 0.2, yb, 0, 0.95, 6.3, root);
    // the neighbours' rear walls beyond, a tree
    fzBox(30, 7, 0.4, fzStd('#ffffff', 0.92, 0, { map: tex(fzBrickCanvas(24, [150, 110, 86]), 12, 3) }), 0, 3.5, 12, root);
    fzMesh(new THREE.IcosahedronGeometry(1.6, 1), fzStd('#4a6a3a', 0.9, 0, { flatShading: true }), 2.6, 4.2, 9, root);
    for (const sx of [-1, 1]) fzBox(0.2, 6, 8.6, M.brick, sx * 2.6, 3, -4, root); }   // (the party walls' thickness, seen at the roof line)
  // the roof (pitched, ridge along x) and the chimney stacks on the party walls
  { const s = new THREE.Shape(), d = -FZ_W.front + 0.6 + 0.3; s.moveTo(-d / 2, 0); s.lineTo(d / 2, 0); s.lineTo(0, 2.6); s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: 5.2, bevelEnabled: false }); geo.rotateY(Math.PI / 2); geo.translate(-2.6, 0, 0);
    const rm = new THREE.Mesh(geo, fzStd('#4a4644', 0.85)); rm.position.set(0, FZ_H.eaves, (FZ_W.front - FZ_W.wallT + 0.3) / 2); rm.castShadow = rm.receiveShadow = true; root.add(rm);
    fzBox(0.8, 1.3, 0.7, M.brick, 2.5, FZ_H.eaves + 2.6 + 0.2, -3.8, root); }

  // ------------------------------------------------------------------ interior lights (warm fill; no shadows)
  H.fillK = new THREE.PointLight('#ffe2c0', 2.2, 6.5, 1.6); H.fillK.position.set(0, 2.45, -1.8); root.add(H.fillK);
  H.fillL = new THREE.PointLight('#ffe8d0', 1.6, 6.5, 1.6); H.fillL.position.set(0, 2.45, -5.6); root.add(H.fillL);
  // the sky through the front window (a soft cool fill from the street side)
  H.fillW = new THREE.SpotLight('#cfe0ff', 3.5, 9, 0.9, 0.9, 1.2); H.fillW.position.set(-0.9, 1.6, F - 1.2); H.fillW.target.position.set(0.2, 0.6, F + 3.5); root.add(H.fillW, H.fillW.target);

  H.update = (s, o) => fzHomeUpdate(H, s, o || {});
  return H;
}

// ---------------------------------------------------------------------------------------------------------------------
// HOME · UPDATE (story time s)
// ---------------------------------------------------------------------------------------------------------------------
// the wall cabinets: screws out by 0.1 s; the cabinet drops onto the worktop (0.1 → 0.42), its foot already kicked a
// little out from the wall; then, like a ladder with nothing to grip, its foot skates out across the worktop while its
// top slides down the wall (0.42 → 0.95): it ends lying on its back on the worktop (front up, doors flung open, 10 cm
// over the edge), then slides along the worktop with the floor's slope until it reaches the larder. Its origin is the
// bottom-back edge; rz > 0 tips the top towards the wall, so with the top touching the wall the foot is h·sin(rz) out
const FZ_CABT = { out: 0.1, land: 0.42, flat: 0.95 };
function fzScrewOut(s) { const t = MathX.clamp(s, 0, FZ_CABT.out); return 0.04 * (t / FZ_CABT.out) ** 2; }   // m backed out
function fzCabPose(i, s) {
  const T = FZ_CABT, h = FZ_H.cabY[1] - FZ_H.cabY[0], drop = FZ_H.cabY[0] - FZ_H.top, r0 = 0.1;
  if (s <= 0) return { x: 0, y: 0, rz: 0, dz: 0, open: 0 };
  if (s < T.out) { const u = s / T.out; return { x: 0, y: -0.004 * u, rz: 0, dz: 0, open: 0 }; }
  if (s < T.land) { const t = s - T.out, y = -Math.min(drop, 0.5 * FZP.g * t * t), u = t / (T.land - T.out), rz = r0 * u * u;
    return { x: h * Math.sin(rz), y, rz, dz: 0, open: 0.12 * u }; }
  const b = s - T.land, bounce = Math.exp(-b * 14) * Math.abs(Math.sin(b * 34)) * 0.012 * (b > T.flat - T.land ? 1 : 0.3);
  const u = MathX.clamp((s - T.land) / (T.flat - T.land), 0, 1), e = u * u;
  const rz = r0 + (Math.PI / 2 - r0) * e;
  const tz = Math.max(0, s - T.flat), cab = FZ_H.cab[i];
  // (slides along the worktop towards the front; cabinet B stops at the larder, A against B)
  const stopB = FZ_H.larder[0] - cab[1], stopA = stopB;
  const dz = -Math.min(i === 1 ? stopB : stopA, fzHalf(FZP.aFloor, Math.min(tz, FZP.tBack - T.flat)));
  return { x: h * Math.sin(rz), y: -drop + bounce, rz, dz, open: Math.min(1, 0.12 + 1.3 * u), lying: e };
}
// the TV: plugs out 0 → 0.12; drops onto the sideboard (0.12 → 0.4); tips over its front edge onto the floor (0.4 → 0.86)
function fzTvPose(s) {
  const TV = FZ_H.tv, y0 = TV.y - TV.h / 2, side = FZ_LOOSE_ID.side, sTop = side.h;
  if (s <= 0) return { x: TV.x, y: y0, rz: 0, out: 0 };
  if (s < 0.12) { const u = s / 0.12; return { x: TV.x - 0.0, y: y0 - 0.01 * u * u, rz: 0.05 * u * u, out: 0.055 * u * u }; }
  if (s < 0.4) { const t = s - 0.12, y = Math.max(sTop, y0 - 0.5 * FZP.g * t * t); return { x: TV.x - 0.03 - 0.1 * (t / 0.28), y, rz: 0.05 + 0.35 * (t / 0.28), out: 0.06 }; }
  if (s < 0.86) { const u = (s - 0.4) / 0.46, e = u * u; return { x: TV.x - 0.13 - 0.3 * e, y: sTop * (1 - e) + 0.02 * e, rz: 0.4 + (Math.PI / 2 + 0.05 - 0.4) * e, out: 0.06 }; }
  // face down on the floor: then it slides with the floor until the armchair
  const b = s - 0.86, bounce = Math.exp(-b * 12) * Math.abs(Math.sin(b * 30)) * 0.02;
  const d = Math.min(1.5, fzHalf(FZP.aFloor, Math.min(b, FZP.tBack - 0.86)));
  return { x: TV.x - 0.43, y: 0.02 + bounce, rz: Math.PI / 2 + 0.05 * Math.exp(-b * 6), out: 0.06, dz: -d };
}
// the shelf: plugs out 0 → 0.1; drops 0.1 → ~0.43 onto the sofa's back and seat; tips; the books scatter
function fzShelfPose(s) {
  if (s <= 0) return { y: 0, rz: 0, x: 0 };
  if (s < 0.1) { const u = s / 0.1; return { y: -0.005 * u, rz: -0.05 * u * u, x: 0.004 * u }; }
  const t = s - 0.1, fall = 0.5 * FZP.g * t * t, maxFall = FZ_H.shelf.y - 0.92;
  if (fall < maxFall) return { y: -fall, rz: -0.05 - 0.6 * MathX.clamp(t / 0.33, 0, 1), x: 0.004 + 0.12 * t };
  const tl = Math.sqrt(2 * maxFall / FZP.g), b = t - tl, u = MathX.clamp(b / 0.35, 0, 1);
  return { y: -maxFall - 0.35 * u * u, rz: -0.65 - 0.9 * u * u * (3 - 2 * u), x: 0.04 + 0.3 * u, landed: true, b };
}

function fzHomeUpdate(H, s, o) {
  // ---- loose furniture (the floor's slope); tall things still sliding at 10 s pivot forward (−z) on their front edge:
  // the slow ones rock and drop back (fzTip)
  for (const [id, L] of Object.entries(H.loose)) {
    const r = fzLoose(id, s);
    L.g.position.z = L.z0 + r.dz;
    if (L.it.tall) {
      const a = fzTip(id, s, id === 'fridge' ? 1.45 : Math.PI / 2), hd = Math.abs(L.it.z[0] - L.it.z[1]) / 2;
      L.g.rotation.x = -a; L.g.position.y = hd * Math.sin(a); L.g.position.z += -hd + hd * Math.cos(a);
    }
  }
  // the rug carries the coffee table (both from fzLoose)
  // ---- the wall cabinets, their screws, plates, glasses
  const so = fzScrewOut(s);
  for (const cb of H.cabs) {
    const P = fzCabPose(cb.i, s);
    cb.g.position.set(-FZ_H.W + P.x, FZ_H.cabY[0] + P.y, cb.z0 + (P.dz || 0));
    cb.g.rotation.z = P.rz;
    for (const sc of cb.screws) {                                      // (backing out of the wall, spinning: pitch 2 mm)
      const turns = so / 0.002 + (s > FZ_CABT.out ? (s - FZ_CABT.out) * 120 : 0);
      sc.g.rotation.x = turns * Math.PI * 2 * (sc.u + 1.3);
      sc.g.position.x = 0.012 + (s < FZ_CABT.out ? so - P.x : 0.035);
      sc.g.visible = s < FZ_CABT.land + 0.2;
    }
    for (const d of cb.doors) d.g.rotation.y = d.sz * -P.open * 1.9 * (1 + 0.05 * Math.sin(s * 9 + d.sz));
    // the plates slide out of the open cabinet when it lands (0.45 → 0.62), across the worktop, off its edge (x −1.78)
    // to the floor (and smash: the pool of shards)
    for (const p of cb.plates) {
      const te = 0.46 + 0.03 * p.k + 0.05 * cb.i, v = 0.8 + 0.12 * p.k, local = s < te;
      if (local) { p.m.visible = true; p.m.position.copy(p.base); p.m.rotation.set(0, 0, 0); continue; }
      p.m.visible = false;
    }
    for (const q of cb.glasses) q.visible = s < 0.46;
  }
  // the flying plates + shards (world space)
  fzPlatesWorld(H, s);
  // ---- the TV
  { const P = fzTvPose(s), TV = FZ_H.tv;
    H.tv.g.position.set(P.x, P.y, TV.z + (P.dz || 0)); H.tv.g.rotation.z = P.rz;
    for (const pg of H.tv.plugs) pg.position.x = P.out;
    H.tvCable.visible = s <= 0; }
  // ---- the shelf and its books (falling onto the sofa; after landing they ride on the sofa)
  { const P = fzShelfPose(s), sofaDz = fzLoose('sofa', s).dz;
    H.shelf.g.position.set(-FZ_H.W + P.x, FZ_H.shelf.y + P.y, (FZ_H.shelf.z[0] + FZ_H.shelf.z[1]) / 2 + (P.landed ? sofaDz : 0));
    H.shelf.g.rotation.z = P.rz;
    for (const b of H.shelf.books) { const k = P.landed ? MathX.clamp(P.b / 0.4, 0, 1) : 0, f = fzR(b.i, 3);
      b.m.position.set(b.base.x + k * (0.1 + 0.25 * f), b.base.y - k * 0.05, b.base.z + k * (f - 0.5) * 0.12); b.m.rotation.set(k * (f - 0.5) * 2.2, k * f * 1.2, k * (0.3 + f)); } }
  // ---- the curtains: the top of the cotton gives way first; the panel slumps and crumbles into fluff (0.05 → 1.1)
  for (const c of H.curtains) {
    const u = MathX.clamp((s - 0.05) / 1.4, 0, 1);
    c.mat.alphaTest = u <= 0 ? 0 : Math.min(0.995, 0.02 + 0.98 * Math.pow(u, 1.5));
    const sl = MathX.clamp((s - 0.15) / 1.2, 0, 1), e = sl * sl;
    c.m.scale.y = 1 - 0.92 * e; c.m.position.y = c.top - (c.h * 0.92 * e) * 0;   // (it hangs from the top: scale shrinks it towards the pole, then falls)
    const fallT = Math.max(0, s - 0.25), fall = Math.min(c.top - c.h * c.m.scale.y, 0.5 * FZP.g * fallT * fallT);
    c.m.position.y = c.top - fall;
    c.m.visible = c.mat.alphaTest < 0.99;
  }
  // ---- the mug, its coffee, the pieces
  { const m = fzMug(s), g = H.mug;
    g.visible = m.whole; g.position.set(m.x, m.y, m.z); g.rotation.set(m.rx || 0, 0.6, m.rz || 0);
    H.shards.forEach((mesh, i) => { const p = fzShard(i, s); if (!p) { mesh.visible = false; return; } mesh.visible = true; mesh.position.set(p.x, 0.004, p.z); mesh.rotation.set(0, p.a, 0); });
    const ps = s - FZ_MUG.smash; H.puddle.visible = ps > 0;
    if (ps > 0) { const r = 0.05 + 0.22 * (1 - Math.exp(-ps * 2.2)); H.puddle.scale.set(r * 1.25, r, 1); H.puddle.position.set(FZ_MUG.land[0] + 0.05, 0.003, FZ_MUG.land[1] - 0.02 - fzHalf(FZP.aFloor, Math.min(ps, 9))); } }
  // ---- the sugar
  fzSugarUpdate(H, s);
  // ---- the phone (hidden while it's in your hand in the POV shots: the hand holds its own copy)
  { const p = fzPhone(s), g = H.phone;
    g.position.set(p.x, p.y, p.z); g.rotation.set(0, 0, 0); g.rotateY(p.yaw);
    if (p.inHand || s < FZ_PHONE.land) { g.rotateX(p.pitch + Math.PI / 2); g.rotateZ(p.roll); }
    g.visible = !(o.phoneInHand && p.inHand); }
}

// the plates that fly out of the two cabinets (12) and their pieces (4 each), in world space
function fzPlatesWorld(H, s) {
  let n = 0;
  if (!H.flyPlates) {
    H.flyPlates = [];
    for (const cb of H.cabs) for (const p of cb.plates) { const m = fzMesh(new THREE.CylinderGeometry(0.12, 0.09, 0.016, 22), H.M.ceramic, 0, -5, 0, H.root); m.visible = false; H.flyPlates.push({ m, cb, p }); }
  }
  for (const F of H.flyPlates) {
    const { cb, p } = F, te = 0.46 + 0.03 * p.k + 0.05 * cb.i, v = 0.8 + 0.12 * p.k, zz = cb.z0 - cb.L / 4 + (fzR(p.k + 7 * cb.i, 5) - 0.5) * 0.3;
    if (s < te) { F.m.visible = false; continue; }
    const x0 = -FZ_H.W + 0.25, xEdge = -FZ_H.W + FZ_H.runD, tEdge = te + (xEdge - x0) / v, tf = Math.sqrt(2 * FZ_H.top / FZP.g), tHit = tEdge + tf;
    if (s < tEdge) { F.m.visible = true; F.m.position.set(x0 + v * (s - te), FZ_H.top + 0.01, zz); F.m.rotation.set(0, 0, 0); continue; }
    if (s < tHit) { const t = s - tEdge; F.m.visible = true; F.m.position.set(xEdge + v * t, FZ_H.top - 0.5 * FZP.g * t * t, zz); F.m.rotation.set(0, 0, -2.4 * t * (1 + p.k * 0.1)); continue; }
    F.m.visible = false;
    // pieces
    const land = [xEdge + v * tf, zz], ts = Math.min(s, FZP.tBack + 0.05) - tHit;
    for (let k = 0; k < 4 && n < H.plateShards.length; k++, n++) {
      const sh = H.plateShards[n], a = fzR(n, 11) * Math.PI * 2, sp = 0.2 + 0.6 * fzR(n, 12);
      let x = land[0] + (Math.cos(a) * sp + v * 0.4) * ts, z = land[1] + Math.sin(a) * sp * ts - fzHalf(FZP.aFloor, ts);
      x = Math.max(-FZ_H.W + FZ_H.runD + 0.03, x);
      sh.visible = true; sh.position.set(x, 0.006, Math.max(FZ_W.front + 0.05, z)); sh.rotation.set(0, a + ts * 3 * (fzR(n, 13) - 0.5), 0);
      sh.scale.set(0.7 + 0.8 * fzR(n, 14), 1, 0.7 + 0.8 * fzR(n, 15));
    }
  }
  for (; n < H.plateShards.length; n++) H.plateShards[n].visible = false;
}

// the sugar: the heap can't stand without friction: it slumps flat in the bowl and the surplus runs over the rim like
// water, spreads across the island top in a thin sheet, drifts towards the front edge and pours off it in a stream
function fzSugarUpdate(H, s) {
  const S = H.sugarG, sg = FZ_H.sugar, im = S.im, m4 = fzSugarUpdate._m || (fzSugarUpdate._m = new THREE.Matrix4()), q = fzSugarUpdate._q || (fzSugarUpdate._q = new THREE.Quaternion()), e = fzSugarUpdate._e || (fzSugarUpdate._e = new THREE.Euler()), v3 = fzSugarUpdate._v || (fzSugarUpdate._v = new THREE.Vector3()), one = new THREE.Vector3(1, 1, 1);
  const slump = MathX.clamp(s / 0.35, 0, 1);
  H.sugarMound.scale.y = 0.75 * (1 - slump) + 0.02; H.sugarMound.visible = slump < 0.98;
  const IS = FZ_ISLAND;
  for (let i = 0; i < S.n; i++) {
    const g = S.G[i];
    let x, y, z;
    if (s <= 0) { x = sg[0] + Math.cos(g.a) * g.rr; z = sg[2] + Math.sin(g.a) * g.rr; y = sg[1] + 0.064 + g.y; }
    else {
      // the top layer's grains (y above the rim) flow out; the rest settle level in the bowl
      const surplus = g.y > 0.008;
      if (!surplus) { x = sg[0] + Math.cos(g.a) * g.rr; z = sg[2] + Math.sin(g.a) * g.rr; y = sg[1] + 0.064 + Math.min(g.y, 0.006) * (1 - slump); }
      else {
        const t0 = 0.05 + 0.25 * (1 - g.y / 0.044) + 0.1 * g.late, t = Math.max(0, s - t0);
        // out over the rim (radius 0.06), down the bowl's side (7 cm), then outwards across the stone, slowing (a sheet),
        // drifting with the slope towards −z; past the island's edge it falls
        const rOut = 0.062, dr = Math.min(t * 0.25 * g.sp, 0.02);
        const tSide = Math.max(0, t - 0.08), down = Math.min(0.07, 0.5 * FZP.g * tSide * tSide);
        const tFlat = Math.max(0, t - 0.2), spread = (0.3 * (1 - Math.exp(-tFlat * 1.5)) + 0.012 * tFlat) * Math.sqrt(g.late) * (0.85 + 0.15 * g.sp);
        const rr = (down < 0.07 ? rOut + dr : rOut + 0.02 + spread);
        x = sg[0] + Math.cos(g.ang) * rr; z = sg[2] + Math.sin(g.ang) * rr - fzHalf(FZP.aFloor, Math.min(tFlat, 9.8)) * 3.0;
        y = sg[1] + (down < 0.07 ? 0.066 - down : 0.002);
        // over the edge: falls to the floor
        const off = x < IS.x[0] || x > IS.x[1] || z > IS.z[0] || z < IS.z[1];
        if (off && down >= 0.07) {
          const ex = MathX.clamp(x, IS.x[0], IS.x[1]), ez = MathX.clamp(z, IS.z[1], IS.z[0]);
          const dist = Math.hypot(x - ex, z - ez), vOut = 0.12, tOff = dist / vOut;
          const fallY = 0.5 * FZP.g * tOff * tOff;
          x = ex + (x - ex) * 0.4; z = ez + (z - ez) * 0.4;
          y = Math.max(0.002, IS.top - fallY);
        }
      }
    }
    e.set(g.spin, g.spin * 1.3, 0); q.setFromEuler(e); v3.set(x, y, z);
    m4.compose(v3, q, one); im.setMatrixAt(i, m4);
  }
  im.instanceMatrix.needsUpdate = true;
}
