/* =====================================================================
   HOSPITAL SET — the MRI unit across the river (its own scene): the scanner room, the corridor beside it (the oxygen
   cylinder on its trolley), the hall, the waiting room 10 m away (six people, six phones), the control room.
   The scanner's bore runs along x through (0, 1, 0). MRI physics: physics.js (MGP.mri*, MG_SMALL.cyl, MG_SMALL.wait).
   Cameras: mriRoom, plan (a cutaway from above, the roofs off), corridor, burst, water, waiting.
   ===================================================================== */

const MG_H = {
  c: [0, 1.0, 0],                 // the bore's centre
  boreR: 0.32, half: 0.86,        // the bore's radius, the scanner's half-length (x)
  wallH: 2.8, th: 0.12,
  west: -3.56,                    // the stud wall between the corridor and the scanner room (its centre: physics' 3.55 m)
  room: { x: [-3.5, 3.5], z: [-3.5, 3.5] },
  ctrl: { x: [3.62, 7.4], z: [-3.5, 0.8] },
  corr: { x: [-5.66, -3.62], z: [-9, 3.5] },
  hall: { x: [-5.66, 7.4], z: [3.62, 6.08] },
  wait: { x: [-4.2, 6.2], z: [6.2, 13.6] },
  cup: [0.18, 2.0, 0.12],          // the cup of water on top of the scanner
  cyl0: [-4.6, 0.0, 0.0],          // the oxygen cylinder's trolley
  // the waiting room's phones: [x, y] (z follows from the distance r0 in MG_SMALL.wait), who holds it, standing?
  phones: [[-1.0, 1.05, 'mgW1'], [2.9, 1.0, 'mgW2'], [-3.0, 1.3, 'mgW3', true], [0.3, 0.95, 'mgW4'], [2.4, 0.8, 'mgW5'], [1.0, 1.0, 'mgW6']],
};

// the water in the cup: it is pushed away from the magnet (water is diamagnetic) harder than it weighs, so it rises
// out of the cup and floats where the push equals its weight (as the frog did at 16 tesla); it overshoots and settles
function mgWaterLift(s) {
  if (s <= 0) return 0;
  const eq = 0.17, w = 7.8, tau = 0.32;
  return eq * (1 - Math.exp(-s / tau) * Math.cos(w * s)) * MathX.smooth(s, 0, 0.04);
}

// a wall along x (at z) or along z (at x) from a to b, with holes [[a0, a1, y0, y1]] → boxes
function mgHWall(axis, at, a, b, holes, mat, th = MG_H.th, H = MG_H.wallH, parent = null) {
  const out = [];
  for (const c of mgWallCells(a, b, 0, H, holes)) {
    const w = c[1] - c[0], h = c[3] - c[2], m = (c[0] + c[1]) / 2, y = (c[2] + c[3]) / 2;
    out.push(axis === 'x' ? mgBox(w, h, th, mat, m, y, at, parent) : mgBox(th, h, w, mat, at, y, m, parent));
  }
  return out;
}

// a wall clock (face toward f: '+x' '-x' '+z' '-z'); update(s) sets the hands to 10:42 + s
function mgWallClock(x, y, z, f, r = 0.16) {
  const g = new THREE.Group(); g.position.set(x, y, z);
  g.rotation.y = { '+z': 0, '-z': Math.PI, '+x': Math.PI / 2, '-x': -Math.PI / 2 }[f];
  MG_KIT_SCENE.add(g);
  const face = mgTex(mgCanvas(256, 256, (c, w) => {
    c.fillStyle = '#f4f2ec'; c.beginPath(); c.arc(128, 128, 124, 0, 6.29); c.fill();
    c.strokeStyle = '#1a1c20'; c.lineWidth = 8; c.stroke();
    c.fillStyle = '#1a1c20'; for (let i = 0; i < 60; i++) { const a = i / 60 * 6.283, L = i % 5 ? 6 : 18, wd = i % 5 ? 2 : 6; c.save(); c.translate(128, 128); c.rotate(a); c.fillRect(-wd / 2, -112, wd, L); c.restore(); }
    void w;
  }), { repeat: false });
  mgCyl(r + 0.012, r + 0.012, 0.035, mgStd('#2a2d33', 0.5, 0.2), 0, 0, 0.0175, g, 32).rotation.x = Math.PI / 2;
  const fm = new THREE.Mesh(new THREE.CircleGeometry(r, 40), new THREE.MeshStandardMaterial({ map: face, roughness: 0.6 })); fm.position.z = 0.036; g.add(fm);
  const hand = (L, w, col, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, L, 0.004), new THREE.MeshStandardMaterial({ color: col, roughness: 0.5 })); m.geometry.translate(0, L / 2 - 0.02, 0); m.position.z = z; g.add(m); return m; };
  const hh = hand(r * 0.55, 0.014, '#1a1c20', 0.041), mh = hand(r * 0.82, 0.009, '#1a1c20', 0.046), sh = hand(r * 0.86, 0.004, '#c8322a', 0.051);
  return { g, update(s) { const sec = 42 * 60 + s; sh.rotation.z = -(sec % 60) / 60 * 6.2832; mh.rotation.z = -((sec / 60) % 60) / 60 * 6.2832; hh.rotation.z = -((10 + sec / 3600) % 12) / 12 * 6.2832; } };
}

