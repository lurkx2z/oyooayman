/* =====================================================================
   PLANE — flight 2207: a twin-engine narrow-body airliner (a made-up airline, "NORDAIR"), its path through the
   morning, and its inside: the cockpit (two empty seats, the yokes moving on their own, the screens, the autopilot
   panel) and the cabin (28 rows, the passengers who are left, the bags and coats in the empty seats, the cockpit
   door with its keypad).
     mgBuildAirliner(o) → A (a group; A.update(s, o)) · mgPlaneAt(s) → { p, h, pitch, roll, v, gear, flaps, phase }
   Plane-local axes: x forward, y up, z right. The path: cruise at 11,000 m northbound over the viaduct (7:43),
   then (talked round by the tower) a holding pattern north of the airport at 1,200 m, then the straight-in
   approach to runway 18 down the 3° radio beam, over the motorway, the flare and the touchdown at MG.sTD.
   ===================================================================== */

const MG_TAN3 = Math.tan(3 * Math.PI / 180);
const MG_FL = { cruiseY: 11000, cruiseV: 230, x0: 300, hold: { c: [600, 1200, -24000], L: 8000, R: 2500, v: 105 }, vApp: 72, zThr: 1800, zTD: 2120, decel: 2.2, appS: 330 };
// the approach (the last appS seconds before touchdown and the rollout): along the runway's centreline, down the beam
function mgApproach(s) {
  const F = MG_FL, R = MG_V.runway, dt = s - MG.sTD;
  if (dt <= 0) {
    const z = F.zTD + F.vApp * dt, beam = (F.zThr - z) * MG_TAN3 + 15, flare = MathX.smooth(z, F.zThr - 450, F.zTD);
    const y = MathX.lerp(beam, 0, flare) + MG_PL.gear * flare;
    return { p: [R.x, Math.max(MG_PL.gear, y + (1 - flare) * MG_PL.gear), z], h: Math.PI, pitch: MathX.deg(2.6 + 2.6 * Math.sin(Math.PI * MathX.clamp((z - (F.zThr - 450)) / 770, 0, 1)) * (1 - MathX.smooth(z, F.zTD - 20, F.zTD))), roll: 0, v: F.vApp, phase: 'app' };
  }
  const tStop = F.vApp / F.decel, u = Math.min(dt, tStop), z = F.zTD + F.vApp * u - 0.5 * F.decel * u * u;
  return { p: [R.x, MG_PL.gear, z], h: Math.PI, pitch: MathX.deg(4.5) * Math.max(0, 1 - dt / 3.5), roll: 0, v: Math.max(0, F.vApp - F.decel * dt), phase: 'roll' };
}
// the holding pattern: a racetrack north of the airport (legs north-south), flown anticlockwise seen from above
function mgHold(s) {
  const H = MG_FL.hold, per = (2 * H.L + 2 * Math.PI * H.R) / H.v, u = (((s / per) % 1) + 1) % 1 * (2 * H.L + 2 * Math.PI * H.R);
  const [cx, cy, cz] = H.c, a = Math.PI * H.R;
  let x, z, h, roll = 0;
  if (u < H.L) { x = cx - H.R; z = cz + H.L / 2 - u; h = 0; }                                     // west leg, northbound
  else if (u < H.L + a) { const th = (u - H.L) / H.R; x = cx - H.R * Math.cos(th); z = cz - H.L / 2 - H.R * Math.sin(th); h = th; roll = 0.42; }   // turn east (right)
  else if (u < 2 * H.L + a) { x = cx + H.R; z = cz - H.L / 2 + (u - H.L - a); h = Math.PI; }     // east leg, southbound
  else { const th = (u - 2 * H.L - a) / H.R; x = cx + H.R * Math.cos(th); z = cz + H.L / 2 + H.R * Math.sin(th); h = Math.PI + th; roll = 0.42; }
  return { p: [x, cy, z], h, pitch: MathX.deg(1.5), roll, v: H.v, phase: 'hold' };
}
function mgPlaneAt(s) {
  const F = MG_FL;
  if (s < 700) { const z = -F.cruiseV * (s - MG.sOverhead); return { p: [F.x0 + 0.03 * z, F.cruiseY, z], h: -0.03, pitch: MathX.deg(2.2), roll: 0, v: F.cruiseV, phase: 'cruise' }; }
  const sAp = MG.sTD - F.appS;
  if (s >= sAp) return mgApproach(s);
  const hd = mgHold(s);
  if (s > sAp - 140) {                                  // the turn on to the beam: blend the hold into the approach
    const a = mgApproach(s), k = MathX.smooth(s, sAp - 140, sAp), p = [MathX.lerp(hd.p[0], a.p[0], k), MathX.lerp(hd.p[1], a.p[1], k), MathX.lerp(hd.p[2], a.p[2], k)];
    const q = mgApproach(s + 0.5), q0 = mgHold(s + 0.5), p2 = [MathX.lerp(q0.p[0], q.p[0], k), 0, MathX.lerp(q0.p[2], q.p[2], k)];
    return { p, h: Math.atan2(p2[0] - p[0], -(p2[2] - p[2])), pitch: hd.pitch, roll: hd.roll * (1 - k), v: hd.v, phase: 'turn' };
  }
  return hd;
}
// gear and flaps (0…1): set during the autoland checklist
const mgGearAt = (s) => MathX.smooth(s, MG.sFlap + 4, MG.sFlap + 14);
const mgFlapAt = (s) => MathX.smooth(s, MG.sFlap - 6, MG.sFlap + 6) * 0.6 + 0.4 * MathX.smooth(s, MG.sFlap + 20, MG.sFlap + 40);

