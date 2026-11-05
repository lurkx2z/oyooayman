/* =====================================================================
   VIADUCT — the motorway across the valley: one long deck (its top face the road, its markings painted into the road's
   map, so nothing is laid on top of it), the box girder under it, the piers, the concrete barrier down the middle,
   the parapets and their steel rails, an overhead sign gantry; beyond the ends the road runs on in cuttings.
     mgBuildViaduct(S) → V
   No coplanar faces: everything that stands on the deck goes 2 cm into it; the road's map carries every line; the
   road itself is drawn with a polygon offset over the cutting floor 1.2 m below it.
   ===================================================================== */

const MG_ROAD_TILE = 30;                                  // the road map repeats every 30 m (two dashes)
function mgRoadCanvas() {
  const W = 2048, H = 1024, r = new RNG(42);
  return mgCanvas(W, H, (g) => {
    const zToY = (z) => (z + MG_V.deckW) / (2 * MG_V.deckW) * H, sx = W / MG_ROAD_TILE;
    g.fillStyle = '#4b4c4f'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 26000; i++) { const v = r.range(-1, 1); g.fillStyle = v > 0 ? `rgba(255,255,255,${0.05 * v})` : `rgba(0,0,0,${-0.09 * v})`; g.fillRect(r.range(0, W), r.range(0, H), r.range(1, 3), r.range(1, 3)); }
    // wheel tracks (darker), the hard shoulders (paler, rougher), the central reservation's strip
    for (const sd of [-1, 1]) {
      for (const lz of MG_V.lanes) for (const o of [-0.85, 0.85]) { g.fillStyle = 'rgba(20,20,22,0.18)'; g.fillRect(0, zToY(sd * (lz + o)) - 9, W, 18); }
      const a = zToY(sd * 11.65), b = zToY(sd * 16.1); g.fillStyle = 'rgba(120,118,110,0.22)'; g.fillRect(0, Math.min(a, b), W, Math.abs(b - a));
    }
    g.fillStyle = 'rgba(110,108,100,0.3)'; g.fillRect(0, zToY(-0.95), W, zToY(0.95) - zToY(-0.95));
    // the lines: solid edges by the barrier and the hard shoulder, dashed lanes (6 m dash, 9 m gap), the outer edge
    const line = (z, w, dash) => { const y = zToY(z), hh = Math.max(3, w / (2 * MG_V.deckW) * H); g.fillStyle = '#e8e6de';
      if (!dash) g.fillRect(0, y - hh / 2, W, hh); else for (let x = 0; x < MG_ROAD_TILE; x += 15) g.fillRect(x * sx, y - hh / 2, 6 * sx, hh); };
    for (const sd of [-1, 1]) { line(sd * 1.05, 0.2, false); line(sd * 4.15, 0.15, true); line(sd * 7.85, 0.15, true); line(sd * 11.6, 0.25, false); }
    // wear on the paint
    for (let i = 0; i < 9000; i++) { g.fillStyle = 'rgba(75,76,79,0.55)'; g.fillRect(r.range(0, W), r.range(0, H), r.range(1, 4), r.range(1, 3)); }
  });
}
// a jersey barrier's cross-section (z, y), 0.6 wide at the foot, 0.9 high
function mgJerseyShape(h = 0.9) { const s = new THREE.Shape(); s.moveTo(-0.3, -0.02); s.lineTo(0.3, -0.02); s.lineTo(0.27, 0.08); s.lineTo(0.12, 0.32); s.lineTo(0.09, h); s.lineTo(-0.09, h); s.lineTo(-0.12, 0.32); s.lineTo(-0.27, 0.08); s.closePath(); return s; }
// extrude a cross-section shape (drawn in z, y) along x from x0 to x1
function mgAlongX(shape, x0, x1) { const g = new THREE.ExtrudeGeometry(shape, { depth: x1 - x0, bevelEnabled: false }); g.rotateY(Math.PI / 2); g.translate(x0, 0, 0); g.computeVertexNormals(); return g; }

