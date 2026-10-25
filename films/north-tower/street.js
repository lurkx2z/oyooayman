/* =====================================================================
   STREET — 9:50 to 10:29, outside: up the stairs by 5 World Trade Center onto Vesey Street, round the corner onto
   Church Street, walking north (as the police told everyone to). Both towers burning above the street. 9:58:59:
   the South Tower comes down; its cloud fills the street and day turns to night. Then the grey: dust on everything,
   paper falling. Further north, at 10:28, the North Tower falls.
   The collapses are seen as they were seen from the street: from blocks away, through smoke, the towers going
   into their own clouds. Nobody falls; nobody is hurt on screen.
   Modes: five · back · roar · cloud · grey · walk · fall
   ===================================================================== */

Object.assign(LOOKS, {
  ntAsh1: { skin: 5, build: 'avg', shirt: '#b9b6ae', sleeves: 'long', pants: '#9a978f', shoes: '#8a8780', sole: '#77746e', hair: '#a8a59e', collar: true },
  ntAsh2: { skin: 5, build: 'slim', shirt: '#c4c1b9', sleeves: 'long', pants: '#a3a098', shoes: '#8f8c85', sole: '#7a7771', hair: '#9f9c95', hairStyle: 'long', shoulderBag: '#8d8a83' },
  ntAsh3: { skin: 5, build: 'broad', shirt: '#aeaba3', sleeves: 'long', pants: '#97948c', shoes: '#86837c', sole: '#75726c', hair: '#b0ada6', jacket: true, collar: true, inner: '#cfccc4' },
  ntAsh4: { skin: 5, build: 'slim', shirt: '#bdbab2', sleeves: 'long', pants: '#9d9a92', shoes: '#8c8982', sole: '#78756f', hair: '#a5a29b', hairStyle: 'bun' },
});

const NT_CH = 185;                     // Church Street's centreline (x)
const NT_SB = { mark: 0 };             // (the South Tower's fall, and the North Tower's: see ntTopAt)
// how far a tower's top has come down (m) since it began to fall at t0: about 10–12 s, accelerating
function ntDropAt(t, t0, H, dur) { const a = t - t0; if (a <= 0) return 0; return Math.min(H + 5, H * Math.pow(a / dur, 1.7)); }

