/* =====================================================================
   TOWER — two real experiments high up (illustrated):
     flight   1971: Hafele and Keating flew four caesium clocks round the world on airliners (the clocks had their own
              seats). A four-engined jet of the day over a sea of cloud at sunrise, seen from alongside
     skytree  2020: Tokyo Skytree at dawn. Optical clocks on the ground floor and 450 m up (Takamoto et al.); the camera
              climbs the tower from its foot to the observation deck, the city waking up below
   Layout: the flight at the origin (the jet flies along −z at 10 km; the cloud deck scrolls under it), Tokyo at x = 5000
   (the tower at its centre, metres). Everything is a pure function of time.
   ===================================================================== */

// the tower's lattice: white steel tubes in diamonds, transparent between (alpha)
function tfLatticeCanvas() {
  return tfCanvas(256, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#ffffff'; g.lineCap = 'round';
    const n = 4, dx = w / n, dy = h / 8;
    g.lineWidth = 9;
    for (let i = -n; i <= 2 * n; i++) { g.beginPath(); g.moveTo(i * dx, 0); g.lineTo(i * dx + h * (dx / dy) / 4, h); g.stroke(); g.beginPath(); g.moveTo(i * dx, 0); g.lineTo(i * dx - h * (dx / dy) / 4, h); g.stroke(); }
    g.lineWidth = 14; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * dx, 0); g.lineTo(i * dx, h); g.stroke(); }
    g.lineWidth = 7; for (let j = 0; j <= 8; j += 2) { g.beginPath(); g.moveTo(0, j * dy); g.lineTo(w, j * dy); g.stroke(); }
  });
}
// a building's façade: rows of windows, some lit (dawn: about a third)
function tfFacadeCanvas(seed) {
  return tfCanvas(256, 512, (g, w, h) => {
    const r = new RNG(seed);
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    for (let y = 6; y < h; y += 16) for (let x = 4; x < w; x += 12) {
      const on = r.next() < 0.3, warm = r.next() < 0.75;
      g.fillStyle = on ? (warm ? `rgb(255,${190 + r.int(0, 40)},${110 + r.int(0, 50)})` : 'rgb(200,225,255)') : 'rgb(10,14,20)';
      g.fillRect(x, y, 8, 10);
    }
  });
}

