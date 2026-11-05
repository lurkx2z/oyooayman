/* =====================================================================
   COAST WORLD — everything on the coast set except the train, the sky, the city and the sea (train.js, sky.js, city.js):
   the sea wall and its parapet, the two tracks (ballast, sleepers, rails), the overhead line on its masts, the coast
   road with its lamps (their light pools are drawn in the ground's shader, so nothing is laid on the road), the cars on
   it (engines cutting out at ×1.3, halogen headlights dimming with their batteries), the houses up the hill (their
   windows drawn in their shader), a row of Norfolk pines, the headland with its tunnel and its lighthouse, and the cove
   below the wall: the sand, the rocks, the steps, the bonfire, the party (people, a speaker on a cool box).
     lfBuildCoast(S) → W ; W.update(s, o)
   No coplanar faces anywhere (ayman's note): every box that sits on another goes into it, every flat thing that would
   lie on a surface is drawn by that surface's shader instead, the headland's cliff crosses the platform at a steep
   angle, the sand starts under the wall.
   ===================================================================== */

const LF_COAST_D = 0.1;                                        // the coast's own protection trips 0.1 s after the first
const LF_LAMP = { x0: -640, every: LF_ST.lampEvery, n: 65, z: LF_ST.lampZ, headZ: -13.6, y: 11.2 };
// each lamp goes out a little later the further it is from the substation (x 300): a wave along the coast
const lfLampD = (i) => LF_COAST_D + 0.0011 * Math.abs(LF_LAMP.x0 + i * LF_LAMP.every - 300);

// the ground north of the road (y), from the platform's edge (z −20) up to the hills
function lfLandY(x, z) {
  const u = Math.max(0, -20 - z);
  return 2.95 + 0.06 * u + 0.00022 * u * u + 26 * Math.max(0, noise1(x * 0.004 + z * 0.003, 17)) * MathX.clamp(u / 260, 0, 1)
    + 0.3 * noise1(x * 0.05 + z * 0.07, 23) * MathX.clamp(u / 10, 0, 1);
}
// the headland west of x −662: a cliff rising behind the tunnel portal (whose face, x −662…−658, stands in front of it),
// the top up to ~70 m, falling into the sea
function lfHeadY(x, z) {
  const e = x + 662;                                                                         // < 0 inside the headland
  const base = e < 0 ? 3 + 64 * (1 - Math.exp(e / 7)) + 18 * MathX.clamp(-e / 400, 0, 1) : 3 - 2.2 * e;
  const sea = lfSm(z, 150, 30);                                                              // the cliffs fall into the sea
  return (base + 5 * noise1(x * 0.02 + z * 0.017, 31) * MathX.clamp(-e / 20, 0, 1)) * sea - 9 * (1 - sea);
}

// a height-field mesh over the grid xs × zs (arrays of coordinates), y = fy(x, z); colour col(x, z, y) → [r, g, b]
function lfHeightMesh(xs, zs, fy, mat, col, skip) {
  const nx = xs.length, nz = zs.length, P = new Float32Array(nx * nz * 3), U = new Float32Array(nx * nz * 2), C = col ? new Float32Array(nx * nz * 3) : null, I = [];
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i, x = xs[i], z = zs[j], y = fy(x, z); P[k * 3] = x; P[k * 3 + 1] = y; P[k * 3 + 2] = z; U[k * 2] = x / 8; U[k * 2 + 1] = z / 8;
    if (C) { const c = col(x, z, y); C[k * 3] = c[0]; C[k * 3 + 1] = c[1]; C[k * 3 + 2] = c[2]; }
  }
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
    if (skip && skip((xs[i] + xs[i + 1]) / 2, (zs[j] + zs[j + 1]) / 2, Math.min(P[a * 3 + 1], P[b * 3 + 1], P[c * 3 + 1], P[d * 3 + 1]))) continue;
    I.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.BufferAttribute(U, 2));
  if (C) g.setAttribute('color', new THREE.BufferAttribute(C, 3));
  g.setIndex(I); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; LF_KIT_SCENE.add(m); return m;
}
const lfRange = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + (b - a) * i / n);

