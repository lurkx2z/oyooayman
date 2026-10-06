/* =====================================================================
   FRICTION CITY — the avenue, the junction and the 7° hill climbing away
   behind it, on a clear late afternoon. Subclasses the oxygen film's
   Environment (js/world/environment.js) to reuse its materials, facades,
   shops, buildings, trees, lamp posts, benches, bus shelter and signals;
   adds the hill (road, sidewalks, markings and stepped buildings that
   follow FrGround), a sunny sky, and the lights.
   ===================================================================== */

// the street's dimensions, in the form the shared Environment expects (metres; you walk toward −Z)
const LAYOUT = {
  roadHalf: 7.0, curbH: 0.15, frontage: 12.5, laneW: 3.5,
  crossZ: -30, crossHalf: 7,
  zNear: 260, zFar: -600,
  busStop: { x: -10.2, z: -7.5 }, cafe: { x: -10.9, z: -2 },
};

class FrictionCity extends Environment {
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
    this.batch.build(this.root, 'env');
    this._environmentMap();
  }

  // run fn with everything it batches lifted by dy (buildings, trees and posts standing on the hill)
  _lift(dy, fn) {
    const B0 = this.batch, M = new THREE.Matrix4().makeTranslation(0, dy, 0);
    this.batch = {
      add: (g, m, mat, o) => B0.add(g, m, mat ? M.clone().multiply(mat) : M, o),
      box: (w, h, d, x, y, z, m, ry, o) => B0.box(w, h, d, x, y + dy, z, m, ry, o),
    };
    try { fn(); } finally { this.batch = B0; }
  }

  // a surface strip x0…x1 between z0 > z1 (going up the hill), following the road height (+ yOff), UVs in metres / tile
  _strip(x0, x1, z0, z1, yOff, tile, mat, opts = { noShadow: true }, step = 2) {
    const G = FrGround, zs = [z0];
    for (let z = z0; z > z1;) {
      let nz;
      if (z > G.z0) nz = G.z0;                                   // flat: one piece to the foot of the hill
      else {
        const d = G.z0 - z, fine = d < G.ramp + 2 || (d > G.crest - 2 && d < G.crest + G.crestLen + 2);
        nz = d > G.crest + G.crestLen + 2 ? z1 : z - (fine ? step / 2 : step);   // finer on the curves, one piece on the plateau
      }
      z = Math.max(z1, nz); zs.push(z);
    }
    const pos = [], uv = [];
    for (let i = 0; i < zs.length - 1; i++) {
      const za = zs[i], zb = zs[i + 1], ya = G.road(za) + yOff, yb = G.road(zb) + yOff;
      const q = [[x0, ya, za], [x1, ya, za], [x1, yb, zb], [x0, yb, zb]];
      const u = [[x0 / tile, -za / tile], [x1 / tile, -za / tile], [x1 / tile, -zb / tile], [x0 / tile, -zb / tile]];
      for (const k of [0, 1, 2, 0, 2, 3]) { pos.push(...q[k]); uv.push(...u[k]); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    this.batch.add(g, mat, null, opts);
  }
  // a vertical strip along z at x (kerb faces), from the road up by h, facing +X (face = 1) or −X (−1)
  _kerbFace(x, z0, z1, h, face, mat) {
    const G = FrGround, pos = [], uv = [];
    for (let z = z0; z > z1;) {
      const zb = Math.max(z1, z - 2);
      // corners BL, BR, TR, TL as seen from the side the face looks at (+X: BL is the higher z; −X: BL is the lower z)
      const [zl, zr] = face > 0 ? [z, zb] : [zb, z];
      const q = [[x, G.road(zl), zl], [x, G.road(zr), zr], [x, G.road(zr) + h, zr], [x, G.road(zl) + h, zl]];
      for (const k of [0, 1, 2, 0, 2, 3]) { pos.push(...q[k]); }
      uv.push(0, 0, 1, 0, 1, 0.1, 0, 0, 1, 0.1, 0, 0.1);
      z = zb;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    this.batch.add(g, mat, null, { noShadow: true });
  }

  /* ---------------- sky: clear late afternoon, a few soft clouds ---------------- */
  _sky() {
    this.sunDir = new THREE.Vector3(-0.16, 0.62, 0.77).normalize();      // behind you, ~38° up: shadows run along the street, the hill faces the sun
    const zenith = new THREE.Color('#4a90d9'), horizon = new THREE.Color('#c4dcf0');
    this.fogColor = new THREE.Color('#cfdbe2');
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
          col = mix(col, uHorizon * 1.04, 0.25 * (1.0 - smoothstep(0.0, 0.18, abs(h))));   // pale band at the horizon
          if (h > 0.0) {
            vec2 uv = d.xz / (h + 0.18) * 0.42 + vec2(uTime * 0.004, uTime * 0.0015);
            float c = fbm(uv * 1.3);
            float cov = smoothstep(0.56, 0.78, c) * smoothstep(0.0, 0.12, h);
            vec3 lit = mix(vec3(1.0, 0.98, 0.95), uSunColor, 0.25) * 1.05, shade = mix(uHorizon, uZenith, 0.35) * 0.95;
            vec3 cl = mix(shade, lit, smoothstep(0.45, 0.9, fbm(uv * 1.3 + uSunDir.xz * 0.15)));
            col = mix(col, cl, cov * 0.85);
          }
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(2000, 48, 24), mat);
    sky.name = 'sky'; sky.frustumCulled = false; sky.renderOrder = -10;
    this.scene.add(sky); this.sky = sky;
    this.scene.fog = new THREE.FogExp2(this.fogColor.clone(), 0.0008);
    this.scene.background = horizon.clone();
  }

  _lights() {
    const sun = new THREE.DirectionalLight('#ffe4bc', 4.4);
    const tgt = new THREE.Vector3(0, 6, -55);
    sun.position.copy(this.sunDir).multiplyScalar(170).add(tgt);
    sun.target.position.copy(tgt);
    sun.castShadow = CONFIG.render.shadows;
    sun.shadow.mapSize.set(CONFIG.render.shadowMapSize, CONFIG.render.shadowMapSize);
    const sc = sun.shadow.camera;
    sc.left = -62; sc.right = 62; sc.top = 105; sc.bottom = -105; sc.near = 20; sc.far = 420;
    sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.04; sun.shadow.radius = 3;
    this.scene.add(sun, sun.target);
    this.sun = sun;
    this.hemi = new THREE.HemisphereLight('#b8d0ec', '#7d6e5e', 1.45);
    this.scene.add(this.hemi);
  }

  /* ---------------- the ground ---------------- */
  _ground() {
    const L = LAYOUT, B = this.batch, m = this.m, G = FrGround, J0 = G.junction[0], J1 = G.junction[1];
    // avenue: flat to the foot of the hill, then the hill (and its crest)
    B.add(Geo.flat(-L.roadHalf, L.roadHalf, G.z0, L.zNear, 0, 8), m.asphalt, null, { noShadow: true });
    this._strip(-L.roadHalf, L.roadHalf, G.z0, L.zFar, 0, 8, m.asphalt);
    // cross street
    B.add(Geo.flat(-220, -L.roadHalf, J0, J1, 0, 8), m.asphalt, null, { noShadow: true });
    B.add(Geo.flat(L.roadHalf, 220, J0, J1, 0, 8), m.asphalt, null, { noShadow: true });
    B.add(Geo.flat(-900, 900, -1500, 400, -0.02, 10), m.dirt, null, { noShadow: true });
    // sidewalks: your block (flat), the hill (sloped), the cross street
    for (const s of [-1, 1]) {
      this._sidewalk(s * L.roadHalf, s * (L.frontage + 0.5), J1, L.zNear);
      // hill sidewalk: top, kerb face toward the road, end cap facing the junction
      const xa = s * L.roadHalf, xb = s * (L.frontage + 0.5), inner = xa + s * 0.32;
      this._strip(Math.min(inner, xb), Math.max(inner, xb), J0, L.zFar, L.curbH, 2.5, m.sidewalk);
      this._strip(Math.min(xa, inner), Math.max(xa, inner), J0, L.zFar, L.curbH, 1, m.curb);
      this._kerbFace(xa, J0, L.zFar, L.curbH, -s, m.curb);
      const x0 = Math.min(xa, xb), x1 = Math.max(xa, xb);
      B.add(Geo.quad([x0, 0, J0], [x1, 0, J0], [x1, L.curbH, J0], [x0, L.curbH, J0], 0, 0, (x1 - x0) / 2, L.curbH / 2), m.curb, null, { noShadow: true });
      this._sidewalkX(s * L.roadHalf, s * 220, J1, J1 + 5.5);
      this._sidewalkX(s * L.roadHalf, s * 220, J0 - 5.5, J0);
    }
    // the kerb extensions (bulb-outs) at the foot of each parking lane on the hill, with their bollards (props.js)
    const disc = new THREE.CircleGeometry(0.42, 18);
    for (const [x, z] of [[-1.6, 9], [3.4, -6], [-3.1, -52], [1.2, -110], [2.1, 30]]) B.add(disc, m.manhole, Geo.matrix(x, G.road(z) + 0.008, z, -Math.PI / 2 + Math.atan(-G.dz(z))), { noShadow: true });
  }

  _markings() {
    const B = this.batch, m = this.m, L = LAYOUT, G = FrGround, J0 = G.junction[0], J1 = G.junction[1], y = 0.006;
    // your block: double yellow, lane dashes, edge lines
    for (const x of [-0.16, 0.16]) B.add(Geo.flat(x - 0.06, x + 0.06, J1 + 4, L.zNear, y, 1), m.markYellow, null, { noShadow: true });
    for (const x of [-3.5, 3.5]) for (let z = J1 + 4; z < L.zNear - 3; z += 9) B.add(Geo.flat(x - 0.07, x + 0.07, z, z + 3, y, 1), m.markWhite, null, { noShadow: true });
    for (const x of [-6.75, 6.75]) B.add(Geo.flat(x - 0.07, x + 0.07, J1 + 4, L.zNear, y, 1), m.markWhite, null, { noShadow: true });
    // crosswalks and stop lines
    for (const zc of [J1 + 2, J0 - 2]) for (let x = -6.5; x < 6.6; x += 1.0) B.add(Geo.flat(x, x + 0.55, zc - 1.6, zc + 1.6, y, 1), m.markWhite, null, { noShadow: true });
    B.add(Geo.flat(0.3, 6.9, J1 + 3.8, J1 + 4.25, y, 1), m.markWhite, null, { noShadow: true });
    for (const xc of [L.roadHalf + 2, -L.roadHalf - 2]) for (let z = J0 + 0.4; z < J1 - 0.4; z += 1.0) B.add(Geo.flat(xc - 1.6, xc + 1.6, z, z + 0.55, y, 1), m.markWhite, null, { noShadow: true });
    for (const [x0, x1] of [[-220, -L.roadHalf - 4], [L.roadHalf + 4, 220]]) for (const dz of [-0.16, 0.16]) B.add(Geo.flat(x0, x1, L.crossZ + dz - 0.06, L.crossZ + dz + 0.06, y, 1), m.markYellow, null, { noShadow: true });
    B.add(Geo.flat(L.roadHalf + 3.8, L.roadHalf + 4.25, L.crossZ - 6.9, L.crossZ - 0.3, y, 1), m.markWhite, null, { noShadow: true });
    B.add(Geo.flat(-L.roadHalf - 4.25, -L.roadHalf - 3.8, L.crossZ + 0.3, L.crossZ + 6.9, y, 1), m.markWhite, null, { noShadow: true });
    // the hill: double yellow, the parking-lane lines (with stall ticks), stop line for traffic coming down
    for (const x of [-0.16, 0.16]) this._strip(x - 0.06, x + 0.06, J0 - 4, L.zFar, y, 1, m.markYellow);
    for (const s of [-1, 1]) {
      this._strip(s * 4.6 - 0.07, s * 4.6 + 0.07, -48.5, L.zFar, y, 1, m.markWhite);
      for (let z = -48.5; z > -400; z -= 6.2) this._strip(Math.min(s * 4.6, s * 7), Math.max(s * 4.6, s * 7), z, z - 0.12, y, 1, m.markWhite, { noShadow: true }, 1);
    }
    this._strip(-6.9, -0.3, J0 - 3.8, J0 - 4.25, y, 1, m.markWhite);
    // hatched kerb-extension zone at the foot of each parking lane
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) { const z = -44.2 - k * 1.05; this._strip(Math.min(s * 4.7, s * 6.9), Math.max(s * 4.7, s * 6.9), z, z - 0.3, y, 1, m.markYellow, { noShadow: true }, 1); }
  }

  /* ---------------- buildings ---------------- */
  _buildings() {
    const L = LAYOUT, G = FrGround, rng = this.rng.fork(1), J0 = G.junction[0], J1 = G.junction[1];
    const near = ['redbrick', 'tanbrick', 'cream', 'salmon', 'stone', 'whitebrick', 'sage', 'modern'];
    const hill = ['redbrick', 'cream', 'salmon', 'sage', 'whitebrick', 'tanbrick', 'stone'];
    let shopIdx = 3;
    const nextShop = () => SHOPS[(shopIdx++ * 5) % SHOPS.length];
    // your block: shops at street level
    const row = (side, zStart, zEnd, o) => {
      let z = zStart, prev = '';
      while (z > zEnd + 4) {
        let w = rng.range(o.wMin || 9, o.wMax || 17);
        if (z - w < zEnd + 6) w = z - zEnd;
        let style = rng.pick(o.pool); if (style === prev) style = rng.pick(o.pool); prev = style;
        const fl = rng.int(o.fMin, o.fMax), depth = rng.range(16, 22);
        if (o.hill) {
          // stepped: each building sits at the road height of its downhill end (a little buried at the uphill end)
          const base = G.road(z) - 0.25;
          this._lift(base, () => this._building({ side, z0: z - w, z1: z, depth, style, floors: fl, shops: o.shopAt ? o.shopAt(z, w) : false, nextShop, rng }));
        } else this._building({ side, z0: z - w, z1: z, depth, style, floors: fl, shops: true, nextShop, rng });
        z -= w;
      }
    };
    row(1, L.zNear, J1 + 5.5, { pool: near, fMin: 3, fMax: 6 });
    row(-1, L.zNear, J1 + 5.5, { pool: near, fMin: 3, fMax: 7 });
    // the hill: narrow, stepped rowhouses; a corner market by the cart corral and a café higher up on the right
    row(1, J0 - 5.5, -360, { pool: hill, fMin: 3, fMax: 5, wMin: 7, wMax: 11, hill: true, shopAt: (z, w) => (z > -66 && z - w < -50) || (z > -110 && z - w < -96) });
    row(-1, J0 - 5.5, -360, { pool: hill, fMin: 3, fMax: 5, wMin: 7, wMax: 11, hill: true, shopAt: (z, w) => z > -60 && z - w < -48 });
    row(1, -360, -620, { pool: near, fMin: 4, fMax: 8, hill: true });
    row(-1, -360, -620, { pool: near, fMin: 4, fMax: 8, hill: true });
    // cross-street rows
    for (const s of [-1, 1]) { this._rowX(s, 34, 220, J1 + 5.5, 1, rng); this._rowX(s, 34, 220, J0 - 5.5, -1, rng); }
    // a taller row behind, lifted with the hill
    for (const s of [-1, 1]) {
      let z = 140;
      while (z > -640) {
        const w = rng.range(14, 30), h = rng.range(24, 60) + (z < -200 ? 20 : 0);
        if (!(z - w < J1 + 2 && z > J0 - 2)) {
          const st = this.facades[rng.pick(near)], base = G.road(z) - 1;
          const x0 = s > 0 ? 40 : -40 - rng.range(16, 26), x1 = s > 0 ? 40 + rng.range(16, 26) : -40;
          this.batch.add(Geo.boxSides(x0, x1, base, base + h, z - w, z, st.tileW, st.tileH), st.mat, null);
          this.batch.add(Geo.flat(x0, x1, z - w, z, base + h, 4), this.m.roof, null, { noShadow: true });
        }
        z -= w + rng.range(0, 6);
      }
    }
  }

  // the distant skyline stands on the plateau beyond the crest
  _skyline() { this._lift(FrGround.road(-600) - 2, () => super._skyline()); }

  _trees() {
    const rng = this.rng.fork(3);
    // (the right-hand trees up the hill are kept slim, so the view up the hill to the truck stays clear)
    for (const z of FR_STATIC.treesR) { const sc = rng.range(0.8, 1.2); this._lift(FrGround.road(z), () => this._tree(8.15, z, rng, z < -62 && z > -170 ? sc * 0.6 : sc)); }
    for (const z of FR_STATIC.treesL) this._lift(FrGround.road(z), () => this._tree(-8.15, z, rng, rng.range(0.8, 1.2)));
  }

  // the shared signals, except that the near-side head low on the far-right mast is left off (it sat right in your line of
  // sight up the hill)
  _signals() {
    const L = LAYOUT, h = L.curbH, m = this.m, B = this.batch, cz0 = L.crossZ - L.crossHalf, cz1 = L.crossZ + L.crossHalf;
    this.signalHeads = [];
    const headGeo = new THREE.BoxGeometry(0.36, 1.0, 0.3), lampGeo = new THREE.CircleGeometry(0.1, 14), housing = Mat.std('#1d2124', { roughness: 0.5 });
    const mkHead = (x, y, z, ry, group) => {
      B.add(headGeo, housing, Geo.matrix(x, y, z, 0, ry, 0));
      B.add(new THREE.BoxGeometry(0.55, 1.2, 0.03), housing, Geo.matrix(x - Math.sin(ry) * 0.17, y, z - Math.cos(ry) * 0.17, 0, ry, 0));
      const lamps = [];
      ['#ff2a1a', '#ffb000', '#22e07a'].forEach((c, i) => {
        const mat = new THREE.MeshBasicMaterial({ color: c, toneMapped: false }), mesh = new THREE.Mesh(lampGeo, mat);
        mesh.position.set(x + Math.sin(ry) * 0.155, y + 0.3 - i * 0.3, z + Math.cos(ry) * 0.155); mesh.rotation.y = ry; this.root.add(mesh);
        lamps.push({ mesh, mat, color: new THREE.Color(c) });
        B.add(new THREE.CylinderGeometry(0.13, 0.13, 0.16, 10, 1, true, -Math.PI / 2, Math.PI), housing, Geo.matrix(x + Math.sin(ry) * 0.23, y + 0.3 - i * 0.3 + 0.02, z + Math.cos(ry) * 0.23, Math.PI / 2, ry, 0));
      });
      this.signalHeads.push({ group, lamps });
    };
    const mast = (px, pz, armDir, armLen, ry, group, heads, low = true) => {
      B.add(new THREE.CylinderGeometry(0.14, 0.19, 7.2, 10), m.metal, Geo.matrix(px, h + 3.6, pz));
      if (armDir === 'x') B.add(new THREE.CylinderGeometry(0.07, 0.1, armLen, 8), m.metal, Geo.matrix(px - Math.sign(px) * armLen / 2, h + 6.6, pz, 0, 0, Math.PI / 2));
      else B.add(new THREE.CylinderGeometry(0.07, 0.1, armLen, 8), m.metal, Geo.matrix(px, h + 6.6, pz - Math.sign(pz - L.crossZ) * armLen / 2, Math.PI / 2, 0, 0));
      for (const [hx, hz] of heads) mkHead(hx, h + 5.9, hz, ry, group);
      if (low) mkHead(px + Math.sin(ry) * 0.3, h + 3.2, pz + Math.cos(ry) * 0.3, ry, group);
    };
    mast(7.9, cz0 - 1.2, 'x', 7.5, 0, 'avenue', [[4.0, cz0 - 1.2], [1.3, cz0 - 1.2]], false);
    mast(-7.9, cz1 + 1.2, 'x', 7.5, Math.PI, 'avenue', [[-4.0, cz1 + 1.2], [-1.3, cz1 + 1.2]]);
    mast(-7.9 - 1.2, cz0 - 0.5, 'z', 7.0, Math.PI / 2, 'cross', [[-9.1, cz0 + 3.8], [-9.1, cz0 + 1.5]]);
    mast(7.9 + 1.2, cz1 + 0.5, 'z', 7.0, -Math.PI / 2, 'cross', [[9.1, cz1 - 3.8], [9.1, cz1 - 1.5]]);
  }

  // down the avenue: a bus boarding island in the right lane (a raised, kerbed platform). When friction returns the spinning
  // car, sliding sideways, catches its end kerb (FR_TRIP) and rolls over it.
  _busIsland() {
    const B = this.batch, m = this.m, x0 = 3.0, x1 = 6.4, z0 = 193.62, z1 = 205.0, H = 0.22, y = FrGround.road(z0);
    B.box(x1 - x0, H, z1 - z0, (x0 + x1) / 2, y + H / 2, (z0 + z1) / 2, m.sidewalk || Mat.std('#b9b4aa', { roughness: 0.9 }));
    const yel = Mat.std('#e8c21c', { roughness: 0.6 });
    B.box(x1 - x0, 0.012, 0.3, (x0 + x1) / 2, y + H + 0.006, z0 + 0.15, yel);
    B.box(0.3, 0.012, z1 - z0, x0 + 0.15, y + H + 0.006, (z0 + z1) / 2, yel);
    B.box(0.06, 2.6, 0.06, 5.6, y + H + 1.3, 197.0, m.metal);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshStandardMaterial({ map: Tex.label([['BUS', 48], ['STOP', 40]], { w: 128, h: 128, bg: '#1f5fa8' }), side: THREE.DoubleSide }));
    sign.position.set(5.6, y + H + 2.5, 197.0); this.root.add(sign);
    for (const z of [194.2, 196.0]) B.box(0.18, 0.9, 0.18, x0 + 0.35, y + H + 0.45, z, m.metal);
  }

  _streetFurniture() {
    const B = this.batch, m = this.m, h = LAYOUT.curbH, G = FrGround;
    this._busIsland();
    // (lamp posts on your block are props — they can be knocked down)
    for (const z of FR_STATIC.lampsR) if (z <= -40) this._lift(G.road(z), () => this._streetLight(7.45, z, 1));
    for (const z of FR_STATIC.lampsL) if (z <= -40) this._lift(G.road(z), () => this._streetLight(-7.45, z, -1));
    // hydrants, fixed bins, a mailbox and newspaper boxes (all bolted down)
    for (const [x, z] of [[7.7, 6], [-7.7, -12], [7.7, -66], [-7.7, 18]]) this._lift(G.road(z), () => {
      this.batch.add(new THREE.CylinderGeometry(0.13, 0.15, 0.6, 10), m.red, Geo.matrix(x, h + 0.3, z));
      this.batch.add(new THREE.SphereGeometry(0.14, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), m.red, Geo.matrix(x, h + 0.6, z));
    });
    for (const [x, z] of [[-7.8, -3], [7.75, 14]]) {
      B.add(new THREE.CylinderGeometry(0.3, 0.27, 0.95, 12), m.metalGreen, Geo.matrix(x, h + 0.475, z));
      B.add(new THREE.CylinderGeometry(0.33, 0.33, 0.08, 12), m.metalGreen, Geo.matrix(x, h + 0.99, z));
    }
    ['#c0392b', '#2471a3', '#f1c40f'].forEach((c, i) => {
      B.box(0.45, 1.0, 0.45, -11.7, h + 0.5, -14.5 + i * 0.55, Mat.std(c, { roughness: 0.5 }));
      B.box(0.47, 0.03, 0.47, -11.7, h + 1.0, -14.5 + i * 0.55, m.metal);
    });
    B.box(0.55, 1.15, 0.5, -11.9, h + 0.58, -2, m.blueBox);
    // the bench behind you (you end up against it) and one across the road
    this._bench(FR_STATIC.bench.x, FR_STATIC.bench.z, -Math.PI / 2);
    this._bench(-12.0, 4, Math.PI / 2);
    this._busShelter(FR_STATIC.shelter.x, FR_STATIC.shelter.z);
    // street-name signs at the corners
    const nameA = Tex.label(['HILL ST'], { w: 512, h: 112, font: 70, bg: '#1d6b3c', border: '#ffffff' });
    const nameB = Tex.label(['W 5TH ST'], { w: 512, h: 112, font: 70, bg: '#1d6b3c', border: '#ffffff' });
    const sa = new THREE.MeshStandardMaterial({ map: nameA, roughness: 0.5 }), sb = new THREE.MeshStandardMaterial({ map: nameB, roughness: 0.5 });
    for (const [x, z] of [[-8.0, -40.5], [11.8, -18.6]]) {
      B.add(new THREE.CylinderGeometry(0.04, 0.04, 3.3, 6), m.metal, Geo.matrix(x, h + 1.65, z));
      B.box(1.2, 0.26, 0.02, x, h + 3.15, z, sa);
      B.box(0.02, 0.26, 1.2, x, h + 2.85, z, sb);
    }
    // a "HILL — 12 %" warning sign at the foot of the hill, facing the traffic coming down
    const ws = Tex.label([['STEEP', 52], ['HILL', 64], ['12 %', 50]], { w: 256, h: 256, bg: '#f2c230', fg: '#111', border: '#111' });
    const wm = new THREE.MeshStandardMaterial({ map: ws, roughness: 0.6 });
    this._lift(G.road(-60), () => {
      this.batch.add(new THREE.CylinderGeometry(0.035, 0.035, 2.8, 6), m.metal, Geo.matrix(-7.6, h + 1.4, -60));
      this.batch.add(new THREE.PlaneGeometry(0.75, 0.75), wm, Geo.matrix(-7.6, h + 2.45, -59.97, 0, 0, Math.PI / 4), { noShadow: true });
    });
    // the pole you'll hold: a slender parking-sign pole
    const P = FR_POLE;
    B.add(new THREE.CylinderGeometry(0.045, 0.05, 3.3, 10), m.galv, Geo.matrix(P.x, h + 1.65, P.z));
    const ps = Tex.label([['NO', 46], ['PARKING', 40], ['8AM–6PM', 30]], { w: 192, h: 256, bg: '#f4f4f0', fg: '#c0392b', border: '#c0392b' });
    B.add(new THREE.PlaneGeometry(0.42, 0.56), new THREE.MeshStandardMaterial({ map: ps, roughness: 0.6, side: THREE.DoubleSide }), Geo.matrix(P.x, h + 2.85, P.z - 0.055, 0, 0.35, 0), { noShadow: true });
    B.box(0.06, 0.04, 0.06, P.x, h + 3.32, P.z, m.galv);
  }

  /* ---------------- per frame ---------------- */
  update(t) {
    this.skyUniforms.uTime.value = t;
    // the signals keep working (electricity is fine): the avenue turns green at 1.4 s, the cross street is red from 1.0 s
    const av = t < 1.4 ? 0 : t < 31 ? 2 : t < 33 ? 1 : t < 51 ? 0 : 2;
    const cr = t < 1.0 ? 2 : t < 1.4 ? 1 : t < 33.5 ? 0 : t < 50 ? 2 : t < 51 ? 1 : 0;
    for (const hd of this.signalHeads || []) {
      const on = hd.group === 'avenue' ? av : cr;
      hd.lamps.forEach((l, i) => l.mat.color.copy(l.color).multiplyScalar(i === on ? 3.0 : 0.05));
    }
  }
}
