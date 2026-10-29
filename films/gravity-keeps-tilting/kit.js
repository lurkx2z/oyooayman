/* =====================================================================
   KIT — what the sets share: the keyframe / loft / canvas / set / camera / sky / particle helpers of the slow-light
   film's kit (itself from the Shrinking and Tesla films), copied and renamed gt*, unchanged otherwise. This film's
   own physics is in physics.js. (gkRoundBox keeps its outer size when bevelled.)
   ===================================================================== */

const gkK = (t, a, b, e = Ease.inOutSine) => e(MathX.clamp((t - a) / (b - a), 0, 1));
const gkLerp = MathX.lerp;
const gkWin = (t, a, b, fi = 0.3, fo = 0.3) => StoryHUD.win(t, a, b, fi, fo);

// keyframes [[t, a, b, c…], …] → interpolated array at t (smooth in-out between neighbours; holds at the ends)
function gkKey(K, t, ease = Ease.inOutSine) {
  if (t <= K[0][0]) return K[0].slice(1);
  if (t >= K[K.length - 1][0]) return K[K.length - 1].slice(1);
  let i = 0; while (K[i + 1][0] < t) i++;
  const a = K[i], b = K[i + 1], u = ease((t - a[0]) / (b[0] - a[0]));
  const out = [];
  for (let k = 1; k < a.length; k++) out.push(a[k] + (b[k] - a[k]) * u);
  return out;
}
// Catmull-Rom through keyframes (smooth velocity through the middle keys) → array at t
function gkSpline(K, t) {
  if (t <= K[0][0]) return K[0].slice(1);
  if (t >= K[K.length - 1][0]) return K[K.length - 1].slice(1);
  let i = 0; while (K[i + 1][0] < t) i++;
  const p0 = K[Math.max(0, i - 1)], p1 = K[i], p2 = K[i + 1], p3 = K[Math.min(K.length - 1, i + 2)];
  const u = (t - p1[0]) / (p2[0] - p1[0]), u2 = u * u, u3 = u2 * u;
  const d1 = p2[0] - p1[0], m1s = d1 / Math.max(1e-6, p2[0] - p0[0]), m2s = d1 / Math.max(1e-6, p3[0] - p1[0]);
  const out = [];
  for (let k = 1; k < p1.length; k++) {
    const m1 = (p2[k] - p0[k]) * m1s, m2 = (p3[k] - p1[k]) * m2s;
    out.push((2 * u3 - 3 * u2 + 1) * p1[k] + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2[k] + (u3 - u2) * m2);
  }
  return out;
}

