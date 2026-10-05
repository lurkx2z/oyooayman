/* =====================================================================
   POCKET GAMES — marbles, a spinning top, jacks.
   Marbles: glass cat's-eyes in a ring scratched in the dirt. A small
   deterministic 2-D simulation (rolling friction, uneven-ground drift,
   elastic glass-on-glass collisions) is run once at load and sampled at t,
   so every playback is identical and scrubbing works.
   Top: painted turned wood with a steel tip; it lands, spins, precesses
   wider as it slows, drifts, and topples. Jacks: metal six-points and a
   small rubber ball.
   ===================================================================== */

const POCKET = {
  ring: { x: -3.55, z: -9.25, r: 0.46 },
  shots: [{ t: 17.35, who: 'pov', ang: 0, speed: 1.3 }, { t: 19.35, who: 'friend', ang: 166, speed: 1.1 }],
  top: { tHold: 20.35, tThrow: 21.35, tLand: 21.6, tFall: 23.85, land: [-6.3, -12.12] },
  jacks: { girl: 'tag2', t0: 24.35, t1: 26.35, at: [-6.22, -14.38] },
};

class MarbleGame {
  constructor(scene) {
    this.root = new THREE.Group(); this.root.name = 'marbles'; scene.add(this.root);
    const C = POCKET.ring;
    // the ring: a line scratched in the packed dirt
    const ringM = new THREE.MeshBasicMaterial({ color: '#3e2f20', transparent: true, opacity: 0.55, depthWrite: false, name: 'ringLine' });
    const ring = new THREE.Mesh(new THREE.RingGeometry(C.r - 0.008, C.r + 0.008, 64), ringM);
    ring.rotation.x = -Math.PI / 2; ring.position.set(C.x, 0.004, C.z); this.root.add(ring);
    // marbles: clear glass shells with coloured cat's-eye vanes inside
    const vane = (col) => {
      const g = new THREE.Group();
      for (let k = 0; k < 3; k++) {
        const pg = new THREE.PlaneGeometry(1.5, 1.7, 4, 4), pp = pg.attributes.position;
        for (let i = 0; i < pp.count; i++) { const y = pp.getY(i), x = pp.getX(i); pp.setX(i, x * (1 - Math.abs(y) * 0.5)); pp.setZ(i, Math.sin(y * 2.2) * 0.25 * x); }
        pg.computeVertexNormals();
        const m = new THREE.Mesh(pg, new THREE.MeshStandardMaterial({ color: col, roughness: 0.4, side: THREE.DoubleSide, emissive: col, emissiveIntensity: 0.4 }));
        m.rotation.y = (k / 3) * Math.PI; g.add(m);
      }
      return g;
    };
    const glassTints = ['#d8eee8', '#e8f0ff', '#f0f4e0', '#e0f0f4', '#f4ece0'];
    const vanes = ['#c0392b', '#2e6fb5', '#e0a020', '#2e8a4a', '#d0602a', '#7a3ab0', '#1f8a8a', '#c0392b', '#e0a020'];
    this.sim = this._simulate();
    this.meshes = this.sim.M.map((m, i) => {
      const g = new THREE.Group();
      const tint = new THREE.Color(vanes[i % vanes.length]).lerp(new THREE.Color(glassTints[i % glassTints.length]), 0.6);
      const shell = new THREE.Mesh(new THREE.SphereGeometry(m.r, 20, 14), new THREE.MeshPhysicalMaterial({
        color: tint, transparent: true, opacity: 0.5, roughness: 0.02, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.2, name: 'marbleGlass' }));
      shell.castShadow = true;
      const v = vane(vanes[i % vanes.length]); v.scale.setScalar(m.r * 0.62);
      g.add(v, shell);
      this.root.add(g);
      return g;
    });
    this.blob = new BlobShadows(scene, this.meshes.length);
  }

