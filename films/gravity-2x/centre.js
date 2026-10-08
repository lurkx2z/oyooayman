/* =====================================================================
   THE LEISURE CENTRE — one building that holds every beat (metres; −Z is "ahead", sun from the left, −X):
     the gym (upper level, floor 0): windows on the left, glass onto the sports hall on the right, a glass
       balustrade ahead over the pool hall and the head of the open stair;
     the sports hall (same level): a practice basket on its far end wall, seen through the gym's glass;
     the pool hall (deck GV_LOW): a glazed left wall, the pool (lanes, then a slope down to a 5 m deep end), the
       10 m diving tower standing on the far deck, the lifeguard's chair, loungers.
   Subclasses the shared Environment (its materials, trees and environment map are reused; the sunny sky shader is
   the one this film used for its street, owned here). The moving pieces (scale, treadmills, bar, basket, water)
   live in props.js.
   ===================================================================== */

const GV_C = {
  gym: { x0: -7, x1: 6, z0: -6, z1: 5, h: 3.4 },
  court: { x0: 6, x1: 24, z0: -6, z1: 10, h: 7.5, hoop: { x: 13, z: -4.8 }, board: -5.32, line: -0.7 },
  hall: { x0: -14, x1: 14, z0: -38, z1: -6, roof: 13.0 },
  stair: { x0: 2.9, x1: 4.7, z0: -6.0, n: 16, rise: 0.2, run: 0.28 },
  pool: { x0: -12, x1: 2, z0: -30, z1: -8, shallow: 1.6, deep: 5.0, s0: -19, s1: -21.5 },
  tower: { x0: -7.4, x1: -1.6, z0: -34.6, z1: -30.6, px0: -6.1, px1: -2.9, edge: -28.6, top: 10 },
  ladder: { x: 2.0, z: -22.6 },
  chair: { x: 2.75, z: -16.6 },
  kiosk: { x: 0.6, z: 0.66 },
  treadX: [-6.55, -4.45], treadZ: [-0.55, -2.15, -3.75],
  bench: { x: 2.4, barZ: -2.4, feet: 1 },     // the lifter's feet point +Z (toward the scale)
  pullup: { x: 4.75, z: 0.6, y: 2.25, grip: 0.2 },   // a free-standing pull-up bar by the glass (the bar runs along Z: you hang facing the court)
  outside: -3.2,
};
// (the shared Environment's trees sit on LAYOUT.curbH: here, the lawn outside)
const LAYOUT = { curbH: GV_C.outside };

// the pool's floor depth below the water at z
function gvPoolDepth(z) { const P = GV_C.pool; return MathX.lerp(P.shallow, P.deep, MathX.smooth(z, P.s0, P.s1)); }
// the floor under your feet at (x, z): the gym (with the scale's platform), the open stair, the pool deck
function gvFloorY(x, z) {
  const S = GV_C.stair, K = GV_C.kiosk;
  if (z > S.z0) return (Math.abs(x - K.x) < 0.3 && z > K.z + 0.52 && z < K.z + 1.2) ? 0.06 : 0;
  if (x > S.x0 - 0.05 && x < S.x1 + 0.05 && z > S.z0 - S.n * S.run) {
    // over tread k+1 (top (k+1)·rise down) while u is in [k, k+1): the step down happens over its first half
    const u = (S.z0 - z) / S.run, k = Math.floor(u), f = u - k;
    return -S.rise * Math.min(S.n, k + MathX.smooth(f, 0.05, 0.55));
  }
  return GV_LOW;
}

