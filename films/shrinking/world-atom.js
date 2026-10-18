/* =====================================================================
   WORLD · ATOM (290 → 348 s, picometres) — one carbon atom of the DNA, from outside to its centre.
     atoms as soft clouds (an atom has no surface) · into the haze · the electrons as a flicker of maybe
     the emptiness · the stadium and the pea · the nucleus: six protons and six neutrons (false colour)
   Origin = the carbon atom's nucleus. There is no ground: you float.
   ===================================================================== */

// your distance from the nucleus (log10 pm) and the direction you come from
const SH_AT_D = [[289.8, 3.32], [292.5, 3.24], [296.5, 3.0], [301.5, 2.72], [306.0, 2.42], [310.0, 2.17], [315.0, 1.9], [320.0, 1.58],
  [325.0, 1.24], [329.0, 1.05], [333.0, 0.92], [335.5, -0.15], [339.0, -0.8], [343.5, -1.4], [346.5, -1.95], [348.5, -2.3]];
const SH_AT_U = [[289.8, 0.36, 0.14, 1], [305, 0.25, 0.12, 1], [322, 0.18, 0.3, 1], [329, 0.14, 0.62, 1], [333.5, 0.12, 0.5, 1], [340, 0.1, 0.2, 1], [348.5, 0.1, 0.1, 1]];

function shAtomCam(t, h, T = [0, 0, 0]) {
  const d = Math.pow(10, shSpline(SH_AT_D, t)[0]), u = shN3(shKey(SH_AT_U, t));
  const p = [T[0] + u[0] * d, T[1] + u[1] * d, T[2] + u[2] * d];
  // a slow float (no ground down here), and a look around at the cloud and at the stadium
  p[0] += noise1(t * 0.31, 2) * 0.25 * h; p[1] += noise1(t * 0.27, 5) * 0.2 * h; p[2] += noise1(t * 0.29, 8) * 0.25 * h;
  let dir = shN3([T[0] - p[0], T[1] - p[1], T[2] - p[2]]);
  const [yw, pt] = shYP(dir);
  const look = 0.55 * Math.sin((t - 296) * 0.5) * shWin(t, 296, 303, 1.5, 1.5) + 0.7 * Math.sin((t - 315) * 0.42) * shWin(t, 315.4, 320.4, 1.2, 1.4)
    + 0.3 * Math.sin((t - 327.6) * 0.75) * shWin(t, 324.4, 333.4, 1.2, 0.9);
  const up = 0.12 * Math.sin((t - 315) * 0.3) * shWin(t, 315.4, 320.4, 1.2, 1.4) + 0.2 * shWin(t, 324.0, 333.6, 1.2, 0.9);
  dir = shDir(yw + look, pt + up);
  return { p, dir, roll: noise1(t * 0.2, 11) * 0.05 };
}

