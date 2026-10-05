/* =====================================================================
   VEHICLES — procedural car bodies (extruded side profiles with real
   wheel arches), a city bus, a motorcycle, and the TrafficSystem that
   drives them from the kinematics tables.
   ===================================================================== */

// Side profiles: x = length (rear → front), y = height. Arches are cut automatically.
const CAR_PROFILES = {
  sedan: {
    L: 4.72, W: 1.82, r: 0.33, axles: [1.02, 3.8], yb: 0.3,
    top: [[0.06, 0.32], [0.0, 0.5], [0.02, 0.82], [0.14, 0.98], [0.98, 1.03], [3.62, 1.0], [4.4, 0.88], [4.64, 0.8], [4.72, 0.6], [4.66, 0.32]],
    gh: [[0.98, 1.0], [1.72, 1.41], [3.02, 1.43], [3.64, 0.98]],
    win: [[[1.14, 1.05], [1.75, 1.36], [2.37, 1.37], [2.37, 1.05]], [[2.47, 1.05], [2.47, 1.37], [2.98, 1.38], [3.47, 1.05]]],
    rearGlass: [0, 1], windshield: [2, 3], head: 0.72, tail: 0.86, grille: true,
  },
  hatch: {
    L: 4.12, W: 1.78, r: 0.31, axles: [0.8, 3.38], yb: 0.28,
    top: [[0.05, 0.3], [0.0, 0.5], [0.02, 0.95], [0.08, 1.02], [3.24, 1.0], [3.9, 0.86], [4.08, 0.76], [4.12, 0.55], [4.06, 0.3]],
    gh: [[0.1, 1.0], [0.32, 1.43], [2.6, 1.46], [3.26, 0.98]],
    win: [[[0.44, 1.05], [0.52, 1.37], [1.5, 1.4], [1.5, 1.05]], [[1.6, 1.05], [1.6, 1.4], [2.55, 1.41], [3.08, 1.05]]],
    rearGlass: [0, 1], windshield: [2, 3], head: 0.74, tail: 0.92, grille: true,
  },
  suv: {
    L: 4.78, W: 1.92, r: 0.37, axles: [0.98, 3.86], yb: 0.36,
    top: [[0.08, 0.38], [0.0, 0.6], [0.02, 1.08], [0.1, 1.15], [3.64, 1.13], [4.46, 1.04], [4.72, 0.96], [4.78, 0.66], [4.7, 0.38]],
    gh: [[0.12, 1.12], [0.3, 1.74], [3.0, 1.76], [3.7, 1.12]],
    win: [[[0.38, 1.18], [0.46, 1.66], [1.5, 1.68], [1.5, 1.18]], [[1.6, 1.18], [1.6, 1.69], [2.42, 1.69], [2.42, 1.18]], [[2.52, 1.18], [2.52, 1.69], [2.94, 1.69], [3.52, 1.18]]],
    rearGlass: [0, 1], windshield: [2, 3], head: 0.88, tail: 1.0, grille: true, rails: true,
  },
  pickup: {
    L: 5.5, W: 1.98, r: 0.39, axles: [1.15, 4.4], yb: 0.4,
    top: [[0.06, 0.42], [0.0, 0.62], [0.02, 1.12], [2.06, 1.12], [2.12, 1.14], [4.12, 1.13], [5.16, 1.05], [5.44, 0.98], [5.5, 0.66], [5.42, 0.42]],
    gh: [[2.16, 1.12], [2.22, 1.8], [3.52, 1.82], [4.18, 1.12]],
    win: [[[2.36, 1.18], [2.36, 1.72], [3.46, 1.73], [4.0, 1.18]]],
    rearGlass: null, windshield: [2, 3], head: 0.9, tail: 0.95, grille: true, bed: true,
  },
  van: {
    L: 5.3, W: 2.02, r: 0.36, axles: [0.95, 4.25], yb: 0.36,
    top: [[0.06, 0.38], [0.0, 0.6], [0.0, 2.28], [0.12, 2.4], [3.86, 2.4], [4.36, 1.58], [5.08, 1.2], [5.26, 1.0], [5.3, 0.6], [5.22, 0.38]],
    gh: null,
    win: [[[3.9, 1.45], [3.9, 2.12], [4.12, 2.12], [4.42, 1.5]]],
    slopeGlass: [[3.88, 2.36], [4.38, 1.6]], head: 0.92, tail: 1.1, grille: true,
  },
  ev: {
    L: 4.72, W: 1.88, r: 0.34, axles: [0.98, 3.85], yb: 0.3,
    top: [[0.08, 0.34], [0.0, 0.56], [0.04, 0.9], [0.18, 0.98], [0.62, 1.0], [3.5, 0.98], [4.34, 0.84], [4.62, 0.72], [4.72, 0.54], [4.64, 0.32]],
    gh: [[0.62, 0.98], [1.95, 1.41], [2.86, 1.43], [3.56, 0.97]],
    win: [[[1.0, 1.03], [1.94, 1.36], [2.2, 1.37], [2.2, 1.03]], [[2.3, 1.03], [2.3, 1.37], [2.82, 1.38], [3.38, 1.03]]],
    rearGlass: [0, 1], windshield: [2, 3], roofGlass: [1, 2], head: 0.78, tail: 0.9, grille: false, lightBar: true,
  },
};
CAR_PROFILES.taxi = CAR_PROFILES.sedan;

