/* =====================================================================
   LAKE — the film's one set: the frozen lake, its shores and the town (world.js), and everything that moves (physics.js):
   you, the woman, the skaters, the road's cars, the lorry and the car it pushes onto the lake, the hole, the driver, the
   man at the bonfire, the plane; smoke, exhaust, breath, the fire, the steam off the hole. Three looks per shot:
     colour   the title's four seconds of daylight (before 2:40:00 PM)
     heat     the heat camera (heat.js): what nobody can see
     black    what you see: nothing at all (an empty scene; the captions and the sound carry it)
   Camera per shot mode (set.cams); labels pinned to things (set.labels) carry their temperatures.
   ===================================================================== */

const NL_DARK = new Set(['dark', 'fallDark', 'grabDark', 'singDark', 'waterDark', 'crackDark', 'question']);
const NL_POV = new Set(['title', 'edge']);

function nlLakeSet(app) {
  const F = NL_F, E = NLE, V = NLV;
  const o = nlSet(app, { sky: '#c9d3df', fog: 0.00032, fogColor: '#d8d6d4', fov: 55, near: 0.05, far: 6000, hemi: ['#a9c0de', '#e6dfd6', 0.85],
    sun: NL_SUN.map((v) => v * 400), sunColor: '#ffc485', sunI: 3.0, shadow: 2048, shadowR: 45, shadowFar: 900, env: ['#8fb0d6', '#f0c9a0', '#e6e8ec'] });
  const { scene, camera, sun } = o;
  const set = { scene, camera, _s: 0, reg: [], onMode: [] };
  const fog = scene.fog;
  // ---- the skies: daylight (gradient, the Sun's glow and its disc) and the heat camera's
  const daySky = nlGradSky(scene, '#5f86b6', '#f4c99c', '#dcd6d0', { sunDir: NL_SUN, sunGlow: '#ffb460', hw: 0.2 });
  const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(38, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 4.6, 3.0), fog: false, depthWrite: false }));
  sunDisc.position.set(NL_SUN[0] * 4400, NL_SUN[1] * 4400, NL_SUN[2] * 4400); sunDisc.lookAt(0, 0, 0); sunDisc.renderOrder = -9; scene.add(sunDisc);
  const heatSky = nlHeatSky(scene);
  set.onMode.push((m) => { daySky.visible = sunDisc.visible = m !== 'heat'; heatSky.visible = m === 'heat'; scene.fog = m === 'heat' ? null : fog; scene.background = new THREE.Color(m === 'heat' ? '#000000' : '#c9d3df'); });
  // ---- the scenery
  nlTerrain(set); nlTrack(set); const shore = nlShore(set); nlTrees(set);
  // ---- the people
  const mkP = (look, i, kid) => { const p = nlBlades(nlPerson(look, scene, { id: String(i), kid })); nlHeatPerson(set, p); return p; };
  const you = mkP('nlYou', 'you'), her = mkP('nlHer', 'her');
  const sk = NLK.list.map((k, n) => ({ k, P: mkP('nlSk' + (k.look % 9), 'k' + n, k.kid) }));
  set.cast = { you, her };
  const driver = nlPerson('nlDriver', scene, { id: 'drv' }); nlHeatPerson(set, driver, { wet: true, skin: 24 }); set.cast.driver = driver;
  const man = nlPerson('nlMan', scene, { id: 'man' }); nlHeatPerson(set, man);
  const byFire = [['nlSk2', -4.2, -1.6, 0.9], ['nlSk7', 3.6, -2.4, -0.6], ['nlSk5', -1.0, -4.6, 0.1]].map(([l, dx, dz, yw], i) => { const p = nlPerson(l, scene, { id: 'bf' + i }); nlHeatPerson(set, p); return { P: p, x: F.fire.x + dx, z: F.fire.z + dz, yaw: yw }; });
  // a driver standing by her car on the road, her phone to her face (its screen is on: warm)
  const phoneLady = nlPerson('nlSk4', scene, { id: 'pl' }); nlHeatPerson(set, phoneLady);
  const ph = nlMesh(new THREE.BoxGeometry(0.075, 0.15, 0.012), nlStd('#111418', 0.2), 0, -0.07, 0.05, phoneLady.j.ra.hand); nlReg(set, ph, nlHeatMat(27, { hot: [0, 0, 0.006, 0.06, 31] }));
  const phHer = nlMesh(new THREE.BoxGeometry(0.075, 0.15, 0.012), nlStd('#111418', 0.2), 0, -0.07, 0.05, her.j.ra.hand); nlReg(set, phHer, nlHeatMat(27, { hot: [0, 0, 0.006, 0.06, 31] }));
  // the far skaters: simple figures (a torso, legs, a head), instanced; standing with their arms in, or sitting on the
  // ice with their legs out in front
  { const n = NL_FAR.length, torso = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.19, 0.42, 3, 8), nlStd('#2a3038', 0.8), n),
      legs = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.13, 0.62, 3, 8), nlStd('#1d2026', 0.8), n), headI = new THREE.InstancedMesh(new THREE.SphereGeometry(0.115, 10, 8), nlStd('#d9b090', 0.7), n);
    const ob = new THREE.Object3D(), put = (m, i, x, y, z, rx, ry, sc) => { ob.position.set(x, y, z); ob.rotation.set(rx, ry, 0, 'YXZ'); ob.scale.setScalar(sc); ob.updateMatrix(); m.setMatrixAt(i, ob.matrix); };
    NL_FAR.forEach(([x, z, yaw, up, sc], i) => {
      const f = [Math.sin(yaw), Math.cos(yaw)];
      if (up) { put(legs, i, x, 0.5 * sc + 0.07, z, 0, yaw, sc); put(torso, i, x, 1.2 * sc + 0.07, z, 0.08, yaw, sc); put(headI, i, x + f[0] * 0.04, 1.62 * sc + 0.07, z + f[1] * 0.04, 0, 0, sc); }
      else { put(legs, i, x + f[0] * 0.42 * sc, 0.12 * sc, z + f[1] * 0.42 * sc, Math.PI / 2, yaw, sc); put(torso, i, x - f[0] * 0.05, 0.42 * sc, z - f[1] * 0.05, -0.25, yaw, sc); put(headI, i, x - f[0] * 0.14 * sc, 0.86 * sc, z - f[1] * 0.14 * sc, 0, 0, sc); }
    });
    for (const m of [torso, legs, headI]) { m.castShadow = true; scene.add(m); }
    nlReg(set, torso, nlHeatMat(-3, { var: 1.5 })); nlReg(set, legs, nlHeatMat(-6, { var: 1.5 })); nlReg(set, headI, nlHeatMat(24, { var: 2 })); }
  // ---- the road's cars (stopped, engines running, lights on), the lorry, the car that goes onto the lake
  const VF = new VehicleFactory(), roadCars = [];
  for (const [x, z, yaw, type, col] of NL_ROADCARS) { const v = VF.build(type, col); const g = new THREE.Group(); g.position.set(x, F.road.y + 0.03, z); g.rotation.y = yaw - Math.PI / 2; g.add(v.group); scene.add(g); nlHeatCar(set, v, { running: true }); roadCars.push({ g, v, x, z, yaw }); }
  const carV = VF.build('sedan', '#d9d6cf'), car = new THREE.Group(), carIn = new THREE.Group(); car.add(carIn); carIn.add(carV.group); carIn.rotation.y = -Math.PI / 2; scene.add(car); nlHeatCar(set, carV, { running: true, engine: 75, hotR: 0.8 });   // (a smaller hot bonnet: round 2 saw the whole car white)
  car.rotation.order = 'YXZ';
  const lorry = nlLorry(set);
  // ---- the hole: open water (at 0 °C, warmer than everything round it), broken ice at its rim, slabs afloat
  const hole = new THREE.Group(); hole.position.set(V.hole[0], 0, V.hole[1]); scene.add(hole);
  const waterM = new THREE.MeshStandardMaterial({ color: '#0d151b', roughness: 0.08, metalness: 0.1, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -10 });
  const water = new THREE.Mesh(new THREE.CircleGeometry(1, 48), waterM); water.rotation.x = -Math.PI / 2; water.position.y = 0.05; hole.add(water); nlReg(set, water, nlHeatMat(1.0, { var: 0.9, po: [-4, -10] }));
  const rim = [], hr = new RNG(313);
  for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2 + hr.range(-0.04, 0.04), g = new THREE.CylinderGeometry(1, 1, 1, 5); g.scale(hr.range(0.12, 0.3), hr.range(0.05, 0.08), hr.range(0.1, 0.24)); const m = nlMesh(g, nlStd('#cfd9e2', 0.35), 0, 0, 0, hole); m.rotation.set(hr.range(-0.12, 0.12), a + hr.range(-0.6, 0.6), hr.range(-0.12, 0.12)); nlReg(set, m, nlHeatMat(-2.5, { var: 1 })); rim.push({ m, a, k: hr.range(0.92, 1.04), y: hr.range(0.02, 0.05) }); }
  const slabs = []; for (let i = 0; i < 7; i++) { const g = new THREE.CylinderGeometry(1, 1, 0.06, 6); g.scale(hr.range(0.25, 0.5), 1, hr.range(0.2, 0.4)); const m = nlMesh(g, nlStd('#c8d4de', 0.3), 0, 0.07, 0, hole); nlReg(set, m, nlHeatMat(-1.0)); slabs.push({ m, a: hr.range(0, 6.28), r: hr.range(0.25, 0.7), sp: hr.range(-0.05, 0.05) }); }
  // ---- your handprint on the ice: the heat your palm left (fades over half a minute)
  const printTex = nlTex(nlCanvas(128, 128, (g) => { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(64, 78, 26, 30, 0, 0, 6.28); g.fill(); for (const [x, y, rx, ry, a] of [[40, 36, 7, 20, -0.25], [56, 28, 7, 22, -0.08], [72, 30, 7, 21, 0.06], [87, 40, 6, 17, 0.22], [96, 80, 7, 15, 0.9]]) { g.beginPath(); g.ellipse(x, y, rx, ry, a, 0, 6.28); g.fill(); } }), { repeat: false });
  const printM = new THREE.MeshBasicMaterial({ map: printTex, transparent: true, depthWrite: false, color: new THREE.Color(0, 0, 0), polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -12 });
  const print = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.24), printM); print.rotation.x = -Math.PI / 2; scene.add(print);
  // ---- the cracks that open under your hands at the edge (a decal: lines branching from under you)
  const crackTex = nlTex(nlCanvas(512, 512, (g) => { const r = new RNG(7171); g.strokeStyle = '#fff'; g.lineCap = 'round';
    const br = (x, y, a, len, w, d) => { if (d > 5 || len < 8) return; let px = x, py = y; const n = Math.ceil(len / 9); g.lineWidth = w; g.beginPath(); g.moveTo(px, py);
      for (let i = 0; i < n; i++) { a += r.range(-0.35, 0.35); px += Math.cos(a) * 9; py += Math.sin(a) * 9; g.lineTo(px, py); if (r.next() < 0.08) { g.stroke(); br(px, py, a + r.range(-1.2, 1.2), len * 0.5, w * 0.7, d + 1); g.lineWidth = w; g.beginPath(); g.moveTo(px, py); } } g.stroke(); };
    for (let i = 0; i < 7; i++) br(256 + r.range(-30, 30), 256 + r.range(-30, 30), i / 7 * 6.283 + r.range(-0.3, 0.3), r.range(160, 260), 3.6, 0); }), { repeat: false });
  const crackM = new THREE.MeshBasicMaterial({ map: crackTex, transparent: true, depthWrite: false, color: new THREE.Color(0, 0, 0), polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -12 });
  const cracks = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), crackM); cracks.rotation.x = -Math.PI / 2; scene.add(cracks); set.cracks = cracks;
  { const p = NLY.at(NLY.dist(nlSC('edge', 1, 1.5)) - NLY.head - 0.4); cracks.position.set(p[0], 0.034, p[1]); cracks.visible = false; }   // (under your hands and ahead of them, while we look)
  // ---- the ice bending under your chest at the end: fresh cracks spreading out from under you; water welling up over the
  // ice from the edge (0 °C: it shows warm on the −14 °C snow)
  const bendM = crackM.clone(), bend = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), bendM); bend.rotation.x = -Math.PI / 2; bend.rotation.z = 1.1; scene.add(bend);
  { const p = NLY.at(NLY.dFin - 0.1); bend.position.set(p[0], 0.037, p[1]); bend.visible = false; }
  const seepTex = nlTex(nlCanvas(256, 256, (g) => { const gr = g.createRadialGradient(128, 128, 10, 128, 128, 126); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); }), { repeat: false });
  const seepM = new THREE.MeshBasicMaterial({ map: seepTex, transparent: true, depthWrite: false, color: new THREE.Color(0, 0, 0), polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 });
  const seep = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), seepM); seep.rotation.x = -Math.PI / 2; scene.add(seep);
  { const p = NLY.at(3.3); seep.position.set(p[0], 0.031, p[1]); seep.visible = false; }
  // ---- the plane
  const plane = nlPlane(set);
  // ---- particles: hot (added: fire, sparks, engines) and soft (smoke, exhaust, breath, steam)
  const hot = nlPuffs(scene, 2400, { additive: true, soft: 1.4, billow: 0.6 }), soft = nlPuffs(scene, 5000, { soft: 1.7, billow: 0.7 });
  // where your hand rests on the ice (posed once: the print goes there)
  const youPose = (s) => { const st = NLY.at2(s); let q = nlStatePose(st, s, 0); if (s >= E.hand[0] - 1.2 && s < E.hand[1] + 8) q = { p: nlHandPose(s), lay: 0, y: 0.02 }; if (s >= E.lie) q = { p: NL_P.prone(NLY.dist(s) * NL_CRAWL_PH, nlReachK(s)), lay: 1, y: 0.13 }; return { st, q }; };
  { const s = E.hand[1] - 0.2, { st, q } = youPose(s); nlPlace(you, q, st.x, st.z, st.yaw); you.root.updateMatrixWorld(true); const v = new THREE.Vector3(); you.j.ra.hand.getWorldPosition(v); set.printAt = [v.x, v.z]; print.position.set(v.x, 0.036, v.z); print.rotation.z = -st.yaw; }

  set.frame = (t, shot) => {
    const s = nlStoryAt(t), m = shot.mode, heat = m !== 'title', k = (t - shot.t0) / Math.max(1e-6, shot.t1 - shot.t0);
    set._s = s; set._mode = m; set._black = NL_DARK.has(m);
    if (set._black) return;
    nlMode(set, heat ? 'heat' : 'colour');
    sun.castShadow = !heat; NL_HU.uTime.value = t;
    // you, the woman
    { const { st, q } = youPose(s); nlPlace(you, q, st.x, st.z, st.yaw); }
    { const st = NLW.at2(s); let q = nlStatePose(st, s, 3); if (st.state === 'kneel' && s >= E.grab && s < E.walk0) q = { p: s > nlSC('help', 0, -1) && s < nlSC('help', 1, 1) ? NL_P.phone(s, 3) : NL_P.holdArm(s, 3), lay: 0, y: 0.04 }; if (st.state === 'prone') q = { p: NL_P.proneHold(), lay: 1, y: 0.13 }; nlPlace(her, q, st.x, st.z, st.yaw); phHer.visible = s > nlSC('help', 0, -1) && s < nlSC('help', 1, 1); }
    you.j.head.visible = !NL_POV.has(m);
    // the skaters
    for (const { k: kk, P } of sk) { const st = NLK.pos(kk, s); nlPlace(P, nlStatePose(st, s, kk.i), st.x, st.z, st.yaw); }
    // the man at the bonfire, the people round it, the woman with her phone on the road
    { const a = NLM.at(s); nlPlace(man, { p: NL_P.feel(Math.hypot(a.x - F.fire.x, a.z - F.fire.z), a.back ? 1 : 0), lay: 0, y: 0 }, a.x, a.z, a.yaw, nlGroundY(a.x, a.z)); }
    byFire.forEach((b, i) => nlPlace(b.P, { p: NL_P.standBlind(s, i + 7), lay: 0, y: 0 }, b.x, b.z, b.yaw, nlGroundY(b.x, b.z)));
    { const c = roadCars[7]; const q = NL_P.standBlind(s, 2); q.rSh = [1.2, -0.3]; q.rEl = 2.1; q.neck = 0.25; q.headYaw = -0.1; nlPlace(phoneLady, { p: q, lay: 0, y: 0 }, c.x + 1.2, c.z + 2.4, Math.PI, F.road.y + 0.03); }
    // the lorry and the car
    { const L = NLV.lorry(s); lorry.g.position.set(L.x, L.y + 0.03, L.z); lorry.g.rotation.y = L.yaw; lorry.g.visible = s > NLE.lorry0 - 60; }
    { const c = NLV.car(s); car.position.set(c.x, c.y + (c.y > -0.01 && NLV.carD(s) < V.shoreD ? 0.03 : 0.0), c.z); car.rotation.set(c.pitch, c.yaw, c.roll); car.visible = c.y > -3.2 && s < E.sink + 27; }   // (gone by the time the driver is seen: round 2 saw its strips floating)
    shore.rails.forEach((r) => { const kk = MathX.smooth(s - E.hit - (V.edgeD - 1.5) / V.carV, 0, 0.5); r.m.rotation.set(0, 0.9 * kk, -0.5 * kk); r.m.position.set(r.x0 + NLV.dir[0] * 1.6 * kk, r.y0 - 0.5 * kk, r.z0 + NLV.dir[1] * 1.6 * kk); });
    // the hole
    { const R = NLV.holeR(s); hole.visible = R > 0.01; water.scale.setScalar(Math.max(0.01, R)); rim.forEach((q) => { q.m.position.set(Math.cos(q.a) * R * q.k, q.y, Math.sin(q.a) * R * q.k); }); slabs.forEach((q, i) => { const a = q.a + q.sp * (s - E.sink); q.m.position.set(Math.cos(a) * R * q.r, 0.07 + 0.01 * Math.sin(s * 1.3 + i), Math.sin(a) * R * q.r); q.m.rotation.y = a * 1.7; }); }
    // the driver: in the car until it goes under; then at the edge, in the water
    driver.root.visible = s >= E.out;
    if (s >= E.out) { const d = NLD.at(s); nlPlace(driver, { p: NL_P.edge(s, d.k, nlReachK(s)), lay: 0, y: 0 }, d.x, d.z, d.yaw, d.y); }
    // the handprint (the heat view only)
    { const tp = s - E.hand[1]; print.visible = heat && tp > -0.3 && tp < 40; const v = nlHeatRGB(NLP.printT(tp)); printM.color.setRGB(v, v, v); printM.opacity = 0.9 * MathX.smooth(tp, -0.3, 0.1); }
    // the plane
    { const A = NLA.at(s); plane.g.position.set(A.x, A.y, A.z); plane.g.rotation.set(0, A.yaw, 0); plane.g.visible = Math.abs(s - E.plane) < 60; }
    set.cams[m](t, s, k, shot);
    // the skies are centred on the camera (the Sun's direction must not shift with where the camera stands)
    daySky.position.copy(camera.position); heatSky.position.copy(camera.position); sunDisc.position.set(camera.position.x + NL_SUN[0] * 4400, camera.position.y + NL_SUN[1] * 4400, camera.position.z + NL_SUN[2] * 4400);
    nlLakeFx(set, s, t, { hot, soft, shore, roadCars, car, lorry, plane, heat, people: [you, her, man, phoneLady, driver, ...byFire.map((b) => b.P), ...sk.map((q) => q.P)] });
    // the cracks under your hands: water seeping up into them (0 °C) draws them warm on the −14 °C snow
    { const tc = s - NLE.iceCrack; cracks.visible = heat && tc > 0; if (tc > 0) { const v = nlHeatRGB(-7 + 3 * MathX.smooth(tc, 0, 6)); crackM.color.setRGB(v, v, v); crackM.opacity = MathX.smooth(tc, 0, 1.2); } }
    { const tb = s - nlSC('reach', 1); bend.visible = seep.visible = heat && tb > 0;
      if (tb > 0) { const g = MathX.smooth(tb, 0, 3); bend.scale.setScalar(0.2 + 0.8 * g); bendM.opacity = MathX.smooth(tb, 0, 0.6); const v = nlHeatRGB(-6 + 5 * g); bendM.color.setRGB(v, v, v);
        seep.scale.setScalar(0.3 + 0.55 * MathX.smooth(tb, 0.4, 4.5)); seepM.opacity = 0.9 * MathX.smooth(tb, 0.3, 2); const w = nlHeatRGB(0.5); seepM.color.setRGB(w, w, w); } }
    // the Sun's shadows only in daylight: keep the shadow box on the camera's ground, moved in whole texels
    if (!heat) { const tx = 90 / 2048, cx = Math.round((camera.position.x - 25) / tx) * tx, cz = Math.round(camera.position.z / tx) * tx; sun.target.position.set(cx, 0, cz); sun.position.set(cx + NL_SUN[0] * 400, NL_SUN[1] * 400, cz + NL_SUN[2] * 400); sun.target.updateMatrixWorld(); }
  };
  const blackScene = new THREE.Scene(); blackScene.background = new THREE.Color('#000');
  set.view = () => (set._black ? [blackScene, camera] : [scene, camera]);

  // ---- the cameras
  const cam = (p, at, fov, near = 0.05, roll = 0) => { if (camera.near !== near) { camera.near = near; camera.updateProjectionMatrix(); } nlCam(camera, p, at, fov, roll); };
  const head = (P) => { const v = new THREE.Vector3(); P.root.updateMatrixWorld(true); P.j.head.getWorldPosition(v); return [v.x, v.y, v.z]; };
  const Y1 = NLY.y1, toH = [-NLY.toYou[0], -NLY.toYou[1]], H = V.hole, d0 = (t) => nlDrift(t, 0.3, 0.2, 36);
  set.cams = {
    // POV: skating west on the track's north straight, the low Sun ahead and to the left
    title: (t, s) => { const y = NLY.at2(s), ph = s * 2.6; cam([y.x, 1.62 + NL_SK + 0.03 * Math.sin(ph * 2), y.z + 0.09 * Math.sin(ph)], [y.x - 30, 1.6, y.z + 13 + 0.6 * Math.sin(ph)], 62, 0.05, 1.6 * Math.sin(ph)); },
    // beside you on your right (north), travelling with you: the skaters round you glide on, and fall
    glide: (t, s) => { const y = NLY.at2(s), d = nlDrift(t, 0.05, 0.4, 2); cam([y.x - 3.2 + d[0], 1.35 + d[1], y.z - 5.6], [y.x - 1.6, 1.0, y.z + 0.4], 50); },
    // ahead of where you fall, low: you come in, hit someone sitting on the ice, go down and slide at us
    fall: (t, s, k) => { const f = NL_YFALL(), d = nlDrift(t, 0.03, 0.5, 3); cam([f[0] - 8 + d[0], 0.75 + d[1], f[1] + 7.5], [f[0] + 4 - 4 * k, 0.6, f[1] - 0.3], 40); },
    // high over the track: everyone down, the whole lake, the shore far off
    wide: (t, s, k) => { cam([Y1[0] + 48 - 8 * k, 24 - 3 * k, Y1[1] + 64 - 6 * k], [Y1[0] - 12, 0, Y1[1] - 46], 46, 0.5); },
    // low among them: on hands and knees, sitting, standing with their arms out
    // down on the ice beside you after the fall, low: you slide to a stop, the one you hit, her sliding past, the rest
    down: (t, s, k) => { const d = nlDrift(t, 0.03, 0.4, 5); cam([Y1[0] - 3.6 + d[0], 0.5 + d[1], Y1[1] + 2.2], [Y1[0] + 12 - 2 * k, 0.55, Y1[1] - 2.5], 44); },
    low: (t, s, k) => { const d = nlDrift(t, 0.03, 0.4, 4); cam([Y1[0] + 34 - 4 * k + d[0], 0.55 + d[1], Y1[1] + 6], [Y1[0] + 10, 0.7, Y1[1] - 1.5], 40); },
    // you, sitting on the ice; the woman behind you, further off
    you: (t, s, k) => { const h = head(you), d = nlDrift(t, 0.012, 0.3, 5); cam([h[0] - 3.4 + d[0], 1.0 + d[1], h[2] + 2.6 - 0.3 * k], [h[0] + 0.4, h[1] - 0.15, h[2] - 0.3], 40); },
    // behind you, low: the hills, the black sky, the Sun's disc
    sky: (t, s, k) => { const h = head(you), S = NL_SUN, P = [S[2], -S[0]], d = nlDrift(t, 0.01, 0.3, 33); cam([h[0] - S[0] * 3.4 + P[0] * 2.0 + d[0], 1.0 + d[1], h[2] - S[2] * 3.4 + P[1] * 2.0], [h[0] + S[0] * 400 - P[0] * 60, 16 + 6 * k, h[2] + S[2] * 400 - P[1] * 60], 54, 0.05); },
    // behind you, looking north over the lake at the town's lights
    spec: (t, s, k) => { const h = head(you), d = nlDrift(t, 0.01, 0.3, 6); cam([h[0] + 1.6 + d[0], 1.45 + d[1], h[2] + 3.6], [h[0] - 8 - 4 * k, 0.4, h[2] - 70], 46, 0.05); },
    // low and close: your right hand on the ice, lifted; its print
    hand: (t, s, k) => { const p = set.printAt, h = head(you), dx = p[0] - h[0], dz = p[1] - h[2], L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L, d = nlDrift(t, 0.004, 0.3, 32);
      cam([p[0] + ux * 0.62 - uz * 0.3 + d[0], 0.95 + d[1] - 0.08 * k, p[1] + uz * 0.62 + ux * 0.3], [p[0] - ux * 0.12, 0.02, p[1] - uz * 0.12], 40, 0.03); },
    // a slow look round from where you sit: figures all over the ice
    count: (t, s, k) => { const a = -0.55 + 0.9 * k; cam([Y1[0] + 1.5, 2.0, Y1[1] - 1.5], [Y1[0] + 1.5 + Math.cos(a) * 60, 0.6, Y1[1] - 1.5 + Math.sin(a) * 60], 40, 0.05); },
    // ground level: standing people facing every way, the shore's lights small behind them
    lost: (t, s, k) => { const d = nlDrift(t, 0.02, 0.4, 7); cam([Y1[0] + 22 + d[0], 0.45 + d[1], Y1[1] + 18 - 2 * k], [Y1[0] + 12, 1.0, Y1[1] - 30], 36); },
    // you and her: she's holding your sleeve
    her: (t, s, k) => { const a = head(you), b = head(her), m2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], d = nlDrift(t, 0.01, 0.3, 8); cam([m2[0] - 1.9 + d[0], 0.95 + d[1], m2[2] + 1.6 + 0.2 * k], [m2[0], m2[1] - 0.12, m2[2]], 42); },
    // her phone, at her ear
    phone: (t, s, k) => { const b = head(her), d = nlDrift(t, 0.008, 0.3, 9); cam([b[0] + 0.5 + d[0], b[1] + 0.1 + d[1], b[2] - 2.1 + 0.2 * k], [b[0] - 0.05, b[1] - 0.15, b[2]], 40); },
    // long lens from the ice to the road: stopped cars, their engines and lamps, the town
    shoreRoad: (t, s, k) => { cam([Y1[0] + 5, 1.6, Y1[1] - 2], [NLV.car0[0] - 120 + 40 * k, 4, F.road.z], 15, 1.0); },
    // from the Sun's side, low: your face and hers, on the left (the inset is on the right); the Sun itself is the next shot
    sun: (t, s, k) => { const a = head(you), S = NL_SUN, P = [S[2], -S[0]], d = nlDrift(t, 0.008, 0.3, 10), th = 0.087,
        fx = -S[0] * Math.cos(th) - S[2] * Math.sin(th), fz = S[0] * Math.sin(th) - S[2] * Math.cos(th), r = 2.4 - 0.25 * k;
      cam([a[0] + S[0] * r + P[0] * 0.9 + d[0], 0.95 + d[1], a[2] + S[2] * r + P[1] * 0.9], [a[0] + S[0] * r + P[0] * 0.9 + fx * 10, 0.62, a[2] + S[2] * r + P[1] * 0.9 + fz * 10], 36, 0.05); },
    // the Sun on the ridge: a hot disc, close
    sunset: (t, s, k) => { const a = head(you); const d = nlDrift(t, 0.4, 0.5, 11); cam([a[0], 1.6, a[2]], [a[0] + NL_SUN[0] * 1000 + d[0] * 30, NL_SUN[1] * 1000 - 8 + d[1] * 30, a[2] + NL_SUN[2] * 1000], 7, 1.0); },
    // low on the ice, a long lens into the Sun: people standing on the lake against the hills and the Sun's disc
    sunWide: (t, s, k) => { const d = nlDrift(t, 0.05, 0.3, 27); cam([Y1[0] - NL_SUN[0] * 75 + d[0], 0.7 + d[1], Y1[1] - NL_SUN[2] * 75], [Y1[0] + NL_SUN[0] * 900, 34 + 4 * k, Y1[1] + NL_SUN[2] * 900], 12, 0.5); },
    // the bonfire on the beach, from the ice
    fire: (t, s, k) => { const d = nlDrift(t, 0.02, 0.3, 12); cam([F.fire.x + 9 + d[0], 1.4 + d[1], F.fire.z + 16 - 2 * k], [F.fire.x - 1, 1.2, F.fire.z - 2], 38); },
    // side on: the man walks up to it with his arms out, stops a metre short, steps back
    man: (t, s, k) => { const d = nlDrift(t, 0.01, 0.3, 13), D = [0.55, 0.835], P = [-0.835, 0.55], fy = shore.fire[1], m = [F.fire.x - D[0] * 3.1, F.fire.z - D[1] * 3.1]; cam([m[0] + P[0] * 8.2 - D[0] * 0.6 * k + d[0], fy + 1.45 + d[1], m[1] + P[1] * 8.2 - D[1] * 0.6 * k], [m[0], fy + 0.95, m[1]], 36); },
    // close, side-on: his hands out in front of him, a metre from the fire; he stops, steps back
    feel: (t, s, k) => { const d = nlDrift(t, 0.008, 0.3, 28), D = [0.55, 0.835], P = [-0.835, 0.55], fy = shore.fire[1], m = [F.fire.x - D[0] * 1.15, F.fire.z - D[1] * 1.15]; cam([m[0] + P[0] * 5.2 + D[0] * 1.2 + d[0], fy + 1.15 + d[1], m[1] + P[1] * 5.2 + D[1] * 1.2], [m[0], fy + 1.1, m[1]], 36); },
    // the town from the ice: lamp posts, warm windows, chimneys
    town: (t, s, k) => { cam([40 - 10 * k, 2.2, -360], [10 - 10 * k, 9, -520], 34, 0.5); },
    // on the road: a driver beside her car, her phone to her face
    window: (t, s, k) => { const c = roadCars[7], d = nlDrift(t, 0.01, 0.3, 14); cam([c.x + 3.4 + d[0], F.road.y + 1.6 + d[1], c.z + 3.6 - 0.3 * k], [c.x + 1.1, F.road.y + 1.45, c.z + 2.3], 36); },
    // along the road from the bank: stopped cars, engines and lamps hot, the red-hot exhaust
    road: (t, s, k) => { cam([NLV.car0[0] - 70 + 50 * k, F.road.y + 2.0, F.road.z + 22], [NLV.car0[0] - 50 + 50 * k, F.road.y + 0.9, F.road.z - 2], 40, 0.2); },
    // from where you are, across the ice: the lorry creeping, the hit (the sound comes later)
    lorry: (t, s, k) => { const d = nlDrift(t, 0.05, 0.4, 15), c = NLV.car0; cam([c[0] - 34, 2.4, F.road.z + 150], [c[0] + 4 + d[0] * 0.3, F.road.y + 1.0 + d[1] * 0.15, c[1] + 3], 5.5, 1.0); },
    // you two, from the lake side: the bang has just reached you; heads turn to it
    turn: (t, s, k) => { const a = head(you), d = nlDrift(t, 0.01, 0.3, 29); cam([a[0] + toH[0] * 4.0 - toH[1] * 1.6 + d[0], 1.45 + d[1], a[2] + toH[1] * 4.0 + toH[0] * 1.6], [a[0] - toH[1] * 0.4, a[1] - 0.15, a[2] + toH[0] * 0.4], 40); },
    // from the ice: through the railing, down the bank, out onto the lake
    slide: (t, s, k) => { const d = nlDrift(t, 0.03, 0.4, 16), D = V.dir, c = V.car(s); cam([H[0] + D[0] * 24 + D[1] * 7 + d[0], 1.3 + d[1], H[1] + D[1] * 24 - D[0] * 7], [c.x, c.y + 0.7, c.z], 24, 0.2); },        // on the car's line, ahead of it: it slides at you and stops
    // the car on the lake, low: the engine still running
    out: (t, s, k) => { const d = nlDrift(t, 0.02, 0.3, 17); cam([H[0] + 9 + d[0], 0.7 + d[1], H[1] + 11 - k], [H[0], 0.6, H[1]], 36, 0.1); },
    ice: (t, s, k) => { const d = nlDrift(t, 0.015, 0.3, 18); cam([H[0] - 7 + d[0], 0.45 + d[1], H[1] + 8 - 0.6 * k], [H[0] + 2.3, 0.4, H[1] + 1.0], 38, 0.05); },   // the car on the left: the inset is on the right
    sink: (t, s, k) => { const d = nlDrift(t, 0.04, 0.5, 19); cam([H[0] + 12 + d[0], 1.3 + d[1], H[1] + 15], [H[0], 0.3 - 0.4 * k, H[1]], 30, 0.1); },
    // the hole, glowing; the vapour; you two far off
    steam: (t, s, k) => { const d = nlDrift(t, 0.01, 0.3, 34), a = 0.7, R = (x, z) => [x * Math.cos(a) + z * Math.sin(a), -x * Math.sin(a) + z * Math.cos(a)],   // ¾ from behind: its boot, its side
      p = R(5.5 - 0.8 * k, -6.5 + 0.5 * k), q = R(-1.5, 2); cam([H[0] + p[0] + d[0], 1.7 + d[1], H[1] + p[1]], [H[0] + q[0], 0.25, H[1] + q[1]], 44, 0.1); },
    // low on the far side of the hole, looking across it towards you two (far off, walking towards it): its glow, its smoke
    behind: (t, s, k) => { const d = nlDrift(t, 0.02, 0.3, 30), r = 9 - 1.2 * k, a = 0.75, c = Math.cos(a), sn = Math.sin(a), u = [toH[0] * c + toH[1] * sn, -toH[0] * sn + toH[1] * c];   // turned: the hole between you and the car
      cam([H[0] + u[0] * r + u[1] * 1.2 + d[0], 0.9 + d[1], H[1] + u[1] * r - u[0] * 1.2], [H[0] - u[0] * 12, 0.5, H[1] - u[1] * 12], 34, 0.1); },
    // rising over the lake: the town, the forest, every figure on the ice
    world: (t, s, k) => { const u = MathX.smooth(k, 0, 1); cam([-60 + 40 * u, 22 + 120 * u, -395 + 90 * u], [10, 4 - 10 * u, -560], 44, 1.0); },        // up and back over the town
    // the forest on the far shore: a slow pan along the spruce
    forest: (t, s, k) => { const d = nlDrift(t, 0.02, 0.3, 35); cam([-128 + 10 * k + d[0], 1.1 + d[1], -404], [-122 + 12 * k, 9, -446], 44, 0.1); },
    // a long lens from you: the plane coming in from the east, its engines and their plumes
    skyup: (t, s, k) => { const y = NLY.at2(s), A = NLA.at(s), D = Math.hypot(A.x - y.x, A.y - 1.5, A.z - y.z); cam([y.x, 1.5, y.z], [A.x, A.y, A.z], Math.max(3, 2.9 * 1500 / D), 0.5); },
    // it passes over: a long lens from below, following it (its belly, both engines, the cabin's warm windows)
    plane: (t, s, k) => { const y = NLY.at2(s), A = NLA.at(s); cam([y.x + 1, 1.2, y.z + 1.5], [A.x, A.y, A.z], 5.5, 0.3); },
    // it goes on west, low over the hills
    planeAway: (t, s, k) => { const y = NLY.at2(s), A = NLA.at(s); cam([y.x + 0.6, 1.5, y.z + 1.4], [A.x, A.y - 6 * k, A.z], 9, 0.3); },
    // standing, listening: heads turning
    listen: (t, s, k) => { const a = head(you), d = nlDrift(t, 0.012, 0.3, 20); cam([a[0] - toH[0] * 3.6 + toH[1] * 2.2 + d[0], 1.25 + d[1], a[2] - toH[1] * 3.6 - toH[0] * 2.2], [a[0], a[1] - 0.25, a[2]], 44); },
    // the driver at the edge: his arms on the ice, his breath
    driver: (t, s, k) => { const dd = NLD.at(s), d = nlDrift(t, 0.02, 0.3, 21), r = 3.3 - 0.8 * k; cam([dd.x - toH[0] * r + toH[1] * 1.2 + d[0], 0.75 + d[1], dd.z - toH[1] * r - toH[0] * 1.2], [dd.x, 0.05, dd.z], 30, 0.1); },
    cold: (t, s, k) => { const dd = NLD.at(s), d = nlDrift(t, 0.01, 0.3, 22); cam([dd.x - toH[0] * 3.2 + toH[1] * 0.8 + d[0], 0.55 + d[1], dd.z - toH[1] * 3.2 - toH[0] * 0.8], [dd.x, 0.15, dd.z], 34, 0.05); },
    // flat on the ice, side on; she's holding your ankles
    prone: (t, s, k) => { const y = NLY.at2(s), d = nlDrift(t, 0.01, 0.3, 23); cam([y.x + toH[1] * 4.2 - toH[0] * 1.2 + d[0], 0.6 + d[1], y.z - toH[0] * 4.2 - toH[1] * 1.2], [y.x - toH[0] * 0.8, 0.2, y.z - toH[1] * 0.8], 44, 0.05); },
    // from behind her feet: the two of you in a line, the hole glowing ahead
    chain: (t, s, k) => { const y = NLY.at2(s), d = nlDrift(t, 0.01, 0.3, 24); cam([y.x - toH[0] * 5.5 + d[0], 0.75 + d[1], y.z - toH[1] * 5.5], [H[0], 0.2, H[1]], 30, 0.05); },
    // low, from beside your head: the cracks running out from under your hands
    cracks: (t, s, k) => { const h = head(you), d = nlDrift(t, 0.006, 0.3, 31); cam([h[0] + toH[1] * 1.7 - toH[0] * 0.2 + d[0], 0.55 + d[1], h[2] - toH[0] * 1.7 - toH[1] * 0.2], [h[0] + toH[0] * 0.9, 0.0, h[2] + toH[1] * 0.9], 50, 0.05); },
    // your eyes, a hand's width over the ice: the edge, the water, him
    edge: (t, s, k) => { const y = NLY.at2(s), h = head(you), dd = NLD.at(s), d = nlDrift(t, 0.006, 0.3, 25); cam([h[0] + d[0], h[1] + 0.08 + d[1], h[2]], [dd.x, 0.35, dd.z], 36, 0.03); void y; },
    reach: (t, s, k) => { const v = NL_RV || (NL_RV = new THREE.Vector3()); you.root.updateMatrixWorld(true); you.j.ra.hand.getWorldPosition(v);
      const dd = NLD.at(s), m = [(v.x + dd.x) / 2, (v.z + dd.z) / 2], bend = MathX.smooth(s - nlSC('reach', 1), 0, 2.5), d = nlDrift(t, 0.008, 0.3, 26), sd = [toH[1], -toH[0]];
      cam([m[0] + sd[0] * (1.7 - 0.2 * k) + toH[0] * 0.5 + d[0], 0.5 - 0.12 * bend + d[1], m[1] + sd[1] * (1.7 - 0.2 * k) + toH[1] * 0.5], [m[0], 0.12 - 0.06 * bend, m[1]], 40, 0.03, 3.2 * bend); },
  };
  for (const md of NL_DARK) set.cams[md] = () => {};

  // ---- labels pinned to things: [modes, (s) → { p, text, sub }]
  const L = (p, text, sub, a = 1, side) => ({ p, text, sub, a, side });
  set.labels = (t) => {
    const s = set._s, m = set._mode, sh = FILM._shot, w = sh ? StoryHUD.win(t, sh.t0 + 0.4, sh.t1 - 0.2, 0.3, 0.2) : 0;
    if (!w) return [];
    if (m === 'you') return [L(head(you), 'YOUR FACE', '+33 °C', w), L([Y1[0] + 1.5, 0.0, Y1[1] + 1.2], 'THE ICE', '−14 °C', w)];
    if (m === 'sky') return [L([head(you)[0] + NL_SUN[0] * 400, NL_SUN[1] * 400 + 2, head(you)[2] + NL_SUN[2] * 400], 'THE SUN', 'STILL UP. STILL WARM', w)];
    if (m === 'hand' && s > E.hand[1] + 0.6) return [L([set.printAt[0], 0.04, set.printAt[1]], 'YOUR HANDPRINT', `${Math.round(NLP.printT(s - E.hand[1]))} °C`, w)];
    if (m === 'town') return [L(shore.lamps[11], 'A STREET LAMP', 'ON · ONLY HEAT', w)];
    if (m === 'window') { const v = new THREE.Vector3(); phoneLady.j.ra.hand.getWorldPosition(v); return [L([v.x, v.y, v.z], 'HER PHONE', 'SCREEN ON', w)]; }
    if (m === 'out') { const c = V.car(s); return [L([c.x + V.dir[0] * 1.6, c.y + 0.75, c.z + V.dir[1] * 1.6], 'ENGINE', '+75 °C', w)]; }
    if (m === 'ice') return [L([H[0] + 1, 0.05, H[1] + 2], 'THE ICE HERE', '8 cm', w)];
    if (m === 'steam') { const R = V.holeR(s) * 0.75, c = camera.position, q = [c.x - H[0], c.z - H[1]], l = Math.hypot(q[0], q[1]); return [L([H[0] + q[0] / l * R, 0.05, H[1] + q[1] / l * R], 'THE HOLE', '12° WARMER THAN THE AIR', w)]; }
    if (m === 'driver') return [L([NLD.at(s).x, 0.6, NLD.at(s).z], 'THE DRIVER', 'IN WATER AT 0 °C', w)];
    if (m === 'plane') { const A = NLA.at(s); return [L([A.x + Math.cos(A.yaw) * 4.2, A.y, A.z - Math.sin(A.yaw) * 4.2], 'AN ENGINE', `${Math.round(A.y)} m UP`, w)]; }
    if (m === 'lorry') { const q = NLV.lorry(s); return [L([q.x - 5.0, q.y + 2.6, q.z], 'THE LORRY', 'DRIVING BY FEEL', w)]; }
    if (m === 'edge') return [L(head(driver), 'HIM', `${Math.floor(NLD.inWater(s) / 60)} MIN IN 0 °C WATER`, w)];
    if (m === 'reach') return [L(head(driver), 'HIM', 'HIS ARMS ARE GOING', w), L(head(you), 'YOU', 'ON 8 cm OF ICE', w, 'l')];
    return [];
  };
  // ---- the look: heat (cold, grainy, a touch of glare), daylight (golden), black
  set.grade = (t, p, shot) => {
    if (set._black) { p.fade = 1; return; }
    if (shot.mode === 'title') { p.exposure = 1.05; p.saturation = 1.08; p.contrast = 1.06; p.warmth = 0.6; p.bloom = 0.5; p.bloomThreshold = 0.9; p.vignette = 0.5; p.grain = 0.02; return; }
    p.exposure = 1.0; p.saturation = 0.0; p.contrast = 1.0; p.warmth = 0; p.blackLift = 0.0; p.vignette = 0.62; p.soft = 0.1; p.bloom = 0.55; p.bloomThreshold = 1.05; p.grain = 0.032; p.uneven = 0.05;
  };
  return set;
}

