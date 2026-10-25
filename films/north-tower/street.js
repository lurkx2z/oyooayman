/* =====================================================================
   STREET — 9:50 to 10:29, outside: up the stairs by 5 World Trade Center onto Vesey Street, round the corner onto
   Church Street, walking north (as the police told everyone to). Both towers burning above the street. 9:58:59:
   the South Tower comes down; its cloud fills the street and day turns to night. Then the grey: dust on everything,
   paper falling. Further north, at 10:28, the North Tower falls.
   The collapses are seen as they were seen from the street: from blocks away, through smoke, the towers going
   into their own clouds. Nobody falls; nobody is hurt on screen.
   Modes: five · back · roar · cloud · grey · walk · fall
   ===================================================================== */

Object.assign(LOOKS, {
  ntAsh1: { skin: 5, build: 'avg', shirt: '#b9b6ae', sleeves: 'long', pants: '#9a978f', shoes: '#8a8780', sole: '#77746e', hair: '#a8a59e', collar: true },
  ntAsh2: { skin: 5, build: 'slim', shirt: '#c4c1b9', sleeves: 'long', pants: '#a3a098', shoes: '#8f8c85', sole: '#7a7771', hair: '#9f9c95', hairStyle: 'long', shoulderBag: '#8d8a83' },
  ntAsh3: { skin: 5, build: 'broad', shirt: '#aeaba3', sleeves: 'long', pants: '#97948c', shoes: '#86837c', sole: '#75726c', hair: '#b0ada6', jacket: true, collar: true, inner: '#cfccc4' },
  ntAsh4: { skin: 5, build: 'slim', shirt: '#bdbab2', sleeves: 'long', pants: '#9d9a92', shoes: '#8c8982', sole: '#78756f', hair: '#a5a29b', hairStyle: 'bun' },
});

const NT_CH = 185;                     // Church Street's centreline (x)
const NT_WB = -8;                      // West Broadway's (it runs north from the North Tower: the tower stands at its end)
const NT_SB = { mark: 0 };             // (the South Tower's fall, and the North Tower's: see ntTopAt)
// how far a tower's top has come down (m) since it began to fall at t0: about 10–12 s, accelerating
function ntDropAt(t, t0, H, dur) { const a = t - t0; if (a <= 0) return 0; return Math.min(H + 5, H * Math.pow(a / dur, 1.7)); }