// a loft: rings [[x, y, z, rx, ry], …] along a path (each ring an ellipse perpendicular to the path); uv u around, v along
function gkLoft(rings, sides = 12, cap = 0.6) {
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

// a rounded box (radius r on the vertical edges, bevel b on the top/bottom edges), sitting on y = 0
function gkRoundBox(w0, h, d0, r, b = 0, seg = 4) {
  const w = w0 - 2 * b, d = d0 - 2 * b;                   // (the bevel grows the outline by b: keep the outer size w0 × d0)
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
function gkCanvas(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; }
function gkTex(c, o = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = o.srgb === false ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  if (o.repeat !== false) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = o.aniso || 4;
  return t;
}
// a canvas texture redrawn by draw(ctx, w, h, state) only when the state key changes
function gkCanvasTex(w, h, draw) {
  const c = gkCanvas(w, h, () => {}), ctx = c.getContext('2d'), tex = gkTex(c, { repeat: false });
  let key = null;
  return { tex, canvas: c, update(state) { const k = JSON.stringify(state); if (k === key) return; key = k; draw(ctx, w, h, state); tex.needsUpdate = true; } };
}
// wood grain for one plank texture (grain along v)
function gkWoodCanvas(seed, w = 512, h = 2048, base = [150, 104, 66]) {
  const r = new RNG(seed);
  return gkCanvas(w, h, (g) => {
    const img = g.createImageData(w, h), d = img.data;
    const ph = r.range(0, 100), wob = r.range(0.6, 1.4), knotY = r.range(0.2, 0.8) * h, knotX = r.range(0.2, 0.8) * w;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = x - knotX, dy = (y - knotY) * 0.25, kd = Math.sqrt(dx * dx + dy * dy);
      const warp = 18 * Math.sin(y * 0.004 * wob + ph) + 6 * Math.sin(y * 0.013 + ph * 2) + 40 * Math.exp(-kd / 50);
      const ring = Math.sin((x + warp) * 0.11 + 0.8 * Math.sin(y * 0.002 + ph)) * 0.5 + 0.5;
      const fine = Math.sin((x + warp) * 0.9 + y * 0.01) * 0.5 + 0.5;
      const v = 0.82 + 0.16 * Math.pow(ring, 3) - 0.06 * fine + 0.05 * (hash2(x >> 1, y >> 3) - 0.5);
      const i = (y * w + x) * 4;
      d[i] = base[0] * v; d[i + 1] = base[1] * v; d[i + 2] = base[2] * v; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
}
// a soft round sprite (glows, sparks, dust)
function gkDotTex(soft = 0.5) {
  return gkTex(gkCanvas(128, 128, (g, w) => {
    const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(soft, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
  }), { repeat: false });
}
// rounded rectangle path on a 2D canvas
function gkRR(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

function gkStd(color, rough = 0.7, metal = 0, o = {}) { return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough, metalness: metal }, o)); }
// (with no parent, a part goes into the scene of the set being built: gkSet() makes it current)
let GK_KIT_SCENE = null;
function gkMesh(g, m, x = 0, y = 0, z = 0, parent = null) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; (parent || GK_KIT_SCENE).add(o); return o; }
function gkBox(w, h, d, m, x = 0, y = 0, z = 0, parent = null, ry = 0) { const o = gkMesh(new THREE.BoxGeometry(w, h, d), m, x, y, z, parent); o.rotation.y = ry; return o; }
function gkCyl(r0, r1, h, m, x = 0, y = 0, z = 0, parent = null, seg = 18) { return gkMesh(new THREE.CylinderGeometry(r0, r1, h, seg), m, x, y, z, parent); }
// a unit cylinder (radius 1, y 0…1) stretched between two points a and b with radius r
function gkStrut(mesh, a, b, r) {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length() || 1e-9;
  mesh.position.set(a[0], a[1], a[2]);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.divideScalar(L));
  mesh.scale.set(r, L, r);
}

// a soft gradient environment map for a set's reflections
function gkEnv(renderer, top, mid, low) {
  const pm = new THREE.PMREMGenerator(renderer), es = new THREE.Scene();
  es.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, uniforms: { a: { value: new THREE.Color(top) }, b: { value: new THREE.Color(mid) }, c: { value: new THREE.Color(low) } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 a,b,c; varying vec3 vD; void main(){ float h = vD.y; vec3 col = h > 0.0 ? mix(b, a, smoothstep(0.0, 0.7, h)) : mix(b, c, smoothstep(0.0, -0.5, h)); gl_FragColor = vec4(col, 1.0); }',
  })));
  const tex = pm.fromScene(es, 0.04).texture; pm.dispose();
  return tex;
}
// a set: scene, camera, light. o = { sky, fog, fov, sun: [x,y,z] | null, sunColor, sunI, hemi: [sky, ground, I], shadow, env }
function gkSet(app, o = {}) {
  const scene = new THREE.Scene(); GK_KIT_SCENE = scene;
  scene.background = new THREE.Color(o.sky || '#0b0d12');
  if (o.fog) scene.fog = new THREE.FogExp2(o.fogColor || o.sky || '#0b0d12', o.fog);
  const camera = new THREE.PerspectiveCamera(o.fov || 55, 16 / 9, o.near || 0.03, o.far || 6000);
  scene.add(camera);                                      // (the first-person hands are camera children)
  const hemi = new THREE.HemisphereLight(...(o.hemi || ['#bcd0e6', '#5a5048', 0.6]));
  scene.add(hemi);
  let sun = null;
  if (o.sun) {
    sun = new THREE.DirectionalLight(o.sunColor || '#fff1dc', o.sunI ?? 2.0);
    sun.position.set(...o.sun);
    if (o.shadow) {
      sun.castShadow = true; sun.shadow.mapSize.set(o.shadow, o.shadow);
      const c = sun.shadow.camera, R = o.shadowR || 30; c.left = -R; c.right = R; c.top = R; c.bottom = -R; c.near = 1; c.far = o.shadowFar || 300;
      sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
    }
    scene.add(sun); scene.add(sun.target);
  }
  if (o.env) scene.environment = gkEnv(app.renderer, ...o.env);
  return { scene, camera, sun, hemi };
}
// place a camera: position, look-at point, fov, roll (degrees)
function gkCam(cam, p, at, fov, roll = 0) {
  cam.position.set(p[0], p[1], p[2]); cam.up.set(0, 1, 0); cam.lookAt(at[0], at[1], at[2]);
  if (roll) cam.rotateZ(MathX.deg(roll));
  if (fov && cam.fov !== fov) cam.fov = fov;
  cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
}
const gkV = (a, b, k) => [gkLerp(a[0], b[0], k), gkLerp(a[1], b[1], k), gkLerp(a[2], b[2], k)];
const gkN3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
// a direction from yaw (0 = −z, + = left) and pitch (+ = up)
function gkDir(yaw, pitch) { const c = Math.cos(pitch); return [-Math.sin(yaw) * c, Math.sin(pitch), -Math.cos(yaw) * c]; }
// smooth deterministic hand-held drift, amplitude a (m)
function gkDrift(t, a, rate = 0.35, seed = 1) { return [noise1(t * rate, seed) * a, noise1(t * rate * 1.13, seed + 7) * a, noise1(t * rate * 0.91, seed + 13) * a]; }
// a seeded number in [0,1) for integer i
const gkR = (i, s = 1) => hash1(i * 7919 + s * 104729);

