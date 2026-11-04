/* =====================================================================
   ANIMALS — the cat (your kitchen), the dog on its lead (the park), a carp (the pond), pigeons. One quadruped rig for
   the cat and the dog: a body in two halves (front and back: they turn separately, which is how a falling cat rights
   itself), four two-part legs, a head, a tail of segments. Built from rounded parts; posed by a pose object.
     saBuildQuad(spec) → Q ; saPoseQuad(Q, pose) ; saBuildFish() ; saBuildPigeon()
   Origin: on the ground between its feet, facing +z, up +y.
   ===================================================================== */

const SA_CAT = { body: [0.072, 0.078], len: 0.38, hip: 0.215, leg: [0.11, 0.1], head: 0.058, snout: 0.022, ear: 'cat', tail: [0.3, 0.018], col: '#2b2724', col2: '#e9e2d6', eyes: '#c9d23a' };
const SA_DOG = { body: [0.13, 0.15], len: 0.62, hip: 0.5, leg: [0.24, 0.24], head: 0.1, snout: 0.075, ear: 'dog', tail: [0.34, 0.03], col: '#3a2a20', col2: '#efe6d8', eyes: '#1a120c' };

function saBuildQuad(sp) {
  const Q = { sp, root: new THREE.Group() }, m = saStd(sp.col, 0.85), m2 = saStd(sp.col2, 0.85), dark = saStd('#1a1614', 0.6);
  const b = sp.body, L = sp.len, hy = sp.hip;
  const mesh = (geo, mat, parent, x = 0, y = 0, z = 0) => saMesh(geo, mat, x, y, z, parent);
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
    mesh(new THREE.SphereGeometry(sp.head * 0.16, 10, 8), saStd(sp.eyes, 0.2), head, sd * sp.head * 0.42, sp.head * 0.15, sp.head * 0.8);
    mesh(new THREE.SphereGeometry(sp.head * 0.08, 8, 6), dark, head, sd * sp.head * 0.44, sp.head * 0.15, sp.head * 0.92);
    if (sp.ear === 'cat') { const e = mesh(new THREE.ConeGeometry(sp.head * 0.38, sp.head * 0.75, 4), m, head, sd * sp.head * 0.55, sp.head * 0.82, -sp.head * 0.05); e.rotation.set(-0.1, Math.PI / 4, sd * -0.35); }
    else { const e = mesh(new THREE.SphereGeometry(sp.head * 0.42, 10, 8).scale(0.35, 1.0, 0.75), saStd('#8a5a2a', 0.85), head, sd * sp.head * 0.92, -sp.head * 0.1, -sp.head * 0.15); e.rotation.z = sd * 0.25; Q['ear' + sd] = e; }
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
function saQuadPose(o = {}) { return Object.assign({ twistF: 0, twistB: 0, bend: 0, crouch: 0, legs: null, head: [0, 0], tail: [0.35, 0], stretch: 0, gait: null }, o); }
function saPoseQuad(Q, P) {
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
function saBuildFish() {
  // a koi carp (about 48 cm before scaling): a long body, deepest a third of the way back, narrow from side to side;
  // orange with white patches and a pale belly; a forked tail, a long dorsal fin, two pectoral fins
  const g = new THREE.Group(), m = saStd('#e0782a', 0.35, 0.1, { envMapIntensity: 1.4 }), mW = saStd('#f4ece0', 0.4, 0.05, { envMapIntensity: 1.2 });
  const fin = saStd('#e89a52', 0.5, 0, { side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
  const prof = (k, dy) => { const pts = []; for (let i = 0; i <= 24; i++) { const u = i / 24, x = Math.pow(u, 1.25), r = k * (0.062 * Math.pow(4 * x * (1 - x), 0.65) + 0.012 * (1 - u)); pts.push(new THREE.Vector2(Math.max(0.001, r), -0.24 + 0.48 * u)); } return new THREE.LatheGeometry(pts, 18).rotateX(Math.PI / 2).scale(0.72, 1, 1).translate(0, dy, 0); };
  saMesh(prof(1, 0), m, 0, 0, 0, g);
  saMesh(prof(0.93, -0.012), mW, 0, 0, 0, g);   // (the pale belly shows below the orange)
  for (const [z, x, r] of [[0.08, 0.0, 0.05], [-0.06, 0.01, 0.042], [0.17, -0.005, 0.03]]) saMesh(new THREE.SphereGeometry(r * 0.75, 12, 8).scale(0.9, 0.28, 1.4), mW, x, 0.05, z, g);
  const tailG = new THREE.Group(); tailG.position.z = -0.235; g.add(tailG);
  const ts = new THREE.Shape(); ts.moveTo(0, 0.01); ts.lineTo(0.075, -0.13); ts.lineTo(0.0, -0.08); ts.lineTo(-0.075, -0.13); ts.lineTo(0, -0.01); ts.closePath();
  const tf = saMesh(new THREE.ShapeGeometry(ts), fin, 0, 0, 0, tailG); tf.rotation.set(Math.PI / 2, Math.PI / 2, 0);
  const ds = new THREE.Shape(); ds.moveTo(0, 0); ds.lineTo(0.05, 0.05); ds.lineTo(0.2, 0.025); ds.lineTo(0.22, 0.0); ds.closePath();
  const df = saMesh(new THREE.ShapeGeometry(ds), fin, 0, 0.05, -0.1, g); df.rotation.y = -Math.PI / 2;
  for (const sd of [-1, 1]) { const ps = new THREE.Shape(); ps.moveTo(0, 0); ps.lineTo(0.07, -0.03); ps.lineTo(0.05, -0.06); ps.closePath();
    const pf = saMesh(new THREE.ShapeGeometry(ps), fin, sd * 0.035, -0.035, 0.1, g); pf.rotation.set(Math.PI / 2 + 0.3, 0, sd > 0 ? -0.5 : Math.PI + 0.5);
    saMesh(new THREE.SphereGeometry(0.009, 8, 6), saStd('#111', 0.2), sd * 0.03, 0.012, 0.19, g); }
  g.userData.tail = tailG; return g;
}
// a pigeon: grey body, darker head, folded or open wings (wings: groups that flap about the body's long axis)
function saBuildPigeon(s = 1) {
  // a feral pigeon in flight (body along +z, wings along ±x hinged at the shoulders, ~32 cm long, ~62 cm across):
  // blue-grey, a green-and-purple sheen on the neck, two black bars on each wing, dark primaries and a dark tail band
  const g = new THREE.Group(), D = THREE.DoubleSide;
  const mBody = saStd('#9298a2', 0.75), mHead = saStd('#737985', 0.7), mNeckG = saStd('#5f8676', 0.35, 0.35), mNeckP = saStd('#7d6a8c', 0.35, 0.35);
  const mWing = saStd('#a3a9b2', 0.8, 0, { side: D }), mDark = saStd('#3e4148', 0.8, 0, { side: D }), mTail = saStd('#878d97', 0.8, 0, { side: D });
  saMesh(new THREE.SphereGeometry(1, 14, 10).scale(0.072 * s, 0.07 * s, 0.15 * s), mBody, 0, 0.12 * s, -0.01 * s, g);
  saMesh(new THREE.SphereGeometry(1, 12, 9).scale(0.06 * s, 0.062 * s, 0.07 * s), mBody, 0, 0.125 * s, 0.07 * s, g);   // breast
  saMesh(new THREE.SphereGeometry(1, 12, 9).scale(0.045 * s, 0.05 * s, 0.05 * s), mNeckP, 0, 0.16 * s, 0.11 * s, g);
  saMesh(new THREE.SphereGeometry(1, 12, 9).scale(0.04 * s, 0.045 * s, 0.045 * s), mNeckG, 0, 0.18 * s, 0.13 * s, g);
  saMesh(new THREE.SphereGeometry(0.036 * s, 12, 9), mHead, 0, 0.2 * s, 0.16 * s, g);
  for (const sd of [-1, 1]) { saMesh(new THREE.SphereGeometry(0.008 * s, 8, 6), saStd('#e07a2a', 0.3), sd * 0.03 * s, 0.207 * s, 0.17 * s, g);
    saMesh(new THREE.SphereGeometry(0.004 * s, 6, 5), saStd('#111111', 0.2), sd * 0.034 * s, 0.208 * s, 0.174 * s, g); }
  saMesh(new THREE.ConeGeometry(0.008 * s, 0.026 * s, 6).rotateX(Math.PI / 2), saStd('#2e2f33', 0.5), 0, 0.197 * s, 0.205 * s, g);
  saMesh(new THREE.SphereGeometry(0.008 * s, 6, 5).scale(1, 0.7, 1.2), saStd('#e8e4dc', 0.6), 0, 0.203 * s, 0.19 * s, g);       // the white cere
  // the tail: a fan with a dark band at its end
  const shp = (pts) => { const S = new THREE.Shape(); S.moveTo(pts[0][0] * s, pts[0][1] * s); for (const q of pts.slice(1)) S.lineTo(q[0] * s, q[1] * s); return new THREE.ShapeGeometry(S).rotateX(Math.PI / 2); };
  const tail = new THREE.Group(); tail.position.set(0, 0.125 * s, -0.13 * s); tail.rotation.x = -0.12; g.add(tail);
  saMesh(shp([[-0.025, 0], [0.025, 0], [0.05, -0.1], [-0.05, -0.1]]), mTail, 0, 0, 0, tail);
  saMesh(shp([[-0.05, -0.1], [0.05, -0.1], [0.052, -0.125], [-0.052, -0.125]]), mDark, 0, 0.001, 0, tail);
  // feet tucked under the tail
  for (const sd of [-1, 1]) saCyl(0.006 * s, 0.005 * s, 0.05 * s, saStd('#c86a6a', 0.6), sd * 0.022 * s, 0.07 * s, -0.07 * s, g, 5).rotation.x = 1.2;
  // the wings: one flat outline each (broad at the shoulder, the primaries fingered at the tip)
  const W = [[0, 0.055], [0.1, 0.07], [0.2, 0.06], [0.27, 0.035], [0.32, 0.0], [0.315, -0.02], [0.29, -0.015], [0.285, -0.035], [0.26, -0.03], [0.25, -0.05], [0.22, -0.045], [0.2, -0.065], [0.13, -0.07], [0.06, -0.08], [0, -0.07]];
  const TIP = [[0.2, 0.06], [0.27, 0.035], [0.32, 0.0], [0.315, -0.02], [0.29, -0.015], [0.285, -0.035], [0.26, -0.03], [0.25, -0.05], [0.22, -0.045], [0.2, -0.065], [0.215, 0.0]];
  const w = [];
  for (const sd of [-1, 1]) {
    const p = new THREE.Group(); p.position.set(sd * 0.05 * s, 0.15 * s, 0.03 * s); g.add(p);
    const add = (geo, m, y) => { const o = saMesh(geo, m, 0, y * s, 0, p); o.scale.x = sd; o.castShadow = false; return o; };
    add(shp(W), mWing, 0); add(shp(TIP), mDark, 0.0015);
    add(shp([[0.03, -0.012], [0.15, -0.02], [0.15, -0.032], [0.03, -0.026]]), mDark, 0.0015);
    add(shp([[0.03, -0.042], [0.15, -0.05], [0.15, -0.062], [0.03, -0.056]]), mDark, 0.0015);
    w.push(p);
  }
  g.userData.wings = w; return g;
}
