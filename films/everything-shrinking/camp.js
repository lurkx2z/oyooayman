/* =====================================================================
   CAMP — the things of the campsite and the valley, in the world's own metres (they sit in EK_W, scaled by s):
     ekTent(W)      your dome tent (rust orange; its door to the east). It closes in round you: its fabric is pushed
                    out by your body (you don't shrink), and it tears where you push up through the roof
     ekCampProps(W) your car, the picnic table with a lantern, the fire pit (embers), the next campsite's camper van and
                    its lamp, the lodge at the lake's outlet (lit windows), the dock and a red canoe, the gravel road
     ekAirliner(W)  a Boeing 737-800 at cruise (11 km up), its lights and its contrail
     ekWorldify(root, kind)   every material under root gets the world's light (or yours): worldfx.js
   ===================================================================== */

// your frame's light (your body and hands don't shrink: their sunlight is the Sun as your eye sees it)
const EK_YU = { uYouSun: { value: new THREE.Color(0, 0, 0) }, uYouSky: { value: 1 } };
function ekYouPatch(mat) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uYouSun = EK_YU.uYouSun; sh.uniforms.uYouSky = EK_YU.uYouSky;
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uYouSun; uniform float uYouSky;')
      .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n reflectedLight.directDiffuse *= uYouSun; reflectedLight.directSpecular *= uYouSun; reflectedLight.indirectDiffuse *= uYouSky; reflectedLight.indirectSpecular *= uYouSky;');
  };
  mat.customProgramCacheKey = () => 'ekYou';
  return mat;
}
// give every material under root the world's light ('world') or yours ('you'); shared (cached) materials are cloned
const EK_PATCHED = new WeakSet();
function ekWorldify(root, kind = 'world') {
  const memo = new Map();
  const fix = (m) => {
    if (!m || EK_PATCHED.has(m) || !(m.isMeshStandardMaterial || m.isMeshLambertMaterial || m.isMeshPhongMaterial)) return m;
    if (memo.has(m)) return memo.get(m);
    const c = m.clone(); kind === 'world' ? ekWorldPatch(c, { key: 'w' }) : ekYouPatch(c); EK_PATCHED.add(c); memo.set(m, c); return c;
  };
  root.traverse((o) => { if (!o.isMesh) return; o.material = Array.isArray(o.material) ? o.material.map(fix) : fix(o.material); });
}

