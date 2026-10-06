/* =====================================================================
   AIR CITY — one avenue that holds everything: your side has a shop with
   a hanging sign, a café with an awning and umbrellas, a scaffold tower
   on a cordoned sidewalk, a building site with a hut, and the corner
   building with the rooftop billboard; across the street, shops, trees,
   a bus shelter and the people playing catch. The trees bend in the wind
   in their shaders (shadows too). Subclasses the shared Environment.
   ===================================================================== */

const LAYOUT = {
  roadHalf: 7.0, curbH: 0.15, frontage: 12.5, laneW: 3.5,
  crossZ: -62, crossHalf: 7,
  zNear: 200, zFar: -760,
  busStop: { x: -10.3, z: -40.5 }, cafe: { x: 11.0, z: -11 },
  lot: { x0: 12.5, x1: 30, z0: -34, z1: -21.6 },
};

const AIR_CITY = {
  blade: { z0: 3.0, z1: -6.0, sign: [11.75, 3.55, -7.4] },
  stone: { z0: -13.0, z1: -6.0 },
  cafe: { z0: -21.6, z1: -13.0 },
  scaffold: { x0: 11.2, x1: 12.45, z0: -12.0, z1: -8.5, top: 12.0 },
  lot: { z0: -34, z1: -21.6 },
  corner: { z0: -49.5, z1: -34, floors: 4, style: 'redbrick' },
  billboard: { x: 13.9, z: -41.5, w: 14, h: 5, base: 19.2, yaw: 0.6 },   // panel centre x, z; bottom edge height; turned toward you
  hut: { x: 17.5, z: -27.5, w: 6, d: 2.6, h: 5.6 },
  treesR: [14, -16.0, -26, -36, -54, -72, -81.5, -91, -100.5],
  treesL: [12, 2.5, -7, -16.5, -26, -35.5, -54, -72, -81.5, -91, -100.5],
  branchTree: [8.15, -16.0],
};

class AirCity extends Environment {
  build() {
    this._materials();
    this._windMaterials();
    this._sky();
    this._lights();
    this._ground();
    this._markings();
    this._buildings();
    this._skyline();
    this._trees();
    this._streetFurniture();
    this._signals();
    this._site();
    this.batch.build(this.root, 'env');
    this._windShadows();
    this._environmentMap();
  }

