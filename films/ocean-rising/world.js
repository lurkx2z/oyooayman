/* =====================================================================
   WORLD — the evening round Harrow Rock: the sky (the Sun setting in the west, the Earth's shadow and the pink band
   over it rising in the east, the Moon high in the south-south-east, stars at nautical twilight), the sea (a long low
   swell, its height rising 1 m a minute; foam where it meets the rock, breakers over the drowned island, the Sun's and
   the Moon's glitter, the lamp's glow once it is under; the view from below), and the far coast (the hills of the
   mainland 22–30 km to the north-west, the town's lights, the other lighthouses, the people's torches on the hill).
     ocSky(scene) → { mesh, U, set(s, cam) }       a dome centred on the camera
     ocSea(scene, terr) → { mesh, U, set(s, t, cam) } a polar grid centred under the camera, out to 60 km, on the Earth's curve
     ocCoast(scene) → { set(s, t, cam) }            the mainland, its lights, the other lights, a ship
     ocBuoy(scene) → { g, set(s, t) }               the bell buoy
   Everything is a pure function of story time s (and film time t for the waves).
   ===================================================================== */

const OC_REARTH = 6371000 * 7 / 6;            // the Earth's radius as light sees it over the sea (normal refraction)
// the sky's colours by the Sun's altitude (°): [alt, zenith, horizon under the Sun, horizon opposite, the pink band]
const OC_SKYK = [
  [1.0, [0.16, 0.32, 0.66], [1.0, 0.56, 0.26], [0.46, 0.5, 0.66], [0.78, 0.56, 0.6]],
  [-1.0, [0.12, 0.25, 0.56], [1.0, 0.44, 0.17], [0.36, 0.38, 0.56], [0.84, 0.52, 0.56]],
  [-3.0, [0.075, 0.16, 0.42], [0.95, 0.34, 0.13], [0.22, 0.25, 0.43], [0.7, 0.42, 0.5]],
  [-5.0, [0.045, 0.1, 0.3], [0.74, 0.25, 0.12], [0.13, 0.16, 0.32], [0.42, 0.28, 0.4]],
  [-7.0, [0.027, 0.062, 0.2], [0.44, 0.17, 0.11], [0.075, 0.1, 0.22], [0.2, 0.15, 0.27]],
  [-9.5, [0.016, 0.036, 0.12], [0.22, 0.1, 0.085], [0.045, 0.062, 0.145], [0.09, 0.075, 0.14]],
];
function ocSkyCols(alt) {
  const K = OC_SKYK, a = MathX.clamp(alt, K[K.length - 1][0], K[0][0]);
  let i = 0; while (i < K.length - 2 && a < K[i + 1][0]) i++;
  const u = (K[i][0] - a) / (K[i][0] - K[i + 1][0]), L = (j) => K[i][j].map((v, c) => v + (K[i + 1][j][c] - v) * u);
  return { zen: L(1), horS: L(2), horA: L(3), belt: L(4) };
}
// the light on the scene by the Sun's altitude: the Sun's own (direct), the sky's (ambient) and how much the Moon adds
const ocSunK = (alt) => MathX.smooth(alt, -0.9, 1.2);
const ocSkyK = (alt) => 0.06 + 0.94 * Math.pow(MathX.smooth(alt, -10.5, 2.0), 1.6);
// (a gibbous Moon gives less light than a full one: × the lit fraction of its disc)
const ocMoonK = (s) => { const m = ocMoonAt(s), su = ocSunAt(s), c = m.v[0] * su.v[0] + m.v[1] * su.v[1] + m.v[2] * su.v[2]; return MathX.smooth(m.alt, -0.5, 6) * (1 - 0.8 * ocSkyK(su.alt)) * (0.5 - 0.5 * c); };

