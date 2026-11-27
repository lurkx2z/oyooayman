/* =====================================================================
   NYC — New York for "What If Every Step You Took Was Twice as Long?": the land, the water, the city and its
   landmarks at their real places (simplified), so the same Empire State is the one you see down your street and the
   one you fly past. Metres; x east, z south, y up; the origin is the middle of your street in Brooklyn Heights
   (about 40.6953 N, 73.9951 W: x = (lon + 73.9951) × 84 300, z = −(lat − 40.6953) × 111 000).
     twNycWorld(scene, app) → { mat (the buildings' material: its uniforms break windows), water, … }
   The route: your landings, step by step (TW_ROUTE), from your front door to Central Park and away.
   ===================================================================== */

// ---- the shores (polygons, [x, z]); everything else is water
const TW_LAND = {
  manhattan: [[-1846, -888], [-1500, -880], [-666, -1188], [-520, -1480], [-100, -1620], [1357, -1754], [1948, -3752], [1948, -5417], [3128, -7082], [4477, -9746], [5573, -11633],
    [7175, -19392], [5488, -19392], [2959, -13620], [93, -8514], [-1180, -5739], [-1517, -2742], [-1900, -1500]],
  brooklyn: [[-1678, 1698], [-1100, 900], [-600, 300], [-520, 0], [-520, -400], [-300, -800], [100, -1050], [514, -966], [1200, -1150], [2116, -744], [2537, -2742], [2959, -4407],
    [3300, -6500], [4500, -9000], [6200, -12500], [9000, -16000], [30000, -16000], [30000, 30000], [-3000, 30000], [-2600, 6000], [-2300, 3200]],
  jersey: [[-30000, -30000], [2500, -30000], [-800, -11000], [-1678, -8292], [-2520, -5517], [-3195, -2187], [-3700, -1400], [-4628, -522], [-5200, 1200], [-4500, 2500],
    [-6500, 6000], [-30000, 6000]],
  bronx: [[5600, -19800], [7400, -19800], [9000, -16400], [30000, -16400], [30000, -40000], [2500, -40000], [4200, -24000]],
  governors: [[-2150, 420], [-1700, 320], [-1450, 560], [-1620, 920], [-2050, 940]],
  liberty: [[-4260, 600], [-4070, 590], [-4060, 760], [-4250, 770]],
};
// ---- the landmarks (x, z)
const TW_PLACES = {
  door: [0, 7.6], promenade: -352,
  statue: [-4165, 677], esb: [792, -5894], wtc: [-1526, -1965], chrysler: [1652, -6249], flatiron: [455, -5084],
  bbTowerB: [-75, -1098], bbAz: 309, bbSpan: 486, park: [[1113, -8081], [1821, -7670], [3828, -11267], [3128, -11677]],
  downtownBk: [400, 300], jc: [-3000, -2300], lic: [3300, -6500],
};
// Manhattan's grid runs 29° east of north
const TW_MAN = (() => { const a = 29 * Math.PI / 180; return { n: [Math.sin(a), -Math.cos(a)], e: [Math.cos(a), Math.sin(a)] }; })();

function twInPoly(x, z, P) {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const [xi, zi] = P[i], [xj, zj] = P[j];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c;
  }
  return c;
}
const twOnLand = (x, z) => Object.values(TW_LAND).some((P) => twInPoly(x, z, P));
const twInPark = (x, z) => twInPoly(x, z, TW_PLACES.park);

