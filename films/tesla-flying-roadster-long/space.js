/* =====================================================================
   SET · SPACE — low orbit: Earth's limb with its blue atmosphere, stars, the Sun as a hard white light. A generic
   spacecraft (a capsule on a service module, two solar wings, four cold-gas thruster quads; no agency markings) and
   an astronaut on a spacewalk (white suit, gold visor, backpack; no flags or logos). Two shots (shot.mode):
     newton  TR.newton → TR.cold   "Throw something one way, and you get pushed the other. That's all a rocket is."
             the astronaut throws a heavy tool bag (THROW, amber): it flies off fast; they drift back slowly (PUSHED
             BACK, blue-white): the same push, ten times the mass, a tenth of the speed. On "rocket" the camera swings to
             the craft: one quad puffs gas one way (amber), the craft is pushed the other (blue-white).
     steer   TR.space2 → TR.nozzles   "Spacecraft use the same kind of thruster to steer." The craft above Earth: one
             pair of quads puffs to start it turning, the opposite pair puffs to stop it (COLD-GAS THRUSTERS).
   Real time throughout. Everything is a pure function of t.
   ===================================================================== */

const TR_SP = {
  C0: new THREE.Vector3(6.6, 0.5, -5.5),     // the craft's centre (axis along x, the capsule's nose at −x)
  tRel: () => trW(33, 'something').start + 0.2,       // the bag leaves the hand
  vBag: new THREE.Vector3(-1.25, 0.2, 0.28),          // m/s
  massRatio: 0.17,                                    // bag : astronaut (with suit)
  tGas: () => trW(33, 'rocket').start - 0.25,         // the newton shot's thruster puff
  tSwing: () => TR.newton + 2.6 + 0.05,               // (unused)
  f1: () => trW(34, 'use').start - 0.2,               // steer: start the turn
  f2: () => trW(34, 'thruster', 21).start + 0.15,         // steer: stop it
  RE: 2700, E: new THREE.Vector3(-800, -3100, -1800), // Earth
  sun: new THREE.Vector3(-0.45, 0.55, 0.7).normalize(),
};
// ∫ of a smoothstep from a to b, at t (seconds of full value)
function trSpI(t, a, b) { if (t <= a) return 0; const h = b - a, u = Math.min(1, (t - a) / h); return h * (u * u * u - 0.5 * u * u * u * u) + Math.max(0, t - b); }
const trSpPulse = (t, a, len) => MathX.smooth(t, a, a + 0.03) * (1 - MathX.smooth(t, a + len, a + len + 0.08));