// the livery on the fuselage loft (u around: 0 = bottom … 0.5 = top on the right side; v along, 0 = tail): white,
// a deep red cheat line and blue belly, the windows, the name
function mgLiveryCanvas(o = {}) {
  return mgCanvas(2048, 512, (g, W, H) => {
    // (the loft's u goes round the body: u = k/sides; v along from the tail to the nose; the canvas x = v, y = u)
    g.fillStyle = '#f2f1ec'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#2a3e6a'; g.fillRect(0, 0, W, H * 0.16); g.fillRect(0, H * 0.84, W, H * 0.16);      // belly
    g.fillStyle = '#b0282c'; for (const y of [0.29, 0.66]) g.fillRect(0, H * y, W, H * 0.022);
    // the windows (both sides): a row of small dark ovals; the doors' outlines
    g.fillStyle = '#1e2733';
    for (const yc of [0.355, 0.645]) for (let x = 0.2; x < 0.86; x += 0.0165) { g.beginPath(); g.ellipse(x * W, yc * H, 5, 8, 0, 0, 6.29); g.fill(); }
    g.strokeStyle = 'rgba(80,80,80,0.6)'; g.lineWidth = 2; for (const x of [0.17, 0.885]) for (const yc of [0.36, 0.64]) g.strokeRect(x * W - 10, yc * H - 34, 20, 60);
    // the cockpit windows at the nose (top front)
    g.fillStyle = '#18202a'; for (const yc of [0.41, 0.59]) { g.beginPath(); g.moveTo(0.935 * W, (yc - 0.03) * H); g.lineTo(0.965 * W, (yc - 0.02) * H); g.lineTo(0.965 * W, (yc + 0.03) * H); g.lineTo(0.935 * W, (yc + 0.03) * H); g.fill(); }
    // the name, both sides
    g.fillStyle = '#2a3e6a'; g.font = '700 54px sans-serif';
    g.save(); g.translate(0.52 * W, 0.42 * H); g.scale(1, -1); g.fillText('NORDAIR', -110, 0); g.restore();
    g.fillText('NORDAIR', 0.42 * W, 0.62 * H);
    void o;
  });
}

