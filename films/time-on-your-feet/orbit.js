/* =====================================================================
   ORBIT — GPS and the Moon (the planet is the engine's EarthScene: its meshes, borrowed):
     gps     the Earth and the GPS constellation: 24 satellites in six rings, 20,200 km up (4.17 Earth radii), 55° tilt
             (their 12-hour orbits sped up)
     sat     one satellite up close, the Earth below it as it is from there (28° across)
     signal  the night side: four satellites' signals reach one city; your phone works out where it is from their clocks
     moon    on the Moon: a lander with its clock, the Earth low over the horizon (2° across, as it really is)
   Units: in gps and signal the Earth's radius is 1; in sat and moon the scene is in metres and the Earth group is moved
   and scaled to sit where it would appear (same angular size).
   ===================================================================== */

// a GPS satellite's solar panel: dark blue cells in a silver grid
function tfCellCanvas() {
  return tfCanvas(256, 512, (g, w, h) => {
    g.fillStyle = '#c9ccd2'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 8; x++) { const v = 0.8 + 0.2 * hash2(x + 3, y + 9); g.fillStyle = `rgb(${18 * v},${32 * v},${74 * v})`; g.fillRect(x * 32 + 2, y * 32 + 2, 28, 28); g.fillStyle = 'rgba(120,150,220,0.12)'; g.fillRect(x * 32 + 2, y * 32 + 2, 28, 3); }
  });
}
// gold foil insulation, crinkled
function tfFoilCanvas() {
  return tfCanvas(256, 256, (g, w, h) => {
    const r = new RNG(CONFIG.seed + 901);
    g.fillStyle = '#b8862e'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { const x = r.range(0, w), y = r.range(0, h), s = r.range(8, 40); g.fillStyle = `rgba(${r.next() < 0.5 ? '255,226,150' : '90,56,10'},${r.range(0.08, 0.3)})`; g.beginPath(); g.moveTo(x, y); g.lineTo(x + s, y + r.range(-s, s) * 0.4); g.lineTo(x + r.range(-s, s) * 0.5, y + s); g.fill(); }
  });
}
// the Moon's ground: grey regolith with fine speckle
function tfRegolithCanvas() {
  return tfCanvas(512, 512, (g, w, h) => {
    g.fillStyle = '#7d7a76'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40000; i++) { const v = hash1(i * 1.37); g.fillStyle = `rgba(${v > 0.5 ? '255,255,255' : '0,0,0'},${hash1(i * 2.11) * 0.08})`; g.fillRect(hash1(i * 3.3) * w, hash1(i * 5.9) * h, 2, 2); }
  });
}

