/* =====================================================================
   SF GEO — San Francisco for "What If Earthquakes Got 1 Magnitude Stronger Every Minute?": the land, the hills, the
   bay floor, the water, the city's blocks and the crack, at their real places (simplified). Metres; x east, z south,
   y up; the origin is the Ferry Building's clock tower (37.7955 N, 122.3937 W):
     x = (lon + 122.3937) × 87 970,  z = −(lat − 37.7955) × 111 000
   The waterfront frame (the Embarcadero): u along the shore towards the south-east, v out to the bay (north-east):
     [x, z] = u · EQ_WF.w + v · EQ_WF.n         (the seawall is v = 0 from Pier 9 to Pier 26; the café is at u = 380)
   The city's buildings are one instanced mesh whose shader sways them with the ground, shatters their windows and
   brings them down (each has a story second when it starts to fail, set by what it is built of).
   ===================================================================== */

const eqLL = (lat, lon) => [(lon + 122.3937) * 87970, -(lat - 37.7955) * 111000];
const EQ_WF = (() => { const a = 143 * Math.PI / 180; return { w: [Math.sin(a), -Math.cos(a)], n: [-Math.cos(a), -Math.sin(a)] }; })();
const eqWF = (u, v) => [u * EQ_WF.w[0] + v * EQ_WF.n[0], u * EQ_WF.w[1] + v * EQ_WF.n[1]];
const eqUV = (x, z) => [x * EQ_WF.w[0] + z * EQ_WF.w[1], x * EQ_WF.n[0] + z * EQ_WF.n[1]];
const EQ_CAFE_U = 380;                                  // the café and your pier (u)
const EQ_GROUND_Y = 2.2;                                // the waterfront's paving above the bay's mean level
const EQ_EPI = eqWF(EQ_CAFE_U, -30);                    // the epicentre (under the Embarcadero's median, in front of the café)

// ---- the shores (lat, lon → x, z); everything else is bay or ocean
const EQ_LANDLL = {
  sf: [[37.6, -122.5], [37.67, -122.497], [37.7, -122.505], [37.735, -122.507], [37.76, -122.5105], [37.775, -122.512], [37.7795, -122.5135], [37.7835, -122.5105],
    [37.7875, -122.5055], [37.788, -122.497], [37.7895, -122.491], [37.7905, -122.486], [37.7945, -122.4835], [37.8, -122.4815], [37.805, -122.478], [37.8085, -122.4775],
    [37.8105, -122.4765], [37.8075, -122.4715], [37.8055, -122.465], [37.8045, -122.455], [37.8045, -122.447], [37.807, -122.442], [37.8065, -122.437], [37.8085, -122.432],
    [37.8065, -122.4285], [37.8085, -122.4245], [37.8085, -122.4205], [37.809, -122.4165], [37.8095, -122.412], [37.81, -122.4095], [37.8075, -122.406], [37.805, -122.403],
    [37.8030, -122.4005], 'WF0', 'WF1', [37.786, -122.387], [37.78, -122.3875], [37.776, -122.387], [37.771, -122.3855], [37.765, -122.386], [37.76, -122.384], [37.754, -122.383],
    [37.748, -122.379], [37.74, -122.372], [37.732, -122.36], [37.727, -122.357], [37.72, -122.364], [37.714, -122.375], [37.708, -122.385], [37.7, -122.388], [37.68, -122.385],
    [37.65, -122.38], [37.6, -122.36]],
  marin: [[37.8255, -122.4785], [37.833, -122.476], [37.842, -122.474], [37.85, -122.477], [37.858, -122.479], [37.866, -122.488], [37.873, -122.492], [37.88, -122.5],
    [37.89, -122.505], [37.9, -122.49], [37.895, -122.47], [37.872, -122.452], [37.88, -122.44], [37.9, -122.445], [37.93, -122.47], [37.97, -122.48], [38.0, -122.46],
    [38.05, -122.49], [38.05, -122.8], [37.92, -122.72], [37.89, -122.66], [37.86, -122.59], [37.835, -122.545], [37.825, -122.532], [37.8157, -122.5294], [37.82, -122.515],
    [37.824, -122.5], [37.827, -122.49]],
  angel: [[37.8735, -122.4365], [37.87, -122.425], [37.862, -122.417], [37.852, -122.421], [37.848, -122.433], [37.854, -122.444], [37.865, -122.446]],
  ybi: [[37.8135, -122.369], [37.8125, -122.36], [37.807, -122.36], [37.805, -122.366], [37.8085, -122.3715]],
  ti: [[37.832, -122.377], [37.83, -122.364], [37.815, -122.366], [37.817, -122.379]],
  east: [[37.95, -122.34], [37.92, -122.32], [37.89, -122.31], [37.87, -122.305], [37.84, -122.3], [37.828, -122.3], [37.822, -122.315], [37.815, -122.33], [37.808, -122.325],
    [37.8, -122.32], [37.795, -122.3], [37.79, -122.29], [37.78, -122.28], [37.77, -122.3], [37.76, -122.29], [37.75, -122.26], [37.72, -122.24], [37.68, -122.2], [37.6, -122.15],
    [37.55, -122.1], [37.55, -121.9], [38.0, -121.9], [38.0, -122.4], [37.97, -122.36]],
};
const EQ_LAND = Object.fromEntries(Object.entries(EQ_LANDLL).map(([k, P]) => [k, P.flatMap((p) => p === 'WF0' ? [eqWF(-700, 0)] : p === 'WF1' ? [eqWF(800, 0)] : [eqLL(p[0], p[1])])]));
function eqInPoly(x, z, P) {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const [xi, zi] = P[i], [xj, zj] = P[j];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c;
  }
  return c;
}
const EQ_EDGES = (() => { const E = []; for (const P of Object.values(EQ_LAND)) for (let i = 0; i < P.length; i++) E.push([P[i], P[(i + 1) % P.length]]); return E; })();
// signed distance to the nearest shore (m): + on land, − in the water
function eqShoreSD(x, z) {
  let d = 1e9;
  for (const [a, b] of EQ_EDGES) {
    const vx = b[0] - a[0], vz = b[1] - a[1], l2 = vx * vx + vz * vz || 1, u = MathX.clamp(((x - a[0]) * vx + (z - a[1]) * vz) / l2, 0, 1);
    const dd = Math.hypot(x - a[0] - vx * u, z - a[1] - vz * u); if (dd < d) d = dd;
  }
  const land = Object.values(EQ_LAND).some((P) => eqInPoly(x, z, P));
  return land ? d : -d;
}

