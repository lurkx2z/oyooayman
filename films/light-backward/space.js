/* =====================================================================
   SPACE — the Earth from space, lit by two suns (the textures are the shared EarthScene's; the lighting is this
   film's), the stream of sunlight around it, Voyager 1, and the second Sun running back through time. Modes:
     why      ILLUSTRATION: sunlight streaming past the Earth; at 10:00 every ray turns round and floods back
              towards the Sun; the Earth is in the way, its night side lights up — except in the gap behind it
     shadow   ILLUSTRATION: from behind the Earth: the gap (its old shadow) comes back too; the Earth slides out
     wave     the real Earth (physics.js's exit time for every place): the light sweeping across the night side
              (sped up 20×), your garden lit at 10:01:20
     half     the day side at 10:00:00: dark everywhere at once
     voyager  ILLUSTRATION: Voyager 1's radio signal, turned round
     twosuns  three days later: no night side, just a thin dim ring where both suns are setting
     ice      over the Arctic: the sea ice going (months)        boil   the oceans boiling away (a thousand years)
     birth    the second Sun showing the Sun's past: younger, redder, then a star being born in its disc
   Frames: the real-Earth shots use the Earth-fixed frame (lon/lat as in EarthScene: x = lon 0, y = north); the
   illustrations put the Sun far off along −x and the Earth moving along +y.
   ===================================================================== */

const LB_SP = {
  u: 0.11, c: 2.2, Lh: 9,                  // the illustration: the Earth's speed, light's speed (Earth radii / s), the stream's half-length
};
// equatorial → the Earth-fixed scene frame at story time s
function lbGeoScene(v, s) {
  const th = lbGmst(s) * 15 * LB_D2R, x = v[0] * Math.cos(th) + v[1] * Math.sin(th), y = -v[0] * Math.sin(th) + v[1] * Math.cos(th);
  return [x, v[2], -y];
}
const lbLonLatScene = (lon, lat) => { const p = lat * LB_D2R, l = lon * LB_D2R; return [Math.cos(p) * Math.cos(l), Math.sin(p), -Math.cos(p) * Math.sin(l)]; };
// the exit-time map over the Earth (u: lon −180…180, v: lat −90…90): when each place's night side gets the reversed light
function lbExitMap(W = 256, H = 128) {
  const d = new Float32Array(W * H * 4);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const lat = -90 + 180 * (j + 0.5) / H, lon = -180 + 360 * (i + 0.5) / W, X = lbEarthPoint(lbFrame(0, lat, lon));
    d[(j * W + i) * 4] = Math.min(6e4, lbExitTime(X, LB_SKY.S, LB_SKY.U, LBP.R));
  }
  const tex = new THREE.DataTexture(d, W, H, THREE.RGBAFormat, THREE.FloatType);
  tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.wrapS = THREE.RepeatWrapping; tex.needsUpdate = true;
  return tex;
}

// Voyager 1 (about 4 m dish): the dish, the ten-sided bus, the RTG boom, the magnetometer boom
function lbVoyager(parent) {
  const g = new THREE.Group(), white = lbStd('#e6e4de', 0.45, 0.1), gold = lbStd('#b8902e', 0.35, 0.7), dark = lbStd('#3a3c40', 0.5, 0.6);
  const dish = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.6, 0.03], [1.2, 0.12], [1.6, 0.24], [1.85, 0.33], [1.85, 0.36], [0, 0.03]].map(([x, y]) => new THREE.Vector2(x, y)), 48), white);
  dish.rotation.x = Math.PI / 2; dish.position.z = 0.3; g.add(dish);
  lbCyl(0.04, 0.04, 1.1, dark, 0, 0, 0.95, g, 8).rotation.x = Math.PI / 2;
  lbCyl(0.12, 0.12, 0.12, white, 0, 0, 1.5, g, 12).rotation.x = Math.PI / 2;
  lbCyl(0.9, 0.9, 0.45, gold, 0, 0, -0.1, g, 10).rotation.x = Math.PI / 2;
  const rtg = lbBox(0.07, 0.07, 2.4, dark, 0, -1.0, -0.6, g); rtg.rotation.x = 0.5;
  for (let k = 0; k < 3; k++) lbCyl(0.2, 0.2, 0.4, dark, 0, -1.05 - k * 0.32, -0.95 - k * 0.18, g, 10);
  const mag = lbBox(0.03, 0.03, 13, lbStd('#9a9a96', 0.5, 0.4), 0.0, 0.3, -6.8, g); mag.rotation.x = -0.05;
  lbBox(0.04, 0.04, 2.2, dark, 1.4, 0.3, -0.4, g).rotation.y = 0.9;
  g.traverse((m) => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; } });
  parent.add(g);
  return g;
}

