/* =====================================================================
   PLAZA (V3) — the outdoor world rebuilt to the café's level of detail. It extends GbCafe (cafe.js):
   - _townhouses(): a row of individually designed townhouses (overrides V2's plain boxes). Each has its own
     width, floors, colour, roof (gable + tiles + chimneys, mansard + dormers, or parapet), a cornice and string
     courses, framed windows with sills and lintels or arched heads, shutters, window boxes, iron balconies,
     a drainpipe, and a ground-floor shop (fascia with a painted name, a lit display window, a door, sometimes an
     awning). Pieces are merged per material, so a whole street costs a few dozen draw calls.
   - side wings: houses on both sides of the plaza, turned inward, so a wide shot is enclosed instead of empty.
   - _skyline(): hazy layered roofs, a bell tower and a dome far behind (depth through fog).
   - _dressing(): lantern lamp posts, bollards, a bicycle at a rack, a flower cart, a kiosk, terrace tables,
     planters, an A-board, fuller tree canopies (they still droop with the old crown pivots), two more trees.
   All shop names are invented. Everything static; the gravity-reactive parts stay in cafe.js update().
   ===================================================================== */

// merge every mesh under `src` into one mesh per material (positions/normals/uvs baked in src's space)
function gbMergeGroup(src, opts = {}) {
  src.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(src.matrixWorld).invert();
  const buckets = new Map();
  src.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh) return;
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    const k = o.material.uuid;
    if (!buckets.has(k)) buckets.set(k, { m: o.material, gs: [] });
    buckets.get(k).gs.push(g);
  });
  const out = new THREE.Group();
  for (const { m, gs } of buckets.values()) {
    let n = 0; for (const g of gs) n += g.attributes.position.count;
    const P = new Float32Array(n * 3), N = new Float32Array(n * 3), U = new Float32Array(n * 2);
    let o = 0;
    for (const g of gs) { P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); U.set(g.attributes.uv.array.subarray(0, g.attributes.position.count * 2), o * 2); o += g.attributes.position.count; }
    const G = new THREE.BufferGeometry();
    G.setAttribute('position', new THREE.BufferAttribute(P, 3)); G.setAttribute('normal', new THREE.BufferAttribute(N, 3)); G.setAttribute('uv', new THREE.BufferAttribute(U, 2));
    const mesh = new THREE.Mesh(G, m); mesh.castShadow = !!opts.cast; mesh.receiveShadow = opts.receive !== false;
    out.add(mesh);
  }
  out.position.copy(src.position); out.rotation.copy(src.rotation); out.scale.copy(src.scale);
  return out;
}

const GB_TOWN = {
  walls: ['#c98f74', '#d4b088', '#a6868f', '#bba48a', '#8f7c9b', '#c9a09c', '#86998f', '#d1a27a', '#9d8a7c'],
  trims: ['#efe3cf', '#e6d6bd', '#d9c9b4', '#f2e8d8'],
  shutters: ['#3f6b6a', '#5a6f8e', '#7a4a3e', '#4d5a3a', '#6b4f6e'],
  awnings: [['#7d3a30', '#e9dcc4'], ['#2f5f63', '#e8dcc6'], ['#5a4a6e', '#eadfca'], ['#8a5a2a', '#efe2c8']],
  shops: ['FLORA & FERN', 'LIBRAIRIE', 'PÂTISSERIE', 'TAILOR', 'HARDWARE', 'GELATO', 'RECORDS', 'PHARMACY', 'BOOKS', 'FROMAGERIE', 'BICYCLES', 'TEA HOUSE'],
};

