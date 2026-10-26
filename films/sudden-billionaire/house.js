/* =====================================================================
   HOUSE — the glass house on the hill over the city (bought in month two), and everything the film does there:
     house     in through the front door: the hall (two floors of doors), the living room, the glass wall, the view
     garage    the new car under the strip lights
     six       month six: breakfast at the kitchen island, the morning city through the glass
     brick     (the same morning, slower: a housekeeper wipes the island; the study's numbers on the right)
     enough    the terrace at dusk, the pool's edge, the city lighting up
     compare   night on the terrace: across the valley, a bigger house
     views     the sofa at night: the TV, the remote; you change the channel
     wall      the gate: it slides shut; a guard; the road outside
     years     years five to nine, sped up: days and nights flick past the glass
     note      the garage: a box from the old flat; the note inside, faded
     pledge    the glass wall at night, the city below
   Layout (metres): the living room x −9…5, z −6…3 (the glass wall at z = −6, the terrace and pool beyond it, the city
   90 m below to −z); the hall x 5…11 (front door at z = 4); the garage is its own room at x 20…32; the drive and the
   gate are in front of the house (+z), the gate at z = 36.
   ===================================================================== */

// a low coupe for the garage (a film-side profile next to the shared ones, in the same format)
CAR_PROFILES.sbSuper = {
  L: 4.55, W: 1.98, r: 0.34, axles: [1.15, 3.8], yb: 0.16,
  top: [[0.05, 0.22], [0.0, 0.45], [0.06, 0.86], [0.5, 0.95], [1.3, 0.97], [3.2, 0.92], [4.0, 0.84], [4.4, 0.7], [4.55, 0.52], [4.5, 0.24]],
  gh: [[1.2, 0.96], [1.95, 1.2], [2.55, 1.22], [3.45, 0.9]],
  win: [[[2.0, 1.0], [2.08, 1.15], [2.55, 1.17], [3.1, 1.0]]],
  rearGlass: [0, 1], windshield: [2, 3], head: 0.6, tail: 0.72, grille: false, lightBar: true,
};
const SB_HO = { glassZ: -6, garage: [26, 0, 0], gateZ: 36, rival: [-330, -12, -420], lapse: 2.1 };

// ---- textures ---------------------------------------------------------------------------------------------------------
function sbHoStoneCanvas(base, line, seed) {
  // big polished tiles (1.2 m), faint veins; the canvas is 2.4 m square
  const r = new RNG(seed);
  return sbCanvas(1024, 1024, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(120,110,100,${r.range(0.03, 0.09)})`; g.lineWidth = r.range(1, 3); g.beginPath(); let x = r.range(0, w), y = r.range(0, h); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += r.range(-90, 90); y += r.range(-40, 40); g.lineTo(x, y); } g.stroke(); }
    g.fillStyle = line; g.fillRect(0, 0, w, 2); g.fillRect(0, h / 2, w, 2); g.fillRect(0, 0, 2, h); g.fillRect(w / 2, 0, 2, h);
  });
}
function sbHoMarbleCanvas() {
  const r = new RNG(CONFIG.seed + 640);
  return sbCanvas(1024, 512, (g, w, h) => {
    g.fillStyle = '#efece6'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(110,105,110,${r.range(0.06, 0.2)})`; g.lineWidth = r.range(0.6, 2.4); g.beginPath(); let x = r.range(-100, w), y = r.range(0, h); g.moveTo(x, y); for (let k = 0; k < 10; k++) { x += r.range(10, 70); y += r.range(-30, 30); g.lineTo(x, y); } g.stroke(); }
  });
}
// the city's windows: a facade map (day) and its lit windows (night) in one canvas pair
function sbHoFacadeCanvas(lit) {
  const r = new RNG(CONFIG.seed + (lit ? 651 : 650));
  return sbCanvas(256, 512, (g, w, h) => {
    g.fillStyle = lit ? '#000' : '#8a8c90'; g.fillRect(0, 0, w, h);
    for (let y = 6; y < h; y += 12) for (let x = 5; x < w; x += 10) {
      const v = r.next();
      if (lit) { if (v < 0.36) { g.fillStyle = v < 0.07 ? '#c8d8ff' : `rgb(255,${190 + Math.floor(40 * r.next())},${110 + Math.floor(50 * r.next())})`; g.fillRect(x, y, 6, 7); } }
      else { g.fillStyle = `rgba(40,52,66,${0.5 + 0.35 * v})`; g.fillRect(x, y, 6, 7); }
    }
  });
}
function sbHoTvDraw(g, w, h, s) {
  const T = (txt, x, y, size, col, weight = 700, align = 'left', font = SB_FONT) => { g.font = `${weight} ${size}px ${font}`; g.fillStyle = col; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(txt, x, y); };
  if (s.ch === 1) {
    // a debate: two lecterns, a question on the bar
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a3446'); gr.addColorStop(1, '#141a26'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (const x of [0.28, 0.72]) { g.fillStyle = '#3e4a60'; g.fillRect(w * x - 70, h * 0.48, 140, 170); g.fillStyle = '#c9a24a'; g.fillRect(w * x - 70, h * 0.48, 140, 8); g.fillStyle = '#1a1e26'; g.beginPath(); g.arc(w * x, h * 0.36, 40, 0, 7); g.fill(); g.fillRect(w * x - 60, h * 0.4, 120, 60); }
    g.fillStyle = '#b8332a'; g.fillRect(0, h - 120, 200, 56); T('DEBATE', 100, h - 92, 30, '#fff', 800, 'center');
    g.fillStyle = '#f2f0ea'; g.fillRect(200, h - 120, w - 200, 56); T('SHOULD THE RICHEST PAY MORE TAX?', 220, h - 92, 30, '#14181f', 800);
  } else {
    // the channel you switch to: an opinion show, a man at a desk, "lower taxes at the top", a phone-in poll
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#3a2a22'); gr.addColorStop(1, '#14100e'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,200,120,0.08)'; for (let i = 0; i < 7; i++) g.fillRect(80 + i * 130, 0, 60, h * 0.7);
    g.fillStyle = '#1a1e26'; g.beginPath(); g.arc(w * 0.36, h * 0.33, 52, 0, 7); g.fill(); g.beginPath(); g.ellipse(w * 0.36, h * 0.6, 130, 90, 0, Math.PI, 0); g.fill(); g.fillRect(w * 0.36 - 130, h * 0.6, 260, 40);
    g.fillStyle = '#5a3a2a'; g.fillRect(w * 0.12, h * 0.62, w * 0.5, 60); g.fillStyle = '#c9a24a'; g.fillRect(w * 0.12, h * 0.62, w * 0.5, 6);
    // the poll
    g.fillStyle = 'rgba(10,12,16,0.85)'; g.fillRect(w * 0.66, 70, 300, 210); T('VIEWERS\' POLL', w * 0.66 + 20, 104, 24, '#ffcf8a', 800);
    T('AGREE', w * 0.66 + 20, 160, 26, '#fff', 700); g.fillStyle = '#3a6ae8'; g.fillRect(w * 0.66 + 130, 146, 150 * 0.71, 28); T('71%', w * 0.66 + 130 + 150 * 0.71 + 8, 160, 22, '#fff', 700);
    T('DISAGREE', w * 0.66 + 20, 224, 26, '#fff', 700); g.fillStyle = '#8a8c90'; g.fillRect(w * 0.66 + 130, 210, 150 * 0.29, 28); T('29%', w * 0.66 + 130 + 150 * 0.29 + 8, 224, 22, '#fff', 700);
    g.fillStyle = '#2a4ab0'; g.fillRect(0, h - 120, 220, 56); T('OPINION', 110, h - 92, 30, '#fff', 800, 'center');
    g.fillStyle = '#f2f0ea'; g.fillRect(220, h - 120, w - 220, 56); T('LOWER TAXES AT THE TOP HELP EVERYONE', 240, h - 92, 30, '#14181f', 800);
  }
}
// the box from the old flat
function sbHoBoxCanvas() {
  return sbCanvas(512, 256, (g, w, h) => {
    g.fillStyle = '#b08a5a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(80,50,20,${0.05 * hash1(i)})`; g.fillRect(hash1(i * 3) * w, hash1(i * 7) * h, 30, 1); }
    g.fillStyle = 'rgba(200,180,120,0.5)'; g.fillRect(0, h * 0.45, w, 30);
    g.fillStyle = '#1e1e28'; g.font = '700 64px "Permanent Marker", "Comic Sans MS", cursive'; g.textAlign = 'center'; g.fillText('OLD FLAT', w / 2, h * 0.36);
    g.font = '700 30px "Comic Sans MS", cursive'; g.fillText('misc · kitchen', w / 2, h * 0.82);
  });
}

