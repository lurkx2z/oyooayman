/* =====================================================================
   NR CITY — the avenue round the roof (copied from the Air film's street
   and owned here). The party's building is a five-storey block on your
   side (x 12.5–30.5, z −21.6…3.0); its deck, parapets and everything on it
   are built in roof.js. Below: a café with an awning and umbrellas, a
   building site, the corner building with its rooftop billboard; across
   the street, shops, trees, a bus shelter. A bright, windy afternoon under
   the edge of a storm cloud: the sun is low on the clear side (over the
   street), the cloud's dark base covers the sky above the roof, and its
   edge moves out as the storm arrives (the light goes). The trees bend in
   the wind in their shaders (shadows too); when the air stops pushing
   (NR.loss) they spring upright and ring down. The clouds (water droplets)
   keep running with the wind. Subclasses Environment.
   ===================================================================== */

const LAYOUT = {
  roadHalf: 7.0, curbH: 0.15, frontage: 12.5, laneW: 3.5,
  crossZ: -62, crossHalf: 7,
  zNear: 200, zFar: -760,
  busStop: { x: -10.3, z: -40.5 }, cafe: { x: 11.0, z: -11 },
  lot: { x0: 12.5, x1: 30, z0: -34, z1: -21.6 },
};

const NR_CITY = {
  cafe: { z0: -21.6, z1: -13.0 },
  lot: { z0: -34, z1: -21.6 },
  corner: { z0: -49.5, z1: -34, floors: 4, style: 'redbrick' },
  billboard: { x: 13.9, z: -41.5, w: 14, h: 5, base: 19.2, yaw: 0.6 },   // panel centre x, z; bottom edge height; turned toward you
  hut: { x: 17.5, z: -27.5, w: 6, d: 2.6, h: 5.6 },
  treesR: [-81.5, -91, -100.5],
  treesL: [12, 2.5, -7, -29.5, -38.5, -54, -72, -81.5, -91, -100.5],
};

