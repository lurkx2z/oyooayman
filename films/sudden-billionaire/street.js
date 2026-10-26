/* =====================================================================
   STREET — your old street (month six), downtown (year three, the camera glasses), a Dutch canal street (the letters).
   One scene, three streets; the shot's mode shows one of them.
     old      your old terraced street by day: your orange car at the kerb, a neighbour polishing his brand-new car
              (a bow on the roof), another photographing his, a house for sale
     walk     downtown at midday: you walk the block, your phone in your hand
     glass    the camera glasses (the study): your eyes (the ring) go to shop windows and to your phone; people get
              two short glances
     glass2   … and not the man sitting by the wall
     letters  a canal street: a letter through the wrong door; the woman inside walks it to the postbox; up over the canal
   sbGazeTarget(t) says where your eyes are downtown: the HUD counts the seconds they spend on people.
   ===================================================================== */

const SB_ST = {
  old: { HR: 3.6, PV: 2.6, cx: 4.75 },
  town: { HR: 5.2, PV: 5.6, cx: 7.8, v: 1.25, zMid: -60, len: 420 },
  dutch: { HR: 11, PV: 2.6, canal: 7.0, zb: 2.5 },
};
const SB_ST_DOOR = [SB_ST.dutch.HR + SB_ST.dutch.PV, 1.35];       // the door you deliver to (the front's x, the door's z)
const sbStZ = (t) => -SB_ST.town.v * (t - SB.walk);              // where you are downtown (walking towards −z)
// the middle of a shop window on the right-hand side near z (tower fronts are 14 m wide; the window fills u 0.04…0.66)
function sbStShop(z) {
  const T = SB_ST.town, z0 = T.zMid - T.len / 2, zl = z0 + 14 * Math.floor((z - z0) / 14);
  return [T.HR + T.PV - 0.05, 1.85, MathX.clamp(z, zl + 1.2, zl + 8.5)];
}
// downtown people: lane x, and z(t) = z0 + v (t − SB.walk). The first two are the ones your eyes catch; the third
// brushes past you on "Not them."
const SB_ST_PEOPLE = (() => {
  const W = SB.walk, z0At = (tp, v) => sbStZ(tp) - v * (tp - W);
  const zA = z0At(SB.glass + 3.4, 1.3), zC = z0At(SB.glass2 + 4.1, 1.3), step = (zA - zC) / 3;
  const out = [{ x: 7.05, v: 1.3, z0: zA, look: 'sbTown1' }, { x: 8.95, v: 1.25, z0: z0At(SB.glass + 6.2, 1.25), look: 'sbTown2' }, { x: 7.05, v: 1.3, z0: zC, look: 'sbTown3' }];
  const looks = ['casual1', 'sbTown4', 'casual5', 'sbTown5', 'casual7', 'sbTown6', 'casual3', 'casual6', 'sbTown2', 'casual8', 'sbTown1', 'casual4'];
  let n = 0;
  const lane = (x, v, z0, dz, count, skip) => { for (let k = 0; k < count; k++) { if (skip && skip(k)) continue; out.push({ x: x + 0.25 * (hash1(n * 3.3) - 0.5), v: v * (1 + 0.06 * (hash1(n * 5.1) - 0.5)), z0: z0 + k * dz, look: looks[n % looks.length] }); n++; } };
  // (the oncoming lane on your left shares the passers' spacing, so nobody walks through them)
  for (let k = -9; k <= 3; k++) if (k !== 0 && k !== -3) out.push({ x: 7.05 - 0.6 * (k & 1), v: 1.3, z0: zA + k * step, look: looks[(n++) % looks.length] });
  lane(9.75, -1.05, -70, 9.5, 10);          // the same way as you, on your right (you overtake them slowly)
  lane(-6.4, 1.2, -95, 8.0, 14);            // across the road, both ways
  lane(-8.9, -1.3, -80, 9.0, 12);
  return out;
})();
// where your eyes go downtown (in order): a shop window, a glance at someone, your phone, …
const SB_GAZE_SEGS = (() => {
  const G = SB.glass, G2 = SB.glass2, D = SB.drive, z = sbStZ;
  return [
    { k: 'shop', t0: G - 0.6, t1: G + 1.85, at: sbStShop(z(G) - 7.5) },
    { k: 'person', t0: G + 1.85, t1: G + 2.45, who: 0 },
    { k: 'phone', t0: G + 2.45, t1: G + 4.65 },
    { k: 'person', t0: G + 4.65, t1: G + 5.15, who: 1 },
    { k: 'shop', t0: G + 5.15, t1: G + 7.6, at: sbStShop(z(G + 5.15) - 6.5) },
    { k: 'phone', t0: G + 7.6, t1: G2 },
    { k: 'shop', t0: G2, t1: G2 + 1.45, at: sbStShop(z(G2) - 6.0) },
    { k: 'phone', t0: G2 + 1.45, t1: D + 5 },
  ];
})();
const sbGazeSeg = (t) => { let i = 0; while (i + 1 < SB_GAZE_SEGS.length && SB_GAZE_SEGS[i + 1].t0 <= t) i++; return i; };
const sbStPersonAt = (P, t) => [P.x, 1.62 + 0.15, P.z0 + P.v * (t - SB.walk)];
// (the HUD's counter asks this: are your eyes on a person at time t?)
function sbGazeTarget(t) {
  if (t < SB.glass || t >= SB.drive) return { person: false, p: null };
  const s = SB_GAZE_SEGS[sbGazeSeg(t)];
  return s.k === 'person' ? { person: true, p: sbStPersonAt(SB_ST_PEOPLE[s.who], t) } : { person: false, p: s.at || null };
}

