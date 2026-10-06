/* =====================================================================
   SKY — the night sky over the town, drawn from the merger simulation.

   Every particle of both galaxies is seen from your place in the Milky
   Way. Its light is a soft gaussian whose angular size is its smoothing
   length over its distance (estimated each frame from the local density),
   with a peak that keeps surface brightness — so a galaxy looks as bright
   per patch of sky near or far, it just covers more sky as it comes.
     · near light (big kernels: the Milky Way around you) is splatted on
       the CPU into an all-sky map (an equirectangular grid with its poles
       on the east and west horizon, so the zenith is sharp), with the dust
       of the same particles as optical depth;
     · far light (small kernels: Andromeda, distant tails) is drawn as
       gaussian points on the GPU into a low-resolution HDR target, with
       far dust as a multiplicative pass;
     · a full-screen pass behind the world adds them up over a night-sky
       gradient (town glow, moonlit haze), dims everything through the
       near dust, and through the air toward the horizon (airmass);
     · a separate full-resolution star field: many faint stars, few bright,
       coloured by temperature, crowded toward the Milky Way's plane.
   The sky follows the camera, so it never shows parallax.
   ===================================================================== */

// galactic directions → your sky (x east, y up, −z north). Chosen (by search over the simulated path) so the galactic
// centre stands 50° up in the south and Andromeda first shows low in the north-north-west: it rises, crosses overhead in
// the first pass, sets in the south behind the Milky Way's core as they separate, comes back up from the north, and the
// merged galaxy settles high in the south.
function amSkyFrame() {
  const A = AM_SKY.gcAlt * Math.PI / 180, roll = AM_SKY.roll * Math.PI / 180;
  const g = new THREE.Vector3(0, Math.sin(A), Math.cos(A)), u = new THREE.Vector3(1, 0, 0), w = new THREE.Vector3().crossVectors(g, u);
  const e2 = u.clone().multiplyScalar(Math.cos(roll)).addScaledVector(w, Math.sin(roll)), e3 = new THREE.Vector3().crossVectors(g, e2);
  return new THREE.Matrix3().set(g.x, e2.x, e3.x, g.y, e2.y, e3.y, g.z, e2.z, e3.z);
}

const AM_SKY = {
  gcAlt: 50, roll: 130,
  K: 0.0021,                 // surface-brightness scale (per unit particle luminosity)
  split: [1.0, 1.5],         // kernel size (degrees) where light moves from the GPU points to the CPU map
  maxSigma: 22,              // biggest kernel (degrees); anything closer fades out (it would be a single resolved star)
  map: [512, 256],           // all-sky map (capture); half that when playing live
  rtScale: 1 / 3,            // far-light target vs the screen
  cell: 1.5,                 // density grid cell (kpc)
  hMin: [0.3, 0.25, 0.12, 0.9, 0.3, 0.12],    // per population (old, young, bulge, halo, dust, hii)
  hK: 1.45,                  // smoothing length vs the local spacing (big enough that neighbours overlap: smooth from inside)
  dustK: 0.055,              // dust optical depth per particle
  dustFade: [6, 14],
  shells: [1.2, 3.5],        // distance shells (kpc) for the near map        // near dust (degrees of kernel): full below, gone above — big close blobs would black out whole patches of sky
};

class AmSky {
  constructor(app, sim) {
    this.app = app; this.sim = sim;
    this.R = amSkyFrame();
    const N = sim.N;
    this.rel = new Float32Array(N * 3); this.h = new Float32Array(N); this.posT = new Float32Array(N * 3); this.amp = new Float32Array(N).fill(1);
    this.gain = [1, 1];
    this.brightBoost = 1; this.sf = 1; this.m31Boost = 1; this.dustAmp = 1; this.band = 1; this.warp = 0;
    this.mwNear = 0;           // weight of the Milky Way's own particles within 4 kpc of you (the analytic band stands in for them)
    this.m31Near = 1;          // …and of Andromeda's (when its stars sweep past you they are single stars, not a glow)
    this.arms = [1, 1];        // density-wave strength per galaxy (eased off once the tides have taken the discs apart)
    // emission vs dust lists
    const em = [], du = [];
    for (let i = 0; i < N; i++) (sim.pop[i] === AM_POP.dust ? du : em).push(i);
    this.em = Uint32Array.from(em); this.du = Uint32Array.from(du);
    const live = !CONFIG.captureMode;
    this.MW = live ? AM_SKY.map[0] / 2 : AM_SKY.map[0]; this.MH = live ? AM_SKY.map[1] / 2 : AM_SKY.map[1];
    // three distance shells (near / middle / far), each light (rgb) + the dust's optical depth (a): light is dimmed only by
    // the dust in front of it — from inside the disc most of the stars you see are nearer than most of the dust
    this.maps = [0, 1, 2].map(() => new Float32Array(this.MW * this.MH * 4));
    this.mapTex = this.maps.map((m) => { const t = new THREE.DataTexture(m, this.MW, this.MH, THREE.RGBAFormat, THREE.FloatType); t.magFilter = t.minFilter = THREE.NearestFilter; t.needsUpdate = true; return t; });
    // pixel directions of the map (x = east → latitude; φ in the north–zenith–south plane → longitude)
    this.pixDir = new Float32Array(this.MW * this.MH * 3);
    for (let j = 0; j < this.MH; j++) for (let i = 0; i < this.MW; i++) {
      const lat = ((j + 0.5) / this.MH - 0.5) * Math.PI, phi = ((i + 0.5) / this.MW) * 2 * Math.PI - Math.PI, k = (j * this.MW + i) * 3;
      this.pixDir[k] = Math.sin(lat); this.pixDir[k + 1] = Math.cos(lat) * Math.sin(phi); this.pixDir[k + 2] = -Math.cos(lat) * Math.cos(phi);
    }
    this._grid = new Int32Array(1 << 18); this._gridKey = new Int32Array(1 << 18);
    this._buildGrain();
    this._buildFar();
    this._buildComposite();
    this._buildStars();
  }