class VehicleFactory {
  constructor() {
    this.m = {
      glass: new THREE.MeshStandardMaterial({ color: '#26323d', roughness: 0.05, metalness: 0.55, envMapIntensity: 1.9, name: 'carGlass' }),
      trim: new THREE.MeshStandardMaterial({ color: '#1c1d1f', roughness: 0.55, metalness: 0.1, name: 'carTrim' }),
      chrome: new THREE.MeshStandardMaterial({ color: '#c9ced3', roughness: 0.18, metalness: 1.0, name: 'chrome' }),
      head: new THREE.MeshStandardMaterial({ color: '#f4f2ea', emissive: new THREE.Color('#fff4e0'), emissiveIntensity: 1.6, roughness: 0.2, name: 'headlight' }),
      plate: new THREE.MeshStandardMaterial({ color: '#f1f1ec', roughness: 0.5, name: 'plate' }),
      tire: new THREE.MeshStandardMaterial({ color: '#161617', roughness: 0.9, name: 'tire' }),
      rim: new THREE.MeshStandardMaterial({ map: Tex.rim(), roughness: 0.35, metalness: 0.6, name: 'rim' }),
      well: new THREE.MeshStandardMaterial({ color: '#0b0b0c', roughness: 1, name: 'well' }),
    };
    this.paints = new Map();
    this.wheelGeos = new Map();
  }

  paint(color) {
    if (!this.paints.has(color)) {
      this.paints.set(color, new THREE.MeshPhysicalMaterial({
        color, roughness: 0.32, metalness: 0.35, clearcoat: 1.0, clearcoatRoughness: 0.06, envMapIntensity: 1.1, name: 'paint' + color,
      }));
    }
    return this.paints.get(color);
  }

  wheelGeo(r, w) {
    const key = r + '_' + w;
    if (!this.wheelGeos.has(key)) {
      const g = new THREE.CylinderGeometry(r, r, w, 20, 1);
      g.rotateX(Math.PI / 2);
      this.wheelGeos.set(key, g);
    }
    return this.wheelGeos.get(key);
  }

