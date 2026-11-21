/* =====================================================================
   ISLAND — Harrow Rock: the granite (a heightfield, 1 m cells, from the sea floor 25 m down to the knoll at +15 under
   the tower), its bands (rockweed under the sea, a white barnacle line, tar-black lichen up to ~1.6 m, the orange
   lichen above it up to ~3.6 m, where the sea never reaches; grey granite and grass above), the path, the landing
   (concrete, steps down its south side, the ring bolt, the tide board) and your boat on its short line.
     ocTerrH(x, z)                       the rock's height (m above high water at 6:42 PM)
     ocIsland(scene) → { terr, mat, set(s, t) }   terr = { tex, box } for the sea's shader (depth: foam, clear water)
     ocBoat(scene) → { g, set(s, t), state(s) }
   ===================================================================== */

// the heightfield's box: x −150 … 130, z −130 … 130 (1 m cells)
const OC_TB = { x0: -150, z0: -130, nx: 281, nz: 261 };
// 2-D value noise in [0, 1) and its fbm
function ocN2(x, z, s = 0) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz), o = s * 7349;
  const a = hash2(ix + o, iz), b = hash2(ix + 1 + o, iz), c = hash2(ix + o, iz + 1), d = hash2(ix + 1 + o, iz + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function ocF2(x, z, s = 0, oct = 3) { let v = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < oct; i++) { v += a * ocN2(x * f, z * f, s + i * 31); n += a; a *= 0.5; f *= 2.03; } return v / n; }
// piecewise-linear keys [[x, y], …]
const ocPw = (K, x) => { if (x <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (x <= K[i][0]) { const u = (x - K[i - 1][0]) / (K[i][0] - K[i - 1][0]); return K[i - 1][1] + (K[i][1] - K[i - 1][1]) * u; } return K[K.length - 1][1]; };
// the island's top along x (west → east): it climbs from the landing to the knoll, then falls to the east cliffs
const OC_TOPK = [[-78, 3], [-62, 5.5], [-50, 8.5], [-38, 11.5], [-28, 12.7], [-14, 13.4], [-6, 14.6], [0, 15.4], [8, 15.0], [14, 12.6], [20, 10.8], [26, 10.2], [34, 9]];
// the path (x, z): from the landing's east end up past the house, to the tower's door; a branch to the fog signal
const OC_PATH = [[-65.2, 5.8], [-58, 7.0], [-49, 8.6], [-39, 10.0], [-29, 10.7], [-19, 10.6], [-12.6, 8.0], [-11.2, 4.4], [-8.0, 1.6], [-4.6, 0.25]];
const OC_PATH2 = [[-11.2, 4.4], [-6, 6.8], [2, 8.2], [10, 5.4], [15.5, -2.0], [18.4, -7.6]];
const OC_PATH3 = [[-12.6, 4.25], [-14.9, 4.25]];
function ocSegD(x, z, P) { let d = 1e9; for (let i = 1; i < P.length; i++) { const [ax, az] = P[i - 1], [bx, bz] = P[i], vx = bx - ax, vz = bz - az, u = MathX.clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz)); d = Math.min(d, Math.hypot(x - ax - vx * u, z - az - vz * u)); } return d; }
const ocBoxM = (x, z, x0, x1, z0, z1, soft) => { const dx = Math.max(x0 - x, 0, x - x1), dz = Math.max(z0 - z, 0, z - z1); return 1 - MathX.smooth(Math.hypot(dx, dz), 0, soft); };

