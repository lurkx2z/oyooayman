/* =====================================================================
   PLANET — the Earth for "What if Africa suddenly disappeared?" (its own scene + camera, shown through FILM.view).
   Built from real coastlines and ocean depths (Natural Earth, baked by make-planet.py into planet-data.js):
     · today's Earth: muted biomes, oceans shaded by depth, clouds, an atmosphere, night lights;
     · THE VANISH: the continent dissolves in about a second, leaving a basin ~4 km deep (the depth of the ocean floor
       around it), its walls 4 km high at the old coast. Heights are exaggerated ×AF_EXAG so the walls can be seen;
     · THE FILL: the Atlantic, the Indian Ocean and the Mediterranean pour in from every coast. A front of churned
       water crosses the floor (AF_FILL.front, in km from the coast); behind it the level rises; foam falls over the rim;
     · THE NEW SEA LEVEL: filling the basin takes ~120 million km³ of seawater, so the oceans drop by ~300 m and the
       shallow shelves around every continent become land (uSea, 0…1 = 0…300 m);
     · overlays: trade lanes with ships (AfLanes), wind/current streamlines (AfFlow).
   Every uniform is set from story time by film.js: a pure function of t.
   ===================================================================== */

const AF_EXAG = 26;                 // vertical exaggeration of the basin (a true 4 km wall is invisible from orbit)
const AF_R = 6371000;               // metres per unit radius
function afDir(lon, lat) { return EarthScene.dirFromLonLat(lon, lat); }

const AF_PLANET_GLSL = /* glsl */`
  uniform sampler2D uDay, uData, uAux;
  uniform vec3 uSun;
  uniform float uT, uVan0, uVanDur, uFront, uLevel, uSea, uExag, uMode, uLights, uFoam, uSwirl, uGhost, uBasinLit, uMoon, uGhostL, uHaze, uSpill;
  uniform vec3 uSweep;
  uniform vec4 uPatch; uniform float uPatchOn; uniform vec2 uRef;
  float afH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float afN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(afH(i), afH(i + vec2(1, 0)), f.x), mix(afH(i + vec2(0, 1)), afH(i + vec2(1, 1)), f.x), f.y); }
  float afF(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a * afN(p); p = p * 2.03 + 7.1; a *= 0.5; } return v; }
  // the moment this point vanishes: a fast sweep across the continent, broken by noise
  float afVanAt(vec3 n, vec2 uv){ return uVan0 + uVanDur * (0.72 * (0.5 + 0.5 * dot(n, uSweep)) + 0.28 * afF(uv * vec2(260.0, 130.0))); }
  // distance from the old coast (km) from the data's G channel (0 outside Africa)
  float afKm(float g){ return g < 0.01 ? -1.0 : (g - 0.02) / 0.98 * 1600.0; }
  // the floor's depth (m, positive down): a 4 km wall within ~50 km of the coast, then a rough floor
  float afFloor(float km, float relief){ return km < 0.0 ? 0.0 : (3800.0 + 1100.0 * (relief - 0.5)) * smoothstep(0.0, 55.0, km); }
  // where the water has reached (km from the coast): the front is torn by the currents
  float afFrontAt(vec2 uv, float t){ return uFront * (0.86 + 0.28 * afF(uv * vec2(40.0, 20.0) + vec2(t * 0.03, 0.0))); }
`;

