/* =====================================================================
   THE CITY — a coastal city at night, built around one street.
   The sea is to the south (−z, straight ahead at yaw 0). Along the water:
   the harbour (quay wall, two piers on piles, pontoons, the breakwater and
   its lighthouse), the waterfront promenade with its railing, the coast
   road, and a row of tall buildings facing the sea. From the middle of
   that row the main street runs inland (+z) and climbs the hill at 11 %
   to a small park and overlook at the top (y ≈ 31 m), from where you see
   the whole city, the harbour and the ocean. Downtown towers stand along
   the shore to the left (−x); hillside blocks fill the rest.
   Buildings use one night-facade shader: lit windows in a grid (warm,
   cool, the odd blue TV), shops on the ground floor, whole districts that
   black out as the power fails (uPower), all from world position.
   World: metres, x to your right when you face the sea, y up, −z = south.
   ===================================================================== */

const MN_CITY = {
  quayZ: -20, quayY: 2.0,         // the quay edge and top (normal sea level is 0)
  promZ: [-20, -6], roadZ: [-6, 8], walkZ: [8, 13], frontZ: 13,
  street: { half: 7.0, walk: 12.5 }, // the main street: road ±7, sidewalks to ±12.5
  slope: 0.14, rise0: 70, top: 340,
  piers: [-40, 45], pierEnd: -95, deckY: 2.25,
};

// the ground's height (m): the quay top along the waterfront, the hill rising inland, the seabed out from the quay wall
const MN_BED = [[-20, -3.0], [-90, -5.6], [-200, -7.5], [-420, -16], [-1500, -45], [-6000, -80], [-30000, -120]];
function mnBed(z) {
  const B = MN_BED;
  if (z >= B[0][0]) return B[0][1];
  for (let i = 1; i < B.length; i++) if (z >= B[i][0]) { const [z0, y0] = B[i - 1], [z1, y1] = B[i]; return y0 + (y1 - y0) * (z - z0) / (z1 - z0); }
  return B[B.length - 1][1];
}
function mnRise(z) {
  const k = MN_CITY.slope;
  if (z < 55) return 0;
  if (z < 85) return k * (z - 55) * (z - 55) / 60;
  if (z < 320) return k * (z - 70);
  if (z < 340) return k * (z - 70) - k * (z - 320) * (z - 320) / 40;
  return k * (340 - 70) - k * 20 * 20 / 40;
}
function mnGround(x, z) { return z < MN_CITY.quayZ ? mnBed(z) : MN_CITY.quayY + mnRise(z); }
// the same in GLSL (for the water's depth)
const MN_GROUND_GLSL = /* glsl */`
  float mnBed(float z){
    if (z >= -20.0) return -3.0;
    if (z >= -90.0) return mix(-3.0, -5.6, (z + 20.0) / -70.0);
    if (z >= -200.0) return mix(-5.6, -7.5, (z + 90.0) / -110.0);
    if (z >= -420.0) return mix(-7.5, -16.0, (z + 200.0) / -220.0);
    if (z >= -1500.0) return mix(-16.0, -45.0, (z + 420.0) / -1080.0);
    if (z >= -6000.0) return mix(-45.0, -80.0, (z + 1500.0) / -4500.0);
    return mix(-80.0, -120.0, clamp((z + 6000.0) / -24000.0, 0.0, 1.0));
  }
  float mnRise(float z){
    float k = ${(0.14).toFixed(3)};
    if (z < 55.0) return 0.0;
    if (z < 85.0) return k * (z - 55.0) * (z - 55.0) / 60.0;
    if (z < 320.0) return k * (z - 70.0);
    if (z < 340.0) return k * (z - 70.0) - k * (z - 320.0) * (z - 320.0) / 40.0;
    return k * 270.0 - k * 10.0;
  }
  float mnGround(vec2 p){ return p.y < -20.0 ? mnBed(p.y) : 2.0 + mnRise(p.y); }
`;

class MnCity {
  constructor(scene, rng) {
    this.scene = scene; this.rng = rng.fork(21);
    this.root = new THREE.Group(); this.root.name = 'city'; scene.add(this.root);
    this.B = new Batcher();
    this.bld = { pos: [], nrm: [], col: [], a: [] };        // building faces (one draw, the night-facade shader)
    this.lightPts = [];                                      // [x, y, z, r, g, b, size, kind] — lamps and far lights (points)
    this.lamps = [];                                          // street lamps: [x, y, z]
    this.poles = [];                                          // power poles: [x, y, z]
    this._materials();
    this._ground();
    this._waterfront();
    this._harbour();
    this._mainStreet();
    this._buildings();
    this._skyline();
    this._farCoast();
    this._overlook();
    this._furniture();
    this.B.build(this.root, 'city-static');
    this._buildFacades();
    this._buildLights();
    this._powerLines();
  }