Object.assign(LOOKS, {
  sbTown1: { skin: 2, build: 'slim', shirt: '#c8b8a0', sleeves: 'short', pants: '#2a3a5a', shoes: '#e8e4dc', sole: '#f4f2ec', hair: '#2a1a10', hairStyle: 'long', shoulderBag: '#8a5a3a' },
  sbTown2: { skin: 4, build: 'avg', shirt: '#2f4a6a', sleeves: 'short', pants: '#c8bca4', shoes: '#3a2a20', sole: '#1a1410', hair: '#0e0b09' },
  sbTown3: { skin: 0, build: 'broad', shirt: '#7a2a2a', sleeves: 'short', pants: '#2a2a30', shoes: '#1a1a1a', sole: '#eee', hair: '#8a6a4a', backpack: '#2a2c30' },
  sbTown4: { skin: 1, build: 'slim', shirt: '#e8e2d4', sleeves: 'long', pants: '#1c1e24', shoes: '#141414', sole: '#0c0c0c', hair: '#c8a878', hairStyle: 'pony' },
  sbTown5: { skin: 5, build: 'avg', shirt: '#3a5a4a', sleeves: 'short', pants: '#3a3a40', shoes: '#d8d4ca', sole: '#f0ede6', hair: '#0b0b0b', hairStyle: 'bun' },
  sbTown6: { skin: 3, build: 'avg', shirt: '#24262c', sleeves: 'long', pants: '#24262c', shoes: '#141414', sole: '#0c0c0c', hair: '#1a120c', jacket: true, collar: true, inner: '#d8dde6' },
  sbSitter: { skin: 1, build: 'slim', shirt: '#4a4438', sleeves: 'long', pants: '#3a3a36', shoes: '#2a2620', sole: '#1a1814', hair: '#5a4a3a', jacket: true, hat: { type: 'beanie', color: '#5a3a2a' } },
  sbResident: { skin: 0, build: 'slim', shirt: '#6a7a8a', sleeves: 'long', pants: '#2a2c34', shoes: '#2a2018', sole: '#14100c', hair: '#c8c4bc', hairStyle: 'bun', coat: true, collar: true, scarf: '#a8483a' },
});
Object.assign(ACTIONS, {
  // posting a letter: the right arm reaches forward to the slot
  sbPostIt(τ, c) { const p = ACTIONS.idle(τ, c), k = Math.min(1, τ / 0.5) * (1 - MathX.smooth(τ, 0.9, 1.3)); p.rSh = [0.35 + 0.95 * k, 0.1]; p.rEl = 0.5 - 0.3 * k; p.neck = 0.18 * k; return p; },
  // sitting against a wall, knees up, head low
  sbSitWall(τ, c) { const p = ACTIONS.sitGround(9, c); p.spine = 0.1; p.neck = 0.45 + 0.05 * Math.sin(τ * 0.6); p.lSh = [0.55, 0.1]; p.lEl = 1.1; p.rSh = [0.5, 0.12]; p.rEl = 1.2; return p; },
  // photographing something with a phone held up in both hands
  sbPhoto(τ, c) { const p = ACTIONS.idle(τ, c); p.rSh = [1.15, -0.2]; p.lSh = [1.15, -0.2]; p.rEl = 1.55; p.lEl = 1.55; p.neck = 0.05; p.headYaw = 0; return p; },
});
Object.assign(BLEND, { sbPostIt: 0.3, sbSitWall: 0.6, sbPhoto: 0.5 });

// a red bow (two loops, a knot and two ribbons across the roof)
function sbStBow(len, wid) {
  const g = new THREE.Group(), m = sbStd('#c8201e', 0.35, 0.05);
  for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.045, 8, 22), m); l.scale.set(1, 0.6, 1.4); l.position.set(0, 0.11, s * 0.15); l.rotation.set(0, Math.PI / 2, s * 0.5); g.add(l); }
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), m); knot.position.y = 0.07; g.add(knot);
  const r1 = new THREE.Mesh(new THREE.BoxGeometry(len, 0.012, 0.13), m), r2 = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.012, wid), m); g.add(r1, r2);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