// periodic value noise (tiles every px × py cells) for a seamless Earth texture
function trSpN(x, y, px, py) {
  const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), w = fy * fy * (3 - 2 * fy);
  const h = (a, b) => hash2(((a % px) + px) % px, ((b % py) + py) % py);
  return trLerp(trLerp(h(i, j), h(i + 1, j), u), trLerp(h(i, j + 1), h(i + 1, j + 1), u), w);
}
function trSpF(x, y, px, py, o) { let s = 0, a = 0.5, f = 1, n = 0; for (let k = 0; k < o; k++) { s += a * trSpN(x * f + k * 7, y * f + k * 3, px * f, py * f); n += a; a *= 0.5; f *= 2; } return s / n; }
function trSpEarthTex() {
  const W = 1024, H = 512, c = Tex.canvas(W, H), x = c.getContext('2d'), img = x.createImageData(W, H), D = img.data;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const u = i / W * 8, v = j / H * 4;
    const land = trSpF(u, v, 8, 4, 5), cl = trSpF(u * 2 + 0.35 * trSpN(u * 3, v * 3, 24, 12), v * 4, 16, 16, 5), streak = trSpF(u * 3, v * 9, 24, 36, 3);
    let r, g, b;
    if (land > 0.56) { const d = MathX.smooth(land, 0.56, 0.72), dry = trSpN(u * 2 + 5, v * 2, 16, 8); r = trLerp(70, 150, dry * d); g = trLerp(96, 128, dry * d); b = trLerp(52, 84, dry * d); }
    else { const deep = MathX.smooth(land, 0.56, 0.3); r = trLerp(28, 10, deep); g = trLerp(86, 42, deep); b = trLerp(140, 98, deep); }
    const ca = MathX.clamp(MathX.smooth(cl, 0.5, 0.72) * 0.9 + MathX.smooth(streak, 0.6, 0.78) * 0.45, 0, 0.95);
    const k = (j * W + i) * 4; D[k] = trLerp(r, 245, ca); D[k + 1] = trLerp(g, 248, ca); D[k + 2] = trLerp(b, 252, ca); D[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const t = Tex.tex(c, { repeat: true, srgb: true }); t.repeat.set(6, 3); return t;
}
function trSpPanelTex() {
  const c = Tex.canvas(256, 256), x = c.getContext('2d');
  x.fillStyle = '#0f1c3a'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const v = 22 + 18 * hash2(i, j); x.fillStyle = `rgb(${v},${v + 22},${v + 64})`; x.fillRect(i * 32 + 2, j * 32 + 2, 28, 28); }
  x.strokeStyle = 'rgba(190,200,220,0.5)'; x.lineWidth = 1; for (let k = 0; k <= 256; k += 32) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k, 256); x.stroke(); x.beginPath(); x.moveTo(0, k); x.lineTo(256, k); x.stroke(); }
  return Tex.tex(c, { repeat: true, srgb: true });
}
function trSpHullTex() {
  const c = Tex.canvas(512, 256), x = c.getContext('2d');
  x.fillStyle = '#d9dade'; x.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 4000; i++) { const v = 200 + Math.floor(hash1(i * 3 + 1) * 40); x.fillStyle = `rgba(${v},${v},${v + 4},0.35)`; x.fillRect(hash1(i * 7 + 2) * 512, hash1(i * 11 + 3) * 256, 3, 2); }
  x.strokeStyle = 'rgba(80,84,92,0.55)'; x.lineWidth = 2;
  for (let k = 0; k <= 512; k += 64) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k, 256); x.stroke(); }
  for (let k = 0; k <= 256; k += 85) { x.beginPath(); x.moveTo(0, k); x.lineTo(512, k); x.stroke(); }
  return Tex.tex(c, { repeat: true, srgb: true });
}

