/* =====================================================================
   THE MOON — the hero asset, and the night sky behind it.

   The lunar surface is generated (no image files): an equirectangular map
   of selenographic latitude/longitude is baked on the GPU once at load —
     · the maria where they really are (Imbrium, Serenitatis, Tranquillitatis,
       Crisium, Fecunditatis, Nectaris, Nubium, Humorum, Frigoris, Oceanus
       Procellarum …), with noisy shores, wrinkle ridges and their own tints;
     · the named craters (Tycho and Copernicus with their bright ray systems,
       Kepler, Aristarchus, Plato's dark floor, Ptolemaeus, Clavius …) and the
       Imbrium basin's mountain rim (Apennines, Caucasus, Alps, Carpathians);
     · thousands of random craters in six size octaves (fewer on the young maria);
   into albedo + height (km), then a normal map from the height.
   The realtime shader adds finer crater octaves as the Moon comes close, lights it
   with the Sun (Lommel–Seeliger photometry: the flat-looking disc and sharp
   terminator), marches shadows across the terminator from the height map, adds
   faint earthshine on the night side, and dims/reddens it through the air near
   the horizon. It reflects sunlight; it never glows.

   The Moon is drawn camera-relative (a sphere at a fixed distance in the
   direction of the Moon, sized to its true angular radius), behind the world:
   buildings never parallax against it, so it reads as astronomically far away.
   Selenographic frame: +X lunar east (right, as seen from Earth), +Y north, +Z
   toward Earth (the near side's centre, 0°N 0°E).
   ===================================================================== */

const MOON_R_KM = 1737.4, EARTH_R_KM = 6371;

// maria: [lat, lon, angular radius (deg), tone 0..1 (darker = higher), tint index]
// tints: 0 neutral grey-brown, 1 bluish (Tranquillitatis), 2 brownish, 3 dark
const MOON_MARIA = [
  [32.8, -15.6, 17.5, 0.85, 0], [37.5, -24.0, 9.0, 0.8, 0], [28.0, -8.0, 8.0, 0.82, 2],        // Imbrium
  [44.1, -31.5, 4.0, 0.7, 0],                                                                    // Sinus Iridum
  [28.0, 17.5, 10.8, 0.72, 2],                                                                   // Serenitatis
  [8.5, 31.4, 10.5, 0.9, 1], [14.0, 24.0, 6.5, 0.9, 1], [3.0, 38.0, 6.5, 0.88, 1], [16.0, 36.0, 4.5, 0.85, 1],   // Tranquillitatis
  [17.0, 59.1, 8.0, 0.88, 3], [15.5, 56.0, 6.5, 0.88, 3],                                        // Crisium
  [-7.8, 51.3, 8.0, 0.8, 2], [-1.0, 54.0, 5.5, 0.78, 2], [-14.0, 50.0, 5.5, 0.78, 2],           // Fecunditatis
  [-15.2, 35.5, 5.2, 0.85, 0],                                                                   // Nectaris
  [-21.3, -16.6, 10.0, 0.8, 0], [-16.0, -11.0, 5.5, 0.78, 0],                                    // Nubium
  [-24.4, -38.6, 6.2, 0.88, 3],                                                                  // Humorum
  [-10.0, -23.1, 6.0, 0.8, 0],                                                                   // Cognitum
  [7.5, -30.9, 7.5, 0.82, 0],                                                                    // Insularum
  [13.3, 3.6, 3.9, 0.8, 2], [2.4, 1.7, 3.0, 0.7, 0], [10.9, -8.8, 3.5, 0.78, 0], [26.5, 0.4, 3.0, 0.7, 2],   // Vaporum, Medii, Aestuum, Putredinis
  [38.0, 29.0, 5.0, 0.6, 2], [14.0, 45.0, 3.0, 0.6, 2],                                          // Somniorum, Somni
  // Frigoris: a long band in the north
  [56.0, -35.0, 4.5, 0.72, 0], [57.5, -18.0, 5.0, 0.75, 0], [56.5, 0.0, 5.0, 0.75, 0], [57.0, 16.0, 4.5, 0.72, 0], [56.0, 32.0, 4.0, 0.7, 0], [54.0, 44.0, 3.5, 0.65, 0],
  // Oceanus Procellarum: the great western ocean, built of overlapping lobes
  [30.0, -55.0, 12.0, 0.88, 3], [15.0, -50.0, 13.0, 0.86, 0], [0.0, -55.0, 11.0, 0.84, 0], [-5.0, -42.0, 8.0, 0.82, 0],
  [42.0, -48.0, 8.5, 0.85, 3], [20.0, -66.0, 9.5, 0.86, 3], [48.0, -60.0, 6.0, 0.8, 0], [-12.0, -52.0, 6.0, 0.8, 0], [5.0, -68.0, 7.0, 0.82, 0],
  // limb maria
  [1.3, 87.5, 5.5, 0.75, 0], [13.0, 86.5, 4.5, 0.7, 0], [-38.9, 93.0, 7.0, 0.55, 0], [-19.0, -93.0, 6.5, 0.7, 3], [-5.2, -68.6, 2.6, 0.95, 3],   // Smythii, Marginis, Australe, Orientale, Grimaldi
];

