/* =====================================================================
   WORLD — the other cities' earthquakes (minute seven onwards): one small set each, built in code, all in the
   `world` set (it shows the scene of the current shot). Each shakes with its own earthquake (quake.js EQ_QUAKES:
   started at its own second, one magnitude more every minute) at its own local time:
     la        the Hollywood sign, Los Angeles (10 AM): the letters fall one by one, the hillside slides
     mexico    the Angel of Independence on the Paseo de la Reforma, Mexico City (11 AM) · jelly: the old lake bed
               rolls in slow waves under the avenue
     dam       the Hoover Dam (10 AM, the Nevada earthquake 20 km away): cracks, jets, Lake Mead coming through
     needle    the Space Needle, Seattle, with Mount Rainier (10 AM): it sways, then falls
     tokyo     the Tokyo Skytree at 2 AM: the city's lights go out in waves
     dubai     the Burj Khalifa at 9 PM (Iran's earthquake, across the Gulf): the spire whips, the glass rains
     istanbul  the Bosphorus Bridge at 8 PM, lit: the deck twists
   Local frames: x east, y up, z south (as San Francisco's). Everything is a pure function of story time s.
   ===================================================================== */

// ---- a world earthquake's shaking at a place: like eqLevel/eqGround (quake.js), from its own start; `far` scales it
function eqQLevel(q, s, far = 1) {
  if (typeof q === 'string') q = EQ_Q[q];
  const M = eqQMag(q, s); if (M === null) return 0;
  const k = Math.floor((s - q.s0) / 60), u = s - q.s0 - 60 * k, a = EQ_AMP[Math.min(12, M)] || 0, a0 = EQ_AMP[Math.min(12, M - 1)] || 0;
  const ramp = a0 + (a - a0) * MathX.smooth(u, 0, 0.35);
  return far * ramp * (1 + 1.2 * Math.exp(-u / 1.4)) * (0.82 + 0.3 * (0.5 + 0.5 * noise1(s * 0.21, 43)));
}
function eqQGround(q, s, seed = 1, far = 1) {
  if (typeof q === 'string') q = EQ_Q[q];
  const L = eqQLevel(q, s, far); if (!(L > 0)) return [0, 0, 0];
  const M = Math.min(12, eqQMag(q, s)), f = EQ_HZ[M], p = s * f;
  const n = (o) => noise1(p + o, seed + o) * 0.65 + noise1(p * 2.3 + o * 3, seed + o * 7) * 0.35;
  return [L * n(0), L * 0.55 * n(11), L * n(23)];
}
// the ground wave's height in JS (the same as EQ_WAVE_GLSL with a postcard's uniforms U)
function eqWaveAt(x, z, U) { const r = Math.hypot(x - U.uEpi.value.x, z - U.uEpi.value.y); return U.uWaveA.value * Math.sin(U.uWaveK.value * (r - U.uWaveC.value * U.uS.value)) * Math.exp(-r / U.uWaveL.value); }

