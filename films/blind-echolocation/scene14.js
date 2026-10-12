/* =====================================================================
   SCENE 14 — "The last question". The bedroom of the opening, months later: the same morning sun, the same phone,
   the same door. She knows the room now.
     Z1  "So, what if you went blind? … your surroundings.": the alarm rings on the bedside table, as it did in the first
         seconds of the film; her hand goes straight to it, silences it and sets it back down, square on the table
     Z2  "Your life would change… all of them.": she walks to the door (her fingertips brush the dresser's corner on the
         way, a landmark); her hand finds the lever without searching
     Z3  "But echolocation reveals… the smallest signals.": a restrained sound view: only the room's small sounds (the
         clock, a bird at the window, the street, a neighbour's steps beyond the door) and her hand on the lever
     Z4  "And maybe that's the most incredible part… how to notice.": the door opens on the warm hallway; she steps onto
         the threshold and unfolds her cane (three snaps), its tip on the floor
     Z5  (no narration) the opening's own view from the bed: she stands in the doorway; one click; the hall answers at
         once (real time: no travelling front); the picture fades while the music finishes
   ===================================================================== */
BE.q14 = { ring: BE.s14 + 0.05, pick: BE.s14 + 0.85, off: BE.s14 + 1.15, put: BE.s14 + 2.15, let: BE.s14 + 2.45 };
BE.z2 = bnE(14, 'life').start - 1.4;
BE.qWalk = [BE.z2 - 0.55, bnE(14, 'and').start - 0.25];
BE.qLever = BE.qWalk[1] + 0.9;
BE.z3 = bnE(14, 'but').start - 0.25;
BE.z4 = bnE(14, 'maybe').start - 0.4;
BE.qOpen = [BE.z4 + 0.25, BE.z4 + 2.4];
BE.qStep = [BE.z4 + 2.6, BE.z4 + 3.9];
BE.qSnap = [BE.z4 + 4.45, BE.z4 + 4.7, BE.z4 + 4.95];
BE.qTip = BE.z4 + 5.4;
BE.z5 = BN_CLIP[14].speechEnd + 0.15;
BE.qClick = BE.z5 + 1.0;
// the neighbour's steps in the hall beyond the door (Z3), left to right
BE.qNb = beEvery(BE.z3 + 2.3, BE.z3 + 5.6, 0.55, 0.03, 14);

const BE_Q = {
  P0: new THREE.Vector3(-1.0, 0, -1.3),           // at the bedside table
  D: new THREE.Vector3(-1.24, 0, 1.6),            // at the door
  T: new THREE.Vector3(-1.2, 0, 2.3),             // on the threshold
  table: new THREE.Vector3(-1.15, BE_APT.nightH, -1.7),
  corner: new THREE.Vector3(-1.76, 0.87, 0.33),   // the dresser's front corner (her landmark)
  lever: new THREE.Vector3(-1.49, 1.03, 2.05),
};
// the path from the table to the door (a gentle curve past the dresser's corner)
const BE_Q_WALK = (() => {
  const a = BE_Q.P0, c = new THREE.Vector3(-1.42, 0, -0.1), b = BE_Q.D;
  return gbWalkPlan((u) => new THREE.Vector3((1 - u) * (1 - u) * a.x + 2 * u * (1 - u) * c.x + u * u * b.x, 0, (1 - u) * (1 - u) * a.z + 2 * u * (1 - u) * c.z + u * u * b.z),
    () => 0, BE.qWalk[0], BE.qWalk[1], 0.42, { first: 'R', lat: 0.09, ease: beEaseWalk(0.18, 0.2) });
})();
const BE_Q_STEP = gbWalkPlan((u) => new THREE.Vector3().lerpVectors(BE_Q.D, BE_Q.T, u), () => 0, BE.qStep[0], BE.qStep[1], 0.36, { first: 'R', lat: 0.09, ease: Ease.inOutSine });
// the door: closed until she presses the lever, then it swings open into the hall
function beDoor14(t) { return -1.45 * Ease.outCubic(MathX.ramp(t, BE.qOpen[0], BE.qOpen[1])); }
// the phone through Z1: buzzing on the table → in her hand → set down square
function bePhone14(t, H) {
  const B = BE.q14, A = BE_APT, P = A.phone0.clone(), R = new THREE.Euler(0, 0.35, 0);
  if (t < B.pick) { const bz = t > B.ring && t < B.off ? FILM._app.cast.buzz(t - B.ring) : 0; P.x += 0.0012 * bz * Math.sin(t * 190); P.z += 0.0009 * bz * Math.cos(t * 170); return { P, R }; }
  if (t < B.let) { const hp = H.worldOf('RHand'); return { P: hp.add(new THREE.Vector3(0, -0.03, 0)), R: new THREE.Euler(0, 0.2 + 0.15 * MathX.ramp(t, B.pick, B.put), 0) }; }
  P.set(-1.15, A.nightH + 0.0045, -1.7); R.set(0, 0.0, 0);
  return { P, R };
}

