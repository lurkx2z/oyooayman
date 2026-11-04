/* =====================================================================
   THINGS — what was moving out of doors at 2:00 and what the air holds (pure: posed by update(s, o) from story time s):
     the moving car and the bicycle on your street, the traffic on the main road (vehicles: their bodies; the people in
     them are cast.js's), the pigeon outside your window and the flock taking off from the park path, the falling
     leaves under the plane tree, the fountain's jet (a sculpture of glass) and the carp under the pond's surface, the
     kicked ball, the frisbee, the flag at the park gate, the chimney smoke on the terrace, the contrail.
   Everything held by the air stops at s = 0 where it is and starts again FROM REST at s = 3 (physics.js: saFrz,
   saRel, saDropFrom, saTip).
     saBuildThings(S, T) → X ; X.update(s, o) (o.drops: soft points for the set's puff pool)
   ===================================================================== */

// ---------------------------------------------------------------------------------------------------------------------
// WHERE (world) — the street (your block's front z = 0; the road z −9…−2; UK traffic: the south lane goes west, +x),
// the park, the main road along its east side (x 76…84)
// ---------------------------------------------------------------------------------------------------------------------
const SA_CAR = { type: 'hatch', col: '#2f6f86', x: 1.2, z: -4.45, yaw: Math.PI, kmh: 30 };          // heading east (−x), under your window
const SA_BIKE = { x: -5.4, z: -6.75, yaw: 0, kmh: 20, lean: 0.006, th0: 0.006, L: 1.6 };          // heading west (+x); its lean when it stops
const SA_RUNP = { x: 7.5, z: -15.6, yaw: 0, kmh: 11, th0: 0.045, L: 1.0 };                           // the runner on the path, heading west
const SA_BALL = { p: [21.8, 3.9, -38.2], v: [-9.5, 3.2, 4.0], r: 0.11 };                            // the kicked ball at 2:00 (its velocity then)
const SA_FRIS = { p: [-23.45, 1.12, -31.0], v: [-11, 0.4, -1.5], r: 0.12 };                         // the frisbee (30 cm ahead of the dog's nose)
const SA_POND_FISH = [4.2, -0.13, -47.4];
const SA_WINPIG = [2.6, 13.55, -1.55];                                                                // the pigeon outside your window (flying east)
const SA_FLAG = SA_ST.flag;
const SA_WIND = { v: 3.4, dir: [-1, 0, -0.25] };                                                     // the breeze before 2:00 (from the west-north-west)
// the traffic on the main road: [z, lane (+1 northbound on the west lane x 82, −1 southbound x 78), type, colour]
const SA_TRAFFIC = [
  [-6, 1, 'sedan', '#c9ccd0'], [-22, 1, 'suv', '#2a2d33'], [-41, 1, 'hatch', '#b8322a'], [-63, 1, 'van', '#e8e4dc'], [-80, 1, 'sedan', '#3a4a6a'], [-104, 1, 'ev', '#f2f0ea'],
  [-14, -1, 'hatch', '#d9b84a'], [-33, -1, 'bus', '#c8322a'], [-58, -1, 'sedan', '#4a4d52'], [-75, -1, 'suv', '#6a7a5a'], [-96, -1, 'hatch', '#2f5a8a'], [-120, -1, 'sedan', '#e8e8e4'],
];
const saLaneX = (lane) => (lane > 0 ? 81.9 : 78.1);