SH_WORLDS.atom = (app) => {
  const W = shMakeWorld(60), R = W.root;
  W.scene.background = new THREE.Color('#020308');

  // ---- the atoms around (a sugar ring with the carbon you fall into, a phosphate, two stacked base rings, more beyond)
  const atoms = [];   // [x, y, z, sigma (pm), r, g, b]
  const add = (p, sg) => atoms.push([p[0], p[1], p[2], sg]);
  const C = 52, O = 48, H = 30, N = 50, P = 62;
  { const rc = 123, cx = -rc;   // the ring: the carbon at the origin is one corner
    for (let k = 0; k < 5; k++) { const a = Math.PI * 2 * k / 5; const p = [cx + Math.cos(a) * rc, Math.sin(a) * rc * 0.25, -Math.sin(a) * rc * 0.97]; add(p, k === 3 ? O : C); }
    add([cx + 1.4 * rc * Math.cos(0.6), 70, -1.4 * rc * Math.sin(0.6)], H); add([-40, -95, 30], H);
    // phosphate and its oxygens
    const pp = [-300, 140, -260]; add(pp, P); for (const d of [[1, 0.2, 0.3], [-0.6, 0.8, 0.1], [-0.3, -0.7, 0.6], [0.1, 0.1, -1]]) { const n = shN3(d); add([pp[0] + n[0] * 150, pp[1] + n[1] * 150, pp[2] + n[2] * 150], O); }
    // two base rings stacked 340 pm apart
    for (const [bx, by, bz] of [[-420, -120, -520], [-420, 220, -520]]) for (let k = 0; k < 6; k++) { const a = Math.PI * 2 * k / 6 + 0.3; add([bx + Math.cos(a) * 140, by, bz + Math.sin(a) * 140], k === 2 ? N : C); }
    // the rest of the strand, further off
    const r = new RNG(71);
    for (let i = 0; i < 70; i++) { const a = r.range(0, 6.283), e = r.range(-0.6, 0.6), d = r.range(600, 2200); add([Math.cos(a) * Math.cos(e) * d - 300, Math.sin(e) * d, -Math.abs(Math.sin(a) * Math.cos(e) * d) - 200], r.pick([C, C, O, H, N])); }
  }
  // keep the way in clear (nothing between you and the carbon)
  const u0 = shN3(SH_AT_U[0].slice(1));
  const clouds = atoms.filter(([x, y, z], i) => { if (i === 0 || (x === 0 && y === 0 && z === 0)) return true; const a = x * u0[0] + y * u0[1] + z * u0[2]; const b = Math.hypot(x - u0[0] * a, y - u0[1] * a, z - u0[2] * a); return !(a > -60 && b < 200); });
  // the carbon you fall into sits exactly at the origin
  if (!clouds.some(([x, y, z]) => x === 0 && y === 0 && z === 0)) clouds.push([0, 0, 0, C]);

  // each cloud: a sphere (3σ) whose shader integrates a soft density along your line of sight (works from inside too)
  const hazeU = { uK: { value: 1 }, uTarget: { value: 1 } };
  const hazeM = new THREE.ShaderMaterial({
    uniforms: hazeU, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
    vertexShader: /* glsl */`varying vec3 vW; varying vec4 vC;
      void main(){ vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0); vW = w.xyz;
        vec4 c = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0); vC = vec4(c.xyz, length((modelMatrix * instanceMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz) / 3.0);
        gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`uniform float uK, uTarget; varying vec3 vW; varying vec4 vC;
      float erfA(float x){ float s = sign(x); x = abs(x); float t = 1.0 / (1.0 + 0.3275911 * x);
        float y = 1.0 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * exp(-x * x); return s * y; }
      void main(){ vec3 o = cameraPosition, d = normalize(vW - o), cc = vC.xyz - o; float sg = vC.w;
        float tc = dot(cc, d), b2 = max(dot(cc, cc) - tc * tc, 0.0);
        float I = exp(-b2 / (sg * sg)) * 0.886 * (1.0 + erfA(tc / sg));
        bool tgt = length(vC.xyz) < sg * 0.05;
        float dist = length(cc), k = uK * (tgt ? uTarget : exp(-max(0.0, dist - 3.0 * sg - 2.0) / 14.0));
        vec3 col = mix(vec3(0.42, 0.58, 1.0), vec3(0.85, 0.92, 1.0), clamp(I * 0.6, 0.0, 1.0));
        gl_FragColor = vec4(col * I * 0.42 * k, 1.0); }`,
  });
  const hz = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 3), hazeM, clouds.length);
  { const dm = new THREE.Object3D(); clouds.forEach(([x, y, z, sg], i) => { dm.position.set(x, y, z); dm.scale.setScalar(sg * 3); dm.updateMatrix(); hz.setMatrixAt(i, dm.matrix); }); hz.instanceMatrix.needsUpdate = true; }
  hz.frustumCulled = false; R.add(hz);

  // ---- the electrons of the carbon as a flicker of maybe: dots drawn from where each one could be, new every frame
  const ND = 12000, dpos = new Float32Array(ND * 3), dsz = new Float32Array(ND);
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dpos, 3)); dg.setAttribute('sz', new THREE.BufferAttribute(dsz, 1));
  const dm = new THREE.ShaderMaterial({
    uniforms: { uOp: { value: 0 }, uPx: { value: 1 } }, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    vertexShader: 'attribute float sz; uniform float uPx; varying float vS; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = sz * uPx; vS = sz; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform float uOp; varying float vS; void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r = dot(q, q); if (r > 1.0) discard; gl_FragColor = vec4(vec3(0.75, 0.86, 1.0) * uOp * (1.0 - r), 1.0); }',
  });
  const dots = new THREE.Points(dg, dm); dots.frustumCulled = false; dots.renderOrder = 4; R.add(dots);
  // where an electron could be: 1s (close in), 2s (a shell), two 2p dumbbells (x and y)
  const sample = (i, f) => {
    const q = (j) => Math.max(1e-6, hash1(i * 23 + j + f * 104729));
    const kind = i % 20 < 2 ? 0 : i % 20 < 7 ? 1 : i % 2 ? 2 : 3;
    let r, ct, ph = q(9) * 6.283;
    if (kind === 0) { r = -4.6 * Math.log(q(1) * q(2) * q(3)); ct = q(4) * 2 - 1; }
    else if (kind === 1) { r = -15 * Math.log(q(1) * q(2) * q(3) * q(4) * q(5)); if (Math.abs(r - 30) < 12 && q(6) < 0.8) r += 25; ct = q(4) * 2 - 1; }
    else { r = -16.8 * Math.log(q(1) * q(2) * q(3) * q(4) * q(5)); ct = (q(6) < 0.5 ? -1 : 1) * Math.pow(q(7), 1 / 3); }
    const st = Math.sqrt(Math.max(0, 1 - ct * ct));
    let v = [st * Math.cos(ph) * r, st * Math.sin(ph) * r, ct * r];
    if (kind === 2) v = [v[2], v[0], v[1]];          // 2p along x
    else if (kind === 3) v = [v[0], v[2], v[1]];     // 2p along y
    return v;
  };

  // ---- the stadium (if this atom were one): tiers of seats round the pitch, the centre spot a pea
  const stad = new THREE.Group(); R.add(stad);
  const lineM = new THREE.LineBasicMaterial({ color: '#ffe2a8', transparent: true, opacity: 0, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
  { const ov = (r, y, ax = 1.0, az = 0.72) => { const pts = []; for (let k = 0; k <= 160; k++) { const a = k / 160 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r * ax, y, Math.sin(a) * r * az)); } return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineM); };
    for (let k = 0; k <= 14; k++) { const f = k / 14; stad.add(ov(96 + f * 70, -2 + f * 58)); }
    for (let k = 0; k < 48; k++) { const a = k / 48 * Math.PI * 2, pts = [new THREE.Vector3(Math.cos(a) * 96, -2, Math.sin(a) * 96 * 0.72), new THREE.Vector3(Math.cos(a) * 166, 56, Math.sin(a) * 166 * 0.72)]; stad.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineM)); }
    const rect = [[-62, -38], [62, -38], [62, 38], [-62, 38], [-62, -38]].map(([x, z]) => new THREE.Vector3(x, -2, z)); stad.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(rect), lineM));
    stad.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -2, -38), new THREE.Vector3(0, -2, 38)]), lineM));
    const cc = ov(9.15, -2, 1, 1); stad.add(cc); }
  stad.position.y = 0;
  // the pea / the nucleus seen from afar: a glowing point that never drops below a few pixels
  const pea = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3)), new THREE.ShaderMaterial({
    uniforms: { uC: { value: new THREE.Color('#9dff6a') }, uOp: { value: 0 }, uPx: { value: 6 } }, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    vertexShader: 'uniform float uPx; void main(){ gl_PointSize = uPx; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 uC; uniform float uOp; void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r = dot(q, q); if (r > 1.0) discard; gl_FragColor = vec4(uC * uOp * (exp(-r * 6.0) * 1.6 + 0.2 * (1.0 - r)), 1.0); }',
  })); pea.frustumCulled = false; pea.renderOrder = 6; R.add(pea);
  const ringM = new THREE.ShaderMaterial({ uniforms: { uOp: { value: 0 }, uPx: { value: 60 } }, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    vertexShader: 'uniform float uPx; void main(){ gl_PointSize = uPx; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uOp; void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r = length(q); float a = smoothstep(0.06, 0.0, abs(r - 0.85)); if (a <= 0.0) discard; gl_FragColor = vec4(vec3(0.9, 1.0, 0.75) * a * 0.7 * uOp, 1.0); }' });
  const ring = new THREE.Points(pea.geometry, ringM); ring.frustumCulled = false; ring.renderOrder = 6; R.add(ring);

  // ---- the nucleus: six protons, six neutrons (false colour), packed and trembling. Sizes in pm (1 fm = 0.001 pm)
  const nuc = new THREE.Group(); R.add(nuc);
  const ballM = (col) => new THREE.ShaderMaterial({
    uniforms: { uC: { value: new THREE.Color(col) } },
    vertexShader: 'varying vec3 vN, vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 uC; varying vec3 vN, vV; void main(){ float nv = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0); vec3 c = uC * (0.35 + 0.75 * pow(nv, 0.7)) + uC * 0.9 * pow(1.0 - nv, 3.0); gl_FragColor = vec4(c, 1.0); }',
  });
  const protM = ballM('#ff6a3d'), neutM = ballM('#6f93ff');
  const nucleons = [];
  { const ng = new THREE.SphereGeometry(0.00084, 40, 28), r = new RNG(12);
    // 12 points packed in a ball (a slightly jittered icosahedral shell)
    const ico = new THREE.IcosahedronGeometry(1, 0).attributes.position, seen = [];
    for (let i = 0; i < ico.count && seen.length < 12; i++) { const v = [ico.getX(i), ico.getY(i), ico.getZ(i)]; if (!seen.some((w) => Math.hypot(w[0] - v[0], w[1] - v[1], w[2] - v[2]) < 1e-3)) seen.push(v); }
    seen.forEach((v, i) => { const m = new THREE.Mesh(ng, i % 2 ? neutM : protM); const p = shN3(v).map((x) => x * 0.00118); m.userData.p = p; m.userData.sd = r.range(0, 100); nuc.add(m); nucleons.push(m); });
  }
  // the proton you head for at the end: the one facing you
  const uEnd = shN3(SH_AT_U[SH_AT_U.length - 1].slice(1));
  const myProton = nucleons.filter((m, i) => i % 2 === 0).reduce((a, b) => (b.userData.p[0] * uEnd[0] + b.userData.p[1] * uEnd[1] + b.userData.p[2] * uEnd[2] > a.userData.p[0] * uEnd[0] + a.userData.p[1] * uEnd[1] + a.userData.p[2] * uEnd[2] ? b : a));
  const nGlow = new THREE.Mesh(new THREE.SphereGeometry(0.0034, 32, 20), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide, uniforms: { uOp: { value: 0 } },
    vertexShader: 'varying vec3 vN, vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform float uOp; varying vec3 vN, vV; void main(){ float nv = abs(dot(normalize(vN), normalize(vV))); gl_FragColor = vec4(vec3(1.0, 0.62, 0.42) * pow(nv, 4.0) * 0.22 * uOp, 1.0); }',
  })); nuc.add(nGlow);

  const _v = new THREE.Vector2();
  const api = {
    scene: W.scene, camera: W.camera, W, hz, dots, stad, nuc, pea,
    frame(t, h, app) {
      const hP = h * 1e12, s = W.setH(hP), tk = shE(t, 340.5, 347.0), mp = myProton.userData.p;
      const cam = shAtomCam(t, hP, [mp[0] * tk, mp[1] * tk, mp[2] * tk]);
      W.lookDir(cam.p, cam.dir, cam.roll);
      W.camera.fov = 60; shClip(W.camera, 0.04, 1e7);   // (the clouds are huge, round you)
      const px = app.renderer.getDrawingBufferSize(_v).y / 1080;
      // the haze: all of it while you approach; the carbon's own cloud thins into dots from inside, then you leave it behind
      hazeU.uK.value = 1.0 * (1 - 0.75 * shE(t, 318, 326));
      hazeU.uTarget.value = 1 - 0.88 * shE(t, 311.0, 315.5);
      // the dots (a new set every frame)
      const dk = shE(t, 310.5, 314.5) * (1 - 0.55 * shE(t, 322, 330)) * (1 - shE(t, 336, 340));
      dots.visible = dk > 0.001; dm.uniforms.uOp.value = 1.25 * dk; dm.uniforms.uPx.value = px;
      if (dots.visible) {
        const f = Math.floor(t * 30);
        for (let i = 0; i < ND; i++) { const v = sample(i, f); dpos[i * 3] = v[0]; dpos[i * 3 + 1] = v[1]; dpos[i * 3 + 2] = v[2]; dsz[i] = 2.4 + 2.4 * hash1(i * 5 + f * 3); }
        dg.attributes.position.needsUpdate = true; dg.attributes.sz.needsUpdate = true;
      }
      // the stadium and the pea
      const sk = shWin(t, 323.0, 334.0, 1.2, 1.0);
      lineM.opacity = 0.32 * sk; stad.visible = sk > 0.001;
      const peaK = shWin(t, 326.5, 336.2, 1.0, 1.2);
      pea.material.uniforms.uOp.value = peaK; pea.material.uniforms.uPx.value = 16 * px;
      const rk = Math.max(sk, shWin(t, 333.6, 341.5, 0.6, 1.2)); ring.visible = rk > 0.001; ringM.uniforms.uOp.value = rk; ringM.uniforms.uPx.value = (70 + 10 * Math.sin(t * 3)) * px;
      pea.material.uniforms.uC.value.set(t < 334 ? '#9dff6a' : '#ffb27a');
      pea.visible = peaK > 0.001;
      // the nucleus: the nucleons tremble (they move at a fifth of the speed of light in there)
      nuc.visible = t > 333.5;
      nucleons.forEach((m, i) => { const p = m.userData.p, sd = m.userData.sd, a = 0.00016; m.position.set(p[0] + noise1(t * 3.1, sd) * a, p[1] + noise1(t * 2.9, sd + 1) * a, p[2] + noise1(t * 3.3, sd + 2) * a); });
      nGlow.material.uniforms.uOp.value = shE(t, 334, 337);
      
      if (window.SH_DBG && SH_DBG.atom) SH_DBG.atom(api, t, h);
    },
    grade(t, p) {
      p.saturation = shLerp(0.85, 1.05, shE(t, 333, 336)); p.contrast = 1.08; p.bloom = 0.6; p.bloomThreshold = 0.75; p.grain = 0.03;
      p.vignette = 0.62; p.soft = 0.05; p.warmth = 0.0; p.exposure = 1.0; p.ao = 0; p.blackLift = 0.006;
    },
  };
  return api;
};