// the astronaut: a group whose origin is the middle of the torso, facing +z; arms and legs on pivots
function trSpAstronaut() {
  const g = new THREE.Group();
  const suit = new THREE.MeshStandardMaterial({ color: '#ebe8e1', roughness: 0.82 });
  const grey = new THREE.MeshStandardMaterial({ color: '#8f949c', roughness: 0.5, metalness: 0.4 });
  const dark = new THREE.MeshStandardMaterial({ color: '#2a2d33', roughness: 0.5, metalness: 0.3 });
  const visor = new THREE.MeshPhysicalMaterial({ color: '#e2b456', roughness: 0.22, metalness: 0.9, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 2.2, emissive: new THREE.Color('#5a3a0c'), emissiveIntensity: 0.9 });
  const add = (geo, m, x, y, z, p = g) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; p.add(o); return o; };
  add(new THREE.RoundedBoxGeometry(0.58, 0.68, 0.4, 3, 0.14), suit, 0, 0.02, 0);
  add(new THREE.RoundedBoxGeometry(0.48, 0.28, 0.36, 3, 0.11), suit, 0, -0.42, 0);
  add(new THREE.CylinderGeometry(0.25, 0.25, 0.06, 20), grey, 0, -0.26, 0);
  add(new THREE.RoundedBoxGeometry(0.3, 0.15, 0.1, 2, 0.03), grey, 0, 0.1, 0.23);
  for (let i = 0; i < 3; i++) add(new THREE.CylinderGeometry(0.018, 0.018, 0.03, 10), new THREE.MeshStandardMaterial({ color: ['#c9452f', '#e7b531', '#5d86d8'][i], emissive: new THREE.Color(['#c9452f', '#e7b531', '#5d86d8'][i]), emissiveIntensity: 0.6 }), -0.08 + i * 0.08, 0.12, 0.29).rotation.x = Math.PI / 2;
  // backpack (life support) with a grey lid
  add(new THREE.RoundedBoxGeometry(0.6, 0.76, 0.28, 3, 0.07), suit, 0, 0.06, -0.33);
  add(new THREE.RoundedBoxGeometry(0.5, 0.2, 0.06, 2, 0.02), grey, 0, 0.32, -0.48);
  // helmet: a white shell, a neck ring, a gold visor across the front
  const helm = new THREE.Group(); helm.position.set(0, 0.5, 0.03); g.add(helm);
  add(new THREE.SphereGeometry(0.235, 28, 18), suit, 0, 0, 0, helm);
  add(new THREE.SphereGeometry(0.241, 28, 18, Math.PI / 2 - 1.05, 2.1, 0.62, 1.2), visor, 0, 0, 0, helm);
  add(new THREE.TorusGeometry(0.2, 0.035, 10, 26), grey, 0, -0.17, 0, helm).rotation.x = Math.PI / 2;
  add(new THREE.BoxGeometry(0.05, 0.03, 0.05), dark, 0.17, 0.12, 0.12, helm);
  // limbs: capsules on pivots
  const limb = (x, y, r1, l1, r2, l2, foot) => {
    const a = new THREE.Group(); a.position.set(x, y, 0); g.add(a);
    add(new THREE.CapsuleGeometry(r1, l1, 4, 12), suit, 0, -l1 / 2 - 0.02, 0, a);
    add(new THREE.TorusGeometry(r1 * 0.98, 0.016, 6, 16), grey, 0, -l1 - 0.06, 0, a).rotation.x = Math.PI / 2;
    const b = new THREE.Group(); b.position.y = -l1 - 0.1; a.add(b);
    add(new THREE.CapsuleGeometry(r2, l2, 4, 12), suit, 0, -l2 / 2 - 0.02, 0, b);
    const e = new THREE.Group(); e.position.y = -l2 - 0.12; b.add(e);
    if (foot) add(new THREE.RoundedBoxGeometry(0.15, 0.12, 0.27, 2, 0.04), suit, 0, -0.02, 0.05, e);
    else { add(new THREE.CylinderGeometry(r2 * 1.1, r2 * 1.1, 0.04, 14), grey, 0, 0.03, 0, e); add(new THREE.RoundedBoxGeometry(0.1, 0.14, 0.085, 2, 0.035), grey, 0, -0.06, 0, e); }
    return { a, b, e };
  };
  const armR = limb(-0.38, 0.22, 0.085, 0.2, 0.078, 0.18, false), armL = limb(0.38, 0.22, 0.085, 0.2, 0.078, 0.18, false);
  const legR = limb(-0.13, -0.5, 0.1, 0.26, 0.09, 0.26, true), legL = limb(0.13, -0.5, 0.1, 0.26, 0.09, 0.26, true);
  return { g, armR, armL, legR, legL };
}

