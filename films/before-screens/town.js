/* =====================================================================
   HISTORIC TOWN — one reusable neighbourhood, c. 1905.
   A dirt street with stone gutters and plank sidewalks; painted clapboard
   houses with porches (front-gable and side-gable), a few brick shopfronts;
   picket fences, side yards with grass and washing lines, elms and maples,
   gas street lamps, a pump, barrels, a handcart, a bicycle; the street runs
   on into warm haze toward a church steeple.
   All static scenery is merged per material (few draw calls); house colours
   are vertex colours over shared grey-scale textures.
   ===================================================================== */

class HistoricTown {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.root = new THREE.Group();
    this.root.name = 'town';
    scene.add(this.root);
    this.B = new Batcher();
    this.rng = new RNG(1905);
    this.dynamic = {};
  }

  build() {
    this._materials();
    this._sky();
    this._lights();
    this._street();
    this._houses();
    this._trees();
    this._props();
    this._distant();
    this.meshes = this.B.build(this.root, 'town');
    for (const m of this.meshes) { m.receiveShadow = true; }
    this._envMap();
  }

  /* ---------------- textures + materials ---------------- */
  _materials() {
    const r = new RNG(77);
    const grain = (ctx, w, h, n, a) => { for (let i = 0; i < n; i++) { ctx.fillStyle = `rgba(0,0,0,${r.range(0.02, a)})`; ctx.fillRect(r.range(0, w), r.range(0, h), r.range(1, 3), r.range(4, 22)); } };
    // clapboard: 10 boards per 1.2 m, a shadow line under each board, faint grain, the odd butt joint
    const clap = Tex.canvas(256, 256), c = clap.getContext('2d');
    for (let i = 0; i < 10; i++) {
      const y = i * 25.6, v = 226 + r.range(-8, 8);
      c.fillStyle = `rgb(${v},${v},${v})`; c.fillRect(0, y, 256, 25.6);
      const g = c.createLinearGradient(0, y, 0, y + 25.6); g.addColorStop(0, 'rgba(255,255,255,0.12)'); g.addColorStop(0.75, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.16)');
      c.fillStyle = g; c.fillRect(0, y, 256, 25.6);
      c.fillStyle = 'rgba(40,36,30,0.55)'; c.fillRect(0, y + 23.6, 256, 2.2);
      if (r.chance(0.5)) { const x = r.range(20, 236); c.fillStyle = 'rgba(40,36,30,0.35)'; c.fillRect(x, y, 1.5, 24); }
    }
    grain(c, 256, 256, 260, 0.05);
    Tex.blotches(c, 256, 256, 14, 6, 26, () => `rgba(120,110,90,${r.range(0.03, 0.08)})`, r);
    // wooden shingles: staggered rows, varied tone, dark gaps
    const sh = Tex.canvas(256, 256), s = sh.getContext('2d');
    s.fillStyle = '#5a5650'; s.fillRect(0, 0, 256, 256);
    for (let row = 0; row < 16; row++) {
      let x = (row % 2) * -9;
      while (x < 256) {
        const w = r.range(12, 24), v = 150 + r.range(-35, 25);
        s.fillStyle = `rgb(${v},${v - 3},${v - 8})`; s.fillRect(x + 1, row * 16 + 1, w - 2, 15);
        s.fillStyle = 'rgba(0,0,0,0.28)'; s.fillRect(x + 1, row * 16 + 13, w - 2, 3);
        x += w;
      }
    }
    // brick
    const br = Tex.canvas(256, 256), b = br.getContext('2d');
    b.fillStyle = '#b8b2a6'; b.fillRect(0, 0, 256, 256);
    for (let row = 0; row < 32; row++) for (let k = -1; k < 9; k++) {
      const x = k * 32 + (row % 2) * 16, v = r.range(-14, 14);
      b.fillStyle = `rgb(${150 + v},${78 + v * 0.6},${62 + v * 0.5})`; b.fillRect(x + 1, row * 8 + 1, 30, 6);
    }
    grain(b, 256, 256, 120, 0.06);
    // dirt street: 10 m wide × 20 m long per tile; two wheel ruts, a trodden centre, pebbles
    const dirt = Tex.canvas(512, 1024), d = dirt.getContext('2d');
    d.fillStyle = '#937a58'; d.fillRect(0, 0, 512, 1024);
    Tex.blotches(d, 512, 1024, 260, 10, 70, () => (r.chance(0.5) ? `rgba(120,96,66,${r.range(0.05, 0.14)})` : `rgba(196,176,140,${r.range(0.05, 0.12)})`), r);
    for (const u of [0.31, 0.43, 0.57, 0.69]) {
      const x = u * 512;
      for (let y = 0; y < 1024; y += 4) { d.fillStyle = `rgba(92,72,48,${0.1 + 0.08 * Math.sin(y * 0.02 + u * 9)})`; d.fillRect(x - 9 + Math.sin(y * 0.011 + u * 20) * 3, y, 18, 4); }
    }
    for (let i = 0; i < 2600; i++) { const v = r.range(90, 200); d.fillStyle = `rgba(${v},${v * 0.92},${v * 0.82},${r.range(0.3, 0.8)})`; d.fillRect(r.range(0, 512), r.range(0, 1024), r.range(1, 3), r.range(1, 3)); }
    Tex.noise(d, 512, 1024, 14, r);
    // plank sidewalk: boards across the walk
    const pl = Tex.canvas(256, 256), p = pl.getContext('2d');
    for (let i = 0; i < 8; i++) {
      const v = r.range(-14, 12);
      p.fillStyle = `rgb(${142 + v},${124 + v},${100 + v})`; p.fillRect(0, i * 32, 256, 32);
      p.fillStyle = 'rgba(30,24,18,0.55)'; p.fillRect(0, i * 32 + 30, 256, 2);
      for (let k = 0; k < 2; k++) { p.fillStyle = 'rgba(30,24,18,0.5)'; p.fillRect(r.range(10, 246), i * 32 + 13, 3, 3); }
    }
    grain(p, 256, 256, 300, 0.06);
    // grass
    const gr = Tex.canvas(256, 256), q = gr.getContext('2d');
    q.fillStyle = '#5f7a3a'; q.fillRect(0, 0, 256, 256);
    Tex.blotches(q, 256, 256, 120, 6, 30, () => (r.chance(0.5) ? `rgba(70,96,40,${r.range(0.1, 0.3)})` : `rgba(130,150,70,${r.range(0.08, 0.2)})`), r);
    for (let i = 0; i < 3000; i++) { q.fillStyle = r.chance(0.5) ? 'rgba(40,60,20,0.35)' : 'rgba(150,170,90,0.3)'; q.fillRect(r.range(0, 256), r.range(0, 256), 1, r.range(2, 5)); }
    // cobbled gutter stones: irregular, dusty, darker than the street
    const cb = Tex.canvas(256, 128), k = cb.getContext('2d');
    k.fillStyle = '#5a5248'; k.fillRect(0, 0, 256, 128);
    for (let i = 0; i < 70; i++) { const v = r.range(95, 140); k.fillStyle = `rgb(${v},${v - 6},${v - 14})`; k.beginPath(); k.ellipse(r.range(0, 256), r.range(0, 128), r.range(8, 16), r.range(6, 12), r.range(0, 3), 0, Math.PI * 2); k.fill(); }
    Tex.blotches(k, 256, 128, 20, 8, 30, () => `rgba(160,140,110,${r.range(0.1, 0.25)})`, r);
    const T = (cv, o) => Tex.tex(cv, o);
    const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.85, metalness: 0 }, o));
    this.m = {
      clap: std({ map: T(clap), vertexColors: true, name: 'clapboard' }),
      trim: std({ color: '#ffffff', vertexColors: true, roughness: 0.7, name: 'trim' }),
      shingle: std({ map: T(sh), vertexColors: true, roughness: 0.9, name: 'shingle' }),
      brick: std({ map: T(br), roughness: 0.9, name: 'brick' }),
      glass: std({ color: '#33414a', roughness: 0.08, envMapIntensity: 1.1, name: 'glass' }),
      curtain: std({ color: '#e8dfc8', roughness: 0.95, name: 'curtain' }),
      door: std({ color: '#ffffff', vertexColors: true, roughness: 0.6, name: 'door' }),
      porch: std({ color: '#8c8780', roughness: 0.85, name: 'porchFloor' }),
      stone: std({ color: '#8e877a', roughness: 0.95, name: 'stone' }),
      dirt: std({ map: T(dirt), roughness: 0.97, name: 'dirt' }),
      plank: std({ map: T(pl), roughness: 0.9, name: 'plank' }),
      grass: std({ map: T(gr), roughness: 0.97, name: 'grass' }),
      gutter: std({ map: T(cb), roughness: 0.92, name: 'gutter' }),
      iron: std({ color: '#26282a', roughness: 0.45, metalness: 0.7, name: 'iron' }),
      lampGlass: std({ color: '#f2ead8', roughness: 0.2, emissive: '#3a3020', name: 'lampGlass' }),
      wood: std({ color: '#7d6448', roughness: 0.85, name: 'wood' }),
      weathered: std({ color: '#9a9284', roughness: 0.9, name: 'weathered' }),
      picket: std({ color: '#e9e5da', roughness: 0.75, name: 'picket' }),
      chimney: std({ map: T(br), roughness: 0.9, name: 'chimneyBrick' }),
      bark: std({ color: '#4e4236', roughness: 0.95, name: 'bark' }),
      leaf: std({ color: '#ffffff', vertexColors: true, roughness: 0.92, flatShading: true, name: 'leaf' }),
      cloth: std({ color: '#ffffff', vertexColors: true, roughness: 0.95, side: THREE.DoubleSide, name: 'cloth' }),
      sign: std({ color: '#ffffff', roughness: 0.8, name: 'sign' }),
    };
    this.m.clap.map.repeat.set(1, 1);
  }

  /* ---------------- sky, light ---------------- */
  _sky() {
    this.sunDir = new THREE.Vector3(0.45, 0.62, 0.64).normalize();   // late morning, from the south-east
    this.zenith = new THREE.Color('#6a98c6'); this.horizon = new THREE.Color('#dcd8c8'); this.fogColor = new THREE.Color('#cfc9b6');
    const mat = new THREE.ShaderMaterial({
      uniforms: { uZenith: { value: this.zenith }, uHorizon: { value: this.horizon }, uSun: { value: this.sunDir }, uTime: { value: 0 } },
      side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: /* glsl */`
        uniform vec3 uZenith, uHorizon, uSun; uniform float uTime; varying vec3 vD;
        float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float n2(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f); return mix(mix(h2(i), h2(i + vec2(1, 0)), u.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), u.x), u.y); }
        float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * n2(p); p *= 2.03; a *= 0.5; } return v; }
        void main(){
          vec3 d = normalize(vD); float h = d.y;
          vec3 col = mix(uHorizon, uZenith, pow(smoothstep(-0.02, 0.55, h), 0.75));
          float sd = max(dot(d, uSun), 0.0);
          col += vec3(1.0, 0.9, 0.7) * (pow(sd, 8.0) * 0.18 + pow(sd, 400.0) * 1.5);
          // fair-weather cumulus: separate soft heaps, brighter tops toward the sun
          if (h > 0.0) {
            vec2 uv = d.xz / (h + 0.12) * 0.55 + vec2(uTime * 0.004, 0.0);
            float c = fbm(uv * 1.3);
            float heap = smoothstep(0.47, 0.66, c) * smoothstep(0.02, 0.2, h);
            vec3 cloud = mix(vec3(0.86, 0.86, 0.88), vec3(1.04, 1.0, 0.95), smoothstep(0.55, 0.85, fbm(uv * 2.6 + 4.0)) * 0.7 + pow(sd, 3.0) * 0.4);
            col = mix(col, cloud, heap * 0.85);
          }
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 40, 20), mat);
    sky.frustumCulled = false; sky.renderOrder = -10; sky.name = 'sky';
    this.root.add(sky);
    this.sky = sky;
    this.scene.fog = new THREE.FogExp2(this.fogColor.clone(), 0.0062);
    this.scene.background = this.horizon.clone();
  }

  _lights() {
    const sun = new THREE.DirectionalLight('#ffeccc', 3.0);
    sun.position.copy(this.sunDir).multiplyScalar(120).add(new THREE.Vector3(0, 0, -10));
    sun.target.position.set(0, 0, -10);
    sun.castShadow = CONFIG.render.shadows;
    sun.shadow.mapSize.set(CONFIG.render.shadowMapSize, CONFIG.render.shadowMapSize);
    const sc = sun.shadow.camera; sc.left = -48; sc.right = 48; sc.top = 48; sc.bottom = -48; sc.near = 20; sc.far = 260;
    sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.03; sun.shadow.radius = 3;
    this.scene.add(sun, sun.target);
    this.sun = sun;
    this.hemi = new THREE.HemisphereLight('#c2d6ea', '#7d6c52', 0.95);
    this.scene.add(this.hemi);
  }

  _envMap() {
    const pm = new THREE.PMREMGenerator(this.renderer);
    const s = new THREE.Scene();
    s.add(this.sky.clone());
    const g = new THREE.Mesh(new THREE.CircleGeometry(600, 24), new THREE.MeshBasicMaterial({ color: '#8a7a60' })); g.rotation.x = -Math.PI / 2; g.position.y = -1; s.add(g);
    const bm = new THREE.MeshBasicMaterial({ color: '#b8ab92' });
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; const b = new THREE.Mesh(new THREE.BoxGeometry(30, 18, 30), bm); b.position.set(Math.cos(a) * 60, 0, Math.sin(a) * 60); s.add(b); }
    this.envTex = pm.fromScene(s, 0.02, 0.1, 1000).texture;
    this.scene.environment = this.envTex;
    this.scene.environmentIntensity = 0.5;
    pm.dispose();
  }

  /* ---------------- ground: street, gutters, sidewalks, yards ---------------- */
  _street() {
    const B = this.B, m = this.m, S = BS.street, z0 = 60, z1 = -170;
    const road = Geo.quad([-S.half, 0, z0], [S.half, 0, z0], [S.half, 0, z1], [-S.half, 0, z1], 0, 0, 1, (z0 - z1) / 20);
    B.add(road, m.dirt, null, { noShadow: true });
    for (const sd of [-1, 1]) {
      const g0 = sd * S.half, g1 = sd * S.gutter, w1 = sd * S.walk;
      const [a, b] = sd > 0 ? [g0, g1] : [g1, g0];
      B.add(Geo.quad([a, 0.02, z0], [b, 0.02, z0], [b, 0.02, z1], [a, 0.02, z1], 0, 0, 1, (z0 - z1) / 1.2), m.gutter, null, { noShadow: true });
      // kerb stones under the plank walk
      B.box(0.12, 0.14, z0 - z1, sd * (S.gutter + 0.06), 0.06, (z0 + z1) / 2, m.stone, 0, { noShadow: true });
      const [c, d] = sd > 0 ? [g1, w1] : [w1, g1];
      B.add(Geo.quad([c, S.walkY, z0], [d, S.walkY, z0], [d, S.walkY, z1], [c, S.walkY, z1], 0, 0, 1, (z0 - z1) / 1.2), m.plank, null, { noShadow: true });
      // yards / lots behind the walk
      const [e, f] = sd > 0 ? [w1, 40] : [-40, w1];
      B.add(Geo.quad([e, 0.06, z0], [f, 0.06, z0], [f, 0.06, z1], [e, 0.06, z1], e / 3, z0 / 3, f / 3, z1 / 3), m.grass, null, { noShadow: true });
    }
    // grass tufts along fences and walls (instanced, one draw call)
    const tuft = new THREE.ConeGeometry(0.07, 0.22, 4, 1); tuft.translate(0, 0.11, 0);
    const tm = new THREE.MeshStandardMaterial({ color: '#6c8a3e', roughness: 0.95, flatShading: true, name: 'tuft' });
    const N = 900, im = new THREE.InstancedMesh(tuft, tm, N), r = new RNG(31), M4 = new THREE.Matrix4(), col = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const sd = r.chance(0.5) ? 1 : -1, x = sd * r.range(S.walk + 0.05, 16), z = r.range(-120, 40);
      if (Math.abs(x) < 9.9 && Math.abs(x) > S.walk + 0.4 && r.chance(0.6)) continue;
      const s = r.range(0.6, 1.5);
      M4.compose(new THREE.Vector3(x, 0.06, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(r.range(-0.2, 0.2), r.range(0, 6), r.range(-0.2, 0.2))), new THREE.Vector3(s, s * r.range(0.7, 1.4), s));
      im.setMatrixAt(i, M4);
      im.setColorAt(i, col.setHSL(r.range(0.2, 0.27), r.range(0.35, 0.5), r.range(0.28, 0.4)));
    }
    im.receiveShadow = true; im.castShadow = false;
    this.root.add(im);
  }

  /* ---------------- houses ---------------- */
  // place a house: x = front wall position (|x|), side +1 = east side (faces west), z = centre
  _houses() {
    const r = new RNG(5150);
    const paints = ['#e9e1cc', '#cdd5c0', '#b7c4cc', '#e8dfc4', '#c9b79a', '#9fb0a0', '#d9cfb8', '#a8463c', '#e4e0d6', '#b9a888', '#c2cdd2', '#d8c9a4'];
    const trims = ['#f1ede4', '#ebe6da', '#f4f0e6', '#e6dfd0', '#2f3d34'];
    const doors = ['#3f5a46', '#6b2e2a', '#4a3a2c', '#2e3a4a', '#5a4632'];
    const roofs = ['#8a8a86', '#7a6e62', '#6e7470', '#8c7c6a', '#5e5e5c'];
    const lots = [];
    for (const sd of [1, -1]) {
      let z = 34;
      let i = 0;
      while (z > -128) {
        const shop = z < -48 && z > -96 && r.chance(0.55);
        const w = shop ? r.range(7.5, 10) : r.range(6.4, 8.6);
        const gap = shop ? r.range(0.0, 0.6) : r.range(2.4, 5.4);
        let cz = z - w / 2;
        // the viewer's house sits exactly at z = 0 on the east side
        if (sd > 0 && cz < 4.6 && cz > -4.6) cz = 0;
        lots.push({ sd, cz, w, shop, i, gap });
        z = cz - w / 2 - gap; i++;
      }
    }
    this.lots = lots;
    for (const L of lots) {
      const home = L.sd > 0 && L.cz === 0;
      const opts = {
        side: L.sd, cz: L.cz, w: home ? 7.2 : L.w, d: r.range(8, 10.5), floors: L.shop ? 2 : (r.chance(0.7) ? 2 : 1.5),
        roof: L.shop ? 'flat' : (r.chance(0.55) ? 'front' : 'side'),
        paint: home ? '#d9d2bf' : paints[Math.floor(r.next() * paints.length)], trim: trims[Math.floor(r.next() * trims.length)],
        door: doors[Math.floor(r.next() * doors.length)], roofC: roofs[Math.floor(r.next() * roofs.length)],
        porch: home ? 'full' : (L.shop ? null : (r.chance(0.7) ? (r.chance(0.5) ? 'full' : 'half') : null)), shop: L.shop, home, seed: r.int(1, 9999),
        fence: !L.shop && !home && r.chance(0.35),
      };
      if (home) { opts.roof = 'front'; opts.floors = 2; opts.d = 10; }
      this._house(opts);
      // side yards: fences toward the street, a washing line in one of them
      if (!L.shop && L.gap > 2.2) this._sideYard(L, r);
    }
  }

  _house(o) {
    const B = this.B, m = this.m, r = new RNG(o.seed);
    const x0 = BS.houseFront, W = o.w, D = o.d, fh = 2.9, floors = o.floors;
    const wallH = (floors === 1.5 ? 1 : floors) * fh + 0.55;     // first floor sits on a 0.55 m foundation
    const ry = o.side > 0 ? -Math.PI / 2 : Math.PI / 2;           // local +Z (front) → toward the street
    const H = new THREE.Matrix4().compose(new THREE.Vector3(o.side * x0, 0, o.cz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1));
    const put = (geo, mat, lm, opts) => B.add(geo, mat, lm ? H.clone().multiply(lm) : H, opts);
    const box = (w, h, d, x, y, z, mat, opts, rx = 0, ryy = 0) => put(new THREE.BoxGeometry(w, h, d), mat, Geo.matrix(x, y, z, rx, ryy, 0), opts);
    const paint = { color: o.paint }, trim = { color: o.trim }, roofC = { color: o.roofC };
    // local frame: front wall at z = 0 (facing +Z), the house extends to z = -D, x from -W/2 to W/2
    // foundation
    box(W + 0.1, 0.55, D + 0.1, 0, 0.275, -D / 2, o.shop ? m.stone : m.stone);
    if (o.shop) {
      // brick shopfront: two storeys, a parapet, display windows, an awning-free painted sign board
      const h = 2 * fh + 0.55;
      put(Geo.boxSides(-W / 2, W / 2, 0.55, h + 0.6, -D, 0, 1.2, 0.6), m.brick);
      box(W + 0.24, 0.22, 0.3, 0, h + 0.7, 0.05, m.stone);
      box(W - 0.4, 0.62, 0.06, 0, fh + 0.2, 0.06, m.trim, { color: o.trim });
      this._signBoard(H, W - 0.8, fh + 0.2, r);
      for (const sx of [-1, 1]) { box(W * 0.36, 1.9, 0.05, sx * W * 0.24, 1.75, 0.03, m.glass); box(W * 0.38, 0.1, 0.12, sx * W * 0.24, 0.75, 0.06, m.trim, trim); }
      box(1.0, 2.2, 0.06, 0, 1.65, 0.03, m.door, { color: o.door });
      for (let k = 0; k < 3; k++) this._window(H, (k - 1) * W * 0.3, fh + 0.55 + 0.75, trim, r, true);
      return;
    }
    // walls (clapboard, tinted), corner boards, frieze board under the eaves
    put(Geo.boxSides(-W / 2, W / 2, 0.55, wallH, -D, 0, 2.4, 1.2), m.clap, null, { color: o.paint });
    for (const sx of [-1, 1]) for (const sz of [0, -D]) box(0.14, wallH - 0.55, 0.14, sx * W / 2, (wallH + 0.55) / 2, sz, m.trim, trim);
    box(W + 0.06, 0.22, 0.06, 0, wallH - 0.11, 0.03, m.trim, trim);
    // roof
    const ov = 0.35;
    if (o.roof === 'front') {
      const rise = W * 0.42;
      // gable triangle on the front, clapboard
      const tri = new THREE.BufferGeometry();
      tri.setAttribute('position', new THREE.Float32BufferAttribute([-W / 2, wallH, 0.0, W / 2, wallH, 0.0, 0, wallH + rise, 0.0], 3));
      tri.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, W / 2.4, 0, W / 4.8, rise / 1.2], 2)); tri.computeVertexNormals();
      put(tri, m.clap, null, { color: o.paint });
      const back = tri.clone(); back.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI)); back.translate(0, 0, -D); put(back, m.clap, null, { color: o.paint });
      const slope = Math.hypot(W / 2 + ov, rise + ov * rise / (W / 2));
      for (const sx of [-1, 1]) {
        const ang = Math.atan2(rise, W / 2);
        const g = new THREE.BoxGeometry(slope, 0.08, D + ov * 2);
        put(g, m.shingle, Geo.matrix(sx * (W / 4 - ov / 4), wallH + rise / 2 - 0.02, -D / 2, 0, 0, -sx * ang), roofC);
        // fascia boards along the rakes
        put(new THREE.BoxGeometry(slope, 0.18, 0.06), m.trim, Geo.matrix(sx * (W / 4 - ov / 4), wallH + rise / 2 - 0.1, ov + 0.02, 0, 0, -sx * ang), trim);
      }
      this._window(H, 0, wallH + rise * 0.35, trim, r, false, 0.55, 0.8);   // attic window in the gable
    } else if (o.roof === 'side') {
      const rise = D * 0.32;
      const slope = Math.hypot(D / 2 + ov, rise);
      const ang = Math.atan2(rise, D / 2);
      for (const sz of [1, -1]) put(new THREE.BoxGeometry(W + ov * 2, 0.08, slope), m.shingle, Geo.matrix(0, wallH + rise / 2, -D / 2 + sz * (D / 4 + ov / 4), sz * ang, 0, 0), roofC);
      for (const sx of [-1, 1]) {
        const tri = new THREE.BufferGeometry();
        tri.setAttribute('position', new THREE.Float32BufferAttribute(sx > 0 ? [W / 2, wallH, 0, W / 2, wallH, -D, W / 2, wallH + rise, -D / 2] : [-W / 2, wallH, -D, -W / 2, wallH, 0, -W / 2, wallH + rise, -D / 2], 3));
        tri.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, D / 2.4, 0, D / 4.8, rise / 1.2], 2)); tri.computeVertexNormals();
        put(tri, m.clap, null, { color: o.paint });
      }
      if (r.chance(0.6)) {   // a dormer
        box(1.6, 1.2, 1.4, 0, wallH + 0.7, -D / 2 + D / 4 + 0.2, m.clap, { color: o.paint });
        box(1.9, 0.1, 1.7, 0, wallH + 1.35, -D / 2 + D / 4 + 0.2, m.shingle, roofC);
        this._window(H, 0, wallH + 0.7, trim, r, false, 0.55, 0.75, -D / 2 + D / 4 + 0.92);
      }
    } else {
      box(W + 0.3, 0.2, D + 0.3, 0, wallH + 0.1, -D / 2, m.shingle, roofC);
    }
    // chimney
    box(0.6, 3.2, 0.6, (r.chance(0.5) ? 1 : -1) * W * 0.28, wallH + 1.2, -D * 0.6, m.chimney);
    // windows: two per floor on the front, the door on one side on the ground floor
    // (local x = world z on the east side, so the viewer's door sits at local x = doorZ)
    const doorX = o.home ? BS.room.doorZ : (r.chance(0.5) ? -W * 0.26 : W * 0.26);
    const nF = floors === 1.5 ? 1 : 2;
    for (let f = 0; f < nF; f++) {
      const y = 0.55 + f * fh + 1.45;
      const xs = f === 0 ? [doorX > 0 ? -W * 0.24 : W * 0.24] : [-W * 0.26, W * 0.26];   // ground floor: one window beside the door
      for (const wx of xs) this._window(H, wx, y, trim, r, false);
    }
    // side windows
    for (const sx of [-1, 1]) for (let f = 0; f < nF; f++) {
      const lm = new THREE.Matrix4().compose(new THREE.Vector3(sx * W / 2, 0, -D * 0.55), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, sx * Math.PI / 2, 0)), new THREE.Vector3(1, 1, 1));
      this._window(H.clone().multiply(lm), 0, 0.55 + f * fh + 1.45, trim, r, false);
    }
    // front door (the viewer's door is the modern set's own door)
    if (!o.home) {
      box(1.04, 2.25, 0.08, doorX, 0.55 + 1.12, 0.03, m.trim, trim);
      box(0.9, 2.1, 0.06, doorX, 0.55 + 1.05, 0.06, m.door, { color: o.door });
      box(0.7, 0.32, 0.03, doorX, 0.55 + 1.55, 0.095, m.door, { color: o.door });
      box(0.7, 0.62, 0.03, doorX, 0.55 + 0.62, 0.095, m.door, { color: o.door });
      box(0.84, 0.3, 0.04, doorX, 0.55 + 2.34, 0.04, m.glass);   // transom
    } else {
      // the doorway the modern door sits in
      box(0.12, 2.2, 0.12, doorX - 0.5, 0.55 + 1.1, 0.03, m.trim, trim); box(0.12, 2.2, 0.12, doorX + 0.5, 0.55 + 1.1, 0.03, m.trim, trim);
      box(1.12, 0.14, 0.12, doorX, 0.55 + 2.17, 0.03, m.trim, trim);
    }
    if (o.porch) this._porch(H, o, W, doorX, wallH, trim, roofC, r);
    else {
      // stoop steps up to the door
      for (let k = 0; k < 3; k++) box(1.3, 0.18, 0.3, doorX, 0.09 + k * 0.18, 0.35 + (2 - k) * 0.3, m.stone);
    }
    if (o.fence) this._fence(o.side, o.cz, W + 1.6);
  }

  _window(H, x, y, trim, r, shop, w = 0.9, h = 1.5, z = 0) {
    const B = this.B, m = this.m;
    const put = (geo, mat, lm, opts) => B.add(geo, mat, H.clone().multiply(lm), opts);
    const box = (bw, bh, bd, bx, by, bz, mat, opts) => put(new THREE.BoxGeometry(bw, bh, bd), mat, Geo.matrix(bx, by, bz), opts);
    box(w, h, 0.03, x, y, z + 0.02, m.glass);
    // curtains inside (a hint of life), sashes, casing, sill, head
    if (r.chance(0.7)) box(w * 0.4, h * 0.85, 0.01, x - w * 0.27, y, z + 0.005, m.curtain);
    box(w + 0.2, 0.09, 0.07, x, y + h / 2 + 0.05, z + 0.04, m.trim, trim);
    box(w + 0.26, 0.07, 0.12, x, y - h / 2 - 0.03, z + 0.06, m.trim, trim);
    for (const sx of [-1, 1]) box(0.09, h + 0.1, 0.07, x + sx * (w / 2 + 0.045), y, z + 0.04, m.trim, trim);
    box(w, 0.05, 0.05, x, y, z + 0.045, m.trim, trim);          // meeting rail of the sashes
    box(0.035, h, 0.04, x, y, z + 0.045, m.trim, trim);         // muntin: 2 over 2
    if (!shop && r.chance(0.55)) {                              // shutters
      const sc = r.pick(['#2f3d34', '#3a2e28', '#2c3440', '#5a3a30']);
      for (const sx of [-1, 1]) box(w * 0.48, h + 0.05, 0.04, x + sx * (w * 0.74 + 0.07), y, z + 0.03, m.door, { color: sc });
    }
  }

  _signBoard(H, w, y, r) {
    const names = ['DRY GOODS', 'BAKERY', 'GROCER', 'HARDWARE', 'PHARMACY', 'BOOTS & SHOES', 'NOTIONS'];
    const label = names[Math.floor(r.next() * names.length)];
    const cv = Tex.canvas(512, 96), c = cv.getContext('2d');
    c.fillStyle = r.pick(['#2f3d34', '#3a2a24', '#2a3240', '#5a2a24']); c.fillRect(0, 0, 512, 96);
    c.strokeStyle = '#c9b27a'; c.lineWidth = 4; c.strokeRect(8, 8, 496, 80);
    c.fillStyle = '#e8d9a8'; c.font = '600 54px Lora, Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(label, 256, 52);
    const mat = new THREE.MeshStandardMaterial({ map: Tex.tex(cv, { repeat: false }), roughness: 0.7, name: 'signBoard' });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.56), mat);
    mesh.applyMatrix4(H.clone().multiply(Geo.matrix(0, y, 0.1)));
    mesh.receiveShadow = true;
    this.root.add(mesh);
  }

  _porch(H, o, W, doorX, wallH, trim, roofC, r) {
    const B = this.B, m = this.m;
    const put = (geo, mat, lm, opts) => B.add(geo, mat, H.clone().multiply(lm), opts);
    const box = (w, h, d, x, y, z, mat, opts) => put(new THREE.BoxGeometry(w, h, d), mat, Geo.matrix(x, y, z), opts);
    const depth = BS.houseFront - BS.porchFront, pw = o.porch === 'full' ? W : W * 0.55, px = o.porch === 'full' ? 0 : doorX;
    const y = BS.porchY;
    box(pw, 0.12, depth, px, y - 0.06, depth / 2, m.porch);                    // deck
    box(pw, y - 0.12, 0.08, px, (y - 0.12) / 2, depth - 0.04, m.trim, trim);   // skirt board
    // steps down to the walk, in front of the door
    const sx = o.home ? doorX : px;
    for (let k = 0; k < 3; k++) box(1.5, 0.144, 0.29, sx, 0.12 + 0.072 + k * 0.144 - 0.0, depth + 0.29 * (2.5 - k), m.porch);
    // turned posts, railing with balusters (gap at the steps)
    const roofY = 0.55 + 2.75;
    const posts = [];
    for (let k = 0; k <= Math.max(2, Math.round(pw / 2.2)); k++) posts.push(px - pw / 2 + 0.1 + (k / Math.max(2, Math.round(pw / 2.2))) * (pw - 0.2));
    const lathe = new THREE.LatheGeometry([[0.07, 0], [0.07, 0.15], [0.05, 0.25], [0.045, 1.0], [0.06, 1.15], [0.04, 1.3], [0.045, 2.2], [0.075, 2.35], [0.075, 2.48]].map(([a, b]) => new THREE.Vector2(a, b)), 8);
    for (const ppx of posts) put(lathe, m.trim, Geo.matrix(ppx, y, depth - 0.15), trim);
    for (let k = 0; k < posts.length - 1; k++) {
      const a = posts[k], b = posts[k + 1], mid = (a + b) / 2, len = b - a;
      if (Math.abs(mid - sx) < 0.9) continue;                                 // the opening for the steps
      box(len, 0.06, 0.09, mid, y + 0.85, depth - 0.15, m.trim, trim);
      box(len, 0.05, 0.07, mid, y + 0.12, depth - 0.15, m.trim, trim);
      for (let q = 1; q < Math.floor(len / 0.14); q++) box(0.035, 0.72, 0.035, a + q * 0.14, y + 0.48, depth - 0.15, m.trim, trim);
    }
    // porch roof (shed) and its frieze
    put(new THREE.BoxGeometry(pw + 0.3, 0.07, depth + 0.5), m.shingle, Geo.matrix(px, roofY + 0.25, depth / 2 + 0.1, -0.2, 0, 0), roofC);
    box(pw + 0.1, 0.2, 0.08, px, roofY, depth - 0.12, m.trim, trim);
    box(pw, 0.03, depth, px, roofY - 0.06, depth / 2, m.trim, trim);           // beadboard ceiling
    // a bench or a chair on some porches
    if (!o.home && r.chance(0.5)) { const bx = px + (r.chance(0.5) ? 1 : -1) * pw * 0.3; box(1.3, 0.05, 0.4, bx, y + 0.45, 0.4, m.wood); box(1.3, 0.4, 0.05, bx, y + 0.7, 0.2, m.wood); for (const s of [-0.6, 0.6]) box(0.05, 0.45, 0.4, bx + s, y + 0.22, 0.4, m.wood); }
  }

  _fence(sd, cz, len) {
    const B = this.B, m = this.m, x = sd * (BS.street.walk + 0.12);
    for (let z = cz - len / 2; z <= cz + len / 2; z += 0.16) B.box(0.025, 0.9, 0.085, x, 0.06 + 0.45, z, m.picket);
    for (const y of [0.32, 0.75]) B.box(0.04, 0.07, len, x + sd * 0.05, 0.06 + y, cz, m.picket);
  }

  _sideYard(L, r) {
    const B = this.B, m = this.m, zc = L.cz - L.w / 2 - L.gap / 2, sd = L.sd;
    this._fence(sd, zc, L.gap - 0.2);
    // a gate post pair
    for (const s of [-1, 1]) B.box(0.1, 1.1, 0.1, sd * (BS.street.walk + 0.12), 0.6, zc + s * (L.gap / 2 - 0.1), m.picket);
    this.yards = this.yards || [];
    this.yards.push({ sd, z: zc, gap: L.gap });
  }

  /* ---------------- trees ---------------- */
  // irregular canopy masses (3–5 overlapping lumps), a forked trunk, vertex-colour shading
  _tree(x, z, s, kind, r) {
    const B = this.B, m = this.m;
    const trunkH = (kind === 'poplar' ? 2.2 : 2.6) * s;
    B.add(new THREE.CylinderGeometry(0.13 * s, 0.22 * s, trunkH, 7), m.bark, Geo.matrix(x, trunkH / 2, z, r.range(-0.05, 0.05), 0, r.range(-0.05, 0.05)));
    for (let k = 0; k < 2; k++) {
      const a = r.range(0, 6.28), L = 1.6 * s;
      B.add(new THREE.CylinderGeometry(0.05 * s, 0.1 * s, L, 5), m.bark, Geo.matrix(x + Math.cos(a) * 0.35 * s, trunkH + 0.5 * s, z + Math.sin(a) * 0.35 * s, Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5));
    }
    let lumps = kind === 'poplar' ? [[0, 1.6, 0, 1.15, 2.2], [0, 3.5, 0, 0.95, 1.8], [0, 5.0, 0, 0.6, 1.2]]
      : kind === 'maple' ? [[0, 2.0, 0, 1.7, 1.4], [-1.1, 1.5, 0.6, 1.2, 1.1], [1.0, 1.7, -0.5, 1.3, 1.1], [0.2, 3.1, 0.2, 1.3, 1.1], [0.6, 1.2, 1.0, 1.0, 0.9]]
        : [[0, 2.2, 0, 2.0, 1.25], [-1.6, 1.6, 0.5, 1.4, 1.0], [1.5, 1.8, -0.4, 1.5, 1.0], [0.3, 3.2, -0.3, 1.4, 1.0]];   // elm: broad vase
    // break each mass into smaller clumps round its surface: an irregular, layered crown instead of one blob
    if (kind !== 'poplar') {
      const extra = [];
      for (const [lx, ly, lz, rad] of lumps) for (let q = 0; q < 3; q++) {
        const a = r.range(0, 6.28), e = r.range(-0.3, 0.7);
        extra.push([lx + Math.cos(a) * rad * 0.75, ly + e * rad * 0.6, lz + Math.sin(a) * rad * 0.75, rad * r.range(0.45, 0.6), r.range(0.8, 1.1)]);
      }
      lumps = lumps.concat(extra);
    }
    const base = new THREE.Color(kind === 'poplar' ? '#4e6a30' : kind === 'maple' ? '#5c7a34' : '#557232');
    for (const [lx, ly, lz, rad, sy] of lumps) {
      const g = new THREE.IcosahedronGeometry(rad * s, 1);
      const pos = g.attributes.position, cols = [];
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i), vy = pos.getY(i), vz = pos.getZ(i);
        const j = 1 + 0.16 * (hash2(Math.round(vx * 13 + x * 7), Math.round(vz * 11 + vy * 5 + z * 3)) - 0.5);
        pos.setXYZ(i, vx * j, vy * j * sy, vz * j);
        const shade = 0.72 + 0.4 * (vy / (rad * s) * 0.5 + 0.5);                 // darker underneath, lit crown
        const c = base.clone().multiplyScalar(shade * (0.92 + 0.16 * r.next()));
        cols.push(c.r, c.g, c.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      g.computeVertexNormals();
      B.add(g, m.leaf, Geo.matrix(x + lx * s, trunkH + ly * s * 0.8, z + lz * s));
    }
  }

  _trees() {
    const r = new RNG(808);
    const spots = [];
    // in side yards and in front-yard gaps, a few street trees by the walk
    for (const y of this.yards || []) spots.push([y.sd * r.range(9.5, 13), y.z + r.range(-0.6, 0.6), r.range(0.95, 1.25)]);
    for (let z = 30; z > -125; z -= r.range(9, 15)) for (const sd of [-1, 1]) if (r.chance(0.45)) spots.push([sd * r.range(17, 26), z, r.range(1.1, 1.5)]);
    for (const [x, z] of [[-5.85, 15], [5.85, -22], [-5.85, -44], [5.85, -61], [-5.85, -84]]) spots.push([x, z, 1.15]);
    for (const [x, z, s] of spots) {
      if (x > 0 && Math.abs(z) < 5 && x < 14) continue;                          // keep the viewer's porch clear
      this._tree(x, z, s, r.pick(['elm', 'elm', 'maple', 'poplar']), r);
    }
    // a few bushes against the porches
    for (const L of this.lots) if (!L.shop && r.chance(0.6)) {
      const g = new THREE.IcosahedronGeometry(0.55, 0); g.scale(1.3, 0.75, 1);
      const cols = []; const c = new THREE.Color('#4f6a2e');
      for (let i = 0; i < g.attributes.position.count; i++) { const k = 0.8 + 0.3 * r.next(); cols.push(c.r * k, c.g * k, c.b * k); }
      g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      this.B.add(g, this.m.leaf, Geo.matrix(L.sd * 9.95, 0.4, L.cz + (r.chance(0.5) ? 1 : -1) * (L.w / 2 - 0.6)));
    }
  }

  /* ---------------- street furniture ---------------- */
  _props() {
    const B = this.B, m = this.m, r = new RNG(999);
    // gas street lamps
    for (const [x, z] of [[-5.75, 8], [5.75, -14], [-5.75, -36], [5.75, -58], [-5.75, -82], [5.75, -104]]) {
      B.add(new THREE.CylinderGeometry(0.05, 0.08, 3.0, 8), m.iron, Geo.matrix(x, 1.5, z));
      B.add(new THREE.CylinderGeometry(0.11, 0.13, 0.35, 8), m.iron, Geo.matrix(x, 0.17, z));
      B.add(new THREE.BoxGeometry(0.5, 0.05, 0.05), m.iron, Geo.matrix(x, 2.75, z));          // ladder bar for the lamplighter
      B.add(new THREE.CylinderGeometry(0.16, 0.11, 0.48, 4, 1), m.lampGlass, Geo.matrix(x, 3.25, z, 0, Math.PI / 4, 0));
      B.add(new THREE.ConeGeometry(0.24, 0.22, 4), m.iron, Geo.matrix(x, 3.6, z, 0, Math.PI / 4, 0));
      B.add(new THREE.SphereGeometry(0.04, 6, 4), m.iron, Geo.matrix(x, 3.74, z));
    }
    // a hand pump on the west walk, a horse trough by it
    B.add(new THREE.CylinderGeometry(0.09, 0.11, 1.1, 8), m.iron, Geo.matrix(-6.8, 0.67, -31.5));
    B.add(new THREE.BoxGeometry(0.05, 0.05, 0.55), m.iron, Geo.matrix(-6.8, 1.15, -31.25, 0.35, 0, 0));
    B.add(new THREE.BoxGeometry(0.4, 0.08, 0.1), m.iron, Geo.matrix(-6.6, 1.0, -31.5));
    B.box(0.7, 0.5, 2.0, -6.3, 0.37, -29.6, m.wood);
    // barrels and crates by the shops; a handcart at the street edge; a bicycle against a fence
    const barrel = new THREE.LatheGeometry([[0.0, 0], [0.24, 0], [0.29, 0.25], [0.3, 0.42], [0.29, 0.6], [0.24, 0.85], [0.0, 0.85]].map(([a, b]) => new THREE.Vector2(a, b)), 12);
    for (const [x, z] of [[-6.9, -52], [-6.5, -53.0], [6.9, -71], [6.6, -72.2]]) B.add(barrel, m.wood, Geo.matrix(x, 0.12, z, 0, r.range(0, 6), 0));
    for (const [x, z, s] of [[-7.0, -54.2, 0.6], [6.95, -69.6, 0.5], [7.0, -70.3, 0.42]]) B.box(s, s, s, x, 0.12 + s / 2, z, m.weathered, r.range(-0.3, 0.3));
    // handcart
    { const cx = -4.4, cz = -40;
      B.box(1.0, 0.08, 1.6, cx, 0.62, cz, m.wood); for (const s of [-1, 1]) B.box(0.06, 0.28, 1.6, cx + s * 0.5, 0.78, cz, m.wood);
      for (const s of [-1, 1]) B.add(new THREE.TorusGeometry(0.42, 0.04, 5, 14), m.wood, Geo.matrix(cx + s * 0.58, 0.44, cz + 0.3, 0, Math.PI / 2, 0));
      for (const s of [-1, 1]) B.box(0.05, 0.05, 1.5, cx + s * 0.35, 0.5, cz - 1.3, m.wood, 0);
      B.box(0.06, 0.5, 0.06, cx, 0.3, cz - 0.6, m.wood); }
    // safety bicycle (c. 1900) against a picket fence
    { const bx = -7.25, bz = 10.5, M = (x, y, z, rx = 0, ry = 0, rz = 0) => Geo.matrix(bx + x, y, bz + z, rx, ry, rz);
      for (const dz of [-0.55, 0.55]) B.add(new THREE.TorusGeometry(0.34, 0.022, 5, 18), m.iron, M(0, 0.46, dz, 0, Math.PI / 2, 0.0));
      B.add(new THREE.CylinderGeometry(0.016, 0.016, 1.0, 5), m.iron, M(0, 0.82, 0.0, Math.PI / 2, 0, 0));
      B.add(new THREE.CylinderGeometry(0.016, 0.016, 0.62, 5), m.iron, M(0, 0.66, -0.2, 0.9, 0, 0));
      B.add(new THREE.CylinderGeometry(0.016, 0.016, 0.62, 5), m.iron, M(0, 0.66, 0.3, -0.7, 0, 0));
      B.box(0.12, 0.05, 0.26, 0, 0.98, -0.25, m.wood); B.box(0.5, 0.025, 0.025, 0, 1.0, 0.5, m.iron); }
    // washing line in a side yard on the west (the mother is hanging sheets)
    { const x = -13.2, z0 = -11.6, z1 = -16.4;
      for (const z of [z0, z1]) B.add(new THREE.CylinderGeometry(0.04, 0.05, 2.1, 6), m.wood, Geo.matrix(x + 0.6, 1.05, z));
      B.add(new THREE.CylinderGeometry(0.006, 0.006, Math.abs(z1 - z0), 3), m.iron, Geo.matrix(x + 0.6, 1.95, (z0 + z1) / 2, Math.PI / 2, 0, 0));
      const cols = ['#ece6d8', '#e2dccb', '#b9c4cc', '#ece6d8', '#c9a89a'];
      const clothes = [];
      cols.forEach((c, i) => {
        const w = i === 0 ? 1.1 : 0.55, h = i === 0 ? 1.2 : 0.65;
        const g = new THREE.PlaneGeometry(w, h, 3, 3); g.translate(0, -h / 2, 0);
        const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, side: THREE.DoubleSide, name: 'laundry' }));
        mesh.position.set(x + 0.6, 1.95, z0 - 0.6 - i * 0.85); mesh.rotation.y = Math.PI / 2; mesh.castShadow = true; mesh.receiveShadow = true;
        this.root.add(mesh); clothes.push(mesh);
      });
      this.dynamic.laundry = clothes;
      // a basket at her feet
      B.add(new THREE.CylinderGeometry(0.28, 0.22, 0.26, 10, 1, true), m.wood, Geo.matrix(x + 0.4, 0.19, -13.2));
    }
    // a bench on the old man's porch already comes from _porch; make sure one exists
    for (const [z, len] of [[5.38, 1.7], [-20.6, 1.4]]) {
      B.box(0.42, 0.05, len, -7.08, 0.12 + 0.42, z, m.wood); B.box(0.05, 0.42, len, -7.3, 0.12 + 0.68, z, m.wood);
      for (const s2 of [-1, 1]) B.box(0.38, 0.42, 0.05, -7.1, 0.12 + 0.21, z + s2 * (len / 2 - 0.1), m.wood);
    }
  }

  /* ---------------- far town: the street runs on into haze, a church steeple, hills ---------------- */
  _distant() {
    const B = this.B, m = this.m;
    // church at the north end
    const cz = -158;
    B.box(9, 7, 16, 0, 3.5, cz, m.clap, 0, { color: '#ece8de' });
    B.add(new THREE.BoxGeometry(9.6, 0.1, 10), m.shingle, Geo.matrix(-2.4, 8.2, cz, 0, 0, 0.65), { color: '#6e6c68' });
    B.add(new THREE.BoxGeometry(9.6, 0.1, 10), m.shingle, Geo.matrix(2.4, 8.2, cz, 0, 0, -0.65), { color: '#6e6c68' });
    B.box(3.2, 13, 3.2, 0, 6.5, cz + 8.5, m.clap, 0, { color: '#ece8de' });
    B.box(2.6, 3.0, 2.6, 0, 14.5, cz + 8.5, m.clap, 0, { color: '#ece8de' });
    B.add(new THREE.ConeGeometry(2.0, 9, 4), m.shingle, Geo.matrix(0, 20.5, cz + 8.5, 0, Math.PI / 4, 0), { color: '#5e5e5c' });
    // rows of simple houses beyond the built street, and tree masses behind the houses
    const r = new RNG(4040);
    for (let z = -130; z > -150; z -= 9) for (const sd of [-1, 1]) {
      const h = r.range(5, 8);
      B.box(7, h, 8, sd * 13, h / 2, z, m.clap, 0, { color: r.pick(['#e2dccb', '#cdd2c4', '#c9b79a', '#b7c0c4']) });
      B.add(new THREE.ConeGeometry(5.4, 2.6, 4), m.shingle, Geo.matrix(sd * 13, h + 1.3, z, 0, Math.PI / 4, 0), { color: '#7a746c' });
    }
    // low hills as soft tree-covered mounds on the horizon
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI * 0.95 + i * 0.24, d = 300 + r.range(-30, 60);
      const g = new THREE.SphereGeometry(r.range(60, 110), 10, 6, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1.6, r.range(0.22, 0.34), 1);
      const cols = []; const c = new THREE.Color('#6a7a52');
      for (let k = 0; k < g.attributes.position.count; k++) cols.push(c.r, c.g, c.b);
      g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      B.add(g, m.leaf, Geo.matrix(Math.sin(a) * d, -2, -Math.abs(Math.cos(a)) * d - 40), { noShadow: true });
    }
  }

  update(t, camera, visible = true) {
    this.root.visible = visible;
    this.sky.material.uniforms.uTime.value = t;
    const L = this.dynamic.laundry;
    if (L) L.forEach((c, i) => { c.rotation.x = Math.sin(t * 1.3 + i * 0.9) * 0.08 + noise1(t * 0.6, i + 40) * 0.06; });
  }
}
