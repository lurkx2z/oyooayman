/* =====================================================================
   ROOM SET — the bedroom at dinner time (metres; origin at the middle of the floor, −z towards the window wall).
   Warm bedside lamp, blue dusk through the window, oak floorboards with real gaps (they become trenches),
   a bed, the bedside table (lamp, glass of water, phone), a desk, shelves, crumbs and dust near the floor.
     shBuildBedroom(W, app) → { spot, glow, mats, … }   (everything parented to W.root)
   ===================================================================== */

const SH_ROOM_BOX = { x0: -2.0, x1: 2.0, z0: -2.4, z1: 2.0, h: 2.5 };
const SH_TABLE = { x0: -0.6, x1: 0.02, z0: -2.4, z1: -1.95, top: 0.55 };
const SH_LAMP = [-0.46, 0.55, -2.26];

// planar UVs from a function of the position
function shPlanarUV(g, fn) {
  const p = g.attributes.position, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { const [u, v] = fn(p.getX(i), p.getY(i), p.getZ(i)); uv[i * 2] = u; uv[i * 2 + 1] = v; }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}
// a plain plaster canvas (soft mottling) for walls and ceiling
function shPlasterCanvas(seed, base) {
  return shCanvas(512, 512, (g, w, h) => {
    const img = g.createImageData(w, h), d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = (hash2(x >> 3, y >> 3) + hash2(x >> 5, (y >> 5) + seed) + hash2(x, y + seed)) / 4294967296 / 3 - 0.5;
      const i = (y * w + x) * 4, k = 1 + n * 0.07;
      d[i] = base[0] * k; d[i + 1] = base[1] * k; d[i + 2] = base[2] * k; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
}
// the view out of the window: dusk sky, rooftops, a tree, lit windows
function shDuskCanvas() {
  const r = new RNG(77);
  return shCanvas(768, 1024, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#14204a'); sky.addColorStop(0.45, '#2c3f7a'); sky.addColorStop(0.72, '#9a6c86'); sky.addColorStop(0.86, '#f0a070'); sky.addColorStop(1, '#ffd29a');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,250,235,0.9)';
    for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(r.range(0.1, 0.9) * w, r.range(0.05, 0.3) * h, r.range(1.2, 2.2), 0, 7); g.fill(); }
    // far rooftops
    g.fillStyle = '#2a2638';
    let x = 0; while (x < w) { const bw = r.range(70, 160), bh = r.range(90, 180); g.fillRect(x, h - bh - 140, bw, bh + 140); x += bw; }
    // near rooftops with chimneys and windows
    x = -20;
    while (x < w) {
      const bw = r.range(150, 260), top = h - r.range(170, 280);
      g.fillStyle = '#141522';
      g.beginPath(); g.moveTo(x, h); g.lineTo(x, top + 40); g.lineTo(x + bw / 2, top); g.lineTo(x + bw, top + 40); g.lineTo(x + bw, h); g.fill();
      g.fillRect(x + bw * 0.7, top - 10, 16, 40);
      for (let k = 0; k < 4; k++) if (r.chance(0.45)) {
        g.fillStyle = r.chance(0.5) ? '#ffcf7a' : '#ffb35c';
        g.fillRect(x + 20 + r.range(0, bw - 60), top + 70 + r.range(0, 120), 22, 30);
      }
      x += bw + r.range(10, 40);
    }
    // a tree
    g.fillStyle = '#0d0f17';
    g.fillRect(w * 0.78, h * 0.55, 10, h * 0.45);
    for (let i = 0; i < 70; i++) { g.beginPath(); g.arc(w * 0.79 + r.gauss() * 80, h * 0.5 + r.gauss() * 110, r.range(18, 40), 0, 7); g.fill(); }
  });
}