// a gradient sky dome (not fogged): zenith, horizon, below-horizon colours; an optional sun glow; uniform k = brightness
function gkSky(scene, top, hor, low, o = {}) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(o.r || 5000, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { a: { value: new THREE.Color(top) }, b: { value: new THREE.Color(hor) }, c: { value: new THREE.Color(low) }, sd: { value: new THREE.Vector3(...(o.sunDir || [0, 0.2, -1])).normalize() }, sc: { value: new THREE.Color(o.sunGlow || '#000000') }, hw: { value: o.hw || 0.25 }, k: { value: 1 } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
    fragmentShader: `uniform vec3 a, b, c, sc, sd; uniform float hw, k; varying vec3 vD;
      void main(){ float h = vD.y; vec3 col = h > 0.0 ? mix(b, a, pow(smoothstep(0.0, 1.0, h / hw * 0.25 + h * 0.75), 0.7)) : mix(b, c, smoothstep(0.0, -0.12, h));
        float g = max(dot(vD, sd), 0.0); col += sc * (pow(g, 8.0) * 0.5 + pow(g, 90.0) * 1.5);
        gl_FragColor = vec4(col * k, 1.0); }`,
  }));
  m.renderOrder = -10; m.frustumCulled = false; scene.add(m);
  return m;
}

