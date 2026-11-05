/* =====================================================================
   TRAIN — your three-car electric train (train-local: x forward from the front of the first car, y up from the rail
   top, z to the right = south, the sea side). The first car is modelled inside: the cab bulkhead, the seats (2 + 2),
   the luggage racks, the light strips, the window glass, the passengers; the other cars show lit window panes.
     lfBuildTrain(scene) → T ; T.update(s) ; T.L2W([x, y, z]) → world ; T.xF(s) (the front's world x)
   Lights: on the mains until the grid trips (14.0 s, lights.js), then the battery emergency lights (LEDs, fading).
   Motion (physics.js): 120 km/h; the driver brakes at 16.6 s (0.75 m/s²) and the front stops at LF_ST.stopX (61 s).
   No coplanar faces: the floor sits on the underframe (1.10 / 1.15), the light strips hang 5 mm under the ceiling,
   the window panes sit inside their holes.
   ===================================================================== */

function lfTrainX(s) {
  const P = LFP.train, d = P.v * P.v / (2 * P.a), xb = LF_ST.stopX - d;
  if (s < P.sBrake) return xb - P.v * (P.sBrake - s);
  const u = Math.min(s, P.sStop) - P.sBrake;
  return xb + P.v * u - 0.5 * P.a * u * u;
}
const lfTrainV = (s) => (s < LFP.train.sBrake ? LFP.train.v : Math.max(0, LFP.train.v - LFP.train.a * (s - LFP.train.sBrake)));
// the train's lights: the mains, then the battery emergency lights
const lfTrainMains = (s) => lfGrid(s, 0.02);
const lfTrainEmerg = (s) => lfEmerg(s, 0.02);
LFP.sDoor = LFP.train.sStop + 1.2;                       // the doors open