// ---------------------------------------------------------------------------------------------------------------------
// THE ROUTE: where each step lands. Steps 1–4 cross the street (10° off straight across), 5 comes back over the
// bus, 6–9 run west along the street to the Promenade, 10 north along it, 11 onto the Brooklyn Bridge, 12 across it,
// 13–14 up Manhattan's grid, 15 away. Heights: the landing's ground (the stoop, the bridge's deck).
// ---------------------------------------------------------------------------------------------------------------------
const TW_ROUTE = (() => {
  const P = [[0, 0.45, 7.6]], az = (deg) => [Math.sin(deg * Math.PI / 180), -Math.cos(deg * Math.PI / 180)];
  const head = {}, up = {};
  for (let n = 1; n <= 4; n++) head[n] = az(10);
  head[5] = az(190);
  // 6: off the stoop into the road, heading west; 7–9 west along the street's middle
  head[6] = (() => { const d = [-23.6 - 0, 1.6 - 8.3], l = Math.hypot(...d); return [d[0] / l, d[1] / l]; })();
  head[7] = az(271); head[8] = az(270.5); head[9] = az(270);
  head[10] = az(0);
  // 11: onto the bridge's Brooklyn tower; 12: along the bridge; 13–15 up Manhattan
  head[12] = az(TW_PLACES.bbAz);
  for (const n of [13, 14, 15]) head[n] = TW_MAN.n;
  const yOf = { 1: 0.22, 2: 0, 3: 0, 4: 0, 5: 0.45, 11: 40, 12: 0 };
  for (let n = 1; n <= 15; n++) {
    const a = P[n - 1];
    let d = head[n];
    if (n === 11) { const T = TW_PLACES.bbTowerB, v = [T[0] - 40 * Math.sin(TW_PLACES.bbAz * Math.PI / 180) - a[0], T[1] + 40 * Math.cos(TW_PLACES.bbAz * Math.PI / 180) - a[2]], l = Math.hypot(...v); d = [v[0] / l, v[1] / l]; }
    const L = twL(n);
    P.push([a[0] + d[0] * L, yOf[n] ?? 0, a[2] + d[1] * L]);
  }
  // step 5 lands in your own doorway: 0.75 m behind where you started (along the line you crossed on)
  return P;
})();
// where you are at film time t (on the ground part of the story): [x, y, z, heading yaw (0 = +z), height above the
// ground line, step n, u]
function twRouteAt(t) {
  const s = twStepAt(t);
  if (s.n === 0) return { p: TW_ROUTE[0].slice(), yaw: Math.PI, n: 0, u: 0, air: 0 };
  const n = Math.min(s.n, 15), a = TW_ROUTE[n - 1], b = TW_ROUTE[n], u = n < s.n ? 1 : s.u;
  const f = n === 15 ? u * u * 0.5 + u * 0.5 : Ease.inOutSine(u);
  const p = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  // the arc: a hop for the first steps; over the bus; long low leaps after
  const H = { 1: 0.05, 2: 0.25, 3: 0.55, 4: 1.1, 5: 4.3, 6: 2.2, 7: 4.5, 8: 8, 9: 16, 10: 26, 11: 60, 12: 110, 13: 220, 14: 420 }[n] || 0;
  const air = n === 15 ? 0 : H * 4 * u * (1 - u);
  p[1] += air;
  const yaw = Math.atan2(b[0] - a[0], b[2] - a[2]);
  return { p, yaw, n, u, air };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE BUILDINGS' MATERIAL: one instanced box per building (y 0…1 scaled), windows drawn by the shader from each box's
// own size (so a 300 m tower and a brownstone both get floors of 3.4 m), the instance colour as the facade.
// uShatter (x, z, r, front width): inside the expanding front the glass is gone (dark holes) — the sonic boom.
// ---------------------------------------------------------------------------------------------------------------------
function twBuildingMat(o = {}) {
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.78, metalness: 0.0 });
  const U = { uShatter: { value: new THREE.Vector4(0, 0, -1, 30) }, uGlass: { value: new THREE.Color(o.glass || '#4a6478') }, uLit: { value: o.lit || 0.0 }, uFloor: { value: 3.4 }, uBay: { value: 3.0 } };
  m.userData.U = U;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWinP; varying vec3 vWinN; varying vec3 vWorldP; varying float vSeed;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec3 sc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
        vWinP = (position + vec3(0.5, 0.0, 0.5)) * sc; vWinN = normal;
        vSeed = fract(sin(dot(instanceMatrix[3].xz, vec2(12.9898, 78.233))) * 43758.5453);
        vWorldP = (modelMatrix * instanceMatrix * vec4(position, 1.0)).xyz;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        varying vec3 vWinP; varying vec3 vWinN; varying vec3 vWorldP; varying float vSeed; uniform vec4 uShatter; uniform vec3 uGlass; uniform float uLit, uFloor, uBay;
        float twH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float side = 1.0 - step(0.5, abs(vWinN.y));
        float along = abs(vWinN.x) > 0.5 ? vWinP.z : vWinP.x;
        float fl = vWinP.y / uFloor, by = along / uBay;
        vec2 cell = vec2(floor(by), floor(fl)), f = vec2(fract(by), fract(fl));
        float ground = step(vWinP.y, 4.0);
        float win = side * step(0.16, f.x) * step(f.x, 0.84) * step(0.22, f.y) * step(f.y, 0.86) * (1.0 - ground * 0.0) * step(1.2, vWinP.y);
        float rn = twH(cell + vSeed * 31.0);
        vec3 glass = uGlass * (0.75 + 0.5 * rn) + vec3(0.06, 0.07, 0.08) * step(0.85, rn);
        float d = length(vWorldP.xz - uShatter.xy);
        float broken = uShatter.z > 0.0 ? step(d, uShatter.z) * step(0.12, twH(cell * 1.7 + vSeed * 7.0)) : 0.0;
        vec3 holeC = vec3(0.035, 0.032, 0.03);
        diffuseColor.rgb = mix(diffuseColor.rgb, mix(glass, holeC, broken), win);
        diffuseColor.rgb *= mix(1.0, 0.86, side * step(0.92, fract(fl)));
        float twWin = win; float twBroken = broken * win;`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.18, twWin * (1.0 - twBroken));`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += uGlass * 0.0 + vec3(1.0, 0.8, 0.55) * uLit * twWin * step(0.6, twH(cell + vSeed)) * (1.0 - twBroken);`);
  };
  m.customProgramCacheKey = () => 'twBuild' + (o.key || '');
  return m;
}

// ---------------------------------------------------------------------------------------------------------------------
// THE WORLD
// ---------------------------------------------------------------------------------------------------------------------
function twNycWorld(scene, app, o = {}) {
  const r = new RNG(20261130);
  const out = {};
  // ---- land (extruded 3 m down, so the shore has an edge) and water
  const landM = twStd('#8c8a82', 0.95), parkM = twStd('#5e7f43', 0.95);
  for (const [k, P] of Object.entries(TW_LAND)) {
    const s = new THREE.Shape(P.map(([x, z]) => new THREE.Vector2(x, z)));
    const g = new THREE.ExtrudeGeometry(s, { depth: 3, bevelEnabled: false, curveSegments: 1 });
    g.rotateX(Math.PI / 2);   // shape y (our z) → −z… fix below
    // (ExtrudeGeometry builds in x/y with depth +z; rotating +90° about x maps y → z and z → −y: the top is y = 0, the bottom −3)
    const m = new THREE.Mesh(g, landM); m.receiveShadow = true; m.castShadow = false; scene.add(m);
    out['land_' + k] = m;
  }
  {
    const s = new THREE.Shape(TW_PLACES.park.map(([x, z]) => new THREE.Vector2(x, z)));
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.6, bevelEnabled: false }); g.rotateX(Math.PI / 2); g.translate(0, 0.6, 0);
    const m = new THREE.Mesh(g, parkM); m.receiveShadow = true; scene.add(m);
  }
  // the water: tiles of 1 km (long triangles misbehave in the software renderer)
  const waterM = new THREE.MeshStandardMaterial({ color: '#3d6a86', roughness: 0.22, metalness: 0.1, envMapIntensity: 1.2 });
  waterM.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * vec4(position, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        { vec2 q = vWP.xz; float a = sin(q.x * 0.09 + q.y * 0.05) + sin(q.x * -0.04 + q.y * 0.11) * 0.8 + sin(q.x * 0.23 - q.y * 0.19) * 0.35;
          float b = cos(q.x * 0.07 - q.y * 0.08) + cos(q.x * 0.13 + q.y * 0.03) * 0.7 + cos(q.x * -0.21 + q.y * 0.26) * 0.3;
          normal = normalize(normal + (viewMatrix * vec4(a * 0.045, 0.0, b * 0.045, 0.0)).xyz); }`);
  };
  {
    const geo = new THREE.PlaneGeometry(1000, 1000, 8, 8); geo.rotateX(-Math.PI / 2);
    const xs = [], zs = []; for (let x = -24000; x < 24000; x += 1000) xs.push(x + 500); for (let z = -28000; z < 20000; z += 1000) zs.push(z + 500);
    const W = new THREE.InstancedMesh(geo, waterM, xs.length * zs.length); let i = 0; const M4 = new THREE.Matrix4();
    for (const x of xs) for (const z of zs) { M4.makeTranslation(x, -1.6, z); W.setMatrixAt(i++, M4); }
    W.receiveShadow = true; W.frustumCulled = false; scene.add(W); out.water = W;
  }

  // ---- the buildings
  const mat = twBuildingMat({ glass: '#5a7890' }); out.mat = mat;
  const B = [];   // [x, z, w (along e), d (along n), h, rot, color]
  const pal = { brown: ['#7a4a35', '#8a5a40', '#6e4636', '#93664a', '#5f3d30', '#a0705a'], stone: ['#b8ae9e', '#c9c0b0', '#a69b8a', '#d4cbbb', '#9a9080'], glass: ['#6f8494', '#7e93a2', '#5f7484', '#8aa0ae'], brick: ['#9a5a44', '#8a4c3a', '#a86a50', '#7c4434'] };
  const pick = (a) => a[Math.floor(r.next() * a.length)];
  const away = (x, z, list, d) => list.every(([px, pz]) => Math.hypot(x - px, z - pz) > d);
  const marks = [TW_PLACES.esb, TW_PLACES.wtc, TW_PLACES.chrysler, TW_PLACES.flatiron];
  const streetZone = (x, z) => x > -372 && x < 110 && z > -45 && z < 45;   // street.js builds this part in detail
  const promZone = (x, z) => x < -335 && x > -600 && z < 80 && z > -1000;
  // Manhattan: blocks 80 m (north) × 270 m (east), streets 18 m, avenues 30 m
  {
    const N = TW_MAN.n, E = TW_MAN.e, o0 = [-1846, -888];
    for (let i = -10; i < 260; i++) for (let j = -10; j < 22; j++) {
      const cx = o0[0] + N[0] * (i * 80 + 40) + E[0] * (j * 270 + 135), cz = o0[1] + N[1] * (i * 80 + 40) + E[1] * (j * 270 + 135);
      if (!twInPoly(cx, cz, TW_LAND.manhattan) || twInPark(cx, cz)) continue;
      const dM = Math.hypot(cx - 700, cz - 6600 * -1), dL = Math.hypot(cx + 1350, cz + 1750);
      let core = Math.max(MathX.clamp(1 - dM / 1900, 0, 1), MathX.clamp(1 - dL / 1100, 0, 1));
      const nb = 2 + Math.floor(r.next() * 3), widths = []; let sum = 0;
      for (let k = 0; k < nb; k++) { const w = r.range(0.7, 1.3); widths.push(w); sum += w; }
      let acc = 0;
      for (let k = 0; k < nb; k++) {
        const w = widths[k] / sum * 240, u = -120 + acc + w / 2; acc += w;
        const x = cx + E[0] * u, z = cz + E[1] * u;
        if (!twInPoly(x, z, TW_LAND.manhattan) || !away(x, z, marks, 90)) continue;
        const tall = r.next() < core * 0.85;
        const h = tall ? r.range(80, 140 + 230 * core) : r.range(14, 30 + 40 * core) * (r.next() < 0.06 ? 3 : 1);
        const split = !tall && r.next() < 0.5;
        if (split) { for (const s of [-1, 1]) B.push([x + N[0] * s * 16, z + N[1] * s * 16, w - 4, 29, h * r.range(0.8, 1.2), 29, pick(r.next() < 0.5 ? pal.brick : pal.stone)]); }
        else B.push([x, z, w - 4, tall ? r.range(36, 60) : 60, h, 29, tall ? pick(r.next() < 0.6 ? pal.glass : pal.stone) : pick(r.next() < 0.5 ? pal.brick : pal.stone)]);
      }
    }
  }
  // Brooklyn / Queens / the Bronx / Jersey: an axis-aligned grid of row blocks; towers in Downtown Brooklyn, Long Island City, Jersey City
  {
    const zones = [['brooklyn', -1700, 5000, -9000, 5000], ['jersey', -9000, -800, -12000, 3500], ['bronx', 4500, 12000, -24000, -16500]];
    for (const [k, x0, x1, z0, z1] of zones) for (let x = x0; x < x1; x += 110) for (let z = z0; z < z1; z += 70) {
      const cx = x + 55, cz = z + 35;
      if (!twInPoly(cx, cz, TW_LAND[k]) || streetZone(cx, cz) || promZone(cx, cz)) continue;
      const dist = Math.hypot(cx, cz), far = dist > 7500;
      if (far && r.next() < 0.55) continue;
      const tw = [[TW_PLACES.downtownBk, 600, 170], [TW_PLACES.jc, 900, 230], [TW_PLACES.lic, 800, 200]].reduce((m, [p, R, H]) => Math.max(m, MathX.clamp(1 - Math.hypot(cx - p[0], cz - p[1]) / R, 0, 1) * H), 0);
      const n = 3;
      for (let a = 0; a < n; a++) {
        const bx = cx - 40 + a * 40, tall = tw > 30 && r.next() < 0.55;
        const h = tall ? r.range(40, tw) : r.range(9, 16) * (r.next() < 0.08 ? 2.2 : 1);
        B.push([bx, cz, 36, tall ? r.range(30, 50) : 56, h, 0, tall ? pick(pal.glass) : pick(r.next() < 0.6 ? pal.brown : pal.brick)]);
      }
    }
  }
  // the Heights' rows north and south of your street (the windows the boom breaks), facing the Promenade
  {
    for (let z = -430; z < 420; z += 26) for (let x = -330; x < 60; x += 7) {
      if (streetZone(x, z) || Math.abs(z) < 50) continue;
      if (((Math.floor((z + 430) / 26)) % 3) === 2) { x += 4; continue; }   // a cross street every third row
      B.push([x, z, 6.6, 15, r.range(12, 17), 0, pick(r.next() < 0.7 ? pal.brown : pal.brick)]);
    }
  }
  out.count = B.length;
  const geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
  const IM = new THREE.InstancedMesh(geo, mat, B.length + 64);
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), C = new THREE.Color(), Y = new THREE.Vector3(0, 1, 0);
  let i = 0;
  const put = (x, y, z, w, h, d, rotDeg, col) => { Q.setFromAxisAngle(Y, -rotDeg * Math.PI / 180); V.set(x, y, z); S.set(w, h, d); M4.compose(V, Q, S); IM.setMatrixAt(i, M4); IM.setColorAt(i, C.set(col)); i++; };
  for (const [x, z, w, d, h, rot, col] of B) put(x, 0, z, w, h, d, rot, col);
  // ---- the landmarks built from the same boxes (so their windows match): the Empire State, the Chrysler, the Flatiron's stand-in
  const tiers = (p, list, rot, col) => { for (const [y0, y1, w, d] of list) put(p[0], y0, p[1], w, y1 - y0, d, rot, col); };
  tiers(TW_PLACES.esb, [[0, 25, 129, 57], [25, 82, 96, 48], [82, 268, 58, 38], [268, 322, 44, 30], [322, 366, 30, 22], [366, 381, 18, 14]], 29, '#b9b2a2');
  tiers(TW_PLACES.chrysler, [[0, 70, 60, 60], [70, 220, 40, 40], [220, 250, 30, 30]], 29, '#c8c4bc');
  tiers(TW_PLACES.flatiron, [[0, 87, 26, 60]], 29, '#d2c2a6');
  IM.count = i; IM.instanceMatrix.needsUpdate = true; if (IM.instanceColor) IM.instanceColor.needsUpdate = true;
  IM.castShadow = true; IM.receiveShadow = true; IM.frustumCulled = false; scene.add(IM); out.buildings = IM;
  // ---- the spires, the Chrysler's crown, One World Trade Center
  const steel = twStd('#c9ccd0', 0.35, 0.8), dark = twStd('#4a5058', 0.5, 0.4);
  { const [x, z] = TW_PLACES.esb; const m = twCyl(5, 7, 30, dark, x, 381 + 15, z); m.castShadow = true; twCyl(1.2, 4, 32, steel, x, 411 + 16, z); }
  { const [x, z] = TW_PLACES.chrysler; const c = new THREE.Mesh(new THREE.ConeGeometry(16, 50, 8), steel); c.position.set(x, 275, z); scene.add(c); twCyl(0.6, 2.5, 25, steel, x, 312, z); }
  {
    const [x, z] = TW_PLACES.wtc, g = new THREE.CylinderGeometry(25, 43, 417 - 56, 4, 12, false), P = g.attributes.position;
    for (let k = 0; k < P.count; k++) { const y = P.getY(k), u = (y + (417 - 56) / 2) / (417 - 56), a = Math.PI / 4 * u, cx = P.getX(k), cz = P.getZ(k); P.setXZ(k, cx * Math.cos(a) - cz * Math.sin(a), cx * Math.sin(a) + cz * Math.cos(a)); }
    g.computeVertexNormals();
    const gm = new THREE.MeshStandardMaterial({ color: '#8ea9bd', roughness: 0.12, metalness: 0.75, envMapIntensity: 1.5 });
    const w = new THREE.Mesh(g, gm); w.position.set(x, 56 + (417 - 56) / 2, z); w.rotation.y = Math.PI / 4 - 29 * Math.PI / 180; w.castShadow = w.receiveShadow = true; scene.add(w);
    twBox(62, 56, 62, twStd('#a6b0b8', 0.4, 0.4), x, 28, z).rotation.y = -29 * Math.PI / 180;
    twCyl(1.0, 3, 124, steel, x, 417 + 62, z);
  }
  out.statue = twStatue(scene, TW_PLACES.statue);
  out.bridge = twBrooklynBridge(scene);
  // ---- Governors Island and Liberty Island are green; a few trees in the park
  {
    for (const k of ['governors', 'liberty']) { const s = new THREE.Shape(TW_LAND[k].map(([x, z]) => new THREE.Vector2(x, z))); const g = new THREE.ExtrudeGeometry(s, { depth: 0.4, bevelEnabled: false }); g.rotateX(Math.PI / 2); g.translate(0, 0.4, 0); const m = new THREE.Mesh(g, parkM); m.receiveShadow = true; scene.add(m); }
    const crownG = new THREE.IcosahedronGeometry(1, 0), treeM = twStd('#4e6e35', 0.9), TI = new THREE.InstancedMesh(crownG, treeM, 2600); let n = 0;
    for (let k = 0; k < 6000 && n < 2600; k++) {
      const x = r.range(1100, 3850), z = r.range(-11700, -7650); if (!twInPark(x, z)) continue;
      const s = r.range(5, 9); M4.compose(V.set(x, s * 0.9, z), Q.identity(), S.set(s, s * 0.8, s)); TI.setMatrixAt(n++, M4);
    }
    TI.count = n; TI.castShadow = true; TI.receiveShadow = true; scene.add(TI);
  }
  return out;
}

