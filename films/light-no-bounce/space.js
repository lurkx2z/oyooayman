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
  const sunDir = new THREE.Vector3(-0.85, 0.32, -0.42).normalize();
  const lights = nbCanvas(2048, 1024, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    const r = new RNG(9090), land = (x, y) => noise1(x * 0.006 + y * 0.004, 51) * 0.7 + 0.35 * noise1(x * 0.019 - y * 0.013, 52) + 0.15 * noise1(x * 0.06 + y * 0.05, 53);
    for (let i = 0; i < 26000; i++) {
      const x = r.range(0, w), y = r.range(h * 0.15, h * 0.85), L = land(x, y); if (L < 0.08) continue;
      const coast = Math.exp(-((L - 0.12) ** 2) / 0.004), big = r.next() < 0.004;
      if (r.next() > 0.08 + 0.85 * coast) continue;
      const a = big ? 0.9 : 0.25 + 0.5 * r.next(), rad = big ? r.range(3, 7) : r.range(0.5, 1.6);
      g.fillStyle = `rgba(255,${190 + r.int(0, 40)},${110 + r.int(0, 50)},${a.toFixed(2)})`; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
      if (big) for (let k = 0; k < 40; k++) { g.fillStyle = 'rgba(255,210,140,0.35)'; g.fillRect(x + r.range(-14, 14), y + r.range(-10, 10), 1.4, 1.4); }
    }
    for (let i = 0; i < 300; i++) { const y = r.range(h * 0.2, h * 0.8); let x = r.range(0, w); g.strokeStyle = 'rgba(255,200,130,0.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 20; k++) { x += r.range(-6, 9); g.lineTo(x, y + r.range(-4, 4) + k); } g.stroke(); }   // the roads between them
  });
  const lightTex = nbTex(lights, { repeat: false });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(RE, 160, 120), new THREE.ShaderMaterial({
    uniforms: { sd: { value: sunDir }, b: { value: 1 }, lt: { value: lightTex } },
    vertexShader: 'varying vec3 vN; varying vec2 vUv; void main(){ vN = normalize(mat3(modelMatrix) * normal); vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 sd; uniform float b; uniform sampler2D lt; varying vec3 vN; varying vec2 vUv;
      void main(){ float d = dot(normalize(vN), sd), day = smoothstep(-0.05, 0.25, d), night = 1.0 - smoothstep(-0.12, 0.04, d);
        vec3 ocean = vec3(0.04, 0.12, 0.28), cloud = vec3(0.85) * smoothstep(0.55, 0.8, fract(sin(dot(floor(vUv * vec2(260.0, 130.0)), vec2(12.9, 78.2))) * 43758.5));
        vec3 dayC = mix(ocean, cloud, 0.35) * day * 1.6;
        vec3 city = texture2D(lt, vUv).rgb * night * 2.4;
        gl_FragColor = vec4(dayC * b + city, 1.0); }`,
  }));
  scene.add(earth);
  // the airglow: a thin shell 95 km up, seen edge-on as a faint green line (it glows by itself); the blue limb (× bounce)
  const glow = new THREE.Mesh(new THREE.SphereGeometry(RE + 95, 160, 80), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
    uniforms: { b: { value: 1 }, cp: { value: new THREE.Vector3() }, sd: { value: sunDir } },
    vertexShader: 'varying vec3 vP; void main(){ vP = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vP, 1.0); }',
    fragmentShader: `uniform float b; uniform vec3 cp, sd; varying vec3 vP;
      void main(){ vec3 v = normalize(vP - cp); float g = abs(dot(v, normalize(vP))); float edge = pow(1.0 - g, 14.0);
        float sunny = smoothstep(-0.2, 0.3, dot(normalize(vP), sd));
        vec3 c = vec3(0.12, 0.42, 0.18) * edge * 0.55 + vec3(0.35, 0.6, 1.2) * edge * 2.2 * sunny * b;
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
      // the station's truss across the top of the frame (2.6 m from you)
      iss.position.copy(cam.position).addScaledVector(look, 0.03).add(new THREE.Vector3(0, 0.012, 0)); iss.lookAt(cam.position.clone().addScaledVector(look, 1)); iss.rotateY(0.3);
    },
    labels(t) { const sh = nbShotAt(t), W = StoryHUD.win, out = []; if (sh.mode !== 'space') return out; const c = cam.position, d = new THREE.Vector3(-0.62, -0.16, -0.77).normalize();
      out.push({ p: [c.x + d.x * 1500, c.y + d.y * 1500, c.z + d.z * 1500], text: 'THE DAY SIDE', sub: 'sunlit: sends nothing back', a: W(t, sh.t0 + 1.2, sh.t1 - 0.3, 0.35, 0.3), side: 'r' }); return out; },
    grade(t, p) { p.exposure = 1.0; p.blackLift = 0; p.bloom = 0.5; p.bloomThreshold = 0.7; p.vignette = 0.5; p.grain = 0.03; p.saturation = 1.0; },
  };
  return set;
};
