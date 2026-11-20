/* =====================================================================
   GROUND — the land, built once in the world's own metres (it sits in EK_W, scaled by s round P):
     ekTerrain(W)    one mesh round P: rings that widen with distance (fine at the tent, 1 km apart 300 km out), laid
                     on the curved Earth (ekSphere), out to 600 km where it meets the globe; its colour from what grows
                     there (meadow, spruce, scree, rock, snow and ice; prairie fields to the east)
     ekHorizonMap()  the skyline towards the Sun from every point ±12 km round P (a texture for ekWorldPatch)
     ekLake(W)       the lake (turquoise glacier water, the sky in it); the outflow
     ekForest(W)     spruce and fir (instanced), round the lake and up the walls to the tree line
     ekGrass(W)      blades of grass round the tent (for when the world is small and you look very close)
   Long things are built in short pieces (picture pitfalls: no kilometre-long triangles near the camera).
   ===================================================================== */

// the ring radii (m): fine near P, wider out; az = the number of segments round each ring
function ekRings() {
  const out = [];
  let r = 0.5;
  while (r < 15000) { out.push([r, 640]); r *= 1.0135; }
  out.push([15000, 640]);
  r = 15000 * 1.03;
  while (r < 600000) { out.push([r, 320]); r *= 1.03; }
  out.push([600000, 320]);
  return out;
}
// what the ground is at (x, z), height h, slope (0 flat … 1 vertical), north-facing (−1 … 1) → [r, g, b]
function ekGroundColor(x, z, h, slope, north, out) {
  const n = ekN2(x * 0.011, z * 0.011, 71), n2 = ekN2(x * 0.0021, z * 0.0021, 73), n3 = ekN2(x * 0.09, z * 0.09, 75);
  const r = Math.hypot(x, z), v = ekAcross(x, z);
  // the tree line (~2,250 m above the sea: ~360 m above the meadow), ragged
  const tl = 360 + 120 * n2 + 50 * n;
  let c;
  const meadow = [0.3 + 0.05 * n3, 0.32 + 0.04 * n, 0.15];
  const spruce = [0.055, 0.095 + 0.015 * n, 0.07];
  const alpine = [0.27 + 0.04 * n, 0.27, 0.15];
  const rock = n2 > 0.1 ? [0.4, 0.38, 0.36] : [0.37, 0.31, 0.27];
  const scree = [0.5, 0.49, 0.47];
  const snow = [0.86, 0.89, 0.94];
  // the floor near the lake: meadow round the camp, spruce beyond (the forest's edge wanders)
  const camp = ekSmooth(260, 150, Math.hypot(x - 40, (z - 10) * 1.4)) + ekSmooth(70, 20, Math.abs(z - EK_F.road.z)) * ekSmooth(-200, 0, x) * 0;
  const forestK = MathX.clamp(0.62 + 0.5 * n + 0.25 * n2, 0, 1) * (1 - camp) * ekSmooth(tl + 30, tl - 40, h) * ekSmooth(0.75, 0.55, slope);
  c = [MathX.lerp(meadow[0], spruce[0], forestK), MathX.lerp(meadow[1], spruce[1], forestK), MathX.lerp(meadow[2], spruce[2], forestK)];
  // above the trees: alpine meadow, then scree and rock; snow and ice high on the cool (north) faces
  const above = ekSmooth(tl - 20, tl + 60, h);
  const rockK = MathX.clamp(ekSmooth(0.32, 0.6, slope) + ekSmooth(tl + 180, tl + 500, h), 0, 1);
  let hi = [MathX.lerp(alpine[0], scree[0], ekSmooth(0.2, 0.4, slope)), MathX.lerp(alpine[1], scree[1], ekSmooth(0.2, 0.4, slope)), MathX.lerp(alpine[2], scree[2], ekSmooth(0.2, 0.4, slope))];
  hi = [MathX.lerp(hi[0], rock[0], rockK), MathX.lerp(hi[1], rock[1], rockK), MathX.lerp(hi[2], rock[2], rockK)];
  const snowK = ekSmooth(980 + 160 * n2 - 220 * north, 1150 - 220 * north, h + 90 * n) * ekSmooth(0.78, 0.5, slope);
  hi = [MathX.lerp(hi[0], snow[0], snowK), MathX.lerp(hi[1], snow[1], snowK), MathX.lerp(hi[2], snow[2], snowK)];
  c = [MathX.lerp(c[0], hi[0], above), MathX.lerp(c[1], hi[1], above), MathX.lerp(c[2], hi[2], above)];
  // the road (gravel) along the valley floor, east of the camp
  // the prairie (north-east): late-August fields, stubble and green, in quarter sections; the foothills' grass
  const pr = ekSmooth(42000, 70000, v);
  if (pr > 0) {
    const sx = Math.floor(x / 800), sz = Math.floor(z / 800), q = hash2(sx + 900, sz - 300);
    const f = q < 0.45 ? [0.58, 0.5, 0.31] : q < 0.75 ? [0.44, 0.42, 0.24] : q < 0.9 ? [0.24, 0.3, 0.14] : [0.34, 0.31, 0.22];
    c = [MathX.lerp(c[0], f[0], pr), MathX.lerp(c[1], f[1], pr), MathX.lerp(c[2], f[2], pr)];
  }
  const vv = 0.92 + 0.12 * n3;
  out[0] = c[0] * vv; out[1] = c[1] * vv; out[2] = c[2] * vv;
  return out;
}
function ekTerrain(W) {
  const R = ekRings(), pos = [], col = [], hs = [], idx = [];
  const ringStart = [];
  // the centre vertex
  const p0 = ekSphere(0, 0, ekGroundY(0, 0)); pos.push(...p0); hs.push(ekGroundY(0, 0));
  const edge = (r) => ekSmooth(420000, 600000, r);    // the last 180 km sink to the sea (the globe takes over)
  for (const [r, n] of R) {
    ringStart.push(pos.length / 3);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + (n === 640 ? 0 : 0), x = Math.sin(a) * r, z = -Math.cos(a) * r;
      let h = ekGroundY(x, z);
      const e = edge(r); if (e > 0) h = MathX.lerp(h, -1890 + 30, e);
      const p = ekSphere(x, z, h); pos.push(p[0], p[1], p[2]); hs.push(h);
    }
  }
  // the centre fan
  { const n = R[0][1], s0 = ringStart[0]; for (let k = 0; k < n; k++) idx.push(0, s0 + ((k + 1) % n), s0 + k); }
  for (let i = 0; i < R.length - 1; i++) {
    const na = R[i][1], nb = R[i + 1][1], a = ringStart[i], b = ringStart[i + 1];
    if (na === nb) for (let k = 0; k < na; k++) { const k1 = (k + 1) % na; idx.push(a + k, a + k1, b + k, a + k1, b + k1, b + k); }
    else for (let k = 0; k < nb; k++) {   // 2 : 1
      const a0 = a + 2 * k, a1 = a + 2 * k + 1, a2 = a + (2 * k + 2) % na, b0 = b + k, b1 = b + (k + 1) % nb;
      idx.push(a0, a1, b0, a1, b1, b0, a1, a2, b1);
    }
  }
  // a skirt under the far edge (nothing shows through where the land meets the globe)
  { const n = R[R.length - 1][1], a = ringStart[R.length - 1], b = pos.length / 3, r = 600000;
    for (let k = 0; k < n; k++) { const ang = (k / n) * Math.PI * 2, p = ekSphere(Math.sin(ang) * r, -Math.cos(ang) * r, -1890 - 30000); pos.push(...p); hs.push(-1890 - 30000); }
    for (let k = 0; k < n; k++) { const k1 = (k + 1) % n; idx.push(a + k, a + k1, b + k, a + k1, b + k1, b + k); } }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  // colour: from the height, the slope against the local up, the facing
  const N = g.attributes.normal.array, cc = [0, 0, 0];
  for (let i = 0; i < pos.length / 3; i++) {
    const x = pos[3 * i], y = pos[3 * i + 1], z = pos[3 * i + 2];
    const ux = x / EK_RM, uy = (y + EK_RM) / EK_RM, uz = z / EK_RM, ul = Math.hypot(ux, uy, uz);
    const up = (N[3 * i] * ux + N[3 * i + 1] * uy + N[3 * i + 2] * uz) / ul;
    const slope = 1 - MathX.clamp(up, 0, 1), north = -N[3 * i + 2];
    // (positions on the sphere ≈ (x, z) along it within the patch)
    ekGroundColor(x, z, hs[i], Math.min(1, slope * 1.6), north, cc);
    const r = Math.hypot(x, z);
    if (r > 300000) { const k = ekSmooth(300000, 560000, r), gc = ekGlobeColorAt(x, z); for (let j = 0; j < 3; j++) cc[j] = MathX.lerp(cc[j], gc[j], k); }
    col.push(cc[0], cc[1], cc[2]);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const mat = ekWorldPatch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0, envMapIntensity: 0.0 }), { key: 'terrain' });
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; m.frustumCulled = false; m.name = 'terrain';
  W.add(m);
  return m;
}
// the globe's colour where the land patch ends (the engine's Earth texture, sampled once)
let EK_GLOBE_PIX = null;
function ekGlobeColorAt(x, z) {
  if (!EK_GLOBE_PIX) return [0.2, 0.24, 0.16];
  const [lon, lat] = ekLonLat(x, z), { w, h, d } = EK_GLOBE_PIX;
  const i = Math.min(w - 1, Math.max(0, Math.floor((lon + 180) / 360 * w))), j = Math.min(h - 1, Math.max(0, Math.floor((90 - lat) / 180 * h)));
  const o = (j * w + i) * 4, lin = (v) => Math.pow(v / 255, 2.2);
  return [lin(d[o]), lin(d[o + 1]), lin(d[o + 2])];
}
// longitude and latitude (°) of a point (x east, z south: metres along the Earth from P)
function ekLonLat(x, z) {
  const R = EK_RM, d = Math.hypot(x, z) / R, br = Math.atan2(x, -z), la1 = EK_F.lat * Math.PI / 180, lo1 = EK_F.lon * Math.PI / 180;
  const la2 = Math.asin(Math.sin(la1) * Math.cos(d) + Math.cos(la1) * Math.sin(d) * Math.cos(br));
  const lo2 = lo1 + Math.atan2(Math.sin(br) * Math.sin(d) * Math.cos(la1), Math.cos(d) - Math.sin(la1) * Math.sin(la2));
  return [lo2 * 180 / Math.PI, la2 * 180 / Math.PI];
}

