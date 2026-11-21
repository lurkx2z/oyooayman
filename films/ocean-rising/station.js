/* =====================================================================
   STATION — the light station's buildings on Harrow Rock (layout.js has the numbers):
     ocTower(scene)  the tower: a white stone cone (its door to the west, a doorway through the 1.6 m wall), inside:
                     the power room on the ground floor, 142 cast-iron steps cantilevered round an open well up to the
                     watch room (+42), a ladder up into the lantern (+45); the gallery round it; the lantern (ten panes,
                     its black roof, the ball and the rod); the lens (four bull's-eye panels turning once in 20 s: a flash
                     every 5 s), its beams in the evening air, its glare; the water that comes in.
     ocHouse(scene)  the keeper's house: two storeys of white clapboard, a red roof; the kitchen (the range, the table,
                     the sink under the window, the coastguard radio), its light; the water that comes in under the door
     ocFogHouse(scene)   the fog signal house on the east cliff (red brick), its horn facing the sea
     ocOilHouse(scene)   the little brick oil house
   ===================================================================== */

// a box whose UVs are in metres / k (so a texture tiles at its real size on any face)
function ocBoxU(w, h, d, m, x, y, z, parent, k = 1, ry = 0) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const j = f * 4 + i; uv.setXY(j, uv.getX(j) * dims[f][0] / k, uv.getY(j) * dims[f][1] / k); }
  const o = ocMesh(g, m, x, y, z, parent); o.rotation.y = ry; return o;
}
// textures
const OC_TEXK = {};
function ocTexes() {
  if (OC_TEXK.done) return OC_TEXK;
  const r = new RNG(91);
  // whitewashed stone (the tower outside): faint courses, stains running down
  OC_TEXK.stone = ocTex(ocCanvas(512, 512, (c, w, h) => { c.fillStyle = '#efeee8'; c.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 64) { c.fillStyle = 'rgba(80,76,70,0.10)'; c.fillRect(0, y, w, 2); for (let x = (y / 64) % 2 * 48; x < w; x += 96) c.fillRect(x, y, 2, 64); }
    for (let i = 0; i < 1800; i++) { c.fillStyle = `rgba(${r.next() < 0.5 ? '255,255,255' : '90,84,74'},${r.range(0.02, 0.07)})`; c.fillRect(r.range(0, w), r.range(0, h), r.range(1, 4), r.range(1, 4)); }
    for (let i = 0; i < 18; i++) { const x = r.range(0, w), g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(110,100,84,0.10)'); g.addColorStop(1, 'rgba(110,100,84,0)'); c.fillStyle = g; c.fillRect(x, r.range(0, h * 0.5), r.range(2, 7), h); } }));
  // whitewashed brick (inside)
  OC_TEXK.brick = ocTex(ocCanvas(512, 512, (c, w, h) => { c.fillStyle = '#cfcac0'; c.fillRect(0, 0, w, h);
    for (let row = 0; row < 32; row++) for (let k = -1; k < 9; k++) { const x = k * 64 + (row % 2) * 32, v = r.range(-10, 8); c.fillStyle = `rgb(${226 + v},${222 + v},${212 + v})`; c.fillRect(x + 2, row * 16 + 2, 60, 12); }
    for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(120,96,70,${r.range(0.04, 0.12)})`; c.beginPath(); c.arc(r.range(0, w), r.range(0, h), r.range(4, 30), 0, 6.3); c.fill(); } }));
  // clapboard (white paint, a shadow line under each board: 10 boards a metre)
  OC_TEXK.clap = ocTex(ocCanvas(256, 256, (c, w, h) => { for (let i = 0; i < 10; i++) { const y = i * 25.6, v = 232 + r.range(-6, 6); c.fillStyle = `rgb(${v},${v},${v - 4})`; c.fillRect(0, y, w, 25.6);
      const g = c.createLinearGradient(0, y, 0, y + 25.6); g.addColorStop(0, 'rgba(255,255,255,0.1)'); g.addColorStop(0.75, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.2)'); c.fillStyle = g; c.fillRect(0, y, w, 25.6);
      c.fillStyle = 'rgba(40,36,30,0.5)'; c.fillRect(0, y + 23.8, w, 1.8); }
    for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(0,0,0,${r.range(0.01, 0.05)})`; c.fillRect(r.range(0, w), r.range(0, h), r.range(1, 3), r.range(3, 14)); } }));
  // red roofing (asphalt shingles)
  OC_TEXK.shingle = ocTex(ocCanvas(256, 256, (c, w, h) => { c.fillStyle = '#4a1612'; c.fillRect(0, 0, w, h);
    for (let row = 0; row < 16; row++) { let x = (row % 2) * -16; while (x < w) { const sw = 32, v = r.range(-18, 14); c.fillStyle = `rgb(${132 + v},${42 + v * 0.4},${34 + v * 0.3})`; c.fillRect(x + 1, row * 16 + 1, sw - 2, 15); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x + 1, row * 16 + 13, sw - 2, 3); x += sw; } }
    for (let i = 0; i < 1500; i++) { c.fillStyle = `rgba(${r.next() < 0.5 ? '255,220,200' : '0,0,0'},${r.range(0.03, 0.1)})`; c.fillRect(r.range(0, w), r.range(0, h), 1.5, 1.5); } }));
  // red brick
  OC_TEXK.redBrick = ocTex(ocBrickCanvas(17, [150, 64, 48]));
  // floorboards
  OC_TEXK.boards = ocTex(ocCanvas(256, 256, (c, w, h) => { for (let i = 0; i < 8; i++) { const v = r.range(-14, 10); c.fillStyle = `rgb(${150 + v},${108 + v},${70 + v})`; c.fillRect(i * 32, 0, 32, h); c.fillStyle = 'rgba(30,20,10,0.5)'; c.fillRect(i * 32, 0, 1.5, h); c.fillRect(i * 32, r.range(0, h), 32, 1.5); }
    for (let i = 0; i < 500; i++) { c.fillStyle = `rgba(60,40,20,${r.range(0.03, 0.1)})`; c.fillRect(r.range(0, w), r.range(0, h), 1, r.range(4, 20)); } }));
  // stone flags (the tower's floor)
  OC_TEXK.flags = ocTex(ocPavingCanvas(23));
  // the water's ripples: a tiling normal map
  OC_TEXK.ripple = (() => { const N = 128, c = ocCanvas(N, N, () => {}), g = c.getContext('2d'), img = g.createImageData(N, N), H = (x, y) => { let v = 0; for (let k = 0; k < 6; k++) { const a = k * 2.399, f = 1 + k, kx = Math.round(Math.cos(a) * f), ky = Math.round(Math.sin(a) * f) || 1; v += Math.sin((kx * x + ky * y) / N * 6.2832 + k * 1.7) / f; } return v; };
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const dx = H(x + 1, y) - H(x - 1, y), dy = H(x, y + 1) - H(x, y - 1), l = Math.hypot(dx * 3, dy * 3, 1), i = (y * N + x) * 4; img.data[i] = (0.5 - dx * 1.5 / l) * 255; img.data[i + 1] = (0.5 - dy * 1.5 / l) * 255; img.data[i + 2] = (0.5 + 0.5 / l) * 255; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0); return ocTex(c, { srgb: false }); })();
  OC_TEXK.done = true;
  return OC_TEXK;
}
// water standing indoors (the house, the tower, the lantern): dark, glossy, rippling
function ocInWater(color = '#10302f') {
  const T = ocTexes(), n = T.ripple.clone(); n.needsUpdate = true; n.repeat.set(1.6, 1.6);
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.07, metalness: 0.15, normalMap: n, normalScale: new THREE.Vector2(0.35, 0.35), transparent: true, opacity: 0.9, envMapIntensity: 0.8 });
  m.userData.tick = (t) => { n.offset.set(t * 0.03, t * 0.021); };
  return m;
}

