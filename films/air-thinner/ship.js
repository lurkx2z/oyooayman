/* =====================================================================
   SHIP — the cruise ship "Coral Meridian" (fictional), built once (static meshes merged per material by the engine's
   Batcher) plus the few parts that change (the funnel's smoke points, the screen, the marina's line and tanks).
     atShip(set) → { funnelTop: [[x, y, z], …], marina, screen, bridgeWing, stairs, deckY }
   Coordinates and sizes: layout.js (AT_F). Everything long is built in pieces of 25 m or less (picture pitfalls: a
   triangle kilometres long gets its depth wrong in the software renderer), and nothing coplanar touches (3 cm apart).
   ===================================================================== */

// ---- textures ------------------------------------------------------------------------------------------------------
// the hull's side: antifouling red under the water, the navy boot-top, white above; portholes on decks 3 and 4; the
// lifeboat deck's recess (shaded) on decks 4–5. 24 m × 22 m (y −8.4 … 13.6) per tile
function atHullTex() {
  const Wm = 24, Hm = 22, w = 1024, h = 940, px = w / Wm, Y = (y) => h - (y + 8.4) / Hm * h;
  return atTex(atCanvas(w, h, (g) => {
    g.fillStyle = '#efefea'; g.fillRect(0, 0, w, h);
    // a faint vertical plate seam every 6 m, and grime under the portholes
    g.fillStyle = 'rgba(0,0,0,0.035)'; for (let x = 0; x < w; x += 6 * px) g.fillRect(x, Y(13.6), 2, Y(-0.6) - Y(13.6));
    // the recess band (the lifeboats hang in it): a shaded set-back
    g.fillStyle = '#c9ccd0'; g.fillRect(0, Y(13.4), w, Y(9.9) - Y(13.4));
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, Y(13.4), w, 10);
    for (let x = 0; x < w; x += 3 * px) { g.fillStyle = '#9aa3ad'; g.fillRect(x + 6, Y(13.1), 3 * px - 12, Y(10.6) - Y(13.1)); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x + 6, Y(13.1), 3 * px - 12, 6); }
    // portholes: deck 3 and deck 4
    for (const yc of [6.1, 8.9]) for (let x = 0.5 * px; x < w; x += 1.5 * px) { g.fillStyle = '#26303a'; g.beginPath(); g.ellipse(x, Y(yc), 0.22 * px, 0.22 * px, 0, 0, 6.29); g.fill(); g.fillStyle = 'rgba(160,190,215,0.45)'; g.beginPath(); g.ellipse(x - 2, Y(yc) - 2, 0.1 * px, 0.08 * px, 0, 0, 6.29); g.fill(); }
    // the boot-top (navy) and the antifouling
    g.fillStyle = '#14233a'; g.fillRect(0, Y(1.6), w, Y(-0.6) - Y(1.6));
    g.fillStyle = '#e8e6e0'; g.fillRect(0, Y(1.64), w, 3);
    g.fillStyle = '#7e2c20'; g.fillRect(0, Y(-0.6), w, h - Y(-0.6));
    g.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = Y(-0.6); y < h; y += 34) g.fillRect(0, y, w, 2);
  }), {});
}
// a deck of balconied cabins, 16 m × 2.9 m: four cabins (glass doors, partitions, a glass railing and its steel rail)
function atBalconyTex(seed = 1) {
  const r = new RNG(seed);
  return atTex(atCanvas(512, 96, (g, w, h) => {
    g.fillStyle = '#f2f2ee'; g.fillRect(0, 0, w, h);
    const cw = w / 4;
    for (let i = 0; i < 4; i++) {
      const x = i * cw;
      // the doors: dark glass with the sky in it, a curtain sometimes
      const gr = g.createLinearGradient(0, 8, 0, h - 6); gr.addColorStop(0, '#5f7f9e'); gr.addColorStop(0.5, '#2c4256'); gr.addColorStop(1, '#1d2b38');
      g.fillStyle = gr; g.fillRect(x + 6, 8, cw - 12, h - 14);
      if (r.next() < 0.35) { g.fillStyle = r.next() < 0.5 ? 'rgba(232,222,200,0.75)' : 'rgba(210,214,220,0.7)'; g.fillRect(x + 8, 10, (cw - 16) * r.range(0.2, 0.45), h - 18); }
      g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x + 6, 8, cw - 12, 4);
      // the partition between balconies
      g.fillStyle = '#e6e6e0'; g.fillRect(x, 4, 5, h - 4);
      // a towel or a chair on some
      if (r.next() < 0.3) { g.fillStyle = ['#2f7fb7', '#e3b23c', '#d55c4b', '#3fae8f'][r.int(0, 3)]; g.fillRect(x + r.range(14, cw - 40), h - 30, 22, 8); }
    }
    // the glass railing (the lower 40 %: blue-green tint) and its rail
    g.fillStyle = 'rgba(150,200,210,0.28)'; g.fillRect(0, h * 0.58, w, h * 0.42);
    g.fillStyle = '#d8dcdf'; g.fillRect(0, h * 0.56, w, 3);
    g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, w, 5);
  }), {});
}
// windows in a white wall (lounges, the spa, the funnel housing): 8 m × 3 m per tile
function atWindowTex(tint = '#2e4458') {
  return atTex(atCanvas(256, 96, (g, w, h) => {
    g.fillStyle = '#f0f0ec'; g.fillRect(0, 0, w, h);
    const gr = g.createLinearGradient(0, 16, 0, h - 12); gr.addColorStop(0, '#7a9ab6'); gr.addColorStop(0.45, tint); gr.addColorStop(1, '#1c2832');
    g.fillStyle = gr; g.fillRect(4, 18, w - 8, h - 34);
    g.fillStyle = '#e8e8e4'; for (let x = 0; x < w; x += 64) g.fillRect(x, 18, 4, h - 34);
  }), {});
}
// teak decking (planks along x), 4 m × 4 m
function atTeakTex() {
  const r = new RNG(77);
  return atTex(atCanvas(512, 512, (g, w, h) => {
    const n = 32, ph = h / n;
    for (let i = 0; i < n; i++) { const k = r.range(-12, 12); g.fillStyle = `rgb(${156 + k},${122 + k * 0.8},${92 + k * 0.6})`; g.fillRect(0, i * ph, w, ph);
      for (let x = r.range(0, 200); x < w; x += r.range(180, 300)) { g.fillStyle = 'rgba(40,24,10,0.35)'; g.fillRect(x, i * ph, 2, ph); }
      g.fillStyle = 'rgba(30,20,12,0.55)'; g.fillRect(0, i * ph + ph - 2, w, 2);
      for (let j = 0; j < 40; j++) { g.fillStyle = `rgba(${r.next() < 0.5 ? '255,230,200' : '60,40,20'},0.06)`; g.fillRect(r.range(0, w), i * ph + r.range(1, ph - 3), r.range(10, 50), 1); } }
  }), {});
}
// pool tiles (turquoise, a darker grout), 2 m × 2 m
function atTileTex(base = [92, 196, 214]) {
  return atTex(atCanvas(256, 256, (g, w, h) => {
    g.fillStyle = `rgb(${base[0] - 30},${base[1] - 40},${base[2] - 40})`; g.fillRect(0, 0, w, h);
    const r = new RNG(5), s = 16;
    for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) { const k = r.range(-10, 10); g.fillStyle = `rgb(${base[0] + k},${base[1] + k},${base[2] + k})`; g.fillRect(x + 1, y + 1, s - 2, s - 2); }
  }), {});
}