// the sky, as GLSL (shared by the sky dome and the sea's reflection)
const OC_SKY_GLSL = /* glsl */`
  uniform vec3 uSun, uMoon, uZen, uHorS, uHorA, uBelt, uMoonC; uniform float uGlow, uBeltH, uBeltK, uStars, uCloud, uCloudLit, uSunDisc;
  float sh1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float sh3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float sn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(sh1(i), sh1(i + vec2(1, 0)), f.x), mix(sh1(i + vec2(0, 1)), sh1(i + vec2(1, 1)), f.x), f.y); }
  float sfbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * sn2(p); p = p * 2.07 + 5.3; a *= 0.5; } return v; }
  // the sky in direction D (unit); full = 0 for a reflection (no stars, no clouds' fine detail)
  vec3 skyCol(vec3 D, float full){
    float h = D.y, up = clamp(h, 0.0, 1.0);
    vec3 S = normalize(vec3(uSun.x, 0.0001, uSun.z)), Dh = normalize(vec3(D.x, 0.0, D.z) + vec3(1e-5));
    float cs = dot(Dh, normalize(vec3(S.x, 0.0, S.z)));
    vec3 hor = mix(uHorA, uHorS, pow(smoothstep(-0.55, 1.0, cs), 1.6));
    vec3 col = mix(hor, uZen, pow(smoothstep(-0.01, 0.62, up), 0.62));
    // the glow over the set Sun: warm, low, in its quarter
    col += uHorS * pow(max(cs, 0.0), 5.0) * exp(-up * 9.0) * 0.55 * uGlow;
    // opposite it: the Earth's shadow (a grey-blue band on the horizon), the pink band over it
    float anti = smoothstep(0.1, -0.85, cs);
    col = mix(col, uBelt, exp(-pow((h - uBeltH) / 0.055, 2.0)) * anti * 0.6 * uBeltK);
    col = mix(col, uHorA * 0.8, smoothstep(uBeltH - 0.015, -0.005, h) * smoothstep(-0.02, 0.0, h) * anti * 0.55 * uBeltK);
    // the Sun's aureole and disc
    float g = max(dot(D, uSun), 0.0);
    col += vec3(1.0, 0.72, 0.42) * (pow(g, 30.0) * 0.45 + pow(g, 400.0) * 1.6) * uGlow;
    col += vec3(1.0, 0.78, 0.5) * smoothstep(0.999955, 0.99997, g) * 30.0 * uSunDisc;
    // the Moon: a disc with its seas, a soft halo
    float gm = dot(D, uMoon);
    if (gm > 0.99) {
      vec3 mx = normalize(cross(uMoon, vec3(0.0, 1.0, 0.0))), my = cross(mx, uMoon); vec2 mp = vec2(dot(D, mx), dot(D, my)) / 0.00454;   // (0.26°: the disc's radius)
      float disc = smoothstep(1.04, 0.96, length(mp)), mare = 0.78 + 0.22 * smoothstep(0.42, 0.62, sfbm(mp * 2.2 + 3.0));
      // its phase: the half of the ball that faces the Sun is lit (a gibbous Moon tonight); the rest is earthshine
      vec3 mn = mx * mp.x + my * mp.y - uMoon * sqrt(max(0.0, 1.0 - dot(mp, mp)));
      float lit = 0.035 + 0.965 * smoothstep(-0.04, 0.06, dot(mn, uSun)), frac = 0.5 - 0.5 * dot(uMoon, uSun);
      col += uMoonC * (disc * mare * lit * 1.7 * (0.82 + 0.18 * sqrt(max(0.0, 1.0 - dot(mp, mp)))) + (pow(max(gm, 0.0), 6000.0) * 0.5 + pow(max(gm, 0.0), 300.0) * 0.06) * frac);
    }
    // stars (fixed on the sky), only where it is dark enough
    if (full > 0.5 && uStars > 0.001 && h > 0.0) {
      vec3 q = D * 140.0, c = floor(q), f = fract(q) - 0.5; float r = sh3(c);
      if (r > 0.992) { float b = (r - 0.992) / 0.008; vec3 o = vec3(sh3(c + 7.7), sh3(c + 9.1), sh3(c + 4.3)) - 0.5; float st = smoothstep(0.2, 0.02, length(f - o * 0.5)) * (0.8 + 2.4 * b * b * b);
        col += vec3(0.88 + 0.12 * sh3(c + 3.1), 0.92, 1.0) * st * uStars * smoothstep(0.02, 0.12, h); }
    }
    // a few streaks of high cloud over the west, lit from below by the set Sun, then dark against the glow
    if (uCloud > 0.001 && h > 0.006 && h < 0.3) {
      vec2 P = vec2(atan(D.x, -D.z) * 3.0, h * 26.0);
      float c = sfbm(vec2(P.x * 1.3, P.y * 4.0 + 1.7)) * 0.7 + sfbm(vec2(P.x * 5.0, P.y * 9.0)) * 0.3;
      float cov = smoothstep(0.55, 0.78, c) * smoothstep(0.006, 0.04, h) * smoothstep(0.3, 0.12, h) * smoothstep(-0.5, 0.6, cs) * uCloud;
      vec3 cc = mix(uZen * 0.55 + uHorA * 0.25, uHorS * 1.25 + vec3(0.12, 0.03, 0.06), uCloudLit * pow(max(cs, 0.0), 0.7));
      col = mix(col, cc, cov * 0.85);
    }
    if (h < 0.0) col = hor * 0.92;
    return col;
  }`;
