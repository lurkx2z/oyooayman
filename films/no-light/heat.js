/* =====================================================================
   HEAT — the film's "heat camera": every surface drawn by its temperature (°C), as a long-wave infrared camera
   (8–14 µm, white = hot) would see it. Nobody in the story can see this picture; the HUD says so.
     nlHeatMat(T, o)       a material for a surface at T °C. o: { hot: [x, y, z, r, T2] (a warm spot in the mesh's own
                           space: an engine, a face), var (°C of mottling), emis (emissivity, 0.95; metal 0.3: it
                           shows the cold sky instead), vT (use the geometry's own aT attribute), dyn (its own uniform) }
     nlReg(set, mesh, heatMat)   the mesh's colour material is kept; nlMode(set, 'heat' | 'colour') swaps them all
     nlHeatPerson(set, person, o) / nlHeatCar(set, vehicle, o)   temperatures for the engine's people and cars
   The palette: −24 °C black, +12 °C white (a fixed range, as a camera on manual, set for a winter scene), with a
   little cold blue in the blacks; above +12 the values go past 1 and the post's bloom makes them glare (fire, lamps, engines, the Sun).
   The grazing-angle fall-off of emissivity (surfaces seen edge-on reflect the cold sky) gives things their shape.
   ===================================================================== */

