/* =====================================================================
   WORLD — the valley: the ground (a fine inner height field with a painted 8 × 8 km map: fields, hedges, the town's
   streets, the airport's grass and aprons; a coarse outer ring out to 30 km for the view from 11,000 m), the river,
   the trees, the town (houses, flats, the hospital, the church), the sky (a morning gradient, the sun, clouds).
     mgBuildGround(S) · mgBuildRiver(S) · mgBuildTrees(S) · mgBuildTown(S) · mgBuildSky(S)
   No coplanar faces (the owner's note of 2026-11-04): everything flat that lies on the ground is painted into the
   ground's map; the runway, the apron's edges and the water are lifted and drawn with a polygon offset.
   ===================================================================== */

const MG_MAP = { x0: -3500, z0: -3000, size: 8000, px: 4096 };          // the painted map's square (world x, z)
const mgRange = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + (b - a) * i / n);

// a material bucket: add geometries (already placed), then build one merged mesh per material
function mgBatch() {
  const B = new Map();
  return {
    add(geo, mat) { if (!B.has(mat)) B.set(mat, []); B.get(mat).push(geo.index ? geo.toNonIndexed() : geo); return geo; },
    box(w, h, d, mat, x, y, z, ry = 0, rx = 0, rz = 0) { const g = new THREE.BoxGeometry(w, h, d); g.applyMatrix4(Geo.matrix(x, y, z, rx, ry, rz)); return this.add(g, mat); },
    cyl(r0, r1, h, mat, x, y, z, seg = 12, rx = 0, rz = 0) { const g = new THREE.CylinderGeometry(r0, r1, h, seg); g.applyMatrix4(Geo.matrix(x, y, z, rx, 0, rz)); return this.add(g, mat); },
    build(parent, o = {}) {
      const out = [];
      for (const [m, gs] of B) {
        const g = THREE.mergeGeometries(gs.map((x) => { const y = x.clone(); for (const k of Object.keys(y.attributes)) if (!['position', 'normal', 'uv'].includes(k)) y.deleteAttribute(k); if (!y.attributes.uv) y.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(y.attributes.position.count * 2), 2)); return y; }), false);
        const mesh = new THREE.Mesh(g, m); mesh.castShadow = o.cast !== false; mesh.receiveShadow = true; (parent || MG_KIT_SCENE).add(mesh); out.push(mesh);
      }
      B.clear(); return out;
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE PAINTED MAP (2 m a pixel): what you see of the ground from the viaduct, the tower and the plane
// ---------------------------------------------------------------------------------------------------------------------
function mgMapCanvas() {
  const M = MG_MAP, N = M.px, k = N / M.size, r = new RNG(4711);
  const X = (x) => (x - M.x0) * k, Z = (z) => (z - M.z0) * k;
  return mgCanvas(N, N, (g) => {
    g.fillStyle = '#6b7a44'; g.fillRect(0, 0, N, N);
    // fields: a patchwork in blocks, each block a little rotated; ploughed, stubble, winter wheat, pasture, kale
    const pal = ['#7b6146', '#8a6d4c', '#a99a63', '#9c8e5a', '#6f8a46', '#5f7d3e', '#7e9150', '#8d9a5c', '#6a6a3e', '#b3a46c'];
    for (let bx = M.x0; bx < M.x0 + M.size; bx += 600) for (let bz = M.z0; bz < M.z0 + M.size; bz += 600) {
      const a = r.range(-0.35, 0.35), cx = bx + 300, cz = bz + 300;
      g.save(); g.translate(X(cx), Z(cz)); g.rotate(a);
      const fw = r.range(110, 210) * k, fh = r.range(80, 160) * k;
      for (let u = -340 * k; u < 340 * k; u += fw) for (let v = -340 * k; v < 340 * k; v += fh) {
        const w = fw * r.range(0.7, 1.15), h = fh * r.range(0.75, 1.1), c = pal[r.int(0, pal.length - 1)];
        g.fillStyle = c; g.fillRect(u, v, w, h);
        // crop rows / plough lines
        g.strokeStyle = 'rgba(0,0,0,0.07)'; g.lineWidth = 1; const dir = r.next() < 0.5;
        g.beginPath(); for (let q = 2; q < (dir ? w : h); q += 3) { if (dir) { g.moveTo(u + q, v); g.lineTo(u + q, v + h); } else { g.moveTo(u, v + q); g.lineTo(u + w, v + q); } } g.stroke();
        // the hedge round it
        g.strokeStyle = 'rgba(48,58,34,0.85)'; g.lineWidth = 1.6; g.strokeRect(u, v, w, h);
      }
      g.restore();
    }
    // woods on the valley's sides (the hills): darker, blotchy
    const img = g.getImageData(0, 0, N, N), d = img.data;
    for (let py = 0; py < N; py += 1) {
      const z = M.z0 + py / k, hw = mgHillW(z), he = mgHillE(z);
      for (let px = 0; px < N; px += 1) {
        const x = M.x0 + px / k, dd = Math.max(hw - x, x - he);
        if (dd < -40) continue;
        const f = MathX.smooth(dd, -40, 60) * (0.55 + 0.45 * Math.max(0, noise1(x * 0.004 + 3, 21) + 0.6 * noise1(z * 0.005, 22)));
        const bl = 0.75 + 0.25 * hash2(px >> 2, py >> 2) + 0.15 * noise1(x * 0.03 + z * 0.02, 23), i = (py * N + px) * 4;
        const cr = 58 * bl, cg = 70 * bl, cb = 40 * bl;
        d[i] = d[i] * (1 - f) + cr * f; d[i + 1] = d[i + 1] * (1 - f) + cg * f; d[i + 2] = d[i + 2] * (1 - f) + cb * f;
      }
    }
    g.putImageData(img, 0, 0);
    // the town's ground and streets (west bank, south of the viaduct)
    const T = MG_V.town;
    g.fillStyle = '#86826f'; g.beginPath();
    for (let z = T.z[0]; z <= T.z[1]; z += 40) g.lineTo(X(Math.max(T.x[0], mgHillW(z) + 60)), Z(z));
    for (let z = T.z[1]; z >= T.z[0]; z -= 40) g.lineTo(X(Math.min(T.x[1], mgRiverX(z) - 70)), Z(z));
    g.closePath(); g.fill();
    g.strokeStyle = '#5c5a55'; g.lineWidth = 7 * k;
    for (const st of mgTownStreets()) { g.beginPath(); st.forEach(([x, z], i) => (i ? g.lineTo(X(x), Z(z)) : g.moveTo(X(x), Z(z)))); g.stroke(); }
    // the river's banks (gravel and mud)
    g.strokeStyle = '#8b8370'; g.lineWidth = 16 * k;
    for (const sd of [-1, 1]) { g.beginPath(); for (let z = M.z0; z <= M.z0 + M.size; z += 20) { const x = mgRiverX(z) + sd * (MG_V.riverW + 3); z === M.z0 ? g.moveTo(X(x), Z(z)) : g.lineTo(X(x), Z(z)); } g.stroke(); }
    // the airport: mown grass, the aprons and taxiways (concrete), their yellow lines
    const R = MG_V.runway;
    g.fillStyle = '#7d9150'; g.fillRect(X(R.x - 160), Z(R.z[0] - 500), (900) * k, (R.z[1] - R.z[0] + 900) * k);
    g.fillStyle = 'rgba(255,255,230,0.05)'; for (let z = R.z[0] - 500; z < R.z[1] + 400; z += 60) g.fillRect(X(R.x - 160), Z(z), 900 * k, 30 * k);
    g.fillStyle = '#9b988d';
    g.fillRect(X(MG_V.taxiX - 11.5), Z(R.z[0] - 60), 23 * k, (R.z[1] - R.z[0] + 120) * k);                    // the parallel taxiway
    for (const z of [R.z[0] - 40, 2700, 3300, R.z[1] + 40]) g.fillRect(X(R.x), Z(z - 11.5), (MG_V.taxiX - R.x) * k, 23 * k);   // its links
    const A = MG_V.apron; g.fillRect(X(A.x[0]), Z(A.z[0]), (A.x[1] - A.x[0]) * k, (A.z[1] - A.z[0]) * k);
    g.fillStyle = 'rgba(70,66,58,0.25)'; for (let i = 0; i < 300; i++) g.fillRect(X(A.x[0] + r.range(0, 380)), Z(A.z[0] + r.range(0, 1100)), r.range(2, 12), r.range(2, 12));
    g.strokeStyle = '#d9b64a'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(X(MG_V.taxiX), Z(R.z[0] - 50)); g.lineTo(X(MG_V.taxiX), Z(R.z[1] + 50)); g.stroke();
    for (let i = 0; i < 6; i++) { const z = 2600 + i * 160; g.beginPath(); g.moveTo(X(A.x[0] + 20), Z(z)); g.lineTo(X(A.x[1] - 60), Z(z)); g.stroke(); }
    // country roads: from the town over the river to the airport, along the valley
    g.strokeStyle = '#6a6862'; g.lineWidth = 7 * k;
    const road = (pts) => { g.beginPath(); pts.forEach(([x, z], i) => (i ? g.lineTo(X(x), Z(z)) : g.moveTo(X(x), Z(z)))); g.stroke(); };
    road([[-600, 1500], [-300, 1550], [200, 1600], [700, 1500], [MG_V.apron.x[1] + 80, 2400], [1400, 3000]]);
    road([[300, -3000], [320, -1500], [260, -400], [250, 600], [300, 1550]]);
    road([[1400, 3000], [1700, 4200], [1900, 5000]]);
  });
}
// the town's streets (polylines, world x, z): a loose grid along the river
function mgTownStreets() {
  if (mgTownStreets._c) return mgTownStreets._c;
  const out = [], T = MG_V.town;
  for (let z = T.z[0] + 60; z < T.z[1]; z += 150) { const pts = []; for (let x = T.x[0]; x <= T.x[1] + 400; x += 60) { const xr = mgRiverX(z) - 70; if (x > xr || x < mgHillW(z) + 60) continue; pts.push([x, z + 12 * Math.sin(x * 0.004 + z * 0.01)]); } if (pts.length > 1) out.push(pts); }
  for (let x = T.x[0] + 70; x < T.x[1]; x += 190) { const pts = []; for (let z = T.z[0]; z <= T.z[1]; z += 60) { if (x > mgRiverX(z) - 70 || x < mgHillW(z) + 60) continue; pts.push([x + 15 * Math.sin(z * 0.003 + x), z]); } if (pts.length > 1) out.push(pts); }
  return (mgTownStreets._c = out);
}
// is (x, z) on a town street?
function mgOnStreet(x, z) { for (const st of mgTownStreets()) for (let i = 1; i < st.length; i++) { const [ax, az] = st[i - 1], [bx, bz] = st[i], dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz, u = MathX.clamp(((x - ax) * dx + (z - az) * dz) / L2, 0, 1); if (Math.hypot(x - ax - u * dx, z - az - u * dz) < 13) return true; } return false; }

// ---------------------------------------------------------------------------------------------------------------------
// THE GROUND: one position buffer, two meshes (the painted inner square, the coloured outer ring), exact shared edges
// ---------------------------------------------------------------------------------------------------------------------
function mgBuildGround(S) {
  const M = MG_MAP, x1 = M.x0 + M.size, z1 = M.z0 + M.size, outer = (a, b, n, p) => mgRange(0, 1, n).map((u) => a + (b - a) * Math.pow(u, p));
  const inX = mgRange(M.x0, x1, 400), inZ = mgRange(M.z0, z1, 400);
  const xs = [...outer(-32000, M.x0, 22, 0.55).slice(0, -1), ...inX, ...outer(x1, 34000, 22, 1.8).slice(1)];
  const zs = [...outer(-34000, M.z0, 22, 0.55).slice(0, -1), ...inZ, ...outer(z1, 36000, 22, 1.8).slice(1)];
  const nx = xs.length, nz = zs.length, P = new Float32Array(nx * nz * 3), U = new Float32Array(nx * nz * 2), C = new Float32Array(nx * nz * 3);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i, x = xs[i], z = zs[j], y = mgGroundY(x, z);
    P[k * 3] = x; P[k * 3 + 1] = y; P[k * 3 + 2] = z; U[k * 2] = (x - M.x0) / M.size; U[k * 2 + 1] = (z - M.z0) / M.size;
    // the outer ring's colour: woods and fields mottled, paler with height (autumn)
    const f = noise1(x * 0.0009 + 1, 31) * 0.5 + noise1(z * 0.0011 + 2, 32) * 0.5, hgt = MathX.clamp(y / 600, 0, 1), wood = MathX.smooth(f + 0.1 * hgt, -0.1, 0.25);
    const fld = [0.44 + 0.08 * hash2(Math.floor(x / 250), Math.floor(z / 180)), 0.47 + 0.06 * hash2(Math.floor(x / 250) + 7, Math.floor(z / 180)), 0.28];
    const c = [MathX.lerp(fld[0], 0.23, wood), MathX.lerp(fld[1], 0.28, wood), MathX.lerp(fld[2], 0.17, wood)];
    C[k * 3] = c[0] + 0.12 * hgt; C[k * 3 + 1] = c[1] + 0.1 * hgt; C[k * 3 + 2] = c[2] + 0.1 * hgt;
  }
  const iIn = [], iOut = [], i0 = xs.indexOf(M.x0), i1 = xs.indexOf(x1), j0 = zs.indexOf(M.z0), j1 = zs.indexOf(z1);
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1, inside = i >= i0 && i < i1 && j >= j0 && j < j1; (inside ? iIn : iOut).push(a, c, b, b, c, d); }
  const base = new THREE.BufferGeometry(); base.setAttribute('position', new THREE.BufferAttribute(P, 3)); base.setAttribute('uv', new THREE.BufferAttribute(U, 2)); base.setAttribute('color', new THREE.BufferAttribute(C, 3));
  base.setIndex([...iIn, ...iOut]); base.computeVertexNormals();
  const mk = (idx, mat) => { const g = new THREE.BufferGeometry(); for (const k of ['position', 'uv', 'normal', 'color']) g.setAttribute(k, base.attributes[k]); g.setIndex(idx); g.computeBoundingSphere(); const m = new THREE.Mesh(g, mat); m.receiveShadow = true; S.scene.add(m); return m; };
  const tex = mgTex(mgMapCanvas(), { repeat: false, aniso: 8 }); tex.flipY = false; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true;
  const inner = mk(iIn, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, metalness: 0 }));
  const outerM = mk(iOut, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 }));
  return { inner, outer: outerM, tex };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE RIVER: a strip along mgRiverX, 1.2 m under the banks' top (the bed is carved to −3.2), glinting in the low sun
