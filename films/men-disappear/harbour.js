/* =====================================================================
   HARBOUR — the world outside the train: a late-afternoon sky with broken cloud, the harbour water (with the
   ship's bow wave, its wake and the impact's splashes in the shader), the waterfront on the left (a seawall, a
   promenade, the road, a row of buildings, a skyline), the inner basin, the far shores (a container terminal,
   hills, a town) and a few ships at anchor. A subclass of the shared Environment (its materials, facades and
   shop fronts); everything specific to this film is built here.
   ===================================================================== */

const MD_SUN = new THREE.Vector3(-0.66, 0.24, 0.52).normalize();   // low, behind-left of the train: the ship (to the right) is front-lit

class MdHarbour extends Environment {
  build() {
    this._materials();
    this._sky();
    this._lights();
    this._water();
    this._land();
    this._city();
    this._farShores();
    this._anchored();
    this.batch.build(this.root, 'env');
    this._environmentMap();
  }

  /* ---------------- sky: late afternoon, broken cloud, a warm sun low behind you ---------------- */
  _sky() {
    this.sunDir = MD_SUN.clone();
    const zenith = new THREE.Color('#4f6378'), horizon = new THREE.Color('#b9b6a8');
    this.horizonColor = horizon.clone();
    this.fogColor = new THREE.Color('#9a9d96');
    this.skyUniforms = {
      uZenith: { value: zenith }, uHorizon: { value: horizon }, uGround: { value: new THREE.Color('#5a5d58') },
      uSunDir: { value: this.sunDir }, uSunColor: { value: new THREE.Color('#ffd09a') }, uTime: { value: 0 },
      uGlow: { value: new THREE.Vector4(0, 0, 0, 0) }, uGlowColor: { value: new THREE.Color('#ff7a2a') }, uCloud: { value: 1 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.skyUniforms, side: THREE.BackSide, depthWrite: false,
      vertexShader: /* glsl */`
        varying vec3 vDir;
        void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */`
        uniform vec3 uZenith, uHorizon, uGround, uSunDir, uSunColor, uGlowColor; uniform float uTime, uCloud; uniform vec4 uGlow; varying vec3 vDir;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
          return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y); }
        float fbm(vec2 p){ float v = 0.0, a = 0.5; for(int i=0;i<6;i++){ v += a*noise(p); p = p*2.03 + 7.1; a *= 0.5; } return v; }
        void main(){
          vec3 d = normalize(vDir); float h = d.y;
          float sd = max(dot(d, uSunDir), 0.0);
          // warmer toward the sun, cooler away from it
          vec3 hor = mix(uHorizon * vec3(0.92, 0.97, 1.05), uHorizon * vec3(1.12, 1.0, 0.86), pow(sd, 2.0));
          vec3 col = mix(hor, uZenith, pow(clamp(h, 0.0, 1.0), 0.5));
          col = mix(col, uGround, smoothstep(0.0, -0.05, h));
          col += uSunColor * (pow(sd, 6.0) * 0.18 + pow(sd, 60.0) * 0.5 + pow(sd, 900.0) * 3.0);
          if (h > -0.02) {
            vec2 uv = d.xz / (h + 0.16) * 0.55 + vec2(uTime * 0.004, uTime * 0.0016);
            float c = fbm(uv), c2 = fbm(uv * 2.7 + 3.1);
            float cover = smoothstep(0.46, 0.66, c + (c2 - 0.5) * 0.18);          // broken cloud with gaps of sky
            float thick = smoothstep(0.5, 0.85, c);
            vec3 lit = mix(vec3(0.86, 0.84, 0.8), uSunColor * 1.05, pow(sd, 3.0) * 0.8);   // sun-facing edges glow warm
            vec3 shade = mix(uZenith * 0.95, vec3(0.42, 0.45, 0.5), thick);
            vec3 cl = mix(lit, shade, clamp(thick * 0.9 + (0.5 - c2) * 0.3, 0.0, 1.0)) * uCloud;
            cl = mix(cl, hor, smoothstep(0.25, 0.0, h) * 0.6);                    // clouds fade into the horizon haze
            col = mix(col, cl, cover * 0.92 * smoothstep(-0.02, 0.12, h));
          }
          // the burning city lights the underside of the smoke and cloud (uGlow: direction xz, spread, strength)
          float gd = max(dot(normalize(vec2(d.x, d.z)), uGlow.xy), 0.0);
          col += uGlowColor * uGlow.w * pow(gd, uGlow.z) * exp(-max(h, 0.0) * 6.0);
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(2800, 48, 24), mat);
    sky.name = 'sky'; sky.frustumCulled = false; sky.renderOrder = -10;
    this.scene.add(sky); this.sky = sky;
    this.scene.fog = new THREE.FogExp2(this.fogColor.clone(), 0.00135);
    this.scene.background = horizon.clone();
  }

