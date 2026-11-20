/* =====================================================================
   CAST — the people (the shared rig, js/world/people.js): you, Leo (six), the two people at the next campsite. Every
   body is posed as a pure function of time.
     LOOKS ekYou (a slate down jacket, khaki trousers, boots, a dark beanie) · ekLeo (a red hoodie, navy trousers,
     trainers) · ekNb1 / ekNb2 (a plaid shirt-jacket; a teal puffer, a ponytail)
     ekPerson(look, parent, o) → Person          EK_P_ poses: (k = 0…1 how far in, u = seconds) → pose
   ===================================================================== */

Object.assign(LOOKS, {
  ekYou: { skin: 1, build: 'avg', shirt: '#3e4a58', sleeves: 'long', pants: '#8a7a5a', shoes: '#4a3424', sole: '#1c1410', hair: '#3a2a1e', jacket: true, collar: true, inner: '#6c6e70', hat: { type: 'beanie', color: '#2a2e33' } },
  ekLeo: { skin: 0, build: 'slim', shirt: '#c8282a', sleeves: 'long', pants: '#25304a', shoes: '#e8e4dc', sole: '#9a9a96', hair: '#6a4426', hood: true },
  ekNb1: { skin: 2, build: 'broad', shirt: '#7a2e2a', sleeves: 'long', pants: '#3a3f46', shoes: '#3a2a1e', sole: '#1a1612', hair: '#2a1a12', jacket: true, collar: true, hat: { type: 'cap', color: '#3b3f44' } },
  ekNb2: { skin: 0, build: 'slim', shirt: '#2a7a7a', sleeves: 'long', pants: '#22262c', shoes: '#d8d4ca', sole: '#f0ede6', hair: '#9c7a4a', hairStyle: 'pony', jacket: true },
});
function ekPerson(look, parent, o = {}) {
  const p = new Person({ id: 'ek' + look + (o.id || ''), look }, null);
  p.j.body.scale.setScalar(o.bodyScale || 1);
  if (o.kid) { p.j.head.scale.multiplyScalar(1.22); }
  ekPersonNoZ(p);
  if (parent) parent.add(p.root);
  return p;
}
// (the engine's people have a few surfaces that share a plane: nudged here, per person, so nothing flickers)
function ekPersonNoZ(p) {
  const L = p.look, BG = PersonGeo.forBuild(L.build || 'avg', L);
  p.root.traverse((m) => {
    if (!m.isMesh) return; const g = m.geometry, q = g.parameters;
    if (g.type === 'BoxGeometry' && q.height === 0.035 && Math.abs(q.width - BG.B.waist * 1.02) < 1e-6) m.scale.set(1, 1.6, 1.08);
    else if (g.type === 'BoxGeometry' && q.width === 0.08 && q.depth === 0.01) m.position.z += L.shoulderBag ? 0.0015 : 0.004;
    else if (g.type === 'BoxGeometry' && q.width === 0.03 && q.depth === 0.012) m.position.z += 0.003;
    else if (L.coat && (g === BG.pelvis || g === BG.thigh)) m.scale.set(0.98, 1, 0.98);
  });
}
const ekSm = (u, a, b) => { const v = MathX.clamp((u - a) / (b - a), 0, 1); return v * v * (3 - 2 * v); };
function ekLerpPose(a, b, k) { return lerpPose(a, b, MathX.clamp(k, 0, 1)); }
const EK_P_ = {
  stand: (u, i = 0) => { const p = basePose(); const br = Math.sin(u * 1.6 + i); p.spine += br * 0.012; p.headYaw = 0.12 * noise1(u * 0.3, i + 2); return p; },
  // looking down at your feet (the head bent, the shoulders a little round)
  lookDown: (u) => { const p = basePose(); p.neck = 0.75; p.spine = 0.12; p.lSh = [0.1, 0.12]; p.rSh = [0.1, 0.12]; return p; },
  // your right hand held out in front of your chest, palm up (him on it); the left under it
  hold: (u) => { const p = basePose(); p.rSh = [0.75, -0.12]; p.rEl = 1.25; p.lSh = [0.45, 0.05]; p.lEl = 1.2; p.neck = 0.45; p.spine = 0.06; return p; },
  // bending down (the back hinged, the knees a little bent, the right arm reaching to the ground)
  bend: (u) => { const p = basePose(); p.pelvisPitch = 0.75; p.spine = 0.45; p.neck = 0.2; p.hipY = 0.86; p.lHip = [0.1, 0.05]; p.rHip = [0.1, 0.05]; p.lKnee = 0.45; p.rKnee = 0.45; p.lFoot = 0.2; p.rFoot = 0.2;
    p.rSh = [1.25, 0.05]; p.rEl = 0.15; p.lSh = [0.6, 0.15]; p.lEl = 0.4; return p; },
  // cupped hands round the mouth, calling out
  call: (u, k = 1) => { const p = basePose(); p.lSh = [1.05 * k + 0.05, -0.25 * k + 0.08]; p.rSh = [1.05 * k + 0.05, -0.25 * k + 0.08]; p.lEl = 0.18 + 2.05 * k; p.rEl = 0.18 + 2.05 * k; p.neck = 0.04 - 0.12 * k; p.spine = 0.03 - 0.05 * k; return p; },
  // kneeling up (on both knees), hands resting
  kneel: (u, i = 0) => { const p = basePose(); p.hipY = 0.52; p.lHip = [0.02, 0.08]; p.rHip = [0.02, 0.08]; p.lKnee = 1.62; p.rKnee = 1.62; p.lFoot = 0.55; p.rFoot = 0.55; p.spine = 0.12;
    p.lSh = [0.35, 0.12]; p.rSh = [0.35, 0.12]; p.lEl = 0.5; p.rEl = 0.5; p.neck = 0.3; return p; },
  // kneeling, both arms out and down to the sides: a hand on each mountain
  kneelHold: (u) => { const p = EK_P_.kneel(u); p.lSh = [0.55, 0.95]; p.rSh = [0.55, 0.95]; p.lEl = 0.35; p.rEl = 0.35; p.spine = 0.2; p.neck = 0.1; return p; },
  // kneeling, the right hand flat on the ground ahead
  kneelTouch: (u) => { const p = EK_P_.kneel(u); p.spine = 0.6; p.neck = 0.35; p.rSh = [1.1, 0.1]; p.rEl = 0.25; p.lSh = [0.5, 0.2]; p.lEl = 0.6; return p; },
  // floating, arms round something in front of you (k: how wide the arms: 1 = a hug round a big ball, 0 = in the hands)
  embrace: (u, k = 1) => { const p = basePose(); p.lSh = [1.25, 0.55 * k + 0.05]; p.rSh = [1.25, 0.55 * k + 0.05]; p.lEl = 0.4 + 1.0 * (1 - k); p.rEl = 0.4 + 1.0 * (1 - k); p.spine = 0.25; p.neck = 0.3;
    p.lHip = [0.3 + 0.1 * Math.sin(u * 0.5), 0.1]; p.rHip = [0.15 - 0.1 * Math.sin(u * 0.5), 0.08]; p.lKnee = 0.6; p.rKnee = 0.35; p.lFoot = -0.3; p.rFoot = -0.3; return p; },
  // lying along the ground, holding on (arms out, fingers in)
  cling: (u) => { const p = basePose(); p.lSh = [2.6, 0.5]; p.rSh = [2.6, 0.5]; p.lEl = 0.3; p.rEl = 0.3; p.neck = -0.5; p.lHip = [0.05, 0.12]; p.rHip = [0.05, 0.12]; p.lKnee = 0.25; p.rKnee = 0.15; p.lFoot = -0.4; p.rFoot = -0.4; return p; },
  // Leo: asleep (lying, curled), crawling, standing up, calling with his arms up, waving, sitting
  leoSleep: (u) => { const p = basePose(); p.hipY = 0.13; p.rootRoll = 1.5; p.lHip = [0.7, 0.05]; p.rHip = [0.6, 0.05]; p.lKnee = 1.0; p.rKnee = 0.9; p.spine = 0.25; p.neck = 0.2; p.lSh = [0.9, 0.1]; p.lEl = 1.2; p.rSh = [0.8, 0.1]; p.rEl = 1.3; return p; },
  crawl: (u) => { const ph = u * 4.5, s = Math.sin(ph); const p = basePose(); p.hipY = 0.45; p.pelvisPitch = 1.35; p.spine = 0.15; p.neck = -0.9;
    p.lHip = [1.45 + 0.25 * s, 0.1]; p.rHip = [1.45 - 0.25 * s, 0.1]; p.lKnee = 1.6; p.rKnee = 1.6; p.lSh = [1.35 - 0.3 * s, 0.1]; p.rSh = [1.35 + 0.3 * s, 0.1]; p.lEl = 0.1; p.rEl = 0.1; return p; },
  leoCall: (u, k = 1) => { const p = basePose(); const w = Math.sin(u * 7.5); p.lSh = [2.6 * k + 0.1 * w, 0.35]; p.rSh = [2.5 * k - 0.1 * w, 0.35]; p.lEl = 0.25; p.rEl = 0.3; p.neck = -0.65 * k; p.spine = -0.08 * k; p.mouth = 0.6; return p; },
  wave: (u) => { const p = basePose(); const w = Math.sin(u * 9); p.rSh = [2.7, 0.3 + 0.25 * w]; p.rEl = 0.35; p.lSh = [0.2, 0.15]; p.lEl = 0.3; p.neck = -0.7; return p; },
  sit: (u) => { const p = basePose(); p.hipY = 0.16; p.lHip = [1.6, 0.18]; p.rHip = [1.55, 0.15]; p.lKnee = 1.1; p.rKnee = 1.2; p.spine = -0.05; p.neck = -0.55; p.lSh = [0.2, 0.3]; p.rSh = [0.2, 0.3]; p.lEl = 0.2; p.rEl = 0.2; return p; },
  climb: (u) => { const ph = u * 3.2, s = Math.sin(ph); const p = basePose(); p.hipY = 0.55; p.pelvisPitch = 0.5; p.spine = 0.45; p.neck = 0.2;
    p.lHip = [1.1 + 0.4 * s, 0.1]; p.rHip = [1.1 - 0.4 * s, 0.1]; p.lKnee = 1.3 + 0.3 * s; p.rKnee = 1.3 - 0.3 * s; p.lSh = [1.6 + 0.4 * s, 0.2]; p.rSh = [1.6 - 0.4 * s, 0.2]; p.lEl = 0.6; p.rEl = 0.6; return p; },
  // the neighbours: screaming (arms up and back, the head back), crouching and holding on, backing away
  scream: (u, i = 0) => { const p = basePose(); const w = Math.sin(u * 2.3 + i); p.lSh = [2.2 + 0.3 * w, 0.45]; p.rSh = [2.0 - 0.3 * w, 0.5]; p.lEl = 0.6; p.rEl = 0.7; p.neck = -0.75; p.spine = -0.22; p.lHip = [0, 0.06]; p.rHip = [0.25, 0.06]; p.lKnee = 0.1; p.rKnee = 0.3; return p; },
  cower: (u, i = 0) => { const p = basePose(); p.hipY = 0.55; p.lHip = [1.2, 0.15]; p.rHip = [1.1, 0.12]; p.lKnee = 1.75; p.rKnee = 1.7; p.lFoot = 0.4; p.rFoot = 0.4; p.spine = 0.55;
    p.lSh = [1.35, -0.25]; p.rSh = [1.3, -0.2]; p.lEl = 2.0; p.rEl = 2.05; p.neck = 0.5 + 0.1 * Math.sin(u * 14 + i); return p; },
  lookUp: (u, i = 0) => { const p = basePose(); p.neck = -0.8; p.spine = -0.12; p.lSh = [0.3, 0.15]; p.rSh = [0.35, 0.15]; p.lEl = 0.6; p.rEl = 0.5; p.headYaw = 0.1 * Math.sin(u * 0.7 + i); return p; },
};
// place a person: [x, y, z] (in the parent's frame), yaw (rad), a pose, an optional lie (rad, about x)
function ekPlace(P, x, y, z, yaw, pose, lay = 0) {
  P.root.position.set(x, y, z); P.root.rotation.order = 'YXZ'; P.root.rotation.set(lay, yaw, 0);
  P.apply(pose); P.pose = pose;
}
