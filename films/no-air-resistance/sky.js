/* =====================================================================
   SKY — the cut-away "MEANWHILE, 9 KM UP" (its own scene, shown through
   FILM.view): a ride down beside one piece of the storm cloud's ice
   (NR_STONE). Everything solid up here (every hailstone, every grain of
   graupel and snow) has been falling since the change, from rest (a
   simplification: in the updraft small ice was rising), all at
   the same rate: so around you the ice hangs perfectly still, while the
   cloud itself (water droplets, which still ride the air) streams up past
   at 370 → 650 km/h. You fall past the sunlit side of the storm's tower,
   down onto a lower shoulder of cloud, and into it: grey, droplets
   streaming up, a lightning flash that shows the still stones round you.
   The scene is built in the falling frame: the hero stone sits at the
   origin, and the cloud (fixed in the air) is drawn at its altitude minus
   the stone's, so the numbers stay small.
   ===================================================================== */

// the cloud round the fall line (altitudes in metres): the tower's sunlit wall to your right, the shoulder you fall into
const NR_SKY = {
  wallX: 46, wall: [7500, 9900], shoulder: 8455, sun: [-0.55, 0.42, 0.72],
  bolt: [18.9, 19.12, 19.62],                  // the lightning strokes (story s), inside the cloud
};

class NrAerial {
  constructor(app) {
    const sc = new THREE.Scene(); this.scene = sc; this.app = app;
    this.cam = new THREE.PerspectiveCamera(60, 9 / 16, 0.02, 40000); this.cam.rotation.order = 'YXZ'; sc.add(this.cam);
    sc.fog = new THREE.FogExp2(new THREE.Color('#c3d0dc'), 0.00005);
    sc.background = new THREE.Color('#c3d0dc');
    this.L = new THREE.Vector3(...NR_SKY.sun).normalize();
    this._dome();
    const sun = new THREE.DirectionalLight('#fff3e2', 3.0); sun.position.copy(this.L).multiplyScalar(100); sc.add(sun, sun.target); this.sun = sun;
    this.hemi = new THREE.HemisphereLight('#a9c4e6', '#8d8f94', 0.6); sc.add(this.hemi);
    const rim = new THREE.DirectionalLight('#e2ecff', 2.4); rim.position.set(-0.35, 0.55, -1); sc.add(rim, rim.target); this.rim = rim;
    this.flashL = new THREE.PointLight('#dfe8ff', 0, 400, 1.2); this.flashL.position.set(26, 14, -40); sc.add(this.flashL);
    this._camTracks();
    this._stones();
    this._cloud();
    this.puffs = new BillboardSystem(sc, 5200, false); this.puffs.uniforms.uLight.value = 1.0;
    this.far = new BillboardSystem(sc, 900, false); this.far.uniforms.uLight.value = 1.0; this.far.mesh.renderOrder = 3;
    this.glint = new BillboardSystem(sc, 1400, true); this.glint.mesh.renderOrder = 8;
    this.wisp = new StreakSystem(sc, 1500); this.wisp.mesh.material.blending = THREE.NormalBlending; this.wisp.mesh.renderOrder = 7;
    this.boltC = new StreakSystem(sc, 64); this.boltC.mesh.renderOrder = 9;
    this._fr = new THREE.Frustum(); this._pm = new THREE.Matrix4(); this._sp = new THREE.Sphere(); this._v = new THREE.Vector3();
    this._hemiSky = new THREE.Color('#a9c4e6'); this._hemiGr = new THREE.Color('#8d8f94'); this._hemiIn = new THREE.Color('#e6eaee');
    this._fogOut = new THREE.Color('#9fb3c9'); this._fogIn = new THREE.Color('#878e97'); this._fogDeep = new THREE.Color('#596069'); this._fogBolt = new THREE.Color('#e4ebff');
  }

