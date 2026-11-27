/* =====================================================================
   STREET — your street in Brooklyn Heights, built in detail (x −345 … +110, z −45 … 45; nyc.js leaves this zone
   empty): the road (one way, west), the kerbs and pavements, the brownstones on both sides (your house, No. 44, on
   the north side facing the morning sun), two cross streets, the shops and the café at the west end, trees, lamps,
   the bus stop, and the Promenade over Brooklyn Bridge Park with Manhattan across the river.
     twStreet(scene, world) → handles for what moves or breaks: { yourGlass, awnings, crowns, posters, snow, tape, … }
   Everything long is built in pieces of 50 m or less (long triangles break in the software renderer).
   ===================================================================== */

const TW_ST = {
  road: 3.0, kerb: 0.25, face: 8.2, depth: 15, x0: -345, x1: 110, prom: [-368, -345], promZ: [-720, 80],
  cross: [[40, 52], [-192, -180]], shops: [-342, -252], cafe: [-118, -96],
  busStop: [-0.5, 3.45], house: { x0: -3, x1: 3, h: 13.2 },
};

// a strip of boxes along x from a to b (≤ 50 m each)
function twStripX(scene, a, b, y0, y1, z0, z1, m, o = {}) {
  const n = Math.max(1, Math.ceil((b - a) / 50)), out = [];
  for (let i = 0; i < n; i++) { const x0 = a + (b - a) * i / n, x1 = a + (b - a) * (i + 1) / n; const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
    if (o.uvScale) { const uv = g.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * (x1 - x0) / o.uvScale, uv.getY(k) * (z1 - z0) / o.uvScale); }
    const mm = new THREE.Mesh(g, m); mm.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); mm.receiveShadow = true; mm.castShadow = !!o.cast; scene.add(mm); out.push(mm); }
  return out;
}
function twStripZ(scene, a, b, y0, y1, x0, x1, m, o = {}) {
  const n = Math.max(1, Math.ceil((b - a) / 50)), out = [];
  for (let i = 0; i < n; i++) { const z0 = a + (b - a) * i / n, z1 = a + (b - a) * (i + 1) / n; const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
    if (o.uvScale) { const uv = g.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * (x1 - x0) / o.uvScale, uv.getY(k) * (z1 - z0) / o.uvScale); }
    const mm = new THREE.Mesh(g, m); mm.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); mm.receiveShadow = true; mm.castShadow = !!o.cast; scene.add(mm); out.push(mm); }
  return out;
}
// an instanced pile of boxes: add(x, y, z, w, h, d, ry, color) … done()
function twBoxes(scene, mat, max, o = {}) {
  const g = new THREE.BoxGeometry(1, 1, 1); if (o.base) g.translate(0, 0.5, 0);
  const I = new THREE.InstancedMesh(g, mat, max), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), C = new THREE.Color(), Y = new THREE.Vector3(0, 1, 0);
  let n = 0;
  return {
    I,
    add(x, y, z, w, h, d, ry = 0, col) { if (n >= max) return; Q.setFromAxisAngle(Y, ry); M.compose(V.set(x, y, z), Q, S.set(w, h, d)); I.setMatrixAt(n, M); if (col) I.setColorAt(n, C.set(col)); n++; },
    done() { I.count = n; I.instanceMatrix.needsUpdate = true; if (I.instanceColor) I.instanceColor.needsUpdate = true; I.castShadow = o.cast !== false; I.receiveShadow = true; scene.add(I); return I; },
  };
}