// ---- the hills: [lat, lon, height (m), radius (m)]
const EQ_HILLS = [
  [37.7544, -122.4477, 230, 700], [37.7381, -122.4542, 230, 500], [37.758, -122.4585, 200, 500], [37.793, -122.416, 95, 380], [37.8011, -122.4194, 80, 280],
  [37.8018, -122.4058, 72, 160], [37.7925, -122.435, 95, 700], [37.792, -122.465, 90, 800], [37.7429, -122.4157, 110, 350], [37.759, -122.399, 80, 380],
  [37.7855, -122.3925, 20, 150], [37.779, -122.452, 60, 300], [37.768, -122.441, 150, 350], [37.785, -122.5, 55, 600],
  [37.826, -122.5, 280, 900], [37.84, -122.52, 300, 1200], [37.845, -122.49, 220, 600], [37.9235, -122.5965, 650, 3000], [37.86, -122.495, 150, 700], [37.885, -122.46, 150, 900],
  [37.861, -122.432, 230, 700], [37.8095, -122.3655, 95, 330], [37.88, -122.24, 430, 2500], [37.83, -122.2, 430, 2500], [37.78, -122.15, 380, 2500],
].map(([la, lo, h, r]) => { const [x, z] = eqLL(la, lo); return [x, z, h, r]; });
const EQ_PARKS = [
  [eqLL(37.7735, -122.511), eqLL(37.7655, -122.4545)],     // Golden Gate Park
  [eqLL(37.806, -122.485), eqLL(37.788, -122.447)],        // the Presidio
  [eqLL(37.789, -122.512), eqLL(37.779, -122.49)],         // Lands End
].map(([a, b]) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])]);
const eqInPark = (x, z) => EQ_PARKS.some((r) => x > r[0] && x < r[2] && z > r[1] && z < r[3]);
// the waterfront set's own ground (waterfront.js builds it in detail): the terrain stays just under it
const eqInSetZone = (x, z) => { const [u, v] = eqUV(x, z); return u > -720 && u < 820 && v > -130 && v < 4; };

// land height above the bay's mean level (no shore blending)
function eqHillsAt(x, z) {
  let h = 6 + MathX.clamp((-x - 5500) / 4000, 0, 1) * 25;               // the Sunset rises gently from the ocean
  for (const [hx, hz, hh, r] of EQ_HILLS) { const d2 = ((x - hx) ** 2 + (z - hz) ** 2) / (r * r); if (d2 < 9) h += hh * Math.exp(-d2); }
  return h;
}
// the bay floor's depth (m, positive) at a point `sd` metres from shore (sd < 0)
function eqDepthAt(x, z, sd) {
  let d = Math.min(14, 2.5 + -sd * 0.03);
  const [gx, gz] = eqLL(37.817, -122.479);                                // the Golden Gate's channel: about 100 m deep
  d += 85 * Math.exp(-(((x - gx) ** 2) / (900 ** 2) + ((z - gz) ** 2) / (1700 ** 2)));
  return d;
}
// the ground's height (m) at x, z: land, a beach, the bay floor; under the waterfront set, just below its paving
function eqTerrainY(x, z, sd = eqShoreSD(x, z)) {
  if (eqInSetZone(x, z)) { const [, v] = eqUV(x, z); return v > -6 ? MathX.lerp(EQ_GROUND_Y - 3.5, -9, MathX.smooth(v, -6, 3)) : EQ_GROUND_Y - 3.5; }
  if (sd >= 0) return 2.2 + (eqHillsAt(x, z) - 2.2) * MathX.smooth(sd, 0, 220);
  return MathX.lerp(1.5, -eqDepthAt(x, z, sd), MathX.smooth(-sd, 0, 60));
}

// ---- seismic surface waves seen from the air (from magnitude nine): a ripple running out from the epicentre
// (the same function is in the terrain's and the buildings' shaders: EQ_WAVE_GLSL)
const EQ_WAVE = { k: 2 * Math.PI / 520, c: 260 };
function eqWaveA(s) { return s < 360 ? 0 : [0, 1.6, 3.2, 5.5, 8][Math.min(4, Math.floor((s - 360) / 60) + 1)] * MathX.smooth(s, 360, 368) * (0.75 + 0.25 * Math.sin(s * 0.9)); }
function eqWaveY(x, z, s) { const A = eqWaveA(s); if (!A) return 0; const r = Math.hypot(x - EQ_EPI[0], z - EQ_EPI[1]); return A * Math.sin(EQ_WAVE.k * (r - EQ_WAVE.c * s)) * Math.exp(-r / 14000); }
const EQ_WAVE_GLSL = `
  uniform float uS, uWaveA, uWaveK, uWaveC, uWaveL; uniform vec2 uEpi;
  float eqWaveY(vec2 p) { float r = length(p - uEpi); return uWaveA * sin(uWaveK * (r - uWaveC * uS)) * exp(-r / uWaveL); }`;
// (the wave's shape: San Francisco's by default; the other cities set their own, e.g. Mexico City's slow jelly)
const eqWaveU = (k = EQ_WAVE.k, c = EQ_WAVE.c, L = 14000) => ({ uWaveK: { value: k }, uWaveC: { value: c }, uWaveL: { value: L } });

