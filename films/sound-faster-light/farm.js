/* =====================================================================
   FARM — the film's one set: the farm and the corn (world.js, corn.js), the storm (sky.js), the tornado (tornado.js)
   and everything that moves (physics.js): you, your daughter, the dog, the bats, the sheriff's car, the lightning and
   its light. Per shot (shots.js) a camera (set.cams[mode]); labels pinned to things (set.labels); the look (set.grade).
   The light: dusk under a storm (a dim blue-grey sky light, the last orange of the twilight low in the west-north-west),
   the farm's lamps (the yard light, the porch, the barn: all out once lightning hits the yard light), your torch, and the
   lightning (the sky lit from inside, a hard white light from the strike's side).
   ===================================================================== */

const SF_POV = new Set(['run', 'found', 'turn', 'question']);
// who the soft fill light is on, per camera (none: the shot is about the place)
const SF_FILL = { title: 'kid', high: 'you', thunder: 'you', walk: 'you', race: 'you', rumble: 'you', stare: 'you', call: 'you', echo: 'you', answer: 'you', search: 'you', ears1: 'you', ears2: 'you',
  insideHead: 'you', louder: 'you', wrongWay: 'you', batsYou: 'you', goingAway: 'you', louderT: 'you', dial: 'you', kidPhone: 'kid', phoneMap: 'you', runFront: 'you', stumble: 'you',
  lyingDown: 'you', found: 'kid', hold: 'kid', everywhere: 'you' };

