/* =====================================================================
   TOON — the hybrid look's materials and small geometry helpers (film-side; reusable by later hybrid films).
   - gbMat(color, opts): a matte MeshStandardMaterial (no plastic shine) with an optional stylised RIM LIGHT:
     a warm edge glow on the side facing the key/back light (the reference's "bright rim on dark silhouettes"),
     driven by one shared uniform set (GB_RIM) that film.js updates every frame from the shot's key light.
   - gbRoundBox, gbLathe, gbTube, gbCapsule: authored shapes instead of primitive boxes.
   ===================================================================== */

const GB_RIM = {
  dir: { value: new THREE.Vector3(0, 0, -1) },     // direction TOWARD the rim light, in VIEW space (film.js sets it per frame)
  color: { value: new THREE.Color(1.0, 0.62, 0.32) },
  gain: { value: 1.0 },                             // global rim gain per shot
};

const _gbMatCache = new Map();
// opts: rough (0.88), metal (0), rim (0 = none), emissive (hex), emi (intensity), name, side, flat, fog (true), transparent, opacity
function gbMat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (_gbMatCache.has(key)) return _gbMatCache.get(key);
  const m = new THREE.MeshStandardMaterial({
    color, roughness: opts.rough !== undefined ? opts.rough : 0.88, metalness: opts.metal || 0,
    flatShading: !!opts.flat, side: opts.side || THREE.FrontSide, name: opts.name || 'gb',
    fog: opts.fog !== false, transparent: !!opts.transparent, opacity: opts.opacity !== undefined ? opts.opacity : 1,
    depthWrite: opts.depthWrite !== undefined ? opts.depthWrite : true,
  });
  if (opts.emissive) { m.emissive = new THREE.Color(opts.emissive); m.emissiveIntensity = opts.emi !== undefined ? opts.emi : 1; }
  m.envMapIntensity = opts.env !== undefined ? opts.env : 0.35;
  if (opts.rim) gbAddRim(m, opts.rim, opts.rimWidth || 0);
  _gbMatCache.set(key, m);
  return m;
}

