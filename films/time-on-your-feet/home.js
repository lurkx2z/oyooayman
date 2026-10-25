/* =====================================================================
   HOME — your hallway on an ordinary morning (7:00), and everything the film does there. One set, many shots:
     title    the hallway under the title             hall     you walk up to the pole and its two clocks
     pole     feet clock, head clock: they start       drift    they drift apart (the last digits)
     yes      your feet                                year     a year, sped up: days flick by, the seasons turn
                                                                outside the window (then a whole lifetime)
     cat      your cat, asleep in the sun              lie      the pole lies down: both clocks level
     hand     the pole stands on its head              upstairs up the stairs to the landing
     why      gravity: little lights tick slower near the floor; a ball falls towards slower time (exaggerated)
     maths    (the HUD's equation over the hallway)    pull     your feet on the floor
     bigger   the front door opens onto white light    real     the hallway again
     home     your feet and the clocks, since the video started
     bunk     upstairs: the bunk bed (the question)
   Layout (metres): the hall runs along z (front door at z = −6, kitchen doorway at z = 2.6), 2.2 m wide (x ±1.1), the
   stairs up the left wall to a landing over the door, the window in the right wall. The morning sun comes in low
   through the window. You stand at TF_HOME.you facing the door; the bunk room is built off to the side (x = 30).
   ===================================================================== */

const TF_HOME = { you: [0.3, 0, 0.35], room: [30, 2.8, 0] };

// ---- textures ---------------------------------------------------------------------------------------------------------
function tfFloorCanvas() {
  // oak boards 0.2 m wide, staggered ends; the canvas is 1.6 m × 1.6 m of floor (8 boards)
  const W = 2048, P = W / 8, r = new RNG(CONFIG.seed + 301);
  return tfCanvas(W, W, (g) => {
    const planks = [0, 1, 2, 3, 4].map((k) => tfWoodCanvas(CONFIG.seed + 310 + k, 256, 1024, [176, 128, 84]));
    for (let i = 0; i < 8; i++) {
      let y = -r.range(0, W * 0.7);
      while (y < W) {
        const L = r.range(0.45, 0.9) * W, c = planks[r.int(0, 4)];
        g.drawImage(c, i * P, y, P, L);
        g.fillStyle = `rgba(${r.next() < 0.5 ? '255,235,210' : '40,24,12'},${r.range(0.02, 0.07)})`; g.fillRect(i * P, y, P, L);
        g.fillStyle = 'rgba(30,18,10,0.55)'; g.fillRect(i * P, y, P, 3);
        y += L;
      }
      g.fillStyle = 'rgba(30,18,10,0.6)'; g.fillRect(i * P, 0, 3, W);
    }
  });
}
function tfPaintCanvas(base) {
  return tfCanvas(512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6000; i++) { const v = hash1(i * 17 + 3); g.fillStyle = `rgba(${v > 0.5 ? 255 : 0},${v > 0.5 ? 255 : 0},${v > 0.5 ? 255 : 0},0.025)`; g.fillRect(hash1(i * 5 + 1) * w, hash1(i * 11 + 7) * h, 3, 3); }
  });
}
function tfRugCanvas() {
  return tfCanvas(512, 2048, (g, w, h) => {
    g.fillStyle = '#7b2b23'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#d8c39a'; g.lineWidth = 10; g.strokeRect(22, 22, w - 44, h - 44);
    g.fillStyle = '#26334d'; g.fillRect(48, 48, w - 96, h - 96);
    g.fillStyle = '#7b2b23'; g.fillRect(70, 70, w - 140, h - 140);
    for (let k = 0; k < 7; k++) {
      const cy = 200 + k * 275, cx = w / 2;
      g.save(); g.translate(cx, cy); g.rotate(Math.PI / 4);
      g.fillStyle = '#d8c39a'; g.fillRect(-90, -90, 180, 180); g.fillStyle = '#26334d'; g.fillRect(-66, -66, 132, 132); g.fillStyle = '#c9762f'; g.fillRect(-36, -36, 72, 72);
      g.restore();
    }
    for (let i = 0; i < 30000; i++) { g.fillStyle = `rgba(0,0,0,${hash1(i * 7) * 0.12})`; g.fillRect(hash1(i * 3 + 1) * w, hash1(i * 13 + 2) * h, 2, 2); }
  });
}
// the garden through the window: sky, a fence, a lawn, a tree (its crown is coloured by the season in the shader)
function tfGardenCanvas() {
  return tfCanvas(1024, 768, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    // R: the lawn and fence (lit), G: the crown's mask, B: the trunk and branches
    g.fillStyle = 'rgb(255,0,0)'; g.fillRect(0, h * 0.62, w, h * 0.38);
    for (let x = 0; x < w; x += 46) { g.fillStyle = 'rgb(200,0,0)'; g.fillRect(x, h * 0.48, 38, h * 0.16); }
    g.fillStyle = 'rgb(0,0,255)'; g.fillRect(w * 0.6, h * 0.25, 26, h * 0.42);
    g.lineCap = 'round'; g.strokeStyle = 'rgb(0,0,255)';
    for (const [x0, y0, x1, y1, lw] of [[0.61, 0.42, 0.5, 0.22, 12], [0.62, 0.38, 0.75, 0.18, 12], [0.61, 0.3, 0.6, 0.08, 10], [0.55, 0.3, 0.45, 0.28, 7], [0.7, 0.26, 0.82, 0.3, 7]]) { g.lineWidth = lw; g.beginPath(); g.moveTo(x0 * w, y0 * h); g.lineTo(x1 * w, y1 * h); g.stroke(); }
    const r = new RNG(CONFIG.seed + 333);
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 900; i++) { const a = r.range(0, 6.28), rr = Math.sqrt(r.next()) * 0.2; const x = (0.61 + Math.cos(a) * rr * 1.1) * w, y = (0.2 + Math.sin(a) * rr * 0.8) * h; const gr = g.createRadialGradient(x, y, 0, x, y, 22); gr.addColorStop(0, 'rgba(0,90,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - 22, y - 22, 44, 44); }
  });
}

