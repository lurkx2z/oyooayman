/* =====================================================================
   SKY — what is above you, and the planet under you (classic script: globals).
     ekSky(scene)    the dome (a shader, at infinity): the dawn (the glow in the east-north-east, the Earth's shadow
                     and the pink band above it in the west), dimming as the air drops below your eyes until it is
                     black, with only a thin blue line along the Earth's edge; the Sun's disc; the Moon (a crescent,
                     lit by the Sun: it stays exactly the same size, as everything shrinks towards you)
     ekStars(scene)  the stars (they come out when the sky above you goes black)
     ekGlobe(W)      the Earth beyond the land patch (the engine's Earth textures, re-lit by the real Sun): its oceans,
                     its night side's lights, its clouds (clear over the Rockies), its air seen edge-on from above
   ===================================================================== */

const EK_SKY_GLSL = /* glsl */`
  uniform vec3 uSun, uMoon; uniform float uAir, uDip, uDawn, uSunUp, uMoonK, uSunK2;
  vec3 ekSkyCol(vec3 D) {
    float e = asin(clamp(D.y, -1.0, 1.0)), ep = e + uDip;                       // elevation above the horizon you see
    vec2 h = normalize(D.xz + vec2(1e-6, 0.0)), hs = normalize(uSun.xz + vec2(1e-6, 0.0));
    float cs = dot(h, hs);                                                       // towards the Sun's azimuth: 1
    float sunAlt = asin(clamp(uSun.y, -1.0, 1.0));
    // the clear dawn sky, inside the air
    float t = smoothstep(-0.02, 0.9, ep);
    vec3 zen = vec3(0.045, 0.085, 0.2), hor = vec3(0.24, 0.27, 0.36);
    vec3 col = mix(hor, zen, pow(t, 0.55));
    // the glow over the sunrise (orange low, a paler yellow higher), wide in azimuth
    float sw = pow(max(cs * 0.5 + 0.5, 0.0), 6.0), lowk = exp(-max(ep, 0.0) / 0.09);
    col += vec3(1.25, 0.52, 0.2) * sw * lowk * 0.9 + vec3(0.55, 0.42, 0.3) * pow(max(cs * 0.5 + 0.5, 0.0), 3.0) * exp(-max(ep, 0.0) / 0.3) * 0.35;
    // opposite the Sun: the Earth's shadow (a slate band on the horizon) and the pink band above it
    float aw = pow(max(-cs * 0.5 + 0.5, 0.0), 2.0);
    col = mix(col, vec3(0.16, 0.18, 0.27), aw * smoothstep(0.06, 0.0, ep) * 0.7);
    col += vec3(0.42, 0.2, 0.24) * aw * exp(-pow((ep - 0.11) / 0.07, 2.0)) * 0.55;
    col *= uDawn;
    // less air above your eyes: the sky above you goes dark first; near the horizon the air is seen edge-on
    float od1 = 0.3 / (max(sin(max(ep, 0.0)), 0.0) + 0.035);
    float od = uAir * od1;
    col *= (1.0 - exp(-od)) / (1.0 - exp(-od1));
    // above the air: the thin blue line of air along the Earth's edge (lit on the Sun's side)
    float limb = exp(-max(ep, 0.0) / max(0.004, 0.02 * sqrt(uAir) + 0.004)) * smoothstep(-0.004, 0.0, ep);
    col += (1.0 - smoothstep(0.0, 0.25, uAir)) * limb * mix(vec3(0.12, 0.3, 0.75), vec3(0.9, 0.5, 0.3), sw * 0.6) * (0.25 + 0.9 * pow(max(cs * 0.5 + 0.5, 0.0), 2.0)) * 0.9;
    // the Sun: its disc (0.53°) and its glare (wider when there's air to scatter it)
    float ds = acos(clamp(dot(D, uSun), -1.0, 1.0));
    float disc = smoothstep(0.0049, 0.0042, ds) * smoothstep(-0.006, 0.004, ep + 0.0) * uSunUp;
    vec3 sc = mix(vec3(1.0, 0.45, 0.16), vec3(1.0, 0.96, 0.9), smoothstep(0.0, 0.25, 1.0 - uAir) * 0.0 + smoothstep(0.0, 0.08, sunAlt + uDip) * 0.5 + (1.0 - uAir) * 0.5);
    col += sc * disc * 40.0 * uSunK2;
    col += sc * uSunUp * uSunK2 * (exp(-ds / 0.02) * 1.2 + exp(-ds / 0.12) * 0.25 * (0.3 + uAir)) * smoothstep(-0.03, 0.01, ep);
    // the Moon: a crescent 0.52° across, lit from the Sun's side (earthshine on the rest)
    float dm = acos(clamp(dot(D, uMoon), -1.0, 1.0)), mr = 0.00455;
    if (dm < mr) {
      vec3 d = D - uMoon * dot(D, uMoon); float rho = length(d) / sin(mr);
      vec3 n = d / sin(mr) - uMoon * sqrt(max(0.0, 1.0 - rho * rho));
      float l = max(dot(n, uSun), 0.0);
      float mar = 0.75 + 0.25 * sin(n.x * 17.0 + 2.0) * sin(n.y * 13.0 - 1.0) * sin(n.z * 11.0);
      col += (vec3(0.95, 0.93, 0.88) * l * mar * 1.6 + vec3(0.02, 0.025, 0.035)) * uMoonK * smoothstep(1.0, 0.94, rho);
    }
    return col;
  }`;
