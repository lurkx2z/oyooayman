/* =====================================================================
   AIRCRAFT — a twin-engine airliner on final approach (gear down).
   Its engines flamed out at ~14 % O₂, so it glides in near silence:
   no exhaust, no contrail, no fire. Battery-powered navigation lights
   and strobes still blink. Flies a scripted spline (SCRIPT.aircraft)
   with a bank track, and disappears at the impact time.
   ===================================================================== */

class AircraftSystem {
  constructor(scene) {
    const A = SCRIPT.aircraft;
    this.t0 = A.path[0][0];
    this.t1 = A.path[A.path.length - 1][0];
    this.px = new SmoothTrack(A.path.map((k) => [k[0], k[1]]));
    this.py = new SmoothTrack(A.path.map((k) => [k[0], k[2]]));
    this.pz = new SmoothTrack(A.path.map((k) => [k[0], k[3]]));
    this.bank = new Track(A.bank, 'inOutSine');
    this.group = this._build();
    this.group.visible = false;
    scene.add(this.group);
    this._f = new THREE.Vector3(); this._u = new THREE.Vector3(); this._r = new THREE.Vector3(); this._m = new THREE.Matrix4();
  }

  position(t, out = new THREE.Vector3()) { return out.set(this.px.value(t), this.py.value(t), this.pz.value(t)); }

