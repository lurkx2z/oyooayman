/* =====================================================================
   HOSPITAL SET — across the bay, on its hill (LF_HO): the MRI scan room (its superconducting magnet, a patient on the
   table), the control room behind its window (the technologist, the magnet's status screen), the corridor with the
   nurses' station and the whiteboard of patients' names on magnets, and the generator room. (The roof, with the quench
   pipe venting, is on the coast set: it shares the city, the bay and the sky.)
   Light: the mains (lights.js lfHospital: the transformers' hum, the trip, the generators' two weak surges), then the
   battery emergency lights (LEDs, fading). The quench at 9.58 s (×1.1): the helium boils off in white jets and fog.
   No coplanar faces: walls are boxes cut round their holes, panels and boards stand off the walls by ≥ 1 cm, the room's
   floor runs under the walls, the window glass sits inside its hole.
   ===================================================================== */

// the patients' name cards on the whiteboard: [name, column, row, k at which friction lets go]
const LF_BOARD = [
  ['BED 1 · A. NGUYEN', 0, 0, 2.06], ['BED 2 · M. ROSSI', 1, 0, 2.21], ['BED 3 · K. MENSAH', 2, 0, 2.12], ['BED 4 · S. PATEL', 0, 1, 2.3],
  ['BED 5 · J. OKAFOR', 1, 1, 2.09], ['BED 6 · L. MARTIN', 2, 1, 2.26], ['BED 7 · H. TANAKA', 0, 2, 2.16], ['BED 8 · D. COHEN', 1, 2, 2.03],
  ['BED 9 · E. SILVA', 2, 2, 2.34], ['MRI 1 · 9:15 PM', 0, 3, 2.19], ['ON CALL · DR REYES', 1, 3, 2.25], ['X-RAY · BAY 2', 2, 3, 2.11],
];
// a card's drop (m) below its place at story s: once its magnet's pull × friction is less than its weight, it slides,
// slowly at first (the pull is still almost enough), then faster, until the tray stops it
function lfBoardDrop(i, s, maxDrop) {
  const kk = LF_BOARD[i][3], s0 = LFP.sAt(kk); if (s <= s0) return 0;
  const u = s - s0, a = 9.81 * 0.06 * (1 + 0.5 * u);     // (the net push grows as the pull keeps falling)
  return Math.min(maxDrop, 0.5 * a * u * u / (1 + 0.15 * u));
}
// the magnet's current, as the control room's screen shows it (fluxoid: I ∝ k² until the quench)
const lfMriI = (s) => (s < LFP.sQuench ? LFP.mriI(LFP.k(s)) : Math.max(0, 1.21 * Math.exp(-(s - LFP.sQuench) / 0.35)));