// a tree: round clumps of leaves on a trunk (as on the streets); a potted plant: long leaves round a stem
function sbHoTree(x, y, z, s, parent) {
  const t = new THREE.Group(), bark = sbStd('#4a3a2c', 0.9), leaf = sbStd('#46602f', 0.85), leaf2 = sbStd('#5f7a3a', 0.85);
  sbCyl(0.12 * s, 0.17 * s, 3.2 * s, bark, 0, 1.6 * s, 0, t, 8);
  for (let i = 0; i < 7; i++) { const a = i * 2.4, r = (i ? 1.1 : 0) * s; sbMesh(new THREE.IcosahedronGeometry((1.35 - 0.1 * (i % 3)) * s, 1), i % 2 ? leaf : leaf2, Math.cos(a) * r, (4.0 + 0.6 * (i % 3)) * s, Math.sin(a) * r, t); }
  t.position.set(x, y, z); parent.add(t); return t;
}
function sbHoPlant(x, z, s, parent) {
  const g = new THREE.Group(), leafM = sbStd('#3e5a2c', 0.7), leafM2 = sbStd('#557236', 0.7);
  sbCyl(0.26 * s, 0.2 * s, 0.55 * s, sbStd('#2a2826', 0.5, 0.1), 0, 0.275 * s, 0, g, 20);
  sbCyl(0.015 * s, 0.02 * s, 1.1 * s, sbStd('#5a4430', 0.8), 0, 1.0 * s, 0, g, 6);
  for (let i = 0; i < 16; i++) { const a = i * 2.39, h = (0.75 + 0.75 * (i / 16)) * s, r = (0.18 + 0.1 * sbR(i, 4)) * s;
    const l = sbMesh(new THREE.SphereGeometry(1, 10, 6), i % 2 ? leafM : leafM2, Math.cos(a) * r, h, Math.sin(a) * r, g); l.scale.set(0.16 * s, 0.025 * s, 0.09 * s); l.rotation.set(0.3 * Math.sin(i), -a, -0.5 + 0.3 * sbR(i, 7)); }
  g.position.set(x, 0, z); parent.add(g); return g;
}