// a sign: text lines on a plate (w × h), facing f
function mgSign(lines, w, h, x, y, z, f, o = {}) {
  const px = 512, ph = Math.round(px * h / w);
  const tex = mgTex(mgCanvas(px, ph, (c) => {
    c.fillStyle = o.bg || '#f4f2ec'; c.fillRect(0, 0, px, ph);
    if (o.band) { c.fillStyle = o.band; c.fillRect(0, 0, px, ph * 0.3); }
    let yy = o.band ? ph * 0.22 : ph * 0.3;
    lines.forEach((L, i) => { c.fillStyle = (o.band && i === 0) ? (o.bandInk || '#fff') : (o.ink || '#1a1c20'); c.font = `${L[1] || 700} ${L[0]}px Arial`; c.textAlign = 'center'; c.fillText(L[2], px / 2, yy); yy += L[0] * 1.35 + (o.band && i === 0 ? ph * 0.12 : 0); });
    if (o.tri) { c.fillStyle = '#f2c21a'; c.strokeStyle = '#1a1c20'; c.lineWidth = 10; c.beginPath(); c.moveTo(70, ph * 0.12); c.lineTo(130, ph * 0.55); c.lineTo(10, ph * 0.55); c.closePath(); c.fill(); c.stroke(); }
  }), { repeat: false });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.012), [mgStd('#d8d6d0'), mgStd('#d8d6d0'), mgStd('#d8d6d0'), mgStd('#d8d6d0'), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }), mgStd('#d8d6d0')]);
  m.position.set(x, y, z); m.rotation.y = { '+z': 0, '-z': Math.PI, '+x': Math.PI / 2, '-x': -Math.PI / 2 }[f];
  MG_KIT_SCENE.add(m); return m;
}

// a plastic waiting-room chair (seat 0.46 high), facing yaw
function mgChair(x, z, yaw, col) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = yaw; MG_KIT_SCENE.add(g);
  const p = mgStd(col, 0.55), f = mgStd('#3a3d42', 0.4, 0.5);
  mgBox(0.46, 0.04, 0.44, p, 0, 0.45, 0, g);
  const bk = mgBox(0.46, 0.42, 0.035, p, 0, 0.7, -0.22, g); bk.rotation.x = -0.1;
  for (const [a, b] of [[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.18], [0.2, 0.18]]) mgBox(0.025, 0.43, 0.025, f, a, 0.215, b, g);
  return g;
}

