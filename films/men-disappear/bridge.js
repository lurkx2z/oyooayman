/* =====================================================================
   BRIDGE — the double-track rail viaduct along the waterfront: concrete box-girder spans (60 m; the navigation
   span 120 m) on hammerhead piers, ballastless track, parapets and the overhead line on cantilever masts.
   Two spans and one pier can move: when the ship's bow hits the pier at z −60 (MD.hit) the pier breaks up, the
   span between z 0 and −60 tips, its far end comes down on the ship's forecastle and its near end slides off the
   pier at z 0 into the water — four metres in front of where the train stopped. The navigation span beyond sags
   onto the wreckage. Times and angles are precomputed (a rod pivoting under gravity) and sampled by time.
   ===================================================================== */

const MD_BR = {
  top: MD_G.rail - 0.45,            // deck slab top
  depth: 3.4,                        // slab + box girder
  x0: -7.4, x1: 3.2,                 // deck edges (our track on x 0, the other on x −4.4)
  gx0: -5.2, gx1: 1.0,               // the box girder's bottom flange
  piers: [],
  s1: [-0.6, -59.4],                 // the span that falls (z of its ends)
  s2: [-60.6, -179.4],               // the navigation span
};
MD_BR.bot = MD_BR.top - MD_BR.depth;
for (let z = 1200; z >= -60; z -= 60) MD_BR.piers.push(z);
for (let z = -180; z >= -900; z -= 60) MD_BR.piers.push(z);

// ---- the collapse, precomputed ----------------------------------------------------------------------------------------
const MD_FALL = (() => {
  const g = 9.81, L = MD_BR.s1[0] - MD_BR.s1[1], dt = 1 / 600;
  const t0 = MD.hit + 0.45;                            // the pier has gone; the far end starts to drop
  const land = 15.6;                                   // the forecastle top under the far end (bottom of the girder lands here)
  const th1 = Math.asin((MD_BR.bot - land) / L);       // the tilt when the far end lands
  // phase A: pivot on the near bearing
  let th = 0, w = 0, t = t0; const A = [[t0, 0]];
  while (th < th1) { w += 1.5 * g / L * Math.cos(th) * dt; th += w * dt; t += dt; A.push([t, Math.min(th, th1)]); }
  const tLand = t, t2 = tLand + 0.3;                 // then the near end slips off its bearing (phase B: MD_FALL_B)
  return { t0, tLand, t2, th1, A, land, L };
})();

// near end drop (phase B), as an angle φ of the span above horizontal, pivoting at the far contact: φ starts at
// −th1 (the near end is higher than the far end, so seen from the far end the span rises toward the near end at th1)
const MD_FALL_B = (() => {
  const g = 9.81, L = MD_FALL.L, dt = 1 / 600, out = [];
  let ph = MD_FALL.th1, w = 0, t = MD_FALL.t2, tWater = null;
  const yOf = (p) => MD_FALL.land + L * Math.sin(p);
  while (t < MD_FALL.t2 + 8) {
    const y = yOf(ph);
    if (y > -1.2) { w += 1.5 * g / L * Math.cos(ph) * dt; } else { w *= 0.9; }
    if (y < 0.5 && tWater === null) tWater = t;
    if (y < 0.5) w *= 0.985;                                       // the water brakes it hard
    ph -= w * dt; t += dt;
    if (yOf(ph) < -2.6) ph = Math.asin((-2.6 - MD_FALL.land) / L);
    out.push([t, ph]);
  }
  return { out, tWater, dt };
})();

// the falling span's pose at t: { far: [y], near: [y], phase }
function mdSpanPose(t) {
  const F = MD_FALL, L = F.L;
  if (t < F.t0) return { farY: MD_BR.bot, nearY: MD_BR.bot, slide: 0 };
  if (t < F.tLand) {
    const A = F.A, i = Math.min(A.length - 1, Math.max(0, Math.floor((t - F.t0) * 600))), th = A[i][1];
    return { farY: MD_BR.bot - L * Math.sin(th), nearY: MD_BR.bot, slide: 0 };
  }
  if (t < F.t2) return { farY: F.land, nearY: MD_BR.bot, slide: 0.6 * MathX.smooth(t, F.tLand, F.t2) };
  const B = MD_FALL_B.out, i = Math.min(B.length - 1, Math.floor((t - F.t2) * 600)), ph = B[Math.max(0, i)][1];
  return { farY: F.land, nearY: F.land + L * Math.sin(ph), slide: 0.6 + 2.6 * MathX.smooth(t, F.t2, F.t2 + 1.6) };
}

