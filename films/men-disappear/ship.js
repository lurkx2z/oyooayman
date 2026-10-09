/* =====================================================================
   SHIP — a 180 m container ship coming up the harbour with nobody aboard (its pilot and crew were men). Its
   engine stays at the last order (about 6 knots) and its rudder at the last angle, so it holds a straight line
   that misses the navigation span and meets the pier at z −60 (the same thing happened, with a power failure,
   to the Dali at Baltimore's Key Bridge in 2024).
   Local frame: the stem at the origin, +x toward the stern, +y up from the waterline, z across the beam.
   ===================================================================== */

const MD_SHIP = {
  L: 180, B: 30, draft: 9, v: 3.2,                 // 3.2 m/s ≈ 6.2 knots
  head: MathX.deg(10),                             // its line, measured from straight across the harbour (−x), turning toward +z
  hit: { x: 5.9, z: -61.0 },                       // the bow at the moment the raked stem (6 m ahead at deck height) meets the pier column
  crush: 7.0, crushTau: 1.9,                       // after the hit: it drives on into the pier and the falling span, ~7 m
};
// the direction it travels (unit, world xz) and the stern direction
MD_SHIP.dir = [-Math.cos(MD_SHIP.head), Math.sin(MD_SHIP.head)];
// metres it has advanced past the hit point (negative before the hit)
function mdShipAdv(t) {
  const d = t - MD.hit;
  if (d <= 0) return MD_SHIP.v * d;
  return MD_SHIP.crush * (1 - Math.exp(-d / MD_SHIP.crushTau));
}
function mdShipSpeed(t) { const d = t - MD.hit; return d <= 0 ? MD_SHIP.v : MD_SHIP.v * Math.exp(-d / MD_SHIP.crushTau) * 0.6; }
function mdShipBow(t) { const a = mdShipAdv(t); return [MD_SHIP.hit.x + MD_SHIP.dir[0] * a, MD_SHIP.hit.z + MD_SHIP.dir[1] * a]; }
function mdShipGap(t) { return Math.max(0, -mdShipAdv(t)); }
// a point given in ship-local metres → world (into out[0..2])
function mdShipWorld(t, lx, ly, lz, out = [0, 0, 0]) {
  const b = mdShipBow(t), c = Math.cos(MD_SHIP.head), s = Math.sin(MD_SHIP.head);
  // local +x (aft) = −dir; local +z = across (rotated with the hull)
  const p = mdShipPose(t);
  out[0] = b[0] + lx * c + lz * s; out[1] = ly + p.heave + lx * p.trim; out[2] = b[1] - lx * s + lz * c;
  return out;
}
// small motions: a slow heave and, at the hit, a jolt (the bow rides up on the wreckage a little)
function mdShipPose(t) {
  const d = t - MD.hit, k = MathX.smooth(d, 0, 1.4);
  return { heave: 0.12 * Math.sin(t * 0.55) + 0.9 * k - 0.25 * MathX.impulse(d, 0, 0.4), trim: -0.004 * k, roll: 0.006 * Math.sin(t * 0.43) + 0.012 * Math.sin(Math.max(0, d) * 2.2) * Math.exp(-Math.max(0, d) / 2) };
}