// ---- the bay's water level (m) at a point v metres out from the waterfront (story s): calm; at magnitude nine the
// shaking sloshes the bay out (down 9 m at the shore), then it comes back as a wall that runs up over the Embarcadero
const EQ_BAY = { out0: 378, out1: 391, form: 387.5, wave: 392.5, speed: 34, crest: 13 };
// (the crest's distance from the seawall at story s: it reaches the seawall at s ≈ 396)
const eqBayFront = (s) => (EQ_BAY.wave - s) * EQ_BAY.speed + 120;
function eqBayY(v, s) {
  // (the drain and the wall end when the wall reaches the seawall, s ≈ 396: kept on, they went on running across the
  // rest of the bay for the rest of the film; the water over the land is eqSurge's)
  const end = 1 - MathX.smooth(s, EQ_BAY.wave + 3.6, EQ_BAY.wave + 7);
  const near = Math.exp(-Math.max(0, v) / 4000), drain = -14 * MathX.smooth(s, EQ_BAY.out0, EQ_BAY.out1) * near * end;
  let y = drain;
  if (s > EQ_BAY.form) {
    // a wall of water: the bay stays drained in front of it, the water is back behind it; a steep face, a long back
    const dv = v - eqBayFront(s), W = MathX.smooth(s, EQ_BAY.form, EQ_BAY.form + 3.5), passed = MathX.smooth(dv, -4, 10) * W;
    const sg = dv < 0 ? 14 : 80;
    y = drain * (1 - passed) + EQ_BAY.crest * W * end * Math.exp(-(dv * dv) / (2 * sg * sg)) + 3.2 * Math.exp(-Math.max(0, dv) / 900) * passed;
  }
  if (s > EQ_BAY.wave + 6) y += 1.6 * Math.sin((s - EQ_BAY.wave) * 0.11) * Math.exp(-(s - EQ_BAY.wave) / 120) * near;
  return y;
}
// the surge over the land after the wave: how deep (m) the water is at v (≤ 0, on the waterfront) at story s
function eqSurge(v, s) {
  const t = s - (EQ_BAY.wave + 4.2); if (t <= 0) return 0;
  const front = -t * 13;                                                  // the surge front runs inland at 13 m/s, slowing
  if (v < Math.max(front, -420)) return 0;
  return Math.max(0, (3.6 * Math.exp(-t / 70) + 0.8) * MathX.smooth(v, Math.max(front, -420), Math.max(front, -420) + 25) - Math.max(0, -v) * 0.002);
}

