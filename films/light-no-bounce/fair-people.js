/* =====================================================================
   FAIR PEOPLE — the crowd round you (the shared rig near you, simple figures further off), the bear mascot who blunders
   towards you in the dark, the fire juggler, and you (seen only in the mirror). Every pose is a pure function of story
   time s. In the dark nobody can be seen: a body shows only where it hides a light; phones' screens and torches are
   sources (they stay), and the people who switch their torches on see nothing lit by them.
     nbBuildPeople(S, W) → { update(s, cam), lamps(L, s), bear, juggler, you, torches(fx, s) }
   ===================================================================== */

Object.assign(LOOKS, {
  nbFriend: { skin: 3, build: 'slim', shirt: '#e8a83a', sleeves: 'long', pants: '#22262c', shoes: '#e8e4dc', sole: '#f2f0ea', hair: '#141010', hairStyle: 'long', jacket: true },
  nbBear: { skin: 0, build: 'broad', shirt: '#7a4a26', sleeves: 'long', pants: '#7a4a26', shoes: '#3a2010', sole: '#2a1a0c', hair: '#7a4a26' },
  nbJuggler: { skin: 2, build: 'slim', shirt: '#1e1c22', sleeves: 'long', pants: '#1e1c22', shoes: '#111', sole: '#222', hair: '#2a1a12', hat: { type: 'beanie', color: '#c8324a' } },
});
Object.assign(NB_POSES, {
  film: () => { const p = basePose(); p.rSh = [1.55, -0.12]; p.rEl = 0.55; p.lSh = [0.25, 0.15]; p.lEl = 0.4; p.neck = -0.12; return p; },        // holding a phone up, filming
  grope: (ph = 0) => { const p = basePose(); p.lSh = [1.25 + 0.1 * Math.sin(ph), 0.35]; p.rSh = [1.2 - 0.1 * Math.sin(ph), 0.32]; p.lEl = 0.35; p.rEl = 0.4; p.spine = 0.06; p.neck = 0.05; p.lKnee = 0.12; p.rKnee = 0.12; return p; },
  juggle: (ph) => { const p = basePose(), a = Math.sin(ph), b = Math.cos(ph); p.lSh = [0.75 + 0.25 * a, 0.18]; p.rSh = [0.75 - 0.25 * a, 0.18]; p.lEl = 1.25 + 0.2 * b; p.rEl = 1.25 - 0.2 * b; p.neck = -0.28; p.spine = -0.04; return p; },
  freeze: () => { const p = basePose(); p.lSh = [0.45, 0.25]; p.rSh = [0.5, 0.25]; p.lEl = 0.9; p.rEl = 0.85; p.neck = -0.05; p.lKnee = 0.12; p.rKnee = 0.1; return p; },
});

// the bear's walk (x, z, facing; a pose): along the path towards you, startled still in the dark, then groping across in
// front of you (between you and the stalls' lights) and, from 3:30:05, turning to the sound of you and shuffling closer
const NB_BEAR_K = [
  // s, x, z, yaw (0 faces south, +z)
  [-12, 19.4, 1.75, -Math.PI / 2], [0.6, 3.02, 1.75, -Math.PI / 2], [1.3, 3.0, 1.75, -Math.PI / 2], [4.6, 0.12, 1.85, -Math.PI / 2 - 0.25],
  [5.6, -0.12, 1.8, -2.5], [6.4, -0.1, 1.72, Math.PI], [9.2, 0.06, 1.3, Math.PI - 0.06], [30, 0.06, 1.3, Math.PI - 0.06],
];
function nbBearAt(s) {
  const K = NB_BEAR_K; let i = 0; while (i < K.length - 2 && s >= K[i + 1][0]) i++;
  const a = K[i], b = K[i + 1], u = MathX.clamp((s - a[0]) / (b[0] - a[0]), 0, 1), e = i === 0 ? u : u * u * (3 - 2 * u);
  return { x: nbLerp(a[1], b[1], e), z: nbLerp(a[2], b[2], e), yaw: nbLerp(a[3], b[3], e), moving: i !== 1 && i < K.length - 2 && u < 1 ? 1 : 0, walk: i === 0 };
}

