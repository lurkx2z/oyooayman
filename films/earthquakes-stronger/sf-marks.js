/* =====================================================================
   SF MARKS — San Francisco's landmarks for the earthquake film, at their real places (sf-geo.js frame: metres, the
   Ferry Building's tower at the origin), simplified but true to size:
     the Ferry Building      a 200 m hall on the water, its 75 m clock tower (the hands show the film's real time)
     the Bay Bridge          the West Span, 3.2 km to Yerba Buena Island: two suspension bridges, four 160 m towers,
                             the double deck 58 m over the water
     the Golden Gate Bridge  1,280 m main span, 227 m towers, the deck 67 m up, International Orange
     the Transamerica Pyramid 260 m · the Salesforce Tower 326 m · Coit Tower on Telegraph Hill · Alcatraz · Sutro Tower
   Each breaks at a story second (when it fails is part of the story: shots.js shows it), as a pure function of s.
   ===================================================================== */

const EQ_WF_ROT = Math.atan2(-EQ_WF.w[1], EQ_WF.w[0]);          // a group turned by this: local x = u, local z = −v
function eqWFGroup(scene) { const g = new THREE.Group(); g.rotation.y = EQ_WF_ROT; scene.add(g); return g; }
const eqWL = (u, y, v) => { const [x, z] = eqWF(u, v); return [x, y, z]; };

// a canvas facade: rows of windows / arches on a wall colour (repeats along u)
function eqFacadeTex(o) {
  const W = o.w || 256, H = o.h || 256;
  return eqTex(eqCanvas(W, H, (g) => {
    g.fillStyle = o.wall; g.fillRect(0, 0, W, H);
    if (o.noise) for (let i = 0; i < 900; i++) { const r = eqR(i, o.seed || 3); g.fillStyle = `rgba(0,0,0,${0.03 * r})`; g.fillRect(eqR(i, 5) * W, eqR(i, 7) * H, 2 + r * 6, 2 + r * 4); }
    for (const row of o.rows) {
      const [y0, y1, n, wFrac, kind, col] = row;
      for (let k = 0; k < n; k++) {
        const cw = W / n, x0 = k * cw + cw * (1 - wFrac) / 2, w = cw * wFrac, yy0 = H * y0, hh = H * (y1 - y0);
        g.fillStyle = col || '#2a3a46';
        if (kind === 'arch') { g.beginPath(); g.moveTo(x0, yy0 + hh); g.lineTo(x0, yy0 + w / 2); g.arc(x0 + w / 2, yy0 + w / 2, w / 2, Math.PI, 0); g.lineTo(x0 + w, yy0 + hh); g.closePath(); g.fill(); }
        else g.fillRect(x0, yy0, w, hh);
        if (o.sill) { g.fillStyle = o.sill; g.fillRect(x0 - 2, yy0 + hh, w + 4, 3); }
      }
    }
    if (o.bands) for (const [y, hh, c] of o.bands) { g.fillStyle = c; g.fillRect(0, H * y, W, H * hh); }
  }), { repeat: true });
}