class MdBridge {
  constructor(scene, env) {
    this.scene = scene; this.env = env;
    const m = env.m;
    this.mat = {
      conc: new THREE.MeshStandardMaterial({ map: Tex.concrete(51, [150, 146, 136]), roughness: 0.9, name: 'bridge concrete' }),
      concD: new THREE.MeshStandardMaterial({ map: Tex.concrete(52, [112, 108, 100]), roughness: 0.92, name: 'bridge concrete dark' }),
      slab: Mat.std('#7a776f', { roughness: 0.95 }),
      rail: Mat.std('#8c8f92', { roughness: 0.35, metalness: 0.8 }),
      sleeper: Mat.std('#5e5b55', { roughness: 0.9 }),
      steel: Mat.std('#4b5258', { roughness: 0.5, metalness: 0.6 }),
      wire: Mat.std('#2a2e33', { roughness: 0.4, metalness: 0.7 }),
      insul: Mat.std('#7a4a3a', { roughness: 0.4 }),
      fender: Mat.std('#2f3236', { roughness: 0.7 }),
    };
    // static spans (everything except the two that move), piers (except the one that breaks)
    const B = new Batcher();
    const spans = [];
    for (let z = 1200; z > -60; z -= 60) spans.push([z - 0.6, z - 59.4]);
    for (let z = -180; z > -900; z -= 60) spans.push([z - 0.6, z - 59.4]);
    for (const [a, b] of spans) { if (a === MD_BR.s1[0]) continue; this._span(B, a, b, null); }
    for (const z of MD_BR.piers) if (z !== MD_G.pierHit) this._pier(B, z, z === -180);
    this.static = new THREE.Group(); this.static.name = 'viaduct'; scene.add(this.static);
    B.build(this.static, 'viaduct');
    // the moving spans: built about their near-end bottom centre (S1) / far-end bottom centre (S2)
    this.s1 = this._spanGroup(MD_BR.s1[0], MD_BR.s1[1], MD_BR.s1[0]);
    this.s2 = this._spanGroup(MD_BR.s2[0], MD_BR.s2[1], MD_BR.s2[1], true);
    // the pier that breaks: intact, and its pieces
    this._breakPier();
  }