function mgBuildViaduct(S) {
  const Y = MG_V.deckY, X0 = MG_V.vx[0], X1 = MG_V.vx[1], E0 = X0 - 2600, E1 = X1 + 2600, W = MG_V.deckW;
  const conc = mgStd('#b9b5ab', 0.85), concD = mgStd('#9e9a91', 0.9), steel = mgStd('#9aa2a8', 0.45, 0.6), B = mgBatch();
  // ---- the road: a long slab whose top face is the road (polygon offset over the cutting floor)
  const rt = mgTex(mgRoadCanvas(), { aniso: 8 }); rt.repeat.set((E1 - E0) / MG_ROAD_TILE, 1);
  const roadM = new THREE.MeshStandardMaterial({ map: rt, roughness: 0.82, metalness: 0, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(E1 - E0, 2.2, 2 * W), [conc, conc, roadM, concD, conc, conc]);
  slab.position.set((E0 + E1) / 2, Y - 1.1, 0); slab.receiveShadow = true; slab.castShadow = true; S.scene.add(slab);
  // ---- the box girder under the viaduct (a trapezoid), the cantilevers' edge beams
  { const s = new THREE.Shape(); s.moveTo(-8.5, -0.02); s.lineTo(8.5, -0.02); s.lineTo(6.2, -3.1); s.lineTo(-6.2, -3.1); s.closePath();
    const g = mgAlongX(s, X0 - 2, X1 + 2); g.translate(0, Y - 2.15, 0); B.add(g, concD); }
  // ---- the piers: twin columns, a cap; standing on the ground (or in the river)
  const piers = [];
  for (let x = X0 + 40; x < X1 - 20; x += MG_V.pierEvery) {
    const gy = Math.min(mgGroundY(x, -6), mgGroundY(x, 6)) - 2, top = Y - 5.2, h = top - gy;
    if (h < 4) continue;
    for (const sd of [-1, 1]) B.add(new THREE.CylinderGeometry(1.15, 1.45, h, 16).translate(x, gy + h / 2, sd * 4.6), concD);
    B.box(3.4, 1.4, 15.0, conc, x, top - 0.1, 0); piers.push(x);
  }
  // ---- the central barrier (concrete, jersey profile) and the parapets (a concrete upstand with a steel rail on posts)
  B.add(mgAlongX(mgJerseyShape(0.9), E0, E1).translate(0, Y, 0), conc);
  for (const sd of [-1, 1]) {
    B.box(E1 - E0, 0.62, 0.42, conc, (E0 + E1) / 2, Y + 0.29, sd * (W - 0.21));
    for (const yy of [0.98, 1.22]) B.box(E1 - E0, 0.1, 0.07, steel, (E0 + E1) / 2, Y + yy, sd * (W - 0.18));
  }
  { const n = Math.floor((E1 - E0) / 2.5) * 2, post = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 0.72, 0.1), steel, n), o = new THREE.Object3D(); let i = 0;
    for (let x = E0; x < E1 && i < n; x += 2.5) for (const sd of [-1, 1]) { o.position.set(x, Y + 0.92, sd * (W - 0.2)); o.updateMatrix(); post.setMatrixAt(i++, o.matrix); }
    post.count = i; post.castShadow = true; S.scene.add(post); }
  // ---- the sign gantry over the eastbound lanes (x 330): two legs, a truss, two blue signs
  const G = { x: 330 };
  { const gm = mgStd('#8f979c', 0.5, 0.55);
    for (const z of [0.6, W - 0.2]) B.box(0.45, 7.2, 0.45, gm, G.x, Y + 3.6, z);
    B.box(0.6, 0.6, W - 0.6, gm, G.x, Y + 7.0, W / 2 + 0.2); B.box(0.6, 0.35, W - 0.6, gm, G.x, Y + 6.2, W / 2 + 0.2);
    const sign = (txt, sub, w) => mgTex(mgCanvas(512, 256, (g) => { g.fillStyle = '#1d4f9c'; mgRR(g, 4, 4, 504, 248, 18); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 6; mgRR(g, 14, 14, 484, 228, 12); g.stroke();
      g.fillStyle = '#fff'; g.font = '700 70px sans-serif'; g.textAlign = 'center'; g.fillText(txt, 256, 112); g.font = '600 52px sans-serif'; g.fillText(sub, 256, 196); void w; }), { repeat: false });
    const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.4, 6.6), [gm, mgStd('#1d4f9c', 0.5), gm, gm, gm, gm]); s1.position.set(G.x - 0.38, Y + 6.3, 4.2);
    const f1 = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 3.4), new THREE.MeshStandardMaterial({ map: sign('✈ AIRPORT', 'EXIT 2 km'), roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 })); f1.position.set(G.x - 0.5, Y + 6.3, 4.2); f1.rotation.y = -Math.PI / 2;
    const s2 = s1.clone(); s2.position.z = 11.0; const f2 = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 3.4), new THREE.MeshStandardMaterial({ map: sign('A7 EAST', 'Varenne 34'), roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 })); f2.position.set(G.x - 0.5, Y + 6.3, 11.0); f2.rotation.y = -Math.PI / 2;
    S.scene.add(s1, f1, s2, f2); }
  B.build(S.scene);
  return { slab, piers, G };
}