function twStreet(scene, world) {
  const r = new RNG(44), out = {}, S = TW_ST, F = S.face;
  const pick = (a) => a[Math.floor(r.next() * a.length)];
  // ---- ground: road, kerbs, pavements, the cross streets, the back gardens
  const asph = Tex.asphalt(7), roadM = new THREE.MeshStandardMaterial({ map: asph.map, roughnessMap: asph.roughnessMap, roughness: 0.92, color: '#b8b8b8', polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  asph.map.repeat.set(1, 1);
  const pav = twTex(twPavingCanvas(9)), pavM = new THREE.MeshStandardMaterial({ map: pav, roughness: 0.9, color: '#d6d0c4' });
  const kerbM = twStd('#9d9a94', 0.8), gardenM = twStd('#5b7a3c', 0.95, 0, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  twStripX(scene, S.x0, S.x1, -0.1, 0.02, -S.road, S.road, roadM, { uvScale: 8 });
  for (const sgn of [-1, 1]) {
    twStripX(scene, S.x0, S.x1, -0.1, 0.16, sgn > 0 ? S.road : -S.road - S.kerb, sgn > 0 ? S.road + S.kerb : -S.road, kerbM);
    twStripX(scene, S.x0, S.x1, -0.1, 0.15, sgn > 0 ? S.road + S.kerb : -F, sgn > 0 ? F : -S.road - S.kerb, pavM, { uvScale: 2.4 });
    twStripX(scene, S.x0, S.x1, -0.05, 0.03, sgn > 0 ? F + S.depth : -45, sgn > 0 ? 45 : -F - S.depth, gardenM);
  }
  for (const [a, b] of S.cross) {
    for (const sgn of [-1, 1]) twStripZ(scene, sgn > 0 ? S.road + S.kerb : -45, sgn > 0 ? 45 : -S.road - S.kerb, -0.1, 0.025, a + 2.5, b - 2.5, roadM, { uvScale: 8 });
    // the crossings: white bars on the road
    const zM = twStd('#e8e6e0', 0.7, 0, { polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    for (const xx of [a - 1.5, b + 1.5]) for (let k = 0; k < 7; k++) twBox(1.6, 0.012, 0.5, zM, xx, 0.032, -S.road + 0.6 + k * 0.82, scene);
  }
  // ---- the rows: brownstones 6 m wide (two bays of windows), the shops at the west end
  const facadeM = world.mat;                                     // (the city's material: its windows break with the boom)
  const H = twBoxes(scene, facadeM, 220, { base: true });
  const trimB = twBoxes(scene, twStd('#ffffff', 0.7), 1600);         // cornices, doors, stoops, frames (instance colours)
  const pal = { brown: ['#7a4a35', '#8a5a40', '#6e4636', '#93664a', '#5f3d30', '#a0705a', '#845642'], brick: ['#9a5a44', '#8a4c3a', '#a86a50', '#7c4434', '#b0846a'] };
  const doorCols = ['#2a2420', '#3a1e16', '#1e2a22', '#5a1e1a', '#20283a', '#4a3a2a'];
  out.houses = [];
  const inCross = (x0, x1) => S.cross.some(([a, b]) => x1 > a - 0.5 && x0 < b + 0.5);
  for (const sgn of [-1, 1]) {
    for (let k = -41; k <= 16; k++) {
      const cx = k * 6, x0 = cx - 3, x1 = cx + 3;
      if (x0 < S.shops[1] || inCross(x0, x1)) continue;
      if (sgn < 0 && k === 0) continue;                            // (your house is built on its own)
      const h = r.range(12.2, 14.6), col = r.next() < 0.7 ? pick(pal.brown) : pick(pal.brick), zf = sgn * F;
      H.add(cx, 0, sgn * (F + S.depth / 2), 6 - 0.04, h, S.depth, 0, col);
      out.houses.push([cx, sgn]);
      // cornice, the door, its stoop
      trimB.add(cx, h + 0.25, zf - sgn * 0.2, 6.02, 0.5, 0.5, 0, '#3a2a20');
      const dl = (k + (sgn > 0 ? 1 : 0)) % 2 ? -1.6 : 1.6;
      trimB.add(cx + dl, 0.45 + 1.15, zf - sgn * 0.04, 1.15, 2.3, 0.06, 0, pick(doorCols));
      trimB.add(cx + dl, 0.45 + 2.45, zf - sgn * 0.09, 1.4, 0.18, 0.1, 0, '#c9bfa8');
      trimB.add(cx + dl, 0.225, zf - sgn * 0.55, 2.0, 0.45, 1.1, 0, col);
      trimB.add(cx + dl, 0.11, zf - sgn * 1.32, 2.0, 0.22, 0.45, 0, col);
      // lintels over the windows (two bays, three upper floors)
      for (let f = 1; f < Math.floor(h / 3.4); f++) for (const bx of [-1.5, 1.5]) trimB.add(cx + bx, f * 3.4 + 2.97, zf - sgn * 0.08, 1.9, 0.16, 0.1, 0, '#cdbfa6');
    }
    // the shops: 9 m units, four floors, a shopfront and an awning each
    for (let x = S.shops[1] - 4.5; x > S.shops[0]; x -= 9) {
      const h = r.range(14, 17.5), col = pick(r.next() < 0.5 ? pal.brick : ['#b8ae9e', '#c9c0b0', '#a69b8a']);
      H.add(x, 0, sgn * (F + S.depth / 2), 9 - 0.04, h, S.depth, 0, col);
      trimB.add(x, h + 0.3, sgn * F - sgn * 0.25, 9.02, 0.6, 0.6, 0, '#3a3530');
      out.houses.push([x, sgn]);
    }
  }
  H.done(); out.rows = H.I;
  // ---- the shopfronts and their awnings (the wind of step nine tears these off)
  const shops = [
    ['CAFÉ LUNA', '#2f4a3a', '#f4e9d0'], ['DELI', '#a8322a', '#fff'], ['BOOKS', '#1f3a5a', '#f2e6c8'], ['FLOWERS', '#e0a3b8', '#3a1a24'], ['PIZZA', '#c8402a', '#fff2d0'],
    ['LAUNDRY', '#3a6a9a', '#fff'], ['BAKERY', '#d9b26a', '#3a2412'], ['PHARMACY', '#2a7a4a', '#fff'], ['HARDWARE', '#5a5a5a', '#ffd24a'], ['BAGELS', '#6a3a1a', '#ffe9c0'],
  ];
  out.awnings = [];
  const stripe = (a, b) => twTex(twCanvas(256, 128, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? a : b; g.fillRect(i * 32, 0, 32, 128); } g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, 110, 256, 18); }), { repeat: false });
  let si = 0;
  for (const sgn of [-1, 1]) for (let x = S.shops[1] - 4.5; x > S.shops[0]; x -= 9, si++) {
    const sh = shops[si % shops.length], T = Tex.storefront({ wall: '#2a2622', sign: sh[1], text: sh[2], name: sh[0], doorLeft: si % 2 === 0, inside: ['#f2e2c2', '#b89a70'], products: ['#c84a3a', '#e0c060', '#3a7ac0', '#f0f0e8', '#5a9a4a'], frame: '#1a1816' }, 30 + si);
    const fm = new THREE.MeshStandardMaterial({ map: T.map, emissiveMap: T.emissiveMap, emissive: '#ffe2b0', emissiveIntensity: 0.35, roughnessMap: T.roughnessMap, roughness: 0.5, metalness: 0.1 });
    const front = twPlane(8.6, 4.5, fm, x, 2.25, sgn * (F - 0.03), sgn > 0 ? '-z' : '+z', scene);
    void front;
    const am = new THREE.MeshStandardMaterial({ map: stripe(sh[1], '#f4efe4'), roughness: 0.85, side: THREE.DoubleSide });
    const aw = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.05, 1.9), am); aw.castShadow = true; aw.receiveShadow = true; scene.add(aw);
    const base = { x, y: 3.45, z: sgn * (F - 0.95), rx: -sgn * 0.36, sgn };
    aw.position.set(base.x, base.y, base.z); aw.rotation.set(base.rx, 0, 0);
    out.awnings.push({ m: aw, base, seed: si });
  }
  trimB.done();
  // ---- the café's tables on the pavement (north side)
  {
    const tM = twStd('#2a2a2c', 0.4, 0.6), cM = twStd('#c8b89a', 0.8);
    for (let i = 0; i < 4; i++) { const x = S.cafe[0] + 3 + i * 5.2, z = -F + 1.6;
      twCyl(0.36, 0.36, 0.04, tM, x, 0.9, z, scene, 16); twCyl(0.03, 0.03, 0.75, tM, x, 0.53, z, scene, 8);
      for (const dx of [-0.6, 0.6]) { twBox(0.42, 0.04, 0.42, cM, x + dx, 0.6, z, scene); twBox(0.42, 0.45, 0.04, cM, x + dx * 1.35, 0.85, z, scene).rotation.y = Math.PI / 2; } }
    // its awning is the long green one
    const am = twStd('#2f4a3a', 0.8); const aw = twBox(S.cafe[1] - S.cafe[0], 0.05, 2.2, am, (S.cafe[0] + S.cafe[1]) / 2, 3.2, -F + 1.1, scene); aw.rotation.x = 0.3;
    out.cafeAwning = aw;
  }
  // ---- YOUR HOUSE, No. 44: a brownstone with a real doorway (you land in it on step five)
  out.yours = twYourHouse(scene);
  // ---- trees (London planes, late November: yellowing, thinning), lamps, the bus stop, a hydrant
  out.crowns = [];
  {
    const trunkM = twStd('#6f6a5e', 0.9), cols = ['#c9a24a', '#b48a3a', '#9a9a46', '#d0b060', '#a87a36'];
    const geos = [0, 1, 2].map((i) => twBlobGeo(1, i + 3));
    const cM = cols.map((c) => twStd(c, 0.85));
    for (const sgn of [-1, 1]) for (let x = 104; x > S.x0 + 6; x -= 13) {
      if (inCross(x - 3, x + 3) || (x > -8 && x < 8) || (sgn > 0 && Math.abs(x - S.busStop[0]) < 6) || (x < S.shops[1] + 2 && x > S.shops[0])) continue;
      if (x < S.cafe[1] + 3 && x > S.cafe[0] - 3 && sgn < 0) continue;
      const z = sgn * (S.road + 1.2), h = r.range(4.2, 5.4);
      twCyl(0.14, 0.2, h, trunkM, x, h / 2 + 0.15, z, scene, 8);
      const g = new THREE.Group(); g.position.set(x, h + 0.15, z); scene.add(g);
      for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(geos[k % 3], cM[Math.floor(r.next() * cM.length)]); m.position.set(r.range(-1.3, 1.3), r.range(0.2, 1.8), r.range(-1.1, 1.1)); m.scale.setScalar(r.range(1.3, 2.0)); m.castShadow = m.receiveShadow = true; g.add(m); }
      out.crowns.push({ g, x, z });
    }
    const poleM = twStd('#2c3a30', 0.5, 0.4), lampM = new THREE.MeshStandardMaterial({ color: '#fff4d8', emissive: '#ffe2a0', emissiveIntensity: 0.0, roughness: 0.3 });
    out.lampM = lampM;
    for (const sgn of [-1, 1]) for (let x = 95; x > S.x0; x -= 28) {
      if (inCross(x - 2, x + 2)) continue;
      const z = sgn * (S.road + 0.55);
      twCyl(0.07, 0.11, 4.6, poleM, x, 2.45, z, scene, 8);
      twCyl(0.2, 0.12, 0.5, lampM, x, 4.95, z, scene, 8);
      twCyl(0.24, 0.24, 0.06, poleM, x, 5.22, z, scene, 8);
    }
    // the bus stop: a pole and its sign, a bench
    const [bx, bz] = S.busStop;
    twCyl(0.045, 0.045, 3.0, twStd('#8a8e94', 0.4, 0.6), bx, 1.65, bz, scene, 8);
    const sign = twTex(twCanvas(128, 256, (g) => { g.fillStyle = '#1f5fb0'; g.fillRect(0, 0, 128, 256); g.fillStyle = '#fff'; g.font = '800 54px Inter, Arial'; g.textAlign = 'center'; g.fillText('BUS', 64, 80); g.font = '800 60px Inter, Arial'; g.fillText('B63', 64, 160); g.fillRect(16, 196, 96, 10); }), { repeat: false });
    const sm = new THREE.MeshStandardMaterial({ map: sign, roughness: 0.5 });
    twBox(0.5, 1.0, 0.03, sm, bx, 2.7, bz, scene).rotation.y = Math.PI / 2;
    const benchM = twStd('#3a4a3a', 0.6, 0.3);
    twBox(2.0, 0.06, 0.45, benchM, bx - 3.4, 0.62, F - 1.4, scene); twBox(2.0, 0.45, 0.05, benchM, bx - 3.4, 0.9, F - 1.2, scene);
    for (const dx of [-0.85, 0.85]) twBox(0.06, 0.47, 0.4, benchM, bx - 3.4 + dx, 0.38, F - 1.4, scene);
    twCyl(0.16, 0.2, 0.62, twStd('#c8302a', 0.5, 0.2), 4.4, 0.46, -S.road - 0.7, scene, 10);   // the hydrant by your door
  }
  // ---- the Promenade: its paving, the railing, benches, lamps; the lawn and piers below it, out to the river
  {
    const pM = twStd('#8a8478', 0.92), [px0, px1] = S.prom, [pz0, pz1] = S.promZ;
    twStripZ(scene, pz0, pz1, -0.1, 0.15, px0, px1, pM);
    const railM = twStd('#20241f', 0.5, 0.5);
    twStripZ(scene, pz0, pz1, 1.05, 1.12, px0 + 0.02, px0 + 0.14, railM, { cast: true });
    twStripZ(scene, pz0, pz1, 0.55, 0.6, px0 + 0.05, px0 + 0.11, railM);
    const posts = twBoxes(scene, railM, 400);
    for (let z = pz0; z < pz1; z += 2.5) posts.add(px0 + 0.08, 0.6, z, 0.07, 0.95, 0.07);
    posts.done();
    const bM = twStd('#5a4a36', 0.8), benches = twBoxes(scene, bM, 200);
    for (let z = pz0 + 10; z < pz1 - 4; z += 14) { if (Math.abs(z) < 5) continue; benches.add(px1 - 2.2, 0.58, z, 0.45, 0.06, 2.2); benches.add(px1 - 1.98, 0.88, z, 0.05, 0.5, 2.2); }
    benches.done();
    const lawnM = twStd('#5f8a3e', 0.95, 0, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    for (let z = -1000; z < 300; z += 50) for (let x = -520; x < px0; x += 50) { const w = Math.min(50, px0 - x); if (!twInPoly(x, z, TW_LAND.brooklyn) || !twInPoly(x, z + 50, TW_LAND.brooklyn)) continue;   // (on the land only)
 twBox(w, 0.06, 50, lawnM, x + w / 2, 0.03, z + 25, scene).castShadow = false; }
    const pierM = twStd('#8a8276', 0.85);
    for (const z of [-650, -420, -150, 120]) for (let x = -520; x > -760; x -= 48) twBox(48, 1.4, 70, pierM, x - 24, -0.5, z, scene);
  }
  // ---- for later: the police tape and boarded windows (the evening), the snow and the posters (a month on), the
  // grown tree and the new door (eleven years on)
  // (the tape on five striped posts along the kerb, so it reads as police tape and not a line across the picture)
  out.tape = new THREE.Group(); scene.add(out.tape); out.tape.visible = false;
  {
    const tapeM = new THREE.MeshStandardMaterial({ color: '#ffd400', emissive: '#3a3000', roughness: 0.6 }), postM = twStd('#e8e4dc', 0.7), bandM = twStd('#e0461e', 0.7);
    const z = -S.road - 0.4, xs = [-15, -8.5, -2, 4.5, 11];
    for (let i = 0; i < xs.length; i++) {
      twBox(0.09, 1.12, 0.09, postM, xs[i], 0.56, z, out.tape); twBox(0.1, 0.16, 0.1, bandM, xs[i], 0.85, z, out.tape); twBox(0.1, 0.16, 0.1, bandM, xs[i], 0.45, z, out.tape);
      if (i < xs.length - 1) { const w = xs[i + 1] - xs[i]; twBox(w, 0.06, 0.02, tapeM, xs[i] + w / 2, 0.98 - 0.04 * (i % 2), z, out.tape).rotation.z = 0.004 * (i % 2 ? 1 : -1); }
    }
  }
  out.snow = [];
  {
    const sM = twStd('#f4f6fa', 0.9, 0, { polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 });
    for (const sgn of [-1, 1]) out.snow.push(...twStripX(scene, -60, 60, 0.15, 0.2, sgn > 0 ? S.road + 0.3 : -F + 0.02, sgn > 0 ? F - 0.02 : -S.road - 0.3, sM));
    out.snow.push(...twStripX(scene, -60, 60, 0.02, 0.07, -S.road + 1.6, -S.road + 2.2, sM), ...twStripX(scene, -60, 60, 0.02, 0.07, S.road - 2.2, S.road - 1.6, sM));
    for (const m of out.snow) m.visible = false;
  }
  out.posters = [];
  return out;
}