function shBuildBedroom(W, app) {
  const R = W.root, B = SH_ROOM_BOX, rng = new RNG(41);
  const mats = {};
  // ---- materials
  const woodTex = shTex(shWoodCanvas(5, 512, 2048, [154, 106, 66]));
  woodTex.anisotropy = 8;
  mats.floor = shStd('#ffffff', 0.42, 0, { map: woodTex, bumpMap: woodTex, bumpScale: 0.6, envMapIntensity: 0.6 });
  mats.gap = shStd('#120c08', 0.95);
  const wallTex = shTex(shPlasterCanvas(3, [118, 134, 142]));
  mats.wall = shStd('#ffffff', 0.92, 0, { map: wallTex });
  const ceilTex = shTex(shPlasterCanvas(9, [222, 218, 210]));
  mats.ceil = shStd('#ffffff', 0.95, 0, { map: ceilTex });
  mats.white = shStd('#e9e5dc', 0.6);
  mats.furn = shStd('#ffffff', 0.5, 0, { map: shTex(shWoodCanvas(11, 256, 1024, [120, 82, 52])) });
  mats.dark = shStd('#2b2622', 0.55);
  mats.metal = shStd('#b8b2a8', 0.32, 0.85);
  mats.sheet = shStd('#d9d3c6', 0.95);
  mats.duvet = shStd('#56708a', 0.92);
  mats.curtain = shStd('#8a3f2c', 0.95, 0, { side: THREE.DoubleSide });
  const env = shEnv(app.renderer, '#3b4766', '#6e5c50', '#2a221d');
  W.scene.environment = env;
  W.scene.environmentIntensity = 0.5;

  // ---- the floorboards (along z), with 3 mm gaps and bevelled edges
  const pitch = 0.143, gap = 0.004, nb = Math.round((B.x1 - B.x0) / pitch);
  const planks = [];
  for (let i = 0; i < nb; i++) {
    const x0 = B.x0 + i * pitch + gap / 2, x1 = x0 + pitch - gap;
    let z = B.z0 - rng.range(0, 1.5);
    while (z < B.z1) {
      const len = rng.range(1.3, 2.6), za = Math.max(z, B.z0), zb = Math.min(z + len, B.z1);
      if (zb - za > 0.05) {
        const g = shRoundBox(x1 - x0, 0.02, zb - za - 0.0012, 0.0018, 0.0012, 1);
        g.translate((x0 + x1) / 2, -0.02, (za + zb) / 2);
        const ou = rng.range(0, 1), ov = rng.range(0, 1), flip = rng.chance(0.5) ? -1 : 1;
        shPlanarUV(g, (px, py, pz) => [ou + flip * (px - x0) / (x1 - x0) * 0.92, ov + pz / 2.0 + py * 3]);
        planks.push(g);
      }
      z += len;
    }
  }
  const floor = new THREE.Mesh(THREE.mergeGeometries(planks.map((g) => g.index ? g.toNonIndexed() : g)), mats.floor);
  floor.receiveShadow = true; floor.castShadow = false; R.add(floor);
  const under = new THREE.Mesh(new THREE.PlaneGeometry(B.x1 - B.x0, B.z1 - B.z0), mats.gap);
  under.rotation.x = -Math.PI / 2; under.position.set(0, -0.007, (B.z0 + B.z1) / 2); R.add(under);

  // ---- walls, window, ceiling, skirting
  const wall = (w, h, x, y, z, ry, m = mats.wall, rep = 1) => {
    const g = new THREE.PlaneGeometry(w, h); shPlanarUV(g, (px, py) => [px / 1.6 * rep, py / 1.6 * rep]);
    const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.rotation.y = ry; o.receiveShadow = true; R.add(o); return o;
  };
  const win = { x0: -1.75, x1: -0.85, y0: 0.95, y1: 2.15 };
  // back wall (−z) around the window opening
  wall(win.x0 - B.x0, B.h, (B.x0 + win.x0) / 2, B.h / 2, B.z0, 0);
  wall(B.x1 - win.x1, B.h, (win.x1 + B.x1) / 2, B.h / 2, B.z0, 0);
  wall(win.x1 - win.x0, win.y0, (win.x0 + win.x1) / 2, win.y0 / 2, B.z0, 0);
  wall(win.x1 - win.x0, B.h - win.y1, (win.x0 + win.x1) / 2, (win.y1 + B.h) / 2, B.z0, 0);
  wall(B.z1 - B.z0, B.h, B.x0, B.h / 2, (B.z0 + B.z1) / 2, Math.PI / 2);
  wall(B.z1 - B.z0, B.h, B.x1, B.h / 2, (B.z0 + B.z1) / 2, -Math.PI / 2);
  wall(B.x1 - B.x0, B.h, 0, B.h / 2, B.z1, Math.PI);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(B.x1 - B.x0, B.z1 - B.z0), mats.ceil);
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, B.h, (B.z0 + B.z1) / 2); R.add(ceil);
  const bat = new Batcher();
  // skirting boards
  bat.box(B.x1 - B.x0, 0.09, 0.018, 0, 0.045, B.z0 + 0.009, mats.white);
  bat.box(B.x1 - B.x0, 0.09, 0.018, 0, 0.045, B.z1 - 0.009, mats.white);
  bat.box(0.018, 0.09, B.z1 - B.z0, B.x0 + 0.009, 0.045, (B.z0 + B.z1) / 2, mats.white);
  bat.box(0.018, 0.09, B.z1 - B.z0, B.x1 - 0.009, 0.045, (B.z0 + B.z1) / 2, mats.white);
  // window frame: reveal, sill, mullion and transom
  const wx = (win.x0 + win.x1) / 2, wy = (win.y0 + win.y1) / 2;
  bat.box(win.x1 - win.x0 + 0.1, 0.035, 0.2, wx, win.y0 - 0.0175, B.z0 + 0.04, mats.white);
  for (const [w, h, x, y] of [[0.05, win.y1 - win.y0, win.x0 + 0.025, wy], [0.05, win.y1 - win.y0, win.x1 - 0.025, wy], [win.x1 - win.x0, 0.05, wx, win.y1 - 0.025],
    [win.x1 - win.x0, 0.05, wx, win.y0 + 0.025], [0.035, win.y1 - win.y0, wx, wy], [win.x1 - win.x0, 0.035, wx, win.y0 + 0.78]]) bat.box(w, h, 0.06, x, y, B.z0 - 0.02, mats.white);
  for (const [x, y, w, h] of [[win.x0 - 0.04, wy, 0.04, win.y1 - win.y0 + 0.08], [win.x1 + 0.04, wy, 0.04, win.y1 - win.y0 + 0.08], [wx, win.y1 + 0.04, win.x1 - win.x0 + 0.12, 0.04]]) bat.box(w, h, 0.03, x, y, B.z0 + 0.012, mats.white);
  const dusk = shTex(shDuskCanvas(), { repeat: false });
  const view = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.1), new THREE.MeshBasicMaterial({ map: dusk, toneMapped: false }));
  view.position.set(wx, wy - 0.1, B.z0 - 0.35); R.add(view);
  mats.view = view.material;
  // curtains: folded cloth either side of the window
  const curtain = (xa, xb) => {
    const g = new THREE.PlaneGeometry(Math.abs(xb - xa), 2.25, 24, 8), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, Math.sin(x * 48) * 0.028 + Math.sin(x * 17) * 0.012); }
    g.computeVertexNormals();
    const o = new THREE.Mesh(g, mats.curtain); o.position.set((xa + xb) / 2, 2.25 / 2 + 0.12, B.z0 + 0.09); o.castShadow = true; o.receiveShadow = true; R.add(o);
  };
  curtain(win.x0 - 0.42, win.x0 - 0.02); curtain(win.x1 + 0.02, win.x1 + 0.4);
  bat.add(new THREE.CylinderGeometry(0.012, 0.012, 1.95, 8), mats.metal, Geo.matrix(wx, 2.37, B.z0 + 0.09, 0, 0, Math.PI / 2));
  // the ceiling light (off): rose, cord, shade
  bat.add(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 20), mats.white, Geo.matrix(0, B.h - 0.01, -0.3));
  bat.add(new THREE.CylinderGeometry(0.004, 0.004, 0.5, 6), mats.dark, Geo.matrix(0, B.h - 0.25, -0.3));
  bat.add(new THREE.CylinderGeometry(0.11, 0.2, 0.22, 24, 1, true), shStd('#e8e0cf', 0.8, 0, { side: THREE.DoubleSide }), Geo.matrix(0, B.h - 0.6, -0.3));

  // ---- the bed (right of the bedside table, head against the window wall)
  const bed = { x0: 0.42, x1: 1.92, z0: -2.4, z1: -0.32 };
  const bx = (bed.x0 + bed.x1) / 2, bz = (bed.z0 + bed.z1) / 2, bw = bed.x1 - bed.x0, bd = bed.z1 - bed.z0;
  bat.box(bw, 0.22, bd, bx, 0.17, bz, mats.furn);
  for (const [x, z] of [[bed.x0 + 0.04, bed.z1 - 0.04], [bed.x1 - 0.04, bed.z1 - 0.04]]) bat.box(0.06, 0.08, 0.06, x, 0.04, z, mats.furn);
  bat.box(bw + 0.04, 1.0, 0.05, bx, 0.5, bed.z0 + 0.03, mats.furn);
  shAddMesh(R, shRoundBox(bw - 0.04, 0.2, bd - 0.07, 0.06, 0.04, 3), mats.sheet, bx, 0.28, bz + 0.02);
  {
    // the duvet: a rounded slab with soft folds, over the lower two-thirds and hanging down the near side
    const g = shRoundBox(bw + 0.06, 0.07, bd * 0.7, 0.07, 0.03, 4), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      p.setY(i, y + 0.018 * Math.sin(x * 9 + z * 3) + 0.012 * Math.sin(z * 13 + x * 2) - 0.06 * Math.max(0, Math.abs(x) - bw / 2 + 0.05) * 6);
    }
    g.computeVertexNormals();
    const d = new THREE.Mesh(g, mats.duvet); d.position.set(bx, 0.47, bed.z1 - bd * 0.35); d.castShadow = d.receiveShadow = true; R.add(d);
    for (const px of [bx - 0.34, bx + 0.34]) {
      const pg = new THREE.SphereGeometry(0.2, 24, 12); pg.scale(1.55, 0.42, 0.95);
      const pl = new THREE.Mesh(pg, mats.sheet); pl.position.set(px, 0.53, bed.z0 + 0.26); pl.rotation.x = -0.25; pl.castShadow = pl.receiveShadow = true; R.add(pl);
    }
  }

  // ---- the bedside table
  const T = SH_TABLE, tx = (T.x0 + T.x1) / 2, tz = (T.z0 + T.z1) / 2, tw = T.x1 - T.x0, td = T.z1 - T.z0;
  shAddMesh(R, shRoundBox(tw, 0.026, td, 0.01, 0.004, 2), mats.furn, tx, T.top - 0.026, tz);
  bat.box(tw - 0.03, 0.4, td - 0.03, tx, 0.32, tz - 0.01, mats.furn);
  for (const [x, z] of [[T.x0 + 0.03, T.z1 - 0.03], [T.x1 - 0.03, T.z1 - 0.03], [T.x0 + 0.03, T.z0 + 0.03], [T.x1 - 0.03, T.z0 + 0.03]]) bat.box(0.03, 0.12, 0.03, x, 0.06, z, mats.furn);
  bat.box(tw - 0.06, 0.15, 0.012, tx, 0.42, T.z1 - 0.014, mats.furn);
  bat.add(new THREE.SphereGeometry(0.013, 12, 8), mats.metal, Geo.matrix(tx, 0.42, T.z1 - 0.004));
  bat.box(tw - 0.06, 0.18, 0.012, tx, 0.22, T.z1 - 0.014, mats.furn);
  bat.add(new THREE.SphereGeometry(0.013, 12, 8), mats.metal, Geo.matrix(tx, 0.22, T.z1 - 0.004));
  // the lamp
  const [lx, ly, lz] = SH_LAMP;
  bat.add(new THREE.CylinderGeometry(0.065, 0.075, 0.025, 28), mats.dark, Geo.matrix(lx, ly + 0.0125, lz));
  bat.add(new THREE.CylinderGeometry(0.009, 0.009, 0.25, 10), mats.metal, Geo.matrix(lx, ly + 0.15, lz));
  const shadeMat = new THREE.MeshStandardMaterial({ color: '#f3dfbd', roughness: 0.9, emissive: '#ffae5c', emissiveIntensity: 1.6, side: THREE.DoubleSide });
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.13, 0.17, 32, 1, true), shadeMat);
  shade.position.set(lx, ly + 0.33, lz); R.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.028, 16, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 4.2, 2.4), toneMapped: false }));
  bulb.position.set(lx, ly + 0.29, lz); R.add(bulb);
  // books and a charger cable on the table, behind the lamp
  bat.box(0.15, 0.03, 0.21, tx + 0.04, T.top + 0.015, T.z0 + 0.14, shStd('#3d5a4a', 0.8), 0.2);
  bat.box(0.14, 0.025, 0.2, tx + 0.045, T.top + 0.0425, T.z0 + 0.14, shStd('#a8552f', 0.8), 0.12);

  // ---- a desk and chair by the left wall, shelves above
  bat.box(0.62, 0.03, 1.3, B.x0 + 0.33, 0.75, -0.55, mats.furn);
  for (const [x, z] of [[B.x0 + 0.06, -1.15], [B.x0 + 0.6, -1.15], [B.x0 + 0.06, 0.05], [B.x0 + 0.6, 0.05]]) bat.box(0.035, 0.74, 0.035, x, 0.37, z, mats.furn);
  bat.box(0.24, 0.015, 0.33, B.x0 + 0.35, 0.775, -0.65, mats.dark, 0.1);
  bat.add(new THREE.CylinderGeometry(0.04, 0.035, 0.1, 16), shStd('#d9c9a3', 0.5), Geo.matrix(B.x0 + 0.4, 0.815, -0.2));
  bat.box(0.45, 0.04, 0.45, B.x0 + 0.85, 0.46, -0.5, mats.dark);
  bat.box(0.42, 0.5, 0.04, B.x0 + 0.85, 0.75, -0.29, mats.dark);
  bat.add(new THREE.CylinderGeometry(0.02, 0.02, 0.42, 8), mats.metal, Geo.matrix(B.x0 + 0.85, 0.23, -0.5));
  bat.add(new THREE.CylinderGeometry(0.25, 0.25, 0.02, 5), mats.metal, Geo.matrix(B.x0 + 0.85, 0.03, -0.5));
  for (const y of [1.35, 1.75]) {
    bat.box(0.24, 0.02, 1.1, B.x0 + 0.13, y, -0.6, mats.furn);
    let z = -1.12;
    while (z < -0.12) {
      const w = rng.range(0.025, 0.05), h = rng.range(0.18, 0.28);
      bat.box(0.18, h, w, B.x0 + 0.12, y + 0.01 + h / 2, z + w / 2, shStd(rng.pick(['#7a3b2e', '#2f4a5e', '#c9a14a', '#3f5d43', '#d8d2c2', '#5a3a5c']), 0.85), 0, { noShadow: true });
      z += w + 0.003;
    }
  }
  // a wardrobe at the right, near the door
  bat.box(0.6, 2.0, 1.0, B.x1 - 0.3, 1.0, 1.1, mats.furn);
  bat.box(0.012, 1.9, 0.004, B.x1 - 0.6, 1.0, 1.1, mats.dark);
  // a framed print over the bed
  bat.box(0.7, 0.5, 0.025, bx, 1.55, B.z0 + 0.015, mats.dark);
  const art = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.42), shStd('#ffffff', 0.8, 0, { map: shTex(shCanvas(256, 172, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#e9c9a0'); gr.addColorStop(1, '#c46a4a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#3c4a6a'; g.beginPath(); g.moveTo(0, h); g.lineTo(w * 0.35, h * 0.35); g.lineTo(w * 0.6, h * 0.7); g.lineTo(w * 0.8, h * 0.45); g.lineTo(w, h); g.fill();
    g.fillStyle = '#fff3d6'; g.beginPath(); g.arc(w * 0.7, h * 0.28, 16, 0, 7); g.fill();
  }), { repeat: false }) }));
  art.position.set(bx, 1.55, B.z0 + 0.029); R.add(art);

  // ---- crumbs, grit, fibres and hairs on the floor near the action (they matter once you are small)
  {
    const C = new Batcher(), r = new RNG(9);
    const grit = shStd('#8d8173', 0.9), crumb = shStd('#c8a46a', 0.85), fluff = shStd('#b9b4ad', 1.0), hairM = shStd('#2a1c14', 0.45);
    for (let i = 0; i < 420; i++) {
      const a = r.range(0, 6.283), d = Math.sqrt(r.next()) * 0.75, x = -0.3 + Math.cos(a) * d, z = -1.15 + Math.sin(a) * d * 0.8;
      const s = r.next() < 0.88 ? r.range(0.00012, 0.0006) : r.range(0.0007, 0.0022), m = s > 0.0007 ? crumb : grit;
      C.add(new THREE.IcosahedronGeometry(s, 0), m, Geo.matrix(x, s * 0.4, z, r.range(0, 3), r.range(0, 3), r.range(0, 3), 1, r.range(0.5, 1), r.range(0.6, 1.2)));
    }
    for (let i = 0; i < 9; i++) {
      // fibres and hairs: curved tubes lying on the boards
      const isHair = i < 3, len = isHair ? r.range(0.08, 0.14) : r.range(0.006, 0.02), rad = isHair ? 0.000035 : r.range(0.00006, 0.0001);
      const x0 = -0.3 + r.range(-0.35, 0.35), z0 = -1.15 + r.range(-0.3, 0.3), a0 = r.range(0, 6.28), bend = r.range(-6, 6) / len * 0.02;
      const pts = []; for (let k = 0; k <= 16; k++) { const u = k / 16, a = a0 + bend * u * len * 30; pts.push(new THREE.Vector3(x0 + Math.cos(a) * u * len, rad, z0 + Math.sin(a) * u * len)); }
      C.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, rad, 5), isHair ? hairM : fluff, null);
    }
    C.build(R, 'crumbs').forEach((m) => { m.castShadow = true; m.receiveShadow = true; });
  }

  bat.build(R, 'room').forEach((m) => { m.castShadow = true; m.receiveShadow = true; });

  // ---- lights: the lamp (warm key, shadows), a glow around the shade, dusk through the window, a cool fill
  const spot = new THREE.SpotLight('#ffb366', 1, 0, 1.05, 0.85, 2);
  spot.position.set(lx, ly + 0.27, lz + 0.02);
  spot.target.position.set(-0.22, 0, -1.25);
  spot.castShadow = true; spot.shadow.mapSize.set(2048, 2048); spot.shadow.bias = -0.00025;
  R.add(spot, spot.target);
  const glow = new THREE.PointLight('#ff9e55', 1, 0, 2); glow.position.set(lx, ly + 0.36, lz); R.add(glow);
  const dusk1 = new THREE.DirectionalLight('#86a3e0', 0.45); dusk1.position.set(-1.3, 1.6, -3.4); dusk1.target.position.set(0, 0, -0.8); R.add(dusk1, dusk1.target);
  const hemi = new THREE.HemisphereLight('#6a76b0', '#3a2a22', 0.7); R.add(hemi);
  // a soft violet fill from behind you (the landing light through the open door), so the shadow sides keep their detail
  const fill = new THREE.DirectionalLight('#8c86d8', 0.55); fill.position.set(0.6, 1.8, 2.5); fill.target.position.set(-0.2, 0.2, -1.4); R.add(fill, fill.target);
  return { spot, glow, dusk: dusk1, hemi, fill, mats, shade: shadeMat, bulb, floor };
}