  _materials() {
    const asph = Tex.asphalt(31), side = Tex.sidewalk(32);
    this.m = {
      asphalt: new THREE.MeshStandardMaterial({ map: asph.map, roughnessMap: asph.roughnessMap, bumpMap: asph.bumpMap, bumpScale: 1.0, roughness: 0.85, color: '#9a9a9a', name: 'mnAsphalt' }),
      walk: new THREE.MeshStandardMaterial({ map: side.map, bumpMap: side.bumpMap, bumpScale: 1.5, roughness: 0.8, color: '#a8a49c', name: 'mnWalk' }),
      stone: new THREE.MeshStandardMaterial({ map: Tex.concrete(33, [128, 124, 116]), roughness: 0.85, name: 'mnStone' }),
      quay: new THREE.MeshStandardMaterial({ map: Tex.concrete(34, [96, 94, 88]), roughness: 0.9, name: 'mnQuay' }),
      mud: new THREE.MeshStandardMaterial({ map: Tex.concrete(35, [70, 62, 52]), color: '#6a6258', roughness: 0.62, metalness: 0.0, name: 'mnMud' }),
      ground: Mat.std('#24262a', { roughness: 1 }),
      grass: Mat.std('#1e2a1c', { roughness: 1 }),
      metal: Mat.std('#2a2e33', { roughness: 0.45, metalness: 0.6 }),
      rail: Mat.std('#c9ccd0', { roughness: 0.35, metalness: 0.7 }),
      wood: Mat.std('#4a3a2c', { roughness: 0.9 }),
      pile: Mat.std('#3a3530', { roughness: 0.9 }),
      white: Mat.std('#e8e6e0', { roughness: 0.6 }),
      kerb: Mat.std('#8c8a84', { roughness: 0.85, side: THREE.DoubleSide }),
      roof: Mat.std('#2c2c2e', { roughness: 0.95 }),
      bark: Mat.std('#3b3026', { roughness: 0.95 }),
      leaf: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true, name: 'mnLeaf' }),
      mark: new THREE.MeshStandardMaterial({ color: '#d8d6cc', roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
      markY: new THREE.MeshStandardMaterial({ color: '#d0a828', roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    };
    this.m.asphalt.map.repeat.set(1, 1);
    this.m.mud.map = this.m.mud.map.clone(); this.m.mud.map.repeat.set(400, 900); this.m.mud.map.needsUpdate = true;
  }

  /* a strip x0..x1 along z0..z1 (z0 < z1) following the ground (+ yOff), UVs in metres / tile */
  _strip(x0, x1, z0, z1, yOff, tile, mat, step = 2, opts = { noShadow: true }) {
    const pos = [], uv = [], zs = [];
    for (let z = z0; z < z1; z += step) zs.push(z); zs.push(z1);
    for (let i = 0; i < zs.length - 1; i++) {
      const za = zs[i], zb = zs[i + 1], ya = mnGround(0, za) + yOff, yb = mnGround(0, zb) + yOff;
      pos.push(x0, ya, za, x0, yb, zb, x1, yb, zb, x0, ya, za, x1, yb, zb, x1, ya, za);
      uv.push(x0 / tile, za / tile, x0 / tile, zb / tile, x1 / tile, zb / tile, x0 / tile, za / tile, x1 / tile, zb / tile, x1 / tile, za / tile);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
    this.B.add(g, mat, null, opts);
  }

  _ground() {
    // the hillside under everything (a coarse grid following the ground), dark; the city stands on it
    const g = new THREE.PlaneGeometry(2400, 1400, 120, 140); g.rotateX(-Math.PI / 2); g.translate(0, 0, 680);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const z = Math.max(MN_CITY.quayZ + 0.01, p.getZ(i)); p.setZ(i, z); p.setY(i, mnGround(p.getX(i), z) - 0.05); }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, this.m.ground); m.receiveShadow = true; this.root.add(m);
    // the seabed (mud, glistening when the water leaves it): fine near the quay, coarse to the horizon
    const sb = new THREE.PlaneGeometry(1, 1, 160, 120); sb.rotateX(-Math.PI / 2);
    const q = sb.attributes.position;
    for (let i = 0; i < q.count; i++) {
      const u = q.getX(i) + 0.5, v = -q.getZ(i) + 0.5;                    // 0..1
      const x = Math.sign(u - 0.5) * Math.pow(Math.abs(u - 0.5) * 2, 1.7) * 9000, z = MN_CITY.quayZ - Math.pow(v, 2.2) * 14000;
      q.setX(i, x); q.setZ(i, z); q.setY(i, mnBed(z) + (z > -300 ? 0.25 * Math.sin(x * 0.11) * Math.sin(z * 0.07) : 0));
    }
    sb.computeVertexNormals();
    const bed = new THREE.Mesh(sb, this.m.mud); bed.receiveShadow = true; this.root.add(bed); this.bed = bed;
    // the quay wall: concrete from the quay top down to the mud, with a dark tide line
    this.B.add(Geo.quad([1200, -4, MN_CITY.quayZ], [-1200, -4, MN_CITY.quayZ], [-1200, MN_CITY.quayY, MN_CITY.quayZ], [1200, MN_CITY.quayY, MN_CITY.quayZ], 0, 0, 600, 3), this.m.quay, null);
    this.B.box(2400, 0.25, 0.5, 0, MN_CITY.quayY - 0.1, MN_CITY.quayZ + 0.2, this.m.stone);
  }

  _waterfront() {
    const C = MN_CITY, B = this.B;
    // promenade (paved), coast road, sidewalk, all along the shore
    B.add(Geo.flat(-1200, 1200, C.promZ[0], C.promZ[1], C.quayY, 3), this.m.walk, null, { noShadow: true });
    B.add(Geo.flat(-1200, 1200, C.roadZ[0], C.roadZ[1], C.quayY - 0.02, 8), this.m.asphalt, null, { noShadow: true });
    for (const [xa, xb] of [[-1200, -C.street.half], [C.street.half, 1200]]) B.add(Geo.flat(xa, xb, C.walkZ[0], 40, C.quayY + 0.14, 3), this.m.walk, null, { noShadow: true });
    B.add(Geo.flat(-C.street.half, C.street.half, C.roadZ[1], C.frontZ - 5, C.quayY - 0.02, 8), this.m.asphalt, null, { noShadow: true });
    B.box(2400, 0.16, 0.3, 0, C.quayY + 0.07, C.walkZ[0] + 0.15, this.m.kerb);
    B.box(2400, 0.16, 0.3, 0, C.quayY + 0.07, C.roadZ[0] - 0.15, this.m.kerb);
    // lane markings on the coast road (a dashed centre line, edge lines), leaving the junction clear
    for (let x = -1200; x < 1200; x += 6) if (Math.abs(x) > 16) B.box(3, 0.01, 0.14, x, C.quayY + 0.005, (C.roadZ[0] + C.roadZ[1]) / 2, this.m.mark);
    for (const z of [C.roadZ[0] + 0.5, C.roadZ[1] - 0.5]) B.box(2400, 0.01, 0.12, 0, C.quayY + 0.005, z, this.m.mark);
    // the zebra crossing at the foot of the main street
    for (let x = -6; x <= 6; x += 1.2) B.box(0.6, 0.01, 4, x, C.quayY + 0.006, C.roadZ[1] - 2.6, this.m.mark);
    // the railing along the quay: posts every 2 m, two rails, a glass-free modern look
    for (let x = -600; x <= 600; x += 2) B.box(0.06, 1.05, 0.06, x, C.quayY + 0.52, C.quayZ + 0.35, this.m.rail);
    for (const y of [0.55, 1.05]) B.add(new THREE.CylinderGeometry(0.03, 0.03, 1200, 6), this.m.rail, Geo.matrix(0, C.quayY + y, C.quayZ + 0.35, 0, 0, Math.PI / 2));
    // gaps in the railing where the piers start
    for (const px of C.piers) B.box(3.6, 0.05, 0.3, px, C.quayY + 0.01, C.quayZ + 0.3, this.m.stone);
    // promenade lamps and palms
    for (let x = -580; x <= 580; x += 24) { this._lamp(x, C.quayY, C.promZ[1] - 1.2, 0.0, 5.5); if (Math.abs(x) < 300) this._palm(x + 12, C.promZ[1] - 4.5); }
    // coast-road lamps on the building side
    for (let x = -588; x <= 588; x += 28) this._lamp(x, C.quayY + 0.14, C.walkZ[0] + 0.7, Math.PI, 7.5);
  }

  _harbour() {
    const C = MN_CITY, B = this.B, rng = this.rng.fork(3);
    // two piers: deck on piles from the quay out into the harbour; lights along them
    for (const px of C.piers) {
      B.add(Geo.flat(px - 2, px + 2, C.pierEnd, C.quayZ, C.deckY, 2), this.m.wood, null);
      B.box(4, 0.35, C.quayZ - C.pierEnd, px, C.deckY - 0.2, (C.quayZ + C.pierEnd) / 2, this.m.wood);
      for (let z = C.quayZ - 3; z > C.pierEnd; z -= 4) for (const s of [-1, 1]) {
        const y0 = mnBed(z) - 0.5;
        B.add(new THREE.CylinderGeometry(0.16, 0.18, C.deckY - y0, 7), this.m.pile, Geo.matrix(px + s * 1.7, (C.deckY + y0) / 2, z));
      }
      for (let z = C.quayZ - 6; z > C.pierEnd; z -= 10) for (const s of [-1, 1]) B.box(0.05, 0.9, 0.05, px + s * 1.95, C.deckY + 0.45, z, this.m.rail);
      for (const s of [-1, 1]) B.add(new THREE.CylinderGeometry(0.025, 0.025, C.quayZ - C.pierEnd, 5), this.m.rail, Geo.matrix(px + s * 1.95, C.deckY + 0.9, (C.quayZ + C.pierEnd) / 2, Math.PI / 2));
      for (let z = C.quayZ - 12; z > C.pierEnd; z -= 16) this.lightPts.push([px, C.deckY + 1.0, z, 1.0, 0.82, 0.55, 0.9, 0]);
    }
    // the breakwater and its lighthouse, out across the harbour mouth
    const bwZ = -300;
    const bw = new THREE.BoxGeometry(420, 6, 16); B.add(bw, this.m.quay, Geo.matrix(-90, -1.0, bwZ));
    for (let i = 0; i < 60; i++) B.add(new THREE.IcosahedronGeometry(rng.range(1.5, 3), 0), this.m.quay, Geo.matrix(-300 + i * 7 + rng.range(-2, 2), rng.range(-1.5, 1.8), bwZ + rng.range(-9, 9), rng.range(0, 3), rng.range(0, 3), 0));
    // the lighthouse (its own group: it falls in the tremors)
    const lh = new THREE.Group(); lh.position.set(118, 2, bwZ); this.root.add(lh); this.lighthouseG = lh;
    const t1 = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, 14, 12), this.m.white); t1.position.y = 7; t1.castShadow = true; lh.add(t1);
    for (const y of [4, 9]) { const band = new THREE.Mesh(new THREE.CylinderGeometry(1.95 - y * 0.03, 2.0 - y * 0.03, 1.4, 12), Mat.std('#a8231c', { roughness: 0.6 })); band.position.y = y; lh.add(band); }
    const t2 = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1.6, 10), this.m.metal); t2.position.y = 14.8; lh.add(t2);
    this.lighthouse = [118, 16.8, bwZ];
    this.lightPts.push([-300, 4, bwZ, 1.0, 0.2, 0.15, 1.6, 1], [120, 3.5, bwZ - 40, 0.2, 1.0, 0.35, 1.6, 1]);
    // pontoons (they ride the water: built separately and moved each frame) and the boats on them
    this.boats = [];
    this.pontoons = [];
    for (const [x0, z0, len, ang] of [[-20, -26, 52, 0], [8, -30, 56, 0], [72, -26, 46, 0], [-70, -30, 44, 0]]) this.pontoons.push({ x: x0, z: z0 - len / 2, len });
    let id = 0;
    for (const P of this.pontoons) for (let k = 0; k < Math.floor(P.len / 7); k++) for (const s of [-1, 1]) {
      if (rng.chance(0.25)) continue;
      const sail = rng.chance(0.55), L = sail ? rng.range(8, 11.5) : rng.range(6.5, 10);
      this.boats.push({ id: id++, x: P.x + s * (1.6 + L * 0.0 + 1.9), z: P.z + P.len / 2 - 4 - k * 7, L, W: L * 0.33, sail, col: rng.pick(['#e8e8e4', '#e2e0da', '#1f3550', '#8a2a24', '#e9e6dd', '#2c4a3a']), yaw: s > 0 ? 0 : Math.PI, seed: rng.next() });
    }
    // a few boats out at anchor in the bay, riding lights on
    for (let k = 0; k < 8; k++) this.boats.push({ id: id++, x: rng.range(-260, 260), z: rng.range(-140, -260), L: rng.range(9, 16), W: 3.6, sail: rng.chance(0.5), col: '#e4e2dc', yaw: rng.range(0, 6.28), seed: rng.next(), anchored: true });
  }

  _mainStreet() {
    const C = MN_CITY, S = C.street, B = this.B, z0 = C.frontZ - 5, z1 = 372;
    this._strip(-S.half, S.half, z0, z1, -0.02, 8, this.m.asphalt);
    for (const s of [-1, 1]) {
      this._strip(Math.min(s * S.half, s * S.walk), Math.max(s * S.half, s * S.walk), z0, z1, 0.14, 3, this.m.walk);
      // kerb faces
      const pos = []; for (let z = z0; z < z1; z += 2) { const ya = mnGround(0, z), yb = mnGround(0, z + 2), x = s * S.half; pos.push(x, ya - 0.02, z, x, ya + 0.14, z, x, yb + 0.14, z + 2, x, ya - 0.02, z, x, yb + 0.14, z + 2, x, yb - 0.02, z + 2); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); B.add(g, this.m.kerb, null, { noShadow: true });
    }
    // centre line, dashed, following the hill
    for (let z = z0 + 6; z < z1; z += 7) { const y = mnGround(0, z) + 0.005, a = Math.atan(MN_CITY.slope * (z > 85 ? 1 : 0)); B.add(new THREE.BoxGeometry(0.14, 0.01, 3.2), this.m.markY, Geo.matrix(0, y, z, -a)); }
    // street lamps both sides, staggered
    for (let z = 22; z < 330; z += 26) for (const s of [-1, 1]) this._lamp(s * (S.half + 0.6), mnGround(0, z + (s > 0 ? 13 : 0)) + 0.14, z + (s > 0 ? 13 : 0), s > 0 ? -Math.PI / 2 : Math.PI / 2, 7.5);
    // power poles along the left side of the climb (for the cables that sway)
    for (let z = 96; z < 330; z += 34) this.poles.push([-(S.walk - 0.8), mnGround(0, z) + 0.14, z]);
  }

  // a building's faces go into the facade buffers: box x0..x1, y0..y1, z0..z1; colour; [seed, floorH, bayW, kind]
  _box(x0, x1, y0, y1, z0, z1, col, a) {
    const P = this.bld.pos, N = this.bld.nrm, Cc = this.bld.col, A = this.bld.a, c = new THREE.Color(col);
    const face = (v, n) => { for (const i of [0, 1, 2, 0, 2, 3]) { P.push(...v[i]); N.push(...n); Cc.push(c.r, c.g, c.b); A.push(a[0], a[1], a[2], a[3]); } };
    face([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1]);
    face([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1]);
    face([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0]);
    face([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0]);
    face([[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, 1, 0]);
  }

  // one building: base at the lowest ground under it; [kind 0 masonry, 1 glass, 2 house]; rooftop details batched
  _building(x0, x1, z0, z1, floors, kind, rng, opts = {}) {
    const gLo = Math.min(mnGround(x0, z0), mnGround(x0, z1)), gHi = Math.max(mnGround(x0, z0), mnGround(x0, z1));
    const fh = kind === 1 ? 3.6 : kind === 2 ? 3.0 : 3.2, gf = kind === 2 ? 0 : 4.2;
    const base = gHi, top = base + gf + floors * fh;
    const cols = kind === 1 ? ['#3a4450', '#2e3a46', '#46505a', '#38424c'] : kind === 2 ? ['#b8ad9a', '#c9bfae', '#a89e8c', '#d2c7b4', '#9c8f7c'] : ['#a8a092', '#b9b2a4', '#8f887c', '#c8bca6', '#9a8e7e', '#b4a48c', '#7f7a72'];
    const col = opts.col || rng.pick(cols);
    this._box(x0, x1, gLo - 1.5, top, z0, z1, col, [rng.next() * 100, fh, kind === 1 ? 2.2 : rng.range(2.6, 3.4), kind + (gf ? 0.5 : 0) + base * 0.0]);
    this.bld.base = this.bld.base || [];
    // the floor reference for windows (ground-floor top) — stored per vertex via the colour alpha trick: we keep base in a parallel array
    const n = 30; for (let i = 0; i < n; i++) this.bld.base.push(base);
    // roof: parapet and plant
    const B = this.B, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0;
    if (kind !== 2) {
      for (let i = 0, nU = rng.int(1, 3); i < nU; i++) B.box(rng.range(1.5, 3.5), rng.range(1, 2.2), rng.range(1.5, 3), cx + rng.range(-w * 0.3, w * 0.3), top + 0.8, cz + rng.range(-d * 0.3, d * 0.3), this.m.roof, 0, { noShadow: true });
      if (rng.chance(0.3)) this.lightPts.push([cx, top + 2.5, cz, 1.0, 0.15, 0.1, 1.2, 2]);   // aircraft-warning light (blinks)
    } else {
      // a pitched roof
      const g = new THREE.CylinderGeometry(0.01, Math.hypot(w, d) * 0.5, 2.4, 4, 1); g.rotateY(Math.PI / 4);
      B.add(g, this.m.roof, Geo.matrix(cx, top + 1.2, cz, 0, 0, 0, w / Math.hypot(w, d) * 1.41, 1, d / Math.hypot(w, d) * 1.41), { noShadow: true });
    }
    return top;
  }

  _buildings() {
    const C = MN_CITY, S = C.street, rng = this.rng.fork(5);
    // the waterfront row, facing the sea (both sides of the main street), tall
    const rowZ0 = C.frontZ, rowZ1 = C.frontZ + rng.range(20, 26);
    for (const s of [-1, 1]) {
      let x = S.walk;
      while (x < 640) {
        const w = rng.range(16, 30), fl = Math.abs(x) < 170 ? rng.int(2, 4) : Math.abs(x) < 300 ? rng.int(4, 9) : rng.int(5, 16);
        const kind = rng.chance(0.3) ? 1 : 0;
        const xa = s > 0 ? x : -x - w, xb = s > 0 ? x + w : -x;
        this._building(xa, xb, rowZ0 + rng.range(0, 1.5), rowZ1 + rng.range(-2, 6), fl, kind, rng);
        x += w + (rng.chance(0.15) ? 12 : 0);
      }
    }
    // along the main street, both sides, stepping up the hill (lower as it climbs; houses near the top)
    for (const s of [-1, 1]) {
      let z = rowZ1 + 14;
      while (z < 232) {
        const d = z < 110 ? rng.range(14, 22) : rng.range(10, 16), depth = rng.range(14, 22);
        const fl = z < 110 ? rng.int(4, 7) : z < 170 ? rng.int(3, 5) : rng.int(2, 3), kind = z < 170 ? 0 : 2;
        const x0 = s > 0 ? S.walk : -S.walk - depth, x1 = s > 0 ? S.walk + depth : -S.walk;
        if (!(z < 172 && z + d > 160)) this._building(x0, x1, z, z + d - 0.4, fl, kind, rng);      // (a cross street at z 160–172)
        z += d;
      }
    }
    // hillside blocks either side, on a loose grid
    for (let bx = -560; bx < 560; bx += 64) for (let bz = 50; bz < 520; bz += 56) {
      if (Math.abs(bx + 32) < 60) continue;                 // keep the main street's frontage clear
      if (bz > 200 && Math.abs(bx + 32) < 160) continue;   // (and the hilltop below the overlook open)
      const n = rng.int(2, 4);
      for (let i = 0; i < n; i++) {
        const w = rng.range(12, 26), d = rng.range(12, 22), x0 = bx + rng.range(2, 64 - w - 2), z0 = bz + rng.range(2, 56 - d - 2);
        const hi = z0 > 260 ? rng.int(1, 3) : z0 > 150 ? rng.int(2, 6) : rng.int(3, 9);
        this._building(x0, x0 + w, z0, z0 + d, hi, z0 > 260 ? 2 : 0, rng);
      }
    }
    // two landmark towers in the middle of the view from the hill (their own meshes: one collapses near the end)
    this.landmarks = [];
    for (const [x, z, w, d, fl, col] of [[78, 96, 22, 20, 17, '#3a4450'], [-96, 128, 20, 22, 21, '#a8a092']]) {
      const save = this.bld; this.bld = { pos: [], nrm: [], col: [], a: [], base: [] };
      this._building(x - w / 2, x + w / 2, z - d / 2, z + d / 2, fl, col === '#3a4450' ? 1 : 0, rng, { col });
      this.landmarks.push({ x, z, w, d, data: this.bld }); this.bld = save;
    }
    // downtown: towers along the shore to the left
    for (let i = 0; i < 26; i++) {
      const x = -rng.range(170, 700), z = rng.range(44, 200), w = rng.range(18, 32), d = rng.range(18, 30);
      this._building(x - w / 2, x + w / 2, z - d / 2, z + d / 2, rng.int(12, 34), rng.chance(0.65) ? 1 : 0, rng);
    }
  }

  // the shore beyond: low lit buildings curving away left and right, hills behind
  _skyline() {
    const rng = this.rng.fork(6);
    for (let i = 0; i < 160; i++) {
      const side = rng.chance(0.5) ? 1 : -1, a = rng.range(0.05, 1.0), R = rng.range(900, 2600);
      const x = side * (700 + Math.sin(a) * R), z = MN_CITY.frontZ + 20 - Math.cos(a) * 200 + rng.range(0, 500);
      const w = rng.range(20, 60), d = rng.range(20, 50), fl = rng.int(3, side < 0 ? 26 : 10);
      this._building(x - w / 2, x + w / 2, z, z + d, fl, rng.chance(0.4) ? 1 : 0, rng);
    }
    // hills behind the city (silhouettes)
    const pos = [], idx = [];
    for (let i = 0, N = 140; i <= N; i++) {
      const a = (i / N - 0.5) * Math.PI * 1.3, R = 2600, x = Math.sin(a) * R * 1.4, z = 300 + Math.cos(a) * R * 0.6;
      const h = 120 + 140 * (0.5 + 0.5 * Math.sin(i * 0.37)) * (0.6 + 0.4 * Math.sin(i * 0.11 + 1));
      pos.push(x, -20, z, x, h, z); if (i < N) { const b = i * 2; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    this.root.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: '#0c1018', side: THREE.DoubleSide, fog: true })));
  }

  // across the bay: a far shore of lights (two headlands left and right), a few ships
  _farCoast() {
    const rng = this.rng.fork(7);
    for (const [xa, xb, z, n] of [[-9000, -2200, -5200, 700], [2600, 9000, -6800, 500], [-2200, 2600, -14000, 600]]) {
      for (let i = 0; i < n; i++) {
        const x = rng.range(xa, xb), zz = z + rng.range(-600, 600), warm = rng.chance(0.8);
        this.lightPts.push([x, rng.range(2, 30), zz, warm ? 1.0 : 0.8, warm ? 0.75 : 0.88, warm ? 0.45 : 1.0, rng.range(0.6, 1.3), 3]);
      }
      // a low dark landmass under the lights
      const g = new THREE.BoxGeometry(xb - xa, 60, 1400); this.B.add(g, this.m.ground, Geo.matrix((xa + xb) / 2, -10, z), { noShadow: true });
    }
    for (let i = 0; i < 6; i++) this.lightPts.push([rng.range(-3000, 3000), 6, rng.range(-1500, -3500), 1.0, 0.9, 0.7, 1.4, 1]);
  }

  _overlook() {
    const B = this.B, y = mnGround(0, 345), C = MN_CITY;
    // a paved terrace at the top of the street with a railing on its south edge, lawn and trees around
    B.add(Geo.flat(-24, 24, 334.2, 372, y + 0.15, 3), this.m.walk, null, { noShadow: true });
    B.box(48, y - mnGround(0, 334) + 0.15, 0.4, 0, (y + mnGround(0, 334)) / 2, 334.2, this.m.stone);
    B.add(Geo.flat(-60, -24, 300, 400, y + 0.1, 4), this.m.grass, null, { noShadow: true });
    B.add(Geo.flat(24, 60, 300, 400, y + 0.1, 4), this.m.grass, null, { noShadow: true });
    for (let x = -24; x <= 24; x += 1.6) B.box(0.05, 1.05, 0.05, x, y + 0.67, 334.5, this.m.rail);
    for (const h of [0.6, 1.1]) B.add(new THREE.CylinderGeometry(0.028, 0.028, 48, 6), this.m.rail, Geo.matrix(0, y + 0.15 + h, 334.5, 0, 0, Math.PI / 2));
    for (const x of [-18, -6, 6, 18]) { B.box(1.8, 0.08, 0.5, x, y + 0.6, 340, this.m.wood); B.box(1.8, 0.45, 0.06, x, y + 0.85, 340.3, this.m.wood); }
    for (const x of [-22, 22]) this._lamp(x, y + 0.15, 336, Math.PI, 4.5);
    const rng = this.rng.fork(8);
    for (let i = 0; i < 18; i++) { const s = rng.chance(0.5) ? 1 : -1; this._tree(s * rng.range(26, 58), rng.range(304, 398), rng.range(6, 10), rng); }
  }

  _furniture() {
    const C = MN_CITY, B = this.B, rng = this.rng.fork(9), y = C.quayY;
    // benches and bins on the promenade, bollards along the coast road
    for (let x = -300; x <= 300; x += 18) { if (Math.abs(x) < 6) continue; B.box(1.8, 0.08, 0.5, x, y + 0.45, -12, this.m.wood); B.box(1.8, 0.45, 0.06, x, y + 0.7, -11.75, this.m.wood); B.box(0.08, 0.45, 0.45, x - 0.8, y + 0.22, -12, this.m.metal); B.box(0.08, 0.45, 0.45, x + 0.8, y + 0.22, -12, this.m.metal); }
    for (let x = -300; x <= 300; x += 3) if (Math.abs(x) > 7) B.add(new THREE.CylinderGeometry(0.1, 0.12, 0.9, 8), this.m.metal, Geo.matrix(x, y + 0.45, C.promZ[1] + 0.4));
    // trees along the main street's sidewalks
    for (let z = 34; z < 300; z += 16) for (const s of [-1, 1]) if (rng.chance(0.75) && !(z > 158 && z < 174)) this._tree(s * (C.street.walk - 1.6), z + rng.range(-2, 2), rng.range(5, 7.5), rng, mnGround(0, z) + 0.14);
    // traffic lights at the junction
    for (const [x, z] of [[-8.2, C.walkZ[0] + 0.6], [8.2, C.walkZ[0] + 0.6], [-8.2, C.roadZ[0] - 0.6], [8.2, C.roadZ[0] - 0.6]]) {
      B.add(new THREE.CylinderGeometry(0.08, 0.1, 3.4, 8), this.m.metal, Geo.matrix(x, y + 1.7, z)); B.box(0.35, 0.95, 0.3, x, y + 3.2, z, this.m.metal);
      this.lightPts.push([x, y + 3.45, z, 1.0, 0.2, 0.1, 0.5, 4]);
    }
  }

  _lamp(x, y, z, ry, h) {
    const B = this.B;
    B.add(new THREE.CylinderGeometry(0.07, 0.11, h, 8), this.m.metal, Geo.matrix(x, y + h / 2, z));
    const ax = Math.sin(ry), az = Math.cos(ry);
    B.add(new THREE.BoxGeometry(0.12, 0.08, 1.4), this.m.metal, Geo.matrix(x + ax * 0.6, y + h, z + az * 0.6, 0, ry, 0));
    this.lamps.push([x + ax * 1.2, y + h - 0.1, z + az * 1.2]);
    this.lightPts.push([x + ax * 1.2, y + h - 0.12, z + az * 1.2, 1.0, 0.78, 0.5, 1.4, 5]);
  }

  _palm(x, z) {
    const B = this.B, y = MN_CITY.quayY, h = 7.5;
    for (let i = 0; i < 6; i++) B.add(new THREE.CylinderGeometry(0.2 - i * 0.015, 0.22 - i * 0.015, h / 6, 7), this.m.bark, Geo.matrix(x + Math.sin(i * 0.3) * 0.15 * i, y + h / 12 + i * h / 6, z));
    const g = new THREE.ConeGeometry(0.5, 3.2, 3); g.translate(0, 1.6, 0); g.rotateX(Math.PI / 2 - 0.35);
    for (let k = 0; k < 7; k++) B.add(g, this.m.leaf, Geo.matrix(x + 0.9, y + h, z, 0, (k / 7) * Math.PI * 2, 0), { color: '#1d3322' });
  }

  _tree(x, z, h, rng, y0 = null) {
    const B = this.B, y = y0 === null ? mnGround(x, z) : y0;
    B.add(new THREE.CylinderGeometry(0.12, 0.2, h * 0.5, 6), this.m.bark, Geo.matrix(x, y + h * 0.25, z));
    for (let k = 0; k < 3; k++) B.add(new THREE.IcosahedronGeometry(h * rng.range(0.2, 0.28), 0), this.m.leaf, Geo.matrix(x + rng.range(-0.7, 0.7), y + h * (0.6 + k * 0.12), z + rng.range(-0.7, 0.7), rng.range(0, 3), rng.range(0, 3), 0), { color: rng.pick(['#1c2a1c', '#223322', '#1a261a']) });
  }

  /* ---------------- the night facades: one geometry, one shader ---------------- */
  _buildFacades() {
    const D = this.bld, g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(D.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(D.nrm, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(D.col, 3));
    g.setAttribute('aB', new THREE.Float32BufferAttribute(D.a, 4));
    g.setAttribute('aBase', new THREE.Float32BufferAttribute(D.base, 1));
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0.0, name: 'mnFacade' });
    this.facadeU = { uPower: { value: 1 }, uLit: { value: 0.42 }, uTime: { value: 0 }, uShake: { value: 0 } };
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.facadeU);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aB; attribute float aBase; varying vec4 vB; varying float vBase; varying vec3 vWp; varying vec3 vWn;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvB = aB; vBase = aBase; vWp = (modelMatrix * vec4(transformed, 1.0)).xyz; vWn = normalize(mat3(modelMatrix) * objectNormal);');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        varying vec4 vB; varying float vBase; varying vec3 vWp; varying vec3 vWn; uniform float uPower, uLit, uTime;
        float mnH(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          float kind = floor(vB.w), shopF = fract(vB.w) > 0.25 ? 1.0 : 0.0;
          vec3 n = normalize(vWn);
          if (abs(n.y) < 0.5) {
            float u = abs(n.x) > 0.5 ? vWp.z * sign(n.x) : -vWp.x * sign(n.z);
            float gf = shopF * 4.2, v = vWp.y - vBase - gf;
            float fh = vB.y, bw = vB.z;
            vec2 cell = vec2(floor(u / bw), floor(v / fh)), f = vec2(fract(u / bw), fract(v / fh));
            float ww = kind > 0.5 && kind < 1.5 ? 0.86 : 0.52, wh = kind > 0.5 && kind < 1.5 ? 0.78 : 0.5;
            float win = step(abs(f.x - 0.5), ww * 0.5) * step(abs(f.y - 0.52), wh * 0.5) * step(0.0, v);
            float r = mnH(vec3(cell, vB.x)), r2 = mnH(vec3(cell.yx + 3.1, vB.x * 1.7));
            // whole districts lose power together
            float district = mnH(vec3(floor(vWp.xz / 150.0), 7.0));
            float on = step(district, uPower * 1.02) ;
            float lit = step(r, uLit) * win * on;
            vec3 lc = r2 < 0.6 ? vec3(1.0, 0.72, 0.42) : r2 < 0.85 ? vec3(0.95, 0.88, 0.75) : r2 < 0.95 ? vec3(0.7, 0.8, 1.0) : vec3(0.45, 0.6, 1.0);
            float flick = r2 > 0.95 ? 0.75 + 0.25 * sin(uTime * 7.0 + r * 40.0) : 1.0;
            totalEmissiveRadiance += lc * lit * (0.55 + 0.9 * r2) * 0.9 * flick;
            // dark glass in the unlit windows; a darker frame band
            diffuseColor.rgb *= mix(1.0, 0.28, win * (1.0 - lit));
            // shops along the ground floor (lit when the power is on)
            if (shopF > 0.5 && v < 0.0 && v > -gf) {
              float sw = step(0.15, fract(u / 7.5)) * step(fract(u / 7.5), 0.92) * step(-gf + 0.3, v) * step(v, -0.9);
              float rs = mnH(vec3(floor(u / 7.5), 5.0, vB.x));
              totalEmissiveRadiance += (rs < 0.5 ? vec3(1.0, 0.8, 0.55) : vec3(0.85, 0.92, 1.0)) * sw * on * step(0.2, rs) * 1.2;
              diffuseColor.rgb *= mix(1.0, 0.35, sw);
            }
          } else diffuseColor.rgb *= 0.55;      // roofs
        }`);
    };
    const mesh = new THREE.Mesh(g, m); mesh.castShadow = true; mesh.receiveShadow = true; mesh.name = 'facades';
    this.root.add(mesh); this.facades = mesh;
    for (const L of this.landmarks || []) {
      const lg = new THREE.BufferGeometry(), D2 = L.data;
      lg.setAttribute('position', new THREE.Float32BufferAttribute(D2.pos, 3)); lg.setAttribute('normal', new THREE.Float32BufferAttribute(D2.nrm, 3));
      lg.setAttribute('color', new THREE.Float32BufferAttribute(D2.col, 3)); lg.setAttribute('aB', new THREE.Float32BufferAttribute(D2.a, 4)); lg.setAttribute('aBase', new THREE.Float32BufferAttribute(D2.base, 1));
      lg.translate(-L.x, 0, -L.z);
      const lm = new THREE.Mesh(lg, m); lm.position.set(L.x, 0, L.z); lm.castShadow = true; this.root.add(lm); L.mesh = lm;
    }
  }

  /* ---------------- lamps and far lights as soft points ---------------- */
  _buildLights() {
    const L = this.lightPts, n = L.length, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), sz = new Float32Array(n), kind = new Float32Array(n), seed = new Float32Array(n);
    L.forEach((p, i) => { pos.set(p.slice(0, 3), i * 3); col.set(p.slice(3, 6), i * 3); sz[i] = p[6]; kind[i] = p[7]; seed[i] = hash1(i * 7 + 3); });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aCol', new THREE.BufferAttribute(col, 3)); g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
    g.setAttribute('aKind', new THREE.BufferAttribute(kind, 1)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    this.lightMat = new THREE.ShaderMaterial({
      uniforms: { uPx: { value: 1 }, uPower: { value: 1 }, uTime: { value: 0 }, uGain: { value: 1 } },
      vertexShader: /* glsl */`
        attribute vec3 aCol; attribute float aSize, aKind, aSeed; uniform float uPx, uPower, uTime, uGain; varying vec3 vCol;
        float h(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
          float d = -mv.z, on = 1.0;
          // street and building lights follow their district's power; navigation lights and far shores keep going a while
          float district = h(vec3(floor(position.xz / 150.0), 7.0));
          if (aKind > 3.5) on = step(district, uPower * 1.02);
          if (aKind > 1.5 && aKind < 2.5) on = step(0.5, fract(uTime * 0.5 + aSeed));                 // blinking warning lights
          if (aKind > 2.5 && aKind < 3.5) on = step(aSeed, 0.3 + 0.7 * uPower);
          float s = aSize * uPx * clamp(260.0 / d, 0.8, 4.0);
          vCol = aCol * on * uGain * min(1.0, 600.0 / d + 0.35);
          gl_PointSize = on > 0.0 ? max(s, 1.6 * uPx) : 0.0;
        }`,
      fragmentShader: /* glsl */`varying vec3 vCol; void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r2 = dot(q, q); if (r2 > 1.0) discard; gl_FragColor = vec4(vCol * (exp(-r2 * 5.0) * 1.6 + exp(-r2 * 22.0) * 3.0), 1.0); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const pts = new THREE.Points(g, this.lightMat); pts.frustumCulled = false; pts.renderOrder = 5; this.root.add(pts); this.lightPoints = pts;
    // the lamps' glowing heads (small emissive boxes)
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.3), new THREE.MeshBasicMaterial({ color: '#ffd9a8' }));
    this.lampHeads = new THREE.InstancedMesh(head.geometry, head.material, this.lamps.length);
    this.lamps.forEach((p, i) => this.lampHeads.setMatrixAt(i, Geo.matrix(p[0], p[1], p[2])));
    this.root.add(this.lampHeads);
    // pools of lamplight on the ground under each lamp (additive, warm; they go dark with their district)
    const pool = new THREE.PlaneGeometry(1, 1); pool.rotateX(-Math.PI / 2);
    this.poolMat = new THREE.ShaderMaterial({
      uniforms: { uPower: { value: 1 } },
      vertexShader: /* glsl */`varying vec2 vQ; varying float vOn; uniform float uPower;
        float h(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
        void main(){ vQ = position.xz * 2.0; vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
          vOn = step(h(vec3(floor(w.xz / 150.0), 7.0)), uPower * 1.02); gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`varying vec2 vQ; varying float vOn; void main(){ float r = length(vQ); if (r > 1.0) discard; gl_FragColor = vec4(vec3(1.0, 0.72, 0.42) * 0.16 * vOn * pow(1.0 - r, 1.6), 1.0); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
    });
    const pools = new THREE.InstancedMesh(pool, this.poolMat, this.lamps.length);
    this.lamps.forEach((p, i) => { const gy = mnGround(p[0], p[2]) + (Math.abs(p[0]) > MN_CITY.street.half && p[2] > MN_CITY.walkZ[0] ? 0.16 : 0.03), sl = p[2] > 85 && p[2] < 320 ? Math.atan(MN_CITY.slope) : 0;
      pools.setMatrixAt(i, Geo.matrix(p[0], gy, p[2], -sl, 0, 0, 13, 1, 13)); });
    pools.frustumCulled = false; pools.renderOrder = 4; this.root.add(pools); this.pools = pools;
  }

  /* ---------------- power cables between the poles (they sway in the tremors) ---------------- */
  _powerLines() {
    const P = this.poles, B = new Batcher();
    for (const [x, y, z] of P) { B.add(new THREE.CylinderGeometry(0.12, 0.16, 9, 7), this.m.wood, Geo.matrix(x, y + 4.5, z)); B.box(2.4, 0.12, 0.12, x, y + 8.6, z, this.m.wood); }
    B.build(this.root, 'poles');
    this.cables = [];
    const mat = new THREE.LineBasicMaterial({ color: '#0d0f12' });
    for (let i = 0; i < P.length - 1; i++) for (const dx of [-1.0, 0, 1.0]) {
      const a = new THREE.Vector3(P[i][0] + dx, P[i][1] + 8.7, P[i][2]), b = new THREE.Vector3(P[i + 1][0] + dx, P[i + 1][1] + 8.7, P[i + 1][2]);
      const g = new THREE.BufferGeometry().setFromPoints(new Array(17).fill(0).map(() => new THREE.Vector3()));
      const line = new THREE.Line(g, mat); line.frustumCulled = false; this.root.add(line);
      this.cables.push({ a, b, line, ph: hash1(i * 3 + dx * 7 + 11) * 6.28 });
    }
  }

  update(t, S, quake, power) {
    this.facadeU.uPower.value = power; this.facadeU.uTime.value = t;
    this.lightMat.uniforms.uPower.value = power; this.lightMat.uniforms.uTime.value = t;
    // lamp heads go dark with their district (approximately: all at once below half power)
    this.lampHeads.visible = power > 0.35; this.poolMat.uniforms.uPower.value = power;
    // cables: a sagging catenary that swings with the tremor
    for (const C of this.cables) {
      const p = C.line.geometry.attributes.position, sway = quake * 0.9 * Math.sin(t * 5.2 + C.ph) + quake * 0.4 * Math.sin(t * 9.1 + C.ph * 2);
      for (let k = 0; k <= 16; k++) {
        const u = k / 16, sag = 4 * u * (1 - u);
        p.setXYZ(k, C.a.x + (C.b.x - C.a.x) * u + sway * sag, C.a.y + (C.b.y - C.a.y) * u - sag * (0.9 + 0.3 * quake * Math.sin(t * 6 + C.ph)), C.a.z + (C.b.z - C.a.z) * u);
      }
      p.needsUpdate = true;
    }
  }
}