// ---- the ground of a postcard: a height field (h), coloured per vertex (col) and/or per pixel (paint: GLSL that
// may read `vec2 p` (world xz) and `float eqNight` and change diffuseColor / add to totalEmissiveRadiance), riding
// the ground wave
function eqPostGround(scene, o) {
  const g = new THREE.PlaneGeometry(o.size[0], o.size[1], o.segs[0], o.segs[1]); g.rotateX(-Math.PI / 2);
  if (o.at) g.translate(o.at[0], 0, o.at[1]);
  const P = g.attributes.position, C = new Float32Array(P.count * 3);
  // (colours are given as sRGB, like CSS colours: the vertex colours and the paint are converted to linear)
  for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i), y = o.h(x, z); P.setY(i, y); const c = o.col ? o.col(x, z, y) : [0.5, 0.5, 0.5]; C[i * 3] = c[0] ** 2.2; C[i * 3 + 1] = c[1] ** 2.2; C[i * 3 + 2] = c[2] ** 2.2; }
  g.setAttribute('color', new THREE.BufferAttribute(C, 3)); g.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: o.rough ?? 0.95, metalness: 0 });
  const U = { uS: { value: 0 }, uWaveA: { value: 0 }, uEpi: { value: new THREE.Vector2(0, 0) }, uNightG: { value: o.night ? 1 : 0 }, ...eqWaveU(o.wave ? o.wave[0] : 0.01, o.wave ? o.wave[1] : 100, o.wave ? o.wave[2] : 1e9) };
  m.userData.U = U;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;' + EQ_WAVE_GLSL)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec4 eqW0 = modelMatrix * vec4(transformed, 1.0); transformed.y += eqWaveY(eqW0.xz); vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        varying vec3 vWP; uniform float uNightG;
        float eqH2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { vec2 p = vWP.xz; float eqNight = uNightG; diffuseColor.rgb = pow(max(diffuseColor.rgb, 0.0), vec3(1.0 / 2.2)); ${o.paint || ''} diffuseColor.rgb = pow(max(diffuseColor.rgb, 0.0), vec3(2.2)); }`);
  };
  m.customProgramCacheKey = () => 'eqPostGround' + (o.key || '');
  const mesh = new THREE.Mesh(g, m); mesh.receiveShadow = true; scene.add(mesh);
  return { mesh, U };
}
// ---- buildings: [[x, z, w, d, h, rot, colour, kind, failS]] → one instanced mesh with the city shader (sf-geo.js)
function eqPostCity(scene, B, o = {}) {
  const geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
  const { mat, depth, U } = eqCityMat();
  const mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, B.length)), fail = new Float32Array(Math.max(1, B.length) * 3);
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3(), C = new THREE.Color(), Y = new THREE.Vector3(0, 1, 0);
  B.forEach(([x, z, w, d, h, rot, color, kind, sf], i) => {
    const y = o.groundY ? o.groundY(x, z) : 0;
    P.set(x, y - 3, z); Q.setFromAxisAngle(Y, rot); S.set(w, h + 3, d); M4.compose(P, Q, S); mesh.setMatrixAt(i, M4);
    C.set(color); mesh.setColorAt(i, C);
    fail[i * 3] = sf ?? 1e6; fail[i * 3 + 1] = hash1(i * 31 + (o.seed || 7)); fail[i * 3 + 2] = kind;
  });
  geo.setAttribute('aFail', new THREE.InstancedBufferAttribute(fail, 3));
  mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = !o.noShadow; mesh.receiveShadow = true; mesh.frustumCulled = false; mesh.customDepthMaterial = depth;
  U.uNight.value = o.night ? 1 : 0;
  if (o.wave) { U.uWaveK.value = o.wave[0]; U.uWaveC.value = o.wave[1]; U.uWaveL.value = o.wave[2]; }
  if (o.glass) U.uGlass.value.set(o.glass);
  scene.add(mesh);
  return { mesh, U, B };
}
// a rough grid of buildings over a region (rot: the grid's angle); f(x, z, r) → [w, d, h, colour, kind] | null
function eqPostBlocks(r, x0, x1, z0, z1, step, rot, f) {
  const out = [], ca = Math.cos(rot), sa = Math.sin(rot);
  for (let a = x0; a < x1; a += step) for (let b = z0; b < z1; b += step) {
    const ja = a + r.range(-0.18, 0.18) * step, jb = b + r.range(-0.18, 0.18) * step, x = ca * ja + sa * jb, z = -sa * ja + ca * jb;
    const v = f(x, z, r, ja, jb); if (!v) continue;
    out.push([x, z, v[0], v[1], v[2], rot + (v[5] || 0), v[3], v[4]]);
  }
  return out;
}
// a postcard's common parts: scene, camera, sun, sky, two puff pools
function eqPostBase(app, o) {
  const S = eqSet(app, Object.assign({ fov: 40, near: 0.5, far: 200000, shadow: 2048, shadowR: 400, shadowFar: 3000 }, o));
  const sky = eqGradSky(S.scene, o.top, o.hor, o.low, { r: 150000, sunDir: o.sunDir, sunGlow: o.sunGlow || '#000000', hw: o.hw || 0.25 });
  const soft = eqPuffs(S.scene, 4000, { soft: 1.4 }), adds = eqPuffs(S.scene, 3000, { additive: true, soft: 1.8 });
  return Object.assign(S, { sky, soft, adds });
}
const eqSunV = (az, al, r = 1000) => { const A = az * Math.PI / 180, B = al * Math.PI / 180; return [Math.sin(A) * Math.cos(B) * r, Math.sin(B) * r, -Math.cos(A) * Math.cos(B) * r]; };
// a letter (or any short text) as an alpha-tested plane: w × h metres, its foot at y 0
function eqGlyphPlane(ch, h, o = {}) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const g = c.getContext('2d'); g.font = `800 430px "Inter", sans-serif`;
  const m = g.measureText(ch), adv = m.width, sx = o.squeeze || 0.82, wpx = adv * sx + 20;
  c.width = Math.ceil(wpx); const g2 = c.getContext('2d'); g2.clearRect(0, 0, c.width, 512);
  g2.save(); g2.translate(10, 0); g2.scale(sx, 1); g2.font = `800 430px "Inter", sans-serif`; g2.textBaseline = 'alphabetic'; g2.fillStyle = o.color || '#f4f2ec'; g2.fillText(ch, 0, 470); g2.restore();
  // weathering: faint streaks
  g2.globalCompositeOperation = 'source-atop'; for (let i = 0; i < 40; i++) { g2.fillStyle = `rgba(120,115,105,${0.04 + 0.05 * hash1(i * 7 + ch.charCodeAt(0))})`; g2.fillRect(hash1(i * 13 + 1) * c.width, 0, 3 + hash1(i) * 8, 512); }
  const tex = eqTex(c); const capPx = 470 - 470 * 0.27;             // (Inter's cap height ≈ 0.727 em)
  const H = h * 512 / (430 * 0.727), W = H * c.width / 512;
  const geo = new THREE.PlaneGeometry(W, H); geo.translate(0, H / 2 - h * (512 - 470) / (430 * 0.727), 0);
  void capPx;
  const mat = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.2 });
  const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true; mesh.receiveShadow = true;
  mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
  return { mesh, w: W * (adv * sx) / c.width };
}

// =====================================================================================================================
// LOS ANGELES: the Hollywood sign on Mount Lee (the letters 13.7 m tall, 107 m end to end), facing south over the city
// =====================================================================================================================
function eqPostLA(app) {
  const B = eqPostBase(app, { sky: '#a8c6de', fog: 0.00009, fogColor: '#d4dadb', hemi: ['#dbe6f0', '#7a6a50', 0.85], sun: eqSunV(135, 44), sunColor: '#fff0da', sunI: 2.6, shadowR: 140, env: ['#8fb8e0', '#dde4e8', '#6a6050'],
    top: '#3f80d4', hor: '#b2cce4', low: '#b8b0a0', sunDir: eqN3(eqSunV(135, 44)), sunGlow: '#fff0d0' });
  const scene = B.scene, q = EQ_Q.la, r = new RNG(1923);
  const hill = (x, z) => 75 * Math.tanh(-z / 120) - 190 * MathX.smooth(z, 150, 1400) + 22 * Math.sin(x / 230 + 0.4) * MathX.smooth(-z, -40, 160)
    + 40 * Math.exp(-((x - 160) ** 2 + (z + 250) ** 2) / (2 * 130 * 130)) + 6 * Math.sin(x / 47 + 1.3) * Math.sin(z / 61) + 3 * Math.sin(x / 13.7) * Math.sin(z / 17.1);
  const ground = eqPostGround(scene, { size: [4000, 5000], segs: [320, 400], at: [0, 900], h: hill, key: 'la',
    col: (x, z, y) => { const n = 0.5 + 0.5 * Math.sin(x / 61 + Math.sin(z / 47) * 2) * Math.sin(z / 73 + x / 131); const dry = MathX.smooth(n, 0.45, 0.85);
      const base = [0.42 - 0.06 * n, 0.42 - 0.05 * n, 0.3 - 0.04 * n]; const grass = [0.64, 0.57, 0.42]; const k = dry * 0.45 + MathX.smooth(y, -150, -230) * 0.4;
      return base.map((v, i) => v + (grass[i] - v) * k); },
    paint: `float rock = smoothstep(0.85, 0.97, eqH2(floor(p / 1.3))); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.56, 0.52, 0.46), rock * 0.4);
      float bush = smoothstep(0.55, 0.9, eqH2(floor(p / 1.7) + 7.0)); diffuseColor.rgb *= 1.0 - 0.22 * bush;` });
  // ---- the letters, their scaffolds behind, standing on the slope
  const word = 'HOLLYWOOD', letters = [], steel = eqStd('#8e8c86', 0.6, 0.5);
  let x = 0; const parts = [];
  for (const ch of word) { const L = eqGlyphPlane(ch, 13.7); parts.push(L); x += L.w + 1.6; }
  x = -(x - 1.6) / 2;
  const order = [3, 0, 6, 1, 8, 4, 7, 2, 5];
  parts.forEach((L, i) => {
    const cx = x + L.w / 2; x += L.w + 1.6;
    const z = 2 * Math.sin(i * 1.7), y = Math.min(hill(cx - L.w / 2, z), hill(cx + L.w / 2, z), hill(cx, z)) - 0.5 + (i % 3 === 1 ? 1.2 : 0);
    const g = new THREE.Group(); g.position.set(cx, y, z); g.rotation.y = 0.03 * Math.sin(i * 2.3); scene.add(g);
    L.mesh.position.set(0, 0.4, 0); g.add(L.mesh);
    // the scaffold: posts, rails and braces behind the sheet
    for (let k = 0; k <= 3; k++) { const px = -L.w / 2 + 0.6 + k * (L.w - 1.2) / 3; eqMesh(new THREE.BoxGeometry(0.22, 14.5, 0.22), steel, px, 7.2, -1.4, g); eqMesh(new THREE.BoxGeometry(0.18, 0.18, 1.5), steel, px, 4, -0.7, g); eqMesh(new THREE.BoxGeometry(0.18, 0.18, 1.5), steel, px, 10, -0.7, g); }
    for (const yy of [1.5, 7.2, 13]) eqMesh(new THREE.BoxGeometry(L.w - 0.8, 0.16, 0.16), steel, 0, yy, -1.4, g);
    for (let k = 0; k < 3; k++) { const px = -L.w / 2 + 0.6 + (k + 0.5) * (L.w - 1.2) / 3; const b = eqMesh(new THREE.BoxGeometry(0.12, 7.4, 0.12), steel, px, 4.3, -1.42, g); b.rotation.z = 0.5 * (k % 2 ? 1 : -1); }
    const fallS = order.indexOf(i) < 7 ? 402.4 + order.indexOf(i) * 0.42 + 0.15 * hash1(i * 5) : 1e6;
    letters.push({ g, i, fallS, slope: Math.atan(0.62), w: L.w });
  });
  // ---- Mount Lee's mast, the hillside houses
  { const y = hill(175, -255); const m = eqStd('#b8b6b0', 0.5, 0.6); eqMesh(new THREE.BoxGeometry(2.2, 46, 2.2), m, 175, y + 23, -255); eqMesh(new THREE.BoxGeometry(9, 4, 6), eqStd('#d8d4c8', 0.8), 160, y + 2, -250); }
  const houses = [];
  for (let i = 0; i < 420; i++) {
    const hx = r.range(-900, 900), hz = r.range(170, 1300);
    if (Math.abs(hx) < 150 && hz < 460) continue;
    const pal = ['#efe8da', '#e6d8bc', '#f2efe8', '#d8c8a8', '#c8d0d0', '#e8d0b8', '#b8c4cc'];
    houses.push([hx, hz, r.range(9, 16), r.range(9, 14), r.range(5.5, 9.5), r.range(-0.4, 0.4), pal[i % pal.length], 0, r.next() < 0.3 ? r.range(402, 407) : 1e6]);
  }
  const city = eqPostCity(scene, houses, { groundY: hill, seed: 11 });
  // the palms along the streets below (tall, thin: Los Angeles)
  { const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22, 0.32, 1, 6).translate(0, 0.5, 0), eqStd('#7a6a52', 0.9), 120), crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.6, 0), eqStd('#4e6a36', 0.85), 120);
    const M4 = new THREE.Matrix4();
    for (let i = 0; i < 120; i++) { let px = r.range(-800, 800); const pz = r.range(300, 1300), h = r.range(16, 24); if (Math.abs(px) < 160 && pz < 480) px += px < 0 ? -170 : 170; const py = hill(px, pz); M4.makeScale(1, h, 1).setPosition(px, py, pz); trunk.setMatrixAt(i, M4); M4.makeScale(1, 0.55, 1).setPosition(px, py + h, pz); crown.setMatrixAt(i, M4); }
    for (const I of [trunk, crown]) { I.castShadow = true; scene.add(I); }
  }
  const slides = [[-260, -60], [120, 20], [-90, -40], [300, -80]].map(([sx, sz], i) => ({ p: [sx, hill(sx, sz), sz], t: 403.2 + i * 0.9, seed: 300 + i }));
  const cam = B.camera;
  const pc = { scene, camera: cam, sun: B.sun, q };
  pc.frame = (s, u, mode, t) => {
    const lvl = eqQLevel(q, s), M = eqQMag(q, s);
    ground.U.uS.value = s; city.U.uS.value = s; city.U.uLevel.value = lvl; city.U.uBreak.value = 0.4; city.U.uDust.value = MathX.smooth(s, 403, 408) * 0.3;
    // the letters: shake, then fall forward (downhill) about their foot, slide a little, settle
    for (const L of letters) {
      const a = s - L.fallS, wob = lvl * 0.35 * Math.sin(s * 9.3 + L.i * 1.7) + lvl * 0.2 * Math.sin(s * 14.1 + L.i);
      let rx = wob, dz = 0, dy = 0;
      if (a > 0) { const T = 1.5, k = Math.min(1, (a / T) ** 2); rx = wob * (1 - k) + k * (Math.PI / 2 + L.slope - 0.05); const sl = Math.max(0, a - T); dz = Math.min(9, sl * sl * 2.2 + sl * 1.5); dy = -dz * Math.tan(L.slope); }
      L.g.rotation.x = rx; L.g.position.z = 2 * Math.sin(L.i * 1.7) + dz; L.g.userData.dy = dy;
      L.g.position.y = Math.min(hill(L.g.position.x - L.w / 2, 0), hill(L.g.position.x + L.w / 2, 0), hill(L.g.position.x, 0)) - 0.5 + (L.i % 3 === 1 ? 1.2 : 0) + dy;
    }
    // dust: each letter's landing, the slides
    B.soft.begin(); B.adds.begin();
    for (const L of letters) if (s > L.fallS + 1.4) eqBurst(B.soft, B.adds, s, { t: L.fallS + 1.4, p: [L.g.position.x, L.g.position.y + 0.5, L.g.position.z + 9], kind: 'dust', size: 5, n: 26, seed: L.i + 40, life: 9, alpha: 0.6 });
    for (const sl of slides) if (s > sl.t) for (let k = 0; k < 4; k++) eqBurst(B.soft, B.adds, s, { t: sl.t + k * 0.5, p: [sl.p[0] + k * 6, sl.p[1] - k * 9, sl.p[2] + k * 14], kind: 'dust', size: 9, n: 24, seed: sl.seed + k, life: 12, alpha: 0.5 });
    B.soft.end(); B.adds.end();
    // the camera: from the hillside streets below, looking up at the sign
    const P0 = [-46, hill(-46, 285) + 46, 285], P1 = [-36, hill(-36, 255) + 44, 255], k = MathX.clamp(u / 6, 0, 1);
    const g = eqQGround(q, s, 5);
    eqCam(cam, [MathX.lerp(P0[0], P1[0], k) + g[0] * 1.5, MathX.lerp(P0[1], P1[1], k) + g[1], MathX.lerp(P0[2], P1[2], k) + g[2]], [0, 7, -4], 25, g[0] * 20);
    eqShadowFollowAt(B.sun, [0, 0, 0], 140, 1500);
    pc.M = M;
  };
  pc.labels = (s, u) => [{ p: [0, 100, 0], text: 'HOLLYWOOD SIGN', sub: `LOS ANGELES · MAGNITUDE ${eqQMag(q, s)}`, a: MathX.smooth(u, 0.35, 0.8), quake: true, side: 'r' }];
  pc.grade = (p) => { p.exposure = 1.04; p.saturation = 1.12; p.contrast = 1.08; p.warmth = 0.04; };
  return pc;
}
// a sun's shadow box at a point (any postcard: the sun's own direction)
function eqShadowFollowAt(sun, c, R, far = 2000) {
  const d = sun.position.clone().sub(sun.target.position).normalize(), cam = sun.shadow.camera;
  if (cam.right !== R || cam.far !== far) { cam.left = -R; cam.right = R; cam.top = R; cam.bottom = -R; cam.near = 1; cam.far = far; cam.updateProjectionMatrix(); }
  const tex = (2 * R) / sun.shadow.mapSize.x, up = new THREE.Vector3(0, 1, 0), rx = new THREE.Vector3().crossVectors(up, d).normalize(), ry = new THREE.Vector3().crossVectors(d, rx).normalize();
  const C = new THREE.Vector3(c[0], c[1], c[2]), a = Math.round(C.dot(rx) / tex) * tex, b = Math.round(C.dot(ry) / tex) * tex, w = C.dot(d);
  const S = rx.multiplyScalar(a).add(ry.multiplyScalar(b)).add(d.clone().multiplyScalar(w));
  sun.target.position.copy(S); sun.position.copy(S).addScaledVector(d, far * 0.5); sun.target.updateMatrixWorld(); sun.updateMatrixWorld();
}

// =====================================================================================================================
// MEXICO CITY: the Angel of Independence in its roundabout on the Paseo de la Reforma (running south-west to
// north-east), towers along the avenue; the old lake bed's slow waves
// =====================================================================================================================
function eqPostMexico(app) {
  const sun = eqSunV(150, 60);
  const B = eqPostBase(app, { sky: '#9cc0e4', fog: 0.00011, fogColor: '#d6d8d4', hemi: ['#e0e8f2', '#7a7060', 1.0], sun, sunColor: '#fff4e2', sunI: 3.1, shadowR: 160, env: ['#9cc0e4', '#e2e6e8', '#706858'],
    top: '#3f84d6', hor: '#b8cfe2', low: '#b0a898', sunDir: eqN3(sun), sunGlow: '#fff4d8' });
  const scene = B.scene, q = EQ_Q.mexico, r = new RNG(1810);
  const A = Math.PI / 4, ax = [Math.sin(A), -Math.cos(A)], bx = [Math.cos(A), Math.sin(A)];   // along the avenue (towards the north-east), across it
  const toW = (a, b) => [ax[0] * a + bx[0] * b, ax[1] * a + bx[1] * b];
  const WAVE = [2 * Math.PI / 150, 75, 1e9];
  const ground = eqPostGround(scene, { size: [6000, 6000], segs: [600, 600], h: () => 0, wave: WAVE, key: 'mx', rough: 0.9,
    col: () => [0.62, 0.6, 0.56],
    paint: `{
      vec2 ax = vec2(${ax[0].toFixed(5)}, ${ax[1].toFixed(5)}), bx = vec2(${bx[0].toFixed(5)}, ${bx[1].toFixed(5)});
      float a = dot(p, ax), b = dot(p, bx), rr = length(p);
      vec3 asph = vec3(0.24, 0.24, 0.25) * (0.92 + 0.12 * eqH2(floor(p * 2.0)));
      vec3 walk = vec3(0.66, 0.63, 0.58), grass = vec3(0.32, 0.42, 0.22);
      float ab = abs(b);
      vec3 c = walk;
      if (ab < 30.0) {
        c = asph;
        if (ab < 2.0) c = grass * 0.9;                                         // the central median
        else if (ab > 12.5 && ab < 17.0) c = mix(grass, walk, step(0.5, fract(a / 9.0)) * 0.3);   // the tree medians
        float lane = ab < 12.5 ? fract((ab - 2.0) / 3.5) : fract((ab - 17.0) / 3.3);
        float dash = step(0.5, fract(a / 9.0));
        if ((ab > 2.0 && ab < 12.5) || (ab > 17.0 && ab < 27.0)) c = mix(c, vec3(0.9), step(abs(lane - 0.5), 0.02) * dash * 0.85);
      }
      // a grid of streets off the avenue
      vec2 gq = vec2(a, b) / 110.0; vec2 gf = abs(fract(gq) - 0.5) * 110.0;
      if (ab > 40.0 && min(gf.x, gf.y) < 7.0) c = asph;
      // the roundabout
      if (rr < 52.0) c = rr < 24.0 ? mix(walk, vec3(0.7, 0.68, 0.62), step(0.5, fract(rr / 3.0)) * 0.4) : rr < 27.0 ? grass : asph;
      diffuseColor.rgb = c;
    }` });
  // ---- the buildings along the avenue (and the three tallest towers in the south-west)
  const pals = ['#d8cdb8', '#c8b49a', '#e6e0d4', '#b8a890', '#9aa6b0', '#a8b6c0', '#c86a4a', '#ece6da', '#7f96a8', '#5f7484'];
  const blds = eqPostBlocks(r, -1800, 1200, -700, 700, 46, -(A - Math.PI / 2) + Math.PI / 2 - Math.PI / 2, (x, z, rr, a, b) => {
    const ab = Math.abs(b); if (ab < 38 || Math.hypot(x, z) < 70) return null;
    const front = ab < 85, tall = front && rr.next() < 0.22;
    const h = tall ? rr.range(70, 150) : front ? rr.range(18, 55) : rr.range(9, 28);
    return [rr.range(22, 38), rr.range(22, 36), h, tall ? pals[8 + (rr.next() < 0.5 ? 0 : 1)] : pals[Math.floor(rr.next() * 8)], tall ? 3 : rr.next() < 0.5 ? 2 : 1];
  });
  // (fix the grid's frame: a along ax, b along bx)
  for (const b of blds) { const [a0, b0] = [b[0] * ax[0] + b[1] * ax[1], b[0] * bx[0] + b[1] * bx[1]]; void a0; void b0; }
  const named = [[-950, -60, 246, '#9a9a94'], [-1060, 62, 235, '#6a7e8e'], [-1210, -58, 225, '#7ea2bc']].map(([a, b, h, c]) => { const [x, z] = toW(a, b); return [x, z, 40, 40, h, -A, c, 3]; });
  const all = blds.concat(named);
  all.forEach((b, i) => { b[8] = b[7] === 1 && hash1(i * 3) < 0.25 ? 409 + hash1(i * 7) * 9 : 1e6; });
  const city = eqPostCity(scene, all, { wave: WAVE, seed: 13 });
  // ---- trees on the medians (instanced, riding the wave)
  const treeMat = (col) => { const m = eqStd(col, 0.85); const U = ground.U; m.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U); sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + EQ_WAVE_GLSL).replace('#include <begin_vertex>', `#include <begin_vertex>
      vec2 eqB = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xz; transformed.y += eqWaveY(eqB) / max(0.001, length(instanceMatrix[1].xyz));`); }; m.customProgramCacheKey = () => 'eqTree' + col; return m; };
  const NT = 260, trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25, 0.35, 1, 6).translate(0, 0.5, 0), treeMat('#5a4a3a'), NT), crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), treeMat('#4f7034'), NT);
  { const M4 = new THREE.Matrix4(); let n = 0;
    for (let a = -1500; a < 1100 && n < NT; a += 18) for (const b of [-14.8, 14.8, -33, 33]) { if (n >= NT || Math.abs(a) < 60) continue; const [x, z] = toW(a + r.range(-3, 3), b); const h = r.range(6, 9), cr = r.range(3.2, 4.6);
      M4.makeScale(1, h, 1).setPosition(x, 0, z); trunks.setMatrixAt(n, M4); M4.makeScale(cr, cr * 0.85, cr).setPosition(x, h + cr * 0.4, z); crowns.setMatrixAt(n, M4); n++; }
    trunks.count = crowns.count = n; for (const I of [trunks, crowns]) { I.castShadow = true; I.receiveShadow = true; I.frustumCulled = false; scene.add(I); } }
  // ---- the Angel: steps, pedestal with bronze figures, the column, the capital, the golden angel
  const angel = new THREE.Group(); scene.add(angel);
  const stone = eqStd('#c9c2b2', 0.8), marble = eqStd('#e9e3d6', 0.6), bronze = eqStd('#3f4a3c', 0.55, 0.6), gold = eqStd('#d9a845', 0.3, 0.95);
  [[30, 1.0], [26, 1.0], [22, 1.0]].forEach(([w, h], i) => eqBox(w, h, w, stone, 0, i + h / 2, 0, angel));
  eqBox(13, 8, 13, stone, 0, 3 + 4, 0, angel); eqBox(14.2, 1.0, 14.2, marble, 0, 11.5, 0, angel);
  for (const [cx, cz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const f = new THREE.Group(); f.position.set(cx * 9, 3, cz * 9); angel.add(f); eqBox(3.2, 2.2, 3.2, stone, 0, 1.1, 0, f); eqCyl(0.9, 1.2, 2.6, bronze, 0, 3.5, 0, f, 10); eqMesh(new THREE.SphereGeometry(0.6, 10, 8), bronze, 0, 5.2, 0, f); }
  eqCyl(3.4, 3.6, 2.4, marble, 0, 13.2, 0, angel, 24);
  { const fl = new THREE.CylinderGeometry(1.7, 2.0, 32, 24, 1, false); const P = fl.attributes.position; for (let i = 0; i < P.count; i++) { const a = Math.atan2(P.getZ(i), P.getX(i)), k = 1 - 0.06 * Math.pow(0.5 + 0.5 * Math.cos(a * 12), 3); P.setX(i, P.getX(i) * k); P.setZ(i, P.getZ(i) * k); } fl.computeVertexNormals(); eqMesh(fl, marble, 0, 14.4 + 16, 0, angel); }
  for (const y of [14.6, 22, 30, 38]) eqMesh(new THREE.TorusGeometry(2.0, 0.22, 6, 24).rotateX(Math.PI / 2), gold, 0, y, 0, angel);
  eqCyl(2.6, 1.8, 2.2, gold, 0, 47.5, 0, angel, 20); eqCyl(2.8, 2.8, 0.5, marble, 0, 48.8, 0, angel, 20);
  const statue = new THREE.Group(); statue.position.set(0, 49.1, 0); angel.add(statue);
  eqMesh(new THREE.SphereGeometry(0.8, 14, 10), gold, 0, 0.5, 0, statue);
  eqCyl(0.35, 0.75, 3.4, gold, 0, 2.7, 0, statue, 12); eqMesh(new THREE.SphereGeometry(0.36, 12, 10), gold, 0, 4.7, 0.05, statue);
  for (const sd of [-1, 1]) { const wg = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 3.4).translate(sd * 0.75, 1.2, 0), gold); wg.material.side = THREE.DoubleSide; wg.position.set(sd * 0.2, 3.4, -0.35); wg.rotation.set(0.35, sd * 0.5, sd * 0.25); wg.castShadow = true; statue.add(wg); }
  { const arm = eqCyl(0.12, 0.14, 2.0, gold, 0.5, 5.0, 0, statue, 8); arm.rotation.z = -0.3; eqMesh(new THREE.TorusGeometry(0.45, 0.08, 6, 16), gold, 0.85, 6.1, 0, statue); }
  angel.traverse((o2) => { if (o2.isMesh) { o2.castShadow = true; o2.receiveShadow = true; } });
  // ---- cars stopped on the avenue
  const cars = [];
  { const types = ['sedan', 'hatch', 'suv', 'taxi', 'sedan', 'van']; const cols = ['#e8e6e0', '#2a2a30', '#9a2a24', '#3a5a7a', '#c8c4b8', '#d8d4cc'];
    for (let i = 0; i < 34; i++) { const a = -900 + i * 30 + r.range(-6, 6), lane = [3.8, 7.3, 10.8, 18.6, 22.0, 25.4][i % 6] * (i % 2 ? 1 : -1); if (Math.abs(a) < 70) continue;
      let v; try { v = VehicleFactory.build(types[i % types.length], cols[i % cols.length]); } catch (e) { continue; }
      const [x, z] = toW(a, lane); v.group.position.set(x, 0, z); v.group.rotation.y = Math.atan2(ax[0], ax[1]) - Math.PI / 2 + (lane > 0 ? Math.PI : 0); scene.add(v.group); cars.push({ v, x, z, ry: v.group.rotation.y, i }); } }
  const cam = B.camera, pc = { scene, camera: cam, sun: B.sun, q };
  pc.frame = (s, u, mode, t) => {
    void t;
    const lvl = eqQLevel(q, s), jelly = mode === 'jelly';
    const wA = (jelly ? 0.35 + 0.5 * MathX.smooth(u, 0, 4) : 0.12 + 0.1 * MathX.smooth(u, 0, 4)) * MathX.clamp(lvl / 0.08, 0.5, 1.5);
    for (const U of [ground.U, city.U]) { U.uS.value = s; U.uWaveA.value = wA; U.uEpi.value.set(-40000, 40000); }
    city.U.uLevel.value = lvl * 1.6; city.U.uBreak.value = 0.25 + 0.3 * MathX.smooth(s, 409, 418); city.U.uDust.value = MathX.smooth(s, 410, 420) * 0.25;
    // the Angel rides the wave and rocks with its slope (and the shaking)
    const hy = eqWaveAt(0, 0, ground.U), d = 2, gx = (eqWaveAt(d, 0, ground.U) - eqWaveAt(-d, 0, ground.U)) / (2 * d), gz = (eqWaveAt(0, d, ground.U) - eqWaveAt(0, -d, ground.U)) / (2 * d), gg = eqQGround(q, s, 9);
    angel.position.y = hy; angel.rotation.z = -gx * 0.9 + gg[0] * 0.06; angel.rotation.x = gz * 0.9 + gg[2] * 0.06;
    statue.rotation.z = gg[0] * 0.15;
    for (const c of cars) { const y = eqWaveAt(c.x, c.z, ground.U), sx = (eqWaveAt(c.x + 2, c.z, ground.U) - eqWaveAt(c.x - 2, c.z, ground.U)) / 4, sz = (eqWaveAt(c.x, c.z + 2, ground.U) - eqWaveAt(c.x, c.z - 2, ground.U)) / 4;
      c.v.group.position.y = y; c.v.group.rotation.set(sz, c.ry, -sx); if (c.v.hazard) { const on = Math.floor(s * 1.6 + c.i * 0.37) % 2 === 0; c.v.hazard.emissiveIntensity = on ? 2.2 : 0; } }
    B.soft.begin(); B.adds.begin();
    city.B.forEach((b, i) => { if (b[8] < 1e5 && s > b[8]) eqBurst(B.soft, B.adds, s, { t: b[8] + 1.5, p: [b[0], 0, b[1]], kind: 'dust', size: Math.min(14, b[2] * 0.4), n: 22, seed: i + 70, life: 14, alpha: 0.55 }); });
    B.soft.end(); B.adds.end();
    const g = eqQGround(q, s, 7), k = MathX.clamp(u / 6, 0, 1);
    if (!jelly) { const p = toW(MathX.lerp(-170, -150, k), 6), at = [0, 30, 0]; eqCam(cam, [p[0] + g[0] * 3, 13 + g[1] * 2, p[1] + g[2] * 3], at, 42, g[0] * 30); }
    else { const p = toW(MathX.lerp(-420, -390, k), -55), at = toW(-60, 4); eqCam(cam, [p[0] + g[0] * 2, 78 + g[1], p[1] + g[2] * 2], [at[0], -22, at[1]], 46, g[0] * 15); }
    eqShadowFollowAt(B.sun, toW(-80, 0).reduce((o2, v, i) => (i ? [o2[0], 0, v] : [v]), []), 220, 2000);
  };
  pc.labels = (s, u, mode) => mode === 'jelly' ? [] : [{ p: [0, 78, 0], text: 'ANGEL OF INDEPENDENCE', sub: `MEXICO CITY · ${eqClock(s, -6)} · MAGNITUDE ${eqQMag(q, s)}`, a: MathX.smooth(u, 0.35, 0.8), quake: true, side: 'r' }];
  pc.grade = (p) => { p.exposure = 1.05; p.saturation = 1.12; p.contrast = 1.08; p.warmth = 0.03; };
  return pc;
}

// =====================================================================================================================
// THE HOOVER DAM (the Nevada earthquake, 20 km away): the concrete arch across Black Canyon (221 m tall, 379 m along
// its crest), Lake Mead behind it (upstream, −z), the intake towers, the river and the power plant below
// =====================================================================================================================
function eqPostDam(app) {
  const sun = eqSunV(130, 42);
  const B = eqPostBase(app, { sky: '#9cc4ea', fog: 0.00005, fogColor: '#d8dcdc', hemi: ['#dce8f4', '#8a6a50', 1.0], sun, sunColor: '#fff0dc', sunI: 3.2, shadowR: 420, shadowFar: 4000, env: ['#8fbce8', '#e0e2e0', '#6a5040'],
    top: '#3a80d8', hor: '#b6cfe6', low: '#a08070', sunDir: eqN3(sun), sunGlow: '#fff2d8' });
  const scene = B.scene, q = EQ_Q.nevada;
  const RIV = -221, halfW = (y) => 48 + (y - RIV) / 2.1;
  const canyon = (x, z) => {
    const w = 48 + 6 * Math.sin(z / 140), d = Math.abs(x) - w - 10 * Math.sin(z / 90 + x / 200);
    let y = d < 0 ? RIV : RIV + d * 2.1 * (1 + 0.15 * Math.sin(z / 37 + x / 29));
    y = Math.min(y, 70 + 18 * Math.sin(x / 160 + z / 210) + 10 * Math.sin(z / 55));
    // (upstream the canyon opens into the lake's basin)
    if (z < -260) y = Math.min(y, MathX.lerp(y, -40, MathX.smooth(-z, 260, 900)));
    return y + 2.5 * Math.sin(x / 5.3) * Math.sin(z / 4.7);
  };
  eqPostGround(scene, { size: [3600, 4200], segs: [360, 420], at: [0, 100], h: canyon, key: 'dam', rough: 0.95,
    col: (x, z, y) => { const band = 0.5 + 0.5 * Math.sin(y / 7 + Math.sin(x / 40) * 0.8); const c1 = [0.56, 0.38, 0.27], c2 = [0.42, 0.3, 0.24], top = [0.66, 0.55, 0.42];
      const k = MathX.smooth(y, 40, 80); return c1.map((v, i) => (v + (c2[i] - v) * band) * (1 - k) + top[i] * k); },
    paint: `float cr = smoothstep(0.75, 0.95, eqH2(floor(vec2(p.x / 2.5, vWP.y / 1.6)))); diffuseColor.rgb *= 1.0 - 0.25 * cr;` });
  // ---- the dam: upstream face an arc (radius 300 m, centre downstream), the downstream face set back by the
  // thickness at each height (14 m at the crest, 200 m at the base)
  const R = 300, th = (y) => 14 + 186 * Math.pow(Math.max(0, -y) / 221, 1.6);
  const NX = 80, NY = 44, pos = [], idx = [], uv = [];
  const ptUp = (x, y) => [x, y, R - Math.sqrt(Math.max(0, R * R - x * x)) - 6];
  for (const face of [0, 1]) for (let j = 0; j <= NY; j++) {
    const y = RIV - 4 + (0 + 4 - RIV) * j / NY, w = halfW(y) + 14;
    for (let i = 0; i <= NX; i++) { const x = -w + 2 * w * i / NX, p = ptUp(x, y); if (face) p[2] += th(y); pos.push(p[0], p[1], p[2]); uv.push(i / NX, j / NY); }
  }
  const row = NX + 1, off = (NY + 1) * row;
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const a = j * row + i, b = a + 1, c = a + row, d = c + 1; idx.push(a, c, b, b, c, d); idx.push(off + a, off + b, off + c, off + b, off + d, off + c); }
  // the crest: join the two faces along the top
  for (let i = 0; i < NX; i++) { const a = NY * row + i, b = a + 1; idx.push(a, b, off + a, b, off + b, off + a); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); dg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); dg.setIndex(idx); dg.computeVertexNormals();
  const damTex = eqTex(eqCanvas(512, 512, (g) => { g.fillStyle = '#d6cfc2'; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${90 + i % 40},${80 + i % 30},70,${0.03 + 0.05 * hash1(i)})`; g.fillRect(hash1(i * 3) * 512, hash1(i * 5) * 512, 2 + hash1(i * 7) * 6, 30 + hash1(i * 11) * 160); }
    for (let y = 0; y < 512; y += 23) { g.fillStyle = 'rgba(80,70,60,0.08)'; g.fillRect(0, y, 512, 2); } }), { repeat: true });
  damTex.repeat.set(6, 4);
  const damU = { uCrack: { value: 0 }, uWet: { value: 0 } };
  const damMat = eqStd('#c4bcb0', 0.85, 0, { map: damTex, side: THREE.DoubleSide });
  damMat.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, damU); sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      uniform float uCrack, uWet; float eqH3(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float eqCrackL(vec2 q, float s) { vec2 c = floor(q), f = fract(q); float d = 9.0; for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) { vec2 o = vec2(float(i), float(j)); vec2 r = o + vec2(eqH3(c + o + s), eqH3(c + o + s + 3.7)) - f; d = min(d, dot(r, r)); } return d; }`)
    .replace('#include <color_fragment>', `#include <color_fragment>
      { vec2 q = vUv * vec2(26.0, 14.0); float a = eqCrackL(q, 1.0), b = eqCrackL(q + 0.5, 2.0); float edge = abs(sqrt(a) - sqrt(b));
        float grow = smoothstep(0.0, 1.0, uCrack * 1.4 - (1.0 - vUv.y) * 0.9 - abs(vUv.x - 0.5) * 0.8);
        float crack = (1.0 - smoothstep(0.0, 0.035, edge)) * grow; diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.08, 0.07, 0.06), crack);
        diffuseColor.rgb *= 1.0 - 0.3 * uWet * smoothstep(0.4, 1.0, vUv.y) * (0.6 + 0.4 * eqH3(floor(vUv * vec2(60.0, 4.0)))); }`); };
  damMat.defines = { USE_UV: '' }; damMat.customProgramCacheKey = () => 'eqDam';
  const dam = new THREE.Mesh(dg, damMat); dam.castShadow = true; dam.receiveShadow = true; scene.add(dam);
  // the crest road's parapets, the intake towers, the power plant, the lake, the river
  const conc = eqStd('#d8d0c2', 0.8);
  for (let x = -150; x <= 150; x += 6) { const p = ptUp(x, 0); eqBox(6.2, 1.2, 0.5, conc, p[0], 0.6, p[2] + 0.4, null, -Math.asin(MathX.clamp(x / R, -1, 1))); }
  const towers = [[-118, -70], [-95, -105], [118, -70], [95, -105]].map(([tx, tz]) => { const g = new THREE.Group(); g.position.set(tx, 0, tz); scene.add(g); eqCyl(9, 10, 230, conc, 0, -100, 0, g, 20); eqCyl(10.5, 9, 6, conc, 0, 18, 0, g, 20); eqCyl(6, 7, 4, eqStd('#b8b0a2', 0.7), 0, 23, 0, g, 16); g.traverse((o2) => { if (o2.isMesh) o2.castShadow = true; }); return g; });
  eqBox(260, 22, 26, conc, 0, RIV + 11, th(RIV) + 6);
  for (const sd of [-1, 1]) eqBox(26, 22, 170, conc, sd * 70, RIV + 11, th(RIV) - 60);
  const lakeM = new THREE.MeshStandardMaterial({ color: '#2d6a86', roughness: 0.15, metalness: 0.2 });
  const lake = new THREE.Mesh(new THREE.PlaneGeometry(3600, 2200).rotateX(-Math.PI / 2), lakeM); lake.position.set(0, -9, -1150); scene.add(lake);
  const lake2 = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([...Array(41)].map((_, i) => { const x = -300 + 15 * i; return new THREE.Vector2(x, -(R - Math.sqrt(Math.max(0, R * R - x * x)) - 6) + 0.5); }).concat([new THREE.Vector2(300, 60), new THREE.Vector2(-300, 60)]))).rotateX(-Math.PI / 2), lakeM); lake2.position.y = -9; scene.add(lake2);
  const river = new THREE.Mesh(new THREE.PlaneGeometry(240, 3000).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#3f7a6a', roughness: 0.2 })); river.position.set(0, RIV + 4, 1600); scene.add(river);
  // the notch at the top of the dam's middle that breaks away, and the water that comes through it
  const notch = new THREE.Group(); scene.add(notch);
  const blocks = []; for (let i = 0; i < 14; i++) { const bx = -30 + (i % 7) * 10, by = -8 - Math.floor(i / 7) * 12, p = ptUp(bx, by); const m = eqBox(10.5, 12.5, th(by) + 2, conc, p[0], p[1] - 6, p[2] + th(by) / 2, notch); blocks.push({ m, p0: m.position.clone(), i }); }
  const fallM = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uS: { value: 0 }, uA: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uS, uA; varying vec2 vUv; float h(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
      void main(){ float x = vUv.x, y = vUv.y; float n = h(vec2(floor(x * 40.0), floor((y + uS * 1.6) * 30.0))); float edge = smoothstep(0.0, 0.12, x) * smoothstep(1.0, 0.88, x);
        float reach = smoothstep(1.0 - uA, 1.0 - uA + 0.05, y); vec3 c = mix(vec3(0.62, 0.74, 0.8), vec3(0.97), 0.5 + 0.5 * n); gl_FragColor = vec4(c, edge * reach * (0.7 + 0.3 * n)); }` });
  const fallGeo = new THREE.PlaneGeometry(60, 1, 16, 40); { const P = fallGeo.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), v = P.getY(i) + 0.5, y = -v * 225 + 2, p = ptUp(x, y); P.setXYZ(i, x * (1 + v * 0.6), y, p[2] + th(y) + 3 + v * 30); } }
  const falls = new THREE.Mesh(fallGeo, fallM); falls.renderOrder = 4; scene.add(falls);
  const jets = [[-60, -40], [40, -70], [-20, -95], [75, -55], [5, -130], [-90, -110]].map(([jx, jy], i) => ({ jx, jy, t: 455.0 + i * 0.45 }));
  const cam = B.camera, pc = { scene, camera: cam, sun: B.sun, q };
  pc.frame = (s, u) => {
    const lvl = eqQLevel(q, s, 0.8), BRK = 456.6;
    damU.uCrack.value = MathX.smooth(s, 453.2, 457.5); damU.uWet.value = MathX.smooth(s, 455, 459);
    for (const b of blocks) { const a = s - BRK - (b.i % 7) * 0.05 - Math.floor(b.i / 7) * 0.2; if (a > 0) { b.m.position.set(b.p0.x + (b.p0.x) * 0.02 * a, b.p0.y - 4.9 * a * a, b.p0.z + 6 * a); b.m.rotation.set(0.5 * a, 0, 0.2 * a * (hash1(b.i) - 0.5)); } else { b.m.position.copy(b.p0); b.m.rotation.set(0, 0, 0); } b.m.visible = b.m.position.y > RIV - 10; }
    fallM.uniforms.uS.value = s; fallM.uniforms.uA.value = MathX.smooth(s, BRK + 0.3, BRK + 3.2); falls.visible = s > BRK;
    for (const tw of towers) { tw.rotation.z = lvl * 0.04 * Math.sin(s * 3.1 + tw.position.x); }
    B.soft.begin(); B.adds.begin();
    for (const j of jets) if (s > j.t) {
      const p = ptUp(j.jx, j.jy), z0 = p[2] + th(j.jy), a = s - j.t, pw = MathX.smooth(a, 0, 1.5);
      for (let i = 0; i < 70; i++) { const ph = ((a * 1.4 + hash1(i * 7 + j.t * 10)) % 1), tt = ph * 2.2, v = 18 + 14 * pw, x = p[0] + (hash1(i * 3) - 0.5) * 3 * (1 + tt), y = j.jy - 4.9 * tt * tt, z = z0 + v * tt;
        if (ph > a * 1.4) continue; B.soft.add(x, y, z, 2.2 + 5 * ph, 0.55 * (1 - ph) * pw, 0.92, 0.95, 0.97); }
    }
    if (s > BRK) for (let i = 0; i < 160; i++) { const ph = ((s - BRK) * 0.5 + hash1(i * 13)) % 1, y = -6 - ph * 215, x = (hash1(i * 5) - 0.5) * 60 * (1 + ph * 0.6), pz = ptUp(x, y)[2] + th(y) + 6 + ph * 30;
      B.soft.add(x, y, pz, 8 + 16 * ph, 0.5 * MathX.smooth(s, BRK + 0.3, BRK + 1.5) * (1 - 0.5 * ph), 0.95, 0.97, 0.98); }
    for (let i = 0; i < 4; i++) eqBurst(B.soft, B.adds, s, { t: 453.6 + i * 1.3, p: [(i % 2 ? 1 : -1) * (150 + i * 20), 30 - i * 40, 120 + i * 60], kind: 'dust', size: 14, n: 24, seed: 500 + i, life: 12, alpha: 0.5 });
    B.soft.end(); B.adds.end();
    const g = eqQGround(q, s, 3, 0.8), k = MathX.clamp(u / 6.5, 0, 1);
    eqCam(cam, [MathX.lerp(70, 60, k) + g[0] * 4, MathX.lerp(52, 46, k) + g[1] * 3, MathX.lerp(560, 520, k) + g[2] * 4], [0, -70, 20], 50, g[0] * 18);
    eqShadowFollowAt(B.sun, [0, -100, 100], 420, 3000);
  };
  pc.labels = (s, u) => [{ p: [0, 12, -10], text: 'HOOVER DAM', sub: `NEVADA · MAGNITUDE ${eqQMag(q, s)}`, a: MathX.smooth(u, 0.35, 0.8), quake: true, side: 'r' }];
  pc.grade = (p) => { p.exposure = 1.04; p.saturation = 1.14; p.contrast = 1.1; p.warmth = 0.05; };
  return pc;
}

