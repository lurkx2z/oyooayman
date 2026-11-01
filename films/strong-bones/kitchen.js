/* =====================================================================
   KITCHEN — the everyday hook (jar, mug, the sister), the rule (your own hand), and a week later (casts, the letter).
   Two cameras share the room: camA (your hands) and camB (your hands in casts). Each has its own ViewerHands; the
   inactive pair is hidden. Props that are held are parented to a hand; the moment they break loose is replayed from
   the pose the hand had at that instant (computed once at build), so everything is a pure function of time.
   ===================================================================== */

LOOKS.sbSister = { skin: 2, build: 'slim', shirt: '#e9b52e', sleeves: 'long', pants: '#2a3140', shoes: '#e6e2da', sole: '#f0ede6', hair: '#1d130d', hairStyle: 'pony', jacket: true, hood: true, inner: '#f3e2b0' };

const SB_K = {
  jar: [0.0, 0.925, 0.2],      // jar base centre
  mug: [0.24, 0.925, 0.17],    // mug base centre
  sis: [-0.12, 0, -0.98],      // the sister, behind the island
};

// the kitchen's camera for each shot: [pos, lookAt, fov]
function sbKitchenCam(shot, t) {
  const u = shot.t1 > shot.t0 ? (t - shot.t0) / (shot.t1 - shot.t0) : 0;
  switch (shot.id) {
    case 'jar': return [[0.02, 1.5, 0.92], [0.0, 0.97, 0.16], 46];
    case 'mug': return [[0.06, 1.5, 0.92], [0.17, 0.99, 0.14], 46];
    case 'sister': { const k = sbEaseOut(u); return [[0.1 - 0.05 * k, 1.56, 1.0 - 0.32 * k], [-0.1, 1.38, -1.0], 44 - 6 * k]; }
    case 'arm': return [[0.0, 1.56, 1.0], [0.35, 1.2, -1.2], 46];
    case 'after': { const k = sbEaseOut(u); return [[0.02, 1.3, 1.05 - 0.12 * k], [0.05, 1.05, -0.9], 48]; }
    case 'letter': { const k = sbEaseOut(u); return [[0.02, 1.3, 0.93 - 0.03 * k], [0.0, 0.98, 0.2], 46]; }
  }
  return [[0, 1.55, 1], [0, 1.2, -1], 46];
}