  _shape(points, arches) {
    const s = new THREE.Shape();
    s.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) s.lineTo(points[i][0], points[i][1]);
    if (arches) {
      const { yb, r, axles } = arches;
      const ra = r + 0.07;
      const [xr, xf] = axles;
      s.lineTo(xf + ra + 0.02, yb);
      s.absarc(xf, r, ra, 0, Math.PI, false);
      s.lineTo(xr + ra + 0.02, yb);
      s.absarc(xr, r, ra, 0, Math.PI, false);
      s.lineTo(points[0][0], points[0][1]);
    }
    return s;
  }

  _extrude(shape, width, bevel = 0.04) {
    const depth = Math.max(0.01, width - bevel * 2);
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 2, curveSegments: 8 });
    g.translate(0, 0, -depth / 2);
    return g;
  }

  // thin glass slab on a sloped edge (windshield / rear window)
  _slopeGlass(p0, p1, width, inset = 0.06) {
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1], len = Math.hypot(dx, dy);
    const ux = dx / len, uy = dy / len;
    let nx = -uy, ny = ux; // left normal of p0→p1
    // make the normal point up/out
    if (ny < 0) { nx = -nx; ny = -ny; }
    const off = 0.045;
    const a = [p0[0] + ux * len * inset + nx * off, p0[1] + uy * len * inset + ny * off];
    const b = [p1[0] - ux * len * inset + nx * off, p1[1] - uy * len * inset + ny * off];
    const s = new THREE.Shape();
    s.moveTo(a[0], a[1]); s.lineTo(b[0], b[1]); s.lineTo(b[0] - nx * 0.03, b[1] - ny * 0.03); s.lineTo(a[0] - nx * 0.03, a[1] - ny * 0.03);
    const g = new THREE.ExtrudeGeometry(s, { depth: width, bevelEnabled: false });
    g.translate(0, 0, -width / 2);
    return g;
  }

  /**
   * Returns { group, body, wheels:[], tail(material), hazard(material), exhaust:Vector3 }
   * Local frame: forward = +X, up = +Y, right side = +Z. Origin at ground, centre of car.
   */
  build(type, color, opts = {}) {
    if (type === 'bus') return this._bus(color);
    if (type === 'moto') return this._moto(color);
    const P = CAR_PROFILES[type];
    const group = new THREE.Group();
    const body = new THREE.Group();
    group.add(body);
    const paint = this.paint(color);
    const tail = new THREE.MeshStandardMaterial({ color: '#5a0d0d', emissive: new THREE.Color('#ff1a0e'), emissiveIntensity: 0.6, roughness: 0.3 });
    const hazard = new THREE.MeshStandardMaterial({ color: '#7a4a10', emissive: new THREE.Color('#ff9a1a'), emissiveIntensity: 0.0, roughness: 0.3 });
    const parts = { paint: [], glass: [], trim: [], chrome: [], head: [], tail: [], hazard: [], plate: [], well: [] };
    const T = (g, x = 0, y = 0, z = 0) => { g.translate(x, y, z); return g; };
    const cx = -P.L / 2; // shift so the car is centred on its origin

    parts.paint.push(T(this._extrude(this._shape(P.top, P), P.W), cx));
    const ghW = P.W - 0.2;
    if (P.gh) parts.paint.push(T(this._extrude(this._shape(P.gh), ghW, 0.035), cx));
    // side windows go right through the cabin so they show on both sides
    for (const w of P.win) {
      const g = new THREE.ExtrudeGeometry(this._shape(w), { depth: (P.gh ? ghW : P.W) + 0.024, bevelEnabled: false });
      g.translate(cx, 0, -((P.gh ? ghW : P.W) + 0.024) / 2);
      parts.glass.push(g);
    }
    if (P.gh) {
      const W2 = ghW - 0.14;
      if (P.windshield) parts.glass.push(T(this._slopeGlass(P.gh[P.windshield[0]], P.gh[P.windshield[1]], W2), cx));
      if (P.rearGlass) parts.glass.push(T(this._slopeGlass(P.gh[P.rearGlass[0]], P.gh[P.rearGlass[1]], W2), cx));
      if (P.roofGlass) parts.glass.push(T(this._slopeGlass(P.gh[P.roofGlass[0]], P.gh[P.roofGlass[1]], W2 - 0.1, 0.04), cx));
    }
    if (P.slopeGlass) parts.glass.push(T(this._slopeGlass(P.slopeGlass[0], P.slopeGlass[1], P.W - 0.2), cx));

    // bumpers
    parts.trim.push(T(new THREE.BoxGeometry(0.16, 0.2, P.W - 0.06), P.L / 2 - 0.04, P.yb + 0.12, 0));
    parts.trim.push(T(new THREE.BoxGeometry(0.16, 0.2, P.W - 0.06), -P.L / 2 + 0.04, P.yb + 0.12, 0));
    // side skirts
    for (const sz of [-1, 1]) parts.trim.push(T(new THREE.BoxGeometry(P.axles[1] - P.axles[0] - 2 * (P.r + 0.1), 0.1, 0.05), cx + (P.axles[0] + P.axles[1]) / 2, P.yb + 0.06, sz * (P.W / 2 + 0.005)));
    // wheel wells (hide the see-through under the arches)
    for (const ax of P.axles) parts.well.push(T(new THREE.BoxGeometry((P.r + 0.07) * 2, P.r + 0.1, P.W - 0.36), cx + ax, P.r + (P.r + 0.1) / 2 - 0.02, 0));
    // lights
    for (const sz of [-1, 1]) {
      if (P.lightBar) {
        parts.head.push(T(new THREE.BoxGeometry(0.06, 0.05, 0.42), P.L / 2 - 0.08, P.head, sz * (P.W / 2 - 0.3)));
      } else {
        parts.head.push(T(new THREE.BoxGeometry(0.08, 0.12, 0.34), P.L / 2 - 0.06, P.head, sz * (P.W / 2 - 0.27)));
      }
      parts.tail.push(T(new THREE.BoxGeometry(0.06, 0.12, 0.36), -P.L / 2 + 0.03, P.tail, sz * (P.W / 2 - 0.24)));
      parts.hazard.push(T(new THREE.BoxGeometry(0.07, 0.05, 0.14), P.L / 2 - 0.08, P.head - 0.11, sz * (P.W / 2 - 0.12)));
      parts.hazard.push(T(new THREE.BoxGeometry(0.07, 0.05, 0.14), -P.L / 2 + 0.03, P.tail - 0.1, sz * (P.W / 2 - 0.12)));
      // mirrors
      const mx = cx + (P.windshield && P.gh ? P.gh[P.windshield[1]][0] - 0.12 : P.L * 0.72);
      const my = (P.gh ? P.gh[P.windshield ? P.windshield[1] : 0][1] : 1.45) + 0.06;
      parts.paint.push(T(new THREE.BoxGeometry(0.12, 0.11, 0.17), mx, my, sz * (P.W / 2 + 0.08)));
      parts.trim.push(T(new THREE.BoxGeometry(0.06, 0.04, 0.12), mx + 0.02, my - 0.05, sz * (P.W / 2 + 0.01)));
      // door handles
      parts.chrome.push(T(new THREE.BoxGeometry(0.16, 0.025, 0.02), cx + P.axles[0] + (P.axles[1] - P.axles[0]) * 0.62, (P.top[4] ? P.top[4][1] : 1) - 0.1, sz * (P.W / 2 + 0.012)));
    }
    if (P.lightBar) {
      parts.head.push(T(new THREE.BoxGeometry(0.04, 0.025, P.W - 0.4), P.L / 2 - 0.1, P.head + 0.04, 0));
      parts.tail.push(T(new THREE.BoxGeometry(0.04, 0.05, P.W - 0.3), -P.L / 2 + 0.06, P.tail, 0));
    }
    if (P.grille) parts.trim.push(T(new THREE.BoxGeometry(0.05, 0.2, P.W * 0.42), P.L / 2 - 0.02, P.head - 0.06, 0));
    parts.plate.push(T(new THREE.BoxGeometry(0.02, 0.12, 0.36), P.L / 2 + 0.04, P.yb + 0.14, 0));
    parts.plate.push(T(new THREE.BoxGeometry(0.02, 0.12, 0.36), -P.L / 2 - 0.04, P.tail - 0.22, 0));
    if (P.rails) for (const sz of [-1, 1]) parts.trim.push(T(new THREE.BoxGeometry(2.3, 0.05, 0.05), cx + 1.6, 1.79, sz * (ghW / 2 - 0.12)));
    if (P.bed) parts.trim.push(T(new THREE.BoxGeometry(1.9, 0.02, P.W - 0.24), cx + 1.08, 1.125, 0));
    if (type === 'taxi') {
      parts.head.push(T(new THREE.BoxGeometry(0.28, 0.16, 0.6), cx + 2.35, 1.52, 0));
      parts.trim.push(T(new THREE.BoxGeometry(0.3, 0.04, 0.62), cx + 2.35, 1.45, 0));
      for (const sz of [-1, 1]) parts.trim.push(T(new THREE.BoxGeometry(P.L * 0.6, 0.06, 0.012), cx + 2.4, 0.78, sz * (P.W / 2 + 0.01)));
    }

    const matFor = { paint, glass: this.m.glass, trim: this.m.trim, chrome: this.m.chrome, head: this.m.head, tail, hazard, plate: this.m.plate, well: this.m.well };
    for (const [k, geos] of Object.entries(parts)) {
      if (!geos.length) continue;
      const merged = THREE.mergeGeometries(geos.map((g) => Geo.prep(g)), false);
      const mesh = new THREE.Mesh(merged, matFor[k]);
      mesh.castShadow = k === 'paint' || k === 'glass';
      mesh.receiveShadow = true;
      body.add(mesh);
    }
    // wheels
    const wheels = [];
    const wg = this.wheelGeo(P.r, 0.23);
    for (const ax of P.axles) for (const sz of [-1, 1]) {
      const w = new THREE.Mesh(wg, [this.m.tire, this.m.rim, this.m.rim]);
      w.position.set(cx + ax, P.r, sz * (P.W / 2 - 0.16));
      w.castShadow = false;
      group.add(w);
      wheels.push(w);
    }
    return { group, body, wheels, r: P.r, tail, hazard, exhaust: new THREE.Vector3(-P.L / 2 - 0.05, 0.3, -P.W / 2 + 0.35), L: P.L, W: P.W, height: P.gh ? P.gh[2][1] : 2.4 };
  }

  _bus(color) {
    const group = new THREE.Group(), body = new THREE.Group();
    group.add(body);
    const L = 12, W = 2.55, H = 3.15, r = 0.5, yb = 0.38;
    const paint = this.paint(color);
    const stripe = this.paint('#1d5fa8');
    const tail = new THREE.MeshStandardMaterial({ color: '#5a0d0d', emissive: new THREE.Color('#ff1a0e'), emissiveIntensity: 0.6, roughness: 0.3 });
    const hazard = new THREE.MeshStandardMaterial({ color: '#7a4a10', emissive: new THREE.Color('#ff9a1a'), emissiveIntensity: 0.0 });
    const P = { top: [[0, 0.42], [0, H - 0.15], [0.15, H], [L - 0.25, H], [L, H - 0.3], [L, 0.42]], yb, r, axles: [2.4, 8.4] };
    const shape = this._shape(P.top, P);
    const parts = { paint: [], stripe: [], glass: [], trim: [], head: [], tail: [], well: [], sign: [] };
    const T = (g, x = 0, y = 0, z = 0) => { g.translate(x, y, z); return g; };
    parts.paint.push(T(this._extrude(shape, W, 0.06), -L / 2));
    // window band through both sides
    const band = new THREE.ExtrudeGeometry(this._shape([[1.0, 1.3], [1.0, 2.6], [10.9, 2.6], [10.9, 1.3]]), { depth: W + 0.03, bevelEnabled: false });
    parts.glass.push(T(band, -L / 2, 0, -(W + 0.03) / 2));
    // pillars over the band
    for (let x = 1.0; x <= 10.9; x += 1.42) for (const sz of [-1, 1]) parts.paint.push(T(new THREE.BoxGeometry(0.14, 1.3, 0.03), -L / 2 + x, 1.95, sz * (W / 2 + 0.02)));
    // windshield + rear window
    parts.glass.push(T(new THREE.BoxGeometry(0.04, 1.65, W - 0.22), L / 2 + 0.02, 1.95, 0));
    parts.glass.push(T(new THREE.BoxGeometry(0.04, 0.9, W - 0.5), -L / 2 - 0.02, 2.2, 0));
    // livery stripe
    for (const sz of [-1, 1]) parts.stripe.push(T(new THREE.BoxGeometry(L - 0.3, 0.22, 0.02), 0, 0.98, sz * (W / 2 + 0.02)));
    parts.stripe.push(T(new THREE.BoxGeometry(0.03, 0.22, W - 0.2), L / 2 + 0.02, 0.98, 0));
    // doors (dark)
    parts.trim.push(T(new THREE.BoxGeometry(1.1, 2.1, 0.03), L / 2 - 1.2, 1.5, W / 2 + 0.025));
    parts.trim.push(T(new THREE.BoxGeometry(1.1, 2.1, 0.03), -0.4, 1.5, W / 2 + 0.025));
    parts.trim.push(T(new THREE.BoxGeometry(0.2, 0.32, W), L / 2 + 0.02, 0.55, 0));
    parts.trim.push(T(new THREE.BoxGeometry(0.2, 0.32, W), -L / 2 - 0.02, 0.55, 0));
    for (const ax of P.axles) parts.well.push(T(new THREE.BoxGeometry((r + 0.07) * 2, r + 0.12, W - 0.5), -L / 2 + ax, r + 0.06, 0));
    for (const sz of [-1, 1]) {
      parts.head.push(T(new THREE.BoxGeometry(0.06, 0.16, 0.3), L / 2 + 0.03, 0.82, sz * (W / 2 - 0.3)));
      parts.tail.push(T(new THREE.BoxGeometry(0.06, 0.4, 0.18), -L / 2 - 0.03, 1.1, sz * (W / 2 - 0.2)));
      parts.trim.push(T(new THREE.BoxGeometry(0.4, 0.06, 0.06), L / 2 + 0.05, 2.5, sz * (W / 2 + 0.2)));
    }
    // destination LED sign — powered by the battery, stays lit
    const signMat = new THREE.MeshStandardMaterial({ color: '#000', emissive: new THREE.Color('#ffffff'), emissiveMap: Tex.ledSign('42  DOWNTOWN'), emissiveIntensity: 1.6 });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.26), signMat);
    sign.position.set(L / 2 + 0.035, 2.93, 0); sign.rotation.y = Math.PI / 2;
    body.add(sign);
    const matFor = { paint, stripe, glass: this.m.glass, trim: this.m.trim, head: this.m.head, tail, well: this.m.well };
    for (const [k, geos] of Object.entries(parts)) {
      if (!geos.length) continue;
      const mesh = new THREE.Mesh(THREE.mergeGeometries(geos.map((g) => Geo.prep(g)), false), matFor[k]);
      mesh.castShadow = k === 'paint'; mesh.receiveShadow = true;
      body.add(mesh);
    }
    const wheels = [];
    const wg = this.wheelGeo(r, 0.3);
    for (const ax of P.axles) for (const sz of [-1, 1]) {
      const w = new THREE.Mesh(wg, [this.m.tire, this.m.rim, this.m.rim]);
      w.position.set(-L / 2 + ax, r, sz * (W / 2 - 0.22));
      w.castShadow = false;
      group.add(w); wheels.push(w);
    }
    return { group, body, wheels, r, tail, hazard, exhaust: new THREE.Vector3(-L / 2 - 0.05, 0.35, -W / 2 + 0.4), L, W, height: H };
  }

  _moto(color) {
    const group = new THREE.Group(), body = new THREE.Group();
    group.add(body);
    const paint = this.paint(color);
    const add = (geo, mat, x, y, z, rz = 0, parent = body) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.z = rz; m.castShadow = true; parent.add(m); return m; };
    const r = 0.31;
    const wheels = [];
    const wg = this.wheelGeo(r, 0.13);
    for (const x of [-0.72, 0.72]) {
      const w = new THREE.Mesh(wg, [this.m.tire, this.m.rim, this.m.rim]);
      w.position.set(x, r, 0); w.castShadow = false; body.add(w); wheels.push(w);
    }
    add(new THREE.BoxGeometry(0.55, 0.32, 0.3), this.m.trim, 0.0, 0.52, 0);              // engine
    add(new THREE.RoundedBoxGeometry(0.58, 0.24, 0.32, 2, 0.08), paint, 0.18, 0.86, 0);    // tank
    add(new THREE.RoundedBoxGeometry(0.62, 0.1, 0.28, 2, 0.04), this.m.trim, -0.36, 0.84, 0); // seat
    add(new THREE.RoundedBoxGeometry(0.5, 0.12, 0.2, 2, 0.04), paint, -0.66, 0.78, 0, 0.25);  // tail
    add(new THREE.CylinderGeometry(0.035, 0.035, 0.72, 6), this.m.chrome, 0.62, 0.7, 0.1, 0.42);   // fork
    add(new THREE.CylinderGeometry(0.035, 0.035, 0.72, 6), this.m.chrome, 0.62, 0.7, -0.1, 0.42);
    add(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 6), this.m.chrome, 0.47, 1.05, 0, 0).rotation.x = Math.PI / 2; // handlebar
    add(new THREE.CylinderGeometry(0.075, 0.06, 0.1, 10), this.m.head, 0.66, 0.95, 0, Math.PI / 2);   // headlight
    add(new THREE.CylinderGeometry(0.045, 0.05, 0.75, 8), this.m.chrome, -0.35, 0.36, 0.18, Math.PI / 2 - 0.12); // exhaust
    const tail = new THREE.MeshStandardMaterial({ color: '#5a0d0d', emissive: new THREE.Color('#ff1a0e'), emissiveIntensity: 0.6 });
    add(new THREE.BoxGeometry(0.04, 0.06, 0.12), tail, -0.9, 0.82, 0);
    const hazard = new THREE.MeshStandardMaterial({ color: '#7a4a10', emissive: new THREE.Color('#ff9a1a'), emissiveIntensity: 0 });
    // rider
    const rider = new Person({ look: 'rider', id: 'rider' }, null);
    rider.root.position.set(-0.32, 0, 0);
    rider.root.rotation.y = Math.PI / 2; // person forward (+Z) → bike forward (+X)
    body.add(rider.root);
    return { group, body, wheels, r, tail, hazard, rider, exhaust: new THREE.Vector3(-0.72, 0.3, 0.18), L: 2.1, W: 0.8, height: 1.5 };
  }
}

