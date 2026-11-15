/* =====================================================================
   TRAIN — the loose things on wheels and on water: your train (four cars at platform 1; the second car has an inside:
   your seat is in it), the six tank wagons on the fuel siding, the pickup at the level crossing, parked cars, the
   ferry and the boats in the harbour. All pure functions of story time s (physics.js).
     esBuildTrain(S) → { train, cars, wheels, wagons, ferry, update(s), seat(lx, ly, lz) → world point in your car }
   ===================================================================== */

const ES_CAR = { L: 24.4, W: 2.9, floor: 1.15, roof: 3.95, bogie: 8.4, wheelR: 0.46 };

// a car's side: two-tone livery with a band of windows (drawn), 24.4 m × 2.8 m
function esCarSideCanvas(front) {
  return esCanvas(2048, 256, (g, w, h) => {
    g.fillStyle = '#e9e0c8'; g.fillRect(0, 0, w, h); g.fillStyle = '#1f6a6a'; g.fillRect(0, h * 0.56, w, h * 0.44); g.fillStyle = '#e0a82a'; g.fillRect(0, h * 0.53, w, h * 0.05);
    g.fillStyle = '#16303a'; for (let i = 0; i < 11; i++) { const x = w * (0.085 + i * 0.0765); esRR(g, x, h * 0.16, w * 0.06, h * 0.32, 10); g.fill(); }
    g.fillStyle = 'rgba(255,200,130,0.18)'; for (let i = 0; i < 11; i++) { const x = w * (0.085 + i * 0.0765); g.fillRect(x + 4, h * 0.18, w * 0.02, h * 0.28); }
    for (const x of [0.035, 0.945]) { g.fillStyle = '#d8ceb4'; esRR(g, w * x, h * 0.12, w * 0.03, h * 0.8, 6); g.fill(); g.fillStyle = '#16303a'; esRR(g, w * x + 8, h * 0.18, w * 0.03 - 16, h * 0.28, 5); g.fill(); }
    if (front) { g.fillStyle = '#16303a'; esRR(g, w * 0.972, h * 0.14, w * 0.024, h * 0.34, 6); g.fill(); }
    g.fillStyle = 'rgba(40,30,20,0.25)'; g.fillRect(0, h * 0.94, w, h * 0.06);
  });
}

