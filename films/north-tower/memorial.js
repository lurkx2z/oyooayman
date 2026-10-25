/* =====================================================================
   MEMORIAL — the end of the film. (The empty stairway before it is the stair set's 'empty' mode.)
     dark   a black frame for the numbers (2,977 · 2,753 · 343): nothing else on screen
     light  a September night, years later: Lower Manhattan from across the Hudson, its lights on, and two beams of
            light rising over Lower Manhattan (the Tribute in Light, every September 11 since 2002). The remembrance
            card comes up under the skyline, over the river, then black.
   ===================================================================== */

NT_SETS.memorial = (app) => {
  const S = ntSet(app, { sky: '#05070c', fov: 40, near: 1, far: 30000, hemi: ['#2a3550', '#0a0a0c', 0.25] });
  const scene = S.scene;
  scene.fog = new THREE.FogExp2('#0b0f18', 0.00011);
  const sky = ntSky(scene, '#03050b', '#121a2c', '#05070c', { r: 20000, hw: 0.25 });
  ntCity(scene, { r: 2600, skip: ntNearWTC, seed: 2002, night: true, scale: 1.05 });
  // One World Trade Center (open since 2014), north-west of where the North Tower stood: its roof at 1,368 ft, as the
  // North Tower's was, its spire to 1,776 ft
  const owTex = ntWindowTex(1776, '#07080b', '#0b0d10', 0.3, '#cfdcf0'); owTex.repeat.set(12, 34);
  const ow = new THREE.Group(); ow.position.set(-95, 0, -55); scene.add(ow);
  const owBody = new THREE.Mesh(new THREE.CylinderGeometry(25, 43, 417 - 56, 8, 1), new THREE.MeshStandardMaterial({ color: '#0c0e13', map: owTex, emissive: '#ffffff', emissiveMap: owTex, emissiveIntensity: 0.55, roughness: 0.4, metalness: 0.4 }));
  owBody.rotation.y = Math.PI / 8; owBody.position.y = 56 + (417 - 56) / 2; ow.add(owBody);
  ntBox(61, 56, 61, ntStd('#0a0b0e', 0.6, 0.3), 0, 28, 0, ow);
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 2.2, 124, 6), new THREE.MeshBasicMaterial({ color: '#dfe8ff' })); spire.position.y = 417 + 62; ow.add(spire);
  // the beams: each a square of searchlights; drawn as a tall soft column of blue light, fading upward
  const beamM = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { k: { value: 1 } },
    vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform float k; varying vec2 vU; void main(){ float h = vU.y; float side = 1.0 - abs(vU.x * 2.0 - 1.0); float a = smoothstep(0.0, 0.55, side) * (0.42 * exp(-h * 2.2) + 0.12) * smoothstep(0.0, 0.004, h) * k; gl_FragColor = vec4(0.62, 0.77, 1.0, a); }',
  });
  const haloM = beamM.clone(); haloM.uniforms = { k: { value: 1 } }; haloM.fragmentShader = haloM.fragmentShader.replace('smoothstep(0.0, 0.55, side)', '0.38 * pow(side, 2.0)');
  // (the searchlights stand in two squares on the roof of the Battery Parking Garage, south of the site; from New
  // Jersey they rise side by side)
  const beams = [[40, 752], [40, 828]].map(([x, z]) => {
    const g = new THREE.Group(); g.position.set(x, 30, z); scene.add(g);
    // (a soft-edged column: crossed planes so it has the same width from anywhere; wider as it rises into the haze)
    for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), beamM); m.scale.set(110, 7000, 1); m.position.y = 3500; m.rotation.y = k * Math.PI / 4; g.add(m); }
    for (let k = 0; k < 3; k++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), haloM); m.scale.set(280 + k * 220, 7000, 1); m.position.y = 3500; m.rotation.y = k * Math.PI / 3 + 0.4; g.add(m); }   // (the glow round it, in the haze)
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
      ntCam(cam, [-1690 + 40 * k, 14, 420 - 30 * k], [30, 60 + 50 * k, 340], 46 - 3 * k);   // (the skyline across the middle, the river under it: the card goes there)
      beamM.uniforms.k.value = haloM.uniforms.k.value = MathX.smooth(t, NT.light + 0.6, NT.light + 3.5);
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
