/* =====================================================================
   SIM CITY — an ordinary avenue on a sunny afternoon: shops, a café with
   tables and a striped awning on your side, a plain stone wall you can
   touch, a bus stop, trees, lamps, signals, a rooftop billboard and the
   skyline. Subclasses the shared Environment (js/world/environment.js).
   The things that later break — one tree, one facade, one parked car —
   are built on their own so that they can (glitch.js).
   ===================================================================== */

// the street's dimensions (metres; you walk the right-hand sidewalk toward −Z)
const LAYOUT = {
  roadHalf: 7.0, curbH: 0.15, frontage: 12.5, laneW: 3.5,
  crossZ: -48, crossHalf: 7,
  zNear: 200, zFar: -760,
  busStop: { x: -10.2, z: -40 }, cafe: { x: 11.2, z: -22 },
  lot: { x0: 0, x1: 0, z0: 0, z1: 0 },
};

// the pieces other systems need to find
const SX_CITY = {
  wall: { z0: -16.5, z1: -9.0 },                      // the plain stone wall (you touch it)
  cafe: { z0: -28.0, z1: -16.5, door: [12.45, -21.6] },
  awning: { x0: 10.85, x1: 12.45, y0: 3.15, y1: 3.62, z0: -27.4, z1: -17.1 },   // outer edge (x0) is lower
  tree07: [-8.15, -27.0],
  checker: { z0: -35.5, z1: -24.0, floors: 5, style: 'cream' },   // the facade across the street that loses its texture
  treesR: [26, 16.5, -21.5, -31, -62, -71.5, -81, -90.5, -100],
  treesL: [20, 10.5, 1, -8.5, -18, -37.5, -61, -70.5, -80, -89.5, -99, -108.5],
};

class SimCity extends Environment {
  build() {
    this._materials();
    this._sky();
    this._lights();
    this._ground();
    this._markings();
    this._buildings();
    this._skyline();
    this._trees();
    this._streetFurniture();
    this._signals();
    this._billboard();
    this._cafe();
    this.batch.build(this.root, 'env');
    this._environmentMap();
  }

  // build fn's batched geometry into its own group (so it can be hidden or swapped)
  _own(name, fn) {
    const B0 = this.batch; this.batch = new Batcher();
    try { fn(); } finally { const g = new THREE.Group(); g.name = name; this.batch.build(g, name); this.root.add(g); this.batch = B0; return g; }
  }