function ocTerrRaw(x, z, rough = 1) {
  const cx = -24, dx = x - cx, ax = dx < 0 ? 47 : 56, az = z < 0 ? 33 : 36;
  let r = Math.hypot(dx / ax, z / az);
  r += 0.16 * (ocF2(x * 0.045 + 3, z * 0.045, 3, 3) - 0.5) + 0.05 * (ocN2(x * 0.2, z * 0.2, 5) - 0.5);
  const edge = (1 - r) * 34;
  const c = 0.42 + 1.5 * MathX.smooth(x, 2, 20) + 0.45 * MathX.smooth(Math.abs(z), 18, 34);
  let h = edge > 0 ? Math.min(ocPw(OC_TOPK, x), c * edge - 1.0) : -1.0 + edge * (0.5 + 0.45 * MathX.smooth(x, -5, 20));
  h = Math.max(h, -25 + 3 * ocN2(x * 0.03, z * 0.03, 9));
  // granite: rounded ledges, boulders, cracks (gentler on the grassy top)
  const top = MathX.smooth(h, 7, 12), ledge = Math.round((ocF2(x * 0.07, z * 0.07, 21, 2) - 0.5) * 6) / 6;
  h += rough * ((ocF2(x * 0.11, z * 0.11, 11, 3) - 0.5) * 2.2 * (1 - 0.75 * top) + (ocN2(x * 0.45, z * 0.45, 13) - 0.5) * 0.55 * (1 - 0.6 * top) + ledge * 0.6 * (1 - top));
  return h;
}
function ocTerrH(x, z) {
  const dp = Math.min(ocSegD(x, z, OC_PATH), ocSegD(x, z, OC_PATH2)), onPath = 1 - MathX.smooth(dp, 0.8, 3.0);
  let h = ocTerrRaw(x, z, 1 - 0.85 * onPath);
  // the tower's knoll, the house's pad, the fog signal's pad
  h = ocLerp(h, 15.0, 1 - MathX.smooth(Math.hypot(x, z), 5.6, 10.5));
  h = ocLerp(h, 12.75, ocBoxM(x, z, -26.6, -13.4, -0.6, 9.1, 3.2));
  h = ocLerp(h, 10.3, ocBoxM(x, z, 18.4, 25.6, -11.8, -6.2, 2.2));
  // the yard between the house and the tower (a smooth rise)
  h = ocLerp(h, ocLerp(12.75, 15.0, MathX.smooth(x, -13.4, -5.6)), ocBoxM(x, z, -13.4, -5.6, -3, 10, 2.5) * 0.85);
  // the landing: a rock shelf at its foot (where the boat lies), the ground at its east end up to its deck
  h = ocLerp(h, -1.9, ocBoxM(x, z, -79.5, -74.2, -1.5, 10.5, 2.5));
  h = ocLerp(h, Math.min(h, -1.6), ocBoxM(x, z, -74, -65, 2.5, 9, 0.6));
  h = ocLerp(h, 1.15, ocBoxM(x, z, -65, -62.5, 3.2, 8.6, 2.0) * (1 - ocBoxM(x, z, -74, -65, 2.5, 9, 0.01)));
  return h;
}