// the skyline towards the Sun (azimuth 73.8°: it moves 1° in the film's 13 minutes) from the ground ±12 km round P
function ekHorizonMap(az = 73.8) {
  const N = 96, Rh = EK_U.uHorR.value, data = new Float32Array(N * N * 4);
  const dx = Math.sin(az * Math.PI / 180), dz = -Math.cos(az * Math.PI / 180);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x0 = -Rh + (2 * Rh) * (i + 0.5) / N, z0 = -Rh + (2 * Rh) * (j + 0.5) / N, h0 = ekGroundY(x0, z0) + 3;
    let best = -90;
    for (let d = 60; d < 160000; d *= 1.07) { const y = ekGroundY(x0 + dx * d, z0 + dz * d) - d * d / (2 * EK_RM); const e = Math.atan2(y - h0, d); if (e > best) best = e; }
    data[(j * N + i) * 4] = best * 180 / Math.PI;
  }
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat, THREE.FloatType);
  t.minFilter = t.magFilter = THREE.LinearFilter; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true;
  EK_U.uHor.value = t;
  return t;
}

// ---- the lake: a grid on the curved Earth (the same sphere as the land), turquoise; the sky in it at a glance
function ekLake(W) {
  const L = EK_F.lake, pos = [], uv = [], idx = [], nx = 160, nz = 48, x0 = L.cx - L.hx - 60, x1 = L.cx + L.hx + 60, z0 = L.cz - L.hz - 60, z1 = L.cz + L.hz + 60;
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const x = MathX.lerp(x0, x1, i / nx), z = MathX.lerp(z0, z1, j / nz), p = ekSphere(x, z, EK_F.lakeY);
    pos.push(...p); uv.push(x, z);
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const mat = ekWorldPatch(new THREE.MeshStandardMaterial({ color: '#2f8c8f', roughness: 0.08, metalness: 0.0, envMapIntensity: 1.0, transparent: false }), {
    key: 'lake',
    vHead: 'varying vec2 vXZ;', vBody: 'vXZ = uv;',
    fHead: `varying vec2 vXZ; uniform vec3 uSkyHor, uSkyTop;
      float ekLh(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
      float ekLn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(ekLh(i), ekLh(i + vec2(1, 0)), f.x), mix(ekLh(i + vec2(0, 1)), ekLh(i + vec2(1, 1)), f.x), f.y); }`,
    fBody: `{ // the sky in the water: a Fresnel glance, with a few cat's-paws of breeze on the surface
        vec3 vdir = normalize(vWw - uEyeW); float c = clamp(-vdir.y, 0.0, 1.0);
        float rip = ekLn(vXZ * 0.08) * 0.6 + ekLn(vXZ * 0.31) * 0.4;
        float fr = 0.02 + 0.98 * pow(1.0 - c, 5.0);
        vec3 refl = mix(uSkyHor, uSkyTop, smoothstep(0.0, 0.6, c + 0.08 * (rip - 0.5)));
        gl_FragColor.rgb = mix(gl_FragColor.rgb, refl, clamp(fr * (0.85 + 0.3 * rip), 0.0, 1.0)); }`,
    after: (sh) => { sh.uniforms.uSkyHor = EK_LAKE_U.uSkyHor; sh.uniforms.uSkyTop = EK_LAKE_U.uSkyTop; },
  });
  // (only where it's water: the shore is the land's)
  mat.alphaTest = 0;
  const m = new THREE.Mesh(g, mat); m.name = 'lake'; m.receiveShadow = true; m.frustumCulled = false;
  m.renderOrder = 1;
  // a polygon offset towards the camera: the lake's surface and the shore never fight
  mat.polygonOffset = true; mat.polygonOffsetFactor = -1; mat.polygonOffsetUnits = -2;
  W.add(m);
  return m;
}
const EK_LAKE_U = { uSkyHor: { value: new THREE.Color('#5a6a88') }, uSkyTop: { value: new THREE.Color('#1c2f58') } };