// named craters: [lat, lon, diameter km, rays 0..1, floor darkness 0..1, brightness 0..1]
const MOON_CRATERS = [
  [-43.3, -11.2, 86, 1.0, 0, 1.0],      // Tycho
  [9.6, -20.1, 93, 0.75, 0, 0.85],      // Copernicus
  [8.1, -38.0, 31, 0.5, 0, 0.8],        // Kepler
  [23.7, -47.4, 40, 0.35, 0, 1.0],      // Aristarchus
  [16.1, 46.8, 28, 0.4, 0, 0.8],        // Proclus
  [51.6, -9.4, 101, 0, 0.8, 0],         // Plato
  [-9.3, -1.9, 153, 0, 0.2, 0], [-13.4, -3.2, 108, 0, 0, 0], [-18.2, -1.9, 96, 0, 0, 0.2],      // Ptolemaeus, Alphonsus, Arzachel
  [-58.8, -14.1, 225, 0, 0, 0], [-50.0, -6.0, 194, 0, 0, 0], [-41.0, 6.0, 126, 0, 0, 0], [-42.0, 14.0, 114, 0, 0, 0], [-33.0, 0.7, 140, 0, 0, 0],
  [-8.9, 61.1, 132, 0.15, 0, 0.3], [-25.1, 60.4, 177, 0, 0, 0.1],                               // Langrenus, Petavius
  [-11.4, 26.4, 110, 0.1, 0, 0.3], [-13.2, 24.0, 98, 0, 0, 0], [-18.0, 23.6, 100, 0, 0, 0],      // Theophilus, Cyrillus, Catharina
  [14.5, -11.3, 58, 0, 0, 0.1], [29.7, -4.0, 81, 0, 0.3, 0], [50.2, 17.4, 88, 0, 0, 0.2], [44.3, 16.3, 67, 0, 0, 0.1],
  [31.8, 29.9, 95, 0, 0, 0], [-17.6, -40.1, 110, 0, 0.1, 0], [-44.4, -54.6, 227, 0, 0.3, 0], [-11.2, 4.1, 136, 0, 0, 0],
  [-5.1, 5.2, 150, 0, 0, 0], [14.5, 9.1, 38, 0.15, 0, 0.5], [-24.0, -54.0, 60, 0, 0, 0], [-31.0, 40.0, 70, 0, 0, 0],
  [36.0, -2.0, 40, 0, 0, 0.3], [-3.0, -17.0, 40, 0, 0, 0.3], [20.0, -27.0, 30, 0.2, 0, 0.6], [-27.0, -8.0, 50, 0, 0, 0],
  [-5.0, 16.0, 80, 0, 0, 0], [-60.0, 35.0, 150, 0, 0, 0], [62.0, -30.0, 110, 0, 0, 0], [70.0, 10.0, 90, 0, 0, 0],
];

const MOON_CFG = {
  bake: [4096, 2048],     // the baked map (capture); half that when playing live
  bakeLive: [2048, 1024],
  relief: 1.6,            // relief exaggeration for the normals and shadows
  dist: 1000,             // the Moon sphere is drawn this far from the camera (metres), scaled to its true angular size
};

class MoonSky {
  constructor(app) {
    this.app = app;
    const live = !CONFIG.captureMode, mb = +(URLP.get('mbake') || 0), S = mb ? [mb, mb / 2] : live ? MOON_CFG.bakeLive : MOON_CFG.bake;   // (?mbake=1024 for quick tests)
    this.W = S[0]; this.H = S[1];
    this.dir = new THREE.Vector3(0, 0.4, -1).normalize();     // the Moon's direction in your sky
    this.sunDir = new THREE.Vector3(0.66, -0.12, 0.74).normalize();
    this.radius = MathX.deg(0.26);                              // angular radius (rad)
    this.distKm = 384400;
    this.roll = 0;                                              // lunar north's tilt from your up (rad)
    this.face = [0, 0];                                         // the selenographic point (lat, lon deg) turned toward you
    this.flash = 0;                                             // impact light
    this._bake();
    this._buildMoon();
    this._buildSky();
    this._buildStars();
  }

