/* =====================================================================
   KITE + WORKSHOP — "if you didn't own the toy you wanted, you could make one".
   A crate bench in a side yard with what kids had to hand: two sticks, a ball
   of twine, old newspaper, rag strips, a pot of flour paste, pram wheels.
   The kite is built in stages for the montage (sticks → crossed and tied →
   newspaper sail → rag-bow tail), held up for the reveal, then flown in the
   meadow on a sagging string from your own hand.
   ===================================================================== */

const KITE = {
  bench: { x: -11.2, z: -23.4, y: 0.76 },
  stages: [[0, 0], [30.85, 1], [31.85, 2], [32.35, 3], [32.85, 4]],
  heldBy: 'runner', holdFrom: 32.85, flyFrom: 34.85,
};

class Kite {
  constructor(scene) {
    this.root = new THREE.Group(); this.root.name = 'kite'; scene.add(this.root);
    const wood = new THREE.MeshStandardMaterial({ color: '#c8a878', roughness: 0.7, name: 'kiteStick' });
    const twine = new THREE.MeshStandardMaterial({ color: '#e0d4b4', roughness: 0.9, name: 'twine' });
    // newspaper sail with a red painted sun
    const cv = Tex.canvas(256, 320), c = cv.getContext('2d'), r = new RNG(1905);
    c.fillStyle = '#e4dcc6'; c.fillRect(0, 0, 256, 320);
    c.fillStyle = '#3a3630'; c.font = '700 22px Lora, Georgia, serif'; c.fillText('THE DAILY', 70, 34);
    c.fillRect(10, 42, 236, 2);
    for (let col = 0; col < 4; col++) for (let ln = 0; ln < 40; ln++) { c.fillStyle = `rgba(50,46,40,${r.range(0.35, 0.6)})`; c.fillRect(12 + col * 60, 52 + ln * 6.6, r.range(30, 54), 2.2); }
    c.fillStyle = 'rgba(168,52,40,0.9)'; c.beginPath(); c.arc(128, 150, 62, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(40,30,25,0.8)'; c.lineWidth = 4; c.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.strokeStyle = 'rgba(168,52,40,0.85)'; c.lineWidth = 6; c.beginPath(); c.moveTo(128 + Math.cos(a) * 72, 150 + Math.sin(a) * 72); c.lineTo(128 + Math.cos(a) * 100, 150 + Math.sin(a) * 100); c.stroke(); }
    const sailM = new THREE.MeshStandardMaterial({ map: Tex.tex(cv, { repeat: false }), roughness: 0.85, side: THREE.DoubleSide, name: 'kitePaper' });
    const T = [0, 0.5], B = [0, -0.45], Lt = [-0.3, 0.14], Rt = [0.3, 0.14], Cc = [0, 0.14];
    const uv = ([x, y]) => [(x + 0.32) / 0.64, (y + 0.47) / 0.99];
    const pos = [], uvs = [];
    for (const [a, b] of [[T, Rt], [Rt, B], [B, Lt], [Lt, T]]) for (const p of [a, b, Cc]) { pos.push(p[0], p[1], p === Cc ? 0.025 : 0); uvs.push(...uv(p)); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); sg.computeVertexNormals();
    this.sail = new THREE.Mesh(sg, sailM); this.sail.castShadow = true;
    // sticks (spine and cross spar), the tying at the cross, the frame string, the bridle
    this.spine = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.95, 0.007), wood); this.spine.position.set(0, 0.025, -0.006);
    this.spar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.008, 0.007), wood); this.spar.position.set(0, 0.14, -0.012);
    this.tie = new THREE.Mesh(new THREE.TorusGeometry(0.008, 0.0035, 4, 10), twine); this.tie.position.set(0, 0.14, -0.009);
    const seg = (a, b, z = 0.001) => { const len = Math.hypot(b[0] - a[0], b[1] - a[1]); const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.0025, 0.0025), twine); m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z); m.rotation.z = Math.atan2(b[1] - a[1], b[0] - a[0]); return m; };
    this.frame = new THREE.Group(); for (const [a, b] of [[T, Rt], [Rt, B], [B, Lt], [Lt, T]]) this.frame.add(seg(a, b));
    this.bridle = new THREE.Group();
    for (const a of [[0, 0.33], [0, -0.22]]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.0013, 0.0013, 1, 3), twine); const tp = new THREE.Vector3(0, 0.08, 0.24), ap = new THREE.Vector3(a[0], a[1], 0); m.position.copy(tp).add(ap).multiplyScalar(0.5); m.scale.y = tp.distanceTo(ap); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tp.clone().sub(ap).normalize()); this.bridle.add(m); }
    this.towPoint = new THREE.Vector3(0, 0.08, 0.24);
    // the tail: a string with rag bows, animated as a swaying chain
    const bowCols = ['#b8473e', '#3e6a9a', '#d8b04a', '#4e7a44', '#b8473e', '#7a5a8a'];
    this.tailN = 14; this.tailSeg = 0.13;
    this.tailLine = new THREE.Mesh(new THREE.BufferGeometry(), twine);
    this.bows = bowCols.map((col) => {
      const g = new THREE.Group(), bm = new THREE.MeshStandardMaterial({ color: col, roughness: 0.95, side: THREE.DoubleSide });
      for (const s of [-1, 1]) { const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, s * 0.07, 0.035, 0, s * 0.07, -0.035, 0], 3)); tg.computeVertexNormals(); g.add(new THREE.Mesh(tg, bm)); }
      return g;
    });
    this.kite = new THREE.Group();
    this.kite.add(this.sail, this.spine, this.spar, this.tie, this.frame, this.bridle);
    this.root.add(this.kite, this.tailLine, ...this.bows);
    this.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    this._pts = Array.from({ length: this.tailN + 1 }, () => new THREE.Vector3());
    this._v = new THREE.Vector3(); this._w = new THREE.Vector3(); this._m = new THREE.Matrix4();
  }

  // tail as a chain hanging from the bottom tip; `wind` is the direction it streams in (world), `sag` gravity mix
  _tail(t, wind, sag, lie) {
    const base = this._v.set(0, -0.45, 0); this.kite.localToWorld(base);
    const P = this._pts;
    P[0].copy(base);
    for (let i = 1; i <= this.tailN; i++) {
      const k = i / this.tailN, wave = Math.sin(t * 7 - i * 0.7) * 0.06 * k;
      if (lie) { P[i].set(base.x + 0.16 + 0.04 * Math.sin(i * 1.3), base.y, base.z - i * 0.062); continue; }   // laid alongside the kite
      const dir = this._w.copy(wind).multiplyScalar(1 - sag).add(new THREE.Vector3(0, -sag, 0)).normalize();
      P[i].copy(P[i - 1]).addScaledVector(dir, this.tailSeg);
      P[i].x += wave * dir.z; P[i].z -= wave * dir.x; P[i].y += wave * 0.5;
    }
    const curve = new THREE.CatmullRomCurve3(P);
    this.tailLine.geometry.dispose();
    this.tailLine.geometry = new THREE.TubeGeometry(curve, this.tailN * 2, 0.0018, 3, false);
    this.bows.forEach((b, i) => { const p = curve.getPointAt((i + 1) / (this.bows.length + 0.5)); b.position.copy(p); b.lookAt(p.x + wind.z, p.y, p.z - wind.x); b.rotateZ(Math.sin(t * 9 + i) * 0.4); });
  }

  setStage(stage, t) {
    this.spar.visible = this.spine.visible = true;
    this.tie.visible = stage >= 1; this.frame.visible = stage >= 2; this.sail.visible = stage >= 2; this.bridle.visible = stage >= 4;
    const tail = stage >= 3;
    this.tailLine.visible = tail; this.bows.forEach((b) => { b.visible = tail; });
    if (stage === 0) { this.spar.position.set(0.05, 0.3, -0.012); this.spar.rotation.z = 0.5; }
    else { this.spar.position.set(0, 0.14, -0.012); this.spar.rotation.z = 0; }
    if (stage === 1) this.tie.scale.setScalar(MathX.clamp((t - 30.85) / 0.8, 0.2, 1));
  }
}

