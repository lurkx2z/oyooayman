/* =====================================================================
   ANIMALS — the cat (your kitchen), the dog on its lead (the park), a carp (the pond), pigeons. One quadruped rig for
   the cat and the dog: a body in two halves (front and back: they turn separately, which is how a falling cat rights
   itself), four two-part legs, a head, a tail of segments. Built from rounded parts; posed by a pose object.
     fuBuildQuad(spec) → Q ; fuPoseQuad(Q, pose) ; fuBuildFish() ; fuBuildPigeon()
   Origin: on the ground between its feet, facing +z, up +y.
   ===================================================================== */

const FU_CAT = { body: [0.072, 0.078], len: 0.38, hip: 0.215, leg: [0.11, 0.1], head: 0.058, snout: 0.022, ear: 'cat', tail: [0.3, 0.018], col: '#2b2724', col2: '#e9e2d6', eyes: '#c9d23a' };
const FU_DOG = { body: [0.13, 0.15], len: 0.62, hip: 0.5, leg: [0.24, 0.24], head: 0.1, snout: 0.075, ear: 'dog', tail: [0.34, 0.03], col: '#3a2a20', col2: '#efe6d8', eyes: '#1a120c' };

function fuBuildQuad(sp) {
  const Q = { sp, root: new THREE.Group() }, m = fuStd(sp.col, 0.85), m2 = fuStd(sp.col2, 0.85), dark = fuStd('#1a1614', 0.6);
  const b = sp.body, L = sp.len, hy = sp.hip;
  const mesh = (geo, mat, parent, x = 0, y = 0, z = 0) => fuMesh(geo, mat, x, y, z, parent);
  // the two halves pivot about the body's long axis at its middle
  const body = new THREE.Group(); body.position.y = hy; Q.root.add(body); Q.body = body;
  const front = new THREE.Group(), back = new THREE.Group(); body.add(front, back); Q.front = front; Q.back = back;
  mesh(new THREE.SphereGeometry(1, 16, 12).scale(b[0], b[1], L * 0.32), m, front, 0, 0.005, L * 0.16);
  mesh(new THREE.SphereGeometry(1, 16, 12).scale(b[0] * 0.95, b[1] * 0.95, L * 0.32), m, back, 0, 0, -L * 0.14);
  mesh(new THREE.SphereGeometry(1, 12, 10).scale(b[0] * 0.75, b[1] * 0.6, L * 0.25), m2, front, 0, -b[1] * 0.35, L * 0.18);       // the chest, paler
  // the neck and head
  const neck = new THREE.Group(); neck.position.set(0, b[1] * 0.45, L * 0.38); front.add(neck); Q.neck = neck;
  const head = new THREE.Group(); head.position.set(0, sp.head * 0.9, sp.head * 0.55); neck.add(head); Q.head = head;
  mesh(new THREE.SphereGeometry(sp.head, 16, 12).scale(1, 0.92, 1.05), m, head);
  mesh(new THREE.SphereGeometry(sp.snout, 12, 8).scale(1.1, 0.8, sp.ear === 'dog' ? 1.6 : 1.0), sp.ear === 'dog' ? m : m2, head, 0, -sp.head * 0.28, sp.head * (sp.ear === 'dog' ? 0.95 : 0.82));
  mesh(new THREE.SphereGeometry(sp.snout * 0.32, 8, 6), dark, head, 0, -sp.head * 0.18, sp.head * (sp.ear === 'dog' ? 1.5 : 1.05));
  for (const sd of [-1, 1]) {
    mesh(new THREE.SphereGeometry(sp.head * 0.16, 10, 8), fuStd(sp.eyes, 0.2), head, sd * sp.head * 0.42, sp.head * 0.15, sp.head * 0.8);
    mesh(new THREE.SphereGeometry(sp.head * 0.08, 8, 6), dark, head, sd * sp.head * 0.44, sp.head * 0.15, sp.head * 0.92);
    if (sp.ear === 'cat') { const e = mesh(new THREE.ConeGeometry(sp.head * 0.38, sp.head * 0.75, 4), m, head, sd * sp.head * 0.55, sp.head * 0.82, -sp.head * 0.05); e.rotation.set(-0.1, Math.PI / 4, sd * -0.35); }
    else { const e = mesh(new THREE.SphereGeometry(sp.head * 0.42, 10, 8).scale(0.35, 1.0, 0.75), fuStd('#8a5a2a', 0.85), head, sd * sp.head * 0.92, -sp.head * 0.1, -sp.head * 0.15); e.rotation.z = sd * 0.25; Q['ear' + sd] = e; }
  }
  // legs: shoulder / hip pivots; each leg two parts and a paw. [half, side, z]
  Q.legs = [];
  for (const [half, sd, z] of [[front, -1, L * 0.3], [front, 1, L * 0.3], [back, -1, -L * 0.3], [back, 1, -L * 0.3]]) {
    const top = new THREE.Group(); top.position.set(sd * b[0] * 0.62, -b[1] * 0.2, z); half.add(top);
    const r0 = b[0] * (sp.ear === 'dog' ? 0.32 : 0.3);
    mesh(new THREE.CylinderGeometry(r0, r0 * 0.75, sp.leg[0], 8).translate(0, -sp.leg[0] / 2, 0), m, top);
    const knee = new THREE.Group(); knee.position.y = -sp.leg[0]; top.add(knee);
    mesh(new THREE.CylinderGeometry(r0 * 0.72, r0 * 0.6, sp.leg[1], 8).translate(0, -sp.leg[1] / 2, 0), z > 0 ? m2 : m, knee);
    mesh(new THREE.SphereGeometry(r0 * 0.85, 8, 6).scale(1, 0.6, 1.4), z > 0 ? m2 : m, knee, 0, -sp.leg[1], r0 * 0.4);
    Q.legs.push({ top, knee, sd, front: z > 0 });
  }
  // the tail: a chain of segments from the back of the body
  Q.tail = []; let par = back; const n = 7, tl = sp.tail[0] / n;
  for (let i = 0; i < n; i++) { const g = new THREE.Group(); g.position.set(0, i ? 0 : b[1] * 0.3, i ? tl : -L * 0.42); g.rotation.x = 0; par.add(g); if (!i) g.rotation.x = Math.PI; const r = sp.tail[1] * (1 - 0.5 * i / n);
    mesh(new THREE.CylinderGeometry(r * 0.9, r, tl * 1.08, 7).rotateX(Math.PI / 2).translate(0, 0, tl / 2), m, g); Q.tail.push(g); par = g; }
  Q.root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return Q;
}
// the pose: { twistF, twistB (rad about the long axis), bend (spine pitch), crouch (0…1), legs: [[a, k] × 4] (swing,
// knee), head: [pitch, yaw], tail: [curl, sway], stretch (0…1: legs reaching out) }
function fuQuadPose(o = {}) { return Object.assign({ twistF: 0, twistB: 0, bend: 0, crouch: 0, legs: null, head: [0, 0], tail: [0.35, 0], stretch: 0, gait: null }, o); }
function fuPoseQuad(Q, P) {
  const sp = Q.sp;
  Q.body.position.y = sp.hip * (1 - 0.38 * P.crouch);
  Q.front.rotation.set(-P.bend * 0.5, 0, P.twistF); Q.back.rotation.set(P.bend * 0.5, 0, P.twistB);
  Q.neck.rotation.set(-P.head[0], P.head[1], 0);
  Q.legs.forEach((lg, i) => {
    let a = 0, k = 0;
    if (P.legs) { a = P.legs[i][0]; k = P.legs[i][1]; }
    else if (P.gait != null) { const ph = P.gait + (i === 0 || i === 3 ? 0 : Math.PI) + (lg.front ? 0 : 0.5); a = 0.45 * Math.sin(ph); k = (lg.front ? -1 : 1) * 0.5 * Math.max(0, Math.cos(ph)); }
    a += (lg.front ? 1 : -1) * 0.9 * P.stretch;
    k += (lg.front ? -1 : 1) * 1.2 * P.crouch;
    lg.top.rotation.set(a, 0, 0); lg.knee.rotation.set(k, 0, 0);
  });
  Q.tail.forEach((g, i) => { if (!i) { g.rotation.set(Math.PI - 0.6 - P.tail[0] * 0.4, P.tail[1] * 0.4, 0); return; } g.rotation.set(-P.tail[0] * 0.35, P.tail[1] * 0.25, 0); });
}