  /* ---------------- the lunar map, baked once ---------------- */
  _bake() {
    const R = this.app.renderer, W = this.W, H = this.H;
    const mk = (type) => { const rt = new THREE.WebGLRenderTarget(W, H, { type, depthBuffer: false, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, wrapS: THREE.RepeatWrapping, wrapT: THREE.ClampToEdgeWrapping });
      rt.texture.generateMipmaps = true; rt.texture.anisotropy = 4; return rt; };
    this.baseRT = mk(THREE.HalfFloatType);       // rgb albedo, a height (km)
    this.normRT = mk(THREE.UnsignedByteType);    // tangent-space normal (east, north, up)
    const maria = MOON_MARIA.map((m) => new THREE.Vector4(...m.slice(0, 4))), mt = MOON_MARIA.map((m) => m[4]);
    const craters = MOON_CRATERS.map((c) => new THREE.Vector3(c[0], c[1], c[2])), cf = MOON_CRATERS.map((c) => new THREE.Vector3(c[3], c[4], c[5]));
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    const scene = new THREE.Scene(); scene.add(quad);
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    quad.material = new THREE.ShaderMaterial({
      uniforms: { uMaria: { value: maria }, uMT: { value: mt }, uCr: { value: craters }, uCf: { value: cf } },
      defines: { NM: maria.length, NC: craters.length },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: /* glsl */`
        precision highp float;
        varying vec2 vUv;
        uniform vec4 uMaria[NM]; uniform float uMT[NM]; uniform vec3 uCr[NC]; uniform vec3 uCf[NC];
        ${MoonSky.GLSL_NOISE}
        vec3 sph(float lat, float lon){ float a = radians(lat), b = radians(lon); return vec3(cos(a) * sin(b), sin(a), cos(a) * cos(b)); }
        // a crater's height (km) at normalised distance x = d/R, for a crater of radius R km
        float craterH(float x, float R, float fresh){
          float D = min(0.21 * R, 2.6 + 0.012 * R) * (0.75 + 0.25 * fresh);   // depth: bowl-shaped when small, flat-floored when big
          float Hr = 0.035 * R + 0.08;
          float flo = R > 12.0 ? 0.62 : 1.0;                                   // complex craters: flat floor at 62 % of the depth
          float bowl = -D * min(1.0 - x * x, flo) / flo;
          float rim = Hr * exp(-pow((x - 1.0) / 0.16, 2.0));
          float ej = Hr * 0.55 * pow(max(x, 1.0), -3.0);
          float peak = R > 18.0 ? 0.25 * D * exp(-pow(x / 0.11, 2.0)) : 0.0;
          float inside = bowl + peak;
          return mix(inside, 0.0, smoothstep(0.86, 1.04, x)) + rim + (x > 1.0 ? ej : 0.0);
        }
        void main(){
          float lon = (vUv.x - 0.5) * 360.0, lat = (vUv.y - 0.5) * 180.0;
          vec3 p = sph(lat, lon);
          // --- maria: overlapping lobes merged into one field, its shore cut by noise at several scales (domain-warped)
          vec3 wq = p * 2.6, warp = vec3(fbm(wq + 1.3), fbm(wq + 7.1), fbm(wq + 3.7)) - 0.5;
          vec3 pw = normalize(p + warp * 0.24 + (vec3(fbm(p * 8.0 + 2.0), fbm(p * 8.0 + 9.0), fbm(p * 8.0 + 5.0)) - 0.5) * 0.09);
          float field = 0.0, tone = 0.0; vec3 tint = vec3(0.0); float tw = 0.0;
          for (int i = 0; i < NM; i++) {
            vec4 m = uMaria[i]; vec3 c = sph(m.x, m.y);
            float d = degrees(acos(clamp(dot(pw, c), -1.0, 1.0))) / m.z;
            float k = exp(-d * d * 1.7);
            if (k > 0.002) {
              field += k; tone += k * m.w; tw += k;
              float ti = uMT[i];
              tint += k * (ti < 0.5 ? vec3(1.0, 0.985, 0.96) : ti < 1.5 ? vec3(0.95, 0.98, 1.05) : ti < 2.5 ? vec3(1.04, 0.995, 0.93) : vec3(0.98, 0.97, 0.97));
            }
          }
          tone = tw > 0.0 ? tone / tw : 0.8; tint = tw > 0.0 ? tint / tw : vec3(1.0);
          float thr = 0.24 + 0.24 * (fbm(p * 5.0 + 4.0) - 0.5) + 0.12 * (fbm(p * 17.0 + 1.0) - 0.5) + 0.05 * (fbm(p * 55.0 + 6.0) - 0.5);
          float mare = smoothstep(thr - 0.05, thr + 0.04, field);
          // --- heights: highlands rough and high, maria low and smooth with wrinkle ridges
          float hi = 1.2 + 1.4 * (fbm(p * 6.0) - 0.5) + 0.6 * (fbm(p * 22.0) - 0.5);
          float ridge = 1.0 - abs(fbm(p * 26.0 + 4.0) * 2.0 - 1.0);
          float h = mix(hi, -1.6 + 0.18 * pow(ridge, 6.0), mare);
          // Imbrium's mountain rim (Apennines, Caucasus, Alps, Carpathians): high on the south-east to north, open to the west
          { vec3 c = sph(32.8, -15.6); float d = degrees(acos(clamp(dot(pw, c), -1.0, 1.0)));
            vec3 e = normalize(cross(vec3(0.0, 1.0, 0.0), c)), n = cross(c, e); float az = atan(dot(pw - c, e), dot(pw - c, n));   // 0 = north, +90° = east
            float side = smoothstep(-1.2, 0.2, cos(az + 2.2)) * 0.8 + 0.2 * smoothstep(0.5, 1.0, cos(az));
            float ring = exp(-pow((d - 19.5) / 1.6, 2.0)) * side;
            h += ring * (3.2 + 2.5 * fbm(p * 40.0)); }
          // --- named craters, and their rays and bright halos
          float alb = 0.0, rays = 0.0;
          for (int i = 0; i < NC; i++) {
            vec3 c = sph(uCr[i].x, uCr[i].y); float R = uCr[i].z * 0.5;
            float d = acos(clamp(dot(p, c), -1.0, 1.0)) * ${MOON_R_KM.toFixed(1)}, x = d / R;
            vec3 f = uCf[i];
            if (x < 3.0) {
              h += craterH(x, R, f.z) * mix(1.0, 0.45, mare * step(0.5, -1.0 + f.x + f.z));
              alb += f.z * 0.6 * exp(-pow(x / 1.3, 2.0)) - f.y * 0.5 * (1.0 - smoothstep(0.7, 0.92, x));
            }
            if (f.x > 0.0) {
              // rays: bright streaks fanning out, broken along their length
              vec3 e = normalize(cross(vec3(0.0, 1.0, 0.0), c)), n = cross(c, e);
              float az = atan(dot(p - c, e), dot(p - c, n)) + 0.12 * (vnoise(vec3(d * 0.004, float(i), 7.0)) - 0.5);   // (rays wander a little)
              float fan = pow(vnoise(vec3(az * 13.0, 1.7 * float(i), 0.0)), 9.0) * 1.6 + 0.7 * pow(vnoise(vec3(az * 41.0, 3.1 * float(i), 1.0)), 12.0);
              float along = smoothstep(0.35, 0.75, vnoise(vec3(az * 30.0, d * 0.01, 2.0 + float(i))));
              float reach = R * (6.0 + 22.0 * f.x);
              rays += f.x * fan * along * exp(-d / reach) * smoothstep(R * 1.3, R * 3.0, d);
              alb += f.x * 0.35 * exp(-pow(x / 2.6, 2.0));
            }
          }
          // --- random craters: six octaves of cells on the sphere; fewer (buried) on the maria
          float cs = 0.25, fresh = 0.0;
          for (int o = 0; o < 6; o++) {
            vec3 q = p / cs, cell = floor(q);
            for (int a = -1; a <= 1; a++) for (int b = -1; b <= 1; b++) for (int c3 = -1; c3 <= 1; c3++) {
              vec3 id = cell + vec3(a, b, c3), r = hash33(id + float(o) * 17.0);
              if (r.z > 0.72 - 0.04 * float(o)) continue;
              vec3 cc = normalize((id + r) * cs);
              float R = cs * ${MOON_R_KM.toFixed(1)} * (0.1 + 0.32 * fract(r.x * 7.3 + r.y * 3.1));
              float d = length(p - cc) * ${MOON_R_KM.toFixed(1)}, x = d / R;
              if (x < 2.6) {
                float age = fract(r.y * 13.7), keep = mix(1.0, o < 3 ? 0.18 : 0.45, mare);
                h += craterH(x, R, age) * keep;
                alb += age > 0.86 ? 0.25 * exp(-pow(x / 1.4, 2.0)) * keep : 0.0;
              }
            }
            cs *= 0.56;
          }
          // --- albedo: bright, mottled highlands; dark maria in their own tints; rays and fresh craters
          float hl = 0.17 + 0.05 * (fbm(p * 9.0 + 3.0) - 0.5) + 0.035 * (fbm(p * 35.0) - 0.5);
          float mr = 0.062 - 0.035 * (tone - 0.8) + 0.022 * (fbm(p * 5.0 + 8.0) - 0.5) + 0.012 * (fbm(p * 21.0 + 2.0) - 0.5)
                   + 0.02 * (1.0 - smoothstep(thr, thr + 0.25, field));          // (lighter near the shores)
          float A = mix(hl, mr, mare) + 0.05 * alb + 0.07 * rays * (1.0 - 0.2 * mare);
          vec3 col = A * mix(vec3(1.01, 0.995, 0.975), tint, mare);
          gl_FragColor = vec4(max(col, vec3(0.02)), h);
        }`,
      depthTest: false, depthWrite: false,
    });
    const prev = R.getRenderTarget();
    R.setRenderTarget(this.baseRT); R.render(scene, cam);
    // normals from the height: central differences, metres of surface per texel (longitude shrinks with cos(lat))
    quad.material = new THREE.ShaderMaterial({
      uniforms: { tH: { value: this.baseRT.texture }, uTexel: { value: new THREE.Vector2(1 / W, 1 / H) }, uRelief: { value: MOON_CFG.relief } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: /* glsl */`
        precision highp float; varying vec2 vUv; uniform sampler2D tH; uniform vec2 uTexel; uniform float uRelief;
        void main(){
          float lat = (vUv.y - 0.5) * 3.14159265;
          float kmX = 2.0 * 3.14159265 * ${MOON_R_KM.toFixed(1)} * uTexel.x * max(cos(lat), 0.02), kmY = 3.14159265 * ${MOON_R_KM.toFixed(1)} * uTexel.y;
          float hE = texture2D(tH, vUv + vec2(uTexel.x, 0.0)).a, hW = texture2D(tH, vUv - vec2(uTexel.x, 0.0)).a;
          float hN = texture2D(tH, vUv + vec2(0.0, uTexel.y)).a, hS = texture2D(tH, vUv - vec2(0.0, uTexel.y)).a;
          vec3 n = normalize(vec3(-(hE - hW) / (2.0 * kmX) * uRelief, -(hN - hS) / (2.0 * kmY) * uRelief, 1.0));
          gl_FragColor = vec4(n * 0.5 + 0.5, 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });
    R.setRenderTarget(this.normRT); R.render(scene, cam);
    R.setRenderTarget(prev);
    quad.geometry.dispose();
  }

  /* ---------------- the Moon itself ---------------- */
  _buildMoon() {
    const g = new THREE.SphereGeometry(1, 256, 160);
    this.moonMat = new THREE.ShaderMaterial({
      uniforms: {
        tBase: { value: this.baseRT.texture }, tNorm: { value: this.normRT.texture }, uTexel: { value: new THREE.Vector2(1 / this.W, 1 / this.H) },
        uSun: { value: new THREE.Vector3() }, uView: { value: new THREE.Vector3() }, uRot: { value: new THREE.Matrix3() }, uRotW: { value: new THREE.Matrix3() },
        uBright: { value: 1 }, uEarth: { value: 0.012 }, uKmPx: { value: 10 }, uRelief: { value: MOON_CFG.relief }, uExt: { value: 0.13 }, uHaze: { value: new THREE.Vector3(0.0, 0.0, 0.0) },
        uFlash: { value: 0 }, uFlashDir: { value: new THREE.Vector3(0, -1, 0) },
      },
      vertexShader: /* glsl */`
        varying vec3 vP; varying vec3 vW;
        void main(){ vP = position; vec4 w = modelMatrix * vec4(position, 1.0); vW = normalize(w.xyz - cameraPosition); gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`
        precision highp float;
        varying vec3 vP; varying vec3 vW;
        uniform sampler2D tBase, tNorm; uniform vec2 uTexel; uniform vec3 uSun, uView; uniform mat3 uRot, uRotW;
        uniform float uBright, uEarth, uKmPx, uRelief, uExt, uFlash; uniform vec3 uHaze, uFlashDir;
        ${MoonSky.GLSL_NOISE}
        float craterH(float x, float R){
          float D = min(0.2 * R, 2.6), Hr = 0.035 * R;
          float bowl = -D * (1.0 - x * x);
          float rim = Hr * exp(-pow((x - 1.0) / 0.17, 2.0));
          return mix(bowl, 0.0, smoothstep(0.86, 1.04, x)) + rim + (x > 1.0 ? Hr * 0.5 * pow(x, -3.0) : 0.0);
        }
        vec2 uvOf(vec3 p){ return vec2(atan(p.x, p.z) / 6.2831853 + 0.5, asin(clamp(p.y, -1.0, 1.0)) / 3.14159265 + 0.5); }
        void main(){
          vec3 p = normalize(vP);                       // selenographic position on the unit sphere
          vec2 uv = uvOf(p);
          vec4 B = texture2D(tBase, uv);
          vec3 tn = texture2D(tNorm, uv).xyz * 2.0 - 1.0;
          vec3 E = normalize(cross(vec3(0.0, 1.0, 0.0), p)); if (abs(p.y) > 0.9995) E = vec3(1.0, 0.0, 0.0);
          vec3 Nn = cross(p, E);
          // finer craters than the map holds, faded in as the Moon comes close (each octave once it spans a few pixels)
          vec2 g2 = vec2(0.0); float cs = 0.009, hd = 0.0;
          for (int o = 0; o < 4; o++) {
            float vis = smoothstep(2.0, 6.0, cs * ${MOON_R_KM.toFixed(1)} * 0.4 / uKmPx) * smoothstep(0.12, 0.4, dot(p, uView));
            if (vis > 0.0) {
              vec3 q = p / cs, cell = floor(q);
              for (int a = -1; a <= 1; a++) for (int b = -1; b <= 1; b++) for (int c3 = -1; c3 <= 1; c3++) {
                vec3 id = cell + vec3(a, b, c3), r = hash33(id + float(o) * 31.0 + 5.0);
                if (r.z > 0.6) continue;
                vec3 cc = normalize((id + r) * cs);
                float R = cs * ${MOON_R_KM.toFixed(1)} * (0.1 + 0.3 * fract(r.x * 7.3 + r.y * 3.1));
                vec3 dv = (p - cc) * ${MOON_R_KM.toFixed(1)}; float d = length(dv), x = d / R;
                if (x < 2.2 && x > 0.001) {
                  float e = 0.002;
                  float dh = (craterH(x + e, R) - craterH(max(x - e, 0.0), R)) / (2.0 * e * R);   // dh/dd (km per km)
                  vec2 dir = vec2(dot(dv, E), dot(dv, Nn)) / d;
                  g2 += dh * dir * vis * (1.0 - 0.55 * smoothstep(0.08, 0.06, B.r));             // (fewer on the maria)
                }
              }
            }
            cs *= 0.55;
          }
          vec3 n = normalize(vec3(tn.xy - g2 * uRelief, tn.z));
          vec3 N = normalize(n.x * E + n.y * Nn + n.z * p);
          // light: the Sun (in lunar coordinates), Lommel–Seeliger with a little Lambert, a soft grazing edge
          vec3 L = uSun, V = uView;
          float mu0 = dot(N, L), mu = max(dot(N, V), 0.0), mu0s = dot(p, L);
          float ls = max(mu0, 0.0) / (max(mu0, 0.0) + mu + 0.08);
          float lam = max(mu0, 0.0);
          float I = mix(ls * 2.0, lam, 0.25) * smoothstep(-0.02, 0.05, mu0s + 0.03);
          // shadows across the terminator: march toward the Sun over the height map
          if (mu0s < 0.3 && mu0s > -0.05) {
            vec3 Lt = L - p * mu0s; float lt = length(Lt);
            if (lt > 1e-4) {
              Lt /= lt; float le = dot(Lt, E), ln = dot(Lt, Nn), elev = mu0s / lt, h0 = B.a;
              float s = 1.5, sh = 0.0, cl = max(cos(asin(clamp(p.y, -1.0, 1.0))), 0.05);
              for (int i = 0; i < 12; i++) {
                vec2 o = vec2(s * le / (${MOON_R_KM.toFixed(1)} * cl) / 6.2831853, s * ln / ${MOON_R_KM.toFixed(1)} / 3.14159265);
                float hh = texture2D(tBase, uv + o).a;
                sh = max(sh, smoothstep(0.0, 0.5, (hh - h0) * uRelief - s * elev - s * s / (2.0 * ${MOON_R_KM.toFixed(1)})));
                s *= 1.55;
              }
              I *= 1.0 - sh * smoothstep(0.985, 0.88, dot(L, V)) * smoothstep(0.02, 0.15, dot(p, V));
            }
          }
          vec3 alb = B.rgb;
          vec3 col = alb * I * uBright;
          // earthshine on the night side (bluish, faint)
          col += alb * uEarth * vec3(0.75, 0.85, 1.0) * max(dot(p, V), 0.0) * (1.0 - smoothstep(-0.1, 0.1, mu0s));
          // the impact's light
          col += alb * uFlash * max(dot(N, uFlashDir), 0.0) * 6.0;
          // through the air: extinction and reddening low down, a veil of scattered light
          vec3 w = normalize(vW); float sa = max(w.y, 0.0), am = 1.0 / (sa + 0.025 * exp(-11.0 * sa) + 0.02);
          col *= exp(-uExt * (am - 1.0) * vec3(0.62, 0.82, 1.12));
          col += uHaze * (0.25 + 0.75 * min(am, 12.0) / 12.0);
          gl_FragColor = vec4(col, 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });
    this.moon = new THREE.Mesh(g, this.moonMat);
    this.moon.frustumCulled = false; this.moon.renderOrder = -999;
    this.app.scene.add(this.moon);
  }

  /* ---------------- the night sky behind everything ---------------- */
  _buildSky() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: {
        uCamRot: { value: new THREE.Matrix3() }, uTanHalf: { value: 0.5 }, uAspect: { value: 9 / 16 },
        uMoonDir: { value: new THREE.Vector3() }, uMoonR: { value: 0.005 }, uMoonLight: { value: 0 }, uDusk: { value: 1 },
        uTownAz: { value: 0 }, uTown: { value: 1 }, uFlash: { value: 0 }, uFlashDir: { value: new THREE.Vector3(0, 0, -1) }, uRed: { value: 0 },
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.9999, 1.0); }',
      fragmentShader: /* glsl */`
        uniform mat3 uCamRot; uniform float uTanHalf, uAspect, uMoonR, uMoonLight, uDusk, uTownAz, uTown, uFlash, uRed; uniform vec3 uMoonDir, uFlashDir; varying vec2 vUv;
        void main(){
          vec2 ndc = vUv * 2.0 - 1.0;
          vec3 d = normalize(uCamRot * vec3(ndc.x * uTanHalf * uAspect, ndc.y * uTanHalf, -1.0));
          float sa = max(d.y, 0.0);
          // night: deep blue overhead, the last of the evening low in the west
          vec3 sky = mix(vec3(0.012, 0.02, 0.042), vec3(0.04, 0.055, 0.085), pow(1.0 - sa, 3.0));
          float west = max(d.x, 0.0);
          sky += uDusk * vec3(0.10, 0.07, 0.09) * pow(1.0 - sa, 6.0) * (0.3 + 0.7 * west);
          // the city's glow along the horizon
          float az = atan(d.x, -d.z), tw = exp(-pow(abs(mod(az - uTownAz + 3.14159, 6.28318) - 3.14159) / 1.4, 2.0));
          sky += uTown * vec3(0.09, 0.055, 0.03) * exp(-sa * 7.0) * (0.35 + 0.65 * tw);
          // moonlight scattered by the air: a glow around the Moon that grows with it, and a bluer sky everywhere
          float md = max(dot(d, uMoonDir), 0.0), ang = acos(min(md, 1.0));
          float halo = exp(-max(ang - uMoonR, 0.0) / (0.06 + uMoonR * 0.8));
          sky += uMoonLight * (vec3(0.16, 0.2, 0.28) * halo + vec3(0.05, 0.075, 0.12) * (0.4 + 0.6 * pow(1.0 - sa, 2.0)));
          // emergency light reflected off the haze
          sky += uRed * vec3(0.08, 0.012, 0.01) * exp(-sa * 5.0);
          // the impact: the horizon on fire, then everything
          float fd = max(dot(d, uFlashDir), 0.0);
          sky += uFlash * (vec3(1.6, 1.1, 0.75) * pow(fd, 3.0) * exp(-sa * 3.0) + vec3(0.9, 0.75, 0.6) * 0.35);
          sky = mix(sky, vec3(0.05, 0.05, 0.06), smoothstep(0.0, -0.08, d.y));
          gl_FragColor = vec4(sky, 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });
    this.sky = new THREE.Mesh(g, this.skyMat); this.sky.frustumCulled = false; this.sky.renderOrder = -1000;
    // (the sky follows whichever camera draws it — the reflection camera too; its view from the projection matrix)
    this.sky.onBeforeRender = (r, s, c) => { const U = this.skyMat.uniforms, e = c.projectionMatrix.elements; U.uCamRot.value.setFromMatrix4(c.matrixWorld); U.uTanHalf.value = 1 / e[5]; U.uAspect.value = e[5] / e[0]; };
    this.app.scene.add(this.sky);
  }

  _buildStars() {
    const rng = new RNG(CONFIG.seed + 77), N = 9000, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), mag = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const z = rng.range(-0.15, 1), a = rng.range(0, Math.PI * 2), r = Math.sqrt(1 - z * z);
      pos.set([Math.cos(a) * r * 1000, z * 1000, Math.sin(a) * r * 1000], i * 3);
      mag[i] = 6.2 - 6.0 * Math.pow(rng.next(), 0.25) * Math.pow(rng.next(), 0.4);
      const T = rng.next(), c = T < 0.12 ? [0.7, 0.8, 1.0] : T < 0.5 ? [0.95, 0.96, 1.0] : T < 0.8 ? [1.0, 0.93, 0.82] : [1.0, 0.8, 0.6];
      col.set(c, i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aCol', new THREE.BufferAttribute(col, 3)); g.setAttribute('aMag', new THREE.BufferAttribute(mag, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    this.starMat = new THREE.ShaderMaterial({
      uniforms: { uPx: { value: 1 }, uFade: { value: 1 }, uTime: { value: 0 }, uMoonDir: { value: new THREE.Vector3() }, uMoonR: { value: 0.005 } },
      vertexShader: /* glsl */`
        attribute vec3 aCol; attribute float aMag; uniform float uPx, uFade, uTime, uMoonR; uniform vec3 uMoonDir; varying vec3 vCol;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_Position.z = gl_Position.w * 0.99999;
          vec3 d = normalize(position); float sa = max(d.y, 0.0), am = 1.0 / (sa + 0.025 * exp(-11.0 * sa) + 0.02);
          float f = pow(10.0, -0.4 * (aMag - 1.0)) * exp(-0.5 * (am - 1.0)) * uFade;
          f *= 0.85 + 0.15 * sin(uTime * (3.0 + fract(aMag * 13.7) * 5.0) + aMag * 40.0);
          f *= step(uMoonR * 1.02, acos(clamp(dot(d, uMoonDir), -1.0, 1.0)));         // (hidden behind the Moon)
          float s = clamp(1.1 + 1.4 * log(1.0 + f * 3.0), 1.0, 4.0) * uPx;
          vCol = aCol * min(f * 2.0, 2.5) / max(1.0, s * s / (uPx * uPx * 2.2)) * smoothstep(-0.02, 0.05, d.y);
          gl_PointSize = s;
        }`,
      fragmentShader: 'varying vec3 vCol; void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r2 = dot(q, q); if (r2 > 1.0) discard; gl_FragColor = vec4(vCol * exp(-r2 * 2.5), 1.0); }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.stars = new THREE.Points(g, this.starMat); this.stars.frustumCulled = false; this.stars.renderOrder = -998;
    this.app.scene.add(this.stars);
  }

  /* ---------------- per frame ---------------- */
  // the Moon's frame in your sky: +Z toward you from its centre, north tilted by `roll`, the `face` point turned to you
  update(t, camera) {
    const cam = camera, U = this.moonMat.uniforms, d = this.dir;
    // orientation: build the lunar axes in world space
    const toYou = d.clone().negate();
    const up0 = new THREE.Vector3(0, 1, 0).addScaledVector(toYou, -toYou.y).normalize();
    const right0 = new THREE.Vector3().crossVectors(up0, toYou).normalize();
    const up = up0.clone().multiplyScalar(Math.cos(this.roll)).addScaledVector(right0, -Math.sin(this.roll));
    const right = new THREE.Vector3().crossVectors(up, toYou).normalize();
    // turn the chosen face point toward you: rotate by -lon about north, then +lat about east
    const la = MathX.deg(this.face[0]), lo = MathX.deg(this.face[1]);
    const Mface = new THREE.Matrix4().makeRotationX(la).multiply(new THREE.Matrix4().makeRotationY(-lo));
    const Mworld = new THREE.Matrix4().makeBasis(right, up, toYou).multiply(Mface);   // lunar coords → world
    const L = MOON_CFG.dist, r = L * Math.sin(Math.min(this.radius, 1.45));
    this.moon.position.copy(cam.position).addScaledVector(d, L);
    this.moon.quaternion.setFromRotationMatrix(Mworld);
    this.moon.scale.setScalar(r);
    this.moon.updateMatrixWorld(true);
    const inv = new THREE.Matrix3().setFromMatrix4(Mworld).invert();
    U.uSun.value.copy(this.sunDir).applyMatrix3(inv).normalize();
    U.uView.value.copy(toYou).applyMatrix3(inv).normalize();
    U.uFlashDir.value.copy(this.flashDir || new THREE.Vector3(0, -1, 0)).applyMatrix3(inv).normalize();
    U.uFlash.value = this.flash;
    // how many km of lunar surface one pixel covers (for the detail craters)
    const size = this.app.renderer.getDrawingBufferSize(this._sz || (this._sz = new THREE.Vector2()));
    const pixAng = 2 * Math.tan(MathX.deg(cam.fov) / 2) / size.y;
    U.uKmPx.value = this.obsKm() * pixAng;
    // the sky
    const S = this.skyMat.uniforms;
    S.uMoonDir.value.copy(d); S.uMoonR.value = this.radius; S.uFlash.value = this.flash;
    if (this.flashDir) S.uFlashDir.value.copy(this.flashDir);
    this.starMat.uniforms.uMoonDir.value.copy(d); this.starMat.uniforms.uMoonR.value = this.radius;
    this.starMat.uniforms.uTime.value = t; this.starMat.uniforms.uPx.value = size.y / 1920 * 2.0;
    this.stars.position.copy(cam.position); this.stars.updateMatrixWorld(true);
  }

  // distance from you to the Moon's centre (km), from its centre distance and its height in your sky
  obsKm() { const s = Math.sin(Math.asin(MathX.clamp(this.dir.y, -1, 1))), D = this.distKm, Re = EARTH_R_KM; return -Re * s + Math.sqrt(Re * Re * s * s - Re * Re + D * D); }
  // how much of the Moon's light reaches the ground: its lit fraction times its solid angle (1 = today's full Moon)
  illum() {
    const ph = 0.5 * (1 + this.sunDir.dot(this.dir.clone().negate()));
    return ph * Math.pow(Math.sin(this.radius) / Math.sin(MathX.deg(0.259)), 2);
  }
}

// value noise, fbm and hashes for the lunar shaders
MoonSky.GLSL_NOISE = /* glsl */`
  vec3 hash33(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
  float hash13(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
  float vnoise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), f.x), mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x), mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
  float fbm(vec3 x){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * vnoise(x); x = x * 2.03 + 11.7; a *= 0.5; } return v; }
`;
