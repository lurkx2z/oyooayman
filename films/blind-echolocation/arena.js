/* =====================================================================
   ARENA — the final experiment's hall (scenes 12–13): an old brick drill hall turned training space, at dusk.
     The hall      x −8…34, z −11…11; brick walls 9 m high with pilasters every 6 m and tall windows between them (the
                   last blue of the evening outside); steel roof trusses, a timber roof to a 12.2 m ridge; slim cast-iron
                   columns along z ±8.5; a polished concrete floor with the faded lines of an old court; rows of
                   industrial pendant lamps (they go out bank by bank in scene 12)
     The course    the START (a taped cross at the origin, facing +x); 7 m ahead the OBSTACLE, a freestanding partition
                   (plywood on a timber frame, z −3…3, 2.8 m high); on her LEFT a dead-end BAY: a long partition at z −5.2
                   and a back wall at x 11 close it (the obstacle and a return wall at z −3 make its other side); on her
                   RIGHT the open PASSAGE between the obstacle's end (z 3) and a stack of big crates (z 5…7.2), and beyond
                   it the open hall; further off: two tall fabric screens, a low timber stage at the far end
   ===================================================================== */
const BE_ARENA = { x0: -8, x1: 34, z0: -11, z1: 11, H: 9, ridge: 12.2, bay: 6,
  O: { x: 7.0, z0: -3.0, z1: 3.0, h: 2.8, t: 0.12 }, A: { z: -5.2, x0: 4.6, x1: 11.0 }, back: { x: 11.0 }, ret: { z: -3.0 },
  crates: { x0: 5.6, x1: 8.6, z0: 5.0, z1: 7.2 }, win: { y0: 4.4, y1: 8.1, w: 3.2 } };