const NL_HU = {
  uLo: { value: -24 }, uHi: { value: 12 }, uSky: { value: -40 }, uFogD: { value: 0.0009 }, uFogT: { value: -12 }, uTime: { value: 0 },
};
const NL_HEAT_GLSL = {
  vert: `varying vec3 vL; varying vec3 vWN; varying vec3 vWP; varying float vAT; varying float vIT;
    #ifdef USE_AT
    attribute float aT;
    #endif
    void main(){
      vec4 lp = vec4(position, 1.0); vec3 n = normal; vIT = 0.0;
      #ifdef USE_INSTANCING
      lp = instanceMatrix * lp; n = mat3(instanceMatrix) * n;
      #endif
      #ifdef USE_INSTANCING_COLOR
      vIT = (instanceColor.r - 0.5) * 60.0;
      #endif
      #ifdef USE_AT
      vAT = aT;
      #else
      vAT = 0.0;
      #endif
      vL = position; vec4 wp = modelMatrix * lp; vWP = wp.xyz; vWN = normalize(mat3(modelMatrix) * n);
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`,
  frag: `uniform float uT, uHotT, uVar, uEmis, uLo, uHi, uSky, uFogD, uFogT, uTime, uOver; uniform vec4 uHot;
    varying vec3 vL; varying vec3 vWN; varying vec3 vWP; varying float vAT; varying float vIT;
    float h3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
    float vn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
                 mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
    // ACES (the post's) inverted, so that a palette value v ends up on screen as that grey
    vec3 acesInv(vec3 y){ const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14; y = min(y, vec3(0.985));
      vec3 A = a - c * y, B = b - d * y, C = -e * y; return (-B + sqrt(B * B - 4.0 * A * C)) / (2.0 * A); }
    void main(){
      float T = uT + vAT + vIT;
      if (uHot.w > 0.0) { vec3 d = vL - uHot.xyz; T = mix(T, uHotT, exp(-dot(d, d) / (uHot.w * uHot.w))); }
      if (uVar > 0.0) T += uVar * (vn3(vWP * 0.9) - 0.5) + uVar * 0.5 * (vn3(vWP * 3.7 + 7.0) - 0.5);
      vec3 V = normalize(cameraPosition - vWP), N = normalize(vWN);
      float c = abs(dot(N, V));
      float e = uEmis * (0.8 + 0.2 * pow(c, 0.3));
      float Te = mix(uSky, T, e);
      float dist = length(cameraPosition - vWP);
      Te = mix(Te, uFogT, 1.0 - exp(-uFogD * dist));
      float v = (Te - uLo) / (uHi - uLo);
      float g = clamp(v, 0.0, 1.0);
      vec3 col = mix(vec3(0.010, 0.014, 0.024), vec3(1.0, 0.985, 0.955), pow(g, 1.08));
      col = mix(col, col * vec3(0.93, 0.97, 1.06), 1.0 - g);              // the coldest a little blue
      vec3 lin = acesInv(pow(col, vec3(2.2)));
      lin += vec3(1.0, 0.96, 0.9) * max(0.0, v - 1.0) * uOver;            // hotter than the range: glare
      gl_FragColor = vec4(lin, 1.0);
    }`,
};
const NL_HEAT_CACHE = new Map();
function nlHeatMat(T, o = {}) {
  const key = o.dyn ? null : JSON.stringify([T, o.hot || 0, o.var || 0, o.emis ?? 0.95, o.vT || 0, o.side || 0, o.over ?? 1.2]);
  if (key && NL_HEAT_CACHE.has(key)) return NL_HEAT_CACHE.get(key);
  const h = o.hot || [0, 0, 0, 0, T];
  const m = new THREE.ShaderMaterial({
    uniforms: Object.assign({ uT: { value: T }, uHot: { value: new THREE.Vector4(h[0], h[1], h[2], h[3]) }, uHotT: { value: h[4] }, uVar: { value: o.var || 0 }, uEmis: { value: o.emis ?? 0.95 }, uOver: { value: o.over ?? 1.2 } }, NL_HU),
    vertexShader: NL_HEAT_GLSL.vert, fragmentShader: NL_HEAT_GLSL.frag,
    defines: o.vT ? { USE_AT: '' } : {}, side: o.side ? THREE.DoubleSide : THREE.FrontSide,
    polygonOffset: !!o.po, polygonOffsetFactor: o.po ? o.po[0] : 0, polygonOffsetUnits: o.po ? o.po[1] : 0,
  });
  m.userData.heat = true;
  if (key) NL_HEAT_CACHE.set(key, m);
  return m;
}
// a mesh in both looks: its colour material now, heatMat in the heat view
function nlReg(set, mesh, heat) {
  (set.reg || (set.reg = [])).push({ m: mesh, c: mesh.material, h: heat });
  return mesh;
}
function nlMode(set, mode) {
  if (set._modeNow === mode) return;
  set._modeNow = mode;
  for (const r of set.reg || []) r.m.material = mode === 'heat' ? r.h : r.c;
  for (const f of set.onMode || []) f(mode);
}
// the engine's people: skin warm (the face warmest), hair and hats cool, winter clothes close to the air's
// temperature on the outside. o: { skin, face, cloth, shoes, wet }
function nlHeatPerson(set, person, o = {}) {
  const L = person.look, skinHex = new THREE.Color(SKIN[L.skin % SKIN.length]).getHex(), hairHex = new THREE.Color(L.hair).getHex();
  const glovesHex = L.gloves ? new THREE.Color(L.gloves).getHex() : -1, hatHex = L.hat ? new THREE.Color(L.hat.color).getHex() : -2;
  const shoesHex = new THREE.Color(L.shoes).getHex();
  const cloth = o.cloth ?? -3, skin = o.skin ?? 31;
  person.root.traverse((m) => {
    if (!m.isMesh || m.userData.nlHeat) return;
    const c = m.material && m.material.color ? m.material.color.getHex() : 0;
    let T = cloth, op = { var: 1.5 };
    if (m.userData.blade) { T = -8; op = { emis: 0.3 }; }
    else if (c === skinHex) { T = skin; op = { var: 1.2 }; }
    else if (c === hairHex) T = 4;
    else if (c === hatHex) T = 2;
    else if (c === glovesHex) T = 6;
    else if (c === shoesHex) T = -7;
    if (o.wet) T = Math.min(T, 3);
    nlReg(set, m, nlHeatMat(T, op));
    m.userData.nlHeat = true;
  });
}
// the engine's cars (js/world/vehicles.js): o.engine (°C under the bonnet), o.running (exhaust, tyres warm)
function nlHeatCar(set, v, o = {}) {
  const eng = o.engine ?? 60, L = v.L || 4.5;
  v.group.traverse((m) => {
    if (!m.isMesh) return;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    const hs = mats.map((mt) => {
      const n = (mt && mt.name) || '';
      if (/^paint/.test(n)) return nlHeatMat(-7, { hot: [L / 2 - 0.7, 0.75, 0, 1.25, eng], var: 1.2, emis: 0.9 });
      if (n === 'carGlass') return nlHeatMat(-4, { emis: 0.85 });          // glass is opaque to heat: it shows the glass's own temperature
      if (n === 'chrome') return nlHeatMat(-8, { emis: 0.12 });
      if (n === 'headlight') return nlHeatMat(o.lights === false ? -5 : 70, { emis: 0.9 });
      if (n === 'tire') return nlHeatMat(o.running ? 9 : -6);
      if (n === 'rim') return nlHeatMat(o.running ? 6 : -7, { emis: 0.5 });
      if (n === 'well') return nlHeatMat(o.running ? 14 : -5);
      if (mt && mt.emissive && mt.emissive.r > 0.5 && mt.emissive.g < 0.3) return nlHeatMat(o.lights === false ? -5 : 32);   // tail lamps
      return nlHeatMat(-6, { var: 1 });
    });
    (set.reg || (set.reg = [])).push({ m, c: m.material, h: Array.isArray(m.material) ? hs : hs[0] });
  });
}
// the sky in the heat view: the clear sky is very cold straight up (−45 °C and colder) and warmer towards the
// horizon (more air to look through); the Sun is a hot disc
function nlHeatSky(scene) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(4800, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: Object.assign({ sd: { value: new THREE.Vector3(...NL_SUN).normalize() }, sunK: { value: 1 } }, NL_HU),
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
    fragmentShader: `uniform vec3 sd; uniform float sunK, uLo, uHi; varying vec3 vD;
      vec3 acesInv(vec3 y){ const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14; y = min(y, vec3(0.985)); vec3 A = a - c * y, B = b - d * y, C = -e * y; return (-B + sqrt(B * B - 4.0 * A * C)) / (2.0 * A); }
      void main(){ vec3 D = normalize(vD); float h = max(D.y, 0.0);
        float T = mix(-21.0, -52.0, pow(smoothstep(0.0, 0.5, h), 0.6));
        float g = clamp((T - uLo) / (uHi - uLo), 0.0, 1.0);
        vec3 col = mix(vec3(0.010, 0.014, 0.024), vec3(1.0), pow(g, 1.08));
        vec3 lin = acesInv(pow(col, vec3(2.2)));
        float a = dot(D, sd);   // (vD is interpolated across the sphere's faces: renormalised, or the disc never reaches 1)
        lin += vec3(1.0, 0.98, 0.95) * sunK * (smoothstep(0.99992, 0.99996, a) * 6.0 + pow(max(a, 0.0), 2400.0) * 1.2 + pow(max(a, 0.0), 300.0) * 0.12);
        gl_FragColor = vec4(lin, 1.0); }`,
  }));
  m.renderOrder = -10; m.frustumCulled = false; scene.add(m);
  return m;
}
// a heat-view puff colour for a temperature (for the particle pools: rgb = the linear value the post turns into it)
function nlHeatRGB(T) {
  const lo = NL_HU.uLo.value, hi = NL_HU.uHi.value, v = (T - lo) / (hi - lo), g = MathX.clamp(v, 0, 1);
  const y = Math.pow(0.01 + 0.99 * Math.pow(g, 1.08), 2.2), a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14, yy = Math.min(y, 0.985);
  const A = a - c * yy, B = b - d * yy, C = -e * yy;
  return (-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A) + Math.max(0, v - 1) * 1.2;
}