class KiteWorkshop {
  constructor(scene, kids, hands) {
    this.kids = kids; this.hands = hands;
    this.root = new THREE.Group(); this.root.name = 'workshop'; scene.add(this.root);
    const B = KITE.bench, std = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85 }, o));
    const add = (g, m, x, y, z, ry = 0, rx = 0, rz = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = o.receiveShadow = true; this.root.add(o); return o; };
    const crate = std('#9a7a54'), plank = std('#8a6a48'), paper = std('#e0d8c4', { side: THREE.DoubleSide });
    // two crates and a plank: the bench
    for (const dz of [-0.5, 0.5]) add(new THREE.BoxGeometry(0.5, 0.62, 0.42), crate, B.x, 0.37, B.z + dz);
    add(new THREE.BoxGeometry(0.62, 0.05, 1.5), plank, B.x, B.y - 0.025, B.z);
    // materials on the bench
    add(new THREE.SphereGeometry(0.045, 10, 8), std('#d8cca8'), B.x + 0.18, B.y + 0.045, B.z + 0.55);                       // ball of twine
    add(new THREE.PlaneGeometry(0.5, 0.36), paper, B.x - 0.05, B.y + 0.003, B.z - 0.45, 0.2, -Math.PI / 2);                // spare newspaper
    add(new THREE.CylinderGeometry(0.05, 0.045, 0.08, 12), std('#c8c0b0', { roughness: 0.4 }), B.x + 0.2, B.y + 0.04, B.z - 0.58);   // paste pot
    add(new THREE.CylinderGeometry(0.006, 0.006, 0.18, 5), std('#7a5a3a'), B.x + 0.2, B.y + 0.11, B.z - 0.56, 0, 0.3, 0.2); // brush
    const rags = ['#b8473e', '#3e6a9a', '#d8b04a', '#4e7a44'];
    rags.forEach((col, i) => add(new THREE.BoxGeometry(0.03, 0.004, 0.16), std(col, { roughness: 0.95 }), B.x - 0.2 + i * 0.04, B.y + 0.003, B.z + 0.4 + (i % 2) * 0.05, 0.3 * i));
    // old pram wheels leaning on the bench, a spare crate
    for (const dz of [-0.2, 0.25]) {
      const w = new THREE.Group(); w.position.set(B.x + 0.38, 0.27, B.z + dz); w.rotation.set(0, Math.PI / 2, -0.25); this.root.add(w);
      const tyre = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.015, 5, 20), std('#2a2826', { roughness: 0.7 })); w.add(tyre);
      for (let k = 0; k < 8; k++) { const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.46, 4), std('#5a5856', { metalness: 0.6, roughness: 0.4 })); sp.rotation.z = (k / 8) * Math.PI; w.add(sp); }
    }
    add(new THREE.BoxGeometry(0.45, 0.4, 0.4), crate, B.x - 0.5, 0.2, B.z + 1.2, 0.4);
    this.kite = new Kite(scene);
    this._v = new THREE.Vector3(); this._w = new THREE.Vector3(); this._wind = new THREE.Vector3();
  }

  update(t, visible) {
    this.root.visible = visible;
    const K = this.kite, B = KITE.bench;
    let stage = 0;
    for (const [tt, s] of KITE.stages) if (t >= tt) stage = s;
    if (!visible || t >= KITE.flyFrom) { if (t < KITE.flyFrom) K.root.visible = false; return; }
    K.root.visible = true;
    K.setStage(stage, t);
    if (stage < 4) {
      // lying on the bench, top toward the west
      K.kite.position.set(B.x, B.y + 0.012, B.z);
      K.kite.rotation.set(-Math.PI / 2, 0, 0);            // flat on the plank, top toward the north
      K.kite.updateMatrixWorld(true);
      if (stage >= 3) K._tail(t, this._wind.set(1, 0, 0), 0, true);
      return;
    }
    // held up over the builder's head, facing you; the tail hangs and stirs in the breeze
    const kid = this.kids.byId[KITE.heldBy];
    const a = kid.handWorld(1, this._v).clone(), b = kid.handWorld(-1, this._w);
    K.kite.position.copy(a).add(b).multiplyScalar(0.5); K.kite.position.y += 0.3;
    K.kite.rotation.set(0, kid.root.rotation.y, 0); K.kite.rotateX(-0.25 + 0.04 * Math.sin(t * 2.3));
    K.kite.rotateZ(0.05 * Math.sin(t * 1.7));
    K.kite.updateMatrixWorld(true);
    K._tail(t, this._wind.set(0.35, 0, 0.2).normalize(), 0.75, false);
  }
}