  // the sky: deep blue up here, a pale horizon (3° below level from 9 km), the land far below in haze; the sun
  _dome() {
    this.domeU = { uSun: { value: this.L }, uFog: { value: new THREE.Color() }, uIn: { value: 0 } };
    const mat = new THREE.ShaderMaterial({ uniforms: this.domeU, side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
      fragmentShader: `uniform vec3 uSun, uFog; uniform float uIn; varying vec3 vDir;
        float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float n2(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f); return mix(mix(h2(i), h2(i + vec2(1, 0)), u.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), u.x), u.y); }
        void main(){ vec3 d = normalize(vDir); float h = d.y + 0.053;
          vec3 col = mix(vec3(0.5, 0.64, 0.82), vec3(0.05, 0.15, 0.44), pow(clamp(h, 0.0, 1.0), 0.33));
          // below the horizon: fields and towns 9 km down, through a lot of haze
          if (h < 0.012) { vec2 g = d.xz / max(-d.y, 0.06) * 9.0; float f = n2(g * 0.9) * 0.6 + n2(g * 3.7) * 0.4;
            vec3 land = mix(vec3(0.33, 0.39, 0.3), vec3(0.47, 0.45, 0.38), f); float haze = 1.0 - exp(-0.32 / max(-d.y, 0.03));
            col = mix(col, mix(land, vec3(0.5, 0.58, 0.69), clamp(haze, 0.0, 0.92)), smoothstep(0.0, -0.012, h)); }
          float s = max(dot(d, uSun), 0.0); col += vec3(1.0, 0.94, 0.82) * (pow(s, 8.0) * 0.22 + pow(s, 900.0) * 2.0);
          gl_FragColor = vec4(mix(col, uFog, uIn), 1.0); }` });
    const m = new THREE.Mesh(new THREE.SphereGeometry(20000, 48, 24), mat); m.frustumCulled = false; m.renderOrder = -10; this.scene.add(m); this.dome = m;
  }

  // the camera, in the falling frame (the hero stone at the origin): close on it, a slow move round it so the still
  // stones show their depth, a look down at the cloud coming up, into it, and a slow push in
  _camTracks() {
    const K = (keys) => new SmoothTrack(keys);
    this.tk = {
      az: K([[14.2, -20], [15.0, -34], [15.8, -46], [16.5, -52], [17.2, -36], [18.4, -22], [20.4, -16]]),
      d: K([[14.2, 0.36], [15.0, 0.44], [15.8, 0.5], [16.5, 0.42], [17.2, 0.42], [18.4, 0.38], [20.4, 0.3]]),
      h: K([[14.2, -0.2], [15.0, -0.08], [15.8, 0.3], [16.5, 0.4], [17.2, 0.12], [18.4, 0.06], [20.4, 0.04]]),
      // where you look: past the stone (azimuth offset, deg), and how far down (deg)
      la: K([[14.2, -6], [15.0, -4], [15.8, 0], [16.5, -2], [17.2, 0], [18.4, 3], [20.4, 2]]),
      pd: K([[14.2, 7], [15.0, 3], [15.8, -20], [16.4, -26], [17.0, -10], [17.6, -2], [18.4, 0], [20.4, 0]]),
      fov: K([[14.2, 54], [15.0, 58], [15.8, 66], [16.4, 70], [17.2, 60], [18.4, 54], [20.4, 48]]),
    };
  }
  camAt(S, out) {
    const T = this.tk, a = MathX.deg(T.az.value(S)), d = T.d.value(S);
    return out.set(Math.sin(a) * d, T.h.value(S), Math.cos(a) * d);
  }