SB_SETS.kitchen = (app) => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#1a1418');
  scene.fog = new THREE.Fog('#1a1418', 9, 22);
  const camA = new THREE.PerspectiveCamera(46, 16 / 9, 0.03, 60), camB = new THREE.PerspectiveCamera(46, 16 / 9, 0.03, 60);
  scene.add(camA, camB);

  /* ---------- the room ---------- */
  const R = new THREE.Group(); scene.add(R);
  const floorTex = sbCanvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#6b4b36'; g.fillRect(0, 0, w, h);
    const r = sbRng(7);
    for (let y = 0; y < h; y += 64) for (let x = (y / 64) % 2 ? -100 : 0; x < w; x += 256) {
      const c = 90 + r() * 30; g.fillStyle = `rgb(${c + 20},${c - 8},${c - 34})`; g.fillRect(x + 2, y + 2, 252, 60);
    }
  });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(4, 4);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), sbMat('#ffffff', { map: floorTex, roughness: 0.55 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; R.add(floor);
  const wallM = sbMat('#c9b9a6', { roughness: 0.92 }), tileM = sbMat('#e8e2d6', { roughness: 0.4 });
  sbBox(8, 2.8, 0.1, wallM, 0, 1.4, -2.55, R, { cast: false });
  sbBox(0.1, 2.8, 8, wallM, -3.2, 1.4, 0, R, { cast: false });
  sbBox(0.1, 2.8, 8, wallM, 3.2, 1.4, 0, R, { cast: false });
  sbBox(8, 0.1, 8, sbMat('#d8cfc2', { roughness: 0.95 }), 0, 2.8, 0, R, { cast: false });
  sbBox(8, 2.8, 0.1, wallM, 0, 1.4, 3.6, R, { cast: false });
  // back counter, splashback tiles, upper cabinets, window
  const cabM = sbMat('#2f4a4c', { roughness: 0.6 }), topM = sbMat('#e9e4da', { roughness: 0.25 }), handleM = sbMat('#c9b48a', { roughness: 0.3, metalness: 0.8 });
  sbBox(5.2, 0.88, 0.62, cabM, 0, 0.44, -2.18, R);
  sbBox(5.26, 0.05, 0.66, topM, 0, 0.905, -2.18, R);
  for (let i = 0; i < 8; i++) { const x = -2.27 + i * 0.65; sbBox(0.6, 0.8, 0.02, sbMat('#355456', { roughness: 0.55 }), x, 0.46, -1.86, R); sbBox(0.18, 0.02, 0.03, handleM, x, 0.8, -1.84, R); }
  sbBox(5.2, 0.7, 0.02, tileM, 0, 1.28, -2.49, R, { cast: false });
  for (const x of [-2.0, -1.35, 1.35, 2.0]) { sbBox(0.62, 0.72, 0.36, cabM, x, 2.05, -2.32, R); sbBox(0.02, 0.2, 0.03, handleM, x + 0.26, 1.78, -2.13, R); }
  // the window: dusk (and, a week later, night)
  const sky = (top, mid, low, sun) => sbCanvasTex(256, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(0.55, mid); gr.addColorStop(1, low); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    if (sun) { const s = g.createRadialGradient(150, 190, 4, 150, 190, 90); s.addColorStop(0, 'rgba(255,214,150,0.95)'); s.addColorStop(1, 'rgba(255,170,90,0)'); g.fillStyle = s; g.fillRect(0, 0, w, h); }
    g.fillStyle = 'rgba(20,16,28,0.92)'; const r = sbRng(3);
    for (let x = 0; x < w;) { const bw = 18 + r() * 34, bh = 30 + r() * 70; g.fillRect(x, h - bh, bw, bh); x += bw + 2; }
  });
  const skyDusk = sky('#3b2f5e', '#a0607a', '#f2a65a', true), skyNight = sky('#070a18', '#141a34', '#2a2340', false);
  const winM = new THREE.MeshBasicMaterial({ map: skyDusk });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.95), winM); win.position.set(0, 1.62, -2.49); R.add(win);
  const frameM = sbMat('#f1ece2', { roughness: 0.5 });
  sbBox(1.6, 0.06, 0.08, frameM, 0, 2.12, -2.46, R); sbBox(1.6, 0.06, 0.08, frameM, 0, 1.13, -2.46, R);
  sbBox(0.06, 1.0, 0.08, frameM, -0.78, 1.62, -2.46, R); sbBox(0.06, 1.0, 0.08, frameM, 0.78, 1.62, -2.46, R); sbBox(0.04, 1.0, 0.06, frameM, 0, 1.62, -2.46, R);
  // fridge, a plant, a kettle, a fruit bowl
  sbBox(0.8, 1.9, 0.7, sbMat('#cfd2d0', { roughness: 0.3, metalness: 0.3 }), -2.7, 0.95, -2.1, R);
  sbBox(0.03, 0.6, 0.04, handleM, -2.36, 1.3, -1.74, R);
  const pot = sbCyl(0.09, 0.07, 0.16, sbMat('#b5643e'), 12); pot.position.set(1.0, 1.0, -2.2); R.add(pot);
  for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.32, 5), sbMat('#3f6b3a')); l.position.set(1.0 + Math.sin(i) * 0.05, 1.2, -2.2 + Math.cos(i) * 0.05); l.rotation.set(Math.sin(i * 2) * 0.4, 0, Math.cos(i * 3) * 0.4); R.add(l); }
  const kettle = sbCyl(0.08, 0.1, 0.2, sbMat('#2b2b2e', { roughness: 0.3, metalness: 0.6 }), 16); kettle.position.set(-1.0, 1.03, -2.2); R.add(kettle);
  // the TV (a week later: the result)
  const tvTex = sbCanvasTex(640, 360, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#162238'); gr.addColorStop(1, '#0b1020'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f2c230'; g.beginPath(); g.arc(110, 180, 58, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#7a5a10'; g.font = `700 54px ${SB_SERIF}`; g.textAlign = 'center'; g.fillText('1', 110, 198);
    g.textAlign = 'left'; g.fillStyle = '#ffffff'; g.font = `600 30px ${SB_SANS}`; g.fillText('WEIGHTLIFTING · FINAL', 200, 120);
    g.font = `700 64px ${SB_SERIF}`; g.fillText('GOLD: ARANDA', 200, 200);
    g.fillStyle = '#ffcf8a'; g.font = `600 28px ${SB_SANS}`; g.fillText('“GLASS HERCULES” DID NOT FINISH', 200, 262);
  });
  sbBox(1.24, 0.74, 0.05, sbMat('#111'), 1.75, 1.62, -2.47, R);
  const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 0.66), new THREE.MeshBasicMaterial({ map: tvTex })); tvScreen.position.set(1.75, 1.62, -2.44); R.add(tvScreen);
  const tvOff = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 0.66), sbMat('#0b0c0e', { roughness: 0.2 })); tvOff.position.set(1.75, 1.62, -2.439); R.add(tvOff);

  // the island (you stand in front of it, the sister behind)
  sbBox(2.2, 0.88, 0.9, sbMat('#33504f', { roughness: 0.6 }), 0, 0.44, 0, R);
  const islandTop = sbBox(2.3, 0.05, 1.0, sbMat('#ece6db', { roughness: 0.22 }), 0, 0.9, 0, R);
  // a fruit bowl and a cutting board, so the counter isn't empty
  const bowl = sbCyl(0.16, 0.1, 0.08, sbMat('#e4dccd', { roughness: 0.4 }), 18); bowl.position.set(-0.62, 0.965, -0.12); R.add(bowl);
  const fr = sbRng(11);
  for (let i = 0; i < 5; i++) { const o = new THREE.Mesh(new THREE.IcosahedronGeometry(0.045, 1), sbMat(i % 2 ? '#d9822b' : '#b8322a', { roughness: 0.5 })); o.position.set(-0.62 + (fr() - 0.5) * 0.14, 1.02 + fr() * 0.03, -0.12 + (fr() - 0.5) * 0.14); o.castShadow = true; R.add(o); }
  sbBox(0.42, 0.02, 0.28, sbMat('#a77a4e', { roughness: 0.7 }), 0.62, 0.935, -0.1, R);
  // pendant lamps
  const shadeM = sbMat('#1f2a2a', { roughness: 0.5, side: THREE.DoubleSide }), bulbM = sbGlow('#ffd9a0', 3);
  for (const x of [-0.55, 0.55]) {
    const cord = sbCyl(0.004, 0.004, 0.7, sbMat('#111'), 4); cord.position.set(x, 2.45, 0); R.add(cord);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.2, 18, 1, true), shadeM); shade.position.set(x, 2.05, 0); R.add(shade);
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), bulbM); b.position.set(x, 1.98, 0); R.add(b);
  }

  /* ---------- light ---------- */
  const hemi = new THREE.HemisphereLight('#ffe2c4', '#3a2c2a', 0.75); scene.add(hemi);
  const key = new THREE.SpotLight('#ffd6a2', 26, 7, 0.95, 0.6, 1.6); key.position.set(0.2, 2.6, 0.5); key.target.position.set(0, 0.9, 0); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.01; scene.add(key, key.target);
  const winLight = new THREE.PointLight('#f0a070', 6, 6, 1.6); winLight.position.set(0, 1.6, -1.9); scene.add(winLight);
  const fill = new THREE.PointLight('#8aa0d0', 2.2, 8, 1.4); fill.position.set(-2, 2.2, 2.5); scene.add(fill);

  /* ---------- props ---------- */
  const glassM = new THREE.MeshStandardMaterial({ color: '#dfeff0', roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.32, depthWrite: false });
  const glassEdgeM = new THREE.MeshStandardMaterial({ color: '#f4fbfb', roughness: 0.02, metalness: 0.1, transparent: true, opacity: 0.55 });
  const jamM = sbMat('#9a1f2b', { roughness: 0.25 });
  const lidM = sbMat('#c9a447', { roughness: 0.32, metalness: 0.75 });
  const JR = 0.048, JH = 0.135, RIM = 0.026;
  const jar = new THREE.Group(); jar.position.set(...SB_K.jar); R.add(jar);
  const jarBody = new THREE.Mesh(new THREE.CylinderGeometry(JR, JR, JH - RIM, 28, 1, true), glassM); jarBody.position.y = (JH - RIM) / 2; jar.add(jarBody);
  const jarBottom = new THREE.Mesh(new THREE.CylinderGeometry(JR, JR, 0.006, 28), glassEdgeM); jarBottom.position.y = 0.003; jar.add(jarBottom);
  const jam = new THREE.Mesh(new THREE.CylinderGeometry(JR * 0.93, JR * 0.93, JH * 0.66, 24), jamM); jam.position.y = JH * 0.33 + 0.004; jam.castShadow = true; jar.add(jam);
  const label = new THREE.Mesh(new THREE.CylinderGeometry(JR * 1.01, JR * 1.01, 0.05, 28, 1, true), new THREE.MeshStandardMaterial({ map: sbCanvasTex(256, 64, (g, w, h) => {
    g.fillStyle = '#efe4c8'; g.fillRect(0, 0, w, h); g.fillStyle = '#7a1c22'; g.font = `700 30px ${SB_SERIF}`; g.textAlign = 'center'; g.fillText('CHERRY', w / 4, 42); g.fillText('CHERRY', 3 * w / 4, 42);
  }), roughness: 0.7 }));
  label.position.y = 0.05; jar.add(label);
  // the jagged break left on the jar (shown once the rim has gone)
  const jag = new THREE.Group(); jag.position.y = JH - RIM; jar.add(jag);
  for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2, s = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.006 + ((i * 7) % 5) * 0.003, 3), glassEdgeM); s.position.set(Math.cos(a) * JR, 0.003, Math.sin(a) * JR); jag.add(s); }
  // the lid + the glass rim it takes with it (one group: it rides in your right hand from the start)
  const lidG = new THREE.Group();
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(JR + 0.004, JR + 0.004, 0.022, 28), lidM); lid.position.y = RIM + 0.011; lid.castShadow = true; lidG.add(lid);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(JR, JR, RIM, 28, 1, true), glassEdgeM); rim.position.y = RIM / 2; lidG.add(rim);
  const rimJag = new THREE.Group(); lidG.add(rimJag);
  for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2 + 0.1, s = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.005 + ((i * 5) % 4) * 0.003, 3), glassEdgeM); s.rotation.x = Math.PI; s.position.set(Math.cos(a) * JR, -0.002, Math.sin(a) * JR); rimJag.add(s); }
  lidG.position.set(SB_K.jar[0], SB_K.jar[1] + JH - RIM, SB_K.jar[2]); R.add(lidG);
  // glass chips that fly at the break
  const chips = [], cr = sbRng(21);
  for (let i = 0; i < 14; i++) {
    const c = new THREE.Mesh(new THREE.TetrahedronGeometry(0.004 + cr() * 0.004), glassEdgeM); R.add(c);
    const a = cr() * Math.PI * 2; chips.push({ m: c, vx: Math.cos(a) * (0.25 + cr() * 0.5), vz: Math.sin(a) * (0.25 + cr() * 0.5), vy: 0.4 + cr() * 0.8, spin: cr() * 20 });
  }
  // the mug (body + handle); the body rides in the hand until it drops off the handle
  const mugM = sbMat('#e8e1d3', { roughness: 0.35 }), coffeeM = sbMat('#3a2416', { roughness: 0.15 });
  const MR = 0.042, MH = 0.095;
  const mugBody = new THREE.Group();
  const mb = new THREE.Mesh(new THREE.CylinderGeometry(MR, MR * 0.92, MH, 28), mugM); mb.position.y = MH / 2; mb.castShadow = true; mugBody.add(mb);
  const cof = new THREE.Mesh(new THREE.CylinderGeometry(MR * 0.88, MR * 0.88, 0.004, 24), coffeeM); cof.position.y = MH - 0.012; mugBody.add(cof);
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(MR * 1.005, MR * 1.005, 0.012, 28, 1, true), sbMat('#2f4a4c')); stripe.position.y = MH * 0.72; mugBody.add(stripe);
  const mugHandle = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.0075, 8, 16, Math.PI * 1.15), mugM); mugHandle.castShadow = true;
  const handleBase = new THREE.Group(); handleBase.add(mugHandle); mugHandle.rotation.z = -Math.PI * 0.575; mugHandle.position.set(MR + 0.004, 0, 0);
  const mugRoot = new THREE.Group(); mugRoot.add(mugBody); mugRoot.add(handleBase); handleBase.position.y = MH * 0.52;
  mugRoot.position.set(...SB_K.mug); R.add(mugRoot);
  // the coffee splash on the counter (grows once the mug lands)
  const splash = new THREE.Mesh(new THREE.CircleGeometry(1, 24), sbMat('#2b190e', { roughness: 0.08, transparent: true, opacity: 0.92 }));
  splash.rotation.x = -Math.PI / 2; splash.position.set(SB_K.mug[0] - 0.02, 0.927, SB_K.mug[2] + 0.02); splash.visible = false; R.add(splash);
  // the letter (in camB's space)
  const letterTex = sbCanvasTex(900, 1200, (g, w, h) => {
    g.fillStyle = '#f4efe4'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#20262c'; g.font = `600 34px ${SB_SANS}`; g.fillText('OSTEON LABS', 80, 120);
    g.fillStyle = '#8a8172'; g.font = `500 26px ${SB_SANS}`; g.fillText('BONE & TISSUE ENGINEERING', 80, 160);
    g.fillStyle = '#20262c'; g.font = `500 44px ${SB_SERIF}`; g.fillText('Dear Glass Hercules,', 80, 300);
    g.font = `700 64px ${SB_SERIF}`;
    ['We can build you', 'bones that', 'keep up.'].forEach((s, i) => g.fillText(s, 80, 440 + i * 84));
    g.font = `italic 600 64px ${SB_SERIF}`; g.fillStyle = '#7a1c22'; g.fillText('Interested?', 80, 750);
    g.fillStyle = '#5a5246'; g.font = `500 36px ${SB_SERIF}`; g.fillText('Bring the casts.', 80, 880);
    g.strokeStyle = '#20262c'; g.lineWidth = 3; g.beginPath(); g.moveTo(80, 1010); g.bezierCurveTo(160, 960, 220, 1060, 330, 990); g.stroke();
  });
  const letter = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.28), new THREE.MeshStandardMaterial({ map: letterTex, roughness: 0.9, side: THREE.DoubleSide }));
  camB.add(letter);

  /* ---------- the sister ---------- */
  const sis = new Person({ id: 'sb-sister', look: 'sbSister', path: [[0, SB_K.sis[0], SB_K.sis[2]]], states: [[0, 'idle']] }, scene);

  /* ---------- hands ---------- */
  const handsA = new ViewerHands(camA, { skin: '#c99a7a', sleeve: '#26323f', cuff: '#1d2630', watch: true, script: { right: [[0, 'hidden']], left: [[0, 'hidden']] } });
  const handsB = new ViewerHands(camB, { skin: '#c99a7a', sleeve: '#eeeae1', cuff: '#e2ddd2', sleeveLen: 0.5, sleeveFit: 1.15, watch: false, script: { right: [[0, 'hidden']], left: [[0, 'hidden']] } });

  // poses for each shot, from the shot's camera
  const J = SB_K.jar, top = J[1] + JH - RIM, M = SB_K.mug, place = (cam, id, t) => { const [p, a, f] = sbKitchenCam({ id, t0: t, t1: t + 1 }, t); sbAim(cam, p, a); cam.fov = f; cam.updateProjectionMatrix(); };
  const P = {};
  place(camA, 'jar', 0);
  {
    const Fr = new THREE.Vector3(-0.55, -0.15, -1).normalize(); const w = new THREE.Vector3(J[0], top + 0.045, J[2]).addScaledVector(Fr, -0.052);
    P.lid = sbHandPose(camA, 1, w.toArray(), Fr.toArray(), [0, -1, 0.12], [0.95, 1.0, 1.05, 1.1], [1.0, 0.55]);
    const F2 = new THREE.Vector3(-0.85, -0.15, -0.6).normalize(), w2 = new THREE.Vector3(J[0], top + 0.045, J[2]).addScaledVector(F2, -0.052);
    P.lidTwist = sbHandPose(camA, 1, w2.toArray(), F2.toArray(), [0.05, -1, 0.1], [0.95, 1.0, 1.05, 1.1], [1.0, 0.55]);
    P.lidUp = sbHandPose(camA, 1, [J[0] + 0.1, top + 0.2, J[2] + 0.17], [-0.6, 0.35, -0.8], [0.0, -0.45, 0.9], [0.95, 1.0, 1.05, 1.1], [1.0, 0.55]);
    P.jarBody = sbHandPose(camA, -1, [J[0] - 0.105, J[1] + 0.06, J[2] + 0.04], [1, 0.25, -0.45], [0.85, 0, 0.5], [1.05, 1.1, 1.15, 1.2], [0.8, 0.5]);
    P.jarDrop = sbHandPose(camA, -1, [J[0] - 0.16, J[1] + 0.12, J[2] + 0.12], [0.8, 0.5, -0.3], [0.5, -0.2, 0.8], [0.4, 0.45, 0.5, 0.55], [0.6, 0.3]);
  }
  place(camA, 'mug', 0);
  {
    const hx = M[0] + MR + 0.03, hy = M[1] + MH * 0.52;
    P.mugGrip = sbHandPose(camA, 1, [hx + 0.02, hy - 0.005, M[2] + 0.085], [-0.25, 0.05, -1], [-1, 0, 0.15], [1.25, 1.3, 1.35, 1.4], [0.9, 0.7]);
    P.mugUp = sbHandPose(camA, 1, [hx + 0.0, hy + 0.17, M[2] + 0.14], [-0.3, 0.1, -1], [-1, 0, 0.2], [1.25, 1.3, 1.35, 1.4], [0.9, 0.7]);
    P.mugAfter = sbHandPose(camA, 1, [hx + 0.03, hy + 0.21, M[2] + 0.2], [-0.35, 0.35, -0.9], [-0.8, 0.2, 0.6], [1.25, 1.3, 1.35, 1.4], [0.9, 0.7]);
  }
  P.look = HAND_POSES.look;
  P.fist = sbCamPose([0.06, -0.12, -0.36], [-0.1, 1, -0.3], [0, 0.3, 1], [1.5, 1.6, 1.6, 1.55], [1.1, 0.8], { trem: 0.0035 });
  P.lookRel = sbCamPose([0.075, -0.11, -0.37], [-0.12, 1, -0.32], [0, 0.29, 1], [0.12, 0.1, 0.18, 0.26], [0.75, 0.08], { trem: 0.0016 });
  // a week later: arms in casts on the counter, then the letter
  place(camB, 'after', 0);
  P.castRest = sbHandPose(camB, 1, [0.17, 0.955, 0.38], [-0.25, -0.05, -1], [0, -1, 0], [0.3, 0.35, 0.4, 0.45], [0.4, 0.2]);
  P.castRestL = sbHandPose(camB, -1, [-0.19, 0.955, 0.4], [0.3, -0.05, -1], [0, -1, 0], [0.3, 0.35, 0.4, 0.45], [0.4, 0.2]);
  P.letterR = sbCamPose([0.135, -0.235, -0.4], [-0.15, 1, 0.05], [-1, 0, -0.1], [0.55, 0.6, 0.65, 0.7], [0.3, 0.15]);
  letter.position.set(0, -0.15, -0.42); letter.rotation.set(-0.35, 0, 0);
  for (const k of Object.keys(P)) P[k + '@cut'] = P[k];                // the same pose with no blend: for a cut
  Object.assign(handsA.poses, P); Object.assign(handsB.poses, P);
  for (const k of Object.keys(P)) if (k.endsWith('@cut')) { handsA.blends[k] = 0.001; handsB.blends[k] = 0.001; }
  Object.assign(handsA.blends, { lid: 0.3, lidTwist: 0.35, lidUp: 0.22, jarBody: 0.3, jarDrop: 0.4, mugGrip: 0.3, mugUp: 0.5, mugAfter: 0.3, lookRel: 0.5, fist: 0.9, look: 0.5 });
  Object.assign(handsB.blends, { castRest: 0.4, castRestL: 0.4, letterR: 0.6 });

  return {
    scene, camera: camA, camA, camB, handsA, handsB, sis, letter, jar, lidG, jag, rim, chips, mugBody, handleBase, mugRoot, splash, tvOff, winM, skyDusk, skyNight,
    P, JH, RIM, MH, R, _lidLocal: null, _mugW: null, frame: sbKitchenFrame,
    // the held props' poses at the moment they break loose (computed once, from the hands at that instant)
    _prep(shotJar, shotMug) {
      if (this._lidLocal) return;
      const tmp = new THREE.Matrix4();
      place(camA, 'jar', 0); handsA.update(SB.lid - 0.001); handsA.right.g.updateWorldMatrix(true, false);
      this._lidLocal = tmp.copy(handsA.right.g.matrixWorld).invert().multiply(new THREE.Matrix4().compose(lidG.position.clone(), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1))).clone();
      place(camA, 'mug', 0); handsA.update(SB.mugUp - 0.3); handsA.right.g.updateWorldMatrix(true, false);
      this._mugLocal = tmp.copy(handsA.right.g.matrixWorld).invert().multiply(new THREE.Matrix4().compose(mugRoot.position.clone(), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1))).clone();
      handsA.update(SB.mug); handsA.right.g.updateWorldMatrix(true, false);
      this._mugW = new THREE.Matrix4().copy(handsA.right.g.matrixWorld).multiply(this._mugLocal);
    },
  };
};

