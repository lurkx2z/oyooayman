/* =====================================================================
   TOWERS — the outside world the sets share: the two towers, Lower Manhattan around them, the rivers, the September
   sky, and the smoke. Metres; the North Tower's centre is (0, 0), the plaza is y = 0, x east, −z north.
     the towers  207 ft (63.1 m) square, roofs at 417 m (North) and 415 m (South), the North Tower's 110 m antenna.
                 The skin: 59 aluminium-clad columns a face, 40 in apart, with 22 in of glass between them and a
                 52 in spandrel at every floor (12 ft, 3.66 m); darker louvre bands at the mechanical floors (41–42,
                 75–76, 107–108); the tall arches at the base. The South Tower stands about 120 m to the south-south-east.
     the city    seeded blocks of buildings on the street grid, the plaza's low buildings, the Hudson to the west,
                 New Jersey beyond; no real building is modelled except the towers' shape.
     the smoke   from 8:46 out of floors 93–99 of the North Tower, from 9:03 out of floors 77–85 of the South Tower,
                 carried south-east on the north-west breeze of that morning (a pure function of time).
   ===================================================================== */

const NT_FLOOR_H = 3.66;
const NT_TW = { N: { x: 0, z: 0, roof: 417, w: 63.1 }, S: { x: 40, z: 122, roof: 415, w: 63.1 } };
const NT_WIND = [5.2, 0, 3.6];                       // the smoke's drift (m/s), towards the south-east
// the sun at 8:45 that morning: east-south-east, about 28° up (towards the sun: x east, y up, z south)
const NT_SUN = (() => { const az = MathX.deg(112), el = MathX.deg(28); return [Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)]; })();
// a jolt (a hard knock that rings down) and a sway (the tower swinging, damped): offsets for a camera
function ntJolt(t, t0, amp = 1, dur = 1.6, f = 13) { const a = t - t0; if (a < 0 || a > dur * 3) return [0, 0, 0]; const e = amp * Math.exp(-a / (dur * 0.45)) * MathX.smooth(a, 0, 0.03); return [e * noise1(a * f, 1) * 0.06, e * noise1(a * f, 2) * 0.05, e * noise1(a * f * 0.8, 3) * 2.2]; }
function ntSway(t, t0, amp = 1, period = 6.5, tau = 14) { const a = t - t0; if (a < 0) return [0, 0]; const e = amp * Math.exp(-a / tau) * MathX.smooth(a, 0, 0.8); return [e * Math.sin(2 * Math.PI * a / period) * 0.16, e * Math.sin(2 * Math.PI * a / period + 0.3) * 1.1]; }

// the skin: one texture tile = 4 column bays × 2 floors
function ntSkinTex() {
  const W = 512, H = 512;
  const c = ntCanvas(W, H, (g) => {
    const bay = W / 4, fl = H / 2;
    g.fillStyle = '#c9ccd0'; g.fillRect(0, 0, W, H);
    for (let f = 0; f < 2; f++) for (let b = 0; b < 4; b++) {
      const x0 = b * bay, y0 = f * fl, colW = bay * 0.45, glassX = x0 + colW / 2, glassW = bay - colW, spand = fl * 0.36;
      // the glass slit (reflects the sky: dark, a little blue), the spandrel band stays aluminium
      const gr = g.createLinearGradient(0, y0 + spand, 0, y0 + fl);
      gr.addColorStop(0, '#39424e'); gr.addColorStop(1, '#4a5564');
      g.fillStyle = gr; g.fillRect(glassX, y0 + spand, glassW, fl - spand);
      // the column cover's two faces catch light differently
      g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x0 + colW / 2 - 3, y0, 3, fl);
      g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x0 + bay - colW / 2, y0, 3, fl);
      g.fillStyle = 'rgba(0,0,0,0.10)'; g.fillRect(x0, y0 + spand - 2, bay, 2);
    }
  });
  const t = ntTex(c); t.anisotropy = 8; return t;
}
let NT_SKIN = null;
function ntSkin() { return NT_SKIN || (NT_SKIN = ntSkinTex()); }

