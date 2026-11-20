/* =====================================================================
   WORLD — the one set: the shrinking world (EK_W: everything except you, in its own metres, scaled by s round P)
   and you (your frame: you never shrink). frame(t, shot) sets s from the story clock, the Sun from the real dawn,
   the sky from the air left above your eyes, and the shot's camera, people and props (EK_MODES).
   Your frame: x east, y up, z south, P (the tent) at the origin; you stand on P facing east (the sunrise).
   ===================================================================== */

// ViewerHands poses for this film (camera space, the right hand; the left is mirrored)
const EK_HAND_POSES = {
  palmUp: { p: [0.03, -0.115, -0.37], F: [-0.32, 0.12, -1], N: [0.05, 1, 0.12], curl: [0.22, 0.26, 0.32, 0.4], thumb: [0.62, 0.12] },
  palmNear: { p: [0.02, -0.075, -0.27], F: [-0.35, 0.1, -1], N: [0.05, 1, 0.1], curl: [0.22, 0.26, 0.32, 0.4], thumb: [0.62, 0.12] },
  palmLow: { p: [0.06, -0.17, -0.42], F: [-0.3, 0.05, -1], N: [0.05, 1, 0.1], curl: [0.2, 0.24, 0.3, 0.38], thumb: [0.6, 0.12] },
  scoop: { p: [0.04, -0.24, -0.5], F: [-0.15, -0.25, -1], N: [0.0, 1, 0.25], curl: [0.1, 0.12, 0.16, 0.2], thumb: [0.5, 0.1] },
  pushUp: { p: [0.17, -0.06, -0.33], F: [0, 1, 0.1], N: [0, -0.1, -1], curl: [0.12, 0.12, 0.16, 0.2], thumb: [0.55, 0.05] },
  flat: { p: [0.05, -0.1, -0.44], F: [-0.1, 0.85, -0.53], N: [0, -0.53, -0.85], curl: [0.06, 0.05, 0.08, 0.12], thumb: [0.42, 0.18] },
  grip: { p: [0.3, -0.25, -0.8], F: [-0.15, -0.2, -1], N: [-0.3, -1, 0.2], curl: [1.1, 1.2, 1.25, 1.3], thumb: [0.35, 0.85] },
  hug: { p: [0.26, -0.2, -0.36], F: [-0.7, 0.1, -0.7], N: [-0.7, 0, 0.7], curl: [0.35, 0.4, 0.45, 0.5], thumb: [0.5, 0.2] },
  ball: { p: [0.12, -0.13, -0.38], F: [-0.35, 0.55, -0.75], N: [-1, 0.15, -0.1], curl: [0.42, 0.48, 0.52, 0.58], thumb: [0.5, 0.25] },
  cup: { p: [0.07, -0.17, -0.34], F: [-0.62, 0.25, -0.75], N: [-0.35, 1, 0], curl: [0.5, 0.55, 0.6, 0.65], thumb: [0.55, 0.3] },
};
const EK_HAND_BLEND = { palmUp: 0.6, palmNear: 0.8, palmLow: 0.5, scoop: 0.6, pushUp: 0.35, flat: 0.7, grip: 0.6, hug: 0.8, ball: 0.8, cup: 0.8 };
// (the hand keyframes are built from the shots, below: EK_HANDS)
const EK_HANDS = { right: [[-5, 'hidden']], left: [[-5, 'hidden']] };

// where Leo is in the world (world metres; story time τ): asleep in his bag; crawling out of the door; standing out
// in front of you (he steps back as the ground pulls him in: he stays ~3 m out, 1 m in your frame at first)
const EK_LEO = { bag: [-0.3, 0.42], door: [1.05, -0.38], out: [2.9, -0.95] };
const EK_PALM = new THREE.Vector3(0, 0.058, 0.022);   // where he stands on your palm (the right hand's frame)

