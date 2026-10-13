/* =====================================================================
   SET · FOREST — two African landscapes in "the same second":
     canopy   over the Congo rainforest at dawn: an unbroken roof of crowns, emergent giants, a brown river winding
              through, mist in the low ground. On "gone" it goes like everything else: a seam from the horizon to us
     savanna  low at a waterhole at sunset: elephants drinking, acacias, a giraffe far off. "Entire ecosystems vanish."
   Both use the kit's dissolve; under the land is the floor of the new basin, 4 km down (afFloor).
   ===================================================================== */

AF_SET_BUILDERS.forest = (app) => {
  // ======================================================= the rainforest
  const C = afSet(app, { sky: '#b9c4b8', fog: 0.00011, fogColor: '#a9b7b0', fov: 42, sun: [700, 260, 60], sunColor: '#ffe2b8', sunI: 2.4,
    hemi: ['#c8d4d8', '#2c3a22', 0.7], far: 70000, env: ['#c8d4d8', '#9aa898', '#1a2416'] });
  afSky(C.scene, '#8aa3b8', '#e6d9c2', '#5c625e', { sunDir: [0.55, 0.18, -0.8], sunGlow: '#ffd29a', r: 20000 });
  afFloor(C.scene, 4000, { z: -400, a: '#26231f', b: '#6e6456' });
  const riverX = (z) => 140 * Math.sin(z * 0.0021) + 60 * Math.sin(z * 0.0057 + 1.3);
  const groundH = (x, z) => 18 * fbm1(x * 0.0012 + 3, 2) + 12 * fbm1(z * 0.0015, 4) - 26 * Math.exp(-Math.pow((x - riverX(z)) / 160, 2));
  {
    const g = new THREE.PlaneGeometry(9000, 9000, 260, 260); g.rotateX(-Math.PI / 2);
    const P = g.attributes.position, col = new Float32Array(P.count * 3), c = new THREE.Color();
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), z = P.getZ(i), y = groundH(x, z); P.setY(i, y);
      const river = Math.exp(-Math.pow((x - riverX(z)) / 38, 2));
      c.set('#24361c').lerp(new THREE.Color('#33461f'), 0.5 + 0.5 * fbm1(x * 0.01 + z * 0.007, 6)).lerp(new THREE.Color('#6b5236'), river);
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    C.scene.add(new THREE.Mesh(g, afMat('#ffffff', { vertexColors: true, roughness: 1 }, C.U)));
    // the river surface
    const rg = new THREE.PlaneGeometry(70, 9000, 1, 300); rg.rotateX(-Math.PI / 2);
    const RP = rg.attributes.position; for (let i = 0; i < RP.count; i++) { const z = RP.getZ(i); RP.setX(i, RP.getX(i) + riverX(z)); RP.setY(i, groundH(riverX(z), z) + 4); }
    rg.computeVertexNormals();
    C.scene.add(new THREE.Mesh(rg, afMat('#5d4a34', { roughness: 0.25, metalness: 0.1 }, C.U)));
    // the horizon beyond: a vast flat green disc
    const far = new THREE.Mesh(new THREE.RingGeometry(4300, 30000, 80, 1), afMat('#2a3a22', { roughness: 1 }, C.U)); far.rotation.x = -Math.PI / 2; far.position.y = -2; C.scene.add(far);
  }
  // crowns: instanced faceted blobs in many greens; emergent trees stand above the roof
  const crownG = new THREE.IcosahedronGeometry(1, 1), crownM = afMat('#ffffff', { roughness: 0.95, flatShading: true }, C.U);
  const NCR = 34000, crowns = new THREE.InstancedMesh(crownG, crownM, NCR), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sv = new THREE.Vector3(), cc = new THREE.Color();
  const GREENS = ['#2f4a22', '#3b5a28', '#466a2c', '#2a4020', '#557532', '#3e5e2e', '#61793a', '#334f2a'];
  let nc = 0;
  for (let i = 0; nc < NCR && i < NCR * 2; i++) {
    const x = (afR(i, 21) - 0.5) * 3000, z = 500 - afR(i, 22) * 4400;
    if (Math.abs(x - riverX(z)) < 60) continue;
    const emergent = afR(i, 23) > 0.96, r = emergent ? 18 + 8 * afR(i, 24) : 11 + 8 * afR(i, 24);
    const y = groundH(x, z) + (emergent ? 52 : 34 + 6 * afR(i, 25));
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), afR(i, 26) * 6.28);
    crowns.setMatrixAt(nc, m4.compose(v.set(x, y, z), q, sv.set(r, r * (0.55 + 0.2 * afR(i, 27)), r)));
    crowns.setColorAt(nc, cc.set(GREENS[Math.floor(afR(i, 28) * GREENS.length)]).multiplyScalar(0.85 + 0.3 * afR(i, 29)));
    nc++;
  }
  crowns.count = nc; crowns.castShadow = false; C.scene.add(crowns);
  const mist = new BillboardSystem(C.scene, 200, false);
  // ======================================================= the savanna waterhole
  const V = afSet(app, { sky: '#e0a76a', fog: 0.0016, fogColor: '#d8a070', fov: 34, sun: [-300, 40, -600], sunColor: '#ffb070', sunI: 2.4,
    hemi: ['#f0c090', '#4a3020', 0.28], far: 70000, env: ['#f0b880', '#c88a58', '#2a1a10'] });
  afSky(V.scene, '#7a7fa8', '#ffb46a', '#3a2c24', { sunDir: [-0.45, 0.05, -0.89], sunGlow: '#ffd08a', hw: 0.18, r: 15000 });
  afFloor(V.scene, 4000, { a: '#2e2620', b: '#8a6a50' });
  const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(160, 48), new THREE.MeshBasicMaterial({ color: '#ffe0a0', fog: false, toneMapped: false }));
  sunDisc.position.set(-0.45 * 9000, 0.05 * 9000 + 120, -0.89 * 9000); sunDisc.lookAt(0, 0, 0); V.scene.add(sunDisc);
  {
    const g = new THREE.PlaneGeometry(4000, 4000, 120, 120); g.rotateX(-Math.PI / 2);
    const P = g.attributes.position, col = new Float32Array(P.count * 3), c = new THREE.Color();
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i); P.setY(i, 1.5 * fbm1(x * 0.01, 5) + 1.2 * fbm1(z * 0.013, 7) - 1.6 * Math.exp(-(x * x + (z + 40) * (z + 40)) / 900)); c.set('#5a4026').lerp(new THREE.Color('#6e5030'), 0.5 + 0.5 * fbm1(x * 0.03 + z * 0.02, 3)); col.set([c.r, c.g, c.b], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    V.scene.add(new THREE.Mesh(g, afMat('#ffffff', { vertexColors: true, roughness: 1 }, V.U)));
    const far = new THREE.Mesh(new THREE.RingGeometry(1900, 20000, 64, 1), afMat('#4e3820', { roughness: 1 }, V.U)); far.rotation.x = -Math.PI / 2; far.position.y = -0.5; V.scene.add(far);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(18, 48), afMat('#8a6040', { roughness: 0.12, metalness: 0.7 }, V.U)); pool.rotation.x = -Math.PI / 2; pool.scale.set(1.5, 0.55, 1); pool.position.set(3, 0.05, -40); V.scene.add(pool);
  }
  const bark = afMat('#2a1d14', { roughness: 0.9 }, V.U), leaf = afMat('#3c3a1e', { roughness: 0.95, flatShading: true }, V.U);
  const acacia = (x, z, s) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); V.scene.add(g);
    afCyl(0.25, 0.4, 5, bark, 0, 2.5, 0, g, 7).rotation.z = 0.08;
    for (const [a, l] of [[0.6, 3], [-0.7, 2.6], [0.1, 2.2]]) { const b = afCyl(0.12, 0.2, l, bark, Math.sin(a) * 1, 5.6, Math.cos(a) * 0.3, g, 6); b.rotation.z = -a; }
    const cr = new THREE.Mesh(new THREE.SphereGeometry(4.5, 14, 6), leaf); cr.scale.set(1, 0.22, 0.8); cr.position.y = 7; g.add(cr);
  };
  for (const [x, z, s] of [[-70, -120, 1.3], [60, -190, 1.6], [180, -330, 1.2], [-260, -420, 1.5], [-20, -600, 1.4], [320, -150, 1.1]]) acacia(x, z, s);
  // elephants (grey, a trunk curving down to the water, ears out), drinking and walking
  const hide = afMat('#5c544c', { roughness: 0.9 }, V.U), ivory = afMat('#d8d0c0', { roughness: 0.5 }, V.U);
  const elephants = [];
  const mkEle = (s) => {
    const g = new THREE.Group(); g.scale.setScalar(s); V.scene.add(g);
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), hide); body.scale.set(2.2, 1.45, 1.35); body.position.y = 2.6; g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 12), hide); head.position.set(2.15, 3.0, 0); g.add(head);
    for (const sd of [-1, 1]) { const ear = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), hide); ear.scale.set(0.12, 1.0, 0.85); ear.position.set(1.75, 3.0, sd * 0.85); ear.rotation.y = sd * 0.5; g.add(ear); }
    const trunk = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(2.8, 2.8, 0), new THREE.Vector3(3.3, 1.8, 0), new THREE.Vector3(3.35, 0.8, 0), new THREE.Vector3(3.1, 0.15, 0)]), 16, 0.22, 8), hide); g.add(trunk);
    for (const sd of [-1, 1]) { const tk = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.9, 8), ivory); tk.position.set(2.75, 2.25, sd * 0.32); tk.rotation.z = -2.1; g.add(tk); }
    const legs = [];
    for (const [lx, lz] of [[1.2, 0.6], [1.2, -0.6], [-1.2, 0.6], [-1.2, -0.6]]) { const piv = new THREE.Group(); piv.position.set(lx, 2.2, lz); g.add(piv); afCyl(0.36, 0.32, 2.3, hide, 0, -1.15, 0, piv, 10); legs.push(piv); }
    const tail = afCyl(0.04, 0.06, 1.2, hide, -2.3, 2.4, 0, g, 5); tail.rotation.z = -0.3;
    return { g, legs };
  };
  for (const [x, z, yaw, s, walk] of [[-4, -50, 0.5, 1.0, 0], [3, -62, 0.1, 1.08, 0], [10, -46, Math.PI - 0.5, 0.95, 0], [-1, -38, -0.4, 0.55, 1], [16, -95, Math.PI + 0.3, 1.0, 1]]) {
    const e = mkEle(s); e.g.position.set(x, 0, z); e.g.rotation.y = yaw; elephants.push({ ...e, x, z, yaw, walk });
  }
  // a giraffe far off
  {
    const g = new THREE.Group(); g.position.set(-150, 0, -260); g.rotation.y = 0.9; V.scene.add(g); const hm = afMat('#6a4a2a', { roughness: 0.9 }, V.U);
    const b = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), hm); b.scale.set(1.4, 0.8, 0.6); b.position.y = 3; g.add(b);
    const nk = afCyl(0.2, 0.3, 3.4, hm, 1.3, 4.8, 0, g, 8); nk.rotation.z = -0.45;
    const hd = afBox(0.9, 0.35, 0.35, hm, 2.2, 6.4, 0, g);
    for (const [lx, lz] of [[0.9, 0.3], [0.9, -0.3], [-0.9, 0.3], [-0.9, -0.3]]) afCyl(0.08, 0.1, 2.6, hm, lx, 1.3, lz, g, 6);
  }
  return {
    get scene() { return FILM._afForestMode === 'savanna' ? V.scene : C.scene; },
    get camera() { return FILM._afForestMode === 'savanna' ? V.camera : C.camera; },
    frame(t, shot) {
      FILM._afForestMode = shot.mode;
      if (shot.mode === 'canopy') {
        const k = afK(t, AF.forest, AF.wild, (x) => x);
        const cz = afLerp(200, -260, k), cx = riverX(cz) + 260;
        afCam(C.camera, [cx, 230, cz], [riverX(cz - 900) - 40, 20, cz - 900], 42, -3);
        // morning mist lying in the low ground along the river
        mist.begin(C.scene.fog);
        for (let i = 0; i < 70; i++) { const z = cz - 500 - afR(i, 31) * 2600, x = riverX(z) + (afR(i, 32) - 0.5) * 260; mist.push(x + 3 * t, groundH(x, z) + 22 + 10 * afR(i, 33), z, 80 + 90 * afR(i, 34), i, 0.1 * (1 - MathX.smooth(t, AF.forestGo + 0.1, AF.forestGo + 0.6)), 1, 0.92, 0.94, 0.92); }
        mist.end();
        const o = C.camera.position;
        C.U.uDisO.value.set(o.x, 0, o.z); C.U.uDisDir.value.set(o.x - riverX(cz - 900), 0, 900).normalize(); C.U.uDisLen.value = 3600; C.U.uDisNoise.value = 0.01;
        // the seam: the far forest in a quarter second, then it crosses the canopy we can see, then us
        const u = t - AF.forestGo;
        C.U.uDisK.value = u < 0 ? -1e3 : u < 0.25 ? afLerp(-7, -1.1, 1 - Math.pow(1 - u / 0.25, 2)) : u < 0.8 ? afLerp(-1.1, -0.03, (u - 0.25) / 0.55) : afLerp(-0.03, 0.3, Math.min(1, (u - 0.8) / 0.12));
        mist.mesh.visible = t < AF.forestGo + 1.0;
        C.scene.fog.density = afLerp(0.00011, 0.000009, MathX.smooth(t, AF.forestGo + 0.05, AF.forestGo + 0.75));
      } else {
        const k = afK(t, AF.wild, AF.flow, (x) => x);
        for (const e of elephants) {
          const step = e.walk ? t * 0.9 : 0, ph = t * 1.6;
          e.g.position.set(e.x + Math.cos(e.yaw) * step, 0, e.z - Math.sin(e.yaw) * step);
          e.legs.forEach((l, i) => { l.rotation.z = e.walk ? 0.22 * Math.sin(ph + (i === 0 || i === 3 ? 0 : Math.PI)) : 0; });
        }
        afCam(V.camera, [afLerp(9, 6, k), 1.7, afLerp(2, -1, k)], [-6, 2.2, -120], 34);
        const o = V.camera.position;
        V.U.uDisO.value.set(o.x, 0, o.z); V.U.uDisDir.value.set(0, 0, 1); V.U.uDisLen.value = 900; V.U.uDisNoise.value = 0.03;
        const t0 = AF.savGo, vv = afK(t, t0, t0 + 0.9, (x) => x);
        V.U.uDisK.value = t < t0 ? -1e3 : -2.4 * Math.pow(1 - vv, 1.6) + 0.2 * vv;
        V.scene.fog.density = afLerp(0.0016, 0.000012, MathX.smooth(t, t0 + 0.2, t0 + 1.0));
      }
    },
    grade(t, p, shot) {
      if (shot.mode === 'canopy') { p.warmth = 0.03; p.saturation = 1.12; p.contrast = 1.14; p.bloom = 0.3; }
      else { p.warmth = 0.1; p.saturation = 1.08; p.bloom = 0.45; p.bloomThreshold = 0.85; p.vignette = 0.65; }
    },
  };
};