// the Statue of Liberty on her pedestal and star fort (93 m to the torch), low-poly, facing south-east
function twStatue(scene, [x, z]) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = 0.6; scene.add(g);
  const stone = twStd('#b9ae98', 0.85), cop = twStd('#6fa892', 0.7, 0.15), gold = new THREE.MeshStandardMaterial({ color: '#ffd36a', emissive: '#ffb02a', emissiveIntensity: 0.8, roughness: 0.3 });
  const add = (geo, m, px, py, pz, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.rotation.set(rx, ry, rz); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  add(new THREE.CylinderGeometry(52, 56, 8, 11), stone, 0, 4, 0);                       // the star fort (an 11-point star, simplified)
  add(new THREE.CylinderGeometry(15, 20, 20, 4), stone, 0, 18, 0, 0, Math.PI / 4);      // the pedestal's base
  add(new THREE.CylinderGeometry(9.5, 12.5, 19, 4), stone, 0, 37, 0, 0, Math.PI / 4);   // the pedestal (top at 46.9 m)
  add(new THREE.CylinderGeometry(10.6, 10.6, 1.4, 4), stone, 0, 46.2, 0, 0, Math.PI / 4);
  // her: the robe (a fluted cone), the body, the head with its crown, the raised right arm and torch, the tablet
  const robe = new THREE.CylinderGeometry(4.2, 7.0, 27, 14, 3); const Pp = robe.attributes.position;
  for (let k = 0; k < Pp.count; k++) { const a = Math.atan2(Pp.getZ(k), Pp.getX(k)), f = 1 + 0.07 * Math.sin(a * 7); Pp.setX(k, Pp.getX(k) * f); Pp.setZ(k, Pp.getZ(k) * f); }
  robe.computeVertexNormals();
  add(robe, cop, 0, 47 + 13.5, 0);
  add(new THREE.CylinderGeometry(3.0, 4.3, 7, 10), cop, 0, 47 + 30.5, 0);
  add(new THREE.SphereGeometry(2.4, 12, 10), cop, 0, 47 + 36.2, 0.3);
  for (let k = 0; k < 7; k++) { const a = -0.9 + k * 0.3; add(new THREE.ConeGeometry(0.35, 3.2, 4), cop, Math.sin(a) * 2.3, 47 + 38.3, Math.cos(a) * 1.6, Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.9); }
  add(new THREE.CylinderGeometry(0.9, 1.2, 12.8, 8), cop, 2.6, 47 + 38.5, -0.2, 0, 0, -0.12);   // the arm
  add(new THREE.CylinderGeometry(1.6, 0.7, 2.4, 10), cop, 3.4, 47 + 45.3, -0.3);                // the torch
  add(new THREE.SphereGeometry(1.25, 10, 8), gold, 3.4, 47 + 47.0, -0.3);                       // the flame
  add(new THREE.BoxGeometry(1.4, 7, 4.2), cop, -3.6, 47 + 24, 1.2, 0.3, 0, 0.2);                // the tablet
  return g;
}