// ---------------------------------------------------------------------------------------------------------------------
// a suspension bridge: o = { A: [x, z] (its first end), dir: [dx, dz] unit, len, deckY, width, towers: [d…], towerH,
//   cable: [[d, y, sag], …] knots (sag of the curve from this knot to the next), color, seg (deck piece length),
//   double (a second deck under the first), fail(i) → story s the piece starts to fall, twist(s, d) → roll (rad) }
// ---------------------------------------------------------------------------------------------------------------------
function eqSuspension(scene, o) {
  const [ax, az] = o.A, [dx, dz] = o.dir, nx = -dz, nz = dx, W = o.width;
  const at = (d, lat = 0, y = 0) => [ax + dx * d + nx * lat, y, az + dz * d + nz * lat];
  const steel = eqStd(o.color, 0.62, 0.35), dark = eqStd('#3a3c40', 0.8, 0.2);
  const root = new THREE.Group(); scene.add(root);
  const yaw = Math.atan2(dx, dz);                          // local +z = along the bridge
  // the cable's height at d
  const K = o.cable;
  const cableY = (d) => {
    for (let i = 0; i < K.length - 1; i++) if (d <= K[i + 1][0]) { const u = (d - K[i][0]) / (K[i + 1][0] - K[i][0]); return MathX.lerp(K[i][1], K[i + 1][1], u) - 4 * K[i][2] * u * (1 - u); }
    return K[K.length - 1][1];
  };
  // ---- towers (each its own group, so it can lean)
  const towers = o.towers.map((d) => {
    const g = new THREE.Group(); const p = at(d); g.position.set(p[0], 0, p[2]); g.rotation.y = yaw; root.add(g);
    const H = o.towerH, legW = o.legW || 5.5, base = Math.min(0, o.groundY ? o.groundY(p[0], p[2]) : eqTerrainY(p[0], p[2]));
    for (const s of [-1, 1]) {
      const leg = eqMesh(new THREE.BoxGeometry(legW, H - base, legW * 1.6), steel, s * (W / 2 + 1), (H + base) / 2, 0, g);
      leg.castShadow = true;
      if (o.taper) { leg.geometry = new THREE.CylinderGeometry(legW * 0.42, legW * 0.62, H - base, 4); leg.geometry.rotateY(Math.PI / 4); leg.scale.set(1, 1, 1.5); }
    }
    for (const y of o.struts || [o.deckY - 9, o.deckY + (H - o.deckY) * 0.45, H - 4]) eqMesh(new THREE.BoxGeometry(W + 2, 4, legW * 1.2), steel, 0, y, 0, g);
    if (o.xbrace) for (let k = 0; k < 3; k++) {
      const y0 = o.deckY + 6 + k * (H - o.deckY - 10) / 3, y1 = y0 + (H - o.deckY - 10) / 3, L = Math.hypot(W, y1 - y0), a = Math.atan2(y1 - y0, W);
      for (const s of [-1, 1]) { const b = eqMesh(new THREE.BoxGeometry(L, 1.6, 1.6), steel, 0, (y0 + y1) / 2, 0, g); b.rotation.z = s * a; }
    }
    eqMesh(new THREE.BoxGeometry(W + legW * 2 + 6, 6, legW * 3), dark, 0, Math.max(base, -2) + 1, 0, g);   // its pier at the waterline
    return { d, g };
  });
  // ---- the two main cables
  const cables = [];
  for (const s of [-1, 1]) {
    const pts = []; for (let d = K[0][0]; d <= K[K.length - 1][0] + 0.01; d += 8) { const p = at(d, s * (W / 2 + 1), cableY(d)); pts.push(new THREE.Vector3(p[0], p[1], p[2])); }
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 2, o.cableR || 0.9, 6, false), steel); tube.castShadow = true; root.add(tube); cables.push(tube);
  }
  // ---- deck pieces (instanced: top slab, lower slab, two truss sides; each piece moves as one)
  const seg = o.seg || 40, N = Math.ceil(o.len / seg);
  const trussTex = eqTex(eqCanvas(256, 64, (g) => { g.clearRect(0, 0, 256, 64); g.strokeStyle = '#fff'; g.lineWidth = 7; g.strokeRect(3, 3, 250, 58);
    for (let x = 0; x < 256; x += 64) { g.beginPath(); g.moveTo(x, 3); g.lineTo(x + 32, 61); g.lineTo(x + 64, 3); g.stroke(); } }), { repeat: true });
  const trussM = new THREE.MeshStandardMaterial({ color: o.color, map: trussTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.3 });
  const depth = o.double ? 9 : 7;
  const parts = [
    { g: new THREE.BoxGeometry(W, 0.9, seg - 0.3), m: eqStd('#5c5e60', 0.9), off: [0, 0, 0] },
    { g: new THREE.BoxGeometry(W - 1, 0.7, seg - 0.3), m: eqStd('#6a6c6e', 0.9), off: [0, -depth + 0.5, 0] },
    { g: new THREE.PlaneGeometry(seg, depth).rotateY(Math.PI / 2), m: trussM, off: [-W / 2, -depth / 2, 0] },
    { g: new THREE.PlaneGeometry(seg, depth).rotateY(Math.PI / 2), m: trussM, off: [W / 2, -depth / 2, 0] },
  ].map((pp) => { const I = new THREE.InstancedMesh(pp.g, pp.m, N); I.castShadow = true; I.receiveShadow = true; I.frustumCulled = false; root.add(I); return Object.assign(pp, { I }); });
  // the cars stopped on the deck (instanced boxes)
  const carsN = Math.floor(N * 2.2), carI = new THREE.InstancedMesh(new THREE.BoxGeometry(1.8, 1.4, 4.4), eqStd('#ffffff', 0.4, 0.3), carsN); carI.frustumCulled = false; carI.castShadow = true; root.add(carI);
  const carPal = ['#e8e6e0', '#2a2a30', '#8a2a24', '#3a5a7a', '#c8c4b8', '#4a4a52', '#d8b040', '#1c3a5a'], C = new THREE.Color();
  const cars = []; for (let i = 0; i < carsN; i++) { const piece = Math.floor(eqR(i, 41) * N), lane = (Math.floor(eqR(i, 43) * 4) - 1.5) * (W / 4.5), dz0 = (eqR(i, 47) - 0.5) * (seg - 6); cars.push([piece, lane, dz0]); C.set(carPal[i % carPal.length]); carI.setColorAt(i, C); }
  if (carI.instanceColor) carI.instanceColor.needsUpdate = true;
  // suspenders (every 12 m where the cable is above the deck)
  const hang = []; for (let d = K[0][0]; d < K[K.length - 1][0]; d += 12) { const h = cableY(d) - o.deckY; if (h > 3) for (const s of [-1, 1]) hang.push([d, s, h]); }
  const hangI = new THREE.InstancedMesh(new THREE.BoxGeometry(0.35, 1, 0.35), steel, hang.length); hangI.frustumCulled = false; root.add(hangI);
  const M4 = new THREE.Matrix4(), Mp = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(0, 0, 0, 'YXZ'), V = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1);
  const Z = new THREE.Matrix4().makeScale(0, 0, 0);
  const fallS = (i) => (o.fail ? o.fail(i) : Infinity);
  // the piece's matrix at story s: in place (twisting), or falling (pitched about one end, dropping into the water)
  const pieceM = (i, s, out) => {
    const d = (i + 0.5) * seg, p = at(d, 0, o.deckY), f = fallS(i), u = Math.max(0, s - f);
    let drop = 0, pitch = 0, roll = o.twist ? o.twist(s, d) : 0, side = 0;
    if (u > 0) {
      const h = o.deckY + 4, tf = Math.sqrt(2 * h / 9.8);                     // (free fall to the water)
      const k = Math.min(u, tf); drop = 4.9 * k * k + (u > tf ? Math.min(14, (u - tf) * 3) : 0);
      pitch = (eqR(i, 3) - 0.5) * 1.2 * MathX.smooth(u, 0, tf); roll += (eqR(i, 5) - 0.5) * 0.8 * MathX.smooth(u, 0, tf); side = (eqR(i, 9) - 0.5) * 6 * MathX.smooth(u, 0, tf);
    }
    V.set(p[0] + nx * side, p[1] - drop, p[2] + nz * side); E.set(pitch, yaw, roll); Q.setFromEuler(E); out.compose(V, Q, S);
    return u;
  };
  const frame = (s, lvl) => {
    const shake = lvl || 0;
    for (let i = 0; i < N; i++) {
      const u = pieceM(i, s, M4);
      // the deck rides the ground's shaking (a sway along the bridge)
      if (shake && u === 0) { const sw = Math.sin(s * 2.1 + i * 0.22) * shake * 6; M4.elements[12] += nx * sw; M4.elements[14] += nz * sw; }
      for (const pp of parts) { Mp.makeTranslation(pp.off[0], pp.off[1], pp.off[2]); Mp.premultiply(M4); pp.I.setMatrixAt(i, Mp); }
    }
    for (const pp of parts) pp.I.instanceMatrix.needsUpdate = true;
    cars.forEach(([pc, lane, dz0], i) => { pieceM(pc, s, M4); Mp.makeTranslation(lane, 1.15, dz0); Mp.premultiply(M4); carI.setMatrixAt(i, Mp); });
    carI.instanceMatrix.needsUpdate = true;
    hang.forEach(([d, sd, h], i) => {
      const pc = Math.min(N - 1, Math.floor(d / seg)), gone = s > fallS(pc) + 0.15;
      if (gone) { hangI.setMatrixAt(i, Z); return; }
      const p = at(d, sd * (W / 2 + 1), o.deckY + h / 2 + 0.5); V.set(p[0], p[1], p[2]); Q.setFromEuler(E.set(0, yaw, 0)); S.set(1, h, 1); M4.compose(V, Q, S); S.set(1, 1, 1); hangI.setMatrixAt(i, M4);
    });
    hangI.instanceMatrix.needsUpdate = true;
    for (const tw of towers) { tw.g.rotation.x = shake * 0.06 * Math.sin(s * 1.7 + tw.d * 0.01); }
  };
  frame(0, 0);
  return { root, towers, cables, parts, at, N, seg, frame, deckAt: (d) => at(d, 0, o.deckY), topAt: (k) => at(o.towers[k], 0, o.towerH) };
}

