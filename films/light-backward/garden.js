/* =====================================================================
   GARDEN — your back garden on a clear late-October night and the sky over it (garden-build.js builds the house and
   the garden; sky.js draws the sky; physics.js says when everything happens). One set, many shots (modes, shots.js):
     open      10:02:30 PM: daylight; the camera finds the second Sun     title     the garden under the title
     before    9:59:39: the night, the Moon, the cat on the wall          rule      the rule (the HUD's diagram)
     vanish    the whole sky; at 10:00:00 it goes out                      crescent  the Moon (long lens): the sliver
     old       the black sky; the first mirror images                      sirius    west: Sirius appears
     mirror    the sky filling up, back to front                           replay    the lantern, a billion times slower
     mirror2   the sky                                                     canopus   over the roof: Canopus appears
     north     the glow low in the south-west                                switch    down the garden: the second Sun
     day       daylight; a robin sings; the streetlight goes off           moonwhy   the Moon by day, its night side lit
     project   the telescope's card: the spots back to front               past      the second Sun through a filter
     full      10:08:18: the Moon's day side, twice as bright              three     triple sunlight (the HUD's chart)
     midnight  the second Sun high in the south; next door's solar panels
     sunrise   6:47 AM in the park: two suns, two shadows                  noon      the real Sun, twice as bright
     never     three days in twelve seconds: no night                      summer    the garden that never sees winter
     nightback the night comes back                                        real / question   9:59 PM, tonight
   Layout (metres): the house's back wall is z = 0, the garden runs to −z (SSE, azimuth 150°), +x is WSW, −x ENE.
   ===================================================================== */

const LB_GD = {
  you: [0.3, 1.62, -2.6],
  robin: [4.62, 1.8, -7.3],          // on the right-hand fence
  lamp: [3.6, 0, -18.6],             // the streetlight in the lane behind the back wall
  park: [3000, 0, 0],                // the park (the sunrise): far from the garden, under the same sky
};
// a direction in the garden from azimuth / altitude, d metres from p
const lbAim = (p, az, alt, d = 40) => { const g = lbGardenDir(az, alt); return [p[0] + g[0] * d, p[1] + g[1] * d, p[2] + g[2] * d]; };

