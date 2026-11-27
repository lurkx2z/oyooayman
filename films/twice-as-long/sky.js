/* =====================================================================
   SKY SET — steps sixteen to twenty: out over New England and up (shots W1, W2, W4; Boston has its own set).
   The world is the tangent frame at your Central Park landing (x east, y up, z south, metres), so it lines up with
   New York's. Your path from step fifteen on is a straight line (the rule: every step is straight) 2° above the
   ground, on step fifteen's heading; the Earth curves away below it, so the ground drops away (sphere, R 6371 km).
   Floating origin: you are always at (0, 0, 0); the ground shader adds your position back (uA) to know where it is.
   The ground: one radial mesh out to 2,600 km, curved in the shader, coloured from a painted map of the North-East
   (twNeMap: the coast, the Sound, Cape Cod, the lakes and rivers, the cities) and detail noise; the clouds and the
   haze are drawn in the same shader (one surface: nothing to z-fight at 1,000 km).
   ===================================================================== */

const TW_R = 6371000;
const TW_SKY_HEAD = (() => { const d = [TW_ROUTE[15][0] - TW_ROUTE[14][0], TW_ROUTE[15][2] - TW_ROUTE[14][2]], l = Math.hypot(...d); return [d[0] / l, d[1] / l]; })();
const TW_CLIMB = Math.tan(2 * Math.PI / 180);
// where you are (tangent frame at step fourteen's landing), from step fifteen on: [x, y, z]
function twSkyPos(t) {
  const d = Math.max(0, twDist(t) - twSum(14));
  return [TW_SKY_HEAD[0] * d, d * TW_CLIMB, TW_SKY_HEAD[1] * d];
}
// your height above the curved ground (m)
function twAltAt(t) { const p = twSkyPos(t), r = Math.hypot(p[0], p[2]); return Math.hypot(r, TW_R + p[1]) - TW_R; }
// latitude / longitude ↔ the tangent frame (km at Central Park's latitude; fine at map scale)
const TW_LL0 = [40.782, -73.966];
const twLL = (lat, lon) => [(lon - TW_LL0[1]) * 111.32 * Math.cos(TW_LL0[0] * Math.PI / 180) * 1000 + TW_ROUTE[14][0] * 0, -(lat - TW_LL0[0]) * 110.95 * 1000];

