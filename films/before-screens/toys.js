/* =====================================================================
   TOYS — the things the children play with, all pure functions of time:
   wooden hoops rolled with a stick, a leather ball thrown back and forth,
   a skipping rope, plus dust kicked up by running feet.
   (Marbles, tops, jacks and the kite arrive in phases B and C.)
   ===================================================================== */

class ToySystem {
  constructor(scene, kids) {
    this.kids = kids;
    this.root = new THREE.Group(); this.root.name = 'toys'; scene.add(this.root);
    const wood = new THREE.MeshStandardMaterial({ color: '#8a6a44', roughness: 0.75, name: 'hoopWood' });
    // hoops: thin bentwood rings, one per hoop runner
    this.hoops = kids.people.filter((p) => p.spec.hoop).map((kid) => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.013, 6, 30), wood);
      m.castShadow = true; this.root.add(m);
      return { kid, m, r: 0.33 };
    });
    // the ball: a stitched leather ball
    this.ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.06, 2), new THREE.MeshStandardMaterial({ color: '#7a4a2e', roughness: 0.6, name: 'ball' }));
    this.ball.castShadow = true; this.root.add(this.ball);
    // the skipping rope swings round its handles (built once, rotated about the hands' axis)
    const ropeKid = kids.byId.rope;
    if (ropeKid) {
      const pts = [];
      for (let i = 0; i <= 16; i++) { const s = i / 16; pts.push(new THREE.Vector3(MathX.lerp(-0.33, 0.33, s), 0.8 * Math.sin(Math.PI * s), 0)); }
      const rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.007, 4, false), new THREE.MeshStandardMaterial({ color: '#c9b48a', roughness: 0.9, name: 'rope' }));
      rope.castShadow = true;
      this.ropePivot = new THREE.Group(); this.ropePivot.add(rope); this.root.add(this.ropePivot);
      this.ropeKid = ropeKid;
    }
    this.dust = new BillboardSystem(scene, 260, false);
    this.dust.uniforms.uLight.value = 0.9;
    this._v = new THREE.Vector3(); this._w = new THREE.Vector3();
  }

  update(t, visible = true) {
    this.root.visible = visible; this.dust.mesh.visible = visible;
    if (!visible) return;
    // ---- hoops roll ahead of their runner, to the right, spinning with the distance covered
    for (const h of this.hoops) {
      const k = h.kid, loc = k.locate(t), th = loc.dir;
      const fx = Math.sin(th), fz = Math.cos(th), rx = -Math.cos(th), rz = Math.sin(th);
      h.m.position.set(loc.x + fx * 0.7 + rx * 0.24, (k.spec.y || 0) + h.r + 0.01, loc.z + fz * 0.7 + rz * 0.24);
      h.m.rotation.set(0, th + Math.PI / 2, 0);
      h.m.rotateZ(-(loc.dist + 0.7) / h.r);
      h.m.rotateX(0.06 * Math.sin(t * 2.3 + k.seed * 9));     // a little wobble
    }
    // ---- the ball: in a hand, or in flight on a parabola between hands
    const T = SCRIPT.throws || [];
    let placed = false;
    for (let i = 0; i < T.length && !placed; i++) {
      const [t0, from, to, fl] = T[i];
      const A = this.kids.byId[from], B = this.kids.byId[to];
      if (t >= t0 && t <= t0 + fl) {
        const a = A.handWorld(-1, this._v).clone(), b = this.kids.byId[to].handWorld(-1, this._w).clone();
        const u = (t - t0) / fl, apex = Math.max(a.y, b.y) + 0.9;
        this.ball.position.set(MathX.lerp(a.x, b.x, u), MathX.lerp(a.y, b.y, u) + 4 * (apex - Math.max(a.y, b.y)) * u * (1 - u), MathX.lerp(a.z, b.z, u));
        placed = true;
      } else if (t < t0) {
        A.handWorld(-1, this._v); this.ball.position.copy(this._v); placed = true;
      }
    }
    if (!placed && T.length) { const last = T[T.length - 1]; this.kids.byId[last[2]].handWorld(-1, this._v); this.ball.position.copy(this._v); }
    this.ball.rotation.set(t * 7, t * 3, 0);
    // ---- skipping rope: rotates about the axis between the hands, under the feet at the top of each hop
    if (this.ropeKid) {
      const k = this.ropeKid, loc = k.locate(t), T0 = 0.52, ph = (t + k.seed) / T0;
      const f = ph - Math.floor(ph);
      this.ropePivot.position.set(loc.x, (k.spec.y || 0) + 0.8, loc.z);
      this.ropePivot.rotation.set(0, loc.dir, 0);
      this.ropePivot.rotateX(Math.PI * 2 * f);
    }
    // ---- dust: a soft puff at every footfall of the running kids (recomputed from the last second)
    const D = this.dust;
    D.begin(this.root.parent.fog);
    for (const k of this.kids.people) {
      const run = (k.states || []).some((s) => /run|reach|startle/i.test(s[1]));
      if (!run) continue;
      const stride = k.spec.stride || 1.32;
      let prevStep = null, prevDist = null;
      for (let j = 30; j >= 0; j--) {
        const tt = t - j / 30;
        if (tt < 0 || !k.shown(tt)) { prevStep = null; continue; }
        const L = k.locate(tt);
        const jump = prevDist !== null && L.dist - prevDist > 0.5; prevDist = L.dist;   // a cut between scenes is not a footstep
        if (!L.moving || jump) { prevStep = null; continue; }
        const step = Math.floor(L.dist / (stride / 2));
        if (prevStep !== null && step !== prevStep) {
          const age = t - tt, side = step % 2 ? 1 : -1;
          const ox = -Math.cos(L.dir) * 0.09 * side, oz = Math.sin(L.dir) * 0.09 * side;
          const h = hash2(step, Math.floor(k.seed * 1000));
          const grow = 1 - Math.exp(-age * 3);
          D.push(L.x + ox - Math.sin(L.dir) * 0.15 * grow, 0.04 + 0.12 * grow, L.z + oz - Math.cos(L.dir) * 0.15 * grow,
            0.14 + 0.4 * grow, h * 6, 0.09 * (1 - age) * (1 - age), 0.62, 0.86, 0.74, 0.58);
        }
        prevStep = step;
      }
    }
    D.end();
  }
}
