/* =====================================================================
   SET · FACTORY — a car plant's body line and a battery-cell line, in one hall. Four moods (shot.mode):
     cars   bodies in white glide down the line, orange robots weld them in showers of sparks (platinum · cobalt ·
            chromium: the readouts name what each of these needs)
     cells  close on the cell line: thousands of cylindrical battery cells streaming past
     stop   weeks later: the line is short of parts. On "gone" the robots freeze, the sparks stop, and the ceiling
            lights go out row by row, from the far end toward us
     dark   later still: the hall in emergency light, dust in a shaft of daylight, the line board: STOPPED · NO PARTS
   ===================================================================== */

AF_SET_BUILDERS.factory = (app) => {
  const S = afSet(app, { sky: '#0c0d0f', fov: 42, sun: [12, 40, 8], sunColor: '#f2f4f8', sunI: 1.4, hemi: ['#e4e9ef', '#8a8782', 1.25],
    shadow: 2048, shadowR: 46, shadowFar: 120, env: ['#f0f2f5', '#7c8288', '#2a2a2c'] });
  const { scene, camera, sun, hemi } = S;
  const VF = new VehicleFactory();
  // ---- the hall: 160 × 44 m, 12 m high
  const floorTex = (() => {
    const c = Tex.canvas(512, 512), x = c.getContext('2d'), rng = new RNG(31);
    x.fillStyle = '#4f5254'; x.fillRect(0, 0, 512, 512); Tex.noise(x, 512, 512, 10, rng);
    x.strokeStyle = 'rgba(30,30,30,0.35)'; x.lineWidth = 2; x.strokeRect(0, 0, 512, 512);
    const t = Tex.tex(c); t.repeat.set(32, 9); return t;
  })();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(160, 44), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.32, metalness: 0.0 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const yellow = afMat('#d8b324', { roughness: 0.6 }), lineMat = new THREE.MeshStandardMaterial({ color: '#d4b52a', roughness: 0.7 });
  for (const z of [-4.6, 4.6]) { const l = new THREE.Mesh(new THREE.PlaneGeometry(160, 0.12), lineMat); l.rotation.x = -Math.PI / 2; l.position.set(0, 0.005, z); scene.add(l); }
  const wall = afMat('#5a5e63', { roughness: 0.9 }), steel = afMat('#8a8d90', { roughness: 0.45, metalness: 0.6 }), dark = afMat('#1d1e20', { roughness: 0.8 });
  afBox(160, 12, 0.4, wall, 0, 6, -22); afBox(160, 12, 0.4, wall, 0, 6, 22); afBox(0.4, 12, 44, wall, -80, 6, 0); afBox(0.4, 12, 44, wall, 80, 6, 0);
  const roof = afBox(160, 0.4, 44, afMat('#55595e', { roughness: 0.85 }), 0, 12.2, 0); roof.castShadow = false;
  // ducts and an overhead conveyor give the ceiling some structure
  for (const z of [-15, -4, 15]) afCyl(0.6, 0.6, 160, steel, 0, 10.9, z, scene, 14).rotation.z = Math.PI / 2;
  afBox(160, 0.25, 1.6, afMat('#6a6e72', { roughness: 0.6, metalness: 0.4 }), 0, 8.8, 9.5);
  for (let x = -72; x <= 72; x += 12) { afBox(0.5, 12, 0.5, yellow, x, 6, -10); afBox(0.5, 12, 0.5, yellow, x, 6, 10); afBox(0.35, 0.9, 44, steel, x, 11.2, 0).castShadow = false; }
  // ceiling light rows (emissive panels; each row can go dark)
  const lightRows = [];
  for (let i = 0; i < 26; i++) {
    const x = -75 + i * 6, m = new THREE.MeshStandardMaterial({ color: '#202020', emissive: new THREE.Color('#fbfcff'), emissiveIntensity: 3.0 });
    const g = new THREE.Group();
    for (const z of [-7, 0, 7]) { const p = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 3.2), m); p.position.set(x, 10.4, z); g.add(p); }
    scene.add(g); lightRows.push({ x, m });
  }
  // ---- the body line: a raised skid conveyor along x; car bodies (primer grey, no glass, no wheels) on skids
  afBox(160, 0.5, 2.4, dark, 0, 0.25, 0);
  for (let x = -78; x <= 78; x += 1.2) afBox(0.12, 0.08, 2.5, steel, x, 0.54, 0).castShadow = false;
  const bodies = [];
  const bodyCol = ['#9ca1a5', '#a3a7aa', '#979b9f'];
  for (let i = 0; i < 22; i++) {
    const c = VF.build(i % 3 === 0 ? 'suv' : 'sedan', bodyCol[i % 3]);
    for (const w of c.wheels) w.visible = false;
    c.body.children.forEach((m) => { if (m.material === VF.m.glass || m.material === VF.m.head || m.material === VF.m.plate) m.visible = false; });
    c.group.scale.setScalar(1.0);
    const skid = afBox(4.6, 0.12, 1.4, steel, 0, -0.06, 0, c.group);
    scene.add(c.group); bodies.push(c);
  }
  // ---- welding robots: base, turret, upper arm, forearm, wrist with a spot-weld gun; two per station
  const orange = afMat('#e4761c', { roughness: 0.45, metalness: 0.15 }), blackM = afMat('#1b1b1c', { roughness: 0.6 });
  const robots = [];
  const mkRobot = (x, side) => {
    const root = new THREE.Group(); root.position.set(x, 0, side * 3.3); scene.add(root);
    afBox(1.1, 0.8, 1.1, dark, 0, 0.4, 0, root);
    const turret = new THREE.Group(); turret.position.y = 0.8; root.add(turret);
    afCyl(0.48, 0.55, 0.45, orange, 0, 0.22, 0, turret, 20);
    const sh = new THREE.Group(); sh.position.set(0, 0.62, 0); turret.add(sh);
    afCyl(0.26, 0.26, 0.7, blackM, 0, 0, 0, sh, 16).rotation.x = Math.PI / 2;
    afBox(0.34, 1.45, 0.38, orange, 0, 0.7, 0, sh);
    const el = new THREE.Group(); el.position.set(0, 1.42, 0); sh.add(el);
    afCyl(0.2, 0.2, 0.55, blackM, 0, 0, 0, el, 14).rotation.x = Math.PI / 2;
    afBox(1.35, 0.28, 0.3, orange, 0.6, 0, 0, el);
    const wr = new THREE.Group(); wr.position.set(1.3, 0, 0); el.add(wr);
    afBox(0.22, 0.22, 0.22, blackM, 0, 0, 0, wr);
    afBox(0.1, 0.55, 0.1, steel, 0.08, -0.3, 0, wr); afBox(0.36, 0.08, 0.1, steel, 0.22, -0.56, 0, wr);
    const tip = new THREE.Object3D(); tip.position.set(0.38, -0.5, 0); wr.add(tip);
    const r = { root, turret, sh, el, wr, tip, side, x, ph: afR(robots.length, 41) * 6 };
    robots.push(r); return r;
  };
  for (let x = -60; x <= 60; x += 7.5) { mkRobot(x, 1); mkRobot(x + 1.8, -1); }
  const sparks = new StreakSystem(scene, 3200), glows = new BillboardSystem(scene, 120, true);
  // ---- the cell line (far end of the hall, x ≈ 120 off-stage: its own corner, its own framing)
  const cells = new THREE.Group(); cells.position.set(0, 0, 60); scene.add(cells);
  const belt = afBox(30, 0.9, 1.6, afMat('#2a2c2e', { roughness: 0.5 }), 0, 0.45, 0, cells);
  const cellG = new THREE.CylinderGeometry(0.0105, 0.0105, 0.07, 18);
  const wrapM = new THREE.MeshStandardMaterial({ color: '#1f6f8b', roughness: 0.35, metalness: 0.3 }), NC = 7000;
  const cellI = new THREE.InstancedMesh(cellG, wrapM, NC); cellI.castShadow = false; cells.add(cellI);
  const capG = new THREE.CylinderGeometry(0.0095, 0.0095, 0.004, 18), capM = new THREE.MeshStandardMaterial({ color: '#c9ccd0', roughness: 0.25, metalness: 0.9 });
  const capI = new THREE.InstancedMesh(capG, capM, NC); cells.add(capI);
  afBox(30, 0.12, 0.06, steel, 0, 0.98, 0.78, cells); afBox(30, 0.12, 0.06, steel, 0, 0.98, -0.78, cells);
  const cellLight = new THREE.PointLight('#dfeaff', 6, 6, 1.5); cellLight.position.set(0, 2.2, 0.6); cells.add(cellLight);
  // ---- the line board (andon) and an exit sign, for the dark hall
  const board = afCanvasTex(1024, 256, (x, w, h, st) => {
    x.fillStyle = '#060606'; x.fillRect(0, 0, w, h);
    x.font = `700 64px ${Tex.fontCond}`; x.textAlign = 'center';
    x.fillStyle = st.on ? '#ff3b2a' : '#3a1210'; x.fillText('LINE 3 · STOPPED', w / 2, 100);
    x.fillStyle = st.on ? '#ffb43a' : '#3a2a10'; x.font = `600 52px ${Tex.fontCond}`; x.fillText('NO PARTS · DAY ' + st.day, w / 2, 190);
  });
  const boardM = new THREE.MeshBasicMaterial({ map: board.tex, toneMapped: false });
  // hung over the line, facing back up it
  const boardMesh = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), boardM); boardMesh.position.set(-12.12, 6.2, 0); boardMesh.rotation.y = -Math.PI / 2; scene.add(boardMesh);
  afBox(0.2, 1.7, 6.3, dark, -12, 6.2, 0); afBox(0.08, 3.4, 0.08, steel, -12, 9.6, 2.5); afBox(0.08, 3.4, 0.08, steel, -12, 9.6, -2.5);
  const redL = new THREE.PointLight('#ff3020', 0, 34, 1.4); redL.position.set(-13.2, 5.2, 0); scene.add(redL);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 3.2, 16, 32, 1, true), new THREE.ShaderMaterial({
    uniforms: { uA: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: 'varying vec3 vN, vV; varying float vY; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); vY = uv.y; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform float uA; varying vec3 vN, vV; varying float vY; void main(){ float f = pow(abs(dot(normalize(vN), vV)), 3.0); gl_FragColor = vec4(vec3(0.8, 0.86, 0.95) * f * uA * smoothstep(0.0, 0.45, vY) * smoothstep(1.0, 0.7, vY), 1.0); }',
  }));
  beam.position.set(14, 6, -8); beam.rotation.z = 0.5; scene.add(beam);
  const motes = new BillboardSystem(scene, 400, true);

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v3 = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), tip = new THREE.Vector3();
  // the line's travel: how far the bodies have moved by time t (it slows and stops in 'stop'; frozen afterwards)
  const STOP = AF.goneW + 0.1;
  const travel = (t) => 0.5 * Math.min(t, STOP) - 0.25 * Math.max(0, Math.min(t, STOP) - (STOP - 1)) ** 2;
  const working = (t) => (t < STOP ? 1 : 0);
  return {
    scene, camera,
    frame(t, shot) {
      const mode = shot.mode;
      // ---- line + robots
      const tr = mode === 'dark' ? travel(STOP) : travel(t);
      // weeks later the line is starved: gaps where bodies should be
      bodies.forEach((c, i) => { const x = -78 + ((i * 7.5 + tr) % 165); c.group.position.set(x, 0.6, 0); c.group.visible = mode === 'cars' || i % 3 === 0; });
      const tw = mode === 'dark' ? STOP : Math.min(t, STOP);
      sparks.begin(); glows.begin();
      for (const r of robots) {
        // a cycle: reach in (0.6 s), weld (0.9 s), back out (0.6 s), wait
        const u = ((tw * 0.42 + r.ph) % 1), reach = u < 0.25 ? Ease.inOutSine(u / 0.25) : u < 0.6 ? 1 : u < 0.8 ? 1 - Ease.inOutSine((u - 0.6) / 0.2) : 0;
        r.turret.rotation.y = r.side * (-Math.PI / 2) + 0.35 * Math.sin(tw * 0.7 + r.ph);
        r.sh.rotation.z = afLerp(0.25, -0.55, reach); r.el.rotation.z = afLerp(-0.9, -0.15, reach) + 0.05 * Math.sin(tw * 3 + r.ph);
        r.wr.rotation.z = afLerp(-0.4, -0.9, reach);
        r.root.updateMatrixWorld(true);
        // sparks while welding (u in the weld window), only when the line works
        if (mode === 'cars' || (mode === 'stop' && t < STOP)) {
          r.tip.getWorldPosition(tip);
          const uw = ((tw * 0.42 + r.ph) % 1);
          if (uw > 0.3 && uw < 0.58) { const fl = 0.7 + 0.3 * Math.sin(tw * 90 + r.x); glows.push(tip.x, tip.y, tip.z, 0.55 * fl, 0, 0.9, 1, 1.0, 0.8, 0.5); glows.push(tip.x, tip.y, tip.z, 0.16, 0, 1, 1, 1, 1, 1); }
          for (let i = 0; i < 26; i++) {
            const b = Math.floor(tw * 44) - i, age = tw - b / 44; if (age < 0 || age > 0.6) continue;
            const ub = ((b / 44) * 0.42 + r.ph) % 1; if (ub < 0.3 || ub > 0.58) continue;
            const h = hash2(b, r.x * 10 + r.side), h2 = hash2(b + 7, r.x * 10), h3 = hash2(b + 13, r.x);
            const vx = (h - 0.5) * 4, vy = 1 + h2 * 2.5, vz = (h3 - 0.5) * 4;
            const pa = (a) => [tip.x + vx * a, tip.y + vy * a - 4.9 * a * a, tip.z + vz * a];
            const A = pa(age), B = pa(Math.max(0, age - 0.05)); if (A[1] < 0.02) continue;
            const f = 1 - age / 0.6;
            sparks.push(B[0], B[1], B[2], A[0], A[1], A[2], 1.0, 0.62 + 0.3 * f, 0.25 * f, f, 0.03);
          }
        }
      }
      sparks.end(); glows.end();
      // ---- lights: on; in 'stop' the rows go out from the far end toward the camera after the line halts; 'dark' all out
      const out0 = AF.goneW + 0.05;
      let lit = 0;
      for (const L of lightRows) {
        let on = 1;
        if (mode === 'stop') on = t < out0 + (75 - L.x) * 0.004 ? 1 : 0;
        if (mode === 'dark') on = 0;
        L.m.emissiveIntensity = 3.0 * on; lit += on;
      }
      const litK = lit / lightRows.length;
      hemi.intensity = mode === 'dark' ? 0.035 : afLerp(0.06, 1.0, litK);
      sun.intensity = mode === 'dark' ? 0.0 : afLerp(0.0, 1.4, litK);
      sun.castShadow = mode !== 'dark';
      scene.environmentIntensity = mode === 'dark' ? 0.03 : afLerp(0.04, 1, litK);
      // ---- the cells: rows of 18 across, streaming along x
      cells.visible = mode === 'cells';
      if (mode === 'cells') {
        let n = 0;
        const off = (t * 0.55) % 0.024;
        for (let i = 0; i < 380 && n < NC; i++) for (let j = 0; j < 18 && n < NC; j++) {
          const x = -4.5 + i * 0.024 + off + (j % 2) * 0.012, z = -0.2 + j * 0.0215;
          m4.compose(v3.set(x, 0.935, z), q, one); cellI.setMatrixAt(n, m4);
          m4.compose(v3.set(x, 0.972, z), q, one); capI.setMatrixAt(n, m4); n++;
        }
        cellI.count = capI.count = n; cellI.instanceMatrix.needsUpdate = capI.instanceMatrix.needsUpdate = true;
      }
      // ---- the dark hall: the board, a shaft of daylight with dust
      const isDark = mode === 'dark';
      boardMesh.visible = isDark; board.update({ on: isDark ? 1 : 0, day: 23 });
      beam.material.uniforms.uA.value = isDark ? 0.06 : 0; redL.intensity = isDark ? 9 * (0.85 + 0.15 * Math.sin(t * 2.2)) : 0; beam.visible = isDark;
      motes.begin(); if (isDark) for (let i = 0; i < 260; i++) {
        const u = afR(i, 5), w = afR(i, 6), y0 = afR(i, 7) * 12;
        const y = (y0 - t * 0.08 * (0.5 + w)) % 12, yy = y < 0 ? y + 12 : y;
        const along = (yy - 6) / 16, x = 14 + Math.sin(0.5) * -along * 16 + (u - 0.5) * 3.5, z = -8 + (w - 0.5) * 3.5;
        motes.push(x + 0.3 * Math.sin(t * 0.3 + i), yy, z, 0.04, 0, 0.6, 1, 0.9, 0.92, 1.0);
      }
      motes.end();
      // ---- cameras
      if (mode === 'cars') {
        const k = afK(t, AF.platinum, AF.battery);
        afCam(camera, [afLerp(-24, -16, k), 3.3, 6.6], [afLerp(-6, 2, k), 1.0, -0.5], 40);
      } else if (mode === 'cells') {
        const k = afK(t, AF.battery, AF.gone);
        afCam(camera, [afLerp(-0.5, -0.38, k), 1.12, 60 + 0.36], [0.4, 0.95, 60.0], 36, -4);
      } else if (mode === 'stop') {
        const k = afK(t, AF.gone, AF.trade);
        afCam(camera, [-44, afLerp(5.2, 4.8, k), afLerp(9.5, 9.0, k)], [10, 1.6, -1.5], 44);
      } else {
        const k = afK(t, AF.halt, AF.phone);
        afCam(camera, [afLerp(-34, -30, k), 2.6, 4.2], [-12, 4.2, -0.4], 44);
      }
    },
    grade(t, p, shot) {
      p.warmth = -0.05; p.saturation = 1.02; p.bloom = 0.5; p.bloomThreshold = 0.9; p.vignette = 0.6;
      if (shot.mode === 'dark') { p.exposure = 1.25; p.saturation = 0.8; p.vignette = 0.85; }
      if (shot.mode === 'stop') p.exposure = afLerp(1, 1.25, MathX.smooth(t, AF.goneW, AF.goneW + 1));
    },
  };
};
