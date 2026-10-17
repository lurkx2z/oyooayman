/* =====================================================================
   SET · SITE — the test site at dusk, a reconstruction from reports of Tesla's demo (Oct 15, 2026, a SpaceX test site
   in Texas). Nothing here is the real site: a concrete pad under floodlights, the curl ramp (a half loop that carries
   on as a ceiling, steel trusses on its outside), a crowd behind barriers, a row of five ordinary parked cars with a
   kicker ramp, a helicopter for the comparison, desert and a far tower with a red light.
   Every shot of sections 1, 3, 4, 5 and 6 happens here; shot.mode picks the car's motion and the camera (SITE_SHOTS).
   ===================================================================== */

const TR_KICK = { z: -22, k0: 0, v: 14, vy: 8 };       // the kick lane: kicker top at x = k0 + 3.5, y = 1
const TR_PAD = new THREE.Vector3(-30, 0, 4);            // the hover pad
const TR_HELI = new THREE.Vector3(-34, 7.5, -26);       // where the helicopter hovers

// the track surface texture: dark asphalt, white edge lines, red and white kerbs at the entry, a centre dash
function trTrackTex() {
  const c = Tex.canvas(256, 1024), x = c.getContext('2d');
  x.fillStyle = '#2b2d30'; x.fillRect(0, 0, 256, 1024);
  for (let i = 0; i < 2600; i++) { const v = 34 + Math.floor(hash1(i * 3.1) * 26); x.fillStyle = `rgb(${v},${v + 1},${v + 3})`; x.fillRect(hash1(i * 7.7) * 256, hash1(i * 1.3) * 1024, 2, 2); }
  x.fillStyle = '#d9d6cc'; x.fillRect(14, 0, 8, 1024); x.fillRect(234, 0, 8, 1024);
  x.fillStyle = 'rgba(217,214,204,0.55)'; for (let j = 0; j < 1024; j += 128) x.fillRect(124, j, 8, 64);
  return Tex.tex(c, { repeat: true, srgb: true });
}

// a box from a to b (a beam), thickness w
function trBeam(a, b, w, mat, parent) {
  const d = b.clone().sub(a), L = d.length(), m = new THREE.Mesh(new THREE.BoxGeometry(w, L, w), mat);
  m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}

// an arrow (shaft + head) along +y, length L, for the pressure and force diagrams
function trArrow(L, r, mat) {
  const g = new THREE.Group();
  const sh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L * 0.7, 10), mat); sh.position.y = L * 0.35; g.add(sh);
  const hd = new THREE.Mesh(new THREE.ConeGeometry(r * 2.6, L * 0.3, 14), mat); hd.position.y = L * 0.85; g.add(hd);
  return g;
}

