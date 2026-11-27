/* =====================================================================
   BOSTON SET — "In Boston, they hear the bang." (shot W3): the Esplanade on a cold November morning, the Charles
   River, the Back Bay towers (the Prudential, 200 Clarendon), Cambridge across the water. You pass 130 km to the
   north-west, 15–25 km up, a streak low in the sky; the people on the river path look up, point, film.
   (The bang itself reaches Boston about six minutes later: the sound has 130 km to come.)
   The streak is drawn where you really are: twSkyPos (sky.js) seen from Boston (its own up, the Earth's curve).
   ===================================================================== */

TW_SETS.bos = (app) => {
  const S = twSet(app, { sky: '#a8c4e2', fog: 0.00018, fogColor: '#c8d6e4', fov: 46, near: 0.1, far: 30000, hemi: ['#d6e4f2', '#7a7060', 1.0],
    sun: TW_SUN.map((v) => v * 300), sunColor: '#fff0dc', sunI: 2.6, shadow: 2048, shadowR: 40, env: ['#a8c8ea', '#d8dee6', '#6a6258'] });
  const scene = S.scene, cam = S.camera;
  twGradSky(scene, '#4a86d0', '#d2e2f0', '#9fb4c4', { r: 20000, sunDir: TW_SUN, sunGlow: '#ffe6bc', hw: 0.3 });
  // ---- the river (x east, z south; the camera on the Boston bank at z 0, the Charles to the north)
  const waterM = new THREE.MeshStandardMaterial({ color: '#2c5a74', roughness: 0.2, metalness: 0.1, envMapIntensity: 1.0 });
  for (let x = -6000; x < 6000; x += 500) for (let z = -3000; z < 20; z += 500) twBox(500, 0.02, Math.min(500, 20 - z), waterM, x + 250, -0.6, z + Math.min(500, 20 - z) / 2, scene).castShadow = false;
  const grassM = twStd('#5a7a3e', 0.95), pathM = twStd('#a49c8c', 0.9), bankM = twStd('#8a8274', 0.9);
  // the Esplanade: a stone edge, the path, the grass, the trees; the Back Bay behind
  for (let x = -3000; x < 3000; x += 50) { twBox(50, 1.2, 1.0, bankM, x + 25, -0.0, 0.5, scene); twBox(50, 0.1, 4, pathM, x + 25, 0.55, 3, scene); twBox(50, 0.1, 60, grassM, x + 25, 0.52, 35, scene); }
  const ground = twStd('#8a8478', 0.92); for (let x = -3000; x < 3000; x += 100) for (let z = 65; z < 1600; z += 100) twBox(100, 0.1, 100, ground, x + 50, 0.45, z + 50, scene).castShadow = false;
  // a floating dock out in the river, and its gangway
  { const dm = twStd('#7a6a56', 0.85); twBox(40, 0.3, 16, dm, -4, 0.22, -23, scene); twBox(3, 0.2, 14, dm, 2, 0.3, -9, scene); }
  // Cambridge's bank (north) and its ground
  for (let x = -3000; x < 3000; x += 50) twBox(50, 1.2, 1, bankM, x + 25, 0, -620, scene);
  for (let x = -3000; x < 3000; x += 100) for (let z = -2000; z < -620; z += 100) twBox(100, 0.1, 100, ground, x + 50, 0.45, z + 50, scene).castShadow = false;
  // the buildings: instanced boxes with the city's window material (windows drawn per box)
  const mat = twBuildingMat({ glass: '#5a7890', key: 'bos' }), B = twBoxes(scene, mat, 600, { base: true });
  const r = new RNG(42);
  // Back Bay: brownstones along the river, towers behind
  for (let x = -1800; x < 1200; x += 22) B.add(x, 0.45, 95 + r.range(0, 8), 20, r.range(14, 22), 18, 0, r.pick(['#8a5a44', '#9a6a50', '#7a4a3a', '#a08068', '#b09478']));
  for (let k = 0; k < 120; k++) { const x = r.range(-2200, 1600), z = r.range(160, 1400), h = r.range(18, 60) * (r.next() < 0.15 ? 2.2 : 1); B.add(x, 0.45, z, r.range(22, 50), h, r.range(22, 50), 0, r.pick(['#b8b0a2', '#a89a88', '#8a7a6a', '#c8c0b4', '#9aa4ac'])); }
  const pru = [-650, 520], han = [-300, 700];
  B.add(pru[0], 0.45, pru[1], 48, 228, 48, 0, '#a8aab0'); B.add(pru[0], 0.45, pru[1], 70, 30, 70, 0, '#9a9ca2');
  for (const [x, z, h, w] of [[-950, 420, 120, 40], [-120, 380, 110, 36], [150, 560, 150, 40], [-420, 980, 130, 38], [380, 900, 180, 44], [700, 1150, 200, 46], [-1300, 700, 90, 40]]) B.add(x, 0.45, z, w, h, w, 0, r.pick(['#9aa8b4', '#b8b4ac', '#8a96a2']));
  // downtown, down the river to the east: the Financial District's towers
  for (const [x, z, h, w] of [[2300, 120, 240, 46], [2420, 260, 200, 40], [2180, 330, 170, 44], [2560, 60, 185, 42], [2050, 180, 140, 38], [2680, 300, 150, 40], [2480, -60, 120, 36], [1950, 420, 110, 40], [2800, 140, 130, 44], [2250, -120, 95, 34]])
    B.add(x, 0.45, z, w, h, w * (0.8 + 0.2 * twR(x, 5)), 0, r.pick(['#9aa8b4', '#b8b4ac', '#8a96a2', '#7f93a6']));
  // Cambridge: low brick, MIT's buildings and the Great Dome
  for (let k = 0; k < 160; k++) { const x = r.range(-2600, 1800), z = r.range(-1900, -680); B.add(x, 0.45, z, r.range(20, 60), r.range(10, 32), r.range(20, 50), 0, r.pick(['#8a5a44', '#a89a88', '#c8c0b0', '#7a4a3a'])); }
  B.done();
  {
    const hm = new THREE.MeshPhysicalMaterial({ color: '#7fa0bc', roughness: 0.05, metalness: 0.9, envMapIntensity: 1.6 });
    const sh = new THREE.Shape([[-30, -12], [30, -6], [30, 12], [-30, 6]].map(([a, b]) => new THREE.Vector2(a, b)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: 241, bevelEnabled: false, steps: 12 }); g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, hm); m.position.set(han[0], 0.45, han[1]); m.rotation.y = 0.5; m.castShadow = true; scene.add(m);
    twCyl(1, 1.5, 70, twStd('#d8d8d8', 0.5, 0.5), pru[0], 228 + 35, pru[1]);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(16, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), twStd('#c8c4b8', 0.6)); dome.position.set(-700, 28, -760); scene.add(dome);
    twCyl(16.5, 16.5, 6, twStd('#d4d0c4', 0.6), -700, 25, -760); twBox(100, 26, 30, twStd('#d4d0c4', 0.7), -700, 13, -745, scene);
    for (let k = -4; k <= 4; k++) twCyl(1.0, 1.0, 14, twStd('#e8e4d8', 0.6), -700 + k * 3.4, 19, -728, scene, 10);
  }
  // the Esplanade's trees, bare in late November: a trunk and a few forked branches each (one instanced mesh)
  {
    const g = new THREE.CylinderGeometry(0.5, 1, 1, 6); g.translate(0, 0.5, 0);
    const im = new THREE.InstancedMesh(g, twStd('#3e3630', 0.9), 70 * 13), M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    let k = 0;
    const put = (x, y, z, r, len, tilt, yw) => { e.set(tilt, yw, 0, 'YXZ'); q.setFromEuler(e); M4.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(r, len, r)); im.setMatrixAt(k++, M4); };
    for (let x = -600, i = 0; x < 400; x += 16, i++) {
      const z = 8 + 3 * twR(i, 2), h = 3.2 + twR(i, 3);
      put(x, 0.5, z, 0.24, h, 0, 0);
      for (let b = 0; b < 6; b++) {
        const yw = b * 1.05 + twR(i, 4 + b) * 0.8, tilt = 0.5 + twR(i, 11 + b) * 0.35, len = 2.6 + twR(i, 20 + b) * 1.6, y = 0.5 + h * (0.75 + 0.05 * b);
        put(x, y, z, 0.09, len, tilt, yw);
        // a fork near the branch's end
        const ex = x + Math.sin(yw) * Math.sin(tilt) * len * 0.7, ey = y + Math.cos(tilt) * len * 0.7, ez = z + Math.cos(yw) * Math.sin(tilt) * len * 0.7;
        if (b % 3 !== 2) put(ex, ey, ez, 0.04, len * 0.55, tilt * 0.5, yw + 0.6);
      }
    }
    im.count = k; im.castShadow = true; im.receiveShadow = true; scene.add(im);
  }
  // ---- the people on the river path: they look up to the north-west, point, film
  const spec = [], add = (look, x, z, yaw, script) => spec.push({ look, x, z, yaw, script, y: 0.42 });
  const t0 = 185.3;
  [['twA', -6.0, -22.0, -1.9], ['twC', -4.6, -23.6, -1.75], ['twE', -7.4, -24.0, -2.0], ['casual2', -3.2, -21.6, -1.6], ['twH', -2.0, -24.4, -1.7], ['twD', -8.6, -21.6, -2.0], ['casual5', -5.2, -26.0, -1.8], ['twG', -9.4, -20.0, -1.85], ['casual8', -1.0, -20.4, -2.1]].forEach(([look, x, z, yaw], i) =>
    add(look, x, z, yaw, [[-1, 'idle'], [t0 + 0.25 + 0.2 * i, 'lookUp', 0.2], [t0 + 1.2 + 0.25 * i, i % 3 === 0 ? 'pointUp' : i % 3 === 1 ? 'filmUp' : 'lookUp', 0.1]]));
  const crowd = twCrowd(scene, spec);
  // ---- you, as Boston sees you: a point of fire and a white trail, low in the north-west
  const soft = twPuffs(scene, 3000, { soft: 1.3 }), adds = twPuffs(scene, 3000, { additive: true, soft: 1.6 });
  const [bx, bz] = twLL(42.355, -71.075), bgr2 = bx * bx + bz * bz, by = -bgr2 / (TW_R + Math.sqrt(TW_R * TW_R - bgr2));
  const up = new THREE.Vector3(bx, TW_R + by, bz).normalize(), north0 = new THREE.Vector3(0, 0, -1), east = new THREE.Vector3().crossVectors(north0, up).normalize();
  const north = new THREE.Vector3().crossVectors(up, east).normalize();
  // direction (Boston's x east, y up, z south) to your position at time te, and the distance
  const dirTo = (te) => { const A = twSkyPos(te), v = new THREE.Vector3(A[0] - bx, A[1] - by, A[2] - bz), d = v.length(); v.normalize(); return [[v.dot(east), v.dot(up), -v.dot(north)], d]; };
  const SKYR = 2500, KS = 4.5 * SKYR / 12000;   // (drawn 2.5 km out, scaled to look the same: the haze would swallow it further out)
  const set = {
    scene, camera: cam,
    frame(t, shot) {
      const u = t - shot.t0;
      crowd.frame(t, null);
      soft.begin(); adds.begin();
      const [D, dist] = dirTo(t), ang = 1 / dist;   // (1 m at the distance → ang radians)
      // the fireball: tiny in truth (130 km away), but blindingly bright: drawn as a glare
      const fx = D[0] * SKYR, fy = D[1] * SKYR, fz = D[2] * SKYR;
      adds.add(fx, fy, fz, 220 * KS, 1, 1.0, 0.9, 0.7); adds.add(fx, fy, fz, 520 * KS, 0.5, 1.0, 0.6, 0.3);
      for (let j = 1; j < 220; j++) {
        const te = t - j * 0.012, [Dj] = dirTo(te), age = j * 0.012;
        const x = Dj[0] * SKYR, y = Dj[1] * SKYR, z = Dj[2] * SKYR;
        adds.add(x, y, z, 160 * KS, 0.7 * Math.exp(-age / 0.5), 1.0, 0.7, 0.35);
        adds.add(x, y, z, 90 * KS, 0.3 * Math.exp(-age / 1.6), 1.0, 0.86, 0.62);   // (the hot, glowing trail)
        soft.add(x, y + age * 20 * KS, z, (100 + age * 120) * KS, 0.75 * Math.exp(-age / 4) * MathX.smooth(age, 0.05, 0.4), 0.78, 0.78, 0.8);
      }
      soft.end(); adds.end();
      // the cameras. boston: the faces on the dock, looking up past you (downtown behind them).
      // bosSky: over their shoulders, the streak low in the west, rising and racing north
      if (shot.mode === 'boston') {
        const p = [-14 + 0.3 * u, 1.62, -25.6 + 0.1 * u];
        twCam(cam, p, [-6, 1.9, -23.2], 33);
      } else {
        const [De] = dirTo(Math.min(t + 0.25, shot.t1)), yw = Math.atan2(-De[0], -De[2]) + 0.16, pitch = 0.035 + De[1] * 0.75;
        const p = [3.0 - 0.25 * u, 1.5, -20.6];
        twCam(cam, p, [p[0] - Math.sin(yw) * 100, p[1] + Math.tan(pitch) * 100, p[2] - Math.cos(yw) * 100], 48);
      }
      twShadowFollow(S.sun, [0, 0, 4], 40, 2048, 400);
      set._lab = { D, dist };
    },
    labels(t, shot) {
      const L = [], l = set._lab; if (!l) return L;
      if (shot.mode === 'boston') L.push({ p: [2300, 236, 120], text: 'BOSTON', sub: 'ABOUT 300 KM FROM YOUR DOOR', a: twWin(t, shot.t0 + 0.15, shot.t1, 0.25, 0.15) });
      else L.push({ p: [l.D[0] * SKYR, l.D[1] * SKYR, l.D[2] * SKYR], text: 'YOU', sub: Math.round(l.dist / 1000 / 10) * 10 + ' KM AWAY', a: twWin(t, shot.t0 + 0.35, shot.t1, 0.25, 0.15), you: true });
      return L;
    },
    grade(t, p) { p.exposure = 1.03; p.saturation = 1.1; p.bloom = 0.5; p.bloomThreshold = 0.85; p.warmth = 0.03; },
  };
  return set;
};
