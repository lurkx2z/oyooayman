/* =====================================================================
   CITY — one sunny avenue with an open side. You stand on the right-hand sidewalk at the corner of a big
   parking lot: across the lot, an elevated highway runs parallel to the avenue (62 m away, deck 7.5 m up);
   in the lot's far corner, 100 m from you, a pile driver is hammering. Across the avenue, a row of shops
   (the glass that fails later) and the friend who claps. Subclasses the shared Environment.
   ===================================================================== */

const LAYOUT = {
  roadHalf: 7.0, curbH: 0.15, frontage: 12.5, laneW: 3.5,
  crossZ: -270, crossHalf: 7,
  zNear: 220, zFar: -1100,
  busStop: { x: -10.2, z: -44 },
  lot: { x0: 12.5, x1: 12.5, z0: -35, z1: -35 },
};

const SND_CITY = {
  plazaZ: [29.5, -262], plazaX: [13.0, 52.0],      // the parking lot / open ground on your side
  hwy: { x: 62, half: 6.5, top: 6.0, thick: 1.2 }, // the elevated highway (along Z): low, with open rails, so its cars read from the street
  site: { x0: 28, x1: 52, z0: -114, z1: -78 },     // the pile-driver site (fenced)
  rightRowZ: 30.0,                                  // buildings on your side stop here (well behind you: the lot stays open)
};

class SndCity extends Environment {
  build() {
    this.units = [];                     // shop windows (side, za, zb) — the glass that can fail
    this._materials();
    this._sky();
    this._lights();
    this._ground();
    this._plaza();
    this._markings();
    this._buildings();
    this._skyline();
    this._trees();
    this._streetFurniture();
    this._signals();
    this._highway();
    this._site();
    this.batch.build(this.root, 'env');
    // the base ground sits 2 cm under the avenue; in the offline renderer it won the depth test for single frames
    // (a tan flash of the road): drop that one sheet well below, and push it back in depth as well
    this.root.traverse((o) => { if (o.isMesh && o.material === this.m.groundDirt) o.position.y -= 0.25; });
    this._pileRig();
    this._environmentMap();
  }

  _ground() {
    const d = this.m.dirt;
    this.m.dirt = this.m.groundDirt = d.clone();
    Object.assign(this.m.groundDirt, { polygonOffset: true, polygonOffsetFactor: 4, polygonOffsetUnits: 8 });
    super._ground();
    this.m.dirt = d;
  }

