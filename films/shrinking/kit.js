/* =====================================================================
   KIT — small helpers the worlds share: keyframed values, a loft (tubes of varying cross-section along a path),
   canvas textures (wood, fur, cell plates), materials and shader snippets. All seeded, all pure functions of time.
   ===================================================================== */

// keyframes [[t, a, b, c…], …] → interpolated array at t (smooth in-out between neighbours; holds at the ends)
function shKey(K, t, ease = Ease.inOutSine) {
  if (t <= K[0][0]) return K[0].slice(1);
  if (t >= K[K.length - 1][0]) return K[K.length - 1].slice(1);
  let i = 0; while (K[i + 1][0] < t) i++;
  const a = K[i], b = K[i + 1], u = ease((t - a[0]) / (b[0] - a[0]));
  const out = [];
  for (let k = 1; k < a.length; k++) out.push(a[k] + (b[k] - a[k]) * u);
  return out;
}
// Catmull-Rom through keyframes (smooth velocity through the middle keys) → array at t
function shSpline(K, t) {
  if (t <= K[0][0]) return K[0].slice(1);
  if (t >= K[K.length - 1][0]) return K[K.length - 1].slice(1);
  let i = 0; while (K[i + 1][0] < t) i++;
  const p0 = K[Math.max(0, i - 1)], p1 = K[i], p2 = K[i + 1], p3 = K[Math.min(K.length - 1, i + 2)];
  const u = (t - p1[0]) / (p2[0] - p1[0]), u2 = u * u, u3 = u2 * u;
  // non-uniform tangents scaled by the key spacing
  const d1 = p2[0] - p1[0], m1s = d1 / Math.max(1e-6, p2[0] - p0[0]), m2s = d1 / Math.max(1e-6, p3[0] - p1[0]);
  const out = [];
  for (let k = 1; k < p1.length; k++) {
    const m1 = (p2[k] - p0[k]) * m1s, m2 = (p3[k] - p1[k]) * m2s;
    out.push((2 * u3 - 3 * u2 + 1) * p1[k] + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2[k] + (u3 - u2) * m2);
  }
  return out;
}