// a robin: brown back, orange face and breast, a thin dark beak (it opens when it sings)
function lbRobin(parent) {
  const g = new THREE.Group(), fl = { flatShading: true };
  const brown = lbStd('#6b5a44', 0.8, 0, fl), orange = lbStd('#d0642c', 0.75, 0, fl), pale = lbStd('#d8d0c2', 0.8, 0, fl), dark = lbStd('#1c1814', 0.4);
  const body = lbMesh(new THREE.IcosahedronGeometry(0.046, 1), brown, 0, 0.066, 0, g); body.scale.set(0.95, 0.95, 1.25);
  const breast = lbMesh(new THREE.IcosahedronGeometry(0.04, 1), orange, 0, 0.072, 0.024, g); breast.scale.set(0.95, 1.0, 0.8);
  lbMesh(new THREE.IcosahedronGeometry(0.03, 1), pale, 0, 0.045, 0.012, g);
  const head = new THREE.Group(); head.position.set(0, 0.114, 0.04); g.add(head);
  lbMesh(new THREE.IcosahedronGeometry(0.031, 1), brown, 0, 0, 0, head);
  lbMesh(new THREE.IcosahedronGeometry(0.025, 1), orange, 0, -0.005, 0.013, head);
  const up = new THREE.Group(); up.position.set(0, 0, 0.027); head.add(up);
  lbMesh(new THREE.ConeGeometry(0.006, 0.022, 6), dark, 0, 0, 0.01, up).rotation.x = Math.PI / 2;
  const lo = new THREE.Group(); lo.position.set(0, -0.004, 0.027); head.add(lo);
  lbMesh(new THREE.ConeGeometry(0.005, 0.018, 6), dark, 0, 0, 0.008, lo).rotation.x = Math.PI / 2;
  for (const sx of [-1, 1]) lbMesh(new THREE.SphereGeometry(0.006, 8, 6), dark, sx * 0.02, 0.006, 0.017, head);
  lbBox(0.036, 0.008, 0.07, brown, 0, 0.062, -0.075, g).rotation.x = -0.4;
  for (const sx of [-1, 1]) lbCyl(0.003, 0.003, 0.04, dark, sx * 0.015, 0.02, 0, g, 5);
  g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  parent.add(g);
  return { g, head, open(k) { lo.rotation.x = 0.5 * k; up.rotation.x = -0.12 * k; } };
}
// the streetlight in the lane (a light sensor switches it off in daylight)
function lbStreetlight(scene, at) {
  const g = new THREE.Group(); g.position.set(...at); scene.add(g);
  const grey = lbStd('#5a5e62', 0.6, 0.5);
  lbCyl(0.07, 0.09, 6.0, grey, 0, 3.0, 0, g, 10);
  lbBox(0.08, 0.08, 1.1, grey, 0, 5.96, 0.5, g);
  lbBox(0.34, 0.1, 0.56, grey, 0, 5.92, 1.08, g);
  lbBox(0.05, 0.05, 0.05, lbStd('#2a2c2e', 0.5), 0, 6.0, 0.86, g);                  // (the sensor)
  const lensM = new THREE.MeshBasicMaterial({ color: '#ffe6c0' });
  const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.46), lensM); lens.rotation.x = Math.PI / 2; lens.position.set(0, 5.866, 1.08); g.add(lens);
  const light = new THREE.SpotLight('#ffdcb0', 0, 30, 1.05, 0.75, 1.3);
  light.position.set(at[0], 5.8, at[2] + 1.1); light.target.position.set(at[0] - 0.5, 0, at[2] + 4.0); scene.add(light, light.target);
  return { g, lensM, light };
}
// solar panels on next door's roof (its south-facing slope, 29°)
function lbSolarPanels(scene) {
  const tex = lbTex(lbCanvas(256, 512, (g, w, h) => {
    g.fillStyle = '#c8ccd0'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#16213a'; g.fillRect(6, 6, w - 12, h - 12);
    g.strokeStyle = 'rgba(170,185,210,0.55)'; g.lineWidth = 2;
    for (let x = 6; x <= w - 6; x += (w - 12) / 6) { g.beginPath(); g.moveTo(x, 6); g.lineTo(x, h - 6); g.stroke(); }
    for (let y = 6; y <= h - 6; y += (h - 12) / 10) { g.beginPath(); g.moveTo(6, y); g.lineTo(w - 6, y); g.stroke(); }
  }), { repeat: false });
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.18, metalness: 0.35, envMapIntensity: 1.4 });
  const grp = new THREE.Group(); grp.position.set(12.2, 7.4 + 0.08, 1.87); grp.rotation.x = -Math.atan2(2.4, 4.3); scene.add(grp);
  for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) {
    const p = lbBox(1.0, 0.04, 1.65, m, -2.75 + c * 1.1, 0, -0.9 + r * 1.75, grp); p.castShadow = true;
  }
  return grp;
}
// the park for the sunrise: open grass to the horizon, a few far hedges and trees (none where the suns are)
function lbBuildPark(scene, at) {
  const g = new THREE.Group(); g.position.set(...at); scene.add(g);
  const gt = lbTex(lbGrassCanvas(77)); gt.repeat.set(380, 380);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(2300, 96), lbStd('#ffffff', 0.96, 0, { map: gt })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; g.add(ground);
  const r = new RNG(907), leaf = lbStd('#24361f', 0.9, 0, { flatShading: true }), bark = lbStd('#33281f', 0.95);
  for (let i = 0; i < 70; i++) {
    const az = r.range(0, 360);
    if (Math.abs(((az - 111 + 540) % 360) - 180) < 22 || Math.abs(((az - 291 + 540) % 360) - 180) < 22) continue;
    const d = r.range(160, 650), dir = lbGardenDir(az, 0), x = dir[0] * d, z = dir[2] * d, s = r.range(3, 7);
    if (r.next() < 0.5) { lbCyl(s * 0.07, s * 0.1, s * 0.9, bark, x, s * 0.45, z, g, 6); lbMesh(lbBlob(s * 0.75, r.int(0, 999)), leaf, x, s * 1.25, z, g); }
    else { const h = lbMesh(lbBlob(s * 0.6, r.int(0, 999)), leaf, x, s * 0.35, z, g); h.scale.set(3.5, 0.9, 1.2); h.rotation.y = r.range(0, 3); }
  }
  // a path and a bench
  const path = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 600), lbStd('#8a8172', 0.95)); path.rotation.x = -Math.PI / 2; path.rotation.z = 0.5; path.position.set(-14, 0.01, -40); path.receiveShadow = true; g.add(path);
  const bench = new THREE.Group(); bench.position.set(-9, 0, -18); bench.rotation.y = 0.5; g.add(bench);
  const wood = lbStd('#6a4a30', 0.8);
  lbBox(1.8, 0.05, 0.45, wood, 0, 0.45, 0, bench); lbBox(1.8, 0.4, 0.05, wood, 0, 0.75, -0.22, bench);
  for (const x of [-0.8, 0.8]) lbBox(0.06, 0.45, 0.45, lbStd('#2a2a2a', 0.5, 0.6), x, 0.22, 0, bench);
  return g;
}