// the rim term: fresnel edge × (facing the light side), added as emission so dark silhouettes keep a lit outline
function gbAddRim(m, k, width = 0) {
  const lo = 0.5 - width * 0.2, hi = 0.88 - width * 0.12;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uRimDir = GB_RIM.dir; sh.uniforms.uRimColor = GB_RIM.color; sh.uniforms.uRimGain = GB_RIM.gain;
    sh.uniforms.uRimK = { value: k };
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uRimDir; uniform vec3 uRimColor; uniform float uRimK, uRimGain;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          vec3 gbV = normalize(vViewPosition);
          float gbF = 1.0 - clamp(dot(normal, gbV), 0.0, 1.0);
          float gbS = clamp(dot(normal, uRimDir) * 0.8 + 0.2, 0.0, 1.0);
          totalEmissiveRadiance += uRimColor * (uRimK * uRimGain) * smoothstep(${lo.toFixed(3)}, ${hi.toFixed(3)}, gbF) * gbS * gbS;
        }`);
  };
  m.customProgramCacheKey = () => 'gbrim' + lo.toFixed(3);
  return m;
}

// a rounded box: a subdivided box whose vertices are pulled onto a rounded shell (radius r)
function gbRoundBox(w, h, d, r = 0.02, seg = 3) {
  const g = new THREE.BoxGeometry(w, h, d, seg * 2, seg * 2, seg * 2);
  const p = g.attributes.position, v = new THREE.Vector3(), inner = new THREE.Vector3(w / 2 - r, h / 2 - r, d / 2 - r);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const c = new THREE.Vector3(MathX.clamp(v.x, -inner.x, inner.x), MathX.clamp(v.y, -inner.y, inner.y), MathX.clamp(v.z, -inner.z, inner.z));
    const o = v.clone().sub(c);
    if (o.lengthSq() > 1e-12) o.setLength(r);
    p.setXYZ(i, c.x + o.x, c.y + o.y, c.z + o.z);
  }
  g.computeVertexNormals();
  return g;
}

// lathe from [radius, y] pairs
function gbLathe(pts, seg = 28) { return new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg); }

// a tube through world/local points
function gbTube(pts, r, seg = 24, rs = 6) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => (p.isVector3 ? p : new THREE.Vector3(...p))));
  return new THREE.TubeGeometry(curve, seg, r, rs, false);
}

function gbCapsule(r, len, cs = 6, rs = 10) { return new THREE.CapsuleGeometry(r, len, cs, rs); }

// a mesh helper: add geometry with a material to a parent at a position (shadows on by default)
function gbAdd(parent, geo, mat, x = 0, y = 0, z = 0, opts = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = opts.cast !== false; m.receiveShadow = opts.receive !== false;
  if (opts.rx) m.rotation.x = opts.rx; if (opts.ry) m.rotation.y = opts.ry; if (opts.rz) m.rotation.z = opts.rz;
  if (opts.s) { if (Array.isArray(opts.s)) m.scale.set(...opts.s); else m.scale.setScalar(opts.s); }
  if (opts.name) m.name = opts.name;
  parent.add(m);
  return m;
}

// a damped spring impulse: the response of a light, springy thing to a kick at t0 (pure function of t)
function gbSpring(t, t0, amp, freq, decay) {
  const u = t - t0;
  if (u <= 0) return 0;
  return amp * Math.exp(-decay * u) * Math.sin(Math.PI * 2 * freq * u);
}
// a settle: 0 before t0, eases to 1 with a damped overshoot (weight landing)
function gbSettle(t, t0, dur, over = 0.18, freq = 3.2) {
  const u = t - t0;
  if (u <= 0) return 0;
  const a = 1 - Math.exp(-u * 6 / dur);
  return a + over * Math.exp(-u * 5 / dur) * Math.sin(Math.PI * 2 * freq * u) * MathX.smooth(u, 0, dur * 0.25);
}

// soft vertical gradient sky dome (dawn): zenith → band → horizon glow, with a sun disc and glow
function gbSkyMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      uTop: { value: new THREE.Color('#2a2d63') }, uMid: { value: new THREE.Color('#7c5c9c') }, uLow: { value: new THREE.Color('#f0a678') },
      uHor: { value: new THREE.Color('#ffd29a') }, uSun: { value: new THREE.Vector3(0.12, 0.09, -1).normalize() }, uSunK: { value: 1.0 },
    },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; gl_Position.z = gl_Position.w; }`,
    fragmentShader: `
      uniform vec3 uTop, uMid, uLow, uHor, uSun; uniform float uSunK; varying vec3 vDir;
      void main(){
        vec3 d = normalize(vDir); float h = d.y;
        float sunSide = dot(normalize(vec3(d.x, 0.0, d.z)), normalize(vec3(uSun.x, 0.0, uSun.z))) * 0.5 + 0.5;
        vec3 c = mix(uLow, uMid, smoothstep(0.02, 0.22, h));
        c = mix(c, uTop, smoothstep(0.2, 0.75, h));
        c = mix(c, uHor, (1.0 - smoothstep(-0.02, 0.12, h)) * (0.35 + 0.65 * sunSide));
        c = mix(c * vec3(0.78, 0.8, 1.0), c, sunSide);
        float s = max(dot(d, uSun), 0.0);
        c += vec3(1.0, 0.72, 0.42) * (pow(s, 12.0) * 0.55 + pow(s, 90.0) * 1.2) * uSunK;
        c += vec3(1.6, 1.3, 0.9) * smoothstep(0.9993, 0.99965, s) * 2.2 * uSunK;
        if (h < 0.0) c = mix(c, uLow * 0.55, smoothstep(0.0, -0.1, h));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
}