function lfSeatTex() {
  return lfTex(lfCanvas(256, 256, (g, w, h) => { g.fillStyle = '#2c3d5c'; g.fillRect(0, 0, w, h); const r = new RNG(5);
    for (let i = 0; i < 900; i++) { g.fillStyle = ['rgba(200,80,60,0.5)', 'rgba(230,200,90,0.45)', 'rgba(120,170,220,0.4)', 'rgba(10,15,30,0.4)'][i % 4]; g.fillRect(r.range(0, w), r.range(0, h), r.range(2, 6), r.range(2, 5)); } }));
}
function lfPaneTex() {
  return lfTex(lfCanvas(256, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#fff3d8'); gr.addColorStop(1, '#e8d8b8'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(40,50,70,0.75)'; for (let k = 0; k < 2; k++) { g.fillRect(30 + k * 120, 70, 70, 58); g.beginPath(); g.arc(65 + k * 120, 58, 18, 0, 6.3); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(0, 0, w, 10); }), { repeat: false });
}

function lfBuildTrain(scene) {
  const T = { group: new THREE.Group(), cars: [], lights: [], panes: [], glass: [], wheels: [], people: [] }, G = T.group, TR = LF_TR;
  scene.add(G);
  const W2 = TR.W / 2, M = {
    white: lfStd('#e9ebe8', 0.45, 0.1), blue: lfStd('#1f4f8f', 0.4, 0.15), grey: lfStd('#8d939a', 0.6, 0.2), dark: lfStd('#24272b', 0.8, 0.2),
    under: lfStd('#17191c', 0.9, 0.1), wheel: lfStd('#3a3c40', 0.4, 0.8), inner: lfStd('#d9dcd6', 0.7, 0.0), floor: lfStd('#4a5058', 0.85, 0.0),
    ceil: lfStd('#e8e8e2', 0.8, 0.0), seat: lfStd('#ffffff', 0.95, 0, { map: lfSeatTex() }), headrest: lfStd('#e9e6dc', 0.9), pole: lfStd('#c8ccd0', 0.25, 0.9),
    rack: lfStd('#a9afb6', 0.4, 0.7), strip: new THREE.MeshBasicMaterial({ color: '#fff6e6' }), nose: lfStd('#e9ebe8', 0.35, 0.15),
    screen: lfStd('#0a0d12', 0.08, 0.6), glass: new THREE.MeshStandardMaterial({ color: '#8fa6bb', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.16, depthWrite: false }),
    pane: new THREE.MeshBasicMaterial({ map: lfPaneTex(), color: '#ffffff' }), head: new THREE.MeshBasicMaterial({ color: '#fffbe8' }), tail: new THREE.MeshBasicMaterial({ color: '#ff2a1a' }),
  };
  T.M = M;
  const box = (w, h, d, m, x, y, z, parent = G) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
  const winHoles = TR.rows.map((r) => [r + 0.35 - TR.winW / 2, r + 0.35 + TR.winW / 2, TR.floor + TR.winY[0], TR.floor + TR.winY[1]]);
  const doorHoles = TR.doors.map(([a, b]) => [a, b, TR.floor, TR.floor + 1.96]);
  for (let ci = 0; ci < TR.cars; ci++) {
    const ox = -ci * (TR.L + TR.gap), car = new THREE.Group(); car.position.x = ox; G.add(car); T.cars.push(car);
    const x0 = -TR.L;
    // underframe, equipment, bogies
    box(TR.L - 0.2, 0.52, TR.W - 0.16, M.under, -TR.L / 2, 0.85, 0, car);   // (its bottom 1 cm under the nose's)
    for (const ex of [-6, -10.5, -14]) box(1.8, 0.4, TR.W - 0.5, M.dark, ex, 0.5, 0, car);
    for (const bx of [-3.4, -TR.L + 3.4]) {
      box(2.8, 0.3, 2.0, M.dark, bx, 0.62, 0, car);
      for (const dx of [-1.1, 1.1]) for (const z of [-0.72, 0.72]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.13, 20), M.wheel); w.rotation.x = Math.PI / 2; w.position.set(bx + dx, 0.43, z); car.add(w); T.wheels.push(w); }
    }
    // the sides: three stripes (blue skirt, white with the windows, grey cant rail), each cut round the windows and doors
    const holes = winHoles.concat(doorHoles.map((h) => [h[0], h[1], 0.95, h[3]]));
    for (const side of [-1, 1]) for (const [ya, yb, m] of [[0.95, 1.62, M.blue], [1.62, 3.0, M.white], [3.0, 3.35, M.grey]]) {
      for (const c of lfWallCells(x0, 0, ya, yb, holes)) box(c[1] - c[0], c[3] - c[2], 0.06, m, (c[0] + c[1]) / 2, (c[2] + c[3]) / 2, side * (W2 - 0.03), car);
    }
    // the roof (a flattened half cylinder) and the ends
    // (a half cylinder along x, squashed to 0.6 m high; its end caps sit 2 cm inside the end walls / the nose)
    { const len = ci === 0 ? TR.L - 0.62 : TR.L - 0.04, cx = ci === 0 ? -TR.L / 2 - 0.29 : -TR.L / 2;
      const g = new THREE.CylinderGeometry(W2, W2, len, 24, 1, false, 0, Math.PI); g.rotateZ(Math.PI / 2);   // (axis → x; the half with y ≥ 0)
      const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) * (0.6 / W2));
      g.computeVertexNormals(); const rf = new THREE.Mesh(g, M.grey); rf.position.set(cx, 3.35, 0); rf.castShadow = true; car.add(rf); }
    box(0.08, 2.4, TR.W - 0.02, M.white, -TR.L + 0.03, 2.2, 0, car);                          // the rear end wall (top inside the roof; 1 cm past the sides' ends)
    if (ci > 0) box(0.08, 2.4, TR.W - 0.02, M.white, -0.03, 2.2, 0, car);                      // the front end wall
    if (ci < TR.cars - 1) box(TR.gap + 0.1, 2.2, 1.3, M.dark, -TR.L - TR.gap / 2, 2.2, 0, car); // the gangway's bellows
    // lit window panes (the other cars; the first car has glass and a real inside)
    if (ci > 0) for (const h of winHoles) for (const side of [-1, 1]) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(h[1] - h[0], h[3] - h[2]), M.pane); pl.position.set((h[0] + h[1]) / 2, (h[2] + h[3]) / 2, side * (W2 - 0.03)); pl.rotation.y = side > 0 ? 0 : Math.PI; car.add(pl); T.panes.push(pl); }
    else for (const h of winHoles) for (const side of [-1, 1]) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(h[1] - h[0], h[3] - h[2]), M.glass); pl.position.set((h[0] + h[1]) / 2, (h[2] + h[3]) / 2, side * (W2 - 0.03)); pl.rotation.y = side > 0 ? 0 : Math.PI; pl.renderOrder = 3; car.add(pl); T.glass.push(pl); }
    // the doors (two leaves each side, closed; the first car's sea-side front door opens at the beach)
    T.doorsL = T.doorsL || [];
    for (const [a, b] of TR.doors) for (const side of [-1, 1]) { const w = (b - a) / 2;
      for (const k of [0, 1]) { const d = box(w, 1.96, 0.05, M.white, a + w / 2 + k * w, TR.floor + 0.98, side * (W2 - 0.03), car); const win = box(w * 0.7, 0.9, 0.07, M.screen, 0, 0.35, 0, d); void win;   // (the window 1 cm proud of the leaf, both sides)
        if (ci === 0 && side > 0 && a === TR.doors[0][0]) T.doorsL.push({ d, x0: d.position.x, dir: k ? 1 : -1, w }); } }
    // the pantograph (middle car)
    if (ci === 1) { const py = LF_ST.wireY - LF_ST.railY; box(1.6, 0.2, 1.4, M.dark, -10, 3.98, 0, car);
      const arm = (a, b) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 6), M.dark); lfStrut(m, a, b, 0.035); car.add(m); };
      arm([-10.6, 4.05, 0], [-9.4, 4.05 + (py - 4.05) * 0.5, 0]); arm([-9.4, 4.05 + (py - 4.05) * 0.5, 0], [-10.2, py - 0.05, 0]);
      box(0.12, 0.06, 1.7, M.grey, -10.2, py - 0.03, 0, car); }
  }
  // ---- the first car's nose: a sloped cab front (an extruded side profile), the windscreen just off it, the lights
  { const sh = new THREE.Shape(); sh.moveTo(0, 0.6); sh.lineTo(0.42, 0.75); sh.lineTo(0.62, 1.5); sh.lineTo(0.55, 2.0); sh.lineTo(0.18, 3.25); sh.lineTo(0, 3.5); sh.lineTo(-0.64, 3.5); sh.lineTo(-0.64, 0.6); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: TR.W - 0.04, bevelEnabled: false }); g.translate(0, 0, -(TR.W - 0.04) / 2);
    const n = new THREE.Mesh(g, M.nose); n.castShadow = true; G.add(n);
    // the windscreen: 2 cm off the slope (its normal), so it never fights the nose
    const a = [0.55, 2.0], b = [0.18, 3.25], len = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = (b[1] - a[1]) / len, ny = -(b[0] - a[0]) / len;
    const ws = new THREE.Mesh(new THREE.PlaneGeometry(len * 0.92, TR.W - 0.4), M.screen); ws.position.set((a[0] + b[0]) / 2 + nx * 0.02, (a[1] + b[1]) / 2 + ny * 0.02, 0);
    ws.rotation.set(0, Math.PI / 2, 0); ws.rotateX(-Math.atan2(b[0] - a[0], b[1] - a[1])); G.add(ws); T.windscreen = ws;
    box(0.04, 0.9, 1.0, M.blue, 0.6, 1.15, 0, G);                                                // (the yellow-less blue nose panel)
    T.heads = [];
    for (const z of [-0.95, 0.95]) { const hd = new THREE.Mesh(new THREE.CircleGeometry(0.11, 16), M.head); hd.position.set(0.645, 1.35, z); hd.rotation.y = Math.PI / 2; G.add(hd); T.heads.push(hd); }
    const sm = new THREE.SpriteMaterial({ map: lfDotTex(0.3), color: '#fff4dc', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    T.headGlow = [-0.95, 0.95].map((z) => { const sp = new THREE.Sprite(sm); sp.scale.set(2.2, 2.2, 1); sp.position.set(0.9, 1.35, z); G.add(sp); return sp; });
    T.beam = new THREE.SpotLight('#fff1d8', 0, 220, 0.32, 0.6, 1.2); T.beam.position.set(0.8, 1.4, 0); T.beam.target.position.set(60, -2, 0); G.add(T.beam); G.add(T.beam.target);
    // the tail lights (the last car)
    for (const z of [-1.0, 1.0]) { const tl = new THREE.Mesh(new THREE.CircleGeometry(0.08, 12), M.tail); tl.position.set(-(TR.cars - 1) * (TR.L + TR.gap) - TR.L - 0.025, 1.3, z); tl.rotation.y = -Math.PI / 2; G.add(tl); }   // (1.5 cm off the end wall)
  }
  // ---- the first car's inside
  const IN = new THREE.Group(); G.add(IN); T.inside = IN;
  { const L0 = -TR.L + 0.06, L1 = TR.cab, wz = W2 - 0.06;
    box(-0.66 - L0, 0.05, TR.W - 0.12, M.floor, (L0 - 0.66) / 2, TR.floor - 0.025, 0, IN);       // (through the cab, to the nose)
    box(L1 - L0, 0.03, TR.W - 0.12, M.ceil, (L0 + L1) / 2, 3.295, 0, IN);
    T.strips = [-0.52, 0.52].map((z) => box(L1 - L0 - 0.6, 0.035, 0.12, M.strip, (L0 + L1) / 2, 3.2625, z, IN));
    for (const z of [-1, 1]) box(L1 - L0 - 0.8, 0.02, 0.32, M.rack, (L0 + L1) / 2, 3.0, z * (wz - 0.165), IN);
    // the cab bulkhead (with its door) and the driver
    for (const c of lfWallCells(-W2 + 0.06, W2 - 0.06, TR.floor, 3.28, [[-0.35, 0.35, TR.floor, TR.floor + 1.95]])) box(0.05, c[3] - c[2], c[1] - c[0], M.inner, TR.cab, (c[2] + c[3]) / 2, (c[0] + c[1]) / 2, IN);
    box(0.05, 1.95, 0.7, M.dark, TR.cab - 0.001 - 0.03, TR.floor + 0.975, 0, IN);
    // the seats: 2 + 2 a row, facing forward
    const seat = (x, z) => { box(0.5, 0.12, 0.46, M.seat, x + 0.27, TR.floor + 0.46, z, IN); box(0.09, 0.72, 0.46, M.seat, x + 0.02, TR.floor + 0.92, z, IN);
      box(0.11, 0.16, 0.36, M.headrest, x + 0.02, TR.floor + 1.225, z, IN); box(0.4, 0.4, 0.06, M.dark, x + 0.27, TR.floor + 0.2, z, IN); };
    for (const r of TR.rows) for (const z of [-0.98, -0.5, 0.5, 0.98]) seat(r, z);
    for (const [a, b] of TR.doors) for (const z of [-0.6, 0.6]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 2.1, 8), M.pole); p.position.set((a + b) / 2, TR.floor + 1.05, z); IN.add(p); }
    // the inside lights (point lights along the car)
    for (const x of [-15.5, -9.5, -3.6]) { const L = new THREE.PointLight('#fff0d6', 0, 9, 1.6); L.position.set(x, 3.0, 0); IN.add(L); T.lights.push(L); }
  }
  // ---- the passengers (seated, facing forward); the driver in the cab
  const pas = [['lfP1', -16.6, -0.98], ['lfP2', -14.65, 0.5], ['lfP3', -12.7, -0.5], ['lfP4', -10.75, 0.98], ['lfP5', -8.8, -0.98], ['lfP6', -4.9, -0.5], ['lfP2', -12.7, 0.98], ['lfP3', -16.6, 0.5]];
  pas.forEach(([look, r, z], i) => { const P = lfPerson(look, IN, { id: 'tr' + i }); P.seat = [r + 0.3, TR.floor - 0.02, z]; P.root.position.set(...P.seat); P.root.rotation.y = Math.PI / 2; T.people.push(P); });
  T.driver = lfPerson('lfDrv', G, { id: 'drv' }); T.driver.root.position.set(-1.2, TR.floor + 0.05, 0); T.driver.root.rotation.y = Math.PI / 2; T.driver.apply(LF_POSES.drive());
  // ---- the puffs pool for the brake sparks is the set's; here the state
  T.L2W = (p) => [p[0] + G.position.x, p[1] + G.position.y, p[2] + G.position.z];
  T.update = (s) => {
    const xf = lfTrainX(s); G.position.set(xf, LF_ST.railY, LF_ST.track[0]);
    const rot = (xf - lfTrainX(-5)) / 0.43; for (const w of T.wheels) w.rotation.y = rot;
    const mains = lfTrainMains(s), em = lfTrainEmerg(s), lit = Math.max(mains, 0.42 * em);
    // inside: warm mains light; then the cold, dim emergency LEDs (one strip in three)
    const warm = mains / Math.max(lit, 1e-4);
    for (const L of T.lights) { L.intensity = 6.0 * mains + 2.6 * em; L.color.setRGB(1, 0.94 * warm + 0.97 * (1 - warm), 0.84 * warm + 1.0 * (1 - warm)); }
    for (const st of T.strips) st.material.color.setRGB(0.05 + 1.0 * mains + 0.5 * em, 0.05 + 0.96 * mains + 0.55 * em, 0.05 + 0.9 * mains + 0.62 * em);
    M.pane.color.setRGB(0.04 + 0.96 * lit, 0.04 + 0.92 * lit, 0.04 + 0.86 * lit);
    const hl = Math.max(mains, 0.5 * em); for (const h of T.heads) h.material.color.setScalar(0.08 + 0.92 * hl); for (const g of T.headGlow) g.material.opacity = 0.9 * hl;
    T.beam.intensity = 120 * hl;
    // the doors: the sea-side front door slides open after the stop
    const od = lfSm(s, LFP.sDoor, LFP.sDoor + 1.4); for (const d of T.doorsL) d.d.position.x = d.x0 + d.dir * d.w * 0.95 * od;
    T.lit = lit; T.mains = mains; T.em = em;
    // the passengers: looking out, then at their phones (lit faces), then torches
    T.people.forEach((P, i) => {
      const p = lfKeys(s, [[-99, i % 3 === 0 ? LF_POSES.sitLook() : LF_POSES.sit()], [14.2 + 0.1 * i, LF_POSES.sitLook()], [15.6 + 0.3 * i, LF_POSES.sitPhone()], [21 + i, i % 2 ? LF_POSES.sitTorch() : LF_POSES.sitPhone()]], 0.8);
      P.apply(lfFidget(Object.assign({}, p), s, i, 0.4));
    });
  };
  return T;
}
