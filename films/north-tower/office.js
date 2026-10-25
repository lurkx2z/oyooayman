/* =====================================================================
   OFFICE — your floor, the 73rd of the North Tower, the morning of September 11, 2001 (8:40 to 8:50).
   The south side of the floor: column-free from the core to the outer wall (18 m), the outer wall a row of narrow
   windows (22 in of glass, columns 40 in apart), a suspended ceiling of 2 × 4 ft tiles with fluorescent troffers
   (8.7 ft), carpet, cubicles of 2001: beige CRT monitors and towers, desk phones, paper. Outside: the South Tower
   across the plaza, Lower Manhattan 267 m below, the Hudson, New Jersey; low sun from the east-south-east.
   Modes: title · desk · sky · tower · down · impact (8:46: the jolt, the sway) · after (tiles, lights) · outside
   (paper, smoke) · nobody (you go) · core (the corridor to stairway C).
   Nothing outside is shown that the people on this floor could not see: no plane, no impact from outside.
   ===================================================================== */

const NT_Y73 = 73 * NT_FLOOR_H;         // your floor (m above the plaza)
const NT_CEIL = 2.65;
const NT_OFF = { x0: -31.5, x1: 31.5, zCore: 13.3, zWall: 31.55 };   // the south office zone, inside the outer wall