  /* ---------------- the ice round you: still (it all falls together), each piece keeping the slow spin it had ---------------- */
  _stoneGeo(detail, seed, lump) {
    const g = new THREE.IcosahedronGeometry(1, detail), p = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const k = Math.round(v.x * 997) * 7 + Math.round(v.y * 991) * 13 + Math.round(v.z * 983) * 29 + seed;
      v.multiplyScalar(1 + lump * (hash1(k) - 0.5)); v.y *= 0.86; p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals(); return g;
  }
  _stones() {
    const mat = new THREE.MeshStandardMaterial({ color: '#e3edf6', roughness: 0.32, metalness: 0.05, flatShading: true, emissive: '#26323f', emissiveIntensity: 0.6 });
    this.stoneMat = mat;
    // the hero: a 4 cm hailstone (its layers: a milky core in clear ice)
    const hero = new THREE.Group();
    const shell = new THREE.Mesh(this._stoneGeo(2, 5, 0.16), new THREE.MeshStandardMaterial({ color: '#dce9f5', roughness: 0.22, metalness: 0.15, flatShading: true, emissive: '#22303e', emissiveIntensity: 0.5 }));
    const core = new THREE.Mesh(this._stoneGeo(1, 9, 0.22), new THREE.MeshStandardMaterial({ color: '#f4f7fa', roughness: 0.6, flatShading: true, emissive: '#303a44', emissiveIntensity: 0.4 }));
    core.scale.setScalar(0.62); hero.add(shell, core); hero.scale.setScalar(0.02); this.scene.add(hero); this.hero = hero;
    // the others: small hail and graupel, 0.8–3.6 cm, from 25 cm to 14 m away (none where the camera passes)
    const r = new RNG(5151), path = [];
    for (let S = NR.sky[0]; S <= NR.sky[1]; S += 0.1) path.push(this.camAt(S, new THREE.Vector3()));
    this.st = [];
    for (let tries = 0; this.st.length < 460 && tries < 4000; tries++) {
      const rr = 0.25 + 13.75 * Math.pow(r.next(), 1.7), th = r.range(0, Math.PI * 2), cz = r.range(-1, 1), sz = Math.sqrt(1 - cz * cz);
      const p = new THREE.Vector3(Math.cos(th) * sz * rr, cz * rr, Math.sin(th) * sz * rr), s = 0.004 + 0.014 * Math.pow(r.next(), 2.2);
      if (path.some((q) => q.distanceTo(p) < 0.1 + s * 3) || p.length() < 0.12) continue;
      const ax = new THREE.Vector3(r.range(-1, 1), r.range(-1, 1), r.range(-1, 1)).normalize();
      this.st.push({ p, s, ax, w: r.range(0.15, 1.3), ph: r.range(0, 6.3) });
    }
    const im = new THREE.InstancedMesh(this._stoneGeo(1, 3, 0.3), mat, this.st.length); im.frustumCulled = false; this.scene.add(im); this.stoneM = im;
    // fine ice (snow, graupel): glints hanging still in the light
    this.gl = [];
    for (let i = 0; i < 1300; i++) { const rr = 1.2 + 38 * Math.pow(r.next(), 1.4), th = r.range(0, 6.283), cz = r.range(-1, 1), sz = Math.sqrt(1 - cz * cz); this.gl.push([Math.cos(th) * sz * rr, cz * rr, Math.sin(th) * sz * rr, r.range(0, 6.3), r.range(0.3, 1.4), r.range(0.6, 1.4)]); }
    this._q = new THREE.Quaternion(); this._m = new THREE.Matrix4(); this._sv = new THREE.Vector3(); this._s3 = new THREE.Vector3();
  }