function nbBuildPeople(S, W) {
  const scene = S.scene, out = { people: [] }, r = new RNG(4242);
  const screenM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.7, 2.1) }), phoneM = nbStd('#1a1c20', 0.35, 0.4);
  const givePhone = (p) => { const g = new THREE.Group(); nbBox(0.072, 0.15, 0.009, phoneM, 0, 0, 0, g); const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.142), screenM); sc.position.z = 0.0052; g.add(sc);
    g.position.set(0, -0.08, 0.05); g.rotation.set(-1.2, 0, 0); p.j.ra.hand.add(g); p.phoneG = g; p.screen = sc; return g; };

  // ---- the crowd near you: on the main path, at the stalls' counters, round the carousel and the wheel's queue
  const looks = ['nbP1', 'nbP2', 'nbP3', 'nbP4', 'nbP5', 'nbP6', 'nbB1', 'nbB2', 'nbB3', 'nbB4', 'nbB5', 'nbB6'];
  const spots = [];
  for (let i = 0; i < 14; i++) spots.push({ x: r.range(-34, 46), z: r.range(-0.6, 3.9), walk: r.next() < 0.6 });
  for (const st of W.stalls) for (let k = 0; k < 2; k++) spots.push({ x: st.x + r.range(-2.2, 2.2), z: st.z - 2.2 - r.range(0, 1.4), yaw: Math.PI + r.range(-0.3, 0.3) });
  for (let k = 0; k < 6; k++) { const a = r.range(-0.6, 1.6); spots.push({ x: NB_F.carousel.c[0] + 9.6 * Math.cos(a), z: NB_F.carousel.c[2] + 9.6 * Math.sin(a), lookAt: NB_F.carousel.c }); }
  for (let k = 0; k < 4; k++) spots.push({ x: -20 - k * 1.1, z: 15.2 + 0.4 * k, yaw: Math.atan2(-1, 0.6) });
  spots.forEach((sp, i) => {
    if (Math.hypot(sp.x - NB_F.you[0], sp.z - NB_F.you[2]) < 2.2 && !sp.walk) sp.x += 3;
    const p = nbPerson(looks[i % looks.length], scene, { id: 'cr' + i }), ph = r.next() < 0.75 ? givePhone(p) : null;
    const yaw = sp.yaw ?? (sp.lookAt ? Math.atan2(sp.lookAt[0] - sp.x, sp.lookAt[2] - sp.z) : (sp.walk ? (r.next() < 0.5 ? Math.PI / 2 : -Math.PI / 2) : r.range(-Math.PI, Math.PI)));
    out.people.push({ p, ph, x: sp.x, z: sp.z, yaw, walk: !!sp.walk, v: r.range(1.1, 1.45), react: r.range(0.35, 1.2), up: r.next() < 0.6, torch: r.next() < 0.3 ? r.range(1.8, 6) : 99, k: i });
  });
  // keep the walkers off your spot and the bear's line
  out.people.forEach((q) => { if (q.walk && Math.abs(q.z - NB_F.you[2]) < 1.4) q.z = q.z < NB_F.you[2] ? NB_F.you[2] - 1.5 : NB_F.you[2] + 1.6; });

  // ---- further off: simple figures (a body and a head), most with a phone
  {
    const N = 300, bodyG = new THREE.CapsuleGeometry(0.21, 0.95, 3, 8), headG = new THREE.SphereGeometry(0.115, 10, 8);
    bodyG.translate(0, 0.21 + 0.475 + 0.08, 0); headG.translate(0, 1.58, 0);
    const iB = new THREE.InstancedMesh(bodyG, nbStd('#ffffff', 0.85), N), iH = new THREE.InstancedMesh(headG, nbStd('#c8967a', 0.7), N), m4 = new THREE.Matrix4(), c = new THREE.Color();
    const far = []; const rr = new RNG(77);
    for (let i = 0, tries = 0; i < N && tries < 6000; tries++) {
      const x = rr.range(-70, 75), z = rr.range(-30, 60);
      if (Math.hypot(x, z - 0.6) < 16) continue;                                                    // (the rigged crowd's zone)
      const zones = [[NB_F.wheel.c, 11], [NB_F.carousel.c, 8.6], [NB_F.dodgems.c, 12.5], [[38, 0, 34], 26], [[0, 0, -10], 10]];
      if (zones.some(([cc, rad]) => Math.hypot(x - cc[0], z - cc[2]) < rad)) continue;
      if (z > 8.5 && z < 13.5 && x > -10 && x < 34) continue;                                       // the stalls
      if (Math.abs(x) < 10 && z < -2) continue;                                                      // the Fun House
      if (z > 20 && x > -14 && x < 70) continue;                                                     // trucks, the coaster
      far.push({ x, z, ph: rr.next() < 0.6, k: i, s: rr.range(0.92, 1.08) });
      c.set(['#2f4a6a', '#b8462e', '#6a6052', '#3a7a6a', '#d9b84a', '#56465e', '#e2553a', '#2f8a5a', '#3a4a8a', '#c8463a', '#d97ab0', '#22262c'][i % 12]);
      m4.makeScale(1, far[far.length - 1].s, 1).setPosition(x, 0, z); iB.setMatrixAt(i, m4); iH.setMatrixAt(i, m4); iB.setColorAt(i, c); i++;
    }
    iB.count = iH.count = far.length;
    for (const m of [iB, iH]) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; scene.add(m); }
    out.far = far;
  }

  // ---- the bear mascot (a fur suit; the head a big bear's head; three balloons on strings)
  {
    const p = nbPerson('nbBear', scene, { id: 'bear' }), fur = nbStd('#7a4a26', 1.0), cream = nbStd('#e8d8b8', 0.95), black = nbStd('#0c0c0e', 0.25, 0.1);
    p.root.scale.setScalar(1.08);
    p.root.traverse((m) => { if (m.isMesh && m.material && m.material.color && m.parent && (m.parent === p.j.la.hand || m.parent === p.j.ra.hand)) m.material = fur; });
    for (const c of [...p.j.head.children]) c.visible = false;
    const H = new THREE.Group(); H.position.y = 0.08; p.j.head.add(H);
    nbMesh(new THREE.SphereGeometry(0.235, 24, 18), fur, 0, 0.04, 0, H).scale.set(1, 0.95, 0.95);
    for (const sx of [-1, 1]) { nbMesh(new THREE.SphereGeometry(0.085, 14, 10), fur, sx * 0.17, 0.22, -0.02, H).scale.set(1, 1, 0.55); nbMesh(new THREE.SphereGeometry(0.05, 12, 8), cream, sx * 0.17, 0.22, 0.02, H).scale.set(1, 1, 0.4);
      nbMesh(new THREE.SphereGeometry(0.028, 12, 8), black, sx * 0.085, 0.09, 0.2, H); nbMesh(new THREE.SphereGeometry(0.008, 6, 4), nbStd('#ffffff', 0.2), sx * 0.085 + 0.008, 0.1, 0.226, H); }
    nbMesh(new THREE.SphereGeometry(0.11, 18, 12), cream, 0, -0.02, 0.19, H).scale.set(1.1, 0.8, 0.9);
    nbMesh(new THREE.SphereGeometry(0.035, 12, 8), black, 0, 0.02, 0.29, H).scale.set(1.3, 0.9, 0.8);
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 16, Math.PI), black); smile.position.set(0, -0.045, 0.27); smile.rotation.z = Math.PI; H.add(smile);
    // a red bow tie, a cream tummy
    for (const sx of [-1, 1]) { const b = nbMesh(new THREE.ConeGeometry(0.06, 0.1, 4), nbStd('#c8202a', 0.6), sx * 0.05, 0.47, 0.12, p.j.spine); b.rotation.z = sx * Math.PI / 2; }
    nbMesh(new THREE.SphereGeometry(0.17, 16, 12), cream, 0, 0.2, 0.06, p.j.spine).scale.set(1, 1.2, 0.5);
    // the balloons: from his left paw on long strings (they bob in the breeze)
    const bal = new THREE.Group(); scene.add(bal); const strM = nbStd('#e8e8e8', 0.6), bcol = ['#e8202a', '#2a8ae8', '#f8d02a'];
    const balloons = bcol.map((c, i) => { const m = nbMesh(new THREE.SphereGeometry(0.21, 18, 14), nbStd(c, 0.25, 0.05), 0, 0, 0, bal); m.scale.set(1, 1.18, 1); return { m, str: nbMesh(new THREE.CylinderGeometry(0.003, 0.003, 1, 4), strM, 0, 0, 0, bal), i }; });
    out.bear = { p, balloons, H };
  }

  // ---- the fire juggler, on the grass by the stalls: three torches in a cascade (his flames: fx, in fair.js)
  {
    const J = NB_F.juggler, p = nbPerson('nbJuggler', scene, { id: 'jug' }); nbPose(p, NB_POSES.juggle(0), J[0], 0, J[2], Math.atan2(NB_F.you[0] - J[0], NB_F.you[2] - J[2]) + 0.35);
    const stickM = nbStd('#3a2a1e', 0.8), wickM = nbStd('#141210', 0.95), torches = [];
    for (let i = 0; i < 3; i++) { const g = new THREE.Group(); scene.add(g); nbCyl(0.016, 0.02, 0.55, stickM, 0, 0, 0, g, 8); nbCyl(0.04, 0.04, 0.09, wickM, 0, 0.3, 0, g, 10); torches.push(g); }
    out.juggler = { p, torches, period: 0.42, yaw: p.root.rotation.y };
  }

  // ---- you: only ever seen in the mirror (layer 1), filming yourself with your phone
  {
    const p = nbPerson('nbYou', scene, { id: 'you' }); nbPose(p, NB_POSES.film(), NB_F.you[0], 0, NB_F.you[2], Math.PI);
    givePhone(p); p.root.traverse((m) => m.layers.set(1));
    out.you = p;
  }

  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  out.update = (s) => {
    // the crowd: walkers stop dead in the dark; most hold their phones up (screens: sources); some turn their torches on
    for (const q of out.people) {
      const stop = Math.min(s, q.react), moving = q.walk && s < q.react, d = q.walk ? q.v * (stop + 20) : 0;
      const x = q.walk ? q.x + Math.sin(q.yaw) * (d - q.v * 20) : q.x, z = q.walk ? q.z + Math.cos(q.yaw) * (d - q.v * 20) : q.z;
      let pose;
      if (moving) pose = nbWalkPose(d / 1.32 * Math.PI * 2);
      else if (s < 0) pose = q.ph ? NB_POSES.phone() : NB_POSES.stand();
      else if (s < NBP.T + 0.3) pose = q.ph && q.up ? NB_POSES.film() : NB_POSES.freeze();
      else pose = q.ph ? NB_POSES.film() : NB_POSES.lookAround();
      if (s >= 0 && s < q.react + 0.6 && q.walk) pose = lerpPose(nbWalkPose(d / 1.32 * Math.PI * 2), pose, nbEase(s, q.react, q.react + 0.6));
      nbFidget(pose, s, q.k, s >= 0 && s < NBP.T ? 0.4 : 1);
      nbPose(q.p, pose, x, 0, z, q.yaw); q.px = x; q.pz = z;
    }
    // the bear
    { const B = out.bear, b = nbBearAt(s), pose = b.walk ? nbWalkPose(s * 1.3 / 1.32 * Math.PI * 2 * 1.0, 0.9) : (s < 0.6 ? basePose() : NB_POSES.grope(s * 2.1));
      if (s > NBP.T) { pose.lSh = [0.4, 0.3]; pose.rSh = [0.5, 0.3]; pose.neck = 0.1; }
      if (b.moving && !b.walk) { const ph = s * 2.4; pose.lHip = [0.22 * Math.sin(ph), 0.05]; pose.rHip = [-0.22 * Math.sin(ph), 0.05]; pose.lKnee = 0.1 + 0.3 * Math.max(0, Math.cos(ph)); pose.rKnee = 0.1 + 0.3 * Math.max(0, -Math.cos(ph)); }
      nbPose(B.p, pose, b.x, 0, b.z, b.yaw); B.p.root.updateMatrixWorld(true);
      B.p.j.la.hand.getWorldPosition(tmp);
      B.balloons.forEach((o) => { const a = o.i * 2.1 + s * 0.4, bx = tmp.x + 0.22 * Math.cos(a) + 0.08 * Math.sin(s * 1.1 + o.i), bz = tmp.z + 0.22 * Math.sin(a), by = tmp.y + 1.25 + 0.12 * o.i + 0.04 * Math.sin(s * 1.7 + o.i);
        o.m.position.set(bx, by, bz); tmp2.set((bx + tmp.x) / 2, (by - 0.24 + tmp.y) / 2, (bz + tmp.z) / 2); o.str.position.copy(tmp2);
        const L = Math.hypot(bx - tmp.x, by - 0.24 - tmp.y, bz - tmp.z); o.str.scale.set(1, L, 1); o.str.lookAt(bx, by - 0.24, bz); o.str.rotateX(Math.PI / 2); });
    }
    // the juggler: a three-torch cascade (each torch flies hand to hand, turning once)
    { const J = out.juggler, P0 = NB_F.juggler, yaw = J.yaw, T = J.period, fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
      nbPose(J.p, NB_POSES.juggle(s / T * Math.PI), P0[0], 0, P0[2], yaw);
      J.torches.forEach((g, i) => { const ph = ((s / T + i * 2 / 3) % 2 + 2) % 2, side = ph < 1 ? 1 : -1, u = ph % 1;   // left → right, then right → left
        const lat = side * nbLerp(0.28, -0.28, u), up = 1.22 + 4 * 0.95 * u * (1 - u), fwd = 0.38 + 0.08 * Math.sin(u * Math.PI);
        g.position.set(P0[0] + rx * lat + fx * fwd, up, P0[2] + rz * lat + fz * fwd); g.rotation.set(0, yaw, side * (u * Math.PI * 2 + 0.3)); g.updateMatrixWorld(); g.userData.u = u; });
    }
  };
  // phone screens far off and the torches (LEDs: sources that light nothing)
  out.lamps = (L, s) => {
    for (const q of out.far) { if (!q.ph) continue; const up = s >= 0 && s < NBP.T + 2 ? 1.0 : 0.6; L.add(q.x + 0.18, 1.3 + 0.25 * up * (q.k % 3 === 0 ? 1 : 0.4), q.z + 0.1, 0.05, 1.3, 1.5, 1.9);
      if (s > 2 + (q.k % 7) * 0.6 && s < NBP.T + 4 && q.k % 4 === 0) L.add(q.x + 0.2, 1.62, q.z + 0.2, 0.05, 6, 6, 5.5); }
    for (const q of out.people) { if (!q.ph || !(s > q.torch && s < NBP.T + 3)) continue; q.p.phoneG.updateMatrixWorld(); tmp.set(0, 0.06, -0.008).applyMatrix4(q.p.phoneG.matrixWorld); L.add(tmp.x, tmp.y, tmp.z, 0.03, 7, 7, 6.4); }
  };
  // the juggler's flames (additive soft points): long tongues streaming up off each wick, in slow motion
  out.flames = (fx, s) => {
    for (const g of out.juggler.torches) { const w = tmp.set(0, 0.32, 0).applyMatrix4(g.matrixWorld), wx = w.x, wy = w.y, wz = w.z;
      for (let i = 0; i < 46; i++) { const life = 0.22 + 0.18 * nbR(i, 3), ph = ((s / life + nbR(i, 4)) % 1 + 1) % 1, h = ph * (0.22 + 0.2 * nbR(i, 5));
        const a = nbR(i, 6) * 6.283, rad = 0.035 * (1 - ph) + 0.02 * ph * Math.sin(s * 23 + i);
        const hot = 1 - ph; fx.add(wx + Math.cos(a) * rad, wy + 0.03 + h, wz + Math.sin(a) * rad, 0.08 + 0.07 * hot, 0.55 * Math.pow(hot, 1.2) * Math.min(1, ph * 8), 1.0, 0.45 + 0.45 * hot * hot, 0.12 + 0.4 * hot * hot * hot); } }
  };
  return out;
}
