/* =====================================================================
   SOUND-FIELD CITY — scene 13's metaphor: the city around the drill hall, seen only as sound. It is never shown as a
   picture: in the sound view nothing is lit but what a sound reaches, for as long as it lasts.
     The hall      the drill hall's footprint (x −8…34, z −11…11, the arena's own coordinates), roofless (the roof has
                   "dissolved" in the rise), the course inside it; she stands where scene 12 left her
     Streets       an avenue along z −40 (16 m), a street along z 52, cross streets at x −170, −70, 70, 160, 260, streets
                   at z −130 and 230; perimeter blocks of brick, concrete and glass (10–34 m), courtyards inside
     Open spaces   a square east of the hall (a fountain), a park west of it (lawns, trees)
     Water         a river along z 120…150 in a stone channel, three bridges; a weir at x 52 (upstream of the bridge)
     Life          traffic on the streets (its noise is amber: a line along each street, the nearest cars brighter), people on the pavements (footsteps: small rings), two
                   people with canes: one at the avenue's corner by the square, one crossing the bridge at x 70
   Everything moving is a pure function of t.
   ===================================================================== */
const BE_SF = {
  roadsX: [[-170, 12], [-70, 12], [70, 12], [160, 14], [260, 12]],          // streets along z (x, width)
  roadsZ: [[-130, 12], [-40, 16], [52, 12], [230, 12]],                      // streets along x (z, width)
  river: { z0: 120, z1: 150, y: -2.4, weirX: 52 },
  park: { x0: -162, x1: -78, z0: -30, z1: 114 },
  square: { x0: 36, x1: 62, z0: -30, z1: 32, fountain: [49, 0] },
  ext: { x0: -330, x1: 330, z0: -300, z1: 300 },
  // traffic: [road kind 'x' (along x) | 'z', the line, speed m/s, phase m]
  cars: [['x', -43.5, 11, 0], ['x', -36.5, -12, 140], ['x', -43.5, 10, 260], ['x', -36.5, -11, 420], ['x', -43.5, 12, 520], ['x', -36.5, -10, 600],
    ['x', 49.5, 9, 60], ['x', 54.5, -9, 330], ['x', 49.5, 10, 480], ['x', 54.5, -10, 610],
    ['z', 67.5, 9.5, 30], ['z', 72.5, -10, 250], ['z', 157, 11, 100], ['z', 163, -10, 380], ['z', -167.5, 9, 300], ['z', -172.5, -9, 40],
    ['z', -72.5, 10, 160], ['z', -67.5, -9, 470], ['z', 257.5, 10, 220], ['x', -127.5, 10, 200], ['x', -132.5, -10, 500], ['x', 232.5, -10, 80], ['x', 227.5, 9, 400]],
};