// ---------------------------------------------------------------------------------------------------------------------
// THE GROUND: 1 km tiles (40 m cells near the waterfront and downtown, 125 m farther, 250 m at the edges), heights
// from eqTerrainY, colours by what is there (streets and blocks, parks, the headlands' dry grass, sand, the bay's mud),
// skirts under every edge (no cracks between tiles of different sizes). The shader draws the street grid and the
// surface waves, and darkens the waterfront's fill as it liquefies.
// ---------------------------------------------------------------------------------------------------------------------
function eqGroundMat() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.93, metalness: 0 });
  const U = { uS: { value: 0 }, uWaveA: { value: 0 }, uEpi: { value: new THREE.Vector2(EQ_EPI[0], EQ_EPI[1]) }, uWet: { value: 0 }, uDust: { value: 0 } , ...eqWaveU() };
  m.userData.U = U;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aUrb;\nvarying float vUrb; varying vec3 vWP;' + EQ_WAVE_GLSL)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec4 eqW = modelMatrix * vec4(transformed, 1.0);
        transformed.y += eqWaveY(eqW.xz);
        vUrb = aUrb; vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        varying float vUrb; varying vec3 vWP; uniform float uWet, uDust; uniform float uS;
        float eqH2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        {
          // the streets: north of Market a grid along x/z (125 × 85 m), south of it a grid along Market (250 × 130 m)
          vec2 p = vWP.xz;
          bool north = p.y < -p.x;
          vec2 q = north || p.x < -2500.0 ? vec2(p.x / 125.0, p.y / 85.0) : vec2((p.x - p.y) * 0.7071 / 250.0, (p.x + p.y) * 0.7071 / 130.0);
          vec2 f = abs(fract(q) - 0.5) * vec2(north || p.x < -2500.0 ? 125.0 : 250.0, north || p.x < -2500.0 ? 85.0 : 130.0);
          float street = 1.0 - step(9.0, min(f.x, f.y) + 0.0);
          float aa = smoothstep(0.3, 1.2, length(fwidth(q)) * 40.0);
          street = mix(street, 0.22, aa) * vUrb;
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.33, 0.335, 0.34), street * 0.85);
          // the waterfront's fill (the old shore was about 300 m inland): wet and boiling as it liquefies
          float fill = smoothstep(-420.0, -250.0, dot(p, vec2(${EQ_WF.n[0].toFixed(5)}, ${EQ_WF.n[1].toFixed(5)}))) * step(vWP.y, 6.0);
          float boil = smoothstep(0.55, 0.9, eqH2(floor(p / 9.0))) * fill * uWet;
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.24, 0.22, 0.19), fill * uWet * 0.55);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.36, 0.33, 0.27), boil * 0.6);
          // the bay's floor, bared when the bay drains: wet mud in ripples, with puddles of sky
          float bed = smoothstep(-0.4, -2.0, vWP.y);
          float rip = 0.5 + 0.5 * sin(dot(p, vec2(${EQ_WF.n[0].toFixed(5)}, ${EQ_WF.n[1].toFixed(5)})) * 0.8 + sin(p.x * 0.031 + p.y * 0.027) * 3.0);
          float pud = smoothstep(0.78, 0.86, 0.5 + 0.25 * sin(p.x * 0.045 + sin(p.y * 0.03) * 2.0) + 0.25 * sin(p.y * 0.052 + p.x * 0.017));
          diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(0.2, 0.19, 0.16), vec3(0.28, 0.26, 0.22), rip), bed * 0.85);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.5, 0.57, 0.6), bed * pud * 0.5);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.36, 0.33, 0.29), uDust * 0.3 * vUrb);
          diffuseColor.rgb *= 1.0 - 0.38 * uDust * vUrb;   // (ash and rubble: the ruined city darkens)
          diffuseColor.rgb = pow(max(diffuseColor.rgb, 0.0), vec3(2.2));      // (the colours above are sRGB: to linear)
        }`);
  };
  m.customProgramCacheKey = () => 'eqGround';
  return m;
}
function eqTerrain(scene) {
  const mat = eqGroundMat(), tiles = [];
  const [cx, cz] = eqWF(EQ_CAFE_U, -200);
  const col = (x, z, y, sd) => {
    if (sd < 0) { const d = -y; return d < 1 ? [0.62, 0.58, 0.48] : MathX.clamp(d / 30, 0, 1) > 0.5 ? [0.27, 0.26, 0.22] : [0.38, 0.34, 0.27]; }   // sand, mud
    if (sd < 25 && y < 6) return [0.76, 0.71, 0.6];
    const ll = [37.7955 - z / 111000, -122.3937 + x / 87970];
    if (ll[0] > 37.812 || x > 4000) {                                      // Marin's and the East Bay's hills: October's dry grass, dark scrub
      const k = hash2(Math.floor(x / 90), Math.floor(z / 90)), dark = noise1(x * 0.0021 + z * 0.0013, 3) * 0.5 + 0.5;
      if (x > 4000 && y < 60) return [0.56, 0.55, 0.52];                   // Oakland's flats
      return dark > 0.62 ? [0.29, 0.33, 0.2] : [0.72 + 0.05 * k, 0.6 + 0.04 * k, 0.36];
    }
    if (eqInPark(x, z)) return [0.3, 0.43, 0.22];
    if (y > 175) return [0.5, 0.52, 0.3];
    return [0.62, 0.6, 0.57];
  };
  const urb = (x, z, y, sd) => (sd > 30 && !eqInPark(x, z) && x < 4000 && z > -1900 + Math.max(0, -x - 6000) * 0 && 37.7955 - z / 111000 < 37.812 && y < 175 ? 1 : 0);
  for (let tx = -16; tx < 12; tx++) for (let tz = -12; tz < 14; tz++) {
    const x0 = tx * 1000, z0 = tz * 1000, d = Math.hypot(x0 + 500 - cx, z0 + 500 - cz);
    const n = d < 3500 ? 25 : d < 8000 ? 8 : 4, step = 1000 / n;
    const pos = [], colr = [], urbA = [], idx = [];
    const vid = (i, j) => i * (n + 1) + j;
    let anyLand = false, minY = 1e9;
    for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) {
      const x = x0 + i * step, z = z0 + j * step, sd = eqShoreSD(x, z), y = eqTerrainY(x, z, sd);
      if (sd > -400) anyLand = true; minY = Math.min(minY, y);
      pos.push(x, y, z); colr.push(...col(x, z, y, sd)); urbA.push(urb(x, z, y, sd));
    }
    if (!anyLand && d > 9000) continue;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const a = vid(i, j), b = vid(i + 1, j), c = vid(i + 1, j + 1), e = vid(i, j + 1); idx.push(a, e, b, b, e, c); }
    // skirts: each edge copied 40 m down
    const edge = (list) => { const base = pos.length / 3; for (const k of list) { pos.push(pos[k * 3], pos[k * 3 + 1] - 40, pos[k * 3 + 2]); colr.push(colr[k * 3], colr[k * 3 + 1], colr[k * 3 + 2]); urbA.push(0); }
      for (let m = 0; m < list.length - 1; m++) { const a = list[m], b = list[m + 1], A = base + m, B = base + m + 1; idx.push(a, b, A, b, B, A, a, A, b, b, A, B); } };
    const L = (f) => { const o = []; for (let k = 0; k <= n; k++) o.push(f(k)); return o; };
    edge(L((k) => vid(0, k))); edge(L((k) => vid(n, k))); edge(L((k) => vid(k, 0))); edge(L((k) => vid(k, n)));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
    g.setAttribute('aUrb', new THREE.Float32BufferAttribute(urbA, 1)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.receiveShadow = true; m.castShadow = false; m.frustumCulled = true; scene.add(m); tiles.push(m);
  }
  return { mat, tiles };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE WATER: 1 km tiles (100 m cells: no long triangles), lifted by eqBayY (the slosh and the wave, in the shader),
// ripples and glints in the normals, foam on the crest
// ---------------------------------------------------------------------------------------------------------------------
function eqWater(scene) {
  const U = { uS: { value: 0 }, uFoam: { value: 0 } };
  const m = new THREE.MeshStandardMaterial({ color: '#235a74', roughness: 0.24, metalness: 0.1, envMapIntensity: 0.6 });
  m.userData.U = U;
  const N = EQ_WF.n.map((v) => v.toFixed(5)).join(', ');
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    const bay = `
      uniform float uS;
      float eqSm(float a, float b, float x) { float t = clamp((x - a) / (b - a), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }
      float eqBay(float v) {
        float end_ = 1.0 - eqSm(${(EQ_BAY.wave + 3.6).toFixed(1)}, ${(EQ_BAY.wave + 7).toFixed(1)}, uS);
        float near = exp(-max(0.0, v) / 4000.0), drain = -14.0 * eqSm(${EQ_BAY.out0.toFixed(1)}, ${EQ_BAY.out1.toFixed(1)}, uS) * near * end_;
        float y = drain;
        if (uS > ${EQ_BAY.form.toFixed(1)}) {
          float dv = v - ((${EQ_BAY.wave.toFixed(1)} - uS) * ${EQ_BAY.speed.toFixed(1)} + 120.0);
          float W = eqSm(${EQ_BAY.form.toFixed(1)}, ${(EQ_BAY.form + 3.5).toFixed(1)}, uS), passed = eqSm(-4.0, 10.0, dv) * W;
          float sg = dv < 0.0 ? 14.0 : 80.0;
          y = drain * (1.0 - passed) + ${EQ_BAY.crest.toFixed(1)} * W * end_ * exp(-(dv * dv) / (2.0 * sg * sg)) + 3.2 * exp(-max(0.0, dv) / 900.0) * passed;
        }
        if (uS > ${(EQ_BAY.wave + 6).toFixed(1)}) y += 1.6 * sin((uS - ${EQ_BAY.wave.toFixed(1)}) * 0.11) * exp(-(uS - ${EQ_BAY.wave.toFixed(1)}) / 120.0) * near;
        return y;
      }`;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying float vCrest;' + bay)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        { vec4 w = modelMatrix * vec4(transformed, 1.0); float v = dot(w.xz, vec2(${N}));
          float y0 = eqBay(v), y1 = eqBay(v + 25.0); transformed.y += y0; vCrest = clamp((y0 - y1) / 6.0, 0.0, 1.0) * step(1.5, y0); }
        vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    // (the foam per pixel: interpolated across the 100 m cells it drew big white hexagons)
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying float vCrest;' + bay)
      .replace('#include <color_fragment>', `#include <color_fragment>
        { float v = dot(vWP.xz, vec2(${N})), y0 = eqBay(v), y1 = eqBay(v + 25.0);
          float n = 0.55 + 0.45 * sin(vWP.x * 0.21 + sin(vWP.z * 0.13) * 2.0) * sin(vWP.z * 0.17 + vWP.x * 0.05);
          float crest = clamp((y0 - y1) / 6.0, 0.0, 1.0) * smoothstep(1.0, 3.0, y0) * n;
          // the wall: a dark green-blue face under a white, broken top
          float W = eqSm(${EQ_BAY.form.toFixed(1)}, ${(EQ_BAY.form + 3.5).toFixed(1)}, uS) * (1.0 - eqSm(${(EQ_BAY.wave + 3.0).toFixed(1)}, ${(EQ_BAY.wave + 6.0).toFixed(1)}, uS));
          float dv = v - ((${EQ_BAY.wave.toFixed(1)} - uS) * ${EQ_BAY.speed.toFixed(1)} + 120.0);
          float face = W * exp(-(dv + 13.0) * (dv + 13.0) / 120.0);
          float top = W * exp(-(dv + 2.0) * (dv + 2.0) / 70.0) * (0.6 + 0.4 * n);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.02, 0.075, 0.08), clamp(face, 0.0, 0.85));
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.62, 0.68, 0.7), clamp(max(crest * 1.4, top), 0.0, 0.9)); }`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        { vec2 q = vWP.xz; float a = sin(q.x * 0.09 + q.y * 0.05) + sin(q.x * -0.04 + q.y * 0.11) * 0.8 + sin(q.x * 0.23 - q.y * 0.19) * 0.35;
          float b = cos(q.x * 0.07 - q.y * 0.08) + cos(q.x * 0.13 + q.y * 0.03) * 0.7 + cos(q.x * -0.21 + q.y * 0.26) * 0.3;
          float fade = 1.0 - smoothstep(250.0, 2600.0, length(vWP - cameraPosition));
          normal = normalize(normal + (viewMatrix * vec4(a * 0.05 * fade, 0.0, b * 0.05 * fade, 0.0)).xyz);
          // (the slope of the slosh and the wave: without it the wall's face was lit like flat water, a white sheen)
          float vv = dot(vWP.xz, vec2(${N})), sl = (eqBay(vv + 2.0) - eqBay(vv - 2.0)) / 4.0;
          normal = normalize(normal + (viewMatrix * vec4(-sl * ${EQ_WF.n[0].toFixed(5)}, 0.0, -sl * ${EQ_WF.n[1].toFixed(5)}, 0.0)).xyz); }`);
  };
  m.customProgramCacheKey = () => 'eqWater';
  const geo = new THREE.PlaneGeometry(1000, 1000, 10, 10); geo.rotateX(-Math.PI / 2);
  const M4 = new THREE.Matrix4(), list = [];
  for (let x = -16000; x < 12000; x += 1000) for (let z = -12000; z < 14000; z += 1000) {
    // (skip tiles far inland)
    let wet = false; for (const [a, b] of [[0, 0], [1000, 0], [0, 1000], [1000, 1000], [500, 500]]) if (eqShoreSD(x + a, z + b) < 300) wet = true;
    if (wet) list.push([x + 500, z + 500]);
  }
  // (the tiles round the waterfront get 5 m cells (10 m drew a sawtooth along the crest), so the wave's steep face can be drawn; the rest keep 100 m)
  const c0 = eqWL(380, 0, 150), isNear = ([x, z]) => Math.hypot(x - c0[0], z - c0[2]) < 1300;
  const geoN = new THREE.PlaneGeometry(1000, 1000, 200, 200); geoN.rotateX(-Math.PI / 2);
  const mk = (g, L) => { const I = new THREE.InstancedMesh(g, m, Math.max(1, L.length)); I.count = L.length; L.forEach(([x, z], i) => { M4.makeTranslation(x, 0, z); I.setMatrixAt(i, M4); }); I.receiveShadow = true; I.frustumCulled = false; scene.add(I); return I; };
  const W = mk(geo, list.filter((t) => !isNear(t))), WN = mk(geoN, list.filter(isNear));
  return { mat: m, mesh: W, meshNear: WN };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE CITY: one instanced box per building. Instance attribute aFail = [story second it starts to fail, seed, kind]