class MdShip {
  constructor(scene) {
    this.g = new THREE.Group(); this.g.name = 'ship'; scene.add(this.g);
    const S = MD_SHIP;
    this.m = {
      hull: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.15, name: 'shipHull' }),
      deck: Mat.std('#5d5a52', { roughness: 0.9 }),
      white: Mat.std('#e2ded4', { roughness: 0.55 }),
      grey: Mat.std('#8d9196', { roughness: 0.5, metalness: 0.3 }),
      dark: Mat.std('#24282c', { roughness: 0.6 }),
      funnel: Mat.std('#2b3d55', { roughness: 0.5 }),
      stripe: Mat.std('#c9a13a', { roughness: 0.5 }),
      glass: new THREE.MeshStandardMaterial({ color: '#1d2a33', roughness: 0.08, metalness: 0.4, transparent: true, opacity: 0.38, depthWrite: false, name: 'wheelhouse glass' }),
      lit: new THREE.MeshStandardMaterial({ color: '#2a2620', emissive: '#ffe2b0', emissiveIntensity: 1.4, roughness: 0.9, name: 'litWin' }),
      room: new THREE.MeshStandardMaterial({ color: '#cfc8b8', emissive: '#fff0d8', emissiveIntensity: 0.55, roughness: 0.9, side: THREE.BackSide, name: 'bridge room' }),
      lamp: (c, k = 3) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), name: 'navlight' }),
    };
    this._hull();
    this._deckGear();
    this._containers();
    this._house();
    this.fallers = this._fallers();
    this.g.traverse((o) => { if (o.isMesh && o.material !== this.m.glass) { o.castShadow = true; o.receiveShadow = true; } });
  }

  // hull: stations along the length, each a half-section from the keel to the deck edge (flared at the bow)
  _hull() {
    const S = MD_SHIP, N = 46, ys = [-S.draft, -S.draft + 0.3, -6, -3, 0, 0.45, 0.6, 3, 6, 9];
    const sheer = (x) => 11 + 3.2 * Math.pow(1 - MathX.clamp(x / 40, 0, 1), 2) + 1.0 * MathX.smooth(x, S.L - 30, S.L);
    const hb = (x, y) => {
      // half-beam at station x, height y
      const bow = MathX.clamp((x + 0.001) / 34, 0, 1), stern = 1 - 0.18 * MathX.smooth(x, S.L - 24, S.L) * MathX.smooth(y, 3, -S.draft);
      const flare = 1 + 0.35 * (1 - bow) * MathX.clamp((y + 2) / 14, 0, 1);
      const bilge = y < -S.draft + 1.6 ? 0.82 + 0.18 * (y + S.draft) / 1.6 : 1;
      return S.B / 2 * Math.pow(bow, 0.62) * MathX.clamp(flare, 1, 1.35) * stern * bilge;
    };
    const rake = (y) => -6 * MathX.clamp((y + 3) / 17, 0, 1) + 3.5 * MathX.clamp((-3 - y) / 6, 0, 1);   // stem raked forward above the water, bulb below
    const stations = []; for (let i = 0; i <= N; i++) { const u = i / N; stations.push(S.L * Math.pow(u, 1.25)); }
    const pos = [], col = [];
    const hullC = new THREE.Color('#25313c'), boot = new THREE.Color('#d8d4c8'), red = new THREE.Color('#6d2620');
    const cOf = (y) => (y < 0.4 ? red : y < 0.62 ? boot : hullC);
    const P = (x, y, side) => { const top = Math.min(y, sheer(x)); const xr = x + (x < 40 ? rake(top) * (1 - x / 40) : 0); return [xr, top, side * hb(x, top)]; };
    for (let i = 0; i < N; i++) {
      const xa = stations[i], xb = stations[i + 1];
      const yA = [...ys, sheer(xa)], yB = [...ys, sheer(xb)];
      for (const side of [-1, 1]) for (let k = 0; k < yA.length - 1; k++) {
        const a = P(xa, yA[k], side), b = P(xb, yB[k], side), c = P(xb, yB[k + 1], side), d = P(xa, yA[k + 1], side);
        const tri = side > 0 ? [a, b, c, a, c, d] : [a, c, b, a, d, c];
        for (const v of tri) { pos.push(...v); const cc = cOf(v[1]); col.push(cc.r, cc.g, cc.b); }
      }
      // the bottom (flat)
      const a = P(xa, -S.draft, -1), b = P(xb, -S.draft, -1), c = P(xb, -S.draft, 1), d = P(xa, -S.draft, 1);
      for (const v of [a, c, b, a, d, c]) { pos.push(...v); col.push(red.r, red.g, red.b); }
    }
    // transom
    const xe = S.L, ye = [...ys, sheer(xe)];
    for (let k = 0; k < ye.length - 1; k++) {
      const a = P(xe, ye[k], -1), b = P(xe, ye[k], 1), c = P(xe, ye[k + 1], 1), d = P(xe, ye[k + 1], -1);
      for (const v of [a, b, c, a, c, d]) { pos.push(...v); const cc = cOf(v[1]); col.push(cc.r, cc.g, cc.b); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
    this.hull = new THREE.Mesh(g, this.m.hull); this.g.add(this.hull);
    // the deck: a polygon following the deck edge
    const dpos = [];
    for (let i = 0; i < N; i++) {
      const a = P(stations[i], 99, -1), b = P(stations[i + 1], 99, -1), c = P(stations[i + 1], 99, 1), d = P(stations[i], 99, 1);
      for (const v of [a, c, b, a, d, c]) dpos.push(v[0], v[1] - 0.05, v[2]);
    }
    const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(dpos, 3)); dg.computeVertexNormals();
    this.g.add(new THREE.Mesh(dg, this.m.deck));
    // bulwark round the forecastle (a low wall following the bow's deck edge)
    for (let i = 0; i < 14; i++) {
      const xa = stations[i], xb = stations[i + 1];
      for (const side of [-1, 1]) {
        const a = P(xa, 99, side), b = P(xb, 99, side), h = 1.3;
        const q = side > 0 ? Geo.quad([a[0], a[1], a[2]], [b[0], b[1], b[2]], [b[0], b[1] + h, b[2]], [a[0], a[1] + h, a[2]]) : Geo.quad([b[0], b[1], b[2]], [a[0], a[1], a[2]], [a[0], a[1] + h, a[2]], [b[0], b[1] + h, b[2]]);
        const mesh = new THREE.Mesh(q, this.m.white); mesh.material.side = THREE.DoubleSide; this.g.add(mesh);
      }
    }
    this.sheer = sheer; this.hb = hb;
  }

  _deckGear() {
    const m = this.m, add = (geo, mat, x, y, z, ry = 0) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.rotation.y = ry; this.g.add(o); return o; };
    const y0 = this.sheer(8);
    // windlasses, bitts, the foremast with its lights
    for (const z of [-4, 4]) { add(new THREE.BoxGeometry(2.4, 1.2, 1.8), m.grey, 9, y0 + 0.6, z); add(new THREE.CylinderGeometry(0.7, 0.7, 1.6, 10), m.dark, 9, y0 + 1.4, z).rotation.x = Math.PI / 2; }
    for (const z of [-9, 9]) for (const x of [14, 18]) add(new THREE.CylinderGeometry(0.28, 0.28, 0.9, 8), m.dark, x, this.sheer(x) + 0.45, z);
    add(new THREE.CylinderGeometry(0.25, 0.32, 12, 8), m.white, 12, y0 + 6, 0);
    add(new THREE.BoxGeometry(0.2, 0.2, 3.2), m.white, 12, y0 + 9.5, 0);
    this.foreLight = add(new THREE.SphereGeometry(0.28, 8, 6), m.lamp('#fff4dc', 4), 12, y0 + 12.2, 0);
    // hawse pipes (anchors) near the stem
    for (const side of [-1, 1]) { const a = add(new THREE.BoxGeometry(2.0, 2.4, 0.6), m.dark, 6.5, 9.0, side * (this.hb(6.5, 9) - 0.1)); a.rotation.z = 0.35; }
    // a breakwater (the V-shaped wall that shields the first container bay)
    for (const side of [-1, 1]) { const w = add(new THREE.BoxGeometry(0.4, 3.0, 13), m.white, 22, this.sheer(22) + 1.5, side * 5.8); w.rotation.y = side * 0.55; }
  }

  // containers: bays of 40-foot boxes, 4 tiers on deck, with lashing bridges between the bays
  _containers() {
    const c = Tex.canvas(128, 64), x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, 128, 64);
    for (let i = 0; i < 32; i++) { x.fillStyle = i % 2 ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.1)'; x.fillRect(i * 4, 0, 2, 64); }
    x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(0, 0, 128, 3); x.fillRect(0, 61, 128, 3);
    const tex = Tex.tex(c, { repeat: false });
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.72, metalness: 0.1, name: 'containers' });
    const pal = ['#8a3a2a', '#2c4f73', '#b88a2c', '#3c6a46', '#8f908a', '#6d2f3a', '#c9c4b8', '#3f5a6a', '#a8562a', '#2e3b4a'].map((h) => new THREE.Color(h));
    const geo = new THREE.BoxGeometry(12.2, 2.59, 2.44);
    const list = [], bays = [];
    for (let bx = 28; bx < 140; bx += 13.2) bays.push(bx);
    const rng = new RNG(808);
    for (const [bi, bx] of bays.entries()) {
      const deckY = this.sheer(bx);
      const rows = Math.floor((this.hb(bx, deckY) * 2 - 1.2) / 2.5);
      const tiers = bi === 0 ? 3 : bi === 1 ? 4 : 5;
      for (let r = 0; r < rows; r++) {
        const z = (r - (rows - 1) / 2) * 2.5, h = tiers - (rng.next() < 0.18 ? 1 : 0);
        for (let k = 0; k < h; k++) list.push([bx + 6.1, deckY + 1.3 + k * 2.6, z, pal[Math.floor(rng.next() * pal.length)].clone().multiplyScalar(0.85 + 0.25 * rng.next()), bi, r, k, rows]);
      }
      if (bi > 0) { const lb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7.8, rows * 2.5), this.m.grey); lb.position.set(bx - 0.4, deckY + 3.9, 0); this.g.add(lb); }
    }
    this.boxes = new THREE.InstancedMesh(geo, mat, list.length);
    const M = new THREE.Matrix4();
    list.forEach((L, i) => { M.makeTranslation(L[0], L[1], L[2]); this.boxes.setMatrixAt(i, M); this.boxes.setColorAt(i, L[3]); });
    this.g.add(this.boxes);
    this.boxList = list; this.boxMat = mat; this.boxGeo = geo;
  }

  // the accommodation house aft: decks of lit windows, the wheelhouse on top (empty, lit), bridge wings, the funnel
  _house() {
    const m = this.m, S = MD_SHIP, x0 = 146, x1 = 160, yd = this.sheer(150), lv = 2.9, n = 6;
    const add = (geo, mat, x, y, z) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); this.g.add(o); return o; };
    add(new THREE.BoxGeometry(x1 - x0, n * lv, 24), m.white, (x0 + x1) / 2, yd + n * lv / 2, 0);
    // window rows (lit cabins, some dark) on the front face and the sides
    const rng = new RNG(99);
    for (let f = 0; f < n; f++) {
      const y = yd + f * lv + 1.5;
      for (let i = 0; i < 9; i++) {
        const z = -10 + i * 2.5, on = rng.next() < 0.6;
        add(new THREE.BoxGeometry(0.1, 1.0, 1.4), on ? m.lit : m.dark, x0 - 0.05, y, z);
      }
      for (const side of [-1, 1]) for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(1.4, 1.0, 0.1), rng.next() < 0.5 ? m.lit : m.dark, x0 + 2 + i * 3, y, side * 12.05);
    }
    // the wheelhouse: a lit room you can see into through a band of glass
    const yw = yd + n * lv, wh = 3.0;
    this.wheel = { x: x0 + 3.5, y: yw + 1.6, z: 0 };
    add(new THREE.BoxGeometry(9, 0.3, 30.5), m.white, x0 + 4.5, yw + wh + 0.15, 0);                // roof (runs out over the wings)
    add(new THREE.BoxGeometry(9, 1.0, 26), m.white, x0 + 4.5, yw + 0.5, 0);                        // below the windows
    add(new THREE.BoxGeometry(6, wh, 25.6), m.room, x0 + 4.0, yw + wh / 2, 0);                     // the room (inside faces lit)
    add(new THREE.BoxGeometry(0.1, wh - 1.0, 25.4), m.glass, x0 + 0.95, yw + 1.0 + (wh - 1.0) / 2, 0);   // the front glass
    for (let i = 0; i <= 10; i++) add(new THREE.BoxGeometry(0.22, wh - 1.0, 0.18), m.white, x0 + 0.95, yw + 1.0 + (wh - 1.0) / 2, -12.7 + i * 2.54);   // mullions
    // inside: the console along the windows, two empty chairs, the wheel stand, screens glowing
    add(new THREE.BoxGeometry(1.1, 1.1, 14), m.dark, x0 + 1.8, yw + 0.55, 0);
    const scr = new THREE.MeshBasicMaterial({ color: new THREE.Color('#7fb2c8').multiplyScalar(1.3), name: 'screens' });
    for (let i = 0; i < 6; i++) { const s = add(new THREE.BoxGeometry(0.05, 0.5, 0.8), scr, x0 + 2.3, yw + 1.35, -5 + i * 2); s.rotation.z = 0.3; }
    for (const z of [-1.6, 1.6]) {
      add(new THREE.BoxGeometry(0.8, 0.5, 0.8), m.dark, x0 + 3.3, yw + 0.75, z);
      add(new THREE.BoxGeometry(0.15, 1.0, 0.8), m.dark, x0 + 3.7, yw + 1.3, z);
      add(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 6), m.grey, x0 + 3.3, yw + 0.25, z);
    }
    add(new THREE.CylinderGeometry(0.12, 0.16, 1.0, 8), m.grey, x0 + 2.6, yw + 0.5, 0);
    // bridge wings out to the ship's sides, with the side lights (red to port, green to starboard)
    for (const side of [-1, 1]) {
      add(new THREE.BoxGeometry(4, 1.2, 3.2), m.white, x0 + 2.0, yw + 0.6, side * 13.9);
      add(new THREE.SphereGeometry(0.3, 8, 6), m.lamp(side > 0 ? '#30ff60' : '#ff3020', 3), x0 + 0.6, yw + 1.5, side * 15.2);
    }
    // the mast with its radar and lights, the funnel behind
    add(new THREE.BoxGeometry(1.2, 6, 1.2), m.white, x0 + 6, yw + wh + 3, 0);
    add(new THREE.BoxGeometry(0.3, 0.25, 5.5), m.dark, x0 + 6, yw + wh + 4.5, 0);
    this.radar = add(new THREE.BoxGeometry(0.25, 0.25, 4.5), m.dark, x0 + 6, yw + wh + 6.2, 0);
    this.mastLight = add(new THREE.SphereGeometry(0.32, 8, 6), m.lamp('#fff4dc', 4), x0 + 6, yw + wh + 7.0, 0);
    add(new THREE.CylinderGeometry(2.6, 3.0, 9, 14), m.funnel, x1 + 4, yd + n * lv + 3.0, 0);
    add(new THREE.CylinderGeometry(2.62, 2.62, 1.0, 14), m.stripe, x1 + 4, yd + n * lv + 6.2, 0);
    // deck floodlights on the house front (light pools on the containers)
    for (const z of [-8, 8]) add(new THREE.BoxGeometry(0.3, 0.3, 0.5), m.lamp('#fff2d8', 3), x0 - 0.2, yd + n * lv - 0.4, z);
    // the stern light and the transom's name board (blank)
    add(new THREE.SphereGeometry(0.28, 8, 6), m.lamp('#fff4dc', 3.5), S.L + 0.2, this.sheer(S.L) + 1.0, 0);
  }

  // the first bay's top containers: torn loose by the impact, they slide forward and drop over the bow
  _fallers() {
    const out = [], M = new THREE.Matrix4();
    this.boxList.forEach((L, i) => {
      if (L[4] === 0 || (L[4] === 1 && L[6] === 2)) {
        const r = new RNG(400 + i), side = L[2] >= 0 ? 1 : -1;
        out.push({ i, base: L, delay: 0.15 + r.range(0, 0.5) + (L[4] === 1 ? 0.35 : 0), vx: -r.range(2.2, 3.4), vz: side * r.range(0.8, 2.6), spin: [r.range(-1.2, 1.2), r.range(-0.6, 0.6), side * r.range(0.5, 1.6)] });
      }
    });
    return out;
  }

  update(t) {
    const S = MD_SHIP, b = mdShipBow(t), p = mdShipPose(t);
    this.g.position.set(b[0], p.heave, b[1]);
    this.g.rotation.set(0, S.head, 0, 'YXZ');
    this.g.rotation.z = -p.trim * 40; this.g.rotation.x = p.roll;
    this.radar.rotation.y = t * 2.6;
    // the loose containers (ship-local motion: they keep the ship's 3.2 m/s when it stops; gravity once off the deck)
    const d = t - MD.hit, M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
    for (const f of this.fallers) {
      const L = f.base, u = d - f.delay;
      if (u <= 0) { M.makeTranslation(L[0], L[1], L[2]); this.boxes.setMatrixAt(f.i, M); continue; }
      // forward slide relative to the decelerating hull, then a fall once past the bow's flare
      const rel = S.v * (u - MathX.smooth(u, 0, 2.2) * 1.1);
      const x = L[0] - rel * 1.0 + f.vx * Math.max(0, u - 1.0) * 0.5, z = L[2] + f.vz * u * 0.6;
      const over = MathX.smooth(x, 22, 6), fall = Math.max(0, u - 0.7) * over;
      let y = L[1] - 0.5 * 9.8 * fall * fall;
      y = Math.max(y, -6);
      e.set(f.spin[0] * fall * 0.8, f.spin[1] * u * 0.3, f.spin[2] * (fall * 0.9 + 0.08 * Math.min(u, 1)));
      q.setFromEuler(e); M.compose(v.set(x, y, z), q, one); this.boxes.setMatrixAt(f.i, M);
    }
    this.boxes.instanceMatrix.needsUpdate = true;
  }
}