function sfFarmSet(app) {
  const F = SF_F, E = SFE, Q = SF_PLACES;
  const o = sfSet(app, { sky: '#07080b', fog: 0.00011, fogColor: '#0a0c11', fov: 50, near: 0.05, far: 30000, hemi: ['#3a4766', '#17130e', 0.6],
    sun: [SF_SUN[0] * 400, 30, SF_SUN[2] * 400], sunColor: '#ff8a4a', sunI: 0.22, env: ['#1c2232', '#2a2420', '#0c0c0c'] });
  const { scene, camera, sun, hemi } = o;
  scene.environmentIntensity = 0.35;
  const set = { scene, camera, _s: 0, renderH: 1080 };
  const fog = scene.fog, fogBase = new THREE.Color('#0a0c11');
  // ---- the scenery
  set.sky = sfStormSky(scene);
  sfTerrain(set); sfRoad(set);
  set.house = sfHouse(set); set.barn = sfBarn(set); set.yard = sfYard(set); set.hansen = sfHansen(set); set.town = sfTown(set);
  set.corn = sfCorn(set);
  set.bolts = sfBolts(scene); set.rain = sfRain(scene); set.tornado = sfTornado(scene); set.bats = sfBats(scene);
  // ---- the people and the dog
  const you = sfPerson('sfYou', scene, { id: 'you' }), kid = sfPerson('sfKid', scene, { id: 'kid', kid: true, hoodUp: true }), dog = sfDog(scene);
  set.cast = { you, kid, dog };
  const torchM = sfStd('#1a1a1c', 0.4, 0.6), torch = sfMesh(new THREE.CylinderGeometry(0.022, 0.018, 0.2, 10), torchM, 0, -0.07, 0.06, you.j.la.hand); torch.rotation.x = Math.PI / 2;
  const mkPhone = (P) => { const g = new THREE.Group(); P.j.ra.hand.add(g); g.position.set(0, -0.07, 0.05); sfBox(0.075, 0.15, 0.01, sfStd('#111418', 0.25), 0, 0, 0, g);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.135), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.75, 1.1) })); scr.position.z = 0.0055; g.add(scr); return { g, scr }; };
  const yPhone = mkPhone(you), kPhone = mkPhone(kid);
  // ---- the sheriff's car (white, a light bar)
  const VF = new VehicleFactory(), carV = VF.build('sedan', '#e9e9e6'), car = new THREE.Group(), carIn = new THREE.Group(); car.add(carIn); carIn.add(carV.group); carIn.rotation.y = -Math.PI / 2; scene.add(car);
  const barM = [new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 0.2, 0.1) }), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 0.4, 3) })];
  for (const [i, x] of [[0, -0.42], [1, 0.42]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 0.25), barM[i]); b.position.set(x, 1.5, -0.1); car.add(b); }
  // ---- the lights
  const flashL = new THREE.DirectionalLight('#c8ccff', 0); flashL.castShadow = true; flashL.shadow.mapSize.set(2048, 2048); { const c = flashL.shadow.camera; c.left = -70; c.right = 70; c.top = 70; c.bottom = -70; c.near = 1; c.far = 1400; } flashL.shadow.bias = -0.0005; flashL.shadow.normalBias = 0.04; scene.add(flashL); scene.add(flashL.target);
  const L = F.yardLight, yardL = new THREE.SpotLight('#ffbf80', 0, 0, 1.15, 0.65, 2); yardL.position.set(L.x, L.h - 0.45, L.z + 1.45); yardL.target.position.set(L.x - 2, 0, L.z + 3); yardL.castShadow = true; yardL.shadow.mapSize.set(1024, 1024); yardL.shadow.bias = -0.0008; yardL.shadow.camera.near = 0.5; yardL.shadow.camera.far = 90; scene.add(yardL); scene.add(yardL.target);
  const torchL = new THREE.SpotLight('#fff1dc', 0, 70, 0.3, 0.55, 2); scene.add(torchL); scene.add(torchL.target);
  const porchL = new THREE.PointLight('#ffb070', 0, 30, 2); porchL.position.set(...set.house.porchLight); porchL.position.z += 0.5; scene.add(porchL);
  const barnL = new THREE.PointLight('#ffc890', 0, 40, 2); barnL.position.set(set.barn.lamp[0], set.barn.lamp[1] - 0.3, set.barn.lamp[2] + 0.5); scene.add(barnL);
  const phoneL = new THREE.PointLight('#a8c8ff', 0, 2.5, 2); scene.add(phoneL);
  const carL = new THREE.PointLight('#ff2010', 0, 60, 2); scene.add(carL);
  // a soft fill on whoever the shot is about (a cinematographer's cheat: the wet night's sky light, from the camera's side),
  // and the torch's light bounced back off the wet corn onto your front
  const fillL = new THREE.PointLight('#93a6cc', 0, 6, 2); scene.add(fillL);
  const bounceL = new THREE.PointLight('#ffe6c4', 0, 3.5, 2); scene.add(bounceL);
  // ---- the glows: far lights (no fog), near glows (added), soft puffs (smoke, dust)
  const glow = sfPuffs(scene, 1200, { additive: true, soft: 1.3 }), far = sfPuffs(scene, 600, { additive: true, soft: 1.1, noFog: true }), soft = sfPuffs(scene, 2200, { soft: 1.6 });
  // the torch beam in the rain: a soft cone of added light
  const beamM = new THREE.ShaderMaterial({ uniforms: { uI: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    vertexShader: 'varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY = position.y; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform float uI; varying float vY; varying vec3 vN; varying vec3 vV; void main(){ float u = clamp(-vY / 14.0, 0.0, 1.0); float e = pow(abs(dot(vN, vV)), 1.5); gl_FragColor = vec4(vec3(1.0, 0.94, 0.82) * uI * (1.0 - u) * (1.0 - u) * e * 0.05, 1.0); }' });
  const beamG = new THREE.ConeGeometry(14 * Math.tan(0.24), 14, 24, 1, true); beamG.translate(0, -7, 0);
  const beam = new THREE.Mesh(beamG, beamM); beam.frustumCulled = false; beam.renderOrder = 7; scene.add(beam);

  // ---- where you are and what you're doing (a pure function of s): { st, q, yaw }
  const W = -Math.PI / 2;   // facing west
  const youPose = (s) => {
    const st = SFY.at(s); let q = sfStatePose(st, s, 0), yaw = st.yaw, y0 = 0;
    const atEdge = s > E.walk[1] - 0.5 && s < E.run && st.state === 'stand';
    if (atEdge) yaw = s > E.away[1] && s < E.back[0] ? Math.PI : W + 0.25 * Math.sin(s * 0.13);
    if (st.state === 'stand' && s < E.walk[0] + 0.5) yaw = Math.atan2(Q.kidIn[0] - st.x, Q.kidIn[1] - st.z);
    // the boom at 8:52:00: you flinch
    if (s > -0.05 && s < 1.6) q = { p: lerpPose(SF_P.flinch(s), q.p, sfEase(s, 0.5, 1.6)), lay: 0, y: 0 };
    // your call: hands cupped round your mouth
    if (Math.abs(s - E.call - 0.6) < 1.6) q = { p: SF_P.call(s, sfEase(s, E.call - 1.0, E.call - 0.4) * (1 - sfEase(s, E.call + 1.6, E.call + 2.2))), lay: 0, y: 0 };
    // every sound inside your head: your hands go to your ears
    { const a = sfSC('head', 0, -0.8), b = sfSC('head', 1, 0.5); if (s > a && s < b + 0.8) { const p = SF_P.listen(s, 0), kk = sfEase(s, a, a + 0.7) * (1 - sfEase(s, b, b + 0.8)); p.lSh = [0.95 * kk + 0.15 * (1 - kk), 0.55 * kk]; p.rSh = [0.95 * kk + 0.12 * (1 - kk), 0.55 * kk]; p.lEl = 2.35 * kk + 0.3; p.rEl = 2.35 * kk + 0.3; p.headYaw *= 0.3; p.neck = 0.18 * kk; q = { p, lay: 0, y: 0 }; } }
    // a bat at your face
    if (Math.abs(s - E.batYou - 0.3) < 0.8) q = { p: lerpPose(q.p, SF_P.flinch(s), Math.sin(Math.PI * MathX.clamp((s - E.batYou + 0.5) / 1.6, 0, 1))), lay: 0, y: 0 };
    // the phone: at your ear; then looking at its screen
    if (s > E.dial - 1.2 && s < E.run) q = { p: s > sfSC('phone', 2, -0.6) ? SF_P.look(s) : SF_P.phone(s, 0, sfEase(s, E.pickUp - 0.2, E.pickUp + 0.6)), lay: 0, y: 0 };
    // running: the torch held out in your left hand
    if (st.state === 'run') { q.p.lSh = [1.05, 0.15]; q.p.lEl = 0.5; }
    // with her: kneeling, then holding her
    if (s > SFY.runEnd) { q = { p: s > E.hold ? SF_P.hug(s) : SF_P.kneel(s, 0), lay: 0, y: 0.02 }; const u = SFY.u; const kk = sfEase(s, E.hold - 0.6, E.hold + 0.4); yaw = Math.atan2(u[0], u[1]); return { st: Object.assign({}, st, { x: st.x + u[0] * 0.42 * kk, z: st.z + u[1] * 0.42 * kk }), q, yaw, y0 }; }
    return { st, q, yaw, y0 };
  };
  const kidPose = (s) => {
    const st = SFK.at(s); let q = sfStatePose(st, s, 3, true), yaw = st.yaw;
    if (st.state === 'crouch') { const dg = [Q.kid[0] - 0.5 - Q.kid[0], Q.kid[1] + 0.45 - Q.kid[1]]; yaw = Math.atan2(dg[0], dg[1]);
      q = { p: SF_P.kidHold(s), lay: 0, y: 0 };
      if (s > E.pickUp - 0.6 && s < E.run + 30) { const p = SF_P.kidHold(s); p.rSh = [0.85, -0.1]; p.rEl = 2.4; p.neck = 0.2; q = { p, lay: 0, y: 0 }; }
      if (s > SFY.runEnd - 0.5) { const u = SFY.u; yaw = Math.atan2(-u[0], -u[1]) + 0.6; } }
    return { st, q, yaw };
  };
  // the farm's power: on until lightning hits the yard light
  const powerOn = (s) => s < E.yardHit;
  // the flash's light this frame
  const flashState = (s, cp) => {
    const fl = sfFlashesAt(s); let A = 0, best = null, bw = 0; const list = [];
    for (const [k, v] of fl) { const d = Math.max(200, Math.hypot(k.x - cp.x, k.z - cp.z)), w = (k.kind === 'ic' ? 0.7 : 1.0) * MathX.clamp(1800 / d, 0.22, 2.2) * (k.key === 'yard' ? 1.6 : 1), a = v * w; A += a; list.push([k, v]); if (a > bw) { bw = a; best = k; } }
    return { A: Math.min(A, 2.2), best, list };
  };

  set.frame = (t, shot) => {
    const s = sfStoryAt(t), m = shot.mode, k = (t - shot.t0) / Math.max(1e-6, shot.t1 - shot.t0);
    set._s = s; set._mode = m; set.renderH = (FILM._app && FILM._app.renderH) || 1080;
    SF_CORN_U.uT.value = t;
    // ---- you, her, the dog
    const yp = youPose(s); sfPlace(you, yp.q, yp.st.x, yp.st.z, yp.yaw, yp.y0);
    you.root.visible = !SF_POV.has(m);
    const kp = kidPose(s); sfPlace(kid, kp.q, kp.st.x, kp.st.z, kp.yaw);
    kid.root.visible = s > -9;
    { const st = SFD.at(s); let x = st.x, z = st.z, yaw = st.yaw; if (st.state === 'lie') { const f = [Math.sin(kp.yaw), Math.cos(kp.yaw)]; x = kp.st.x + f[0] * 0.42; z = kp.st.z + f[1] * 0.42; yaw = kp.yaw + Math.PI / 2; }
      dog.g.position.set(x, sfGroundY(x, z), z); dog.g.rotation.y = yaw; dog.pose(st, s); }
    yPhone.g.visible = s > E.dial - 1.2 && s < E.run; kPhone.g.visible = s > E.pickUp - 0.6 && s < E.run + 30;
    torch.visible = s > E.walk[1] - 8;
    // ---- the sheriff's car
    const cs = SFC.at(s), carOn = Math.abs(s - E.sheriff) < 40;
    car.visible = carOn; car.position.set(cs.x, sfGroundY(cs.x, cs.z) + 0.02, cs.z); car.rotation.y = 0;
    { const a = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 1.4); barM[0].color.setRGB(3 * a + 0.1, 0.15 * a, 0.08 * a); barM[1].color.setRGB(0.15 * (1 - a), 0.3 * (1 - a), 3 * (1 - a) + 0.1); carL.intensity = carOn ? 60 : 0; carL.color.setRGB(a, 0.1, 1 - a); carL.position.set(cs.x, 2.2, cs.z); }
    // ---- the cameras (after the people: some follow a head)
    set._shake = sfShake(s, t);
    set.cams[m](t, s, k, shot);
    const cp = camera.position;
    // ---- the flashes: the sky, a hard light from the strike's side, the haze, the rain, the funnel
    const fs = flashState(s, cp), A = fs.A;
    { const U = set.sky.U; U.uCam.value.copy(cp); U.uT.value = t; U.uAmb.value = 0.18 * A; U.uSlot.value = 1 - 0.55 * MathX.smooth(s, 170, 280); U.uGreen.value = MathX.smooth(s, 150, 230);
      for (let i = 0; i < set.sky.NF; i++) { const e = fs.list[i]; if (!e) { U.uFlK.value[i] = 0; continue; } const [kk, v] = e; U.uFl.value[i].set(kk.x, kk.z, kk.kind === 'ic' ? 3200 : 1700, 0); U.uFlK.value[i] = v * Math.min(1.6, kk.amp) * 0.9; } }
    set.sky.mesh.position.copy(cp);
    if (fs.best) { const b = fs.best, dx = b.x - cp.x, dz = b.z - cp.z, d = Math.hypot(dx, dz) || 1; flashL.position.set(cp.x + dx / d * 500, 700, cp.z + dz / d * 500); flashL.intensity = 3.6 * A; }
    else flashL.intensity = 0;
    { const tx = 140 / 2048, cx = Math.round(cp.x / tx) * tx, cz = Math.round(cp.z / tx) * tx, dx = flashL.position.x - cp.x, dz = flashL.position.z - cp.z; flashL.target.position.set(cx, 0, cz); flashL.position.set(cx + dx, 700, cz + dz); flashL.target.updateMatrixWorld(); }
    sfShadowOn(flashL, A > 0.03);
    hemi.intensity = 0.8 + 1.5 * A; sun.intensity = 0.22 * (1 - 0.5 * MathX.smooth(s, 170, 280));
    fog.color.copy(fogBase).lerp(new THREE.Color(0.32, 0.33, 0.42), Math.min(1, A * 0.55));
    fog.density = (m === 'run' || m === 'found' || m === 'turn' || m === 'question' || m === 'lyingDown' || m === 'stumble' || m === 'runFront' || m === 'hold' || m === 'everywhere') ? 0.012 : 0.00011 + 0.00006 * MathX.smooth(s, 160, 280);
    // ---- the farm's lamps (out once lightning hits the yard light), the torch, a phone's glow
    const pw = powerOn(s);
    yardL.intensity = pw ? 420 : 0; porchL.intensity = pw ? 9 : 0; barnL.intensity = pw ? 16 : 0;
    set.yard.yardLight.lensM.color.setRGB(pw ? 6 : 0.02, pw ? 4.2 : 0.02, pw ? 2.2 : 0.02);
    for (const g of set.house.lit) { g.emissiveIntensity = pw ? 1.6 : 0; }
    sfShadowOn(yardL, pw && cp.distanceTo(yardL.position) < 160);
    const tOn = torch.visible || SF_POV.has(m);
    const tp = new THREE.Vector3(), td = new THREE.Vector3();
    if (SF_POV.has(m)) { camera.getWorldDirection(td); tp.copy(cp).addScaledVector(td, 0.25); tp.y -= 0.28; tp.x += -td.z * 0.18; tp.z += td.x * 0.18; td.y -= 0.12; td.normalize(); }
    else { torch.getWorldPosition(tp); const a = yp.yaw + (yp.q.p.headYaw || 0) * 0.6; td.set(Math.sin(a), -0.2, Math.cos(a)).normalize(); if (yp.st.state === 'run') td.y = -0.12; }
    torchL.intensity = tOn ? (SF_POV.has(m) ? 70 : 170) : 0; torchL.position.copy(tp).addScaledVector(td, 0.3); torchL.target.position.copy(tp).addScaledVector(td, 10); torchL.target.updateMatrixWorld();
    bounceL.intensity = tOn && !SF_POV.has(m) ? 0.6 : 0; bounceL.position.copy(tp).addScaledVector(td, 1.6); bounceL.position.y -= 0.3;
    // the fill on the shot's subject: a light between it and the camera, its level such that the subject gets about the same
    { const sub = SF_FILL[m], P = sub === 'kid' ? kid : sub === 'you' ? you : null;
      if (P && P.root.visible) { const h = new THREE.Vector3(); P.root.updateMatrixWorld(true); P.j.head.getWorldPosition(h); h.y -= sub === 'kid' ? 0.15 : 0.3; const v = new THREE.Vector3().subVectors(cp, h), d = v.length(), df = Math.min(d * 0.5, 1.7);
        fillL.position.copy(h).addScaledVector(v.normalize(), df); fillL.position.y += 0.45; fillL.intensity = 1.1 * df * df; fillL.distance = df * 3.2; }
      else fillL.intensity = 0; }
    beam.visible = tOn; beam.position.copy(tp); beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), td); beamM.uniforms.uI.value = tOn ? 1 : 0;
    // a phone's glow on the face in the close shots
    { const ph = m === 'kidPhone' ? kPhone : m === 'phoneMap' ? yPhone : null; if (ph && ph.g.visible) { const n = new THREE.Vector3(0, 0, 1).transformDirection(ph.scr.matrixWorld); ph.scr.getWorldPosition(phoneL.position); phoneL.position.addScaledVector(n, 0.15); phoneL.intensity = 0.07; } else phoneL.intensity = 0; }
    // ---- the rain (light at first, heavier as the storm comes; blown towards the tornado late on)
    const windK = MathX.smooth(s, sfSC('wind', 0, -12) + 0, sfSC('wind', 0, 2)), windDir = sfDirOf(sfBearing([cp.x, cp.z], SFN.at(s)));
    { const R = set.rain.U; R.uT.value = t; R.uCam.value.copy(cp); R.uFlash.value = A; R.uTP.value.copy(tp); R.uTD.value.copy(td); R.uTI.value = tOn ? 3 : 0; R.uRes.value.set(set.renderH * 16 / 9, set.renderH);
      const gust = 2 + 3 * (0.5 + 0.5 * Math.sin(t * 0.7)); R.uV.value.set(3.5 * (1 - windK) + windDir[0] * 22 * windK + gust * 0.3, -9, -1.0 * (1 - windK) + windDir[1] * 22 * windK); R.uN.value = 0.25 + 0.75 * MathX.smooth(s, 60, 230); R.uA.value = 0.55;
      R.uLight.value.setRGB(0.03 + (pw ? 0.02 : 0), 0.034, 0.045); }
    // ---- the corn's wind: a breeze, gusts as the storm comes, then the inflow lays it down (pointing at the tornado)
    { const w = SF_CORN_U.uWind.value, base = 0.03 + 0.07 * MathX.smooth(s, 0, 200) + 0.06 * MathX.smooth(s, 230, 250);
      w.set(windK > 0.01 ? windDir[0] : 1, base + 0.25 * windK, windK > 0.01 ? windDir[1] : -0.3); SF_CORN_U.uBend.value = 0.85 * MathX.smooth(s, sfSC('wind', 0, -3), sfSC('wind', 1, 0.5)); }
    // ---- the tornado
    const tv = s > Math.max(SFN.born, E.tornado - 0.05); set.tornado.g.visible = tv;   // (wrapped in rain and dark until the flash that shows it)
    if (tv) { const p = SFN.at(s); set.tornado.update(s, t, p, SFN.r(s), A); const U = set.tornado.U; U.uFl.value = A * 0.9; U.uAmb.value = 0.012 + 0.01 * (1 - MathX.smooth(s, 170, 260));
      if (fs.best) { const b = fs.best, tdist = Math.hypot(p[0] - cp.x, p[1] - cp.z), bdist = Math.hypot(b.x - cp.x, b.z - cp.z); U.uBack.value = bdist > tdist ? 0.9 : 0.1; U.uFlDir.value.set(b.x - p[0], 400, b.z - p[1]).normalize(); } }
    // ---- the windmill turns into the wind; the tyre swing sways; the bats
    { const wm = set.yard.windmill; wm.head.rotation.y = Math.atan2(-windDir[0], -windDir[1]) * windK + 1.2 * (1 - windK) + 0.1 * Math.sin(t * 0.3); wm.wheel.rotation.z = -t * (1.2 + 6 * MathX.smooth(s, 100, 250)); }
    set.yard.swing.rotation.x = (0.06 + 0.3 * MathX.smooth(s, 150, 250)) * Math.sin(t * 1.4);
    set.yard.swing.rotation.z = 0.05 * Math.sin(t * 0.9);
    set.bats.update(s);
    // ---- the Hansen farm comes apart
    { const H = set.hansen, u = s - E.hansen + 2.5; H.lampM.color.setRGB(s < E.hansen - 1.5 ? 8 : 0, s < E.hansen - 1.5 ? 5.5 : 0, s < E.hansen - 1.5 ? 2.8 : 0); H.win.color.setRGB(s < E.hansen - 1.5 ? 2.4 : 0, s < E.hansen - 1.5 ? 1.6 : 0, s < E.hansen - 1.5 ? 0.8 : 0);
      H.parts.forEach((q, i) => { if (u <= 0) { q.m.position.copy(q.p0); q.m.rotation.copy(q.r0); q.m.visible = true; return; }
        const w = Math.max(0, u - 0.4 * sfH(i, 3)), a = w * (1.2 + sfH(i, 4)); q.m.position.set(q.p0.x + Math.cos(a + i) * 25 * w, q.p0.y + 18 * w * w, q.p0.z + Math.sin(a + i) * 25 * w); q.m.rotation.set(q.r0.x + w * 3 * sfH(i, 5), q.r0.y + w * 4, q.r0.z + w * 2 * sfH(i, 6)); q.m.visible = w < 7; }); }
    // ---- the corn the camera needs; the bolts; the glows
    set.corn.update(cp, set.cornOpt || {}); set.cornOpt = null;
    set.bolts.update(s, set.renderH);
    sfFarmFx(set, s, t, { glow, far, soft, cam: camera, F, yardOn: pw, yardHit: E.yardHit, torchTop: tOn && cp.y > 6 && s > E.run ? [tp.x + td.x * 4, 2.45, tp.z + td.z * 4] : null, torch: { on: tOn && !SF_POV.has(m), p: [tp.x, tp.y, tp.z], face: Math.max(0, -td.dot(new THREE.Vector3().subVectors(cp, tp).normalize()) * -1) },
      hansen: { alive: (q) => q < E.hansen - 1.5 }, phones: [{ on: yPhone.g.visible && !SF_POV.has(m), p: (() => { const v = new THREE.Vector3(); yPhone.scr.getWorldPosition(v); return [v.x, v.y, v.z]; })() }, { on: kPhone.g.visible, p: (() => { const v = new THREE.Vector3(); kPhone.scr.getWorldPosition(v); return [v.x, v.y, v.z]; })() }],
      car: { on: carOn, bar: [cs.x, 1.62, cs.z], head: [cs.x - 2.3, 0.75, cs.z], side: [0, 1] }, tornado: tv ? { vis: true, p: SFN.at(s), y: sfGroundY(...SFN.at(s)), r: SFN.r(s), lit: A } : null, wind: windDir, windK, lit: A });
    set._A = A;
  };

  // ---- the cameras
  const cam = (p, at, fov, near = 0.05, roll = 0) => { if (camera.near !== near) { camera.near = near; camera.updateProjectionMatrix(); } const sh = set._shake || [0, 0, 0];
    sfCam(camera, [p[0] + sh[0], p[1] + sh[1], p[2] + sh[2]], [at[0] + sh[0] * 6, at[1] + sh[1] * 6, at[2] + sh[2] * 6], fov, roll); };
  const head = (P) => { const v = new THREE.Vector3(); P.root.updateMatrixWorld(true); P.j.head.getWorldPosition(v); return [v.x, v.y, v.z]; };
  const dr = (t, a, r, sd) => sfDrift(t, a, r, sd);
  const fwd = (yaw) => [Math.sin(yaw), Math.cos(yaw)], rgt = (yaw) => [-Math.cos(yaw), Math.sin(yaw)];
  const Y = (s) => youPose(s);
  // the look-at point that puts H at (xn, yn) on screen (-1…1) from C with this vertical fov
  const aim = (C, H, xn, yn, fov) => { const dx = H[0] - C[0], dz = H[2] - C[2], dh = Math.hypot(dx, dz) || 1e-6, D = [dx / dh, dz / dh], R = [-D[1], D[0]];
    const tv = Math.tan(fov * Math.PI / 360), a = Math.atan(-xn * tv * 16 / 9), b = Math.atan2(H[1] - C[1], dh) - Math.atan(yn * tv);
    const N = [D[0] * Math.cos(a) + R[0] * Math.sin(a), D[1] * Math.cos(a) + R[1] * Math.sin(a)]; return [C[0] + N[0] * dh, C[1] + Math.tan(b) * dh, C[2] + N[1] * dh]; };
  // you: your head, facing and right (from your pose); a clear line through the corn from the camera to a subject
  const yb = (s) => { const p = Y(s); return { h: head(you), f: fwd(p.yaw), r: rgt(p.yaw) }; };
  const kb = (s) => { const p = kidPose(s); return { h: head(kid), f: fwd(p.yaw), r: rgt(p.yaw) }; };
  const off = (h, f, r, a, b, y) => [h[0] + f[0] * a + r[0] * b, y, h[2] + f[1] * a + r[1] * b];
  const clear = (C, H, w = 0.45) => { set.cornOpt = { clear: [C[0], C[2], H[0], H[2], w] }; };
  set.cams = {
    // over your shoulder on the lawn: she runs after the dog into the corn; the storm over it (the boom at 8:52:00)
    title: (t, s, k) => { const a = SF_PLACES.swing, b = SF_PLACES.kidIn, L = Math.hypot(b[0] - a[0], b[1] - a[1]), f = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], r = [-f[1], f[0]];
      const kp = SFK.at(Math.min(s, -0.7)), d = dr(t, 0.03, 0.5, 1), C = [kp.x - f[0] * (3.6 - 1.6 * k) - r[0] * 0.9 + d[0], 0.95 + d[1], kp.z - f[1] * (3.6 - 1.6 * k) - r[1] * 0.9 + d[2]];
      cam(C, [kp.x + f[0] * 9 + r[0] * 0.4, 1.75 + 0.5 * k, kp.z + f[1] * 9 + r[1] * 0.4], 54); },
    // low over the corn's north-west corner: the field and the storm, west
    storm: (t, s, k) => { const d = dr(t, 0.05, 0.2, 2); cam([-36 - 4 * k, 3.3 + d[1], -44 + d[2]], [-900, 120, -380 - 60 * k], 58, 0.2); },
    // in front of you on the lawn (you on the left; the diagram on the right)
    thunder: (t, s, k) => { const h = head(you), d = dr(t, 0.012, 0.3, 3), C = [h[0] - 2.2 + d[0], 1.35 + d[1], h[2] - 2.6 + 0.3 * k]; cam(C, aim(C, h, -0.4, 0.12, 44), 44); },
    // beside you as you walk to the corn, the storm ahead
    walk: (t, s, k) => { const y = Y(s).st, f = fwd(y.yaw), r = rgt(y.yaw), d = dr(t, 0.02, 0.4, 4); cam([y.x - f[0] * 3.4 - r[0] * 1.4 + d[0], 1.75 + d[1], y.z - f[1] * 3.4 - r[1] * 1.4], [y.x + f[0] * 9 + r[0] * 0.9, 2.3, y.z + f[1] * 9 + r[1] * 0.9], 48); },
    // behind you, looking west: the strike 3 km away
    bolt3: (t, s, k) => { const y = Y(s).st, d = dr(t, 0.01, 0.3, 5); cam([y.x + 3.2 + d[0], 2.25 + d[1], y.z + 1.5], [y.x - 300, 75, y.z + 20], 50, 0.2); },
    // you, on the left, looking up; the diagram on the right
    race: (t, s, k) => { const h = head(you), d = dr(t, 0.01, 0.3, 6), C = [h[0] - 2.6 + d[0], 1.25 + d[1], h[2] + 2.2 - 0.2 * k]; cam(C, aim(C, h, -0.4, 0.0, 46), 46); },
    // the windmill against the storm, low
    windmill: (t, s, k) => { const Wm = F.windmill, d = dr(t, 0.02, 0.3, 7); cam([Wm.x + 7 - 1.2 * k + d[0], 1.2 + d[1], Wm.z + 11], [Wm.x - 1, 9.5, Wm.z - 2], 46, 0.2); },
    // from the barn side across the yard: the yard light, you far off going to the corn
    yardlight: (t, s, k) => { const d = dr(t, 0.02, 0.3, 8); cam([26 + d[0], 2.2 + d[1], 6 - 2 * k], [-30, 3.0, -10], 44, 0.2); },
    // behind you at the corn: the 6 km bolt over the field, north-west
    longBolt: (t, s, k) => { const y = Y(s).st, d = dr(t, 0.01, 0.3, 9); cam([y.x + 5 + d[0], 2.0 + d[1], y.z + 3.5], [y.x - 400, 210, y.z - 330], 64, 0.2); },
    // you at the edge, from the side (the diagram on the right)
    rumble: (t, s, k) => { const h = head(you), d = dr(t, 0.01, 0.3, 10), C = [h[0] + 2.4 + d[0], 1.45 + d[1], h[2] + 3.3 - 0.3 * k]; cam(C, aim(C, h, -0.4, 0.1, 42), 42); },
    // close: you, staring at the corn, the torch on it
    stare: (t, s, k) => { const b = yb(s), d = dr(t, 0.006, 0.3, 11), C = off(b.h, b.f, b.r, 1.0 - 0.1 * k, 1.0, 1.6 + d[1]); C[0] += d[0]; cam(C, aim(C, b.h, 0.36, 0.12, 40), 40); },
    // from a few rows into the corn: you calling, the yard and the barn behind you
    call: (t, s, k) => { const b = yb(s), d = dr(t, 0.008, 0.3, 12), C = off(b.h, b.f, b.r, 4.2, 0.5, 1.45 + d[1]); C[0] += d[0]; clear(C, b.h, 0.6); cam(C, aim(C, b.h, 0.0, 0.02, 40), 40, 0.05); },
    // over your shoulder, east, across the yard to the barn: nothing comes back
    echo: (t, s, k) => { const h = head(you), d = dr(t, 0.008, 0.3, 13); cam([h[0] - 1.6 + d[0], 1.85 + d[1], h[2] - 0.7], [F.barn.x - 8, 4.5, F.barn.z + 4], 34, 0.05); },
    // over your shoulder into the wall of corn, the torch on it
    answer: (t, s, k) => { const b = yb(s), d = dr(t, 0.006, 0.3, 14), C = off(b.h, b.f, b.r, -1.0, 0.6, 1.82 + d[1]); C[0] += d[0]; cam(C, off(b.h, b.f, b.r, 6, 1.5 * Math.sin(t * 0.4), 1.3), 46); },
    // your face, from the corn, eyes searching
    search: (t, s, k) => { const b = yb(s), d = dr(t, 0.005, 0.3, 15), C = off(b.h, b.f, b.r, 1.25, 0.2, 1.6 + d[1]); C[0] += d[0]; cam(C, aim(C, b.h, 0.0, 0.06, 36), 36, 0.05); },
    // close, your head in profile on the left; the diagram on the right
    ears1: (t, s, k) => { const b = yb(s), d = dr(t, 0.005, 0.3, 16), C = off(b.h, b.f, b.r, 0.25, 1.2, 1.66 + d[1]); C[0] += d[0]; cam(C, aim(C, b.h, -0.42, 0.04, 40), 40, 0.05); },
    ears2: (t, s, k) => { const b = yb(s), a = 0.25 + 0.75 * k, d = dr(t, 0.005, 0.3, 17), C = off(b.h, b.f, b.r, Math.sin(a) * 1.4, Math.cos(a) * 1.4, 1.7 + d[1]); C[0] += d[0]; cam(C, aim(C, b.h, -0.42, 0.04, 40), 40, 0.05); },
    // up behind you over the yard: you at the corn with your torch; the field to the storm
    high: (t, s, k) => { const y = Y(s).st, C = [y.x + 16 - 3 * k, 9 + 2 * k, y.z + 11]; cam(C, aim(C, [y.x, 1.2, y.z], -0.1, -0.22, 50), 50, 0.5); },
    // you, your hands over your ears
    insideHead: (t, s, k) => { const b = yb(s), d = dr(t, 0.005, 0.3, 18), C = off(b.h, b.f, b.r, 1.3 - 0.15 * k, 0.35, 1.6 + d[1]); C[0] += d[0]; cam(C, aim(C, b.h, 0.0, 0.1, 38), 38, 0.05); },
    louder: (t, s, k) => { const b = yb(s), d = dr(t, 0.01, 0.3, 19), C = off(b.h, b.f, b.r, -0.8, 3.0, 1.5 + d[1]); C[0] += d[0]; cam(C, aim(C, b.h, -0.3, 0.05, 42), 42); },
    // ahead of you along the corn's edge: you walk north towards us (the wrong way)
    wrongWay: (t, s, k) => { const y = Y(s).st, d = dr(t, 0.02, 0.4, 20); cam([y.x + 1.6 + d[0], 1.5 + d[1], y.z - 6.5], [y.x, 1.4, y.z + 3], 42); },
    // a long lens from you to the north-east horizon: the freight train's lights, 11 km away
    train: (t, s, k) => { const y = Y(s).st, p = SF_TRAIN.at(s); cam([y.x, 16, y.z], [p[0] - 300 + 200 * k, sfGroundY(p[0], p[1]) + 35, p[1] + 200], 4.2, 1.0); },
    // a long lens west over the corn: the Hansen farm, 1.4 km (on the left; the map on the right)
    hansen: (t, s, k) => { const y = Y(s).st, Hq = Q.hansen; cam([y.x, 5.0, y.z], [Hq[0] + 260, sfGroundY(...Hq) + 22, Hq[1] - 120 - 30 * k], 13, 1.0); },
    // high and wide over the plain: farm lights to the horizon, the town's glow, the storm
    plain: (t, s, k) => { cam([-20, 120 + 10 * k, 140], [-400 + 200 * k, 0, -900], 58, 2.0); },
    // the barn's gable: bats pour out of the loft door
    bats1: (t, s, k) => { const B = F.barn, d = dr(t, 0.02, 0.3, 21); cam([B.x - 9 + d[0], 2.2 + d[1], B.z + B.d / 2 + 16], [B.x - 2, B.ridge - 1.5 + 1.0 * k, B.z + B.d / 2], 46, 0.2); },
    // the yard: bats flying into the windmill and the yard light
    batsHit: (t, s, k) => { const d = dr(t, 0.02, 0.3, 22); cam([F.yardLight.x - 14 + d[0], 2.0 + d[1], F.yardLight.z + 12], [F.windmill.x + 2, 6.5, F.windmill.z + 4], 50, 0.2); },
    // you at the corn: a bat at your face; fallen bats in the grass
    batsYou: (t, s, k) => { const b = yb(s), d = dr(t, 0.01, 0.3, 23), C = off(b.h, b.f, b.r, 2.4 - 0.2 * k, 1.6, 1.45 + d[1]); C[0] += d[0]; cam(C, aim(C, b.h, -0.3, 0.1, 42), 42); },
    // a long lens to the town, 6 km south-east: the water tower's light, the street lamps
    sirens: (t, s, k) => { const T = set.town.tower; cam([F.drive.x + 12, 2.4, F.road.z - 5.5], [T[0] - 80 + 60 * k, T[1] - 26, T[2]], 6.0, 1.0); },
    // by the drive at the road: the sheriff's car passes, west
    sheriff: (t, s, k) => { const c = SFC.at(s); cam([F.drive.x + 6, 1.3, F.road.z - 9], [c.x + 2, 1.0, c.z], 48, 0.2); },
    // you at the corn, looking south down the yard to the road
    goingAway: (t, s, k) => { const h = head(you), d = dr(t, 0.01, 0.3, 24); cam([h[0] - 1.4 + d[0], 1.8 + d[1], h[2] - 2.8], [h[0] + 30, 1.0, h[2] + 92], 36); },
    // up behind you over the corn's edge, west: dark; a flash; the tornado
    reveal: (t, s, k) => { const y = Y(s).st, d = dr(t, 0.01, 0.3, 25), p = SFN.at(SFE.tornado); cam([y.x + 4 + d[0], 3.6 + d[1], y.z + 2.5], [p[0] + 200, 330, p[1] - 150], 52, 0.2); },
    funnel: (t, s, k) => { const y = Y(s).st, p = SFN.at(s), d = dr(t, 0.4, 0.4, 26); cam([y.x, 2.8, y.z], [p[0] + d[0] * 20, 300 + d[1] * 20, p[1]], 17, 1.0); },
    louderT: (t, s, k) => { const b = yb(s), d = dr(t, 0.008, 0.3, 27), C = off(b.h, b.f, b.r, -1.5, 0.65, 1.55 + d[1]); C[0] += d[0]; cam(C, aim(C, b.h, -0.35, -0.05, 40), 40, 0.05); },
    // you, the phone at your ear, from the side
    dial: (t, s, k) => { const b = yb(s), d = dr(t, 0.006, 0.3, 28), C = off(b.h, b.f, b.r, 0.5, 0.95 + 0.1 * k, 1.62 + d[1]); C[0] += d[0]; cam(C, aim(C, b.h, -0.3, 0.04, 40), 40, 0.05); },
    // her in the corn, crouched with the dog, her phone at her ear (its glow on her face)
    kidPhone: (t, s, k) => { const b = kb(s), d = dr(t, 0.005, 0.3, 29), C = off(b.h, b.f, b.r, 1.3, 0.6, 0.95 + d[1]); C[0] += d[0]; clear(C, b.h, 0.55); cam(C, aim(C, b.h, 0.0, 0.0, 40), 40, 0.03); },
    // over your shoulder: the phone's map (you on the left; the screen in the diagram on the right)
    phoneMap: (t, s, k) => { const b = yb(s), d = dr(t, 0.005, 0.3, 30), C = off(b.h, b.f, b.r, -0.55, 0.45, b.h[1] + 0.3 + d[1]); C[0] += d[0]; const v = new THREE.Vector3(); yPhone.scr.getWorldPosition(v); cam(C, aim(C, [v.x, v.y, v.z], 0.3, -0.1, 44), 44, 0.05); },
    // POV: running down the rows with your torch
    run: (t, s, k) => { const y = SFY.at(s), ph = y.d / 2.3 * 2 * Math.PI, a = y.yaw + 0.06 * Math.sin(t * 1.3); const f = fwd(a);
      set.cornOpt = { clear: [y.x, y.z, y.x + f[0] * 7, y.z + f[1] * 7, 0.33] }; cam([y.x + 0.08 * Math.sin(ph), 1.62 + 0.035 * Math.abs(Math.sin(ph)), y.z], [y.x + f[0] * 10, 1.35, y.z + f[1] * 10], 62, 0.03, 1.8 * Math.sin(ph * 0.5)); },
    // high over the corn: your torch beam moving through it; the flashes; the tornado beyond
    above: (t, s, k) => { const y = SFY.at(s), p = SFN.at(s); cam([y.x + 26, 30 - 2 * k, y.z + 22], [y.x - 10 + 0.0 * p[0], 0, y.z - 4], 50, 0.5); },
    // ahead of you in the row, low: you run at us, the torch flaring
    runFront: (t, s, k) => { const y = SFY.at(s), f = fwd(y.yaw), d = dr(t, 0.02, 0.6, 31), C = [y.x + f[0] * 3.4 + d[0], 1.25 + d[1], y.z + f[1] * 3.4], h = head(you); clear(C, h, 0.5); cam(C, aim(C, h, 0.0, 0.0, 50), 50, 0.03); },
    // up behind you over the corn, looking back east to the farm: lightning hits the yard light
    yardHit: (t, s, k) => { const y = SFY.at(s), d = dr(t, 0.01, 0.3, 32); cam([y.x - 3 + d[0], 3.4 + d[1], y.z - 1.5], [F.yardLight.x, 5.0, F.yardLight.z], 40, 0.2); },
    yardDead: (t, s, k) => { const y = SFY.at(s); cam([y.x, 3.0, y.z], [F.yardLight.x, F.yardLight.h - 1.2 - 0.6 * k, F.yardLight.z + 1.0], 9, 1.0); },
    // beside you in the corn
    stumble: (t, s, k) => { const y = SFY.at(s), r = rgt(y.yaw), f = fwd(y.yaw), d = dr(t, 0.02, 0.6, 33), C = [y.x + r[0] * 1.5 + f[0] * 0.6 + d[0], 1.55 + d[1], y.z + r[1] * 1.5 + f[1] * 0.6], h = head(you); clear(C, h, 0.5); cam(C, aim(C, h, -0.25, 0.0, 50), 50, 0.03); },
    // over the corn: the field lying over, waves running west
    windAbove: (t, s, k) => { const y = SFY.at(s), d = dr(t, 0.1, 0.6, 34); cam([y.x + 18 + d[0], 9 + d[1], y.z + 6], [y.x - 60, 0, y.z - 10], 50, 0.2); },
    lyingDown: (t, s, k) => { const y = SFY.at(s), f = fwd(y.yaw), r = rgt(y.yaw), d = dr(t, 0.04, 0.7, 35), C = [y.x - f[0] * 2.8 + r[0] * 1.0 + d[0], 1.5 + d[1], y.z - f[1] * 2.8 + r[1] * 1.0]; clear(C, head(you), 0.5); cam(C, [y.x + f[0] * 4, 1.0, y.z + f[1] * 4], 52, 0.03); },
    // a long lens west from over the corn: the tornado on the Hansen farm
    hansenHit: (t, s, k) => { const y = SFY.at(s), Hq = Q.hansen, d = dr(t, 0.4, 0.5, 36); cam([y.x, 4.2, y.z], [Hq[0] + d[0] * 8, sfGroundY(...Hq) + 120 + d[1] * 8, Hq[1]], 24, 1.0); },
    debris: (t, s, k) => { const y = SFY.at(s), p = SFN.at(s), d = dr(t, 0.03, 0.6, 37); cam([y.x + 2.0 + d[0], 2.0 + d[1], y.z + 2.4], [p[0], 420, p[1]], 50, 0.05); },
    // POV: the torch down the row; a flash; the raincoat
    found: (t, s, k) => { const y = SFY.at(s), u = SFY.u, ph = y.d / 2.3 * 2 * Math.PI, hk = head(kid), C = [y.x + 0.05 * Math.sin(ph), 1.58 + 0.03 * Math.abs(Math.sin(ph)) - 0.25 * MathX.smooth(s, SFY.runEnd - 0.4, SFY.runEnd + 0.6), y.z]; clear(C, hk, 0.5); cam(C, aim(C, [hk[0], hk[1] - 0.2, hk[2]], 0.0, -0.1, 54), 54, 0.03, 1.2 * Math.sin(ph * 0.5)); },
    // close: you holding her, she holding the dog
    hold: (t, s, k) => { const h = head(kid), u = SFY.u, r = [-u[1], u[0]], d = dr(t, 0.005, 0.3, 38), C = [h[0] + r[0] * 1.5 - u[0] * 0.2 + d[0], 1.05 + d[1], h[2] + r[1] * 1.5 - u[1] * 0.2]; clear(C, h, 0.6); cam(C, aim(C, h, 0.15, 0.05, 42), 42, 0.03); },
    // high, behind you two: west to the tornado (the map on the right)
    escape: (t, s, k) => { const y = SFY.at(s), p = SFN.at(s); cam([y.x + 30, 26 + 4 * k, y.z + 34], [p[0] + 160, 120, p[1] + 260], 56, 0.5); },
    everywhere: (t, s, k) => { const h = head(you), u = SFY.u, d = dr(t, 0.008, 0.4, 39), C = [h[0] - u[0] * 1.6 + u[1] * 0.9 + d[0], 1.2 + d[1], h[2] - u[1] * 1.6 - u[0] * 0.9]; clear(C, h, 0.55); cam(C, aim(C, h, -0.3, 0.05, 44), 44, 0.03); },
    // POV: turning round in the corn with the torch
    turn: (t, s, k) => { const y = SFY.at(s), h = head(kid), a = Math.atan2(SFY.u[0], SFY.u[1]) + Math.PI * 2 * MathX.smooth(k, 0, 1) * 0.85, f = fwd(a); set.cornOpt = { clear: [y.x, y.z, y.x + f[0] * 5, y.z + f[1] * 5, 0.3] }; cam([y.x + SFY.u[0] * 0.35, 1.1, y.z + SFY.u[1] * 0.35], [y.x + f[0] * 8, 1.2, y.z + f[1] * 8], 56, 0.03); void h; },
    // POV, low: west down the row; the last flash: the funnel over the corn
    question: (t, s, k) => { const y = SFY.at(s), p = SFN.at(s), b = sfBearing([y.x, y.z], p) * Math.PI / 180; set.cornOpt = { clear: [y.x, y.z, y.x + Math.sin(b) * 6, y.z - Math.cos(b) * 6, 0.3] }; cam([y.x + SFY.u[0] * 0.35, 1.15, y.z + SFY.u[1] * 0.35], [y.x + Math.sin(b) * 20, 3.5 + 1.5 * k, y.z - Math.cos(b) * 20], 60, 0.03); },
  };

  // ---- labels pinned to things: (t) → [{ p, text, sub, a, side }]
  const Lb = (p, text, sub, a = 1, side) => ({ p, text, sub, a, side });
  set.labels = (t) => {
    const s = set._s, m = set._mode, sh = FILM._shot, w = sh ? StoryHUD.win(t, sh.t0 + 0.5, sh.t1 - 0.2, 0.3, 0.2) : 0;
    if (!w) return [];
    const yh = head(you), dYou = (p) => Math.hypot(p[0] - yh[0], p[2] - yh[2]);
    if (m === 'echo') { const p = [F.barn.x - F.barn.w / 2, 3.5, F.barn.z + 2], d = dYou(p); return [Lb(p, 'THE BARN', `${Math.round(d)} m · ITS ECHO WAS ${(2 * d / SFP.c0).toFixed(2)} s LATE`, w)]; }
    if (m === 'train') { const q = SF_TRAIN.at(s); return [Lb([q[0], sfGroundY(q[0], q[1]) + 4.5, q[1]], 'A FREIGHT TRAIN', `${(dYou([q[0], 0, q[1]]) / 1000).toFixed(1)} km`, w)]; }
    if (m === 'hansen') { const q = Q.hansen; return [Lb([q[0] + 4, sfGroundY(...q) + 8.8, q[1] + 4.8], 'THE HANSENS’ DOGS', `${(dYou([q[0], 0, q[1]]) / 1000).toFixed(1)} km`, w)]; }
    if (m === 'sirens') { const T = set.town.tower; return [Lb(T, 'THE TOWN’S SIRENS', `${(dYou(T) / 1000).toFixed(1)} km`, w, 'l')]; }
    if (m === 'batsHit') return [Lb([F.windmill.x, 9.0, F.windmill.z], 'A BAT', 'FLEW STRAIGHT INTO IT', w * MathX.smooth(t, sh.t0 + 1.5, sh.t0 + 2.0))];
    if (m === 'funnel') { const p = SFN.at(s); return [Lb([p[0], 260, p[1]], 'THE TORNADO', `${(dYou([p[0], 0, p[1]]) / 1000).toFixed(1)} km · ${Math.round(SFP.tornadoV * 3.6)} km/h`, w)]; }
    if (m === 'yardDead') { const p = [F.yardLight.x, F.yardLight.h - 0.4, F.yardLight.z + 1.4], d = dYou(p); return [Lb(p, 'THE YARD LIGHT', `${Math.round(d)} m · THE BANG WAS ${(d / SFP.c0).toFixed(2)} s LATE · NOW 0`, w)]; }
    if (m === 'hansenHit') { const q = Q.hansen; return [Lb([q[0], sfGroundY(...q) + 40, q[1]], 'THE HANSEN FARM', `${(dYou([q[0], 0, q[1]]) / 1000).toFixed(1)} km`, w)]; }
    if (m === 'kidPhone') return [Lb(head(kid), 'HER', `${Math.round(dYou(head(kid)))} m AWAY`, w)];
    if (m === 'above') return [Lb(yh, 'YOU', 'YOUR TORCH', w)];
    return [];
  };
  // ---- the look: night (lifted, cool), a touch of flash bloom
  set.grade = (t, p, shot) => {
    const A = set._A || 0, m = shot.mode;
    p.exposure = 1.32 + (SF_POV.has(m) ? 0.1 : 0); p.saturation = 0.92; p.contrast = 1.08; p.warmth = -0.12; p.blackLift = 0.012; p.vignette = 0.6; p.soft = 0.06; p.bloom = 0.5; p.bloomThreshold = 0.85; p.grain = 0.03;
    if (m === 'title') { p.exposure = 1.38; p.saturation = 0.98; }
    p.exposure /= 1 + 0.35 * A;   // (a flash: the eye stops down, so it doesn't burn out)
  };
  return set;
}

// the camera shake: the boom at 8:52:00 (every thunder at once), lightning on the yard light, the near strike, the roar
function sfShake(s, t) {
  let a = 0;
  const hit = (s0, amp, dur) => { const u = s - s0; if (u > -0.02 && u < dur) a += amp * Math.exp(-u / (dur * 0.3)); };
  hit(0, 0.07, 2.0); hit(SFE.yardHit, 0.06, 1.6); hit(SF_STRIKES.find((k) => k.key === 'back').s, 0.035, 1.2); hit(SF_STRIKES.find((k) => k.key === 'flash3').s, 0.012, 0.8); hit(SF_STRIKES.find((k) => k.key === 'long').s, 0.02, 1.2);
  a += 0.006 * MathX.smooth(s, SFE.tornado, SFE.hansen + 20);
  return [noise1(t * 11, 71) * a, noise1(t * 13, 73) * a * 0.7, noise1(t * 12, 79) * a];
}

SF_SETS.farm = (app) => sfFarmSet(app);