// (kind: 0 a house, 1 old brick, 2 concrete, 3 a tower). The shader: windows by floor and bay; shattered windows
// (uBreak, more each minute); the sway (taller is slower and wider); the fall (pancake and lean over 3–8 s, then rubble);
// the surface waves; dust settling on everything.
// ---------------------------------------------------------------------------------------------------------------------
const EQ_CITY_VS = `
  attribute vec3 aFail;
  uniform float uLevel, uDust, uBreak;
  varying vec3 vWinP; varying vec3 vWinN; varying vec3 vWorldP; varying float vSeed; varying float vFall; varying float vKind;
  ${EQ_WAVE_GLSL}
  vec3 eqCityPos(vec3 pos, out vec3 sc) {
    sc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
    float c = clamp((uS - aFail.x) / (3.0 + sc.y / 45.0), 0.0, 1.0), cc = c * c;
    vec3 p = pos;
    p.y *= 1.0 - 0.86 * cc;                                                     // pancakes
    float low = 1.0 - smoothstep(0.0, 0.5, pos.y);
    p.xz = (p.xz - 0.0) * (1.0 + 0.45 * cc * low);                              // rubble spreads at the foot
    vec4 w = modelMatrix * instanceMatrix * vec4(p, 1.0);
    vec2 base = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xz;
    float hy = (w.y - (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).y);
    float ang = aFail.y * 6.2832, lean = cc * (0.1 + 0.4 * fract(aFail.y * 7.3)) * (aFail.z > 2.5 ? 1.6 : 1.0);
    w.xz += vec2(cos(ang), sin(ang)) * sin(lean) * hy;
    // the sway: a building's period is about 0.1 s per floor
    float T = max(0.25, 0.1 * sc.y / 3.4), sw = uLevel * 0.05 * sin(6.2832 * uS / T + aFail.y * 40.0) * (1.0 - c);
    w.xz += vec2(cos(ang + 1.3), sin(ang + 1.3)) * sw * hy;
    w.y += eqWaveY(base);
    vSeed = aFail.y; vFall = c; vKind = aFail.z;
    return w.xyz;
  }`;
