/* =====================================================================
   CAST — the people (the shared adult rig, js/world/people.js): the poses (from the Air solid and Magnets films'
   cast, renamed), this film's looks (you, the woman, the driver, the man at the bonfire, the skaters), and helpers.
   Every person is posed as a pure function of story time s.
     nlPerson(look, parent, kid) → Person ; nlPose(person, pose, x, y, z, yaw)
     nlStatePose(state, t, i) → { p, lay, y }   a body state from physics.js (skate, glide, fall, sit, walk, prone …)
     nlPlace(person, q, x, z, yaw, y0)          put a person there in that pose (laid flat if q.lay)
     nlHandPose(s), nlReachK(s)                 your hand on the ice (the handprint); your reach at the end
   ===================================================================== */

Object.assign(LOOKS, {
  // you: a dark blue down jacket, black trousers, a grey beanie, no gloves
  nlYou: { skin: 0, build: 'avg', shirt: '#22344e', sleeves: 'long', pants: '#1b1d22', shoes: '#2a2c30', sole: '#111', hair: '#4a3420', jacket: true, collar: true, hat: { type: 'beanie', color: '#6b6e72' } },
  // the woman who grabs your arm: a red jacket, a white beanie
  nlHer: { skin: 5, build: 'slim', shirt: '#9b2a2a', sleeves: 'long', pants: '#23262c', shoes: '#efe9de', sole: '#ccc', hair: '#c9a46a', hairStyle: 'long', jacket: true, collar: true, hat: { type: 'beanie', color: '#e9e4da' }, gloves: '#3a3a3a' },
  // the driver: a grey coat, no hat
  nlDriver: { skin: 1, build: 'avg', shirt: '#4a4d52', sleeves: 'long', pants: '#2a2a2e', shoes: '#151515', sole: '#111', hair: '#2a2420', coat: true, collar: true },
  // the man at the bonfire
  nlMan: { skin: 2, build: 'broad', shirt: '#2f4a2c', sleeves: 'long', pants: '#2a2622', shoes: '#3a2a1a', sole: '#111', hair: '#3a2a1e', jacket: true, collar: true, hat: { type: 'beanie', color: '#b33a2a' }, gloves: '#222' },
  // the skaters: winter colours
  nlSk0: { skin: 0, build: 'avg', shirt: '#2c5a8a', sleeves: 'long', pants: '#1a1c20', shoes: '#111', sole: '#111', hair: '#3a2a1a', jacket: true, hat: { type: 'beanie', color: '#d9a62a' }, gloves: '#202020' },
  nlSk1: { skin: 5, build: 'slim', shirt: '#e6e1d6', sleeves: 'long', pants: '#2a2c34', shoes: '#eee', sole: '#ccc', hair: '#d8b878', hairStyle: 'pony', jacket: true, hat: { type: 'beanie', color: '#2a4a6a' } },
  nlSk2: { skin: 1, build: 'broad', shirt: '#3a3d2a', sleeves: 'long', pants: '#22252b', shoes: '#111', sole: '#111', hair: '#1e1a16', jacket: true, gloves: '#3a2a1a' },
  nlSk3: { skin: 0, build: 'avg', shirt: '#b8462a', sleeves: 'long', pants: '#16181c', shoes: '#111', sole: '#111', hair: '#6a4a2a', jacket: true, hat: { type: 'beanie', color: '#1a1a1a' } },
  nlSk4: { skin: 2, build: 'slim', shirt: '#5a2a5a', sleeves: 'long', pants: '#1a1c22', shoes: '#ddd', sole: '#bbb', hair: '#140f0c', hairStyle: 'long', jacket: true, gloves: '#e0d8c8' },
  nlSk5: { skin: 0, build: 'avg', shirt: '#1d2a3a', sleeves: 'long', pants: '#3a3f46', shoes: '#111', sole: '#111', hair: '#a88a5a', jacket: true, hat: { type: 'beanie', color: '#c03a3a' } },
  nlSk6: { skin: 3, build: 'broad', shirt: '#c9a23a', sleeves: 'long', pants: '#1c1e24', shoes: '#111', sole: '#111', hair: '#120e0c', jacket: true, hat: { type: 'beanie', color: '#283a2a' } },
  nlSk7: { skin: 5, build: 'slim', shirt: '#2a6a5a', sleeves: 'long', pants: '#22242a', shoes: '#eee', sole: '#ccc', hair: '#e0c890', hairStyle: 'bun', jacket: true },
  nlSk8: { skin: 1, build: 'avg', shirt: '#7a7f86', sleeves: 'long', pants: '#15171b', shoes: '#111', sole: '#111', hair: '#4a3626', jacket: true, hat: { type: 'beanie', color: '#e2ddd2' }, gloves: '#5a1a1a' },
})
const NLPI = Math.PI;
const nlEase = (s, a, b) => { const u = MathX.clamp((s - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
const nlYaw = (fx, fz) => Math.atan2(fx, fz);                         // facing a direction (x, z); the rig faces +z at 0
function nlPerson(look, parent, o = {}) { const p = new Person({ id: 'sh' + look + (o.id || ''), look }, null); if (o.kid) p.root.scale.setScalar(0.66); nlPersonNoZ(p); (parent || NL_KIT_SCENE).add(p.root); return p; }
// (the engine's people have a few surfaces that share a plane: the belt's top with the trousers', the shirt strip
// under an open jacket 0.3 mm off the chest, a coat's hem flush with the thighs. Nudged here, per person, so nothing
// flickers (z-fighting); js/world/people.js itself is untouched)
function nlPersonNoZ(p) {
  const L = p.look, BG = PersonGeo.forBuild(L.build || 'avg', L);
  p.root.traverse((m) => {
    if (!m.isMesh) return; const g = m.geometry, q = g.parameters;
    if (g.type === 'BoxGeometry' && q.height === 0.035 && Math.abs(q.width - BG.B.waist * 1.02) < 1e-6) m.scale.set(1, 1.6, 1.08);   // the belt
    else if (g.type === 'BoxGeometry' && q.width === 0.08 && q.depth === 0.01) m.position.z += L.shoulderBag ? 0.0015 : 0.004;   // the strip
    else if (g.type === 'BoxGeometry' && q.width === 0.03 && q.depth === 0.012) m.position.z += 0.003;   // a shoulder bag's strap
    else if (L.coat && (g === BG.pelvis || g === BG.thigh)) m.scale.set(0.98, 1, 0.98);                                       // under a coat
  });
}
function nlPose(P, pose, x, y, z, yaw) { P.root.position.set(x, y, z); P.root.rotation.y = yaw; P.apply(pose); P.pose = pose; }
function nlFidget(p, s, i, a = 1) { p.headYaw += 0.3 * a * noise1(s * 0.11, i + 2); p.spineYaw += 0.06 * a * noise1(s * 0.07, i + 4); p.neck += 0.06 * a * noise1(s * 0.09, i + 6); return p; }
function nlKeys(s, K, bl = 0.6) { let i = 0; while (i + 1 < K.length && s >= K[i + 1][0]) i++; const p = K[i][1]; if (i && s - K[i][0] < bl) return lerpPose(K[i - 1][1], p, nlEase(s, K[i][0], K[i][0] + bl)); return p; }

function nlWalkPose(ph, big = 1) {
  const p = basePose(), s = Math.sin(ph), co = Math.cos(ph);
  p.lHip = [0.42 * big * s, 0.03]; p.rHip = [-0.42 * big * s, 0.03];
  p.lKnee = 0.08 + 0.65 * big * Math.max(0, co) ** 1.5; p.rKnee = 0.08 + 0.65 * big * Math.max(0, -co) ** 1.5;
  p.lFoot = -0.2 * Math.max(0, co); p.rFoot = -0.2 * Math.max(0, -co);
  p.lSh = [-0.34 * big * s, 0.07]; p.rSh = [0.34 * big * s, 0.07]; p.lEl = 0.28 + 0.18 * Math.max(0, -s); p.rEl = 0.28 + 0.18 * Math.max(0, s);
  return p;
}
// running: the flight phase (both feet off the ground) at ph = 0; arms pumping
function nlRunPose(ph) {
  const p = basePose(), s = Math.sin(ph), c = Math.cos(ph);
  p.lHip = [0.15 + 0.7 * s, 0.03]; p.rHip = [0.15 - 0.7 * s, 0.03]; p.lKnee = 0.5 + 0.9 * Math.max(0, -s) + 0.35 * (1 + c) * 0.5; p.rKnee = 0.5 + 0.9 * Math.max(0, s) + 0.35 * (1 + c) * 0.5;
  p.lFoot = 0.2; p.rFoot = 0.2; p.lSh = [-0.6 * s, 0.12]; p.rSh = [0.6 * s, 0.12]; p.lEl = 1.45; p.rEl = 1.45; p.spine = 0.16; p.neck = -0.08; p.hipY = 0.9;
  return p;
}
const NL_POSES = {
  stand: () => basePose(),
  lookUp: () => { const p = basePose(); p.neck = -0.55; p.spine = -0.1; p.lSh = [0.5, 0.25]; p.rSh = [0.3, 0.2]; p.lEl = 0.9; p.rEl = 0.4; return p; },
  lookAround: () => { const p = basePose(); p.neck = -0.1; p.lSh = [0.35, 0.3]; p.rSh = [0.4, 0.3]; p.lEl = 0.5; p.rEl = 0.6; return p; },
  armsOut: () => { const p = basePose(); p.lSh = [0.6, 0.9]; p.rSh = [0.7, 0.85]; p.lEl = 0.3; p.rEl = 0.35; p.neck = 0.1; p.lKnee = 0.35; p.rKnee = 0.3; p.lHip = [0.25, 0.12]; p.rHip = [0.2, 0.12]; p.hipY = 0.85; return p; },
  chest: () => { const p = basePose(); p.rSh = [0.9, -0.2]; p.rEl = 2.0; p.lSh = [0.2, 0.15]; p.lEl = 0.3; p.spine = 0.15; p.neck = 0.25; return p; },
  face: () => { const p = basePose(); p.rSh = [1.5, -0.1]; p.rEl = 2.2; p.lSh = [0.3, 0.2]; p.spine = 0.12; p.neck = 0.2; return p; },
  talk: () => { const p = basePose(); p.lSh = [0.9, 0.3]; p.rSh = [1.2, 0.25]; p.lEl = 1.3; p.rEl = 1.1; p.mouth = 1; p.neck = 0.05; return p; },
  phone: () => { const p = basePose(); p.rSh = [0.7, -0.05]; p.rEl = 2.35; p.lSh = [0.4, 0.2]; p.lEl = 0.9; p.neck = 0.05; p.headYaw = 0.2; return p; },
  hug: () => { const p = basePose(); p.lSh = [1.1, -0.15]; p.rSh = [1.05, -0.12]; p.lEl = 2.1; p.rEl = 2.15; p.spine = 0.22; p.neck = 0.2; return p; },
  crouch: () => { const p = basePose(); p.hipY = 0.6; p.lHip = [1.1, 0.12]; p.rHip = [1.1, 0.12]; p.lKnee = 1.6; p.rKnee = 1.6; p.lFoot = 0.35; p.rFoot = 0.35; p.spine = 0.35; p.lSh = [0.9, 0.3]; p.rSh = [0.8, 0.3]; p.lEl = 0.4; p.rEl = 0.4; return p; },
  sitGround: () => { const p = basePose(); p.hipY = 0.13; p.lHip = [1.45, 0.25]; p.rHip = [1.35, 0.2]; p.lKnee = 1.9; p.rKnee = 1.2; p.spine = 0.25; p.lSh = [0.6, 0.3]; p.rSh = [0.5, 0.3]; p.lEl = 0.9; p.rEl = 0.8; p.neck = 0.2; return p; },
  sitHurt: () => { const p = NL_POSES.sitGround(); p.rSh = [0.7, -0.35]; p.rEl = 1.9; p.lSh = [0.2, 0.25]; p.lEl = 0.3; p.neck = 0.35; p.spine = 0.38; return p; },
  sit: () => { const p = basePose(); p.hipY = 0.47; p.lHip = [1.5, 0.08]; p.rHip = [1.5, 0.08]; p.lKnee = 1.5; p.rKnee = 1.5; p.spine = -0.05; p.neck = 0.1; p.lSh = [0.45, 0.1]; p.lEl = 1.05; p.rSh = [0.5, 0.1]; p.rEl = 1.1; return p; },
  drive: () => { const p = NL_POSES.sit(); p.lHip = [1.25, 0.1]; p.rHip = [1.3, 0.06]; p.lKnee = 1.05; p.rKnee = 1.0; p.spine = -0.12; p.lSh = [1.05, 0.2]; p.rSh = [1.05, 0.2]; p.lEl = 0.75; p.rEl = 0.75; return p; },
  slump: () => { const p = NL_POSES.drive(); p.spine = 0.45; p.neck = 0.55; p.lSh = [0.4, 0.25]; p.rSh = [1.2, -0.1]; p.rEl = 1.9; p.lEl = 0.4; return p; },
  ride: (ph = 0) => { const p = basePose(); p.hipY = 0.86; const a = Math.sin(ph), b = Math.cos(ph);
    p.lHip = [1.15 + 0.3 * a, 0.14]; p.rHip = [1.15 - 0.3 * a, 0.14]; p.lKnee = 1.45 + 0.45 * b; p.rKnee = 1.45 - 0.45 * b; p.lFoot = 0.25; p.rFoot = 0.25;
    p.spine = 0.38; p.neck = -0.2; p.lSh = [1.2, 0.18]; p.lEl = 0.4; p.rSh = [1.2, 0.18]; p.rEl = 0.4; return p; },
  jump: () => { const p = basePose(); p.lSh = [2.3, 0.55]; p.rSh = [2.1, 0.6]; p.lEl = 0.3; p.rEl = 0.4; p.lHip = [0.55, 0.12]; p.rHip = [0.35, 0.1]; p.lKnee = 0.9; p.rKnee = 1.1; p.spine = -0.08; p.neck = 0.25; p.mouth = 1; return p; },
  land: () => { const p = NL_POSES.crouch(); p.lSh = [0.9, 0.6]; p.rSh = [1.0, 0.55]; p.hipY = 0.5; return p; },
  swing: (k = 1) => { const p = basePose(); p.hipY = 0.5; p.lHip = [1.45, 0.06]; p.rHip = [1.45, 0.06]; p.lKnee = 0.25 + 1.2 * (1 - k); p.rKnee = 0.25 + 1.2 * (1 - k); p.spine = -0.35 * k; p.neck = 0.25 * k; p.lSh = [2.5, 0.22]; p.rSh = [2.5, 0.22]; p.lEl = 0.35; p.rEl = 0.35; p.mouth = k; return p; },
  kick: () => { const p = basePose(); p.rHip = [1.25, 0.05]; p.rKnee = 0.2; p.lKnee = 0.3; p.lHip = [-0.15, 0.05]; p.lSh = [-0.5, 0.65]; p.rSh = [0.7, 0.55]; p.spine = -0.2; p.neck = -0.25; return p; },
  keeper: () => { const p = basePose(); p.lSh = [1.3, 0.8]; p.rSh = [1.3, 0.8]; p.lEl = 0.4; p.rEl = 0.4; p.hipY = 0.82; p.lHip = [0.4, 0.3]; p.rHip = [0.4, 0.3]; p.lKnee = 0.6; p.rKnee = 0.6; p.spine = 0.25; return p; },
  throw: () => { const p = basePose(); p.rSh = [1.55, -0.45]; p.rEl = 0.1; p.lSh = [0.35, 0.5]; p.lEl = 0.5; p.spineYaw = -0.35; p.spine = 0.1; p.lHip = [0.35, 0.08]; p.lKnee = 0.3; p.rHip = [-0.2, 0.05]; p.rKnee = 0.15; p.hipY = 0.88; return p; },
  catch: () => { const p = basePose(); p.lSh = [2.0, 0.3]; p.rSh = [2.0, 0.3]; p.lEl = 0.2; p.rEl = 0.2; p.spine = 0.1; p.neck = -0.3; return p; },
};

// ---------------------------------------------------------------------------------------------------------------------
// THIS FILM'S POSES. Each returns { p (the pose), lay (0 upright · 1 face down · −1 face up), y (the root's lift) }
// ---------------------------------------------------------------------------------------------------------------------
// skates: a blade under each boot (it lifts a standing skater 7 cm)
function nlBlades(P) {
  const m = new THREE.MeshStandardMaterial({ color: '#c8ccd0', roughness: 0.3, metalness: 0.9 });
  for (const leg of [P.j.ll, P.j.rl]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.42), m); b.position.set(0, -0.085, 0.04); b.userData.blade = true; leg.ft.add(b); }
  return P;
}
const NL_SK = 0.07;
// skating: a long push to the side and back, the other knee deep, the back flat, arms swinging (ph: the stride)
function nlSkatePose(ph, k = 1) {
  const p = basePose(), s = Math.sin(ph), c = Math.cos(ph);
  p.hipY = 0.84 - 0.05 * k; p.spine = 0.55 * k + 0.05; p.neck = -0.42 * k;
  p.lHip = [0.62 * k - 0.32 * Math.max(0, s), 0.04 + 0.34 * Math.max(0, s)]; p.rHip = [0.62 * k - 0.32 * Math.max(0, -s), 0.04 + 0.34 * Math.max(0, -s)];
  p.lKnee = 0.85 * k - 0.6 * Math.max(0, s); p.rKnee = 0.85 * k - 0.6 * Math.max(0, -s); p.lFoot = 0.1; p.rFoot = 0.1;
  p.lSh = [0.55 * s, 0.14]; p.rSh = [-0.55 * s, 0.14]; p.lEl = 0.35; p.rEl = 0.35; p.spineYaw = 0.12 * c;
  return p;
}
const NL_P = {
  glide: (t) => { const p = basePose(); p.hipY = 0.88; p.lKnee = 0.32; p.rKnee = 0.3; p.lHip = [0.25, 0.08]; p.rHip = [0.22, 0.08]; p.spine = 0.18; p.neck = -0.12;
    p.lSh = [0.55 + 0.1 * Math.sin(t * 2.1), 0.75]; p.rSh = [0.6 + 0.1 * Math.sin(t * 1.7 + 1), 0.7]; p.lEl = 0.25; p.rEl = 0.3; p.headYaw = 0.35 * Math.sin(t * 0.9); return p; },
  stopping: () => { const p = basePose(); p.hipY = 0.8; p.lKnee = 0.7; p.rKnee = 0.75; p.lHip = [0.55, 0.3]; p.rHip = [0.5, 0.3]; p.spine = -0.05; p.lSh = [1.25, 0.55]; p.rSh = [1.2, 0.5]; p.lEl = 0.2; p.rEl = 0.25; p.neck = 0.05; return p; },
  standBlind: (t, i) => { const p = basePose(); p.hipY = 0.9; p.lKnee = 0.2; p.rKnee = 0.18; p.lSh = [1.25 + 0.2 * Math.sin(t * 0.7 + i), 0.35]; p.rSh = [1.1 + 0.2 * Math.sin(t * 0.6 + i * 2), 0.4]; p.lEl = 0.35; p.rEl = 0.3;
    p.headYaw = 0.7 * Math.sin(t * 0.45 + i); p.neck = 0.05 + 0.1 * Math.sin(t * 0.3 + i); return p; },
  sit: (t, i) => { const p = NL_POSES.sitGround(); p.headYaw = 0.6 * Math.sin(t * 0.25 + i); p.neck = 0.05; p.lSh = [0.3, 0.35]; p.lEl = 0.2; p.rSh = [0.35, 0.3]; p.rEl = 0.25; return p; },
  kneel: (t, i) => { const p = basePose(); p.hipY = 0.5; p.lHip = [0.05, 0.08]; p.rHip = [0.05, 0.08]; p.lKnee = 1.75; p.rKnee = 1.75; p.lFoot = 0.5; p.rFoot = 0.5; p.spine = 0.15;
    p.lSh = [0.9, 0.35]; p.rSh = [0.85, 0.3]; p.lEl = 0.4; p.rEl = 0.5; p.headYaw = 0.6 * Math.sin(t * 0.3 + i); return p; },
  allFours: (t, i, ph = 0) => { const p = basePose(); const a = Math.sin(ph); p.hipY = 0.52; p.lHip = [0.05 + 0.25 * a, 0.08]; p.rHip = [0.05 - 0.25 * a, 0.08]; p.lKnee = 1.55; p.rKnee = 1.55; p.lFoot = 0.3; p.rFoot = 0.3;
    p.spine = 1.38; p.neck = -0.9; p.lSh = [1.38 - 0.25 * a, 0.12]; p.rSh = [1.38 + 0.25 * a, 0.12]; p.lEl = 0.1; p.rEl = 0.1; p.headYaw = 0.25 * Math.sin(t * 0.4 + i); return p; },
  crouch: () => { const p = NL_POSES.crouch(); p.lSh = [1.0, 0.6]; p.rSh = [0.9, 0.6]; return p; },
  lie: (t, i) => { const p = basePose(); p.lSh = [0.4, 0.9]; p.rSh = [0.6, 0.8]; p.lEl = 0.6; p.rEl = 0.4; p.lHip = [0.2, 0.12]; p.rHip = [0.05, 0.2]; p.lKnee = 0.6; p.rKnee = 0.15; p.headYaw = 0.5 * Math.sin(t * 0.2 + i); return p; },
  fall: (u, i) => { const p = basePose(); const w = Math.sin(u * 11 + i); p.lSh = [1.6 + 0.6 * w, 0.9]; p.rSh = [1.3 - 0.6 * w, 1.0]; p.lEl = 0.5; p.rEl = 0.7; p.lHip = [0.6, 0.2]; p.rHip = [0.2, 0.25]; p.lKnee = 0.9; p.rKnee = 0.4; p.spine = 0.3; p.neck = 0.3; return p; },
  walkIce: (d, t) => { const p = nlWalkPose(d / 0.9 * 2 * Math.PI, 0.45); p.hipY = 0.88; p.lKnee += 0.15; p.rKnee += 0.15; p.spine = 0.15; p.lSh = [1.0, 0.45]; p.rSh = [0.8, 0.4]; p.lEl = 0.35; p.rEl = 0.4; p.headYaw = 0.15 * Math.sin(t * 0.8); return p; },
  standListen: (t) => { const p = basePose(); p.hipY = 0.9; p.lKnee = 0.18; p.rKnee = 0.2; p.lSh = [0.5, 0.25]; p.rSh = [0.45, 0.3]; p.lEl = 0.5; p.rEl = 0.5; p.headYaw = 0.9 * Math.sin(t * 0.35); p.neck = -0.05; return p; },
  phone: (t, i) => { const p = NL_P.kneel(t, i); p.rSh = [1.15, -0.35]; p.rEl = 2.35; p.headYaw = -0.2; p.neck = 0.2; return p; },
  holdArm: (t, i) => { const p = NL_P.kneel(t, i); p.lSh = [1.0, -0.15]; p.lEl = 0.35; p.rSh = [0.95, -0.25]; p.rEl = 0.55; p.headYaw = 0.3 * Math.sin(t * 0.4); p.spine = 0.3; return p; },
  // flat on the ice, face down, arms forward; the crawl: an arm reaches, the opposite knee draws up (ph)
  prone: (ph = 0, reach = 0) => { const p = basePose(); const a = Math.sin(ph) * (1 - reach); p.lSh = [2.85 + 0.2 * a, 0.28 + 0.1 * reach]; p.rSh = [2.85 - 0.2 * a + 0.25 * reach, 0.28 - 0.3 * reach]; p.lEl = 0.35 - 0.2 * a; p.rEl = (0.35 + 0.2 * a) * (1 - reach);
    p.lHip = [0.1 + 0.25 * Math.max(0, -a), 0.18]; p.rHip = [0.1 + 0.25 * Math.max(0, a), 0.18]; p.lKnee = 0.2 + 0.5 * Math.max(0, -a); p.rKnee = 0.2 + 0.5 * Math.max(0, a); p.neck = -0.55; p.lFoot = 0.4; p.rFoot = 0.4; return p; },
  // holding your ankles: flat, arms forward, still
  proneHold: () => { const p = basePose(); p.lSh = [2.95, 0.12]; p.rSh = [2.95, 0.12]; p.lEl = 0.15; p.rEl = 0.15; p.neck = -0.5; p.lHip = [0.05, 0.15]; p.rHip = [0.05, 0.15]; p.lFoot = 0.4; p.rFoot = 0.4; return p; },
  // in the water at the edge: forearms on the ice, the head up (k: how tired, 0…1)
  edge: (t, k) => { const p = basePose(); p.lSh = [1.45 + 0.05 * Math.sin(t * 1.3), 0.32]; p.rSh = [1.42 + 0.05 * Math.sin(t * 1.1 + 1), 0.3]; p.lEl = 0.55; p.rEl = 0.6; p.spine = 0.2 + 0.2 * k; p.neck = -0.35 + 0.35 * k;
    p.lHip = [0.4 + 0.3 * Math.sin(t * 2.3), 0.1]; p.rHip = [0.4 - 0.3 * Math.sin(t * 2.3), 0.1]; p.lKnee = 0.8; p.rKnee = 0.8; p.headYaw = 0.2 * Math.sin(t * 0.7); return p; },
  // the man: walking with his arms out in front; the step back
  feel: (d, back) => { const p = nlWalkPose(d / 1.2 * 2 * Math.PI, 0.6); p.lSh = [1.35, 0.25]; p.rSh = [1.3, 0.2]; p.lEl = 0.25; p.rEl = 0.3; if (back > 0) { p.spine -= 0.3 * back; p.neck -= 0.2 * back; p.lSh = [1.7, 0.4]; p.rSh = [1.65, 0.4]; p.lEl = 1.4 * back; p.rEl = 1.4 * back; } return p; },
};
// the pose for a body state (from physics.js): { p, lay, y }
function nlStatePose(st, t, i = 0) {
  const S = st.state;
  if (S === 'skate') return { p: nlSkatePose(st.u * 2.6 + i), lay: 0, y: NL_SK };
  if (S === 'glide') return { p: NL_P.glide(t + i), lay: 0, y: NL_SK };
  if (S === 'stopping') return { p: NL_P.stopping(), lay: 0, y: NL_SK };
  if (S === 'standBlind') return { p: NL_P.standBlind(t, i), lay: 0, y: NL_SK };
  if (S === 'stand') return { p: NL_P.standListen(t + i), lay: 0, y: NL_SK };
  if (S === 'walk') return { p: NL_P.walkIce(st.u * 0.9, t), lay: 0, y: NL_SK };
  if (S === 'fall') { const u = st.u ?? 0; return u < 0.35 ? { p: NL_P.fall(u, i), lay: -MathX.smooth(u, 0, 0.35), y: NL_SK * (1 - u / 0.35) + 0.12 * MathX.smooth(u, 0.1, 0.35) } : { p: NL_P.lie(t, i), lay: -1, y: 0.12 }; }
  if (S === 'sit') return { p: NL_P.sit(t, i), lay: 0, y: 0.02 };
  if (S === 'kneel') return { p: NL_P.kneel(t, i), lay: 0, y: 0.04 };
  if (S === 'allFours') return { p: NL_P.allFours(t, i), lay: 0, y: 0.04 };
  if (S === 'crawl') return { p: NL_P.allFours(t, i, t * 3.2), lay: 0, y: 0.04 };
  if (S === 'crouch') return { p: NL_P.crouch(), lay: 0, y: NL_SK };
  if (S === 'lie') return { p: NL_P.lie(t, i), lay: -1, y: 0.12 };
  if (S === 'prone') return { p: NL_P.prone(t * 1.4), lay: 1, y: 0.13 };
  return { p: basePose(), lay: 0, y: 0 };
}
// put a person at (x, z) facing yaw, in pose q ({ p, lay, y }); laid flat by rotating the root about its feet
function nlPlace(P, q, x, z, yaw, y0 = 0) {
  P.root.position.set(x, y0 + q.y, z); P.root.rotation.order = 'YXZ'; P.root.rotation.set(Math.PI / 2 * q.lay, yaw, 0);
  if (q.lay !== 0) { const back = Math.abs(q.lay) * 0.9; P.root.position.x -= Math.sin(yaw) * back; P.root.position.z -= Math.cos(yaw) * back; }   // (lying, the body's middle stays where the person was)
  P.apply(q.p); P.pose = q.p;
}

// sitting on the ice: you lean and put your right hand flat on it (NLE.hand[0]), lift it (NLE.hand[1]), look at it
function nlHandPose(s) {
  const E = NLE, k = nlEase(s, E.hand[0] - 1.2, E.hand[0] - 0.1), up = nlEase(s, E.hand[1], E.hand[1] + 0.9), back = nlEase(s, E.hand[1] + 6.2, E.hand[1] + 7.8);   // (lowered again once the shot has cut away)
  const base = NL_P.sit(s, 0), p = NL_P.sit(s, 0), down = k * (1 - up);
  p.spine = 0.25 + 0.42 * down + 0.12 * up; p.neck = 0.05 + 0.35 * down + 0.3 * up; p.headYaw = -0.2 * (down + up);
  p.rSh = [0.35 + 0.33 * down + 0.75 * up, 0.3 - 0.05 * down]; p.rEl = 0.25 - 0.23 * down + 1.25 * up;
  return back > 0 ? lerpPose(p, base, back) : p;
}
// lying flat at the edge: your right arm reaching out to him (0…1)
const nlReachK = (s) => nlEase(s, nlSC('reach', 0) - 0.3, nlSC('reach', 0) + 1.8);