// ---------------------------------------------------------------------------------------------------------------------
function mgBuildRiver(S) {
  const zs = mgRange(-30000, 30000, 1200), pos = [], idx = [], w = MG_V.riverW + 9;
  zs.forEach((z, i) => { const x = mgRiverX(z); pos.push(x - w, -1.25, z, x + w, -1.25, z); if (i) { const a = 2 * (i - 1); idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color: '#2a5560', roughness: 0.26, metalness: 0.0, envMapIntensity: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6 });
  // ripples: a slow normal wobble in the shader (a pure function of the uniform time)
  const U = { uT: { value: 0 } };
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uT = U.uT;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vMgW;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvMgW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vMgW; uniform float uT;')
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        { vec2 q = vMgW.xz; float a = sin(q.x * 0.21 + q.y * 0.05 + uT * 0.9) + sin(q.x * 0.07 - q.y * 0.33 - uT * 1.3) * 0.7 + sin(q.y * 0.9 + uT * 2.1) * 0.25;
          float b = cos(q.x * 0.17 - q.y * 0.11 - uT * 1.1) + cos(q.y * 0.41 + uT * 0.7) * 0.6;
          normal = normalize(normal + (viewMatrix * vec4(0.035 * a, 0.0, 0.05 * b, 0.0)).xyz); }`);
  };
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; S.scene.add(m);
  return { mesh: m, update(s) { U.uT.value = s; } };
}

// ---------------------------------------------------------------------------------------------------------------------
// TREES: instanced crowns and trunks (autumn: greens, ochres, rusts); woods on the slopes, rows along the river and
// the hedges, the town's gardens
// ---------------------------------------------------------------------------------------------------------------------
function mgBuildTrees(S) {
  const r = new RNG(99), list = [];
  const ok = (x, z) => {
    if (Math.abs(x - mgRiverX(z)) < MG_V.riverW + 6) return false;
    if (Math.abs(z) < 40 && x > MG_V.vx[0] - 400 && x < MG_V.vx[1] + 400) return false;            // the motorway
    if (Math.abs(x - MG_V.railX) < 9) return false;
    const R = MG_V.runway; if (x > R.x - 170 && x < MG_V.apron.x[1] + 120 && z > R.z[0] - 1100 && z < R.z[1] + 600) return false;   // the airport (and its approach)
    return true;
  };
  // woods on the slopes
  for (let i = 0; i < 9000; i++) { const z = r.range(-3000, 5000), side = r.next() < 0.5, d = r.range(-30, 1400), x = side ? mgHillW(z) - d : mgHillE(z) + d;
    if (noise1(x * 0.004 + 3, 21) + 0.6 * noise1(z * 0.005, 22) < -0.25 || !ok(x, z)) continue; list.push([x, z, r.range(5, 9), 0]); }
  // the river's banks
  for (let z = -3000; z < 5000; z += 14) for (const sd of [-1, 1]) { if (r.next() < 0.35) continue; const x = mgRiverX(z) + sd * (MG_V.riverW + r.range(8, 22)); if (ok(x, z)) list.push([x, z + r.range(-5, 5), r.range(4, 7.5), 1]); }
  // hedgerow trees across the valley floor
  for (let i = 0; i < 1400; i++) { const x = r.range(-900, 1900), z = r.range(-3000, 5000); if (ok(x, z)) list.push([x, z, r.range(3.5, 7), 2]); }
  // gardens in town
  const T = MG_V.town;
  for (let i = 0; i < 900; i++) { const x = r.range(T.x[0], T.x[1]), z = r.range(T.z[0], T.z[1]); if (x > mgRiverX(z) - 80 || x < mgHillW(z) + 60 || mgOnStreet(x, z) || !ok(x, z)) continue; list.push([x, z, r.range(3, 6), 3]); }
  const n = list.length, crownG = mgBlobGeo(1, 3), trunkG = new THREE.CylinderGeometry(0.12, 0.2, 1, 6).translate(0, 0.5, 0);
  const crown = new THREE.InstancedMesh(crownG, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, flatShading: true }), n), trunk = new THREE.InstancedMesh(trunkG, mgStd('#4a3a2c', 0.9), n);
  const o = new THREE.Object3D(), c = new THREE.Color();
  const pal = [['#3f5a2e', '#4f6a34', '#5b6f30'], ['#8a7a2e', '#a0702a', '#7a5a24'], ['#6b4a28', '#56602e', '#93622a']];
  list.forEach(([x, z, hgt], i) => {
    const y = mgGroundY(x, z), cw = hgt * r.range(0.3, 0.42);
    o.position.set(x, y - 0.2, z); o.rotation.set(0, r.range(0, 6.28), 0); o.scale.set(hgt * 0.06 + 0.4, hgt * 0.62, hgt * 0.06 + 0.4); o.updateMatrix(); trunk.setMatrixAt(i, o.matrix);
    o.position.set(x, y + hgt * 0.62, z); o.scale.set(cw, cw * r.range(1.0, 1.35), cw); o.updateMatrix(); crown.setMatrixAt(i, o.matrix);
    const p = pal[r.next() < 0.55 ? 0 : r.next() < 0.6 ? 1 : 2]; c.set(p[r.int(0, 2)]).multiplyScalar(r.range(0.82, 1.12)); crown.setColorAt(i, c);
  });
  crown.castShadow = true; crown.receiveShadow = true; trunk.castShadow = false; S.scene.add(crown, trunk);
  return { crown, trunk, n };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE TOWN: houses (instanced bodies and roofs), a few blocks of flats, the hospital, the church; the fires (houses
// whose kitchens were left with breakfast on: their smoke from 7:46, a window glowing)
// ---------------------------------------------------------------------------------------------------------------------
function mgBuildTown(S) {
  const r = new RNG(1234), T = MG_V.town, H = [], fires = [];
  const busy = (x, z) => Math.hypot(x - MG_V.hospital[0], z - MG_V.hospital[2]) < 90 || Math.hypot(x - MG_V.church[0], z - MG_V.church[2]) < 45;
  for (let z = T.z[0] + 20; z < T.z[1]; z += 26) for (let x = T.x[0]; x < T.x[1]; x += 24) {
    const jx = x + r.range(-5, 5), jz = z + r.range(-4, 4);
    if (jx > mgRiverX(jz) - 78 || jx < mgHillW(jz) + 70 || mgOnStreet(jx, jz) || busy(jx, jz) || r.next() < 0.18) continue;
    const big = Math.hypot(jx + 900, jz - 1300) < 380 && r.next() < 0.25;
    H.push({ x: jx, z: jz, w: big ? r.range(16, 26) : r.range(8, 12), d: big ? r.range(12, 16) : r.range(7, 10), h: big ? r.range(13, 19) : r.range(5.5, 8), ry: r.range(-0.1, 0.1) + (r.next() < 0.5 ? 0 : Math.PI / 2), big });
  }
  const n = H.length, body = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ color: '#fff', roughness: 0.85 }), n);
  const roofG = (() => { const s = new THREE.Shape(); s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.lineTo(0.03, 0.42); s.lineTo(-0.03, 0.42); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false }); g.translate(0, 0, -0.5); g.computeVertexNormals(); return g; })();
  const roof = new THREE.InstancedMesh(roofG, new THREE.MeshStandardMaterial({ color: '#fff', roughness: 0.8 }), n);
  // windows: a plaster texture with window rows, drawn once (white walls, dark panes)
  const wtex = mgTex(mgCanvas(256, 256, (g) => { g.fillStyle = '#e9e3d6'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#2c3138'; for (let y = 28; y < 256; y += 64) for (let x = 20; x < 256; x += 58) { g.fillRect(x, y, 26, 30); } }));
  body.material.map = wtex;
  const o = new THREE.Object3D(), c = new THREE.Color(), wall = ['#efe6d2', '#e6d6b8', '#d9c9a6', '#f2efe6', '#d8c0a0', '#c9b9a0'], rc = ['#9a4a32', '#8a3e2c', '#5a5550', '#6a4034', '#7a3a28'];
  H.forEach((h, i) => {
    const y = mgGroundY(h.x, h.z) - 0.3;
    o.position.set(h.x, y, h.z); o.rotation.set(0, h.ry, 0); o.scale.set(h.w, h.h + 0.3, h.d); o.updateMatrix(); body.setMatrixAt(i, o.matrix);
    c.set(wall[r.int(0, wall.length - 1)]); body.setColorAt(i, c);
    o.position.set(h.x, y + h.h + 0.3 - 0.02, h.z); o.scale.set(h.w + 0.7, h.big ? 1.2 : h.d * 0.95, h.d + 0.5); o.rotation.set(0, h.ry, 0); o.updateMatrix(); roof.setMatrixAt(i, o.matrix);
    c.set(rc[r.int(0, rc.length - 1)]); roof.setColorAt(i, c);
  });
  body.castShadow = roof.castShadow = true; body.receiveShadow = roof.receiveShadow = true; S.scene.add(body, roof);
  // the fires: kitchens left with breakfast on. The first eight start between 7:46 and 7:51 in the houses the viaduct
  // looks at (so the smoke is there at 7:51); 22 more by 9:10. Each burns in a ground-floor window on the house's +z
  // face (local), the glow a plane 8 cm proud of the wall, the smoke leaving that window.
  const fr = new RNG(77), V0 = [-236, 17.8], VD = Math.atan2(1100 - 17.8, -900 + 236);
  const seen = H.filter((h) => { const dx = h.x - V0[0], dz = h.z - V0[1], d = Math.hypot(dx, dz), a = Math.atan2(dz, dx) - VD;
    return d > 380 && d < 1500 && Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.3 && !h.big; });
  seen.sort((a, b) => Math.hypot(a.x + 600, a.z - 600) - Math.hypot(b.x + 600, b.z - 600));
  // the first (the close-up's house) needs a clear patch 30 m in front of its kitchen wall for the camera
  const clear = (h) => { const cx = h.x + Math.sin(h.ry) * (h.d / 2 + 30) + Math.cos(h.ry) * 12, cz = h.z + Math.cos(h.ry) * (h.d / 2 + 30) - Math.sin(h.ry) * 12;
    return H.every((o) => o === h || Math.hypot(o.x - cx, o.z - cz) > Math.max(o.w, o.d) * 0.75 + 3); };
  const pick = [seen.find(clear) || seen[0]], used = new Set(pick);
  for (let k = 1; k < 8 && seen.length > 8; k++) { let h; do h = seen[fr.int(1, seen.length - 1)]; while (used.has(h)); used.add(h); pick.push(h); }
  for (let k = 8; k < 30; k++) { let h; do h = H[fr.int(0, n - 1)]; while (used.has(h) || h.big); used.add(h); pick.push(h); }
  pick.forEach((h, k) => {
    const nx = Math.sin(h.ry), nz = Math.cos(h.ry), tx = nz, tz = -nx, gy = mgGroundY(h.x, h.z), side = (fr.next() - 0.5) * h.w * 0.5;
    const wx = h.x + nx * (h.d / 2) + tx * side, wz = h.z + nz * (h.d / 2) + tz * side, wy = gy + 1.9;
    fires.push({ h, x: wx + nx * 0.6, y: wy + 0.4, z: wz + nz * 0.6, wx, wy, wz, nx, nz, s0: k === 0 ? 236 : k < 8 ? fr.range(260, 520) : fr.range(600, 4000), big: k === 0 ? 1.15 : fr.range(0.7, 1.35) });
  });
  const glowG = new THREE.PlaneGeometry(1.7, 1.25);
  for (const f of fires) {
    const g = new THREE.Mesh(glowG, new THREE.MeshBasicMaterial({ color: '#ff8a3a', transparent: true, opacity: 0, fog: true }));
    g.position.set(f.wx + f.nx * 0.08, f.wy, f.wz + f.nz * 0.08); g.rotation.y = f.h.ry; S.scene.add(g); f.glow = g;
  }
  // the hospital: a 4-storey L block with ribbon windows and a red cross, a helipad on the roof
  const B = mgBatch(), hm = mgStd('#e8e6e0', 0.7), hw = mgStd('#3d4a58', 0.25, 0.3), hr = mgStd('#b03028', 0.5);
  { const [x, , z] = MG_V.hospital, y = mgGroundY(x, z) - 0.5;
    B.box(84, 17.5, 26, hm, x, y + 8.75, z); B.box(26, 17.5, 60, hm, x - 29, y + 8.75, z + 43);
    for (let f = 0; f < 4; f++) { B.box(84.2, 1.5, 26.2, hw, x, y + 2.4 + f * 4.2, z); B.box(26.2, 1.5, 60.2, hw, x - 29, y + 2.4 + f * 4.2, z + 43.05); }
    B.box(6, 1.6, 0.3, hr, x + 30, y + 15.5, z - 13.2); B.box(1.6, 6, 0.3, hr, x + 30, y + 15.5, z - 13.2);
    B.cyl(9, 9, 0.6, mgStd('#4a4e52', 0.8), x + 20, y + 17.8, z, 24); }
  // the church: nave, tower, spire
  { const [x, , z] = MG_V.church, y = mgGroundY(x, z) - 0.5, st = mgStd('#d8cfbc', 0.85), sl = mgStd('#4a4e56', 0.6);
    B.box(34, 12, 13, st, x, y + 6, z); B.add(new THREE.CylinderGeometry(0.01, 10, 7, 4, 1).rotateY(Math.PI / 4).scale(1.75, 1, 0.66).translate(x, y + 15.4, z), sl);
    B.box(7, 26, 7, st, x - 19, y + 13, z); B.add(new THREE.ConeGeometry(5.2, 18, 4).rotateY(Math.PI / 4).translate(x - 19, y + 35, z), sl); }
  B.build(S.scene);
  return { H, fires, body, roof };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE SKY: a gradient dome (warm at the horizon by the sun, pale blue above), the sun's disc, clouds (soft puffs)
// ---------------------------------------------------------------------------------------------------------------------
function mgBuildSky(S) {
  const sky = mgGradSky(S.scene, '#6f9bc8', '#f2d6b0', '#9aa6a8', { r: 60000, sunDir: [0.8, 0.1, 0.5], sunGlow: '#ffb070', hw: 0.3 });
  const sunTex = mgDotTex(0.18), sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunTex, color: '#fff2d8', transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
  sun.scale.set(5200, 5200, 1); sun.renderOrder = -9; S.scene.add(sun);
  // the clouds: fair-weather cumulus at 1,600–2,400 m and a few higher streaks at 7,000 m (each a cluster of puffs)
  const r = new RNG(5150), C = [];
  for (let i = 0; i < 260; i++) { const x = r.range(-30000, 30000), z = r.range(-30000, 30000), hi = r.next() < 0.18; if (Math.hypot(x - 600, z - 1500) < 5000 && !hi) continue; C.push({ x, z, y: hi ? r.range(6800, 7600) : r.range(1600, 2400), s: hi ? r.range(350, 700) : r.range(260, 620), hi, n: hi ? 5 : r.int(5, 10), seed: i }); }
  const puffs = mgPuffs(S.scene, 2600, { soft: 1.3 });
  puffs.mesh.renderOrder = 4;
  return {
    sky, sun, puffs, clouds: C,
    update(s, camPos, o = {}) {
      const d = mgSunDir(s), el = mgSunAt(s)[1], warm = MathX.clamp(1 - (el - 4) / 16, 0, 1);
      sky.material.uniforms.sd.value.set(d[0], d[1], d[2]);
      sky.material.uniforms.a.value.set('#5d8fc4').lerp(new THREE.Color('#7aa2c8'), warm * 0.5);
      sky.material.uniforms.b.value.set('#d9e2e6').lerp(new THREE.Color('#f4d2a6'), warm);
      sky.material.uniforms.sc.value.set('#ffd9a8').multiplyScalar(0.6 + 0.6 * warm);
      sky.material.uniforms.k.value = o.k ?? 1;
      sky.position.copy(camPos);
      sun.position.set(camPos.x + d[0] * 50000, camPos.y + d[1] * 50000, camPos.z + d[2] * 50000);
      sun.material.color.set('#fff3dc').lerp(new THREE.Color('#ffc890'), warm);
      // clouds lit from the sun's side (warm), shaded underneath
      puffs.begin();
      const P = camPos, sunC = new THREE.Color('#fff4e4').lerp(new THREE.Color('#ffd0a0'), warm);
      for (const c of C) {
        const dx = c.x - P.x, dz = c.z - P.z, dist = Math.hypot(dx, dz, c.y - P.y); if (dist > 42000) continue;
        for (let k = 0; k < c.n; k++) {
          const a = mgR(c.seed * 13 + k, 3) * 6.283, rr = c.s * 0.75 * Math.sqrt(mgR(c.seed * 13 + k, 4)), sz = c.s * (0.45 + 0.4 * mgR(c.seed * 13 + k, 5)) * (c.hi ? 1.1 : 1);
          const x = c.x + Math.cos(a) * rr + (s * 3), z = c.z + Math.sin(a) * rr * (c.hi ? 0.25 : 0.8), y = c.y + (c.hi ? 0 : sz * 0.35 * mgR(c.seed * 13 + k, 6));
          const lit = 0.78 + 0.22 * ((x - c.x) * d[0] + (z - c.z) * d[2]) / Math.max(1, rr) * 0.5, shade = c.hi ? 1 : 0.86 + 0.14 * (y - c.y) / Math.max(1, sz * 0.35);
          const near = MathX.clamp((dist - sz) / (sz * 1.5), 0, 1);
          puffs.add(x, y, z, sz, (c.hi ? 0.32 : 0.72) * near, sunC.r * lit * shade, sunC.g * lit * shade, sunC.b * lit * shade * 1.02);
        }
      }
      puffs.end();
    },
  };
}