  /* ---------------- sky: clear afternoon, a few soft clouds ---------------- */
  _sky() {
    this.sunDir = new THREE.Vector3(-0.22, 0.6, 0.77).normalize();      // behind you and a little left: faces turned to you are lit
    const zenith = new THREE.Color('#4a8fd8'), horizon = new THREE.Color('#c6ddf0');
    this.fogColor = new THREE.Color('#cddae2');
    this.skyUniforms = {
      uZenith: { value: zenith }, uHorizon: { value: horizon }, uGround: { value: new THREE.Color('#8d9590') },
      uSunDir: { value: this.sunDir }, uSunColor: { value: new THREE.Color('#ffe2b4') }, uTime: { value: 0 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.skyUniforms, side: THREE.BackSide, depthWrite: false,
      vertexShader: /* glsl */`varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */`
        uniform vec3 uZenith, uHorizon, uGround, uSunDir, uSunColor; uniform float uTime; varying vec3 vDir;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
          return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y); }
        float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a*noise(p); p = p*2.03 + 7.1; a *= 0.5; } return v; }
        void main(){
          vec3 d = normalize(vDir); float h = d.y;
          vec3 col = mix(uHorizon, uZenith, pow(clamp(h, 0.0, 1.0), 0.55));
          col = mix(col, uGround, smoothstep(0.0, -0.08, h));
          float sd = max(dot(d, uSunDir), 0.0);
          col += uSunColor * (pow(sd, 4.0) * 0.16 + pow(sd, 40.0) * 0.25);
          col = mix(col, uHorizon * 1.04, 0.25 * (1.0 - smoothstep(0.0, 0.18, abs(h))));
          if (h > 0.0) {
            vec2 uv = d.xz / (h + 0.18) * 0.42 + vec2(uTime * 0.004, uTime * 0.0015);
            float c = fbm(uv * 1.3);
            float cov = smoothstep(0.58, 0.8, c) * smoothstep(0.0, 0.12, h);
            vec3 lit = mix(vec3(1.0, 0.98, 0.95), uSunColor, 0.25) * 1.05, shade = mix(uHorizon, uZenith, 0.35) * 0.95;
            vec3 cl = mix(shade, lit, smoothstep(0.45, 0.9, fbm(uv * 1.3 + uSunDir.xz * 0.15)));
            col = mix(col, cl, cov * 0.8);
          }
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(2000, 48, 24), mat);
    sky.name = 'sky'; sky.frustumCulled = false; sky.renderOrder = -10;
    this.scene.add(sky); this.sky = sky;
    this.scene.fog = new THREE.FogExp2(this.fogColor.clone(), 0.0011);
    this.scene.background = horizon.clone();
  }

  _lights() {
    const sun = new THREE.DirectionalLight('#ffe6c2', 4.3);
    const tgt = new THREE.Vector3(2, 4, -22);
    sun.position.copy(this.sunDir).multiplyScalar(160).add(tgt);
    sun.target.position.copy(tgt);
    sun.castShadow = CONFIG.render.shadows;
    sun.shadow.mapSize.set(CONFIG.render.shadowMapSize, CONFIG.render.shadowMapSize);
    const sc = sun.shadow.camera;
    sc.left = -46; sc.right = 46; sc.top = 70; sc.bottom = -70; sc.near = 20; sc.far = 380;
    sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.035; sun.shadow.radius = 3;
    this.scene.add(sun, sun.target);
    this.sun = sun;
    this.hemi = new THREE.HemisphereLight('#bcd3ee', '#7d6e5e', 1.45);
    this.scene.add(this.hemi);
  }

  _markings() {
    const B = this.batch, m = this.m, L = LAYOUT, y = 0.006;
    const cz0 = L.crossZ - L.crossHalf, cz1 = L.crossZ + L.crossHalf;
    for (const [z0, z1] of [[cz1 + 4, L.zNear], [L.zFar, cz0 - 4]]) {
      for (const x of [-0.16, 0.16]) B.add(Geo.flat(x - 0.06, x + 0.06, z0, z1, y, 1), m.markYellow, null, { noShadow: true });
      // the bike lane on your side (solid lines), the parking lane opposite (a dashed edge)
      for (const x of [3.35, 5.35]) B.add(Geo.flat(x - 0.07, x + 0.07, z0, z1, y, 1), m.markWhite, null, { noShadow: true });
      for (let z = z0; z < z1 - 3; z += 6) B.add(Geo.flat(-3.57, -3.43, z, z + 2, y, 1), m.markWhite, null, { noShadow: true });
    }
    // the bike lane's arrows
    for (const z of [30, -6, -30, -80, -130]) {
      B.add(Geo.flat(4.27, 4.43, z - 0.9, z + 0.6, y, 1), m.markWhite, null, { noShadow: true });
      B.add(Geo.quad([4.0, y, z - 0.6], [4.7, y, z - 0.6], [4.35, y, z - 1.25], [4.35, y, z - 1.25]), m.markWhite, null, { noShadow: true });
    }
    for (const zc of [cz1 + 2, cz0 - 2]) for (let x = -6.5; x < 6.6; x += 1.0) B.add(Geo.flat(x, x + 0.55, zc - 1.6, zc + 1.6, y, 1), m.markWhite, null, { noShadow: true });
    B.add(Geo.flat(0.3, 6.9, cz1 + 3.8, cz1 + 4.25, y, 1), m.markWhite, null, { noShadow: true });
    B.add(Geo.flat(-6.9, -0.3, cz0 - 4.25, cz0 - 3.8, y, 1), m.markWhite, null, { noShadow: true });
    for (const xc of [L.roadHalf + 2, -L.roadHalf - 2]) for (let z = cz0 + 0.4; z < cz1 - 0.4; z += 1.0) B.add(Geo.flat(xc - 1.6, xc + 1.6, z, z + 0.55, y, 1), m.markWhite, null, { noShadow: true });
    for (const [x0, x1] of [[-600, -L.roadHalf - 4], [L.roadHalf + 4, 600]]) for (const dz of [-0.16, 0.16]) B.add(Geo.flat(x0, x1, L.crossZ + dz - 0.06, L.crossZ + dz + 0.06, y, 1), m.markYellow, null, { noShadow: true });
  }

  /* ---------------- buildings ---------------- */
  _buildings() {
    const L = LAYOUT, rng = this.rng.fork(1), C = SX_CITY;
    const cz0 = L.crossZ - L.crossHalf - 5.5, cz1 = L.crossZ + L.crossHalf + 5.5;
    const near = ['redbrick', 'tanbrick', 'cream', 'salmon', 'stone', 'whitebrick', 'sage', 'modern'];
    const far = ['modern', 'glassblue', 'stone', 'cream', 'glassteal', 'tanbrick', 'redbrick', 'whitebrick'];
    const order = [2, 3, 7, 1, 9, 12, 6, 10, 5, 13, 8, 11, 4];      // shops in a believable order (no second café)
    let shopIdx = 0;
    const nextShop = () => SHOPS[order[shopIdx++ % order.length]];
    const row = (side, zStart, zEnd, o) => {
      let z = zStart, prev = '';
      while (z > zEnd + 4) {
        let w = rng.range(o.wMin || 9, o.wMax || 17);
        if (z - w < zEnd + 6) w = z - zEnd;
        const pool = Math.abs(z) < 140 ? near : far;
        let style = rng.pick(pool); if (style === prev) style = rng.pick(pool); prev = style;
        this._building({ side, z0: z - w, z1: z, depth: rng.range(16, 22), style, floors: rng.int(o.fMin, o.fMax), shops: true, nextShop, rng });
        z -= w;
      }
    };
    // your side: shops, then the stone building whose wall you touch, the café, one more shop to the corner
    row(1, L.zNear, C.wall.z1, { fMin: 3, fMax: 6 });
    this._building({ side: 1, z0: C.wall.z0, z1: C.wall.z1, depth: 18, style: 'stone', floors: 5, shops: false, nextShop, rng });
    this._building({ side: 1, z0: C.cafe.z0, z1: C.cafe.z1, depth: 18, style: 'cream', floors: 4, shops: false, nextShop, rng });
    this._building({ side: 1, z0: cz1, z1: C.cafe.z0, depth: 18, style: 'redbrick', floors: 5, shops: true, nextShop, rng });
    row(1, cz0, -380, { fMin: 4, fMax: 9 });
    row(1, -380, -760, { fMin: 6, fMax: 14 });
    // across the street: shops; the cream building that loses its texture sits by the bus stop
    row(-1, L.zNear, C.checker.z1, { fMin: 3, fMax: 7 });
    this._building({ side: -1, z0: C.checker.z0, z1: C.checker.z1, depth: 18, style: C.checker.style, floors: C.checker.floors, shops: true, nextShop, rng });
    row(-1, cz0, -380, { fMin: 4, fMax: 10 });
    row(-1, -380, -760, { fMin: 6, fMax: 14 });
    for (const s of [-1, 1]) { this._rowX(s, 34, 260, cz1, 1, rng); this._rowX(s, 34, 260, cz0, -1, rng); }
    for (const s of [-1, 1]) {
      let z = 120;
      while (z > -700) {
        const w = rng.range(14, 30), h = rng.range(26, 70) + (z < -200 ? 25 : 0);
        if (!(z - w < cz1 + 2 && z > cz0 - 2)) {
          const st = this.facades[rng.pick(far)];
          const x0 = s > 0 ? 40 : -40 - rng.range(16, 26), x1 = s > 0 ? 40 + rng.range(16, 26) : -40;
          this.batch.add(Geo.boxSides(x0, x1, 0, h, z - w, z, st.tileW, st.tileH), st.mat, null);
          this.batch.add(Geo.flat(x0, x1, z - w, z, h, 4), this.m.roof, null, { noShadow: true });
        }
        z -= w + rng.range(0, 6);
      }
    }
    // the café's own front: storefront glass, a door, the name above
    const F = SX_CITY.cafe, xf = L.frontage - 0.03;
    const za = F.z0 + 0.4, zb = F.z1 - 0.4;
    this.batch.add(Geo.quad([xf, 0, za], [xf, 0, zb], [xf, 4.2, zb], [xf, 4.2, za]), this.shopMats[0], null, { noShadow: true });
    this.cafeY = 4.2;
  }

  _trees() {
    const rng = this.rng.fork(3), h = LAYOUT.curbH;
    for (const z of SX_CITY.treesR) this._tree(8.15, z, rng, rng.range(0.85, 1.15));
    for (const z of SX_CITY.treesL) this._tree(-8.15, z, rng, rng.range(0.85, 1.15));
    // TREE_07 — its own group (it turns into a flat card later)
    const [tx, tz] = SX_CITY.tree07, r7 = new RNG(707);
    this.tree07 = this._own('tree07', () => this._tree(tx, tz, r7, 1.12));
    this.tree07Pos = new THREE.Vector3(tx, h, tz);
  }

  _streetFurniture() {
    const B = this.batch, m = this.m, L = LAYOUT, h = L.curbH;
    for (const z of [22, -38, -98, -158]) this._streetLight(7.45, z, 1);
    for (const z of [7, -23, -68, -128]) this._streetLight(-7.45, z, -1);
    this._streetLight(7.45, -6.5, 1);
    for (const [x, z] of [[7.7, -11.5], [-7.7, -14], [7.7, -63]]) {
      B.add(new THREE.CylinderGeometry(0.13, 0.15, 0.6, 10), m.red, Geo.matrix(x, h + 0.3, z));
      B.add(new THREE.SphereGeometry(0.14, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), m.red, Geo.matrix(x, h + 0.6, z));
      B.add(new THREE.CylinderGeometry(0.05, 0.05, 0.42, 6), m.red, Geo.matrix(x, h + 0.42, z, 0, 0, Math.PI / 2));
    }
    for (const [x, z] of [[7.75, 2.5], [-7.8, -3], [7.75, -33]]) {
      B.add(new THREE.CylinderGeometry(0.3, 0.27, 0.95, 12), m.metalGreen, Geo.matrix(x, h + 0.475, z));
      B.add(new THREE.CylinderGeometry(0.33, 0.33, 0.08, 12), m.metalGreen, Geo.matrix(x, h + 0.99, z));
    }
    ['#c0392b', '#2471a3', '#f1c40f'].forEach((c, i) => {
      B.box(0.45, 1.0, 0.45, -11.6, h + 0.5, -16.5 + i * 0.55, Mat.std(c, { roughness: 0.5 }));
      B.box(0.47, 0.03, 0.47, -11.6, h + 1.0, -16.5 + i * 0.55, m.metal);
    });
    B.box(0.55, 1.15, 0.5, -11.9, h + 0.58, -10, m.blueBox);
    this._bench(-12.0, -4, Math.PI / 2);
    this._bench(-12.0, 12, Math.PI / 2);
    for (let i = 0; i < 4; i++) B.add(new THREE.TorusGeometry(0.38, 0.03, 6, 12, Math.PI), m.galv, Geo.matrix(11.6, h, -6 + i * 0.8, 0, Math.PI / 2, 0));
    this._busShelter(L.busStop.x, L.busStop.z);
    const nameA = Tex.label(['ELM AVE'], { w: 512, h: 112, font: 70, bg: '#1d6b3c', border: '#ffffff' });
    const nameB = Tex.label(['3RD ST'], { w: 512, h: 112, font: 70, bg: '#1d6b3c', border: '#ffffff' });
    const sa = new THREE.MeshStandardMaterial({ map: nameA, roughness: 0.5 }), sb = new THREE.MeshStandardMaterial({ map: nameB, roughness: 0.5 });
    for (const [x, z] of [[8.0, -35.2], [-8.0, -60.8]]) {
      B.add(new THREE.CylinderGeometry(0.04, 0.04, 3.3, 6), m.metal, Geo.matrix(x, h + 1.65, z));
      B.box(1.2, 0.26, 0.02, x, h + 3.15, z, sa);
      B.box(0.02, 0.26, 1.2, x, h + 2.85, z, sb);
    }
  }

  /* the café: tables and chairs on your sidewalk, the striped awning (the ball rolls off it), an A-board, planters */
  _cafe() {
    const B = this.batch, h = LAYOUT.curbH, A = SX_CITY.awning;
    const metal = Mat.std('#2a2d30', { roughness: 0.45, metalness: 0.5 }), top = Mat.std('#e8e4da', { roughness: 0.5 }), cup = Mat.std('#fafafa', { roughness: 0.4 });
    const tables = [[11.35, -18.4], [11.35, -24.6], [11.35, -26.6]];
    this.cafeTables = tables;
    for (const [x, z] of tables) {
      B.add(new THREE.CylinderGeometry(0.36, 0.36, 0.03, 16), top, Geo.matrix(x, h + 0.74, z));
      B.add(new THREE.CylinderGeometry(0.03, 0.03, 0.72, 6), metal, Geo.matrix(x, h + 0.37, z));
      B.add(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 12), metal, Geo.matrix(x, h + 0.01, z));
      for (const dz of [-0.66, 0.66]) {
        B.box(0.42, 0.04, 0.42, x, h + 0.45, z + dz, metal);
        B.box(0.42, 0.45, 0.04, x, h + 0.7, z + dz + Math.sign(dz) * 0.2, metal);
        for (const [lx, lz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) B.box(0.025, 0.45, 0.025, x + lx, h + 0.22, z + dz + lz, metal);
      }
      B.add(new THREE.CylinderGeometry(0.04, 0.035, 0.08, 10), cup, Geo.matrix(x - 0.1, h + 0.8, z + 0.08));
    }
    // striped awning: a sloped canvas from the facade out over the tables, with a valance
    const c = Tex.canvas(256, 64), x = c.getContext('2d');
    for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#f1ece0' : '#2c5a46'; x.fillRect(i * 32, 0, 32, 64); }
    const stripe = Tex.tex(c);
    const aw = new THREE.MeshStandardMaterial({ map: stripe, roughness: 0.85, side: THREE.DoubleSide });
    const len = A.z1 - A.z0, run = A.x1 - A.x0, drop = A.y1 - A.y0, slope = Math.hypot(run, drop);
    const g = new THREE.PlaneGeometry(len, slope, 1, 1);
    g.rotateX(-Math.PI / 2); g.rotateY(Math.PI / 2);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * len / 2.2);
    const awning = new THREE.Mesh(g, aw);
    awning.position.set((A.x0 + A.x1) / 2, (A.y0 + A.y1) / 2 + LAYOUT.curbH * 0, (A.z0 + A.z1) / 2);
    awning.rotation.z = -Math.atan2(drop, run);
    awning.castShadow = true; awning.receiveShadow = true;
    this.root.add(awning);
    const val = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.28), aw);
    val.position.set(A.x0 - 0.005, A.y0 - 0.14, (A.z0 + A.z1) / 2); val.rotation.y = -Math.PI / 2; val.castShadow = true;
    val.material = aw; this.root.add(val);
    for (const z of [A.z0 + 0.1, A.z1 - 0.1]) B.add(new THREE.CylinderGeometry(0.02, 0.02, Math.hypot(run, drop) + 0.1, 5), metal, Geo.matrix((A.x0 + A.x1) / 2, (A.y0 + A.y1) / 2 - 0.05, z, 0, 0, Math.PI / 2 - Math.atan2(drop, run)));
    // A-board and two planters
    const ab = Tex.label([['CAFÉ', 46], ['AROMA', 46], ['coffee · cake', 26]], { w: 192, h: 256, bg: '#1f2a24', fg: '#f3e9d2', border: '#f3e9d2' });
    const abm = new THREE.MeshStandardMaterial({ map: ab, roughness: 0.7 });
    for (const s of [-1, 1]) B.add(new THREE.PlaneGeometry(0.55, 0.8), abm, Geo.matrix(10.25 + s * 0.11, h + 0.4, -16.2, 0, s > 0 ? Math.PI / 2 : -Math.PI / 2, 0, 1, 1, 1).multiply(new THREE.Matrix4().makeRotationX(-0.14)));
    for (const z of [-16.9, -27.8]) {
      B.add(new THREE.CylinderGeometry(0.32, 0.26, 0.55, 10), Mat.std('#6b5a4a', { roughness: 0.9 }), Geo.matrix(12.0, h + 0.28, z));
      B.add(new THREE.IcosahedronGeometry(0.42, 1), this.m.foliage, Geo.matrix(12.0, h + 0.85, z), { color: '#3f5a2c' });
    }
    this.anchors.cafe = new THREE.Vector3(11.2, 1.0, -22);
  }

  /* ---------------- per frame ---------------- */
  update(t) {
    this.skyUniforms.uTime.value = sxW(t);
    // the avenue is green the whole time; the cross street waits
    for (const hd of this.signalHeads || []) {
      const on = hd.group === 'avenue' ? 2 : 0;
      hd.lamps.forEach((l, i) => l.mat.color.copy(l.color).multiplyScalar(i === on ? 3.0 : 0.05));
    }
    if (this.dynamic.billboard) this.dynamic.billboard.color.setScalar(1.05);
    if (this.dynamic.ad) this.dynamic.ad.emissiveIntensity = 0.6;
  }
}
