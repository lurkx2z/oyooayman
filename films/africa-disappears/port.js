/* =====================================================================
   SET · PORT — a North Sea container terminal from a drone, time-lapse. Stacks of boxes, idle ship-to-shore cranes
   with their booms raised, one ship at the quay that is not being worked, and out on the anchorage a queue of
   waiting ships that grows while cloud shadows race across the yard.
   ===================================================================== */

AF_SET_BUILDERS.port = (app) => {
  const S = afSet(app, { sky: '#a9b4bf', fog: 0.00032, fogColor: '#a6b0ba', fov: 40, sun: [-200, 260, 160], sunColor: '#f4f1ea', sunI: 2.0,
    hemi: ['#c4ccd6', '#4b4a46', 0.9], shadow: 2048, shadowR: 420, shadowFar: 1400, far: 9000, env: ['#c9d1da', '#a6b0ba', '#3a3d40'] });
  const { scene, camera } = S;
  afSky(scene, '#8c9cad', '#b9c2cb', '#8a949c', { r: 6000 });
  // water and quay
  const water = new THREE.Mesh(new THREE.PlaneGeometry(12000, 12000), new THREE.MeshStandardMaterial({ color: '#26343a', roughness: 0.42, metalness: 0.05, envMapIntensity: 0.5 }));
  water.rotation.x = -Math.PI / 2; water.position.y = -1; scene.add(water);
  const conc = afMat('#8f8d87', { roughness: 0.95 }), asph = afMat('#55575a', { roughness: 0.95 });
  afBox(1400, 6, 520, asph, 0, -3, -300).receiveShadow = true;
  afBox(1400, 6.4, 40, conc, 0, -3, -20).receiveShadow = true;
  // container stacks: blocks of rows × bays × tiers
  const COLS = ['#2d4a66', '#7a3029', '#bdbab2', '#3f5a4c', '#9a5a30', '#646a70', '#2a3448', '#857a44', '#5a3a48'];
  const boxG = new THREE.BoxGeometry(12.2, 2.6, 2.44), boxM = afMat('#ffffff', { roughness: 0.7 });
  const NI = 16000, inst = new THREE.InstancedMesh(boxG, boxM, NI), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), c = new THREE.Color();
  let n = 0;
  for (let bx = -5; bx <= 5; bx++) for (let bz = 0; bz < 6; bz++) {
    for (let r = 0; r < 10; r++) for (let b = 0; b < 7; b++) {
      const h = afR(bx * 1000 + bz * 100 + r * 10 + b, 7), tiers = Math.floor(h * 5.2);
      for (let k = 0; k < tiers && n < NI; k++) {
        const x = bx * 100 + b * 12.8, z = -80 - bz * 40 - r * 2.7, y = 1.3 + k * 2.6;
        inst.setMatrixAt(n, m4.compose(v.set(x, y, z), q, one));
        inst.setColorAt(n, c.set(COLS[Math.floor(afR(n, 9) * COLS.length)]).multiplyScalar(0.85 + 0.25 * afR(n, 10))); n++;
      }
    }
  }
  inst.count = n; inst.castShadow = inst.receiveShadow = true; scene.add(inst);
  // ship-to-shore cranes, booms raised (idle)
  const blue = afMat('#3a6ea5', { roughness: 0.6 }), red = afMat('#b8402e', { roughness: 0.6 });
  for (let i = 0; i < 7; i++) {
    const g = new THREE.Group(); g.position.set(-330 + i * 105, 0, -24); scene.add(g);
    const M = i % 2 ? blue : red;
    for (const [x, z] of [[-9, -14], [9, -14], [-9, 14], [9, 14]]) afBox(2, 48, 2, M, x, 24, z, g);
    afBox(20, 3, 32, M, 0, 48, 0, g); afBox(14, 6, 14, M, 0, 52, -10, g);
    const boom = afBox(3, 3, 70, M, 0, 50, 40, g); boom.rotation.x = -1.15; boom.position.set(0, 70, 22);
    const back = afBox(3, 3, 40, M, 0, 50, -30, g);
  }
  // a ship at the quay (not being worked) and the anchorage
  const hullM = afMat('#2c3438', { roughness: 0.6 }), redHull = afMat('#7a2a24', { roughness: 0.7 }), whiteM = afMat('#e2e0da', { roughness: 0.6 });
  const mkShip = (L, stacks) => {
    const g = new THREE.Group();
    afBox(L, 14, L * 0.15, hullM, 0, 7, 0, g); afBox(L * 0.98, 4, L * 0.148, redHull, 0, -1, 0, g);
    afBox(14, 22, L * 0.13, whiteM, -L * 0.36, 25, 0, g);
    for (let i = 0; i < stacks; i++) {
      const sh = afR(i + L, 3); if (sh < 0.15) continue;
      const box = afBox(12.2, 2.6 * (2 + Math.floor(sh * 5)), L * 0.13, afMat(COLS[Math.floor(afR(i, 4) * COLS.length)], { roughness: 0.7 }), -L * 0.28 + i * 13.5, 14 + 1.3 * (2 + Math.floor(sh * 5)), 0, g);
    }
    scene.add(g); return g;
  };
  const quayShip = mkShip(300, 18); quayShip.position.set(-120, 0, 30);
  const anchor = [];
  for (let i = 0; i < 16; i++) { const s = mkShip(180 + 120 * afR(i, 2), 9); s.position.set(-900 + i * 150 + 60 * afR(i, 5), 0, 700 + 900 * afR(i, 6)); s.rotation.y = 0.3 + 0.4 * afR(i, 7); anchor.push(s); }
  // racing cloud shadows (a multiply layer over the yard and the water)
  const shade = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 } }, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uT; varying vec2 vP;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1,0)), f.x), mix(h(i + vec2(0,1)), h(i + vec2(1,1)), f.x), f.y); }
      void main(){ vec2 p = vP * 0.0022 + vec2(uT * 0.6, uT * 0.25); float c = 0.6 * n(p) + 0.3 * n(p * 2.1) + 0.1 * n(p * 4.3);
        float s = smoothstep(0.5, 0.62, c); gl_FragColor = vec4(vec3(1.0 - 0.3 * s), 1.0); }`,
  }));
  shade.rotation.x = -Math.PI / 2; shade.position.y = 0.6; shade.renderOrder = 2; scene.add(shade);
  return {
    scene, camera,
    frame(t) {
      const k = afK(t, AF.port, AF.prices);
      shade.material.uniforms.uT.value = t;
      // the queue at anchor grows through the time-lapse
      anchor.forEach((s, i) => { s.visible = i < 4 + Math.floor(12 * MathX.smooth(t, AF.port + 0.1, AF.prices - 0.3) + 1e-6); });
      afCam(camera, [afLerp(-430, -360, k), afLerp(170, 185, k), afLerp(-360, -350, k)], [afLerp(-60, -20, k), 0, afLerp(220, 260, k)], 42);
    },
    grade(t, p) { p.warmth = -0.04; p.saturation = 0.95; p.contrast = 1.08; },
  };
};