  _lights() {
    const sun = new THREE.DirectionalLight('#ffdcae', 2.7);
    sun.castShadow = CONFIG.render.shadows;
    sun.shadow.mapSize.set(CONFIG.render.shadowMapSize, CONFIG.render.shadowMapSize);
    const sc = sun.shadow.camera; sc.left = -70; sc.right = 70; sc.top = 70; sc.bottom = -70; sc.near = 5; sc.far = 600;
    sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.04; sun.shadow.radius = 3;
    this.scene.add(sun, sun.target); this.sun = sun;
    sun.position.copy(this.sunDir).multiplyScalar(250); sun.target.position.set(0, 20, 0);
    const hemi = new THREE.HemisphereLight('#a3b2c2', '#3d3c36', 1.05);
    this.scene.add(hemi); this.hemi = hemi;
  }

  // the sun's shadow box follows a point (the train, the ship, the pier)
  focus(x, y, z, r = 70) {
    const s = this.sun, sc = s.shadow.camera;
    if (sc.right !== r) { sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r; sc.updateProjectionMatrix(); }
    s.target.position.set(x, y, z); s.target.updateMatrixWorld();
    s.position.copy(this.sunDir).multiplyScalar(250).add(s.target.position);
  }

  /* ---------------- water ---------------- */
  _water() {
    const g = new THREE.PlaneGeometry(9000, 9000, 1, 1); g.rotateX(-Math.PI / 2);
    this.WU = Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), {
      uTime: { value: 0 }, uSkyH: { value: new THREE.Color('#b4b5aa') }, uSkyZ: { value: new THREE.Color('#5d7186') },
      uDeep: { value: new THREE.Color('#1b2a2c') }, uSunDir: { value: this.sunDir }, uSun: { value: new THREE.Color('#ffd8a0') },
      uShip: { value: new THREE.Vector4(0, 0, 0, 0) },     // bow x, bow z, heading (rad, aft direction), speed
      uShipDim: { value: new THREE.Vector2(180, 30) },
      uHit: { value: new THREE.Vector4(0, 0, -100, 0) },    // impact x, z, time, strength
      uSplash: { value: new THREE.Vector4(0, 0, -100, 0) }, // the span's splash x, z, time, length
      uSewage: { value: new THREE.Vector4(-30, 21, 0, 0) },  // outfall x, z, reach (m), amount
      uGlowW: { value: new THREE.Vector4(0, 0, 0, 0) },      // a fire on the water: x, z, radius, strength (lights the water orange)
    });
    this.waterMat = new THREE.ShaderMaterial({
      uniforms: this.WU, fog: true,
      vertexShader: /* glsl */`
        varying vec3 vW;
        ${THREE.ShaderChunk.fog_pars_vertex}
        void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
          ${THREE.ShaderChunk.fog_vertex}
        }`,
      fragmentShader: /* glsl */`
        uniform float uTime; uniform vec3 uSkyH, uSkyZ, uDeep, uSunDir, uSun; uniform vec4 uShip, uHit, uSplash, uSewage, uGlowW; uniform vec2 uShipDim; varying vec3 vW;
        ${THREE.ShaderChunk.fog_pars_fragment}
        float wh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float wn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(wh(i), wh(i+vec2(1,0)), f.x), mix(wh(i+vec2(0,1)), wh(i+vec2(1,1)), f.x), f.y); }
        float ridge(vec2 p){ return 1.0 - abs(wn(p) * 2.0 - 1.0); }
        void main(){
          vec2 P = vW.xz; float dist = length(cameraPosition - vW); float fade = 1.0 / (1.0 + dist / 140.0);
          // small wind waves: normals from a few octaves of noise (finer close up)
          float t = uTime;
          vec2 g1 = vec2(wn(P * 0.11 + vec2(t * 0.07, t * 0.03)) - 0.5, wn(P * 0.11 + vec2(4.1 - t * 0.05, 2.3 + t * 0.06)) - 0.5);
          vec2 g2 = vec2(wn(P * 0.37 + vec2(t * 0.21, -t * 0.12) + 9.0) - 0.5, wn(P * 0.37 + vec2(-t * 0.15, t * 0.2) + 3.0) - 0.5);
          vec2 g3 = vec2(wn(P * 1.3 + vec2(t * 0.6, t * 0.2)) - 0.5, wn(P * 1.3 + vec2(-t * 0.4, t * 0.5) + 7.0) - 0.5);
          vec2 grad = g1 * 0.32 + g2 * 0.22 * fade + g3 * 0.16 * fade * fade;
          // the ship: its local frame (a = along the hull from the bow toward the stern, b = across)
          vec2 ax = vec2(cos(uShip.z), -sin(uShip.z)); vec2 bx = vec2(-ax.y, ax.x);
          vec2 rel = P - uShip.xy; float a = dot(rel, ax), b = dot(rel, bx);
          float L = uShipDim.x, B = uShipDim.y * 0.5;
          // hull half-width along the length (a pointed bow)
          float hw = B * clamp(a / 26.0, 0.0, 1.0) * (1.0 - 0.15 * smoothstep(L - 20.0, L, a));
          float side = abs(b) - hw;
          float spd = uShip.w;
          // bow wave: a bright cushion at the stem and two diverging crests; foam hugging the hull; a churned wake astern
          float bow = exp(-max(length(vec2(a + 2.0, b * 0.8)) - 3.0, 0.0) / 4.0) * step(-30.0, a);
          float alongHull = exp(-max(side, 0.0) / 2.2) * smoothstep(-3.0, 8.0, a) * (1.0 - smoothstep(L, L + 6.0, a)) * (0.5 + 0.5 * wn(vec2(a * 0.3 - t * spd * 0.3, b * 0.5)));
          float kel = 0.0;
          if (a > 0.0) { float w = abs(abs(b) - a * 0.36); kel = exp(-w / (1.5 + a * 0.04)) * exp(-a / 260.0) * (0.45 + 0.55 * ridge(vec2(a * 0.12 - t * 0.6, b * 0.2))); }
          float wake = 0.0;
          if (a > L - 8.0) { float u = a - L; wake = exp(-abs(b) / (B * 0.7 + u * 0.08)) * exp(-u / 320.0) * (0.55 + 0.45 * wn(vec2(u * 0.08 - t * 0.5, b * 0.15))); }
          float shipFoam = clamp((bow * 0.9 + alongHull * 0.7 + kel * 0.5 + wake * 0.6) * clamp(spd / 3.0, 0.0, 1.0), 0.0, 1.0);
          grad += vec2(kel * 0.3 + bow * 0.4) * (wn(P * 0.7 + t) - 0.5);
          // the impact and the span's splash: expanding rings of churned water
          float foamHit = 0.0;
          float ht = t - uHit.z;
          if (ht > 0.0 && ht < 40.0) { float r = length(P - uHit.xy); float ring = exp(-abs(r - (6.0 + ht * 5.0)) / (2.0 + ht * 0.6)) * exp(-ht / 6.0); foamHit += (ring + exp(-r / 14.0) * exp(-ht / 10.0)) * uHit.w; }
          float st = t - uSplash.z;
          if (st > 0.0 && st < 40.0) {
            vec2 sp = P - uSplash.xy; float along = clamp(sp.y, -uSplash.w, 0.0); float r = length(vec2(sp.x, sp.y - along));
            foamHit += (exp(-abs(r - (4.0 + st * 6.0)) / (2.0 + st * 0.8)) * exp(-st / 5.0) + exp(-r / 12.0) * exp(-st / 9.0)) * 1.2;
          }
          foamHit = clamp(foamHit, 0.0, 1.0) * (0.6 + 0.4 * wn(P * 0.4 + t * 0.8));
          vec3 n = normalize(vec3(-grad.x, 1.0, -grad.y));
          vec3 V = normalize(cameraPosition - vW);
          vec3 R = reflect(-V, n); R.y = abs(R.y);
          vec3 sky = mix(uSkyH, uSkyZ, pow(clamp(R.y, 0.0, 1.0), 0.6));
          float sd = max(dot(R, uSunDir), 0.0);
          sky += uSun * (pow(sd, 40.0) * 0.6 + pow(sd, 400.0) * 3.0);
          float fres = 0.025 + 0.975 * pow(1.0 - clamp(dot(n, V), 0.0, 1.0), 5.0);
          vec3 body = uDeep * (0.85 + 0.3 * wn(P * 0.01));
          // sewage: a brown plume spreading from the outfall, streaky with the current
          float sr = length((P - uSewage.xy) * vec2(1.7, 1.0));
          float sew = uSewage.w * smoothstep(uSewage.z, uSewage.z * 0.35, sr + (wn(P * 0.03 + t * 0.02) - 0.5) * uSewage.z * 0.7);
          body = mix(body, vec3(0.13, 0.1, 0.05), sew);
          vec3 col = mix(body, sky * (1.0 - 0.85 * sew), clamp(fres, 0.0, 1.0) * 0.9 * (1.0 - 0.6 * sew));
          col = mix(col, vec3(0.24, 0.2, 0.1), sew * 0.3 * smoothstep(0.4, 0.8, wn(P * 0.25 + t * 0.05)));
          col *= 1.0 - 0.3 * sew;   // scum
          // a fire on the water lights it
          float gr = length(P - uGlowW.xy);
          col += vec3(1.0, 0.45, 0.12) * uGlowW.w * exp(-gr / uGlowW.z) * (0.6 + 0.4 * fres);
          // under the hull: the ship's own shadow darkens the water a little (and nothing reflects under it)
          col *= 1.0 - 0.35 * exp(-max(side, 0.0) / 4.0) * step(0.0, a) * step(a, L);
          vec3 foamC = vec3(0.86, 0.88, 0.86);
          col = mix(col, foamC, clamp(shipFoam + foamHit, 0.0, 1.0) * 0.85);
          gl_FragColor = vec4(col, 1.0);
          ${THREE.ShaderChunk.fog_fragment}
        }`,
    });
    this.water = new THREE.Mesh(g, this.waterMat); this.water.name = 'water'; this.water.receiveShadow = false;
    this.water.frustumCulled = false; this.scene.add(this.water);
  }

  /* ---------------- the waterfront on the left: seawall, promenade, road, a row of buildings ---------------- */
  _land() {
    const B = this.batch, m = this.m, Q = MD_G.quay, S = MD_G.shoreZ, X0 = -6.5;
    const stone = new THREE.MeshStandardMaterial({ map: Tex.concrete(41, [118, 114, 104]), roughness: 0.92, name: 'seawall' });
    this.m.stone = stone;
    // land: along the viaduct (x < X0, z > S) and along the basin's far side (z < −480 on the left)
    B.add(Geo.flat(-900, X0, S, 1400, Q, 6), m.dirt, null, { noShadow: true });
    B.add(Geo.flat(-900, -60, -1400, -480, Q, 6), m.dirt, null, { noShadow: true });
    // seawalls (faces toward the water)
    B.add(Geo.quad([X0, -2, 1400], [X0, -2, S], [X0, Q, S], [X0, Q, 1400], 0, 0, 200, 1), stone, null, { noShadow: true });   // facing +x
    B.add(Geo.quad([X0, -2, S], [-900, -2, S], [-900, Q, S], [X0, Q, S], 0, 0, 120, 1), stone, null, { noShadow: true });     // facing −z
    B.add(Geo.quad([-900, -2, -480], [-60, -2, -480], [-60, Q, -480], [-900, Q, -480], 0, 0, 120, 1), stone, null, { noShadow: true });
    B.box(0.5, 0.3, 1400 - S, X0 - 0.25, Q + 0.15, (1400 + S) / 2, m.curb);                         // coping
    B.box(900 + X0, 0.3, 0.5, (X0 - 900) / 2, Q + 0.15, S - 0.25, m.curb);
    // promenade (paving) between the seawall and the road; the road; the far pavement
    const RX = MD_G.roadX, RW = 7.0;
    B.add(Geo.flat(RX + RW, X0, S, 1400, Q + 0.02, 4), m.sidewalk, null, { noShadow: true });
    B.add(Geo.flat(RX - RW, RX + RW, S + 8, 1400, Q + 0.01, 8), m.asphalt, null, { noShadow: true });
    B.add(Geo.flat(RX - RW - 4.5, RX - RW, S + 8, 1400, Q + 0.15, 4), m.sidewalk, null, { noShadow: true });
    // the road along the basin (to the left at the end of the waterfront)
    B.add(Geo.flat(-700, RX + RW, S + 1, S + 8 + 6, Q + 0.01, 8), m.asphalt, null, { noShadow: true });
    // kerbs
    B.box(0.2, 0.15, 1400 - S - 8, RX + RW + 0.1, Q + 0.08, (1400 + S + 8) / 2, m.curb, 0, { noShadow: true });
    B.box(0.2, 0.15, 1400 - S - 14, RX - RW - 0.1, Q + 0.08, (1400 + S + 14) / 2, m.curb, 0, { noShadow: true });
    // lane markings (dashed centre, solid edges)
    for (let z = S + 14; z < 900; z += 9) B.add(Geo.flat(RX - 0.08, RX + 0.08, z, z + 4.5, Q + 0.02, 1), m.markWhite, null, { noShadow: true });
    for (const e of [-1, 1]) B.add(Geo.flat(RX + e * (RW - 0.5) - 0.07, RX + e * (RW - 0.5) + 0.07, S + 14, 900, Q + 0.02, 1), m.markWhite, null, { noShadow: true });
    // a crossing near the corner
    for (let i = 0; i < 9; i++) { const x = RX - RW + 0.6 + i * 1.55; B.add(Geo.flat(x, x + 0.75, S + 15, S + 19, Q + 0.021, 1), m.markWhite, null, { noShadow: true }); }
    // promenade: railing along the seawall, lamp posts, trees, benches
    const rail = Mat.std('#3a4046', { roughness: 0.45, metalness: 0.5 });
    B.box(0.06, 0.06, 1400 - S, X0 - 0.4, Q + 1.05, (1400 + S) / 2, rail, 0, { noShadow: true });
    for (let z = S + 1; z < 900; z += 2.5) B.box(0.05, 1.05, 0.05, X0 - 0.4, Q + 0.52, z, rail, 0, { noShadow: true });
    const rng = new RNG(4401);
    for (let z = S + 12; z < 900; z += 24) {
      const x = RX + RW + 2.0;
      B.add(new THREE.CylinderGeometry(0.07, 0.11, 7.5, 8), m.metal, Geo.matrix(x, Q + 3.75, z));
      B.box(1.4, 0.08, 0.12, x + 0.6, Q + 7.4, z, m.metal);
      B.box(0.5, 0.14, 0.26, x + 1.2, Q + 7.32, z, Mat.std('#e8e2cf', { roughness: 0.4, emissive: '#3a3020' }));
      this._tree(x + 2.6 + rng.range(-0.4, 0.4), z + 12, rng, 1.05);
      if (rng.next() < 0.5) this._bench(x + 1.6, z + 6, Math.PI / 2);
    }
    // the far pavement's trees
    for (let z = S + 30; z < 900; z += 18) this._tree(RX - RW - 2.6, z + rng.range(-2, 2), rng, 0.95);
  }

  // Environment._tree / _bench read LAYOUT.curbH for their base height: lift them onto the quay
  _tree(x, z, rng, scale = 1) { const b = this.batch, keep = b.add.bind(b); b.add = (g, mat, mx, o) => { if (mx) mx.premultiply(new THREE.Matrix4().makeTranslation(0, MD_G.quay, 0)); else mx = new THREE.Matrix4().makeTranslation(0, MD_G.quay, 0); keep(g, mat, mx, o); };
    try { super._tree(x, z, rng, scale); } finally { b.add = keep; } }
  _bench(x, z, ry) { const b = this.batch, keep = b.add.bind(b); b.add = (g, mat, mx, o) => { if (mx) mx.premultiply(new THREE.Matrix4().makeTranslation(0, MD_G.quay, 0)); else mx = new THREE.Matrix4().makeTranslation(0, MD_G.quay, 0); keep(g, mat, mx, o); };
    try { super._bench(x, z, ry); } finally { b.add = keep; } }

  // one building facing +x (toward the road and the harbour): ground-floor shops, a textured facade, a cornice, rooftop clutter
  _bldg(xf, z0, z1, depth, style, floors, rng, shops = true, face = 1) {
    const B = this.batch, m = this.m, F = this.facades[style], st = F.style, Q = MD_G.quay;
    const gH = 4.4, H = gH + floors * st.floorH;
    const x0 = face > 0 ? xf - depth : xf, x1 = face > 0 ? xf : xf + depth;
    (this.cityRects || (this.cityRects = [])).push({ x0, x1, z0, z1, h: Q + H, y0: Q + gH, kind: 'row' });
    B.add(Geo.boxSides(x0, x1, Q, Q + gH, z0, z1, 3, gH), F.wall, null);
    B.add(Geo.boxSides(x0, x1, Q + gH, Q + H, z0, z1, F.tileW, F.tileH), F.mat, null);
    B.add(Geo.flat(x0, x1, z0, z1, Q + H, 4), m.roof, null, { noShadow: true });
    if (shops) {
      const w = z1 - z0, n = Math.max(1, Math.round(w / 7.5)), uw = w / n, xs = xf + face * 0.03;
      for (let i = 0; i < n; i++) {
        const si = Math.floor(rng.next() * SHOPS.length), za = z0 + i * uw + 0.35, zb = z0 + (i + 1) * uw - 0.35;
        B.add(Geo.quad([xs, Q, zb], [xs, Q, za], [xs, Q + 4.2, za], [xs, Q + 4.2, zb]), this.shopMats[si], null, { noShadow: true });
        const shop = SHOPS[si];
        if (shop.awning && rng.next() < 0.6) {
          const aw = zb - za - 0.6, ad = 1.35, awMat = Mat.std(shop.awning, { roughness: 0.85 });
          B.add(new THREE.BoxGeometry(ad, 0.05, aw), awMat, Geo.matrix(xf + face * ad / 2 * 0.95, Q + 3.72, (za + zb) / 2, 0, 0, -face * 0.32));
        }
      }
    }
    const trim = st.kind === 'curtain' ? m.metal : m.trim;
    B.box(0.22, 0.24, z1 - z0, xf + face * 0.11, Q + gH - 0.1, (z0 + z1) / 2, trim);
    if (st.kind !== 'curtain') {
      B.box(0.45, 0.55, z1 - z0 + 0.5, xf + face * 0.2, Q + H - 0.15, (z0 + z1) / 2, trim);
      B.box(0.25, 0.9, z1 - z0, x0 + 0.12, Q + H + 0.45, (z0 + z1) / 2, F.wall);
    } else B.box(0.2, 1.1, z1 - z0, xf + face * 0.1, Q + H + 0.55, (z0 + z1) / 2, m.metal);
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    for (let i = 0, n = rng.int(1, 3); i < n; i++) {
      const w = rng.range(1.4, 3), d = rng.range(1.2, 2.5), h = rng.range(0.9, 1.8);
      B.box(w, h, d, cx + rng.range(-depth * 0.3, depth * 0.3), Q + H + h / 2, cz + rng.range(-(z1 - z0) * 0.3, (z1 - z0) * 0.3), m.roofLight);
    }
    if (rng.next() < 0.3 && floors <= 8) this._waterTank(cx, Q + H, cz);
    // dressing the camera can read from the train (it passes ~30–60 m away)
    if (st.kind !== 'panel' && st.kind !== 'curtain') {
      const bays = Math.floor((z1 - z0) / st.bayW + 1e-3), ww = st.winW * st.bayW, wh = st.winH * st.floorH;
      for (let f = 0; f < floors; f++) {
        const ys = Q + gH + f * st.floorH + st.sillH * st.floorH;
        for (let i = 0; i < bays; i++) {
          const z = face > 0 ? z1 - (i + 0.5) * st.bayW : z0 + (i + 0.5) * st.bayW;
          B.box(0.16, 0.07, ww + 0.16, xf + face * 0.08, ys - 0.035, z, m.trim, 0, { noShadow: true });
          B.box(0.1, 0.13, ww + 0.12, xf + face * 0.05, ys + wh + 0.065, z, m.trim, 0, { noShadow: true });
        }
      }
    } else {
      for (let i = 0, bays = Math.floor((z1 - z0) / st.bayW); i <= bays; i++) B.box(0.32, H - gH - 0.3, 0.12, xf + face * 0.16, Q + (gH + H) / 2, z0 + i * st.bayW, m.metal, 0, { noShadow: true });
    }
    return H;
  }

  _city() {
    const rng = new RNG(5120), RX = MD_G.roadX, xf = RX - 7.0 - 4.5;
    const near = ['redbrick', 'tanbrick', 'cream', 'salmon', 'stone', 'whitebrick', 'sage', 'modern'];
    const far = ['modern', 'glassblue', 'stone', 'cream', 'glassteal', 'tanbrick'];
    // the row facing the harbour along the road
    let z = MD_G.shoreZ + 24, prev = '';
    while (z < 1000) {
      const w = rng.range(12, 24); let style = rng.pick(near); if (style === prev) style = rng.pick(near); prev = style;
      this._bldg(xf, z, z + w, rng.range(16, 24), style, rng.int(4, 8), rng);
      z += w + (rng.next() < 0.15 ? rng.range(3, 6) : 0);
    }
    // the corner building on the basin and a row along the basin (facing −z toward the water)
    for (let x = xf - 2; x > -640;) {
      const w = rng.range(14, 26), st = this.facades[rng.pick(near)], fl = rng.int(4, 9), H = 4.4 + fl * st.style.floorH, Q = MD_G.quay;
      const z0 = MD_G.shoreZ + 22, z1 = z0 + 18;
      this.batch.add(Geo.boxSides(x - w, x, Q, Q + 4.4, z0, z1, 3, 4.4), st.wall, null);
      this.cityRects.push({ x0: x - w, x1: x, z0, z1, h: Q + H, y0: Q + 4.4, kind: 'basin' });
      this.batch.add(Geo.boxSides(x - w, x, Q + 4.4, Q + H, z0, z1, st.tileW, st.tileH), st.mat, null);
      this.batch.add(Geo.flat(x - w, x, z0, z1, Q + H, 4), this.m.roof, null, { noShadow: true });
      x -= w + rng.range(0, 4);
    }
    // a second, taller row behind and a skyline of towers: depth above the rooftops
    for (let zz = MD_G.shoreZ + 40; zz < 1100;) {
      const w = rng.range(16, 32), h = rng.range(30, 70), st = this.facades[rng.pick(far)], x1 = xf - 30, x0 = x1 - rng.range(18, 30);
      this.batch.add(Geo.boxSides(x0, x1, MD_G.quay, MD_G.quay + h, zz, zz + w, st.tileW, st.tileH), st.mat, null);
      this.cityRects.push({ x0, x1, z0: zz, z1: zz + w, h: MD_G.quay + h, y0: MD_G.quay + 4, kind: 'tall' });
      this.batch.add(Geo.flat(x0, x1, zz, zz + w, MD_G.quay + h, 4), this.m.roof, null, { noShadow: true });
      zz += w + rng.range(0, 8);
    }
    for (let i = 0; i < 60; i++) {
      const x = rng.range(-140, -700), zz = rng.range(-80, 1200), w = rng.range(22, 44), d = rng.range(22, 40), h = rng.range(45, 170);
      const st = this.facades[rng.pick(['glassblue', 'glassteal', 'modern', 'stone'])];
      this.batch.add(Geo.boxSides(x - w / 2, x + w / 2, MD_G.quay, h, zz - d / 2, zz + d / 2, st.tileW, st.tileH), st.mat, null, { noShadow: true });
      this.cityRects.push({ x0: x - w / 2, x1: x + w / 2, z0: zz - d / 2, z1: zz + d / 2, h, y0: MD_G.quay + 4, kind: 'tower' });
      this.batch.add(Geo.flat(x - w / 2, x + w / 2, zz - d / 2, zz + d / 2, h, 5), this.m.roof, null, { noShadow: true });
    }
  }

  /* ---------------- the far shores: a container terminal across the harbour, hills, the town ahead ---------------- */
  _farShores() {
    const B = this.batch, rng = new RNG(6230);
    const hillM = new THREE.MeshStandardMaterial({ color: '#4c5a4a', roughness: 1, flatShading: true, name: 'hills' });
    const landM = Mat.std('#6c695f', { roughness: 0.95 });
    // ahead: land across the whole width beyond z −760, with a low town and hills
    B.add(Geo.flat(-2000, 2400, -3200, -760, MD_G.quay, 10), landM, null, { noShadow: true });
    B.add(Geo.quad([-2000, -2, -760], [2400, -2, -760], [2400, MD_G.quay, -760], [-2000, MD_G.quay, -760], 0, 0, 400, 1), this.m.stone, null, { noShadow: true });
    // across the harbour (right): the terminal's quay
    B.add(Geo.flat(1150, 2600, -760, 1600, MD_G.quay, 10), landM, null, { noShadow: true });
    B.add(Geo.quad([1150, -2, 1600], [1150, -2, -760], [1150, MD_G.quay, -760], [1150, MD_G.quay, 1600], 0, 0, 300, 1), this.m.stone, null, { noShadow: true });
    // hills: faceted ridges around the horizon
    const ridge = (cx, cz, len, ang, h, seed) => {
      const r = new RNG(seed), N = 18, pos = [];
      const dir = [Math.cos(ang), Math.sin(ang)], nrm = [-dir[1], dir[0]];
      const top = []; for (let i = 0; i <= N; i++) top.push(h * (0.55 + 0.45 * Math.sin(i / N * Math.PI)) * r.range(0.75, 1.15));
      for (let i = 0; i < N; i++) {
        const a = (i / N - 0.5) * len, b = ((i + 1) / N - 0.5) * len, w = len * 0.06;
        const P = (s, o, y) => [cx + dir[0] * s + nrm[0] * o, y, cz + dir[1] * s + nrm[1] * o];
        const q = [P(a, w * 3, 0), P(b, w * 3, 0), P(b, 0, top[i + 1]), P(a, 0, top[i])];
        pos.push(...q[0], ...q[1], ...q[2], ...q[0], ...q[2], ...q[3]);
        const q2 = [P(b, -w * 3, 0), P(a, -w * 3, 0), P(a, 0, top[i]), P(b, 0, top[i + 1])];
        pos.push(...q2[0], ...q2[1], ...q2[2], ...q2[0], ...q2[2], ...q2[3]);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
      B.add(g, hillM, null, { noShadow: true });
    };
    ridge(200, -1900, 2600, 0.05, 150, 1); ridge(-900, -1500, 1800, 0.5, 120, 2); ridge(2100, -300, 2600, Math.PI / 2 + 0.1, 170, 3);
    ridge(1700, 1500, 1600, -0.4, 110, 4); ridge(-1700, -200, 1600, Math.PI / 2, 140, 5);
    // the town ahead: low blocks with a few taller ones
    for (let i = 0; i < 140; i++) {
      const x = rng.range(-900, 1300), z = rng.range(-1500, -790), w = rng.range(14, 34), d = rng.range(12, 28), h = rng.range(8, 30) * (rng.next() < 0.1 ? 3 : 1);
      const st = this.facades[rng.pick(['cream', 'stone', 'tanbrick', 'modern', 'salmon', 'whitebrick'])];
      B.add(Geo.boxSides(x - w / 2, x + w / 2, MD_G.quay, MD_G.quay + h, z - d / 2, z + d / 2, st.tileW, st.tileH), st.mat, null, { noShadow: true });
      B.add(Geo.flat(x - w / 2, x + w / 2, z - d / 2, z + d / 2, MD_G.quay + h, 5), this.m.roof, null, { noShadow: true });
    }
    // the container terminal: stacks and ship-to-shore cranes along its quay
    const cc = ['#8a3a2a', '#2c4f73', '#b88a2c', '#3c6a46', '#8a8a86', '#6d2f3a', '#c9c4b8', '#3f5a6a'];
    for (let i = 0; i < 120; i++) {
      const z = -500 + (i % 24) * 40 + rng.range(-3, 3), x = 1200 + Math.floor(i / 24) * 26 + rng.range(-2, 2), n = rng.int(2, 5);
      for (let k = 0; k < n; k++) B.box(12.2, 2.6, 2.45 * 6, x, MD_G.quay + 1.3 + k * 2.6, z, Mat.std(cc[(i * 3 + k) % cc.length], { roughness: 0.75 }), 0, { noShadow: true });
    }
    const craneM = Mat.std('#b8452c', { roughness: 0.6 }), craneW = Mat.std('#d8d2c4', { roughness: 0.6 });
    for (let i = 0; i < 6; i++) {
      const z = -380 + i * 130, x = 1170, cm = i % 2 ? craneM : craneW;
      for (const dz of [-8, 8]) for (const dx of [0, 22]) B.box(1.4, 48, 1.4, x + dx, MD_G.quay + 24, z + dz, cm, 0, { noShadow: true });
      B.box(24, 2, 18, x + 11, MD_G.quay + 47, z, cm, 0, { noShadow: true });
      B.box(110, 2.6, 2.4, x - 22, MD_G.quay + 52, z, cm, 0, { noShadow: true });            // the boom, out over the water
      B.box(14, 6, 7, x + 4, MD_G.quay + 52, z, Mat.std('#d8d6d0', { roughness: 0.6 }), 0, { noShadow: true });
      B.add(new THREE.CylinderGeometry(0.25, 0.25, 30, 4), cm, Geo.matrix(x - 40, MD_G.quay + 66, z, 0, 0, 0.75), { noShadow: true });   // a stay
    }
    // a lighthouse on a breakwater far out on the right
    B.box(260, 4, 14, 760, 1, 1100, this.m.stone, 0.4, { noShadow: true });
    B.add(new THREE.CylinderGeometry(2.2, 3.0, 22, 12), Mat.std('#e6e2d8'), Geo.matrix(660, 13, 1140), { noShadow: true });
    B.add(new THREE.CylinderGeometry(2.4, 2.4, 3, 12), Mat.std('#a8312a'), Geo.matrix(660, 25.5, 1140), { noShadow: true });
  }

  // ships at anchor out in the harbour (lights on; nobody on them either)
  _anchored() {
    const rng = new RNG(7310), B = this.batch;
    const hullM = Mat.std('#2b2f33', { roughness: 0.6 }), redM = Mat.std('#6e2a22', { roughness: 0.7 }), whiteM = Mat.std('#dedbd2', { roughness: 0.6 });
    const cc = ['#8a3a2a', '#2c4f73', '#b88a2c', '#3c6a46', '#8a8a86', '#c9c4b8'];
    for (const [x, z, ry, L] of [[620, 420, 0.35, 160], [900, -260, 1.1, 210], [520, -620, -0.4, 120], [980, 820, 0.8, 190]]) {
      const c = Math.cos(ry), s = Math.sin(ry), P = (a, b) => [x + a * c + b * s, z - a * s + b * c];
      const w = L * 0.16;
      let p = P(0, 0); B.box(L, 9, w, p[0], 3.5, p[1], hullM, ry, { noShadow: true });
      B.box(L * 0.98, 1.6, w * 1.01, p[0], -0.2, p[1], redM, ry, { noShadow: true });
      for (let i = 0; i < Math.floor(L / 16); i++) { p = P(-L * 0.38 + i * 13.5, 0); B.box(12, 2.6 * rng.int(2, 4), w * 0.85, p[0], 9 + 2.6, p[1], Mat.std(cc[i % cc.length], { roughness: 0.75 }), ry, { noShadow: true }); }
      p = P(L * 0.42, 0); B.box(10, 14, w * 0.9, p[0], 15, p[1], whiteM, ry, { noShadow: true });
    }
  }

  update(t) {
    this.skyUniforms.uTime.value = t;
    this.WU.uTime.value = t;
    this.WU.fogColor.value.copy(this.scene.fog.color); this.WU.fogDensity.value = this.scene.fog.density;
  }
}
