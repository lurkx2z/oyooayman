/* =====================================================================
   COSMOS — the pieces the space and deep-space sets share: the star sky (with what near-light speed does to it), the
   planets, the Sun and other stars, the Space Station, Voyager 1 and your tracer.
     · Everything far away is "background": drawn first, without the depth buffer, far to near (painter's order), at its
       true direction and true angular size (a body further than TW_FAR is moved in to TW_FAR and shrunk to match).
       Nothing far writes depth, so you, the Station and Voyager always sit in front of it, and the post's depth effects
       never see huge distances.
     · The star sky is drawn at infinity around the camera. At speed β along v, every star's direction is pulled
       towards v (aberration: cos θ' = (cos θ + β)/(1 + β cos θ)) and its light is shifted (Doppler factor
       D = 1/(γ(1 − β cos θ'))): bluer and brighter ahead, redder and dimmer behind. Real special relativity.
     · All of it is drawn in the renderer's opaque pass (additive or custom blending, never `transparent`), sorted
       by renderOrder alone: the sky, then the bodies far to near, then you and everything near (depth-tested).
   Pure functions of their inputs: no clock, no randomness (seeded hashes only).
   ===================================================================== */

const TW_FAR = 2e6;     // (m) where far bodies are drawn

// ---- GLSL: hashes and noise (3-D value noise, fbm, cells)
const TW_GLSL_NOISE = `
  float cH3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float cN3(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(cH3(i), cH3(i + vec3(1, 0, 0)), f.x), mix(cH3(i + vec3(0, 1, 0)), cH3(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(cH3(i + vec3(0, 0, 1)), cH3(i + vec3(1, 0, 1)), f.x), mix(cH3(i + vec3(0, 1, 1)), cH3(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
  float cF3(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * cN3(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return s; }
  // nearest feature point in a jittered grid: (distance, cell hash)
  vec2 cCell(vec3 p) { vec3 i = floor(p), f = fract(p); float d = 9.0, h = 0.0;
    for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
      vec3 g = vec3(float(x), float(y), float(z)), o = vec3(cH3(i + g), cH3(i + g + 7.1), cH3(i + g + 3.7));
      float e = length(g + o - f); if (e < d) { d = e; h = cH3(i + g + 1.3); } }
    return vec2(d, h); }
  // the direction seen at speed beta along v, for a source in direction d (aberration)
  vec3 cAberr(vec3 d, vec3 v, float beta) { float c = dot(d, v), cp = (c + beta) / (1.0 + beta * c); vec3 q = d - v * c; float l = length(q);
    return l < 1e-6 ? d : v * cp + q / l * sqrt(max(0.0, 1.0 - cp * cp)); }
  float cDopp(vec3 dObs, vec3 v, float beta) { float g = inversesqrt(max(1e-6, 1.0 - beta * beta)); return 1.0 / (g * (1.0 - beta * dot(dObs, v))); }
  vec3 cShift(vec3 col, float D) {
    if (D > 1.0) return mix(col, vec3(0.62, 0.74, 1.0) * max(col.r, max(col.g, col.b)), clamp((D - 1.0) * 0.6, 0.0, 0.85));
    return mix(col, vec3(1.0, 0.32, 0.12) * max(col.r, max(col.g, col.b)), clamp((1.0 - D) * 1.4, 0.0, 0.9)); }
`;