function ekSky(scene) {
  const U = { uSun: { value: new THREE.Vector3(0, 0, -1) }, uMoon: { value: new THREE.Vector3(...EK_MOON_DIR) }, uAir: { value: 1 }, uDip: { value: 0 }, uDawn: { value: 1 }, uSunUp: { value: 1 }, uMoonK: { value: 1 }, uSunK2: { value: 1 } };
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false, uniforms: U,
    vertexShader: 'varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0); gl_Position = p.xyww; }',
    fragmentShader: EK_SKY_GLSL + `
      varying vec3 vD;
      void main(){ gl_FragColor = vec4(ekSkyCol(normalize(vD)), 1.0); }`,
  }));
  m.renderOrder = -10; m.frustumCulled = false; scene.add(m);
  return { mesh: m, U };
}
// the sky's colour in JS (a coarse copy of the shader: for the lake's reflection and the haze), at elevation ep (rad)
function ekSkyRGB(ep, cs, dawn, air) {
  const t = ekSmooth(-0.02, 0.9, ep), zen = [0.045, 0.085, 0.2], hor = [0.24, 0.27, 0.36], p = Math.pow(t, 0.55);
  const sw = Math.pow(Math.max(cs * 0.5 + 0.5, 0), 6), lowk = Math.exp(-Math.max(ep, 0) / 0.09);
  const od1 = 0.3 / (Math.max(Math.sin(Math.max(ep, 0)), 0) + 0.035), k = (1 - Math.exp(-air * od1)) / (1 - Math.exp(-od1));
  return [0, 1, 2].map((i) => (MathX.lerp(hor[i], zen[i], p) + [1.25, 0.52, 0.2][i] * sw * lowk * 0.9) * dawn * k);
}

// the stars: a few thousand points round the camera (they follow it), brighter ones few; seen when the sky is dark
function ekStars(scene) {
  const n = 5200, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = ekR(i, 401) * 2 - 1, a = ekR(i, 402) * Math.PI * 2, r = Math.sqrt(1 - u * u);
    pos[3 * i] = Math.cos(a) * r; pos[3 * i + 1] = u; pos[3 * i + 2] = Math.sin(a) * r;
    const b = Math.pow(ekR(i, 403), 6) * 2.2 + 0.08, warm = ekR(i, 404);
    col[3 * i] = b * (0.85 + 0.25 * warm); col[3 * i + 1] = b * 0.92; col[3 * i + 2] = b * (1.1 - 0.25 * warm);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const U = { uK: { value: 0 }, uSize: { value: 2.2 } };
  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending,
    vertexShader: 'attribute vec3 color; uniform float uSize; varying vec3 vC; void main(){ vC = color; vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0); gl_Position = p.xyww; gl_PointSize = uSize * (0.7 + 0.6 * min(1.0, length(color))); }',
    fragmentShader: 'uniform float uK; varying vec3 vC; void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r = dot(q, q); if (r > 1.0) discard; gl_FragColor = vec4(vC * uK * (1.0 - r), 1.0); }',
  });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = -9; scene.add(pts);
  return { mesh: pts, U };
}