// ---------------------------------------------------------------------------------------------------------------------
// the light pools on the ground (in its shader: nothing is laid on top of it): the road lamps, the cars' headlights
// ---------------------------------------------------------------------------------------------------------------------
function lfPoolUniforms() {
  return { uLampOn: { value: new Array(LF_LAMP.n).fill(1) }, uCar: { value: Array.from({ length: 10 }, () => new THREE.Vector4(0, 0, 1, 0)) }, uLampK: { value: 1 } };
}
function lfPoolPatch(mat, U) {
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLfW;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvLfW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vLfW; uniform float uLampOn[${LF_LAMP.n}]; uniform vec4 uCar[10]; uniform float uLampK;
      vec3 lfPools(vec3 P) {
        vec3 c = vec3(0.0);
        float fi = (P.x - (${LF_LAMP.x0.toFixed(1)})) / ${LF_LAMP.every.toFixed(1)}; int i0 = int(floor(fi));
        for (int d = -1; d <= 2; d++) { int i = i0 + d; if (i < 0 || i >= ${LF_LAMP.n}) continue;
          vec3 L = vec3(${LF_LAMP.x0.toFixed(1)} + float(i) * ${LF_LAMP.every.toFixed(1)}, ${LF_LAMP.y.toFixed(2)}, ${LF_LAMP.headZ.toFixed(2)}) - P;
          float d2 = dot(L, L); c += vec3(1.0, 0.72, 0.42) * uLampOn[i] * 70.0 * max(L.y, 0.0) / (d2 * sqrt(d2)); }
        for (int k = 0; k < 10; k++) { vec4 q = uCar[k]; if (q.w <= 0.0) continue;
          float f = (P.x - q.x) * q.z, l = P.z - q.y, sg = 0.7 + 0.16 * f;
          c += vec3(1.0, 0.88, 0.7) * q.w * 1.6 * exp(-l * l / (2.0 * sg * sg)) * smoothstep(1.2, 4.0, f) / (1.0 + f * f / 160.0); }
        return c * uLampK;
      }`).replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += lfPools(vLfW) * diffuseColor.rgb;');
  };
  mat.customProgramCacheKey = () => 'lfPools';
  return mat;
}

// ---------------------------------------------------------------------------------------------------------------------
// the cars on the coast road (Australia-style: on the left; eastbound in the north lane). [lane, x at s 0, v m/s, type, colour]
// ---------------------------------------------------------------------------------------------------------------------
const LF_CARS = [
  [1, -230, 16.5, 'sedan', '#8a1f22'], [1, -290, 15.5, 'hatch', '#dfe2e4'], [-1, 760, 16.0, 'suv', '#2a2f38'], [1, -380, 16.8, 'sedan', '#3c4f6a'],
  [-1, 860, 15.0, 'hatch', '#5d6a3a'], [1, 120, 15.8, 'pickup', '#c9c4b6'], [-1, 650, 16.2, 'sedan', '#1b1d22'], [-1, 980, 15.4, 'suv', '#7a2a52'],
  [1, 30, 16.0, 'hatch', '#2f6a8a'], [-1, 1120, 16.6, 'sedan', '#b0a080'],
];
const LF_CAR_A = 1.5;                                         // m/s²: coasting with the engine dead, the driver braking gently
const lfCarCut = (i) => LFP.sSpark + 1.6 * (lfRs2(i) - 0.5);   // its spark goes (lights.js uses the same)
function lfCarAt(i, s) {
  const [lane, x0, v] = LF_CARS[i], cut = lfCarCut(i), z = lane > 0 ? -17.25 : -13.75;
  let d, vv;
  if (s < cut) { d = v * s; vv = v; } else { const u = Math.min(s - cut, v / LF_CAR_A); d = v * cut + v * u - 0.5 * LF_CAR_A * u * u; vv = Math.max(0, v - LF_CAR_A * (s - cut)); }
  return { x: x0 + lane * d, z, dir: lane, v: vv, run: s < cut, head: lfHead(s, i) };
}

// ---------------------------------------------------------------------------------------------------------------------
// the party on the beach: the fire, who sits where, the speaker
// ---------------------------------------------------------------------------------------------------------------------
const LF_FIRE = { x: LF_ST.fire[0], z: LF_ST.fire[2] };
LF_FIRE.y = lfSandY(LF_FIRE.x, LF_FIRE.z);
// around the fire: [look, angle (deg, from +x towards +z), radius, what they do]
const LF_PARTY = [
  ['lfB1', -98, 2.7, 'log'], ['lfB2', -62, 2.9, 'log'], ['lfB3', -24, 2.6, 'sand'], ['lfB4', 28, 2.8, 'sand'], ['lfB5', 70, 3.0, 'stand'],
  ['lfB6', 118, 2.7, 'sand'], ['lfP2', 160, 2.9, 'log'], ['lfB1', -300 + 360, 5.4, 'dance'], ['lfB6', -320 + 360, 5.0, 'dance'],
];
const LF_YOU_FIRE = { a: 216.87, r: 2.8 };
const lfAround = (a, r) => [LF_FIRE.x + r * Math.cos(MathX.deg(a)), LF_FIRE.z + r * Math.sin(MathX.deg(a))];
LF_YOU_FIRE.p = lfAround(LF_YOU_FIRE.a, LF_YOU_FIRE.r);
const LF_SPK = (() => { const p = lfAround(338, 3.7); return { x: p[0], z: p[1], y: lfSandY(p[0], p[1]), yaw: Math.atan2(LF_FIRE.x - p[0], LF_FIRE.z - p[1]) }; })();

function lfSandCanvas() {
  return lfCanvas(512, 512, (g, w, h) => { const r = new RNG(91); g.fillStyle = '#b8a487'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26000; i++) { const v = r.range(-28, 22); g.fillStyle = `rgba(${150 + v},${132 + v},${108 + v},0.5)`; g.fillRect(r.range(0, w), r.range(0, h), r.range(1, 3), r.range(1, 3)); }
    for (let i = 0; i < 40; i++) { g.strokeStyle = 'rgba(90,76,60,0.12)'; g.lineWidth = r.range(2, 6); g.beginPath(); const y = r.range(0, h); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + r.range(-30, 30), w * 0.6, y + r.range(-30, 30), w, y + r.range(-10, 10)); g.stroke(); } });
}
function lfConcreteCanvas(seed, base = [120, 118, 110], blocks = true) {
  return lfCanvas(512, 512, (g, w, h) => { const r = new RNG(seed); g.fillStyle = `rgb(${base})`; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { const v = r.range(-22, 18); g.fillStyle = `rgba(${base[0] + v},${base[1] + v},${base[2] + v},0.35)`; g.fillRect(r.range(0, w), r.range(0, h), r.range(1, 4), r.range(1, 4)); }
    for (let i = 0; i < 14; i++) { const x = r.range(0, w); const gr = g.createLinearGradient(x, 0, x + r.range(-20, 20), h); gr.addColorStop(0, 'rgba(40,40,36,0)'); gr.addColorStop(r.range(0.3, 0.8), 'rgba(40,40,36,0.22)'); gr.addColorStop(1, 'rgba(40,40,36,0.05)'); g.fillStyle = gr; g.fillRect(x - 6, 0, r.range(4, 18), h); }
    if (blocks) { g.strokeStyle = 'rgba(30,30,28,0.55)'; g.lineWidth = 3; for (let y = 0; y <= h; y += 128) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      for (let y = 0; y < h; y += 128) for (let x = (y / 128) % 2 ? 128 : 0; x < w; x += 256) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 128); g.stroke(); } } });
}
function lfRoadCanvas() {
  // u along the road (28 m), v across it (7 m: z −19 at v 0 … −12 at v 1): edge lines, a dashed white centre line
  return lfCanvas(1024, 256, (g, w, h) => { const r = new RNG(33); g.fillStyle = '#2b2c2e'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 16000; i++) { const v = r.range(-14, 14); g.fillStyle = `rgba(${44 + v},${45 + v},${48 + v},0.6)`; g.fillRect(r.range(0, w), r.range(0, h), r.range(1, 3), r.range(1, 3)); }
    g.fillStyle = 'rgba(214,212,200,0.85)'; g.fillRect(0, h * 0.035, w, h * 0.016); g.fillRect(0, h * 0.95, w, h * 0.016);
    for (let x = 0; x < w; x += w / 3) g.fillRect(x, h * 0.492, w / 3 * 0.33, h * 0.016);
    g.fillStyle = 'rgba(10,10,12,0.25)'; for (const y of [0.25, 0.75]) g.fillRect(0, h * (y - 0.06), w, h * 0.12); });
}
function lfBallastCanvas() {
  return lfCanvas(512, 512, (g, w, h) => { const r = new RNG(55); g.fillStyle = '#5c5850'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { const v = r.range(-40, 40); g.fillStyle = `rgb(${92 + v},${88 + v},${80 + v})`; const s = r.range(3, 9); g.beginPath(); g.ellipse(r.range(0, w), r.range(0, h), s, s * r.range(0.5, 1), r.range(0, 3), 0, 6.3); g.fill(); } });
}

function lfBuildCoast(S) {
  const scene = S.scene, W = { cars: [], lampGlow: [], lampHeads: [], people: [], party: [] }, U = lfPoolUniforms(), ST = LF_ST;
  W.U = U;
  const tex = (c, rx, ry) => { const t = lfTex(c, { aniso: 8 }); t.repeat.set(rx, ry); return t; };
  const M = {
    wall: lfStd('#ffffff', 0.92, 0, { map: tex(lfConcreteCanvas(3), 2400 / 6, 1) }),
    top: lfPoolPatch(lfStd('#8a8a80', 0.95, 0, { map: tex(lfConcreteCanvas(4, [118, 116, 104], false), 2400 / 10, 24 / 10) }), U),
    dark: lfStd('#2a2a28', 0.9), parapet: lfStd('#ffffff', 0.9, 0, { map: tex(lfConcreteCanvas(5, [134, 131, 122]), 2400 / 3, 1) }),
    ballast: lfStd('#ffffff', 1, 0, { map: tex(lfBallastCanvas(), 2400 / 2.5, 1.4) }), sleeper: lfStd('#4a4640', 0.9), rail: lfStd('#8d8f92', 0.32, 0.85),
    road: lfPoolPatch(lfStd('#ffffff', 0.86, 0, { map: tex(lfRoadCanvas(), 2357 / 28, 1) }), U), kerb: lfPoolPatch(lfStd('#9a988f', 0.9), U),
    mast: lfStd('#5d6066', 0.6, 0.6), pole: lfStd('#6d7076', 0.55, 0.5), lampHead: lfStd('#3a3c40', 0.5, 0.4),
    land: lfPoolPatch(lfStd('#ffffff', 1, 0, { vertexColors: true }), U), head: lfStd('#ffffff', 1, 0, { vertexColors: true }),
    sand: lfStd('#ffffff', 0.97, 0, { map: tex(lfSandCanvas(), 1, 1), vertexColors: true }), rock: lfStd('#4a4740', 0.95), wood: lfStd('#6a5642', 0.9),
    char: lfStd('#191512', 0.95), stone: lfStd('#5a5650', 0.9), pine: lfStd('#141a14', 1), trunk: lfStd('#2a2420', 1),
  };
  W.M = M;
  // ---- the platform the line runs on (its face is the sea wall), the parapet (with the gap for the beach steps)
  { const x0 = -830, x1 = ST.x1 + 1, g = new THREE.BoxGeometry(x1 - x0, 7, 24),   // (1 m past everything that ends at ST.x1)
    m = new THREE.Mesh(g, [M.wall, M.wall, M.top, M.dark, M.wall, M.wall]);
    m.position.set((x0 + x1) / 2, ST.wallTop - 3.5, -8); m.receiveShadow = true; scene.add(m); W.platform = m;
    const gx = [ST.beach.stepsX - 2.3, ST.beach.stepsX + 2.3];
    for (const [a, b] of [[-661.5, gx[0]], [gx[1], x1]]) lfBox(b - a, 1.12, 0.42, M.parapet, (a + b) / 2, ST.wallTop + 0.5, 3.52);
    for (const x of gx) lfBox(0.5, 1.3, 0.5, M.parapet, x + (x < ST.beach.stepsX ? -0.24 : 0.24), ST.wallTop + 0.6, 3.52);   // (the gap's piers, a little taller; 1 cm past the parapet's ends: no shared face)
  }
  // ---- the tracks: ballast (a trapezoid, its foot inside the platform), sleepers, rails
  { const sh = new THREE.Shape(); sh.moveTo(-1.85, -0.06); sh.lineTo(1.85, -0.06); sh.lineTo(1.35, 0.075); sh.lineTo(-1.35, 0.075); sh.closePath();
    const X0 = -820, L = ST.x1 - X0;                                // (from the tunnel's far end)
    for (const tz of ST.track) {
      const g = new THREE.ExtrudeGeometry(sh, { depth: L, bevelEnabled: false }); g.rotateY(Math.PI / 2); g.translate(X0, ST.wallTop, tz);
      // (uvs along the extrusion: scale them so the texture's repeat reads per 2.5 m)
      const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) - X0) / L, (p.getZ(i) - tz + 1.85) / 3.7);
      const m = new THREE.Mesh(g, M.ballast); m.receiveShadow = true; scene.add(m);
      for (const dz of [-0.7175, 0.7175]) lfBox(L, 0.17, 0.072, M.rail, X0 + L / 2, ST.railY - 0.085, tz + dz);
    }
    const n = Math.floor(L / 0.65), sg = new THREE.BoxGeometry(0.24, 0.13, 2.55), sm = new THREE.InstancedMesh(sg, M.sleeper, n * 2), o = new THREE.Object3D();
    let k = 0; for (const tz of ST.track) for (let i = 0; i < n; i++) { o.position.set(X0 + 0.3 + i * 0.65, ST.wallTop + 0.075 + 0.04, tz); o.updateMatrix(); sm.setMatrixAt(k++, o.matrix); }
    sm.receiveShadow = true; scene.add(sm);
  }
  // ---- the overhead line: masts every 50 m (north of both tracks), cantilevers over both, the contact and messenger wires
  { const xs = []; for (let x = -640; x <= ST.x1; x += ST.mastEvery) xs.push(x);
    const pole = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.13, 0.16, 7.6, 10), M.mast, xs.length), o = new THREE.Object3D();
    const arm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 6), M.mast, xs.length * 2);
    xs.forEach((x, i) => { o.position.set(x, ST.wallTop + 3.8 - 0.1, ST.mastZ); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); o.updateMatrix(); pole.setMatrixAt(i, o.matrix);
      const put = (j, a, b) => { const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length(); o.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
        o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); o.scale.set(1, L, 1); o.updateMatrix(); arm.setMatrixAt(j, o.matrix); o.quaternion.identity(); };
      put(i * 2, [x, ST.wallTop + 7.15, ST.mastZ], [x, ST.wallTop + 7.15, 1.0]); put(i * 2 + 1, [x, ST.wallTop + 5.9, ST.mastZ], [x, ST.wallTop + 6.95, 0.6]); });
    scene.add(pole, arm); W.mastXs = xs;
    const P = [], push = (a, b) => P.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    for (const tz of ST.track) { push([-660, ST.wireY, tz], [ST.x1, ST.wireY, tz]);
      for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < 10; j++) { const u0 = j / 10, u1 = (j + 1) / 10, sag = (u) => 0.55 * 4 * u * (1 - u), xa = xs[i] + 50 * u0, xb = xs[i] + 50 * u1;
        push([xa, ST.wallTop + 7.05 - sag(u0), tz], [xb, ST.wallTop + 7.05 - sag(u1), tz]); } }
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    W.wires = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: '#30353c', transparent: true, opacity: 0.85 })); scene.add(W.wires);
  }
  // ---- the coast road, its kerb, the lamps
  { const x0 = -657, x1 = ST.x1, z0 = ST.road.z[0], z1 = ST.road.z[1];
    const g = new THREE.BoxGeometry(x1 - x0, 0.32, z1 - z0); const r = new THREE.Mesh(g, [M.kerb, M.kerb, M.road, M.dark, M.kerb, M.kerb]); r.position.set((x0 + x1) / 2, ST.road.y - 0.16, (z0 + z1) / 2); r.receiveShadow = true; scene.add(r);
    lfBox(x1 - x0, 0.45, 0.24, M.kerb, (x0 + x1) / 2, ST.wallTop + 0.2, z1 + 0.12);
    const n = LF_LAMP.n, pg = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.11, 8.3, 8), M.pole, n), ag = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 0.08, 2.5), M.pole, n);
    const hg = new THREE.InstancedMesh(new THREE.BoxGeometry(0.7, 0.16, 0.34), M.lampHead, n), o = new THREE.Object3D();
    const lens = new THREE.InstancedMesh(new THREE.BoxGeometry(0.56, 0.02, 0.24), new THREE.MeshBasicMaterial({ color: '#ffd9a0' }), n);
    for (let i = 0; i < n; i++) { const x = LF_LAMP.x0 + i * LF_LAMP.every;
      o.position.set(x, ST.wallTop + 4.1, LF_LAMP.z); o.updateMatrix(); pg.setMatrixAt(i, o.matrix);
      o.position.set(x, ST.wallTop + 8.15, (LF_LAMP.z + LF_LAMP.headZ) / 2 - 0.1); o.updateMatrix(); ag.setMatrixAt(i, o.matrix);
      o.position.set(x, LF_LAMP.y + 0.08, LF_LAMP.headZ); o.updateMatrix(); hg.setMatrixAt(i, o.matrix);
      o.position.set(x, LF_LAMP.y - 0.005, LF_LAMP.headZ); o.updateMatrix(); lens.setMatrixAt(i, o.matrix); }
    lens.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3).fill(1), 3);
    scene.add(pg, ag, hg, lens); W.lens = lens;
    // the lamps' glow: one point each, sized in pixels by the shader (no sprite planes)
    const P = [], A = []; for (let i = 0; i < n; i++) { P.push(LF_LAMP.x0 + i * LF_LAMP.every, LF_LAMP.y - 0.15, LF_LAMP.headZ); A.push(1); }
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); gg.setAttribute('aOn', new THREE.Float32BufferAttribute(A, 1));
    W.lampPts = new THREE.Points(gg, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uPx: { value: 1 } },
      vertexShader: 'attribute float aOn; uniform float uPx; varying float vA; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vA = aOn; gl_PointSize = uPx * clamp(900.0 / -mv.z, 3.0, 90.0); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'varying float vA; void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r = dot(q, q); if (r > 1.0) discard; float a = vA * (exp(-r * 7.0) * 0.9 + exp(-r * 2.2) * 0.18); gl_FragColor = vec4(vec3(1.0, 0.74, 0.44) * a, a); }' }));
    W.lampPts.frustumCulled = false; scene.add(W.lampPts);
  }
  // ---- the land north of the road, the houses on it (windows in their shader), the Norfolk pines along the verge
  { const xs = lfRange(-660, ST.x1 + 100, 150), zs = [-20, -21, -22.5, -25, -29, -35, -45, -60, -80, -110, -150, -200, -270, -360, -480, -640, -850, -1100, -1500];
    W.land = lfHeightMesh(xs, zs, lfLandY, M.land, (x, z, y) => { const n = 0.5 + 0.5 * noise1(x * 0.03 + z * 0.02, 41); return [0.13 + 0.05 * n, 0.15 + 0.06 * n, 0.1 + 0.03 * n]; });
    const r = new RNG(611), H = [];
    for (let guard = 0; H.length < 150 && guard < 4000; guard++) {
      const x = r.range(-600, ST.x1 + 40), z = -27 - Math.pow(r.next(), 1.6) * 300;
      if (H.some((h) => Math.abs(h.x - x) < 13 && Math.abs(h.z - z) < 13)) continue;
      H.push({ x, z, w: r.range(7, 12), d: r.range(7, 10), h: r.range(3.2, 6.4), rh: r.range(1.6, 2.6), ry: r.range(-0.12, 0.12), c: r.pick(['#d8d0c0', '#c8c0b0', '#e2dccc', '#b8b0a0', '#d0c4b0']), roof: r.pick(['#5a3a30', '#3a3c40', '#6a4a38', '#4a4a4c']) });
    }
    const wallMat = lfStd('#ffffff', 0.9, 0, { map: lfTex(lfCanvas(64, 64, (g) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 64, 64); }), { repeat: false }) });
    const HU = { uOn: { value: 1 }, uEm: { value: 0 }, uK: { value: 1 } };
    wallMat.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, HU);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vSeed; varying vec2 vSz;').replace('#include <begin_vertex>', `#include <begin_vertex>
        vSeed = fract(sin(dot(instanceMatrix[3].xz, vec2(12.9898, 78.233))) * 43758.5453);
        vec3 sc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz)); vSz = abs(normal.x) > 0.5 ? sc.zy : sc.xy;`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        varying float vSeed; varying vec2 vSz; uniform float uOn, uEm, uK; float lfH(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { vec2 q = vMapUv * vSz; vec2 cell = floor(q / vec2(2.6, 2.7)); vec2 f = fract(q / vec2(2.6, 2.7));
          float win = step(0.22, f.x) * step(f.x, 0.78) * step(0.3, f.y) * step(f.y, 0.78) * step(0.5, q.y) * step(q.y, vSz.y - 0.4) * step(0.6, q.x) * step(q.x, vSz.x - 0.6);
          float hh = lfH(cell + vSeed * 17.0), lit = step(0.42, hh), torch = step(0.86, lfH(cell + vSeed * 5.0 + 3.0));
          vec3 warm = mix(vec3(1.0, 0.72, 0.4), vec3(1.0, 0.86, 0.62), hh);
          totalEmissiveRadiance += win * (warm * lit * uOn * 1.4 + vec3(0.7, 0.8, 1.0) * torch * uEm * 0.5) * uK;
          diffuseColor.rgb *= 1.0 - 0.75 * win; }`);
    };
    wallMat.customProgramCacheKey = () => 'lfHouse';
    W.HU = HU;
    const body = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), [wallMat, wallMat, M.dark, M.dark, wallMat, wallMat], H.length);
    const sh = new THREE.Shape(); sh.moveTo(-0.5, 0); sh.lineTo(0.5, 0); sh.lineTo(0, 1); sh.closePath();
    const rg = new THREE.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false }); rg.translate(0, 0, -0.5);
    const roof = new THREE.InstancedMesh(rg, lfStd('#ffffff', 0.85), H.length), o = new THREE.Object3D(), col = new THREE.Color();
    H.forEach((h, i) => { const y = lfLandY(h.x, h.z) - 0.4; o.rotation.set(0, h.ry, 0);
      o.position.set(h.x, y + (h.h + 0.4) / 2, h.z); o.scale.set(h.w, h.h + 0.4, h.d); o.updateMatrix(); body.setMatrixAt(i, o.matrix); body.setColorAt(i, col.set(h.c));
      o.position.set(h.x, y + h.h + 0.4 - 0.06, h.z); o.scale.set(h.w + 0.7, h.rh, h.d + 0.7); o.updateMatrix(); roof.setMatrixAt(i, o.matrix); roof.setColorAt(i, col.set(h.roof)); });
    body.receiveShadow = roof.receiveShadow = true; scene.add(body, roof); W.houses = H;
    // the pines: tiers of cones on a trunk (one merged geometry, instanced)
    const parts = [new THREE.CylinderGeometry(0.18, 0.3, 22, 7).translate(0, 11, 0)];
    for (let k = 0; k < 7; k++) { const y = 6 + k * 2.4, rr = 4.2 - k * 0.5; parts.push(new THREE.ConeGeometry(rr, 2.6, 9, 1, true).translate(0, y + 1.3, 0)); }
    const pg = THREE.mergeGeometries(parts.map((g) => g.toNonIndexed()), true);
    const pines = new THREE.InstancedMesh(pg, [M.trunk, ...Array(7).fill(M.pine)], 46);
    for (let i = 0; i < 46; i++) { const x = -560 + i * 49 + 14 * (lfR(i, 71) - 0.5), z = -22.6 - 2.4 * lfR(i, 72), s = 0.75 + 0.5 * lfR(i, 73); o.rotation.set(0, lfR(i, 74) * 6, 0); o.position.set(x, lfLandY(x, z) - 0.2, z); o.scale.setScalar(s); o.updateMatrix(); pines.setMatrixAt(i, o.matrix); }
    M.pine.side = THREE.DoubleSide; scene.add(pines);
  }
  // ---- the headland: the cliff (the tunnel's portal in it), the tunnel, the lighthouse on top
  { const xs = [...lfRange(-1600, -720, 44), ...lfRange(-716, -640, 38)], zs = [...new Set([...lfRange(-700, 260, 96), -14, 8.5, -7, 2.6])].sort((a, b) => a - b);
    W.headland = lfHeightMesh(xs, zs, lfHeadY, M.head, (x, z, y) => { const n = 0.5 + 0.5 * noise1(x * 0.02 + z * 0.03, 51), rock = MathX.clamp((Math.abs(lfHeadY(x + 2, z) - y) - 1.5) / 4, 0, 1);
      return [0.1 + 0.05 * n + 0.12 * rock, 0.12 + 0.05 * n + 0.1 * rock, 0.08 + 0.03 * n + 0.08 * rock]; },
      // (a hole where the cliff would cross the tunnel: it is behind the portal's face, and the tunnel's own walls close it)
      (x, z, ymin) => z > -14 && z < 8.5 && x > -704 && x < -650 && ymin < 15.5);
    // the portal: a concrete face with an arched hole for both tracks (an extruded shape, 4 m thick)
    const sh = new THREE.Shape(); sh.moveTo(-14, -0.5); sh.lineTo(8.5, -0.5); sh.lineTo(8.5, 19); sh.lineTo(-14, 19); sh.closePath();
    const hole = new THREE.Path(); hole.moveTo(-7.0, -0.6); hole.lineTo(2.6, -0.6); hole.lineTo(2.6, 5.6); hole.absarc(-2.2, 5.6, 4.8, 0, Math.PI, false); hole.lineTo(-7.0, -0.6); sh.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 4, bevelEnabled: false }); g.rotateY(-Math.PI / 2); g.translate(-658, ST.wallTop, 0);   // (shape x → world z; x −662…−658)
    const pm = new THREE.Mesh(g, lfStd('#ffffff', 0.92, 0, { map: tex(lfConcreteCanvas(8, [110, 108, 100]), 0.08, 0.08) })); scene.add(pm);
    // the tunnel: a dark tube going in (seen from inside only: its open mouth is inside the portal's thickness)
    const tg = new THREE.CylinderGeometry(4.7, 4.7, 160, 18, 1, true, 0, Math.PI); tg.rotateZ(Math.PI / 2);
    const tm = new THREE.Mesh(tg, lfStd('#16171a', 1, 0, { side: THREE.BackSide })); tm.position.set(-660 - 80, ST.wallTop + 5.6, -2.2); scene.add(tm);
    lfBox(160, 6.25, 9.4, lfStd('#121316', 1, 0, { side: THREE.BackSide }), -660 - 80.3, ST.wallTop - 0.6 + 3.1, -2.2);
    for (let i = 0; i < 6; i++) { const L = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.1), new THREE.MeshBasicMaterial({ color: '#ffb46a' })); L.position.set(-675 - i * 22, ST.wallTop + 5.0, 2.43); scene.add(L); }
    // the lighthouse (LED lamp: it fades with every other LED)
    const lx = -905, lz = 60, ly = lfHeadY(lx, lz);
    lfCyl(1.9, 2.5, 16, lfStd('#e8e4da', 0.6), lx, ly + 8, lz); lfCyl(1.5, 1.5, 2.4, lfStd('#2a2c30', 0.4, 0.5), lx, ly + 17.2, lz);
    W.lhLamp = lfMesh(new THREE.SphereGeometry(0.7, 16, 10), new THREE.MeshBasicMaterial({ color: '#fff4dc' }), lx, ly + 17.2, lz);
    lfMesh(new THREE.ConeGeometry(1.9, 1.6, 16), lfStd('#3a2a24', 0.6), lx, ly + 19.2, lz);
    const bg = new THREE.ConeGeometry(14, 900, 24, 1, true); bg.translate(0, -450, 0); bg.rotateZ(Math.PI / 2);   // (a long, thin cone pointing +x)
    W.lhBeam = new THREE.Mesh(bg, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uA: { value: 1 } },
      vertexShader: 'varying float vX; varying vec3 vN, vV; void main(){ vX = position.x / 900.0; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform float uA; varying float vX; varying vec3 vN, vV; void main(){ float e = pow(abs(dot(vN, vV)), 1.6); gl_FragColor = vec4(vec3(1.0, 0.95, 0.82) * uA * 0.16 * e * exp(-vX * 3.5), 1.0); }' }));
    W.lhBeam.position.set(lx, ly + 17.2, lz); scene.add(W.lhBeam);
    const sp = new THREE.SpriteMaterial({ map: lfDotTex(0.25), color: '#fff2d8', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    W.lhGlow = new THREE.Sprite(sp); W.lhGlow.scale.set(14, 14, 1); W.lhGlow.position.set(lx, ly + 17.2, lz); scene.add(W.lhGlow);
  }
  // ---- the cove: the sand (from under the wall to under the water), the rocks at its ends, the steps down
  { const B = ST.beach, xs = lfRange(B.x[0] - 20, B.x[1] + 20, 120), zs = [3.85, ...lfRange(4.4, 75, 70)];
    W.sand = lfHeightMesh(xs, zs, lfSandY, M.sand, (x, z, y) => { const wet = lfSm(z, 36, 46), n = 0.92 + 0.08 * noise1(x * 0.3 + z * 0.4, 61); return [n * (1 - 0.45 * wet), n * (1 - 0.42 * wet), n * (1 - 0.38 * wet)]; });
    const r = new RNG(77);
    for (let i = 0; i < 34; i++) { const end = i % 2 ? B.x[1] + r.range(-30, 25) : B.x[0] + r.range(-25, 30), z = r.range(6, 60), s = r.range(1.5, 5.5);
      const m = lfMesh(lfBlobGeo(1, 300 + i), M.rock, end, lfSandY(end, z) - s * 0.25, z); m.scale.set(s * r.range(0.8, 1.5), s * r.range(0.5, 0.9), s * r.range(0.8, 1.4)); m.rotation.y = r.range(0, 6); }
    // the steps: one extruded profile (no stacked boxes, so no coplanar sides), 4 m wide, from the wall's top to the sand
    const sh = new THREE.Shape(); const n = 6, rise = (ST.wallTop - 1.86) / n, run = 0.32;
    sh.moveTo(3.6, ST.wallTop); for (let i = 0; i < n; i++) { sh.lineTo(4 + i * run, ST.wallTop - i * rise); sh.lineTo(4 + i * run, ST.wallTop - (i + 1) * rise); sh.lineTo(4 + (i + 1) * run, ST.wallTop - (i + 1) * rise); }
    sh.lineTo(4 + n * run, 1.2); sh.lineTo(3.6, 1.2); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: 4.0, bevelEnabled: false });
    // (shape x → world z, shape y → world y, extrusion → world x)
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const sx = p.getX(i), sy = p.getY(i), sz = p.getZ(i); p.setXYZ(i, B.stepsX - 2 + sz, sy, sx); }
    g.computeVertexNormals(); const sm = new THREE.Mesh(g, lfStd('#ffffff', 0.92, 0, { map: tex(lfConcreteCanvas(9, [128, 126, 118], false), 0.3, 0.3) })); scene.add(sm);
    for (const x of [B.stepsX - 1.95, B.stepsX + 1.95]) { const rail = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 8), M.pole); lfStrut(rail, [x, ST.wallTop + 0.95, 3.9], [x, 1.86 + 0.95, 4 + n * run + 0.2], 0.025); scene.add(rail);
      for (const u of [0, 0.5, 1]) { const zz = 4.05 + u * (n * run), yy = ST.wallTop - u * (ST.wallTop - 1.86); lfCyl(0.025, 0.025, 0.95, M.pole, x, yy + 0.47 - 0.1 * u, zz); } }
  }
  // ---- the bonfire: a ring of stones, the logs (the flames and the light come in update())
  { const F = LF_FIRE;
    for (let i = 0; i < 13; i++) { const a = i / 13 * 6.283, m = lfMesh(lfBlobGeo(1, 500 + i), M.stone, F.x + Math.cos(a) * 0.78, F.y + 0.02, F.z + Math.sin(a) * 0.78); m.scale.set(0.2, 0.15, 0.17); m.rotation.y = a; }
    W.logs = [];
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + 0.3, m = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.0, 8), i % 2 ? M.char : M.wood); m.position.set(F.x + Math.cos(a) * 0.2, F.y + 0.24, F.z + Math.sin(a) * 0.2);
      m.lookAt(F.x - Math.cos(a) * 0.4, F.y + 0.85, F.z - Math.sin(a) * 0.4); m.rotateX(Math.PI / 2); scene.add(m); W.logs.push(m); }
    W.embers = lfMesh(new THREE.CircleGeometry(0.42, 20), new THREE.MeshBasicMaterial({ color: '#ff6a20' }), F.x, F.y + 0.06, F.z); W.embers.rotation.x = -Math.PI / 2;
    W.fireL = new THREE.PointLight('#ff9448', 0, 34, 1.7); W.fireL.position.set(F.x, F.y + 0.9, F.z); scene.add(W.fireL);
    W.fireL2 = new THREE.PointLight('#ff7a30', 0, 14, 1.8); W.fireL2.position.set(F.x + 0.2, F.y + 0.35, F.z - 0.1); scene.add(W.fireL2);
    // driftwood logs to sit on
    for (const [a, r0, L] of [[-80, 2.75, 2.6], [178, 2.95, 2.4], [216.87, 2.8, 2.2]]) { const p = lfAround(a, r0), m = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, L, 10), M.wood);
      m.position.set(p[0], lfSandY(p[0], p[1]) + 0.12, p[1]); m.rotation.z = Math.PI / 2; m.rotation.y = -MathX.deg(a) + Math.PI / 2; m.castShadow = true; scene.add(m); }
  }
  // ---- the speaker on its cool box (the woofer's cone moves; its LED ring fades like every LED)
  { const K = LF_SPK, g = new THREE.Group(); g.position.set(K.x, K.y - 0.04, K.z); g.rotation.y = K.yaw; scene.add(g); W.spk = g;
    lfBox(0.62, 0.42, 0.4, lfStd('#2a6a9a', 0.5), 0, 0.21, 0, g); lfBox(0.64, 0.06, 0.42, lfStd('#e8e8e4', 0.5), 0, 0.44, 0, g);
    lfBox(0.36, 0.58, 0.26, lfStd('#1b1c1f', 0.6), 0, 0.47 + 0.29, 0, g);
    W.cone = lfMesh(new THREE.ConeGeometry(0.115, 0.05, 24, 1, true), lfStd('#2a2b2e', 0.8), 0, 0.68, 0.135, g); W.cone.rotation.x = -Math.PI / 2; W.cone.material.side = THREE.DoubleSide;
    W.dust = lfMesh(new THREE.SphereGeometry(0.035, 12, 8), lfStd('#3a3b3e', 0.5), 0, 0.68, 0.14, g);
    lfMesh(new THREE.TorusGeometry(0.125, 0.008, 6, 32), lfStd('#55575c', 0.4, 0.6), 0, 0.68, 0.131, g);
    W.spkRing = lfMesh(new THREE.TorusGeometry(0.15, 0.006, 6, 40), new THREE.MeshBasicMaterial({ color: '#4ad0ff' }), 0, 0.68, 0.131, g);
    W.tweet = lfMesh(new THREE.SphereGeometry(0.03, 10, 8, 0, 6.283, 0, 1.4), lfStd('#3a3b3e', 0.4), 0, 0.93, 0.13, g); W.tweet.rotation.x = Math.PI / 2;
    for (let i = 0; i < 4; i++) lfBox(0.07, 0.24, 0.07, lfStd('#2a5a2a', 0.3, 0, { transparent: true, opacity: 0.85 }), -0.2 + i * 0.13 + 0.8, 0.12, 0.3 - 0.05 * i, g);   // bottles on the sand
  }
  // ---- the party (posed in update()), and you (seen only from outside)
  for (const [look, a, r0, what] of LF_PARTY) { const P = lfPerson(look, scene, { id: 'pt' + W.party.length }); P.what = what; P.a = a; P.r = r0; W.party.push(P); }
  W.you = lfPerson('lfYou', scene, { id: 'you' });
  // ---- the cars (headlight and tail materials their own, so each dims by itself), their beams' glows
  { const VF = new VehicleFactory(), sm = new THREE.SpriteMaterial({ map: lfDotTex(0.22), color: '#fff0d0', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    LF_CARS.forEach(([lane, , , type, colr], i) => { const o = VF.build(type, colr), head = VF.m.head.clone(), tail = o.tail.clone();
      o.group.traverse((c) => { if (c.isMesh && c.material === VF.m.head) c.material = head; if (c.isMesh && c.material === o.tail) c.material = tail; });
      const g = new THREE.Group(); g.add(o.group); scene.add(g); g.rotation.y = lane > 0 ? 0 : Math.PI;
      const glows = [-1, 1].map((sz) => { const sp = new THREE.Sprite(sm.clone()); sp.scale.set(1.6, 1.6, 1); sp.position.set(o.L / 2 + 0.35, CAR_PROFILES[type].head, sz * (o.W / 2 - 0.3)); g.add(sp); return sp; });
      const driver = lfPerson('lfDrv', g, { id: 'car' + i }); driver.root.position.set(0.05, 0.28, -0.38); driver.root.rotation.y = Math.PI / 2; driver.apply(LF_POSES.drive());
      W.cars.push({ g, o, head, tail, glows, driver, type }); });
  }
  // -------------------------------------------------------------------------------------------------------------------
  W.update = (s, u = {}) => {
    // the lamps: a wave of trips along the coast
    const lon = U.uLampOn.value, lp = W.lampPts.geometry.attributes.aOn, lc = W.lens.instanceColor;
    for (let i = 0; i < LF_LAMP.n; i++) { const v = lfGrid(s, lfLampD(i)); lon[i] = v; lp.setX(i, v); lc.setXYZ(i, 0.06 + 0.94 * v, 0.05 + 0.8 * v, 0.04 + 0.6 * v); }
    lp.needsUpdate = true; lc.needsUpdate = true; W.lampPts.material.uniforms.uPx.value = u.px ?? 1;
    // the cars
    LF_CARS.forEach((c, i) => { const q = lfCarAt(i, s), C = W.cars[i]; C.g.position.set(q.x, ST.road.y, q.z); C.q = q;
      const rot = (q.x - LF_CARS[i][1]) * q.dir / C.o.r; for (const w of C.o.wheels) w.rotation.z = -rot;
      C.head.emissiveIntensity = 1.6 * q.head; C.head.color.setScalar(0.3 + 0.7 * q.head); for (const g of C.glows) g.material.opacity = 0.85 * q.head;
      C.tail.emissiveIntensity = 0.6 * q.head; U.uCar.value[i].set(q.x + q.dir * C.o.L / 2, q.z, q.dir, q.head);
      C.driver.apply(q.run ? LF_POSES.drive() : lfKeys(s - lfCarCut(i), [[-9, LF_POSES.drive()], [0.5, LF_POSES.turnKey()], [3.5, LF_POSES.drive()]], 0.5)); });
    // the houses: on the coast's grid, then a few torches
    W.HU.uOn.value = lfGrid(s, LF_COAST_D + 0.2); W.HU.uEm.value = lfPhone(s, 19) * (0.6 + 0.4 * lfFlick(s, 9, 2));
    // the lighthouse: its LED lamp (on its own batteries), turning once every 12 s
    const lh = LFP.led(LFP.k(s)); W.lhLamp.material.color.setScalar(0.1 + 0.9 * lh); W.lhGlow.material.opacity = 0.9 * lh; W.lhBeam.material.uniforms.uA.value = lh;
    W.lhBeam.rotation.y = s / 12 * 6.283 + 1.1;
    // the fire: the logs glow and the flames give a 1/k² of the light at the same heat
    const fl = lfFire(s, 1), fl2 = lfFire(s, 4); W.fireL.intensity = 95 * fl; W.fireL2.intensity = 30 * fl2; W.fire = fl;
    W.embers.material.color.setRGB(1.0 * fl + 0.03, 0.36 * fl + 0.01, 0.1 * fl);
    // the speaker: the cone's travel ∝ the magnet's force ∝ 1/k²; the LED ring fades
    const k = LFP.k(s), beat = Math.max(0, Math.sin(s * 2 * Math.PI * 2.0)) ** 6 + 0.35 * Math.sin(s * 2 * Math.PI * 8.0) * Math.sin(s * 3.1);
    W.cone.position.z = 0.135 + 0.012 * beat / (k * k); W.dust.position.z = W.cone.position.z + 0.005;
    W.spkRing.material.color.setRGB(0.29 * LFP.led(k) + 0.01, 0.82 * LFP.led(k) + 0.01, LFP.led(k) + 0.01);
    W.spkPush = 1 / (k * k);
    // the party
    W.party.forEach((P, i) => lfPoseParty(P, i, s));
    lfPoseYou(W.you, s);
  };
  return W;
}

// where each of the party is and what they're doing at s (pure). Before ~65 s two dance by the speaker; they slow as it
// fades; from ~100 s phones come out (torches); from ~240 s they lie back and look up; at the end they're standing at the
// water's edge, looking south
function lfPoseParty(P, i, s) {
  const [x, z] = lfAround(P.a, P.r), y = lfSandY(x, z), face = Math.atan2(LF_FIRE.x - x, LF_FIRE.z - z);
  const sea = Math.atan2(0.15, 1);
  let pose, px = x, pz = z, py = y, yaw = face;
  if (P.what === 'dance') {
    const e = MathX.clamp(LFP.speakerDb(LFP.k(s)) / -18, 0, 1), ph = s * 2 * Math.PI * 1.0 + i;
    pose = s < 90 ? lerpPose(LF_POSES.dance(ph), LF_POSES.standStill(), lfEase(e, 0.2, 1)) : LF_POSES.standStill();
    yaw = face + 0.6 * Math.sin(s * 0.4 + i);
  } else if (P.what === 'stand') pose = s < 120 ? LF_POSES.bottle() : LF_POSES.torch();
  else if (P.what === 'log') { pose = LF_POSES.sit(); py = y + 0.1; if (s > 104 + i) pose = LF_POSES.sitTorch(); }
  else pose = i % 2 ? LF_POSES.warm() : LF_POSES.hugKnees();
  // the stars: lying back, looking up
  if (s > 238 && s < 1300 && P.what !== 'dance') { pose = P.what === 'stand' ? LF_POSES.lookUpStand() : P.what === 'log' ? LF_POSES.lookUpSit() : LF_POSES.lean(); }
  if (s > 238 && s < 1300 && P.what === 'dance') pose = LF_POSES.lookUpStand();
  // the end: at the water's edge, looking south (each a few metres apart)
  if (s > 1300) { px = 712 + i * 3.1; pz = 40.5 + 1.2 * Math.sin(i * 1.7); py = lfSandY(px, pz); yaw = sea + 0.2 * Math.sin(i * 2.3); pose = i % 3 === 1 ? LF_POSES.lookUpStand() : LF_POSES.lookUp(); }
  P.root.position.set(px, py, pz); P.root.rotation.y = yaw;
  P.apply(lfFidget(Object.assign({}, pose), s, i, 0.6));
}
// you, seen from outside: at the fire from ~80 s, lying back for the stars, at the water at the end
function lfPoseYou(P, s) {
  const [x, z] = LF_YOU_FIRE.p; let px = x, pz = z, py = lfSandY(x, z) + 0.1, yaw = Math.atan2(LF_FIRE.x - x, LF_FIRE.z - z), pose = LF_POSES.sit();
  P.root.visible = s > 78;
  if (s > 238) pose = LF_POSES.lookUpSit();
  if (s > 1300) { px = 724; pz = 41.5; py = lfSandY(px, pz); yaw = Math.atan2(0.1, 1); pose = LF_POSES.lookUp(); }
  P.root.position.set(px, py, pz); P.root.rotation.y = yaw; P.apply(lfFidget(Object.assign({}, pose), s, 31, 0.4));
}