function lfMonitorDraw(g, w, h, st) {
  g.fillStyle = '#03070c'; g.fillRect(0, 0, w, h);
  const s = st.s, I = lfMriI(s), q = s >= LFP.sQuench, flash = q && Math.floor(s * 6) % 2 === 0;
  g.fillStyle = '#6fb6ff'; g.font = '700 22px sans-serif'; g.fillText('MAGNET STATUS', 18, 34);
  g.font = '600 17px sans-serif'; g.fillStyle = '#9fb4c8'; g.fillText('MODE: PERSISTENT · He LEVEL ' + (q ? Math.max(0, 98 - (s - LFP.sQuench) * 160).toFixed(0) : '98') + '%', 18, 62);
  g.fillStyle = '#9fb4c8'; g.fillText('MAIN COIL CURRENT', 18, 104);
  g.fillStyle = q ? (flash ? '#ff3a2a' : '#7a1a14') : I > 1.1 ? '#ffb040' : '#ffffff'; g.font = '700 58px sans-serif'; g.fillText((I * 100).toFixed(1) + '%', 18, 166);
  // the bar, with the quench line at 121%
  g.fillStyle = '#16222e'; g.fillRect(18, 186, w - 36, 22); g.fillStyle = q ? '#ff3a2a' : I > 1.1 ? '#ffb040' : '#4ab0ff'; g.fillRect(18, 186, (w - 36) * Math.min(1, I / 1.3), 22);
  const xq = 18 + (w - 36) * 1.21 / 1.3; g.fillStyle = '#ff5a4a'; g.fillRect(xq - 2, 180, 4, 34); g.font = '600 14px sans-serif'; g.fillText('121% LIMIT', xq - 80, 232);
  g.font = '700 24px sans-serif'; g.fillStyle = q ? (flash ? '#ff3a2a' : '#ff8a7a') : I > 1.05 ? '#ffb040' : '#4ad07a';
  g.fillText(q ? '⚠ QUENCH' : I > 1.05 ? '⚠ CURRENT RISING' : 'OK', 18, 278);
  // the scan (a slice of a head, procedural), frozen once the field goes
  g.save(); g.translate(w - 120, 100); g.fillStyle = '#0d1116'; g.fillRect(-95, -80, 190, 190);
  if (!q) { g.fillStyle = '#c8c8c4'; g.beginPath(); g.ellipse(0, 15, 62, 78, 0, 0, 6.3); g.fill(); g.fillStyle = '#5a5a58'; g.beginPath(); g.ellipse(0, 15, 52, 68, 0, 0, 6.3); g.fill();
    g.fillStyle = '#9a9a96'; for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(-20 + (i % 3) * 20, -15 + Math.floor(i / 3) * 28, 9, 12, i, 0, 6.3); g.fill(); } }
  g.restore();
}
function lfGenDraw(g, w, h, st) {
  g.fillStyle = '#e8e4d8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2a2a28'; g.lineWidth = 4; g.strokeRect(4, 4, w - 8, h - 8);
  const dial = (cx, cy, lbl, v, max, red) => { g.fillStyle = '#ffffff'; g.beginPath(); g.arc(cx, cy, 70, 0, 6.3); g.fill(); g.strokeStyle = '#222'; g.lineWidth = 3; g.stroke();
    for (let i = 0; i <= 10; i++) { const a = Math.PI * (0.8 + 1.4 * i / 10); g.beginPath(); g.moveTo(cx + 58 * Math.cos(a), cy + 58 * Math.sin(a)); g.lineTo(cx + 68 * Math.cos(a), cy + 68 * Math.sin(a)); g.stroke(); }
    g.strokeStyle = '#c8281a'; g.lineWidth = 6; const ar = Math.PI * (0.8 + 1.4 * red / max); g.beginPath(); g.arc(cx, cy, 63, ar, Math.PI * 2.2); g.stroke();
    const a = Math.PI * (0.8 + 1.4 * MathX.clamp(v / max, 0, 1)); g.strokeStyle = '#111'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + 54 * Math.cos(a), cy + 54 * Math.sin(a)); g.stroke();
    g.fillStyle = '#111'; g.font = '700 20px sans-serif'; g.textAlign = 'center'; g.fillText(lbl, cx, cy + 42); g.textAlign = 'left'; };
  dial(95, 100, 'VOLTS', st.v, 300, 400); dial(255, 100, 'Hz', st.hz, 60, 80);
  g.fillStyle = st.alarm ? '#ff2a1a' : '#3a1a14'; g.beginPath(); g.arc(380, 60, 16, 0, 6.3); g.fill(); g.fillStyle = '#111'; g.font = '600 15px sans-serif'; g.fillText('LOW VOLTS', 340, 100);
  g.fillStyle = st.run ? '#3aff6a' : '#143a1a'; g.beginPath(); g.arc(380, 140, 16, 0, 6.3); g.fill(); g.fillStyle = '#111'; g.fillText('RUN', 365, 180);
}
function lfCardTex(txt) {
  return lfTex(lfCanvas(256, 64, (g, w, h) => { g.fillStyle = '#f4f2ea'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8281a'; g.fillRect(0, 0, 10, h);
    g.fillStyle = '#1a2a4a'; g.font = '700 25px sans-serif'; g.fillText(txt, 20, 41); }), { repeat: false });
}
function lfFloorCanvas(seed, base = [190, 196, 192]) {
  return lfCanvas(512, 512, (g, w, h) => { const r = new RNG(seed); g.fillStyle = `rgb(${base})`; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6000; i++) { const v = r.range(-14, 10); g.fillStyle = `rgba(${base[0] + v},${base[1] + v},${base[2] + v},0.5)`; g.fillRect(r.range(0, w), r.range(0, h), r.range(1, 5), r.range(1, 3)); }
    g.strokeStyle = 'rgba(80,90,90,0.25)'; g.lineWidth = 2; for (let x = 0; x <= w; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); g.beginPath(); g.moveTo(0, x); g.lineTo(w, x); g.stroke(); } });
}

