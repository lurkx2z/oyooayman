/* =====================================================================
   DECKSET — the car park's level 4 (and level 2, camera 7) as sets: the deck (deck.js), you and your late shadow, the
   guard and his torch, your car, the van, the parked cars, the lights; the camera of every shot; labels.
   THE TRICK: your body (drawn, casting nothing) is posed at story time s; an invisible copy of you (casting the
   shadow) is posed at s − 1. In your car, the copy sits in a "ghost car frame" placed where your seat was 1 s ago.
   In your own eyes (POV shots) your body is hidden from the camera (layer 1: the mirror still sees it); the copy still
   casts, and the hands are ViewerHands (no shadow: the copy's arms make it, a second late).
   ===================================================================== */

const SH_HAND_POSES = {
  // your right hand raised in front of you, palm toward the wall
  raise: { p: [0.13, 0.05, -0.42], F: [0.05, 1, -0.25], N: [0, 0.15, -1], curl: [0.06, 0.05, 0.08, 0.12], thumb: [0.7, 0.08] },
  // holding the phone up, filming (right); the left hand waving in front of the wall
  film: { p: [0.08, -0.15, -0.35], F: [-0.08, 1, -0.1], N: [0, 0.1, 1], curl: [0.08, 0.1, 0.12, 0.15], thumb: [0.55, 0.3] },
  wave: { p: [0.2, 0.06, -0.5], F: [0.1, 1, -0.2], N: [0, 0.2, -1], curl: [0.05, 0.05, 0.08, 0.1], thumb: [0.6, 0.1] },
  // the lock button on the door panel (in the car)
  press: { p: [0.05, -0.13, -0.36], F: [0.15, -0.5, -0.85], N: [0.1, -0.95, 0.25], curl: [0.05, 0.6, 0.75, 0.85], thumb: [0.4, 0.5] },
  wheel: { p: [0.17, -0.25, -0.42], F: [-0.25, 0.85, -0.45], N: [-0.9, 0.2, -0.3], curl: [0.9, 0.95, 1.0, 1.05], thumb: [0.8, 0.6] },
};
const SH_HAND_BL = { raise: 0.45, film: 0.6, wave: 0.2, press: 0.35, wheel: 0.6, hidden: 0.4 };

