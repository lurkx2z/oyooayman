/* =====================================================================
   CITY — the street for scenes 9–11 (and the sound-field city of scene 13): a main road and a side street.
     Main road     along x, z −7…7 (four lanes, 0.15 m below the pavements), traffic both ways (VehicleFactory cars + a bus)
     Pavements     z 7…12 (south: hers) and −12…−7 (north): paving slabs, kerbs, trees in pits, lamp posts, a bus shelter,
                   café tables (two people talking), a bike rack, bins, benches; scaffolding on the north side (works)
     Side street   x 30…40, crossing the main road. Her crossing (south) is a RAISED crosswalk at pavement level with
                   tactile paving at both kerbs and an ACCESSIBLE PEDESTRIAN SIGNAL on each side (locator tone, push
                   button with a raised arrow, walk/wait display). Two side-street cars wait at the stop line.
     Blocks        south x −120…27 (shops), x 43…160 (an ARCADE: a covered walkway behind columns, scenes 10–11, with
                   the glass door of a café-bookshop at x 58), north x −120…27 and 43…160
     Sky           a dome with drifting cloud; u.uCloud 0 (bright afternoon) → 1 (storm), used by scene 10
   Every moving thing is a pure function of t (cars: constant lane speeds on a wrapped track; people: blocking).
   ===================================================================== */
const BE_CITY = {
  roadY: -0.15, road: 7, walk: 12, side: [30, 40], blockA: [-120, 27], blockB: [43, 160], arcade: { back: 15.2, h: 4.2, door: 58 },   // the covered walkway: z 12 (columns) … 15.2 (shopfronts)
  path: 9.5,                       // her line along the south pavement
  apsA: new THREE.Vector3(29.5, 0, 8.75), apsB: new THREE.Vector3(40.5, 0, 8.75),
  lanes: [{ z: 5.25, dir: 1, v: 8.6 }, { z: 1.75, dir: 1, v: 10.8 }, { z: -1.75, dir: -1, v: 10.2 }, { z: -5.25, dir: -1, v: 8.2 }],
  track: [-130, 170],
};

class BeCity {
  constructor() { this.scene = new THREE.Scene(); this.scene.name = 'city'; this.root = new THREE.Group(); this.scene.add(this.root); }
  build() {
    const S = this.scene, R = this.root, C = BE_CITY, r = this.r = new RNG(909);
    S.background = new THREE.Color('#b9c8d6');
    this._ground(); this._blocks(); this._street(); this._aps(); this._sky(); this._lights();
    this._traffic();
    beAcousticScene(R, 'world', { beCityTreeLeaf: { refl: 0.25, crisp: 0.05 }, beCityAwningCloth: { refl: 0.3, crisp: 0.05 } });
    // the reflecting planes for the sound-field (the two building lines; the arcade's back wall)
    this.walls = [{ p: new THREE.Vector3(0, 0, C.walk), n: new THREE.Vector3(0, 0, -1), refl: 0.8 }, { p: new THREE.Vector3(0, 0, -C.walk), n: new THREE.Vector3(0, 0, 1), refl: 0.8 }];
    return this;
  }