Object.assign(GbCafe.prototype, {
  // ---------------------------------------------------------------------------------------- shared materials
  _townMats() {
    if (this._tm) return this._tm;
    const r = new RNG(77);
    const stucco = gbCanvasTex(256, 256, (x, w, h) => {
      x.fillStyle = '#d8d0c8'; x.fillRect(0, 0, w, h);
      Tex.blotches(x, w, h, 70, 10, 60, (q) => `rgba(${q.next() < 0.5 ? '90,70,80' : '255,250,240'},${q.range(0.03, 0.08)})`, r);
      for (let i = 0; i < 1400; i++) { x.fillStyle = `rgba(${r.next() < 0.5 ? '60,50,50' : '255,255,255'},${r.range(0.03, 0.08)})`; x.fillRect(r.range(0, w), r.range(0, h), 1.5, 1.5); }
    });
    stucco.repeat.set(2, 2);
    const tiles = gbCanvasTex(256, 256, (x, w, h) => {
      x.fillStyle = '#7a4438'; x.fillRect(0, 0, w, h);
      for (let row = 0; row < 16; row++) for (let k = 0; k < 9; k++) {
        const off = (row % 2) * 14, xx = k * 28 + off, yy = row * 16;
        x.fillStyle = `rgb(${120 + r.range(-18, 18)},${64 + r.range(-12, 12)},${52 + r.range(-10, 10)})`;
        x.beginPath(); x.ellipse(xx + 14, yy + 9, 13, 9, 0, 0, Math.PI); x.fill();
        x.fillStyle = 'rgba(30,10,10,0.35)'; x.fillRect(xx, yy + 15, 28, 1.5);
      }
    });
    tiles.repeat.set(3, 2);
    const slate = gbCanvasTex(128, 128, (x, w, h) => {
      x.fillStyle = '#4a4a5c'; x.fillRect(0, 0, w, h);
      for (let row = 0; row < 12; row++) { x.fillStyle = 'rgba(20,20,30,0.5)'; x.fillRect(0, row * 11, w, 1.2); for (let k = 0; k < 8; k++) { x.fillStyle = `rgba(255,255,255,${r.range(0, 0.06)})`; x.fillRect(k * 16 + (row % 2) * 8, row * 11 + 1, 15, 10); } }
    });
    slate.repeat.set(3, 2);
    const litWin = gbCanvasTex(128, 192, (x, w, h) => {      // a lit window: warm room, curtains, a cross mullion
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffd59a'); g.addColorStop(1, '#e88a4c');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(120,40,40,0.55)'; x.fillRect(0, 0, 26, h); x.fillRect(w - 26, 0, 26, h);
      x.fillStyle = 'rgba(80,30,30,0.35)'; for (let i = 0; i < 4; i++) { x.fillRect(4 + i * 6, 0, 2, h); x.fillRect(w - 24 + i * 6, 0, 2, h); }
      x.fillStyle = 'rgba(60,40,40,0.25)'; x.fillRect(30, h * 0.62, w - 60, h * 0.38);
      x.fillStyle = '#3a2a26'; x.fillRect(w / 2 - 3, 0, 6, h); x.fillRect(0, h * 0.42, w, 6);
    }, false);
    const darkWin = gbCanvasTex(128, 192, (x, w, h) => {     // an unlit window reflecting the dawn sky
      const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#6a6290'); g.addColorStop(0.5, '#3a3456'); g.addColorStop(1, '#2a2440');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(255,220,200,0.12)'; x.beginPath(); x.moveTo(0, h * 0.2); x.lineTo(w * 0.5, 0); x.lineTo(w * 0.8, 0); x.lineTo(0, h * 0.5); x.fill();
      x.fillStyle = 'rgba(230,220,240,0.35)'; x.fillRect(8, 0, 18, h); x.fillRect(w - 26, 0, 18, h);
      x.fillStyle = '#2a2230'; x.fillRect(w / 2 - 3, 0, 6, h); x.fillRect(0, h * 0.42, w, 6);
    }, false);
    const shopWin = gbCanvasTex(256, 160, (x, w, h) => {     // a lit shop window: shelves with goods
      x.fillStyle = '#f0b878'; x.fillRect(0, 0, w, h);
      for (let s = 0; s < 3; s++) {
        x.fillStyle = 'rgba(70,40,30,0.7)'; x.fillRect(0, 40 + s * 44, w, 5);
        for (let k = 0; k < 14; k++) { x.fillStyle = `hsla(${r.range(0, 360)},45%,${r.range(35, 60)}%,0.85)`; const ww = r.range(8, 16), hh = r.range(12, 30); x.fillRect(6 + k * 18, 40 + s * 44 - hh, ww, hh); }
      }
      x.fillStyle = 'rgba(255,255,255,0.18)'; x.beginPath(); x.moveTo(0, 0); x.lineTo(70, 0); x.lineTo(0, 90); x.fill();
    }, false);
    this._tm = {
      stucco, r,
      wall: (c) => new THREE.MeshStandardMaterial({ map: stucco, color: c, roughness: 0.93, name: 'gbStucco' }),
      trim: (c) => gbMat(c, { rough: 0.85, name: 'gbTrim' }),
      tile: new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.85, color: '#d8a898', name: 'gbTiles' }),
      slate: new THREE.MeshStandardMaterial({ map: slate, roughness: 0.7, color: '#c8c4d8', name: 'gbSlate' }),
      lit: new THREE.MeshStandardMaterial({ map: litWin, emissiveMap: litWin, emissive: '#ffffff', emissiveIntensity: 0.85, roughness: 0.4, name: 'gbTownLit' }),
      dark: new THREE.MeshStandardMaterial({ map: darkWin, roughness: 0.25, envMapIntensity: 0.6, name: 'gbTownGlass' }),
      shop: new THREE.MeshStandardMaterial({ map: shopWin, emissiveMap: shopWin, emissive: '#ffffff', emissiveIntensity: 0.7, roughness: 0.3, name: 'gbShopWin' }),
      iron: gbMat('#1d1a20', { rough: 0.55, metal: 0.4, name: 'gbIron' }),
      wood: gbMat('#3a2a26', { rough: 0.7, name: 'gbDoorWood' }),
      stone: gbMat('#8f8478', { rough: 0.9, name: 'gbPlinth' }),
      pipe: gbMat('#4a4450', { rough: 0.6, metal: 0.3 }),
      flowers: ['#e05a5a', '#f2c14e', '#e889b0', '#f4efe6', '#c25a8a'].map((c) => gbMat(c, { rough: 0.8 })),
      leaf: gbMat('#4d6a3c', { rough: 0.85, flat: true }),
      chimney: gbMat('#8a5a4a', { rough: 0.9 }),
    };
    return this._tm;
  },

  _signTex(text, bg, fg) {
    return gbCanvasTex(512, 96, (x, w, h) => {
      x.fillStyle = bg; x.fillRect(0, 0, w, h);
      x.strokeStyle = fg; x.globalAlpha = 0.5; x.lineWidth = 3; x.strokeRect(8, 8, w - 16, h - 16); x.globalAlpha = 1;
      x.fillStyle = fg; x.font = '600 50px "Lora", Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(text.split('').join(String.fromCharCode(8202)), w / 2, h / 2 + 3);
    }, false);
  },

  // ---------------------------------------------------------------------------------------- one townhouse (front at local z = 0, facing +Z)
  _house(w, floors, seed, opts = {}) {
    const M = this._townMats(), r = new RNG(seed), g = new THREE.Group();
    const wallC = opts.wall || GB_TOWN.walls[seed % GB_TOWN.walls.length];
    const wall = M.wall(wallC), trim = M.trim(GB_TOWN.trims[seed % GB_TOWN.trims.length]);
    const shut = gbMat(GB_TOWN.shutters[(seed * 3) % GB_TOWN.shutters.length], { rough: 0.8 });
    const gH = 3.6, fH = 3.0, H = gH + floors * fH, D = 7;
    const add = (geo, m, x, y, z, o) => gbAdd(g, geo, m, x, y, z, Object.assign({ cast: false }, o || {}));
    add(new THREE.BoxGeometry(w, H, D), wall, 0, H / 2, -D / 2);
    // ground floor: stone plinth + a shop
    add(new THREE.BoxGeometry(w + 0.04, gH, 0.12), M.stone, 0, gH / 2, 0.03);
    const shopName = GB_TOWN.shops[(seed * 7) % GB_TOWN.shops.length];
    const [aw1, aw2] = GB_TOWN.awnings[seed % GB_TOWN.awnings.length];
    const signM = new THREE.MeshStandardMaterial({ map: this._signTex(shopName, aw1, '#f2e6cc'), roughness: 0.6, name: 'gbShopSign' });
    add(new THREE.BoxGeometry(w - 0.5, 0.62, 0.12), trim, 0, gH - 0.42, 0.14);
    add(new THREE.PlaneGeometry(w - 0.7, 0.5), signM, 0, gH - 0.42, 0.205);
    const dw = 1.0, sw = Math.max(1.4, w - 2.2 - dw);
    const sx = -w / 2 + 0.55 + sw / 2, dx = w / 2 - 0.55 - dw / 2;
    add(new THREE.PlaneGeometry(sw, 1.9), M.shop, sx, 1.65, 0.1);
    for (const [fx, fy, fw, fh] of [[sx, 0.66, sw + 0.14, 0.12], [sx, 2.64, sw + 0.14, 0.1], [sx - sw / 2, 1.65, 0.1, 2.08], [sx + sw / 2, 1.65, 0.1, 2.08], [sx, 1.65, 0.05, 1.9]])
      add(new THREE.BoxGeometry(fw, fh, 0.12), M.wood, fx, fy, 0.14);
    add(new THREE.BoxGeometry(dw, 2.45, 0.08), M.wood, dx, 1.23, 0.08);
    add(new THREE.PlaneGeometry(dw * 0.6, 0.9), M.lit, dx, 1.75, 0.13);
    add(new THREE.BoxGeometry(dw + 0.24, 0.14, 0.18), trim, dx, 2.52, 0.14);
    if (r.next() > 0.35) {   // a striped shop awning, rolled out
      const aT = gbCanvasTex(64, 64, (x, ww, hh) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? aw2 : aw1; x.fillRect(i * 8, 0, 8, hh); } });
      const aM = new THREE.MeshStandardMaterial({ map: aT, roughness: 0.9, side: THREE.DoubleSide, name: 'gbShopAwning' });
      aT.repeat.set(sw / 1.2, 1);
      add(new THREE.PlaneGeometry(sw + 0.3, 1.2), aM, sx, 2.75, 0.62, { rx: -1.05 });
      add(new THREE.PlaneGeometry(sw + 0.3, 0.18), aM, sx, 2.34, 1.13);
    }
    // string courses + cornice
    for (let f = 0; f <= floors; f++) add(new THREE.BoxGeometry(w + 0.12, f === floors ? 0.22 : 0.14, 0.22), trim, 0, gH + f * fH - 0.04, 0.06);
    add(new THREE.BoxGeometry(w + 0.4, 0.3, 0.55), trim, 0, H + 0.12, 0.12);
    add(new THREE.BoxGeometry(w + 0.25, 0.14, 0.38), trim, 0, H - 0.12, 0.08);
    for (let k = 0; k < Math.floor(w / 0.32); k++) add(new THREE.BoxGeometry(0.12, 0.12, 0.14), trim, -w / 2 + 0.2 + k * 0.32, H - 0.27, 0.09);
    // upper windows
    const nW = Math.max(2, Math.round((w - 0.6) / 1.75)), step = (w - 0.4) / nW;
    const arched = r.next() > 0.6, shutters = r.next() > 0.45, boxes = r.next() > 0.4, balcFloor = r.next() > 0.4 ? 1 : -1;
    for (let f = 0; f < floors; f++) {
      const y = gH + f * fH + 1.45, wh = f === floors - 1 ? 1.45 : 1.75, ww = Math.min(0.95, step * 0.55);
      if (f === balcFloor) {   // an iron balcony across the middle windows
        const bw = Math.min(w - 0.8, step * Math.min(nW, 3) + 0.2);
        add(new THREE.BoxGeometry(bw, 0.1, 0.62), trim, 0, y - wh / 2 - 0.1, 0.31);
        add(new THREE.BoxGeometry(bw, 0.035, 0.035), M.iron, 0, y - wh / 2 + 0.78, 0.6);
        add(new THREE.BoxGeometry(bw, 0.03, 0.03), M.iron, 0, y - wh / 2 + 0.05, 0.6);
        for (let k = 0; k <= Math.floor(bw / 0.11); k++) add(new THREE.BoxGeometry(0.018, 0.75, 0.018), M.iron, -bw / 2 + k * 0.11, y - wh / 2 + 0.42, 0.6);
        for (const sxx of [-1, 1]) add(new THREE.BoxGeometry(0.03, 0.75, 0.62), M.iron, sxx * bw / 2, y - wh / 2 + 0.42, 0.31, { s: [1, 1, 1] });
      }
      for (let k = 0; k < nW; k++) {
        const x = -w / 2 + 0.2 + step * (k + 0.5);
        const lit = r.next() > 0.62;
        add(new THREE.PlaneGeometry(ww, wh), lit ? M.lit : M.dark, x, y, 0.02);
        // frame: jambs, head, sill
        add(new THREE.BoxGeometry(0.09, wh + 0.1, 0.1), trim, x - ww / 2 - 0.04, y, 0.05);
        add(new THREE.BoxGeometry(0.09, wh + 0.1, 0.1), trim, x + ww / 2 + 0.04, y, 0.05);
        if (arched) add(new THREE.TorusGeometry(ww / 2 + 0.04, 0.05, 6, 16, Math.PI), trim, x, y + wh / 2, 0.05, { s: [1, 0.8, 1] });
        else { add(new THREE.BoxGeometry(ww + 0.3, 0.14, 0.14), trim, x, y + wh / 2 + 0.1, 0.07); add(new THREE.BoxGeometry(0.16, 0.2, 0.16), trim, x, y + wh / 2 + 0.12, 0.09); }
        add(new THREE.BoxGeometry(ww + 0.28, 0.08, 0.22), trim, x, y - wh / 2 - 0.05, 0.11);
        if (shutters && f !== balcFloor) for (const s of [-1, 1]) {
          add(new THREE.BoxGeometry(ww * 0.5, wh, 0.04), shut, x + s * (ww * 0.75 + 0.06), y, 0.06);
          for (let l = 0; l < 7; l++) add(new THREE.BoxGeometry(ww * 0.46, 0.02, 0.05), shut, x + s * (ww * 0.75 + 0.06), y - wh / 2 + 0.15 + l * (wh - 0.3) / 6, 0.075);
        }
        if (boxes && f !== balcFloor && (k + f) % 2 === 0) {
          add(new THREE.BoxGeometry(ww + 0.1, 0.18, 0.2), M.wood, x, y - wh / 2 - 0.0, 0.24);
          for (let l = 0; l < 6; l++) add(new THREE.IcosahedronGeometry(0.075 + 0.03 * r.next(), 0), l % 3 ? M.leaf : M.flowers[(seed + l + k) % M.flowers.length], x - ww / 2 + 0.1 + l * (ww - 0.2) / 5, y - wh / 2 + 0.14, 0.26);
        }
      }
    }
    // drainpipe
    add(new THREE.CylinderGeometry(0.04, 0.04, H, 8), M.pipe, w / 2 - 0.12, H / 2, 0.08);
    // roof
    const roofType = opts.roof || ['gable', 'mansard', 'flat'][seed % 3];
    if (roofType === 'gable') {
      const sh = new THREE.Shape(); sh.moveTo(-D / 2 - 0.3, 0); sh.lineTo(D / 2 + 0.3, 0); sh.lineTo(0, 2.6); sh.closePath();
      const rg = new THREE.ExtrudeGeometry(sh, { depth: w + 0.3, bevelEnabled: false }); rg.translate(0, 0, -(w + 0.3) / 2); rg.rotateY(Math.PI / 2);
      add(rg, M.tile, 0, H + 0.27, -D / 2);
      for (const cx of [-w / 2 + 0.8, w / 2 - 1.0]) if (r.next() > 0.3) { add(new THREE.BoxGeometry(0.55, 1.8, 0.7), M.chimney, cx, H + 1.6, -D / 2 - 0.6); add(new THREE.BoxGeometry(0.7, 0.12, 0.85), trim, cx, H + 2.55, -D / 2 - 0.6); for (const px of [-0.12, 0.12]) add(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 8), M.chimney, cx + px, H + 2.75, -D / 2 - 0.6); }
    } else if (roofType === 'mansard') {
      const rg = new THREE.CylinderGeometry(0.5, 0.75, 1, 4, 1); rg.rotateY(Math.PI / 4); rg.scale(w * 1.42 / 1.5, 2.2, D * 1.42 / 1.5);
      add(rg, M.slate, 0, H + 1.37, -D / 2);
      for (let k = 0; k < nW; k++) {
        const x = -w / 2 + 0.2 + step * (k + 0.5);
        add(new THREE.BoxGeometry(0.85, 1.0, 0.8), trim, x, H + 1.0, -0.35);
        add(new THREE.PlaneGeometry(0.55, 0.7), r.next() > 0.6 ? M.lit : M.dark, x, H + 0.95, 0.06);
        add(new THREE.CylinderGeometry(0.62, 0.62, 0.85, 12, 1, false, 0, Math.PI), M.slate, x, H + 1.5, -0.35, { rz: Math.PI / 2, s: [0.6, 1, 0.5] });
      }
    } else {
      add(new THREE.BoxGeometry(w + 0.1, 0.6, 0.25), trim, 0, H + 0.55, 0.0);
      for (let k = 0; k < Math.floor(w / 0.45); k++) add(new THREE.CylinderGeometry(0.06, 0.06, 0.45, 8), trim, -w / 2 + 0.3 + k * 0.45, H + 0.55, 0.06);
      add(new THREE.BoxGeometry(1.2, 1.3, 1.2), wall, w / 4, H + 0.7, -D / 2);
    }
    return { g: gbMergeGroup(g), H };
  },

  // ---------------------------------------------------------------------------------------- the streets around the plaza (overrides V2's plain boxes)
  _townhouses() {
    const R = this.root, r = new RNG(55);
    // the far side of the plaza (faces the café), with a street opening where the sun comes up
    let x = -23, seed = 3;
    const zF = -24;
    while (x < 24) {
      if (x > -2.2 && x < 4.6) { x = 4.6; continue; }
      const w = r.range(4.6, 7.2), fl = 2 + Math.floor(r.next() * 2.4);
      const { g } = this._house(w, fl, seed++);
      g.position.set(x + w / 2, 0, zF - r.range(0, 0.6)); R.add(g);
      x += w + 0.02;
    }
    // the street beyond the opening: two receding rows (sunlit edges, deeper haze)
    for (const [xx, zz, rot, s] of [[-3.6, -34, Math.PI / 2, 21], [6.4, -33, -Math.PI / 2, 22], [-3.6, -42, Math.PI / 2, 23], [6.4, -41.5, -Math.PI / 2, 24]]) {
      const { g } = this._house(6.5, 3, s); g.position.set(xx, 0, zz); g.rotation.y = rot; R.add(g);
    }
    // the plaza's sides: houses turned inward
    for (const [side, xx] of [[-1, -15.5], [1, 14.5]]) {
      let z = -6.5;
      while (z > -23) {
        const w = r.range(4.8, 6.6), fl = 2 + Math.floor(r.next() * 2);
        const { g } = this._house(w, fl, seed++);
        g.position.set(xx, 0, z - w / 2); g.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; R.add(g);
        z -= w + 0.02;
      }
    }
  },

  // ---------------------------------------------------------------------------------------- far skyline: layered silhouettes + a bell tower + a dome
  _skyline() {
    const R = this.root, r = new RNG(91);
    const far = [gbMat('#7c6a8e', { rough: 1 }), gbMat('#6c5c80', { rough: 1 })];
    const litF = new THREE.MeshStandardMaterial({ color: '#ffc480', emissive: '#ff9a50', emissiveIntensity: 0.9 });
    const sg = new THREE.Group();
    for (let layer = 0; layer < 2; layer++) {
      let x = -60;
      while (x < 60) {
        const w = r.range(5, 10), h = r.range(9, 18) + layer * 4, z = -52 - layer * 14;
        gbAdd(sg, new THREE.BoxGeometry(w, h, 6), far[layer], x + w / 2, h / 2, z, { cast: false });
        if (r.next() > 0.5) gbAdd(sg, new THREE.CylinderGeometry(0.01, w * 0.7, 2.4, 4, 1), far[layer], x + w / 2, h + 1.2, z, { ry: Math.PI / 4, s: [1, 1, 0.6], cast: false });
        for (let k = 0; k < 4; k++) if (r.next() > 0.7) gbAdd(sg, new THREE.PlaneGeometry(0.7, 1.0), litF, x + 1 + r.range(0, w - 2), r.range(2, h - 2), z + 3.01, { cast: false });
        x += w + r.range(0, 1.5);
      }
    }
    // a bell tower (left of the sun) and a dome (right), the landmarks that give the town a scale
    const tw = gbMat('#8a7690', { rough: 1 });
    gbAdd(sg, new THREE.BoxGeometry(3.2, 26, 3.2), tw, -12, 13, -48, { cast: false });
    gbAdd(sg, new THREE.BoxGeometry(3.8, 0.5, 3.8), tw, -12, 26.2, -48, { cast: false });
    gbAdd(sg, new THREE.BoxGeometry(2.6, 4, 2.6), tw, -12, 28.5, -48, { cast: false });
    for (const a of [0, Math.PI / 2]) gbAdd(sg, new THREE.PlaneGeometry(1.0, 2.0), gbMat('#2a2034', { rough: 1, side: THREE.DoubleSide }), -12, 28.6, -48, { ry: a, cast: false, s: [2.7, 1, 1] });
    gbAdd(sg, new THREE.ConeGeometry(2.0, 6, 8), tw, -12, 33.5, -48, { cast: false });
    gbAdd(sg, new THREE.CylinderGeometry(5, 5.4, 8, 24), tw, 19, 20, -60, { cast: false });
    gbAdd(sg, new THREE.SphereGeometry(5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), tw, 19, 24, -60, { cast: false });
    gbAdd(sg, new THREE.CylinderGeometry(0.5, 0.8, 3, 10), tw, 19, 30, -60, { cast: false });
    R.add(gbMergeGroup(sg));
  },

  // ---------------------------------------------------------------------------------------- street furniture, trees, life
  _dressing() {
    const R = this.root, M = this._townMats(), r = new RNG(123);
    const iron = M.iron, brass = gbMat('#b08850', { rough: 0.45, metal: 0.6 });
    const glow = new THREE.MeshStandardMaterial({ color: '#ffe2b8', emissive: '#ffbf7a', emissiveIntensity: 1.6, name: 'gbLantern' });
    const dg = new THREE.Group();
    // lantern posts around the plaza (the two string-light posts get lantern heads too)
    const lantern = (x, z, h = 3.6) => {
      gbAdd(dg, gbLathe([[0.18, 0], [0.16, 0.25], [0.08, 0.4], [0.06, 0.45], [0.055, h - 0.3], [0.08, h - 0.2], [0.05, h]], 12), iron, x, 0, z);
      gbAdd(dg, gbLathe([[0, 0], [0.12, 0.02], [0.17, 0.45], [0.2, 0.5], [0.1, 0.68], [0.02, 0.75], [0, 0.75]], 6), iron, x, h, z);
      gbAdd(dg, new THREE.CylinderGeometry(0.13, 0.1, 0.38, 6), glow, x, h + 0.25, z, { cast: false });
    };
    for (const [x, z] of [[-11.5, -8], [9.5, -8], [-11.5, -19.5], [9.5, -19.5], [-4.5, -21], [3.5, -21]]) lantern(x, z);
    // bollards along the sidewalk
    for (let k = 0; k < 12; k++) { const x = -11 + k * 2; if (Math.abs(x + 0.2) < 1.3) continue; gbAdd(dg, gbLathe([[0.12, 0], [0.11, 0.6], [0.13, 0.65], [0.08, 0.8], [0, 0.82]], 10), iron, x, 0, -6.5); }
    // a curb ring around the fountain square + a darker radial paving band
    gbAdd(dg, new THREE.RingGeometry(4.2, 4.55, 64), gbMat('#a3968a', { rough: 0.85 }), GB_SET.fountain[0], 0.008, GB_SET.fountain[1], { rx: -Math.PI / 2, cast: false });
    gbAdd(dg, new THREE.RingGeometry(2.8, 4.2, 64), gbMat('#b6a294', { rough: 0.85 }), GB_SET.fountain[0], 0.005, GB_SET.fountain[1], { rx: -Math.PI / 2, cast: false });
    // café terrace: two little tables with chairs outside the window
    const tM = gbMat('#2a2226', { rough: 0.5, metal: 0.4 }), topM = gbMat('#d8cfc0', { rough: 0.5 });
    for (const [x, z] of [[-3.6, -5.2], [2.8, -5.3]]) {
      gbAdd(dg, gbLathe([[0.22, 0], [0.04, 0.05], [0.03, 0.7], [0, 0.72]], 12), tM, x, 0, z);
      gbAdd(dg, new THREE.CylinderGeometry(0.33, 0.33, 0.03, 24), topM, x, 0.73, z);
      for (const a of [0.4, 0.4 + Math.PI]) {
        const cx = x + Math.cos(a) * 0.55, cz = z + Math.sin(a) * 0.55;
        gbAdd(dg, new THREE.CylinderGeometry(0.2, 0.2, 0.03, 16), tM, cx, 0.45, cz);
        for (const [lx, lz] of [[0.13, 0.13], [-0.13, 0.13], [0.13, -0.13], [-0.13, -0.13]]) gbAdd(dg, new THREE.CylinderGeometry(0.012, 0.012, 0.45, 6), tM, cx + lx, 0.225, cz + lz);
        gbAdd(dg, new THREE.TorusGeometry(0.17, 0.012, 6, 16, Math.PI), tM, cx - Math.cos(a) * 0.17, 0.72, cz - Math.sin(a) * 0.17, { ry: -a + Math.PI / 2 });
      }
    }
    // an A-board by the door
    const boardM = new THREE.MeshStandardMaterial({ map: this.tx.board, roughness: 0.8 });
    for (const s of [-1, 1]) gbAdd(dg, new THREE.BoxGeometry(0.6, 0.95, 0.03), boardM, 0.9, 0.47, -5.0 + s * 0.12, { rx: s * 0.18 });
    // the bicycle rack (right of the café); the bicycle itself is dynamic (cast3.js: the cyclist lifts it out)
    gbAdd(dg, gbTube([[5.9, 0, -6.6], [5.9, 0.75, -6.6], [6.9, 0.75, -6.6], [6.9, 0, -6.6]], 0.03, 16, 6), iron, 0, 0, 0);
    // a flower cart at the far corner of the square (V3: moved clear of the vendor and the fountain camera)
    const cart = new THREE.Group(); cart.position.set(-6.6, 0, -17.0); cart.rotation.y = 0.8; dg.add(cart);
    const cartM = gbMat('#5a3a2a', { rough: 0.8 });
    gbAdd(cart, gbRoundBox(1.6, 0.5, 0.8, 0.04, 2), cartM, 0, 0.75, 0);
    for (const x of [-0.6, 0.6]) gbAdd(cart, new THREE.TorusGeometry(0.32, 0.04, 8, 20), iron, x, 0.32, 0.42);
    gbAdd(cart, gbTube([[-0.8, 0.95, -0.4], [-1.3, 0.9, -0.4]], 0.025, 4, 6), cartM, 0, 0, 0);
    for (let k = 0; k < 6; k++) {
      const bx = -0.6 + (k % 3) * 0.6, bz = -0.2 + Math.floor(k / 3) * 0.4;
      gbAdd(cart, new THREE.CylinderGeometry(0.15, 0.12, 0.25, 12), gbMat('#7a7f88', { rough: 0.4, metal: 0.6 }), bx, 1.1, bz);
      for (let l = 0; l < 7; l++) gbAdd(cart, new THREE.IcosahedronGeometry(0.06 + 0.02 * r.next(), 0), l % 3 === 0 ? M.leaf : M.flowers[(k + l) % M.flowers.length], bx + r.range(-0.1, 0.1), 1.28 + r.range(0, 0.12), bz + r.range(-0.1, 0.1));
    }
    // a newspaper kiosk (right side of the plaza)
    const kM = gbMat('#2f4f4a', { rough: 0.7 }), kT = gbMat('#c9a35a', { rough: 0.5, metal: 0.3 });
    gbAdd(dg, new THREE.CylinderGeometry(0.9, 0.9, 2.4, 10), kM, 8.2, 1.2, -15.2);
    gbAdd(dg, new THREE.ConeGeometry(1.1, 0.9, 10), kM, 8.2, 2.85, -15.2);
    gbAdd(dg, new THREE.SphereGeometry(0.12, 10, 8), kT, 8.2, 3.35, -15.2);
    gbAdd(dg, new THREE.CylinderGeometry(0.93, 0.93, 0.35, 10, 1, true), new THREE.MeshStandardMaterial({ map: this._signTex('NEWS · MAPS · TICKETS', '#2f4f4a', '#f0d79a'), roughness: 0.6, side: THREE.DoubleSide }), 8.2, 2.25, -15.2, { cast: false });
    for (let k = 0; k < 5; k++) gbAdd(dg, new THREE.PlaneGeometry(0.3, 0.4), gbMat(['#e8dcc8', '#d9a35a', '#c25a4a', '#e8dcc8', '#6a8ab0'][k], { rough: 0.8 }), 8.2 + Math.cos(k * 0.35 + 1.9) * 0.92, 1.3, -15.2 + Math.sin(k * 0.35 + 1.9) * 0.92, { ry: -(k * 0.35 + 1.9) + Math.PI / 2, cast: false });
    // planters with shrubs around the square
    for (const [x, z] of [[-8.0, -12.5], [5.6, -17.8], [-7.2, -18.6], [-12.8, -14]]) {
      gbAdd(dg, gbLathe([[0, 0], [0.45, 0], [0.55, 0.55], [0.5, 0.6], [0, 0.6]], 16), gbMat('#a0705a', { rough: 0.9 }), x, 0, z);
      for (let k = 0; k < 7; k++) gbAdd(dg, new THREE.IcosahedronGeometry(0.22 + 0.08 * r.next(), 1), k % 4 ? M.leaf : M.flowers[k % M.flowers.length], x + r.range(-0.3, 0.3), 0.75 + r.range(0, 0.3), z + r.range(-0.3, 0.3), { s: [1, 0.85, 1] });
    }
    R.add(gbMergeGroup(dg, { cast: true }));
    // fuller tree canopies: every crown pivot gets leaf clumps in three greens (they droop with the pivot)
    const greens = ['#3d5c3a', '#4d6e3e', '#5e7d44', '#36513a'].map((c) => gbMat(c, { rough: 0.85, flat: true, name: 'gbLeaf' }));
    const addClumps = (T, n, size) => {
      const c = T.m.position;
      for (let k = 0; k < n; k++) {
        const a = r.range(0, Math.PI * 2), e = r.range(-0.4, 0.9), d = r.range(0.5, 0.95) * size;
        gbAdd(T.piv, new THREE.IcosahedronGeometry(r.range(0.3, 0.5), 1), greens[k % 4], c.x + Math.cos(a) * Math.cos(e) * d, c.y + Math.sin(e) * d * 0.8, c.z + Math.sin(a) * Math.cos(e) * d, { s: [1, 0.8, 1] });
      }
    };
    for (const T of this.treePuffs) addClumps(T, 7, 1.0);
    // two more trees on the far side (same droop behaviour)
    const trunkM = gbMat('#3a2a26', { rough: 0.9, rim: 0.2 });
    for (const [tx, tz, sc] of [[7.8, -20.5, 0.9], [-12.6, -20.0, 1.0]]) {
      const tr = new THREE.Group(); tr.position.set(tx, 0, tz); tr.scale.setScalar(sc); R.add(tr);
      gbAdd(tr, gbLathe([[0.28, 0], [0.18, 0.3], [0.15, 2.4], [0.1, 3.4], [0, 3.5]], 10), trunkM);
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * Math.PI * 2, rr = k === 0 ? 0 : r.range(0.8, 1.4), y = k === 0 ? 4.5 : r.range(3.4, 4.6);
        const piv = new THREE.Group(); piv.position.set(0, 2.6, 0); tr.add(piv);
        const m = gbAdd(piv, new THREE.IcosahedronGeometry(r.range(0.7, 1.0), 1), greens[k % 4], Math.cos(a) * rr, y - 2.6, Math.sin(a) * rr, { s: [1, 0.8, 1] });
        const T = { piv, m, k: k + 20, rr: Math.max(0.8, rr) };
        this.treePuffs.push(T); addClumps(T, 5, 0.9);
        if (k) gbAdd(tr, gbTube([[0, 2.4, 0], [Math.cos(a) * rr * 0.5, 3.0, Math.sin(a) * rr * 0.5], [Math.cos(a) * rr * 0.9, y - 0.4, Math.sin(a) * rr * 0.9]], 0.05, 8, 5), trunkM);
      }
    }
  },
});