// your house: the facade with real holes (a doorway 0.6 m deep, eleven windows), frames, lintels, the stoop and its
// railings, the lamp and the number; the glass panes break with the boom (yourGlass: [{ m, broken }])
function twYourHouse(scene) {
  const S = TW_ST, F = S.face, X0 = S.house.x0, X1 = S.house.x1, HH = S.house.h;
  const g = new THREE.Group(); scene.add(g);
  const stoneM = twStd('#7d4b36', 0.85), trimM = twStd('#d9ccb2', 0.7), darkM = twStd('#1c1714', 0.9), frameM = twStd('#efe8da', 0.6);
  const door = [-0.62, 0.62, 0.45, 2.78];
  const wins = [[-2.45, -1.35, 1.25, 2.95], [1.35, 2.45, 1.25, 2.95]];
  for (const [y0, y1] of [[4.25, 6.05], [7.65, 9.45], [10.85, 12.1]]) for (const [x0, x1] of [[-2.45, -1.55], [-0.45, 0.45], [1.55, 2.45]]) wins.push([x0, x1, y0, y1]);
  const cells = twWallCells(X0, X1, 0, HH, [door, ...wins]);
  for (const [x0, x1, y0, y1] of cells) { const m = twBox(x1 - x0, y1 - y0, 0.32, stoneM, (x0 + x1) / 2, (y0 + y1) / 2, -F - 0.16, g); m.castShadow = true; }
  // the body behind the facade (sides, back, roof) and a dim interior
  twBox(6 - 0.04, HH, S.depth - 0.95, twStd('#6e4232', 0.9), 0, HH / 2, -F - 0.95 - (S.depth - 0.95) / 2, g);
  const inside = new THREE.MeshStandardMaterial({ color: '#3a2c22', emissive: '#2a1c10', emissiveIntensity: 0.6, roughness: 0.9 });
  twPlane(5.9, HH - 0.1, inside, 0, HH / 2, -F - 0.9, '+z', g);
  // the doorway: a recess 0.6 m deep, its stone sides, the door, the transom, the knob
  // (every face 3 cm clear of the facade's own faces: the jambs stand 3 cm into the opening and 3 cm back from the
  // front, the lintel 3 cm below the opening's top, the threshold 3 cm above its sill and 4 cm proud: no z-fighting)
  twBox(0.09, door[3] - door[2] - 0.03, 0.57, trimM, door[0] + 0.03 - 0.045, (door[2] + door[3] - 0.03) / 2, -F - 0.03 - 0.285, g);
  twBox(0.09, door[3] - door[2] - 0.03, 0.57, trimM, door[1] - 0.03 + 0.045, (door[2] + door[3] - 0.03) / 2, -F - 0.03 - 0.285, g);
  twBox(1.36, 0.09, 0.57, trimM, 0, door[3] - 0.03 + 0.045, -F - 0.03 - 0.285, g);
  twBox(1.3, 0.08, 0.66, twStd('#8a6a52', 0.8), 0, door[2] - 0.05, -F - 0.29, g);
  const doorM = twStd('#7a2418', 0.55);
  twBox(1.12, 1.98, 0.06, doorM, 0, door[2] + 0.03 + 0.99, -F - 0.62, g);
  for (const dy of [0.45, 1.3]) for (const dx of [-0.27, 0.27]) twBox(0.4, 0.62, 0.02, twStd('#6a1e14', 0.55), dx, door[2] + dy + 0.31, -F - 0.585, g);
  twBox(1.12, 0.28, 0.03, new THREE.MeshStandardMaterial({ color: '#30383e', roughness: 0.1, metalness: 0.4 }), 0, door[3] - 0.17, -F - 0.6, g);
  twCyl(0.03, 0.03, 0.05, twStd('#d4a84a', 0.25, 0.9), 0.42, door[2] + 1.05, -F - 0.56, g, 10).rotation.x = Math.PI / 2;
  // the number
  const numT = twTex(twCanvas(128, 64, (c) => { c.fillStyle = '#efe6d2'; c.fillRect(0, 0, 128, 64); c.fillStyle = '#2a2420'; c.font = '800 46px Inter, Arial'; c.textAlign = 'center'; c.fillText('44', 64, 49); }), { repeat: false });
  twBox(0.32, 0.16, 0.02, new THREE.MeshStandardMaterial({ map: numT, roughness: 0.6 }), 0, door[3] + 0.25, -F + 0.03, g);
  // the lamp by the door
  const lampM = new THREE.MeshStandardMaterial({ color: '#fff0c8', emissive: '#ffcf7a', emissiveIntensity: 0.0, roughness: 0.3 });
  twBox(0.16, 0.26, 0.16, lampM, 0.98, 2.35, -F + 0.12, g);
  // the windows: frames, sills, lintels, the glass (it breaks)
  const glassM = new THREE.MeshStandardMaterial({ color: '#3c5466', roughness: 0.06, metalness: 0.55, envMapIntensity: 1.4 });
  const brokeT = twTex(twCanvas(128, 160, (c) => { c.clearRect(0, 0, 128, 160); c.fillStyle = '#fff'; const rr = new RNG(5); c.beginPath(); c.moveTo(0, 0); c.lineTo(128, 0); c.lineTo(128, 160); c.lineTo(0, 160); c.closePath();
    c.moveTo(14, 18); for (let i = 0; i < 22; i++) { const a = i / 22 * 6.283, rad = 40 + rr.range(-14, 16); c.lineTo(64 + Math.cos(a) * rad * 0.95, 80 + Math.sin(a) * rad * 1.25); } c.closePath(); c.fill('evenodd'); }), { repeat: false });
  const brokeM = new THREE.MeshStandardMaterial({ color: '#3c5466', roughness: 0.06, metalness: 0.55, alphaMap: brokeT, transparent: false, alphaTest: 0.5, side: THREE.DoubleSide });
  const yourGlass = [];
  for (const [x0, x1, y0, y1] of wins) {
    const w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    twBox(w + 0.12, 0.09, 0.42, trimM, cx, y0 - 0.015, -F + 0.04, g);
    twBox(w + 0.2, 0.2, 0.1, trimM, cx, y1 + 0.1, -F + 0.05, g);
    // (the frames run 3 cm into the wall on each side: none of their faces lies on the opening's)
    for (const dx of [-1, 1]) twBox(0.09, h + 0.06, 0.3, frameM, cx + dx * (w / 2 - 0.015), cy, -F - 0.17, g);
    twBox(w - 0.12, 0.05, 0.08, frameM, cx, cy + 0.08, -F - 0.2, g);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.1, h - 0.06), glassM); p.position.set(cx, cy, -F - 0.24); g.add(p);
    const pb = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.1, h - 0.06), brokeM); pb.position.copy(p.position); pb.visible = false; g.add(pb);
    yourGlass.push({ p, pb, x: cx, y: cy });
  }
  // the cornice and its brackets
  twBox(6.1, 0.55, 0.62, twStd('#3a2a20', 0.7), 0, HH + 0.2, -F + 0.18, g);
  for (let k = -2; k <= 2; k++) twBox(0.18, 0.5, 0.4, twStd('#3a2a20', 0.7), k * 1.4, HH - 0.25, -F + 0.12, g);
  // the stoop: the top step (you start on it), the lower step, the railings
  twBox(2.4, 0.45, 1.2, stoneM, 0, 0.225, -F + 0.6, g);
  twBox(2.4, 0.22, 0.5, stoneM, 0, 0.11, -F + 1.45, g);
  const ironM = twStd('#18191a', 0.45, 0.6);
  for (const sx of [-1.25, 1.25]) {
    twCyl(0.025, 0.025, 1.0, ironM, sx, 0.95, -F + 0.05, g, 6); twCyl(0.025, 0.025, 1.0, ironM, sx, 0.72, -F + 1.65, g, 6);
    const rail = twBox(0.04, 0.04, 1.7, ironM, sx, 1.33, -F + 0.85, g); rail.rotation.x = Math.atan2(0.23, 1.6);
    for (let k = 0; k < 6; k++) twCyl(0.012, 0.012, 0.85, ironM, sx, 0.85 - k * 0.02, -F + 0.25 + k * 0.25, g, 4);
  }
  // a planter under each ground-floor window
  for (const [x0, x1] of [[-2.45, -1.35], [1.35, 2.45]]) { twBox(x1 - x0 + 0.1, 0.24, 0.3, twStd('#3a2a20', 0.8), (x0 + x1) / 2, 1.0, -F + 0.2, g); for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(twBlobGeo(0.16, k + 9), twStd(k % 2 ? '#c84a5a' : '#5a8a3a', 0.8)); b.position.set(x0 + 0.2 + k * 0.35, 1.2, -F + 0.2); g.add(b); } }
  return { g, glass: yourGlass, lampM, doorM };
}