class AfPlanet {
  constructor(renderer) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#010205');
    this.camera = new THREE.PerspectiveCamera(30, 9 / 16, 0.002, 400);
    const ld = (src, srgb) => { const tx = new THREE.TextureLoader().load(src); tx.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; tx.anisotropy = 4; tx.generateMipmaps = true; tx.minFilter = THREE.LinearMipmapLinearFilter; return tx; };
    this.tex = { day: ld(AF_MAPS.day, true), data: ld(AF_MAPS.data, false), aux: ld(AF_MAPS.aux, false) };
    this.sun = afDir(10, 4);
    const U = this.uniforms = {
      uDay: { value: this.tex.day }, uData: { value: this.tex.data }, uAux: { value: this.tex.aux },
      uSun: { value: this.sun.clone() }, uT: { value: 0 }, uVan0: { value: 1e9 }, uVanDur: { value: 1.0 }, uSweep: { value: afDir(-20, 20) },
      uFront: { value: 0 }, uLevel: { value: 0 }, uSea: { value: 0 }, uExag: { value: AF_EXAG }, uMode: { value: 0 }, uLights: { value: 1 },
      uFoam: { value: 0 }, uSwirl: { value: 0 }, uGhost: { value: 0 }, uBasinLit: { value: 1 }, uMoon: { value: 0 }, uGhostL: { value: 0 }, uHaze: { value: 1 }, uSpill: { value: 0 },
      uPatch: { value: new THREE.Vector4(0, 0, 0.01, 0.01) }, uPatchOn: { value: 0 }, uRef: { value: new THREE.Vector2(0.5, 0.5) },
    };
    // the vertex shader: the whole sphere, or (AF_PATCH) a fine grid over one lon/lat window for the close shots
    // (the 1024×512 sphere has a vertex every ~39 km: too coarse for a 4 km wall seen from a few hundred km)
    const vs = (patch) => AF_PLANET_GLSL + /* glsl */`
        varying vec2 vUv; varying vec3 vN; varying vec3 vW;
        void main(){
          ${patch ? `vec2 g = uPatch.xy + uv * uPatch.zw; float ph = g.x * 6.28318531, th = (1.0 - g.y) * 3.14159265;
          vec3 n = vec3(-cos(ph) * sin(th), cos(th), sin(ph) * sin(th)); vUv = g;` : 'vUv = uv; vec3 n = normalize(position);'}
          vec4 D = texture2D(uData, vUv);
          float km = afKm(D.g), h = 0.0;
          if (km >= 0.0) {
            float van = smoothstep(0.0, 0.25, uT - afVanAt(n, vUv));
            float fl = -afFloor(km, D.a) * van;
            float wet = step(km, afFrontAt(vUv, uT));
            h = mix(fl, mix(fl, 0.0, uLevel), wet);
          }
          vec3 p = n * (1.0 + h * uExag / ${AF_R.toFixed(1)});
          vN = normalize(mat3(modelMatrix) * n);
          vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }`;
    const mat = new THREE.ShaderMaterial({
      uniforms: U,
      vertexShader: vs(false),
      fragmentShader: AF_PLANET_GLSL + /* glsl */`
        varying vec2 vUv; varying vec3 vN; varying vec3 vW;
        void main(){
          #ifndef AF_PATCH
          if (uPatchOn > 0.5 && all(greaterThan(vUv, uPatch.xy)) && all(lessThan(vUv, uPatch.xy + uPatch.zw))) discard;
          #endif
          vec3 n = normalize(vN), v = normalize(cameraPosition - vW);
          vec4 D = texture2D(uData, vUv);
          vec3 col = texture2D(uDay, vUv).rgb;
          float land = D.r, km = afKm(D.g), depthM = D.b * 6000.0;
          float lat = (vUv.y - 0.5) * 3.14159265;
          // local frame (east, north) on the sphere, for slopes from the maps
          vec3 east = normalize(cross(vec3(0.0, 1.0, 0.0), n) + vec3(1e-5, 0.0, 0.0)), north = normalize(cross(n, east));
          vec3 nn = n;           // the shading normal
          vec3 emit = vec3(0.0);
          float water = 1.0 - step(0.5, land), spec = water, foam = 0.0;
          vec4 A = texture2D(uAux, vUv);
          float lightsA = A.b;
          // ---------------------------------------------------------------- the new sea level: shelves become land
          if (uSea > 0.0 && water > 0.5 && km < 0.0) {
            float exposed = smoothstep(uSea * 300.0 + 12.0, uSea * 300.0 - 12.0, depthM);
            vec3 mud = mix(vec3(0.36, 0.33, 0.27), vec3(0.42, 0.44, 0.30), afF(vUv * vec2(300.0, 150.0)));
            col = mix(col, mud, exposed); spec *= 1.0 - exposed; water *= 1.0 - exposed;
            // the new coast: a thin bright line of surf
            float edge = smoothstep(18.0, 0.0, abs(depthM - uSea * 300.0)) * step(0.02, uSea);
            col = mix(col, vec3(0.75, 0.8, 0.82), edge * 0.5);
          }
          // ---------------------------------------------------------------- Africa: the vanish, the basin, the fill
          if (km >= 0.0) {
            float vt = afVanAt(n, vUv), van = smoothstep(0.0, 0.25, uT - vt);
            float rim = smoothstep(0.0, 0.03, uT - vt) * (1.0 - smoothstep(0.03, 0.14, uT - vt));   // the dissolving edge
            // the floor and its slope (sampled from the maps: the wall at the old coast, the relief beyond)
            float du = 1.0 / 4096.0, dv = 1.0 / 2048.0;
            vec4 De = texture2D(uData, vUv + vec2(du * 2.0, 0.0)), Dw = texture2D(uData, vUv - vec2(du * 2.0, 0.0));
            vec4 Dn = texture2D(uData, vUv + vec2(0.0, dv * 2.0)), Ds = texture2D(uData, vUv - vec2(0.0, dv * 2.0));
            float he = -afFloor(afKm(De.g), De.a), hw = -afFloor(afKm(Dw.g), Dw.a), hn = -afFloor(afKm(Dn.g), Dn.a), hs = -afFloor(afKm(Ds.g), Ds.a);
            float sx = (he - hw) / (4.0 * 9780.0 * max(cos(lat), 0.2)) * uExag, sy = (hn - hs) / (4.0 * 9780.0) * uExag;
            float fine = afF(vUv * vec2(900.0, 450.0)) - 0.5;
            vec3 fn = normalize(n - east * (sx * 1.6 + fine * 0.12) - north * (sy * 1.6 + fine * 0.12));
            float depthFrac = afFloor(km, D.a) / 4300.0;
            // (linear colours: these are dark) a dark rock floor, colder and darker with depth; the freshly cut wall paler
            vec3 rock = mix(vec3(0.016, 0.015, 0.015), vec3(0.042, 0.034, 0.028), smoothstep(0.25, 0.8, D.a));
            rock = mix(rock, vec3(0.010, 0.013, 0.018), depthFrac * 0.6);
            rock = mix(rock, vec3(0.11, 0.08, 0.055), smoothstep(40.0, 4.0, km) * 0.8);
            rock *= 0.8 + 0.4 * afF(vUv * vec2(420.0, 210.0));
            vec3 basin = rock * uBasinLit;
            // the fill
            float front = afFrontAt(vUv, uT);
            float wet = smoothstep(km - 6.0, km + 6.0, front) * step(0.0001, uFront);
            // the direction along the old coast (from the distance map's gradient), for curtains and streaks
            // (the distance map is 8-bit, ~6 km steps: take its slope from a blurred, wider lookup so the direction is
            // smooth, and measure from the shot's own aim point so the coordinate does not swing with it)
            float wu = du * 10.0, wv = dv * 10.0;
            vec2 gd = vec2(texture2D(uData, vUv + vec2(wu, 0.0), 3.0).g - texture2D(uData, vUv - vec2(wu, 0.0), 3.0).g,
                           texture2D(uData, vUv + vec2(0.0, wv), 3.0).g - texture2D(uData, vUv - vec2(0.0, wv), 3.0).g) + 1e-6;
            float along = dot((vUv - uRef) * vec2(4096.0, 2048.0), normalize(vec2(-gd.y, gd.x)));
            // the first spill, seconds after the vanish: thin curtains already run over the low points of the rim
            // and grow down the wall (uSpill 0…1 = from the lip to the foot)
            float cur = uSpill * smoothstep(0.52, 0.64, afF(vec2(along * 0.05, 3.7))) * smoothstep(uSpill * 64.0, uSpill * 64.0 - 8.0, km);
            wet = max(wet, cur);
            float wallK = smoothstep(58.0, 14.0, km);   // on the wall itself
            float frontBand = exp(-pow((front - km) / 22.0, 2.0)) * step(0.0001, uFront) * (1.0 - uLevel);
            // churned water: turbid brown-grey at the front, clearing and deepening as the level rises
            vec2 q = vUv * vec2(160.0, 80.0);
            // eddies: the pattern is warped twice by drifting noise, so the streaks curl like marbled water
            vec2 w1 = vec2(afF(q * 0.35 + vec2(uT * 0.06, 0.0)), afF(q * 0.35 + vec2(5.2, -uT * 0.05)));
            float swl = uSwirl * (1.0 - wallK);   // (no eddies on the wall: there the water only falls)
            vec2 q2 = q + swl * 3.2 * (w1 - 0.5) + swl * 1.6 * vec2(sin(w1.y * 6.3 + uT * 0.2), cos(w1.x * 6.3 - uT * 0.17));
            float sw = afF(q2 + vec2(uT * 0.05, -uT * 0.03));
            float streak = afF(vec2(q2.x * 0.7 + sw * 3.0, q2.y * 2.2 - sw * 2.0));
            vec3 turbid = mix(vec3(0.25, 0.27, 0.25), vec3(0.15, 0.25, 0.29), uLevel);
            vec3 deepW = vec3(0.06, 0.17, 0.27);
            vec3 wcol = mix(turbid, deepW, smoothstep(0.3, 1.0, uLevel) * smoothstep(60.0, 300.0, km));
            wcol = wcol * wcol * 1.2;   // (to linear)
            // the falls: on the wall the water runs downhill in streaks (across the slope fine, down the slope long)
            float fall = smoothstep(0.42, 0.78, afF(vec2(along * 2.2, km * 0.06 - uT * 1.4))) * smoothstep(58.0, 8.0, km);
            // over the lip the sheet is glassy blue-green; it breaks up white as it falls
            vec3 sheet = mix(vec3(0.012, 0.075, 0.085), vec3(0.26, 0.31, 0.32), smoothstep(2.0, 22.0, km));
            wcol = mix(wcol, sheet, wallK * (1.0 - uLevel));
            wcol *= mix(0.8 + 0.45 * streak, 0.6 + 0.7 * fall, wallK);
            fall *= smoothstep(1.0, 12.0, km);
            float pool = smoothstep(130.0, 50.0, km) * smoothstep(0.45, 0.8, afF(q2 * 3.0 + vec2(-uT * 0.4, uT * 0.3)));
            float foamW = clamp(frontBand * mix(0.85, 0.25 + 0.75 * fall, smoothstep(70.0, 40.0, km)) + uFoam * (fall * 0.95 + pool * 0.6) + 0.4 * swl * smoothstep(0.6, 0.82, streak) * (1.0 - uLevel * 0.7), 0.0, 1.0);
            wcol = mix(wcol, vec3(0.72, 0.75, 0.74), foamW);
            vec3 after = mix(basin, wcol, wet);
            col = mix(col, after, van);
            nn = normalize(mix(n, mix(fn, n, wet * 0.85), van));
            spec = mix(water, wet * (0.6 + 0.4 * uLevel), van);
            water = mix(water, wet, van);
            foam = foamW * wet * van;
            // the dissolving edge: a thin pale seam as the land goes
            emit += vec3(1.0, 0.8, 0.55) * rim * 0.5;
            lightsA *= mix(1.0, uGhostL, van);
            // the ghost of the coast (the old outline, faint) when asked
            emit += vec3(1.0, 0.72, 0.42) * uGhost * smoothstep(30.0, 2.0, km) * van * 0.22;
          }
          // ---------------------------------------------------------------- light
          float ndl = dot(nn, uSun), ndl0 = dot(n, uSun);
          vec3 lit = col * (0.03 + 1.12 * max(ndl, 0.0) * smoothstep(-0.12, 0.08, ndl0));
          vec3 hv = normalize(uSun + v);
          lit += vec3(1.0, 0.94, 0.84) * pow(max(dot(nn, hv), 0.0), 700.0) * 0.22 * spec * step(0.0, ndl0);
          lit += vec3(1.0) * foam * 0.12 * max(ndl0, 0.0);
          // satellite map mode (the trade animation): a dark, cool map
          if (uMode > 0.0) {
            float l = dot(col, vec3(0.3, 0.55, 0.15));
            vec3 mapc = mix(vec3(0.02, 0.04, 0.07), vec3(0.09, 0.12, 0.13), land) + vec3(0.06, 0.07, 0.07) * l * land;
            if (km >= 0.0) mapc = mix(mapc, vec3(0.012, 0.016, 0.02), smoothstep(0.0, 0.25, uT - afVanAt(n, vUv)));
            lit = mix(lit, mapc * (0.6 + 0.6 * max(ndl0 + 0.4, 0.0)), uMode);
          }
          // atmosphere toward the limb (from close up the path through the air is short: much less haze)
          float rimA = pow(1.0 - max(dot(n, v), 0.0), 2.6) * mix(0.12, 1.0, uHaze);
          lit = mix(lit, vec3(0.42, 0.62, 0.95) * max(ndl0 + 0.18, 0.0), rimA * 0.6 * (1.0 - uMode * 0.7));
          // night lights
          float night = smoothstep(0.08, -0.2, ndl0);
          lit += (col + 0.004) * vec3(0.55, 0.68, 1.0) * 0.32 * uMoon * night;           // moonlight on the night side
          lit += emit;
          lit += vec3(1.0, 0.78, 0.5) * (A.g + lightsA) * night * uLights * 1.5;
          gl_FragColor = vec4(lit, 1.0);
        }`,
    });
    this.mat = mat;
    this.earth = new THREE.Mesh(new THREE.SphereGeometry(1, 1024, 512), mat);
    this.scene.add(this.earth);
    const pmat = new THREE.ShaderMaterial({ uniforms: U, defines: { AF_PATCH: 1 }, vertexShader: vs(true), fragmentShader: mat.fragmentShader });
    this.patch = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 900, 900), pmat);
    this.patch.frustumCulled = false; this.patch.visible = false;
    this.scene.add(this.patch);
    // clouds
    this.cloudMat = new THREE.ShaderMaterial({
      uniforms: { uAux: U.uAux, uData: U.uData, uSun: U.uSun, uOff: { value: 0 }, uOpacity: { value: 1 }, uAfr: { value: 0 } },
      transparent: true, depthWrite: false,
      vertexShader: 'varying vec2 vUv; varying vec3 vN; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform sampler2D uAux, uData; uniform vec3 uSun; uniform float uOff, uOpacity, uAfr; varying vec2 vUv; varying vec3 vN;
        void main(){ float a = texture2D(uAux, vUv + vec2(uOff, 0.0)).r; float ndl = dot(normalize(vN), uSun);
          a *= 1.0 - uAfr * 0.94 * smoothstep(0.0, 0.08, texture2D(uData, vUv).g);
          float l = smoothstep(-0.08, 0.6, ndl);
          vec3 col = vec3(0.005 + 0.95 * l) * mix(vec3(1.0, 0.72, 0.52), vec3(1.0), smoothstep(0.0, 0.16, ndl));
          gl_FragColor = vec4(col * (0.84 + 0.16 * a), a * 0.9 * uOpacity); }`,
    });
    this.clouds = new THREE.Mesh(new THREE.SphereGeometry(1.006, 256, 128), this.cloudMat);
    this.scene.add(this.clouds);
    // atmosphere glow
    this.atmo = new THREE.Mesh(new THREE.SphereGeometry(1.05, 96, 48), new THREE.ShaderMaterial({
      uniforms: { uSun: U.uSun, uK: { value: 1 } },
      side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `uniform vec3 uSun; uniform float uK; varying vec3 vN; varying vec3 vW;
        void main(){ vec3 v = normalize(cameraPosition - vW); float f = pow(max(0.0, 1.0 - abs(dot(normalize(vN), v)) * 1.04), 3.2);
          float lit = smoothstep(-0.35, 0.4, dot(normalize(vN), uSun));
          gl_FragColor = vec4(vec3(0.3, 0.52, 1.0) * f * (0.12 + 1.1 * lit) * uK, 1.0); }`,
    }));
    this.scene.add(this.atmo);
    // stars
    const sp = [], sr = new RNG(77);
    for (let i = 0; i < 2600; i++) { const u = sr.next() * 2 - 1, a = sr.next() * Math.PI * 2, r = Math.sqrt(1 - u * u); sp.push(Math.cos(a) * r * 150, u * 150, Math.sin(a) * r * 150); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#c8d0e2', size: 1.1, sizeAttenuation: false, transparent: true, opacity: 0.8 }));
    this.scene.add(this.stars);
    this.lanes = new AfLanes(this.scene);
    this.flow = new AfFlow(this.scene);
  }

  // place the camera: looking at (lon, lat) from `dist` (units of Earth radius from the centre), with an offset of the
  // aim point (in degrees) so the subject can sit low or high in the 9:16 frame, and a roll
  aim(lon, lat, dist, fov, o = {}) {
    this.uniforms.uRef.value.set((lon + 180) / 360, (lat + 90) / 180);
    const d = afDir(lon, lat), up = new THREE.Vector3(0, 1, 0);
    const east = up.clone().cross(d).normalize(), north = d.clone().cross(east).normalize();
    // tilt: look from above-behind (degrees, toward the south) to get an oblique view of the surface
    const tilt = MathX.deg(o.tilt || 0), az = MathX.deg(o.az || 0);
    const off = north.clone().multiplyScalar(-Math.cos(az)).addScaledVector(east, Math.sin(az));
    const pos = d.clone().multiplyScalar(Math.cos(tilt)).addScaledVector(off, Math.sin(tilt)).normalize().multiplyScalar(dist);
    // the aim point: the surface point, nudged toward the camera's "up" so the subject sits lower in frame
    const at = d.clone().multiplyScalar(o.atR ?? 1).addScaledVector(north, MathX.deg(o.dy || 0)).addScaledVector(east, MathX.deg(o.dx || 0));
    const c = this.camera;
    c.position.copy(pos); c.up.copy(o.upV || north.clone().lerp(up, 0.0)); c.lookAt(at);
    if (o.roll) c.rotateZ(MathX.deg(o.roll));
    this.uniforms.uHaze.value = MathX.smooth(dist, 1.2, 2.3);
    c.fov = fov; c.near = Math.max(0.0005, (dist - 1.05) * 0.2); c.far = 400; c.updateProjectionMatrix(); c.updateMatrixWorld(true);
  }

  // place the camera relative to a point on the ground: `range` (Earth radii from that point), `pitch` (degrees from
  // straight down), `from` (the camera's bearing from the point: 0 north, 90 east…), `look` (degrees: raises the view so
  // the point sits lower in frame), `upMix` (0 = north up, 1 = the horizon level), `lift` (aim above/below the surface)
  orbit(lon, lat, o = {}) {
    this.uniforms.uRef.value.set((lon + 180) / 360, (lat + 90) / 180);
    const d = afDir(lon, lat), up = new THREE.Vector3(0, 1, 0);
    const east = up.clone().cross(d).normalize(), north = d.clone().cross(east).normalize();
    const b = MathX.deg(o.from ?? 180), p = MathX.deg(o.pitch ?? 0);
    const hz = north.clone().multiplyScalar(Math.cos(b)).addScaledVector(east, Math.sin(b));
    const camDir = d.clone().multiplyScalar(Math.cos(p)).addScaledVector(hz, Math.sin(p));
    const T = d.clone().multiplyScalar(1 + (o.lift || 0));
    const c = this.camera;
    c.position.copy(T).addScaledVector(camDir, o.range ?? 1);
    const u = d.clone().multiplyScalar(Math.sin(p)).addScaledVector(hz, -Math.cos(p));
    c.up.copy(north.clone().lerp(u, o.upMix ?? 1).normalize());
    c.lookAt(T);
    if (o.look) c.rotateX(MathX.deg(o.look));
    if (o.roll) c.rotateZ(MathX.deg(o.roll));
    const dist = c.position.length();
    this.uniforms.uHaze.value = MathX.smooth(dist, 1.2, 2.3);
    c.fov = o.fov ?? 34; c.near = Math.max(0.0004, (dist - 1.03) * 0.15); c.far = 400; c.updateProjectionMatrix(); c.updateMatrixWorld(true);
  }

  // per frame: s = { t, van0, front, level, sea, mode, lights, foam, swirl, sun:[lon,lat], spin, clouds, ghost }
  set(s) {
    const U = this.uniforms;
    U.uT.value = s.t; U.uVan0.value = s.van0 ?? 1e9; U.uVanDur.value = s.vanDur ?? 1.0;
    U.uFront.value = s.front || 0; U.uLevel.value = s.level || 0; U.uSea.value = s.sea || 0; U.uMode.value = s.mode || 0;
    U.uLights.value = s.lights ?? 1; U.uFoam.value = s.foam || 0; U.uSwirl.value = s.swirl || 0; U.uGhost.value = s.ghost || 0;
    U.uBasinLit.value = s.basinLit ?? 1; U.uMoon.value = s.moon || 0; U.uGhostL.value = s.ghostL || 0; U.uSpill.value = s.spill || 0;
    if (s.sun) U.uSun.value.copy(afDir(s.sun[0], s.sun[1]));
    // the fine patch for close shots: [lon0, lat0, lon1, lat1]
    const P = s.patch;
    this.patch.visible = !!P; U.uPatchOn.value = P ? 1 : 0;
    if (P) U.uPatch.value.set((P[0] + 180) / 360, (P[1] + 90) / 180, (P[2] - P[0]) / 360, (P[3] - P[1]) / 180);
    this.cloudMat.uniforms.uOff.value = s.t * 0.00012;
    this.cloudMat.uniforms.uOpacity.value = s.clouds ?? 1;
    this.cloudMat.uniforms.uAfr.value = MathX.smooth(s.t, (s.van0 ?? 1e9) + 0.2, (s.van0 ?? 1e9) + 1.4);
    this.clouds.visible = (s.clouds ?? 1) > 0.01;
    this.atmo.material.uniforms.uK.value = (s.atmo ?? 1) * MathX.lerp(0.3, 1, U.uHaze.value);
    this.lanes.update(s);
    this.flow.update(s, this.camera);
  }
}

/* ---------------------------------------------------------------------------------------------------------------------
   TRADE LANES — the world's main shipping routes as glowing ribbons on the sphere, ships as moving dots. Routes are
   waypoint chains (lon, lat) that keep to the sea. Each lane knows whether it serves Africa (an African port, or the
   Suez Canal / the Cape) so it can break when the continent goes.
   --------------------------------------------------------------------------------------------------------------------- */
const AF_WP = {
  rot: [4.0, 52.0], ham: [9.9, 53.6], ant: [4.3, 51.3], fel: [1.4, 51.9], le: [0.1, 49.5], chn: [-3.5, 49.8], fin: [-9.8, 43.2], lis: [-9.6, 38.6],
  gib: [-5.6, 35.95], alb: [-1.5, 36.6], sar: [8.0, 38.0], mal: [14.5, 35.6], cre: [24.0, 34.6], sai: [32.4, 31.5], suez: [32.6, 29.6], rsN: [34.5, 26.5],
  rsM: [38.5, 20.5], rsS: [42.0, 15.0], bab: [43.4, 12.6], ade: [48.0, 12.4], soc: [54.5, 12.0], ara: [62.0, 14.0], col: [79.5, 5.8], dnd: [87, 5.0],
  mal2: [97.0, 5.6], sin: [103.9, 1.25], scs: [111.0, 10.0], hkg: [114.2, 22.1], sha: [122.3, 30.8], tw: [120.5, 23.0], bus: [129.1, 35.0], tok: [139.9, 34.9],
  gen: [8.9, 44.4], pir: [23.6, 37.9], ist: [28.98, 40.98], bey: [35.5, 33.9], hor: [56.4, 26.6], dub: [55.1, 25.0], omn: [58.8, 22.8], kar: [66.9, 24.7], mum: [72.8, 18.9],
  nyc: [-73.9, 40.5], ny0: [-68.0, 40.0], hal: [-63.5, 44.5], atN: [-40.0, 45.0], atM: [-30.0, 38.0], azo: [-25.0, 36.0], mia: [-79.9, 25.6], car: [-75.0, 15.5],
  pan: [-79.6, 9.2], pacP: [-82.0, 6.5], hou: [-94.8, 28.9], sav: [-80.9, 31.9],
  sant: [-46.3, -24.0], rio: [-43.1, -23.0], bah: [-38.0, -13.5], rec: [-34.5, -8.0], bue: [-57.3, -35.0], at0: [-30.0, 0.0], at1: [-20.0, 10.0],
  cpe: [18.3, -34.6], agul: [22.0, -36.5], dur: [31.2, -29.9], moz: [41.0, -20.0], mom: [39.9, -4.2], dar: [39.5, -6.7], zan: [42.5, -5.0], som: [51.5, 2.0],
  lag: [3.3, 6.3], tem: [0.0, 5.5], abi: [-4.0, 5.1], dak: [-17.6, 14.6], can: [-15.5, 28.0], cas: [-7.7, 33.8], tng: [-5.5, 35.9], lua: [13.0, -8.7], gg: [5.0, 1.0],
  wb: [14.3, -22.9], perth: [115.5, -32.0], ind: [80.0, -15.0], indS: [60.0, -25.0], mad: [50.0, -28.0], sumS: [100.0, -8.0], aus: [151.3, -33.9], aus2: [140.0, -40.0],
  lax: [-118.3, 33.6], pacM: [-150.0, 30.0], haw: [-158.0, 21.0], pacW: [170.0, 32.0], van: [-123.5, 48.4], alu: [-170.0, 50.0],
};
// lanes: [waypoints, kind] — kind: 'af' an African port, 'suez' through the canal, 'cape' round the Cape, '' other
const AF_LANES = [
  // Europe ↔ Asia through Suez (the main artery)
  [['rot', 'chn', 'fin', 'lis', 'gib', 'alb', 'sar', 'mal', 'cre', 'sai', 'suez', 'rsN', 'rsM', 'rsS', 'bab', 'ade', 'soc', 'ara', 'col', 'dnd', 'mal2', 'sin', 'scs', 'hkg', 'sha'], 'suez'],
  [['ham', 'rot', 'fel', 'chn', 'fin', 'lis', 'gib', 'alb', 'sar', 'mal', 'cre', 'sai', 'suez', 'rsN', 'rsM', 'rsS', 'bab', 'ade', 'soc', 'ara', 'col', 'dnd', 'mal2', 'sin', 'scs', 'tw', 'bus', 'tok'], 'suez'],
  [['gen', 'sar', 'mal', 'cre', 'sai', 'suez', 'rsN', 'rsM', 'rsS', 'bab', 'ade', 'soc', 'ara', 'mum'], 'suez'],
  [['pir', 'cre', 'sai', 'suez', 'rsN', 'rsM', 'rsS', 'bab', 'ade', 'omn', 'hor', 'dub'], 'suez'],
  [['ant', 'chn', 'fin', 'lis', 'gib', 'alb', 'sar', 'mal', 'cre', 'sai', 'suez', 'rsN', 'rsM', 'rsS', 'bab', 'ade', 'soc', 'ara', 'kar'], 'suez'],
  // the Cape route and Africa's ports
  [['rot', 'chn', 'fin', 'lis', 'can', 'dak', 'at1', 'gg', 'lua', 'wb', 'cpe', 'agul', 'indS', 'ind', 'sumS', 'sin'], 'cape'],
  [['rot', 'chn', 'fin', 'lis', 'can', 'dak', 'abi', 'tem', 'lag'], 'af'],
  [['ham', 'chn', 'fin', 'lis', 'cas'], 'af'], [['gen', 'sar', 'alb', 'tng'], 'af'], [['lis', 'can', 'dak'], 'af'],
  [['sin', 'dnd', 'ind', 'mad', 'dur'], 'af'], [['sha', 'scs', 'sin', 'dnd', 'ind', 'zan', 'mom'], 'af'], [['mum', 'ara', 'zan', 'dar'], 'af'],
  [['dub', 'omn', 'ara', 'som', 'mom'], 'af'], [['sant', 'rio', 'at0', 'gg', 'lag'], 'af'], [['nyc', 'ny0', 'atM', 'azo', 'can', 'dak', 'abi'], 'af'],
  [['hou', 'mia', 'car', 'at0', 'gg', 'lua'], 'af'], [['bue', 'rio', 'cpe', 'dur'], 'af'], [['perth', 'indS', 'mad', 'dur'], 'af'], [['dur', 'moz', 'mom'], 'af'],
  [['cpe', 'wb', 'lua', 'gg', 'lag', 'tem', 'abi', 'dak', 'cas', 'tng'], 'af'], [['sai', 'mal', 'alb', 'tng'], 'af'],
  // elsewhere (these survive)
  [['rot', 'chn', 'atN', 'hal', 'ny0', 'nyc'], ''], [['ham', 'rot', 'chn', 'atN', 'ny0', 'nyc', 'sav', 'mia'], ''], [['lis', 'azo', 'atM', 'mia', 'car', 'pan'], ''],
  [['nyc', 'sav', 'mia', 'car', 'pan', 'pacP', 'lax'], ''], [['lax', 'haw', 'pacW', 'tok', 'sha'], ''], [['van', 'alu', 'pacW', 'tok', 'bus', 'sha'], ''],
  [['lax', 'pacM', 'pacW', 'tw', 'hkg', 'sin'], ''], [['sin', 'sumS', 'perth'], ''], [['sin', 'scs', 'hkg', 'sha', 'bus', 'tok'], ''], [['aus', 'aus2', 'perth', 'sumS', 'sin'], ''],
  [['sant', 'rio', 'bah', 'rec', 'at0', 'car', 'mia', 'hou'], ''], [['bue', 'sant', 'rio', 'rec', 'atM', 'lis'], ''], [['dub', 'hor', 'kar', 'mum', 'col', 'dnd', 'mal2', 'sin'], ''],
  [['ist', 'pir', 'cre', 'sai'], ''], [['gen', 'sar', 'mal', 'pir', 'ist'], ''], [['bey', 'cre', 'mal', 'sar', 'alb', 'gib', 'lis'], ''], [['aus', 'tok'], ''], [['col', 'mum', 'kar', 'dub'], ''],
];
// the detours once Asia–Europe traffic can't use Suez or the Cape: across the Pacific and through Panama
const AF_DETOURS = [
  [['sha', 'bus', 'tok', 'pacW', 'haw', 'pacM', 'lax', 'pacP', 'pan', 'car', 'mia', 'atM', 'azo', 'lis', 'fin', 'chn', 'rot'], 'detour'],
  [['hkg', 'tw', 'tok', 'pacW', 'pacM', 'pacP', 'pan', 'car', 'atM', 'azo', 'fin', 'chn', 'ham'], 'detour'],
  [['sin', 'scs', 'tw', 'pacW', 'haw', 'pacP', 'pan', 'car', 'atM', 'gib', 'alb', 'gen'], 'detour'],
];

class AfLanes {
  constructor(scene) {
    this.group = new THREE.Group(); scene.add(this.group);
    const rng = new RNG(9191);
    this.lanes = [];
    const all = AF_LANES.concat(AF_DETOURS);
    // each lane is drawn several times with small offsets ("hundreds of connections")
    all.forEach(([wps, kind], li) => {
      const copies = kind === 'detour' ? 3 : kind === '' ? 3 : 4;
      for (let c = 0; c < copies; c++) {
        const off = c === 0 ? 0 : (rng.next() - 0.5) * 1.6;
        const pts = this._path(wps.map((k) => AF_WP[k]), off, rng.fork(li * 13 + c));
        this.lanes.push({ kind, pts, cut: rng.range(0, 1), main: c === 0, li, len: this._len(pts) });
      }
    });
    // one mesh per lane (a flat ribbon on the sphere) + ship dots
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: 'attribute float aS; attribute float aA; attribute float aR; varying float vS; varying float vA; varying float vR; varying vec3 vC; attribute vec3 aC; void main(){ vS = aS; vA = aA; vR = aR; vC = aC; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform float uT; varying float vS; varying float vA; varying float vR; varying vec3 vC; void main(){ float pulse = 0.65 + 0.35 * sin(vS * 60.0 - uT * 3.0); gl_FragColor = vec4(mix(vC, vec3(1.6, 0.16, 0.1), vR) * vA * mix(pulse, 1.0, vR), 1.0); }',
    });
    this.meshes = this.lanes.map((L) => { const m = this._ribbon(L); this.group.add(m); return m; });
    // ship dots: instanced small quads
    const N = this.nShips = 900;
    this.shipLane = new Int32Array(N); this.shipPhase = new Float32Array(N); this.shipSpeed = new Float32Array(N);
    for (let i = 0; i < N; i++) { this.shipLane[i] = Math.floor(hash1(i * 3 + 1) * this.lanes.length); this.shipPhase[i] = hash1(i * 3 + 2); this.shipSpeed[i] = (0.6 + 0.8 * hash1(i * 3 + 3)) * 0.006; }
    const g = new THREE.BufferGeometry();
    this.shipPos = new Float32Array(N * 3); this.shipCol = new Float32Array(N * 3);
    g.setAttribute('position', new THREE.BufferAttribute(this.shipPos, 3)); g.setAttribute('color', new THREE.BufferAttribute(this.shipCol, 3));
    this.ships = new THREE.Points(g, new THREE.PointsMaterial({ size: 5, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, map: this._dot() }));
    this.group.add(this.ships);
    // the ports: rings
    this.ports = [];
  }
  _dot() { const c = Tex.canvas(32, 32), x = c.getContext('2d'); const g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); return Tex.tex(c, { srgb: false }); }
  _len(pts) { let s = 0; for (let i = 1; i < pts.length; i++) s += pts[i].distanceTo(pts[i - 1]); return s; }
  // a smooth path through the waypoints (slerped, Catmull-Rom on the sphere), lifted slightly off the surface
  _path(wps, off, rng) {
    const P = wps.map(([lo, la]) => afDir(lo + off * 0.7, la + off * 0.5));
    const out = [];
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      const n = Math.max(4, Math.ceil(p1.angleTo(p2) / 0.012));
      for (let k = 0; k < n; k++) {
        const u = k / n, u2 = u * u, u3 = u2 * u;
        const v = new THREE.Vector3()
          .addScaledVector(p0, -0.5 * u3 + u2 - 0.5 * u).addScaledVector(p1, 1.5 * u3 - 2.5 * u2 + 1)
          .addScaledVector(p2, -1.5 * u3 + 2 * u2 + 0.5 * u).addScaledVector(p3, 0.5 * u3 - 0.5 * u2);
        out.push(v.normalize().multiplyScalar(1.0035));
      }
    }
    out.push(P[P.length - 1].clone().multiplyScalar(1.0035));
    void rng;
    return out;
  }
  _ribbon(L) {
    const pts = L.pts, n = pts.length, w = L.main ? 0.0022 : 0.0012;
    const pos = new Float32Array(n * 2 * 3), s = new Float32Array(n * 2), a = new Float32Array(n * 2), c = new Float32Array(n * 2 * 3), idx = [];
    let acc = 0;
    const col = L.kind === 'detour' ? [1.0, 0.55, 0.25] : L.kind === '' ? [0.45, 0.8, 1.0] : [0.55, 0.85, 1.0];
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[Math.min(n - 1, i + 1)], r = pts[Math.max(0, i - 1)];
      const tan = q.clone().sub(r).normalize(), side = p.clone().normalize().cross(tan).normalize().multiplyScalar(w);
      if (i) acc += p.distanceTo(pts[i - 1]);
      for (let k = 0; k < 2; k++) {
        const v = p.clone().addScaledVector(side, k ? 1 : -1), j = i * 2 + k;
        pos.set([v.x, v.y, v.z], j * 3); s[j] = acc / L.len; a[j] = 0; c.set(col, j * 3);
      }
      if (i < n - 1) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.BufferAttribute(s, 1));
    g.setAttribute('aA', new THREE.BufferAttribute(a, 1)); g.setAttribute('aC', new THREE.BufferAttribute(c, 3)); g.setIndex(idx);
    g.setAttribute('aR', new THREE.BufferAttribute(new Float32Array(n * 2), 1));
    const m = new THREE.Mesh(g, this.mat); m.frustumCulled = false; m.userData.L = L; return m;
  }
  // the lane's brightness along its length at time s: lanes appear (grow in), African lanes and Suez break and fade,
  // detours draw in. s.trade = { on, grow, cut0, cut1, suez, detour, k }
  _alpha(L, u, s) {
    const T = s.trade; if (!T) return 0;
    let a = (L.main ? 0.55 : 0.28) * T.on;
    const grow = MathX.clamp((T.grow - u * 0.6) / 0.4, 0, 1); a *= grow;
    if (L.kind === 'af' || L.kind === 'cape') {
      // each lane breaks at its own moment: it flares red, then flickers out, retracting from the African end
      // (the end of the waypoint chain) back toward the port it came from
      const tc = T.cut0 + (T.cut1 - T.cut0) * L.cut;
      const k = MathX.clamp((s.t - tc) / 0.9, 0, 1), flick = k > 0 && k < 1 ? (Math.sin(s.t * 70 + L.li) > 0 ? 1 : 0.35) : 1;
      a *= MathX.clamp((1 - k) * 1.6 - u * 0.6 * (k > 0 ? 1 : 0), 0, 1) * flick * (1 + 0.8 * MathX.clamp((s.t - tc + 0.45) / 0.15, 0, 1) * (1 - k));
    }
    if (L.kind === 'suez') { const k = MathX.clamp((s.t - T.suez) / 0.6, 0, 1); a *= (1 - k) * (k > 0 && k < 1 ? (Math.sin(s.t * 60) > 0 ? 1.4 : 0.3) : 1) + (1 - k) * 0; }
    if (L.kind === 'detour') a = (L.main ? 0.75 : 0.35) * T.on * MathX.clamp((T.detour - u) / 0.15, 0, 1) * (T.detour > 0 ? 1 : 0);
    return a;
  }
  // how red a breaking lane is (0 … 1): from just before its break until it is gone
  _red(L, s) {
    const T = s.trade; if (!T) return 0;
    if (L.kind === 'af' || L.kind === 'cape') { const tc = T.cut0 + (T.cut1 - T.cut0) * L.cut; return MathX.clamp((s.t - tc + 0.45) / 0.15, 0, 1); }
    if (L.kind === 'suez') return MathX.clamp((s.t - T.suez + 0.3) / 0.12, 0, 1);
    return 0;
  }
  update(s) {
    const on = s.trade && s.trade.on > 0.001;
    this.group.visible = !!on;
    if (!on) return;
    this.mat.uniforms.uT.value = s.t;
    for (const m of this.meshes) {
      const L = m.userData.L, A = m.geometry.attributes.aA, S = m.geometry.attributes.aS, R = m.geometry.attributes.aR;
      for (let j = 0; j < A.count; j++) A.array[j] = this._alpha(L, S.array[j], s);
      R.array.fill(this._red(L, s));
      A.needsUpdate = true; R.needsUpdate = true;
    }
    for (let i = 0; i < this.nShips; i++) {
      const L = this.lanes[this.shipLane[i]], u = (this.shipPhase[i] + s.t * this.shipSpeed[i] * (L.kind === 'detour' ? 2 : 1)) % 1;
      const f = u * (L.pts.length - 1), k = Math.floor(f), p = L.pts[k].clone().lerp(L.pts[Math.min(L.pts.length - 1, k + 1)], f - k).multiplyScalar(1.001);
      const a = MathX.clamp(this._alpha(L, u, s) * 2.2, 0, 1);
      this.shipPos.set([p.x, p.y, p.z], i * 3);
      const rr = this._red(L, s), c = L.kind === 'detour' ? [1, 0.7, 0.4] : [0.85 + 0.15 * rr, 0.95 - 0.8 * rr, 1 - 0.85 * rr];
      this.shipCol.set([c[0] * a, c[1] * a, c[2] * a], i * 3);
    }
    this.ships.geometry.attributes.position.needsUpdate = true; this.ships.geometry.attributes.color.needsUpdate = true;
  }
}

/* ---------------------------------------------------------------------------------------------------------------------
   FLOW — wind and current streamlines over the globe (an ILLUSTRATION of circulation, not a climate model). A simple
   zonal field (trade winds, westerlies, polar easterlies) plus monsoon-like cells over the land; with k → 1 the cells
   over the old continent are gone and the lines bend into a new pattern. Streamlines are traced every frame from
   seeded starting points (a pure function of t), drawn as ribbons with a travelling bright head.
   --------------------------------------------------------------------------------------------------------------------- */
class AfFlow {
  constructor(scene) {
    this.N = 340; this.M = 30;
    const n = this.N * this.M * 2;
    this.pos = new Float32Array(n * 3); this.col = new Float32Array(n * 3);
    const idx = [];
    for (let l = 0; l < this.N; l++) for (let i = 0; i < this.M - 1; i++) { const b = (l * this.M + i) * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(this.col, 3)); g.setIndex(idx);
    this.mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    this.mesh.frustumCulled = false; scene.add(this.mesh);
    this.seeds = [];
    for (let l = 0; l < this.N; l++) this.seeds.push([hash1(l * 7 + 1) * 360 - 180, Math.asin(hash1(l * 7 + 2) * 1.9 - 0.95) * 180 / Math.PI, hash1(l * 7 + 3)]);
  }
  // wind (east, north) in deg/step at lon, lat; k blends today's field into the changed one
  field(lo, la, k, t) {
    const r = la * Math.PI / 180;
    let u = -Math.cos(3 * r) * 1.0, v = 0.25 * Math.sin(6 * r) * (Math.abs(la) < 60 ? 1 : 0.3);
    u += 0.25 * Math.sin(lo * 0.05 + t * 0.2) * Math.cos(r);
    // today: Africa's land drives cells (the Saharan high, the West African monsoon, the East African jet)
    const cell = (cx, cy, rad, s) => { const dx = ((lo - cx + 540) % 360) - 180, dy = la - cy, d2 = (dx * dx + dy * dy) / (rad * rad); const e = Math.exp(-d2) * s; return [-dy / rad * e, dx / rad * e]; };
    const A = [cell(15, 22, 18, 1.4), cell(0, 8, 10, -0.9), cell(45, 5, 12, 1.0), cell(25, -18, 12, 1.1)];
    // changed: an open ocean's westerly flow straight through, and a new low over the warm new sea
    const B = [cell(20, 0, 22, -0.8), cell(10, 25, 14, 0.5)];
    for (const [a, b] of A) { u += a * (1 - k); v += b * (1 - k); }
    for (const [a, b] of B) { u += a * k; v += b * k; }
    // the bend reaches out over the neighbouring oceans as k grows
    v += k * 0.6 * Math.sin(lo * 0.035) * Math.exp(-(((la - 10) / 25) ** 2));
    return [u, v];
  }
  update(s, cam) {
    const F = s.flow; this.mesh.visible = !!F && F.on > 0.001;
    if (!this.mesh.visible) return;
    const tmp = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    for (let l = 0; l < this.N; l++) {
      let [lo, la, ph] = this.seeds[l];
      const head = ((s.t * 0.35 + ph) % 1);
      for (let i = 0; i < this.M; i++) {
        const [u, v] = this.field(lo, la, F.k, s.t);
        const p = afDir(lo, la).multiplyScalar(1.012);
        const nx = lo + u * 0.9 / Math.max(0.25, Math.cos(la * Math.PI / 180)), ny = MathX.clamp(la + v * 0.9, -80, 80);
        const q = afDir(nx, ny).multiplyScalar(1.012);
        const tan = q.clone().sub(p).normalize(), side = p.clone().normalize().cross(tan).normalize().multiplyScalar(0.0016 * (1 - i / this.M * 0.5));
        const along = i / (this.M - 1), d = Math.abs(along - head), glow = Math.exp(-d * d * 60);
        const changed = F.k * Math.exp(-((((((lo - 20) + 540) % 360) - 180) ** 2) + ((la - 5) ** 2)) / 1600);
        const a = F.on * (0.18 + 0.9 * glow) * Math.sin(Math.PI * along);
        const c = [0.6 + 0.4 * changed, 0.85 - 0.25 * changed, 1.0 - 0.6 * changed];
        for (let k = 0; k < 2; k++) {
          tmp.copy(p).addScaledVector(side, k ? 1 : -1);
          const j = (l * this.M + i) * 2 + k;
          this.pos.set([tmp.x, tmp.y, tmp.z], j * 3); this.col.set([c[0] * a, c[1] * a, c[2] * a], j * 3);
        }
        lo = nx; la = ny;
      }
    }
    this.mesh.geometry.attributes.position.needsUpdate = true; this.mesh.geometry.attributes.color.needsUpdate = true;
    void cam; void up;
  }
}