class NrCity extends Environment {
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
    this.windU = { uWind: { value: new THREE.Vector3(-1, 0, 0) }, uBend: { value: 0 }, uFlutter: { value: 0 }, uTime: { value: 0 }, uRing: { value: 0 }, uU: { value: -1 } };
    const U = this.windU;
    this._bendify = (mat, leafy) => {
      mat.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, U);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform vec3 uWind; uniform float uBend, uFlutter, uTime, uRing, uU;')
          .replace('#include <begin_vertex>', `#include <begin_vertex>
            { float hh = max(0.0, transformed.y - 0.15) / 5.5; float gust = 0.75 + 0.25 * sin(uTime * 1.7 + transformed.z * 0.13 + transformed.x * 0.05) + 0.12 * sin(uTime * 4.3 + transformed.z * 0.7);
              float d = uBend * gust * hh * hh * 1.7;
              if (uU >= 0.0) { float ph = transformed.z * 0.08 + transformed.x * 0.03, w = 6.2832 * (0.62 + 0.06 * sin(transformed.z * 0.31));
                d = uRing * exp(-0.55 * uU) * cos(w * uU + ph * min(uU, 1.0)) * hh * hh * 1.7 + d; }
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

  /* ---------------- sky: a storm cloud's dark base over the roof; clear and sunny beyond its edge ---------------- */
  // The cloud base is drawn as a layer 1.6 km up whose edge runs along the avenue; the clear side is over the street (−x),
  // where the sun is. uEdge (km, along −x) moves out as the storm arrives, taking the sun with it. The cloud is water
  // droplets: it rides the wind (uTime ∝ how far the air has moved).
  _sky() {
    this.sunDir = new THREE.Vector3(-0.45, 0.5, 0.74).normalize();
    const zenith = new THREE.Color('#4a86c8'), horizon = new THREE.Color('#c9d8e4');
    this.fogColor = new THREE.Color('#c3ccd3');
    this.skyUniforms = { uZenith: { value: zenith }, uHorizon: { value: horizon }, uGround: { value: new THREE.Color('#8d9590') }, uSunDir: { value: this.sunDir }, uSunColor: { value: new THREE.Color('#ffe2b0') },
      uTime: { value: 0 }, uEdge: { value: 0.5 }, uDark: { value: 0 }, uIceLo: { value: 99 }, uIceHi: { value: 0 } };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.skyUniforms, side: THREE.BackSide, depthWrite: false,
      vertexShader: /* glsl */`varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */`
        uniform vec3 uZenith, uHorizon, uGround, uSunDir, uSunColor; uniform float uTime, uEdge, uDark, uIceLo, uIceHi; varying vec3 vDir;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
          return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y); }
        float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a*noise(p); p = p*2.03 + 7.1; a *= 0.5; } return v; }
        void main(){
          vec3 d = normalize(vDir); float h = d.y;
          vec3 col = mix(uHorizon, uZenith, pow(clamp(h, 0.0, 1.0), 0.55));
          col = mix(col, uGround, smoothstep(0.0, -0.08, h));
          float sd = max(dot(d, uSunDir), 0.0);
          col += uSunColor * (pow(sd, 4.0) * 0.16 + pow(sd, 40.0) * 0.3 + pow(sd, 900.0) * 1.5) * (1.0 - 0.8 * uDark);
          col = mix(col, uHorizon * 1.04, 0.25 * (1.0 - smoothstep(0.0, 0.18, abs(h))));
          if (h > 0.0) {
            // fair-weather cumulus on the clear side
            vec2 uv = d.xz / (h + 0.18) * 1.1 + vec2(uTime * 0.05, uTime * 0.03);
            float c = fbm(uv * 1.3), cov = smoothstep(0.62, 0.84, c) * smoothstep(0.0, 0.12, h);
            vec3 lit = mix(vec3(1.0, 0.98, 0.95), uSunColor, 0.25) * 1.05, shade = mix(uHorizon, uZenith, 0.35) * 0.92;
            col = mix(col, mix(shade, lit, smoothstep(0.45, 0.9, fbm(uv * 1.3 + uSunDir.xz * 0.15))), cov * 0.8);
            // the storm's base: a layer 1.6 km up; p in km
            vec2 p = d.xz / max(h, 0.02) * 1.6, q = p + vec2(uTime * 0.012, uTime * 0.007);
            float edge = (p.x + uEdge) + 0.55 * (fbm(q * 0.9) - 0.5) + 0.25 * (fbm(q * 3.1 + 4.0) - 0.5);
            float base = smoothstep(-0.05, 0.35, edge);
            float lump = fbm(q * 1.7 + 2.0), bump = fbm(q * 5.2 - 3.0);
            vec3 dark = mix(vec3(0.17, 0.19, 0.23), vec3(0.33, 0.35, 0.39), lump) * (0.85 + 0.3 * bump);
            // mammatus pouches near the edge, lit from below on the sun side; a bright rim where the sun catches the edge
            float pouch = pow(max(0.0, sin(q.x * 9.0 + fbm(q * 2.0) * 4.0) * sin(q.y * 9.0 + fbm(q * 2.3) * 4.0)), 2.0);
            dark += vec3(0.07, 0.06, 0.05) * pouch * smoothstep(1.4, 0.2, edge);
            float rim = smoothstep(0.32, 0.0, abs(edge - 0.12)) * (1.0 - uDark);
            dark = mix(dark, vec3(0.78, 0.74, 0.68), rim * 0.55);
            dark *= 1.0 - 0.35 * uDark;
            // towards the horizon the base thickens into a grey wall
            dark = mix(dark, mix(uHorizon, vec3(0.42, 0.45, 0.5), 0.7) * (1.0 - 0.3 * uDark), 0.65 * (1.0 - smoothstep(0.0, 0.22, h)));
            col = mix(col, dark, base);
            // the cloud's ice once it has fallen out of the base: a grey veil between uIceLo and uIceHi (km), only under the
            // cloud (x > −uEdge). Seen from under it, its lower edge comes down the sky towards the horizon
            float lo = max(uIceLo, 0.0), hi = uIceHi;
            if (hi > lo + 0.001) {
              float hiE = d.x < 0.0 ? min(hi, -uEdge * h / d.x) : hi;
              float L = max(0.0, hiE - lo) / max(h, 0.03);
              float st = 0.7 + 0.3 * noise(vec2(atan(d.z, d.x) * 160.0, 0.5));
              col = mix(col, vec3(0.6, 0.64, 0.69) * (1.0 - 0.35 * uDark), (1.0 - exp(-0.6 * L)) * st * 0.9);
            }
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

  // the sun low over the street, under the cloud's edge; its shadows sized to the roof
  _lights() {
    const sun = new THREE.DirectionalLight('#ffe2bc', 4.4), tgt = new THREE.Vector3(21.5, NR_ROOF.y, -9);
    sun.position.copy(this.sunDir).multiplyScalar(140).add(tgt); sun.target.position.copy(tgt);
    sun.castShadow = CONFIG.render.shadows;
    sun.shadow.mapSize.set(CONFIG.render.shadowMapSize, CONFIG.render.shadowMapSize);
    const sc = sun.shadow.camera; sc.left = -34; sc.right = 34; sc.top = 40; sc.bottom = -40; sc.near = 40; sc.far = 300;
    sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.03; sun.shadow.radius = 3;
    this.scene.add(sun, sun.target); this.sun = sun;
    this.hemi = new THREE.HemisphereLight('#a9bdd2', '#7d6e5e', 1.5); this.scene.add(this.hemi);
    this._hemiSky = this.hemi.color.clone(); this._hemiStorm = new THREE.Color('#7e8a98');
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
    const L = LAYOUT, rng = this.rng.fork(1), C = NR_CITY;
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
    row(1, L.zNear, NR_ROOF.z1 + 9.5, { fMin: 3, fMax: 6 });
    // the party's neighbour: a lower block (its roof 3.6 m below yours), then the party's own building
    this._building({ side: 1, z0: NR_ROOF.z1, z1: NR_ROOF.z1 + 9.5, depth: 17, style: 'redbrick', floors: 4, shops: true, nextShop, rng });
    this._partyBuilding(nextShop, rng);
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
    const F = NR_CITY.cafe, xf = L.frontage - 0.03;
    this.batch.add(Geo.quad([xf, 0, F.z0 + 0.4], [xf, 0, F.z1 - 0.4], [xf, 4.2, F.z1 - 0.4], [xf, 4.2, F.z0 + 0.4]), this.shopMats[0], null, { noShadow: true });
  }

  // the party's building: a cream block, five storeys (deck at NR_ROOF.y), shops and the café on the ground floor. No
  // random rooftop clutter: the roof and everything on it are built in roof.js
  _partyBuilding(nextShop, rng) {
    const B = this.batch, m = this.m, F = this.facades.cream, st = F.style, R = NR_ROOF, gH = 4.4, H = R.y, fx = R.x0, x1 = R.x1, z0 = R.z0, z1 = R.z1;
    B.add(Geo.boxSides(fx, x1, 0, gH, z0, z1, 3, gH), F.wall, null);
    B.add(Geo.boxSides(fx, x1, gH, H, z0, z1, F.tileW, F.tileH), F.mat, null);
    // two shop units in front of z −13…3 (the café's glass front is below the awning, further on)
    for (const [za, zb] of [[-12.6, -5.2], [-4.8, 2.6]]) { const shop = nextShop(), si = SHOPS.indexOf(shop); B.add(Geo.quad([fx - 0.03, 0, za], [fx - 0.03, 0, zb], [fx - 0.03, 4.2, zb], [fx - 0.03, 4.2, za]), this.shopMats[si], null, { noShadow: true }); }
    // (shallow trims: what's dropped over the parapet falls clear of them)
    B.box(0.12, 0.24, z1 - z0, fx - 0.06, gH - 0.1, (z0 + z1) / 2, m.trim);
    B.box(0.14, 0.55, z1 - z0 + 0.3, fx - 0.06, H - 0.15, (z0 + z1) / 2, m.trim);
    B.box(0.1, 0.25, z1 - z0 + 0.2, fx - 0.04, H - 0.62, (z0 + z1) / 2, m.trimDark);
    this._dress({ side: 1, fx, z0, z1, gH, H, F, floors: 5, rng });
  }

  _trees() {
    const rng = this.rng.fork(3);
    for (const z of NR_CITY.treesR) this._tree(8.15, z, rng, rng.range(0.9, 1.15));
    for (const z of NR_CITY.treesL) this._tree(-8.15, z, rng, rng.range(0.9, 1.15));
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
    const nameA = Tex.label(['OAK AVE'], { w: 512, h: 112, font: 70, bg: '#1d6b3c', border: '#ffffff' }), sa = new THREE.MeshStandardMaterial({ map: nameA, roughness: 0.5 });
    for (const [x, z] of [[8.0, -49.2], [-8.0, -74.8]]) { B.add(new THREE.CylinderGeometry(0.04, 0.04, 3.3, 6), m.metal, Geo.matrix(x, h + 1.65, z)); B.box(1.2, 0.26, 0.02, x, h + 3.15, z, sa); }
  }

  // the building site: hoarding along the sidewalk, a steel frame going up, the site hut (its roof sheet flies off later)
  _site() {
    const B = this.batch, m = this.m, L = NR_CITY.lot, h = LAYOUT.curbH, HH = 2.5, hx = LAYOUT.frontage + 0.05;
    B.add(Geo.flat(LAYOUT.frontage, 30, L.z0, L.z1, 0.01, 4), m.dirt, null, { noShadow: true });
    B.add(Geo.quad([hx, h, L.z0], [hx, h, L.z1], [hx, h + HH, L.z1], [hx, h + HH, L.z0], 0, 0, (L.z1 - L.z0) / 8, 1), m.hoarding, null);
    B.box(0.06, HH, L.z1 - L.z0, hx + 0.04, h + HH / 2, (L.z0 + L.z1) / 2, m.plywood);
    for (let z = L.z0; z <= L.z1; z += 2.4) B.box(0.1, HH + 0.1, 0.1, hx + 0.12, h + HH / 2, z, m.plywood);
    for (const x of [16, 22, 28]) for (const z of [-21, -27, -33]) B.box(0.3, 12.6, 0.3, x, 6.3, z, m.primer);
    for (const y of [4.4, 8.4, 12.4]) { for (const x of [16, 22, 28]) B.box(0.2, 0.4, 12.3, x, y, -27, m.primer); for (const z of [-21, -27, -33]) B.box(12.3, 0.4, 0.2, 22, y, z, m.primer); }
    B.box(12.9, 0.25, 12.9, 22, 4.43, -27, m.concrete);
    // the hut: a two-storey site office on legs (its top sheet is a separate piece, see wind.js)
    const H = NR_CITY.hut, wall = Mat.std('#d9d3c4', { roughness: 0.8 }), blue = Mat.std('#2d5f8f', { roughness: 0.7 });
    B.box(H.w, 2.5, H.d, H.x, 2.8, H.z, wall); B.box(H.w, 0.25, H.d, H.x, 1.5, H.z, blue); B.box(H.w, 0.25, H.d, H.x, 4.1, H.z, blue);
    for (const dx of [-H.w / 2 + 0.3, H.w / 2 - 0.3]) for (const dz of [-H.d / 2 + 0.2, H.d / 2 - 0.2]) B.box(0.15, 1.5, 0.15, H.x + dx, 0.75, H.z + dz, m.metal);
    for (let i = 0; i < 3; i++) B.box(0.04, 0.9, 1.0, H.x - H.w / 2 - 0.01, 3.0, H.z - 0.8 + i * 0.8, Mat.std('#5f7a8c', { roughness: 0.2, metalness: 0.4 }));
  }

  // the storm's darkness (0 → 1): the cloud's edge moves out over the street with the gust front, and the sun goes in
  storm(S) { return MathX.smooth(S, NR.gale[0] - 0.6, NR.gale[1] + 1.6); }

  update(t, S) {
    // the clouds are water droplets: they keep running with the wind (∫ wind speed dt)
    this.skyUniforms.uTime.value = nrWindDist(S) / 11.1 * 2.2;
    const k = this.storm(S);
    // (the edge starts 1.3 km out, so the storm's dark base already hangs over the party in the opening; it spreads on out after the gust front)
    this.skyUniforms.uEdge.value = 1.3 + 1.85 * k + 4.5 * MathX.smooth(S, NR.gale[1] + 1.6, NR.ice0 + 6); this.skyUniforms.uDark.value = k;
    const hk = NR_ICE.h(S) / 1000; this.skyUniforms.uIceLo.value = NR_ICE.base / 1000 - hk; this.skyUniforms.uIceHi.value = Math.min(1.6, NR_ICE.top / 1000 - hk);
    this.sun.intensity = 4.4 * (1 - 0.86 * k);
    this.hemi.color.copy(this._hemiSky).lerp(this._hemiStorm, k); this.hemi.intensity = 1.5 - 0.35 * k;
    for (const hd of this.signalHeads || []) { const on = hd.group === 'avenue' ? 2 : 0; hd.lamps.forEach((l, i) => l.mat.color.copy(l.color).multiplyScalar(i === on ? 3.0 : 0.05)); }
    if (this.dynamic.ad) this.dynamic.ad.emissiveIntensity = 0.6;
    // the trees: lean with the push (50 km/h: a clear lean, leaves fluttering); at the change they spring upright and ring down
    const L = nrLoad(S), a = nrAero(S);
    this.windU.uBend.value = 0.62 * L; this.windU.uFlutter.value = (0.15 + 1.1 * Math.sqrt(L)) * a; this.windU.uTime.value = S;
    this.windU.uRing.value = 0.62 * nrLoadAtLoss() * (1 - a); this.windU.uU.value = S >= NR.loss ? S - NR.loss : -1;
  }
}