// ---------------------------------------------------------------------------------------------------------------------
// THE TOWER
// ---------------------------------------------------------------------------------------------------------------------
function ocTower(scene) {
  const T = OC_F.tower, X = ocTexes(), g = new THREE.Group(); scene.add(g);
  const white = new THREE.MeshStandardMaterial({ color: '#f1f0ea', map: X.stone, roughness: 0.82 });
  const black = ocStd('#1b1d1f', 0.45, 0.65), iron = ocStd('#2a2c2e', 0.55, 0.7), inside = new THREE.MeshStandardMaterial({ color: '#f2efe6', map: X.brick, roughness: 0.9 });
  const dA = Math.asin(T.door.w / 2 / T.rB), dAi = Math.asin(T.door.w / 2 / T.inner), dY0 = T.sill, dY1 = T.sill + T.door.h;
  // ---- the outer wall: a cone from the base to the gallery, with the doorway's hole (angles round x = −r: the west)
  {
    const A = []; for (let i = 0; i <= 72; i++) A.push(i / 72 * Math.PI * 2); A.push(Math.PI - dA, Math.PI + dA); A.sort((a, b) => a - b);
    const Y = [T.base - 0.6, T.base, dY0, dY1]; for (let y = 18; y < T.top; y += 3) Y.push(y); Y.push(T.top); Y.sort((a, b) => a - b);
    const pos = [], uv = [], idx = [], nA = A.length;
    Y.forEach((y) => A.forEach((a) => { const R = ocTowerR(Math.max(y, T.base)); pos.push(Math.cos(a) * R, y, Math.sin(a) * R); uv.push(a * R / 2, y / 2); }));
    for (let j = 0; j < Y.length - 1; j++) for (let i = 0; i < nA - 1; i++) {
      const am = (A[i] + A[i + 1]) / 2, ym = (Y[j] + Y[j + 1]) / 2;
      if (Math.abs(am - Math.PI) < dA && ym > dY0 && ym < dY1) continue;
      const a = j * nA + i, b = a + 1, c = a + nA, d = c + 1; idx.push(a, c, b, b, c, d);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    ocMesh(geo, white, 0, 0, 0, g);
  }
  // the corbelled cornice under the gallery, the gallery deck, its brackets, its railing
  const LR0 = T.lanternR;
  const cor = new THREE.LatheGeometry([[T.rT - 0.02, T.top - 1.6], [T.rT + 0.08, T.top - 0.9], [T.rT + 0.25, T.top - 0.45], [T.galleryR - 0.05, T.top - 0.22], [T.galleryR - 0.05, T.top - 0.19]].map(([x, y]) => new THREE.Vector2(x, y)), 64);
  ocMesh(cor, white, 0, 0, 0, g);
  // (a ring: open over the watch room, where the lantern's floor and its hatch are)
  const deck = ocMesh(new THREE.LatheGeometry([[LR0, T.top - 0.06], [T.inner + 0.05, T.top - 0.06], [T.inner + 0.05, T.top - 0.2], [T.galleryR, T.top - 0.2], [T.galleryR, T.top], [LR0, T.top], [LR0, T.top - 0.06]].map(([x, y]) => new THREE.Vector2(x, y)), 64), iron, 0, 0, 0, g);
  deck.material = deck.material.clone(); deck.material.side = THREE.DoubleSide;
  const railM = black, posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.022, 0.022, T.rail, 6), railM, 32); posts.castShadow = true; g.add(posts);
  { const o = new THREE.Object3D(); for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2; o.position.set(Math.cos(a) * (T.galleryR - 0.06), T.top + T.rail / 2, Math.sin(a) * (T.galleryR - 0.06)); o.updateMatrix(); posts.setMatrixAt(i, o.matrix); } }
  for (const [y, rr] of [[T.top + T.rail, 0.03], [T.top + 0.55, 0.016]]) { const tr = ocMesh(new THREE.TorusGeometry(T.galleryR - 0.06, rr, 6, 96), railM, 0, y, 0, g); tr.rotation.x = Math.PI / 2; }
  // the door: a granite surround on the outer face, the doorway through the wall, the door (oak, painted red)
  const granite = ocStd('#8d8a84', 0.85), xo = -ocTowerR(dY0) + 0.02;
  ocBox(0.3, T.door.h + 0.32, 0.26, granite, xo - 0.05, dY0 + T.door.h / 2 + 0.06, T.door.w / 2 + 0.13, g); ocBox(0.3, T.door.h + 0.32, 0.26, granite, xo - 0.05, dY0 + T.door.h / 2 + 0.06, -T.door.w / 2 - 0.13, g);
  ocBox(0.34, 0.3, T.door.w + 0.8, granite, xo - 0.07, dY1 + 0.15, 0, g); ocBox(0.5, 0.16, T.door.w + 0.6, granite, xo - 0.15, dY0 - 0.08, 0, g);
  const tun = [], xi = -Math.sqrt(T.inner * T.inner - 0.25);
  { const len = xi - xo, xm = (xo + xi) / 2;
    tun.push(ocBox(Math.abs(len), T.door.h, 0.06, inside, xm, dY0 + T.door.h / 2, T.door.w / 2 + 0.03, g), ocBox(Math.abs(len), T.door.h, 0.06, inside, xm, dY0 + T.door.h / 2, -T.door.w / 2 - 0.03, g),
      ocBox(Math.abs(len), 0.06, T.door.w + 0.12, inside, xm, dY1 + 0.03, 0, g), ocBox(Math.abs(len), 0.08, T.door.w + 0.12, ocStd('#6d6a64', 0.9), xm, dY0 - 0.04, 0, g)); }
  const doorG = new THREE.Group(); g.add(doorG); doorG.position.set(xo + 0.16, dY0, -T.door.w / 2);   // (hinged on its south edge)
  const doorM = ocStd('#7a2420', 0.6), doorLeaf = ocBox(0.09, T.door.h - 0.02, T.door.w - 0.02, doorM, 0, T.door.h / 2, T.door.w / 2, doorG);
  for (const y of [0.35, 1.0, 1.65]) ocBox(0.03, 0.06, T.door.w * 0.9, iron, 0.06, y, T.door.w / 2, doorG);                 // iron straps (inside)
  const bolts = [0.55, 1.45].map((y) => ocBox(0.05, 0.05, 0.36, ocStd('#5a5c5e', 0.4, 0.9), 0.08, y, T.door.w * 0.8, doorG));   // the bolts you shoot
  // ---- inside: the shaft (whitewashed brick), its doorway's hole; the floor; the stairs; the well; the watch room
  {
    const A = []; for (let i = 0; i <= 48; i++) A.push(i / 48 * Math.PI * 2); A.push(Math.PI - dAi, Math.PI + dAi); A.sort((a, b) => a - b);
    const Y = [T.sill - 0.02, dY0, dY1]; for (let y = 19; y < T.top; y += 2) Y.push(y); Y.push(T.top - 0.2); Y.sort((a, b) => a - b);
    const pos = [], uv = [], idx = [], nA = A.length;
    Y.forEach((y) => A.forEach((a) => { pos.push(Math.cos(a) * T.inner, y, Math.sin(a) * T.inner); uv.push(a * T.inner / 2, y / 2); }));
    for (let j = 0; j < Y.length - 1; j++) for (let i = 0; i < nA - 1; i++) {
      const am = (A[i] + A[i + 1]) / 2, ym = (Y[j] + Y[j + 1]) / 2;
      if (Math.abs(am - Math.PI) < dAi && ym > dY0 && ym < dY1) continue;
      const a = j * nA + i, b = a + 1, c = a + nA, d = c + 1; idx.push(a, b, c, b, d, c);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const m = ocMesh(geo, inside, 0, 0, 0, g); m.castShadow = false;
  }
  const floor = ocMesh(new THREE.CircleGeometry(T.inner + 0.02, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: X.flags, roughness: 0.85 }), 0, T.sill, 0, g);
  X.flags.repeat.set(2, 2);
  // the stairs: 142 cast-iron treads (a wedge each, a slotted plate), cantilevered from the wall round the open well
  const N = T.steps, dT = 0.2435, th0 = Math.PI + 0.62, rI = T.well, rO = T.inner - 0.01;
  const stepY = (k) => T.sill + T.rise * (k + 1), stepA = (k) => th0 + k * dT;
  const wedge = (() => { const sh = new THREE.Shape(), a0 = -dT * 0.53, a1 = dT * 0.53; sh.moveTo(Math.cos(a0) * rI, Math.sin(a0) * rI); sh.lineTo(Math.cos(a0) * rO, Math.sin(a0) * rO); sh.absarc(0, 0, rO, a0, a1, false); sh.lineTo(Math.cos(a1) * rI, Math.sin(a1) * rI); sh.absarc(0, 0, rI, a1, a0, true);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.045, bevelEnabled: false, curveSegments: 4 }); geo.rotateX(Math.PI / 2); return geo; })();
  const steps = new THREE.InstancedMesh(wedge, ocStd('#3a3c3e', 0.6, 0.6), N); steps.castShadow = steps.receiveShadow = true; g.add(steps);
  const balus = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.012, 0.9, 5), ocStd('#2b2d2f', 0.5, 0.7), N); g.add(balus);
  { const o = new THREE.Object3D(); for (let k = 0; k < N; k++) { const a = stepA(k), y = stepY(k);
      // (a step k at angle a: the wedge's local frame turned by −a about y, since the shape was in x-z after the rotation)
      o.position.set(0, y, 0); o.rotation.set(0, -a, 0); o.updateMatrix(); steps.setMatrixAt(k, o.matrix);
      o.position.set(Math.cos(a) * (rI + 0.04), y + 0.45, Math.sin(a) * (rI + 0.04)); o.rotation.set(0, 0, 0); o.updateMatrix(); balus.setMatrixAt(k, o.matrix); } }
  // the handrail: a helix over the balusters
  { const P = []; for (let k = -0.5; k <= N - 0.5; k += 0.25) { const a = th0 + k * dT, y = T.sill + T.rise * (k + 1) + 0.9; P.push(new THREE.Vector3(Math.cos(a) * (rI + 0.04), y, Math.sin(a) * (rI + 0.04))); }
    ocMesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(P), N * 6, 0.022, 6), ocStd('#3a2a1e', 0.5, 0.2), 0, 0, 0, g); }
  // the bulkhead lamps up the wall (one every turn), the power room's panel, batteries and cable runs
  const lampM = new THREE.MeshStandardMaterial({ color: '#fff4dc', emissive: new THREE.Color('#ffe2b0'), emissiveIntensity: 2.2, roughness: 0.4 });
  const fixtures = []; for (let k = 4; k < N; k += 26) { const a = stepA(k) + 0.3, y = stepY(k) + 1.9; if (y > T.watch - 0.4) continue; /* (none in the watch room) */ const m = ocMesh(new THREE.SphereGeometry(0.07, 10, 8), lampM, Math.cos(a) * (T.inner - 0.09), y, Math.sin(a) * (T.inner - 0.09), g); m.castShadow = false; fixtures.push([m.position.x, y, m.position.z]); }
  fixtures.unshift([0.6, T.sill + 2.5, 2.25]);
  const panelM = ocStd('#7e8487', 0.5, 0.5);
  ocBox(0.24, 1.2, 0.8, panelM, T.inner - 0.14, T.sill + 1.3, -0.5, g);
  const panelLeds = [0, 1, 2].map((i) => { const m = ocMesh(new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshBasicMaterial({ color: '#45ff7a' }), T.inner - 0.27, T.sill + 1.7 - i * 0.08, -0.72, g); m.castShadow = false; return m; });
  for (const z of [0.55, 1.35]) ocBox(0.5, 0.75, 0.68, ocStd('#262a2e', 0.6, 0.3), T.inner - 0.45, T.sill + 0.375, z, g);
  ocBox(0.04, T.watch - T.sill, 0.08, ocStd('#5d6266', 0.5, 0.5), T.inner - 0.05, (T.watch + T.sill) / 2, -0.95, g);
  // the windows up the stair (small, deep): a lit pane inside, a dark pane outside
  const winIn = new THREE.MeshStandardMaterial({ color: '#202830', roughness: 0.1, metalness: 0.4, emissive: new THREE.Color('#141c26'), emissiveIntensity: 1 });
  const winOut = new THREE.MeshStandardMaterial({ color: '#0f1418', roughness: 0.08, metalness: 0.6, emissive: new THREE.Color('#ffcf8a'), emissiveIntensity: 0 });
  const wins = [[0.4, 21.5], [2.3, 27.5], [4.4, 33.5], [0.9, 39.0]].map(([a, y]) => {
    const R = ocTowerR(y) + 0.015, m = ocMesh(new THREE.PlaneGeometry(0.42, 0.85), winOut, Math.cos(a) * R, y, Math.sin(a) * R, g); m.lookAt(Math.cos(a) * 10, y, Math.sin(a) * 10);
    const mi = ocMesh(new THREE.PlaneGeometry(0.42, 0.85), winIn, Math.cos(a) * (T.inner - 0.01), y, Math.sin(a) * (T.inner - 0.01), g); mi.lookAt(0, y, 0); return { a, y };
  });
  // ---- the watch room: its floor (an opening over the last steps), the radio desk, the lamp's battery box, the ladder
  const wFloorM = ocStd('#43464a', 0.7, 0.5);
  { const aEnd = stepA(N - 1), a0 = aEnd - 11 * dT;           // (the hole over the last 11 steps)
    const ring = new THREE.RingGeometry(rI - 0.01, T.inner, 48, 1, aEnd + dT * 0.55, Math.PI * 2 - (aEnd - a0) - dT * 0.6); ring.rotateX(Math.PI / 2);
    const fm = ocMesh(ring, wFloorM, 0, T.watch + 0.002, 0, g); fm.material = wFloorM.clone(); fm.material.side = THREE.DoubleSide;
    ocMesh(new THREE.CircleGeometry(rI, 32).rotateX(-Math.PI / 2), wFloorM, 0, T.watch + 0.004, 0, g); }
  ocBox(0.9, 0.05, 0.5, ocStd('#6a4a30', 0.7), 0.2, T.watch + 0.8, T.inner - 0.3, g);
  const radio = ocBox(0.32, 0.1, 0.22, ocStd('#1b1d20', 0.5, 0.3), 0.15, T.watch + 0.875, T.inner - 0.3, g);
  const radioLcd = ocMesh(new THREE.PlaneGeometry(0.1, 0.035), new THREE.MeshBasicMaterial({ color: '#ff8a3a' }), 0.12, T.watch + 0.88, T.inner - 0.41, g); radioLcd.rotation.y = Math.PI;
  ocBox(0.5, 0.7, 0.5, ocStd('#30363b', 0.6, 0.4), T.inner - 0.45, T.watch + 0.35, 0.9, g);
  // the ceiling (the lantern's floor) with its hatch, the ladder up through it
  // (a disc with the hatch cut out of it: the same shape for the watch room's ceiling and the lantern's floor)
  const HX = 0.95, hatch = (r) => { const sh = new THREE.Shape(); sh.absarc(0, 0, r, 0, Math.PI * 2, false); const ho = new THREE.Path(); ho.absarc(HX, 0, 0.42, 0, Math.PI * 2, true); sh.holes.push(ho); const gg = new THREE.ShapeGeometry(sh, 48); gg.rotateX(Math.PI / 2); return gg; };
  ocMesh(hatch(T.inner), ocStd('#bdb8ae', 0.85, 0.1), 0, T.top - 0.2, 0, g).castShadow = false;
  const ladder = new THREE.Group(); g.add(ladder); ladder.position.set(HX, T.watch, 0.0);
  for (const sd of [-0.2, 0.2]) ocBox(0.04, 3.4, 0.04, iron, sd, 1.7, 0, ladder);
  for (let i = 0; i < 10; i++) ocBox(0.4, 0.025, 0.025, iron, 0, 0.3 + i * 0.3, 0, ladder);
  // watch room windows (four portholes)
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4, y = T.watch + 1.6, R = ocTowerR(y) + 0.015; const m = ocMesh(new THREE.CircleGeometry(0.26, 20), winOut, Math.cos(a) * R, y, Math.sin(a) * R, g); m.lookAt(Math.cos(a) * 10, y, Math.sin(a) * 10);
    const mi = ocMesh(new THREE.CircleGeometry(0.26, 20), winIn, Math.cos(a) * (T.inner - 0.01), y, Math.sin(a) * (T.inner - 0.01), g); mi.lookAt(0, y, 0); }
  // ---- the lantern: an iron base, ten panes of glass between bars, the cornice, the black roof, the ball and the rod
  const LR = T.lanternR, gl0 = T.glass[0], gl1 = T.glass[1];
  ocMesh(new THREE.CylinderGeometry(LR + 0.04, LR + 0.08, gl0 - T.top, 40, 1, true), ocStd('#1b1d1f', 0.45, 0.65, { side: THREE.DoubleSide }), 0, (gl0 + T.top) / 2, 0, g);   // (open: the lantern's floor is its own, with the hatch)
  const glassM = new THREE.MeshStandardMaterial({ color: '#cfdde2', roughness: 0.04, metalness: 0.3, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.6 });
  const glass = ocMesh(new THREE.CylinderGeometry(LR, LR, gl1 - gl0, 10, 1, true), glassM, 0, (gl0 + gl1) / 2, 0, g); glass.castShadow = false; glass.renderOrder = 3;
  for (let i = 0; i < 10; i++) { const a = (i + 0.5) / 10 * Math.PI * 2, rr = LR / Math.cos(Math.PI / 10) * 0.99; ocBox(0.05, gl1 - gl0, 0.05, black, Math.sin(a) * rr, (gl0 + gl1) / 2, Math.cos(a) * rr, g, a); }
  for (const y of [gl0 + 1.0, gl0 + 2.0]) { const tr = ocMesh(new THREE.TorusGeometry(LR + 0.005, 0.018, 4, 10), black, 0, y, 0, g); tr.rotation.x = Math.PI / 2; tr.rotation.z = Math.PI / 10; }
  ocCyl(LR + 0.16, LR + 0.06, T.eave - gl1, black, 0, (gl1 + T.eave) / 2, 0, g, 40);
  const roofM = ocStd('#55695f', 0.42, 0.35), roof = ocMesh(new THREE.ConeGeometry(LR + 0.2, T.dome - T.eave, 40, 1), roofM, 0, (T.eave + T.dome) / 2, 0, g); 
  // (its lining, seen from inside the lantern: painted, catching the lamp's light)
  { const ri = ocMesh(new THREE.ConeGeometry(LR + 0.14, T.dome - T.eave - 0.04, 40, 1, true), ocStd('#a39b8a', 0.7, 0.15, { side: THREE.BackSide }), 0, (T.eave + T.dome) / 2 - 0.03, 0, g); ri.castShadow = false; }
  ocMesh(new THREE.SphereGeometry(0.24, 16, 12), roofM, 0, T.ball, 0, g); ocCyl(0.06, 0.09, T.ball - T.dome + 0.1, roofM, 0, (T.ball + T.dome) / 2 - 0.05, 0, g, 12);   // (the ventilator ball on its neck)
  ocCyl(0.018, 0.03, T.rod - T.ball, black, 0, (T.ball + T.rod) / 2, 0, g, 6);
  ocBox(0.36, 0.08, 0.01, black, 0.12, T.rod - 0.35, 0, g);                       // (the vane)
  // the lantern's floor (a grating), the low door out onto the gallery (to the west)
  { const fl = ocMesh(hatch(LR), ocStd('#2d3033', 0.6, 0.6), 0, T.top + 0.003, 0, g); fl.castShadow = false; fl.material = fl.material.clone(); fl.material.side = THREE.DoubleSide; }
  // ---- the lens: a pedestal, then the optic (four bull's-eye panels, prism rings over and under), turning
  ocCyl(0.18, 0.26, T.lamp - 0.72 - T.top, ocStd('#2e3236', 0.4, 0.8), 0, (T.lamp - 0.72 + T.top) / 2, 0, g, 16);
  const lens = new THREE.Group(); g.add(lens); lens.position.set(0, T.lamp, 0);
  const lensU = { uFlash: { value: 0 }, uOn: { value: 1 }, uCam: { value: new THREE.Vector3() }, uUnder: { value: 0 } };
  const lensM = new THREE.ShaderMaterial({ uniforms: lensU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vW; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform float uFlash, uOn, uUnder; uniform vec3 uCam; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main(){ vec2 q = vec2(fract(vUv.x * 4.0) - 0.5, vUv.y - 0.5); float r = length(q);
        float rr = r * 11.0, rings = smoothstep(0.82, 0.98, fract(rr)) * (1.0 - smoothstep(4.6, 5.2, rr)), face = pow(max(dot(normalize(vN), normalize(uCam - vW)), 0.0), 18.0);
        vec3 c = mix(vec3(1.0, 0.88, 0.66), vec3(0.6, 1.0, 0.85), uUnder);
        float eye = smoothstep(0.1, 0.06, r);
        float k = uOn * (0.025 + 0.16 * rings + 0.25 * eye + face * (1.6 * rings + 3.0 * eye + 0.6) * exp(-r * 2.4));
        gl_FragColor = vec4(c * k, 1.0); }` });
  const lensBody = ocMesh(new THREE.CylinderGeometry(0.62, 0.62, 0.86, 4, 1, true), lensM, 0, 0, 0, lens); lensBody.castShadow = false;
  // the beehive: rings of prisms over and under the panels (glass catching the lamp), on a brass frame
  const prismM = new THREE.MeshStandardMaterial({ color: '#c9dcd8', roughness: 0.08, metalness: 0.75, transparent: true, opacity: 0.7, emissive: new THREE.Color('#ffd9a0'), emissiveIntensity: 0.14 });
  for (let i = 0; i < 7; i++) { const u = i / 6, r = 0.58 - 0.26 * u * u;
    for (const sd of [1, -1]) { const pr = ocMesh(new THREE.TorusGeometry(r, 0.022, 6, 32), prismM, 0, sd * (0.47 + i * 0.06), 0, lens); pr.rotation.x = Math.PI / 2; pr.castShadow = false; } }
  ocCyl(0.66, 0.66, 0.05, ocStd('#8a7a52', 0.4, 0.9), 0, -0.45, 0, lens, 24); ocCyl(0.66, 0.66, 0.05, ocStd('#8a7a52', 0.4, 0.9), 0, 0.45, 0, lens, 24);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; ocBox(0.03, 0.9, 0.03, ocStd('#8a7a52', 0.4, 0.9), Math.cos(a) * 0.62, 0, Math.sin(a) * 0.62, lens); }
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + 0.2, m = ocMesh(new THREE.CylinderGeometry(0.008, 0.008, 1, 4), ocStd('#8a7a52', 0.4, 0.9), 0, 0, 0, lens); ocStrut(m, [Math.cos(a) * 0.6, 0.47, Math.sin(a) * 0.6], [Math.cos(a) * 0.32, 0.86, Math.sin(a) * 0.32], 0.008); ocStrut(ocMesh(new THREE.CylinderGeometry(0.008, 0.008, 1, 4), ocStd('#8a7a52', 0.4, 0.9), 0, 0, 0, lens), [Math.cos(a) * 0.6, -0.47, Math.sin(a) * 0.6], [Math.cos(a) * 0.32, -0.86, Math.sin(a) * 0.32], 0.008); }
  const bulb = ocMesh(new THREE.SphereGeometry(0.06, 12, 10), new THREE.MeshBasicMaterial({ color: '#fff3d0' }), 0, 0, 0, lens); bulb.castShadow = false;
  // ---- the beams: four long soft cones in the evening air, along the panels' axes
  const beamU = { uK: { value: 1 }, uLen: { value: 900 }, uCol: { value: new THREE.Color(1.0, 0.9, 0.72) }, uNear: { value: 0 } };
  const beamM = new THREE.ShaderMaterial({ uniforms: beamU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    vertexShader: 'varying float vD; varying vec3 vN; varying vec3 vW; void main(){ vD = position.y; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform float uK, uLen, uNear; uniform vec3 uCol; varying float vD; varying vec3 vN; varying vec3 vW;
      void main(){ float d = max(vD, 0.0); vec3 V = normalize(cameraPosition - vW); float edge = pow(abs(dot(normalize(vN), V)), 2.2);
        float k = uK * edge * exp(-d / (uLen * 0.28)) * smoothstep(0.0, 3.0, d) * smoothstep(uNear * 0.6, uNear * 2.2 + 0.001, d) / (1.0 + d * 0.012);
        gl_FragColor = vec4(uCol * k * 0.42, 1.0); }` });
  const beams = [];
  const beamGeo = new THREE.CylinderGeometry(28, 0.42, 900, 24, 1, true); beamGeo.translate(0, 450, 0);     // (along +y: the shader reads the distance as y)
  for (let i = 0; i < 4; i++) { const pv = new THREE.Group(); lens.add(pv); pv.rotation.y = i * Math.PI / 2 + Math.PI / 4;
    const b = new THREE.Mesh(beamGeo, beamM); b.rotation.z = -Math.PI / 2; b.frustumCulled = false; b.renderOrder = 7; b.castShadow = false; pv.add(b); beams.push(b); }
  // the glare: a soft star at the lens, big when a beam swings across the camera
  const glareM = new THREE.SpriteMaterial({ map: ocDotTex(0.22), color: '#ffe6c0', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false });
  const glare = new THREE.Sprite(glareM); glare.renderOrder = 8; g.add(glare); glare.position.set(0, T.lamp, 0);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: ocDotTex(0.5), color: '#ffd9a0', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false })); glow.renderOrder = 8; g.add(glow); glow.position.set(0, T.lamp, 0);
  // the light the lamp throws on its own lantern, the gallery, you on the roof
  const lampL = new THREE.PointLight('#ffdcae', 0, 26, 1.4); lampL.position.set(0, T.lamp, 0); lampL.castShadow = false; g.add(lampL);
  // (and down through the hatch into the watch room: the only light in there once the power room floods)
  // (seen from below, the hatch is a warm opening: the lantern lit by the lamp)
  const hatchGlow = ocMesh(new THREE.CircleGeometry(0.42, 32).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ map: ocDotTex(0.45), color: '#ffcf96', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }), HX, T.top + 0.01, 0, g); hatchGlow.castShadow = false; hatchGlow.visible = false;
  const hatchL = new THREE.SpotLight('#ffd3a0', 0, 9, 0.5, 0.6, 1.2); hatchL.position.set(HX, T.top + 0.9, 0); hatchL.castShadow = false; g.add(hatchL); hatchL.target.position.set(HX, T.watch, 0); g.add(hatchL.target);
  // ---- the water that comes in (after the door gives): a disc filling the shaft; the lantern's water
  const wM = ocInWater('#0f2c2b'), water = ocMesh(new THREE.CircleGeometry(T.inner - 0.005, 48).rotateX(-Math.PI / 2), wM, 0, T.sill - 0.4, 0, g); water.castShadow = false; water.receiveShadow = true;
  const lanWater = ocMesh(new THREE.CircleGeometry(LR - 0.01, 40).rotateX(-Math.PI / 2), wM, 0, T.top, 0, g); lanWater.castShadow = false; lanWater.visible = false;
  // ---- the inside lights (they go out when the power room floods); two travel with the camera between the fixtures
  const inL = [0, 1].map(() => { const L = new THREE.PointLight('#ffe0b4', 0, 9, 1.6); L.castShadow = false; g.add(L); return L; });
  const _v = new THREE.Vector3();
  const beamAng = (s) => s / 20 * Math.PI * 2;       // the lens turns once in 20 s (west → south → east…)
  return {
    g, doorG, doorLeaf, bolts, lens, beams, glare, glow, lampL, water, inL, fixtures, lampM, panelLeds, winOut, glassM, wM, stepY, stepA, N, dT, th0, beamAng, radioLcd,
    // the lamp: on / under; its flash towards the camera
    set(s, t, cam, o = {}) {
      const P = OCP, E = OCE, h = P.h(s), dark = 1 - ocSkyK(ocSunAt(s).alt), under = h > T.lamp - 0.05;
      const ang = beamAng(s); lens.rotation.y = -ang;
      lensU.uCam.value.copy(cam.position); lensU.uUnder.value = under ? 1 : 0; prismM.emissive.set(under ? '#6fe8c0' : '#ffd9a0'); prismM.emissiveIntensity = under ? 0.22 : 0.14;
      // beams: visible in the air as the dusk deepens; under the sea they are the sea shader's (uLampUnder)
      beamU.uK.value = under ? 0 : (0.12 + 0.88 * dark) * (o.beamK ?? 1);
      for (const b of beams) b.visible = !under && (o.beams !== false);
      // the flash: how near a beam's axis points at the camera
      _v.set(cam.position.x, cam.position.y - T.lamp, cam.position.z); const dist = _v.length(); _v.normalize();
      let fl = 0; for (let i = 0; i < 4; i++) { const a = -(-ang + i * Math.PI / 2 + Math.PI / 4); const bx = Math.cos(a), bz = Math.sin(a); const c = Math.max(0, bx * _v.x + bz * _v.z) * Math.sqrt(Math.max(0, 1 - _v.y * _v.y)); fl = Math.max(fl, Math.pow(c, 90)); }
      beamU.uNear.value = dist < 12 ? dist : 0;   // (beside the lens: you are inside the beam as it passes; only its far part shows)
      const vis = o.glare === false ? 0 : 1;
      glare.visible = glow.visible = vis > 0 && !(cam.position.distanceTo(glare.position) < 2.5);
      const sz = MathX.clamp(dist * 0.08, 2.5, 300) * (under ? 0.3 : 1);
      glare.scale.setScalar(sz * (0.4 + 2.6 * fl)); glareM.opacity = MathX.clamp((0.25 + 0.75 * dark) * fl * 1.0, 0, 1) * (under ? 0.4 : 1) * MathX.smooth(dist, 3, 14);   // (right beside the lens the beams pass over your head)
      glow.scale.setScalar(sz * 0.35); glow.material.opacity = MathX.clamp(0.18 + 0.4 * dark, 0, 0.6) * (under ? 0.2 : 1);
      lensU.uFlash.value = fl;
      lampL.intensity = (under ? 6 : 14) * (0.4 + 0.6 * dark);
      lampL.color.set(under ? '#7affd0' : '#ffdcae');
      hatchL.intensity = !under && cam.position.y > T.watch - 0.5 && cam.position.y < T.top && Math.hypot(cam.position.x, cam.position.z) < T.inner ? 9 : 0;
      hatchGlow.visible = hatchL.intensity > 0;
      // the inside: the lights until the power room floods; the windows glow from outside while they're lit
      const lit = s < E.dark ? 1 : 0, flick = s > E.burst - 0.2 && s < E.dark ? (Math.sin(s * 53) > 0.3 ? 1 : 0.25) : 1;
      lampM.emissiveIntensity = 2.2 * lit * flick; winOut.emissiveIntensity = 0.85 * lit * flick * dark;
      for (const L of panelLeds) L.material.color.set(lit ? '#45ff7a' : '#06140a');
      radioLcd.material.color.set(s < E.watch + 1 ? '#ff8a3a' : '#1a0c06');
      // the two inside lights: at the fixtures nearest the camera (only when the camera is inside)
      const inside = Math.hypot(cam.position.x, cam.position.z) < T.inner && cam.position.y < T.top;
      const near = this.fixtures.map((f) => [Math.abs(f[1] - cam.position.y), f]).sort((a, b) => a[0] - b[0]);
      inL.forEach((L, i) => { const f = near[i][1]; L.position.set(f[0] * 0.92, f[1], f[2] * 0.92); L.intensity = inside ? 5.5 * lit * flick : 0; });
      // the door: shut and bolted; it gives at the burst (swings in, torn off its hinges)
      const kb = MathX.clamp((s - E.burst) / 0.7, 0, 1);
      doorG.rotation.y = s < E.burst ? 0.004 * Math.sin(t * 31) * MathX.smooth(h, T.sill + 2, T.sill + 6) : -1.9 * Ease.outCubic(kb);
      doorG.position.x = -ocTowerR(T.sill) + 0.18 + 1.6 * Ease.outCubic(kb);
      doorG.position.y = T.sill - 0.0 - 0.6 * kb * kb;
      // the water inside
      // (the shaft's water stops at the watch room's ceiling; over it, the lantern's own water)
      const wy = P.towerWater(s); water.position.y = Math.min(wy, T.top - 0.24); water.visible = wy > T.sill - 0.05 && h < T.top + 1.5; wM.userData.tick(t);
      lanWater.visible = h > T.top + 0.02 && h < T.eave + 0.3; lanWater.position.y = Math.min(h, T.eave - 0.02);
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE KEEPER'S HOUSE
// ---------------------------------------------------------------------------------------------------------------------
function ocHouse(scene) {
  const H = OC_F.house, X = ocTexes(), g = new THREE.Group(); scene.add(g);
  const clap = new THREE.MeshStandardMaterial({ color: '#f4f3ee', map: X.clap, roughness: 0.8 }), paint = ocStd('#c9d6cf', 0.9), trim = ocStd('#f6f6f2', 0.6), red = ocStd('#8e2a22', 0.6);
  const roofM = new THREE.MeshStandardMaterial({ color: '#ffffff', map: X.shingle, roughness: 0.85 });
  const tW = 0.16, y0 = H.floor - 0.05;
  // windows [wall, along, sill, top]; the door
  const gW = 0.85, F0 = [H.floor + 0.9, H.floor + 2.2], F1 = [H.floor + 3.4, H.floor + 4.6];
  const win = { S: [-23, -20, -17], N: [-23, -17], Nup: [-23, -20, -17], E: [6.6], Eup: [2.4, 6.1], W: [2.4, 6.1] };
  // (window glass you can see through: the lit kitchen from outside, the sea from inside)
  const glassLit = new THREE.MeshStandardMaterial({ color: '#b9c6cc', roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.16, depthWrite: false, envMapIntensity: 1.6, emissive: new THREE.Color('#ffc884'), emissiveIntensity: 0 });
  const glassDark = new THREE.MeshStandardMaterial({ color: '#0e1316', roughness: 0.05, metalness: 0.55, envMapIntensity: 1.3 });
  // a wall along an axis: 'x' walls at z = zc (outer face towards nz), 'z' walls at x = xc
  const wall = (axis, c, out, a0, a1, top, holes, gable) => {
    const cells = ocWallCells(a0, a1, y0, top, holes);
    for (const [u0, u1, v0, v1] of cells) {
      const w = u1 - u0, hh = v1 - v0, um = (u0 + u1) / 2, vm = (v0 + v1) / 2;
      // materials [+x, −x, +y, −y, +z, −z]: the outer face clapboard, the inner face paint
      const M = [paint, paint, paint, paint, paint, paint];
      if (axis === 'x') M[out > 0 ? 4 : 5] = clap; else M[out > 0 ? 0 : 1] = clap;
      if (axis === 'x') ocBoxU(w, hh, tW, M, um, vm, c, g, 1); else ocBoxU(tW, hh, w, M, c, vm, um, g, 1);
    }
    for (const [u0, u1, v0, v1, kind] of holes) {
      if (kind === 'door') continue;
      const lit = v0 < H.ceil, gm = lit ? glassLit : glassDark, um = (u0 + u1) / 2, vm = (v0 + v1) / 2, w = u1 - u0, hh = v1 - v0;
      const at = (du, dv, dn) => (axis === 'x' ? [um + du, vm + dv, c + dn * out] : [c + dn * out, vm + dv, um + du]);
      const pane = (axis === 'x') ? ocBox(w, hh, 0.02, gm, ...at(0, 0, -0.02), g) : ocBox(0.02, hh, w, gm, ...at(0, 0, -0.02), g); pane.castShadow = false;
      // the trim round it, the sill, the sash bars
      const bx = (bw, bh, du, dv, dn = 0.06, bd = 0.06) => (axis === 'x' ? ocBox(bw, bh, bd, trim, ...at(du, dv, dn), g) : ocBox(bd, bh, bw, trim, ...at(du, dv, dn), g));
      bx(w + 0.24, 0.1, 0, hh / 2 + 0.05); bx(w + 0.3, 0.07, 0, -hh / 2 - 0.035, 0.09, 0.12); bx(0.1, hh, w / 2 + 0.05, 0); bx(0.1, hh, -w / 2 - 0.05, 0);
      bx(w, 0.04, 0, 0, 0.0, 0.03); bx(0.035, hh, 0, 0, 0.0, 0.03);
    }
  };
  const holesX = (xs, floors) => { const o = []; for (const F of floors) for (const x of xs) o.push([x - gW / 2, x + gW / 2, F[0], F[1]]); return o; };
  wall('x', H.z1 - tW / 2, 1, H.x0, H.x1, H.eave, holesX(win.S, [F0, F1]));
  wall('x', H.z0 + tW / 2, -1, H.x0, H.x1, H.eave, [...holesX(win.N, [F0]), ...holesX(win.Nup, [F1])]);
  const dz = H.door.z, dw = H.door.w;
  wall('z', H.x1 - tW / 2, 1, H.z0 + tW, H.z1 - tW, H.eave, [[dz - dw / 2, dz + dw / 2, H.floor + H.door.sill, H.floor + H.door.sill + H.door.h, 'door'], ...holesX(win.E, [F0]), ...holesX(win.Eup, [F1])]);
  wall('z', H.x0 + tW / 2, -1, H.z0 + tW, H.z1 - tW, H.eave, holesX(win.W, [F0, F1]));
  // the gables (clapboard triangles) and the roof
  for (const [x, out] of [[H.x1 - tW / 2, 1], [H.x0 + tW / 2, -1]]) {
    const sh = new THREE.Shape(); sh.moveTo(H.z0, 0); sh.lineTo(H.z1, 0); sh.lineTo((H.z0 + H.z1) / 2, H.ridge - H.eave); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: tW, bevelEnabled: false }); geo.translate(0, 0, -tW / 2); geo.rotateY(-Math.PI / 2);
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i));
    ocMesh(geo, clap, x, H.eave, 0, g);
  }
  const half = (H.z1 - H.z0) / 2, rise = H.ridge - H.eave, ov = 0.45, slope = Math.atan2(rise, half), sl = Math.hypot(half, rise) + ov;
  for (const sd of [-1, 1]) { const r = ocBoxU(H.x1 - H.x0 + 0.9, 0.1, sl, roofM, (H.x0 + H.x1) / 2, H.ridge - Math.sin(slope) * sl / 2 + 0.06, (H.z0 + H.z1) / 2 + sd * Math.cos(slope) * sl / 2, g, 1.2);
    r.rotation.x = sd * slope; }
  ocBox(H.x1 - H.x0 + 0.9, 0.14, 0.14, red, (H.x0 + H.x1) / 2, H.ridge + 0.08, (H.z0 + H.z1) / 2, g);
  for (const z of [H.z0 - 0.02, H.z1 + 0.02]) ocBox(H.x1 - H.x0 + 0.04, 0.2, 0.06, trim, (H.x0 + H.x1) / 2, H.eave - 0.1, z, g);
  for (const x of [H.x0, H.x1]) for (const z of [H.z0, H.z1]) ocBox(0.14, H.eave - y0, 0.14, trim, x + (x < -20 ? 0.04 : -0.04), (H.eave + y0) / 2, z + (z < 4 ? 0.04 : -0.04), g);
  ocBoxU(0.9, 3.4, 0.7, new THREE.MeshStandardMaterial({ map: X.redBrick, roughness: 0.9 }), -19.2, H.ridge + 0.5, (H.z0 + H.z1) / 2, g, 0.6);
  // the foundation (granite blocks), the front step, the door, its hood
  ocBoxU(H.x1 - H.x0 + 0.1, 0.45, H.z1 - H.z0 + 0.1, ocStd('#7f7c76', 0.9), (H.x0 + H.x1) / 2, H.floor - 0.27, (H.z0 + H.z1) / 2, g, 1);
  ocBox(0.7, 0.2, 1.5, ocStd('#8a8780', 0.9), H.x1 + 0.35, H.floor - 0.12, dz, g);
  const door = ocBox(0.05, H.door.h, dw - 0.02, red, H.x1 - 0.03, H.floor + H.door.sill + H.door.h / 2, dz, g);
  ocBox(0.08, 0.08, dw + 0.2, trim, H.x1 + 0.02, H.floor + H.door.sill + H.door.h + 0.04, dz, g);
  for (const sd of [-1, 1]) ocBox(0.08, H.door.h, 0.08, trim, H.x1 + 0.02, H.floor + H.door.sill + H.door.h / 2, dz + sd * (dw / 2 + 0.04), g);
  const hood = ocBox(0.9, 0.06, 1.6, red, H.x1 + 0.42, H.floor + H.door.sill + H.door.h + 0.4, dz, g); hood.rotation.z = -0.3;
  // ---- inside: the floor, the ceiling (the upstairs floor), the kitchen
  ocBoxU(H.x1 - H.x0 - 2 * tW, 0.1, H.z1 - H.z0 - 2 * tW, new THREE.MeshStandardMaterial({ map: X.boards, roughness: 0.75 }), (H.x0 + H.x1) / 2, H.floor - 0.05, (H.z0 + H.z1) / 2, g, 1.4);
  ocBox(H.x1 - H.x0 - 2 * tW, 0.12, H.z1 - H.z0 - 2 * tW, ocStd('#ece8de', 0.9), (H.x0 + H.x1) / 2, H.ceil + 0.06, (H.z0 + H.z1) / 2, g);
  const wood = ocStd('#8d6a48', 0.7), cab = ocStd('#dfe3dc', 0.6), counter = ocStd('#5a5a56', 0.5);
  // counters along the north wall (east half), the sink under the window; the range (west); the table and chairs
  ocBox(4.0, 0.9, 0.62, cab, -17.2, H.floor + 0.45, H.z0 + tW + 0.31, g); ocBox(4.04, 0.04, 0.66, counter, -17.2, H.floor + 0.92, H.z0 + tW + 0.33, g);
  ocBox(0.6, 0.02, 0.44, ocStd('#b8bec2', 0.2, 0.9), -17, H.floor + 0.945, H.z0 + tW + 0.33, g);
  ocBox(0.95, 0.92, 0.7, ocStd('#1d1f21', 0.45, 0.6), -24.2, H.floor + 0.46, 5.6, g); ocCyl(0.08, 0.08, 1.8, ocStd('#1d1f21', 0.45, 0.6), -24.45, H.floor + 1.8, 5.6, g, 10);
  const table = new THREE.Group(); g.add(table); table.position.set(-19.6, H.floor, 4.3);
  ocBox(1.5, 0.05, 0.9, wood, 0, 0.76, 0, table); for (const [a, b] of [[-0.68, -0.38], [0.68, -0.38], [-0.68, 0.38], [0.68, 0.38]]) ocBox(0.05, 0.74, 0.05, wood, a, 0.37, b, table);
  const chairs = [[-19.6, 3.55, 0], [-19.6, 5.05, Math.PI], [-18.6, 4.3, -Math.PI / 2]].map(([x, z, ry], i) => { const c = new THREE.Group(); g.add(c); c.position.set(x, H.floor, z); c.rotation.y = ry;
    ocBox(0.42, 0.04, 0.42, wood, 0, 0.45, 0, c); for (const [a, b] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) ocBox(0.035, 0.45, 0.035, wood, a, 0.225, b, c);
    ocBox(0.42, 0.5, 0.035, wood, 0, 0.72, -0.19, c); return { g: c, x, z, ry, i }; });
  // the coastguard radio on the shelf by the north window (west), its handset; a mug, a chart on the wall
  ocBox(0.9, 0.04, 0.4, wood, -23, H.floor + 1.0, H.z0 + tW + 0.2, g);
  const radio = ocBox(0.34, 0.11, 0.26, ocStd('#202326', 0.5, 0.3), -23.1, H.floor + 1.075, H.z0 + tW + 0.2, g);
  const lcd = ocCanvasTex(128, 48, (c, w, h, st) => { c.fillStyle = st.on ? '#ff7a2a' : '#1a0a04'; c.fillRect(0, 0, w, h); c.fillStyle = st.on ? '#2a0e04' : '#1a0a04'; c.font = 'bold 34px Arial'; c.textAlign = 'center'; c.fillText(st.on ? '16' : '', w / 2, 36); });
  const lcdM = ocMesh(new THREE.PlaneGeometry(0.11, 0.04), new THREE.MeshBasicMaterial({ map: lcd.tex }), -23.15, H.floor + 1.08, H.z0 + tW + 0.2 + 0.131, g); lcdM.castShadow = false;
  ocBox(0.06, 0.1, 0.04, ocStd('#151719', 0.5, 0.3), -22.85, H.floor + 1.08, H.z0 + tW + 0.33, g);
  { const rz = H.z0 + tW + 0.2 + 0.131, knobM = ocStd('#3a3d42', 0.45, 0.5), gr = ocStd('#0c0d0e', 0.8);
    for (const [x, r] of [[-23.0, 0.018], [-22.96, 0.014]]) { const k = ocCyl(r, r, 0.02, knobM, x, H.floor + 1.075, rz + 0.008, g, 12); k.rotation.x = Math.PI / 2; }
    ocBox(0.08, 0.07, 0.006, gr, -23.22, H.floor + 1.075, rz + 0.001, g);
    // the handset on its hook (left of the set), its coiled cord
    const hs = ocBox(0.055, 0.15, 0.035, ocStd('#1a1c1f', 0.5, 0.3), -23.36, H.floor + 1.12, H.z0 + tW + 0.12, g); hs.rotation.z = 0.15;
    const cord = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([...Array(40)].map((_, i) => { const u = i / 39; return new THREE.Vector3(-23.33 + 0.05 * Math.cos(u * 40) + 0.12 * u, H.floor + 1.04 - 0.06 * Math.sin(u * Math.PI), H.z0 + tW + 0.14 + 0.025 * Math.sin(u * 40) + 0.04 * u); })), 120, 0.005, 5), ocStd('#15161a', 0.6));
    g.add(cord); }
  const chart = ocMesh(new THREE.PlaneGeometry(1.1, 0.8), new THREE.MeshStandardMaterial({ map: ocTex(ocCanvas(256, 192, (c, w, h) => { c.fillStyle = '#e9e2c8'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(40,70,110,0.5)'; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(0, 20 + i * 20 + Math.sin(i) * 8); c.bezierCurveTo(80, 10 + i * 22, 160, 30 + i * 18, w, 14 + i * 20); c.stroke(); } c.fillStyle = '#d9c99a'; c.beginPath(); c.moveTo(0, 0); c.lineTo(120, 0); c.bezierCurveTo(90, 50, 60, 70, 0, 110); c.fill(); c.fillStyle = '#c4232b'; c.beginPath(); c.arc(190, 130, 4, 0, 6.3); c.fill(); }), { repeat: false }), roughness: 0.8 }), H.x0 + tW + 0.005, H.floor + 1.7, 4.2, g);
  chart.rotation.y = Math.PI / 2;
  // the ceiling lamp; the light it gives
  const bulbM = new THREE.MeshStandardMaterial({ color: '#fff1d6', emissive: new THREE.Color('#ffd9a0'), emissiveIntensity: 2.4 });
  ocMesh(new THREE.SphereGeometry(0.11, 12, 10), bulbM, -19.6, H.ceil - 0.45, 4.3, g).castShadow = false; ocCyl(0.008, 0.008, 0.35, ocStd('#222', 0.5), -19.6, H.ceil - 0.18, 4.3, g, 4);
  const lamp = new THREE.PointLight('#ffd6a0', 0, 14, 1.5); lamp.position.set(-19.6, H.ceil - 0.6, 4.3); lamp.castShadow = false; g.add(lamp);
  // ---- the water that comes in: a sheet spreading in from the door, then standing over the floor
  const wM = ocInWater('#0c2826'); wM.opacity = 0.93; wM.normalScale.set(0.12, 0.12); wM.normalMap.repeat.set(5, 5); wM.roughness = 0.1;   // (still water in a room: a fine shiver)
  const spreadU = { uC: { value: new THREE.Vector2(H.x1 - tW, dz) }, uR: { value: 0 } };
  wM.onBeforeCompile = (sh) => { sh.uniforms.uC = spreadU.uC; sh.uniforms.uR = spreadU.uR;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vXZ;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvXZ = (modelMatrix * vec4(transformed, 1.0)).xz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec2 uC; uniform float uR; varying vec2 vXZ;').replace('#include <color_fragment>', '#include <color_fragment>\nfloat dd = length(vXZ - uC) + 0.25 * sin(vXZ.y * 7.0) * sin(vXZ.x * 5.0); if (dd > uR) discard; diffuseColor.a *= smoothstep(uR, uR - 0.3, dd);')
      .replace('#include <lights_fragment_maps>', '#include <lights_fragment_maps>\nradiance *= 0.12; iblIrradiance *= 0.3;'); };   // (indoors: not the evening sky's reflection)
  wM.customProgramCacheKey = () => 'ocHouseWater';
  const water = ocMesh(new THREE.PlaneGeometry(H.x1 - H.x0 - 2 * tW - 0.01, H.z1 - H.z0 - 2 * tW - 0.01).rotateX(-Math.PI / 2), wM, (H.x0 + H.x1) / 2, H.floor, (H.z0 + H.z1) / 2, g); water.castShadow = false;
  return {
    g, lamp, water, chairs, table, glassLit, radio, lcd, door,
    set(s, t) {
      const P = OCP, E = OCE, wy = P.houseWater(s), d = P.h(s) - (H.floor + H.door.sill);
      // the light: on until the water reaches the sockets (0.3 m in), a flicker, then out
      const k = wy - H.floor, on = k < 0.3 ? 1 : k < 0.36 ? (Math.sin(s * 47) > 0 ? 1 : 0.2) : 0, dark = 1 - ocSkyK(ocSunAt(s).alt);
      lamp.intensity = 9 * on; bulbM.emissiveIntensity = 2.4 * on; glassLit.emissiveIntensity = 0.75 * on * (0.25 + 0.75 * dark);
      lcd.update({ on: on > 0.5 });
      // the water: a sheet spreading from the door for the first half-minute, then the whole floor
      water.visible = d > 0 && P.h(s) < H.ridge; water.position.y = MathX.clamp(wy, H.floor + 0.012, H.ceil - 0.02); spreadU.uR.value = d > 0 ? 0.3 + Math.max(0, s - E.houseIn) * 0.32 : 0; wM.userData.tick(t);
      // the chairs float up once the water is deep enough (a wooden chair floats), drifting, tipping
      for (const c of chairs) { const fl = Math.max(0, wy - H.floor - 0.32); c.g.position.y = H.floor + fl; c.g.position.x = c.x + 0.25 * Math.sin(t * 0.21 + c.i) * MathX.smooth(fl, 0, 0.4); c.g.rotation.set(0.25 * MathX.smooth(fl, 0, 0.5) * Math.sin(t * 0.4 + c.i * 2), c.ry + 0.3 * Math.sin(t * 0.13 + c.i) * MathX.smooth(fl, 0, 0.5), 0.15 * MathX.smooth(fl, 0, 0.5) * Math.cos(t * 0.33 + c.i)); }
      table.position.y = H.floor + Math.max(0, wy - H.floor - 0.62) * 0.95;
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE FOG SIGNAL HOUSE (red brick, 1907) and its horn; THE OIL HOUSE
// ---------------------------------------------------------------------------------------------------------------------
function ocFogHouse(scene) {
  const F = OC_F.fog, X = ocTexes(), g = new THREE.Group(); scene.add(g);
  const brick = new THREE.MeshStandardMaterial({ map: X.redBrick, roughness: 0.9 }), trim = ocStd('#f2f1ec', 0.6), roofM = new THREE.MeshStandardMaterial({ map: X.shingle, roughness: 0.85 });
  const x0 = F.x - F.w / 2, x1 = F.x + F.w / 2, z0 = F.z - F.d / 2, z1 = F.z + F.d / 2, y0 = F.floor - 0.25, e = F.eave, t = 0.3;
  for (const [cells, axis, c] of [[ocWallCells(x0, x1, y0, e, [[x0 + 1.2, x0 + 2.0, F.floor + 1.0, F.floor + 2.1], [x1 - 2.0, x1 - 1.2, F.floor + 1.0, F.floor + 2.1]]), 'x', z0 + t / 2], [ocWallCells(x0, x1, y0, e, [[x0 + 1.2, x0 + 2.0, F.floor + 1.0, F.floor + 2.1], [x1 - 2.0, x1 - 1.2, F.floor + 1.0, F.floor + 2.1]]), 'x', z1 - t / 2],
    [ocWallCells(z0 + t, z1 - t, y0, e, [[F.z - 0.55, F.z + 0.55, F.floor, F.floor + 2.2]]), 'z', x0 + t / 2], [ocWallCells(z0 + t, z1 - t, y0, e, []), 'z', x1 - t / 2]])
    for (const [u0, u1, v0, v1] of cells) { if (axis === 'x') ocBoxU(u1 - u0, v1 - v0, t, brick, (u0 + u1) / 2, (v0 + v1) / 2, c, g, 0.7); else ocBoxU(t, v1 - v0, u1 - u0, brick, c, (v0 + v1) / 2, (u0 + u1) / 2, g, 0.7); }
  for (const [x, z] of [[x0 + 1.6, z0], [x1 - 1.6, z0], [x0 + 1.6, z1], [x1 - 1.6, z1]]) { const p = ocBox(0.8, 1.1, 0.02, ocStd('#151a1e', 0.06, 0.6), x, F.floor + 1.55, z + (z < F.z ? 0.06 : -0.06), g); p.castShadow = false; }
  const door = ocBox(0.06, 2.2, 1.1, ocStd('#2c4a36', 0.6), x0 + 0.08, F.floor + 1.1, F.z, g);
  // the gable roof (ridge along x)
  const half = F.d / 2, rise = 1.6, slope = Math.atan2(rise, half), sl = Math.hypot(half, rise) + 0.35;
  for (const sd of [-1, 1]) { const r = ocBoxU(F.w + 0.5, 0.1, sl, roofM, F.x, e + rise - Math.sin(slope) * sl / 2 + 0.06, F.z + sd * Math.cos(slope) * sl / 2, g, 1.2); r.rotation.x = sd * slope; }
  for (const x of [x0 + t / 2, x1 - t / 2]) { const sh = new THREE.Shape(); sh.moveTo(z0, 0); sh.lineTo(z1, 0); sh.lineTo(F.z, rise); sh.closePath(); const geo = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false }); geo.translate(0, 0, -t / 2); geo.rotateY(-Math.PI / 2); ocMesh(geo, brick, x, e, 0, g); }
  ocBox(F.w + 0.06, 0.18, 0.06, trim, F.x, e - 0.09, z0 - 0.03, g); ocBox(F.w + 0.06, 0.18, 0.06, trim, F.x, e - 0.09, z1 + 0.03, g);
  // the horn: a black trumpet out of the east wall, facing the open sea
  const horn = new THREE.Group(); g.add(horn); horn.position.set(x1, F.floor + 2.0, F.z);
  const hg = new THREE.CylinderGeometry(0.55, 0.12, 1.7, 24, 1, true); hg.rotateZ(-Math.PI / 2); hg.translate(0.95, 0, 0);
  const hornM = ocStd('#1a1b1c', 0.4, 0.7); hornM.side = THREE.DoubleSide; ocMesh(hg, hornM, 0, 0, 0, horn);
  ocCyl(0.13, 0.13, 0.3, hornM, 0.05, 0, 0, horn, 12).rotation.z = Math.PI / 2;
  const mouth = ocMesh(new THREE.CircleGeometry(0.5, 24), new THREE.MeshBasicMaterial({ color: '#050505' }), 1.75, 0, 0, horn); mouth.rotation.y = Math.PI / 2;
  // inside (seen through the door): the compressor, the air tanks
  ocBox(1.2, 0.9, 0.8, ocStd('#3a4a52', 0.5, 0.5), F.x + 0.5, F.floor + 0.45, F.z, g); ocCyl(0.35, 0.35, 1.6, ocStd('#5a2a22', 0.5, 0.5), F.x - 1.2, F.floor + 0.8, F.z - 1.2, g);
  const wM = ocInWater('#1e3a34'); wM.opacity = 0.85;
  const water = ocMesh(new THREE.PlaneGeometry(F.w - 2 * t - 0.01, F.d - 2 * t - 0.01).rotateX(-Math.PI / 2), wM, F.x, F.floor, F.z, g); water.castShadow = false;
  ocBox(F.w - 2 * t, 0.1, F.d - 2 * t, ocStd('#6d6a64', 0.9), F.x, F.floor - 0.05, F.z, g);
  return { g, horn, door, water, set(s, t) { const h = OCP.h(s); water.visible = h > F.floor && h < F.eave + 2.5; water.position.y = MathX.clamp(h - 0.15, F.floor + 0.004, F.eave - 0.1); wM.userData.tick(t); } };
}
function ocOilHouse(scene, hAt) {
  const X = ocTexes(), g = new THREE.Group(); scene.add(g); const x = 8.5, z = 10.5, y = hAt(x, z) - 0.2;
  ocBoxU(2.4, 2.6, 2.4, new THREE.MeshStandardMaterial({ map: X.redBrick, roughness: 0.9 }), x, y + 1.3, z, g, 0.7);
  ocBox(0.06, 1.8, 0.9, ocStd('#2c4a36', 0.6), x - 1.22, y + 0.95, z, g);
  const r = ocMesh(new THREE.ConeGeometry(2.0, 1.1, 4, 1), new THREE.MeshStandardMaterial({ map: X.shingle, roughness: 0.85 }), x, y + 3.15, z, g); r.rotation.y = Math.PI / 4;
  return g;
}

// ---------------------------------------------------------------------------------------------------------------------
// A JET OF WATER: a tube along +x from its mouth (a w × h rectangle-ish section), spreading and falling (a throw under
// gravity), its surface streaked white and green and running fast along it. o: { segs }. set({ x, y, z, len, w, h,
// spread, drop, a (opacity), light (0…1), t, speed })
// ---------------------------------------------------------------------------------------------------------------------
function ocJet(parent, o = {}) {
  const NU = o.segs || 40, NV = 20, pos = [], uv = [], idx = [];
  for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++) { pos.push(0, 0, 0); uv.push(i / NU, j / NV); }
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + NV + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
  const U = { uLen: { value: 1 }, uW: { value: 1 }, uH: { value: 1 }, uSpread: { value: 0.4 }, uDrop: { value: 0.5 }, uT: { value: 0 }, uA: { value: 1 }, uLight: { value: 1 }, uSpeed: { value: 8 }, uFlat: { value: 0 } };
  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      uniform float uLen, uW, uH, uSpread, uDrop, uT, uSpeed, uFlat; varying vec2 vUv; varying float vN; varying float vF;
      float h1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h1(i), h1(i + vec2(1, 0)), f.x), mix(h1(i + vec2(0, 1)), h1(i + vec2(1, 1)), f.x), f.y); }
      void main(){
        vUv = uv; float u = uv.x, a = uv.y * 6.2832;
        float sx = 1.0 + uSpread * u * 2.2, w = 0.5 * uW * sx, hh = 0.5 * uH * (1.0 + uSpread * u * 1.4) * (1.0 - uFlat * 0.85);
        float wob = (n2(vec2(u * 6.0 - uT * uSpeed * 0.7, uv.y * 5.0)) - 0.5) * 0.35 * u * (w + hh);
        vec3 P = vec3(u * uLen, -uDrop * u * u + sin(a) * (hh + wob), cos(a) * (w + wob));
        vN = n2(vec2(u * 9.0 - uT * uSpeed, uv.y * 14.0));
        vec4 mv = modelViewMatrix * vec4(P, 1.0); vec3 nrm = normalize(normalMatrix * vec3(0.0, sin(a), cos(a)));
        vF = abs(dot(nrm, normalize(-mv.xyz)));   // (1 facing you, 0 at its edges: the edges thin out like water, not a plank)
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform float uT, uA, uLight, uSpeed; varying vec2 vUv; varying float vN; varying float vF;
      float h1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h1(i), h1(i + vec2(1, 0)), f.x), mix(h1(i + vec2(0, 1)), h1(i + vec2(1, 1)), f.x), f.y); }
      void main(){
        float u = vUv.x, s1 = n2(vec2(u * 7.0 - uT * uSpeed * 1.1, vUv.y * 40.0)), s2 = n2(vec2(u * 22.0 - uT * uSpeed * 1.6, vUv.y * 90.0));
        float foam = max(smoothstep(0.35, 0.85, s1 * 0.6 + s2 * 0.4 + u * 0.35), smoothstep(0.5, 0.9, u) * (0.6 + 0.4 * s2));
        vec3 col = mix(vec3(0.12, 0.26, 0.24), vec3(0.86, 0.9, 0.9), foam) * uLight;
        float a = uA * (0.3 + 0.7 * foam) * smoothstep(0.0, 0.04, u) * (1.0 - smoothstep(0.72, 1.0, u + (s2 - 0.5) * 0.25));
        // (it breaks up into ropes and drops as it goes)
        float br = smoothstep(0.1 + 0.55 * u, 0.3 + 0.55 * u, s1 * 0.65 + s2 * 0.35);
        a *= mix(1.0, br, smoothstep(0.15, 0.7, u)) * smoothstep(0.06, 0.5, vF);
        gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = 4; parent.add(mesh);
  return { mesh, U, set(q) {
    mesh.visible = (q.a ?? 1) > 0.01; if (!mesh.visible) return;
    mesh.position.set(q.x, q.y, q.z); mesh.rotation.set(0, q.ry || 0, 0);
    U.uLen.value = q.len; U.uW.value = q.w; U.uH.value = q.h; U.uSpread.value = q.spread ?? 0.4; U.uDrop.value = q.drop ?? 0.5; U.uA.value = Math.min(1, q.a ?? 1);
    U.uLight.value = q.light ?? 1; U.uT.value = q.t; U.uSpeed.value = q.speed ?? 8; U.uFlat.value = q.flat ?? 0;
  } };
}
