/* =====================================================================
   ENVIRONMENT — sky, light, street, buildings, trees, props,
   construction site and the charcoal-grill cart.
   ===================================================================== */

const FACADE_STYLES = {
  redbrick:   { kind: 'brick', wall: [148, 76, 58],  frame: '#ebe6dc', sill: [208, 200, 186], winW: 0.5,  winH: 0.58, sillH: 0.24, panes: 3, bayW: 3.0, floorH: 3.3, ac: true },
  tanbrick:   { kind: 'brick', wall: [184, 148, 110], frame: '#2f3133', sill: [214, 206, 190], winW: 0.56, winH: 0.6,  sillH: 0.22, panes: 2, bayW: 2.8, floorH: 3.2, ac: true },
  whitebrick: { kind: 'brick', wall: [212, 207, 196], frame: '#3b4248', sill: [190, 186, 178], winW: 0.58, winH: 0.6,  sillH: 0.22, panes: 2, bayW: 3.0, floorH: 3.2 },
  cream:      { kind: 'stucco', wall: [224, 212, 188], frame: '#f6f3ec', sill: [238, 231, 216], winW: 0.48, winH: 0.6, sillH: 0.22, panes: 3, bayW: 3.2, floorH: 3.4, bands: true, pilasters: true },
  salmon:     { kind: 'stucco', wall: [212, 146, 118], frame: '#faf7f0', sill: [236, 226, 210], winW: 0.5, winH: 0.58, sillH: 0.24, panes: 3, bayW: 3.0, floorH: 3.2, ac: true },
  stone:      { kind: 'stone', wall: [178, 173, 163], frame: '#2a2a2a', sill: [196, 191, 180], winW: 0.48, winH: 0.6, sillH: 0.22, panes: 3, bayW: 3.4, floorH: 3.6, arch: true, bands: true },
  modern:     { kind: 'panel', wall: [96, 102, 108], frame: '#1b1f23', sill: [120, 126, 132], winW: 0.72, winH: 0.64, sillH: 0.2, panes: 2, bayW: 3.0, floorH: 3.3, glass: ['#7f97aa', '#22313d'] },
  sage:       { kind: 'stucco', wall: [170, 182, 160], frame: '#f2f2ec', sill: [220, 222, 210], winW: 0.5, winH: 0.58, sillH: 0.22, panes: 3, bayW: 3.0, floorH: 3.3, bands: true },
  glassblue:  { kind: 'curtain', wall: [60, 80, 100], frame: '#c3ccd4', glass: ['#86a9c4', '#24425e'], bayW: 3.0, floorH: 3.8 },
  glassteal:  { kind: 'curtain', wall: [60, 90, 90], frame: '#9aa6aa', glass: ['#94bcb8', '#22504e'], bayW: 3.0, floorH: 3.8 },
};

const SHOPS = [
  { name: 'CAFÉ AROMA', sign: '#28473a', text: '#f3e9d2', wall: '#d6cfc0', frame: '#1f2a24', inside: ['#f6dcaa', '#a87a4f'], products: ['#6b3e26', '#d9b38c', '#efe6d8'], decal: 'OPEN', awning: '#28473a' },
  { name: 'PHARMACY', sign: '#1b7a4e', text: '#ffffff', wall: '#e4e2dc', frame: '#2c2f33', inside: ['#f2faf6', '#bcd3c8'], products: ['#ffffff', '#7ac4a4', '#e94f4f', '#5aa0e0'], awning: null },
  { name: 'BAKERY', sign: '#7a3b1e', text: '#ffe7b8', wall: '#efe3cf', frame: '#3b2416', inside: ['#ffe4b4', '#c98e52'], products: ['#d79a52', '#f3d7a1', '#8b4a22'], decal: 'FRESH BREAD', awning: '#b5482a' },
  { name: 'BOOKS & CO', sign: '#1e2f5c', text: '#f5f0e1', wall: '#cfc6b6', frame: '#1a1f2e', inside: ['#f4e4c6', '#8c6a48'], products: ['#b23a3a', '#2e5d8c', '#d9b44a', '#3f7a4a', '#e8e0d0'], awning: '#1e2f5c' },
  { name: 'SUSHI 88', sign: '#141414', text: '#ff4a3d', wall: '#2c2c2c', frame: '#0d0d0d', inside: ['#ffe8c8', '#8a5a3c'], products: ['#ff6a5a', '#f5f5f5', '#2f6b3a'], awning: null },
  { name: 'HARDWARE', sign: '#cf3a1f', text: '#ffffff', wall: '#c9c2b4', frame: '#33302c', inside: ['#f4f1e8', '#9c9488'], products: ['#e0b23a', '#4a5560', '#c63a2a', '#2f73b8'], awning: '#cf3a1f' },
  { name: 'FLOWERS', sign: '#f2dbe2', text: '#7a2847', wall: '#ece6df', frame: '#5c3a46', inside: ['#fff1f4', '#b7c9a4'], products: ['#e35d8c', '#f7c948', '#6aa84f', '#ffffff', '#c13a5a'], decal: 'TULIPS', awning: '#7a2847' },
  { name: 'DELI', sign: '#0f5132', text: '#ffd34a', wall: '#d9d0bd', frame: '#1c2a20', inside: ['#fff3d6', '#b08a5a'], products: ['#c9473a', '#f2d06b', '#7b4a2a', '#e8dcc4'], awning: '#0f5132' },
  { name: 'LAUNDROMAT', sign: '#2a74c9', text: '#ffffff', wall: '#e8e8e6', frame: '#2b3640', inside: ['#f2f7fb', '#c8d4de'], products: ['#e6e9ec', '#c8ced4', '#9fb4c8'], awning: null },
  { name: 'PIZZA', sign: '#b3201b', text: '#fff7e0', wall: '#e9dcc2', frame: '#3a1f12', inside: ['#ffd9a0', '#a8643a'], products: ['#e8b04a', '#c43a2a', '#f2e2c0'], decal: 'BY THE SLICE', awning: '#2f6b3a' },
  { name: 'OPTICS', sign: '#222831', text: '#e8e8e8', wall: '#d2d0cc', frame: '#1a1d22', inside: ['#f7f7f5', '#c9ccd1'], products: ['#2a2a2a', '#b0b4ba', '#6b4a3a'], awning: null },
  { name: 'MARKET', sign: '#ef8a17', text: '#1b1b1b', wall: '#ddd5c6', frame: '#2b2b2b', inside: ['#fff6e0', '#b9a47a'], products: ['#e8452c', '#f7c43a', '#7cb342', '#ff9a2e', '#8e44ad'], awning: '#2f6b3a' },
  { name: 'BARBER', sign: '#f2f2f2', text: '#1c3d8f', wall: '#bfb7aa', frame: '#1c1c1c', inside: ['#f6f2ea', '#a89e90'], products: ['#ffffff', '#c0392b', '#2c3e50'], awning: '#1c3d8f' },
  { name: 'CITY SAVINGS', sign: '#0b3d66', text: '#ffffff', wall: '#cfcac0', frame: '#1b2430', inside: ['#f3f5f7', '#b9c1ca'], products: ['#dfe4ea', '#9aa6b2'], awning: null },
];

