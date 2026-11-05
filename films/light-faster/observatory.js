/* =====================================================================
   OBSERVATORY SET — an old dome on a 2,200 m summit, 60 km inland: the coast is a dark line far below to the south.
   Inside: a 60 cm telescope on its fork, a stool, a desk, red battery lamps and the old mercury barometer on the wall.
     obsOut    the dome under the Milky Way, its slit open on Saturn (9:00:26 PM, ten times slower)
     baro      the barometer, close: a tap and the mercury trembles; ×1.32 at 6 °C it freezes (a third tap: nothing moves)
     scope     through the eyepiece: Saturn and its rings (9:07:32 PM), then nothing
     eyepiece  the astronomer sits back, looks up through the slit: where Saturn was
   Local axes are the world's (x east, y up, z south): the dome's floor is y 0, its centre the origin.
   ===================================================================== */

const LF_OB_SAT = lfSkyDir(0.35, -1.6);                                   // Saturn's direction tonight
const LF_OB_AZ = Math.atan2(LF_OB_SAT[0], -LF_OB_SAT[2]);               // its azimuth (0 = north, + = east)
const LF_OB_EL = Math.asin(LF_OB_SAT[1]);
// where the barometer hangs (on the inner wall, west-north-west), its frame: o (the mercury's top), n (into the room)
const LF_OB_BARO = (() => { const a = Math.atan2(LF_OB.baro[2], LF_OB.baro[0]), c = Math.cos(a), s = Math.sin(a), r = 6.7; return { a, o: [c * r, LF_OB.baro[1], s * r], n: [-c, 0, -s], side: [-s, 0, c] }; })();
// the mercury's surface: its rest height, the jiggle after each tap (a damped wobble), frozen from 27.95 s
const LF_OB_TAPS = [27.18, 27.6, 28.03];
function lfHgLevel(s) {
  const frz = LFP.sHgCold, f0 = Math.max(0, s - frz);
  let y = 0;
  for (const t of LF_OB_TAPS) if (s > t && t < frz) { const u = Math.min(s, frz) - t; y += 0.0011 * Math.exp(-u / 0.09) * Math.sin(u * 2 * Math.PI / 0.075); }
  // freezing: solid mercury is 3.6% denser: the column's top sinks a little as it solidifies
  return y - 0.0016 * lfSm(f0, 0, 0.6);
}