// one tower: a group at its centre. o = { roof, antenna, lit (0…1 the windows' glow), base }
function ntTower(scene, T, o = {}) {
  const g = new THREE.Group(); g.position.set(T.x, 0, T.z); scene.add(g);
  const w = T.w, h = T.roof, floors = h / NT_FLOOR_H;
  const tex = ntSkin().clone(); tex.needsUpdate = true; tex.repeat.set(59 / 4, floors / 2);
  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex, metalness: 0.72, roughness: 0.32, envMapIntensity: 1.1 });
  if (o.env) mat.envMap = o.env;
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h - 22, w), mat); body.position.y = 22 + (h - 22) / 2; g.add(body);
  body.castShadow = body.receiveShadow = true;
  // the base: the columns merge in threes into tall "tree" columns with narrow arches (about 7 floors)
  const baseTex = ntTex(ntCanvas(512, 256, (c, W, H) => {
    c.fillStyle = '#c4c7cb'; c.fillRect(0, 0, W, H);
    for (let k = 0; k < 4; k++) { const x0 = k * W / 4 + 14, ww = W / 4 - 28; c.fillStyle = '#2a323c'; c.beginPath(); c.moveTo(x0, H); c.lineTo(x0, H * 0.32); c.quadraticCurveTo(x0 + ww / 2, H * 0.02, x0 + ww, H * 0.32); c.lineTo(x0 + ww, H); c.fill(); }
  }));
  baseTex.repeat.set(20 / 4, 1);
  const base = new THREE.Mesh(new THREE.BoxGeometry(w - 0.6, 22, w - 0.6), new THREE.MeshStandardMaterial({ map: baseTex, metalness: 0.6, roughness: 0.38 }));
  base.position.y = 11; g.add(base);
  // the mechanical floors: darker louvre bands, slightly proud of the skin
  const louv = new THREE.MeshStandardMaterial({ color: '#7d8188', metalness: 0.5, roughness: 0.5 });
  for (const f of [41, 75, 107]) if (f * NT_FLOOR_H < h - 5) { const b = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, NT_FLOOR_H * 2 - 0.8, w + 0.12), louv); b.position.y = (f - 0.5) * NT_FLOOR_H + NT_FLOOR_H; g.add(b); }
  // the roof edge, and the North Tower's antenna
  const roofM = new THREE.MeshStandardMaterial({ color: '#8a8e94', metalness: 0.5, roughness: 0.5 });
  const rf = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 1.4, w + 0.3), roofM); rf.position.y = h - 0.7; g.add(rf);
  const ant = [];
  if (o.antenna) {   // (dark against the sky, as in the photographs: a lattice mast reads as a dark rod from the street)
    const am = new THREE.MeshStandardMaterial({ color: '#34373b', metalness: 0.5, roughness: 0.55 });
    const m1 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 3.3, 110, 10), am); m1.position.y = h + 55; g.add(m1); ant.push(m1);
    for (const [y, r] of [[h + 2, 6.5], [h + 26, 4.2], [h + 52, 3.3]]) { const ring = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 2.6, 12), am); ring.position.y = y; g.add(ring); ant.push(ring); }
    for (const a of ant) a.userData.y0 = a.position.y;
  }
  return { g, body, mat, ant };
}

