/* =====================================================================
   FX — what the tidal stress does to the city, and the end.
     · cracks running across the street under you (they grow in the tremor);
     · windows bursting above the street, glass raining down;
     · the lighthouse toppling on the breakwater; a landmark tower coming
       down, seen from the hill; dust rolling up from each;
     · fires starting across the darkened city;
     · the impact, beyond the horizon under the Moon: the horizon turns
       white, a wall of incandescent rock vapour rises along it and spreads,
       the Moon's lower limb lights up, the sky burns — then nothing.
   Everything is a deterministic function of story time S.
   ===================================================================== */

const MN_FX = {
  cracks: { s0: 47.6, s1: 51.8, z: [80, 104] },
  glass: [{ S: 48.3, x: 12.4, y: [6, 13], z: [92, 100], n: 140, dir: -1 }, { S: 50.9, x: -12.4, y: [5, 11], z: [86, 92], n: 110, dir: 1 }],
  lighthouse: { s0: 49.3, s1: 51.6 },
  tower: { s0: 67.2, s1: 71.5, i: 0 },
  fires: [[-60, 70, 56], [140, 150, 60.5], [-220, 90, 58], [40, 210, 64], [-150, 260, 66], [260, 60, 62], [-30, 40, 69]],
};

class MnFx {
  constructor(app, world) {
    this.app = app; this.world = world;
    const scene = app.scene, rng = new RNG(CONFIG.seed + 601);
    this.root = new THREE.Group(); this.root.name = 'fx'; scene.add(this.root);
    // --- cracks: jagged dark ribbons on the road, revealed segment by segment
    this.cracks = [];
    const crackMat = new THREE.MeshBasicMaterial({ color: '#050505', polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
    for (let c = 0; c < 7; c++) {
      let x = rng.range(-6, 6), z = rng.range(MN_FX.cracks.z[0], MN_FX.cracks.z[1]), a = rng.range(0, Math.PI * 2);
      const pos = [], n = 26;
      for (let i = 0; i < n; i++) {
        const w = 0.05 + 0.1 * (1 - i / n), nx = x + Math.cos(a) * rng.range(0.4, 0.9), nz = z + Math.sin(a) * rng.range(0.4, 0.9);
        a += rng.range(-0.6, 0.6);
        const px = -Math.sin(a) * w, pz = Math.cos(a) * w, y0 = mnGround(x, z) + 0.012, y1 = mnGround(nx, nz) + 0.012;
        pos.push(x - px, y0, z - pz, nx - px, y1, nz - pz, nx + px, y1, nz + pz, x - px, y0, z - pz, nx + px, y1, nz + pz, x + px, y0, z + pz);
        x = MathX.clamp(nx, -6.8, 6.8); z = nz;
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      const m = new THREE.Mesh(g, crackMat); m.frustumCulled = false; this.root.add(m);
      this.cracks.push({ m, n, d: rng.range(0, 1.6) });
    }
    // --- glass shards: little bright quads, thrown out and falling
    this.shards = [];
    const sg = new THREE.PlaneGeometry(0.22, 0.3), sm = new THREE.MeshStandardMaterial({ color: '#cfe0ea', roughness: 0.05, metalness: 0.6, side: THREE.DoubleSide, emissive: '#223040', emissiveIntensity: 0.4 });
    for (const G of MN_FX.glass) {
      const im = new THREE.InstancedMesh(sg, sm, G.n); im.frustumCulled = false; this.root.add(im);
      const P = [];
      for (let i = 0; i < G.n; i++) P.push({ x: G.x, y: mnGround(G.x, 0) + rng.range(G.y[0], G.y[1]), z: rng.range(G.z[0], G.z[1]), vx: G.dir * rng.range(0.6, 3.2), vy: rng.range(-0.5, 1.5), vz: rng.range(-1, 1), s: rng.range(0.4, 1.2), r: rng.range(0, 6), w: rng.range(-9, 9) });
      this.shards.push({ G, im, P });
    }
    // --- dust: soft sprites (one Points cloud for every plume)
    const N = 900, dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3).setUsage(THREE.DynamicDrawUsage));
    dg.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(N), 1).setUsage(THREE.DynamicDrawUsage));
    dg.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(N), 1).setUsage(THREE.DynamicDrawUsage));
    this.dustMat = new THREE.ShaderMaterial({
      uniforms: { uPx: { value: 1 }, uLight: { value: new THREE.Color(0.2, 0.2, 0.22) } },
      vertexShader: /* glsl */`attribute float aSize, aA; uniform float uPx; varying float vA;
        void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; vA = aA; gl_PointSize = aA > 0.0 ? clamp(aSize * uPx * 300.0 / -mv.z, 1.0, 400.0) : 0.0; }`,
      fragmentShader: /* glsl */`uniform vec3 uLight; varying float vA; void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r2 = dot(q, q); if (r2 > 1.0) discard; gl_FragColor = vec4(uLight * vec3(1.0, 0.96, 0.9), vA * (1.0 - r2) * 0.6); }`,
      transparent: true, depthWrite: false,
    });
    this.dust = new THREE.Points(dg, this.dustMat); this.dust.frustumCulled = false; this.dust.renderOrder = 8; this.root.add(this.dust);
    this.plumes = [];
    const L = world.city.lighthouse;
    this.plumes.push({ s0: MN_FX.lighthouse.s0 + 1.0, x: L[0], y: 2, z: L[2], n: 120, R: 26, H: 18, life: 6, seed: 1 });
    const T = world.city.landmarks[MN_FX.tower.i];
    if (T) this.plumes.push({ s0: MN_FX.tower.s0 + 0.3, x: T.x, y: mnGround(T.x, T.z), z: T.z, n: 260, R: 70, H: 55, life: 8, seed: 2 });
    for (const [x, z, s0] of MN_FX.fires) this.plumes.push({ s0: s0 + 0.5, x, y: mnGround(x, z) + 10, z, n: 40, R: 14, H: 50, life: 12, seed: 3 + x, smoke: true });
    // --- fires: flickering orange glows (and a warm light on the nearest)
    const fg = new THREE.BufferGeometry(), F = MN_FX.fires, K = 7;
    fg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(F.length * K * 3), 3));
    fg.setAttribute('aS', new THREE.BufferAttribute(new Float32Array(F.length * K), 1));
    F.forEach(([x, z], i) => { for (let k = 0; k < K; k++) fg.attributes.position.setXYZ(i * K + k, x + rng.range(-5, 5), mnGround(x, z) + rng.range(3, 10), z + rng.range(-4, 4)); });
    this.fireK = K;
    this.fireMat = new THREE.ShaderMaterial({
      uniforms: { uPx: { value: 1 }, uTime: { value: 0 } },
      vertexShader: /* glsl */`attribute float aS; uniform float uPx, uTime; varying float vS;
        void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; vS = aS * (0.55 + 0.45 * sin(uTime * 13.0 + position.x * 3.1) * sin(uTime * 7.3 + position.z * 2.3 + position.y));
          gl_PointSize = aS > 0.0 ? clamp(9.0 * uPx * 300.0 / -mv.z, 2.0, 120.0) : 0.0; }`,
      fragmentShader: /* glsl */`varying float vS; void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r2 = dot(q, q); if (r2 > 1.0) discard; gl_FragColor = vec4(vec3(1.0, 0.45, 0.12) * vS * (exp(-r2 * 3.0) * 1.2 + exp(-r2 * 14.0) * 2.0), 1.0); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.fires = new THREE.Points(fg, this.fireMat); this.fires.frustumCulled = false; this.root.add(this.fires);
    this._impact();
  }

  // the end: a wall of incandescent vapour along the horizon under the Moon, rising and spreading
  _impact() {
    const g = new THREE.CylinderGeometry(1, 1, 1, 160, 1, true, 0, Math.PI * 2);
    this.wallMat = new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uAz: { value: 0 }, uTime: { value: 0 } },
      vertexShader: /* glsl */`varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform float uT, uAz, uTime; varying vec3 vP;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
        float fb(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * n(p); p *= 2.1; a *= 0.5; } return v; }
        void main(){
          float az = atan(vP.x, -vP.z) - uAz; az = mod(az + 3.14159, 6.28318) - 3.14159;
          float y = vP.y + 0.5;                                   // 0 at the horizon … 1 at the top of the band
          float spread = 0.35 + 2.2 * uT;                         // it spreads along the horizon
          float across = exp(-pow(az / spread, 2.0));
          float hgt = 0.1 + 0.9 * uT;                             // and climbs
          float t = fb(vec2(az * 6.0, y * 4.0 - uTime * 0.8)) * 0.6 + fb(vec2(az * 17.0 + 3.0, y * 9.0 - uTime * 1.6)) * 0.4;
          float body = smoothstep(hgt, hgt * 0.4, y + (t - 0.5) * 0.35 * hgt) * across;
          vec3 c = mix(vec3(1.0, 0.42, 0.12), vec3(1.0, 0.95, 0.85), smoothstep(0.3, 0.8, body + (1.0 - y) * 0.3));
          gl_FragColor = vec4(c * body * (6.0 + 30.0 * uT), 1.0);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    this.wall = new THREE.Mesh(g, this.wallMat); this.wall.frustumCulled = false; this.wall.renderOrder = 12; this.wall.visible = false;
    this.root.add(this.wall);
  }

  update(t, S, cam) {
    const W = this.world;
    // cracks
    for (const c of this.cracks) { const k = MathX.clamp((S - MN_FX.cracks.s0 - c.d) / (MN_FX.cracks.s1 - MN_FX.cracks.s0 - 1.6), 0, 1); c.m.geometry.setDrawRange(0, Math.floor(k * c.n) * 6); c.m.visible = k > 0 && S < 63; }
    // glass
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), Sc = new THREE.Vector3();
    for (const { G, im, P } of this.shards) {
      const tau = S - G.S;
      im.visible = tau > 0 && tau < 6;
      if (!im.visible) continue;
      P.forEach((p, i) => {
        const tt = Math.min(tau, 3);
        let y = p.y + p.vy * tt - 4.9 * tt * tt; const g0 = mnGround(p.x + p.vx * tt, p.z + p.vz * tt) + 0.01;
        if (y < g0) y = g0;
        V.set(p.x + p.vx * Math.min(tt, 1.6), y, p.z + p.vz * Math.min(tt, 1.6));
        E.set(p.r + p.w * Math.min(tt, 1.5), p.r * 2, y <= g0 ? Math.PI / 2 : p.r + p.w * tt * 0.7); Q.setFromEuler(E); Sc.setScalar(p.s);
        im.setMatrixAt(i, M.compose(V, Q, Sc));
      });
      im.instanceMatrix.needsUpdate = true;
    }
    // the lighthouse falls (toward the sea), its lamp out
    const lk = Ease.inQuad(MathX.clamp((S - MN_FX.lighthouse.s0) / (MN_FX.lighthouse.s1 - MN_FX.lighthouse.s0), 0, 1));
    W.city.lighthouseG.rotation.set(-1.45 * lk, 0, 0.25 * lk);
    W.city.lighthouseG.position.y = 2 - 3.0 * lk * lk;
    W.lighthouseDown = lk > 0.05;
    // the tower comes down: it shakes, tilts and drops into its own dust
    const T = W.city.landmarks[MN_FX.tower.i];
    if (T && T.mesh) {
      const tk = MathX.clamp((S - MN_FX.tower.s0) / (MN_FX.tower.s1 - MN_FX.tower.s0), 0, 1), e = tk * tk;
      T.mesh.position.y = -e * 65; T.mesh.rotation.z = 0.12 * e; T.mesh.rotation.x = -0.05 * e;
      if (tk > 0 && tk < 0.2) T.mesh.position.x = T.x + Math.sin(t * 40) * 0.3;
      T.mesh.visible = tk < 1;
    }
    // dust and smoke plumes
    const pa = this.dust.geometry.attributes.position, sa = this.dust.geometry.attributes.aSize, aa = this.dust.geometry.attributes.aA;
    let k = 0;
    for (const P of this.plumes) {
      const tau = S - P.s0, rng = new RNG(Math.floor(P.seed * 1000));
      for (let i = 0; i < P.n && k < pa.count; i++, k++) {
        const a = rng.range(0, Math.PI * 2), r = rng.range(0.2, 1), up = rng.range(0, 1), dl = rng.range(0, P.smoke ? P.life : 1.2);
        const u = tau - dl;
        if (u < 0 || u > P.life) { aa.setX(k, 0); continue; }
        const g = 1 - Math.exp(-u / 1.6);
        const x = P.x + Math.cos(a) * r * P.R * g + (P.smoke ? u * 1.5 : 0), z = P.z + Math.sin(a) * r * P.R * g, y = P.y + up * P.H * g + (P.smoke ? u * 3 : 0);
        pa.setXYZ(k, x, y, z); sa.setX(k, (P.R * 0.35 + up * P.R * 0.3) * (0.5 + g)); aa.setX(k, (1 - u / P.life) * (P.smoke ? 0.5 : 0.85));
      }
    }
    for (; k < pa.count; k++) aa.setX(k, 0);
    pa.needsUpdate = true; sa.needsUpdate = true; aa.needsUpdate = true;
    const px = this.app.renderer.getDrawingBufferSize(this._sz || (this._sz = new THREE.Vector2())).y / 1920 * 2.0;
    this.dustMat.uniforms.uPx.value = px; this.fireMat.uniforms.uPx.value = px; this.fireMat.uniforms.uTime.value = t;
    // fires
    const fa = this.fires.geometry.attributes.aS;
    MN_FX.fires.forEach(([x, z, s0], i) => { for (let k = 0; k < this.fireK; k++) fa.setX(i * this.fireK + k, MathX.smooth(S, s0 + k * 0.3, s0 + 2 + k * 0.3) * (S < MN.impact + 2 ? 1 : 0)); });
    fa.needsUpdate = true;
    // the impact
    const it = MathX.clamp((S - MN.impact) / 1.8, 0, 1);
    this.wall.visible = S > MN.impact - 0.05;
    if (this.wall.visible) {
      const R = 5000, M2 = this.app.moonSky;
      this.wall.position.set(cam.position.x, cam.position.y + R * 0.004 - 10, cam.position.z);
      this.wall.scale.set(R, R * (0.05 + 0.75 * it), R);
      this.wall.position.y += this.wall.scale.y * 0.5 - R * 0.02;
      this.wallMat.uniforms.uT.value = it; this.wallMat.uniforms.uTime.value = t;
      this.wallMat.uniforms.uAz.value = Math.atan2(M2.dir.x, -M2.dir.z);
    }
  }
}
