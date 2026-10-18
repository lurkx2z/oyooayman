/* =====================================================================
   STREET — the harbour road outside the flat, at night. Light does 100 km/h, then 12.6 km/h.
     car1  a white hatchback at 25 km/h, a quarter of light: its headlights look blue as it comes (it is driving into
           its own light), its tail lights deep red as it goes; then it speeds off (70 km/h) and its light slides into
           the infrared: gone, a dark shape on a dark road
     car2  a mustard saloon at the same 25 km/h, now twice as fast as light. You hear it coming and see nothing: it is
           ahead of its own light. Its light first reaches you from a point two metres up the road; it appears there
           and splits in two: the car going on (its light shifted out of sight: a black shape on the lit road) and its
           past, running backwards up the road, headlights on.
   Every car is drawn where its light left it, vertex by vertex (kit.js: slPatch o.move, slMoveTau), coloured by its
   Doppler shift. The road runs along x; you stand on the harbour-side pavement; the cars use the near lane, driving
   towards −x (to your left). Pure function of t.
   ===================================================================== */

const SL_ST = {
  eye: [0.6, 1.62, 5.4], lane: 1.8, carY: 0.7,
  v1: 25 / 3.6, v1max: 70 / 3.6, a1: 3.4, x1Far: 140,            // car 1 (m/s, m/s², where it starts)
  v2: 2 * SL.cCar2,                                                // car 2: twice as fast as light
};
// how far your eye is from the cars' line (m), and so when each car really passes you
SL_ST.b = Math.hypot(SL_ST.eye[2] - SL_ST.lane, SL_ST.eye[1] - SL_ST.carY);
SL.car1Tp = SL.car1Pass - SL_ST.b / SL.cStreet;                   // car 1 is level with you (you see it a moment later)
SL.car2Tp = SL.car2Seen - Math.sqrt(3) / 2 * SL_ST.b / SL.cCar2;  // car 2 is level with you; its light first reaches you at car2Seen
SL.car1Go = SL.car1Tp + 0.8;                                      // car 1 puts its foot down

// car 1's centre (x) and speed at time te: steady, then accelerating away
function slCar1X(te) {
  const v = SL_ST.v1, x0 = SL_ST.eye[0], d = te - SL.car1Go;
  if (d < 0) return x0 - v * (te - SL.car1Tp);
  const a = SL_ST.a1, tA = (SL_ST.v1max - v) / a, xg = x0 - v * (SL.car1Go - SL.car1Tp);
  return d < tA ? xg - v * d - 0.5 * a * d * d : xg - v * tA - 0.5 * a * tA * tA - SL_ST.v1max * (d - tA);
}
function slCar1V(te) { const d = te - SL.car1Go; return d < 0 ? SL_ST.v1 : Math.min(SL_ST.v1max, SL_ST.v1 + SL_ST.a1 * d); }
// when the light you see now left car 1's centre
function slCar1Seen(t) { return slSeen(t, slC(t), SL_ST.eye, (te) => [slCar1X(te), SL_ST.carY, SL_ST.lane], 40); }