  // trees bend in their vertex shaders: displacement along the wind grows with height², plus a leafy flutter
  _windMaterials() {
    this.windU = { uWind: { value: new THREE.Vector3(-1, 0, 0) }, uBend: { value: 0 }, uFlutter: { value: 0 }, uTime: { value: 0 } };
    const U = this.windU;
    this._bendify = (mat, leafy) => {
      mat.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, U);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform vec3 uWind; uniform float uBend, uFlutter, uTime;')
          .replace('#include <begin_vertex>', `#include <begin_vertex>
            { float hh = max(0.0, transformed.y - 0.15) / 5.5; float gust = 0.75 + 0.25 * sin(uTime * 1.7 + transformed.z * 0.13 + transformed.x * 0.05) + 0.12 * sin(uTime * 4.3 + transformed.z * 0.7);
              float d = uBend * gust * hh * hh * 1.7;
              transformed.xz += uWind.xz * d; transformed.y -= 0.35 * d * d / 5.5;
              ${leafy ? 'transformed += vec3(sin(uTime * 13.0 + transformed.y * 3.1 + transformed.z * 2.3), sin(uTime * 11.0 + transformed.x * 2.7) * 0.6, cos(uTime * 12.0 + transformed.x * 1.9)) * uFlutter * 0.06 * hh;' : ''} }`);
      };
      mat.customProgramCacheKey = () => 'bend' + (leafy ? 1 : 0);
    };
    this._bendify(this.m.bark, false);
    this._bendify(this.m.foliage, true);
  }
  _windShadows() {
    const mk = (leafy) => { const d = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }); this._bendify(d, leafy); return d; };
    const db = mk(false), df = mk(true);
    this.root.traverse((o) => { if (o.isMesh && o.material === this.m.bark) o.customDepthMaterial = db; if (o.isMesh && o.material === this.m.foliage) o.customDepthMaterial = df; });
  }

  /* ---------------- sky: a bright, breezy afternoon; the clouds run with the wind ---------------- */
  _sky() {
    this.sunDir = new THREE.Vector3(-0.3, 0.62, 0.72).normalize();
    const zenith = new THREE.Color('#4f8fd2'), horizon = new THREE.Color('#c8dbea');
    this.fogColor = new THREE.Color('#cfd9e0');
    this.skyUniforms = { uZenith: { value: zenith }, uHorizon: { value: horizon }, uGround: { value: new THREE.Color('#8d9590') }, uSunDir: { value: this.sunDir }, uSunColor: { value: new THREE.Color('#ffe4b8') }, uTime: { value: 0 }, uCover: { value: 0 } };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.skyUniforms, side: THREE.BackSide, depthWrite: false,
      vertexShader: /* glsl */`varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */`
        uniform vec3 uZenith, uHorizon, uGround, uSunDir, uSunColor; uniform float uTime, uCover; varying vec3 vDir;
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
            vec2 uv = d.xz / (h + 0.18) * 0.42 + vec2(uTime * 0.02, uTime * 0.004);
            float c = fbm(uv * 1.3);
            float cov = smoothstep(0.6 - 0.1 * uCover, 0.82 - 0.1 * uCover, c) * smoothstep(0.0, 0.12, h);
            vec3 lit = mix(vec3(1.0, 0.98, 0.95), uSunColor, 0.25) * 1.05, shade = mix(uHorizon, uZenith, 0.35) * 0.92;
            vec3 cl = mix(shade, lit, smoothstep(0.45, 0.9, fbm(uv * 1.3 + uSunDir.xz * 0.15)));
            col = mix(col, cl, cov * 0.82);
          }
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(2000, 48, 24), mat);
    sky.name = 'sky'; sky.frustumCulled = false; sky.renderOrder = -10;
    this.scene.add(sky); this.sky = sky;
    this.scene.fog = new THREE.FogExp2(this.fogColor.clone(), 0.0012);
    this.scene.background = horizon.clone();
  }

  _lights() {
    const sun = new THREE.DirectionalLight('#ffe6c4', 4.2), tgt = new THREE.Vector3(2, 4, -22);
    sun.position.copy(this.sunDir).multiplyScalar(160).add(tgt); sun.target.position.copy(tgt);
    sun.castShadow = CONFIG.render.shadows;
    sun.shadow.mapSize.set(CONFIG.render.shadowMapSize, CONFIG.render.shadowMapSize);
    const sc = sun.shadow.camera; sc.left = -48; sc.right = 48; sc.top = 72; sc.bottom = -72; sc.near = 20; sc.far = 380;
    sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.035; sun.shadow.radius = 3;
    this.scene.add(sun, sun.target); this.sun = sun;
    this.hemi = new THREE.HemisphereLight('#bcd2ec', '#7d6e5e', 1.45); this.scene.add(this.hemi);
  }

  _markings() {
    const B = this.batch, m = this.m, L = LAYOUT, y = 0.006, cz0 = L.crossZ - L.crossHalf, cz1 = L.crossZ + L.crossHalf;
    for (const [z0, z1] of [[cz1 + 4, L.zNear], [L.zFar, cz0 - 4]]) {
      for (const x of [-0.16, 0.16]) B.add(Geo.flat(x - 0.06, x + 0.06, z0, z1, y, 1), m.markYellow, null, { noShadow: true });
      for (const x of [3.35, 5.35]) B.add(Geo.flat(x - 0.07, x + 0.07, z0, z1, y, 1), m.markWhite, null, { noShadow: true });
      for (let z = z0; z < z1 - 3; z += 6) B.add(Geo.flat(-3.57, -3.43, z, z + 2, y, 1), m.markWhite, null, { noShadow: true });
    }
    for (const z of [30, -6, -30, -90]) { B.add(Geo.flat(4.27, 4.43, z - 0.9, z + 0.6, y, 1), m.markWhite, null, { noShadow: true }); B.add(Geo.quad([4.0, y, z - 0.6], [4.7, y, z - 0.6], [4.35, y, z - 1.25], [4.35, y, z - 1.25]), m.markWhite, null, { noShadow: true }); }
    for (const zc of [cz1 + 2, cz0 - 2]) for (let x = -6.5; x < 6.6; x += 1.0) B.add(Geo.flat(x, x + 0.55, zc - 1.6, zc + 1.6, y, 1), m.markWhite, null, { noShadow: true });
    B.add(Geo.flat(0.3, 6.9, cz1 + 3.8, cz1 + 4.25, y, 1), m.markWhite, null, { noShadow: true });
    for (const xc of [L.roadHalf + 2, -L.roadHalf - 2]) for (let z = cz0 + 0.4; z < cz1 - 0.4; z += 1.0) B.add(Geo.flat(xc - 1.6, xc + 1.6, z, z + 0.55, y, 1), m.markWhite, null, { noShadow: true });
  }

  _buildings() {
    const L = LAYOUT, rng = this.rng.fork(1), C = AIR_CITY;
    const cz0 = L.crossZ - L.crossHalf - 5.5, cz1 = L.crossZ + L.crossHalf + 5.5;
    const near = ['redbrick', 'tanbrick', 'cream', 'salmon', 'stone', 'whitebrick', 'sage', 'modern'], far = ['modern', 'glassblue', 'stone', 'cream', 'glassteal', 'tanbrick', 'redbrick', 'whitebrick'];
    const order = [2, 3, 7, 1, 9, 12, 6, 10, 5, 13, 8, 11, 4];
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
    row(1, L.zNear, C.blade.z0, { fMin: 3, fMax: 6 });
    this._building({ side: 1, z0: C.blade.z1, z1: C.blade.z0, depth: 18, style: 'tanbrick', floors: 4, shops: true, nextShop, rng });
    this._building({ side: 1, z0: C.stone.z0, z1: C.stone.z1, depth: 18, style: 'stone', floors: 5, shops: true, nextShop, rng });
    this._building({ side: 1, z0: C.cafe.z0, z1: C.cafe.z1, depth: 18, style: 'cream', floors: 4, shops: false, nextShop, rng });
    this._building({ side: 1, z0: C.corner.z0, z1: C.corner.z1, depth: 18, style: C.corner.style, floors: C.corner.floors, shops: true, nextShop, rng });
    row(1, cz0, -380, { fMin: 4, fMax: 9 }); row(1, -380, -760, { fMin: 6, fMax: 14 });
    row(-1, L.zNear, cz1, { fMin: 3, fMax: 7 }); row(-1, cz0, -380, { fMin: 4, fMax: 10 }); row(-1, -380, -760, { fMin: 6, fMax: 14 });
    for (const s of [-1, 1]) { this._rowX(s, 34, 260, cz1, 1, rng); this._rowX(s, 34, 260, cz0, -1, rng); }
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
    // the café's glass front
    const F = AIR_CITY.cafe, xf = L.frontage - 0.03;
    this.batch.add(Geo.quad([xf, 0, F.z0 + 0.4], [xf, 0, F.z1 - 0.4], [xf, 4.2, F.z1 - 0.4], [xf, 4.2, F.z0 + 0.4]), this.shopMats[0], null, { noShadow: true });
  }

  _trees() {
    const rng = this.rng.fork(3);
    for (const z of AIR_CITY.treesR) this._tree(8.15, z, rng, rng.range(0.9, 1.15));
    for (const z of AIR_CITY.treesL) this._tree(-8.15, z, rng, rng.range(0.9, 1.15));
  }

  _streetFurniture() {
    const B = this.batch, m = this.m, h = LAYOUT.curbH;
    for (const z of [24, -66, -126]) this._streetLight(7.45, z, 1);
    for (const z of [9, -24, -84]) this._streetLight(-7.45, z, -1);
    for (const [x, z] of [[7.7, 6.5], [-7.7, -12], [7.7, -58]]) {
      B.add(new THREE.CylinderGeometry(0.13, 0.15, 0.6, 10), m.red, Geo.matrix(x, h + 0.3, z));
      B.add(new THREE.SphereGeometry(0.14, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), m.red, Geo.matrix(x, h + 0.6, z));
    }
    this._bench(-12.0, -3, Math.PI / 2);
    this._busShelter(LAYOUT.busStop.x, LAYOUT.busStop.z);
    // the cordon round the scaffold's foot: plastic barriers on your side of it
    const bar = Mat.std('#e8e4da', { roughness: 0.6 }), red = Mat.std('#c0392b', { roughness: 0.6 }), S = AIR_CITY.scaffold;
    for (let z = S.z1 + 0.6; z > S.z0 - 0.8; z -= 1.9) { B.box(0.12, 0.9, 1.7, 10.0, h + 0.45, z - 0.85, bar); B.box(0.13, 0.12, 1.72, 10.0, h + 0.82, z - 0.85, red); B.box(0.13, 0.12, 1.72, 10.0, h + 0.4, z - 0.85, red); }
    const nameA = Tex.label(['OAK AVE'], { w: 512, h: 112, font: 70, bg: '#1d6b3c', border: '#ffffff' }), sa = new THREE.MeshStandardMaterial({ map: nameA, roughness: 0.5 });
    for (const [x, z] of [[8.0, -49.2], [-8.0, -74.8]]) { B.add(new THREE.CylinderGeometry(0.04, 0.04, 3.3, 6), m.metal, Geo.matrix(x, h + 1.65, z)); B.box(1.2, 0.26, 0.02, x, h + 3.15, z, sa); }
  }

  // the building site: hoarding along the sidewalk, a steel frame going up, the site hut (its roof sheet flies off later)
  _site() {
    const B = this.batch, m = this.m, L = AIR_CITY.lot, h = LAYOUT.curbH, HH = 2.5, hx = LAYOUT.frontage + 0.05;
    B.add(Geo.flat(LAYOUT.frontage, 30, L.z0, L.z1, 0.01, 4), m.dirt, null, { noShadow: true });
    B.add(Geo.quad([hx, h, L.z0], [hx, h, L.z1], [hx, h + HH, L.z1], [hx, h + HH, L.z0], 0, 0, (L.z1 - L.z0) / 8, 1), m.hoarding, null);
    B.box(0.06, HH, L.z1 - L.z0, hx + 0.04, h + HH / 2, (L.z0 + L.z1) / 2, m.plywood);
    for (let z = L.z0; z <= L.z1; z += 2.4) B.box(0.1, HH + 0.1, 0.1, hx + 0.12, h + HH / 2, z, m.plywood);
    for (const x of [16, 22, 28]) for (const z of [-21, -27, -33]) B.box(0.3, 12.6, 0.3, x, 6.3, z, m.primer);
    for (const y of [4.4, 8.4, 12.4]) { for (const x of [16, 22, 28]) B.box(0.2, 0.4, 12.3, x, y, -27, m.primer); for (const z of [-21, -27, -33]) B.box(12.3, 0.4, 0.2, 22, y, z, m.primer); }
    B.box(12.9, 0.25, 12.9, 22, 4.43, -27, m.concrete);
    // the hut: a two-storey site office on legs (its top sheet is a separate piece, see wind.js)
    const H = AIR_CITY.hut, wall = Mat.std('#d9d3c4', { roughness: 0.8 }), blue = Mat.std('#2d5f8f', { roughness: 0.7 });
    B.box(H.w, 2.5, H.d, H.x, 2.8, H.z, wall); B.box(H.w, 0.25, H.d, H.x, 1.5, H.z, blue); B.box(H.w, 0.25, H.d, H.x, 4.1, H.z, blue);
    for (const dx of [-H.w / 2 + 0.3, H.w / 2 - 0.3]) for (const dz of [-H.d / 2 + 0.2, H.d / 2 - 0.2]) B.box(0.15, 1.5, 0.15, H.x + dx, 0.75, H.z + dz, m.metal);
    for (let i = 0; i < 3; i++) B.box(0.04, 0.9, 1.0, H.x - H.w / 2 - 0.01, 3.0, H.z - 0.8 + i * 0.8, Mat.std('#5f7a8c', { roughness: 0.2, metalness: 0.4 }));
  }

  update(t, S) {
    this.skyUniforms.uTime.value = S * (1 + 4 * airLoad(S));
    this.skyUniforms.uCover.value = MathX.smooth(airWindKmh(S), 20, 60);
    for (const hd of this.signalHeads || []) { const on = hd.group === 'avenue' ? 2 : 0; hd.lamps.forEach((l, i) => l.mat.color.copy(l.color).multiplyScalar(i === on ? 3.0 : 0.05)); }
    if (this.dynamic.ad) this.dynamic.ad.emissiveIntensity = 0.6;
    // the trees: lean with the wind's push (∝ U² × density) — a breeze barely moves them
    const L = airLoad(S);
    this.windU.uBend.value = 0.05 + 1.55 * L; this.windU.uFlutter.value = 0.15 + 1.3 * Math.sqrt(L); this.windU.uTime.value = S;
  }
}