// the rock's colour, by height above the datum (the bands stay where they grew; the sea climbs over them), as GLSL
const OC_ROCK_GLSL = /* glsl */`
  uniform float uLevel; varying vec3 vWp; varying vec3 vWn;
  float rh3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float rn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(rh3(i), rh3(i + vec3(1, 0, 0)), f.x), mix(rh3(i + vec3(0, 1, 0)), rh3(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(rh3(i + vec3(0, 0, 1)), rh3(i + vec3(1, 0, 1)), f.x), mix(rh3(i + vec3(0, 1, 1)), rh3(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
  float rf3(vec3 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * rn3(p); p = p * 2.03 + 1.7; a *= 0.5; } return v / 0.9375; }
  vec3 rockCol(vec3 P, vec3 N, vec3 base, float concrete, out float wet, out float grassK){
    float y = P.y, n1 = rf3(P * 0.35), n2 = rf3(P * 2.2), n3 = rn3(P * 11.0);
    vec3 g = mix(base, base * vec3(1.22, 1.12, 1.08), n1) * (0.8 + 0.32 * n2) * (0.9 + 0.2 * n3);
    // grey-green crusts of lichen on the high rock
    g = mix(g, vec3(0.56, 0.58, 0.5), smoothstep(0.6, 0.7, rf3(P * 1.3 + 4.0)) * 0.45 * (1.0 - concrete) * smoothstep(3.0, 4.5, y));
    vec3 col = g; float yb = y + (n1 - 0.5) * 0.55;
    // the orange lichen: blotches from ~1.6 m up to ~3.6 m (salt spray, never the sea itself); a few spots higher
    float orBand = smoothstep(1.35, 1.9, yb) * (1.0 - smoothstep(3.25, 3.7, yb + (n2 - 0.5) * 0.35));
    float blot = smoothstep(0.42, 0.55, rf3(P * 4.2 + 9.0)) * (0.6 + 0.4 * smoothstep(0.3, 0.7, rn3(P * 23.0)));
    col = mix(col, vec3(0.88, 0.4, 0.06) * (0.74 + 0.32 * n3), orBand * blot * 0.92 * (1.0 - 0.6 * concrete));
    col = mix(col, vec3(0.84, 0.58, 0.14), smoothstep(0.74, 0.8, rf3(P * 7.0 + 2.0)) * smoothstep(3.4, 4.0, yb) * (1.0 - smoothstep(5.0, 6.0, yb)) * 0.7 * (1.0 - concrete));
    // the black lichen: a tar-black band from high water up to ~1.6 m
    float bk = smoothstep(1.75, 1.2, yb) * smoothstep(-0.55, -0.1, yb);
    col = mix(col, vec3(0.05, 0.05, 0.045) * (0.8 + 0.5 * n2), bk * 0.93);
    // barnacles just under high water, then the brown-olive rockweed below
    col = mix(col, vec3(0.64, 0.62, 0.56) * (0.65 + 0.5 * n3), smoothstep(-0.05, -0.3, yb) * smoothstep(-1.3, -0.8, yb) * 0.75 * smoothstep(0.35, 0.6, n3));
    col = mix(col, vec3(0.19, 0.15, 0.055) * (0.7 + 0.5 * n2), smoothstep(-0.45, -0.95, yb) * 0.95);
    // grass on the top: where it is gentle and high
    grassK = smoothstep(0.8, 0.92, N.y) * smoothstep(4.8, 6.8, yb + n1 * 1.6) * (1.0 - concrete);
    vec3 grass = mix(vec3(0.3, 0.33, 0.14), vec3(0.52, 0.47, 0.24), rf3(P * 0.6 + 2.0)) * (0.78 + 0.36 * n3);
    col = mix(col, grass, grassK);
    // wet where the swell washes it (just over the sea's level)
    wet = smoothstep(uLevel + 0.95, uLevel + 0.2, y + (n2 - 0.5) * 0.35) * (1.0 - grassK * 0.5);
    col *= mix(1.0, 0.5, wet);
    return col;
  }`;
