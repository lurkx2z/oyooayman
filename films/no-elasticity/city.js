/* =====================================================================
   CITY — a sunny avenue (subclass of the shared Environment). On your
   side a small paved plaza (the dribbler, the trampoline, a hoop, trees),
   a café front with a cushioned bench, a raised speed table across the
   avenue right in front of you, the intersection where the crash
   happens, and a steel footbridge beyond it. Structures bend in their
   vertex shaders (pure functions of time): the footbridge sags (it keeps
   the deepest dip any load gave it, drawn ×150), the signal mast arm
   droops a little. Environment.update is Oxygen-only, so this class has its own.
   ===================================================================== */

const LAYOUT = {
  roadHalf: 7.0, curbH: 0.15, frontage: 12.5, laneW: 3.5,
  crossZ: -46, crossHalf: 7,
  zNear: 160, zFar: -900,
  busStop: { x: -10.3, z: -24 },
  lot: { x0: 12.5, x1: 12.5, z0: -33.5, z1: -2 },
};

const NE_CITY = {
  plaza: { x0: 12.5, x1: 31.5, z0: -33.5, z1: -2.0 },
  table: { zA: -10.4, zB: -11.6, zC: -16.4, zD: -17.6, h: 0.09 },   // the speed table: ramp up A→B, plateau, ramp down C→D
  bridge: { z: -86, half: 11.0, w: 2.6, deck: 6.2 },                  // footbridge between two stair towers
  mast: { x: 7.9, z: -54.2, len: 7.5, h: 6.75 },                       // the signal mast that faces you (its arm droops)
  lamps: [[-7.45, -64], [7.45, -100]],                                 // the lamp posts that lean
  bench: { x: 12.08, z: 3.2 },                                         // the café bench (its cushions are props)
  hoop: { x: 29.6, z: -21 },
  trees: [[16.0, -29.5], [27.0, -5.0], [30.0, -31.0]],
};

// the wind's direction (it blows toward +x, +z: the trees lean that way, across the time-lapse frame)
const NE_WIND = [0.85, 0.53];
// the sky through the time-lapse: [minutes, zenith, horizon, sun, fog, hemisphere sky, hemisphere ground, hemisphere intensity]
const NE_SKY_KEYS = [
  [942, '#4d8bd0', '#c6d8e6', '#ffe4b8', '#c9d3d9', '#bcd2ec', '#7d6e5e', 1.45],
  [1080, '#4a84c8', '#d6dbd8', '#ffd8a0', '#cfd2d0', '#b8cce4', '#7a6a58', 1.35],
  [1150, '#4677b8', '#ecc79a', '#ffb878', '#d8c4ac', '#b0bcd6', '#6e5e50', 1.15],
  [1195, '#3c5f9c', '#f2a070', '#ff8a4a', '#c89c86', '#9aa2c4', '#5a4c46', 0.9],
  [1225, '#2c4680', '#d0786a', '#ff7040', '#8c7080', '#7a84aa', '#3e3a3e', 0.7],
  [1265, '#16224a', '#4a4a6e', '#ff6a3a', '#3a3e56', '#4c5888', '#26262e', 0.5],
];

// road surface height (the speed table) — used by every car
function neRoadY(z) {
  const T = NE_CITY.table;
  if (z > T.zA || z < T.zD) return 0;
  if (z > T.zB) return T.h * (T.zA - z) / (T.zA - T.zB);
  if (z > T.zC) return T.h;
  return T.h * (z - T.zD) / (T.zC - T.zD);
}

// the footbridge's permanent midspan sag. The deck keeps the deepest deflection any load has given it so far: the running
// maximum of the walkers' and runners' load (cast.js). Real values are fractions of a millimetre per person; the picture draws them ×NE_SAG_DRAW.
const NE_SAG_DRAW = 300;
const NE_SAG = { t0: 30.0, t1: 52.0, dt: 1 / 60, tab: null };
function neSagReal(t) {
  const S = NE_SAG;
  if (!S.tab) { S.tab = []; let m = 0; for (let x = S.t0; x <= S.t1 + 1e-9; x += S.dt) { m = Math.max(m, neBridgeLoad(x)); S.tab.push(m); } }
  if (t <= S.t0) return 0;
  const f = Math.min((t - S.t0) / S.dt, S.tab.length - 1.001), i = Math.floor(f);
  return S.tab[i] + (S.tab[i + 1] - S.tab[i]) * (f - i);
}
function neSag(t) { return neSagReal(t) * NE_SAG_DRAW; }
const neSagText = (t) => `${(neSagReal(t) * 1000).toFixed(1)} mm`;
// the signal arm's droop at its tip (m): small and slow (a gust's push stays); the lamp posts no longer lean
function neDroop(t) { return NE_STREET ? 0.02 + 0.08 * MathX.smooth(t, 43.0, 51.0) : 0.02; }
function neLean(t) { return 0; }