TR_SET_BUILDERS.site = (app) => {
  const S = trSet(app, { sky: '#1b2638', fog: 0.0065, fogColor: '#2a3346', fov: 42, sun: [-38, 46, 30], sunColor: '#ffe9cf', sunI: 2.6,
    hemi: ['#5d7398', '#2a241e', 0.75], shadow: 2048, shadowR: 26, shadowFar: 220, far: 3000, env: ['#3a4c6c', '#b58a6a', '#1a1714'] });
  const { scene, camera, sun } = S;
  trSky(scene, '#0b1530', '#c98258', '#1d1c1f', { r: 2400, hw: 0.18 });
  scene.environmentIntensity = 0.8;
  // ---- ground: the concrete pad (slabs) inside desert dirt
  const padTex = (() => {
    const c = Tex.canvas(512, 512), x = c.getContext('2d'); x.fillStyle = '#6d6a64'; x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 9000; i++) { const v = 90 + Math.floor(hash1(i * 1.7) * 40); x.fillStyle = `rgba(${v},${v - 2},${v - 6},0.5)`; x.fillRect(hash1(i * 5.3) * 512, hash1(i * 2.9) * 512, 2, 2); }
    x.strokeStyle = 'rgba(30,28,26,0.7)'; x.lineWidth = 3; for (let k = 0; k <= 512; k += 128) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k, 512); x.stroke(); x.beginPath(); x.moveTo(0, k); x.lineTo(512, k); x.stroke(); }
    return Tex.tex(c, { repeat: true, srgb: true });
  })();
  padTex.repeat.set(14, 14);
  const pad = new THREE.Mesh(new THREE.PlaneGeometry(112, 112), new THREE.MeshStandardMaterial({ map: padTex, roughness: 0.82, metalness: 0 }));
  pad.rotation.x = -Math.PI / 2; pad.position.set(-14, 0.01, -6); pad.receiveShadow = true; scene.add(pad);
  {
    const N = 120, g = new THREE.PlaneGeometry(2400, 2400, N, N); g.rotateX(-Math.PI / 2);
    const P = g.attributes.position, col = new Float32Array(P.count * 3), c = new THREE.Color(), a = new THREE.Color('#3a3027'), b = new THREE.Color('#6b5a46');
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), z = P.getZ(i), d = Math.max(Math.abs(x + 14), Math.abs(z + 6));
      const n = trF2(x / 160, z / 160), hill = 70 * Math.pow(MathX.smooth(Math.hypot(x, z), 500, 1100), 1.5) * (0.4 + trF2(x / 300 + 9, z / 300));
      P.setY(i, d < 62 ? -0.05 : -0.05 + 1.2 * (n - 0.5) * MathX.smooth(d, 62, 120) + hill);
      c.copy(a).lerp(b, MathX.clamp(n * 0.9 + 0.2 * (trN2(x / 9, z / 9) - 0.5), 0, 1)); col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })); m.receiveShadow = true; scene.add(m);
  }
  // pad markings: the start line, a hover circle (H), lane lines
  const paintM = new THREE.MeshStandardMaterial({ color: '#d8d3c4', roughness: 0.7 }), yel = new THREE.MeshStandardMaterial({ color: '#d6a531', roughness: 0.7 });
  const flat = (w, d, m, x, z, ry = 0) => { const q = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); q.rotation.set(-Math.PI / 2, 0, ry); q.position.set(x, 0.02, z); q.receiveShadow = true; scene.add(q); return q; };
  flat(0.4, 4.2, paintM, TR_S0 - 2.6, 0);
  for (let k = -60; k < 4; k += 6) { flat(3, 0.15, paintM, k, 2.3); flat(3, 0.15, paintM, k, -2.3); }
  { const ring = new THREE.Mesh(new THREE.RingGeometry(5.4, 5.8, 48), yel); ring.rotation.x = -Math.PI / 2; ring.position.set(TR_PAD.x, 0.02, TR_PAD.z); scene.add(ring); }
  { const ring = new THREE.Mesh(new THREE.RingGeometry(7.4, 7.8, 48), yel); ring.rotation.x = -Math.PI / 2; ring.position.set(TR_HELI.x, 0.02, TR_HELI.z); scene.add(ring);
    flat(0.6, 5, yel, TR_HELI.x - 1.6, TR_HELI.z); flat(0.6, 5, yel, TR_HELI.x + 1.6, TR_HELI.z); flat(2.6, 0.6, yel, TR_HELI.x, TR_HELI.z); }

  // ---- the curl ramp: a swept slab along the track (s from −6 to the end of the ceiling), kerb walls, steel outside
  const trackM = new THREE.MeshStandardMaterial({ map: trTrackTex(), roughness: 0.78 });
  const underM = new THREE.MeshStandardMaterial({ color: '#3b3f45', roughness: 0.55, metalness: 0.6 });
  const kerbM = new THREE.MeshStandardMaterial({ color: '#c9c4b8', roughness: 0.6 });
  const steelM = new THREE.MeshStandardMaterial({ color: '#59616b', roughness: 0.45, metalness: 0.7 });
  {
    const HW = 2.0, TH = 0.4, S0 = -5, S1 = TR_TRACK, N = 140, R = {};
    const pos = [], uv = [], idx = [], pos2 = [], idx2 = [];
    for (let i = 0; i <= N; i++) {
      const s = S0 + (S1 - S0) * i / N; trRampAt(s, R);
      // the run-in plate is a ramp from the ground (it rises 0 → 0.1 m so its edge is visible)
      const lift = 0.03;
      const p = R.p.clone().addScaledVector(R.up, lift), o = R.p.clone().addScaledVector(R.up, lift - TH);
      for (const sz of [-1, 1]) { pos.push(p.x, p.y, sz * HW); uv.push(sz < 0 ? 0 : 1, s / 7); }
      for (const sz of [-1, 1]) { pos2.push(o.x, o.y, sz * HW); }
      for (const sz of [-1, 1]) { pos2.push(p.x, p.y, sz * HW); }
      if (i < N) {
        const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
        const b = i * 4, n4 = b + 4;
        idx2.push(b, b + 1, n4, b + 1, n4 + 1, n4);                     // the outer face (the underside)
        idx2.push(b, n4, b + 2, b + 2, n4, n4 + 2);                     // −z edge
        idx2.push(b + 1, b + 3, n4 + 1, b + 3, n4 + 3, n4 + 1);         // +z edge
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const top = new THREE.Mesh(g, trackM); top.receiveShadow = true; top.castShadow = true; scene.add(top);
    top.material.side = THREE.DoubleSide;
    const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(pos2, 3)); g2.setIndex(idx2); g2.computeVertexNormals();
    const und = new THREE.Mesh(g2, underM); und.material.side = THREE.DoubleSide; und.castShadow = true; und.receiveShadow = true; scene.add(und);
    // kerbs: a low wall on each edge (red/white blocks on the loop)
    const kg = new THREE.BoxGeometry(0.62, 0.32, 0.22), red = new THREE.MeshStandardMaterial({ color: '#a8352c', roughness: 0.6 });
    for (let s = 0.3; s < S1 - 0.2; s += 0.66) {
      trRampAt(s, R);
      for (const sz of [-1, 1]) {
        const m = new THREE.Mesh(kg, Math.floor(s / 0.66) % 2 ? red : kerbM);
        m.position.copy(R.p).addScaledVector(R.up, 0.19); m.position.z = sz * (HW - 0.11);
        m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(R.fwd, R.up, new THREE.Vector3().crossVectors(R.fwd, R.up)));
        m.castShadow = true; scene.add(m);
      }
    }
    // the steel: ribs around the outside of the slab every 1.6 m, two box trusses down each side to the ground,
    // diagonals; above the ceiling, a lattice of beams carried on four towers
    for (let s = 0.0, ri = 0; s <= S1 + 0.01; s += 1.6, ri++) {
      trRampAt(s, R);
      const o = R.p.clone().addScaledVector(R.up, -0.35);
      for (const sz of [-1, 1]) {
        const a = o.clone(); a.z = sz * (HW + 0.25);
        const b = o.clone().addScaledVector(R.up, -0.55); b.z = sz * (HW + 0.25);
        trBeam(a, b, 0.16, steelM, scene);
        // a column to the ground on the outside of the loop's climbing side and under the ceiling towers
        if (sz < 0 && a.y > 0.8 && ri % 2 === 0 && (R.p.x > 0.5 || (s > TR_LOOP && s < TR_TRACK - 3))) { const g0 = b.clone(); g0.y = 0; g0.z = sz * (HW + 0.6); trBeam(b, g0, 0.16, steelM, scene); }
      }
      const a = o.clone().addScaledVector(R.up, -0.55); a.z = -(HW + 0.25); const b = a.clone(); b.z = HW + 0.25; trBeam(a, b, 0.14, steelM, scene);
    }
  }
  // ---- floodlight towers (a mast, a bank of lamps that bloom) and soft beams through the haze
  const beams = [];
  const lampM = new THREE.MeshStandardMaterial({ color: '#fffaf0', emissive: new THREE.Color('#fff2da'), emissiveIntensity: 5, roughness: 0.3 });
  const beamMat = (k) => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    uniforms: { k: { value: k } },
    vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform float k; varying vec2 vU; void main(){ float a = k * pow(vU.y, 1.7) * (0.6 + 0.4 * sin(vU.x * 6.283 * 3.0) * 0.5 + 0.2); gl_FragColor = vec4(1.0, 0.92, 0.8, a); }' });
  for (const [x, z, ry] of [[-44, 26, 0.6], [16, 24, -0.5], [-50, -34, 2.4], [20, -30, -2.4]]) {
    const m = trCyl(0.22, 0.32, 22, steelM, x, 11, z);
    const head = new THREE.Group(); head.position.set(x, 22.4, z); head.rotation.y = ry; scene.add(head);
    trBox(3.6, 1.4, 0.3, steelM, 0, 0, 0, head);
    for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.08), lampM); l.position.set(-1.25 + (i % 3) * 1.25, (i < 3 ? 0.35 : -0.35), 0.18); head.add(l); }
    const target = new THREE.Vector3(-10, 0, -2), dir = target.clone().sub(head.position), L = dir.length();
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 9, L, 24, 1, true), beamMat(0.035));
    cone.position.copy(head.position).addScaledVector(dir, 0.5); cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.normalize());
    scene.add(cone); beams.push(cone);
  }
  const pl1 = new THREE.PointLight('#ffd9b0', 60, 60, 1.6); pl1.position.set(-20, 16, 18); scene.add(pl1);
  const pl2 = new THREE.PointLight('#b8d0ff', 30, 50, 1.6); pl2.position.set(10, 14, -16); scene.add(pl2);
  // ---- far: low buildings, tanks, a test tower with a red light, a line of distant lights
  const darkM = new THREE.MeshStandardMaterial({ color: '#2a2e35', roughness: 0.9 }), redM = new THREE.MeshStandardMaterial({ color: '#400', emissive: new THREE.Color('#ff2010'), emissiveIntensity: 4 });
  const winM = new THREE.MeshStandardMaterial({ color: '#332', emissive: new THREE.Color('#ffc890'), emissiveIntensity: 2.2 });
  trBox(40, 9, 18, darkM, -120, 4.5, -140); trBox(26, 14, 22, darkM, 60, 7, -170); trBox(60, 6, 14, darkM, -40, 3, 160);
  for (let i = 0; i < 9; i++) trBox(2.2, 0.6, 0.1, winM, -132 + i * 3, 5, -130.9);
  for (let i = 0; i < 4; i++) trCyl(5, 5, 16, new THREE.MeshStandardMaterial({ color: '#8d9198', roughness: 0.5, metalness: 0.4 }), 120 + i * 12, 8, -120);
  for (let y = 0; y < 60; y += 6) { trBeam(new THREE.Vector3(-200, y, -260), new THREE.Vector3(-194, y + 6, -260), 0.6, darkM, scene); trBeam(new THREE.Vector3(-194, y, -260), new THREE.Vector3(-200, y + 6, -260), 0.6, darkM, scene); }
  trBox(1.4, 1.4, 1.4, redM, -197, 61, -260);
  const farLights = new THREE.InstancedMesh(new THREE.SphereGeometry(0.5, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffd8a0' }), 60);
  for (let i = 0; i < 60; i++) farLights.setMatrixAt(i, new THREE.Matrix4().makeTranslation(-400 + i * 14 + 6 * hash1(i), 1.5 + 2 * hash1(i * 3), -520 - 40 * hash1(i * 7)));
  scene.add(farLights);
  // ---- crowd barriers and spectators (in front of the camera side, z ≈ 14)
  const barM = new THREE.MeshStandardMaterial({ color: '#8c939b', roughness: 0.4, metalness: 0.8 });
  for (let x = -60; x < 10; x += 2.4) {
    const g = new THREE.Group(); g.position.set(x, 0, 14); scene.add(g);
    trBox(2.3, 0.05, 0.05, barM, 0, 1.05, 0, g); trBox(2.3, 0.05, 0.05, barM, 0, 0.2, 0, g);
    for (let k = 0; k < 10; k++) trBox(0.025, 0.85, 0.025, barM, -1.1 + k * 0.245, 0.62, 0, g);
    trBox(0.05, 1.1, 0.5, barM, -1.15, 0.55, 0, g);
  }
  const people = [];
  const looks = Object.keys(LOOKS);
  for (let i = 0; i < 26; i++) {
    const x = -52 + i * 2.4 + 1.3 * (trR(i, 3) - 0.5), z = 15.2 + 1.6 * trR(i, 4);
    if (x > -26 && x < -19) continue;                      // a gap where the camera stands
    const p = new Person({ id: 'spec' + i, look: looks[i % looks.length], states: [[0, 'idle']] }, scene);
    p.root.position.set(x, 0, z); p.root.rotation.y = Math.PI + (trR(i, 5) - 0.5) * 0.6 + Math.atan2(x + 6, 14) * 0.5;
    people.push(p);
  }
  // ---- the row of five parked cars on the kick lane, the kicker and the landing ramp
  const fac = new VehicleFactory(), K = TR_KICK;
  const parked = [['sedan', '#5b6470'], ['suv', '#2e3d52'], ['pickup', '#6e2c26'], ['van', '#b9b4aa'], ['ev', '#3a3d42']];
  parked.forEach(([type, col], i) => {
    const v = fac.build(type, col); v.group.position.set(K.k0 + 9.8 + i * 2.75, 0, K.z); v.group.rotation.y = Math.PI / 2; scene.add(v.group);
  });
  const wedge = (x0, x1, h, up) => {
    const sh = new THREE.Shape(); sh.moveTo(x0, 0); sh.lineTo(x1, 0); if (up) sh.lineTo(x1, h); else sh.lineTo(x0, h); sh.lineTo(x0, 0);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 3.4, bevelEnabled: false }); g.translate(0, 0, K.z - 1.7);
    const m = new THREE.Mesh(g, [new THREE.MeshStandardMaterial({ color: '#4b4f55', roughness: 0.6, metalness: 0.5 }), trackM]); m.castShadow = m.receiveShadow = true; scene.add(m);
  };
  wedge(K.k0, K.k0 + 3.5, 1.0, true); wedge(K.k0 + 25.5, K.k0 + 29.5, 1.0, false);
  // ---- the helicopter (a light utility helicopter: cabin, boom, fin, skids, a blurred rotor disc)
  const heli = new THREE.Group(); heli.position.copy(TR_HELI); scene.add(heli);
  {
    const hm = new THREE.MeshStandardMaterial({ color: '#3d4a5c', roughness: 0.4, metalness: 0.3 }), hg = new THREE.MeshPhysicalMaterial({ color: '#0f1418', roughness: 0.05, metalness: 0.5, clearcoat: 1 });
    const cab = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), hm); cab.scale.set(2.1, 1.25, 1.1); cab.castShadow = true; heli.add(cab);
    const glassC = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14, 0, Math.PI, 0, Math.PI / 2), hg); glassC.scale.set(1.5, 1.1, 1.05); glassC.rotation.y = -Math.PI / 2; glassC.position.set(0.8, 0.1, 0); heli.add(glassC);
    const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.4, 5.6, 10), hm); boom.rotation.z = Math.PI / 2; boom.position.set(-4.5, 0.35, 0); heli.add(boom);
    trBox(1.2, 1.4, 0.12, hm, -7.1, 1.0, 0, heli); trBox(0.9, 0.08, 1.6, hm, -6.6, 0.4, 0, heli);
    for (const sz of [-1, 1]) { trBox(3.6, 0.1, 0.1, hm, 0.1, -1.55, sz * 1.05, heli); trBox(0.08, 0.6, 0.08, hm, 0.9, -1.25, sz * 1.0, heli); trBox(0.08, 0.6, 0.08, hm, -0.9, -1.25, sz * 1.0, heli); }
    trCyl(0.15, 0.25, 0.6, hm, 0, 1.45, 0, heli);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(5.2, 40), new THREE.MeshBasicMaterial({ color: '#1a1d22', transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }));
    disc.rotation.x = -Math.PI / 2; disc.position.y = 1.78; heli.add(disc);
    const rotor = new THREE.Group(); rotor.position.y = 1.78; heli.add(rotor);
    for (let k = 0; k < 2; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.04, 0.32), new THREE.MeshStandardMaterial({ color: '#15171a', transparent: true, opacity: 0.55 })); b.rotation.y = k * Math.PI / 2; rotor.add(b); }
    const tailR = new THREE.Mesh(new THREE.CircleGeometry(0.75, 20), new THREE.MeshBasicMaterial({ color: '#1a1d22', transparent: true, opacity: 0.3, side: THREE.DoubleSide })); tailR.position.set(-7.1, 1.0, 0.2); heli.add(tailR);
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), redM); beacon.position.set(-1.2, 0.95, 0); heli.add(beacon);
    heli.userData = { rotor, beacon };
  }
  // ---- the hero car and the explainer pieces that ride on it
  const car = trRoadster(scene);
  const blueM = new THREE.MeshStandardMaterial({ color: '#5aa8ff', emissive: new THREE.Color('#3d8fff'), emissiveIntensity: 1.6, roughness: 0.4, transparent: true, opacity: 1 });
  const ambM = new THREE.MeshStandardMaterial({ color: '#ffb066', emissive: new THREE.Color('#ff9a40'), emissiveIntensity: 1.6, roughness: 0.4, transparent: true, opacity: 1 });
  const press = new THREE.Group(); car.body.add(press);
  const outside = [], inside = [];
  // outside air: long blue arrows from beyond the roof, pointing at the car (its −y), and in from the sides
  for (let i = 0; i < 6; i++) for (const zz of [-0.45, 0.45]) {
    const a = trArrow(0.9, 0.04, blueM); a.position.set(-1.6 + i * 0.62, 2.25, zz); a.rotation.z = Math.PI; press.add(a); outside.push(a);
  }
  for (let i = 0; i < 3; i++) for (const sz of [-1, 1]) { const a = trArrow(0.6, 0.035, blueM); a.position.set(-1.2 + i * 1.2, 0.6, sz * 1.85); a.rotation.x = sz * Math.PI / 2; press.add(a); outside.push(a); }
  // under the floor: short amber arrows (the thinner air left there, still pushing a little)
  for (let i = 0; i < 4; i++) for (const zz of [-0.45, 0.45]) { const a = trArrow(0.17, 0.03, ambM); a.position.set(-1.2 + i * 0.8, 0.0, zz); press.add(a); inside.push(a); }
  press.visible = false;
  // the force arrow: weight (down, world) and the net push (into the ramp)
  // the compressed-air tanks (seen in the x-ray): two along the sills, one across behind the seats (≈ 530 L drawn;
  // Tesla says ≈ 600 L). Their glow is how full they are.
  const tankM = new THREE.MeshStandardMaterial({ color: '#9fc8ff', emissive: new THREE.Color('#4f9dff'), emissiveIntensity: 1.2, roughness: 0.35, metalness: 0.3 });
  const tanks = new THREE.Group(); car.body.add(tanks); tanks.visible = false;
  for (const sz of [-1, 1]) { const m = trCyl(0.16, 0.16, 2.2, tankM, -0.15, 0.42, sz * 0.78, tanks, 18); m.rotation.z = Math.PI / 2; }
  { const m = trCyl(0.2, 0.2, 1.4, tankM, -1.35, 0.55, 0, tanks, 18); m.rotation.x = Math.PI / 2; }
  // a passenger (the last section, x-ray): helmet on, belted in, facing forward
  LOOKS.trRider = Object.assign({}, LOOKS.rider, { shirt: '#e0782e', pants: '#e0782e', shoes: '#222', gloves: '#222', hat: { type: 'helmet', color: '#f2f0ea' } });
  const rider = new Person({ id: 'rider', look: 'trRider', states: [[0, 'sit']], seat: 0.33 }, scene);
  const riderL = new THREE.PointLight('#ffe2c0', 0, 3.5, 1.5); riderL.position.set(-0.2, 0.9, 0.9); car.body.add(riderL); rider.userData = { light: riderL };
  car.body.add(rider.root); rider.root.position.set(-0.5, 0, 0.36); rider.root.visible = false;
  const harnessM = new THREE.MeshStandardMaterial({ color: '#ffb066', emissive: new THREE.Color('#ff9a40'), emissiveIntensity: 1.4 });
  const harness = new THREE.Group(); car.body.add(harness); harness.visible = false;
  for (const sz of [-1, 1]) trBox(0.05, 0.62, 0.06, harnessM, -0.47, 0.72, 0.36 + sz * 0.12, harness).rotation.z = -0.25;
  trBox(0.05, 0.06, 0.4, harnessM, -0.28, 0.48, 0.36, harness);
  // the demo's route, drawn as a glowing tube (shown on "did": up the curl, along the ceiling, off, the landing)
  const routeM = new THREE.MeshStandardMaterial({ color: '#ffd7a8', emissive: new THREE.Color('#ff9a40'), emissiveIntensity: 2.4, transparent: true, opacity: 0.9, depthWrite: false });
  const routePts = [];
  for (let τ = 0.0; τ < TR_DEMO.tLand + 1.0; τ += 0.04) { const st = trDemo(τ); const up = st.up0.clone().applyAxisAngle(st.fwd, st.roll); routePts.push(st.c.clone().addScaledVector(up, 0.75)); }
  const routeG = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(routePts), 600, 0.12, 8, false);
  const route = new THREE.Mesh(routeG, routeM); route.visible = false; route.renderOrder = 3; scene.add(route);
  route.userData = { n: 600, radial: 8, pts: routePts };
  // world-space force arrows for the hover (weight, white, down; thrust, amber, up)
  const whiteM = new THREE.MeshStandardMaterial({ color: '#f4f0e8', emissive: new THREE.Color('#d8d4cc'), emissiveIntensity: 1.2 });
  const wArrow = trArrow(1, 0.07, whiteM), tArrow = trArrow(1, 0.07, ambM); wArrow.visible = tArrow.visible = false; scene.add(wArrow, tArrow);
  const puffs = trPuffs(scene, 7000);
  const sh = { car, heli, people, press, outside, inside, blueM, ambM, beams, pl1, tanks, tankM, rider, harness, route, wArrow, tArrow };

  return {
    scene, camera, sh,
    frame(t, shot, app) {
      const M = SITE_SHOTS[shot.mode];
      for (const p of people) trPose(p, t);
      heli.userData.rotor.rotation.y = t * 40; heli.userData.beacon.material = redM;
      heli.visible = shot.mode === 'heli' || shot.mode === 'hover';
      heli.position.set(TR_HELI.x + 0.25 * Math.sin(t * 0.7), TR_HELI.y + 0.18 * Math.sin(t * 1.1), TR_HELI.z + 0.2 * Math.sin(t * 0.5));
      car.setXray(0); car.inside(false); press.visible = false; car.fanSpin(t * 30, 0);
      tanks.visible = false; rider.root.visible = false; riderL.intensity = 0; harness.visible = false; route.visible = false; wArrow.visible = tArrow.visible = false; tankM.emissiveIntensity = 1.2;
      for (let i = 0; i < 10; i++) car.fire(i, 0);
      puffs.begin(camera);
      M.frame.call(this, t, shot, app, sh, puffs);
      puffs.end();
      // the shadow box follows the car
      const c = car.root.position;
      sun.position.set(c.x - 38, c.y + 46, c.z + 30); sun.target.position.copy(c); sun.target.updateMatrixWorld();
    },
    labels(t, shot, app) { const M = SITE_SHOTS[shot.mode]; return M.labels ? M.labels(t, shot, app, sh, camera) : []; },
    grade(t, p, shot) {
      p.saturation = 1.12; p.contrast = 1.12; p.warmth = 0.02; p.bloom = 0.4; p.bloomThreshold = 0.95; p.vignette = 0.58; p.blackLift = 0.01;
      const M = SITE_SHOTS[shot.mode]; if (M.grade) M.grade(t, p, shot);
    },
  };
};