function ocSkyUniforms() {
  return {
    uSun: { value: new THREE.Vector3(0, 0.01, -1) }, uMoon: { value: new THREE.Vector3(0, 0.1, 1) }, uZen: { value: new THREE.Color() }, uHorS: { value: new THREE.Color() }, uHorA: { value: new THREE.Color() },
    uBelt: { value: new THREE.Color() }, uMoonC: { value: new THREE.Color(1, 0.8, 0.55) }, uGlow: { value: 1 }, uBeltH: { value: 0.1 }, uBeltK: { value: 1 }, uStars: { value: 0 }, uCloud: { value: 1 }, uCloudLit: { value: 1 }, uSunDisc: { value: 1 },
  };
}
function ocSky(scene) {
  const U = Object.assign(ocSkyUniforms(), { uUnder: { value: 0 }, uUnderC: { value: new THREE.Color('#06202a') } });
  const m = new THREE.Mesh(new THREE.SphereGeometry(9000, 64, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: U,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
    fragmentShader: /* glsl */`${OC_SKY_GLSL}
      uniform float uUnder; uniform vec3 uUnderC; varying vec3 vD;
      void main(){ vec3 D = normalize(vD); if (uUnder > 0.5) { gl_FragColor = vec4(uUnderC * (0.5 + 0.5 * smoothstep(-0.6, 0.2, D.y)), 1.0); return; } gl_FragColor = vec4(skyCol(D, 1.0), 1.0); }`,
  }));
  m.renderOrder = -10; m.frustumCulled = false; scene.add(m);
  const zc = new THREE.Color(), hc = new THREE.Color();
  return {
    mesh: m, U,
    set(s, cam) {
      const sun = ocSunAt(s), moon = ocMoonAt(s), C = ocSkyCols(sun.alt);
      U.uSun.value.set(...sun.v); U.uMoon.value.set(...moon.v);
      U.uZen.value.setRGB(...C.zen); U.uHorS.value.setRGB(...C.horS); U.uHorA.value.setRGB(...C.horA); U.uBelt.value.setRGB(...C.belt);
      U.uGlow.value = MathX.smooth(sun.alt, -11, 1.0); U.uSunDisc.value = MathX.smooth(sun.alt, -0.7, -0.2);
      // the pink band sits ~ (the Sun's depth + 3°) up in the east, fading as the Sun goes deeper than 6°
      U.uBeltH.value = MathX.deg(Math.max(1.2, 2.5 - 0.9 * sun.alt)); U.uBeltK.value = MathX.smooth(sun.alt, -8.5, -4.5) * MathX.smooth(sun.alt, 2.0, -0.5);
      U.uStars.value = MathX.smooth(sun.alt, -6.5, -10.0);
      U.uCloudLit.value = MathX.smooth(sun.alt, -7.5, -1.5);
      // the Moon: deep orange low down (through 30 times the air), yellow-white higher up
      const mu = MathX.smooth(moon.alt, 3, 16); U.uMoonC.value.setRGB(1.0, 0.62 + 0.3 * mu, 0.36 + 0.5 * mu).multiplyScalar(0.6 + 0.4 * mu);
      m.position.copy(cam.position);
      zc.setRGB(...C.zen); hc.setRGB(...C.horA).lerp(new THREE.Color(...C.horS), 0.35);
      return { zen: zc, hor: hc, alt: sun.alt, sun, moon };
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE SWELL — a long, low swell out of the south-east, a calm evening: [wavelength m, amplitude m, dir x, dir z, phase]
// (shared with JS: the boat, the buoy, the spray where it meets the rock)
// ---------------------------------------------------------------------------------------------------------------------
const OC_SWELL = [[190, 0.42, -0.62, -0.78, 0.4], [104, 0.2, -0.42, -0.9, 2.1], [61, 0.11, -0.85, -0.5, 4.4], [27, 0.05, -0.2, -1.0, 1.3], [11.5, 0.018, -0.9, 0.3, 5.1]];
function ocSwellY(x, z, t) {
  let y = 0;
  for (const [L, A, dx, dz, ph] of OC_SWELL) { const k = 2 * Math.PI / L, l = Math.hypot(dx, dz), w = Math.sqrt(9.81 * k); y += A * Math.sin(k * (x * dx + z * dz) / l - w * t + ph); }
  return y;
}
const OC_SWELL_GLSL = (() => {
  const T = OC_SWELL.map(([L, A, dx, dz, ph]) => { const k = 2 * Math.PI / L, l = Math.hypot(dx, dz), w = Math.sqrt(9.81 * k); return [A, k * dx / l, k * dz / l, w, ph]; });
  const f = (v) => v.toFixed(6);
  return `float swellY(vec2 p, float tt){ float y = 0.0; ${T.map(([A, kx, kz, w, ph]) => `y += ${f(A)} * sin(${f(kx)} * p.x + ${f(kz)} * p.y - ${f(w)} * tt + ${f(ph)});`).join(' ')} return y; }
  vec2 swellG(vec2 p, float tt){ vec2 g = vec2(0.0); ${T.map(([A, kx, kz, w, ph]) => `{ float c = ${f(A)} * cos(${f(kx)} * p.x + ${f(kz)} * p.y - ${f(w)} * tt + ${f(ph)}); g += vec2(${f(kx)}, ${f(kz)}) * c; }`).join(' ')} return g; }`;
})();

// ---------------------------------------------------------------------------------------------------------------------
// THE SEA
// ---------------------------------------------------------------------------------------------------------------------
function ocSea(scene, terr) {
  // a polar grid: rings from 0.4 m out to 60 km (each 4.5 % further than the last), 320 spokes
  const N = 320, R = [0]; for (let r = 0.4; r < 60000; r *= 1.045) R.push(r);
  const pos = [], idx = [];
  R.forEach((r) => { for (let k = 0; k < N; k++) { const a = k / N * Math.PI * 2; pos.push(Math.cos(a) * r, 0, Math.sin(a) * r); } });
  for (let i = 0; i < R.length - 1; i++) for (let k = 0; k < N; k++) { const a = i * N + k, b = i * N + (k + 1) % N, c = a + N, d = b + N; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e7);
  const T = OC_F.tower, H = OC_F.house;
  const U = Object.assign(ocSkyUniforms(), THREE.UniformsUtils.clone(THREE.UniformsLib.fog), {
    uTime: { value: 0 }, uLevel: { value: 0 }, uTerr: { value: terr.tex }, uTerrBox: { value: new THREE.Vector4(...terr.box) },
    uDeep: { value: new THREE.Color('#0b2430') }, uShal: { value: new THREE.Color('#1d4a48') }, uSkyK: { value: 1 }, uMoonK: { value: 0 }, uSunK: { value: 1 },
    uLamp: { value: new THREE.Vector4(0, T.lamp, 0, 0) }, uBeam: { value: 0 }, uLampUnder: { value: 0 },
    uTowerR: { value: T.inner + 0.05 }, uBld: { value: [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector4(0, 0, 0, -99)) }, uBldS: { value: [1, 1, 1, 1, 1, 1] }, uHouse: { value: new THREE.Vector4(H.x0 + 0.16, H.x1 - 0.16, H.z0 + 0.16, H.z1 - 0.16) }, uHouseTop: { value: H.ceil + 2.6 },
    uUnderCol: { value: new THREE.Color('#0d3a44') }, uFlash: { value: 0 }, uCurve: { value: 1 / (2 * OC_REARTH) }, uTerrOff: { value: 0 },
  });
  const mat = new THREE.ShaderMaterial({
    uniforms: U, fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: true,
    vertexShader: /* glsl */`
      uniform float uTime, uLevel, uCurve; varying vec3 vW; varying vec2 vG; varying float vCrest;
      ${OC_SWELL_GLSL}
      ${THREE.ShaderChunk.fog_pars_vertex}
      void main(){
        vec4 w = modelMatrix * vec4(position, 1.0);
        float d = length(w.xz - cameraPosition.xz);
        float k = 1.0 - smoothstep(700.0, 2600.0, d);             // the swell fades far off (its triangles are big there)
        float y = swellY(w.xz, uTime);
        w.y = uLevel + y * k - d * d * uCurve; vG = swellG(w.xz, uTime) * k; vCrest = y; vW = vec3(w.x, uLevel + y * k, w.z);
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        ${THREE.ShaderChunk.fog_vertex}
      }`,
    fragmentShader: /* glsl */`
      ${OC_SKY_GLSL}
      uniform float uTime, uLevel, uSkyK, uMoonK, uSunK, uBeam, uLampUnder, uTowerR, uHouseTop, uFlash, uTerrOff; uniform vec3 uDeep, uShal, uUnderCol; uniform vec4 uTerrBox, uLamp, uHouse; uniform vec4 uBld[6]; uniform float uBldS[6];
      uniform sampler2D uTerr; varying vec3 vW; varying vec2 vG; varying float vCrest;
      ${THREE.ShaderChunk.fog_pars_fragment}
      float h1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h1(i), h1(i + vec2(1, 0)), f.x), mix(h1(i + vec2(0, 1)), h1(i + vec2(1, 1)), f.x), f.y); }
      float terrH0(vec2 p){ vec2 uv = (p - uTerrBox.xy) * uTerrBox.zw; if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return -40.0 + uTerrOff; return texture2D(uTerr, uv).r + uTerrOff; }
      // (the loose boulders on the shore: the water over them is as shallow as it is)
      float terrH(vec2 p){ float y = terrH0(p); for (int i = 0; i < 6; i++) { vec2 d = p - uBld[i].xy; float q = uBld[i].z * uBld[i].z - dot(d, d); if (q > 0.0) y = max(y, uBld[i].w + uBldS[i] * sqrt(q)); } return y; }
      // the lamp's light in the water round it once it is under: four beams turning (angle uBeam), and its glow
      // (under water the lens can't focus: the beams spread into wide soft lobes that die within metres; a glow round it)
      float lampGlow(vec3 P){ vec3 d = P - uLamp.xyz; float r = length(d.xz) + 0.01, a = atan(d.z, d.x) - uBeam; float b = pow(abs(cos(2.0 * a)), 3.0);
        return uLampUnder * (exp(-r / 6.0) * 1.3 + b * exp(-r / 9.0) * 0.55) * exp(-max(0.0, uLevel - uLamp.y) / 7.0); }
      void main(){
        vec2 P = vW.xz;
        // nothing inside the tower's shaft or the house (they have their own water)
        if (length(P) < uTowerR) discard;
        if (P.x > uHouse.x && P.x < uHouse.y && P.y > uHouse.z && P.y < uHouse.w && uLevel < uHouseTop) discard;
        float dist = length(cameraPosition - vW), fade = 1.0 / (1.0 + dist / 60.0);
        float depth = vW.y - terrH(P);
        vec2 rip = vec2(n2(P * 0.6 + vec2(0.0, uTime * 0.33)) - 0.5, n2(P * 0.6 + vec2(7.3, -uTime * 0.29)) - 0.5) * 0.24
                 + vec2(n2(P * 2.3 + uTime * 0.8) - 0.5, n2(P * 2.3 + vec2(3.1, 1.7) - uTime * 0.75) - 0.5) * 0.13
                 + vec2(n2(P * 6.1 - uTime * 1.3) - 0.5, n2(P * 6.1 + vec2(5.2, 2.9) + uTime * 1.2) - 0.5) * 0.08;
        vec3 N = normalize(vec3(-vG.x - rip.x * fade, 1.0, -vG.y - rip.y * fade));
        // ---- foam: the swash on the rock, white water where the swell breaks over the shallows
        // (a thin ragged swash line on the rock; where the swell breaks over the shallows, a marbled net of thin white veins)
        float sh = smoothstep(3.0, 0.0, depth), crest = smoothstep(-0.15, 0.4, vCrest);
        float f1 = n2(P * 0.55 + vec2(uTime * 0.12, -uTime * 0.05)), f2 = n2(P * 1.7 - vec2(uTime * 0.2, uTime * 0.1));
        float veins = max(1.0 - smoothstep(0.0, 0.035, abs(f1 - 0.5)), (1.0 - smoothstep(0.0, 0.03, abs(f2 - 0.5))) * 0.7) * smoothstep(0.3, 0.6, n2(P * 0.25 + vec2(3.7, uTime * 0.03))) * (0.25 + 0.75 * smoothstep(0.3, 0.7, n2(P * 11.0 + vec2(uTime * 0.6, 1.3))));
        float foam = smoothstep(0.3 + 0.25 * f2, 0.0, depth) * (0.5 + 0.5 * veins) + sh * crest * veins * 0.85;
        foam = clamp(foam, 0.0, 1.0) * smoothstep(-0.05, 0.05, depth);
        vec3 V = normalize(cameraPosition - vW), col; float alpha = 1.0;
        float glow = lampGlow(vW);
        if (cameraPosition.y >= vW.y - 0.05) {
          // ---- from above: the sky in it (Fresnel), the water under it, the Sun's and the Moon's glitter
          vec3 Rf = reflect(-V, N); Rf.y = abs(Rf.y) + 0.002;
          // (far off, the ripples' slopes average the reflection down: a real sea at a low angle is darker than its sky)
          float fres = min(0.02 + 0.98 * pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 5.0), 0.56 + 0.36 * fade);
          vec3 sky = skyCol(normalize(Rf), 0.0);
          vec3 body = mix(uShal, uDeep, smoothstep(0.5, 6.0, depth)) * (0.06 + 0.94 * uSkyK) + vec3(0.03, 0.05, 0.06) * uMoonK;
          col = mix(body, sky, clamp(fres, 0.0, 1.0));
          float sg = max(dot(Rf, uSun), 0.0), mg = max(dot(Rf, uMoon), 0.0);
          col += vec3(1.0, 0.7, 0.42) * (pow(sg, 1400.0) * 30.0 + pow(sg, 90.0) * 0.8) * uSunK * (0.35 + 0.65 * fade);
          col += uMoonC * (pow(mg, 2600.0) * 4.0 + pow(mg, 160.0) * 0.22) * uMoonK;
          col = mix(col, vec3(0.8, 0.82, 0.86) * (0.08 + 0.75 * uSkyK + 0.22 * uMoonK) + uMoonC * 0.05 * uMoonK, foam * 0.85);
          col += vec3(0.55, 1.0, 0.82) * glow * 0.35;
          // (shallow water is clear: the rock shows through it)
          alpha = mix(1.0 - exp(-max(depth, 0.0) / 1.4), 1.0, max(fres, foam * 0.85));
        } else {
          // ---- from below: inside Snell's window the sky, bright; outside it, the sea's own blue-green
          vec3 d = normalize(vW - cameraPosition);
          vec3 Nu = normalize(vec3(-vG.x - rip.x * 0.9, 1.0, -vG.y - rip.y * 0.9));
          float cw = dot(d, Nu), win = smoothstep(0.62, 0.7, cw);
          vec3 skyIn = mix(uHorA, uZen, smoothstep(0.66, 1.0, cw)) * 1.4 + uMoonC * pow(max(dot(d, normalize(uMoon + vec3(0.0, 1.6, 0.0))), 0.0), 60.0) * 1.5 * uMoonK;
          col = mix(uUnderCol * 0.6, skyIn, win);
          col = mix(col, vec3(0.7, 0.78, 0.8) * (0.1 + 0.6 * uSkyK + 0.2 * uMoonK), foam * 0.5);
          col += vec3(0.5, 1.0, 0.8) * glow * 0.8;
        }
        col += vec3(1.0, 0.96, 0.85) * uFlash;
        gl_FragColor = vec4(col, alpha);
        ${THREE.ShaderChunk.fog_fragment}
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 2; scene.add(mesh);
  return {
    mesh, U,
    set(s, t, cam, sky, y0 = 0) {
      U.uTime.value = t; U.uLevel.value = OCP.h(s) + y0; U.uTerrOff.value = y0;
      for (const k of ['uSun', 'uMoon']) U[k].value.copy(sky.U[k].value);
      for (const k of ['uZen', 'uHorS', 'uHorA', 'uBelt', 'uMoonC']) U[k].value.copy(sky.U[k].value);
      for (const k of ['uGlow', 'uBeltH', 'uBeltK', 'uCloud', 'uCloudLit', 'uSunDisc']) U[k].value = sky.U[k].value; U.uCloud.value *= 0.4;   // (the sea's ripples smear the cloud streaks: keep only a hint of them)
      const sun = ocSunAt(s); U.uSkyK.value = ocSkyK(sun.alt); U.uSunK.value = ocSunK(sun.alt); U.uMoonK.value = ocMoonK(s);
      // (centred under the camera, snapped to 25 m so the grid doesn't swim)
      mesh.position.set(Math.round(cam.position.x / 25) * 25, 0, Math.round(cam.position.z / 25) * 25);
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE FAR COAST — the mainland (a silhouette of hills in the haze), the town's lights, the other lighthouses, the
// people's torches on the hill once the power has gone, and a ship passing far out (lit)
// ---------------------------------------------------------------------------------------------------------------------
function ocCoast(scene, sky) {
  const g = new THREE.Group(); scene.add(g);
  const drop = (d) => d * d / (2 * OC_REARTH);
  // the land: azimuth 250° … 380° (through north), shore 21–30 km off, hills behind it (the hill over the town)
  const shoreD = (az) => 1000 * (22.2 + 3.5 * Math.pow(Math.abs(az - 315) / 50, 1.6) + 1.2 * noise1(az * 0.08, 3));
  const hillY = (az) => { const n = 0.5 + 0.5 * noise1(az * 0.11, 7), n2 = 0.5 + 0.5 * noise1(az * 0.5, 9);
    return 25 + 140 * n * n + 40 * n2 + OC_F.hill.h * Math.exp(-Math.pow((az - OC_F.hill.az) / 2.6, 2)) + 150 * Math.exp(-Math.pow((az - 309) / 3.5, 2)) - 120 * MathX.smooth(Math.abs(az - 315), 40, 62); };
  const A0 = 252, A1 = 378, nA = 504, pos = [], col = [], idx = [];
  for (let i = 0; i <= nA; i++) {
    const az = A0 + (A1 - A0) * i / nA, [x, z] = ocAzXZ(az), d = shoreD(az), dh = d + 2600 + 1200 * noise1(az * 0.2, 4), hy = Math.max(8, hillY(az));
    pos.push(x * d, -4 - drop(d), z * d, x * (d + 300), 6 - drop(d + 300), z * (d + 300), x * dh, hy - drop(dh), z * dh);
    col.push(0.6, 0, 0, 0.75, 0, 0, 1, 0, 0);
  }
  for (let i = 0; i < nA; i++) for (let k = 0; k < 2; k++) { const a = i * 3 + k, b = a + 3; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); lg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); lg.setIndex(idx);
  const LU = Object.assign(ocSkyUniforms(), { uDark: { value: 0.03 } });
  const land = new THREE.Mesh(lg, new THREE.ShaderMaterial({
    uniforms: LU, fog: false,
    vertexShader: 'attribute vec3 color; varying vec3 vW; varying float vH; void main(){ vH = color.r; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `${OC_SKY_GLSL}
      uniform float uDark; varying vec3 vW; varying float vH;
      void main(){ vec3 D = normalize(vW - cameraPosition); vec3 sky = skyCol(vec3(D.x, max(D.y, 0.004), D.z), 0.0);
        // (25 km of evening air, against the afterglow: the hills a dark shade of the sky behind them; the ridges a little lighter)
        gl_FragColor = vec4(mix(sky * (0.09 + 0.06 * vH), vec3(uDark), 0.45), 1.0); }`,
  }));
  land.frustumCulled = false; land.renderOrder = 1; g.add(land);
  // ---- points of light (town, other lights, torches, the ship): one Points mesh, colour and size per point, rewritten per frame
  const MAX = 600, pp = new Float32Array(MAX * 3), pc = new Float32Array(MAX * 3), ps = new Float32Array(MAX);
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('color', new THREE.BufferAttribute(pc, 3)); pg.setAttribute('size', new THREE.BufferAttribute(ps, 1));
  for (const k of ['position', 'color', 'size']) pg.attributes[k].setUsage(THREE.DynamicDrawUsage);
  pg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e7);
  const PU = { uPx: { value: 1 } };
  const pts = new THREE.Points(pg, new THREE.ShaderMaterial({
    uniforms: PU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: 'attribute vec3 color; attribute float size; uniform float uPx; varying vec3 vC; void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = max(1.5, size * uPx); }',
    fragmentShader: 'varying vec3 vC; void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r = dot(q, q); if (r > 1.0) discard; gl_FragColor = vec4(vC * (exp(-r * 4.0) + 0.25 * exp(-r * 1.2)), 1.0); }',
  }));
  pts.frustumCulled = false; pts.renderOrder = 4; g.add(pts);
  const [tx, tz] = ocAzXZ(OC_F.town.az), along = [-tz, tx], hillXZ = ocAzXZ(OC_F.hill.az);
  const town = OC_TOWN.map(([u, el, kind], i) => {
    const d = OC_F.town.d + 400 + el * 18 + 120 * hash1(i * 13 + 5), x = tx * d + along[0] * u, z = tz * d + along[1] * u;
    return { x, z, d: Math.hypot(x, z), el, c: kind === 'warm' ? [1.0, 0.72, 0.4] : [1.0, 0.92, 0.78], f: 0.6 + 0.4 * hash1(i * 7 + 1) };
  });
  const lights = OC_F.lights.map(([az, km, fh, per, n, name]) => { const [x, z] = ocAzXZ(az); return { x: x * km * 1000, z: z * km * 1000, d: km * 1000, fh, per, n, name }; });
  const torches = Array.from({ length: 70 }, (_, i) => { const r = 120 * Math.sqrt(hash1(i * 3 + 2)), a = hash1(i * 5 + 9) * 6.283, d = OC_F.hill.d + Math.cos(a) * r; return { x: hillXZ[0] * d - hillXZ[1] * Math.sin(a) * r * 2, z: hillXZ[1] * d + hillXZ[0] * Math.sin(a) * r * 2, d, y: OC_F.hill.h - 6 + 8 * hash1(i * 11), ph: hash1(i * 17) * 9 }; });
  // a container ship 25 km out to the east-north-east, lit, steaming north-north-west; when you call it (the ship beat's
  // last caption) it turns towards you at 16 knots
  const ship = { az: 62, d: OCP.shipKm * 1000, v: OCP.shipKn * 0.5144, hd0: 340 };
  const shipState = (s) => {
    const s1 = ocSC('ship', 2), [cx, cz] = ocAzXZ(ship.az), P1 = [cx * ship.d, cz * ship.d];
    if (s < s1) { const [hx, hz] = ocAzXZ(ship.hd0), u = ship.v * (s - s1); return { x: P1[0] + hx * u, z: P1[1] + hz * u, hx, hz }; }
    const u = Math.min(ship.d - 400, ship.v * (s - s1)); return { x: P1[0] * (1 - u / ship.d), z: P1[1] * (1 - u / ship.d), hx: -cx, hz: -cz };
  };
  // its hull and bridge: dark shapes on the sea under its lights
  const hullM = new THREE.MeshBasicMaterial({ color: '#0b0e12' });
  const hull = new THREE.Group(); hull.visible = false; g.add(hull);
  { const b1 = new THREE.Mesh(new THREE.BoxGeometry(300, 17, 42), hullM); b1.position.y = 8.5; hull.add(b1);
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(250, 14, 40), hullM); b2.position.set(10, 24, 0); hull.add(b2);   // the containers
    const b3 = new THREE.Mesh(new THREE.BoxGeometry(22, 40, 40), hullM); b3.position.set(-118, 37, 0); hull.add(b3); } // the bridge, aft
  const flash = (l, t) => { const ph = ((t % l.per) + l.per) % l.per; if (!l.n) return 1 - MathX.smooth(ph, 0, 0.12) * (1 - MathX.smooth(ph, 0.7, 0.85)); let k = 0; /* (n = 0: occulting, on but for a short eclipse) */ for (let j = 0; j < l.n; j++) { const c = j * 1.6; k = Math.max(k, MathX.smooth(ph, c, c + 0.12) * (1 - MathX.smooth(ph, c + 0.4, c + 0.75))); } return k; };
  return {
    g, land, pts, lights, town,
    shipAt(s) { const q = shipState(s), d = Math.hypot(q.x, q.z); return [q.x, OCP.h(s) + 22 - drop(d), q.z]; },
    set(s, t, cam, o = {}) {
      for (const k of ['uSun', 'uMoon', 'uZen', 'uHorS', 'uHorA', 'uBelt', 'uMoonC']) LU[k].value.copy(sky.U[k].value);
      for (const k of ['uGlow', 'uBeltH', 'uBeltK', 'uCloud', 'uCloudLit', 'uSunDisc']) LU[k].value = sky.U[k].value;
      const h = OCP.h(s), dark = 1 - ocSkyK(ocSunAt(s).alt), grid = h < OCP.gridFail;
      // (points are sized for a 1080-line frame at the shot's lens: a narrow lens magnifies them)
      PU.uPx.value = (o.renderH || 1080) / 1080 * MathX.clamp(Math.pow(50 / cam.fov, 0.75), 1, 9);
      let n = 0;
      const put = (x, y, z, r, gg, b, sz) => { if (n >= MAX) return; pp[n * 3] = x; pp[n * 3 + 1] = y; pp[n * 3 + 2] = z; pc[n * 3] = r; pc[n * 3 + 1] = gg; pc[n * 3 + 2] = b; ps[n] = sz; n++; };
      const vis = Math.max(0.15, dark);
      // the town: a light is on while it stands above the sea and the grid holds
      if (grid) for (const L of town) if (L.el > h + 0.3) { const k = vis * L.f * 1.3; put(L.x, L.el - drop(L.d) + 3, L.z, L.c[0] * k, L.c[1] * k, L.c[2] * k, 2.6); }
      // the torches and phones on the hill, after the power goes
      if (!grid) for (const q of torches) { const k = 0.5 + 0.5 * Math.sin(t * 1.3 + q.ph); put(q.x, q.y - drop(q.d), q.z, 0.9 * k, 0.85 * k, 0.7 * k, 1.8); }
      // the other lights: each flashes its own character until the sea reaches its lamp
      for (const l of lights) if (h < l.fh) { const k = flash(l, t); if (k > 0.01) put(l.x, l.fh - drop(l.d), l.z, 1.8 * k, 1.65 * k, 1.4 * k, 9 + 10 * k); }
      // the ship (only where a shot wants it): masthead, bridge, deck lights
      hull.visible = !!o.ship;
      if (o.ship) { const q = shipState(s), d = Math.hypot(q.x, q.z), y0 = h - drop(d), X = (u) => q.x + q.hx * u, Z = (u) => q.z + q.hz * u;
        hull.position.set(q.x, y0, q.z); hull.rotation.y = Math.atan2(-q.hz, q.hx);
        for (let i = 0; i < 26; i++) { const u = (i / 25 - 0.5) * 280; put(X(u), y0 + 32 + (i % 5 === 0 ? 4 : 0), Z(u), 1.0, 0.86, 0.6, 1.8); }
        put(X(-118), y0 + 58, Z(-118), 1.2, 1.15, 1.0, 2.6); put(X(-118), y0 + 50, Z(-118), 1.0, 0.95, 0.85, 2.0);   // the bridge
        put(X(140), y0 + 46, Z(140), 1.2, 1.2, 1.1, 2.4);                                                              // the masthead light
        put(X(-118) + q.hz * 22, y0 + 44, Z(-118) - q.hx * 22, 1.0, 0.25, 0.18, 2.2); put(X(-118) - q.hz * 22, y0 + 44, Z(-118) + q.hx * 22, 0.25, 1.0, 0.4, 2.2); }   // port red, starboard green
      pg.setDrawRange(0, n); for (const k of ['position', 'color', 'size']) pg.attributes[k].needsUpdate = true;
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE BELL BUOY — a red float, a cage with a bell and a light on top; on 26 m of chain in 18 m of water. It rides the
// swell until the chain is straight up and down (the sea 8 m higher); then the chain holds it down and the sea climbs
// over it: the float, the cage, the bell, the light.
// ---------------------------------------------------------------------------------------------------------------------
function ocBuoy(scene) {
  const B = OC_F.bell, g = new THREE.Group(); scene.add(g);
  const red = ocStd('#a3221c', 0.55, 0.15), dark = ocStd('#22201e', 0.6, 0.4);
  ocCyl(0.95, 0.95, 0.9, red, 0, 0.1, 0, g, 24); ocCyl(0.95, 0.6, 0.35, red, 0, -0.5, 0, g, 24);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4, m = ocMesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 6), red, 0, 0, 0, g); ocStrut(m, [Math.cos(a) * 0.75, 0.5, Math.sin(a) * 0.75], [Math.cos(a) * 0.3, 3.2, Math.sin(a) * 0.3], 0.05); }
  ocCyl(0.36, 0.36, 0.08, red, 0, 3.2, 0, g, 16);
  const bell = ocMesh(new THREE.CylinderGeometry(0.16, 0.26, 0.4, 16, 1, true), ocStd('#6a5a3a', 0.35, 0.8), 0, 2.4, 0, g); bell.material.side = THREE.DoubleSide;
  const lampM = new THREE.MeshBasicMaterial({ color: '#ff5a3a' }); const lamp = ocMesh(new THREE.SphereGeometry(0.12, 12, 8), lampM, 0, 3.4, 0, g); lamp.castShadow = false;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: ocDotTex(0.5), color: '#ff6a40', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); glow.scale.setScalar(3.2); glow.position.y = 3.4; g.add(glow);
  g.position.set(B.x, 0, B.z);
  const maxY = -B.depth + B.chain;          // the float can rise no higher than this
  return {
    g, lamp, glow,
    set(s, t) {
      const h = OCP.h(s), sw = ocSwellY(B.x, B.z, t), free = h + sw * 0.9;
      // riding: the float's deck 0.55 m out of the water; held down: the chain stops it at maxY (the crests wash over)
      const y = Math.min(free, maxY + 0.15 * Math.max(0, free - maxY) / (1 + Math.max(0, free - maxY)));
      g.position.y = y - 0.15;
      const held = MathX.smooth(h, OCP.bellH - 0.4, OCP.bellH + 0.2);
      g.rotation.set(0.12 * Math.sin(t * 0.8) + 0.35 * held * (0.6 + 0.4 * Math.sin(t * 0.55)), 0, 0.1 * Math.cos(t * 0.7) - 0.1 * held);
      // the light flashes (1 s every 4 s) until it is under
      const on = ((t % 4) + 4) % 4 < 0.9 && g.position.y + 3.4 > h + sw - 0.05;
      lampM.color.set(on ? '#ff6a48' : '#3a1410'); glow.visible = on;
      g.visible = g.position.y + 3.8 > h - 3;
    },
  };
}
