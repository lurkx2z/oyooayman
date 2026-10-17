/* =====================================================================
   KIT — what the sets share (the set/camera/sky helpers come from the Africa film's kit, renamed; the dissolve is
   unused here):
     trSet(app, o)          a set: its own scene, camera, sky colour, fog, sun + sky light, a reflection map
     trDissolveMat(…)       a standard material that can vanish: a world-space sweep broken by noise, an amber seam
                            at the edge (the same look as the continent going on the globe). One uniform block per set.
     trMat / trBox / trCyl  small helpers (materials are per set, never the shared Mat cache, because of the dissolve)
     trCanvasTex            a canvas texture redrawn on demand (boards, phone screens, price labels)
   ===================================================================== */

const trK = (t, a, b, e = Ease.inOutSine) => e(MathX.clamp((t - a) / (b - a), 0, 1));
const trLerp = MathX.lerp;

function trDissolveUniforms() {
  return { uDisK: { value: -1e3 }, uDisO: { value: new THREE.Vector3() }, uDisDir: { value: new THREE.Vector3(1, 0, 0) }, uDisLen: { value: 100 }, uDisNoise: { value: 0.08 } };
}

// add the vanish to any built-in material: fragments whose sweep position s < uDisK are gone; a thin hot seam at the edge
function trDissolvable(mat, U) {
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
        totalEmissiveRadiance += vec3(1.0, 0.62, 0.3) * 7.0 * (1.0 - smoothstep(0.0, 0.02, disE)) * step(-100.0, uDisK);`);
  };
  mat.customProgramCacheKey = () => 'trDis';
  return mat;
}

function trMat(color, o = {}, U = null) {
  const m = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.8, metalness: 0 }, o));
  return trDissolvable(m, U);
}
// (with no parent, a part goes into the scene of the set being built: trSet() makes it current)
let TR_KIT_SCENE = null;
function trBox(w, h, d, mat, x = 0, y = 0, z = 0, parent = null, ry = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.y = ry;
  m.castShadow = m.receiveShadow = true; (parent || TR_KIT_SCENE).add(m); return m;
}
function trCyl(r0, r1, h, mat, x = 0, y = 0, z = 0, parent = null, seg = 16) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), mat); m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true; (parent || TR_KIT_SCENE).add(m); return m;
}

// a set: scene, camera, light. o = { sky, fog (density), fov, sun: [x,y,z], sunColor, sunI, hemi: [sky, ground, I], shadow: size, env: [top, mid, low] }
function trSet(app, o = {}) {
  const scene = new THREE.Scene(); TR_KIT_SCENE = scene;
  scene.background = new THREE.Color(o.sky || '#8fa6bd');
  if (o.fog) scene.fog = new THREE.FogExp2(o.fogColor || o.sky || '#8fa6bd', o.fog);
  const camera = new THREE.PerspectiveCamera(o.fov || 40, 16 / 9, o.near || 0.1, o.far || 4000);
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
  if (o.env) scene.environment = trEnv(app.renderer, ...o.env);
  return { scene, camera, sun, hemi, U: trDissolveUniforms() };
}

// a canvas texture redrawn by draw(ctx, w, h, state) only when the state key changes
function trCanvasTex(w, h, draw, srgb = true) {
  const c = Tex.canvas(w, h), ctx = c.getContext('2d'), tex = Tex.tex(c, { repeat: false, srgb });
  let key = null;
  return { tex, canvas: c, update(state) { const k = JSON.stringify(state); if (k === key) return; key = k; draw(ctx, w, h, state); tex.needsUpdate = true; } };
}

// place a camera: position, look-at point, fov, roll (degrees)
function trCam(cam, p, at, fov, roll = 0) {
  cam.position.set(p[0], p[1], p[2]); cam.up.set(0, 1, 0); cam.lookAt(at[0], at[1], at[2]);
  if (roll) cam.rotateZ(MathX.deg(roll));
  if (fov && cam.fov !== fov) { cam.fov = fov; }
  cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
}
const trV = (a, b, k) => [trLerp(a[0], b[0], k), trLerp(a[1], b[1], k), trLerp(a[2], b[2], k)];

// a seeded number in [0,1) for integer i (stable per set)
const trR = (i, s = 1) => hash1(i * 7919 + s * 104729);

// a gradient sky dome (not fogged, never dissolves): zenith, horizon, below-horizon colours; an optional sun glow
function trSky(scene, top, hor, low, o = {}) {
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
function trPose(p, t, extra = {}) { p.apply(p.poseAt(t, Object.assign({ seed: p.seed, seedI: p.seedI, walkPhase: 0, seat: p.spec.seat }, extra))); p.root.updateMatrixWorld(true); }

// 2-D value noise and fbm (seeded, smooth) for the sets' terrain
function trN2(x, z) {
  const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), w = fz * fz * (3 - 2 * fz);
  return trLerp(trLerp(hash2(i, j), hash2(i + 1, j), u), trLerp(hash2(i, j + 1), hash2(i + 1, j + 1), u), w);
}
function trF2(x, z, o = 4) { let s = 0, a = 0.5, f = 1; for (let k = 0; k < o; k++) { s += a * trN2(x * f + k * 17.3, z * f - k * 9.1); a *= 0.5; f *= 2.03; } return s / (1 - Math.pow(0.5, o)); }


// ---------------------------------------------------------------------------------------------------------------------
// PUFFS — soft round particles (cold-gas vapour, dust, rotor wash, air in the explainers). A pool of points rewritten
// every frame from scratch: each emitter computes where each of its particles is at time t (a pure function), so
// scrubbing and the final render agree. add(x, y, z, size m, alpha, r, g, b)
// ---------------------------------------------------------------------------------------------------------------------
function trPuffs(scene, max = 6000, o = {}) {
  // camera-facing quads, instanced (a point sprite has a size limit and clips at the frame edge)
  const g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(1, 1);
  g.index = q.index; g.setAttribute('position', q.attributes.position); g.setAttribute('uv', q.attributes.uv);
  const P = new Float32Array(max * 3), S = new Float32Array(max), A = new Float32Array(max), Cc = new Float32Array(max * 3);
  const iP = new THREE.InstancedBufferAttribute(P, 3), iS = new THREE.InstancedBufferAttribute(S, 1), iA = new THREE.InstancedBufferAttribute(A, 1), iC = new THREE.InstancedBufferAttribute(Cc, 3);
  for (const x of [iP, iS, iA, iC]) x.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('iPos', iP); g.setAttribute('iSize', iS); g.setAttribute('iAlpha', iA); g.setAttribute('iCol', iC);
  g.instanceCount = 0;
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: { fogCol: { value: new THREE.Color('#000') }, fogDen: { value: 0 } },
    vertexShader: `attribute vec3 iPos; attribute float iSize; attribute float iAlpha; attribute vec3 iCol; varying float vA; varying vec3 vC; varying float vD; varying vec2 vQ;
      void main(){ vA = iAlpha; vC = iCol; vQ = position.xy * 2.0; vec4 mv = viewMatrix * vec4(iPos, 1.0); mv.xy += position.xy * iSize; vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 fogCol; uniform float fogDen; varying float vA; varying vec3 vC; varying float vD; varying vec2 vQ;
      void main(){ float r = dot(vQ, vQ); if (r > 1.0) discard; float a = vA * pow(1.0 - r, 1.6);
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

// a jet of cold gas from a nozzle firing between t0 and t1 (strength k(t) 0…1): particles born every dt, flying out
// along the nozzle's direction, slowing, spreading and fading. The vapour is white (expanding air cools and fogs).
// where(tb) → [pos Vector3, dir Vector3] of the nozzle at birth time tb (pure). o: speed, life, size, grow, spread, alpha, dt, color
const _trJ = new THREE.Vector3(), _trJd = new THREE.Vector3();
function trJet(puffs, t, t0, t1, k, where, o = {}) {
  const dt = o.dt || 1 / 90, life = o.life || 0.9, sp = o.speed || 14, seed = o.seed || 1;
  const first = Math.max(t0, t - life), c = o.color || [0.93, 0.96, 1.0];
  for (let i = Math.ceil((first - t0) / dt); ; i++) {
    const tb = t0 + i * dt; if (tb > Math.min(t, t1)) break;
    const kb = k(tb); if (kb <= 0.01) continue;
    const age = t - tb, u = age / life;
    const [p, d] = where(tb);
    // drag: distance covered = sp·τ·(1 − e^(−age/τ))
    const tau = o.tau || 0.18, dist = sp * kb * tau * (1 - Math.exp(-age / tau));
    const h1 = hash1(i * 13 + seed * 7) - 0.5, h2 = hash1(i * 29 + seed * 11) - 0.5, h3 = hash1(i * 31 + seed * 17) - 0.5;
    const spr = (o.spread || 0.18) * dist + 0.25 * u;
    _trJ.copy(p).addScaledVector(d, dist);
    _trJ.x += h1 * spr * 2; _trJ.y += h2 * spr * 2 + (o.rise || 0.6) * age * age; _trJ.z += h3 * spr * 2;
    if (o.floor != null && _trJ.y < o.floor + 0.1) _trJ.y = o.floor + 0.1 + 0.3 * Math.abs(h2) * u;
    const size = (o.size || 0.25) + (o.grow || 1.6) * u * kb;
    const a = (o.alpha || 0.5) * kb * Math.min(1, age / 0.04) * Math.pow(1 - u, 1.4);
    puffs.add(_trJ.x, _trJ.y, _trJ.z, size, a, c[0], c[1], c[2]);
  }
}