  // one span between z a (near, larger) and b; geometry offset by -zo along z when building a group about zo
  _span(B, a, b, zo, nav = false) {
    const M = this.mat, R = MD_BR, off = zo === null ? 0 : -zo, za = a + off, zb = b + off;
    const z0 = Math.min(za, zb), z1 = Math.max(za, zb), len = z1 - z0, zc = (z0 + z1) / 2;
    const yT = zo === null ? R.top : R.top - R.bot, yB = zo === null ? R.bot : 0;
    // slab, cantilevered over the girder; the girder (slightly tapered)
    B.box(R.x1 - R.x0, 0.42, len, (R.x0 + R.x1) / 2, yT - 0.21, zc, M.conc);
    B.add(Geo.boxSides(R.gx0, R.gx1, yB, yT - 0.42, z0, z1, 6, 3), M.concD, null);
    B.add(Geo.flat(R.gx0, R.gx1, z0, z1, yB + 0.001, 6), M.concD, Geo.matrix(0, 0, 0, Math.PI, 0, 0).premultiply(new THREE.Matrix4().makeTranslation(0, 2 * yB + 0.002, 0)), { noShadow: true });
    // soffit haunches (sloped faces from the girder out to the slab edge)
    for (const [xe, xg] of [[R.x0, R.gx0], [R.x1, R.gx1]]) {
      const q = xe < xg ? Geo.quad([xe, yT - 0.42, z1], [xe, yT - 0.42, z0], [xg, yT - 1.2, z0], [xg, yT - 1.2, z1]) : Geo.quad([xe, yT - 0.42, z0], [xe, yT - 0.42, z1], [xg, yT - 1.2, z1], [xg, yT - 1.2, z0]);
      B.add(q, M.conc, null);
    }
    // parapets
    for (const xe of [R.x0 + 0.15, R.x1 - 0.15]) B.box(0.3, 1.15, len, xe, yT + 0.57, zc, M.conc);
    // track: slab track (concrete strips), rails, fastening blocks
    for (const xt of [0, -4.4]) {
      B.box(2.6, 0.25, len, xt, yT + 0.12, zc, M.slab, 0, { noShadow: true });
      for (const xr of [-0.7175, 0.7175]) B.box(0.07, 0.17, len, xt + xr, yT + 0.33, zc, M.rail, 0, { noShadow: true });
      for (let z = z0 + 0.3; z < z1; z += 0.65) B.box(2.3, 0.07, 0.24, xt, yT + 0.27, z, M.sleeper, 0, { noShadow: true });
    }
    // overhead line masts every 30 m (right edge for our track, left edge for the other), cantilevers and wires
    for (let z = z0 + 6; z < z1; z += 30) {
      for (const [xm, xt, s] of [[R.x1 - 0.6, 0, -1], [R.x0 + 0.6, -4.4, 1]]) {
        B.box(0.32, 7.6, 0.32, xm, yT + 3.8, z, M.steel);
        B.add(new THREE.CylinderGeometry(0.05, 0.05, Math.abs(xt - xm) + 0.4, 6), M.steel, Geo.matrix((xm + xt) / 2, yT + 6.2, z, 0, 0, Math.PI / 2));
        B.add(new THREE.CylinderGeometry(0.04, 0.04, Math.abs(xt - xm) + 0.4, 6), M.steel, Geo.matrix((xm + xt) / 2, yT + 7.1, z, 0, 0, Math.PI / 2 + s * 0.12));
        B.add(new THREE.CylinderGeometry(0.09, 0.09, 0.5, 8), M.insul, Geo.matrix(xm + s * 0.4, yT + 6.2, z, 0, 0, Math.PI / 2));
        B.box(0.05, 0.9, 0.05, xt, yT + 5.75, z, M.steel, 0, { noShadow: true });
      }
    }
    for (const xt of [0, -4.4]) {
      B.add(new THREE.CylinderGeometry(0.018, 0.018, len, 4), M.wire, Geo.matrix(xt, yT + 5.65, zc, Math.PI / 2), { noShadow: true });   // contact wire
      B.add(new THREE.CylinderGeometry(0.014, 0.014, len, 4), M.wire, Geo.matrix(xt, yT + 6.55, zc, Math.PI / 2), { noShadow: true });   // catenary
    }
    // a cable trough and walkway grating along the left parapet
    B.box(0.5, 0.35, len, R.x0 + 0.6, yT + 0.17, zc, M.slab, 0, { noShadow: true });
  }

  _spanGroup(a, b, pivotZ, nav = false) {
    const g = new THREE.Group(); g.name = 'span'; this.scene.add(g);
    const B = new Batcher(); this._span(B, a, b, pivotZ, nav); B.build(g, 'span');
    g.position.set(0, MD_BR.bot, pivotZ);
    return g;
  }

  // a hammerhead pier: footing at the waterline with a fender ring, a wall column, the cap under the girder
  _pier(B, z, tall = false) {
    const M = this.mat, R = MD_BR;
    const onLand = z > MD_G.shoreZ;
    const yb = onLand ? MD_G.quay : -1;
    if (!onLand) { B.box(9.0, 3.2, 6.2, -2.1, 0.6, z, M.concD); B.box(9.6, 0.5, 6.8, -2.1, 2.3, z, M.fender); }
    B.box(4.0, R.bot - 2.1 - yb, 2.8, -2.1, (R.bot - 2.1 + yb) / 2, z, M.conc);
    B.add(new THREE.BoxGeometry(10.4, 2.1, 3.6), M.conc, Geo.matrix(-2.1, R.bot - 1.05, z));
    for (const x of [-4.8, 0.6]) B.box(1.0, 0.25, 1.4, x, R.bot - 0.12, z, M.steel, 0, { noShadow: true });   // bearings
  }

