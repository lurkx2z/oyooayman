/* =====================================================================
   CITYKIT — the streets the car and street sets share (from the Slower light film's street, generalised):
     sbFacade(seed, kind)   a building front as two canvases { map, glow } (glow: only what shines at night).
                            kind: 'terrace' (2-storey houses, some shops), 'tower' (downtown, 6–9 storeys, shops below),
                            'dutch' (narrow brick houses with gables and white frames)
     sbStreet(o)            a straight street along z in the current set: road, kerbs, pavements, a zebra crossing,
                            buildings both sides, streetlights; returns what the set animates
     sbRain(scene, o)       rain streaks round a point (a pure function of t)
   Axes: the road runs along z (you drive towards −z), x = 0 is its middle; +x is on your right as you drive.
   ===================================================================== */

const SB_PAPER = '#f2ead8';

function sbFacade(seed, kind = 'terrace') {
  const r = new RNG(seed * 31 + (kind === 'tower' ? 101 : kind === 'dutch' ? 211 : 7)), W = 512, H = 1024;
  const lit = [];
  const shops = [
    { name: 'BAKERY', glass: '#ffd9a0', sign: '#3a2a1e', ink: '#f4e2c0' }, { name: 'PHARMACY', glass: '#e6fff4', sign: '#1f5a3a', ink: '#ffffff' },
    { name: 'LAUNDRY', glass: '#d8f2ff', sign: '#1a4a6a', ink: '#ffffff' }, { name: 'DELI', glass: '#fff6e6', sign: '#7a1f1f', ink: '#ffffff' },
    { name: 'BOOKS', glass: '#ffe2b8', sign: '#21305a', ink: '#ffd34a' }, { name: 'CAFE', glass: '#ffcf96', sign: '#2c2c2c', ink: '#f0f0f0' },
    { name: 'NOODLES', glass: '#ffd0a0', sign: '#8a1a14', ink: '#ffe6a0' }, { name: 'FLOWERS', glass: '#f6ffe8', sign: '#2e4a22', ink: '#f6f0dc' },
    { name: 'BANK', glass: '#e8eef8', sign: '#14243a', ink: '#d8c08a' }, { name: 'SHOES', glass: '#fff0e0', sign: '#3a2a3a', ink: '#ffffff' }];
  const shop = kind !== 'dutch' && (kind === 'tower' || r.next() < 0.55) ? shops[r.int(0, shops.length - 1)] : null;
  let floors, px;
  const map = sbCanvas(W, H, (g) => {
    if (kind === 'tower') {
      // a downtown block: stone or brick or dark glass, a grid of windows, a shop front below
      const walls = [[188, 176, 158], [120, 70, 56], [62, 70, 82], [210, 204, 190], [150, 140, 128], [90, 96, 104]];
      const wall = walls[r.int(0, walls.length - 1)], glassy = wall[0] < 100;
      floors = r.int(6, 9); const fh = (H - 150) / floors, cols = r.int(3, 5), cw = W / cols;
      g.fillStyle = `rgb(${wall})`; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 9000; i++) { const k = (hash2(i, seed) - 0.5) * 18; g.fillStyle = `rgba(${k > 0 ? '255,255,255' : '0,0,0'},${Math.abs(k) / 255})`; g.fillRect(hash1(i * 3 + seed) * W, hash1(i * 7 + seed) * H, 4, 3); }
      for (let f = 0; f < floors; f++) for (let c = 0; c < cols; c++) {
        const x = c * cw + cw * 0.14, y = 40 + f * fh + fh * 0.16, w = cw * 0.72, h = fh * 0.62, on = r.next() < 0.42;
        if (on) { const warm = r.next() < 0.7, gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, warm ? '#ffd9a0' : '#e8eeff'); gr.addColorStop(1, warm ? '#e8934a' : '#a8b8d8'); g.fillStyle = gr; lit.push([x, y, w, h]); }
        else { const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, glassy ? '#3a4a5c' : '#2a3442'); gr.addColorStop(1, '#10151c'); g.fillStyle = gr; }
        g.fillRect(x, y, w, h);
        if (on && r.next() < 0.5) { g.fillStyle = 'rgba(60,30,20,0.45)'; g.fillRect(x, y, w * r.range(0.15, 0.4), h); }
        g.fillStyle = glassy ? 'rgba(200,210,220,0.35)' : 'rgba(30,26,22,0.45)'; g.fillRect(x - 3, y + h, w + 6, 5); g.fillRect(x + w / 2 - 1.5, y, 3, h);
      }
      g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(0, 22, W, 14);
      const gy = H - 150; g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, gy - 8, W, 8);
      if (shop) {
        g.fillStyle = shop.sign; g.fillRect(10, gy + 4, W - 20, 34);
        g.fillStyle = shop.ink; g.font = 'bold 24px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(shop.name, W / 2, gy + 22);
        g.fillStyle = shop.glass; g.fillRect(20, gy + 46, W * 0.62, 96); lit.push([20, gy + 46, W * 0.62, 96], [10, gy + 4, W - 20, 34]);
        { const gx = 20, gw = W * 0.62, gt = gy + 46, gr2 = g.createLinearGradient(0, gt, 0, gt + 96); gr2.addColorStop(0, 'rgba(255,255,255,0.0)'); gr2.addColorStop(1, 'rgba(90,50,20,0.35)'); g.fillStyle = gr2; g.fillRect(gx, gt, gw, 96);
          for (let k = 0; k < 2; k++) { g.fillStyle = 'rgba(70,45,25,0.5)'; g.fillRect(gx, gt + 40 + k * 30, gw, 4); for (let q = 0; q < 16; q++) { g.fillStyle = `rgba(${r.int(90, 200)},${r.int(60, 150)},${r.int(40, 110)},0.45)`; g.fillRect(gx + 6 + q * gw / 16.5, gt + 40 + k * 30 - r.range(6, 14), r.range(6, 12), r.range(6, 14)); } }
          if (r.next() < 0.6) { const fx = gx + r.range(0.2, 0.8) * gw; g.fillStyle = 'rgba(40,28,22,0.55)'; g.beginPath(); g.arc(fx, gt + 30, 7, 0, 7); g.fill(); g.fillRect(fx - 8, gt + 38, 16, 50); } }
        g.fillStyle = '#20242a'; g.fillRect(W * 0.7, gy + 46, W * 0.22, 104); g.fillStyle = shop.glass; g.globalAlpha = 0.7; g.fillRect(W * 0.72, gy + 52, W * 0.18, 50); g.globalAlpha = 1; lit.push([W * 0.72, gy + 52, W * 0.18, 50]);
      }
      return;
    }
    if (kind === 'dutch') {
      // a narrow Dutch house: brick, three floors of tall white-framed windows, a gable, a door with a step
      const bricks = [[128, 58, 42], [96, 44, 34], [150, 82, 58], [110, 64, 50], [70, 40, 34]];
      const b = bricks[r.int(0, bricks.length - 1)];
      g.fillStyle = `rgb(${b})`; g.fillRect(0, 0, W, H);
      for (let y = 0; y < H; y += 10) for (let x = ((y / 10) % 2) * -15; x < W; x += 30) { const k = (hash2(x * 3 + seed, y * 7) - 0.5) * 34; g.fillStyle = `rgba(${k > 0 ? '255,240,220' : '0,0,0'},${Math.abs(k) / 255})`; g.fillRect(x, y, 28, 8); g.fillStyle = 'rgba(230,220,200,0.18)'; g.fillRect(x, y + 8, 30, 2); }
      // the gable (a stepped top; the sky above is transparent → black in the map, the set uses alphaTest)
      floors = 3; px = W / 5;
      for (let f = 0; f < 3; f++) for (let c = 0; c < 2; c++) {
        const x = (c ? 2.85 : 0.75) * px, y = 230 + f * 210, w = 1.4 * px, h = 150, on = r.next() < 0.4;
        g.fillStyle = '#f2efe8'; g.fillRect(x - 10, y - 10, w + 20, h + 20);
        const gr = g.createLinearGradient(0, y, 0, y + h); if (on) { gr.addColorStop(0, '#ffe0b0'); gr.addColorStop(1, '#e89850'); lit.push([x, y, w, h]); } else { gr.addColorStop(0, '#5a6a7a'); gr.addColorStop(1, '#1a2028'); }
        g.fillStyle = gr; g.fillRect(x, y, w, h); g.fillStyle = '#f2efe8'; g.fillRect(x, y + h * 0.42, w, 8); g.fillRect(x + w / 2 - 4, y, 8, h);
      }
      g.fillStyle = ['#1f3a2c', '#2a2a2a', '#5a1f24', '#1f2f4a', '#3a3a3a'][r.int(0, 4)]; g.fillRect(0.8 * px, H - 230, 1.1 * px, 210);
      g.fillStyle = '#f2efe8'; g.fillRect(0.8 * px - 8, H - 240, 1.1 * px + 16, 12); g.fillStyle = '#c9b37a'; g.fillRect(1.65 * px, H - 130, 8, 16);
      g.fillStyle = '#e8e0d0'; g.fillRect(2.6 * px, H - 160, 1.6 * px, 10);  // a sill
      return;
    }
    // a terraced house front (6 m): render or brick, two floors of sash windows, a shop or a door below
    const walls = [[226, 214, 190], [196, 206, 210], [150, 72, 56], [214, 200, 168], [170, 182, 160], [120, 112, 108], [232, 226, 214]];
    const wall = walls[r.int(0, walls.length - 1)]; px = W / 6;
    g.fillStyle = `rgb(${wall})`; g.fillRect(0, 0, W, H);
    const brick = wall[0] < 160 && wall[1] < 90;
    for (let y = 0; y < H; y += brick ? 9 : 4) for (let x = (brick && (y / 9) % 2 ? -14 : 0); x < W; x += brick ? 28 : 6) {
      const k = (hash2(x * 3 + seed, y * 7) - 0.5) * (brick ? 26 : 10);
      g.fillStyle = `rgba(${k > 0 ? '255,255,255' : '0,0,0'},${Math.abs(k) / 255})`; g.fillRect(x, y, brick ? 26 : 6, brick ? 8 : 4);
    }
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, 70, W, 18); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 88, W, 6);
    for (const fy of [0, 1]) for (const wx of [0, 1]) {
      const x = (wx ? 3.55 : 0.85) * px, y = H - (6.4 + fy * 3.1 + 1.75) * px, w = 1.6 * px, h = 1.75 * px, on = r.next() < 0.45;
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x - 6, y - 6, w + 12, h + 16);
      const gr = g.createLinearGradient(0, y, 0, y + h);
      if (on) { const warm = r.next() < 0.75; gr.addColorStop(0, warm ? '#ffcf8a' : '#e6ecff'); gr.addColorStop(1, warm ? '#e58a3c' : '#a8b8e0'); lit.push([x, y, w, h]); }
      else { gr.addColorStop(0, '#46566a'); gr.addColorStop(1, '#141a22'); }
      g.fillStyle = gr; g.fillRect(x, y, w, h);
      if (on) { g.fillStyle = `rgba(90,40,20,${r.range(0.3, 0.6)})`; g.fillRect(x, y, w * r.range(0.12, 0.3), h); }
      g.fillStyle = '#e8e4da'; g.fillRect(x, y + h / 2 - 3, w, 6); g.fillRect(x + w / 2 - 2, y, 4, h); g.fillRect(x - 6, y + h, w + 12, 10);
    }
    const gy = H - 3.6 * px;
    if (shop) {
      g.fillStyle = shop.sign; g.fillRect(0.2 * px, gy + 0.05 * px, 5.6 * px, 0.62 * px);
      g.fillStyle = shop.ink; g.font = `bold ${Math.round(0.36 * px)}px Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(shop.name, 3 * px, gy + 0.38 * px);
      const x = 0.35 * px, y = gy + 0.9 * px, w = 3.6 * px, h = 2.1 * px;
      g.fillStyle = shop.glass; g.fillRect(x, y, w, h);
      for (let k = 0; k < 3; k++) { g.fillStyle = 'rgba(60,40,30,0.35)'; g.fillRect(x, y + h * (0.35 + k * 0.25), w, 5); for (let q = 0; q < 9; q++) { g.fillStyle = `rgba(${r.int(80, 200)},${r.int(50, 150)},${r.int(30, 120)},0.6)`; g.fillRect(x + 8 + q * w / 9.3, y + h * (0.35 + k * 0.25) - r.range(12, 30), r.range(10, 22), r.range(12, 30)); } }
      g.fillStyle = '#2a2622'; g.fillRect(x + w + 0.2 * px, y - 0.1 * px, 1.3 * px, 2.3 * px);
      g.fillStyle = shop.glass; g.globalAlpha = 0.75; g.fillRect(x + w + 0.35 * px, y + 0.05 * px, 1.0 * px, 1.1 * px); g.globalAlpha = 1;
      lit.push([x, y, w, h], [x + w + 0.35 * px, y + 0.05 * px, 1.0 * px, 1.1 * px], [0.2 * px, gy + 0.05 * px, 5.6 * px, 0.62 * px]);
    } else {
      const doorX = (r.next() < 0.5 ? 0.6 : 4.2) * px;
      g.fillStyle = ['#1f3a5a', '#5a1f24', '#1f3a2c', '#2a2a2a', '#c9b48a'][r.int(0, 4)]; g.fillRect(doorX, gy + 0.9 * px, 1.1 * px, 2.3 * px);
      g.fillStyle = '#ffcf8a'; g.fillRect(doorX + 0.1 * px, gy + 0.62 * px, 0.9 * px, 0.25 * px); lit.push([doorX + 0.1 * px, gy + 0.62 * px, 0.9 * px, 0.25 * px]);
      const wx = doorX < W / 2 ? 2.3 * px : 0.7 * px, on = r.next() < 0.5;
      g.fillStyle = on ? '#ffc27a' : '#2a3442'; g.fillRect(wx, gy + 1.0 * px, 2.6 * px, 1.7 * px);
      if (on) { g.fillStyle = 'rgba(80,30,15,0.5)'; g.fillRect(wx, gy + 1.0 * px, 0.5 * px, 1.7 * px); lit.push([wx, gy + 1.0 * px, 2.6 * px, 1.7 * px]); }
      g.fillStyle = '#e8e4da'; g.fillRect(wx, gy + 1.82 * px, 2.6 * px, 5);
    }
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, H - 0.25 * px, W, 0.25 * px);
  });
  const glow = sbCanvas(W, H, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    g.drawImage(map, 0, 0);
    const img = g.getImageData(0, 0, W, H), d = img.data, mask = new Uint8Array(W * H);
    for (const [x, y, w, h] of lit) for (let j = Math.max(0, y | 0); j < Math.min(H, (y + h) | 0); j++) for (let i = Math.max(0, x | 0); i < Math.min(W, (x + w) | 0); i++) mask[j * W + i] = 1;
    for (let i = 0; i < W * H; i++) if (!mask[i]) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 0; }
    g.putImageData(img, 0, 0);
  });
  return { map, glow, shop, kind };
}

// asphalt (16 m of road along the canvas's x): worn, a dashed centre line, edge lines
function sbRoadCanvas() {
  const W = 1024, H = 512;
  return sbCanvas(W, H, (g) => {
    g.fillStyle = '#2e2f32'; g.fillRect(0, 0, W, H);
    const img = g.getImageData(0, 0, W, H), d = img.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const n = hash2(x, y) * 0.5 + noise1(x * 0.02 + y * 0.013, 5) * 0.25 + 0.25, i = (y * W + x) * 4, k = (n - 0.5) * 34;
      d[i] += k; d[i + 1] += k; d[i + 2] += k * 1.05;
    }
    g.putImageData(img, 0, 0);
    for (const yc of [0.18, 0.36, 0.64, 0.82]) { g.fillStyle = 'rgba(10,10,12,0.2)'; g.fillRect(0, yc * H - 14, W, 28); }
    g.fillStyle = 'rgba(232,230,220,0.85)';
    for (const x0 of [0, 0.5]) g.fillRect(x0 * W, H / 2 - 5, 0.24 * W, 10);
    g.fillRect(0, 10, W, 7); g.fillRect(0, H - 17, W, 7);
  });
}
// concrete paving flags (4 m per tile)
function sbFlagsCanvas() {
  return sbCanvas(512, 512, (g, W) => {
    g.fillStyle = '#6e6c68'; g.fillRect(0, 0, W, W);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const k = (hash2(i, j + 40) - 0.5) * 22; g.fillStyle = `rgb(${110 + k},${108 + k},${104 + k})`; g.fillRect(i * 128 + 2, j * 128 + 2, 124, 124); }
    const img = g.getImageData(0, 0, W, W), d = img.data;
    for (let i = 0; i < W * W; i++) { const k = (hash2(i % W, (i / W) | 0) - 0.5) * 18; d[i * 4] += k; d[i * 4 + 1] += k; d[i * 4 + 2] += k; }
    g.putImageData(img, 0, 0);
  });
}

// a straight street along z (in the set sbSet() made current). o = { len, halfRoad, pave, kind, seed, night, z0, crossingZ,
// lampsNear: [z0, z1] (which streetlights are real lights), parked: true, clearBefore: no parking this far on the +z side of the crossing }
function sbStreet(scene, o = {}) {
  const len = o.len || 600, zc = o.zMid ?? 0, HR = o.halfRoad || 3.6, PV = o.pave || 3.4, kind = o.kind || 'tower';
  const add = (m) => { scene.add(m); return m; };
  const roadTex = sbTex(sbRoadCanvas()); roadTex.repeat.set(len / 16, 1); roadTex.rotation = Math.PI / 2;
  const road = add(new THREE.Mesh(new THREE.PlaneGeometry(2 * HR, len), sbStd('#ffffff', o.night ? 0.24 : 0.62, 0.0, { map: roadTex, envMapIntensity: o.night ? 1.2 : 0.5 })));
  road.rotation.x = -Math.PI / 2; road.position.z = zc; road.receiveShadow = true;
  // (the texture runs along the road: rotate its uvs instead of the canvas)
  { const uv = road.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) { const u = uv.getX(i), v = uv.getY(i); uv.setXY(i, v * len / 16, u); } uv.needsUpdate = true; roadTex.rotation = 0; roadTex.repeat.set(1, 1); }
  const flags = sbTex(sbFlagsCanvas());
  const paveM = sbStd('#ffffff', o.night ? 0.35 : 0.8, 0, { map: flags, envMapIntensity: o.night ? 0.8 : 0.4 });
  for (const sx of [-1, 1]) {
    const p = add(new THREE.Mesh(new THREE.PlaneGeometry(PV, len), paveM.clone()));
    p.material.map = flags.clone(); p.material.map.needsUpdate = true; p.material.map.repeat.set(PV / 4, len / 4);
    p.rotation.x = -Math.PI / 2; p.position.set(sx * (HR + PV / 2), 0.15, zc); p.receiveShadow = true;
    const k = add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, len), sbStd('#8d8b85', 0.7))); k.position.set(sx * (HR + 0.1), 0.075, zc);
  }
  // the zebra crossing (white stripes across the road) and its posts with amber globes
  const cz = o.crossingZ ?? 0, stripeM = sbStd('#e9e6dc', o.night ? 0.35 : 0.7, 0, { envMapIntensity: 0.6 });
  const stripes = [];
  for (let x = -HR + 0.35; x < HR - 0.2; x += 0.9) { const s = add(new THREE.Mesh(new THREE.PlaneGeometry(0.5, 3.2), stripeM)); s.rotation.x = -Math.PI / 2; s.position.set(x + 0.25, 0.006, cz); s.receiveShadow = true; stripes.push(s); }
  const globeM = sbStd('#ffb347', 0.3, 0, { emissive: new THREE.Color('#ff9a1a'), emissiveIntensity: 0 });
  const globes = [];
  for (const sx of [-1, 1]) for (const dz of [-1.9, 1.9]) {
    const p = add(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 2.6, 10), sbStd('#1a1a1a', 0.5)));
    p.position.set(sx * (HR + 0.45), 1.45, cz + dz);
    for (let b = 0; b < 6; b++) { const band = add(new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.18, 10), sbStd(b % 2 ? '#111' : '#e8e4da', 0.5))); band.position.set(sx * (HR + 0.45), 0.4 + b * 0.36, cz + dz); }
    const gl = add(new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 12), globeM)); gl.position.set(sx * (HR + 0.45), 2.86, cz + dz); globes.push(gl);
  }
  // buildings both sides: fronts in a row (each its own width), facing the road
  const kinds = [];
  for (let k = 0; k < 10; k++) kinds.push(sbFacade((o.seed || 1) * 17 + k, kind));
  const fronts = kinds.map((f) => sbStd('#ffffff', 0.85, 0, { map: sbTex(f.map, { repeat: false }), emissive: new THREE.Color('#ffffff'), emissiveMap: sbTex(f.glow, { repeat: false }), emissiveIntensity: o.night ? 0.9 : 0.0 }));
  const sideM = sbStd('#3a3632', 0.9), roofM = sbStd('#2a2c30', 0.8);
  const bw = kind === 'tower' ? 14 : kind === 'dutch' ? 5 : 6;
  const buildings = [];
  for (const sx of [-1, 1]) for (let z = zc - len / 2; z < zc + len / 2; z += bw) {
    const i = Math.round(z / bw) * (sx > 0 ? 3 : 7) + (o.seed || 0), k = ((i % 10) + 10) % 10;
    const h = kind === 'tower' ? 26 + (hash1(i * 13) * 3 | 0) * 4.5 : kind === 'dutch' ? 11.5 + hash1(i * 5) * 1.6 : 12 + (hash1(i * 7) * 3 | 0) * 0.4;
    const d = 10, x = sx * (HR + PV + d / 2);
    // (the front faces the road: material index 0 is +x, 1 is −x)
    const mats = sx > 0 ? [sideM, fronts[k], roofM, sideM, sideM, sideM] : [fronts[k], sideM, roofM, sideM, sideM, sideM];
    const box = add(new THREE.Mesh(new THREE.BoxGeometry(d, h, bw - (kind === 'dutch' ? 0.02 : 0.05)), mats));
    box.position.set(x, h / 2 + 0.15, z + bw / 2); box.castShadow = false; box.receiveShadow = true;
    // (a face's u runs along z: flip it on the left side so shop signs read the right way)
    buildings.push({ box, x, z: z + bw / 2, h, shop: kinds[k].shop, sx });
  }
  // streetlights on both kerbs (staggered): the ones near the action are real lights, the rest glow
  const postM = sbStd('#3c4046', 0.5, 0.5), headM = sbStd('#fff3df', 0.4, 0, { emissive: new THREE.Color('#ffd9a6'), emissiveIntensity: o.night ? 2.4 : 0 });
  const glowAt = [], lamps = [];
  for (let z = zc - len / 2; z < zc + len / 2; z += 25) for (const sx of [-1, 1]) {
    const zz = z + (sx > 0 ? 12.5 : 0), x = sx * (HR + 0.5);
    const p = add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 6.2, 10), postM)); p.position.set(x, 3.24, zz);
    const arm = add(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.08), postM)); arm.position.set(x - sx * 0.6, 6.25, zz);
    const hd = add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.34), headM)); hd.position.set(x - sx * 1.15, 6.2, zz);
    glowAt.push([x - sx * 1.15, 6.1, zz]);
    if (o.night && o.lampsNear && zz > o.lampsNear[0] && zz < o.lampsNear[1]) { const L = new THREE.PointLight('#ffd6a0', 30, 32, 1.9); L.position.set(x - sx * 1.15, 6.0, zz); scene.add(L); lamps.push(L); }
  }
  // parked cars along both kerbs (not on the crossing)
  const parked = [];
  if (o.parked !== false) {
    const F = new VehicleFactory(), cols = ['#2e3a4c', '#8a8f94', '#1f2226', '#6a2a2a', '#c9c6be', '#e8e6e0', '#304a3a', '#3a3a40', '#7a6a50'];
    let n = 0;
    for (const sx of [-1, 1]) for (let z = zc - len / 2 + 8; z < zc + len / 2 - 8; z += 6.4 + hash1(n * 3.1) * 7) {
      n++; if ((z - cz > -9 && z - cz < (o.clearBefore || 9)) || hash1(n * 1.7) < 0.35) continue;
      const types = ['sedan', 'hatch', 'suv', 'hatch', 'sedan', 'van'], c = F.build(types[n % types.length], cols[n % cols.length]);
      c.group.position.set(sx * (HR - 1.05), 0, z); c.group.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2; scene.add(c.group);
      c.tail.emissiveIntensity = 0; parked.push(c);
    }
    F.m.head.emissiveIntensity = 0;
  }
  return { road, stripes, globes, globeM, glowAt, lamps, buildings, parked, fronts, headM, HR, PV, cz };
}

// rain: streaks falling past a moving point (the car, you). update(t, [x, y, z], wind) — pure function of t
function sbRain(scene, o = {}) {
  const N = o.n || 2400, R = o.r || 14, H = o.h || 9, pos = new Float32Array(N * 6);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  const m = new THREE.LineBasicMaterial({ color: o.color || '#b8c4d4', transparent: true, opacity: o.opacity ?? 0.32, depthWrite: false, fog: true });
  const lines = new THREE.LineSegments(g, m); lines.frustumCulled = false; scene.add(lines);
  const seeds = []; for (let i = 0; i < N; i++) seeds.push([hash1(i * 3.1 + 1), hash1(i * 5.7 + 2), hash1(i * 7.3 + 3), 0.8 + 0.4 * hash1(i * 1.9 + 4)]);
  return {
    lines, mat: m,
    update(t, c, vz = 0) {
      const V = 9.5, L = o.len || 0.55, wrap = (b, cc) => cc + ((((b - cc + R) % (2 * R)) + 2 * R) % (2 * R)) - R;
      for (let i = 0; i < N; i++) {
        const s = seeds[i], ph = (s[2] + t * V * s[3] / H) % 1, y = c[1] + H * (0.75 - ph);
        // (world-fixed cells that wrap round the point, so the rain always surrounds it)
        const x = wrap(s[0] * 2 * R, c[0]), z = wrap(s[1] * 2 * R, c[2]);
        const dz = vz * 0.035;
        pos.set([x, y, z, x + 0.03, y - L * s[3], z - dz], i * 6);
      }
      g.attributes.position.needsUpdate = true;
    },
  };
}