// =====================================================================================================================
// SEATTLE: the Space Needle (184 m) seen from Queen Anne hill, downtown behind it, Mount Rainier 90 km away
// =====================================================================================================================
function eqPostNeedle(app) {
  const sun = eqSunV(140, 33);
  const B = eqPostBase(app, { sky: '#9ec4e8', fog: 0.0000075, fogColor: '#cad8e4', hemi: ['#dce6f2', '#5a6050', 1.0], sun, sunColor: '#fff0dc', sunI: 3.0, shadowR: 300, shadowFar: 3000, env: ['#9ec4e8', '#e0e6ec', '#506050'],
    top: '#3f82d6', hor: '#b6cfe6', low: '#8a9a9a', sunDir: eqN3(sun), sunGlow: '#fff0d0' });
  const scene = B.scene, q = EQ_Q.seattle, r = new RNG(1962);
  const land = (x, z) => { let y = 10 + 2 * Math.sin(x / 300) * Math.sin(z / 260); y += 85 * Math.exp(-((x + 300) ** 2 + (z + 1250) ** 2) / (2 * 500 * 500)); y += 30 * Math.exp(-((x - 900) ** 2 + (z - 1400) ** 2) / (2 * 700 * 700));
    const shore = x + 0.35 * z + 1100; return shore < 0 ? -6 + Math.max(-14, shore * 0.05) : y * MathX.smooth(shore, 0, 120); };
  eqPostGround(scene, { size: [12000, 12000], segs: [300, 300], h: land, key: 'sea', col: (x, z, y) => (y < -1 ? [0.2, 0.3, 0.32] : [0.34 + 0.06 * Math.sin(x / 70), 0.4, 0.3]),
    paint: `vec2 g = abs(fract(p / vec2(110.0, 90.0)) - 0.5) * vec2(110.0, 90.0); float st = 1.0 - step(6.0, min(g.x, g.y)); if (vWP.y > 0.5) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.36, 0.36, 0.37), st * 0.85);` });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(60000, 60000).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#28566e', roughness: 0.2, metalness: 0.1 })); sea.position.y = -1; scene.add(sea);
  // Mount Rainier: 4,392 m, 90 km to the south-east, snow above 2,400 m
  { const geo = new THREE.ConeGeometry(17000, 4392, 64, 24, true); const P = geo.attributes.position, C = new Float32Array(P.count * 3);
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i) + 2196, z = P.getZ(i), a = Math.atan2(z, x), w = 1 + 0.12 * Math.sin(a * 5) + 0.06 * Math.sin(a * 13 + y / 300); P.setX(i, x * w); P.setZ(i, z * w); P.setY(i, y * (1 - 0.06 * Math.sin(a * 3)));
      const snow = MathX.smooth(y + 300 * Math.sin(a * 7), 1900, 2500); C.set([0.42 + 0.53 * snow, 0.45 + 0.52 * snow, 0.5 + 0.48 * snow], i * 3); }
    geo.setAttribute('color', new THREE.BufferAttribute(C, 3)); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 })); m.position.set(56300, -60, 68700); scene.add(m); }
  // downtown (south-east of the Needle), Seattle Center's low buildings
  const blds = eqPostBlocks(r, -1500, 4000, -2400, 3600, 60, 0, (x, z, rr) => {
    if (land(x, z) < 0 || Math.hypot(x, z) < 120 || (Math.hypot(x + 300, z + 1250) < 260)) return null;
    { const dx = x + 330, dz = z + 1240, d = Math.hypot(dx, dz); if (d < 380 || (d < 1260 && Math.abs(Math.atan2(dx, dz) - 0.26) < 0.13)) return null; }   // (the view from Queen Anne to the Needle stays open)
    const dt = Math.exp(-((x - 900) ** 2 + (z - 1900) ** 2) / (2 * 450 * 450)), tall = rr.next() < dt * 0.85 && dt > 0.25;
    const h = tall ? rr.range(80, 220 + 60 * dt) : rr.range(8, 30 + 30 * dt);
    return [rr.range(24, 44), rr.range(24, 44), h, tall ? ['#5f7484', '#3d4f5e', '#7f96a8', '#4a5a66', '#8a8f94'][Math.floor(rr.next() * 5)] : ['#d8d0c0', '#b8a890', '#c8c8c4', '#9a6a52', '#e4dccc'][Math.floor(rr.next() * 5)], tall ? 3 : rr.next() < 0.5 ? 2 : 1];
  });
  blds.forEach((b, i) => { b[8] = hash1(i * 5) < 0.12 ? 460.5 + hash1(i * 9) * 4.5 : 1e6; });
  const city = eqPostCity(scene, blds, { groundY: land, seed: 17 });
  // ---- the Space Needle: three pairs of legs (wide at the foot, a waist at 2/3, out again under the top house), the
  // core, the 30 m ring, the saucer, the roof and the spire
  const needle = new THREE.Group(); needle.position.set(0, land(0, 0), 0); scene.add(needle);
  const white = eqStd('#f0eee8', 0.45, 0.2), grey = eqStd('#8a8e94', 0.5, 0.5), glass = eqStd('#4a6070', 0.15, 0.6), roof = eqStd('#e8e2d4', 0.4, 0.3);
  const legR = (y) => { const a = y / 152; return y < 101 ? MathX.lerp(17, 4.2, Math.pow(a / 0.66, 0.8)) : MathX.lerp(4.2, 12, Math.pow((a - 0.66) / 0.34, 1.6)); };
  for (let k = 0; k < 3; k++) for (const sd of [-1, 1]) {
    const pts = []; for (let i = 0; i <= 24; i++) { const y = i / 24 * 152, R0 = legR(y), a = k * 2.094 + sd * (0.2 + 0.1 * (1 - y / 152)); pts.push(new THREE.Vector3(Math.cos(a) * R0, y, Math.sin(a) * R0)); }
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 1.3, 8, false), white); m.castShadow = true; needle.add(m);
  }
  for (const y of [8, 30, 60, 90, 120, 140]) { const R0 = legR(y); const ring = new THREE.Mesh(new THREE.TorusGeometry(R0, y === 30 ? 1.6 : 0.4, 8, 36).rotateX(Math.PI / 2), white); ring.position.y = y; ring.castShadow = true; needle.add(ring); }
  eqCyl(3.2, 3.6, 160, grey, 0, 80, 0, needle, 16);
  eqCyl(9.5, 9.5, 5, white, 0, 30, 0, needle, 24);
  const top = new THREE.Group(); top.position.y = 152; needle.add(top);
  eqCyl(13, 6, 6, white, 0, 3, 0, top, 32); eqCyl(20.5, 13, 3, white, 0, 7.5, 0, top, 40); eqCyl(20.8, 20.8, 6, glass, 0, 12, 0, top, 40); eqCyl(21.4, 21.4, 1.2, white, 0, 15.5, 0, top, 40);
  eqCyl(12, 23, 3.2, roof, 0, 17.6, 0, top, 40); eqCyl(4, 12, 4.4, roof, 0, 21.4, 0, top, 24); eqCyl(0.5, 1.4, 12, grey, 0, 29.6, 0, top, 8);
  needle.traverse((o2) => { if (o2.isMesh) { o2.castShadow = true; o2.receiveShadow = true; } });
  const cam = B.camera, pc = { scene, camera: cam, sun: B.sun, q };
  const FALL = 461.9;
  pc.frame = (s, u) => {
    const lvl = eqQLevel(q, s);
    city.U.uS.value = s; city.U.uLevel.value = lvl; city.U.uBreak.value = 0.45; city.U.uDust.value = MathX.smooth(s, 461, 466) * 0.3;
    // the sway (a tall tower's slow period, ~4 s), growing; then the legs give way and it goes over
    const sw = lvl * 0.22 * Math.sin(s * 1.55) + lvl * 0.08 * Math.sin(s * 3.7 + 1), a = Math.max(0, s - FALL), k = Math.min(1.45, 0.08 * a + 0.22 * a * a);
    needle.rotation.z = sw - k * 0.95; needle.rotation.x = sw * 0.5 + k * 0.35; needle.position.y = land(0, 0) - Math.min(30, a * a * 3);
    top.rotation.z = -a * 0.15;
    B.soft.begin(); B.adds.begin();
    city.B.forEach((b, i) => { if (b[8] < 1e5 && s > b[8]) eqBurst(B.soft, B.adds, s, { t: b[8] + 1.5, p: [b[0], land(b[0], b[1]), b[1]], kind: 'dust', size: Math.min(18, b[4] * 0.25), n: 18, seed: i + 90, life: 14, alpha: 0.5 }); });
    if (a > 0) eqBurst(B.soft, B.adds, s, { t: FALL + 0.2, p: [0, land(0, 0), 0], kind: 'dust', size: 16, n: 40, seed: 7, life: 10, alpha: 0.6 });
    B.soft.end(); B.adds.end();
    const g = eqQGround(q, s, 13), kk = MathX.clamp(u / 5.5, 0, 1);
    const P = [MathX.lerp(-336, -326, kk), land(-300, -1250) + 30, MathX.lerp(-1250, -1230, kk)], yaw = 26 * Math.PI / 180;
    eqCam(cam, [P[0] + g[0] * 2, P[1] + g[1] * 1.5, P[2] + g[2] * 2], [P[0] + Math.sin(yaw) * 2000, 80, P[2] + Math.cos(yaw) * 2000], 18, g[0] * 15);
    eqShadowFollowAt(B.sun, [0, 0, 0], 300, 3000);
  };
  pc.labels = (s, u) => [{ p: new THREE.Vector3(0, 190, 0).applyMatrix4(needle.matrixWorld), text: 'SPACE NEEDLE', sub: `SEATTLE · MAGNITUDE ${eqQMag(q, s)}`, a: MathX.smooth(u, 0.35, 0.8) * (1 - MathX.smooth(s, FALL + 0.6, FALL + 1.2)), quake: true, side: 'r' },
    { p: [56300, 4600, 68700], text: 'MOUNT RAINIER', sub: '90 KM AWAY', a: MathX.smooth(u, 0.9, 1.4) * 0.9 }];
  pc.grade = (p) => { p.exposure = 1.04; p.saturation = 1.12; p.contrast = 1.08; };
  return pc;
}

