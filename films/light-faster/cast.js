/* =====================================================================
   CAST — the people (the shared adult rig, js/world/people.js): the poses (from the Air solid film's cast, renamed),
   this film's looks, and small helpers. Every person is posed as a pure function of story time s.
     lfPerson(look, parent, kid) → Person ; lfPose(person, pose, x, y, z, yaw)
   ===================================================================== */

Object.assign(LOOKS, {
  lfNurse: { skin: 1, build: 'slim', shirt: '#5f8fb0', sleeves: 'short', pants: '#5f8fb0', shoes: '#e8e4dc', sole: '#f2f0ea', hair: '#2a1a12', hairStyle: 'bun' },
  lfNurse2: { skin: 4, build: 'avg', shirt: '#4a7a6a', sleeves: 'short', pants: '#4a7a6a', shoes: '#e8e4dc', sole: '#f2f0ea', hair: '#141010' },
  lfTech: { skin: 2, build: 'avg', shirt: '#3c5a7a', sleeves: 'short', pants: '#2a2d33', shoes: '#2a2018', sole: '#1a1612', hair: '#1a120c' },
  lfAstro: { skin: 0, build: 'avg', shirt: '#7a2f2a', sleeves: 'long', pants: '#33415a', shoes: '#3a2a20', sole: '#1a1612', hair: '#8a7a68', coat: true, collar: true, hat: { type: 'beanie', color: '#2f3a4a' } },
  lfP1: { skin: 3, build: 'avg', shirt: '#2f4a6a', sleeves: 'long', pants: '#2a2d33', shoes: '#2a2018', sole: '#1a1612', hair: '#141010', jacket: true, collar: true },
  lfP2: { skin: 0, build: 'slim', shirt: '#b8462e', sleeves: 'long', pants: '#22262c', shoes: '#2a2018', sole: '#1a1612', hair: '#c8a46a', hairStyle: 'long', coat: true, collar: true },
  lfP3: { skin: 2, build: 'broad', shirt: '#6a6052', sleeves: 'long', pants: '#4a4640', shoes: '#2a2018', sole: '#1a1612', hair: '#d8d4cc', coat: true, collar: true },
  lfP4: { skin: 5, build: 'slim', shirt: '#3a7a6a', sleeves: 'long', pants: '#2a2d33', shoes: '#e8e4dc', sole: '#f2f0ea', hair: '#6a3a1a', hairStyle: 'pony', backpack: '#3a3f4a' },
  lfP5: { skin: 4, build: 'avg', shirt: '#d9b84a', sleeves: 'long', pants: '#33415a', shoes: '#e8e4dc', sole: '#f2f0ea', hair: '#141010', hat: { type: 'cap', color: '#2c3138' } },
  lfP6: { skin: 1, build: 'avg', shirt: '#56465e', sleeves: 'long', pants: '#1f1f24', shoes: '#111', sole: '#2a2a2a', hair: '#2a1a12', hairStyle: 'bun', jacket: true, shoulderBag: '#5a3e2c' },
  lfB1: { skin: 2, build: 'avg', shirt: '#e2553a', sleeves: 'short', pants: '#2f4a6a', shoes: '#d8d4ca', sole: '#f0ede6', hair: '#141010' },
  lfB2: { skin: 0, build: 'slim', shirt: '#e8d8b0', sleeves: 'long', pants: '#3a6a8a', shoes: '#d8d4ca', sole: '#f0ede6', hair: '#d8b06a', hairStyle: 'long' },
  lfB3: { skin: 3, build: 'slim', shirt: '#2f8a5a', sleeves: 'long', pants: '#22262c', shoes: '#111', sole: '#2a2a2a', hair: '#0e0b09', hairStyle: 'pony', jacket: true },
  lfB4: { skin: 5, build: 'broad', shirt: '#3a4a8a', sleeves: 'long', pants: '#857c68', shoes: '#4a3424', sole: '#2a1e14', hair: '#7a5c40', hood: true, jacket: true },
  lfB5: { skin: 1, build: 'avg', shirt: '#c8463a', sleeves: 'long', pants: '#2a2d33', shoes: '#e8e4dc', sole: '#f2f0ea', hair: '#6a3a1a', hat: { type: 'beanie', color: '#e8c84a' } },
  lfB6: { skin: 4, build: 'slim', shirt: '#d97ab0', sleeves: 'short', pants: '#2a2d33', shoes: '#e8e4dc', sole: '#f2f0ea', hair: '#1a120c', hairStyle: 'long' },
  lfYou: { skin: 2, build: 'avg', shirt: '#4a5a4a', sleeves: 'long', pants: '#2f3a4a', shoes: '#2a2018', sole: '#1a1612', hair: '#1a120c', jacket: true, collar: true },
  lfDrv: { skin: 2, build: 'avg', shirt: '#e8e4dc', sleeves: 'long', pants: '#2a2d33', shoes: '#2a2018', sole: '#1a1612', hair: '#141010', jacket: true },
  lfFan1: { skin: 2, build: 'avg', shirt: '#c8322a', sleeves: 'short', pants: '#f2f0ea', shoes: '#1a1a1c', sole: '#f2f0ea', hair: '#2a1a12' },
  lfFan2: { skin: 0, build: 'slim', shirt: '#2f5a8a', sleeves: 'short', pants: '#f2f0ea', shoes: '#1a1a1c', sole: '#f2f0ea', hair: '#d8b06a' },
});
const LFPI = Math.PI;
const lfEase = (s, a, b) => { const u = MathX.clamp((s - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
const lfYaw = (fx, fz) => Math.atan2(fx, fz);                         // facing a direction (x, z); the rig faces +z at 0
function lfPerson(look, parent, o = {}) { const p = new Person({ id: 'lf' + look + (o.id || ''), look }, null); if (o.kid) p.root.scale.setScalar(0.66); (parent || LF_KIT_SCENE).add(p.root); return p; }
function lfPose(P, pose, x, y, z, yaw) { P.root.position.set(x, y, z); P.root.rotation.y = yaw; P.apply(pose); P.pose = pose; }
function lfFidget(p, s, i, a = 1) { p.headYaw += 0.3 * a * noise1(s * 0.11, i + 2); p.spineYaw += 0.06 * a * noise1(s * 0.07, i + 4); p.neck += 0.06 * a * noise1(s * 0.09, i + 6); return p; }
function lfKeys(s, K, bl = 0.6) { let i = 0; while (i + 1 < K.length && s >= K[i + 1][0]) i++; const p = K[i][1]; if (i && s - K[i][0] < bl) return lerpPose(K[i - 1][1], p, lfEase(s, K[i][0], K[i][0] + bl)); return p; }

function lfWalkPose(ph, big = 1) {
  const p = basePose(), s = Math.sin(ph), co = Math.cos(ph);
  p.lHip = [0.42 * big * s, 0.03]; p.rHip = [-0.42 * big * s, 0.03];
  p.lKnee = 0.08 + 0.65 * big * Math.max(0, co) ** 1.5; p.rKnee = 0.08 + 0.65 * big * Math.max(0, -co) ** 1.5;
  p.lFoot = -0.2 * Math.max(0, co); p.rFoot = -0.2 * Math.max(0, -co);
  p.lSh = [-0.34 * big * s, 0.07]; p.rSh = [0.34 * big * s, 0.07]; p.lEl = 0.28 + 0.18 * Math.max(0, -s); p.rEl = 0.28 + 0.18 * Math.max(0, s);
  return p;
}
// running: the flight phase (both feet off the ground) at ph = 0; arms pumping
function lfRunPose(ph) {
  const p = basePose(), s = Math.sin(ph), c = Math.cos(ph);
  p.lHip = [0.15 + 0.7 * s, 0.03]; p.rHip = [0.15 - 0.7 * s, 0.03]; p.lKnee = 0.5 + 0.9 * Math.max(0, -s) + 0.35 * (1 + c) * 0.5; p.rKnee = 0.5 + 0.9 * Math.max(0, s) + 0.35 * (1 + c) * 0.5;
  p.lFoot = 0.2; p.rFoot = 0.2; p.lSh = [-0.6 * s, 0.12]; p.rSh = [0.6 * s, 0.12]; p.lEl = 1.45; p.rEl = 1.45; p.spine = 0.16; p.neck = -0.08; p.hipY = 0.9;
  return p;
}
const LF_POSES = {
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
  sitHurt: () => { const p = LF_POSES.sitGround(); p.rSh = [0.7, -0.35]; p.rEl = 1.9; p.lSh = [0.2, 0.25]; p.lEl = 0.3; p.neck = 0.35; p.spine = 0.38; return p; },
  sit: () => { const p = basePose(); p.hipY = 0.47; p.lHip = [1.5, 0.08]; p.rHip = [1.5, 0.08]; p.lKnee = 1.5; p.rKnee = 1.5; p.spine = -0.05; p.neck = 0.1; p.lSh = [0.45, 0.1]; p.lEl = 1.05; p.rSh = [0.5, 0.1]; p.rEl = 1.1; return p; },
  drive: () => { const p = LF_POSES.sit(); p.lHip = [1.25, 0.1]; p.rHip = [1.3, 0.06]; p.lKnee = 1.05; p.rKnee = 1.0; p.spine = -0.12; p.lSh = [1.05, 0.2]; p.rSh = [1.05, 0.2]; p.lEl = 0.75; p.rEl = 0.75; return p; },
  slump: () => { const p = LF_POSES.drive(); p.spine = 0.45; p.neck = 0.55; p.lSh = [0.4, 0.25]; p.rSh = [1.2, -0.1]; p.rEl = 1.9; p.lEl = 0.4; return p; },
  ride: (ph = 0) => { const p = basePose(); p.hipY = 0.86; const a = Math.sin(ph), b = Math.cos(ph);
    p.lHip = [1.15 + 0.3 * a, 0.14]; p.rHip = [1.15 - 0.3 * a, 0.14]; p.lKnee = 1.45 + 0.45 * b; p.rKnee = 1.45 - 0.45 * b; p.lFoot = 0.25; p.rFoot = 0.25;
    p.spine = 0.38; p.neck = -0.2; p.lSh = [1.2, 0.18]; p.lEl = 0.4; p.rSh = [1.2, 0.18]; p.rEl = 0.4; return p; },
  jump: () => { const p = basePose(); p.lSh = [2.3, 0.55]; p.rSh = [2.1, 0.6]; p.lEl = 0.3; p.rEl = 0.4; p.lHip = [0.55, 0.12]; p.rHip = [0.35, 0.1]; p.lKnee = 0.9; p.rKnee = 1.1; p.spine = -0.08; p.neck = 0.25; p.mouth = 1; return p; },
  land: () => { const p = LF_POSES.crouch(); p.lSh = [0.9, 0.6]; p.rSh = [1.0, 0.55]; p.hipY = 0.5; return p; },
  swing: (k = 1) => { const p = basePose(); p.hipY = 0.5; p.lHip = [1.45, 0.06]; p.rHip = [1.45, 0.06]; p.lKnee = 0.25 + 1.2 * (1 - k); p.rKnee = 0.25 + 1.2 * (1 - k); p.spine = -0.35 * k; p.neck = 0.25 * k; p.lSh = [2.5, 0.22]; p.rSh = [2.5, 0.22]; p.lEl = 0.35; p.rEl = 0.35; p.mouth = k; return p; },
  kick: () => { const p = basePose(); p.rHip = [1.25, 0.05]; p.rKnee = 0.2; p.lKnee = 0.3; p.lHip = [-0.15, 0.05]; p.lSh = [-0.5, 0.65]; p.rSh = [0.7, 0.55]; p.spine = -0.2; p.neck = -0.25; return p; },
  keeper: () => { const p = basePose(); p.lSh = [1.3, 0.8]; p.rSh = [1.3, 0.8]; p.lEl = 0.4; p.rEl = 0.4; p.hipY = 0.82; p.lHip = [0.4, 0.3]; p.rHip = [0.4, 0.3]; p.lKnee = 0.6; p.rKnee = 0.6; p.spine = 0.25; return p; },
  throw: () => { const p = basePose(); p.rSh = [1.55, -0.45]; p.rEl = 0.1; p.lSh = [0.35, 0.5]; p.lEl = 0.5; p.spineYaw = -0.35; p.spine = 0.1; p.lHip = [0.35, 0.08]; p.lKnee = 0.3; p.rHip = [-0.2, 0.05]; p.rKnee = 0.15; p.hipY = 0.88; return p; },
  catch: () => { const p = basePose(); p.lSh = [2.0, 0.3]; p.rSh = [2.0, 0.3]; p.lEl = 0.2; p.rEl = 0.2; p.spine = 0.1; p.neck = -0.3; return p; },
};

// this film's extra poses
Object.assign(LF_POSES, {
  sitPhone: () => { const p = LF_POSES.sit(); p.rSh = [0.85, 0.05]; p.rEl = 1.9; p.lSh = [0.7, 0.05]; p.lEl = 1.7; p.neck = 0.45; p.spine = 0.12; return p; },
  sitLook: () => { const p = LF_POSES.sit(); p.headYaw = 0.9; p.neck = -0.05; return p; },
  sitTorch: () => { const p = LF_POSES.sit(); p.rSh = [1.45, -0.05]; p.rEl = 0.5; p.neck = -0.1; p.lSh = [0.45, 0.1]; p.lEl = 1.05; return p; },
  torch: () => { const p = basePose(); p.rSh = [1.35, -0.1]; p.rEl = 0.35; p.lSh = [0.3, 0.15]; p.lEl = 0.5; p.neck = 0.05; return p; },
  desk: () => { const p = LF_POSES.sit(); p.lSh = [0.95, 0.15]; p.rSh = [0.95, 0.12]; p.lEl = 1.25; p.rEl = 1.2; p.spine = 0.18; p.neck = 0.12; return p; },
  warm: () => { const p = LF_POSES.sitGround(); p.lSh = [1.25, 0.35]; p.rSh = [1.25, 0.35]; p.lEl = 0.35; p.rEl = 0.35; p.spine = 0.3; p.neck = 0.05; return p; },
  hugKnees: () => { const p = LF_POSES.sitGround(); p.lHip = [1.9, 0.1]; p.rHip = [1.9, 0.1]; p.lKnee = 2.2; p.rKnee = 2.2; p.lSh = [0.9, 0.05]; p.rSh = [0.9, 0.05]; p.lEl = 1.4; p.rEl = 1.4; p.spine = 0.35; return p; },
  lean: () => { const p = LF_POSES.sitGround(); p.spine = -0.45; p.lSh = [-0.5, 0.35]; p.rSh = [-0.5, 0.35]; p.lEl = 0.15; p.rEl = 0.15; p.lHip = [1.2, 0.2]; p.rHip = [1.0, 0.15]; p.lKnee = 0.6; p.rKnee = 1.3; p.neck = -0.25; return p; },
  bottle: () => { const p = basePose(); p.rSh = [0.8, -0.05]; p.rEl = 1.8; p.lSh = [0.25, 0.15]; p.lEl = 0.4; p.headYaw = -0.25; return p; },
  dance: (ph) => { const p = basePose(); const a = Math.sin(ph), b = Math.cos(ph * 0.5); p.lSh = [1.8 + 0.4 * a, 0.5]; p.rSh = [1.6 - 0.4 * a, 0.45]; p.lEl = 0.6 + 0.3 * b; p.rEl = 0.7 - 0.3 * b; p.hipY = 0.9 + 0.03 * a; p.lKnee = 0.25 + 0.15 * a; p.rKnee = 0.25 - 0.15 * a; p.spineYaw = 0.2 * b; p.neck = -0.1; return p; },
  standStill: () => { const p = basePose(); p.lSh = [0.15, 0.1]; p.rSh = [0.2, 0.1]; p.neck = 0.05; return p; },
  lookUpStand: () => { const p = basePose(); p.neck = -0.75; p.spine = -0.12; p.lSh = [0.1, 0.12]; p.rSh = [0.1, 0.12]; return p; },
  lookUpSit: () => { const p = LF_POSES.sitGround(); p.neck = -0.7; p.spine = -0.2; return p; },
  player: () => { const p = basePose(); p.lSh = [0.3, 0.25]; p.rSh = [0.25, 0.25]; p.lEl = 0.7; p.rEl = 0.7; p.hipY = 0.9; p.lKnee = 0.25; p.rKnee = 0.3; p.lHip = [0.2, 0.08]; p.rHip = [0.15, 0.08]; p.spine = 0.12; return p; },
  turnKey: () => { const p = LF_POSES.drive(); p.rSh = [0.8, -0.25]; p.rEl = 1.3; return p; },
});