class BeSoundCity {
  constructor() { this.scene = new THREE.Scene(); this.scene.name = 'sfield'; this.root = new THREE.Group(); this.scene.add(this.root); }
  build() {
    const S = this.scene, R = this.root, C = BE_SF, r = new RNG(1301), E = C.ext;
    S.background = new THREE.Color('#05070c');
    const M = (col, name, o = {}) => gbMat(col, Object.assign({ rough: 0.85, name }, o));
    const pave = M('#5e5b56', 'beSfPavingStone'), road = M('#3a3b3e', 'beSfRoadAsphalt'), quay = M('#6a665e', 'beSfStoneQuayWall');
    const water = new THREE.MeshStandardMaterial({ color: '#1e2a33', roughness: 0.1, metalness: 0.2, name: 'beSfRiverWater' });
    const grass = M('#3e5a34', 'beSfGrassLawn'), leaf = M('#2f4a2a', 'beSfTreeLeaf'), trunk = M('#4a3a2c', 'beSfTreeTrunkWood');
    const plane = (m, x0, x1, z0, z1, y = 0) => gbAdd(R, new THREE.PlaneGeometry(x1 - x0, z1 - z0), m, (x0 + x1) / 2, y, (z0 + z1) / 2, { rx: -Math.PI / 2, cast: false });
    // the ground (cut by the river), the water, the quays
    plane(pave, E.x0, E.x1, E.z0, C.river.z0); plane(pave, E.x0, E.x1, C.river.z1, E.z1);
    plane(water, E.x0, E.x1, C.river.z0, C.river.z1, C.river.y);
    for (const z of [C.river.z0, C.river.z1]) beBox(R, E.x1 - E.x0, 2.6, 0.8, 0, -1.3, z, quay, { cast: false });
    beBox(R, 0.8, 0.9, C.river.z1 - C.river.z0, C.river.weirX, C.river.y - 0.2, (C.river.z0 + C.river.z1) / 2, quay, { cast: false });   // the weir
    // the streets (and bridges where they cross the river)
    const bridge = M('#77726a', 'beSfStoneBridge'), rail = M('#3a3e42', 'beSfBridgeRailMetal', { metal: 0.6, rough: 0.4 }); const posts = [];
    for (const [x, w] of C.roadsX) { plane(road, x - w / 2, x + w / 2, E.z0, E.z1, 0.03);
      beBox(R, w + 6, 0.8, C.river.z1 - C.river.z0 + 4, x, -0.4, (C.river.z0 + C.river.z1) / 2, bridge, { cast: false });
      for (const s of [-1, 1]) { const rx = x + s * (w / 2 + 3); beBox(R, 0.12, 0.1, C.river.z1 - C.river.z0 + 4, rx, 1.05, (C.river.z0 + C.river.z1) / 2, rail, { cast: false });
        for (let z = C.river.z0 - 2; z <= C.river.z1 + 2; z += 2) posts.push([rx, z]); } }
    { const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 1.05, 0.1), rail, posts.length), m4 = new THREE.Matrix4();
      posts.forEach(([px, pz], i) => im.setMatrixAt(i, m4.makeTranslation(px, 0.52, pz))); R.add(im); }   // the railings: posts and a top rail (open)
    for (const [z, w] of C.roadsZ) { const xs = z === 52 ? [-76, E.x1] : [E.x0, E.x1]; plane(road, xs[0], xs[1], z - w / 2, z + w / 2, 0.02); }
    // the park: lawns, paths, trees (instanced)
    const P = C.park; plane(grass, P.x0, P.x1, P.z0, P.z1, 0.04);
    { const T = []; for (let i = 0; i < 70; i++) { const x = r.range(P.x0 + 4, P.x1 - 4), z = r.range(P.z0 + 4, P.z1 - 4), h = r.range(6, 11), cr = r.range(3, 5); if (Math.abs(z - 40) > 4 && Math.abs(x + 120) > 3) T.push([x, z, h, cr]); }   // (off the paths)
      const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), leaf, T.length), trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25, 0.35, 1, 6), trunk, T.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
      this.trees = T.map(([x, z, h, cr], i) => { m4.compose(new THREE.Vector3(x, h, z), q, new THREE.Vector3(cr, cr * 0.85, cr)); crowns.setMatrixAt(i, m4);
        m4.compose(new THREE.Vector3(x, h / 2, z), q, new THREE.Vector3(1, h, 1)); trunks.setMatrixAt(i, m4); return new THREE.Vector3(x, h, z); });
      R.add(crowns, trunks); }
    // the square and its fountain
    const Q = C.square, stone = M('#8a857c', 'beSfStoneFountain');
    gbAdd(R, new THREE.CylinderGeometry(4.2, 4.4, 0.7, 24), stone, Q.fountain[0], 0.35, Q.fountain[1], { cast: false });
    gbAdd(R, new THREE.CylinderGeometry(0.5, 0.7, 2.2, 10), stone, Q.fountain[0], 1.1, Q.fountain[1], { cast: false });
    // the hall: roofless (its roof dissolved in the rise), the course inside, a door gap at the west end
    const A = BE_ARENA, brick = M('#7a5a4c', 'beSfHallBrickWall'), ply = M('#c8a878', 'beSfHallPartitionWood'), crate = M('#9a7650', 'beSfHallCrateWood');
    beBox(R, A.x1 - A.x0, A.H, 0.4, (A.x0 + A.x1) / 2, A.H / 2, A.z0 - 0.2, brick); beBox(R, A.x1 - A.x0, A.H, 0.4, (A.x0 + A.x1) / 2, A.H / 2, A.z1 + 0.2, brick);
    beBox(R, 0.4, A.H, A.z1 - A.z0, A.x1 + 0.2, A.H / 2, 0, brick);
    for (const s of [-1, 1]) beBox(R, 0.4, A.H, (A.z1 - A.z0) / 2 - 1.4, A.x0 - 0.2, A.H / 2, s * ((A.z1 - A.z0) / 4 + 0.7), brick);
    plane(M('#8a8a86', 'beSfHallFloorConcrete'), A.x0, A.x1, A.z0, A.z1, 0.05);
    const O = A.O; beBox(R, 0.06, O.h, O.z1 - O.z0, O.x, O.h / 2, 0, ply); beBox(R, A.A.x1 - A.A.x0, O.h, 0.06, (A.A.x0 + A.A.x1) / 2, O.h / 2, A.A.z, ply);
    beBox(R, 0.06, O.h, A.ret.z - A.A.z, A.back.x, O.h / 2, (A.ret.z + A.A.z) / 2, ply); beBox(R, A.back.x - O.x - 0.1, O.h, 0.06, (A.back.x + O.x + 0.1) / 2, O.h / 2, A.ret.z, ply);
    beBox(R, 3.0, 2.8, 2.2, 7.1, 1.4, 6.1, crate);
    // the blocks: perimeter buildings (instanced boxes by material)
    const mats = [M('#8a5a48', 'beSfBrickWall'), M('#9a968e', 'beSfConcreteWall'), new THREE.MeshStandardMaterial({ color: '#5a6a78', roughness: 0.15, metalness: 0.3, name: 'beSfGlassWindowTower' })];
    const boxes = mats.map(() => []);
    const xs = [E.x0].concat(...C.roadsX.map(([x, w]) => [x - w / 2 - 3, x + w / 2 + 3]), [E.x1]).sort((a, b) => a - b);
    const zs = [E.z0].concat(...C.roadsZ.map(([z, w]) => [z - w / 2 - 3, z + w / 2 + 3]), [C.river.z0 - 2, C.river.z1 + 2], [E.z1]).sort((a, b) => a - b);
    const keep = (x0, x1, z0, z1) => !(x1 > P.x0 - 1 && x0 < P.x1 + 1 && z1 > P.z0 - 1 && z0 < P.z1 + 1) && !(x1 > -40 && x0 < 64 && z1 > -32 && z0 < 46);
    for (let i = 0; i < xs.length - 1; i += 2) for (let j = 0; j < zs.length - 1; j += 2) {
      const x0 = xs[i], x1 = xs[i + 1], z0 = zs[j], z1 = zs[j + 1];
      if (x1 - x0 < 20 || z1 - z0 < 20 || (z0 >= C.river.z0 - 3 && z1 <= C.river.z1 + 3)) continue;
      const D = 14, edges = [[x0, z0, x1, z0, 0, 1], [x0, z1, x1, z1, 0, -1], [x0, z0 + D, x0, z1 - D, 1, 0], [x1, z0 + D, x1, z1 - D, -1, 0]];
      for (const [ax, az, bx, bz, nx, nz] of edges) {
        const len = Math.hypot(bx - ax, bz - az); let u = 0;
        while (u < len - 4) { const w = Math.min(r.range(12, 26), len - u), h = r.range(10, 34), cx = ax + (bx - ax) * (u + w / 2) / len, cz = az + (bz - az) * (u + w / 2) / len;
          const bxw = nx ? D : w, bzw = nx ? w : D, px = cx + nx * D / 2, pz = cz + nz * D / 2;
          if (keep(px - bxw / 2, px + bxw / 2, pz - bzw / 2, pz + bzw / 2)) boxes[h > 26 ? 2 : r.int(0, 1)].push([px, h, pz, bxw - 0.6, bzw - 0.6]);
          u += w; }
      }
    }
    this.buildings = [];
    mats.forEach((m, k) => { const L = boxes[k], im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), m, L.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
      L.forEach(([x, h, z, w, d], i) => { m4.compose(new THREE.Vector3(x, h / 2, z), q, new THREE.Vector3(w, h, d)); im.setMatrixAt(i, m4); this.buildings.push([x, h, z, w, d]); });
      im.castShadow = false; im.receiveShadow = false; R.add(im); });
    // parked cars and lamp posts along the avenue by the square (what the corner walker's click finds)
    const carM = M('#4a5058', 'beSfCarBodyMetal', { metal: 0.5, rough: 0.4 }), postM = M('#2e3236', 'beSfLampPostMetal', { metal: 0.6, rough: 0.4 });
    for (const x of [82, 88.5, 101, 118]) { beBox(R, 4.3, 0.8, 1.8, x, 0.6, -33.2, carM, { cast: false }); beBox(R, 2.3, 0.6, 1.6, x - 0.2, 1.3, -33.2, carM, { cast: false }); }
    for (const x of [80.5, 95, 110, 127]) gbAdd(R, new THREE.CylinderGeometry(0.1, 0.13, 6, 8), postM, x, 3, -31.5, { cast: false });
    beBox(R, 0.3, 0.16, 8, 76.15, 0.08, -27.9, quay, { cast: false }); beBox(R, 10, 0.16, 0.3, 81, 0.08, -31.85, quay, { cast: false });   // the kerb at the corner
    // the moving cars (bodies only: in this view a car is mostly its noise)
    this.cars = C.cars.map(() => { const g = new THREE.Group(); beBox(g, 4.3, 0.8, 1.8, 0, 0.6, 0, carM, { cast: false }); beBox(g, 2.3, 0.6, 1.6, -0.2, 1.3, 0, carM, { cast: false }); R.add(g); return g; });
    // light (the view is the sound view throughout; a little ambient so the people the camera meets have form)
    S.add(new THREE.HemisphereLight('#7a8aa8', '#2a2420', 1.3));   // (the world's own picture is at 0 in the sound view: this only gives the people form)
    beAcousticScene(R, 'world', { beSfRiverWater: { refl: 0.3, crisp: 0.95, group: 'water' }, beSfGrassLawn: { refl: 0.18, crisp: 0.05 }, beSfTreeLeaf: { refl: 0.22, crisp: 0.05 }, beSfGlassWindowTower: { refl: 0.92, crisp: 0.9 } });
    return this;
  }
  // the cars at t: position and heading
  carAt(i, t) {
    const [k, line, v, ph] = BE_SF.cars[i], E = BE_SF.ext, L0 = k === 'x' ? E.x0 : E.z0, span = (k === 'x' ? E.x1 - E.x0 : E.z1 - E.z0);
    const s = ((ph + v * t) % span + span) % span, u = v > 0 ? L0 + s : L0 + span - s;
    return k === 'x' ? { p: new THREE.Vector3(u, 0, line), yaw: v > 0 ? 0 : Math.PI } : { p: new THREE.Vector3(line, 0, u), yaw: v > 0 ? -Math.PI / 2 : Math.PI / 2 };
  }
  // the cars move; in the sound view the streets' traffic is a line of noise (amber, busier in drifting stretches),
  // the nearest cars, the fountain and the weir glow steadily on what faces them. The shot can reveal it outward
  // from the hall (shot.reveal(t) = radius in metres)
  update(t, L, cam, shot) {
    const CS = BE_AC.uBeCS.value, LS = BE_AC.uBeLS.value, on = 1.7 * (L && L.ac > 0.5 ? (shot && shot.csGain ? shot.csGain(t) : 1) : 0);   // ×1.7: about a stop brighter (review)
    this.cars.forEach((g, i) => { const c = this.carAt(i, t); g.position.copy(c.p); g.rotation.y = c.yaw; if (i < 20) CS[i].set(c.p.x, 0.9, c.p.z, 1.0 * on * (0.85 + 0.15 * Math.sin(t * 1.3 + i))); });
    const F = BE_SF.square.fountain, W = BE_SF.river; CS[20].set(F[0], 1.6, F[1], 0.9 * on);
    [124, 135, 146].forEach((z, k) => CS[21 + k].set(W.weirX + 1.2, W.y + 0.6, z, 1.1 * on));
    let n = 0;
    for (const [x] of BE_SF.roadsX) LS[n++].set(0, x, 0.5 * on, 0.25 + 0.05 * n);
    for (const [z] of BE_SF.roadsZ) LS[n++].set(1, z, (z === -40 ? 0.6 : 0.5) * on, -0.22 - 0.04 * n);
    BE_AC.uBeCSFall.value = 0.01; BE_AC.uBeLSFall.value = 0.026;
    if (shot && shot.reveal) { const rv = shot.reveal(t); BE_AC.uBeRev.value.set(13, 0, rv, Math.max(20, rv * 0.35)); }
  }
}
