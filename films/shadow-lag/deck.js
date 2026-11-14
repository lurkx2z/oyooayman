/* =====================================================================
   DECK — one floor of the multi-storey car park (layout.js), built into the current set's scene:
     the floor (one painted canvas: concrete, bay lines, the walkway, arrows, stains, tyre tracks), the ramp down,
     the columns (hazard paint, the level's roundel), beams, soffit, pipes, parapets with rails, the stair core and its
     lit door, the white plant room, the convex mirror, the LED battens, the town below.
   shBuildDeck(level) → { lamps, door, mirror, ... }. Painted marks are drawn into textures (nothing coplanar: no
   z-fighting); signs stand ≥ 1.5 cm proud of their walls.
   ===================================================================== */

const SH_DECK_PAINT = { 4: { roundel: '#1f4f9a', name: 'BLUE' }, 2: { roundel: '#1f7a4a', name: 'GREEN' } };

// a tiling concrete texture (grey, mottled, pitted)
function shConcreteCanvas(seed, base = [112, 110, 104], w = 512, h = 512, o = {}) {
  const r = new RNG(seed);
  return shCanvas(w, h, (g) => {
    const img = g.createImageData(w, h), d = img.data, ph = r.range(0, 50);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = 0.55 * noise1(x * 0.011 + ph, y * 0.011) + 0.3 * noise1(x * 0.045, y * 0.045 + ph) + 0.15 * (hash2(x, y + seed) - 0.5);
      const k = 1 + (o.k || 0.16) * n, i = (y * w + x) * 4;
      d[i] = base[0] * k; d[i + 1] = base[1] * k; d[i + 2] = base[2] * k; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    for (let i = 0; i < (o.pits || 500); i++) { g.fillStyle = `rgba(0,0,0,${r.range(0.08, 0.25)})`; g.fillRect(r.range(0, w), r.range(0, h), r.range(1, 2.5), r.range(1, 2.5)); }
    if (o.boards) for (let x = 0; x < w; x += w / o.boards) { g.fillStyle = 'rgba(0,0,0,0.07)'; g.fillRect(x, 0, 2, h); }
  });
}