// a loft: rings [[x, y, z, rx, ry], …] along a path (each ring an ellipse perpendicular to the path); returns a geometry
// with uv (u around, v along). caps rounded with `cap` (fraction of the end radius)
function shLoft(rings, sides = 12, cap = 0.6) {
  const P = rings.map((r) => new THREE.Vector3(r[0], r[1], r[2])), n = P.length;
  const pos = [], uv = [], idx = [];
  const up0 = new THREE.Vector3(0, 1, 0);
  const frames = P.map((p, i) => {
    const tg = new THREE.Vector3().subVectors(P[Math.min(n - 1, i + 1)], P[Math.max(0, i - 1)]).normalize();
    let up = Math.abs(tg.dot(up0)) > 0.95 ? new THREE.Vector3(0, 0, 1) : up0.clone();
    const sd = new THREE.Vector3().crossVectors(tg, up).normalize();
    up = new THREE.Vector3().crossVectors(sd, tg).normalize();
    return { tg, sd, up };
  });
  let len = 0; const L = [0];
  for (let i = 1; i < n; i++) { len += P[i].distanceTo(P[i - 1]); L.push(len); }
  for (let i = 0; i < n; i++) {
    const [, , , rx, ry] = rings[i], F = frames[i];
    for (let k = 0; k <= sides; k++) {
      const a = (k / sides) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      pos.push(P[i].x + F.sd.x * c * rx + F.up.x * s * ry, P[i].y + F.sd.y * c * rx + F.up.y * s * ry, P[i].z + F.sd.z * c * rx + F.up.z * s * ry);
      uv.push(k / sides, L[i] / Math.max(1e-9, len));
    }
  }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < sides; k++) {
    const a = i * (sides + 1) + k, b = a + 1, c = a + sides + 2, d = a + sides + 1;
    idx.push(a, d, b, b, d, c);
  }
  const capAt = (i, dir) => {
    const F = frames[i], [, , , rx, ry] = rings[i], c = pos.length / 3;
    const tip = P[i].clone().addScaledVector(F.tg, dir * Math.min(rx, ry) * cap);
    pos.push(tip.x, tip.y, tip.z); uv.push(0.5, i ? 1 : 0);
    for (let k = 0; k < sides; k++) { const a = i * (sides + 1) + k; if (dir > 0) idx.push(a, a + 1, c); else idx.push(a + 1, a, c); }
  };
  if (cap > 0) { capAt(n - 1, 1); capAt(0, -1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// a rounded box (radius r on the vertical edges, b on the top/bottom edges) — phones, furniture
function shRoundBox(w, h, d, r, b = 0, seg = 4) {
  const s = new THREE.Shape(), x = w / 2 - r, z = d / 2 - r;
  s.moveTo(-x, -d / 2); s.lineTo(x, -d / 2); s.absarc(x, -z, r, -Math.PI / 2, 0, false); s.lineTo(w / 2, z);
  s.absarc(x, z, r, 0, Math.PI / 2, false); s.lineTo(-x, d / 2); s.absarc(-x, z, r, Math.PI / 2, Math.PI, false);
  s.lineTo(-w / 2, -z); s.absarc(-x, -z, r, Math.PI, Math.PI * 1.5, false);
  const g = new THREE.ExtrudeGeometry(s, { depth: h - 2 * b, bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelSegments: seg, curveSegments: seg * 2 });
  g.rotateX(-Math.PI / 2); g.translate(0, b, 0);
  g.computeVertexNormals();
  return g;
}

// ---- canvas textures
function shCanvas(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; }
function shTex(c, o = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = o.srgb === false ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  if (o.repeat !== false) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = o.aniso || 4;
  if (o.nearest) { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; }
  return t;
}
// wood grain for one plank texture (vertical grain along v), warm oak
function shWoodCanvas(seed, w = 512, h = 2048, base = [150, 104, 66]) {
  const r = new RNG(seed);
  return shCanvas(w, h, (g) => {
    const img = g.createImageData(w, h), d = img.data;
    const ph = r.range(0, 100), wob = r.range(0.6, 1.4), knotY = r.range(0.2, 0.8) * h, knotX = r.range(0.2, 0.8) * w;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = x - knotX, dy = (y - knotY) * 0.25, kd = Math.sqrt(dx * dx + dy * dy);
      const warp = 18 * Math.sin(y * 0.004 * wob + ph) + 6 * Math.sin(y * 0.013 + ph * 2) + 40 * Math.exp(-kd / 50);
      const ring = Math.sin((x + warp) * 0.11 + 0.8 * Math.sin(y * 0.002 + ph)) * 0.5 + 0.5;
      const fine = Math.sin((x + warp) * 0.9 + y * 0.01) * 0.5 + 0.5;
      const v = 0.82 + 0.16 * Math.pow(ring, 3) - 0.06 * fine + 0.05 * (hash2(x >> 1, y >> 3) / 4294967296 - 0.5);
      const i = (y * w + x) * 4;
      d[i] = base[0] * v; d[i + 1] = base[1] * v; d[i + 2] = base[2] * v; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
}
// fur: soft tabby stripes across u, fine hair streaks along v
function shFurCanvas(seed, base, dark, belly) {
  const r = new RNG(seed);
  return shCanvas(512, 512, (g, w, h) => {
    const img = g.createImageData(w, h), d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = y / h, u = x / w;
      const stripe = Math.pow(0.5 + 0.5 * Math.sin(v * 46 + 2.2 * Math.sin(u * 6.283 * 2) + 1.3 * Math.sin(v * 7)), 3);
      const backness = Math.pow(Math.max(0, Math.sin(u * 6.283 + 1.57)), 0.6);        // stripes on the back, not the belly
      const hair = (hash2(x, y >> 2) / 4294967296 - 0.5) * 0.12 + (hash2(x >> 1, y >> 4) / 4294967296 - 0.5) * 0.08;
      const bel = Math.pow(Math.max(0, -Math.sin(u * 6.283 + 1.57)), 1.5);
      const k = stripe * backness * 0.75;
      const i = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) d[i + c] = Math.max(0, Math.min(255, (base[c] * (1 - k) + dark[c] * k) * (1 - bel) + belly[c] * bel + 255 * hair));
      d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
}
// a soft round sprite (glows, dust motes)
function shDotTex(soft = 0.5) {
  return shTex(shCanvas(128, 128, (g, w) => {
    const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(soft, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
  }), { repeat: false });
}

// a scene's clip planes and fog follow your size (h in world units): near ∝ h, far ∝ h, fog thickens at small scales
function shClip(cam, near, far) { if (Math.abs(cam.near - near) > near * 1e-3 || Math.abs(cam.far - far) > far * 1e-3) { cam.near = near; cam.far = far; cam.updateProjectionMatrix(); } }
// point a camera from p at target q with a roll (radians)
function shLook(cam, p, q, roll = 0) {
  cam.position.set(p[0], p[1], p[2]);
  cam.up.set(0, 1, 0);
  cam.lookAt(q[0], q[1], q[2]);
  if (roll) cam.rotateZ(roll);
}
// a direction from yaw (0 = −z, + = left) and pitch (+ = up)
function shDir(yaw, pitch) { const c = Math.cos(pitch); return [-Math.sin(yaw) * c, Math.sin(pitch), -Math.cos(yaw) * c]; }
// smooth deterministic shake (sum of noises), amplitude a
function shShake(t, a, rate = 9, seed = 1) { return [noise1(t * rate, seed) * a, noise1(t * rate * 1.13, seed + 7) * a, noise1(t * rate * 0.91, seed + 13) * a]; }

// standard material helper
function shStd(color, rough = 0.7, metal = 0, o = {}) { return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough, metalness: metal }, o)); }

// ---- a world that grows as you shrink: everything hangs off `root`, scaled by 1/h, so you are always 1 unit tall.
// Clip planes, fog, the post chain's distance softening, contact shading and the first-person hands then keep human
// proportions at every scale. Positions are written in the world's own units and scaled on the way out.
function shMakeWorld(fov = 60) {
  const scene = new THREE.Scene(), root = new THREE.Group();
  scene.add(root);
  const camera = new THREE.PerspectiveCamera(fov, 16 / 9, 0.04, 1e5);
  scene.add(camera);
  const W = { scene, root, camera, s: 1 };
  W.setH = (hW) => { W.s = 1 / hW; root.scale.setScalar(W.s); return W.s; };
  // camera from p to target q (world units), roll in radians
  W.look = (p, q, roll = 0) => { const s = W.s; shLook(camera, [p[0] * s, p[1] * s, p[2] * s], [q[0] * s, q[1] * s, q[2] * s], roll); };
  // camera at p looking along a direction d
  W.lookDir = (p, d, roll = 0) => { const s = W.s; shLook(camera, [p[0] * s, p[1] * s, p[2] * s], [p[0] * s + d[0], p[1] * s + d[1], p[2] * s + d[2]], roll); };
  return W;
}
// a shadow-casting light's frustum, in world units (scaled with the root)
function shShadowBox(light, half, near, far, s) {
  const c = light.shadow.camera;
  c.left = -half * s; c.right = half * s; c.top = half * s; c.bottom = -half * s; c.near = near * s; c.far = far * s;
  c.updateProjectionMatrix();
}
function shShadowCone(light, near, far, s) {
  const c = light.shadow.camera; c.near = near * s; c.far = far * s; c.updateProjectionMatrix();
}
// normalised 3-vector helpers
const shN3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const shMix3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
// yaw/pitch of a direction (inverse of shDir)
function shYP(d) { const n = shN3(d); return [Math.atan2(-n[0], -n[2]), Math.asin(MathX.clamp(n[1], -1, 1))]; }
// a 0→1 ramp eased in and out between a and b
const shE = (t, a, b, ease = Ease.inOutSine) => ease(MathX.clamp((t - a) / (b - a), 0, 1));
// a shadow-casting, shadow-receiving mesh added to a parent at (x, y, z); returns the mesh
function shAddMesh(parent, g, m, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }

// ---- procedural surfaces: a MeshStandardMaterial whose colour and bumps come from GLSL functions of the object-space
// position (in the world's own units), so a surface keeps showing detail as you shrink onto it. Octaves finer than a
// screen pixel fade out (`pix` = world units per pixel). glsl must define:
//   float procH(vec3 p, float pix)            height (world units) along the normal
//   vec3  procC(vec3 p, float pix, vec3 base)  colour
// uniforms: uS (the root's scale: world units → view units; set every frame), plus any in o.uniforms.
const SH_GLSL_NOISE = /* glsl */`
  float shHash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float shHash3(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
  float shVN(vec2 p){ vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
    return mix(mix(shHash(i), shHash(i + vec2(1.0, 0.0)), u.x), mix(shHash(i + vec2(0.0, 1.0)), shHash(i + vec2(1.0, 1.0)), u.x), u.y); }
  float shVN3(vec3 p){ vec3 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
    float a = mix(mix(shHash3(i), shHash3(i + vec3(1,0,0)), u.x), mix(shHash3(i + vec3(0,1,0)), shHash3(i + vec3(1,1,0)), u.x), u.y);
    float b = mix(mix(shHash3(i + vec3(0,0,1)), shHash3(i + vec3(1,0,1)), u.x), mix(shHash3(i + vec3(0,1,1)), shHash3(i + vec3(1,1,1)), u.x), u.y);
    return mix(a, b, u.z); }
  // fade for a feature of size sz drawn at pix units per pixel (1 when ≥ 3 px, 0 below 1 px)
  float shLod(float sz, float pix){ return smoothstep(1.0, 3.0, sz / max(pix, 1e-9)); }
  // cellular: x = distance to the nearest cell centre, y = to the second (cells of size 1)
  vec2 shCell(vec2 p){ vec2 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0;
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y)); vec2 o = vec2(shHash(i + g), shHash(i + g + 17.3));
      float d = length(g + o - f); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
    return vec2(d1, d2); }
`;
function shProcStd(o) {
  const m = new THREE.MeshStandardMaterial(Object.assign({ color: '#ffffff', roughness: 0.6, metalness: 0 }, o.mat || {}));
  m.userData.uS = { value: 1 };
  const U = o.uniforms || {}; m.userData.U = U;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uS = m.userData.uS;
    for (const [k, v] of Object.entries(U)) sh.uniforms[k] = v;
    const decl = Object.keys(U).map((k) => `uniform ${U[k].type || 'float'} ${k};`).join('\n');
    sh.vertexShader = 'varying vec3 vShP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vShP = position;');
    sh.fragmentShader = 'varying vec3 vShP;\nuniform float uS;\n' + decl + '\n' + SH_GLSL_NOISE + o.glsl + '\n' + sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
        float shPix = max(length(fwidth(vShP)), 1e-9);
        diffuseColor.rgb = procC(vShP, shPix, diffuseColor.rgb);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        { float hh = procH(vShP, shPix) * uS; vec3 sp = -vViewPosition, sx = dFdx(sp), sy = dFdy(sp);
          vec3 r1 = cross(sy, normal), r2 = cross(normal, sx); float det = dot(sx, r1);
          vec3 grad = sign(det) * (dFdx(hh) * r1 + dFdy(hh) * r2);
          normal = normalize(abs(det) * normal - grad); }`);
  };
  m.customProgramCacheKey = () => 'shproc:' + o.key;
  return m;
}

// electron-microscope shading: a surface glows where it turns away from you (edges and rims bright, faces darker), as
// secondary electrons do. Wraps any MeshStandardMaterial (also a shProcStd one); k = how strong
function shSemify(m, k = 0.9, key = '') {
  const prev = m.onBeforeCompile, prevKey = m.customProgramCacheKey ? m.customProgramCacheKey.bind(m) : () => '';
  m.userData.semK = m.userData.semK || { value: k };
  m.onBeforeCompile = (sh, r) => {
    if (prev) prev(sh, r);
    sh.uniforms.uSemK = m.userData.semK;
    sh.fragmentShader = 'uniform float uSemK;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      { float nv = clamp(abs(dot(normal, normalize(vViewPosition))), 0.0, 1.0); totalEmissiveRadiance += uSemK * diffuseColor.rgb * (pow(1.0 - nv, 2.2) * 0.9 + 0.05); }`);
  };
  m.customProgramCacheKey = () => prevKey() + '|sem' + key;
  return m;
}
// a unit cylinder (radius 1, from y 0 to 1) stretched between two points a and b with radius r
function shStrut(mesh, a, b, r) {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length() || 1e-9;
  mesh.position.set(a[0], a[1], a[2]);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.divideScalar(L));
  mesh.scale.set(r, L, r);
}
// two-bone IK in a plane: from a root at (0,0) to a target (x, y), bone lengths l1, l2; returns the knee (bent towards +y)
function shIK2(x, y, l1, l2) {
  const d = Math.min(Math.hypot(x, y), l1 + l2 - 1e-6), a = Math.atan2(y, x);
  const c = MathX.clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1), k = Math.acos(c);
  return [Math.cos(a + k) * l1, Math.sin(a + k) * l1];
}
// a flat ground disc (y = 0) whose triangles grow geometrically away from a centre (cx, cz): near the centre the vertex
// coordinates stay small, so a procedural surface keeps full float precision there even when the disc is huge
function shPolarGround(rMax, rMin, cx = 0, cz = 0, segs = 72) {
  const rings = [0]; for (let r = rMin; r < rMax; r *= 1.35) rings.push(r); rings.push(rMax);
  const pos = [], idx = [];
  for (let i = 0; i < rings.length; i++) for (let k = 0; k <= segs; k++) { const a = k / segs * Math.PI * 2; pos.push(cx + Math.cos(a) * rings[i], 0, cz - Math.sin(a) * rings[i]); }
  for (let i = 0; i < rings.length - 1; i++) for (let k = 0; k < segs; k++) { const a = i * (segs + 1) + k, b = a + 1, c = a + segs + 2, d = a + segs + 1; idx.push(a, d, b, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(pos.length).fill(0).map((v, i) => (i % 3 === 1 ? 1 : 0)), 3));
  g.setIndex(idx);
  return g;
}