NT_SETS.office = (app) => {
  const Y = NT_Y73, O = NT_OFF, _m0 = new THREE.Matrix4();
  const S = ntSet(app, { sky: '#7fa9d6', fov: 55, near: 0.05, far: 9000, hemi: ['#dfe4e6', '#5d574f', 0.5], sun: [NT_SUN[0] * 300, Y + NT_SUN[1] * 300, NT_SUN[2] * 300 + 22], sunColor: '#fff0da', sunI: 2.6, shadow: 4096, shadowR: 40, shadowFar: 700 });
  const env = ntEnv(app.renderer, '#5f97d8', '#dfe8f0', '#6e6a64');   // (for the towers' metal only: the room has no sky light of its own)
  const scene = S.scene;
  scene.fog = new THREE.FogExp2('#c4d5e6', 0.00016);
  S.sun.target.position.set(0, Y, 22);
  const sky = ntSky(scene, '#1f5fb8', '#c9dcec', '#9db0c0', { sunDir: NT_SUN, sunGlow: '#fff2d8', hw: 0.3 });

  // ---- outside
  ntCity(scene, { r: 1900, skip: ntNearWTC, seed: 73 });
  ntPlaza(scene);
  const south = ntTower(scene, NT_TW.S, { env });
  // your own tower's south face below and above you: the column covers stand out from the glass, so from the
  // window you see them run down to the plaza (and up)
  const finM = ntStd('#b9bdc3', 0.45, 0.3, { envMap: env, envMapIntensity: 0.5 }), finG = new THREE.BoxGeometry(0.36, 1, 0.3);
  const fins = new THREE.InstancedMesh(finG, finM, 2 * 25);
  for (let i = 0; i < 25; i++) for (const [y0, y1, k] of [[22, Y - 0.2, 0], [Y + NT_CEIL + 0.3, 417, 1]]) { const x = -31.0 + (i + 18) * 1.016; _m0.compose(new THREE.Vector3(x, (y0 + y1) / 2, O.zWall + 0.62), new THREE.Quaternion(), new THREE.Vector3(1, y1 - y0, 1)); fins.setMatrixAt(i * 2 + k, _m0); }
  scene.add(fins);
  // (between the covers, floor after floor: the dark glass of a window, then the aluminium spandrel at the slab)
  const bandTex = ntTex(ntCanvas(32, 128, (g, W, H) => { g.fillStyle = '#a7abb1'; g.fillRect(0, 0, W, H); g.fillStyle = '#1d242d'; g.fillRect(0, (1 - 2.55 / NT_FLOOR_H) * H, W, (2.1 / NT_FLOOR_H) * H); }));
  bandTex.repeat.set(1, 67);
  const skinBack = new THREE.Mesh(new THREE.PlaneGeometry(26, 67 * NT_FLOOR_H), ntStd('#ffffff', 0.45, 0.4, { map: bandTex, envMap: env, envMapIntensity: 0.45, side: THREE.DoubleSide }));
  skinBack.position.set(0, (6 + 67 / 2) * NT_FLOOR_H, O.zWall + 0.47); scene.add(skinBack);
  const puffs = ntPuffs(scene, 2600), fire = ntPuffs(scene, 200, { additive: true });

  // ---- the floor, the ceiling, the core wall
  const carpet = ntTex(ntCanvas(512, 512, (g, W, H) => {
    g.fillStyle = '#5a6068'; g.fillRect(0, 0, W, H); const r = new RNG(5);
    for (let i = 0; i < 26000; i++) { const v = r.range(-22, 22); g.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 200})`; g.fillRect(r.range(0, W), r.range(0, H), 2, 2); }
  }));
  carpet.repeat.set(30, 10);
  const floor = ntBox(70, 0.1, 20.4, ntStd('#ffffff', 0.95, 0, { map: carpet }), 0, Y - 0.05, 21.4);   // (core to the wall: nothing sticks out of the building)
  floor.castShadow = false;
  const tileTex = ntTex(ntCanvas(256, 512, (g, W, H) => {
    g.fillStyle = '#e4e1da'; g.fillRect(0, 0, W, H); const r = new RNG(9);
    for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(90,85,80,${r.range(0.02, 0.08)})`; g.fillRect(r.range(0, W), r.range(0, H), 2, 2); }
    g.fillStyle = '#b9b4ab'; g.fillRect(0, 0, W, 5); g.fillRect(0, 0, 5, H);
  }));
  tileTex.repeat.set(70 / 0.61, 22 / 1.22);
  const ceilM = ntStd('#ffffff', 0.9, 0, { map: tileTex, emissive: '#e8e4dc', emissiveMap: tileTex, emissiveIntensity: 0.22 });   // (lit by the troffers)
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(70, 20.4), ceilM); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, Y + NT_CEIL, 21.4); scene.add(ceil); ceil.receiveShadow = true;
  // the troffers: fluorescent panels, 2 × 4 ft, every 8 ft
  const trM = new THREE.MeshStandardMaterial({ color: '#f4f6f4', emissive: '#f2f5ee', emissiveIntensity: 1.0, roughness: 0.4 });
  const trofs = [];
  for (let x = -30; x <= 30; x += 2.44) for (let z = 15.2; z < 31; z += 2.44) trofs.push([x, z]);
  const tro = new THREE.InstancedMesh(new THREE.BoxGeometry(0.58, 0.02, 1.18), trM, trofs.length);
  const _m = new THREE.Matrix4();
  trofs.forEach(([x, z], i) => { _m.makeTranslation(x, Y + NT_CEIL - 0.012, z); tro.setMatrixAt(i, _m); });
  scene.add(tro);
  const coreM = ntStd('#cfc6b6', 0.85);
  ntBox(70, NT_CEIL, 0.2, coreM, 0, Y + NT_CEIL / 2, O.zCore - 0.1).castShadow = false;
  // end walls (east, west)
  for (const sx of [-1, 1]) ntBox(0.4, NT_CEIL, 20, ntStd('#d8d2c6', 0.85), sx * 31.7, Y + NT_CEIL / 2, 22);

  // ---- the outer wall: 59 columns (covers 19 in wide inside), the spandrel and the convector under the sill
  const SILL = 0.45, HEAD = 2.55, colM = ntStd('#d9d6cf', 0.6, 0.1), bay = 1.016;
  const nCol = 62, cols = new THREE.InstancedMesh(new THREE.BoxGeometry(0.46, NT_CEIL, 0.4), colM, nCol);
  for (let i = 0; i < nCol; i++) { _m.makeTranslation(-31.0 + i * bay, Y + NT_CEIL / 2, O.zWall + 0.2); cols.setMatrixAt(i, _m); }
  cols.castShadow = cols.receiveShadow = true; scene.add(cols);
  const below = ntBox(64, SILL, 0.42, ntStd('#cdc8bf', 0.7), 0, Y + SILL / 2, O.zWall + 0.21); below.castShadow = true;
  const conv = ntBox(64, 0.06, 0.5, ntStd('#bdb8ae', 0.5, 0.2), 0, Y + SILL + 0.03, O.zWall - 0.02);
  const head = ntBox(64, NT_CEIL - HEAD + 0.05, 0.42, ntStd('#cdc8bf', 0.7), 0, Y + (HEAD + NT_CEIL) / 2, O.zWall + 0.21); head.castShadow = true;
  // the outside of the wall (the skin, for the shadows and the reflection) and the floor slabs above and below
  ntBox(64, 0.5, 0.6, ntStd('#bfc3c8', 0.4, 0.6), 0, Y + NT_CEIL + 0.25, O.zWall + 0.6);
  // a faint glass in every slit
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(64, HEAD - SILL), new THREE.MeshStandardMaterial({ color: '#cfe0ee', transparent: true, opacity: 0.07, roughness: 0.05, metalness: 0.9, depthWrite: false }));
  glass.position.set(0, Y + (SILL + HEAD) / 2, O.zWall + 0.32); glass.rotation.y = Math.PI; scene.add(glass);

  // ---- the cubicles (merged by material: laminate, fabric panels, beige plastic, dark screens, chairs)
  const A = { desk: [], panel: [], beige: [], dark: [], chair: [], paper: [] };
  const arr = () => ({ pos: [], nor: [], uv: [], idx: [] });
  for (const k in A) A[k] = arr();
  const box = (k, cx, cy, cz, w, h, d) => ntBoxInto(A[k], cx - w / 2, cx + w / 2, Y + cy - h / 2, Y + cy + h / 2, cz - d / 2, cz + d / 2);
  const r = new RNG(1973);
  const station = (cx, cz, face) => {   // face: +1 the desk is on the +z side of the seat, −1 the −z side
    box('desk', cx, 0.725, cz + face * 0.38, 1.6, 0.04, 0.76);
    box('panel', cx, 0.68, cz + face * 0.8, 1.7, 1.36, 0.06);
    box('panel', cx - 0.83, 0.68, cz + face * 0.38, 0.06, 1.36, 0.86);
    box('beige', cx + 0.1 * r.range(-1, 1), 0.95, cz + face * 0.52, 0.4, 0.38, 0.4);   // the CRT
    box('dark', cx, 0.97, cz + face * 0.315, 0.32, 0.25, 0.02);
    box('beige', cx + 0.62, 0.95, cz + face * 0.45, 0.19, 0.42, 0.44);                // the tower
    box('beige', cx - 0.05, 0.755, cz + face * 0.15, 0.46, 0.025, 0.16);              // keyboard
    box('beige', cx - 0.55, 0.77, cz + face * 0.3, 0.2, 0.06, 0.22);                  // phone
    if (r.next() < 0.8) box('paper', cx - 0.5 + r.range(-0.1, 0.1), 0.75, cz + face * 0.55, 0.23, 0.02 + r.next() * 0.06, 0.3);
    box('chair', cx, 0.47, cz - face * 0.12, 0.5, 0.08, 0.5); box('chair', cx, 0.78, cz - face * 0.37, 0.46, 0.55, 0.07); box('chair', cx, 0.24, cz - face * 0.12, 0.06, 0.45, 0.06);
  };
  // rows of stations back to back, aisles between; one row along the windows (yours is at x = −3)
  for (let x = -27; x <= 27; x += 1.75) { if (Math.abs(x + 3) < 0.6) continue; station(x, 29.6, 1); }
  for (const zr of [24.6, 20.0]) for (let x = -27; x <= 27; x += 1.75) { if (Math.abs(x) < 1.2) continue; station(x, zr - 0.9, 1); station(x, zr + 0.9, -1); }
  // file cabinets and a printer along the core
  for (let x = -28; x < 28; x += 3.1) box('beige', x, 0.66, O.zCore + 0.45, 0.9, 1.32, 0.62);
  const mats = { desk: ntStd('#b9a98c', 0.55), panel: ntStd('#6f7b88', 0.95), beige: ntStd('#d8d0bd', 0.6), dark: ntStd('#1a2026', 0.3, 0.1), chair: ntStd('#24262a', 0.7), paper: ntStd('#f2f0ea', 0.9) };
  for (const k in A) { const m = new THREE.Mesh(ntGeoFrom(A[k]), mats[k]); m.castShadow = m.receiveShadow = true; scene.add(m); }

  // ---- your desk (x = −3, against the windows): the monitor's screen, a mug, the desk calendar, a photo
  const MY = { x: -3, z: 29.6 };
  const deskTop = Y + 0.745;
  ntBox(1.6, 0.04, 0.76, mats.desk, MY.x, Y + 0.725, MY.z + 0.38);
  ntBox(0.42, 0.4, 0.42, mats.beige, MY.x + 0.05, Y + 0.97, MY.z + 0.55);
  const screen = ntCanvasTex(512, 384, (g, W, H, st) => {
    const on = st.on;
    g.fillStyle = on ? '#2a6aa6' : '#0a0c0e'; g.fillRect(0, 0, W, H);
    if (!on) return;
    g.fillStyle = '#c8c4bc'; g.fillRect(30, 26, W - 60, H - 70);
    g.fillStyle = '#0a246a'; g.fillRect(30, 26, W - 60, 22); g.fillStyle = '#fff'; g.font = 'bold 15px sans-serif'; g.fillText('Q3 forecast.xls', 40, 42);
    g.fillStyle = '#ffffff'; g.fillRect(36, 56, W - 72, H - 108);
    g.strokeStyle = '#c0c0c0'; for (let y = 56; y < H - 52; y += 16) { g.beginPath(); g.moveTo(36, y); g.lineTo(W - 36, y); g.stroke(); }
    for (let x = 36; x < W - 36; x += 64) { g.beginPath(); g.moveTo(x, 56); g.lineTo(x, H - 52); g.stroke(); }
    g.fillStyle = '#222'; g.font = '11px sans-serif'; const rr = new RNG(3);
    for (let y = 68; y < H - 56; y += 16) for (let x = 40; x < W - 90; x += 64) g.fillText(String(rr.int(100, 9999)), x + 6, y);
    g.fillStyle = '#c8c4bc'; g.fillRect(0, H - 24, W, 24); g.fillStyle = '#2a6a2a'; g.fillRect(2, H - 22, 50, 20); g.fillStyle = '#fff'; g.fillText('Start', 10, H - 8);
    g.fillStyle = '#000'; g.fillText('8:4' + st.m + ' AM', W - 62, H - 8);
    if (st.glitch) { g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(0, (st.glitch * 37) % H, W, 30); }
  });
  const scrM = new THREE.MeshStandardMaterial({ color: '#000', emissive: '#ffffff', emissiveMap: screen.tex, emissiveIntensity: 0.9, roughness: 0.2 });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.24), scrM); scr.position.set(MY.x + 0.05, Y + 0.985, MY.z + 0.336); scr.rotation.y = Math.PI; scene.add(scr);
  ntBox(0.46, 0.025, 0.16, mats.beige, MY.x, Y + 0.757, MY.z + 0.16);
  // the mug (and its coffee, which ripples in the jolt)
  const mug = new THREE.Group(); mug.position.set(MY.x - 0.42, deskTop, MY.z + 0.18); scene.add(mug);
  ntCyl(0.042, 0.04, 0.1, ntStd('#ece8e0', 0.35), 0, 0.05, 0, mug);
  const coffee = ntCyl(0.036, 0.036, 0.004, ntStd('#3a2414', 0.15, 0.1), 0, 0.088, 0, mug);
  // the desk calendar: TUESDAY 11 SEPTEMBER 2001
  const cal = ntTex(ntCanvas(256, 256, (g, W, H) => {
    g.fillStyle = '#f6f3ec'; g.fillRect(0, 0, W, H); g.fillStyle = '#9a2a24'; g.fillRect(0, 0, W, 62);
    g.fillStyle = '#fff'; g.font = 'bold 30px serif'; g.textAlign = 'center'; g.fillText('SEPTEMBER', W / 2, 42);
    g.fillStyle = '#222'; g.font = 'bold 120px serif'; g.fillText('11', W / 2, 180); g.font = '26px serif'; g.fillText('TUESDAY · 2001', W / 2, 225);
  }), { repeat: false });
  const calM = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.13), ntStd('#ffffff', 0.8, 0, { map: cal }));
  calM.position.set(MY.x + 0.45, deskTop + 0.065, MY.z + 0.22); calM.rotation.set(-0.25, Math.PI + 0.35, 0); scene.add(calM);
  // a framed photo (a beach, two figures far off)
  const ph = ntTex(ntCanvas(128, 96, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#8ec0e8'); gr.addColorStop(0.55, '#d8e6ee'); gr.addColorStop(0.56, '#3a7aa0'); gr.addColorStop(0.75, '#e6d6b0'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.fillStyle = '#3a3030'; g.fillRect(52, 54, 5, 16); g.fillRect(62, 52, 5, 18); }), { repeat: false });
  const frame = ntBox(0.15, 0.12, 0.012, ntStd('#3a2a20', 0.5), MY.x + 0.62, deskTop + 0.06, MY.z + 0.5);
  frame.rotation.y = 0.3;
  const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.128, 0.096), ntStd('#ffffff', 0.6, 0, { map: ph })); pm.position.set(0, 0, -0.007); pm.rotation.y = Math.PI; frame.add(pm);
  // your bag on the floor, and your jacket on the chair
  const bag = ntBox(0.38, 0.28, 0.14, ntStd('#3b2a20', 0.7), MY.x + 0.55, Y + 0.14, MY.z - 0.1);

  // ---- the ceiling tiles that fall, and the ones left hanging
  const tileM = ntStd('#e2ded6', 0.9, 0, { map: tileTex.clone() });
  tileM.map.repeat.set(1, 1);
  const tiles = [[-1.8, 28.2, 0.15, 0.6], [0.6, 26.4, 0.55, 1.4], [-4.9, 25.8, 0.9, 0.3], [2.4, 29.1, 1.25, 2.2], [-6.5, 27.6, 1.6, 1.1], [3.2, 27.6, 2.3, 1.7], [0.2, 24.4, NT.after + 1.1 - NT.hit, 0.9]].map(([x, z, delay, spin]) => {
    const m = ntBox(0.6, 0.016, 1.2, tileM, x, Y + NT_CEIL - 0.01, z); m.castShadow = true; return { m, x, z, delay, spin };
  });
  const holes = tiles.map((T) => { const h = ntBox(0.6, 0.01, 1.2, ntStd('#1a1816', 1), T.x, Y + NT_CEIL + 0.002, T.z); h.visible = false; return h; });
  const hang = [[3.9, 25.2], [-8.1, 29.0], [6.6, 21.6]].map(([x, z]) => { const g = new THREE.Group(); g.position.set(x - 0.3, Y + NT_CEIL - 0.01, z); scene.add(g); ntBox(0.6, 0.016, 1.2, tileM, 0.3, 0, 0, g); return g; });

  // ---- the people on your floor
  const crew = [
    { look: 'ntShirtW', x: -4.75, z: 29.6, act: 'ntType', f: Math.PI }, { look: 'ntBlouse', x: -6.5, z: 25.5, act: 'ntType', f: 0 },
    { look: 'ntSuit', x: 1.0, z: 23.0, act: 'idle', f: Math.PI * 0.6 }, { look: 'ntBlouse2', x: 0.0, z: 25.5, act: 'ntType', f: 0 },
    { look: 'ntShirtB', x: -1.25, z: 29.6, act: 'ntType', f: Math.PI }, { look: 'ntCardigan', x: 5.0, z: 19.1, act: 'ntType', f: Math.PI },
    { look: 'ntPolo', x: -9.0, z: 22.4, act: 'idle', f: -1.2 }, { look: 'ntBlazer', x: 3.2, z: 27.4, act: 'idle', f: 2.6 },
  ].map((c, i) => Object.assign(c, { p: ntPerson(scene, 'off' + i, c.look) }));

  // ---- falling paper outside (burning ones glow at the edges), pure time
  const NPAP = 1500, papG = new THREE.PlaneGeometry(0.22, 0.28);
  const papM = new THREE.MeshStandardMaterial({ color: '#f4f2ec', roughness: 0.9, side: THREE.DoubleSide, emissive: '#ffffff', emissiveIntensity: 0.4 });
  const burnM = new THREE.MeshStandardMaterial({ color: '#d8c8b0', roughness: 0.9, side: THREE.DoubleSide, emissive: '#ff6a1a', emissiveIntensity: 0.55 });
  const paper = new THREE.InstancedMesh(papG, papM, NPAP), burn = new THREE.InstancedMesh(papG, burnM, 10);
  paper.frustumCulled = burn.frustumCulled = false; scene.add(paper); scene.add(burn);
  const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(1, 1, 1), _p = new THREE.Vector3();
  function paperAt(t) {
    let nB = 0;
    for (let i = 0; i < NPAP + 10; i++) {
      const isB = i >= NPAP, k = isB ? i - NPAP : i, h = hash1(i * 17 + 3), h2 = hash1(i * 29 + 5), h3 = hash1(i * 43 + 7);
      const t0 = NT.hit + 3 + h * 26, a = t - t0;
      const vis = a > 0 && t < NT.known;
      if (vis) {
        const fall = 1.1 + h2 * 0.9;
        _p.set(-22 + h3 * 44 + Math.sin(a * 0.7 + i) * 2 + NT_WIND[0] * 0.2 * a, Y + 6 + 34 * hash1(i * 7 + 9) - fall * a, O.zWall + 0.9 + h2 * h2 * 24 + NT_WIND[2] * 0.15 * a);
        _e.set(a * (1.2 + h) + i, a * (0.9 + h3) + i * 0.3, Math.sin(a * 2 + i) * 0.8); _q.setFromEuler(_e);
      } else _p.set(0, -9999, 0);
      _m.compose(_p, _q, _s);
      if (isB) burn.setMatrixAt(k, _m); else paper.setMatrixAt(k, _m);
    }
    paper.instanceMatrix.needsUpdate = burn.instanceMatrix.needsUpdate = true;
  }
  const smoke = ntSmokeSources();
  // the smoke that comes down past the south windows (from the fire 20 floors up, curling round the tower)
  const curl = { tower: 'N', face: [0, 1], f0: 80, f1: 92, t0: NT.hit + 9, rate: 4, dark: true, seed: 21, span: 1.0, alpha: 0.42, sink: 22, life: 40 };
  const dust = ntPuffs(scene, 400, { additive: true });
  // and the black smoke that pours down close past your windows a minute later (survivors on the floors below the
  // impact saw it: the fire's smoke caught in the wind against the face of the tower)
  const pour = ntPuffs(scene, 1400, { soft: 1.15 });
  function pourAt(t) {
    pour.begin();
    // (a stream a few metres out, crossing the middle of the frame: down and away to the east with the wind, in gusts;
    // many soft overlapping puffs so it reads as one stream of smoke going past, not a dark haze on the lens)
    if (t > NT.hit + 8) for (let i = 0; i < 1380; i++) {
      const t0 = NT.hit + 8 + i * 0.018, a = t - t0, h = hash1(i * 13 + 41), h2 = hash1(i * 19 + 43), h3 = hash1(i * 31 + 47);
      if (a < 0 || a > 16) continue;
      const x = -26 + h * 30 + 2.4 * a + noise1(a * 0.25 + i, 3) * 2.5;
      const y = Y + 18 - (1.6 + 1.6 * h2) * a + noise1(a * 0.2 + i, 5) * 1.5, z = O.zWall + 2.5 + h3 * h3 * 9 + 0.35 * a;
      const c = 0.018 + 0.035 * h3;
      const clump = 0.55 + 0.45 * MathX.smooth(noise1(t0 * 0.35, 17) + 0.25 * noise1(i * 0.37, 19), -0.3, 0.3);   // (it comes in gusts)
      pour.add(x, y, z, 1.4 + 0.22 * a + 1.5 * h2, 0.95 * clump * MathX.smooth(a, 0, 1.5) * (1 - MathX.smooth(a, 11, 16)), c, c * 0.98, c * 0.95);
    }
    pour.end();
  }

  function ntSmokeDark(t) { return MathX.smooth(t, NT.hit + 14, NT.hit + 20) * (0.55 + 0.45 * MathX.smooth(noise1(t * 0.35, 17), -0.4, 0.4)); }
  // ---- the camera, by mode
  const cam = S.camera;
  const E = (Y + 1.62), SEAT = Y + 1.2;
  // the centre of the window slit nearest x (columns every 40 in from x = −31.0)
  const slit = (x) => -31.0 + (Math.round((x + 31.0) / 1.016 - 0.5) + 0.5) * 1.016;
  function view(t, s) {
    const u = (a, b) => MathX.clamp((t - a) / (b - a), 0, 1);
    switch (s.mode) {
      case 'title': { const k = Ease.inOutSine(u(-1, NT.morning)); return [[1.5 - 1.2 * k, E + 0.05, 15.5 + 4 * k], [0 - 1 * k, Y + 1.25, 31.5], 52]; }
      case 'desk': { const k = Ease.inOutSine(u(NT.morning, NT.sky)); return [[MY.x - 0.02, SEAT + 0.05 * k, MY.z - 0.05 - 0.15 * k], ntV([MY.x - 0.1, Y + 0.8, MY.z + 0.6], [MY.x + 0.5, Y + 1.5, MY.z + 3], Ease.inOutSine(MathX.smooth(k, 0.35, 1))), 50]; }
      case 'sky': { const k = Ease.inOutSine(u(NT.sky, NT.tower)), x = slit(-7.6); return [[x, E, 31.66 + 0.08 * k], [x - 330 - 40 * k, Y - 50 + 100 * k, 31 + 520], 52]; }
      case 'tower': { const k = u(NT.tower, NT.windows), x = slit(9.5); return [[x, E - 0.1, 31.64], [x + 18 - 6 * k, Y + 8 + 52 * Ease.inOutSine(k), 122], 58]; }
      case 'down': { const k = Ease.inOutSine(u(NT.windows, NT.impactShot)), x = slit(0.5); return [[x, E - 0.3, 31.76 + 0.05 * k], [x + 0.2, Y - 60 - 32 * k, 31.6 + 60 - 6 * k], 62]; }
      case 'impact': return [[MY.x + 0.1, SEAT + 0.1, MY.z - 0.45], [MY.x + 9, Y + 1.75 - 0.25 * MathX.smooth(t, NT.hit + 2, NT.after), MY.z - 3.2], 62];
      case 'after': { const k = u(NT.after, NT.outside); return [[MY.x + 0.1, E, MY.z - 0.9 - 0.3 * k], [MY.x + 3.2, Y + NT_CEIL - 0.1, MY.z - 4.5], 56 + 2 * k]; }
      case 'outside': { const k = u(NT.outside, NT.nobody), x = slit(-2.2); return [[x, E, 31.62 + 0.12 * k], [x + 6 * k, Y + 9 - 14 * k, 31 + 34], 56]; }
      case 'nobody': {
        const w = MathX.smooth(t, NT.go, NT.known + 0.3), P = ntSpline([[0, MY.x + 0.1, MY.z - 0.9], [0.35, MY.x + 1.6, MY.z - 1.3], [0.7, MY.x + 3.1, 22.3], [1, 3.1, 17.4]], w);
        const at = w < 0.05 ? [MY.x + 4, Y + 1.4, MY.z - 5] : [P[0] + 1.5, Y + 1.45, P[1] - 6];
        return [[P[0], E - 0.05, P[1]], at, 56];
      }
      case 'core': { const k = u(NT.known, NT.stair); return [[5.1, E, 12.6 - 7.8 * Ease.inOutSine(k)], [5.1, E - 0.1, 0.5], 56]; }
    }
    return [[0, E, 20], [0, E, 31], 55];
  }

  // ---- the core corridor (to stairway C): beige walls, a drop ceiling, an EXIT sign, the door
  const corr = new THREE.Group(); scene.add(corr);
  ntBox(0.15, NT_CEIL, 12, coreM, 3.95, Y + NT_CEIL / 2, 7.3, corr); ntBox(0.15, NT_CEIL, 12, coreM, 6.25, Y + NT_CEIL / 2, 7.3, corr);
  ntBox(2.4, 0.04, 12, ntStd('#dedbd3', 0.9), 5.1, Y + NT_CEIL, 7.3, corr);
  ntBox(2.4, 0.04, 12, ntStd('#6a6460', 0.9), 5.1, Y + 0.005, 7.3, corr);
  for (let z = 2; z < 13; z += 2.4) ntBox(0.3, 0.02, 1.2, trM, 5.1, Y + NT_CEIL - 0.03, z, corr);
  const doorTex = ntTex(ntCanvas(256, 512, (g, W, H) => { g.fillStyle = '#7a3a2e'; g.fillRect(0, 0, W, H); g.fillStyle = '#efe6d2'; g.fillRect(48, 70, 160, 120); g.fillStyle = '#1a1a1a'; g.font = 'bold 44px sans-serif'; g.textAlign = 'center'; g.fillText('STAIR', W / 2, 120); g.font = 'bold 70px sans-serif'; g.fillText('C', W / 2, 180); g.fillStyle = '#c9b48a'; g.fillRect(200, 260, 30, 12); }), { repeat: false });
  ntBox(2.4, NT_CEIL, 0.15, coreM, 5.1, Y + NT_CEIL / 2, 1.2, corr);
  const doorway = ntBox(1.0, 2.1, 0.05, ntStd('#090a0c', 1), 5.1, Y + 1.05, 1.31, corr); doorway.castShadow = false;
  const door = new THREE.Group(); door.position.set(4.6, Y, 1.36); corr.add(door);
  ntBox(0.95, 2.08, 0.05, ntStd('#ffffff', 0.6, 0.2, { map: doorTex }), 0.475, 1.04, 0, door);
  const exitTex = ntTex(ntCanvas(256, 96, (g, W, H) => { g.fillStyle = '#f2efe6'; g.fillRect(0, 0, W, H); g.fillStyle = '#d0201a'; g.font = 'bold 70px sans-serif'; g.textAlign = 'center'; g.fillText('EXIT', W / 2, 74); }), { repeat: false });
  const exitM = new THREE.MeshStandardMaterial({ color: '#000', emissive: '#ffffff', emissiveMap: exitTex, emissiveIntensity: 1.3 });
  const exitS = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.15), exitM); exitS.position.set(5.1, Y + 2.3, 1.38); corr.add(exitS);
  // the glow strips just inside the door, and the people going in ahead of you
  const inGlow = ntBox(0.9, 0.02, 0.03, new THREE.MeshBasicMaterial({ color: '#b8f0a0' }), 5.1, Y + 0.02, 0.9, corr);
  const ahead = [0, 1, 2, 3].map((i) => ntPerson(scene, 'cor' + i, NT_LOOKS[(i + 3) % NT_LOOKS.length]));

  return {
    scene, camera: cam,
    cuts() { return []; },
    frame(t, s) {
      const after = t >= NT.hit;
      // the camera, the jolt and the sway (the whole floor moves with you: the outside swings the other way)
      const [p, at, fov] = view(t, s);
      const j = ntJolt(t, NT.hit, 2.3, 1.4), sw = ntSway(t, NT.hit, 1.7, 6.5, 12), j2 = ntJolt(t, NT.hit + 0.25, 0.8, 2.4, 6);
      const d = ntDrift(t, s.mode === 'nobody' || s.mode === 'core' ? 0.012 : 0.006, 0.4, 3);
      ntCam(cam, [p[0] + d[0] + j[0] + j2[0] + sw[0], p[1] + d[1] + j[1] + j2[1], p[2] + d[2]], at, fov, j[2] + j2[2] + sw[1]);
      // the troffers: steady; at 8:46 they flicker, a few stay out
      const fl = after ? MathX.clamp(1 - 0.85 * Math.max(0, noise1(t * 17, 5)) * Math.max(Math.exp(-(t - NT.hit) / 2.5), s.mode === 'after' ? 0.55 * Math.max(0, noise1(t * 0.9, 6)) : 0) - 0.5 * (MathX.smooth(t, NT.hit, NT.hit + 0.05) * (1 - MathX.smooth(t, NT.hit + 0.15, NT.hit + 0.7))), 0, 1) : 1;
      trM.emissiveIntensity = fl * (after ? 0.92 : 1.0); ceilM.emissiveIntensity = 0.22 * fl * (after ? 0.9 : 1);
      const sd = ntSmokeDark(t);
      S.hemi.intensity = 0.75 * (0.75 + 0.25 * fl) * (1 - 0.3 * sd); S.sun.intensity = 2.6 * (1 - 0.6 * sd);
      // the screen
      const cm = Math.floor(ntClockParts(ntClock(t)).m % 10);
      screen.update({ on: !(after && t < NT.hit + 0.6) && t < NT.nobody + 3, m: cm, glitch: after && t < NT.hit + 3 ? Math.floor(t * 12) : 0 });
      // coffee ripple (the cup jumps a little in the jolt)
      coffee.scale.set(1, 1 + 3 * Math.abs(j[1]) * 20, 1); mug.position.y = deskTop + Math.max(0, j[1] * 0.4);
      // ceiling tiles: knocked out, they fall (ballistic, tumbling), land and stay
      tiles.forEach((T, i) => {
        const a = t - NT.hit - T.delay;
        if (a <= 0) { T.m.position.set(T.x, Y + NT_CEIL - 0.01, T.z); T.m.rotation.set(0, 0, 0); holes[i].visible = false; return; }
        holes[i].visible = true;
        const yTop = Y + NT_CEIL - 0.01, yLand = Y + (Math.abs(T.x - MY.x) < 0.9 && T.z > 27.5 ? 0.76 : 0.02), y = Math.max(yLand, yTop - 4.9 * a * a), done = y <= yLand ? 1 : 0;
        const k = MathX.clamp(a / Math.sqrt((yTop - yLand) / 4.9), 0, 1);
        T.m.position.set(T.x + 0.15 * k * T.spin, y + 0.008, T.z + 0.1 * k);
        T.m.rotation.set(k * 0.5 * T.spin * (1 - done * 0.92), k * 0.6, k * 0.4 * T.spin * (1 - done * 0.9));
      });
      hang.forEach((g, i) => { const a = t - NT.hit - 0.3 - i * 0.4; g.rotation.z = a > 0 ? -0.9 * (1 - Math.exp(-a * 3) * Math.cos(a * 9)) : 0; });
      // people: typing, then on their feet, looking up; then leaving (walking to the core)
      crew.forEach((c, i) => {
        const up = NT.hit + 0.6 + i * 0.35, leave = NT.nobody + 1.5 + i * 1.1;
        if (t < up) { ntPlace(c.p, c.x, Y + (c.act === 'ntType' ? 0 : 0), c.z, c.f, c.act, t + i * 3); return; }
        if (t < leave || i % 3 === 0) { ntPlace(c.p, c.x, Y, c.z, c.f + 0.6 * Math.sin(i), i % 2 ? 'ntLookUp' : 'idle', t - up, 0, c.act, 1 - MathX.smooth(t, up, up + 0.6)); return; }
        const a = t - leave, dist = a * 1.25, tx = 3.1 + (i % 2) * 0.6, tz = 15.2;
        const L = Math.hypot(tx - c.x, tz - c.z), k = Math.min(1, dist / L);
        ntPlace(c.p, c.x + (tx - c.x) * k, Y, c.z + (tz - c.z) * k, Math.atan2(-(tx - c.x), -(tz - c.z)), k < 1 ? 'walk' : 'idle', a, dist / 1.32 * Math.PI * 2);
        c.p.root.visible = k < 1;
      });
      ahead.forEach((p, i) => {
        if (s.mode !== 'core') { p.root.visible = false; return; }
        const a = t - NT.known + 0.5, z = 9.5 - i * 1.3 - a * 1.0;
        if (z < 1.25) { p.root.visible = false; return; }
        ntPlace(p, 4.9 + (i % 2) * 0.35, Y, z, 0, 'walk', a, (9.5 - z) / 1.32 * Math.PI * 2 + i);
      });
      corr.visible = s.mode === 'core' || s.mode === 'nobody';
      door.rotation.y = -1.7 * MathX.smooth(t, NT.known - 1, NT.known);
      // the outside: paper, the smoke, the far fire
      paperAt(t);
      puffs.begin(); fire.begin();
      for (const src of smoke) ntPlume(puffs, t, src, { fire });
      ntPlume(puffs, t, curl, {});
      puffs.end(); fire.end();
      pourAt(t);
      // dust in the light, and more of it after the tiles fall
      dust.begin();
      for (let i = 0; i < 260; i++) {
        const h = hash1(i * 11 + 1), h2 = hash1(i * 23 + 2), h3 = hash1(i * 37 + 3), more = i < 120 ? 1 : MathX.smooth(t, NT.hit + 0.3, NT.hit + 2.5);
        const x = MY.x - 4 + h * 9 + noise1(t * 0.05 + i, 4) * 0.4, z = MY.z - 4 + h2 * 5, y = Y + 0.3 + ((h3 * 2.3 + (after ? -0.04 : 0.02) * t + 100) % 2.3);
        dust.add(x, y, z, 0.012 + 0.012 * h, 0.22 * more, 1, 0.97, 0.9);
      }
      dust.end();
    },
    grade(t, p, s) {
      p.exposure = s.mode === 'down' || s.mode === 'sky' ? 0.95 : 1.02; p.saturation = 0.98; p.contrast = 1.05; p.warmth = 0.04; p.bloom = 0.32; p.bloomThreshold = 0.88;
      if (s.mode === 'core') { p.exposure = 0.96; p.warmth = 0.02; }
      // the jolt: a flash of the lights going, a little smear
      if (t >= NT.hit && t < NT.hit + 1.2) { const a = t - NT.hit; p.exposure *= 1 - 0.35 * Math.exp(-a * 6) * (0.5 + 0.5 * Math.sin(a * 60)); }
      // the smoke outside darkens the floor
      p.exposure *= 1 - 0.3 * ntSmokeDark(t);
      p.fade = Math.max(p.fade, 1 - MathX.smooth(t, 0, 0.35));
    },
    labels(t) {
      const s = ntShotAt(t), W = StoryHUD.win;
      if (s.mode === 'tower') return [{ p: [NT_TW.S.x - 20, NT_Y73 + 34, NT_TW.S.z - 32], text: 'THE SOUTH TOWER', sub: 'YOUR TOWER’S TWIN', a: W(t, NT.tower + 1.0, NT.windows - 0.3, 0.5, 0.4) }];
      if (s.mode === 'sky') return [{ p: [-1000, 0, 1150], text: 'THE HUDSON', sub: 'NEW JERSEY BEYOND', a: W(t, ntCap('sky', 1).show - 0.3, NT.tower - 0.3, 0.5, 0.4) }];
      if (s.mode === 'down') return [{ p: [0.5, 0, 140], text: 'THE PLAZA', sub: 'ABOUT 880 ft BELOW', a: W(t, ntCap('windows', 0).show + 0.4, NT.impactShot - 0.3, 0.5, 0.4) }];
      return [];
    },
  };
};
