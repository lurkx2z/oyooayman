/* =====================================================================
   GRAVITY CITY — one sunny avenue that holds every beat:
     your side (right): a bench, the old shop with the tired awning, the stone building with the scaffold and its
       loading bay (the builders' pickup parked under it), then the corner;
     across (left): the old brick building with the wooden water tank on its roof, then the building site (a steel
       frame going up) with the mobile crane set up in the far lanes, lifting steel off a flatbed;
     in the road: a raised crossing (a speed table) right in front of you.
   Subclasses the shared Environment (sunny sky and light copied from the Air film's city, then owned here).
   The moving / breaking pieces (crane, scaffold, awning, tank) live in site.js; the cars in traffic.js.
   ===================================================================== */

const LAYOUT = {
  roadHalf: 7.0, curbH: 0.15, frontage: 12.5, laneW: 3.5,
  crossZ: -64, crossHalf: 7,
  zNear: 200, zFar: -760,
  busStop: { x: -10.3, z: 14.5 },
  lot: { x0: 12.5, x1: 12.5, z0: -40, z1: -40 },
};

const GV_CITY = {
  // right side, from you toward the junction
  bench: { x: 11.75, z: -2.4 },
  shop: { z0: -10.0, z1: -3.4, style: 'tanbrick', floors: 4 },     // the old shop with the awning
  awning: { z0: -9.4, z1: -4.0, out: 2.1, y: 3.3 },                 // the awning (dynamic, site.js)
  stone: { z0: -26.0, z1: -10.0, style: 'stone', floors: 5 },       // the scaffolded building
  scaffold: { x0: 10.95, x1: 12.4, z0: -24.5, z1: -11.4, lift: 2.0, lifts: 6 },
  bay: { x0: 8.75, x1: 10.95, z0: -17.6, z1: -14.4, y: 12.0 },     // the loading bay off the top lift
  pickup: { x: 9.25, z: -15.6 },                                    // the builders' pickup, parked on the sidewalk under the bay
  corner: { z0: -50.5, z1: -26.0, style: 'redbrick', floors: 6 },
  // left side
  tankHouse: { z0: -11.0, z1: 7.0, style: 'redbrick', floors: 4 },  // the old building with the water tank
  tank: { x: -18.5, z: -3.0, legs: 4.2, r: 2.0, h: 3.6 },
  site: { x0: -36, x1: -12.5, z0: -48, z1: -11.0 },
  frame: { xs: [-16.5, -22.5, -28.5], zs: [-15.5, -22.5, -29.5, -36.5, -43.5], levels: [4.2, 8.2, 12.2, 16.2, 20.2] },
  crane: { x: -4.4, z: -33.5 },                                     // the mobile crane's slewing centre (far lanes)
  boomAim: { x: -2.0, z: -19.5 },                                  // where the boom points (over the flatbed's deck)
  flatbed: { x: -0.75, z: -16.5 },                                  // (its deck's middle sits under where the load will fall)
  table: { z0: -8.6, z1: -5.4, ramp: 1.1, h: 0.1 },                 // the raised crossing (speed table)
  treesR: [16, 6.5, -56, -74, -84, -94],
  treesL: [24, 14.5, -52, -72, -82, -92],
};

// height of the road surface (the speed table) at (x, z): 0 on the plain road
function gvRoadH(x, z) {
  const T = GV_CITY.table;
  if (Math.abs(x) > LAYOUT.roadHalf) return LAYOUT.curbH;
  if (z < T.z0 - T.ramp || z > T.z1 + T.ramp) return 0;
  if (z < T.z0) return T.h * MathX.smooth(z, T.z0 - T.ramp, T.z0);
  if (z > T.z1) return T.h * (1 - MathX.smooth(z, T.z1, T.z1 + T.ramp));
  return T.h;
}

class GvCity extends Environment {
  build() {
    this._materials();
    this._sky();
    this._lights();
    this._ground();
    this._table();
    this._markings();
    this._buildings();
    this._skyline();
    this._trees();
    this._streetFurniture();
    this._signals();
    this._siteGround();
    this._hazeCards();
    this.batch.build(this.root, 'env');
    this._environmentMap();
  }