class NeCity extends Environment {
  build() {
    this._materials();
    this._bendMaterials();
    this._leanMaterials();
    this._sky();
    this._lights();
    this._ground();
    this._markings();
    this._table();
    this._plaza();
    this._buildings();
    this._skyline();
    this._trees();
    this._streetFurniture();
    this._signals();
    this._bridge();
    this._lampsBend();
    this.batch.build(this.root, 'env');
    this._environmentMap();
    // the trees' shadows lean with them
    this.root.traverse((o) => { if (o.isMesh && (o.material === this.m.bark || o.material === this.m.foliage)) o.customDepthMaterial = this.leanDepth; });
    this._sky0 = { zen: this.skyUniforms.uZenith.value.clone(), hor: this.skyUniforms.uHorizon.value.clone(), sun: this.skyUniforms.uSunColor.value.clone(), dir: this.sunDir.clone(), sunC: this.sun.color.clone(), k0: new THREE.Color(NE_SKY_KEYS[0][3]) };
  }

  // every tree bends a little further downwind with each gust and stays bent (neTreeLean in clocks.js): the higher a
  // point on the tree, the further it moves. (The merged tree geometry is already in world space.)
  _leanMaterials() {
    this.leanU = { uLean: { value: 0 } };
    const W = NE_WIND, U = this.leanU;
    const patch = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uLean;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          { float hh = max(0.0, transformed.y - 0.45), d = uLean * 0.022 * hh * hh; transformed.xz += vec2(${W[0].toFixed(4)}, ${W[1].toFixed(4)}) * d; transformed.y -= 0.5 * d * d / max(hh, 0.5); }`);
    };
    for (const m of [this.m.bark, this.m.foliage]) {
      Look.surface(m, false); Look.grime(m, 0.5);
      const prev = m.onBeforeCompile, key = m.customProgramCacheKey;
      m.onBeforeCompile = (sh, r) => { prev.call(m, sh, r); patch(sh); };
      m.customProgramCacheKey = () => key.call(m) + 'neLean';
    }
    this.leanDepth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    this.leanDepth.onBeforeCompile = patch; this.leanDepth.customProgramCacheKey = () => 'neLeanDepth';
  }

  // the time-lapse light (pure function of the minutes the sun says): the sun swings round and sinks behind the buildings
  // across the avenue, the sky goes gold, then orange, then blue; the shop windows glow
  _lapse(t) {
    const S0 = this._sky0, U = this.skyUniforms, m = neSunMinutes(t), on = t >= NE.lapse[0];
    const u = on ? MathX.clamp((m - 942) / (1215 - 942), 0, 1) : 0;
    const el = MathX.deg(36.9 * Math.pow(1 - u, 0.85)), az = MathX.deg(121.7 + 78 * u);
    if (!on) { this.sunDir.copy(S0.dir); } else this.sunDir.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)).normalize();
    // the colour keys (minutes): zenith, horizon, sun, fog, hemisphere sky, hemisphere ground, hemisphere intensity
    const K = NE_SKY_KEYS; let i = 0; while (i + 1 < K.length && K[i + 1][0] <= m) i++;
    const a = K[i], b = K[Math.min(i + 1, K.length - 1)], w = on && b !== a ? MathX.clamp((m - a[0]) / (b[0] - a[0]), 0, 1) : 0, c = this._c || (this._c = new THREE.Color());
    const mix = (out, j) => out.set(on ? a[j] : K[0][j]).lerp(c.set(on ? b[j] : K[0][j]), w);
    mix(U.uZenith.value, 1); mix(U.uHorizon.value, 2); mix(U.uSunColor.value, 3); mix(this.scene.fog.color, 4);
    mix(this.hemi.color, 5); mix(this.hemi.groundColor, 6); this.hemi.intensity = on ? MathX.lerp(a[7], b[7], w) : K[0][7];
    this.scene.background.copy(U.uHorizon.value);
    { const k = U.uSunColor.value, k0 = S0.k0; this.sun.color.setRGB(S0.sunC.r * k.r / k0.r, S0.sunC.g * k.g / k0.g, S0.sunC.b * k.b / k0.b); }
    this.sun.intensity = on ? 4.3 * (1 - MathX.smooth(m, 18 * 60, 19 * 60 + 52) * 0.98) - 0.4 * MathX.smooth(m, 19 * 60 + 20, 19 * 60 + 52) : 4.3;
    this.sun.intensity = Math.max(0, this.sun.intensity);
    this.scene.environmentIntensity = 0.42 - 0.26 * neDusk(t);
    for (const sm of this.shopMats) sm.emissiveIntensity = 0.55 + 0.9 * neDusk(t);
    // keep the sun aimed at the current shadow box
    const tgt = this.sun.target.position; this.sun.position.copy(this.sunDir).multiplyScalar(200).add(tgt); this.sun.updateMatrixWorld();
  }

  // materials that bend in world space (uniform-driven): the footbridge, the drooping signal arm, the leaning lamp posts
  _bendMaterials() {
    this.bendU = { uSag: { value: 0 }, uDroop: { value: 0 }, uLean: { value: 0 } };
    const U = this.bendU, B = NE_CITY.bridge, M = NE_CITY.mast;
    const mk = (base, kind) => {
      const m = base.clone();
      m.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, U);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uSag, uDroop, uLean;')
          .replace('#include <project_vertex>', `
            vec4 wpB = modelMatrix * vec4(transformed, 1.0);
            ${kind === 'bridge' ? `{ float u = clamp(wpB.x / ${B.half.toFixed(2)}, -1.0, 1.0); wpB.y -= uSag * (1.0 - u * u); }` : ''}
            ${kind === 'arm' ? `{ float u = clamp((${M.x.toFixed(2)} - wpB.x) / ${M.len.toFixed(2)}, 0.0, 1.2); wpB.y -= uDroop * u * u; }` : ''}
            ${kind === 'lamp' ? `{ float u = clamp((wpB.y - 0.15) / 8.0, 0.0, 1.2); wpB.x += uLean * u * u * sign(wpB.x); wpB.y -= 0.5 * uLean * uLean * u * u * u / 8.0; }` : ''}
            vec4 mvPosition = viewMatrix * wpB;
            gl_Position = projectionMatrix * mvPosition;`);
      };
      m.customProgramCacheKey = () => 'neBend' + kind;
      return m;
    };
    this.bm = {
      steel: mk(Mat.std('#5f6b70', { roughness: 0.55, metalness: 0.45 }), 'bridge'),
      steelDark: mk(Mat.std('#3a4246', { roughness: 0.6, metalness: 0.4 }), 'bridge'),
      deck: mk(Mat.std('#8d8a82', { roughness: 0.85 }), 'bridge'),
      glass: mk(Mat.std('#9fb4bd', { roughness: 0.12, metalness: 0.3, name: 'bridgeGlass' }), 'bridge'),
      arm: mk(Mat.std('#2c3034', { roughness: 0.45, metalness: 0.6 }), 'arm'),
      head: mk(Mat.std('#1d2124', { roughness: 0.5 }), 'arm'),
      lamp: mk(Mat.std('#2c3034', { roughness: 0.45, metalness: 0.6 }), 'lamp'),
      lampWhite: mk(Mat.std('#f0efe9', { roughness: 0.6 }), 'lamp'),
    };
  }

  /* ---------------- a clear, sunny afternoon ---------------- */
  _sky() {
    this.sunDir = new THREE.Vector3(-0.42, 0.6, 0.68).normalize();
    const zenith = new THREE.Color('#4d8bd0'), horizon = new THREE.Color('#c6d8e6');
    this.fogColor = new THREE.Color('#c9d3d9');
    this.skyUniforms = { uZenith: { value: zenith }, uHorizon: { value: horizon }, uGround: { value: new THREE.Color('#8d9590') }, uSunDir: { value: this.sunDir }, uSunColor: { value: new THREE.Color('#ffe4b8') }, uTime: { value: 0 } };
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
            vec2 uv = d.xz / (h + 0.18) * 0.42 + vec2(uTime * 0.006, uTime * 0.0015);
            float c = fbm(uv * 1.3);
            float cov = smoothstep(0.6, 0.84, c) * smoothstep(0.0, 0.12, h);
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
    this.scene.fog = new THREE.FogExp2(this.fogColor.clone(), 0.0011);
    this.scene.background = horizon.clone();
  }

  // the sun's shadow box follows what the camera looks at (focus(x, z, r) from film.js) so the map stays sharp
  _lights() {
    const sun = new THREE.DirectionalLight('#ffe6c4', 4.3);
    sun.castShadow = CONFIG.render.shadows;
    sun.shadow.mapSize.set(CONFIG.render.shadowMapSize, CONFIG.render.shadowMapSize);
    sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.035; sun.shadow.radius = 3;
    this.scene.add(sun, sun.target); this.sun = sun;
    this.hemi = new THREE.HemisphereLight('#bcd2ec', '#7d6e5e', 1.45); this.scene.add(this.hemi);
    this.focus(10, -10, 40);
  }
  focus(x, z, r) {
    const sun = this.sun, sc = sun.shadow.camera, tgt = sun.target.position;
    if (this._f && this._f[0] === x && this._f[1] === z && this._f[2] === r) return;
    this._f = [x, z, r];
    tgt.set(x, 2, z); sun.position.copy(this.sunDir).multiplyScalar(200).add(tgt);
    sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r; sc.near = 20; sc.far = 420; sc.updateProjectionMatrix();
    sun.updateMatrixWorld(); sun.target.updateMatrixWorld();
  }

  _ground() {
    super._ground();
    // the plaza: paving at sidewalk height from the sidewalk back to the buildings behind it
    const P = NE_CITY.plaza, B = this.batch, h = LAYOUT.curbH;
    B.add(Geo.flat(P.x0 + 0.5, P.x1, P.z0, P.z1, h, 2.5), this.m.sidewalk, null, { noShadow: true });
  }

  _markings() {
    const B = this.batch, m = this.m, L = LAYOUT, y = 0.006, cz0 = L.crossZ - L.crossHalf, cz1 = L.crossZ + L.crossHalf, T = NE_CITY.table;
    const segs = [[cz1 + 4, T.zA - 0.3], [T.zD + 0.3, cz1 + 5], [T.zA + 0.4, L.zNear], [L.zFar, cz0 - 4]];
    for (const [z0, z1] of [[cz1 + 4, T.zD - 0.2], [T.zA + 0.2, L.zNear], [L.zFar, cz0 - 4]]) {
      for (const x of [-0.16, 0.16]) B.add(Geo.flat(x - 0.06, x + 0.06, z0, z1, y, 1), m.markYellow, null, { noShadow: true });
      for (const x of [-3.5, 3.5]) for (let z = z0; z < z1 - 3; z += 9) B.add(Geo.flat(x - 0.07, x + 0.07, z, z + 3, y, 1), m.markWhite, null, { noShadow: true });
      for (const x of [-6.75, 6.75]) B.add(Geo.flat(x - 0.07, x + 0.07, z0, z1, y, 1), m.markWhite, null, { noShadow: true });
    }
    void segs;
    for (const zc of [cz1 + 2, cz0 - 2]) for (let x = -6.5; x < 6.6; x += 1.0) B.add(Geo.flat(x, x + 0.55, zc - 1.6, zc + 1.6, y, 1), m.markWhite, null, { noShadow: true });
    B.add(Geo.flat(0.3, 6.9, cz1 + 3.8, cz1 + 4.25, y, 1), m.markWhite, null, { noShadow: true });
    B.add(Geo.flat(-6.9, -0.3, cz0 - 4.25, cz0 - 3.8, y, 1), m.markWhite, null, { noShadow: true });
    for (const xc of [L.roadHalf + 2, -L.roadHalf - 2]) for (let z = cz0 + 0.4; z < cz1 - 0.4; z += 1.0) B.add(Geo.flat(xc - 1.6, xc + 1.6, z, z + 0.55, y, 1), m.markWhite, null, { noShadow: true });
    for (const [x0, x1] of [[-600, -L.roadHalf - 4], [L.roadHalf + 4, 600]]) for (const dz of [-0.16, 0.16]) B.add(Geo.flat(x0, x1, L.crossZ + dz - 0.06, L.crossZ + dz + 0.06, y, 1), m.markYellow, null, { noShadow: true });
  }

  // the raised speed table (a raised crosswalk from the plaza to the far sidewalk)
  _table() {
    const T = NE_CITY.table, B = this.batch, m = this.m, X = LAYOUT.roadHalf, y = T.h;
    const brick = Mat.std('#8a5a48', { roughness: 0.9 });
    B.add(Geo.quad([-X, 0, T.zA], [X, 0, T.zA], [X, y, T.zB], [-X, y, T.zB], 0, 0, 7, 0.6), m.asphalt, null, { noShadow: true });
    B.add(Geo.quad([-X, y, T.zC], [X, y, T.zC], [X, 0, T.zD], [-X, 0, T.zD], 0, 0, 7, 0.6), m.asphalt, null, { noShadow: true });
    B.add(Geo.flat(-X, X, T.zC, T.zB, y, 2.0), brick, null, { noShadow: true });
    // crosswalk stripes on the plateau and white "shark teeth" on both ramps
    for (let x = -6.5; x < 6.6; x += 1.0) B.add(Geo.flat(x, x + 0.55, T.zC + 0.4, T.zB - 0.4, y + 0.004, 1), m.markWhite, null, { noShadow: true });
    for (const [za, zb, s] of [[T.zA, T.zB, 1], [T.zD, T.zC, -1]]) {
      for (let x = -6.6; x < 6.6; x += 0.9) {
        const k = 0.35, ya = 0.003 + y * (s > 0 ? k : 1 - k), yb = 0.003 + y * (s > 0 ? 1 - k : k);
        const z1 = za + (zb - za) * k, z2 = za + (zb - za) * (1 - k);
        B.add(Geo.quad([x, ya, z1], [x + 0.6, ya, z1], [x + 0.3, yb, z2], [x + 0.3, yb, z2]), m.markWhite, null, { noShadow: true });
      }
    }
    // the kerb-side ends of the table meet the sidewalks (end faces)
    for (const s of [-1, 1]) B.add(s > 0 ? Geo.quad([X, 0, T.zB], [X, 0, T.zC], [X, y, T.zC], [X, y, T.zB]) : Geo.quad([-X, 0, T.zC], [-X, 0, T.zB], [-X, y, T.zB], [-X, y, T.zC]), brick, null, { noShadow: true });
    // yellow-black warning bollards and a sign at the plaza end
    const sign = Tex.label([['SPEED', 40], ['TABLE', 40], ['15', 70]], { w: 192, h: 256, bg: '#f2c230', fg: '#1b1b1b', border: '#1b1b1b' });
    const sm = new THREE.MeshStandardMaterial({ map: sign, roughness: 0.6 });
    // (on the far kerb, facing your way, so it never stands between you and the table)
    B.add(new THREE.CylinderGeometry(0.035, 0.035, 2.5, 6), m.metal, Geo.matrix(-7.6, 0.15 + 1.25, -8.4));
    B.box(0.46, 0.62, 0.03, -7.6, 0.15 + 2.2, -8.38, sm, 0, { noShadow: true });
  }

  // the plaza: planters, benches, a basketball hoop, painted court lines, a low wall
  _plaza() {
    const P = NE_CITY.plaza, B = this.batch, m = this.m, h = LAYOUT.curbH;
    const paint = new THREE.MeshStandardMaterial({ color: '#d9d4c4', roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const court = new THREE.MeshStandardMaterial({ color: '#5e7a6a', roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    // a half court (green-grey surface + lines), hoop at its far end
    const C = NE_CITY.hoop, cx0 = 22.0, cx1 = 31.0, cz0 = C.z - 7.5, cz1 = C.z + 7.5;
    B.add(Geo.flat(cx0, cx1, cz0, cz1, h + 0.003, 2), court, null, { noShadow: true });
    for (const [a, b, c, d] of [[cx0, cx0 + 0.08, cz0, cz1], [cx0, cx1, cz0, cz0 + 0.08], [cx0, cx1, cz1 - 0.08, cz1], [26.2, 26.28, C.z - 2.4, C.z + 2.4], [26.2, cx1, C.z - 2.4, C.z - 2.32], [26.2, cx1, C.z + 2.32, C.z + 2.4]]) B.add(Geo.flat(a, b, c, d, h + 0.006, 1), paint, null, { noShadow: true });
    for (let i = 0; i <= 24; i++) { const a = -Math.PI / 2 + i / 24 * Math.PI, r = 6.6; const x = C.x - Math.cos(a) * r, z = C.z + Math.sin(a) * r; B.box(0.08, 0.004, 0.9, x, h + 0.007, z, paint, -a + Math.PI / 2, { noShadow: true }); }
    // the hoop: pole, arm, backboard, ring
    const white = Mat.std('#f2f0ea', { roughness: 0.5 }), orange = Mat.std('#d2541e', { roughness: 0.5, metalness: 0.3 });
    B.add(new THREE.CylinderGeometry(0.09, 0.11, 3.6, 10), m.metal, Geo.matrix(C.x + 0.9, h + 1.8, C.z));
    B.box(1.0, 0.12, 0.12, C.x + 0.45, h + 3.35, C.z, m.metal);
    B.box(0.05, 1.05, 1.8, C.x - 0.05, h + 3.45, C.z, white);
    B.box(0.06, 0.45, 0.6, C.x - 0.08, h + 3.3, C.z, Mat.std('#c0392b', { roughness: 0.5 }));
    B.add(new THREE.TorusGeometry(0.23, 0.018, 6, 18), orange, Geo.matrix(C.x - 0.33, h + 3.05, C.z, Math.PI / 2, 0, 0));
    // planters (concrete boxes with soil) around two trees, a low wall to the back
    for (const [x, z] of NE_CITY.trees) { B.box(2.2, 0.55, 2.2, x, h + 0.275, z, m.concrete); B.box(1.9, 0.02, 1.9, x, h + 0.56, z, m.soil, 0, { noShadow: true }); }
    B.box(0.4, 0.9, P.z1 - P.z0, P.x1 - 0.2, h + 0.45, (P.z0 + P.z1) / 2, m.concrete);
    // two plaza benches facing the trampoline
    this._bench(20.8, -6.0, Math.PI);
    this._bench(24.0, -27.8, 0.0);
    // a drinking fountain + bins
    B.add(new THREE.CylinderGeometry(0.22, 0.26, 0.95, 10), m.metal, Geo.matrix(14.2, h + 0.48, -27.5));
    B.add(new THREE.CylinderGeometry(0.3, 0.27, 0.95, 12), m.metalGreen, Geo.matrix(14.0, h + 0.475, -4.3));
    B.add(new THREE.CylinderGeometry(0.33, 0.33, 0.08, 12), m.metalGreen, Geo.matrix(14.0, h + 0.99, -4.3));
    // the café bench in front of the café (its two seat cushions are props): a dark steel frame and a back rest
    const N = NE_CITY.bench, frame = Mat.std('#2a2c2e', { roughness: 0.5, metalness: 0.5 }), wood = Mat.std('#7a5638', { roughness: 0.8 });
    B.box(0.5, 0.06, 2.2, N.x, h + 0.38, N.z, frame);
    for (const dz of [-1.0, 1.0]) { B.box(0.5, 0.38, 0.06, N.x, h + 0.19, N.z + dz, frame); B.box(0.06, 0.8, 0.06, N.x + 0.24, h + 0.78, N.z + dz, frame); }
    B.box(0.05, 0.42, 2.1, N.x + 0.24, h + 0.85, N.z, wood);
    // a café table and two chairs next to it
    B.add(new THREE.CylinderGeometry(0.38, 0.38, 0.04, 16), wood, Geo.matrix(11.2, h + 0.74, 5.4));
    B.add(new THREE.CylinderGeometry(0.04, 0.05, 0.72, 8), frame, Geo.matrix(11.2, h + 0.37, 5.4));
  }

  _buildings() {
    const L = LAYOUT, rng = this.rng.fork(1), P = NE_CITY.plaza;
    const cz0 = L.crossZ - L.crossHalf - 5.5, cz1 = L.crossZ + L.crossHalf + 5.5;
    const near = ['redbrick', 'tanbrick', 'cream', 'salmon', 'stone', 'whitebrick', 'sage', 'modern'], far = ['modern', 'glassblue', 'stone', 'cream', 'glassteal', 'tanbrick', 'redbrick', 'whitebrick'];
    const order = [0, 2, 9, 3, 6, 12, 7, 10, 5, 13, 8, 11, 4, 1];
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
    // your side: the café block runs up to the plaza; the plaza; then the corner block beyond the cross street
    row(1, L.zNear, 10.0, { fMin: 3, fMax: 6 });
    this._building({ side: 1, z0: P.z1, z1: 10.0, depth: 18, style: 'cream', floors: 4, shops: true, nextShop: () => SHOPS[0], rng });
    row(1, cz0, -380, { fMin: 4, fMax: 9 }); row(1, -380, -900, { fMin: 6, fMax: 14 });
    row(-1, L.zNear, cz1, { fMin: 3, fMax: 7 }); row(-1, cz0, -380, { fMin: 4, fMax: 10 }); row(-1, -380, -900, { fMin: 6, fMax: 14 });
    for (const s of [-1, 1]) { this._rowX(s, 34, 260, cz1, 1, rng); this._rowX(s, 34, 260, cz0, -1, rng); }
    // the buildings that close the plaza at its back (front faces toward the plaza, −X) and its side wall
    const backs = [['tanbrick', P.z1, -12.5, 5], ['redbrick', -12.5, -22.5, 6], ['whitebrick', -22.5, P.z0, 4]];
    for (const [st, z1, z0, fl] of backs) {
      const F = this.facades[st], H = 4.4 + fl * F.style.floorH, x0 = P.x1, x1 = P.x1 + 18;
      this.batch.add(Geo.boxSides(x0, x1, 0, 4.4, z0, z1, 3, 4.4), F.wall, null);
      this.batch.add(Geo.boxSides(x0, x1, 4.4, H, z0, z1, F.tileW, F.tileH), F.mat, null);
      this.batch.add(Geo.flat(x0, x1, z0, z1, H, 4), this.m.roof, null, { noShadow: true });
      this.batch.box(0.4, 0.5, z1 - z0 + 0.3, x0 - 0.15, H - 0.2, (z0 + z1) / 2, this.m.trim);
      this.batch.box(0.22, 0.24, z1 - z0, x0 - 0.11, 4.3, (z0 + z1) / 2, this.m.trim);
    }
    // shopfront glass in the plaza's back buildings (ground floor)
    for (const [z0, z1, si] of [[-3.5, -11.0, 2], [-14, -21.5, 7], [-24, -32, 11]]) {
      const xf = P.x1 - 0.03;
      this.batch.add(Geo.quad([xf, 0, z0], [xf, 0, z1], [xf, 4.2, z1], [xf, 4.2, z0]), this.shopMats[si], null, { noShadow: true });
    }
    for (const s of [-1, 1]) {
      let z = 120;
      while (z > -700) {
        const w = rng.range(14, 30), h = rng.range(26, 70) + (z < -200 ? 25 : 0);
        if (!(z - w < cz1 + 2 && z > cz0 - 2)) {
          const st = this.facades[rng.pick(far)], x0 = s > 0 ? 52 : -40 - rng.range(16, 26), x1 = s > 0 ? 52 + rng.range(16, 26) : -40;
          this.batch.add(Geo.boxSides(x0, x1, 0, h, z - w, z, st.tileW, st.tileH), st.mat, null);
          this.batch.add(Geo.flat(x0, x1, z - w, z, h, 4), this.m.roof, null, { noShadow: true });
        }
        z -= w + rng.range(0, 6);
      }
    }
  }

  _trees() {
    const rng = this.rng.fork(3), L = LAYOUT, cz0 = L.crossZ - L.crossHalf - 6, cz1 = L.crossZ + L.crossHalf + 6;
    for (let z = 30; z > -420; z -= 9.5) { if (z < cz1 && z > cz0) continue; if (Math.abs(z - L.busStop.z) < 4) continue; if (Math.abs(z - NE_CITY.bridge.z) < 5) continue; this._tree(-8.15, z + rng.range(-0.8, 0.8), rng, rng.range(0.8, 1.2)); }
    for (let z = 40; z > -420; z -= 9.5) { if (z < cz1 && z > cz0) continue; if (z < 24 && z > -60) continue; if (Math.abs(z - NE_CITY.bridge.z) < 5) continue; this._tree(8.15, z + rng.range(-0.8, 0.8), rng, rng.range(0.8, 1.2)); }
    for (const [x, z] of NE_CITY.trees) this._tree(x, z, rng, 1.25);
  }

  _streetFurniture() {
    const B = this.batch, m = this.m, L = LAYOUT, h = L.curbH;
    const cz0 = L.crossZ - L.crossHalf - 3, cz1 = L.crossZ + L.crossHalf + 3;
    for (let z = 40; z > -420; z -= 30) {
      if (!(z < cz1 && z > cz0) && !(z < 30 && z > -70) && Math.abs(z - NE_CITY.lamps[1][1]) > 3) this._streetLight(7.45, z, 1);
      const zl = z - 15;
      if (!(zl < cz1 && zl > cz0) && Math.abs(zl - NE_CITY.lamps[0][1]) > 3 && Math.abs(zl - NE_CITY.bridge.z) > 4) this._streetLight(-7.45, zl, -1);
    }
    for (const [x, z] of [[7.7, 17.5], [-7.7, -33], [7.7, -63], [-7.7, 14]]) {          // (none in the jogger's or the wheel shot's way)
      B.add(new THREE.CylinderGeometry(0.13, 0.15, 0.6, 10), m.red, Geo.matrix(x, h + 0.3, z));
      B.add(new THREE.SphereGeometry(0.14, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), m.red, Geo.matrix(x, h + 0.6, z));
    }
    for (const [x, z] of [[7.75, -33.6], [-7.8, -14], [-7.8, 8], [7.75, -62.5], [8.0, 4.0]]) {
      B.add(new THREE.CylinderGeometry(0.3, 0.27, 0.95, 12), m.metalGreen, Geo.matrix(x, h + 0.475, z));
      B.add(new THREE.CylinderGeometry(0.33, 0.33, 0.08, 12), m.metalGreen, Geo.matrix(x, h + 0.99, z));
    }
    this._busShelter(L.busStop.x, L.busStop.z);
    const nameA = Tex.label(['ELM AVE'], { w: 512, h: 112, font: 70, bg: '#1d6b3c', border: '#ffffff' }), sa = new THREE.MeshStandardMaterial({ map: nameA, roughness: 0.5 });
    for (const [x, z] of [[8.0, -36.2], [-8.0, -59.8]]) { B.add(new THREE.CylinderGeometry(0.04, 0.04, 3.3, 6), m.metal, Geo.matrix(x, h + 1.65, z)); B.box(1.2, 0.26, 0.02, x, h + 3.15, z, sa); }
    // newspaper boxes on the far sidewalk, a bike rack by the plaza
    ['#c0392b', '#2471a3', '#f1c40f'].forEach((c, i) => { B.box(0.45, 1.0, 0.45, -11.6, h + 0.5, -4.5 + i * 0.55, Mat.std(c, { roughness: 0.5 })); B.box(0.47, 0.03, 0.47, -11.6, h + 1.0, -4.5 + i * 0.55, m.metal); });
    for (let i = 0; i < 4; i++) B.add(new THREE.TorusGeometry(0.38, 0.03, 6, 12, Math.PI), m.galv, Geo.matrix(12.9, h, -30 + i * 0.8, 0, Math.PI / 2, 0));
    this._bench(-12.0, -8, Math.PI / 2);
  }

  // traffic signals: the base layout, except the mast that faces you is built from bending materials (its arm droops)
  _signals() {
    const L = LAYOUT, h = L.curbH, m = this.m, B = this.batch, cz0 = L.crossZ - L.crossHalf, cz1 = L.crossZ + L.crossHalf;
    this.signalHeads = [];
    const headGeo = new THREE.BoxGeometry(0.36, 1.0, 0.3), lampGeo = new THREE.CircleGeometry(0.1, 14), housing = Mat.std('#1d2124', { roughness: 0.5 });
    const mkHead = (x, y, z, ry, group, bend) => {
      const hm = bend ? this.bm.head : housing;
      B.add(headGeo, hm, Geo.matrix(x, y, z, 0, ry, 0));
      B.add(new THREE.BoxGeometry(0.55, 1.2, 0.03), hm, Geo.matrix(x - Math.sin(ry) * 0.17, y, z - Math.cos(ry) * 0.17, 0, ry, 0));
      const lamps = [];
      ['#ff2a1a', '#ffb000', '#22e07a'].forEach((c, i) => {
        const mat = new THREE.MeshBasicMaterial({ color: c, toneMapped: false }), mesh = new THREE.Mesh(lampGeo, mat);
        mesh.position.set(x + Math.sin(ry) * 0.155, y + 0.3 - i * 0.3, z + Math.cos(ry) * 0.155); mesh.rotation.y = ry;
        this.root.add(mesh); lamps.push({ mesh, mat, color: new THREE.Color(c), y0: mesh.position.y, x0: mesh.position.x, bend });
        B.add(new THREE.CylinderGeometry(0.13, 0.13, 0.16, 10, 1, true, -Math.PI / 2, Math.PI), hm, Geo.matrix(x + Math.sin(ry) * 0.23, y + 0.3 - i * 0.3 + 0.02, z + Math.cos(ry) * 0.23, Math.PI / 2, ry, 0));
      });
      this.signalHeads.push({ group, lamps });
    };
    const mast = (px, pz, armDir, armLen, ry, group, heads, bend) => {
      B.add(new THREE.CylinderGeometry(0.14, 0.19, 7.2, 10), m.metal, Geo.matrix(px, h + 3.6, pz));
      const am = bend ? this.bm.arm : m.metal;
      if (armDir === 'x') B.add(new THREE.CylinderGeometry(0.07, 0.1, armLen, 8, 12), am, Geo.matrix(px - Math.sign(px) * armLen / 2, h + 6.6, pz, 0, 0, Math.PI / 2));
      else B.add(new THREE.CylinderGeometry(0.07, 0.1, armLen, 8), m.metal, Geo.matrix(px, h + 6.6, pz - Math.sign(pz - L.crossZ) * armLen / 2, Math.PI / 2, 0, 0));
      for (const [hx, hz] of heads) mkHead(hx, h + 5.9, hz, ry, group, bend);
      mkHead(px + Math.sin(ry) * 0.3, h + 3.2, pz + Math.cos(ry) * 0.3, ry, group, false);
    };
    mast(7.9, cz0 - 1.2, 'x', 7.5, 0, 'avenue', [[4.0, cz0 - 1.2], [1.3, cz0 - 1.2]], true);
    mast(-7.9, cz1 + 1.2, 'x', 7.5, Math.PI, 'avenue', [[-4.0, cz1 + 1.2], [-1.3, cz1 + 1.2]], false);
    mast(-7.9 - 1.2, cz0 - 0.5, 'z', 7.0, Math.PI / 2, 'cross', [[-9.1, cz0 + 3.8], [-9.1, cz0 + 1.5]], false);
    mast(7.9 + 1.2, cz1 + 0.5, 'z', 7.0, -Math.PI / 2, 'cross', [[9.1, cz1 - 3.8], [9.1, cz1 - 1.5]], false);
  }

  // the steel footbridge: two stair towers on the sidewalks, a deck between them with Warren-truss sides and glass railings
  _bridge() {
    const Bd = NE_CITY.bridge, B = this.batch, bm = this.bm, m = this.m, z = Bd.z, w = Bd.w, y = Bd.deck, H = Bd.half;
    const seg = 22;
    // deck (subdivided so it can bend smoothly) and girders under it
    const deck = new THREE.BoxGeometry(2 * H + 0.4, 0.22, w, seg * 2, 1, 1); B.add(deck, bm.deck, Geo.matrix(0, y - 0.11, z));
    for (const dz of [-w / 2 + 0.12, w / 2 - 0.12]) B.add(new THREE.BoxGeometry(2 * H + 0.4, 0.55, 0.22, seg * 2, 1, 1), bm.steel, Geo.matrix(0, y - 0.48, z + dz));
    // truss sides: top chord, verticals and diagonals
    for (const dz of [-w / 2, w / 2]) {
      B.add(new THREE.BoxGeometry(2 * H + 0.4, 0.16, 0.16, seg * 2, 1, 1), bm.steel, Geo.matrix(0, y + 1.5, z + dz));
      const n = 10;
      for (let i = 0; i <= n; i++) {
        const x = -H + (2 * H) * i / n;
        B.add(new THREE.BoxGeometry(0.12, 1.5, 0.12, 1, 4, 1), bm.steelDark, Geo.matrix(x, y + 0.75, z + dz));
        if (i < n) { const xm = x + H / n, len = Math.hypot(2 * H / n, 1.5), ang = Math.atan2(1.5, 2 * H / n) * (i % 2 ? 1 : -1); B.add(new THREE.BoxGeometry(len, 0.1, 0.1, 6, 1, 1), bm.steel, Geo.matrix(xm, y + 0.75, z + dz, 0, 0, ang)); }
      }
      B.add(new THREE.BoxGeometry(2 * H, 1.05, 0.03, seg * 2, 1, 1), bm.glass, Geo.matrix(0, y + 0.6, z + dz * 0.94));
    }
    // a thin roof
    B.add(new THREE.BoxGeometry(2 * H + 0.4, 0.08, w + 0.5, seg * 2, 1, 1), bm.steelDark, Geo.matrix(0, y + 2.5, z));
    for (const dz of [-w / 2, w / 2]) for (let i = 0; i <= 5; i++) B.add(new THREE.BoxGeometry(0.08, 1.0, 0.08), bm.steelDark, Geo.matrix(-H + 2 * H * i / 5, y + 2.0, z + dz));
    // stair towers on both sidewalks (concrete cores with a glass front)
    for (const s of [-1, 1]) {
      const xc = s * (H + 1.2);
      B.box(2.4, y + 2.6, w + 2.4, xc, (y + 2.6) / 2, z, m.concrete);
      B.box(0.04, y + 1.4, w + 1.6, xc - s * 1.22, (y + 1.4) / 2 + 0.5, z, m.glass, 0, { noShadow: true });
      B.box(2.6, 0.2, w + 2.6, xc, y + 2.7, z, m.trimDark);
    }
  }

  // the two lamp posts that lean (built from the bending material)
  _lampsBend() {
    const B = this.batch, h = LAYOUT.curbH, bm = this.bm;
    for (const [x, z] of NE_CITY.lamps) {
      const side = Math.sign(x);
      B.add(new THREE.CylinderGeometry(0.07, 0.11, 8.0, 8, 10), bm.lamp, Geo.matrix(x, h + 4.0, z));
      B.add(new THREE.CylinderGeometry(0.16, 0.2, 0.5, 8), this.m.metal, Geo.matrix(x, h + 0.25, z));
      B.add(new THREE.CylinderGeometry(0.045, 0.05, 2.2, 6), bm.lamp, Geo.matrix(x - side * 1.0, h + 7.95, z, 0, 0, Math.PI / 2 - side * 0.12));
      B.box(0.75, 0.16, 0.36, x - side * 2.05, h + 7.95, z, bm.lamp);
      B.box(0.6, 0.03, 0.26, x - side * 2.05, h + 7.86, z, bm.lampWhite, 0, { noShadow: true });
    }
  }

  update(t) {
    // the clouds stream past in the time-lapse
    this.skyUniforms.uTime.value = t + 150 * neLapse(t);
    this._lapse(t);
    this.leanU.uLean.value = neTreeLean(t);
    if (this.dynamic.ad) this.dynamic.ad.emissiveIntensity = 0.6;
    const U = this.bendU, sag = neSag(t), droop = neDroop(t);
    U.uSag.value = sag; U.uDroop.value = droop; U.uLean.value = neLean(t);
    // signals: a normal cycle; the avenue turns red at 50.5 and the cross street green at 52.0 (the SUV runs the red)
    const av = t < 50.5 ? 2 : t < 51.7 ? 1 : 0, cr = t < 52.0 ? 0 : 2;
    const M = NE_CITY.mast;
    for (const hd of this.signalHeads || []) {
      const on = hd.group === 'avenue' ? av : cr;
      hd.lamps.forEach((l, i) => {
        l.mat.color.copy(l.color).multiplyScalar(i === on ? 3.0 : 0.05);
        if (l.bend) { const u = MathX.clamp((M.x - l.x0) / M.len, 0, 1.2); l.mesh.position.y = l.y0 - droop * u * u; }
      });
    }
  }
}
