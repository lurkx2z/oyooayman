/* =====================================================================
   HOLO — scene 3's visualisation beside the real cup: "same mass, double weight".
   A translucent blue twin of his cup floats beside the real one (on the table's free side). Under it a WEIGHT arrow
   (force = m·g, drawn to scale: 1× length at 1 g) that grows to 2× as the narrator says "twice as hard"; above it a
   small MASS bar that never changes. The HUD labels (film.js) sit next to these. His phone's screen glows on "your
   phone", and the body label appears on the cut to him. A visual explanation, not a thing in the room.
   ===================================================================== */

class GbHolo {
  constructor(scene, cupFactory) {
    this.root = new THREE.Group(); this.root.name = 'gbHolo'; scene.add(this.root);
    const [tx, tz] = GB_SET.heroTable;
    this.base = new THREE.Vector3(tx + 0.1, GB_SET.tableH + 0.23, tz + 0.24);
    this.root.position.copy(this.base); this.root.scale.setScalar(1.45);
    const mk = (c, o = 0.5) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, fog: false });
    this.cupM = mk('#7fc4ff', 0.45);
    this.cup = cupFactory(this.cupM); this.cup.userData.surf.visible = false;
    this.cup.traverse((m) => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; m.renderOrder = 6; } });
    this.cup.rotation.y = -0.3; this.root.add(this.cup);
    // a wire shell (edges) so it reads as a projection, not glass
    this.wireM = new THREE.LineBasicMaterial({ color: '#bfe4ff', transparent: true, opacity: 0.5, depthWrite: false, fog: false });
    this.cup.children.slice(0, 2).forEach((m) => { const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 25), this.wireM); e.position.copy(m.position); e.rotation.copy(m.rotation); e.scale.copy(m.scale); e.renderOrder = 7; this.cup.add(e); });
    // scan rings rising through it
    this.ringM = mk('#9fd6ff', 0.0);
    this.rings = [0, 1, 2].map(() => { const r = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.053, 40), this.ringM); r.rotation.x = -Math.PI / 2; r.renderOrder = 7; this.root.add(r); return r; });
    // the projector disc on the table under it
    this.discM = mk('#7fc4ff', 0.0);
    this.disc = new THREE.Mesh(new THREE.RingGeometry(0.04, 0.07, 40), this.discM); this.disc.rotation.x = -Math.PI / 2; this.disc.position.y = -0.155; this.root.add(this.disc);
    this.beamM = mk('#7fc4ff', 0.0);
    this.beam = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.15, 32, 1, true), this.beamM); this.beam.position.y = -0.08; this.root.add(this.beam);
    // the weight arrow (amber): a shaft + head, pointing down from the cup's base; the 1 g ghost arrow stays as a reference
    this.arrowM = mk('#ffb46b', 0.85);
    this.arrow = new THREE.Group(); this.arrow.position.set(0.11, 0.0, 0); this.root.add(this.arrow);
    this.shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 1, 10), this.arrowM); this.arrow.add(this.shaft);
    this.head = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.034, 14), this.arrowM); this.head.rotation.x = Math.PI; this.arrow.add(this.head);
    this.refM = new THREE.LineDashedMaterial({ color: '#ffe2c0', dashSize: 0.008, gapSize: 0.006, transparent: true, opacity: 0, depthWrite: false, fog: false });
    const rg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.03, 0, 0), new THREE.Vector3(0.03, 0, 0)]);
    this.ref = new THREE.Line(rg, this.refM); this.ref.computeLineDistances(); this.arrow.add(this.ref);
    // the mass bar (pale, above the cup): never changes
    this.massM = mk('#d8f0ff', 0.0);
    this.mass = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.008, 0.008), this.massM); this.mass.position.set(0, 0.12, 0); this.root.add(this.mass);
    this.L1 = 0.065;  // (×1.45 group scale: 9 cm on screen-scale at 1 g, 19 cm at 2 g, still above the table)                  // the arrow's length at 1 g (it never grows past 2×: still on the table)
    this.root.visible = false;
  }

  // a: overall visibility; w: the weight arrow scale (1 → 2); returns anchor points for the HUD labels (world)
  update(t, show) {
    const a = show ? MathX.window(t, GB.holo - 0.3, GB.exp - 0.25, 0.6, 0.35) : 0;
    this.root.visible = a > 0.005;
    if (!this.root.visible) return null;
    const flick = 0.92 + 0.08 * Math.sin(t * 31) * Math.sin(t * 7.3);
    this.cupM.opacity = 0.5 * a * flick; this.wireM.opacity = 0.85 * a * flick;
    this.discM.opacity = 0.5 * a; this.beamM.opacity = 0.07 * a;
    this.cup.position.y = 0.006 * Math.sin(t * 1.7);
    this.cup.rotation.y = -0.3 + 0.25 * Math.sin(t * 0.35);
    this.rings.forEach((r, i) => { const ph = (t * 0.45 + i / 3) % 1; r.position.y = -0.01 + ph * 0.11; this.ringM.opacity = 0.35 * a; r.scale.setScalar(0.9 + 0.1 * Math.sin(ph * Math.PI)); });
    // the weight: drawn at 2× once the doubling has happened… but the scene opens on the 1 g reference, then the arrow
    // grows on "But gravity pulls on it… twice as hard" (the change already happened; this is the explanation)
    const w = 1 + Ease.inOutCubic(MathX.ramp(t, GB.twice[0] - 0.4, GB.twice[1] + 0.2));
    const aw = a * MathX.smooth(t, GB.pull - 0.2, GB.pull + 0.4);
    const len = this.L1 * w;
    this.arrowM.opacity = 0.9 * aw;
    this.shaft.scale.y = len - 0.03; this.shaft.position.y = -(len - 0.03) / 2;
    this.head.position.y = -len + 0.015;
    this.ref.position.y = -this.L1; this.refM.opacity = 0.8 * aw * MathX.smooth(t, GB.twice[0], GB.twice[0] + 0.4);
    this.massM.opacity = 0.75 * a * MathX.smooth(t, GB.mass - 0.2, GB.mass + 0.3);
    this.root.updateMatrixWorld(true);
    return {
      a, aw, w,
      massP: this.mass.getWorldPosition(new THREE.Vector3()),
      arrowP: this.arrow.localToWorld(new THREE.Vector3(0, -len * 0.5, 0)),
      refP: this.arrow.localToWorld(new THREE.Vector3(0, -this.L1, 0)),
    };
  }
}