// the lorry: a cab and a box body; its engine (under the cab, at the front) and its lamps hot
function nlLorry(set) {
  const g = new THREE.Group(), S = set.scene; S.add(g);
  const cab = nlMesh(new THREE.BoxGeometry(2.5, 2.9, 2.3), nlStd('#d9dbdc', 0.5, 0.2), 0, 1.75, 4.6, g); nlReg(set, cab, nlHeatMat(-3, { hot: [0, -1.0, 1.0, 0.7, 60], var: 1.5 }));
  const box = nlMesh(new THREE.BoxGeometry(2.55, 3.4, 9.2), nlStd('#2a4a7a', 0.6), 0, 2.15, -1.6, g); nlReg(set, box, nlHeatMat(-15, { var: 1 }));
  const grill = nlMesh(new THREE.BoxGeometry(2.2, 0.8, 0.05), nlStd('#222', 0.5), 0, 0.95, 5.78, g); nlReg(set, grill, nlHeatMat(60, { over: 1.2 }));
  const ws = nlMesh(new THREE.BoxGeometry(2.3, 1.1, 0.04), nlStd('#26323d', 0.15, 0.4), 0, 2.45, 5.77, g); nlReg(set, ws, nlHeatMat(-3));
  for (const x of [-0.95, 0.95]) { const l = nlMesh(new THREE.BoxGeometry(0.35, 0.22, 0.05), new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#fff4dd', emissiveIntensity: 2 }), x, 0.85, 5.8, g); nlReg(set, l, nlHeatMat(70, { over: 1.2 })); }
  for (const [z, w] of [[4.4, 2.3], [-3.6, 2.3], [-5.0, 2.3]]) for (const sd of [-1, 1]) { const wh = nlCyl(0.52, 0.52, 0.4, nlStd('#151515', 0.9), sd * (w / 2 - 0.1), 0.52, z, g, 16); wh.rotation.z = Math.PI / 2; nlReg(set, wh, nlHeatMat(14)); }
  return { g };
}
// the plane: a twin turboprop on its approach (fuselage, wings, tail, two engines hot, lamps on)
function nlPlane(set) {
  const g = new THREE.Group(), S = set.scene; S.add(g);
  const white = nlStd('#eef0f2', 0.4, 0.2), hb = nlHeatMat(-11, { var: 1 });
  // (the cabin is heated: the fuselage's skin a few degrees over the air, warmest along the belly; its windows warm)
  const fus = nlMesh(new THREE.CapsuleGeometry(1.35, 22, 6, 16), white, 0, 0, 0, g); fus.rotation.x = Math.PI / 2; nlReg(set, fus, nlHeatMat(-5, { hot: [0, 0, -1.3, 2.2, 6], var: 1 }));
  for (const x of [-1.31, 1.31]) { const w = nlMesh(new THREE.BoxGeometry(0.03, 0.26, 15), white, x, 0.38, 0.5, g); nlReg(set, w, nlHeatMat(12)); }
  const wing = nlMesh(new THREE.BoxGeometry(27, 0.35, 2.4), white, 0, 1.1, -1, g); nlReg(set, wing, hb);
  const tp = nlMesh(new THREE.BoxGeometry(8.5, 0.25, 1.6), white, 0, 5.0, -11.5, g); nlReg(set, tp, hb);
  const fin = nlMesh(new THREE.BoxGeometry(0.3, 5, 3.2), white, 0, 2.6, -11, g); fin.rotation.x = -0.35; nlReg(set, fin, hb);
  for (const x of [-4.2, 4.2]) { const n = nlMesh(new THREE.CylinderGeometry(0.62, 0.55, 5, 12), white, x, 0.75, 0.4, g); n.rotation.x = Math.PI / 2; nlReg(set, n, nlHeatMat(20, { hot: [0, -1.6, 0, 1.6, 180], over: 1.0 })); }
  for (const x of [-12, 12]) { const l = nlMesh(new THREE.SphereGeometry(0.25, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff' }), x, 1.1, -0.2, g); nlReg(set, l, nlHeatMat(40)); }
  return { g };
}

let NL_RV = null;
NL_SETS.lake = (app) => nlLakeSet(app);