// the deck's floor, painted: x −38.6…40.6, z −16.9…16.9 → 4096 × 2048 px
function shDeckFloorCanvas(level) {
  const F = SH_F, X0 = F.deck.x[0], X1 = F.deck.x[1], Z0 = F.deck.z[0], Z1 = F.deck.z[1], W = 4096, H = 2048;
  const kx = W / (X1 - X0), kz = H / (Z1 - Z0), px = (x) => (x - X0) * kx, pz = (z) => (z - Z0) * kz;
  const r = new RNG(400 + level);
  return shCanvas(W, H, (g) => {
    // concrete: a large mottle (wet patches darker), fine grain
    const img = g.createImageData(W, H), d = img.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const wx = X0 + x / kx, wz = Z0 + y / kz;
      const n = 0.5 * noise1(wx * 0.09 + level, wz * 0.09) + 0.3 * noise1(wx * 0.6, wz * 0.6 + 3) + 0.2 * (hash2(x, y) - 0.5);
      const damp = MathX.smooth(Math.abs(wz), 15.2, 16.9) * 0.18 + 0.1 * MathX.smooth(noise1(wx * 0.05 + 9, wz * 0.07), 0.3, 0.6);
      const v = 104 * (1 + 0.13 * n) * (1 - damp), i = (y * W + x) * 4;
      d[i] = v * 1.0; d[i + 1] = v * 0.985; d[i + 2] = v * 0.95; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    // tyre tracks along the aisles (darker, rubbery), oil stains in the bays
    for (const az of [F.aisle.n, F.aisle.s]) for (const off of [-0.78, 0.78]) {
      const gr = g.createLinearGradient(0, pz(az + off - 0.3), 0, pz(az + off + 0.3));
      gr.addColorStop(0, 'rgba(20,18,16,0)'); gr.addColorStop(0.5, 'rgba(20,18,16,0.2)'); gr.addColorStop(1, 'rgba(20,18,16,0)');
      g.fillStyle = gr; g.fillRect(0, pz(az + off - 0.3), W, pz(az + off + 0.3) - pz(az + off - 0.3));
    }
    const rows = [[-16.6, -11.9, -1], [-4.5, 0, 1], [0, 4.5, -1], [11.9, 16.6, 1]];   // [z0, z1, which end the engine is (−1 north)]
    for (const [z0, z1, e] of rows) for (let x = -36; x < 36; x += F.bays) {
      if (r.next() < 0.75) { const cx = x + 1.2 + r.range(-0.3, 0.3), cz = (e < 0 ? z0 + 1.1 : z1 - 1.1) + r.range(-0.2, 0.2);
        const gr = g.createRadialGradient(px(cx), pz(cz), 0, px(cx), pz(cz), r.range(14, 30)); gr.addColorStop(0, `rgba(10,9,8,${r.range(0.25, 0.5)})`); gr.addColorStop(1, 'rgba(10,9,8,0)');
        g.fillStyle = gr; g.beginPath(); g.ellipse(px(cx), pz(cz), r.range(18, 34), r.range(12, 24), r.range(0, 3), 0, 6.3); g.fill(); }
    }
    // bay lines (white, worn): the separators across each row, every 2.4 m from x −36 to 36
    const line = (x0, z0, x1, z1, wd, col) => { g.strokeStyle = col; g.lineWidth = wd * kx; g.beginPath(); g.moveTo(px(x0), pz(z0)); g.lineTo(px(x1), pz(z1)); g.stroke(); };
    g.setLineDash([]);
    for (const [z0, z1] of rows) for (let x = -36; x <= 36.01; x += F.bays) line(x, z0 + 0.1, x, z1 - 0.1, 0.1, `rgba(228,226,214,${r.range(0.6, 0.85)})`);
    // the row ends (a line along the aisle edge, each bay's mouth)
    for (const z of [-11.9, -4.5, 4.5, 11.9]) for (let x = -36; x < 36; x += F.bays) line(x + 0.05, z, x + 0.45, z, 0.1, 'rgba(228,226,214,0.7)');
    // worn speckle over the paint
    for (let i = 0; i < 26000; i++) { g.fillStyle = `rgba(${r.next() < 0.5 ? '90,88,82' : '60,58,54'},${r.range(0.2, 0.5)})`; g.fillRect(r.range(0, W), r.range(0, H), r.range(1, 3), r.range(1, 3)); }
    // the walkway from the stair door (yellow hatching between yellow lines)
    g.save(); g.beginPath(); g.rect(px(-38.6), pz(-9.8), px(-35.6) - px(-38.6), pz(-6.6) - pz(-9.8)); g.clip();
    g.strokeStyle = 'rgba(214,176,40,0.78)'; g.lineWidth = 0.14 * kx;
    for (let k = -12; k < 12; k++) { g.beginPath(); g.moveTo(px(-38.6 + k * 0.6), pz(-9.8)); g.lineTo(px(-38.6 + k * 0.6 + 3.2), pz(-6.6)); g.stroke(); }
    g.restore();
    g.strokeStyle = 'rgba(214,176,40,0.85)'; g.lineWidth = 0.1 * kx; g.strokeRect(px(-38.6), pz(-9.8), px(-35.6) - px(-38.6), pz(-6.6) - pz(-9.8));
    // arrows (white) along the aisles: east along the north aisle (to the ramp), west along the south one
    const arrow = (x, z, dir) => { g.save(); g.translate(px(x), pz(z)); g.scale(dir * kx, kz); g.fillStyle = 'rgba(230,228,218,0.82)';
      g.beginPath(); g.moveTo(-1.6, -0.12); g.lineTo(0.3, -0.12); g.lineTo(0.3, -0.42); g.lineTo(1.4, 0); g.lineTo(0.3, 0.42); g.lineTo(0.3, 0.12); g.lineTo(-1.6, 0.12); g.closePath(); g.fill(); g.restore(); };
    for (const x of [-26, -12, 2, 16, 28]) { arrow(x, F.aisle.n, 1); arrow(x + 4, F.aisle.s, -1); }
    // "EXIT" before the ramp (reads driving east), "LEVEL n" by the stairs
    const word = (txt, x, z, size, rot, col = 'rgba(232,230,220,0.85)') => { g.save(); g.translate(px(x), pz(z)); g.rotate(rot); g.scale(kx / 40, kz / 40); g.font = `700 ${size * 40}px Arial`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = col; g.fillText(txt, 0, 0); g.restore(); };
    word('EXIT', 33.4, F.aisle.n, 1.3, Math.PI / 2);
    word('SLOW', 21.5, F.aisle.n, 1.0, Math.PI / 2);
    word(String(level), -34.4, F.aisle.n + 2.1, 1.6, Math.PI / 2, 'rgba(232,230,220,0.6)');
  });
}