function mgBuildAirliner(o = {}) {
  const A = new THREE.Group(), P = MG_PL, M = {
    body: new THREE.MeshStandardMaterial({ map: mgTex(mgLiveryCanvas(), { repeat: false }), roughness: 0.38, metalness: 0.1, envMapIntensity: 1.2 }),
    white: mgStd('#ecebe6', 0.42, 0.1), grey: mgStd('#b9bcc0', 0.45, 0.4), dark: mgStd('#2b2f35', 0.5, 0.3), blue: mgStd('#2a3e6a', 0.45, 0.1),
    tyre: mgStd('#1b1b1d', 0.8), metal: mgStd('#9fa5ab', 0.3, 0.8), red: new THREE.MeshBasicMaterial({ color: '#ff3a2a' }), green: new THREE.MeshBasicMaterial({ color: '#3aff6a' }), strobe: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
  };
  // ---- the fuselage: a loft from the tail cone to the nose (rings [x, y, z, rz, ry]: the loft's ellipse half-widths)
  const R = P.R, rings = [[-20.5, 0.9, 0, 0.12, 0.12], [-19.6, 0.75, 0, 0.42, 0.5], [-17.5, 0.42, 0, 1.05, 1.25], [-14.5, 0.12, 0, 1.6, 1.75], [-11, 0, 0, R, R], [8, 0, 0, R, R], [11.5, -0.05, 0, R * 0.98, R * 0.97],
    [14, -0.18, 0, R * 0.86, R * 0.86], [15.6, -0.32, 0, R * 0.7, R * 0.68], [16.7, -0.45, 0, R * 0.48, R * 0.45], [17.3, -0.55, 0, 0.26, 0.24], [17.5, -0.6, 0, 0.05, 0.05]];
  const fus = new THREE.Mesh(mgLoft(rings, 28, 0.2), M.body); fus.castShadow = fus.receiveShadow = true;
  // (the loft's uv: u round the body, v along it; the livery canvas is x along, y round: swap them in the shader-free way)
  { const uv = fus.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) { const u = uv.getX(i), v = uv.getY(i); uv.setXY(i, v, u); } uv.needsUpdate = true; }
  A.add(fus); A.fus = fus;
  // ---- the wings (swept, a little dihedral), the engines under them, the tailplane and the fin
  const wingShape = (root, tip, span, sweep) => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(-root, 0); s.lineTo(-sweep - tip, span); s.lineTo(-sweep, span); s.closePath(); return s; };
  for (const sd of [-1, 1]) {
    const g = new THREE.ExtrudeGeometry(wingShape(6.2, 1.6, 15.6, 7.2), { depth: 0.38, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 2 });
    g.rotateX(-Math.PI / 2 * sd); g.translate(3.0, -1.0, sd * 1.4); const w = new THREE.Mesh(g, M.white); w.rotation.x = sd * -0.09; w.castShadow = true; A.add(w);
    const nac = new THREE.Mesh(mgLoft([[2.6, -1.95, 5.6 * sd, 0.92, 0.95], [1.0, -1.95, 5.6 * sd, 1.0, 1.04], [-1.6, -1.95, 5.6 * sd, 0.8, 0.82], [-2.4, -1.95, 5.6 * sd, 0.45, 0.45]], 18, 0.0), M.grey); nac.castShadow = true; A.add(nac);
    const fan = new THREE.Mesh(new THREE.CircleGeometry(0.8, 18), M.dark); fan.position.set(2.62, -1.95, 5.6 * sd); fan.rotation.y = Math.PI / 2; A.add(fan);
    const pylon = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.9, 0.3), M.white); pylon.position.set(0.6, -1.25, 5.6 * sd); A.add(pylon);
    const tp = new THREE.ExtrudeGeometry(wingShape(3.2, 1.1, 6.2, 3.0), { depth: 0.18, bevelEnabled: false }); tp.rotateX(-Math.PI / 2 * sd); tp.translate(-15.6, 0.45, sd * 0.6); A.add(new THREE.Mesh(tp, M.white));
    // the navigation lights at the wing tips
    const nl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), sd > 0 ? M.green : M.red); nl.position.set(-4.6 - 1.7, -0.25 + 15.6 * 0.09, sd * 17.0); A.add(nl);
  }
  { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(-5.4, 0); s.lineTo(-7.6, 6.6); s.lineTo(-5.6, 6.6); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 1 }); g.translate(-12.4, 1.0, -0.15); const fin = new THREE.Mesh(g, M.blue); fin.castShadow = true; A.add(fin); }
  // ---- the landing gear (scaled by mgGearAt: retracted into the body when 0)
  const gear = new THREE.Group(); A.add(gear); A.gear = gear;
  for (const [x, zs] of [[-0.6, [-2.9, 2.9]], [13.6, [0]]]) for (const z of zs) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.2, 8), M.metal); leg.position.set(x, -1.9, z); gear.add(leg);
    for (const dz of (zs.length > 1 ? [-0.45, 0.45] : [-0.25, 0.25])) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.58 * (zs.length > 1 ? 1 : 0.7), 0.58 * (zs.length > 1 ? 1 : 0.7), 0.36, 16), M.tyre); w.rotation.x = Math.PI / 2; w.position.set(x, -P.gear + (zs.length > 1 ? 0.58 : 0.41), z + dz); gear.add(w); }
  }
  // ---- the lights: the beacons (red, top and bottom), the strobes, the landing lights
  A.beacons = [[-6, 2.0, 0], [-4, -2.0, 0]].map((p) => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), M.red.clone()); b.position.set(...p); A.add(b); return b; });
  const landL = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff6e0' })); landL.position.set(13.9, -1.6, 0); A.add(landL); A.landL = landL;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: mgDotTex(0.2), color: '#fff3d8', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.set(14, 14, 1); glow.position.set(14.2, -1.6, 0); A.add(glow); A.glow = glow;
  A.update = (s, u = {}) => {
    const g = u.gear ?? 1; gear.visible = g > 0.02; gear.scale.set(1, Math.max(0.02, g), 1); gear.position.y = (1 - g) * 1.2;
    const bl = (Math.floor(s * 1.1) % 2 === 0 && (s * 1.1) % 1 < 0.12) ? 1 : 0.05; for (const b of A.beacons) b.material.color.setRGB(1 * bl + 0.05, 0.15 * bl, 0.1 * bl);
    glow.visible = landL.visible = !!u.lights; glow.material.opacity = u.lights ? 0.9 : 0;
  };
  return A;
}