  /* ---------------- the cloud (water droplets: it stays up with the air) ---------------- */
  // drawn as heaps of faceted white lumps (lit by the sun, so they show their form) softened by a few soft puffs:
  // the tower's wall to your right, the shoulder's domed turrets under you; far towers of other storms as soft puffs.
  // lumps [x, altitude, z, radius, y-squash, spin]
  _cloud() {
    const r = new RNG(7171), M = (this.lumps = []), F = (this.fc = []), X = NR_SKY.wallX;
    const fb = (x, y, s) => 0.5 * noise1(x * 0.9 + y * 0.37, s) + 0.3 * noise1(y * 1.7 - x * 0.6, s + 3) + 0.2 * noise1(x * 3.1 + y * 2.3, s + 7);
    // the wall: a round tower (radius ~500 m) whose near side passes X m to your right, its face lumpy like a cauliflower
    const xw = (y, z) => X + (z + 40) ** 2 / 1000 + 12 * fb(z / 80, y / 90, 11) + 5 * fb(z / 30, y / 34, 17);
    this.wallAt = xw;
    for (let z = -760; z < 560; ) {
      const near = Math.abs(z + 50) < 220, sp = near ? 11 : 24;
      for (let y = NR_SKY.wall[0]; y < NR_SKY.wall[1]; y += sp * r.range(0.75, 1.15)) {
        const zz = z + r.range(-0.4, 0.4) * sp, R = sp * r.range(0.75, 1.25);
        M.push([xw(y, zz) + R * 0.55, y, zz, R, r.range(0.8, 1.05), r.range(0, 6.3)]);
      }
      z += sp * r.range(0.75, 1.15);
    }
    // the shoulder: domed turrets sticking out from the tower's foot; the top of one is right under you
    const domes = [[4, -10, 90, 64]];
    for (let i = 0; i < 30; i++) domes.push([r.range(-260, 40), r.range(-340, 200), r.range(45, 130), r.range(25, 80)]);
    const top0 = (x, z) => { let h = -45; for (const [cx, cz, R, Hh] of domes) { const q = 1 - ((x - cx) ** 2 + (z - cz) ** 2) / (R * R); if (q > 0) h = Math.max(h, Hh * Math.sqrt(q) - 10); } return h; };
    const off = top0(0, 0), yt = (x, z) => NR_SKY.shoulder + top0(x, z) - off;
    this.shoulderAt = yt;
    for (let x = -300; x < X + 30; ) {
      for (let z = -380; z < 250; ) {
        const sp = Math.abs(x) < 170 && Math.abs(z) < 170 ? 12 : 20, xx = x + r.range(-0.4, 0.4) * sp, R = sp * r.range(0.8, 1.3), y = yt(xx, z);
        M.push([xx, y - R * 0.55, z, R, r.range(0.7, 0.95), r.range(0, 6.3)]);
        z += sp * r.range(0.75, 1.15);
      }
      x += 12 * r.range(0.8, 1.2);
    }
    // far towers of other storms (3–15 km away, on your left where the sky is clear): soft puffs [x, alt, z, size, rot, shade]
    for (let c = 0; c < 12; c++) {
      const a = r.range(-0.15, 1.25), dist = r.range(3500, 15000), cx = -Math.sin(a) * dist, cz = -Math.cos(a) * dist * (r.next() < 0.5 ? 1 : -0.6), R = r.range(500, 1500), top = r.range(5000, 10500);
      for (let i = 0; i < 22; i++) { const q = r.range(0, 6.28), dd = Math.sqrt(r.next()) * R, hh = (1 - dd / R) * (top - 2600) * r.range(0.3, 1); F.push([cx + Math.cos(q) * dd, 2600 + hh, cz + Math.sin(q) * dd, r.range(0.3, 0.6) * R, r.range(0, 6.3), 0.7 + 0.35 * (hh / (top - 2600))]); }
    }
    // the lumps: one instanced faceted ball (a little irregular), white, rough
    const mat = new THREE.MeshStandardMaterial({ color: '#f6f8fa', roughness: 1, metalness: 0, flatShading: true, emissive: '#53606f', emissiveIntensity: 0.16 });
    this.lumpMat = mat;
    const im = new THREE.InstancedMesh(this._stoneGeo(2, 21, 0.12), mat, 6500); im.frustumCulled = false; im.count = 0; this.scene.add(im); this.lumpM = im;
  }

  // how far into the cloud you are (m; < 0 above its top)
  depth(S) { return this.shoulderAt(0, 0) - NR_STONE.alt(S); }

