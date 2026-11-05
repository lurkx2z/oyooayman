/* =====================================================================
   CITY + SEA — the far side of the bay (2.5–4 km south of the line) and the water between, shared by the coast set
   and the hospital roof:
     lfBuildCity(scene, o) → C ; C.update(s)     ~1,900 buildings (one instanced box, windows drawn in its shader and
                                                 faded to their average where a window is under a pixel, so they never
                                                 shimmer), the street lights (points), the hospital on its hill (red
                                                 cross), the stadium's bowl and floodlight towers, the hills behind.
                                                 Eight districts trip one after another when the grid goes (lights.js).
     lfBuildSea(scene, C, o) → W ; W.update(s, o) the bay's water: a shader with the swell, the sky and the city's
                                                 lights reflected (by tracing the reflected ray to the far shore), the
                                                 fire's glint, and at the beach the breaking waves (foam and plankton).
   Pure functions of story time s. (The sea ends under the far shore's land, which starts 2 m up: nothing coplanar.)
   ===================================================================== */

const LF_STAD_D = 0.4;                                                 // the stadium's own feed trips last
const LF_DIST_D = [0.0, 0.18, 0.07, 0.31, 0.12, 0.4, 0.24, 0.52];      // each district's trip, s after 14.0 s
const lfDistrictOf = (x) => MathX.clamp(Math.floor((x - LF_ST.city.x[0]) / (LF_ST.city.x[1] - LF_ST.city.x[0]) * 8), 0, 7);
// the far shore's ground height (y) at (x, z)
function lfCityY(x, z) {
  const sh = 2470, u = Math.max(0, z - sh), H = LF_ST.hospital;
  let y = 2 + 0.012 * u + 0.000016 * u * u + 18 * Math.max(0, noise1(x * 0.0012 + z * 0.0007, 5)) * MathX.clamp(u / 600, 0, 1);
  y += 38 * Math.exp(-((x - H[0]) ** 2 + (z - H[2]) ** 2) / (2 * 230 * 230));                    // the hospital's hill
  y += 260 * lfSm(z, 4300, 6200) * (0.6 + 0.4 * noise1(x * 0.0009, 9));                          // the hills behind
  y -= 1.6 * Math.exp(-((x - LF_ST.stadium[0]) ** 2 + (z - LF_ST.stadium[2]) ** 2) / (2 * 160 * 160));
  return y;
}