// the spacecraft: axis along x, the capsule's nose at −x; returns its group and the thruster quads
function trSpCraft() {
  const g = new THREE.Group();
  const hull = new THREE.MeshStandardMaterial({ map: trSpHullTex(), roughness: 0.55, metalness: 0.25 });
  const capM = new THREE.MeshStandardMaterial({ color: '#e9e9ec', roughness: 0.45, metalness: 0.1 });
  const shieldM = new THREE.MeshStandardMaterial({ color: '#5a4636', roughness: 0.8 });
  const foil = new THREE.MeshStandardMaterial({ color: '#c79a4a', roughness: 0.32, metalness: 0.85 });
  const dark = new THREE.MeshStandardMaterial({ color: '#2a2c31', roughness: 0.4, metalness: 0.8 });
  const panelM = new THREE.MeshStandardMaterial({ map: trSpPanelTex(), roughness: 0.32, metalness: 0.55, side: THREE.DoubleSide });
  const X = (geo) => { geo.rotateZ(Math.PI / 2); return geo; };       // a cylinder's axis to −x (its top end to −x)
  const add = (geo, m, x, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  add(X(new THREE.CylinderGeometry(0.78, 1.9, 2.2, 40)), capM, -1.5);
  add(X(new THREE.CylinderGeometry(1.96, 1.96, 0.14, 40)), shieldM, -0.36);
  add(X(new THREE.CylinderGeometry(0.5, 0.6, 0.32, 24)), dark, -2.74);
  add(new THREE.TorusGeometry(0.52, 0.05, 8, 28), dark, -2.92).rotation.y = Math.PI / 2;
  for (const [y, z] of [[0.25, 1.0], [-0.15, 1.04]]) { const w = add(new THREE.BoxGeometry(0.28, 0.24, 0.05), new THREE.MeshPhysicalMaterial({ color: '#0d1420', roughness: 0.05, metalness: 0.6, clearcoat: 1 }), -1.55, y, z * 1.3); w.lookAt(new THREE.Vector3(-1.2, y * 4, 6)); }
  add(X(new THREE.CylinderGeometry(1.9, 1.9, 2.9, 40)), hull, 1.1);
  add(X(new THREE.CylinderGeometry(1.93, 1.93, 0.55, 40)), foil, 2.25);
  add(X(new THREE.CylinderGeometry(1.75, 1.9, 0.2, 40)), dark, 2.65);
  add(X(new THREE.CylinderGeometry(0.4, 0.95, 1.2, 28, 1, true)), dark, 3.35).material = new THREE.MeshStandardMaterial({ color: '#3a3c42', roughness: 0.3, metalness: 0.9, side: THREE.DoubleSide });
  // solar wings, up and down
  for (const sy of [1, -1]) {
    add(new THREE.BoxGeometry(0.12, 0.7, 0.12), dark, 1.4, sy * 2.2, 0);
    for (let k = 0; k < 2; k++) {
      const p = add(new THREE.BoxGeometry(1.5, 1.35, 0.04), panelM, 1.4, sy * (3.3 + k * 1.45), 0);
      p.material = panelM; p.geometry.attributes.uv && 0;
      add(new THREE.BoxGeometry(1.56, 0.05, 0.06), dark, 1.4, sy * (3.3 + k * 1.45 + 0.7), 0);
    }
  }
  // thruster quads on short stand-offs, at 45°, 135°, 225°, 315° around the forward end of the service module
  const quads = [];
  const bellM = new THREE.MeshStandardMaterial({ color: '#2a2c30', roughness: 0.35, metalness: 0.9 });
  for (const ph of [45, 135, 225, 315]) {
    const a = MathX.deg(ph), n = new THREE.Vector3(0, Math.cos(a), Math.sin(a)), tt = new THREE.Vector3(0, -Math.sin(a), Math.cos(a));
    const P = new THREE.Vector3(0.55, 0, 0).addScaledVector(n, 2.12);
    const blk = add(new THREE.BoxGeometry(0.34, 0.22, 0.34), new THREE.MeshStandardMaterial({ color: '#b9bcc2', roughness: 0.45, metalness: 0.5 }), P.x, P.y, P.z);
    blk.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
    const st = add(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 10), dark, 0.55, 0, 0); st.position.copy(new THREE.Vector3(0.55, 0, 0).addScaledVector(n, 1.94)); st.quaternion.copy(blk.quaternion);
    const nz = [];
    for (const d of [new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0), tt.clone(), tt.clone().negate()]) {
      const glowM = new THREE.MeshStandardMaterial({ color: '#cfe6ff', emissive: new THREE.Color('#bfe2ff'), emissiveIntensity: 0, roughness: 0.3 });
      const q = new THREE.Group(); q.position.copy(P).addScaledVector(d, 0.2); q.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), d); g.add(q);
      const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.035, 0.1, 12, 1, true), bellM); q.add(bell);
      const th = new THREE.Mesh(new THREE.CircleGeometry(0.05, 12), glowM); th.rotation.x = Math.PI / 2; th.position.y = -0.03; q.add(th);
      nz.push({ p: P.clone().addScaledVector(d, 0.26), d: d.clone(), glowM });
    }
    quads.push({ ph, n, nz });
  }
  return { g, quads };
}

