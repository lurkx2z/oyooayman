/* =====================================================================
   HILL — the top of the hill over Port Ellery, 240 m up, 24 km from your light: Isla, her mum, the people who walked
   up, their torches and phones; below, the drowned town in the dark, the sea; far out on it, one light flashing.
   Its own frame: the hilltop at the origin, y up (y = 0 is the hilltop, so the datum is y = −240), x east, z south.
   ===================================================================== */

OC_SETS.hill = (app) => {
  const HH = OC_F.hill.h, y0 = -HH, P = OCP;
  const o = ocSet(app, { sky: '#000000', fog: 0.00004, fogColor: '#3a4258', fov: 42, near: 0.05, far: 90000, hemi: ['#5a6a90', '#101418', 0.4], sun: [-100, 20, 40], sunColor: '#aebcdc', sunI: 0.3, shadow: 1024, shadowR: 14, shadowFar: 400 });
  const { scene, camera, sun, hemi } = o;
  const set = { scene, camera, sun, hemi, _s: 0, labels: [] };
  scene.environment = ocEnv(app.renderer, '#26304a', '#3a3a48', '#0a0c10');
  const sky = ocSky(scene);
  const flat = new THREE.DataTexture(new Float32Array([-40]), 1, 1, THREE.RedFormat, THREE.FloatType); flat.needsUpdate = true;
  const sea = ocSea(scene, { tex: flat, box: [1e6, 1e6, 1e-6, 1e-6] });
  sea.U.uTowerR.value = 0; sea.U.uHouse.value.set(1e6, 1e6, 1e6, 1e6); sea.U.uHouseTop.value = -1e9;
  // the tower's direction and distance from here (the hill is 24 km from the tower at azimuth 318°: the tower is at 138°)
  const [hx, hz] = ocAzXZ(OC_F.hill.az), D = OC_F.hill.d, toT = [-hx, -hz];
  // ---- the hill: a grassy dome, rocks, falling away to the south-east towards the town and the sea
  const g = new THREE.PlaneGeometry(1400, 1400, 140, 140); g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i), r = Math.hypot(x, z), along = (x * toT[0] + z * toT[1]);
    let y = -HH * MathX.smooth(r, 30, 900) * (0.75 + 0.25 * MathX.smooth(along, -300, 400)) - 0.9 * (r / 40) ** 2 * (r < 30 ? 1 : 0) * 0.0 + (ocN2(x * 0.03, z * 0.03, 3) - 0.5) * 6 * MathX.smooth(r, 20, 120) + (ocN2(x * 0.3, z * 0.3, 4) - 0.5) * 0.4;
    pos.setY(i, y); }
  g.computeVertexNormals();
  const ground = ocMesh(g, ocStd('#2a3322', 0.95), 0, 0, 0, scene); ground.receiveShadow = true;
  // the people: Isla at the front, her mum beside her; others behind them along the top
  const isla = ocPerson('ocIsla', scene, { id: 'i', kid: 0.94 }), mum = ocPerson('ocMum', scene, { id: 'm' });
  ocFace(isla, { seed: 33, iris: [96, 112, 120], jaw: 0.33, nose: 0.016, lip: '#c07a6c' });
  const crowd = [0, 1, 2, 3, 4, 5].map((i) => ocPerson('ocHill' + i, scene, { id: 'h' + i }));
  const spots = [[-3.2, -2.4], [3.6, -1.8], [-6.5, -5.2], [6.4, -4.6], [1.0, -6.0], [-1.8, -8.4]];
  // phones and torches in their hands: small glowing screens / points
  const lightM = new THREE.MeshBasicMaterial({ color: '#dfe8ff' }), torchM = new THREE.MeshBasicMaterial({ color: '#fff2d0' });
  const screens = [isla, mum, ...crowd].map((p, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.065, 0.13), i % 3 === 2 ? torchM : lightM); m.position.set(0, 0.09, 0.02); p.j.ra.hand.add(m); m.castShadow = false; return m; });
  const glows = ocPuffs(scene, 400, { additive: true, soft: 1.0 });
  // the far light: one point, 24 km away over the sea (the curve hides the sea that far below; the lamp stands over it)
  const lightPt = new THREE.Sprite(new THREE.SpriteMaterial({ map: ocDotTex(0.3), color: '#ffe2b8', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false })); lightPt.renderOrder = 9; scene.add(lightPt);
  const drop = (d) => d * d / (2 * OC_REARTH);
  const cam = (p, at, fov) => { ocCam(camera, p, at, fov); camera.near = 0.05; camera.updateProjectionMatrix(); };
  set.cams = {
    // behind Isla and her mum, over their shoulders: the dark below, the sea, your light far out on it
    hill: (t, s, k) => { const d = ocDrift(t, 0.02, 0.3, 40), tp = [toT[0] * D, y0 - drop(D) + 40, toT[1] * D]; cam([-toT[0] * 4.2 + 0.9 * toT[1] + d[0], 1.75 + d[1], -toT[1] * 4.2 - 0.9 * toT[0] + d[2]], tp, 40 - 2 * k); },
  };
  set.frame = (t, shot) => {
    const s = ocStoryAt(t), m = shot.mode, k = (t - shot.t0) / Math.max(1e-6, shot.t1 - shot.t0), h = P.h(s);
    set._s = s; set._mode = m;
    // the people (facing the sea, towards your light)
    const yaw = Math.atan2(toT[0], toT[1]), side = [toT[1], -toT[0]];
    ocPlace(isla, OC_P.islaPhone(t), side[0] * 0.5, 0, side[1] * 0.5, yaw); ocFaceSet(isla, t, { worry: 0.4, brow: 0.3 });
    ocPlace(mum, OC_P.arms(t, 1), -side[0] * 0.6 - toT[0] * 0.3, 0, -side[1] * 0.6 - toT[1] * 0.3, yaw - 0.15);
    crowd.forEach((p, i) => { const [a, b] = spots[i], x = side[0] * a + toT[0] * b, z = side[1] * a + toT[1] * b; ocPlace(p, i % 3 === 2 ? OC_P.torchUp(t, i) : i % 2 ? OC_P.islaType(t) : OC_P.arms(t, i), x, 0, z, yaw + 0.3 * Math.sin(i * 2.1)); });
    (set.cams[m] || set.cams.hill)(t, s, k);
    camera.updateMatrixWorld(true);
    const sk = sky.set(s, camera), skyK = ocSkyK(sk.alt), moonK = ocMoonK(s);
    sea.set(s, t, camera, sky, y0); sea.U.uSkyK.value = Math.max(sea.U.uSkyK.value, 0.3);   // (from 200 m up the sea's own blue still shows at dusk)
    sun.position.set(sk.moon.v[0] * 200, Math.max(0.05, sk.moon.v[1]) * 200, sk.moon.v[2] * 200); sun.target.position.set(0, 0, 0); sun.target.updateMatrixWorld();
    sun.intensity = 1.1 * moonK; hemi.intensity = 0.16 + 1.5 * skyK + 0.35 * moonK; hemi.color.copy(sk.zen).lerp(sk.hor, 0.3); scene.environmentIntensity = 0.05 + 0.6 * skyK;
    scene.fog.color.copy(sk.hor); scene.fog.density = 0.00004;
    // your light: it flashes towards here when a beam swings past (the lens turns once in 20 s)
    { const ang = s / 20 * Math.PI * 2, dirH = [hx, hz]; let fl = 0; for (let i = 0; i < 4; i++) { const a = ang - (i * Math.PI / 2 + Math.PI / 4); fl = Math.max(fl, Math.pow(Math.max(0, Math.cos(a) * dirH[0] - Math.sin(a) * dirH[1]), 90)); }
      const lit = h < OC_F.tower.lamp - 0.05;
      lightPt.position.set(toT[0] * D, y0 + OC_F.tower.lamp - drop(D), toT[1] * D);
      const dd = camera.position.distanceTo(lightPt.position), px = dd * Math.tan(MathX.deg(camera.fov) / 2) * 2 / 1080;
      lightPt.scale.setScalar(px * (18 + 80 * fl)); lightPt.material.opacity = lit ? 0.75 + 0.25 * fl : 0; lightPt.visible = lit; }
    // the phones' glow
    glows.begin(); for (const m2 of screens) { const v = new THREE.Vector3(); m2.getWorldPosition(v); glows.add(v.x, v.y, v.z, 0.14, 0.22, 0.6, 0.65, 0.8); } glows.end();
  };
  set.labels = (t) => { const sh = ocShotAt(t); return set._mode === 'hill' ? [{ p: [toT[0] * D, y0 + OC_F.tower.lamp - drop(D) + 30, toT[1] * D], text: 'YOUR LIGHT', sub: '24 km', a: ocWin(t, sh.t0 + 0.8, sh.t1, 0.4, 0.4), side: 'r' }] : []; };
  set.grade = (t, p) => { const dark = 1 - ocSkyK(ocSunAt(set._s).alt); p.exposure = 1.0 + 1.3 * dark; p.saturation = 0.95; p.bloom = 0.6; p.bloomThreshold = 0.75; p.vignette = 0.62; p.grain = 0.045; };
  return set;
};
