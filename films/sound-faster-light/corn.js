/* =====================================================================
   CORN — 2.4 m field corn in late July, rows 76 cm apart running east–west.
     near the camera   real plants (a stalk, twelve leaves, the tassel, an ear), instanced in 8 m cells built when first
                       needed (each cell's plants are a function of its place only: the same on every frame and worker);
                       two levels of detail; the paths you, she and the dog ran are pushed through (stalks bent away)
     the edges         the first 8 m along every edge the yard can see: always there
     far away          the canopy: one surface 2.32 m over the ground (seen from above only), and a dark wall 6 m in
                       from every edge (what shows between the edge plants)
   The wind sways every plant (a pure function of t); late on the inflow lays the whole field down, pointing west.
   ===================================================================== */

// a corn plant (local: base at the origin, up +y, 2.4 m), vertex-coloured; lod 0 (about 190 triangles) or 1 (about 46)
function sfCornGeo(lod) {
  const P = [], C = [], r = new RNG(lod ? 31 : 17);
  const col = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
  const tri = (a, b, c, ca, cb = ca, cc = ca) => { P.push(...a, ...b, ...c); C.push(...ca, ...cb, ...cc); };
  const quad = (a, b, c, d, ca, cb) => { tri(a, b, c, ca, ca, cb); tri(a, c, d, ca, cb, cb); };
  // the stalk
  const sides = lod ? 3 : 5, segs = lod ? 1 : 3, H = 2.15;
  for (let s = 0; s < segs; s++) for (let i = 0; i < sides; i++) {
    const y0 = H * s / segs, y1 = H * (s + 1) / segs, r0 = 0.016 - 0.008 * s / segs, r1 = 0.016 - 0.008 * (s + 1) / segs, a0 = i / sides * 6.283, a1 = (i + 1) / sides * 6.283;
    quad([Math.cos(a0) * r0, y0, Math.sin(a0) * r0], [Math.cos(a1) * r0, y0, Math.sin(a1) * r0], [Math.cos(a1) * r1, y1, Math.sin(a1) * r1], [Math.cos(a0) * r1, y1, Math.sin(a0) * r1], col('#5d7a30'), col('#6a8636'));
  }
  // the leaves: alternate sides up the stalk, rising then drooping, widest a third of the way out
  const nl = lod ? 6 : 12, ns = lod ? 3 : 4;
  for (let k = 0; k < nl; k++) {
    const y0 = 0.3 + (1.95 - 0.3) * k / (nl - 1), th = (k % 2 ? Math.PI : 0) + r.range(-0.5, 0.5), d = [Math.cos(th), 0, Math.sin(th)], sd = [-d[2], 0, d[0]];
    const L = (0.65 + 0.3 * Math.sin(Math.PI * k / nl)) * (lod ? 1.08 : 1), W = 0.085 * (lod ? 1.35 : 1), a0 = r.range(0.45, 0.7), a1 = r.range(1.7, 2.2);
    const dry = y0 < 0.6 ? 0.75 : y0 < 0.9 ? 0.25 : 0;
    const cA = col(dry > 0.5 ? '#7a6a3a' : '#3f6a24'), cB = col(dry > 0.5 ? '#9a8650' : dry > 0 ? '#6a7a34' : '#4e7e2c');
    let p = [0, y0, 0], prevL = p, prevR = p;
    for (let i = 1; i <= ns; i++) {
      const u = i / ns, a = a0 + (a1 - a0) * u * u, ds = L / ns, tw = 0.3 * u;
      p = [p[0] + ds * Math.sin(a) * d[0], p[1] + ds * Math.cos(a), p[2] + ds * Math.sin(a) * d[2]];
      const w = W * Math.pow(Math.sin(Math.PI * (0.12 + 0.88 * u)), 0.7) * (i === ns ? 0.15 : 1), s2 = [sd[0] + d[0] * tw, tw * 0.5, sd[2] + d[2] * tw];
      const L1 = [p[0] - s2[0] * w, p[1] - s2[1] * w, p[2] - s2[2] * w], R1 = [p[0] + s2[0] * w, p[1] + s2[1] * w, p[2] + s2[2] * w];
      quad(prevL, prevR, R1, L1, i === 1 ? cA : cB, cB);
      prevL = L1; prevR = R1;
    }
  }
  // the tassel: thin spikes off the top
  const tc = col('#a8945a');
  for (let i = 0; i < (lod ? 2 : 6); i++) { const a = i / 6 * 6.283 + r.range(0, 0.5), o = [Math.cos(a) * 0.1, 0, Math.sin(a) * 0.1], b = [0, H, 0], t = [o[0] * 1.6, H + 0.28 + r.range(0, 0.06), o[2] * 1.6]; tri([b[0] - 0.008, b[1], b[2]], [b[0] + 0.008, b[1], b[2]], t, tc); }
  tri([-0.006, H - 0.05, 0], [0.006, H - 0.05, 0], [0, H + 0.3, 0], tc);
  // the ear, in its husk, on a short shank
  if (!lod) { const a = r.range(0, 6.28), d = [Math.cos(a), Math.sin(a)], base = [d[0] * 0.02, 1.0, d[1] * 0.02], tip = [d[0] * 0.13, 1.24, d[1] * 0.13], hc = col('#8c9a52');
    for (let i = 0; i < 4; i++) { const b0 = i / 4 * 6.283, b1 = (i + 1) / 4 * 6.283, w = 0.035, off = (b) => [Math.cos(b) * w * -d[1], Math.sin(b) * w, Math.cos(b) * w * d[0]];
      const o0 = off(b0), o1 = off(b1); quad([base[0] + o0[0], base[1] + o0[1], base[2] + o0[2]], [base[0] + o1[0], base[1] + o1[1], base[2] + o1[2]], [tip[0] + o1[0] * 0.5, tip[1] + o1[1] * 0.5, tip[2] + o1[2] * 0.5], [tip[0] + o0[0] * 0.5, tip[1] + o0[1] * 0.5, tip[2] + o0[2] * 0.5], hc, hc); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.computeVertexNormals();
  return g;
}

// the wind and the lying-down: shared uniforms (farm.js sets them each frame)
const SF_CORN_U = { uT: { value: 0 }, uWind: { value: new THREE.Vector3(1, 0.04, 0) }, uBend: { value: 0 }, uCam: { value: new THREE.Vector3() }, uCut: { value: 0 }, uFlat: { value: 0 }, uClr: { value: new THREE.Vector4() }, uClrW: { value: 0 } };
function sfCornMat() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, metalness: 0, side: THREE.DoubleSide, envMapIntensity: 0.5 });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, SF_CORN_U);
    sh.vertexShader = 'uniform float uT, uBend; uniform vec3 uWind; varying vec3 vSfP;\n' + sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
      #ifdef USE_INSTANCING
      vSfP = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
      #endif`).replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
      { vec3 ip = vec3(instanceMatrix[3]); mat3 R = mat3(instanceMatrix); float sc2 = max(dot(R[0], R[0]), 1e-4);
        vec3 wl = (transpose(R) * vec3(uWind.x, 0.0, uWind.z)) / sc2; vec2 wd = normalize(wl.xz + vec2(1e-5, 0.0));
        float gust = 0.5 + 0.5 * sin(uT * 1.9 + ip.x * 0.23 + ip.z * 0.19) * sin(uT * 0.73 - ip.x * 0.051 + ip.z * 0.083);
        float h = max(transformed.y, 0.0) / 2.4;
        float ang = (uWind.y * (0.3 + 0.7 * gust) + uBend * (1.0 + 0.3 * gust)) * h;
        float y = transformed.y; transformed.y = y * cos(ang); transformed.xz += wd * y * sin(ang);
        transformed += vec3(0.025, 0.012, 0.025) * sin(uT * 6.3 + y * 3.1 + ip.x * 1.7 + ip.z) * h * min(1.0, uWind.y * 4.0 + uBend); }
      #endif`);
    // a clear line from the camera to the shot's subject (the plants on it are not drawn: a cinematographer's cut)
    sh.fragmentShader = 'uniform vec4 uClr; uniform float uClrW; varying vec3 vSfP;\n' + sh.fragmentShader.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
      if (uClrW > 0.0) { vec2 a = uClr.xy, b = uClr.zw, p = vSfP.xz, ab = b - a; float h = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0); if (length(p - a - ab * h) < uClrW && h < 0.97) discard; }`);
  };
  m.customProgramCacheKey = () => 'sfCorn';
  return m;
}

function sfCorn(set) {
  const S = set.scene, geo = [sfCornGeo(0), sfCornGeo(1)], mat = sfCornMat(), CELL = 8, ROW = SF_F.rowW, cells = new Map();
  // the paths pushed through the corn: you (the run), her, the dog; a clearing where she crouches
  const paths = [];
  const addPath = (M, s0, s1, w) => { for (let s = s0; s <= s1; s += 0.15) { const a = M.at(s); paths.push([a.x, a.z, w]); } };
  addPath(SFY, SFE.run - 0.2, SFY.runEnd + 0.2, 0.42); addPath(SFK, 0.3, 45, 0.3); addPath(SFD, -1, 39, 0.26);
  paths.push([SF_PLACES.kid[0], SF_PLACES.kid[1], 0.9]);
  const pathGrid = new Map(); for (const p of paths) { const k = Math.floor(p[0] / 4) + ',' + Math.floor(p[1] / 4); if (!pathGrid.has(k)) pathGrid.set(k, []); pathGrid.get(k).push(p); }
  const pushed = (x, z) => { const i = Math.floor(x / 4), j = Math.floor(z / 4); let best = null; for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { const L = pathGrid.get((i + di) + ',' + (j + dj)); if (!L) continue; for (const p of L) { const d = Math.hypot(x - p[0], z - p[1]); if (d < p[2] + 0.35 && (!best || d - p[2] < best[0])) best = [d - p[2], p]; } } return best; };
  const ob = new THREE.Object3D();
  function build(i, j, edge) {
    const key = i + ',' + j; if (cells.has(key)) return cells.get(key);
    const mats = [], r = new RNG((i * 73856093) ^ (j * 19349663));
    const z0 = j * CELL, x0 = i * CELL;
    for (let k = Math.ceil(z0 / ROW - 0.5); (k + 0.5) * ROW < z0 + CELL; k++) {
      const zr = (k + 0.5) * ROW;
      for (let x = x0 + r.range(0, 0.3); x < x0 + CELL; x += 0.3) {
        const xx = x + r.range(-0.06, 0.06), zz = zr + r.range(-0.05, 0.05);
        if (!sfIsCorn(xx, zz) || r.next() < 0.04) { r.next(); r.next(); continue; }
        let lean = [r.range(-0.05, 0.05), r.range(-0.05, 0.05)], yaw = r.range(0, 6.283), sc = r.range(0.93, 1.06), hs = r.range(0.9, 1.06);
        const pu = pushed(xx, zz);
        if (pu) { const [d, p] = pu; if (d < -0.05) continue; const ax = xx - p[0], az = zz - p[1], L = Math.hypot(ax, az) || 1, k2 = MathX.clamp(1 - d / 0.35, 0, 1) * 0.55; lean = [az / L * k2, -ax / L * k2]; }
        ob.position.set(xx, sfGroundY(xx, zz) - 0.02, zz); ob.rotation.set(lean[0], yaw, lean[1], 'XZY'); ob.scale.set(sc, sc * hs, sc); ob.updateMatrix();
        mats.push(ob.matrix.clone());
      }
    }
    const c = { i, j, cx: x0 + CELL / 2, cz: z0 + CELL / 2, edge, m: [null, null], n: mats.length };
    if (mats.length) for (let l = 0; l < 2; l++) {
      const m = new THREE.InstancedMesh(geo[l], mat, mats.length); mats.forEach((q, n) => m.setMatrixAt(n, q));
      m.castShadow = false; m.receiveShadow = true; m.computeBoundingSphere(); m.visible = false; S.add(m); c.m[l] = m;
    }
    cells.set(key, c); return c;
  }
  // the edge cells (always there): west, north, east (of the north field), south (along the road, west of the drive)
  const F = SF_F, edges = [];
  for (let z = -56; z < F.road.z - 9; z += CELL) edges.push([Math.floor((F.field.westX - 1) / CELL), Math.floor(z / CELL)]);
  for (let x = F.field.westX - 8; x < F.field.eastX; x += CELL) edges.push([Math.floor(x / CELL), Math.floor((F.field.northZ - 1) / CELL)]);
  for (let z = -210; z < F.field.northZ; z += CELL) edges.push([Math.floor((F.field.eastX - 1) / CELL), Math.floor(z / CELL)]);
  for (let x = -170; x < F.field.westX; x += CELL) for (const zz of [F.road.z - 10, F.road.z - 18]) edges.push([Math.floor(x / CELL), Math.floor(zz / CELL)]);
  for (const [i, j] of edges) build(i, j, true);

  // ---- the canopy (seen from above): a surface 2.32 m over the ground, from 6 m inside the edges outwards
  const canTex = sfTex(sfCanvas(256, 256, (g) => { const r = new RNG(55); g.fillStyle = '#34521f'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) { const x = r.range(0, 256), y = r.range(0, 256), a = r.range(0, 6.28), L = r.range(8, 26), c = r.next() < 0.5 ? 'rgba(90,130,50,0.35)' : 'rgba(18,34,12,0.45)'; g.strokeStyle = c; g.lineWidth = r.range(2, 5); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * L * 0.6, y + Math.sin(a) * L * 0.6 - 4, x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(190,170,110,${r.range(0.25, 0.6)})`; g.fillRect(r.range(0, 256), r.range(0, 256), 2, 2); }
    for (let k = 0; k < 4; k++) { g.fillStyle = 'rgba(8,16,6,0.35)'; g.fillRect(0, k * 64 + 30, 256, 5); } }));
  canTex.repeat.set(1, 1);
  const canM = new THREE.MeshStandardMaterial({ color: '#ffffff', map: canTex, roughness: 0.8, envMapIntensity: 0.4 });
  canM.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, SF_CORN_U);
    sh.vertexShader = 'uniform float uBend; varying vec3 vSfW;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed.y -= 0.95 * uBend;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n vSfW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = 'uniform vec3 uCam; uniform float uCut, uT, uBend; uniform vec3 uWind; varying vec3 vSfW;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      { float d = length(vSfW.xz - uCam.xz); if (d < uCut) discard;
        vec2 wd = normalize(uWind.xz + vec2(1e-5, 0.0)); float wave = sin(dot(vSfW.xz, wd) * 0.21 - uT * 4.2) * sin(dot(vSfW.xz, wd) * 0.05 + vSfW.z * 0.03 - uT * 1.3);
        diffuseColor.rgb *= 1.0 + (0.18 * min(1.0, uWind.y * 3.0) + 0.35 * uBend) * wave; }`);
  };
  canM.customProgramCacheKey = () => 'sfCanopy';
  const canopy = [];
  const mkCanopy = (x0, x1, z0, z1, step) => {
    const xs = [], zs = []; for (let x = x0; x <= x1 + 1e-6; x += step) xs.push(x); for (let z = z0; z <= z1 + 1e-6; z += step) zs.push(z);
    const nx = xs.length, pos = [], uv = [], idx = [], map = new Map();
    const vid = (i, j) => { const k = i + ',' + j; if (map.has(k)) return map.get(k); const x = xs[i], z = zs[j]; const id = pos.length / 3; pos.push(x, sfGroundY(x, z) + 2.32, z); uv.push(x / 3.04, z / 3.04); map.set(k, id); return id; };
    for (let j = 0; j < zs.length - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const cx = (xs[i] + xs[i + 1]) / 2, cz = (zs[j] + zs[j + 1]) / 2;
      if (sfCornIn(cx, cz) < 6 + step / 2) continue;
      const a = vid(i, j), b = vid(i + 1, j), c = vid(i, j + 1), d = vid(i + 1, j + 1); idx.push(a, c, b, b, c, d);
    }
    if (!idx.length) return;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, canM); m.receiveShadow = true; S.add(m); canopy.push(m);
  };
  // (in tiles: 2 m cells near the yard, coarser outwards; no triangle longer than 40 m)
  for (let x = -400; x < 80; x += 80) for (let z = -400; z < 80; z += 80) mkCanopy(x, Math.min(x + 80, 64), z, Math.min(z + 80, 68), 2);
  for (let x = -2400; x < 800; x += 400) for (let z = -2400; z < 800; z += 400) { if (x >= -400 && x < 80 && z >= -400 && z < 80) continue; mkCanopy(x, x + 400, z, z + 400, 20); }
  // a strip of 20 m cells round the 2 m block would leave a seam: the coarse tiles skip cells inside the fine block
  // ---- the walls, 6 m in from each edge: stalks and leaves, a ragged top of tassels
  const wallTex = sfTex(sfCanvas(512, 320, (g) => { const r = new RNG(66); g.clearRect(0, 0, 512, 320); g.fillStyle = '#1c2a12'; g.fillRect(0, 40, 512, 280);
    for (let i = 0; i < 70; i++) { const x = r.range(0, 512), top = r.range(8, 46); g.strokeStyle = 'rgba(40,56,22,1)'; g.lineWidth = r.range(2, 4); g.beginPath(); g.moveTo(x, 320); g.lineTo(x + r.range(-4, 4), top + 20); g.stroke(); g.strokeStyle = 'rgba(150,130,80,1)'; g.lineWidth = 1.5; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x, top + 22); g.lineTo(x + r.range(-10, 10), top); g.stroke(); } }
    for (let i = 0; i < 420; i++) { const x = r.range(0, 512), y = r.range(40, 320), a = r.range(-0.6, 0.6) + (r.next() < 0.5 ? 0 : Math.PI), L = r.range(20, 60); g.strokeStyle = r.next() < 0.5 ? 'rgba(52,84,30,0.9)' : 'rgba(26,44,16,0.9)'; g.lineWidth = r.range(3, 7); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * L * 0.6, y - 10, x + Math.cos(a) * L, y + Math.sin(a) * L * 0.3 + 12); g.stroke(); } }));
  const wallM = new THREE.MeshStandardMaterial({ color: '#ffffff', map: wallTex, roughness: 0.85, alphaTest: 0.5, side: THREE.DoubleSide });
  // (inside the field the real plants are drawn round the camera: the wall is not drawn within that radius)
  wallM.onBeforeCompile = (sh) => { sh.uniforms.uCam = SF_CORN_U.uCam; sh.uniforms.uCut = SF_CORN_U.uCut;
    sh.vertexShader = 'varying vec3 vSfWW;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n vSfWW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = 'uniform vec3 uCam; uniform float uCut; varying vec3 vSfWW;\n' + sh.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n if (length(vSfWW.xz - uCam.xz) < uCut) discard;'); };
  wallM.customProgramCacheKey = () => 'sfCornWall';
  const wall = (a, b) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); for (let s = 0; s < L; s += 40) { const e = Math.min(L, s + 40), u0 = s / L, u1 = e / L, p0 = [a[0] + (b[0] - a[0]) * u0, a[1] + (b[1] - a[1]) * u0], p1 = [a[0] + (b[0] - a[0]) * u1, a[1] + (b[1] - a[1]) * u1];
      const g = new THREE.PlaneGeometry(e - s, 2.6), m = new THREE.Mesh(g, wallM); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * (e - s) / 4);
      m.position.set((p0[0] + p1[0]) / 2, sfGroundY((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2) + 1.28, (p0[1] + p1[1]) / 2); m.rotation.y = -Math.atan2(p1[1] - p0[1], p1[0] - p0[0]); m.receiveShadow = true; S.add(m); } };
  wall([F.field.westX - 6, F.road.z - 15], [F.field.westX - 6, F.field.northZ - 6]);
  wall([F.field.westX - 6, F.field.northZ - 6], [F.field.eastX - 6, F.field.northZ - 6]);
  wall([F.field.eastX - 6, F.field.northZ - 6], [F.field.eastX - 6, -400]);
  wall([-400, F.road.z - 15], [F.field.westX - 6, F.road.z - 15]);

  return {
    cells, canopy, mat,
    // show the plants the camera needs: interior cells within 30 m (detail within 13 m); the edges out to 340 m
    update(cam, o = {}) {
      const cx = cam.x, cz = cam.z, R1 = o.r1 ?? 30, R0 = o.r0 ?? 13, inside = o.inside ?? (sfCornIn(cx, cz) > -12 && cam.y < 60);
      if (inside) { const i0 = Math.floor((cx - R1 - CELL) / CELL), i1 = Math.floor((cx + R1 + CELL) / CELL), j0 = Math.floor((cz - R1 - CELL) / CELL), j1 = Math.floor((cz + R1 + CELL) / CELL);
        for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const x = (i + 0.5) * CELL, z = (j + 0.5) * CELL; if (Math.hypot(x - cx, z - cz) < R1 + CELL && sfCornIn(x, z) > -CELL) build(i, j, false); } }
      SF_CORN_U.uCam.value.set(cx, cam.y, cz); SF_CORN_U.uCut.value = inside ? R1 : 0;
      if (o.clear) { const c = o.clear; SF_CORN_U.uClr.value.set(c[0], c[1], c[2], c[3]); SF_CORN_U.uClrW.value = c[4]; } else SF_CORN_U.uClrW.value = 0;
      for (const c of cells.values()) {
        const d = Math.hypot(c.cx - cx, c.cz - cz), far = c.edge ? 340 : (inside ? R1 + 5.7 : -1);
        if (c.m[0]) c.m[0].visible = d < R0 + 5.7;
        if (c.m[1]) c.m[1].visible = d >= R0 + 5.7 && d < far;
      }
    },
  };
}