// ---------------------------------------------------------------------------------------------------------------------
// THE INSIDE (plane-local, added to the airliner's group): the cockpit and the cabin. o.screens: the canvas textures
// ---------------------------------------------------------------------------------------------------------------------
function mgBuildCabin(A) {
  const P = MG_PL, IN = new THREE.Group(); A.add(IN); A.inside = IN;
  const M = { wall: mgStd('#d9d6cf', 0.8), wall2: mgStd('#c9c5bc', 0.85), floor: mgStd('#3c4250', 0.95), seat: mgStd('#2d3a5a', 0.85), seatC: mgStd('#4a5878', 0.85), head: mgStd('#e8e4da', 0.8),
    panel: mgStd('#2a2d32', 0.6, 0.2), panel2: mgStd('#3a3e45', 0.6, 0.2), metal: mgStd('#8e949a', 0.35, 0.7), black: mgStd('#121315', 0.5), door: mgStd('#c8c4bc', 0.6, 0.1), sky: new THREE.MeshBasicMaterial({ color: '#dfe8f2' }) };
  const B = mgBatch(), fy = P.floorY;
  // ---- the cabin: floor, the side walls (a bent shell drawn from inside), the bins, the ceiling, the windows (bright)
  { const L0 = -16, L1 = P.door, len = L1 - L0, cx = (L0 + L1) / 2;
    B.box(len, 0.1, 3.5, M.floor, cx, fy - 0.05, 0);
    const shell = new THREE.CylinderGeometry(1.86, 1.86, len, 28, 1, true, 0, Math.PI * 2); shell.rotateZ(Math.PI / 2); shell.translate(cx, 0.15, 0);
    const sh = new THREE.Mesh(shell, new THREE.MeshStandardMaterial({ color: '#dcd8d0', roughness: 0.85, side: THREE.BackSide })); IN.add(sh);
    for (const sd of [-1, 1]) { B.box(len, 0.42, 0.62, M.wall2, cx, 1.28, sd * 1.25); B.box(len, 0.06, 0.6, M.wall, cx, 1.06, sd * 1.25); }
    // the windows: small bright panes just inside the shell (shades half down on a few)
    const win = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.24, 0.34), M.sky, 80), o = new THREE.Object3D(); let i = 0;
    for (let x = L0 + 1; x < L1 - 0.6; x += P.pitch) for (const sd of [-1, 1]) { o.position.set(x, 0.42, sd * 1.8); o.rotation.set(0, sd > 0 ? Math.PI : 0, 0); o.lookAt(x, 0.42, 0); o.updateMatrix(); if (i < 80) win.setMatrixAt(i++, o.matrix); }
    win.count = i; IN.add(win); IN.win = win; }
  // ---- the seats: 28 rows, 3 + 3 (seat pan, back, headrest cover), facing forward (+x)
  { const rows = [];
    for (let r = 0; r < P.rows; r++) { const x = P.row0 - r * P.pitch; rows.push(x);
      for (const z of [-1.28, -0.8, -0.32, 0.32, 0.8, 1.28]) { B.box(0.46, 0.12, 0.44, M.seat, x, fy + 0.46, z); B.box(0.1, 0.62, 0.44, M.seat, x - 0.24, fy + 0.8, z); B.box(0.11, 0.16, 0.36, M.head, x - 0.245, fy + 1.03, z); } }
    IN.rows = rows; }
  // ---- the galley and the cockpit door (with its keypad) at x = P.door; the door swings open into the cockpit
  { B.box(0.12, 2.1, 1.2, M.wall2, P.door, fy + 1.05, -1.25); B.box(0.12, 2.1, 1.2, M.wall2, P.door, fy + 1.05, 1.25); B.box(0.12, 0.3, 1.4, M.wall2, P.door, fy + 2.0, 0);
    const door = new THREE.Group(); door.position.set(P.door, fy, -0.55); IN.add(door); IN.door = door;
    const dp = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.86, 1.08), M.door); dp.position.set(0, 0.93, 0.54); door.add(dp);
    const kp = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.16, 0.1), M.black); kp.position.set(-0.18, 1.25, -0.72); IN.add(kp);
    IN.keyLed = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.025, 0.025), new THREE.MeshBasicMaterial({ color: '#ff3020' })); IN.keyLed.position.set(-0.2, 1.32, -0.72); IN.keyLed.position.x += P.door; IN.add(IN.keyLed);
    kp.position.x += P.door; }
  // ---- the cockpit (x 12.7…16.6): floor, the side walls with their windows, the glareshield, the panel, the pedestal,
  // the overhead panel, the seats; the windscreen frames (real holes: the world is seen through them)
  { const x0 = P.door + 0.06, cx = 14.6;
    B.box(3.4, 0.1, 3.0, M.floor, cx, fy - 0.05, 0);
    for (const sd of [-1, 1]) { B.box(3.6, 0.75, 0.12, M.wall, cx - 0.4, fy + 0.4, sd * 1.55); B.box(1.0, 1.0, 0.12, M.wall, 13.3, fy + 1.3, sd * 1.52); B.box(3.0, 0.5, 0.12, M.wall, cx - 0.2, fy + 2.05, sd * 1.4); }
    // the windscreen's frame: the posts between the panes and the sill and header
    B.box(0.12, 0.12, 2.4, M.panel, 16.45, fy + 1.32, 0); B.box(0.12, 0.12, 2.2, M.panel, 16.0, fy + 2.0, 0);
    for (const z of [-1.12, -0.05, 0.05, 1.12]) B.add(new THREE.BoxGeometry(0.1, 0.78, 0.08).applyMatrix4(Geo.matrix(16.2, fy + 1.66, z, 0, 0, 0.6)), M.panel);
    for (const sd of [-1, 1]) B.add(new THREE.BoxGeometry(0.1, 0.7, 0.08).applyMatrix4(Geo.matrix(15.2, fy + 1.66, sd * 1.42, 0, 0, 0.2)), M.panel);
    // the glareshield (with the autopilot panel on its front), the main panel below it, the pedestal, the overhead
    B.box(0.55, 0.14, 2.5, M.panel, 15.75, fy + 1.28, 0);
    B.add(new THREE.BoxGeometry(0.14, 0.62, 2.6).applyMatrix4(Geo.matrix(15.75, fy + 0.86, 0, 0, 0, -0.18)), M.panel2);
    B.box(0.9, 0.6, 0.55, M.panel, 15.1, fy + 0.4, 0); B.box(1.6, 0.12, 1.4, M.panel2, 14.6, fy + 2.12, 0);
    // the seats (sheepskin-ish grey) and their headrests
    for (const sd of [-1, 1]) { const z = sd * 0.55; B.box(0.56, 0.14, 0.52, mgStd('#6f6a62', 0.9), 14.25, fy + 0.5, z); B.box(0.14, 0.8, 0.52, mgStd('#6f6a62', 0.9), 13.95, fy + 0.95, z); B.box(0.14, 0.24, 0.32, mgStd('#5a5650', 0.9), 13.95, fy + 1.48, z); }
    void x0;
    const csh = new THREE.CylinderGeometry(1.6, 1.6, 2.65, 24, 1, true); csh.rotateZ(Math.PI / 2); csh.translate(14.02, 0.12, 0);
    IN.add(new THREE.Mesh(csh, new THREE.MeshStandardMaterial({ color: '#cfcbc3', roughness: 0.85, side: THREE.BackSide }))); }
  B.build(IN, { cast: false });
  // ---- the screens: each pilot a PFD and a ND, the middle two engine/fuel screens (canvas textures, set from outside)
  IN.screens = {};
  const scr = (name, x, y, z, w, h) => { const c = mgCanvasTex(320, 320, mgDrawScreen), m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: c.tex, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
    m.position.set(x, y, z); m.rotation.set(0, -Math.PI / 2, 0); m.rotateX(-0.18); IN.add(m); IN.screens[name] = { c, m, name }; return m; };
  scr('pfdL', 15.665, fy + 0.86, -0.92, 0.24, 0.24); scr('ndL', 15.665, fy + 0.86, -0.62, 0.24, 0.24);
  scr('eng', 15.665, fy + 0.86, -0.15, 0.24, 0.24); scr('fuel', 15.665, fy + 0.86, 0.15, 0.24, 0.24);
  scr('ndR', 15.665, fy + 0.86, 0.62, 0.24, 0.24); scr('pfdR', 15.665, fy + 0.86, 0.92, 0.24, 0.24);
  // the autopilot panel's lit buttons (on the glareshield's face)
  IN.ap = [-0.5, -0.38, 0.38, 0.5, 0.0].map((z, i) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.025, 0.05), new THREE.MeshBasicMaterial({ color: '#7cff9a' })); b.position.set(15.47, fy + 1.24, z); IN.add(b); b.userData.i = i; return b; });
  // ---- the yokes (moving by themselves) and the thrust levers
  IN.yokes = [-1, 1].map((sd) => { const y = new THREE.Group(); y.position.set(15.15, fy + 0.62, sd * 0.55); IN.add(y);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.5, 8), M.black); col.position.set(0, 0.25, 0); y.add(col);
    const wh = new THREE.Group(); wh.position.set(-0.04, 0.52, 0); y.add(wh); y.wheel = wh;
    for (const dz of [-0.13, 0.13]) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.04), M.black); h.position.set(0, 0.03, dz); wh.add(h); }
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.3), M.panel); wh.add(bar); return y; });
  IN.levers = [-0.06, 0.06].map((z) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.03), M.metal); l.position.set(15.0, fy + 0.8, z); IN.add(l); return l; });
  // ---- the cockpit's light: the screens' glow, the sky through the windscreen
  IN.light = new THREE.PointLight('#dfe9ff', 0.6, 4, 1.5); IN.light.position.set(15.2, fy + 1.4, 0); IN.add(IN.light);
  return IN;
}