TR_SET_BUILDERS.space = (app) => {
  const SP = TR_SP, sunP = SP.sun.clone().multiplyScalar(200);
  const S = trSet(app, { sky: '#010205', fov: 40, near: 0.05, far: 40000, sun: [sunP.x, sunP.y, sunP.z], sunColor: '#fff4e6', sunI: 3.4,
    hemi: ['#2a3a5a', '#05070a', 0.18], env: ['#04060c', '#3a5f96', '#1a2c4c'] });
  const { scene, camera } = S;
  scene.environmentIntensity = 0.9;
  // earthshine: a soft blue light from below
  { const es = new THREE.DirectionalLight('#7aa2dc', 0.55); es.position.set(-30, -100, -60); scene.add(es); }
  // ---- stars
  {
    const N = 2600, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const u = trR(i, 41) * 2 - 1, a = trR(i, 42) * Math.PI * 2, r = Math.sqrt(1 - u * u), d = 18000;
      pos.set([Math.cos(a) * r * d, u * d, Math.sin(a) * r * d], i * 3);
      const b = 0.25 + 0.75 * Math.pow(trR(i, 43), 3), w = trR(i, 44);
      col.set([b * (w < 0.2 ? 1.0 : 0.85), b * 0.9, b * (w > 0.8 ? 1.0 : 0.85)], i * 3);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, fog: false, depthWrite: false })); pts.renderOrder = -5; scene.add(pts);
  }
  // ---- Earth: a textured sphere (it turns slowly beneath us), an inner haze and an outer glow at the limb
  const earth = new THREE.Group(); earth.position.copy(SP.E); scene.add(earth);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(SP.RE, 128, 64), new THREE.MeshStandardMaterial({ map: trSpEarthTex(), roughness: 0.85, metalness: 0 }));
  ball.rotation.set(0.4, 0, 0.2); earth.add(ball);
  const atmo = (r, side, frag) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 96, 48), new THREE.ShaderMaterial({
      side, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { sunDir: { value: SP.sun } },
      vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vW = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform vec3 sunDir; varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ float d = dot(normalize(vN), normalize(vV)); float sl = clamp(dot(normalize(vW), sunDir) * 1.3 + 0.35, 0.0, 1.0); ' + frag + ' }',
    }));
    earth.add(m); return m;
  };
  atmo(SP.RE * 1.003, THREE.FrontSide, 'float f = pow(1.0 - max(d, 0.0), 2.5); gl_FragColor = vec4(vec3(0.32, 0.6, 1.0) * f * 1.6 * sl, 1.0);');
  atmo(SP.RE * 1.035, THREE.BackSide, 'float k = smoothstep(0.0, 0.42, -d); float f = pow(k, 1.6); gl_FragColor = vec4(mix(vec3(0.2, 0.5, 1.0), vec3(0.7, 0.86, 1.0), f) * f * 2.4 * sl, 1.0);');
  // ---- the craft and the astronaut and the bag
  const craft = trSpCraft(); scene.add(craft.g);
  const astro = trSpAstronaut(); scene.add(astro.g);
  const bag = new THREE.Group(); scene.add(bag);
  {
    const bm = new THREE.MeshStandardMaterial({ color: '#7f848c', roughness: 0.7 }), sm = new THREE.MeshStandardMaterial({ color: '#2a2d33', roughness: 0.6 });
    const b = new THREE.Mesh(new THREE.RoundedBoxGeometry(0.42, 0.26, 0.26, 3, 0.06), bm); b.castShadow = true; bag.add(b);
    for (const x of [-0.12, 0.12]) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.27, 0.27), sm); s.position.x = x; bag.add(s); }
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.014, 6, 14, Math.PI), sm); h.position.y = 0.13; bag.add(h);
    const tag = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.005), new THREE.MeshStandardMaterial({ color: '#e7b531', roughness: 0.5 })); tag.position.set(0.0, 0.0, 0.135); bag.add(tag);
  }
  // ---- arrows: amber (the throw / the gas), blue-white (the push back)
  const ambM = new THREE.MeshStandardMaterial({ color: '#ffb066', emissive: new THREE.Color('#ff9a40'), emissiveIntensity: 2.4, transparent: true });
  const bluM = new THREE.MeshStandardMaterial({ color: '#dceeff', emissive: new THREE.Color('#6ab4ff'), emissiveIntensity: 2.0, transparent: true });
  const ambM2 = ambM.clone(), bluM2 = bluM.clone();
  const aThrow = trArrow(1, 0.035, ambM), aBack = trArrow(1, 0.035, bluM), aGas = trArrow(1, 0.07, ambM2), aCraft = trArrow(1, 0.07, bluM2);
  scene.add(aThrow, aBack, aGas, aCraft);
  const Y = new THREE.Vector3(0, 1, 0);
  const showArrow = (A, from, dir, L, a, M) => { A.visible = a > 0.01; A.position.copy(from); A.quaternion.setFromUnitVectors(Y, dir.clone().normalize()); A.scale.set(1, Math.max(0.01, L), 1); M.opacity = a; };
  const puffs = trPuffs(scene, 3000);
  const L = {};   // label anchors

  // the astronaut's pose at time t (the throw), and the root's drift
  const relT = SP.tRel(), vAst = SP.vBag.clone().multiplyScalar(-SP.massRatio);
  function poseAstro(t) {
    const w = MathX.smooth(t, TR.newton - 0.1, relT - 0.32), sw = MathX.smooth(t, relT - 0.3, relT + 0.02), fol = MathX.smooth(t, relT, relT + 0.8);
    const R = astro.armR, Lf = astro.armL;
    // right arm: wind back, swing forward and out to the side, follow through and relax
    R.a.rotation.set(trLerp(trLerp(0.2, 1.4, w), -1.5, sw) * (1 - 0.45 * fol), 0, trLerp(trLerp(-0.25, -0.35, w), -1.0, sw) * (1 - 0.3 * fol));
    R.b.rotation.set(trLerp(trLerp(-0.4, -1.4, w), -0.15, sw) - 0.4 * fol, 0, 0);
    Lf.a.rotation.set(trLerp(-0.3, 0.5, sw) + 0.05 * Math.sin(t * 0.9), 0, trLerp(0.45, 0.7, sw));
    Lf.b.rotation.set(-0.6, 0, 0);
    astro.legR.a.rotation.set(-0.35 + 0.1 * sw, 0, -0.08); astro.legR.b.rotation.set(0.55, 0, 0);
    astro.legL.a.rotation.set(-0.1 - 0.15 * sw, 0, 0.1); astro.legL.b.rotation.set(0.3 + 0.2 * sw, 0, 0);
    // the body: twists into the throw; afterwards drifts back (the recoil) and turns slowly
    const drift = trSpI(t, relT - 0.25, relT + 0.05);
    astro.g.position.set(vAst.x * drift, vAst.y * drift + 0.03 * Math.sin(t * 0.7), vAst.z * drift);
    astro.g.rotation.set(0.08 * Math.sin(t * 0.5) - 0.06 * drift, -0.55 + 0.3 * w - 0.55 * sw + 0.05 * drift, 0.05 + 0.04 * drift);
    astro.g.updateMatrixWorld(true);
  }
  const _h = new THREE.Vector3();
  const handPos = (out) => out.set(0, -0.08, 0).applyMatrix4(astro.armR.e.matrixWorld);
  // the craft's pose: newton — drifts +x after the puff; steer — turns (yaw) between the two puffs
  function craftAt(t, mode, m = new THREE.Matrix4()) {
    const p = SP.C0.clone(), q = new THREE.Quaternion();
    if (mode === 'newton') { p.x += 0.35 * trSpI(t, SP.tGas(), SP.tGas() + 0.4); q.setFromEuler(new THREE.Euler(0.02, -0.12, 0.03)); }
    else {
      const ω = 0.42, th = ω * (trSpI(t, SP.f1(), SP.f1() + 0.35) - trSpI(t, SP.f2(), SP.f2() + 0.35));
      q.setFromEuler(new THREE.Euler(0.06 + 0.01 * t % 1 * 0, -0.25 + th, 0.1 + 0.02 * Math.sin(t * 0.4), 'YXZ'));
    }
    return m.compose(p, q, new THREE.Vector3(1, 1, 1));
  }
  // jets from a list of [quad, nozzle] while k(tb) > 0
  const _m = new THREE.Matrix4();
  function jets(t, mode, list, k, seed) {
    for (const [qi, ni] of list) {
      const nz = craft.quads[qi].nz[ni];
      nz.glowM.emissiveIntensity = 7 * k(t);
      trJet(puffs, t, t - 1.2, t, k, (tb) => { craftAt(tb, mode, _m); return [nz.p.clone().applyMatrix4(_m), nz.d.clone().transformDirection(_m)]; },
        { speed: 10, life: 1.0, size: 0.13, grow: 1.7, spread: 0.2, rise: 0, alpha: 0.55, dt: 1 / 120, tau: 0.3, seed: seed + qi * 4 + ni });
    }
  }

  return {
    scene, camera,
    frame(t, shot) {
      const mode = shot.mode;
      earth.rotation.y = 0;
      ball.rotation.y = t * 0.0009;
      craftAt(t, mode, craft.g.matrix); craft.g.matrixAutoUpdate = false; craft.g.matrixWorldNeedsUpdate = true; craft.g.updateMatrixWorld(true);
      for (const Q of craft.quads) for (const n of Q.nz) n.glowM.emissiveIntensity = 0;
      puffs.begin();
      astro.g.visible = bag.visible = mode === 'newton';
      for (const A of [aThrow, aBack, aGas, aCraft]) A.visible = false;
      const cam = camera;
      if (mode === 'newton') {
        // the bag: in the hand until the release, then off at a steady speed, tumbling
        poseAstro(relT); handPos(_h); const rel = _h.clone();
        poseAstro(t);
        if (t < relT) { handPos(bag.position); bag.position.y -= 0.08; bag.rotation.set(0.3, astro.g.rotation.y, 0.2); }
        else { const u = t - relT; bag.position.copy(rel).addScaledVector(SP.vBag, u); bag.position.y -= 0.08; bag.rotation.set(0.3 + 1.1 * u, astro.g.rotation.y + 0.6 * u, 0.2 + 0.5 * u); }
        // the arrows: the throw on the bag, the push back on the astronaut
        const dB = SP.vBag.clone().normalize(), dA = vAst.clone().normalize();
        const aT = MathX.smooth(t, relT - 0.05, relT + 0.2) * (1 - MathX.smooth(t, TR_SP.tGas() - 0.9, TR_SP.tGas() - 0.5));
        const pushed = trW(33, 'pushed').start;
        const aP = MathX.smooth(t, pushed - 0.15, pushed + 0.15) * (1 - MathX.smooth(t, TR_SP.tGas() - 0.9, TR_SP.tGas() - 0.5));
        const fromB = bag.position.clone().addScaledVector(dB, 0.3), fromA = astro.g.position.clone().add(new THREE.Vector3(0.45, 0.05, -0.1));
        showArrow(aThrow, fromB, dB, 0.95 * MathX.smooth(t, relT - 0.05, relT + 0.25), aT, ambM);
        showArrow(aBack, fromA, dA, 0.95 * MathX.smooth(t, pushed - 0.15, pushed + 0.25), aP, bluM);
        L.thr = fromB.clone().addScaledVector(dB, 0.5).add(new THREE.Vector3(0, 0.22, 0)); L.aT = aT;
        L.back = astro.g.position.clone().add(new THREE.Vector3(0.15, 1.05, 0)); L.aP = aP;
        // the rocket: the near quads puff gas toward the capsule end (−x); the craft is pushed +x
        const tg = SP.tGas(), kG = (tb) => 0.9 * trSpPulse(tb, tg, 0.45) + 0.7 * trSpPulse(tb, tg + 0.75, 0.3);
        jets(t, mode, [[0, 1], [1, 1]], kG, 11);
        const aG = MathX.smooth(t, tg - 0.05, tg + 0.2);
        const q0 = craft.quads[0].nz[1].p.clone().applyMatrix4(craft.g.matrix), cE = new THREE.Vector3(3.95, 0, 0).applyMatrix4(craft.g.matrix);
        showArrow(aGas, q0.clone().add(new THREE.Vector3(-0.8, 0.0, 0.3)), new THREE.Vector3(-1, 0, 0), 1.9 * MathX.smooth(t, tg - 0.05, tg + 0.3), aG, ambM2);
        showArrow(aCraft, cE.clone().add(new THREE.Vector3(0.25, 0, 0)), new THREE.Vector3(1, 0, 0), 1.9 * MathX.smooth(t, tg + 0.1, tg + 0.45), aG, bluM2);
        L.gas = q0.clone().add(new THREE.Vector3(-2.2, 0.75, 0.3)); L.craft = cE.clone().add(new THREE.Vector3(0.3, 0.75, 0)); L.aG = aG;
        // the camera: on the astronaut through the throw, then it swings out and round to the craft
        const k1 = trK(t, TR.newton, tg - 0.6), k2 = trK(t, tg - 0.75, TR.cold + 0.1, Ease.inOutSine);
        const P1 = trV([-0.5, 0.45, 5.8], [-0.8, 0.4, 6.2], k1), A1 = trV([-0.6, 0.1, 0], [-0.85, 0.05, 0], k1);
        const P2 = [3.0, 1.6, 11.5], A2 = [5.7, 0.2, -4.2];
        trCamD(cam, trV(P1, P2, k2), trV(A1, A2, k2), trLerp(40, 40, k2), t, 0.6);
      } else {
        const f1 = SP.f1(), f2 = SP.f2();
        // start the turn: the near quads' forward nozzles puff (+x) and the far quads' aft ones; stop it: the reverse
        jets(t, mode, [[0, 0], [1, 0]], (tb) => trSpPulse(tb, f1, 0.32), 21);
        jets(t, mode, [[2, 1], [3, 1]], (tb) => trSpPulse(tb, f1, 0.32), 31);
        jets(t, mode, [[0, 1], [1, 1]], (tb) => trSpPulse(tb, f2, 0.32), 41);
        jets(t, mode, [[2, 0], [3, 0]], (tb) => trSpPulse(tb, f2, 0.32), 51);
        L.quad = craft.quads[0].nz[0].p.clone().add(new THREE.Vector3(1.2, 1.4, 0.6)).applyMatrix4(craft.g.matrix);
        const k = trK(t, TR.space2, TR.nozzles, Ease.inOutSine), C = SP.C0;
        trCamD(cam, [C.x + trLerp(-8.0, -4.4, k), C.y + trLerp(4.2, 3.4, k), C.z + trLerp(20.5, 19.5, k)], [C.x + trLerp(0.6, 1.0, k), C.y + 0.9, C.z], 40, t, 0.8);
      }
      puffs.end();
    },
    labels(t, shot) {
      const out = [];
      if (shot.mode === 'newton') {
        trLab(out, camera, L.thr, '<span class="d"></span>THROW<small>LIGHT BAG · FAST</small>', L.aT);
        trLab(out, camera, L.back, '<span class="d" style="background:#6ab4ff;box-shadow:0 0 0 calc(var(--u) * 3) #dceeff"></span>PUSHED BACK<small>HEAVY ASTRONAUT · SLOW</small>', L.aP);
        trLab(out, camera, L.gas, '<span class="d"></span>GAS THROWN OUT', L.aG);
        trLab(out, camera, L.craft, '<span class="d" style="background:#6ab4ff;box-shadow:0 0 0 calc(var(--u) * 3) #dceeff"></span>CRAFT PUSHED', L.aG * MathX.smooth(t, SP.tGas() + 0.2, SP.tGas() + 0.5));
      } else {
        trLab(out, camera, L.quad, '<span class="d"></span>COLD-GAS THRUSTERS<small>SHORT PUFFS TURN THE CRAFT</small>', MathX.smooth(t, SP.f1() - 0.1, SP.f1() + 0.3));
      }
      return out;
    },
    grade(t, p) { p.saturation = 1.08; p.contrast = 1.14; p.warmth = -0.02; p.bloom = 0.4; p.bloomThreshold = 0.95; p.vignette = 0.55; p.blackLift = 0.0; },
  };
};
