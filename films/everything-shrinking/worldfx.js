/* =====================================================================
   WORLDFX — what every material of the shrinking world shares (classic script: globals).
   The world (EK_W, a group scaled by s round P) is lit by the real dawn: the Sun 0.5° below the horizon at 6:49 AM
   and rising 0.15° a minute. A shader patch (ekWorldPatch) works out, for every pixel, in the world's own metres:
     · whether the Sun is up there: its altitude at that point of the curved Earth (refraction added) against the
       local skyline (a horizon map towards the Sun's azimuth, ±12 km round P; the open curve of the Earth beyond),
       so the valley stays in the mountains' shadow while the peaks are lit, and the night side is dark
     · the sunlight's colour: reddened by the air between it and the Sun (low Sun → deep orange alpenglow)
     · the haze between it and your eye: the air's optical depth along the ray (scale height 8.4 km), so it stays
       right whatever size the world is, and from above the air the ground is clear
   Your own body and hands are not patched: their light is set from your eye (ekSunForYou).
   ===================================================================== */

const EK_RM = 6371000 + 1890;                      // m: the meadow's distance from the Earth's centre
const EK_HS = 8400;                                // m: the air's scale height
// the shared uniforms (one object: every patched material points at the same values)
const EK_U = {
  uS: { value: 1 },                                // the world's scale
  uEyeW: { value: new THREE.Vector3(0, 1.66, 0) }, // the camera, in world metres
  uEyeH: { value: 1.66 },                          // its height above the meadow's sphere (m)
  uSunW: { value: new THREE.Vector3(0, -0.01, -1) },
  uBeta: { value: 2.6e-5 },                        // 1/m: the haze's extinction at the meadow
  uHazeA: { value: new THREE.Color('#33405a') },   // the haze away from the Sun
  uHazeB: { value: new THREE.Color('#a86a4a') },   // and towards it
  uHor: { value: null }, uHorR: { value: 12000 },
  uSkyK: { value: 1 },                             // the skylight on the world (dawn), relative to the hemisphere light
  uSunK: { value: 1 },                             // the sunlight's strength
  uNightK: { value: 0 },                           // (the city lights on the night side: the globe)
};
const EK_WORLD_GLSL = /* glsl */`
  uniform float uS, uEyeH, uBeta, uHorR, uSkyK, uSunK;
  uniform vec3 uEyeW, uSunW, uHazeA, uHazeB;
  uniform sampler2D uHor;
  varying vec3 vWw; varying float vHs;
  // the Sun at this point of the world: 0 (set) … 1 (up), and its light's colour (reddened by the air)
  vec4 ekSunHere(vec3 w, float h) {
    vec3 up = normalize(w + vec3(0.0, ${EK_RM.toFixed(1)}, 0.0));
    float alt = degrees(asin(clamp(dot(up, uSunW), -1.0, 1.0)));
    float hor = -degrees(sqrt(2.0 * max(h + 300.0, 0.0) / ${EK_RM.toFixed(1)}));
    vec2 q = w.xz / (2.0 * uHorR) + 0.5;
    if (q.x > 0.002 && q.x < 0.998 && q.y > 0.002 && q.y < 0.998) hor = texture2D(uHor, q).r;
    float app = alt + 0.55 * smoothstep(4.0, -0.5, alt);                 // refraction lifts the Sun ~0.5° at the horizon
    float lit = smoothstep(-0.27, 0.27, app - hor);                     // (the Sun's disc is 0.53° across)
    float m = exp(-max(h, -2000.0) / ${EK_HS.toFixed(1)}) / (max(sin(radians(max(app, 0.0))), 0.0) + 0.026);
    vec3 col = exp(-m * vec3(0.018, 0.05, 0.115));
    return vec4(col, lit);
  }
  vec3 ekHaze(vec3 col, vec3 w, float h) {
    vec3 d = w - uEyeW; float L = length(d);
    float dh = (uEyeH - h) / ${EK_HS.toFixed(1)};
    float rho = abs(dh) < 1e-3 ? exp(-h / ${EK_HS.toFixed(1)}) : (exp(-h / ${EK_HS.toFixed(1)}) - exp(-uEyeH / ${EK_HS.toFixed(1)})) / dh;
    float od = uBeta * L * max(rho, 0.0);
    vec3 v = d / max(L, 1e-6);
    vec3 hz = mix(uHazeA, uHazeB, pow(max(dot(v, uSunW), 0.0), 3.0));
    hz *= mix(0.06, 1.0, smoothstep(-0.1, 0.03, dot(normalize(w + vec3(0.0, ${EK_RM.toFixed(1)}, 0.0)), uSunW)));   // (no glow over the night side)
    float e = exp(-od);
    return col * e + hz * (1.0 - e);
  }
`;
// patch a MeshStandard/Lambert material: the Sun's reach and colour, the skylight, the haze
function ekWorldPatch(mat, o = {}) {
  mat.onBeforeCompile = (sh) => {
    for (const k of Object.keys(EK_U)) sh.uniforms[k] = EK_U[k];
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uS; varying vec3 vWw; varying float vHs;' + (o.vHead || ''))
      .replace('#include <project_vertex>', `#include <project_vertex>
        vec4 ekWp = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          ekWp = instanceMatrix * ekWp;
        #endif
        ekWp = modelMatrix * ekWp; vWw = ekWp.xyz / uS;
        vHs = length(vWw + vec3(0.0, ${EK_RM.toFixed(1)}, 0.0)) - ${EK_RM.toFixed(1)};` + (o.vBody || ''));
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + EK_WORLD_GLSL + (o.fHead || ''))
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        { vec4 ekS = ekSunHere(vWw, vHs); reflectedLight.directDiffuse *= ekS.rgb * ekS.a * uSunK; reflectedLight.directSpecular *= ekS.rgb * ekS.a * uSunK;
          reflectedLight.indirectDiffuse *= uSkyK; reflectedLight.indirectSpecular *= uSkyK; }`)
      .replace('#include <fog_fragment>', (o.fBody || '') + '\n gl_FragColor.rgb = ekHaze(gl_FragColor.rgb, vWw, vHs);');
    if (o.after) o.after(sh);
  };
  mat.customProgramCacheKey = () => 'ekWorld' + (o.key || '');
  return mat;
}
// the same numbers in JS (for your body, which isn't patched; and for the checks)
function ekSunLocal(w, h, sunW) {
  const R = EK_RM, ux = w[0] / R, uy = (w[1] + R) / R, uz = w[2] / R, l = Math.hypot(ux, uy, uz);
  const alt = Math.asin(MathX.clamp((ux * sunW[0] + uy * sunW[1] + uz * sunW[2]) / l, -1, 1)) * 180 / Math.PI;
  return alt + 0.55 * ekSmooth(4, -0.5, alt);
}
function ekSunColor(app, h) {
  const m = Math.exp(-Math.max(h, -2000) / EK_HS) / (Math.max(Math.sin(Math.max(app, 0) * Math.PI / 180), 0) + 0.026);
  return [Math.exp(-m * 0.018), Math.exp(-m * 0.05), Math.exp(-m * 0.115)];
}
// a point on the curved Earth: (x, z) are distances along the meadow's sphere from P, h the height above it → [x, y, z]
function ekSphere(x, z, h, out = [0, 0, 0]) {
  const r = Math.hypot(x, z), th = r / EK_RM, k = EK_RM + h, st = Math.sin(th);
  out[0] = r > 1e-9 ? x / r * k * st : 0; out[2] = r > 1e-9 ? z / r * k * st : 0; out[1] = k * Math.cos(th) - EK_RM;
  return out;
}
// the skyline's elevation (°) from a point at height h (m above the meadow) towards azimuth az (°), the Earth's curve included
function ekSkyline(x0, z0, h, az, dMax = 400000) {
  const dx = Math.sin(az * Math.PI / 180), dz = -Math.cos(az * Math.PI / 180); let best = -90;
  for (let d = 40; d < dMax; d *= 1.045) { const y = ekGroundY(x0 + dx * d, z0 + dz * d) - d * d / (2 * EK_RM); const e = Math.atan2(y - h, d); if (e > best) best = e; }
  return best * 180 / Math.PI;
}