// a bicycle (Dutch: upright, black or a colour), facing +x
function sbStBike(color, parent) {
  const g = new THREE.Group(), fm = sbStd(color, 0.45, 0.4), tm = sbStd('#141414', 0.8), cm = sbStd('#c8c8c4', 0.3, 0.9);
  for (const x of [-0.52, 0.52]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.02, 6, 28), tm); w.position.set(x, 0.35, 0); g.add(w); const hub = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.004, 4, 20), cm); hub.position.copy(w.position); g.add(hub); }
  const ug = new THREE.CylinderGeometry(1, 1, 1, 6).translate(0, 0.5, 0), bar = (a, b, r = 0.016) => { const m = new THREE.Mesh(ug, fm); sbStrut(m, a, b, r); g.add(m); };
  bar([-0.52, 0.35, 0], [-0.08, 0.38, 0]); bar([-0.08, 0.38, 0], [-0.2, 0.82, 0]); bar([-0.52, 0.35, 0], [-0.2, 0.82, 0]); bar([-0.08, 0.38, 0], [0.42, 0.78, 0]);
  bar([0.52, 0.35, 0], [0.42, 0.95, 0]); bar([0.42, 0.95, -0.25], [0.42, 0.95, 0.25], 0.012);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.12), tm); seat.position.set(-0.22, 0.86, 0); g.add(seat);
  const rack = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.02, 0.16), cm); rack.position.set(-0.5, 0.72, 0); g.add(rack);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  parent.add(g);
  return g;
}
// the estate agent's board, the envelope, the cardboard sign, a canal-house door's number
function sbStSaleCanvas() {
  return sbCanvas(512, 340, (g, w, h) => {
    g.fillStyle = '#f4f2ec'; g.fillRect(0, 0, w, h); g.fillStyle = '#b8241e'; g.fillRect(0, 0, w, 120);
    g.fillStyle = '#fff'; g.font = 'bold 92px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('FOR SALE', w / 2, 64);
    g.fillStyle = '#2a2a2a'; g.font = 'bold 44px Georgia, serif'; g.fillText('HOLLIS & MAY', w / 2, 190); g.font = '34px Georgia, serif'; g.fillText('0800 555 0199', w / 2, 260);
  });
}
function sbStEnvelopeCanvas() {
  return sbCanvas(512, 256, (g, w, h) => {
    g.fillStyle = '#f2efe6'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.05)'; for (let i = 0; i < 400; i++) g.fillRect(hash1(i * 3) * w, hash1(i * 7) * h, 2, 2);
    g.fillStyle = '#c8a24a'; g.fillRect(w - 92, 18, 70, 82); g.fillStyle = '#7a5a2a'; g.font = 'bold 22px Georgia, serif'; g.textAlign = 'center'; g.fillText('NL', w - 57, 66);
    g.fillStyle = '#1e2a4a'; g.textAlign = 'left'; g.font = 'italic 40px Georgia, serif';
    g.fillText('Fam. de Wit', 120, 140); g.fillText('Lindenstraat 41', 120, 190);
  });
}
function sbStSignCanvas() {
  return sbCanvas(512, 340, (g, w, h) => {
    g.fillStyle = '#b8936a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(90,60,30,${0.05 + 0.1 * hash1(i)})`; g.fillRect(0, hash1(i * 3) * h, w, 2 + 4 * hash1(i * 5)); }
    g.fillStyle = '#1a1612'; g.font = 'bold 70px "Comic Sans MS", cursive'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('HUNGRY', w / 2, 120); g.font = 'bold 50px "Comic Sans MS", cursive'; g.fillText('anything helps', w / 2, 220); g.fillText('thank you', w / 2, 285);
  });
}
// brick paving for the quays (a herringbone of small bricks)
function sbStBrickCanvas(seed) {
  return sbCanvas(512, 512, (g, w, h) => {
    g.fillStyle = '#5a4a40'; g.fillRect(0, 0, w, h);
    for (let y = -32; y < h + 32; y += 32) for (let x = -64; x < w + 64; x += 64) for (const [dx, dy, bw, bh] of [[0, 0, 60, 28], [32, 16, 28, 60]]) {
      const k = hash2(x + dx * 3 + seed, y + dy * 7), c = [120 + 40 * k, 74 + 26 * k, 58 + 18 * k];
      g.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`; g.fillRect(x + dx + ((y / 32) & 1) * 16, y + dy, bw, bh);
    }
  });
}

SB_SETS.street = (app) => {
  const S = sbSet(app, { sky: '#9ab4d4', fov: 55, near: 0.03, far: 3000, fog: 0.0042, fogColor: '#c4ced8', hemi: ['#d6e2f0', '#8a7a66', 0.7],
    sun: [-35, 80, -45], sunColor: '#fff1dc', sunI: 2.6, shadow: 2048, shadowR: 46, shadowFar: 260 });
  const { scene, camera: cam, sun, hemi } = S;
  const sky = sbSky(scene, '#4f7fb8', '#c6d6e6', '#8a8680', { sunDir: [-0.4, 0.8, -0.45], sunGlow: '#fff2d8', hw: 0.3 });
  scene.environment = sbEnv(app.renderer, '#a8c0dc', '#e2dcd2', '#7a6e60');
  const W = SB_W, K = sbK, VF = new VehicleFactory();
  const groups = { old: new THREE.Group(), town: new THREE.Group(), dutch: new THREE.Group() };
  for (const g of Object.values(groups)) scene.add(g);
  const person = (spec, g) => { const p = sbPerson(Object.assign({ y: 0.15 }, spec), scene); p.group = g; p.root.traverse((m) => { if (m.isMesh) m.castShadow = true; }); return p; };
  const car = (type, color, x, z, ry, g) => { const c = VF.build(type, color); c.group.position.set(x, 0, z); c.group.rotation.y = ry; c.group.traverse((m) => { if (m.isMesh) m.castShadow = true; }); c.tail.emissiveIntensity = 0; g.add(c.group); return c; };
  const tree = (x, z, s, g) => {
    const t = new THREE.Group(), bark = sbStd('#4a3a2c', 0.9), leaf = sbStd('#4f6a34', 0.85), leaf2 = sbStd('#6a8440', 0.85);
    sbCyl(0.12 * s, 0.17 * s, 3.2 * s, bark, 0, 1.6 * s, 0, t, 8);
    for (let i = 0; i < 7; i++) { const a = i * 2.4, r = (i ? 1.1 : 0) * s; sbMesh(new THREE.IcosahedronGeometry((1.35 - 0.1 * (i % 3)) * s, 1), i % 2 ? leaf : leaf2, Math.cos(a) * r, (4.0 + 0.6 * (i % 3)) * s, Math.sin(a) * r, t); }
    t.position.set(x, 0.15, z); g.add(t); return t;
  };

  // ======================= 1 · YOUR OLD STREET (terraced houses, afternoon) =======================
  const O = SB_ST.old, gO = groups.old;
  const STo = sbStreet(gO, { len: 300, zMid: -60, kind: 'terrace', seed: 21, night: false, crossingZ: -150, halfRoad: O.HR, pave: O.PV, parked: false });
  for (const b of STo.buildings) b.box.castShadow = true;
  // your car, at the kerb where you grew up; the neighbours' new cars (bows on their roofs); ordinary cars
  const mine = car('sbSuper', '#d8541e', O.HR - 1.05, -1.2, Math.PI / 2, gO);
  const newCars = [['suv', '#eceae4', O.HR - 1.05, -10.5, Math.PI / 2], ['hatch', '#b82a24', -O.HR + 1.05, -12.5, -Math.PI / 2], ['sedan', '#2a3a5a', O.HR - 1.05, -31, Math.PI / 2]];
  const bows = newCars.map(([ty, col, x, z, ry]) => {
    const c = car(ty, col, x, z, ry, gO), b = sbStBow(c.L * 0.42, c.W * 0.9);
    b.position.set(-c.L * 0.12, c.height + 0.01, 0); c.group.add(b); return c;
  });
  for (const [ty, col, sx, z] of [['hatch', '#8a8f94', 1, 7], ['sedan', '#3a3a40', -1, 2], ['van', '#e8e6e0', -1, -36], ['sedan', '#6a2a2a', 1, -21], ['hatch', '#304a3a', -1, -27], ['suv', '#1f2226', -1, -46], ['hatch', '#c9c6be', 1, -46], ['sedan', '#7a6a50', -1, -54]])
    car(ty, col, sx * (O.HR - 1.05), z, sx > 0 ? Math.PI / 2 : -Math.PI / 2, gO);
  // the neighbours: one polishing (from the road side, over the roof), one photographing his; people on the pavements
  const nb1 = person({ id: 'sbNb1', look: 'sbNeighbour', path: [[0, O.HR + 0.3, -10.0]], face: 90, states: [[0, 'sbWipe']] }, gO);
  const nb2 = person({ id: 'sbNb2', look: 'casual2', path: [[0, -O.HR - 1.0, -9.6]], face: -51, states: [[0, 'sbPhoto']] }, gO);
  const oldPeople = [nb1, nb2];
  for (let i = 0; i < 5; i++) { const x = (i % 2 ? -1 : 1) * (O.HR + 0.9 + 0.5 * (i % 3)), z0 = -70 + i * 13, v = i % 2 ? 1.1 : -1.0; if (x > 0 && i === 2) continue;
    oldPeople.push(person({ id: 'sbOw' + i, look: ['casual1', 'casual5', 'casual7', 'sbTown5', 'casual6'][i], path: [[SB.neighbours - 20, x, z0 - 20 * v], [SB.neighbours + 30, x, z0 + 30 * v]], states: [[0, 'walk']] }, gO)); }
  // a house for sale (the board on a post off the wall)
  { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.63), sbStd('#ffffff', 0.6, 0, { map: sbTex(sbStSaleCanvas(), { repeat: false }), side: THREE.DoubleSide })); b.position.set(-O.HR - O.PV + 0.62, 3.3, -25); gO.add(b);
    sbCyl(0.025, 0.025, 1.6, sbStd('#e8e4da', 0.6), -O.HR - O.PV + 0.62, 3.0, -25.02, gO, 8).rotation.z = 0; sbBox(0.6, 0.05, 0.05, sbStd('#e8e4da', 0.6), -O.HR - O.PV + 0.3, 3.75, -25.02, gO); }
  for (const [x, z] of [[O.HR + 0.55, -16], [-O.HR - 0.55, -8], [O.HR + 0.55, -38], [-O.HR - 0.55, -33]]) tree(x, z, 0.8, gO);

  // ======================= 2 · DOWNTOWN (towers, shops, midday) =======================
  const T = SB_ST.town, gT = groups.town;
  const STt = sbStreet(gT, { len: T.len, zMid: T.zMid, kind: 'tower', seed: 7, night: false, crossingZ: -150, halfRoad: T.HR, pave: T.PV, parked: false });
  for (const b of STt.buildings) b.box.castShadow = true;
  for (let z = -200; z < 40; z += 12) for (const sx of [-1, 1]) { if (sx > 0 && Math.abs(z - -18) < 4) continue; tree(sx * (T.HR + 0.75), z + (sx > 0 ? 0 : 6), 0.72, gT); }
  for (let z = -190; z < 40; z += 31) for (const sx of [-1, 1]) { const bn = sbCyl(0.24, 0.22, 0.85, sbStd('#2a3a32', 0.5, 0.3), sx * (T.HR + 0.6), 0.58, z + 4, gT, 12); }
  const townPeople = SB_ST_PEOPLE.map((P, i) => person({ id: 'sbTp' + i, look: P.look, path: [[SB.walk - 40, P.x, P.z0 - 40 * P.v], [SB.walk + 40, P.x, P.z0 + 40 * P.v]], states: [[-100, 'walk']], stride: 1.25 + 0.1 * hash1(i) }, gT));
  // people looking in the windows (standing, facing the glass)
  for (const [x, z, f, lk] of [[10.25, -3, -90, 'casual8'], [10.3, -11.5, -90, 'sbTown4'], [10.2, -38, -90, 'casual5'], [-10.3, -9, 90, 'sbTown6'], [-10.25, -27, 90, 'casual3'], [10.3, -46, -90, 'sbTown1']])
    townPeople.push(person({ id: 'sbTs' + z, look: lk, path: [[0, x, z]], face: f, states: [[0, 'idle']] }, gT));
  // the man sitting by the wall: a cup, a cardboard sign (you pass him on "Not them.")
  const sitZ = sbStZ(sbCap('glass2', 1).hide) - 2.7;
  const sitter = person({ id: 'sbSit', look: 'sbSitter', path: [[0, T.HR + T.PV - 0.55, sitZ]], face: 90, states: [[0, 'sbSitWall']] }, gT);
  townPeople.push(sitter);
  { const cup = sbCyl(0.045, 0.035, 0.11, sbStd('#e8e2d4', 0.6), T.HR + T.PV - 1.6, 0.205, sitZ + 0.42, gT, 12);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.33), sbStd('#ffffff', 0.9, 0, { map: sbTex(sbStSignCanvas(), { repeat: false }) })); sign.position.set(T.HR + T.PV - 1.45, 0.33, sitZ + 0.05); sign.rotation.set(0, -Math.PI / 2, 0); sign.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), -0.35); gT.add(sign); }
  // traffic: towards the far end on the right, towards you on the left (a bus among the cars)
  const traffic = [];
  for (let i = 0; i < 14; i++) {
    const dir = i % 2 ? 1 : -1, ty = i === 4 ? 'bus' : ['sedan', 'hatch', 'suv', 'sedan', 'van', 'hatch', 'pickup'][i % 7], col = ['#e8e6e0', '#1f2226', '#8a8f94', '#2e3a4c', '#6a2a2a', '#c9c6be', '#304a3a'][(i * 3) % 7];
    const c = car(ty, ty === 'bus' ? '#c8a020' : col, 0, 0, dir < 0 ? Math.PI / 2 : -Math.PI / 2, gT);
    traffic.push({ c, dir, x: dir < 0 ? 2.6 : -2.6, ph: (i >> 1) * 48 + hash1(i * 9) * 20, v: 8.5 + 2 * hash1(i * 4) });
  }
  VF.m.head.emissiveIntensity = 0;

  // ======================= 3 · THE DUTCH CANAL STREET (morning) =======================
  const Dd = SB_ST.dutch, gD = groups.dutch, DZ0 = SB_ST_DOOR[1];
  const STd = sbStreet(gD, { len: 240, zMid: 20, kind: 'dutch', seed: 9, night: false, crossingZ: -500, halfRoad: Dd.HR, pave: Dd.PV, parked: false });
  STd.road.visible = false; for (const s of STd.stripes) s.visible = false;
  for (const b of STd.buildings) b.box.castShadow = true;
  // (the gables: stepped tops on each house, in its own brick, with a white cornice)
  { const bricks = ['#6a3a2c', '#5a2e24', '#7a4630', '#5e3a2e', '#4a2a22'], cor = sbStd('#ece6da', 0.7);
    STd.buildings.forEach((b, i) => {
      const m = sbStd(bricks[i % 5], 0.9), top = b.h + 0.15, x = b.x - b.sx * 4.6, gw = 4.96;
      sbBox(1.0, 0.18, gw + 0.1, cor, x, top + 0.09, b.z, gD).castShadow = false;
      const style = (i * 7) % 3;
      if (style === 0) { sbBox(0.6, 1.4, gw * 0.62, m, x, top + 0.88, b.z, gD); sbBox(0.6, 1.1, gw * 0.3, m, x, top + 2.13, b.z, gD); sbBox(0.7, 0.12, gw * 0.34, cor, x, top + 2.74, b.z, gD); }
      else if (style === 1) { const g2 = sbBox(0.6, gw / Math.SQRT2, gw / Math.SQRT2, m, x, top, b.z, gD); g2.rotation.x = Math.PI / 4; }   // (a pointed gable: a diamond half sunk in the roof)
      else { sbBox(0.6, 2.0, gw * 0.42, m, x, top + 1.0, b.z, gD); sbBox(0.7, 0.16, gw * 0.5, cor, x, top + 2.06, b.z, gD); }
    }); }
  // the canal: water, brick quay walls, brick quays, bollards, trees, parked cars, bikes, two houseboats
  const waterTex = sbTex(sbCanvas(256, 256, (g, w, h) => { const img = g.createImageData(w, h); for (let i = 0; i < w * h; i++) { const x = i % w, y = (i / w) | 0, v = 128 + 60 * (noise1(x * 0.05 + y * 0.013, 3) - 0.5) + 30 * (hash2(x, y) - 0.5); img.data.set([v, v, v, 255], i * 4); } g.putImageData(img, 0, 0); }), { srgb: false });
  waterTex.repeat.set(4, 60);
  const water = sbMesh(new THREE.PlaneGeometry(2 * Dd.canal, 240), sbStd('#0c1a18', 0.08, 0.0, { bumpMap: waterTex, bumpScale: 0.5, envMapIntensity: 0.9 }), 0, -1.0, 20, gD);
  water.rotation.x = -Math.PI / 2; water.castShadow = false; water.material.envMap = sbEnv(app.renderer, '#4a6a92', '#2a4650', '#0a1410');
  const quayTex = sbTex(sbStBrickCanvas(5)); quayTex.repeat.set(2, 120);
  for (const sx of [-1, 1]) {
    const q = sbMesh(new THREE.PlaneGeometry(Dd.HR - Dd.canal, 240), sbStd('#ffffff', 0.85, 0, { map: quayTex }), sx * (Dd.canal + Dd.HR) / 2, 0.0, 20, gD); q.rotation.x = -Math.PI / 2; q.castShadow = false;
    sbBox(0.3, 1.25, 240, sbStd('#5a3a30', 0.9), sx * (Dd.canal + 0.15), -0.62, 20, gD).castShadow = false;
    sbBox(0.32, 0.1, 240, sbStd('#8a8478', 0.8), sx * (Dd.canal + 0.16), 0.03, 20, gD);
    for (let z = -80; z < 120; z += 3.2) sbCyl(0.06, 0.07, 0.75, sbStd('#2a1a1e', 0.5), sx * (Dd.canal + 0.5), 0.38, z, gD, 8);
    for (let z = -75; z < 120; z += 10) tree(sx * (Dd.canal + 0.9), z + (sx > 0 ? 0 : 5), 1.15, gD);
    for (let z = -70, n = 0; z < 110; z += 10, n++) { if (hash1(n * 3 + sx) < 0.3 || (sx > 0 && Math.abs(z - Dd.zb) < 9)) continue;
      car(['hatch', 'sedan', 'hatch', 'suv'][n % 4], ['#8a8f94', '#2e3a4c', '#e8e6e0', '#1f2226', '#6a2a2a', '#304a3a'][(n * 5 + (sx > 0 ? 1 : 0)) % 6], sx * (Dd.canal + 1.75), z + (sx > 0 ? 4.8 : 0.2), sx > 0 ? Math.PI / 2 : -Math.PI / 2, gD); }
    for (let i = 0; i < 9; i++) { if (sx > 0 && Math.abs(-30 + i * 7.3 + sx * 2 - DZ0) < 3) continue; const b = sbStBike(['#141414', '#1f2a3a', '#5a1f24', '#141414', '#2a3a2a'][i % 5], gD); b.position.set(sx * (Dd.HR + Dd.PV - 0.35), 0.15, -30 + i * 7.3 + sx * 2); b.rotation.set(0, Math.PI / 2 + (hash1(i) - 0.5) * 0.2, 0.08 * sx); }
  }
  for (const [x, z0, L] of [[-5.1, -20, 15], [5.15, 28, 13]]) {
    const hb = new THREE.Group(); hb.position.set(x, -1.0, z0); gD.add(hb);
    sbBox(3.6, 0.7, L, sbStd('#2a2c30', 0.6), 0, 0.15, 0, hb); sbBox(3.4, 2.0, L - 1.6, sbStd(x < 0 ? '#3a5a4a' : '#6a4a3a', 0.8), 0, 1.5, 0, hb); sbBox(3.6, 0.12, L - 1.2, sbStd('#2a2420', 0.7), 0, 2.56, 0, hb);
    for (let k = 0; k < Math.floor(L / 2.4); k++) for (const s of [-1, 1]) { const wdw = sbBox(0.04, 0.8, 1.2, sbStd('#a8b8c4', 0.1, 0.2, { envMapIntensity: 1.2 }), s * 1.71, 1.65, -L / 2 + 1.8 + k * 2.4, hb); wdw.castShadow = false; }
    for (let k = 0; k < 6; k++) sbMesh(new THREE.IcosahedronGeometry(0.28, 0), sbStd(['#4f6a34', '#6a8440', '#8a3a4a'][k % 3], 0.8), (hash1(k * 3) - 0.5) * 2.4, 2.8, -L / 2 + 1.5 + k * (L - 3) / 5, hb);
  }
  // the door you deliver to: frame, a green door, a fanlight, the brass letterbox (its flap swings in), the number, a step
  const DX = SB_ST_DOOR[0], DZ = SB_ST_DOOR[1], dg = new THREE.Group(); dg.position.set(DX, 0.15, DZ); gD.add(dg);
  const white = sbStd('#efeae0', 0.6), brass = sbStd('#c8a050', 0.25, 0.9);
  sbBox(0.08, 3.0, 1.42, white, -0.04, 1.5, 0, dg); sbBox(0.1, 0.1, 1.42, white, -0.07, 2.62, 0, dg);
  // (the door swings in on its hinge: everything on it lives in doorG; behind it, the dark hall)
  const PX = -0.085, doorG = new THREE.Group(); doorG.position.set(PX, 0, -0.58); dg.add(doorG);
  const dB = (w, h, d, m, x, y, z, par = doorG) => sbBox(w, h, d, m, x - PX, y, z + 0.58, par);
  sbBox(0.004, 2.42, 1.16, sbStd('#0e0c0a', 0.95), PX + 0.003, 0.17 + 1.21, 0, dg);
  dB(0.06, 2.42, 1.16, sbStd('#1f3a2c', 0.38, 0.05, { envMapIntensity: 0.8 }), -0.115, 0.17 + 1.21, 0);
  for (const [y, h] of [[0.55, 0.62], [1.62, 0.8]]) for (const z of [-0.27, 0.27]) dB(0.02, h, 0.42, sbStd('#1a3226', 0.45), -0.15, 0.17 + y, z);
  sbBox(0.03, 0.28, 1.16, sbStd('#a8b8c4', 0.08, 0.3, { envMapIntensity: 1.4 }), -0.06, 2.8, 0, dg);
  sbBox(0.45, 0.17, 1.6, sbStd('#8a8478', 0.8), -0.25, 0.085, 0, dg);
  const LB = 1.1;    // the letterbox's height above the step
  dB(0.012, 0.11, 0.36, brass, -0.151, 0.17 + LB, 0); dB(0.012, 0.035, 0.27, sbStd('#050505', 0.9), -0.156, 0.17 + LB, 0);
  const flapPivot = new THREE.Group(); flapPivot.position.set(-0.166 - PX, 0.17 + LB + 0.018, 0.58); doorG.add(flapPivot);
  sbBox(0.006, 0.04, 0.27, brass, 0, -0.02, 0, flapPivot);
  { const np = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.11), new THREE.MeshStandardMaterial({ roughness: 0.3, map: sbTex(sbCanvas(160, 110, (g, w, h) => { g.fillStyle = '#f4f2ee'; g.fillRect(0, 0, w, h); g.strokeStyle = '#1f3a7a'; g.lineWidth = 6; g.strokeRect(5, 5, w - 10, h - 10); g.fillStyle = '#1f3a7a'; g.font = 'bold 74px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('14', w / 2, h / 2 + 4); }), { repeat: false }) }));
    np.position.set(-0.165 - PX, 0.17 + 1.52, 0.58); np.rotation.y = -Math.PI / 2; doorG.add(np); }
  const slot = new THREE.Vector3(DX - 0.155, 0.15 + 0.17 + LB, DZ);    // (world: the slot's mouth)
  // the envelope: in your hand (a prop on the right hand), then sliding in on its own
  const envTex = sbTex(sbStEnvelopeCanvas(), { repeat: false });
  const envM = new THREE.MeshStandardMaterial({ map: envTex, roughness: 0.8, side: THREE.DoubleSide });
  const envWorld = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.11), envM); envWorld.rotation.x = -Math.PI / 2; envWorld.rotation.z = Math.PI; gD.add(envWorld);
  // the postbox (on the pavement by the quay) and the woman who walks the letter to it
  const PB = [DX - 2.25, DZ + 3.6];
  { const pb = new THREE.Group(); pb.position.set(PB[0], 0.15, PB[1]); gD.add(pb);
    sbCyl(0.05, 0.05, 0.9, sbStd('#2a2a2a', 0.5, 0.3), 0, 0.45, 0, pb, 10); sbBox(0.42, 0.58, 0.34, sbStd('#e0561e', 0.45, 0.1), 0, 1.15, 0, pb); sbBox(0.44, 0.06, 0.36, sbStd('#c8481a', 0.45), 0, 1.47, 0, pb);
    sbBox(0.3, 0.025, 0.02, sbStd('#141414', 0.9), 0, 1.3, -0.172, pb);
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.1), new THREE.MeshStandardMaterial({ roughness: 0.5, map: sbTex(sbCanvas(240, 80, (g, w, h) => { g.fillStyle = '#e0561e'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = 'bold 52px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('POST', w / 2, h / 2 + 3); }), { repeat: false }) }));
    lab.position.set(0, 1.05, -0.172); lab.rotation.y = Math.PI; pb.add(lab); }
  const tB = sbCap('letters', 1).show - 0.3;                // the cut: from the door to across the canal
  const tOut = tB + 0.5, tAt = tOut + 3.1, tPost = tAt + 0.25;
  const res = person({ id: 'sbRes', look: 'sbResident', path: [[0, DX - 0.25, DZ], [tOut, DX - 0.25, DZ], [tOut + 0.6, DX - 0.85, DZ + 0.1], [tAt, PB[0] + 0.05, PB[1] - 0.62], [tPost + 1.4, PB[0] + 0.05, PB[1] - 0.62], [tPost + 2.2, PB[0] + 0.75, PB[1] - 0.3], [tPost + 12, PB[0] + 0.75, PB[1] + 11]],
    states: [[0, 'idle'], [tOut, 'walk'], [tAt, 'idle'], [tPost, 'sbPostIt'], [tPost + 1.4, 'walk']] }, gD);
  const resEnv = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.22), envM); resEnv.position.set(0, -0.1, 0.03); res.j.ra.hand.add(resEnv);
  const dutchPeople = [res];
  for (let i = 0; i < 8; i++) { const sx = i % 2 ? -1 : 1, x = sx * (Dd.HR + 0.8 + 0.6 * (i % 3)), v = (i % 3 ? 1 : -1) * 1.15, z0 = -10 + i * 7;
    if (sx > 0 && i < 4) continue;
    dutchPeople.push(person({ id: 'sbDw' + i, look: ['casual1', 'casual5', 'sbTown4', 'casual7', 'sbTown2', 'casual6', 'sbTown5', 'casual3'][i], path: [[SB.letters - 20, x, z0 - 20 * v], [SB.letters + 30, x, z0 + 30 * v]], states: [[0, 'walk']] }, gD)); }

  // ======================= YOUR HANDS (the phone downtown, the letter at the door) =======================
  const G = SB_GAZE_SEGS;
  const hands = sbHands(cam, {
    right: [[-1, 'hidden'], [SB.walk - 1, 'phoneLow'], [G[2].t0 - 0.3, 'sbPhoneUp'], [G[3].t0 + 0.15, 'phoneLow'], [G[5].t0 - 0.3, 'sbPhoneUp'], [G[6].t0, 'phoneLow'], [G[7].t0 - 0.3, 'sbPhoneUp'],
      [SB.letters - 0.3, 'hidden'], [SB.letters + 0.15, 'sbPost'], [SB.letters + 3.55, 'hidden']],
    left: [[-1, 'hidden']],
  }, { sleeve: '#2a2c30', cuff: '#1e2024', watch: true });
  hands.poses.sbPhoneUp = Object.assign({}, SB_HPOSE.phone, { p: [0.1, -0.115, -0.31], N: [0.02, 0.45, 0.9] });
  hands.poses.sbPost = { p: [0.05, -0.2, -0.4], F: [0, 0, -1], N: [0, -1, 0], curl: [0.7, 0.85, 1.05, 1.15], thumb: [0.35, 0.8] };
  hands.blends.sbPhoneUp = 0.35; hands.blends.sbPost = 0.6;
  { const e = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.22), envM); e.position.set(0.0, 0.185, 0.03); const g = new THREE.Group(); g.add(e); hands.right.g.add(g); g.visible = false; e.frustumCulled = false; hands.props.env = g; }
  const envTipLocal = new THREE.Vector3(0, 0.295, 0.03);
  const _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _v = new THREE.Vector3(), _w = new THREE.Vector3(), _cq = new THREE.Quaternion();
  const orient = (F, N) => { _y.set(F[0], F[1], F[2]).normalize(); _z.set(N[0], N[1], N[2]); _z.addScaledVector(_y, -_z.dot(_y)).normalize(); _x.crossVectors(_y, _z); return _q.setFromRotationMatrix(_m.makeBasis(_x, _y, _z)); };
  const aimHand = (pose, local, worldPt) => { _v.copy(worldPt); cam.worldToLocal(_v); _w.copy(local).applyQuaternion(orient(pose.F, pose.N)); pose.p = [_v.x - _w.x, _v.y - _w.y, _v.z - _w.z]; };
  const camDir = (d) => { _cq.copy(cam.quaternion).invert(); _v.set(d[0], d[1], d[2]).applyQuaternion(_cq); return [_v.x, _v.y, _v.z]; };
  const tPush0 = SB.letters + 1.0, tRel = SB.letters + 3.3;   // the push; you let go
  const envU = (t) => t < tRel ? sbLerp(-0.5, 0.1, K(t, tPush0, tRel, Ease.inOutQuad)) : 0.1 + 0.18 * K(t, tRel, tRel + 0.3, Ease.inQuad);

  // ---- light per street
  let litKey = null;
  const setLight = (key) => {
    if (litKey === key) return; litKey = key;
    for (const [k, g] of Object.entries(groups)) g.visible = k === key;
    const L = {
      old: { top: '#5a88c0', hor: '#d6dce4', sd: [-0.35, 0.8, -0.45], sun: 2.7, sunC: '#ffe8cc', hemi: 0.62, fog: 0.0045, fogC: '#c8cdd0' },
      town: { top: '#4a7cbc', hor: '#cfdae6', sd: [-0.34, 0.9, -0.2], sun: 2.9, sunC: '#fff4e4', hemi: 0.7, fog: 0.0058, fogC: '#c6d0da' },
      dutch: { top: '#6a8cb4', hor: '#e2dcd4', sd: [0.25, 0.42, -0.87], sun: 2.4, sunC: '#ffe0b8', hemi: 0.6, fog: 0.0062, fogC: '#d4d0ca' },
    }[key];
    sky.material.uniforms.a.value.set(L.top); sky.material.uniforms.b.value.set(L.hor); sky.material.uniforms.sd.value.set(...L.sd).normalize();
    sun.intensity = L.sun; sun.color.set(L.sunC); hemi.intensity = L.hemi; scene.fog.density = L.fog; scene.fog.color.set(L.fogC); scene.background = new THREE.Color(L.hor);
    S.sunDir = L.sd;
  };
  const look = (p, at, fov, t, drift = 0.008, roll = 0) => { const d = sbDrift(t, drift, 0.3, 21); sbCam(cam, [p[0] + d[0], p[1] + d[1], p[2] + d[2]], at, fov, roll); };
  const placeSun = (c) => { const d = S.sunDir; sun.position.set(c[0] + d[0] * 120, c[1] + d[1] * 120, c[2] + d[2] * 120); sun.target.position.set(c[0], 0, c[2]); sun.target.updateMatrixWorld(); };

  // downtown: where your head points (it follows your eyes to windows and the phone, not to the glances)
  const headSegs = G.filter((s) => s.k !== 'person');
  const headAim = (s, t) => {
    const z = sbStZ(t), fwd = [T.cx + 0.5, 1.55 + 0.15, z - 14];
    if (s.k === 'shop') return sbV(fwd, s.at, 0.62);
    return [T.cx + 0.25, 0.25, z - 6.5];     // (the phone: head down a little; the street still in view)
  };
  const townAim = (t) => {
    const z = sbStZ(t), fwd = [T.cx + 0.5 - 1.2 * (1 - K(t, SB.walk, SB.glass)), 1.55 + 0.15, z - 14];
    if (t < G[0].t0 + 0.6) return sbV(fwd, headAim(headSegs[0], t), K(t, G[0].t0 + 0.6 - 0.7, G[0].t0 + 0.6));
    let i = 0; while (i + 1 < headSegs.length && headSegs[i + 1].t0 <= t) i++;
    const cur = headAim(headSegs[i], t);
    if (i === 0) return cur;
    return sbV(headAim(headSegs[i - 1], t), cur, K(t, headSegs[i].t0 - 0.15, headSegs[i].t0 + 0.45));
  };
  const _pw = new THREE.Vector3();
  const gazePoint = (s, t) => {
    if (s.k === 'shop') return s.at;
    if (s.k === 'person') return sbStPersonAt(SB_ST_PEOPLE[s.who], t);
    hands.props.phone.screen.getWorldPosition(_pw); return [_pw.x, _pw.y, _pw.z];
  };

  const set = {
    scene, camera: cam,
    cuts() { return [tB]; },
    frame(t, shot) {
      const m = shot.mode, key = m === 'old' ? 'old' : m === 'letters' ? 'dutch' : 'town';
      setLight(key);
      let pos, at, fov = 55, drift = 0.008, roll = 0, show = null;
      if (key === 'old') {
        // a slow walk down your old street: past your car, the neighbour over his new car's roof; then across the road
        const k = K(t, SB.neighbours, SB.six, (x) => x), z = 3.2 - 8.6 * k, kp = K(t, sbCap('neighbours', 1).show - 0.5, sbCap('neighbours', 3).show + 0.8);
        const bob = 0.012 * Math.sin((t - SB.neighbours) * Math.PI * 2 * 1.7);
        pos = [O.cx - 0.2 * kp, 1.62 + 0.15 + bob, z]; at = sbV([O.cx - 2.6, 1.25, z - 12], [-O.HR + 0.6, 1.3, -12.0], kp); fov = 54; drift = 0.006;
        for (const p of oldPeople) p.update(t);
      } else if (key === 'town') {
        const z = sbStZ(t), bob = 0.016 * Math.sin((t - SB.walk) * Math.PI * 2 * 1.85), sway = 0.012 * Math.sin((t - SB.walk) * Math.PI * 1.85);
        pos = [T.cx + sway, 1.62 + 0.15 + bob, z]; at = townAim(t); fov = 56; drift = 0.004;
        for (const p of townPeople) { const pz = p.locate(t).z; p.root.visible = pz > z - 90 && pz < z + 6; if (p.root.visible) p.update(t); }
        for (const tr of traffic) {
          const zz = -260 + ((((tr.ph + tr.dir * tr.v * (t - SB.walk)) % 340) + 340) % 340);
          tr.c.group.position.set(tr.x, 0, zz); for (const w of tr.c.wheels) w.rotation.z = -t * tr.v / tr.c.r;
        }
        show = 'phone';
      } else {
        // the door (your hand, the letter, the slot) → across the canal (she walks it to the postbox) → up over the canal
        if (t < tB) {
          pos = [DX - 1.02, 1.62 + 0.15, DZ + 0.22]; at = [DX, 0.15 + 0.17 + LB + 0.06, DZ - 0.02]; fov = 52; drift = 0.004;
        } else {
          const k1 = K(t, tB, tPost + 1.2, Ease.inOutSine), k2 = K(t, tPost + 0.6, SB.scott, Ease.inOutSine);
          // (up above the trees first, then out over the water)
          const p1 = sbV([-7.75, 2.3, DZ - 4.5], [-7.6, 2.9, DZ - 6.0], k1);
          pos = [sbLerp(p1[0], 0.0, k2), sbLerp(p1[1], 13, Ease.outQuad(k2)), sbLerp(p1[2], DZ - 22, k2)];
          at = sbV(sbV([DX, 1.6, DZ + 4.2], [DX - 1, 1.4, DZ + 4.6], k1), [4, 0.0, DZ + 38], k2); fov = sbLerp(46, 52, k2); drift = 0.012;
        }
        for (const p of dutchPeople) p.update(t);
        res.root.visible = t >= tOut - 0.1; waterTex.offset.set(t * 0.004, t * 0.02);
        doorG.rotation.y = 1.6 * K(t, tOut - 0.5, tOut + 0.1) * (1 - K(t, tOut + 1.2, tOut + 2.0));
        resEnv.visible = t < tPost + 0.35;
        // (the flap opens as the letter goes in, and drops shut once it's through)
        const u = envU(t);
        flapPivot.rotation.z = (u > -0.02 && t < tRel + 0.42) ? 1.1 * MathX.clamp((u + 0.02) / 0.05, 0, 1) : 0;
        envWorld.visible = t >= tRel && t < tRel + 0.3 && t < tB;
        if (envWorld.visible) envWorld.position.set(slot.x + u - 0.11, slot.y, slot.z);
        show = t < tRel && t < tB ? 'env' : null;
      }
      look(pos, at, fov, t, drift, roll);
      { const d = Math.hypot(at[0] - pos[0], at[1] - pos[1], at[2] - pos[2]) || 1; placeSun(sbV(pos, at, Math.min(1, 24 / d))); }
      // ---- your hands (after the camera: their poses are in its space)
      if (key === 'dutch' && t < tB) {
        hands.poses.sbPost.F = camDir([1, 0, 0]); hands.poses.sbPost.N = camDir([0, -1, 0]);
        aimHand(hands.poses.sbPost, envTipLocal, _x.set(slot.x + envU(t), slot.y, slot.z).clone());
      }
      if (show === 'phone') hands.props.phone.update(sbPhoneState(t, 'stocks'));
      hands.update(key === 'old' ? -5 : t); hands.show(show);
      this._t = t;
    },
    gaze(t) {
      const m = sbShotAt(t).mode;
      if (m !== 'glass' && m !== 'glass2') return null;
      const i = sbGazeSeg(t), s = G[i], p = gazePoint(s, t);
      const q = i > 0 ? gazePoint(G[i - 1], t) : p, k = K(t, s.t0, s.t0 + 0.14);
      return { p: sbV(q, p, k), a: W(t, SB.glass + 0.1, SB.drive - 0.02, 0.25, 0.12), text: s.k === 'shop' ? 'SHOP WINDOW' : s.k === 'phone' ? 'YOUR PHONE' : 'A PERSON' };
    },
    grade(t, p, shot) {
      const m = shot.mode;
      p.grain = 0.026;
      if (m === 'old') { p.exposure = 0.98; p.warmth = 0.07; p.contrast = 1.08; p.saturation = 1.04; }
      else if (m === 'letters') { p.exposure = 1.0; p.warmth = 0.05; p.contrast = 1.06; p.bloom = 0.25; }
      else { p.exposure = 0.98; p.warmth = 0.02; p.contrast = 1.1; p.saturation = m === 'glass2' ? 0.9 : 1.0; }
    },
  };
  return set;
};
