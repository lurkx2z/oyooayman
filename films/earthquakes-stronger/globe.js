/* =====================================================================
   GLOBE — the planet from space (the engine's EarthScene: its painted continents, clouds, night lights, atmosphere
   and stars), with every earthquake on it (quake.js):
     the cracks   a glowing ribbon along each fault, as long as eqRupture() says (yours follows the San Andreas and the
                  Cascadia coast, EQ_FAULT; the others run along their fault's bearing on a great circle); a soft halo
                  over the clouds so they read from space
     the pulses   each earthquake throbs: a ring of shaking that spreads and fades, every few seconds, bigger with the
                  magnitude; a hot dot at the epicentre
     California   (minute one) the dots of a year of magnitude-3 earthquakes appearing along the faults
   The sun is where it is at that moment: about 10 AM in San Francisco (17:00 UTC), early October.
   ===================================================================== */

const eqGeo = (lat, lon, r = 1) => EarthScene.dirFromLonLat(lon, lat).multiplyScalar(r);
const EQ_RE = 6371;                                                     // km in one globe unit

EQ_SETS.globe = (app) => {
  void app;
  const E = new EarthScene(), scene = E.scene;
  const cam = new THREE.PerspectiveCamera(36, 16 / 9, 0.005, 300); scene.add(cam);
  E.earth.rotation.y = 0; E.clouds.rotation.y = 0;
  const sunAt = (s) => { const lon = -73.8 - 0.25 * s / 60; return EarthScene.dirFromLonLat(lon, -5); };

  // ---- the cracks: one ribbon per earthquake, built to its longest length; the shader shows |aD| < uH
  const crackVS = `attribute float aD; attribute float aS; varying float vD; varying float vS; varying vec3 vN; varying vec3 vW;
    void main(){ vD = aD; vS = aS; vN = normalize(mat3(modelMatrix) * position); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
  const crackFS = (halo) => `uniform float uH, uHot, uA; uniform vec3 uSun; varying float vD; varying float vS; varying vec3 vN; varying vec3 vW;
    void main(){ if (abs(vD) > uH) discard;
      float tip = 1.0 - smoothstep(uH - 60.0, uH, abs(vD));
      float across = 1.0 - abs(vS);
      vec3 v = normalize(cameraPosition - vW); float face = smoothstep(-0.05, 0.25, dot(normalize(vN), v));
      ${halo ? `float a = pow(across, 2.0) * 0.55 * uA * face * (0.6 + 0.4 * tip);
      gl_FragColor = vec4(vec3(1.0, 0.36, 0.12) * a, 1.0);` : `float core = smoothstep(0.35, 0.95, across);
      vec3 col = mix(vec3(0.55, 0.05, 0.02), mix(vec3(1.0, 0.42, 0.1), vec3(1.0, 0.92, 0.7), core * uHot), across);
      gl_FragColor = vec4(col * (1.0 + 1.6 * tip * uHot), smoothstep(0.0, 0.25, across) * uA * face);`} }`;
  const ribbon = (pts, r, wKm) => {
    // pts: [{ p: Vector3 (unit), d: km }] along the line → a ribbon of half-width wKm (km) at radius r
    const pos = [], aD = [], aS = [], idx = [];
    pts.forEach((q, i) => {
      const a = pts[Math.max(0, i - 1)].p, b = pts[Math.min(pts.length - 1, i + 1)].p;
      const tan = b.clone().sub(a).normalize(), side = new THREE.Vector3().crossVectors(q.p, tan).normalize().multiplyScalar(wKm / EQ_RE);
      for (const sg of [-1, 1]) { const v = q.p.clone().addScaledVector(side, sg).normalize().multiplyScalar(r); pos.push(v.x, v.y, v.z); aD.push(q.d); aS.push(sg); }
      if (i) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); }
    });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aD', new THREE.Float32BufferAttribute(aD, 1)); g.setAttribute('aS', new THREE.Float32BufferAttribute(aS, 1)); g.setIndex(idx);
    return g;
  };
  // a great circle through (lat, lon) along bearing az (deg), from −L to +L km, every `step` km
  const circle = (lat, lon, az, L, step = 20) => {
    const p = eqGeo(lat, lon), e = eqGeo(lat, lon + 0.01).sub(eqGeo(lat, lon - 0.01)).normalize(), n = eqGeo(lat + 0.01, lon).sub(eqGeo(lat - 0.01, lon)).normalize();
    const t = n.multiplyScalar(Math.cos(az * Math.PI / 180)).addScaledVector(e, Math.sin(az * Math.PI / 180));
    const out = [];
    for (let d = -L; d <= L + 1e-6; d += step) { const a = d / EQ_RE; out.push({ p: p.clone().multiplyScalar(Math.cos(a)).addScaledVector(t, Math.sin(a)).normalize(), d }); }
    return out;
  };
  // yours: both branches of EQ_FAULT, resampled every 15 km (south negative)
  const branch = (P, sign) => {
    const out = []; let acc = 0;
    for (let i = 0; i < P.length - 1; i++) {
      const d = eqKmLL(P[i], P[i + 1]), n = Math.max(1, Math.ceil(d / 15));
      for (let k = (i ? 1 : 0); k <= n; k++) { const u = k / n; out.push({ p: eqGeo(P[i][0] + (P[i + 1][0] - P[i][0]) * u, P[i][1] + (P[i + 1][1] - P[i][1]) * u), d: sign * (acc + d * u) }); }
      acc += d;
    }
    return out;
  };
  const sfPts = [...branch(EQ_FAULT.south, -1).reverse(), ...branch(EQ_FAULT.north, 1).slice(1)];
  const cracks = EQ_QUAKES.map((q) => {
    const Lmax = Math.min(4000, eqRupture(q, 600) + 40);
    const pts = q.id === 'sf' ? sfPts : circle(q.lat, q.lon, q.az, Math.max(40, Lmax), Lmax > 600 ? 20 : 8);
    const U = { uH: { value: 0 }, uHot: { value: 0 }, uA: { value: 1 }, uSun: { value: new THREE.Vector3() } };
    const core = new THREE.Mesh(ribbon(pts, 1.0016, 1), new THREE.ShaderMaterial({ uniforms: U, vertexShader: crackVS, fragmentShader: crackFS(false), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    const halo = new THREE.Mesh(ribbon(pts, 1.0135, 1), new THREE.ShaderMaterial({ uniforms: U, vertexShader: crackVS, fragmentShader: crackFS(true), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    core.renderOrder = 3; halo.renderOrder = 4; core.frustumCulled = halo.frustumCulled = false;
    scene.add(core); scene.add(halo);
    return { q, core, halo, U, pts };
  });
  // the ribbon's width follows the magnitude (km; far wider than the real crack, so it reads from space: tagged)
  const crackWkm = (M) => MathX.clamp(3 * Math.pow(1.55, M - 6), 2.5, 70);
  const setWidth = (c, wKm) => {
    if (c._w === wKm) return; c._w = wKm;
    for (const [mesh, k] of [[c.core, 1], [c.halo, 4.5]]) {
      const g = mesh.geometry, P = g.attributes.position, S = g.attributes.aS;
      c.pts.forEach((q, i) => {
        const a = c.pts[Math.max(0, i - 1)].p, b = c.pts[Math.min(c.pts.length - 1, i + 1)].p, r = mesh === c.core ? 1.0016 : 1.0135;
        const tan = b.clone().sub(a).normalize(), side = new THREE.Vector3().crossVectors(q.p, tan).normalize().multiplyScalar(wKm * k / EQ_RE);
        for (const j of [0, 1]) { const v = q.p.clone().addScaledVector(side, S.getX(i * 2 + j)).normalize().multiplyScalar(r); P.setXYZ(i * 2 + j, v.x, v.y, v.z); }
      });
      P.needsUpdate = true;
    }
  };

  // ---- the pulses (one shell over the clouds; up to 30 earthquakes)
  const NQ = EQ_QUAKES.length;
  const pulseU = { uQ: { value: EQ_QUAKES.map((q) => eqGeo(q.lat, q.lon)) }, uM: { value: EQ_QUAKES.map(() => new THREE.Vector2(0, -1)) }, uK: { value: 1 } };
  const pulse = new THREE.Mesh(new THREE.SphereGeometry(1.0145, 160, 80), new THREE.ShaderMaterial({
    uniforms: pulseU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(position); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform vec3 uQ[${NQ}]; uniform vec2 uM[${NQ}]; uniform float uK; varying vec3 vN; varying vec3 vW;
      void main(){ vec3 n = normalize(vN); vec3 col = vec3(0.0);
        vec3 v = normalize(cameraPosition - vW); float face = smoothstep(0.0, 0.3, dot(n, v));
        for (int i = 0; i < ${NQ}; i++) {
          float M = uM[i].x, age = uM[i].y; if (age < 0.0) continue;
          float d = acos(clamp(dot(n, uQ[i]), -1.0, 1.0)) * ${EQ_RE.toFixed(1)};
          // the hot dot (size by magnitude) and a ring every 3 s that spreads to a few hundred km and fades
          float R0 = 12.0 + 6.0 * M + 2.0 * max(0.0, M - 8.0) * max(0.0, M - 8.0);
          float dot0 = exp(-d * d / (R0 * R0)) * (0.35 + 0.04 * M);
          float ph = fract(age / 3.0), Rr = ph * (120.0 + 60.0 * M * M / 8.0), w = 10.0 + 3.0 * M;
          float ring = exp(-pow((d - Rr) / w, 2.0)) * (1.0 - ph) * (0.15 + 0.03 * M);
          float born = smoothstep(0.0, 1.2, age);
          col += (vec3(1.0, 0.5, 0.2) * dot0 + vec3(1.0, 0.25, 0.12) * ring) * born;
        }
        gl_FragColor = vec4(col * face * uK, 1.0); }`,
  }));
  pulse.renderOrder = 5; scene.add(pulse);

  // ---- California: a year of magnitude-3 earthquakes (seeded, along the faults and the south)
  const cal = (() => {
    const pos = [], aT = [], r = new RNG(1906);
    const along = [...EQ_FAULT.south.slice(0, 22), ...EQ_FAULT.north.slice(1, 9)];
    for (let i = 0; i < 420; i++) {
      let lat, lon;
      if (r.next() < 0.7) { const k = Math.floor(r.next() * (along.length - 1)), u = r.next(); lat = along[k][0] + (along[k + 1][0] - along[k][0]) * u + r.range(-0.35, 0.35); lon = along[k][1] + (along[k + 1][1] - along[k][1]) * u + r.range(-0.45, 0.45); }
      else { lat = r.range(32.6, 40.5); lon = r.range(-123.8, -115.0); if (lon > -119.5 + (lat - 34.5) * -0.9 + 3.5) { lon -= 2.0; } }
      const v = eqGeo(lat, lon, 1.0022); pos.push(v.x, v.y, v.z); aT.push(r.next());
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(aT, 1));
    const m = new THREE.ShaderMaterial({ uniforms: { uK: { value: 0 }, uPx: { value: 9 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'attribute float aT; uniform float uK, uPx; varying float vA; void main(){ float a = smoothstep(aT, aT + 0.04, uK); vA = a; gl_PointSize = uPx * (0.6 + 0.8 * a) * (1.0 + 1.5 * (1.0 - smoothstep(aT, aT + 0.08, uK)) * a); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'varying float vA; void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r = dot(q, q); if (r > 1.0) discard; gl_FragColor = vec4(vec3(1.0, 0.55, 0.2) * vA * (1.0 - r), 1.0); }' });
    const pts = new THREE.Points(g, m); pts.renderOrder = 6; pts.frustumCulled = false; scene.add(pts);
    return { pts, m };
  })();

  const set = { scene, camera: cam, earth: E };
  const X = {};
  // a camera looking at the planet: from (lat, lon) at distance D (globe units), at a target; `off`: shift the globe
  // sideways in the frame (+ = the globe sits left); `up`: north up
  const view = (lat, lon, D, at, fov = 36, off = 0) => {
    const p = eqGeo(lat, lon, D), a = at ? at.clone() : new THREE.Vector3();
    if (off) { const f = a.clone().sub(p).normalize(), rt = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0)).normalize(); a.addScaledVector(rt, off); }
    return { p, at: a, fov };
  };
  const L = (lat, lon, D) => ({ lat, lon, D });
  const lerpV = (A, B, k) => ({ lat: MathX.lerp(A.lat, B.lat, k), lon: MathX.lerp(A.lon, B.lon, k), D: MathX.lerp(A.D, B.D, k) });
  const at = (lat, lon, r = 1) => eqGeo(lat, lon, r);
  const C = {
    open: (u) => { const v = lerpV(L(27, -134, 1.95), L(28, -133, 1.82), u / 2); return Object.assign(view(v.lat, v.lon, v.D, at(38.5, -121.5), 36), { roll: 8 }); },
    california: (u) => { const v = lerpV(L(31, -122.5, 1.95), L(31.6, -122.0, 1.86), u / 4.4); return view(v.lat, v.lon, v.D, at(36.6, -119.6), 30); },
    notjust: (u) => { const k = Ease.inOutSine(MathX.clamp(u / 6, 0, 1)); const v = lerpV(L(33, -128, 1.6), L(24, -150, 3.5), k); return view(v.lat, v.lon, v.D, at(36, -122).multiplyScalar(1 - k), 36); },
    growing: (u) => { const v = lerpV(L(24, -150, 3.5), L(22, -178, 3.5), u / 5); return view(v.lat, v.lon, v.D, null, 36); },
    crackCoast: (u) => { const v = lerpV(L(31, -139, 2.25), L(32, -137, 2.1), u / 3); return view(v.lat, v.lon, v.D, at(40, -121.5), 36); },
    crackLine: (u) => { const v = lerpV(L(33, -129.5, 1.42), L(36.5, -129.5, 1.38), u / 6); return view(v.lat, v.lon, v.D, at(MathX.lerp(37.5, 41, u / 6), -121.5), 36); },
    dozens: (u) => { const v = lerpV(L(16, -172, 3.4), L(18, 150, 3.4), u / 8.5); return view(v.lat, v.lon > 180 ? v.lon - 360 : v.lon, v.D, null, 36); },
    jolt12: (u) => { const v = lerpV(L(30, -132, 2.5), L(30, -131, 2.45), u / 5); return view(v.lat, v.lon, v.D, at(36, -122, 0.4), 36); },
    sun: (u) => { const v = lerpV(L(22, -118, 3.3), L(22, -124, 3.3), u / 7); return view(v.lat, v.lon, v.D, null, 36, 1.05); },
    cracking: (u) => { const v = lerpV(L(26, -127, 1.75), L(28, -126, 1.6), u / 6); return view(v.lat, v.lon, v.D, at(39, -121), 36); },
    dino: (u) => { const v = lerpV(L(18, -112, 3.3), L(18, -119, 3.3), u / 6.5); return view(v.lat, v.lon, v.D, null, 36, 1.05); },
    seven: (u) => { const v = lerpV(L(18, -119, 3.3), L(17, -127, 3.25), u / 6.5); return view(v.lat, v.lon, v.D, null, 36, 1.05); },
  };
  set.frame = (t, shot) => {
    const s = eqStoryOf(t, shot), u = t - shot.t0, mode = shot.mode;
    X.s = s; X.u = u;
    const sun = sunAt(s); E.uniforms.uSun.value.copy(sun); E.uniforms.uLights.value = 1;
    E.clouds.material.uniforms.uOff.value = s * 0.000004;
    // the cracks
    for (const c of cracks) {
      const M = eqQMag(c.q, s), H = eqRupture(c.q, s);
      const on = M !== null && H > 0.5;
      c.core.visible = c.halo.visible = on;
      if (!on) continue;
      setWidth(c, crackWkm(M));
      c.U.uH.value = H; c.U.uHot.value = MathX.smooth(M, 8, 11); c.U.uA.value = MathX.smooth(M, 5, 7.5);
      // (at magnitude twelve the cracks flare on the tick)
      if (M >= 12) c.U.uHot.value = 1 + 0.6 * Math.exp(-Math.max(0, s - 540) / 1.5);
    }
    // the pulses
    EQ_QUAKES.forEach((q, i) => { const M = eqQMag(q, s); pulseU.uM.value[i].set(M === null ? 0 : M, M === null ? -1 : s - q.s0); });
    pulseU.uK.value = mode === 'california' ? 0.25 : 1;
    // California's year of earthquakes
    cal.pts.visible = mode === 'california';
    cal.m.uniforms.uK.value = MathX.smooth(u, 0.3, 4.0); cal.m.uniforms.uPx.value = 7 * (app.renderH || 1080) / 1080;
    // the camera
    const cp = (C[mode] || C.growing)(u, s);
    const dr = eqDrift(t, 0.004, 0.3, shot.id.length);
    let p = cp.p.clone().add(new THREE.Vector3(dr[0], dr[1], dr[2]));
    // magnitude twelve's tick: even from space, a jolt of the picture
    if (mode === 'jolt12' || mode === 'open') { const j = Math.exp(-Math.max(0, u - 0.05) / 0.6) * (mode === 'open' ? 0.4 : 1); p.add(new THREE.Vector3(noise1(t * 30, 3), noise1(t * 30, 7), noise1(t * 30, 11)).multiplyScalar(0.012 * j)); }
    cam.position.copy(p); cam.up.set(0, 1, 0); cam.lookAt(cp.at); if (cp.roll) cam.rotateZ(MathX.deg(cp.roll));
    cam.fov = cp.fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
    X.cp = cp;
  };
  // the labels: the earthquakes the narrator names (and yours), on the side of the planet facing you
  const NAMES = {
    california: [['CALIFORNIA', 'SEVERAL HUNDRED ABOVE MAGNITUDE 3 EVERY YEAR', 36.4, -118.6]],
    crackCoast: [['LOS ANGELES', null, 34.05, -118.25], ['OREGON', null, 43.8, -122.5], ['SAN FRANCISCO', 'YOU', 37.78, -122.4, 1]],
    crackLine: [['LOS ANGELES', null, 34.05, -118.25], ['OREGON', null, 43.8, -122.5], ['SAN FRANCISCO', 'YOU', 37.78, -122.4, 1]],
  };
  set.labels = (t, shot) => {
    const s = eqStoryOf(t, shot), u = t - shot.t0, a = MathX.smooth(u, 0.35, 0.8), mode = shot.mode, out = [];
    const v = new THREE.Vector3(), cdir = cam.position.clone().normalize();
    const face = (p) => p.clone().normalize().dot(cdir) > 0.25;
    if (NAMES[mode]) {
      for (const [text, sub, lat, lon, you] of NAMES[mode]) { const p = eqGeo(lat, lon, 1.02); if (face(p)) out.push({ p, text, sub, a, you: !!you, quake: !you }); }
      return out;
    }
    if (mode === 'notjust' || mode === 'growing' || mode === 'dozens') {
      // every earthquake on this side of the planet, with its magnitude (the newest first appear as they start)
      const L2 = EQ_QUAKES.filter((q) => q.s0 <= s).map((q) => ({ q, M: eqQMag(q, s) })).filter((x) => face(eqGeo(x.q.lat, x.q.lon)));
      L2.sort((A, B) => B.M - A.M);
      for (const { q, M } of L2.slice(0, mode === 'dozens' ? 9 : 7)) {
        const p = eqGeo(q.lat, q.lon, 1.02); v.copy(p);
        out.push({ p, text: q.id === 'sf' ? 'YOU' : q.name, sub: `MAGNITUDE ${M}`, a: a * MathX.smooth(s - q.s0, 0, 1), you: q.id === 'sf', quake: q.id !== 'sf' });
      }
      return out;
    }
    if (mode === 'jolt12' || mode === 'cracking') { const p = eqGeo(37.78, -122.4, 1.02); if (face(p)) out.push({ p, text: 'YOU', sub: 'SAN FRANCISCO', a, you: true }); }
    return out;
  };
  set.grade = (t, p, shot) => {
    const s = eqStoryOf(t, shot);
    p.exposure = 1.02; p.saturation = 1.08; p.contrast = 1.06; p.warmth = 0; p.vignette = 0.42; p.bloom = 0.55; p.bloomThreshold = 0.7; p.grain = 0.014;
    if (s > 540) { p.bloom = 0.7; p.warmth = 0.03; }
  };
  return set;
};