  /* ---------------- sky: a clear, warm afternoon (copied from the Air film's city, owned here) ---------------- */
  _sky() {
    this.sunDir = new THREE.Vector3(-0.32, 0.6, 0.73).normalize();
    const zenith = new THREE.Color('#4a8bd0'), horizon = new THREE.Color('#c6d8e8');
    this.fogColor = new THREE.Color('#cbd6de');
    this.skyUniforms = { uZenith: { value: zenith }, uHorizon: { value: horizon }, uGround: { value: new THREE.Color('#8d9590') }, uSunDir: { value: this.sunDir }, uSunColor: { value: new THREE.Color('#ffe4b8') }, uTime: { value: 0 }, uDust: { value: 0 } };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.skyUniforms, side: THREE.BackSide, depthWrite: false,
      vertexShader: /* glsl */`varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */`
        uniform vec3 uZenith, uHorizon, uGround, uSunDir, uSunColor; uniform float uTime, uDust; varying vec3 vDir;
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
            vec2 uv = d.xz / (h + 0.18) * 0.42 + vec2(uTime * 0.006, uTime * 0.0015);
            float c = fbm(uv * 1.3);
            float cov = smoothstep(0.62, 0.84, c) * smoothstep(0.0, 0.12, h);
            vec3 lit = mix(vec3(1.0, 0.98, 0.95), uSunColor, 0.25) * 1.05, shade = mix(uHorizon, uZenith, 0.35) * 0.92;
            vec3 cl = mix(shade, lit, smoothstep(0.45, 0.9, fbm(uv * 1.3 + uSunDir.xz * 0.15)));
            col = mix(col, cl, cov * 0.8);
          }
          col = mix(col, vec3(0.62, 0.6, 0.55), uDust * (1.0 - smoothstep(0.0, 0.5, h)));
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
    const sun = new THREE.DirectionalLight('#ffe6c4', 4.3), tgt = new THREE.Vector3(0, 4, -18);
    sun.position.copy(this.sunDir).multiplyScalar(160).add(tgt); sun.target.position.copy(tgt);
    sun.castShadow = CONFIG.render.shadows;
    sun.shadow.mapSize.set(CONFIG.render.shadowMapSize, CONFIG.render.shadowMapSize);
    const sc = sun.shadow.camera; sc.left = -46; sc.right = 46; sc.top = 64; sc.bottom = -64; sc.near = 20; sc.far = 400;
    sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.035; sun.shadow.radius = 3;
    this.scene.add(sun, sun.target); this.sun = sun;
    this.hemi = new THREE.HemisphereLight('#bcd2ec', '#7d6e5e', 1.45); this.scene.add(this.hemi);
  }

  // the raised crossing in front of you: a 10 cm table with ramps, zebra stripes on top
  _table() {
    const T = GV_CITY.table, B = this.batch, m = this.m, L = LAYOUT.roadHalf;
    const zs = [];
    for (let z = T.z0 - T.ramp; z <= T.z1 + T.ramp + 1e-6; z += T.ramp / 4) zs.push(z);
    const pos = [], uv = [];
    for (let i = 0; i < zs.length - 1; i++) {
      const za = zs[i], zb = zs[i + 1], ya = gvRoadH(0, za) + 0.004, yb = gvRoadH(0, zb) + 0.004;
      pos.push(-L, ya, za, L, ya, za, L, yb, zb, -L, ya, za, L, yb, zb, -L, yb, zb);
      uv.push(0, za / 8, 1.75, za / 8, 1.75, zb / 8, 0, za / 8, 1.75, zb / 8, 0, zb / 8);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
    B.add(g, m.asphalt, null, { noShadow: true });
    for (let x = -6.5; x < 6.6; x += 1.0) B.add(Geo.flat(x, x + 0.55, T.z0 + 0.2, T.z1 - 0.2, T.h + 0.01, 1), m.markWhite, null, { noShadow: true });
    // the ramps' warning chevrons
    for (const zr of [T.z0 - T.ramp * 0.5, T.z1 + T.ramp * 0.5]) for (let x = -6.2; x < 6.3; x += 2.5) B.add(Geo.flat(x, x + 0.9, zr - 0.08, zr + 0.08, gvRoadH(0, zr) + 0.012, 1), m.markYellow, null, { noShadow: true });
  }

  _markings() {
    const B = this.batch, m = this.m, L = LAYOUT, y = 0.006, cz0 = L.crossZ - L.crossHalf, cz1 = L.crossZ + L.crossHalf, T = GV_CITY.table;
    // (the markings stop short of the raised crossing)
    const segs = [[cz1 + 4, T.z0 - T.ramp - 0.3], [T.z1 + T.ramp + 0.3, L.zNear], [L.zFar, cz0 - 4]];
    for (const [z0, z1] of segs) {
      for (const x of [-0.16, 0.16]) B.add(Geo.flat(x - 0.06, x + 0.06, z0, z1, y, 1), m.markYellow, null, { noShadow: true });
      for (const x of [3.5, -3.5]) for (let z = z0; z < z1 - 3; z += 9) B.add(Geo.flat(x - 0.07, x + 0.07, z, Math.min(z + 3, z1), y, 1), m.markWhite, null, { noShadow: true });
      for (const x of [-6.75, 6.75]) B.add(Geo.flat(x - 0.07, x + 0.07, z0, z1, y, 1), m.markWhite, null, { noShadow: true });
    }
    for (const zc of [cz1 + 2, cz0 - 2]) for (let x = -6.5; x < 6.6; x += 1.0) B.add(Geo.flat(x, x + 0.55, zc - 1.6, zc + 1.6, y, 1), m.markWhite, null, { noShadow: true });
    B.add(Geo.flat(0.3, 6.9, cz1 + 3.8, cz1 + 4.25, y, 1), m.markWhite, null, { noShadow: true });
    for (const xc of [L.roadHalf + 2, -L.roadHalf - 2]) for (let z = cz0 + 0.4; z < cz1 - 0.4; z += 1.0) B.add(Geo.flat(xc - 1.6, xc + 1.6, z, z + 0.55, y, 1), m.markWhite, null, { noShadow: true });
    // a patched utility trench across the far lanes, right where the crane's front outrigger stands
    const C = GV_CITY.crane;
    B.add(Geo.flat(-7.0, -0.2, C.z + 4.2, C.z + 5.6, 0.004, 2), Mat.std('#3a3a3a', { roughness: 0.9 }), null, { noShadow: true });
  }

  // a building the story uses, with no random rooftop tank (this one's tank, if any, is the hero)
  _hero(side, Z, rng, nextShop, opts = {}) {
    this._noTank = true;
    this._building(Object.assign({ side, z0: Z.z0, z1: Z.z1, depth: 18, style: Z.style, floors: Z.floors, shops: true, nextShop, rng }, opts));
    this._noTank = false;
  }
  _waterTank(x, y, z) { if (!this._noTank) super._waterTank(x, y, z); }

  _buildings() {
    const L = LAYOUT, rng = this.rng.fork(1), C = GV_CITY;
    const cz0 = L.crossZ - L.crossHalf - 5.5, cz1 = L.crossZ + L.crossHalf + 5.5;
    const near = ['redbrick', 'tanbrick', 'cream', 'salmon', 'stone', 'whitebrick', 'sage', 'modern'], far = ['modern', 'glassblue', 'stone', 'cream', 'glassteal', 'tanbrick', 'redbrick', 'whitebrick'];
    const order = [2, 3, 7, 1, 9, 12, 6, 10, 5, 13, 8, 11, 4, 0];
    let shopIdx = 0; const nextShop = () => SHOPS[order[shopIdx++ % order.length]];
    const row = (side, zStart, zEnd, o) => {
      let z = zStart, prev = '';
      while (z > zEnd + 4) {
        let w = rng.range(9, 17); if (z - w < zEnd + 6) w = z - zEnd;
        const pool = Math.abs(z) < 140 ? near : far; let style = rng.pick(pool); if (style === prev) style = rng.pick(pool); prev = style;
        this._building({ side, z0: z - w, z1: z, depth: rng.range(16, 22), style, floors: rng.int(o.fMin, o.fMax), shops: true, nextShop, rng });
        z -= w;
      }
    };
    // right: behind you, the near block, then the story buildings up to the junction
    row(1, L.zNear, C.shop.z1, { fMin: 3, fMax: 6 });
    this._hero(1, C.shop, rng, () => SHOPS.find((s) => s.name === 'HARDWARE'));
    this._hero(1, C.stone, rng, nextShop);
    this._hero(1, C.corner, rng, nextShop);
    row(1, C.corner.z0, cz1, { fMin: 4, fMax: 6 });
    row(1, cz0, -380, { fMin: 4, fMax: 9 }); row(1, -380, -760, { fMin: 6, fMax: 14 });
    // left: the far block, the tank house, the building site gap, then the block to the junction
    row(-1, L.zNear, C.tankHouse.z1, { fMin: 3, fMax: 6 });
    this._hero(-1, C.tankHouse, rng, nextShop);
    row(-1, C.site.z0, cz1, { fMin: 4, fMax: 7 });
    row(-1, cz0, -380, { fMin: 4, fMax: 10 }); row(-1, -380, -760, { fMin: 6, fMax: 14 });
    for (const s of [-1, 1]) { this._rowX(s, 34, 260, cz1, 1, rng); this._rowX(s, 34, 260, cz0, -1, rng); }
    // the taller second row behind (depth over the rooftops): tall towers stand, they don't fall
    for (const s of [-1, 1]) {
      let z = 120;
      while (z > -700) {
        const w = rng.range(14, 30), h = rng.range(26, 70) + (z < -200 ? 25 : 0);
        if (!(z - w < cz1 + 2 && z > cz0 - 2)) {
          const st = this.facades[rng.pick(far)], x0 = s > 0 ? 40 : -40 - rng.range(16, 26), x1 = s > 0 ? 40 + rng.range(16, 26) : -40;
          this.batch.add(Geo.boxSides(x0, x1, 0, h, z - w, z, st.tileW, st.tileH), st.mat, null);
          this.batch.add(Geo.flat(x0, x1, z - w, z, h, 4), this.m.roof, null, { noShadow: true });
        }
        z -= w + rng.range(0, 6);
      }
    }
  }

  _trees() {
    const rng = this.rng.fork(3);
    for (const z of GV_CITY.treesR) this._tree(8.15, z, rng, rng.range(0.9, 1.15));
    for (const z of GV_CITY.treesL) this._tree(-8.15, z, rng, rng.range(0.9, 1.15));
  }

  _streetFurniture() {
    const B = this.batch, m = this.m, h = LAYOUT.curbH;
    for (const z of [26, -36, -96]) this._streetLight(7.45, z, 1);
    for (const z of [32, -6, -58, -110]) this._streetLight(-7.45, z, -1);
    for (const [x, z] of [[7.7, 9.5], [-7.7, 2], [7.7, -48]]) {
      B.add(new THREE.CylinderGeometry(0.13, 0.15, 0.6, 10), m.red, Geo.matrix(x, h + 0.3, z));
      B.add(new THREE.SphereGeometry(0.14, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), m.red, Geo.matrix(x, h + 0.6, z));
    }
    for (const [x, z] of [[7.75, -27.5], [-7.8, 6], [7.75, 12]]) {
      B.add(new THREE.CylinderGeometry(0.3, 0.27, 0.95, 12), m.metalGreen, Geo.matrix(x, h + 0.475, z));
      B.add(new THREE.CylinderGeometry(0.33, 0.33, 0.08, 12), m.metalGreen, Geo.matrix(x, h + 0.99, z));
    }
    // the bench the old man sits on (back against the shopfront, facing the street)
    this._bench(GV_CITY.bench.x, GV_CITY.bench.z, -Math.PI / 2);
    this._busShelter(LAYOUT.busStop.x, LAYOUT.busStop.z);
    // a crossing sign at the raised crossing
    const T = GV_CITY.table, signM = new THREE.MeshStandardMaterial({ map: Tex.label(['▲', 'CROSSING'], { w: 256, h: 256, font: 52, bg: '#e8c21c', fg: '#1a1a1a', border: '#1a1a1a' }), roughness: 0.5 });
    for (const [x, z] of [[7.5, 4.2], [-7.5, T.z0 - 0.6]]) { B.add(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 6), m.metal, Geo.matrix(x, h + 1.3, z)); B.box(0.62, 0.62, 0.02, x, h + 2.45, z, signM, 0, { noShadow: true }); }
    const nameA = Tex.label(['ELM ST'], { w: 512, h: 112, font: 70, bg: '#1d6b3c', border: '#ffffff' }), sa = new THREE.MeshStandardMaterial({ map: nameA, roughness: 0.5 });
    for (const [x, z] of [[8.0, -51.5], [-8.0, -76.5]]) { B.add(new THREE.CylinderGeometry(0.04, 0.04, 3.3, 6), m.metal, Geo.matrix(x, h + 1.65, z)); B.box(1.2, 0.26, 0.02, x, h + 3.15, z, sa); }
  }

  // the building site's ground, hoarding and the steel frame going up
  _siteGround() {
    const B = this.batch, m = this.m, S = GV_CITY.site, F = GV_CITY.frame, h = LAYOUT.curbH, HH = 2.5, hx = -LAYOUT.frontage - 0.05;
    B.add(Geo.flat(S.x0, -LAYOUT.frontage, S.z0, S.z1, 0.01, 4), m.dirt, null, { noShadow: true });
    // hoarding along the sidewalk (front faces +X), with a gate opposite the crane
    const gate = [-27.0, -21.0];
    for (const [za, zb] of [[S.z0, gate[0]], [gate[1], S.z1]]) {
      B.add(Geo.quad([hx, h, zb], [hx, h, za], [hx, h + HH, za], [hx, h + HH, zb], 0, 0, (zb - za) / 8, 1), m.hoarding, null);
      B.box(0.06, HH, zb - za, hx - 0.04, h + HH / 2, (za + zb) / 2, m.plywood);
      for (let z = za; z <= zb; z += 2.4) B.box(0.1, HH + 0.1, 0.1, hx - 0.12, h + HH / 2, z, m.plywood);
    }
    for (const z of gate) B.box(0.18, 3.2, 0.18, hx, h + 1.6, z, m.metal);
    // the steel frame: columns, beams, two concrete decks; the top storey still open
    const top = F.levels[F.levels.length - 1];
    for (const x of F.xs) for (const z of F.zs) { B.box(0.34, top + 0.6, 0.34, x, (top + 0.6) / 2, z, m.primer); }
    F.levels.forEach((y, li) => {
      for (const x of F.xs) B.box(0.22, 0.44, F.zs[0] - F.zs[F.zs.length - 1] + 0.3, x, y, (F.zs[0] + F.zs[F.zs.length - 1]) / 2, m.primer);
      for (const z of F.zs) B.box(F.xs[0] - F.xs[2] + 0.3, 0.44, 0.22, (F.xs[0] + F.xs[2]) / 2, y, z, m.primer);
      if (li < 3) B.box(F.xs[0] - F.xs[2] + 0.9, 0.25, F.zs[0] - F.zs[F.zs.length - 1] + 0.9, (F.xs[0] + F.xs[2]) / 2, y + 0.03, (F.zs[0] + F.zs[F.zs.length - 1]) / 2, m.concrete);
    });
    // diagonal bracing in two bays, a stair tower, safety rails on the decks
    for (const [x, z0, z1] of [[F.xs[0], F.zs[1], F.zs[2]], [F.xs[0], F.zs[3], F.zs[4]]]) for (let i = 0; i < F.levels.length - 1; i++) {
      const y0 = F.levels[i], y1 = F.levels[i + 1], len = Math.hypot(z1 - z0, y1 - y0);
      B.add(new THREE.BoxGeometry(0.12, len, 0.12), m.primer, Geo.matrix(x, (y0 + y1) / 2, (z0 + z1) / 2, Math.atan2(z0 - z1, y1 - y0) * (i % 2 ? 1 : -1)));
    }
    for (let li = 0; li < 3; li++) { const y = F.levels[li] + 0.16; for (const y2 of [0.55, 1.08]) B.box(0.05, 0.05, F.zs[0] - F.zs[4] + 0.6, F.xs[0] + 0.45, y + y2, (F.zs[0] + F.zs[4]) / 2, m.yellow); for (let z = F.zs[0]; z >= F.zs[4]; z -= 1.75) B.box(0.05, 1.1, 0.05, F.xs[0] + 0.45, y + 0.55, z, m.yellow); }
    // material stacks, a site cabin, cones
    for (let i = 0; i < 4; i++) B.box(5.5, 0.3, 0.3, -24 - i * 0.05, 0.16 + i * 0.3, -12.8 - i * 0.32, m.primer);
    const cab = Mat.std('#dcd8cc', { roughness: 0.75 }), cabB = Mat.std('#2d5f8f', { roughness: 0.6 });
    B.box(6.0, 2.6, 2.4, -30.5, 1.3, -13.2, cab); B.box(6.0, 2.6, 2.4, -30.5, 3.95, -13.2, cabB);
    for (const z of [-21.4, -26.6]) { B.add(new THREE.ConeGeometry(0.18, 0.7, 12), m.orange, Geo.matrix(-12.1, h + 0.35, z)); }
  }

  update(t) {
    if (this.haze && this.camera) {
      const cp = this.camera.position;
      for (const hz of this.haze) {
        hz.m.rotation.y = Math.atan2(cp.x - hz.m.position.x, cp.z - hz.m.position.z);
        hz.mat.uniforms.uOff.value.x = hash1(hz.drift * 1000) + t * hz.drift;
        hz.mat.uniforms.uColor.value.copy(this.scene.fog.color).multiplyScalar(1.03);
        hz.mat.uniforms.uNear.value = MathX.smooth(Math.hypot(cp.x - hz.m.position.x, cp.z - hz.m.position.z), 14, 30);
      }
    }
    this.skyUniforms.uTime.value = t;
    this._updateSignals(t % 18, 1);
  }
}