function eqCityMat() {
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.8, metalness: 0.0 });
  const U = { uS: { value: 0 }, uLevel: { value: 0 }, uWaveA: { value: 0 }, uEpi: { value: new THREE.Vector2(EQ_EPI[0], EQ_EPI[1]) }, uDust: { value: 0 }, uBreak: { value: 0 }, uGlass: { value: new THREE.Color('#5d7d94') }, uNight: { value: 0 }, uOut: { value: 0 }, ...eqWaveU() };
  m.userData.U = U;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + EQ_CITY_VS)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec3 eqSc; vec3 eqWp = eqCityPos(transformed, eqSc);
        vWinP = (position + vec3(0.5, 0.0, 0.5)) * eqSc; vWinN = normal; vWorldP = eqWp;`)
      .replace('#include <project_vertex>', `vec4 mvPosition = viewMatrix * vec4(eqWp, 1.0); gl_Position = projectionMatrix * mvPosition;`)
      .replace('#include <worldpos_vertex>', `vec4 worldPosition = vec4(eqWp, 1.0);`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        varying vec3 vWinP; varying vec3 vWinN; varying vec3 vWorldP; varying float vSeed; varying float vFall; varying float vKind; uniform vec3 uGlass; uniform float uDust, uBreak, uNight, uOut;
        float eqH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float side = 1.0 - step(0.5, abs(vWinN.y));
        float along = abs(vWinN.x) > 0.5 ? vWinP.z : vWinP.x;
        float flH = vKind > 2.5 ? 3.9 : 3.3, bay = vKind > 2.5 ? 2.4 : 3.2;
        float fl = (vWinP.y - 3.0) / flH, by = along / bay;
        vec2 cell = vec2(floor(by), floor(fl)), f = vec2(fract(by), fract(fl));
        float win = side * step(0.15, f.x) * step(f.x, 0.85) * step(0.22, f.y) * step(f.y, vKind > 2.5 ? 0.92 : 0.84) * step(0.0, fl);
        float rn = eqH(cell + vSeed * 31.0);
        float aa = smoothstep(0.22, 0.6, max(fwidth(by), fwidth(fl)));
        win = mix(win, side * 0.42 * step(0.0, fl), aa); rn = mix(rn, 0.5, aa);
        vec3 glass = uGlass * (0.72 + 0.55 * rn) + vec3(0.08) * step(0.86, rn);
        float broken = step(eqH(cell * 1.7 + vSeed * 7.0), uBreak) * (1.0 - aa);
        broken = max(broken, step(0.05, vFall));
        diffuseColor.rgb = mix(diffuseColor.rgb, mix(glass, vec3(0.04, 0.038, 0.035), broken), win);
        diffuseColor.rgb *= mix(mix(1.0, 0.88, side * step(0.93, fract(fl))), 1.0, aa);
        // the roofs: tar, gravel, terracotta, a few white (seen from the air, the city is its roofs)
        float roofH = fract(vSeed * 57.3);
        vec3 roof = roofH < 0.38 ? vec3(0.055, 0.055, 0.06) : roofH < 0.7 ? vec3(0.15, 0.145, 0.135) : roofH < 0.84 ? vec3(0.3, 0.11, 0.06) : vec3(0.42, 0.41, 0.38);
        diffuseColor.rgb = mix(diffuseColor.rgb, roof * (0.85 + 0.3 * fract(vSeed * 91.7)), step(0.5, vWinN.y) * (vKind > 2.5 ? 0.6 : 0.88));
        // fallen: dust-grey rubble; and dust settles on everything
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.27, 0.24, 0.2) * (0.8 + 0.3 * eqH(floor(vWorldP.xz / 3.0))), smoothstep(0.35, 0.9, vFall));
        // (some of the rubble burnt black: from the air the ruins read as ruins, not as pale cookies)
        diffuseColor.rgb *= mix(1.0, 0.3, step(0.68, eqH(floor(vWorldP.xz / 9.0) + 3.1)) * smoothstep(0.35, 0.9, vFall));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.24, 0.21, 0.18), uDust * 0.4);
        diffuseColor.rgb *= mix(1.0, 0.4, uNight);                             // (at night the walls are dark: the light is the windows)
        float eqWin = win * (1.0 - broken);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.08, eqWin);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        // at night: lit windows (some rooms dark; whole buildings go dark as the power fails: uOut)
        float eqLitP = mix(step(0.66, eqH(cell * 1.3 + vSeed * 91.0)), 0.2, aa);
        float eqLit = eqWin * uNight * step(uOut, fract(vSeed * 13.7)) * eqLitP;
        totalEmissiveRadiance += vec3(1.0, 0.76, 0.48) * eqLit * (0.4 + 0.5 * rn);`)
      .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
        metalnessFactor = mix(metalnessFactor, 0.45, eqWin);`);
  };
  m.customProgramCacheKey = () => 'eqCity';
  // the shadow pass moves the buildings the same way
  const dm = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  dm.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    // (no varyings in the depth pass: the same names as plain globals)
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + EQ_CITY_VS.replace(/varying /g, ''))
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec3 eqSc; vec3 eqWp = eqCityPos(transformed, eqSc);`)
      .replace('#include <project_vertex>', `vec4 mvPosition = viewMatrix * vec4(eqWp, 1.0); gl_Position = projectionMatrix * mvPosition;`);
  };
  dm.customProgramCacheKey = () => 'eqCityDepth';
  return { mat: m, depth: dm, U };
}

// what each place is built of, and when it fails: [kind, the magnitude it starts to fail at (continuous)]
function eqFailMag(kind, r) {
  if (kind === 1) return 6.75 + r * 1.6;           // old brick: from 6.75
  if (kind === 0) return 8.1 + r * 2.3;            // wooden houses bend: from 8.1
  if (kind === 2) return 7.6 + r * 2.4;            // concrete
  return 8.4 + r * 2.0;                            // steel towers
}
const eqMagToS = (M) => (M - 3) * 60;              // the story second a continuous magnitude is reached (3 at 0)