NT_SETS.street = (app) => {
  const S = ntSet(app, { sky: '#6f9fd2', fov: 60, near: 0.1, far: 9000, hemi: ['#d8e2ee', '#5f5a52', 0.8], sun: [-80 + 200 * 0.8, 260, -400 + 200 * 0.5], sunColor: '#fff2dc', sunI: 2.8, shadow: 4096, shadowR: 140, shadowFar: 900, env: ['#7fb0e8', '#dfe8f0', '#6e6a64'] });
  const scene = S.scene;
  S.sun.position.set(NT_CH + NT_SUN[0] * 400, NT_SUN[1] * 400 + 40, -420 + NT_SUN[2] * 400); S.sun.target.position.set(NT_CH, 0, -420);
  scene.fog = new THREE.FogExp2('#c9d6e2', 0.0004);
  const sky = ntSky(scene, '#2464b8', '#cfdeea', '#9db0c0', { sunDir: NT_SUN, sunGlow: '#fff2d8', hw: 0.3 });
  ntCity(scene, { r: 2400, skip: (x, z) => ntNearWTC(x, z) || Math.abs(x - NT_CH) < 60 || (z < -150 && z > -240 && x > -120 && x < 240), seed: 1001, scale: 0.9 });
  ntPlaza(scene);
  const N = ntTower(scene, NT_TW.N, { antenna: true }), SO = ntTower(scene, NT_TW.S, {});
  // ---- Church Street: a canyon of buildings both sides from Vesey (z = −170) north, cross streets every 80 m
  const A = [0, 1, 2, 3].map(() => ({ pos: [], nor: [], uv: [], idx: [] })), r = new RNG(311);
  for (const side of [-1, 1]) for (let z = -175; z > -1300; z -= 80) {
    let zz = z;
    while (zz > z - 62) { const d = 12 + r.next() * 18, h = 22 + Math.pow(r.next(), 1.6) * 110, x0 = NT_CH + side * 15, x1 = NT_CH + side * (15 + 25 + r.next() * 15); ntBoxInto(A[Math.floor(r.next() * 4)], Math.min(x0, x1), Math.max(x0, x1), 0, h, zz - d, zz); zz -= d + 0.4; }
  }
  // Vesey Street's north side (and 7 World Trade Center, 47 floors) from the plaza to Church Street
  for (let x = -110; x < 165; x += 30 + r.next() * 10) ntBoxInto(A[Math.floor(r.next() * 4)], x, x + 28, 0, x < 60 && x > -90 ? 174 : 30 + r.next() * 60, -240, -196);
  const fac = [['#a59d90', '#3e4146'], ['#8c8378', '#33363a'], ['#b5ae9f', '#4d5359'], ['#7d6352', '#2c2826']].map(([b, w], k) => new THREE.MeshStandardMaterial({ map: ntWindowTex(71 + k, b, w, 0.06), roughness: 0.8 }));
  A.forEach((a, k) => { const m = new THREE.Mesh(ntGeoFrom(a), fac[k]); m.castShadow = m.receiveShadow = true; scene.add(m); });
  // the street, the sidewalks, the kerbs
  const road = ntBox(26, 0.1, 1400, ntStd('#3a3a3c', 0.9), NT_CH, 0.0, -820); road.castShadow = false;
  for (const sx of [-1, 1]) { const sw = ntBox(5, 0.18, 1400, ntStd('#8b8780', 0.9), NT_CH + sx * 13, 0.09, -820); sw.castShadow = false; }
  const vesey = ntBox(320, 0.1, 22, ntStd('#3a3a3c', 0.9), 40, 0.0, -180); vesey.castShadow = false;
  // the stairs up out of the concourse by 5 WTC (you come up them)
  for (let k = 0; k < 12; k++) ntBox(3.2, 0.17, 0.32, ntStd('#8e8a84', 0.85), 140, -4 + k * 0.17 + 0.085, -160 - k * 0.32);
  ntBox(0.2, 1, 4, ntStd('#555', 0.5, 0.6), 138.3, 0.5, -162); ntBox(0.2, 1, 4, ntStd('#555', 0.5, 0.6), 141.7, 0.5, -162);
  // parked cars along the kerbs (and their dusty twins for the grey)
  const VF = new VehicleFactory(), cars = [], ash = [];
  const carCols = ['#6a1e22', '#1d2a3a', '#d8d4cc', '#2a2c2e', '#c8b27a', '#3b4a3a'];
  for (let i = 0; i < 18; i++) {
    const type = ['sedan', 'taxi', 'suv', 'van', 'sedan', 'taxi'][i % 6], side = i % 2 ? 1 : -1, z = -200 - i * 34 - (i % 3) * 6;
    const c = VF.build(type, type === 'taxi' ? '#e8b923' : carCols[i % 6]); c.group.position.set(NT_CH + side * 9.2, 0, z); c.group.rotation.y = Math.PI / 2 + (side > 0 ? 0 : Math.PI); scene.add(c.group); cars.push(c.group);
    const d = VF.build(type, '#a9a69f'); d.group.position.copy(c.group.position); d.group.rotation.copy(c.group.rotation); d.group.visible = false; scene.add(d.group); ash.push(d.group);
  }
  // ---- smoke, fire, the dust clouds, paper
  const puffs = ntPuffs(scene, 5200), fire = ntPuffs(scene, 300, { additive: true }), near = ntPuffs(scene, 2400), flakes = ntPuffs(scene, 1600, { additive: false });
  const smoke = ntSmokeSources().map((s) => Object.assign({}, s, { life: 70 }));
  const NPAP = 500, paper = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.22, 0.28), new THREE.MeshStandardMaterial({ color: '#efece4', roughness: 0.9, side: THREE.DoubleSide }), NPAP);
  paper.frustumCulled = false; scene.add(paper);
  // ---- people: on the street (normal colours) and, after the cloud, the grey ones
  const crowd = Array.from({ length: 16 }, (_, i) => ntPerson(scene, 'st' + i, NT_LOOKS[(i * 7 + 5) % NT_LOOKS.length]));
  const grey = Array.from({ length: 10 }, (_, i) => ntPerson(scene, 'gr' + i, ['ntAsh1', 'ntAsh2', 'ntAsh3', 'ntAsh4'][i % 4]));
  const cop = ntPerson(scene, 'stcop', 'ntNYPD');
  const cam = S.camera;
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1);

  // the towers coming down: the body is cut at the falling top; the cloud grows round the front and spreads
  const tS = NT.roar + 1.2, tN = NT.fall + 0.6, DUR_S = 10, DUR_N = 12;
  function towerTop(T, m, t, t0, dur) {
    const drop = ntDropAt(t, t0, T.roof, dur), top = T.roof - drop;
    const hb = Math.max(0.01, top - 22);
    m.body.scale.y = hb / (T.roof - 22); m.body.position.y = 22 + hb / 2;
    m.g.children.forEach((c) => { if (c !== m.body && c.position.y > 22) c.visible = c.position.y < top; });
    m.g.visible = top > 3;
    return top;
  }
  // the collapse cloud of a tower: a column round the falling front, then a surge along the ground
  function collapseCloud(P, t, T, t0, top, k = 1) {
    const a = t - t0; if (a < 0) return;
    const n = 900;
    for (let i = 0; i < n; i++) {
      const h = hash1(i * 7 + 1 + T.x), h2 = hash1(i * 11 + 2), h3 = hash1(i * 13 + 3), born = h * 14, b = a - born * 0.7;
      if (b < 0) continue;
      const ang = h2 * Math.PI * 2, out = 30 + b * (6 + 10 * h3), y0 = Math.max(10, T.roof * (1 - Math.pow(Math.min(1, born / 11), 1.7)));
      const y = Math.max(8, y0 - b * 3) + 18 * Math.sin(b * 0.2 + i), sz = 30 + b * 6 + h3 * 30;
      const c = 0.62 + 0.18 * h3;
      P.add(T.x + Math.cos(ang) * out + NT_WIND[0] * b * 0.6, y, T.z + Math.sin(ang) * out + NT_WIND[2] * b * 0.6, sz, 0.32 * k * MathX.smooth(b, 0, 1.5), c, c * 0.95, c * 0.88);
    }
  }
  // the surge up Church Street: a rolling wall, its front at zf (m) by the time t; ~ 14 m/s, slowing
  const surgeFront = (t) => { const a = t - (tS + 4); return a < 0 ? 200 : 100 - 420 * (1 - Math.exp(-a / 22)) - a * 2; };

  function view(t, s) {
    const u = (a, b) => MathX.clamp((t - a) / (b - a), 0, 1);
    switch (s.mode) {
      case 'five': { const k = u(NT.five, NT.back); const P = ntSpline([[0, 140, -2.4, -160], [0.28, 140, 0.1, -164.5], [0.6, 160, 0.1, -176], [1, NT_CH - 4, 0.1, -205]], k); const Q = ntSpline([[0, 140, 0, -175], [0.3, 160, 1.2, -178], [0.7, NT_CH, 1.4, -200], [1, NT_CH - 3, 1.4, -260]], Math.min(1, k + 0.12)); return [[P[0], P[1] + 1.6, P[2]], Q, 60]; }
      case 'back': { const k = u(NT.back, NT.roarShot); return [[NT_CH - 3, 1.6, -262 - 4 * k], ntV([NT_CH - 3, 1.5, -330], [40, 260 + 20 * k, 30], Ease.inOutSine(MathX.smooth(k, 0, 0.35))), 64]; }
      case 'roar': { const k = u(NT.roarShot, NT.cloud), run = MathX.smooth(t, ntCap('nine59', 2).show - 0.3, ntCap('nine59', 2).show + 1.2), z = -330 - run * (t - ntCap('nine59', 2).show) * 3.4; return [[NT_CH - 2, 1.6, Math.min(-330, z)], ntV([60, 150 - 40 * k, 60], [NT_CH - 2, 1.4, -500], run), 60]; }
      case 'cloud': { const z = -350 - (t - NT.cloud) * 1.2; return [[NT_CH - 2, 1.55, z], [NT_CH - 1, 1.4, z - 10], 62]; }
      case 'grey': { const k = u(NT.grey, NT.walk), z = -380 - k * 9; return [[NT_CH - 3, 1.6, z], [NT_CH - 6 + 10 * k, 3 + 4 * k, z - 30], 60]; }
      case 'walk': { const k = u(NT.walk, NT.fallShot), z = -560 - k * 7, look = MathX.smooth(k, 0.3, 0.75); return [[NT_CH - 3, 1.6, z], ntV([NT_CH - 3, 1.6, z - 40], [10, 200, 0], look), 58]; }
      case 'fall': return [[NT_CH + 6, 1.6, -980], [20, 150, 0], 46];
    }
    return [[NT_CH, 1.6, -300], [0, 100, 0], 60];
  }

  return {
    scene, camera: cam,
    cuts() { return []; },
    frame(t, s) {
      const [p, at, fov] = view(t, s);
      const run = s.mode === 'roar' ? MathX.smooth(t, ntCap('nine59', 2).show - 0.3, ntCap('nine59', 2).show + 1.2) : 0;
      const rumble = MathX.smooth(t, tS - 0.5, tS + 2) * (1 - MathX.smooth(t, tS + 14, tS + 20)) + MathX.smooth(t, tN, tN + 2) * (1 - MathX.smooth(t, tN + 13, tN + 18)) * 0.35;
      const d = ntDrift(t, 0.015 + 0.03 * run, 0.5 + run, 31), shk = [noise1(t * 21, 1) * 0.02 * rumble, noise1(t * 23, 2) * 0.02 * rumble + Math.abs(Math.sin(t * 9)) * 0.05 * run];
      ntCam(cam, [p[0] + d[0] + shk[0], p[1] + d[1] + shk[1], p[2] + d[2]], at, fov, 0.6 * noise1(t * 0.4, 5) + 1.2 * run * Math.sin(t * 4.5));
      // the towers
      const sTop = towerTop(NT_TW.S, SO, t, tS, DUR_S), nTop = towerTop(NT_TW.N, N, t, tN, DUR_N);
      // smoke, fire; after 9:59 the dust over everything
      puffs.begin(); fire.begin();
      for (const src of smoke) {
        if (src.tower === 'S' && t > tS) continue;
        if (src.tower === 'N' && t > tN) continue;
        ntPlume(puffs, t, src, { fire });
      }
      collapseCloud(puffs, t, NT_TW.S, tS, sTop, 1);
      collapseCloud(puffs, t, NT_TW.N, tN, nTop, 1.1);
      puffs.end(); fire.end();
      // the surge at street level (Church Street): a rolling grey-brown wall, and inside it, thick dark dust
      near.begin();
      const zf = surgeFront(t);
      if (t > tS + 3) for (let i = 0; i < 1400; i++) {
        const h = hash1(i * 17 + 1), h2 = hash1(i * 19 + 2), h3 = hash1(i * 23 + 3);
        const z = zf + h * 140, x = NT_CH + (h2 - 0.5) * 44, y = 1 + Math.pow(h3, 1.5) * (14 + (z - zf) * 0.35), sz = 6 + h3 * 10 + (z - zf) * 0.05;
        const c = 0.52 + 0.14 * h2;
        near.add(x + noise1(t * 0.3 + i, 2) * 3, y + Math.sin(t * 0.8 + i) * 1.2, z, sz, 0.55 * MathX.smooth(t, tS + 3, tS + 5), c, c * 0.94, c * 0.85);
      }
      // the dark inside, then the slow settling (the grey)
      const inside = s.mode === 'cloud' ? 1 : s.mode === 'grey' ? 1 - MathX.smooth(t, NT.grey, NT.grey + 8) * 0.7 : s.mode === 'walk' ? 0.25 : 0;
      if (inside > 0) for (let i = 0; i < 700; i++) {
        const h = hash1(i * 29 + 5), h2 = hash1(i * 31 + 6), h3 = hash1(i * 37 + 7), R = 2 + h * 40;
        const x = cam.position.x + (h2 - 0.5) * R * 2, z = cam.position.z - 2 - h * 45, y = 0.3 + h3 * 9;
        const c = s.mode === 'cloud' ? 0.38 + 0.1 * h3 : 0.66 + 0.06 * h3;
        near.add(x + noise1(t * 0.2 + i, 3) * 2, y, z, 3 + h3 * 6, 0.28 * inside, c, c * 0.95, c * 0.88);
      }
      near.end();
      // flakes of ash and paper drifting down (the grey)
      flakes.begin();
      const ashK = s.mode === 'cloud' ? 1 : s.mode === 'grey' ? 1 : s.mode === 'walk' ? 0.6 : s.mode === 'fall' ? 0.3 : 0;
      if (ashK > 0) for (let i = 0; i < 1200; i++) {
        const h = hash1(i * 41 + 9), h2 = hash1(i * 43 + 10), h3 = hash1(i * 47 + 11), per = 9 + h * 6, a = ((t + h2 * per) % per) / per;
        flakes.add(cam.position.x + (h - 0.5) * 30, 12 - a * 12 + Math.sin(t + i) * 0.2, cam.position.z - 1 - h3 * 30, 0.02 + 0.03 * h2, 0.75 * ashK, 0.86, 0.85, 0.82);
      }
      flakes.end();
      const pK = s.mode === 'grey' || s.mode === 'walk' ? 1 : s.mode === 'back' || s.mode === 'five' ? 0.5 : 0;
      for (let i = 0; i < NPAP; i++) {
        const h = hash1(i * 53 + 1), h2 = hash1(i * 59 + 2), h3 = hash1(i * 61 + 3), per = 14 + h * 10, a = ((t + h2 * per) % per);
        if (pK > 0 && i < NPAP * pK) { _p.set(cam.position.x + (h - 0.5) * 50 + Math.sin(a * 0.6 + i) * 2, 24 - a * (24 / per) * 1.0, cam.position.z - 2 - h3 * 60); _e.set(a * 1.3 + i, a * 0.8, Math.sin(a * 1.7 + i)); _q.setFromEuler(_e); }
        else _p.set(0, -999, 0);
        _m.compose(_p, _q, _s); paper.setMatrixAt(i, _m);
      }
      paper.instanceMatrix.needsUpdate = true;
      // after the cloud, the street is grey
      const g = t > NT.cloud + 1;
      cars.forEach((c) => (c.visible = !g)); ash.forEach((c) => (c.visible = g));
      // people
      crowd.forEach((pp, i) => {
        if (g || s.mode === 'fall') { pp.root.visible = false; return; }
        const h = hash1(i * 7 + 2), side = (h - 0.5) * 22, z0 = -175 - i * 9 - h * 5;
        let z = z0 - (t - NT.five) * 1.1, act = 'walk', ph = (t - NT.five) * 1.1 / 1.32 * Math.PI * 2 + i;
        if (s.mode === 'back' && i % 3 === 0) { act = i % 2 ? 'ntLookUp' : 'ntLookBack'; z = z0 - (NT.back - NT.five) * 1.1; }
        if (s.mode === 'roar') { const rr = MathX.smooth(t, tS + 1.5 + h, tS + 3 + h); z = z0 - (NT.roarShot - NT.five) * 1.1 - Math.max(0, t - tS - 1.5 - h) * 4.2 * rr; act = rr > 0.3 ? 'jog' : 'ntLookBack'; ph = -z / 1.6 * Math.PI * 2; }
        ntPlace(pp, NT_CH + side, 0.15, z, 0, act, t + i, ph);
      });
      grey.forEach((pp, i) => {
        if (!g || s.mode === 'fall') { pp.root.visible = false; return; }
        const h = hash1(i * 13 + 4), z = cam.position.z - 4 - i * 4.5 - (t - NT.grey) * 0.9 * (0.6 + h * 0.6);
        ntPlace(pp, NT_CH + (h - 0.5) * 16, 0.15, z, 0, i % 3 ? 'walk' : 'ntCover', t + i, -z / 1.32 * Math.PI * 2);
      });
      if (s.mode === 'five' || s.mode === 'back') ntPlace(cop, NT_CH - 7, 0.15, -192, -2.2, 'ntWave', t); else cop.root.visible = false;
      // the light: the sun goes behind the dust
      const dark = s.mode === 'cloud' ? 1 : s.mode === 'grey' ? 1 - 0.6 * MathX.smooth(t, NT.grey, NT.grey + 9) : s.mode === 'walk' || s.mode === 'fall' ? 0.3 : s.mode === 'roar' ? MathX.smooth(t, NT.cloudHit - 1.5, NT.cloudHit + 0.4) : 0;
      S.sun.intensity = 2.8 * (1 - 0.9 * dark); S.hemi.intensity = 0.8 * (1 - 0.6 * dark);
      scene.fog.color.setRGB(0.79 - 0.4 * dark, 0.84 - 0.43 * dark, 0.89 - 0.5 * dark);
      scene.fog.density = 0.0004 + 0.09 * (s.mode === 'cloud' ? 1 : 0) + (s.mode === 'grey' ? 0.04 * (1 - MathX.smooth(t, NT.grey, NT.grey + 9)) + 0.004 : 0) + (s.mode === 'walk' ? 0.0025 : 0) + (s.mode === 'fall' ? 0.0007 : 0) + (s.mode === 'roar' ? 0.09 * MathX.smooth(t, NT.cloudHit - 1, NT.cloudHit + 0.3) : 0);
      scene.background.setRGB(0.44 - 0.2 * dark, 0.62 - 0.35 * dark, 0.82 - 0.5 * dark);
      sky.material.uniforms.k.value = 1 - 0.75 * dark;
    },
    grade(t, p, s) {
      p.exposure = 1.0; p.saturation = 0.98; p.contrast = 1.04; p.warmth = 0.03; p.bloom = 0.3; p.bloomThreshold = 0.9; p.vignette = 0.5; p.grain = 0.032;
      if (s.mode === 'cloud') { p.saturation = 0.35; p.exposure = 0.8; p.vignette = 0.8; p.grain = 0.06; p.warmth = 0.06; }
      if (s.mode === 'grey') { p.saturation = 0.25 + 0.15 * MathX.smooth(t, NT.grey, NT.walk); p.exposure = 0.92; p.grain = 0.045; }
      if (s.mode === 'walk' || s.mode === 'fall') { p.saturation = 0.55; p.grain = 0.04; }
      if (s.mode === 'roar') { const k = MathX.smooth(t, NT.cloudHit - 1.2, NT.cloudHit + 0.3); p.saturation = 0.98 - 0.6 * k; p.exposure = 1 - 0.25 * k; }
      if (s.mode === 'fall') p.fade = Math.max(p.fade, MathX.smooth(t, NT.out - 1.4, NT.out));
    },
    labels(t) {
      const s = ntShotAt(t), W = StoryHUD.win;
      if (s.mode === 'back') return [
        { p: [0, 330, 0], text: 'THE NORTH TOWER', sub: 'YOUR TOWER', a: W(t, ntCap('back', 1).show, NT.roarShot - 0.3, 0.5, 0.4) },
        { p: [NT_TW.S.x, 300, NT_TW.S.z], text: 'THE SOUTH TOWER', a: W(t, ntCap('back', 1).show + 0.4, NT.roarShot - 0.3, 0.5, 0.4) },
      ];
      return [];
    },
  };
};