const ekDirAz = (az, el) => { const a = az * Math.PI / 180, e = el * Math.PI / 180; return [Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)]; };
const ekAt = (p, az, el, d = 10) => { const v = ekDirAz(az, el); return [p[0] + v[0] * d, p[1] + v[1] * d, p[2] + v[2] * d]; };
// a world point (metres; y = height above the meadow at x, z unless given) in your frame at scale s
const ekWP = (x, z, s, dy = 0, y = null) => { const p = ekSphere(x, z, (y == null ? ekGroundY(x, z) : y) + dy); return [p[0] * s, p[1] * s, p[2] * s]; };

EK_SETS.world = (app) => {
  const S = ekSet(app, { sky: '#000000', fov: 50, near: 0.03, far: 5e6, sun: [0, -0.01, -1], sunColor: '#ffffff', sunI: 3.2, shadow: 2048, hemi: ['#a6b8dc', '#3a3632', 0.85] });
  const scene = S.scene, cam = S.camera, sun = S.sun, hemi = S.hemi;
  sun.castShadow = false;
  // ---- the world
  const W = new THREE.Group(); W.name = 'world'; scene.add(W);
  ekHorizonMap();
  const globe = ekGlobe(W, app);                    // (first: it samples the Earth's texture for the land's far edge)
  const terrain = ekTerrain(W), lake = ekLake(W), forest = ekForest(W), road = ekRoad(W);
  const grass = ekGrass(W), grassFar = ekGrassAt(W, 1150, -160, 7, 9000);
  const tent = ekTent(W), X = ekCampProps(W), air = ekAirliner(W);
  // Leo: in the world (asleep in his red bag, then out), and a twin on your palm (your frame's light)
  const leoW = ekPerson('ekLeo', W, { kid: true }); leoW.root.scale.setScalar(0.66); ekWorldify(leoW.root, 'world');
  const bag = new THREE.Mesh(ekLoft([[0, 0.1, 0, 0.13, 0.08], [0.3, 0.12, 0, 0.2, 0.12], [0.75, 0.12, 0, 0.21, 0.13], [1.12, 0.1, 0, 0.14, 0.09], [1.3, 0.08, 0, 0.08, 0.06]], 12, 0.6), ekStd('#9a1e22', 0.75));
  const bagG = new THREE.Group(); bagG.add(bag); W.add(bagG); ekWorldify(bagG, 'world');
  const nbs = [ekPerson('ekNb1', W, { id: 'a' }), ekPerson('ekNb2', W, { id: 'b' })]; nbs.forEach((p) => ekWorldify(p.root, 'world'));
  // ---- you
  const you = ekPerson('ekYou', scene, { bodyScale: 1.01 });
  you.root.traverse((o) => { if (o.isMesh) o.material = Array.isArray(o.material) ? o.material.map((m) => m.clone()) : o.material.clone(); });   // (one material per part: see youHide)
  ekWorldify(you.root, 'you');
  you.root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  // (in your own view your body is not drawn, but it still casts its shadow: its own materials, colour and depth off;
  // the legs can stay, for a look down at your boots)
  const youLegs = new Set(); [you.j.ll.hp, you.j.rl.hp].forEach((j) => j.traverse((o) => { if (o.isMesh) youLegs.add(o); }));
  let youHid = null;
  const youHide = (hide, legs) => {
    const key = hide + '|' + legs; if (key === youHid) return; youHid = key;
    you.root.traverse((o) => { if (!o.isMesh) return; const h = hide && !(legs && youLegs.has(o)); for (const m of [].concat(o.material)) { m.colorWrite = !h; m.depthWrite = !h; } });
  };
  const hands = new ViewerHands(cam, { script: EK_HANDS, poses: EK_HAND_POSES, blends: EK_HAND_BLEND, skin: '#d4a184', sleeve: '#3e4a58', cuff: '#2c343e', watch: true, sleeveLen: 0.8 });
  ekWorldify(hands.root, 'you');
  const leoH = ekPerson('ekLeo', hands.right.g, { kid: true, id: 'h' }); ekWorldify(leoH.root, 'you');
  // a fingertip in the world (for the close look when he climbs off it): skin with the ridges of a fingerprint
  const tip = ekFingertip(scene);
  // the sky, the stars; soft particles (the fire's smoke, the contrail, the dust when your boots come down)
  const sky = ekSky(scene), stars = ekStars(scene), puffs = ekPuffs(scene, 3000, { soft: 1.4 });
  EK_U.uHor.value = EK_U.uHor.value;
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  const set = { scene, camera: cam, W, globe, terrain, lake, forest, grass, tent, X, air, leoW, leoH, nbs, you, hands, tip, sky, stars, puffs, labels: [], cams: EK_MODES };

  const gHid = [], patch0 = globe.U.uPatch.value;
  set.frame = (t, shot, app) => {
    const tau = ekStoryAt(t), s = EKP.sAt(tau), dt = t - shot.t0, u = MathX.clamp(dt / Math.max(0.01, shot.t1 - shot.t0), 0, 1);
    if (gHid.length) { for (const c of gHid) c.visible = true; gHid.length = 0; globe.U.uPatch.value = patch0; }
    W.scale.setScalar(s); W.updateMatrixWorld(true);
    EK_U.uS.value = s;
    // the Sun (geometric; the shader adds the refraction); its light comes from there
    const sp = ekSunAt(Math.max(0, tau)), sd = ekDirAltAz(sp.alt, sp.az);
    EK_U.uSunW.value.set(sd[0], sd[1], sd[2]);
    // the mode: camera, people, props
    const M = (EK_MODES[shot.mode] || EK_MODES.campPan)({ t, tau, s, u, dt, shot, set, D: shot.t1 - shot.t0 });
    // camera
    const c = M.cam;
    cam.near = c.near ?? 0.03; cam.far = c.far ?? 5e6; cam.fov = c.fov ?? 50;
    ekCam(cam, c.p, c.at, cam.fov, c.roll || 0);
    if (c.shake) { const a = c.shake; cam.position.x += noise1(t * 11, 3) * a; cam.position.y += noise1(t * 13, 5) * a; cam.rotateZ(noise1(t * 9, 7) * (c.shakeRot ?? a * 0.6)); if (c.shakeRot) cam.rotateX(noise1(t * 7.3, 9) * c.shakeRot * 0.7); cam.updateMatrixWorld(true); }
    cam.updateProjectionMatrix();
    // your eye in the world's metres, its height, the air above it
    const eW = [cam.position.x / s, cam.position.y / s, cam.position.z / s];
    EK_U.uEyeW.value.set(eW[0], eW[1], eW[2]);
    const eyeH = Math.hypot(eW[0], eW[1] + EK_RM, eW[2]) - EK_RM; EK_U.uEyeH.value = eyeH;
    const airK = Math.exp(-Math.max(0, eyeH) / EK_HS);
    // the dawn's brightness (slowly up as the Sun nears the horizon) and the skylight
    const dawn = 0.82 + 0.25 * ekSmooth(-1.2, 0.6, sp.alt);
    { const ap = ekDirAltAz(EKP.refr(sp.alt), sp.az); sky.U.uSun.value.set(ap[0], ap[1], ap[2]); }  /* (the disc where you see it: lifted by refraction) */ sky.U.uAir.value = airK; sky.U.uDip.value = Math.acos(EK_RM / (EK_RM + Math.max(0, eyeH))); sky.U.uDawn.value = dawn;
    stars.U.uK.value = ekSmooth(0.05, 0.004, airK) * (M.stars ?? 1);
    { const hz = ekSkyRGB(0.02, -1, dawn, 1), hs = ekSkyRGB(0.02, 1, dawn, 1); EK_U.uHazeA.value.setRGB(hz[0] * 0.9, hz[1] * 0.92, hz[2]); EK_U.uHazeB.value.setRGB(hs[0], hs[1], hs[2]);
      const top = ekSkyRGB(0.6, 0, dawn, 1); EK_LAKE_U.uSkyHor.value.setRGB(hz[0], hz[1], hz[2]); EK_LAKE_U.uSkyTop.value.setRGB(top[0], top[1], top[2]); }
    EK_U.uSkyK.value = dawn; EK_U.uSunK.value = 1;
    // your sunlight: the Sun as your eye sees it (lit once it clears the skyline), white above the air
    { const clear = EKP.sunClear(Math.max(0, tau), cam.position.y > 0.6 ? cam.position.y : EKP.you.eye), lit = ekSmooth(-0.3, 0.25, clear);
      const app = EKP.refr(sp.alt), col = ekSunColor(Math.max(app, 0.1), eyeH);
      EK_YU.uYouSun.value.setRGB(col[0] * lit, col[1] * lit, col[2] * lit);
      EK_YU.uYouSky.value = dawn * (0.12 + 0.88 * MathX.clamp(airK * 3, 0, 1)) * (M.youSky ?? 1);
      sky.U.uSunUp.value = 1; }
    hemi.intensity = 1.05;
    // the Sun's light and its shadow (only where a shot needs one: the camp is in the mountains' shadow anyway)
    const shc = M.shadow;
    sun.castShadow = !!shc;
    if (shc) {
      const C = shc.c, R = shc.R; sun.target.position.set(C[0], C[1], C[2]); sun.position.set(C[0] + sd[0] * R * 4, C[1] + sd[1] * R * 4, C[2] + sd[2] * R * 4);
      const sc = sun.shadow.camera; sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.near = R * 0.5; sc.far = R * 9; sc.updateProjectionMatrix();
      sun.shadow.bias = shc.bias ?? -0.0005; sun.shadow.normalBias = shc.nb ?? 0.02 * R / 10;
    } else { sun.position.set(sd[0] * 100, sd[1] * 100, sd[2] * 100); sun.target.position.set(0, 0, 0); }
    sun.target.updateMatrixWorld();
    // the world's things: the globe's patch, the clouds and the air seen from above
    globe.atmo.material.uniforms.uK.value = ekSmooth(0.02, 0.0005, airK);
    // the lantern's and the van lamp's glow keep their surface brightness (emissive), nothing to scale
    // ---- you: shown in third-person shots; in your own view only from the neck down
    const yv = M.you || {};
    you.root.visible = yv.show !== false;
    if (you.root.visible) {
      const pose = yv.pose || EK_P_.stand(dt);
      you.root.position.set(...(yv.pos || [0, 0, 0])); you.root.rotation.order = 'YXZ'; you.root.rotation.set(yv.lay || 0, yv.yaw ?? Math.PI / 2, yv.roll || 0);
      you.apply(pose);
      const pov = !!yv.pov;
      const cast = !pov || !!yv.castAll;   // (castAll: in your view, your head and arms still cast their shadow)
      you.j.head.visible = cast; you.j.la.sh.visible = cast; you.j.ra.sh.visible = cast;
      youHide(pov, !!yv.legs);
      you.root.updateMatrixWorld(true);
    }
    hands.update(t);
    hands.root.visible = !!M.hands;
    // ---- Leo
    const lv = M.leo || {};
    leoW.root.visible = lv.where === 'world'; leoH.root.visible = lv.where === 'hand'; bagG.visible = !!lv.bag;
    if (lv.where === 'world') {
      const [lx, lz] = lv.xz, p = ekSphere(lx, lz, ekGroundY(lx, lz) + (lv.dy || 0));
      ekPlace(leoW, p[0], p[1], p[2], lv.yaw ?? -Math.PI / 2, lv.pose || EK_P_.stand(dt, 4), lv.lay || 0);
      if (lv.lay) leoW.root.rotation.z = lv.roll || 0;
    }
    if (lv.where === 'hand') {
      leoH.root.position.copy(EK_PALM); leoH.root.rotation.order = 'YXZ'; leoH.root.rotation.set(Math.PI / 2, 0, 0); leoH.root.rotateY(lv.yaw ?? 0);
      leoH.root.scale.setScalar(0.66 * s); leoH.apply(lv.pose || EK_P_.stand(dt, 4));
    }
    if (c.atLeo && lv.where === 'world') { leoW.root.updateMatrixWorld(true); leoW.j.head.getWorldPosition(tmp); ekCam(cam, c.p, [tmp.x + (c.atLeo[0] || 0), tmp.y + (c.atLeo[1] || 0), tmp.z + (c.atLeo[2] || 0)], cam.fov, c.roll || 0); cam.updateProjectionMatrix(); }
    if (lv.bag) { const p = ekSphere(EK_LEO.bag[0], EK_LEO.bag[1], 0.0); bagG.position.set(p[0] - 0.55, p[1] + 0.02, p[2]); bagG.rotation.set(0, 0, 0); }
    // ---- the neighbours
    const nv = M.nb;
    nbs.forEach((p, i) => { p.root.visible = !!nv; if (!nv) return; const [x, z] = EK_F.vanPeople[i]; ekPlace(p, x, ekGroundY(x, z), z, nv.yaw ? nv.yaw[i] : -Math.PI / 2 + 0.2 * i, (nv.pose || EK_P_.scream)(dt + i * 0.37, i)); });
    // ---- the tent: the rip, and its fabric pushed out by your body
    const tv = M.tent || {};
    tent.TU.uRip.value = tv.rip || 0;
    tent.TU.uGlow.value.setRGB(0.95 * dawn, 0.5 * dawn, 0.24 * dawn);
    if (tv.wrap) ekTentWrap(tent, s, tv.wrap); else if (tent._wrapped) ekTentReset(tent);
    tent._wrapped = !!tv.wrap;
    // ---- the airliner (11 km up, westbound) and its contrail
    air.g.visible = !!M.plane;
    if (M.plane) { const q = M.plane; air.g.position.set(...(q.pw || q.p)); /* (pw: the world's own metres; p: yours, for the contrail) */ air.g.rotation.set(0, q.yaw, 0); air.strobe.material.emissiveIntensity = (Math.floor(t * 1.1) % 1 === 0 && (t * 1.1) % 1 < 0.06) ? 8 : 0; }
    // ---- the fingertip (in your frame)
    tip.g.visible = !!M.tip; if (M.tip) { tip.g.position.set(...M.tip.p); tip.g.rotation.set(0, M.tip.yaw || 0, 0); }
    // ---- particles: the fire's smoke, the contrail
    puffs.begin();
    if (M.smoke !== false && s > 0.02) ekSmoke(puffs, t, s, X);
    if (M.plane && M.plane.trail) ekTrail(puffs, t, s, M.plane);
    puffs.end();
    // ---- the lake's ripples, the pot (the quake)
    if (X.potWater) X.potWater.scale.setScalar(1);
    set.labels = M.labels ? M.labels(t, tau, s) : [];
    set._M = M; set._tau = tau; set._s = s; set._dawn = dawn; set._airK = airK;
    globe.U.uLights.value = 1;
    // (the Earth seen whole, from out in space: the globe alone, without the land patch round the camp, whose colours
    // only match the globe's from close up)
    if (M.globeOnly) { for (const c of W.children) if (c !== globe.G && c.visible) { c.visible = false; gHid.push(c); } globe.U.uPatch.value = 2; sky.U.uDip.value = Math.PI / 2; }   // (and no sky-drawn limb: the globe itself is the Earth)
  };
  set.grade = (t, p, shot) => {
    const M = set._M || {};
    p.exposure = (M.exposure ?? 1.0) * (1 + 0.38 * (1 - ekSmooth(EKP.tauSunrise - 20, EKP.tauSunrise + 30, set._tau || 0)));   // (the dawn before your sunrise, lifted)
    p.bloom = M.bloom ?? 0.32; p.bloomThreshold = 0.9; p.vignette = M.vignette ?? 0.5; p.saturation = M.sat ?? 1.05; p.contrast = 1.06; p.grain = 0.026;
    p.warmth = M.warmth ?? 0;
  };
  return set;
};