// ---- the forest: spruce and fir, instanced (two tiers of cones and a trunk, one mesh); where ekGroundColor puts forest
function ekForestAt(x, z, h) {
  const n = ekN2(x * 0.011, z * 0.011, 71), n2 = ekN2(x * 0.0021, z * 0.0021, 73);
  const tl = 360 + 120 * n2 + 50 * n;
  const camp = ekSmooth(260, 150, Math.hypot(x - 40, (z - 10) * 1.4));
  return MathX.clamp(0.62 + 0.5 * n + 0.25 * n2, 0, 1) * (1 - camp) * ekSmooth(tl + 30, tl - 40, h);
}
function ekForest(W) {
  // one tree: 1 m tall (scaled per instance)
  const parts = [];
  const cone = (r, y0, y1, seg) => { const c = new THREE.ConeGeometry(r, y1 - y0, seg, 1, true); c.translate(0, (y0 + y1) / 2, 0); return c; };
  parts.push(cone(0.2, 0.18, 0.62, 7), cone(0.15, 0.45, 0.85, 7), cone(0.09, 0.7, 1.0, 6));
  const trunk = new THREE.CylinderGeometry(0.025, 0.035, 0.25, 5, 1, true); trunk.translate(0, 0.12, 0);
  const geo = THREE.BufferGeometryUtils ? THREE.BufferGeometryUtils.mergeGeometries([...parts, trunk]) : ekMerge([...parts, trunk]);
  // colour: the needles dark blue-green, the trunk brown (a per-vertex colour)
  const nv = geo.attributes.position.count, cl = new Float32Array(nv * 3), P = geo.attributes.position.array;
  for (let i = 0; i < nv; i++) { const y = P[3 * i + 1], tr = y < 0.2 && Math.hypot(P[3 * i], P[3 * i + 2]) < 0.04; cl[3 * i] = tr ? 0.25 : 0.05 + 0.04 * y; cl[3 * i + 1] = tr ? 0.17 : 0.1 + 0.05 * y; cl[3 * i + 2] = tr ? 0.11 : 0.075 + 0.03 * y; }
  geo.setAttribute('color', new THREE.BufferAttribute(cl, 3));
  const list = [];
  const place = (x0, x1, z0, z1, step, seed) => {
    for (let z = z0; z < z1; z += step) for (let x = x0; x < x1; x += step) {
      const jx = x + (ekR(Math.round(x * 7 + z * 13), seed) - 0.5) * step * 0.9, jz = z + (ekR(Math.round(x * 11 - z * 5), seed + 1) - 0.5) * step * 0.9;
      if (ekLakeSD(jx, jz) < 12) continue;
      const h = ekGroundY(jx, jz), k = ekForestAt(jx, jz, h);
      if (ekR(Math.round(jx * 3 + jz * 17), seed + 2) > k) continue;
      // (no trees on the camp's meadow, the road, the van's pitch)
      if (Math.abs(jz - EK_F.road.z) < 7 && jx > -200) continue;
      if (Math.hypot(jx - EK_F.van.x, jz - EK_F.van.z) < 16) continue;
      if (Math.hypot(jx - EK_F.lodge.x, jz - EK_F.lodge.z) < 45) continue;
      const tall = (14 + 14 * ekR(Math.round(jx * 5 + jz), seed + 3)) * (1 - 0.45 * ekSmooth(250, 420, h));
      list.push([jx, jz, h, tall]);
    }
  };
  place(-1500, 1500, -1500, 1500, 9, 1);
  const mat = ekWorldPatch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, flatShading: false }), { key: 'forest' });
  const im = new THREE.InstancedMesh(geo, mat, list.length), M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = [0, 0, 0];
  list.forEach(([x, z, h, tall], i) => {
    ekSphere(x, z, h - 0.3, p);
    e.set(0, ekR(i, 9) * 6.28, 0); q.setFromEuler(e);
    const w = tall * (0.85 + 0.3 * ekR(i, 10));
    M.compose(new THREE.Vector3(p[0], p[1], p[2]), q, new THREE.Vector3(w, tall, w));
    im.setMatrixAt(i, M);
  });
  im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; im.name = 'forest';
  W.add(im);
  return { mesh: im, count: list.length };
}
// a plain merge of non-indexed / indexed geometries (position + normal), when BufferGeometryUtils isn't bundled
function ekMerge(list) {
  const pos = [], nor = [];
  for (let g of list) { g = g.index ? g.toNonIndexed() : g; g.computeVertexNormals(); pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); }
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return out;
}