// a cockpit screen: what = pfd | nd | eng | fuel; st = { s, what, alt, spd, hdg, pitch, roll, fuel, land3 }
function mgDrawScreen(g, w, h, st) {
  g.fillStyle = '#05070a'; g.fillRect(0, 0, w, h);
  const ft = Math.round(st.alt * 3.281), kt = Math.round(st.spd * 1.944);
  g.font = '600 22px monospace'; g.textAlign = 'left';
  if (st.what === 'pfd') {
    // the attitude ball: sky and ground, rolled and pitched
    g.save(); g.beginPath(); g.rect(70, 50, 180, 200); g.clip(); g.translate(160, 150); g.rotate(-st.roll); g.translate(0, st.pitch * 4);
    g.fillStyle = '#2a7ad4'; g.fillRect(-300, -400, 600, 400); g.fillStyle = '#8a5a2a'; g.fillRect(-300, 0, 600, 400);
    g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(-300, 0); g.lineTo(300, 0); g.stroke();
    for (let k = -2; k <= 2; k++) if (k) { g.beginPath(); g.moveTo(-25, -k * 40); g.lineTo(25, -k * 40); g.stroke(); }
    g.restore();
    g.fillStyle = '#ffd400'; g.fillRect(118, 146, 30, 7); g.fillRect(172, 146, 30, 7); g.fillRect(157, 146, 7, 7);
    g.fillStyle = '#111'; g.fillRect(4, 50, 60, 200); g.fillRect(256, 50, 60, 200);
    g.fillStyle = '#fff'; g.fillText(String(kt), 10, 158); g.fillText(String(Math.round(ft / 10) * 10), 258, 158);
    g.fillStyle = '#7cff9a'; g.font = '600 18px monospace'; g.fillText(st.land3 ? 'LAND 3' : 'CMD', 120, 30); g.fillText(st.mode || 'LNAV  VNAV', 70, 282);
    g.fillStyle = '#fff'; g.fillText(String(Math.round(((st.hdg * 57.3) % 360 + 360) % 360)).padStart(3, '0'), 140, 308);
  } else if (st.what === 'nd') {
    g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(160, 230, 150, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(160, 220); g.lineTo(150, 245); g.lineTo(170, 245); g.fill();
    g.strokeStyle = '#e04ae0'; g.beginPath(); g.moveTo(160, 220); g.lineTo(170 + 30 * Math.sin(st.s * 0.01), 60); g.stroke();
    g.fillStyle = '#7cff9a'; g.font = '600 18px monospace'; g.fillText('GS ' + kt, 12, 26); g.fillStyle = '#e04ae0'; g.fillText(st.wpt || 'TOLVA', 220, 26);
  } else if (st.what === 'eng') {
    for (const [i, x] of [[0, 90], [1, 230]]) { g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(x, 110, 50, Math.PI * 0.8, Math.PI * 2.2); g.stroke(); const a = Math.PI * 0.8 + 1.4 * Math.PI * (st.n1 || 0.8);
      g.strokeStyle = '#7cff9a'; g.beginPath(); g.moveTo(x, 110); g.lineTo(x + 46 * Math.cos(a), 110 + 46 * Math.sin(a)); g.stroke(); g.fillStyle = '#fff'; g.fillText(((st.n1 || 0.8) * 100).toFixed(1), x - 28, 190); void i; }
    g.fillStyle = '#7cff9a'; g.fillText('N1', 145, 116);
  } else {
    g.fillStyle = '#fff'; g.fillText('FUEL', 120, 40); const kg = Math.round(st.fuel / 3600 * 2400);
    g.fillStyle = st.fuel < 3600 ? '#ffb000' : '#7cff9a'; g.font = '700 40px monospace'; g.fillText(String(kg), 100, 120); g.font = '600 20px monospace'; g.fillText('KG', 140, 150);
    g.fillStyle = '#fff'; g.fillText('ENDURANCE', 90, 220); g.fillStyle = st.fuel < 3600 ? '#ffb000' : '#7cff9a'; g.font = '700 30px monospace'; g.fillText(MGP.hms(st.fuel).slice(0, -3), 110, 266);
  }
}