// the kitchen's hand scripts (film seconds), set once the shots are known
function sbKitchenScripts(set) {
  const st = (id) => SB_SHOTS.find((s) => s.id === id).t0;
  set.handsA.o.script = {
    right: [[-1, 'lid@cut'], [SB.lid - 0.55, 'lidTwist'], [SB.lid, 'lidUp'], [st('mug'), 'mugGrip@cut'], [SB.mugUp, 'mugUp'], [SB.mug, 'mugAfter'], [st('sister'), 'hidden@cut'],
      [st('arm'), 'lookRel@cut'], [SB.fist, 'fist']],
    left: [[-1, 'jarBody@cut'], [SB.lid + 0.12, 'jarDrop'], [st('mug'), 'hidden@cut']],
  };
  set.handsB.o.script = { right: [[-1, 'hidden'], [st('after'), 'castRest@cut'], [st('letter'), 'letterR@cut']], left: [[-1, 'hidden'], [st('after'), 'castRestL@cut'], [st('letter'), 'letterR@cut']] };
  set.handsA.poses['hidden@cut'] = HAND_POSES.hidden; set.handsA.blends['hidden@cut'] = 0.001;
}

function sbKitchenFrame(t, shot, app) {
  const S = this, late = shot.id === 'after' || shot.id === 'letter';
  if (!S._scripted) { sbKitchenScripts(S); S._prep(); S._scripted = true; }
  const cam = late ? S.camB : S.camA;
  S.camera = cam;
  S.handsA.root.visible = !late; S.handsB.root.visible = late;
  const [p, a, f] = sbKitchenCam(shot, t);
  const still = shot.id === 'jar' || shot.id === 'mug';
  const hx = still ? 0 : noise1(t * 0.6, 41) * 0.012, hy = still ? 0 : noise1(t * 0.5, 42) * 0.008;
  sbAim(cam, [p[0] + hx, p[1] + hy, p[2]], a, still ? 0 : noise1(t * 0.4, 43) * 0.006);
  cam.fov = f; cam.updateProjectionMatrix();
  S.handsA.update(t); S.handsB.update(t);
  const H = S.handsA.right.g; H.updateWorldMatrix(true, false);

  // the jar: the lid turns, then comes off in your hand with the top of the glass
  const broke = t >= SB.lid;
  S.jag.visible = broke;
  if (!broke) {
    if (S.lidG.parent !== S.R) S.R.add(S.lidG);
    S.lidG.matrixAutoUpdate = true;
    S.lidG.position.set(SB_K.jar[0], SB_K.jar[1] + S.JH - S.RIM, SB_K.jar[2]);
    S.lidG.rotation.set(0, -0.6 * sbSmooth(t, SB.lid - 0.55, SB.lid - 0.05), 0);
  } else {
    if (S.lidG.parent !== H) H.add(S.lidG);
    S.lidG.matrixAutoUpdate = false; S.lidG.matrix.copy(S._lidLocal); S.lidG.matrixWorldNeedsUpdate = true;
  }
  const jarTop = new THREE.Vector3(SB_K.jar[0], SB_K.jar[1] + S.JH - S.RIM, SB_K.jar[2]);
  S.chips.forEach((c, i) => {
    const u = t - SB.lid;
    c.m.visible = broke && u < 6;
    if (!c.m.visible) return;
    const tl = Math.min(u, 0.9);
    const y = jarTop.y + c.vy * tl - 4.9 * tl * tl;
    c.m.position.set(jarTop.x + c.vx * tl * 0.4, Math.max(0.93, y), jarTop.z + c.vz * tl * 0.4);
    c.m.rotation.set(c.spin * tl, c.spin * 0.7 * tl, 0);
  });

  // the mug: lifted by its handle, then the mug drops off it
  const tg = SB.mugUp - 0.3;
  if (t < tg) {
    if (S.mugRoot.parent !== S.R) S.R.add(S.mugRoot);
    S.mugRoot.matrixAutoUpdate = true; S.mugRoot.position.set(...SB_K.mug); S.mugRoot.rotation.set(0, 0, 0);
  } else {
    if (S.mugRoot.parent !== H) H.add(S.mugRoot);
    S.mugRoot.matrixAutoUpdate = false; S.mugRoot.matrix.copy(S._mugLocal); S.mugRoot.matrixWorldNeedsUpdate = true;
  }
  if (t < SB.mug) {
    if (S.mugBody.parent !== S.mugRoot) S.mugRoot.add(S.mugBody);
    S.mugBody.position.set(0, 0, 0); S.mugBody.rotation.set(0, 0, 0);
    S.splash.visible = false;
  } else {
    if (S.mugBody.parent !== S.R) S.R.add(S.mugBody);
    const pos = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
    S._mugW.decompose(pos, q, sc);
    const u = t - SB.mug, drop = pos.y - 0.927, tf = Math.sqrt(2 * Math.max(0.001, drop) / 9.81);
    const y = u < tf ? pos.y - 4.9 * u * u : 0.927;
    const tip = sbEaseOut((u - tf) / 0.28);
    S.mugBody.position.set(pos.x - 0.03 * tip, y + 0.03 * tip, pos.z + 0.01 * tip);
    S.mugBody.quaternion.copy(q);
    if (u > tf) S.mugBody.rotateZ(1.35 * tip);
    S.splash.visible = u > tf;
    const r = 0.03 + 0.11 * sbEaseOut((u - tf) / 0.5);
    S.splash.scale.set(r * 1.3, r, 1);
  }

  // the TV and the window: a week later it's night and the TV has the result
  S.tvOff.visible = !late;
  S.winM.map = late ? S.skyNight : S.skyDusk;

  // the sister (yellow): surprised, then (a week later) arms folded, then "thank you"
  S.sis.update(t);
  S.sis.root.rotation.y = 0.05;
  const P = ACTIONS.idle(t, { seed: S.sis.seed, seedI: S.sis.seedI });
  if (shot.id === 'jar' || shot.id === 'mug' || shot.id === 'sister' || shot.id === 'arm') {
    const k = sbSmooth(t, SB.mug + 0.1, SB.mug + 0.6);
    P.spine += 0.12 * k; P.lSh = [0.15 + 0.45 * k, 0.12 + 0.2 * k]; P.rSh = [0.15 + 0.45 * k, 0.12 + 0.2 * k]; P.lEl = 0.25 + 1.0 * k; P.rEl = 0.25 + 1.0 * k;
    P.neck += 0.12 * k; P.headRoll = 0.08 * k * Math.sin(t * 0.8);
  } else {
    const th = sbSmooth(t, sbS('sis2') + 1.3, sbS('sis2') + 1.9);
    P.lSh = [0.72, 0.18]; P.rSh = [0.72, 0.18]; P.lEl = 2.05; P.rEl = 2.05; P.neck += 0.22 * th; P.headRoll = 0.05;
  }
  S.sis.apply(P);
}