LB_SETS.space = (app) => {
  const S = lbSet(app, { sky: '#000000', fov: 35, near: 0.01, far: 2000, hemi: ['#1a2030', '#000000', 0.08], sun: [-60, 4, 10], sunI: 2.6 });
  const scene = S.scene, cam = S.camera, K = lbK;
  // ---- the stars (fixed)
  { const r = new RNG(515), pos = [], col = [];
    for (let i = 0; i < 4200; i++) { const u = r.next() * 2 - 1, a = r.next() * 6.2832, q = Math.sqrt(1 - u * u), b = Math.pow(r.next(), 5) * 0.9 + 0.08, c = lbStarRGB(r.range(3500, 12000));
      pos.push(q * Math.cos(a) * 900, u * 900, q * Math.sin(a) * 900); col.push(c[0] * b, c[1] * b, c[2] * b); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const st = new THREE.Points(g, new THREE.PointsMaterial({ size: 2.0, sizeAttenuation: false, vertexColors: true, depthWrite: false, fog: false })); st.renderOrder = -9; st.frustumCulled = false; scene.add(st); }
  // ---- the Earth: the shared textures, this film's two-sun lighting
  const ES = new EarthScene();
  const exitTex = lbExitMap();
  const cloudT = ES.clouds.material.uniforms.uMap.value;
  const EU = {
    uDay: ES.uniforms.uDay, uMask: ES.uniforms.uMask, uNight: ES.uniforms.uNight, uCloud: { value: cloudT }, uExit: { value: exitTex },
    uSun: { value: new THREE.Vector3(-1, 0, 0) }, uK1: { value: 1 }, uK2: { value: 0 }, uS: { value: 0 }, uMode: { value: 0 },
    uUdir: { value: new THREE.Vector3(0, 1, 0) }, uShift: { value: 0 }, uAb: { value: 0 }, uIce: { value: 1 }, uSea: { value: 0 }, uSteam: { value: 0 }, uPoleClear: { value: 0 }, uLights: { value: 1 }, uOff: { value: 0 },
  };
  const two = /* glsl */`
    uniform sampler2D uExit; uniform vec3 uSun, uUdir; uniform float uK1, uK2, uS, uMode, uShift, uAb;
    // the second Sun at this point (0…1): out of the old shadow yet?
    float on2(vec2 uv, vec3 n) {
      if (uMode < 0.5) { float ex = texture2D(uExit, uv).r; return smoothstep(ex - 1.0, ex + 1.0, uS); }
      vec3 p = n - uSun * dot(n, uSun), q = p + uUdir * (uShift + uAb * max(dot(n, -uSun), 0.0));
      return smoothstep(0.985, 1.03, length(q));
    }`;
  const earthMat = new THREE.ShaderMaterial({
    uniforms: EU,
    vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vW; varying vec3 vP; void main(){ vUv = uv; vP = position; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: /* glsl */`
      uniform sampler2D uDay, uMask, uNight, uCloud; uniform float uIce, uSea, uSteam, uLights;
      float lbH3(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
      float lbN3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(lbH3(i), lbH3(i + vec3(1,0,0)), f.x), mix(lbH3(i + vec3(0,1,0)), lbH3(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(lbH3(i + vec3(0,0,1)), lbH3(i + vec3(1,0,1)), f.x), mix(lbH3(i + vec3(0,1,1)), lbH3(i + vec3(1,1,1)), f.x), f.y), f.z); }
      ${two}
      varying vec2 vUv; varying vec3 vN; varying vec3 vW; varying vec3 vP;
      void main() {
        vec3 n = normalize(vN), v = normalize(cameraPosition - vW);
        float land = texture2D(uMask, vUv).r;
        vec3 alb = texture2D(uDay, vUv).rgb;
        float lat = (vUv.y - 0.5) * 180.0;
        // (the painted polar sea ice is replaced by this film's: it shrinks with uIce)
        alb = mix(alb, vec3(0.014, 0.06, 0.13), smoothstep(76.0, 81.0, lat) * (1.0 - land));
        float edge = mix(90.5, 71.0, uIce) + 8.0 * (lbN3(vP * 7.0) * 0.5 + lbN3(vP * 19.0) * 0.3 + lbN3(vP * 53.0) * 0.2 - 0.5);
        alb = mix(alb, vec3(0.86, 0.9, 0.94), smoothstep(edge - 1.2, edge + 1.2, lat) * (1.0 - land));
        // the oceans boiled away: the sea floor
        vec3 bed = vec3(0.46, 0.38, 0.29) * (0.75 + 0.5 * lbN3(vP * 14.0));
        alb = mix(alb, bed, (1.0 - land) * uSea);
        float c1 = dot(n, uSun), o2 = on2(vUv, n);
        float l1 = max(c1, 0.0) * uK1, l2 = max(-c1, 0.0) * uK2 * o2;
        vec3 col = alb * (0.05 * uLights + 1.12 * (l1 + l2));
        // (the front of the returning light, sweeping over the night side: a thin bright edge)
        col += vec3(1.0, 0.86, 0.62) * 0.5 * o2 * (1.0 - o2) * 4.0 * uK2 * step(c1, 0.0) * (1.0 - step(0.5, uMode));
        // sun glints on the sea, one per sun
        vec3 h1 = normalize(uSun + v), h2 = normalize(-uSun + v);
        float sea = (1.0 - land) * (1.0 - uSea);
        col += vec3(1.0, 0.95, 0.85) * (pow(max(dot(n, h1), 0.0), 420.0) * uK1 * step(0.0, c1) + pow(max(dot(n, h2), 0.0), 420.0) * uK2 * o2 * step(0.0, -c1)) * 0.32 * sea;
        // the air towards the limb
        float rim = pow(1.0 - max(dot(n, v), 0.0), 2.5);
        float lit = max(c1 + 0.15, 0.0) * uK1 + max(-c1 + 0.15, 0.0) * uK2 * o2;
        col = mix(col, vec3(0.45, 0.66, 0.95) * lit, rim * 0.62);
        // the city lights where it is still dark
        float dark = 1.0 - smoothstep(0.0, 0.12, l1 + l2);
        col += texture2D(uNight, vUv).rgb * dark * uLights * 1.5;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const earthG = new THREE.Group(); scene.add(earthG);
  const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 64), earthMat); earthG.add(earth);
  const cloudMat = new THREE.ShaderMaterial({
    uniforms: EU, transparent: true, depthWrite: false,
    vertexShader: 'varying vec2 vUv; varying vec3 vN; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */`
      uniform sampler2D uCloud; uniform float uSteam, uOff, uPoleClear;
      ${two}
      varying vec2 vUv; varying vec3 vN;
      void main() {
        vec3 n = normalize(vN); float a = texture2D(uCloud, vUv + vec2(uOff, 0.0)).r;
        a *= 1.0 - 0.9 * uPoleClear * smoothstep(0.62, 0.75, vUv.y);
        a = mix(a, 0.95, uSteam);
        float c1 = dot(n, uSun), o2 = on2(vUv, n);
        float l = smoothstep(-0.07, 0.62, c1) * uK1 + smoothstep(-0.07, 0.62, -c1) * uK2 * o2;
        vec3 col = vec3(0.01 + 0.92 * l) * mix(vec3(1.0, 0.8, 0.68), vec3(1.0), smoothstep(0.0, 0.16, abs(c1)));
        gl_FragColor = vec4(col * (0.84 + 0.16 * a), a * 0.92);
      }`,
  });
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(1.012, 96, 48), cloudMat); earthG.add(clouds);
  const atmoU = { uSun: EU.uSun, uK1: EU.uK1, uK2: EU.uK2, uA2: { value: 0 } };
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(1.07, 96, 48), new THREE.ShaderMaterial({
    uniforms: atmoU, side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform vec3 uSun; uniform float uK1, uK2, uA2; varying vec3 vN; varying vec3 vW;
      void main(){ vec3 v = normalize(cameraPosition - vW); float f = pow(max(0.0, 1.0 - abs(dot(normalize(vN), v)) * 1.05), 3.0);
        float c = dot(normalize(vN), uSun), lit = smoothstep(-0.35, 0.4, c) * uK1 + smoothstep(-0.35, 0.4, -c) * uK2 * uA2;
        gl_FragColor = vec4(vec3(0.32, 0.55, 1.0) * f * (0.12 + 1.15 * lit), 1.0); }`,
  }));
  earthG.add(atmo);
  // markers: your garden, Waikiki
  const dotM = (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, depthWrite: false });
  const london = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 8), dotM('#ffd27a')); london.position.set(...lbSc(lbLonLatScene(LBP.lon, LBP.lat), 1.004)); earthG.add(london);
  const hawaii = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 8), dotM('#ffd27a')); hawaii.position.set(...lbSc(lbLonLatScene(LBP.hawaii.lon, LBP.hawaii.lat), 1.004)); earthG.add(hawaii);
  // ---- the Sun (a far glare) and the stream of light
  const glow = lbDotTex(0.18);
  const sunSpr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: '#fff1d6', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  sunSpr.renderOrder = -5; scene.add(sunSpr);
  const sunCore = new THREE.Sprite(new THREE.SpriteMaterial({ map: lbDotTex(0.9), color: '#ffffff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  sunCore.renderOrder = -4; scene.add(sunCore);
  const stream = lbPuffs(scene, 26000, { additive: true, soft: 1.2 });
  const LANES = Array.from({ length: 240 }, (_, i) => ({ y: -2.8 + 6.8 * lbR(i, 21), z: -2.8 + 5.6 * lbR(i, 22), n: 26, p: lbR(i, 23) }));
  // ---- Voyager 1 and its signal
  const voy = new THREE.Group(); scene.add(voy); const vg = lbVoyager(voy); vg.rotation.y = -Math.PI / 2 + 0.25;
  const rings = Array.from({ length: 24 }, () => { const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 6, 64), new THREE.MeshBasicMaterial({ color: '#9fd0ff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); m.rotation.y = Math.PI / 2; voy.add(m); return m; });
  // ---- the second Sun's past (the birth shot): the disc of gas and dust it formed in
  const nursery = lbPuffs(scene, 4000, { additive: true, soft: 1.6 });
  const NUR = Array.from({ length: 1600 }, (_, i) => ({ r: 1.4 + 9 * Math.pow(lbR(i, 31), 0.7), a: lbR(i, 32) * 6.2832, h: (lbR(i, 33) - 0.5) * 0.5, s: 0.25 + 0.9 * lbR(i, 34) }));

  // the illustration's stream: the particle positions and who survives (see the header)
  const yE = (tau, tf) => LB_SP.u * (tau - tf);
  const exists = (x, y, z, tau, tf) => {
    if (x > 0) { const yc = yE(tau - x / LB_SP.c, tf); return Math.hypot(y - yc, z) >= 1; }      // (behind: not in the shadow)
    const r = Math.hypot(y - yE(tau, tf), z); return !(r < 1 && x > -Math.sqrt(1 - r * r));       // (in front: not yet absorbed)
  };
  const drawStream = (t, tf, alpha) => {
    const { c, Lh } = LB_SP, L2 = 2 * Lh, post = t > tf;
    for (let li = 0; li < LANES.length; li++) {
      const ln = LANES[li];
      for (let k = 0; k < ln.n; k++) {
        const p = (ln.p + k / ln.n) * L2;
        let x, ok, dir = 1;
        if (!post) { x = -Lh + (((p + c * t) % L2) + L2) % L2; ok = exists(x, ln.y, ln.z, t, tf); }
        else {
          const xf = -Lh + (((p + c * tf) % L2) + L2) % L2, back = c * (t - tf), xu = xf - back, wraps = Math.ceil(Math.max(0, -Lh - xu) / L2);
          x = xu + wraps * L2; const Xf = xf + wraps * L2; dir = -1;
          ok = exists(Xf, ln.y, ln.z, tf, tf);                                       // (it was there at the turn)
          if (ok) { const r = Math.hypot(ln.y - yE(t, tf), ln.z); if (r < 1) { const s = Math.sqrt(1 - r * r); if (x < s && Xf > -s) ok = false; } }
        }
        if (!ok) continue;
        for (let j = 0; j < 3; j++) stream.add(x - dir * 0.07 * j, ln.y, ln.z, 0.05 - 0.01 * j, alpha * (0.55 - 0.15 * j), 1.0, 0.9, 0.72);
      }
    }
  };

  const set = {
    scene, camera: cam,
    cuts() { return []; },
    frame(t, shot) {
      const m = shot.mode;
      let pos = [0, 0, 4], at = [0, 0, 0], fov = 35, drift = 0.002;
      stream.begin(); nursery.begin();
      earthG.visible = true; voy.visible = false; sunSpr.visible = sunCore.visible = false; london.visible = hawaii.visible = false;
      earthG.position.set(0, 0, 0); earthG.rotation.set(0, 0, 0);
      let k1 = 1, k2 = 0, s = lbStoryAt(t), mode = 0, shift = 0, ice = 1, sea = 0, steam = 0, lights = 1, a2 = 0;
      const sunAt = (p, size) => { sunSpr.visible = sunCore.visible = true; sunSpr.position.set(...p); sunCore.position.set(...p); sunSpr.scale.setScalar(size * 9); sunCore.scale.setScalar(size); };
      let Ssc = lbGeoScene(lbSunDir(s), s);
      if (m === 'why' || m === 'shadow') {
        // ILLUSTRATION: the Sun far off along −x, the Earth moving along +y
        const tf = m === 'why' ? LB.flip : lbCap('shadow', 1).show - 0.3, dt = t - tf;
        mode = 1; Ssc = [-1, 0, 0]; k1 = dt < 0 ? 1 : 0; k2 = dt < 0 ? 0 : MathX.smooth(dt, 0, 0.25);
        shift = 2 * LB_SP.u * Math.max(0, dt); earthG.position.y = yE(t, tf);
        earthG.rotation.set(0.41, m === 'why' ? 2.2 : 1.4, 0);
        drawStream(t, tf, 0.9);
        if (m === 'why') { const k = K(t, LB.why, LB.shadow, (x) => x); pos = [lbLerp(1.6, 2.2, k), lbLerp(1.4, 1.6, k), lbLerp(10.5, 9.5, k)]; at = [0.8, 0.4, 0]; fov = 42; sunAt([-30, 0, 0], 2.0); }
        else { const k = K(t, LB.shadow, LB.wave, (x) => x); pos = [lbLerp(7.5, 6.8, k), lbLerp(2.6, 2.9, k), lbLerp(4.4, 4.0, k)]; at = [0, earthG.position.y * 0.6, 0]; fov = 38; sunAt([-60, 0, 0], 3.5); }
      } else if (m === 'wave' || m === 'half') {
        // the real Earth at the real moment (the wave sped up 20×; the day side: the moment it went out)
        if (m === 'wave') { s = 20 * (t - (LB.wave + 0.7)); } else { s = t - (lbCap('half', 1).show + 0.6); }
        Ssc = lbGeoScene(lbSunDir(s), s);
        const V = lbGeoScene(lbVelDir(s), s), N = [0, 1, 0];
        const sn = lbSunSeen(s); k1 = sn.on ? sn.k * sn.r * sn.r : 0; k2 = 1; a2 = MathX.clamp(s / 214, 0, 1);
        if (m === 'wave') { london.visible = true; const k = K(t, LB.wave, LB.moonwhy, (x) => x); const d = lbN3([-Ssc[0] * 3.0 + V[0] * 1.9 + N[0] * 1.1, -Ssc[1] * 3.0 + V[1] * 1.9 + N[1] * 1.1, -Ssc[2] * 3.0 + V[2] * 1.9 + N[2] * 1.1]);
          const r = lbLerp(4.4, 4.0, k); pos = [d[0] * r, d[1] * r, d[2] * r]; fov = 36; }
        else { hawaii.visible = true; const hw = lbLonLatScene(LBP.hawaii.lon, LBP.hawaii.lat), d = lbN3([Ssc[0] * 0.75 + hw[0] * 0.5, Ssc[1] * 0.75 + hw[1] * 0.5 + 0.1, Ssc[2] * 0.75 + hw[2] * 0.5]); const k = K(t, LB.half, LB.wait, (x) => x), r = lbLerp(4.3, 3.9, k); pos = [d[0] * r, d[1] * r, d[2] * r]; fov = 36; }
        lights = 1;
      } else if (m === 'twosuns' || m === 'ice' || m === 'boil') {
        // after the first days: both suns everywhere (the Earth turning: a day every few seconds)
        const days = m === 'twosuns' ? (t - LB.space) * 0.1 : m === 'ice' ? (t - LB.heat) * 0.6 : (t - LB.boil) * 0.8;
        s = lbAt(12, 0) + 86400 * (3 + days); Ssc = lbGeoScene(lbSunDir(s), s);
        const sn = lbSunSeen(s); k1 = sn.k; k2 = 1; a2 = 1; lights = 1;
        if (m === 'twosuns') { const k = K(t, LB.space, LB.summer, (x) => x), side = lbN3(lbCross(Ssc, [0, 1, 0])), d = lbN3([side[0] + Ssc[0] * 0.12, 0.2, side[2] + Ssc[2] * 0.12]), r = lbLerp(4.2, 3.7, k); pos = [d[0] * r, d[1] * r, d[2] * r]; fov = 36; }
        else if (m === 'ice') { ice = 1 - K(t, LB.ice + 0.6, LB.ice + 4.2); const k = K(t, LB.heat, LB.boil, (x) => x); pos = [0.35, lbLerp(3.5, 3.1, k), 0.5]; at = [0, 0.75, 0]; fov = 38; }
        else { const k = K(t, LB.boil, LB.birth, (x) => x), c3 = lbCap('boil', 2).show; steam = K(t, lbCap('boil', 1).show, c3 + 1.5) * (1 - K(t, c3 + 3.5, c3 + 6.5)) ; sea = K(t, c3 + 2.0, c3 + 6.0);
          const d = lbN3([0.9, 0.3, 0.3]); pos = [d[0] * lbLerp(4.3, 3.9, k), d[1] * lbLerp(4.3, 3.9, k), d[2] * lbLerp(4.3, 3.9, k)]; fov = 36; }
      } else if (m === 'voyager') {
        // ILLUSTRATION: Voyager 1; its signal (rings) heading for Earth (off to the left) turns round at 10:00
        earthG.visible = false; voy.visible = true; voy.position.set(0, 0, 0);
        const tf = lbCap('voyager', 1).show + 1.4, k = K(t, LB.voyager, LB.ret, (x) => x);
        pos = [lbLerp(4.5, 3.6, k), lbLerp(2.2, 1.8, k), lbLerp(13, 11.5, k)]; at = [-3.2, 0, 0]; fov = 42;
        sunAt([-500, 30, -120], 3.2);
        const v = 1.6, every = 0.55, L = 26;
        rings.forEach((rg, i) => {
          // ring i: sent at tSent = tf − i·every… (before the turn) or after it
          const tSent = tf + (i - 14) * every, dt = t - tSent;
          let x;
          if (tSent < tf) { const sOut = t < tf ? dt : (tf - tSent) - (t - tf); x = -2.2 - v * sOut; if (sOut < 0) { rg.material.opacity = 0; return; } }
          else { if (dt < 0) { rg.material.opacity = 0; return; } x = -2.2 - v * dt; }
          rg.position.set(x, 0, 0); rg.scale.setScalar(1.6 + 0.06 * Math.abs(x + 2.2)); rg.material.opacity = 0.55 * MathX.smooth(-x, 2.2, 2.8) * (1 - MathX.smooth(-x, L - 6, L));
          rg.material.color.set(tSent < tf && t > tf ? '#ffb48a' : '#9fd0ff');
        });
        S.sun.position.set(-500, 30, -120); S.sun.intensity = 2.4;
      } else if (m === 'birth') {
        // the second Sun, showing the Sun further and further back: younger, then a star being born in its disc
        earthG.visible = false;
        const k = K(t, lbCap('birth', 1).show - 0.2, LB.nightBack - 0.2, (x) => x), red = MathX.smooth(k, 0.55, 0.95);
        sunAt([0, 0, 0], lbLerp(1.0, 1.5, red));
        sunCore.material.color.setRGB(1.0, lbLerp(0.97, 0.62, red), lbLerp(0.92, 0.42, red)); sunSpr.material.color.setRGB(1.0, lbLerp(0.9, 0.55, red), lbLerp(0.8, 0.35, red));
        sunCore.material.opacity = lbLerp(1, 0.75, red);
        pos = [0, lbLerp(1.2, 3.2, k), lbLerp(16, 13, k)]; at = [0, 0, 0]; fov = 34;
        const dk = MathX.smooth(k, 0.45, 0.95), tw = t * 0.05;
        if (dk > 0) for (const q of NUR) { const a = q.a + tw / Math.sqrt(q.r); nursery.add(Math.cos(a) * q.r, q.h * q.r * 0.3, Math.sin(a) * q.r, q.s * (0.6 + q.r * 0.12), 0.06 * dk * (1.1 - q.r / 11), 0.9, 0.55, 0.32); }
      }
      if (m !== 'voyager' && m !== 'birth') { sunSpr.material.color.set('#fff1d6'); sunCore.material.color.set('#ffffff'); sunCore.material.opacity = 1; }
      EU.uSun.value.set(...Ssc); EU.uK1.value = k1; EU.uK2.value = k2; EU.uS.value = s; EU.uMode.value = mode; EU.uShift.value = shift; EU.uAb.value = mode ? LB_SP.u / LB_SP.c : 0;
      EU.uIce.value = ice; EU.uPoleClear.value = m === 'ice' ? 1 : 0; EU.uSea.value = sea; EU.uSteam.value = steam; EU.uLights.value = lights; EU.uOff.value = t * 0.0004; atmoU.uA2.value = mode ? (k2 > 0 ? 0.6 : 0) : a2;
      if (m !== 'voyager') { S.sun.intensity = 0; }
      { const d = lbDrift(t, drift, 0.25, 5); lbCam(cam, [pos[0] + d[0], pos[1] + d[1], pos[2] + d[2]], at, fov); }
      stream.end(); nursery.end();
      this._mode = m; this._s = s;
    },
    labels(t) {
      const m = lbShotAt(t).mode, out = [], W = StoryHUD.win, wp = (o) => { const v = new THREE.Vector3(); o.getWorldPosition(v); return [v.x, v.y, v.z]; };
      if (m === 'wave') out.push({ p: wp(london), text: 'YOUR GARDEN', sub: t < LB.wave + 0.7 + 80.36 / 20 ? 'STILL IN THE GAP' : 'LIT AT 10:01:20', a: W(t, LB.wave + 0.6, LB.moonwhy - 0.3, 0.3, 0.2) });
      if (m === 'half') out.push({ p: wp(hawaii), text: 'HAWAII', sub: 'NOON', a: W(t, LB.half + 0.5, LB.wait - 0.3, 0.3, 0.2) });
      if (m === 'shadow') out.push({ p: [4.2, -0.2, 0], text: 'THE GAP', sub: 'WHERE THE EARTH’S SHADOW WAS', a: W(t, lbS('shadow') + 0.6, LB.wave - 0.3, 0.3, 0.2) });
      if (m === 'voyager') out.push({ p: [0.4, 2.2, 0], text: 'VOYAGER 1', sub: '25 BILLION km FROM EARTH', a: W(t, LB.voyager + 0.6, LB.ret - 0.3, 0.3, 0.2) });
      return out;
    },
    grade(t, p, shot) {
      p.exposure = 1.08; p.bloom = 0.42; p.bloomThreshold = 0.8; p.vignette = 0.5; p.saturation = 1.05; p.grain = 0.022;
      if (shot.mode === 'birth') { p.bloom = 0.7; p.exposure = 1.0; }
    },
  };
  return set;
};
