/* =====================================================================
   CENTRE — the training centre (scenes 5, 6): a bright practice room and the corridor outside it.
     Practice room  x −5…5, z −4…4, 3.2 m high: a sprung wooden floor with court lines, three tall windows (north),
                    a colourful mural and a whiteboard (west), the door to the corridor (south, x 2.4…3.4).
                    Training props: two movable partition panels with a gap (an OPENING), a freestanding COLUMN,
                    a brushed METAL panel on a stand, a FABRIC-covered padded block, benches, cones, the coach's chair.
     Corridor       z 4.12…5.92 (1.8 m wide), x −4…6: its south wall ENDS at x = 3.6, a side doorway opens (3.6…4.5),
                    the wall resumes, then at x = 6 the corridor opens into a lobby (x 6…10, z up to 9, a doorway in
                    its far wall): "where a wall might end, where an opening begins, where there's enough room to move".
   Plus the reusable white CANE (beCane) and the coach's look.
   ===================================================================== */

const BE_CTR = {
  W: 5, D: 4, H: 3.2, th: 0.12,
  door: { x0: 2.4, x1: 3.4, h: 2.1 },
  cor: { z0: 4.12, z1: 5.92, x0: -4, x1: 6.0, side: [3.6, 4.5], lobby: { x1: 10, z1: 9, door: [7.6, 8.6] } },
  part: { x: -2.2, z: -1.2, gap: 0.95 },          // the partition panels' centre and the gap between them
  column: new THREE.Vector3(0.2, 0, 2.9),
  metal: new THREE.Vector3(3.2, 0, -1.9),
  soft: new THREE.Vector3(-1.4, 0, 2.3),
};

Object.assign(GB_LOOKS, {
  coach: { skin: '#c79c7c', lip: '#8a5048', top: '#56705e', topDark: '#465c4d', pants: '#3a3c44', shoes: '#efe9df', sole: '#8a7a6a', hair: '#5a4636',
    hairStyle: 'crop', build: 1.0, head: 1.0 },
});

function beBox(R, w, h, d, x, y, z, m, o = {}) { return gbAdd(R, new THREE.BoxGeometry(w, h, d), m, x, y, z, o); }