LB_SETS.garden = (app) => {
  const S = lbSet(app, { sky: '#000000', fov: 55, near: 0.02, far: 6000, hemi: ['#2a3550', '#16120e', 0.2], sun: [0, 60, -60], sunI: 0, shadow: 2048, shadowR: 22, shadowFar: 400 });
  const scene = S.scene, cam = S.camera, K = lbK, G = LB_G;
  scene.environment = lbEnv(app.renderer, '#9fb8d8', '#d6d2ca', '#5a544a');
  const P = lbBuildGarden(app, S), M = P.M;
  const sky = new LbSky(scene, { F: LB_SKY.F, X: LB_SKY.X, az0: LBP.az0, moon: true, second: true, town: '#3a2c22' });
  // ---- light: the two suns (each with its shadow), the Moon, the sky; the lamps
  const sun2L = S.sun, sun1L = new THREE.DirectionalLight('#fff4e6', 0);
  sun1L.castShadow = true; sun1L.shadow.mapSize.set(2048, 2048); sun1L.shadow.bias = -0.0004; sun1L.shadow.normalBias = 0.03;
  { const c = sun1L.shadow.camera; c.left = -22; c.right = 22; c.top = 22; c.bottom = -22; c.near = 1; c.far = 400; }
  scene.add(sun1L, sun1L.target);
  const moonL = new THREE.DirectionalLight('#a8b8d8', 0); scene.add(moonL, moonL.target);
  const warm = '#ffb468';
  const spill = new THREE.SpotLight(warm, 0, 16, 0.95, 0.85, 1.6); spill.position.set(-1.6, 1.7, 0.6); spill.target.position.set(-1.4, 0, -5); scene.add(spill, spill.target);
  const strings = [-2.5, -8, -13.5].map((z) => { const p = new THREE.PointLight('#ffc070', 0, 6, 1.8); p.position.set(-G.lawnW / 2 + 0.25, 1.75, z); scene.add(p); return p; });
  const pendant = new THREE.PointLight('#ffcf96', 0, 9, 1.6); pendant.position.set(...P.lampAt); scene.add(pendant);
  const candle = new THREE.PointLight('#ffad5a', 0, 7, 1.8); scene.add(candle);
  const street = lbStreetlight(scene, LB_GD.lamp);
  // ---- the candle's flame (the lantern on the patio table)
  const flame = new THREE.Group(); flame.position.set(...P.wickAt); flame.position.y += 0.018; P.lantern.add(flame);
  const flameM = new THREE.MeshBasicMaterial({ color: '#ffd28a' });
  const fl = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), flameM); fl.scale.set(0.007, 0.018, 0.007); flame.add(fl);
  const flCore = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff4dc' })); flCore.scale.set(0.004, 0.009, 0.004); flCore.position.y = -0.006; flame.add(flCore);
  // ---- the telescope: a sun shade on the tube and a white card behind the eyepiece (its projected image)
  const card = new THREE.Group(); card.position.set(0, 0.0, -0.84); P.tube.add(card);
  lbBox(0.22, 0.22, 0.004, lbStd('#f2efe8', 0.9), 0, 0, 0, card);
  const cardImgM = new THREE.MeshBasicMaterial({ map: sky.sun2.material.uniforms.uFace.value, transparent: true, depthWrite: false });
  const cardImg = new THREE.Mesh(new THREE.CircleGeometry(0.068, 64), cardImgM); cardImg.position.z = 0.0035; cardImg.rotation.z = Math.PI; card.add(cardImg);
  for (const x of [-0.06, 0.06]) lbRod([x, -0.05, -0.38], [x, -0.05, -0.84], 0.004, M.black, P.tube, 5);
  const shade = lbCyl(0.17, 0.17, 0.006, lbStd('#e8e4da', 0.9), 0, 0, -0.16, P.tube, 36); shade.rotation.x = Math.PI / 2;
  card.visible = false; shade.visible = false;
  // ---- the cat on the back wall, the robin, the solar panels, the park
  const catRoot = new THREE.Group(); catRoot.position.set(...G.catAt); catRoot.rotation.y = 0.35; scene.add(catRoot);
  const cat = lbBuildCat(catRoot);
  const robin = lbRobin(scene); robin.g.position.set(...LB_GD.robin); robin.g.rotation.y = -Math.PI / 2 - 0.3;
  const panels = lbSolarPanels(scene);
  const park = lbBuildPark(scene, LB_GD.park);
  // you, in the park (watching the sunrise)
  const PK = LB_GD.park, east = lbGardenDir(111, 0);
  const you = lbPerson({ id: 'lbYou', look: 'lbVisitor', path: [[0, PK[0], PK[2]]], face: Math.atan2(-east[0], -east[2]) / LB_D2R, states: [[0, 'idle']] }, scene);
  you.root.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  // ---- the lantern's light, slowed down a billion times (1 ns of light = 1 s of film): photons from the flame,
  // some off the table top; at the reversal every one in flight turns round and goes back the way it came
  const photons = lbPuffs(scene, 6000, { additive: true, soft: 1.4 });
  const PH = Array.from({ length: 1400 }, (_, i) => {
    const u = lbR(i, 1) * 1.9 - 0.95, a = lbR(i, 2) * 6.2832, r = Math.sqrt(1 - u * u);
    return { d: [r * Math.cos(a), u, r * Math.sin(a)], e: -16 + 30 * lbR(i, 3) };
  });
  const LB_C = 0.3;                                        // light: 0.3 m per nanosecond (per second of film here)
  const tauOf = (t) => t - (lbCap('replay', 1).show + 0.4); // replay time (ns): the reversal at 0
  // where a photon is at replay time τ (null: not out yet / back in the flame), and which way it is going
  const photonAt = (q, tau, W) => {
    let dist, back = false;
    if (q.e < 0 && tau >= 0) { dist = LB_C * (-q.e - tau); back = true; } else dist = LB_C * (tau - q.e);
    if (!(dist > 0.004) || dist > 3.2) return null;
    const hTab = 0.113;                                    // (the flame is 11 cm above the table top)
    let p, d = q.d;
    const L = q.d[1] < -0.05 ? hTab / -q.d[1] : 1e9;
    if (dist < L) p = [W[0] + d[0] * dist, W[1] + d[1] * dist, W[2] + d[2] * dist];
    else {
      const hit = [W[0] + d[0] * L, W[1] - hTab, W[2] + d[2] * L];
      if (Math.hypot(hit[0] - LB_G.table[0], hit[2] - LB_G.table[2]) > 0.36) p = [W[0] + d[0] * dist, W[1] + d[1] * dist, W[2] + d[2] * dist];
      else { d = [d[0], -d[1], d[2]]; const r2 = dist - L; p = [hit[0] + d[0] * r2, hit[1] + d[1] * r2, hit[2] + d[2] * r2]; }
    }
    return { p, d: back ? lbSc(d, -1) : d, back };
  };

  // ---- the story clock per mode (the end: tonight again, at 9:59 PM, ticking towards 10)
  const nightS = (t) => t - LB.end - 0.5;
  const skyTime = (t, m) => (m === 'real' || m === 'question' ? nightS(t) : m === 'nightback' ? -200 : lbStoryAt(t));
  LB_GARDEN.skyTime = skyTime;

  const look = (p, at, fov, t, drift = 0.004, roll = 0) => { const d = lbDrift(t, drift, 0.3, 11); lbCam(cam, [p[0] + d[0], p[1] + d[1], p[2] + d[2]], at, fov, roll); };
  const tmp = new THREE.Color(), cLow = new THREE.Color('#ff8a48'), cHigh = new THREE.Color('#fff6ea');
  // a sun's light: from direction L (garden), brightness k; very low suns light from at least `lift` up (so that
  // the ground still reads at sunrise); its shadow box (half-size R0) round `c`
  const sunLight = (light, L, k, c, R0, lift = 0.0, gain = 1) => {
    const up = Math.max(MathX.smooth(L[1], -0.012, 0.03), gain > 1 ? 0.85 * (L[1] > -0.01) : 0);
    light.intensity = 2.6 * k * up * gain;
    tmp.copy(cLow).lerp(cHigh, MathX.smooth(L[1], 0.0, 0.3)); light.color.copy(tmp);
    const d = lbN3([L[0], Math.max(L[1], lift), L[2]]);
    light.position.set(c[0] + d[0] * 150, c[1] + d[1] * 150, c[2] + d[2] * 150); light.target.position.set(c[0], c[1], c[2]); light.target.updateMatrixWorld();
    light.castShadow = light.intensity > 0.02;
    const sc = light.shadow.camera; if (sc.right !== R0) { sc.left = -R0; sc.right = R0; sc.top = R0; sc.bottom = -R0; sc.updateProjectionMatrix(); }
  };

  const set = {
    scene, camera: cam, sky,
    cuts() { return [LB.robin, LB.lampsOff - 1.0, lbCap('midnight', 2).show - 0.4, lbCap('sunrise', 2).show - 0.4, lbCap('real2', 0).show + 2.6, lbCap('real2', 2).show - 0.3, LB.real3, LB.real4]; },
    frame(t, shot) {
      const m = shot.mode, s = skyTime(t, m);
      let pos = LB_GD.you, at = [0, 1.2, -14], fov = 55, drift = 0.004, roll = 0;
      let sk = { t, F: lbFrame(s), moonK: 1, lens: 0 };      // (sky options)
      let lamps = 1, house = 1, lantern = 1, fade2 = 1, dim = 0, shadowC = null, shadowR = 22, lift = 0.0, gain = 1, amb = 1;
      cam.near = 0.02; cam.far = 6000;
      card.visible = shade.visible = false; you.root.visible = false; park.visible = false;
      catRoot.visible = true; robin.g.visible = true; photons.begin();
      // (where the suns are now: the sky's state from the last frame is fine for aiming, it moves slowly)
      const L1 = lbLocal(lbSunDir(s), sk.F, LBP.az0), L2 = lbSc(L1, -1);
      const toward = (L, p, d = 40, dAlt = 0) => { const a = lbGardenAltAz(L); return lbAim(p, a.az, a.alt + dAlt, d); };
      const moonD = sky.moonDir;
      // the telescope: on the Moon at night, on the second Sun once it is up (aimed first: the card shot frames on it)
      { const L = s > LB_SKY.on + 1 && L2[1] > 0.05 ? L2 : [moonD.x, moonD.y, moonD.z];
        P.scopeHead.rotation.y = Math.atan2(L[0], L[2]); P.tube.rotation.x = -Math.asin(MathX.clamp(L[1], -1, 1)); }
      // ------------------------------------------------------------------ the shots
      if (m === 'open') {
        pos = lbV([1.2, 1.64, -1.3], [0.9, 1.64, -2.2], K(t, -1, LB.titleShot, (x) => x));
        const k = K(t, LB.secondSun, LB.secondSun + 2.6);
        at = lbV([-0.6, 0.9, -15], toward(L2, pos, 40, -19), k); fov = 62;
        lamps = 0;
      } else if (m === 'title') {
        const k = K(t, LB.titleShot, LB.before, (x) => x);
        pos = lbV([0.3, 3.0, -0.9], [0.3, 3.25, -2.0], k); at = toward(L2, pos, 40, -24); fov = 62; drift = 0.002;
        lamps = 0;
      } else if (m === 'before' || m === 'question' || (m === 'real' && t < LB.real2 + 0.4)) {
        // the night: the Moon, the stars, your cat on the back wall
        const k = m === 'before' ? K(t, LB.before, LB.rule, (x) => x) : m === 'question' ? K(t, LB.question, LB.end, (x) => x) : K(t, LB.real, LB.real2 + 0.4, (x) => x);
        pos = lbV([0.7, 1.64, -1.9], [0.5, 1.64, -2.8], k); at = lbAim(pos, 172, 13); fov = 62;
      } else if (m === 'rule') {
        const k = K(t, LB.rule, LB.count, (x) => x);
        pos = [-1.4, 1.62, -6.5]; at = lbAim(pos, lbLerp(222, 214, k), lbLerp(24, 27, k)); fov = 58; drift = 0.003;
      } else if (m === 'vanish' || m === 'old' || m === 'mirror2') {
        // the whole sky, roofs along the bottom
        const k = m === 'old' ? K(t, LB.old, LB.siriusCut, (x) => x) : m === 'vanish' ? K(t, LB.count, LB.moonCut, (x) => x) : K(t, LB.replayEnd, LB.canopusCut, (x) => x);
        pos = [0.0, 1.45, -8.0]; at = lbAim(pos, m === 'old' ? lbLerp(178, 160, k) : m === 'vanish' ? lbLerp(182, 178, k) : lbLerp(160, 150, k), 38); fov = 82; drift = 0.002;
      } else if (m === 'crescent' || m === 'moonwhy' || m === 'full') {
        // the Moon through a long lens
        pos = LB_GD.you; const md = [moonD.x, moonD.y, moonD.z];
        const k = m === 'crescent' ? K(t, LB.moonCut, LB.old, (x) => x) : m === 'moonwhy' ? K(t, LB.moonwhy, LB.project, (x) => x) : K(t, LB.full, LB.three, (x) => x);
        at = [pos[0] + md[0] * 40, pos[1] + md[1] * 40, pos[2] + md[2] * 40]; fov = lbLerp(1.05, 0.95, k); drift = 0.00002;
        cam.near = 1;
      } else if (m === 'sirius') {
        // the bottom left of the garden, looking west over next door's roof
        const k = K(t, lbCap('sirius', 1).show - 0.6, lbCap('sirius', 1).show + 2.4);
        pos = [-3.3, 1.62, -15.0]; at = lbAim(pos, 276, lbLerp(13, 16.7, k)); fov = lbLerp(56, 26, k); drift = lbLerp(0.004, 0.001, k);
      } else if (m === 'mirror') {
        const k = K(t, LB.mirror, LB.replay, (x) => x);
        pos = [0.3, 1.62, -4.0]; at = lbAim(pos, lbLerp(158, 148, k), lbLerp(17, 26, k)); fov = 52; drift = 0.003;
      } else if (m === 'replay') {
        // the lantern on the table, lit only by itself
        const W = new THREE.Vector3(); fl.getWorldPosition(W);
        const k = K(t, LB.replay, LB.replayEnd, (x) => x);
        pos = [W.x + lbLerp(0.95, 0.8, k), W.y + 0.32, W.z + lbLerp(1.15, 0.95, k)]; at = [W.x, W.y - 0.05, W.z]; fov = 50; drift = 0.0015;
        dim = 1;
        const tau = tauOf(t), Wp = [W.x, W.y, W.z];
        for (const q of PH) {
          const ph = photonAt(q, tau, Wp); if (!ph) continue;
          const a = ph.back ? 0.95 : 0.7;
          photons.add(ph.p[0], ph.p[1], ph.p[2], 0.011, a, 1.0, 0.78, 0.46);
          for (let j = 1; j <= 3; j++) photons.add(ph.p[0] - ph.d[0] * 0.012 * j, ph.p[1] - ph.d[1] * 0.012 * j, ph.p[2] - ph.d[2] * 0.012 * j, 0.008, a * (0.5 - 0.12 * j), 1.0, 0.7, 0.4);
        }
      } else if (m === 'canopus' || m === 'north') {
        // the bottom of the garden, looking back over the house
        pos = [-1.4, 1.62, -15.8];
        if (m === 'canopus') { const k = K(t, lbCap('canopus', 0).show + 0.4, lbCap('canopus', 1).show); at = lbAim(pos, 309, lbLerp(32, 38.8, k)); fov = lbLerp(62, 40, k); }
        else { const k = K(t, LB.north, LB.north + 6.0); pos = [-2.6, 1.62, -10.0]; at = lbAim(pos, lbLerp(242, 228, k), lbLerp(26, 8, k)); fov = lbLerp(56, 70, k); }
        drift = 0.002;
      } else if (m === 'switch') {
        pos = [0.4, 1.62, -2.6]; const a = lbGardenAltAz(L2);
        at = lbAim(pos, a.az + 2, a.alt - 14); fov = 72; drift = 0.0025;
      } else if (m === 'day') {
        lamps = t < LB.lampsOff ? 1 : 0;
        if (t < LB.robin) { pos = [-0.8, 1.62, -2.2]; at = lbAim(pos, 152, 9); fov = 64; }
        else if (t < LB.lampsOff - 1.0) { const k = K(t, LB.robin, LB.lampsOff - 1.0, (x) => x); pos = [2.4, 1.55, lbLerp(-5.2, -5.5, k)]; at = [LB_GD.robin[0], LB_GD.robin[1] + 0.08, LB_GD.robin[2]]; fov = 16; drift = 0.0008; }
        else { const k = K(t, LB.lampsOff - 1.0, LB.why, (x) => x); pos = [0.2, 1.62, lbLerp(-8.6, -9.4, k)]; at = [0.2, 2.9, -18]; fov = 60; }
      } else if (m === 'project') {
        card.visible = shade.visible = true;
        const C = new THREE.Vector3(), A = new THREE.Vector3(0, 0, 1); card.getWorldPosition(C); A.applyQuaternion(card.getWorldQuaternion(new THREE.Quaternion()));
        const side = new THREE.Vector3().crossVectors(A, new THREE.Vector3(0, 1, 0)).normalize(), k = K(t, LB.project, LB.past, (x) => x);
        pos = [C.x + A.x * 0.42 + side.x * lbLerp(0.3, 0.22, k), C.y + 0.16, C.z + A.z * 0.42 + side.z * lbLerp(0.3, 0.22, k)]; at = [C.x, C.y, C.z]; fov = 44; drift = 0.0012;
      } else if (m === 'past') {
        // the second Sun through a solar filter
        pos = LB_GD.you; at = [pos[0] + L2[0] * 40, pos[1] + L2[1] * 40, pos[2] + L2[2] * 40]; fov = 0.78; drift = 0.00001; cam.near = 1;
        Object.assign(sk, { k: 0, discK: 0.075, face2: 1, starK: 0 });
      } else if (m === 'three') {
        const k = K(t, LB.three, LB.midnight, (x) => x);
        pos = [-2.6, 1.62, lbLerp(-3.4, -4.0, k)]; at = lbAim(pos, 196, 12); fov = 58; lamps = 0;
      } else if (m === 'midnight') {
        lamps = 0; sk.moonK = 0;
        if (t < lbCap('midnight', 2).show - 0.4) { const k = K(t, LB.midnight, LB.sunrise, (x) => x); pos = [-0.6, 1.62, -5.5]; at = toward(L2, pos, 40, lbLerp(-20, -16, k)); fov = 70; }
        else { const k = K(t, lbCap('midnight', 2).show - 0.4, LB.sunrise, (x) => x); pos = [lbLerp(2.0, 2.3, k), 2.3, -5.4]; at = [10.6, 7.25, 1.6]; fov = 30; drift = 0.0015; }
      } else if (m === 'sunrise') {
        // the park, 6:47 AM: the real Sun rising in the east, the second setting in the west, your two shadows
        lamps = 0; house = 0; lantern = 0; sk.moonK = 0; park.visible = true; you.root.visible = true; you.update(t);
        catRoot.visible = false; robin.g.visible = false;
        const E = lbGardenDir(111, 0), side = lbN3([-E[2], 0, E[0]]), Y = [PK[0], 1.0, PK[2]];
        const c1 = lbCap('sunrise', 1).show - 0.4, c2 = lbCap('sunrise', 2).show - 0.4;
        if (t < c1) { const k = K(t, LB.sunrise, c1, (x) => x); pos = [PK[0] - E[0] * lbLerp(9, 7.5, k) + side[0] * 1.2, 1.5, PK[2] - E[2] * lbLerp(9, 7.5, k) + side[2] * 1.2]; at = [PK[0] + E[0] * 400, 6, PK[2] + E[2] * 400]; fov = 34; }
        else if (t < c2) {
          // a pan from the rising Sun, past you, to the setting one
          const k = Ease.inOutSine(MathX.clamp((t - c1 - 0.2) / 3.4, 0, 1)), ang = k * Math.PI;
          pos = [PK[0] + side[0] * 7, 1.5, PK[2] + side[2] * 7];
          const dir = lbN3([E[0] * Math.cos(ang) - side[0] * Math.sin(ang), 0.0, E[2] * Math.cos(ang) - side[2] * Math.sin(ang)]);
          at = [pos[0] + dir[0] * 400, 6, pos[2] + dir[2] * 400]; fov = 46;
        } else { const k = K(t, c2, c2 + 5); pos = [PK[0] + side[0] * lbLerp(4.0, 5.5, k) - E[0] * 1.2, lbLerp(3.0, 5.0, k), PK[2] + side[2] * lbLerp(4.0, 5.5, k) - E[2] * 1.2]; at = [PK[0], 0.5, PK[2]]; fov = lbLerp(60, 66, k); drift = 0.004; }
        shadowC = [PK[0], 0, PK[2]]; shadowR = 60; lift = t < c2 ? 0.06 : 0.2; gain = t < c2 ? 1 : 1.8; amb = t < c2 ? 0.45 : 0.22; sk.lens = 40;   // (the discs drawn larger than life; the light lifted so the shadows read)
      } else if (m === 'noon') {
        lamps = 0; house = 0; lantern = 0; sk.moonK = 0;
        const k = K(t, LB.noon, LB.never, (x) => x);
        pos = [0.6, 1.62, lbLerp(-4.2, -5.0, k)]; at = toward(L1, pos, 40, -9); fov = 62;
      } else if (m === 'never') {
        lamps = 0; house = 0; lantern = 0; sk.moonK = 0; catRoot.visible = false;
        pos = [0.0, 4.4, -0.9]; at = [0.0, 0.4, -14]; fov = 68; drift = 0.0015;
      } else if (m === 'summer') {
        lamps = 0; house = 0; lantern = 0; sk.moonK = 0; catRoot.visible = false;
        const k = K(t, LB.summer, LB.heat, (x) => x);
        pos = [lbLerp(1.2, 0.8, k), 1.62, lbLerp(-13.6, -12.6, k)]; at = [-0.4, 2.8, 0]; fov = 60;
      } else if (m === 'nightback') {
        // far in the future: the second Sun shows the Sun being born, fades; the night comes back
        const k = K(t, LB.nightBack + 0.2, LB.nightBack + 2.6);
        fade2 = 1 - k; sk.on = -1e9; sk.moonK = 0; sk.F = LB_SKY.F; lamps = 0; house = 0; lantern = 0; sk.starSize = 1.7; sk.mw = 2.0;
        pos = [0.4, 1.62, -6.0]; at = lbAim(pos, lbLerp(236, 250, K(t, LB.nightBack, LB.real, (x) => x)), 44); fov = 74;
      } else if (m === 'real') {
        // 9:59 PM tonight: how old the light is; then the sky; then the night garden under the diagrams
        if (t < lbCap('real2', 0).show + 2.6) { pos = LB_GD.you; const md = [moonD.x, moonD.y, moonD.z]; at = [pos[0] + md[0] * 40, pos[1] + md[1] * 40, pos[2] + md[2] * 40]; fov = 8; drift = 0.0006; }
        else if (t < lbCap('real2', 2).show - 0.3) { const k = K(t, lbCap('real2', 0).show + 2.6, lbCap('real2', 2).show - 0.3, (x) => x); pos = [-1.2, 1.62, -15.6]; at = lbAim(pos, lbLerp(285, 275, k), 22); fov = 58; }
        else if (t < LB.real3) { pos = [-1.2, 1.62, -15.6]; at = lbAim(pos, 265, 28); fov = 64; }
        else if (t < LB.real4) { const k = K(t, LB.real3, LB.real4, (x) => x); pos = [0, 1.45, -8]; at = lbAim(pos, lbLerp(240, 255, k), 52); fov = 80; }
        else { const k = K(t, LB.real4, LB.question, (x) => x); pos = lbV([-0.8, 1.62, -6.0], [-1.0, 1.62, -6.8], k); at = lbAim(pos, 222, 22); fov = 58; }
      }
      look(pos, at, fov, t, drift, roll);
      // ------------------------------------------------------------------ the sky, then the light
      const st = sky.update(s, cam, app.renderH || 1080, Object.assign({ fade2 }, sk));
      const c = shadowC || [cam.position.x, 0, cam.position.z - 3];
      const k1 = st.k1, k2 = st.k2;
      sunLight(sun1L, st.L1 || L1, k1, c, shadowR, lift, gain);
      sunLight(sun2L, st.L2 || L2, k2, c, shadowR, lift, gain);
      const day = MathX.clamp(k1 * st.day1 + k2 * st.day2, 0, 3);
      // the Moon's light: before 10, a gibbous Moon; then its dark side's sliver; from 10:08:18 its day side, ×2
      const moonOn = sk.moonK ? (s < 0 ? 1 : s < LB_MOON.dayBack ? 0.15 * MathX.smooth(s, 1.5, 8) : 0.15 + 0.85 * lbSunGain(s - LB_MOON.dayBack)) : 0;
      moonL.intensity = 0.32 * moonOn * MathX.smooth(moonD.y, -0.02, 0.1);
      moonL.position.set(c[0] + moonD.x * 100, c[1] + moonD.y * 100, c[2] + moonD.z * 100); moonL.target.position.set(...c); moonL.target.updateMatrixWorld();
      S.hemi.intensity = (0.07 + 0.5 * Math.min(day, 2)) * amb;
      S.hemi.color.set('#2a3a5c').lerp(tmp.set('#b4c8e2'), MathX.clamp(day, 0, 1));
      S.hemi.groundColor.set('#120f0c').lerp(tmp.set('#5a5040'), MathX.clamp(day, 0, 1));
      scene.environmentIntensity = (0.03 + 0.55 * Math.min(day, 2)) * amb;
      // the lamps
      const flick = 0.9 + 0.1 * noise1(t * 7, 3) + 0.05 * noise1(t * 23, 5);
      spill.intensity = 9 * house; pendant.intensity = 5.5 * house; M.glassLit.emissiveIntensity = 1.25 * house;
      for (const f of P.neighbours || []) f.material.emissiveIntensity = house;
      for (const p of strings) p.intensity = 1.1 * lamps; for (const b of P.bulbs) b.visible = lamps > 0.5;
      street.light.intensity = 26 * lamps; street.lensM.color.set(lamps > 0.5 ? '#ffe6c0' : '#3a3c3e');
      candle.intensity = 1.1 * lantern * flick * (dim ? 1.6 : 1); flame.visible = lantern > 0; fl.scale.set(0.007, 0.018 * flick, 0.007);
      { const W = new THREE.Vector3(); fl.getWorldPosition(W); candle.position.copy(W); }
      // (the replay: everything but the candle down to almost nothing)
      if (dim) {
        sun1L.intensity = sun2L.intensity = moonL.intensity = 0; S.hemi.intensity = 0.015; scene.environmentIntensity = 0.0;
        spill.intensity = pendant.intensity = 0; for (const p of strings) p.intensity = 0; street.light.intensity = 0;
        sky.domeU.uK.value = 0.04; sky.starU.uK.value = 0; if (sky.moon) sky.moonU.uK.value = 0;
      }
      // the solar panels: next door's roof (the glint when a sun is on it)
      panels.visible = true;
      // the cat: asleep on the wall at night, sat up and squinting by day; the robin sings in daylight
      if (catRoot.visible) { const dz = day > 0.3; cat.pose(dz ? lbCatBlend(LB_CAT_POSES.sit, LB_CAT_POSES.alert, 0.6) : LB_CAT_POSES.loaf, t); }
      if (robin.g.visible) { const ph = ((t - LB.robin) % 2.7 + 2.7) % 2.7, sing = day > 0.3 && ph > 0.2 && ph < 1.6 ? Math.max(0, Math.sin(ph * 27)) : 0; robin.open(sing); robin.head.rotation.y = 0.3 * Math.sin(t * 0.8); robin.head.rotation.x = -0.2 * sing; }
      cardImgM.color.setScalar(1.6 * k2 * (shade.visible ? 1 : 0) + 0.001);
      photons.end();
      this._st = st; this._s = s; this._day = day; this._dim = dim;
    },
    labels(t) {
      const m = lbShotAt(t).mode, out = [], W = StoryHUD.win;
      const star = (n, mir = true) => sky.at(n, 400, mir);
      if (m === 'sirius') out.push({ p: star('SIRIUS'), text: 'SIRIUS', sub: 'THE BRIGHTEST STAR', a: W(t, lbCap('sirius', 1).show, LB.mirror - 0.3, 0.3, 0.2) });
      if (m === 'mirror') out.push({ p: star('ARCTURUS'), text: 'ARCTURUS', sub: 'IT SET AT 7:40 PM, IN THE NORTH-WEST', a: W(t, lbCap('mirror', 1).show + 0.3, LB.replay - 0.3, 0.3, 0.2) });
      if (m === 'canopus') out.push({ p: star('CANOPUS'), text: 'CANOPUS', sub: 'NEVER SEEN FROM BRITAIN', a: W(t, lbCap('canopus', 0).show + 0.3, LB.north - 0.3, 0.3, 0.2) });
      if (m === 'north') out.push({ p: lbAim([0, 0, 0], 226, 13, 400), text: 'SOUTH-WEST', sub: 'THE FIRST AIR TO GET THE LIGHT BACK', a: W(t, LB.north + 0.8, LB.switchCut - 0.3, 0.3, 0.2) });
      if (m === 'midnight' && t > lbCap('midnight', 2).show) out.push({ p: [10.2, 7.9, 1.2], text: 'SOLAR PANELS', sub: 'MIDNIGHT · MAKING POWER', a: W(t, lbCap('midnight', 2).show + 0.2, LB.sunrise - 0.3, 0.3, 0.2) });
      if (m === 'real' && t < lbCap('real2', 0).show + 2.6) out.push({ p: sky.at('MOON', 400), text: 'MOONLIGHT', sub: '1.3 SECONDS OLD', a: W(t, lbCap('real2', 1).show - 0.6, lbCap('real2', 0).show + 2.5, 0.3, 0.15) });
      if (m === 'real' && t > lbCap('real2', 0).show + 2.6 && t < LB.real3) {
        const a = W(t, lbCap('real2', 0).show + 2.9, LB.real3 - 0.2, 0.3, 0.2);
        out.push({ p: star('VEGA', false), text: 'VEGA', sub: 'LEFT IT 25 YEARS AGO', a });
        out.push({ p: star('ALTAIR', false), text: 'ALTAIR', sub: '17 YEARS AGO', a });
        out.push({ p: star('DENEB', false), text: 'DENEB', sub: 'OVER 1,000 YEARS AGO', a });
      }
      if (m === 'sunrise' && t < lbCap('sunrise', 2).show - 0.4) {
        out.push({ p: sky.at('SUN', 400), text: 'THE SUN', sub: 'RISING', a: W(t, LB.sunrise + 0.8, lbCap('sunrise', 2).show - 0.5, 0.3, 0.2) });
        out.push({ p: sky.at('SUN2', 400), text: 'THE 2ND SUN', sub: 'SETTING', a: W(t, lbCap('sunrise', 1).show + 2.6, lbCap('sunrise', 2).show - 0.5, 0.3, 0.2) });
      }
      return out;
    },
    grade(t, p, shot) {
      const m = shot.mode, day = this._day || 0;
      p.exposure = lbLerp(1.55, 1.0, MathX.clamp(day, 0, 1)) - 0.08 * MathX.clamp(day - 1, 0, 2);
      p.bloom = lbLerp(0.42, 0.3, MathX.clamp(day, 0, 1)); p.warmth = day > 0.3 ? 0.01 : -0.02; p.saturation = lbLerp(0.9, 1.04, MathX.clamp(day, 0, 1));
      if (m === 'crescent' || m === 'moonwhy' || m === 'full') { p.vignette = 0.35; p.bloom = 0.2; p.exposure = day > 0.3 ? 1.0 : 1.2; }
      if (m === 'past') { p.exposure = 1.0; p.bloom = 0.22; p.vignette = 0.3; p.saturation = 1.1; }
      if (m === 'replay') { p.exposure = 1.25; p.bloom = 0.6; p.bloomThreshold = 0.6; p.vignette = 0.75; }
      if (m === 'noon') { p.exposure = 0.94; p.bloom = 0.5; p.saturation = 0.96; p.contrast = 1.02; }
      if (m === 'sunrise') { p.warmth = 0.03; p.exposure = 0.8; p.saturation = 1.12; }
    },
  };
  return set;
};
const LB_GARDEN = {};
