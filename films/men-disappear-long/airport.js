/* =====================================================================
   AIRPORT — on the valley floor east of the river: runway 18/36 (its markings in its own map: threshold bars,
   numbers, the touchdown zone, the centreline), the edge lights, the approach lights, the localiser aerial (the radio
   beam the autoland follows), the terminal with its jet bridges and four parked airliners, two hangars, stopped
   vehicles on the apron, and the control tower: its shaft, and its glass cab with nine desks (seven empty, a headset
   left on each), the radar screen, the two controllers who are left.
     mgBuildAirport(S) → AP ; AP.update(s, o)
   No coplanar faces: the runway lies 12 cm over the levelled ground with a polygon offset; the aprons and taxiways
   are painted into the ground's map.
   ===================================================================== */

function mgRunwayCanvas() {
  const R = MG_V.runway, L = R.z[1] - R.z[0] + 60, W = 256, H = 4096, k = H / L, rr = new RNG(18);
  return mgCanvas(W, H, (g) => {
    const Z = (z) => (z - (R.z[0] - 30)) * k, X = (x) => (x / R.w + 0.5) * W;
    g.fillStyle = '#3f4043'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${rr.next() < 0.5 ? '255,255,255' : '0,0,0'},0.05)`; g.fillRect(rr.range(0, W), rr.range(0, H), 2, 2); }
    // rubber at both touchdown zones
    for (const [a, b] of [[R.z[0] + 200, R.z[0] + 800], [R.z[1] - 800, R.z[1] - 200]]) { g.fillStyle = 'rgba(15,15,16,0.35)'; g.fillRect(X(-9), Z(a), X(9) - X(-9), (b - a) * k); }
    g.fillStyle = '#e9e7e0';
    g.fillRect(X(-22), 0, 2, H); g.fillRect(X(22) - 2, 0, 2, H);                                   // side stripes
    for (let z = R.z[0] + 120; z < R.z[1] - 120; z += 50) g.fillRect(X(-0.45), Z(z), X(0.45) - X(-0.45), 30 * k);   // centreline
    const ends = [[R.z[0], 1], [R.z[1], -1]];
    for (const [z0, d] of ends) {
      for (let i = 0; i < 8; i++) for (const sd of [-1, 1]) g.fillRect(X(sd * (3 + i * 2.4)) - (sd < 0 ? 1.8 * W / R.w : 0), Z(z0 + d * 6) - (d < 0 ? 30 * k : 0), 1.8 * W / R.w, 30 * k);   // the threshold bars
      for (const dz of [150, 300, 450]) for (const sd of [-1, 1]) g.fillRect(X(sd * 7) - (sd < 0 ? 6 * W / R.w : 0), Z(z0 + d * dz), 6 * W / R.w, 22 * k);   // touchdown zone
      for (const sd of [-1, 1]) g.fillRect(X(sd * 9) - (sd < 0 ? 10 * W / R.w : 0), Z(z0 + d * 330), 10 * W / R.w, 45 * k);                         // aiming point
      // the runway's number, read by a plane landing over this end
      g.save(); g.translate(W / 2, Z(z0 + d * 80)); if (d > 0) g.rotate(Math.PI); g.scale(1, 3.2); g.font = '700 70px sans-serif'; g.textAlign = 'center'; g.fillText(d > 0 ? '18' : '36', 0, 22); g.restore();
    }
  });
}

// the radar: range rings, the runway and its extended centreline, the planes (2207 highlighted), their tags
function mgDrawRadar(g, w, h, st) {
  g.fillStyle = '#04110c'; g.fillRect(0, 0, w, h);
  const cx = w * 0.5, cy = h * 0.52, sc = (h * 0.45) / 25000;       // 25 km to the top
  const T = MG_V.tower;
  g.strokeStyle = 'rgba(80,200,140,0.25)'; g.lineWidth = 1;
  for (let r = 10000; r <= 50000; r += 10000) { g.beginPath(); g.arc(cx, cy, r * sc, 0, 6.29); g.stroke(); }
  g.strokeStyle = 'rgba(200,230,210,0.6)'; g.lineWidth = 2; const R = MG_V.runway;
  g.beginPath(); g.moveTo(cx + (R.x - T[0]) * sc, cy + (R.z[0] - T[2]) * sc); g.lineTo(cx + (R.x - T[0]) * sc, cy + (R.z[1] - T[2]) * sc); g.stroke();
  g.setLineDash([6, 8]); g.strokeStyle = 'rgba(120,200,160,0.4)'; g.beginPath(); g.moveTo(cx + (R.x - T[0]) * sc, cy + (R.z[0] - T[2]) * sc); g.lineTo(cx + (R.x - T[0]) * sc, cy + (R.z[0] - 30000 - T[2]) * sc); g.stroke(); g.setLineDash([]);
  g.font = '600 11px monospace';
  for (const p of [...st.planes].sort((a, b) => (a.id === 'NRD2207') - (b.id === 'NRD2207'))) {   // (2207 drawn last, on top)
    const x = cx + (p.x - T[0]) * sc, y = cy + (p.z - T[2]) * sc; if (x < -20 || x > w + 20 || y < -20 || y > h + 20) continue;
    const hot = p.id === 'NRD2207';
    if (hot) { g.fillStyle = 'rgba(4,17,12,0.92)'; g.fillRect(x + 8, y - 24, 64, 30); }
    g.fillStyle = hot ? '#ffcf5a' : '#7cf0b0'; g.fillRect(x - 3, y - 3, 6, 6);
    g.strokeStyle = hot ? '#ffcf5a' : 'rgba(124,240,176,0.6)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 9, y - 9); g.stroke();
    g.fillText(p.id, x + 11, y - 11); g.fillText(String(Math.round(p.y * 3.281 / 100)).padStart(3, '0') + (p.noPilot ? ' ⚠' : ''), x + 11, y + 1);
  }
  g.fillStyle = '#7cf0b0'; g.font = '600 15px monospace'; g.fillText(st.clock, 12, 22); g.fillText(`TRAFFIC ${st.planes.length}`, w - 140, 22);
}
// the other planes the tower can see: straight on their autopilots early on; later circling in holds (the tower has
// stacked them: 23 others by 9:47)
function mgTraffic(s) {
  const out = [], r = (i, k) => mgR(i * 31 + k, 707);
  out.push(Object.assign({ id: 'NRD2207', noPilot: true }, (() => { const q = mgPlaneAt(s); return { x: q.p[0], y: q.p[1], z: q.p[2] }; })()));
  const n = s < 3000 ? 11 : MGP.circling - 1, ids = ['EZR4421', 'LUX817', 'SKY290', 'ALP5520', 'TRN112', 'BLT733', 'VRN61', 'KLR908', 'NRD415', 'HLV226', 'ATX19', 'MRL350', 'SWR184', 'OBR772', 'DNB45', 'FRA600', 'CTL321', 'NRD118', 'IBX902', 'WND77', 'PLZ410', 'GRV12', 'TAU881'];
  for (let i = 0; i < n; i++) {
    if (s < 3000) { const a = r(i, 1) * 6.28, v = 200 + 40 * r(i, 2), x0 = -40000 + 80000 * r(i, 3), z0 = -40000 + 80000 * r(i, 4); out.push({ id: ids[i], x: x0 + Math.sin(a) * v * s * 0.2 % 60000, z: z0 - Math.cos(a) * v * s * 0.2 % 60000, y: 8000 + 4000 * r(i, 5), noPilot: r(i, 6) < 0.9 }); }
    else { const c = [600 + (r(i, 1) - 0.5) * 36000, 0, 3000 + (r(i, 2) - 0.5) * 26000], per = 240 + 100 * r(i, 3), a = (s / per + r(i, 4)) * 6.283, R = 1600 + 800 * r(i, 5);   // (the holding stacks round the airport)
      out.push({ id: ids[i], x: c[0] + R * Math.cos(a), z: c[2] + 2.2 * R * Math.sin(a), y: 1800 + 300 * (i % 12), h: Math.atan2(-R * Math.sin(a), -2.2 * R * Math.cos(a)), noPilot: true }); }
  }
  return out;
}

function mgBuildAirport(S) {
  const R = MG_V.runway, T = MG_V.tower, B = mgBatch(), AP = {};
  // ---- the runway
  { const L = R.z[1] - R.z[0] + 60, tex = mgTex(mgRunwayCanvas(), { repeat: false, aniso: 16 }); tex.flipY = false; tex.needsUpdate = true;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(R.w, L, 1, Math.ceil(L / 50)), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 }));
    m.rotation.x = -Math.PI / 2; m.position.set(R.x, 0.12, (R.z[0] + R.z[1]) / 2); m.receiveShadow = true; S.scene.add(m);
    // (a plane facing up is drawn with v = 0 at its bottom edge, which after the rotation is its +z end: flip so the map's top row is north)
    const uv = m.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i)); uv.needsUpdate = true;
    AP.runway = m; }
  // ---- the edge lights (every 60 m), the approach lights (bars every 30 m for 900 m north of the threshold), PAPI
  { const pts = [];
    for (let z = R.z[0]; z <= R.z[1]; z += 60) for (const sd of [-1, 1]) pts.push([R.x + sd * 23.5, 0.35, z, 0.35]);
    for (let z = R.z[0] - 900; z < R.z[0] - 20; z += 30) for (let k = -2; k <= 2; k++) pts.push([R.x + k * 2.4, 0.9 + 0.0005 * (R.z[0] - z), z, 0.45]);
    for (let k = 0; k < 4; k++) pts.push([R.x - 32 - k * 9, 0.6, R.z[0] + 330, 0.5]);
    const g = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), new THREE.MeshBasicMaterial({ color: '#fff4dc' }), pts.length), o = new THREE.Object3D();
    pts.forEach(([x, y, z, r0], i) => { o.position.set(x, y, z); o.scale.setScalar(r0); o.updateMatrix(); g.setMatrixAt(i, o.matrix); }); S.scene.add(g); AP.lights = g;
    for (let z = R.z[0] - 900; z < R.z[0] - 20; z += 30) B.box(12, 0.12, 0.12, mgStd('#6a6e72', 0.6, 0.4), R.x, 0.8 + 0.0005 * (R.z[0] - z), z), B.box(0.14, 1.0 + 0.0005 * (R.z[0] - z), 0.14, mgStd('#6a6e72', 0.6, 0.4), R.x, 0.4, z); }
  // ---- the localiser (the beam the autoland follows): a row of aerials 300 m past the far end
  for (let k = -6; k <= 6; k++) B.box(0.18, 2.4, 0.18, mgStd('#d24a2a', 0.6), R.x + k * 2.2, 1.2, R.z[1] + 300);
  B.box(28, 0.25, 0.4, mgStd('#8a8e92', 0.5, 0.5), R.x, 2.3, R.z[1] + 300);
  // ---- the terminal, jet bridges, hangars
  { const TT = MG_V.terminal, gl = mgStd('#4a5a6a', 0.15, 0.6), wl = mgStd('#d8d6d0', 0.7), rf = mgStd('#8a8c90', 0.6, 0.3), cx = (TT.x[0] + TT.x[1]) / 2, cz = (TT.z[0] + TT.z[1]) / 2;
    B.box(TT.x[1] - TT.x[0], TT.h, TT.z[1] - TT.z[0], wl, cx, TT.h / 2 - 0.3, cz); B.box(0.8, TT.h * 0.6, TT.z[1] - TT.z[0] - 10, gl, TT.x[0] - 0.3, TT.h * 0.5, cz);
    B.box(TT.x[1] - TT.x[0] + 8, 1.2, TT.z[1] - TT.z[0] + 8, rf, cx, TT.h + 0.3, cz);
    for (let i = 0; i < 4; i++) { const z = 2700 + i * 190; B.box(34, 3.4, 4, wl, TT.x[0] - 17, 6.5, z); B.box(1.2, 5, 1.2, rf, TT.x[0] - 30, 2.5, z); }
    for (const z of [3850, 4000]) { B.add(new THREE.CylinderGeometry(30, 30, 70, 20, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateY(Math.PI / 2).scale(1, 0.55, 1).translate(1100, -0.3, z), rf); } }
  // ---- the control tower: the shaft, the service floor, the cab (floor slab, desks, glass, roof)
  { const [x, , z] = T, H = MG_V.towerH, cr = MG_V.cabR, cm = mgStd('#d7d4cc', 0.7), dk = mgStd('#2a2e34', 0.5, 0.3);
    B.cyl(3.0, 3.6, H - 2, cm, x, (H - 2) / 2 - 0.3, z, 20);
    B.cyl(5.4, 4.2, 2.4, cm, x, H - 1.2, z, 8);                                   // the floor under the cab
    B.cyl(cr + 0.6, cr + 0.6, 0.5, cm, x, H + 3.6, z, 8);                          // the cab's roof
    B.cyl(cr + 0.2, cr + 0.2, 0.25, dk, x, H + 0.05, z, 8);                        // the cab's floor
    for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * Math.PI * 2; B.add(new THREE.BoxGeometry(0.16, 3.4, 0.16).applyMatrix4(Geo.matrix(x + Math.cos(a) * (cr + 0.25), H + 1.9, z + Math.sin(a) * (cr + 0.25), 0, -a, 0)).applyMatrix4(new THREE.Matrix4()), dk); }
    B.cyl(0.08, 0.08, 6, mgStd('#c8c8c8', 0.4, 0.6), x + 2, H + 6.8, z, 6); B.cyl(0.6, 0.6, 0.3, mgStd('#c8c8c8', 0.4, 0.6), x - 2, H + 4.1, z, 12);
    // the glass (eight panes leaning out): tinted, faintly reflective, drawn from both sides
    const glass = new THREE.MeshStandardMaterial({ color: '#7a9aa8', roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.5 });
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, w = 2 * (cr + 0.25) * Math.tan(Math.PI / 8) - 0.1, p = new THREE.Mesh(new THREE.PlaneGeometry(w, 3.2), glass);
      p.position.set(x + Math.cos(a) * (cr + 0.32), H + 1.9, z + Math.sin(a) * (cr + 0.32)); p.rotation.order = 'YXZ'; p.rotation.y = Math.PI / 2 - a; p.rotation.x = -0.12; p.renderOrder = 3; S.scene.add(p); }
    // the desks: a ring of consoles facing out, a chair at each; seven empty (a headset left on the desk)
    const desk = mgStd('#5a5f66', 0.6, 0.2), top = mgStd('#2f3238', 0.5), scr = new THREE.MeshBasicMaterial({ color: '#0d2a1e' });
    AP.desks = [];
    for (let k = 0; k < 9; k++) { const a = (k - 4) / 9 * Math.PI * 1.7 + Math.PI, dx = Math.cos(a), dz = Math.sin(a), px = x + dx * (cr - 1.1), pz = z + dz * (cr - 1.1);
      B.add(new THREE.BoxGeometry(0.75, 0.95, 1.6).applyMatrix4(Geo.matrix(px, H + 0.5, pz, 0, -a, 0)), desk);
      B.add(new THREE.BoxGeometry(0.85, 0.05, 1.7).applyMatrix4(Geo.matrix(px - dx * 0.05, H + 1.0, pz - dz * 0.05, 0, -a, 0)), top);
      B.add(new THREE.BoxGeometry(0.06, 0.42, 0.6).applyMatrix4(Geo.matrix(px + dx * 0.2, H + 1.27, pz + dz * 0.2, 0, -a, -0.25)), dk);
      const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.36), scr); sc.position.set(px + dx * 0.16, H + 1.27, pz + dz * 0.16); sc.rotation.order = 'YXZ'; sc.rotation.y = -a - Math.PI / 2; sc.rotation.x = 0.25; S.scene.add(sc);
      // the chair
      const cxp = x + dx * (cr - 2.15), czp = z + dz * (cr - 2.15);
      B.add(new THREE.CylinderGeometry(0.26, 0.26, 0.1, 10).translate(cxp, H + 0.5, czp), dk); B.add(new THREE.BoxGeometry(0.1, 0.55, 0.46).applyMatrix4(Geo.matrix(cxp - dx * 0.27, H + 0.82, czp - dz * 0.27, 0, -a, 0)), dk); B.cyl(0.04, 0.04, 0.45, dk, cxp, H + 0.25, czp, 6);
      AP.desks.push({ a, px, pz, cxp, czp, dx, dz });
      if (k !== 3 && k !== 5) { const hs = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 6, 16, Math.PI), dk); hs.position.set(px - dx * 0.15 + dz * 0.4, H + 1.06, pz - dz * 0.15 - dx * 0.4); hs.rotation.x = -Math.PI / 2; S.scene.add(hs); }
    }
    // the big radar screen (on the desk facing north-west), its texture redrawn every half second
    AP.radar = mgCanvasTex(512, 512, mgDrawRadar);
    const d = AP.desks[4], rs = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), new THREE.MeshBasicMaterial({ map: AP.radar.tex }));
    rs.position.set(d.px + d.dx * 0.22, H + 1.62, d.pz + d.dz * 0.22); rs.rotation.order = 'YXZ'; rs.rotation.y = -d.a - Math.PI / 2; rs.rotation.x = 0.12; S.scene.add(rs); AP.radarMesh = rs;
    B.add(new THREE.BoxGeometry(0.08, 1.05, 1.05).applyMatrix4(Geo.matrix(d.px + d.dx * 0.27, H + 1.62, d.pz + d.dz * 0.27, 0, -d.a, -0.12)), dk);
    // the light inside the cab
    AP.cabLight = new THREE.PointLight('#e8eef8', 1.6, 14, 1.4); AP.cabLight.position.set(x, H + 3.1, z); S.scene.add(AP.cabLight);
    // the two controllers who are left (at desks 3 and 5), headsets on
    AP.ctl = [3, 5].map((k, i) => { const dsk = AP.desks[k], p = mgPerson(i ? 'mgCtl2' : 'mgCtl1', S.scene, { id: 'ctl' + i }); p.desk = dsk;
      const hs = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.014, 6, 16, Math.PI), dk); hs.position.set(0, 0.04, 0); hs.rotation.z = 0; p.j.head.add(hs);
      const mic = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.1), dk); mic.position.set(0.1, -0.08, 0.06); mic.rotation.y = 0.6; p.j.head.add(mic); return p; }); }
  // ---- four parked airliners at the gates, nose in (facing east), and stopped vehicles on the apron
  AP.parked = [];
  { const proto = mgBuildAirliner(); proto.update(0, { gear: 1 });
    for (let i = 0; i < 4; i++) { const a = proto.clone(); a.position.set(MG_V.terminal.x[0] - 50, MG_PL.gear, 2700 + i * 190); a.rotation.y = 0; S.scene.add(a); AP.parked.push(a); }
    const vm = [mgStd('#e8c23a', 0.6), mgStd('#f0f0ea', 0.6), mgStd('#3a6ad0', 0.6)], r = new RNG(66);
    for (let i = 0; i < 14; i++) { const x = r.range(880, 1140), z = r.range(2550, 3500); B.box(r.range(3, 8), r.range(1.6, 2.8), 2.2, vm[r.int(0, 2)], x, 1.0, z, r.range(0, 3.14)); } }
  B.build(S.scene);
  AP.update = (s, o = {}) => {
    if (o.radar) AP.radar.update({ planes: mgTraffic(Math.round(s * 2) / 2).map((p) => ({ id: p.id, x: Math.round(p.x), y: Math.round(p.y), z: Math.round(p.z), noPilot: p.noPilot })), clock: (() => { const c = mgClockParts(s); return `${String(c.h).padStart(2, '0')}:${String(c.m).padStart(2, '0')}:${String(c.sec).padStart(2, '0')}`; })() });
  };
  return AP;
}