// set a geometry's UVs to metres / tile (planar on the face it is mostly facing)
function atUVMetres(g, tile = 1, axis = 'auto') {
  const p = g.attributes.position, n = g.attributes.normal || (g.computeVertexNormals(), g.attributes.normal), uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i));
    const a = axis !== 'auto' ? axis : ny > nx && ny > nz ? 'y' : nx > nz ? 'x' : 'z';
    if (a === 'y') { uv[i * 2] = x / tile; uv[i * 2 + 1] = z / tile; } else if (a === 'x') { uv[i * 2] = z / tile; uv[i * 2 + 1] = y / tile; } else { uv[i * 2] = x / tile; uv[i * 2 + 1] = y / tile; }
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

// ---- the hull --------------------------------------------------------------------------------------------------------
// a loft over (u along the length, k round the section): the keel line rises under the stern (the pods hang there), the
// stem rakes forward, the bow is fine low down and full up top; a flat transom closes the stern
const AT_HULL = (() => {
  const F = AT_F, top = F.deck(6);
  const keelY = (x) => -F.draft + 6.4 * MathX.smooth(x, 100, 145);                 // the bottom rises aft (−2.0 at the transom)
  const stemX = (y) => F.bow + 9.5 - 9.5 * MathX.clamp((y + F.draft) / (top + F.draft), 0, 1) ** 0.8;   // the stem rakes forward with height
  // half-width at x, height y
  const half = (x, y) => {
    const b = F.B / 2, x0 = stemX(y), u = MathX.clamp((x - x0) / (95 - 0), 0, 1);
    const fy = MathX.clamp((y - keelY(x)) / 9, 0, 1);
    let w = Math.pow(Math.sin(Math.min(1, u) * Math.PI / 2), 0.62 + 0.5 * (1 - fy));      // fuller up top (flare)
    if (x > 120) w *= 1 - 0.1 * MathX.smooth(x, 120, 145);                               // the round stern
    const bil = MathX.clamp((y - keelY(x)) / 2.6, 0, 1);                                 // the bilge
    return b * w * (0.86 + 0.14 * Math.sin(bil * Math.PI / 2));
  };
  return { top, keelY, stemX, half };
})();
const atHullHalf = (x, y) => AT_HULL.half(x, y);