// a bicycle (local: the ground under its middle, along +x, the front wheel at +x)
const SA_BK = { r: 0.34, wb: 1.04, saddle: [-0.2, 0.96, 0], bar: [0.36, 1.04, 0], crank: [0.0, 0.3, 0] };
function saBuildBike() {
  const g = new THREE.Group(), fr = saStd('#1f6a5a', 0.4, 0.4), blk = saStd('#16171a', 0.6), st = saStd('#c9ccce', 0.3, 0.85), tyre = saStd('#1a1a1c', 0.8);
  const strut = (a, b, r, m) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 8).translate(0, 0.5, 0), m); saStrut(o, a, b, r); o.castShadow = true; g.add(o); return o; };
  const wheels = [];
  for (const x of [-SA_BK.wb / 2, SA_BK.wb / 2]) {
    const w = new THREE.Group(); w.position.set(x, SA_BK.r, 0); g.add(w); wheels.push(w);
    saMesh(new THREE.TorusGeometry(SA_BK.r - 0.015, 0.018, 8, 32), tyre, 0, 0, 0, w);
    saMesh(new THREE.TorusGeometry(SA_BK.r - 0.04, 0.008, 6, 32), st, 0, 0, 0, w);
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI; const s = saBox(0.004, 2 * (SA_BK.r - 0.045), 0.004, st, 0, 0, 0, w); s.rotation.z = a; s.castShadow = false; }
    saCyl(0.025, 0.025, 0.06, st, 0, 0, 0, w, 10).rotation.x = Math.PI / 2;
  }
  const C = SA_BK.crank, rear = [-SA_BK.wb / 2, SA_BK.r, 0], front = [SA_BK.wb / 2, SA_BK.r, 0], seatT = [-0.16, 0.86, 0], head = [0.33, 0.86, 0], headB = [0.3, 0.72, 0];
  strut(C, seatT, 0.016, fr); strut(seatT, head, 0.015, fr); strut(C, headB, 0.018, fr);
  for (const sd of [-1, 1]) { strut([C[0], C[1], sd * 0.03], [rear[0], rear[1], sd * 0.05], 0.009, fr); strut([seatT[0], seatT[1] - 0.02, sd * 0.02], [rear[0], rear[1], sd * 0.05], 0.009, fr); strut([headB[0], headB[1], sd * 0.02], [front[0], front[1], sd * 0.05], 0.011, st); }
  strut(head, headB, 0.02, fr);
  strut(seatT, [SA_BK.saddle[0] + 0.02, SA_BK.saddle[1] - 0.03, 0], 0.012, st);
  saMesh(saRoundBox(0.24, 0.05, 0.13, 0.025, 0.01), blk, SA_BK.saddle[0], SA_BK.saddle[1] - 0.02, 0, g);
  strut(head, [SA_BK.bar[0], SA_BK.bar[1] - 0.02, 0], 0.012, st);
  { const b = saCyl(0.012, 0.012, 0.56, st, SA_BK.bar[0], SA_BK.bar[1], 0, g, 8); b.rotation.x = Math.PI / 2; for (const sd of [-1, 1]) { const gr = saCyl(0.017, 0.017, 0.1, blk, SA_BK.bar[0], SA_BK.bar[1], sd * 0.24, g, 8); gr.rotation.x = Math.PI / 2; } }
  // the cranks and pedals (turning with the pedals: g.userData.crank)
  const ck = new THREE.Group(); ck.position.set(C[0], C[1], 0); g.add(ck);
  saCyl(0.09, 0.09, 0.012, st, 0, 0, 0.05, ck, 20).rotation.x = Math.PI / 2;
  const ped = [];
  for (const sd of [-1, 1]) { const arm = saBox(0.03, 0.17, 0.012, st, 0, sd * 0.085, sd * 0.07, ck); arm.castShadow = false; const p = saBox(0.1, 0.02, 0.07, blk, 0, sd * 0.17, sd * 0.1, ck); ped.push(p); }
  // a basket on the front (with a baguette in it: it was going home with the shopping)
  { const bm = saStd('#8a6a3a', 0.85); saBox(0.26, 0.17, 0.3, bm, SA_BK.bar[0] + 0.14, SA_BK.bar[1] - 0.1, 0, g); saCyl(0.03, 0.03, 0.5, saStd('#c88a48', 0.8), SA_BK.bar[0] + 0.14, SA_BK.bar[1] + 0.05, 0.02, g, 8).rotation.z = 1.1; }
  g.userData = { wheels, crank: ck, ped };
  return g;
}
function saBuildFrisbee() {
  const g = new THREE.Group(), m = saStd('#ff7a1a', 0.4, 0, { side: THREE.DoubleSide });
  const pts = [[0, 0.012], [0.08, 0.014], [0.11, 0.01], [0.12, 0.0], [0.115, -0.012], [0.108, -0.006], [0.1, 0.004], [0, 0.006]].map(([x, y]) => new THREE.Vector2(x, y));
  saMesh(new THREE.LatheGeometry(pts, 32), m, 0, 0, 0, g); return g;
}
function saBuildBallThing() {
  const m = saStd('#ffffff', 0.5, 0, { map: saTex(saCanvas(128, 64, (g, w, h) => { g.fillStyle = '#f4f2ec'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a1a1a'; for (let i = 0; i < 6; i++) { const x = (i * 23 + 8) % w, y = i % 2 ? 18 : 44; g.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283; g.lineTo(x + Math.cos(a) * 8, y + Math.sin(a) * 8); } g.fill(); } }), { repeat: false }) });
  const g = new THREE.Group(); saMesh(new THREE.SphereGeometry(SA_BALL.r, 20, 14), m, 0, 0, 0, g); return g;
}

function saBuildThings(S, T) {
  const scene = S.scene, X = {}, VF = new VehicleFactory();
  // ---- the car on your street (30 km/h at 2:00), the bicycle
  { const g = new THREE.Group(); scene.add(g); const o = VF.build(SA_CAR.type, SA_CAR.col); o.group.position.x = -o.L / 2; const turn = new THREE.Group(); turn.add(o.group); g.add(turn);
    X.car = { g, o, turn }; g.position.set(SA_CAR.x, 0, SA_CAR.z); g.rotation.y = SA_CAR.yaw; }
  X.bike = saBuildBike(); scene.add(X.bike);
  // ---- the main road's traffic
  X.traffic = SA_TRAFFIC.map(([z, lane, type, col]) => { const g = new THREE.Group(); scene.add(g); const o = VF.build(type, col); o.group.position.x = -o.L / 2; const turn = new THREE.Group(); turn.add(o.group); g.add(turn);
    g.position.set(saLaneX(lane), 0, z); g.rotation.y = lane > 0 ? -Math.PI / 2 : Math.PI / 2; return { g, o, z, lane, type }; });
  // ---- the ball, the frisbee, the carp, the pigeon at your window, the flock
  X.ball = saBuildBallThing(); scene.add(X.ball);
  X.fris = saBuildFrisbee(); scene.add(X.fris);
  X.fish = saBuildFish(); scene.add(X.fish); X.fish.scale.setScalar(1.6);
  X.winPig = saBuildPigeon(1.15); scene.add(X.winPig);
  X.flock = Array.from({ length: 14 }, (_, i) => { const b = saBuildPigeon(1); scene.add(b); return b; });
  for (const k of ['ball', 'fris', 'fish', 'winPig']) X[k].traverse((o) => { if (o.isMesh) o.castShadow = true; });
  // ---- the leaves in the air under the plane tree (and the trees across the park): one instanced mesh
  { const L = [], rr = new RNG(907), P = SA_ST.plane;
    for (let i = 0; i < 260; i++) { const a = rr.range(0, 6.283), d = Math.sqrt(rr.next()) * 6.5, y = rr.range(0.4, 11.5);
      L.push({ x: P.x + Math.cos(a) * d + 1.0, y, z: P.z + Math.sin(a) * d + 1.4, ph: rr.range(0, 6.283), w: rr.range(1.5, 3.5), vt: rr.range(0.9, 1.5), c: rr.int(0, 3), ax: rr.range(-1, 1), tilt: rr.range(-1.2, 1.2) }); }
    for (const t of T.trees) for (let i = 0; i < 26; i++) { const a = rr.range(0, 6.283), d = Math.sqrt(rr.next()) * t.cr * 1.4; L.push({ x: t.x + Math.cos(a) * d, y: rr.range(0.4, t.h * 0.8), z: t.z + Math.sin(a) * d, ph: rr.range(0, 6.283), w: rr.range(1.5, 3.5), vt: rr.range(0.9, 1.5), c: rr.int(0, 3), ax: rr.range(-1, 1), tilt: rr.range(-1.2, 1.2) }); }
    // a plane-tree leaf: five pointed lobes (about 17 cm across), its stalk end at the middle
    const lf = new THREE.Shape(), Rl = 0.085, ring = [[-90, 0.15], [-35, 0.8], [-5, 0.42], [25, 0.95], [57, 0.42], [90, 1.0], [123, 0.42], [155, 0.95], [185, 0.42], [215, 0.8]];
    ring.forEach(([d, r], i) => { const x = Math.cos(d * Math.PI / 180) * r * Rl, y = Math.sin(d * Math.PI / 180) * r * Rl; if (i) lf.lineTo(x, y); else lf.moveTo(x, y); }); lf.closePath();
    const geo = new THREE.ShapeGeometry(lf);
    const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.75, side: THREE.DoubleSide }), L.length); im.frustumCulled = false; im.castShadow = true;
    const cols = ['#d9a63a', '#c8742c', '#b8862e', '#a8502a'].map((c) => new THREE.Color(c)); L.forEach((l, i) => im.setColorAt(i, cols[l.c])); scene.add(im);
    X.leaves = { L, im }; }
  // ---- the fountain's jet: a column of water up from the nozzle (a tube, thinning), opening into a crown at the top
  { const m = new THREE.MeshPhysicalMaterial({ color: '#e6f4fc', transparent: true, opacity: 0.74, roughness: 0.02, metalness: 0.0, envMapIntensity: 2.8, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide });
    const pts = []; const H = 1.62; for (let i = 0; i <= 30; i++) { const u = i / 30, h = H * u; pts.push(new THREE.Vector2(0.04 + 0.03 * u * u + 0.007 * Math.sin(u * 23), h)); }
    pts.push(new THREE.Vector2(0.0, H + 0.04));
    const col = new THREE.Mesh(new THREE.LatheGeometry(pts, 18), m); col.renderOrder = 4; scene.add(col); X.jet = col; X.jetH = H; X.M = { jet: m };
    // the crown: frozen sheets curling over and down (thin open cones) round the top
    const crown = new THREE.Group(); scene.add(crown); X.crown = crown;
    for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283 + 0.2 * saR(k, 5), pts2 = [];
      for (let i = 0; i <= 12; i++) { const u = i / 12, r = 0.04 + 0.62 * u, y = 0.05 + 0.32 * u - 0.9 * u * u; pts2.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r)); }
      const cv = new THREE.CatmullRomCurve3(pts2), tg = new THREE.TubeGeometry(cv, 16, 0.018, 6, false);
      const pa = tg.attributes.position; for (let i = 0; i < pa.count; i++) { const j = Math.floor(i / 7) / 16, r = 0.012 * (1 - 0.6 * j); void r; }
      const tm = new THREE.Mesh(tg, m); tm.renderOrder = 4; crown.add(tm); }
  }
  // ---- the flag at the park gate: a cloth on the pole (flies east, −x, in the breeze; frozen mid-flap; then limp)
  { const F = SA_FLAG, geo = new THREE.PlaneGeometry(F.w, F.ht, 18, 10); geo.translate(-F.w / 2, -F.ht / 2, 0);
    const c = saCanvas(256, 170, (g, w, h) => { g.fillStyle = '#1f4f8a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2efe6'; g.fillRect(0, h * 0.36, w, h * 0.28); g.fillStyle = '#c8322a'; g.fillRect(0, h * 0.42, w, h * 0.16); g.fillStyle = '#f2efe6'; g.beginPath(); g.arc(w * 0.22, h * 0.5, h * 0.17, 0, 6.283); g.fill(); g.fillStyle = '#e8b42a'; g.beginPath(); g.arc(w * 0.22, h * 0.5, h * 0.1, 0, 6.283); g.fill(); });
    const m = saStd('#ffffff', 0.85, 0, { map: saTex(c, { repeat: false }), side: THREE.DoubleSide });
    const fl = new THREE.Mesh(geo, m); fl.castShadow = true; fl.position.set(F.x, F.h - 0.08, F.z); scene.add(fl);
    saCyl(0.05, 0.07, F.h, saStd('#e8e6e0', 0.4, 0.5), F.x, F.h / 2, F.z, scene, 12); saMesh(new THREE.SphereGeometry(0.08, 12, 8), saStd('#c8a23a', 0.3, 0.8), F.x, F.h + 0.05, F.z, scene);
    X.flag = { mesh: fl, geo, base: Float32Array.from(geo.attributes.position.array), key: null }; }
  // ---- a contrail high over the park (an airliner's, eastbound at 11 km; it ends where the plane was at 2:00)
  { const m = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55, depthWrite: false, fog: false });
    const geo = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true).translate(0, 0.5, 0); const tr = new THREE.Mesh(geo, m); tr.frustumCulled = false; tr.renderOrder = -5; scene.add(tr); X.trail = tr;
    X.trailA = [-5200, 9800, -12000]; X.trailB = [2600, 10600, -9400]; saStrut(tr, X.trailA, X.trailB, 26); }
  X.update = (s, o) => saThingsUpdate(X, s, o || {});
  return X;
}