  /* ---------------- sky: a clear, warm afternoon (copy-then-own of the Air film's sunny sky) ---------------- */
  _sky() {
    this.sunDir = new THREE.Vector3(0.45, 0.62, 0.64).normalize();   // behind-right of you: the shopfronts across the avenue, the highway and the street ahead are all front-lit
    const zenith = new THREE.Color('#6a8fb6'), horizon = new THREE.Color('#c8d5df');
    this.fogColor = new THREE.Color('#cdd6dc');
    this.skyUniforms = { uZenith: { value: zenith }, uHorizon: { value: horizon }, uGround: { value: new THREE.Color('#8d9590') }, uSunDir: { value: this.sunDir }, uSunColor: { value: new THREE.Color('#ffe2b4') }, uTime: { value: 0 } };
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
            vec2 uv = d.xz / (h + 0.18) * 1.1 + vec2(uTime * 0.006, uTime * 0.002);
            float c = fbm(uv * 1.3);
            float cov = smoothstep(0.46, 0.76, c) * smoothstep(0.0, 0.12, h);
            vec3 lit = mix(vec3(1.0, 0.98, 0.95), uSunColor, 0.25) * 1.05, shade = mix(uHorizon, uZenith, 0.35) * 0.92;
            vec3 cl = mix(shade, lit, smoothstep(0.45, 0.9, fbm(uv * 1.3 + uSunDir.xz * 0.15)));
            col = mix(col, cl, cov * 0.78);
          }
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(2000, 48, 24), mat);
    sky.name = 'sky'; sky.frustumCulled = false; sky.renderOrder = -10;
    this.scene.add(sky); this.sky = sky;
    this.scene.fog = new THREE.FogExp2(this.fogColor.clone(), 0.00045);   // a clear sunny afternoon: far blocks soften, nothing goes milky
    this.scene.background = horizon.clone();
  }

  _lights() {
    const sun = new THREE.DirectionalLight('#ffe6c4', 4.3), tgt = new THREE.Vector3(14, 4, -26);
    sun.position.copy(this.sunDir).multiplyScalar(170).add(tgt); sun.target.position.copy(tgt);
    sun.castShadow = CONFIG.render.shadows;
    sun.shadow.mapSize.set(CONFIG.render.shadowMapSize, CONFIG.render.shadowMapSize);
    const sc = sun.shadow.camera; sc.left = -56; sc.right = 56; sc.top = 76; sc.bottom = -76; sc.near = 20; sc.far = 400;
    sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.035; sun.shadow.radius = 3;
    this.scene.add(sun, sun.target); this.sun = sun;
    this.hemi = new THREE.HemisphereLight('#bcd2ec', '#7d6e5e', 1.45); this.scene.add(this.hemi);
  }

  /* ---------------- the open side: parking lot, grass, the pile-driver site ---------------- */
  _plaza() {
    const B = this.batch, m = this.m, P = SND_CITY, h = LAYOUT.curbH;
    const lotA = Tex.asphalt(19); lotA.map.repeat.set(1, 1);
    const lot = new THREE.MeshStandardMaterial({ map: lotA.map, roughnessMap: lotA.roughnessMap, bumpMap: lotA.bumpMap, bumpScale: 1.0, color: '#b6b4ae', roughness: 0.95, name: 'lotAsphalt' });
    this.m.lot = lot;
    const grass = Mat.std('#5f6f45', { roughness: 1 }), grass2 = Mat.std('#6b7a4c', { roughness: 1 });
    // the lot itself (flush with the sidewalk), then grass out to the highway, then grass beyond
    B.add(Geo.flat(P.plazaX[0], 30, P.plazaZ[1], P.plazaZ[0], h, 10), lot, null, { noShadow: true });
    B.add(Geo.flat(30, P.plazaX[1], -78, P.plazaZ[0], h, 10), lot, null, { noShadow: true });
    B.add(Geo.flat(30, P.plazaX[1], P.plazaZ[1], -114, h - 0.01, 10), grass, null, { noShadow: true });
    B.add(Geo.flat(P.plazaX[1], 140, P.plazaZ[1] - 40, P.plazaZ[0] + 60, 0.0, 12), grass2, null, { noShadow: true });
    B.add(Geo.flat(P.plazaX[0], 30, P.plazaZ[0], P.plazaZ[0] + 0.3, h, 1), m.curb, null, { noShadow: true });
    // parking bays: white lines, wheel stops, light poles
    const y = h + 0.006;
    for (const x0 of [16.0, 26.0, 36.0]) {
      for (let z = 2; z > -74; z -= 2.6) B.add(Geo.flat(x0 - 2.6, x0 + 2.6, z - 0.06, z + 0.06, y, 1), m.markWhite, null, { noShadow: true });
      B.add(Geo.flat(x0 - 0.06, x0 + 0.06, -74, 2, y, 1), m.markWhite, null, { noShadow: true });
    }
    for (const [x, z] of [[20, -100], [22, -128], [41, -14], [41, -48], [24, 18]]) {   // none in the long-lens line to the highway car
      B.add(new THREE.CylinderGeometry(0.09, 0.13, 9, 8), m.metal, Geo.matrix(x, h + 4.5, z));
      B.box(1.4, 0.18, 0.5, x, h + 9.0, z, m.metal); B.box(1.2, 0.04, 0.36, x, h + 8.9, z, m.white, 0, { noShadow: true });
    }
    // a low hedge and bollards along the sidewalk edge (gaps for the entrances)
    const hedge = Mat.std('#3f5133', { roughness: 1, flatShading: true });
    for (const [z0, z1] of [[-21.0, -52.0], [-60.0, -110.0]]) B.box(0.9, 0.85, z0 - z1, 13.55, h + 0.42, (z0 + z1) / 2, hedge);
    for (let z = -1.6; z > -9.6; z -= 2.0) B.add(new THREE.CylinderGeometry(0.11, 0.11, 0.85, 8), m.metal, Geo.matrix(13.4, h + 0.42, z));
    // a grass verge with a few trees at the lot's far end, and a fence along the highway
    for (let z = -162; z > -260; z -= 14) this._tree(18 + 9 * hash1(z), z, this.rng.fork(Math.round(-z)), 1.1);
    for (let z = 5; z > -262; z -= 3) B.box(0.05, 1.8, 3.0, 53.0, h + 0.9, z - 1.5, m.lattice, 0, { noShadow: true });
    for (let z = 5; z > -262; z -= 3) B.add(new THREE.CylinderGeometry(0.04, 0.04, 1.9, 5), m.galv, Geo.matrix(53.0, h + 0.95, z));
  }

  /* ---------------- buildings: shops across the avenue; on your side only behind you ---------------- */
  _building(o) {
    const picked = [], ns = o.nextShop;
    if (ns) o.nextShop = () => { const s = ns(); picked.push(s); return s; };
    super._building(o);
    (this.roofs || (this.roofs = [])).push({ side: o.side, z0: o.z0, z1: o.z1, H: 4.4 + o.floors * this.facades[o.style].style.floorH });
    if (!o.shops) return;
    const w = o.z1 - o.z0, n = Math.max(1, Math.round(w / 7.5)), uw = w / n;
    for (let i = 0; i < n; i++) this.units.push({ side: o.side, za: o.z0 + i * uw + 0.35, zb: o.z0 + (i + 1) * uw - 0.35, doorLeft: !!(picked[i] && picked[i].doorLeft) });
  }

  _buildings() {
    const L = LAYOUT, rng = this.rng.fork(1), P = SND_CITY;
    const cz0 = L.crossZ - L.crossHalf - 5.5, cz1 = L.crossZ + L.crossHalf + 5.5;
    const near = ['redbrick', 'tanbrick', 'cream', 'salmon', 'stone', 'whitebrick', 'sage', 'modern'], far = ['modern', 'glassblue', 'stone', 'cream', 'glassteal', 'tanbrick', 'redbrick', 'whitebrick'];
    const order = [2, 3, 7, 1, 9, 12, 6, 10, 5, 13, 8, 11, 4, 0];
    let shopIdx = 0; const nextShop = () => SHOPS[order[shopIdx++ % order.length]];
    const row = (side, zStart, zEnd, o) => {
      let z = zStart, prev = '';
      while (z > zEnd + 4) {
        let w = rng.range(9, 16); if (z - w < zEnd + 6) w = z - zEnd;
        const pool = Math.abs(z) < 160 ? near : far; let style = rng.pick(pool); if (style === prev) style = rng.pick(pool); prev = style;
        this._building({ side, z0: z - w, z1: z, depth: rng.range(16, 22), style, floors: rng.int(o.fMin, o.fMax), shops: true, nextShop, rng });
        z -= w;
      }
    };
    row(1, L.zNear, P.rightRowZ, { fMin: 3, fMax: 6 });
    row(1, cz0, -420, { fMin: 4, fMax: 9 }); row(1, -420, -900, { fMin: 6, fMax: 14 });
    row(-1, L.zNear, cz1, { fMin: 3, fMax: 6 }); row(-1, cz0, -420, { fMin: 4, fMax: 10 }); row(-1, -420, -900, { fMin: 6, fMax: 14 });
    // on your side the cross street's buildings start beyond the highway, so the lot, the deck and its cars stay in view
    for (const s of [-1, 1]) { const xa = s > 0 ? 74 : 34; this._rowX(s, xa, 260, cz1, 1, rng); this._rowX(s, xa, 260, cz0, -1, rng); }
    // the second row behind the left-hand shops (taller: depth above the rooftops)
    let z = 160;
    while (z > -800) {
      const w = rng.range(14, 30), hgt = rng.range(26, 66) + (z < -200 ? 25 : 0);
      if (!(z - w < cz1 + 2 && z > cz0 - 2)) {
        const st = this.facades[rng.pick(far)], x0 = -40 - rng.range(16, 26), x1 = -40;
        this.batch.add(Geo.boxSides(x0, x1, 0, hgt, z - w, z, st.tileW, st.tileH), st.mat, null);
        this.batch.add(Geo.flat(x0, x1, z - w, z, hgt, 4), this.m.roof, null, { noShadow: true });
      }
      z -= w + rng.range(0, 6);
    }
    // behind you on your side: a taller block so the corner reads as city
    for (let zz = 200; zz > P.rightRowZ + 4; zz -= rng.range(16, 26)) {
      const st = this.facades[rng.pick(far)], hgt = rng.range(28, 60), w = rng.range(14, 22);
      this.batch.add(Geo.boxSides(40, 40 + w, 0, hgt, zz - w, zz, st.tileW, st.tileH), st.mat, null);
      this.batch.add(Geo.flat(40, 40 + w, zz - w, zz, hgt, 4), this.m.roof, null, { noShadow: true });
    }
    // beyond the highway: a mid-rise district facing you across the lot
    let zb = 80;
    while (zb > -520) {
      const w = rng.range(16, 30), hgt = rng.range(14, 46), st = this.facades[rng.pick(['tanbrick', 'cream', 'modern', 'stone', 'glassblue', 'redbrick', 'sage'])];
      const x0 = 78 + rng.range(0, 8), x1 = x0 + rng.range(18, 30);
      this.batch.add(Geo.boxSides(x0, x1, 0, hgt, zb - w, zb, st.tileW, st.tileH), st.mat, null);
      this.batch.add(Geo.flat(x0, x1, zb - w, zb, hgt, 4), this.m.roof, null, { noShadow: true });
      if (rng.next() < 0.45) this.batch.box(rng.range(2, 4), rng.range(1, 2), rng.range(2, 4), x0 + 6, hgt + 0.8, zb - w / 2, this.m.roofLight);
      zb -= w + rng.range(2, 10);
    }
    // the side wall of the corner building beside you (it faces the lot)
    const F = this.facades.redbrick;
    this.batch.add(Geo.quad([L.frontage, 0, P.rightRowZ], [L.frontage + 19, 0, P.rightRowZ], [L.frontage + 19, 16, P.rightRowZ], [L.frontage, 16, P.rightRowZ], 0, 0, 19 / F.tileW, 16 / F.tileH), F.mat, null);
  }

  _trees() {
    const rng = this.rng.fork(3), L = LAYOUT, cz0 = L.crossZ - L.crossHalf - 6, cz1 = L.crossZ + L.crossHalf + 6;
    for (let z = 36; z > -460; z -= 9.5) { if (z < cz1 && z > cz0) continue; if (Math.abs(z - L.busStop.z) < 4 || Math.abs(z - SND.friend.z) < 3) continue; this._tree(-8.15, z + rng.range(-0.8, 0.8), rng, rng.range(0.85, 1.2)); }
    for (let z = 40; z > -460; z -= 11) { if (z < cz1 && z > cz0) continue; if (z < 18 && z > -100) continue; this._tree(8.15, z + rng.range(-0.8, 0.8), rng, rng.range(0.85, 1.2)); }
  }

  _streetFurniture() {
    const B = this.batch, m = this.m, h = LAYOUT.curbH;
    for (const z of [30, -100, -160, -220]) this._streetLight(7.45, z, 1);   // none at -40: it framed the shock front
    for (const z of [12, -18, -78, -138, -198]) this._streetLight(-7.45, z, -1);
    for (const [x, z] of [[7.7, -16], [-7.7, -8], [-7.7, -58]]) {
      B.add(new THREE.CylinderGeometry(0.13, 0.15, 0.6, 10), m.red, Geo.matrix(x, h + 0.3, z));
      B.add(new THREE.SphereGeometry(0.14, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), m.red, Geo.matrix(x, h + 0.6, z));
    }
    for (const [x, z] of [[-7.8, -30], [-7.8, 4], [-7.8, -62]]) {
      B.add(new THREE.CylinderGeometry(0.3, 0.27, 0.95, 12), m.metalGreen, Geo.matrix(x, h + 0.475, z));
      B.add(new THREE.CylinderGeometry(0.33, 0.33, 0.08, 12), m.metalGreen, Geo.matrix(x, h + 0.99, z));
    }
    this._bench(-12.0, -14, Math.PI / 2);
    this._busShelter(LAYOUT.busStop.x, LAYOUT.busStop.z);
    // foreground pieces beside you (the parallax layer): a sign pole and a bin
    const np = Tex.label([['NO', 40], ['STOPPING', 44], ['ANY TIME', 30]], { w: 192, h: 256, bg: '#f4f4f0', fg: '#c0392b', border: '#c0392b' });
    const npm = new THREE.MeshStandardMaterial({ map: np, roughness: 0.6 });
    B.add(new THREE.CylinderGeometry(0.035, 0.035, 2.7, 6), m.metal, Geo.matrix(7.75, h + 1.35, -3.5));
    B.box(0.03, 0.5, 0.42, 7.75, h + 2.35, -3.5, npm, 0, { noShadow: true });
    B.add(new THREE.CylinderGeometry(0.3, 0.27, 0.95, 12), m.metalGreen, Geo.matrix(8.0, h + 0.475, 4.6));
    B.add(new THREE.CylinderGeometry(0.33, 0.33, 0.08, 12), m.metalGreen, Geo.matrix(8.0, h + 0.99, 4.6));
    const nameA = Tex.label(['RIVER RD'], { w: 512, h: 112, font: 70, bg: '#1d6b3c', border: '#ffffff' }), sa = new THREE.MeshStandardMaterial({ map: nameA, roughness: 0.5 });
    for (const [x, z] of [[8.0, -255], [-8.0, -285]]) { B.add(new THREE.CylinderGeometry(0.04, 0.04, 3.3, 6), m.metal, Geo.matrix(x, h + 1.65, z)); B.box(1.2, 0.26, 0.02, x, h + 3.15, z, sa); }
  }

  /* ---------------- the elevated highway, parallel to the avenue ---------------- */
  _highway() {
    const B = this.batch, m = this.m, H = SND_CITY.hwy, x0 = H.x - H.half, x1 = H.x + H.half, z0 = -900, z1 = 400;
    const deck = Mat.std('#9a968d', { roughness: 0.9 }), road = this.m.asphalt;
    B.add(Geo.flat(x0, x1, z0, z1, H.top, 20), road, null, { noShadow: true });
    B.add(Geo.boxSides(x0, x1, H.top - H.thick, H.top, z0, z1, 4, 2), this.m.concrete, null);
    B.add(Geo.flat(x0, x1, z0, z1, H.top - H.thick, 20).scale(1, 1, 1), deck, null, { noShadow: true });
    // underside facing down (flip the winding of a flat by swapping z)
    B.add(Geo.quad([x0, H.top - H.thick, z0], [x1, H.top - H.thick, z0], [x1, H.top - H.thick, z1], [x0, H.top - H.thick, z1]), deck, null, { noShadow: true });
    // open steel rails on both edges (posts + two rails: the cars read through them), a low median barrier; lane lines
    for (const x of [x0 + 0.2, x1 - 0.2]) {
      for (const ry of [0.5, 0.95]) B.box(0.1, 0.1, z1 - z0, x, H.top + ry, (z0 + z1) / 2, m.galv);
      for (let z = z0; z < z1; z += 2.5) B.box(0.1, 1.0, 0.1, x, H.top + 0.5, z, m.galv);
    }
    B.box(0.4, 0.6, z1 - z0, H.x, H.top + 0.3, (z0 + z1) / 2, this.m.curb);
    const y = H.top + 0.01;
    for (const x of [H.x - 3.4, H.x + 3.4]) for (let z = z0; z < z1; z += 12) B.add(Geo.flat(x - 0.07, x + 0.07, z, z + 4, y, 1), m.markWhite, null, { noShadow: true });
    for (const x of [x0 + 0.6, x1 - 0.6]) B.add(Geo.flat(x - 0.07, x + 0.07, z0, z1, y, 40), m.markWhite, null, { noShadow: true });
    // piers (pairs) every 26 m, with a cap beam
    for (let z = 390; z > z0; z -= 26) {
      for (const x of [H.x - 3.2, H.x + 3.2]) B.add(new THREE.CylinderGeometry(0.75, 0.85, H.top - H.thick, 12), this.m.concrete, Geo.matrix(x, (H.top - H.thick) / 2, z));
      B.box(H.half * 2 - 1.2, 0.9, 1.6, H.x, H.top - H.thick - 0.45, z, this.m.concrete);
    }
    // lamp posts on the median
    for (let z = 380; z > z0; z -= 34) {
      B.add(new THREE.CylinderGeometry(0.07, 0.1, 9, 8), m.metal, Geo.matrix(H.x, H.top + 4.5, z));
      for (const s of [-1, 1]) { B.add(new THREE.CylinderGeometry(0.04, 0.05, 2.2, 6), m.metal, Geo.matrix(H.x + s * 1.0, H.top + 8.9, z, 0, 0, Math.PI / 2)); B.box(0.6, 0.14, 0.3, H.x + s * 2.0, H.top + 8.9, z, m.metal); }
    }
    // a green overhead sign gantry (gives the highway its scale)
    const sg = Tex.label([['DOWNTOWN', 54], ['EXIT 14 · 1 KM', 34]], { w: 512, h: 220, bg: '#1d6b3c', border: '#ffffff' });
    const sgm = new THREE.MeshStandardMaterial({ map: sg, roughness: 0.5 });
    const gz = -58;
    for (const x of [x0 + 0.4, x1 - 0.4]) B.box(0.3, 6.2, 0.3, x, H.top + 3.1, gz, m.galv);
    B.box(H.half * 2, 0.35, 0.35, H.x, H.top + 6.1, gz, m.galv);
    B.add(Geo.quad([H.x - 5.8, H.top + 4.2, gz + 0.2], [H.x - 0.8, H.top + 4.2, gz + 0.2], [H.x - 0.8, H.top + 6.3, gz + 0.2], [H.x - 5.8, H.top + 6.3, gz + 0.2]), sgm, null, { noShadow: true });
    B.add(Geo.quad([H.x - 0.8, H.top + 4.2, gz - 0.2], [H.x - 5.8, H.top + 4.2, gz - 0.2], [H.x - 5.8, H.top + 6.3, gz - 0.2], [H.x - 0.8, H.top + 6.3, gz - 0.2]), sgm, null, { noShadow: true });
  }

  /* ---------------- the pile-driver site: hoarding, a pile stack, a site hut ---------------- */
  _site() {
    const B = this.batch, m = this.m, S = SND_CITY.site, h = LAYOUT.curbH;
    B.add(Geo.flat(S.x0, S.x1, S.z0, S.z1, h + 0.012, 6), m.dirt, null, { noShadow: true });
    const HH = 2.2;
    // hoarding on the two sides that face you (front at z1, side at x0)
    for (let x = S.x0; x < S.x1; x += 3) B.add(Geo.quad([x, h, S.z1], [x + 3, h, S.z1], [x + 3, h + 1.9, S.z1], [x, h + 1.9, S.z1], 0, 0, 1, 1), m.lattice, null, { noShadow: true });
    B.add(Geo.quad([S.x0, h, S.z0], [S.x0, h, S.z1], [S.x0, h + HH, S.z1], [S.x0, h + HH, S.z0], 0, 0, (S.z1 - S.z0) / 8, 1), m.hoarding, null);
    for (let x = S.x0; x <= S.x1; x += 2.4) B.box(0.1, HH + 0.1, 0.1, x, h + HH / 2, S.z1 - 0.1, m.plywood);
    // a stack of steel piles waiting, a site hut, a skip, cones
    for (let i = 0; i < 6; i++) B.add(new THREE.CylinderGeometry(0.32, 0.32, 9, 10), m.primer, Geo.matrix(33 + (i % 3) * 0.66, h + 0.32 + Math.floor(i / 3) * 0.6, -86 - 0, Math.PI / 2, 0, 0));
    const wall = Mat.std('#d9d3c4', { roughness: 0.8 }), blue = Mat.std('#2d5f8f', { roughness: 0.7 });
    B.box(6, 2.6, 2.6, 46, h + 1.3, -82, wall); B.box(6.05, 0.25, 2.65, 46, h + 2.55, -82, blue);
    B.box(3.4, 1.4, 1.8, 31.5, h + 0.7, -104, Mat.std('#c2802e', { roughness: 0.7 }));
    for (let i = 0; i < 5; i++) B.add(new THREE.ConeGeometry(0.18, 0.55, 8), m.orange, Geo.matrix(29 + i * 1.6, h + 0.28, -77.2));
  }

  // the pile driver: crawler base, leader mast, the hammer that drops on the pile (moves in update)
  _pileRig() {
    const P = SND.pile, g = new THREE.Group(), y0 = LAYOUT.curbH;
    const yel = Mat.std('#d6a21e', { roughness: 0.55 }), dark = Mat.std('#2a2c2e', { roughness: 0.6, metalness: 0.3 }), steel = this.m.steel;
    const add = (geo, mat, x, y, z) => { const mm = new THREE.Mesh(geo, mat); mm.position.set(x, y, z); mm.castShadow = true; mm.receiveShadow = true; g.add(mm); return mm; };
    add(new THREE.BoxGeometry(5.2, 1.0, 1.0), dark, 2.6, 0.5, -1.4); add(new THREE.BoxGeometry(5.2, 1.0, 1.0), dark, 2.6, 0.5, 1.4);   // tracks
    add(new THREE.BoxGeometry(4.0, 1.4, 3.0), yel, 3.0, 1.7, 0);                                                                     // body
    add(new THREE.BoxGeometry(1.6, 1.6, 1.4), yel, 1.6, 3.1, 0.75);                                                                  // cab
    add(new THREE.BoxGeometry(1.2, 1.0, 0.04), new THREE.MeshStandardMaterial({ color: '#2a3a46', roughness: 0.15, metalness: 0.5, name: 'cabGlass' }), 1.6, 3.3, 1.47);
    const leader = add(new THREE.BoxGeometry(0.7, 19, 0.7), yel, 0, 9.9, 0);                                                         // the mast
    add(new THREE.BoxGeometry(3.4, 0.25, 0.25), dark, 1.7, 15.0, 0).rotation.z = -0.62;                                             // back stay
    add(new THREE.BoxGeometry(0.9, 0.5, 0.9), dark, 0, 19.6, 0);
    this.pileHammer = add(new THREE.BoxGeometry(1.0, 2.4, 1.0), Mat.std('#c4361c', { roughness: 0.5 }), -0.75, 6, 0);   // red: it has to read against the yellow mast at 100 m
    this.pilePile = add(new THREE.CylinderGeometry(0.3, 0.3, 4, 12), steel, -0.75, 2, 0);
    g.position.set(P.x + 0.75, y0, P.z);
    g.rotation.y = -0.35;
    this.scene.add(g); this.pileRig = g; this.leader = leader;
  }

  // the hammer: drops onto the pile at each hit time (fall ~0.28 s), lifts again; after the last hit it rests
  pileHammerY(t) {
    const hits = SND_PILE_HITS, P = SND.pile;
    let k = -1; for (let i = 0; i < hits.length; i++) if (hits[i] <= t) k = i;
    const pileTop = 4.0 - 0.06 * Math.max(0, k + 1);                      // the pile sinks a little with every blow
    const rest = pileTop + 1.2;
    if (k === hits.length - 1 && t >= hits[k]) return rest;
    const next = k + 1 < hits.length ? hits[k + 1] : null, since = k >= 0 ? t - hits[k] : t - (P.t0 - P.period);
    const lift = rest + 2.6 * MathX.smooth(since, 0.25, 0.85);
    if (next !== null && t > next - 0.28) { const u = (t - (next - 0.28)) / 0.28; return lift - (lift - rest) * u * u; }
    return lift;
  }

  update(t) {
    this.skyUniforms.uTime.value = t;
    // signals: a normal repeating cycle (the base class sequence fed time modulo 18 s)
    this._updateSignals(t % 18, 1);
    if (this.dynamic.ad) this.dynamic.ad.emissiveIntensity = 0.6;
    if (this.pileHammer) {
      const y = this.pileHammerY(t);
      this.pileHammer.position.y = y;
      const k = SND_PILE_HITS.filter((h) => h <= t).length;
      this.pilePile.scale.y = 1; this.pilePile.position.y = 2.0 - 0.06 * k;
    }
  }
}