// the Brooklyn Bridge: two granite towers with their pointed arches, the deck at 40 m, four main cables and the web
// of suspenders and stays (thin lines). Brooklyn tower at TW_PLACES.bbTowerB, running on azimuth bbAz.
function twBrooklynBridge(scene) {
  const P = TW_PLACES, az = P.bbAz * Math.PI / 180, d = [Math.sin(az), -Math.cos(az)], T0 = P.bbTowerB, T1 = [T0[0] + d[0] * P.bbSpan, T0[1] + d[1] * P.bbSpan];
  const g = new THREE.Group(); scene.add(g);
  const yaw = Math.atan2(d[0], d[1]);
  const stone = twStd('#b7a68c', 0.9), deckM = twStd('#5a5650', 0.8), cableM = twStd('#d8d4cc', 0.6);
  const along = (k) => [T0[0] + d[0] * k, T0[1] + d[1] * k];
  const box = (w, h, dd, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), m); o.position.set(x, y, z); o.rotation.y = yaw; o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  // the towers: two legs and the top, the arches as gaps (84 m tall, 41 m wide across the bridge, 19 m along it)
  for (const T of [T0, T1]) {
    const side = [d[1], -d[0]];
    for (const s of [-1, 0, 1]) box(s === 0 ? 7 : 9, 72, 19, stone, T[0] + side[0] * s * 15.5, 36, T[1] + side[1] * s * 15.5).rotation.y = yaw;
    box(41, 12, 19, stone, T[0], 78, T[1]);
    box(43, 3, 21, stone, T[0], 85.5, T[1]);
    box(44, 10, 22, stone, T[0], 5, T[1]);   // the caisson's top above the water
  }
  // the deck: from the Brooklyn anchorage (−280 m) to the Manhattan one (span + 280 m), 26 m wide, in 50 m pieces
  const L0 = -470, L1 = P.bbSpan + 520;
  for (let k = L0; k < L1; k += 50) {
    const a = along(k + 25), y = 40 - 0.00004 * (k + 25 - P.bbSpan / 2) ** 2 * 0 - (k < 0 ? (-k / 470) * 30 : 0) - (k > P.bbSpan ? ((k - P.bbSpan) / 520) * 30 : 0);
    box(26, 2.2, 50.5, deckM, a[0], Math.max(10, y), a[1]);
  }
  // the four main cables (sagging between the towers, down to the anchorages) and the suspenders
  const pos = [], cab = [];
  const sideV = [d[1], -d[0]];
  for (const s of [-1.5, -0.5, 0.5, 1.5]) {
    const off = s * 8.6, pts = [];
    for (let k = -470; k <= P.bbSpan + 520; k += 12) {
      let y;
      if (k < 0) y = 85 + (k / 470) * 70;
      else if (k > P.bbSpan) y = 85 - ((k - P.bbSpan) / 520) * 70;
      else { const u = k / P.bbSpan; y = 85 - 4 * 38 * u * (1 - u); }
      const a = along(k); pts.push([a[0] + sideV[0] * off, y, a[1] + sideV[1] * off]);
    }
    for (let q = 0; q < pts.length - 1; q++) cab.push(...pts[q], ...pts[q + 1]);
    for (const p of pts) { const kk = ((p[0] - T0[0]) * d[0] + (p[2] - T0[1]) * d[1]); const deckY = kk < 0 ? Math.max(10, 40 + kk / 470 * 30) : kk > P.bbSpan ? Math.max(10, 40 - (kk - P.bbSpan) / 520 * 30) : 40; if (p[1] > deckY + 1.5) pos.push(p[0], p[1], p[2], p[0], deckY + 1.1, p[2]); }
  }
  const lg = (arr, col, op) => { const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); const l = new THREE.LineSegments(bg, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op })); g.add(l); return l; };
  lg(cab, '#e6e2da', 0.95); lg(pos, '#cfcac0', 0.55);
  void cableM;
  return { g, T0, T1, d };
}