SB_SETS.house = (app) => {
  const S = sbSet(app, { sky: '#9ab4d4', fov: 55, near: 0.05, far: 6000, fog: 0.00042, fogColor: '#b8c6d4', hemi: ['#d6e2f0', '#8a7a66', 0.7],
    sun: [-60, 80, -40], sunColor: '#fff1dc', sunI: 2.6, shadow: 2048, shadowR: 22, shadowFar: 260 });
  const { scene, camera: cam, sun, hemi } = S;
  sun.target.position.set(-2, 0, -3);
  const sky = sbSky(scene, '#4f7fb8', '#c6d6e6', '#8a8680', { sunDir: [-0.6, 0.6, -0.5], sunGlow: '#fff2d8', hw: 0.3 });
  const envDay = sbEnv(app.renderer, '#a8c0dc', '#e2dcd2', '#7a6e60'), envNight = sbEnv(app.renderer, '#10141e', '#2a2622', '#100e0c'), envDusk = sbEnv(app.renderer, '#5a5a8a', '#e09a6a', '#3a2e2a');
  scene.environment = envDay;
  const W = SB_W, K = sbK, GZ = SB_HO.glassZ;
  const B = (w, h, d, m, x, y, z, parent) => sbBox(w, h, d, m, x, y, z, parent || null);
  const puffs = sbPuffs(scene, 4200, { additive: true, soft: 1.5 });

  // ---- materials
  const oakTex = sbTex(sbWoodCanvas(CONFIG.seed + 605, 256, 1024, [138, 100, 70])); oakTex.repeat.set(7, 2.2);
  const floorM = sbStd('#ffffff', 0.32, 0, { map: oakTex, envMapIntensity: 0.6 });
  const travTex = sbTex(sbHoStoneCanvas('#c9bba6', 'rgba(120,104,86,0.55)', CONFIG.seed + 602)); travTex.repeat.set(2.5, 3);
  const travM = sbStd('#ffffff', 0.7, 0, { map: travTex });
  const deckTex = sbTex(sbHoStoneCanvas('#a89e8e', 'rgba(80,72,64,0.6)', CONFIG.seed + 601)); deckTex.repeat.set(20 / 2.4, 8 / 2.4);
  const deckM = sbStd('#ffffff', 0.7, 0, { map: deckTex });
  const plasterM = sbStd('#f0ede6', 0.9, 0), ceilM = sbStd('#f6f4ef', 0.95, 0), darkWood = sbStd('#ffffff', 0.45, 0, { map: sbTex(sbWoodCanvas(CONFIG.seed + 620, 256, 1024, [70, 48, 34])) });
  const marbleM = sbStd('#ffffff', 0.12, 0, { map: sbTex(sbHoMarbleCanvas(), { repeat: false }), envMapIntensity: 1.1 }), blackM = sbStd('#141416', 0.4, 0.3), brassM = sbStd('#c4a060', 0.28, 0.9);
  const glassM = new THREE.MeshPhysicalMaterial({ color: '#dfe8ee', roughness: 0.02, metalness: 0, transparent: true, opacity: 0.1, envMapIntensity: 1.2, side: THREE.DoubleSide });
  const lightM = sbStd('#ffffff', 0.4, 0, { emissive: '#fff2dc', emissiveIntensity: 1.4 });

  // =================================================================================== the living room and kitchen
  const LX0 = -9, LX1 = 5, LZ1 = 3, LH = 4.2;
  const floor = sbMesh(new THREE.PlaneGeometry(LX1 - LX0, LZ1 - GZ).rotateX(-Math.PI / 2), floorM, (LX0 + LX1) / 2, 0, (GZ + LZ1) / 2); floor.castShadow = false;
  B(LX1 - LX0, 0.2, LZ1 - GZ, ceilM, (LX0 + LX1) / 2, LH + 0.1, (GZ + LZ1) / 2);
  B(6.2, LH, 0.2, plasterM, LX1 + 3, LH / 2, GZ); B(6.2, 0.2, 2.2, ceilM, LX1 + 3, LH + 0.1, GZ + 1);        // (beside the glass, under the hall)
  B(0.2, LH, LZ1 - GZ, plasterM, LX0 - 0.1, LH / 2, (GZ + LZ1) / 2);           // the TV wall
  B(LX1 - LX0, LH, 0.2, plasterM, (LX0 + LX1) / 2, LH / 2, LZ1 + 0.1);         // the kitchen's back wall
  // the wall to the hall (an opening z −2…2, 3 m high)
  B(0.25, LH, -2 - GZ, plasterM, LX1, LH / 2, (GZ - 2) / 2); B(0.25, LH, LZ1 - 2, plasterM, LX1, LH / 2, (2 + LZ1) / 2); B(0.25, LH - 3, 4, plasterM, LX1, 3 + (LH - 3) / 2, 0);
  // the glass wall: panes, slim black mullions, a sill
  const gw = new THREE.Group(); scene.add(gw);
  for (let x = LX0; x < LX1 + 0.01; x += 2.8) B(0.06, LH, 0.1, blackM, x, LH / 2, GZ, gw);
  B(LX1 - LX0, 0.08, 0.14, blackM, (LX0 + LX1) / 2, LH - 0.04, GZ, gw); B(LX1 - LX0, 0.05, 0.14, blackM, (LX0 + LX1) / 2, 0.025, GZ, gw);
  const pane = sbMesh(new THREE.PlaneGeometry(LX1 - LX0, LH), glassM, (LX0 + LX1) / 2, LH / 2, GZ); pane.castShadow = false; pane.receiveShadow = false; pane.renderOrder = 6;
  // recessed lights in the ceiling (and the few real lights they stand for)
  for (let x = LX0 + 1.4; x < LX1; x += 2.8) for (const z of [-3.6, -0.6, 2.0]) sbMesh(new THREE.CylinderGeometry(0.07, 0.07, 0.01, 16), lightM, x, LH - 0.005, z).castShadow = false;
  const roomL = [[-6, 3.6, -1.5], [-1, 3.6, -1.5], [2.5, 3.6, 1.2], [-6, 3.6, 1.8]].map(([x, y, z]) => { const L = new THREE.PointLight('#ffe0b8', 0, 12, 1.6); L.position.set(x, y, z); scene.add(L); return L; });
  // the kitchen: tall dark cabinets, a hood, the island (marble on dark wood), stools, an espresso machine, fruit
  B(LX1 - 1.6 - 0.4, 2.6, 0.65, darkWood, (0.4 + LX1 - 1.6) / 2 - 0.4, 1.3, LZ1 - 0.33);
  B(LX1 - 1.6 - 0.4, 0.04, 0.68, marbleM, (0.4 + LX1 - 1.6) / 2 - 0.4, 0.92, LZ1 - 0.68);
  const ISL = [1.4, 0.5];
  B(3.6, 0.88, 1.1, darkWood, ISL[0], 0.44, ISL[1]); B(3.8, 0.06, 1.25, sbStd('#1c1b1d', 0.22, 0.1, { envMapIntensity: 1.2 }), ISL[0], 0.91, ISL[1]);  // a black stone top
  for (const dx of [-1.1, 1.1]) { sbCyl(0.2, 0.2, 0.06, sbStd('#2a2420', 0.6), ISL[0] + dx, 0.72, ISL[1] + 0.95); sbCyl(0.02, 0.02, 0.7, brassM, ISL[0] + dx, 0.36, ISL[1] + 0.95); sbCyl(0.18, 0.2, 0.02, brassM, ISL[0] + dx, 0.01, ISL[1] + 0.95); }
  { const fb = sbMesh(new THREE.SphereGeometry(0.16, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), sbStd('#e8e4dc', 0.3), ISL[0] + 1.1, 1.1, ISL[1] + 0.1);
    for (let i = 0; i < 6; i++) sbMesh(new THREE.SphereGeometry(0.045, 12, 8), sbStd(['#d84a2a', '#e8b23a', '#7aa83a'][i % 3], 0.5), ISL[0] + 1.1 + Math.cos(i) * 0.07, 1.0, ISL[1] + 0.1 + Math.sin(i) * 0.07); }
  B(0.3, 0.38, 0.35, sbStd('#c8ccd0', 0.25, 0.9), 3.2, 1.13, LZ1 - 0.5);
  // breakfast at the island: a plate (eggs, toast), a fork, a cup with its steam
  const bfast = new THREE.Group(); bfast.position.set(ISL[0] - 0.2, 0.94, ISL[1] + 0.3); scene.add(bfast);
  { const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.015, 32), sbStd('#f8f6f2', 0.25)); bfast.add(plate);
    for (const [x, z] of [[-0.03, 0.02], [0.05, -0.03]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.01, 20), sbStd('#fbfaf6', 0.4)); w.position.set(x, 0.012, z); bfast.add(w); const y = new THREE.Mesh(new THREE.SphereGeometry(0.02, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), sbStd('#f2a81e', 0.3)); y.position.set(x, 0.015, z); bfast.add(y); }
    const toast = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.012, 0.1), sbStd('#c8904a', 0.8)); toast.position.set(0.0, 0.016, 0.07); toast.rotation.y = 0.4; bfast.add(toast);
    const fork = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.004, 0.18), sbStd('#c9ced3', 0.2, 1)); fork.position.set(0.17, 0.0, 0.0); bfast.add(fork);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.036, 0.09, 24), sbStd('#f4f2ee', 0.3)); cup.position.set(-0.24, 0.045, -0.06); bfast.add(cup);
    const cof = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.004, 24), sbStd('#3a2416', 0.2)); cof.position.set(-0.24, 0.085, -0.06); bfast.add(cof); }
  // the living room: an L-shaped sofa, a low table, a rug, the TV on the wall, a painting, a floor lamp
  const sofaM = sbStd('#d8d0c4', 0.95, 0), rugM = sbStd('#8a8478', 0.98, 0);
  sbMesh(new THREE.PlaneGeometry(4.4, 3.4).rotateX(-Math.PI / 2), rugM, -6.2, 0.005, -1.6).castShadow = false;
  sbMesh(sbRoundBox(1.0, 0.42, 3.4, 0.12, 0.05), sofaM, -4.2, 0, -1.6); sbMesh(sbRoundBox(0.28, 0.42, 3.4, 0.1, 0.05), sofaM, -3.75, 0.42, -1.6);
  sbMesh(sbRoundBox(2.4, 0.42, 0.95, 0.12, 0.05), sofaM, -5.5, 0, -3.35); sbMesh(sbRoundBox(2.4, 0.42, 0.26, 0.1, 0.05), sofaM, -5.5, 0.42, -3.7);
  B(1.4, 0.32, 0.8, darkWood, -6.1, 0.16, -1.5);
  const tvTex = sbCanvasTex(1024, 576, sbHoTvDraw);
  const tv = new THREE.Group(); tv.position.set(LX0 + 0.06, 1.65, -1.6); tv.rotation.y = Math.PI / 2; scene.add(tv);
  { const b = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.43, 0.05), blackM); tv.add(b); const sc = new THREE.Mesh(new THREE.PlaneGeometry(2.44, 1.37), new THREE.MeshBasicMaterial({ map: tvTex.tex })); sc.position.z = 0.03; tv.add(sc); tv.userData.sc = sc; }
  const tvL = new THREE.PointLight('#9ab0ff', 0, 7, 1.5); tvL.position.set(LX0 + 1.4, 1.6, -1.6); scene.add(tvL);
  const artTex = sbTex(sbCanvas(512, 340, (g, w, h) => { g.fillStyle = '#e9e2d4'; g.fillRect(0, 0, w, h); const c = ['#c2452a', '#1f3a5a', '#d8a83a', '#2a2a2a']; for (let i = 0; i < 9; i++) { g.fillStyle = c[i % 4]; g.globalAlpha = 0.85; g.beginPath(); g.arc(hash1(i * 3) * w, hash1(i * 5) * h, 30 + 70 * hash1(i * 7), 0, 7); g.fill(); } g.globalAlpha = 1; }), { repeat: false });
  sbMesh(new THREE.PlaneGeometry(2.4, 1.6), sbStd('#ffffff', 0.8, 0, { map: artTex }), -3.5, 2.2, LZ1 - 0.01).rotation.y = Math.PI;
  { sbCyl(0.015, 0.015, 1.7, brassM, -7.8, 0.85, -4.4); const sh = sbMesh(new THREE.CylinderGeometry(0.2, 0.26, 0.3, 24, 1, true), sbStd('#f2e8d4', 0.8, 0, { emissive: '#ffd9a0', emissiveIntensity: 0, side: THREE.DoubleSide }), -7.8, 1.75, -4.4); scene.userData.floorShade = sh; }
  // the remote (in your hand at night)
  const hands = sbHands(cam, { right: [[-1, 'hidden'], [SB.views + 0.2, 'remote'], [SB.channel - 0.2, 'remoteP'], [SB.channel + 0.3, 'remote'], [SB.yacht, 'hidden']], left: [[-1, 'hidden']] }, { sleeve: '#2a2c34', cuff: '#1e2026' });

  // =================================================================================== the hall
  const HX0 = 5, HX1 = 11, HZ0 = -4, HZ1 = 4, HH = 7;
  sbMesh(new THREE.PlaneGeometry(HX1 - HX0, HZ1 - HZ0).rotateX(-Math.PI / 2), floorM, (HX0 + HX1) / 2, 0.001, 0).castShadow = false;
  B(HX1 - HX0, 0.2, HZ1 - HZ0, ceilM, (HX0 + HX1) / 2, HH + 0.1, 0);
  B(0.2, HH, HZ1 - HZ0, plasterM, HX1 + 0.1, HH / 2, 0); B(HX1 - HX0, HH, 0.2, travM, (HX0 + HX1) / 2, HH / 2, HZ0 - 0.1);
  sbMesh(new THREE.PlaneGeometry(2.2, 6.6).rotateX(-Math.PI / 2), sbStd('#5a2e2a', 0.98, 0, { map: sbTex(sbCanvas(128, 384, (g, w, h) => { g.fillStyle = '#6a3430'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c9a26a'; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20); g.lineWidth = 2; g.strokeRect(22, 22, w - 44, h - 44); }), { repeat: false }) }), 7.6, 0.006, 0.2).castShadow = false;
  B(0.25, HH - LH, HZ1 - HZ0, plasterM, HX0, LH + (HH - LH) / 2, 0);
  B(2.5, HH, 0.2, plasterM, HX0 + 1.25, HH / 2, HZ1 + 0.1); B(1.5, HH, 0.2, plasterM, HX1 - 0.75, HH / 2, HZ1 + 0.1); B(2.0, HH - 3.2, 0.2, plasterM, HX0 + 3.5, 3.2 + (HH - 3.2) / 2, HZ1 + 0.1);
  // the front door (tall, dark wood) and the light outside it
  const fdoor = B(1.9, 3.2, 0.1, darkWood, HX0 + 3.5, 1.6, HZ1 + 0.1); sbCyl(0.02, 0.02, 1.2, brassM, HX0 + 4.2, 1.4, HZ1 - 0.0);
  // the gallery upstairs (a walkway along the back wall) and its doors; doors downstairs (the bathrooms, among them)
  B(HX1 - HX0, 0.25, 1.8, plasterM, (HX0 + HX1) / 2, 3.5, HZ0 + 0.9); B(HX1 - HX0, 1.0, 0.04, glassM, (HX0 + HX1) / 2, 4.12, HZ0 + 1.8); B(HX1 - HX0, 0.05, 0.06, brassM, (HX0 + HX1) / 2, 4.62, HZ0 + 1.8);
  const doorM = darkWood;
  const sconceM = sbStd('#fff4e0', 0.4, 0, { emissive: '#ffd9a0', emissiveIntensity: 1.6 });
  for (let i = 0; i < 4; i++) { B(0.9, 2.2, 0.06, doorM, HX0 + 0.9 + i * 1.45, 3.62 + 1.1, HZ0 + 0.03); sbMesh(new THREE.SphereGeometry(0.03, 10, 8), brassM, HX0 + 1.2 + i * 1.45, 4.65, HZ0 + 0.08); B(0.14, 0.05, 0.01, brassM, HX0 + 0.9 + i * 1.45, 5.3, HZ0 + 0.07);
    if (i < 3) { B(0.1, 0.3, 0.08, sconceM, HX0 + 1.62 + i * 1.45, 4.9, HZ0 + 0.05).castShadow = false; B(0.1, 0.3, 0.08, sconceM, HX0 + 1.62 + i * 1.45, 1.9, HZ0 + 0.05).castShadow = false; } }
  // (downstairs, along the right wall: three more doors)
  for (let i = 0; i < 3; i++) { const d = B(0.06, 2.3, 0.95, doorM, HX1 - 0.03, 1.15, -2.9 + i * 1.5); d.castShadow = false; sbMesh(new THREE.SphereGeometry(0.03, 10, 8), brassM, HX1 - 0.08, 1.05, -2.6 + i * 1.5); }
  const hallSconceL = new THREE.PointLight('#ffd9a0', 0, 7, 1.6); hallSconceL.position.set((HX0 + HX1) / 2, 4.6, HZ0 + 0.8); scene.add(hallSconceL);
  // the stairs up to the gallery (floating oak treads)
  for (let i = 0; i < 16; i++) B(1.2, 0.06, 0.34, darkWood, HX1 - 0.65, 0.22 * (i + 1), HZ1 - 0.9 - i * 0.34);
  // the chandelier
  { const ch = new THREE.Group(); ch.position.set((HX0 + HX1) / 2, 5.4, 0.4); scene.add(ch); const crys = sbStd('#ffffff', 0.1, 0, { emissive: '#ffe8c8', emissiveIntensity: 1.2 });
    for (let i = 0; i < 60; i++) { const a = i * 2.4, r = 0.2 + 0.6 * sbR(i, 3), m = new THREE.Mesh(new THREE.OctahedronGeometry(0.035), crys); m.position.set(Math.cos(a) * r, -sbR(i, 5) * 0.9, Math.sin(a) * r); ch.add(m); }
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.6), brassM); rod.position.y = 0.8; ch.add(rod); }
  const hallL = new THREE.PointLight('#ffe8c8', 0, 14, 1.4); hallL.position.set((HX0 + HX1) / 2, 4.8, 0.4); scene.add(hallL);
  B(1.6, 0.85, 0.45, darkWood, HX0 + 0.5, 0.425, 2.2).rotation.y = Math.PI / 2;
  { const vase = sbCyl(0.1, 0.08, 0.4, sbStd('#2a3a4a', 0.2, 0.1), HX0 + 0.5, 1.05, 2.2); for (let i = 0; i < 9; i++) sbMesh(new THREE.SphereGeometry(0.07, 10, 8), sbStd(['#f2f0ea', '#e8c8c8'][i % 2], 0.8), HX0 + 0.5 + Math.cos(i * 2.2) * 0.14, 1.32 + 0.1 * sbR(i, 9), 2.2 + Math.sin(i * 2.2) * 0.14); }

  // =================================================================================== the terrace, the pool, the view
  const POOL = { x0: -7, x1: 2, z0: -8.3, z1: -13.4 };
  for (const [x0, x1, z0, z1] of [[-15, 11, GZ, POOL.z0], [-15, POOL.x0, POOL.z0, -13.5], [POOL.x1, 11, POOL.z0, -13.5]]) sbMesh(new THREE.PlaneGeometry(x1 - x0, z0 - z1).rotateX(-Math.PI / 2), deckM, (x0 + x1) / 2, 0, (z0 + z1) / 2).castShadow = false;
  const waterTex = sbTex(sbCanvas(256, 256, (g, w, h) => { g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { g.strokeStyle = `rgba(${hash1(i) < 0.5 ? 255 : 0},${hash1(i) < 0.5 ? 255 : 0},${hash1(i) < 0.5 ? 255 : 0},0.12)`; g.lineWidth = 3; g.beginPath(); const x = hash1(i * 3) * w, y = hash1(i * 7) * h; g.ellipse(x, y, 18 + 20 * hash1(i * 9), 6 + 6 * hash1(i * 11), hash1(i * 13), 0, 7); g.stroke(); } }), { srgb: false });
  waterTex.repeat.set(4, 2);
  const waterM = new THREE.MeshStandardMaterial({ color: '#2f8fb0', roughness: 0.04, metalness: 0.2, envMapIntensity: 1.4, normalMap: waterTex, normalScale: new THREE.Vector2(0.35, 0.35), transparent: true, opacity: 0.92 });
  const water = sbMesh(new THREE.PlaneGeometry(POOL.x1 - POOL.x0, POOL.z0 - POOL.z1).rotateX(-Math.PI / 2), waterM, (POOL.x0 + POOL.x1) / 2, -0.06, (POOL.z0 + POOL.z1) / 2); water.castShadow = false;
  B(POOL.x1 - POOL.x0, 1.4, POOL.z0 - POOL.z1, sbStd('#bfe6ee', 0.5), (POOL.x0 + POOL.x1) / 2, -0.78, (POOL.z0 + POOL.z1) / 2);
  B(POOL.x1 - POOL.x0 + 0.4, 0.12, 0.2, sbStd('#e8e2d8', 0.6), (POOL.x0 + POOL.x1) / 2, -0.04, POOL.z0 + 0.1);
  // the deck's edge: a glass balustrade (the pool runs to the edge: an infinity edge), planters, two loungers
  B(9, 1.05, 0.03, glassM, 6.5, 0.52, -13.45); B(8, 1.05, 0.03, glassM, -11, 0.52, -13.45);
  B(26, 1.4, 0.4, sbStd('#bfb6a6', 0.85), -2, -0.78, -13.7);
  for (const x of [-10.5, 4.5, 8.5]) { B(1.1, 0.6, 1.1, sbStd('#3a3632', 0.7), x, 0.3, GZ - 1.2); sbHoTree(x, 0.6, GZ - 1.2, 0.42, scene); }
  for (const [x, z] of [[-8.3, GZ + 0.7], [4.2, GZ + 0.8], [-1.2, 2.3]]) sbHoPlant(x, z, 1.25, scene);
  for (const x of [3.6, 5.2]) { B(0.7, 0.3, 1.9, sbStd('#ece6da', 0.9), x, 0.25, GZ - 4.5); B(0.7, 0.06, 0.7, sbStd('#ece6da', 0.9), x, 0.55, GZ - 3.8).rotation.x = -0.6; }
  // the hill under the house, the valley, the hills across it
  sbMesh(new THREE.ConeGeometry(230, 92, 32, 1, true), sbStd('#56583f', 0.95), -2, -46.6, 12).castShadow = false;   // (its top under the house: from the terrace, only the slope falls away)
  const groundM = sbStd('#4a5040', 0.95, 0);
  const valley = sbMesh(new THREE.PlaneGeometry(6000, 6000).rotateX(-Math.PI / 2), groundM, 0, -92, -1500); valley.castShadow = false;
  const moundG = new THREE.SphereGeometry(1, 40, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  for (const [x, z, r, h] of [[-900, -2200, 700, 220], [700, -2600, 900, 260], [1800, -1200, 600, 170], [-1900, -900, 600, 200], [-330, -440, 230, 80]]) { const m = sbMesh(moundG, sbStd('#4e5642', 0.95), x, -92, z); m.scale.set(r, h, r * 0.8); m.castShadow = false; }
  // the city: towers (one instanced mesh, a facade map and lit windows), street lights (puffs)
  const facadeM = new THREE.MeshStandardMaterial({ color: '#ffffff', map: sbTex(sbHoFacadeCanvas(false)), emissiveMap: sbTex(sbHoFacadeCanvas(true)), emissive: '#ffffff', emissiveIntensity: 0, roughness: 0.6, metalness: 0.2 });
  const NC = 1300, towers = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), facadeM, NC), lamps = [];
  { const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), r = new RNG(CONFIG.seed + 660), up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < NC; i++) {
      const a = r.range(-1.25, 1.25), d = 260 + Math.pow(r.next(), 0.8) * 1900, core = Math.exp(-Math.pow((d - 1100) / 280, 2) - a * a * 3);
      const x = Math.sin(a) * d, z = -Math.cos(a) * d - 60, h = 10 + r.range(0, 30) + core * r.range(60, 220), w = r.range(14, 34);
      q.setFromAxisAngle(up, r.range(-0.2, 0.2) + a * 0.3);
      towers.setMatrixAt(i, m4.compose(new THREE.Vector3(x, -92, z), q, new THREE.Vector3(w, h, w * r.range(0.7, 1.3))));
    }
    for (let i = 0; i < 2600; i++) { const a = r.range(-1.3, 1.3), d = 230 + Math.pow(r.next(), 0.7) * 2000; lamps.push([Math.sin(a) * d + r.range(-6, 6), -90.5, -Math.cos(a) * d - 60, r.next()]); }
  }
  towers.castShadow = false; towers.receiveShadow = false; scene.add(towers);
  // the bigger house across the valley (lit at night)
  const rivalM = sbStd('#d8d4cc', 0.6, 0, { emissive: '#ffcf90', emissiveIntensity: 0 });
  const rival = new THREE.Group(); rival.position.set(...SB_HO.rival); scene.add(rival);
  for (const [x, y, z, w, h, d] of [[0, 0, 0, 90, 14, 40], [-20, 14, 0, 60, 12, 34], [30, 14, 6, 30, 10, 30], [0, -12, 8, 120, 12, 30]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), rivalM); m.position.set(x, y + h / 2, z); rival.add(m); }
  for (let i = 0; i < 18; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(4, 16, 6), sbStd('#2e3a28', 0.9)); m.position.set(-70 + i * 8.5, -6, 30); rival.add(m); }

  // =================================================================================== the garage
  const G0 = SB_HO.garage, gar = new THREE.Group(); gar.position.set(G0[0], 0, G0[2]); scene.add(gar);
  { const epoxy = sbStd('#4a4c50', 0.15, 0.1, { envMapIntensity: 1.2 }), gw2 = sbStd('#2a2c30', 0.85, 0);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(12, 10).rotateX(-Math.PI / 2), epoxy); f.receiveShadow = true; gar.add(f);
    for (const [w, h, d, x, y, z] of [[12, 3.4, 0.2, 0, 1.7, -5], [12, 3.4, 0.2, 0, 1.7, 5], [0.2, 3.4, 10, -6, 1.7, 0], [0.2, 3.4, 10, 6, 1.7, 0], [12, 0.2, 10, 0, 3.4, 0]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), gw2); m.position.set(x, y, z); m.receiveShadow = true; gar.add(m); }
    for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 9), lightM); s.position.set(-4.5 + i * 3, 3.28, 0); gar.add(s); }
    // shelves along the back, boxes
    for (let k = 0; k < 3; k++) { const sh = new THREE.Mesh(new THREE.BoxGeometry(5, 0.04, 0.6), blackM); sh.position.set(2.5, 0.6 + k * 0.8, -4.6); gar.add(sh); for (let i = 0; i < 4; i++) { const bx = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.45), sbStd('#a8865a', 0.9)); bx.position.set(0.7 + i * 1.2 + sbR(i + k * 7, 2) * 0.3, 0.85 + k * 0.8, -4.6); bx.castShadow = true; gar.add(bx); } } }
  const garL = [-3, 3].map((x) => { const L = new THREE.PointLight('#f2f6ff', 0, 12, 1.4); L.position.set(G0[0] + x, 3.0, G0[2]); scene.add(L); return L; });
  const VF = new VehicleFactory();
  const supercar = VF.build('sbSuper', '#d8541e'); supercar.group.position.set(G0[0] - 1.6, 0, G0[2] + 0.4); supercar.group.rotation.y = -Math.PI / 2 + 0.06; scene.add(supercar.group);
  const suv2 = VF.build('suv', '#141618'); suv2.group.position.set(G0[0] + 2.4, 0, G0[2] + 0.6); suv2.group.rotation.y = -Math.PI / 2; scene.add(suv2.group);
  for (const c of [supercar, suv2]) c.group.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  VF.m.head.emissiveIntensity = 0.3;
  // the box from the old flat (on the floor by the shelves, its flaps open), the note inside it
  const box = new THREE.Group(); box.position.set(G0[0] - 3.6, 0, G0[2] - 3.2); box.rotation.y = 0.25; scene.add(box);
  { const card = sbStd('#a8865a', 0.92), side = sbStd('#ffffff', 0.9, 0, { map: sbTex(sbHoBoxCanvas(), { repeat: false }) });
    const add = (w, h, d, x, y, z, m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m || card); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; box.add(o); return o; };
    add(0.6, 0.012, 0.42, 0, 0.006, 0); add(0.6, 0.42, 0.012, 0, 0.21, -0.21); add(0.012, 0.42, 0.42, -0.3, 0.21, 0); add(0.012, 0.42, 0.42, 0.3, 0.21, 0);
    const front = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.42), side); front.position.set(0, 0.21, 0.212); box.add(front); add(0.6, 0.42, 0.006, 0, 0.21, 0.208);
    for (const sx of [-1, 1]) { const hinge = new THREE.Group(); hinge.position.set(sx * 0.3, 0.42, 0); hinge.rotation.z = -sx * 0.55; box.add(hinge);
      const fl = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.008, 0.42), card); fl.position.set(sx * 0.105, 0.004, 0); fl.castShadow = fl.receiveShadow = true; hinge.add(fl); }
    // inside: a mug, a folded tea towel, a takeaway menu, the note
    add(0.5, 0.18, 0.36, 0, 0.1, 0, sbStd('#8a7a66', 0.95));
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.036, 0.09, 16), sbStd('#c94a3a', 0.4)); mug.position.set(0.15, 0.235, -0.08); box.add(mug); }
  const oldNote = new THREE.Mesh(new THREE.PlaneGeometry(0.076, 0.076).rotateX(-Math.PI / 2), sbStd('#ffffff', 0.9, 0, { map: sbNoteTex(1, 1), side: THREE.DoubleSide })); oldNote.position.set(-0.06, 0.192, 0.04); oldNote.rotation.y = -0.3; box.add(oldNote);

  // =================================================================================== the drive, the wall, the gate
  const drive = new THREE.Group(); scene.add(drive);
  { const GZt = SB_HO.gateZ, wallM = sbStd('#cfc8bc', 0.9, 0), ironM = sbStd('#1c1d20', 0.45, 0.6);
    sbMesh(new THREE.PlaneGeometry(10, GZt - 4).rotateX(-Math.PI / 2), sbStd('#8a8478', 0.85), 0, 0.003, (GZt + 4) / 2, drive).castShadow = false;
    sbMesh(new THREE.PlaneGeometry(120, 52).rotateX(-Math.PI / 2), sbStd('#5a7040', 0.95), 0, -0.002, GZt - 6, drive).castShadow = false;
    sbMesh(new THREE.PlaneGeometry(120, 14).rotateX(-Math.PI / 2), sbStd('#3a3c40', 0.9), 0, 0.002, GZt + 9, drive).castShadow = false;
    B(56, 3.4, 0.6, wallM, -32, 1.7, GZt, drive); B(56, 3.4, 0.6, wallM, 32, 1.7, GZt, drive);
    for (const x of [-4.2, 4.2]) { B(0.9, 3.9, 0.9, wallM, x, 1.95, GZt, drive); sbMesh(new THREE.SphereGeometry(0.16, 12, 8), sbStd('#fff4e0', 0.3, 0, { emissive: '#ffe8c0', emissiveIntensity: 0.6 }), x, 4.05, GZt, drive); }
    // the gate: iron bars on a frame (it slides along x)
    const gate = new THREE.Group(); gate.position.set(0, 0, GZt - 0.45); drive.add(gate); drive.userData.gate = gate;
    for (let i = 0; i < 30; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.05, 3.0, 0.05), ironM); b.position.set(-3.7 + i * 0.255, 1.6, 0); b.castShadow = true; gate.add(b); }
    for (const y of [0.25, 2.95]) { const r = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.12, 0.08), ironM); r.position.set(0, y, 0); gate.add(r); }
    // the guardhouse, cameras on a pole, the road's trees and a lamp
    B(2.4, 2.6, 2.4, wallM, -7.2, 1.3, GZt - 2.4, drive); B(1.6, 0.9, 0.04, glassM, -7.2, 1.6, GZt - 3.62, drive); B(2.8, 0.15, 2.8, ironM, -7.2, 2.67, GZt - 2.4, drive);
    sbCyl(0.06, 0.06, 4.2, ironM, 5.5, 2.1, GZt - 0.8, drive); for (const s of [-1, 1]) B(0.3, 0.14, 0.14, sbStd('#e8e8e8', 0.4), 5.5 + s * 0.2, 4.1, GZt - 0.8, drive).rotation.y = s * 0.6;
    for (let i = 0; i < 9; i++) sbHoTree(-28 + i * 7 + 1.5 * sbR(i, 3), 0, GZt + 17 + sbR(i, 5), 0.85 + 0.2 * sbR(i, 7), drive);
    const hedgeM = sbStd('#3a5230', 0.9), hedgeM2 = sbStd('#46602f', 0.9);
    for (let i = 0; i < 26; i++) { const x = -18 + i * 1.45 + (i > 12 ? 2.6 : -2.6); if (Math.abs(x) < 5.5) continue; const b = sbMesh(new THREE.IcosahedronGeometry(0.85, 1), i % 2 ? hedgeM : hedgeM2, x, 0.7, GZt - 1.25, drive); b.scale.set(1.1, 0.85 + 0.15 * sbR(i, 9), 0.8); } }
  const guard = sbPerson({ id: 'sbGuard1', look: 'sbGuard', path: [[0, -4.6, SB_HO.gateZ - 2.0]], face: 20, states: [[0, 'sbGuard']] }, scene);
  const passer = sbPerson({ id: 'sbPasser', look: 'casual6', path: [[SB.wall - 2, -30, SB_HO.gateZ + 4.5], [SB.wall + 30, 14, SB_HO.gateZ + 4.5]], states: [[SB.wall - 2, 'walk']] }, scene);
  // the housekeeper (in the kitchen, mornings)
  const keeper = sbPerson({ id: 'sbKeeper', look: 'sbKeeper', path: [[0, -2.6, GZ + 0.55]], face: 0, states: [[0, 'sbWipe']] }, scene);

  // ---- the light: day, morning, dusk, night, the time-lapse, the garage
  const SKY = {
    day: ['#4f7fb8', '#c6d6e6', '#8a8680', '#fff2d8', [-0.55, 0.42, -0.72]], morning: ['#6a8ab8', '#f2d8b8', '#8a7a68', '#ffd8a0', [0.62, 0.2, -0.76]],
    dusk: ['#2a3a6a', '#f0905a', '#3a2e2a', '#ff9a5a', [0.2, 0.03, -1]], night: ['#03050c', '#141c30', '#05060a', '#000000', [0, -0.3, -1]],
  };
  let litKey = null;
  const setSky = (k, u) => {
    const a = SKY[k];
    sky.material.uniforms.a.value.set(a[0]); sky.material.uniforms.b.value.set(a[1]); sky.material.uniforms.c.value.set(a[2]); sky.material.uniforms.sc.value.set(a[3]); sky.material.uniforms.sd.value.set(...a[4]).normalize();
  };
  const setLight = (key) => {
    if (litKey === key) return; litKey = key;
    const night = key === 'night', dusk = key === 'dusk', morning = key === 'morning', inside = key === 'garage';
    setSky(key === 'garage' || key === 'lapse' ? 'day' : key);
    scene.environment = night ? envNight : dusk ? envDusk : envDay;
    scene.fog.color.set(night ? '#0a0e18' : dusk ? '#c8907a' : morning ? '#e8d8c4' : '#b8c6d4'); scene.fog.density = night ? 0.0003 : dusk ? 0.00026 : 0.00042;
    hemi.color.set(night ? '#2a3450' : dusk ? '#e0a888' : '#d6e2f0'); hemi.groundColor.set(night ? '#14100c' : '#8a7a66'); hemi.intensity = night ? 0.12 : dusk ? 0.45 : 0.7;
    sun.intensity = night ? 0 : dusk ? 1.1 : morning ? 2.2 : 2.6; sun.castShadow = !night;
    sun.color.set(dusk ? '#ffae70' : morning ? '#ffdcaa' : '#ffe6c4');
    const sd = SKY[night || inside ? 'day' : key === 'lapse' ? 'day' : key][4]; sun.position.set(sd[0] * 120 - 2, Math.max(8, sd[1] * 120), sd[2] * 120 - 3);
    facadeM.emissiveIntensity = night ? 1.3 : dusk ? 0.7 : 0; rivalM.emissiveIntensity = night ? 0.9 : dusk ? 0.3 : 0;
    for (const L of roomL) L.intensity = night ? 9 : dusk ? 4 : 0;
    lightM.emissiveIntensity = inside ? 0.9 : night || dusk ? 1.6 : 0.3; hallL.intensity = key === 'day' ? 2.5 : 10; hallSconceL.intensity = key === 'day' ? 3 : 6;
    for (const L of garL) L.intensity = inside ? 14 : 0;
    scene.userData.floorShade.material.emissiveIntensity = night ? 0.9 : 0;
    scene.background = new THREE.Color(night ? '#03050c' : '#9ab4d4');
  };

  const look = (p, at, fov, t, drift = 0.01, roll = 0) => { const d = sbDrift(t, drift, 0.3, 9); sbCam(cam, [p[0] + d[0], p[1] + d[1], p[2] + d[2]], at, fov, roll); };
  const set = {
    scene, camera: cam,
    frame(t, shot) {
      const m = shot.mode;
      const key = (m === 'garage' || m === 'note') ? 'garage' : (m === 'six' || m === 'brick') ? 'morning' : m === 'enough' ? 'dusk' : (m === 'compare' || m === 'views' || m === 'pledge') ? 'night' : m === 'years' ? 'lapse' : 'day';
      setLight(key);
      // ---- the time-lapse: days flick past (the sky, the sun, the city's lights)
      if (key === 'lapse') {
        const ph = ((t - SB.years) / SB_HO.lapse) % 1, el = Math.sin(ph * Math.PI * 2), sd = [Math.cos(ph * Math.PI * 2) * 0.8, el, -0.6];
        const dayK = MathX.smooth(el, -0.15, 0.25), duskK = Math.exp(-Math.pow(el / 0.18, 2));
        const c = (a, b, d, k1, k2) => new THREE.Color(a).lerp(new THREE.Color(d), k2).lerp(new THREE.Color(b), k1);
        sky.material.uniforms.a.value.copy(c('#03050c', '#4f7fb8', '#2a3a6a', dayK, duskK)); sky.material.uniforms.b.value.copy(c('#141c30', '#c6d6e6', '#f0905a', dayK, duskK));
        sky.material.uniforms.sd.value.set(...sd).normalize(); sky.material.uniforms.sc.value.set(el > -0.1 ? '#ffd0a0' : '#000000');
        sun.position.set(sd[0] * 120, Math.max(5, el * 120), -60); sun.intensity = 2.6 * dayK; hemi.intensity = 0.12 + 0.6 * dayK;
        facadeM.emissiveIntensity = 1.3 * (1 - dayK); scene.fog.color.copy(c('#0a0e18', '#b8c6d4', '#c8907a', dayK, duskK));
        for (const L of roomL) L.intensity = 9 * (1 - dayK);
      }
      // ---- the TV (views), the pool, the gate, the people
      tv.userData.sc.material.color.set(m === 'views' ? '#ffffff' : '#060606');
      if (m === 'views') tvTex.update({ ch: t < SB.channel ? 1 : 2, f: Math.floor(t * 30) });
      tvL.intensity = m === 'views' ? 2.2 * (0.8 + 0.2 * noise1(t * 3, 4)) : 0;
      waterTex.offset.set(t * 0.012, t * 0.008);
      const gate = drive.userData.gate; gate.position.x = 7.8 * K(t, SB.gateShut - 2.4, SB.gateShut + 0.4, Ease.inOutSine) - 7.8 + (m === 'wall' ? 0 : 7.8);
      guard.root.visible = m === 'wall'; passer.root.visible = m === 'wall'; keeper.root.visible = m === 'brick' || m === 'six';
      if (m === 'wall') { guard.update(t); passer.update(t); }
      if (m === 'six' || m === 'brick') {
        // (she cleans the glass, pane by pane, along the wall)
        const x = -2.6 + 2.8 * Math.floor(MathX.clamp((t - SB.six) / 6.5, 0, 3)) + 1.1 * K((t - SB.six) % 6.5, 5.2, 6.5);
        keeper.spec.path = [[0, x, GZ + 0.55]]; keeper._preparePath(); keeper.states = [[0, ((t - SB.six) % 6.5) > 5.2 ? 'walk' : 'sbWipe']]; keeper.update(t);
      }
      bfast.visible = m === 'six' || m === 'brick';
      // ---- the city's street lights (dusk, night, the dark half of the time-lapse)
      puffs.begin();
      const la = key === 'night' ? 1 : key === 'dusk' ? 0.55 : key === 'lapse' ? 1 - MathX.smooth(Math.sin(((t - SB.years) / SB_HO.lapse) % 1 * Math.PI * 2), -0.15, 0.25) : 0;
      if (la > 0.01 && (m === 'enough' || m === 'compare' || m === 'pledge' || m === 'years' || m === 'views')) {
        for (const [x, y, z, v] of lamps) puffs.add(x, y, z, 7 + 6 * v, la * (0.35 + 0.4 * v) * (0.85 + 0.15 * Math.sin(t * 2 + v * 40)), 1, 0.8 + 0.1 * v, 0.55 + 0.2 * v);
        if (m === 'compare') for (let i = 0; i < 40; i++) puffs.add(SB_HO.rival[0] - 50 + i * 2.6, SB_HO.rival[1] + 4 + 14 * (i % 3), SB_HO.rival[2] + 22, 5, 0.5 * la, 1, 0.85, 0.6);
      }
      puffs.end();
      // ---- the camera
      let pos, at, fov = 55, drift = 0.01, roll = 0;
      if (m === 'house') {
        // in through the door; the hall; you turn to the living room and the view; then up at the gallery's doors
        const k1 = K(t, SB.house, SB.house + 3.2, Ease.inOutQuad), k2 = K(t, sbCap('house', 1).show - 0.4, sbCap('house', 1).show + 1.0);
        pos = sbV(sbV([8.6, 1.7, 3.6], [7.4, 1.7, 0.6], k1), [7.6, 1.7, 2.6], k2); at = sbV(sbV([8.2, 2.4, -3], [0, 1.6, -6], k1), [7.8, 4.5, -4], k2); fov = sbLerp(60, 58, k2);
      } else if (m === 'garage') {
        const k = K(t, SB.garage, SB.neighbours);
        pos = sbV([G0[0] + 2.2, 0.95, G0[2] + 4.2], [G0[0] + 0.4, 1.0, G0[2] + 3.6], k); at = sbV([G0[0] - 1.8, 0.6, G0[2] + 0.4], [G0[0] - 1.4, 0.55, G0[2]], k); fov = 50;
      } else if (m === 'six') {
        // the plate; your eyes rise to the view
        const k = K(t, sbCap('six', 1).show - 0.3, sbCap('six', 1).show + 2.0);
        pos = [ISL[0] - 0.2, 1.3, ISL[1] + 0.95]; at = sbV([ISL[0] - 0.2, 0.94, ISL[1] + 0.3], [ISL[0] - 2.0, 1.4, GZ - 10], k); fov = sbLerp(46, 56, k);
      } else if (m === 'brick') {
        // wider: the kitchen, the housekeeper, the city through the glass
        const k = K(t, SB.brick, SB.enough);
        pos = sbV([4.2, 1.62, 1.6], [3.4, 1.62, -1.2], k); at = sbV([-2.0, 1.2, -5.5], [-5.5, 1.0, -12], k); fov = 60; drift = 0.006;
      } else if (m === 'enough') {
        // the terrace at dusk, along the pool to its edge
        const k = K(t, SB.enough, SB.compare);
        pos = sbV([-8.2, 1.62, -7.4], [-7.7, 1.62, -12.4], k); at = sbV([4, -3, -80], [2, -10, -300], k); fov = sbLerp(60, 50, k);
      } else if (m === 'compare') {
        // night: you turn from the city to the big house across the valley
        const k = K(t, SB.compare + 0.5, sbCap('compare', 1).show + 0.5);
        pos = [-7.7, 1.62, -12.4]; at = sbV([-1.0, -10, -300], [SB_HO.rival[0], SB_HO.rival[1] + 10, SB_HO.rival[2]], k); fov = sbLerp(50, 30, K(t, sbCap('compare', 1).show, SB.boss));
      } else if (m === 'views') {
        pos = [-4.25, 1.12, -1.5]; at = [LX0, 1.55, -1.6]; fov = 50; drift = 0.006;
      } else if (m === 'wall') {
        // the gate slides shut; the guard; the road
        const k = K(t, SB.wall, SB.walk);
        pos = sbV([-1.5, 1.7, SB_HO.gateZ - 12], [-0.5, 1.7, SB_HO.gateZ - 8.5], k); at = [0.5, 1.5, SB_HO.gateZ + 6]; fov = 56;
      } else if (m === 'years') {
        pos = [-1.0, 1.62, 1.5]; at = [-3.5, 0.6, GZ - 30]; fov = 64; drift = 0.0;
      } else if (m === 'note') {
        // you find the box; you look in; the note
        const k1 = K(t, SB.note, SB.note + 1.6), k2 = K(t, sbCap('note', 1).show - 0.4, sbCap('note', 1).show + 0.8);
        const bp = box.position;
        pos = sbV(sbV([G0[0] - 1.5, 1.65, G0[2] - 1.0], [bp.x + 0.1, 1.25, bp.z + 0.75], k1), [bp.x + 0.02, 0.85, bp.z + 0.35], k2); at = sbV([bp.x, 0.3, bp.z], [bp.x - 0.05, 0.19, bp.z + 0.03], k2); fov = sbLerp(55, 40, k2);
      } else if (m === 'pledge') {
        const k = K(t, SB.pledge, SB.real);
        pos = sbV([0.5, 1.62, -2.6], [-0.5, 1.62, -4.6], k); at = [-2.0, 0.0, -400]; fov = 58; drift = 0.006;
      } else {
        pos = [0, 1.62, 0]; at = [0, 1.5, -6];
      }
      look(pos, at, fov, t, drift, roll);
      if (m === 'views') { hands.update(t); hands.show('remote'); } else { hands.update(-5); hands.show(null); }
      this._t = t;
    },
    grade(t, p, shot) {
      const m = shot.mode;
      p.grain = 0.026;
      if (m === 'enough') { p.exposure = 1.08; p.warmth = 0.08; p.bloom = 0.45; p.bloomThreshold = 0.8; p.saturation = 1.08; }
      else if (m === 'compare' || m === 'pledge' || m === 'views') { p.exposure = m === 'views' ? 1.0 : 1.2; p.warmth = 0.0; p.bloom = 0.55; p.bloomThreshold = 0.7; p.vignette = 0.62; }
      else if (m === 'six' || m === 'brick') { p.exposure = 0.84; p.warmth = 0.05; p.bloom = 0.3; p.contrast = 1.12; }
      else if (m === 'garage' || m === 'note') { p.exposure = 1.1; p.warmth = m === 'note' ? 0.03 : -0.03; p.contrast = 1.1; p.vignette = 0.6; }
      else { p.exposure = m === 'house' ? 0.8 : 0.95; p.warmth = 0.03; p.contrast = 1.1; }
      if (m === 'years') p.flash = Math.max(p.flash, 0.015 * Math.max(0, Math.sin(((t - SB.years) / SB_HO.lapse) * Math.PI * 2)));
    },
    labels(t) {
      const m = sbShotAt(t).mode, out = [];
      if (m === 'house') { const a = W(t, sbCap('house', 1).show + 0.5, SB.garage - 0.1, 0.3, 0.2); out.push({ p: [HX0 + 0.9 + 1.45, 5.95, HZ0 + 0.1], text: 'BATHROOM 6', sub: 'NEVER USED', a, side: 'l' }, { p: [HX0 + 0.9 + 3 * 1.45, 5.95, HZ0 + 0.1], text: 'BATHROOM 8', sub: 'NEVER USED', a }); }
      if (m === 'six' || m === 'brick') out.push({ p: [keeper.root.position.x, 1.95, GZ + 0.55], text: 'YOUR HOUSEKEEPER', a: W(t, SB.six + 0.8, SB.brick + 4, 0.4, 0.3) });
      if (m === 'garage') out.push({ p: [G0[0] - 1.6, 1.45, G0[2] + 0.4], text: 'THE CAR', sub: '$420,000', a: W(t, SB.buyCar - 0.2, SB.neighbours, 0.3, 0.2) });
      if (m === 'compare') out.push({ p: [SB_HO.rival[0], SB_HO.rival[1] + 34, SB_HO.rival[2]], text: 'THE NEIGHBOURS\' HOUSE', sub: 'BIGGER', a: W(t, sbCap('compare', 1).show + 0.6, SB.boss - 0.2, 0.4, 0.3) });
      if (m === 'wall') out.push({ p: [-4.6, 2.15, SB_HO.gateZ - 2.0], text: 'A GUARD', sub: '$3 MILLION: THE WALL, THE GATE, HIM', a: W(t, SB.buyWall + 0.4, SB.walk - 0.3, 0.3, 0.2) });
      if (m === 'note') out.push({ p: [box.position.x, 0.62, box.position.z], text: 'FROM THE OLD FLAT', a: W(t, SB.note + 0.6, sbCap('note', 1).show - 0.6, 0.3, 0.2) });
      return out;
    },
  };
  return set;
};

// the housekeeper's look (a film-side addition, like the others in cast.js)
LOOKS.sbKeeper = { skin: 3, build: 'slim', shirt: '#cfd6dc', sleeves: 'short', pants: '#3a3e48', shoes: '#141414', sole: '#0c0c0c', hair: '#1a120c', hairStyle: 'bun', apron: '#f4f2ee' };
// cleaning a window: standing, the right hand circling at shoulder height
ACTIONS.sbWipe = function (τ, c) { const p = ACTIONS.idle(τ, c), a = τ * 4.2; p.rSh = [1.35 + 0.2 * Math.sin(a), 0.25 + 0.2 * Math.cos(a)]; p.rEl = 0.5 + 0.1 * Math.sin(a); p.headYaw = 0; p.neck = -0.05; return p; };
BLEND.sbWipe = 0.4;