// ---- the tent: a dome (a superellipse floor, two crossing poles), the fly outside, its glow inside
function ekTent(W) {
  const T = EK_F.tent, NA = 72, NR = 16, a = T.w / 2, b = T.d / 2, H = T.h;
  const pos = [], rho = [], ang = [], idx = [];
  const floorAt = (th) => { const c = Math.cos(th), s = Math.sin(th), k = Math.pow(Math.pow(Math.abs(c) / a, 4) + Math.pow(Math.abs(s) / b, 4), -0.25); return [c * k, s * k]; };
  for (let j = 0; j <= NR; j++) {
    const r = j / NR;                          // 0 = the roof's top, 1 = the floor's edge
    for (let i = 0; i <= NA; i++) {
      const th = i / NA * Math.PI * 2, [fx, fz] = floorAt(th);
      const sag = 1 + 0.06 * Math.sin(th * 2) * Math.sin(r * Math.PI);   // (the fabric sags between the poles)
      const y = H * Math.pow(Math.max(0, 1 - r * r), 0.55) * (1 - 0.04 * Math.sin(r * Math.PI) * (1 - Math.abs(Math.cos(2 * th))));
      pos.push(fx * r * sag, Math.max(0.002, y), fz * r * sag); rho.push(r); ang.push(i / NA);
    }
  }
  for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) { const p = j * (NA + 1) + i, q = p + NA + 1; idx.push(p, p + 1, q, p + 1, q + 1, q); }   // (wound so its front faces look out)
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aRho', new THREE.Float32BufferAttribute(rho, 1)); g.setAttribute('aAng', new THREE.Float32BufferAttribute(ang, 1));
  g.setIndex(idx); g.computeVertexNormals();
  const base = Float32Array.from(pos);
  const TU = { uRip: { value: 0 }, uGlow: { value: new THREE.Color('#000') } };
  const rip = `attribute float aRho; attribute float aAng; varying float vRho; varying float vAng;`, ripF = `uniform float uRip; varying float vRho; varying float vAng;
    float ekTh(float x){ return fract(sin(x * 91.7) * 43758.5); }`;
  const ripCut = `{ float e = uRip * (1.0 + 0.35 * sin(vAng * 6.2832 * 7.0) + 0.25 * sin(vAng * 6.2832 * 17.0 + 1.3)); if (vRho < e) discard; }`;
  const out = ekWorldPatch(new THREE.MeshStandardMaterial({ color: '#b65a26', roughness: 0.82, side: THREE.FrontSide }), {
    key: 'tentOut', vHead: rip, vBody: 'vRho = aRho; vAng = aAng;', fHead: ripF, fBody: ripCut,
    after: (sh) => { sh.uniforms.uRip = TU.uRip; sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n' + ripCut); },
  });
  // inside: the dawn coming through the orange fabric (it glows; darker along the seams and the poles)
  const inn = new THREE.ShaderMaterial({
    side: THREE.BackSide, uniforms: TU,
    vertexShader: `${rip} void main(){ vRho = aRho; vAng = aAng; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `${ripF} uniform vec3 uGlow; void main(){ ${ripCut}
      float seam = smoothstep(0.012, 0.0, abs(fract(vAng * 2.0 + 0.125) - 0.5) - 0.0) * 0.0;
      float pole = smoothstep(0.01, 0.0, abs(fract(vAng * 2.0 + 0.125) - 0.5) - 0.482);
      float edge = smoothstep(0.86, 1.0, vRho);
      vec3 c = uGlow * (1.0 - 0.55 * pole) * (1.0 - 0.45 * edge) * (0.85 + 0.15 * sin(vAng * 6.2832 * 4.0));
      float torn = smoothstep(uRip * 1.6 + 0.001, uRip, vRho) * step(0.001, uRip);
      gl_FragColor = vec4(c * (1.0 - 0.5 * torn), 1.0); }`,
  });
  const grp = new THREE.Group(); grp.position.set(T.x, ekGroundY(T.x, T.z) + 0.01, T.z); grp.rotation.y = T.yaw; W.add(grp);
  const mOut = new THREE.Mesh(g, out), mIn = new THREE.Mesh(g, inn); mOut.castShadow = true; mOut.receiveShadow = true;
  mOut.frustumCulled = mIn.frustumCulled = false;
  grp.add(mOut, mIn);
  // the floor (a dark groundsheet) and the door's zip (a dark line on the east side)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(T.w * 0.98, T.d * 0.98).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#2a2622', roughness: 0.9 }));
  floor.position.y = 0.006; grp.add(floor);
  return { grp, g, base, mOut, mIn, TU };
}
// push the tent's fabric out of your body (capsules in your frame: [ax, ay, az, bx, by, bz, r]) — s is the world's scale
function ekTentWrap(tent, s, caps) {
  const P = tent.g.attributes.position, A = P.array, B = tent.base, grp = tent.grp;
  grp.updateMatrixWorld(true);
  const M = grp.matrixWorld, Mi = new THREE.Matrix4().copy(M).invert(), v = new THREE.Vector3();
  for (let i = 0; i < A.length; i += 3) {
    v.set(B[i], B[i + 1], B[i + 2]).applyMatrix4(M);   // → your frame
    for (const [ax, ay, az, bx, by, bz, r] of caps) {
      const dx = bx - ax, dy = by - ay, dz = bz - az, l2 = dx * dx + dy * dy + dz * dz;
      const t = MathX.clamp(((v.x - ax) * dx + (v.y - ay) * dy + (v.z - az) * dz) / l2, 0, 1);
      const cx = ax + dx * t, cy = ay + dy * t, cz = az + dz * t, ex = v.x - cx, ey = v.y - cy, ez = v.z - cz, d = Math.hypot(ex, ey, ez);
      if (d < r) { const k = d > 1e-6 ? r / d : 0; if (k) v.set(cx + ex * k, cy + ey * k, cz + ez * k); else v.y = cy + r; }
    }
    v.applyMatrix4(Mi); A[i] = v.x; A[i + 1] = Math.max(0.002, v.y); A[i + 2] = v.z;
  }
  P.needsUpdate = true; tent.g.computeVertexNormals();
}
function ekTentReset(tent) { const A = tent.g.attributes.position.array; A.set(tent.base); tent.g.attributes.position.needsUpdate = true; tent.g.computeVertexNormals(); }

// ---- the campsite and the valley's buildings
function ekCampProps(W) {
  const F = EK_F, X = {}, VF = new VehicleFactory();
  const at = (o, x, z, yaw = 0, dy = 0) => { o.position.set(x, ekGroundY(x, z) + dy, z); o.rotation.y = yaw; W.add(o); return o; };
  // your car (a dusty green SUV) and the neighbours' camper van (white, a pop-top)
  { const v = VF.build('suv', '#3c4a3e'); X.car = at(new THREE.Group().add(v.group) && v.group.parent || new THREE.Group(), F.car.x, F.car.z, F.car.yaw, 0.02); }
  { const g = new THREE.Group(), v = VF.build('van', '#e8e6e0'); g.add(v.group); at(g, F.van.x, F.van.z, F.van.yaw, 0.02); X.van = g;
    const top = new THREE.Mesh(ekRoundBox(3.2, 0.32, 1.8, 0.1, 0.04), ekStd('#d7d2c4', 0.7)); top.position.set(0.2, 2.36, 0); g.add(top);
    // its lamp: a lit window (warm) and a lantern hung by the sliding door
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.42), new THREE.MeshStandardMaterial({ color: '#2a1a08', emissive: '#ffb055', emissiveIntensity: 1.6 }));
    win.position.set(-0.6, 1.72, 1.016); g.add(win);
    X.vanLamp = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshStandardMaterial({ color: '#2a1a08', emissive: '#ffc070', emissiveIntensity: 3 }));
    X.vanLamp.position.set(0.9, 1.9, 1.15); g.add(X.vanLamp);
    // two camp chairs and a little stove on a box
    for (const [x, z, c] of [[0.8, 2.4, '#2a4a7a'], [-0.6, 2.7, '#7a2a2a']]) { const ch = new THREE.Group(); ch.position.set(x, 0, z);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.45), ekStd(c, 0.8)); seat.position.y = 0.42; ch.add(seat);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.04), ekStd(c, 0.8)); back.position.set(0, 0.68, -0.22); back.rotation.x = -0.15; ch.add(back);
      for (const [lx, lz] of [[-0.22, -0.2], [0.22, -0.2], [-0.22, 0.2], [0.22, 0.2]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.44, 5), ekStd('#222', 0.4, 0.6)); l.position.set(lx, 0.21, lz); ch.add(l); }
      g.add(ch); }
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.4), ekStd('#4a4a44', 0.7)); box.position.set(0.1, 0.2, 3.3); g.add(box);
    X.pot = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.14, 14), ekStd('#9aa0a6', 0.3, 0.8)); X.pot.position.set(0.1, 0.47, 3.3); g.add(X.pot);
    X.potWater = new THREE.Mesh(new THREE.CircleGeometry(0.088, 20).rotateX(-Math.PI / 2), ekStd('#1a2a2e', 0.05, 0.1)); X.potWater.position.set(0.1, 0.525, 3.3); g.add(X.potWater);
  }
  // the picnic table (weathered wood), its lantern (lit), two mugs
  { const g = new THREE.Group(), wood = ekStd('#6e5a44', 0.85);
    const top = new THREE.Mesh(ekRoundBox(1.9, 0.06, 0.8, 0.02, 0.01), wood); top.position.y = 0.72; g.add(top);
    for (const sz of [-0.62, 0.62]) { const bn = new THREE.Mesh(ekRoundBox(1.9, 0.05, 0.28, 0.02, 0.01), wood); bn.position.set(0, 0.42, sz); g.add(bn); }
    for (const sx of [-0.7, 0.7]) for (const k of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.86, 0.07), wood); l.position.set(sx, 0.38, 0.32 * k); l.rotation.x = -0.55 * k; g.add(l); }
    X.lantern = new THREE.Group(); X.lantern.position.set(0.35, 0.75, 0.05); g.add(X.lantern);
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.14, 12), new THREE.MeshStandardMaterial({ color: '#3a2008', emissive: '#ffb860', emissiveIntensity: 2.4 }));
    glass.position.y = 0.1; X.lantern.add(glass);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.065, 0.05, 12), ekStd('#1e2a22', 0.5, 0.5)); cap.position.y = 0.195; X.lantern.add(cap);
    const bse = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.07, 0.03, 12), ekStd('#1e2a22', 0.5, 0.5)); bse.position.y = 0.015; X.lantern.add(bse);
    for (const [x, z, c] of [[-0.3, 0.1, '#c8c2b4'], [-0.1, -0.15, '#3a5a8a']]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.09, 12), ekStd(c, 0.4)); m.position.set(x, 0.795, z); g.add(m); }
    X.table = at(g, F.table.x, F.table.z, F.table.yaw);
  }
  // the fire pit: a ring of stones, charred logs, embers
  { const g = new THREE.Group(), st = ekStd('#6a6660', 0.9);
    for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2, r = 0.42; const s = new THREE.Mesh(ekBlobGeo(0.09 + 0.03 * ekR(i, 61), 300 + i), st); s.position.set(Math.cos(a) * r, 0.05, Math.sin(a) * r); s.scale.y = 0.7; g.add(s); }
    const ash = new THREE.Mesh(new THREE.CircleGeometry(0.36, 20).rotateX(-Math.PI / 2), ekStd('#3a3632', 1)); ash.position.y = 0.012; g.add(ash);
    const log = ekStd('#1c1612', 0.95);
    for (const [r, a] of [[0.3, 0.3], [0.28, 1.9], [0.26, 3.6]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.55, 8), log); l.rotation.set(Math.PI / 2, 0, 0); l.rotation.y = a; l.position.set(0, 0.06, 0); l.rotateX(0.25); g.add(l); }
    X.embers = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#120604', emissive: '#ff5a1a', emissiveIntensity: 1.6 }));
    X.embers.position.y = 0.03; g.add(X.embers);
    X.fire = at(g, F.fire.x, F.fire.z);
  }
  // the lodge at the outlet: two storeys of logs, a green roof, lit windows
  { const L = F.lodge, g = new THREE.Group(), wall = ekStd('#5a4030', 0.85), roof = ekStd('#2e3e34', 0.7);
    const body = new THREE.Mesh(new THREE.BoxGeometry(L.w, 7, L.d), wall); body.position.y = 3.5; g.add(body);
    const rf = new THREE.Mesh(new THREE.CylinderGeometry(0.01, L.d * 0.72, L.w * 1.06, 4, 1), roof); rf.rotation.z = Math.PI / 2; rf.rotation.x = Math.PI / 4; rf.scale.set(1, 1, 0.55); rf.position.y = 9.2; g.add(rf);
    const winM = new THREE.MeshStandardMaterial({ color: '#2a1a08', emissive: '#ffb055', emissiveIntensity: 1.4 });
    for (let i = 0; i < 9; i++) for (const yy of [2, 5.2]) { if (ekR(i * 3 + yy, 71) < 0.45) continue; const w = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), winM); w.position.set(-L.w / 2 + 3 + i * 5, yy, L.d / 2 + 0.05); g.add(w); }
    X.lodge = at(g, L.x, L.z, 0.1);
  }
  // the dock and the red canoe on the water
  { const D = F.dock, g = new THREE.Group(), wood = ekStd('#5e4c3a', 0.85);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.2, D.len), wood); deck.position.set(0, 0, -D.len / 2); g.add(deck);
    g.position.set(D.x, EK_F.lakeY + 0.45, D.z); g.rotation.y = D.yaw; W.add(g); X.dock = g;
    const c = new THREE.Group(), red = ekStd('#a8261e', 0.45);
    const hull = new THREE.Mesh(ekLoft([[0, 0.15, -2.4, 0.02, 0.05], [0, 0.08, -1.8, 0.3, 0.16], [0, 0.06, 0, 0.42, 0.2], [0, 0.08, 1.8, 0.3, 0.16], [0, 0.15, 2.4, 0.02, 0.05]], 12, 0.3), red);
    c.add(hull); c.position.set(F.canoe.x, EK_F.lakeY + 0.05, F.canoe.z); c.rotation.y = F.canoe.yaw; W.add(c); X.canoe = c;
  }
  ekWorldify(W, 'world');
  return X;
}
// the gravel road: east from the camp along the valley floor (a ribbon in short pieces, on the curved Earth, 6 cm proud)
function ekRoad(W) {
  const pts = [];
  for (let x = -160; x <= 9000; x += x < 400 ? 6 : 24) { const z = EK_F.road.z + (x > 600 ? ekValleyD(EK_VALLEYS[0], x, EK_F.road.z) * 0 + 40 * ekSmooth(600, 3000, x) * Math.sin(x * 0.0011) : 0); pts.push([x, z]); }
  const pos = [], col = [], idx = [], w = 3.2, p = [0, 0, 0];
  pts.forEach(([x, z], i) => {
    const [x2, z2] = pts[Math.min(pts.length - 1, i + 1)], [x0, z0] = pts[Math.max(0, i - 1)], dx = x2 - x0, dz = z2 - z0, l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
    for (const k of [-1, 1]) { const xx = x + nx * w * k, zz = z + nz * w * k; ekSphere(xx, zz, ekGroundY(xx, zz) + 0.06, p); pos.push(...p); const v = 0.36 + 0.04 * ekN2(xx * 0.3, zz * 0.3, 77); col.push(v, v * 0.95, v * 0.86); }
    if (i) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, ekWorldPatch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), { key: 'road' }));
  m.receiveShadow = true; m.frustumCulled = false; W.add(m);
  return m;
}

// ---- the airliner: a 737-800 (39.5 m long, 35.8 m span), white with a blue tail, nav lights; it faces +x
function ekAirliner(W) {
  const g = new THREE.Group(), white = ekStd('#e8eaec', 0.4, 0.1), blue = ekStd('#1d3a7a', 0.4, 0.1), grey = ekStd('#9aa0a6', 0.35, 0.6), dark = ekStd('#20242a', 0.3, 0.3);
  const fus = new THREE.Mesh(ekLoft([[-19.6, 0.9, 0, 0.1, 0.3], [-17, 1.2, 0, 0.9, 1.0], [-12, 0.2, 0, 1.85, 1.95], [10, 0, 0, 1.88, 2.0], [15.5, -0.1, 0, 1.6, 1.7], [18.6, -0.5, 0, 0.8, 0.85], [19.75, -0.65, 0, 0.1, 0.1]].map(([x, y, z, rx, ry]) => [x, y, z, rx, ry]), 16, 0.4), white);
  fus.rotation.set(0, 0, 0); g.add(fus);
  // (the loft runs along its rings' x: re-orient it along +x)
  fus.geometry.rotateY(0);
  const wingShape = (span, root, tip, sweep, th, mat, y, x0) => {
    for (const s of [-1, 1]) {
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(-sweep, span); sh.lineTo(-sweep - tip, span); sh.lineTo(-root, 0); sh.closePath();
      const geo = new THREE.ExtrudeGeometry(sh, { depth: th, bevelEnabled: false }); geo.rotateX(-Math.PI / 2 * s); geo.translate(x0, y, 0);
      if (s < 0) geo.scale(1, 1, 1);
      const m = new THREE.Mesh(geo, mat); g.add(m);
    }
  };
  wingShape(17, 7.2, 1.6, 7.5, 0.45, white, -1.0, 2.5);
  wingShape(7, 3.8, 1.2, 3.8, 0.25, white, 0.9, -15.2);
  const fin = new THREE.Shape(); fin.moveTo(0, 0); fin.lineTo(-4.5, 7.6); fin.lineTo(-6.4, 7.6); fin.lineTo(-6.2, 0); fin.closePath();
  const fg = new THREE.ExtrudeGeometry(fin, { depth: 0.3, bevelEnabled: false }); fg.translate(-12.8, 1.4, -0.15); g.add(new THREE.Mesh(fg, blue));
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 0.85, 3.6, 14), grey); e.rotation.z = Math.PI / 2; e.position.set(1.8, -2.1, 5.0 * s); g.add(e);
    const intake = new THREE.Mesh(new THREE.CircleGeometry(0.95, 14), dark); intake.rotation.y = Math.PI / 2; intake.position.set(3.61, -2.1, 5.0 * s); g.add(intake); }
  // the windows: a dark band
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 22, 18, 1, true, Math.PI * 0.32, Math.PI * 0.08), dark); band.rotation.z = Math.PI / 2; band.position.set(-1, 0.05, 0); band.scale.set(1.002, 1, 1.002); g.add(band);
  // nav lights: red (left, −z... its left is +z when it faces +x), green right, white strobes
  const L = (c, x, y, z, k = 4) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), new THREE.MeshStandardMaterial({ color: '#000', emissive: c, emissiveIntensity: k })); m.position.set(x, y, z); g.add(m); return m; };
  const navL = L('#ff2a20', -6, -0.8, 17.8), navR = L('#20ff60', -6, -0.8, -17.8), strobe = L('#ffffff', -19.4, 1.0, 0, 0);
  W.add(g);
  ekWorldify(g, 'world');
  return { g, strobe };
}
