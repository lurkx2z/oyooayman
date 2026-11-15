/* =====================================================================
   CAST — the people (the shared adult rig, js/world/people.js): the poses (from the Air solid film's cast, renamed),
   this film's looks (your mum on the boat, the crane operator, the radiographer, six people in the waiting room), and
   small helpers. Every person is posed as a pure function of story time s.
     esPerson(look, parent, kid) → Person ; esPose(person, pose, x, y, z, yaw)
   ===================================================================== */

Object.assign(LOOKS, {
  esMaster: { skin: 3, build: 'avg', shirt: '#2c3a5a', sleeves: 'long', pants: '#22283a', shoes: '#1a1612', sole: '#14100c', hair: '#1a1410', jacket: true, collar: true, hat: { type: 'cap', color: '#b8322a' } },
  esWoman: { skin: 4, build: 'slim', shirt: '#d8a02a', sleeves: 'short', pants: '#33415a', shoes: '#e8e4dc', sole: '#f2f0ea', hair: '#141010', hairStyle: 'long', shoulderBag: '#7a3a2a' },
  esP1: { skin: 2, build: 'avg', shirt: '#e8e2d2', sleeves: 'short', pants: '#4a4640', shoes: '#2a2018', sole: '#1a1612', hair: '#2a1a12', hat: { type: 'cap', color: '#3a6a4a' } },
  esP2: { skin: 5, build: 'slim', shirt: '#b8462e', sleeves: 'short', pants: '#22262c', shoes: '#e8e4dc', sole: '#f2f0ea', hair: '#141010', hairStyle: 'bun' },
  esP3: { skin: 1, build: 'broad', shirt: '#3a7a8a', sleeves: 'short', pants: '#6a6052', shoes: '#2a2018', sole: '#1a1612', hair: '#8a7a68', backpack: '#4a3a2a' },
  esP4: { skin: 4, build: 'avg', shirt: '#7a4a8a', sleeves: 'long', pants: '#2a2d33', shoes: '#111', sole: '#2a2a2a', hair: '#141010', hairStyle: 'pony' },
  esP5: { skin: 3, build: 'slim', shirt: '#4a8a5a', sleeves: 'short', pants: '#33415a', shoes: '#e8e4dc', sole: '#f2f0ea', hair: '#2a1a12' },
  esP6: { skin: 0, build: 'avg', shirt: '#d9d0b8', sleeves: 'long', pants: '#5a5248', shoes: '#3a2a20', sole: '#1a1612', hair: '#b8a888', hat: { type: 'cap', color: '#e8e4dc' } },
  esP7: { skin: 5, build: 'broad', shirt: '#2f5a8a', sleeves: 'short', pants: '#1f1f24', shoes: '#2a2018', sole: '#1a1612', hair: '#141010' },
  esYouSeat: { skin: 2, build: 'avg', shirt: '#8a3a3a', sleeves: 'long', pants: '#2a2d33', shoes: '#2a2018', sole: '#1a1612', hair: '#3a2a1a' },
});
const ESPI = Math.PI;
const esEase = (s, a, b) => { const u = MathX.clamp((s - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
const esYaw = (fx, fz) => Math.atan2(fx, fz);                         // facing a direction (x, z); the rig faces +z at 0
function esPerson(look, parent, o = {}) { const p = new Person({ id: 'es' + look + (o.id || ''), look }, null); if (o.kid) p.root.scale.setScalar(0.66); esPersonNoZ(p); (parent || ES_KIT_SCENE).add(p.root); return p; }
// (the engine's people have a few surfaces that share a plane: the belt's top with the trousers', the shirt strip
// under an open jacket 0.3 mm off the chest, a coat's hem flush with the thighs. Nudged here, per person, so nothing
// flickers (z-fighting); js/world/people.js itself is untouched)
function esPersonNoZ(p) {
  const L = p.look, BG = PersonGeo.forBuild(L.build || 'avg', L);
  p.root.traverse((m) => {
    if (!m.isMesh) return; const g = m.geometry, q = g.parameters;
    if (g.type === 'BoxGeometry' && q.height === 0.035 && Math.abs(q.width - BG.B.waist * 1.02) < 1e-6) m.scale.set(1, 1.6, 1.08);   // the belt
    else if (g.type === 'BoxGeometry' && q.width === 0.08 && q.depth === 0.01) m.position.z += L.shoulderBag ? 0.0015 : 0.004;   // the strip
    else if (g.type === 'BoxGeometry' && q.width === 0.03 && q.depth === 0.012) m.position.z += 0.003;   // a shoulder bag's strap
    else if (L.coat && (g === BG.pelvis || g === BG.thigh)) m.scale.set(0.98, 1, 0.98);                                       // under a coat
  });
}
function esPose(P, pose, x, y, z, yaw) { P.root.position.set(x, y, z); P.root.rotation.y = yaw; P.apply(pose); P.pose = pose; }
function esFidget(p, s, i, a = 1) { p.headYaw += 0.3 * a * noise1(s * 0.11, i + 2); p.spineYaw += 0.06 * a * noise1(s * 0.07, i + 4); p.neck += 0.06 * a * noise1(s * 0.09, i + 6); return p; }
function esKeys(s, K, bl = 0.6) { let i = 0; while (i + 1 < K.length && s >= K[i + 1][0]) i++; const p = K[i][1]; if (i && s - K[i][0] < bl) return lerpPose(K[i - 1][1], p, esEase(s, K[i][0], K[i][0] + bl)); return p; }

function esWalkPose(ph, big = 1) {
  const p = basePose(), s = Math.sin(ph), co = Math.cos(ph);
  p.lHip = [0.42 * big * s, 0.03]; p.rHip = [-0.42 * big * s, 0.03];
  p.lKnee = 0.08 + 0.65 * big * Math.max(0, co) ** 1.5; p.rKnee = 0.08 + 0.65 * big * Math.max(0, -co) ** 1.5;
  p.lFoot = -0.2 * Math.max(0, co); p.rFoot = -0.2 * Math.max(0, -co);
  p.lSh = [-0.34 * big * s, 0.07]; p.rSh = [0.34 * big * s, 0.07]; p.lEl = 0.28 + 0.18 * Math.max(0, -s); p.rEl = 0.28 + 0.18 * Math.max(0, s);
  return p;
}
// running: the flight phase (both feet off the ground) at ph = 0; arms pumping
function esRunPose(ph) {
  const p = basePose(), s = Math.sin(ph), c = Math.cos(ph);
  p.lHip = [0.15 + 0.7 * s, 0.03]; p.rHip = [0.15 - 0.7 * s, 0.03]; p.lKnee = 0.5 + 0.9 * Math.max(0, -s) + 0.35 * (1 + c) * 0.5; p.rKnee = 0.5 + 0.9 * Math.max(0, s) + 0.35 * (1 + c) * 0.5;
  p.lFoot = 0.2; p.rFoot = 0.2; p.lSh = [-0.6 * s, 0.12]; p.rSh = [0.6 * s, 0.12]; p.lEl = 1.45; p.rEl = 1.45; p.spine = 0.16; p.neck = -0.08; p.hipY = 0.9;
  return p;
}
const ES_POSES = {
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
  sitHurt: () => { const p = ES_POSES.sitGround(); p.rSh = [0.7, -0.35]; p.rEl = 1.9; p.lSh = [0.2, 0.25]; p.lEl = 0.3; p.neck = 0.35; p.spine = 0.38; return p; },
  sit: () => { const p = basePose(); p.hipY = 0.47; p.lHip = [1.5, 0.08]; p.rHip = [1.5, 0.08]; p.lKnee = 1.5; p.rKnee = 1.5; p.spine = -0.05; p.neck = 0.1; p.lSh = [0.45, 0.1]; p.lEl = 1.05; p.rSh = [0.5, 0.1]; p.rEl = 1.1; return p; },
  drive: () => { const p = ES_POSES.sit(); p.lHip = [1.25, 0.1]; p.rHip = [1.3, 0.06]; p.lKnee = 1.05; p.rKnee = 1.0; p.spine = -0.12; p.lSh = [1.05, 0.2]; p.rSh = [1.05, 0.2]; p.lEl = 0.75; p.rEl = 0.75; return p; },
  slump: () => { const p = ES_POSES.drive(); p.spine = 0.45; p.neck = 0.55; p.lSh = [0.4, 0.25]; p.rSh = [1.2, -0.1]; p.rEl = 1.9; p.lEl = 0.4; return p; },
  ride: (ph = 0) => { const p = basePose(); p.hipY = 0.86; const a = Math.sin(ph), b = Math.cos(ph);
    p.lHip = [1.15 + 0.3 * a, 0.14]; p.rHip = [1.15 - 0.3 * a, 0.14]; p.lKnee = 1.45 + 0.45 * b; p.rKnee = 1.45 - 0.45 * b; p.lFoot = 0.25; p.rFoot = 0.25;
    p.spine = 0.38; p.neck = -0.2; p.lSh = [1.2, 0.18]; p.lEl = 0.4; p.rSh = [1.2, 0.18]; p.rEl = 0.4; return p; },
  jump: () => { const p = basePose(); p.lSh = [2.3, 0.55]; p.rSh = [2.1, 0.6]; p.lEl = 0.3; p.rEl = 0.4; p.lHip = [0.55, 0.12]; p.rHip = [0.35, 0.1]; p.lKnee = 0.9; p.rKnee = 1.1; p.spine = -0.08; p.neck = 0.25; p.mouth = 1; return p; },
  land: () => { const p = ES_POSES.crouch(); p.lSh = [0.9, 0.6]; p.rSh = [1.0, 0.55]; p.hipY = 0.5; return p; },
  swing: (k = 1) => { const p = basePose(); p.hipY = 0.5; p.lHip = [1.45, 0.06]; p.rHip = [1.45, 0.06]; p.lKnee = 0.25 + 1.2 * (1 - k); p.rKnee = 0.25 + 1.2 * (1 - k); p.spine = -0.35 * k; p.neck = 0.25 * k; p.lSh = [2.5, 0.22]; p.rSh = [2.5, 0.22]; p.lEl = 0.35; p.rEl = 0.35; p.mouth = k; return p; },
  kick: () => { const p = basePose(); p.rHip = [1.25, 0.05]; p.rKnee = 0.2; p.lKnee = 0.3; p.lHip = [-0.15, 0.05]; p.lSh = [-0.5, 0.65]; p.rSh = [0.7, 0.55]; p.spine = -0.2; p.neck = -0.25; return p; },
  keeper: () => { const p = basePose(); p.lSh = [1.3, 0.8]; p.rSh = [1.3, 0.8]; p.lEl = 0.4; p.rEl = 0.4; p.hipY = 0.82; p.lHip = [0.4, 0.3]; p.rHip = [0.4, 0.3]; p.lKnee = 0.6; p.rKnee = 0.6; p.spine = 0.25; return p; },
  throw: () => { const p = basePose(); p.rSh = [1.55, -0.45]; p.rEl = 0.1; p.lSh = [0.35, 0.5]; p.lEl = 0.5; p.spineYaw = -0.35; p.spine = 0.1; p.lHip = [0.35, 0.08]; p.lKnee = 0.3; p.rHip = [-0.2, 0.05]; p.rKnee = 0.15; p.hipY = 0.88; return p; },
  catch: () => { const p = basePose(); p.lSh = [2.0, 0.3]; p.rSh = [2.0, 0.3]; p.lEl = 0.2; p.rEl = 0.2; p.spine = 0.1; p.neck = -0.3; return p; },
};

// this film's extra poses
Object.assign(ES_POSES, {
  sitPhone: () => { const p = ES_POSES.sit(); p.rSh = [0.85, 0.05]; p.rEl = 1.9; p.lSh = [0.7, 0.05]; p.lEl = 1.7; p.neck = 0.45; p.spine = 0.12; return p; },
  sitLook: () => { const p = ES_POSES.sit(); p.headYaw = 0.9; p.neck = -0.05; return p; },
  sitTorch: () => { const p = ES_POSES.sit(); p.rSh = [1.45, -0.05]; p.rEl = 0.5; p.neck = -0.1; p.lSh = [0.45, 0.1]; p.lEl = 1.05; return p; },
  torch: () => { const p = basePose(); p.rSh = [1.35, -0.1]; p.rEl = 0.35; p.lSh = [0.3, 0.15]; p.lEl = 0.5; p.neck = 0.05; return p; },
  desk: () => { const p = ES_POSES.sit(); p.lSh = [0.95, 0.15]; p.rSh = [0.95, 0.12]; p.lEl = 1.25; p.rEl = 1.2; p.spine = 0.18; p.neck = 0.12; return p; },
  warm: () => { const p = ES_POSES.sitGround(); p.lSh = [1.25, 0.35]; p.rSh = [1.25, 0.35]; p.lEl = 0.35; p.rEl = 0.35; p.spine = 0.3; p.neck = 0.05; return p; },
  hugKnees: () => { const p = ES_POSES.sitGround(); p.lHip = [1.9, 0.1]; p.rHip = [1.9, 0.1]; p.lKnee = 2.2; p.rKnee = 2.2; p.lSh = [0.9, 0.05]; p.rSh = [0.9, 0.05]; p.lEl = 1.4; p.rEl = 1.4; p.spine = 0.35; return p; },
  lean: () => { const p = ES_POSES.sitGround(); p.spine = -0.45; p.lSh = [-0.5, 0.35]; p.rSh = [-0.5, 0.35]; p.lEl = 0.15; p.rEl = 0.15; p.lHip = [1.2, 0.2]; p.rHip = [1.0, 0.15]; p.lKnee = 0.6; p.rKnee = 1.3; p.neck = -0.25; return p; },
  bottle: () => { const p = basePose(); p.rSh = [0.8, -0.05]; p.rEl = 1.8; p.lSh = [0.25, 0.15]; p.lEl = 0.4; p.headYaw = -0.25; return p; },
  dance: (ph) => { const p = basePose(); const a = Math.sin(ph), b = Math.cos(ph * 0.5); p.lSh = [1.8 + 0.4 * a, 0.5]; p.rSh = [1.6 - 0.4 * a, 0.45]; p.lEl = 0.6 + 0.3 * b; p.rEl = 0.7 - 0.3 * b; p.hipY = 0.9 + 0.03 * a; p.lKnee = 0.25 + 0.15 * a; p.rKnee = 0.25 - 0.15 * a; p.spineYaw = 0.2 * b; p.neck = -0.1; return p; },
  standStill: () => { const p = basePose(); p.lSh = [0.15, 0.1]; p.rSh = [0.2, 0.1]; p.neck = 0.05; return p; },
  lookUpStand: () => { const p = basePose(); p.neck = -0.75; p.spine = -0.12; p.lSh = [0.1, 0.12]; p.rSh = [0.1, 0.12]; return p; },
  lookUpSit: () => { const p = ES_POSES.sitGround(); p.neck = -0.7; p.spine = -0.2; return p; },
  player: () => { const p = basePose(); p.lSh = [0.3, 0.25]; p.rSh = [0.25, 0.25]; p.lEl = 0.7; p.rEl = 0.7; p.hipY = 0.9; p.lKnee = 0.25; p.rKnee = 0.3; p.lHip = [0.2, 0.08]; p.rHip = [0.15, 0.08]; p.spine = 0.12; return p; },
  turnKey: () => { const p = ES_POSES.drive(); p.rSh = [0.8, -0.25]; p.rEl = 1.3; return p; },
});
