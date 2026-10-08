/* =====================================================================
   STADIUM — a football stadium on a sunny afternoon, a storm beyond the far stand.
   Pitch along x (goals at x = ±52.5), the main stand (with a roof) on +z, the far stand on −z, end stands at ±x,
   floodlight masts with the loudspeakers in the corners, the big screen over the west end stand.
   Every size comes from SND_ST (script.js), so the crowd, the cast and the camera agree with the concrete.
   Subclasses the shared Environment (materials, trees, batching, the environment map).
   ===================================================================== */

const LAYOUT = { curbH: 0, roadHalf: 0 };   // (the shared tree builder and the camera read these)

class SndStadium extends Environment {
  build() {
    this._materials();
    this._ownMaterials();
    this._sky();
    this._lights();
    this._grounds();
    this._pitchLines();
    this._stands();
    this._roof();
    this._masts();
    this._boards();
    this._screen();
    this._goals();
    this._outside();
    this.batch.build(this.root, 'env');
    this._nets();
    this._lightning();
    this._environmentMap();
  }

  _ownMaterials() {
    const m = this.m;
    m.seat = Mat.std('#23436f', { roughness: 0.55 });
    m.seatEmpty = Mat.std('#2a4f82', { roughness: 0.55 });
    m.tread = new THREE.MeshStandardMaterial({ map: Tex.concrete(41, [150, 147, 140]), roughness: 0.9, name: 'tread' });
    m.riser = new THREE.MeshStandardMaterial({ map: Tex.concrete(42, [118, 115, 109]), roughness: 0.9, name: 'riser' });
    m.wall = new THREE.MeshStandardMaterial({ map: Tex.concrete(43, [176, 172, 163]), roughness: 0.85, name: 'standWall' });
    m.aisle = Mat.std('#9a968c', { roughness: 0.9 });
    m.stepEdge = Mat.std('#d9b23a', { roughness: 0.7 });
    m.roofTop = Mat.std('#c9ccce', { roughness: 0.6, metalness: 0.2 });
    m.roofUnder = Mat.std('#8e9399', { roughness: 0.8 });
    m.fascia = Mat.std('#1f3557', { roughness: 0.5 });
    m.glazing = Mat.std('#36404b', { roughness: 0.3, metalness: 0.3 });
    m.mast = Mat.std('#b8bcc0', { roughness: 0.5, metalness: 0.5 });
    m.speaker = Mat.std('#1d1f22', { roughness: 0.6 });
    m.postWhite = Mat.std('#f4f4f0', { roughness: 0.4 });
    m.runoff = Mat.std('#4a7432', { roughness: 1 });
    m.track = Mat.std('#6b6f68', { roughness: 0.95 });
    m.plaza = new THREE.MeshStandardMaterial({ map: Tex.concrete(44, [140, 137, 130]), roughness: 0.95, name: 'plaza' });
    m.plaza.map.repeat.set(60, 60);
  }

