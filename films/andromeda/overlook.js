/* =====================================================================
   OVERLOOK — where you stand: a hilltop lookout above a small town at
   night. The town lies in the valley to the north (where Andromeda first
   shows, low over the hills); behind you to the south are the hilltop park
   and its parking lot, under the Milky Way's centre. Mountains all round.
   Low/mid-poly, moonlit; the town is warm points of light (windows,
   streetlights, a few cars) under silhouetted roofs.
   World: metres, x east, y up, −z north; you stand at the railing near the
   origin, y = 0 on the lookout platform.
   ===================================================================== */

const OV = {
  railZ: -3.0,                 // the railing along the north edge of the platform
  valley: -42,                 // the valley floor (the town)
  town: { x0: -520, x1: 520, z0: -150, z1: -980 },
  lot: { x0: -10, x1: 14, z0: 22, z1: 40, y: -1.4 },
};

// the ground: a domed hilltop, a steep drop to the valley north, gentler slopes elsewhere, a southern valley beyond the park
function ovH(x, z) {
  const r = Math.hypot(x, z * 0.9);
  let y = -34 * MathX.smooth(r, 22, 190) - 0.006 * Math.max(0, r - 18) * Math.max(0, r - 18) * 0.05;
  // north: the steep fall to the valley
  const n = MathX.smooth(-z, 4, 75);
  y = Math.min(y, OV.valley * Math.pow(n, 0.8) + 0.2 * Math.sin(x * 0.05));
  if (z < -75) y = OV.valley + 2.5 * Math.sin(x * 0.006 + z * 0.004) + 4 * MathX.smooth(-z, 1050, 1500) * Math.sin(x * 0.003);
  // the platform and the park stay level; the lot a little lower
  const plat = MathX.smooth(10, 7, Math.abs(x)) * MathX.smooth(-4.2, -3.1, z) * MathX.smooth(14, 9, z);
  y = y * (1 - plat);
  if (z > 4 && z < 50 && Math.abs(x) < 30) y = Math.max(y, -1.4 * MathX.smooth(z, 6, 22) - 0.02 * Math.abs(x));
  return y;
}

class Overlook {
  constructor(scene, rng) {
    this.scene = scene; this.rng = rng.fork(11);
    this.root = new THREE.Group(); this.root.name = 'overlook'; scene.add(this.root);
    this.B = new Batcher();
    this.lightPts = [];           // [x, y, z, r, g, b, size, kind] — window and street lights (drawn as points)
    this._terrain();
    this._mountains();
    this._town();
    this._platform();
    this._trees();
    this._lot();
    this.B.build(this.root, 'overlook-static');
    this._lights();
  }