// ---------------------------------------------------------------------------------------------------------------------
// PUFFS — soft camera-facing particles (smoke, sparks, dust), a pool rewritten every frame from scratch (pure).
// add(x, y, z, size m, alpha, r, g, b)
// ---------------------------------------------------------------------------------------------------------------------
function gkPuffs(scene, max = 6000, o = {}) {
  const g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(1, 1);
  g.index = q.index; g.setAttribute('position', q.attributes.position); g.setAttribute('uv', q.attributes.uv);
  const P = new Float32Array(max * 3), S = new Float32Array(max), A = new Float32Array(max), Cc = new Float32Array(max * 3);
  const iP = new THREE.InstancedBufferAttribute(P, 3), iS = new THREE.InstancedBufferAttribute(S, 1), iA = new THREE.InstancedBufferAttribute(A, 1), iC = new THREE.InstancedBufferAttribute(Cc, 3);
  for (const x of [iP, iS, iA, iC]) x.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('iPos', iP); g.setAttribute('iSize', iS); g.setAttribute('iAlpha', iA); g.setAttribute('iCol', iC);
  g.instanceCount = 0;
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: { fogCol: { value: new THREE.Color('#000') }, fogDen: { value: 0 }, soft: { value: o.soft ?? 1.6 }, nearA: { value: o.near ? o.near[0] : -1 }, nearB: { value: o.near ? o.near[1] : 0 } },
    vertexShader: `attribute vec3 iPos; attribute float iSize; attribute float iAlpha; attribute vec3 iCol; varying float vA; varying vec3 vC; varying float vD; varying vec2 vQ;
      void main(){ vA = iAlpha; vC = iCol; vQ = position.xy * 2.0; vec4 mv = viewMatrix * vec4(iPos, 1.0); mv.xy += position.xy * iSize; vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 fogCol; uniform float fogDen, soft, nearA, nearB; varying float vA; varying vec3 vC; varying float vD; varying vec2 vQ;
      void main(){ float r = dot(vQ, vQ); if (r > 1.0) discard; float a = vA * pow(1.0 - r, soft) * (nearA < 0.0 ? 1.0 : smoothstep(nearA, nearB, vD));
        float f = 1.0 - exp(-fogDen * vD); gl_FragColor = vec4(mix(vC, fogCol, f), a * (1.0 - 0.6 * f)); }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 5; scene.add(mesh);
  let n = 0;
  return {
    mesh, mat,
    begin() { n = 0; if (scene.fog) { mat.uniforms.fogCol.value.copy(scene.fog.color); mat.uniforms.fogDen.value = scene.fog.density; } },
    add(x, y, z, size, alpha, r = 1, gg = 1, b = 1) {
      if (n >= max || !(alpha > 0.002) || !isFinite(x + y + z + size)) return;
      P[n * 3] = x; P[n * 3 + 1] = y; P[n * 3 + 2] = z; S[n] = size; A[n] = Math.min(1, alpha); Cc[n * 3] = r; Cc[n * 3 + 1] = gg; Cc[n * 3 + 2] = b; n++;
    },
    end() { g.instanceCount = n; for (const x of [iP, iS, iA, iC]) x.needsUpdate = true; },
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// WALLS, PLANES, BRICK, PAVING, GROUND STRIPS, CROWNS (the Friction 10s film's home.js / street.js helpers, renamed)
// ---------------------------------------------------------------------------------------------------------------------
// a wall from x0…x1 × y0…y1 with rectangular holes [[x0, x1, y0, y1], …] → the solid cells (vertical runs merged)
function gkWallCells(x0, x1, y0, y1, holes) {
  const xs = [x0, x1], ys = [y0, y1];
  for (const h of holes) { xs.push(h[0], h[1]); ys.push(h[2], h[3]); }
  const ux = [...new Set(xs)].filter((v) => v >= x0 && v <= x1).sort((a, b) => a - b), uy = [...new Set(ys)].filter((v) => v >= y0 && v <= y1).sort((a, b) => a - b);
  const cells = [];
  for (let i = 0; i < ux.length - 1; i++) for (let j = 0; j < uy.length - 1; j++) {
    const cx = (ux[i] + ux[i + 1]) / 2, cy = (uy[j] + uy[j + 1]) / 2;
    if (holes.some((h) => cx > h[0] && cx < h[1] && cy > h[2] && cy < h[3])) continue;
    cells.push([ux[i], ux[i + 1], uy[j], uy[j + 1]]);
  }
  const out = [];
  for (const c of cells) { const o = out.find((q) => q[0] === c[0] && q[1] === c[1] && q[3] === c[2]); if (o) o[3] = c[3]; else out.push(c.slice()); }
  return out;
}
// a plane at (x, y, z) facing direction f: '+x' '-x' '+z' '-z' '+y' '-y'
function gkPlane(w, h, m, x, y, z, f, parent) {
  const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  o.position.set(x, y, z);
  const R = { '+x': [0, Math.PI / 2, 0], '-x': [0, -Math.PI / 2, 0], '+z': [0, 0, 0], '-z': [0, Math.PI, 0], '+y': [-Math.PI / 2, 0, 0], '-y': [Math.PI / 2, 0, 0] }[f];
  o.rotation.set(R[0], R[1], R[2]); o.receiveShadow = true; o.castShadow = false;
  (parent || GK_KIT_SCENE).add(o); return o;
}
// stretcher-bond brick (16 px courses)
function gkBrickCanvas(seed, base = [128, 74, 58], w = 512, h = 512, mortar = '#6b645a') {
  const r = new RNG(seed);
  return gkCanvas(w, h, (g) => {
    g.fillStyle = mortar; g.fillRect(0, 0, w, h);
    const bh = 16, bw = 46;
    for (let y = 0, row = 0; y < h; y += bh, row++) for (let x = row % 2 ? -bw / 2 : 0; x < w; x += bw) {
      const k = r.range(-20, 14), c = base.map((v) => MathX.clamp(v + k + r.range(-7, 7), 0, 255));
      g.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`; g.fillRect(x + 1.5, y + 1.5, bw - 3, bh - 3);
      if (r.next() < 0.25) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x + 1.5, y + bh - 5, bw - 3, 3.5); }
      if (r.next() < 0.15) { g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(x + 4, y + 3, bw - 12, 3); }
    }
  });
}
// paving slabs, 60 cm
function gkPavingCanvas(seed, w = 512, h = 512) {
  const r = new RNG(seed);
  return gkCanvas(w, h, (g) => {
    g.fillStyle = '#7d7870'; g.fillRect(0, 0, w, h);
    const s = 128;
    for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) {
      const k = r.range(-12, 12); g.fillStyle = `rgb(${158 + k},${152 + k},${142 + k})`; g.fillRect(x + 2, y + 2, s - 4, s - 4);
      for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${r.next() < 0.5 ? '255,255,255' : '0,0,0'},0.05)`; g.fillRect(x + r.range(2, s - 4), y + r.range(2, s - 4), 2, 2); }
      if (r.next() < 0.2) { g.fillStyle = 'rgba(40,36,30,0.12)'; g.beginPath(); g.arc(x + r.range(20, s - 20), y + r.range(20, s - 20), r.range(6, 20), 0, 6.28); g.fill(); }
    }
  });
}
// mown grass with faint stripes
function gkGrassCanvas(seed, w = 512, h = 512) {
  const r = new RNG(seed);
  return gkCanvas(w, h, (g) => {
    g.fillStyle = '#5f7f3c'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { const k = r.range(-1, 1); g.fillStyle = `rgba(${k > 0 ? '150,180,90' : '40,60,25'},${r.range(0.08, 0.22)})`; g.fillRect(r.range(0, w), r.range(0, h), 1.2, r.range(2, 6)); }
    for (let x = 0; x < w; x += 128) { g.fillStyle = 'rgba(255,255,230,0.05)'; g.fillRect(x, 0, 64, h); }
  });
}
// a lumpy blob geometry (a tree crown)
function gkBlobGeo(r, seed) {
  const geo = new THREE.IcosahedronGeometry(r, 1), p = geo.attributes.position, rr = new RNG(Math.round(seed * 13) + 5);
  const k = [rr.range(0, 9), rr.range(0, 9), rr.range(0, 9)];
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), f = 1 + 0.16 * Math.sin(x * 3.1 + k[0]) * Math.sin(y * 2.7 + k[1]) + 0.1 * Math.sin(z * 4.3 + k[2]); p.setXYZ(i, x * f, y * f * 0.85, z * f); }
  geo.computeVertexNormals(); return geo;
}
