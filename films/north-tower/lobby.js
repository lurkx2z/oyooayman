/* =====================================================================
   LOBBY — 9:42 to 9:50: out of stairway C onto the mezzanine (the plaza level of the North Tower), past the tall
   windows (cracked, glass on the floor, the plaza outside hazed with dust), where police send everyone away from
   the windows and down a stopped escalator into the concourse, the shopping mall under the plaza, its sprinklers
   raining, and on towards the exits to the north and east.
   The plaza is never shown clearly: you are told not to look, and the film doesn't.
   Modes: mezz · police · esc · conc
   ===================================================================== */

NT_SETS.lobby = (app) => {
  const S = ntSet(app, { sky: '#d9d6cf', fov: 60, near: 0.05, far: 300, hemi: ['#e7e5df', '#5d5952', 0.85], sun: [40, 30, -10], sunColor: '#fff4e2', sunI: 1.8, shadow: 2048, shadowR: 30, shadowFar: 200 });
  const scene = S.scene;
  scene.fog = new THREE.FogExp2('#b9b5ad', 0.022);
  // ---- the mezzanine hall: 40 × 26 m, 8 m high; the windows on the east side (x = +13)
  const marble = ntTex(ntCanvas(512, 512, (g, W, H) => {
    g.fillStyle = '#8a8680'; g.fillRect(0, 0, W, H); const r = new RNG(21);
    for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(230,226,218,${r.range(0.05, 0.22)})`; g.lineWidth = r.range(0.5, 2.5); g.beginPath(); let x = r.range(0, W), y = r.range(0, H); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += r.range(-60, 60); y += r.range(-30, 60); g.lineTo(x, y); } g.stroke(); }
    g.strokeStyle = 'rgba(40,38,36,0.5)'; g.lineWidth = 2; g.strokeRect(0, 0, W, H);
  }));
  marble.repeat.set(16, 12);
  const floorM = ntStd('#ffffff', 0.18, 0.05, { map: marble });
  // (the floor leaves an opening for the escalator: x 1.0…5.0, z −21…−14)
  ntBox(40, 0.1, 23, floorM, 0, -0.05, -2.5).castShadow = false; ntBox(21, 0.1, 7, floorM, -9.5, -0.05, -17.5).castShadow = false; ntBox(15, 0.1, 7, floorM, 12.5, -0.05, -17.5).castShadow = false;
  ntBox(40, 0.2, 30, ntStd('#cfcbc2', 0.9), 0, 8.1, -6).castShadow = false;
  const wallM = ntStd('#b9b2a4', 0.6);
  ntBox(0.3, 8, 30, wallM, -13, 4, -6); ntBox(40, 8, 0.3, wallM, 0, 4, -21); ntBox(40, 8, 0.3, wallM, 0, 4, 9);
  // the core's wall with the stair door (you come out of it at x = −12)
  const doorM = ntStd('#6b3a2c', 0.55, 0.3);
  const sdoor = new THREE.Group(); sdoor.position.set(-12.85, 0, -12.5); scene.add(sdoor);
  ntBox(0.06, 2.1, 0.95, doorM, 0, 1.05, 0.47, sdoor);
  // the east wall: tree columns 1 m wide every 3.05 m, tall arched windows between
  const colM = ntStd('#c9cbcd', 0.35, 0.6);
  for (let z = 8; z >= -20; z -= 3.05) { ntBox(1.0, 8, 0.9, colM, 13.2, 4, z); }
  const archTex = ntTex(ntCanvas(256, 1024, (g, W, H) => { g.clearRect(0, 0, W, H); g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(0, H); g.lineTo(0, 120); g.quadraticCurveTo(W / 2, -60, W, 120); g.lineTo(W, H); g.fill(); }), { repeat: false });
  // the glass: some panes cracked (a crack texture), some gone
  const crackTex = ntTex(ntCanvas(256, 1024, (g, W, H) => {
    g.clearRect(0, 0, W, H); const r = new RNG(44);
    for (let c = 0; c < 3; c++) { const cx = r.range(40, W - 40), cy = r.range(200, H - 200); for (let i = 0; i < 22; i++) { g.strokeStyle = `rgba(255,255,255,${r.range(0.4, 0.9)})`; g.lineWidth = r.range(0.6, 2); g.beginPath(); g.moveTo(cx, cy); let x = cx, y = cy; const a = r.range(0, 6.28); for (let k = 0; k < 5; k++) { x += Math.cos(a + r.range(-0.4, 0.4)) * r.range(20, 70); y += Math.sin(a + r.range(-0.4, 0.4)) * r.range(20, 90); g.lineTo(x, y); } g.stroke(); } }
  }), { repeat: false });
  // (and the cracks as they read against the bright plaza: dark lines, a star where something hit)
  const crackDark = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, fog: false, map: ntTex(ntCanvas(256, 1024, (g, W, H) => {
    g.clearRect(0, 0, W, H); const r = new RNG(45);
    for (let c = 0; c < 2; c++) {
      const cx = r.range(50, W - 50), cy = r.range(300, H - 250);
      for (let i = 0; i < 26; i++) { g.strokeStyle = `rgba(40,42,46,${r.range(0.5, 0.95)})`; g.lineWidth = r.range(1, 3); g.beginPath(); g.moveTo(cx, cy); let x = cx, y = cy; const a = i / 26 * 6.283 + r.range(-0.1, 0.1); for (let k = 0; k < 6; k++) { x += Math.cos(a + r.range(-0.35, 0.35)) * r.range(18, 60); y += Math.sin(a + r.range(-0.35, 0.35)) * r.range(18, 80); g.lineTo(x, y); } g.stroke(); }
      for (const rr of [22, 48, 85]) { g.strokeStyle = 'rgba(50,52,56,0.7)'; g.lineWidth = 1.5; g.beginPath(); for (let k = 0; k <= 14; k++) { const a = k / 14 * 6.283, q = rr * (0.8 + 0.4 * r.next()); k ? g.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q * 1.3) : g.moveTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q * 1.3); } g.stroke(); }
    }
  }), { repeat: false }), alphaMap: archTex });
  const panes = [];
  for (let k = 0; k < 9; k++) {
    const z = 8 - 1.525 - k * 3.05, st = [1, 0, 2, 1, 1, 0, 2, 1, 1][k];
    if (st === 2) continue;   // gone
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 7.6), new THREE.MeshStandardMaterial({ color: '#dfe8ee', transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.6, alphaMap: archTex, depthWrite: false, emissive: '#ffffff', emissiveMap: st === 1 ? crackTex : null, emissiveIntensity: st === 1 ? 0.55 : 0 }));
    m.position.set(13.15, 3.85, z); m.rotation.y = -Math.PI / 2; scene.add(m); panes.push(m);
    if (st === 1) { const c = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 7.6), crackDark); c.position.set(13.12, 3.85, z); c.rotation.y = -Math.PI / 2; c.scale.x = k % 2 ? -1 : 1; scene.add(c); }
  }
  // outside: the plaza, bright and hazed (a backdrop of dust, low shapes of debris, no detail)
  const haze = new THREE.Mesh(new THREE.PlaneGeometry(200, 60), new THREE.MeshBasicMaterial({ color: '#e6e2da', fog: false }));
  haze.position.set(70, 20, -6); haze.rotation.y = -Math.PI / 2; scene.add(haze);
  ntBox(80, 0.2, 60, ntStd('#a9a59c', 0.9), 54, -0.1, -6).castShadow = false;
  const debM = ntStd('#5e5b56', 0.9);
  const dr = new RNG(8);
  for (let i = 0; i < 40; i++) { const d = ntBox(dr.range(0.3, 2.5), dr.range(0.1, 0.8), dr.range(0.3, 3), debM, dr.range(17, 60), 0.1, dr.range(-30, 18)); d.rotation.set(dr.range(-0.3, 0.3), dr.range(0, 3), dr.range(-0.3, 0.3)); }
  const outPuffs = ntPuffs(scene, 500);
  // glass on the marble (instanced flecks that catch the light)
  const NG = 700, glass = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.004, 0.04), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.05, metalness: 0.9, emissive: '#cfd8e0', emissiveIntensity: 0.25 }), NG);
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
  for (let i = 0; i < NG; i++) { const h = hash1(i * 3 + 1), h2 = hash1(i * 5 + 2); _p.set(12.6 - Math.pow(h, 2.2) * 9, 0.004, 8 - h2 * 28); _e.set(0, h * 20, 0); _q.setFromEuler(_e); const sc = 0.4 + 1.8 * hash1(i * 7 + 3); _s.set(sc, 1, sc); _m.compose(_p, _q, _s); glass.setMatrixAt(i, _m); }
  scene.add(glass);
  const shardG = new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.22, 0.05), new THREE.Vector2(0.08, 0.3)])); shardG.rotateX(-Math.PI / 2);
  const NS = 240, shards = new THREE.InstancedMesh(shardG, new THREE.MeshStandardMaterial({ color: '#e8f0f4', roughness: 0.04, metalness: 0.85, emissive: '#dfe8ee', emissiveIntensity: 0.35, side: THREE.DoubleSide }), NS);
  for (let i = 0; i < NS; i++) { const h = hash1(i * 11 + 4), h2 = hash1(i * 13 + 5); _p.set(12.7 - Math.pow(h, 1.6) * 6, 0.006 + 0.004 * h2, 8 - h2 * 28); _e.set((h - 0.5) * 0.08, h2 * 30, 0); _q.setFromEuler(_e); const sc = 0.5 + 1.6 * hash1(i * 17 + 6); _s.set(sc, 1, sc); _m.compose(_p, _q, _s); shards.setMatrixAt(i, _m); }
  scene.add(shards);
  // the lights in the ceiling: a few out
  const lampM = new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#fff8ea', emissiveIntensity: 1.2 });
  for (let x = -10; x <= 10; x += 4) for (let z = 6; z >= -18; z -= 4) if (hash2(x, z) > 0.3) ntBox(0.6, 0.05, 0.6, lampM, x, 7.98, z).castShadow = false;
  const fill = new THREE.PointLight('#fff3e0', 30, 30, 1.5); fill.position.set(0, 6, -6); scene.add(fill);

  // ---- the escalator down (stopped), from (2, 0, −14) to (2, −6, −24.4)
  const ESC = { x: 2, z0: -14, z1: -24.4, drop: 6 };
  const stepM = ntStd('#55585c', 0.4, 0.7), sideM = ntStd('#9aa0a6', 0.25, 0.8), beltM = ntStd('#1a1a1c', 0.5);
  ntBox(4.2, 0.3, 10, floorM, ESC.x, -0.15, -18.9).visible = false;
  for (let k = 0; k < 30; k++) { const u = k / 30, z = ESC.z0 - (ESC.z0 - ESC.z1) * u, y = -ESC.drop * u; ntBox(1.1, 0.2, 0.4, stepM, ESC.x, y - 0.1, z - 0.2); ntBox(1.1, 0.2, 0.4, stepM, ESC.x + 1.6, y - 0.1, z - 0.2); }
  const railG = new THREE.CylinderGeometry(1, 1, 1, 6); railG.translate(0, 0.5, 0);
  for (const dx of [-0.65, 0.65, 0.95, 2.25]) { const m = new THREE.Mesh(railG, beltM); ntStrut(m, [ESC.x + dx, 0.95, ESC.z0], [ESC.x + dx, 0.95 - ESC.drop, ESC.z1], 0.05); scene.add(m); const pnl = ntBox(0.04, 0.9, 12.1, sideM, ESC.x + dx, 0.45, -19.2); pnl.rotation.x = Math.atan2(ESC.drop, ESC.z0 - ESC.z1); pnl.position.y = 0.5 - ESC.drop / 2; }
  // the opening in the floor round it
  for (const wx of [0.9, 5.1]) ntBox(0.15, 6, 8.4, wallM, wx, -3, -18.2);

  // ---- the concourse (y = −6): a corridor of shops, 10 m wide, 3.6 m high, running north from the escalator
  const CY = -ESC.drop, cz0 = -24.4;
  const concFloor = ntStd('#ffffff', 0.12, 0.05, { map: marble.clone() }); concFloor.map.repeat.set(4, 20); concFloor.map.needsUpdate = true;
  ntBox(12, 0.1, 60, concFloor, ESC.x + 0.8, CY - 0.05, cz0 - 28).castShadow = false;
  ntBox(12, 0.15, 60, ntStd('#d4d0c6', 0.9), ESC.x + 0.8, CY + 3.7, cz0 - 28).castShadow = false;
  const SHOPS = ['BOOKS', 'SHOES', 'CAFÉ', 'PHARMACY', 'BANK', 'GIFTS', 'NEWS', 'FLOWERS', 'CARDS', 'OPTICIAN'];
  const shopTex = SHOPS.map((name, i) => ntTex(ntCanvas(512, 256, (g, W, H) => {
    const lit = i % 3 !== 1;
    g.fillStyle = '#1e2024'; g.fillRect(0, 0, W, H); g.fillStyle = lit ? '#efe6cf' : '#40403c'; g.fillRect(0, 60, W, H - 60);
    const r = new RNG(i + 3); for (let k = 0; k < 14; k++) { g.fillStyle = `hsla(${r.range(0, 360)},25%,${lit ? 55 : 22}%,0.9)`; g.fillRect(r.range(10, W - 60), r.range(90, H - 50), r.range(20, 70), r.range(20, 60)); }
    g.fillStyle = '#cfc9ba'; g.font = 'bold 44px serif'; g.textAlign = 'center'; g.fillText(name, W / 2, 46);
    g.strokeStyle = '#555'; g.lineWidth = 6; for (let x = 0; x <= W; x += W / 4) { g.beginPath(); g.moveTo(x, 60); g.lineTo(x, H); g.stroke(); }
  }), { repeat: false }));
  for (let k = 0; k < 10; k++) {
    const side = k % 2 ? 1 : -1, z = cz0 - 4 - Math.floor(k / 2) * 9;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(8, 3.4), new THREE.MeshStandardMaterial({ map: shopTex[k], emissive: '#ffffff', emissiveMap: shopTex[k], emissiveIntensity: k % 3 !== 1 ? 0.5 : 0.08, roughness: 0.3 }));
    m.position.set(ESC.x + 0.8 + side * 5.95, CY + 1.75, z); m.rotation.y = -side * Math.PI / 2; scene.add(m);
  }
  for (const side of [-1, 1]) ntBox(0.2, 3.7, 60, wallM, ESC.x + 0.8 + side * 6.05, CY + 1.85, cz0 - 28);
  const cl = [0, 1, 2, 3].map((i) => { const L = new THREE.PointLight('#fff2dc', 12, 16, 1.6); L.position.set(ESC.x + 0.8, CY + 3.2, cz0 - 4 - i * 11); scene.add(L); return L; });
  for (let z = cz0 - 2; z > cz0 - 56; z -= 3) ntBox(0.4, 0.04, 1.6, lampM, ESC.x + 0.8, CY + 3.6, z).castShadow = false;
  // the sprinklers: water falling in streaks, splashing on the floor; a sheet of water on the floor
  const NR = 900, rain = new THREE.InstancedMesh(new THREE.BoxGeometry(0.008, 0.35, 0.008), new THREE.MeshBasicMaterial({ color: '#d6e6f0', transparent: true, opacity: 0.5 }), NR);
  rain.frustumCulled = false; scene.add(rain);
  const puddle = new THREE.Mesh(new THREE.PlaneGeometry(12, 60), new THREE.MeshStandardMaterial({ color: '#7a8c98', transparent: true, opacity: 0.35, roughness: 0.02, metalness: 0.8, depthWrite: false }));
  puddle.rotation.x = -Math.PI / 2; puddle.position.set(ESC.x + 0.8, CY + 0.01, cz0 - 28); scene.add(puddle);
  const dust = ntPuffs(scene, 400, { additive: true });

  // ---- people: the stream to the escalator; the two officers; people ahead in the concourse
  const crowd = Array.from({ length: 16 }, (_, i) => ntPerson(scene, 'lb' + i, NT_LOOKS[(i * 3 + 4) % NT_LOOKS.length]));
  const cops = [ntPerson(scene, 'cop1', 'ntNYPD'), ntPerson(scene, 'cop2', 'ntPAPD')];
  const cam = S.camera;

  // the route: out of the door (−12, −12), across the hall to the escalator's head (2, −13.6), down, along the concourse
  const ROUTE = [[0, -12.2, 0, -12.0], [1, -8.0, 0, -9.8], [2, -2.0, 0, -11.6], [3, 1.6, 0, -13.2], [4, 2.0, 0, -14.4], [5, 2.0, -6, -24.4], [6, 2.4, -6, -30], [7, 2.4, -6, -60]];
  const routeAt = (u) => ntSpline(ROUTE.map((r) => [r[0], r[1], r[2], r[3]]), u);
  // film time → where along the route you are (0…7)
  function you(t) {
    if (t < NT.police) return 0.0 + 1.6 * MathX.smooth(t, NT.mezz + 0.3, NT.police + 0.8) * 0.95;
    if (t < NT.esc) return 1.52 + (3.9 - 1.52) * MathX.smooth(t, NT.police, NT.esc + 0.2);
    if (t < NT.conc) return 3.9 + (5.0 - 3.9) * Ease.inOutSine(MathX.clamp((t - NT.esc) / (NT.conc - NT.esc), 0, 1));
    return 5.0 + (6.7 - 5.0) * MathX.clamp((t - NT.conc) / (NT.five - NT.conc), 0, 1);
  }

  return {
    scene, camera: cam,
    cuts() { return []; },
    frame(t, s) {
      const u = you(t), P = routeAt(u), Q = routeAt(Math.min(7, u + 0.35));
      let at = [Q[0], Q[1] + 1.45, Q[2]];
      // on the mezzanine your eyes go to the windows; then the officer; then you look away (down, to the escalator)
      if (s.mode === 'mezz') at = ntV([12, 2.6, -4], [Q[0], 1.4, Q[2]], MathX.smooth(t, ntCap('mezz', 1).hide - 0.5, NT.police + 0.4));
      if (s.mode === 'police') { const k = MathX.smooth(t, ntCap('police', 1).show - 0.6, ntCap('police', 1).show + 0.6); at = ntV([5.2, 1.6, -11.2], [2.0, -1.2, -20], k); }
      if (s.mode === 'esc') at = [ESC.x, P[1] + 0.2 - 2.5, P[2] - 6];
      const d = ntDrift(t, 0.012, 0.45, 21), bob = Math.sin(u * 14) * 0.015 * (s.mode === 'esc' ? 0.4 : 1);
      ntCam(cam, [P[0] + d[0], P[1] + 1.6 + bob + d[1], P[2] + d[2]], at, s.mode === 'conc' ? 62 : 60, 0.5 * noise1(t * 0.3, 7));
      sdoor.rotation.y = 1.3;
      // the stream of people ahead of you along the route, the officers by the escalator
      crowd.forEach((p, i) => {
        const pu = u + 0.22 + i * 0.16 + 0.02 * noise1(t * 0.3, i), q = routeAt(Math.min(7, pu)), q2 = routeAt(Math.min(7, pu + 0.05));
        if (pu > 6.95 || (q[1] < -0.5 && s.mode === 'mezz')) { p.root.visible = false; return; }
        const side = (i % 2 ? 0.45 : -0.4);
        const hx = q2[0] - q[0], hz = q2[2] - q[2], hd = Math.atan2(-hx, -hz), nx = Math.cos(hd), nz = -Math.sin(hd);
        ntPlace(p, q[0] + side * nx, q[1], q[2] + side * nz, hd, s.mode === 'conc' && i % 4 === 0 ? 'ntCover' : 'walk', t + i, pu * 9 + i);
      });
      ntPlace(cops[0], 3.4, 0, -10.6, Math.PI * 0.5, 'ntPoint', t);
      ntPlace(cops[1], -0.4, 0, -14.6, Math.PI * 0.2, 'ntWave', t + 1.3);
      cops.forEach((c) => (c.root.visible = s.mode !== 'conc'));
      // the plaza's haze moves; dust in the hall's light
      outPuffs.begin();
      for (let i = 0; i < 160; i++) { const h = hash1(i * 7 + 1), h2 = hash1(i * 11 + 2), a = (t * 0.6 + h * 60) % 60; outPuffs.add(18 + h * 40, 1 + h2 * 14 + a * 0.05, -30 + ((h2 * 50 + a * 1.2) % 50), 6 + h * 8, 0.18, 0.86, 0.84, 0.8); }
      outPuffs.end();
      dust.begin();
      for (let i = 0; i < 300; i++) { const h = hash1(i * 13 + 4), h2 = hash1(i * 17 + 5), h3 = hash1(i * 19 + 6); dust.add(-10 + h * 22, ((h2 * 7 - t * 0.05) % 7 + 7) % 7 + 0.2, -20 + h3 * 28, 0.03 + 0.03 * h, 0.12, 1, 0.97, 0.92); }
      dust.end();
      // the sprinklers
      rain.visible = s.mode === 'conc' || s.mode === 'esc';
      if (rain.visible) {
        for (let i = 0; i < NR; i++) {
          const h = hash1(i * 23 + 1), h2 = hash1(i * 29 + 2), per = 0.55 + 0.2 * h, a = ((t + h2 * 7) % per) / per;
          _p.set(ESC.x + 0.8 + (h - 0.5) * 11.5, CY + 3.6 - a * 3.6, cz0 + 1 - h2 * 40); _q.identity(); _s.set(1, 1, 1); _m.compose(_p, _q, _s); rain.setMatrixAt(i, _m);
        }
        rain.instanceMatrix.needsUpdate = true;
      }
      cl.forEach((L, i) => { L.intensity = 12 * (0.6 + 0.4 * (i % 2 ? 1 : MathX.clamp(0.6 + noise1(t * 6, i), 0, 1))); });
    },
    grade(t, p, s) {
      p.exposure = s.mode === 'mezz' || s.mode === 'police' ? 0.98 : 1.04; p.saturation = s.mode === 'conc' ? 0.9 : 0.82; p.contrast = 1.04; p.warmth = 0.02; p.bloom = 0.5; p.bloomThreshold = 0.8; p.vignette = 0.55; p.grain = 0.035;
    },
  };
};