TF_SETS.tower = (app) => {
  const S = tfSet(app, { sky: '#7d8fb0', hemi: ['#a9bedc', '#4a3c34', 0.7], sun: [-600, 120, -900], sunColor: '#ffc890', sunI: 3.2, fov: 45, near: 0.5, far: 60000, env: ['#8aa0c8', '#d8a888', '#3a3436'] });
  const { scene, camera: cam, sun, hemi } = S;
  const W = tfWin, K = tfK;

  // ---- the flight: the sky at sunrise, the cloud deck, the jet ----------------------------------------------------
  const flight = new THREE.Group(); scene.add(flight);
  const skyF = tfSky(flight, '#2c4f86', '#f3b27a', '#c08a6e', { sunDir: [-0.55, 0.06, -0.83], sunGlow: '#ffb070', hw: 0.12, r: 40000 });
  // the cloud deck 2.5 km below: domain-warped noise, lit from the low sun (bright tops, blue shadows), fading to haze
  const cloudU = { uOff: { value: new THREE.Vector2() }, uSun: { value: new THREE.Vector3(-0.55, 0.06, -0.83).normalize() } };
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(80000, 80000, 1, 1).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: cloudU, fog: false,
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform vec2 uOff; uniform vec3 uSun; varying vec3 vW;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 6; i++){ v += a * n(p); p = p * 2.03 + 11.7; a *= 0.5; } return v; }
      void main(){
        vec2 p = (vW.xz + uOff) / 2600.0;
        vec2 q = vec2(fbm(p + 3.1), fbm(p + 7.7));
        float d = fbm(p * 1.3 + q * 1.4);
        float c = smoothstep(0.38, 0.68, d);
        // a fake height gradient for the light: bright on the sun side of each billow
        float e = 0.02, dx = fbm((p + vec2(e, 0.0)) * 1.3 + q * 1.4) - d, dz = fbm((p + vec2(0.0, e)) * 1.3 + q * 1.4) - d;
        float lit = clamp(0.55 - 18.0 * (dx * uSun.x + dz * uSun.z), 0.0, 1.0);
        vec3 shadow = vec3(0.36, 0.42, 0.58), top = vec3(1.25, 0.98, 0.82);
        vec3 col = mix(vec3(0.34, 0.38, 0.5), mix(shadow, top, lit), c);
        float dist = length(vW.xz - cameraPosition.xz);
        col = mix(col, vec3(0.95, 0.72, 0.6), smoothstep(6000.0, 36000.0, dist));
        gl_FragColor = vec4(col, 1.0); }`,
  }));
  deck.position.y = -2500; flight.add(deck);
  // the jet (model: nose to −z, metres): a narrow-body four-engined airliner of the early 1970s, white top, bare-metal
  // belly, a blue cheat line
  const jet = new THREE.Group(); flight.add(jet);
  {
    const top = tfStd('#eceae4', 0.35, 0.1), metal = tfStd('#b8bcc2', 0.28, 0.85), blue = tfStd('#1f4f9a', 0.4, 0.1), darkG = tfStd('#101418', 0.2, 0.3);
    const A = (geo, m, x = 0, y = 0, z = 0) => tfMesh(geo, m, x, y, z, jet);
    const fus = A(tfLoft([[0, 0, 22, 0.35, 0.45], [0, 0.3, 19, 1.4, 1.6], [0, 0.2, 14, 1.9, 2.0], [0, 0, -12, 1.9, 2.0], [0, -0.15, -17, 1.6, 1.6], [0, -0.45, -20, 0.9, 0.85], [0, -0.6, -21.3, 0.25, 0.2]], 28, 0.5), top);
    A(tfLoft([[0, -0.75, 15, 1.7, 1.2], [0, -0.75, -14, 1.7, 1.2]], 24, 0.4), metal).scale.set(1.04, 1, 1);
    A(new THREE.BoxGeometry(3.86, 0.34, 32), blue, 0, 0.05, -1);
    A(new THREE.BoxGeometry(3.88, 0.12, 30), darkG, 0, 0.55, -1);              // windows
    A(new THREE.BoxGeometry(2.4, 0.42, 1.0), darkG, 0, 0.7, -18.8).rotation.x = -0.4;
    const wingM = tfStd('#c4c8cc', 0.35, 0.6, { side: THREE.DoubleSide });
    for (const s of [-1, 1]) {
      const sh = new THREE.Shape(); sh.moveTo(0, -4.2); sh.lineTo(s * 0 + 0, 4.0); sh.lineTo(19.5, 12.5); sh.lineTo(19.5, 14.2); sh.lineTo(0, -4.2);
      const shp = new THREE.Shape([new THREE.Vector2(0, -4.0), new THREE.Vector2(0, 4.6), new THREE.Vector2(19.5, 13.8), new THREE.Vector2(19.5, 12.0)]);
      const wg = new THREE.ExtrudeGeometry(shp, { depth: 0.3, bevelEnabled: false }); wg.rotateX(Math.PI / 2); if (s < 0) wg.scale(-1, 1, 1);
      const wing = A(wg, wingM, s * 1.6, -0.9, 1.5); wing.rotation.z = s * 0.1;
      // two engines a side on pylons
      for (const [d, dz] of [[7.0, 1.0], [13.2, 4.6]]) {
        const ex = s * (1.6 + d), ey = -0.9 + d * 0.1 - 1.4, ez = 1.5 + dz - 3.2;
        A(tfLoft([[0, 0, 0, 0.62, 0.62], [0, 0, -0.5, 0.68, 0.68], [0, 0, -3.4, 0.6, 0.6], [0, 0, -4.2, 0.36, 0.36]], 20, 0.1).rotateY(Math.PI), metal, ex, ey, ez - 2.4);
        A(new THREE.BoxGeometry(0.25, 1.0, 2.6), wingM, ex, ey + 0.8, ez + 0.2);
        A(new THREE.CircleGeometry(0.55, 18), darkG, ex, ey, ez - 2.43).rotation.y = Math.PI;
      }
    }
    for (const s of [-1, 1]) { const st = A(new THREE.BoxGeometry(6.5, 0.18, 2.6), wingM, s * 3.6, 0.6, 18.8); st.rotation.y = -s * 0.5; }
    const fin = new THREE.Shape([new THREE.Vector2(15.5, 0), new THREE.Vector2(21.5, 0), new THREE.Vector2(23.0, 7.2), new THREE.Vector2(20.8, 7.2)]);
    const fg = new THREE.ExtrudeGeometry(fin, { depth: 0.3, bevelEnabled: false }); fg.rotateY(-Math.PI / 2); fg.translate(0.15, 1.6, 0);
    A(fg, top);
    A(new THREE.BoxGeometry(0.34, 1.6, 3.0), blue, 0, 7.4, 21.4).rotation.x = -0.25;
    jet.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  }
  sun.target.position.set(0, 0, 0);
  sun.shadow && (sun.castShadow = true);
  sun.shadow.mapSize.set(2048, 2048); { const c = sun.shadow.camera; c.left = -30; c.right = 30; c.top = 30; c.bottom = -30; c.near = 100; c.far = 3000; c.updateProjectionMatrix(); }

  // ---- Tokyo at dawn (x = 5000): the city, Mount Fuji far off, the Skytree ----------------------------------------
  const T0 = [5000, 0, 0];
  const city = new THREE.Group(); city.position.set(...T0); scene.add(city);
  const skyT = tfSky(city, '#3a5f96', '#f0b58a', '#4a5160', { sunDir: [0.6, 0.04, -0.8], sunGlow: '#ffb070', hw: 0.14, r: 50000 });
  const groundM = tfStd('#2b2f36', 0.9, 0);
  tfMesh(new THREE.CircleGeometry(30000, 64).rotateX(-Math.PI / 2), groundM, 0, -0.1, 0, city).castShadow = false;
  // the buildings: instanced boxes with lit windows (three façade textures), clear of a plaza round the tower
  const facades = [1, 2, 3].map((k) => { const t = tfTex(tfFacadeCanvas(CONFIG.seed + 600 + k)); t.repeat.set(1, 1); return t; });
  const bm = facades.map((f) => tfStd('#3d4552', 0.6, 0.2, { emissive: new THREE.Color(1, 1, 1), emissiveMap: f, emissiveIntensity: 0.55 }));
  // (the windows are laid out in world metres, one every 3.2 m across and a floor every 3.6 m, whatever a box's size)
  for (const mm of bm) mm.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vTfW; varying vec3 vTfN;')
      .replace('#include <project_vertex>', '#include <project_vertex>\n#ifdef USE_INSTANCING\nvTfW = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz; vTfN = mat3(instanceMatrix) * objectNormal;\n#else\nvTfW = (modelMatrix * vec4(transformed, 1.0)).xyz; vTfN = objectNormal;\n#endif');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vTfW; varying vec3 vTfN;')
      .replace('#include <emissivemap_fragment>', 'vec3 tfn = normalize(vTfN); vec2 wuv = vec2((abs(tfn.x) > abs(tfn.z) ? vTfW.z : vTfW.x) / 68.0, vTfW.y / 115.0);\ntotalEmissiveRadiance *= texture2D(emissiveMap, wuv).rgb * (1.0 - step(0.5, abs(tfn.y)));');
  };
  const bgeo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  { const uv = bgeo.attributes.uv; for (let i = 0; i < uv.count; i++) { if (Math.abs(bgeo.attributes.normal.getY(i)) > 0.5) uv.setXY(i, 0, 0); } }
  const r = new RNG(CONFIG.seed + 650), N = 2600, inst = bm.map((m) => new THREE.InstancedMesh(bgeo, m, N));
  const cnt = [0, 0, 0], mtx = new THREE.Matrix4();
  for (let i = 0; i < N * 3; i++) {
    const a = r.range(0, 6.2832), d = 140 + Math.pow(r.next(), 0.7) * 5200, x = Math.cos(a) * d, z = Math.sin(a) * d;
    const near = Math.max(0, 1 - d / 3000), hgt = r.range(8, 36) + (r.next() < 0.08 ? r.range(40, 160) * (0.4 + near) : 0), w = r.range(14, 40), dd = r.range(14, 40);
    const k = i % 3; if (cnt[k] >= N) continue;
    mtx.compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.round(a / 1.5708) * 1.5708 + r.range(-0.08, 0.08)), new THREE.Vector3(w, hgt, dd));
    inst[k].setMatrixAt(cnt[k]++, mtx);
  }
  inst.forEach((m, k) => { m.count = cnt[k]; m.castShadow = true; m.receiveShadow = true; city.add(m); });
  // Mount Fuji, 100 km off to the south-west: a cone with a snow cap, blue with distance
  const fuji = tfMesh(new THREE.ConeGeometry(14000, 3800, 64, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.32, 0.38, 0.55), fog: false }), -26000, 1500, 32000, city);
  fuji.castShadow = false; fuji.scale.set(1, 1, 0.6);
  const cap = tfMesh(new THREE.ConeGeometry(4200, 1140, 48, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.85, 0.82, 0.9), fog: false }), -26000, 2830, 32000, city); cap.scale.set(1, 1, 0.6); cap.castShadow = false;
  // the Skytree: a lattice that goes from a triangle at the foot to a circle up top; two observation decks (350 m,
  // 450 m); the mast to 634 m. Drawn as a tapered lattice shell round a solid core
  const tower = new THREE.Group(); city.add(tower);
  const latT = tfTex(tfLatticeCanvas()); latT.repeat.set(12, 30);
  const latBg = tfTex(tfCanvas(256, 512, (g, w, h) => { g.fillStyle = '#7d8898'; g.fillRect(0, 0, w, h); g.drawImage(latT.image, 0, 0); })); latBg.repeat.set(12, 30);
  const latM = tfStd('#d4dce6', 0.45, 0.35, { map: latBg });
  const prof = [[0, 34], [60, 28], [150, 22], [250, 18], [330, 16], [345, 21], [360, 21], [372, 14], [440, 12], [446, 15.5], [456, 15.5], [462, 9], [497, 7.5], [634, 1.2]];
  const shell = tfMesh(new THREE.LatheGeometry(prof.map(([y, rr]) => new THREE.Vector2(rr, y)), 36), latM, 0, 0, 0, tower);
  const deckM = tfStd('#273040', 0.15, 0.6, { emissive: new THREE.Color('#ffd8a0'), emissiveIntensity: 0.35 });
  for (const [y0, h, rr] of [[340, 22, 21.5], [445, 12, 16]]) {
    tfMesh(new THREE.CylinderGeometry(rr, rr, h, 48), deckM, 0, y0 + h / 2, 0, tower);
    for (const y of [y0, y0 + h]) tfMesh(new THREE.CylinderGeometry(rr + 0.6, rr + 0.6, 1.2, 48), tfStd('#e8eef4', 0.4, 0.4), 0, y, 0, tower);
  }
  const beaconM = new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 0.3, 0.2) });
  const beacon = tfMesh(new THREE.SphereGeometry(1.4, 12, 8), beaconM, 0, 634, 0, tower); beacon.castShadow = false;
  // the foot: the low buildings of the Solamachi complex round its base
  tfBox(140, 30, 60, tfStd('#4a5462', 0.5, 0.3, { emissive: new THREE.Color('#ffcf98'), emissiveIntensity: 0.15 }), 60, 15, 60, city);
  tfBox(60, 18, 120, tfStd('#4a5462', 0.5, 0.3), -70, 9, 10, city);
  // dawn haze
  const fogT = new THREE.FogExp2('#d7aa94', 0.00011);
  // a street-level lamp glow by the foot (where the ground-floor clock is)
  const footL = new THREE.PointLight('#ffd0a0', 3000, 300, 2); footL.position.set(T0[0] + 30, 20, T0[2] + 40); scene.add(footL);

  const CAM = {
    flight(t) {
      // alongside and a little behind, drifting slowly forward along the fuselage
      const k = K(t, TF.planes - 0.5, TF.nist, (x) => x), dr = tfDrift(t, 0.6, 0.15, 51);
      const p = [-62 + 10 * k + dr[0], 14 - 4 * k + dr[1], 26 - 30 * k + dr[2]];
      tfCam(cam, p, [0, -0.5, 2 - 8 * k], 38, -3);
    },
    skytree(t) {
      // from the foot, up the tower to the 450 m deck, looking at it; the city opening out below
      const k = K(t, TF.skytree + 0.3, TF.jila - 0.5, Ease.inOutSine), a = -0.9 + 0.7 * k, dr = tfDrift(t, 1.2, 0.2, 53);
      const R = tfLerp(150, 260, k), y = tfLerp(12, 520, Math.pow(k, 1.15));
      const p = [T0[0] + Math.cos(a) * R + dr[0], y + dr[1], T0[2] + Math.sin(a) * R + dr[2]];
      const at = [T0[0], tfLerp(140, 440, K(t, TF.skytree + 0.3, TF.jila - 1.2)), T0[2]];
      tfCam(cam, p, at, tfLerp(62, 46, k));
    },
  };

  const set = {
    scene, camera: cam,
    frame(t, shot) {
      const m = shot.mode;
      (CAM[m] || CAM.flight)(t);
      const fl = m === 'flight';
      flight.visible = fl; city.visible = !fl;
      scene.fog = fl ? null : fogT;
      if (fl) {
        // the cloud deck streams back under the jet (250 m/s)
        cloudU.uOff.value.set(0, -(t - TF.planes) * 250);
        jet.position.set(0, 0.6 * Math.sin(t * 0.7), 0); jet.rotation.set(0.02 * Math.sin(t * 0.5), 0, 0.03 * Math.sin(t * 0.37));
        sun.position.set(-550, 60, -830); sun.target.position.set(0, 0, 0); sun.intensity = 3.4; sun.color.set('#ffc28a');
        hemi.intensity = 0.8; hemi.color.set('#9fb4d8'); hemi.groundColor.set('#d9a07a');
      } else {
        sun.position.set(T0[0] + 900, 220, T0[2] - 1200); sun.target.position.set(T0[0], 200, T0[2]); sun.intensity = 2.8; sun.color.set('#ffc896');
        { const c = sun.shadow.camera; c.left = -700; c.right = 700; c.top = 700; c.bottom = -700; c.near = 10; c.far = 4000; c.updateProjectionMatrix(); }
        hemi.intensity = 0.55; hemi.color.set('#8ea6cc'); hemi.groundColor.set('#3a3436');
        beacon.visible = Math.floor(t * 1.1) % 2 === 0;
      }
      if (fl) { const c = sun.shadow.camera; c.left = -30; c.right = 30; c.top = 30; c.bottom = -30; c.near = 100; c.far = 3000; c.updateProjectionMatrix(); }
    },
    grade(t, p, shot) {
      p.exposure = 1.04; p.vignette = 0.5; p.bloom = 0.36; p.bloomThreshold = 0.9; p.grain = 0.024; p.contrast = 1.06; p.saturation = 1.06; p.warmth = 0.04;
    },
    labels(t) {
      const m = tfShotAt(t).mode;
      if (m === 'flight') return [{ p: [1.0, 1.4, -6], text: '4 CAESIUM CLOCKS ON BOARD', sub: 'IN THEIR OWN SEATS', a: W(t, TF.planes + 0.8, TF.nist - 0.2, 0.4, 0.3) }];
      if (m === 'skytree') return [
        { p: [T0[0] + 20, 24, T0[2] + 30], text: 'A CLOCK AT THE BOTTOM', sub: '', a: W(t, TF.skytree + 1.4, TF.skytree + 4.6, 0.4, 0.3) },
        { p: [T0[0] + 16, 452, T0[2]], text: 'A CLOCK 450 m UP', sub: '+4 BILLIONTHS OF A SECOND A DAY', a: W(t, TF.skytree + 5.4, TF.jila - 0.2, 0.4, 0.3) }];
      return [];
    },
  };
  return set;
};