/* ===================================================================== */
class Vehicle {
  constructor(spec, kin, factory) {
    this.spec = spec;
    this.kin = kin;
    const v = factory.build(spec.type, spec.color);
    Object.assign(this, v);
    this.group.name = 'veh:' + spec.id;
    this.isEV = spec.type === 'ev';
    this.isMoto = spec.type === 'moto';
    this.seed = hash1(spec.id.length * 977 + spec.id.charCodeAt(0));
    // drivers "let go" of the brake when they lose consciousness
    this.driverOut = 19.5 + this.seed * 6;   // seated drivers outlast standing people (~17–25 s after O₂ = 0)
    this.combustion = !this.isEV;
  }

  // world-space point on the vehicle at time t (used by FX & HUD)
  worldPoint(t, local) {
    const p = this.kin.pose(t);
    const c = Math.cos(p.heading), s = Math.sin(p.heading);
    return new THREE.Vector3(p.x + local.x * c + local.z * s, local.y, p.z - local.x * s + local.z * c);
  }

  update(t, tl) {
    const k = this.kin, p = k.pose(t);
    this.group.position.set(p.x, 0, p.z);
    this.group.rotation.y = p.heading;
    const v = k.v(t), a = k.a(t);
    // wheels roll
    const spin = -p.s / this.r;
    for (const w of this.wheels) w.rotation.z = spin;
    // body pitch from braking, plus misfire jerks while the engine dies
    const spec = this.spec;
    let pitch = MathX.clamp(a * 0.0055, -0.03, 0.02);
    let roll = 0, bounce = 0;
    if (spec.fail !== undefined && this.combustion) {
      const u = (t - spec.fail) / k.sputter;
      if (u > 0 && u < 1.15) {
        const jerk = Math.max(0, Math.sin(u * 23 + this.seed * 9)) * Math.max(0, Math.sin(u * 7.3));
        pitch += -jerk * 0.022 * (1 - u * 0.6);
        roll += Math.sin(u * 41) * 0.006 * (1 - u);
        bounce += jerk * 0.012;
      }
    }
    // idling vibration before the engine dies
    if (this.combustion && t < (spec.fail || 2.8) && spec.v0 === 0) bounce += Math.sin(t * 60 + this.seed * 10) * 0.0025;
    if (k.contactT !== null && t > k.contactT) pitch += -0.035 * Math.exp(-(t - k.contactT) / 0.15) * Math.sin((t - k.contactT) * 30);
    if (k.leaderShoveT !== null && t > k.leaderShoveT) pitch += 0.03 * Math.exp(-(t - k.leaderShoveT) / 0.15) * Math.sin((t - k.leaderShoveT) * 30);
    this.body.rotation.z = pitch;
    this.body.rotation.x = roll;
    this.body.position.y = bounce;

    // brake lights: on while braking/held, off once the driver is unconscious
    const braking = (a < -0.6 || (spec.fail !== undefined && t > k.tStop - 0.1)) && t < this.driverOut;
    this.tail.emissiveIntensity = braking ? 4.5 : 0.6;
    // hazard lights on the car that got hit (electric — keep blinking)
    if (k.leaderShoveT !== null) this.hazard.emissiveIntensity = t > k.leaderShoveT + 0.3 && (Math.floor((t - k.leaderShoveT) * 1.6) % 2 === 0) ? 6 : 0;

    if (this.isMoto) this._updateMoto(t, v);
  }

