/* =====================================================================
   KIT — what the ground sets share:
     afSet(app, o)          a set: its own scene, camera, sky colour, fog, sun + sky light, a reflection map
     afDissolveMat(…)       a standard material that can vanish: a world-space sweep broken by noise, an amber seam
                            at the edge (the same look as the continent going on the globe). One uniform block per set.
     afMat / afBox / afCyl  small helpers (materials are per set, never the shared Mat cache, because of the dissolve)
     afCanvasTex            a canvas texture redrawn on demand (boards, phone screens, price labels)
   ===================================================================== */

function afDissolveUniforms() {
  return { uDisK: { value: -1e3 }, uDisO: { value: new THREE.Vector3() }, uDisDir: { value: new THREE.Vector3(1, 0, 0) }, uDisLen: { value: 100 }, uDisNoise: { value: 0.08 } };
}

// add the vanish to any built-in material: fragments whose sweep position s < uDisK are gone; a thin hot seam at the edge
function afDissolvable(mat, U) {
  if (!U) return mat;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vDisW;')
      .replace('#include <project_vertex>', `#include <project_vertex>
        vec4 disW = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
        disW = instanceMatrix * disW;
        #endif
        vDisW = (modelMatrix * disW).xyz;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vDisW;
        uniform float uDisK, uDisLen, uDisNoise; uniform vec3 uDisO, uDisDir;
        float disH(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
        float disN(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(disH(i), disH(i + vec3(1,0,0)), f.x), mix(disH(i + vec3(0,1,0)), disH(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(disH(i + vec3(0,0,1)), disH(i + vec3(1,0,1)), f.x), mix(disH(i + vec3(0,1,1)), disH(i + vec3(1,1,1)), f.x), f.y), f.z); }`)
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        float disS = dot(vDisW - uDisO, uDisDir) / uDisLen + 0.22 * (disN(vDisW * uDisNoise) - 0.5) + 0.06 * (disN(vDisW * uDisNoise * 7.0) - 0.5);
        float disE = disS - uDisK;
        if (disE < 0.0) discard;`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += vec3(1.0, 0.62, 0.3) * 6.0 * (1.0 - smoothstep(0.0, 0.012, disE)) * step(-100.0, uDisK);`);
  };
  mat.customProgramCacheKey = () => 'afDis';
  return mat;
}

function afMat(color, o = {}, U = null) {
  const m = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.8, metalness: 0 }, o));
  return afDissolvable(m, U);
}
// (with no parent, a part goes into the scene of the set being built: afSet() makes it current)
let AF_KIT_SCENE = null;
function afBox(w, h, d, mat, x = 0, y = 0, z = 0, parent = null, ry = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.y = ry;
  m.castShadow = m.receiveShadow = true; (parent || AF_KIT_SCENE).add(m); return m;
}
function afCyl(r0, r1, h, mat, x = 0, y = 0, z = 0, parent = null, seg = 16) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), mat); m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true; (parent || AF_KIT_SCENE).add(m); return m;
}

// a set: scene, camera, light. o = { sky, fog (density), fov, sun: [x,y,z], sunColor, sunI, hemi: [sky, ground, I], shadow: size, env: [top, mid, low] }
function afSet(app, o = {}) {
  const scene = new THREE.Scene(); AF_KIT_SCENE = scene;
  scene.background = new THREE.Color(o.sky || '#8fa6bd');
  if (o.fog) scene.fog = new THREE.FogExp2(o.fogColor || o.sky || '#8fa6bd', o.fog);
  const camera = new THREE.PerspectiveCamera(o.fov || 40, 9 / 16, o.near || 0.1, o.far || 4000);
  const hemi = new THREE.HemisphereLight(...(o.hemi || ['#bcd0e6', '#5a5048', 0.9]));
  scene.add(hemi);
  let sun = null;
  if (o.sun !== null) {
    sun = new THREE.DirectionalLight(o.sunColor || '#fff1dc', o.sunI ?? 2.6);
    sun.position.set(...(o.sun || [60, 90, 40]));
    if (o.shadow) {
      sun.castShadow = true; sun.shadow.mapSize.set(o.shadow, o.shadow);
      const c = sun.shadow.camera, R = o.shadowR || 60; c.left = -R; c.right = R; c.top = R; c.bottom = -R; c.near = 1; c.far = o.shadowFar || 600;
      sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
    }
    scene.add(sun); scene.add(sun.target);
  }
  if (o.env) scene.environment = afEnv(app.renderer, ...o.env);
  return { scene, camera, sun, hemi, U: afDissolveUniforms() };
}