// project a world point to the frame (0…1), or null if it is behind the camera / off frame
function trProj(cam, v) {
  const q = v.clone().project(cam);
  if (q.z > 1 || Math.abs(q.x) > 0.95 || Math.abs(q.y) > 0.95) return null;
  return { x: q.x * 0.5 + 0.5, y: 0.5 - q.y * 0.5 };
}
function trLab(out, cam, v, html, a) { if (a <= 0.01) return; const p = trProj(cam, v); if (p) out.push(Object.assign(p, { html, a })); }

// the jets of a car state: rear (launch), corner (roll / brake), fender (trim). k(t) is per group; where() follows
// the car (sampled at the particle's birth through state(tb))
function trCarJets(puffs, t, car, stateAt, groups, o = {}) {
  const dirs = [];
  for (let i = 0; i < 10; i++) {
    const n = car.nozzles[i], k = groups[n.kind + (n.kind === 'corner' ? (n.p.z > 0 ? 'L' : 'R') : '')] || groups[n.kind];
    if (!k) continue;
    car.fire(i, MathX.clamp(k(t), 0, 1));
    const tmp = { root: new THREE.Group() };
    trJet(puffs, t, o.t0 ?? (t - 2), t, k, (tb) => {
      const st = stateAt(tb);
      // the nozzle in world space at time tb (pose a scratch frame like the car)
      _trU.copy(st.up0).applyAxisAngle(st.fwd, st.roll);
      const X = st.fwd.clone().normalize(), Zv = new THREE.Vector3().crossVectors(X, st.up0).normalize(), Y = new THREE.Vector3().crossVectors(Zv, X);
      const m = new THREE.Matrix4().makeBasis(X, Y, Zv), q = new THREE.Quaternion().setFromRotationMatrix(m).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), st.roll));
      const foot = st.c.clone().addScaledVector(_trU, -TR_CG);
      const p = n.p.clone().applyQuaternion(q).add(foot), d = n.d.clone().applyQuaternion(q);
      return [p, d];
    }, Object.assign({ speed: 16, life: 0.75, size: 0.22, grow: 2.4, alpha: 0.42, dt: 1 / 110, seed: i + 1, floor: 0 }, o));
  }
}
