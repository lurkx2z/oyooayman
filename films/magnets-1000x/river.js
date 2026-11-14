/* =====================================================================
   RIVER — the world around the boat (layout.js MG_F): the sky of a bright cold November morning, the ground (the yard
   on the north bank, the fields rising to the turbines' hill, the south bank with the towpath and the hospital), the
   river, the wharf's steel wall, the bypass bridge and its traffic, the wind turbines, trees, swans.
     mgBuildRiverWorld(S) → { sky, water, bridge, turbines, swans, update(s, cam) }
   Everything that moves is a pure function of story time s (physics.js).
   ===================================================================== */

// a grey noise texture (multiplied over vertex colours: grit, grass, gravel)
function mgNoiseCanvas(seed, w = 512, h = 512, amp = 0.22, cell = 2) {
  const r = new RNG(seed);
  return mgCanvas(w, h, (g) => {
    const img = g.createImageData(w, h), d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = 0.82 + amp * (hash2(Math.floor(x / cell) + seed, Math.floor(y / cell)) - 0.5) + 0.12 * (noise1(x * 0.02 + y * 0.013, seed) + noise1(y * 0.021 - x * 0.007, seed + 3)) * 0.5 + 0.05 * Math.sin(x * 0.7 + r.next() * 0.01);
      const i = (y * w + x) * 4, c = MathX.clamp(v, 0, 1) * 255; d[i] = c; d[i + 1] = c; d[i + 2] = c; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
}

// the ground's colour at (x, z) (and the height it was built from)
function mgGroundCol(x, z, y) {
  const W = MG_F.wharf, Sb = MG_F.south, n = noise1(x * 0.05 + z * 0.031, 7), n2 = noise1(x * 0.011 - z * 0.017, 9);
  const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  if (y < -0.25) return mix([0.17, 0.15, 0.11], [0.24, 0.21, 0.15], 0.5 + 0.5 * n);                 // the river bed
  if (z <= W.z && z > -95 && x > W.x[0] && x < W.x[1]) {
    // the yard: grey-brown grit, oil stains, rust
    let c = mix([0.36, 0.33, 0.29], [0.44, 0.41, 0.36], 0.5 + 0.5 * n);
    if (noise1(x * 0.18 + 3, z * 0.2 + 1) > 0.55) c = mix(c, [0.16, 0.14, 0.12], 0.6);
    if (noise1(x * 0.09 - 7, z * 0.11) > 0.6) c = mix(c, [0.42, 0.25, 0.14], 0.4);
    return c;
  }
  if (z > Sb.z + 2.4 && z < Sb.z + 5.0) return mix([0.5, 0.46, 0.38], [0.58, 0.53, 0.44], 0.5 + 0.5 * n);   // the towpath
  // hospital grounds: the car park and paths
  if (z > 15 && z < 26 && x > -70 && x < 10) return mix([0.27, 0.27, 0.28], [0.31, 0.31, 0.32], 0.5 + 0.5 * n);
  // grass and fields: late-November green, patchwork by field
  const fx = Math.floor((x + 3000) / 140), fz = Math.floor((z + 3000) / 110), fk = hash2(fx, fz);
  let c = mix([0.27, 0.36, 0.17], [0.36, 0.42, 0.2], 0.5 + 0.5 * n2);
  if (z < -100 || z > 70) c = fk < 0.25 ? mix(c, [0.42, 0.36, 0.22], 0.7) : fk < 0.4 ? mix(c, [0.31, 0.39, 0.16], 0.6) : c;   // ploughed / winter wheat
  return mix(c, [0.21, 0.27, 0.13], 0.25 + 0.25 * n);
}

function mgBuildRiverWorld(S) {
  const scene = S.scene, F = MG_F, W = F.wharf;
  const out = {};
  // ------------------------------------------------------------------ the sky
  out.sky = mgGradSky(scene, '#4a7fbf', '#c8d6e0', '#7a8478', { sunDir: MG_SUN, sunGlow: '#ffe8c0', hw: 0.28, r: 7000 });
  {
    const sd = new THREE.Vector3(...MG_SUN).normalize();
    const disc = new THREE.Mesh(new THREE.CircleGeometry(36, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(9, 8.4, 7.2), fog: false, depthWrite: false }));
    disc.position.copy(sd).multiplyScalar(6500); disc.lookAt(0, 0, 0); disc.renderOrder = -9; scene.add(disc);
    // a few high, thin clouds
    const ct = mgTex(mgCanvas(256, 128, (g, w, h) => { for (let i = 0; i < 40; i++) { const x = w * (0.15 + 0.7 * hash1(i * 3 + 1)), y = h * (0.35 + 0.3 * hash1(i * 5 + 2)), r = 14 + 22 * hash1(i * 7 + 3); const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,0.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); } }), { repeat: false });
    const cm = new THREE.MeshBasicMaterial({ map: ct, transparent: true, depthWrite: false, fog: false, color: new THREE.Color(1.05, 1.03, 1.0) });
    for (let i = 0; i < 9; i++) {
      const az = -1.2 + 2.6 * hash1(i * 11 + 4) + (i % 2) * Math.PI, el = 0.12 + 0.22 * hash1(i * 13 + 5), d = 5200;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1800 + 1400 * hash1(i * 17 + 2), 420 + 300 * hash1(i * 19 + 1)), cm);
      m.position.set(Math.sin(az) * Math.cos(el) * d, Math.sin(el) * d, -Math.cos(az) * Math.cos(el) * d); m.lookAt(0, 0, 0); m.renderOrder = -8; scene.add(m);
    }
  }
  // ------------------------------------------------------------------ the ground: one tensor grid, dense near the river
  {
    const xs = [], zs = [];
    for (let x = -900; x < -140; x += 25) xs.push(x);
    for (let x = -140; x < 240; x += 1.5) xs.push(x);
    for (let x = 240; x <= 1700; x += 25) xs.push(x);
    for (let z = -1500; z < -130; z += 25) zs.push(z);
    for (let z = -130; z < -24; z += 1.5) zs.push(z);
    for (let z = -24; z < 18; z += 0.5) { zs.push(z); if (Math.abs(z - (W.z - 0.5)) < 1e-6) zs.push(W.z - 0.08, W.z - 0.04); }
    for (let z = 18; z < 90; z += 2) zs.push(z);
    for (let z = 90; z <= 700; z += 25) zs.push(z);
    zs.sort((a, b) => a - b);
    const nx = xs.length, nz = zs.length, pos = new Float32Array(nx * nz * 3), col = new Float32Array(nx * nz * 3), uv = new Float32Array(nx * nz * 2);
    const yAt = (x, z) => {
      // under the wharf's wall the yard steps straight down to the river bed (hidden inside the wall)
      if (x > W.x[0] - 1 && x < W.x[1] + 1 && z > W.z - 0.06 && z < W.z + 0.3) return F.river.bed * 0.62;
      if (x > W.x[0] - 1 && x < W.x[1] + 1 && z <= W.z - 0.06) return mgGroundY(x, z);
      // beyond the wharf: a natural bank (the bed rises to the field)
      if (z > W.z - 5 && z < W.z + 2) { const k = MathX.clamp((W.z + 2 - z) / 7, 0, 1), e = k * k * (3 - 2 * k); return MathX.lerp(F.river.bed * 0.62, W.top, e); }
      return mgGroundY(x, z);
    };
    let k = 0;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const x = xs[i], z = zs[j], y = yAt(x, z), c = mgGroundCol(x, z, y);
      pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z; col[k * 3] = c[0]; col[k * 3 + 1] = c[1]; col[k * 3 + 2] = c[2]; uv[k * 2] = x / 7; uv[k * 2 + 1] = z / 7; k++;
    }
    const idx = [];
    for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    const tex = mgTex(mgNoiseCanvas(17, 512, 512, 0.3, 2));
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, map: tex, roughness: 0.95 }));
    m.receiveShadow = true; scene.add(m); out.ground = m;
  }
  // ------------------------------------------------------------------ the river (its surface flows east, 0.4 m/s)
  {
    const nc = mgCanvas(512, 512, (g, w, h) => {
      const img = g.createImageData(w, h), d = img.data, H = (x, y) => 0.5 * Math.sin(x * 0.05 + 1.3 * Math.sin(y * 0.031)) + 0.35 * Math.sin(y * 0.083 + 0.7 * Math.sin(x * 0.047)) + 0.25 * Math.sin((x + y) * 0.13) + 0.15 * (hash2(x >> 3, y >> 3) - 0.5);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const dx = H(x + 1, y) - H(x - 1, y), dy = H(x, y + 1) - H(x, y - 1), i = (y * w + x) * 4;
        d[i] = 128 + 60 * dx; d[i + 1] = 128 + 60 * dy; d[i + 2] = 255; d[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
    });
    const nt = mgTex(nc, { srgb: false }); nt.repeat.set(160, 4);
    const wm = new THREE.MeshStandardMaterial({ color: '#21423d', roughness: 0.26, metalness: 0.0, normalMap: nt, normalScale: new THREE.Vector2(0.8, 0.8), envMapIntensity: 0.16 });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(2600, 40), wm);
    water.rotation.x = -Math.PI / 2; water.position.set(400, 0, (W.z + 12) / 2 - 2); water.receiveShadow = true; scene.add(water);
    out.water = water; out.waterTex = nt;
  }
  // ------------------------------------------------------------------ the wharf's wall: steel sheet piles, a concrete cap
  {
    const sc = mgCanvas(512, 512, (g, w, h) => {
      for (let x = 0; x < w; x++) { const ph = (x / w) * 8 * Math.PI * 2 / 8, v = 0.55 + 0.32 * Math.sin(ph * 1) ** 3 + 0.12 * Math.cos(ph); g.fillStyle = `rgb(${(110 * v) | 0},${(62 * v) | 0},${(36 * v) | 0})`; g.fillRect(x, 0, 1, h); }
      const r = new RNG(5);
      for (let i = 0; i < 260; i++) { const x = r.range(0, w), y = r.range(0, h * 0.6), l = r.range(20, 160); g.fillStyle = `rgba(${r.next() < 0.5 ? '160,80,30' : '50,30,20'},${r.range(0.08, 0.25)})`; g.fillRect(x, y, r.range(1, 4), l); }
      // the tide line: green-black slime below the waterline (the wall is 4.8 m: water at 2.6 m from the bottom)
      const wl = h * (1 - 2.6 / 4.8); const gr = g.createLinearGradient(0, wl - 30, 0, wl + 20); gr.addColorStop(0, 'rgba(30,36,24,0)'); gr.addColorStop(1, 'rgba(26,34,22,0.85)'); g.fillStyle = gr; g.fillRect(0, wl - 30, w, h - wl + 30);
    });
    const st = mgTex(sc); st.repeat.set((W.x[1] - W.x[0]) / 4.8, 1);
    const wallM = new THREE.MeshStandardMaterial({ map: st, roughness: 0.75, metalness: 0.35 });
    const H = W.top - F.river.bed + 0.4, L = W.x[1] - W.x[0];
    const wall = mgBox(L, H, 0.4, wallM, (W.x[0] + W.x[1]) / 2, F.river.bed - 0.4 + H / 2, W.z - 0.17);
    out.wall = wall;
    // the corrugation, as ribs (the steel sheets' folds catch the light)
    const ribG = new THREE.BoxGeometry(0.16, H, 0.12), ribs = new THREE.InstancedMesh(ribG, wallM, Math.floor(L / 0.6));
    const mt = new THREE.Matrix4();
    for (let i = 0; i < ribs.count; i++) { mt.makeTranslation(W.x[0] + 0.3 + i * 0.6, F.river.bed - 0.4 + H / 2, W.z + 0.06); ribs.setMatrixAt(i, mt); }
    ribs.castShadow = ribs.receiveShadow = true; scene.add(ribs);
    // the concrete cap and its bollards; the return walls at the ends
    const cc = mgStd('#8d8a82', 0.9);
    mgBox(L + 0.6, 0.5, 0.95, cc, (W.x[0] + W.x[1]) / 2, W.top + 0.05, W.z - 0.28);
    for (const x of [-60, -30, 0.5, 31, 58]) { mgCyl(0.2, 0.24, 0.55, mgStd('#1c1d1f', 0.5, 0.6), x, W.top + 0.57, W.z - 0.45); mgCyl(0.28, 0.28, 0.08, mgStd('#1c1d1f', 0.5, 0.6), x, W.top + 0.86, W.z - 0.45); }
    for (const x of [W.x[0], W.x[1]]) mgBox(0.4, H, 7, wallM, x, F.river.bed - 0.4 + H / 2, W.z - 3.4);
    // a yellow ladder down the wall
    const lad = mgStd('#c8a020', 0.6, 0.3);
    for (const dx of [-0.25, 0.25]) mgBox(0.06, 4.6, 0.06, lad, -38 + dx, -0.1, W.z + 0.22);
    for (let y = -2.2; y < 2.2; y += 0.3) mgBox(0.5, 0.04, 0.04, lad, -38, y, W.z + 0.22);
  }
  // ------------------------------------------------------------------ the yard's fence (back and sides), the gate
  {
    const fm = mgStd('#3c4a3a', 0.7, 0.4);
    const post = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 2.4, 0.08), fm, 120), mt = new THREE.Matrix4();
    let n = 0;
    for (let x = W.x[0]; x <= W.x[1] && n < 120; x += 3) { mt.makeTranslation(x, W.top + 1.2, -88); post.setMatrixAt(n++, mt); }
    post.count = n; scene.add(post);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(W.x[1] - W.x[0], 2.2), new THREE.MeshStandardMaterial({ color: '#4a5848', transparent: true, opacity: 0.45, roughness: 0.8, side: THREE.DoubleSide, depthWrite: false }));
    mesh.position.set((W.x[0] + W.x[1]) / 2, W.top + 1.25, -88.05); scene.add(mesh);
  }
  // ------------------------------------------------------------------ the south bank: the towpath's fence and lamps, a bench
  {
    const Sb = F.south, fy = Sb.top, fz = Sb.z + 5.6;
    const pm = mgStd('#2e3a30', 0.6, 0.5), n = 220, posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 1.9, 0.06), pm, n), mt = new THREE.Matrix4();
    for (let i = 0; i < n; i++) { const x = -330 + i * 2.5; mt.makeTranslation(x, fy + 0.95, fz); posts.setMatrixAt(i, mt); }
    scene.add(posts);
    for (const y of [0.35, 1.75]) mgBox(550, 0.05, 0.05, pm, -55, fy + y, fz);
    const pal = new THREE.InstancedMesh(new THREE.BoxGeometry(0.035, 1.6, 0.012), pm, 2600);
    for (let i = 0; i < 2600; i++) { mt.makeTranslation(-330 + i * 0.212, fy + 0.95, fz + 0.04); pal.setMatrixAt(i, mt); }
    scene.add(pal);
    const lm = mgStd('#2a2d30', 0.5, 0.6);
    for (let x = -200; x < 140; x += 28) { mgCyl(0.07, 0.09, 5.2, lm, x, fy + 2.6, Sb.z + 2.8); mgBox(0.5, 0.14, 0.22, lm, x, fy + 5.2, Sb.z + 2.6); }
    const bench = mgStd('#6b4a2e', 0.8);
    mgBox(1.8, 0.06, 0.45, bench, -6, fy + 0.45, Sb.z + 4.6); mgBox(1.8, 0.4, 0.05, bench, -6, fy + 0.7, Sb.z + 4.85);
  }
  // ------------------------------------------------------------------ the hospital: the MRI unit nearest the river, the wards
  {
    const H = F.hospital, gy = MG_F.south.top;
    const panel = mgTex(mgCanvas(512, 256, (g, w, h) => {
      g.fillStyle = '#d9dcdc'; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(80,90,95,0.45)'; g.lineWidth = 2; for (let x = 0; x <= w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y <= h; y += 128) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      g.fillStyle = '#1f5c9a'; g.fillRect(0, h * 0.72, w, h * 0.06);
    }));
    panel.repeat.set(4, 1);
    const mri = mgBox(H.mriSize[0], H.mriSize[1], H.mriSize[2], new THREE.MeshStandardMaterial({ map: panel, roughness: 0.6 }), H.mri[0], gy + H.mriSize[1] / 2, H.mri[2]);
    mgBox(H.mriSize[0] + 0.6, 0.35, H.mriSize[2] + 0.6, mgStd('#5a5f62', 0.7), H.mri[0], gy + H.mriSize[1] + 0.12, H.mri[2]);
    mgBox(4, 1.6, 3, mgStd('#9aa0a2', 0.5, 0.4), H.mri[0] + 5, gy + H.mriSize[1] + 1.1, H.mri[2] + 2);
    // its sign (facing the river)
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.3), new THREE.MeshStandardMaterial({ map: mgTex(mgCanvas(640, 130, (g, w, h) => { g.fillStyle = '#1f5c9a'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = '700 64px Arial'; g.fillText('MRI', 26, 86); g.font = '500 34px Arial'; g.fillText('Radiology · Imaging', 190, 80); }), { repeat: false }), roughness: 0.5 }));
    sign.position.set(H.mri[0] - 3, gy + 3.9, H.mri[2] - H.mriSize[2] / 2 - 0.03); sign.rotation.y = Math.PI; scene.add(sign);
    // the wards: four storeys of windows
    const win = mgTex(mgCanvas(512, 512, (g, w, h) => {
      g.fillStyle = '#c9c2b4'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < 4; y++) for (let x = 0; x < 8; x++) { const lit = hash2(x, y) < 0.25; g.fillStyle = lit ? '#c8d0c8' : '#34404a'; g.fillRect(x * 64 + 10, y * 128 + 30, 44, 70); g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(x * 64 + 10, y * 128 + 30, 44, 8); }
    }));
    win.repeat.set(8, 1);
    mgBox(H.wardSize[0], H.wardSize[1], H.wardSize[2], new THREE.MeshStandardMaterial({ map: win, roughness: 0.75 }), H.wards[0], gy + H.wardSize[1] / 2, H.wards[2]);
    mgBox(H.wardSize[0] + 0.8, 0.6, H.wardSize[2] + 0.8, mgStd('#7a7470', 0.8), H.wards[0], gy + H.wardSize[1] + 0.3, H.wards[2]);
    // the link corridor between them
    mgBox(5, 4, 16, new THREE.MeshStandardMaterial({ map: panel, roughness: 0.6 }), H.mri[0] - 6, gy + 2, (H.mri[2] + H.wards[2]) / 2 + 3);
  }
  // ------------------------------------------------------------------ the bypass bridge (a concrete viaduct) and its cars
  {
    const B = F.bridge, deckT = 1.5, L = 520;
    const road = mgTex(mgCanvas(256, 1024, (g, w, h) => {
      g.fillStyle = '#3d3e40'; g.fillRect(0, 0, w, h);
      const r = new RNG(3); for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(${r.next() < 0.5 ? '255,255,255' : '0,0,0'},0.05)`; g.fillRect(r.range(0, w), r.range(0, h), 2, 2); }
      g.fillStyle = '#e8e4d8'; for (let y = 0; y < h; y += 128) g.fillRect(w / 2 - 3, y, 6, 64);
      for (let y = 0; y < h; y += 96) { g.fillRect(w * 0.25 - 2, y, 4, 40); g.fillRect(w * 0.75 - 2, y, 4, 40); }
      g.fillRect(8, 0, 4, h); g.fillRect(w - 12, 0, 4, h);
    }));
    road.repeat.set(1, L / 40);
    const deck = mgBox(B.w, deckT, L, mgStd('#a8a49a', 0.9), B.x, B.y - deckT / 2, 0);
    const surf = new THREE.Mesh(new THREE.PlaneGeometry(B.w - 1.2, L), new THREE.MeshStandardMaterial({ map: road, roughness: 0.85 }));
    surf.rotation.x = -Math.PI / 2; surf.position.set(B.x, B.y + 0.02, 0); surf.receiveShadow = true; scene.add(surf);
    for (const sx of [-1, 1]) { mgBox(0.35, 1.0, L, mgStd('#b4b0a6', 0.85), B.x + sx * (B.w / 2 - 0.18), B.y + 0.5, 0); mgBox(0.12, 0.12, L, mgStd('#6a6e72', 0.5, 0.6), B.x + sx * (B.w / 2 - 0.18), B.y + 1.18, 0); }
    for (const z of [-200, -140, -80, -30, 16, 70, 130, 190]) { const gy = Math.min(mgGroundY(B.x, z), 0) + (z > -24 && z < 12 ? 0 : 0); const ty = mgGroundY(B.x, z), base = z > -22 && z < 10 ? F.river.bed : ty; mgBox(3.0, B.y - deckT - base + 0.5, 2.0, mgStd('#9a968c', 0.9), B.x, (B.y - deckT + base) / 2 - 0.25, z); void gy; }
    for (let z = -240; z < 240; z += 32) for (const sx of [-1, 1]) { mgCyl(0.09, 0.11, 8, mgStd('#8a8e92', 0.5, 0.6), B.x + sx * (B.w / 2 - 0.2), B.y + 4.0, z); mgBox(1.6, 0.12, 0.3, mgStd('#8a8e92', 0.5, 0.6), B.x + sx * (B.w / 2 - 0.9), B.y + 8.0, z); }
    out.deck = deck;
    // its traffic (vehicles.js), driven by MGT_FAR.car
    const vf = new VehicleFactory(), cars = MGT_FAR.cars.map((c) => {
      const v = vf.build(c.type, c.color); scene.add(v.group); v.group.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
      return { c, v };
    });
    out.bridgeCars = cars;
  }
  // ------------------------------------------------------------------ the wind turbines on the hill
  {
    const tw = mgStd('#e8eaea', 0.45), T = [];
    const bladeGeo = (() => {
      const rings = []; for (let i = 0; i <= 14; i++) { const u = i / 14, r = MG_F.blade * u, ch = (u < 0.12 ? 1.2 + 12 * u : 2.6 * (1 - u) + 0.45); rings.push([0, r, 0, ch * 0.5, Math.max(0.12, ch * 0.16)]); }
      const g = mgLoft(rings, 8, 0.2); return g;
    })();
    MG_F.turbines.forEach((p, ti) => {
      const gy = mgGroundY(p[0], p[2]), g = new THREE.Group(); g.position.set(p[0], gy, p[2]); scene.add(g);
      const tower = mgCyl(1.4, 2.3, MG_F.hub, tw, 0, MG_F.hub / 2, 0, g, 20);
      const yaw = MGT_FAR.blades[ti * 3].yawT, nac = new THREE.Group(); nac.position.set(0, MG_F.hub, 0); nac.rotation.y = -yaw; g.add(nac);
      mgBox(4.2, 4.0, 11, tw, 0, 0.3, 2.5, nac);
      const hub = mgMesh(new THREE.SphereGeometry(1.9, 16, 12), tw, 0, 0, -3.4, nac); hub.scale.set(1, 1, 1.5);
      const blades = [0, 1, 2].map((k) => { const m = new THREE.Mesh(bladeGeo, tw); m.castShadow = true; scene.add(m); return m; });
      T.push({ g, tower, nac, hub, blades, gy, ti });
    });
    out.turbines = T;
  }
  // ------------------------------------------------------------------ trees (late November: mostly bare, a few evergreens)
  {
    const r = new RNG(81), spots = [];
    const tryAdd = (x, z, s, kind) => { const y = mgGroundY(x, z); if (y < 0.5) return; spots.push([x, y, z, s, kind]); };
    for (let i = 0; i < 70; i++) { const x = r.range(-260, 130), z = MG_F.south.z + r.range(6.5, 9), sc = r.range(0.8, 1.3), k = r.next() < 0.2 ? 1 : 0; if (x > -50 && x < -2) continue; tryAdd(x, z, sc, k); }   // (none in front of the hospital's MRI unit)
    for (let i = 0; i < 60; i++) tryAdd(r.range(-300, 400), r.range(70, 200), r.range(0.9, 1.5), r.next() < 0.3 ? 1 : 0);
    for (let i = 0; i < 160; i++) { const hx = Math.floor(r.range(-6, 14)) * 140 + r.range(-4, 4) * 0 , z = -110 - r.range(0, 1100); tryAdd(hx + r.range(-3, 3), z, r.range(0.9, 1.6), r.next() < 0.15 ? 1 : 0); }
    for (let i = 0; i < 40; i++) tryAdd(r.range(-90, -76) * (r.next() < 0.5 ? 1 : -0.9), r.range(-80, -24), r.range(0.9, 1.3), 0);
    for (let i = 0; i < 30; i++) tryAdd(r.range(170, 260), r.range(-90, -24), r.range(0.9, 1.4), r.next() < 0.3 ? 1 : 0);
    const trunkG = new THREE.CylinderGeometry(0.18, 0.32, 1, 6); trunkG.translate(0, 0.5, 0);
    const crownG = mgBlobGeo(1, 3), coneG = new THREE.ConeGeometry(1, 2.4, 8); coneG.translate(0, 1.2, 0);
    const trunks = new THREE.InstancedMesh(trunkG, mgStd('#4a3d32', 0.95), spots.length);
    const bare = new THREE.InstancedMesh(crownG, new THREE.MeshStandardMaterial({ color: '#6a5a46', roughness: 1 }), spots.length);
    const ever = new THREE.InstancedMesh(coneG, new THREE.MeshStandardMaterial({ color: '#2c3f2a', roughness: 1 }), spots.length);
    const mt = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3(), cB = new THREE.Color(), up = new THREE.Vector3(0, 1, 0);
    let nb = 0, ne = 0;
    spots.forEach(([x, y, z, s, kind], i) => {
      const h = (kind ? 4 : 6.5) * s;
      q.setFromAxisAngle(up, hash1(i * 5) * 6.28); mt.compose(pv.set(x, y - 0.1, z), q, sv.set(s, h * 0.45, s)); trunks.setMatrixAt(i, mt);
      if (kind) { mt.compose(pv.set(x, y + h * 0.25, z), q, sv.set(2.0 * s, 2.6 * s, 2.0 * s)); ever.setMatrixAt(ne++, mt); }
      else { mt.compose(pv.set(x, y + h * 0.62, z), q, sv.set(3.2 * s, 3.4 * s, 3.2 * s)); bare.setMatrixAt(nb, mt); cB.setRGB(0.36 + 0.1 * hash1(i * 7), 0.3 + 0.07 * hash1(i * 9), 0.22 + 0.05 * hash1(i * 3)); bare.setColorAt(nb++, cB); }
    });
    bare.count = nb; ever.count = ne;
    for (const m of [trunks, bare, ever]) { m.castShadow = true; m.receiveShadow = true; scene.add(m); }
  }
  // ------------------------------------------------------------------ two swans, near the south bank (not magnetic)
  {
    const white = mgStd('#f2f0ea', 0.7), beak = mgStd('#e0702a', 0.5), black = mgStd('#151515', 0.6);
    const mk = () => {
      const g = new THREE.Group();
      const body = mgMesh(new THREE.SphereGeometry(0.42, 18, 12), white, 0, 0.12, 0, g); body.scale.set(1.0, 0.55, 1.75);
      // the neck: an S (forward and up from the breast, back over the body, the head held level and forward)
      const NP = [[0, 0.2, -0.55], [0, 0.42, -0.66], [0, 0.6, -0.6], [0, 0.74, -0.52], [0, 0.84, -0.56]];
      for (let i = 0; i < NP.length - 1; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 10), white); m.geometry.translate(0, 0.5, 0); mgStrut(m, NP[i], NP[i + 1], 0.075 - 0.008 * i); m.castShadow = true; g.add(m); mgMesh(new THREE.SphereGeometry(0.075 - 0.008 * i, 10, 8), white, NP[i + 1][0], NP[i + 1][1], NP[i + 1][2], g); }
      const head = mgMesh(new THREE.SphereGeometry(0.075, 14, 10), white, 0, 0.87, -0.62, g); head.scale.set(0.85, 0.85, 1.35);
      const bk = mgMesh(new THREE.ConeGeometry(0.035, 0.15, 8), beak, 0, 0.855, -0.76, g); bk.rotation.x = -Math.PI / 2 - 0.2;
      mgMesh(new THREE.SphereGeometry(0.026, 8, 6), black, 0, 0.865, -0.7, g);
      const tail = mgMesh(new THREE.ConeGeometry(0.16, 0.3, 8), white, 0, 0.2, 0.72, g); tail.rotation.x = Math.PI / 2 + 0.4;
      scene.add(g); return g;
    };
    out.swans = [mk(), mk()];
  }
  out.update = (s) => {
    // the river's ripples drift east with the current
    out.waterTex.offset.set((s * 0.4 / 2600 * 160) % 1, (s * 0.012) % 1);
    // the bridge's cars
    for (const { c, v } of out.bridgeCars) {
      const q = MGT_FAR.car(c, s);
      v.group.position.set(MG_F.bridge.x + q.x, MG_F.bridge.y + 0.02, q.z); v.group.rotation.y = (c.dir > 0 ? -Math.PI / 2 : Math.PI / 2) + q.yaw;
      if (v.wheels) for (const w of v.wheels) w.rotation.z = c.ev && s > 0.02 ? -(c.v0 * 0.02) / 0.32 : -q.d / 0.32;
    }
    // the turbines: spinning until 10:42:00.03, then their blades fly
    for (const T of out.turbines) {
      T.blades.forEach((m, k) => {
        const bl = MGT_FAR.blades[T.ti * 3 + k], q = MGT_FAR.blade(bl, s, (x, z) => mgGroundY(x, z));
        // the blade's root at its centre of mass minus 15 m along its length; it lies in the rotor plane, angle q.ang
        const ux = Math.cos(bl.yawT), uz = Math.sin(bl.yawT), d = [ux * Math.sin(q.ang), Math.cos(q.ang), uz * Math.sin(q.ang)];
        m.position.set(q.c[0] - d[0] * 15, q.c[1] - d[1] * 15, q.c[2] - d[2] * 15);
        m.up.set(0, 1, 0);
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(d[0], d[1], d[2]));
        if (q.landed) { m.position.set(q.c[0] - d[0] * 15, q.c[1], q.c[2] - d[2] * 15); const flat = new THREE.Vector3(d[0], 0.04, d[2]).normalize(); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), flat); m.position.set(q.c[0] - flat.x * 15, q.c[1] - 0.4, q.c[2] - flat.z * 15); }
      });
    }
    // the swans glide slowly upstream (west) along the south bank
    out.swans.forEach((g, i) => { const x = -14 + 6 * i - 0.18 * s, z = 4.4 + 0.9 * i + 0.2 * Math.sin(s * 0.2 + i); g.position.set(x, -0.02 + 0.01 * Math.sin(s * 1.3 + i), z); g.rotation.y = Math.PI / 2 + 0.15 * Math.sin(s * 0.15 + i * 2); });
  };
  return out;
}