// ---------------------------------------------------------------------------------------------------------------------
// LOWER MANHATTAN: blocks of buildings in merged geometry (one draw per material), seeded
// ---------------------------------------------------------------------------------------------------------------------
function ntWindowTex(seed, base, win, lit, litCol = '#7a7466') {
  const r = new RNG(seed);
  return ntTex(ntCanvas(256, 256, (g, W, H) => {
    g.fillStyle = base; g.fillRect(0, 0, W, H);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const v = r.next(); g.fillStyle = v < lit ? litCol : win; g.fillRect(x * 32 + 6, y * 32 + 8, 20, 18);
    }
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(0,0,0,${r.range(0, 0.05)})`; g.fillRect(r.range(0, W), r.range(0, H), r.range(2, 20), r.range(2, 10)); }
  }));
}
// add one box (x0..x1, y0..y1, z0..z1) to arrays; uv in metres / 10 (one window tile = 10 m)
function ntBoxInto(A, x0, x1, y0, y1, z0, z1, top = true) {
  const faces = [
    [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], z1 - z0],
    [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], z1 - z0],
    [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], x1 - x0],
    [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], x1 - x0],
  ];
  if (top) faces.push([[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], -1]);
  for (const [a, b, c, d, n, w] of faces) {
    const i0 = A.pos.length / 3, hh = (y1 - y0) / 10, ww = w > 0 ? w / 10 : 0.01;
    for (const p of [a, b, c, d]) A.pos.push(p[0], p[1], p[2]);
    for (let k = 0; k < 4; k++) A.nor.push(n[0], n[1], n[2]);
    if (w > 0) A.uv.push(0, 0, ww, 0, ww, hh, 0, hh); else A.uv.push(0.02, 0.02, 0.03, 0.02, 0.03, 0.03, 0.02, 0.03);
    A.idx.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3);
  }
}
function ntGeoFrom(A) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(A.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(A.nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(A.uv, 2)); g.setIndex(A.idx); g.computeBoundingSphere(); return g;
}
// is (x, z) on Manhattan's land (a rough outline of the tip of the island, metres from the North Tower)
function ntLand(x, z) {
  if (z > 1450) return false;                                    // the Battery
  if (x < -430 + Math.max(0, z - 600) * 0.18) return false;      // the Hudson (Battery Park City's edge)
  if (x > 980 - Math.max(0, z - 300) * 0.25) return false;       // the East River
  return true;
}
// the city: o = { r (m), skip(x, z) → true for places to leave empty, seed, scale (height), lit }
function ntCity(scene, o = {}) {
  const r = new RNG(o.seed || 911), R = o.r || 1600;
  const mats = [
    ['#a8a092', '#4a4c50'], ['#8d8478', '#3a3c40'], ['#b7b2a6', '#5a6068'], ['#6e6a66', '#30343a'], ['#9aa2aa', '#46505c'], ['#7b5e4c', '#2e2a28'],
  ].map(([b, w], k) => {
    if (!o.night) return new THREE.MeshStandardMaterial({ map: ntWindowTex(31 + k, b, w, o.lit || 0.08), roughness: 0.82, metalness: 0.05 });
    const tx = ntWindowTex(31 + k, '#08090b', '#0d0f12', 0.34, ['#ffd9a0', '#f2e6c8', '#cfe0ff'][k % 3]);
    return new THREE.MeshStandardMaterial({ color: '#15171a', map: tx, emissive: '#ffffff', emissiveMap: tx, emissiveIntensity: 0.9, roughness: 0.8 });
  });
  const A = mats.map(() => ({ pos: [], nor: [], uv: [], idx: [] }));
  const BLK = 76, ST = 18;
  for (let bx = -Math.ceil(R / BLK); bx <= Math.ceil(R / BLK); bx++) for (let bz = -Math.ceil(R / BLK); bz <= Math.ceil(R / BLK); bz++) {
    const cx = bx * BLK + 12, cz = bz * BLK - 30;
    if (Math.hypot(cx, cz) > R) continue;
    // split each block into 1–3 lots across
    const n = 1 + Math.floor(r.next() * 3);
    for (let k = 0; k < n; k++) {
      const lw = (BLK - ST) / n, x0 = cx - (BLK - ST) / 2 + k * lw, x1 = x0 + lw - 1.5;
      const nz = 1 + Math.floor(r.next() * 2);
      for (let j = 0; j < nz; j++) {
        const ld = (BLK - ST) / nz, z0 = cz - (BLK - ST) / 2 + j * ld, z1 = z0 + ld - 1.5, mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
        if (!ntLand(mx, mz) || (o.skip && o.skip(mx, mz))) continue;
        const d = Math.hypot(mx, mz), tall = Math.exp(-d / 900);
        let h = 18 + Math.pow(r.next(), 2.2) * (60 + 210 * tall) * (o.scale || 1);
        if (r.next() < 0.06 * tall) h += 90;
        h = Math.min(h, 215);
        if (o.lowNorth && mz < -200) h = Math.min(h * 0.5, 110);   // (north of Vesey Street: Tribeca, the Civic Center, lower)   // (in 2001 nothing near the towers came close to their height; the tallest others, 40 Wall and 70 Pine, stood half a mile east)
        const m = Math.floor(r.next() * mats.length);
        ntBoxInto(A[m], x0, x1, 0, h, z0, z1);
        if (h > 70 && r.next() < 0.6) { const inset = 3 + r.next() * 5; ntBoxInto(A[m], x0 + inset, x1 - inset, h, h + 8 + r.next() * 30, z0 + inset, z1 - inset); }
      }
    }
  }
  const meshes = A.map((a, k) => { if (!a.pos.length) return null; const m = new THREE.Mesh(ntGeoFrom(a), mats[k]); m.castShadow = false; m.receiveShadow = true; scene.add(m); return m; }).filter(Boolean);
  // the ground (streets), the rivers, New Jersey and Brooklyn
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshStandardMaterial({ color: '#5d5a56', roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.4; scene.add(ground); ground.receiveShadow = true;
  const water = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.MeshStandardMaterial({ color: '#33475a', roughness: 0.22, metalness: 0.5 }));
  water.rotation.x = -Math.PI / 2; water.position.y = -0.2; scene.add(water);
  // (the land sits above the water: a slab cut to the outline)
  const shape = new THREE.Shape(); const outline = [];
  for (let z = -3000; z <= 1450; z += 50) outline.push([-430 + Math.max(0, z - 600) * 0.18, z]);
  for (let z = 1450; z >= -3000; z -= 50) outline.push([980 - Math.max(0, z - 300) * 0.25, z]);
  outline.forEach(([x, z], i) => (i ? shape.lineTo(x, -z) : shape.moveTo(x, -z)));
  const land = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({ color: '#5a5754', roughness: 0.95 }));
  land.rotation.x = -Math.PI / 2; land.position.y = 0.05; scene.add(land); land.receiveShadow = true;
  ground.visible = false;
  const NJ = { pos: [], nor: [], uv: [], idx: [] }, rr = new RNG(77);
  for (let i = 0; i < 160; i++) {
    const side = i < 110, x = side ? -1750 - rr.next() * 1400 : 1500 + rr.next() * 1500, z = -2600 + rr.next() * 4200;
    const near = side && z > -900 && z < 500 && x > -2100, h = 12 + Math.pow(rr.next(), 2) * (near ? 170 : 40), s = 25 + rr.next() * 40;
    ntBoxInto(NJ, x - s / 2, x + s / 2, 0, h, z - s / 2, z + s / 2);
  }
  const njMat = new THREE.MeshStandardMaterial({ map: ntWindowTex(55, '#9a9a96', '#4c5258', 0.05), roughness: 0.85 });
  const nj = new THREE.Mesh(ntGeoFrom(NJ), njMat); scene.add(nj);
  for (const xs of [[-6000, -1700], [1450, 6000]]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(xs[1] - xs[0], 9000), new THREE.MeshStandardMaterial({ color: '#56544f', roughness: 0.95 }));
    p.rotation.x = -Math.PI / 2; p.position.set((xs[0] + xs[1]) / 2, 0.02, 0); scene.add(p);
  }
  return { meshes, mats };
}
// the plaza and the low buildings of the World Trade Center around it (3, 4, 5, 6 WTC: about 9 and 22 floors)
function ntPlaza(scene) {
  // (4, 5 and 6 WTC: dark bronze-clad, with continuous bands of windows; one 10 m tile = 3 floors)
  const skin = ntTex(ntCanvas(256, 256, (g, W, H) => {
    g.fillStyle = '#2b2622'; g.fillRect(0, 0, W, H);
    for (let f = 0; f < 3; f++) {
      const y0 = f * H / 3 + 14, hh = H / 3 * 0.5, gr = g.createLinearGradient(0, y0, 0, y0 + hh);
      gr.addColorStop(0, '#59626c'); gr.addColorStop(1, '#3a4148'); g.fillStyle = gr; g.fillRect(0, y0, W, hh);
      g.fillStyle = '#211d1a'; for (let x = 0; x < W; x += 16) g.fillRect(x, y0, 3, hh);
    }
  }));
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', map: skin, roughness: 0.5, metalness: 0.35 });
  const A = { pos: [], nor: [], uv: [], idx: [] };
  for (const [x0, x1, z0, z1, h] of [[-120, -45, 40, 105, 80], [60, 140, 150, 210, 36], [85, 145, -60, 70, 36], [-120, -40, -110, -50, 36], [70, 135, -150, -80, 36]]) ntBoxInto(A, x0, x1, 0, h, z0, z1);
  const low = new THREE.Mesh(ntGeoFrom(A), m); scene.add(low); low.castShadow = low.receiveShadow = true;
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(260, 330), new THREE.MeshStandardMaterial({ color: '#8e8a84', roughness: 0.8 }));
  pl.rotation.x = -Math.PI / 2; pl.position.set(10, 0.3, 60); scene.add(pl); pl.receiveShadow = true;
  return low;
}
const ntNearWTC = (x, z) => x > -160 && x < 175 && z > -175 && z < 240;

// ---------------------------------------------------------------------------------------------------------------------
// THE SMOKE: puffs emitted from a band of floors on a face, carried by the wind, a pure function of time.
// src = { tower, face: [nx, nz] (outward), f0, f1 (floors), t0 (film s), rate (puffs/s), dark, fire }
// ---------------------------------------------------------------------------------------------------------------------
function ntPlume(P, t, src, o = {}) {
  if (t < src.t0) return;
  const T = NT_TW[src.tower], hw = T.w / 2, rate = src.rate || 6, dt = 1 / rate, life = src.life || 50;
  const i1 = Math.floor((t - src.t0) / dt), i0 = Math.max(0, i1 - Math.ceil(life / dt));
  const sp = (src.speed || 1) * (o.speed || 1);
  for (let i = i0; i <= i1; i++) {
    const a = (t - src.t0 - i * dt) * sp, h = hash1(i * 31 + (src.seed || 7)), h2 = hash1(i * 57 + 3), h3 = hash1(i * 91 + 11);
    if (a < 0 || a > life) continue;
    // where it leaves the building: along the face, at a floor in the band
    const along = (h - 0.5) * T.w * (src.span || 0.8), fl = src.f0 + (src.f1 - src.f0) * h2;
    const [nx, nz] = src.face, ex = T.x + nx * hw + (nz !== 0 ? along : 0), ez = T.z + nz * hw + (nx !== 0 ? along : 0), ey = fl * NT_FLOOR_H;
    const grow = 1 - Math.exp(-a / 6);
    const x = ex + nx * 6 * grow + NT_WIND[0] * a + noise1(a * 0.08 + i, 3) * (4 + a * 0.6);
    const z = ez + nz * 6 * grow + NT_WIND[2] * a + noise1(a * 0.08 + i, 9) * (4 + a * 0.6);
    const y = ey + 14 * grow + 0.35 * a - (src.sink || 0) * a * a * 0.01 + noise1(a * 0.07 + i, 5) * 3;
    const size = 9 + a * 1.6 * (0.7 + 0.6 * h3);
    const al = MathX.smooth(a, 0, 2.5) * Math.exp(-a / (life * 0.55)) * (src.alpha || 0.5) * (o.alpha || 1);
    const k = src.dark ? 0.025 + 0.11 * MathX.smooth(a, 0, 40) : 0.45, c = k * (0.85 + 0.3 * h3);
    P.add(x, y, z, size, al, c * 1.0, c * 0.97, c * 0.93);
  }
  // the fire's glow in the band (seen from far away only: a dim orange flicker, additive pool)
  if (o.fire && src.fire) for (let k = 0; k < 30; k++) {
    const h = hash1(k * 13 + 5), [nx, nz] = src.face, along = (h - 0.5) * T.w * 0.75, fl = src.f0 + (src.f1 - src.f0) * hash1(k * 7 + 1);
    const fx = T.x + nx * (hw + 0.6) + (nz !== 0 ? along : 0), fz = T.z + nz * (hw + 0.6) + (nx !== 0 ? along : 0);
    const fl2 = 0.5 + 0.5 * noise1(t * 2.3 + k * 1.7, 41);
    o.fire.add(fx, fl * NT_FLOOR_H, fz, 7 + 6 * fl2, 0.55 * fl2 * MathX.smooth(t, src.t0, src.t0 + 3), 1.0, 0.42, 0.12);
  }
}
// the sources this morning (t0 from the beats)
function ntSmokeSources() {
  return [
    { tower: 'N', face: [0, -1], f0: 93, f1: 99, t0: NT.hit, rate: 7, dark: true, fire: true, seed: 3, span: 0.9 },
    { tower: 'N', face: [1, 0], f0: 92, f1: 100, t0: NT.hit + 2, rate: 5, dark: true, fire: true, seed: 5, span: 0.9 },
    { tower: 'N', face: [0, 1], f0: 93, f1: 99, t0: NT.hit + 4, rate: 3, dark: true, seed: 8, span: 0.7, alpha: 0.4 },
    { tower: 'N', face: [-1, 0], f0: 93, f1: 99, t0: NT.hit + 4, rate: 3, dark: true, fire: true, seed: 9, span: 0.7, alpha: 0.4 },
    { tower: 'S', face: [0, 1], f0: 77, f1: 85, t0: NT.shake, rate: 6, dark: true, fire: true, seed: 11, span: 0.9 },
    { tower: 'S', face: [1, 0], f0: 78, f1: 86, t0: NT.shake + 2, rate: 5, dark: true, fire: true, seed: 13, span: 0.9 },
    { tower: 'S', face: [0, -1], f0: 78, f1: 84, t0: NT.shake + 3, rate: 3, dark: true, fire: true, seed: 15, span: 0.6, alpha: 0.4 },
  ];
}