// ---------------------------------------------------------------------------------------------------------------------
// THE STAR SKY: points + speed streaks + the Milky Way's band (a sphere shader). set(cam, v, beta, o)
//   o: { bright, band (0…1), streak (0…1), G (the band's pole, unit), C (towards the galactic centre, unit) }
// ---------------------------------------------------------------------------------------------------------------------
function twStarSky(scene, N = 9000, seed = 5) {
  const pos = new Float32Array(N * 3), size = new Float32Array(N), col = new Float32Array(N * 3);
  const G0 = new THREE.Vector3(0.3, 0.86, -0.41).normalize();      // (the galactic pole in this film's frame)
  const C0 = new THREE.Vector3().crossVectors(G0, new THREE.Vector3(1, 0, 0)).normalize();
  const tint = [[1.0, 0.78, 0.6], [1.0, 0.9, 0.78], [1.0, 1.0, 0.98], [0.82, 0.88, 1.0], [0.7, 0.8, 1.0]];
  for (let i = 0; i < N; i++) {
    const h = (k) => hash1(i * 977 + k * 131 + seed * 7919);
    let x = h(1) * 2 - 1, y = h(2) * 2 - 1, z = h(3) * 2 - 1, l = Math.hypot(x, y, z) || 1; x /= l; y /= l; z /= l;
    // two in five stars crowd towards the galactic plane
    if (h(4) < 0.4) { const d = x * G0.x + y * G0.y + z * G0.z, k = 0.88 * (1 - h(5) * 0.6); x -= G0.x * d * k; y -= G0.y * d * k; z -= G0.z * d * k; l = Math.hypot(x, y, z); x /= l; y /= l; z /= l; }
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    const m = Math.pow(h(6), 6);                 // mostly faint, a few bright
    size[i] = 1.4 + m * 5.5;
    const c = tint[Math.floor(h(7) * 5)], b = 0.35 + 0.65 * Math.pow(h(8), 2) + m * 1.8;
    col[i * 3] = c[0] * b; col[i * 3 + 1] = c[1] * b; col[i * 3 + 2] = c[2] * b;
  }
  const U = { uVel: { value: new THREE.Vector3(0, 0, -1) }, uBeta: { value: 0 }, uPx: { value: 1 }, uBright: { value: 1 }, uStreak: { value: 0 },
    uBand: { value: 1 }, uG: { value: G0.clone() }, uC: { value: C0.clone() } };
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSize', new THREE.BufferAttribute(size, 1)); g.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
  const pm = new THREE.ShaderMaterial({
    uniforms: U, transparent: false, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `${TW_GLSL_NOISE}
      uniform vec3 uVel; uniform float uBeta, uPx, uBright; attribute float aSize; attribute vec3 aCol; varying vec3 vC; varying float vA;
      void main(){ vec3 d = cAberr(normalize(position), uVel, uBeta); float D = cDopp(d, uVel, uBeta);
        vC = cShift(aCol, D); vA = uBright * clamp(pow(D, 1.3), 0.0, 2.6);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(d * 1000.0, 1.0);
        gl_PointSize = aSize * uPx * clamp(pow(D, 0.35), 0.6, 1.5); }`,
    fragmentShader: `varying vec3 vC; varying float vA; void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r = dot(q, q); if (r > 1.0) discard; gl_FragColor = vec4(vC * vA * pow(1.0 - r, 2.0), 1.0); }`,
  });
  const pts = new THREE.Points(g, pm); pts.frustumCulled = false; pts.renderOrder = -3000; scene.add(pts);
  // streaks: each star drawn again as a short line towards where it came from
  const lp = new Float32Array(N * 6), le = new Float32Array(N * 2), lc = new Float32Array(N * 6);
  for (let i = 0; i < N; i++) for (let e = 0; e < 2; e++) { for (let k = 0; k < 3; k++) { lp[i * 6 + e * 3 + k] = pos[i * 3 + k]; lc[i * 6 + e * 3 + k] = col[i * 3 + k]; } le[i * 2 + e] = e; }
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.BufferAttribute(lp, 3)); lg.setAttribute('aEnd', new THREE.BufferAttribute(le, 1)); lg.setAttribute('aCol', new THREE.BufferAttribute(lc, 3));
  const lm = new THREE.ShaderMaterial({
    uniforms: U, transparent: false, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `${TW_GLSL_NOISE}
      uniform vec3 uVel; uniform float uBeta, uBright, uStreak; attribute float aEnd; attribute vec3 aCol; varying vec3 vC;
      void main(){ vec3 d = cAberr(normalize(position), uVel, uBeta); float D = cDopp(d, uVel, uBeta);
        if (aEnd > 0.5) d = normalize(d - uVel * uStreak * 0.35);
        vC = cShift(aCol, D) * uBright * clamp(pow(D, 1.3), 0.0, 2.6) * (aEnd > 0.5 ? 0.0 : 0.55) * min(1.0, uStreak * 3.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(d * 1000.0, 1.0); }`,
    fragmentShader: `varying vec3 vC; void main(){ gl_FragColor = vec4(vC, 1.0); }`,
  });
  const lines = new THREE.LineSegments(lg, lm); lines.frustumCulled = false; lines.renderOrder = -2999; scene.add(lines);
  // the band of the Milky Way (seen from inside it), aberrated the same way (per pixel, backwards)
  const bm = new THREE.ShaderMaterial({
    uniforms: U, depthTest: false, depthWrite: false, side: THREE.BackSide,
    vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `${TW_GLSL_NOISE}
      uniform vec3 uVel, uG, uC; uniform float uBeta, uBand, uBright; varying vec3 vD;
      void main(){ vec3 o = normalize(vD); vec3 d = cAberr(o, uVel, -uBeta); float D = cDopp(o, uVel, uBeta);
        float z = dot(d, uG), c = dot(d, uC);
        float n = cF3(d * 5.0), n2 = cF3(d * 13.0 + 4.0);
        float band = exp(-pow(z / (0.13 + 0.05 * n), 2.0)) * (0.35 + 0.9 * n) * (0.55 + 0.45 * smoothstep(-1.0, 1.0, c));
        float bulge = exp(-(1.0 - c) * 9.0) * exp(-pow(z / 0.16, 2.0)) * 1.4;
        float lane = exp(-pow((z + 0.012 * (n2 - 0.5)) / (0.03 + 0.02 * n2), 2.0)) * smoothstep(0.3, 0.8, n2);
        vec3 col = vec3(0.62, 0.6, 0.66) * band + vec3(1.0, 0.84, 0.62) * bulge;
        col *= 1.0 - 0.75 * lane;
        col *= 0.055 * uBand * uBright * clamp(pow(D, 1.3), 0.0, 2.2);
        gl_FragColor = vec4(cShift(col, D), 1.0); }`,
  });
  const band = new THREE.Mesh(new THREE.SphereGeometry(1500, 64, 32), bm); band.frustumCulled = false; band.renderOrder = -3001; scene.add(band);
  return {
    U, G0, C0,
    set(cam, v, beta, o = {}) {
      for (const m of [pts, lines, band]) m.position.copy(cam.position);
      U.uVel.value.set(v[0], v[1], v[2]).normalize(); U.uBeta.value = MathX.clamp(beta, 0, 0.9995);
      U.uBright.value = o.bright ?? 1; U.uStreak.value = o.streak || 0; U.uBand.value = o.band ?? 1;
      U.uPx.value = Math.max(0.5, (TW_PX || 1080) / 1080);
      if (o.G) U.uG.value.set(...o.G).normalize(); if (o.C) U.uC.value.set(...o.C).normalize();
      pts.visible = lines.visible = band.visible = o.on !== false; lines.visible = lines.visible && (o.streak || 0) > 0.01;
    },
  };
}
let TW_PX = 1080;   // (the render's height in pixels: star sizes scale with it; set by the sets from the renderer)