BE_SET_BUILDERS.push((app) => {
  const set = app.sets.apt, R = set.root;
  // her cane: folded (a bundle of four white sections, the red band at the bottom, an elastic) until the threshold
  const fold = set.caneFold = new THREE.Group(); fold.name = 'caneFolded'; set.scene.add(fold);
  const white = gbMat('#f4f4f2', { rough: 0.35, name: 'beCaneShaftMetal' }), red = gbMat('#c23a32', { rough: 0.4, name: 'beCaneBandMetal' }), blk = gbMat('#1d1f24', { rough: 0.8, name: 'beCaneGripRubber' });
  [[-0.008, -0.008], [0.008, -0.008], [-0.008, 0.008], [0.008, 0.008]].forEach(([x, z], i) => gbAdd(fold, new THREE.CylinderGeometry(0.0062, 0.0062, 0.3, 8), i === 3 ? red : white, x, 0, z, { cast: false }));
  gbAdd(fold, new THREE.CylinderGeometry(0.012, 0.012, 0.1, 10), blk, 0, 0.19, 0, { cast: false });
  beAcousticScene(fold, 'hero'); fold.visible = false;
  set.cane14 = beCane(set.scene); set.cane14.visible = false;
  // the warm hallway the open door lets in (off until scene 14's door moves; short reach so it lights the doorway, not the room)
  set.warm14 = new THREE.PointLight('#ffc48a', 0, 3.6, 1.4); set.warm14.position.set(-1.2, 2.0, 3.1); set.scene.add(set.warm14);
  void R;
});