// ---- grass round the tent: thin tapered blades (instanced), for the close looks when the world is small
function ekGrass(W, R = 9, n = 26000) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-0.004, 0, 0, 0.004, 0, 0, 0.0, 1, 0.0], 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  const mat = ekWorldPatch(new THREE.MeshStandardMaterial({ color: '#7a7a44', roughness: 0.85, side: THREE.DoubleSide }), { key: 'grass' });
  const im = new THREE.InstancedMesh(g, mat, n), M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
  let k = 0;
  for (let i = 0; i < n * 3 && k < n; i++) {
    const a = ekR(i, 21) * Math.PI * 2, r = R * Math.sqrt(ekR(i, 22)), x = Math.sin(a) * r, z = -Math.cos(a) * r;
    // (not inside the tent's floor)
    if (Math.abs(x) < 1.1 && Math.abs(z) < 0.8) continue;
    const h = 0.05 + 0.13 * ekR(i, 23) * (0.6 + 0.4 * ekN2(x * 0.7, z * 0.7, 25));
    e.set((ekR(i, 24) - 0.5) * 0.7, ekR(i, 26) * 6.28, (ekR(i, 27) - 0.5) * 0.7); q.setFromEuler(e);
    M.compose(new THREE.Vector3(x, ekGroundY(x, z) - 0.01, z), q, new THREE.Vector3(1 + ekR(i, 28), h, 1));
    im.setMatrixAt(k, M);
    c.setRGB(0.32 + 0.12 * ekR(i, 29), 0.33 + 0.08 * ekR(i, 30), 0.16); im.setColorAt(k, c);
    k++;
  }
  im.count = k; im.frustumCulled = false; im.receiveShadow = true; im.name = 'grass';
  W.add(im);
  return im;
}