TF_SETS.orbit = (app) => {
  const S = tfSet(app, { sky: '#000000', hemi: ['#000000', '#000000', 0], sun: [10, 2, 4], sunColor: '#fff6ea', sunI: 3.2, shadow: 2048, shadowR: 16, shadowFar: 300, fov: 40, near: 0.002, far: 200000, env: ['#1a1c22', '#0c0d10', '#050506'] });
  const { scene, camera: cam, sun } = S;
  const W = tfWin, K = tfK;
  const stars = tfStarDome(scene, { k: 0.7, r: 150000 });
  // ---- the Earth (the engine's planet: surface, clouds, air)
  const ES = new EarthScene();
  const earthG = new THREE.Group(); scene.add(earthG);
  const atmo = ES.scene.children.find((o) => o.isMesh && o !== ES.earth && o !== ES.clouds && o.material && o.material.side === THREE.BackSide);
  for (const o of [ES.earth, ES.clouds, atmo]) earthG.add(o);
  const EU = ES.uniforms;
  // the planet turned so the Atlantic faces the camera's usual side; the subsolar point set per shot
  const sunFrom = (lon, lat) => EarthScene.dirFromLonLat(lon, lat);

  // ---- the GPS constellation: six planes 60° apart, 55° tilt, 31 satellites, radius 4.17
  const GR = 26560 / 6371, planes = [], sats = [];
  const ringM = new THREE.LineBasicMaterial({ color: new THREE.Color(0.35, 0.6, 1.0), transparent: true, opacity: 0.35, depthWrite: false });
  const satDot = tfDotTex(0.3);
  for (let p = 0; p < 6; p++) {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, p * Math.PI / 3, 0)).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, MathX.deg(55))));
    planes.push(q);
    const pts = []; for (let i = 0; i <= 128; i++) { const a = i / 128 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * GR, 0, Math.sin(a) * GR).applyQuaternion(q)); }
    const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), ringM); scene.add(ring);
    const nk = p === 5 ? 6 : 5;               // (31 in service: some planes carry spares)
    for (let k = 0; k < nk; k++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: satDot, color: new THREE.Color(1.6, 1.8, 2.4), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      sp.scale.setScalar(0.16); scene.add(sp); sats.push({ sp, q, ph: k * Math.PI * 2 / nk + p * 0.45 + (k % 2) * 0.2 });
    }
  }
  const rings = scene.children.filter((o) => o.isLine);
  const satPos = (s, t, out = new THREE.Vector3()) => { const a = s.ph + (t - TF.gps) * (Math.PI * 2 / 60); return out.set(Math.cos(a) * GR, 0, Math.sin(a) * GR).applyQuaternion(s.q); };

  // ---- one satellite, up close (metres): a box wrapped in gold foil, two long solar wings, the antenna array facing
  // the Earth (−y), small thrusters and a radiator (white)
  const satG = new THREE.Group(); scene.add(satG);
  {
    const foil = tfStd('#ffffff', 0.35, 0.85, { map: tfTex(tfFoilCanvas()) }), white = tfStd('#e8e8e4', 0.5, 0.1), metal = tfStd('#a8acb2', 0.3, 0.9), dark = tfStd('#1a1c20', 0.5, 0.3);
    const cells = tfStd('#ffffff', 0.25, 0.6, { map: tfTex(tfCellCanvas(), { repeat: false }) });
    tfBox(2.4, 2.6, 2.0, foil, 0, 0, 0, satG); tfBox(2.42, 0.9, 2.02, white, 0, 0.9, 0, satG);
    tfBox(1.8, 0.12, 1.6, metal, 0, -1.36, 0, satG);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, rr = i % 2 ? 0.55 : 0.3; tfCyl(0.06, 0.06, 0.6, white, Math.cos(a) * rr, -1.72, Math.sin(a) * rr, satG, 10); }
    tfCyl(0.5, 0.45, 0.25, white, 0.0, -1.5, 0, satG, 24);
    for (const s of [-1, 1]) {
      tfCyl(0.05, 0.05, 1.2, metal, s * 1.8, 0.2, 0, satG, 8).rotation.z = Math.PI / 2;
      for (let k = 0; k < 3; k++) { const pnl = tfBox(2.3, 0.05, 1.9, cells, s * (3.6 + k * 2.4), 0.2, 0, satG); pnl.rotation.x = 1.15; }
    }
    tfBox(0.3, 0.3, 0.6, dark, 0.8, 1.1, 1.05, satG);
  }
  satG.visible = false;

  // ---- the Moon (metres): rolling grey ground with craters (a shader: crater bowls and rims from cellular noise), a
  // small lander with a clock; the Earth low over the horizon
  const moonG = new THREE.Group(); scene.add(moonG);
  const regT = tfTex(tfRegolithCanvas()); regT.repeat.set(400, 400);
  const groundGeo = new THREE.PlaneGeometry(6000, 6000, 360, 360).rotateX(-Math.PI / 2);
  {
    // the ground's shape: gentle swells and craters of many sizes (seeded), the curve of a small world (r 1737 km)
    const p = groundGeo.attributes.position, n3 = EarthScene._noise3(CONFIG.seed + 950), r = new RNG(CONFIG.seed + 951), cr = [];
    for (let i = 0; i < 900; i++) { const big = r.next() < 0.04; cr.push([r.range(-3000, 3000), r.range(-3000, 3000), big ? r.range(60, 220) : r.range(3, 40)]); }
    cr.push([-30, -60, 18], [40, -110, 34], [-90, -200, 60], [18, -26, 5]);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      let y = 6 * (n3(x / 400, 0.5, z / 400) - 0.5) + 1.5 * (n3(x / 60, 3.3, z / 60) - 0.5);
      for (const [cx, cz, R] of cr) { const d = Math.hypot(x - cx, z - cz) / R; if (d < 1.6) y += R * (d < 1 ? 0.18 * (d * d - 1) + 0.05 : 0.05 * Math.exp(-Math.pow((d - 1) / 0.25, 2))); }
      y -= (x * x + z * z) / (2 * 1737400);
      // (around the lander, flat)
      const f = MathX.smooth(Math.hypot(x, z), 6, 16); p.setY(i, y * f);
    }
    groundGeo.computeVertexNormals();
  }
  const ground = tfMesh(groundGeo, tfStd('#ffffff', 0.95, 0, { map: regT }), 0, 0, 0, moonG); ground.castShadow = true; ground.receiveShadow = true;
  // the lander: four legs, gold foil, a white top with a clock face
  const lander = new THREE.Group(); lander.position.set(1.5, 0, -6.5); lander.rotation.y = 0.5; moonG.add(lander);
  {
    const foil = tfStd('#ffffff', 0.35, 0.85, { map: tfTex(tfFoilCanvas()) }), white = tfStd('#e6e4de', 0.5, 0.1), metal = tfStd('#a8acb2', 0.3, 0.9);
    tfMesh(new THREE.CylinderGeometry(0.9, 0.9, 0.8, 8), foil, 0, 1.2, 0, lander); tfMesh(new THREE.CylinderGeometry(0.7, 0.9, 0.5, 8), white, 0, 1.85, 0, lander);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4, leg = tfMesh(new THREE.CylinderGeometry(1, 1, 1, 8).translate(0, 0.5, 0), metal, 0, 0, 0, lander); tfStrut(leg, [Math.cos(a) * 0.7, 1.0, Math.sin(a) * 0.7], [Math.cos(a) * 1.5, 0.08, Math.sin(a) * 1.5], 0.04); tfCyl(0.16, 0.2, 0.06, metal, Math.cos(a) * 1.5, 0.03, Math.sin(a) * 1.5, lander, 14); }
    tfMesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8), metal, 0.3, 2.6, 0, lander); tfMesh(new THREE.SphereGeometry(0.28, 16, 8, 0, Math.PI * 2, 0, 1.2), white, 0.3, 3.15, 0, lander).rotation.x = Math.PI;
  }
  const lclock = tfClockFace('MOON');
  const lcm = tfMesh(new THREE.PlaneGeometry(0.78, 0.29), new THREE.MeshBasicMaterial({ map: lclock.tex }), 0, 1.25, 0.905, lander); lcm.castShadow = false;
  // footprints leading to it
  const fpM = tfStd('#5c5955', 1, 0);
  for (let i = 0; i < 14; i++) { const fp = tfMesh(new THREE.PlaneGeometry(0.12, 0.3).rotateX(-Math.PI / 2), fpM, -0.4 + (i % 2) * 0.25 + i * 0.05, 0.01, -1.2 - i * 0.38, moonG); fp.castShadow = false; }
  moonG.visible = false;

  // ---- the signal: four lines from satellites to a city (pulses travel along them), a beacon on the city
  const pulse = tfPuffs(scene, 3000, { additive: true, soft: 1.3 });
  const CITY = sunFrom(-0.12, 51.5);            // London, on the night side
  const cityDot = tfGlowSprite(scene, '#5ab0ff', 0.04); cityDot.visible = false;

  const CAM = {
    gps(t) {
      const k = K(t, TF.gps - 0.5, TF.gps2, (x) => x), a = 0.4 + 0.35 * k;
      const D = tfLerp(15, 10.5, Ease.inOutSine(k));
      tfCam(cam, [Math.sin(a) * D, 3.2 - 1.2 * k, Math.cos(a) * D], [0, 0, 0], tfLerp(44, 46, k));
    },
    sat(t) {
      const k = K(t, TF.gps2 - 0.4, TF.gps3, (x) => x), a = -0.5 + 0.6 * k, D = tfLerp(14, 10.5, k);
      tfCam(cam, [Math.sin(a) * D, 3.5 - 1.5 * k, Math.cos(a) * D], [0, -3.2, 0], 52);
    },
    signal(t) {
      const k = K(t, TF.gps3 - 0.4, TF.moon - 0.4, Ease.inOutSine);
      const c = CITY.clone().applyQuaternion(earthG.quaternion);
      const side = new THREE.Vector3(0, 1, 0).cross(c).normalize();
      const p = c.clone().multiplyScalar(tfLerp(3.6, 1.9, k)).addScaledVector(side, tfLerp(1.6, 0.5, k)).add(new THREE.Vector3(0, tfLerp(1.2, 0.35, k), 0));
      tfCam(cam, p.toArray(), c.clone().multiplyScalar(tfLerp(0.85, 1, k)).toArray(), tfLerp(48, 36, k));
    },
    moon(t) {
      const k = K(t, TF.moon - 0.4, TF.why, (x) => x), dr = tfDrift(t, 0.02, 0.2, 61);
      const p = [-1.6 + 1.2 * k + dr[0], 1.55 + dr[1], 2.6 - 0.8 * k + dr[2]];
      const at = tfV([1.2, 1.1, -6.5], [0.2, 2.6, -40], K(t, tfCap('moon', 1).show - 0.6, tfCap('moon', 1).show + 2.2));
      tfCam(cam, p, at, tfLerp(46, 30, K(t, tfCap('moon', 1).show - 0.6, tfCap('moon', 1).show + 2.2)));
    },
  };

  const set = {
    scene, camera: cam,
    frame(t, shot) {
      const m = shot.mode;
      // the Earth: where and how big for this shot; its sunlight
      earthG.rotation.set(0, 0, 0);
      if (m === 'gps') { earthG.position.set(0, 0, 0); earthG.scale.setScalar(1); EU.uSun.value.copy(sunFrom(-60 + (t - TF.gps) * 0.6, 8)); earthG.rotation.y = -0.6; }
      if (m === 'signal') { earthG.position.set(0, 0, 0); earthG.scale.setScalar(1); EU.uSun.value.copy(sunFrom(-150, -8)); earthG.rotation.y = 0.9; }
      if (m === 'sat') { earthG.position.set(-200, -900, -1430); earthG.scale.setScalar(400); EU.uSun.value.copy(sunFrom(-40, 10)); earthG.rotation.y = 0.2; }
      if (m === 'moon') { earthG.position.set(-260, 210 + 0, -5600); earthG.scale.setScalar(97); EU.uSun.value.copy(new THREE.Vector3(-0.85, 0.15, 0.5).normalize()); earthG.rotation.y = 2.2; }
      earthG.updateMatrixWorld(true);
      // (EarthScene's shader takes the sun in world space: turn it with the planet)
      EU.uSun.value.applyQuaternion(earthG.quaternion).normalize();
      ES.clouds.material.uniforms.uOff.value = t * 0.0004;
      (CAM[m] || CAM.gps)(t);
      stars.follow(cam);
      // near plane per shot (depth precision for the clouds over the planet)
      const near = m === 'moon' ? 0.05 : m === 'sat' ? 0.1 : 0.002;
      if (cam.near !== near) { cam.near = near; cam.updateProjectionMatrix(); }
      const big = m === 'gps' || m === 'signal';
      for (const r of rings) r.visible = m === 'gps';
      for (const s of sats) { s.sp.visible = big; if (big) satPos(s, t, s.sp.position); s.sp.scale.setScalar(m === 'signal' ? 0.07 : 0.16); }
      satG.visible = m === 'sat'; moonG.visible = m === 'moon';
      if (m === 'sat') { satG.rotation.set(0, (t - TF.gps2) * 0.02, 0); sun.position.set(-30, 12, 18); sun.target.position.set(0, 0, 0); sun.intensity = 3.4; { const c = sun.shadow.camera; } }
      if (m === 'moon') { sun.position.set(-60, 14, 30); sun.target.position.set(0, 0, -4); sun.intensity = 4.2; }
      if (big) { sun.intensity = 0; }
      // the signal: from the four satellites nearest the city, pulses run down to it (the speed of light, slowed)
      pulse.begin(); cityDot.visible = m === 'signal';
      if (m === 'signal') {
        const c = CITY.clone().applyQuaternion(earthG.quaternion).multiplyScalar(1.002);
        cityDot.position.copy(c); cityDot.scale.setScalar(0.035 * (1 + 0.25 * Math.sin(t * 6)));
        const near4 = sats.map((s) => [s, satPos(s, t).distanceTo(c)]).filter(([s, d]) => satPos(s, t).dot(c) > 0.2).sort((a, b) => a[1] - b[1]).slice(0, 4);
        for (const [s] of near4) {
          const a = satPos(s, t), d = a.clone().sub(c);
          for (let j = 0; j < 60; j++) { const u = j / 60; const pt = c.clone().addScaledVector(d, u); pulse.add(pt.x, pt.y, pt.z, 0.008, 0.12, 0.4, 0.8, 1.6); }
          for (let q = 0; q < 3; q++) { const u = 1 - (((t * 0.7 + q / 3 + s.ph) % 1) + 1) % 1; const pt = c.clone().addScaledVector(d, u); pulse.add(pt.x, pt.y, pt.z, 0.03, 0.9, 0.7, 1.2, 2.4); }
        }
      }
      pulse.end();
      // the Moon's clock (it gains 56 µs a day: shown as the time since 7:00 like the others)
      if (m === 'moon') { const s = 7 * 3600 + (t - TF.moon); lclock.update({ big: '07:00:' + String(Math.floor(s % 60)).padStart(2, '0'), small: '.' + String(Math.floor((s % 1) * 1000)).padStart(3, '0') + ' 000 65', on: 1 }); }
    },
    grade(t, p, shot) {
      const m = shot.mode;
      p.exposure = 1.0; p.vignette = 0.55; p.bloom = 0.4; p.bloomThreshold = 0.85; p.grain = 0.024; p.contrast = 1.08; p.saturation = 1.05;
      if (m === 'moon') { p.exposure = 0.95; p.contrast = 1.15; p.saturation = 0.9; }
    },
    labels(t) {
      const m = tfShotAt(t).mode;
      if (m === 'gps') return [{ p: satPos(sats[5], t).toArray(), text: 'GPS SATELLITES', sub: '31 OF THEM · DRAWN BIGGER', a: W(t, tfCap('gps', 1).show + 0.4, TF.gps2 - 0.2, 0.4, 0.3) }];
      if (m === 'sat') return [{ p: [1.3, 0.4, 1.0], text: 'ITS ATOMIC CLOCKS', sub: '+38 MILLIONTHS OF A SECOND A DAY', a: W(t, TF.gps2 + 1.0, TF.gps3 - 0.2, 0.4, 0.3) }];
      if (m === 'signal') { const c = CITY.clone().applyQuaternion(earthG.quaternion); return [{ p: c.toArray(), text: 'YOUR PHONE', sub: 'TIMES 4 SATELLITES\' SIGNALS', a: W(t, tfCap('gps3', 1).show + 0.2, TF.moon - 0.2, 0.4, 0.3) }]; }
      if (m === 'moon') return [{ p: [1.5, 2.3, -6.5], text: 'A CLOCK ON THE MOON', sub: '+56 MILLIONTHS OF A SECOND A DAY', a: W(t, TF.moon + 1.0, tfCap('moon', 1).show - 0.4, 0.4, 0.3) }];
      return [];
    },
  };
  return set;
};