LF_SETS.obs = (app) => {
  const S = lfSet(app, { sky: '#02040a', fov: 50, near: 0.05, far: 12000, hemi: ['#4a5a7a', '#14120e', 0.0], env: ['#2a3040', '#101218', '#050506'] });
  const scene = S.scene, cam = S.camera, O = LF_OB;
  const sky = lfBuildSky(scene, {});
  // ---------------------------------------------------------------------------------------------------- the summit
  const rockC = (x, z, y) => { const n = noise1(x * 0.21 + z * 0.17, 9), r = Math.hypot(x, z); const g = r < 24 ? 0.16 : 0.1 + 0.05 * n; return [g * 1.05, g, g * 0.92]; };
  const groundY = (x, z) => {
    const r = Math.hypot(x, z), pad = -0.12 + 0.03 * noise1(x * 0.4 + z * 0.3, 3);
    if (r < 20) return pad;
    const u = r - 20, drop = 0.0035 * u * u + 0.04 * u, bumps = (1.2 + u * 0.03) * noise1(x * 0.06 + 3, z * 0.06 + 1) + 0.4 * noise1(x * 0.3, z * 0.3);
    return pad - drop * (1 + 0.35 * noise1(Math.atan2(z, x) * 3, 7)) + bumps * lfSm(u, 0, 10);
  };
  const xs = [...lfRange(-600, -60, 36), ...lfRange(-60, 60, 120).slice(1), ...lfRange(60, 600, 36).slice(1)];
  lfHeightMesh(xs, xs, groundY, lfStd('#ffffff', 0.96, 0, { vertexColors: true }), (x, z, y) => rockC(x, z, y));
  // rocks and scrub on the slopes (seeded, instanced)
  { const g = new THREE.IcosahedronGeometry(1, 0), m = new THREE.InstancedMesh(g, lfStd('#6a6660', 0.95), 260), M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    let n = 0; for (let i = 0; n < 260 && i < 2000; i++) { const a = lfR(i, 31) * 6.283, r = 21 + 70 * Math.pow(lfR(i, 32), 0.7), x = Math.cos(a) * r, z = Math.sin(a) * r, sc = 0.3 + 1.4 * Math.pow(lfR(i, 33), 2);
      if (Math.hypot(x - 14, z + 22) < 9) continue;
      q.setFromEuler(e.set(lfR(i, 34) * 3, lfR(i, 35) * 3, 0)); M4.compose(new THREE.Vector3(x, groundY(x, z) + sc * 0.25, z), q, new THREE.Vector3(sc * 1.2, sc * 0.7, sc)); m.setMatrixAt(n++, M4); }
    m.count = n; m.castShadow = true; m.receiveShadow = true; scene.add(m); }
  { const g = new THREE.IcosahedronGeometry(1, 1), m = new THREE.InstancedMesh(g, lfStd('#2c3226', 1), 400), M4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    let n = 0; for (let i = 0; n < 400 && i < 3000; i++) { const a = lfR(i, 41) * 6.283, r = 19 + 60 * Math.pow(lfR(i, 42), 0.8), x = Math.cos(a) * r, z = Math.sin(a) * r, sc = 0.25 + 0.4 * lfR(i, 43);
      if (Math.hypot(x - 14, z + 22) < 8) continue;
      M4.compose(new THREE.Vector3(x, groundY(x, z) + sc * 0.3, z), q, new THREE.Vector3(sc * 1.3, sc * 0.6, sc * 1.3)); m.setMatrixAt(n++, M4); }
    m.count = n; m.receiveShadow = true; scene.add(m); }
  // the far ridges (a ring at 8 km: the inland range to the north, the coastal plain sinking away to the south), and
  // the coast's last lights, 60 km off and 2,200 m below (directions only: they sit on the ring)
  { const N = 512, P = [], I = [], R = 8000;
    for (let i = 0; i <= N; i++) { const az = i / N * Math.PI * 2, x = Math.sin(az), z = -Math.cos(az), north = Math.max(0, -z);
      const el = -0.026 + north * (0.012 + 0.03 * Math.max(0, noise1(az * 4, 2)) + 0.012 * noise1(az * 17, 5)) + (1 - north) * 0.004 * noise1(az * 9, 3);
      P.push(x * R, Math.tan(el) * R, z * R, x * R, -0.5 * R, z * R); }
    for (let i = 0; i < N; i++) { const a = i * 2, b = a + 2; I.push(a, a + 1, b, b, a + 1, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: '#030405', side: THREE.DoubleSide, fog: false })); m.renderOrder = -8; m.frustumCulled = false; scene.add(m); }
  const coast = []; { const r = new RNG(55); for (let i = 0; i < 160; i++) { const az = Math.PI + r.range(-0.55, 0.55), el = -0.0365 + r.range(-0.0016, 0.0012); coast.push(Math.sin(az) * 7900, Math.tan(el) * 7900, -Math.cos(az) * 7900); } }
  const coastG = new THREE.BufferGeometry(); coastG.setAttribute('position', new THREE.Float32BufferAttribute(coast, 3));
  const coastM = new THREE.PointsMaterial({ color: '#ffd8a0', size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const coastP = new THREE.Points(coastG, coastM); coastP.frustumCulled = false; scene.add(coastP);
  // the road up, a parked 4WD
  { const VF = new VehicleFactory(), o = VF.build('suv', '#5a5e58'); o.group.position.set(14.5, groundY(14.5, -21.5) + 0.02, -21.5); o.group.rotation.y = 2.2; scene.add(o.group); }
  // ---------------------------------------------------------------------------------------------------- the dome
  const white = lfStd('#d6d8d4', 0.55, 0.1), inner = lfStd('#8a8c88', 0.85), floorM = lfStd('#4a4640', 0.9);
  { const outW = new THREE.Mesh(new THREE.CylinderGeometry(O.r, O.r, O.wallH + 0.3, 72, 1, true), white); outW.position.y = (O.wallH + 0.1) / 2 - 0.1; outW.castShadow = outW.receiveShadow = true; scene.add(outW);
    const inW = new THREE.Mesh(new THREE.CylinderGeometry(O.r - 0.15, O.r - 0.15, O.wallH + 0.3, 72, 1, true), inner); inW.material = inner.clone(); inW.material.side = THREE.BackSide; inW.position.y = (O.wallH + 0.1) / 2 - 0.1; inW.receiveShadow = true; scene.add(inW);
    const cap = new THREE.Mesh(new THREE.RingGeometry(O.r - 0.15, O.r + 0.08, 72, 1), white); cap.rotation.x = -Math.PI / 2; cap.position.y = O.wallH + 0.1; scene.add(cap);
    const fl = new THREE.Mesh(new THREE.CircleGeometry(O.r - 0.1, 72), floorM); fl.rotation.x = -Math.PI / 2; fl.position.y = 0.0; fl.receiveShadow = true; scene.add(fl);
    // the door (south-east), its frame standing 4 cm proud of the wall
    const da = Math.PI * 0.62, dx = Math.cos(da), dz = Math.sin(da);
    const door = lfBox(1.1, 2.15, 0.08, lfStd('#5a6a72', 0.5, 0.4), dx * (O.r + 0.04), 1.08, dz * (O.r + 0.04)); door.rotation.y = Math.atan2(dx, dz); }
  // the rotating dome: a hemisphere on the wall, with its slit (and the upper shutter run back over the top)
  const dome = new THREE.Group(); dome.position.y = O.wallH + 0.1; dome.rotation.y = -LF_OB_AZ; scene.add(dome);
  const SL = { w: O.slitW, p0: 0.32, p1: Math.PI / 2 + 0.16 };
  const domeGeo = (R, keep, flip) => {          // (x, φ) → (x, ρ sin φ, −ρ cos φ): φ 0 = the slit's horizon, π/2 the zenith
    const hx = SL.w / 2, X = [...lfRange(-R, -hx, 44), ...lfRange(-hx, hx, 10).slice(1), ...lfRange(hx, R, 44).slice(1)];
    const F = [...lfRange(0, SL.p0, 8), ...lfRange(SL.p0, SL.p1, 40).slice(1), ...lfRange(SL.p1, Math.PI, 40).slice(1)];
    const P = [], I = [], at = (x, f) => { const r = Math.sqrt(Math.max(0, R * R - x * x)); return [x, r * Math.sin(f), -r * Math.cos(f)]; };
    for (const f of F) for (const x of X) P.push(...at(x, f));
    const nx = X.length;
    for (let j = 0; j < F.length - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const xc = (X[i] + X[i + 1]) / 2, fc = (F[j] + F[j + 1]) / 2; if (!keep(xc, fc)) continue;
      const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; if (flip) I.push(a, b, c, b, d, c); else I.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals(); return g;
  };
  const inSlit = (x, f) => Math.abs(x) < SL.w / 2 && f > SL.p0 && f < SL.p1;
  { const R = O.domeR, outer = new THREE.Mesh(domeGeo(R, (x, f) => !inSlit(x, f), false), white); outer.castShadow = outer.receiveShadow = true; dome.add(outer);
    const inn = new THREE.Mesh(domeGeo(R - 0.12, (x, f) => !inSlit(x, f), true), inner); dome.add(inn);
    // the slit's edges (curved rails), the upper shutter over the back
    for (const sx of [-1, 1]) { const pts = lfRange(SL.p0, SL.p1, 30).map((f) => { const x = sx * (SL.w / 2 + 0.07), r = Math.sqrt(R * R - x * x) - 0.04; return new THREE.Vector3(x, r * Math.sin(f), -r * Math.cos(f)); });
      dome.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.1, 8, false), lfStd('#9a9c98', 0.6, 0.3))); }
    const L = SL.p1 - SL.p0, sh = domeGeo(R + 0.14, (x, f) => Math.abs(x) < SL.w / 2 + 0.22 && f > SL.p1 + 0.02 && f < SL.p1 + 0.02 + L, false); const shm = new THREE.Mesh(sh, white); shm.castShadow = true; dome.add(shm);
    const lower = new THREE.Mesh(domeGeo(R + 0.08, (x, f) => Math.abs(x) < SL.w / 2 + 0.16 && f > 0.02 && f < SL.p0 + 0.03, false), white); dome.add(lower);
    const base = new THREE.Mesh(new THREE.TorusGeometry(R - 0.05, 0.09, 8, 96), lfStd('#7a7c78', 0.6, 0.3)); base.rotation.x = Math.PI / 2; base.position.y = 0.0; dome.add(base); }
  // ---------------------------------------------------------------------------------------------------- the telescope
  const SAT = new THREE.Vector3(...LF_OB_SAT), AX = new THREE.Vector3(0, O.scope.y, 0);
  const tubeM = lfStd('#e8e8e4', 0.45, 0.15), darkM = lfStd('#1e2024', 0.6, 0.4), brass = lfStd('#b08a3a', 0.35, 0.9);
  lfCyl(0.45, 0.55, 1.35, lfStd('#7a7c78', 0.85), 0, 0.675, 0, null, 28);
  const mount = new THREE.Group(); mount.position.set(0, 1.35, 0); mount.rotation.y = -LF_OB_AZ; scene.add(mount);
  lfCyl(0.62, 0.62, 0.22, darkM, 0, 0.11, 0, mount, 32);
  for (const sx of [-1, 1]) lfBox(0.14, 1.1, 0.42, darkM, sx * 0.56, 0.75, 0, mount);
  lfBox(1.26, 0.18, 0.5, darkM, 0, 0.27, 0, mount);
  const tube = new THREE.Group(); tube.position.set(0, O.scope.y - 1.35, 0); tube.rotation.x = -(Math.PI / 2 - LF_OB_EL); mount.add(tube);   // the tube's +y points at Saturn
  // (the tube pivots 0.9 m from its back, balanced by its counterweights, so the eyepiece is at a sitting eye's height)
  { lfCyl(0.42, 0.42, 2.4, tubeM, 0, 0.3, 0, tube, 40);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.14, 40, 1, true), darkM); rim.position.y = 1.52; tube.add(rim);
    lfCyl(0.46, 0.46, 0.3, darkM, 0, -1.0, 0, tube, 40);
    lfCyl(0.06, 0.06, 0.12, brass, 0, -1.21, 0, tube, 16);
    const diag = lfBox(0.09, 0.09, 0.09, brass, 0, -1.31, 0, tube); diag.castShadow = false;
    const ep = lfCyl(0.03, 0.03, 0.12, darkM, 0.0, -1.31, 0.1, tube, 14); ep.rotation.x = Math.PI / 2;
    for (const sx of [-1, 1]) { const ax = lfCyl(0.08, 0.08, 0.2, brass, sx * 0.5, 0, 0, tube, 16); ax.rotation.z = Math.PI / 2; }
    for (const sx of [-1, 1]) lfBox(0.12, 0.3, 0.2, darkM, sx * 0.3, -0.74, -0.42, tube);   // (1 cm off the tube's end plane)
    lfCyl(0.06, 0.06, 1.0, darkM, 0.46, 0.5, 0.25, tube, 12); }
  // the eyepiece's world position (for the astronomer and the cameras)
  scene.updateMatrixWorld(true);
  const EP = new THREE.Vector3(0.0, -1.31, 0.17).applyMatrix4(tube.matrixWorld);
  // ---------------------------------------------------------------------------------------------------- the room
  const wood = lfStd('#6a4a30', 0.7);
  { const d = O.desk, a = Math.atan2(d[2], d[0]); const g = new THREE.Group(); g.position.set(d[0], 0, d[2]); g.rotation.y = -a + Math.PI / 2; scene.add(g);
    lfBox(1.6, 0.05, 0.75, wood, 0, 0.74, 0, g); for (const [x, z] of [[-0.75, -0.33], [0.75, -0.33], [-0.75, 0.33], [0.75, 0.33]]) lfBox(0.05, 0.72, 0.05, wood, x, 0.36, z, g);
    lfBox(0.42, 0.02, 0.3, lfStd('#e8e2d0', 0.9), -0.3, 0.775, 0.05, g); lfBox(0.38, 0.03, 0.28, lfStd('#2a2c30', 0.5, 0.3), 0.35, 0.78, 0.0, g); }
  const stool = new THREE.Group(); { const k = EP.clone(); const off = new THREE.Vector3(EP.x, 0, EP.z).normalize().multiplyScalar(0.62); stool.position.set(EP.x + off.x, 0, EP.z + off.z); scene.add(stool);
    lfCyl(0.19, 0.19, 0.05, darkM, 0, 0.62, 0, stool, 20); for (const a of [0, 2.09, 4.19]) { const l = lfCyl(0.018, 0.018, 0.64, darkM, 0.13 * Math.cos(a), 0.31, 0.13 * Math.sin(a), stool, 6); l.rotation.set(0.15 * Math.sin(a), 0, -0.15 * Math.cos(a)); } void k; }
  // red battery lamps on the wall (LEDs)
  const redL = [], redM = new THREE.MeshBasicMaterial({ color: '#ff2a1a' });
  for (const a of [0.9, 2.6, 4.4]) { const x = Math.cos(a) * (O.r - 0.2), z = Math.sin(a) * (O.r - 0.2);
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.04), redM); m.position.set(x, 2.3, z); m.lookAt(0, 2.3, 0); scene.add(m);
    const L = new THREE.PointLight('#ff2a14', 0, 12, 1.6); L.position.set(x * 0.95, 2.2, z * 0.95); scene.add(L); redL.push(L); }
  const slitL = new THREE.SpotLight('#9fb0d8', 0, 30, 0.42, 0.9, 1.0); slitL.position.set(LF_OB_SAT[0] * 14, O.wallH + LF_OB_SAT[1] * 14, LF_OB_SAT[2] * 14); slitL.target.position.set(-LF_OB_SAT[0] * 2, 0, -LF_OB_SAT[2] * 2); scene.add(slitL); scene.add(slitL.target);
  // the astronomer: on the stool at the eyepiece; a red head torch (off when reading the barometer: the white torch)
  const astro = lfPerson('lfAstro', scene, { id: 'astro' });
  const torch = new THREE.SpotLight('#f2f4ff', 0, 3, 0.32, 0.6, 1.6); scene.add(torch); scene.add(torch.target);
  // ---------------------------------------------------------------------------------------------------- the barometer
  const BA = LF_OB_BARO, baro = new THREE.Group(); baro.position.set(...BA.o); baro.lookAt(BA.o[0] + BA.n[0], BA.o[1], BA.o[2] + BA.n[2]); scene.add(baro);
  // (in the barometer's frame: +z into the room, y up; the mercury's top at y 0)
  const glass = new THREE.MeshStandardMaterial({ color: '#dfe8ee', roughness: 0.05, metalness: 0.0, transparent: true, opacity: 0.16, envMapIntensity: 2.2, depthWrite: false });
  const HG = { uFront: { value: 10 }, uFrz: { value: 0 }, uT: { value: 0 } };
  const mercM = new THREE.MeshStandardMaterial({ color: '#d4d6d8', roughness: 0.035, metalness: 1.0, envMapIntensity: 1.6 });
  mercM.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, HG);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vHgP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvHgP = position + vec3(0.0, modelMatrix[3].y, 0.0);');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      uniform float uFront, uFrz, uT; varying vec3 vHgP;
      float hgH(vec3 p){ p = fract(p * 0.3183 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float hgCell(vec3 p){ vec3 i = floor(p); float m = 9.0, m2 = 9.0; for (int a = -1; a <= 1; a++) for (int b = -1; b <= 1; b++) for (int c = -1; c <= 1; c++) {
        vec3 g = i + vec3(a, b, c), o = g + vec3(hgH(g), hgH(g + 7.1), hgH(g + 3.7)); float d = length(p - o); if (d < m) { m2 = m; m = d; } else if (d < m2) m2 = d; } return m2 - m; }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        float hgF = uFrz * smoothstep(uFront - 0.0025, uFront + 0.0025, vHgP.y);
        float cell = hgCell(vHgP * 900.0);
        roughnessFactor = mix(roughnessFactor, 0.42 + 0.22 * smoothstep(0.0, 0.25, cell), hgF);
        diffuseColor.rgb *= mix(1.0, 0.5 + 0.16 * smoothstep(0.02, 0.3, cell), hgF);`);
  };
  mercM.customProgramCacheKey = () => 'lfHg';
  { const pm = new THREE.PMREMGenerator(app.renderer), es = new THREE.Scene(); es.background = new THREE.Color('#06070a');
    const q = (w, h, c, x, y, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); es.add(m); };
    q(0.5, 0.5, '#fff6ea', 1.2, 0.5, 1.6); q(3, 0.6, '#3a4250', 0, 3, 0); q(0.8, 1.6, '#5a1a12', -2.5, 0.4, -1); q(1.6, 0.5, '#2a2e36', 0, -1.2, 2.5); q(0.3, 2.4, '#9aa4b2', -1.8, 0.2, 2.2);
    mercM.envMap = pm.fromScene(es, 0.01).texture; pm.dispose(); }
  { lfBox(0.17, 1.3, 0.025, wood, 0, -0.42, -0.06, baro);
    lfCyl(0.017, 0.017, 0.66, brass, 0, -0.5, 0, baro, 20);                       // the case below the window
    for (const sx of [-1, 1]) lfBox(0.007, 0.25, 0.024, brass, sx * 0.0125, -0.055, -0.004, baro);   // the window's side rails
    lfBox(0.03, 0.006, 0.026, brass, 0, -0.178, -0.004, baro);
    lfCyl(0.019, 0.017, 0.09, brass, 0, 0.115, 0, baro, 20);                     // the top cap
    const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.0046, 0.0046, 0.3, 24, 1, true), glass); gl.position.y = -0.03; gl.renderOrder = 4; baro.add(gl);
    lfCyl(0.0046, 0.0046, 0.0015, glass, 0, 0.12, 0, baro, 24);
    // the scale beside the window: millimetres of mercury, 2,200 m up (~585 mm)
    const sc = lfTex(lfCanvas(128, 512, (g, w, h) => { g.fillStyle = '#c8a860'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2014'; g.font = '600 26px serif'; g.textAlign = 'right';
      for (let mm = 520; mm <= 640; mm++) { const y = h * (1 - (mm - 520) / 120); g.fillRect(mm % 5 ? 100 : 84, y - 1, w - (mm % 5 ? 100 : 84), 2); if (mm % 10 === 0) g.fillText(String(mm), 80, y + 9); } g.font = '600 20px serif'; g.fillText('mm', 80, 26); }), { repeat: false, aniso: 8 });
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.12), lfStd('#ffffff', 0.4, 0.6, { map: sc })); pl.position.set(-0.031, -(585 - 580) / 1000, 0.0); baro.add(pl);
    // the attached thermometer (alcohol, red): 6 °C
    const th = lfTex(lfCanvas(64, 512, (g, w, h) => { g.fillStyle = '#e8e0c8'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2014'; g.font = '600 18px serif'; g.textAlign = 'left';
      for (let c = -10; c <= 40; c += 2) { const y = h * (1 - (c + 10) / 50); g.fillRect(36, y - 1, c % 10 ? 10 : 22, 2); if (c % 10 === 0) g.fillText(String(c), 2, y + 6); } }), { repeat: false, aniso: 8 });
    const tp = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.14), lfStd('#ffffff', 0.6, 0, { map: th })); tp.position.set(0.034, -0.36, 0.0); baro.add(tp);
    const red = lfCyl(0.0016, 0.0016, 0.14 * (16 / 50), lfStd('#c81a14', 0.3), 0.034, -0.36 - 0.07 + 0.14 * (16 / 50) / 2, 0.004, baro, 8); red.castShadow = false;
    // the cistern at the bottom (glass, the mercury in it)
    lfCyl(0.034, 0.034, 0.012, brass, 0, -0.84, 0, baro, 24); lfCyl(0.034, 0.034, 0.012, brass, 0, -0.92, 0, baro, 24);
    const cg = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.031, 0.068, 24, 1, true), glass); cg.position.y = -0.88; baro.add(cg);
    lfCyl(0.029, 0.029, 0.05, mercM, 0, -0.893, 0, baro, 24); }
  const col = lfCyl(0.0036, 0.0036, 0.3, mercM, 0, -0.15, 0, baro, 20); col.castShadow = false;
  const men = new THREE.Mesh(new THREE.SphereGeometry(0.0036, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mercM); men.scale.y = 0.75; baro.add(men);
  // ---------------------------------------------------------------------------------------------------- the eyepiece view (its own little scene)
  const EV = { scene: new THREE.Scene(), cam: new THREE.OrthographicCamera(-16 / 9, 16 / 9, 1, -1, -1, 1) };
  const EU = { uT: { value: 0 }, uSat: { value: 1 }, uStar: { value: 1 }, uAsp: { value: 16 / 9 } };
  EV.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(32 / 9, 2), new THREE.ShaderMaterial({ uniforms: EU, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = vec4(position.xy / vec2(16.0 / 9.0, 1.0), 0.0, 1.0); }',
    fragmentShader: `uniform float uT, uSat, uStar, uAsp; varying vec2 vP;
      float h1(float n){ return fract(sin(n) * 43758.5453); }
      float vn(float x){ float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h1(i), h1(i + 1.0), f) * 2.0 - 1.0; }
      void main(){
        vec2 p = vP; float r = length(p);
        float stopE = smoothstep(0.93, 0.9, r), vig = 1.0 - 0.35 * r * r;
        vec3 col = vec3(0.016, 0.018, 0.026) * stopE * (0.6 + 0.4 * uStar);
        // the seeing: the image shimmers and drifts a little
        vec2 c = vec2(0.012 * vn(uT * 1.3 + 3.0) + 0.004 * vn(uT * 7.0), 0.01 * vn(uT * 1.1 + 9.0) + 0.004 * vn(uT * 6.3 + 1.0));
        float Rs = 0.058, sinB = 0.135, bl = 0.06;
        vec2 q = (p - c) / Rs; q = mat2(0.9945, -0.1045, 0.1045, 0.9945) * q;
        // the globe (oblate), limb-darkened, banded; the ring's shadow across it
        float gd = q.x * q.x + (q.y / 0.9) * (q.y / 0.9);
        float mu = sqrt(max(0.0, 1.0 - gd)), lat = asin(clamp(q.y / 0.9, -1.0, 1.0));
        vec3 band = mix(vec3(0.86, 0.74, 0.52), vec3(0.95, 0.88, 0.7), 0.5 + 0.5 * sin(lat * 9.0 + 0.6)) * mix(1.0, 0.72, smoothstep(0.75, 1.1, abs(lat)));
        float rs = length(vec2(q.x, (q.y + 0.07) / sinB)), shadow = 1.0 - 0.75 * smoothstep(1.2, 1.3, rs) * (1.0 - smoothstep(2.2, 2.3, rs));
        vec3 globe = band * pow(mu, 0.55) * shadow;
        float gA = smoothstep(1.0 + bl, 1.0 - bl, sqrt(gd));
        // the rings: C (faint), B (bright), Cassini division, A (with the Encke gap)
        float rr = length(vec2(q.x, q.y / sinB));
        float ring = 0.12 * smoothstep(1.22, 1.3, rr) * (1.0 - smoothstep(1.5, 1.55, rr)) + 0.95 * smoothstep(1.52, 1.58, rr) * (1.0 - smoothstep(1.92, 1.96, rr))
                   + 0.62 * smoothstep(2.0, 2.05, rr) * (1.0 - smoothstep(2.22, 2.28, rr)) * (1.0 - 0.6 * smoothstep(0.012, 0.0, abs(rr - 2.21)));
        ring *= smoothstep(0.0, 0.25, abs(q.y) / sinB + 0.15);
        vec3 ringC = vec3(0.92, 0.86, 0.74) * ring;
        bool front = q.y < 0.0;
        vec3 sat = front ? mix(globe * gA, ringC, smoothstep(0.0, 0.05, ring) * 0.92) : mix(ringC, globe, gA);
        float satA = max(gA, smoothstep(0.0, 0.05, ring));
        col += 0.62 * sat * satA * uSat * stopE;
        // Titan, and a few faint field stars (much further away: still shining)
        col += vec3(1.0, 0.86, 0.6) * 0.5 * uSat * exp(-dot(p - c - vec2(0.46, 0.04), p - c - vec2(0.46, 0.04)) * 9000.0);
        for (int i = 0; i < 9; i++) { float fi = float(i); vec2 sp = vec2(h1(fi * 3.1) * 1.5 - 0.75, h1(fi * 5.7) * 1.5 - 0.75) + c * 0.6; float b = (0.15 + 0.5 * h1(fi * 9.3)) * uStar;
          col += vec3(0.9, 0.93, 1.0) * b * exp(-dot(p - sp, p - sp) * 26000.0) * stopE; }
        // the eyepiece's own glow at the stop's edge, the eye's floaters
        col += vec3(0.012, 0.012, 0.016) * smoothstep(0.8, 0.92, r) * stopE;
        gl_FragColor = vec4(col * vig, 1.0);
      }` })));
  // ---------------------------------------------------------------------------------------------------- the frame
  const set = {
    scene, camera: cam, sky, EP,
    cuts() { return []; },
    view() { return this._m === 'scope' ? [EV.scene, EV.cam] : [scene, cam]; },
    frame(t, shot) {
      const m = shot.mode, s = lfStoryAt(t), k = LFP.k(s), kk = MathX.clamp((t - shot.t0) / (shot.t1 - shot.t0), 0, 1);
      this._m = m; this._s = s; this._k = k;
      const px = (app.renderH || 1080) / 1080, adapt = lfAdapt(s), led = LFP.led(k);
      this._adapt = adapt;
      const v = { p: [20, 2, -25], at: [0, 6, 0], fov: 50, near: 0.05, drift: 0.01, expo: 1 };
      lfObsCam(this, m, s, t, kk, v);
      this._expo = v.expo;
      const old = k / (adapt * v.expo);
      sky.update(s, { glow: 0, mw: 1, k: old, starK: old, px, at: cam.position });
      const inside = m === 'eyepiece' || m === 'baro';
      S.hemi.intensity = (m === 'eyepiece' ? 0.55 : inside ? 0.25 : 0.32) * old; slitL.intensity = (m === 'eyepiece' ? 90 : 0) * old;
      // the coast below: battery LEDs and the last car lights, fading
      coastM.opacity = 0.7 * lfEmerg(s, 0.1) + 0.3 * lfHead(s, 3);
      // the red lamps (battery LEDs), the white torch on the barometer
      for (const L of redL) L.intensity = 0.9 * led;
      redM.color.setRGB(0.05 + 0.95 * led, 0.02 + 0.14 * led, 0.02 + 0.08 * led);
      // the astronomer
      const P = LF_POSES, lean = (() => { const p = P.sit(); p.spine = 0.5; p.neck = 0.25; p.rSh = [1.1, 0.1]; p.rEl = 1.0; p.lSh = [0.7, 0.1]; p.lEl = 1.3; return p; })();
      const back = (() => { const p = P.sit(); p.spine = -0.15; p.neck = -0.75; p.lSh = [0.3, 0.15]; p.rSh = [0.3, 0.12]; p.lEl = 0.9; p.rEl = 0.8; return p; })();
      const sp = new THREE.Vector3(stool.position.x, 0.6, stool.position.z), yaw = Math.atan2(EP.x - sp.x, EP.z - sp.z);
      if (m === 'baro' || m === 'obsOut') {
        // standing at the barometer, the torch in the right hand
        const B = LF_OB_BARO, x = B.o[0] + B.n[0] * 0.55 - B.side[0] * 0.15, z = B.o[2] + B.n[2] * 0.55 - B.side[2] * 0.15;
        lfPose(astro, lfFidget(P.torch(), s, 5, 0.3), x, 0, z, Math.atan2(-B.n[0], -B.n[2]));
      } else {
        const u = lfSm(s, 457.2, 458.6);
        lfPose(astro, lfFidget(lerpPose(lean, back, u), s, 5, 0.3), sp.x, 0.645 - 0.47, sp.z, yaw);
      }
      { const B = LF_OB_BARO, o = new THREE.Vector3(...B.o);
        torch.position.set(o.x + B.n[0] * 0.42 + B.side[0] * 0.22, o.y + 0.12, o.z + B.n[2] * 0.42 + B.side[2] * 0.22); torch.target.position.set(o.x, o.y - 0.03, o.z);
        torch.intensity = (m === 'baro' ? 1.4 : m === 'obsOut' ? 0.0 : 0) * led; }
      // the barometer: the mercury's level; frozen from 27.95 s (the front runs down from the top in a second)
      { const y = lfHgLevel(s), f = s - LFP.sHgCold; col.position.y = -0.15 + y; men.position.y = y; men.scale.y = 0.75 - 0.45 * lfSm(f, 0, 0.4);
        HG.uFrz.value = f > 0 ? 1 : 0; HG.uFront.value = baro.position.y + 0.004 - 0.09 * lfSm(f, 0, 0.32) - 0.6 * lfSm(f, 0.32, 3);
        // each tap shakes the case a little (and, once it's frozen, nothing inside moves)
        let sh = 0; for (const tp of LF_OB_TAPS) if (s > tp) sh += 0.0006 * Math.exp(-(s - tp) / 0.02) * Math.sin((s - tp) * 380);
        baro.position.set(LF_OB_BARO.o[0] + LF_OB_BARO.side[0] * sh, LF_OB_BARO.o[1], LF_OB_BARO.o[2] + LF_OB_BARO.side[2] * sh); }
      // the eyepiece view: Saturn's old light is used up at 9:07:33.6
      EU.uT.value = s * 0.8; EU.uSat.value = (s < LFP.sSaturn ? 1 : 0) * k / (adapt * v.expo); EU.uStar.value = k / (adapt * v.expo);
      // the camera
      const dr = v.drift ? lfDrift(t, v.drift, 0.3, 23) : [0, 0, 0];
      if (cam.near !== v.near) cam.near = v.near; cam.far = 12000;
      lfCam(cam, [v.p[0] + dr[0], v.p[1] + dr[1], v.p[2] + dr[2]], [v.at[0] + dr[0], v.at[1] + dr[1], v.at[2] + dr[2]], v.fov);
    },
    labels(t) {
      const shot = lfShotAt(t), m = shot.mode, out = [], W = StoryHUD.win, s = this._s;
      if (m === 'baro') out.push({ p: [LF_OB_BARO.o[0] + LF_OB_BARO.n[0] * 0.01 + LF_OB_BARO.side[0] * 0.006, LF_OB_BARO.o[1] - 0.004, LF_OB_BARO.o[2] + LF_OB_BARO.n[2] * 0.01 + LF_OB_BARO.side[2] * 0.006], text: 'MERCURY', sub: s > LFP.sHgCold ? 'freezing' : 'liquid', a: W(t, shot.t0 + 0.8, shot.t1 - 0.3, 0.3, 0.3), side: 'r' });
      if (m === 'eyepiece') { const d = LF_OB_SAT, c = this.camera.position; out.push({ p: [c.x + d[0] * 300, c.y + d[1] * 300, c.z + d[2] * 300], text: 'SATURN · GONE', sub: 'its old sunlight has all arrived', a: W(t, shot.t0 + 1.2, shot.t1 - 0.3, 0.4, 0.3) }); }
      if (m === 'obsOut') out.push({ p: [0, LF_OB.wallH + LF_OB.domeR + 1.5, 0], text: 'THE OBSERVATORY', sub: '2,200 m · 6 °C in the dome', a: W(t, shot.t0 + 0.8, shot.t1 - 0.3, 0.35, 0.3) });
      return out;
    },
    grade(t, p) {
      const s = this._s, k = this._k;
      p.exposure = LFP.eye(k) * this._adapt * this._expo;
      p.saturation = lfSat(s) + 0.02; p.contrast = 1.08; p.warmth = -0.02; p.blackLift = 0.004;
      p.vignette = this._m === 'scope' ? 0.2 : 0.56; p.bloom = this._m === 'scope' ? 0.3 : 0.42; p.bloomThreshold = 0.82; p.grain = 0.03;
    },
  };
  return set;
};

function lfObsCam(set, m, s, t, k, v) {
  const E = Ease.inOutSine, into = (a, b, u) => lfV(a, b, E(u)), B = LF_OB_BARO, EP = set.EP;
  switch (m) {
    // the dome on the summit, its slit open on Saturn; the coast's dark line far below
    case 'obsOut': { const a = -LF_OB_AZ - 0.5, r = 24; v.p = into([Math.sin(-a) * r + 0, 1.45, -Math.cos(-a) * r], [Math.sin(-a) * (r - 2.5), 1.5, -Math.cos(-a) * (r - 2.5)], k);
      v.at = [0, 6.8, 0]; v.fov = 56; v.near = 0.2; v.drift = 0.02; v.expo = 1.4; break; }
    // the barometer's window, close (13 cm): the mercury's top, the scale
    case 'baro': { const o = B.o; v.p = [o[0] + B.n[0] * 0.13 + B.side[0] * 0.03, o[1] + 0.012, o[2] + B.n[2] * 0.13 + B.side[2] * 0.03]; v.at = [o[0], o[1] - 0.006, o[2]]; v.fov = 30; v.near = 0.004; v.drift = 0.0012; v.expo = 1.0; break; }
    // through the eyepiece (its own scene: see set.view)
    case 'scope': v.p = [EP.x, EP.y + 0.05, EP.z]; v.at = [0, 3, 0]; v.expo = 1.0; v.drift = 0; break;
    // the astronomer sits back and looks up through the slit
    case 'eyepiece': { const d = LF_OB_SAT, h = lfN3([d[0], 0, d[2]]), sd = [-h[2], 0, h[0]];
      v.p = into([EP.x - h[0] * 3.2 + sd[0] * 0.9, 0.72, EP.z - h[2] * 3.2 + sd[2] * 0.9], [EP.x - h[0] * 3.0 + sd[0] * 0.85, 0.75, EP.z - h[2] * 3.0 + sd[2] * 0.85], k);
      v.at = [EP.x + d[0] * 4, EP.y + d[1] * 4, EP.z + d[2] * 4]; v.fov = 64; v.near = 0.05; v.drift = 0.008; v.expo = 3.2; break; }
  }
  void s; void t;
}
