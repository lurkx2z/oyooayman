/* =====================================================================
   CAST — the people (the shared adult rig, js/world/people.js) and the animals. Every body is posed as a pure
   function of story time s.
     LOOKS sfYou (a farmer: a canvas jacket, jeans, a cap) · sfKid (9: a yellow raincoat, the hood up; kid scale)
     sfPerson(look, parent, o) → Person ; sfPlace(person, q, x, z, yaw, y0)
     sfStatePose(state, s, i, v) → { p, lay, y }   a body state from physics.js (walk, run, stand, crouch, kneel …)
     sfDog(parent) → { g, pose(st, s) }            the dog (a black-and-white collie)
     sfBats(scene) → { update(s) }                 the bats (instanced bodies and wings)
   ===================================================================== */

Object.assign(LOOKS, {
  // you: a tan canvas work jacket over a grey T-shirt, jeans, boots, a faded green cap
  sfYou: { skin: 0, build: 'avg', shirt: '#9a7a4e', sleeves: 'long', pants: '#33415a', shoes: '#4a3424', sole: '#1c1410', hair: '#5a4028', jacket: true, collar: true, inner: '#6c6e70', hat: { type: 'cap', color: '#3f5a3a' } },
  // your daughter: a yellow raincoat (the hood up), blue jeans, red rubber boots
  sfKid: { skin: 0, build: 'slim', shirt: '#f2c22a', sleeves: 'long', pants: '#3a5a8a', shoes: '#b8302a', sole: '#7a1a14', hair: '#c9944a', coat: true, collar: true, inner: '#e0ac1a' },
});
const sfEase = (s, a, b) => { const u = MathX.clamp((s - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
function sfPerson(look, parent, o = {}) {
  const p = new Person({ id: 'sf' + look + (o.id || ''), look }, null);
  if (o.kid) p.root.scale.setScalar(0.66);
  sfPersonNoZ(p);
  if (o.hoodUp) {   // a raincoat's hood, up: a shell over the back and top of the head, its rim round the face
    const m = new THREE.MeshStandardMaterial({ color: LOOKS[look].shirt, roughness: 0.38, metalness: 0.0 });
    const g = new THREE.SphereGeometry(0.135, 20, 14, Math.PI * 0.22, Math.PI * 1.56, 0, Math.PI * 0.72); g.rotateY(Math.PI); g.scale(1, 1.12, 1.08);
    const h = new THREE.Mesh(g, m); h.position.set(0, 0.035, -0.012); h.castShadow = true; p.j.head.add(h);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.118, 0.014, 6, 22, Math.PI * 1.25), m); rim.position.set(0, 0.03, 0.07); rim.rotation.set(-0.15, 0, -Math.PI / 8); p.j.head.add(rim);
  }
  (parent || SF_KIT_SCENE).add(p.root);
  return p;
}
// (the engine's people have a few surfaces that share a plane: nudged here, per person, so nothing flickers; the
// engine's people.js itself is untouched — the no-light film's fix)
function sfPersonNoZ(p) {
  const L = p.look, BG = PersonGeo.forBuild(L.build || 'avg', L);
  p.root.traverse((m) => {
    if (!m.isMesh) return; const g = m.geometry, q = g.parameters;
    if (g.type === 'BoxGeometry' && q.height === 0.035 && Math.abs(q.width - BG.B.waist * 1.02) < 1e-6) m.scale.set(1, 1.6, 1.08);
    else if (g.type === 'BoxGeometry' && q.width === 0.08 && q.depth === 0.01) m.position.z += L.shoulderBag ? 0.0015 : 0.004;
    else if (g.type === 'BoxGeometry' && q.width === 0.03 && q.depth === 0.012) m.position.z += 0.003;
    else if (L.coat && (g === BG.pelvis || g === BG.thigh)) m.scale.set(0.98, 1, 0.98);
  });
}
function sfWalkPose(ph, big = 1) {
  const p = basePose(), s = Math.sin(ph), co = Math.cos(ph);
  p.lHip = [0.42 * big * s, 0.03]; p.rHip = [-0.42 * big * s, 0.03];
  p.lKnee = 0.08 + 0.65 * big * Math.max(0, co) ** 1.5; p.rKnee = 0.08 + 0.65 * big * Math.max(0, -co) ** 1.5;
  p.lFoot = -0.2 * Math.max(0, co); p.rFoot = -0.2 * Math.max(0, -co);
  p.lSh = [-0.34 * big * s, 0.07]; p.rSh = [0.34 * big * s, 0.07]; p.lEl = 0.28 + 0.18 * Math.max(0, -s); p.rEl = 0.28 + 0.18 * Math.max(0, s);
  return p;
}
function sfRunPose(ph) {
  const p = basePose(), s = Math.sin(ph), c = Math.cos(ph);
  p.lHip = [0.15 + 0.7 * s, 0.03]; p.rHip = [0.15 - 0.7 * s, 0.03]; p.lKnee = 0.5 + 0.9 * Math.max(0, -s) + 0.35 * (1 + c) * 0.5; p.rKnee = 0.5 + 0.9 * Math.max(0, s) + 0.35 * (1 + c) * 0.5;
  p.lFoot = 0.2; p.rFoot = 0.2; p.lSh = [-0.6 * s, 0.12]; p.rSh = [0.6 * s, 0.12]; p.lEl = 1.45; p.rEl = 1.45; p.spine = 0.16; p.neck = -0.08; p.hipY = 0.9;
  return p;
}
const SF_P = {
  stand: (s, i) => { const p = basePose(); p.headYaw = 0.25 * noise1(s * 0.3, i + 2); p.neck = 0.04 + 0.05 * noise1(s * 0.2, i + 5); return p; },
  // listening: the head turning slowly one way and the other
  listen: (s, i) => { const p = basePose(); p.headYaw = 0.75 * Math.sin(s * 0.42 + i); p.neck = -0.04; p.lSh = [0.15, 0.14]; p.rSh = [0.12, 0.14]; p.lEl = 0.3; p.rEl = 0.3; return p; },
  // calling: both hands cupped round the mouth (k: 0…1, how far into the call)
  call: (s, k = 1) => { const p = basePose(); p.lSh = [1.05 * k + 0.05, -0.25 * k + 0.08]; p.rSh = [1.05 * k + 0.05, -0.25 * k + 0.08]; p.lEl = 0.18 + 2.05 * k; p.rEl = 0.18 + 2.05 * k; p.neck = 0.04 - 0.18 * k; p.spine = 0.03 - 0.06 * k; p.mouth = k; return p; },
  // the phone at your right ear; your left hand up against the other ear
  phone: (s, i, ear = 0) => { const p = basePose(); p.rSh = [0.7, -0.05]; p.rEl = 2.35; p.lSh = [0.4 + 0.5 * ear, 0.2 + 0.1 * ear]; p.lEl = 0.9 + 1.4 * ear; p.neck = 0.12; p.headYaw = 0.25 * Math.sin(s * 0.5 + i); return p; },
  // looking at the phone in your right hand, the torch in your left
  look: (s) => { const p = basePose(); p.rSh = [0.55, -0.18]; p.rEl = 1.55; p.lSh = [0.5, 0.18]; p.lEl = 1.1; p.neck = 0.42; p.spine = 0.08; return p; },
  // the torch held out in front (left hand), the right arm out for balance
  torch: (s) => { const p = basePose(); p.lSh = [1.1, 0.12]; p.lEl = 0.35; p.rSh = [0.5, 0.3]; p.rEl = 0.6; p.headYaw = 0.3 * Math.sin(s * 0.8); return p; },
  crouch: (s, i) => { const p = basePose(); p.hipY = 0.6; p.lHip = [1.1, 0.12]; p.rHip = [1.1, 0.12]; p.lKnee = 1.6; p.rKnee = 1.6; p.lFoot = 0.35; p.rFoot = 0.35; p.spine = 0.38;
    p.lSh = [0.95, -0.1]; p.rSh = [0.9, -0.12]; p.lEl = 1.25; p.rEl = 1.2; p.neck = 0.15 + 0.08 * Math.sin(s * 0.7 + i); p.headYaw = 0.35 * Math.sin(s * 0.33 + i); return p; },
  kneel: (s, i) => { const p = basePose(); p.hipY = 0.5; p.lHip = [0.05, 0.08]; p.rHip = [0.05, 0.08]; p.lKnee = 1.75; p.rKnee = 1.75; p.lFoot = 0.5; p.rFoot = 0.5; p.spine = 0.18;
    p.lSh = [0.95, 0.3]; p.rSh = [0.9, 0.25]; p.lEl = 0.5; p.rEl = 0.5; p.headYaw = 0.25 * Math.sin(s * 0.5 + i); return p; },
  // holding her: kneeling, both arms round her
  hug: (s) => { const p = SF_P.kneel(s, 0); p.lSh = [1.15, -0.2]; p.rSh = [1.1, -0.18]; p.lEl = 2.0; p.rEl = 2.05; p.spine = 0.3; p.neck = 0.25; p.headYaw = 0.4 * Math.sin(s * 0.6); return p; },
  // her, held: her arms round the dog (crouched), then round your neck
  kidHold: (s) => { const p = SF_P.crouch(s, 3); p.lSh = [1.1, -0.35]; p.rSh = [1.05, -0.3]; p.lEl = 1.7; p.rEl = 1.75; p.spine = 0.45; p.neck = 0.3; p.headYaw = 0.1 * Math.sin(s * 0.9); return p; },
  flinch: (s) => { const p = basePose(); p.lSh = [1.6, 0.3]; p.rSh = [1.5, 0.35]; p.lEl = 2.1; p.rEl = 2.0; p.spine = 0.25; p.neck = 0.35; p.lKnee = 0.3; p.rKnee = 0.3; p.hipY = 0.88; return p; },
};
// the pose for a body state: { p, lay, y }
function sfStatePose(st, s, i = 0, kid = false) {
  const S = st.state;
  if (S === 'walk') return { p: sfWalkPose(st.d / (kid ? 0.95 : 1.32) * 2 * Math.PI), lay: 0, y: 0 };
  if (S === 'run') { const p = sfRunPose(st.d / (kid ? 1.5 : 2.3) * 2 * Math.PI); return { p, lay: 0, y: 0.04 * Math.abs(Math.sin(st.d / (kid ? 1.5 : 2.3) * 2 * Math.PI)) }; }
  if (S === 'crouch') return { p: SF_P.crouch(s, i), lay: 0, y: 0 };
  if (S === 'kneel') return { p: SF_P.kneel(s, i), lay: 0, y: 0.02 };
  if (S === 'listen') return { p: SF_P.listen(s, i), lay: 0, y: 0 };
  return { p: SF_P.stand(s, i), lay: 0, y: 0 };
}
function sfPlace(P, q, x, z, yaw, y0 = 0) {
  P.root.position.set(x, y0 + q.y, z); P.root.rotation.order = 'YXZ'; P.root.rotation.set(Math.PI / 2 * q.lay, yaw, 0);
  P.apply(q.p); P.pose = q.p;
}

// ---------------------------------------------------------------------------------------------------------------------
// THE DOG: a black-and-white collie (low-poly: body, chest, head and muzzle, ears, tail, four two-part legs).
// Faces +z at yaw 0, like the people. pose(st, s): run (a gallop), lie, sit, stand
// ---------------------------------------------------------------------------------------------------------------------
function sfDog(parent) {
  const g = new THREE.Group(), blk = sfStd('#16161a', 0.85), wht = sfStd('#e8e4dc', 0.8), pink = sfStd('#4a2a2a', 0.6);
  const body = new THREE.Group(); body.position.y = 0.5; g.add(body);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.42, 4, 10), blk); torso.rotation.x = Math.PI / 2; torso.castShadow = true; body.add(torso);
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), wht); chest.scale.set(0.9, 1.1, 0.8); chest.position.set(0, -0.04, 0.24); body.add(chest);
  const neck = new THREE.Group(); neck.position.set(0, 0.06, 0.3); body.add(neck);
  const nm = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.1, 0.2, 10), blk); nm.position.set(0, 0.08, 0.04); nm.rotation.x = 0.6; neck.add(nm);
  const head = new THREE.Group(); head.position.set(0, 0.18, 0.1); neck.add(head);
  const sk = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10), blk); sk.scale.set(1, 0.92, 1.1); head.add(sk);
  const mz = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 0.13, 8), wht); mz.rotation.x = Math.PI / 2; mz.position.set(0, -0.03, 0.12); head.add(mz);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), pink); nose.position.set(0, -0.015, 0.19); head.add(nose);
  const blaze = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 0.02), wht); blaze.position.set(0, 0.03, 0.085); blaze.rotation.x = -0.4; head.add(blaze);
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, 4), blk); e.position.set(sx * 0.055, 0.08, -0.01); e.rotation.set(-0.3, 0, sx * -0.5); head.add(e); }
  const tail = new THREE.Group(); tail.position.set(0, 0.04, -0.34); body.add(tail);
  const tm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.012, 0.32, 6), blk); tm.position.y = -0.14; tail.add(tm);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 5), wht); tip.position.y = -0.3; tail.add(tip);
  const legs = [];
  for (const [x, z, front] of [[-0.08, 0.24, 1], [0.08, 0.24, 1], [-0.08, -0.24, 0], [0.08, -0.24, 0]]) {
    const hip = new THREE.Group(); hip.position.set(x, -0.04, z); body.add(hip);
    const up = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.24, 7), front ? wht : blk); up.position.y = -0.12; up.castShadow = true; hip.add(up);
    const knee = new THREE.Group(); knee.position.y = -0.24; hip.add(knee);
    const lo = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.23, 6), wht); lo.position.y = -0.115; knee.add(lo);
    legs.push({ hip, knee, front });
  }
  (parent || SF_KIT_SCENE).add(g);
  const D = {
    g,
    pose(st, s) {
      const S = st.state;
      body.position.set(0, 0.5, 0); body.rotation.set(0, 0, 0); neck.rotation.set(0, 0, 0); head.rotation.set(0, 0, 0); tail.rotation.set(0.9, 0, 0);
      if (S === 'run') {
        const ph = st.d / 1.6 * 2 * Math.PI, a = Math.sin(ph), c = Math.cos(ph);
        body.position.y = 0.5 + 0.05 * Math.abs(c); body.rotation.x = 0.12 * a;
        legs.forEach((l, i) => { const k = l.front ? a : -a; l.hip.rotation.x = 0.8 * k; l.knee.rotation.x = l.front ? -0.5 - 0.4 * Math.max(0, -k) : 0.7 + 0.4 * Math.max(0, k); });
        tail.rotation.x = 1.4 + 0.2 * Math.sin(ph * 2); neck.rotation.x = 0.25; return;
      }
      if (S === 'lie') {   // lying pressed down, the head on the paws, ears flat (frightened)
        body.position.y = 0.16; legs.forEach((l) => { l.hip.rotation.x = l.front ? 1.45 : -1.3; l.knee.rotation.x = l.front ? 0.05 : 0.2; });
        neck.rotation.x = 0.9; head.rotation.x = -0.55; tail.rotation.x = 1.55; tail.rotation.z = 0.5; return;
      }
      if (S === 'sit') { body.rotation.x = -0.65; body.position.y = 0.34; legs.forEach((l) => { l.hip.rotation.x = l.front ? 0.62 : -0.9; l.knee.rotation.x = l.front ? 0 : 1.8; }); neck.rotation.x = -0.5; tail.rotation.x = 1.6; return; }
      legs.forEach((l) => { l.hip.rotation.x = 0; l.knee.rotation.x = 0; }); neck.rotation.x = 0.1 + 0.1 * Math.sin(s * 0.7); head.rotation.y = 0.4 * Math.sin(s * 0.5);
    },
  };
  return D;
}