LF_SETS.hospital = (app) => {
  const S = lfSet(app, { sky: '#05070a', fov: 50, near: 0.03, far: 400, hemi: ['#d8e4f0', '#5a5650', 0.0], env: ['#c8d4e0', '#8a8e92', '#4a4a48'] });
  const scene = S.scene, cam = S.camera, HO = LF_HO, H = HO.mri.H;
  const M = {
    wall: lfStd('#d8dde0', 0.85), wallB: lfStd('#a9c4d8', 0.8), floor: lfStd('#ffffff', 0.6, 0, { map: (() => { const t = lfTex(lfFloorCanvas(3)); t.repeat.set(12, 12); return t; })() }),
    ceil: lfStd('#e8eaea', 0.9), white: lfStd('#f2f3f2', 0.35), trim: lfStd('#3a8ad8', 0.4), dark: lfStd('#24272b', 0.7), steel: lfStd('#a8adb2', 0.35, 0.8),
    pad: lfStd('#3a5a7a', 0.7), desk: lfStd('#b8a890', 0.6), glass: new THREE.MeshStandardMaterial({ color: '#9fb8c8', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.18, depthWrite: false }),
    panel: new THREE.MeshBasicMaterial({ color: '#ffffff' }), emerg: new THREE.MeshBasicMaterial({ color: '#ffffff' }), board: lfStd('#f6f6f2', 0.25), frame: lfStd('#9aa0a6', 0.3, 0.7),
    conc: lfStd('#8a8a86', 0.9), gen: lfStd('#3a6a4a', 0.5, 0.3), genD: lfStd('#2a2c2e', 0.6, 0.4),
  };
  const box = (w, h, d, m, x, y, z) => lfBox(w, h, d, m, x, y, z);
  // ---- a room: floor slab under everything, walls (boxes cut round holes) from the slab into the ceiling slab
  const wallX = (x, z0, z1, holes, m = M.wall, y1 = H) => { for (const c of lfWallCells(z0, z1, 0, y1, holes)) box(0.2, c[3] - c[2], c[1] - c[0], m, x, (c[2] + c[3]) / 2, (c[0] + c[1]) / 2); };
  const wallZ = (z, x0, x1, holes, m = M.wall, y1 = H) => { for (const c of lfWallCells(x0, x1, 0, y1, holes)) box(c[1] - c[0], c[3] - c[2], 0.2, m, (c[0] + c[1]) / 2, (c[2] + c[3]) / 2, z); };
  box(90, 0.2, 40, M.floor, 5, -0.1, 4);                                                // the floor slab (top at 0)
  box(90, 0.2, 40, M.ceil, 5, H + 0.1, 4);                                              // the ceiling slab (bottom at H)
  // the scan room (x 0…7.2, z 0…6.4) and the control room (x 7.4…10.6): the window in the wall x 7.3, the doors
  wallZ(-0.1, -0.2, 10.8, []); wallX(-0.1, -0.2, 8.0, [[5.0, 6.4, 0, 2.2]]);
  wallX(7.3, -0.2, 6.6, [[1.2, 4.4, 1.0, 2.1], [5.0, 6.1, 0, 2.15]], M.wallB); wallX(10.7, -0.2, 8.0, []);
  wallZ(6.5, -0.2, 7.2, [[5.0, 6.4, 0, 2.2]]); wallZ(6.5, 7.4, 10.8, [[8.2, 9.2, 0, 2.15]]);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.1), M.glass); win.position.set(7.3, 1.55, 2.8); win.rotation.y = Math.PI / 2; win.renderOrder = 3; scene.add(win);
  // the corridor (z 8…11.2, x −30…10.8): its north wall, the board on the south wall's corridor side
  wallZ(11.3, -30, 10.8, []); wallX(-30.1, 6.4, 11.4, []);
  wallZ(7.9, -30, -0.2, [[-22, -20.6, 0, 2.2]]);
  // the ceiling lights (panels 1 cm under the ceiling) and the emergency bulkheads
  const panels = [], emerg = [];
  for (const [x, z] of [[2.0, 2.0], [5.2, 2.0], [2.0, 5.0], [5.2, 5.0], [9.0, 2.0], [9.0, 5.0], ...Array.from({ length: 8 }, (_, i) => [-27 + i * 4.6, 9.6])]) { const p = box(1.2, 0.04, 0.6, M.panel, x, H - 0.03, z); panels.push(p); }
  for (const [x, y, z, ry] of [[0.4, 2.6, 6.38, 0], [9.0, 2.55, 6.38, 0], [-12, 2.6, 11.18, 0], [-24, 2.6, 11.18, 0], [-4, 2.6, 11.18, 0]]) { const e = box(0.34, 0.12, 0.06, M.emerg, x, y, z); e.rotation.y = ry; emerg.push(e); }
  const roomL = [[3.6, 2.7, 2.6], [9.0, 2.6, 3.2], [-6, 2.6, 9.6], [-18, 2.6, 9.6], [-27, 2.6, 9.6]].map((p) => { const L = new THREE.PointLight('#f4f6ff', 0, 12, 1.5); L.position.set(...p); scene.add(L); return L; });
  const emL = [[0.6, 2.4, 6.0], [9.0, 2.4, 6.0], [-12, 2.4, 10.8], [-24, 2.4, 10.8], [-4, 2.4, 10.8]].map((p) => { const L = new THREE.PointLight('#dfe8ff', 0, 9, 1.6); L.position.set(...p); scene.add(L); return L; });
  // ---- the magnet: a rounded block with the bore through it (along z), a raised fascia ring, the turret and its vent pipe
  const B = HO.bore, mag = new THREE.Group(); mag.position.set(B[0], B[1], B[2]); scene.add(mag);
  { const sh = new THREE.Shape(); lfRRShape(sh, -1.1, -1.1, 2.2, 2.2, 0.55); const hole = new THREE.Path(); hole.absarc(0, 0, 0.36, 0, Math.PI * 2, true); sh.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 1.7, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 3, curveSegments: 28 }); g.translate(0, 0, -0.85);
    const m = new THREE.Mesh(g, M.white); m.castShadow = m.receiveShadow = true; mag.add(m);
    const rs = new THREE.Shape(); rs.absarc(0, 0, 0.62, 0, Math.PI * 2, false); const rh = new THREE.Path(); rh.absarc(0, 0, 0.36, 0, Math.PI * 2, true); rs.holes.push(rh);
    const rg = new THREE.ExtrudeGeometry(rs, { depth: 0.1, bevelEnabled: false, curveSegments: 40 }); rg.translate(0, 0, 0.85 + 0.08 - 0.04);   // (4 cm into the face, 6 cm proud)
    mag.add(new THREE.Mesh(rg, M.trim));
    const bore = new THREE.Mesh(new THREE.CylinderGeometry(0.355, 0.355, 1.9, 32, 1, true), lfStd('#e8ecf0', 0.5, 0, { side: THREE.BackSide })); bore.rotation.x = Math.PI / 2; mag.add(bore);
    box(0.7, 0.42, 0.6, M.white, 0, 1.12 + 0.2, -0.35).removeFromParent(); }
  const turret = lfBox(0.7, 0.42, 0.6, M.white, B[0], B[1] + 1.2 + 0.18, B[2] - 0.35);
  const pipe = lfCyl(0.12, 0.12, H - (B[1] + 1.6) + 0.1, M.steel, B[0], (B[1] + 1.55 + H + 0.1) / 2, B[2] - 0.35);
  void turret; void pipe;
  const boreL = new THREE.PointLight('#e8f2ff', 0, 3, 1.5); boreL.position.set(B[0], B[1] + 0.2, B[2] + 0.4); scene.add(boreL);
  // the table and the patient (lying on their back, head in the bore)
  box(0.62, 0.12, 2.6, M.white, B[0], 0.86, B[2] + 1.85); box(0.56, 0.06, 2.5, M.pad, B[0], 0.95, B[2] + 1.85); box(0.4, 0.8, 0.9, M.white, B[0], 0.4, B[2] + 2.4);
  const pat = lfPerson('lfP3', scene, { id: 'pat' }); pat.root.rotation.x = -Math.PI / 2; pat.root.position.set(B[0], 0.98 + 0.13, B[2] + 2.5); pat.apply(LF_POSES.stand());
  // ---- the control room: the desk under the window, two screens, the technologist
  box(0.75, 0.05, 3.0, M.desk, 7.85, 0.76, 2.8); box(0.7, 0.72, 0.05, M.dark, 7.85, 0.38, 1.35); box(0.7, 0.72, 0.05, M.dark, 7.85, 0.38, 4.25);
  const MT = lfCanvasTex(512, 300, lfMonitorDraw);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.36), new THREE.MeshBasicMaterial({ map: MT.tex })); scr.position.set(7.62 + 0.04, 1.08, 2.1); scr.rotation.y = Math.PI / 2 - 0.25; scene.add(scr);
  const scrB = lfBox(0.03, 0.4, 0.66, M.dark, 7.62 + 0.02, 1.08, 2.1); scrB.rotation.y = -0.25;
  const scrL = new THREE.PointLight('#bcd8ff', 0, 2.2, 1.6); scrL.position.set(8.1, 1.1, 2.3); scene.add(scrL);
  const tech = lfPerson('lfTech', scene, { id: 'tech' });
  // ---- the corridor: the nurses' station, the whiteboard (cards on magnets), a bed, two nurses
  box(3.6, 1.05, 0.7, M.desk, -14, 0.52, 10.6); box(3.7, 0.04, 0.8, M.white, -14, 1.07, 10.55);
  const bw = 2.4, bh = 1.2, BD = HO.board;
  box(bw + 0.08, bh + 0.08, 0.03, M.frame, BD[0], BD[1], 8.0 + 0.015); box(bw, bh, 0.03, M.board, BD[0], BD[1], 8.0 + 0.035);          // (the white face 2 cm proud of the frame's)
  box(bw, 0.04, 0.09, M.frame, BD[0], BD[1] - bh / 2 - 0.02, 8.0 + 0.065);                                                            // the tray
  const cards = LF_BOARD.map(([txt, c, r], i) => { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.165), new THREE.MeshBasicMaterial({ map: lfCardTex(txt), color: '#ffffff' })); g.add(m);
    const mg = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.012, 14), lfStd(['#d8281a', '#2a6ad8', '#2a9a4a'][i % 3], 0.4)); mg.rotation.x = Math.PI / 2; mg.position.set(-0.27, 0.035, 0.008); g.add(mg);
    const x0 = BD[0] - bw / 2 + 0.43 + c * 0.77, y0 = BD[1] + bh / 2 - 0.2 - r * 0.25; g.position.set(x0, y0, 8.0 + 0.052 + 0.0006 * i); scene.add(g); return { g, x0, y0, i }; });
  const bed = new THREE.Group(); scene.add(bed); bed.position.set(-22, 0, 10.2); lfBox(2.0, 0.08, 0.9, M.white, 0, 0.62, 0, bed); lfBox(2.0, 0.14, 0.88, lfStd('#cfe0ea', 0.8), 0, 0.72, 0, bed); lfBox(0.06, 0.5, 0.9, M.steel, -1.0, 0.85, 0, bed);
  for (const [dx, dz] of [[-0.9, -0.38], [0.9, -0.38], [-0.9, 0.38], [0.9, 0.38]]) lfCyl(0.02, 0.02, 0.6, M.steel, dx, 0.3, dz, bed);
  const n1 = lfPerson('lfNurse', scene, { id: 'n1' }), n2 = lfPerson('lfNurse2', scene, { id: 'n2' });
  const torchL = new THREE.SpotLight('#eaf0ff', 0, 14, 0.45, 0.5, 1.4); scene.add(torchL); scene.add(torchL.target);
  // ---- the generator room (x 30…42, z 0…8): the generator set, its panel, one light
  wallZ(-0.1, 29.8, 42.2, [], M.conc); wallZ(8.1, 29.8, 42.2, [], M.conc); wallX(29.9, -0.2, 8.2, [], M.conc); wallX(42.1, -0.2, 8.2, [], M.conc);
  box(4.2, 1.5, 1.6, M.gen, 35.2, 0.95, 3.2); box(1.6, 1.6, 1.7, M.gen, 38.0, 1.0, 3.2); box(0.3, 1.9, 1.7, M.genD, 33.0, 1.1, 3.2); box(4.6, 0.2, 2.0, M.genD, 35.6, 0.1, 3.2);
  lfCyl(0.12, 0.12, 2.0, M.steel, 36.0, 2.0 + 0.7, 3.2);
  const GT = lfCanvasTex(420, 220, lfGenDraw);
  const gp = lfBox(0.9, 0.6, 0.12, M.genD, 39.2, 1.5, 0.3); void gp;
  const gs = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.42), new THREE.MeshBasicMaterial({ map: GT.tex })); gs.position.set(39.2, 1.5, 0.37); scene.add(gs);
  const genL = new THREE.PointLight('#f4f2e6', 0, 14, 1.4); genL.position.set(36, 2.7, 4); scene.add(genL);
  const genPanel = box(1.4, 0.04, 0.3, M.panel, 36, H - 0.03, 4); panels.push(genPanel);
  const gtech = lfPerson('lfTech', scene, { id: 'gtech' });
  // ---- the helium fog, the vent's jets
  const fog = lfPuffs(scene, 2200, { soft: 1.6, near: [0.1, 0.5] });
  const set = {
    scene, camera: cam, cuts() { return []; },
    frame(t, shot) {
      const m = shot.mode, s = lfStoryAt(t), k = LFP.k(s), kk = MathX.clamp((t - shot.t0) / (shot.t1 - shot.t0), 0, 1);
      this._s = s; this._k = k;
      // ---- the light: the mains (with the generators' surges), the battery bulkheads (LEDs)
      const mains = lfHospital(s), em = lfEmerg(s, 0.15);
      for (const p of panels) p.material.color.setScalar(0.06 + 0.94 * mains);
      for (const e of emerg) e.material.color.setRGB(0.08 + 0.9 * em, 0.08 + 0.94 * em, 0.1 + 1.0 * em);
      for (const L of roomL) L.intensity = 9 * mains;
      for (const L of emL) L.intensity = 3.4 * em;
      genL.intensity = 10 * mains;
      boreL.intensity = 1.4 * mains;
      S.hemi.intensity = 0.04 + 0.3 * mains + 0.08 * em;
      // ---- the screens
      MT.update({ s: Math.round(s * 60) / 60 }); scr.material.color.setScalar(0.1 + 0.9 * Math.max(mains, 0.9 * lfEmerg(s, 0.05))); scrL.intensity = 0.6 * Math.max(mains, 0.5 * em);
      const gv = s < 15.45 ? 0 : 230 * (0.32 * lfSm(s, 15.45, 15.55) * (1 - lfSm(s, 15.85, 16.0))) / 0.32 * 0.36, run = s > 15.4 && s < 16.1;
      GT.update({ v: Math.round(gv + (run ? 10 * lfFlick(s, 2, 9) : 0)), hz: Math.round(run ? 41 * lfSm(s, 15.4, 15.6) * (1 - lfSm(s, 15.95, 16.1)) : 0), alarm: s > 15.6 && Math.floor(s * 4) % 2 === 0, run });
      gs.material.color.setScalar(0.25 + 0.75 * Math.max(mains, 0.6 * em));
      // ---- people
      tech.root.position.set(8.75, 0, 2.5); tech.root.rotation.y = -Math.PI / 2 - 0.15;
      const tp = s < LFP.sQuench ? LF_POSES.desk() : lfKeys(s - LFP.sQuench, [[-1, LF_POSES.desk()], [0.06, LF_POSES.armsOut()]], 0.1);
      tech.apply(lfFidget(Object.assign({}, tp), s * 3, 2, 0.5));
      { const pp = basePose(); if (s > LFP.sQuench + 0.1) { pp.lSh = [0.9, 0.4]; pp.rSh = [0.6, 0.3]; pp.lEl = 1.2; pp.neck = 0.3; } pat.apply(pp); }
      gtech.root.position.set(39.0, 0, 1.6); gtech.root.rotation.y = Math.PI; gtech.apply(s > 15.6 ? LF_POSES.torch() : LF_POSES.lookAround());
      n1.root.position.set(-12.6, 0, 9.4); n1.root.rotation.y = s > 40 ? Math.PI * 1.0 : -0.4; n1.apply(s > 16.2 ? LF_POSES.torch() : LF_POSES.lookAround());
      n2.root.position.set(-15.8, 0, 9.6); n2.root.rotation.y = s > 40 ? Math.PI * 0.85 : 0.6; n2.apply(s > 40 ? LF_POSES.lookUp() : LF_POSES.phone());
      // the nurse's torch (an LED: it fades too)
      { const tl = lfPhone(s, 16.25); torchL.intensity = 24 * tl; torchL.position.set(-12.4, 1.45, 9.1); torchL.target.position.set(s > 40 ? BD[0] + 0.4 : -12, s > 40 ? BD[1] : 0.4, s > 40 ? 8 : 4); torchL.target.updateMatrixWorld(); }
      // ---- the cards sliding off the board
      for (const c of cards) { const d = lfBoardDrop(c.i, s, c.y0 - (BD[1] - bh / 2 + 0.1)); c.g.position.y = c.y0 - d; c.g.rotation.z = d > 0 ? -0.06 * Math.min(1, d * 3) * (c.i % 2 ? 1 : -1) : 0; }
      // ---- the camera
      const v = { p: [3, 1.6, 6], at: [3.6, 1, 2.6], fov: 50, drift: 0.006 };
      const E = Ease.inOutSine, into = (a, b, u) => lfV(a, b, E(u));
      switch (m) {
        case 'mriA': v.p = into([6.55, 1.72, 6.05], [6.3, 1.68, 5.8], kk); v.at = [3.2, 1.0, 2.6]; v.fov = 52; break;
        case 'mriB': v.p = into([10.2, 1.5, 3.4], [10.0, 1.46, 3.1], kk); v.at = [7.7, 1.12, 2.15]; v.fov = 44; break;
        case 'quench': v.p = into([1.0, 1.62, 6.0], [1.25, 1.6, 5.75], kk); v.at = [3.7, 1.6, 2.3]; v.fov = 52; v.shake = s > LFP.sQuench ? 0.012 * lfSm(s, LFP.sQuench, LFP.sQuench + 0.06) : 0; break;
        case 'gen': v.p = into([31.6, 1.65, 7.2], [31.9, 1.62, 6.9], kk); v.at = [37.2, 1.2, 2.4]; v.fov = 54; break;
        case 'corridor': v.p = into([-2.2, 1.62, 9.7], [-2.6, 1.62, 9.7], kk); v.at = [-20, 1.3, 9.6]; v.fov = 52; break;
        case 'board': v.p = into([BD[0] + 0.5, 1.5, 9.65], [BD[0] + 0.35, 1.48, 9.45], kk); v.at = [BD[0] - 0.1, BD[1] - 0.05, 8.0]; v.fov = 46; break;
      }
      const dr = lfDrift(t, v.drift, 0.3, 21);
      if (v.shake) { dr[0] += v.shake * Math.sin(t * 61); dr[1] += v.shake * Math.sin(t * 53 + 1); }
      lfCam(cam, [v.p[0] + dr[0], v.p[1] + dr[1], v.p[2] + dr[2]], [v.at[0] + dr[0], v.at[1] + dr[1], v.at[2] + dr[2]], v.fov);
      // ---- the quench: jets of cold helium from the turret's joints, a white fog spreading under the ceiling and falling
      fog.begin();
      if (s > LFP.sQuench && (m === 'quench' || m === 'mriA' || m === 'mriB')) {
        const e = s - LFP.sQuench;
        for (let i = 0; i < 900; i++) { const life = 0.5 + 0.5 * lfR(i, 11), born = lfR(i, 12) * 2.0; if (born > e) continue; const ph = ((e - born) / life) % 1, gen = Math.floor((e - born) / life);
          const a = lfR(i + gen * 977, 13) * 6.283, sp = 2.5 + 4 * lfR(i + gen * 977, 14), tt = ph * life;
          const x = B[0] + Math.cos(a) * sp * tt * 0.7, z = B[2] - 0.35 + Math.sin(a) * sp * tt * 0.7, y = B[1] + 1.55 + sp * tt * 0.9 - 1.2 * tt * tt;
          fog.add(x, Math.min(y, H - 0.1), z, 0.12 + 0.9 * ph, 0.22 * (1 - ph) * Math.min(1, e * 4), 0.92, 0.95, 1.0); }
        for (let i = 0; i < 700; i++) { const a = lfR(i, 21) * 6.283, r = Math.min(4.5, e * (1.5 + 2.5 * lfR(i, 22))) * Math.sqrt(lfR(i, 23)), y = H - 0.25 - Math.min(1.6, e * 0.6) * lfR(i, 24);
          fog.add(B[0] + Math.cos(a) * r + 0.2 * Math.sin(s * 0.7 + i), y, B[2] - 0.3 + Math.sin(a) * r * 0.8, 0.5 + 0.6 * lfR(i, 25), 0.1 * Math.min(1, e * 2), 0.88, 0.92, 0.98); }
      }
      fog.end();
    },
    labels(t) {
      const shot = lfShotAt(t), m = shot.mode, W = StoryHUD.win, out = [], lab = (p, text, sub, a0 = 0.8, side) => out.push({ p, text, sub, a: W(t, shot.t0 + a0, shot.t1 - 0.25, 0.35, 0.3), side });
      if (m === 'mriA') lab([B[0] - 0.4, B[1] + 1.35, B[2]], 'SUPERCONDUCTING MAGNET', '−269 °C · 1.5 tesla', 1.0);
      if (m === 'gen') lab([37.2, 2.1, 3.2], 'BACKUP GENERATOR', 'its alternator: a magnet', 0.8);
      return out;
    },
    grade(t, p) { const s = this._s, k = this._k; p.exposure = 1.0 * LFP.eye(k) * lfAdapt(s) * (s > 14.3 ? 1.6 : 1); p.saturation = lfSat(s) * 0.95; p.contrast = 1.06; p.warmth = -0.03; p.bloom = 0.38; p.bloomThreshold = 0.85; p.vignette = 0.55; },
  };
  return set;
};
// a rounded rectangle on a THREE.Shape
function lfRRShape(sh, x, y, w, h, r) { sh.moveTo(x + r, y); sh.lineTo(x + w - r, y); sh.quadraticCurveTo(x + w, y, x + w, y + r); sh.lineTo(x + w, y + h - r); sh.quadraticCurveTo(x + w, y + h, x + w - r, y + h); sh.lineTo(x + r, y + h); sh.quadraticCurveTo(x, y + h, x, y + h - r); sh.lineTo(x, y + r); sh.quadraticCurveTo(x, y, x + r, y); }