  // the grain of the Milky Way: star clouds and lanes much finer than the map, a fixed fbm in the same projection (the
  // galaxies' near light is multiplied by it; it's centred on 1)
  _buildGrain() {
    const W = 1024, H = 512, D = new Uint8Array(W * H * 4), hs = (x, y, z) => { const v = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return v - Math.floor(v); };
    const vn = (x, y, z) => { const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), sz = fz * fz * (3 - 2 * fz);
      const L = (a, b, t) => a + (b - a) * t; return L(L(L(hs(ix, iy, iz), hs(ix + 1, iy, iz), sx), L(hs(ix, iy + 1, iz), hs(ix + 1, iy + 1, iz), sx), sy), L(L(hs(ix, iy, iz + 1), hs(ix + 1, iy, iz + 1), sx), L(hs(ix, iy + 1, iz + 1), hs(ix + 1, iy + 1, iz + 1), sx), sy), sz); };
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const lat = ((j + 0.5) / H - 0.5) * Math.PI, phi = ((i + 0.5) / W) * 2 * Math.PI - Math.PI, x = Math.sin(lat), y = Math.cos(lat) * Math.sin(phi), z = -Math.cos(lat) * Math.cos(phi);
      let f = 0, a = 0.5, k = 6;
      for (let o = 0; o < 5; o++) { f += a * vn(x * k + 11, y * k + 23, z * k + 37); a *= 0.55; k *= 2.1; }
      const lane = Math.abs(vn(x * 9 + 5, y * 9 + 1, z * 9 + 3) - 0.5) * 2;      // thin dark filaments where the noise crosses its middle
      const v = Math.max(0, Math.min(1, (f - 0.12) * 1.55)) * (0.55 + 0.45 * Math.min(1, lane * 3));
      D[(j * W + i) * 4] = Math.round(v * 255); D[(j * W + i) * 4 + 3] = 255;
    }
    this.grainTex = new THREE.DataTexture(D, W, H, THREE.RGBAFormat); this.grainTex.magFilter = this.grainTex.minFilter = THREE.LinearFilter; this.grainTex.wrapS = THREE.RepeatWrapping; this.grainTex.needsUpdate = true;
  }

  /* ---------------- far light: gaussian points into a low-res HDR target ---------------- */
  _buildFar() {
    const sim = this.sim, R = this.app.renderer;
    this.farScene = new THREE.Scene();
    this.farCam = new THREE.PerspectiveCamera(60, 9 / 16, 0.01, 1e6);
    this.farRT = new THREE.WebGLRenderTarget(64, 64, { type: THREE.HalfFloatType, depthBuffer: false });
    const mk = (idx, dust) => {
      const n = idx.length, g = new THREE.BufferGeometry();
      const pos = new Float32Array(n * 3), h = new Float32Array(n), col = new Float32Array(n * 3), pop = new Float32Array(n), amp = new Float32Array(n).fill(1);
      for (let k = 0; k < n; k++) { const i = idx[k]; for (let c = 0; c < 3; c++) col[k * 3 + c] = sim.col[i * 3 + c] * sim.lum[i]; pop[k] = sim.pop[i]; }
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
      g.setAttribute('aH', new THREE.BufferAttribute(h, 1).setUsage(THREE.DynamicDrawUsage));
      g.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
      g.setAttribute('aPop', new THREE.BufferAttribute(pop, 1));
      g.setAttribute('aAmp', new THREE.BufferAttribute(amp, 1).setUsage(THREE.DynamicDrawUsage));
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e7);
      const m = new THREE.ShaderMaterial({
        uniforms: { uPixAng: { value: 0.002 }, uK: { value: AM_SKY.K }, uSplit: { value: new THREE.Vector2(...AM_SKY.split.map((d) => d * Math.PI / 180)) }, uSf: { value: 1 }, uDustK: { value: AM_SKY.dustK } },
        vertexShader: /* glsl */`
          attribute float aH; attribute vec3 aCol; attribute float aPop; attribute float aAmp;
          uniform float uPixAng, uK, uSf, uDustK; uniform vec2 uSplit;
          varying vec3 vCol; varying float vPeak;
          void main(){
            float d = length(position);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            float sig = 0.5 * aH / max(d, 1e-4);                 // angular sigma (radians)
            float w = 1.0 - smoothstep(uSplit.x, uSplit.y, sig);  // (bigger kernels go to the all-sky map)
            float sp = sig / uPixAng, se = max(sp, 0.75);
            float L = aAmp;                                        // (spiral density wave, star formation, per-galaxy gain — from the CPU)
            #ifdef DUST
              vPeak = w * min(0.85, L * uDustK / (0.5 * 3.14159 * aH * aH) * (sp * sp) / (se * se));
            #else
              // flux-conserving gaussian: peak = K·L·surface-brightness (resolved) · (σ/σeff)² when unresolved
              vPeak = w * uK * L / (0.5 * 3.14159 * aH * aH) * (sp * sp) / (se * se);
            #endif
            vCol = aCol;
            gl_PointSize = w > 0.001 && mv.z < 0.0 ? min(se * 5.0, 180.0) : 0.0;
          }`,
        fragmentShader: /* glsl */`
          varying vec3 vCol; varying float vPeak;
          void main(){
            vec2 q = gl_PointCoord * 2.0 - 1.0; float r2 = dot(q, q);
            if (r2 > 1.0) discard;
            float g = exp(-r2 * 3.125);                 // (5σ across: r = 2.5σ at the edge)
            #ifdef DUST
              gl_FragColor = vec4(vec3(1.0 - vPeak * g), 1.0);
            #else
              gl_FragColor = vec4(vCol * vPeak * g, 1.0);
            #endif
          }`,
        defines: dust ? { DUST: 1 } : {},
        transparent: true, depthTest: false, depthWrite: false,
        blending: dust ? THREE.CustomBlending : THREE.AdditiveBlending,
      });
      if (dust) { m.blendEquation = THREE.AddEquation; m.blendSrc = THREE.ZeroFactor; m.blendDst = THREE.SrcColorFactor; }
      const p = new THREE.Points(g, m); p.frustumCulled = false; p.renderOrder = dust ? 2 : 1;
      this.farScene.add(p);
      return { p, g, m, idx };
    };
    this.farEm = mk(this.em, false);
    this.farDu = mk(this.du, true);
    // the two nuclei: a tight, very bright core each (the bulge particles alone are too coarse for a point-like centre)
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3).setUsage(THREE.DynamicDrawUsage));
    cg.setAttribute('aCol', new THREE.BufferAttribute(new Float32Array([1, 0.85, 0.62, 1, 0.83, 0.6]), 3));
    cg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e7);
    this.coreMat = new THREE.ShaderMaterial({
      uniforms: { uPixAng: { value: 0.002 }, uBright: { value: 1 } },
      vertexShader: /* glsl */`
        attribute vec3 aCol; uniform float uPixAng, uBright; varying vec3 vCol; varying float vS;
        void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; float d = length(position);
          float sp = max(0.9, 0.45 / d / uPixAng); vS = sp; vCol = aCol * uBright * 0.35 / max(1.0, sp * sp * 0.08);
          gl_PointSize = mv.z < 0.0 ? min(sp * 6.0, 220.0) : 0.0; }`,
      fragmentShader: /* glsl */`varying vec3 vCol; varying float vS; void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r2 = dot(q, q); if (r2 > 1.0) discard; gl_FragColor = vec4(vCol * (exp(-r2 * 4.5) + 0.25 * exp(-r2 * 18.0) * 4.0), 1.0); }`,
      transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.cores = new THREE.Points(cg, this.coreMat); this.cores.frustumCulled = false; this.cores.renderOrder = 1.5;
    this.farScene.add(this.cores);
  }

  /* ---------------- the sky behind the world ---------------- */
  _buildComposite() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    this.compMat = new THREE.ShaderMaterial({
      uniforms: {
        tFar: { value: this.farRT.texture }, tGrain: { value: this.grainTex }, uGrain: { value: 0.75 }, tMap0: { value: this.mapTex[0] }, tMap1: { value: this.mapTex[1] }, tMap2: { value: this.mapTex[2] }, uMapSize: { value: new THREE.Vector2(this.MW, this.MH) },
        uCamRot: { value: new THREE.Matrix3() }, uTanHalf: { value: 0.5 }, uAspect: { value: 9 / 16 },
        uNight: { value: 1 }, uGlow: { value: new THREE.Vector3() }, uMoonDir: { value: new THREE.Vector3(-0.6, 0.25, 0.5).normalize() }, uMoon: { value: 1 },
        uTownAz: { value: 0 }, uExt: { value: 0.33 },
        uRgal: { value: new THREE.Matrix3() }, uBand: { value: 1 }, uWarp: { value: 0 }, uBandK: { value: 0.11 }, uBulge: { value: 1 },
      },
      vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.9999, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform sampler2D tFar, tMap0, tMap1, tMap2, tGrain; uniform vec2 uMapSize; uniform float uGrain; uniform mat3 uCamRot; uniform float uTanHalf, uAspect, uNight, uMoon, uTownAz, uExt;
        uniform vec3 uGlow, uMoonDir; uniform mat3 uRgal; uniform float uBand, uWarp, uBandK, uBulge; varying vec2 vUv;
        // the intact Milky Way seen from inside (until the merger tears it up and the simulated stars take over): a thin
        // disc thickening and brightening toward the centre, the bulge, the Great Rift and dust clouds, star clouds
        float wrapA(float a){ return mod(a + 3.14159265, 6.2831853) - 3.14159265; }
        vec4 band(vec3 d, float gr, float gr2){
          vec3 g = uRgal * d;
          float l = atan(g.y, g.x), b = asin(clamp(g.z, -1.0, 1.0));
          b -= uWarp * (0.35 * sin(l - 1.2) + 0.12 * sin(2.0 * l + 0.7));             // (the tide of Andromeda warping our disc)
          float gc = exp(-pow(l / 1.05, 2.0)), bw = radians(2.6) + radians(5.5) * gc;
          float disc = exp(-abs(b) / bw) * (0.28 + 0.72 * gc) + 0.18 * exp(-abs(b) / radians(14.0)) * (0.4 + 0.6 * gc);
          float bulge = exp(-(l * l + pow(b / 0.8, 2.0)) / pow(radians(11.0), 2.0));
          float clouds = 0.45 + 1.2 * gr;
          vec3 c = (vec3(0.82, 0.86, 1.0) * disc * clouds + vec3(1.0, 0.8, 0.56) * bulge * 2.2 * uBulge) * uBandK;   // (the bulge hands over to the simulated one)
          // dust: the rift along the plane (strongest from Cygnus to Sagittarius), and clumpy clouds near it
          float rl = smoothstep(radians(95.0), radians(10.0), abs(wrapA(l - radians(25.0))));
          float tau = 2.4 * exp(-abs(b - radians(0.6) * sin(l * 3.0)) / radians(1.5)) * rl * (0.35 + 1.1 * gr2);
          tau += 0.9 * exp(-abs(b) / radians(4.5)) * smoothstep(0.45, 0.75, gr2) * (0.4 + 0.6 * gc);
          return vec4(c, tau);
        }
        vec2 mA, mB, mF;
        void mapUV(vec3 d){
          float lat = asin(clamp(d.x, -1.0, 1.0)), phi = atan(d.y, -d.z);
          vec2 p = vec2((phi + 3.14159265) / 6.2831853 * uMapSize.x - 0.5, (lat / 3.14159265 + 0.5) * uMapSize.y - 0.5);
          mF = fract(p); vec2 i0 = floor(p);
          mA = (vec2(mod(i0.x, uMapSize.x), clamp(i0.y, 0.0, uMapSize.y - 1.0)) + 0.5) / uMapSize;
          mB = (vec2(mod(i0.x + 1.0, uMapSize.x), clamp(i0.y + 1.0, 0.0, uMapSize.y - 1.0)) + 0.5) / uMapSize;
        }
        vec4 bil(sampler2D T){
          vec4 c00 = texture2D(T, mA), c10 = texture2D(T, vec2(mB.x, mA.y)), c01 = texture2D(T, vec2(mA.x, mB.y)), c11 = texture2D(T, mB);
          return mix(mix(c00, c10, mF.x), mix(c01, c11, mF.x), mF.y);
        }
        void main(){
          vec2 ndc = vUv * 2.0 - 1.0;
          vec3 d = normalize(uCamRot * vec3(ndc.x * uTanHalf * uAspect, ndc.y * uTanHalf, -1.0));
          float alt = d.y, sa = max(alt, 0.0);
          // the night sky: deep blue overhead, paler toward the horizon, a warm glow over the town, moonlit haze
          vec3 sky = mix(vec3(0.016, 0.026, 0.05), vec3(0.05, 0.065, 0.095), pow(1.0 - sa, 3.0)) * uNight;
          float az = atan(d.x, -d.z), town = exp(-pow(abs(mod(az - uTownAz + 3.14159, 6.28318) - 3.14159) / 1.1, 2.0));
          sky += vec3(0.11, 0.062, 0.032) * town * exp(-sa * 9.0) * uNight;
          float md = max(dot(d, uMoonDir), 0.0);
          sky += vec3(0.05, 0.06, 0.085) * pow(md, 6.0) * uMoon + vec3(0.6, 0.62, 0.66) * smoothstep(0.99985, 0.99993, md) * uMoon;
          sky += uGlow * (0.55 + 0.45 * pow(1.0 - sa, 2.0));     // galaxy light scattered by the air
          // the galaxies: near light (map) and far light (target), both seen through the near dust
          mapUV(d);
          vec4 m0 = bil(tMap0), m1 = bil(tMap1), m2 = bil(tMap2);
          vec2 gu = vec2((atan(d.y, -d.z) + 3.14159265) / 6.2831853, asin(clamp(d.x, -1.0, 1.0)) / 3.14159265 + 0.5);
          float gr = mix(1.0, 0.25 + 1.5 * texture2D(tGrain, gu).r, uGrain);       // (star clouds and lanes in the near light)
          m0.rgb *= gr; m1.rgb *= mix(1.0, gr, 0.7);
          float gr2 = texture2D(tGrain, gu * vec2(2.0, 1.6) + vec2(0.37, 0.11)).r;
          vec4 bd = band(d, texture2D(tGrain, gu).r, gr2) * vec4(uBand, uBand, uBand, uBand);
          vec3 gal = m0.rgb * exp(-0.5 * m0.a) + m1.rgb * exp(-m0.a - 0.5 * m1.a) + (m2.rgb * exp(-0.5 * m2.a) + texture2D(tFar, vUv).rgb) * exp(-m0.a - m1.a);
          gal = bd.rgb * exp(-0.5 * bd.a) + gal * exp(-bd.a);
          // through the air: more of it toward the horizon (dimmer, warmer, lower contrast)
          float airmass = 1.0 / (sa + 0.025 * exp(-11.0 * sa) + 0.02);
          vec3 ext = exp(-uExt * (airmass - 1.0) * vec3(0.8, 1.0, 1.3));
          vec3 col = sky + gal * ext;
          col = mix(col, vec3(0.06, 0.055, 0.06) * uNight + uGlow * 0.6, smoothstep(0.0, -0.08, alt));    // (below the horizon: haze)
          gl_FragColor = vec4(col, 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });
    this.comp = new THREE.Mesh(g, this.compMat); this.comp.frustumCulled = false; this.comp.renderOrder = -1000;
    this.app.scene.add(this.comp);
  }

  /* ---------------- the star field ---------------- */
  _buildStars() {
    const rng = new RNG(CONFIG.seed + 77), N = 26000, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), mag = new Float32Array(N), R = this.R, v = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      // galactic latitude crowded toward the plane (a steep exponential for most, uniform for the rest)
      const l = rng.range(0, Math.PI * 2), b = rng.chance(0.72) ? Math.sign(rng.range(-1, 1)) * -Math.log(1 - rng.range(0, 0.96)) * 0.11 : Math.asin(rng.range(-1, 1));
      v.set(Math.cos(b) * Math.cos(l), Math.cos(b) * Math.sin(l), Math.sin(b)).applyMatrix3(R);
      pos.set([v.x * 1000, v.y * 1000, v.z * 1000], i * 3);
      // magnitudes: a power law (many faint, few bright)
      mag[i] = 6.8 - 6.5 * Math.pow(rng.next(), 0.22) * Math.pow(rng.next(), 0.35);
      const T = rng.next(), c = T < 0.12 ? [0.7, 0.8, 1.0] : T < 0.45 ? [0.95, 0.96, 1.0] : T < 0.75 ? [1.0, 0.94, 0.82] : T < 0.93 ? [1.0, 0.82, 0.62] : [1.0, 0.68, 0.48];
      col.set(c, i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aCol', new THREE.BufferAttribute(col, 3)); g.setAttribute('aMag', new THREE.BufferAttribute(mag, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    this.starMat = new THREE.ShaderMaterial({
      uniforms: { uPx: { value: 1 }, uFade: { value: 1 }, uExt: { value: 0.33 }, uTime: { value: 0 } },
      vertexShader: /* glsl */`
        attribute vec3 aCol; attribute float aMag; uniform float uPx, uFade, uExt, uTime; varying vec3 vCol;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_Position.z = gl_Position.w * 0.99999;
          vec3 d = normalize(position); float sa = max(d.y, 0.0), airmass = 1.0 / (sa + 0.025 * exp(-11.0 * sa) + 0.02);
          float f = pow(10.0, -0.4 * (aMag - 1.0)) * exp(-uExt * 1.6 * (airmass - 1.0)) * uFade;
          f *= 0.85 + 0.15 * sin(uTime * (3.0 + fract(aMag * 13.7) * 5.0) + aMag * 40.0);        // (a little scintillation)
          float s = clamp(1.1 + 1.6 * log(1.0 + f * 3.0), 1.0, 4.5) * uPx;
          vCol = aCol * min(f * 2.4, 3.0) / max(1.0, s * s / (uPx * uPx * 2.2)) * smoothstep(-0.02, 0.04, d.y);
          gl_PointSize = s;
        }`,
      fragmentShader: /* glsl */`varying vec3 vCol; void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r2 = dot(q, q); if (r2 > 1.0) discard; gl_FragColor = vec4(vCol * exp(-r2 * 2.5), 1.0); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.stars = new THREE.Points(g, this.starMat); this.stars.frustumCulled = false; this.stars.renderOrder = -900;
    this.app.scene.add(this.stars);
  }

  /* ---------------- per frame ---------------- */
  // density → smoothing length per particle (a hashed grid of the emission and dust particles)
  _smoothing(P) {
    const N = this.sim.N, s = AM_SKY.cell, G = this._grid, Kk = this._gridKey, M = G.length - 1, pop = this.sim.pop, h = this.h, hm = AM_SKY.hMin;
    Kk.fill(-2147483648); G.fill(0);
    const slot = (k) => { let i = (k >>> 0) & M; while (Kk[i] !== k && Kk[i] !== -2147483648) i = (i + 1) & M; return i; };
    const keys = this._keys || (this._keys = new Int32Array(N));
    const cx = this._cx || (this._cx = new Int32Array(N * 3));
    for (let i = 0, j = 0; i < N; i++, j += 3) { cx[j] = Math.floor(P[j] / s); cx[j + 1] = Math.floor(P[j + 1] / s); cx[j + 2] = Math.floor(P[j + 2] / s); const k = (cx[j] * 73856093) ^ (cx[j + 1] * 19349663) ^ (cx[j + 2] * 83492791); keys[i] = k; const q = slot(k); Kk[q] = k; G[q]++; }
    // (count over the 3×3×3 block of cells around each particle: a steadier density than one cell alone)
    const look = (k) => { let i = (k >>> 0) & M; while (Kk[i] !== k) { if (Kk[i] === -2147483648) return 0; i = (i + 1) & M; } return G[i]; };
    for (let i = 0, j = 0; i < N; i++, j += 3) {
      let n = 0; const x = cx[j], y = cx[j + 1], z = cx[j + 2];
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) n += look(((x + a) * 73856093) ^ ((y + b) * 19349663) ^ ((z + c) * 83492791));
      h[i] = Math.max(hm[pop[i]], Math.min(6, AM_SKY.hK * 3 * s / Math.cbrt(n)));
    }
  }

  update(t, simT, camera) {
    const sim = this.sim, N = sim.N, P = this.posT, R = this.R.elements, rel = this.rel, h = this.h;
    sim.positionsAt(simT, P);
    this._smoothing(P);
    const o = sim.observer(simT);
    for (let i = 0, j = 0; i < N; i++, j += 3) {
      const x = P[j] - o[0], y = P[j + 1] - o[1], z = P[j + 2] - o[2];
      rel[j] = R[0] * x + R[3] * y + R[6] * z; rel[j + 1] = R[1] * x + R[4] * y + R[7] * z; rel[j + 2] = R[2] * x + R[5] * y + R[8] * z;
    }
    this._wave(P, simT);
    this._splatMap();
    // far points
    for (const F of [this.farEm, this.farDu]) {
      const pa = F.g.attributes.position.array, ha = F.g.attributes.aH.array, idx = F.idx;
      for (let k = 0; k < idx.length; k++) { const i = idx[k]; pa[k * 3] = rel[i * 3]; pa[k * 3 + 1] = rel[i * 3 + 1]; pa[k * 3 + 2] = rel[i * 3 + 2]; ha[k] = h[i]; }
      const aa = F.g.attributes.aAmp.array, amp = this.amp, da = F === this.farDu ? this.dustAmp : 1; for (let k = 0; k < idx.length; k++) aa[k] = amp[idx[k]] * da;
      F.g.attributes.position.needsUpdate = true; F.g.attributes.aH.needsUpdate = true; F.g.attributes.aAmp.needsUpdate = true;
    }
    // nuclei
    const cp = this.cores.geometry.attributes.position.array;
    for (let g = 0; g < 2; g++) { const c = sim.centre(g, simT), x = c[0] - o[0], y = c[1] - o[1], z = c[2] - o[2]; cp[g * 3] = R[0] * x + R[3] * y + R[6] * z; cp[g * 3 + 1] = R[1] * x + R[4] * y + R[7] * z; cp[g * 3 + 2] = R[2] * x + R[5] * y + R[8] * z; }
    this.cores.geometry.attributes.position.needsUpdate = true;
    this.starMat.uniforms.uTime.value = t;
  }

  // spiral arms as a density wave: each particle's brightness (young stars, HII regions, a little for the old disc) and
  // opacity (dust) depends on where it is against a slowly turning spiral pattern in its own galaxy's disc — so the arms
  // stay arms instead of winding up. Particles thrown out of their disc (tails, bridges, the merged spheroid) shine evenly:
  // star formation in the tidal debris. Times the star-formation boost and each galaxy's gain.
  _wave(P, t) {
    const sim = this.sim, N = sim.N, pop = sim.pop, gal = sim.gal, amp = this.amp, F = sim.frames, S = sim.S;
    const C = [sim.centre(0, t), sim.centre(1, t)], Gs = [S.MW, S.M31];
    const hsh = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
    const vn = (x, y) => { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      return (hsh(ix, iy) * (1 - sx) + hsh(ix + 1, iy) * sx) * (1 - sy) + (hsh(ix, iy + 1) * (1 - sx) + hsh(ix + 1, iy + 1) * sx) * sy; };
    for (let i = 0, j = 0; i < N; i++, j += 3) {
      const p = pop[i], g = gal[i];
      let a = this.gain[g];
      if (p === AM_POP.young || p === AM_POP.hii || p === AM_POP.dust || p === AM_POP.old) {
        const G = Gs[g], f = F[g], c = C[g], x = P[j] - c[0], y = P[j + 1] - c[1], z = P[j + 2] - c[2];
        const zd = x * f.n[0] + y * f.n[1] + z * f.n[2], xu = x * f.u[0] + y * f.u[1] + z * f.u[2], xw = x * f.w[0] + y * f.w[1] + z * f.w[2];
        const R = Math.hypot(xu, xw), th = Math.atan2(xw, xu) - G.omegaP * t;
        const inDisc = Math.max(0, Math.min(1, (2.2 - Math.abs(zd)) / 1.4)) * Math.max(0, Math.min(1, (G.Rmax * 1.35 - R) / (G.Rmax * 0.3)));
        if (inDisc > 0) {
          const ph = G.arms * (th + Math.log(Math.max(R, 0.6) / 4) / Math.tan(G.pitch * Math.PI / 180));
          const fl = 0.55 + 0.9 * vn(R * 0.55, th * 2.2 + 7) * vn(R * 1.3 + 3, th * 4.5);
          let m;
          if (p === AM_POP.young) { const cr = 0.5 + 0.5 * Math.cos(ph); m = (0.12 + 2.2 * cr * cr * cr * cr) * fl; }
          else if (p === AM_POP.hii) { const cr = 0.5 + 0.5 * Math.cos(ph - 0.15); m = 3.0 * Math.pow(cr, 10) * fl; }
          else if (p === AM_POP.dust) { const cr = 0.5 + 0.5 * Math.cos(ph + 0.55); m = (0.2 + 1.9 * cr * cr * cr) * (0.6 + 0.8 * fl); }
          else { const cr = 0.5 + 0.5 * Math.cos(ph); m = 1 + G.armA * 0.5 * (cr - 0.5); }
          a *= 1 + (m - 1) * inDisc * this.arms[g];
        }
      }
      if (p === AM_POP.young || p === AM_POP.hii) a *= this.sf;
      // the Milky Way close around you is drawn by the analytic band while it lasts; its far side, bulge and tails are particles
      // (and stars that pass close to you are single stars — the star field — rather than a glow)
      const nw = g === 0 ? this.mwNear : this.m31Near;
      if (nw < 1) { const rl = this.rel, d = Math.sqrt(rl[j] * rl[j] + rl[j + 1] * rl[j + 1] + rl[j + 2] * rl[j + 2]); const f = Math.max(0, Math.min(1, (d - 3) / 2)); a *= nw + (1 - nw) * f * f; }
      amp[i] = a;
    }
  }

  // the near light and dust into the all-sky map (rgb = light, a = optical depth)
  _splatMap() {
    const sim = this.sim, rel = this.rel, h = this.h, MS = this.maps, PD = this.pixDir, W = this.MW, H = this.MH, pop = sim.pop, col = sim.col, lum = sim.lum;
    for (const m of MS) m.fill(0);
    const s0 = AM_SKY.split[0] * Math.PI / 180, s1 = AM_SKY.split[1] * Math.PI / 180, smax = AM_SKY.maxSigma * Math.PI / 180, K = AM_SKY.K, dK = AM_SKY.dustK;
    const dnear = AM_SKY.dustFade[0] * Math.PI / 180, dfar = AM_SKY.dustFade[1] * Math.PI / 180;
    const dLat = Math.PI / H, dPhi = 2 * Math.PI / W;
    for (let i = 0, j = 0; i < sim.N; i++, j += 3) {
      const x = rel[j], y = rel[j + 1], z = rel[j + 2], d = Math.sqrt(x * x + y * y + z * z), sig = 0.5 * h[i] / d;
      if (sig < s0 || sig > smax * 1.6) continue;
      let w = sig >= s1 ? 1 : (sig - s0) / (s1 - s0); w = w * w * (3 - 2 * w);
      if (sig > smax) { const f = (smax * 1.6 - sig) / (smax * 0.6); w *= f * f; }
      const dx = x / d, dy = y / d, dz = z / d, isDust = pop[i] === AM_POP.dust, inv = 1 / (sig * sig), M = MS[d < AM_SKY.shells[0] ? 0 : d < AM_SKY.shells[1] ? 1 : 2];
      if (isDust) { if (sig > dfar) continue; if (sig > dnear) { const f = (dfar - sig) / (dfar - dnear); w *= f * f; } w *= this.dustAmp; }
      const L = this.amp[i];
      const peak = w * (isDust ? Math.min(0.85, L * dK / (0.5 * Math.PI * h[i] * h[i])) : K * lum[i] * L / (0.5 * Math.PI * h[i] * h[i]));
      const cr = col[j] * peak, cg = col[j + 1] * peak, cb = col[j + 2] * peak;
      const lat = Math.asin(Math.max(-1, Math.min(1, dx))), phi = Math.atan2(dy, -dz);
      const r = 2.6 * sig, j0 = Math.max(0, Math.floor((lat - r + Math.PI / 2) / dLat)), j1 = Math.min(H - 1, Math.floor((lat + r + Math.PI / 2) / dLat));
      const cl = Math.max(0.05, Math.cos(Math.min(Math.PI / 2, Math.abs(lat) + r))), rp = Math.min(Math.PI, r / cl);
      const i0 = Math.floor((phi - rp + Math.PI) / dPhi), i1 = Math.floor((phi + rp + Math.PI) / dPhi), lim = 3.4;
      for (let jj = j0; jj <= j1; jj++) {
        const row = jj * W;
        for (let ii = i0; ii <= i1; ii++) {
          const ic = ((ii % W) + W) % W, q = row + ic, k3 = q * 3;
          const e = (1 - (PD[k3] * dx + PD[k3 + 1] * dy + PD[k3 + 2] * dz)) * inv;   // ≈ θ²/2σ²
          if (e > lim) continue;
          const g = Math.exp(-e), k4 = q * 4;
          if (isDust) M[k4 + 3] += peak * g; else { M[k4] += cr * g; M[k4 + 1] += cg * g; M[k4 + 2] += cb * g; }
        }
      }
    }
    for (const t of this.mapTex) t.needsUpdate = true;
  }

  // render the far light for this camera (call after the camera is final for the frame)
  render(camera) {
    const R = this.app.renderer, size = R.getDrawingBufferSize(this._sz || (this._sz = new THREE.Vector2()));
    const w = Math.max(32, Math.round(size.x * AM_SKY.rtScale)), hgt = Math.max(32, Math.round(size.y * AM_SKY.rtScale));
    if (this.farRT.width !== w || this.farRT.height !== hgt) this.farRT.setSize(w, hgt);
    const fc = this.farCam; fc.quaternion.copy(camera.quaternion); fc.fov = camera.fov; fc.aspect = camera.aspect; fc.updateProjectionMatrix(); fc.updateMatrixWorld(true);
    const pix = 2 * Math.tan(MathX.deg(camera.fov) / 2) / hgt;
    this.farEm.m.uniforms.uPixAng.value = pix; this.farDu.m.uniforms.uPixAng.value = pix; this.coreMat.uniforms.uPixAng.value = pix;
    const prev = R.getRenderTarget(), ac = R.autoClear;
    R.setRenderTarget(this.farRT); R.setClearColor(0x000000, 1); R.autoClear = true; R.render(this.farScene, fc);
    R.setRenderTarget(prev); R.autoClear = ac;
    // the composite's view
    const U = this.compMat.uniforms;
    U.uCamRot.value.setFromMatrix4(camera.matrixWorld); U.uTanHalf.value = Math.tan(MathX.deg(camera.fov) / 2); U.uAspect.value = camera.aspect;
    U.uRgal.value.copy(this.R).transpose(); U.uBand.value = this.band; U.uWarp.value = this.warp;
    this.starMat.uniforms.uPx.value = size.y / 1920 * 2.0;
  }
}