const _saTM = new THREE.Matrix4(), _saTQ = new THREE.Quaternion(), _saTV = new THREE.Vector3(), _saTE = new THREE.Euler(), _saTS = new THREE.Vector3(1, 1, 1), _saY = new THREE.Vector3(0, 1, 0), _saX = new THREE.Vector3(1, 0, 0), _saZ = new THREE.Vector3(0, 0, 1);
// a moving thing's distance along its way: steady speed before 2:00, stopped dead for good at 2:00
const saGone = (s, v) => v * Math.min(s, 0);
// the bike's lean (rad, about its line of travel): a gentle sway while ridden, held at 2:00, then (from rest, with no
// speed to steer with) it tips over like an inverted pendulum; it lies on its side. → { roll, wheelsTurn }
function saBikeState(s) {
  const B = SA_BIKE, v = B.kmh / 3.6;
  if (s < 0) return { roll: B.lean * Math.sin(s * 1.3 + 0.6) / Math.sin(0.6) * 0.7 + 0.3 * B.lean, d: v * s };
  if (s < SAP.T) return { roll: B.lean, d: 0 };
  return { roll: Math.min(1.36, saTip(B.lean, B.L, SAP.T, s, 1.4)), d: 0 };   // (an inverted pendulum let go at its lean, from rest)
}
// the chimney smoke: where a puff that left the chimney at s0 is at story s (rising, blown east before 2:00; held for
// three seconds; then rising straight: there is no wind any more) → [dx, dy, dz, age] or null
function saSmokeAt(s0, s) {
  const e = (x) => (x < 0 ? x : x < SAP.T ? 0 : x - SAP.T), age = e(s) - e(s0);
  if (age < 0) return null;
  const pre = Math.max(0, Math.min(e(s), 0) - e(s0)), W = SA_WIND, rise = 1.3 * age / (1 + age / 30);
  return [W.v * W.dir[0] * pre, rise, W.v * W.dir[2] * pre, age];
}
function saThingsUpdate(X, s, o) {
  const out = o.drops, m = o.mode || '', cam = o.cam, fr = saFrz(s), rl = saRel(s);
  // ---- the car: 30 km/h until 2:00; stopped dead where it was. Its hazard lights, from 2:00:12, blink
  { const C = SA_CAR, v = C.kmh / 3.6, d = saGone(s, v); X.car.g.position.set(C.x + d * Math.cos(C.yaw), 0, C.z);
    X.car.o.wheels.forEach((w) => { w.rotation.z = -d / X.car.o.r; });
    X.car.o.hazard.emissiveIntensity = s > 12 && Math.floor((s - 12) / 0.4) % 2 === 0 ? 2.2 : 0; }
  // ---- the bicycle
  { const B = SA_BIKE, st = saBikeState(s), g = X.bike; g.position.set(B.x + st.d * Math.cos(B.yaw), 0, B.z - st.d * Math.sin(B.yaw));
    g.quaternion.setFromAxisAngle(_saY, B.yaw); g.quaternion.multiply(_saTQ.setFromAxisAngle(_saX, st.roll));
    const turn = st.d / SA_BK.r; g.userData.wheels.forEach((w) => { w.rotation.z = -turn; }); g.userData.crank.rotation.z = -turn / 2.6 - 0.9;
    X.bikeRoll = st.roll; }
  // ---- the main road's traffic: 50 km/h until 2:00, then stopped dead (spaced as they were); hazard lights after
  for (const c of X.traffic) { const d = saGone(s, 50 / 3.6); c.g.position.z = c.z + c.lane * d; c.o.wheels.forEach((w) => { w.rotation.z = -d / c.o.r; });
    c.o.hazard.emissiveIntensity = s > 30 + 9 * saR(c.z, 3) && Math.floor((s + 0.17 * c.z) / 0.42) % 2 === 0 ? 2.2 : 0; }
  // ---- the kicked ball: on its way up; held; then falls from rest and bounces (e = 0.62)
  { const B = SA_BALL, b = X.ball; let p, rot = 0;
    if (s < 0) { p = [B.p[0] + B.v[0] * s, B.p[1] + B.v[1] * s - 4.905 * s * s, B.p[2] + B.v[2] * s]; rot = s * 18; }
    else { const h0 = B.p[1] - B.r; let u = rl, y = h0, vv = 0, hh = h0, k = 0; const g = SAP.g;
      while (k < 8) { const tf = k === 0 ? Math.sqrt(2 * hh / g) : 2 * vv / g; if (u < tf) { y = k === 0 ? hh - 0.5 * g * u * u : vv * u - 0.5 * g * u * u; break; } u -= tf; vv = (k === 0 ? Math.sqrt(2 * g * hh) : vv) * 0.62; y = 0; k++; if (vv < 0.05) break; }
      p = [B.p[0], Math.max(0, y) + B.r, B.p[2]]; }
    b.position.set(p[0], p[1], p[2]); b.rotation.set(rot * 0.7, rot * 0.2, rot); }
  // ---- the frisbee: flying; held; falls from rest (light: it flutters down at 2.5 m/s at most)
  { const F = SA_FRIS, f = X.fris; if (s < 0) { f.position.set(F.p[0] + F.v[0] * s, F.p[1] + F.v[1] * s, F.p[2] + F.v[2] * s); f.rotation.set(0.12, s * 40, 0.05); }
    else { const vt = 2.6, u = rl, y = F.p[1] - (vt * vt / SAP.g) * Math.log(Math.cosh(SAP.g * u / vt)); f.position.set(F.p[0] + 0.25 * Math.sin(u * 2.2) * Math.min(1, u), Math.max(0.012, y), F.p[2]); f.rotation.set(0.12 + (y > 0.02 ? 0.4 * Math.sin(u * 5) : -0.12), 0, 0.05); } }
  // ---- the carp: it swims on under the pond's locked surface (water is not air)
  { const P = SA_POND_FISH, a = s * 0.21 + 0.4, R = 0.9; X.fish.position.set(P[0] + R * Math.cos(a) - R, P[1] + 0.02 * Math.sin(s * 3), P[2] + R * Math.sin(a)); X.fish.rotation.set(0, -a + Math.PI, 0.05 * Math.sin(s * 2.1)); X.fish.userData.tail.rotation.y = 0.45 * Math.sin(s * 9); }
  // ---- the pigeon at your window: flying east at 36 km/h; held mid-wingbeat; then it drops and flies on
  { const P = SA_WINPIG, b = X.winPig, v = 10, u = rl, fx = 0, dy = s < SAP.T ? 0 : -0.5 * SAP.g * Math.min(u, 0.35) ** 2 - (u > 0.35 ? 1.7 * (u - 0.35) : 0) + (u > 0.6 ? 0.8 * (u - 0.6) ** 2 : 0);
    b.position.set(P[0] - (s < 0 ? v * s : 0) + (s >= SAP.T ? -2.4 * Math.max(0, u - 0.3) ** 1.3 : 0), P[1] + dy, P[2]);
    b.rotation.set(0.12, -Math.PI / 2, 0); const ph = s < 0 ? s * 34 : s < SAP.T ? 0.0 : 0.0 + u * 34 * saSm(u, 0.15, 0.45), f = 0.85 * Math.sin(ph - 0.64);
    b.userData.wings[0].rotation.set(0, 0, f); b.userData.wings[1].rotation.set(0, 0, -f); }
  // ---- the flock taking off from the path: each bird held between two wingbeats; then dropping, flapping, away
  X.flock.forEach((b, i) => { const x0 = -2.5 + 3.2 * (saR(i, 11) - 0.5), z0 = -16.4 + 1.6 * (saR(i, 12) - 0.5), h0 = 0.25 + 2.1 * saR(i, 13) ** 0.8, yaw = 2.2 + 0.9 * (saR(i, 14) - 0.5), u = rl;
    const climb = (k) => 1.4 * k + 0.45 * k * k;                                            // taking off: up and away
    const dirx = Math.sin(yaw), dirz = Math.cos(yaw), age0 = (h0 - 0.25) / 1.8;
    let x = x0 + dirx * 2.0 * age0, y = h0, z = z0 + dirz * 2.0 * age0, ph = i * 1.7;
    if (s < 0) { x += dirx * 2.0 * s; z += dirz * 2.0 * s; y = Math.max(0.12, h0 + 1.8 * s); ph += s * 30; }
    else if (s >= SAP.T) { y = Math.max(0.12, h0 - 0.5 * SAP.g * Math.min(u, 0.3) ** 2 + (u > 0.3 ? climb(u - 0.3) - 0.44 * Math.min(u - 0.3, 0.2) * 3 : 0)); x += dirx * 2.6 * Math.max(0, u - 0.25); z += dirz * 2.6 * Math.max(0, u - 0.25); ph += u * 30 * saSm(u, 0.1, 0.35); }
    b.position.set(x, y, z); b.rotation.set(-0.25, yaw, 0); const f = 0.95 * Math.sin(ph); b.userData.wings[0].rotation.set(0, 0, f); b.userData.wings[1].rotation.set(0, 0, -f); });
  // ---- the leaves: held where they were; from 2:00:03 each falls from rest (at most vt, fluttering)
  { const { L, im } = X.leaves, M4 = _saTM, q = _saTQ, v = _saTV, e = _saTE, sc = _saTS;
    if (X._leafS !== s) { X._leafS = s;
      for (let i = 0; i < L.length; i++) { const l = L[i], te = s < 0 ? s : s < SAP.T ? 0 : s - SAP.T;
        // before 2:00 they were falling already (at vt); from 2:00:03 they start again from rest
        const xx = SAP.g * te / l.vt, fall = s < 0 ? -l.vt * s : s < SAP.T ? 0 : (l.vt * l.vt / SAP.g) * (xx > 20 ? xx - Math.LN2 : Math.log(Math.cosh(xx)));
        const y = l.y + (s < 0 ? l.vt * -s : 0) - (s >= SAP.T ? fall : 0);
        if (y < 0.02) { M4.compose(v.set(l.x, 0.02, l.z), q.setFromEuler(e.set(-Math.PI / 2, 0, l.ph)), sc); im.setMatrixAt(i, M4); continue; }
        const tt = (s < 0 ? s : te) + l.ph, sw = Math.min(1, Math.abs(tt - l.ph) * 1.2 + (s < 0 ? 1 : 0));
        const x = l.x + 0.3 * Math.sin(tt * l.w * 0.5) * sw, z = l.z + 0.25 * Math.cos(tt * l.w * 0.43) * sw;
        e.set(l.tilt + 0.7 * Math.sin(tt * l.w * 0.7) * sw, l.ax * 2.1 + l.ph, 0.6 * Math.sin(tt * l.w * 0.9)); q.setFromEuler(e); v.set(x, y, z);
        im.setMatrixAt(i, M4.compose(v, q, sc)); }
      im.instanceMatrix.needsUpdate = true; } }
  // ---- the fountain: the jet frozen into glass at 2:00; from 2:00:03 it falls back into the basin (from rest), and the
  // jet comes back from the nozzle
  { const Fn = SA_ST.fountain, nz = [Fn.x, Fn.h + 0.16, Fn.z], H = X.jetH, drop = s < SAP.T ? 0 : 0.5 * SAP.g * rl * rl;
    X.jet.visible = drop < H + 1.4; X.jet.position.set(nz[0], nz[1] - drop, nz[2]); X.crown.visible = X.jet.visible; X.crown.position.set(nz[0], nz[1] + H - drop, nz[2]);
    if (out && (m === 'fountain' || m === 'window' || m === 'leaves' || m === 'echo' || m === 'jumper' || m === 'swing' || m === 'flock')) {
      // drops: the crown's spray, frozen in a ring (each falling from where it was), and the jet when it comes back
      for (let k = 0; k < 340; k++) { const a = saR(k, 21) * 6.283, ph = saR(k, 22), r = 0.15 + 0.85 * ph, y0 = H + 0.25 * Math.sin(Math.PI * ph) - 1.9 * ph * ph + 0.05 * saR(k, 23);
        if (y0 < -0.1) continue; const y = y0 - drop; if (y + nz[1] < 0.27) continue;
        out.push([nz[0] + Math.cos(a) * r, nz[1] + y, nz[2] + Math.sin(a) * r, 0.022 + 0.018 * saR(k, 24), 0.75, 0.9, 0.95, 1.0]); }
      if (s > SAP.T + 0.1) for (let k = 0; k < 160; k++) { const u = ((s - SAP.T) * 0.9 + k / 160) % 1.0 * 1.25, h = 6 * u - 4.905 * u * u; if (h < -0.2) continue; const a = saR(k, 25) * 6.283, r = 0.4 * u;
        out.push([nz[0] + Math.cos(a) * r, nz[1] + h, nz[2] + Math.sin(a) * r, 0.03, 0.55, 0.9, 0.95, 1.0]); }
    } }
  // ---- the flag: rippling east in the breeze; frozen mid-flap at 2:00; afterwards there's no wind: it falls limp
  { const Fl = X.flag, te = s < 0 ? s : s < SAP.T ? 0 : 0, limp = s < SAP.T ? 0 : Ease.inOutSine(saSm(rl, 0.0, 2.2)), key = Math.round(te * 60) + '|' + Math.round(limp * 60);
    if (Fl.key !== key) { Fl.key = key; const P = Fl.geo.attributes.position, B = Fl.base, W = SA_FLAG.w, Ht = SA_FLAG.ht;
      for (let i = 0; i < P.count; i++) { const x = B[i * 3], y = B[i * 3 + 1], u = -x / W;
        const fx = x * (1 - 0.06 * u), fy = y - 0.12 * u * u, fz = 0.16 * u * Math.sin(u * 7.5 - te * 9) + 0.05 * u * Math.sin(y * 5 + u * 4 - te * 13);
        // limp: hanging down the pole, folded in a few soft creases
        const lx = -0.05 - 0.14 * Math.pow(u, 0.7) - 0.03 * Math.sin(y * 4), ly = y * 0.92 - W * u * 0.82, lz = 0.11 * Math.sin(u * 9 + y * 1.5) * (0.35 + u);
        P.setXYZ(i, saLerp(fx, lx, limp), saLerp(fy, ly - 0.02, limp), saLerp(fz, lz, limp)); }
      P.needsUpdate = true; Fl.geo.computeVertexNormals(); }
    Fl.mesh.rotation.y = -0.25; }
  // ---- chimney smoke on the terrace (soft puffs)
  if (out && o.smoke) for (const [cx, cy, cz] of SA_ST.smoke) for (let k = 0; k < 340; k++) {
    const s0 = Math.floor(s / 0.22) * 0.22 - k * 0.22, ph = saR(Math.round(s0 / 0.22) + 7 * cx, 31);
    if (s0 >= 0 && s0 < SAP.T) continue;                                          // (nothing came out while the air was solid)
    const P = saSmokeAt(s0, s); if (!P) continue; const age = P[3]; if (age > 90) break;
    if (age > 45) continue; const sp = 0.3 + 0.07 * age, a = 0.62 * Math.exp(-age / 20) * Math.min(1, age * 3);
    out.push([cx + P[0] + sp * 0.6 * (ph - 0.5), cy + P[1], cz + P[2] + sp * 0.6 * (saR(k, 33) - 0.5), 0.9 + 0.13 * age, a, 0.46, 0.46, 0.5]); }
  void cam; void fr;
}