  _updateMoto(t, v) {
    const spec = this.spec, k = this.kin;
    const u = (t - spec.fail) / k.sputter;
    let lean = 0;
    if (u > 0 && u < 2.5) lean += Math.sin(u * 5.0) * 0.06 * Math.max(0, 1 - u / 2.5);
    // at a stop the rider puts a foot down and the bike leans onto it
    const stopK = MathX.smooth(t, k.tStop - 0.8, k.tStop + 0.2);
    lean += stopK * 0.16;
    this.body.rotation.x = -lean; // lean to rider's left
    const slump = MathX.smooth(t, 12.4, 13.6);
    this.rider.setRide(t, stopK, slump);
  }
}

/* ===================================================================== */
class TrafficSystem {
  constructor(scene) {
    this.scene = scene;
    this.factory = new VehicleFactory();
    this.kin = buildKinematics(SCRIPT.vehicles);
    const issues = checkTraffic(this.kin);
    if (issues.length) console.warn('[traffic] overlaps:', issues.slice(0, 10));
    this.vehicles = [];
    this.byId = {};
    for (const spec of SCRIPT.vehicles) {
      const v = new Vehicle(spec, this.kin[spec.id], this.factory);
      scene.add(v.group);
      this.vehicles.push(v);
      this.byId[spec.id] = v;
    }
  }

  update(t, tl) {
    if (!this.blobs) this.blobs = new BlobShadows(this.scene, this.vehicles.length);
    this.blobs.begin();
    for (const v of this.vehicles) {
      v.update(t, tl);
      // soft ambient-occlusion blob under each vehicle
      const p = v.group.position;
      this.blobs.push(p.x, 0.011, p.z, v.L * 1.12, v.isMoto ? 0.35 : 0.6, v.W * 1.35, v.group.rotation.y);
    }
    this.blobs.end();
  }

  // annotation anchor (top of the vehicle)
  anchor(id, t) {
    const v = this.byId[id];
    if (!v) return null;
    const p = v.kin.pose(t);
    return new THREE.Vector3(p.x, v.height * 0.62, p.z);
  }
}
