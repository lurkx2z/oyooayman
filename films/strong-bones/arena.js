/* =====================================================================
   ARENA — the record, the nickname, the Olympic final, the loading door, the choice, the run and the catch.
   A dark hall with a lit platform in the middle; the crowd in tiers ahead (instanced, deterministic); the big screen
   above them; on the right wall a loading door open to the afternoon outside, where a scaffold tower stands and your
   sister (yellow) waits by it. The bar rides in camera space during the lift (your view rises with it).
   ===================================================================== */

const SB_A = {
  you: [0, 0, 1.0],              // where you stand at the bar
  door: { x: 13, z0: -3.2, z1: 3.2, h: 5.4 },
  scaf: [19.6, 0, 0.4],          // the scaffold's base (it tips toward the door, -x)
  sis: [17.6, 0, 2.0],
  catchAt: [16.4, 1.62, 0.8],    // where you are when you catch it
};

function sbArenaCam(shot, t) {
  const u = shot.t1 > shot.t0 ? sbClamp((t - shot.t0) / (shot.t1 - shot.t0)) : 0;
  switch (shot.id) {
    case 'lift': {                // crouched at the bar, rising with it
      const k = sbSmooth(t, SB.liftA, SB.liftB);
      const y = sbLerp(0.98, 1.58, k), look = sbLerp(-0.62, -0.08, k);
      return { pos: [0, y, 1.0], at: [0, y + look * 3, -2.0], fov: 60 };
    }
    case 'screen': { const k = sbEaseOut(u); return { pos: [0.4, 1.62, 1.0 - 0.3 * k], at: [0.2, 9.8, -27], fov: 46 - 6 * k }; }
    case 'final': {
      // behind the bar, walking up to it; then you turn to the loading door and the view tightens on the scaffold
      const w = sbEaseOut((t - shot.t0) / 2.6);
      const z = sbLerp(2.6, 1.15, w);
      const turn = sbSmooth(t, SB.pan - 0.05, SB.pan + 1.5);
      const ahead = new THREE.Vector3(0, 0.95, -6), door = new THREE.Vector3(SB_A.scaf[0] - 1.0, 2.6, SB_A.scaf[2]);
      const at = ahead.clone().lerp(door, turn);
      const fov = sbLerp(52, 30, sbSmooth(t, SB.pan + 1.2, SB.pan + 3.6));
      return { pos: [0.05, 1.64, z], at: at.toArray(), fov };
    }
    case 'hands': return { pos: [0, 1.62, 1.12], at: [0, 0.4, 0.05], fov: 52 };
    case 'look': { const k = sbEaseOut(u); return { pos: [0.05, 1.63, 1.12], at: [SB_A.scaf[0] - 1.2, 2.4 - 0.3 * k, SB_A.scaf[2]], fov: 34 - 4 * k }; }
    case 'run': {
      // a sprint to the door and out (≈ 15 m in 1.5 s: your legs got ten times stronger too), arms up at the end
      const k = sbEaseIn(sbClamp((t - SB.run) / (SB.catch - SB.run)));
      const P0 = new THREE.Vector3(0.05, 1.63, 1.12), P1 = new THREE.Vector3(...SB_A.catchAt);
      const pos = P0.clone().lerp(P1, k);
      const bob = Math.sin((t - SB.run) * 19) * 0.035 * (1 - sbSmooth(t, SB.catch - 0.25, SB.catch));
      pos.y += bob;
      const at = new THREE.Vector3(SB_A.scaf[0] - 1.6, sbLerp(1.9, 3.3, sbSmooth(t, SB.catch - 0.5, SB.catch)), SB_A.scaf[2] + 0.2);
      return { pos: pos.toArray(), at: at.toArray(), fov: sbLerp(56, 66, k), roll: Math.sin((t - SB.run) * 9.5) * 0.02 };
    }
  }
  return { pos: [0, 1.6, 1], at: [0, 1.4, -5], fov: 50 };
}