// ---------------------------------------------------------------------------------------------------------------------
function eqMarks(scene, app) {
  void app;
  const stone = new THREE.MeshStandardMaterial({ color: '#e4dccb', roughness: 0.85 });
  const out = {};
  // ===================================================================================================================
  // THE FERRY BUILDING (in the waterfront frame: u along the shore, v out over the water)
  // ===================================================================================================================
  {
    const g = eqWFGroup(scene);
    const hallTex = eqFacadeTex({ wall: '#e2d8c4', w: 512, h: 128, noise: true, rows: [[0.5, 0.95, 8, 0.62, 'arch', '#33424c'], [0.12, 0.38, 16, 0.5, 'rect', '#3a4852']], bands: [[0.44, 0.04, '#cfc4ae'], [0, 0.06, '#c9bea8']] });
    hallTex.repeat.set(10, 1);
    const hallM = new THREE.MeshStandardMaterial({ color: '#ffffff', map: hallTex, roughness: 0.85 });
    const hall = new THREE.Group(); g.add(hall);
    // the hall: 200 m along the shore, 46 m deep (v 2…48), two floors (to 17 m), a grey roof with a long skylight
    const body = eqMesh(new THREE.BoxGeometry(200, 15, 46), [hallM, hallM, stone, stone, hallM, hallM], 0, EQ_GROUND_Y + 7.5, -25, hall);
    void body;
    eqMesh(new THREE.BoxGeometry(202, 1.2, 48), eqStd('#d4cab4', 0.8), 0, EQ_GROUND_Y + 15.4, -25, hall);
    eqMesh(new THREE.BoxGeometry(196, 3.2, 40), eqStd('#7d8682', 0.7, 0.2), 0, EQ_GROUND_Y + 17.4, -25, hall);
    eqMesh(new THREE.BoxGeometry(170, 2.0, 9), eqStd('#a9c0c8', 0.2, 0.5), 0, EQ_GROUND_Y + 19.6, -25, hall);
    // pilings under the bay side
    for (let u = -96; u <= 96; u += 12) for (const v of [10, 24, 38, 48]) eqMesh(new THREE.CylinderGeometry(0.5, 0.5, 14, 8), eqStd('#4a4038', 0.9), u, -5, -v, hall);
    // the clock tower (pivot at its foot so it can sway and fall)
    const tower = new THREE.Group(); tower.position.set(0, EQ_GROUND_Y, -6); g.add(tower);
    const shaftTex = eqFacadeTex({ wall: '#e6dcc8', w: 128, h: 512, noise: true, rows: [[0.08, 0.2, 2, 0.42, 'arch', '#3a4650'], [0.3, 0.42, 2, 0.4, 'arch', '#3a4650'], [0.52, 0.64, 2, 0.4, 'arch', '#3a4650'], [0.74, 0.92, 3, 0.36, 'arch', '#3a4650']], bands: [[0.0, 0.02, '#cbbfa6'], [0.97, 0.03, '#cbbfa6']] });
    const shaftM = new THREE.MeshStandardMaterial({ map: shaftTex, roughness: 0.85 });
    eqMesh(new THREE.BoxGeometry(11.5, 44, 11.5), shaftM, 0, 22, 0, tower);
    eqMesh(new THREE.BoxGeometry(13, 1.4, 13), stone, 0, 44.6, 0, tower);
    eqMesh(new THREE.BoxGeometry(12.2, 10, 12.2), stone, 0, 50, 0, tower);
    // the four clock faces and their hands (set by frame() from the film's clock)
    const faceTex = eqTex(eqCanvas(256, 256, (c) => {
      c.fillStyle = '#f6f1e2'; c.beginPath(); c.arc(128, 128, 124, 0, 6.29); c.fill();
      c.strokeStyle = '#1c1a18'; c.lineWidth = 7; c.beginPath(); c.arc(128, 128, 120, 0, 6.29); c.stroke();
      c.fillStyle = '#1c1a18'; for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; c.save(); c.translate(128 + Math.sin(a) * 100, 128 - Math.cos(a) * 100); c.rotate(a); c.fillRect(-4, -12, 8, 24); c.restore(); }
    }), { repeat: false });
    const faceM = new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.5, emissive: '#fff8e8', emissiveIntensity: 0.12 }), handM = eqStd('#141210', 0.5, 0.3);
    const hands = [];
    for (let k = 0; k < 4; k++) {
      const f = new THREE.Group(); f.rotation.y = k * Math.PI / 2; f.position.y = 50; tower.add(f);
      const face = eqMesh(new THREE.CircleGeometry(3.6, 40), faceM, 0, 0, 6.13, f); face.castShadow = false;
      const hh = new THREE.Group(), mm = new THREE.Group(); hh.position.z = 6.18; mm.position.z = 6.21; f.add(hh); f.add(mm);
      eqMesh(new THREE.BoxGeometry(0.34, 2.1, 0.06), handM, 0, 0.85, 0, hh); eqMesh(new THREE.BoxGeometry(0.22, 3.1, 0.06), handM, 0, 1.3, 0, mm);
      hands.push([hh, mm]);
    }
    // the belfry (arched openings), the cupola, the lantern, the flag
    const belTex = eqFacadeTex({ wall: '#e6dcc8', w: 128, h: 128, rows: [[0.12, 0.9, 3, 0.5, 'arch', '#1e2428']] });
    eqMesh(new THREE.BoxGeometry(10, 9, 10), new THREE.MeshStandardMaterial({ map: belTex, roughness: 0.85 }), 0, 59.5, 0, tower);
    eqMesh(new THREE.BoxGeometry(11, 1.0, 11), stone, 0, 64.4, 0, tower);
    eqMesh(new THREE.CylinderGeometry(3.4, 4.0, 4, 8), stone, 0, 67, 0, tower);
    const dome = eqMesh(new THREE.SphereGeometry(3.4, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), eqStd('#cfc5ae', 0.7), 0, 69, 0, tower); void dome;
    eqMesh(new THREE.CylinderGeometry(0.9, 1.1, 4, 8), stone, 0, 73, 0, tower);
    eqMesh(new THREE.CylinderGeometry(0.08, 0.1, 6, 6), eqStd('#d8d8d8', 0.4, 0.6), 0, 78, 0, tower);
    const flag = eqMesh(new THREE.PlaneGeometry(2.4, 1.4), new THREE.MeshStandardMaterial({ map: eqTex(eqCanvas(64, 40, (c) => { for (let i = 0; i < 7; i++) { c.fillStyle = i % 2 ? '#fff' : '#b22234'; c.fillRect(0, i * 40 / 7, 64, 40 / 7 + 1); } c.fillStyle = '#3c3b6e'; c.fillRect(0, 0, 28, 22); }), { repeat: false }), side: THREE.DoubleSide, roughness: 0.8 }), 1.25, 80.2, 0, tower);
    flag.castShadow = false;
    out.ferry = {
      g, tower, hall, hands, flag,
      top: eqWL(0, 74, 6), clock: eqWL(0, 52, 2),
      frame(s, lvl) {
        // the clock (hour and minute hands; the film's clock runs in real time)
        const x = EQ.clock0 + s, mins = (x / 60) % 60, hrs = (x / 3600) % 12;
        for (const [hh, mm] of hands) { hh.rotation.z = -hrs / 12 * Math.PI * 2; mm.rotation.z = -mins / 60 * Math.PI * 2; }
        flag.rotation.y = 0.3 * Math.sin(s * 1.3) - 0.4; flag.position.x = 1.25 * Math.cos(flag.rotation.y);
        // the sway (about 1.2 s), then at magnitude eight it breaks at its foot and falls into the Embarcadero
        const F = EQ_FAIL.ferryTower, u = s - F;
        const sw = lvl * 0.22 * Math.sin(s * 2 * Math.PI / 1.25) + lvl * 0.08 * Math.sin(s * 2 * Math.PI / 0.7 + 1);
        if (u > 0) { const k = MathX.clamp(u / 4.2, 0, 1); tower.rotation.set(0, 0, 0); tower.rotation.x = -(k * k) * 1.45 + sw * (1 - k); tower.position.y = EQ_GROUND_Y - 6 * k * k; }
        else { tower.rotation.x = sw; tower.rotation.z = sw * 0.6; tower.position.y = EQ_GROUND_Y; }
        tower.visible = u < 9;
        // the hall's roof comes down at magnitude eight too
        const hk = MathX.clamp((s - (F + 1.5)) / 3, 0, 1); hall.scale.y = 1 - 0.72 * hk * hk; hall.position.y = 0;
      },
    };
  }
  // ===================================================================================================================
  // THE BAY BRIDGE (the West Span): the SF anchorage on Rincon Hill to Yerba Buena Island
  // ===================================================================================================================
  {
    const A = eqLL(37.788, -122.3885), B = eqLL(37.81, -122.3655), L = Math.hypot(B[0] - A[0], B[1] - A[1]), dir = [(B[0] - A[0]) / L, (B[1] - A[1]) / L];
    const bb = eqSuspension(scene, {
      A, dir, len: L, deckY: 58, width: 20, towers: [353, 1057, 1763, 2467], towerH: 160, color: '#9ea3a8', double: true, xbrace: true, legW: 6,
      cable: [[0, 62, 4], [353, 160, 85], [1057, 160, 8], [1410, 82, 8], [1763, 160, 85], [2467, 160, 4], [L, 64, 0]],
      // (1989: a piece of the upper deck fell; here two pieces near the island drop at magnitude 7, then the spans go at 9)
      fail: (i) => { const d = (i + 0.5) * 40; if (Math.abs(d - 2140) < 45) return EQ_FAIL.bayPiece + (d > 2140 ? 0.6 : 0); if (d > 300 && d < 1400) return EQ_FAIL.bayWest + Math.abs(d - 700) * 0.006; if (d >= 1400 && d < 3050) return EQ_FAIL.bayEast + Math.abs(d - 2100) * 0.005; return Infinity; },
      twist: (s, d) => (s > 270 ? Math.sin(d * 0.012 - s * 2.2) * eqLevel(s) * 0.12 : 0),
    });
    // the anchorages (concrete) and the central anchorage in the bay
    const conc = eqStd('#b9b4aa', 0.9);
    for (const [d, w, h, y0] of [[0, 40, 66, 0], [1410, 60, 86, -12], [L - 20, 50, 64, 20]]) { const p = bb.at(d); const m = eqMesh(new THREE.BoxGeometry(w, h - y0, 34), conc, p[0], (h + y0) / 2, p[2]); m.rotation.y = Math.atan2(dir[0], dir[1]); }
    // the approach: the deck carries on inland to the freeway
    { const p = bb.at(-120); const m = eqMesh(new THREE.BoxGeometry(20, 3, 240), eqStd('#8e8c88', 0.9), p[0], 56, p[2]); m.rotation.y = Math.atan2(dir[0], dir[1]);
      for (let k = 0; k < 4; k++) { const q = bb.at(-30 - k * 60); eqMesh(new THREE.CylinderGeometry(2.4, 2.8, 56, 10), conc, q[0], 28, q[2]); } }
    out.bay = Object.assign(bb, { label: bb.topAt(1), mid: bb.deckAt(2140) });
  }
  // ===================================================================================================================
  // THE GOLDEN GATE BRIDGE
  // ===================================================================================================================
  {
    const S = eqLL(37.8111, -122.4778), Nn = eqLL(37.8226, -122.479), L = Math.hypot(Nn[0] - S[0], Nn[1] - S[1]), dir = [(Nn[0] - S[0]) / L, (Nn[1] - S[1]) / L];
    const A = [S[0] - dir[0] * 343, S[1] - dir[1] * 343], len = 343 + L + 343;
    const gg = eqSuspension(scene, {
      A, dir, len, deckY: 67, width: 27, towers: [343, 343 + L], towerH: 227, color: '#c0362c', taper: true, legW: 10,
      struts: [57, 100, 140, 180, 222], cable: [[0, 70, 18], [343, 227, 152], [343 + L, 227, 18], [len, 70, 0]],
      // the main span twists, then comes down from the middle outwards
      fail: (i) => { const d = (i + 0.5) * 40; if (d < 343 + 40 || d > 343 + L - 40) return Infinity; return EQ_FAIL.gg + Math.abs(d - (343 + L / 2)) * 0.009 + eqR(i, 77) * 0.5; },
      twist: (s, d) => { if (d < 343 || d > 343 + L) return 0; const u = (d - 343) / L; return Math.sin(u * Math.PI) * Math.sin(s * 3.1 - u * 6) * MathX.smooth(s, EQ_FAIL.gg - 9, EQ_FAIL.gg - 1) * 0.16; },
    });
    const conc = eqStd('#b8b2a6', 0.9);
    for (const d of [0, len]) { const p = gg.at(d); const m = eqMesh(new THREE.BoxGeometry(36, 74, 40), conc, p[0], 37 + Math.max(0, eqTerrainY(p[0], p[2])) * 0.5, p[2]); m.rotation.y = Math.atan2(dir[0], dir[1]); }
    out.gg = Object.assign(gg, { label: gg.topAt(0), mid: gg.deckAt(343 + L / 2), L });
  }
  // ===================================================================================================================
  // THE TRANSAMERICA PYRAMID (two pieces: the top 130 m snaps off at magnitude eight), the SALESFORCE TOWER
  // ===================================================================================================================
  {
    const [x, z] = eqLL(37.7952, -122.4028), y0 = eqTerrainY(x, z);
    const winTex = eqTex(eqCanvas(128, 256, (c) => { c.fillStyle = '#f0eee6'; c.fillRect(0, 0, 128, 256); c.fillStyle = '#56646e'; for (let j = 0; j < 16; j++) for (let i = 0; i < 8; i++) c.fillRect(i * 16 + 4, j * 16 + 4, 8, 9); }), { repeat: true });
    winTex.repeat.set(5, 22);
    const pyrM = new THREE.MeshStandardMaterial({ color: '#ffffff', map: winTex, roughness: 0.6 });
    const frustum = (r0, r1, h) => { const g = new THREE.CylinderGeometry(r1, r0, h, 4, 1, false); g.rotateY(Math.PI / 4); return g; };
    const hw = (y) => MathX.lerp(26, 6.5, y / 212);                       // half-width at height y (m)
    const root = new THREE.Group(); root.position.set(x, y0, z); root.rotation.y = 0; scene.add(root);
    const low = eqMesh(frustum(hw(0) * Math.SQRT2, hw(130) * Math.SQRT2, 130), pyrM, 0, 65, 0, root);
    const top = new THREE.Group(); top.position.y = 130; root.add(top);
    eqMesh(frustum(hw(130) * Math.SQRT2, hw(212) * Math.SQRT2, 82), pyrM, 0, 41, 0, top);
    eqMesh(frustum(hw(212) * Math.SQRT2, 0.3, 48), eqStd('#f2f0ea', 0.5), 0, 82 + 24, 0, top);
    for (const s of [-1, 1]) { const w = eqMesh(frustum(6.5, 3.5, 150), pyrM, s * 21, 75, 0, root); w.scale.set(0.55, 1, 1); w.position.x = s * MathX.lerp(22, 12, 0.5); w.rotation.z = -s * 0.075; }
    out.pyramid = {
      root, top, low, label: [x, y0 + 262, z], base: [x, y0, z], break: [x, y0 + 130, z],
      frame(s, lvl) {
        const u = s - EQ_FAIL.pyramid, sw = lvl * 0.05 * Math.sin(s * 2 * Math.PI / 4.2);
        root.rotation.z = sw; root.rotation.x = sw * 0.5;
        if (u > 0) { const k = MathX.clamp(u / 5.5, 0, 1), kk = k * k, dk = Math.max(0, k - 0.55) / 0.45; top.rotation.z = -1.35 * kk; top.rotation.x = 0.2 * kk; top.position.set(14 * kk, 130 - 95 * dk * dk, 0); }
        else { top.rotation.set(0, 0, sw * 1.6); top.position.set(0, 130, 0); }
        top.visible = u < 8;
      },
    };
  }
  {
    const [x, z] = eqLL(37.7898, -122.3968), y0 = eqTerrainY(x, z);
    const glT = eqTex(eqCanvas(128, 256, (c) => { c.fillStyle = '#9fb6c6'; c.fillRect(0, 0, 128, 256); for (let j = 0; j < 32; j++) { c.fillStyle = j % 2 ? '#e8ecee' : '#dde3e6'; c.fillRect(0, j * 8, 128, 2); } c.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 16; i++) c.fillRect(i * 8, 0, 1.5, 256); }), { repeat: true });
    glT.repeat.set(1 / 24, 1 / 67);                                       // (extruded sides: uv in metres)
    const m = new THREE.MeshStandardMaterial({ color: '#ffffff', map: glT, roughness: 0.25, metalness: 0.35 });
    const root = new THREE.Group(); root.position.set(x, y0, z); scene.add(root);
    eqMesh(eqRoundBox(52, 292, 52, 9, 0, 3), m, 0, 0, 0, root);                // (eqRoundBox stands on y = 0)
    const crown = eqMesh(eqRoundBox(48, 34, 48, 8, 0, 3), new THREE.MeshStandardMaterial({ color: '#e8ecee', roughness: 0.4, metalness: 0.2, transparent: true, opacity: 0.55, depthWrite: false }), 0, 292, 0, root);
    crown.castShadow = false;
    out.salesforce = { root, label: [x, y0 + 330, z], frame(s, lvl) { const u = s - EQ_FAIL.salesforce, sw = lvl * 0.06 * Math.sin(s * 2 * Math.PI / 5.5 + 1);
      if (u > 0) { const k = MathX.clamp(u / 7, 0, 1); root.rotation.z = 1.2 * k * k; root.rotation.x = 0.3 * k * k; root.position.y = y0 - 40 * k * k; } else { root.rotation.set(sw * 0.5, 0, sw); root.position.y = y0; }
      root.visible = u < 10; } };
  }
  // ===================================================================================================================
  // COIT TOWER, ALCATRAZ, SUTRO TOWER
  // ===================================================================================================================
  {
    const [x, z] = eqLL(37.8024, -122.4058), y0 = eqTerrainY(x, z);
    const fl = eqTex(eqCanvas(256, 64, (c) => { c.fillStyle = '#ece6d6'; c.fillRect(0, 0, 256, 64); c.fillStyle = 'rgba(120,110,90,0.25)'; for (let i = 0; i < 24; i++) c.fillRect(i * 256 / 24, 0, 3, 64); }), { repeat: true });
    const m = new THREE.MeshStandardMaterial({ map: fl, roughness: 0.85 });
    const root = new THREE.Group(); root.position.set(x, y0, z); scene.add(root);
    eqMesh(new THREE.CylinderGeometry(5.5, 5.8, 58, 24), m, 0, 29, 0, root);
    eqMesh(new THREE.CylinderGeometry(6.2, 6.2, 5, 24), new THREE.MeshStandardMaterial({ map: eqFacadeTex({ wall: '#ece6d6', w: 256, h: 64, rows: [[0.2, 0.9, 12, 0.5, 'arch', '#2e2a26']] }), roughness: 0.85 }), 0, 60.5, 0, root);
    eqMesh(new THREE.BoxGeometry(30, 6, 22), eqStd('#e2dccb', 0.9), 0, 3, 0, root);
    out.coit = { root, label: [x, y0 + 66, z], frame(s, lvl) { const u = s - EQ_FAIL.coit; root.rotation.z = u > 0 ? 1.4 * MathX.clamp(u / 4, 0, 1) ** 2 : lvl * 0.05 * Math.sin(s * 5); root.visible = u < 6; } };
  }
  {
    const [x, z] = eqLL(37.8267, -122.423);
    const root = new THREE.Group(); root.position.set(x, 0, z); root.rotation.y = -0.65; scene.add(root);
    const g = new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), P = g.attributes.position;
    for (let i = 0; i < P.count; i++) { const px = P.getX(i), py = P.getY(i), pz = P.getZ(i), n = 0.85 + 0.25 * noise1(px * 3.1 + pz * 2.3, 5); P.setXYZ(i, px * 260 * (0.95 + 0.08 * n), Math.pow(Math.max(0, py), 0.55) * 41 * n - 3, pz * 92 * (0.95 + 0.08 * n)); }
    g.computeVertexNormals();
    eqMesh(g, eqStd('#7d7464', 0.95), 0, 0, 0, root);
    eqMesh(new THREE.BoxGeometry(152, 14, 30), eqStd('#e6e0d0', 0.85), 10, 44, 0, root);
    eqMesh(new THREE.BoxGeometry(150, 1.4, 31), eqStd('#9a948a', 0.8), 10, 51.5, 0, root);
    eqMesh(new THREE.CylinderGeometry(1.6, 2.2, 26, 8), eqStd('#f2efe6', 0.6), -70, 50, 4, root);
    eqMesh(new THREE.CylinderGeometry(6, 6, 9, 12), eqStd('#d8d2c2', 0.8), 120, 44, -18, root);
    out.alcatraz = { root, label: [x, 70, z] };
  }
  {
    const [x, z] = eqLL(37.7552, -122.4528), y0 = eqTerrainY(x, z);
    const root = new THREE.Group(); root.position.set(x, y0, z); scene.add(root);
    const red = eqStd('#c8382c', 0.6, 0.2), white = eqStd('#f2f0ea', 0.6, 0.2);
    const legs = [0, 1, 2].map((k) => { const a = k * Math.PI * 2 / 3 + 0.3; return [Math.cos(a), Math.sin(a)]; });
    for (const [cx, cz] of legs) for (let j = 0; j < 10; j++) {
      const y0j = j * 29.8, y1j = y0j + 29.8, r0 = MathX.lerp(30, 9, Math.min(1, y0j / 160)), r1 = MathX.lerp(30, 9, Math.min(1, y1j / 160));
      eqStrut(eqMesh(new THREE.CylinderGeometry(1.4, 1.4, 1, 6), j % 2 ? white : red, 0, 0, 0, root), [cx * r0, y0j, cz * r0], [cx * r1, y1j, cz * r1], 1.4);
    }
    for (const [y, L] of [[160, 46], [292, 62]]) { const b = eqMesh(new THREE.BoxGeometry(L, 4, 4), red, 0, y, 0, root); b.rotation.y = 0.3; }
    out.sutro = { root, label: [x, y0 + 300, z] };
  }
  out.frame = (s, lvl) => { out.ferry.frame(s, lvl); out.bay.frame(s, lvl); out.gg.frame(s, lvl * 0.6); out.pyramid.frame(s, lvl); out.salesforce.frame(s, lvl); out.coit.frame(s, lvl); };
  return out;
}

// when the landmarks fail (story seconds; shots.js shows each one)
const EQ_FAIL = {
  bayPiece: 289.5,           // minute 5 (magnitude 7): a piece of the deck drops (as in 1989)
  ferryTower: 303.2,         // minute 6 (8): the clock tower comes down
  pyramid: eqWord('pyramid', 'not').start - EQ.tick0 + 0.35,   // "Not this one."
  gg: 336.5,                 // the Golden Gate's main span
  bayWest: 364.5, bayEast: 366.5,
  coit: 362.0,
  salesforce: 422.5,
};