// the hero through scene 14 (the cardigan look of scenes 3–13)
function beHeroS14(H, t, set, C) {
  const B = BE, Q = BE_Q, q = B.q14;
  H.root.visible = true;
  const breath = 1.2 * Math.sin(t * 2 * Math.PI * 0.24);
  let P = Object.assign({}, GB_POSES.standListen), F = Object.assign({}, GB_FACES.calm), look = { x: 0, y: -0.2 }, feet, yaw, pos;
  const yT = Math.atan2(Q.table.x - Q.P0.x, Q.table.z - Q.P0.z);
  if (t < B.qWalk[0] + 0.05) {
    // Z1: at the table
    pos = Q.P0; yaw = yT;
    H.place(pos.x, 0, pos.z, yaw);
    // she bends to the table to take the phone and to set it down; upright while she silences it
    const bend = MathX.window(t, q.ring + 0.1, q.let + 0.5, 0.5, 0.6) * (1 - 0.65 * MathX.window(t, q.pick + 0.2, q.put - 0.25, 0.2, 0.3));
    P = Object.assign(P, { pelX: 12 * bend, spX: 6 + 16 * bend, chX: 6 + 6 * bend, hdX: 10 + 8 * bend, hdY: -14 * MathX.smooth(t, q.let + 0.8, q.let + 1.6) });
    feet = { L: { p: H.root.localToWorld(new THREE.Vector3(0.1, 0, 0.02)), swing: 0 }, R: { p: H.root.localToWorld(new THREE.Vector3(-0.1, 0, -0.03)), swing: 0 } };
  } else if (t < B.qWalk[1]) {
    // Z2: the walk; she turns out of the table first
    const s = BE_Q_WALK.sOfT(t), a = BE_Q_WALK.atS(s); pos = a.p;
    const yPath = Math.atan2(a.d.x, a.d.z), k = MathX.smooth(t, B.qWalk[0], B.qWalk[0] + 0.9);
    yaw = yT + (((yPath - yT + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * k;
    H.place(pos.x, 0, pos.z, yaw);
    const walking = MathX.window(t, B.qWalk[0], B.qWalk[1], 0.4, 0.5), ph = (s / 0.84) * Math.PI * 2;
    P.LShX = (P.LShX || 0) + 8 * walking * Math.sin(ph); P.RShX = (P.RShX || 0) - 8 * walking * Math.sin(ph); P.chY = 3 * walking * Math.sin(ph);
    feet = gbFeetAt(BE_Q_WALK, t, 0.05);
  } else if (t < B.qStep[0]) {
    // at the door
    pos = Q.D; yaw = 0; H.place(pos.x, 0, pos.z, yaw);
    P.hdY = 16 * Math.sin((t - B.z3) * 0.5) * MathX.window(t, B.z3 + 1.5, B.z4, 1, 1) - 10 * MathX.window(t, B.qNb[0] - 0.4, B.qNb[B.qNb.length - 1] + 0.5, 0.5, 0.8);
    P.hdZ = 6 * MathX.window(t, B.qNb[0] - 0.4, B.qNb[B.qNb.length - 1] + 0.5, 0.5, 0.8);
    feet = { L: { p: H.root.localToWorld(new THREE.Vector3(0.1, 0, 0.02)), swing: 0 }, R: { p: H.root.localToWorld(new THREE.Vector3(-0.1, 0, -0.03)), swing: 0 } };
  } else {
    // Z4–Z5: onto the threshold, the cane
    const s = BE_Q_STEP.sOfT(t); pos = BE_Q_STEP.atS(s).p; yaw = 0; H.place(pos.x, 0, pos.z, yaw);
    feet = gbFeetAt(BE_Q_STEP, t, 0.05);
    P.hdY = -14 * MathX.window(t, B.qTip + 0.6, B.z5 + 0.2, 0.6, 0.8) + 8 * MathX.window(t, B.z5 - 0.6, B.qClick + 1.5, 0.5, 1);
    if (t > B.qSnap[2] + 0.2) beCaneArm(H, P);
  }
  P.chX = (P.chX || 0) - breath; P.LShrug = breath * 0.002; P.RShrug = breath * 0.002;
  gbStandOn(H, P, feet, { bend: 0.04 });
  H.applyPose(P);
  H.root.updateMatrixWorld(true);
  // ---- the right hand
  if (t < B.qWalk[0] + 0.3) {
    // the phone: reach, lift a little, the thumb on the side button, set it down square, the hand comes back
    const ph = Q.table.clone().setY(BE_APT.nightH + 0.03), lift = new THREE.Vector3(-1.08, 0.86, -1.52);
    let wt = ph.clone(), w = MathX.window(t, q.ring + 0.15, q.let + 0.9, 0.5, 0.6);
    wt.lerp(lift, MathX.smooth(t, q.pick + 0.05, q.pick + 0.35) * (1 - MathX.smooth(t, q.off + 0.2, q.put)));
    H.solveArm('R', wt.add(new THREE.Vector3(0.02, 0.02, 0.05)), new THREE.Vector3(0.4, -1, 0.2).normalize(), w);
    H.orientHand('R', new THREE.Vector3(-0.3, 0, -1).normalize(), new THREE.Vector3(0, -1, 0), w);
    const grip = MathX.window(t, q.pick - 0.12, q.let, 0.12, 0.12);
    H.handR.fingers.forEach(([f1, f2]) => { f1.rotation.z = -H.handR.pn * (0.15 + 0.6 * grip); f2.rotation.z = -H.handR.pn * (0.1 + 0.55 * grip); });
  } else if (t < B.qWalk[1]) {
    // passing the dresser: the fingertips brush its corner (a landmark), then the arm swings on
    const hb = H.worldOf('RSh'), d = Math.hypot(hb.x - Q.corner.x, hb.z - Q.corner.z), w = MathX.clamp(1.6 - d * 2.2, 0, 1);
    if (w > 0.01) { H.solveArm('R', Q.corner.clone().add(new THREE.Vector3(0.04, 0.02, 0)), new THREE.Vector3(0.3, -1, -0.4).normalize(), w);
      H.orientHand('R', new THREE.Vector3(0, -0.2, 1).normalize(), new THREE.Vector3(-1, 0, 0), w); }
  } else if (t < B.qOpen[1] - 0.5) {
    // the lever: her hand finds it at once, rests on it, presses it, and pushes the door open (the leaf swings away)
    const w = MathX.smooth(t, B.qWalk[1] - 0.1, B.qLever) * (1 - MathX.smooth(t, B.qOpen[0] + 1.0, B.qOpen[1] - 0.5));
    const press = MathX.smooth(t, B.qOpen[0] - 0.25, B.qOpen[0]);
    let wt = Q.lever.clone().add(new THREE.Vector3(0.03, -0.03 * press, -0.03));
    if (t > B.qOpen[0]) { set.doorLeaf.updateMatrixWorld(true); const e = set.doorLeaf.localToWorld(new THREE.Vector3(-0.33, 1.02, -0.05)); wt.lerp(e, MathX.smooth(t, B.qOpen[0], B.qOpen[0] + 0.3)); }
    H.solveArm('R', wt, new THREE.Vector3(0.2, -1, -0.3).normalize(), w);
    H.orientHand('R', new THREE.Vector3(-0.2, -0.3 * press, 1).normalize(), new THREE.Vector3(0, -1, 0), w);
    const grip = w * (0.4 + 0.5 * press);
    H.handR.fingers.forEach(([f1, f2]) => { f1.rotation.z = -H.handR.pn * grip; f2.rotation.z = -H.handR.pn * grip * 0.9; });
  } else if (t > B.qSnap[0] - 0.5 && t < B.qSnap[2] + 0.4) {
    // unfolding: the right hand takes the handle end and draws it out (the sections snap together)
    const lh = H.worldOf('LHand'), u = MathX.smooth(t, B.qSnap[0] - 0.5, B.qSnap[2]);
    const wt = lh.clone().add(new THREE.Vector3(-0.06 - 0.1 * u, 0.12 + 0.18 * u, 0.06));
    H.solveArm('R', wt, new THREE.Vector3(0.3, -1, -0.2).normalize(), MathX.window(t, B.qSnap[0] - 0.5, B.qSnap[2] + 0.4, 0.3, 0.3));
  }
  // ---- the left hand: the folded cane, carried low at her side; in front of her to unfold it
  if (t < B.qSnap[2] + 0.1) {
    const w = MathX.window(t, B.qSnap[0] - 0.7, B.qSnap[2] + 0.1, 0.4, 0.05);
    if (w > 0.01) { const f = H.root.localToWorld(new THREE.Vector3(0.05, 1.0, 0.32)); H.solveArm('L', f, new THREE.Vector3(-0.3, -1, -0.2).normalize(), w); }
    H.handL.fingers.forEach(([f1, f2]) => { f1.rotation.z = -H.handL.pn * 1.0; f2.rotation.z = -H.handL.pn * 0.9; });
  }
  // ---- the face: calm, a small smile when the door opens
  const wm = MathX.smooth(t, B.qOpen[0] + 0.6, B.qOpen[1] + 0.6), wm2 = MathX.smooth(t, B.qTip - 0.2, B.qTip + 0.8);
  F.smile = 0.18 + 0.17 * wm + 0.2 * wm2; F.low = MathX.lerp(F.low, 0.4, wm); F.lid = MathX.lerp(F.lid, 0.36, wm);
  F.browAng = MathX.lerp(F.browAng, 0.05, wm); F.browY = MathX.lerp(F.browY, 0.12, wm);
  const cl = MathX.window(t, B.qClick - 0.12, B.qClick + 0.1, 0.08, 0.1);
  F.open = Math.max(F.open || 0, 0.12 * cl); if (cl > 0.01) F.width = 0.85;
  F.blink = [B.s14 + 3.2, B.qWalk[1] + 0.6, B.z3 + 3.4, B.qOpen[1] + 0.2, B.z5 + 0.4].reduce((m, b) => Math.max(m, MathX.window(t, b, b + 0.16, 0.06, 0.08)), 0);
  H.applyFace(F, look);
  // ---- the props: the phone, the cane
  const ph = bePhone14(t, H); C.phone.position.copy(ph.P); C.phone.rotation.copy(ph.R);
  C.phoneScreenM.emissiveIntensity = t > q.ring && t < q.off ? 1.1 : 0;
  const fold = set.caneFold, cane = set.cane14;
  fold.visible = t < B.qSnap[2];
  if (fold.visible) { const lh = H.worldOf('LHand'); fold.position.copy(lh).add(new THREE.Vector3(0, -0.02, 0)); fold.quaternion.copy(H.J.LWr ? H.J.LWr.getWorldQuaternion(new THREE.Quaternion()) : new THREE.Quaternion()); fold.rotateX(Math.PI / 2 * 0.9); }
  cane.visible = t >= B.qSnap[0];
  if (cane.visible) {
    if (t < B.qTip) {
      // drawn out section by section, hanging from the right hand
      const len = (1 + B.qSnap.filter((s) => t >= s).length) / 4, hand = H.worldOf('RWr').add(new THREE.Vector3(0, -0.06, 0));
      const dir = new THREE.Vector3(0.15, -1, 0.45).normalize(), L = cane.userData.L * len;
      cane.scale.set(1, len, 1); cane.position.copy(hand).addScaledVector(dir, L * 0.95); cane.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().negate());
      if (t > B.qSnap[2] + 0.1) { const k = MathX.smooth(t, B.qSnap[2] + 0.1, B.qTip); cane.scale.set(1, 1, 1); const tip = beCaneUpdate(cane, H, 0, { lift: 0.25 * (1 - k) }); void tip; }
    } else { cane.scale.set(1, 1, 1); beCaneUpdate(cane, H, 0, {}); }
  }
}

// the scene's sound view: the room's small sounds (Z3) and the click's answer (Z5)
function beFx14(app, set, t, shot) {
  const R = set.rings, RX = set.ringsX, B = BE;
  if (shot.id === 'Z3') {
    const ck = app._beB7.ck;
    R.source(ck, beEvery(Math.ceil(B.z3), B.z4 + 1, 1).filter((x) => x <= t), t, { r: 0.12, a: 0.85, dur: 0.8, th: 0.06 });
    RX.source(new THREE.Vector3(2.7, 1.0, -0.4), beEvery(B.z3 + 0.6, B.z4, 0.45, 0.05, 9).filter((x) => x <= t), t, { r: 0.6, a: 0.35, col: '#9a7cff', dur: 1.2, th: 0.05 });
    for (const s of B.qNb) if (t > s && t < s + 1.0) RX.source(new THREE.Vector3(-3.0 + 1.2 * (s - B.qNb[0]), 0.05, 3.0), [s], t, { r: 0.35, a: 0.7, dur: 0.9, th: 0.07, squash: 0.45 });
    for (const tb of [B.z3 + 1.2, B.z3 + 1.45, B.z3 + 4.6]) if (t > tb && t < tb + 0.8) RX.source(new THREE.Vector3(2.45, 1.7, -0.9), [tb], t, { r: 0.22, a: 0.6, dur: 0.8, th: 0.06 });
    R.source(BE_Q.lever.clone(), [B.z3 + 5.6], t, { r: 0.06, a: 0.8, dur: 0.6, col: '#9ff6ff', th: 0.08 });
  }
}

BE_SCHEDULERS.push((app) => {
  const P = app.pulses, B = BE, set = app.sets.apt, H = set.hero2;
  // Z3: the lever under her fingers (a tiny contact), the neighbour's steps beyond the door (amber, low)
  P.add({ t: B.z3 + 5.6, p: BE_Q.lever.clone(), kind: 0, speed: 1.4, w: 0.03, life: 0.5, str: 0.35, set: 'apt', shot: 'Z3' });   // her fingers settle on the lever
  for (const s of B.qNb) P.add({ t: s, p: new THREE.Vector3(-3.0 + 1.2 * (s - B.qNb[0]), 0.05, 3.0), kind: 1, speed: 2.5, w: 0.06, life: 0.9, str: 0.8, set: 'apt', shot: 'Z3' });
  for (let t = Math.ceil(B.z3); t < B.z4; t += 1) P.add({ t, p: app._beB7.ck.clone(), kind: 1, speed: 0.9, w: 0.03, life: 0.9, str: 0.6, set: 'apt', shot: 'Z3' });
  // Z5: the click. In real time its answer is back from the hall's far wall in ≈ 9 ms and from the room behind her in
  // ≈ 25 ms: the surfaces light almost together and fade (no travelling front)
  beHeroS14(H, B.qClick, set, app.cast); const m = beMouth(H);
  P.add({ t: B.qClick, p: m, kind: 0, speed: 60, w: 0.5, life: 2.4, str: 2.0, set: 'apt', shot: 'Z5' });
});

// ---- the shots
(function () {
  const V = (x, y, z) => new THREE.Vector3(x, y, z), B = BE, Q = BE_Q;
  const H = () => FILM._app.sets.apt.hero2;
  // the opening's own view from the bed (t ≈ 2 s): eye, yaw, pitch
  const eye = V(-0.36, 1.112, -1.44), yaw0 = -0.786, pit0 = -0.017, dir = (y, p) => V(Math.sin(y) * Math.cos(p), Math.sin(p), Math.cos(y) * Math.cos(p));
  const S = [
    // Z1: over her right shoulder, down to the bedside table (the phone where it rang in the opening)
    { id: 'Z1', t0: B.s14, t1: B.z2, set: 'apt', look: () => BE_REAL,
      cam: beMove(B.s14, B.z2, [V(0.38, 1.42, -1.78), V(-1.08, 0.98, -1.52), 50], [V(0.3, 1.46, -1.66), V(-1.1, 1.06, -1.42), 46], { dof: 0.5, focus: (t, p) => p.distanceTo(V(-1.12, 0.8, -1.6)) }) },
    // Z2: the walk to the door, from the window side (the dresser and the door beyond her)
    { id: 'Z2', t0: B.z2, t1: B.z3, set: 'apt', look: () => BE_REAL,
      cam: (t) => { const h = H().root.position, k = Ease.inOutSine(MathX.ramp(t, B.z2, B.z3)); const pos = V(0.95 - 0.25 * k, 1.42, -0.85 + 1.25 * k);
        const at = V(MathX.lerp(-1.3, h.x, 0.7), 1.12, MathX.lerp(0.2, h.z, 0.7)); return { pos, at, fov: 46, focus: pos.distanceTo(h) , dof: 0.5 }; } },
    // Z3: the sound view: the room's small sounds, her hand on the lever
    { id: 'Z3', t0: B.z3, t1: B.z4, set: 'apt', decay: 0.6, gain: 1.3, heroGain: 0.7,
      look: (t) => { const k = MathX.smooth(t, B.z3, B.z3 + 0.6) * (1 - MathX.smooth(t, B.z4 - 0.4, B.z4)); return { ac: k, world: MathX.lerp(1, 0.0, k), hero: MathX.lerp(1, 0.22, k), glow: MathX.lerp(1, 0.05, k) }; },
      cam: beMove(B.z3, B.z4, [V(0.32, 1.5, 0.12), V(-0.38, 1.42, 2.1), 56], [V(0.2, 1.48, 0.4), V(-0.45, 1.4, 2.1), 52], { dof: 0 }) },
    // Z4: the door opens on the warm hall; she steps onto the threshold, unfolds the cane
    { id: 'Z4', t0: B.z4, t1: B.qSnap[0] - 0.35, set: 'apt', look: () => BE_REAL,
      cam: beMove(B.z4, B.qSnap[0] - 0.35, [V(-0.72, 1.45, -0.2), V(-1.32, 1.2, 3.0), 50], [V(-0.8, 1.42, 0.3), V(-1.3, 1.15, 3.2), 46], { dof: 0.4, focus: (t, p) => p.distanceTo(H().root.position) }) },
    // Z4b: from the hallway, facing her in the warm light: the cane unfolds, the tip finds the floor, she smiles
    { id: 'Z4b', t0: B.qSnap[0] - 0.35, t1: B.z5, set: 'apt', look: () => BE_REAL,
      cam: beMove(B.qSnap[0] - 0.35, B.z5, [V(1.15, 1.3, 3.3), V(-1.25, 0.9, 2.8), 50], [V(0.95, 1.32, 3.32), V(-1.25, 0.95, 2.82), 45], { dof: 0.3, focus: (t, p) => p.distanceTo(H().root.position) }) },
    // Z5: the opening's view from the bed; the click; the answer; the fade
    { id: 'Z5', t0: B.z5, t1: 1e9, set: 'apt', decay: 1.2, gain: 1.7, heroGain: 0.8,
      look: (t) => { const k = MathX.smooth(t, B.qClick - 0.02, B.qClick + 0.12); return { ac: k, world: MathX.lerp(1, 0.4, k), hero: MathX.lerp(1, 0.6, k), glow: MathX.lerp(1, 0.45, k) }; },
      cam: (t) => { const k = Ease.inOutSine(MathX.ramp(t, B.z5, B.end)), p = eye.clone().add(dir(yaw0, pit0).multiplyScalar(0.3 * k)); return { pos: p, at: p.clone().add(dir(yaw0 + 0.06 * k, pit0)), fov: 62 - 4 * k, focus: 3.5, dof: 0.2 }; } },
  ];
  const i = BE_SHOTS.findIndex((s) => s.id === 'X');
  BE_SHOTS.splice(i, 1, ...S);
})();