  _simulate() {
    const C = POCKET.ring, R = 0.016, RT = 0.02;
    const T = [[0, 0], [0.07, 0.06], [-0.06, 0.08], [0.08, -0.07], [-0.09, -0.05], [0.0, -0.12], [0.16, 0.014]];
    const M = T.map(([x, z]) => ({ x, z, vx: 0, vz: 0, r: R, m: 1 }));
    M.push({ x: 0.52, z: 0.0, vx: 0, vz: 0, r: RT, m: 1.9 });     // your shooter ("taw"), knuckled down on the ring line
    M.push({ x: -0.56, z: 0.02, vx: 0, vz: 0, r: RT, m: 1.9 });  // your friend's
    for (const m of M) m.q = new THREE.Quaternion().setFromEuler(new THREE.Euler(m.x * 40, m.z * 33, 0.3));
    const shots = POCKET.shots.map((s) => {
      const a = MathX.deg(s.ang), dir = s.who === 'pov' ? -1 : 1;
      return { t: s.t, i: s.who === 'pov' ? 7 : 8, vx: dir * Math.cos(a) * s.speed * (s.who === 'pov' ? 1 : -1), vz: Math.sin(a) * s.speed };
    });
    const dt = 1 / 600, fr = 0.75, out = [], hits = [];
    const t0 = 15.0, t1 = 21.0;
    const ax = new THREE.Vector3(), dq = new THREE.Quaternion();
    let si = 0, k = 0;
    for (let t = t0; t <= t1 + 1e-9; t += dt, k++) {
      while (si < shots.length && shots[si].t <= t) { const s = shots[si++]; M[s.i].vx = s.vx; M[s.i].vz = s.vz; }
      for (const m of M) {
        const sp = Math.hypot(m.vx, m.vz);
        if (sp < 1e-4) { m.vx = m.vz = 0; continue; }
        const ns = Math.max(0, sp - fr * dt);
        const px = -m.vz / sp, pz = m.vx / sp, w = 0.05 * Math.sin((m.roll || 0) * 0.8 + m.x * 30) * (1 - Math.min(1, sp / 1.2));
        m.vx = (m.vx / sp) * ns + px * w * dt; m.vz = (m.vz / sp) * ns + pz * w * dt;
        m.x += m.vx * dt; m.z += m.vz * dt; m.roll = (m.roll || 0) + ns * dt / m.r;
        ax.set(m.vz, 0, -m.vx).normalize(); dq.setFromAxisAngle(ax, ns * dt / m.r); m.q.premultiply(dq);
      }
      for (let i = 0; i < M.length; i++) for (let j = i + 1; j < M.length; j++) {
        const A = M[i], B = M[j], dx = B.x - A.x, dz = B.z - A.z, d = Math.hypot(dx, dz), rr = A.r + B.r;
        if (d >= rr || d < 1e-9) continue;
        const nx = dx / d, nz = dz / d, rv = (A.vx - B.vx) * nx + (A.vz - B.vz) * nz;
        if (rv <= 0) continue;
        const J = 1.9 * rv / (1 / A.m + 1 / B.m);
        A.vx -= J / A.m * nx; A.vz -= J / A.m * nz; B.vx += J / B.m * nx; B.vz += J / B.m * nz;
        const ov = rr - d; A.x -= nx * ov / 2; A.z -= nz * ov / 2; B.x += nx * ov / 2; B.z += nz * ov / 2;
        hits.push({ t, i, j, v: rv, x: C.x + (A.x + B.x) / 2, z: C.z + (A.z + B.z) / 2 });
      }
      if (k % 5 === 0) out.push(M.map((m) => ({ x: m.x, z: m.z, q: m.q.clone(), v: Math.hypot(m.vx, m.vz) })));
    }
    return { M, out, hits, t0, step: 5 * dt };
  }

  // the simulation's samples are also what the soundtrack uses (clicks and rolling)
  stateAt(t) {
    const S = this.sim, f = MathX.clamp((t - S.t0) / S.step, 0, S.out.length - 1.001), i = Math.floor(f);
    return { a: S.out[i], b: S.out[i + 1], w: f - i };
  }

  update(t, visible) {
    this.root.visible = visible; this.blob.mesh.visible = visible;
    if (!visible) return;
    const C = POCKET.ring, { a, b, w } = this.stateAt(t);
    this.blob.begin();
    this.meshes.forEach((g, i) => {
      const r = this.sim.M[i].r, x = C.x + MathX.lerp(a[i].x, b[i].x, w), z = C.z + MathX.lerp(a[i].z, b[i].z, w);
      g.position.set(x, r + 0.002, z);
      g.quaternion.slerpQuaternions(a[i].q, b[i].q, w);
      this.blob.push(x + 0.004, 0.003, z + 0.004, r * 3.2, 0.5);
    });
    this.blob.end();
  }
}