// the painted map: x −900…1100 km, z −1300…500 km (z south), 2048², ~1 km a pixel
const TW_NE_MAP = { x0: -900e3, x1: 1100e3, z0: -1300e3, z1: 500e3 };
function twNeMap() {
  const M = TW_NE_MAP, W = 2048, H = 2048;
  const px = ([x, z]) => [(x - M.x0) / (M.x1 - M.x0) * W, (z - M.z0) / (M.z1 - M.z0) * H];
  const P = (lat, lon) => px(twLL(lat, lon));
  const coast = [[38.9, -74.9], [39.35, -74.45], [39.8, -74.1], [40.25, -73.99], [40.47, -74.02], [40.57, -74.0], [40.57, -73.93], [40.58, -73.75], [40.6, -73.4], [40.65, -73.0],
    [40.75, -72.6], [40.85, -72.3], [40.95, -72.05], [41.07, -71.86], [41.1, -72.0], [41.16, -72.24], [41.0, -72.5], [40.96, -72.85], [40.95, -73.15], [40.92, -73.45], [40.88, -73.65],
    [40.83, -73.79], [40.88, -73.77], [40.95, -73.68], [41.0, -73.55], [41.05, -73.4], [41.12, -73.2], [41.17, -73.05], [41.26, -72.9], [41.26, -72.6], [41.28, -72.35], [41.31, -72.1],
    [41.33, -71.9], [41.35, -71.7], [41.37, -71.5], [41.45, -71.42], [41.6, -71.42], [41.8, -71.38], [41.7, -71.25], [41.5, -71.2], [41.48, -71.05], [41.55, -70.9], [41.6, -70.75],
    [41.55, -70.65], [41.6, -70.45], [41.63, -70.2], [41.67, -69.96], [41.85, -69.95], [42.0, -70.0], [42.08, -70.15], [42.05, -70.22], [41.95, -70.06], [41.82, -70.12], [41.75, -70.3],
    [41.77, -70.55], [41.97, -70.65], [42.12, -70.72], [42.25, -70.85], [42.33, -70.98], [42.42, -70.95], [42.52, -70.85], [42.63, -70.62], [42.75, -70.8], [42.9, -70.8], [43.07, -70.7],
    [43.35, -70.5], [43.55, -70.3], [43.7, -70.15], [43.8, -69.8], [43.9, -69.4], [44.1, -69.05], [44.25, -68.75], [44.35, -68.3], [44.45, -67.8], [44.6, -67.3], [44.8, -66.95],
    [45.1, -67.0], [45.25, -66.1], [45.4, -65.2], [45.6, -64.5], [45.9, -64.0], [46.5, -64.6], [47.0, -64.8], [47.8, -64.5], [48.5, -64.2], [49.2, -64.6], [52, -62], [52, -86], [36, -86], [36, -76], [37.5, -75.6]];
  const novaScotia = [[43.5, -65.7], [44.1, -64.5], [44.6, -63.5], [45.0, -62.0], [45.2, -61.3], [45.9, -60.3], [46.9, -60.4], [46.2, -61.4], [45.7, -62.6], [45.3, -64.3], [44.6, -65.8], [43.8, -66.1]];
  const pei = [[46.0, -64.0], [46.45, -64.1], [46.95, -64.0], [46.5, -62.0], [46.2, -62.6]];
  const islands = [[[41.47, -70.75], [41.35, -70.45], [41.35, -70.8]], [[41.3, -70.2], [41.25, -69.95], [41.24, -70.2]], [[41.19, -71.6], [41.15, -71.55], [41.13, -71.62]]];
  return twCanvas(W, H, (g) => {
    const r = new RNG(77);
    g.fillStyle = '#1c4a6c'; g.fillRect(0, 0, W, H);
    // shallow water near the coast: a soft lighter band
    const poly = (L, fill, stroke, lw) => { g.beginPath(); L.forEach(([a, b], i) => { const [x, y] = P(a, b); if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath(); if (stroke) { g.lineWidth = lw; g.strokeStyle = stroke; g.lineJoin = 'round'; g.stroke(); } if (fill) { g.fillStyle = fill; g.fill(); } };
    for (const L of [coast, novaScotia, pei, ...islands]) poly(L, null, '#2a6a8a', 16);
    for (const L of [coast, novaScotia, pei, ...islands]) poly(L, '#6f7050', null);
    // late-November land: brown and grey-green, darker hills; patches
    g.save(); g.beginPath(); for (const L of [coast, novaScotia, pei, ...islands]) { L.forEach(([a, b], i) => { const [x, y] = P(a, b); if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath(); } g.clip();
    for (let i = 0; i < 9000; i++) { const x = r.range(0, W), y = r.range(0, H), s = r.range(4, 26); g.fillStyle = r.pick(['rgba(92,86,58,0.35)', 'rgba(70,82,52,0.35)', 'rgba(120,104,72,0.3)', 'rgba(58,70,46,0.35)', 'rgba(132,118,86,0.25)']); g.beginPath(); g.ellipse(x, y, s, s * r.range(0.5, 1), r.range(0, 3), 0, 6.283); g.fill(); }
    // the mountains: the Adirondacks, the Green and White Mountains (darker, snow on the tops), the Berkshires
    const hills = [[44.1, -74.2, 70, 0], [43.9, -72.9, 60, 0.2], [44.2, -71.4, 45, 0.7], [42.4, -73.2, 30, 0], [45.2, -70.3, 55, 0.3], [41.9, -74.4, 35, 0]];
    for (const [la, lo, rk, snow] of hills) { const [x, y] = P(la, lo), R0 = rk * W / 2000; for (let k = 0; k < 160; k++) { const a = r.range(0, 6.283), d = Math.sqrt(r.next()) * R0, s = r.range(3, 10); g.fillStyle = r.next() < snow * 0.5 && d < R0 * 0.5 ? 'rgba(235,238,242,0.75)' : 'rgba(40,48,36,0.45)'; g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 1.4, s, 0, 6.283); g.fill(); } }
    // the cities (grey), biggest first
    const cities = [[40.75, -73.98, 30], [42.36, -71.06, 16], [41.82, -71.41, 8], [41.76, -72.67, 8], [41.31, -72.92, 6], [42.1, -72.59, 6], [42.26, -71.8, 6], [42.65, -73.75, 7], [43.66, -70.26, 4], [41.05, -73.54, 6], [41.18, -73.19, 6], [40.95, -73.8, 9], [40.73, -74.17, 14], [43.0, -71.46, 4]];
    for (const [la, lo, rk] of cities) { const [x, y] = P(la, lo), R0 = rk * W / 2000; for (let k = 0; k < 70; k++) { const a = r.range(0, 6.283), d = Math.sqrt(r.next()) * R0; g.fillStyle = 'rgba(150,146,140,0.5)'; g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, r.range(1.5, 4), 0, 6.283); g.fill(); } }
    g.restore();
    // rivers and lakes
    const line = (L, w) => { g.beginPath(); L.forEach(([a, b], i) => { const [x, y] = P(a, b); if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.lineWidth = w; g.strokeStyle = '#1e4e6e'; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); };
    line([[40.7, -74.02], [41.0, -73.9], [41.5, -73.97], [42.0, -73.93], [42.65, -73.75], [43.3, -73.6]], 3);
    line([[41.27, -72.35], [41.6, -72.6], [42.1, -72.6], [42.7, -72.5], [43.4, -72.4], [44.0, -72.1], [45.0, -71.5]], 2.5);
    line([[43.6, -73.4], [44.0, -73.4], [44.5, -73.32], [45.0, -73.25]], 7);
    line([[41.4, -72.1], [42.3, -71.95]], 1.5); line([[42.8, -70.9], [43.6, -71.6]], 2); line([[43.9, -69.8], [45.5, -69.6]], 2.5);
    for (const [la, lo, s] of [[43.6, -71.35, 6], [42.42, -72.3, 3.5], [45.8, -69.7, 8], [45.5, -70.9, 4], [44.9, -72.2, 4]]) { const [x, y] = P(la, lo); g.fillStyle = '#1e4e6e'; g.beginPath(); g.ellipse(x, y, s, s * 1.6, 0.4, 0, 6.283); g.fill(); }
  });
}

TW_SETS.sky = (app) => {
  const S = twSet(app, { sky: '#000000', fov: 50, near: 0.5, far: 4e6, hemi: ['#cfe0f2', '#6a6050', 0.7], sun: TW_SUN.map((v) => v * 100), sunColor: '#fff2e0', sunI: 2.8, env: ['#8ab4e0', '#c8d8e8', '#5a5448'] });
  const scene = S.scene, cam = S.camera;
  S.sun.castShadow = false;
  const sunDir = new THREE.Vector3(...TW_SUN).normalize();
  // ---- the sky: a screen-filling dome drawn at the far plane; altitude darkens it, the limb glows above the horizon
  const skyM = new THREE.ShaderMaterial({
    depthWrite: false, depthTest: false, side: THREE.BackSide,
    uniforms: { uAlt: { value: 0 }, uSun: { value: sunDir.clone() } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
    fragmentShader: `uniform float uAlt; uniform vec3 uSun; varying vec3 vD;
      void main(){ vec3 D = normalize(vD); float R = 6371000.0, h = max(uAlt, 1.0);
        float dip = acos(clamp(R / (R + h), -1.0, 1.0));                         // the horizon's dip below level
        float e = asin(clamp(D.y, -1.0, 1.0)) + dip;                              // elevation above the horizon
        float thick = exp(-h / 9000.0);                                           // how much air is above you
        vec3 zen = mix(vec3(0.0, 0.0, 0.004), vec3(0.09, 0.26, 0.6), thick), hor = mix(vec3(0.1, 0.28, 0.62), vec3(0.62, 0.76, 0.9), thick);
        float w = mix(0.012, 0.35, thick);                                         // the limb's width (rad)
        vec3 col = mix(hor, zen, smoothstep(0.0, w * 2.5 + 0.2 * thick, e));
        col += vec3(0.18, 0.42, 0.85) * exp(-max(e, 0.0) / (w * 0.35)) * (1.0 - thick) * 0.9;   // the thin blue limb from high up
        col *= smoothstep(-0.02, 0.0, e) * 0.5 + 0.5;
        float g = max(dot(D, uSun), 0.0); col += vec3(1.0, 0.85, 0.6) * (pow(g, 12.0) * 0.25 * thick + pow(g, 600.0) * 3.0);
        gl_FragColor = vec4(col, 1.0); }`,
  });
  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(100, 48, 24), skyM); skyDome.renderOrder = -10; skyDome.frustumCulled = false; scene.add(skyDome);
  // ---- the ground: radial rings from 20 m to 2,600 km (exponential), 160 around
  const mapT = twTex(twNeMap(), { repeat: false }); mapT.anisotropy = 4;
  const gm = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.96, metalness: 0, map: mapT });
  const GU = { uA: { value: new THREE.Vector3() }, uMap: { value: new THREE.Vector4(TW_NE_MAP.x0, TW_NE_MAP.z0, TW_NE_MAP.x1 - TW_NE_MAP.x0, TW_NE_MAP.z1 - TW_NE_MAP.z0) }, uHaze: { value: new THREE.Color('#b8cce0') }, uAltC: { value: 0 }, uCloud: { value: 1 } };
  gm.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, GU);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform vec3 uA; uniform vec4 uMap; varying vec2 vG; varying float vDist;')
      .replace('#include <beginnormal_vertex>', `vec2 gW = position.xz + uA.xz; float gr2 = dot(gW, gW);
        float gy = -gr2 / (6371000.0 + sqrt(max(6371000.0 * 6371000.0 - gr2, 1.0)));
        vec3 objectNormal = normalize(vec3(gW.x, 6371000.0 + gy, gW.y));`)
      .replace('#include <begin_vertex>', `vec3 transformed = vec3(position.x, gy - uA.y, position.z); vG = gW;`)
      .replace('#include <uv_vertex>', '#include <uv_vertex>')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvDist = length((modelViewMatrix * vec4(transformed, 1.0)).xyz);');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        uniform vec4 uMap; uniform vec3 uHaze; uniform float uAltC, uCloud; varying vec2 vG; varying float vDist;
        float sH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float sN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(sH(i), sH(i + vec2(1, 0)), f.x), mix(sH(i + vec2(0, 1)), sH(i + vec2(1, 1)), f.x), f.y); }
        float sF(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * sN(p); p *= 2.03; a *= 0.5; } return s; }`)
      .replace('#include <map_fragment>', `
        vec2 muv = (vG - uMap.xy) / uMap.zw; muv.y = 1.0 - muv.y;
        vec3 mc = texture2D(map, clamp(muv, 0.0, 1.0)).rgb;
        if (muv.x < 0.0 || muv.x > 1.0 || muv.y < 0.0 || muv.y > 1.0) mc = vG.x > 1.0e6 || vG.y > 4.0e5 ? vec3(0.011, 0.065, 0.15) : vec3(0.12, 0.13, 0.08);
        float water = step(mc.b, mc.r * 0.9 + 0.02) < 0.5 && mc.b > mc.g * 0.95 ? 1.0 : 0.0;
        // detail: fields and woods (km and 100-m scales), fading out with distance (no shimmer)
        float near = 1.0 - smoothstep(8000.0, 90000.0, vDist), near2 = 1.0 - smoothstep(1500.0, 12000.0, vDist);
        float f1 = sF(vG / 2300.0), f2 = sF(vG / 260.0);
        vec3 lc = mc * (1.0 + (water > 0.5 ? 0.0 : (f1 - 0.5) * 0.6 * near));
        // woods (dark, brown-green), fields (pale tan), towns (grey): km-scale patches, fading out far away
        float wood = smoothstep(0.47, 0.53, sF(vG / 1400.0 + vec2(11.0, 3.0))), town = smoothstep(0.7, 0.74, sF(vG / 5200.0 + vec2(5.0, 9.0)));
        vec3 det = mix(vec3(0.19, 0.16, 0.1), vec3(0.055, 0.07, 0.035), wood);
        det = mix(det, vec3(0.2, 0.2, 0.21) * (0.7 + 0.6 * sN(vG / 60.0)), town * (1.0 - wood));
        det *= 0.85 + 0.3 * f2;
        lc = mix(lc, det, (water > 0.5 ? 0.0 : near * 0.75));
        // the clouds: scattered cumulus (one layer, drawn on the ground), and their shadow
        float cl = smoothstep(0.55, 0.78, sF(vG / 9000.0 + vec2(3.1, 7.7)) * 0.8 + sN(vG / 2500.0) * 0.3) * uCloud;
        float cs = smoothstep(0.55, 0.78, sF((vG + vec2(-1800.0, -900.0)) / 9000.0 + vec2(3.1, 7.7)) * 0.8 + sN((vG + vec2(-1800.0, -900.0)) / 2500.0) * 0.3) * uCloud;
        lc *= 1.0 - 0.45 * cs;
        diffuseColor.rgb = mix(lc, vec3(0.92, 0.94, 0.97), cl * 0.92);
        float twWater = water * (1.0 - cl);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.35, twWater);')
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
        float hz = 1.0 - exp(-vDist / mix(70000.0, 900000.0, clamp(uAltC / 30000.0, 0.0, 1.0)));
        gl_FragColor.rgb = mix(gl_FragColor.rgb, uHaze, hz * 0.85);
        if (any(isnan(gl_FragColor)) || any(isinf(gl_FragColor))) gl_FragColor = vec4(uHaze, 1.0);   // (the grazing horizon can give a NaN; the bloom would spread it into a black block)
        gl_FragColor.rgb = min(gl_FragColor.rgb, vec3(32.0));`);
  };
  gm.customProgramCacheKey = () => 'twSkyGround';
  {
    const rings = [0]; for (let r = 20; r < 2.6e6; r *= 1.07) rings.push(r);
    const seg = 160, pos = [], idx = [];
    for (const r of rings) for (let k = 0; k <= seg; k++) { const a = k / seg * Math.PI * 2; pos.push(Math.cos(a) * r, 0, Math.sin(a) * r); }
    for (let i = 0; i < rings.length - 1; i++) for (let k = 0; k < seg; k++) { const a = i * (seg + 1) + k, b = a + 1, c = a + seg + 2, d = a + seg + 1; idx.push(a, b, d, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((v, i) => (i % 3 === 1 ? 1 : 0)), 3)); g.setIndex(idx);
    const ground = new THREE.Mesh(g, gm); ground.frustumCulled = false; ground.receiveShadow = false; scene.add(ground);
  }
  // ---- you, glowing, and your trail
  const you = new YouCharacter(scene, { seed: 11 }); you.cup(true);
  const glow = twGlow(scene);
  const soft = twPuffs(scene, 4000, { soft: 1.4, near: [0.5, 4] }), adds = twPuffs(scene, 4000, { additive: true, soft: 1.8, near: [0.4, 3] });
  const head3 = new THREE.Vector3(TW_SKY_HEAD[0], TW_CLIMB, TW_SKY_HEAD[1]).normalize();
  const yaw = Math.atan2(TW_SKY_HEAD[0], TW_SKY_HEAD[1]);
  const side = [-TW_SKY_HEAD[1], TW_SKY_HEAD[0]];   // (to your left as you go: +90° from the heading, x/z)
  // ---- the cameras (relative to you): mode → (t, u) → { p, at, fov, near }
  const rel = (f, s, up) => [head3.x * f + side[0] * s, head3.y * f + up, head3.z * f + side[1] * s];
  const CAM = {
    meteor: (t, u) => ({ p: rel(-150 + 22 * u, 380, -60), at: rel(-80, 0, 0), fov: 50, near: 0.6 }),   // near ≤ 0.65: the post's half-float AO overflows on ground 65–200 km away otherwise
    england: (t, u) => ({ p: rel(-7.5, 2.4, 1.6), at: rel(60, -9, -9), fov: 58, near: 0.3 }),
    climb: (t, u) => ({ p: rel(-5.5, -1.8, -1.2), at: rel(10, 1.2, 2.2), fov: 60, near: 0.3 }),
  };
  const LAB = {
    england: (t, sh, A) => {
      const a = twWin(t, sh.t0 + 0.4, sh.t1, 0.3, 0.2), L = [];
      const put = (lat, lon, text, sub) => { const [x, z] = twLL(lat, lon); const gr2 = x * x + z * z, gy = -gr2 / (TW_R + Math.sqrt(TW_R * TW_R - gr2)); L.push({ p: [x - A[0], gy - A[1], z - A[2]], text, sub, a }); };
      put(41.7, -72.9, 'CONNECTICUT'); { const [bx, bz] = twLL(42.36, -71.06); put(42.36, -71.06, 'BOSTON', Math.round(Math.hypot(bx - A[0], bz - A[2]) / 10000) * 10 + ' KM AWAY'); } put(41.12, -72.75, 'LONG ISLAND SOUND');
      return L;
    },
  };
  const set = {
    scene, camera: cam,
    frame(t, shot) {
      const mode = shot.mode, u = t - shot.t0, A = twSkyPos(t), alt = twAltAt(t);
      GU.uA.value.set(A[0], A[1], A[2]); GU.uAltC.value = alt;
      skyM.uniforms.uAlt.value = alt;
      // you: arms up, a slow tumble in the glow
      const s = twStepAt(t);
      you.visible(true); you.place(0, -0.9, 0, yaw, 0, -1.25);
      const po = YOU_POSES.leap(0.5, { lead: s.n % 2 ? 1 : -1, reach: 0.6, arms: 'up' }); po.neck = -0.45; you.pose(po, ['cup', 'relax']);
      you.expr(mode === 'climb' ? 'awe' : 'scream', t, 1); you.look(null);
      const gk = mode === 'climb' ? 0.55 * (1 - MathX.smooth(alt, 30000, 80000)) + 0.2 : 1.0;
      glow.set([head3.x * 0.4, head3.y * 0.4, head3.z * 0.4], [head3.x, head3.y, head3.z], gk, mode === 'meteor' ? 26 : 2.0, '#ffb060');
      // the trail: your past positions (fire, then smoke), relative to you now
      soft.begin(); adds.begin();
      // the trail: along the line behind you (you go straight), by distance; its age from your film-time speed
      const vF = twL(Math.max(15, s.n)) / Math.max(0.3, TW_T[Math.max(15, s.n) + 1] - TW_T[Math.max(15, s.n)]), big = mode === 'meteor';
      for (let j = 0, d = 0.6; j < 700 && d < (big ? 40000 : 400); j++) {
        const age = d / vF, sz = big ? 34 + d * 0.035 : 0.8 + d * 0.06, heat = Math.exp(-age / (big ? 0.6 : 0.06));
        const x = -head3.x * d, y = -head3.y * d, z = -head3.z * d;
        if (heat > 0.01) adds.add(x, y, z, sz * 0.7, 0.85 * heat, 1.0, 0.6, 0.25);
        soft.add(x, y + age * (big ? 8 : 0.3), z, sz * 1.5, (big ? 0.5 : 0.3) * Math.exp(-age / 4) * MathX.smooth(age, 0.01, 0.25), 0.62, 0.6, 0.58);
        d += sz * 0.4;
      }
      if (big) { adds.add(0, 0, 0, 70, 1.0, 1.0, 0.92, 0.75); adds.add(0, 0, 0, 160, 0.55, 1.0, 0.62, 0.3); adds.add(0, 0, 0, 320, 0.25, 1.0, 0.45, 0.2); }   // the head: a fireball
      soft.end(); adds.end();
      GU.uCloud.value = mode === 'climb' ? 0.55 : 0.3;
      const cp = (CAM[mode] || CAM.climb)(t, u), dr = twDrift(t, mode === 'meteor' ? 4 : 0.05, 0.6, 3);
      twCam(cam, [cp.p[0] + dr[0], cp.p[1] + dr[1], cp.p[2] + dr[2]], cp.at, cp.fov);
      skyDome.position.copy(cam.position);
      cam.near = cp.near; cam.far = 4e6; cam.updateProjectionMatrix();
      set._A = A;
    },
    labels(t, shot) { const f = LAB[shot.mode]; return f ? f(t, shot, set._A || [0, 0, 0]) : []; },
    grade(t, p, shot) {
      p.exposure = 1.0; p.saturation = 1.12; p.bloom = 0.55; p.bloomThreshold = 0.8; p.vignette = 0.45; p.warmth = shot.mode === 'meteor' ? 0.06 : 0;
    },
  };
  return set;
};
