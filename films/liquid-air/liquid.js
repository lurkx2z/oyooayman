/* =====================================================================
   LIQUID — the sky as a liquid: its surface (a mirror from below, with Snell's window: n ≈ 1.21, so the sky is
   squeezed into a cone 56° from straight up and everything outside it is total internal reflection of the street),
   the rain (slow fat drops at 5 m/s; then the crash, at ~130 m/s, out of a black sky), the drops forming in your room,
   the splashes, bubbles (your breath, the boiling glass, the fizz at 4:00), the sun's shafts and the ripple-light
   (caustics) on the bottom once the sun is out, the stars. All posed from story time s and the camera (pure).
     laBuildLiquid(S) → Lq ; Lq.update(s, cam, o)
   ===================================================================== */

const LA_N = 1.21;                                          // liquid air's refractive index (N2 1.20, O2 1.22)
const LA_COSC = Math.sqrt(1 - 1 / (LA_N * LA_N));           // cos of the critical angle (55.7°): Snell's window

// a streak system: thin quads along a direction, each turned to the camera (rain falling; bubbles rising)
function laStreaks(scene, N, o = {}) {
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(N * 12), uv = new Float32Array(N * 8), idx = new Uint32Array(N * 6), al = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) { uv.set([0, 0, 1, 0, 1, 1, 0, 1], i * 8); idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6); }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('aA', new THREE.BufferAttribute(al, 1).setUsage(THREE.DynamicDrawUsage)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: { uCol: { value: new THREE.Color(o.color || '#dfe8ee') }, uA: { value: 1 }, fogCol: { value: new THREE.Color('#000') }, fogDen: { value: 0 } },
    vertexShader: 'attribute float aA; varying vec2 vUv; varying float vA; varying float vD; void main(){ vUv = uv; vA = aA; vec4 mv = modelViewMatrix * vec4(position, 1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: `uniform vec3 uCol, fogCol; uniform float uA, fogDen; varying vec2 vUv; varying float vA; varying float vD;
      void main(){ float across = 1.0 - abs(vUv.x - 0.5) * 2.0; float along = smoothstep(0.0, 0.35, vUv.y) * (0.55 + 0.45 * vUv.y);
        float a = uA * vA * across * along; if (a < 0.003) discard; float f = 1.0 - exp(-fogDen * vD); gl_FragColor = vec4(mix(uCol, fogCol, f), a * (1.0 - 0.7 * f)); }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = o.order ?? 7; scene.add(mesh);
  let n = 0;
  return {
    mesh, mat, N,
    begin() { n = 0; },
    // a streak from (x, y, z) back along (dx, dy, dz) · len, width w, alpha a, as seen from the camera cp
    add(cp, x, y, z, dx, dy, dz, len, w, a) {
      if (n >= N || !(a > 0.003)) return;
      const ex = dx * len, ey = dy * len, ez = dz * len, vx = x - cp.x, vy = y - cp.y, vz = z - cp.z;
      let sx = ey * vz - ez * vy, sy = ez * vx - ex * vz, sz = ex * vy - ey * vx; const sl = Math.hypot(sx, sy, sz) || 1; sx *= w / sl; sy *= w / sl; sz *= w / sl;
      const o12 = n * 12;
      pos[o12] = x - ex - sx; pos[o12 + 1] = y - ey - sy; pos[o12 + 2] = z - ez - sz; pos[o12 + 3] = x - ex + sx; pos[o12 + 4] = y - ey + sy; pos[o12 + 5] = z - ez + sz;
      pos[o12 + 6] = x + sx; pos[o12 + 7] = y + sy; pos[o12 + 8] = z + sz; pos[o12 + 9] = x - sx; pos[o12 + 10] = y - sy; pos[o12 + 11] = z - sz;
      al[n * 4] = al[n * 4 + 1] = al[n * 4 + 2] = al[n * 4 + 3] = a; n++;
    },
    end() { geo.setDrawRange(0, n * 6); geo.attributes.position.needsUpdate = true; geo.attributes.aA.needsUpdate = true; mesh.visible = n > 0; },
  };
}