  update(S) {
    const alt = NR_STONE.alt(S), v = NR_STONE.speed(S), D = this.depth(S), inK = MathX.smooth(D, -30, 14), deepK = MathX.smooth(D, 40, 420);
    // lightning (inside the cloud): a few strokes, each a bright flicker
    let bolt = 0;
    for (const t of NR_SKY.bolt) { const u = S - t; if (u >= 0 && u < 0.35) bolt = Math.max(bolt, (t === NR_SKY.bolt[2] ? 0.5 : 1) * Math.exp(-u / 0.06) * (0.75 + 0.25 * Math.sin(u * 160))); }
    this.bolt = bolt;
    // the light: full sun outside; inside, an even grey that darkens deeper down
    const sc = this.scene, fogC = sc.fog.color;
    fogC.copy(this._fogOut).lerp(this._fogIn, inK).lerp(this._fogDeep, deepK * inK).lerp(this._fogBolt, bolt * inK * 0.85);
    sc.fog.density = 0.00005 + 0.042 * inK;
    sc.background.copy(fogC); this.domeU.uFog.value.copy(fogC); this.domeU.uIn.value = inK;
    this.sun.intensity = 3.0 * (1 - inK) + 1.5 * inK * (1 - 0.5 * deepK); this.hemi.intensity = 0.6 + 1.0 * inK - 0.4 * deepK * inK + 0.2 * bolt * inK;
    this.hemi.color.copy(this._hemiSky).lerp(this._hemiIn, inK); this.hemi.groundColor.copy(this._hemiGr).lerp(this._hemiIn, inK * 0.8);
    this.flashL.intensity = 90 * bolt * inK;
    this.stoneMat.emissiveIntensity = 0.6 + 0.3 * inK;
    // the hero stone and the others: still, spinning slowly
    const H = this.hero; H.quaternion.setFromAxisAngle(this._sv.set(0.3, 1, 0.2).normalize(), 0.35 * (S - NR.loss)); H.position.set(0, 0, 0);
    this.st.forEach((s, i) => { this._q.setFromAxisAngle(s.ax, s.ph + s.w * (S - NR.loss)); this._m.compose(s.p, this._q, this._sv.setScalar(s.s)); this.stoneM.setMatrixAt(i, this._m); });
    this.stoneM.instanceMatrix.needsUpdate = true;
    this._camera(S);
    const C = this.cam, cp = C.position;
    this._pm.multiplyMatrices(C.projectionMatrix, C.matrixWorldInverse); this._fr.setFromProjectionMatrix(this._pm);
    // the glints of fine ice (sunlit outside; faint in the cloud, bright in a flash)
    const G = this.glint; G.begin(null);
    for (const [x, y, z, ph, w, s] of this.gl) {
      const tw = Math.pow(Math.max(0, Math.sin(ph + S * w * 2.1)), 10) * 0.8 + 0.12, a = tw * (0.9 * (1 - inK) + 0.25 * inK + 1.5 * bolt * inK) * Math.exp(-0.035 * Math.hypot(x - cp.x, y - cp.y, z - cp.z) * (1 + 2 * inK));
      if (a > 0.01) G.push(x, y, z, 0.035 * s, ph, a, 1, 1.0, 0.97, 0.92);
    }
    G.end();
    // the cloud, drawn where it is relative to you (altitude − yours); soft puffs on the lumps nearest the edge of sight
    const vis = (x, y, z, s) => { this._sp.center.set(x, y, z); this._sp.radius = s; return this._fr.intersectsSphere(this._sp); };
    const LM = this.lumpM, Pf = this.puffs; let n = 0, dmin = 1e9;
    const list = this._list || (this._list = []); list.length = 0;
    for (let i = 0; i < this.lumps.length; i++) {
      const c = this.lumps[i], y = c[1] - alt; if (y > 700 || y < -1300) continue;
      if (!vis(c[0], y, c[2], c[3] * 1.3)) continue;
      { const dx = c[0] - cp.x, dy = y - cp.y, dz = c[2] - cp.z, dd = Math.sqrt(dx * dx + dy * dy + dz * dz); dmin = Math.min(dmin, dd - c[3]); if (dd < c[3] * 1.15) continue; }      // (you pass through it: the fog covers that)
      if (n < 6500) { this._q.setFromAxisAngle(this._yAxis || (this._yAxis = new THREE.Vector3(0, 1, 0)), c[5]); this._m.compose(this._sv.set(c[0], y, c[2]), this._q, this._s3.set(c[3], c[3] * c[4], c[3])); LM.setMatrixAt(n++, this._m); }
      if (i % 3 === 0) { const dx = c[0] - cp.x, dy = y - cp.y, dz = c[2] - cp.z, d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1, k = c[3] * 0.7 / d;
        list.push([d * d, c[0] - dx * k, y + c[3] * 0.3 - dy * k, c[2] - dz * k, c[3] * 2.3, c[5]]); }
    }
    LM.count = n; LM.instanceMatrix.needsUpdate = true;
    // skimming a lump's surface: a white-out (the fog thickens for a moment)
    const wk = MathX.smooth(-dmin, -9, 1) * (1 - inK);
    if (wk > 0.001) { sc.fog.density += 0.05 * wk; sc.fog.color.lerp(this._fogWhite || (this._fogWhite = new THREE.Color('#e9eef3')), wk); sc.background.copy(sc.fog.color); this.domeU.uFog.value.copy(sc.fog.color); this.domeU.uIn.value = Math.max(inK, wk); }
    list.sort((a, b) => b[0] - a[0]);
    Pf.begin(sc.fog);
    const lit = 1 - 0.3 * inK + 0.6 * bolt;
    for (const [d2, x, y, z, s, rot] of list) {
      const d = Math.sqrt(d2), near = MathX.smooth(d, s * 0.35, s * 0.9);
      if (near > 0.01) Pf.push(x, y, z, s, rot, 0.26 * near, 0.97 * lit, 1.0, 1.0, 1.02);
    }
    Pf.end();
    const Fa = this.far; Fa.begin(sc.fog);
    if (inK < 0.99) for (const c of this.fc) Fa.push(c[0], c[1] - alt, c[2], c[3], c[4], 0.9 * (1 - inK), c[5], 1.0, 0.99, 1.0);
    Fa.end();
    // inside: the droplets stream up past you at your speed (a 1/30 s smear), in a box that wraps round you
    const W = this.wisp; W.begin();
    if (inK > 0.01) {
      const bx = 26, by = 40, bz = 26, sh = 1 / 30, wrap = (q, s) => q - s * Math.floor(q / s), rise = 0.5 * NR_G * (S - NR.loss) ** 2;
      for (let i = 0; i < 1100; i++) {
        const x = cp.x - bx / 2 + wrap(hash1(i * 5 + 1) * 977 - cp.x + bx / 2, bx), z = cp.z - bz / 2 + wrap(hash1(i * 5 + 2) * 977 - cp.z + bz / 2, bz), y = cp.y - by / 2 + wrap(hash1(i * 5 + 3) * 977 + rise, by);
        const dd = Math.hypot(x - cp.x, y - cp.y, z - cp.z); if (dd < 1.0) continue;
        const a = (0.09 + 0.12 * hash1(i * 5 + 4)) * inK * MathX.smooth(dd, 1.0, 3.5) * (1 + 1.2 * bolt), c = (0.86 + 0.1 * hash1(i * 5 + 5)) * (0.75 + 0.6 * bolt) * (1 - 0.25 * deepK);
        W.push(x, y - v * sh * 0.5, z, x, y + v * sh * 0.5, z, c, c * 1.01, c * 1.04, a * 0.8, 0.08 + 0.35 * hash1(i * 5 + 6));
      }
    }
    W.end();
    // ... and its channel, glimpsed through the cloud for a frame or two
    const Bc = this.boltC; Bc.begin();
    if (bolt > 0.25 && inK > 0.5) {
      const k = NR_SKY.bolt.findIndex((t) => S >= t && S < t + 0.35), sd = 31 + k * 17;
      let x = 8 + 5 * hash1(sd), y = 55, z = -34 + 5 * hash1(sd + 1);
      for (let i = 0; i < 26; i++) { const nx = x + (hash1(sd * 7 + i) - 0.5) * 7, ny = y - 4.6, nz = z + (hash1(sd * 11 + i) - 0.5) * 5; Bc.push(x, y, z, nx, ny, nz, 0.85, 0.9, 1.0, 0.9 * bolt, 0.35); Bc.push(x, y, z, nx, ny, nz, 0.6, 0.7, 1.0, 0.3 * bolt, 1.6); x = nx; y = ny; z = nz; }
    }
    Bc.end();
  }

  _camera(S) {
    const C = this.cam, T = this.tk, p = this.camAt(S, C.position);
    // aim at the stone, then turn by the framing offsets (la: + turns left; pd: + looks up)
    const yaw0 = Math.atan2(p.x, p.z), pit0 = Math.atan2(-p.y, Math.hypot(p.x, p.z));
    C.rotation.set(pit0 + MathX.deg(T.pd.value(S)), yaw0 + MathX.deg(T.la.value(S)), 0.012 * Math.sin(S * 1.9) + 0.006 * noise1(S * 3, 81), 'YXZ');
    const f = T.fov.value(S); if (Math.abs(C.fov - f) > 1e-3) { C.fov = f; C.updateProjectionMatrix(); }
    C.updateMatrixWorld(true);
  }
}