// a carp: a long body, tail fin, dorsal fin (origin at its middle, nose along +z)
function fuBuildFish() {
  const g = new THREE.Group(), m = fuStd('#d9822e', 0.35, 0.1, { envMapIntensity: 1.4 }), m2 = fuStd('#f2e2c8', 0.4), fin = fuStd('#c86a28', 0.5, 0, { side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
  fuMesh(new THREE.SphereGeometry(1, 18, 12).scale(0.07, 0.085, 0.24), m, 0, 0, 0, g);
  fuMesh(new THREE.SphereGeometry(1, 14, 10).scale(0.055, 0.05, 0.18), m2, 0, -0.03, 0.02, g);
  const tailG = new THREE.Group(); tailG.position.z = -0.22; g.add(tailG);
  const ts = new THREE.Shape(); ts.moveTo(0, 0); ts.lineTo(0.09, -0.16); ts.lineTo(0.02, -0.12); ts.lineTo(-0.09, -0.16); ts.closePath();
  const tf = fuMesh(new THREE.ShapeGeometry(ts), fin, 0, 0, 0, tailG); tf.rotation.set(Math.PI / 2, Math.PI / 2, 0);
  const ds = new THREE.Shape(); ds.moveTo(0, 0); ds.lineTo(0.06, 0.07); ds.lineTo(0.2, 0.0); ds.closePath();
  const df = fuMesh(new THREE.ShapeGeometry(ds), fin, 0, 0.075, -0.1, g); df.rotation.y = -Math.PI / 2;
  for (const sd of [-1, 1]) { fuMesh(new THREE.SphereGeometry(0.012, 8, 6), fuStd('#111', 0.2), sd * 0.045, 0.025, 0.17, g); }
  g.userData.tail = tailG; return g;
}
// a pigeon: grey body, darker head, folded or open wings (wings: groups that flap about the body's long axis)
function fuBuildPigeon(s = 1) {
  const g = new THREE.Group(), m = fuStd('#8a8d94', 0.8), mh = fuStd('#5a5f6a', 0.7), mw = fuStd('#7a7e86', 0.8), beak = fuStd('#d8c8a8', 0.6);
  fuMesh(new THREE.SphereGeometry(0.1 * s, 10, 8).scale(0.9, 0.85, 1.6), m, 0, 0.12 * s, 0, g);
  fuMesh(new THREE.SphereGeometry(0.05 * s, 10, 8), mh, 0, 0.21 * s, 0.12 * s, g);
  fuMesh(new THREE.ConeGeometry(0.012 * s, 0.03 * s, 6).rotateX(Math.PI / 2), beak, 0, 0.205 * s, 0.17 * s, g);
  fuMesh(new THREE.BoxGeometry(0.07 * s, 0.02 * s, 0.12 * s), mh, 0, 0.12 * s, -0.19 * s, g);
  for (const sd of [-1, 1]) fuCyl(0.006 * s, 0.006 * s, 0.07 * s, fuStd('#c8584a', 0.6), sd * 0.03 * s, 0.035 * s, 0.01 * s, g, 5);
  const w = [];
  for (const sd of [-1, 1]) { const p = new THREE.Group(); p.position.set(sd * 0.07 * s, 0.15 * s, 0); g.add(p); const wing = fuBox(0.26 * s, 0.012 * s, 0.14 * s, mw, sd * 0.13 * s, 0, -0.02 * s, p); wing.castShadow = false; w.push(p); }
  g.userData.wings = w; return g;
}