NT_SETS.street = (app) => {
  const S = ntSet(app, { sky: '#6f9fd2', fov: 60, near: 0.1, far: 9000, hemi: ['#d8e2ee', '#5f5a52', 0.8], sun: [-80 + 200 * 0.8, 260, -400 + 200 * 0.5], sunColor: '#fff2dc', sunI: 2.8, shadow: 4096, shadowR: 140, shadowFar: 900, env: ['#7fb0e8', '#dfe8f0', '#6e6a64'] });
  const scene = S.scene;
  S.sun.position.set(NT_CH + NT_SUN[0] * 400, NT_SUN[1] * 400 + 40, -420 + NT_SUN[2] * 400); S.sun.target.position.set(NT_CH, 0, -420);
  scene.fog = new THREE.FogExp2('#c9d6e2', 0.0004);
  const sky = ntSky(scene, '#2464b8', '#cfdeea', '#9db0c0', { sunDir: NT_SUN, sunGlow: '#fff2d8', hw: 0.3 });
  ntCity(scene, { r: 2400, skip: (x, z) => ntNearWTC(x, z) || Math.abs(x - NT_CH) < 60 || (z < -150 && z > -240 && x > -120 && x < 240) || (Math.abs(x - NT_WB) < 75 && z < -240), seed: 1001, scale: 0.9, lowNorth: true });
  ntPlaza(scene);
  const N = ntTower(scene, NT_TW.N, { antenna: true }), SO = ntTower(scene, NT_TW.S, {});
  // the burning floors, as they looked from the street: a black band, the windows glowing orange in it
  const burnTex = ntTex(ntCanvas(512, 64, (g, W, H) => {
    g.fillStyle = '#151210'; g.fillRect(0, 0, W, H); const rb = new RNG(93);
    for (let i = 0; i < 70; i++) { const x = rb.range(0, W), y = rb.range(4, H - 4), w = rb.range(3, 16), gr = g.createRadialGradient(x, y, 0, x, y, w); gr.addColorStop(0, rb.next() < 0.5 ? '#ffb347' : '#ff7a1c'); gr.addColorStop(1, 'rgba(120,40,10,0)'); g.fillStyle = gr; g.fillRect(x - w, y - w, 2 * w, 2 * w); }
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(0,0,0,${rb.range(0.3, 0.7)})`; g.fillRect(rb.range(0, W), rb.range(0, H), rb.range(10, 60), rb.range(4, 20)); }
  }));
  for (const [M, T, f0, f1] of [[N, NT_TW.N, 92, 100], [SO, NT_TW.S, 77, 85]]) {
    const bt = burnTex.clone(); bt.needsUpdate = true; bt.repeat.set(2, 1);
    const band = new THREE.Mesh(new THREE.BoxGeometry(T.w + 0.4, (f1 - f0) * NT_FLOOR_H, T.w + 0.4), new THREE.MeshBasicMaterial({ map: bt }));
    band.position.y = (f0 + f1) / 2 * NT_FLOOR_H; M.g.add(band);
  }
  // ---- Church Street: a canyon of buildings both sides from Vesey (z = −170) north, cross streets every 80 m
  const A = [0, 1, 2, 3].map(() => ({ pos: [], nor: [], uv: [], idx: [], tile: 26 })), r = new RNG(311);
  // (low near the towers, as in 2001: five to fifteen floors, so the towers stand over everything; West Broadway in
  // Tribeca is cast-iron lofts, five to eight floors)
  for (const [cx, z0] of [[NT_CH, -218], [NT_WB, -262]]) for (const side of [-1, 1]) for (let z = z0; z > -1400; z -= 80) {
    let zz = z;
    while (zz > z - 62) { const d = 12 + r.next() * 18, h = cx === NT_WB ? 16 + Math.pow(r.next(), 1.6) * 16 : 20 + Math.pow(r.next(), 1.6) * 60, x0 = cx + side * 15, x1 = cx + side * (15 + 25 + r.next() * 15); ntBoxInto(A[Math.floor(r.next() * 4)], Math.min(x0, x1), Math.max(x0, x1), 0, h, zz - d, zz); zz -= d + 0.4; }
  }
  // Vesey Street's north side (and 7 World Trade Center, 47 floors) from the plaza to Church Street
  for (let x = -110; x < 135; x += 30 + r.next() * 10) { if (x < NT_WB + 22 && x + 28 > NT_WB - 22) continue; if (x < NT_WB) continue; ntBoxInto(A[Math.floor(r.next() * 4)], x, x + 28, 0, 24 + r.next() * 36, -240, -196); }
  ntBoxInto(A[2], -108, NT_WB - 12, 0, 186, -262, -198);   // 7 World Trade Center
  const fac = [['#a59d90', '#3e4146'], ['#8c8378', '#33363a'], ['#b5ae9f', '#4d5359'], ['#7d6352', '#2c2826']].map(([b, w], k) => new THREE.MeshStandardMaterial({ map: ntWindowTex(71 + k, b, w, 0.06), roughness: 0.8 }));
  A.forEach((a, k) => { const m = new THREE.Mesh(ntGeoFrom(a), fac[k]); m.castShadow = m.receiveShadow = true; scene.add(m); });
  // the street, the sidewalks, the kerbs
  const road = ntBox(26, 0.1, 1400, ntStd('#3a3a3c', 0.9), NT_CH, 0.0, -820); road.castShadow = false;
  for (const sx of [-1, 1]) { const sw = ntBox(5, 0.18, 1400, ntStd('#8b8780', 0.9), NT_CH + sx * 13, 0.09, -820); sw.castShadow = false; }
  const vesey = ntBox(320, 0.1, 22, ntStd('#3a3a3c', 0.9), 40, 0.0, -180); vesey.castShadow = false;
  const wb = ntBox(22, 0.1, 1200, ntStd('#3a3a3c', 0.9), NT_WB, 0.0, -840); wb.castShadow = false;
  for (const sx of [-1, 1]) { const sw = ntBox(5, 0.18, 1200, ntStd('#8b8780', 0.9), NT_WB + sx * 12.5, 0.09, -840); sw.castShadow = false; }
  // the ground (sidewalk concrete) under everything
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), ntStd('#6d6a65', 0.95, 0, { map: ntTex(ntCanvas(256, 256, (g2, W, H) => { g2.fillStyle = '#9a968f'; g2.fillRect(0, 0, W, H); g2.strokeStyle = 'rgba(40,38,36,0.14)'; g2.lineWidth = 3; for (let k = 0; k <= 4; k++) { g2.beginPath(); g2.moveTo(k * 64, 0); g2.lineTo(k * 64, H); g2.stroke(); g2.beginPath(); g2.moveTo(0, k * 64); g2.lineTo(W, k * 64); g2.stroke(); } })) }));
  gnd.material.map.repeat.set(1250, 1250); gnd.rotation.x = -Math.PI / 2; gnd.position.y = 0.012; gnd.receiveShadow = true; scene.add(gnd);
  // the stairs up out of the concourse by 5 WTC (you come up them): 24 risers in a concrete well, rails
  const stM = ntStd('#8e8a84', 0.85), wlM = ntStd('#a29d94', 0.9);
  for (let k = 0; k < 24; k++) ntBox(3.2, 0.167, 0.32, stM, 140, -4 + k * 0.167 + 0.083, -158 - k * 0.32);
  ntBox(3.6, 0.1, 3, stM, 140, -4.05, -156.6);
  for (const sx of [-1, 1]) { ntBox(0.25, 4.6, 11, wlM, 140 + sx * 1.75, -2.3, -161.5); ntBox(0.06, 0.06, 8.2, ntStd('#3a3c3e', 0.4, 0.6), 140 + sx * 1.5, -2.0, -162).rotation.x = -Math.atan2(4, 7.7); }
  ntBox(3.6, 4.6, 0.25, wlM, 140, -2.3, -156.0);
  // parked cars along the kerbs (and their dusty twins for the grey)
  const VF = new VehicleFactory(), cars = [], ash = [];
  const carCols = ['#6a1e22', '#1d2a3a', '#d8d4cc', '#2a2c2e', '#c8b27a', '#3b4a3a'];
  for (let i = 0; i < 18; i++) {
    const type = ['sedan', 'taxi', 'suv', 'van', 'sedan', 'taxi'][i % 6], side = i % 2 ? 1 : -1, z = -200 - i * 34 - (i % 3) * 6;
    const c = VF.build(type, type === 'taxi' ? '#e8b923' : carCols[i % 6]); c.group.position.set(NT_CH + side * 9.2, 0.05, z); c.group.rotation.y = Math.PI / 2 + (side > 0 ? 0 : Math.PI); scene.add(c.group); cars.push(c.group);
    const d = VF.build(type, '#a9a69f'); d.group.position.copy(c.group.position); d.group.rotation.copy(c.group.rotation); d.group.visible = false; scene.add(d.group); ash.push(d.group);
  }
  for (let i = 0; i < 12; i++) {   // (and on West Broadway, already grey when you get there)
    const type = ['sedan', 'taxi', 'van', 'suv'][i % 4], side = i % 2 ? 1 : -1, d = VF.build(type, '#a9a69f');
    d.group.position.set(NT_WB + side * 8.6, 0.05, -640 - i * 41 - (i % 3) * 7); d.group.rotation.y = Math.PI / 2 + (side > 0 ? 0 : Math.PI); d.group.visible = false; scene.add(d.group); ash.push(d.group);
  }
  // ---- the emergency vehicles that filled Vesey and Church Streets by 9:50
  const flash = [], rigs = [];
  function rig(kind, x, z, yaw) {
    const g = new THREE.Group(); g.position.set(x, 0.05, z); g.rotation.y = yaw; scene.add(g); rigs.push(g);
    const lightBar = (y, zz, w) => { for (const [dx, col] of [[-w / 2, '#ff2a1a'], [w / 2, kind === 'police' ? '#2a5cff' : '#fff2e0']]) { const m = new THREE.MeshStandardMaterial({ color: '#300', emissive: col, emissiveIntensity: 0 }); ntBox(w * 0.45, 0.14, 0.28, m, dx * 0.5, y, zz, g); flash.push({ m, ph: hash1(flash.length * 7 + 3) * 6, f: kind === 'police' ? 7.5 : 5.2 }); } };
    if (kind === 'engine' || kind === 'ladder') {
      const red = ntStd('#a51b14', 0.45, 0.2), L = kind === 'ladder' ? 13 : 9.6;
      ntBox(2.5, 2.2, L - 2.6, red, 0, 1.55, -1.3, g); ntBox(2.5, 2.7, 2.6, red, 0, 1.8, L / 2 - 1.3, g);
      ntBox(2.3, 1.0, 0.05, ntStd('#1a2228', 0.15, 0.4), 0, 2.4, L / 2 + 0.01, g); ntBox(2.52, 0.18, L, ntStd('#e8e4da', 0.5), 0, 1.0, 0, g);
      ntBox(2.52, 0.12, L - 2.6, ntStd('#b9bcc0', 0.3, 0.8), 0, 2.7, -1.3, g);
      if (kind === 'ladder') { ntBox(1.0, 0.35, L + 2, ntStd('#c9ccd0', 0.4, 0.7), 0, 3.0, -1.0, g); for (let k = 0; k < 14; k++) ntBox(1.0, 0.05, 0.06, ntStd('#c9ccd0', 0.4, 0.7), 0, 3.2, -L / 2 + k * 1.0, g); }
      for (const sx of [-1, 1]) for (const zz of [L / 2 - 1.4, -L / 2 + 1.6]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 14), ntStd('#141414', 0.8)); w.rotation.z = Math.PI / 2; w.position.set(sx * 1.15, 0.5, zz); g.add(w); }
      lightBar(3.25, L / 2 - 1.0, 1.9);
    } else if (kind === 'ambulance') {
      ntBox(2.3, 2.4, 4.4, ntStd('#ecebe6', 0.5), 0, 1.6, -0.9, g); ntBox(2.1, 1.7, 2.0, ntStd('#ecebe6', 0.5), 0, 1.25, 2.2, g);
      ntBox(2.32, 0.3, 4.42, ntStd('#c4271d', 0.5), 0, 1.5, -0.9, g); ntBox(1.9, 0.7, 0.05, ntStd('#1a2228', 0.15, 0.4), 0, 1.65, 3.21, g);
      for (const sx of [-1, 1]) for (const zz of [2.2, -2.2]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.3, 12), ntStd('#141414', 0.8)); w.rotation.z = Math.PI / 2; w.position.set(sx * 1.0, 0.38, zz); g.add(w); }
      lightBar(2.95, 1.0, 1.6);
    } else {
      const c = VF.build('sedan', '#e9e8e4'); g.add(c.group); c.group.rotation.y = -Math.PI / 2;
      for (const sx of [-1, 1]) ntBox(0.02, 0.12, 4.2, ntStd('#1f3f8a', 0.5), sx * 0.93, 0.78, 0, g);
      lightBar(1.55, -0.1, 1.2);
    }
    return g;
  }
  [['engine', 96, -183, Math.PI / 2], ['ladder', 124, -176.5, -Math.PI / 2], ['ambulance', 152, -184, Math.PI / 2], ['police', 166, -177.5, -Math.PI / 2],
   ['engine', 179.5, -238, 0], ['police', 191, -214, Math.PI], ['ambulance', 190.5, -262, Math.PI], ['police', 178.5, -286, 0], ['engine', 60, -184, Math.PI / 2]]
    .forEach(([k, x, z, yaw]) => rig(k, x, z, yaw));
  const lit = new Set(flash.map((f) => f.m)), paint = [];
  for (const g of rigs) g.traverse((o) => { if (o.isMesh && o.material && o.material.color && !lit.has(o.material) && !paint.some((q) => q.m === o.material)) paint.push({ m: o.material, c0: o.material.color.clone() }); });
  const ashC = new THREE.Color('#a9a69f');
  // paper on the ground (it had been falling for an hour), and grit
  const NGP = 900, gpap = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.24, 0.3), new THREE.MeshStandardMaterial({ color: '#e7e4dc', roughness: 0.95, side: THREE.DoubleSide }), NGP);
  { const _mm = new THREE.Matrix4(), _qq = new THREE.Quaternion(), _ee = new THREE.Euler();
    for (let i = 0; i < NGP; i++) { const h = hash1(i * 71 + 5), h2 = hash1(i * 73 + 6), h3 = hash1(i * 79 + 7); const onV = i % 3 === 0;
      const x = onV ? 60 + h * 150 : NT_CH + (h - 0.5) * 34, z = onV ? -170 - h2 * 24 : -185 - Math.pow(h2, 1.3) * 160;
      _ee.set(-Math.PI / 2 + (h3 - 0.5) * 0.3, h3 * 6.28, 0); _qq.setFromEuler(_ee); _mm.compose(new THREE.Vector3(x, 0.07 + 0.12 * h3, z), _qq, new THREE.Vector3(1, 1, 1)); gpap.setMatrixAt(i, _mm); } }
  gpap.receiveShadow = true; scene.add(gpap);
  // ---- smoke, fire, the dust clouds, paper
  const puffs = ntPuffs(scene, 9000), fire = ntPuffs(scene, 300, { additive: true }), near = ntPuffs(scene, 2400), flakes = ntPuffs(scene, 1600, { additive: false });
  const smoke = ntSmokeSources().map((s) => Object.assign({}, s, { life: 70 }));
  const NPAP = 1400, paper = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.22, 0.28), new THREE.MeshStandardMaterial({ color: '#efece4', roughness: 0.9, side: THREE.DoubleSide }), NPAP);
  paper.frustumCulled = false; scene.add(paper);
  // ---- people: on the street (normal colours) and, after the cloud, the grey ones
  const crowd = Array.from({ length: 16 }, (_, i) => ntPerson(scene, 'st' + i, NT_LOOKS[(i * 7 + 5) % NT_LOOKS.length]));
  const grey = Array.from({ length: 10 }, (_, i) => ntPerson(scene, 'gr' + i, ['ntAsh1', 'ntAsh2', 'ntAsh3', 'ntAsh4'][i % 4]));
  const ves = Array.from({ length: 14 }, (_, i) => ntPerson(scene, 'sv' + i, NT_LOOKS[(i * 5 + 2) % NT_LOOKS.length]));
  const watch = Array.from({ length: 12 }, (_, i) => ntPerson(scene, 'sw' + i, i % 3 === 2 ? ['ntAsh1', 'ntAsh2', 'ntAsh3', 'ntAsh4'][i % 4] : NT_LOOKS[(i * 11 + 3) % NT_LOOKS.length]));
  const cop = ntPerson(scene, 'stcop', 'ntNYPD');
  const cam = S.camera;
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1);

  // the towers coming down: the body is cut at the falling top; the cloud grows round the front and spreads
  const tS = NT.roar + 1.2, tN = NT.fall + 0.6, DUR_S = 10, DUR_N = 10.5;
  function towerTop(T, m, t, t0, dur) {
    const drop = ntDropAt(t, t0, T.roof, dur), top = T.roof - drop;
    const hb = Math.max(0.01, top - 22);
    m.body.scale.y = hb / (T.roof - 22); m.body.position.y = 22 + hb / 2;
    m.g.children.forEach((c) => { if (c !== m.body && c.position.y > 22 && !m.ant.includes(c)) c.visible = c.position.y < top; });
    // (the North Tower's antenna started down first, into the roof: the core went before the walls)
    const ad = ntDropAt(t, t0 - 0.9, T.roof, dur * 0.92);
    for (const a of m.ant) { a.position.y = a.userData.y0 - ad; a.visible = a.position.y + (a === m.ant[0] ? 55 : 1.3) > top + 1; }
    m.g.visible = top > 3;
    return top;
  }
  // the collapse cloud of a tower, as the photographs show it: dust bursting out at the falling front and never rising
  // above where it was born (no mushroom), small and sharp up high, sinking and billowing wider below (the skirt), dark
  // debris arcing out ahead of it with dust trailing; at the foot, a ground cloud rolling out between the buildings
  function collapseCloud(P, t, T, t0, k, dur) {
    const a = t - t0; if (a < 0) return;
    const hw = T.w / 2, fade = 1 - MathX.smooth(a, 16, 32), top = T.roof - ntDropAt(t, t0, T.roof, dur);   // (it drifts off south-east, away from you)
    // the collar: the front itself was never seen, only the dust bursting out round it, boiling
    if (top > 6) for (let i = 0; i < 170; i++) {
      const h = hash1(i * 43 + 5 + T.x), h2 = hash1(i * 47 + 6), h3 = hash1(i * 53 + 7), ang = h * 6.2832 + 0.4 * noise1(t * 0.5 + i, 8);
      const r = hw * (0.15 + 1.25 * Math.sqrt(h2)) + 6 * MathX.smooth(a, 0, 2), y = top + (h3 - 0.6) * 40 + 4 * noise1(t * 0.9 + i, 6);
      const sz = 18 + 22 * h3 + 10 * MathX.smooth(a, 0, 3), c = h2 > 0.8 ? 0.34 : 0.13 + 0.09 * h3;
      P.add(T.x + Math.cos(ang) * r, Math.max(sz * 0.4, y), T.z + Math.sin(ang) * r, sz, 1.0 * k * MathX.smooth(a, 0, 0.5), c, c * 0.93, c * 0.84);
    }
    for (let i = 0; i < 1100; i++) {
      const h = hash1(i * 7 + 1 + T.x), h2 = hash1(i * 11 + 2), h3 = hash1(i * 13 + 3);
      const born = h * (dur + 1.5), b = a - born; if (b < 0) continue;
      const y0 = Math.max(10, T.roof - ntDropAt(born, 0, T.roof, dur)), low = 1 - y0 / T.roof;
      const ang = h2 * 97.3, out = hw + 3 + (12 + 18 * h3) * 2.5 * (1 - Math.exp(-b / 2.5)) + b * (1 + 2 * low);
      const sz = 10 + 10 * h3 + b * (4 + 3 * h3) * (1 + low);
      // (some of it hangs where it was born; most of it comes down with the debris: the skirt)
      let y = h2 < 0.3 ? y0 - b * 1.5 : y0 - b * (7 + 10 * h2) - 1.4 * b * b;
      y = Math.max(sz * 0.4, Math.min(y + 4 * Math.sin(b * 0.3 + i), y0 + 4 - sz * 0.3, T.roof + 6 - sz * 0.4));
      const c = h3 < 0.72 ? 0.12 + 0.1 * h3 : 0.3 + 0.12 * h3;    // (grey-brown concrete and gypsum dust, a few sunlit tops)
      P.add(T.x + Math.cos(ang) * out + NT_WIND[0] * b * 1.1, y, T.z + Math.sin(ang) * out + NT_WIND[2] * b * 1.1, sz, 0.95 * k * MathX.smooth(b, 0, 0.5) * fade, c, c * 0.93, c * 0.84);
    }
    // the debris: pieces of the outer wall thrown out and falling, each with a dust trail
    for (let i = 0; i < 250; i++) {
      const h = hash1(i * 17 + 9 + T.x), h2 = hash1(i * 19 + 4), h3 = hash1(i * 23 + 5);
      const born = h * dur * 0.9, b = a - born; if (b < 0 || b > 7) continue;
      const y0 = Math.max(30, T.roof - ntDropAt(born, 0, T.roof, dur)), ang = h2 * 61.7, v = 12 + 20 * h3;
      for (let j = 0; j < 13; j++) {   // (a dark piece at the head, its pale dust streaming out behind it: the willow)
        const bj = b - j * 0.22; if (bj < 0) break;
        const r = hw + v * bj, y = y0 + 2 * bj - 4.9 * bj * bj; if (y < 15) continue;
        const c = j === 0 ? 0.06 : 0.15 + 0.012 * j;
        P.add(T.x + Math.cos(ang) * r, y, T.z + Math.sin(ang) * r, 4 + j * 2.8, 0.85 * k * (1 - j / 14) * (1 - MathX.smooth(b, 5, 7)), c, c * 0.95, c * 0.88);
      }
    }
    // the ground cloud: from the foot, rolling out and up between the buildings
    if (a > dur * 0.55) for (let i = 0; i < 420; i++) {
      const h = hash1(i * 29 + 3 + T.x), h2 = hash1(i * 31 + 8), h3 = hash1(i * 37 + 2);
      const b = a - dur * 0.55 - h * 6; if (b < 0) continue;
      const ang = h2 * Math.PI * 2, out = hw + 10 + b * (9 + 8 * h3) * Math.exp(-b / 30), sz = 25 + 18 * h3 + b * 4;
      const y = sz * 0.4 + Math.pow(h3, 1.4) * (30 + b * 5), c = 0.2 + 0.08 * h3;
      P.add(T.x + Math.cos(ang) * out + NT_WIND[0] * b * 0.4, y, T.z + Math.sin(ang) * out + NT_WIND[2] * b * 0.4, sz, 0.5 * k * MathX.smooth(b, 0, 2) * fade, c, c * 0.93, c * 0.85);
    }
  }
  // the surge up Church Street: a rolling wall, its front at zf (m) by the time t; ~ 14 m/s, slowing
  // (it reaches the corner as the shot cuts into it; after that it rolls on north)
  const roarZ = (t) => { const run = MathX.smooth(t, NT.run, NT.run + 1.4); return Math.min(-212, -212 - run * (t - NT.run + 0.3) * 3.0); };
  const surgeFront = (t) => { const a = t - (tS + 2), A = NT.cloud - (tS + 2), z1 = roarZ(NT.cloud) + 14; return a < 0 ? 200 : a < A ? 60 + (z1 - 60) * Math.pow(a / A, 0.9) : z1 - (a - A) * 6; };

  const nightAt = (t, s) => (s.mode === 'cloud' || s.mode === 'grey') ? MathX.smooth(t, NT.cloud + 3.5, NT.cloud + 6.5) * (1 - MathX.smooth(t, NT.grey - 0.6, NT.grey + 6)) : 0;
  function view(t, s) {
    const u = (a, b) => MathX.clamp((t - a) / (b - a), 0, 1);
    switch (s.mode) {
      case 'five': {
        const k = u(NT.five, NT.back), c = MathX.clamp(k / 0.34, 0, 1);
        // (the climb: 24 steps in the first third, a step bob; then out onto Vesey and east to Church Street)
        const P = k < 0.34 ? [140 + 0.3 * Math.sin(k * 9), -4 + 4 * Ease.inOutSine(c), -157.4 - 8.8 * c] : ntSpline([[0.34, 140.3, 0, -166.2], [0.52, 149, 0, -172], [0.74, 167, 0, -183.5], [1, NT_CH - 2, 0, -203]], k);
        const bob = k < 0.34 ? 0.05 * Math.abs(Math.sin(c * 24 * Math.PI)) : 0;
        const Q = ntV(ntV([140, 1.2, -172], [140, 3.5, -172], 1 - c), ntSpline([[0.3, 146, 1.6, -176], [0.55, 168, 1.6, -184], [0.8, NT_CH, 1.6, -215], [1, NT_CH - 3, 1.6, -262]], k), MathX.smooth(k, 0.26, 0.44));
        return [[P[0], P[1] + 1.6 + bob, P[2]], Q, 60];
      }
      case 'back': { const k = u(NT.back, NT.roarShot); return [[NT_CH - 7, 1.6, -206 - 4 * k], ntV([NT_CH - 3, 1.5, -330], [20, 215 + 30 * k, 50], Ease.inOutSine(MathX.smooth(k, 0, 0.16))), 64]; }
      case 'roar': { const run = MathX.smooth(t, NT.run, NT.run + 1.4); return [[NT_CH - 7 + 4 * run, 1.6, roarZ(t)], ntV([52, 240 - 110 * Ease.inOutSine(MathX.smooth(t, NT.roar + 1.2, NT.roar + 9)), 128], [NT_CH - 5, 9, -90], run), 50 + 8 * run]; }
      case 'cloud': { const z = -262 - (t - NT.cloud) * 1.2; return [[NT_CH - 2, 1.55, z], [NT_CH - 1, 1.4, z - 10], 62]; }
      case 'grey': { const k = u(NT.grey, NT.walk), z = -280 - k * 9; return [[NT_CH - 3 + 1.5 * k, 1.6, z], [NT_CH - 7 + 9 * Ease.inOutSine(k), 2.5 + 7 * MathX.smooth(k, 0.35, 1), z - 30], 60]; }
      case 'walk': { const k = u(NT.walk, NT.fallShot), z = -760 - k * 7, look = Ease.inOutSine(MathX.smooth(k, 0.32, 0.6)), yaw = Math.PI * 0.97 * look, pitch = Math.atan2(208, -z) * look; return [[NT_WB + 3, 1.6, z], [NT_WB + 3 - Math.sin(yaw) * Math.cos(pitch) * 100, 1.6 + Math.sin(pitch) * 100, z - Math.cos(yaw) * Math.cos(pitch) * 100], 56]; }
      case 'fall': return [[NT_WB + 4, 1.6, -1080], [0, 196, 0], 31];
    }
    return [[NT_CH, 1.6, -300], [0, 100, 0], 60];
  }

  return {
    scene, camera: cam,
    cuts() { return []; },
    frame(t, s) {
      const [p, at, fov] = view(t, s);
      // the light bars flash on (fire engines red/white, police red/blue); after the cloud, the dust greys the paint
      for (const f of flash) f.m.emissiveIntensity = Math.sin(t * f.f + f.ph) > 0.1 ? 2.4 : 0.05;
      const dusty = t > NT.cloud + 1;
      for (const q of paint) q.m.color.copy(q.c0).lerp(ashC, dusty ? 0.8 : 0);
      // inside the cloud: near-black for a few seconds ("day turns to night"), then the grey lifts slowly
      const night = nightAt(t, s);
      const run = s.mode === 'roar' ? MathX.smooth(t, NT.run, NT.run + 1.4) : 0;
      const rumble = MathX.smooth(t, tS - 0.5, tS + 2) * (1 - MathX.smooth(t, tS + 14, tS + 20)) + MathX.smooth(t, tN, tN + 2) * (1 - MathX.smooth(t, tN + 13, tN + 18)) * 0.35;
      const d = ntDrift(t, 0.015 + 0.03 * run, 0.5 + run, 31), shk = [noise1(t * 21, 1) * 0.02 * rumble, noise1(t * 23, 2) * 0.02 * rumble + Math.abs(Math.sin(t * 9)) * 0.05 * run];
      ntCam(cam, [p[0] + d[0] + shk[0], p[1] + d[1] + shk[1], p[2] + d[2]], at, fov, 0.6 * noise1(t * 0.4, 5) + 1.2 * run * Math.sin(t * 4.5));
      // the towers
      const sTop = towerTop(NT_TW.S, SO, t, tS, DUR_S), nTop = towerTop(NT_TW.N, N, t, tN, DUR_N);
      // smoke, fire; after 9:59 the dust over everything
      puffs.begin(); fire.begin();
      for (const src of smoke) {
        src.stop = src.tower === 'S' ? tS + 1.5 : tN + 1.5;
        ntPlume(puffs, t, src, { fire: t < src.stop ? fire : null, alpha: 1.6 });
      }
      collapseCloud(puffs, t, NT_TW.S, tS, 1, DUR_S);
      collapseCloud(puffs, t, NT_TW.N, tN, 1.1, DUR_N);
      puffs.end(); fire.end();
      // the surge at street level (Church Street): a rolling grey-brown wall, and inside it, thick dark dust
      near.begin();
      const zf = surgeFront(t);
      // (a rolling wall as tall as the buildings, densest at its front, grey-brown)
      if (t > tS + 2) for (let i = 0; i < 1400; i++) {
        const h = hash1(i * 17 + 1), h2 = hash1(i * 19 + 2), h3 = hash1(i * 23 + 3);
        const z = zf + Math.pow(h, 1.8) * 140, x = NT_CH + (h2 - 0.5) * 46, y = 1 + Math.pow(h3, 1.2) * (34 + (z - zf) * 0.4), sz = 7 + h3 * 12 + (z - zf) * 0.06;
        const c = 0.3 + 0.13 * h2 - 0.08 * Math.max(0, 1 - (y / 30));
        near.add(x + noise1(t * 0.3 + i, 2) * 3, y + Math.sin(t * 0.8 + i) * 1.5, z - 3 * Math.abs(noise1(t * 0.6 + i, 9)), sz, 0.75 * MathX.smooth(t, tS + 2, tS + 4), c, c * 0.94, c * 0.85);
      }
      // the dark inside, then the slow settling (the grey)
      const inside = s.mode === 'cloud' ? 1 : s.mode === 'grey' ? 1 - MathX.smooth(t, NT.grey, NT.grey + 8) * 0.7 : s.mode === 'walk' ? 0.06 : 0;
      if (inside > 0) for (let i = 0; i < 700; i++) {
        const h = hash1(i * 29 + 5), h2 = hash1(i * 31 + 6), h3 = hash1(i * 37 + 7), R = 2 + h * 40;
        const x = cam.position.x + (h2 - 0.5) * R * 2, z = cam.position.z - 2 - h * 45, y = 0.3 + h3 * 9;
        const c = MathX.lerp(s.mode === 'cloud' ? 0.38 + 0.1 * h3 : 0.66 + 0.06 * h3, 0.03 + 0.02 * h3, night);
        near.add(x + noise1(t * 0.2 + i, 3) * 2, y, z, 3 + h3 * 6, (s.mode === 'cloud' ? 0.28 + 0.25 * night : 0.12 + 0.3 * night) * inside, c, c * 0.95, c * 0.88);
      }
      near.end();
      // flakes of ash and paper drifting down (the grey)
      flakes.begin();
      const ashK = s.mode === 'cloud' ? 1 : s.mode === 'grey' ? 1 : s.mode === 'walk' ? 0.6 : s.mode === 'fall' ? 0.3 : 0;
      if (ashK > 0) for (let i = 0; i < 1200; i++) {
        const h = hash1(i * 41 + 9), h2 = hash1(i * 43 + 10), h3 = hash1(i * 47 + 11), per = 9 + h * 6, a = ((t + h2 * per) % per) / per;
        { const fc = 0.86 * (1 - 0.85 * nightAt(t, s)); flakes.add(cam.position.x + (h - 0.5) * 30, 12 - a * 12 + Math.sin(t + i) * 0.2, cam.position.z - 1 - h3 * 30, 0.02 + 0.03 * h2, 0.75 * ashK, fc, fc * 0.98, fc * 0.94); }
      }
      flakes.end();
      const pK = s.mode === 'grey' ? MathX.smooth(t, NT.grey, NT.grey + 3) : s.mode === 'walk' ? 0.4 : s.mode === 'back' || s.mode === 'five' ? 0.25 : 0;
      for (let i = 0; i < NPAP; i++) {
        const h = hash1(i * 53 + 1), h2 = hash1(i * 59 + 2), h3 = hash1(i * 61 + 3), per = 14 + h * 10, a = ((t + h2 * per) % per);
        if (pK > 0 && i < NPAP * pK) { _p.set(cam.position.x + (h - 0.5) * 40 + Math.sin(a * 0.6 + i) * 2, 22 - a * (22 / per), cam.position.z - 1.5 - Math.pow(h3, 1.3) * 45); _e.set(a * 1.3 + i, a * 0.8, Math.sin(a * 1.7 + i)); _q.setFromEuler(_e); }
        else _p.set(0, -999, 0);
        _m.compose(_p, _q, _s); paper.setMatrixAt(i, _m);
      }
      paper.instanceMatrix.needsUpdate = true;
      // after the cloud, the street is grey
      const g = t > NT.cloud + 1;
      cars.forEach((c) => (c.visible = !g)); ash.forEach((c) => (c.visible = g));
      // people
      crowd.forEach((pp, i) => {
        if (g || s.mode === 'fall') { pp.root.visible = false; return; }
        const h = hash1(i * 7 + 2), side = (h - 0.5) * 22, z0 = -175 - i * 9 - h * 5;
        let z = z0 - (t - NT.five) * 1.1, act = 'walk', ph = (t - NT.five) * 1.1 / 1.32 * Math.PI * 2 + i;
        if (s.mode === 'back' && i % 3 === 0) { act = i % 2 ? 'ntLookUp' : 'ntLookBack'; z = z0 - (NT.back - NT.five) * 1.1; }
        if (s.mode === 'roar') { const rr = MathX.smooth(t, tS + 1.5 + h, tS + 3 + h); z = z0 - (NT.roarShot - NT.five) * 1.1 - Math.max(0, t - tS - 1.5 - h) * 4.2 * rr; act = rr > 0.3 ? 'jog' : 'ntLookBack'; ph = -z / 1.6 * Math.PI * 2; }
        ntPlace(pp, NT_CH + side, 0.15, z, 0, act, t + i, ph);
      });
      grey.forEach((pp, i) => {
        if (!g || s.mode === 'fall') { pp.root.visible = false; return; }
        const h = hash1(i * 13 + 4), wb = s.mode === 'walk', v = 0.75 + 0.3 * h, z = (wb ? -768 : -283) - i * 4 - (t - (wb ? NT.walk : NT.grey)) * v;
        const x = (wb ? NT_WB + 3 : NT_CH - 2) + (i % 2 ? 1 : -1) * (1.6 + 6 * h);
        ntPlace(pp, x, wb ? 0.1 : 0.15, z, 0, i % 3 ? 'walk' : 'ntCover', t + i, -z / 1.32 * Math.PI * 2);
      });
      // on Vesey: people coming out behind and ahead of you, east along the sidewalks, round the corner, north
      ves.forEach((pp, i) => {
        if (g || !(s.mode === 'five' || s.mode === 'back' || s.mode === 'roar')) { pp.root.visible = false; return; }
        const h = hash1(i * 23 + 7), v = 1.15 + 0.3 * h, zV = i % 2 ? -171.5 + h : -188.5 - h, xc = NT_CH - 9 + 3 * h;
        const d = i * 9 + h * 5 + (t - NT.five) * v + Math.max(0, t - tS - 1.5 - h) * 2.2 * v, x = 104 + d;
        if (x < xc) ntPlace(pp, x, 0.05, zV, -Math.PI / 2, 'walk', t + i, d / 1.32 * Math.PI * 2);
        else ntPlace(pp, xc, 0.15, zV - (x - xc), 0, s.mode === 'roar' && t > tS + 2 + h ? 'jog' : 'walk', t + i, d / 1.32 * Math.PI * 2);
      });
      if (s.mode === 'five' || s.mode === 'back') ntPlace(cop, NT_CH - 7, 0.15, -192, -2.2, 'ntWave', t); else cop.root.visible = false;
      // 10:28, on West Broadway: people walking north stop and turn round (they see it before they hear it)
      watch.forEach((pp, i) => {
        if (s.mode !== 'fall') { pp.root.visible = false; return; }
        const h = hash1(i * 31 + 5), h2 = hash1(i * 37 + 1), x = i === 0 ? NT_WB + 3.2 : NT_WB + (i % 2 ? 1 : -1) * (2 + 8.5 * h), z0 = i === 0 ? -1062 : -1058 + i * 4.2 + h2 * 3;
        if (i % 3 === 0) { ntPlace(pp, x, 0.1, z0, Math.PI + (h2 - 0.5) * 0.4, 'ntWatch', t + i, 0, 'ntGasp', i % 2 === 0 ? MathX.smooth(t, tN + 1.2 + h, tN + 2.2 + h) : 0); return; }
        const stop = tN + 0.5 + h * 1.6, wk = Math.min(t, stop) - NT.fallShot, z = z0 - wk * (1.1 + 0.2 * h2), turn = MathX.smooth(t, stop, stop + 1.1);
        ntPlace(pp, x, 0.1, z, MathX.lerp(0, Math.PI + (h2 - 0.5) * 0.5, turn), 'walk', t + i, wk * 1.15 / 1.32 * Math.PI * 2, i % 4 === 1 ? 'ntGasp' : 'ntWatch', turn);
      });
      // (nobody walks through the lens)
      const guard = s.mode === 'roar' ? 2.2 : 1.4;   // (looking up at the towers: a head just in front fills the bottom of the frame)
      for (const pp of [...crowd, ...grey, ...ves, cop]) if (pp.root.visible && Math.hypot(pp.root.position.x - cam.position.x, pp.root.position.z - cam.position.z) < guard) pp.root.visible = false;
      // the light: the sun goes behind the dust
      const dark = s.mode === 'cloud' ? 1 : s.mode === 'grey' ? 1 - 0.6 * MathX.smooth(t, NT.grey, NT.grey + 9) : s.mode === 'walk' || s.mode === 'fall' ? 0.3 : s.mode === 'roar' ? 0.55 * MathX.smooth(t, NT.cloud - 2.2, NT.cloud) : 0;
      S.sun.intensity = 2.8 * (1 - 0.9 * dark); S.hemi.intensity = 0.8 * (1 - 0.6 * dark);
      scene.fog.color.setRGB(MathX.lerp(0.79 - 0.4 * dark, 0.022, night), MathX.lerp(0.84 - 0.43 * dark, 0.021, night), MathX.lerp(0.89 - 0.5 * dark, 0.019, night));
      S.hemi.intensity *= 1 - 0.75 * night; S.sun.intensity *= 1 - 0.9 * night;
      scene.fog.density = 0.0004 + 0.09 * (s.mode === 'cloud' ? 1 : 0) + (s.mode === 'grey' ? 0.04 * (1 - MathX.smooth(t, NT.grey, NT.grey + 9)) + 0.004 : 0) + (s.mode === 'walk' ? 0.0001 : 0) + (s.mode === 'roar' ? 0.006 * MathX.smooth(t, NT.cloud - 2.2, NT.cloud) : 0);
      scene.background.setRGB(MathX.lerp(0.44 - 0.2 * dark, 0.02, night), MathX.lerp(0.62 - 0.35 * dark, 0.019, night), MathX.lerp(0.82 - 0.5 * dark, 0.017, night));

      sky.material.uniforms.k.value = (1 - 0.75 * dark) * (1 - 0.97 * night);
    },
    grade(t, p, s) {
      p.exposure = 1.0; p.saturation = 0.98; p.contrast = 1.04; p.warmth = 0.03; p.bloom = 0.3; p.bloomThreshold = 0.9; p.vignette = 0.5; p.grain = 0.032;
      if (s.mode === 'cloud' || s.mode === 'grey') { p.exposure -= 0.35 * nightAt(t, s); }
      if (s.mode === 'cloud') { p.saturation = 0.35; p.exposure -= 0.2; p.vignette = 0.8; p.grain = 0.06; p.warmth = 0.06; }
      if (s.mode === 'grey') { p.saturation = 0.25 + 0.15 * MathX.smooth(t, NT.grey, NT.walk); p.exposure -= 0.08; p.grain = 0.045; }
      if (s.mode === 'walk' || s.mode === 'fall') { p.saturation = 0.55; p.grain = 0.04; }
      if (s.mode === 'roar') { const k = MathX.smooth(t, NT.cloud - 2.2, NT.cloud); p.saturation = 0.98 - 0.5 * k; p.exposure = 1 - 0.2 * k; }
      if (s.mode === 'fall') p.fade = Math.max(p.fade, MathX.smooth(t, NT.out - 1.4, NT.out));
    },
    labels(t) {
      const s = ntShotAt(t), W = StoryHUD.win;
      if (s.mode === 'back') return [
        { p: [0, 330, 0], text: 'THE NORTH TOWER', sub: 'YOUR TOWER', a: W(t, ntCap('back', 1).show, NT.roarShot - 0.3, 0.5, 0.4) },
        { p: [NT_TW.S.x, 300, NT_TW.S.z], text: 'THE SOUTH TOWER', a: W(t, ntCap('back', 1).show + 0.4, NT.roarShot - 0.3, 0.5, 0.4) },
      ];
      return [];
    },
  };
};