// canvas textures (deterministic)
function gvTileTex(base, grout, n = 8, S = 256, seed = 1, jitter = 6) {
  const c = Tex.canvas(S, S), x = c.getContext('2d'), s = S / n;
  x.fillStyle = grout; x.fillRect(0, 0, S, S);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const h = hash1(i * 31 + j * 7 + seed), b = base.map((v) => Math.round(v + (h - 0.5) * jitter));
    x.fillStyle = `rgb(${b.join(',')})`; x.fillRect(i * s + 1.2, j * s + 1.2, s - 2.4, s - 2.4);
  }
  return Tex.tex(c);
}
function gvRubberTex() {
  const S = 256, c = Tex.canvas(S, S), x = c.getContext('2d');
  x.fillStyle = '#2b2d30'; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 2600; i++) { const h = hash1(i * 1.7 + 3), g = hash1(i * 4.3 + 1); x.fillStyle = `rgba(${g > 0.85 ? '120,124,130' : '20,20,22'},${0.25 + 0.3 * h})`; x.fillRect(hash1(i * 2.9) * S, hash1(i * 5.1) * S, 2, 2); }
  x.strokeStyle = 'rgba(10,10,12,0.8)'; x.lineWidth = 2; x.strokeRect(1, 1, S - 2, S - 2);
  return Tex.tex(c);
}
function gvWoodTex() {
  const W = 512, H = 512, c = Tex.canvas(W, H), x = c.getContext('2d'), n = 8, pw = W / n;
  for (let i = 0; i < n; i++) {
    let y = 0;
    while (y < H) {
      const L = 90 + 220 * hash1(i * 13 + y * 0.1), h = hash1(i * 7 + y * 0.37);
      const r = 196 + (h - 0.5) * 26, g = 146 + (h - 0.5) * 22, b = 92 + (h - 0.5) * 16;
      x.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`; x.fillRect(i * pw, y, pw - 1, L - 1);
      for (let k = 0; k < 5; k++) { x.fillStyle = `rgba(120,80,40,${0.06 + 0.05 * hash1(i + k + y)})`; x.fillRect(i * pw + hash1(k * 3 + i + y) * pw, y, 1.5, L - 1); }
      y += L;
    }
  }
  return Tex.tex(c);
}

class GvCentre extends Environment {
  build() {
    super._materials();
    this._gvMaterials();
    this._sky();
    this._lights();
    this._outside();
    this._gym();
    this._gymKit();
    this._court();
    this._hall();
    this._stair();
    this._basin();
    this._tower();
    this._deckKit();
    this.batch.build(this.root, 'env');
    this._environmentMap();
  }

  _gvMaterials() {
    const m = this.m;
    const rub = gvRubberTex(); rub.repeat.set(1, 1);
    const wood = gvWoodTex();
    Object.assign(m, {
      wallW: Mat.std('#d9d7d1', { roughness: 0.9 }),
      wallG: Mat.std('#a9aeb0', { roughness: 0.9 }),
      teal: Mat.std('#2b6467', { roughness: 0.85 }),
      ceil: Mat.std('#e4e3df', { roughness: 0.95 }),
      lamp: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#fff6e8', emissiveIntensity: 1.6, roughness: 0.5, name: 'lampPanel' }),
      gymFloor: new THREE.MeshStandardMaterial({ map: rub, roughness: 0.95, name: 'gymFloor' }),
      wood: new THREE.MeshStandardMaterial({ map: wood, roughness: 0.55, name: 'courtWood' }),
      key: Mat.std('#3f5f86', { roughness: 0.6 }),
      paint: new THREE.MeshStandardMaterial({ color: '#f2f0ea', roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, name: 'courtPaint' }),
      deck: new THREE.MeshStandardMaterial({ map: gvTileTex([196, 192, 182], '#9a958b', 4, 256, 5, 10), roughness: 0.6, name: 'deckTile' }),
      hallWall: new THREE.MeshStandardMaterial({ map: gvTileTex([214, 222, 224], '#aab4b8', 6, 256, 9, 8), roughness: 0.7, name: 'hallTile' }),
      poolTile: new THREE.MeshStandardMaterial({ map: gvTileTex([190, 226, 236], '#8fb6c4', 8, 256, 21, 8), roughness: 0.45, name: 'poolTile' }),
      laneBlue: Mat.std('#1b3d7a', { roughness: 0.5 }),
      coping: Mat.std('#f1efe9', { roughness: 0.5 }),
      grate: Mat.std('#4b5257', { roughness: 0.6, metalness: 0.3 }),
      frame: Mat.std('#3b4046', { roughness: 0.45, metalness: 0.55 }),
      truss: Mat.std('#48515a', { roughness: 0.55, metalness: 0.45 }),
      chrome: Mat.std('#c4c9ce', { roughness: 0.25, metalness: 0.9 }),
      rubber: Mat.std('#1c1d20', { roughness: 0.8 }),
      pad: Mat.std('#22344d', { roughness: 0.65 }),
      grass: Mat.std('#617a46', { roughness: 1 }),
      towerC: new THREE.MeshStandardMaterial({ map: Tex.concrete(41, [176, 172, 164]), roughness: 0.85, name: 'towerConcrete' }),
      towerBlue: Mat.std('#1f5ea8', { roughness: 0.5 }),
      plate: Mat.std('#26282b', { roughness: 0.55, metalness: 0.2 }),
      orangeB: Mat.std('#c8621f', { roughness: 0.6 }),
    });
    m.poolTile.map.repeat.set(1, 1);
    gvCaustics(m.poolTile);                       // light from the water's surface dancing on the pool's tiles (props.js)
    m.poolTile.userData.grime = 0; m.poolTile.userData.surface = true;
    m.laneBlue.userData.grime = 0;
    gvCaustics(m.laneBlue);
  }

  /* ---------------- sky: a clear, warm afternoon (this film's street sky, owned here) ---------------- */
  _sky() {
    this.sunDir = new THREE.Vector3(-0.66, 0.6, 0.28).normalize();
    const zenith = new THREE.Color('#4a8bd0'), horizon = new THREE.Color('#c6d8e8');
    this.fogColor = new THREE.Color('#c9d2d6');
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
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(2000, 48, 24), mat);
    sky.name = 'sky'; sky.frustumCulled = false; sky.renderOrder = -10;
    this.scene.add(sky); this.sky = sky;
    this.scene.fog = new THREE.FogExp2(this.fogColor.clone(), 0.0035);
    this.scene.background = horizon.clone();
  }

  _lights() {
    const sun = new THREE.DirectionalLight('#ffe8c8', 4.6), tgt = new THREE.Vector3(0, 0, -10);
    sun.position.copy(this.sunDir).multiplyScalar(80).add(tgt); sun.target.position.copy(tgt);
    sun.castShadow = CONFIG.render.shadows;
    sun.shadow.mapSize.set(CONFIG.render.shadowMapSize, CONFIG.render.shadowMapSize);
    const sc = sun.shadow.camera; sc.left = -30; sc.right = 30; sc.top = 30; sc.bottom = -30; sc.near = 5; sc.far = 200;
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 3;
    this.scene.add(sun, sun.target); this.sun = sun;
    // the light bouncing around inside (walls, water, ceilings): a warm-white sky, a mid ground
    this.hemi = new THREE.HemisphereLight('#e6edf2', '#8c8478', 1.25); this.scene.add(this.hemi);
    // the sports hall and the gym are lit by their ceiling panels too (no shadows)
    this.fills = [[15, 6.6, 0, 3.2, 26], [15, 6.6, -4, 2.4, 20], [-1, 3.1, -1.5, 0.9, 9], [0, 11, -18, 2.2, 34]].map(([x, y, z, I, d]) => {
      const l = new THREE.PointLight('#fff4e4', I, d, 1.2); l.position.set(x, y, z); this.scene.add(l); return l;
    });
  }

  // what you see through the windows: a lawn, trees, low buildings across a park, the sky
  _outside() {
    const B = this.batch, m = this.m, y = GV_C.outside, rng = this.rng.fork(7);
    // the lawn: round the building, never through it (the pool hall's deck sits at the same level)
    const H = GV_C.hall, zf = GV_C.court.z1 + 0.2, zb = H.z0 - 0.2, xw = H.x0 - 0.2;
    B.add(Geo.flat(-260, xw, -300, 120, y, 6), m.grass, null, { noShadow: true });
    B.add(Geo.flat(xw, 60, -300, zb, y, 4), m.grass, null, { noShadow: true });
    B.add(Geo.flat(xw, 60, zf, 120, y, 4), m.grass, null, { noShadow: true });
    B.add(Geo.flat(-30, -14, -60, 30, y + 0.01, 2), m.concrete, null, { noShadow: true });      // the path along the building
    for (const [x, z, s] of [[-22, 8, 1.1], [-24, -6, 1.25], [-21, -20, 1.0], [-26, -34, 1.3], [-23, -47, 1.15], [-38, 2, 1.4], [-40, -26, 1.5], [-36, -52, 1.2], [-55, -12, 1.6], [-52, 16, 1.4]])
      this._tree(x, z, rng, s);
    // a row of low buildings beyond the park
    const st = ['cream', 'redbrick', 'stone', 'tanbrick', 'whitebrick', 'sage'];
    for (let i = 0; i < 9; i++) {
      const z0 = 60 - i * 26, w = 18 + 6 * hash1(i * 3.3), h = 9 + 9 * hash1(i * 7.7), F = this.facades[st[i % st.length]];
      B.add(Geo.boxSides(-130, -112, y, y + h, z0 - w, z0, F.tileW, F.tileH), F.mat, null);
      B.add(Geo.flat(-130, -112, z0 - w, z0, y + h, 4), m.roof, null, { noShadow: true });
    }
  }

  /* ---------------- the gym ---------------- */
  _gym() {
    const B = this.batch, m = this.m, G = GV_C.gym, W = G.x1 - G.x0, D = G.z1 - G.z0, cx = (G.x0 + G.x1) / 2, cz = (G.z0 + G.z1) / 2, H = G.h;
    // floor slab (rubber tiles) and ceiling slab
    B.box(W, 0.4, D, cx, -0.2, cz, m.concrete);
    B.add(Geo.flat(G.x0, G.x1, G.z0, G.z1, 0.002, 1), m.gymFloor, null, { noShadow: true });
    B.box(W + 0.6, 0.35, D + 0.3, cx, H + 0.175, cz + 0.15, m.ceil);
    for (let z = G.z1 - 1.4; z > G.z0 + 0.6; z -= 2.6) for (const x of [-4.2, -0.8, 2.6]) B.box(1.6, 0.03, 0.22, x, H - 0.015, z, m.lamp, 0, { noShadow: true });
    // the back wall (a mirror strip and the gym's name)
    B.box(W + 0.6, H, 0.3, cx, H / 2, G.z1 + 0.15, m.wallW);
    B.box(7.0, 2.0, 0.02, -1.0, 1.25, G.z1 - 0.01, new THREE.MeshStandardMaterial({ color: '#9fb0bb', roughness: 0.08, metalness: 0.9, name: 'mirror' }), 0, { noShadow: true });
    // the left wall: floor-to-ceiling windows (the sun comes in here)
    const xw = G.x0;
    B.box(0.3, 0.3, D, xw - 0.15, 0.15, cz, m.wallW);                                  // sill upstand
    for (let z = G.z0; z <= G.z1 + 1e-6; z += D / 5) B.box(0.12, H, 0.1, xw, H / 2, z, m.frame);
    B.box(0.12, 0.1, D, xw, 0.32, cz, m.frame); B.box(0.12, 0.12, D, xw, H - 0.06, cz, m.frame);
    B.add(Geo.quad([xw, 0.3, G.z0], [xw, 0.3, G.z1], [xw, H, G.z1], [xw, H, G.z0]), m.glass, null, { noShadow: true });
    // the outside face of the building below the gym (seen from nowhere inside, but it blocks the low sun)
    B.box(0.3, -GV_C.outside, D, xw - 0.15, GV_C.outside / 2, cz, m.wallG);
    // the right wall: interior glass onto the sports hall, a solid strip at the top
    const xr = G.x1;
    for (const z of [G.z0, -3.0, 1.7, G.z1]) B.box(0.1, H, 0.1, xr, H / 2, z, m.frame);        // (posts kept clear of the free throw's line of sight and the pull-up bar's view)
    B.box(0.1, 0.08, D, xr, 0.04, cz, m.frame); B.box(0.1, 0.08, D, xr, 3.05, cz, m.frame); B.box(0.2, 0.32, D, xr, 3.24, cz, m.wallW);
    B.add(Geo.quad([xr, 0.06, G.z1], [xr, 0.06, G.z0], [xr, 3.02, G.z0], [xr, 3.02, G.z1]), m.glass, null, { noShadow: true });
    // the front: a glass balustrade over the pool hall, with the opening for the stair
    const S = GV_C.stair;
    for (const [a, b] of [[G.x0, S.x0 - 0.05], [S.x1 + 0.05, G.x1]]) {
      B.add(Geo.quad([a, 0.0, G.z0], [b, 0.0, G.z0], [b, 1.0, G.z0], [a, 1.0, G.z0]), m.glass, null, { noShadow: true });
      B.box(b - a, 0.05, 0.07, (a + b) / 2, 1.05, G.z0, m.chrome);
      B.box(b - a, 0.06, 0.08, (a + b) / 2, 0.03, G.z0, m.frame);
    }
    // a teal band and the level's name on the back wall
    B.box(W, 0.4, 0.02, cx, 2.9, G.z1 - 0.02, m.teal, 0, { noShadow: true });
    const sign = new THREE.MeshStandardMaterial({ map: Tex.label(['LEVEL 1 · GYM'], { w: 512, h: 96, font: 56, bg: '#2b6467', fg: '#f2f0ea' }), roughness: 0.6 });
    B.box(2.4, 0.45, 0.02, 4.0, 2.9, G.z1 - 0.035, sign, 0, { noShadow: true });
  }

  // fixed gym equipment (set dressing; the hero pieces with moving parts are in props.js)
  _gymKit() {
    const B = this.batch, m = this.m;
    // a dumbbell rack along the back-left, a squat rig with a pull-up bar, mats, a rowing machine, plate trees
    const rack = (x, z) => {
      B.box(1.8, 0.06, 0.5, x, 0.52, z, m.frame); B.box(1.8, 0.06, 0.5, x, 0.86, z, m.frame);
      for (const sx of [-0.85, 0.85]) B.box(0.06, 0.9, 0.5, x + sx, 0.45, z, m.frame);
      for (let i = 0; i < 6; i++) for (const [yy, s] of [[0.6, 0.7 + i * 0.05], [0.94, 0.55 + i * 0.04]]) {
        const xx = x - 0.72 + i * 0.29;
        B.add(new THREE.CylinderGeometry(0.06 * s + 0.02, 0.06 * s + 0.02, 0.07, 10), m.rubber, Geo.matrix(xx - 0.09, yy, z, 0, 0, Math.PI / 2));
        B.add(new THREE.CylinderGeometry(0.06 * s + 0.02, 0.06 * s + 0.02, 0.07, 10), m.rubber, Geo.matrix(xx + 0.09, yy, z, 0, 0, Math.PI / 2));
        B.add(new THREE.CylinderGeometry(0.015, 0.015, 0.14, 6), m.chrome, Geo.matrix(xx, yy, z, 0, 0, Math.PI / 2));
      }
    };
    rack(-2.6, 4.2); rack(-0.6, 4.2);
    // the rig (a pull-up frame) at the front left, near the balustrade
    for (const [x, z] of [[-5.6, -4.4], [-5.6, -5.4], [-3.6, -4.4], [-3.6, -5.4]]) B.box(0.08, 2.5, 0.08, x, 1.25, z, m.frame);
    for (const z of [-4.4, -5.4]) B.box(2.0, 0.08, 0.08, -4.6, 2.48, z, m.frame);
    B.add(new THREE.CylinderGeometry(0.018, 0.018, 2.0, 8), m.chrome, Geo.matrix(-4.6, 2.3, -4.4, 0, 0, Math.PI / 2));
    // mats
    for (const [x, z] of [[-1.2, -3.0], [0.2, -4.4], [-2.2, -1.2]]) B.box(0.65, 0.015, 1.8, x, 0.008, z, Mat.std('#3c5560', { roughness: 0.8 }), 0, { noShadow: true });
    // a rowing machine
    B.box(0.12, 0.08, 2.3, 1.6, 0.32, 3.3, m.frame); B.box(0.45, 0.45, 0.25, 1.6, 0.4, 2.2, m.rubber); B.box(0.3, 0.06, 0.32, 1.6, 0.42, 3.5, m.pad);
    // plate tree and a few plates leaning on it
    B.add(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8), m.chrome, Geo.matrix(5.2, 0.6, 1.4));
    for (let i = 0; i < 5; i++) B.add(new THREE.CylinderGeometry(0.22 - i * 0.025, 0.22 - i * 0.025, 0.05, 18), m.plate, Geo.matrix(5.2, 0.3 + i * 0.2, 1.4 + 0.04, Math.PI / 2, 0, 0));
    // a water cooler and a towel shelf by the back wall
    B.box(0.32, 1.1, 0.32, 5.4, 0.55, 4.5, Mat.std('#e8e6e0', { roughness: 0.5 })); B.add(new THREE.CylinderGeometry(0.14, 0.14, 0.4, 12), Mat.std('#8fc0dc', { roughness: 0.2 }), Geo.matrix(5.4, 1.3, 4.5));
    // the speaker on the ceiling corner, a wall clock
    B.box(0.3, 0.45, 0.25, -6.6, 3.0, 4.6, m.rubber);
  }

  /* ---------------- the sports hall (seen through the gym's glass) ---------------- */
  _court() {
    const B = this.batch, m = this.m, C = GV_C.court, W = C.x1 - C.x0, D = C.z1 - C.z0, cx = (C.x0 + C.x1) / 2, cz = (C.z0 + C.z1) / 2;
    B.box(W, 0.4, D, cx, -0.2, cz, m.concrete);
    B.add(Geo.flat(C.x0, C.x1, C.z0, C.z1, 0.002, 4), m.wood, null, { noShadow: true });
    B.box(W + 0.6, 0.4, D + 0.6, cx, C.h + 0.2, cz, m.ceil);
    for (const x of [9, 13, 17, 21]) for (const z of [-3, 1, 5, 9]) B.box(1.2, 0.05, 1.2, x, C.h - 0.03, z, m.lamp, 0, { noShadow: true });
    for (let x = 8; x < C.x1; x += 4) B.box(0.25, 0.6, D, x, C.h - 0.3, cz, m.truss);
    // walls: far (x1) with a strip of high windows, back (z1), end (z0) with the basket
    B.box(0.3, C.h, D, C.x1 + 0.15, C.h / 2, cz, Mat.std('#cfc9bc', { roughness: 0.9 }));
    B.box(0.02, 1.2, D - 1, C.x1 - 0.01, C.h - 1.3, cz, Mat.std('#e9f1f6', { roughness: 0.2, emissive: '#cfe2f0', emissiveIntensity: 0.7 }), 0, { noShadow: true });
    B.box(W, C.h, 0.3, cx, C.h / 2, C.z1 + 0.15, Mat.std('#cfc9bc', { roughness: 0.9 }));
    B.box(W, C.h, 0.3, cx, C.h / 2, C.z0 - 0.15, Mat.std('#d6d1c4', { roughness: 0.9 }));
    B.box(W, 1.6, 0.04, cx, 0.8, C.z0 + 0.02, Mat.std('#2c4a6e', { roughness: 0.6 }), 0, { noShadow: true });          // wall pads
    B.box(0.2, C.h - 3.2, D, C.x0 - 0.1, 3.2 + (C.h - 3.2) / 2, cz, m.wallW);                                        // above the gym's glass
    // the court's lines: the key in front of the basket, the free-throw circle, the baseline
    const H = C.hoop, ly = 0.004;
    B.add(Geo.flat(H.x - 2.45, H.x + 2.45, C.line, C.z0 + 0.4, ly, 1), m.key, null, { noShadow: true });
    const P = m.paint;
    B.add(Geo.flat(C.x0 + 0.3, C.x1 - 0.3, C.z0 + 0.35, C.z0 + 0.4, ly + 0.001, 1), P, null, { noShadow: true });
    for (const x of [H.x - 2.45, H.x + 2.45]) B.add(Geo.flat(x - 0.025, x + 0.025, C.line, C.z0 + 0.4, ly + 0.001, 1), P, null, { noShadow: true });
    B.add(Geo.flat(H.x - 2.45, H.x + 2.45, C.line - 0.025, C.line + 0.025, ly + 0.001, 1), P, null, { noShadow: true });
    const ring = new THREE.RingGeometry(1.775, 1.825, 40, 1, 0, Math.PI); ring.rotateX(-Math.PI / 2);
    B.add(ring, P, Geo.matrix(H.x, ly + 0.001, C.line), { noShadow: true });
    const arc = new THREE.RingGeometry(6.725, 6.775, 64, 1, Math.PI * 0.08, Math.PI * 0.84); arc.rotateX(-Math.PI / 2);
    B.add(arc, P, Geo.matrix(H.x, ly + 0.001, H.z - 0.2), { noShadow: true });
    // a climbing wall on the back wall, a bench and a ball cart
    const holds = [Mat.std('#e0503a'), Mat.std('#f2c230'), Mat.std('#3aa0d8'), Mat.std('#6cc04a')];
    B.box(8, 6.2, 0.1, 18, 3.4, C.z1 - 0.05, Mat.std('#8d96a0', { roughness: 0.85 }));
    for (let i = 0; i < 70; i++) B.add(new THREE.IcosahedronGeometry(0.07 + 0.06 * hash1(i * 3.1), 0), holds[i % 4], Geo.matrix(14.3 + 7.4 * hash1(i * 1.7), 0.6 + 5.6 * hash1(i * 2.3 + 1), C.z1 - 0.12, hash1(i), hash1(i * 2), 0));
    B.box(3.0, 0.45, 0.4, 20, 0.22, -4.4, Mat.std('#6b4a2e', { roughness: 0.7 }));
    B.box(0.8, 0.8, 0.5, 7.4, 0.4, 8.6, m.frame);
    for (let i = 0; i < 6; i++) B.add(new THREE.SphereGeometry(0.12, 12, 8), m.orangeB, Geo.matrix(7.15 + 0.25 * (i % 3), 0.92, 8.5 + 0.22 * Math.floor(i / 3)));
  }

  /* ---------------- the pool hall ---------------- */
  _hall() {
    const B = this.batch, m = this.m, H = GV_C.hall, P = GV_C.pool, L = GV_LOW, R = H.roof, G = GV_C.gym;
    const W = H.x1 - H.x0, D = H.z1 - H.z0, cx = (H.x0 + H.x1) / 2, cz = (H.z0 + H.z1) / 2;
    // the deck around the pool (tiles), a gutter grate along the pool's edge
    const deck = [[H.x0, P.x0, H.z0, H.z1], [P.x1, H.x1, H.z0, H.z1], [P.x0, P.x1, P.z1, H.z1], [P.x0, P.x1, H.z0, P.z0]];
    for (const [x0, x1, z0, z1] of deck) { B.add(Geo.flat(x0, x1, z0, z1, L, 1), m.deck, null, { noShadow: true }); B.box(x1 - x0, 0.6, z1 - z0, (x0 + x1) / 2, L - 0.3 - 0.002, (z0 + z1) / 2, m.concrete, 0, { noShadow: true }); }
    // walls: right (tiled), far (tiled), the near wall under the gym, its upper part above the gym
    B.box(0.3, R - L, D, H.x1 + 0.15, (R + L) / 2, cz, m.hallWall);
    B.box(W, R - L, 0.3, cx, (R + L) / 2, H.z0 - 0.15, m.hallWall);
    B.box(W, -L, 0.3, cx, L / 2, H.z1 + 0.15, m.hallWall);
    B.box(W, R - G.h - 0.35, 0.3, cx, (R + G.h + 0.35) / 2, H.z1 + 0.15, m.wallW);
    for (const [a, b] of [[H.x0, G.x0], [G.x1, H.x1]]) B.box(b - a, G.h + 0.4, 0.3, (a + b) / 2, (G.h + 0.35) / 2 - 0.2, H.z1 + 0.15, m.wallW);
    // the glazed left wall: mullions, transoms, glass (the sun pours across the water)
    const xw = H.x0;
    B.box(0.3, 0.8, D, xw - 0.15, L + 0.4, cz, m.wallG);
    B.box(0.3, R - 11.6, D, xw - 0.15, (R + 11.6) / 2, cz, m.wallG);
    for (let z = H.z0; z <= H.z1 + 1e-6; z += 2.0) B.box(0.16, 11.6 - L - 0.8, 0.14, xw, (11.6 + L + 0.8) / 2, z, m.frame);
    for (const y of [L + 0.8, 0.8, 4.8, 8.4, 11.6]) B.box(0.16, 0.12, D, xw, y, cz, m.frame);
    B.add(Geo.quad([xw, L + 0.8, H.z0], [xw, L + 0.8, H.z1], [xw, 11.6, H.z1], [xw, 11.6, H.z0]), m.glass, null, { noShadow: true });
    // the roof: a ceiling, steel trusses across, long light fittings
    B.box(W + 0.6, 0.4, D + 0.6, cx, R + 0.2, cz, m.ceil);
    for (let z = H.z1 - 3; z > H.z0; z -= 5) {
      B.box(W, 0.18, 0.2, cx, R - 0.1, z, m.truss); B.box(W, 0.14, 0.16, cx, R - 1.5, z, m.truss);
      for (let x = H.x0 + 1; x < H.x1; x += 2) B.add(new THREE.BoxGeometry(0.08, 1.6, 0.08), m.truss, Geo.matrix(x, R - 0.8, z, 0, 0, ((x - H.x0) / 2 | 0) % 2 ? 0.6 : -0.6));
      B.box(0.25, 0.08, 3.6, -5, R - 1.62, z - 2.5, m.lamp, 0, { noShadow: true }); B.box(0.25, 0.08, 3.6, 7, R - 1.62, z - 2.5, m.lamp, 0, { noShadow: true });
    }
    // the right wall: a big clock and a lane-number board, a wave mural band
    B.box(D - 4, 1.0, 0.03, H.x1 - 0.02, 2.2 + L, cz, m.teal, Math.PI / 2, { noShadow: true });
    const clock = new THREE.MeshStandardMaterial({ map: Tex.label(['14:32'], { w: 256, h: 128, font: 80, bg: '#111316', fg: '#ff4a3a' }), emissive: '#ffffff', emissiveIntensity: 0.4, roughness: 0.4 });
    B.box(1.4, 0.7, 0.05, H.x1 - 0.03, 6.2, -20, clock, Math.PI / 2, { noShadow: true });
    const name = new THREE.MeshStandardMaterial({ map: Tex.label(['RIVERSIDE POOL'], { w: 1024, h: 128, font: 90, bg: '#2b6467', fg: '#f2f0ea' }), roughness: 0.6 });
    B.box(8.0, 1.0, 0.05, -2, 9.0, H.z0 + 0.03, name, 0, { noShadow: true });
  }

  // the open stair from the gym down to the deck: steel stringers, open treads, glass balustrades with a handrail
  _stair() {
    const B = this.batch, m = this.m, S = GV_C.stair, w = S.x1 - S.x0, cx = (S.x0 + S.x1) / 2, len = S.n * S.run;
    const tread = Mat.std('#c9c3b6', { roughness: 0.7 });
    for (let k = 1; k <= S.n - 1; k++) {
      const y = -S.rise * k, z = S.z0 - (k - 0.5) * S.run;
      B.box(w, 0.05, S.run + 0.02, cx, y - 0.025, z, tread);
      B.box(w, 0.025, 0.04, cx, y - 0.012, z + S.run / 2 - 0.02, m.rubber, 0, { noShadow: true });   // nosing
    }
    const ang = Math.atan2(S.rise * S.n, len), sl = Math.hypot(S.rise * S.n, len);
    for (const x of [S.x0 - 0.05, S.x1 + 0.05]) {
      B.add(new THREE.BoxGeometry(0.08, 0.3, sl), m.frame, Geo.matrix(x, -S.rise * S.n / 2 - 0.12, S.z0 - len / 2, -ang, 0, 0));
      // glass balustrade (a slanted band), handrail on posts
      const g = new THREE.PlaneGeometry(sl, 0.95); g.rotateY(Math.PI / 2);
      B.add(g, m.glass, Geo.matrix(x, -S.rise * S.n / 2 + 0.47, S.z0 - len / 2, -ang, 0, 0), { noShadow: true });
      B.add(new THREE.BoxGeometry(0.05, 0.05, sl), m.chrome, Geo.matrix(x, -S.rise * S.n / 2 + 0.95, S.z0 - len / 2, -ang, 0, 0));
      for (let k = 0; k <= S.n; k += 3) B.box(0.035, 0.95, 0.035, x, -S.rise * k + 0.475, S.z0 - k * S.run, m.chrome);
    }
  }

  // the pool: tiled walls and floor (lanes, then a slope to the deep end), coping, the dividing rope
  _basin() {
    const B = this.batch, m = this.m, P = GV_C.pool, L = GV_LOW, Wt = GV_WATER;
    const zs = []; for (let z = P.z1; z >= P.z0 - 1e-6; z -= 0.5) zs.push(z);
    const fy = (z) => Wt - gvPoolDepth(z);
    // floor (strips along x so the slope reads), walls on all four sides following the floor
    for (let i = 0; i < zs.length - 1; i++) {
      const a = zs[i], b = zs[i + 1];
      B.add(Geo.quad([P.x0, fy(a), a], [P.x1, fy(a), a], [P.x1, fy(b), b], [P.x0, fy(b), b], P.x0 / 1, -a, P.x1 / 1, -b), m.poolTile, null, { noShadow: true });
      // left wall (faces +x), right wall (faces −x)
      B.add(Geo.quad([P.x0, fy(b), b], [P.x0, fy(a), a], [P.x0, L, a], [P.x0, L, b], -b, fy(b), -a, L), m.poolTile, null, { noShadow: true });
      B.add(Geo.quad([P.x1, fy(a), a], [P.x1, fy(b), b], [P.x1, L, b], [P.x1, L, a], -a, fy(a), -b, L), m.poolTile, null, { noShadow: true });
    }
    B.add(Geo.quad([P.x1, fy(P.z1), P.z1], [P.x0, fy(P.z1), P.z1], [P.x0, L, P.z1], [P.x1, L, P.z1], P.x1, fy(P.z1), P.x0, L), m.poolTile, null, { noShadow: true });
    B.add(Geo.quad([P.x0, fy(P.z0), P.z0], [P.x1, fy(P.z0), P.z0], [P.x1, L, P.z0], [P.x0, L, P.z0], P.x0, fy(P.z0), P.x1, L), m.poolTile, null, { noShadow: true });
    // lane lines on the floor (dark blue, with T-ends), and target crosses on the end walls
    const lanes = [-10.25, -8.0, -5.75, -3.5, -1.25];
    for (const x of lanes) for (let i = 0; i < zs.length - 1; i++) {
      const a = zs[i], b = zs[i + 1]; if (a > P.z1 - 1.8 || b < P.s0 + 0.2) continue;
      B.add(Geo.quad([x - 0.12, fy(a) + 0.006, a], [x + 0.12, fy(a) + 0.006, a], [x + 0.12, fy(b) + 0.006, b], [x - 0.12, fy(b) + 0.006, b]), m.laneBlue, null, { noShadow: true });
    }
    for (const x of lanes) B.add(Geo.quad([x - 0.5, fy(P.z1 - 1.8) + 0.006, P.z1 - 1.8], [x + 0.5, fy(P.z1 - 1.8) + 0.006, P.z1 - 1.8], [x + 0.5, fy(P.z1 - 2.05) + 0.006, P.z1 - 2.05], [x - 0.5, fy(P.z1 - 2.05) + 0.006, P.z1 - 2.05]), m.laneBlue, null, { noShadow: true });
    // the coping: a rounded white edge all round, the dark gutter grate behind it
    const cop = (x0, x1, z0, z1) => { B.box(x1 - x0, 0.08, z1 - z0, (x0 + x1) / 2, L - 0.04, (z0 + z1) / 2, m.coping, 0, { noShadow: true }); };
    cop(P.x0 - 0.3, P.x0, P.z0 - 0.3, P.z1 + 0.3); cop(P.x1, P.x1 + 0.3, P.z0 - 0.3, P.z1 + 0.3); cop(P.x0, P.x1, P.z1, P.z1 + 0.3); cop(P.x0, P.x1, P.z0 - 0.3, P.z0);
    for (const [x0, x1, z0, z1] of [[P.x1 + 0.3, P.x1 + 0.55, P.z0 - 0.55, P.z1 + 0.55], [P.x0 - 0.55, P.x0 - 0.3, P.z0 - 0.55, P.z1 + 0.55], [P.x0 - 0.3, P.x1 + 0.3, P.z1 + 0.3, P.z1 + 0.55], [P.x0 - 0.3, P.x1 + 0.3, P.z0 - 0.55, P.z0 - 0.3]])
      B.add(Geo.flat(x0, x1, z0, z1, L + 0.003, 0.25), m.grate, null, { noShadow: true });
    // the deep-end warning band on the deck and depth markings
    const depth = (txt, x, z, rot) => { const t = new THREE.MeshStandardMaterial({ map: Tex.label([txt], { w: 256, h: 128, font: 76, bg: '#c9c4b9', fg: '#1b3d7a' }), roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 }); const g = new THREE.PlaneGeometry(0.8, 0.4); g.rotateX(-Math.PI / 2); B.add(g, t, Geo.matrix(x, L + 0.004, z, 0, rot, 0), { noShadow: true }); };
    depth('1.6 m', P.x1 + 0.95, -12, -Math.PI / 2); depth('5.0 m', P.x1 + 0.95, -25, -Math.PI / 2);
    // starting blocks on the shallow end (facing the length of the pool)
    for (const x of lanes.concat([0.25])) {
      const xx = x - 1.125 + 2.25 * 0.5; if (xx > P.x1 - 0.4) continue;
      B.box(0.5, 0.06, 0.55, xx, L + 0.72, P.z1 + 0.55, Mat.std('#e9e7e1', { roughness: 0.5 })); B.box(0.4, 0.72, 0.3, xx, L + 0.36, P.z1 + 0.65, m.frame);
    }
  }

  // the diving tower: a concrete pylon on the far deck, platforms at 3, 5 (cantilevered), 7.5 and 10 m, blue edges, rails, stairs behind
  _tower() {
    const B = this.batch, m = this.m, T = GV_C.tower, L = GV_LOW;
    B.box(T.x1 - T.x0, T.top + 1.1, T.z1 - T.z0, (T.x0 + T.x1) / 2, L + (T.top + 1.1) / 2, (T.z0 + T.z1) / 2, m.towerC);
    const plat = (x0, x1, h, edge) => {
      const z1 = edge, z0 = T.z1 - 0.2, y = L + h;
      B.box(x1 - x0, 0.3, z1 - z0, (x0 + x1) / 2, y - 0.15, (z0 + z1) / 2, m.towerC);
      B.box(x1 - x0, 0.06, 0.06, (x0 + x1) / 2, y - 0.03, z1 - 0.03, m.towerBlue, 0, { noShadow: true });
      B.box(x1 - x0 + 0.02, 0.18, 0.04, (x0 + x1) / 2, y - 0.2, z1 + 0.01, m.towerBlue, 0, { noShadow: true });
      for (const x of [x0 + 0.04, x1 - 0.04]) { B.box(0.04, 1.0, z1 - z0 - 0.4, x, y + 0.5, (z0 + z1) / 2 - 0.2, m.chrome); B.box(0.04, 0.04, z1 - z0 - 0.4, x, y + 1.0, (z0 + z1) / 2 - 0.2, m.chrome); B.box(0.04, 0.04, z1 - z0 - 0.4, x, y + 0.5, (z0 + z1) / 2 - 0.2, m.chrome); }
      // a non-slip mat on the top
      B.add(Geo.flat(x0 + 0.08, x1 - 0.08, z0, z1 - 0.1, y + 0.004, 1), Mat.std('#4d6f8a', { roughness: 0.9 }), null, { noShadow: true });
    };
    plat(T.px0, T.px1, T.top, T.edge);
    plat(T.x0 - 2.2, T.x0 + 0.4, 7.5, T.edge + 0.6);
    plat(T.x1 - 0.4, T.x1 + 2.0, 5.0, T.edge + 0.9);
    plat(T.x0 - 2.0, T.x0 + 0.2, 3.0, T.edge + 1.1);
    for (const [x, h] of [[T.x0 - 2.1, 7.5], [T.x0 - 1.9, 3.0]]) B.box(0.35, h, 0.35, x, L + h / 2, T.z1 - 0.3, m.towerC);
    // the steel stair tower behind (zig-zag flights inside a cage)
    const sx = (T.x0 + T.x1) / 2, sz = T.z0 - 1.2;
    for (let k = 0; k < 8; k++) { const y0 = L + k * 1.3; B.add(new THREE.BoxGeometry(2.2, 0.08, 1.9), m.frame, Geo.matrix(sx + (k % 2 ? 0.6 : -0.6), y0 + 0.65, sz, 0, 0, (k % 2 ? 1 : -1) * 0.53)); }
    for (const [x, z] of [[sx - 1.4, sz - 1.0], [sx + 1.4, sz - 1.0], [sx - 1.4, sz + 1.0], [sx + 1.4, sz + 1.0]]) B.box(0.1, T.top + 1.0, 0.1, x, L + (T.top + 1.0) / 2, z, m.frame);
    // a big "10 m" on the pylon's face
    const lab = new THREE.MeshStandardMaterial({ map: Tex.label(['10 m'], { w: 256, h: 128, font: 88, bg: '#b0aca4', fg: '#1f5ea8' }), roughness: 0.7 });
    B.box(1.2, 0.6, 0.03, (T.x0 + T.x1) / 2, L + T.top - 1.0, T.z1 + 0.02, lab, 0, { noShadow: true });
  }

  // on the deck: the lifeguard's high chair, loungers, a rescue tube, the ladder at the deep end, the rope across the pool
  _deckKit() {
    const B = this.batch, m = this.m, L = GV_LOW, P = GV_C.pool, Ch = GV_C.chair;
    // the chair: four legs, a seat at 1.6 m, a red back and a parasol
    for (const [dx, dz] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) B.box(0.05, 1.6, 0.05, Ch.x + dx, L + 0.8, Ch.z + dz, m.chrome);
    B.box(0.7, 0.06, 0.7, Ch.x, L + 1.6, Ch.z, m.chrome); B.box(0.45, 0.06, 0.5, Ch.x, L + 1.66, Ch.z, m.red); B.box(0.05, 0.55, 0.5, Ch.x + 0.22, L + 1.95, Ch.z, m.red);
    for (let k = 0; k < 4; k++) B.box(0.06, 0.04, 0.5, Ch.x + 0.32, L + 0.35 + k * 0.4, Ch.z, m.chrome);
    B.box(0.5, 0.04, 0.12, Ch.x - 0.42, L + 1.05, Ch.z, m.chrome);                       // the footrest
    B.add(new THREE.CylinderGeometry(0.02, 0.02, 1.8, 6), m.chrome, Geo.matrix(Ch.x + 0.3, L + 2.5, Ch.z + 0.3));
    B.add(new THREE.ConeGeometry(1.1, 0.35, 10, 1, true), Mat.std('#e8e1d0', { roughness: 0.8, side: THREE.DoubleSide }), Geo.matrix(Ch.x + 0.3, L + 3.35, Ch.z + 0.3));
    B.add(new THREE.CapsuleGeometry(0.08, 0.7, 3, 8), m.red, Geo.matrix(Ch.x + 0.45, L + 0.9, Ch.z - 0.35, 0, 0, 0.2));
    // loungers on the right deck
    const lounger = (x, z) => { B.box(0.65, 0.08, 1.9, x, L + 0.35, z, Mat.std('#f2f0ea', { roughness: 0.6 })); for (const dz of [-0.85, 0.85]) for (const dx of [-0.28, 0.28]) B.box(0.04, 0.35, 0.04, x + dx, L + 0.17, z + dz, m.chrome); B.add(new THREE.BoxGeometry(0.65, 0.08, 0.65), Mat.std('#f2f0ea', { roughness: 0.6 }), Geo.matrix(x, L + 0.62, z + 0.95, -0.85, 0, 0)); };
    for (const [x, z] of [[9.0, -17.4], [10.2, -17.4], [9.0, -21.4], [11.6, -12.6]]) lounger(x, z);
    // the ladder at the deep end (two chrome rails curving over the edge, steps into the water)
    const Ld = GV_C.ladder;
    for (const dz of [-0.25, 0.25]) {
      B.add(new THREE.CylinderGeometry(0.022, 0.022, 2.6, 8), m.chrome, Geo.matrix(Ld.x - 0.18, GV_WATER - 1.1, Ld.z + dz));
      B.add(new THREE.TorusGeometry(0.3, 0.022, 6, 12, Math.PI), m.chrome, Geo.matrix(Ld.x + 0.12, L + 0.2, Ld.z + dz, 0, 0, 0));
      B.add(new THREE.CylinderGeometry(0.022, 0.022, 0.4, 8), m.chrome, Geo.matrix(Ld.x + 0.42, L + 0.02, Ld.z + dz));
    }
    for (let k = 0; k < 4; k++) B.box(0.12, 0.03, 0.5, Ld.x - 0.12, GV_WATER - 0.35 - k * 0.32, Ld.z, m.chrome);
    // the rope across the pool at the start of the slope (floats: red/white), lane ropes over the lanes
    const rope = (x0, z0, x1, z1, n, cols) => { for (let i = 0; i <= n; i++) { const f = i / n; B.add(new THREE.CylinderGeometry(0.07, 0.07, 0.14, 8), cols[(i >> 1) % cols.length], Geo.matrix(MathX.lerp(x0, x1, f), GV_WATER + 0.02, MathX.lerp(z0, z1, f), 0, Math.atan2(x1 - x0, z1 - z0), Math.PI / 2)); } };
    const red = Mat.std('#c8321e', { roughness: 0.5 }), wht = Mat.std('#eeeeea', { roughness: 0.5 }), blu = Mat.std('#2052a8', { roughness: 0.5 }), yel = Mat.std('#e8c21c', { roughness: 0.5 });
    rope(P.x0 + 0.1, P.s0 - 0.6, P.x1 - 0.1, P.s0 - 0.6, 80, [red, wht]);
    for (const x of [-9.125, -6.875, -4.625]) rope(x, P.z1 - 0.1, x, P.s0 - 0.6, 64, [blu, wht, yel]);
    // backstroke flags across the pool (two lines of small pennants)
    for (const z of [P.z1 - 5]) { B.box(P.x1 - P.x0 + 1, 0.012, 0.012, (P.x0 + P.x1) / 2, L + 1.9, z, m.rubber, 0, { noShadow: true }); for (let x = P.x0; x < P.x1; x += 0.5) B.add(new THREE.ConeGeometry(0.12, 0.25, 3), [red, blu, wht][(x * 2 | 0) % 3 < 0 ? 0 : (x * 2 | 0) % 3], Geo.matrix(x, L + 1.75, z, Math.PI, 0, 0), { noShadow: true }); }
    for (const x of [P.x0 - 0.8, P.x1 + 0.8]) B.add(new THREE.CylinderGeometry(0.03, 0.03, 2.0, 6), m.chrome, Geo.matrix(x, L + 1.0, P.z1 - 5));
  }

  // reflections: an interior (bright windows on one side, warm walls, the water's colour below)
  _environmentMap() {
    const pm = new THREE.PMREMGenerator(this.renderer), s = new THREE.Scene();
    s.add(new THREE.Mesh(new THREE.BoxGeometry(60, 30, 60), new THREE.MeshBasicMaterial({ color: '#a9a49a', side: THREE.BackSide })));
    const win = new THREE.Mesh(new THREE.PlaneGeometry(50, 14), new THREE.MeshBasicMaterial({ color: '#f4f8fb' })); win.position.set(-29, 4, 0); win.rotation.y = Math.PI / 2; s.add(win);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ color: '#e7e4dc' })); ceil.position.y = 14.9; ceil.rotation.x = Math.PI / 2; s.add(ceil);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ color: '#5f8a96' })); floor.position.y = -14.9; floor.rotation.x = -Math.PI / 2; s.add(floor);
    const rt = pm.fromScene(s, 0.02, 0.1, 200);
    this.scene.environment = rt.texture; this.scene.environmentIntensity = 0.5;
    pm.dispose();
  }

  update(t) { this.skyUniforms.uTime.value = t; }
}