  _breakPier() {
    const z = MD_G.pierHit, M = this.mat, R = MD_BR;
    this.pier = new THREE.Group(); this.pier.name = 'pier'; this.scene.add(this.pier);
    const B = new Batcher(); this._pier(B, z); B.build(this.pier, 'pier');
    // pieces: the column cut into blocks, the cap in two halves
    this.chunks = [];
    const rng = new RNG(616), colH = R.bot - 2.1 - (-1);
    const geoOf = (w, h, d) => { const g = new THREE.BoxGeometry(w, h, d, 1, 1, 1); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * (0.85 + 0.3 * hash1(i * 3.1 + w)), p.getY(i) * (0.9 + 0.2 * hash1(i * 7.7 + h)), p.getZ(i) * (0.85 + 0.3 * hash1(i * 5.3 + d))); g.computeVertexNormals(); return g; };
    const n = 7;
    for (let i = 0; i < n; i++) for (const side of [-1, 1]) {
      const h = colH / n, y = -1 + (i + 0.5) * h, mesh = new THREE.Mesh(geoOf(2.0, h * 0.98, 2.8), M.conc);
      mesh.castShadow = true; mesh.visible = false; this.scene.add(mesh);
      // the bow drives the column's middle toward −x; higher pieces fall later, lower ones are shoved hardest
      const hy = MathX.clamp(1 - Math.abs(y - 12) / 14, 0, 1);
      this.chunks.push({ mesh, p0: [-2.1 + side * 1.0, y, z], v: [-(1.2 + 4.5 * hy) * rng.range(0.7, 1.2), rng.range(0, 1.5), side * rng.range(0.3, 1.6) + rng.range(-0.5, 0.5)], w: [rng.range(-2, 2), rng.range(-1, 1), rng.range(-2, 2)], delay: 0.02 + (1 - hy) * 0.35 + rng.range(0, 0.15) });
    }
    for (const side of [-1, 1]) {
      const mesh = new THREE.Mesh(geoOf(5.2, 2.1, 3.6), M.conc); mesh.castShadow = true; mesh.visible = false; this.scene.add(mesh);
      this.chunks.push({ mesh, p0: [-2.1 + side * 2.6, R.bot - 1.05, z], v: [-1.0, 0, side * 1.4], w: [side * 0.6, 0, side * 1.2], delay: 0.45 });
    }
  }

  update(t) {
    const d = t - MD.hit, R = MD_BR;
    // the pier: whole until the stem reaches it, then pieces under gravity (they stop at the riverbed, out of sight)
    const broken = d > 0;
    this.pier.visible = !broken;
    for (const c of this.chunks) {
      c.mesh.visible = broken;
      if (!broken) continue;
      const u = Math.max(0, d - c.delay), push = Math.min(d, c.delay);
      const x = c.p0[0] + c.v[0] * u - 3.0 * push, y = Math.max(-12, c.p0[1] + c.v[1] * u - 0.5 * 9.81 * u * u), zz = c.p0[2] + c.v[2] * u;
      c.mesh.position.set(x, y, zz);
      c.mesh.rotation.set(c.w[0] * u, c.w[1] * u, c.w[2] * u);
      c.mesh.visible = y > -8;
    }
    // span 1: rotate about its near end (phase A), then about the far contact on the bow (phase B)
    const P = mdSpanPose(t), L = MD_FALL.L, s1 = this.s1;
    const adv = Math.max(0, mdShipAdv(t) - mdShipAdv(MD_FALL.tLand));     // after it lands, the bow drags the far end
    const farX = -Math.min(adv, 5.5) * Math.cos(MD_SHIP.head), farZ = R.s1[1] + 0.6 * MathX.smooth(t, MD_FALL.t2, MD_FALL.t2 + 1.6);
    const nearZ = R.s1[0] - P.slide, nearY = P.nearY;
    const dz = farZ - nearZ, dy = P.farY - nearY, dx = farX;
    const len = Math.hypot(dx, dy, dz) || 1;
    s1.position.set(0, nearY, nearZ);
    // the group's local −z runs from the near end to the far end: aim it along (dx, dy, dz)
    s1.rotation.set(Math.asin(MathX.clamp(dy / len, -1, 1)), Math.atan2(-dx, -dz), 0, 'YXZ');
    // span 2 (navigation span): its near end sags onto the wreckage
    const sag = MathX.smooth(t, MD_FALL.tLand - 0.1, MD_FALL.tLand + 1.1) * 7.2 + MathX.smooth(t, MD_FALL.t2, MD_FALL.t2 + 1.2) * 1.1;
    this.s2.rotation.x = Math.asin(sag / 118.8);
  }
}
