/* =====================================================================
   WARD SET — the town hospital's maternity ward, 8:04 AM: a delivery room (MG_WD: x 0…7 west→east, z 0…6.2
   north→south, the window in the south wall). The mother in the bed, her knees up under a sheet; two midwives
   (every midwife is still here); the monitor; the cot; the clock on the wall. At MG.sBirth a midwife lifts the baby,
   wrapped in a towel, onto his mother's chest. A boy. (Nothing graphic: the sheet hides everything below.)
   Outside the window: a painted backdrop (the town's roofs, the hills, the smoke, the morning sky), lit by itself.
   ===================================================================== */

function mgWardBackdrop() {
  return mgCanvas(2048, 1024, (g, w, h) => {
    const sk = g.createLinearGradient(0, 0, 0, h * 0.7); sk.addColorStop(0, '#8fb2d6'); sk.addColorStop(1, '#e9e0cf'); g.fillStyle = sk; g.fillRect(0, 0, w, h);
    const r = new RNG(804);
    // far hills, near hills, then roofs (red tiles, grey slate), a church spire, trees
    g.fillStyle = '#9aa7a6'; g.beginPath(); g.moveTo(0, h * 0.6); for (let x = 0; x <= w; x += 32) g.lineTo(x, h * (0.52 + 0.05 * Math.sin(x * 0.004) + 0.02 * Math.sin(x * 0.013))); g.lineTo(w, h); g.lineTo(0, h); g.fill();
    g.fillStyle = '#6f7d5c'; g.beginPath(); g.moveTo(0, h * 0.66); for (let x = 0; x <= w; x += 24) g.lineTo(x, h * (0.62 + 0.03 * Math.sin(x * 0.006 + 1))); g.lineTo(w, h); g.lineTo(0, h); g.fill();
    for (let i = 0; i < 70; i++) { const x = r.range(-40, w), y = h * r.range(0.66, 0.95), bw = r.range(60, 150), bh = r.range(40, 90);
      g.fillStyle = ['#e6dccb', '#d9cbb0', '#efe8dc', '#cbbca2'][r.int(0, 3)]; g.fillRect(x, y, bw, bh);
      g.fillStyle = ['#9a4a32', '#8a3e2c', '#5a5550', '#6a4034'][r.int(0, 3)]; g.beginPath(); g.moveTo(x - 8, y); g.lineTo(x + bw / 2, y - bh * 0.45); g.lineTo(x + bw + 8, y); g.fill();
      g.fillStyle = 'rgba(40,46,56,0.8)'; for (let k = 0; k < 3; k++) g.fillRect(x + 10 + k * bw * 0.3, y + bh * 0.3, bw * 0.15, bh * 0.25); }
    g.fillStyle = '#5a5e64'; g.beginPath(); g.moveTo(w * 0.7, h * 0.66); g.lineTo(w * 0.71, h * 0.42); g.lineTo(w * 0.72, h * 0.66); g.fill(); g.fillStyle = '#d8cfbc'; g.fillRect(w * 0.696, h * 0.6, w * 0.028, h * 0.1);
    for (let i = 0; i < 60; i++) { g.fillStyle = ['#4f6a34', '#8a7a2e', '#6b4a28'][r.int(0, 2)]; g.beginPath(); g.arc(r.range(0, w), h * r.range(0.64, 0.8), r.range(12, 30), 0, 6.29); g.fill(); }
    // smoke from two kitchens across the town (8:04)
    for (const [sx, sy] of [[w * 0.24, h * 0.7], [w * 0.83, h * 0.74]]) for (let k = 0; k < 26; k++) { const u = k / 26; g.fillStyle = `rgba(${90 + 60 * u},${90 + 60 * u},${96 + 60 * u},${0.42 * (1 - u)})`; g.beginPath(); g.arc(sx + 260 * u * u + 10 * Math.sin(k), sy - 330 * u, 18 + 70 * u, 0, 6.29); g.fill(); }
  });
}
// the baby's blanket: white with two blue stripes (a hospital receiving blanket)
function mgBlanketCanvas() { return mgCanvas(256, 256, (g, w, h) => { g.fillStyle = '#f4f2ee'; g.fillRect(0, 0, w, h); g.fillStyle = '#6a8fc0'; g.fillRect(0, h * 0.18, w, h * 0.06); g.fillRect(0, h * 0.3, w, h * 0.03); g.fillStyle = '#d65a6a'; g.fillRect(0, h * 0.76, w, h * 0.03); g.fillStyle = 'rgba(0,0,0,0.04)'; for (let y = 0; y < h; y += 6) g.fillRect(0, y, w, 2); }); }
// the monitor: the baby's heartbeat (before), then the mother's
function mgDrawCTG(g, w, h, st) {
  g.fillStyle = '#071014'; g.fillRect(0, 0, w, h);
  const born = st.s > MG.sBirth, hr = born ? 82 : 142 + Math.round(4 * Math.sin(st.s * 0.3));
  g.strokeStyle = born ? '#7cf0ff' : '#ff6a8a'; g.lineWidth = 3; g.beginPath();
  for (let x = 0; x <= w; x += 3) { const ph = (x / w) * 6 + st.s * 1.2, y = h * 0.42 - (born ? 30 * Math.max(0, Math.sin(ph * 6.3)) ** 12 : 14 * Math.sin(ph * 3) + 6 * Math.sin(ph * 7.1)); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  g.fillStyle = born ? '#7cf0ff' : '#ff6a8a'; g.font = '700 64px sans-serif'; g.fillText(String(hr), 24, h - 40); g.font = '600 22px sans-serif'; g.fillText(born ? 'MOTHER · HR' : 'BABY · FHR ♥', 24, h - 12);
}
function mgDrawWardClock(g, w, h, st) {
  g.fillStyle = '#f4f2ec'; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 4, 0, 6.29); g.fill(); g.strokeStyle = '#2a2a2c'; g.lineWidth = 8; g.stroke();
  g.fillStyle = '#2a2a2c'; for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283; g.fillRect(w / 2 + Math.sin(a) * (w * 0.4) - 3, h / 2 - Math.cos(a) * (h * 0.4) - 8, 6, 16); }
  const c = mgClockParts(st.s), hA = ((c.h % 12) + c.m / 60) / 12 * 6.283, mA = (c.m + c.sec / 60) / 60 * 6.283, sA = c.sec / 60 * 6.283;
  const hand = (a, L, wd, col) => { g.strokeStyle = col; g.lineWidth = wd; g.lineCap = 'round'; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + Math.sin(a) * L, h / 2 - Math.cos(a) * L); g.stroke(); };
  hand(hA, w * 0.24, 12, '#1a1a1c'); hand(mA, w * 0.36, 8, '#1a1a1c'); hand(sA, w * 0.38, 3, '#c0302a');
}