// a column's paint (each face): hazard stripes at the foot, a white band, the level's roundel
function shColumnCanvas(level) {
  const P = SH_DECK_PAINT[level];
  return shCanvas(256, 1024, (g, w, h) => {
    const cc = shConcreteCanvas(70 + level, [120, 118, 112], 256, 1024, { k: 0.12, pits: 300 }); g.drawImage(cc, 0, 0);
    const m = h / 2.5;                                              // px per metre (the column is 2.5 m tall)
    g.save(); g.beginPath(); g.rect(0, h - 0.95 * m, w, 0.95 * m); g.clip();
    g.fillStyle = '#d8b02a'; g.fillRect(0, h - 0.95 * m, w, 0.95 * m);
    g.fillStyle = '#16171a'; for (let k = -6; k < 12; k++) { g.beginPath(); g.moveTo(k * 70, h); g.lineTo(k * 70 + 35, h); g.lineTo(k * 70 + 35 + 240, h - 0.95 * m); g.lineTo(k * 70 + 240, h - 0.95 * m); g.closePath(); g.fill(); }
    g.restore();
    for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(80,76,70,${0.2 + 0.4 * hash1(i)})`; g.fillRect(hash1(i * 3) * w, h - hash1(i * 7) * 0.95 * m, 2 + 4 * hash1(i * 5), 2 + 3 * hash1(i * 11)); }
    g.fillStyle = 'rgba(236,234,226,0.9)'; g.fillRect(0, h - 1.02 * m, w, 0.07 * m);
    // the roundel at 1.65 m
    const cy = h - 1.65 * m; g.fillStyle = 'rgba(236,234,226,0.95)'; g.beginPath(); g.arc(w / 2, cy, 0.3 * m, 0, 6.3); g.fill();
    g.fillStyle = P.roundel; g.beginPath(); g.arc(w / 2, cy, 0.26 * m, 0, 6.3); g.fill();
    g.fillStyle = '#fff'; g.font = `700 ${0.36 * m}px Arial`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(level), w / 2, cy + 0.02 * m);
  });
}

// the plant room's long white wall (x −35.4…−15.0 = 20.4 m × 2.95 m): blockwork painted white, a blue level band and
// lettering at the west end only (the rest stays clean: it is your shadow's screen)
function shPlantWallCanvas(level) {
  const W = 2048, H = 296, kx = W / 20.4, ky = H / 2.95, P = SH_DECK_PAINT[level];
  return shCanvas(W, H, (g) => {
    g.fillStyle = '#d9d8d2'; g.fillRect(0, 0, W, H);
    const r = new RNG(90 + level);
    for (let y = 0, row = 0; y < H; y += 0.215 * ky, row++) for (let x = (row % 2) * -0.22 * kx; x < W; x += 0.44 * kx) {
      const k = r.range(-6, 6); g.fillStyle = `rgb(${222 + k},${221 + k},${215 + k})`; g.fillRect(x + 1, y + 1, 0.44 * kx - 2, 0.215 * ky - 2);
    }
    for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(0,0,0,${r.range(0.02, 0.07)})`; g.fillRect(r.range(0, W), r.range(0, H), r.range(1, 3), r.range(1, 3)); }
    // grime near the floor
    const gr = g.createLinearGradient(0, H, 0, H - 0.5 * ky); gr.addColorStop(0, 'rgba(70,66,60,0.45)'); gr.addColorStop(1, 'rgba(70,66,60,0)'); g.fillStyle = gr; g.fillRect(0, H - 0.5 * ky, W, 0.5 * ky);
    g.fillStyle = P.roundel; g.fillRect(0, H - 1.0 * ky, 3.4 * kx, 0.12 * ky);
    g.font = `700 ${0.5 * ky}px Arial`; g.fillStyle = P.roundel; g.textBaseline = 'alphabetic'; g.fillText(`LEVEL ${level}`, 0.35 * kx, H - 1.2 * ky);
  });
}

// the town below at night: lit windows on the buildings around, the streets' sodium lamps (glow sprites)
function shWindowsCanvas(seed) {
  const r = new RNG(seed);
  return shCanvas(256, 512, (g, w, h) => {
    g.fillStyle = '#121418'; g.fillRect(0, 0, w, h);
    for (let y = 8; y < h; y += 16) for (let x = 6; x < w; x += 14) {
      const on = r.next() < 0.22, warm = r.next() < 0.7;
      g.fillStyle = on ? (warm ? `rgba(255,${190 + r.range(-20, 20) | 0},120,${r.range(0.6, 1)})` : `rgba(170,200,255,${r.range(0.5, 0.9)})`) : 'rgba(40,44,52,0.6)';
      g.fillRect(x, y, 8, 9);
    }
  });
}

