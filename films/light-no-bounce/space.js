/* =====================================================================
   SPACE SET — the view from the space station, 420 km up (units: km), at 3:30:07 PM in Britain (15:30 UTC): below it
   the night side over the Pacific and East Asia, the day side beyond the horizon to the west.
   While nothing bounces, the day side sends nothing back: the Earth is a round hole in the stars. Its night side still
   shows its cities (lamps are sources) and the faint green airglow (the upper air's own glow, a source too).
   The station's truss and solar panels in the foreground are black (sunlit, they would blaze).
   ===================================================================== */

NB_SETS.space = (app) => {
  const S = nbSet(app, { sky: '#000000', fov: 60, near: 0.002, far: 60000, hemi: ['#000000', '#000000', 0] });
  const scene = S.scene, cam = S.camera, RE = 6371, H = 420;
  // the Earth: lit by the Sun (× bounce), its city lights (procedural continents and coasts: no maps used), the airglow
  // (the Sun just below your horizon: you are over the night side, near the terminator; the day side begins toward the
  // horizon ahead of you)
  const sunDir = new THREE.Vector3(-0.346, -0.17, -0.922).normalize();
  // the night side's lights: points on the ground (a city is a cluster of them, the roads strings between, villages
  // scattered), only within the cap you can see from 420 km (21° round the point below you); each a source
  const NL = [];
  {
    const r = new RNG(9090), nad = new THREE.Vector3(0, 1, 0), e1 = new THREE.Vector3(1, 0, 0), e2 = new THREE.Vector3(0, 0, 1);
    const at = (a, b) => { const v = nad.clone().addScaledVector(e1, a).addScaledVector(e2, b).normalize(); return v; };   // a, b: radians east, south
    const land = (a, b) => noise1(a * 9.0 + b * 4.0, 51) * 0.6 + 0.4 * noise1(a * 3.1 - b * 11.0, 52) + 0.25 * noise1(a * 31 + b * 23, 53);
    const lum = () => { const k = 0.6 + 0.8 * r.next(); return [2.6 * k, (1.55 + 0.35 * r.next()) * k, (0.55 + 0.4 * r.next()) * k]; };
    const push = (v, sz) => { const n = v.normalize(); NL.push([n.x * (RE + 0.3), n.y * (RE + 0.3), n.z * (RE + 0.3), sz, ...lum()]); };
    const R = MathX.deg(21), cs = [];
    for (let i = 0, tries = 0; i < 640 && tries < 40000; tries++) { const a = r.range(-R, R), b = r.range(-R, R); if (a * a + b * b > R * R) continue; const L = land(a, b); if (L < 0.0) continue; if (r.next() > 0.3 + 0.7 * Math.exp(-((L - 0.05) ** 2) / 0.01)) continue; cs.push([a, b, r.next() < 0.1]); i++; }
    for (const [a, b, big] of cs) { const sg = (big ? r.range(10, 26) : r.range(2, 8)) / RE, n = big ? r.int(120, 300) : r.int(10, 50);
      for (let k = 0; k < n; k++) { const q = r.range(0, 6.283), d = Math.abs(r.range(-1, 1) + r.range(-1, 1) + r.range(-1, 1)) / 1.5 * sg; push(at(a + Math.cos(q) * d, b + Math.sin(q) * d), big && d < sg * 0.3 ? 0.9 : 0.5); } }
    for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) { const A = cs[i], B = cs[j], d = Math.hypot(A[0] - B[0], A[1] - B[1]) * RE; if (d > 240 || r.next() < 0.55) continue;
      const n = Math.round(d / 9); for (let k = 1; k < n; k++) { const u = k / n; push(at(A[0] + (B[0] - A[0]) * u + r.range(-1, 1) * 2 / RE, A[1] + (B[1] - A[1]) * u + r.range(-1, 1) * 2 / RE), 0.35); } }
    for (let i = 0; i < 12000; i++) { const a = r.range(-R, R), b = r.range(-R, R); if (a * a + b * b > R * R || land(a, b) < -0.05) continue; push(at(a, b), 0.3); }
  }
  const LP = nbLamps(scene, NL.length + 16, { minPx: 1.5, maxPx: 6 });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(RE, 160, 120), new THREE.ShaderMaterial({
    uniforms: { sd: { value: sunDir }, b: { value: 1 } },
    vertexShader: 'varying vec3 vN; varying vec2 vUv; void main(){ vN = normalize(mat3(modelMatrix) * normal); vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 sd; uniform float b; varying vec3 vN; varying vec2 vUv;
      void main(){ float d = dot(normalize(vN), sd), day = smoothstep(-0.05, 0.25, d), night = 1.0 - smoothstep(-0.12, 0.04, d);
        vec3 ocean = vec3(0.04, 0.12, 0.28), cloud = vec3(0.85) * smoothstep(0.55, 0.8, fract(sin(dot(floor(vUv * vec2(260.0, 130.0)), vec2(12.9, 78.2))) * 43758.5));
        vec3 dayC = mix(ocean, cloud, 0.35) * day * 1.6;
        gl_FragColor = vec4(dayC * b, 1.0); }`,
  }));
  scene.add(earth);
  // the airglow: a thin shell 95 km up, seen edge-on as a faint green line (it glows by itself); the blue limb (× bounce)
  const glow = new THREE.Mesh(new THREE.SphereGeometry(RE + 95, 160, 80), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
    uniforms: { b: { value: 1 }, cp: { value: new THREE.Vector3() }, sd: { value: sunDir } },
    vertexShader: 'varying vec3 vP; void main(){ vP = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vP, 1.0); }',
    fragmentShader: `uniform float b; uniform vec3 cp, sd; varying vec3 vP;
      void main(){ vec3 v = normalize(vP - cp); float g = abs(dot(v, normalize(vP))); float edge = pow(1.0 - g, 34.0);
        float sunny = smoothstep(-0.2, 0.3, dot(normalize(vP), sd));
        vec3 c = vec3(0.12, 0.42, 0.18) * edge * 0.75 + vec3(0.35, 0.6, 1.2) * edge * 2.2 * sunny * b;
        gl_FragColor = vec4(c, 1.0); }`,
  }));
  scene.add(glow);
  // the stars (a Points field: the sky's own lights) and the Sun
  { const n = 4000, P = new Float32Array(n * 3), C = new Float32Array(n * 3), r = new RNG(77); for (let i = 0; i < n; i++) { const u = r.range(-1, 1), a = r.range(0, 6.283), q = Math.sqrt(1 - u * u), m = Math.pow(r.next(), 3); P.set([q * Math.cos(a) * 50000, u * 50000, q * Math.sin(a) * 50000], i * 3); const k = 0.25 + 2.2 * m; C.set([k, k * 0.97, k * (r.next() < 0.3 ? 0.8 : 1.05)], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('color', new THREE.BufferAttribute(C, 3));
    const st = new THREE.Points(g, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, depthWrite: false })); st.frustumCulled = false; scene.add(st); }
  // the station: a truss and two solar wings (black now), and a lit window of the cupola's frame (no: the cupola is behind you)
  const iss = new THREE.Group(); scene.add(iss);
  const truss = nbStd('#c8c8c0', 0.5, 0.4), panel = nbStd('#3a3018', 0.3, 0.5);
  { const k = 0.001; nbBox(60 * k, 1.2 * k, 1.2 * k, truss, 0, 0, 0, iss); for (const sx of [-1, 1]) { nbBox(12 * k, 0.04 * k, 34 * k, panel, sx * 24 * k, 0, 0, iss); nbBox(12 * k, 0.04 * k, 34 * k, panel, sx * 37 * k, 0, 0, iss); } }
  const set = {
    scene, camera: cam, earth, glow,
    frame(t, shot) {
      const s = nbStoryAt(t), b = NBP.bounce(s), k = MathX.clamp((t - shot.t0) / (shot.t1 - shot.t0), 0, 1); this._s = s;
      earth.material.uniforms.b.value = b; glow.material.uniforms.b.value = b;
      // the camera: 420 km over the night side, looking towards the horizon and the dark day side beyond it
      const p = new THREE.Vector3(0, RE + H, 0), look = new THREE.Vector3(-0.55 + 0.04 * k, -0.33, -0.76).normalize();
      cam.near = 0.002; cam.far = 60000; nbCam(cam, [p.x, p.y, p.z], [p.x + look.x * 1000, p.y + look.y * 1000, p.z + look.z * 1000], 58);
      glow.material.uniforms.cp.value.copy(cam.position);
      // the lights on the night side (fading out across the terminator)
      LP.begin(cam, (app.renderH || 1080) / 1080);
      for (const q of NL) { const d = (q[0] * sunDir.x + q[1] * sunDir.y + q[2] * sunDir.z) / (RE + 0.3), night = 1 - MathX.smooth(d, -0.12, 0.04); if (night > 0.01) LP.add(q[0], q[1], q[2], q[3], q[4] * night, q[5] * night, q[6] * night); }
      LP.end();
      // the station's truss across the top of the frame (2.6 m from you)
      iss.position.copy(cam.position).addScaledVector(look, 0.03).add(new THREE.Vector3(0, 0.012, 0)); iss.lookAt(cam.position.clone().addScaledVector(look, 1)); iss.rotateY(0.3);
    },
    labels(t) { const sh = nbShotAt(t), W = StoryHUD.win, out = []; if (sh.mode !== 'space') return out; const c = cam.position, d = new THREE.Vector3(-0.47, -0.375, -0.8).normalize();
      out.push({ p: [c.x + d.x * 1500, c.y + d.y * 1500, c.z + d.z * 1500], text: 'THE DAY SIDE', sub: 'in full sunlight: sends nothing back', a: W(t, sh.t0 + 1.2, sh.t1 - 0.3, 0.35, 0.3), side: 'r' }); return out; },
    grade(t, p) { p.exposure = 1.0; p.blackLift = 0; p.bloom = 0.5; p.bloomThreshold = 0.7; p.vignette = 0.5; p.grain = 0.03; p.saturation = 1.0; },
  };
  return set;
};