// a canvas texture redrawn by draw(ctx, w, h, state) only when the state key changes
function afCanvasTex(w, h, draw, srgb = true) {
  const c = Tex.canvas(w, h), ctx = c.getContext('2d'), tex = Tex.tex(c, { repeat: false, srgb });
  let key = null;
  return { tex, canvas: c, update(state) { const k = JSON.stringify(state); if (k === key) return; key = k; draw(ctx, w, h, state); tex.needsUpdate = true; } };
}

// place a camera: position, look-at point, fov, roll (degrees)
function afCam(cam, p, at, fov, roll = 0) {
  cam.position.set(p[0], p[1], p[2]); cam.up.set(0, 1, 0); cam.lookAt(at[0], at[1], at[2]);
  if (roll) cam.rotateZ(MathX.deg(roll));
  if (fov && cam.fov !== fov) { cam.fov = fov; }
  cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
}
const afV = (a, b, k) => [afLerp(a[0], b[0], k), afLerp(a[1], b[1], k), afLerp(a[2], b[2], k)];

// a seeded number in [0,1) for integer i (stable per set)
const afR = (i, s = 1) => hash1(i * 7919 + s * 104729);

// a gradient sky dome (not fogged, never dissolves): zenith, horizon, below-horizon colours; an optional sun glow
function afSky(scene, top, hor, low, o = {}) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(o.r || 3000, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { a: { value: new THREE.Color(top) }, b: { value: new THREE.Color(hor) }, c: { value: new THREE.Color(low) }, sd: { value: new THREE.Vector3(...(o.sunDir || [0, 0.2, -1])).normalize() }, sc: { value: new THREE.Color(o.sunGlow || '#000000') }, hw: { value: o.hw || 0.25 } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
    fragmentShader: `uniform vec3 a, b, c, sc, sd; uniform float hw; varying vec3 vD;
      void main(){ float h = vD.y; vec3 col = h > 0.0 ? mix(b, a, pow(smoothstep(0.0, 1.0, h / hw * 0.25 + h * 0.75), 0.7)) : mix(b, c, smoothstep(0.0, -0.12, h));
        float g = max(dot(vD, sd), 0.0); col += sc * (pow(g, 8.0) * 0.5 + pow(g, 90.0) * 1.5);
        gl_FragColor = vec4(col, 1.0); }`,
  }));
  m.renderOrder = -10; m.frustumCulled = false; scene.add(m);
  return m;
}

// pose a Person that has no path (placed by hand): its state machine at time t
function afPose(p, t, extra = {}) { p.apply(p.poseAt(t, Object.assign({ seed: p.seed, seedI: p.seedI, walkPhase: 0, seat: p.spec.seat }, extra))); p.root.updateMatrixWorld(true); }

// 2-D value noise and fbm (seeded, smooth) for the sets' terrain
function afN2(x, z) {
  const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), w = fz * fz * (3 - 2 * fz);
  return afLerp(afLerp(hash2(i, j), hash2(i + 1, j), u), afLerp(hash2(i, j + 1), hash2(i + 1, j + 1), u), w);
}
function afF2(x, z, o = 4) { let s = 0, a = 0.5, f = 1; for (let k = 0; k < o; k++) { s += a * afN2(x * f + k * 17.3, z * f - k * 9.1); a *= 0.5; f *= 2.03; } return s / (1 - Math.pow(0.5, o)); }

// the floor of the new basin, far under a ground set: once the land has gone this is what the camera looks down on —
// a dark rock plain kilometres below, long ridges catching the low sun, fading into the haze of 4 km of air
function afFloor(scene, depth, o = {}) {
  const L = o.size || 110000, N = 240, g = new THREE.PlaneGeometry(L, L, N, N); g.rotateX(-Math.PI / 2);
  const P = g.attributes.position, col = new Float32Array(P.count * 3), c = new THREE.Color();
  const a = new THREE.Color(o.a || '#2a2623'), b = new THREE.Color(o.b || '#6a5e52'), X0 = o.x || 0, Z0 = o.z || 0;
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i) + X0, z = P.getZ(i) + Z0;
    const n = afF2(x / 11000, z / 11000), r = 1 - Math.abs(2 * afF2(x / 5200 + 40, z / 8000 - 7, 3) - 1);
    P.setY(i, -depth + 1100 * n + 650 * r * r * r);
    c.copy(a).lerp(b, MathX.clamp(r * r * 0.8 + 0.45 * (afN2(x / 900, z / 900) - 0.5) + 0.3 * (n - 0.5), 0, 1));
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, flatShading: false }));
  m.position.set(X0, 0, Z0); scene.add(m);
  return m;
}