// a terrace front (6 m × 12 m): render or brick, two upper floors of sash windows (some lit), a shop or a door below.
// Returns { map, glow } canvases (glow: only what shines).
function slFacade(seed) {
  const r = new RNG(seed * 31 + 7), W = 512, H = 1024, px = W / 6;
  const walls = [[226, 214, 190], [196, 206, 210], [150, 72, 56], [214, 200, 168], [170, 182, 160], [120, 112, 108], [232, 226, 214]];
  const wall = walls[r.int(0, walls.length - 1)];
  const shops = [
    { name: 'BAKERY', glass: '#ffd9a0', sign: '#3a2a1e', ink: '#f4e2c0' }, { name: 'THE ANCHOR', glass: '#ffb763', sign: '#1f3a2a', ink: '#e8d9a8' },
    { name: 'LAUNDERETTE', glass: '#d8f2ff', sign: '#1a4a6a', ink: '#ffffff' }, { name: 'CORNER SHOP', glass: '#fff6e6', sign: '#7a1f1f', ink: '#ffffff' },
    { name: 'CHIPS', glass: '#ffe2b8', sign: '#21305a', ink: '#ffd34a' }, { name: 'CAFE', glass: '#ffcf96', sign: '#2c2c2c', ink: '#f0f0f0' }];
  const shop = r.next() < 0.55 ? shops[r.int(0, shops.length - 1)] : null;
  const lit = [];
  const map = slCanvas(W, H, (g) => {
    const base = `rgb(${wall[0]},${wall[1]},${wall[2]})`;
    g.fillStyle = base; g.fillRect(0, 0, W, H);
    // brick or render texture
    const brick = wall[0] < 160 && wall[1] < 90;
    for (let y = 0; y < H; y += brick ? 9 : 4) for (let x = (brick && (y / 9) % 2 ? -14 : 0); x < W; x += brick ? 28 : 6) {
      const k = (hash2(x * 3 + seed, y * 7) - 0.5) * (brick ? 26 : 10);
      g.fillStyle = `rgba(${k > 0 ? '255,255,255' : '0,0,0'},${Math.abs(k) / 255})`; g.fillRect(x, y, brick ? 26 : 6, brick ? 8 : 4);
    }
    // a cornice, the parapet, a string course
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, 70, W, 18); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 88, W, 6);
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(0, H - 3.6 * px - 14, W, 12);
    // upper floors: two sash windows each
    for (const fy of [0, 1]) for (const wx of [0, 1]) {
      const x = (wx ? 3.55 : 0.85) * px, y = H - (6.4 + fy * 3.1 + 1.75) * px, w = 1.6 * px, h = 1.75 * px;
      const on = r.next() < 0.45;
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x - 6, y - 6, w + 12, h + 16);
      if (on) {
        const warm = r.next() < 0.75, gr = g.createLinearGradient(0, y, 0, y + h);
        gr.addColorStop(0, warm ? '#ffcf8a' : '#e6ecff'); gr.addColorStop(1, warm ? '#e58a3c' : '#a8b8e0');
        g.fillStyle = gr; g.fillRect(x, y, w, h);
        // curtains, a lampshade
        g.fillStyle = `rgba(90,40,20,${r.range(0.3, 0.6)})`; g.fillRect(x, y, w * r.range(0.12, 0.3), h); g.fillRect(x + w * r.range(0.7, 0.88), y, w, h);
        lit.push([x, y, w, h, warm]);
      } else {
        const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#1d2430'); gr.addColorStop(1, '#0c0f15'); g.fillStyle = gr; g.fillRect(x, y, w, h);
      }
      g.fillStyle = '#e8e4da'; g.fillRect(x, y + h / 2 - 3, w, 6); g.fillRect(x + w / 2 - 2, y, 4, h);
      g.fillRect(x - 6, y + h, w + 12, 10);
    }
    // the ground floor
    const gy = H - 3.6 * px;
    if (shop) {
      g.fillStyle = shop.sign; g.fillRect(0.2 * px, gy + 0.05 * px, 5.6 * px, 0.62 * px);
      g.fillStyle = shop.ink; g.font = `bold ${Math.round(0.36 * px)}px Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(shop.name, 3 * px, gy + 0.38 * px);
      const x = 0.35 * px, y = gy + 0.9 * px, w = 3.6 * px, h = 2.1 * px;
      g.fillStyle = shop.glass; g.fillRect(x, y, w, h);
      // shelves and things in the window
      for (let k = 0; k < 3; k++) { g.fillStyle = 'rgba(60,40,30,0.35)'; g.fillRect(x, y + h * (0.35 + k * 0.25), w, 5); for (let q = 0; q < 9; q++) { g.fillStyle = `rgba(${r.int(80, 200)},${r.int(50, 150)},${r.int(30, 120)},0.6)`; g.fillRect(x + 8 + q * w / 9.3, y + h * (0.35 + k * 0.25) - r.range(12, 30), r.range(10, 22), r.range(12, 30)); } }
      g.fillStyle = '#2a2622'; g.fillRect(x + w + 0.2 * px, y - 0.1 * px, 1.3 * px, 2.3 * px);
      g.fillStyle = shop.glass; g.globalAlpha = 0.75; g.fillRect(x + w + 0.35 * px, y + 0.05 * px, 1.0 * px, 1.1 * px); g.globalAlpha = 1;
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(x - 6, y + h, w + 12, 12);
      lit.push([x, y, w, h, 'shop', shop.glass], [x + w + 0.35 * px, y + 0.05 * px, 1.0 * px, 1.1 * px, 'shop', shop.glass], [0.2 * px, gy + 0.05 * px, 5.6 * px, 0.62 * px, 'sign', shop.ink]);
    } else {
      const doorX = (r.next() < 0.5 ? 0.6 : 4.2) * px;
      g.fillStyle = ['#1f3a5a', '#5a1f24', '#1f3a2c', '#2a2a2a', '#c9b48a'][r.int(0, 4)]; g.fillRect(doorX, gy + 0.9 * px, 1.1 * px, 2.3 * px);
      g.fillStyle = '#ffcf8a'; g.fillRect(doorX + 0.1 * px, gy + 0.62 * px, 0.9 * px, 0.25 * px); lit.push([doorX + 0.1 * px, gy + 0.62 * px, 0.9 * px, 0.25 * px, true]);
      const wx = doorX < W / 2 ? 2.3 * px : 0.7 * px, on = r.next() < 0.5;
      g.fillStyle = on ? '#ffc27a' : '#121720'; g.fillRect(wx, gy + 1.0 * px, 2.6 * px, 1.7 * px);
      if (on) { g.fillStyle = 'rgba(80,30,15,0.5)'; g.fillRect(wx, gy + 1.0 * px, 0.5 * px, 1.7 * px); lit.push([wx, gy + 1.0 * px, 2.6 * px, 1.7 * px, true]); }
      g.fillStyle = '#e8e4da'; g.fillRect(wx, gy + 1.82 * px, 2.6 * px, 5);
    }
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, H - 0.25 * px, W, 0.25 * px);
  });
  const glow = slCanvas(W, H, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    g.drawImage(map, 0, 0);
    // keep only what shines: black out everything that isn't a lit window or a sign
    const img = g.getImageData(0, 0, W, H), d = img.data, mask = new Uint8Array(W * H);
    for (const [x, y, w, h] of lit) for (let j = Math.max(0, y | 0); j < Math.min(H, (y + h) | 0); j++) for (let i = Math.max(0, x | 0); i < Math.min(W, (x + w) | 0); i++) mask[j * W + i] = 1;
    for (let i = 0; i < W * H; i++) if (!mask[i]) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 0; }
    g.putImageData(img, 0, 0);
  });
  return { map, glow, shop };
}

// asphalt (16 m of road per tile): wet, worn, a dashed centre line, edge lines
function slRoadCanvas() {
  const W = 1024, H = 512;
  return slCanvas(W, H, (g) => {
    g.fillStyle = '#2c2d30'; g.fillRect(0, 0, W, H);
    const img = g.getImageData(0, 0, W, H), d = img.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const n = hash2(x, y) * 0.5 + slN2(x * 0.02, y * 0.02) * 0.5, i = (y * W + x) * 4, k = (n - 0.5) * 34;
      d[i] += k; d[i + 1] += k; d[i + 2] += k * 1.05;
    }
    g.putImageData(img, 0, 0);
    // tyre tracks (darker, smoother)
    for (const yc of [0.18, 0.36, 0.64, 0.82]) { g.fillStyle = 'rgba(10,10,12,0.18)'; g.fillRect(0, yc * H - 14, W, 28); }
    // centre dashes (6 m line, 10 m gap → 3 per 16 m tile, simplified to 2) and edge lines
    g.fillStyle = 'rgba(232,230,220,0.85)';
    for (const x0 of [0, 0.5]) g.fillRect(x0 * W, H / 2 - 5, 0.24 * W, 10);
    g.fillRect(0, 10, W, 7); g.fillRect(0, H - 17, W, 7);
  });
}
// concrete paving flags (4 m per tile)
function slFlagsCanvas() {
  return slCanvas(512, 512, (g, W) => {
    g.fillStyle = '#6e6c68'; g.fillRect(0, 0, W, W);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const k = (hash2(i, j + 40) - 0.5) * 22; g.fillStyle = `rgb(${110 + k},${108 + k},${104 + k})`; g.fillRect(i * 128 + 2, j * 128 + 2, 124, 124); }
    const img = g.getImageData(0, 0, W, W), d = img.data;
    for (let i = 0; i < W * W; i++) { const k = (hash2(i % W, (i / W) | 0) - 0.5) * 18; d[i * 4] += k; d[i * 4 + 1] += k; d[i * 4 + 2] += k; }
    g.putImageData(img, 0, 0);
  });
}

SL_SETS.street = (app) => {
  const S = slSet(app, { sky: '#05070c', fog: 0.0065, fogColor: '#0b0f18', fov: 55, near: 0.05, far: 3000, hemi: ['#5d6d94', '#2a2622', 0.16] });
  const scene = S.scene, cam = S.camera, E = SL_ST.eye;
  scene.environment = slEnv(app.renderer, '#0a0e18', '#262c3c', '#0b0b0d');
  slSky(scene, '#03050a', '#1a2132', '#07080b', { sunDir: [0.3, 0.05, -1], sunGlow: '#1c1610', hw: 0.25 });
  const add = (m) => { scene.add(m); return m; };

  // ---- the road, the kerbs, the pavements
  const roadTex = slTex(slRoadCanvas()); roadTex.repeat.set(400 / 16, 1);
  const road = add(new THREE.Mesh(new THREE.PlaneGeometry(400, 7.2), slStd('#ffffff', 0.3, 0.0, { map: roadTex, envMapIntensity: 0.9 })));
  road.rotation.x = -Math.PI / 2; road.receiveShadow = true;
  const flags = slTex(slFlagsCanvas());
  const paveM = (rep) => { const t = flags.clone(); t.needsUpdate = true; t.repeat.set(400 / 4, rep); return slStd('#ffffff', 0.55, 0, { map: t, envMapIntensity: 0.6 }); };
  const near = add(new THREE.Mesh(new THREE.PlaneGeometry(400, 3.8), paveM(3.8 / 4))); near.rotation.x = -Math.PI / 2; near.position.set(0, 0.14, 5.5);
  const far = add(new THREE.Mesh(new THREE.PlaneGeometry(400, 4.2), paveM(4.2 / 4))); far.rotation.x = -Math.PI / 2; far.position.set(0, 0.14, -5.7);
  const kerbM = slStd('#8d8b85', 0.7);
  for (const z of [3.65, -3.65]) { const k = add(new THREE.Mesh(new THREE.BoxGeometry(400, 0.15, 0.2), kerbM)); k.position.set(0, 0.07, z); }
  // the harbour side: a railing, the quay edge, dark water with the town's lights on it
  { const railM = slStd('#2b3036', 0.45, 0.6);
    for (const y of [0.55, 1.05]) { const r = add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 400, 8), railM)); r.rotation.z = Math.PI / 2; r.position.set(0, 0.14 + y, 7.3); }
    for (let x = -200; x <= 200; x += 2.4) { const p = add(new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.1, 0.05), railM)); p.position.set(x, 0.69, 7.3); }
    const quay = add(new THREE.Mesh(new THREE.BoxGeometry(400, 3, 0.4), slStd('#4d4a45', 0.9))); quay.position.set(0, -1.4, 7.6);
    const water = add(new THREE.Mesh(new THREE.PlaneGeometry(400, 600), slStd('#06101a', 0.18, 0.5))); water.rotation.x = -Math.PI / 2; water.position.set(0, -2.4, 308);
    for (const [x, s] of [[-22, 1], [9, 0.8], [31, 1.2]]) {                   // moored boats
      const b = new THREE.Group(); b.position.set(x, -2.3, 11 + s * 2); scene.add(b);
      slMesh(slRoundBox(6 * s, 0.9, 2.2 * s, 0.3, 0.05), slStd('#d8d4cc', 0.6), 0, 0.3, 0, b); slMesh(slRoundBox(2.2 * s, 0.9, 1.6 * s, 0.1), slStd('#3a4a5a', 0.6), -0.4, 1.1, 0, b);
      slCyl(0.04, 0.04, 6 * s, slStd('#bbb', 0.5), 0.6, 3.5 * s, 0, b, 6);
    } }
  // ---- the terrace across the road: 6 m houses, a few kinds
  const kinds = [1, 2, 3, 4, 5, 6, 7, 8].map((k) => slFacade(k));
  const fronts = kinds.map((f) => { const m = slStd('#ffffff', 0.85, 0, { map: slTex(f.map, { repeat: false }), emissive: new THREE.Color('#ffffff'), emissiveMap: slTex(f.glow, { repeat: false }), emissiveIntensity: 1.25 }); return m; });
  const sideM = slStd('#3a3632', 0.9), roofM = slStd('#2a2c30', 0.8);
  const shopAt = [];
  for (let i = -26; i <= 26; i++) {
    const x = i * 6, k = ((i * 5 + 3) % 8 + 8) % 8, h = 12 + ((i * 7) % 3) * 0.4;
    const box = new THREE.Mesh(new THREE.BoxGeometry(6, h, 9), [sideM, sideM, roofM, sideM, fronts[k], sideM]);
    box.position.set(x, h / 2 + 0.14, -7.8 - 4.5); scene.add(box);
    if (kinds[k].shop) shopAt.push([x, kinds[k].shop.glass]);
  }
  // ---- streetlights: posts on both kerbs; the near ones are real lights, the far ones glow
  const postM = slStd('#3c4046', 0.5, 0.5), headM = slStd('#fff3df', 0.4, 0, { emissive: new THREE.Color('#ffd9a6'), emissiveIntensity: 2.4 });
  const glowAt = [];
  for (let i = -8; i <= 8; i++) for (const side of [-1, 1]) {
    const x = i * 25 + (side > 0 ? 12.5 : 0), z = side * 4.15;
    const p = add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 6.2, 10), postM)); p.position.set(x, 3.24, z);
    const arm = add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.3), postM)); arm.position.set(x, 6.25, z - side * 0.6);
    const hd = add(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.6), headM)); hd.position.set(x, 6.2, z - side * 1.15);
    glowAt.push([x, 6.1, z - side * 1.15]);
    if (Math.abs(x - E[0]) < 45) { const L = new THREE.PointLight('#ffd6a0', 34, 34, 1.9); L.position.set(x, 6.0, z - side * 1.15); scene.add(L); }
  }
  // ---- parked cars on the far side (still: plain colours), not in front of the shops you need to see past
  const parked = new VehicleFactory();
  for (const [x, type, col] of [[-74, 'sedan', '#2e3a4c'], [-66, 'hatch', '#8a8f94'], [-41, 'suv', '#1f2226'], [22, 'hatch', '#6a2a2a'], [29, 'sedan', '#c9c6be'], [52, 'van', '#e8e6e0'], [61, 'hatch', '#304a3a']]) {
    const c = parked.build(type, col); c.group.position.set(x, 0, -2.75); c.group.rotation.y = x % 2 ? 0 : Math.PI; scene.add(c.group);
    c.tail.emissiveIntensity = 0;
  }
  parked.m.head.emissiveIntensity = 0;

  // ---- the moving cars: each built from its own factory (its own materials, its own Doppler shift)
  // (an image of something faster than light that runs backwards is also mirrored front to back: its triangles are
  // turned over, so the faces that faced you when the light left them are the ones drawn)
  const flipped = (g) => { const r = g.clone(); for (const a of Object.values(r.attributes)) { const n = a.itemSize, d = a.array; for (let i = 0; i + 2 < a.count; i += 3) for (let k = 0; k < n; k++) { const x = d[(i + 1) * n + k]; d[(i + 1) * n + k] = d[(i + 2) * n + k]; d[(i + 2) * n + k] = x; } } return r; };
  const mkCar = (type, col, mirror = false) => {
    const F = new VehicleFactory(), c = F.build(type, col);
    c.group.rotation.y = Math.PI; scene.add(c.group);
    const done = new Map();
    c.group.traverse((m) => {
      if (!m.isMesh) return; m.castShadow = false; m.frustumCulled = false;
      if (!done.has(m.geometry)) { const g = slTessellate(m.geometry, 0.08); done.set(m.geometry, mirror ? flipped(g) : g); }
      m.geometry = done.get(m.geometry);
      for (const mat of Array.isArray(m.material) ? m.material : [m.material]) slPatch(mat, { move: 1 });
    });
    F.m.head.emissiveIntensity = 3.0; c.tail.emissiveIntensity = 2.2;
    c.F = F; return c;
  };
  const car1 = mkCar('hatch', '#e9e7e1'), car2A = mkCar('sedan', '#d9a92e'), car2B = mkCar('sedan', '#d9a92e', true);
  // the car's lamps (car frame: forward +x, right +z; the car is turned to face −x)
  const lampPts = (c, front) => { const L = c.L / 2, P = CAR_PROFILES[c === car1 ? 'hatch' : 'sedan']; return [-1, 1].map((sz) => front ? [L - 0.02, P.head, sz * (c.W / 2 - 0.27)] : [-L + 0.02, P.tail, sz * (c.W / 2 - 0.24)]); };
  const toWorld = (c, q) => [c.group.position.x - q[0], q[1], c.group.position.z - q[2]];   // (turned by π)
  // the light the headlights throw on the road ahead (it left them shifted by 1 / (1 − β) in the car's direction)
  const beam = new THREE.SpotLight('#ffffff', 0, 45, 0.42, 0.65, 1.4); scene.add(beam); scene.add(beam.target);
  // glows: headlights, tail lights, the moment car 2 first appears
  const puffs = slPuffs(scene, 600, { additive: true, soft: 1.3 });
  const lampPuffs = slPuffs(scene, 64, { additive: true, soft: 1.3 }); lampPuffs.mat.depthTest = false;   // (a car's own lamps)
  slPatchAll(scene);
  const W3 = new THREE.Vector3();

  // draw one image of a car (placed at its centre's seen time) and its lamps' glows
  const drawCar = (c, t, cNow, pos, V, tr, branch, dist) => {
    c.group.visible = true; c.group.position.set(pos[0], 0, pos[2]);
    slSetMove(c.group, V, tr, branch); slSetSrc(c.group, [V[0] / cNow, 0, 0]);
    for (const w of c.wheels) w.rotation.z = -dist / c.r;
    const vis = (q) => { const w = toWorld(c, q), tau = slMoveTau(t, cNow, E, w, V, tr, branch); return isNaN(tau) ? null : [w[0] + V[0] * tau, w[1], w[2]]; };
    const glow = (front) => {
      for (const q of lampPts(c, front)) {
        const p = vis(q); if (!p) continue;
        const n = slN3([p[0] - E[0], p[1] - E[1], p[2] - E[2]]), s = 1 / Math.abs(1 + V[0] / cNow * n[0]);
        // headlights point along the car's way (−x), tail lights back (+x): how much of each you can see from here
        const face = MathX.clamp((front ? n[0] : -n[0]) * 1.0 + 0.25, 0, 1);
        if (face <= 0 || s >= SL_LUT_S1 || s <= SL_LUT_S0) continue;
        const rgb = slShiftRGB(front ? [1, 0.92, 0.78] : [1, 0.06, 0.03], s), k = Math.min(2.5, s) * face;
        const d = Math.hypot(p[0] - E[0], p[2] - E[2]), sz = (front ? 0.55 : 0.32) + d * (front ? 0.009 : 0.004);
        lampPuffs.add(p[0], p[1], p[2], sz, (front ? 0.9 : 0.75) * k, rgb[0], rgb[1], rgb[2]);
        puffs.add(p[0], -p[1] + 0.02, p[2], sz * 1.4, (front ? 0.22 : 0.18) * k, rgb[0], rgb[1], rgb[2]);      // on the wet road
      }
    };
    glow(true); glow(false);
    return vis;
  };

  const api = {
    scene, camera: cam,
    frame(t, shot) {
      const m = shot.mode, c = slC(t);
      SL_U.uSlEye.value.set(E[0], E[1], E[2]); SL_U.uSlT.value = t; SL_U.uSlC.value = c;
      SL_U.uSlFrontOn.value = 0; SL_U.uSlAmb.value = 1; SL_U.uSlFade.value = 1; SL_U.uSlDop.value = 1; SL_U.uSlObs.value.set(0, 0, 0);
      puffs.begin(); lampPuffs.begin(); beam.intensity = 0;
      car1.group.visible = car2A.group.visible = car2B.group.visible = false;
      api._lab = [];
      let look, fov = 55;
      if (m === 'car1') {
        // car 1: where you see it (its centre's light left it at te); its own velocity for the rest of it
        const te = slCar1Seen(t), x = slCar1X(te), v = slCar1V(te);
        drawCar(car1, t, c, [x, 0, SL_ST.lane], [-v, 0, 0], te, 1, SL_ST.x1Far - x);
        // its headlight beam on the road ahead, shifted by 1 / (1 − v / c) (it piles up in front of the car)
        const sF = 1 / Math.max(0.05, 1 - v / c);
        if (sF < SL_LUT_S1) { const rgb = slShiftRGB([1, 0.92, 0.8], sF); beam.color.setRGB(rgb[0], rgb[1], rgb[2]); beam.intensity = 60 * Math.min(2.5, sF) * MathX.smooth(t, SL.street, SL.street + 1); }
        beam.position.set(x - car1.L / 2 + 0.1, 0.7, SL_ST.lane); beam.target.position.set(x - 14, 0, SL_ST.lane - 0.4);
        // you watch it come, pass, go
        const look0 = [x + 3, 0.8, SL_ST.lane - 1.2], k = slK(t, SL.street, SL.street + 4);
        look = slV([E[0] + 40, 1.4, -2], look0, 0.35 + 0.65 * k);
        if (t > SL.redGone + 0.4) look = slV(look, [E[0] - 40, 1.0, -1], slK(t, SL.redGone + 0.4, SL.redGone + 3));
      } else {
        // car 2: two images from the one equation (the later light: the car going on; the earlier: its past)
        const V = [-SL_ST.v2, 0, 0], P0 = [E[0], 0, SL_ST.lane], cen = [E[0], SL_ST.carY, SL_ST.lane];
        const tA = slMoveTau(t, c, E, cen, V, SL.car2Tp, 1), tB = slMoveTau(t, c, E, cen, V, SL.car2Tp, -1);
        if (t > SL.car2Seen - 0.6) {
          const vA = drawCar(car2A, t, c, P0, V, SL.car2Tp, 1, 300 + SL_ST.v2 * (isNaN(tA) ? 0 : tA));
          const vB = drawCar(car2B, t, c, P0, V, SL.car2Tp, -1, 300 + SL_ST.v2 * (isNaN(tB) ? 0 : tB));
          if (!isNaN(tA)) api._lab.push({ p: [E[0] + V[0] * tA, 2.1, SL_ST.lane], text: 'THE CAR', sub: 'NOW', a: slWin(t, slS('past') - 0.2, SL.cat, 0.4, 0.4) });
          if (!isNaN(tB)) api._lab.push({ p: [E[0] + V[0] * tB, 2.1, SL_ST.lane], text: 'ITS PAST', sub: 'RUNNING BACKWARDS', a: slWin(t, slCap('past', 1).show - 0.2, SL.cat, 0.4, 0.4) });
        }
        // the moment its light first reaches you: everything it gives off, even its warmth, flashes through the
        // colours you can see (shifted up without limit there), then the two images move apart, black at first
        const fl = t - SL.car2Seen;
        if (fl > -0.02 && fl < 1.2) {
          const xc = E[0] + SL_ST.b / Math.sqrt(3), a = Math.exp(-Math.max(0, fl) * 5);
          puffs.add(xc, 0.8, SL_ST.lane, 2.6 + fl * 3, 0.9 * a, 0.85, 0.8, 1.0);
          puffs.add(xc, 0.6, SL_ST.lane, 6.0, 0.35 * a, 0.55, 0.5, 1.0);
          puffs.add(xc, -0.6, SL_ST.lane, 5.0, 0.25 * a, 0.55, 0.5, 1.0);
        }
        // the camera: up the road (where it's coming from: nothing), then at the point it appears, then each image
        const up = [E[0] + 40, 1.1, -1.5], at0 = [E[0] + SL_ST.b / Math.sqrt(3) + 0.6, 0.9, SL_ST.lane - 2.5];
        const pA = [E[0] + V[0] * (isNaN(tA) ? 0 : tA), 0.9, SL_ST.lane - 1], pB = [E[0] + V[0] * (isNaN(tB) ? 0 : tB), 1.0, SL_ST.lane - 1];
        const two0 = slCap('two', 0), two1 = slCap('two', 1), past0 = slCap('past', 0), past1 = slCap('past', 1);
        look = slV([E[0] - 30, 1.2, -1.5], up, slK(t, SL.faster, SL.faster + 2.5));
        look = slV(look, at0, slK(t, two0.show - 0.3, two0.show + 2.2));
        look = slV(look, pA, slK(t, two1.hide - 0.2, past0.show - 0.2));
        look = slV(look, pB, slK(t, past0.hide - 0.1, past1.show + 0.4));
        // (your eyes follow each image in: the car going on, then its past far up the road)
        fov = slLerp(slLerp(slLerp(55, 62, slK(t, SL.car2Seen - 2, SL.car2Seen)), 44, slK(t, two1.hide - 0.2, past0.show)), 20, slK(t, past0.hide - 0.1, past1.show + 0.6));
      }
      const dr = slDrift(t, 0.012, 0.35, 21);
      const eye = [E[0] + dr[0], E[1] + dr[1], E[2] + dr[2]];
      slCam(cam, eye, look, fov);
      // the far streetlights' glow (the near ones are real lights)
      for (const g of glowAt) { const d = Math.abs(g[0] - E[0]); puffs.add(g[0], g[1] - 0.12, g[2], 0.9 + d * 0.006, 0.28, 1, 0.82, 0.6); }
      puffs.end(); lampPuffs.end();
    },
    labels() { return api._lab || []; },
    grade(t, p) { p.bloom = 0.6; p.bloomThreshold = 0.62; p.exposure = 1.12; p.vignette = 0.55; p.contrast = 1.05; },
  };
  return api;
};