  // ---------------------------------------------------------------------------------------------------- ground
  _ground() {
    const R = this.root, C = BE_CITY, r = this.r, Y = C.roadY;
    const asph = beCanvasTex(1024, 1024, (x, w, h) => { x.fillStyle = '#4a4b4e'; x.fillRect(0, 0, w, h); Tex.noise(x, w, h, 14, r);
      for (let k = 0; k < 40; k++) { x.strokeStyle = `rgba(25, 25, 28, ${r.range(0.15, 0.35)})`; x.lineWidth = r.range(1, 3); x.beginPath(); let px = r.range(0, w), py = r.range(0, h); x.moveTo(px, py); for (let j = 0; j < 6; j++) { px += r.range(-40, 40); py += r.range(-40, 40); x.lineTo(px, py); } x.stroke(); }
      for (let k = 0; k < 12; k++) { x.fillStyle = `rgba(30, 30, 34, ${r.range(0.1, 0.25)})`; x.fillRect(r.range(0, w), r.range(0, h), r.range(60, 200), r.range(40, 120)); } }, [40, 3]);
    const roadM = this.roadM = new THREE.MeshStandardMaterial({ map: asph, color: '#8a8b90', roughness: 0.88, name: 'beCityAsphaltRoad', envMapIntensity: 0.5 });
    const L0 = C.track[0] - 20, L1 = C.track[1] + 20, LW = L1 - L0, mid = (L0 + L1) / 2;
    gbAdd(R, new THREE.PlaneGeometry(LW, 2 * C.road), roadM, mid, Y, 0, { rx: -Math.PI / 2, cast: false });
    for (const s of [-1, 1]) gbAdd(R, new THREE.PlaneGeometry(C.side[1] - C.side[0], 70), roadM, (C.side[0] + C.side[1]) / 2, Y, s * (C.road + 35), { rx: -Math.PI / 2, cast: false });
    // lane markings (one canvas strip across the road: dashed lane lines at ±3.5 m, a double yellow centre line)
    const mk = beCanvasTex(1024, 256, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = 'rgba(238, 238, 230, 0.92)';
      for (let i = 0; i < 4; i++) { x.fillRect(i * 256, 62, 150, 4); x.fillRect(i * 256, h - 66, 150, 4); }
      x.fillStyle = 'rgba(232, 190, 60, 0.95)'; x.fillRect(0, h / 2 - 5, w, 3); x.fillRect(0, h / 2 + 2, w, 3); }, [1, 1]);
    for (const [a, b] of [[L0, C.side[0]], [C.side[1], L1]]) {
      const tx = mk.clone(); tx.wrapS = THREE.RepeatWrapping; tx.repeat.set((b - a) / 24, 1); tx.needsUpdate = true;
      const m = new THREE.MeshStandardMaterial({ map: tx, transparent: true, depthWrite: false, roughness: 0.7, name: 'beCityRoadPaint', polygonOffset: true, polygonOffsetFactor: -2 });
      gbAdd(R, new THREE.PlaneGeometry(b - a, 2 * C.road), m, (a + b) / 2, Y + 0.004, 0, { rx: -Math.PI / 2, cast: false });
    }
    // pavements (slabs), kerbs
    const slabs = beCanvasTex(512, 512, (x, w, h) => { x.fillStyle = '#c4beb3'; x.fillRect(0, 0, w, h); Tex.noise(x, w, h, 8, r);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const v = r.range(-8, 8); x.fillStyle = `rgba(${150 + v}, ${144 + v}, ${134 + v}, 0.25)`; x.fillRect(i * 128 + 2, j * 128 + 2, 124, 124); }
      x.strokeStyle = 'rgba(90, 86, 80, 0.55)'; x.lineWidth = 3; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 128, 0); x.lineTo(i * 128, h); x.stroke(); x.beginPath(); x.moveTo(0, i * 128); x.lineTo(w, i * 128); x.stroke(); } }, [1, 1]);
    const paveM = this.paveM = new THREE.MeshStandardMaterial({ map: slabs, color: '#d4cfc6', roughness: 0.85, name: 'beCityPaveSidewalk', envMapIntensity: 0.45 });
    const pave = (x0, x1, z0, z1) => { const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (x1 - x0) / 2.4, uv.getY(i) * (z1 - z0) / 2.4); slabs.wrapS = slabs.wrapT = THREE.RepeatWrapping; return gbAdd(R, g, paveM, (x0 + x1) / 2, 0, (z0 + z1) / 2, { rx: -Math.PI / 2, cast: false }); };
    const kerbM = gbMat('#a9a59d', { rough: 0.8, name: 'beCityKerbStone' });
    for (const s of [-1, 1]) {
      for (const [a, b] of [[L0, C.side[0]], [C.side[1], L1]]) {
        pave(a, b, s > 0 ? C.road : -C.walk - 30, s > 0 ? C.walk + 30 : -C.road);
        beBox(R, b - a, 0.17, 0.2, (a + b) / 2, -0.07, s * (C.road + 0.1), kerbM, { cast: false });
      }
      // side-street pavements
      pave(C.side[0] - 3, C.side[0], s > 0 ? C.walk : -C.walk - 60, s > 0 ? C.walk + 60 : -C.walk);
      pave(C.side[1], C.side[1] + 3, s > 0 ? C.walk : -C.walk - 60, s > 0 ? C.walk + 60 : -C.walk);
      for (const x of [C.side[0] + 0.1, C.side[1] - 0.1]) beBox(R, 0.2, 0.17, 60, x, -0.07, s * (C.walk + 30), kerbM, { cast: false });
    }
    // the raised crosswalks over the side street (at pavement level), zebra bars, the stop line
    const tableM = new THREE.MeshStandardMaterial({ map: asph, color: '#7d7e83', roughness: 0.85, name: 'beCityAsphaltTable' });
    const zebraM = gbMat('#eeeee6', { rough: 0.6, name: 'beCityRoadPaintZebra' });
    for (const s of [-1, 1]) {
      const z0 = s > 0 ? C.road : -C.walk, z1 = s > 0 ? C.walk : -C.road;
      beBox(R, C.side[1] - C.side[0], 0.15, z1 - z0 + 1.2, (C.side[0] + C.side[1]) / 2, -0.075, (z0 + z1) / 2, tableM, { cast: false });
      for (let x = C.side[0] + 0.6; x < C.side[1] - 0.3; x += 1.0) beBox(R, 0.5, 0.004, z1 - z0 - 0.7, x, 0.002, (z0 + z1) / 2, zebraM, { cast: false });
      beBox(R, (C.side[1] - C.side[0]) / 2, 0.004, 0.3, C.side[0] + (C.side[1] - C.side[0]) * (s > 0 ? 0.25 : 0.75), Y + 0.003, s * (C.walk + 1.4), zebraM, { cast: false });
    }
    // tactile paving (blister / truncated domes) at both ends of her crossing
    const tacM = gbMat('#e3b51e', { rough: 0.55, name: 'beCityTactileStone' });
    const dome = new THREE.SphereGeometry(0.014, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2);
    const spots = []; for (const x0 of [C.side[0] - 0.8, C.side[1]]) { beBox(R, 0.8, 0.01, 3.8, x0 + 0.4, 0.004, 9.7, tacM, { cast: false }); for (let i = 0; i < 12; i++) for (let j = 0; j < 58; j++) spots.push([x0 + 0.04 + i * 0.065, 0.009, 7.85 + j * 0.065]); }
    const im = new THREE.InstancedMesh(dome, tacM, spots.length), M = new THREE.Matrix4();
    spots.forEach((p, i) => { M.makeTranslation(p[0], p[1], p[2]); im.setMatrixAt(i, M); }); im.receiveShadow = true; R.add(im);
  }

  // ---------------------------------------------------------------------------------------------------- buildings
  _blocks() {
    const R = this.root, C = BE_CITY, r = this.r;
    const fac = [
      { name: 'beCityBrickWall', wall: '#9a5a44', trim: '#d9cbb4', win: '#2c3a48' },
      { name: 'beCityStoneWall', wall: '#d8cdb8', trim: '#f0e8da', win: '#334454' },
      { name: 'beCityStoneWallGrey', wall: '#a9aaa6', trim: '#d6d6d0', win: '#2d3b47' },
      { name: 'beCityBrickWallDark', wall: '#6d4a3e', trim: '#cbbca4', win: '#26323d' },
      { name: 'beCityPlasterWall', wall: '#c9b08a', trim: '#efe3cc', win: '#2f3e4c' },
    ].map((F, i) => {
      const tx = beCanvasTex(256, 256, (x, w, h) => {
        x.fillStyle = F.wall; x.fillRect(0, 0, w, h); Tex.noise(x, w, h, 10, r);
        if (/Brick/.test(F.name)) { x.strokeStyle = 'rgba(40, 20, 14, 0.18)'; x.lineWidth = 1; for (let y = 0; y < h; y += 8) { x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); } }
        x.fillStyle = F.trim; x.fillRect(58, 54, 140, 150);
        const g = x.createLinearGradient(0, 62, 0, 196); g.addColorStop(0, '#9fb6c8'); g.addColorStop(0.45, F.win); g.addColorStop(1, '#1a232c');
        x.fillStyle = g; x.fillRect(66, 62, 124, 134);
        x.fillStyle = F.trim; x.fillRect(125, 62, 6, 134); x.fillRect(66, 120, 124, 5); x.fillRect(52, 200, 152, 10);
        if (i % 2 === 0) { x.fillStyle = 'rgba(255, 220, 160, 0.0)'; }
      }, [1, 1]);
      tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
      return { m: new THREE.MeshStandardMaterial({ map: tx, roughness: 0.82, name: F.name, envMapIntensity: 0.35 }), side: gbMat(F.wall, { rough: 0.9, name: F.name + 'Side' }) };
    });
    const shops = ['BAKERY', 'BOOKS', 'FLOWERS', 'HARDWARE', 'TAILOR', 'PHARMACY', 'NOODLES', 'FRAMES', 'RECORDS', 'DELI', 'OPTICIAN', 'BICYCLES', 'GROCER', 'LAUNDRY'];
    const shopTex = shops.map((name, i) => beCanvasTex(512, 256, (x, w, h) => {
      const hue = [24, 200, 140, 0, 280, 160, 10, 45, 330, 90, 210, 120, 60, 190][i];
      x.fillStyle = `hsl(${hue}, 28%, 26%)`; x.fillRect(0, 0, w, h);
      x.fillStyle = `hsl(${hue}, 30%, 34%)`; x.fillRect(0, 0, w, 54);
      x.font = '700 34px Georgia, serif'; x.fillStyle = '#f2e6cf'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(name, w / 2, 29);
      // the windows: a warm interior (shelves, shapes), a door
      const g = x.createLinearGradient(0, 62, 0, h); g.addColorStop(0, '#f3d7a6'); g.addColorStop(1, '#8a6a46'); x.fillStyle = g;
      x.fillRect(16, 66, 300, h - 76); x.fillRect(384, 66, 112, h - 76);
      for (let k = 0; k < 26; k++) { x.fillStyle = `hsla(${(hue + r.range(-60, 60)) | 0}, 40%, ${r.range(25, 60) | 0}%, 0.8)`; x.fillRect(r.range(22, 300), r.range(110, h - 30), r.range(10, 40), r.range(10, 50)); }
      x.fillStyle = 'rgba(60, 40, 25, 0.55)'; for (let y = 110; y < h - 10; y += 46) x.fillRect(16, y, 300, 4);
      x.fillStyle = '#3a2a1e'; x.fillRect(326, 66, 50, h - 66); x.fillStyle = '#e8c890'; x.fillRect(332, 74, 38, 90);
      x.strokeStyle = 'rgba(20, 14, 10, 0.8)'; x.lineWidth = 5; x.strokeRect(16, 66, 300, h - 76); x.strokeRect(384, 66, 112, h - 76);
    }, [1, 1]));
    const shopM = shopTex.map((tx, i) => new THREE.MeshStandardMaterial({ map: tx, emissiveMap: tx, emissive: '#ffffff', emissiveIntensity: 0.22, roughness: 0.35, name: 'beCityShopWindowGlass' + i, envMapIntensity: 0.9 }));
    this.shopM = shopM;
    const awnM = [['#7a2f2a', '#e9dccb'], ['#2f5a4a', '#e9dccb'], ['#2d3f6a', '#e6e0d0'], ['#7a5a22', '#efe6d0']].map(([a, b], i) => new THREE.MeshStandardMaterial({ map: beCanvasTex(128, 128, (x, w, h) => { for (let k = 0; k < 8; k++) { x.fillStyle = k % 2 ? a : b; x.fillRect(k * 16, 0, 16, h); } }, [1, 1]), roughness: 0.9, side: THREE.DoubleSide, name: 'beCityAwningCloth' }));
    const roofM = gbMat('#5c5a58', { rough: 0.9, name: 'beCityRoofConcrete' });
    let shopI = 0;
    // one building: a box, its facade (uv-scaled bays), a parapet, a shopfront with a sign and maybe an awning
    const building = (x0, x1, front, dir, o = {}) => {
      const w = x1 - x0, h = o.h || r.range(12, 26), d = 16, F = fac[o.f ?? Math.floor(r.next() * fac.length)], cx = (x0 + x1) / 2, back = front + dir * d;
      const gf = o.gf ?? 4.2;
      if (o.arcade) { beBox(R, w - 0.05, h - gf, d, cx, (h + gf) / 2, (front + back) / 2, F.side); beBox(R, w - 0.05, gf, back - o.arcade, cx, gf / 2, (o.arcade + back) / 2, F.side); }
      else beBox(R, w - 0.05, h, d, cx, h / 2, (front + back) / 2, F.side);
      const pg = new THREE.PlaneGeometry(w - 0.1, h - gf), uv = pg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.max(1, Math.round(w / 3.2)), uv.getY(i) * Math.max(1, Math.round((h - gf) / 3.3)));
      gbAdd(R, pg, F.m, cx, gf + (h - gf) / 2, front - dir * 0.02, { ry: dir > 0 ? Math.PI : 0, cast: false });
      beBox(R, w, 0.6, 0.35, cx, h + 0.3, front + dir * 0.15, F.side);
      gbAdd(R, new THREE.PlaneGeometry(w - 0.4, d - 0.4), roofM, cx, h + 0.02, (front + back) / 2, { rx: -Math.PI / 2, cast: false });
      if (o.noShop) return;
      const sm = shopM[shopI++ % shopM.length];
      gbAdd(R, new THREE.PlaneGeometry(w - 0.6, gf - 0.2), sm, cx, (gf - 0.2) / 2, (o.shopZ ?? front) - dir * 0.03, { ry: dir > 0 ? Math.PI : 0, cast: false });
      beBox(R, w, 0.35, 0.5, cx, gf - 0.05, front - dir * 0.2, F.side);
      if (r.next() < 0.45 && !o.noAwning) { const a = gbAdd(R, new THREE.BoxGeometry(Math.min(w - 1, 7), 0.04, 1.5), awnM[Math.floor(r.next() * 4)], cx, 3.1, front - dir * 0.75, { cast: true }); a.rotation.x = -dir * 0.28; }
    };
    const run = (a, b, front, dir, o = {}) => { let x = a; while (x < b - 4) { let w = Math.min(b - x, r.range(7, 14)); if (b - x - w < 4) w = b - x; building(x, x + w, front, dir, Object.assign({}, o)); x += w; } };
    // south block A (her side), north blocks
    run(C.blockA[0], C.blockA[1], C.walk, 1);
    run(C.blockA[0], C.blockA[1], -C.walk, -1);
    run(C.blockB[0], C.blockB[1], -C.walk, -1);
    // south block B: the arcade (upper floors at the building line; ground floor set back; columns along the kerb side)
    const A = C.arcade;
    { let x = C.blockB[0]; while (x < C.blockB[1] - 4) { let w = Math.min(C.blockB[1] - x, r.range(9, 14)); if (C.blockB[1] - x - w < 4) w = C.blockB[1] - x; building(x, x + w, C.walk, 1, { noShop: true, gf: A.h, arcade: A.back }); x += w; } }
    const colM = gbMat('#d9d0c0', { rough: 0.7, name: 'beCityArcadeStoneColumn' });
    for (let x = C.blockB[0] + 1.5; x < C.blockB[1]; x += 4.0) { gbAdd(R, new THREE.CylinderGeometry(0.24, 0.27, A.h, 14), colM, x, A.h / 2, C.walk - 0.05); beBox(R, 0.7, 0.25, 0.7, x, A.h - 0.12, C.walk - 0.05, colM); }
    beBox(R, C.blockB[1] - C.blockB[0], 0.3, A.back - C.walk + 0.3, (C.blockB[0] + C.blockB[1]) / 2, A.h + 0.15, (C.walk + A.back) / 2, colM, { cast: true });
    const arcFloor = beCanvasTex(512, 512, (x, w, h) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const v = r.range(-10, 10); x.fillStyle = (i + j) % 2 ? `rgb(${196 + v},${184 + v},${164 + v})` : `rgb(${150 + v},${126 + v},${104 + v})`; x.fillRect(i * 64, j * 64, 64, 64); } Tex.noise(x, w, h, 6, r); }, [1, 1]);
    arcFloor.wrapS = arcFloor.wrapT = THREE.RepeatWrapping;
    { const g = new THREE.PlaneGeometry(C.blockB[1] - C.blockB[0], A.back - C.walk), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (C.blockB[1] - C.blockB[0]) / 3.2, uv.getY(i) * (A.back - C.walk) / 3.2);
      this.arcFloorM = new THREE.MeshStandardMaterial({ map: arcFloor, roughness: 0.4, name: 'beCityArcadeTileFloor', envMapIntensity: 0.6 });
      gbAdd(R, g, this.arcFloorM, (C.blockB[0] + C.blockB[1]) / 2, 0.003, (C.walk + A.back) / 2, { rx: -Math.PI / 2, cast: false }); }
    // the arcade's back wall: shopfronts; the café-bookshop's glass door at x = A.door (scene 11)
    { let x = C.blockB[0]; while (x < C.blockB[1] - 3) { const w = Math.min(C.blockB[1] - x, r.range(8, 12)); const sm = shopM[shopI++ % shopM.length];
        gbAdd(R, new THREE.PlaneGeometry(w - 0.4, A.h - 0.3), x < A.door && x + w > A.door ? new THREE.MeshStandardMaterial({ color: '#2a2622', roughness: 0.6, name: 'beCityArcadeWallStone' }) : sm, x + w / 2, (A.h - 0.3) / 2, A.back, { ry: Math.PI, cast: false }); x += w; } }
    // the café-bookshop: a wide window either side of a glass door on a pivot (opens inward: −x hinge)
    const cafeTx = beCanvasTex(1024, 512, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#f6dcae'); g.addColorStop(1, '#9a6e44'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (let s = 0; s < 5; s++) { x.fillStyle = 'rgba(70, 45, 28, 0.8)'; x.fillRect(40, 60 + s * 85, 420, 8); for (let k = 0; k < 22; k++) { x.fillStyle = `hsl(${r.range(0, 360) | 0}, 35%, ${r.range(30, 55) | 0}%)`; x.fillRect(46 + k * 18.5, 60 + s * 85 - r.range(40, 70), 15, 62); } }
      for (let k = 0; k < 6; k++) { x.fillStyle = 'rgba(255, 236, 200, 0.9)'; x.beginPath(); x.arc(560 + k * 75, 70, 14, 0, 7); x.fill(); x.fillStyle = 'rgba(60, 40, 25, 0.9)'; x.fillRect(540 + k * 75, 300, 50, 8); x.fillRect(560 + k * 75, 308, 8, 120); }
    }, [1, 1]);
    const cafeM = this.cafeM = new THREE.MeshStandardMaterial({ map: cafeTx, emissiveMap: cafeTx, emissive: '#ffffff', emissiveIntensity: 0.35, roughness: 0.3, name: 'beCityCafeWindowGlass', envMapIntensity: 0.9 });
    for (const dx of [-3.0, 3.0]) gbAdd(R, new THREE.PlaneGeometry(4.6, 3.2), cafeM, A.door + dx, 1.75, A.back - 0.02, { ry: Math.PI, cast: false });
    const frameM = gbMat('#2a2e33', { rough: 0.4, metal: 0.5, name: 'beCityCafeFrameMetal' });
    for (const dx of [-0.65, 0.65]) beBox(R, 0.08, 2.5, 0.12, A.door + dx, 1.25, A.back - 0.03, frameM);
    beBox(R, 1.38, 0.1, 0.12, A.door, 2.52, A.back - 0.03, frameM);
    gbAdd(R, new THREE.PlaneGeometry(1.2, 2.4), cafeM, A.door, 1.2, A.back + 2.5, { ry: Math.PI, cast: false });   // the room beyond the door
    const dp = this.cafeDoor = new THREE.Group(); dp.position.set(A.door - 0.6, 0, A.back - 0.02); R.add(dp);
    gbAdd(dp, new THREE.BoxGeometry(1.18, 2.4, 0.04), new THREE.MeshStandardMaterial({ color: '#d6e4ea', roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.28, name: 'beCityCafeDoorGlass' }), 0.6, 1.2, 0, { cast: false });
    for (const [w, h, x, y] of [[0.06, 2.4, 0.03, 1.2], [0.06, 2.4, 1.17, 1.2], [1.2, 0.08, 0.6, 0.04], [1.2, 0.06, 0.6, 2.37]]) beBox(dp, w, h, 0.06, x, y, 0, frameM);
    gbAdd(dp, new THREE.CylinderGeometry(0.015, 0.015, 0.6, 8), gbMat('#c9a46a', { rough: 0.3, metal: 0.8, name: 'beCityCafeHandleBrass' }), 1.05, 1.05, -0.06);
    // arcade lamps (warm globes)
    const globeM = new THREE.MeshStandardMaterial({ color: '#fff3dc', emissive: '#ffd9a0', emissiveIntensity: 1.6, name: 'beCityArcadeLampGlow' });
    this.arcadeLamps = [];
    for (let x = C.blockB[0] + 3.5; x < C.blockB[1]; x += 8) { gbAdd(R, new THREE.SphereGeometry(0.16, 14, 10), globeM, x, A.h - 0.55, (C.walk + A.back) / 2); gbAdd(R, new THREE.CylinderGeometry(0.008, 0.008, 0.4, 6), frameM, x, A.h - 0.25, (C.walk + A.back) / 2, { cast: false }); }
    for (const x of [48, 58, 68]) { const p = new THREE.PointLight('#ffd9a8', 0, 12, 1.6); p.position.set(x, A.h - 0.7, (C.walk + A.back) / 2); this.scene.add(p); this.arcadeLamps.push(p); }
    // the corner buildings' side faces along the side street get windows too (they are seen from the crossing)
    for (const [x, dir] of [[C.blockA[1], 1], [C.blockB[0], -1]]) for (const s of [-1, 1]) {
      const F = fac[(x > 30 ? 2 : 0) + (s > 0 ? 0 : 1)], pg = new THREE.PlaneGeometry(15, 14), uv = pg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 5, uv.getY(i) * 4);
      gbAdd(R, pg, F.m, x + dir * 0.03, 11, s * (C.walk + 8), { ry: dir * Math.PI / 2, cast: false });
    }
    // across the side street, more buildings (the street continues)
    for (const s of [-1, 1]) { beBox(R, 14, 18, 30, C.side[0] - 10, 9, s * (C.walk + 46), fac[1].side); beBox(R, 14, 22, 30, C.side[1] + 10, 11, s * (C.walk + 46), fac[3].side); }
  }

  // ---------------------------------------------------------------------------------------------------- furniture
  _street() {
    const R = this.root, C = BE_CITY, r = this.r;
    const barkM = gbMat('#4a3a2e', { rough: 0.95, name: 'beCityTreeBarkWood' });
    const leafM = [gbMat('#5b7a3c', { rough: 0.9, flat: true, name: 'beCityTreeLeaf' }), gbMat('#6c8a44', { rough: 0.9, flat: true, name: 'beCityTreeLeaf' }), gbMat('#4d6b36', { rough: 0.9, flat: true, name: 'beCityTreeLeaf' })];
    const grateM = gbMat('#3a3c3e', { rough: 0.6, metal: 0.6, name: 'beCityGrateMetal' });
    this.trees = [];
    const tree = (x, z) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); R.add(g); this.trees.push(g);
      gbAdd(g, new THREE.CylinderGeometry(0.13, 0.18, 3.4, 9), barkM, 0, 1.7, 0);
      for (let k = 0; k < 5; k++) gbAdd(g, new THREE.IcosahedronGeometry(r.range(1.1, 1.7), 1), leafM[k % 3], r.range(-0.9, 0.9), r.range(3.6, 5.2), r.range(-0.9, 0.9), { s: [1, r.range(0.75, 0.95), 1] });
      beBox(g, 1.3, 0.02, 1.3, 0, 0.01, 0, grateM, { cast: false });
    };
    for (let x = -64; x < 150; x += 13) for (const z of [-7.95, 7.95]) if (!(x > 22 && x < 46) && !(z > 0 && ((x > -8 && x < -0.5) || (x > 1 && x < 6)))) tree(x + r.range(-0.6, 0.6), z);
    // lamp posts
    const poleM = gbMat('#2f3438', { rough: 0.5, metal: 0.6, name: 'beCityPoleMetal' });
    const lampGlow = this.streetLampM = new THREE.MeshStandardMaterial({ color: '#f6f0e2', emissive: '#ffe4b8', emissiveIntensity: 0.0, name: 'beCityStreetLampGlow' });
    for (let x = -58; x < 150; x += 22) for (const z of [-7.45, 7.45]) {
      gbAdd(R, new THREE.CylinderGeometry(0.06, 0.09, 6.5, 8), poleM, x, 3.25, z);
      gbAdd(R, new THREE.BoxGeometry(0.2, 0.08, 1.4), poleM, x, 6.4, z - Math.sign(z) * 0.65);
      gbAdd(R, new THREE.BoxGeometry(0.3, 0.06, 0.55), lampGlow, x, 6.34, z - Math.sign(z) * 1.2, { cast: false });
    }
    // the bus shelter (south, x −6…−2): glass back and side panels, a roof, a bench, a poster
    const glassM = new THREE.MeshStandardMaterial({ color: '#d6e6ee', roughness: 0.05, metalness: 0.15, transparent: true, opacity: 0.22, name: 'beCityShelterGlass', envMapIntensity: 1.3 });
    const sx = -4, sz0 = 7.55, sz1 = 9.05;
    for (const x of [sx - 2, sx + 2]) gbAdd(R, new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8), poleM, x, 1.25, sz1);
    gbAdd(R, new THREE.BoxGeometry(4.0, 2.2, 0.02), glassM, sx, 1.25, sz1, { cast: false });
    for (const x of [sx - 2, sx + 2]) gbAdd(R, new THREE.BoxGeometry(0.02, 2.2, 1.3), glassM, x, 1.25, (sz0 + sz1) / 2 + 0.1, { cast: false });
    beBox(R, 4.3, 0.08, 1.8, sx, 2.55, (sz0 + sz1) / 2, poleM);
    beBox(R, 2.6, 0.06, 0.4, sx, 0.48, sz1 - 0.3, gbMat('#8a6a4c', { rough: 0.6, name: 'beCityBenchWood' }));
    const poster = beCanvasTex(256, 384, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2f6b8a'); g.addColorStop(1, '#e8b26a'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(255, 250, 235, 0.9)'; x.beginPath(); x.arc(w / 2, h * 0.4, 60, 0, 7); x.fill(); x.font = '700 28px Georgia, serif'; x.textAlign = 'center'; x.fillStyle = '#fff'; x.fillText('CITY GARDENS', w / 2, h - 60); }, [1, 1]);
    gbAdd(R, new THREE.PlaneGeometry(1.1, 1.7), new THREE.MeshStandardMaterial({ map: poster, emissiveMap: poster, emissive: '#ffffff', emissiveIntensity: 0.4, name: 'beCityPosterScreen' }), sx + 2.03, 1.25, (sz0 + sz1) / 2 + 0.1, { ry: Math.PI / 2, cast: false });
    // café tables and chairs (x 14…19, against the facade)
    const tabM = gbMat('#3a3d42', { rough: 0.4, metal: 0.6, name: 'beCityCafeTableMetal' }), seatM = gbMat('#7a5236', { rough: 0.6, name: 'beCityCafeChairWood' });
    this.cafeTables = [[15.2, 11.15], [18.0, 11.15]];
    for (const [x, z] of this.cafeTables) {
      gbAdd(R, new THREE.CylinderGeometry(0.38, 0.38, 0.03, 18), tabM, x, 0.74, z); gbAdd(R, new THREE.CylinderGeometry(0.03, 0.03, 0.72, 8), tabM, x, 0.37, z);
      for (const dx of [-0.6, 0.6]) { beBox(R, 0.42, 0.04, 0.42, x + dx, 0.46, z, seatM); beBox(R, 0.04, 0.46, 0.42, x + dx * 1.38, 0.7, z, seatM); for (const ex of [-0.18, 0.18]) for (const ez of [-0.18, 0.18]) beBox(R, 0.03, 0.46, 0.03, x + dx + ex, 0.23, z + ez, tabM); }
      gbAdd(R, new THREE.CylinderGeometry(0.04, 0.035, 0.09, 12), gbMat('#f2ede4', { rough: 0.3, name: 'beCityCupCeramic' }), x + 0.12, 0.8, z - 0.1);
    }
    // a bike rack with two bicycles (x 2…4, near the kerb)
    const bikeM = [gbMat('#2e6a8a', { rough: 0.4, metal: 0.4, name: 'beCityBikeFrameMetal' }), gbMat('#a33a32', { rough: 0.4, metal: 0.4, name: 'beCityBikeFrameMetal' })], tyreM = gbMat('#1d1e20', { rough: 0.8, name: 'beCityBikeTyreRubber' });
    for (let k = 0; k < 2; k++) {
      const g = new THREE.Group(); g.position.set(2.4 + k * 1.1, 0, 8.35); g.rotation.y = Math.PI / 2; R.add(g);
      for (const dz of [-0.52, 0.52]) gbAdd(g, new THREE.TorusGeometry(0.34, 0.025, 6, 24), tyreM, 0, 0.36, dz, { ry: Math.PI / 2 });
      for (const [a, b] of [[[0, 0.36, -0.52], [0, 0.62, 0.1]], [[0, 0.62, 0.1], [0, 0.36, 0.52]], [[0, 0.36, -0.52], [0, 0.88, -0.2]], [[0, 0.88, -0.2], [0, 0.62, 0.1]], [[0, 0.88, -0.2], [0, 0.92, 0.42]], [[0, 0.92, 0.42], [0, 0.36, 0.52]]]) {
        const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), m = gbAdd(g, new THREE.CylinderGeometry(0.018, 0.018, A.distanceTo(B), 6), bikeM[k], (A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
      }
      beBox(g, 0.5, 0.025, 0.025, 0, 1.0, 0.42, tyreM);
    }
    for (const x of [1.9, 4.7]) gbAdd(R, new THREE.TorusGeometry(0.42, 0.03, 6, 20, Math.PI), poleM, x + 0.25, 0, 8.35);
    // bins, benches, bollards
    for (const x of [-12, 23]) gbAdd(R, new THREE.CylinderGeometry(0.28, 0.25, 0.9, 12), gbMat('#3b4a3a', { rough: 0.6, metal: 0.3, name: 'beCityBinMetal' }), x, 0.45, 8.05);
    for (const x of [-26, 52, 88]) beBox(R, 1.8, 0.08, 0.5, x, 0.45, -11.4, gbMat('#8a6a4c', { rough: 0.6, name: 'beCityBenchWood' }));
    for (const x of [26.2, 27.4, 28.6]) gbAdd(R, new THREE.CylinderGeometry(0.09, 0.1, 0.9, 10), poleM, x, 0.45, 7.45);
    // works on the north side: scaffolding, boards, a barrier (a sound source in scene 9)
    const scafM = gbMat('#8f9499', { rough: 0.45, metal: 0.7, name: 'beCityScaffoldMetal' }), boardM = gbMat('#a0784e', { rough: 0.8, name: 'beCityScaffoldBoardWood' }), netM = new THREE.MeshStandardMaterial({ color: '#e07a2a', roughness: 0.9, transparent: true, opacity: 0.55, side: THREE.DoubleSide, name: 'beCityNetCloth' });
    for (let x = 48; x <= 64; x += 2) for (const z of [-11.2, -12.4]) gbAdd(R, new THREE.CylinderGeometry(0.03, 0.03, 14, 6), scafM, x, 7, z, { cast: false });
    for (let y = 2; y <= 14; y += 2) { beBox(R, 16, 0.05, 1.2, 56, y, -11.8, boardM, { cast: false }); beBox(R, 16, 0.03, 0.03, 56, y + 1, -11.2, scafM, { cast: false }); }
    gbAdd(R, new THREE.PlaneGeometry(16, 10), netM, 56, 9, -11.15, { cast: false });
    for (let x = 48; x < 64; x += 2.1) beBox(R, 2.0, 1.0, 0.06, x + 1, 0.5, -9.6, gbMat('#d84a2a', { rough: 0.7, name: 'beCityBarrierPlastic' }));
  }

  // ---------------------------------------------------------------------------------------------------- the signals
  _aps() {
    const R = this.root, C = BE_CITY;
    const poleM = gbMat('#3a3f44', { rough: 0.45, metal: 0.6, name: 'beCityPoleMetal' }), boxM = gbMat('#d9b21e', { rough: 0.45, metal: 0.2, name: 'beCityApsBoxMetal' });
    const dark = gbMat('#151618', { rough: 0.4, name: 'beCitySignalHousingMetal' });
    this.walkM = new THREE.MeshStandardMaterial({ color: '#222', emissive: '#f4f4ea', emissiveIntensity: 0, name: 'beCityWalkLampGlow' });
    this.waitM = new THREE.MeshStandardMaterial({ color: '#222', emissive: '#ff7a1a', emissiveIntensity: 2.2, name: 'beCityWaitLampGlow' });
    this.aps = [];
    for (const [P, dir] of [[C.apsA, 1], [C.apsB, -1]]) {
      const g = new THREE.Group(); g.position.copy(P); R.add(g); this.aps.push(g);
      gbAdd(g, new THREE.CylinderGeometry(0.055, 0.065, 3.2, 10), poleM, 0, 1.6, 0);
      // the push-button box faces the pavement she comes along (−dir·x), its raised arrow points across the street
      const bx = new THREE.Group(); bx.position.set(-dir * 0.09, 1.05, 0); bx.rotation.y = dir > 0 ? -Math.PI / 2 : Math.PI / 2; g.add(bx);
      beBox(bx, 0.13, 0.3, 0.08, 0, 0, 0, boxM);
      gbAdd(bx, new THREE.CylinderGeometry(0.032, 0.032, 0.02, 16), gbMat('#2a2b2e', { rough: 0.3, metal: 0.6, name: 'beCityApsButtonMetal' }), 0, -0.06, 0.045, { rx: Math.PI / 2 });
      const arrow = new THREE.Shape(); arrow.moveTo(-0.04, -0.008); arrow.lineTo(0.015, -0.008); arrow.lineTo(0.015, -0.02); arrow.lineTo(0.045, 0); arrow.lineTo(0.015, 0.02); arrow.lineTo(0.015, 0.008); arrow.lineTo(-0.04, 0.008);
      const ag = new THREE.ExtrudeGeometry(arrow, { depth: 0.008, bevelEnabled: false }); const am = gbAdd(bx, ag, gbMat('#f2f2ec', { rough: 0.4, name: 'beCityApsArrowMetal' }), 0, 0.06, 0.04);
      am.rotation.y = dir > 0 ? Math.PI : 0;   // (the arrow points along +x on side A, −x on side B, in world terms)
      gbAdd(bx, new THREE.CylinderGeometry(0.025, 0.025, 0.012, 14), dark, 0, 0.11, 0.042, { rx: Math.PI / 2 });   // the little speaker
      // the pedestrian signal head on top, facing across the street
      const hd = new THREE.Group(); hd.position.set(0, 2.85, 0); hd.rotation.y = dir > 0 ? -Math.PI / 2 : Math.PI / 2; g.add(hd);
      beBox(hd, 0.36, 0.62, 0.22, 0, 0, 0, dark);
      gbAdd(hd, new THREE.PlaneGeometry(0.26, 0.24), this.waitM, 0, 0.14, -0.112, { ry: Math.PI, cast: false });
      gbAdd(hd, new THREE.PlaneGeometry(0.26, 0.24), this.walkM, 0, -0.14, -0.112, { ry: Math.PI, cast: false });
    }
    this.apsBtn = (i) => this.aps[i].localToWorld(new THREE.Vector3(-[1, -1][i] * 0.15, 1.05, 0));
  }

  // ---------------------------------------------------------------------------------------------------- sky, light
  _sky() {
    const u = this.skyU = { uCloud: { value: 0.25 }, uT: { value: 0 }, uFlash: { value: 0 }, uSun: { value: new THREE.Vector3(0.5, 0.72, -0.42).normalize() } };
    const m = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: u,
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p; }',
      fragmentShader: /* glsl */`
        uniform float uCloud, uT, uFlash; uniform vec3 uSun; varying vec3 vD;
        float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
        float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * n2(p); p *= 2.03; a *= 0.5; } return s; }
        void main(){
          vec3 d = normalize(vD); float h = max(d.y, 0.0);
          vec3 clear = mix(vec3(0.86, 0.88, 0.86), vec3(0.42, 0.62, 0.86), pow(h, 0.55));
          vec3 storm = mix(vec3(0.42, 0.45, 0.48), vec3(0.24, 0.27, 0.31), pow(h, 0.6));
          vec3 col = mix(clear, storm, smoothstep(0.35, 1.0, uCloud));
          col += vec3(1.0, 0.9, 0.7) * pow(max(dot(d, uSun), 0.0), 64.0) * 0.6 * (1.0 - uCloud);
          vec2 p = d.xz / (0.18 + h) * 1.6 + vec2(uT * 0.03, uT * 0.012);
          float c = fbm(p), cov = smoothstep(0.62 - 0.45 * uCloud, 0.9 - 0.3 * uCloud, c) * smoothstep(0.0, 0.18, h);
          vec3 cc = mix(vec3(1.0, 0.98, 0.95), vec3(0.3, 0.33, 0.37), smoothstep(0.3, 0.9, uCloud)) * (0.85 + 0.25 * fbm(p * 2.0 + 5.0));
          col = mix(col, cc, cov * 0.92);
          col += vec3(0.75, 0.8, 0.95) * uFlash * (0.35 + 0.65 * cov);   // lightning (scene 10), lighting the cloud from inside
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const sky = this.sky = new THREE.Mesh(new THREE.SphereGeometry(480, 32, 16), m); sky.userData.beSkip = true; sky.frustumCulled = false; sky.renderOrder = -1; this.scene.add(sky);
  }
  _lights() {
    const S = this.scene;
    S.add(this.hemi = new THREE.HemisphereLight('#d6e4f2', '#8a7a68', 0.5));
    const sun = this.sun = new THREE.DirectionalLight('#fff0dc', 3.6); sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04; sun.shadow.radius = 3;
    const c = sun.shadow.camera; c.left = -45; c.right = 45; c.top = 45; c.bottom = -45; c.near = 1; c.far = 220;
    S.add(sun); S.add(sun.target);
    S.fog = new THREE.FogExp2('#c9d3dc', 0.005);
  }
  // the sun follows the shot (its shadow box centres on what the camera looks at)
  aim(at) { const d = this.skyU.uSun.value; this.sun.target.position.copy(at); this.sun.position.copy(at).addScaledVector(d, 110); this.sun.target.updateMatrixWorld(); }

  // ---------------------------------------------------------------------------------------------------- traffic
  _traffic() {
    const C = BE_CITY, F = new VehicleFactory();
    this.cars = [];
    const add = (type, color, lane, x0, o = {}) => { const v = F.build(type, color); v.group.position.y = C.roadY; this.root.add(v.group); this.cars.push(Object.assign({ v, lane, x0, type }, o)); return v; };
    for (const c of beCityCarList()) add(c.type, c.color, c.lane, c.x0, c.bus ? { bus: true } : {});
    this.bus = this.cars.find((c) => c.bus).v;
    // the side street: two cars waiting at the stop line (heading −z, toward the main road)
    for (const [z, ty, col] of [[15.2, 'hatch', '#8a1f22'], [21.4, 'suv', '#5a6670']]) { const v = F.build(ty, col); v.group.position.set(32.6, C.roadY, z); v.group.rotation.y = Math.PI / 2; this.root.add(v.group); v.tail.emissiveIntensity = 3.5; this.parked = (this.parked || []).concat(v); }
    for (const c of this.cars) c.v.group.traverse((o) => { if (o.isMesh && /head/i.test(o.material.name || '')) o.material.emissiveIntensity = 0.6; });
  }
  // a car's x at time t (pure: constant lane speed on a wrapped track); the bus has its own timing
  carX(c, t) { return beCityCarX(c, t); }
  updateTraffic(t) {
    const C = BE_CITY;
    for (const c of this.cars) {
      const ln = C.lanes[c.lane], x = this.carX(c, t), g = c.v.group;
      g.position.set(x, C.roadY, ln.z); g.rotation.y = ln.dir > 0 ? 0 : Math.PI;
      const dist = c.bus ? x : ln.v * t;
      for (const w of c.v.wheels) w.rotation.z = -dist / c.v.r;
      g.visible = x > C.track[0] + 2 && x < C.track[1] - 2;
    }
  }
}

// the traffic, as data (pure; the picture and the sound both read it): five cars per lane, and the bus (near lane,
// eastbound, timed by scene 9 to pass her on "Engines")
function beCityCarList() {
  if (beCityCarList._c) return beCityCarList._c;
  const C = BE_CITY, r = new RNG(919), L = C.track[1] - C.track[0], out = [];
  const cols = ['#c9ccd0', '#1f2a36', '#8a1f22', '#e8e6e0', '#3d5a40', '#5a6670', '#c2a25a', '#2b2b2e', '#6e3b5a', '#d8d2c4'];
  const types = ['sedan', 'hatch', 'suv', 'van', 'ev', 'taxi', 'hatch', 'sedan', 'suv', 'pickup'];
  C.lanes.forEach((ln, li) => { for (let k = 0; k < 5; k++) out.push({ type: types[(li * 3 + k) % types.length], color: cols[(li * 4 + k * 3) % cols.length], lane: li, x0: C.track[0] + (k + r.range(0.1, 0.3)) * L / 5 }); });
  out.push({ type: 'bus', color: '#2f6f8f', lane: 0, x0: 0, bus: true });
  return (beCityCarList._c = out);
}
function beCityCarX(c, t) {
  const C = BE_CITY, ln = C.lanes[c.lane], L = C.track[1] - C.track[0];
  if (c.bus) return C.busX ? C.busX(t) : -999;
  const s = c.x0 + ln.dir * ln.v * t;
  return C.track[0] + ((((s - C.track[0]) % L) + L) % L);
}