function shBuildDeck(app, level) {
  const F = SH_F, D = F.deck, S = SH_KIT_SCENE, H = D.soffit;
  const out = { level, lamps: [] };
  // ---------------------------------------------------------------- floor (two pieces around the ramp's mouth), ramp
  const floorTex = shTex(shDeckFloorCanvas(level), { repeat: false, aniso: 8 });
  const floorM = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.82, metalness: 0 });
  const piece = (x0, x1, z0, z1) => {
    const ge = new THREE.PlaneGeometry(x1 - x0, z1 - z0); ge.rotateX(-Math.PI / 2); ge.translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
    const p = ge.attributes.position, uv = ge.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - D.x[0]) / (D.x[1] - D.x[0]), 1 - (p.getZ(i) - D.z[0]) / (D.z[1] - D.z[0]));
    const m = new THREE.Mesh(ge, floorM); m.receiveShadow = true; S.add(m); return m;
  };
  const R = F.ramp;
  piece(D.x[0], R.x[0], D.z[0], D.z[1]);
  piece(R.x[0], D.x[1], D.z[0], -11.6); piece(R.x[0], D.x[1], -4.8, D.z[1]);
  const conc = shConcreteCanvas(31 + level, [96, 95, 91], 512, 512, { boards: 8 });
  const rampTex = shTex(conc); rampTex.repeat.set(4, 1.5);
  const rampM = new THREE.MeshStandardMaterial({ map: rampTex, roughness: 0.85 });
  {
    const L = Math.hypot(R.x[1] - R.x[0], R.drop), ge = new THREE.PlaneGeometry(L, -11.6 - -4.8 < 0 ? 6.8 : 6.8);
    ge.rotateX(-Math.PI / 2); ge.rotateZ(-Math.atan2(R.drop, R.x[1] - R.x[0])); ge.translate((R.x[0] + R.x[1]) / 2, -R.drop / 2, -8.2);
    const m = new THREE.Mesh(ge, rampM); m.receiveShadow = true; S.add(m);
    // its yellow kerb edges (raised strips) and side walls; the sloped ceiling above it
    const slope = Math.atan2(R.drop, R.x[1] - R.x[0]);
    const wallTex = shTex(shConcreteCanvas(55 + level, [128, 126, 120], 512, 256, { k: 0.1 })); wallTex.repeat.set(5, 1);
    const wallM = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9 });
    for (const [z, sd] of [[-11.75, 1], [-4.65, -1]]) {
      const wl = shMesh(new THREE.BoxGeometry(L + 0.6, 4.2, 0.3), wallM, (R.x[0] + R.x[1]) / 2, -R.drop / 2 + 1.25, z, S); wl.rotation.z = -slope;
      const kb = shMesh(new THREE.BoxGeometry(L, 0.14, 0.32), shStd('#c9a22a', 0.7), (R.x[0] + R.x[1]) / 2, -R.drop / 2 + 0.07, z + sd * 0.31, S); kb.rotation.z = -slope;
    }
    const ceil = shMesh(new THREE.BoxGeometry(L + 0.6, 0.3, 7.4), shStd('#4c4b48', 0.95), (R.x[0] + R.x[1]) / 2, -R.drop / 2 + H + 0.15 + 0.02, -8.2, S); ceil.rotation.z = -slope;
    out.rampSlope = slope;
  }
  // ---------------------------------------------------------------- soffit, beams, columns, pipes
  const soffTex = shTex(shConcreteCanvas(44 + level, [92, 91, 88], 512, 512, { k: 0.18, boards: 6 })); soffTex.repeat.set(20, 9);
  const soffM = new THREE.MeshStandardMaterial({ map: soffTex, roughness: 0.95 });
  const soff = new THREE.Mesh(new THREE.PlaneGeometry(D.x[1] - D.x[0] + 0.4, D.z[1] - D.z[0] + 0.4), soffM); soff.rotation.x = Math.PI / 2; soff.position.set((D.x[0] + D.x[1]) / 2, H, 0); soff.receiveShadow = true; S.add(soff);
  // (the slab's edge, seen from outside, and the level above's parapet line)
  for (const z of [D.z[0] - 0.12, D.z[1] + 0.12]) shMesh(new THREE.BoxGeometry(D.x[1] - D.x[0] + 0.4, 0.62, 0.24), shStd('#6e6c66', 0.9), (D.x[0] + D.x[1]) / 2, H + 0.15, z, S);
  const beamTex = shTex(shConcreteCanvas(46 + level, [100, 99, 95], 256, 256, { k: 0.15 })); beamTex.repeat.set(1, 12);
  const beamM = new THREE.MeshStandardMaterial({ map: beamTex, roughness: 0.92 });
  for (const x of F.colX) shMesh(new THREE.BoxGeometry(F.beamW, H + 0.02 - F.beamY, D.z[1] - D.z[0]), beamM, x, (F.beamY + H + 0.02) / 2, 0, S);
  // edge beams along the aisle column lines (shallower)
  for (const z of F.colZ) shMesh(new THREE.BoxGeometry(D.x[1] - D.x[0], 0.32, 0.4), beamM, (D.x[0] + D.x[1]) / 2, H - 0.15 + 0.01, z, S);
  const colTex = shTex(shColumnCanvas(level), { repeat: false });
  const colM = new THREE.MeshStandardMaterial({ map: colTex, roughness: 0.85 });
  out.cols = [];
  for (const x of F.colX) for (const z of F.colZ) out.cols.push(shMesh(new THREE.BoxGeometry(F.colW, 2.5, F.colW), colM, x, 1.25, z, S));
  // a sprinkler main and a cable tray along each aisle, under the soffit
  const pipeM = shStd('#8a2a22', 0.5, 0.3), trayM = shStd('#7a7c7e', 0.5, 0.6);
  for (const z of [F.aisle.n - 2.2, F.aisle.s + 2.2]) { const p = shCyl(0.055, 0.055, D.x[1] - D.x[0], pipeM, (D.x[0] + D.x[1]) / 2, H - 0.09, z, S, 10); p.rotation.z = Math.PI / 2; }
  for (const z of [F.aisle.n + 2.5, F.aisle.s - 2.5]) shMesh(new THREE.BoxGeometry(D.x[1] - D.x[0], 0.06, 0.3), trayM, (D.x[0] + D.x[1]) / 2, H - 0.06, z, S);
  // ---------------------------------------------------------------- parapets (and a steel rail on top), the open sides
  const parTex = shTex(shConcreteCanvas(60 + level, [118, 116, 110], 512, 128, { k: 0.12 })); parTex.repeat.set(16, 1);
  const parM = new THREE.MeshStandardMaterial({ map: parTex, roughness: 0.9 });
  const railM = shStd('#5a6064', 0.45, 0.7);
  const parapet = (x0, x1, z0, z1) => { const w = x1 - x0, d = z1 - z0; shMesh(new THREE.BoxGeometry(w, D.parapet, d), parM, (x0 + x1) / 2, D.parapet / 2, (z0 + z1) / 2, S);
    const rl = shCyl(0.03, 0.03, Math.max(w, d), railM, (x0 + x1) / 2, D.parapet + 0.12, (z0 + z1) / 2, S, 8); if (w > d) rl.rotation.z = Math.PI / 2; else rl.rotation.x = Math.PI / 2; };
  parapet(D.x[0], D.x[1], D.z[0] - 0.02, D.z[0] + 0.23);
  parapet(D.x[0], D.x[1], D.z[1] - 0.23, D.z[1] + 0.02);
  parapet(D.x[1] - 0.25, D.x[1], -4.8, D.z[1] - 0.23);
  parapet(D.x[1] - 0.25, D.x[1], D.z[0] + 0.23, -11.6);
  parapet(D.x[0], D.x[0] + 0.25, F.core.z[1], D.z[1] - 0.23);
  parapet(D.x[0], D.x[0] + 0.25, D.z[0] + 0.23, F.core.z[0]);
  // posts for the rail at each column line
  for (const x of F.colX) for (const z of [D.z[0] + 0.1, D.z[1] - 0.1]) shCyl(0.025, 0.025, 0.2, railM, x, D.parapet + 0.05, z, S, 6);
  // ---------------------------------------------------------------- the stair core and its door
  const C = F.core, coreTex = shTex(shConcreteCanvas(66 + level, [134, 130, 120], 512, 512, { k: 0.08 })); coreTex.repeat.set(3, 1);
  const coreM = new THREE.MeshStandardMaterial({ map: coreTex, roughness: 0.9 });
  const dz = C.door.z, dw = C.door.w, dh = C.door.h;
  // east face (with the doorway), the other three faces, a roof slab
  for (const c of shWallCells(C.z[0], C.z[1], 0, H + 0.3, [[dz - dw / 2, dz + dw / 2, 0, dh]])) shMesh(new THREE.BoxGeometry(0.25, c[3] - c[2], c[1] - c[0]), coreM, D.x[0] - 0.125, (c[2] + c[3]) / 2, (c[0] + c[1]) / 2, S);
  shMesh(new THREE.BoxGeometry(C.x[1] - C.x[0], H + 0.3, 0.25), coreM, (C.x[0] + C.x[1]) / 2, (H + 0.3) / 2, C.z[0] + 0.125, S);
  shMesh(new THREE.BoxGeometry(C.x[1] - C.x[0], H + 0.3, 0.25), coreM, (C.x[0] + C.x[1]) / 2, (H + 0.3) / 2, C.z[1] - 0.125, S);
  shMesh(new THREE.BoxGeometry(0.25, H + 0.3, C.z[1] - C.z[0]), coreM, C.x[0] + 0.125, (H + 0.3) / 2, (C.z[0] + C.z[1]) / 2, S);
  // inside: a lino landing, cream walls, the stairs going up, a handrail, a bright tube
  const inM = shStd('#c9c4b2', 0.85), linoM = shStd('#3a4a3c', 0.6);
  shMesh(new THREE.BoxGeometry(C.x[1] - C.x[0] - 0.5, 0.02, C.z[1] - C.z[0] - 0.5), linoM, (C.x[0] + C.x[1]) / 2, 0.01, (C.z[0] + C.z[1]) / 2, S);
  shMesh(new THREE.BoxGeometry(0.02, H + 0.3, C.z[1] - C.z[0] - 0.5), inM, C.x[0] + 0.26, (H + 0.3) / 2, (C.z[0] + C.z[1]) / 2, S);
  for (let k = 0; k < 12; k++) shMesh(new THREE.BoxGeometry(2.4, 0.17, 0.28), shStd('#8c8a82', 0.8), C.x[0] + 1.6, 0.085 + 0.17 * k, -9.6 - 0.28 * k + 0.0, S);
  const hr = shCyl(0.025, 0.025, 3.9, shStd('#2a5a3a', 0.4, 0.4), C.x[0] + 2.85, 1.55, -11.0, S, 8); hr.rotation.x = -1.04;
  const tube = shMesh(new THREE.BoxGeometry(0.1, 0.05, 1.2), new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#e8f4ff', emissiveIntensity: 3 }), -41.6, H + 0.2, dz, S); tube.castShadow = false;
  // the door: a steel leaf with a wired-glass vision panel, hinged at its north edge, opening out onto the deck
  const door = new THREE.Group(); door.position.set(D.x[0] + 0.02, 0, dz - dw / 2); S.add(door);
  const leafM = shStd('#4d5a52', 0.5, 0.3);
  shMesh(new THREE.BoxGeometry(0.05, dh - 0.02, dw - 0.04), leafM, 0.03, dh / 2, dw / 2, door);
  shMesh(new THREE.BoxGeometry(0.06, 0.4, 0.22), shStd('#9fb4b0', 0.15, 0.2, { transparent: true, opacity: 0.5 }), 0.03, 1.5, dw / 2, door).castShadow = false;
  shMesh(new THREE.BoxGeometry(0.06, 0.04, 0.5), shStd('#b8bcc0', 0.3, 0.8), 0.07, 1.0, dw / 2 + 0.1, door);
  out.door = door;
  // the frame, the green running-man sign above it, a "LEVEL 4" plate
  const frM = shStd('#3a463e', 0.5, 0.3);
  shMesh(new THREE.BoxGeometry(0.08, 0.08, dw + 0.16), frM, D.x[0] + 0.03, dh + 0.04, dz, S);
  for (const sd of [-1, 1]) shMesh(new THREE.BoxGeometry(0.08, dh, 0.08), frM, D.x[0] + 0.03, dh / 2, dz + sd * (dw / 2 + 0.04), S);
  const exitTex = shTex(shCanvas(256, 128, (g, w, h) => { g.fillStyle = '#0f9a4a'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8fff0'; g.font = '700 54px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('EXIT', w * 0.62, h / 2);
    g.beginPath(); g.arc(46, 36, 10, 0, 6.3); g.fill(); g.fillRect(40, 48, 12, 34); g.fillRect(28, 80, 30, 9); }), { repeat: false });
  const exitM = new THREE.MeshStandardMaterial({ map: exitTex, emissive: '#ffffff', emissiveMap: exitTex, emissiveIntensity: 1.4 });
  const ex = shMesh(new THREE.BoxGeometry(0.06, 0.3, 0.6), exitM, D.x[0] + 0.05, dh + 0.42, dz, S); ex.castShadow = false;
  const plateTex = shTex(shCanvas(512, 128, (g, w, h) => { g.fillStyle = SH_DECK_PAINT[level].roundel; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = '700 70px Arial'; g.textBaseline = 'middle'; g.fillText(`LEVEL ${level}`, 30, h / 2 + 4); }), { repeat: false });
  const pl = shMesh(new THREE.BoxGeometry(0.03, 0.3, 1.2), shStd('#ffffff', 0.6, 0, { map: plateTex }), D.x[0] + 0.03, 1.6, dz - 1.6, S); pl.rotation.y = 0; pl.castShadow = false;
  // ---------------------------------------------------------------- the white plant room
  const Pr = F.plant, plantTex = shTex(shPlantWallCanvas(level), { repeat: false });
  const plantFace = new THREE.MeshStandardMaterial({ map: plantTex, roughness: 0.88 });
  const whiteM = shStd('#d6d5cf', 0.9);
  const pw = Pr.x[1] - Pr.x[0], pd = Pr.z[1] - Pr.z[0];
  shMesh(new THREE.BoxGeometry(pw, H, pd), whiteM, (Pr.x[0] + Pr.x[1]) / 2, H / 2, (Pr.z[0] + Pr.z[1]) / 2, S);
  // (its north face is a separate plane 1 cm proud of the box, carrying the painted blockwork)
  const pf = new THREE.Mesh(new THREE.PlaneGeometry(pw, H), plantFace); pf.rotation.y = Math.PI; pf.position.set((Pr.x[0] + Pr.x[1]) / 2, H / 2, Pr.z[0] - 0.012); pf.receiveShadow = true; S.add(pf);
  // its steel door (east end) and a sign
  shMesh(new THREE.BoxGeometry(1.0, 2.05, 0.05), shStd('#5a5f62', 0.5, 0.4), -16.6, 1.03, Pr.z[0] - 0.045, S);
  const signTex = shTex(shCanvas(256, 160, (g, w, h) => { g.fillStyle = '#f2f0e8'; g.fillRect(0, 0, w, h); g.fillStyle = '#c0261e'; g.fillRect(0, 0, w, 44); g.fillStyle = '#fff'; g.font = '700 30px Arial'; g.textAlign = 'center'; g.fillText('NO ENTRY', w / 2, 32);
    g.fillStyle = '#1a1a1a'; g.font = '700 28px Arial'; g.fillText('PLANT ROOM', w / 2, 90); g.font = '500 20px Arial'; g.fillText('AUTHORISED STAFF ONLY', w / 2, 130); }), { repeat: false });
  shMesh(new THREE.BoxGeometry(0.42, 0.26, 0.012), shStd('#ffffff', 0.6, 0, { map: signTex }), -16.6, 1.55, Pr.z[0] - 0.085, S).castShadow = false;
  // ---------------------------------------------------------------- the convex mirror (on the column at x −7.2 by the aisle)
  {
    const [mx, mz] = F.mirror.col, g = new THREE.Group(); g.position.set(mx - F.colW / 2 - 0.12, F.mirror.y, mz - 0.05); g.rotation.y = -Math.PI / 2 + 0.35; g.rotation.x = 0; S.add(g);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 10, 32), shStd('#d8a82a', 0.5)); rim.castShadow = true; g.add(rim);
    const back = new THREE.Mesh(new THREE.CircleGeometry(0.3, 32), shStd('#222', 0.8)); back.rotation.y = Math.PI; back.position.z = -0.01; g.add(back);
    const domeG = new THREE.SphereGeometry(0.62, 32, 16, 0, Math.PI * 2, 0, 0.5); domeG.rotateX(Math.PI / 2); domeG.translate(0, 0, -0.62 * Math.cos(0.5));
    const cube = new THREE.WebGLCubeRenderTarget(256, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
    const domeM = new THREE.MeshStandardMaterial({ color: '#d4d8dc', metalness: 1, roughness: 0.05, envMap: cube.texture, envMapIntensity: 1.0 });
    const dome = new THREE.Mesh(domeG, domeM); dome.castShadow = false; g.add(dome);
    const arm = shMesh(new THREE.BoxGeometry(0.05, 0.05, 0.2), shStd('#555', 0.5, 0.5), 0, 0, -0.1, g); void arm;
    const cubeCam = new THREE.CubeCamera(0.05, 60, cube); cubeCam.position.copy(g.position); S.add(cubeCam);
    out.mirror = { g, dome, cube, cubeCam };
  }
  // ---------------------------------------------------------------- the LED battens (each its own material: on, off, flickering)
  const bodyM = shStd('#b8bab8', 0.5, 0.3);
  for (const L of SH_LAMPS) {
    const m = new THREE.MeshStandardMaterial({ color: '#dfe6ea', roughness: 0.4, emissive: '#e6f2ff', emissiveIntensity: 2.2 });
    const g = new THREE.Group(); g.position.set(L.x, F.lampY, L.z); S.add(g);
    shMesh(new THREE.BoxGeometry(1.4, 0.06, 0.13), bodyM, 0, 0.07, 0, g).castShadow = false;
    const diff = shMesh(new THREE.BoxGeometry(1.36, 0.035, 0.1), m, 0, 0.0225, 0, g); diff.castShadow = false;
    for (const sx of [-0.5, 0.5]) shMesh(new THREE.BoxGeometry(0.02, H - F.lampY - 0.1, 0.02), bodyM, sx, (H - F.lampY) / 2 + 0.05, 0, g).castShadow = false;
    out.lamps.push({ L, g, m });
  }
  // ---------------------------------------------------------------- the town below (street level is 4 storeys down)
  {
    const gy = -3.25 * level - 0.1, r = new RNG(77 + level);
    const roadTex = shTex(shCanvas(1024, 1024, (g, w, h) => {
      g.fillStyle = '#0c0d0f'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#1a1b1e'; for (const x of [180, 520, 860]) g.fillRect(x, 0, 60, h); for (const y of [200, 610]) g.fillRect(0, y, w, 60);
      for (let i = 0; i < 70; i++) { const x = r.range(0, w), y = r.range(0, h), rr = r.range(14, 40); const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(255,150,60,0.55)'); gr.addColorStop(1, 'rgba(255,150,60,0)'); g.fillStyle = gr; g.fillRect(x - rr, y - rr, 2 * rr, 2 * rr); }
    }), { repeat: false });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshBasicMaterial({ map: roadTex, color: '#ffffff' })); ground.rotation.x = -Math.PI / 2; ground.position.set(0, gy, 0); S.add(ground);
    const winTexes = [0, 1, 2].map((k) => { const t = shTex(shWindowsCanvas(300 + k)); return t; });
    for (let i = 0; i < 70; i++) {
      const a = r.range(0, Math.PI * 2), d = r.range(55, 330), w = r.range(12, 40), dd = r.range(12, 30), h = r.range(8, i < 8 ? 70 : 32);
      const x = Math.cos(a) * d, z = Math.sin(a) * d * 0.9;
      if (Math.abs(z) < 30 && Math.abs(x) < 70) continue;
      const t = winTexes[i % 3].clone(); t.needsUpdate = true; t.repeat.set(w / 14, h / 26);
      const bm = new THREE.MeshBasicMaterial({ map: t, color: '#ffffff' });
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), bm); b.position.set(x, gy + h / 2, z); b.rotation.y = r.range(-0.3, 0.3); S.add(b);
    }
    // street lamps (glows)
    const glowT = shDotTex(0.25); const glows = [];
    for (let i = 0; i < 90; i++) { const x = r.range(-260, 260), z = r.range(-260, 260); if (Math.abs(z) < 26 && Math.abs(x) < 60) continue;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, color: '#ffb060', transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      sp.position.set(x, gy + 7, z); sp.scale.setScalar(r.range(2.5, 4.5)); S.add(sp); glows.push(sp); }
    out.town = { ground, glows };
  }
  return out;
}