  // nose points to -Z in model space, +Y up, +X right wing
  _build() {
    const g = new THREE.Group();
    g.name = 'aircraft';
    const white = new THREE.MeshStandardMaterial({ color: '#e4e4e0', roughness: 0.45, metalness: 0.05, name: 'acBody' });
    const belly = new THREE.MeshStandardMaterial({ color: '#9aa0a8', roughness: 0.5, name: 'acBelly' });
    const wingM = new THREE.MeshStandardMaterial({ color: '#b5bac0', roughness: 0.45, metalness: 0.2, side: THREE.DoubleSide, name: 'acWing' });
    const tailM = new THREE.MeshStandardMaterial({ color: '#34465e', roughness: 0.5, side: THREE.DoubleSide, name: 'acTail' });
    const dark = new THREE.MeshStandardMaterial({ color: '#15181c', roughness: 0.3, name: 'acDark' });
    const metal = new THREE.MeshStandardMaterial({ color: '#7d838a', roughness: 0.35, metalness: 0.8, name: 'acMetal' });
    const add = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
    // fuselage: tail cone (z +18.5) → constant section → nose (z -18.5); smooth loft along +Y, turned so +Y → -Z
    const fus = smoothLoft([[0, 0.35, 0.45, 1.0], [5, 1.5, 1.7, 0.45], [9.5, 1.98, 2.05, 0.05], [29.5, 1.98, 2.05], [33.4, 1.72, 1.78, -0.12], [35.6, 1.08, 1.02, -0.38], [36.9, 0.34, 0.3, -0.56]], 16, 0.4, 0.2);
    fus.rotateX(-Math.PI / 2); fus.translate(0, 0, 18.5);
    add(fus, white);
    const bel = smoothLoft([[6, 1.4, 1.0, -1.1], [30, 1.4, 1.0, -1.1]], 12, 0.3, 0.3);
    bel.rotateX(-Math.PI / 2); bel.translate(0, 0, 18.5); bel.scale(1.0, 1.0, 1.0);
    add(bel, belly).scale.set(1.01, 0.96, 1);
    add(new THREE.BoxGeometry(4.02, 0.32, 21), dark, 0, 0.55, -1.5);                     // cabin window line
    add(new THREE.BoxGeometry(2.6, 0.45, 0.9), dark, 0, 0.62, -16.6).rotation.x = -0.35; // cockpit glazing
    // swept wing (one side) as a tapered slab
    const wing = (side) => {
      const sweep = 0.45, span = 16.8, rootC = 6.2, tipC = 1.6, dih = 0.09;
      const pts = [
        [0, 0, -rootC * 0.45], [0, 0, rootC * 0.55], [side * span, span * dih, sweep * span + tipC * 0.55 - rootC * 0.1], [side * span, span * dih, sweep * span - tipC * 0.45 - rootC * 0.1],
      ];
      const th = (i) => (i < 2 ? 0.34 : 0.12);
      const pos = [];
      const v = (i, up) => [pts[i][0], pts[i][1] + (up ? th(i) : -th(i)) * 0.5, pts[i][2]];
      const quad = (a, b, c, d) => pos.push(...a, ...b, ...c, ...a, ...c, ...d);
      const T = [0, 1, 2, 3].map((i) => v(i, true)), Bv = [0, 1, 2, 3].map((i) => v(i, false));
      if (side > 0) { quad(T[0], T[3], T[2], T[1]); quad(Bv[0], Bv[1], Bv[2], Bv[3]); quad(T[0], Bv[0], Bv[3], T[3]); quad(T[1], T[2], Bv[2], Bv[1]); quad(T[3], Bv[3], Bv[2], T[2]); }
      else { quad(T[0], T[1], T[2], T[3]); quad(Bv[0], Bv[3], Bv[2], Bv[1]); quad(T[0], T[3], Bv[3], Bv[0]); quad(T[1], Bv[1], Bv[2], T[2]); quad(T[3], T[2], Bv[2], Bv[3]); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals();
      const m = add(geo, wingM, side * 1.7, -1.05, 0.2);
      // winglet
      add(new THREE.BoxGeometry(0.12, 2.2, 1.3), wingM, side * (1.7 + span), -1.05 + span * dih + 1.0, 0.2 + sweep * span + 0.2).rotation.z = -side * 0.2;
      // engine on a pylon
      const ex = side * 5.9, ez = -2.6;
      const nac = smoothLoft([[0, 1.0, 1.0], [0.6, 1.08, 1.08], [3.4, 0.98, 0.98], [4.4, 0.62, 0.62]], 16, 0.05, 0.05);
      nac.rotateX(Math.PI / 2); nac.translate(ex, -2.3, ez);
      add(nac, white);
      const fan = add(new THREE.CircleGeometry(0.9, 18), dark, ex, -2.3, ez - 0.02); fan.rotation.y = Math.PI;
      add(new THREE.BoxGeometry(0.32, 1.0, 2.6), wingM, ex, -1.55, ez + 1.7);
      // navigation light at the tip: red left, green right
      const nav = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshBasicMaterial({ color: side > 0 ? '#3cff7a' : '#ff3b2e', toneMapped: false }));
      nav.position.set(side * (1.7 + span), -1.05 + span * dih, 0.2 + sweep * span); g.add(nav);
      return m;
    };
    wing(1); wing(-1);
    // tail: fin + stabilisers
    const fin = new THREE.BufferGeometry();
    {
      const p = [[0, 0, 13.5], [0, 0, 18.6], [0, 6.4, 19.4], [0, 6.4, 17.6]], t = 0.18, pos = [];
      const L = p.map((q) => [-t, q[1], q[2]]), R = p.map((q) => [t, q[1], q[2]]);
      const quad = (a, b, c, d) => pos.push(...a, ...b, ...c, ...a, ...c, ...d);
      quad(R[0], R[1], R[2], R[3]); quad(L[0], L[3], L[2], L[1]); quad(R[3], R[2], L[2], L[3]); quad(R[0], R[3], L[3], L[0]); quad(R[1], L[1], L[2], R[2]);
      fin.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); fin.computeVertexNormals();
    }
    add(fin, tailM, 0, 1.4, 0);
    for (const s of [-1, 1]) {
      const st = add(new THREE.BoxGeometry(6.0, 0.16, 2.4), wingM, s * 3.4, 0.9, 17.3);
      st.rotation.y = -s * 0.35;
    }
    // landing gear (down: final approach)
    for (const s of [-1, 1]) {
      add(new THREE.CylinderGeometry(0.12, 0.12, 2.2, 8), metal, s * 2.6, -2.6, 1.4);
      for (const dz of [-0.45, 0.45]) { const w = add(new THREE.CylinderGeometry(0.55, 0.55, 0.35, 14), dark, s * 2.6, -3.6, 1.4 + dz); w.rotation.z = Math.PI / 2; }
    }
    add(new THREE.CylinderGeometry(0.1, 0.1, 1.8, 8), metal, 0, -2.4, -13.5);
    { const w = add(new THREE.CylinderGeometry(0.38, 0.38, 0.3, 12), dark, 0, -3.25, -13.5); w.rotation.z = Math.PI / 2; }
    // strobes / beacon (blink in update)
    this.strobes = [];
    for (const [x, y, z, c] of [[16.8 + 1.7, 0.4, 7.8, '#ffffff'], [-16.8 - 1.7, 0.4, 7.8, '#ffffff'], [0, 2.1, 0, '#ff3b2e'], [0, -2.2, 2, '#ff3b2e']]) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), new THREE.MeshBasicMaterial({ color: c, toneMapped: false }));
      m.position.set(x, y, z); g.add(m); this.strobes.push(m);
    }
    g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; o.frustumCulled = false; } });
    return g;
  }

  update(t) {
    const g = this.group;
    g.visible = t >= this.t0 && t < this.t1 - 0.02;
    if (!g.visible) return;
    const p = this.position(t, g.position);
    const q = this.position(Math.min(t + 0.05, this.t1), this._f).sub(p).normalize();   // forward
    const bank = MathX.deg(this.bank.value(t));
    const right = this._r.crossVectors(q, this._u.set(0, 1, 0)).normalize();
    const up = this._u.crossVectors(right, q).normalize();
    // roll the up/right vectors around forward by the bank angle (right wing down for a right turn)
    const c = Math.cos(bank), s = Math.sin(bank);
    const r2 = right.clone().multiplyScalar(c).addScaledVector(up, -s);
    const u2 = up.clone().multiplyScalar(c).addScaledVector(right, s);
    // model: +X right, +Y up, -Z forward
    this._m.makeBasis(r2, u2, q.clone().negate());
    g.quaternion.setFromRotationMatrix(this._m);
    // strobes: double flash every 1.2 s; beacons slower
    const ph = (t * 1000) % 1200;
    const strobe = ph < 60 || (ph > 140 && ph < 200);
    this.strobes[0].visible = this.strobes[1].visible = strobe;
    this.strobes[2].visible = this.strobes[3].visible = ((t * 1000) % 1500) < 160;
  }
}
