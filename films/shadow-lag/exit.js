/* =====================================================================
   EXIT — the car park's exit lane at street level (its own set). The lane runs east (+x) to the barrier (x ≈ 0.5) and
   the street beyond. Your car comes in and stops short of the barrier (SHC.ex). On its left, past a railed walkway, a
   bulkhead lamp on the wall at head height of a car: the only light. It throws your car's shadow onto the pale wall
   on its right, 2.7 m away (a hatched strip between): the body dark, the windows two bright patches, and in the front
   one the shape of your head, a second late. Then, in the back one, something sits up.
     z = −5.6 left wall · −5.6…−3.8 walkway · −1.9…1.9 the lane · 1.9…3.6 hatched strip · 3.6 right wall (the screen)
   ===================================================================== */

const SH_EX = { zL: -5.6, zR: 3.6, x0: -30, xB: 0.55, xO: 1.2, H: 2.75, lamp: [-3.6, 1.95, -5.48] };

// the lane's floor, painted (x −30…1.2, z −5.6…3.6 → 2048 × 704 px)
function shExitFloorCanvas() {
  const E = SH_EX, W = 2048, H = 704, X = (x) => (x - E.x0) / (E.xO - E.x0) * W, Z = (z) => (z - E.zL) / (E.zR - E.zL) * H, r = new RNG(902);
  const base = shConcreteCanvas(903, [74, 73, 70], 512, 512, { k: 0.2, pits: 900 });
  return shCanvas(W, H, (g) => {
    for (let x = 0; x < W; x += 512) for (let y = 0; y < H; y += 512) g.drawImage(base, x, y);
    // the walkway (green, anti-slip) and its edge line
    g.fillStyle = 'rgba(40,96,62,0.72)'; g.fillRect(0, Z(-5.6), W, Z(-3.8) - Z(-5.6));
    g.fillStyle = 'rgba(230,226,210,0.8)'; g.fillRect(0, Z(-3.82), W, 5);
    // the hatched strip on the right (yellow diagonals) between two lines
    g.fillStyle = 'rgba(214,176,40,0.85)'; g.fillRect(0, Z(1.92), W, 6); g.fillRect(0, Z(3.5), W, 6);
    g.save(); g.beginPath(); g.rect(0, Z(1.92), W, Z(3.5) - Z(1.92)); g.clip(); g.strokeStyle = 'rgba(214,176,40,0.7)'; g.lineWidth = 9;
    for (let x = -200; x < W + 200; x += 46) { g.beginPath(); g.moveTo(x, Z(1.92)); g.lineTo(x + 60, Z(3.5)); g.stroke(); } g.restore();
    // tyre tracks down the lane, oil, the STOP bar and the word, an arrow
    for (let i = 0; i < 26; i++) { const z = r.range(-1.3, 1.3), w = r.range(10, 22); g.fillStyle = `rgba(10,10,10,${r.range(0.04, 0.1)})`; g.fillRect(0, Z(z) - w / 2, W, w); }
    for (let i = 0; i < 14; i++) { const x = X(r.range(-26, -1)), y = Z(r.range(-1.2, 1.2)), rr = r.range(14, 46); const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(8,8,10,0.35)'); gr.addColorStop(1, 'rgba(8,8,10,0)'); g.fillStyle = gr; g.fillRect(x - rr, y - rr, 2 * rr, 2 * rr); }
    g.fillStyle = 'rgba(232,230,222,0.85)'; g.fillRect(X(-0.5), Z(-1.85), X(-0.2) - X(-0.5), Z(1.85) - Z(-1.85));
    g.save(); g.translate(X(-1.6), Z(0)); g.rotate(-Math.PI / 2); g.font = '700 92px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('STOP', 0, 0); g.restore();
    g.save(); g.translate(X(-11), Z(0)); g.beginPath(); g.moveTo(90, 0); g.lineTo(20, -40); g.lineTo(20, -16); g.lineTo(-90, -16); g.lineTo(-90, 16); g.lineTo(20, 16); g.lineTo(20, 40); g.closePath(); g.fill(); g.restore();
  });
}
// the pale right wall: painted blockwork over a dark plinth, a faded "EXIT" with an arrow far back (x −30…1.2, 0…2.75)
function shExitWallCanvas(seed, o = {}) {
  const E = SH_EX, W = 2048, H = 180, r = new RNG(seed);
  return shCanvas(W, H, (g) => {
    g.fillStyle = o.paint || '#cfcabd'; g.fillRect(0, 0, W, H);
    // blockwork joints (440 × 215 mm blocks: 46 per 20 m…)
    const ppm = W / (E.xO - E.x0), bh = 0.215 * H / E.H;
    g.strokeStyle = 'rgba(70,64,52,0.16)'; g.lineWidth = 1.2;
    for (let row = 0, y = H; y > 0; row++, y -= bh) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); for (let x = (row % 2) * 0.22 * ppm; x < W; x += 0.44 * ppm) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - bh); g.stroke(); } }
    // grime: soft streaks down from the top, scuffs low
    for (let i = 0; i < 60; i++) { const x = r.range(0, W), w = r.range(3, 20), a = r.range(0.02, 0.06); const gr = g.createLinearGradient(0, 0, 0, H * r.range(0.3, 0.9)); gr.addColorStop(0, `rgba(60,54,44,${a})`); gr.addColorStop(1, 'rgba(60,54,44,0)'); g.fillStyle = gr; g.fillRect(x, 0, w, H); }
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(40,36,30,${r.range(0.04, 0.12)})`; g.fillRect(r.range(0, W), H - r.range(14, 30), r.range(8, 60), r.range(2, 6)); }
    // the plinth (dark grey) and its top line (yellow)
    const py = H * (1 - 0.32 / E.H); g.fillStyle = o.plinth || '#3a3b3c'; g.fillRect(0, py, W, H - py); g.fillStyle = 'rgba(214,176,40,0.9)'; g.fillRect(0, py - 3, W, 4);
    if (o.words) { g.fillStyle = 'rgba(30,90,60,0.55)'; g.font = `700 ${Math.round(H * 0.22)}px Arial`; g.textBaseline = 'middle'; for (const [x, t] of o.words) g.fillText(t, (x - E.x0) * ppm, H * 0.42); }
  });
}

function shExitSet(app) {
  const E = SH_EX;
  const o = shSet(app, { sky: '#05060a', fog: 0.022, fogColor: '#0a0b0e', fov: 50, near: 0.03, far: 400, hemi: ['#3a4250', '#16140f', 0.04] });
  const { scene, camera } = o;
  const S = scene, set = { scene, camera, _s: 0, _exit: true };
  shGradSky(scene, '#05060a', '#2a1c14', '#120c08', { hw: 0.18 });
  const len = E.xO - E.x0, cx = (E.x0 + E.xO) / 2, wd = E.zR - E.zL, cz = (E.zL + E.zR) / 2;
  // ---- the floor, the walls (single planes, facing in), the soffit, the beams
  const floorM = new THREE.MeshStandardMaterial({ map: shTex(shExitFloorCanvas(), { repeat: false, aniso: 8 }), roughness: 0.8 });
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(len, wd), floorM); fl.rotation.x = -Math.PI / 2; fl.position.set(cx, 0, cz); fl.receiveShadow = true; S.add(fl);
  const rwM = new THREE.MeshStandardMaterial({ map: shTex(shExitWallCanvas(911, { words: [[-24.5, 'EXIT  →']] }), { repeat: false, aniso: 8 }), roughness: 0.92 });
  const rw = new THREE.Mesh(new THREE.PlaneGeometry(len, E.H), rwM); rw.rotation.y = Math.PI; rw.position.set(cx, E.H / 2, E.zR); rw.receiveShadow = true; S.add(rw);
  const lwM = new THREE.MeshStandardMaterial({ map: shTex(shExitWallCanvas(912, { paint: '#b9b5aa' }), { repeat: false, aniso: 8 }), roughness: 0.92 });
  const lw = new THREE.Mesh(new THREE.PlaneGeometry(len, E.H), lwM); lw.position.set(cx, E.H / 2, E.zL); lw.receiveShadow = true; S.add(lw);
  const bw = new THREE.Mesh(new THREE.PlaneGeometry(wd, E.H), shStd('#2a2a2a', 0.95)); bw.rotation.y = Math.PI / 2; bw.position.set(E.x0, E.H / 2, cz); S.add(bw);
  const soffTex = shTex(shConcreteCanvas(913, [86, 85, 82], 512, 512, { k: 0.18, boards: 6 })); soffTex.repeat.set(8, 2);
  const soff = new THREE.Mesh(new THREE.PlaneGeometry(len, wd), new THREE.MeshStandardMaterial({ map: soffTex, roughness: 0.95 })); soff.rotation.x = Math.PI / 2; soff.position.set(cx, E.H, cz); soff.receiveShadow = true; S.add(soff);
  const beamM = shStd('#5c5b57', 0.92);
  for (let x = -24.6; x < 0; x += 7.2) shMesh(new THREE.BoxGeometry(0.42, 0.42, wd + 0.2), beamM, x, E.H - 0.2, cz, S);
  // the building's front over the opening (a lintel), and its outer face
  shMesh(new THREE.BoxGeometry(0.4, 0.6, wd + 0.2), shStd('#77746c', 0.9), E.xO + 0.2, E.H - 0.3, cz, S);
  for (const [z0, z1] of [[E.zL - 4, E.zL], [E.zR, E.zR + 4]]) shMesh(new THREE.BoxGeometry(0.4, E.H + 6, z1 - z0), shStd('#6e6b63', 0.9), E.xO + 0.2, (E.H + 6) / 2 - 0.0, (z0 + z1) / 2, S);
  shMesh(new THREE.BoxGeometry(0.4, 5.4, wd + 0.2), shStd('#6e6b63', 0.9), E.xO + 0.2, E.H + 2.7, cz, S);
  // ---- the walkway's railing (steel, yellow), the kerbs
  const railM = shStd('#c9a22a', 0.55, 0.3);
  for (let x = -27; x < -0.6; x += 2.4) shCyl(0.03, 0.03, 1.0, railM, x, 0.5, -3.75, S, 8);
  for (const y of [0.55, 1.0]) { const rl = shCyl(0.025, 0.025, 26.4, railM, -13.8, y, -3.75, S, 8); rl.rotation.z = Math.PI / 2; }
  // the island under the terminal and the barrier (kerbed, 0.15 m)
  shMesh(new THREE.BoxGeometry(2.4, 0.15, 0.75), shStd('#8f8b82', 0.85), -0.45, 0.075, 1.55, S);
  // ---- the barrier: a post (on the island) and its arm across the lane (red and white), down
  const postM = shStd('#d8b030', 0.5, 0.2);
  shMesh(new THREE.BoxGeometry(0.34, 1.05, 0.3), postM, E.xB, 0.15 + 0.525, 1.55, S);
  const armTex = shTex(shCanvas(512, 16, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#f2f0ea' : '#c8221c'; g.fillRect(i * w / 8, 0, w / 8, h); } }), { repeat: false });
  const arm = shMesh(new THREE.BoxGeometry(0.07, 0.09, 5.0), shStd('#ffffff', 0.5, 0, { map: armTex }), E.xB, 1.02, 1.55 - 0.2 - 2.5, S);
  // a red lamp on the post
  shMesh(new THREE.SphereGeometry(0.05, 12, 8), new THREE.MeshStandardMaterial({ color: '#601010', emissive: '#ff2a1a', emissiveIntensity: 2.5 }), E.xB, 0.15 + 1.1, 1.55, S).castShadow = false;
  // ---- the pay terminal (on the island, its screen toward the driver): "PLEASE WAIT"
  const term = new THREE.Group(); term.position.set(-0.95, 0.15, 1.5); term.rotation.y = -2.2; S.add(term);
  shMesh(new THREE.BoxGeometry(0.36, 1.32, 0.3), shStd('#2c3036', 0.5, 0.4), 0, 0.66, 0, term);
  shMesh(new THREE.BoxGeometry(0.42, 0.06, 0.36), shStd('#1c1f24', 0.5, 0.4), 0, 1.35, 0, term);
  const scrC = shCanvasTex(256, 160, (g, w, h, st) => {
    g.fillStyle = '#04110a'; g.fillRect(0, 0, w, h); g.fillStyle = '#5cff9a'; g.font = '700 30px monospace'; g.textAlign = 'center';
    g.fillText(st.l1, w / 2, 62); g.font = '600 22px monospace'; g.fillStyle = '#3ad07a'; g.fillText(st.l2, w / 2, 104);
  });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.15), new THREE.MeshBasicMaterial({ map: scrC.tex, color: new THREE.Color(1.6, 1.6, 1.6) })); scr.position.set(0, 1.08, 0.152); term.add(scr);
  shMesh(new THREE.BoxGeometry(0.12, 0.02, 0.02), shStd('#888', 0.4, 0.6), 0, 0.86, 0.16, term).castShadow = false;
  const scrGlow = new THREE.PointLight('#6dffa8', 0.6, 3, 2); scrGlow.position.set(-1.1, 1.25, 1.2); S.add(scrGlow);
  // ---- the exit sign over the lane (green, lit)
  const exT = shTex(shCanvas(512, 128, (g, w, h) => { g.fillStyle = '#0f8a46'; g.fillRect(0, 0, w, h); g.fillStyle = '#ecfff3'; g.font = '700 64px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('WAY OUT  →', w / 2, h / 2 + 3); }), { repeat: false });
  const exS = shMesh(new THREE.BoxGeometry(0.06, 0.3, 1.2), new THREE.MeshStandardMaterial({ map: exT, emissive: '#ffffff', emissiveMap: exT, emissiveIntensity: 1.2 }), -0.4, E.H - 0.55, -1.0, S); exS.castShadow = false;
  for (const dz of [-0.45, 0.45]) shMesh(new THREE.BoxGeometry(0.02, 0.36, 0.02), shStd('#555', 0.5, 0.5), -0.4, E.H - 0.2, -1.0 + dz, S).castShadow = false;
  // ---- the battens down the lane (off for the night), one still on far back
  const batM = shStd('#b8bab8', 0.5, 0.3), offM = new THREE.MeshStandardMaterial({ color: '#8a9096', roughness: 0.4, emissive: '#e6f2ff', emissiveIntensity: 0.0 });
  const onM = new THREE.MeshStandardMaterial({ color: '#dfe6ea', roughness: 0.4, emissive: '#e6f2ff', emissiveIntensity: 2.2 });
  for (let x = -27; x < -1; x += 4.8) { const on = Math.abs(x - -17.4) < 0.1; shMesh(new THREE.BoxGeometry(1.4, 0.06, 0.13), batM, x, E.H - 0.47, 0, S).castShadow = false; shMesh(new THREE.BoxGeometry(1.36, 0.035, 0.1), on ? onM : offM, x, E.H - 0.515, 0, S).castShadow = false; }
  const back = new THREE.PointLight('#e2ecff', 4.0, 14, 2); back.position.set(-17.4, E.H - 0.7, 0); S.add(back);
  // ---- THE LAMP: a bulkhead on the left wall (an oval cage over an opal lens), and its light (it casts)
  const bh = new THREE.Group(); bh.position.set(E.lamp[0], E.lamp[1], E.zL); S.add(bh);
  const lens = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#fff1d8', emissiveIntensity: 3.2 }));
  lens.scale.set(1.25, 0.8, 0.55); lens.rotation.x = Math.PI / 2; bh.add(lens); lens.castShadow = false;
  const rimB = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.018, 8, 28), shStd('#2a2c30', 0.5, 0.4)); rimB.scale.set(1.25, 0.8, 1); rimB.position.z = 0.01; bh.add(rimB); rimB.castShadow = false;
  for (const k of [-1, 0, 1]) { const b = shMesh(new THREE.BoxGeometry(0.012, 0.012, 0.1), shStd('#2a2c30', 0.5, 0.4), 0, 0, 0.05, bh); b.position.set(0, k * 0.06, 0.07); b.scale.set(25 * (1 - 0.35 * Math.abs(k)), 1, 1); b.castShadow = false; }
  const lamp = new THREE.SpotLight('#fff0d6', 0, 0, 1.18, 0.55, 2);
  lamp.position.set(E.lamp[0], E.lamp[1], E.lamp[2] + 0.12); lamp.target.position.set(-4.4, 0.9, E.zR);
  lamp.castShadow = true; lamp.shadow.mapSize.set(2048, 2048); lamp.shadow.camera.near = 0.3; lamp.shadow.camera.far = 16; lamp.shadow.bias = -0.0004; lamp.shadow.normalBias = 0.02; lamp.shadow.radius = 1.5;
  S.add(lamp); S.add(lamp.target);
  const lampFill = new THREE.PointLight('#fff0d6', 0.9, 5, 2); lampFill.position.set(E.lamp[0], E.lamp[1] + 0.2, E.zL + 0.5); S.add(lampFill);
  // ---- the street beyond the barrier: pavement, road (wet), the far side's shut shops, a sodium lamp
  const road = new THREE.Mesh(new THREE.PlaneGeometry(14, 80), new THREE.MeshStandardMaterial({ color: '#141518', roughness: 0.32, metalness: 0.1 })); road.rotation.x = -Math.PI / 2; road.position.set(E.xO + 8.6, -0.12, 0); road.receiveShadow = true; S.add(road);
  for (const x of [E.xO + 0.4, E.xO + 15.8]) { const pv = shMesh(new THREE.BoxGeometry(3.2, 0.12, 80), shStd('#4a4844', 0.85), x + 1.2, -0.06, 0, S); pv.castShadow = false; }
  const shopTex = shTex(shCanvas(1024, 256, (g, w, h) => {
    g.fillStyle = '#2a2622'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) { const x0 = 20 + i * 250; g.fillStyle = '#4a4c4e'; g.fillRect(x0, 110, 220, 146); g.strokeStyle = 'rgba(0,0,0,0.5)'; for (let y = 114; y < 256; y += 7) { g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + 220, y); g.stroke(); }
      g.fillStyle = ['#3a1a1a', '#1a2a3a', '#2a2a1a', '#1a1a1a'][i]; g.fillRect(x0, 70, 220, 34); }
    for (let i = 0; i < 6; i++) { const lit = i === 2; g.fillStyle = lit ? '#e6b066' : '#141414'; g.fillRect(40 + i * 165, 14, 90, 44); }
  }), { repeat: false });
  shMesh(new THREE.BoxGeometry(1, 12, 40), new THREE.MeshStandardMaterial({ color: '#ffffff', map: shopTex, roughness: 0.9, emissive: '#ffffff', emissiveMap: shopTex, emissiveIntensity: 0.05 }), E.xO + 19.5, 5.9, 0, S).castShadow = false;
  const sod = new THREE.PointLight('#ffad4a', 60, 30, 2); sod.position.set(E.xO + 3.0, 5.6, -3.5); S.add(sod);
  shCyl(0.07, 0.09, 5.8, shStd('#3a3c3e', 0.5, 0.5), E.xO + 2.6, 2.8, -3.5, S, 10);
  const sodHead = shMesh(new THREE.BoxGeometry(0.6, 0.12, 0.25), new THREE.MeshStandardMaterial({ color: '#ffd9a0', emissive: '#ffb050', emissiveIntensity: 3 }), E.xO + 2.95, 5.75, -3.5, S); sodHead.castShadow = false;
  // ---- your car (and the ghost frame: where it was a second ago), you, your late shadow, and the one in the back
  const car = shBuildCar('#8a1f22'); S.add(car.g);
  const ghost = new THREE.Group(); S.add(ghost);
  const ghostSeat = new THREE.Object3D(); ghostSeat.position.set(SH_SEAT.x, SH_SEAT.y, SH_SEAT.z); ghost.add(ghostSeat);
  const you = shNoShadow(shPerson('shYou', car.seat, { id: 'xyou' })); you.root.traverse((m) => m.layers.set(1));
  const late = shAsShadow(shPerson('shYou', ghostSeat, { id: 'xlate' }));
  const backer = shAsShadow(shPerson('shBack', car.back, { id: 'xback' }));
  const headL = new THREE.SpotLight('#fff2dc', 0, 30, 0.5, 0.6, 1.6); headL.position.set(0, 0.66, 1.9); headL.target.position.set(0, 0.2, 9); car.g.add(headL); car.g.add(headL.target);
  camera.layers.enable(0);
  const placeCar = (G, c) => { G.position.set(c.x, c.y, c.z); G.rotation.set(0, 0, 0); G.rotation.order = 'YXZ'; G.rotation.y = c.yaw; };
  const eyeAt = () => { car.g.updateMatrixWorld(true); const v = new THREE.Vector3(SH_SEAT.x + 0.02, 1.17, SH_SEAT.z + 0.04); car.g.localToWorld(v); return [v.x, v.y, v.z]; };

  set.frame = (t, shot) => {
    const s = shStoryAt(t), m = shot.mode, k = (t - shot.t0) / Math.max(1e-6, shot.t1 - shot.t0);
    set._s = s; set._mode = m;
    placeCar(car.g, SHC.ex(s)); placeCar(ghost, SHC.ex(s - 1));
    car.setLights(1, 1); headL.intensity = 26; car.door.rotation.y = 0;
    you.apply(SH_POSES.drive()); late.apply(SH_POSES.drive());
    // the one in the back: low behind your seat, then sitting up, slowly (only its shadow)
    const rk = MathX.smooth(s, SHE.rise[0], SHE.rise[1]);
    backer.apply(shBackPose(rk * rk * (3 - 2 * rk)));
    lamp.intensity = 210; lampFill.intensity = 0.9;
    scrC.update({ l1: s < SHE.exitStop + 0.5 ? 'INSERT TICKET' : 'PLEASE WAIT', l2: s < SHE.exitStop + 0.5 ? '' : shClockStr(s, false) + ' AM' });
    if (/POV$/.test(m)) camera.layers.disable(1); else camera.layers.enable(1);
    set.cams[m](t, s, k, shot);
  };
  set.cams = {
    // behind and to the right of the car (on the hatched strip): the car rolls up to the barrier; the wall beside it
    exitWide: (t, s, k) => { const d = shDrift(t, 0.015, 0.3, 5); shCam(camera, [-12.4 + d[0], 1.42 + d[1], 2.75 + d[2]], [-2.6, 0.82, 2.2], 44); },
    // the wall, side on, from just ahead of the car: the car's shadow, its window patches, your head a second late
    exitWall: (t, s, k) => { const d = shDrift(t, 0.01, 0.3, 6); shCam(camera, [-0.9 + d[0], 1.3 + d[1], 1.6 + d[2]], [-5.2, 0.72, 3.6], 50); },
    // between your car and the wall, close on the window patches: your head; the back seat
    exitClose: (t, s, k) => { const d = shDrift(t, 0.006, 0.25, 7); shCam(camera, [-2.2 + d[0], 1.2 + d[1], 1.55 + d[2]], [-4.45 - 0.1 * k, 0.72, E.zR], 48 - 3 * k); },
    // in your seat, looking out of your window at the wall (your body isn't drawn; your shadow is)
    exitPOV: (t, s, k) => { const h = eyeAt(); const d = shDrift(t, 0.006, 0.25, 8); shCam(camera, [h[0] + d[0], h[1] + d[1], h[2] + d[2]], [-4.15 - 0.15 * k, 0.86, E.zR], 60 - 4 * k); },
  };
  set.labels = () => [];
  set.grade = (t, p) => { p.exposure = 1.2; p.saturation = 0.84; p.contrast = 1.14; p.warmth = 0.02; p.blackLift = 0.004; p.vignette = 0.66; p.bloom = 0.5; p.bloomThreshold = 0.82; p.grain = 0.036; };
  return set;
}

SH_SETS.exit = (app) => shExitSet(app);