// a night city's sparks (power lines, transformers): blue-white flashes at seeded places and times
function eqSparks(adds, s, list) {
  for (const [x, y, z, t0, seed] of list) { const a = s - t0; if (a < 0 || a > 1.2) continue; const fl = (Math.sin(a * 60 + seed) > 0.2 ? 1 : 0.3) * (1 - a / 1.2);
    adds.add(x, y, z, 6 + 10 * hash1(seed), 0.9 * fl, 0.7, 0.85, 1.0); for (let i = 0; i < 10; i++) adds.add(x + (hash1(seed + i) - 0.5) * 8 * a, y - 4.9 * a * a * hash1(seed + i * 3) * 4, z + (hash1(seed + i * 7) - 0.5) * 8 * a, 0.7, 0.9 * (1 - a / 1.2), 1.0, 0.85, 0.6); }
}
// a dark night ground's paint: streets as orange lines of light (going out with the power: uOut on the city)
const EQ_NIGHT_PAINT = (cell, out) => `vec2 g = abs(fract(p / ${cell}) - 0.5) * ${cell}; float st = 1.0 - smoothstep(4.0, 6.5, min(g.x, g.y));
  float zone = eqH2(floor(p / 600.0)); float on = step(${out}, zone);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.06, 0.06, 0.07), st);
  totalEmissiveRadiance += vec3(1.0, 0.62, 0.3) * st * 0.55 * on * eqNight;`;