  /* ---------------- sky: a clear afternoon, with a storm standing beyond the far stand ---------------- */
  _sky() {
    this.sunDir = new THREE.Vector3(0.62, 0.62, 0.48).normalize();   // behind the main stand, to the east: the far stand and the start line are lit
    const zenith = new THREE.Color('#5f87b2'), horizon = new THREE.Color('#c3d0da');
    this.fogColor = new THREE.Color('#c4ccd2');
    const bolt = new THREE.Vector3(SND.flash.x, 0, SND.flash.z).normalize();
    this.skyUniforms = {
      uZenith: { value: zenith }, uHorizon: { value: horizon }, uGround: { value: new THREE.Color('#77806f') },
      uSunDir: { value: this.sunDir }, uSunColor: { value: new THREE.Color('#ffe2b4') }, uTime: { value: 0 },
      uStorm: { value: new THREE.Vector2(bolt.x, bolt.z) }, uFlash: { value: 0 }, uFlashDir: { value: new THREE.Vector2(bolt.x, bolt.z) },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.skyUniforms, side: THREE.BackSide, depthWrite: false,
      vertexShader: /* glsl */`varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */`
        uniform vec3 uZenith, uHorizon, uGround, uSunDir, uSunColor; uniform float uTime, uFlash; uniform vec2 uStorm, uFlashDir; varying vec3 vDir;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
          return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y); }
        float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a*noise(p); p = p*2.03 + 7.1; a *= 0.5; } return v; }
        void main(){
          vec3 d = normalize(vDir); float h = d.y, el = asin(clamp(h, -1.0, 1.0));
          vec3 col = mix(uHorizon, uZenith, pow(clamp(h, 0.0, 1.0), 0.55));
          col = mix(col, uGround, smoothstep(0.0, -0.08, h));
          float sd = max(dot(d, uSunDir), 0.0);
          col += uSunColor * (pow(sd, 4.0) * 0.16 + pow(sd, 40.0) * 0.25);
          col = mix(col, uHorizon * 1.04, 0.25 * (1.0 - smoothstep(0.0, 0.18, abs(h))));
          // how far round from the storm (radians), and an angle along the horizon for the cloud texture
          vec2 hz = normalize(d.xz + vec2(1e-5));
          float ang = acos(clamp(dot(hz, uStorm), -1.0, 1.0));
          float az = atan(hz.x * uStorm.y - hz.y * uStorm.x, dot(hz, uStorm));     // (measured from the storm: its seam is behind you)
          // fair-weather clouds (thinning toward the storm)
          if (h > 0.0) {
            vec2 uv = d.xz / (h + 0.18) * 1.1 + vec2(uTime * 0.006, uTime * 0.002);
            float c = fbm(uv * 1.3);
            float cov = smoothstep(0.5, 0.8, c) * smoothstep(0.0, 0.12, h) * smoothstep(0.6, 1.4, ang);
            vec3 lit = mix(vec3(1.0, 0.98, 0.95), uSunColor, 0.25) * 1.05, shade = mix(uHorizon, uZenith, 0.35) * 0.92;
            col = mix(col, mix(shade, lit, smoothstep(0.45, 0.9, fbm(uv * 1.3 + uSunDir.xz * 0.15))), cov * 0.75);
          }
          // the storm: a cloud wall whose base hangs ~25° up in the middle, lower toward its sides; rain under it
          float wob = fbm(vec2(az * 5.0, 2.3)) - 0.5;
          float side = 1.0 - smoothstep(0.55, 1.05, ang + wob * 0.25);
          float eb = 0.06 + 0.2 * (1.0 - smoothstep(0.0, 1.05, ang)) + wob * 0.05;       // the cloud base (elevation)
          float et = 0.5 + 0.8 * (1.0 - smoothstep(0.0, 1.1, ang)) + (fbm(vec2(az * 3.0, el * 2.0 + 4.0)) - 0.5) * 0.35;   // the top of the wall
          float wall = side * (1.0 - smoothstep(et - 0.06, et + 0.02, el)) * smoothstep(-0.05, 0.0, h);
          if (wall > 0.001) {
            // the face: sunlit, lumpy towers; darker and bluer toward the base
            float b1 = fbm(vec2(az * 9.0, el * 7.0 - uTime * 0.004)), b2 = fbm(vec2(az * 22.0, el * 18.0) + 3.0);
            float up = smoothstep(eb, eb + 0.45, el);
            vec3 face = mix(vec3(0.075, 0.09, 0.115), vec3(0.62, 0.62, 0.63), pow(clamp(up * (0.45 + 0.6 * b1), 0.0, 1.0), 1.6));
            face *= 0.82 + 0.3 * b2;
            face += uSunColor * pow(max(dot(d, uSunDir) * -1.0 + 0.2, 0.0), 2.0) * 0.0;
            // the base and the rain below it: dark slate, a lighter band at the horizon, streaks of rain
            float rain = fbm(vec2(az * 60.0, el * 1.5));
            vec3 under = mix(vec3(0.07, 0.08, 0.10), vec3(0.03, 0.036, 0.048), smoothstep(0.0, eb, el));
            under *= 0.7 + 0.6 * rain;
            float below = 1.0 - smoothstep(eb - 0.012, eb + 0.012, el);
            vec3 storm = mix(face, under, below);
            storm += vec3(0.05, 0.055, 0.06) * exp(-pow((el - eb) / 0.012, 2.0)) * (0.5 + b2);   // the shelf's lip
            // lightning: the cloud base lights up around the strike, the whole storm a little
            float fl = uFlash * (0.12 + 1.3 * exp(-pow(acos(clamp(dot(hz, uFlashDir), -1.0, 1.0)) / 0.16, 2.0)) * (0.4 + below));
            storm += vec3(0.78, 0.8, 1.0) * fl * (0.5 + 0.5 * b2);
            col = mix(col, storm, wall);
          }
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(2800, 64, 32), mat);
    sky.name = 'sky'; sky.frustumCulled = false; sky.renderOrder = -10;
    this.scene.add(sky); this.sky = sky;
    this.scene.fog = new THREE.FogExp2(this.fogColor.clone(), 0.00045);
    this.scene.background = horizon.clone();
  }

  _lights() {
    const sun = new THREE.DirectionalLight('#ffe6c4', 4.0), tgt = new THREE.Vector3(0, 0, 0);
    sun.position.copy(this.sunDir).multiplyScalar(220).add(tgt); sun.target.position.copy(tgt);
    sun.castShadow = CONFIG.render.shadows;
    sun.shadow.mapSize.set(CONFIG.render.shadowMapSize, CONFIG.render.shadowMapSize);
    const sc = sun.shadow.camera; sc.left = -90; sc.right = 90; sc.top = 90; sc.bottom = -90; sc.near = 40; sc.far = 480;
    sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.04; sun.shadow.radius = 3;
    this.scene.add(sun, sun.target); this.sun = sun;
    this.hemi = new THREE.HemisphereLight('#c2d4ea', '#6f7a5c', 1.55); this.scene.add(this.hemi);
  }

  // the shadow camera follows the shot (the stadium is too big for one sharp shadow map)
  aimShadow(cx, cz, half) {
    const sun = this.sun, sc = sun.shadow.camera, tgt = new THREE.Vector3(cx, 0, cz);
    sun.target.position.copy(tgt); sun.position.copy(this.sunDir).multiplyScalar(220).add(tgt);
    sun.target.updateMatrixWorld(); sun.updateMatrixWorld();
    if (sc.right !== half) { sc.left = -half; sc.right = half; sc.top = half; sc.bottom = -half; sc.updateProjectionMatrix(); }
  }

  /* ---------------- the grass: pitch with mowing stripes, the run-off out to the stands, the plaza outside ---------------- */
  _grounds() {
    const B = this.batch, m = this.m, X = 61.0, Z = 41.0;
    // one canvas for the whole grass bowl: stripes on the pitch, plain grass outside it, a little wear in the goalmouths
    const W = 2048, H = Math.round(W * Z / X), c = Tex.canvas(W, H), x = c.getContext('2d');
    const px = (wx) => (wx + X) / (2 * X) * W, pz = (wz) => (wz + Z) / (2 * Z) * H;
    x.fillStyle = '#4c7a33'; x.fillRect(0, 0, W, H);
    const n = 20, sw = 105 / n;
    for (let i = 0; i < n; i++) { x.fillStyle = i % 2 ? '#558a39' : '#4a7731'; x.fillRect(px(-52.5 + i * sw), pz(-34), px(-52.5 + (i + 1) * sw) - px(-52.5 + i * sw) + 1, pz(34) - pz(-34)); }
    const rng = new RNG(51);
    for (let i = 0; i < 5000; i++) { const a = rng.range(0.02, 0.07); x.fillStyle = rng.chance(0.5) ? `rgba(20,40,10,${a})` : `rgba(200,230,150,${a * 0.6})`; x.fillRect(rng.range(0, W), rng.range(0, H), rng.range(2, 9), rng.range(2, 9)); }
    for (const gx of [-52.5, 52.5]) {        // worn goalmouths
      const g = x.createRadialGradient(px(gx * 0.97), pz(0), 4, px(gx * 0.97), pz(0), 90);
      g.addColorStop(0, 'rgba(120,105,70,0.45)'); g.addColorStop(1, 'rgba(120,105,70,0)'); x.fillStyle = g; x.fillRect(px(gx) - 100, pz(0) - 100, 200, 200);
    }
    const tex = Tex.tex(c, { repeat: false });
    tex.anisotropy = 8;
    const grass = new THREE.MeshStandardMaterial({ map: tex, roughness: 1, name: 'pitchGrass' });
    const g = Geo.quad([-X, 0, Z], [X, 0, Z], [X, 0, -Z], [-X, 0, -Z], 0, 1, 1, 0);
    // (quad's UVs run v from z1 up; flip so the canvas top is −z)
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
    B.add(g, grass, null, { noShadow: true });
    // the ground outside the bowl (well below the grass and pushed back in depth: no z-fighting at any distance)
    const pl = m.plaza.clone(); Object.assign(pl, { polygonOffset: true, polygonOffsetFactor: 4, polygonOffsetUnits: 8 });
    B.add(Geo.flat(-1600, 1600, -1600, 1600, -0.3, 1), pl, null, { noShadow: true });
  }

  _pitchLines() {
    const B = this.batch, m = this.m.markWhite, y = 0.006, w = 0.12, h = w / 2;
    const strip = (x0, x1, z0, z1) => B.add(Geo.flat(Math.min(x0, x1), Math.max(x0, x1), Math.min(z0, z1), Math.max(z0, z1), y, 1), m, null, { noShadow: true });
    const ring = (cx, cz, r, t0 = 0, tl = Math.PI * 2, seg = 96) => { const g = new THREE.RingGeometry(r - h, r + h, seg, 1, t0, tl); g.rotateX(-Math.PI / 2); g.translate(cx, y, cz); B.add(g, m, null, { noShadow: true }); };
    const spot = (cx, cz, r) => { const g = new THREE.CircleGeometry(r, 20); g.rotateX(-Math.PI / 2); g.translate(cx, y, cz); B.add(g, m, null, { noShadow: true }); };
    strip(-52.5 - h, 52.5 + h, 34 - h, 34 + h); strip(-52.5 - h, 52.5 + h, -34 - h, -34 + h);
    for (const gx of [-52.5, 0, 52.5]) strip(gx - h, gx + h, -34, 34);
    ring(0, 0, 9.15); spot(0, 0, 0.16);
    for (const s of [-1, 1]) {
      const gl = 52.5 * s;
      // penalty area, goal area, spot, arc, corner arcs
      strip(gl, gl - s * 16.5, 20.16 - h, 20.16 + h); strip(gl, gl - s * 16.5, -20.16 - h, -20.16 + h); strip(gl - s * 16.5 - h, gl - s * 16.5 + h, -20.16, 20.16);
      strip(gl, gl - s * 5.5, 9.16 - h, 9.16 + h); strip(gl, gl - s * 5.5, -9.16 - h, -9.16 + h); strip(gl - s * 5.5 - h, gl - s * 5.5 + h, -9.16, 9.16);
      spot(gl - s * 11, 0, 0.12);
      ring(gl - s * 11, 0, 9.15, (s > 0 ? Math.PI : 0) - 0.927, 1.854, 48);
      for (const sz of [-1, 1]) {
        // a quarter circle into the pitch: θ is measured from +x toward −z (RingGeometry, laid flat)
        const t0 = s > 0 ? (sz > 0 ? 0 : Math.PI / 2) + Math.PI / 2 : (sz > 0 ? -Math.PI / 2 : 0);
        ring(gl, 34 * sz, 1.0, t0, Math.PI / 2, 12);
      }
    }
    // corner flags
    const pole = this.m.postWhite, flag = Mat.std('#e8b91c', { roughness: 0.7, side: THREE.DoubleSide });
    for (const s of [-1, 1]) for (const sz of [-1, 1]) {
      B.add(new THREE.CylinderGeometry(0.02, 0.02, 1.5, 6), pole, Geo.matrix(52.5 * s, 0.75, 34 * sz));
      B.add(Geo.quad([52.5 * s, 1.15, 34 * sz], [52.5 * s - s * 0.42, 1.25, 34 * sz], [52.5 * s - s * 0.42, 1.5, 34 * sz], [52.5 * s, 1.5, 34 * sz]), flag, null, { noShadow: true });
    }
  }

  /* ---------------- the stands ---------------- */
  // stepped concrete, seats, aisles; long stands along x (s = ±1 in z), end stands along z (s = ±1 in x)
  _stands() {
    const B = this.batch, m = this.m, S = SND_ST.side, E = SND_ST.end;
    // long stands
    for (const s of [-1, 1]) {
      const aisles = [-49, -35, -21, -7, 7, 21, 35, 49];
      for (let r = 0; r < S.rows; r++) {
        const y = S.y0 + r * S.dy, za = S.d0 + (r - 0.5) * S.dz, zb = S.d0 + (r + 0.5) * S.dz;
        const z0 = s > 0 ? za : -zb, z1 = s > 0 ? zb : -za;
        B.add(Geo.flat(S.x0, S.x1, z0, z1, y, 2), m.tread, null);
        // the riser in front of this tread (row 0: the front wall)
        const yb = r === 0 ? 0 : y - S.dy, zf = s * za;
        B.add(s > 0 ? Geo.quad([S.x1, yb, zf], [S.x0, yb, zf], [S.x0, y, zf], [S.x1, y, zf], 0, 0, (S.x1 - S.x0) / 4, (y - yb) / 4)
          : Geo.quad([S.x0, yb, zf], [S.x1, yb, zf], [S.x1, y, zf], [S.x0, y, zf], 0, 0, (S.x1 - S.x0) / 4, (y - yb) / 4), m.riser, null);
        // seats between the aisles (folded-down pans and backs), a yellow nosing on the aisle steps
        const zs = s * (S.d0 + r * S.dz + 0.16), zbk = s * (S.d0 + r * S.dz + 0.36);
        let xa = S.x0 + 0.3;
        for (const ax of [...aisles, S.x1 - 0.3 + 0.6]) {
          const xb = ax - 0.6;
          if (xb - xa > 0.5) {
            B.box(xb - xa, 0.07, 0.36, (xa + xb) / 2, y + 0.42, zs, m.seat, 0, { noShadow: true });
            B.box(xb - xa, 0.34, 0.05, (xa + xb) / 2, y + 0.62, zbk, m.seat, 0, { noShadow: true });
          }
          xa = ax + 0.6;
        }
        for (const ax of aisles) B.box(1.2, 0.02, 0.06, ax, y + 0.005, s * (S.d0 + (r - 0.5) * S.dz + 0.04), m.stepEdge, 0, { noShadow: true });
      }
      // front parapet, the back wall (taller than the top row), the side walls (stepped profile)
      const zF = s * (S.d0 - 0.5 * S.dz), topY = S.y0 + (S.rows - 1) * S.dy, zBk = s * (S.d0 + (S.rows - 0.5) * S.dz);
      B.box(S.x1 - S.x0, 0.12, 0.25, 0, S.y0 + 0.06, zF + s * 0.12, m.wall);
      const backH = s > 0 ? 12.6 : 12.4;
      B.add(Geo.boxSides(S.x0, S.x1, 0, backH, Math.min(zBk, zBk + s * 0.5), Math.max(zBk, zBk + s * 0.5), 4, 4), m.wall, null);
      B.box(S.x1 - S.x0, 0.9, 0.12, 0, topY + 0.45, zBk - s * 0.06, m.wall);
      for (const x of [S.x0, S.x1]) {
        // the side walls: a stepped profile (one block per row), then the tall end of the back wall
        const ox = x > 0 ? x + 0.2 : x - 0.2;
        for (let r = 0; r < S.rows; r++) { const y = S.y0 + r * S.dy + 1.0; B.box(0.4, y, S.dz, ox, y / 2, s * (S.d0 + r * S.dz), m.wall); }
      }
    }
    // end stands
    for (const s of [-1, 1]) {
      const aisles = [-20, -6.5, 6.5, 20];
      for (let r = 0; r < E.rows; r++) {
        const y = E.y0 + r * E.dy, xa = E.d0 + (r - 0.5) * E.dz, xb = E.d0 + (r + 0.5) * E.dz;
        const x0 = s > 0 ? xa : -xb, x1 = s > 0 ? xb : -xa;
        B.add(Geo.flat(x0, x1, E.z0, E.z1, y, 2), m.tread, null);
        const yb = r === 0 ? 0 : y - E.dy, xf = s * xa;
        B.add(s > 0 ? Geo.quad([xf, yb, E.z0], [xf, yb, E.z1], [xf, y, E.z1], [xf, y, E.z0], 0, 0, (E.z1 - E.z0) / 4, (y - yb) / 4)
          : Geo.quad([xf, yb, E.z1], [xf, yb, E.z0], [xf, y, E.z0], [xf, y, E.z1], 0, 0, (E.z1 - E.z0) / 4, (y - yb) / 4), m.riser, null);
        const xs = s * (E.d0 + r * E.dz + 0.16), xbk = s * (E.d0 + r * E.dz + 0.36);
        let za = E.z0 + 0.3;
        for (const az of [...aisles, E.z1 - 0.3 + 0.6]) {
          const zb = az - 0.6;
          if (zb - za > 0.5) {
            B.box(0.36, 0.07, zb - za, xs, y + 0.42, (za + zb) / 2, m.seat, 0, { noShadow: true });
            B.box(0.05, 0.34, zb - za, xbk, y + 0.62, (za + zb) / 2, m.seat, 0, { noShadow: true });
          }
          za = az + 0.6;
        }
      }
      const xF = s * (E.d0 - 0.5 * E.dz), xBk = s * (E.d0 + (E.rows - 0.5) * E.dz), topY = E.y0 + (E.rows - 1) * E.dy;
      B.box(0.25, 0.12, E.z1 - E.z0, xF + s * 0.12, E.y0 + 0.06, 0, m.wall);
      B.add(Geo.boxSides(Math.min(xBk, xBk + s * 0.5), Math.max(xBk, xBk + s * 0.5), 0, topY + 2.2, E.z0 - 0.4, E.z1 + 0.4, 4, 4), m.wall, null);
      for (const z of [E.z0 - 0.4, E.z1]) B.add(Geo.boxSides(Math.min(xF, xBk), Math.max(xF, xBk), 0, topY + 1.0, z, z + 0.4, 4, 4), m.wall, null);
    }
  }

  /* ---------------- the main stand's roof (you stand under it at the end) ---------------- */
  _roof() {
    const B = this.batch, m = this.m, x0 = -58, x1 = 58, zf = 41.8, zb = 61.5, yf = 17.2, yb = 18.6;
    B.add(Geo.quad([x0, yf + 0.3, zf], [x1, yf + 0.3, zf], [x1, yb + 0.3, zb], [x0, yb + 0.3, zb]), m.roofTop, null);
    B.add(Geo.quad([x1, yf, zf], [x0, yf, zf], [x0, yb, zb], [x1, yb, zb]), m.roofUnder, null);
    B.box(x1 - x0, 1.25, 0.3, 0, yf - 0.2, zf, m.fascia);
    // the open gap between the back wall and the roof: glazing
    B.add(Geo.quad([x1, 12.6, 59.6], [x0, 12.6, 59.6], [x0, yb, 59.6], [x1, yb, 59.6]), m.glazing, null, { noShadow: true });
    // columns behind the stand and roof trusses (ribs under the roof every 14 m)
    for (let x = -56; x <= 56; x += 14) {
      B.add(new THREE.CylinderGeometry(0.35, 0.4, yb, 10), m.mast, Geo.matrix(x, yb / 2, 60.6));
      const L = Math.hypot(zb - zf, yb - yf);
      B.add(new THREE.BoxGeometry(0.25, 0.7, L), m.mast, Geo.matrix(x, (yf + yb) / 2 - 0.4, (zf + zb) / 2, -Math.atan2(yb - yf, zb - zf), 0, 0));
    }
    // the roof loudspeaker cluster (front edge, middle)
    const P = SND.pa.speakers[0];
    for (const dx of [-0.75, 0, 0.75]) B.box(0.6, 0.9, 0.55, P.x + dx, P.y, P.z, m.speaker, dx * 0.6);
  }

  /* ---------------- floodlight masts with the loudspeaker clusters ---------------- */
  _masts() {
    const B = this.batch, m = this.m, H = 44;
    SND_ST.towers.forEach(([tx, tz], i) => {
      const legs = [[-1, -1], [1, -1], [1, 1], [-1, 1]], wb = 1.6, wt = 0.7;
      const at = (k, y) => { const w = wb + (wt - wb) * y / H; return [tx + legs[k][0] * w, y, tz + legs[k][1] * w]; };
      for (let k = 0; k < 4; k++) {
        const a = at(k, 0), b = at(k, H), L = Math.hypot(b[0] - a[0], H, b[2] - a[2]);
        const mm = new THREE.Matrix4().makeTranslation((a[0] + b[0]) / 2, H / 2, (a[2] + b[2]) / 2);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(b[0] - a[0], H, b[2] - a[2]).normalize());
        B.add(new THREE.CylinderGeometry(0.11, 0.16, L, 6), m.mast, mm.multiply(new THREE.Matrix4().makeRotationFromQuaternion(q)));
      }
      // bracing: rings every 4 m, a diagonal in each face
      for (let y = 2; y < H; y += 4) {
        for (let k = 0; k < 4; k++) {
          const a = at(k, y), b = at((k + 1) % 4, y), c = at((k + 1) % 4, y + 4);
          const seg = (p, q2, r) => { const dx = q2[0] - p[0], dy = q2[1] - p[1], dz = q2[2] - p[2], L = Math.hypot(dx, dy, dz);
            const qq = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, dz).normalize());
            B.add(new THREE.CylinderGeometry(r, r, L, 4), m.mast, new THREE.Matrix4().makeTranslation((p[0] + q2[0]) / 2, (p[1] + q2[1]) / 2, (p[2] + q2[2]) / 2).multiply(new THREE.Matrix4().makeRotationFromQuaternion(qq)), { noShadow: true }); };
          seg(a, b, 0.05); if (y + 4 < H) seg(a, c, 0.04);
        }
      }
      // the lamp head: a frame facing the pitch, tilted down
      const yaw = Math.atan2(-tx, -tz), head = new THREE.Group();
      const frame = Mat.std('#9da3a8', { roughness: 0.5, metalness: 0.5 });
      const lamp = new THREE.MeshStandardMaterial({ color: '#e9eef2', emissive: new THREE.Color('#fff8e8'), emissiveIntensity: 0.25, roughness: 0.3, name: 'lampFace' });
      const box = new THREE.Mesh(new THREE.BoxGeometry(9, 5.2, 0.6), frame); head.add(box);
      for (let ix = 0; ix < 6; ix++) for (let iy = 0; iy < 4; iy++) { const l = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 0.2), lamp); l.position.set(-3.75 + ix * 1.5, -1.8 + iy * 1.2, -0.4); head.add(l); }
      head.position.set(tx, H + 2.4, tz); head.rotation.set(0, yaw + Math.PI, 0, 'YXZ'); head.rotateX(0.42);
      head.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
      this.root.add(head);
      // the loudspeaker cluster (26 m up, on the pitch side of the mast)
      const P = SND.pa.speakers[i + 1];
      for (const dy of [-0.55, 0.55]) for (const da of [-0.35, 0.35]) B.add(new THREE.BoxGeometry(0.75, 1.0, 0.7), m.speaker, Geo.matrix(P.x + Math.cos(yaw + da) * 0.4, P.y + dy, P.z - Math.sin(yaw + da) * 0.4, 0.15, yaw + da, 0));
      B.box(0.25, 0.25, 2.4, (P.x + tx) / 2, P.y, (P.z + tz) / 2, m.mast, yaw);
    });
  }

  /* ---------------- LED boards round the pitch ---------------- */
  _boards() {
    const B = this.batch, txts = ['WHAT HAPPENS IF', 'MATCHDAY', 'CITY STADIUM', 'WHAT HAPPENS IF', 'SEASON TICKETS', 'KICK OFF 15:00'];
    const cols = [['#0e2244', '#ffd23d'], ['#f2f2ea', '#0e2244'], ['#ffd23d', '#0e2244']];
    const mats = txts.map((t, i) => {
      const W = 1024, H = 96, c = Tex.canvas(W, H), x = c.getContext('2d'), [bg, fg] = cols[i % cols.length];
      x.fillStyle = bg; x.fillRect(0, 0, W, H); x.fillStyle = fg; x.font = `700 64px ${Tex.fontCond}`; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(t, W / 2, H / 2 + 3);   // (no LED pixel lines: at a distance they shimmer)
      return new THREE.MeshBasicMaterial({ map: Tex.tex(c, { repeat: false }), color: new THREE.Color(0.86, 0.86, 0.86), name: 'ledBoard',
        polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });   // (no z-fighting with the box behind at 100 m)
    });
    const back = Mat.std('#22262b', { roughness: 0.7 });
    const L = 10, h = 0.9;
    let k = 0;
    // along the touchlines (facing the pitch), then behind each goal line (with a gap behind the goal)
    for (const s of [-1, 1]) for (let x = -50; x < 50; x += L) {
      const z = s * 37.4, M = mats[k++ % mats.length];
      B.add(s > 0 ? Geo.quad([x + L, 0.05, z], [x, 0.05, z], [x, 0.05 + h, z], [x + L, 0.05 + h, z]) : Geo.quad([x, 0.05, z], [x + L, 0.05, z], [x + L, 0.05 + h, z], [x, 0.05 + h, z]), M, null, { noShadow: true });
      B.box(L, h, 0.2, x + L / 2, 0.05 + h / 2, z + s * 0.17, back, 0, { noShadow: true });
    }
    for (const s of [-1, 1]) for (const [z0, z1] of [[-30, -10], [-10, -5], [5, 10], [10, 30]]) {
      const x = s * 57.6, M = mats[k++ % mats.length];
      B.add(s > 0 ? Geo.quad([x, 0.05, z0], [x, 0.05, z1], [x, 0.05 + h, z1], [x, 0.05 + h, z0]) : Geo.quad([x, 0.05, z1], [x, 0.05, z0], [x, 0.05 + h, z0], [x, 0.05 + h, z1]), M, null, { noShadow: true });
      B.box(0.2, h, z1 - z0, x + s * 0.17, 0.05 + h / 2, (z0 + z1) / 2, back, 0, { noShadow: true });
    }
  }

  /* ---------------- the big screen (over the west end stand): a live canvas ---------------- */
  _screen() {
    const S = SND_ST.screen, B = this.batch, m = this.m;
    const c = Tex.canvas(640, 360);
    this.scr = { c, x: c.getContext('2d'), key: '' };
    this.scrTex = Tex.tex(c, { repeat: false });
    const mat = new THREE.MeshBasicMaterial({ map: this.scrTex, toneMapped: false, name: 'bigScreen' });
    const g = Geo.quad([S.x, S.y - S.h / 2, S.z + S.w / 2], [S.x, S.y - S.h / 2, S.z - S.w / 2], [S.x, S.y + S.h / 2, S.z - S.w / 2], [S.x, S.y + S.h / 2, S.z + S.w / 2]);
    const mesh = new THREE.Mesh(g, mat); this.root.add(mesh);
    B.box(0.8, S.h + 0.8, S.w + 0.8, S.x - 0.42, S.y, S.z, m.speaker);
    for (const dz of [-5, 5]) B.box(0.5, S.y - S.h / 2, 0.5, S.x - 0.6, (S.y - S.h / 2) / 2, S.z + dz, m.mast);
    this._drawScreen(0);
  }

  _drawScreen(t) {
    const P = SND.pa, K = SND_BALL;
    let mode = 'logo', mouth = 0, words = 0;
    if (t >= SND.cuts[1] - 0.5 && t < SND.cuts[2]) {
      mode = 'live';
      const u = t - P.speak;
      if (u >= 0 && u < 1.45) mouth = Math.round(Math.abs(Math.sin(Math.PI * u / 0.2)) * 4) / 4;
      words = u < 0 ? 0 : Math.min(3, 1 + Math.floor(u / 0.45));
    } else if (t >= SND.cuts[2]) mode = t < K.tGoal ? 'score0' : t < K.tGoal + 3.5 ? 'goal' : 'score1';
    const blink = mode === 'goal' ? Math.floor((t - K.tGoal) * 4) % 2 : 0;
    const key = `${mode}|${mouth}|${words}|${blink}`;
    if (key === this.scr.key) return;
    this.scr.key = key;
    const x = this.scr.x, W = 640, H = 360;
    x.save();
    x.fillStyle = '#0b1830'; x.fillRect(0, 0, W, H);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    if (mode === 'logo') {
      x.fillStyle = '#ffd23d'; x.font = `700 46px ${Tex.fontCond}`; x.fillText('WELCOME TO', W / 2, 120);
      x.fillStyle = '#f2f2ea'; x.font = `700 84px ${Tex.fontCond}`; x.fillText('CITY STADIUM', W / 2, 200);
      x.fillStyle = '#9fb3cf'; x.font = `600 34px ${Tex.fontCond}`; x.fillText('MATCHDAY · KICK OFF 15:00', W / 2, 280);
    } else if (mode === 'live') {
      // the announcer, live: a studio backdrop, head and shoulders, a mouth that moves
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a4c7c'); g.addColorStop(1, '#10203c'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.fillStyle = 'rgba(255,255,255,0.06)'; for (let i = 0; i < 8; i++) x.fillRect(40 + i * 80, 0, 30, H);
      x.fillStyle = '#1d2433'; x.beginPath(); x.moveTo(170, H); x.quadraticCurveTo(190, 236, 320, 228); x.quadraticCurveTo(450, 236, 470, H); x.fill();   // suit
      x.fillStyle = '#e8e4da'; x.beginPath(); x.moveTo(296, 232); x.lineTo(320, 290); x.lineTo(344, 232); x.fill();                                 // shirt
      x.fillStyle = '#a8322b'; x.beginPath(); x.moveTo(314, 240); x.lineTo(326, 240); x.lineTo(330, 300); x.lineTo(320, 312); x.lineTo(310, 300); x.fill();   // tie
      x.fillStyle = '#d29c78'; x.fillRect(300, 196, 40, 40);                                                                                           // neck
      x.beginPath(); x.ellipse(320, 150, 58, 72, 0, 0, Math.PI * 2); x.fill();                                                                          // head
      x.fillStyle = '#2b1d16'; x.beginPath(); x.ellipse(320, 104, 62, 34, 0, Math.PI, Math.PI * 2); x.fill(); x.fillRect(258, 100, 124, 14);           // hair
      x.fillStyle = '#2a1a14'; for (const ex of [298, 342]) { x.beginPath(); x.ellipse(ex, 140, 6, 5, 0, 0, Math.PI * 2); x.fill(); }                  // eyes
      x.fillStyle = '#5a1f1c'; x.beginPath(); x.ellipse(320, 186, 20, 3 + 14 * mouth, 0, 0, Math.PI * 2); x.fill();                                     // mouth
      x.fillStyle = '#c4362e'; x.fillRect(24, 22, 92, 36); x.fillStyle = '#fff'; x.font = `700 28px ${Tex.fontCond}`; x.fillText('LIVE', 70, 41);
      // lower third: the words as they are spoken (here, on screen, instantly)
      x.fillStyle = 'rgba(8,16,32,0.9)'; x.fillRect(0, 286, W, 74); x.fillStyle = '#ffd23d'; x.fillRect(0, 286, 12, 74);
      x.fillStyle = '#f2f2ea'; x.font = `700 44px ${Tex.fontCond}`;
      x.fillText(['', 'LADIES…', 'LADIES AND…', 'LADIES AND GENTLEMEN…'][words] || '', W / 2, 324);
    } else {
      const sc = mode === 'score0' ? '0 – 0' : '1 – 0';
      if (mode === 'goal') {
        x.fillStyle = blink ? '#ffd23d' : '#0b1830'; x.fillRect(0, 0, W, H);
        x.fillStyle = blink ? '#0b1830' : '#ffd23d'; x.font = `700 170px ${Tex.fontCond}`; x.fillText('GOAL!', W / 2, H / 2 + 6);
      } else {
        x.fillStyle = '#f2f2ea'; x.font = `700 56px ${Tex.fontCond}`; x.fillText('CITY', 170, 120); x.fillText('ROVERS', 470, 120);
        x.fillStyle = '#ffd23d'; x.font = `700 130px ${Tex.fontCond}`; x.fillText(sc, W / 2, 236);
      }
    }
    // LED pixel grid
    x.fillStyle = 'rgba(0,0,0,0.22)'; for (let i = 0; i < W; i += 3) x.fillRect(i, 0, 1, H); for (let j = 0; j < H; j += 3) x.fillRect(0, j, W, 1);
    x.restore();
    this.scrTex.needsUpdate = true;
  }

  /* ---------------- the goals (frames) and their nets (the east net bulges with the ball) ---------------- */
  _goals() {
    const B = this.batch, w = this.m.postWhite, r = 0.06, D = 2.0;
    for (const s of [-1, 1]) {
      const gx = 52.5 * s;
      for (const z of [-3.66, 3.66]) B.add(new THREE.CylinderGeometry(r, r, 2.44, 10), w, Geo.matrix(gx, 1.22, z));
      B.add(new THREE.CylinderGeometry(r, r, 7.32 + 2 * r, 10), w, Geo.matrix(gx, 2.44, 0, Math.PI / 2, 0, 0));
      // the back frame (thin, grey)
      const g = Mat.std('#c8ccd0', { roughness: 0.5, metalness: 0.4 });
      for (const z of [-3.66, 3.66]) { B.add(new THREE.CylinderGeometry(0.025, 0.025, D, 6), g, Geo.matrix(gx + s * D / 2, 2.44, z, 0, 0, Math.PI / 2)); B.add(new THREE.CylinderGeometry(0.025, 0.025, 2.44, 6), g, Geo.matrix(gx + s * D, 1.22, z)); }
      B.add(new THREE.CylinderGeometry(0.025, 0.025, 7.32, 6), g, Geo.matrix(gx + s * D, 2.44, 0, Math.PI / 2, 0, 0));
    }
  }

  _nets() {
    const c = Tex.canvas(64, 64), x = c.getContext('2d');
    x.clearRect(0, 0, 64, 64); x.fillStyle = '#ffffff'; x.fillRect(0, 0, 64, 4); x.fillRect(0, 0, 4, 64);
    const tex = Tex.tex(c, { srgb: true, repeat: true });
    const mk = () => new THREE.MeshStandardMaterial({ map: tex.clone(), alphaTest: 0.35, transparent: false, side: THREE.DoubleSide, roughness: 0.8, color: '#f4f4f0', name: 'net' });
    const cell = 0.12;
    this.nets = [];
    for (const s of [-1, 1]) {
      const gx = 52.5 * s, D = 2.0;
      // back (vertical, segmented so it can bulge), roof, sides
      const back = new THREE.PlaneGeometry(7.32, 2.44, 36, 12);
      const mb = mk(); mb.map.repeat.set(7.32 / cell, 2.44 / cell); mb.map.needsUpdate = true;
      const bm = new THREE.Mesh(back, mb); bm.position.set(gx + s * D, 1.22, 0); bm.rotation.y = Math.PI / 2; this.root.add(bm);
      const roof = new THREE.PlaneGeometry(D, 7.32), mr = mk(); mr.map.repeat.set(D / cell, 7.32 / cell); mr.map.needsUpdate = true;
      const rm = new THREE.Mesh(roof, mr); rm.position.set(gx + s * D / 2, 2.44, 0); rm.rotation.x = -Math.PI / 2; this.root.add(rm);
      for (const z of [-3.66, 3.66]) { const sd = new THREE.PlaneGeometry(D, 2.44), ms = mk(); ms.map.repeat.set(D / cell, 2.44 / cell); ms.map.needsUpdate = true; const sm = new THREE.Mesh(sd, ms); sm.position.set(gx + s * D / 2, 1.22, z); this.root.add(sm); }
      for (const o of [bm, rm]) { o.castShadow = false; o.receiveShadow = true; }
      this.nets.push({ s, mesh: bm, base: Float32Array.from(back.attributes.position.array) });
    }
  }

  /* ---------------- outside: the city round the stadium, trees ---------------- */
  _outside() {
    const B = this.batch, rng = this.rng.fork(7), styles = ['tanbrick', 'cream', 'modern', 'stone', 'glassblue', 'redbrick', 'sage', 'whitebrick', 'glassteal'];
    this.city = [];                                    // (the roofs: the birds on them, waves.js)
    for (let i = 0; i < 150; i++) {
      const a = rng.range(0, Math.PI * 2), r = rng.range(170, 720);
      const x = Math.cos(a) * r, z = Math.sin(a) * r * 1.1;
      const w = rng.range(18, 40), d = rng.range(18, 36), h = rng.range(12, 34) + (r > 400 ? rng.range(10, 70) : 0);
      const st = this.facades[rng.pick(styles)];
      B.add(Geo.boxSides(x - w / 2, x + w / 2, 0, h, z - d / 2, z + d / 2, st.tileW, st.tileH), st.mat, null, { noShadow: true });
      B.add(Geo.flat(x - w / 2, x + w / 2, z - d / 2, z + d / 2, h, 5), this.m.roof, null, { noShadow: true });
      this.city.push({ x, z, w, d, h });
    }
    const tr = this.rng.fork(8);
    for (let i = 0; i < 70; i++) {
      const a = (i / 70) * Math.PI * 2 + tr.range(-0.03, 0.03), r = 112 + tr.range(0, 30);
      this._tree(Math.cos(a) * r, Math.sin(a) * r * 0.85, tr, tr.range(1.5, 2.1));
    }
  }

  /* ---------------- lightning: a jagged bolt (with branches) under the storm's base ---------------- */
  _lightning() {
    this.bolts = [SND.flash, SND.flash2].map((F, bi) => {
      const rng = new RNG(900 + bi), n = 26, pts = [];
      let x = 0;
      for (let i = 0; i <= n; i++) { const y = F.base * (1 - i / n); x += rng.range(-1, 1) * 38; pts.push([x * (0.4 + 0.6 * i / n), y]); }
      pts[n][0] = 0;
      const branches = [];
      for (const k of [6, 11, 17]) { let bx = pts[k][0], by = pts[k][1]; const b = [[bx, by]]; for (let j = 0; j < 7; j++) { bx += rng.range(10, 45) * (k % 2 ? 1 : -1); by -= rng.range(25, 60); b.push([bx, by]); } branches.push(b); }
      const ribbon = (line, w) => {
        const pos = [];
        for (let i = 0; i < line.length - 1; i++) {
          const [ax, ay] = line[i], [bx, by] = line[i + 1];
          pos.push(ax - w, ay, 0, ax + w, ay, 0, bx + w, by, 0, ax - w, ay, 0, bx + w, by, 0, bx - w, by, 0);
        }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); return g;
      };
      const core = new THREE.MeshBasicMaterial({ color: '#f4f1ff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false, side: THREE.DoubleSide });
      const glow = new THREE.MeshBasicMaterial({ color: '#8f95ff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false, side: THREE.DoubleSide });
      const grp = new THREE.Group();
      const W = F.w || 1;
      grp.add(new THREE.Mesh(ribbon(pts, 4.2 * W), core), new THREE.Mesh(ribbon(pts, 15 * W), glow));
      for (const b of branches) grp.add(new THREE.Mesh(ribbon(b, 2.2 * W), core), new THREE.Mesh(ribbon(b, 8 * W), glow));
      grp.position.set(F.x, 0, F.z);
      grp.rotation.y = Math.atan2(-F.x, -F.z);           // face the stadium
      grp.traverse((o) => { if (o.isMesh) { o.frustumCulled = false; o.renderOrder = -5; } });
      grp.visible = false;
      this.scene.add(grp);
      return { F, grp, core, glow };
    });
  }

  update(t) {
    this.skyUniforms.uTime.value = t;
    // the lightning: three return strokes in 0.2 s; the sky lights where it struck
    let fl = 0, flDir = null;
    for (const b of this.bolts) {
      const k = sndFlashLevel(t, b.F.t);
      b.grp.visible = k > 0.03;
      b.core.opacity = Math.min(1, k * 1.5); b.glow.opacity = Math.min(0.8, k * 0.7);
      if (k > fl) { fl = k; flDir = b.F; }
    }
    this.skyUniforms.uFlash.value = fl;
    if (flDir) { const v = new THREE.Vector2(flDir.x, flDir.z).normalize(); this.skyUniforms.uFlashDir.value.copy(v); }
    // the big screen
    this._drawScreen(t);
    // the east net: the ball pushes it out, it springs back
    const N = this.nets[1], bulge = sndNetBulge(t);
    if (N) {
      const pos = N.mesh.geometry.attributes.position, b = N.base;
      if (bulge.depth > 0.001 || N.dirty) {
        for (let i = 0; i < pos.count; i++) {
          // (plane local: x along the goal's width (−z world), y up; local +z points out of the goal (world +x))
          const lx = b[i * 3], ly = b[i * 3 + 1], wz = -lx, wy = ly + 1.22;
          const f = Math.exp(-((wz - bulge.z) ** 2 + (wy - bulge.y) ** 2) / 0.55);
          pos.setZ(i, bulge.depth * f);
        }
        pos.needsUpdate = true; N.dirty = bulge.depth > 0.001;
      }
    }
  }
}