function eqCity(scene, avoid) {
  const r = new RNG(20261128);
  const B = [];   // [x, z, w, d, h, rot, color, kind]
  const pal = {
    house: ['#efece4', '#e9e4d8', '#e8dcc0', '#eee0a8', '#c8d8e2', '#cfe0cc', '#e8c8c0', '#d0d0cc', '#d8c8a8', '#f2efe8', '#bcd0dc', '#e4d4b8'],
    brick: ['#9a5a44', '#8a4c3a', '#a86a50', '#7c4434', '#b07a5c'], stone: ['#c9c0b0', '#d4cbbb', '#b8ae9e', '#e2ddd2'], glass: ['#7f96a8', '#8ea4b2', '#6f8698', '#a0b2bc', '#5f7484'],
  };
  const pick = (a) => a[Math.floor(r.next() * a.length)];
  const core = (x, z) => Math.max(Math.exp(-(((x + 450) ** 2) + ((z - 350) ** 2)) / (2 * 650 * 650)), 0.75 * Math.exp(-(((x - 520) ** 2) + ((z - 800) ** 2)) / (2 * 260 * 260)));
  const okAt = (x, z, rad) => {
    const sd = eqShoreSD(x, z);
    if (sd < 25 + rad * 0.5 || eqInPark(x, z) || eqInSetZone(x, z)) return null;
    if (avoid.some(([ax, az, ar]) => Math.hypot(x - ax, z - az) < ar + rad)) return null;
    if (Math.abs(x + z) * 0.7071 < 16 && x < 0 && x > -4000) return null;                 // Market Street
    const y = eqTerrainY(x, z, sd); if (y > 172) return null;
    const ll = 37.7955 - z / 111000; if (ll > 37.811 || x > 3500) return null;             // (Marin, the East Bay: hills only)
    return y;
  };
  const push = (x, z, w, d, h, rot, color, kind) => B.push([x, z, w, d, h, rot, color, kind]);
  // a block: cx, cz centre, bw × bd (along its axes), rot (rad)
  const block = (cx, cz, bw, bd, rot) => {
    const c = core(cx, cz), ca = Math.cos(rot), sa = Math.sin(rot);
    const at = (a, b) => [cx + ca * a + sa * b, cz - sa * a + ca * b];
    if (c > 0.25) {                                                                          // downtown: towers and mid-rises
      const n = c > 0.5 ? 2 : 3;
      for (let k = 0; k < n; k++) {
        const w = bw / n - 4, [x, z] = at(-bw / 2 + (k + 0.5) * bw / n, 0);
        if (okAt(x, z, w * 0.5) === null) continue;
        const tall = r.next() < c * 0.8;
        const h = tall ? r.range(55, 90 + 170 * c) : r.range(18, 45);
        push(x, z, w, tall ? Math.min(bd - 6, r.range(28, 46)) : bd - 6, h, rot, tall ? pick(r.next() < 0.6 ? pal.glass : pal.stone) : pick(r.next() < 0.4 ? pal.brick : pal.stone), tall ? 3 : r.next() < 0.45 ? 1 : 2);
      }
      return;
    }
    // neighbourhoods: rows of houses and flats along both long sides
    const n = Math.max(2, Math.round(bw / 28));
    for (const side of [-1, 1]) for (let k = 0; k < n; k++) {
      const w = bw / n - 1.5, [x, z] = at(-bw / 2 + (k + 0.5) * bw / n, side * bd * 0.25);
      const y = okAt(x, z, w * 0.5); if (y === null) continue;
      const mid = r.next() < 0.18 + 0.4 * c, h = mid ? r.range(14, 26) : r.range(7.5, 12.5);
      push(x, z, w, bd * 0.5 - 3, h, rot, mid ? pick(r.next() < 0.35 ? pal.brick : pal.stone) : pick(pal.house), mid ? (r.next() < 0.5 ? 1 : 2) : 0);
    }
  };
  // north of Market (and the west): along x/z; south of Market (east of x −2500): along Market
  for (let x = -12500; x < 1500; x += 125) for (let z = -2600; z < 9500; z += 85) {
    const cx = x + 62.5, cz = z + 42.5;
    if (!(cz < -cx || cx < -2500)) continue;
    const far = Math.hypot(cx + 1500, cz - 1500);
    if (far > 6500 && (Math.floor(x / 125) + Math.floor(z / 85)) % 2) continue;       // (thinner far away)
    block(cx, cz, 105, 70, 0);
  }
  const a = Math.PI / 4, ca = Math.cos(a), sa = Math.sin(a);
  for (let i = -30; i < 30; i++) for (let j = -40; j < 40; j++) {
    const lx = i * 250 + 125, lz = j * 130 + 65, cx = ca * lx + sa * lz, cz = -sa * lx + ca * lz;
    if (!(cz >= -cx && cx >= -2500) || cx > 3000 || cz > 9500) continue;
    block(cx, cz, 230, 112, a);
  }
  // the instances
  const geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
  const { mat, depth, U } = eqCityMat();
  const mesh = new THREE.InstancedMesh(geo, mat, B.length);
  const fail = new Float32Array(B.length * 3);
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3(), C = new THREE.Color(), Y = new THREE.Vector3(0, 1, 0);
  const info = [];
  B.forEach(([x, z, w, d, h, rot, color, kind], i) => {
    const hw = Math.max(w, d) * 0.5;
    let y = 1e9; for (const [ox, oz] of [[0, 0], [hw, hw], [-hw, hw], [hw, -hw], [-hw, -hw]]) y = Math.min(y, eqTerrainY(x + ox, z + oz));
    P.set(x, y - 3, z); Q.setFromAxisAngle(Y, rot); S.set(w, h + 3, d); M4.compose(P, Q, S); mesh.setMatrixAt(i, M4);
    C.set(color); mesh.setColorAt(i, C);
    const rr = twoR(i), sf = eqMagToS(eqFailMag(kind, rr)) + 6 * hash1(i * 13 + 5);
    fail[i * 3] = sf; fail[i * 3 + 1] = hash1(i * 31 + 7); fail[i * 3 + 2] = kind;
    info.push({ x, z, y, h, w: Math.max(w, d), sf, kind });
  });
  geo.setAttribute('aFail', new THREE.InstancedBufferAttribute(fail, 3));
  mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false; mesh.customDepthMaterial = depth;
  scene.add(mesh);
  return { mesh, U, info };
}
const twoR = (i) => hash1(i * 7919 + 104729);