function atHullGeo() {
  const H = AT_HULL, F = AT_F, top = H.top;
  // the heights: dense at the waterline's colours (the texture does the colours; the rows follow the shape)
  const rows = [0, 0.04, 0.1, 0.2, 0.32, 0.45, 0.6, 0.75, 0.88, 1.0];        // fraction from the keel to the top
  // stations along the length: dense at the bow
  const us = []; for (let i = 0; i <= 90; i++) { const v = i / 90; us.push(Math.pow(v, 1.6)); }
  const pos = [], uv = [], idx = [], R = rows.length;
  const pt = (u, k, side) => {
    const y0 = MathX.lerp(H.keelY(MathX.lerp(H.stemX(-F.draft), F.stern, u)), top, rows[k]);
    const x = MathX.lerp(H.stemX(y0), F.stern, u), yk = MathX.lerp(H.keelY(x), top, rows[k]), w = H.half(x, yk);
    return [x, yk, side * w];
  };
  for (const side of [1, -1]) {
    const base = pos.length / 3;
    us.forEach((u) => { for (let k = 0; k < R; k++) { const p = pt(u, k, side); pos.push(...p); uv.push(p[0] / 24, (p[1] + 8.4) / 22); } });
    for (let i = 0; i < us.length - 1; i++) for (let k = 0; k < R - 1; k++) {
      const a = base + i * R + k, b = a + 1, c = a + R, d = c + 1;
      if (side > 0) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
    }
  }
  // the bottom: join the two keel rows
  { const nb = us.length; for (let i = 0; i < nb - 1; i++) { const a = i * R, b = (i + 1) * R, c = nb * R + i * R, d = nb * R + (i + 1) * R; idx.push(a, c, b, b, c, d); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  // the transom: a flat face at x = stern, from each side's last station
  const last = us.length - 1, sh = [];
  for (let k = 0; k < R; k++) sh.push(pt(1, k, 1));
  for (let k = R - 1; k >= 0; k--) sh.push(pt(1, k, -1));
  const shape = new THREE.Shape(sh.map((p) => new THREE.Vector2(p[2], p[1])));
  const tg = new THREE.ShapeGeometry(shape); tg.rotateY(Math.PI / 2); tg.translate(F.stern, 0, 0);
  // (ShapeGeometry lies in xy: after the turn its x is −z; flip so it faces aft)
  const tp = tg.attributes.position; for (let i = 0; i < tp.count; i++) { tp.setX(i, F.stern); }
  tg.computeVertexNormals();
  const tuv = new Float32Array(tp.count * 2); for (let i = 0; i < tp.count; i++) { tuv[i * 2] = tp.getZ(i) / 24; tuv[i * 2 + 1] = (tp.getY(i) + 8.4) / 22; } tg.setAttribute('uv', new THREE.BufferAttribute(tuv, 2));
  // the deck over the hull's top (the forecastle: the bow's mooring deck at deck 6), a fan from the centre line
  const dk = [], didx = [];
  us.forEach((u) => { const a = pt(u, R - 1, 1), b = pt(u, R - 1, -1); dk.push(a[0], top, a[2], b[0], top, b[2]); });
  for (let i = 0; i < us.length - 1; i++) { const a = i * 2, b = a + 1, c = a + 2, d = a + 3; didx.push(a, b, c, b, d, c); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(dk, 3)); dg.setIndex(didx); dg.computeVertexNormals(); atUVMetres(dg, 4, 'y');
  void last;
  return { side: g, transom: tg, deck: dg };
}

// ---- the whole ship --------------------------------------------------------------------------------------------------
function atShip(set) {
  const F = AT_F, S = set.scene, B = new Batcher(), D = F.deck, out = { deckY: D };
  const white = atStd('#f1f1ec', 0.55), whiteM = atStd('#e4e5e2', 0.6), grey = atStd('#9aa1a8', 0.5, 0.3), dark = atStd('#1e2730', 0.35, 0.2), steel = atStd('#c3c8cc', 0.35, 0.6);
  const glassM = new THREE.MeshStandardMaterial({ color: '#9fc4d2', roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.32, depthWrite: false });
  const navy = atStd('#14233a', 0.45, 0.2), coral = atStd('#f06a4a', 0.45), orange = atStd('#f08a1c', 0.45), teak = new THREE.MeshStandardMaterial({ map: atTeakTex(), roughness: 0.8 });
  out.mats = { white, glassM, teak, steel, dark, navy, coral, orange };
  // ---- the hull
  const hg = atHullGeo(), hullTex = atHullTex(); hullTex.wrapS = THREE.RepeatWrapping; hullTex.wrapT = THREE.ClampToEdgeWrapping;
  const hullM = new THREE.MeshStandardMaterial({ map: hullTex, roughness: 0.5, metalness: 0.05 });
  for (const g of [hg.side, hg.transom]) { const m = new THREE.Mesh(g, hullM); m.castShadow = m.receiveShadow = true; S.add(m); }
  B.add(hg.deck, atStd('#8d969c', 0.8), null);
  // ---- the cabin decks 6–14: a core, balconies down both sides (a plane 0.4 m out), a white lip at every floor
  const bal = [atBalconyTex(3), atBalconyTex(8)].map((t) => { t.wrapS = THREE.RepeatWrapping; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.45, metalness: 0.05 }); });
  const winM = (() => { const t = atWindowTex(); t.wrapS = t.wrapT = THREE.RepeatWrapping; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.4 }); })();
  out.winM = winM;
  const x0 = (k) => -101 + (k >= 12 ? (k - 11) * 1.6 : 0);                   // the front face steps back a little near the top
  const x1 = (k) => (k <= 14 ? 100 + (14 - k) * 5 : 95);                      // the aft terraces: each deck 5 m further aft than the one above
  out.x1 = x1; out.x0 = x0;
  const zh = F.B / 2 - 0.4;                                                   // the core's half-width (the balconies are 0.4 m further out)
  for (let k = 6; k <= 14; k++) {
    const y0 = D(k), y1 = D(k + 1), a = x0(k), b = x1(k);
    // the core, in 25 m pieces (deck 14's has a hole under the pool: deck.js puts the pool's basin in it)
    const hole = k === 14 ? [F.pool.x0 - 0.5, F.pool.x1 + 0.5, F.pool.z0 - 0.5, F.pool.z1 + 0.5] : null;
    const xs = hole ? [[a, hole[0]], [hole[0], hole[1], 1], [hole[1], b]] : [[a, b]];
    for (const [xa, xb, hz] of xs) for (let x = xa; x < xb - 0.01; x += 25) { const e = Math.min(xb, x + 25), cy = (y0 + y1) / 2, hy = y1 - y0 - 0.02;
      if (!hz) B.box(e - x, hy, zh * 2, (x + e) / 2, cy, 0, whiteM);
      else { B.box(e - x, hy, zh + hole[2], (x + e) / 2, cy, (-zh + hole[2]) / 2, whiteM); B.box(e - x, hy, zh - hole[3], (x + e) / 2, cy, (zh + hole[3]) / 2, whiteM); } }
    // the balcony faces (UV: 16 m and one deck per tile)
    for (const sd of [1, -1]) for (let x = a + 1; x < b - 1.01; x += 24) {
      const e = Math.min(b - 1, x + 24), z = sd * (zh + 0.4);
      const g = sd > 0 ? Geo.quad([x, y0, z], [e, y0, z], [e, y1, z], [x, y1, z], x / 16, 0, e / 16, 1) : Geo.quad([e, y0, z], [x, y0, z], [x, y1, z], [e, y1, z], e / 16, 0, x / 16, 1);
      B.add(g, bal[(k + (sd > 0 ? 0 : 1)) % 2], null);
    }
    // the lip at this deck's floor (it runs round the front too), and the balconies' end walls
    for (const sd of [1, -1]) { for (let x = a; x < b - 0.01; x += 25) { const e = Math.min(b, x + 25); B.box(e - x, 0.26, 0.5, (x + e) / 2, y0 + 0.1, sd * (zh + 0.27), white); }
      B.box(0.5, y1 - y0, 0.9, a + 0.5, (y0 + y1) / 2, sd * (zh + 0.2), white); B.box(0.5, y1 - y0, 0.9, b - 0.5, (y0 + y1) / 2, sd * (zh + 0.2), white); }
    // the front face: a band of lounge windows (UV in 8 m)
    B.add(Geo.quad([a - 0.03, y0, -zh], [a - 0.03, y0, zh], [a - 0.03, y1, zh], [a - 0.03, y1, -zh], 0, 0, (2 * zh) / 8, 1), winM, null);
    // the aft face (the terrace's back wall): windows; the terrace floor is the deck below's roof (teak)
    B.add(Geo.quad([b + 0.03, y0, zh], [b + 0.03, y0, -zh], [b + 0.03, y1, -zh], [b + 0.03, y1, zh], 0, 0, (2 * zh) / 8, 1), winM, null);
    if (k < 14) { const t1 = x1(k + 1); B.add(atUVMetres(Geo.flat(t1, b, -zh - 0.4, zh + 0.4, y1 + 0.03), 4, 'y'), teak, null);
      // the terrace's glass railing on its aft edge and its sides
      // (an opening at z 11.5…13.7 for the stairs down to the next terrace)
      for (const [za, zb] of [[-zh, -6], [-6, 6], [6, 11.5], [13.7, zh]]) { B.box(0.04, 1.1, zb - za, b - 0.25, y1 + 0.6, (za + zb) / 2, glassM, 0, { noShadow: true }); B.box(0.08, 0.06, zb - za, b - 0.25, y1 + 1.17, (za + zb) / 2, steel); } }
  }
  // the roof of deck 14 at its front (the bridge's top) and the forward lounge's roof
  // ---- the bridge: the front of decks 13–14, raked dark windows across the whole width, wings out to ±21.5 m
  { const y0 = D(13), y1 = D(15), xf = x0(13) - 0.6;
    B.add(Geo.quad([xf, y0 + 0.9, -zh], [xf, y0 + 0.9, zh], [xf + 0.8, y1 - 0.3, zh], [xf + 0.8, y1 - 0.3, -zh], 0, 0, 1, 1), dark, null);
    for (const sd of [1, -1]) { B.box(7, 0.4, 4.2, xf + 4.5, D(14) + 0.2, sd * (zh + 2.1), white); B.box(7, 1.1, 0.3, xf + 4.5, D(14) + 0.95, sd * (zh + 4.05), white);
      B.box(4.5, 2.2, 3.6, xf + 4.2, D(14) + 1.5, sd * (zh + 1.85), white); B.box(4.4, 1.0, 0.04, xf + 4.2, D(14) + 2.0, sd * (zh + 3.68), dark); }
    out.bridgeWing = [xf + 4.5, D(14) + 0.4, -(zh + 2.1)];
  }
  // ---- the forward block over deck 15 (the spa): x −101 … −78, up to deck 18; the big screen on its aft face
  { const a = x0(14), b = F.open.x0, y0 = D(15), y1 = D(18);
    B.box(b - a, y1 - y0, zh * 2, (a + b) / 2, (y0 + y1) / 2, 0, whiteM);
    for (const sd of [1, -1]) B.add(sd > 0 ? Geo.quad([a, y0, zh + 0.03], [b, y0, zh + 0.03], [b, y1, zh + 0.03], [a, y1, zh + 0.03], 0, 0, (b - a) / 8, (y1 - y0) / 3) : Geo.quad([b, y0, -zh - 0.03], [a, y0, -zh - 0.03], [a, y1, -zh - 0.03], [b, y1, -zh - 0.03], 0, 0, (b - a) / 8, (y1 - y0) / 3), winM, null);
    B.add(Geo.quad([a - 0.03, y0, -zh], [a - 0.03, y0, zh], [a - 0.03, y1, zh], [a - 0.03, y1, -zh], 0, 0, (2 * zh) / 8, (y1 - y0) / 3), winM, null);
    // its aft face is plain (the screen hangs on it)
    // the mast on top: a tapering post, a cross-tree, two radar domes
    B.add(new THREE.CylinderGeometry(0.5, 0.9, 12, 10), white, Geo.matrix(a + 8, y1 + 6, 0)); B.box(0.6, 0.6, 9, a + 8, y1 + 10, 0, white);
    for (const sd of [1, -1]) B.add(new THREE.SphereGeometry(1.1, 14, 10), white, Geo.matrix(a + 8, y1 + 11.2, sd * 3.6));
  }
  // ---- deck 15's floor over the open area (around the pool: deck.js lays the pool, the tubs and everything on it)
  // ---- the aft block over deck 15: x 44 … 95, decks 15–16, windows; its roof the sun deck (teak)
  { const a = F.open.x1, b = x1(15), y0 = D(15), y1 = D(17);
    for (let x = a; x < b - 0.01; x += 25) { const e = Math.min(b, x + 25); B.box(e - x, y1 - y0, zh * 2, (x + e) / 2, (y0 + y1) / 2, 0, whiteM); }
    for (const sd of [1, -1]) B.add(sd > 0 ? Geo.quad([a, y0, zh + 0.03], [b, y0, zh + 0.03], [b, y1, zh + 0.03], [a, y1, zh + 0.03], 0, 0, (b - a) / 8, (y1 - y0) / 3) : Geo.quad([b, y0, -zh - 0.03], [a, y0, -zh - 0.03], [a, y1, -zh - 0.03], [b, y1, -zh - 0.03], 0, 0, (b - a) / 8, (y1 - y0) / 3), winM, null);
    B.add(Geo.quad([a - 0.03, y0, -zh], [a - 0.03, y0, zh], [a - 0.03, y1, zh], [a - 0.03, y1, -zh], 0, 0, (2 * zh) / 8, (y1 - y0) / 3), winM, null);
    B.add(Geo.quad([b + 0.03, y0, zh], [b + 0.03, y0, -zh], [b + 0.03, y1, -zh], [b + 0.03, y1, zh], 0, 0, (2 * zh) / 8, (y1 - y0) / 3), winM, null);
    B.add(atUVMetres(Geo.flat(a, b, -zh, zh, y1 + 0.03), 4, 'y'), teak, null);
    B.add(atUVMetres(Geo.flat(x1(15), x1(14), -zh - 0.4, zh + 0.4, D(15) + 0.03), 4, 'y'), teak, null);   // deck 14's terrace, under the aft block's end
    for (let z = -zh; z < zh - 0.01; z += 12) { const e = Math.min(zh, z + 12); B.box(0.04, 1.1, e - z, b - 0.25, y1 + 0.6, (z + e) / 2, glassM, 0, { noShadow: true }); B.box(0.08, 0.06, e - z, b - 0.25, y1 + 1.17, (z + e) / 2, steel); }
    out.aftBlock = { a, b, y0, y1 };
  }
  // ---- the funnel: a raked, rounded stack (navy, a coral band round it: straight, since the wrap's seam would saw a
  // wave), two exhausts
  { const fx0 = F.funnel.x0, fx1 = F.funnel.x1, yb = D(17), yt = F.funnel.top, L = fx1 - fx0, W = 11;
    const sh = new THREE.Shape(); const r = 4.2; sh.moveTo(-L / 2 + r, -W / 2); sh.lineTo(L / 2 - r, -W / 2); sh.quadraticCurveTo(L / 2, -W / 2, L / 2, -W / 2 + r); sh.lineTo(L / 2, W / 2 - r); sh.quadraticCurveTo(L / 2, W / 2, L / 2 - r, W / 2);
    sh.lineTo(-L / 2 + r, W / 2); sh.quadraticCurveTo(-L / 2, W / 2, -L / 2, W / 2 - r); sh.lineTo(-L / 2, -W / 2 + r); sh.quadraticCurveTo(-L / 2, -W / 2, -L / 2 + r, -W / 2);
    const fg = new THREE.ExtrudeGeometry(sh, { depth: yt - yb, bevelEnabled: false, curveSegments: 6 }); fg.rotateX(-Math.PI / 2);
    // rake it aft (x grows with height) and taper
    const p = fg.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), k = y / (yt - yb); p.setX(i, p.getX(i) * (1 - 0.18 * k) + 5 * k); p.setZ(i, p.getZ(i) * (1 - 0.12 * k)); }
    fg.computeVertexNormals();
    const ftex = atTex(atCanvas(512, 256, (g, w, h) => { g.fillStyle = '#14233a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f06a4a'; g.fillRect(0, h * 0.56, w, h * 0.1); g.fillStyle = '#f6f2ea'; g.fillRect(0, h * 0.68, w, h * 0.025);
      g.fillStyle = '#f2f2ee'; g.fillRect(0, h * 0.86, w, h * 0.14); g.fillStyle = '#0d1522'; g.fillRect(0, 0, w, h * 0.05); }), { repeat: false });
    const fuv = new Float32Array(p.count * 2); for (let i = 0; i < p.count; i++) { fuv[i * 2] = (Math.atan2(p.getZ(i), p.getX(i)) / (Math.PI * 2) + 0.5) * 2; fuv[i * 2 + 1] = p.getY(i) / (yt - yb); } fg.setAttribute('uv', new THREE.BufferAttribute(fuv, 2));
    const fm = new THREE.Mesh(fg, new THREE.MeshStandardMaterial({ map: ftex, roughness: 0.45 })); fm.position.set((fx0 + fx1) / 2, yb, 0); fm.castShadow = fm.receiveShadow = true; S.add(fm);
    out.funnelTop = [[(fx0 + fx1) / 2 + 2.0, yt + 1.6, -1.6], [(fx0 + fx1) / 2 + 4.6, yt + 1.6, 1.6]];
    for (const q of out.funnelTop) B.add(new THREE.CylinderGeometry(1.1, 1.2, 3.6, 12), atStd('#151a20', 0.6), Geo.matrix(q[0], q[1] - 1.8, q[2]));
    out.funnel = { x: (fx0 + fx1) / 2, yb, yt };
  }
  // ---- the waterslide: two tubes spiralling down round a tower in front of the funnel, onto deck 15
  { const tx = 47, tz = -10.5, ytop = D(17) + 7;
    B.add(new THREE.CylinderGeometry(0.9, 1.1, ytop - D(15), 10), white, Geo.matrix(tx, (ytop + D(15)) / 2, tz));
    B.box(5, 0.4, 5, tx, ytop, tz, white);
    const tube = (col, ph, turns, r0, end) => {
      const pts = []; const N = 60;
      for (let i = 0; i <= N; i++) { const u = i / N, a = ph + u * turns * Math.PI * 2, r = r0 + 1.5 * u, y = ytop - 0.6 - u * (ytop - D(15) - 1.6); pts.push(new THREE.Vector3(tx + Math.cos(a) * r, y, tz + Math.sin(a) * r)); }
      pts.push(new THREE.Vector3(end[0], D(15) + 1.0, end[1]));
      const c = new THREE.CatmullRomCurve3(pts); B.add(new THREE.TubeGeometry(c, 160, 0.62, 14, false), atStd(col, 0.3, 0.05), null);
    };
    tube('#ff8a1e', 0, 1.6, 4.2, [tx - 9, tz - 3]); tube('#18b7c9', Math.PI, 1.35, 6.0, [tx - 11, tz + 2.5]);
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + 0.4; B.add(new THREE.CylinderGeometry(0.16, 0.16, ytop - D(15) - 2, 6), steel, Geo.matrix(tx + Math.cos(a) * 6.8, (ytop + D(15)) / 2 - 1, tz + Math.sin(a) * 6.8)); }
  }
  // ---- lifeboats: ten a side on deck 5, in the recess (orange, a white top), on grey davits
  { const lb = atStd('#f2741f', 0.4), lbTop = atStd('#f4f4ee', 0.5);
    for (const sd of [1, -1]) for (let i = 0; i < 10; i++) {
      const x = -72 + i * 15.6, z = sd * (atHullHalf(x, 12) + 0.6), y = 11.4;
      const g = new THREE.CapsuleGeometry(1.75, 7.0, 4, 12); g.rotateZ(Math.PI / 2); g.scale(1, 0.85, 1);
      B.add(g, lb, Geo.matrix(x, y, z)); B.box(7.4, 0.5, 2.6, x, y + 1.35, z, lbTop);
      for (const dx of [-3.4, 3.4]) { B.box(0.3, 3.6, 0.3, x + dx, y + 1.0, z - sd * 1.6, grey); B.box(0.3, 0.3, 2.4, x + dx, y + 2.8, z - sd * 0.5, grey); }
    }
  }
  // ---- the bow: bulwarks round the mooring deck; a mast with the ship's name board
  // ---- the aft terraces' stairs (port side, z +13): one flight from each deck down to the terrace of the one below
  out.stairs = [];
  { const step = atStd('#d9dbd6', 0.7);
    for (let k = 14; k >= 6; k--) {
      const xa = x1(k), ya = D(k + 1), yb = D(k), zc = 12.6, nS = 16, run = 4.4;      // from terrace k+1 (it ends at x1(k)) down onto terrace k
      for (let i = 0; i < nS; i++) { const u = (i + 0.5) / nS; B.box(run / nS + 0.02, 0.06, 1.5, xa + 0.3 + u * run, ya - (i + 1) * (ya - yb) / nS + 0.03, zc, step); }
      // its stringer and handrail (glass)
      const g = new THREE.BoxGeometry(Math.hypot(run, ya - yb) + 0.4, 0.06, 0.06); g.rotateZ(-Math.atan2(ya - yb, run));
      for (const dz of [-0.8, 0.8]) B.add(g, steel, Geo.matrix(xa + 0.3 + run / 2, (ya + yb) / 2 + 0.95, zc + dz));
      out.stairs.push({ k, x0: xa + 0.3, x1: xa + 0.3 + run, y0: ya, y1: yb, z: zc });
    }
  }
  // ---- the marina: deck 2's platform folded out of the transom; its doorway; the rail; the davit; the dive flag
  { const M = F.marina, y = M.y;
    B.box(M.x1 - M.x0, 0.32, M.w, (M.x0 + M.x1) / 2, y - 0.16, 0, atStd('#c9ccc6', 0.75));
    B.box(M.x1 - M.x0 - 0.2, 0.03, M.w - 0.2, (M.x0 + M.x1) / 2, y + 0.015, 0, atStd('#4d5a63', 0.9));        // the grey non-slip mat
    B.add(Geo.quad([F.stern + 0.03, y, 3.2], [F.stern + 0.03, y, -3.2], [F.stern + 0.03, y + 2.6, -3.2], [F.stern + 0.03, y + 2.6, 3.2]), atStd('#1a2026', 0.9), null);   // the doorway (dark)
    for (const sd of [1, -1]) { B.box(M.x1 - M.x0, 0.05, 0.05, (M.x0 + M.x1) / 2, y + 1.05, sd * (M.w / 2 - 0.1), steel); for (let x = M.x0 + 0.5; x < M.x1; x += 1.4) B.box(0.05, 1.05, 0.05, x, y + 0.52, sd * (M.w / 2 - 0.1), steel); }
    // the davit: a post on the platform's port corner, an arm out over the line
    B.box(0.25, 3.4, 0.25, M.x1 - 0.5, y + 1.7, 1.6, steel); B.box(1.6, 0.2, 0.2, M.x1 + 0.1, y + 3.3, 0.8, steel);
    // the dive shop's sign over the door (a turquoise board)
    B.box(4.2, 0.6, 0.06, F.stern + 0.06, y + 3.0, 0, atStd('#17a6b6', 0.5), Math.PI / 2);
    out.marina = { y, x0: M.x0, x1: M.x1 };
  }
  // ---- under the stern: two pods (a propeller at the front of each, pulling), their struts; the rudder-less skeg
  { const pm = atStd('#6e3a2c', 0.6, 0.2), prop = atStd('#b88a3a', 0.25, 0.85);
    for (const sd of [1, -1]) {
      const x = 126, z = sd * 7.6, ky = AT_HULL.keelY(x), y = ky - 2.6;
      const body = new THREE.CapsuleGeometry(1.35, 6.5, 6, 14); body.rotateZ(Math.PI / 2); B.add(body, pm, Geo.matrix(x, y, z));
      B.box(3.8, ky - y + 0.6, 0.7, x + 0.6, (ky + y) / 2 + 0.3, z, pm);
      const hub = new THREE.SphereGeometry(0.75, 12, 8); B.add(hub, prop, Geo.matrix(x - 4.9, y, z));
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + (sd > 0 ? 0.3 : 0.9), bl = new THREE.BoxGeometry(0.16, 2.6, 1.1); bl.translate(0, 1.6, 0); bl.rotateY(0.45);
        B.add(bl, prop, Geo.matrix(x - 5.0, y, z, a, 0, 0)); }
    }
    B.box(9, 2.2, 0.8, 136, AT_HULL.keelY(136) - 0.9, 0, pm);
  }
  // a bulbous bow under the water
  { const g = new THREE.SphereGeometry(1, 16, 10); g.scale(9, 2.6, 2.6); B.add(g, atStd('#7e2c20', 0.6), Geo.matrix(AT_HULL.stemX(-5) + 6.5, -5.4, 0)); }
  const grp = new THREE.Group(); B.build(grp, 'ship'); S.add(grp); out.group = grp;
  return out;
}