// build order: V2's set, then the V3 skyline and dressing (the townhouses override runs inside build)
(function () {
  const build0 = GbCafe.prototype.build;
  GbCafe.prototype.build = function () { build0.call(this); this._skyline(); this._dressing(); };
})();


// ---------------------------------------------------------------------------------------------------------------------
// V3 fountain polish: calmer water (less glow), a foam ring where the ring jets land, ripple rings spreading from the
// landing points, a splash crown on the upper bowl, and a soft mist. All pure functions of t, updated with the jets.
// ---------------------------------------------------------------------------------------------------------------------
(() => {
  const build0 = GbCafe.prototype._fountain, upd0 = GbCafe.prototype._updateFountain;
  const foamTex = () => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 32; const x = c.getContext('2d'), r = new RNG(77);
    x.clearRect(0, 0, 256, 32);
    for (let i = 0; i < 420; i++) { const px = r.next() * 256, py = 16 + (r.next() - 0.5) * 22 * r.next(), rr = 1 + r.next() * 3.5; x.fillStyle = `rgba(255,255,255,${0.15 + 0.5 * r.next()})`; x.beginPath(); x.arc(px, py, rr, 0, Math.PI * 2); x.fill(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.repeat.set(6, 1); return t;
  };
  GbCafe.prototype._fountain = function () {
    build0.call(this);
    const g = this.fountainG;
    // the glow was the V2 problem: droplets and the jet read as sparks. Make them water: cool, mostly reflective.
    Object.assign(this.dropM, { emissiveIntensity: 0.12, opacity: 0.75 }); this.dropM.color.set('#e6f0f6'); this.dropM.emissive.set('#ffd2a8');
    Object.assign(this.jetM, { emissiveIntensity: 0.12, opacity: 0.45 });
    this.waterM.color.set('#3a5266'); this.waterM.emissiveIntensity = 0.12;
    // foam ring (where the ring jets land) and a smaller one on the upper bowl
    const fm = this.foamM = new THREE.MeshBasicMaterial({ map: foamTex(), transparent: true, opacity: 0.55, depthWrite: false, color: '#f3ead8', name: 'gbFoam' });
    this.foam = gbAdd(g, new THREE.RingGeometry(1.2, 1.55, 64, 1), fm, 0, 0.435, 0, { rx: -Math.PI / 2, cast: false, receive: false });
    const fm2 = this.foamM2 = fm.clone(); fm2.map = fm.map.clone(); fm2.map.needsUpdate = true; fm2.map.repeat.set(3, 1);
    this.foam2 = gbAdd(g, new THREE.RingGeometry(0.12, 0.45, 48, 1), fm2, 0, 1.445, 0, { rx: -Math.PI / 2, cast: false, receive: false });
    // ripples: 24 thin rings (3 per ring jet) that grow and fade
    this.ripM = []; this.rips = [];
    const rg = new THREE.RingGeometry(0.9, 1.0, 40, 1);
    for (let i = 0; i < 24; i++) {
      const m = new THREE.MeshBasicMaterial({ color: '#fff4e2', transparent: true, opacity: 0, depthWrite: false });
      const r = gbAdd(g, rg, m, 0, 0.437, 0, { rx: -Math.PI / 2, cast: false, receive: false }); this.rips.push(r); this.ripM.push(m);
    }
    // mist: a few large soft billboards hugging the jet (low opacity, warm-lit)
    const mc = document.createElement('canvas'); mc.width = mc.height = 64; const mx = mc.getContext('2d');
    const gr = mx.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,240,225,0.5)'); gr.addColorStop(1, 'rgba(255,240,225,0)'); mx.fillStyle = gr; mx.fillRect(0, 0, 64, 64);
    this.mist = []; const mt = new THREE.CanvasTexture(mc);
    for (let i = 0; i < 6; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: mt, transparent: true, opacity: 0.12, depthWrite: false })); g.add(sp); this.mist.push(sp); }
  };
  GbCafe.prototype._updateFountain = function (t, gNow) {
    upd0.call(this, t, gNow);
    const g = 9.81 * gNow, vr = Math.sqrt(2 * 9.81 * 1.25), T = 2 * vr / g, land = 1.85 - 1.0 * T;   // ring-jet landing radius
    this.foam.scale.setScalar(land / 1.375); this.foam.material.map.offset.x = (t * 0.07) % 1;
    this.foamM.opacity = 0.45 + 0.08 * Math.sin(t * 7.3);
    this.foam2.material.map.offset.x = (-t * 0.11) % 1;
    for (let i = 0; i < 24; i++) {
      const j = i % 8, a = (j / 8) * Math.PI * 2, ph = ((t * 0.9 + hash1(i * 3.7) + Math.floor(i / 8) / 3) % 1);
      const r = 0.12 + 0.55 * ph, m = this.ripM[i];
      this.rips[i].position.set(Math.cos(a) * land, 0.437, Math.sin(a) * land); this.rips[i].scale.setScalar(r);
      m.opacity = 0.32 * (1 - ph) * MathX.smooth(ph, 0, 0.08);
    }
    const Hc = this.Hc || 1.5;
    for (let i = 0; i < this.mist.length; i++) {
      const ph = (t * 0.15 + i / this.mist.length) % 1, a = i * 2.1;
      this.mist[i].position.set(Math.cos(a) * 0.35, 1.6 + Hc * (0.3 + 0.6 * ph), Math.sin(a) * 0.35);
      this.mist[i].scale.setScalar(0.9 + 0.8 * ph); this.mist[i].material.opacity = 0.1 * Math.sin(Math.PI * ph);
    }
  };
})();