// ---------------------------------------------------------------------------------------------------------------------
// THE CRACK: a ribbon along your earthquake's path through the city (from the epicentre along the Embarcadero's
// median, then inland to join the San Andreas offshore), as long as eqRupture says and as wide as the magnitude; dark,
// then glowing where the rock melts (magnitude 11 on). The fault lines map (the San Andreas, the Hayward) for minute two.
// ---------------------------------------------------------------------------------------------------------------------
const EQ_CRACK_PATH = (() => {
  // (along the Embarcadero's median the whole length of the waterfront set, then inland to the fault)
  const local = { north: [eqWF(EQ_CAFE_U, -30), eqWF(-720, -30), eqWF(-900, -260)], south: [eqWF(EQ_CAFE_U, -30), eqWF(820, -30), eqWF(1000, -260)] };
  const out = {};
  for (const b of ['north', 'south']) out[b] = local[b].concat(EQ_FAULT[b].slice(1).map(([la, lo]) => eqLL(la, lo)));
  return out;
})();
// the crack's width (m) at story time s: a hairline at 6, a step at 7, a trench at 9, a canyon from 11 (each tick
// opens it over 6 s)
const EQ_CRACK_W = { 3: 0, 4: 0, 5: 0, 6: 0.25, 7: 1.4, 8: 3.5, 9: 8, 10: 18, 11: 34, 12: 60 };
function eqCrackW(s) {
  if (s < 180) return 0;
  const M = Math.min(12, eqMagOf(s)), u = s - 60 * (eqMinOf(s) - 1);
  return MathX.lerp(EQ_CRACK_W[M - 1] || 0, EQ_CRACK_W[M], MathX.smooth(u, 0, 6));
}
const EQ_CRACK_MAXW = 64;
// a ribbon draped on the terrain: `across` strips side by side (each follows the ground), uv = [0…1 across, metres along]
function eqRibbon(path, width, yOff, maxLen = 60000, segLen = 30, across = 1) {
  const pos = [], uv = [], idx = [];
  let acc = 0;
  const pts = [];
  for (let i = 0; i < path.length - 1 && acc < maxLen; i++) {
    const [ax, az] = path[i], [bx, bz] = path[i + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / segLen));
    for (let k = i ? 1 : 0; k <= n; k++) { const u = k / n; pts.push([ax + (bx - ax) * u, az + (bz - az) * u, acc + L * u]); }
    acc += L;
  }
  const C = across + 1;
  pts.forEach(([x, z, d], i) => {
    const p = pts[Math.max(0, i - 1)], q = pts[Math.min(pts.length - 1, i + 1)], tx = q[0] - p[0], tz = q[1] - p[1], l = Math.hypot(tx, tz) || 1, nx = -tz / l, nz = tx / l;
    for (let c = 0; c < C; c++) {
      const a = c / across, o = (a - 0.5) * width, px = x + nx * o, pz = z + nz * o;
      pos.push(px, Math.max(eqTerrainY(px, pz), 0.4) + yOff, pz); uv.push(a, d);
    }
    if (i) for (let c = 0; c < across; c++) { const A = (i - 1) * C + c, B = i * C + c; idx.push(A, A + 1, B, A + 1, B + 1, B); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const EQ_SETZONE_GLSL = `
  bool eqInSet(vec2 p) { float u = dot(p, vec2(${EQ_WF.w[0].toFixed(5)}, ${EQ_WF.w[1].toFixed(5)})), v = dot(p, vec2(${EQ_WF.n[0].toFixed(5)}, ${EQ_WF.n[1].toFixed(5)}));
    return u > -720.0 && u < 820.0 && v > -130.0 && v < 4.0; }`;
function eqCrack(scene) {
  const U = { uLen: { value: 0 }, uW: { value: 0 }, uGlow: { value: 0 }, uS: { value: 0 }, uWaveA: { value: 0 }, uEpi: { value: new THREE.Vector2(EQ_EPI[0], EQ_EPI[1]) } , ...eqWaveU() };
  const m = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, side: THREE.DoubleSide,
    vertexShader: `${EQ_WAVE_GLSL}
      varying vec2 vUv; varying vec2 vXZ;
      void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); w.y += eqWaveY(w.xz); vXZ = w.xz;
        gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uLen, uW, uGlow; varying vec2 vUv; varying vec2 vXZ;
      ${EQ_SETZONE_GLSL}
      float h(float x) { return fract(sin(x * 91.7) * 43758.5); }
      void main() {
        if (vUv.y > uLen || eqInSet(vXZ)) discard;
        float across = abs(vUv.x - 0.5) * 2.0;
        float jag = 0.6 + 0.4 * mix(h(floor(vUv.y / 7.0)), h(floor(vUv.y / 7.0) + 1.0), fract(vUv.y / 7.0));
        float tip = smoothstep(0.0, 80.0, uLen - vUv.y);
        float wd = uW * jag * (0.2 + 0.8 * tip);
        if (across > wd) discard;
        float core = 1.0 - across / max(1e-4, wd);
        vec3 c = mix(vec3(0.16, 0.13, 0.1), vec3(0.02, 0.015, 0.01), smoothstep(0.0, 0.35, core));
        c = mix(c, vec3(1.0, 0.42, 0.08) * (1.5 + 0.7 * h(floor(vUv.y / 11.0))), uGlow * smoothstep(0.3, 0.85, core));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const meshes = ['north', 'south'].map((b) => { const me = new THREE.Mesh(eqRibbon(EQ_CRACK_PATH[b], EQ_CRACK_MAXW, 0.6, 32000, 30, 4), m); me.frustumCulled = false; me.renderOrder = 2; scene.add(me); return me; });
  return {
    U, meshes,
    frame(s) {
      const h = eqRupture('sf', s) * 1000, W = eqCrackW(s);
      U.uLen.value = h; U.uW.value = W / EQ_CRACK_MAXW; U.uGlow.value = MathX.smooth(s, 482, 500) * 0.8 + MathX.smooth(s, 545, 560) * 0.2; U.uS.value = s; U.uWaveA.value = eqWaveA(s);
      for (const me of meshes) me.visible = W > 0.05 && h > 1;
      return W;
    },
  };
}
// the San Andreas and the Hayward faults, drawn on the map shot (minute two)
const EQ_MAPFAULTS = {
  sanAndreas: [[37.3, -122.17], [37.49, -122.33], [37.58, -122.42], [37.667, -122.495], [37.72, -122.53], [37.79, -122.55], [37.85, -122.62], [37.91, -122.69], [38.07, -122.81], [38.3, -123.05]],
  hayward: [[37.42, -121.88], [37.53, -121.97], [37.6, -122.03], [37.67, -122.08], [37.75, -122.15], [37.8, -122.2], [37.87, -122.25], [37.92, -122.3], [37.97, -122.35]],
};
function eqMapFaults(scene) {
  const m = new THREE.MeshBasicMaterial({ color: '#ff2a1a', transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 });
  const out = Object.values(EQ_MAPFAULTS).map((P) => { const me = new THREE.Mesh(eqRibbon(P.map(([a, b]) => eqLL(a, b)), 260, 30, 1e9, 200), m); me.frustumCulled = false; me.renderOrder = 3; scene.add(me); return me; });
  return { mat: m, meshes: out };
}