TF_SETS.home = (app) => {
  const S = tfSet(app, { sky: '#bcd0e6', hemi: ['#d7e2ef', '#8a6f52', 0.5], sun: [6, 3.2, -2.5], sunColor: '#ffe2b8', sunI: 3.2, shadow: 2048, shadowR: 5, shadowFar: 30, fov: 55, near: 0.02, far: 200,
    env: ['#9aa6b5', '#8a7766', '#3e3226'] });
  const { scene, camera: cam, sun, hemi } = S;
  sun.shadow.camera.left = -4; sun.shadow.camera.right = 4; sun.shadow.camera.top = 5; sun.shadow.camera.bottom = -5; sun.shadow.camera.updateProjectionMatrix();
  const SUNAT = [0.2, 0, -2.3]; sun.target.position.set(...SUNAT);
  const amb = new THREE.AmbientLight('#fff4e6', 0.1); scene.add(amb);
  // the sunlight off the floor (a warm bounce), and the light on the landing upstairs
  const bounce = new THREE.PointLight('#ffd2a0', 0, 5, 2); bounce.position.set(0.25, 0.35, -2.2); scene.add(bounce);
  const landL = new THREE.PointLight('#ffcf98', 0, 6, 2); landL.position.set(-0.55, 4.3, -5.3); scene.add(landL);
  const W = tfWin, K = tfK;

  // ---- materials
  const floorTex = tfTex(tfFloorCanvas()); floorTex.repeat.set(2.2 / 1.6, 8.6 / 1.6);
  const floorM = tfStd('#ffffff', 0.55, 0, { map: floorTex });
  const wallTex = tfTex(tfPaintCanvas('#ffffff')); wallTex.repeat.set(3, 2);
  const wallM = tfStd('#dccfba', 0.9, 0, { map: wallTex }), ceilM = tfStd('#e8e2d6', 0.95, 0);
  const whiteM = tfStd('#f4f1ea', 0.5, 0), oakM = tfStd('#ffffff', 0.5, 0, { map: tfTex(tfWoodCanvas(CONFIG.seed + 320, 256, 1024, [120, 78, 44])) });
  const brassM = tfStd('#b79358', 0.3, 0.9), darkM = tfStd('#2b2a28', 0.6, 0.1);
  const B = (w, h, d, m, x, y, z) => tfBox(w, h, d, m, x, y, z);

  // ---- floor, ceiling, walls (the right wall is built round the window opening, so the sun comes in through it)
  const floor = tfMesh(new THREE.PlaneGeometry(2.2, 8.6).rotateX(-Math.PI / 2), floorM, 0, 0, -1.7);
  floor.castShadow = false;
  B(0.1, 5.4, 8.6, wallM, -1.15, 2.7, -1.7);                                   // left wall (both floors)
  const WX = 1.15, WZ0 = -3.35, WZ1 = -1.95, WY0 = 0.45, WY1 = 2.15;          // the window opening (a tall one: the sun reaches the floor)
  B(0.1, 2.8, 2.6 - WZ1, wallM, WX, 1.4, (2.6 + WZ1) / 2);
  B(0.1, 2.8, WZ0 + 6, wallM, WX, 1.4, (WZ0 - 6) / 2);
  B(0.1, WY0, WZ1 - WZ0, wallM, WX, WY0 / 2, (WZ0 + WZ1) / 2);
  B(0.1, 2.8 - WY1, WZ1 - WZ0, wallM, WX, (2.8 + WY1) / 2, (WZ0 + WZ1) / 2);
  B(0.1, 2.6, 8.6, wallM, WX, 4.1, -1.7);                                      // right wall upstairs
  // front wall with the door opening (x ±0.46, up to 2.06), back wall with the kitchen doorway (x 0.1 … 0.95)
  B(0.64, 2.8, 0.12, wallM, -0.78, 1.4, -6); B(0.64, 2.8, 0.12, wallM, 0.78, 1.4, -6); B(0.92, 0.74, 0.12, wallM, 0, 2.43, -6);
  B(1.2, 2.8, 0.12, wallM, -0.5, 1.4, 2.6); B(0.15, 2.8, 0.12, wallM, 1.05, 1.4, 2.6); B(0.85, 0.7, 0.12, wallM, 0.525, 2.45, 2.6);
  B(2.2, 2.6, 0.12, wallM, 0, 4.1, -6);                                        // front wall upstairs
  // the ceiling, with the stairwell opening (x −1.1 … −0.2, z −4.4 … −0.8)
  B(2.2, 0.25, 3.4, ceilM, 0, 2.675, 0.9); B(2.2, 0.25, 1.6, ceilM, 0, 2.675, -5.2); B(1.3, 0.25, 3.6, ceilM, 0.45, 2.675, -2.6);
  B(2.2, 0.1, 8.6, ceilM, 0, 5.35, -1.7);                                      // the upstairs ceiling
  const kitchenM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.1, 0.92, 0.7) });
  tfMesh(new THREE.PlaneGeometry(0.85, 2.1), kitchenM, 0.525, 1.05, 2.7).rotation.y = Math.PI;
  // skirting boards
  B(0.02, 0.12, 8.6, whiteM, -1.09, 0.06, -1.7); B(0.02, 0.12, 2.6 - WZ1 + 3.5, whiteM, 1.09, 0.06, -1.7);
  // white panelling up to the dado rail (0.95 m), the paint above it
  const panelM = tfStd('#ece6da', 0.6, 0);
  B(0.018, 0.95, 8.6, panelM, -1.09, 0.475, -1.7); B(0.04, 0.04, 8.6, whiteM, -1.08, 0.95, -1.7);
  for (const [z0, z1] of [[WZ1, 2.6], [-6, WZ0]]) { B(0.018, 0.95, z1 - z0, panelM, 1.09, 0.475, (z0 + z1) / 2); B(0.04, 0.04, z1 - z0, whiteM, 1.08, 0.95, (z0 + z1) / 2); }
  for (let z = -5.7; z < 2.4; z += 0.6) { B(0.012, 0.6, 0.02, whiteM, -1.075, 0.5, z); if (z > WZ1 + 0.1 || z < WZ0 - 0.1) B(0.012, 0.6, 0.02, whiteM, 1.075, 0.5, z); }

  // ---- the front door: white panels, a frosted glass pane (the morning outside), a brass handle; it can swing open
  const doorPivot = new THREE.Group(); doorPivot.position.set(-0.45, 0, -5.98); scene.add(doorPivot);
  const doorM = tfStd('#f2efe8', 0.45, 0);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.05, 0.05), doorM); door.position.set(0.45, 1.025, 0); door.castShadow = door.receiveShadow = true; doorPivot.add(door);
  for (const [x, y, w, h] of [[0.45, 0.45, 0.62, 0.55]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.012), doorM); p.position.set(x, y, 0.03); doorPivot.add(p); }
  const doorGlassM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.7, 1.85) });
  const dg = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.78), doorGlassM); dg.position.set(0.45, 1.45, 0.028); doorPivot.add(dg);
  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), brassM); handle.position.set(0.8, 1.0, 0.05); doorPivot.add(handle);
  // what's behind the door: the brightest white (the flight out)
  const outM = new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 3, 3.2) });
  tfMesh(new THREE.PlaneGeometry(1.2, 2.3), outM, 0, 1.1, -6.12);
  B(0.92, 0.04, 0.6, tfStd('#5a4636', 0.95, 0), 0, 0.02, -5.55);                // doormat

  // ---- the window: frame, sill, glass; the garden outside (a painted backdrop, its tree turns with the seasons)
  const frameM = tfStd('#f6f4ef', 0.45, 0);
  B(0.12, 0.05, WZ1 - WZ0 + 0.1, frameM, WX - 0.02, WY0 - 0.02, (WZ0 + WZ1) / 2);
  B(0.2, 0.04, WZ1 - WZ0 + 0.2, frameM, WX - 0.1, WY0 + 0.0, (WZ0 + WZ1) / 2);   // sill
  B(0.08, WY1 - WY0, 0.05, frameM, WX, (WY0 + WY1) / 2, WZ0); B(0.08, WY1 - WY0, 0.05, frameM, WX, (WY0 + WY1) / 2, WZ1); B(0.08, WY1 - WY0, 0.04, frameM, WX, (WY0 + WY1) / 2, (WZ0 + WZ1) / 2);
  B(0.08, 0.05, WZ1 - WZ0, frameM, WX, WY1, (WZ0 + WZ1) / 2); B(0.08, 0.04, WZ1 - WZ0, frameM, WX, 1.55, (WZ0 + WZ1) / 2);
  const gardenU = { uMap: { value: tfTex(tfGardenCanvas(), { repeat: false }) }, uSky: { value: new THREE.Color('#9fc3e8') }, uLawn: { value: new THREE.Color('#5d8a3a') }, uCrown: { value: new THREE.Color('#4f8a2e') }, uCrownA: { value: 1 }, uSnow: { value: 0 }, uLight: { value: 1 } };
  const garden = tfMesh(new THREE.PlaneGeometry(9, 6), new THREE.ShaderMaterial({
    uniforms: gardenU, fog: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D uMap; uniform vec3 uSky, uLawn, uCrown; uniform float uCrownA, uSnow, uLight; varying vec2 vUv;
      void main(){ vec4 m = texture2D(uMap, vUv); vec3 sky = mix(uSky * 1.25, uSky, vUv.y);
        vec3 lawn = mix(uLawn, vec3(0.92, 0.94, 0.97), uSnow); vec3 fence = mix(vec3(0.45, 0.33, 0.22), vec3(0.85, 0.87, 0.9), uSnow * 0.5);
        vec3 c = sky; c = mix(c, m.r > 0.9 ? lawn : fence, step(0.5, m.r));
        c = mix(c, vec3(0.22, 0.17, 0.12), m.b);
        c = mix(c, uCrown * (0.75 + 0.5 * m.g), smoothstep(0.15, 0.6, m.g) * uCrownA);
        gl_FragColor = vec4(c * uLight * 1.6, 1.0); }`,
  }), WX + 3.2, 1.6, (WZ0 + WZ1) / 2);
  garden.rotation.y = -Math.PI / 2; garden.castShadow = garden.receiveShadow = false;

  // ---- the stairs: 14 risers of 0.2 m, oak treads, white risers, a banister on the open side
  const S0 = -1.0, RUN = 0.26, RISE = 0.2;
  for (let i = 0; i < 14; i++) {
    const z = S0 - i * RUN, y = (i + 1) * RISE;
    B(0.9, 0.035, RUN + 0.02, oakM, -0.65, y - 0.0175, z - RUN / 2);
    B(0.88, RISE, 0.02, whiteM, -0.65, y - RISE / 2, z);
    B(0.9, y, RUN, whiteM, -0.65, y / 2 - 0.02, z - RUN / 2).castShadow = false;
  }
  B(0.07, 1.1, 0.07, oakM, -0.2, 0.55, S0 + 0.05);                             // newel post
  const railLen = Math.hypot(14 * RUN, 14 * RISE), rail = B(0.06, 0.05, railLen + 0.2, oakM, -0.2, 0, 0);
  rail.position.set(-0.2, 0.95 + 7 * RISE, S0 - 7 * RUN); rail.rotation.x = Math.atan2(RISE, RUN);
  for (let i = 0; i < 14; i++) { const z = S0 - i * RUN - RUN / 2, y = (i + 1) * RISE; B(0.025, 0.92, 0.025, whiteM, -0.2, y + 0.46, z); }
  // upstairs: the landing's floor, a banister along the stairwell, the bunk room's door ajar (warm light behind)
  B(2.2, 0.06, 1.6, floorM, 0, 2.83, -5.2);
  B(0.06, 0.05, 3.6, oakM, -0.2, 3.75, -2.6);
  for (let i = 0; i < 16; i++) B(0.025, 0.9, 0.025, whiteM, -0.2, 3.3, -0.9 - i * 0.22);
  const roomGlowM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.2, 0.85) });
  tfMesh(new THREE.PlaneGeometry(0.8, 2.0), roomGlowM, -0.62, 3.86, -5.93);
  const upDoorP = new THREE.Group(); upDoorP.position.set(-1.02, 2.86, -5.92); upDoorP.rotation.y = 0.9; scene.add(upDoorP);
  const upDoor = tfMesh(new THREE.BoxGeometry(0.8, 2.0, 0.04), doorM, 0.4, 1.0, 0, upDoorP);
  const slipM = tfStd('#8a4b5c', 0.9, 0);
  for (const s of [-1, 1]) { const sl = tfMesh(new THREE.CapsuleGeometry(0.045, 0.16, 6, 12).rotateX(Math.PI / 2), slipM, -0.6 + s * 0.08, 2.88, -4.6); sl.scale.y = 0.55; }

  // ---- furniture: the console table, its lamp and a plant; pictures; the runner rug; coats by the door; a pendant
  B(0.38, 0.03, 1.0, oakM, 0.9, 0.8, 1.45); for (const z of [1.0, 1.9]) for (const x of [0.75, 1.05]) B(0.03, 0.8, 0.03, oakM, x, 0.4, z);
  tfCyl(0.06, 0.08, 0.28, tfStd('#2f5a6a', 0.3, 0.1), 0.92, 0.95, 1.2);
  const shadeM = tfStd('#f1e6cf', 0.8, 0, { emissive: new THREE.Color('#ffd9a0'), emissiveIntensity: 0.25, side: THREE.DoubleSide });
  tfCyl(0.12, 0.17, 0.2, shadeM, 0.92, 1.2, 1.2);
  const plant = new THREE.Group(); plant.position.set(0.9, 0.815, 1.75); scene.add(plant);
  tfCyl(0.07, 0.055, 0.14, tfStd('#b5643c', 0.8, 0), 0, 0.07, 0, plant);
  const leafM = tfStd('#3f7a3a', 0.6, 0, { side: THREE.DoubleSide });
  for (let i = 0; i < 14; i++) { const l = tfMesh(new THREE.PlaneGeometry(0.06, 0.22), leafM, 0, 0.2, 0, plant); const a = i * 2.4; l.rotation.set(0.35 + 0.3 * tfR(i, 3), a, 0); l.position.set(Math.sin(a) * 0.04, 0.22 + 0.08 * tfR(i, 4), Math.cos(a) * 0.04); }
  const art = (x, z, w, h, seed, ry) => {
    const c = tfCanvas(256, 256 * h / w, (g, cw, ch) => { const r = new RNG(seed); g.fillStyle = '#efe7d8'; g.fillRect(0, 0, cw, ch); for (let i = 0; i < 6; i++) { g.fillStyle = ['#c9762f', '#26334d', '#7b2b23', '#8aa6a3', '#d8c39a'][r.int(0, 4)]; g.beginPath(); g.arc(r.range(0, cw), r.range(0, ch), r.range(20, 90), 0, 7); g.fill(); } });
    const f = B(0.03, h + 0.06, w + 0.06, darkM, x, 1.6, z); f.rotation.y = ry; f.castShadow = false;
    const p = tfMesh(new THREE.PlaneGeometry(w, h), tfStd('#ffffff', 0.7, 0, { map: tfTex(c, { repeat: false }) }), x + (ry ? 0 : (x > 0 ? -0.017 : 0.017)), 1.6, z); p.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2; p.castShadow = false;
  };
  art(1.09, 1.45, 0.5, 0.4, 41, 0); art(1.09, -4.4, 0.4, 0.5, 42, 0); art(1.09, -5.1, 0.35, 0.35, 43, 0);
  const rugTex = tfTex(tfRugCanvas(), { repeat: false });
  const rugM = tfStd('#ffffff', 0.95, 0, { map: rugTex });
  const rug = tfMesh(new THREE.PlaneGeometry(0.85, 3.4).rotateX(-Math.PI / 2), rugM, 0.42, 0.006, -2.2); rug.castShadow = false;
  const coatM = [tfStd('#5c6b4e', 0.9, 0), tfStd('#3a3f55', 0.9, 0)];
  for (const [i, z] of [[0, -4.85], [1, -5.25]]) { tfCyl(0.012, 0.012, 0.08, brassM, -1.06, 1.8, z).rotation.z = Math.PI / 2; const c = tfMesh(tfLoft([[0, 1.78, 0, 0.05, 0.03], [0, 1.62, 0, 0.17, 0.09], [0, 1.2, 0, 0.19, 0.1], [0, 0.9, 0, 0.2, 0.09]], 16, 0.3), coatM[i], -0.97, 0, z); c.scale.set(0.75, 1, 1); }
  for (const [x, z, ry] of [[-0.75, -5.6, 0.2], [-0.55, -5.65, -0.15]]) { const sh = tfMesh(new THREE.CapsuleGeometry(0.045, 0.2, 6, 12).rotateX(Math.PI / 2), darkM, x, 0.045, z); sh.rotation.y = ry; sh.scale.y = 0.7; }
  tfMesh(new THREE.SphereGeometry(0.16, 24, 16), tfStd('#f6f1e6', 0.3, 0, { emissive: new THREE.Color('#fff2da'), emissiveIntensity: 0.08 }), 0.2, 2.2, -1.5);
  tfCyl(0.005, 0.005, 0.32, darkM, 0.2, 2.4, -1.5);

  // ---- you and your pole (stood in the hall, facing the door)
  const youG = new THREE.Group(); youG.position.set(...TF_HOME.you); scene.add(youG);
  const rig = tfRig(youG);
  const P0 = rig.pole.g.position.clone(), PQ = rig.pole.g.quaternion.clone();
  const baseG = new THREE.Group(); baseG.position.copy(P0); baseG.quaternion.copy(PQ); youG.add(baseG);
  for (const b of rig.pole.base) baseG.add(b);                                  // (the pole lifts out of its base)
  const EYEV = new THREE.Vector3(TF_EYE[0] + TF_HOME.you[0], TF_EYE[1], TF_EYE[2] + TF_HOME.you[2]);
  const toW = (p) => [p[0] + TF_HOME.you[0], p[1] + TF_HOME.you[1], p[2] + TF_HOME.you[2]];
  const EYE = toW(TF_EYE), HEADC = toW(rig.head), FEETC = toW(rig.feet), FEETW = toW([0.02, 0.05, -0.12]);
  // the cat, dozing on the rug in the patch of sun
  const cat = tfBuildCat(scene); const CAT0 = [0.25, 0, -2.35], CATR = 2.0;
  cat.g.position.set(...CAT0); cat.g.rotation.y = CATR; cat.g.scale.setScalar(1.0);
  const CAT_SPOTS = [[0.2, -2.55, 2.3], [0.55, -1.1, -0.6], [-0.3, -3.6, 1.2], [0.6, -4.6, 3.0], [-0.1, 0.9, 0.4], [0.5, -2.9, -2.0]];

  // ---- the ticking lights (gravity, exaggerated): a strip on the right wall from the floor to 2.2 m; each light blinks
  // at its own rate, faster the higher it is (shown 10^16 × bigger than real)
  const TICKS = [], tickM = [];
  for (let i = 0; i < 9; i++) {
    const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0) }); tickM.push(m);
    const d = tfMesh(new THREE.CircleGeometry(0.03, 20), m, 1.085, 0.15 + i * 0.25, -0.95); d.rotation.y = -Math.PI / 2; d.castShadow = false; TICKS.push(d);
    const ring = tfMesh(new THREE.RingGeometry(0.034, 0.042, 24), tfStd('#cfc8bb', 0.4, 0.6), 1.087, 0.15 + i * 0.25, -0.95); ring.rotation.y = -Math.PI / 2; TICKS.push(ring);
  }
  const tickRail = B(0.01, 2.2, 0.012, tfStd('#bfb6a6', 0.4, 0.6), 1.092, 1.15, -0.95);
  const tickG = [...TICKS, tickRail];
  // the ball you drop
  const ball = tfMesh(new THREE.SphereGeometry(0.035, 24, 16), tfStd('#e2672c', 0.45, 0), 0.75, 1.45, -0.75);

  // ---- the bunk room (upstairs, off to the side): a bunk bed in the morning sun, a clock on each bunk
  const RM = TF_HOME.room, room = new THREE.Group(); room.position.set(RM[0], RM[1], RM[2]); scene.add(room);
  const rB = (w, h, d, m, x, y, z) => tfBox(w, h, d, m, x, y, z, room);
  rB(4, 0.05, 4, floorM, 0, -0.025, 0); rB(4, 2.6, 0.1, wallM, 0, 1.3, -2); rB(0.1, 2.6, 4, wallM, -2, 1.3, 0); rB(0.1, 2.6, 4, wallM, 2, 1.3, 0); rB(4, 0.1, 4, ceilM, 0, 2.6, 0);
  const roomWin = tfMesh(new THREE.PlaneGeometry(1.0, 1.2), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.0, 1.9, 1.7) }), 1.94, 1.5, -0.4, room); roomWin.rotation.y = -Math.PI / 2;
  const bunkM = tfStd('#ffffff', 0.5, 0, { map: tfTex(tfWoodCanvas(CONFIG.seed + 330, 256, 1024, [196, 160, 118])) });
  for (const x of [-1.0, 1.0]) for (const z of [-1.95 + 0.06, -1.95 + 0.98]) rB(0.07, 1.85, 0.07, bunkM, x, 0.925, z);
  const duvet = [tfStd('#3d6e8f', 0.95, 0), tfStd('#c7663d', 0.95, 0)];
  for (const [y, k] of [[0.38, 0], [1.38, 1]]) {
    rB(2.06, 0.06, 0.98, bunkM, 0, y, -1.47); rB(1.95, 0.16, 0.88, tfStd('#f2efe8', 0.9, 0), 0, y + 0.11, -1.47);
    const dv = tfMesh(tfRoundBox(1.4, 0.1, 0.9, 0.08, 0.04), duvet[k], 0.25, y + 0.17, -1.45, room);
    const pw = tfMesh(tfRoundBox(0.45, 0.12, 0.6, 0.1, 0.05), tfStd('#f6f3ec', 0.9, 0), -0.7, y + 0.19, -1.45, room); pw.rotation.x = 0.0;
  }
  rB(2.06, 0.06, 0.04, bunkM, 0, 1.75, -1.0); rB(2.06, 0.06, 0.04, bunkM, 0, 1.58, -1.0);
  for (let i = 0; i < 5; i++) rB(0.42, 0.035, 0.035, bunkM, 1.2, 0.3 + i * 0.3, -0.97);
  // the two small clocks (top bunk, bottom bunk) on little shelves
  const bunkClock = [1.45, 0.45].map((y) => { const f = tfClockFace(y > 1 ? 'TOP BUNK' : 'BOTTOM BUNK'); const m = tfMesh(new THREE.PlaneGeometry(0.26, 0.098), new THREE.MeshBasicMaterial({ map: f.tex }), -0.85, y + 0.32, -1.0 + 0.04, room); return f; });
  for (const y of [1.45, 0.45]) rB(0.3, 0.12, 0.05, darkM, -0.85, y + 0.32, -1.0);
  const roomRug = tfMesh(new THREE.CircleGeometry(0.8, 48).rotateX(-Math.PI / 2), tfStd('#d8c39a', 0.95, 0), 0.1, 0.004, 0.5, room);
  const roomSun = new THREE.SpotLight('#ffe2b8', 0, 12, 0.6, 0.6, 1.2); roomSun.position.set(RM[0] + 3.5, RM[1] + 2.2, RM[2] - 0.4); roomSun.target.position.set(RM[0] - 0.2, RM[1], RM[2] - 1.2); roomSun.castShadow = true; roomSun.shadow.mapSize.set(1024, 1024); scene.add(roomSun); scene.add(roomSun.target);

  // ---- the time of day and the season: the clocks' own time at home, sped up in the year and the lifetime
  // (when days fly past faster than ~1 a second, the light flickers at a steady, readable rate instead)
  const daysPerSec = (t) => Math.abs(tfHomeT(t + 0.02) - tfHomeT(t - 0.02)) / 0.04 / 86400;
  const PAL = ['#dccfba', '#c9d6cc', '#e3cfa8', '#cdc4dc', '#dbbfae', '#bfd0d9', '#e0d6bf', '#d2c6b0', '#dccfba'];
  function homeNow(t, shot) {
    const lapse = shot.mode === 'year' && t >= TF.yearGo - 0.2;
    const head = lapse ? tfHomeT(t) : 120 + (t - shot.t0);
    const dps = lapse ? daysPerSec(t) : 0, fast = MathX.smooth(dps, 0.15, 2.5);
    const phaseReal = (7 / 24 + head / 86400) % 1, phaseFast = (0.3 + t * 1.25) % 1;
    const phase = fast > 0.5 ? phaseFast : phaseReal;
    const yrs = head / TFP.year, ys = yrs * 1.0 > 1.6 ? 0.9 * t : yrs;   // (the seasons strobe once the years fly by)
    const season = (0.32 + ys) % 1;
    return { head, dps, fast, phase, season, yrs, lapse };
  }
  // the sun: below the horizon at night; low in the east at 7:00, swinging round; the window light follows
  // (el: how high it is, for day and night; geo: the angle the light comes in at, 0.7 rad at 7:00, so the patch of sun
  // lands on the rug; hang: its compass direction, mostly straight in through the window)
  function sunAt(phase) {
    const a = (phase - 0.25) * Math.PI * 2, el = Math.sin(a) * 0.95, az = Math.cos(a);
    const geo = MathX.clamp(0.7 + 0.5 * (Math.sin(a) - 0.259), 0.3, 1.2), hang = -0.34 - 0.5 * (az - 0.966);
    return { el, az, geo, hang, dir: [Math.cos(geo) * Math.cos(hang), Math.sin(geo), Math.cos(geo) * Math.sin(hang)] };
  }

  // ---- the cameras
  const AHC = tfAim(EYE, HEADC), AFC = tfAim(EYE, FEETC), AFT = tfAim(EYE, FEETW);
  const PW = [P0.x + TF_HOME.you[0], 0, P0.z + TF_HOME.you[2]];                  // the pole's base (world)
  const PL = [EYE[0] - 0.3, 1.62, EYE[2] + 0.4], PH = [EYE[0] - 0.4, 1.5, EYE[2] + 1.3];   // a step back; further back
  const CAM = {
    title(t) {
      const k = K(t, TF.titleShot, TF.hall + 0.5), dr = tfDrift(t, 0.012, 0.25, 2);
      const p = tfV([0.05, 1.68, 2.25], [0.15, 1.66, 1.6], k);
      tfCam(cam, [p[0] + dr[0], p[1] + dr[1], p[2] + dr[2]], [0.15 + dr[0] * 3, 1.25, -6], 54);
    },
    hall(t) {
      // walk down the hall to a step behind your spot (the whole pole in view), then step up to it, eyes on the head clock
      const dr = tfDrift(t, 0.01, 0.3, 4), k = K(t, TF.hall - 0.4, TF.precise + 0.2), k2 = K(t, tfCap('hall', 2).show - 0.3, TF.pole + 0.3);
      const BACK = [EYE[0] - 0.15, EYE[1] + 0.02, EYE[2] + 1.05], p = tfV(tfV([0.15, 1.66, 1.6], BACK, k), EYE, k2);
      const whole = [P0.x + TF_HOME.you[0], 0.85, P0.z + TF_HOME.you[2]];
      let aim = tfAimLerp(tfAim(p, [0.15, 1.25, -6]), tfAim(BACK, whole), K(t, TF.hall + 1.5, TF.precise + 0.4));
      aim = tfAimLerp(aim, AHC, k2);
      tfLook(cam, [p[0] + dr[0], p[1] + dr[1], p[2] + dr[2]], aim[0], aim[1], tfLerp(tfLerp(54, 56, k), 32, k2));
    },
    pole(t) {
      const dr = tfDrift(t, 0.006, 0.35, 6), c1 = tfCap('pole', 0).show;
      // "one at your feet" (down), "one at your head" (up), then hold on the head clock as they start
      let aim = tfAimLerp(AHC, [AFC[0] + 0.05, AFC[1] + 0.04], K(t, TF.pole, c1 + 0.9));
      aim = tfAimLerp(aim, AHC, K(t, tfW('pole', 'one', 3).start - 0.3, tfW('pole', 'one', 3).start + 0.9));
      tfLook(cam, [EYE[0] + dr[0], EYE[1] + dr[1], EYE[2] + dr[2]], aim[0], aim[1], tfLerp(36, 30, K(t, tfCap('pole', 1).show, TF.drift)));
    },
    drift(t) {
      // step back to see the whole pole, then in on the feet clock's last digits
      const dr = tfDrift(t, 0.006, 0.35, 8), k = K(t, TF.drift, TF.drift + 2.5), k2 = K(t, tfCap('drift', 2).show - 0.5, tfCap('drift', 2).show + 1.6);
      const back = [EYE[0] - 0.2, EYE[1], EYE[2] + 1.0], p = tfV(EYE, back, k * (1 - k2)), at = tfV(tfV(HEADC, [P0.x + TF_HOME.you[0], 0.88, P0.z + TF_HOME.you[2]], k), FEETC, k2);
      const a = tfAim(p, at);
      tfLook(cam, [p[0] + dr[0], p[1] + dr[1], p[2] + dr[2]], a[0], a[1], tfLerp(tfLerp(30, 54, k), 26, k2));
    },
    yes(t) {
      // down at your feet, the feet clock beside them
      const dr = tfDrift(t, 0.006, 0.35, 10), k = K(t, TF.yes - 0.2, TF.yes + 1.6);
      const aim = tfAimLerp([AFC[0], AFC[1]], tfAim(EYE, [FEETC[0] - 0.12, 0.05, FEETC[2] - 0.06]), k);
      tfLook(cam, [EYE[0] + dr[0], EYE[1] + dr[1], EYE[2] + dr[2]], aim[0], aim[1], tfLerp(30, 50, k));
    },
    year(t) {
      // a wide look along the hall, the window and the pole in it (the light sweeps, the seasons turn)
      const dr = tfDrift(t, 0.004, 0.2, 12), k = K(t, TF.year, TF.yearGo);
      const p = tfV(EYE, [-0.55, 1.62, 1.5], k), at = tfV([FEETW[0], 0.4, FEETW[2]], [0.6, 1.0, -2.4], k);
      const a = tfAim(p, at);
      tfLook(cam, [p[0] + dr[0], p[1] + dr[1], p[2] + dr[2]], a[0], a[1], tfLerp(46, 60, k));
    },
    cat(t) {
      const dr = tfDrift(t, 0.006, 0.3, 14), k = K(t, TF.cat, TF.lie);
      const c = cat.g.position, p = [c.x + 0.82 - 0.15 * k, 0.5 + 0.03 * k, c.z + 0.72 - 0.12 * k];
      tfCam(cam, [p[0] + dr[0], p[1] + dr[1], p[2] + dr[2]], [c.x, 0.25, c.z], 40);
    },
    lie(t) {
      // a step back from your spot: the pole comes out of its base and down onto the floor, both faces up
      const dr = tfDrift(t, 0.006, 0.3, 16), k = K(t, TF.poleDown - 0.3, TF.poleLevel + 0.4);
      const a = tfAimLerp(tfAim(PL, [PW[0], 0.95, PW[2]]), tfAim(PL, [PW[0] - 0.3, 0.0, PW[2] - 0.92]), k);
      tfLook(cam, [PL[0] + dr[0], PL[1] + dr[1], PL[2] + dr[2]], a[0], a[1], 50);
    },
    hand(t) {
      // back further: the pole goes up and over into its base, upside down
      const dr = tfDrift(t, 0.006, 0.3, 18), k = K(t, TF.hand - 0.3, TF.poleFlip + 0.5);
      const p = tfV(PL, PH, k), a = tfAimLerp(tfAim(PL, [PW[0] - 0.3, 0.0, PW[2] - 0.92]), tfAim(PH, [PW[0], 1.12, PW[2]]), k);
      tfLook(cam, [p[0] + dr[0], p[1] + dr[1], p[2] + dr[2]], a[0], a[1], tfLerp(50, 62, k));
    },
    upstairs(t) {
      // to the foot of the stairs and up the first steps, looking up at the bedroom door on the landing
      const dr = tfDrift(t, 0.008, 0.3, 20), k = K(t, TF.upstairs - 0.3, TF.measured - 0.3, Ease.inOutSine);
      const p = tfV([-0.6, 1.62, 0.55], [-0.64, 1.86, -1.2], k), a = tfAimLerp(tfAim([-0.6, 1.62, 0.55], [-0.62, 2.9, -4.0]), tfAim(p, [-0.62, 3.75, -5.9]), K(t, TF.upstairs - 0.3, TF.upstairs + 2.0));
      tfLook(cam, [p[0] + dr[0], p[1] + dr[1], p[2] + dr[2]], a[0], a[1], 52);
    },
    why(t) {
      // the strip of ticking lights and the ball; the ball drops at TF.drop
      const dr = tfDrift(t, 0.006, 0.3, 22), k = K(t, TF.why, TF.why + 2.5);
      const p = tfV([EYE[0] - 0.4, 1.6, EYE[2] + 0.4], [EYE[0] - 0.55, 1.45, EYE[2] + 0.3], k), at = [1.0, tfLerp(1.3, 1.0, k), -0.9];
      const a = tfAim(p, at);
      tfLook(cam, [p[0] + dr[0], p[1] + dr[1], p[2] + dr[2]], a[0], a[1], tfLerp(52, 56, k));
    },
    maths(t) {
      const dr = tfDrift(t, 0.006, 0.25, 24), p = [EYE[0] - 0.55 + dr[0], 1.45 + dr[1], EYE[2] + 0.3 + dr[2]], a = tfAim(p, [1.0, 1.0, -0.9]);
      tfLook(cam, p, a[0] + 0.05 * K(t, TF.maths, TF.pull), a[1], 56);
    },
    pull(t) {
      const dr = tfDrift(t, 0.006, 0.3, 26), k = K(t, TF.pull - 0.2, TF.pull + 1.6);
      const aim = tfAimLerp(tfAim(EYE, [1.0, 1.0, -0.9]), [AFT[0] + 0.05, AFT[1] + 0.1], k);
      tfLook(cam, [EYE[0] + dr[0], EYE[1] + dr[1], EYE[2] + dr[2]], aim[0], aim[1], tfLerp(52, 44, k));
    },
    bigger(t) {
      // both clocks; then you turn to the front door and walk to it as it opens onto white
      const dr = tfDrift(t, 0.008, 0.3, 28), kTurn = K(t, tfCap('bigger', 1).show, tfCap('bigger', 2).show + 0.4), kGo = K(t, TF.go, TF.wd + 0.2, (x) => x * x * (3 - 2 * x));
      const p = tfV(tfV([EYE[0] - 0.25, EYE[1], EYE[2] + 0.75], EYE, kTurn), [0.0, 1.6, -5.2], kGo);
      const a = tfAimLerp(tfAim([EYE[0] - 0.25, EYE[1], EYE[2] + 0.75], [P0.x + TF_HOME.you[0], 0.9, P0.z + TF_HOME.you[2]]), tfAim(EYE, [0, 1.35, -6]), kTurn);
      tfLook(cam, [p[0] + dr[0], p[1] + dr[1], p[2] + dr[2]], a[0], a[1], tfLerp(54, 60, kGo));
    },
    real(t) {
      const dr = tfDrift(t, 0.01, 0.25, 30), k = K(t, TF.real, TF.home);
      const p = tfV([0.0, 1.66, 2.1], [0.15, 1.64, 1.3], k);
      tfCam(cam, [p[0] + dr[0], p[1] + dr[1], p[2] + dr[2]], [0.25 + dr[0] * 2, 1.15, -5], 50);
    },
    home(t) {
      const dr = tfDrift(t, 0.006, 0.3, 32), c1 = tfCap('home', 1).show;
      let aim = tfAimLerp(AHC, [AFC[0] + 0.15, AFC[1] + 0.1], K(t, c1 - 0.4, c1 + 1.8));
      tfLook(cam, [EYE[0] + dr[0], EYE[1] + dr[1], EYE[2] + dr[2]], aim[0], aim[1], tfLerp(36, 46, K(t, c1 - 0.4, c1 + 1.8)));
    },
    bunk(t) {
      const dr = tfDrift(t, 0.01, 0.25, 34), k = K(t, TF.question - 0.5, TF.end);
      const p = [RM[0] + 1.3 - 0.35 * k + dr[0], RM[1] + 1.55 + dr[1], RM[2] + 1.6 - 0.4 * k + dr[2]];
      tfCam(cam, p, [RM[0] - 0.1, RM[1] + 1.05, RM[2] - 1.45], 50);
    },
  };

  // ---- the pole's own moves: lifted out of its base and laid on the floor beside it (pointing away from you, faces up,
  // reading from your end), then stood on its head in the base (the faces turn the right way up, like a phone's), then
  // back. The clock units tip to face your eyes in each pose.
  const qUp = PQ.clone(), qLie = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  const qInv = PQ.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI)));
  const BOT = new THREE.Vector3(0, 0.035, 0), CEN = new THREE.Vector3(0, 0.9, 0);
  const B1 = new THREE.Vector3(P0.x - 0.32, 0.025, P0.z + 0.1);          // (the bottom end, lying: the pole rests on its collars)
  const U = rig.pole.units;
  function posePole(t) {
    const kDown = K(t, TF.poleDown, TF.poleLevel), kFlip = K(t, TF.poleFlip, TF.poleFlipped);
    const back = t >= TF.poleBack || t < TF.poleDown;
    const q = new THREE.Quaternion(), pos = new THREE.Vector3();
    let tf = -1.0, th = 0, flip = false;
    if (back) { q.copy(qUp); pos.copy(P0); }
    else if (t < TF.poleFlip) {
      // up out of the base, over, down: the bottom end moves aside while the pole swings down about it
      const k = kDown, kr = k < 1 ? 1 - Math.cos(k * Math.PI / 2) : 1;
      q.copy(qUp).slerp(qLie, kr);
      const b = new THREE.Vector3(P0.x, 0.035, P0.z).lerp(B1, k); b.y += 0.12 * Math.sin(Math.PI * k);
      pos.copy(b).sub(BOT.clone().applyQuaternion(q));
      tf = tfLerp(-1.0, 0, kr);
    } else {
      // up, over and into the base the other way up
      const k = kFlip;
      q.copy(qLie).slerp(qInv, k);
      const cLie = B1.clone().add(new THREE.Vector3(0, 0, -0.865)), cInv = new THREE.Vector3(P0.x, 0.95, P0.z);
      const c = cLie.lerp(cInv, k); c.y += 0.3 * Math.sin(k * Math.PI);
      pos.copy(c).sub(CEN.clone().applyQuaternion(q));
      tf = tfLerp(0, -0.15, k); th = tfLerp(0, 1.0, k); flip = k > 0.5;
    }
    rig.pole.g.quaternion.copy(q); rig.pole.g.position.copy(pos);
    U.feet.tg.rotation.x = tf; U.head.tg.rotation.x = th;
    U.feet.glass.rotation.z = U.head.glass.rotation.z = flip ? Math.PI : 0;
  }

  const set = {
    scene, camera: cam,
    frame(t, shot) {
      const m = shot.mode;
      (CAM[m] || CAM.title)(t);
      const N = homeNow(t, shot);
      // ---- light: the sun through the window, the sky's fill, the night
      const su = sunAt(N.phase), day = MathX.smooth(su.el, -0.12, 0.12), avg = N.fast;
      const sunI = tfLerp(2.0 * MathX.smooth(su.el, -0.02, 0.15), 1.0 * day + 0.2, avg * 0.6);
      sun.intensity = sunI;
      sun.position.set(SUNAT[0] + 10 * su.dir[0], SUNAT[1] + 10 * su.dir[1], SUNAT[2] + 10 * su.dir[2]);
      bounce.intensity = 0.55 * sunI; landL.intensity = m === 'upstairs' ? 1.6 : 0.4;
      scene.environmentIntensity = 0.3 + 0.3 * day;
      const winter = Math.max(0, Math.cos((N.season - 0.83) * Math.PI * 2));
      sun.color.setRGB(1, tfLerp(0.89, 0.93, winter), tfLerp(0.72, 0.86, winter));
      hemi.intensity = 0.1 + 0.3 * day; amb.intensity = 0.03 + 0.05 * day;
      hemi.color.setRGB(0.82 + 0.1 * day, 0.86 + 0.06 * day, 0.95);
      // the lamp on the console and the pendant come on at night
      shadeM.emissiveIntensity = 0.25 + 1.8 * (1 - day);
      doorGlassM.color.setRGB(0.15 + 1.5 * day, 0.18 + 1.55 * day, 0.3 + 1.6 * day);
      // the garden: the sky, the season's tree, snow
      const sp = N.season; // 0 spring … 0.25 summer … 0.5 autumn … 0.75 winter
      const crown = [[0.0, [0.45, 0.72, 0.3]], [0.25, [0.25, 0.48, 0.16]], [0.45, [0.78, 0.45, 0.12]], [0.55, [0.62, 0.25, 0.08]], [0.65, [0.4, 0.3, 0.2]], [0.95, [0.45, 0.72, 0.3]], [1.0, [0.45, 0.72, 0.3]]];
      let cc = crown[0][1]; for (let i = 1; i < crown.length; i++) if (sp <= crown[i][0]) { const u = (sp - crown[i - 1][0]) / (crown[i][0] - crown[i - 1][0]); cc = crown[i - 1][1].map((v, j) => v + (crown[i][1][j] - v) * u); break; }
      gardenU.uCrown.value.setRGB(...cc);
      gardenU.uCrownA.value = 1 - MathX.smooth(sp, 0.6, 0.68) * (1 - MathX.smooth(sp, 0.9, 0.97));
      gardenU.uSnow.value = MathX.smooth(sp, 0.7, 0.75) * (1 - MathX.smooth(sp, 0.86, 0.9));
      gardenU.uSky.value.setRGB(...[0.62, 0.76, 0.91].map((v, i) => tfLerp([0.03, 0.04, 0.09][i], v, day)));
      gardenU.uLawn.value.setRGB(...[0.36, 0.54, 0.23].map((v, i) => v * (1 - 0.3 * winter)));
      gardenU.uLight.value = 0.15 + 0.85 * day;
      // ---- the lifetime: the walls repainted every decade or so, the plant grows (until the cat shot)
      const life = N.lapse && N.yrs > 1.5 ? N.yrs : 0;
      const pi = Math.min(PAL.length - 2, Math.floor(life / 10)), pu = MathX.smooth((life / 10) % 1, 0.85, 1);
      const pc = new THREE.Color(PAL[pi]).lerp(new THREE.Color(PAL[pi + 1]), pu); wallM.color.copy(pc);
      plant.scale.setScalar(life > 0 ? 1 + 1.6 * ((life / 26) % 1) : 1);
      // ---- the cat: asleep; in the sped-up year she's all over the place
      cat.g.visible = !(N.lapse && life > 0) && m !== 'bunk';
      if (N.lapse && life === 0 && N.dps > 0.3) { const s = CAT_SPOTS[Math.floor(t * 2.6) % CAT_SPOTS.length]; cat.g.position.set(s[0], 0, s[1]); cat.g.rotation.y = s[2]; }
      else { cat.g.position.set(...CAT0); cat.g.rotation.y = CATR; }
      // (sat up, eyes shut, dozing: her breathing, a slow nod, the tail tip)
      const P = Object.assign({}, TF_CAT_POSES.sit, { blink: 1, np: -0.2, hp: 0.62 + 0.04 * Math.sin(t * 0.5), ts: 0.05, tw: 0.1 }); P.py += 0.002 * Math.sin(t * 2.1);
      cat.pose(P, t);
      // ---- the pole, the clocks, you
      posePole(t);
      let c = tfClock(t);
      if (t >= TF.why && t < TF.real) c = { head: 7 + (t - TF.why), gap: (7 + (t - TF.why)) * TFP.gapE, fmt: 'fine' };
      const F = tfFmtClock(c);
      // (before the start, both read 07:00:00 and every zero)
      rig.update(F, { lamp: 0, on: 1 });
      // (you: only while the camera is your eyes)
      rig.body.g.visible = cam.position.distanceTo(EYEV) < 0.25 && !['title', 'cat', 'lie', 'hand', 'upstairs', 'bunk'].includes(m);
      youG.visible = m !== 'bunk';
      // ---- the ticking lights (why … pull): blink rate grows with height (exaggerated)
      const tk = ['why', 'maths', 'pull'].includes(m);
      tickG.forEach((o) => { o.visible = tk; });
      if (tk) tickM.forEach((mm, i) => { const h = 0.15 + i * 0.25, f = 0.55 * (1 + 0.55 * h), ph = (t * f) % 1, on = Math.exp(-ph * 9); mm.color.setRGB(0.3 + 2.4 * on, 0.22 + 1.7 * on, 0.1 + 0.9 * on); });
      // the ball: held, dropped at TF.drop (it falls 1.45 m in 0.54 s), then it rests and rolls a little
      ball.visible = m === 'why';
      if (ball.visible) { const u = t - TF.drop; if (u < 0) ball.position.set(0.75, 1.45 + 0.01 * Math.sin(t * 2), -0.75); else { const y = Math.max(0.035, 1.45 - 0.5 * 9.81 * u * u), tb = Math.sqrt(2 * 1.415 / 9.81); const bounce = u > tb ? 0.035 + 0.25 * Math.abs(Math.sin((u - tb) * 5.5)) * Math.exp(-(u - tb) * 3) : y; ball.position.set(0.75, bounce, -0.75 - 0.08 * Math.max(0, u - tb)); } }
      // ---- the front door opens (the way out to the stars)
      doorPivot.rotation.y = m === 'bigger' ? -1.6 * K(t, TF.go + 0.2, TF.go + 1.6) : 0;
      // ---- the bunk room: its sun, its clocks (the top bunk's runs ahead, by a whisker)
      roomSun.intensity = m === 'bunk' ? 30 : 0;
      if (m === 'bunk') { const s = 7 * 3600 + 30 + (t - TF.question); for (const [i, f] of bunkClock.entries()) f.update({ big: '07:00:' + String(Math.floor(s % 60)).padStart(2, '0'), small: '.' + String(Math.floor((s % 1) * 1000)).padStart(3, '0') + (i ? ' 000 000 000 000 0' : ' 000 000 000 000 3'), on: 1 }); }
      this._N = N;
    },
    grade(t, p, shot) {
      const m = shot.mode;
      p.exposure = 1.08; p.saturation = 1.04; p.contrast = 1.05; p.warmth = 0.04; p.vignette = 0.5; p.bloom = 0.28; p.bloomThreshold = 1.25; p.grain = 0.024;
      if (m === 'maths') { p.exposure = 0.7; p.vignette = 0.7; p.edgeBlur = 0.6; p.saturation = 0.85; }
      if (m === 'bigger') { const k = MathX.smooth(t, TF.go + 0.6, TF.wd); p.exposure = 1.08 + 2.5 * k; p.flash = 0.85 * MathX.smooth(t, TF.wd - 1.0, TF.wd); p.flashColor.setRGB(1, 1, 1); p.bloom = 0.32 + 0.6 * k; }
      if (m === 'year' && this._N && this._N.lapse) { p.uneven = 0.08; }
      if (m === 'bunk') { p.vignette = 0.45; p.exposure = 1.12; }
    },
    labels(t) {
      const s = tfShotAt(t), m = s.mode;
      if (m === 'cat') return [{ p: [cat.g.position.x, 0.3, cat.g.position.z], text: 'YOUR CAT', sub: 'HER HEAD IS 40 cm UP', a: W(t, TF.cat + 1.0, TF.lie - 0.2, 0.4, 0.3) }];
      if (m === 'upstairs') return [{ p: [-0.3, 3.6, -5.0], text: 'UPSTAIRS', sub: '3 m HIGHER', a: W(t, TF.upstairs + 2.0, TF.measured - 0.2, 0.4, 0.3) }];
      if (m === 'hand') return [{ p: [P0.x + TF_HOME.you[0], 1.72, P0.z + TF_HOME.you[2]], text: 'THE FEET CLOCK', sub: 'ON TOP NOW · AND AHEAD', a: W(t, TF.poleFlipped + 0.2, TF.upstairs - 0.2, 0.4, 0.3) }];
      if (m === 'why') return [{ p: [1.08, 2.2, -0.95], text: 'FASTER', sub: '', a: W(t, TF.fall, TF.maths - 0.2, 0.5, 0.3) }, { p: [1.08, 0.18, -0.95], text: 'SLOWER', sub: '', a: W(t, TF.fall + 0.4, TF.maths - 0.2, 0.5, 0.3) }];
      return [];
    },
  };
  return set;
};
