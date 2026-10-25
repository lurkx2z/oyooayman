/* =====================================================================
   MEMORIAL — the end of the film. (The empty stairway before it is the stair set's 'empty' mode.)
     dark   a black frame for the numbers (2,977 · 2,753 · 343): nothing else on screen
     light  a September night, years later: Lower Manhattan from across the Hudson, its lights on, and two beams of
            light rising from where the towers stood (the Tribute in Light, every September 11 since 2002). The
            remembrance card comes up over it, then black.
   ===================================================================== */

NT_SETS.memorial = (app) => {
  const S = ntSet(app, { sky: '#05070c', fov: 40, near: 1, far: 30000, hemi: ['#2a3550', '#0a0a0c', 0.25] });
  const scene = S.scene;
  scene.fog = new THREE.FogExp2('#0b0f18', 0.00011);
  const sky = ntSky(scene, '#03050b', '#121a2c', '#05070c', { r: 20000, hw: 0.25 });
  ntCity(scene, { r: 2600, skip: ntNearWTC, seed: 2002, night: true, scale: 1.05 });
  // a few taller towers of today's skyline (lit tops), none in the towers' footprints
  // the beams: each a square of searchlights; drawn as a tall soft column of blue light, fading upward
  const beamM = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { k: { value: 1 } },
    vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform float k; varying vec2 vU; void main(){ float h = vU.y; float side = 1.0 - abs(vU.x * 2.0 - 1.0); float a = pow(side, 1.6) * (0.55 * exp(-h * 1.6) + 0.18) * smoothstep(0.0, 0.02, h) * k; gl_FragColor = vec4(vec3(0.62, 0.78, 1.0) * a, a); }',
  });
  const beams = [NT_TW.N, NT_TW.S].map((T) => {
    const g = new THREE.Group(); g.position.set(T.x, 0, T.z); scene.add(g);
    for (let k = 0; k < 3; k++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(48 + k * 26, 7000, 1, 1), beamM); m.position.y = 3500; m.rotation.y = k * Math.PI / 3; g.add(m); }
    const base = new THREE.Mesh(new THREE.BoxGeometry(50, 4, 50), new THREE.MeshBasicMaterial({ color: '#cfe0ff' })); base.position.y = 2; g.add(base);
    return g;
  });
  // the river: dark water with the city's lights in it (a few soft streaks)
  const refl = ntPuffs(scene, 900, { additive: true });
  const cam = S.camera;
  return {
    scene, camera: cam,
    cuts() { return []; },
    frame(t, s) {
      if (s.mode === 'dark') { ntCam(cam, [0, -5000, 0], [0, -5000, -1], 40); beams.forEach((b) => (b.visible = false)); refl.begin(); refl.end(); return; }
      beams.forEach((b) => (b.visible = true));
      const k = MathX.clamp((t - NT.light) / (NT.end - NT.light), 0, 1);
      ntCam(cam, [-2100 + 60 * k, 14, 420 - 30 * k], [40, 330 + 80 * k, 60], 42 - 3 * k);
      beamM.uniforms.k.value = MathX.smooth(t, NT.light + 0.6, NT.light + 3.5);
      refl.begin();
      for (let i = 0; i < 700; i++) {
        const h = hash1(i * 7 + 3), h2 = hash1(i * 13 + 4), x = -480 - h2 * 1100, z = -1400 + h * 2900, f = 0.4 + 0.6 * Math.abs(noise1(t * 0.6 + i, 2));
        refl.add(x, 0.5, z, 6 + h2 * 10, 0.05 * f, 1.0, 0.85, 0.6);
      }
      refl.end();
    },
    grade(t, p, s) {
      p.exposure = 1.0; p.saturation = 0.9; p.contrast = 1.06; p.bloom = 0.55; p.bloomThreshold = 0.6; p.vignette = 0.62; p.grain = 0.03; p.warmth = -0.02;
      if (s.mode === 'dark') { p.bloom = 0; p.vignette = 0.7; p.fade = Math.max(p.fade, 1); }
      if (s.mode === 'light') p.fade = Math.max(p.fade, 1 - MathX.smooth(t, NT.light, NT.light + 2.2), 0.55 * MathX.smooth(t, NT.card - 0.5, NT.card + 1.5));
    },
  };
};