// ---- the globe: the engine's Earth textures, on a sphere of the Earth's radius under P, turned so that 51.4° N,
// 116.2° W is straight down from P and north is −z; lit by our Sun; the land patch (ground.js) covers 600 km round P
function ekGlobeQuat() {
  const P = EarthScene.dirFromLonLat(EK_F.lon, EK_F.lat), Nn = EarthScene.dirFromLonLat(EK_F.lon, EK_F.lat + 0.01).sub(P).normalize();
  const Ee = new THREE.Vector3().crossVectors(Nn, P).normalize();   // east = north × up
  // the local frame (east, up, south) in the globe's coordinates → (x, y, z) of ours
  const S = Nn.clone().negate();
  const M = new THREE.Matrix4().makeBasis(Ee, P, S);               // columns: globe-space east, up, south
  return new THREE.Quaternion().setFromRotationMatrix(M).invert();
}
function ekGlobe(W, app) {
  const es = new EarthScene();                                   // (its textures: day, land mask, night lights, clouds)
  const day = es.uniforms.uDay.value, mask = es.uniforms.uMask.value, night = es.uniforms.uNight.value, cloudT = es.clouds.material.uniforms.uMap.value;
  try { const cv = day.image, d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; EK_GLOBE_PIX = { w: cv.width, h: cv.height, d }; } catch (e) { EK_GLOBE_PIX = null; }
  const q = ekGlobeQuat();
  const G = new THREE.Group(); G.position.set(0, -EK_RM, 0); G.quaternion.copy(q); W.add(G);
  const RS = 6371000, patch = 585000 / EK_RM;                    // (rad: the land patch's inner edge)
  const U = { uDay: { value: day }, uMask: { value: mask }, uNight: { value: night }, uPatch: { value: Math.cos(patch) }, uLights: { value: 1 } };
  const mat = new THREE.ShaderMaterial({
    uniforms: Object.assign(U, EK_U),
    vertexShader: /* glsl */`
      uniform float uS; varying vec2 vUv; varying vec3 vWw; varying float vHs; varying vec3 vN;
      void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vWw = w.xyz / uS; vHs = length(vWw + vec3(0.0, ${EK_RM.toFixed(1)}, 0.0)) - ${EK_RM.toFixed(1)};
        vN = normalize(vWw + vec3(0.0, ${EK_RM.toFixed(1)}, 0.0)); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: EK_WORLD_GLSL + /* glsl */`
      uniform sampler2D uDay, uMask, uNight; uniform float uPatch, uLights; varying vec2 vUv; varying vec3 vN;
      void main(){
        if (vN.y > uPatch) discard;                               // (the land patch is there)
        vec3 albedo = texture2D(uDay, vUv).rgb; float land = texture2D(uMask, vUv).r;
        float ndl = dot(vN, uSunW);
        float lit = smoothstep(-0.012, 0.03, ndl);
        vec3 sc = exp(-(1.0 / (max(ndl, 0.0) + 0.03)) * vec3(0.018, 0.05, 0.115));
        vec3 col = albedo * (0.006 + 1.35 * sc * lit * max(ndl + 0.02, 0.0) * uSunK);
        vec3 v = normalize(uEyeW - vWw), hv = normalize(uSunW + v);
        col += vec3(1.0, 0.92, 0.8) * sc * pow(max(dot(vN, hv), 0.0), 300.0) * 0.5 * (1.0 - land) * lit;
        col += texture2D(uNight, vUv).rgb * smoothstep(0.02, -0.12, ndl) * 1.4 * uLights;
        gl_FragColor = vec4(ekHaze(col, vWw, vHs), 1.0);
      }`,
  });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(RS, 256, 128), mat); earth.frustumCulled = false; G.add(earth);
  // the clouds (9 km up), clear over the Rockies (within ~500 km of P)
  const cmat = new THREE.ShaderMaterial({
    uniforms: Object.assign({ uMap: { value: cloudT } }, EK_U), transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      uniform float uS; varying vec2 vUv; varying vec3 vWw; varying float vHs; varying vec3 vN;
      void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vWw = w.xyz / uS; vHs = length(vWw + vec3(0.0, ${EK_RM.toFixed(1)}, 0.0)) - ${EK_RM.toFixed(1)};
        vN = normalize(vWw + vec3(0.0, ${EK_RM.toFixed(1)}, 0.0)); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: EK_WORLD_GLSL + /* glsl */`
      uniform sampler2D uMap; varying vec2 vUv; varying vec3 vN;
      void main(){
        float a = texture2D(uMap, vUv).r * smoothstep(${Math.cos(380000 / EK_RM).toFixed(9)}, ${Math.cos(620000 / EK_RM).toFixed(9)}, vN.y);
        if (a < 0.01) discard;
        float ndl = dot(vN, uSunW), l = smoothstep(-0.05, 0.5, ndl);
        vec3 col = vec3(0.004 + 0.95 * l) * mix(vec3(1.0, 0.62, 0.42), vec3(1.0), smoothstep(0.0, 0.2, ndl)) * uSunK;
        gl_FragColor = vec4(ekHaze(col, vWw, vHs), a * 0.92);
      }`,
  });
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(RS + 9000, 192, 96), cmat); clouds.frustumCulled = false; clouds.renderOrder = 2; G.add(clouds);
  // the air seen edge-on from above it (a soft blue rim; added light)
  const amat = new THREE.ShaderMaterial({
    uniforms: Object.assign({ uK: { value: 0 } }, EK_U), side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec3 vNw; varying vec3 vW; void main(){ vNw = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform float uK; uniform vec3 uSunW; varying vec3 vNw; varying vec3 vW;
      void main(){ vec3 v = normalize(cameraPosition - vW); float f = pow(max(0.0, 1.0 - abs(dot(vNw, v)) * 1.02), 4.0);
        float lit = smoothstep(-0.3, 0.35, dot(vNw, uSunW));
        gl_FragColor = vec4(vec3(0.3, 0.55, 1.0) * f * (0.08 + 1.3 * lit) * uK, 1.0); }`,
  });
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(RS + 70000, 128, 64), amat); atmo.frustumCulled = false; atmo.renderOrder = 3; G.add(atmo);
  return { G, earth, clouds, atmo, U, amat, es };
}