function lfBuildCity(scene, o = {}) {
  const C = { districts: new Array(8).fill(1) }, r = new RNG(7721), X = LF_ST.city.x, Z = LF_ST.city.z, H = LF_ST.hospital, SD = LF_ST.stadium;
  // ---- the ground: the far shore and the hills behind it
  { const nx = 180, nz = 90, x0 = -4200, x1 = 4200, z0 = 2470, z1 = 7000, g = new THREE.PlaneGeometry(x1 - x0, z1 - z0, nx, nz); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i) + (x0 + x1) / 2, z = p.getZ(i) + (z0 + z1) / 2; p.setXYZ(i, x, lfCityY(x, z) - (z < 2480 ? 3 : 0), z); }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#0d1013', roughness: 1 })); m.receiveShadow = false; scene.add(m); C.ground = m; }
  // ---- the buildings (one instanced box, sitting on y = 0)
  const B = [];
  const add = (x, z, w, d, h, kind = 0, lit = null) => B.push({ x, z, w, d, h, kind, lit: lit ?? r.range(0.2, 0.5), y: lfCityY(x, z) - 0.5 });
  for (let gx = X[0]; gx < X[1]; gx += 46) for (let gz = Z[0] + 30; gz < Z[1]; gz += 44) {
    const x = gx + r.range(-8, 8), z = gz + r.range(-8, 8);
    if (Math.hypot(x - SD[0], (z - SD[2]) * 1.2) < 190) continue;                                    // the stadium's ground
    if (Math.hypot(x - H[0], z - H[2]) < 75) continue;                                                // the hospital's grounds
    if (r.next() < 0.12) continue;
    const cbd = Math.exp(-((x - 300) ** 2) / (2 * 700 * 700) - ((z - 2800) ** 2) / (2 * 260 * 260));
    const h = 7 + Math.exp(r.range(0, 2.6)) * (1 + 4 * cbd) + (r.next() < 0.04 * (1 + 8 * cbd) ? r.range(40, 110) * cbd : 0);
    add(x, z, r.range(14, 34), r.range(14, 30), Math.min(h, 150));
  }
  add(H[0], H[2], 70, 26, 26, 1, 0.75); add(H[0] + 28, H[2] + 26, 26, 22, 18, 1, 0.65);                // the hospital (its main block, a wing)
  const N = B.length, box = new THREE.BoxGeometry(1, 1, 1); box.translate(0, 0.5, 0);
  const geo = new THREE.InstancedBufferGeometry(); geo.index = box.index; for (const k of ['position', 'normal']) geo.setAttribute(k, box.attributes[k]);
  const aM = new Float32Array(N * 3), aS = new Float32Array(N * 4);   // pos x,y,z ; size w,h,d + seed ; then kind/lit/district
  const aK = new Float32Array(N * 3);
  B.forEach((b, i) => { aM.set([b.x, b.y, b.z], i * 3); aS.set([b.w, b.h, b.d, r.next()], i * 4); aK.set([b.kind, b.lit, lfDistrictOf(b.x)], i * 3); });
  geo.setAttribute('iPos', new THREE.InstancedBufferAttribute(aM, 3)); geo.setAttribute('iSize', new THREE.InstancedBufferAttribute(aS, 4)); geo.setAttribute('iKind', new THREE.InstancedBufferAttribute(aK, 3));
  geo.instanceCount = N;
  const uni = { uOn: { value: new Array(8).fill(1) }, uHosp: { value: 1 }, uEm: { value: 0 }, uFog: { value: new THREE.Color('#0a1220') }, uFogD: { value: 0.00028 }, uS: { value: 0 }, uLit: { value: 1 } };
  const mat = new THREE.ShaderMaterial({
    uniforms: uni,
    vertexShader: `attribute vec3 iPos, iKind; attribute vec4 iSize; varying vec3 vL, vN, vW; varying vec4 vS; varying vec3 vK;
      void main(){ vec3 p = position * iSize.xyz + iPos; vL = position * iSize.xyz; vN = normal; vS = iSize; vK = iKind; vW = p;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
    fragmentShader: `uniform float uOn[8]; uniform float uHosp, uEm, uFogD, uS, uLit; uniform vec3 uFog; varying vec3 vL, vN, vW; varying vec4 vS; varying vec3 vK;
      float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){
        int di = int(vK.z + 0.5); float on = 0.0;
        for (int i = 0; i < 8; i++) if (i == di) on = uOn[i];
        if (vK.x > 0.5) on = uHosp;
        vec3 base = vec3(0.012, 0.014, 0.019) * (0.6 + 0.4 * max(vN.y, 0.0));
        vec3 col = base;
        if (abs(vN.y) < 0.5) {
          float u = abs(vN.x) > 0.5 ? vL.z : vL.x, v = vL.y;
          vec2 cell = vec2(u / 3.4, v / 3.3), id = floor(cell) + vS.w * 97.0, f = fract(cell);
          float lit = step(h2(id), vK.y), win = step(0.22, f.x) * step(f.x, 0.78) * step(0.28, f.y) * step(f.y, 0.78);
          float hue = h2(id + 7.3);
          vec3 wc = hue < 0.55 ? vec3(1.0, 0.78, 0.48) : hue < 0.85 ? vec3(0.86, 0.9, 1.0) : vec3(0.55, 0.7, 1.0);
          float fw = max(fwidth(cell.x), fwidth(cell.y));
          vec2 blk = floor(cell / vec2(3.0, 2.0)) + vS.w * 53.0;
          float far = vK.y * 0.31 * smoothstep(0.25, 0.85, h2(blk)) * 1.6;                 // (blocks of windows on or off: uneven)
          float pat = mix(lit * win, far, smoothstep(0.25, 0.7, fw));
          float topFade = step(v, vS.y - 1.0) * step(1.2, v);
          col += wc * pat * topFade * 1.5 * on * uLit;
          // after the blackout: a few windows with a torch or a phone in them (very dim)
          float em = step(h2(id + 3.1), 0.035) * win * (0.5 + 0.5 * sin(uS * 3.0 + h2(id) * 40.0));
          col += vec3(0.75, 0.8, 1.0) * mix(em, 0.035 * 0.31, smoothstep(0.25, 0.7, fw)) * topFade * uEm * 0.5;
        }
        float d = length(vW - cameraPosition), f = 1.0 - exp(-uFogD * uFogD * d * d);
        gl_FragColor = vec4(mix(col, uFog, f * 0.85), 1.0);
      }`,
  });
  mat.extensions = { derivatives: true };
  const bm = new THREE.Mesh(geo, mat); bm.frustumCulled = false; scene.add(bm); C.buildings = bm; C.list = B;
  // ---- the street lights (points), by district
  const P = [], D = [], Cc = [];
  for (let z = Z[0] + 8; z < Z[1]; z += 44) for (let x = X[0]; x < X[1]; x += 23 + r.range(-4, 4)) {
    if (Math.hypot(x - SD[0], (z - SD[2]) * 1.2) < 150 || r.next() < 0.25) continue;
    P.push(x, lfCityY(x, z) + 7, z); D.push(lfDistrictOf(x)); const w = r.next() < 0.7; Cc.push(w ? 1 : 0.85, w ? 0.66 : 0.9, w ? 0.32 : 1);
  }
  for (let x = X[0]; x < X[1]; x += 18) { P.push(x, 4, 2492); D.push(lfDistrictOf(x)); Cc.push(1, 0.68, 0.34); }   // the waterfront promenade
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); lg.setAttribute('aD', new THREE.Float32BufferAttribute(D, 1)); lg.setAttribute('aC', new THREE.Float32BufferAttribute(Cc, 3));
  const lmat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uOn: uni.uOn, uPx: { value: 1 }, uFog: uni.uFog, uFogD: uni.uFogD },
    vertexShader: `attribute float aD; attribute vec3 aC; uniform float uOn[8]; uniform float uPx, uFogD; varying vec3 vC; varying float vA;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; int di = int(aD + 0.5); float on = 0.0;
        for (int i = 0; i < 8; i++) if (i == di) on = uOn[i];
        float d = -mv.z; vA = on * exp(-uFogD * uFogD * d * d * 0.6); vC = aC; gl_PointSize = uPx * clamp(5200.0 / d, 1.6, 7.0); }`,
    fragmentShader: `varying vec3 vC; varying float vA; void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r = dot(q, q); if (r > 1.0) discard; float a = vA * (exp(-r * 6.0) + 0.3 * exp(-r * 1.5)); gl_FragColor = vec4(vC * a, a); }` });
  const lamps = new THREE.Points(lg, lmat); lamps.frustumCulled = false; scene.add(lamps); C.lamps = lamps;
  // ---- the hospital's red cross and its roof lights; the stadium: the bowl, four floodlight towers
  const glow = lfDotTex(0.35);
  const sprite = (col, sz, x, y, z) => { const sm = new THREE.SpriteMaterial({ map: glow, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }); const sp = new THREE.Sprite(sm); sp.scale.set(sz, sz, 1); sp.position.set(x, y, z); scene.add(sp); return sp; };
  const hy = lfCityY(H[0], H[2]);
  C.cross = []; for (const [dx, dy, w, h, d] of [[0, 0, 7, 2.2, 0.4], [0, 0, 2.2, 7, 0.46]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),   // the two bars' faces never coincide
    new THREE.MeshBasicMaterial({ color: '#ff2a2a' })); m.position.set(H[0] + dx, hy + 26 + 5 + dy, H[2] - 13.4); scene.add(m); C.cross.push(m); }
  C.crossGlow = sprite('#ff3a2a', 26, H[0], hy + 31, H[2] - 14);
  const sy = lfCityY(SD[0], SD[2]);
  { const ring = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.12, 1, 64, 1, true), new THREE.MeshStandardMaterial({ color: '#1a1d22', roughness: 0.9, side: THREE.DoubleSide, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0 }));
    ring.scale.set(112, 30, 94); ring.position.set(SD[0], sy + 15, SD[2]); scene.add(ring); C.bowl = ring;
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 48, 1, true), new THREE.MeshBasicMaterial({ color: '#cfe8c8', side: THREE.BackSide, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    inner.scale.set(104, 28, 86); inner.position.set(SD[0], sy + 16, SD[2]); scene.add(inner); C.bowlIn = inner; }
  C.flood = []; for (const [ax, az] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const x = SD[0] + ax * 92, z = SD[2] + az * 74, y = sy + 58;
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.6, 58, 8), new THREE.MeshStandardMaterial({ color: '#2a2d32', roughness: 0.8 })); mast.position.set(x, sy + 29, z); scene.add(mast);
    const bank = new THREE.Mesh(new THREE.BoxGeometry(12, 6, 1.2), new THREE.MeshBasicMaterial({ color: '#f4f7ff' })); bank.position.set(x, y + 2, z); bank.lookAt(SD[0], sy, SD[2]); scene.add(bank);
    C.flood.push({ bank, sp: sprite('#eef4ff', 70, x, y + 2, z) });
  }
  C.haze = sprite('#d8e4f0', 520, SD[0], sy + 70, SD[2]); C.haze.material.opacity = 0.0;
  // ---- the stadium crowd's phones, seen from across the bay (a sparkle on the rim)
  { const Q = []; for (let i = 0; i < 1400; i++) { const a = r.range(0, Math.PI * 2), f = r.range(0.62, 1.0); Q.push(SD[0] + Math.cos(a) * 108 * f, sy + 4 + 26 * (f - 0.6) / 0.4, SD[2] + Math.sin(a) * 90 * f); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(Q, 3));
    C.phones = new THREE.Points(g, new THREE.PointsMaterial({ color: '#dfe8ff', size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    C.phones.frustumCulled = false; scene.add(C.phones); }
  // ---- the 1D light map of the far shore (for the sea's reflections): brightness by x
  const L = new Float32Array(1024);
  for (const b of B) { const i0 = Math.floor((b.x - b.w / 2 + 3200) / 6400 * 1024), i1 = Math.ceil((b.x + b.w / 2 + 3200) / 6400 * 1024); for (let i = Math.max(0, i0); i < Math.min(1024, i1); i++) L[i] += b.lit * Math.min(b.h, 60) * 0.02 * (b.kind ? 2 : 1); }
  for (let i = 0; i < P.length / 3; i++) { const k = Math.floor((P[i * 3] + 3200) / 6400 * 1024); if (k >= 0 && k < 1024) L[k] += 0.5; }
  let mx = 0; for (const v of L) mx = Math.max(mx, v);
  const tex = new THREE.DataTexture(new Uint8Array(1024 * 4), 1024, 1); for (let i = 0; i < 1024; i++) { const v = Math.min(255, 255 * Math.sqrt(L[i] / mx)); tex.image.data.set([v, v * 0.78, v * 0.55, 255], i * 4); }
  tex.needsUpdate = true; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter; tex.colorSpace = THREE.SRGBColorSpace; C.lightMap = tex;
  C.uni = uni;
  C.update = (s, u = {}) => {
    for (let i = 0; i < 8; i++) C.districts[i] = lfGrid(s, LF_DIST_D[i]);
    uni.uOn.value = C.districts; uni.uHosp.value = lfHospital(s); uni.uS.value = s; uni.uEm.value = lfEmerg(s, 0.2) * 3;
    uni.uFogD.value = u.fogD ?? 0.00028; lmat.uniforms.uPx.value = u.px ?? 1;
    const hc = Math.max(lfHospital(s), 0.35 * lfEmerg(s, 0.15)); for (const m of C.cross) m.material.color.setRGB(hc, 0.14 * hc, 0.14 * hc);
    C.crossGlow.material.opacity = 0.55 * hc;
    const st = lfGrid(s, LF_STAD_D); C.bowl.material.emissiveIntensity = 0.0; C.bowlIn.material.opacity = 0.12 * st;
    for (const f of C.flood) { f.bank.material.color.setScalar(0.04 + 0.96 * st); f.sp.material.opacity = 0.95 * st; }
    C.haze.material.opacity = 0.16 * st;
    C.phones.material.opacity = 0.9 * lfPhone(s, 14.85);
    C.stadium = st;
  };
  return C;
}

function lfBuildSea(scene, C, o = {}) {
  const g = new THREE.PlaneGeometry(18000, 9000, 1, 1); g.rotateX(-Math.PI / 2); g.translate(500, 0, 4 + 4500);
  const uni = {
    uS: { value: 0 }, uOn: { value: new Array(8).fill(1) }, uStad: { value: 1 }, uMap: { value: C ? C.lightMap : null },
    uHor: { value: new THREE.Color('#0b1424') }, uTop: { value: new THREE.Color('#03060c') }, uGlow: { value: 1 }, uGlowC: { value: new THREE.Color('#c9884a') },
    uFire: { value: new THREE.Vector4(LF_ST.fire[0], 1.2, LF_ST.fire[2], 0) }, uBio: { value: 0 }, uFog: { value: new THREE.Color('#0a1220') }, uFogD: { value: 0.00022 },
    uWave: { value: 1 }, uStarK: { value: 1 }, uTrain: { value: new THREE.Vector4(0, 0, 0, 0) },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: uni,
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform float uS, uOn[8], uStad, uGlow, uBio, uFogD, uWave, uStarK; uniform sampler2D uMap; uniform vec3 uHor, uTop, uGlowC, uFog; uniform vec4 uFire, uTrain; varying vec3 vW;
      float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vn(vec2 x){ vec2 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
      float onAt(float x){ int di = int(clamp(floor((x + 2900.0) / 5800.0 * 8.0), 0.0, 7.0)); float on = 0.0; for (int i = 0; i < 8; i++) if (i == di) on = uOn[i]; return on; }
      void main(){
        vec3 P = vW, V = normalize(P - cameraPosition); float dist = length(P - cameraPosition);
        // the swell and the chop: octaves of gravity waves (ω = √(g k)); each fades out where it would be smaller than a
        // pixel (no shimmer), and what it would have added goes into the roughness that spreads the reflections
        float t = uS, fw = max(length(fwidth(P.xz)), 1e-4), rough = 0.0;
        vec2 q = P.xz, dh = vec2(0.0);
        vec4 OC[7]; OC[0] = vec4(0.35, 0.94, 42.0, 0.07); OC[1] = vec4(-0.62, 0.78, 15.0, 0.07); OC[2] = vec4(0.92, 0.38, 6.4, 0.08);
        OC[3] = vec4(-0.2, 0.98, 2.8, 0.09); OC[4] = vec4(0.7, -0.71, 1.25, 0.09); OC[5] = vec4(-0.95, 0.31, 0.58, 0.08); OC[6] = vec4(0.4, 0.92, 0.27, 0.07);
        for (int i = 0; i < 7; i++) { vec2 d = OC[i].xy; float L = OC[i].z, k = 6.2831853 / L, fade = 1.0 - smoothstep(L * 0.18, L * 0.5, fw);
          float ph = dot(q, d) * k + t * sqrt(9.81 * k) * uWave + float(i) * 1.7 + 0.8 * sin(dot(q, vec2(d.y, -d.x)) * k * 0.21 + float(i));
          dh += OC[i].w * uWave * fade * d * cos(ph); rough += OC[i].w * uWave * (1.0 - fade); }
        vec3 N = normalize(vec3(-dh.x, 1.0, -dh.y));
        vec3 R = reflect(V, N); R.y = abs(R.y);
        float F = 0.02 + 0.98 * pow(1.0 - max(dot(-V, N), 0.0), 5.0);
        vec3 sky = mix(uHor, uTop, smoothstep(0.0, 0.5, R.y));
        vec2 hd = normalize(R.xz + 1e-5);
        sky += uGlowC * uGlow * 0.26 * exp(-R.y / 0.13) * (0.3 + 0.7 * pow(max(hd.y, 0.0), 2.0));
        vec3 col = vec3(0.004, 0.008, 0.012) + sky * F * 1.1;
        // the far shore's lights, reflected: trace the reflected ray to the city's front (z 2560)
        if (R.z > 0.0 && P.z < 2480.0) {
          float tt = (2560.0 - P.z) / R.z, xh = P.x + R.x * tt, yh = R.y * tt, spread = 2.0 * rough * tt;
          float band = smoothstep(90.0 + spread, 4.0, yh) * step(-2.0, yh) * 90.0 / (90.0 + spread);
          vec3 cl = texture2D(uMap, vec2((xh + 3200.0) / 6400.0, 0.5)).rgb;
          float sp = 0.55 + 0.9 * vn(vec2(xh * 0.08, P.z * 0.02 + t * 0.4));
          col += cl * band * onAt(xh) * sp * 0.5 * (0.3 + 0.7 * F * 4.0);
          // the stadium's floodlights (four towers, 58 m up)
          float ds = abs(xh + 1050.0); col += vec3(0.9, 0.95, 1.0) * uStad * smoothstep(150.0, 40.0, ds) * smoothstep(110.0, 30.0, abs(yh - 55.0)) * sp * 0.5;
        }
        // the fire's glint on the water near the beach
        if (uFire.w > 0.0) { vec3 L = normalize(uFire.xyz - P), H = normalize(L - V); float dF = length(uFire.xyz - P);
          col += vec3(1.0, 0.55, 0.22) * uFire.w * pow(max(dot(N, H), 0.0), 140.0) * 900.0 / (dF * dF + 40.0); }
        // your train's lit windows, glinting (a band along the sea wall)
        if (uTrain.w > 0.0) { vec3 Lt = vec3(clamp(P.x, uTrain.x - 60.0, uTrain.x), 5.2, 0.0) - P; vec3 Ht = normalize(normalize(Lt) - V);
          col += vec3(1.0, 0.86, 0.62) * uTrain.w * pow(max(dot(N, Ht), 0.0), 90.0) * 220.0 / (dot(Lt, Lt) + 30.0); }
        // the beach: breaking waves rolling in (foam), with plankton glowing blue in them
        float bx = smoothstep(500.0, 560.0, P.x) * smoothstep(940.0, 880.0, P.x);
        if (bx > 0.0 && P.z < 130.0) {
          float shore = 45.5 + 1.5 * sin(P.x * 0.05) + 0.8 * sin(P.x * 0.13 + 1.0);
          float dz = P.z - shore, crest = 0.0;
          for (int k = 0; k < 4; k++) { float ph = fract(t * 0.11 + float(k) * 0.25 + 0.03 * sin(P.x * 0.02)); float zc = mix(70.0, 1.0, ph); float w = smoothstep(3.5, 0.0, abs(dz - zc)) * smoothstep(0.0, 0.25, ph) * (1.0 - smoothstep(0.85, 1.0, ph));
            float br = vn(vec2(P.x * 0.16 + float(k) * 13.0, P.z * 0.3 + float(k) * 3.0)); crest = max(crest, w * br * br * 1.5); }   // (crests break up: patches, not lines)
          float wash = smoothstep(2.6, 0.0, dz) * (0.5 + 0.5 * sin(t * 0.7 + P.x * 0.03));
          float foam = max(crest, wash) * bx;
          col += vec3(0.16, 0.17, 0.18) * foam * (0.25 + 1.6 * uFire.w * 900.0 / (dot(uFire.xyz - P, uFire.xyz - P) + 400.0)) * uStarK;
          float sp = vn(vec2(P.x * 1.7, P.z * 1.7 + t)); col += vec3(0.12, 0.55, 1.0) * foam * uBio * (0.15 + 1.6 * sp * sp * sp) * 0.75;   // (sparkling where the water is churned)
        }
        float f = 1.0 - exp(-uFogD * uFogD * dist * dist);
        gl_FragColor = vec4(mix(col, uFog, f * 0.9), 1.0);
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.receiveShadow = false; scene.add(m);
  return {
    mesh: m, uni,
    update(s, u = {}) {
      uni.uS.value = s; if (C) { uni.uOn.value = C.districts; uni.uStad.value = C.stadium; }
      uni.uGlow.value = u.glow ?? 0; uni.uBio.value = u.bio ?? 0; uni.uFire.value.w = u.fire ?? 0; uni.uFogD.value = u.fogD ?? 0.00022;
      uni.uStarK.value = u.starK ?? 1; if (u.train) uni.uTrain.value.set(u.train[0], 0, 0, u.train[1]); else uni.uTrain.value.w = 0;
    },
  };
}