class Environment {
  constructor(scene, renderer, rng) {
    this.scene = scene;
    this.renderer = renderer;
    this.rng = rng;
    this.root = new THREE.Group();
    this.root.name = 'environment';
    scene.add(this.root);
    this.batch = new Batcher();
    this.dynamic = {};      // things updated each frame
    this.anchors = {};      // named world positions (for HUD annotations, FX)
  }

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
    this._construction();
    this._cart();
    this._roadWorks();
    this._cafe();
    this.batch.build(this.root, 'env');
    this._environmentMap();
  }

  /* ================================================================ */
  _materials() {
    const asph = Tex.asphalt(11);
    const side = Tex.sidewalk(12);
    asph.map.repeat.set(1, 1);
    this.m = {
      asphalt: new THREE.MeshStandardMaterial({ map: asph.map, roughnessMap: asph.roughnessMap, bumpMap: asph.bumpMap, bumpScale: 1.2, roughness: 0.95, name: 'asphalt' }),
      sidewalk: new THREE.MeshStandardMaterial({ map: side.map, bumpMap: side.bumpMap, bumpScale: 2.0, roughness: 0.9, name: 'sidewalk' }),
      curb: new THREE.MeshStandardMaterial({ map: Tex.concrete(13, [190, 186, 178]), roughness: 0.85, name: 'curb' }),
      concrete: new THREE.MeshStandardMaterial({ map: Tex.concrete(14, [166, 162, 154]), roughness: 0.9, name: 'concrete' }),
      dirt: Mat.std('#6e5f4d', { roughness: 1 }),
      roof: Mat.std('#58554f', { roughness: 0.95 }),
      roofLight: Mat.std('#8a8780', { roughness: 0.9 }),
      trim: Mat.std('#d4cdbd', { roughness: 0.75 }),
      trimDark: Mat.std('#5b5650', { roughness: 0.8 }),
      metal: Mat.std('#2c3034', { roughness: 0.45, metalness: 0.6 }),
      metalGreen: Mat.std('#2c4a3a', { roughness: 0.5, metalness: 0.4 }),
      steel: Mat.std('#9aa0a6', { roughness: 0.35, metalness: 0.8 }),
      galv: Mat.std('#a7adb2', { roughness: 0.5, metalness: 0.6 }),
      primer: Mat.std('#8a3b28', { roughness: 0.7, metalness: 0.2 }),
      white: Mat.std('#f0efe9', { roughness: 0.6 }),
      markWhite: new THREE.MeshStandardMaterial({ color: '#e9e7df', roughness: 0.65, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, name: 'markWhite' }),
      markYellow: new THREE.MeshStandardMaterial({ color: '#e0b628', roughness: 0.65, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, name: 'markYellow' }),
      manhole: new THREE.MeshStandardMaterial({ color: '#2a2a2a', roughness: 0.6, metalness: 0.5, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
      bark: Mat.std('#5b4b3e', { roughness: 0.95 }),
      foliage: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, flatShading: true, name: 'foliage' }),
      soil: Mat.std('#3b3027', { roughness: 1 }),
      glass: new THREE.MeshPhysicalMaterial({ color: '#cfe3ea', roughness: 0.05, transmission: 0, transparent: true, opacity: 0.22, depthWrite: false, name: 'glassPanel' }),
      hoarding: new THREE.MeshStandardMaterial({ map: Tex.hoarding(15), roughness: 0.85, name: 'hoarding' }),
      plywood: Mat.std('#b8925f', { roughness: 0.9 }),
      orange: Mat.std('#ef6a1a', { roughness: 0.6 }),
      yellow: Mat.std('#e8b91c', { roughness: 0.55 }),
      red: Mat.std('#b8231d', { roughness: 0.6 }),
      blueBox: Mat.std('#24508f', { roughness: 0.5 }),
      green: Mat.std('#2f6b3a', { roughness: 0.6 }),
      lattice: new THREE.MeshStandardMaterial({ map: Tex.lattice(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6, name: 'lattice' }),
    };
    this.m.lattice.map.repeat.set(1, 1);
    // facade materials (one per style) + plain ground-floor wall
    this.facades = {};
    let s = 100;
    for (const [name, st] of Object.entries(FACADE_STYLES)) {
      const t = Tex.facade(st, s++);
      const mat = new THREE.MeshStandardMaterial({ map: t.map, roughnessMap: t.roughnessMap, bumpMap: t.bumpMap, bumpScale: 2.5, roughness: 1, metalness: st.kind === 'curtain' ? 0.25 : 0.0, name: 'facade_' + name });
      const wall = Mat.std(`rgb(${st.wall.map((v) => Math.round(v * 0.92)).join(',')})`, { roughness: 0.9 });
      this.facades[name] = { style: st, mat, tileW: t.tileW, tileH: t.tileH, wall };
    }
    this.shopMats = SHOPS.map((shop, i) => {
      const t = Tex.storefront(shop, 300 + i);
      return new THREE.MeshStandardMaterial({ map: t.map, emissiveMap: t.emissiveMap, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.55, roughnessMap: t.roughnessMap, roughness: 1, name: 'shop_' + i });
    });
  }

  /* ================================================================ */
  _sky() {
    this.sunDir = new THREE.Vector3(0.55, 0.62, -0.56).normalize();
    const zenith = new THREE.Color('#2a68c2');
    const horizon = new THREE.Color('#bcd3e8');
    this.horizonColor = horizon.clone();
    this.skyUniforms = {
      uZenith: { value: zenith },
      uHorizon: { value: horizon },
      uGround: { value: new THREE.Color('#9aa3a6') },
      uSunDir: { value: this.sunDir },
      uSunColor: { value: new THREE.Color('#fff2dc') },
      uTime: { value: 0 },
      uO2: { value: 1 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.skyUniforms,
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: /* glsl */`
        varying vec3 vDir;
        void main(){
          vDir = normalize(position);
          vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_Position = p.xyww;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uZenith, uHorizon, uGround, uSunDir, uSunColor;
        uniform float uTime, uO2;
        varying vec3 vDir;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p){
          vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
          return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
        }
        float fbm(vec2 p){ float v = 0.0, a = 0.5; for(int i=0;i<5;i++){ v += a*noise(p); p = p*2.03 + 7.1; a *= 0.5; } return v; }
        void main(){
          vec3 d = normalize(vDir);
          float h = d.y;
          // O2 is ~21% of the scattering molecules: without it the sky is a bit deeper / darker
          vec3 zen = mix(uZenith * vec3(0.78, 0.84, 0.92), uZenith, uO2);
          vec3 col = mix(uHorizon, zen, pow(clamp(h, 0.0, 1.0), 0.5));
          col = mix(col, uGround, smoothstep(0.0, -0.06, h));
          float sd = max(dot(d, uSunDir), 0.0);
          col += uSunColor * (pow(sd, 5.0) * 0.22 + pow(sd, 60.0) * 0.5 + pow(sd, 1800.0) * 30.0);
          if (h > 0.0) {
            vec2 uv = d.xz / (h + 0.18) * 0.75 + vec2(uTime * 0.004, uTime * 0.002);
            float c = fbm(uv * 1.1);
            float cov = smoothstep(0.6, 0.82, c) * smoothstep(0.03, 0.3, h);
            float shade = smoothstep(0.35, 0.85, fbm(uv * 1.1 + vec2(0.06, 0.08)));
            vec3 cc = mix(vec3(0.78, 0.82, 0.88), vec3(1.08, 1.06, 1.02), 1.0 - shade * 0.7);
            cc += uSunColor * pow(sd, 8.0) * 0.4;
            col = mix(col, cc, cov * 0.9);
          }
          col *= mix(0.9, 1.0, uO2);
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(2000, 48, 24), mat);
    sky.name = 'sky';
    sky.frustumCulled = false;
    sky.renderOrder = -10;
    this.scene.add(sky);
    this.sky = sky;
    this.scene.fog = new THREE.FogExp2(horizon.clone(), 0.0017);
    this.scene.background = horizon.clone();
  }

  _lights() {
    const sun = new THREE.DirectionalLight('#fff0dc', 3.2);
    sun.position.copy(this.sunDir).multiplyScalar(160).add(new THREE.Vector3(0, 0, -40));
    sun.target.position.set(0, 0, -40);
    sun.castShadow = CONFIG.render.shadows;
    sun.shadow.mapSize.set(CONFIG.render.shadowMapSize, CONFIG.render.shadowMapSize);
    const sc = sun.shadow.camera;
    sc.left = -95; sc.right = 95; sc.top = 110; sc.bottom = -110; sc.near = 10; sc.far = 420;
    sun.shadow.bias = -0.00025;
    sun.shadow.normalBias = 0.035;
    sun.shadow.radius = 3;
    this.scene.add(sun, sun.target);
    this.sun = sun;
    const hemi = new THREE.HemisphereLight('#bcd4f2', '#7a6a58', 1.15);
    this.scene.add(hemi);
    this.hemi = hemi;
  }

  _environmentMap() {
    // reflections for car paint and glass: render the sky + a neutral ground into a PMREM
    const pm = new THREE.PMREMGenerator(this.renderer);
    const envScene = new THREE.Scene();
    envScene.add(this.sky.clone());
    const ground = new THREE.Mesh(new THREE.CircleGeometry(1500, 32), new THREE.MeshBasicMaterial({ color: '#6d6a64' }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -2;
    envScene.add(ground);
    // a few "buildings" so reflections are not pure sky
    const bm = new THREE.MeshBasicMaterial({ color: '#8a8378' });
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2, h = 30 + (i % 5) * 18;
      const b = new THREE.Mesh(new THREE.BoxGeometry(60, h * 2, 60), bm);
      b.position.set(Math.cos(a) * 120, 0, Math.sin(a) * 120);
      envScene.add(b);
    }
    const rt = pm.fromScene(envScene, 0.02, 0.1, 3000);
    this.scene.environment = rt.texture;
    this.scene.environmentIntensity = 0.85;
    pm.dispose();
  }

  /* ================================================================ */
  _ground() {
    const L = LAYOUT, B = this.batch, m = this.m;
    const zN = L.zNear, zF = L.zFar, cz0 = L.crossZ - L.crossHalf, cz1 = L.crossZ + L.crossHalf;
    // avenue
    B.add(Geo.flat(-L.roadHalf, L.roadHalf, zF, zN, 0, 8), m.asphalt, null, { noShadow: true });
    // cross street (outside the avenue)
    B.add(Geo.flat(-600, -L.roadHalf, cz0, cz1, 0, 8), m.asphalt, null, { noShadow: true });
    B.add(Geo.flat(L.roadHalf, 600, cz0, cz1, 0, 8), m.asphalt, null, { noShadow: true });
    // base ground far below everything (alleys, lots)
    B.add(Geo.flat(-900, 900, -1500, 400, -0.02, 10), m.dirt, null, { noShadow: true });

    // sidewalks: avenue segments + cross street segments
    const sw = [];
    for (const s of [-1, 1]) {
      sw.push([s, L.roadHalf, L.frontage + 0.5, cz1, zN, 'z']);
      sw.push([s, L.roadHalf, L.frontage + 0.5, zF, cz0, 'z']);
    }
    for (const [s, a, b, z0, z1] of sw) this._sidewalk(s * a, s * b, z0, z1);
    // cross-street sidewalks
    for (const s of [-1, 1]) {
      this._sidewalkX(s * L.roadHalf, s * 600, cz1, cz1 + 5.5);
      this._sidewalkX(s * L.roadHalf, s * 600, cz0 - 5.5, cz0);
    }
    // manholes
    const disc = new THREE.CircleGeometry(0.42, 18);
    for (const [x, z] of [[-1.6, -9], [3.4, -27], [-3.6, -74], [1.2, -110], [2.1, 18]]) {
      B.add(disc, m.manhole, Geo.matrix(x, 0.008, z, -Math.PI / 2), { noShadow: true });
    }
  }

  // sidewalk slab running along Z between x0 and x1 (x0 = curb side)
  _sidewalk(x0, x1, z0, z1) {
    const B = this.batch, m = this.m, h = LAYOUT.curbH;
    const xa = Math.min(x0, x1), xb = Math.max(x0, x1);
    const curbX = x0, inner = x0 + Math.sign(x1 - x0) * 0.32;
    B.add(Geo.flat(Math.min(inner, x1), Math.max(inner, x1), z0, z1, h, 2.5), m.sidewalk, null, { noShadow: true });
    B.add(Geo.flat(Math.min(curbX, inner), Math.max(curbX, inner), z0, z1, h, 1), m.curb, null, { noShadow: true });
    // curb face toward road
    const s = Math.sign(x1 - x0);
    if (s > 0) B.add(Geo.quad([curbX, 0, z0], [curbX, 0, z1], [curbX, h, z1], [curbX, h, z0], 0, 0, (z1 - z0) / 2, h / 2), m.curb, null, { noShadow: true });
    else B.add(Geo.quad([curbX, 0, z1], [curbX, 0, z0], [curbX, h, z0], [curbX, h, z1], 0, 0, (z1 - z0) / 2, h / 2), m.curb, null, { noShadow: true });
    // end caps (at intersection)
    for (const z of [z0, z1]) {
      const n = z === z0 ? -1 : 1;
      if (n > 0) B.add(Geo.quad([xa, 0, z], [xb, 0, z], [xb, h, z], [xa, h, z], 0, 0, (xb - xa) / 2, h / 2), m.curb, null, { noShadow: true });
      else B.add(Geo.quad([xb, 0, z], [xa, 0, z], [xa, h, z], [xb, h, z], 0, 0, (xb - xa) / 2, h / 2), m.curb, null, { noShadow: true });
    }
  }

  _sidewalkX(x0, x1, z0, z1) {
    const B = this.batch, m = this.m, h = LAYOUT.curbH;
    const xa = Math.min(x0, x1), xb = Math.max(x0, x1);
    // skip the part already covered by avenue sidewalks
    const cut = LAYOUT.frontage + 0.5;
    const xs = x0 > 0 ? [cut, xb] : [xa, -cut];
    B.add(Geo.flat(xs[0], xs[1], z0, z1, h, 2.5), m.sidewalk, null, { noShadow: true });
    // curb faces toward the cross street
    const roadSideZ = Math.abs(z0 - LAYOUT.crossZ) < Math.abs(z1 - LAYOUT.crossZ) ? z0 : z1;
    const [a, b] = xs;
    if (roadSideZ === z0) B.add(Geo.quad([b, 0, z0], [a, 0, z0], [a, h, z0], [b, h, z0], 0, 0, (b - a) / 2, h / 2), m.curb, null, { noShadow: true });
    else B.add(Geo.quad([a, 0, z1], [b, 0, z1], [b, h, z1], [a, h, z1], 0, 0, (b - a) / 2, h / 2), m.curb, null, { noShadow: true });
  }

  _markings() {
    const B = this.batch, m = this.m, L = LAYOUT;
    const cz0 = L.crossZ - L.crossHalf, cz1 = L.crossZ + L.crossHalf;
    const y = 0.006;
    const segs = [[cz1 + 4, L.zNear], [L.zFar, cz0 - 4]];
    for (const [z0, z1] of segs) {
      // double yellow
      for (const x of [-0.16, 0.16]) B.add(Geo.flat(x - 0.06, x + 0.06, z0, z1, y, 1), m.markYellow, null, { noShadow: true });
      // lane dashes
      for (const x of [-3.5, 3.5]) {
        for (let z = z0; z < z1 - 3; z += 9) B.add(Geo.flat(x - 0.07, x + 0.07, z, z + 3, y, 1), m.markWhite, null, { noShadow: true });
      }
      // edge lines
      for (const x of [-6.75, 6.75]) B.add(Geo.flat(x - 0.07, x + 0.07, z0, z1, y, 1), m.markWhite, null, { noShadow: true });
    }
    // crosswalks across the avenue
    for (const zc of [cz1 + 2, cz0 - 2]) {
      for (let x = -6.5; x < 6.6; x += 1.0) B.add(Geo.flat(x, x + 0.55, zc - 1.6, zc + 1.6, y, 1), m.markWhite, null, { noShadow: true });
    }
    // stop lines
    B.add(Geo.flat(0.3, 6.9, cz1 + 3.8, cz1 + 4.25, y, 1), m.markWhite, null, { noShadow: true });
    B.add(Geo.flat(-6.9, -0.3, cz0 - 4.25, cz0 - 3.8, y, 1), m.markWhite, null, { noShadow: true });
    // crosswalks across the cross street
    for (const xc of [L.roadHalf + 2, -L.roadHalf - 2]) {
      for (let z = cz0 + 0.4; z < cz1 - 0.4; z += 1.0) B.add(Geo.flat(xc - 1.6, xc + 1.6, z, z + 0.55, y, 1), m.markWhite, null, { noShadow: true });
    }
    // cross-street centre line
    for (const [x0, x1] of [[-600, -L.roadHalf - 4], [L.roadHalf + 4, 600]]) {
      for (const dz of [-0.16, 0.16]) B.add(Geo.flat(x0, x1, L.crossZ + dz - 0.06, L.crossZ + dz + 0.06, y, 1), m.markYellow, null, { noShadow: true });
    }
    B.add(Geo.flat(L.roadHalf + 3.8, L.roadHalf + 4.25, L.crossZ - 6.9, L.crossZ - 0.3, y, 1), m.markWhite, null, { noShadow: true });
    B.add(Geo.flat(-L.roadHalf - 4.25, -L.roadHalf - 3.8, L.crossZ + 0.3, L.crossZ + 6.9, y, 1), m.markWhite, null, { noShadow: true });
  }

  /* ================================================================ */
  _buildings() {
    const L = LAYOUT, rng = this.rng.fork(1);
    const cz0 = L.crossZ - L.crossHalf - 5.5, cz1 = L.crossZ + L.crossHalf + 5.5;
    const near = ['redbrick', 'tanbrick', 'cream', 'salmon', 'stone', 'whitebrick', 'sage', 'modern'];
    const far = ['modern', 'glassblue', 'stone', 'cream', 'glassteal', 'tanbrick', 'redbrick', 'whitebrick'];
    let shopIdx = 0;
    const nextShop = () => SHOPS[(shopIdx++ * 5) % SHOPS.length];

    const row = (side, zStart, zEnd, opts) => {
      let z = zStart, prev = '';
      while (z > zEnd + 4) {
        let w = rng.range(opts.wMin || 9, opts.wMax || 19);
        if (z - w < zEnd + 6) w = z - zEnd;
        const pool = Math.abs(z) < 140 ? near : far;
        let style = rng.pick(pool);
        if (style === prev) style = rng.pick(pool);
        prev = style;
        const fl = rng.int(opts.fMin, opts.fMax);
        const depth = opts.depth || rng.range(16, 22);
        this._building({ side, z0: z - w, z1: z, depth, style, floors: fl, shops: opts.shops !== false, nextShop, rng });
        z -= w;
      }
    };
    // right side (viewer's side): the construction lot runs up to the cross street
    row(1, L.zNear, L.lot.z1, { fMin: 3, fMax: 6 });
    row(1, cz0, -380, { fMin: 4, fMax: 9 });
    row(1, -380, -760, { fMin: 6, fMax: 14 });
    // left side
    row(-1, L.zNear, cz1, { fMin: 3, fMax: 7 });
    row(-1, cz0, -380, { fMin: 4, fMax: 10 });
    row(-1, -380, -760, { fMin: 6, fMax: 14 });
    // cross street rows (front faces toward the cross street)
    for (const s of [-1, 1]) {
      this._rowX(s, 34, 260, cz1, 1, rng);
      this._rowX(s, 34, 260, cz0, -1, rng);
    }
    // second row behind (taller, gives depth above rooftops)
    for (const s of [-1, 1]) {
      let z = 120;
      while (z > -700) {
        const w = rng.range(14, 30), h = rng.range(26, 70) + (z < -200 ? 25 : 0);
        if (!(z < cz1 + 2 && z - w > cz0 - 2)) {
          const st = this.facades[rng.pick(far)];
          const x0 = s > 0 ? 40 : -40 - rng.range(16, 26), x1 = s > 0 ? 40 + rng.range(16, 26) : -40;
          this.batch.add(Geo.boxSides(x0, x1, 0, h, z - w, z, st.tileW, st.tileH), st.mat, null);
          this.batch.add(Geo.flat(x0, x1, z - w, z, h, 4), this.m.roof, null, { noShadow: true });
        }
        z -= w + rng.range(0, 6);
      }
    }
  }

  _rowX(s, xa, xb, zFace, dirZ, rng) {
    // buildings along the cross street; front faces at zFace, extending away (dirZ = +1 → z grows)
    let x = xa;
    while (x < xb) {
      const w = rng.range(10, 20), fl = rng.int(4, 9);
      const st = this.facades[rng.pick(['redbrick', 'stone', 'cream', 'tanbrick', 'modern'])];
      const H = 4.4 + fl * st.style.floorH;
      const x0 = s > 0 ? x : -x - w, x1 = s > 0 ? x + w : -x;
      const z0 = dirZ > 0 ? zFace : zFace - 18, z1 = dirZ > 0 ? zFace + 18 : zFace;
      this.batch.add(Geo.boxSides(x0, x1, 0, 4.4, z0, z1, 3, 4.4), st.wall, null);
      this.batch.add(Geo.boxSides(x0, x1, 4.4, H, z0, z1, st.tileW, st.tileH), st.mat, null);
      this.batch.add(Geo.flat(x0, x1, z0, z1, H, 4), this.m.roof, null, { noShadow: true });
      x += w;
    }
  }

  /**
   * One street building: ground-floor shops + upper facade + cornice + rooftop clutter.
   * side: +1 right of street (front faces -X), -1 left (front faces +X)
   */
  _building({ side, z0, z1, depth, style, floors, shops, nextShop, rng, corner }) {
    const B = this.batch, m = this.m, F = this.facades[style];
    const st = F.style, L = LAYOUT;
    const fx = side * L.frontage;                    // front face x
    const bx = side * (L.frontage + depth);          // back face x
    const x0 = Math.min(fx, bx), x1 = Math.max(fx, bx);
    const gH = 4.4;
    const H = gH + floors * st.floorH;
    // ground floor box + upper facade box
    B.add(Geo.boxSides(x0, x1, 0, gH, z0, z1, 3, gH), F.wall, null);
    B.add(Geo.boxSides(x0, x1, gH, H, z0, z1, F.tileW, F.tileH), F.mat, null);
    B.add(Geo.flat(x0, x1, z0, z1, H, 4), m.roof, null, { noShadow: true });

    // storefront units on the front face
    if (shops) {
      const w = z1 - z0, n = Math.max(1, Math.round(w / 7.5)), uw = w / n;
      const off = side * -0.03; // slightly in front of the wall
      for (let i = 0; i < n; i++) {
        const shop = nextShop();
        const si = SHOPS.indexOf(shop);
        const za = z0 + i * uw + 0.35, zb = z0 + (i + 1) * uw - 0.35;
        const xf = fx + off;
        // quad facing the street
        const g = side > 0
          ? Geo.quad([xf, 0, za], [xf, 0, zb], [xf, 4.2, zb], [xf, 4.2, za])
          : Geo.quad([xf, 0, zb], [xf, 0, za], [xf, 4.2, za], [xf, 4.2, zb]);
        B.add(g, this.shopMats[si], null, { noShadow: true });
        // awning
        const clearView = side > 0 && za < 12 && zb > -16;
        if (shop.awning && rng.next() < 0.8 && !clearView) {
          const aw = zb - za - 0.6, ad = 1.35;
          const awMat = Mat.std(shop.awning, { roughness: 0.85 });
          const g2 = new THREE.BoxGeometry(ad, 0.05, aw);
          B.add(g2, awMat, Geo.matrix(fx - side * ad / 2 * 0.95, 3.72, (za + zb) / 2, 0, 0, side * 0.32));
          B.box(0.03, 0.26, aw, fx - side * ad * 0.92, 3.42, (za + zb) / 2, awMat);
        }
      }
    }
    // belt course + cornice along the front (and the open sides at corners)
    const trim = st.kind === 'curtain' ? m.metal : m.trim;
    B.box(0.22, 0.24, z1 - z0, fx - side * 0.11, gH - 0.1, (z0 + z1) / 2, trim);
    if (st.kind !== 'curtain') {
      B.box(0.45, 0.55, z1 - z0 + 0.5, fx - side * 0.2, H - 0.15, (z0 + z1) / 2, trim);
      B.box(0.3, 0.25, z1 - z0 + 0.3, fx - side * 0.12, H - 0.62, (z0 + z1) / 2, m.trimDark);
      // parapet
      B.box(0.25, 0.9, z1 - z0, bx - side * 0.12, H + 0.45, (z0 + z1) / 2, F.wall);
    } else {
      B.box(0.2, 1.1, z1 - z0, fx - side * 0.1, H + 0.55, (z0 + z1) / 2, m.metal);
    }
    // rooftop clutter
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const nU = rng.int(1, 3);
    for (let i = 0; i < nU; i++) {
      const w = rng.range(1.4, 3), d = rng.range(1.2, 2.5), h = rng.range(0.9, 1.8);
      B.box(w, h, d, cx + rng.range(-depth * 0.3, depth * 0.3), H + h / 2, cz + rng.range(-(z1 - z0) * 0.3, (z1 - z0) * 0.3), m.roofLight);
    }
    if (rng.next() < 0.35 && floors <= 8) this._waterTank(cx + side * depth * 0.15, H, cz + rng.range(-2, 2));
    if (rng.next() < 0.5) B.box(3, 2.6, 3.4, cx + side * depth * 0.25, H + 1.3, cz + rng.range(-2, 2), F.wall);
  }

  _waterTank(x, y, z) {
    const B = this.batch;
    const wood = Mat.std('#6b5240', { roughness: 0.95 });
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B.box(0.15, 2.4, 0.15, x + dx * 1.1, y + 1.2, z + dz * 1.1, this.m.metal);
    B.add(new THREE.CylinderGeometry(1.6, 1.6, 3.2, 14), wood, Geo.matrix(x, y + 4.0, z));
    B.add(new THREE.ConeGeometry(1.75, 1.1, 14), Mat.std('#3d3a36'), Geo.matrix(x, y + 6.15, z));
    for (const h of [3.0, 4.2, 5.2]) B.add(new THREE.TorusGeometry(1.62, 0.04, 4, 20), this.m.metal, Geo.matrix(x, y + h, z, Math.PI / 2));
  }

  _skyline() {
    const rng = this.rng.fork(2), B = this.batch;
    const styles = ['glassblue', 'glassteal', 'modern', 'stone', 'glassblue'];
    for (let i = 0; i < 70; i++) {
      const z = rng.range(-520, -1150);
      let x = rng.range(-260, 260);
      if (Math.abs(x) < 26 && z > -900) x += Math.sign(x || 1) * 30;
      const w = rng.range(22, 48), d = rng.range(22, 44), h = rng.range(50, 230) * (Math.abs(x) < 120 ? 1 : 0.7);
      const st = this.facades[rng.pick(styles)];
      B.add(Geo.boxSides(x - w / 2, x + w / 2, 0, h, z - d / 2, z + d / 2, st.tileW, st.tileH), st.mat, null, { noShadow: true });
      B.add(Geo.flat(x - w / 2, x + w / 2, z - d / 2, z + d / 2, h, 5), this.m.roof, null, { noShadow: true });
      if (rng.next() < 0.3) B.box(w * 0.6, h * 0.15, d * 0.6, x, h + h * 0.075, z, st.mat, 0, { noShadow: true });
      if (rng.next() < 0.25) B.add(new THREE.CylinderGeometry(0.4, 0.6, 18, 6), this.m.metal, Geo.matrix(x, h + 9, z), { noShadow: true });
    }
  }

  /* ================================================================ */
  _tree(x, z, rng, scale = 1) {
    const B = this.batch, h = LAYOUT.curbH;
    const th = rng.range(2.6, 3.4) * scale;
    // pit + grate
    B.box(1.25, 0.02, 1.25, x, h + 0.005, z, this.m.soil, 0, { noShadow: true });
    B.add(new THREE.CylinderGeometry(0.11 * scale, 0.17 * scale, th, 7), this.m.bark, Geo.matrix(x, h + th / 2, z));
    // branches
    for (let i = 0; i < 3; i++) {
      const a = rng.next() * Math.PI * 2;
      B.add(new THREE.CylinderGeometry(0.04, 0.07, 1.6 * scale, 5), this.m.bark, Geo.matrix(x + Math.cos(a) * 0.35, h + th + 0.4, z + Math.sin(a) * 0.35, Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6));
    }
    // foliage clusters with vertex colour variation
    const n = rng.int(5, 7);
    const base = new THREE.Color().setHSL(rng.range(0.23, 0.3), rng.range(0.28, 0.4), rng.range(0.19, 0.25));
    for (let i = 0; i < n; i++) {
      const r = rng.range(1.0, 1.55) * scale;
      const g = new THREE.IcosahedronGeometry(r, 1);
      const pos = g.attributes.position;
      for (let k = 0; k < pos.count; k++) {
        const v = new THREE.Vector3().fromBufferAttribute(pos, k);
        v.multiplyScalar(1 + (hash1(k * 31 + i * 7 + (x * 13 | 0)) - 0.5) * 0.28);
        pos.setXYZ(k, v.x, v.y * 0.85, v.z);
      }
      const ng = g.index ? g.toNonIndexed() : g;
      const cols = new Float32Array(ng.attributes.position.count * 3);
      for (let k = 0; k < ng.attributes.position.count; k++) {
        const yv = ng.attributes.position.getY(k) / r;
        const c = base.clone().offsetHSL((hash1(k + i * 97) - 0.5) * 0.03, 0, (yv * 0.08) + (hash1(k * 3 + i) - 0.5) * 0.05);
        cols[k * 3] = c.r; cols[k * 3 + 1] = c.g; cols[k * 3 + 2] = c.b;
      }
      ng.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      const a = (i / n) * Math.PI * 2 + rng.range(-0.4, 0.4), d = i === 0 ? 0 : rng.range(0.7, 1.3) * scale;
      B.add(ng, this.m.foliage, Geo.matrix(x + Math.cos(a) * d, h + th + 1.1 * scale + rng.range(-0.3, 0.9) * scale + (i === 0 ? 0.9 * scale : 0), z + Math.sin(a) * d));
    }
  }

  _trees() {
    const rng = this.rng.fork(3), L = LAYOUT;
    const cz0 = L.crossZ - L.crossHalf - 6, cz1 = L.crossZ + L.crossHalf + 6;
    // left side
    for (let z = 30; z > -420; z -= 9.5) {
      if (z < cz1 && z > cz0) continue;
      if (Math.abs(z - L.busStop.z) < 4) continue;
      this._tree(-8.15, z + rng.range(-0.8, 0.8), rng, rng.range(0.9, 1.1));
    }
    // right side (kept clear near the viewer so the street stays readable)
    for (let z = 40; z > -420; z -= 9.5) {
      if (z < cz1 && z > cz0) continue;
      if (z < 22 && z > -56) continue;
      this._tree(8.15, z + rng.range(-0.8, 0.8), rng, rng.range(0.9, 1.1));
    }
  }

  /* ================================================================ */
  _streetLight(x, z, side) {
    const B = this.batch, h = LAYOUT.curbH, m = this.m;
    B.add(new THREE.CylinderGeometry(0.07, 0.11, 8.0, 8), m.metal, Geo.matrix(x, h + 4.0, z));
    B.add(new THREE.CylinderGeometry(0.16, 0.2, 0.5, 8), m.metal, Geo.matrix(x, h + 0.25, z));
    // arm toward road
    B.add(new THREE.CylinderGeometry(0.045, 0.05, 2.2, 6), m.metal, Geo.matrix(x - side * 1.0, h + 7.95, z, 0, 0, Math.PI / 2 - side * 0.12));
    B.box(0.75, 0.16, 0.36, x - side * 2.05, h + 7.95, z, m.metal);
    B.box(0.6, 0.03, 0.26, x - side * 2.05, h + 7.86, z, m.white, 0, { noShadow: true });
  }

  _streetFurniture() {
    const B = this.batch, m = this.m, L = LAYOUT, h = L.curbH;
    const rng = this.rng.fork(4);
    const cz0 = L.crossZ - L.crossHalf - 3, cz1 = L.crossZ + L.crossHalf + 3;
    for (let z = 40; z > -420; z -= 30) {
      if (!(z < cz1 && z > cz0) && !(z < 30 && z > -62)) this._streetLight(7.45, z, 1);
      if (!(z - 15 < cz1 && z - 15 > cz0)) this._streetLight(-7.45, z - 15, -1);
    }
    // hydrants
    for (const [x, z] of [[7.7, -24], [-7.7, -33], [7.7, -63], [-7.7, 14]]) {
      B.add(new THREE.CylinderGeometry(0.13, 0.15, 0.6, 10), m.red, Geo.matrix(x, h + 0.3, z));
      B.add(new THREE.SphereGeometry(0.14, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), m.red, Geo.matrix(x, h + 0.6, z));
      B.add(new THREE.CylinderGeometry(0.05, 0.05, 0.42, 6), m.red, Geo.matrix(x, h + 0.42, z, 0, 0, Math.PI / 2));
    }
    // trash cans
    for (const [x, z] of [[7.75, -27], [-7.8, -14], [-7.8, 8], [7.75, -62.5]]) {
      B.add(new THREE.CylinderGeometry(0.3, 0.27, 0.95, 12), m.metalGreen, Geo.matrix(x, h + 0.475, z));
      B.add(new THREE.CylinderGeometry(0.33, 0.33, 0.08, 12), m.metalGreen, Geo.matrix(x, h + 0.99, z));
    }
    // newspaper boxes + mailbox
    const npC = ['#c0392b', '#2471a3', '#f1c40f'];
    npC.forEach((c, i) => {
      B.box(0.45, 1.0, 0.45, -11.6, h + 0.5, -12.5 + i * 0.55, Mat.std(c, { roughness: 0.5 }));
      B.box(0.47, 0.03, 0.47, -11.6, h + 1.0, -12.5 + i * 0.55, m.metal);
    });
    B.box(0.55, 1.15, 0.5, -11.9, h + 0.58, -6, m.blueBox);
    B.add(new THREE.CylinderGeometry(0.25, 0.25, 0.55, 12, 1, false, 0, Math.PI), m.blueBox, Geo.matrix(-11.9, h + 1.15, -6, 0, 0, Math.PI / 2));
    // benches
    for (const [x, z, r] of [[-12.0, -10, Math.PI / 2], [12.0, 14, -Math.PI / 2]]) this._bench(x, z, r);
    // bike rack + bollards
    for (let i = 0; i < 4; i++) B.add(new THREE.TorusGeometry(0.38, 0.03, 6, 12, Math.PI), m.galv, Geo.matrix(-11.4, h, -40 + i * 0.8, 0, Math.PI / 2, 0));
    for (let i = 0; i < 3; i++) B.add(new THREE.CylinderGeometry(0.1, 0.1, 0.9, 8), m.metal, Geo.matrix(-7.6, h + 0.45, -63 - i * 1.4));
    // bus shelter
    this._busShelter(L.busStop.x, L.busStop.z);
    // street sign poles + name signs
    const nameA = Tex.label(['MAPLE AVE'], { w: 512, h: 112, font: 70, bg: '#1d6b3c', border: '#ffffff' });
    const nameB = Tex.label(['W 5TH ST'], { w: 512, h: 112, font: 70, bg: '#1d6b3c', border: '#ffffff' });
    const sa = new THREE.MeshStandardMaterial({ map: nameA, roughness: 0.5 });
    const sb = new THREE.MeshStandardMaterial({ map: nameB, roughness: 0.5 });
    for (const [x, z] of [[8.0, -35.2], [-8.0, -60.8]]) {
      B.add(new THREE.CylinderGeometry(0.04, 0.04, 3.3, 6), m.metal, Geo.matrix(x, h + 1.65, z));
      B.box(1.2, 0.26, 0.02, x, h + 3.15, z, sa);
      B.box(0.02, 0.26, 1.2, x, h + 2.85, z, sb);
    }
    // no-parking signs
    const np = Tex.label([['NO', 40], ['STOPPING', 44], ['ANY TIME', 30]], { w: 192, h: 256, bg: '#f4f4f0', fg: '#c0392b', border: '#c0392b' });
    const npm = new THREE.MeshStandardMaterial({ map: np, roughness: 0.6 });
    for (const [x, z] of [[7.5, 8], [-7.5, -26]]) {
      B.add(new THREE.CylinderGeometry(0.035, 0.035, 2.6, 6), m.metal, Geo.matrix(x, h + 1.3, z));
      B.box(0.02, 0.6, 0.45, x, h + 2.35, z, npm, 0, { noShadow: true });
    }
  }

  _bench(x, z, ry) {
    const B = this.batch, h = LAYOUT.curbH, wood = Mat.std('#7a5638', { roughness: 0.8 });
    const mm = Geo.matrix(x, h, z, 0, ry, 0);
    const parts = [[1.8, 0.05, 0.45, 0, 0.45, 0, wood], [1.8, 0.4, 0.05, 0, 0.72, -0.22, wood],
      [0.06, 0.45, 0.45, -0.8, 0.22, 0, this.m.metal], [0.06, 0.45, 0.45, 0.8, 0.22, 0, this.m.metal]];
    for (const [w, hh, d, px, py, pz, mat] of parts) {
      const g = new THREE.BoxGeometry(w, hh, d); g.translate(px, py, pz);
      B.add(g, mat, mm);
    }
  }

  _busShelter(x, z) {
    const B = this.batch, h = LAYOUT.curbH, m = this.m;
    const L = 4.2, D = 1.5, H = 2.5;
    for (const dz of [-L / 2, L / 2]) for (const dx of [-D / 2, D / 2]) B.box(0.07, H, 0.07, x + dx, h + H / 2, z + dz, m.metal);
    B.box(D + 0.4, 0.08, L + 0.3, x + 0.1, h + H + 0.04, z, m.metal);
    B.box(0.02, H - 0.3, L, x - D / 2, h + H / 2 + 0.1, z, m.glass, 0, { noShadow: true });
    B.box(D, H - 0.3, 0.02, x, h + H / 2 + 0.1, z - L / 2, m.glass, 0, { noShadow: true });
    // illuminated ad panel (electric — it stays on)
    const ad = new THREE.MeshStandardMaterial({ map: Tex.adPanel(7), emissiveMap: null, emissive: '#ffffff', roughness: 0.3 });
    ad.emissiveMap = ad.map; ad.emissiveIntensity = 0.9;
    this.dynamic.ad = ad;
    B.box(D - 0.1, 1.8, 0.12, x, h + 1.15, z + L / 2, m.metal);
    B.add(Geo.quad([x - 0.65, h + 0.3, z + L / 2 + 0.07], [x + 0.65, h + 0.3, z + L / 2 + 0.07], [x + 0.65, h + 2.0, z + L / 2 + 0.07], [x - 0.65, h + 2.0, z + L / 2 + 0.07]), ad, null, { noShadow: true });
    // bench inside
    const wood = Mat.std('#4f5a63', { roughness: 0.5, metalness: 0.4 });
    B.box(0.45, 0.05, 2.2, x - 0.4, h + 0.45, z, wood);
    B.box(0.05, 0.45, 2.2, x - 0.4, h + 0.22, z, m.metal);
    // route sign
    const rs = Tex.label([['BUS', 54], ['42 · 17', 40]], { w: 128, h: 192, bg: '#1d5fa8' });
    B.add(new THREE.CylinderGeometry(0.04, 0.04, 3.2, 6), m.metal, Geo.matrix(x + 0.9, h + 1.6, z - L / 2 - 0.6));
    B.box(0.03, 0.6, 0.4, x + 0.9, h + 2.9, z - L / 2 - 0.6, new THREE.MeshStandardMaterial({ map: rs }));
  }

  /* ================================================================ */
  _signals() {
    const L = LAYOUT, h = L.curbH, m = this.m, B = this.batch;
    const cz0 = L.crossZ - L.crossHalf, cz1 = L.crossZ + L.crossHalf;
    this.signalHeads = [];
    const headGeo = new THREE.BoxGeometry(0.36, 1.0, 0.3);
    const lampGeo = new THREE.CircleGeometry(0.1, 14);
    const housing = Mat.std('#1d2124', { roughness: 0.5 });
    const mkHead = (x, y, z, ry, group) => {
      B.add(headGeo, housing, Geo.matrix(x, y, z, 0, ry, 0));
      B.add(new THREE.BoxGeometry(0.55, 1.2, 0.03), housing, Geo.matrix(x - Math.sin(ry) * 0.17, y, z - Math.cos(ry) * 0.17, 0, ry, 0));
      const lamps = [];
      ['#ff2a1a', '#ffb000', '#22e07a'].forEach((c, i) => {
        const mat = new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
        const mesh = new THREE.Mesh(lampGeo, mat);
        mesh.position.set(x + Math.sin(ry) * 0.155, y + 0.3 - i * 0.3, z + Math.cos(ry) * 0.155);
        mesh.rotation.y = ry;
        this.root.add(mesh);
        lamps.push({ mesh, mat, color: new THREE.Color(c) });
        // visor
        B.add(new THREE.CylinderGeometry(0.13, 0.13, 0.16, 10, 1, true, -Math.PI / 2, Math.PI), housing, Geo.matrix(x + Math.sin(ry) * 0.23, y + 0.3 - i * 0.3 + 0.02, z + Math.cos(ry) * 0.23, Math.PI / 2, ry, 0));
      });
      this.signalHeads.push({ group, lamps });
    };
    // Mast arm for southbound traffic (faces the viewer) at far-right corner
    const mast = (px, pz, armDir, armLen, ry, group, heads) => {
      B.add(new THREE.CylinderGeometry(0.14, 0.19, 7.2, 10), m.metal, Geo.matrix(px, h + 3.6, pz));
      if (armDir === 'x') B.add(new THREE.CylinderGeometry(0.07, 0.1, armLen, 8), m.metal, Geo.matrix(px - Math.sign(px) * armLen / 2, h + 6.6, pz, 0, 0, Math.PI / 2));
      else B.add(new THREE.CylinderGeometry(0.07, 0.1, armLen, 8), m.metal, Geo.matrix(px, h + 6.6, pz - Math.sign(pz - L.crossZ) * armLen / 2, Math.PI / 2, 0, 0));
      for (const [hx, hz] of heads) mkHead(hx, h + 5.9, hz, ry, group);
      mkHead(px + Math.sin(ry) * 0.3, h + 3.2, pz + Math.cos(ry) * 0.3, ry, group);
    };
    mast(7.9, cz0 - 1.2, 'x', 7.5, 0, 'avenue', [[4.0, cz0 - 1.2], [1.3, cz0 - 1.2]]);        // faces +Z (toward viewer)
    mast(-7.9, cz1 + 1.2, 'x', 7.5, Math.PI, 'avenue', [[-4.0, cz1 + 1.2], [-1.3, cz1 + 1.2]]); // faces -Z
    mast(-7.9 - 1.2, cz0 - 0.5, 'z', 7.0, Math.PI / 2, 'cross', [[-9.1, cz0 + 3.8], [-9.1, cz0 + 1.5]]);
    mast(7.9 + 1.2, cz1 + 0.5, 'z', 7.0, -Math.PI / 2, 'cross', [[9.1, cz1 - 3.8], [9.1, cz1 - 1.5]]);
  }

  /* ================================================================ */
  _construction() {
    const B = this.batch, m = this.m, lot = LAYOUT.lot, h = LAYOUT.curbH;
    // lot ground
    B.add(Geo.flat(lot.x0, lot.x1, lot.z0, lot.z1, 0.01, 4), m.dirt, null, { noShadow: true });
    // hoarding along the sidewalk (front faces -X)
    const hz0 = lot.z0, hz1 = lot.z1, hx = lot.x0 + 0.05, HH = 2.5;
    B.add(Geo.quad([hx, h, hz0], [hx, h, hz1], [hx, h + HH, hz1], [hx, h + HH, hz0], 0, 0, (hz1 - hz0) / 8, 1), m.hoarding, null);
    B.box(0.06, HH, hz1 - hz0, hx + 0.04, h + HH / 2, (hz0 + hz1) / 2, m.plywood);
    for (let z = hz0; z <= hz1; z += 2.4) B.box(0.1, HH + 0.1, 0.1, hx + 0.12, h + HH / 2, z, m.plywood);
    // side hoarding toward the next building
    B.box(lot.x1 - lot.x0, HH, 0.06, (lot.x0 + lot.x1) / 2, h + HH / 2, lot.z0 + 0.05, m.plywood);

    // steel frame: columns + beams + slabs
    const xs = [13.6, 19.6, 25.6], zs = [-16.4, -22.6, -28.8, -34.8];
    const levels = [4.4, 8.4, 12.4];
    for (const x of xs) for (const z of zs) {
      B.box(0.32, 13.2, 0.32, x, 6.6, z, m.primer);
      B.box(0.08, 13.2, 0.42, x, 6.6, z, m.primer);
    }
    for (const y of levels) {
      for (const x of xs) B.box(0.22, 0.42, zs[0] - zs[zs.length - 1] + 0.3, x, y, (zs[0] + zs[zs.length - 1]) / 2, m.primer);
      for (const z of zs) B.box(xs[2] - xs[0] + 0.3, 0.42, 0.22, (xs[0] + xs[2]) / 2, y, z, m.primer);
    }
    // concrete slabs (level 1 full, level 2 partial)
    B.box(xs[2] - xs[0] + 0.9, 0.25, zs[0] - zs[3] + 0.9, (xs[0] + xs[2]) / 2, levels[0] + 0.03, (zs[0] + zs[3]) / 2, m.concrete);
    B.box(xs[2] - xs[0] + 0.9, 0.25, 12, (xs[0] + xs[2]) / 2, levels[1] + 0.03, -28.8, m.concrete);
    // safety railing on level 1 (yellow) + toe board
    const ry = levels[0] + 0.16;
    for (let z = zs[0] + 0.3; z >= zs[3] - 0.3; z -= 1.75) B.box(0.05, 1.1, 0.05, xs[0] - 0.36, ry + 0.55, z, m.yellow);
    for (const y of [0.55, 1.08]) B.box(0.05, 0.05, zs[0] - zs[3] + 0.6, xs[0] - 0.36, ry + y, (zs[0] + zs[3]) / 2, m.yellow);
    // material piles
    for (let i = 0; i < 4; i++) B.box(5.5, 0.3, 0.3, 19 + i * 0.05, 0.16 + i * 0.3, -24 + i * 0.32, m.primer);
    B.box(1.2, 1.0, 1.2, 22, 0.5, -18, m.plywood);
    B.box(1.2, 0.15, 1.2, 22, 1.07, -18, Mat.std('#3d6f99'));
    // cones on the sidewalk edge of the hoarding
    for (const z of [-14.1, -34.9]) {
      B.add(new THREE.ConeGeometry(0.18, 0.7, 12), m.orange, Geo.matrix(12.1, h + 0.35, z));
      B.box(0.38, 0.04, 0.38, 12.1, h + 0.02, z, Mat.std('#222'));
    }

    // tower crane
    const cx = 27.5, cz = -27, ch = 40;
    const mastGeo = new THREE.BoxGeometry(1.8, ch, 1.8);
    const uv = mastGeo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * (ch / 1.8));
    B.add(mastGeo, m.lattice, Geo.matrix(cx, ch / 2, cz));
    B.box(4, 1.2, 4, cx, 0.6, cz, m.concrete);
    const top = new THREE.Group();
    top.position.set(cx, ch, cz);
    const jibLen = 46, cjLen = 14;
    const jibGeo = new THREE.BoxGeometry(1.4, 1.6, jibLen);
    const ju = jibGeo.attributes.uv;
    for (let i = 0; i < ju.count; i++) { ju.setX(i, ju.getX(i) * (jibLen / 1.4)); }
    const jib = new THREE.Mesh(jibGeo, m.lattice);
    jib.position.set(0, 0.8, -jibLen / 2);
    const cj = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, cjLen), m.yellow);
    cj.position.set(0, 0.6, cjLen / 2);
    const cw = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.4, 3.2), m.concrete);
    cw.position.set(0, -0.6, cjLen - 2);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.0, 2.0), Mat.std('#e8e4d8'));
    cab.position.set(1.6, -1.0, -0.6);
    const apex = new THREE.Mesh(new THREE.BoxGeometry(1.2, 6, 1.2), m.lattice);
    apex.position.set(0, 3.8, 0);
    const trolleyZ = -30;
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 16, 4), m.metal);
    cable.position.set(0, -8, trolleyZ);
    const load = new THREE.Group();
    for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 6), m.primer); b.position.set((i - 1) * 0.38, 0, 0); load.add(b); }
    load.position.set(0, -16.4, trolleyZ);
    for (const o of [jib, cj, cw, cab, apex, cable, ...load.children]) { o.castShadow = true; }
    top.add(jib, cj, cw, cab, apex, cable, load);
    this.root.add(top);
    this.dynamic.crane = top;
    this.dynamic.craneLoad = load;
  }

  /* ================================================================ */
  _cart() {
    const B = this.batch, m = this.m, h = LAYOUT.curbH;
    const { x, z } = LAYOUT.cart;
    const g = new THREE.Group();
    g.position.set(x, h, z);
    this.root.add(g);
    const red = Mat.std('#c3352a', { roughness: 0.55 });
    const steelM = this.m.steel;
    const add = (geo, mat, px, py, pz, ry = 0) => { const me = new THREE.Mesh(geo, mat); me.position.set(px, py, pz); me.rotation.y = ry; me.castShadow = me.receiveShadow = true; g.add(me); return me; };
    // cabinet
    add(new THREE.BoxGeometry(0.85, 0.62, 1.9), red, 0, 0.71, 0);
    add(new THREE.BoxGeometry(0.97, 0.04, 2.02), steelM, 0, 1.04, 0);
    add(new THREE.BoxGeometry(0.88, 0.06, 1.93), steelM, 0, 0.4, 0);
    // signs on street side and front
    const signMat = new THREE.MeshStandardMaterial({ map: Tex.cartSign(), roughness: 0.5 });
    const sign1 = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.45), signMat); sign1.position.set(0.432, 0.74, 0); sign1.rotation.y = Math.PI / 2; g.add(sign1);
    const sign2 = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.2), signMat); sign2.position.set(0, 0.86, 0.952); g.add(sign2);
    // wheels & legs
    const wheelG = new THREE.CylinderGeometry(0.3, 0.3, 0.06, 18);
    for (const sx of [-0.47, 0.47]) { const w = add(wheelG, Mat.std('#222', { roughness: 0.7 }), sx, 0.3, -0.62); w.rotation.z = Math.PI / 2; }
    for (const sx of [-0.36, 0.36]) add(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 6), steelM, sx, 0.2, 0.85);
    // grill tray (open top)
    const gx = 0, gy = 1.06, gz = 0.42, gw = 0.62, gd = 0.95, gh = 0.2;
    const dark = Mat.std('#1b1b1c', { roughness: 0.6, metalness: 0.5 });
    add(new THREE.BoxGeometry(gw, 0.03, gd), dark, gx, gy + 0.015, gz);
    add(new THREE.BoxGeometry(0.03, gh, gd), dark, gx - gw / 2, gy + gh / 2, gz);
    add(new THREE.BoxGeometry(0.03, gh, gd), dark, gx + gw / 2, gy + gh / 2, gz);
    add(new THREE.BoxGeometry(gw, gh, 0.03), dark, gx, gy + gh / 2, gz - gd / 2);
    add(new THREE.BoxGeometry(gw, gh, 0.03), dark, gx, gy + gh / 2, gz + gd / 2);
    // glowing coals (emissive dims after oxygen is gone)
    const coalMat = new THREE.MeshStandardMaterial({ color: '#2a1a12', emissive: new THREE.Color('#ff5a14'), emissiveIntensity: 2.2, roughness: 0.9 });
    // coal bed: one merged mesh (70 lumps, 1 draw call)
    const coalGeos = [];
    for (let i = 0; i < 70; i++) {
      const c = new THREE.DodecahedronGeometry(0.045, 0);
      c.applyMatrix4(Geo.matrix(gx + (hash1(i * 3) - 0.5) * (gw - 0.08), gy + 0.05 + hash1(i * 7) * 0.03, gz + (hash1(i * 11) - 0.5) * (gd - 0.08), hash1(i) * 3, hash1(i + 1) * 3, 0));
      coalGeos.push(Geo.prep(c));
    }
    const coals = new THREE.Mesh(THREE.mergeGeometries(coalGeos), coalMat);
    coals.receiveShadow = true;
    g.add(coals);
    // grate + skewers
    for (let i = 0; i < 9; i++) add(new THREE.BoxGeometry(gw - 0.04, 0.012, 0.012), steelM, gx, gy + gh - 0.02, gz - gd / 2 + 0.06 + i * 0.105);
    const meat = Mat.std('#7a3a1e', { roughness: 0.7 }), pepper = Mat.std('#3f8f2f'), onion = Mat.std('#d9c9a8');
    for (let i = 0; i < 6; i++) {
      const sz = gz - gd / 2 + 0.12 + i * 0.14;
      add(new THREE.CylinderGeometry(0.005, 0.005, gw + 0.12, 4), steelM, gx, gy + gh + 0.01, sz).rotation.z = Math.PI / 2;
      for (let k = 0; k < 5; k++) add(new THREE.BoxGeometry(0.06, 0.05, 0.05), [meat, meat, pepper, meat, onion][(k + i) % 5], gx - 0.2 + k * 0.1, gy + gh + 0.012, sz);
    }
    // umbrella
    add(new THREE.CylinderGeometry(0.02, 0.02, 2.5, 6), steelM, 0.3, 1.3, -0.55);
    const um = Tex.canvas(256, 32), ux = um.getContext('2d');
    for (let i = 0; i < 8; i++) { ux.fillStyle = i % 2 ? '#f3efe6' : '#c8302a'; ux.fillRect(i * 32, 0, 32, 32); }
    const umbMat = new THREE.MeshStandardMaterial({ map: Tex.tex(um), side: THREE.DoubleSide, roughness: 0.8 });
    const canopy = add(new THREE.ConeGeometry(1.35, 0.5, 16, 1, true), umbMat, 0.3, 2.62, -0.55);
    canopy.castShadow = true;
    // condiments, napkins
    add(new THREE.CylinderGeometry(0.03, 0.03, 0.18, 8), Mat.std('#c0261c', { roughness: 0.3 }), 0.25, 1.15, -0.55);
    add(new THREE.CylinderGeometry(0.03, 0.03, 0.18, 8), Mat.std('#e2b420', { roughness: 0.3 }), 0.33, 1.15, -0.55);
    add(new THREE.BoxGeometry(0.14, 0.1, 0.1), Mat.std('#e8e8e8'), 0.2, 1.11, -0.8);
    // cooler behind
    add(new THREE.BoxGeometry(0.5, 0.42, 0.7), Mat.std('#2f6fb3', { roughness: 0.5 }), 0.0, 0.21, -1.35);
    // A-frame menu board facing the viewer
    const menu = Tex.label([['GRILL', 46], ['KEBAB  $9', 30], ['CORN  $4', 30], ['SODA  $2', 30]], { w: 256, h: 320, bg: '#1d1d1d', fg: '#f2efe6' });
    const mb = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.85, 0.03), new THREE.MeshStandardMaterial({ map: menu, roughness: 0.8 }));
    mb.position.set(1.9, 0.43, 0.25); mb.rotation.x = -0.18; mb.rotation.y = -0.15; mb.castShadow = true; g.add(mb);

    this.dynamic.coals = coalMat;
    this.anchors.grill = new THREE.Vector3(x + gx, h + gy + gh, z + gz);
    this.anchors.grillSize = { w: gw, d: gd };
    // warm light from the fire
    const fireLight = new THREE.PointLight('#ff8a3a', 6, 7, 1.6);
    fireLight.position.set(x, h + 1.7, z + gz);
    this.root.add(fireLight);
    this.dynamic.fireLight = fireLight;
  }

  /* road works in the curb lane: cones, barricade, steel plate, battery scissor lift, lamp post */
  _roadWorks() {
    const B = this.batch, m = this.m, W = LAYOUT.works, h = LAYOUT.curbH;
    const z = W.z;
    // cones closing the curb lane (+ taper)
    const coneMat = m.orange, white = Mat.std('#f2f2ee', { roughness: 0.5 });
    const cone = (x, zz) => {
      B.add(new THREE.ConeGeometry(0.17, 0.72, 14), coneMat, Geo.matrix(x, 0.36, zz));
      B.add(new THREE.CylinderGeometry(0.105, 0.125, 0.1, 14), white, Geo.matrix(x, 0.42, zz), { noShadow: true });
      B.box(0.4, 0.04, 0.4, x, 0.02, zz, Mat.std('#1d1d1d'));
    };
    for (let i = 0; i < 4; i++) cone(6.6 - i * 0.95, -2.2 - i * 1.3);
    for (let zz = -6.2; zz > -26; zz -= 2.4) cone(3.75, zz);
    // type III barricade across the closed lane
    const stripe = Tex.canvas(256, 32), sx = stripe.getContext('2d');
    for (let i = -2; i < 12; i++) { sx.fillStyle = i % 2 ? '#f3f3ee' : '#e8611a'; sx.beginPath(); sx.moveTo(i * 24, 32); sx.lineTo(i * 24 + 24, 32); sx.lineTo(i * 24 + 40, 0); sx.lineTo(i * 24 + 16, 0); sx.fill(); }
    const stripeMat = new THREE.MeshStandardMaterial({ map: Tex.tex(stripe), roughness: 0.5 });
    for (const x of [4.3, 6.6]) B.box(0.07, 1.5, 0.07, x, 0.75, -5.2, m.galv);
    for (const y of [0.55, 0.95, 1.35]) B.box(2.6, 0.2, 0.03, 5.45, y, -5.2, stripeMat);
    // "ROAD WORK" diamond sign
    const rw = Tex.label([['ROAD', 64], ['WORK', 64]], { w: 256, h: 256, bg: '#f08a1c', fg: '#111' });
    const signMat = new THREE.MeshStandardMaterial({ map: rw, roughness: 0.6 });
    B.add(new THREE.PlaneGeometry(0.85, 0.85), signMat, Geo.matrix(6.4, 1.75, -27.5, 0, 0.25, Math.PI / 4), { noShadow: true });
    for (const [dx, dz] of [[-0.3, 0.2], [0.3, 0.2], [0, -0.3]]) B.add(new THREE.CylinderGeometry(0.018, 0.018, 1.6, 5), m.metal, Geo.matrix(6.4 + dx * 0.5, 0.75, -27.55 + dz * 0.5, dz * 0.35, 0, -dx * 0.35));
    // steel road plate + trench edge
    B.box(2.4, 0.04, 1.6, 5.2, 0.02, -19.5, Mat.std('#3a3c3e', { roughness: 0.45, metalness: 0.7 }));
    // lamp post the crew is working on, with the bracket being cut
    const px = W.poleX;
    B.add(new THREE.CylinderGeometry(0.08, 0.12, 8.0, 8), m.metal, Geo.matrix(px, h + 4.0, z));
    B.add(new THREE.CylinderGeometry(0.17, 0.21, 0.5, 8), m.metal, Geo.matrix(px, h + 0.25, z));
    B.add(new THREE.CylinderGeometry(0.045, 0.05, 2.2, 6), m.metal, Geo.matrix(px - 1.0, h + 7.95, z, 0, 0, Math.PI / 2 - 0.12));
    B.box(0.75, 0.16, 0.36, px - 2.05, h + 7.95, z, m.metal);
    B.box(0.36, 0.14, 0.14, px - 0.22, 5.3, z, m.primer);  // rusty bracket being cut off
    // battery scissor lift (electric: keeps working without oxygen)
    const lx = W.liftX, liftMat = Mat.std('#e8701a', { roughness: 0.55 }), grey = Mat.std('#4a4e54', { roughness: 0.5, metalness: 0.4 });
    B.box(1.15, 0.5, 2.5, lx, 0.38, z, liftMat);
    B.box(0.5, 0.35, 0.7, lx, 0.8, z + 0.6, grey);                                // battery pack
    for (const dx of [-0.5, 0.5]) for (const dz of [-0.95, 0.95]) {
      const w = new THREE.CylinderGeometry(0.16, 0.16, 0.14, 14); w.rotateZ(Math.PI / 2);
      B.add(w, Mat.std('#161617', { roughness: 0.9 }), Geo.matrix(lx + dx, 0.16, z + dz));
    }
    const levels = 4, top = 4.0, base = 0.66, lh = (top - base) / levels;
    const span = 2.0, len = Math.hypot(span, lh), ang = Math.atan2(lh, span);
    for (const dx of [-0.48, 0.48]) for (let i = 0; i < levels; i++) {
      const y = base + lh * (i + 0.5);
      for (const sgn of [-1, 1]) B.add(new THREE.BoxGeometry(0.06, 0.09, len), grey, Geo.matrix(lx + dx, y, z, sgn * ang, 0, 0));
    }
    B.box(1.2, 0.12, 2.6, lx, top + 0.0, z, liftMat);
    // platform railings
    const rail = m.yellow, rt = top + 1.05;
    for (const dx of [-0.58, 0.58]) { B.box(0.04, 0.04, 2.6, lx + dx, rt, z, rail); B.box(0.04, 0.04, 2.6, lx + dx, top + 0.55, z, rail); }
    for (const dz of [-1.28, 1.28]) { B.box(1.2, 0.04, 0.04, lx, rt, z + dz, rail); B.box(1.2, 0.04, 0.04, lx, top + 0.55, z + dz, rail); }
    for (const dx of [-0.58, 0.58]) for (const dz of [-1.28, 0, 1.28]) B.box(0.04, 1.05, 0.04, lx + dx, top + 0.53, z + dz, rail);
    this.anchors.grinder = new THREE.Vector3(px - 0.42, 5.3, z);
  }

  _cafe() {
    const B = this.batch, h = LAYOUT.curbH;
    const metal = this.m.metal, top = Mat.std('#e4e0d6', { roughness: 0.5 });
    const tables = [[LAYOUT.cafe.x, LAYOUT.cafe.z], [LAYOUT.cafe.x, LAYOUT.cafe.z - 2.6]];
    for (const [x, z] of tables) {
      B.add(new THREE.CylinderGeometry(0.36, 0.36, 0.03, 16), top, Geo.matrix(x, h + 0.74, z));
      B.add(new THREE.CylinderGeometry(0.03, 0.03, 0.72, 6), metal, Geo.matrix(x, h + 0.37, z));
      B.add(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 12), metal, Geo.matrix(x, h + 0.01, z));
      // chairs
      for (const dx of [-0.68, 0.68]) {
        B.box(0.42, 0.04, 0.42, x + dx, h + 0.45, z, metal);
        B.box(0.04, 0.45, 0.42, x + dx + Math.sign(dx) * 0.2, h + 0.7, z, metal);
        for (const [lx, lz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) B.box(0.025, 0.45, 0.025, x + dx + lx, h + 0.22, z + lz, metal);
      }
      // cups
      B.add(new THREE.CylinderGeometry(0.04, 0.035, 0.08, 10), Mat.std('#fafafa'), Geo.matrix(x - 0.12, h + 0.8, z + 0.05));
      B.add(new THREE.CylinderGeometry(0.04, 0.035, 0.08, 10), Mat.std('#fafafa'), Geo.matrix(x + 0.14, h + 0.8, z - 0.07));
    }
    // patio heater (gas) — its flame dies with the others
    const px = -12.0, pz = LAYOUT.cafe.z + 1.6;
    B.add(new THREE.CylinderGeometry(0.25, 0.3, 0.6, 12), this.m.steel, Geo.matrix(px, h + 0.3, pz));
    B.add(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 8), this.m.steel, Geo.matrix(px, h + 1.4, pz));
    B.add(new THREE.ConeGeometry(0.5, 0.25, 16, 1, true), this.m.steel, Geo.matrix(px, h + 2.35, pz, Math.PI));
    this.anchors.heater = new THREE.Vector3(px, h + 2.12, pz);
  }

  /* ================================================================ */
  update(t, tl) {
    this.skyUniforms.uTime.value = t;
    const o2 = SCRIPT_TRACKS.skyO2.value(t);
    this.skyUniforms.uO2.value = o2;
    // fog follows the sky colour a little
    this.scene.fog.color.copy(this.horizonColor).multiplyScalar(MathX.lerp(0.93, 1.0, o2));
    // coals keep glowing (they are hot) but dim once nothing can burn
    // hot coals glow because they are HOT, not because they burn: bright orange → dull red, then they stay red for minutes
    const dim = MathX.smooth(t, tl.at('flames_out'), tl.at('flames_out') + 3.5);
    this.dynamic.coals.emissiveIntensity = MathX.lerp(2.4, 0.8, dim) * (1 + 0.08 * Math.sin(t * 9.3) * (1 - dim)) - 0.012 * Math.max(0, t - tl.at('flames_out') - 3.5);
    this.dynamic.coals.emissive.setRGB(1, MathX.lerp(0.35, 0.16, dim), MathX.lerp(0.08, 0.03, dim));
    // fire light flickers then dies with the flames
    const f = FX_FLAME_LEVEL(t, tl);
    this.dynamic.fireLight.intensity = 5.5 * f * (0.82 + 0.18 * noise1(t * 14, 4)) + 0.35 * (1 - dim * 0.6);
    // crane slewing slowly (electric) — stops when the operator is impaired
    const slew = MathX.smooth(t, 11.5, 13.5);
    const ang = 0.18 + 0.018 * Math.min(t, 11.5) + 0.009 * slew;
    this.dynamic.crane.rotation.y = ang;
    this.dynamic.craneLoad.rotation.y = Math.sin(t * 0.4) * 0.08;
    // mains electricity: ~60 % of power comes from burning fuel, so the grid collapses seconds later
    const gp = this.gridPower(t);
    for (const m of this.shopMats) { m.emissiveIntensity = 0.55 * gp; m.color.setScalar(MathX.lerp(0.78, 1, gp)); }
    if (this.dynamic.ad) this.dynamic.ad.emissiveIntensity = 0.9 * gp;
    this._updateSignals(t, gp);
  }

  // 1 = mains power on, 0 = blackout (with a stuttering failure)
  gridPower(t) {
    const g = SCRIPT.grid;
    if (!g || g.fail === null || g.fail === undefined) return 1;
    const a = t - g.fail;
    if (a < -0.25) return 1;
    if (a > 0.45) return 0;
    const flick = hash1(Math.floor(t * 24) + 77);
    return a < 0 ? (flick > 0.35 ? 1 : 0.35) : (flick > 0.7 ? 0.6 : 0.05) * (1 - a / 0.45);
  }

  _updateSignals(t, gp) {
    // normal cycle: avenue green until 7.0, amber to 8.5, then red; cross street turns green at 9.0
    const av = t < 7.0 ? 2 : t < 8.5 ? 1 : 0;
    const cr = t < 9.0 ? 0 : 2;
    // after the blackout the signal controllers run on battery backup: flashing red
    const g = SCRIPT.grid, onBattery = g && g.fail !== null && t > g.fail + 1.0;
    const flashOn = onBattery && Math.floor((t - g.fail - 1.0) * 1.2) % 2 === 0;
    for (const h of this.signalHeads) {
      const on = h.group === 'avenue' ? av : cr;
      h.lamps.forEach((l, i) => {
        let lit = i === on ? gp : 0;
        if (onBattery) lit = i === 0 && flashOn ? 1 : 0;
        l.mat.color.copy(l.color).multiplyScalar(0.06 + 5.9 * lit);
      });
    }
  }
}

// O2-dependent flame level (shared by environment light and FX)
function FX_FLAME_LEVEL(t, tl) {
  const o2 = SCRIPT_TRACKS.oxygen.value(t);
  // flames shrink below ~18 % and go out around 15 %
  if (t < tl.at('oxygen_drop')) return 1;
  const base = MathX.smooth(o2, 14.6, 18.5);
  return base * (t > tl.at('flames_out') ? 0 : 1);
}