// bubbles: camera-facing discs drawn as a bright rim with a highlight (a pool rewritten every frame)
function laBubbles(scene, max = 3000) {
  const P = laPuffs(scene, max, { soft: 1.0 });
  P.mat.fragmentShader = `uniform vec3 fogCol; uniform float fogDen, soft, nearA, nearB; varying float vA; varying vec3 vC; varying float vD; varying vec2 vQ;
    void main(){ float r = length(vQ); if (r > 1.0) discard; float rim = smoothstep(0.62, 0.92, r) * (1.0 - smoothstep(0.92, 1.0, r)); float hl = exp(-dot(vQ - vec2(-0.35, 0.4), vQ - vec2(-0.35, 0.4)) * 30.0);
      float a = vA * (0.12 + 0.75 * rim + 0.9 * hl); float f = 1.0 - exp(-fogDen * vD); gl_FragColor = vec4(mix(vC, fogCol, f), a * (1.0 - 0.6 * f)); }`;
  P.mat.needsUpdate = true;
  return P;
}

function laBuildLiquid(S) {
  const scene = S.scene, Lq = {};
  // ---------------------------------------------------------------- the surface (one plane, 2.4 km wide; both sides)
  const reflRT = new THREE.WebGLRenderTarget(960, 540, { type: THREE.HalfFloatType });
  const texM = new THREE.Matrix4();
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: {
      uCam: { value: new THREE.Vector3() }, uTime: { value: 0 }, uBelow: { value: 0 }, uRain: { value: 0 }, uChurn: { value: 0 }, uRefl: { value: 0 },
      uDeep: { value: new THREE.Color('#0b1a22') }, uSkyR: { value: new THREE.Color('#5a6670') }, uMirror: { value: new THREE.Color('#1c3a48') }, uWin: { value: new THREE.Color('#000000') },
      uSun: { value: new THREE.Vector3(0, 1, 0) }, uSunK: { value: 0 }, uFogCol: { value: new THREE.Color('#000') }, uFogD: { value: 0 }, uWinA: { value: 0.1 },
      tRefl: { value: reflRT.texture }, uTexM: { value: texM }, uRing: { value: 0.5 },
    },
    vertexShader: `uniform mat4 uTexM; varying vec3 vW; varying vec4 vP; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vP = uTexM * vec4(position, 1.0); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform vec3 uCam, uDeep, uSkyR, uMirror, uWin, uSun, uFogCol; uniform float uTime, uBelow, uRain, uChurn, uRefl, uSunK, uFogD, uWinA, uRing;
      uniform sampler2D tRefl; varying vec3 vW; varying vec4 vP;
      float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f); return mix(mix(h2(i), h2(i + vec2(1, 0)), u.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), u.x), u.y); }
      // rain rings: a hashed grid of rings expanding and fading
      float rings(vec2 p, float t){ vec2 c = floor(p), f = fract(p) - 0.5; float ph = h2(c); float a = fract(t * 1.3 + ph); vec2 o = vec2(h2(c + 3.1), h2(c + 7.7)) - 0.5; float d = length(f - o * 0.5);
        return sin(clamp((d - a * 0.5) * 40.0, -3.14, 3.14)) * (1.0 - a) * smoothstep(0.5, 0.0, d); }
      void main(){
        vec2 p = vW.xz; float t = uTime;
        float e = 0.04;
        float hx = 0.0, hz = 0.0;
        // swell + chop
        hx += 0.05 * cos(p.x * 0.35 + t * 0.8) + 0.03 * cos(p.x * 0.9 + p.y * 0.4 + t * 1.3);
        hz += 0.05 * cos(p.y * 0.3 + t * 0.7) + 0.03 * cos(p.y * 1.1 - p.x * 0.5 + t * 1.1);
        // rain: rings at two scales; the crash: churned white
        float r1 = rings(p * 1.6, t) + rings(p * 3.1 + 17.0, t * 1.2);
        hx += uRain * 0.35 * (rings(p * 1.6 + vec2(e, 0.0), t) - rings(p * 1.6 - vec2(e, 0.0), t));
        hz += uRain * 0.35 * (rings(p * 1.6 + vec2(0.0, e), t) - rings(p * 1.6 - vec2(0.0, e), t));
        float ch = vn(p * 0.8 + t * 3.0) * vn(p * 2.3 - t * 2.0);
        hx += uChurn * 0.8 * (vn(p * 1.7 + t * 4.0) - 0.5); hz += uChurn * 0.8 * (vn(p * 1.9 - t * 3.0 + 9.0) - 0.5);
        vec3 n = normalize(vec3(-hx, 1.0, -hz));
        vec3 v = normalize(vW - uCam); float dist = length(vW - uCam);
        vec3 col; float a;
        if (uBelow > 0.5) {
          // from below: Snell's window (the sky, squeezed into a 56° cone) and outside it a mirror of the street
          float c = dot(v, n);
          float win = smoothstep(${LA_COSC.toFixed(4)} - 0.012, ${LA_COSC.toFixed(4)} + 0.012, c);
          vec3 m = uMirror * (0.82 + 0.3 * vn(p * 0.5 + t * 0.2));
          if (uRefl > 0.5) { vec4 q = vP; q.xy += (n.xz) * 0.6 * q.w; m = mix(m, texture2DProj(tRefl, q).rgb * 0.9, 0.85); }
          float ring = exp(-pow((c - ${LA_COSC.toFixed(4)}) / 0.018, 2.0));
          col = mix(m, uWin, win) + vec3(0.55, 0.75, 1.0) * ring * uRing;
          // the sun, seen through the window (bent: higher in the sky than it is)
          col += vec3(1.0, 0.95, 0.85) * uSunK * (pow(max(dot(normalize(v + 0.0 * n), uSun), 0.0), 900.0) * 30.0 + pow(max(dot(v, uSun), 0.0), 40.0) * 0.6) * win;
          col += vec3(0.9) * uChurn * smoothstep(0.35, 0.7, ch);
          a = mix(0.96, uWinA, win);
          float f = 1.0 - exp(-uFogD * dist); col = mix(col, uFogCol, f); a = mix(a, 1.0, f);
        } else {
          // from above: the body of it (clear, dark at depth) and the sky's reflection (Fresnel)
          float fr = 0.03 + 0.97 * pow(1.0 - max(dot(-v, n), 0.0), 5.0);
          col = mix(uDeep, uSkyR, fr) + vec3(0.9, 0.95, 1.0) * uRain * 0.25 * max(r1, 0.0);
          col += vec3(1.0, 0.92, 0.8) * uSunK * pow(max(dot(reflect(v, n), uSun), 0.0), 300.0) * 6.0;
          col = mix(col, vec3(0.92, 0.95, 0.97), uChurn * smoothstep(0.25, 0.6, ch));
          a = mix(0.62, 0.97, fr); a = max(a, uChurn * 0.9);
          float f = 1.0 - exp(-uFogD * dist); col = mix(col, uFogCol, f);
        }
        gl_FragColor = vec4(col, a);
      }`,
  });
  const surf = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400, 1, 1), mat); surf.rotation.x = -Math.PI / 2; surf.renderOrder = 6; surf.frustumCulled = false; scene.add(surf);
  Lq.surf = surf; Lq.mat = mat; Lq.reflRT = reflRT; Lq.texM = texM; Lq.reflCam = new THREE.PerspectiveCamera();
  // ---------------------------------------------------------------- rain (outdoors, round the camera), drops in your room, the crash
  Lq.rain = laStreaks(scene, 9000, { color: '#dfe8ee' });
  Lq.crash = laStreaks(scene, 2500, { color: '#f4f8ff', additive: true, order: 8 });
  Lq.splash = laPuffs(scene, 2500, { soft: 1.6 });
  Lq.bub = laBubbles(scene, 14000);
  Lq.shafts = laStreaks(scene, 60, { color: '#bfe6ff', additive: true, order: 3 });
  // ---------------------------------------------------------------- the ripple-light on the bottom (an additive layer over the ground)
  { const cm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
      uniforms: { uT: { value: 0 }, uK: { value: 0 }, uCol: { value: new THREE.Color('#d8f2ff') } },
      vertexShader: 'varying vec2 vP; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `uniform float uT, uK; uniform vec3 uCol; varying vec2 vP;
        float c1(vec2 p, float t){ vec2 q = p; float s = 0.0; for (int i = 0; i < 3; i++) { q += vec2(sin(q.y * 1.7 + t * 0.9), cos(q.x * 1.3 - t * 0.7)) * 0.45; s += abs(sin(q.x * 1.1) * cos(q.y * 1.2)); }
          return pow(1.0 - clamp(s / 3.0, 0.0, 1.0), 6.0); }
        void main(){ float k = c1(vP * 0.9, uT) + 0.6 * c1(vP * 1.7 + 4.0, uT * 1.3); gl_FragColor = vec4(uCol * k * uK, 1.0); }` });
    const parts = [];
    for (const [x, z, w, d, y] of [[0, -5.5, 640, 7.2, 0.012], [0, -1, 640, 2, 0.135], [0, -10.5, 640, 3, 0.135], [0, -56, 140, 88, 0.02]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d, 1, 1), cm); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.renderOrder = 2; scene.add(m); parts.push(m); }
    Lq.caustic = { cm, parts }; }
  // ---------------------------------------------------------------- the stars and the sun's disc (a black sky from 3:10)
  { const N = 2200, r = new RNG(907), p = new Float32Array(N * 3), c = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { const u = r.range(-0.15, 1), a = r.range(0, 6.283), q = Math.sqrt(1 - u * u), R = 4500; p.set([Math.cos(a) * q * R, u * R, Math.sin(a) * q * R], i * 3); const b = Math.pow(r.next(), 3) * 0.9 + 0.1, w = r.range(0.85, 1.0); c.set([b * w, b * w, b], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    const m = new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, fog: false });
    Lq.stars = new THREE.Points(g, m); Lq.stars.renderOrder = -9; Lq.stars.frustumCulled = false; scene.add(Lq.stars);
    const sd = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshBasicMaterial({ color: '#fff6e8', transparent: true, opacity: 0, fog: false, depthWrite: false, toneMapped: false }));
    sd.renderOrder = -8; scene.add(sd); Lq.sunDisc = sd; }
  Lq.update = (s, cam, o) => laLiquidUpdate(Lq, s, cam, o || {});
  // the reflection of the street in the underside of the surface (rendered only in the shots that need it)
  Lq.renderRefl = (renderer, sc, cam) => laReflRender(Lq, renderer, sc, cam);
  return Lq;
}

// the planar reflection under the surface (the mirror.js technique, with the plane's normal pointing down)
function laReflRender(Lq, renderer, scene, camera) {
  const level = Lq.surf.position.y, rc = Lq.reflCam;
  if (camera.position.y > level - 0.05) return false;
  rc.position.set(camera.position.x, 2 * level - camera.position.y, camera.position.z);
  const dir = new THREE.Vector3(); camera.getWorldDirection(dir); dir.y = -dir.y;
  const up = camera.up.clone(); up.y = -up.y;
  rc.up.copy(up); rc.lookAt(rc.position.clone().add(dir));
  rc.near = camera.near; rc.far = camera.far; rc.projectionMatrix.copy(camera.projectionMatrix); rc.updateMatrixWorld();
  rc.matrixWorldInverse.copy(rc.matrixWorld).invert();
  Lq.surf.updateMatrixWorld();
  Lq.texM.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1).multiply(rc.projectionMatrix).multiply(rc.matrixWorldInverse).multiply(Lq.surf.matrixWorld);
  const vis = Lq.surf.visible; Lq.surf.visible = false;
  const prev = renderer.getRenderTarget(), prevS = renderer.shadowMap.autoUpdate, prevClip = renderer.clippingPlanes;
  renderer.shadowMap.autoUpdate = false;
  renderer.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, -1, 0), level + 0.02)];       // only what is under the surface
  renderer.setRenderTarget(Lq.reflRT); renderer.clear(); renderer.render(scene, rc);
  renderer.clippingPlanes = prevClip; renderer.shadowMap.autoUpdate = prevS; renderer.setRenderTarget(prev);
  Lq.surf.visible = vis;
  return true;
}

const _laCP = new THREE.Vector3();
// o: { inside (the room: drops forming in it, R), room (R), below (cam under the surface), refl, focus [x,y,z] }
function laLiquidUpdate(Lq, s, cam, o) {
  const d = laDepth(s), level = Math.max(0.004, d), below = cam.position.y < level, cp = cam.position, t = s;
  Lq.surf.position.y = level; Lq.surf.position.x = Math.round(cp.x / 200) * 200; Lq.surf.position.z = Math.round(cp.z / 200) * 200;
  Lq.surf.visible = d > 0.003 && o.surface !== false;
  const U = Lq.mat.uniforms, dusk = laDusk(s), black = laBlack(s), sunK = laSunOut(s), rate = laRate(s), crash = s >= 600 && s < 612;
  U.uCam.value.copy(cp); U.uTime.value = s; U.uBelow.value = below ? 1 : 0; U.uRefl.value = o.refl ? 1 : 0;
  U.uRain.value = s < 612 ? MathX.clamp(rate * 140, 0.15, 1) * (s > 0 ? 1 : 0) : 0.0;
  U.uChurn.value = crash ? Math.min(1, laSm(s, 600, 603) * (1 - laSm(s, 609, 616))) : 0;
  U.uSunK.value = sunK;
  const sd = below ? o.sunUW : o.sunDir;
  U.uSun.value.set(sd[0], sd[1], sd[2]);
  // the colours: the sky it reflects (from above), the mirror (from below), the window (the sky seen through it)
  U.uSkyR.value.setRGB((0.42 - 0.36 * dusk) * (1 - black) + 0.01 * black, (0.48 - 0.4 * dusk) * (1 - black) + 0.012 * black, (0.54 - 0.43 * dusk) * (1 - black) + 0.016 * black);
  U.uDeep.value.setRGB((0.05 - 0.035 * dusk) * (1 - black) + 0.03 * black, (0.1 - 0.07 * dusk) * (1 - black) + 0.12 * black, (0.13 - 0.09 * dusk) * (1 - black) + 0.15 * black);
  U.uMirror.value.copy(o.uwCol).multiplyScalar(below ? 1.35 : 1);
  U.uWin.value.setRGB(0.24 * (1 - dusk) * (1 - black) + 0.012 * black, 0.3 * (1 - dusk) * (1 - black) + 0.02 * black, 0.36 * (1 - dusk) * (1 - black) + 0.04 * black);
  U.uWinA.value = below ? (black > 0.5 ? 0.06 : 0.25) : 0.1;
  U.uRing.value = below ? 0.25 + 0.35 * sunK : 0;
  U.uFogCol.value.copy(o.fogCol); U.uFogD.value = o.fogD;
  // ---- rain outdoors (through the gas: only above the surface), round the camera
  const R = Lq.rain; R.begin(); R.mesh.renderOrder = below ? 5 : 7; Lq.crash.mesh.renderOrder = below ? 5 : 8;
  if (s > 0 && s < 600 && !o.noRain) {
    const n = Math.round(MathX.clamp(400 + rate * 1.4e6, 0, R.N) * (o.rainK ?? 1)), RR = o.rainR || 14, H = 16, v = laVLand(s) || 5, len = 0.35 + v * 0.04;
    for (let i = 0; i < n; i++) {
      const hx = laR(i, 11), hz = laR(i, 23), hy = laR(i, 37);
      const x = cp.x + (((hx * 2 * RR - cp.x) % (2 * RR)) + 2 * RR) % (2 * RR) - RR, z = cp.z + (((hz * 2 * RR - cp.z) % (2 * RR)) + 2 * RR) % (2 * RR) - RR;
      const top = cp.y + H * 0.6, ph = ((s * v / H + hy) % 1 + 1) % 1, y = top - ph * H;
      if (y < level) continue;
      if (o.inRoom && o.inRoom(x, y, z)) continue;
      const dist = Math.hypot(x - cp.x, y - cp.y, z - cp.z);
      R.add(cp, x, y, z, 0, -1, 0, len, 0.006 + 0.0012 * dist, 0.5 * (o.rainA ?? 1));
    }
  }
  // ---- drops forming in your room (from nothing, everywhere at once; they grow and fall)
  if (o.room && s > -0.5 && s < 600) {
    const Rm = o.room, L = LA_ROOM, n = Math.round(MathX.clamp(500 + s * 8, 0, 2600) * (o.dropK ?? 1));
    for (let i = 0; i < n; i++) {
      const per = 1.2 + 0.8 * laR(i, 5), born = laR(i, 7) * per, k = Math.floor((s - born) / per), age = s - born - k * per;
      if (s < born || age < 0) continue;
      const seed = i * 97 + k * 13, lx = (laR(seed, 3) - 0.5) * (L.W - 0.3), lz = (laR(seed, 4) - 0.5) * (L.D - 0.3), ly0 = 0.3 + laR(seed, 6) * (L.H - 0.45);
      const fall = Math.min(0.5 * 9.81 * Math.max(0, age - 0.35) ** 2, 30), ly = ly0 - fall; if (ly < 0.01) continue;
      const w = Rm.toWorld(lx, ly, lz, _laCP), gd = w.distanceTo(cp); if (gd < 0.35) continue;
      const grow = Math.min(1, age / 0.35), v = Math.min(5, 9.81 * Math.max(0, age - 0.35));
      R.add(cp, w.x, w.y, w.z, 0, -1, 0, 0.012 + v * 0.03, 0.0032 * (0.5 + 0.5 * grow), (0.75 + 0.25 * grow) * (o.dropA ?? 1));
    }
  }
  R.end();
  R.mat.uniforms.uCol.value.setRGB(0.86 - 0.3 * dusk, 0.9 - 0.3 * dusk, 0.94 - 0.28 * dusk); R.mat.uniforms.fogCol.value.copy(o.fogCol); R.mat.uniforms.fogDen.value = o.fogD;
  // ---- the crash: drops out of a black sky at ~130 m/s (long, bright streaks), and spray off the surface
  const C = Lq.crash; C.begin();
  if (s >= 599.6 && s < 640 && !below) {
    const k = s < 612 ? Math.min(1, laSm(s, 599.6, 601)) * (1 - laSm(s, 609, 612)) : 0.04 * (1 - laSm(s, 612, 640)), n = Math.round(C.N * k);
    for (let i = 0; i < n; i++) {
      const RR = 40, hx = laR(i, 51), hz = laR(i, 52), hy = laR(i, 53), v = 60 + 180 * laR(i, 54), H = 260;
      const x = cp.x + (hx - 0.5) * 2 * RR, z = cp.z + (hz - 0.5) * 2 * RR, ph = ((s * v / H + hy) % 1 + 1) % 1, y = level + 1 + (1 - ph) * H;
      C.add(cp, x, y, z, 0, -1, 0, v * 0.03, 0.01 + 0.001 * Math.hypot(x - cp.x, z - cp.z), 0.55);
    }
  }
  if (s >= 599.6 && s < 640 && below) {
    // seen from under the surface: bright streaks stopping at it (inside the window only)
    const k = s < 612 ? Math.min(1, laSm(s, 599.6, 601)) * (1 - laSm(s, 609, 612)) : 0.03 * (1 - laSm(s, 612, 640)), n = Math.round(C.N * 0.5 * k);
    for (let i = 0; i < n; i++) { const hx = laR(i, 61), hz = laR(i, 62), hy = laR(i, 63), v = 60 + 180 * laR(i, 64), H = 200, rr = (level - cp.y + 2) * 1.2;
      const x = cp.x + (hx - 0.5) * 2 * rr, z = cp.z + (hz - 0.5) * 2 * rr, ph = ((s * v / H + hy) % 1 + 1) % 1, y = level + 0.5 + (1 - ph) * H;
      C.add(cp, x, y, z, 0, -1, 0, v * 0.03, 0.02, 0.7); }
  }
  C.end();
  // ---- splashes on the surface round the camera (from above): small white bursts where drops land
  const Sp = Lq.splash; Sp.begin();
  if (!below && s > 0 && s < 612 && d > 0.004) {
    const n = Math.round(MathX.clamp(80 + rate * 4e5, 0, 900) * (crash ? 2.5 : 1)), RR = 10;
    for (let i = 0; i < n; i++) { const per = 0.35, ph = ((s / per + laR(i, 71)) % 1), k = Math.floor(s / per + laR(i, 71)), x = cp.x + (laR(i * 7 + k, 72) - 0.5) * 2 * RR, z = cp.z + (laR(i * 7 + k, 73) - 0.5) * 2 * RR;
      Sp.add(x, level + 0.02 + ph * (crash ? 0.8 : 0.06), z, (crash ? 0.25 : 0.035) + ph * (crash ? 0.6 : 0.05), 0.35 * (1 - ph), 0.9, 0.93, 0.96); }
  }
  Sp.end();
  // ---- bubbles: o.bubbles = [{ x, y, z, n, r, rate, life, h }] sources; plus the fizz everywhere from 4:00
  const Bb = Lq.bub; Bb.begin();
  for (const src of o.bubbles || []) {
    for (let i = 0; i < src.n; i++) { const per = src.life, ph = ((s / per + laR(i, src.seed || 81)) % 1), k = Math.floor(s / per + laR(i, src.seed || 81)), j = i * 13 + k;
      const x = src.x + (laR(j, 82) - 0.5) * src.r * 2 + 0.03 * Math.sin(s * 9 + i), z = src.z + (laR(j, 83) - 0.5) * src.r * 2, y = src.y + ph * src.h;
      if (y > level - 0.01 && !src.air) continue;
      Bb.add(x, y, z, (src.size || 0.006) * (0.6 + 0.8 * laR(j, 84)) * (1 + ph * (src.grow || 0)), 0.8 * Math.min(1, ph * 6) * (1 - ph * 0.3), 0.9, 0.96, 1.0); }
  }
  if (s > LAP.back - 0.3) {
    const k = laFizz(s), RR = 8, H = level;
    const age = s - LAP.back, N = Math.round(10500 * k * MathX.clamp(0.35 + age / 4, 0, 1));
    for (let i = 0; i < N; i++) { const v = 0.6 + 1.6 * laR(i, 91), x = cp.x + (laR(i, 93) - 0.5) * 2 * RR, z = cp.z + (laR(i, 94) - 0.5) * 2 * RR, born = laR(i, 92) * 1.4;
      // (each starts where it forms, anywhere in the liquid, and rises; near the camera they're big and many)
      const y0 = laR(i, 96) * H, y = y0 + Math.max(0, age - born) * v * (1 + 0.4 * age); if (age < born || y > H) continue;
      Bb.add(x + 0.06 * Math.sin(s * 5 + i), y, z, (0.03 + 0.12 * laR(i, 95) ** 2) * (1 + 0.25 * age), 0.75 * laSm(age - born, 0, 0.3), 0.92, 0.97, 1.0); }
  }
  Bb.end();
  // ---- the sun's shafts and the ripple-light on the bottom (under the surface, sun out)
  const Sh = Lq.shafts; Sh.begin();
  const light = below ? sunK : 0;
  if (light > 0.01) {
    const rd = o.sunUW;                                        // the sun's direction in the liquid (refracted: steeper)
    for (let i = 0; i < 40; i++) { const x = cp.x + (laR(i, 101) - 0.5) * 36 + 2 * Math.sin(s * 0.13 + i), z = cp.z + (laR(i, 102) - 0.5) * 36 + 2 * Math.cos(s * 0.11 + i * 2);
      const L = level + 2; Sh.add(cp, x + rd[0] * L * 0.5, level - 0.05 - 0, z + rd[2] * L * 0.5, -rd[0], -rd[1], -rd[2], -L * 1.0, 0.25 + 0.5 * laR(i, 103), 0.05 * light * (0.4 + 0.6 * Math.sin(s * 0.7 + i * 1.7) ** 2)); }
  }
  Sh.end();
  Lq.caustic.cm.uniforms.uT.value = s; Lq.caustic.cm.uniforms.uK.value = 0.22 * light * (o.causticK ?? 1);
  for (const m of Lq.caustic.parts) m.visible = light > 0.01;
  // ---- stars and the sun's disc
  Lq.stars.material.opacity = black * (below ? 0.55 : 0.9) * (o.starK ?? 1); Lq.stars.position.copy(cp); Lq.stars.visible = black > 0.01;
  { const D = 4200, sdk = laSunOut(s) * black; Lq.sunDisc.visible = sdk > 0.01; Lq.sunDisc.position.set(cp.x + sd[0] * D, cp.y + sd[1] * D, cp.z + sd[2] * D); Lq.sunDisc.lookAt(cp); Lq.sunDisc.scale.setScalar(D * 0.0047 * 1.6); Lq.sunDisc.material.opacity = sdk; Lq.sunDisc.material.color.setRGB(3, 2.9, 2.7); }
  Lq.below = below; Lq.level = level;
}