SB_SETS.arena = (app) => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#07080c');
  scene.fog = new THREE.Fog('#0a0b12', 18, 70);
  const cam = new THREE.PerspectiveCamera(50, 16 / 9, 0.03, 200); scene.add(cam);
  const R = new THREE.Group(); scene.add(R);
  const rng = sbRng(101);

  // hall: dark floor, the competition platform (wood centre, black rubber sides)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), sbMat('#16171c', { roughness: 0.75 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; R.add(floor);
  const plankTex = sbCanvasTex(512, 512, (g, w, h) => { g.fillStyle = '#b98a58'; g.fillRect(0, 0, w, h); const r = sbRng(5); for (let x = 0; x < w; x += 42) { const c = 150 + r() * 40; g.fillStyle = `rgb(${c + 40},${c},${c - 50})`; g.fillRect(x + 1, 0, 40, h); } });
  sbBox(4, 0.1, 4, sbMat('#1b1b1e', { roughness: 0.9 }), 0, 0.05, 0, R);
  sbBox(2.6, 0.012, 4, sbMat('#ffffff', { map: plankTex, roughness: 0.5 }), 0, 0.106, 0, R);
  // walls (dark), the right wall with the loading door
  const wallM = sbMat('#1c1e26', { roughness: 0.9 }), D = SB_A.door;
  sbBox(0.4, 14, 50, wallM, -14, 7, -5, R, { cast: false });
  sbBox(0.4, 14, 50 - (D.z1 + 30), wallM, D.x, 7, (D.z1 + 20) / 2 + 0.0, R, { cast: false });
  sbBox(0.4, 14, D.z0 + 30, wallM, D.x, 7, (D.z0 - 30) / 2, R, { cast: false });
  sbBox(0.4, 14 - D.h, D.z1 - D.z0, wallM, D.x, D.h + (14 - D.h) / 2, (D.z0 + D.z1) / 2, R, { cast: false });
  sbBox(0.5, 0.25, D.z1 - D.z0 + 0.3, sbMat('#c9a227', { roughness: 0.5 }), D.x - 0.05, D.h + 0.1, (D.z0 + D.z1) / 2, R);   // door header (hazard yellow)
  const rollerM = sbMat('#3b3f48', { roughness: 0.6, metalness: 0.4 });
  sbBox(0.6, 0.6, D.z1 - D.z0 + 0.6, rollerM, D.x - 0.3, D.h + 0.45, (D.z0 + D.z1) / 2, R);
  sbBox(28, 14, 0.4, wallM, 0, 7, 12, R, { cast: false });
  sbBox(28, 0.4, 70, sbMat('#0c0d12'), 0, 14, -10, R, { cast: false });
  // ceiling rig: trusses + lamps over the platform
  const trussM = sbMat('#2c2f36', { roughness: 0.6, metalness: 0.5 });
  for (const z of [-2.5, 2.5]) sbBox(12, 0.3, 0.3, trussM, 0, 9, z, R);
  const lampM = sbGlow('#fff2dc', 4);
  for (const x of [-3, -1, 1, 3]) for (const z of [-2.5, 2.5]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.35, 12), sbMat('#16171a')); l.position.set(x, 8.7, z); R.add(l); const g = new THREE.Mesh(new THREE.CircleGeometry(0.2, 12), lampM); g.rotation.x = Math.PI / 2; g.position.set(x, 8.52, z); R.add(g); }

  // the crowd: tiers ahead (z < -8) and on the left; instanced bodies + heads, muted colours, a few phones lit
  const tiers = new THREE.Group(); R.add(tiers);
  const stepM = sbMat('#22242c', { roughness: 0.9 });
  for (let i = 0; i < 12; i++) sbBox(26, 0.5 + i * 0.7, 1.1, stepM, 0, (0.5 + i * 0.7) / 2, -9 - i * 1.1, tiers, { cast: false });
  for (let i = 0; i < 10; i++) sbBox(1.1, 0.5 + i * 0.7, 26, stepM, -8 - i * 1.1, (0.5 + i * 0.7) / 2, -6, tiers, { cast: false });
  const seats = [];
  for (let i = 0; i < 12; i++) for (let x = -12.4; x <= 12.4; x += 0.62) seats.push([x + (rng() - 0.5) * 0.12, 0.5 + i * 0.7, -9 - i * 1.1, 0]);
  for (let i = 0; i < 10; i++) for (let z = -18; z <= 6; z += 0.62) seats.push([-8 - i * 1.1, 0.5 + i * 0.7, z + (rng() - 0.5) * 0.12, Math.PI / 2]);
  const bodyG = new THREE.CapsuleGeometry(0.2, 0.42, 3, 8), headG = new THREE.SphereGeometry(0.13, 10, 8);
  const bodyM = new THREE.MeshStandardMaterial({ roughness: 0.9 }), headM = new THREE.MeshStandardMaterial({ roughness: 0.8 });
  const bodies = new THREE.InstancedMesh(bodyG, bodyM, seats.length), heads = new THREE.InstancedMesh(headG, headM, seats.length);
  const pal = ['#5b3a3a', '#2f4a5e', '#3d4a3a', '#6b5a3a', '#4a3a5a', '#7a2f2f', '#2a2a32', '#8a8170', '#2f5a5a', '#b06a2a'], skins = ['#c99a7a', '#a8754f', '#7a5034', '#e2b896', '#5a3a24'];
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
  const crowd = seats.map((s, i) => {
    const sc = 0.9 + rng() * 0.2, ph = rng() * 10;
    bodyM && bodies.setColorAt(i, c.set(pal[Math.floor(rng() * pal.length)]));
    heads.setColorAt(i, c.set(skins[Math.floor(rng() * skins.length)]));
    return { s, sc, ph, stand: rng() };
  });
  tiers.add(bodies, heads);
  // a band of LED boards along the front of the tiers
  const ledTex = sbCanvasTex(1024, 64, (g, w, h) => { g.fillStyle = '#0b1a3a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2c230'; g.font = `700 40px ${SB_SANS}`; for (let x = 20; x < w; x += 340) g.fillText('WEIGHTLIFTING · FINAL', x, 46); });
  ledTex.wrapS = THREE.RepeatWrapping; ledTex.repeat.set(3, 1);
  const led = new THREE.Mesh(new THREE.PlaneGeometry(26, 0.7), new THREE.MeshBasicMaterial({ map: ledTex })); led.position.set(0, 0.36, -8.4); R.add(led);
  // the big screen above the crowd
  const scrTex = sbCanvasTex(1280, 540, () => {});
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(14, 5.9), new THREE.MeshBasicMaterial({ map: scrTex })); screen.position.set(0, 10.6, -24); R.add(screen);
  sbBox(14.4, 6.3, 0.3, sbMat('#0c0c0e'), 0, 10.6, -24.2, R);
  const drawScreen = (mode) => {
    const g = scrTex._g, w = 1280, h = 540;
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0e1a33'); gr.addColorStop(1, '#060a16'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.textAlign = 'center'; g.fillStyle = '#ffffff';
    if (mode === 'record') { g.font = `600 52px ${SB_SANS}`; g.fillText('CLEAN & JERK', w / 2, 120); g.font = `700 230px ${SB_SERIF}`; g.fillText('570 kg', w / 2, 360); g.fillStyle = '#ffcf8a'; g.font = `600 50px ${SB_SANS}`; g.fillText('WORLD RECORD  ·  267 kg', w / 2, 460); }
    else if (mode === 'nick') { g.fillStyle = '#ffcf8a'; g.font = `600 56px ${SB_SANS}`; g.fillText('THEY CALL HIM', w / 2, 150); g.fillStyle = '#ffffff'; g.font = `700 170px ${SB_SERIF}`; g.fillText('GLASS', w / 2, 320); g.fillText('HERCULES', w / 2, 480); }
    else { g.font = `600 58px ${SB_SANS}`; g.fillText('OLYMPIC FINAL · LAST LIFT', w / 2, 150); g.font = `700 200px ${SB_SERIF}`; g.fillStyle = '#f2c230'; g.fillText('FOR GOLD', w / 2, 380); }
    scrTex.needsUpdate = true; scrTex._mode = mode;
  };

  // the bar and the plates (in camera space while you hold it; on the platform otherwise)
  const barM = sbMat('#c8cbd0', { roughness: 0.25, metalness: 0.9 }), plateCols = ['#b8322a', '#2f5fa8', '#c9a227', '#2f7a3a'];
  const bar = new THREE.Group();
  const shaft = sbCyl(0.014, 0.014, 2.2, barM, 12); shaft.rotation.z = Math.PI / 2; bar.add(shaft);
  for (const s of [-1, 1]) {
    for (let k = 0; k < 5; k++) { const pl = sbCyl(0.225 - k * 0.02, 0.225 - k * 0.02, 0.05, sbMat(plateCols[k % 4], { roughness: 0.5 }), 28); pl.rotation.z = Math.PI / 2; pl.position.x = s * (0.72 + k * 0.055); bar.add(pl); }
    const collar = sbCyl(0.03, 0.03, 0.06, barM, 12); collar.rotation.z = Math.PI / 2; collar.position.x = s * 1.02; bar.add(collar);
  }
  R.add(bar);

  // outside the loading door: daylight, a yard, a low building, the scaffold tower and your sister
  const out = new THREE.Group(); R.add(out);
  const yard = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), sbMat('#8d8a82', { roughness: 0.95 })); yard.rotation.x = -Math.PI / 2; yard.position.set(D.x + 20, 0.005, 0); yard.receiveShadow = true; out.add(yard);
  const skyM = new THREE.MeshBasicMaterial({ map: sbCanvasTex(256, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6f8fc0'); gr.addColorStop(1, '#f1d6b0'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) });
  const skyP = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), skyM); skyP.position.set(D.x + 34, 12, 0); skyP.rotation.y = -Math.PI / 2; out.add(skyP);
  sbBox(10, 7, 14, sbMat('#b9a68e', { roughness: 0.9 }), D.x + 27, 3.5, -2, out);
  for (let i = 0; i < 5; i++) sbBox(1.0, 1.2, 0.05, sbMat('#2a3442', { roughness: 0.2, metalness: 0.4 }), D.x + 21.97, 2 + (i % 2) * 2.5, -6 + i * 2.6, out).rotation.y = Math.PI / 2;
  const scaf = new THREE.Group(); scaf.position.set(SB_A.scaf[0] - 0.75, 0, SB_A.scaf[2]); out.add(scaf);   // pivot: the base edge nearest the door
  const tubeM = sbMat('#a9adb3', { roughness: 0.35, metalness: 0.8 }), boardM = sbMat('#a77a3e', { roughness: 0.8 }), netM = sbMat('#2f6fb0', { roughness: 0.9, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
  const tube = (x0, y0, z0, x1, y1, z1) => { const a = new THREE.Vector3(x0, y0, z0), b = new THREE.Vector3(x1, y1, z1), L = a.distanceTo(b); const m = sbCyl(0.024, 0.024, L, tubeM, 8); m.position.copy(a).lerp(b, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); scaf.add(m); };
  for (const x of [0, 1.5]) for (const z of [-1.1, 1.1]) tube(x, 0, z, x, 6.3, z);
  for (let y = 0.2; y < 6.4; y += 1.55) { tube(0, y, -1.1, 1.5, y, -1.1); tube(0, y, 1.1, 1.5, y, 1.1); tube(0, y, -1.1, 0, y, 1.1); tube(1.5, y, -1.1, 1.5, y, 1.1); }
  for (let y = 0.2; y < 4.7; y += 1.55) { tube(0, y, -1.1, 1.5, y + 1.55, -1.1); tube(0, y, 1.1, 0, y + 1.55, -1.1); }
  for (const y of [1.75, 3.3, 4.85]) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 2.2), boardM); b.position.set(0.75, y + 0.03, 0); b.castShadow = true; scaf.add(b); }
  const net = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.4), netM); net.rotation.y = Math.PI / 2; net.position.set(1.52, 5.1, 0); scaf.add(net);
  const buckets = []; for (let i = 0; i < 3; i++) { const b = sbCyl(0.14, 0.12, 0.3, sbMat(i ? '#3a3f46' : '#c9a227'), 10); b.position.set(0.4 + i * 0.4, 4.88 + 0.15, -0.6 + i * 0.5); scaf.add(b); buckets.push(b); }
  const sis = new Person({ id: 'sb-sister-out', look: 'sbSister', path: [[0, SB_A.sis[0], SB_A.sis[2]]], states: [[0, 'idle']] }, scene);

  // light: hall dark, the platform lit hard from above; daylight through the door
  scene.add(new THREE.HemisphereLight('#4a5a80', '#120f10', 0.35));
  const key = new THREE.SpotLight('#ffe9cf', 340, 22, 0.42, 0.55, 1.4); key.position.set(0.5, 11, 3.5); key.target.position.set(0, 0, 0); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; scene.add(key, key.target);
  const crowdL = new THREE.SpotLight('#9fb6ff', 260, 40, 0.7, 0.8, 1.2); crowdL.position.set(0, 13, 4); crowdL.target.position.set(0, 2, -16); scene.add(crowdL, crowdL.target);
  const sun = new THREE.DirectionalLight('#fff0d8', 3.4); sun.position.set(D.x + 30, 22, 12); sun.target.position.set(D.x + 6, 0, 0); sun.castShadow = true;
  Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 70 }); sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005; scene.add(sun, sun.target);
  const spill = new THREE.PointLight('#ffe2bc', 28, 18, 1.4); spill.position.set(D.x - 0.5, 2.5, 0); scene.add(spill);
  const outAmb = new THREE.PointLight('#cfe0ff', 40, 30, 1.2); outAmb.position.set(D.x + 8, 9, 4); scene.add(outAmb);

  // the hands: gripping the bar (camera space), then reaching up to catch
  const hands = new ViewerHands(cam, { skin: '#c99a7a', sleeve: '#7a2328', cuff: '#5e1a1e', watch: false, script: { right: [[0, 'hidden']], left: [[0, 'hidden']] } });
  Object.assign(hands.poses, {
    grip: sbCamPose([0.27, -0.33, -0.5], [-0.05, -0.15, -1], [0, -1, 0.05], [1.45, 1.5, 1.5, 1.45], [1.2, 0.9], { trem: 0.0025 }),
    gripHigh: sbCamPose([0.27, -0.28, -0.45], [-0.05, 0.4, -1], [0, -0.6, 0.6], [1.45, 1.5, 1.5, 1.45], [1.2, 0.9], { trem: 0.0035 }),
    gripLook: sbCamPose([0.24, -0.3, -0.42], [-0.05, -0.2, -1], [0, -1, 0.05], [1.45, 1.5, 1.5, 1.45], [1.2, 0.9], { trem: 0.004 }),
    release: sbCamPose([0.3, -0.3, -0.44], [-0.05, -0.05, -1], [0, -1, 0.1], [0.2, 0.25, 0.3, 0.35], [0.6, 0.2], { trem: 0.002 }),
    reach: sbCamPose([0.2, 0.05, -0.38], [-0.05, 1, -0.55], [0, -0.15, -1], [0.3, 0.35, 0.4, 0.45], [0.7, 0.2], { trem: 0.004 }),
    catch: sbCamPose([0.17, 0.2, -0.36], [-0.15, 1, -0.2], [0, 0.1, -1], [1.3, 1.35, 1.4, 1.4], [1.0, 0.8], { trem: 0.012 }),
    'hidden@cut': HAND_POSES.hidden, 'grip@cut': null, 'gripLook@cut': null,
  });
  hands.poses['grip@cut'] = hands.poses.grip; hands.poses['gripLook@cut'] = hands.poses.gripLook;
  Object.assign(hands.blends, { grip: 0.3, gripHigh: 0.6, gripLook: 0.4, release: 0.35, reach: 0.4, catch: 0.18, 'hidden@cut': 0.001, 'grip@cut': 0.001, 'gripLook@cut': 0.001 });

  return {
    scene, camera: cam, cam, hands, bar, scaf, sis, screen, drawScreen, crowd, bodies, heads, buckets, key, R,
    frame(t, shot) {
      const S = this;
      if (!S._scripted) {
        const st = (id) => SB_SHOTS.find((s) => s.id === id).t0;
        hands.o.script = {
          right: [[-1, 'hidden'], [st('lift'), 'grip@cut'], [SB.liftA + 0.2, 'gripHigh'], [st('screen'), 'hidden@cut'], [st('hands'), 'gripLook@cut'], [SB.letGo, 'release'], [st('look'), 'hidden@cut'], [SB.catch - 0.45, 'reach'], [SB.catch - 0.12, 'catch']],
          left: [[-1, 'hidden'], [st('lift'), 'grip@cut'], [SB.liftA + 0.2, 'gripHigh'], [st('screen'), 'hidden@cut'], [st('hands'), 'gripLook@cut'], [SB.letGo + 0.12, 'release'], [st('look'), 'hidden@cut'], [SB.catch - 0.4, 'reach'], [SB.catch - 0.1, 'catch']],
        };
        S._scripted = true;
      }
      const C = sbArenaCam(shot, t);
      const shake = t > SB.catch ? Math.exp(-(t - SB.catch) * 5) * 0.09 : 0;
      const n = (k) => noise1(t * 0.7, k) * 0.01 + noise1(t * 23, k + 9) * shake;
      sbAim(cam, [C.pos[0] + n(1), C.pos[1] + n(2), C.pos[2] + n(3)], C.at, (C.roll || 0) + noise1(t * 0.5, 4) * 0.004 + noise1(t * 19, 5) * shake * 2);
      cam.fov = C.fov; cam.updateProjectionMatrix();
      hands.update(t);

      // the bar: in camera space during the lift; on the platform (or in your hands) otherwise
      if (shot.id === 'lift') {
        if (S.bar.parent !== cam) cam.add(S.bar);
        const k = sbSmooth(t, SB.liftA, SB.liftB);
        S.bar.position.set(0, sbLerp(-0.335, -0.27, k), sbLerp(-0.52, -0.47, k)); S.bar.rotation.set(0, 0, noise1(t * 3, 7) * 0.004);
      } else if (shot.id === 'hands' && t < SB.letGo) {
        if (S.bar.parent !== cam) cam.add(S.bar);
        S.bar.position.set(0, -0.31, -0.44); S.bar.rotation.set(0, 0, 0);
      } else {
        if (S.bar.parent !== S.R) S.R.add(S.bar);
        S.bar.position.set(0, 0.335, 0.62); S.bar.rotation.set(0, 0, 0);
        if (shot.id === 'hands' && t >= SB.letGo) { S.bar.position.set(0, 0.335, 0.62); }
      }

      // the screen
      const mode = shot.id === 'lift' ? 'record' : shot.id === 'screen' ? 'nick' : 'final';
      if (S._mode !== mode) { drawScreen(mode); S._mode = mode; }

      // the crowd: a slow sway; on its feet for the record and the nickname; still and quiet at the choice
      const cheer = shot.id === 'lift' ? sbSmooth(t, SB.liftB - 0.2, SB.liftB + 0.6) : shot.id === 'screen' ? 1 : 0;
      S.crowd.forEach((p, i) => {
        const [x, y, z, ry] = p.s, up = cheer * (p.stand > 0.25 ? 1 : 0);
        const hop = up * Math.max(0, Math.sin(t * 7 + p.ph)) * 0.08;
        const yy = y + 0.45 + up * 0.3 + hop;
        q.setFromEuler(new THREE.Euler(0, ry, Math.sin(t * 0.8 + p.ph) * 0.03));
        m4.compose(new THREE.Vector3(x, yy, z), q, new THREE.Vector3(p.sc, p.sc, p.sc)); S.bodies.setMatrixAt(i, m4);
        m4.compose(new THREE.Vector3(x, yy + 0.5 * p.sc, z), q, new THREE.Vector3(p.sc, p.sc, p.sc)); S.heads.setMatrixAt(i, m4);
      });
      S.bodies.instanceMatrix.needsUpdate = true; S.heads.instanceMatrix.needsUpdate = true;

      // the scaffold: leaning toward the door, held where you catch it
      const lean = MathX.deg(sbLeanDeg(t));
      S.scaf.rotation.z = lean;                          // (+z rotation tips its top toward -x: the door)
      S.buckets.forEach((b, i) => { const f = sbClamp((sbLeanDeg(t) - 8 - i * 3) / 12); b.position.x = 0.4 + i * 0.4 - f * 2.2; b.position.y = 5.03 - f * f * 4.6; b.rotation.z = f * 2.5; });

      // the sister: by the scaffold, looking at her phone; she looks up as it goes
      S.sis.update(t);
      S.sis.root.rotation.y = -Math.PI / 2 + 0.3;
      const P = ACTIONS.idle(t, { seed: S.sis.seed, seedI: S.sis.seedI });
      const up = sbSmooth(t, SB.lean + 1.2, SB.lean + 1.8);
      P.rSh = [0.55 - 0.3 * up, 0.1]; P.rEl = 1.6 - 1.0 * up; P.lSh = [0.4 * (1 - up) + 0.9 * up, 0.15 + 0.3 * up]; P.lEl = 1.5 - 0.6 * up; P.neck = 0.3 * (1 - up) - 0.5 * up;
      S.sis.apply(P);
    },
    grade(t, p, shot) {
      p.saturation = 1.0; p.contrast = 1.12; p.vignette = 0.62; p.bloom = 0.45; p.bloomThreshold = 0.85; p.warmth = -0.02;
      if (shot.id === 'run' && t > SB.catch) { p.flash = Math.max(0, 1 - (t - SB.catch) / 0.18) * 0.85; p.chroma = 0.6 * Math.exp(-(t - SB.catch) * 4); }
    },
  };
};