// =====================================================================================================================
// TOKYO at 2 AM: the Skytree (634 m: a triangle at its foot becoming a circle, two observation decks, the mast), the
// Sumida river, the city to the horizon; the lights go out in waves
// =====================================================================================================================
function eqPostTokyo(app) {
  const moon = eqSunV(250, 35);
  const B = eqPostBase(app, { sky: '#05070d', fog: 0.00009, fogColor: '#0c1018', hemi: ['#2a3550', '#0a0a10', 0.35], sun: moon, sunColor: '#8aa0d0', sunI: 0.35, shadowR: 500, shadowFar: 4000, env: ['#101828', '#1a2030', '#050608'],
    top: '#02040a', hor: '#1a2234', low: '#06080c', sunDir: eqN3(moon), sunGlow: '#000000' });
  const scene = B.scene, q = EQ_Q.tokyo, r = new RNG(2012);
  const U0 = { out: { value: 0 } };
  const ground = eqPostGround(scene, { size: [20000, 20000], segs: [100, 100], h: () => 0, night: true, key: 'tk', col: () => [0.05, 0.05, 0.06], paint: EQ_NIGHT_PAINT('90.0', '0.0') });
  void U0;
  const river = new THREE.Mesh(new THREE.PlaneGeometry(160, 12000).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#05080e', roughness: 0.08, metalness: 0.6 })); river.position.set(-700, 0.6, 0); river.rotation.y = 0.15; scene.add(river);
  const blds = eqPostBlocks(r, -6000, 6000, -6000, 6000, 52, 0.12, (x, z, rr) => {
    if (Math.abs(x + 700 - z * 0.15) < 110 || Math.hypot(x, z) < 140) return null;
    const near = Math.exp(-(x * x + z * z) / (2 * 2500 * 2500)), tall = rr.next() < 0.08 + 0.1 * near && Math.hypot(x + 2200, z - 1700) > 1500;   // (nothing tall in front of the camera)
    return [rr.range(20, 42), rr.range(20, 42), tall ? rr.range(40, 140) : rr.range(8, 30), ['#8a8a88', '#a8a49a', '#6a6e74', '#9aa0a8', '#c8c0b0'][Math.floor(rr.next() * 5)], tall ? 3 : 2];
  });
  blds.forEach((b, i) => { b[8] = hash1(i * 3) < 0.07 ? 497 + hash1(i * 11) * 5 : 1e6; });
  const city = eqPostCity(scene, blds, { night: true, seed: 21, noShadow: true });
  // ---- the Skytree: a lattice shell (triangle → circle), the core, the decks (350 m, 450 m), the mast to 634 m
  const tree = new THREE.Group(); scene.add(tree);
  const shellR = (y, a) => { const k = MathX.smooth(y, 0, 320), tri = 39 / Math.cos(((a % 2.094) + 2.094) % 2.094 - 1.047); const circ = MathX.lerp(22, 16, MathX.smooth(y, 320, 495)); return MathX.lerp(tri * (1 - y / 900), circ, k); };
  const NA = 48, NYs = 60, sp = [], suv = [], sid = [];
  for (let j = 0; j <= NYs; j++) for (let i = 0; i <= NA; i++) { const y = j / NYs * 495, a = i / NA * 6.2832, R0 = shellR(y, a); sp.push(Math.cos(a) * R0, y, Math.sin(a) * R0); suv.push(i / NA * 24, y / 12); }
  for (let j = 0; j < NYs; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + 1, c = a + NA + 1, d = c + 1; sid.push(a, c, b, b, c, d); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(suv, 2)); sg.setIndex(sid); sg.computeVertexNormals();
  const latU = { uOn: { value: 1 }, uS: { value: 0 } };
  const latM = new THREE.MeshStandardMaterial({ color: '#c8d8e8', roughness: 0.5, metalness: 0.4, side: THREE.DoubleSide, emissive: '#6ab4ff', emissiveIntensity: 1.3 });
  latM.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, latU); sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uOn, uS;')
    .replace('#include <alphatest_fragment>', `float eqLat; { vec2 f = fract(vUv); float d1 = abs(fract(vUv.x + vUv.y) - 0.5), d2 = abs(fract(vUv.x - vUv.y) - 0.5); float bar = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y));
        eqLat = (d1 < 0.44 && d2 < 0.44 && bar > 0.06) ? 0.25 : 1.0; float aa = clamp(max(fwidth(vUv.x), fwidth(vUv.y)) * 3.0, 0.0, 1.0); eqLat = mix(eqLat, 0.5, aa); diffuseColor.rgb *= 0.4 + 0.6 * eqLat; }`)
    .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance *= uOn * eqLat * (0.55 + 0.45 * smoothstep(0.0, 1.0, sin(vUv.y * 0.6 - uS * 0.8) * 0.5 + 0.5));`); };
  latM.defines = { USE_UV: '' }; latM.customProgramCacheKey = () => 'eqLattice';
  const shell = new THREE.Mesh(sg, latM); tree.add(shell);
  eqCyl(8, 8, 375, eqStd('#d0d4d8', 0.6), 0, 187, 0, tree, 20);
  const deckM = eqStd('#202830', 0.2, 0.5, { emissive: '#e8f0ff', emissiveIntensity: 0.9 }), white = eqStd('#e8ecf0', 0.4, 0.4);
  eqCyl(26, 24, 4, white, 0, 342, 0, tree, 40); eqCyl(25, 25, 14, deckM, 0, 351, 0, tree, 40); eqCyl(27, 25, 4, white, 0, 360, 0, tree, 40);
  eqCyl(17, 16, 3, white, 0, 444, 0, tree, 32); eqCyl(16, 16, 10, deckM, 0, 450, 0, tree, 32); eqCyl(17, 16, 3, white, 0, 456, 0, tree, 32);
  eqCyl(5, 7, 140, eqStd('#d8dce0', 0.5, 0.5, { emissive: '#7a9cff', emissiveIntensity: 0.6 }), 0, 565, 0, tree, 10); eqCyl(1.2, 3, 30, white, 0, 649, 0, tree, 8);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(2.5, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff3020' })); beacon.position.y = 665; tree.add(beacon);
  const sparks = []; for (let i = 0; i < 24; i++) sparks.push([r.range(-2500, 2500), r.range(5, 25), r.range(-500, 3500), 496.5 + r.next() * 6, i * 17 + 3]);
  const cam = B.camera, pc = { scene, camera: cam, sun: B.sun, q };
  pc.frame = (s, u) => {
    const lvl = eqQLevel(q, s);
    city.U.uS.value = s; city.U.uLevel.value = lvl * 1.2; city.U.uBreak.value = 0.3;
    // the blackout spreads (a fraction of the buildings dark); the tower's lights flicker and fail
    const out = 0.15 + 0.75 * MathX.smooth(s, 497.5, 502.5); city.U.uOut.value = out;
    const sh = ground.mesh.material; if (sh.userData.out !== out) sh.userData.out = out;
    latU.uS.value = s; latU.uOn.value = s < 500.2 ? (Math.sin(s * 37) > -0.6 ? 1 : 0.2) : 0.12;
    const sw = lvl * 0.18 * Math.sin(s * 0.95) + lvl * 0.06 * Math.sin(s * 2.7); tree.rotation.z = sw * 0.25; tree.rotation.x = sw * 0.1;
    beacon.visible = Math.floor(s * 1.2) % 2 === 0;
    B.soft.begin(); B.adds.begin();
    eqSparks(B.adds, s, sparks);
    city.B.forEach((b, i) => { if (b[8] < 1e5 && s > b[8]) eqBurst(B.soft, B.adds, s, { t: b[8] + 1.2, p: [b[0], 0, b[1]], kind: 'dust', size: Math.min(16, b[4] * 0.3), n: 16, seed: i + 31, life: 12, alpha: 0.35, dark: true }); });
    B.soft.end(); B.adds.end();
    // (a slow push in on the tower: the first cut held still for six seconds)
    const g = eqQGround(q, s, 17), k = MathX.smooth(u, 0, 6.5);
    eqCam(cam, [-2200 + 520 * k + g[0] * 4, 240 - 50 * k + g[1] * 3, 1700 - 420 * k + g[2] * 4], [0, 275 - 20 * k, 0], 28 + 4 * k, g[0] * 18);
    eqShadowFollowAt(B.sun, [0, 0, 0], 500, 4000);
  };
  pc.labels = (s, u) => [{ p: [0, 680, 0], text: 'TOKYO SKYTREE', sub: `TOKYO · ${eqClock(s, 9)} · MAGNITUDE ${eqQMag(q, s)}`, a: MathX.smooth(u, 0.35, 0.8), quake: true, side: 'r' }];
  pc.grade = (p) => { p.exposure = 1.1; p.saturation = 1.15; p.contrast = 1.12; p.bloom = 0.65; p.bloomThreshold = 0.55; p.vignette = 0.5; };
  return pc;
}

// =====================================================================================================================
// DUBAI at 9 PM: the Burj Khalifa (828 m: three wings round a core, stepping back in a spiral, the spire), the lake
// at its foot, Downtown's towers; Iran's earthquake shakes it from across the Gulf (slow, wide sway)
// =====================================================================================================================
function eqPostDubai(app) {
  const moon = eqSunV(110, 25);
  const B = eqPostBase(app, { sky: '#0a0e18', fog: 0.00008, fogColor: '#1c1a20', hemi: ['#2c3448', '#18120c', 0.4], sun: moon, sunColor: '#9aa8c8', sunI: 0.3, shadowR: 600, shadowFar: 5000, env: ['#141c2c', '#2a2630', '#0a0806'],
    top: '#04060c', hor: '#2e2a30', low: '#0e0c0a', sunDir: eqN3(moon) });
  const scene = B.scene, q = EQ_Q.zagros, r = new RNG(2010), FAR = 0.55;
  eqPostGround(scene, { size: [24000, 24000], segs: [100, 100], h: () => 0, night: true, key: 'db', col: () => [0.08, 0.07, 0.06], paint: EQ_NIGHT_PAINT('140.0', '0.2') });
  const lake = new THREE.Mesh(new THREE.CircleGeometry(260, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#04070c', roughness: 0.05, metalness: 0.7 })); lake.position.set(-120, 0.5, 300); lake.scale.set(1.6, 1, 0.8); scene.add(lake);
  const blds = eqPostBlocks(r, -4000, 4000, -4000, 4000, 70, 0.3, (x, z, rr) => {
    if (Math.hypot(x + 120, (z - 300) * 1.4) < 430 || Math.hypot(x, z) < 160) return null;
    const near = Math.exp(-(x * x + z * z) / (2 * 1200 * 1200)), tall = rr.next() < 0.1 + 0.3 * near && Math.hypot(x + 1300, z - 1500) > 1100;
    return [rr.range(28, 50), rr.range(28, 50), tall ? rr.range(90, 330) : rr.range(10, 40), ['#8a8a8e', '#a8a49a', '#5a6470', '#c8c0b0', '#3a4a5a'][Math.floor(rr.next() * 5)], tall ? 3 : 2];
  });
  const city = eqPostCity(scene, blds, { night: true, seed: 23, noShadow: true });
  // ---- the Burj: 27 tiers; each wing's length steps down as it rises, the steps going round the three wings
  const burj = new THREE.Group(); scene.add(burj);
  const skin = eqStd('#9aa4b0', 0.18, 0.85, { emissive: '#1a2a40', emissiveIntensity: 0.4 }), lit = eqStd('#c8d4e4', 0.2, 0.8, { emissive: '#bcd4ff', emissiveIntensity: 1.1 });
  const winTex = eqTex(eqCanvas(64, 256, (g) => { g.fillStyle = '#0a0c10'; g.fillRect(0, 0, 64, 256); for (let y = 0; y < 256; y += 8) for (let x = 0; x < 64; x += 8) { const v = hash1(x * 31 + y * 7); g.fillStyle = v < 0.34 ? `rgba(255,${200 + v * 80},${150 + v * 150},${0.45 + v})` : '#14181e'; g.fillRect(x + 1, y + 1, 6, 5); } }), { repeat: true });
  const glassM = new THREE.MeshStandardMaterial({ color: '#8a96a4', roughness: 0.2, metalness: 0.8, emissive: '#ffffff', emissiveMap: winTex, emissiveIntensity: 0.9 });
  winTex.repeat.set(4, 6);
  const glassU = { uOn: { value: 1 } }; glassM.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, glassU); sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uOn;').replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance = (totalEmissiveRadiance + vec3(0.1, 0.14, 0.22)) * uOn;'); };
  glassM.customProgramCacheKey = () => 'eqBurjGlass';
  const tiers = 27, tierH = 22.5;
  for (let t = 0; t < tiers; t++) {
    const y0 = t * tierH;
    for (let w = 0; w < 3; w++) {
      const step = Math.floor((t + (2 - w) * 3) / 3) * 3, L = Math.max(0, 60 - step * 1.95);
      if (L < 4) continue;
      const a = w * 2.094 + Math.PI / 2, wing = new THREE.Mesh(new THREE.BoxGeometry(L, tierH - 0.6, 24 - t * 0.35), glassM);
      wing.position.set(Math.cos(a) * L / 2, y0 + tierH / 2, Math.sin(a) * L / 2); wing.rotation.y = -a; burj.add(wing);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry((24 - t * 0.35) / 2, (24 - t * 0.35) / 2, tierH - 0.6, 12), glassM); cap.position.set(Math.cos(a) * L, y0 + tierH / 2, Math.sin(a) * L); burj.add(cap);
    }
    eqCyl(14 - t * 0.2, 14 - t * 0.2, tierH, skin, 0, y0 + tierH / 2, 0, burj, 12);
  }
  eqCyl(9, 11, 80, glassM, 0, tiers * tierH + 40, 0, burj, 12);
  eqCyl(0.8, 5.5, 828 - tiers * tierH - 80, lit, 0, tiers * tierH + 80 + (828 - tiers * tierH - 80) / 2, 0, burj, 10);
  burj.traverse((o2) => { if (o2.isMesh) o2.castShadow = false; });
  const cam = B.camera, pc = { scene, camera: cam, sun: B.sun, q };
  pc.frame = (s, u) => {
    const lvl = eqQLevel(q, s, FAR);
    city.U.uS.value = s; city.U.uLevel.value = lvl; city.U.uBreak.value = 0.2; city.U.uOut.value = 0.1 + 0.5 * MathX.smooth(s, 505.5, 508.5);
    // the tower's slow sway (its first mode is ~11 s; the spire whips faster), the facade lights failing
    const sw = lvl * 0.06 * Math.sin(s * 0.57 + 0.4) + lvl * 0.025 * Math.sin(s * 1.9);
    burj.rotation.z = sw; burj.rotation.x = sw * 0.4;
    glassU.uOn.value = s < 505.8 ? 1 : (Math.sin(s * 41) > 0 ? 0.55 : 0.25);
    B.soft.begin(); B.adds.begin();
    // the glass coming off the facade in sheets (glints falling)
    for (let k = 0; k < 6; k++) eqBurst(B.soft, B.adds, s, { t: 505.2 + k * 0.5, p: [Math.cos(k * 2.1 + 1.6) * 30, 180 + k * 70, Math.sin(k * 2.1 + 1.6) * 30], kind: 'glass', dir: [Math.cos(k * 2.1 + 1.6), Math.sin(k * 2.1 + 1.6)], wide: 30, spread: 60, n: 120, seed: 800 + k, life: 12, gs: 3.5, linger: 1 });
    B.soft.end(); B.adds.end();
    const g = eqQGround(q, s, 19, FAR), k = MathX.smooth(u, 0, 6.5);
    eqCam(cam, [-1300 + 380 * k + g[0] * 3, 140 + 70 * k + g[1] * 2, 1500 - 420 * k + g[2] * 3], [-20, 390 + 40 * k, 0], 38, g[0] * 12);
    eqShadowFollowAt(B.sun, [0, 0, 0], 600, 5000);
  };
  pc.labels = (s, u) => [{ p: new THREE.Vector3(0, 840, 0).applyMatrix4(burj.matrixWorld), text: 'BURJ KHALIFA', sub: `DUBAI · ${eqClock(s, 4)} · MAGNITUDE ${eqQMag(q, s)} ACROSS THE GULF`, a: MathX.smooth(u, 0.35, 0.8), quake: true, side: 'r' }];
  pc.grade = (p) => { p.exposure = 1.1; p.saturation = 1.1; p.contrast = 1.12; p.bloom = 0.6; p.bloomThreshold = 0.6; p.vignette = 0.5; p.warmth = 0.04; };
  return pc;
}

// =====================================================================================================================
// ISTANBUL at 8 PM: the Bosphorus Bridge (1,074 m main span, towers 165 m, the deck 64 m over the water), lit in
// colour; Europe on one shore, Asia on the other; the deck twists
// =====================================================================================================================
function eqPostIstanbul(app) {
  const moon = eqSunV(140, 20);
  const B = eqPostBase(app, { sky: '#070a14', fog: 0.00011, fogColor: '#121620', hemi: ['#26304a', '#0c0a0a', 0.4], sun: moon, sunColor: '#8a9ac0', sunI: 0.3, shadowR: 700, shadowFar: 4000, env: ['#121a2c', '#22222c', '#08080a'],
    top: '#03050c', hor: '#22283a', low: '#08080c', sunDir: eqN3(moon) });
  const scene = B.scene, q = EQ_Q.istanbul, r = new RNG(1973);
  // the strait runs north–south (z); the bridge crosses east–west (x) at z = 0; hills both sides
  const shore = (x, z) => { const w = 560 + 120 * Math.sin(z / 900), d = Math.abs(x) - w; return d < 0 ? -12 : Math.min(130, d * 0.35 + 20 * Math.sin(z / 300 + x / 500) * MathX.smooth(d, 0, 200)); };
  eqPostGround(scene, { size: [12000, 12000], segs: [240, 240], h: shore, night: true, key: 'ist', col: () => [0.07, 0.07, 0.07], paint: EQ_NIGHT_PAINT('70.0', '0.15') });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(20000, 20000).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#050a14', roughness: 0.62, metalness: 0.1 })); water.position.y = -1; scene.add(water);
  const blds = eqPostBlocks(r, -5000, 5000, -5000, 5000, 40, 0.2, (x, z, rr) => { const y = shore(x, z); if (y < 2 || Math.abs(z) < 60 && Math.abs(x) < 900) return null; if (rr.next() < 0.25) return null;
    return [rr.range(12, 24), rr.range(12, 22), rr.range(9, 26), ['#c8b8a0', '#a89a88', '#d8d0c0', '#8a7a6a'][Math.floor(rr.next() * 4)], 1]; });
  blds.forEach((b, i) => { b[8] = hash1(i * 7) < 0.05 ? 510 + hash1(i * 13) * 5 : 1e6; });
  const city = eqPostCity(scene, blds, { night: true, seed: 29, groundY: shore, noShadow: true });
  // the bridge (the San Francisco bridges' builder): towers at both shores, the deck 64 m up
  const half = 537 + 255;
  const br = eqSuspension(scene, { A: [-half, 0], dir: [1, 0], len: 2 * half, deckY: 64, width: 33, towers: [255, 255 + 1074], towerH: 165, groundY: (x2, z2) => shore(x2, z2),
    cable: [[0, 70, 0], [255, 165, 0], [255 + 1074, 165, 92], [2 * half, 70, 0]], color: '#c8ccd0', seg: 36, legW: 7, struts: [56, 110, 161],
    twist: (s, d) => { const a = MathX.smooth(s, 510.5, 514.5); return a * 0.09 * Math.sin(Math.PI * MathX.clamp((d - 255) / 1074, 0, 1)) * Math.sin(s * 2.4 + d * 0.004); },
    fail: (i) => (i >= 27 && i <= 31 ? 513.4 + (i - 27) * 0.25 : 1e6) });
  // the coloured lights along the cables and the towers (they cycle, then fail)
  const lights = []; for (let d = 0; d <= 2 * half; d += 14) for (const sd of [-1, 1]) lights.push([d, sd]);
  const cam = B.camera, pc = { scene, camera: cam, sun: B.sun, q };
  const cableY = (d) => { if (d < 255) return 70 + 95 * d / 255; if (d > 255 + 1074) return 165 - 95 * (d - 255 - 1074) / 255; const u = (d - 255) / 1074; return 165 - 4 * 92 * u * (1 - u); };
  pc.frame = (s, u) => {
    const lvl = eqQLevel(q, s);
    city.U.uS.value = s; city.U.uLevel.value = lvl; city.U.uBreak.value = 0.3; city.U.uOut.value = 0.1 + 0.6 * MathX.smooth(s, 511, 515);
    br.frame(s, lvl * 0.6);
    B.soft.begin(); B.adds.begin();
    const on = s < 512.8 ? 1 : (Math.sin(s * 33) > 0.3 ? 0.4 : 0);
    for (const [d, sd] of lights) { const p = br.at(d, sd * 17.5, cableY(d)), hue = (d / 400 + s * 0.25) % 1, c = new THREE.Color().setHSL(0.62 + 0.25 * Math.sin(hue * 6.283), 0.9, 0.55);
      B.adds.add(p[0], p[1], p[2], 4.5, 0.9 * on, c.r, c.g, c.b); }
    for (const tw of br.towers) for (let y = 10; y < 165; y += 12) for (const sd of [-1, 1]) { const p = tw.g.localToWorld(new THREE.Vector3(sd * 18, y, 0)); B.adds.add(p.x, p.y, p.z, 5, 0.6 * on, 0.7, 0.4, 1.0); }
    // the falling pieces' splash
    for (let i = 27; i <= 31; i++) { const d = (i + 0.5) * 36, f = 513.4 + (i - 27) * 0.25 + Math.sqrt(2 * 68 / 9.8); eqBurst(B.soft, B.adds, s, { t: f, p: [br.at(d)[0], 0, 0], kind: 'dust', size: 18, n: 26, seed: 900 + i, life: 8, alpha: 0.6 }); }
    B.soft.end(); B.adds.end();
    const g = eqQGround(q, s, 23), k = MathX.smooth(u, 0, 6.5);
    eqCam(cam, [-200 + 240 * k + g[0] * 3, 22 + 10 * k + g[1] * 2, -960 + 170 * k + g[2] * 3], [40 + 60 * k, 72, 0], 52, g[0] * 12);
    eqShadowFollowAt(B.sun, [0, 0, 0], 700, 4000);
  };
  pc.labels = (s, u) => [{ p: [0, 120, 0], text: 'BOSPHORUS BRIDGE', sub: `ISTANBUL · ${eqClock(s, 3)} · MAGNITUDE ${eqQMag(q, s)}`, a: MathX.smooth(u, 0.35, 0.8), quake: true },
    { p: [-760, 70, -700], text: 'EUROPE', a: MathX.smooth(u, 1.0, 1.5) * 0.9, side: 'r' }, { p: [760, 70, -700], text: 'ASIA', a: MathX.smooth(u, 1.3, 1.8) * 0.9 }];
  pc.grade = (p) => { p.exposure = 1.12; p.saturation = 1.15; p.contrast = 1.12; p.bloom = 0.65; p.bloomThreshold = 0.55; p.vignette = 0.5; };
  return pc;
}

// =====================================================================================================================
// the set: one postcard per mode
// =====================================================================================================================
EQ_SETS.world = (app) => {
  const P = { la: eqPostLA(app), mexico: eqPostMexico(app), dam: eqPostDam(app), needle: eqPostNeedle(app), tokyo: eqPostTokyo(app), dubai: eqPostDubai(app), istanbul: eqPostIstanbul(app) };
  const OF = { la: 'la', mexico: 'mexico', jelly: 'mexico', dam: 'dam', needle: 'needle', tokyo: 'tokyo', dubai: 'dubai', istanbul: 'istanbul' };
  const set = { scene: P.la.scene, camera: P.la.camera, P };
  let cur = P.la;
  set.frame = (t, shot) => {
    const s = eqStoryOf(t, shot), u = t - shot.t0;
    cur = P[OF[shot.mode]] || P.la;
    cur.frame(s, u, shot.mode, t);
    set.scene = cur.scene; set.camera = cur.camera;
    // (the shadow pass only where the sun is the sun)
    for (const k of Object.keys(P)) if (P[k].sun) P[k].sun.castShadow = P[k] === cur && ['la', 'mexico', 'dam', 'needle'].includes(k);
  };
  set.view = () => [cur.scene, cur.camera];
  set.labels = (t, shot) => cur.labels ? cur.labels(eqStoryOf(t, shot), t - shot.t0, shot.mode) : [];
  set.grade = (t, p, shot) => { if (cur.grade) cur.grade(p, eqStoryOf(t, shot), shot.mode); };
  return set;
};