MG_SETS.ward = (app) => {
  const W = MG_WD, S = mgSet(app, { sky: '#d9d4c8', fov: 46, near: 0.03, far: 200, hemi: ['#f2efe8', '#8a8070', 0.85], sun: [8, 10, 14], sunColor: '#ffe6c4', sunI: 2.4, shadow: 2048, shadowR: 7, shadowFar: 60, env: ['#f0eee8', '#d8d2c6', '#8a8274'] });
  const scene = S.scene, cam = S.camera;
  S.sun.target.position.set(3.4, 0.5, 2.6);
  const M = { wall: mgStd('#e9e5dc', 0.9), wall2: mgStd('#cfe0e2', 0.9), floor: mgStd('#b8b2a2', 0.6), ceil: mgStd('#f4f2ee', 0.95), steel: mgStd('#c0c4c8', 0.3, 0.7), dark: mgStd('#3a3e44', 0.6, 0.2),
    sheet: mgStd('#e8eef2', 0.9), blue: mgStd('#7aa0c4', 0.85), wood: mgStd('#b08a5e', 0.6), mat: mgStd('#5a7a9a', 0.7), skin: mgStd('#c9967a', 0.7), cot: new THREE.MeshStandardMaterial({ color: '#dfe8ee', roughness: 0.1, transparent: true, opacity: 0.35, depthWrite: false }) };
  const B = mgBatch();
  // ---- the room: floor (a vinyl texture), walls (the south wall with its window cut), ceiling, skirting
  { const ft = mgTex(mgCanvas(512, 512, (g, w, h) => { const r = new RNG(5); g.fillStyle = '#b9b3a3'; g.fillRect(0, 0, w, h); for (let i = 0; i < 4000; i++) { const v = 160 + r.next() * 40; g.fillStyle = `rgba(${v},${v - 4},${v - 14},0.35)`; g.fillRect(r.next() * w, r.next() * h, 2, 2); } g.strokeStyle = 'rgba(0,0,0,0.08)'; for (let x = 0; x < w; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } }), {});
    ft.repeat.set(3.5, 3); const fl = mgBox(W.x[1], 0.1, W.z[1], mgStd('#ffffff', 0.55, 0, { map: ft }), W.x[1] / 2, -0.05, W.z[1] / 2, scene); fl.castShadow = false; }
  mgBox(W.x[1] + 0.4, 0.1, W.z[1] + 0.4, M.ceil, W.x[1] / 2, W.H + 0.05, W.z[1] / 2, scene).castShadow = false;
  B.box(0.12, W.H, W.z[1] + 0.24, M.wall, -0.06, W.H / 2, W.z[1] / 2); B.box(0.12, W.H, W.z[1] + 0.24, M.wall, W.x[1] + 0.06, W.H / 2, W.z[1] / 2);
  B.box(W.x[1], W.H, 0.12, M.wall2, W.x[1] / 2, W.H / 2, -0.06);
  for (const [x0, x1, y0, y1] of mgWallCells(0, W.x[1], 0, W.H, [[W.win.x[0], W.win.x[1], W.win.y[0], W.win.y[1]]])) B.box(x1 - x0, y1 - y0, 0.2, M.wall, (x0 + x1) / 2, (y0 + y1) / 2, W.z[1] + 0.1);
  // the window's frame and mullions, its sill
  { const fr = mgStd('#f2f2ee', 0.5), [a, b] = W.win.x, [c, d] = W.win.y;
    B.box(b - a + 0.1, 0.08, 0.3, fr, (a + b) / 2, c - 0.02, W.z[1] + 0.02); B.box(b - a + 0.1, 0.06, 0.14, fr, (a + b) / 2, d + 0.01, W.z[1] + 0.12);
    for (const x of [a, (a + b) / 2, b]) B.box(0.06, d - c, 0.14, fr, x, (c + d) / 2, W.z[1] + 0.12); }
  for (const [x, z, w, d] of [[W.x[1] / 2, 0.02, W.x[1], 0.04], [0.02, W.z[1] / 2, 0.04, W.z[1]], [W.x[1] - 0.02, W.z[1] / 2, 0.04, W.z[1]]]) B.box(w, 0.1, d, M.dark, x, 0.05, z);
  // ---- outside: the backdrop (lit by itself), and the sun coming in
  { const bd = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshBasicMaterial({ map: mgTex(mgWardBackdrop(), { repeat: false }), fog: false })); bd.position.set(3.5, 3.5, W.z[1] + 22); bd.rotation.y = Math.PI; scene.add(bd); }
  // ---- the bed (head north), the sheet over the mother's knees, the pillows; the monitor; the cot; the clock; a chair, a ball
  const [bx, , bz] = W.bed;
  B.box(1.0, 0.12, 2.1, M.steel, bx, 0.45, bz); B.box(0.96, 0.18, 2.06, M.mat, bx, 0.6, bz);
  B.add(new THREE.BoxGeometry(0.96, 0.14, 0.9).applyMatrix4(Geo.matrix(bx, 0.86, bz - 0.85, 0.7, 0, 0)), M.mat);                         // the backrest, raised
  B.box(1.05, 0.9, 0.05, M.steel, bx, 0.6, bz - 1.07); for (const sd of [-1, 1]) for (const dz of [-0.9, 0.9]) B.box(0.05, 0.42, 0.05, M.steel, bx + sd * 0.45, 0.21, bz + dz);
  B.add(new THREE.BoxGeometry(0.7, 0.16, 0.45).applyMatrix4(Geo.matrix(bx, 1.08, bz - 1.0, 0.7, 0, 0)), M.sheet);                       // the pillow
  { const sh = new THREE.CylinderGeometry(0.62, 0.62, 1.0, 16, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(0); sh.scale(1, 0.62, 0.9); sh.translate(bx, 0.69, bz + 0.45);
    B.add(sh, M.sheet); B.box(1.0, 0.03, 0.9, M.sheet, bx, 0.705, bz + 0.45); }
  B.box(0.55, 1.05, 0.45, M.dark, bx + 1.25, 0.52, bz - 0.7); const ctg = mgCanvasTex(320, 220, mgDrawCTG);
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.29), new THREE.MeshBasicMaterial({ map: ctg.tex, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })); m.position.set(bx + 1.25, 0.86, bz - 0.47); scene.add(m); }
  B.box(0.75, 0.04, 0.5, M.steel, 5.6, 0.75, 4.4); for (const dx of [-0.32, 0.32]) B.box(0.04, 0.75, 0.04, M.steel, 5.6 + dx, 0.37, 4.4);
  { const c = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.32, 0.45), M.cot); c.position.set(5.6, 0.94, 4.4); c.renderOrder = 2; scene.add(c); }
  B.box(0.06, 1.9, 0.06, M.steel, bx - 0.75, 0.95, bz - 0.9); B.box(0.5, 0.03, 0.03, M.steel, bx - 0.75, 1.85, bz - 0.9);
  B.box(0.55, 0.06, 0.5, M.wood, 1.1, 0.48, 4.2); B.box(0.55, 0.5, 0.06, M.wood, 1.1, 0.76, 4.45); for (const [dx, dz] of [[-0.24, -0.2], [0.24, -0.2], [-0.24, 0.2], [0.24, 0.2]]) B.box(0.04, 0.46, 0.04, M.steel, 1.1 + dx, 0.23, 4.2 + dz);
  { const ball = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 16), mgStd('#5a8ac0', 0.4)); ball.position.set(0.7, 0.32, 5.3); ball.castShadow = true; scene.add(ball); }
  // cabinets and the sink along the east wall; the whiteboard
  B.box(0.6, 0.9, 2.4, mgStd('#dcd6ca', 0.7), W.x[1] - 0.3, 0.45, 1.6); B.box(0.62, 0.04, 2.42, mgStd('#9a9890', 0.4), W.x[1] - 0.3, 0.92, 1.6);
  B.box(0.4, 0.1, 0.5, M.steel, W.x[1] - 0.32, 0.9, 2.3);
  { const wb = mgTex(mgCanvas(512, 256, (g, w, h) => { g.fillStyle = '#f8f8f6'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a5a9a'; g.font = '600 34px sans-serif'; g.fillText('ROOM 4', 24, 50); g.fillStyle = '#333'; g.font = '500 30px sans-serif'; g.fillText('Midwife: Ana', 24, 110); g.fillText('Midwife: Sophie', 24, 155); g.fillStyle = '#c03030'; g.fillText('♥', 24, 215); }), { repeat: false });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), new THREE.MeshStandardMaterial({ map: wb, roughness: 0.3, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })); m.position.set(W.x[1] - 0.005, 1.6, 4.2); m.rotation.y = -Math.PI / 2; scene.add(m); }
  const clock = mgCanvasTex(256, 256, mgDrawWardClock);
  { const m = new THREE.Mesh(new THREE.CircleGeometry(0.17, 40), new THREE.MeshBasicMaterial({ map: clock.tex, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })); m.position.set(bx + 0.9, 2.15, 0.01); scene.add(m); }
  // the ceiling's light panels
  for (const [x, z] of [[2.2, 2.0], [4.8, 2.0], [3.5, 4.4]]) { B.box(1.2, 0.03, 0.6, new THREE.MeshBasicMaterial({ color: '#fbfaf6' }), x, W.H - 0.015, z); const l = new THREE.PointLight('#f4f6ff', 2.2, 7, 1.6); l.position.set(x, W.H - 0.3, z); scene.add(l); }
  B.build(scene);
  // ---- the people: the mother (reclined, her knees up under the sheet), the midwives
  const mum = mgPerson('mgMum', scene, { id: 'mum' }), m1 = mgPerson('mgMid1', scene, { id: 'm1' }), m2 = mgPerson('mgMid2', scene, { id: 'm2' });
  // ---- the baby (a bundle in his blanket, his head, a little knitted cap)
  const baby = new THREE.Group(); scene.add(baby);
  { const bl = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14).scale(0.11, 0.09, 0.2), new THREE.MeshStandardMaterial({ map: mgTex(mgBlanketCanvas(), {}), roughness: 0.9 })); bl.castShadow = true; baby.add(bl);
    const hd = new THREE.Mesh(new THREE.SphereGeometry(0.062, 18, 14), mgStd('#d9a28a', 0.65)); hd.position.set(0, 0.03, 0.2); baby.add(hd);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.066, 18, 10, 0, 6.29, 0, 1.6), mgStd('#9ab8d8', 0.95)); cap.position.set(0, 0.035, 0.205); cap.rotation.x = -0.9; baby.add(cap); }
  const set = {
    scene, camera: cam, mum, m1, m2, baby, clock, ctg,
    cuts() { return []; },
    frame(t, shot) {
      const s = mgStoryAt(t), m = shot.mode, kk = MathX.clamp((t - shot.t0) / (shot.t1 - shot.t0), 0, 1); this._s = s;
      const sb = MG.sBirth, born = s >= sb, up = MathX.smooth(s, sb, sb + 3.2), held = MathX.smooth(s, sb + 2.6, sb + 4.4);
      // the mother: reclined against the raised backrest, knees up (under the sheet); after the birth, her arms round him
      { const p = MG_POSES.sit(); p.hipY = 0.47; p.lHip = [1.95, 0.22]; p.rHip = [1.95, 0.22]; p.lKnee = 1.7; p.rKnee = 1.7; p.spine = 0.18; p.neck = 0.25 + (born ? 0.15 : 0);
        p.lSh = [0.3, 0.35]; p.rSh = [0.3, 0.35]; p.lEl = 0.6; p.rEl = 0.6; p.mouth = born ? 0.3 : 0.6 + 0.4 * Math.sin(s * 1.7);
        const hug = MG_POSES.hug(); const q = lerpPose(p, Object.assign({}, p, { lSh: hug.lSh, rSh: hug.rSh, lEl: hug.lEl, rEl: hug.rEl }), held);
        mgPose(mum, q, bx, 0.24, bz - 0.55, 0); mum.root.rotation.x = -0.72; }
      // midwife 1: at the foot of the bed; she lifts him and lays him on his mother's chest, then steps to the side
      { const step = MathX.smooth(s, sb + 4.2, sb + 6), p = lerpPose(born ? MG_POSES.hug() : MG_POSES.crouch(), MG_POSES.standStill(), step);
        if (!born) { p.hipY = 0.86; p.lKnee = 0.3; p.rKnee = 0.3; p.lHip = [0.3, 0.1]; p.rHip = [0.3, 0.1]; p.spine = 0.45; p.neck = 0.2; p.lSh = [0.9, 0.2]; p.rSh = [0.9, 0.2]; p.lEl = 0.6; p.rEl = 0.6; }
        mgFidget(p, s, 3, 0.3); mgPose(m1, p, bx + 0.25 * up + 0.55 * step, 0, bz + 1.45 - 0.55 * up + 0.2 * step, Math.PI + 0.35 * step); }
      // midwife 2: by the monitor, then at the bedside (a hand on the mother's shoulder)
      { const p = lerpPose(MG_POSES.standStill(), MG_POSES.talk(), born ? 0.6 : 0.2); p.mouth = born ? 0.6 + 0.4 * Math.sin(s * 3) : 0; mgFidget(p, s, 7, 0.5); mgPose(m2, p, bx + 0.95, 0, bz - 0.35, -Math.PI / 2 - 0.2); }
      // the baby: from the midwife's hands at the foot of the bed up onto his mother's chest
      baby.visible = s >= sb - 0.05;
      { const a = [bx, 0.9, bz + 0.9], b = [bx + 0.02, 1.14, bz - 0.38], k = up, mid = [bx, 1.25, bz + 0.3];
        const p = k < 0.5 ? mgV(a, mid, k * 2) : mgV(mid, b, (k - 0.5) * 2); baby.position.set(p[0], p[1], p[2]); baby.rotation.set(-0.5 * k - 0.2 + 0.03 * Math.sin(s * 2.1), Math.PI + 0.1, 0.05 * Math.sin(s * 1.3)); }
      clock.update({ s: Math.floor(s) }); ctg.update({ s: Math.round(s * 8) / 8 });
      // ---- the camera
      const v = { p: [6.2, 1.6, 5.4], at: [3.3, 0.95, 2.2], fov: 46 };
      const into = (a, b) => mgV(a, b, Ease.inOutSine(kk));
      if (m === 'wardIn') { v.p = into([6.3, 1.65, 5.5], [6.0, 1.6, 5.2]); v.at = [3.2, 0.95, 2.2]; v.fov = 50; }
      else if (m === 'birth') { v.p = into([5.0, 1.45, 4.6], [4.8, 1.42, 4.3]); v.at = [3.4, 1.05, 2.6]; v.fov = 40; }
      else if (m === 'baby') { v.p = into([4.25, 1.42, 1.62], [4.15, 1.4, 1.7]); v.at = [3.42, 1.12, 2.15]; v.fov = 34; }
      else if (m === 'wardWin') { v.p = into([1.0, 1.55, 0.9], [1.2, 1.55, 1.0]); v.at = [3.6, 1.1, 4.6]; v.fov = 52; }
      const dr = mgDrift(t, 0.006, 0.3, 21);
      mgCam(cam, [v.p[0] + dr[0], v.p[1] + dr[1], v.p[2] + dr[2]], [v.at[0] + dr[0], v.at[1] + dr[1], v.at[2] + dr[2]], v.fov);
    },
    labels(t) { const shot = mgShotAt(t), out = []; if (shot.mode === 'baby') { const p = this.baby.position; out.push({ p: [p.x, p.y + 0.12, p.z + 0.18], text: 'A BOY', sub: 'born 8:04 AM', a: StoryHUD.win(t, shot.t0 + 0.8, shot.t1 - 0.3, 0.4, 0.3), side: 'r' }); } return out; },
    grade(t, p) { p.exposure = 1.04; p.saturation = 1.02; p.contrast = 1.04; p.warmth = 0.03; p.vignette = 0.5; p.bloom = 0.4; p.bloomThreshold = 0.88; },
  };
  return set;
};