  _terrain() {
    const S = 2400, n = 150, g = new THREE.PlaneGeometry(S, S, n, n); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, col = new Float32Array(p.count * 3), rng = this.rng.fork(1);
    for (let i = 0; i < p.count; i++) {
      // (denser near the lookout: squeeze the grid toward the centre)
      let x = p.getX(i), z = p.getZ(i); const k = 1 + 0.0 * x; const sx = Math.sign(x) * Math.pow(Math.abs(x) / (S / 2), 1.8) * S / 2, sz = Math.sign(z) * Math.pow(Math.abs(z) / (S / 2), 1.8) * S / 2;
      x = sx * k; z = sz; p.setX(i, x); p.setZ(i, z);
      const y = ovH(x, z); p.setY(i, y);
      const v = 0.75 + 0.25 * rng.next(), town = z < -130 && Math.abs(x) < 560 ? 1 : 0;
      col.set(town ? [0.09 * v, 0.09 * v, 0.085 * v] : [0.06 * v, 0.085 * v, 0.055 * v], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }));
    m.receiveShadow = true; this.root.add(m); this.terrain = m;
  }

  // three rings of ridges, darker near, hazier far; low hills behind the town, higher mountains to the south
  _mountains() {
    const rng = this.rng.fork(2);
    [[2600, 120, 340, '#141a24'], [4200, 180, 620, '#1c2432'], [6400, 260, 980, '#28324a']].forEach(([R, h0, h1, c], li) => {
      const N = 220, pos = [], idx = [], off = rng.range(0, 100);
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * Math.PI * 2, x = Math.sin(a) * R, z = -Math.cos(a) * R;
        const south = 0.5 - 0.5 * Math.cos(a);               // 0 north, 1 south
        let h = h0 + (h1 - h0) * (0.35 + 0.65 * south);
        h *= 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(a * 5 + off)) * (0.6 + 0.4 * Math.sin(a * 13 + off * 2)) + 0.12 * Math.sin(a * 37 + off);
        pos.push(x, -260, z, x, h - 40 - li * 10, z);
        if (i < N) { const b = i * 2; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide, fog: true }));
      this.root.add(m);
    });
  }

  // houses along a grid of streets in the valley, a main road, a church, a few blocks of flats; lights as points
  _town() {
    const T = OV.town, rng = this.rng.fork(3), L = this.lightPts;
    const house = new THREE.BoxGeometry(1, 1, 1); house.translate(0, 0.5, 0);
    const roof = new THREE.CylinderGeometry(0.71, 0.71, 1, 3, 1); roof.rotateZ(Math.PI / 2); roof.rotateY(Math.PI / 2); roof.scale(1.0, 0.55, 1.0); roof.translate(0, 1.0, 0);
    const items = [];
    const warm = () => rng.pick([[1.0, 0.72, 0.38], [1.0, 0.8, 0.5], [1.0, 0.66, 0.32], [1.0, 0.86, 0.62], [0.7, 0.82, 1.0]]);
    const placeHouse = (x, z, ry, w, d, h) => {
      const y = ovH(x, z);
      items.push({ x, y, z, ry, w, d, h, c: rng.pick(['#3a3e46', '#463f3a', '#3c4440', '#4a4a50', '#40383a']) });
      // windows: a few lit ones on the sides facing the lookout
      const n = rng.int(1, 4);
      for (let k = 0; k < n; k++) if (rng.chance(0.8)) { const a = rng.range(-0.4, 0.4) * w, fl = rng.chance(0.3) ? h * 0.72 : h * 0.3; L.push([x + Math.cos(ry) * a + Math.sin(ry) * d * 0.51, y + fl, z - Math.sin(ry) * a + Math.cos(ry) * d * 0.51, ...warm(), rng.range(0.5, 1.0), 0]); }
      if (rng.chance(0.25)) L.push([x, y + 2.2, z + d * 0.6, 1.0, 0.75, 0.45, 0.5, 0]);   // a porch light
    };
    // streets: every 70 m east–west, every 55 m north–south (a little crooked), the main road along x = −20
    const streetsZ = [], streetsX = [];
    for (let z = T.z0 - 20; z > T.z1; z -= 70 + rng.range(-8, 8)) streetsZ.push(z);
    for (let x = T.x0 + 10; x < T.x1; x += 55 + rng.range(-6, 6)) streetsX.push(x);
    this.streetsZ = streetsZ; this.streetsX = streetsX;
    for (const z of streetsZ) for (let x = T.x0; x < T.x1; x += rng.range(13, 19)) {
      if (Math.abs(x - -20) < 10 || rng.chance(0.12)) continue;
      const edge = Math.abs(x) / T.x1; if (rng.chance(edge * 0.55)) continue;      // (thinning out toward the edges)
      for (const s of [-1, 1]) if (rng.chance(0.9)) placeHouse(x + rng.range(-1.5, 1.5), z + s * rng.range(11, 15), s > 0 ? 0 : Math.PI, rng.range(8, 12), rng.range(8, 11), rng.range(4.5, 7));
    }
    // streetlights along every street (sodium orange, a few white LEDs downtown)
    for (const z of streetsZ) for (let x = T.x0; x < T.x1; x += 30) { if (rng.chance(0.15)) continue; const c = Math.abs(x + 20) < 160 && rng.chance(0.4) ? [0.9, 0.95, 1.0] : [1.0, 0.7, 0.38]; L.push([x, ovH(x, z) + 7, z + 6, ...c, 1.25, 1]); }
    for (const x of streetsX) for (let z = T.z0; z > T.z1; z -= 32) { if (rng.chance(0.2)) continue; L.push([x + 5, ovH(x, z) + 7, z, 1.0, 0.7, 0.38, 1.15, 1]); }
    for (let z = T.z0 + 60; z > T.z1 - 200; z -= 26) L.push([-20 + 7, ovH(-20, z) + 8, z, 1.0, 0.74, 0.42, 1.4, 1]);   // the main road (it climbs out of the valley north)
    // downtown: blocks of flats with many lit windows, a church spire, a lit sign
    const center = { x: 40, z: -470 };
    for (let k = 0; k < 9; k++) {
      const x = center.x + rng.range(-160, 160), z = center.z + rng.range(-110, 110), w = rng.range(18, 32), d = rng.range(12, 18), h = rng.range(12, 24), y = ovH(x, z);
      items.push({ x, y, z, ry: 0, w, d, h, c: '#3d4048', flat: true });
      for (let fy = 3; fy < h; fy += 3) for (let fx = -w / 2 + 2; fx < w / 2 - 1; fx += 3.2) if (rng.chance(0.42)) L.push([x + fx, y + fy, z + d / 2 + 0.2, ...warm(), rng.range(0.55, 0.9), 0]);
    }
    { const x = center.x - 60, z = center.z + 40, y = ovH(x, z); items.push({ x, y, z, ry: 0, w: 12, d: 24, h: 11, c: '#4a463f' }); items.push({ x, y, z: z + 13, ry: 0, w: 5, d: 5, h: 26, c: '#4a463f', flat: true });
      L.push([x, y + 24, z + 15.6, 1.0, 0.9, 0.7, 1.1, 0]); this.spire = [x, y + 26, z + 13]; }
    // instanced houses + roofs
    const n = items.length, hm = new THREE.InstancedMesh(house, Mat.std('#ffffff', { roughness: 0.95 }), n), rm = new THREE.InstancedMesh(roof, Mat.std('#ffffff', { roughness: 0.9 }), n);
    const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), cc = new THREE.Color();
    items.forEach((it, i) => {
      q.setFromEuler(e.set(0, it.ry, 0)); M4.compose(new THREE.Vector3(it.x, it.y, it.z), q, new THREE.Vector3(it.w, it.h, it.d)); hm.setMatrixAt(i, M4);
      cc.set(it.c); hm.setColorAt(i, cc);
      M4.compose(new THREE.Vector3(it.x, it.y + (it.flat ? -100 : 0), it.z), q, new THREE.Vector3(it.w * 1.08, it.h * 0.5, it.d * 1.08)); rm.setMatrixAt(i, M4);
      cc.set(it.c).multiplyScalar(0.7); rm.setColorAt(i, cc);
    });
    hm.receiveShadow = rm.receiveShadow = true;
    this.root.add(hm, rm);
    // roads as faint grey strips
    const road = Mat.std('#24262a', { roughness: 1 });
    for (const z of streetsZ) this.B.add(Geo.flat(T.x0, T.x1, z - 4, z + 4, OV.valley + 0.4, 10), road, null, { noShadow: true });
    this.B.add(Geo.flat(-26, -14, T.z1 - 200, T.z0 + 80, OV.valley + 0.45, 10), road, null, { noShadow: true });
    // the cars: head- and tail-lights travelling the main road and two streets (they stop later — see FILM)
    this.cars = [];
    for (let k = 0; k < 14; k++) {
      const onMain = k < 7, dir = k % 2 ? 1 : -1;
      this.cars.push({ main: onMain, dir, z0: onMain ? rng.range(T.z1, T.z0) : rng.pick(streetsZ), x0: onMain ? -20 + dir * 2 : rng.range(T.x0, T.x1), v: rng.range(9, 14), stop: rng.range(13, 19) });
    }
  }

  _platform() {
    const B = this.B, concrete = Mat.std('#7d7a72', { roughness: 0.95 }), metal = Mat.std('#1d2522', { roughness: 0.5, metalness: 0.5 }), wood = Mat.std('#5a4430', { roughness: 0.9 });
    B.box(16, 0.4, 9, 0, -0.2, 0.9, concrete);
    B.box(16.2, 0.25, 0.3, 0, 0.05, OV.railZ - 0.1, Mat.std('#6f6c65', { roughness: 0.95 }));          // the kerb at the edge
    // railing: posts, a top rail and a middle rail; short returns at the ends
    for (let x = -7.5; x <= 7.51; x += 1.5) B.box(0.06, 1.05, 0.06, x, 0.52, OV.railZ, metal);
    for (const y of [1.05, 0.55]) B.add(new THREE.CylinderGeometry(0.025, 0.025, 15.1, 8), metal, Geo.matrix(0, y, OV.railZ, 0, 0, Math.PI / 2));
    for (const sx of [-1, 1]) { for (let z = OV.railZ; z <= 1.01; z += 1.33) B.box(0.06, 1.05, 0.06, sx * 7.5, 0.52, z, metal); for (const y of [1.05, 0.55]) B.add(new THREE.CylinderGeometry(0.025, 0.025, 4.0, 8), metal, Geo.matrix(sx * 7.5, y, OV.railZ + 2.0, Math.PI / 2, 0, 0)); }
    // a bench facing the view
    { const x = -3.6, z = 1.6; for (const dx of [-0.75, 0.75]) B.box(0.06, 0.45, 0.5, x + dx, 0.22, z, metal); for (let k = 0; k < 4; k++) B.box(1.8, 0.04, 0.09, x, 0.46, z - 0.18 + k * 0.12, wood); for (let k = 0; k < 2; k++) B.box(1.8, 0.09, 0.03, x, 0.62 + k * 0.14, z + 0.24, wood); this.bench = { x, z }; }
    // a coin-operated binocular viewer
    { const x = 4.4, z = -2.35; B.add(new THREE.CylinderGeometry(0.07, 0.12, 1.1, 10), metal, Geo.matrix(x, 0.55, z)); B.box(0.36, 0.22, 0.26, x, 1.2, z, Mat.std('#2f5f4a', { roughness: 0.5, metalness: 0.3 }));
      for (const dx of [-0.07, 0.07]) B.add(new THREE.CylinderGeometry(0.045, 0.05, 0.2, 10), metal, Geo.matrix(x + dx, 1.22, z - 0.2, Math.PI / 2, 0, 0)); this.viewer = { x, z }; }
    // a lamp post (warm light on the platform) and a bin, a sign
    { const x = 6.6, z = 3.4; B.add(new THREE.CylinderGeometry(0.05, 0.08, 3.6, 8), metal, Geo.matrix(x, 1.8, z)); B.box(0.34, 0.2, 0.34, x, 3.65, z, metal);
      const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 0.26), new THREE.MeshBasicMaterial({ color: '#ffd9a0' })); bulb.position.set(x, 3.53, z); this.root.add(bulb); this.lampPos = [x, 3.4, z]; }
    B.add(new THREE.CylinderGeometry(0.24, 0.22, 0.75, 10), Mat.std('#2a3a30', { roughness: 0.6 }), Geo.matrix(-6.6, 0.37, 3.2));
    { const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.55), new THREE.MeshStandardMaterial({ map: Tex.label([['RIDGE VIEW', 46], ['LOOKOUT', 40]], { w: 256, h: 128, bg: '#3b2a1c', fg: '#e8dcc2' }) }));
      sign.position.set(-6.0, 0.95, OV.railZ + 0.1); sign.rotation.y = 0; this.root.add(sign); B.box(0.05, 0.7, 0.05, -6.0, 0.35, OV.railZ + 0.08, metal); }
    // the path down to the parking lot
    B.add(Geo.flat(-1.2, 1.2, 5.3, 24, -0.0, 2), Mat.std('#34322e', { roughness: 1 }), Geo.matrix(0, 0, 0), { noShadow: true });
  }

  // pines framing the view, broad trees in the park behind
  _trees() {
    const rng = this.rng.fork(4), B = this.B, bark = Mat.std('#2a2018', { roughness: 1 }), pine = Mat.std('#16241c', { roughness: 1 }), leaf = Mat.std('#1c2a1c', { roughness: 1 });
    const pineAt = (x, z, h) => { const y = ovH(x, z); B.add(new THREE.CylinderGeometry(0.12, 0.2, h * 0.4, 6), bark, Geo.matrix(x, y + h * 0.2, z));
      for (let k = 0; k < 4; k++) { const r = h * (0.32 - k * 0.06), hh = h * 0.36; B.add(new THREE.ConeGeometry(r, hh, 7), pine, Geo.matrix(x, y + h * (0.32 + k * 0.17), z, 0, rng.range(0, 3), 0)); } };
    const broadAt = (x, z, h) => { const y = ovH(x, z); B.add(new THREE.CylinderGeometry(0.16, 0.26, h * 0.5, 6), bark, Geo.matrix(x, y + h * 0.25, z));
      for (let k = 0; k < 3; k++) B.add(new THREE.IcosahedronGeometry(h * rng.range(0.22, 0.3), 0), leaf, Geo.matrix(x + rng.range(-0.8, 0.8), y + h * (0.62 + k * 0.1), z + rng.range(-0.8, 0.8), rng.range(0, 3), rng.range(0, 3), 0)); };
    for (const [x, z, h] of [[-11.5, 4.5, 9], [-14.5, 9.0, 11], [-10.8, 12.5, 8], [12.0, 5.0, 10], [14.5, 9.6, 12], [11.5, 13.0, 8.5], [-19, 6, 9], [19, 7, 10]]) pineAt(x, z, h);
    for (const [x, z, h] of [[-7, 13, 7], [7.5, 15, 7.5], [-15, 18, 8], [16, 20, 8], [-3, 46, 7], [12, 47, 8], [-20, 32, 9], [22, 33, 8]]) broadAt(x, z, h);
    for (let k = 0; k < 40; k++) { const a = rng.range(Math.PI * 0.62, Math.PI * 1.38), r = rng.range(28, 80); pineAt(Math.sin(a) * r, -Math.cos(a) * r, rng.range(7, 12)); }
  }

  // the parking lot behind the park: a few cars (two with their lights on), the lot's own lamps
  _lot() {
    const L = OV.lot, B = this.B, y = L.y;
    B.add(Geo.flat(L.x0, L.x1, L.z0, L.z1, y + 0.02, 6), Mat.std('#26282c', { roughness: 1 }), null, { noShadow: true });
    for (let x = L.x0 + 2; x < L.x1; x += 2.8) B.box(0.1, 0.01, 4.5, x, y + 0.04, L.z0 + 3, Mat.std('#9a988f', { roughness: 1 }));
    this.factory = new VehicleFactory();
    this.lotCars = [];
    [['sedan', '#3a4a5a', -5.6], ['suv', '#6a6a66', -2.8], ['hatch', '#7a2a24', 3.0], ['sedan', '#c8c6c0', 8.6]].forEach(([type, c, x], i) => {
      const v = this.factory.build(type, c); v.group.position.set(x, y, L.z0 + 3); v.group.rotation.y = Math.PI / 2; this.root.add(v.group); this.lotCars.push(v);
    });
    for (const x of [L.x0 - 1, L.x1 + 1]) { B.add(new THREE.CylinderGeometry(0.06, 0.09, 5, 8), Mat.std('#2a2e2c'), Geo.matrix(x, y + 2.5, L.z1)); this.lightPts.push([x, y + 5, L.z1, 1.0, 0.75, 0.45, 1.3, 1]); }
  }

  // every window, porch, streetlight and the lot's lamps as one points cloud (size and brightness per light), plus soft
  // halos on the streetlights; the cars' lights are another (moving) cloud
  _lights() {
    const P = this.lightPts, n = P.length, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), sz = new Float32Array(n), kind = new Float32Array(n);
    P.forEach((q, i) => { pos.set([q[0], q[1], q[2]], i * 3); col.set([q[3], q[4], q[5]], i * 3); sz[i] = q[6]; kind[i] = q[7]; });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aCol', new THREE.BufferAttribute(col, 3)); g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1)); g.setAttribute('aKind', new THREE.BufferAttribute(kind, 1));
    this.lightMat = new THREE.ShaderMaterial({
      uniforms: { uPx: { value: 1 }, uGain: { value: 1 }, uOn: { value: 1 } },
      vertexShader: /* glsl */`
        attribute vec3 aCol; attribute float aSize; attribute float aKind; uniform float uPx, uGain, uOn; varying vec3 vCol; varying float vHalo;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
          float d = -mv.z, haze = exp(-d * 0.00042);
          float s = aSize * (aKind > 0.5 ? 2.6 : 1.6) * uPx * clamp(260.0 / d, 0.45, 3.0);
          vHalo = aKind;
          vCol = aCol * (aKind > 0.5 ? 2.2 : 1.5) * uGain * haze * uOn;
          gl_PointSize = max(1.0, s);
        }`,
      fragmentShader: /* glsl */`varying vec3 vCol; varying float vHalo; void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r2 = dot(q, q); if (r2 > 1.0) discard;
        float core = exp(-r2 * 7.0), halo = exp(-r2 * 1.6) * 0.18 * vHalo; gl_FragColor = vec4(vCol * (core + halo), 1.0); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.lights = new THREE.Points(g, this.lightMat); this.lights.frustumCulled = false; this.root.add(this.lights);
    // cars
    const cn = this.cars.length * 2, cg = new THREE.BufferGeometry();
    cg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cn * 3), 3).setUsage(THREE.DynamicDrawUsage));
    const cc = new Float32Array(cn * 3); this.cars.forEach((c, i) => { cc.set([1, 0.95, 0.85], i * 6); cc.set([1, 0.15, 0.1], i * 6 + 3); });
    cg.setAttribute('aCol', new THREE.BufferAttribute(cc, 3)); cg.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(cn).fill(1.1), 1)); cg.setAttribute('aKind', new THREE.BufferAttribute(new Float32Array(cn).fill(0), 1));
    this.carPts = new THREE.Points(cg, this.lightMat); this.carPts.frustumCulled = false; this.root.add(this.carPts);
  }

  // per frame: the cars drive (and stop, one by one, as people pull over to look)
  update(t) {
    const p = this.carPts.geometry.attributes.position.array, T = OV.town, span = T.z0 - T.z1 + 300;
    this.cars.forEach((c, i) => {
      const tt = Math.min(t, c.stop) + Math.max(0, Math.min(1.5, t - c.stop)) * 0.5 * (1 - Math.max(0, Math.min(1.5, t - c.stop)) / 3);   // (eases to a stop)
      let x, z, dx = 0, dz = 0;
      if (c.main) { z = T.z1 - 150 + ((c.z0 - (T.z1 - 150) + c.dir * c.v * tt) % span + span) % span; x = c.x0; dz = c.dir; }
      else { const w = T.x1 - T.x0; x = T.x0 + ((c.x0 - T.x0 + c.dir * c.v * tt) % w + w) % w; z = c.z0 + c.dir * 2; dx = c.dir; }
      const y = ovH(x, z) + 0.8;
      p.set([x + dx * 2.2, y, z + dz * 2.2], i * 6); p.set([x - dx * 2.2, y, z - dz * 2.2], i * 6 + 3);
    });
    this.carPts.geometry.attributes.position.needsUpdate = true;
  }
}