class BeArena {
  constructor() { this.scene = new THREE.Scene(); this.scene.name = 'arena'; this.root = new THREE.Group(); this.scene.add(this.root); }
  build() {
    const S = this.scene, R = this.root, C = BE_ARENA, r = new RNG(1201), L = C.x1 - C.x0, Wd = C.z1 - C.z0;
    const top = this.top = [];   // what is above the walls (the roof, its trusses, the lamps): it dissolves as scene 13 rises
    S.background = new THREE.Color('#0a0d16');
    // ---- materials
    const brickTx = (rep) => beCanvasTex(512, 512, (x, w, h) => {
      x.fillStyle = '#4e3c36'; x.fillRect(0, 0, w, h);
      const bh = 512 / 16, bw = 512 / 4;
      for (let j = 0; j < 16; j++) for (let i = -1; i < 5; i++) {
        const v = r.range(-16, 16), dk = r.next() < 0.08 ? -26 : 0, x0 = i * bw + (j % 2) * bw / 2;
        x.fillStyle = `rgb(${126 + v + dk},${84 + v * 0.7 + dk},${70 + v * 0.6 + dk})`; x.fillRect(x0 + 3, j * bh + 3, bw - 6, bh - 6);
      }
      Tex.noise(x, w, h, 12, r);
    }, rep);
    const brickM = new THREE.MeshStandardMaterial({ map: brickTx([L / 4, C.H / 2.2]), color: '#bab0aa', roughness: 0.85, name: 'beArenaWallBrick', envMapIntensity: 0.3 });
    const brickEndM = new THREE.MeshStandardMaterial({ map: brickTx([Wd / 4, C.H / 2.2]), color: '#bab0aa', roughness: 0.85, name: 'beArenaEndWallBrick', envMapIntensity: 0.3 });
    const pierM = new THREE.MeshStandardMaterial({ map: brickTx([0.4, C.H / 2.2]), color: '#aaa098', roughness: 0.85, name: 'beArenaPierBrick', envMapIntensity: 0.3 });
    const floorTx = beCanvasTex(2048, 1024, (x, w, h) => {
      x.fillStyle = '#8a8a86'; x.fillRect(0, 0, w, h); Tex.noise(x, w, h, 9, r);
      for (let k = 0; k < 140; k++) { x.fillStyle = `rgba(60, 60, 58, ${r.range(0.02, 0.07)})`; x.beginPath(); x.ellipse(r.range(0, w), r.range(0, h), r.range(30, 160), r.range(15, 80), r.range(0, 3), 0, 7); x.fill(); }
      x.strokeStyle = 'rgba(46, 46, 44, 0.5)'; x.lineWidth = 3;
      for (let i = 1; i < 7; i++) { x.beginPath(); x.moveTo(i * w / 7, 0); x.lineTo(i * w / 7, h); x.stroke(); }
      for (let j = 1; j < 4; j++) { x.beginPath(); x.moveTo(0, j * h / 4); x.lineTo(w, j * h / 4); x.stroke(); }
      // the old court's lines (faded paint): the outline, the centre line and circle, the keys
      const X = (m) => (m - C.x0) / L * w, Z = (m) => (m - C.z0) / Wd * h;
      x.strokeStyle = 'rgba(214, 190, 120, 0.32)'; x.lineWidth = 7;
      x.strokeRect(X(-4), Z(-8), X(30) - X(-4), Z(8) - Z(-8));
      x.beginPath(); x.moveTo(X(13), Z(-8)); x.lineTo(X(13), Z(8)); x.stroke();
      x.beginPath(); x.ellipse(X(13), Z(0), X(13 + 1.8) - X(13), Z(1.8) - Z(0), 0, 0, 7); x.stroke();
      x.strokeStyle = 'rgba(230, 228, 220, 0.22)'; x.lineWidth = 5;
      x.strokeRect(X(-4), Z(-2.5), X(1.8) - X(-4), Z(2.5) - Z(-2.5)); x.strokeRect(X(24.2), Z(-2.5), X(30) - X(24.2), Z(2.5) - Z(-2.5));
    }, [1, 1]);
    const floorM = this.floorM = new THREE.MeshStandardMaterial({ map: floorTx, color: '#bdbdb8', roughness: 0.3, name: 'beArenaFloorConcrete', envMapIntensity: 0.8 });
    gbAdd(R, new THREE.PlaneGeometry(L, Wd), floorM, (C.x0 + C.x1) / 2, 0, 0, { rx: -Math.PI / 2, cast: false });
    // ---- the long walls: brick below, between and above the windows; pilasters every 6 m
    const W = C.win, bays = []; for (let x = C.x0 + 3; x < C.x1 - 1; x += C.bay) bays.push(x);
    const box = (w, h, d, x, y, z, m, o) => beBox(R, w, h, d, x, y, z, m, o);
    for (const [z, s] of [[C.z0, -1], [C.z1, 1]]) {
      const zc = z + s * 0.2;
      box(L, W.y0, 0.4, (C.x0 + C.x1) / 2, W.y0 / 2, zc, brickM);
      box(L, C.H - W.y1, 0.4, (C.x0 + C.x1) / 2, (C.H + W.y1) / 2, zc, brickM);
      let px = C.x0; for (const bx of bays) { const a = bx - W.w / 2; if (a > px) box(a - px, W.y1 - W.y0, 0.4, (a + px) / 2, (W.y0 + W.y1) / 2, zc, brickM); px = bx + W.w / 2; }
      if (px < C.x1) box(C.x1 - px, W.y1 - W.y0, 0.4, (C.x1 + px) / 2, (W.y0 + W.y1) / 2, zc, brickM);
      for (let x = C.x0; x <= C.x1 + 0.01; x += C.bay) box(0.7, C.H, 0.35, x, C.H / 2, z - s * 0.12, pierM);
    }
    // the end walls (west: the doors she comes in by; east: plain brick behind the stage)
    box(0.4, C.H, Wd, C.x1 + 0.2, C.H / 2, 0, brickEndM);
    box(0.4, C.H, Wd / 2 - 1.4, C.x0 - 0.2, C.H / 2, -(Wd / 2 + 1.4) / 2, brickEndM);
    box(0.4, C.H, Wd / 2 - 1.4, C.x0 - 0.2, C.H / 2, (Wd / 2 + 1.4) / 2, brickEndM);
    box(0.4, C.H - 3.2, 2.8, C.x0 - 0.2, (C.H + 3.2) / 2, 0, brickEndM);
    const doorM = gbMat('#3f4a44', { rough: 0.55, metal: 0.3, name: 'beArenaDoorSteel' });
    this.doors = [-1, 1].map((s) => { const p = new THREE.Group(); p.position.set(C.x0 - 0.05, 0, s * 1.4); R.add(p); beBox(p, 0.08, 3.15, 1.38, 0, 1.575, -s * 0.69, doorM); return p; });
    // gable ends above the walls (dark timber), the roof (two timber planes), the trusses (steel)
    const roofTx = beCanvasTex(512, 512, (x, w, h) => { for (let i = 0; i < 16; i++) { const v = r.range(-10, 10); x.fillStyle = `rgb(${58 + v},${44 + v},${34 + v})`; x.fillRect(0, i * 32, w, 32); x.fillStyle = 'rgba(20, 14, 10, 0.6)'; x.fillRect(0, i * 32, w, 2); } Tex.noise(x, w, h, 6, r); }, [L / 3, 4]);
    const roofM = new THREE.MeshStandardMaterial({ map: roofTx, color: '#a08c7c', roughness: 0.8, name: 'beArenaRoofWood', envMapIntensity: 0.2 });
    const slope = Math.atan2(C.ridge - C.H, Wd / 2), len = Math.hypot(C.ridge - C.H, Wd / 2) + 0.4;
    for (const s of [-1, 1]) top.push(this.roof = gbAdd(R, new THREE.PlaneGeometry(L, len), roofM, (C.x0 + C.x1) / 2, (C.H + C.ridge) / 2, s * Wd / 4, { rx: Math.PI / 2 + s * -slope * 1, cast: true }));
    for (const x of [C.x0, C.x1]) { const sh = new THREE.Shape(); sh.moveTo(-Wd / 2, 0); sh.lineTo(Wd / 2, 0); sh.lineTo(0, C.ridge - C.H); sh.lineTo(-Wd / 2, 0);
      top.push(gbAdd(R, new THREE.ShapeGeometry(sh), brickEndM, x + (x < 0 ? -0.05 : 0.05), C.H, 0, { ry: Math.PI / 2 })); }
    const steelM = gbMat('#2f3438', { rough: 0.45, metal: 0.7, name: 'beArenaTrussSteel' });
    const beam = (a, b, s = 0.14) => { const d = b.clone().sub(a), m = beBox(R, s, s, d.length(), (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, steelM, { cast: false }); m.lookAt(b.x, b.y, b.z); m.updateMatrix(); top.push(m); return m; };
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    for (let x = C.x0 + C.bay; x < C.x1 - 0.5; x += C.bay) {
      beam(V(x, C.H, C.z0 + 0.3), V(x, C.H, C.z1 - 0.3), 0.18);
      beam(V(x, C.H, C.z0 + 0.3), V(x, C.ridge - 0.25, 0), 0.18); beam(V(x, C.H, C.z1 - 0.3), V(x, C.ridge - 0.25, 0), 0.18);
      for (const s of [-1, 1]) for (let k = 1; k < 5; k++) { const z = s * (Wd / 2 - 0.3) * (1 - k / 5), y = C.H + (C.ridge - 0.25 - C.H) * k / 5; beam(V(x, C.H, z), V(x, y, z), 0.08); if (k < 4) beam(V(x, y, z), V(x, C.H, s * (Wd / 2 - 0.3) * (1 - (k + 1) / 5)), 0.07); }
    }
    beam(V(C.x0, C.ridge - 0.3, 0), V(C.x1, C.ridge - 0.3, 0), 0.2);
    // the windows: steel mullions, glass, the dusk outside (a glow plane beyond each)
    const frameM = gbMat('#262a2e', { rough: 0.4, metal: 0.6, name: 'beArenaWindowFrameMetal' });
    const glassM = new THREE.MeshStandardMaterial({ color: '#9fb6d0', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.12, depthWrite: false, name: 'beArenaWindowGlass', envMapIntensity: 1.0 });
    const skyTx = beCanvasTex(64, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1d2c52'); g.addColorStop(0.6, '#3a5584'); g.addColorStop(1, '#8a7a8c'); x.fillStyle = g; x.fillRect(0, 0, w, h); }, [1, 1]);
    const skyM = this.skyM = new THREE.MeshBasicMaterial({ map: skyTx, color: '#ffffff', name: 'beArenaDuskSkyGlow', fog: false });
    for (const [z, s] of [[C.z0, -1], [C.z1, 1]]) for (const bx of bays) {
      const g = gbAdd(R, new THREE.PlaneGeometry(W.w, W.y1 - W.y0), glassM, bx, (W.y0 + W.y1) / 2, z + s * 0.2, { cast: false }); g.castShadow = false;
      gbAdd(R, new THREE.PlaneGeometry(W.w + 2, W.y1 - W.y0 + 2), skyM, bx, (W.y0 + W.y1) / 2, z + s * 3, { ry: s > 0 ? Math.PI : 0, cast: false });
      for (let k = 0; k <= 4; k++) beBox(R, 0.06, W.y1 - W.y0, 0.1, bx - W.w / 2 + k * W.w / 4, (W.y0 + W.y1) / 2, z + s * 0.2, frameM, { cast: true });
      for (let k = 0; k <= 5; k++) beBox(R, W.w, 0.06, 0.1, bx, W.y0 + k * (W.y1 - W.y0) / 5, z + s * 0.2, frameM, { cast: true });
    }
    // the cast-iron columns
    const colM = gbMat('#3a3f3c', { rough: 0.5, metal: 0.6, name: 'beArenaColumnMetal' });
    this.columns = [];
    for (let x = C.x0 + C.bay; x < C.x1 - 0.5; x += C.bay) for (const z of [-8.5, 8.5]) { gbAdd(R, new THREE.CylinderGeometry(0.16, 0.2, C.H, 14), colM, x, C.H / 2, z); gbAdd(R, new THREE.CylinderGeometry(0.3, 0.3, 0.3, 14), colM, x, 0.15, z); this.columns.push(V(x, 0, z)); }
    // ---- the course
    const plyTx = beCanvasTex(512, 256, (x, w, h) => { x.fillStyle = '#c8a878'; x.fillRect(0, 0, w, h); for (let k = 0; k < 90; k++) { x.strokeStyle = `rgba(120, 84, 48, ${r.range(0.05, 0.16)})`; x.lineWidth = r.range(1, 3); x.beginPath(); const y = r.range(0, h); x.moveTo(0, y); x.bezierCurveTo(w * 0.3, y + r.range(-12, 12), w * 0.7, y + r.range(-12, 12), w, y + r.range(-8, 8)); x.stroke(); }
      x.fillStyle = 'rgba(70, 50, 30, 0.6)'; x.fillRect(w / 2 - 1, 0, 2, h); Tex.noise(x, w, h, 6, r); }, [1, 1]);
    const plyM = new THREE.MeshStandardMaterial({ map: plyTx, color: '#e2cfb2', roughness: 0.6, name: 'beArenaPartitionWood', envMapIntensity: 0.3 });
    const timM = gbMat('#6a4a30', { rough: 0.7, name: 'beArenaFrameWood' });
    const partition = (x0, z0, x1, z1, h, fs = -1) => {   // a plywood partition on a timber frame (on its back, side fs), with braced feet
      const len = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(-(z1 - z0), x1 - x0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, g = new THREE.Group(); g.position.set(cx, 0, cz); g.rotation.y = a; R.add(g);
      beBox(g, len, h, 0.04, 0, h / 2 + 0.06, 0, plyM);
      for (const y of [0.1, h / 2 + 0.06, h + 0.02]) beBox(g, len + 0.08, 0.09, 0.09, 0, y, fs * 0.065, timM);
      for (let k = 0; k <= Math.ceil(len / 1.2); k++) { const u = -len / 2 + k * len / Math.ceil(len / 1.2); beBox(g, 0.09, h + 0.06, 0.09, u, h / 2 + 0.06, fs * 0.065, timM); beBox(g, 0.09, 0.09, 1.1, u, 0.05, fs * 0.4, timM); }
      return g;
    };
    const O = C.O;
    this.obstacle = partition(O.x, O.z0, O.x, O.z1, O.h);
    partition(C.A.x0, C.A.z, C.A.x1, C.A.z, O.h);           // the bay's long side
    partition(C.back.x, C.A.z, C.back.x, C.ret.z, O.h);     // its back
    partition(O.x + 0.1, C.ret.z, C.back.x, C.ret.z, O.h, 1);  // its return (behind the obstacle's left end)
    // the crates: big plywood shipping crates, stacked
    const crateTx = beCanvasTex(256, 256, (x, w, h) => { x.fillStyle = '#9a7650'; x.fillRect(0, 0, w, h); for (let i = 0; i < 6; i++) { const v = r.range(-14, 14); x.fillStyle = `rgb(${150 + v},${116 + v},${78 + v})`; x.fillRect(4, i * 43 + 3, w - 8, 38); }
      x.strokeStyle = 'rgba(60, 40, 22, 0.8)'; x.lineWidth = 10; x.strokeRect(5, 5, w - 10, h - 10); x.beginPath(); x.moveTo(5, 5); x.lineTo(w - 5, h - 5); x.stroke(); Tex.noise(x, w, h, 8, r); }, [1, 1]);
    const crateM = new THREE.MeshStandardMaterial({ map: crateTx, roughness: 0.75, name: 'beArenaCrateWood', envMapIntensity: 0.2 });
    const Cr = C.crates;
    for (const [x, z, s, y, ry] of [[6.3, 5.75, 1.4, 0, 0.03], [7.8, 5.8, 1.5, 0, -0.04], [7.0, 6.55, 1.3, 0, 0.1], [6.5, 5.85, 1.25, 1.4, -0.05], [7.75, 6.0, 1.2, 1.5, 0.12], [7.2, 6.1, 1.0, 2.7, 0.3]])
      beBox(R, s, s, s, x, y + s / 2, z, crateM, { ry });
    void Cr;
    // the soft screens (fabric on frames) and the stage
    const felt = gbMat('#4a5568', { rough: 1, name: 'beArenaScreenFelt' });
    for (const [x, z, a] of [[16.5, -3.8, 0.35], [19.5, 4.6, -0.5], [23.5, -6.2, 0.1]]) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = a; R.add(g); beBox(g, 2.4, 2.2, 0.16, 0, 1.25, 0, felt); for (const u of [-1.15, 1.15]) beBox(g, 0.06, 2.4, 0.5, u, 1.2, 0, timM); }
    const stageM = gbMat('#4a3424', { rough: 0.55, name: 'beArenaStageWood' });
    beBox(R, 5.5, 0.9, 14, 31.2, 0.45, 0, stageM); for (let k = 0; k < 3; k++) beBox(R, 0.4, 0.3 * (k + 1), 3, 28.25 - k * 0.4 + 0.8, 0.15 * (k + 1), 0, stageM);
    // the start: a taped cross on the floor
    const tapeM = gbMat('#e8e4d8', { rough: 0.5, name: 'beArenaTapeCloth' });
    beBox(R, 0.6, 0.004, 0.06, 0, 0.003, 0, tapeM, { cast: false }); beBox(R, 0.06, 0.004, 0.6, 0, 0.003, 0, tapeM, { cast: false });
    // ---- the lamps: industrial domes in two rows; a few real lights among them
    const shadeM = gbMat('#2f4a40', { rough: 0.4, metal: 0.5, name: 'beArenaLampShadeMetal' });
    const bulbM = this.bulbM = new THREE.MeshStandardMaterial({ color: '#fff3dc', emissive: '#ffcf8a', emissiveIntensity: 2.4, name: 'beArenaLampGlow' });
    this.lamps = [];
    for (let x = C.x0 + 4; x < C.x1; x += C.bay) for (const z of [-4.5, 4.5]) {
      const g = new THREE.Group(); g.position.set(x, 6.4, z); R.add(g); top.push(g);
      const sh = gbAdd(g, new THREE.SphereGeometry(0.45, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), shadeM, 0, 0, 0, { cast: false }); sh.material.side = THREE.DoubleSide;
      const bm = bulbM.clone(); const b = gbAdd(g, new THREE.SphereGeometry(0.13, 12, 8), bm, 0, 0.02, 0, { cast: false });
      gbAdd(g, new THREE.CylinderGeometry(0.008, 0.008, C.H + 0.6 - 6.4, 4), steelM, 0, (C.H + 0.6 - 6.4) / 2 + 0.4, 0, { cast: false });
      this.lamps.push({ x, z, m: bm, b });
    }
    // ---- lights
    S.add(this.hemi = new THREE.HemisphereLight('#a8b4cc', '#4a3c34', 0.55));
    const dusk = this.dusk = new THREE.DirectionalLight('#9fb4e8', 1.1); dusk.position.set(4, 14, 30); dusk.target.position.set(6, 0, -2); dusk.castShadow = true;
    dusk.shadow.mapSize.set(4096, 4096); dusk.shadow.bias = -0.0004; dusk.shadow.normalBias = 0.04; dusk.shadow.radius = 3;
    const sc = dusk.shadow.camera; sc.left = -26; sc.right = 26; sc.top = 20; sc.bottom = -20; sc.near = 5; sc.far = 70;
    S.add(dusk); S.add(dusk.target);
    const key = this.key = new THREE.DirectionalLight('#ffe2b8', 0.9); key.position.set(-2, 16, 3); key.target.position.set(6, 0, 0); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03; key.shadow.radius = 4;
    const kc = key.shadow.camera; kc.left = -12; kc.right = 12; kc.top = 12; kc.bottom = -12; kc.near = 4; kc.far = 40;
    S.add(key); S.add(key.target);
    this.pts = [];
    for (const [x, z] of [[-4, 0], [2, -4.5], [8, 4.5], [8, -4.5], [14, 0], [26, 0]]) { const p = new THREE.PointLight('#ffd29a', 0, 16, 1.5); p.position.set(x, 5.8, z); S.add(p); this.pts.push(p); }
    beAcousticScene(R, 'world', { beArenaLampGlow: { refl: 0.2, crisp: 0.3 }, beArenaDuskSkyGlow: { refl: 0, crisp: 0 }, beArenaScreenFelt: { refl: 0.2, crisp: 0.05 } });
    // the reflecting planes (wavefront shells): the obstacle's face, the bay, the hall's walls and the floor
    const P = (x, y, z) => new THREE.Vector3(x, y, z);
    this.planes = {
      obstacle: { p: P(O.x, 0, 0), n: P(-1, 0, 0), refl: 0.85, clip2: [P(0, 0, O.z0 - 0.4), P(0, 0, 1)] },
      bayA: { p: P(0, 0, C.A.z), n: P(0, 0, 1), refl: 0.8 }, bayBack: { p: P(C.back.x, 0, 0), n: P(-1, 0, 0), refl: 0.8, clip2: [P(0, 0, C.ret.z), P(0, 0, -1)] },
      floor: { p: P(0, 0, 0), n: P(0, 1, 0), refl: 0.6, floor: true },
      far: { p: P(C.x1, 0, 0), n: P(-1, 0, 0), refl: 0.75 }, north: { p: P(0, 0, C.z0), n: P(0, 0, 1), refl: 0.7 }, south: { p: P(0, 0, C.z1), n: P(0, 0, -1), refl: 0.7 },
      roof: { p: P(0, C.H + 1.5, 0), n: P(0, -1, 0), refl: 0.5 },
    };
    return this;
  }
  // the lamps (bank by bank: dim(x) 1 = on, 0 = off) and the lights; lit = reality's share (the sound view darkens all)
  light(dimAt, lit) {
    for (const q of this.lamps) { const k = dimAt(q.x); q.m.emissiveIntensity = 2.4 * k * lit + 0.02; q.m.color.setScalar(0.25 + 0.75 * k); }
    this.pts.forEach((p, i) => { p.intensity = 26 * dimAt([-4, 2, 8, 8, 14, 26][i]) * lit; });
    const avg = this.lamps.reduce((s, q) => s + dimAt(q.x), 0) / this.lamps.length;
    this.key.intensity = 0.9 * avg * lit; this.hemi.intensity = (0.22 + 0.36 * avg) * lit; this.dusk.intensity = (1.1 + 0.5 * (1 - avg)) * lit;
    this.skyM.color.setScalar(lit < 0.99 ? 0.15 + 0.85 * lit : 1);
  }
}