class BeCentre {
  constructor() { this.scene = new THREE.Scene(); this.scene.name = 'centre'; this.root = new THREE.Group(); this.scene.add(this.root); }
  build() {
    const S = this.scene, R = this.root, C = BE_CTR, r = new RNG(707);
    S.background = new THREE.Color('#0b0c12');
    // ---- materials
    const floorTx = beCanvasTex(1024, 1024, (x, w, h) => {
      for (let i = 0; i < 16; i++) { const v = r.range(-10, 10); x.fillStyle = `rgb(${206 + v},${168 + v},${118 + v * 0.6})`; x.fillRect(0, i * h / 16, w, h / 16); x.fillStyle = 'rgba(90,60,30,0.25)'; x.fillRect(0, i * h / 16, w, 1.5); }
      for (let k = 0; k < 300; k++) { x.strokeStyle = `rgba(120,80,40,${r.range(0.03, 0.09)})`; x.lineWidth = r.range(0.5, 1.5); const y = r.range(0, h); x.beginPath(); x.moveTo(r.range(0, w), y); x.lineTo(r.range(0, w), y + r.range(-2, 2)); x.stroke(); }
      Tex.noise(x, w, h, 6, r);
    }, [5, 4]);
    const lines = beCanvasTex(1024, 820, (x, w, h) => {
      x.clearRect(0, 0, w, h); x.strokeStyle = 'rgba(40, 110, 150, 0.85)'; x.lineWidth = 7;
      x.strokeRect(60, 60, w - 120, h - 120); x.beginPath(); x.moveTo(w / 2, 60); x.lineTo(w / 2, h - 60); x.stroke();
      x.beginPath(); x.arc(w / 2, h / 2, 110, 0, Math.PI * 2); x.stroke();
      x.strokeStyle = 'rgba(200, 80, 60, 0.8)'; x.lineWidth = 6; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(140 + i * 50, h - 160); x.lineTo(170 + i * 50, h - 160); x.stroke(); }
    }, [1, 1]);
    const plaster = beCanvasTex(512, 512, (x, w, h) => { x.fillStyle = '#eae4da'; x.fillRect(0, 0, w, h); Tex.noise(x, w, h, 6, r); }, [3, 2]);
    const wallM = this.wallM = new THREE.MeshStandardMaterial({ map: plaster, color: '#f1ebe1', roughness: 0.92, name: 'beCtrWallPlaster', envMapIntensity: 0.25 });
    const corM = new THREE.MeshStandardMaterial({ map: plaster, color: '#dfe3e6', roughness: 0.9, name: 'beCorWallPlaster', envMapIntensity: 0.25 });
    const trim = gbMat('#c7b39a', { rough: 0.6, name: 'beCtrTrimWood' });
    const W = C.W, D = C.D, H = C.H, th = C.th;
    // ---- floor, lines, ceiling
    gbAdd(R, new THREE.PlaneGeometry(2 * W, 2 * D), new THREE.MeshStandardMaterial({ map: floorTx, color: '#e8cfaa', roughness: 0.45, name: 'beCtrFloorWood', envMapIntensity: 0.55 }), 0, 0, 0, { rx: -Math.PI / 2, cast: false });
    this.courtLines = gbAdd(R, new THREE.PlaneGeometry(2 * W - 0.4, 2 * D - 0.4), new THREE.MeshBasicMaterial({ map: lines, transparent: true, depthWrite: false, name: 'beCtrLines' }), 0, 0.003, 0, { rx: -Math.PI / 2, cast: false }); this.courtLines.userData.beSkip = true;
    this.ceilings = [gbAdd(R, new THREE.PlaneGeometry(2 * W, 2 * D), gbMat('#f3efe8', { rough: 0.95, name: 'beCtrCeilingPlaster' }), 0, H, 0, { rx: Math.PI / 2, cast: false })];
    const lampM = new THREE.MeshStandardMaterial({ color: '#fffaf0', emissive: '#fff4e0', emissiveIntensity: 1.6, name: 'beCtrCeilingLampGlow' });
    for (const x of [-3, 0, 3]) for (const z of [-2, 1.5]) this.ceilings.push(beBox(R, 1.2, 0.03, 0.6, x, H - 0.02, z, lampM, { cast: false }));
    // ---- walls: north (three windows), south (the door), west, east
    const nz = -D - th / 2, win = [[-3.6, -2.0], [-0.8, 0.8], [2.0, 3.6]], wy0 = 0.85, wy1 = 2.8;
    let x0 = -W - th;
    for (const [a, b] of win) { beBox(R, a - x0, H, th, (x0 + a) / 2, H / 2, nz, wallM); beBox(R, b - a, wy0, th, (a + b) / 2, wy0 / 2, nz, wallM); beBox(R, b - a, H - wy1, th, (a + b) / 2, (H + wy1) / 2, nz, wallM); x0 = b; }
    beBox(R, W + th - x0, H, th, (x0 + W + th) / 2, H / 2, nz, wallM);
    const glassM = new THREE.MeshStandardMaterial({ color: '#cfe4f2', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.18, name: 'beCtrWindowGlass', envMapIntensity: 1.2 });
    const frameM = gbMat('#e9e4dc', { rough: 0.5, name: 'beCtrWindowFrameMetal' });
    const skyM = new THREE.MeshBasicMaterial({ color: '#dfeefa', name: 'beCtrSkyGlow' });
    for (const [a, b] of win) {
      beBox(R, b - a, wy1 - wy0, 0.01, (a + b) / 2, (wy0 + wy1) / 2, -D - 0.06, glassM, { cast: false });
      for (const fx of [a + 0.03, (a + b) / 2, b - 0.03]) beBox(R, 0.05, wy1 - wy0, 0.08, fx, (wy0 + wy1) / 2, -D - 0.05, frameM);
      beBox(R, b - a, 0.05, 0.08, (a + b) / 2, wy0 + 0.02, -D - 0.05, frameM); beBox(R, b - a, 0.05, 0.08, (a + b) / 2, wy1 - 0.02, -D - 0.05, frameM);
      beBox(R, b - a, 0.04, 0.22, (a + b) / 2, wy0 - 0.02, -D + 0.08, trim);   // sill
    }
    this.daylight = [gbAdd(R, new THREE.PlaneGeometry(30, 10), skyM, 0, 3, -D - 4, { cast: false })]; this.daylight[0].userData.beSkip = true;
    // trees beyond the windows (soft silhouettes on the sky)
    const treeM = new THREE.MeshBasicMaterial({ color: '#9fb79a', name: 'beCtrTreeFar' });
    for (let i = 0; i < 9; i++) { const t = gbAdd(R, new THREE.SphereGeometry(1, 12, 8), treeM, -8 + i * 2 + r.range(-0.5, 0.5), r.range(1.2, 2.2), -D - 3.4, { s: [r.range(0.9, 1.4), r.range(1.0, 1.6), 0.3], cast: false }); t.userData.beSkip = true; this.daylight.push(t); }
    const sz = D + th / 2, Dr = C.door;
    beBox(R, Dr.x0 + W + th, H, th, (-W - th + Dr.x0) / 2, H / 2, sz, wallM);
    beBox(R, W + th - Dr.x1, H, th, (Dr.x1 + W + th) / 2, H / 2, sz, wallM);
    beBox(R, Dr.x1 - Dr.x0, H - Dr.h, th, (Dr.x0 + Dr.x1) / 2, (H + Dr.h) / 2, sz, wallM);
    for (const x of [Dr.x0 - 0.04, Dr.x1 + 0.04]) beBox(R, 0.08, Dr.h, th + 0.04, x, Dr.h / 2, sz, trim);
    beBox(R, Dr.x1 - Dr.x0 + 0.16, 0.08, th + 0.04, (Dr.x0 + Dr.x1) / 2, Dr.h + 0.04, sz, trim);
    beBox(R, th, H, 2 * D, -W - th / 2, H / 2, 0, wallM);
    beBox(R, th, H, 2 * D, W + th / 2, H / 2, 0, wallM);
    // skirting
    beBox(R, 2 * W, 0.1, 0.02, 0, 0.05, -D + 0.01, trim); beBox(R, 0.02, 0.1, 2 * D, -W + 0.01, 0.05, 0, trim); beBox(R, 0.02, 0.1, 2 * D, W - 0.01, 0.05, 0, trim);
    // ---- the mural (colours) and the whiteboard (signs) on the west wall; the exit sign over the door
    const mural = beCanvasTex(1024, 512, (x, w, h) => {
      const cols = ['#e8553e', '#f2b134', '#3f9e8f', '#3b6fb6', '#8e4fa8', '#f08bb0'];
      x.fillStyle = '#f6efe2'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) { x.fillStyle = cols[i % cols.length]; x.globalAlpha = 0.85; x.beginPath(); x.arc(r.range(0, w), r.range(0, h), r.range(40, 140), 0, Math.PI * 2); x.fill(); }
      x.globalAlpha = 1; x.fillStyle = '#1d2433'; x.font = '700 92px Inter, sans-serif'; x.textAlign = 'center'; x.fillText('MOVE · LISTEN · LEARN', w / 2, h / 2 + 30);
    });
    this.mural = gbAdd(R, new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshStandardMaterial({ map: mural, roughness: 0.8, name: 'beCtrMuralPaint' }), -W + 0.01, 1.75, -1.2, { ry: Math.PI / 2, cast: false });
    const board = beCanvasTex(512, 384, (x, w, h) => {
      x.fillStyle = '#f7f8f8'; x.fillRect(0, 0, w, h); x.fillStyle = '#28406a'; x.font = '600 40px Inter, sans-serif';
      ['WEEK 3', '· wall  vs  gap', '· column at 1 m', '· click, pause, listen'].forEach((s, i) => x.fillText(s, 30, 70 + i * 70));
    });
    this.board = gbAdd(R, new THREE.PlaneGeometry(1.6, 1.2), new THREE.MeshStandardMaterial({ map: board, roughness: 0.3, name: 'beCtrWhiteboardPanel' }), -W + 0.015, 1.5, 2.0, { ry: Math.PI / 2, cast: false });
    beBox(R, 0.03, 1.26, 1.66, -W + 0.01, 1.5, 2.0, gbMat('#b0b4b8', { rough: 0.4, metal: 0.6, name: 'beCtrBoardFrameMetal' }));
    const exitTx = beCanvasTex(256, 96, (x, w, h) => { x.fillStyle = '#1f9a52'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffffff'; x.font = '700 58px Inter, sans-serif'; x.textAlign = 'center'; x.fillText('EXIT', w / 2, h / 2 + 20); });
    this.exit = gbAdd(R, new THREE.BoxGeometry(0.42, 0.16, 0.05), new THREE.MeshStandardMaterial({ map: exitTx, emissive: '#ffffff', emissiveMap: exitTx, emissiveIntensity: 0.8, name: 'beCtrExitSignLamp' }), (Dr.x0 + Dr.x1) / 2, Dr.h + 0.35, D - 0.04, { ry: Math.PI });
    // ---- training props
    const P = C.part, panM = gbMat('#d9dde2', { rough: 0.55, name: 'beCtrPartitionPanel' }), footM = gbMat('#3a3d44', { rough: 0.5, metal: 0.4, name: 'beCtrFootMetal' });
    this.partition = new THREE.Group(); R.add(this.partition);
    for (const s of [-1, 1]) {
      const x = P.x + s * (P.gap / 2 + 0.6);
      beBox(this.partition, 1.2, 1.95, 0.06, x, 1.05, P.z, panM);
      for (const e of [-0.5, 0.5]) beBox(this.partition, 0.06, 0.04, 0.5, x + e, 0.02, P.z, footM);
    }
    this.column = gbAdd(R, new THREE.CylinderGeometry(0.17, 0.17, H, 24), gbMat('#e3ded6', { rough: 0.7, name: 'beCtrColumnConcrete' }), C.column.x, H / 2, C.column.z);
    // the metal panel on a stand (faces the room centre)
    this.metal = new THREE.Group(); R.add(this.metal); this.metal.position.copy(C.metal); this.metal.rotation.y = -0.5;
    beBox(this.metal, 1.3, 1.8, 0.03, 0, 1.15, 0, gbMat('#aeb7c0', { rough: 0.22, metal: 0.95, name: 'beCtrPanelSteel', env: 1.2 }));
    for (const s of [-1, 1]) { beBox(this.metal, 0.04, 2.1, 0.04, s * 0.67, 1.05, -0.03, footM); beBox(this.metal, 0.06, 0.04, 0.6, s * 0.67, 0.02, -0.03, footM); }
    // the fabric-covered obstacle: a padded block under a heavy blanket
    this.soft = new THREE.Group(); R.add(this.soft); this.soft.position.copy(C.soft);
    gbAdd(this.soft, beSoftBox(1.05, 1.1, 0.7, { puff: 0.04, wrinkle: 0.012, seed: 8 }), gbMat('#6b4f7a', { rough: 1, name: 'beCtrBlanketFabric' }), 0, 0.55, 0);
    gbAdd(this.soft, beCurtain(1.1, 0.9, 6, 0.85, 13), gbMat('#6b4f7a', { rough: 1, name: 'beCtrBlanketFabric', side: THREE.DoubleSide }), 0, 0.5, 0.36);
    // benches, cones, the coach's chair
    const benchM = gbMat('#b88a5a', { rough: 0.6, name: 'beCtrBenchWood' });
    for (const z of [-2.6, 0.2]) { beBox(R, 0.4, 0.05, 2.2, W - 0.35, 0.45, z, benchM); for (const e of [-0.95, 0.95]) beBox(R, 0.36, 0.43, 0.05, W - 0.35, 0.215, z + e, footM); }
    const coneM = gbMat('#f07a2a', { rough: 0.6, name: 'beCtrConePlastic' });
    for (const [x, z] of [[-3.8, 3.2], [-3.3, 3.4], [4.1, 3.3], [0.0, -3.4]]) gbAdd(R, new THREE.ConeGeometry(0.12, 0.3, 16), coneM, x, 0.15, z);
    const chair = this.chair = new THREE.Group(); R.add(chair); chair.position.set(3.9, 0, 1.6); chair.rotation.y = -2.2;
    beBox(chair, 0.46, 0.04, 0.44, 0, 0.46, 0, benchM); beBox(chair, 0.46, 0.45, 0.04, 0, 0.7, -0.2, benchM);
    for (const [a, b] of [[-0.2, -0.19], [0.2, -0.19], [-0.2, 0.19], [0.2, 0.19]]) beBox(chair, 0.03, 0.46, 0.03, a, 0.23, b, footM);
    this._corridor(corM, trim, lampM, floorTx);
    this._lights();
    beAcousticScene(R);
    this.walls = [
      { p: new THREE.Vector3(0, 0, -D), n: new THREE.Vector3(0, 0, 1), refl: 0.75 },
      { p: new THREE.Vector3(0, 0, D), n: new THREE.Vector3(0, 0, -1), refl: 0.75 },
      { p: new THREE.Vector3(-W, 0, 0), n: new THREE.Vector3(1, 0, 0), refl: 0.75 },
      { p: new THREE.Vector3(W, 0, 0), n: new THREE.Vector3(-1, 0, 0), refl: 0.75 },
    ];
    this.corWalls = [
      { p: new THREE.Vector3(0, 0, C.cor.z0), n: new THREE.Vector3(0, 0, 1), refl: 0.75 },
      { p: new THREE.Vector3(0, 0, C.cor.z1), n: new THREE.Vector3(0, 0, -1), refl: 0.75 },
    ];
    return this;
  }

  _corridor(m, trim, lampM, floorTx) {
    const R = this.root, C = BE_CTR.cor, H = 2.7, th = 0.12, Dr = BE_CTR.door;
    const g = this.corridor = new THREE.Group(); R.add(g);
    const fl = new THREE.MeshStandardMaterial({ color: '#8f9aa3', roughness: 0.35, name: 'beCorFloorVinyl', envMapIntensity: 0.6 });
    gbAdd(g, new THREE.PlaneGeometry(C.lobby.x1 - C.x0, C.lobby.z1 - BE_CTR.D), fl, (C.x0 + C.lobby.x1) / 2, 0.001, (BE_CTR.D + C.lobby.z1) / 2, { rx: -Math.PI / 2, cast: false });
    this.ceilings.push(gbAdd(g, new THREE.PlaneGeometry(C.lobby.x1 - C.x0, C.lobby.z1 - BE_CTR.D), gbMat('#eef0f1', { rough: 0.95, name: 'beCorCeilingPlaster' }), (C.x0 + C.lobby.x1) / 2, H, (BE_CTR.D + C.lobby.z1) / 2, { rx: Math.PI / 2, cast: false }));
    // north side: the practice room's wall is the corridor's wall up to x = 5; beyond it, another wall to the lobby
    beBox(g, C.lobby.x1 - BE_CTR.W, H, th, (BE_CTR.W + C.lobby.x1) / 2, H / 2, BE_CTR.D + th / 2, m);
    beBox(g, th, H, C.z1 - C.z0 + 0.2, C.x0, H / 2, (C.z0 + C.z1) / 2, m);     // the corridor's west end
    // south side: wall from x0 to the side doorway, doorway, wall to x1 (= where it ENDS), then the lobby
    const sz = C.z1 + th / 2, [d0, d1] = C.side;
    beBox(g, d0 - C.x0, H, th, (C.x0 + d0) / 2, H / 2, sz, m);
    beBox(g, d1 - d0, H - 2.05, th, (d0 + d1) / 2, (H + 2.05) / 2, sz, m);
    beBox(g, C.x1 - d1, H, th, (d1 + C.x1) / 2, H / 2, sz, m);
    beBox(g, 0.16, H, 0.16, C.x1, H / 2, sz, trim);                              // the wall's end (a corner bead)
    // a dark room beyond the side doorway
    beBox(g, d1 - d0 + 1.6, H, th, (d0 + d1) / 2, H / 2, C.z1 + 2.2, gbMat('#2a2c30', { rough: 0.9, name: 'beCorBackroomWall' }));
    // the lobby: east and south walls, a bench, a plant
    beBox(g, th, H, C.lobby.z1 - BE_CTR.D, C.lobby.x1, H / 2, (BE_CTR.D + C.lobby.z1) / 2, m);
    const [l0, l1] = C.lobby.door, lz = C.lobby.z1;
    beBox(g, l0 - C.x1, H, th, (C.x1 + l0) / 2, H / 2, lz, m); beBox(g, C.lobby.x1 - l1, H, th, (l1 + C.lobby.x1) / 2, H / 2, lz, m);
    beBox(g, l1 - l0, H - 2.1, th, (l0 + l1) / 2, (H + 2.1) / 2, lz, m);
    for (const x of [l0 - 0.04, l1 + 0.04]) beBox(g, 0.08, 2.1, th + 0.04, x, 1.05, lz, trim);
    beBox(g, l1 - l0 + 1.4, H, th, (l0 + l1) / 2, H / 2, lz + 2.0, gbMat('#2a2c30', { rough: 0.9, name: 'beCorBackroomWall' }));
    beBox(g, th, H, C.lobby.z1 - C.z1, C.x1 - th / 2 - 0.08, H / 2, (C.z1 + C.lobby.z1) / 2 + 0.06, m);   // the lobby's west wall (behind the corridor's end)
    beBox(g, 0.45, 0.45, 1.8, 9.6, 0.225, 6.6, gbMat('#7d6a58', { rough: 0.7, name: 'beCorBenchWood' }));
    for (let x = C.x0 + 1.5; x < C.lobby.x1; x += 3) this.ceilings.push(beBox(g, 0.6, 0.03, 0.6, x, H - 0.02, (C.z0 + C.z1) / 2, lampM, { cast: false }));
    beBox(g, C.x1 - C.x0, 0.1, 0.02, (C.x0 + C.x1) / 2, 0.05, C.z1 - 0.01, trim);
  }

  _lights() {
    const S = this.scene;
    S.add(this.hemi = new THREE.HemisphereLight('#dfe8f4', '#a08060', 0.6));
    const sun = this.sun = new THREE.DirectionalLight('#fff0dc', 2.5);
    sun.position.set(-3, 8, -10); sun.target.position.set(0, 0, 0); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.03; sun.shadow.radius = 3;
    const c = sun.shadow.camera; c.left = -9; c.right = 9; c.top = 9; c.bottom = -9; c.near = 1; c.far = 30;
    S.add(sun); S.add(sun.target);
    this.fill = []; for (const [x, z] of [[-3, -1], [3, -1], [0, 2]]) { const p = new THREE.PointLight('#fff4e4', 3.4, 9, 1.4); p.position.set(x, 2.9, z); S.add(p); this.fill.push(p); }
    for (const [x, z] of [[-1, 5], [3.5, 5], [7.5, 5.6], [8.5, 7.8]]) { const p = new THREE.PointLight('#fff2de', 3.2, 7, 1.5); p.position.set(x, 2.5, z); S.add(p); this.fill.push(p); }
  }
  update(t, L, cam, shot) {}
}