class SpinningTop {
  constructor(scene, hands, pov) {
    this.pov = pov;
    const prof = [[0, 0], [0.004, 0.003], [0.012, 0.012], [0.028, 0.026], [0.036, 0.038], [0.035, 0.046], [0.027, 0.054], [0.012, 0.06], [0.007, 0.062], [0.006, 0.08], [0.0045, 0.086], [0, 0.087]];
    const g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 24);
    const cv = Tex.canvas(64, 256), c = cv.getContext('2d');
    const bands = [['#b8865a', 0], ['#a83a2a', 0.18], ['#e8dcc0', 0.3], ['#2e4f8a', 0.38], ['#e8dcc0', 0.47], ['#c9a03a', 0.52], ['#b8865a', 0.62]];
    bands.forEach(([col, v], i) => { c.fillStyle = col; c.fillRect(0, (1 - (bands[i + 1] ? bands[i + 1][1] : 1)) * 256, 64, ((bands[i + 1] ? bands[i + 1][1] : 1) - v) * 256); });
    c.fillStyle = 'rgba(40,20,10,0.8)'; c.fillRect(28, 60, 8, 90);    // one painted stripe shows the spin
    const mat = new THREE.MeshStandardMaterial({ map: Tex.tex(cv, { repeat: false }), roughness: 0.45, name: 'topWood' });
    this.body = new THREE.Group();
    const m = new THREE.Mesh(g, mat); m.castShadow = true; this.body.add(m);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.004, 0.008, 8), new THREE.MeshStandardMaterial({ color: '#8a8e92', metalness: 0.9, roughness: 0.3 }));
    tip.rotation.x = Math.PI; tip.position.y = 0.002; this.body.add(tip);
    // string wound round the body while it is held
    const hel = [];
    for (let i = 0; i <= 90; i++) { const a = i * 0.42, y = 0.014 + i * 0.00042; hel.push(new THREE.Vector3(Math.cos(a) * (0.012 + y * 0.75), y, Math.sin(a) * (0.012 + y * 0.75))); }
    this.string = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hel), 180, 0.0012, 3), new THREE.MeshStandardMaterial({ color: '#d8ccb0', roughness: 0.9 }));
    this.body.add(this.string);
    this.world = new THREE.Group(); this.world.add(this.body); scene.add(this.world);
    // held in the right hand: point up, string wound
    this.held = new THREE.Group(); hands.right.g.add(this.held);
    this.held.position.set(0.01, 0.07, 0.035); this.held.scale.setScalar(1 / hands.o.scale);
    this.hands = hands;
    this.blob = new BlobShadows(scene, 1);
    this._v = new THREE.Vector3(); this._q = new THREE.Quaternion();
  }

  update(t, visible) {
    const T = POCKET.top;
    if (!visible || t < T.tHold || t > T.tFall + 0.9) { this.world.visible = false; this.blob.mesh.visible = false; this.held.visible = false; return; }
    this.blob.mesh.visible = true;
    const holding = t < T.tThrow;
    // in the hand until the throw
    if (holding) {
      if (this.body.parent !== this.held) this.held.add(this.body);
      this.held.visible = true; this.world.visible = false; this.string.visible = true;
      this.body.position.set(0, 0, 0); this.body.rotation.set(Math.PI, 0, 0);
      this.blob.begin(); this.blob.end();
      return;
    }
    if (this.body.parent !== this.world) this.world.add(this.body);
    this.held.visible = false; this.world.visible = true; this.string.visible = false;
    const L = T.land;
    let x = L[0], y = 0.121, z = L[1], tilt = 0, prec = 0, spin = 0;
    if (t < T.tLand) {
      // the throw: from your hand, flipping point-down, to the planks
      const hp = this.pov.handWorld(T.tThrow, 'topThrow', 1, this._v), u = (t - T.tThrow) / (T.tLand - T.tThrow);
      x = MathX.lerp(hp.x, L[0], u); z = MathX.lerp(hp.z, L[1], u); y = MathX.lerp(hp.y, 0.121, u) + 0.12 * Math.sin(Math.PI * u);
      this.body.rotation.set(Math.PI * (1 - u), 0, 0);
      this.body.position.set(0, 0, 0);
      this.world.position.set(x, y, z);
      spin = u * 6;
      this.body.rotateY(spin);
    } else {
      const s = t - T.tLand, D = T.tFall - T.tLand, k = MathX.clamp(s / D, 0, 1);
      // spin rate falls; wobble (precession) grows and speeds up; the top wanders a little
      const w0 = 62, w1 = 16;
      spin = w0 * s - (w0 - w1) * s * s / (2 * D);
      prec = 4 * s + 7 * s * s / D;
      tilt = 0.035 + 0.38 * k * k * k;
      const drift = 0.05 * Math.sin(s * 1.3);
      x = L[0] + drift * Math.cos(s * 0.9); z = L[1] + drift * Math.sin(s * 0.9) - 0.04 * k;
      if (t > T.tFall) {
        // topple onto its side, then roll round in a little arc and stop
        const f = MathX.clamp((t - T.tFall) / 0.22, 0, 1);
        tilt = MathX.lerp(tilt, 1.42, Ease.inQuad(f));
        prec += 3.5 * Math.min(t - T.tFall, 0.6) * (1 - Math.min(1, (t - T.tFall) / 0.9));
      }
      this.world.position.set(x, 0.121, z);
      this.body.position.set(0, 0, 0);
      this.body.rotation.set(0, 0, 0);
      this.body.rotateY(prec); this.body.rotateX(tilt); this.body.rotateY(spin - prec);
    }
    this.blob.begin(); this.blob.push(x, 0.123, z, 0.09, 0.45); this.blob.end();
  }
}