function shDeckSet(app, level) {
  const F = SH_F;
  const o = shSet(app, { sky: '#07080b', fog: 0.016, fogColor: '#0a0c10', fov: 50, near: 0.05, far: 1200, hemi: ['#3a4250', '#16140f', 0.06] });
  const { scene, camera } = o;
  shGradSky(scene, '#05060a', '#2a1c14', '#120c08', { hw: 0.18 });
  const deck = shBuildDeck(app, level);
  const set = { scene, camera, deck, level, _s: 0 };
  const lights = shDeckLights(scene, 6, 14);
  // the stairwell's tube, shining out of the open door (it casts: your shadow out across the deck)
  const stair = new THREE.SpotLight('#eef6ff', 0, 40, 0.62, 0.5, 1.6); stair.position.set(-42.4, 2.55, -8.2); stair.target.position.set(-30, 0, -8.0);
  stair.castShadow = true; stair.shadow.mapSize.set(1024, 1024); stair.shadow.camera.near = 0.3; stair.shadow.camera.far = 40; stair.shadow.bias = -0.0005; stair.shadow.normalBias = 0.02;
  scene.add(stair); scene.add(stair.target);
  const bounce = new THREE.PointLight('#fff2dc', 0, 6, 2); scene.add(bounce);
  const stairFill = new THREE.PointLight('#e8f2ff', 0, 8, 2); stairFill.position.set(-41.6, 2.4, -8.2); scene.add(stairFill);
  // the guard's torch (a narrow, bright cone; it casts), and its beam (a faint additive cone)
  const torch = new THREE.SpotLight('#fff6e6', 0, 32, 0.24, 0.55, 1.4); torch.castShadow = true; torch.shadow.mapSize.set(1024, 1024); torch.shadow.camera.near = 0.2; torch.shadow.camera.far = 32; torch.shadow.bias = -0.0006; torch.shadow.normalBias = 0.02;
  scene.add(torch); scene.add(torch.target);
  const beamM = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { a: { value: 0 } },
    vertexShader: 'varying float vV; varying vec3 vN, vP; void main(){ vV = uv.y; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vP = mv.xyz; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform float a; varying float vV; varying vec3 vN, vP; void main(){ float f = abs(dot(vN, normalize(-vP))); gl_FragColor = vec4(vec3(1.0, 0.96, 0.88) * a * pow(vV, 1.6) * f * f, 1.0); }' });
  const beamG = new THREE.ConeGeometry(1.6, 7, 24, 1, true); beamG.translate(0, -3.5, 0); beamG.rotateX(-Math.PI / 2);
  const beam = new THREE.Mesh(beamG, beamM); beam.renderOrder = 6; beam.frustumCulled = false; scene.add(beam);
  // ---- the cars: yours, the van, the parked ones
  const car = shBuildCar('#8a1f22'); scene.add(car.g);
  const van = shBuildVan(); scene.add(van.g); van.g.position.set(F.van.x, 0, F.van.z); van.g.rotation.y = F.van.yaw;
  for (const [x, z, yaw, c] of (level === 4 ? SH_PARKED : SH_PARKED2)) { const k = shBuildCar(c); k.g.position.set(x, 0, z); k.g.rotation.y = yaw; scene.add(k.g); }
  if (level !== 4) van.g.visible = false;
  // your car's headlights (no shadows) for the drive
  const headL = new THREE.SpotLight('#fff2dc', 0, 30, 0.5, 0.6, 1.6); headL.position.set(0, 0.66, 1.9); headL.target.position.set(0, 0.2, 9); car.g.add(headL); car.g.add(headL.target);
  // ---- the people
  const you = shNoShadow(shPerson('shYou', scene, { id: 'you' }));
  you.root.traverse((m) => m.layers.set(1));
  const late = shAsShadow(shPerson('shYou', scene, { id: 'late' }));
  const guard = shAllCast(shPerson('shGuard', scene, { id: 'guard' }));
  // the torch in his hand (a small cylinder)
  const torchBody = shCyl(0.03, 0.022, 0.24, shStd('#222428', 0.4, 0.6), 0, 0, 0, scene, 10); torchBody.castShadow = false;
  // the ghost car frame: where your seat was a second ago
  const ghost = new THREE.Group(); scene.add(ghost);
  const ghostSeat = new THREE.Object3D(); ghostSeat.position.set(SH_SEAT.x, SH_SEAT.y, SH_SEAT.z); ghost.add(ghostSeat);
  camera.layers.enable(0);
  // the mirror's cube camera sees your body (layer 1)
  if (deck.mirror) deck.mirror.cubeCam.children.forEach((c) => c.layers.enable(1));
  // ---- your hands (POV) and your phone (its screen: what its camera sees)
  const hands = new ViewerHands(camera, { script: { right: [[-9, 'hidden']], left: [[-9, 'hidden']] }, poses: SH_HAND_POSES, blends: SH_HAND_BL, skin: '#c4927a', nail: '#dfb8a6', sleeve: '#3d4a3c', cuff: '#2c362c', watch: false, sleeveLen: 0.4 });
  hands.root.traverse((m) => { if (m.isMesh) m.castShadow = false; });
  const phoneCam = new THREE.PerspectiveCamera(62, 9 / 16, 0.05, 80); scene.add(phoneCam);
  const phoneRT = new THREE.WebGLRenderTarget(324, 576, { samples: 0 });
  const phone = new THREE.Group();
  phone.add(new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.152, 0.0085), shStd('#1c1e22', 0.35, 0.4)));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.1446), new THREE.MeshBasicMaterial({ map: phoneRT.texture, color: new THREE.Color(2.2, 2.2, 2.2) })); scr.position.z = 0.0046; phone.add(scr);
  const rec = new THREE.Mesh(new THREE.CircleGeometry(0.0035, 12), new THREE.MeshBasicMaterial({ color: '#ff3020' })); rec.position.set(0.024, 0.062, 0.0049); phone.add(rec);
  phone.traverse((m) => { if (m.isMesh) m.castShadow = false; });
  // (held in front of your eyes, screen toward you: it rides with the camera; the right hand's 'film' pose sits behind it)
  camera.add(phone); phone.position.set(0.07, -0.045, -0.3); phone.rotation.set(0.1, -0.12, 0.04);

  // ---- helpers
  const P3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  const headAt = (st) => { const q = shYouPose(st); if (q.car) { const c = set.carAt(st); const v = new THREE.Vector3(SH_SEAT.x, 1.14, SH_SEAT.z).applyEuler(new THREE.Euler(c.pitch, c.yaw, 0, 'YXZ')); return [c.x + v.x, c.y + v.y, c.z + v.z]; } return [q.x, q.y + 1.63, q.z]; };
  set.carAt = (st) => (level === 4 ? SHC.l4(st) : SHC.l2(st));
  const placePerson = (P, st, inCarParent) => {
    const q = shYouPose(st);
    if (q.car) { if (P.root.parent !== inCarParent) inCarParent.add(P.root); P.root.position.set(0, 0, 0); P.root.rotation.set(0, 0, 0); P.apply(q.pose); return q; }
    if (P.root.parent !== scene) scene.add(P.root);
    // getting in: from the door towards the seat
    let x = q.x, y = q.y, z = q.z, yaw = q.yaw;
    if (q.getIn > 0) { const c = set.carAt(st), w = new THREE.Vector3(SH_SEAT.x, SH_SEAT.y, SH_SEAT.z).applyAxisAngle(new THREE.Vector3(0, 1, 0), c.yaw); x = MathX.lerp(x, c.x + w.x, q.getIn); z = MathX.lerp(z, c.z + w.z, q.getIn); y = MathX.lerp(y, SH_SEAT.y, q.getIn); yaw = MathX.lerp(yaw, c.yaw + 2 * Math.PI, q.getIn); }
    P.root.position.set(x, y + shFloorY(x, z), z); P.root.rotation.set(0, yaw, 0); P.apply(q.pose);
    return q;
  };
  const placeCar = (G, c) => { G.position.set(c.x, c.y, c.z); G.rotation.set(0, 0, 0); G.rotation.order = 'YXZ'; G.rotation.y = c.yaw; G.rotation.x = c.pitch; };   // (+x: the nose dips)
  // the camera rides with you (POV): your eye from the body pose
  const eye = (st, yawOff = 0, pitch = 0) => { const h = headAt(st), yaw = SHY.yaw(st) + yawOff; const d = shDir(yaw + Math.PI, pitch); return { p: h, at: [h[0] + d[0], h[1] + d[1], h[2] + d[2]] }; };

  set.frame = (t, shot) => {
    const s = shStoryAt(t), m = shot.mode, k = (t - shot.t0) / Math.max(1e-6, shot.t1 - shot.t0);
    set._s = s; set._mode = m;
    const lv = level;
    // lamps: on/off/flicker
    const lampOn = (i) => shLampOn(i, s, lv);
    for (const l of deck.lamps) { const on = lampOn(l.L.i); l.m.emissiveIntensity = 0.12 + 2.3 * on; l.m.color.setScalar(on > 0.5 ? 0.9 : 0.35); }
    // your car (level 4: parked → out → away → the ramp; level 2: passing camera 7)
    const c = set.carAt(s);
    placeCar(car.g, lv === 4 ? c : (s > 200 ? c : SHC.l2(s)));
    const cAgo = set.carAt(s - 1); placeCar(ghost, cAgo);
    const running = s >= SHE.engine;
    const ind = lv === 4 ? Math.max(shBump(s, SHE.lock, SHE.lock + 0.2, 0.03, 0.05), shBump(s, SHE.lock + 0.4, SHE.lock + 0.6, 0.03, 0.05)) : 0;   // (the lock: two flashes)
    car.setLights(running ? 1 : 0, running ? 1 : 0, ind); headL.intensity = running ? 26 : 0;
    car.door.rotation.y = -1.15 * shBump(s, SHE.atCar - 0.4, SHE.doorShut - 0.35, 0.35, 0.35);
    car.dome.intensity = lv === 4 ? 1.6 * shBump(s, SHE.atCar - 0.3, SHE.engine + 1.5, 0.2, 1.5) : 0;
    car.wheel.rotation.z = 0;
    // you, and your shadow a second ago (on level 2 you're only ever in the car)
    placePerson(you, s, car.seat); placePerson(late, s - 1, ghostSeat);
    const pov = /POV$/.test(m);
    // (in your own eyes the camera doesn't see your body: it's on layer 1, which the mirror's cube camera still sees)
    if (pov) camera.layers.disable(1); else camera.layers.enable(1);
    // the guard
    const gv = lv === 4 && SHG.visible(s);
    guard.root.visible = gv;
    if (gv) { const g = SHG.pos(s); guard.root.position.set(g[0], 0, g[1]); guard.root.rotation.set(0, SHG.yaw(s), 0); guard.apply(shGuardPose(s)); }
    // his torch: from his right hand toward its aim
    const tOn = gv ? SHG.torch(s) : 0;
    torch.intensity = 140 * tOn; torch.visible = true; shShadowOn(torch, tOn > 0);
    if (gv) {
      guard.root.updateMatrixWorld(true);
      const hand = guard.j && guard.j.ra ? guard.j.ra.el : guard.root; const hp = new THREE.Vector3(0, -0.28, 0.06); hand.localToWorld(hp);
      const aim = SHG.aim(s); torch.position.copy(hp); torch.target.position.set(aim[0], aim[1], aim[2]); torch.target.updateMatrixWorld();
      torchBody.position.copy(hp); torchBody.lookAt(aim[0], aim[1], aim[2]); torchBody.rotateX(Math.PI / 2); torchBody.visible = true;
      beam.visible = tOn > 0; beam.position.copy(hp); beam.lookAt(aim[0], aim[1], aim[2]); beam.rotateY(Math.PI); const dist = Math.min(14, hp.distanceTo(P3(aim)));
      beam.scale.set(dist / 7 * 0.9, dist / 7 * 0.9, dist / 7); beamM.uniforms.a.value = 0.11 * tOn;
    } else { torchBody.visible = false; beam.visible = false; }
    // the stairwell's light (the door is open from the start until it swings shut behind you)
    const doorOpen = lv === 4 ? MathX.smooth(s, -3.0, -2.3) * (1 - MathX.smooth(s, 3.2, 4.4)) + (s > SHE.guardIn - 0.4 ? shBump(s, SHE.guardIn, SHE.guardIn + 2.2, 0.4, 1.0) : 0) : 0;
    deck.door.rotation.y = 1.62 * doorOpen;
    stair.intensity = lv === 4 ? 70 * MathX.clamp(doorOpen * 1.6, 0, 1) : 0; shShadowOn(stair, stair.intensity > 0); stairFill.intensity = lv === 4 ? 3.5 : 0;
    // the lamps' real lights near the action (focus per shot)
    const foc = set.focus(m, s);
    lights.place(deck, foc, lampOn, { I: m === 'top' ? 34 : 26, max: m === 'top' ? 4 : 6, fill: m === 'top' ? 0.12 : m === 'ramp' ? 0.3 : 0.55 });
    // on the ramp, the last three of the pool's casting lights are its wall bulkheads (they throw the car's shadow, and
    // yours, onto the south wall)
    if (lv === 4 && deck.rampLamps && (m === 'ramp' || (m === 'drive' && SHC.l4(s).x > 28))) deck.rampLamps.forEach((q, i) => {
      const L = lights.spots[3 + i]; shShadowOn(L, true); L.angle = 0.62; L.position.set(q[0], q[1], q[2]); L.target.position.set(q[0] + 0.4, q[1] - 1.2, -4.8); L.intensity = 90; });
    // the torch's light thrown back off the van and the floor: a soft fill on the guard while it's on you
    bounce.intensity = gv ? 2.2 * MathX.smooth(s, SHE.torchOn - 0.3, SHE.torchOn + 0.4) : 0;
    if (gv) { const g = SHG.pos(s); bounce.position.set(g[0] + 1.4, 1.5, g[1] + 1.2); }
    // ---- the camera
    hands.root.visible = false; phone.visible = false;
    if (set.cams[m]) set.cams[m](t, s, k, shot); else shCam(camera, [0, 1.6, -8.2], [10, 1, -8.2], 50);
    // the mirror's reflection: only when it's in view
    if (deck.mirror) { const mv = m === 'mirrorPOV' || m === 'mirrorOTS'; deck.mirror.dome.visible = true; set._mirrorLive = mv; }
    set._phoneLive = phone.visible;
  };
  // where the lights gather (each shot's action)
  set.focus = (m, s) => {
    if (level !== 4) { const c = SHC.l2(s); return [c.x - 2, c.z - 3]; }
    if (m === 'midnight') return [-6, -10];
    if (/^(torch|guard|guardFace|backAway|moving|still|hide|peek)/.test(m)) return [-1.5, -6.5];
    if (m === 'drive') { const c = SHC.l4(s - 1); return [c.x, c.z]; }   // (the lamps over the seat your shadow is still in)
    if (/^(lockPOV|lockOut|reverse|ramp)/.test(m)) { const c = SHC.l4(s); return [c.x - 1, c.z]; }
    const p = shYouPose(s); if (p.car) { const c = SHC.l4(s); return [c.x, c.z]; }
    return [p.x, p.z];
  };
  // the cameras: mode → (t, s, k, shot) → shCam(...)
  const Y = SHY, E = SHE;
  set.cams = {
    door: (t, s, k) => { const d = shDrift(t, 0.02, 0.3, 3); shCam(camera, [-29.6 - 1.2 * k + d[0], 1.22 + d[1], -9.2 + d[2]], [-38.4, 1.05, -8.2], 40); },
    overview: (t, s, k) => shCam(camera, [-21.8, 2.32, -11.0], [-31.0 - 0.8 * k, 0.4, -6.4], 54),
    aislePOV: (t, s, k) => { const h = headAt(s); shCam(camera, [h[0] + 0.15 * k, h[1] - 0.02, h[2]], [h[0] + 30, 0.9, -8.6], 46); },
    lampPOV: (t, s, k) => { const h = headAt(s); const up = MathX.smooth(k, 0.0, 0.25) * (1 - MathX.smooth(k, 0.62, 0.95)); shCam(camera, h, [-32.4, MathX.lerp(-0.2, 2.7, up), MathX.lerp(-7.0, -8.2, up)], 58); },
    floorSide: (t, s, k) => shCam(camera, [-27.6 - 0.6 * k, 0.55, -10.6], [-32.0, 0.95, -5.6], 44),
    handPOV: (t, s, k) => { const h = headAt(s); shCam(camera, [h[0], h[1], h[2]], [h[0] - 0.05, 1.2, -5.0], 64);
      hands.root.visible = true; hands.o.script = { right: [[-9, 'hidden'], [shFilmAt(E.hand), 'raise'], [shFilmAt(E.handDown), 'hidden']], left: [[-9, 'hidden']] }; hands.update(t); },
    phonePOV: (t, s, k) => { const h = headAt(s); shCam(camera, [h[0], h[1], h[2]], [h[0] + 0.05, 1.15, -5.0], 60);
      hands.root.visible = true; phone.visible = true;
      hands.o.script = { right: [[-9, 'hidden'], [shFilmAt(E.phone), 'film'], [shFilmAt(E.phoneDown), 'hidden']], left: [[-9, 'hidden'], [shFilmAt(E.wave) - 0.3, 'wave'], [shFilmAt(E.wave + 1.6), 'hidden']] };
      hands.update(t);
      if (hands.left && hands.left.g) hands.left.g.rotation.z += 0.0;   // (the wave: the hand's own blend)
      phone.updateMatrixWorld(true); const pw = new THREE.Vector3(); phone.getWorldPosition(pw); phoneCam.position.copy(pw); phoneCam.lookAt(pw.x, 1.05, -5.0); phoneCam.updateMatrixWorld(); },
    walkSide: (t, s, k) => { const p = Y.pos(s); shCam(camera, [p[0] - 0.4, 1.32, -10.6], [p[0] - 0.9, 0.95, -5.2], 46); },
    stop: (t, s, k) => shCam(camera, [SHY.stopX - 3.0, 0.5, -9.4], [SHY.stopX - 0.2, 0.75, -5.4], 44),
    turn: (t, s, k) => shCam(camera, [SHY.stopX + 0.2, 1.42, -10.0], [SHY.stopX - 0.3, 1.15, -5.2], 40),
    jump: (t, s, k) => shCam(camera, [SHY.stopX + 1.6, 0.45, -9.6], [SHY.stopX - 0.3, 1.1, -5.0], 52),
    mirrorPOV: (t, s, k) => { const h = headAt(s); shCam(camera, h, [-7.65, 1.95, -4.85], 34 - 6 * k); },
    mirrorOTS: (t, s, k) => { const h = headAt(s); shCam(camera, [h[0] - 0.55, h[1] + 0.12, h[2] - 0.45], [-7.65, 1.98, -4.86], 22); },
    top: (t, s, k) => { const p = Y.pos(s); shCam(camera, [p[0] - 1.15, 2.84, p[1] + 0.45], [p[0] - 0.05, 0, p[1] - 0.15], 82); },
    // after midnight: from above and behind you at the parapet, your fewer, darker shadows on the floor
    darker: (t, s, k) => { const p = Y.pos(s); shCam(camera, [p[0] + 1.9, 2.45, p[1] + 3.4], [p[0] - 0.2, 0.0, p[1] + 0.6], 58); },
    parapetWalk: (t, s, k) => { const p = Y.pos(s); shCam(camera, [p[0] + 1.6, 1.15, p[1] + 3.6], [p[0] - 0.3, 0.5, p[1] - 2.0], 52); },
    town: (t, s, k) => shCam(camera, [0.9, 1.85, -13.2 + 0.3 * k], [-6, -3.0, -45], 48),
    outside: (t, s, k) => shCam(camera, [-12 + 3 * k, -6.5, -46], [-1.2, 1.2, -16.0], 30),
    midnight: (t, s, k) => shCam(camera, [33.5, 1.75, -9.6], [-30, 0.8, -8.0], 38),
    stepsPOV: (t, s, k) => { const h = headAt(s); const yaw = SHY.yaw(s); const d = shDir(yaw + Math.PI, -0.04); shCam(camera, h, [h[0] + d[0] * 10, h[1] + d[1] * 10, h[2] + d[2] * 10], 50); },
    hide: (t, s, k) => shCam(camera, [-3.6, 2.32, -11.4], [1.0, 0.0, -5.6], 52),
    still: (t, s, k) => shCam(camera, [2.6, 0.42, -6.6], [0.75, 0.35, -4.5], 48),
    moving: (t, s, k) => shCam(camera, [1.9, 0.9, -4.0], [-2.4, 0.0, -8.2], 50),
    guard: (t, s, k) => shCam(camera, [0.95, 1.58, -5.55], [-2.6, 1.0, -8.2], 46),
    torch: (t, s, k) => shCam(camera, [-4.3, 1.78, -9.6], [1.4, 1.1, -4.0], 40),
    guardFace: (t, s, k) => { const g = SHG.pos(s); shCam(camera, [-0.8, 1.55, -6.4], [g[0], 1.6, g[1]], 30); },
    backAway: (t, s, k) => shCam(camera, [3.2, 1.5, -5.9], [-6.0, 1.1, -8.6], 42),
    runStart: (t, s, k) => shCam(camera, [-4.6, 2.32, -11.2], [5.0, 0.0, -6.8], 56),
    runSide: (t, s, k) => { const p = Y.pos(s); shCam(camera, [p[0] - 1.6, 1.05, -11.3], [p[0] - 0.4, 0.8, -7.6], 52); },
    lockPOV: (t, s, k) => { const c = SHC.l4(s); const q = new THREE.Vector3(SH_SEAT.x, 1.12, SH_SEAT.z).applyAxisAngle(new THREE.Vector3(0, 1, 0), c.yaw); const h = [c.x + q.x, c.y + q.y, c.z + q.z];
      car.g.updateMatrixWorld(true); const kn = new THREE.Vector3(-0.64, 1.04, -0.05); car.g.localToWorld(kn);
      shCam(camera, h, [MathX.lerp(kn.x, h[0], -0.6), MathX.lerp(kn.y, h[1], -0.6) + 0.15, MathX.lerp(kn.z, h[2], -0.6)], 62);
      hands.root.visible = true; hands.o.script = { right: [[-9, 'hidden'], [shFilmAt(E.lock - 0.45), 'press'], [shFilmAt(E.lock + 0.5), 'wheel']], left: [[-9, 'wheel']] }; hands.update(t); },
    // outside your car as the door shuts and it locks (you inside, on time; your shadow getting in a second late)
    lockOut: (t, s, k) => { const d = shDrift(t, 0.012, 0.3, 9); shCam(camera, [F.car.x + 2.9 + d[0], 1.25 + d[1], -12.0 + d[2]], [F.car.x + 0.4, 0.95, -14.5], 46); },
    reverse: (t, s, k) => { const c = SHC.l4(s); shCam(camera, [F.car.x + 3.0, 2.6, -8.4], [MathX.lerp(c.x, F.car.x - 2.4, 0.5), 0.0, c.z + 0.6], 58); },
    // high behind: the car pulling away, and on the floor between you and it, a seated shadow with no car round it
    drive: (t, s, k) => { const g = SHC.l4(s - 1); const x = MathX.clamp(g.x, 24, 29); shCam(camera, [x - 3.4, 2.32, -5.4], [x + 0.6, 0, -8.6], 62); },
    ramp: (t, s, k) => shCam(camera, [44.2, 0.05, -11.15], [40.6, -0.95, -4.8], 66),
    cctv: (t, s, k) => shCam(camera, [-6.85, 2.3, -5.35], [-26, 0.2, -7.6], 58),
  };
  // labels pinned to places (HUD)
  set.labels = (t) => {
    const s = set._s, m = set._mode, out = [], lab = (p, text, sub, a = 1, side) => out.push({ p, text, sub, a, side });
    const p = shYouPose(s), q = shYouPose(s - 1);
    if (m === 'walkSide' || m === 'runStart' || m === 'hide') { lab([p.x, 1.95, p.z], 'YOU', 'NOW', shWin(t, set._shot0 + 0.6, 1e9, 0.4, 0.3)); lab([q.x, 0.15, q.z], 'YOUR SHADOW', 'WHERE YOU WERE 1 s AGO', shWin(t, set._shot0 + 1.2, 1e9, 0.4, 0.3), 'r'); }
    if (m === 'top' && !p.car && t < shE('lamps') + 0.5) {
      // each lamp's shadow (of you a second ago) runs out from your feet away from its lamp: a number along each
      const A = lights.spots.filter((L) => L.intensity > 0.1);
      A.forEach((L, i) => { const dx = q.x - L.position.x, dz = q.z - L.position.z, d = Math.hypot(dx, dz) || 1; lab([q.x + dx / d * 1.5, 0.02, q.z + dz / d * 1.5], String(i + 1), '', shWin(t, shC('lamps', 0) + 0.3 * i, shE('lamps') + 0.3, 0.3, 0.3)); });
    }
    if (m === 'parapetWalk' && !p.car) {
      lab([p.x, 0.02, p.z + 0.9], 'LIT', 'SHOULD BE YOUR SHADOW', shWin(t, shC('impossible', 1) - 0.2, 1e9, 0.4, 0.3), 'r');
      lab([q.x, 0.02, q.z], 'DARK', 'NOTHING THERE TO BLOCK THE LIGHT', shWin(t, shC('impossible', 2) - 0.2, 1e9, 0.4, 0.3));
    }
    if (m === 'drive' || m === 'cctv') {
      const c = set.carAt(s), ca = set.carAt(s - 1), lead = new THREE.Vector3(SH_SEAT.x, 1.0, SH_SEAT.z).applyAxisAngle(new THREE.Vector3(0, 1, 0), ca.yaw);
      // (on the floor, where the lamp over the way out throws your head's shadow)
      if (m === 'drive') { const Lx = 25.2, Ly = SH_F.lampY, Lz = -8.2, hx = ca.x + lead.x, hy = 1.2, hz = ca.z + lead.z, f = Ly / (Ly - hy);
        lab([Lx + (hx - Lx) * f, 0.05, Lz + (hz - Lz) * f], 'YOU', '1 SECOND AGO', shWin(t, shC('car', 1) - 0.2, 1e9, 0.4, 0.3), 'r'); }
      void c;
    }
    return out;
  };
  // the shot's start (for label timing) and the per-shot grade
  set.grade = (t, p, shot) => {
    set._shot0 = shot.t0;
    p.exposure = 1.55; p.saturation = 0.86; p.contrast = 1.12; p.warmth = -0.06; p.blackLift = 0.004; p.vignette = 0.62; p.bloom = 0.5; p.bloomThreshold = 0.82; p.grain = 0.034;
    if (shot.mode === 'cctv') { p.saturation = 0.0; p.contrast = 1.25; p.grain = 0.11; p.vignette = 0.8; p.exposure = 1.35; p.bloom = 0.7; }
    if (shot.mode === 'outside' || shot.mode === 'town') { p.saturation = 0.95; p.warmth = 0.02; }
  };
  // before the frame is drawn: the mirror's cube map, the phone's screen
  set.prerender = (app2) => {
    const R = app2.renderer;
    // (the shadow maps are drawn once for the cube's first face and reused by the other five)
    if (set._mirrorLive && deck.mirror) { deck.mirror.dome.visible = false; R.shadowMap.autoUpdate = false; R.shadowMap.needsUpdate = true; deck.mirror.cubeCam.update(R, scene); R.shadowMap.autoUpdate = true; deck.mirror.dome.visible = true; }
    if (set._phoneLive) { phone.visible = false; hands.root.visible = false; const old = R.getRenderTarget(); R.setRenderTarget(phoneRT); R.render(scene, phoneCam); R.setRenderTarget(old); phone.visible = true; hands.root.visible = true; }
  };
  return set;
}

SH_SETS.deck = (app) => shDeckSet(app, 4);
SH_SETS.deck2 = (app) => shDeckSet(app, 2);
