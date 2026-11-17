/* =====================================================================
   TORNADO — the funnel (a lathe: narrow at the ground, flaring into the wall cloud), turning; its debris (boards and
   sheet metal on orbits, instanced) and the wall cloud over it. Dark unless a flash lights it (then grey, or a black
   shape against the lit cloud behind it). farm.js moves it along its track (physics.js SFN) and feeds it the flashes.
   ===================================================================== */

function sfTornado(scene) {
  const g = new THREE.Group(); scene.add(g);
  // the funnel's profile [radius, height] (m): a cone-shaped funnel with a ragged debris skirt at the ground
  const prof = [[95, -2], [78, 18], [62, 50], [60, 110], [66, 200], [80, 300], [104, 400], [140, 500], [196, 590], [280, 670], [420, 740], [640, 790], [900, 815]];
  const pts = prof.map(([r, y]) => new THREE.Vector2(r, y)), geo = new THREE.LatheGeometry(pts, 64);
  const U = { uT: { value: 0 }, uFl: { value: 0 }, uFlDir: { value: new THREE.Vector3(1, 0, 0) }, uAmb: { value: 0.02 }, uBack: { value: 0 }, uA: { value: 1 } };
  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
    vertexShader: `varying vec3 vP; varying vec3 vN; varying vec3 vW; void main(){ vP = position; vN = normalize(normalMatrix * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uT, uFl, uAmb, uBack, uA; uniform vec3 uFlDir; varying vec3 vP; varying vec3 vN; varying vec3 vW;
      ${SF_NOISE_GLSL}
      void main(){
        float a = atan(vP.z, vP.x), y = vP.y, r = length(vP.xz);
        // the spin: streaks wound round the funnel, moving faster near the ground
        float sp = uT * (0.9 - 0.0007 * y);
        float st = sfF(vec2(a * 6.0 + sp * 3.0 + y * 0.006, y * 0.012)), st2 = sfF(vec2(a * 18.0 + sp * 6.0, y * 0.05 + 4.0));
        vec3 V = normalize(cameraPosition - vW); float ed = abs(dot(normalize(vN), V));
        // ragged sides and a soft, dusty base; the top dissolves into the wall cloud
        float alpha = (0.55 + 0.4 * st) * smoothstep(0.02, 0.35, ed + 0.25 * st2) * smoothstep(-2.0, 25.0, y + 25.0 * st2) * (1.0 - smoothstep(380.0, 660.0, y + 90.0 * st));   // (the flare dissolves into the cloud: no goblet rim)
        alpha = clamp(alpha * 1.35, 0.0, 0.97) * uA;
        vec3 base = mix(vec3(0.055, 0.05, 0.048), vec3(0.11, 0.1, 0.09), st) ;
        float lit = max(dot(normalize(vN), uFlDir), 0.0) * 0.8 + 0.2;
        vec3 col = base * (uAmb * 10.0) + uFl * vec3(0.5, 0.5, 0.56) * lit * (0.5 + 0.7 * st) * (1.0 - uBack * 0.85);
        col = mix(col, col + vec3(0.06, 0.05, 0.04) * st2 * uFl, 0.5);
        gl_FragColor = vec4(col, alpha);
      }`,
  });
  const funnel = new THREE.Mesh(geo, mat); funnel.renderOrder = 2; funnel.frustumCulled = false; g.add(funnel);
  // the wall cloud: a lowered, turning disc of cloud over the funnel
  const wc = new THREE.Mesh(new THREE.CylinderGeometry(1500, 900, 160, 64, 1, true), new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uT, uFl, uAmb, uBack; varying vec3 vP; ${SF_NOISE_GLSL}
      void main(){ float a = atan(vP.z, vP.x), n = sfF(vec2(a * 5.0 + uT * 0.12, vP.y * 0.01)); float n2 = sfF(vec2(a * 23.0 - uT * 0.2, vP.y * 0.04 + 7.0)); float al = 0.22 * (0.3 + 0.55 * n) * smoothstep(-80.0, 10.0, vP.y + 70.0 * n + 40.0 * n2) * (1.0 - smoothstep(0.0, 80.0, vP.y + 30.0 * n2));
        vec3 c = vec3(0.04, 0.045, 0.05) * (0.6 + n) * (uAmb * 10.0) + uFl * vec3(0.35, 0.36, 0.42) * (0.4 + 0.8 * n) * (1.0 - 0.7 * uBack); gl_FragColor = vec4(c, al); }`,
  }));
  wc.position.y = 860; wc.renderOrder = 1; wc.frustumCulled = false; g.add(wc);
  // the debris: boards, sheet metal, branches; each on its own orbit, rising and falling, tumbling
  const N = 420, deb = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), sfStd('#4a3e32', 0.9), N); deb.frustumCulled = false; deb.castShadow = false; g.add(deb);
  const D = [], r = new RNG(5150);
  for (let i = 0; i < N; i++) D.push({ r: r.range(60, 280) * (r.next() < 0.3 ? 0.6 : 1), y: r.range(2, 380) * r.next(), a: r.range(0, 6.283), w: r.range(0.18, 0.6), bob: r.range(0, 6.28), sz: [r.range(0.3, 3.2), r.range(0.02, 0.1), r.range(0.15, 0.8)], tum: [r.range(-3, 3), r.range(-3, 3), r.range(-3, 3)] });
  const ob = new THREE.Object3D(), col = new THREE.Color();
  for (let i = 0; i < N; i++) { const k = r.next(); col.set(k < 0.4 ? '#6a5a48' : k < 0.7 ? '#8a8e92' : '#2e2a24'); deb.setColorAt(i, col); }
  return {
    g, U, funnel, wc, deb,
    update(s, t, pos, rad, fl) {
      g.position.set(pos[0], sfGroundY(pos[0], pos[1]), pos[1]);
      const k = rad / 80; funnel.scale.set(k, 1, k);
      U.uT.value = t;
      for (let i = 0; i < N; i++) { const d = D[i], a = d.a + t * d.w * (1.3 - d.y / 600), y = d.y + 20 * Math.sin(t * 0.3 + d.bob);
        ob.position.set(Math.cos(a) * d.r * k, y, Math.sin(a) * d.r * k); ob.rotation.set(t * d.tum[0], t * d.tum[1], t * d.tum[2]); ob.scale.set(d.sz[0], d.sz[1] + 0.02, d.sz[2]); ob.updateMatrix(); deb.setMatrixAt(i, ob.matrix); }
      deb.instanceMatrix.needsUpdate = true;
      void s; void fl;
    },
  };
}