// a standard material with the rock's bands (base colour; concrete 1 = the landing: fewer lichens)
function ocRockMat(base, concrete = 0, rough = 0.92) {
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: rough, metalness: 0 });
  const U = { uLevel: { value: 0 } }; m.userData.U = U;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uLevel = U.uLevel;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp; varying vec3 vWn;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz; vWn = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + OC_ROCK_GLSL)
      .replace('#include <color_fragment>', `#include <color_fragment>\nfloat ocWet, ocGrass; diffuseColor.rgb *= rockCol(vWp, normalize(vWn), vec3(${base.map((v) => v.toFixed(3)).join(',')}), ${concrete.toFixed(2)}, ocWet, ocGrass);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.22, ocWet * (1.0 - ocGrass));');
  };
  m.customProgramCacheKey = () => 'ocRock' + base.join() + concrete;
  return m;
}

function ocIsland(scene) {
  const B = OC_TB, W = B.nx, D = B.nz;
  // ---- the heightfield (shared with the sea's shader as a half-float texture)
  const H = new Float32Array(W * D);
  for (let j = 0; j < D; j++) for (let i = 0; i < W; i++) H[j * W + i] = ocTerrH(B.x0 + i, B.z0 + j);
  const half = new Uint16Array(W * D); for (let k = 0; k < W * D; k++) half[k] = THREE.DataUtils.toHalfFloat(H[k]);
  const tex = new THREE.DataTexture(half, W, D, THREE.RedFormat, THREE.HalfFloatType);
  tex.minFilter = tex.magFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true;
  const terr = { tex, box: [B.x0 - 0.5, B.z0 - 0.5, 1 / W, 1 / D], H };
  // ---- the mesh: the island in 1 m cells (the sea floor round it in 4 m cells, out to the box's edge)
  const g = new THREE.PlaneGeometry(W - 1, D - 1, W - 1, D - 1); g.rotateX(-Math.PI / 2); g.translate(B.x0 + (W - 1) / 2, 0, B.z0 + (D - 1) / 2);
  const p = g.attributes.position;
  for (let k = 0; k < p.count; k++) { const i = Math.round(p.getX(k) - B.x0), j = Math.round(p.getZ(k) - B.z0); p.setY(k, H[j * W + i]); }
  g.computeVertexNormals();
  const mat = ocRockMat([0.44, 0.405, 0.385]);
  const mesh = ocMesh(g, mat, 0, 0, 0, scene); mesh.name = 'rock';
  // (out past the box: the sea floor, a flat disc 25 m down)
  const floor = ocMesh(new THREE.RingGeometry(120, 3000, 48, 1).rotateX(-Math.PI / 2), ocStd('#1d2a26', 1), -10, -25.5, 0, scene); floor.receiveShadow = false; floor.castShadow = false;
  const hAt = (x, z) => { const fx = MathX.clamp(x - B.x0, 0, W - 1.001), fz = MathX.clamp(z - B.z0, 0, D - 1.001), i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j;
    return H[j * W + i] * (1 - u) * (1 - v) + H[j * W + i + 1] * u * (1 - v) + H[(j + 1) * W + i] * (1 - u) * v + H[(j + 1) * W + i + 1] * u * v; };
  // ---- the path: a worn strip of gravel and bare earth, laid on the ground (6 cm over it)
  const pathM = new THREE.MeshStandardMaterial({ map: ocTex(ocCanvas(256, 256, (c, w, h) => { const r = new RNG(5); c.fillStyle = '#7a6e5c'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { const k = r.range(-1, 1); c.fillStyle = `rgba(${k > 0 ? '190,180,160' : '50,44,36'},${r.range(0.15, 0.4)})`; c.beginPath(); c.arc(r.range(0, w), r.range(0, h), r.range(0.8, 2.6), 0, 6.3); c.fill(); }
    const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(70,80,40,0.85)'); gr.addColorStop(0.18, 'rgba(70,80,40,0)'); gr.addColorStop(0.82, 'rgba(70,80,40,0)'); gr.addColorStop(1, 'rgba(70,80,40,0.85)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); })),
    roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const strip = (P, w) => {
    const pts = []; for (let i = 1; i < P.length; i++) { const [ax, az] = P[i - 1], [bx, bz] = P[i], n = Math.max(2, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.7)); for (let k = i > 1 ? 1 : 0; k <= n; k++) pts.push([ax + (bx - ax) * k / n, az + (bz - az) * k / n]); }
    const pos = [], uv = [], idx = []; let L = 0;
    pts.forEach((q, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], tx = b[0] - a[0], tz = b[1] - a[1], l = Math.hypot(tx, tz) || 1, nx = -tz / l, nz = tx / l;
      if (i) L += Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]);
      for (const sd of [-1, 1]) { const x = q[0] + nx * w / 2 * sd, z = q[1] + nz * w / 2 * sd; pos.push(x, hAt(x, z) + 0.06, z); uv.push(sd > 0 ? 1 : 0, L / w); } });
    for (let i = 0; i < pts.length - 1; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); sg.setIndex(idx); sg.computeVertexNormals();
    const m = ocMesh(sg, pathM, 0, 0, 0, scene); m.castShadow = false; return m;
  };
  strip(OC_PATH, 1.15); strip(OC_PATH2, 0.95); strip(OC_PATH3, 1.1);
  // ---- the landing: a concrete block, steps down its south side to the sea, the ring bolt, the tide board on its post
  const L = OC_F.landing, conc = ocRockMat([0.5, 0.49, 0.47], 1, 0.9);
  const lw = L.x1 - L.x0, ld = L.z1 - L.z0;
  ocBox(lw, L.top - L.foot - 0.3, ld, conc, (L.x0 + L.x1) / 2, (L.top + L.foot - 0.3) / 2, (L.z0 + L.z1) / 2, scene);
  ocBox(lw + 0.04, 0.3, ld + 0.04, conc, (L.x0 + L.x1) / 2, L.top - 0.15, (L.z0 + L.z1) / 2, scene);           // (the deck slab, a lip proud of the face)
  const stepX = (k) => (k >= 8 ? L.x0 + 0.3 : L.x1 - 1.2 - 0.62 * k);
  for (let k = 0; k < 8; k++) { const y = L.top - 0.35 * (k + 1), xa = stepX(k + 1), xb = stepX(k), y0 = L.foot - 0.4; ocBox(xb - xa, y - y0, 1.05, conc, (xa + xb) / 2, (y + y0) / 2, L.z1 + 0.525, scene); }
  const iron = ocStd('#3b2a22', 0.65, 0.55), R = OC_F.ring;
  const ring = ocMesh(new THREE.TorusGeometry(0.075, 0.013, 8, 20), iron, R[0] - 0.06, R[1], R[2], scene); ring.rotation.y = Math.PI / 2;
  ocMesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8).rotateZ(Math.PI / 2), iron, R[0] + 0.02, R[1] + 0.075, R[2], scene);
  // bollards on the deck
  for (const z of [3.3, 8.2]) ocCyl(0.13, 0.15, 0.42, ocStd('#1d1f22', 0.6, 0.5), L.x0 + 0.5, L.top + 0.21, z, scene, 14);
  // the tide board: metres above chart datum (0 = the lowest tides); high water tonight was 3.4 on it
  const board = ocCanvas(128, 1792, (c, w, h) => { c.fillStyle = '#f2f0ea'; c.fillRect(0, 0, w, h); const px = h / 7; c.fillStyle = '#111';
    for (let d = 0; d <= 70; d++) { const y = h - d * px / 10, big = d % 10 === 0, mid = d % 5 === 0; c.fillRect(big ? 0 : mid ? 0 : 0, y - (big ? 6 : 3), big ? w * 0.62 : mid ? w * 0.4 : w * 0.24, big ? 6 : 3); }
    c.font = 'bold 120px Arial'; c.textAlign = 'right'; for (let m = 1; m < 7; m++) c.fillText(String(m), w - 6, h - m * px + 50);
    c.fillStyle = '#c4232b'; c.fillRect(w - 10, 0, 10, h); });
  const bm = new THREE.MeshStandardMaterial({ map: ocTex(board, { repeat: false }), roughness: 0.6 });
  // (on the landing's north face, its scale facing north, 5 cm proud of the face; its post beside it)
  const wM0 = ocStd('#e8e6e0', 0.6), tb = ocMesh(new THREE.BoxGeometry(0.3, 7.0, 0.03), [wM0, wM0, wM0, wM0, wM0, bm], OC_F.tideBoard[0], 0.1, OC_F.tideBoard[1], scene);
  ocMesh(new THREE.BoxGeometry(0.08, 7.8, 0.08), ocStd('#2d3034', 0.6, 0.6), OC_F.tideBoard[0] + 0.21, 0.0, OC_F.tideBoard[1] - 0.02, scene);
  const TIDE0 = 3.4;                              // the board's reading at the datum (high water, 6:42 PM)
  // ---- a few loose boulders on the shore (one by the path, its face in the lichen bands: the close-up's rock)
  const boulders = [[-55.2, 13.6, 1.7, 1.15, 1], [-56, -9.5, 1.3, 0.8, 2], [-44, 21, 2.0, 1.2, 3], [-8, -27, 1.6, 1.1, 4], [12, 24, 1.8, 1.0, 5], [-70, -6, 1.2, 0.7, 6]];
  const bl = boulders.map(([x, z, r, sy, sd]) => { const geo = new THREE.SphereGeometry(r, 40, 28), q = geo.attributes.position, rr = new RNG(sd * 31 + 7);
    const k = [rr.range(0, 9), rr.range(0, 9), rr.range(0, 9)];
    for (let i = 0; i < q.count; i++) { const a = q.getX(i), b = q.getY(i), c = q.getZ(i), f = 1 + 0.12 * Math.sin(a * 2.1 + k[0]) * Math.sin(b * 1.9 + k[1]) + 0.07 * Math.sin(c * 3.3 + k[2]) + 0.03 * Math.sin(a * 7 + b * 5); q.setXYZ(i, a * f, b * f * sy, c * f); }
    geo.computeVertexNormals(); return ocMesh(geo, mat, x, hAt(x, z) + r * sy * 0.35, z, scene); });
  return {
    terr, mat, mesh, hAt, TIDE0, boulders: bl, boulderDims: boulders, lichenRock: boulders[0],
    set(s) { const h = OCP.h(s); mat.userData.U.uLevel.value = h; conc.userData.U.uLevel.value = h; },
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// YOUR BOAT — a 5.4 m aluminium skiff with an outboard, moored along the landing's west face, bow north, on a 1.15 m
// line from its bow eye to the ring. It floats free until the line is taut (the sea 0.56 m up); then the line holds
// the bow down while the stern rises; the sea pours in over the bow (0.84 m) and it fills; it goes under, and hangs
// there on its line, the stern on the rock shelf below.
// ---------------------------------------------------------------------------------------------------------------------
function ocBoat(scene) {
  const Bt = OC_F.boat, R = OC_F.ring, g = new THREE.Group(); scene.add(g);
  const hullM = ocStd('#d9dcdf', 0.42, 0.55), inM = ocStd('#9ea4a8', 0.55, 0.5), stripeM = ocStd('#1f4f86', 0.5, 0.3), woodM = ocStd('#8a6a46', 0.8);
  // the hull: sections from the stern (u = 0, a transom) to the bow (u = 1, a point); x across, y up, z along (bow −z)
  const NS = 22, NP = 9, pos = [], ipos = [], idx = [];
  const sec = (u) => { const b = Bt.B / 2 * (u < 0.62 ? 0.92 + 0.08 * Math.sin(u / 0.62 * Math.PI / 2) : Math.cos((u - 0.62) / 0.38 * Math.PI / 2) ** 0.9), sh = 0.62 + 0.18 * u * u, kd = -0.14 + 0.05 * u * u, ch = 0.12 + 0.12 * u;
    return [[-b, sh], [-b * 0.97, ch + 0.25], [-b * 0.82, ch], [-b * 0.4, kd + 0.02], [0, kd], [b * 0.4, kd + 0.02], [b * 0.82, ch], [b * 0.97, ch + 0.25], [b, sh]]; };
  for (let i = 0; i <= NS; i++) { const u = i / NS, z = Bt.L / 2 - u * Bt.L, S = sec(Math.min(u, 0.995)); for (const [x, y] of S) { pos.push(x, y, z); ipos.push(x * 0.96, y + (y > 0.5 ? 0 : 0.035), z + (u < 0.02 ? -0.03 : 0)); } }
  for (let i = 0; i < NS; i++) for (let k = 0; k < NP - 1; k++) { const a = i * NP + k, b = a + 1, c = a + NP, d = c + 1; idx.push(a, b, c, b, d, c); }
  const mk = (P, flip, m) => { const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); gg.setIndex(flip ? idx.map((v, i) => idx[i - (i % 3) + [0, 2, 1][i % 3]]) : idx); gg.computeVertexNormals(); return ocMesh(gg, m, 0, 0, 0, g); };
  mk(pos, true, hullM); mk(ipos, false, inM);
  // transom, gunwale rails, the stripe, thwarts, the outboard, the bow eye
  ocBox(Bt.B * 0.92, 0.7, 0.04, hullM, 0, 0.27, Bt.L / 2, g);
  for (const sd of [-1, 1]) { const rail = new THREE.CatmullRomCurve3(Array.from({ length: 12 }, (_, i) => { const u = i / 11 * 0.995, S = sec(u); return new THREE.Vector3(S[8][0] * sd, S[8][1] + 0.015, Bt.L / 2 - u * Bt.L); }));
    ocMesh(new THREE.TubeGeometry(rail, 40, 0.025, 6), stripeM, 0, 0, 0, g); }
  for (const z of [-0.6, 0.6, 1.7]) ocBox(Bt.B * 0.86, 0.04, 0.3, woodM, 0, 0.42, z, g);
  const ob = new THREE.Group(); g.add(ob); ob.position.set(0, 0.55, Bt.L / 2 + 0.12);
  ocBox(0.34, 0.42, 0.48, ocStd('#202326', 0.45, 0.3), 0, 0.2, 0.12, ob); ocBox(0.12, 0.9, 0.16, ocStd('#2a2d30', 0.5, 0.3), 0, -0.4, 0.1, ob); ocBox(0.03, 0.12, 0.3, ocStd('#c9c9c4', 0.4, 0.6), 0, -0.85, 0.14, ob);
  ocMesh(new THREE.TorusGeometry(0.035, 0.009, 6, 12), ocStd('#8a8f94', 0.35, 0.9), 0, sec(1)[8][1] - 0.1, -Bt.L / 2 + 0.06, g);
  // the water in it (a sheet at its own level inside, while it fills)
  const wIn = ocMesh(new THREE.PlaneGeometry(Bt.B * 0.82, Bt.L * 0.84).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#2a4a48', roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.88 }), 0, 0, 0.15, g);
  wIn.castShadow = false;
  // the line: bow eye → ring (a rope, drawn as a thin tube re-laid every frame)
  const ropeM = ocStd('#6e5a34', 0.85); const rope = ocMesh(new THREE.CylinderGeometry(0.024, 0.024, 1, 8).translate(0, 0.5, 0), ropeM, 0, 0, 0, scene); rope.castShadow = false;
  const P = OCP, E = OCE, dx = Math.hypot(Bt.x - R[0], Bt.bowZ - R[2]);
  const fitH = R[1] + Math.sqrt(Math.max(0, Bt.rope * Bt.rope - dx * dx));            // the height the line holds the bow eye down to
  const hang = R[1] - Math.sqrt(Math.max(0.01, Bt.rope * Bt.rope - 0.2));              // (sunk: the eye hangs under the ring)
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _e = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), EYE = new THREE.Vector3(0, sec(1)[8][1] - 0.1, -Bt.L / 2 + 0.06);
  // the boat's state at story time s: bow eye height, stern height, roll, fill 0…1
  const state = (s, t) => {
    const h = P.h(s), swB = ocSwellY(Bt.x, Bt.bowZ, t) * 0.5, swS = ocSwellY(Bt.x, Bt.bowZ + Bt.L, t) * 0.5;
    const freeBow = h + swB + Bt.free, freeStern = h + swS + Bt.free - 0.08;
    let bow = Math.min(freeBow, fitH), stern = freeStern, fill = 0;
    if (s > E.flood) {
      const k = MathX.clamp((s - E.flood) / (E.sunk - E.flood), 0, 1), k2 = MathX.clamp((s - E.sunk) / 9, 0, 1);
      fill = MathX.clamp(k * 1.25, 0, 1);
      bow = ocLerp(fitH, hang, MathX.smooth(k, 0.25, 1.0));
      stern = k2 > 0 ? ocLerp(freeStern - 0.85, P.boatRestY + 0.55, Ease.inOutSine(k2)) : freeStern - 0.85 * Math.pow(k, 1.6);
    }
    return { bow, stern, fill, h, sw: swB, roll: s > E.taut ? 0.02 : 0.05 * Math.sin(t * 0.8) };
  };
  return {
    g, state,
    set(s, t) {
      const q = state(s, t), L = Bt.L - 0.3;
      const pitch = Math.asin(MathX.clamp((q.stern - q.bow) / L, -0.95, 0.95));
      // (the bow eye at the bow; the boat pivots about it)
      g.rotation.set(-pitch, 0, q.roll, 'YXZ'); g.position.set(0, 0, 0); g.updateMatrixWorld(true);
      const eye = _e.copy(EYE).applyMatrix4(g.matrixWorld);
      g.position.set(Bt.x - eye.x, q.bow - eye.y, Bt.bowZ - eye.z); g.updateMatrixWorld(true);
      // the water inside: it comes in over the bow, then fills the boat to its gunwales
      wIn.visible = q.fill > 0.01 && q.fill < 0.999 || (s > OCE.flood && s < OCE.sunk);
      wIn.position.y = 0.0 + 0.62 * q.fill; wIn.scale.set(0.6 + 0.4 * q.fill, 1, 0.4 + 0.6 * q.fill); wIn.position.z = -Bt.L * 0.3 * (1 - q.fill);
      // the line
      eye.copy(EYE).applyMatrix4(g.matrixWorld);
      _a.set(R[0] - 0.06, R[1] - 0.06, R[2]); _b.subVectors(eye, _a); const len = _b.length();
      rope.position.copy(_a); rope.scale.set(1, len, 1); rope.quaternion.setFromUnitVectors(_up, _b.normalize());
    },
  };
}