MG_SETS.mri = (app) => {
  const S = mgSet(app, { sky: '#20242a', fov: 50, near: 0.03, far: 200, sun: [2.5, 9, 3.5], sunColor: '#f4f0ea', sunI: 0.8, shadow: 2048, shadowR: 12, shadowFar: 40,
    hemi: ['#dfe6ee', '#6a6458', 0.62], env: ['#b8c0c8', '#8a8a86', '#4a4842'] });
  const scene = S.scene, cam = S.camera, H = MG_H, C = H.c;
  S.sun.shadow.bias = -0.0003; S.sun.shadow.normalBias = 0.02;
  const out = { scene, camera: cam, roofs: [] };

  // ---- floors
  const vinyl = (base, seed) => mgTex(mgCanvas(512, 512, (c, w) => {
    const r = new RNG(seed); c.fillStyle = base; c.fillRect(0, 0, w, w);
    for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(${r.next() < 0.5 ? '255,255,255' : '0,0,0'},${r.range(0.02, 0.07)})`; c.fillRect(r.range(0, w), r.range(0, w), r.range(1, 4), r.range(1, 4)); }
    c.strokeStyle = 'rgba(0,0,0,0.06)'; c.lineWidth = 2; for (let x = 0; x <= w; x += 256) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, w); c.stroke(); c.beginPath(); c.moveTo(0, x); c.lineTo(w, x); c.stroke(); }
  }));
  const floor = (x0, x1, z0, z1, tex, rep) => { const t = tex.clone(); t.needsUpdate = true; t.repeat.set((x1 - x0) / rep, (z1 - z0) / rep); const m = mgPlane(x1 - x0, z1 - z0, new THREE.MeshStandardMaterial({ map: t, roughness: 0.55 }), (x0 + x1) / 2, 0, (z0 + z1) / 2, '+y'); return m; };
  const vRoom = vinyl('#b9c6cc', 3), vCorr = vinyl('#c9c2b4', 5), vWait = vinyl('#c4bba8', 7), vCtrl = vinyl('#9aa4aa', 9);
  floor(H.room.x[0], H.room.x[1], H.room.z[0], H.room.z[1], vRoom, 2.4);
  floor(H.corr.x[0], H.corr.x[1], H.corr.z[0], H.corr.z[1] + 0.12, vCorr, 2.4);
  floor(H.hall.x[0], H.hall.x[1], H.hall.z[0] - 0.12, H.hall.z[1], vCorr, 2.4);
  floor(H.wait.x[0], H.wait.x[1], H.wait.z[0], H.wait.z[1], vWait, 2.4);
  floor(H.ctrl.x[0], H.ctrl.x[1], H.ctrl.z[0], H.ctrl.z[1], vCtrl, 2.4);
  // the base under everything (dark, below the floors: the plan view's surround)
  mgBox(40, 0.2, 40, mgStd('#3a3d40', 0.9), 1, -0.105, 2);
  // a guide line down the corridor
  mgPlane(0.08, H.corr.z[1] - H.corr.z[0], new THREE.MeshStandardMaterial({ color: '#2f6a9a', roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), -4.95, 0.004, (H.corr.z[0] + H.corr.z[1]) / 2, '+y');

  // ---- walls
  const wallM = mgStd('#d8d6d0', 0.85), wallW = mgStd('#d8ceb8', 0.85), wallC = mgStd('#c8d2d6', 0.85);
  const T = H.th, h2 = T / 2;
  // the scanner room: north, east (the control window), south (the door), west (the stud wall: built from pieces)
  mgHWall('x', H.room.z[0] - h2, H.room.x[0] - T, H.room.x[1] + T, [], wallM);
  mgHWall('z', H.room.x[1] + h2, H.room.z[0], H.room.z[1], [[-2.7, -0.4, 0.95, 2.05]], wallM);
  mgHWall('x', H.room.z[1] + h2, H.room.x[0] - T, H.room.x[1] + T, [[1.3, 2.5, 0, 2.15]], wallM);
  // the stud wall: solid around a 1.1 × 1.2 panel of plasterboard pieces that the cylinder punches through
  const hole = { z: [-0.55, 0.55], y: [0.35, 1.55] };
  {
    const cells = mgWallCells(H.room.z[0], H.room.z[1], 0, H.wallH, [[hole.z[0], hole.z[1], hole.y[0], hole.y[1]]]);
    for (const c of cells) mgBox(T, c[3] - c[2], c[1] - c[0], wallM, H.west, (c[2] + c[3]) / 2, (c[0] + c[1]) / 2);
  }
  const N = 6, M = 6, pw = (hole.z[1] - hole.z[0]) / N, ph = (hole.y[1] - hole.y[0]) / M;
  const chunkG = new THREE.BoxGeometry(T, ph, pw);
  const chunks = new THREE.InstancedMesh(chunkG, wallM, N * M); chunks.castShadow = chunks.receiveShadow = true; scene.add(chunks);
  const CH = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) {
    const z = hole.z[0] + (i + 0.5) * pw, y = hole.y[0] + (j + 0.5) * ph, r = mgRand(i * 17 + j * 5 + 3);
    const d = Math.hypot(z / 0.5, (y - 0.95) / 0.55);
    CH.push({ z, y, fly: d < 1.0 + 0.25 * (r() - 0.5), vx: 4 + 8 * r() * (1.2 - d), vy: 1.0 + 3 * r(), vz: (z) * 6 * r() + (r() - 0.5) * 2, spin: [r() * 20 - 10, r() * 20 - 10, r() * 20 - 10], rest: 0 });
  }
  // the corridor (its west wall, its ends), the hall, the waiting room, the control room
  mgHWall('z', H.corr.x[0] - h2, H.corr.z[0], H.hall.z[1] + T, [], wallC);
  mgHWall('x', H.corr.z[0] - h2, H.corr.x[0] - T, H.corr.x[1], [], wallC);
  mgHWall('z', H.west, H.corr.z[0], H.room.z[0] - T, [[-6.2, -5.0, 0, 2.15]], wallC);
  mgHWall('x', H.hall.z[1] + h2, H.hall.x[0] - T, H.hall.x[1] + T, [[-3.4, -2.2, 0, 2.15]], wallW);
  mgHWall('z', H.hall.x[1] + h2, H.ctrl.z[0] - T, H.hall.z[1] + T, [[1.6, 2.6, 0, 2.15]], wallC);
  mgHWall('x', H.ctrl.z[1] + h2, H.ctrl.x[0], H.ctrl.x[1], [[5.4, 6.3, 0, 2.15]], wallM);
  mgHWall('x', H.wait.z[1] + h2, H.wait.x[0] - T, H.wait.x[1] + T, [[-2.8, -0.2, 0.9, 2.3], [1.0, 3.6, 0.9, 2.3]], wallW);
  mgHWall('z', H.wait.x[0] - h2, H.wait.z[0], H.wait.z[1], [], wallW);
  mgHWall('z', H.wait.x[1] + h2, H.wait.z[0], H.wait.z[1], [], wallW);
  // window glass + daylight beyond the waiting room's windows; the control window's glass
  const glass = new THREE.MeshStandardMaterial({ color: '#cfe0ea', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.22, depthWrite: false });
  for (const [a, b] of [[-2.8, -0.2], [1.0, 3.6]]) {
    mgPlane(b - a, 1.4, glass, (a + b) / 2, 1.6, H.wait.z[1] + h2, '-z');
    mgPlane(b - a + 0.6, 2.0, new THREE.MeshBasicMaterial({ color: '#dfe9f0' }), (a + b) / 2, 1.6, H.wait.z[1] + 1.5, '-z');
  }
  mgPlane(2.3, 1.1, glass, H.room.x[1] + h2, 1.5, -1.55, '-x');

  // ---- ceilings (hidden in the plan view) with light panels
  const ceil = mgStd('#f2f0ea', 0.9), panel = new THREE.MeshBasicMaterial({ color: '#fbfaf6' });
  const roof = (x0, x1, z0, z1) => {
    out.roofs.push(mgBox(x1 - x0, 0.06, z1 - z0, ceil, (x0 + x1) / 2, H.wallH + 0.03, (z0 + z1) / 2));
    for (let x = x0 + 1.2; x < x1 - 0.6; x += 2.4) for (let z = z0 + 1.2; z < z1 - 0.6; z += 2.4) out.roofs.push(mgPlane(0.6, 1.2, panel, x, H.wallH - 0.004, z, '-y'));
  };
  roof(H.room.x[0] - T, H.room.x[1] + T, H.room.z[0] - T, H.room.z[1] + T);
  roof(H.corr.x[0] - T, H.corr.x[1], H.corr.z[0] - T, H.hall.z[0]);
  roof(H.corr.x[1], H.hall.x[1] + T, H.hall.z[0], H.hall.z[1] + T);
  roof(H.wait.x[0] - T, H.wait.x[1] + T, H.wait.z[0], H.wait.z[1] + T);
  roof(H.ctrl.x[0], H.ctrl.x[1] + T, H.ctrl.z[0] - T, H.ctrl.z[1] + T);
  for (const r of out.roofs) { r.castShadow = false; }

  // ---- the scanner: a rounded housing with the bore through it (along x)
  {
    const b = 0.08, sh = new THREE.Shape(), w = 0.92, y0 = 0.08, y1 = 1.92, rt = 0.55, rb = 0.06;
    sh.moveTo(-w + rb, y0); sh.lineTo(w - rb, y0); sh.absarc(w - rb, y0 + rb, rb, -Math.PI / 2, 0, false); sh.lineTo(w, y1 - rt); sh.absarc(w - rt, y1 - rt, rt, 0, Math.PI / 2, false);
    sh.lineTo(-w + rt, y1); sh.absarc(-w + rt, y1 - rt, rt, Math.PI / 2, Math.PI, false); sh.lineTo(-w, y0 + rb); sh.absarc(-w + rb, y0 + rb, rb, Math.PI, Math.PI * 1.5, false);
    const hp = new THREE.Path(); hp.absarc(0, C[1], H.boreR + b, 0, Math.PI * 2, true); sh.holes.push(hp);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 2 * H.half - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 5, curveSegments: 48 });
    g.rotateY(-Math.PI / 2); g.translate(H.half - b, 0, 0); g.computeVertexNormals();
    out.scanner = mgMesh(g, mgStd('#e2e6ea', 0.35, 0.05));
    // the trim rings at the bore's mouths (a soft blue light inside them), the base
    for (const sx of [-1, 1]) {
      const tr = mgMesh(new THREE.TorusGeometry(H.boreR + 0.1, 0.035, 10, 48), mgStd('#9aa4ae', 0.35, 0.2), sx * (H.half + 0.005), C[1], 0); tr.rotation.y = Math.PI / 2;
      const lr = mgMesh(new THREE.TorusGeometry(H.boreR - 0.005, 0.012, 6, 48), new THREE.MeshBasicMaterial({ color: '#9fd6ff' }), sx * (H.half - 0.06), C[1], 0); lr.rotation.y = Math.PI / 2; lr.castShadow = false;
    }
    mgBox(1.5, 0.08, 1.9, mgStd('#c8ccd0', 0.5), 0, 0.04, 0);
    // the logo band on the front (a strip on the housing, not flush: 4 mm proud)
    const lab = mgTex(mgCanvas(512, 64, (c) => { c.fillStyle = '#5a6a7a'; c.fillRect(0, 0, 512, 64); c.fillStyle = '#ffffff'; c.font = '700 34px Arial'; c.textAlign = 'center'; c.fillText('MR 3.0 T', 256, 44); }), { repeat: false });
    const lb = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.078), new THREE.MeshStandardMaterial({ map: lab, roughness: 0.5 })); lb.position.set(H.half + 0.004, 1.62, 0); lb.rotation.y = Math.PI / 2; scene.add(lb);
    // the patient table (east of the scanner)
    mgBox(1.3, 0.62, 0.5, mgStd('#d8dce0', 0.4), 1.95, 0.31, 0);
    mgBox(2.2, 0.07, 0.56, mgStd('#c8ccd2', 0.35), 1.86, 0.665, 0);
    mgBox(2.0, 0.05, 0.5, mgStd('#6a9ac0', 0.7), 1.92, 0.725, 0);
    const pil = mgMesh(new THREE.SphereGeometry(0.16, 16, 10), mgStd('#eef0f2', 0.8), 1.08, 0.78, 0); pil.scale.set(1, 0.32, 1.3);
    // a folded blanket and a pair of headphones (plastic: not magnetic)
    mgBox(0.4, 0.06, 0.45, mgStd('#e8e2d6', 0.9), 2.65, 0.78, 0.02);
    const hp2 = mgMesh(new THREE.TorusGeometry(0.09, 0.012, 6, 20, Math.PI), mgStd('#2a2d33', 0.5), 2.2, 0.76, -0.12); hp2.rotation.set(-Math.PI / 2, 0, 0.4);
  }
  // the cup of water on top of the scanner, and the water (a wobbling ball, a few drops)
  {
    const cupM = new THREE.MeshStandardMaterial({ color: '#3a7ac0', roughness: 0.6, side: THREE.DoubleSide });
    const cg = new THREE.CylinderGeometry(0.042, 0.032, 0.1, 24, 1, true);
    out.cup = mgMesh(cg, cupM, H.cup[0], H.cup[1] + 0.05, H.cup[2]);
    mgCyl(0.032, 0.032, 0.004, cupM, H.cup[0], H.cup[1] + 0.002, H.cup[2], null, 24);
    const waterM = new THREE.MeshPhysicalMaterial({ color: '#8fc4e0', roughness: 0.02, metalness: 0, transparent: true, opacity: 0.78, envMapIntensity: 2.2, clearcoat: 1, clearcoatRoughness: 0.03 });
    out.water = mgMesh(new THREE.SphereGeometry(0.031, 32, 20), waterM, H.cup[0], H.cup[1] + 0.08, H.cup[2]); out.water.castShadow = false;
    out.drops = [];
    for (let i = 0; i < 9; i++) { const r = mgRand(i * 11 + 2), d = mgMesh(new THREE.SphereGeometry(0.004 + 0.007 * r(), 12, 8), waterM, 0, 0, 0); d.castShadow = false; out.drops.push({ m: d, a: r() * 6.283, rr: 0.045 + 0.06 * r(), dy: (r() - 0.3) * 0.08, ph: r() * 6.283 }); }
  }
  // the oxygen cylinder (15 kg of steel: green shoulder, white body, a brass valve) on its trolley
  {
    const g = new THREE.Group(); scene.add(g); out.cyl = g;
    const body = mgCyl(0.07, 0.07, 0.78, mgStd('#e8e8e2', 0.4, 0.3), 0, 0, 0, g, 24);
    const top = mgMesh(new THREE.SphereGeometry(0.07, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mgStd('#2f7a4a', 0.4, 0.3), 0, 0.39, 0, g);
    mgCyl(0.071, 0.071, 0.1, mgStd('#2f7a4a', 0.4, 0.3), 0, 0.34, 0, g, 24);
    mgCyl(0.018, 0.022, 0.08, mgStd('#b8923a', 0.3, 0.8), 0, 0.49, 0, g, 12);
    mgBox(0.06, 0.03, 0.03, mgStd('#b8923a', 0.3, 0.8), 0.04, 0.5, 0, g);
    const lbl = mgTex(mgCanvas(256, 128, (c) => { c.fillStyle = '#f4f2ec'; c.fillRect(0, 0, 256, 128); c.fillStyle = '#2f7a4a'; c.fillRect(0, 0, 256, 34); c.fillStyle = '#1a1c20'; c.font = '700 30px Arial'; c.textAlign = 'center'; c.fillText('OXYGEN', 128, 78); c.font = '500 18px Arial'; c.fillText('MEDICAL O2 · 15 kg', 128, 108); }), { repeat: false });
    const lm = new THREE.Mesh(new THREE.CylinderGeometry(0.0715, 0.0715, 0.16, 24, 1, true, -0.9, 1.8), new THREE.MeshStandardMaterial({ map: lbl, roughness: 0.6 })); lm.position.y = 0.05; g.add(lm);
    void body; void top;
    // the trolley: a two-wheeled frame (aluminium), left behind
    const tg = new THREE.Group(); tg.position.set(H.cyl0[0], 0, H.cyl0[2]); scene.add(tg); out.trolley = tg;
    const al = mgStd('#a8adb2', 0.35, 0.6);
    mgBox(0.24, 0.025, 0.24, al, 0, 0.1, 0, tg);
    for (const sz of [-1, 1]) { mgBox(0.02, 0.9, 0.02, al, -0.11, 0.55, sz * 0.1, tg); const wh = mgCyl(0.07, 0.07, 0.03, mgStd('#1a1c20', 0.8), -0.12, 0.07, sz * 0.14, tg, 16); wh.rotation.x = Math.PI / 2; }
    mgBox(0.02, 0.02, 0.22, al, -0.11, 1.0, 0, tg);
    mgBox(0.02, 0.02, 0.22, al, -0.11, 0.55, 0, tg);
  }
  // the radiographer's desk and screens in the control room; the radiographer
  {
    mgBox(0.7, 0.74, 2.4, mgStd('#d8d2c4', 0.6), 4.1, 0.37, -1.55);
    for (const z of [-2.2, -1.2]) { mgBox(0.04, 0.34, 0.55, mgStd('#1a1c20', 0.4), 4.0, 1.0, z); mgPlane(0.5, 0.29, new THREE.MeshBasicMaterial({ color: '#2a3a4a' }), 4.022, 1.0, z, '+x'); }
    out.rad = mgPerson('mgRad', scene); out.rad.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    mgChair(4.85, -1.6, -Math.PI / 2, '#3a4a5a');
  }
  // the room's cupboards, a gadolinium trolley (plastic), the warning sign on the door, the clock
  mgBox(2.2, 0.9, 0.55, mgStd('#e0dcd2', 0.6), -1.0, 0.45, -3.2);
  mgBox(2.2, 0.03, 0.58, mgStd('#b8c0c4', 0.4), -1.0, 0.915, -3.2);
  out.clockRoom = mgWallClock(-1.0, 2.25, H.room.z[0] + 0.01, '+z');
  mgSign([[46, 800, 'MRI ZONE IV'], [30, 700, 'STRONG MAGNETIC FIELD'], [26, 500, 'THE MAGNET IS ALWAYS ON']], 0.55, 0.42, 1.9, 2.4, H.room.z[1] + 0.01, '-z', { band: '#c8322a' });
  // the corridor: handrails, the sign on the stud wall, a bench (wood), a fire door
  {
    const rail = mgStd('#b8a888', 0.5);
    mgBox(0.04, 0.04, 12.4, rail, H.corr.x[0] + 0.05, 0.92, -2.8);
    mgBox(0.04, 0.04, 2.6, rail, H.west - h2 - 0.05, 0.92, -5.1);
    mgSign([[44, 800, 'MRI SCANNER'], [28, 700, 'STRONG MAGNETIC FIELD'], [26, 500, 'NO METAL OBJECTS BEYOND THIS POINT']], 0.62, 0.44, H.west - h2 - 0.007, 1.85, 1.35, '-x', { band: '#f2c21a', bandInk: '#1a1c20' });
    mgSign([[60, 800, 'RADIOLOGY'], [34, 600, 'MRI · CT · X-RAY  →']], 1.2, 0.36, H.corr.x[0] + 0.07, 2.25, -6.0, '+x', { bg: '#2f5a8a', ink: '#ffffff' });
    mgBox(0.42, 0.45, 1.6, mgStd('#9a7a52', 0.6), H.corr.x[0] + 0.28, 0.225, -7.2);
    mgBox(0.05, 2.12, 1.15, mgStd('#9fb8c8', 0.4), H.west, 1.06, -5.6);
  }
  // the waiting room: chairs in two rows facing north, a TV, a water cooler, plants, a notice board, the clock
  out.people = [];
  {
    const rowA = 10.35, rowB = 12.35;
    for (const x of [-2.0, -1.0, 0.0, 1.0, 2.0, 2.9, 3.8]) mgChair(x, rowA, Math.PI, '#3a6a8a');
    for (const x of [-1.6, -0.6, 0.3, 1.4, 2.4, 3.4]) mgChair(x, rowB, Math.PI, '#3a6a8a');
    mgBox(1.3, 0.75, 0.06, mgStd('#141518', 0.3), 1.0, 2.05, H.wait.z[0] + 0.05);
    mgPlane(1.22, 0.68, new THREE.MeshBasicMaterial({ color: '#3a5a7a' }), 1.0, 2.05, H.wait.z[0] + 0.082, '+z');
    out.clockWait = mgWallClock(-2.6, 2.2, H.wait.z[0] + 0.01, '+z');
    mgSign([[54, 800, 'WAITING AREA'], [32, 500, 'Radiology · Please take a seat']], 1.1, 0.3, 4.0, 2.2, H.wait.z[0] + 0.01, '+z', { bg: '#2f5a8a', ink: '#ffffff' });
    // the water cooler (plastic bottle), plants
    mgBox(0.34, 1.0, 0.34, mgStd('#e8e8e4', 0.4), -3.75, 0.5, 8.0);
    mgCyl(0.13, 0.13, 0.4, new THREE.MeshStandardMaterial({ color: '#9fc8e6', roughness: 0.1, transparent: true, opacity: 0.6 }), -3.75, 1.21, 8.0, null, 20);
    for (const [x, z] of [[5.7, 6.8], [-3.7, 13.1], [5.7, 13.1]]) { mgCyl(0.2, 0.16, 0.4, mgStd('#5a4a3a', 0.8), x, 0.2, z); const cr = mgMesh(mgBlobGeo(0.42, x * 3 + z), mgStd('#3f6a32', 0.9), x, 0.85, z); cr.scale.set(1, 1.3, 1); }
    // the people and their phones (the phones' start: the physics' distance r0 from the bore, along their line)
    const PG = new THREE.BoxGeometry(0.072, 0.15, 0.009), PM = mgStd('#1c1e22', 0.35, 0.4), PS = new THREE.MeshBasicMaterial({ color: '#8ab0d8' });
    H.phones.forEach((q, i) => {
      const r0 = MG_SMALL.wait[i].r0, dy = q[1] - C[1], z = Math.sqrt(r0 * r0 - q[0] * q[0] - dy * dy);
      const p0 = [q[0], q[1], z], stand = !!q[3];
      const P = mgPerson(q[2], scene); P.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      const pose = stand ? MG_POSES.phone() : MG_POSES.sitPhone();
      // place the person so that the right hand is where the phone starts
      mgPose(P, pose, 0, 0, 0, Math.PI); P.root.updateMatrixWorld(true);
      const hw = P.j.ra.hand.getWorldPosition(new THREE.Vector3());
      const base = [p0[0] - hw.x, stand ? 0 : 0.0, p0[2] - hw.z + 0.03];
      const ph = new THREE.Group(); ph.add(new THREE.Mesh(PG, PM)); const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.064, 0.13), PS); scr.position.z = 0.0048; ph.add(scr); scene.add(ph);
      ph.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      out.people.push({ P, stand, base, p0, ph, i, yOff: p0[1] - hw.y });
    });
  }

  // the field's reach (a ring at the bore's height: steel within it flies), for the plan view
  {
    const rg = new THREE.Mesh(new THREE.TorusGeometry(MGP.mriReach, 0.035, 8, 160), new THREE.MeshBasicMaterial({ color: '#ffb02e', transparent: true, opacity: 0.9, depthWrite: false }));
    rg.rotation.x = Math.PI / 2; rg.position.set(C[0], C[1], C[2]); rg.renderOrder = 4; scene.add(rg); out.ring = rg;
    const rg2 = new THREE.Mesh(new THREE.TorusGeometry(MGP.waitR, 0.03, 8, 200), new THREE.MeshBasicMaterial({ color: '#8fd0ff', transparent: true, opacity: 0.7, depthWrite: false }));
    rg2.rotation.x = Math.PI / 2; rg2.position.set(C[0], C[1], C[2]); rg2.renderOrder = 4; scene.add(rg2); out.ring2 = rg2;
  }
  const fxDu = mgPuffs(scene, 1500, { soft: 1.6 });

  // ---------------------------------------------------------------------------------------------------------------
  out.cuts = () => [];
  out.frame = function (t, shot) {
    const m = shot.mode, s = mgStoryAt(t), u = t - shot.t0, kk = MathX.clamp((t - shot.t0) / (shot.t1 - shot.t0), 0, 1);
    this._s = s; this._shot = shot; this._t = t;
    const plan = m === 'plan';
    for (const r of this.roofs) r.visible = !plan;
    this.ring.visible = plan; this.ring2.visible = plan;
    this.ring.material.opacity = 0.9 * mgWin(u, 0.8, 99, 0.6, 0.4); this.ring2.material.opacity = 0.7 * mgWin(u, 2.4, 99, 0.6, 0.4);
    this.clockRoom.update(s); this.clockWait.update(s);
    // the cylinder: upright on its trolley, it lifts and turns to point at the bore as the pull takes it; through the
    // wall at MG_SMALL.cyl.wall; into the bore at .hit (it stays there)
    const Cy = MG_SMALL.cyl, hit = Cy.hit;
    {
      const r = s >= hit ? 0.12 : Cy.at(Math.max(0, s));
      const lift = MathX.smooth(4.6 - r, 0, 0.6), turn = MathX.smooth(4.6 - r, 0, 0.9);
      const y = s >= hit ? C[1] : mgLerp(0.53, C[1], MathX.smooth(4.6 - r, 0, 1.1)) + 0.0 * lift;
      this.cyl.position.set(-r, y, 0);
      this.cyl.rotation.set(0, 0, -Math.PI / 2 * turn);        // (its valve end leads, toward the bore)
      this.trolley.rotation.z = 0.35 * MathX.smooth(4.6 - r, 0.05, 0.5);
      this.trolley.position.x = H.cyl0[0] + 0.12 * MathX.smooth(4.6 - r, 0.0, 0.5);
    }
    // the stud wall's pieces: in place until the cylinder arrives, then thrown into the room (and they fall)
    {
      const w = Cy.wall, M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(1, 1, 1);
      CH.forEach((c, i) => {
        let x = H.west, y = c.y, z = c.z;
        if (c.fly && s > w) {
          const a = s - w, tt = Math.min(a, 0.6);
          x += c.vx * tt; z += c.vz * tt; y = Math.max(0.06 + 0.02 * (i % 3), c.y + c.vy * tt - 4.9 * tt * tt);
          x = Math.min(x, -1.0 - 0.05 * (i % 7));
          const k = Math.min(1, tt * 3);
          e.set(c.spin[0] * tt * k, c.spin[1] * tt * k, c.spin[2] * tt * k); q.setFromEuler(e);
          sc.set(1, 1, 1);
        } else { q.identity(); }
        M4.compose(new THREE.Vector3(x, y, z), q, sc); chunks.setMatrixAt(i, M4);
      });
      chunks.instanceMatrix.needsUpdate = true;
    }
    // the water
    {
      const hgt = mgWaterLift(s), wob = Math.sin(s * 3.1 * 6.283 * 0.16) * 0.1 * Math.exp(-s / 2);
      this.water.position.set(H.cup[0], H.cup[1] + 0.07 + hgt, H.cup[2]);
      this.water.scale.set(1 + wob, 1 - wob, 1 + wob * 0.5);
      const kd = MathX.smooth(s, 0.02, 0.2);
      for (const d of this.drops) { const a = d.a + s * 0.4; d.m.visible = kd > 0.01; d.m.position.set(H.cup[0] + Math.cos(a) * d.rr * kd, H.cup[1] + 0.07 + hgt + d.dy * kd + 0.01 * Math.sin(s * 2 + d.ph), H.cup[2] + Math.sin(a) * d.rr * kd); }
    }
    // the radiographer: at the desk; startled (stands half up, looks at the window)
    {
      const P = this.rad, k = MathX.smooth(s, 0.25, 0.7), p = lerpPose(MG_POSES.desk(), MG_POSES.lookAround(), k * 0.6);
      p.headYaw = 0.5 * k; mgPose(P, p, 4.85, 0, -1.6, -Math.PI / 2);
    }
    // the waiting room: each phone leaves its owner's hand when the pull beats the grip; it flies at the bore and
    // stops at the hall's wall (it stays stuck there). Their owners flinch and reach after them.
    for (const pp of this.people) {
      const W = MG_SMALL.wait[pp.i], r = W.at(Math.max(0, s)), d = mgN3([pp.p0[0] - C[0], pp.p0[1] - C[1], pp.p0[2] - C[2]]);
      let p = [C[0] + d[0] * r, C[1] + d[1] * r, C[2] + d[2] * r];
      const zw = H.wait.z[0] + 0.006;
      if (p[2] < zw) { const k = (zw - C[2]) / d[2]; p = [C[0] + d[0] * k, C[1] + d[1] * k, zw]; }
      pp.ph.position.set(...p);
      const fl = MathX.smooth(W.r0 - r, 0, Math.max(0.5, (W.r0 - 6.2) * 0.8));
      // first the twist: each phone is wrenched round like a compass needle in its owner's hand, then it goes
      const tw = MathX.smooth(s, 0.004, W.grip) * (1 - fl) * (pp.i % 2 ? 1.5 : -1.3);
      pp.ph.rotation.set(mgLerp(-1.1, 0, fl), mgLerp(Math.PI, 0, fl) + 0.4 * Math.sin(fl * 3) + tw, 0);
      const react = MathX.smooth(s, 0.06 + 0.025 * pp.i + 0.18, 0.06 + 0.025 * pp.i + 0.55);
      const base = pp.stand ? MG_POSES.phone() : MG_POSES.sitPhone();
      const reach = pp.stand ? (() => { const q = basePose(); q.rSh = [1.45, 0.05]; q.rEl = 0.2; q.lSh = [0.6, 0.3]; q.lEl = 0.6; q.spine = 0.12; q.neck = -0.05; q.mouth = 1; return q; })()
        : (() => { const q = MG_POSES.sit(); q.rSh = [1.35, 0.05]; q.rEl = 0.25; q.lSh = [0.9, 0.25]; q.lEl = 0.5; q.spine = 0.2; q.neck = -0.1; q.mouth = 1; return q; })();
      const pose = lerpPose(base, reach, react * 0.85);
      pose.headYaw = 0.15 * Math.sin(pp.i * 2.1) * react;
      mgPose(pp.P, pose, pp.base[0], pp.base[1], pp.base[2], Math.PI);
    }
    // the camera
    const v = { p: [3, 1.6, 2.6], at: [0, 1.1, 0], fov: 46, drift: 0.006, shake: 0 };
    switch (m) {
      case 'mriRoom': { const k = mgK(u, 0, 5); v.p = [mgLerp(3.25, 2.95, k), 1.55, mgLerp(2.75, 2.45, k)]; v.at = [-0.2, 1.25, 0]; v.fov = 50; break; }
      case 'plan': { const k = mgK(u, 0, 6); v.p = [mgLerp(-1.5, -1.0, k), mgLerp(25, 24, k), mgLerp(14.5, 13.8, k)]; v.at = [0.2, 0, 3.4]; v.fov = 44; v.drift = 0.02; break; }
      case 'corridor': { const k = mgK(u, 0, 6.5); v.p = [-5.32, 1.4, mgLerp(-4.3, -3.9, k)]; v.at = [-4.0, 1.0, 0.15]; v.fov = 50; break; }   // (down the corridor, level: the cylinder crosses to the wall on the right)
      case 'burst': { v.p = [-1.25, 1.55, 3.05]; v.at = [-2.35, 0.95, -0.25]; v.fov = 52; if (s > Cy.wall) v.shake = 0.012 * Math.exp(-(s - Cy.wall) / 0.02); if (s > hit) v.shake = 0.03 * Math.exp(-(s - hit) / 0.01); break; }
      case 'water': { const k = mgK(u, 1.5, 16); v.p = [mgLerp(0.98, 2.4, k), mgLerp(2.3, 2.5, k), mgLerp(0.88, 2.7, k)]; v.at = mgV([H.cup[0], H.cup[1] + 0.16, H.cup[2]], [-0.2, 1.5, 0], k * 0.6); v.fov = mgLerp(30, 46, k); v.drift = 0.003; break; }
      case 'waiting': { const k = mgK(u, 0, 10); v.p = [mgLerp(5.4, 5.0, k), 1.5, mgLerp(13.0, 12.6, k)]; v.at = [-0.6, 1.0, 7.2]; v.fov = 52; break; }
    }
    const dr = mgDrift(t, v.drift, 0.3, 21);
    if (v.shake) { const j = v.shake; dr[0] += j * Math.sin(t * 61) * Math.sin(t * 11.3); dr[1] += j * 0.7 * Math.sin(t * 53 + 1); dr[2] += j * Math.sin(t * 47 + 2); }
    mgCam(cam, [v.p[0] + dr[0], v.p[1] + dr[1], v.p[2] + dr[2]], [v.at[0] + dr[0], v.at[1] + dr[1], v.at[2] + dr[2]], v.fov);
    // the shadow box follows the camera's target
    const tg = new THREE.Vector3(v.at[0], 0, v.at[2]);
    const R = plan ? 16 : 9; const sc2 = S.sun.shadow.camera; sc2.left = -R; sc2.right = R; sc2.top = R; sc2.bottom = -R; sc2.updateProjectionMatrix();
    S.sun.target.position.copy(tg); S.sun.position.copy(tg).add(new THREE.Vector3(2.5, 9, 3.5)); S.sun.target.updateMatrixWorld();
    // dust: the wall's burst, the cylinder's arrival
    fxDu.begin();
    if (s > Cy.wall) { const a = s - Cy.wall; for (let i = 0; i < 90; i++) { const r = mgRand(i * 5 + 77), tt = Math.min(a, 1.5); const x = H.west + (0.2 + 3 * r()) * (1 - Math.exp(-tt * 3)), y = 0.3 + 1.3 * r() + 0.2 * tt, z = (r() - 0.5) * (1.2 + 1.5 * tt); fxDu.add(x, y, z, 0.25 + 0.6 * r() + 0.4 * tt, 0.35 * Math.exp(-tt / 1.2), 0.86, 0.84, 0.8); } }
    if (s > hit) { const a = s - hit; for (let i = 0; i < 40; i++) { const r = mgRand(i * 3 + 9), tt = Math.min(a, 1.2); fxDu.add(-H.half - 0.2 - 0.8 * r() * tt * 2, C[1] + (r() - 0.5) * 0.8, (r() - 0.5) * 0.9, 0.2 + 0.4 * r(), 0.3 * Math.exp(-tt / 0.8), 0.9, 0.9, 0.88); } }
    fxDu.end();
    void kk;
  };
  out.labels = function (t) {
    const sh = this._shot, m = sh.mode, u = t - sh.t0, L = [], W = (a, b) => mgWin(u, a, b, 0.4, 0.4), C2 = MG_H.c;
    if (m === 'plan') {
      L.push({ p: [C2[0] + MGP.mriReach * 0.8, C2[1], C2[2] + MGP.mriReach * 0.6], text: 'STEEL FLIES', sub: `WITHIN ${MGP.mriReach.toFixed(0)} m`, a: W(1.0, 99), side: 'l' });
      L.push({ p: [this.cyl.position.x, 1.0, 0], text: 'OXYGEN CYLINDER', sub: `${(-this.cyl.position.x).toFixed(1)} m · 15 kg`, a: W(1.8, 99), side: 'l' });
      L.push({ p: [1.0, 1.2, 10.4], text: 'WAITING ROOM', sub: `${MGP.waitR} m`, a: W(2.8, 99) });
      L.push({ p: [0.9, 2.1, -0.8], text: 'MRI', sub: '3,000 TESLA', a: W(0.4, 99), side: 'l' });
    }
    if (m === 'corridor') { const c = this.cyl.position; L.push({ p: [c.x - 0.3, c.y + 0.2, c.z], text: 'OXYGEN CYLINDER', sub: '15 kg OF STEEL', a: W(0.6, 99), side: 'l' }); }
    return L;
  };
  out.grade = function (t, p) {
    p.exposure = 0.9; p.saturation = 1.0; p.contrast = 1.1; p.warmth = -0.015; p.vignette = 0.5; p.bloom = 0.22; p.bloomThreshold = 0.96; p.grain = 0.026; p.blackLift = 0.008;
    const s = this._s, Cy = MG_SMALL.cyl;
    if (s > Cy.hit && s < Cy.hit + 0.2) p.flash = 0.1 * Math.exp(-(s - Cy.hit) / 0.03);
  };
  return out;
};