// a fingertip lying on the ground, pointing +x (16 mm wide, its nail up), with a fingerprint's ridges underneath
function ekFingertip(scene) {
  const g = new THREE.Group();
  const tex = ekTex(ekCanvas(512, 512, (x, w, h) => {
    x.fillStyle = '#c99478'; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(120,70,52,0.55)'; x.lineWidth = 3.2;
    for (let r = 6; r < 380; r += 9.5) { x.beginPath(); for (let a = 0; a <= 6.3; a += 0.05) { const rr = r * (1 + 0.04 * Math.sin(a * 3 + r * 0.05)), px = w / 2 + Math.cos(a) * rr * 1.25, py = h * 0.62 + Math.sin(a) * rr; a ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); }
  }), { repeat: false });
  const skin = new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex, roughness: 0.55, bumpMap: tex, bumpScale: 0.0004 });
  const geo = new THREE.CapsuleGeometry(0.008, 0.05, 8, 24); geo.rotateZ(Math.PI / 2); geo.scale(1, 0.8, 1);
  const m = new THREE.Mesh(geo, skin); m.position.set(-0.025, 0.0072, 0); g.add(m);
  const nail = new THREE.Mesh(new THREE.SphereGeometry(0.0062, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.45), ekStd('#e2b8a6', 0.3)); nail.scale.set(1.6, 0.35, 1); nail.position.set(0.012, 0.0128, 0); g.add(nail);
  scene.add(g); ekWorldify(g, 'you');
  return { g };
}
// grass round another point (the meadow where your hand comes down)
function ekGrassAt(W, cx, cz, R, n) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-0.005, 0, 0, 0.005, 0, 0, 0.0, 1, 0.0], 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  const mat = ekWorldPatch(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.85, side: THREE.DoubleSide }), { key: 'grass2' });
  const im = new THREE.InstancedMesh(g, mat, n), M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color(), p = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    const a = ekR(i, 31) * Math.PI * 2, r = R * Math.sqrt(ekR(i, 32)), x = cx + Math.sin(a) * r, z = cz - Math.cos(a) * r;
    const h = 0.06 + 0.16 * ekR(i, 33);
    e.set((ekR(i, 34) - 0.5) * 0.8, ekR(i, 36) * 6.28, (ekR(i, 37) - 0.5) * 0.8); q.setFromEuler(e);
    ekSphere(x, z, ekGroundY(x, z) - 0.01, p);
    M.compose(new THREE.Vector3(p[0], p[1], p[2]), q, new THREE.Vector3(1 + ekR(i, 38), h, 1)); im.setMatrixAt(i, M);
    c.setRGB(0.3 + 0.14 * ekR(i, 39), 0.32 + 0.1 * ekR(i, 40), 0.15); im.setColorAt(i, c);
  }
  im.frustumCulled = false; im.receiveShadow = true; W.add(im);
  return im;
}
// the fire's thin smoke (world metres → your frame)
function ekSmoke(pf, t, s, X) {
  const F = EK_F.fire, y0 = ekGroundY(F.x, F.z);
  for (let i = 0; i < 26; i++) {
    const life = 7, ph = ((t * 0.5 + i / 26 * life) % life) / life, k = Math.floor((t * 0.5 + i / 26 * life) / life);
    const x = F.x + 0.6 * ph * Math.sin(i * 1.3 + k) + 1.6 * ph, z = F.z - 0.5 * ph, y = y0 + 0.2 + 3.2 * ph;
    pf.add(x * s, y * s, z * s, (0.18 + 0.9 * ph) * s, 0.16 * Math.sin(ph * Math.PI), 0.45, 0.46, 0.5);
  }
}
// the contrail behind the airliner (world metres → your frame): q.p is in your frame, q.trailW the world direction back
function ekTrail(pf, t, s, q) {
  const [px, py, pz] = q.p, back = q.back;
  for (let i = 0; i < 480; i++) {
    const d = 30 + i * 4, k = i / 480;
    for (const side of [-1, 1]) pf.add(px + (back[0] * d) * s + side * 5.0 * s * Math.cos(q.yaw + Math.PI / 2) * 0, py - 2.2 * s, pz + back[2] * d * s + side * 5.0 * s, (6 + 16 * k) * s, 0.36 * (1 - k) * Math.min(1, i / 8), 0.9, 0.92, 0.96);
  }
}