function esBuildTrain(S) {
  const scene = S.scene, F = ES_F, P = ESP, C = ES_CAR, out = {};
  const RAIL = F.rail;
  const steel = esStd('#2a2c2e', 0.55, 0.6), under = esStd('#1e2022', 0.8, 0.3), roofM = esStd('#8f9496', 0.6, 0.4);
  const cream = esStd('#e9e0c8', 0.55, 0.15), teal = esStd('#1f6a6a', 0.5, 0.2);
  const sideT = [esTex(esCarSideCanvas(false), { repeat: false }), esTex(esCarSideCanvas(true), { repeat: false })];
  const train = new THREE.Group(); scene.add(train); out.train = train;
  out.wheels = [];                                                   // [x from the nose, z] of every wheel's contact
  const wheelG = new THREE.CylinderGeometry(C.wheelR, C.wheelR, 0.13, 18); wheelG.rotateX(Math.PI / 2);
  const bogie = (parent, x) => {
    const g = new THREE.Group(); g.position.set(x, 0, 0); parent.add(g);
    esBox(3.0, 0.3, 2.2, steel, 0, 0.62, 0, g);
    for (const ax of [-1.25, 1.25]) { for (const sz of [-1, 1]) { const w = new THREE.Mesh(wheelG, esStd('#55585c', 0.35, 0.8)); w.position.set(ax, C.wheelR, sz * F.track.gauge / 2); w.castShadow = true; g.add(w); } esCyl(0.09, 0.09, 1.6, steel, ax, C.wheelR, 0, g, 8).rotation.x = Math.PI / 2; }
    return g;
  };
  out.cars = [];
  for (let i = 0; i < F.train.cars; i++) {
    const car = new THREE.Group(); car.position.set(-(i + 0.5) * F.train.carL, RAIL, 0); train.add(car); out.cars.push(car);
    esBox(C.L - 1.2, 0.5, 2.5, under, 0, 0.82, 0, car);
    for (const bx of [-C.bogie, C.bogie]) { bogie(car, bx); for (const ax of [-1.25, 1.25]) for (const sz of [-1, 1]) out.wheels.push([-(i + 0.5) * F.train.carL + bx + ax, sz * F.track.gauge / 2]); }
    esBox(4.5, 0.55, 2.3, under, 0, 0.5, 0, car);                    // the engine and tanks under the floor
    if (i !== F.you.car) {
      const mat = new THREE.MeshStandardMaterial({ map: sideT[i === 0 ? 1 : 0], roughness: 0.5, metalness: 0.15 });
      const matB = new THREE.MeshStandardMaterial({ map: (() => { const t = sideT[i === 0 ? 1 : 0].clone(); t.repeat.x = -1; t.offset.x = 1; t.needsUpdate = true; return t; })(), roughness: 0.5, metalness: 0.15 });
      const b = new THREE.Mesh(new THREE.BoxGeometry(C.L, C.roof - C.floor, C.W), [cream, cream, roofM, under, mat, matB]); b.position.y = (C.roof + C.floor) / 2; b.castShadow = b.receiveShadow = true; car.add(b);
    }
    // the roof's curve and its vents
    { const rg = new THREE.CylinderGeometry(1.9, 1.9, C.L - 0.2, 20, 1, true, -0.72, 1.44); rg.rotateX(-Math.PI / 2); rg.rotateY(Math.PI / 2); esMesh(rg, roofM, 0, C.roof - 1.43, 0, car); }
    for (const vx of [-7, 0, 7]) esBox(2.2, 0.22, 1.2, esStd('#7a7f82', 0.6, 0.4), vx, C.roof + 0.5, 0, car);
    // the gangway to the next car
    if (i < F.train.cars - 1) esBox(0.62, 2.3, 1.5, esStd('#1a1a1c', 0.9), -C.L / 2 - 0.3, C.floor + 1.2, 0, car);
    if (i === 0) {
      // the cab: a raked nose (side profiles extruded across the car), the windscreen, the lights, the coupler
      const ext = (pts, m, w = C.W, dx = 0) => {
        const sh = new THREE.Shape(); pts.forEach(([x, y], k) => (k ? sh.lineTo(x, y) : sh.moveTo(x, y)));
        const g = new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: false }); g.translate(C.L / 2 + dx, 0, -w / 2);
        const o = new THREE.Mesh(g, m); o.castShadow = o.receiveShadow = true; car.add(o); return o;
      };
      const y0 = C.floor - 0.3, yb = C.floor + 0.93, yr = C.roof, yellow = esStd('#e0a82a', 0.5, 0.2), glass = esStd('#10242c', 0.12, 0.6);
      ext([[-0.02, y0], [1.95, y0], [2.3, y0 + 0.42], [2.32, yb - 0.12], [2.24, yb], [-0.02, yb]], teal);                                   // below the band
      ext([[-0.02, yb], [2.24, yb], [1.96, yb + 0.36], [0.86, yr - 0.24], [0.34, yr + 0.02], [-0.02, yr + 0.02]], cream);                    // above it
      ext([[-0.02, yb - 0.05], [2.27, yb - 0.05], [2.25, yb + 0.07], [-0.02, yb + 0.07]], yellow, C.W + 0.03);                               // the band
      // the windscreen: two panes on the rake, a pillar between them; a visor over them
      { const ax = 1.96, ay = yb + 0.36, bx = 0.86, by = yr - 0.24, len = Math.hypot(bx - ax, by - ay), ang = Math.atan2(by - ay, bx - ax);
        for (const sz of [-1, 1]) { const w = esBox(len * 0.8, 0.05, C.W / 2 - 0.34, glass, C.L / 2 + (ax + bx) / 2 + 0.035, (ay + by) / 2 + 0.03, sz * (C.W / 4 - 0.02), car); w.rotation.z = ang; w.castShadow = false; }
        esBox(0.5, 0.05, C.W - 0.3, cream, C.L / 2 + bx - 0.02, by + 0.1, 0, car).rotation.z = ang * 0.35; }
      for (const sz of [-1, 1]) {
        const l = esMesh(new THREE.SphereGeometry(0.15, 12, 8), new THREE.MeshStandardMaterial({ color: '#fff6dc', emissive: '#ffe9b0', emissiveIntensity: 2.6 }), C.L / 2 + 2.29, y0 + 0.78, sz * 0.98, car); l.castShadow = false; l.scale.x = 0.5;
        const r = esMesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshStandardMaterial({ color: '#ff5a3a', emissive: '#c8301a', emissiveIntensity: 0.6 }), C.L / 2 + 2.3, y0 + 0.78, sz * 0.66, car); r.castShadow = false; r.scale.x = 0.5;
      }
      { const l = esMesh(new THREE.SphereGeometry(0.11, 10, 8), new THREE.MeshStandardMaterial({ color: '#fff6dc', emissive: '#ffe9b0', emissiveIntensity: 2.2 }), C.L / 2 + 0.6, yr - 0.02, 0, car); l.castShadow = false; }
      esBox(0.55, 0.3, 0.4, steel, C.L / 2 + 2.4, 0.95, 0, car);                                                                             // the coupler
      { const pl = esBox(0.5, 0.5, C.W - 0.5, esStd('#2a2c2e', 0.6, 0.5), C.L / 2 + 2.0, y0 - 0.2, 0, car); pl.rotation.z = 0.5; }         // the plough under it
      // the destination blind over the windscreen
      esBox(0.04, 0.2, 1.3, new THREE.MeshStandardMaterial({ color: '#ffb84a', emissive: '#ff9a2a', emissiveIntensity: 1.2 }), C.L / 2 + 0.66, yr - 0.2, 0, car).rotation.z = 0.9;
    }
  }
  // ---- your car: real walls with window openings, a floor, seats and tables
  {
    const car = out.cars[F.you.car], fl = C.floor, hw = C.W / 2, x0 = -C.L / 2, x1 = C.L / 2;
    const holes = []; for (let i = 0; i < 11; i++) { const cx = -10 + i * 2.0; holes.push([cx - 0.8, cx + 0.8, fl + 0.95, fl + 1.95]); }
    const inM = esStd('#d9d2c2', 0.8), seatM = esStd('#2f5a7a', 0.85), seatM2 = esStd('#27496a', 0.85), tableM = esStd('#c9b48c', 0.5), floorM = esStd('#4a4e58', 0.8);
    for (const sgn of [-1, 1]) {
      for (const [a, b, c, d] of esWallCells(x0, x1, fl, C.roof, holes)) {
        const lower = d <= fl + 0.96, m = esBox(b - a, d - c, 0.09, lower ? teal : cream, (a + b) / 2, (c + d) / 2, sgn * hw, car); m.castShadow = true;
        esBox(b - a, d - c, 0.03, inM, (a + b) / 2, (c + d) / 2, sgn * (hw - 0.065), car).castShadow = false;
      }
      esBox(C.L, 0.07, 0.1, esStd('#e0a82a', 0.5, 0.2), 0, fl + 0.93, sgn * (hw + 0.012), car).castShadow = false;
      // the glass (tinted; you see the world through it)
      const gl = new THREE.Mesh(new THREE.PlaneGeometry(21.8, 1.0), new THREE.MeshStandardMaterial({ color: '#9fc0c8', transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0.2, depthWrite: false, side: THREE.DoubleSide }));
      gl.position.set(0, fl + 1.45, sgn * hw); car.add(gl); gl.renderOrder = 3;
    }
    for (const x of [x0, x1]) { for (const [a, b, c, d] of esWallCells(-hw, hw, fl, C.roof, [[-0.45, 0.45, fl, fl + 2.0]])) esBox(0.09, d - c, b - a, cream, x, (c + d) / 2, (a + b) / 2, car); }
    esBox(C.L, 0.08, C.W, floorM, 0, fl - 0.04, 0, car);
    esBox(C.L, 0.06, C.W - 0.4, inM, 0, C.roof - 0.26, 0, car).castShadow = false;
    // the ceiling lights
    for (let x = -10; x <= 10; x += 4) { const l = esBox(1.6, 0.03, 0.22, new THREE.MeshStandardMaterial({ color: '#fff6e0', emissive: '#ffeccc', emissiveIntensity: 1.2 }), x, C.roof - 0.3, 0, car); l.castShadow = false; }
    // bays of facing seats with a table at the window, either side of the aisle
    out.tables = [];
    for (let i = 0; i < 11; i += 1) {
      const cx = -10 + i * 2.0;
      for (const sgn of [-1, 1]) {
        const zc = sgn * (hw - 0.62);
        if (i % 2 === 0) { esBox(0.9, 0.035, 0.95, tableM, cx, fl + 0.74, zc, car).castShadow = false; esBox(0.06, 0.72, 0.06, steel, cx, fl + 0.37, zc + sgn * 0.3, car).castShadow = false; if (sgn === F.you.side) out.tables.push(cx); }
        else {
          // two seats back to back (a gap for luggage between their backs), each facing a table
          for (const dir of [-1, 1]) { esBox(0.5, 0.12, 0.98, seatM, cx + dir * 0.8, fl + 0.44, zc, car).castShadow = false; const b = esBox(0.12, 0.8, 0.98, seatM2, cx + dir * 0.5, fl + 0.88, zc, car); b.castShadow = false; b.rotation.z = dir * 0.1; esBox(0.4, 0.38, 0.9, under, cx + dir * 0.78, fl + 0.19, zc, car).castShadow = false; }
        }
      }
    }
    // the luggage racks
    for (const sgn of [-1, 1]) esBox(C.L - 1, 0.03, 0.42, esStd('#a8adb0', 0.4, 0.6), 0, fl + 2.12, sgn * (hw - 0.3), car).castShadow = false;
    out.youCar = car;
    // your coffee, on your table: a paper cup; its surface tips with the braking (0.2 g: 11°)
    const tx = out.tables.reduce((a, b) => (Math.abs(b - F.you.lx) < Math.abs(a - F.you.lx) ? b : a), 99);
    out.tableX = tx;
    const cup = new THREE.Group(); cup.position.set(tx - 0.22, fl + 0.758, F.you.side * (hw - 0.5)); car.add(cup);
    esCyl(0.042, 0.032, 0.11, esStd('#f2ede0', 0.6), 0, 0.055, 0, cup, 16).castShadow = false; esCyl(0.044, 0.044, 0.012, esStd('#8a4a2a', 0.6), 0, 0.105, 0, cup, 16).castShadow = false;
    const coffee = esCyl(0.038, 0.038, 0.002, esStd('#3a2416', 0.25), 0, 0.094, 0, cup, 16); coffee.castShadow = false; out.coffee = coffee; out.cup = cup;
    // a book and a phone on the table
    esBox(0.2, 0.03, 0.14, esStd('#b8462e', 0.7), tx + 0.12, fl + 0.775, F.you.side * (hw - 0.72), car).castShadow = false;
    // two more passengers
    out.riders = [esPerson('esYouSeat', car), esPerson('esP6', car, { id: 'r' }), esPerson('esP4', car, { id: 'r' })];
    esPose(out.riders[0], ES_POSES.sitPhone(), 0.72, fl - 0.03, -F.you.side * (hw - 0.62), Math.PI / 2);        // across the aisle, a bay behind you
    esPose(out.riders[1], ES_POSES.sitLook(), tx + 3.28, fl - 0.03, -F.you.side * (hw - 0.62), -Math.PI / 2);    // across the aisle, a bay ahead, facing back
    esPose(out.riders[2], ES_POSES.sitPhone(), -7.28, fl - 0.03, F.you.side * (hw - 0.62), Math.PI / 2);
  }
  // a point in your car (lx along the car from its middle, ly above the floor, lz across) → world
  out.seat = (lx, ly, lz) => { const car = out.youCar; return [train.position.x + car.position.x + lx, RAIL + C.floor + ly, lz]; };

  // ------------------------------------------------------------------ the tank wagons on the fuel siding
  {
    const W = F.wagons, tankM = esStd('#1e2226', 0.45, 0.6), bandM = esStd('#d8762a', 0.6, 0.2);
    out.wagons = [];
    for (let k = 0; k < W.n; k++) {
      const g = new THREE.Group(); scene.add(g);
      const L = W.L - 1.0;
      esBox(L, 0.3, 2.4, under, 0, 0.95, 0, g);
      const tk = esMesh(new THREE.CylinderGeometry(1.45, 1.45, L - 1.6, 18), tankM, 0, 2.6, 0, g); tk.rotation.z = Math.PI / 2;
      for (const sx of [-1, 1]) { const cap = esMesh(new THREE.SphereGeometry(1.45, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), tankM, sx * (L - 1.6) / 2, 2.6, 0, g); cap.rotation.z = -sx * Math.PI / 2; cap.scale.y = 0.45; }
      const bd = esMesh(new THREE.CylinderGeometry(1.47, 1.47, 0.7, 18), bandM, 0, 2.6, 0, g); bd.rotation.z = Math.PI / 2;
      esCyl(0.5, 0.5, 0.5, tankM, 0, 4.2, 0, g, 12);
      for (const sx of [-1, 1]) { esBox(1.0, 1.7, 0.08, steel, sx * 3.2, 1.8, 1.48, g); esBox(0.6, 0.6, 0.02, esStd('#e8e4d8', 0.6), sx * 3.2, 2.5, 1.53, g).castShadow = false; }
      for (const bx of [-L / 2 + 2.2, L / 2 - 2.2]) bogie(g, bx);
      esBox(0.5, 0.3, 0.4, steel, L / 2 + 0.3, 1.0, 0, g); esBox(0.5, 0.3, 0.4, steel, -L / 2 - 0.3, 1.0, 0, g);
      out.wagons.push({ g, front0: W.front - k * W.L, L: W.L });
    }
  }
  // ------------------------------------------------------------------ the pickup at the crossing; parked cars
  {
    const vf = new VehicleFactory(); out.vehicles = [];
    const put = (type, col, x, z, ry, hit) => { const v = vf.build(type, col); v.group.position.set(x, 0, z); v.group.rotation.y = ry; scene.add(v.group); out.vehicles.push({ g: v.group, x, hit }); };
    const th = ES_HITS.find((q) => q.kind === 'truck');
    put('pickup', '#b8462e', F.crossing.x, -13.5, -Math.PI / 2, th ? th.s : null);
    put('sedan', '#d8d4c8', -118, -25.5, 0, null); put('hatch', '#2f5a8a', -104, -25.8, Math.PI, null); put('van', '#e8e4d8', -84, -25.4, 0, null); put('suv', '#3a3a3c', -228, 30, Math.PI / 2, null); put('sedan', '#7a2a2a', F.crossing.x - 1.6, 34, Math.PI / 2, null);
  }
  // ------------------------------------------------------------------ the ferry and the boats
  {
    const Fy = F.ferry, hullM = esStd('#f0ece2', 0.5, 0.1), blue = esStd('#1f4a8a', 0.5, 0.2), deckM = esStd('#8a8f8a', 0.8), glass = esStd('#16303a', 0.2, 0.4);
    const hullGeo = (L, B, h, bow = 0.3) => { const s = new THREE.Shape(); s.moveTo(-L / 2, -B / 2); s.lineTo(L / 2 - L * bow, -B / 2); s.quadraticCurveTo(L / 2 - L * bow * 0.3, -B / 2 * 0.8, L / 2, 0); s.quadraticCurveTo(L / 2 - L * bow * 0.3, B / 2 * 0.8, L / 2 - L * bow, B / 2); s.lineTo(-L / 2, B / 2); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 8 }); g.rotateX(-Math.PI / 2); return g; };
    const g = new THREE.Group(); scene.add(g);
    const hl = new THREE.Mesh(hullGeo(Fy.L, Fy.B, 6.2), [deckM, hullM]); hl.position.y = F.sea.level - 2.2; hl.castShadow = hl.receiveShadow = true; g.add(hl);
    const st = new THREE.Mesh(hullGeo(Fy.L, Fy.B + 0.04, 1.2), blue); st.position.y = F.sea.level - 0.4; g.add(st);
    esBox(Fy.L * 0.62, 2.7, Fy.B - 1.6, hullM, -Fy.L * 0.1, F.sea.level + 5.35, 0, g); esBox(Fy.L * 0.6, 0.9, Fy.B - 1.5, glass, -Fy.L * 0.1, F.sea.level + 5.6, 0, g).scale.set(1, 1, 1.004);
    esBox(Fy.L * 0.46, 2.6, Fy.B - 3.4, hullM, -Fy.L * 0.12, F.sea.level + 8.0, 0, g); esBox(Fy.L * 0.44, 0.9, Fy.B - 3.3, glass, -Fy.L * 0.12, F.sea.level + 8.2, 0, g).scale.set(1, 1, 1.004);
    esBox(7, 2.4, Fy.B - 5, hullM, Fy.L * 0.1, F.sea.level + 10.5, 0, g); esBox(7.1, 0.9, Fy.B - 4.9, glass, Fy.L * 0.1, F.sea.level + 10.8, 0, g);
    const fn = esCyl(1.5, 1.8, 4.6, blue, -Fy.L * 0.2, F.sea.level + 11.6, 0, g, 14); fn.scale.z = 0.7; esCyl(1.52, 1.56, 0.8, esStd('#e8e4d8', 0.5), -Fy.L * 0.2, F.sea.level + 12.8, 0, g, 14).scale.z = 0.7;
    esCyl(0.08, 0.1, 6, steel, Fy.L * 0.12, F.sea.level + 14.6, 0, g, 8);
    out.ferry = { g, bow0: Fy.bow, L: Fy.L };
    out.boats = F.boats.map(([x, z, ry], i) => {
      const b = new THREE.Group(); scene.add(b);
      const h = new THREE.Mesh(hullGeo(9, 3, 1.5, 0.35), [esStd('#7a5a3a', 0.8), esStd(['#b8462e', '#2f6a8a', '#e8e4d8', '#3a7a4a'][i % 4], 0.6)]); h.position.y = F.sea.level - 0.5; h.castShadow = true; b.add(h);
      esBox(2.4, 1.6, 1.8, esStd('#e8e4d8', 0.6), -1.6, F.sea.level + 1.8, 0, b); esCyl(0.05, 0.06, 4, steel, 0.8, F.sea.level + 3, 0, b, 6);
      return { g: b, x, z, ry, L: 9 };
    });
  }

  // a thing that runs into a wall at xWall: it shortens (its front stays at the wall, its tail keeps coming)
  const crush = (g, front, L, xWall, y, z) => {
    const vis = Math.max(0, Math.min(L, L - (front - xWall)));
    g.visible = vis > 0.05;
    g.scale.x = Math.max(0.001, vis / L); g.position.set(Math.min(front, xWall) - vis / 2, y, z);
  };
  out.update = (s) => {
    const X = P.X(s);
    train.position.set(P.nose(s), 0, F.train.z);
    // the coffee: its surface tips toward the front while the train brakes at 0.2 g; after 5:42:01, the other way
    { const a = s <= 0 ? 0 : s <= P.T ? Math.atan(P.muTrain) * MathX.smooth(s, 0, 0.012) : -Math.atan(P.muTrain) * MathX.smooth(s, 1, 1.01) + Math.atan(P.muTrain) * (1 - MathX.smooth(s, 1, 1.004));
      out.coffee.rotation.z = -a; out.coffee.scale.x = 1 / Math.cos(a); out.coffee.position.y = 0.088; }
    // the wagons: until the rock
    out.wagons.forEach((w) => crush(w.g, w.front0 + X - 0.5, w.L - 1.0, esHillX(F.wagons.z), RAIL, F.wagons.z));
    for (const v of out.vehicles) { v.g.position.x = v.x + X; v.g.visible = !(v.hit != null && s >= v.hit); v.g.position.y = 0; }
    // the ferry and the boats: until the quay wall
    crush(out.ferry.g, out.ferry.bow0 + X, out.ferry.L, F.quay.x - 1.2, 0, F.ferry.z);
    for (const b of out.boats) { const front = b.x + b.L / 2 + X, vis = Math.max(0, Math.min(b.L, b.L - (front - (F.quay.x - 1.2)))); b.g.visible = vis > 0.05; b.g.rotation.y = vis < b.L ? 0 : b.ry; b.g.scale.x = Math.max(0.001, vis / b.L); b.g.position.set(Math.min(front, F.quay.x - 1.2) - vis / 2, 0, b.z); }
  };
  return out;
}