// the lights pool for a deck: shadow-casting spots on the nearest lit battens, unshadowed fill points on the next ones.
// place(focus, s, o) re-assigns them (weights fade at the edge of the pool, so a lamp never pops in or out)
function shDeckLights(scene, nShadow = 6, nFill = 14) {
  const spots = [], fills = [];
  for (let i = 0; i < nShadow; i++) {
    const L = new THREE.SpotLight('#e9f1ff', 0, 15, 1.3, 0.85, 2); L.castShadow = true;
    L.shadow.mapSize.set(1024, 1024); L.shadow.camera.near = 0.08; L.shadow.camera.far = 15; L.shadow.bias = -0.0006; L.shadow.normalBias = 0.025; L.shadow.radius = 2;
    scene.add(L); scene.add(L.target); spots.push(L);
  }
  for (let i = 0; i < nFill; i++) { const P = new THREE.PointLight('#e2ecff', 0, 13, 2); scene.add(P); fills.push(P); }
  return {
    spots, fills,
    // focus [x, z]; lampOn(i) → 0…1; o.I (intensity), o.max (how many cast: ≤ nShadow)
    place(deck, focus, lampOn, o = {}) {
      const I = o.I ?? 7.5, nS = Math.min(nShadow, o.max ?? nShadow);
      const A = deck.lamps.map((l) => ({ l, d: Math.hypot(l.L.x - focus[0], l.L.z - focus[1]), on: lampOn(l.L.i) })).filter((a) => a.on > 0.001).sort((a, b) => a.d - b.d);
      const edgeS = A[nS] ? A[nS].d : 1e9;
      spots.forEach((L, i) => {
        const a = A[i];
        if (!a || i >= nS) { L.intensity = 0; shShadowOn(L, false); return; }
        shShadowOn(L, true); L.position.set(a.l.L.x, SH_F.lampY - 0.03, a.l.L.z); L.target.position.set(a.l.L.x, 0, a.l.L.z + 0.001);
        L.intensity = I * a.on * (o.fade === false ? 1 : MathX.clamp((edgeS - a.d) / 1.6, 0.25, 1));
      });
      fills.forEach((P, k) => {
        const a = A[nS + k];
        if (!a) { P.intensity = 0; return; }
        P.position.set(a.l.L.x, SH_F.lampY - 0.25, a.l.L.z);
        const edge = A[nS + fills.length] ? A[nS + fills.length].d : 1e9;
        P.intensity = (o.fill ?? 0.55) * I * a.on * MathX.clamp((edge - a.d) / 3, 0, 1);
      });
    },
  };
}