// ---------------------------------------------------------------------------------------------------------------------
// THE BATS: instanced (a body and two wings each); flapping; the fallen ones lie on the ground with their wings out
// ---------------------------------------------------------------------------------------------------------------------
function sfBats(scene) {
  const n = SFBAT.length, m = sfStd('#2a221e', 0.9, 0, { side: THREE.DoubleSide });
  const body = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.025, 0.06, 3, 6), m, n);
  const wg = new THREE.BufferGeometry();
  // a wing: a membrane from the body out to the wrist and the tip, scalloped at the back
  wg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.04, 0.15, 0.01, 0.03, 0, 0, -0.03, 0.15, 0.01, 0.03, 0.21, -0.01, -0.03, 0, 0, -0.03, 0.15, 0.01, 0.03, 0.17, 0, -0.06, 0.21, -0.01, -0.03, 0, 0, -0.03, 0.21, -0.01, -0.03, 0.09, -0.005, -0.07], 3));
  wg.computeVertexNormals();
  const wl = new THREE.InstancedMesh(wg, m, n), wr = new THREE.InstancedMesh(wg, m, n);
  for (const q of [body, wl, wr]) { q.frustumCulled = false; q.castShadow = false; scene.add(q); }
  const o = new THREE.Object3D(), w = new THREE.Object3D(), Z = new THREE.Matrix4().makeScale(0, 0, 0);
  return {
    body, wl, wr,
    update(s) {
      for (let i = 0; i < n; i++) {
        const b = SFBAT[i], a = sfBatAt(b, s);
        if (a.state === 'gone') { body.setMatrixAt(i, Z); wl.setMatrixAt(i, Z); wr.setMatrixAt(i, Z); continue; }
        o.position.set(a.p[0], a.p[1], a.p[2]); o.rotation.set(0, a.yaw, 0); o.scale.setScalar(1);
        let flap = 0;
        if (a.state === 'fly') flap = Math.sin(s * b.flap * 2 * Math.PI + b.seed * 9) * 0.9;
        else if (a.state === 'fall') { o.rotation.set(s * 7 + b.seed * 4, a.yaw, s * 5); flap = 0.4 * Math.sin(s * 30); }
        else { o.rotation.set(0, a.yaw, 0); o.position.y += 0.01; flap = -0.05; }
        o.updateMatrix();
        const mb = new THREE.Matrix4().copy(o.matrix).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
        body.setMatrixAt(i, mb);
        for (const [mesh, sd] of [[wl, -1], [wr, 1]]) {
          w.position.set(0, 0, 0); w.rotation.set(0, sd < 0 ? Math.PI : 0, sd * flap, 'YZX'); w.scale.set(1, 1, sd < 0 ? -1 : 1); w.updateMatrix();
          mesh.setMatrixAt(i, new THREE.Matrix4().copy(o.matrix).multiply(w.matrix));
        }
      }
      for (const q of [body, wl, wr]) q.instanceMatrix.needsUpdate = true;
    },
  };
}