// ---------------------------------------------------------------------------------------------------------------------
// THE CANE: a white long cane with a red lower band, from her right hand to a tip ON the floor (fixed length; the tip
// sweeps an arc in front of her). beCaneUpdate(cane, H, sweep (−1…1), reach (0…1: how far ahead), lift (m))
// ---------------------------------------------------------------------------------------------------------------------
function beCane(scene) {
  const g = new THREE.Group(); g.name = 'cane'; scene.add(g);
  const L = 1.2, white = gbMat('#f4f4f2', { rough: 0.35, name: 'beCaneShaftMetal' }), red = gbMat('#c23a32', { rough: 0.4, name: 'beCaneBandMetal' });
  gbAdd(g, new THREE.CylinderGeometry(0.0065, 0.0065, L * 0.82, 10), white, 0, L * 0.41 + L * 0.18, 0);
  gbAdd(g, new THREE.CylinderGeometry(0.0066, 0.0066, L * 0.16, 10), red, 0, L * 0.1, 0);
  gbAdd(g, new THREE.SphereGeometry(0.016, 12, 8), gbMat('#22252a', { rough: 0.6, name: 'beCaneTipRubber' }), 0, 0.008, 0);
  gbAdd(g, new THREE.CylinderGeometry(0.012, 0.012, 0.18, 10), gbMat('#1d1f24', { rough: 0.8, name: 'beCaneGripRubber' }), 0, L - 0.07, 0);
  g.userData.L = L; beAcousticScene(g, 'hero');
  return g;
}
const _beCq = new THREE.Quaternion(), _beUp = new THREE.Vector3(0, 1, 0);
function beCaneUpdate(cane, H, sweep, o = {}) {
  cane.visible = true;
  H.root.updateMatrixWorld(true);
  const hand = H.worldOf('RWr').add(new THREE.Vector3(0, -0.06, 0)), L = cane.userData.L;
  const yaw = H.root.rotation.y + (o.side ?? -0.12) + sweep * 0.45;
  const h = Math.max(0.05, hand.y - 0.01 - (o.lift || 0)), d = Math.sqrt(Math.max(0.01, L * L - h * h));
  const tip = new THREE.Vector3(hand.x + Math.sin(yaw) * d, hand.y - h, hand.z + Math.cos(yaw) * d);
  cane.position.copy(tip);
  _beCq.setFromUnitVectors(_beUp, hand.clone().sub(tip).normalize()); cane.quaternion.copy(_beCq);
  return tip;
}
// the arm that holds the cane: the hand low and forward, beside the hip
function beCaneArm(H, P) { Object.assign(P, { RShX: -34, RShAbd: 12, RElX: -22, RFing: 0.85, RThumb: 0.6 }); return P; }