// ---------------------------------------------------------------------------------------------------------------------
// BODIES: a sphere drawn as background. kinds: earth, moon, mars, jupiter, saturn, pluto, star (uCol), giant
//   b.set(rel (m, from the camera's frame origin = you), radius (m), lightDir (unit, towards the light), o)
//   o: { spin (rad), rank, cam }. Ranks are assigned by the caller from true distances (far first).
// ---------------------------------------------------------------------------------------------------------------------
const TW_BODY_KIND = { earth: 0, moon: 1, mars: 2, jupiter: 3, saturn: 4, pluto: 5, star: 6, giant: 7, burnt: 8 };
let TW_EARTH_TEX = null;
function twEarthTex() {
  if (TW_EARTH_TEX) return TW_EARTH_TEX;
  const W = 2048, H = 1024;
  const c = twCanvas(W, H, (g) => {
    g.clearRect(0, 0, W, H);
    const P = (lon, lat) => [(lon + 180) / 360 * W, (90 - lat) / 180 * H];
    g.fillStyle = '#4f7c39';
    for (const poly of EARTH_LAND) { g.beginPath(); poly.forEach(([lo, la], i) => { const [x, y] = P(lo, la); if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath(); g.fill(); }
    // deserts, dry lands, forests, ice (painted only where there is land)
    g.globalCompositeOperation = 'source-atop';
    const blob = (lon, lat, rx, ry, col, a = 1) => { const [x, y] = P(lon, lat); g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx / 360 * W, ry / 180 * H, 0, 0, 6.2832); g.fill(); g.globalAlpha = 1; };
    for (let i = 0; i < 900; i++) { const lo = -180 + 360 * hash1(i * 3 + 1), la = -60 + 140 * hash1(i * 3 + 2); blob(lo, la, 3 + 6 * hash1(i * 5), 2 + 4 * hash1(i * 7), hash1(i * 11) < 0.5 ? '#3f6b2e' : '#6b8a45', 0.35); }
    [[10, 23, 30, 9], [25, 26, 14, 7], [45, 24, 12, 8], [55, 28, 8, 6], [65, 38, 10, 6], [100, 42, 16, 5], [-112, 33, 7, 5], [-104, 28, 5, 4], [134, -25, 18, 9], [20, -24, 8, 6], [-70, -25, 4, 8], [-5, 18, 12, 5]].forEach(([lo, la, rx, ry]) => blob(lo, la, rx, ry, '#c9a86a', 0.92));
    [[0, 15, 30, 3], [70, 30, 12, 6], [-100, 40, 12, 6], [35, 48, 25, 4], [140, -30, 14, 5]].forEach(([lo, la, rx, ry]) => blob(lo, la, rx, ry, '#93904f', 0.55));
    [[-60, -5, 14, 12], [20, 0, 12, 8], [110, 0, 14, 6], [95, 60, 40, 6], [-100, 56, 30, 5], [30, 60, 25, 5]].forEach(([lo, la, rx, ry]) => blob(lo, la, rx, ry, '#2f5a26', 0.55));
    [[-40, 74, 22, 12], [0, -85, 200, 14]].forEach(([lo, la, rx, ry]) => blob(lo, la, rx, ry, '#f2f4f6', 1));
    g.fillStyle = 'rgba(236,240,244,0.9)'; g.fillRect(0, P(0, -70)[1], W, H);
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = 'rgba(236,240,244,0.85)'; g.fillRect(0, 0, W, P(0, 82)[1]);
  });
  TW_EARTH_TEX = twTex(c, { repeat: false }); TW_EARTH_TEX.anisotropy = 4;
  return TW_EARTH_TEX;
}
function twBodyMat(kind) {
  const K = TW_BODY_KIND[kind];
  return new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false,
    uniforms: { uL: { value: new THREE.Vector3(0, 0, 1) }, uMap: { value: kind === 'earth' ? twEarthTex() : null }, uSpin: { value: 0 }, uCol: { value: new THREE.Color('#fff4e0') }, uI: { value: 1 }, uT: { value: 0 }, uAx: { value: new THREE.Matrix3() } },
    vertexShader: `uniform mat3 uAx; varying vec3 vO; varying vec3 vN; varying vec3 vW;
      void main(){ vO = uAx * position; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `${TW_GLSL_NOISE}
      #define KIND ${K}
      uniform vec3 uL, uCol; uniform float uSpin, uI, uT; uniform sampler2D uMap; varying vec3 vO; varying vec3 vN; varying vec3 vW;
      void main(){
        vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
        float cs = cos(uSpin), sn = sin(uSpin); vec3 p = normalize(vO); p = vec3(cs * p.x + sn * p.z, p.y, -sn * p.x + cs * p.z);
        float lat = asin(clamp(p.y, -1.0, 1.0)), lon = atan(p.x, p.z);
        float ndl = dot(N, uL), nv = max(dot(N, V), 0.0);
        float lit = smoothstep(-0.06, 0.3, ndl) * (0.25 + 0.75 * max(ndl, 0.0));
        vec3 alb = vec3(0.5); vec3 col;
      #if KIND == 6 || KIND == 7
        // a star: granulation, limb darkening; HDR so the post's bloom gives it a glow
        float gr = cF3(p * (KIND == 7 ? 9.0 : 26.0) + uT * 0.05), sp = smoothstep(0.62, 0.8, cF3(p * 5.0 + 2.0));
        col = uCol * (0.78 + 0.4 * gr) * (1.0 - 0.45 * sp) * pow(nv, 0.42) * uI;
        gl_FragColor = vec4(col, 1.0); return;
      #endif
      #if KIND == 0
        vec4 m = texture2D(uMap, vec2(lon / 6.2831853 + 0.5, lat / 3.1415927 + 0.5));
        float land = m.a;
        vec3 sea = mix(vec3(0.02, 0.09, 0.22), vec3(0.04, 0.17, 0.33), cF3(p * 6.0));
        alb = mix(sea, m.rgb * (0.85 + 0.3 * cF3(p * 40.0)), land);
        // clouds: swirled fbm, more of them in the storm belts
        vec3 q = p * 3.2 + vec3(cF3(p * 2.0 + uT * 0.002), cF3(p * 2.0 + 5.0), 0.0) * 1.4;
        float cl = smoothstep(0.5, 0.72, cF3(q)) * (0.65 + 0.35 * smoothstep(0.1, 0.5, abs(sin(lat * 3.0))));
        float spec = (1.0 - land) * (1.0 - cl) * pow(max(dot(reflect(-uL, N), V), 0.0), 60.0) * 0.9;
        alb = mix(alb, vec3(0.92), cl);
        col = alb * lit + spec * vec3(1.0, 0.92, 0.8) * step(0.0, ndl);
        // the air: a blue rim on the day side, the limb thinner on the night side
        float rim = pow(1.0 - nv, 2.6);
        col += vec3(0.25, 0.5, 1.0) * rim * smoothstep(-0.25, 0.4, ndl) * 1.3;
        col = mix(col, vec3(0.35, 0.55, 0.85) * lit, 0.18 * (1.0 - nv));
        // city lights on the night side
        col += vec3(1.0, 0.7, 0.35) * land * smoothstep(0.62, 0.8, cF3(p * 60.0)) * smoothstep(0.05, -0.15, ndl) * 0.25;
      #elif KIND == 1
        float mar = smoothstep(0.52, 0.6, cF3(p * 2.2 + 1.0));
        vec2 c1 = cCell(p * 9.0), c2 = cCell(p * 26.0 + 3.0);
        float cr = smoothstep(0.22, 0.32, c1.x) * 0.5 + 0.5 + 0.18 * smoothstep(0.3, 0.22, c1.x) * step(0.6, c1.y) - 0.12 * smoothstep(0.25, 0.1, c1.x) * step(0.6, c1.y);
        cr *= 0.9 + 0.1 * smoothstep(0.1, 0.25, c2.x);
        alb = mix(vec3(0.6, 0.59, 0.56), vec3(0.3, 0.3, 0.31), mar) * cr * (0.85 + 0.3 * cF3(p * 30.0));
        col = alb * lit;
      #elif KIND == 2
        float dk = smoothstep(0.48, 0.66, cF3(p * 3.0 + 7.0));
        alb = mix(vec3(0.72, 0.36, 0.17), vec3(0.36, 0.2, 0.13), dk) * (0.85 + 0.3 * cF3(p * 24.0));
        alb = mix(alb, vec3(0.95, 0.93, 0.9), smoothstep(0.86, 0.9, abs(p.y) + 0.04 * cF3(p * 12.0)));
        col = alb * lit + vec3(0.9, 0.55, 0.35) * pow(1.0 - nv, 4.0) * smoothstep(-0.2, 0.4, ndl) * 0.35;
      #elif KIND == 3 || KIND == 4
        float w = lat + 0.06 * (cF3(vec3(lon * 3.0, lat * 18.0, 0.0)) - 0.5) + 0.02 * sin(lon * 6.0 + lat * 30.0);
        float b = sin(w * ${'(KIND == 3 ? 22.0 : 16.0)'}) * 0.5 + 0.5, b2 = sin(w * 57.0 + 1.3) * 0.5 + 0.5;
      #if KIND == 3
        alb = mix(vec3(0.86, 0.78, 0.66), vec3(0.62, 0.43, 0.3), b * 0.85) * (0.88 + 0.2 * b2);
        alb = mix(alb, vec3(0.92, 0.9, 0.86), smoothstep(0.75, 0.9, b2) * 0.4);
        // the Great Red Spot
        vec2 gs = vec2((lon - 0.6) * 0.9, (lat + 0.39) * 2.0); float spot = exp(-dot(gs, gs) / 0.012);
        alb = mix(alb, vec3(0.75, 0.33, 0.2), spot * 0.85);
      #else
        alb = mix(vec3(0.9, 0.82, 0.62), vec3(0.74, 0.62, 0.42), b * 0.55) * (0.92 + 0.12 * b2);
      #endif
        col = alb * lit;
      #elif KIND == 5
        // Pluto: tan and dark red, and the bright heart
        float dk = smoothstep(0.5, 0.62, cF3(p * 3.5 + 2.0)) * smoothstep(0.3, -0.2, p.y + 0.15);
        alb = mix(vec3(0.78, 0.66, 0.54), vec3(0.42, 0.24, 0.16), dk);
        vec2 hp = vec2(lon - 0.3, lat - 0.2); float heart = smoothstep(0.42, 0.3, length(vec2(hp.x * 1.1 + 0.18, hp.y)) * (1.0 + 0.15 * cF3(p * 9.0))) + smoothstep(0.34, 0.24, length(vec2(hp.x * 1.1 - 0.2, hp.y + 0.08)));
        alb = mix(alb, vec3(0.96, 0.93, 0.88), clamp(heart, 0.0, 1.0)) * (0.9 + 0.2 * cF3(p * 30.0));
        col = alb * lit;
      #elif KIND == 8
        // the Earth after the Sun has grown: rock, glowing cracks on the side facing it
        float cr = smoothstep(0.08, 0.0, cCell(p * 7.0).x - 0.02);
        alb = vec3(0.12, 0.09, 0.08) * (0.7 + 0.5 * cF3(p * 12.0));
        col = alb * lit * vec3(1.0, 0.5, 0.3) + vec3(1.0, 0.32, 0.06) * (0.05 + 1.1 * cr) * smoothstep(-0.1, 0.6, ndl) * uI;
        col += vec3(1.0, 0.4, 0.1) * pow(1.0 - nv, 3.0) * 0.6;
        gl_FragColor = vec4(col, 1.0); return;
      #endif
        gl_FragColor = vec4(col * uI, 1.0);
      }`,
  });
}
function twBody(scene, kind, o = {}) {
  const mat = twBodyMat(kind), mesh = new THREE.Mesh(new THREE.SphereGeometry(1, o.seg || 96, (o.seg || 96) / 2), mat);
  mesh.frustumCulled = false; mesh.visible = false; scene.add(mesh);
  let halo = null;
  if (o.halo) {
    // a soft halo around the sphere (the air's glow for the Earth; the corona for a star), additive, no depth
    const hm = new THREE.ShaderMaterial({
      transparent: false, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
      uniforms: { uCol: { value: new THREE.Color(o.halo) }, uL: mat.uniforms.uL, uK: { value: o.haloK ?? 1 }, uStar: { value: o.star ? 1 : 0 }, uS: { value: o.haloS || 1.06 }, uC: { value: new THREE.Vector3() } },
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      // (x: how far out from the body's limb, 0 at the limb, 1 at the halo's edge, from the ray's closest approach)
      fragmentShader: `uniform vec3 uCol, uL, uC; uniform float uK, uStar, uS; varying vec3 vW;
        void main(){ vec3 V = normalize(vW - cameraPosition), rel = uC - cameraPosition; float along = dot(rel, V);
          float R = length(vW - uC) / uS, b = length(rel - V * along) / R;
          float x = clamp((b - 1.0) / (uS - 1.0), 0.0, 1.0);
          float day = uStar > 0.5 ? 1.0 : mix(0.18, 1.0, smoothstep(-0.35, 0.35, dot(normalize(vW - uC), uL)));
          float prof = uStar > 0.5 ? pow(1.0 - x, 2.5) / pow(max(b, 1.0), 1.2) : exp(-x * 5.0) * smoothstep(0.0, 0.02, x + 0.02);
          if (b < 1.0) prof = uStar > 0.5 ? 1.0 : 0.0;
          gl_FragColor = vec4(uCol * prof * uK * day, 1.0); }`,
    });
    halo = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), hm); halo.frustumCulled = false; halo.visible = false; scene.add(halo);
  }
  const b = {
    mesh, mat, halo, kind,
    // rel: true position relative to you (m, double precision ok); R: radius (m); L: unit direction towards the light
    set(rel, R, L, opt = {}) {
      const camP = opt.cam ? opt.cam.position : null;
      const d = camP ? Math.hypot(rel[0] - camP.x, rel[1] - camP.y, rel[2] - camP.z) : Math.hypot(rel[0], rel[1], rel[2]);
      const on = opt.on !== false && d > R * 1.0005 && isFinite(d);
      mesh.visible = on; if (halo) halo.visible = on && (opt.halo ?? true);
      if (!on) return b;
      // drawn as seen from the camera: compress about the camera, not you
      const cx = camP ? camP.x : 0, cy = camP ? camP.y : 0, cz = camP ? camP.z : 0;
      const rx = rel[0] - cx, ry = rel[1] - cy, rz = rel[2] - cz, dc = Math.hypot(rx, ry, rz), k = dc > TW_FAR ? TW_FAR / dc : 1;
      mesh.position.set(cx + rx * k, cy + ry * k, cz + rz * k); mesh.scale.setScalar(R * k);
      mat.uniforms.uL.value.set(L[0], L[1], L[2]).normalize();
      mat.uniforms.uSpin.value = opt.spin || 0; mat.uniforms.uI.value = opt.I ?? 1; mat.uniforms.uT.value = opt.t || 0;
      if (opt.col) mat.uniforms.uCol.value.set(opt.col);
      if (opt.ax) mat.uniforms.uAx.value.copy(opt.ax);
      const r0 = opt.rank ?? 0; mesh.renderOrder = -2000 + r0 * 4 + 2;
      if (halo) { const hs = halo.material.uniforms.uS.value; halo.position.copy(mesh.position); halo.scale.setScalar(R * k * hs); halo.material.uniforms.uC.value.copy(mesh.position); halo.renderOrder = -2000 + r0 * 4 + 1; if (opt.haloK !== undefined) halo.material.uniforms.uK.value = opt.haloK; }
      b._k = k; b._d = dc;
      return b;
    },
    hide() { mesh.visible = false; if (halo) halo.visible = false; return b; },
  };
  return b;
}
// Saturn's rings: drawn in two halves (the far one before the planet, the near one after), lit, with the Cassini gap
function twRings(scene) {
  const g = new THREE.RingGeometry(1.24, 2.27, 256, 4);
  const mk = (near) => new THREE.ShaderMaterial({
    transparent: false, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: { uL: { value: new THREE.Vector3(0, 0, 1) }, uC: { value: new THREE.Vector3() }, uNear: { value: near ? 1 : 0 }, uI: { value: 1 } },
    vertexShader: 'varying vec3 vW; varying float vR; void main(){ vR = length(position.xy); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `${TW_GLSL_NOISE}
      uniform vec3 uL, uC; uniform float uNear, uI; varying vec3 vW; varying float vR;
      void main(){ vec3 V = cameraPosition - vW; float side = dot(vW - uC, normalize(cameraPosition - uC));
        if ((uNear > 0.5) != (side > 0.0)) discard;
        float r = vR, band = 0.55 + 0.45 * sin(r * 90.0) * sin(r * 37.0 + 1.0) + 0.2 * (cN3(vec3(r * 160.0, 0.0, 0.0)) - 0.5);
        float a = smoothstep(1.24, 1.3, r) * (1.0 - smoothstep(1.94, 1.98, r) * (1.0 - smoothstep(2.02, 2.05, r))) * smoothstep(2.27, 2.2, r);
        a *= mix(0.45, 0.95, smoothstep(1.5, 1.6, r)) * clamp(band, 0.2, 1.0);
        // the planet's shadow across the rings (on the side away from the light)
        vec3 rel = vW - uC; float along = dot(rel, uL), perp = length(rel - uL * along) / length(rel) * length(rel);
        float sh = along < 0.0 ? smoothstep(0.0, 0.08, perp / max(1e-6, length(rel)) - 0.0) : 1.0;
        vec3 col = mix(vec3(0.82, 0.74, 0.6), vec3(0.62, 0.55, 0.46), smoothstep(1.6, 2.1, r)) * (0.55 + 0.45 * band);
        gl_FragColor = vec4(col * uI, a * 0.92); }`,
  });
  const far = new THREE.Mesh(g, mk(false)), near = new THREE.Mesh(g, mk(true));
  for (const m of [far, near]) { m.frustumCulled = false; m.visible = false; scene.add(m); }
  return {
    // follow a body (its drawn position and scale): tilt = the rings' normal
    set(body, L, normal, on = true) {
      for (const m of [far, near]) {
        m.visible = on && body.mesh.visible; if (!m.visible) continue;
        m.position.copy(body.mesh.position); m.scale.setScalar(body.mesh.scale.x);
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...normal).normalize());
        m.material.uniforms.uL.value.set(...L).normalize(); m.material.uniforms.uC.value.copy(body.mesh.position);
      }
      far.renderOrder = body.mesh.renderOrder - 1.5; near.renderOrder = body.mesh.renderOrder + 0.5;
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE SPACE STATION (about 109 × 73 m): the truss, eight solar wings, the modules, the radiators, the cupola
// (one window you can look through: an astronaut inside). Its own frame: truss along x, modules along z, Earth −y.
// ---------------------------------------------------------------------------------------------------------------------
function twISS(scene) {
  const G = new THREE.Group(); scene.add(G);
  const white = twStd('#e8e6e0', 0.55, 0.1), grey = twStd('#9a9a96', 0.5, 0.5), dark = twStd('#2a2c30', 0.5, 0.3);
  const panelT = twTex(twCanvas(256, 512, (g, w, h) => { g.fillStyle = '#3d2c16'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 16) for (let x = 0; x < w; x += 16) { g.fillStyle = `rgb(${150 + 40 * twR(x + y * 7, 3)},${100 + 22 * twR(x, y)},${40})`; g.fillRect(x + 1, y + 1, 14, 14); } g.fillStyle = '#d8c070'; g.fillRect(w / 2 - 3, 0, 6, h); }), { repeat: false });
  const panel = new THREE.MeshStandardMaterial({ map: panelT, roughness: 0.35, metalness: 0.55, color: '#ffffff' });
  const add = (geo, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = o.receiveShadow = true; G.add(o); return o; };
  add(new THREE.BoxGeometry(108, 2.6, 2.6), grey, 0, 0, 0);
  for (const sx of [-1, 1]) for (const k of [0, 1]) {
    const x = sx * (36 + k * 15);
    add(new THREE.BoxGeometry(1.2, 1.2, 4), dark, x, 0, 0);
    for (const sz of [-1, 1]) add(new THREE.BoxGeometry(11.6, 0.12, 33), panel, x, 0, sz * 19.5, 0, 0, 0);
  }
  for (const sx of [-1, 1]) add(new THREE.BoxGeometry(3, 0.1, 13), white, sx * 22, -4, 0, 0, 0, 0.3 * sx);
  // the modules (pressurised: about 4.2 m across), the node, the cupola facing Earth
  const cyl = (r, L) => new THREE.CylinderGeometry(r, r, L, 24);
  add(cyl(2.1, 40), white, 0, -3.4, -6, Math.PI / 2, 0, 0);
  add(cyl(2.1, 14), white, 0, -3.4, 16, Math.PI / 2, 0, 0);
  add(cyl(2.1, 12), white, -9, -3.4, -18, 0, 0, Math.PI / 2);
  add(cyl(2.1, 12), white, 9, -3.4, -18, 0, 0, Math.PI / 2);
  add(cyl(1.5, 10), white, 0, -3.4, 28, Math.PI / 2, 0, 0);
  for (const sz of [-1, 1]) add(new THREE.BoxGeometry(2.5, 0.1, 9), panel, 0, -3.4, 28 + sz * 0, 0, 0, 0).position.x = sz * 7;
  // the cupola: a short octagonal turret on the Earth side of the node, its windows dark glass
  const cup = new THREE.Group(); cup.position.set(0, -6.1, 2); G.add(cup);
  const cb = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.5, 1.1, 8), white); cb.castShadow = cb.receiveShadow = true; cup.add(cb);
  const glass = new THREE.MeshStandardMaterial({ color: '#0b1016', roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.35, envMapIntensity: 1.5 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.03, 32), glass); top.position.y = -0.57; cup.add(top);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.06, 8, 32), white); ring.rotation.x = Math.PI / 2; ring.position.y = -0.58; cup.add(ring);
  G.userData.cupola = cup;
  return G;
}

// ---------------------------------------------------------------------------------------------------------------------
// VOYAGER 1 (about 3.7 m dish; booms of 13 m): its own frame, the dish facing +z (towards home)
// ---------------------------------------------------------------------------------------------------------------------
function twVoyager(scene) {
  const G = new THREE.Group(); scene.add(G);
  const white = twStd('#e6e2d8', 0.45, 0.15), gold = twStd('#c89a3a', 0.3, 0.8), dark = twStd('#3a3a3a', 0.5, 0.4), foil = twStd('#b88a3a', 0.25, 0.9);
  const pts = []; for (let i = 0; i <= 16; i++) { const r = 1.83 * i / 16; pts.push(new THREE.Vector2(r, 0.12 * (r / 1.83) * (r / 1.83) * 3.5)); }
  const dish = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), white); dish.rotation.x = -Math.PI / 2; dish.position.z = 0.25; G.add(dish);
  dish.material.side = THREE.DoubleSide;
  const feed = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.6, 12), dark); feed.rotation.x = Math.PI / 2; feed.position.z = 1.2; G.add(feed);
  for (let i = 0; i < 3; i++) { const a = i / 3 * 6.283; const s = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.15, 6), dark); s.position.set(Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0.95); s.lookAt(0, 0, 1.5); s.rotateX(Math.PI / 2); G.add(s); }
  const bus = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.47, 10), foil); bus.rotation.x = Math.PI / 2; bus.position.z = -0.1; G.add(bus);
  const rec = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.155, 0.01, 32), gold); rec.position.set(0.97, 0, -0.1); rec.rotation.z = Math.PI / 2; G.add(rec);
  const boom = (x0, y0, x1, y1, r, m) => { const a = new THREE.Vector3(x0, y0, -0.1), b = new THREE.Vector3(x1, y1, -0.2), d = b.clone().sub(a); const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 6), m); c.position.copy(a).add(b).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); G.add(c); return c; };
  boom(0.9, 0.3, 13.5, 2.4, 0.035, dark);                                   // the magnetometer boom
  boom(-0.9, -0.2, -3.6, -0.8, 0.05, dark);                                 // the RTG boom and its three generators
  for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 10), dark); c.position.set(-1.6 - i * 0.65, -0.45 - i * 0.16, -0.14); c.rotation.z = Math.PI / 2 - 0.2; G.add(c); for (let f = 0; f < 6; f++) { const fin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.16), dark); fin.position.copy(c.position); fin.rotation.set(f * 1.047, 0, Math.PI / 2 - 0.2); fin.translateY(0); G.add(fin); } }
  boom(-0.6, 0.8, -2.4, 2.4, 0.04, dark);                                   // the science boom and its platform
  const plat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.5), dark); plat.position.set(-2.5, 2.5, -0.2); G.add(plat);
  const cam2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.6, 10), white); cam2.position.set(-2.5, 2.5, 0.25); cam2.rotation.x = Math.PI / 2; G.add(cam2);
  G.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return G;
}

// your watch: a small dial on the back of the left wrist (the forearm's frame: the arm runs along −y, outward is +x)
function twWatch(you) {
  const G = new THREE.Group(); you.j.la.el.add(G); G.position.set(0, -0.2, 0);
  const caseM = twStd('#cfcfcf', 0.3, 0.8), strapM = twStd('#2a2420', 0.8);
  const face = twTex(twCanvas(256, 256, (g, w) => { g.fillStyle = '#f4f2ec'; g.fillRect(0, 0, w, w); g.strokeStyle = '#111'; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.lineWidth = i % 3 ? 6 : 12; g.beginPath(); g.moveTo(w / 2 + Math.sin(a) * 92, w / 2 - Math.cos(a) * 92); g.lineTo(w / 2 + Math.sin(a) * 120, w / 2 - Math.cos(a) * 120); g.stroke(); } }), { repeat: false });
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.006, 32), [caseM, new THREE.MeshBasicMaterial({ map: face, color: '#d8d6d0' }), caseM]);
  dial.rotation.z = -Math.PI / 2; dial.position.x = 0.047; G.add(dial);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.005, 6, 28), strapM); band.rotation.x = Math.PI / 2; band.scale.set(1, 1.0, 2.2); G.add(band);
  const mk = (len, w, col) => { const g = new THREE.BoxGeometry(0.0008, len, w); g.translate(0, len / 2, 0); const h = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: col })); h.position.x = 0.0506; G.add(h); return h; };
  const hs = mk(0.017, 0.0012, '#d02a1a'), hm = mk(0.015, 0.0024, '#111111'), hh = mk(0.01, 0.003, '#111111');
  hm.rotation.x = -0.4; hh.rotation.x = -2.4;   // (about nine minutes to nine: you're late)
  return { G, set(sec, on = true) { G.visible = on; hs.rotation.x = -sec / 60 * 6.2832; } };
}

// your tracer: the line you leave as you flash past something (a glowing segment that fades)
function twTracer(puffs, a, b, k, w = 1, col = [1.0, 0.72, 0.35]) {
  if (!(k > 0.01)) return;
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz), n = Math.min(400, Math.max(8, Math.ceil(L / (w * 0.6))));
  for (let i = 0; i <= n; i++) { const f = i / n; puffs.add(a[0] + dx * f, a[1] + dy * f, a[2] + dz * f, w * (0.7 + 0.6 * f), k * (0.25 + 0.75 * f), col[0], col[1], col[2]); }
}