class JacksGame {
  constructor(scene, kids) {
    this.kids = kids;
    this.root = new THREE.Group(); scene.add(this.root);
    const metal = new THREE.MeshStandardMaterial({ color: '#9aa0a4', metalness: 0.85, roughness: 0.35, name: 'jackMetal' });
    const jack = () => {
      const g = new THREE.Group();
      for (const r of [[0, 0, 0], [Math.PI / 2, 0, 0], [0, 0, Math.PI / 2]]) {
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.03, 5), metal); rod.rotation.set(...r); g.add(rod);
      }
      for (const [x, y, z] of [[0, 0.015, 0], [0, -0.015, 0], [0.015, 0, 0], [-0.015, 0, 0], [0, 0, 0.015], [0, 0, -0.015]]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 6, 4), metal); b.position.set(x, y, z); g.add(b); }
      g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      return g;
    };
    const r = new RNG(66), A = POCKET.jacks.at;
    this.jacks = [];
    for (let i = 0; i < 8; i++) {
      const j = jack(); j.scale.setScalar(1.7); j.position.set(A[0] + r.range(-0.15, 0.15), 0.148, A[1] + r.range(-0.12, 0.12)); j.rotation.set(r.range(0, 6), r.range(0, 6), r.range(0, 6));
      this.root.add(j); this.jacks.push(j);
    }
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(0.028, 14, 10), new THREE.MeshStandardMaterial({ color: '#b83a2e', roughness: 0.45, name: 'jacksBall' }));
    this.ball.castShadow = true; this.root.add(this.ball);
    this._v = new THREE.Vector3();
  }

  update(t, visible) {
    const J = POCKET.jacks, girl = this.kids.byId[J.girl];
    const on = visible && t >= J.t0 - 0.05 && t < J.t1 + 0.05 && girl;
    this.root.visible = !!on;
    if (!on) return;
    // the girl's toss rhythm comes from her 'jacks' action: 0.8 s per toss, phase offset 0.35 s
    const τ = t - J.t0, T = 0.8, f = ((τ + 0.35) % T) / T, n = Math.floor((τ + 0.35) / T);
    const hand = girl.handWorld(-1, this._v);
    const air = f < 0.85 ? Math.sin(Math.PI * MathX.clamp(f / 0.85, 0, 1)) : 0;
    this.ball.position.set(hand.x, hand.y + 0.03 + 0.5 * air, hand.z);
    // each sweep picks up the next two jacks
    this.jacks.forEach((j, i) => { j.visible = i >= 2 * (n + (f > 0.45 ? 1 : 0)) || i >= 8; });
  }
}
