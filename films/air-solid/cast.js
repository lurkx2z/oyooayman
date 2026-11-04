/* =====================================================================
   CAST — the people outside (the shared adult rig, js/world/people.js), the dog. Every one of them is a pure function
   of story time s (not of the shot), so the wide shots and the close ones always agree:
     before 2:00   walking, cycling, driving, running, jumping, swinging, kicking, throwing (each at their speed)
     2:00–2:00:03  held where they were, mid-move (stopped dead: the hit is physics.js saFlatH of their speed)
     after         from rest: the jumper drops to the sand, the runner tips over, the bike falls on its side, the swing
                   carries on; then 20 s, 40 s, a minute, two minutes later: shaken, standing, sitting, phoning
     saBuildCast(S, T, X) → C ; C.update(s) ; C.headOf(key) → world [x, y, z]
   ===================================================================== */

Object.assign(LOOKS, {
  saW1: { skin: 1, build: 'slim', shirt: '#b8462e', sleeves: 'long', pants: '#2a2d33', shoes: '#2a2018', sole: '#1a1612', hair: '#6a3a1a', hairStyle: 'long', coat: true, collar: true },
  saW2: { skin: 3, build: 'avg', shirt: '#3a4a5e', sleeves: 'long', pants: '#2a2d33', shoes: '#2a2018', sole: '#1a1612', hair: '#1a120c', coat: true, collar: true },
  saW3: { skin: 0, build: 'avg', shirt: '#6a7a52', sleeves: 'long', pants: '#3a3f4a', shoes: '#e8e4dc', sole: '#f2f0ea', hair: '#c8a46a', hairStyle: 'bun' },
  saW4: { skin: 2, build: 'broad', shirt: '#2f4a6a', sleeves: 'long', pants: '#33415a', shoes: '#e8e4dc', sole: '#d8d4ca', hair: '#2a1c14', hat: { type: 'cap', color: '#3a3a3c' } },
  saOld: { skin: 0, build: 'avg', shirt: '#6a6052', sleeves: 'long', pants: '#4a4640', shoes: '#2a2018', sole: '#1a1612', hair: '#d8d4cc', coat: true, collar: true },
  saRider: { skin: 2, build: 'avg', shirt: '#d9b84a', sleeves: 'long', pants: '#2a2d33', shoes: '#2a2018', sole: '#1a1612', hair: '#2a1a12', hat: { type: 'beanie', color: '#2f5a6a' } },
  saDriver: { skin: 4, build: 'avg', shirt: '#e8e4dc', sleeves: 'long', pants: '#2a2d33', shoes: '#2a2018', sole: '#1a1612', hair: '#141010' },
  saRun: { skin: 3, build: 'slim', shirt: '#e2553a', sleeves: 'short', pants: '#23262c', shoes: '#f2f0ea', sole: '#f2f0ea', hair: '#141010' },
  saGirl: { skin: 1, build: 'slim', shirt: '#e0b23a', sleeves: 'long', pants: '#c8463a', shoes: '#f2f0ea', sole: '#f2f0ea', hair: '#6a3a1a', hairStyle: 'pony' },
  saBoy: { skin: 4, build: 'slim', shirt: '#3a7ac8', sleeves: 'long', pants: '#2a2d33', shoes: '#e8e4dc', sole: '#f2f0ea', hair: '#141010' },
  saKick: { skin: 2, build: 'slim', shirt: '#c8322a', sleeves: 'short', pants: '#f2f0ea', shoes: '#1a1a1c', sole: '#f2f0ea', hair: '#2a1a12' },
  saKeep: { skin: 0, build: 'slim', shirt: '#2f8a5a', sleeves: 'long', pants: '#2a2d33', shoes: '#e8e4dc', sole: '#f2f0ea', hair: '#d8b06a', hat: { type: 'cap', color: '#2f5a8a' } },
  saOwner: { skin: 1, build: 'avg', shirt: '#4a6a8a', sleeves: 'long', pants: '#3a3633', shoes: '#3a2a20', sole: '#1a1612', hair: '#b8b0a4', hairStyle: 'long', coat: true, collar: true },
  saMum: { skin: 4, build: 'slim', shirt: '#7a3b54', sleeves: 'long', pants: '#2a2d33', shoes: '#d9d4c8', sole: '#f0ede6', hair: '#1a120c', hairStyle: 'long', coat: true, collar: true },
});
const SAPI = Math.PI;
const saEase = (s, a, b) => { const u = MathX.clamp((s - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };

// the people: key → [look, kid?]
const SA_PEOPLE = {
  w1: ['saW1'], w2: ['saW2'], w3: ['saW3'], w4: ['saW4'], w5: ['saOld'], rider: ['saRider'], driver: ['saDriver'], runner: ['saRun'],
  girl: ['saGirl', 1], boy: ['saBoy', 1], kicker: ['saKick', 1], keeper: ['saKeep', 1], owner: ['saOwner'], mum: ['saMum'], pic1: ['casual1'], pic2: ['casual2'],
  pond: ['casual3'], cafe1: ['casual4'], cafe2: ['casual5'], d1: ['casual6'], d2: ['casual7'], d3: ['casual8'],
};

function saWalkPose(ph, big = 1) {
  const p = basePose(), s = Math.sin(ph), co = Math.cos(ph);
  p.lHip = [0.42 * big * s, 0.03]; p.rHip = [-0.42 * big * s, 0.03];
  p.lKnee = 0.08 + 0.65 * big * Math.max(0, co) ** 1.5; p.rKnee = 0.08 + 0.65 * big * Math.max(0, -co) ** 1.5;
  p.lFoot = -0.2 * Math.max(0, co); p.rFoot = -0.2 * Math.max(0, -co);
  p.lSh = [-0.34 * big * s, 0.07]; p.rSh = [0.34 * big * s, 0.07]; p.lEl = 0.28 + 0.18 * Math.max(0, -s); p.rEl = 0.28 + 0.18 * Math.max(0, s);
  return p;
}
// running: the flight phase (both feet off the ground) at ph = 0; arms pumping
function saRunPose(ph) {
  const p = basePose(), s = Math.sin(ph), c = Math.cos(ph);
  p.lHip = [0.15 + 0.7 * s, 0.03]; p.rHip = [0.15 - 0.7 * s, 0.03]; p.lKnee = 0.5 + 0.9 * Math.max(0, -s) + 0.35 * (1 + c) * 0.5; p.rKnee = 0.5 + 0.9 * Math.max(0, s) + 0.35 * (1 + c) * 0.5;
  p.lFoot = 0.2; p.rFoot = 0.2; p.lSh = [-0.6 * s, 0.12]; p.rSh = [0.6 * s, 0.12]; p.lEl = 1.45; p.rEl = 1.45; p.spine = 0.16; p.neck = -0.08; p.hipY = 0.9;
  return p;
}
const SA_POSES = {
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
  sitHurt: () => { const p = SA_POSES.sitGround(); p.rSh = [0.7, -0.35]; p.rEl = 1.9; p.lSh = [0.2, 0.25]; p.lEl = 0.3; p.neck = 0.35; p.spine = 0.38; return p; },
  sit: () => { const p = basePose(); p.hipY = 0.47; p.lHip = [1.5, 0.08]; p.rHip = [1.5, 0.08]; p.lKnee = 1.5; p.rKnee = 1.5; p.spine = -0.05; p.neck = 0.1; p.lSh = [0.45, 0.1]; p.lEl = 1.05; p.rSh = [0.5, 0.1]; p.rEl = 1.1; return p; },
  drive: () => { const p = SA_POSES.sit(); p.lHip = [1.25, 0.1]; p.rHip = [1.3, 0.06]; p.lKnee = 1.05; p.rKnee = 1.0; p.spine = -0.12; p.lSh = [1.05, 0.2]; p.rSh = [1.05, 0.2]; p.lEl = 0.75; p.rEl = 0.75; return p; },
  slump: () => { const p = SA_POSES.drive(); p.spine = 0.45; p.neck = 0.55; p.lSh = [0.4, 0.25]; p.rSh = [1.2, -0.1]; p.rEl = 1.9; p.lEl = 0.4; return p; },
  ride: (ph = 0) => { const p = basePose(); p.hipY = 0.86; const a = Math.sin(ph), b = Math.cos(ph);
    p.lHip = [1.15 + 0.3 * a, 0.14]; p.rHip = [1.15 - 0.3 * a, 0.14]; p.lKnee = 1.45 + 0.45 * b; p.rKnee = 1.45 - 0.45 * b; p.lFoot = 0.25; p.rFoot = 0.25;
    p.spine = 0.38; p.neck = -0.2; p.lSh = [1.2, 0.18]; p.lEl = 0.4; p.rSh = [1.2, 0.18]; p.rEl = 0.4; return p; },
  jump: () => { const p = basePose(); p.lSh = [2.3, 0.55]; p.rSh = [2.1, 0.6]; p.lEl = 0.3; p.rEl = 0.4; p.lHip = [0.55, 0.12]; p.rHip = [0.35, 0.1]; p.lKnee = 0.9; p.rKnee = 1.1; p.spine = -0.08; p.neck = 0.25; p.mouth = 1; return p; },
  land: () => { const p = SA_POSES.crouch(); p.lSh = [0.9, 0.6]; p.rSh = [1.0, 0.55]; p.hipY = 0.5; return p; },
  swing: (k = 1) => { const p = basePose(); p.hipY = 0.5; p.lHip = [1.45, 0.06]; p.rHip = [1.45, 0.06]; p.lKnee = 0.25 + 1.2 * (1 - k); p.rKnee = 0.25 + 1.2 * (1 - k); p.spine = -0.35 * k; p.neck = 0.25 * k; p.lSh = [2.5, 0.22]; p.rSh = [2.5, 0.22]; p.lEl = 0.35; p.rEl = 0.35; p.mouth = k; return p; },
  kick: () => { const p = basePose(); p.rHip = [1.25, 0.05]; p.rKnee = 0.2; p.lKnee = 0.3; p.lHip = [-0.15, 0.05]; p.lSh = [-0.5, 0.65]; p.rSh = [0.7, 0.55]; p.spine = -0.2; p.neck = -0.25; return p; },
  keeper: () => { const p = basePose(); p.lSh = [1.3, 0.8]; p.rSh = [1.3, 0.8]; p.lEl = 0.4; p.rEl = 0.4; p.hipY = 0.82; p.lHip = [0.4, 0.3]; p.rHip = [0.4, 0.3]; p.lKnee = 0.6; p.rKnee = 0.6; p.spine = 0.25; return p; },
  throw: () => { const p = basePose(); p.rSh = [1.55, -0.45]; p.rEl = 0.1; p.lSh = [0.35, 0.5]; p.lEl = 0.5; p.spineYaw = -0.35; p.spine = 0.1; p.lHip = [0.35, 0.08]; p.lKnee = 0.3; p.rHip = [-0.2, 0.05]; p.rKnee = 0.15; p.hipY = 0.88; return p; },
  catch: () => { const p = basePose(); p.lSh = [2.0, 0.3]; p.rSh = [2.0, 0.3]; p.lEl = 0.2; p.rEl = 0.2; p.spine = 0.1; p.neck = -0.3; return p; },
};
const saSt = (p, x, z, yaw, o = {}) => Object.assign({ p, pos: [x, o.y || 0, z], yaw }, o);
// walking at v (m/s) along yaw (0 = +z; the person's facing), at x0, z0 at 2:00; frozen mid-step at 2:00 (ph0 = its stride
// phase then: one foot off the ground); afterwards the after(s) states
function saWalker(s, x0, z0, yaw, v, ph0, stride = 0.74) {
  const d = v * Math.min(0, s), ph = ph0 + d / stride * SAPI;
  return saSt(saWalkPose(ph), x0 + Math.sin(yaw) * d, z0 + Math.cos(yaw) * d, yaw);
}
function saFidget(p, s, i, a = 1) { p.headYaw += 0.3 * a * noise1(s * 0.11, i + 2); p.spineYaw += 0.06 * a * noise1(s * 0.07, i + 4); p.neck += 0.06 * a * noise1(s * 0.09, i + 6); return p; }
const saYaw = (fx, fz) => Math.atan2(fx, fz);                         // facing a direction (x, z)
// a blend through a list of [s, pose] keys (the pose at each key held until the next one starts to blend in over bl s)
function saKeys(s, K, bl = 0.6) { let i = 0; while (i + 1 < K.length && s >= K[i + 1][0]) i++; const p = K[i][1]; if (i && s - K[i][0] < bl) return lerpPose(K[i - 1][1], p, saEase(s, K[i][0], K[i][0] + bl)); return p; }

// ---------------------------------------------------------------------------------------------------------------------
// WHERE THEY ARE AT 2:00 (world)
// ---------------------------------------------------------------------------------------------------------------------
const SA_CP = {
  w1: { x: 2.6, z: -0.95, yaw: -SAPI / 2, v: 1.35, ph: SAPI * 0.5 },      // your pavement, walking east (a shopping bag)
  w2: { x: 7.0, z: -1.4, yaw: SAPI / 2, v: 1.4, ph: SAPI * 1.45 },        // your pavement, walking west
  w3: { x: -3.1, z: -10.3, yaw: SAPI / 2, v: 1.3, ph: SAPI * 0.55 },      // the park side: a couple, walking west
  w4: { x: -3.0, z: -10.95, yaw: SAPI / 2, v: 1.3, ph: SAPI * 1.55 },
  w5: { x: 10.4, z: -10.6, yaw: -SAPI / 2, v: 0.85, ph: SAPI * 0.4 },     // an old man, walking east with a stick
  girl: { x: 36.55, z: -29.4, y: 1.1, yaw: SAPI / 2 + 0.2 },             // off the climbing frame (its top 2 m), on her way down
  kicker: { x: 27.9, z: -40.75, yaw: saYaw(-9.5, 4.0) }, keeper: { x: 15.5, z: -35.2, yaw: saYaw(9, -4) },
  owner: { x: -16.6, z: -30.2, yaw: -SAPI / 2 - 0.08 },
  dog: { x: -22.85, z: -30.92, y: 0.46, yaw: -SAPI / 2 - 0.13 },          // mid-leap: its nose 30 cm short of the frisbee
};
const SA_SWING = { i: 1, th: 1.0, L: 1.97, per: 2.98 };                  // the middle swing: at the top of its arc (57°)
const saSwingTh = (s) => { const u = s < 0 ? s : s < SAP.T ? 0 : s - SAP.T; return SA_SWING.th * Math.cos(2 * SAPI * u / SA_SWING.per) * Math.exp(-0.012 * Math.max(0, u)); };

// every person's state at story s → [key, { p, pos, yaw } | { m: Matrix4 (root, world), p }]
function saCastStates(s, C) {
  const out = [], put = (k, st) => out.push([k, st]), L = s >= SAP.T, u = saRel(s);
  // ---- the walkers: held mid-step; a stumble (they were stopped from 5 km/h: 10 cm); then shaken, talking, phoning
  for (const k of ['w1', 'w2', 'w3', 'w4', 'w5']) {
    const P = SA_CP[k], st = saWalker(s, P.x, P.z, P.yaw, P.v, P.ph);
    if (L) { const pz = st.p, after = { w1: [[3, pz], [3.25, SA_POSES.armsOut()], [5, SA_POSES.chest()], [20, SA_POSES.talk()], [40, SA_POSES.lookAround()]],
        w2: [[3, pz], [3.25, SA_POSES.armsOut()], [5.5, SA_POSES.lookAround()], [20, SA_POSES.talk()], [55, SA_POSES.phone()]],
        w3: [[3, pz], [3.3, SA_POSES.armsOut()], [5, SA_POSES.hug()], [40, SA_POSES.lookAround()]],
        w4: [[3, pz], [3.3, SA_POSES.armsOut()], [5, SA_POSES.hug()], [40, SA_POSES.phone()]],
        w5: [[3, pz], [3.2, SA_POSES.armsOut()], [4.5, SA_POSES.crouch()], [9, SA_POSES.sitGround()], [60, SA_POSES.sitGround()]] }[k];
      st.p = saFidget(saKeys(s, after, 0.5), s, k.charCodeAt(1), 0.6);
      if (k === 'w1' && s > 20) st.yaw = SA_CP.w1.yaw + 2.6 * saEase(s, 20, 22);      // turned to the man
      if (k === 'w2' && s > 20) st.yaw = SA_CP.w2.yaw - 2.7 * saEase(s, 20, 22);
      if ((k === 'w3' || k === 'w4') && s > 5) st.yaw = P.yaw + (k === 'w3' ? -1 : 1) * SAPI / 2 * saEase(s, 4.5, 5.2);
    }
    put(k, st);
  }
  // ---- the runner (11 km/h: flight phase at 2:00, legs apart, 10 cm off the ground); afterwards he lands and tips forward
  { const P = SA_RUNP, v = P.kmh / 3.6, d = v * Math.min(0, s), ph = d / 1.45 * SAPI + 1.35;
    let p = saRunPose(ph), y = 0.1 * Math.abs(Math.sin(ph)), th = 0;
    if (L) { y = Math.max(0, 0.098 - 4.905 * u * u); th = saTip(P.th0, P.L, SAP.T + 0.14, s, 1.42); p = lerpPose(saRunPose(1.35), SA_POSES.catch(), saEase(th, 0.2, 1.1)); p.lHip = [0.4 * (1 - saEase(th, 0.6, 1.4)), 0.05]; p.rHip = [-0.2, 0.05]; p.lKnee = 0.3; p.rKnee = 0.4;
      if (s > 14) { p = saKeys(s, [[14, SA_POSES.sitGround()], [45, SA_POSES.sitHurt()]], 1.2); th = 0; y = 0; } }
    const x0 = P.x + d;
    put('runner', saSt(p, x0 + (s > 14 ? 0.9 : 0), P.z, P.yaw + (s > 14 ? 0.4 : 0), { y, tip: th })); }
  // ---- the girl off the climbing frame: held in the air; drops 1.1 m (lands 2:00:03.47), crouches, sits on the sand
  { const P = SA_CP.girl, pre = s < 0 ? s : 0, y = L ? Math.max(0, P.y - 4.905 * u * u) : P.y + Math.min(0, s) * -3.1 - 4.905 * pre * pre, x = P.x + 1.8 * pre;
    const land = SAP.T + Math.sqrt(2 * P.y / SAP.g), p = !L || s < land ? SA_POSES.jump() : saKeys(s, [[land, SA_POSES.land()], [land + 1.4, SA_POSES.sitGround()], [20, SA_POSES.lookAround()]], 0.35);
    put('girl', saSt(p, x, P.z, P.yaw, { y })); }
  // ---- the boy on the swing (at the top of its arc at 2:00; from rest it carries on); he stops it with his feet later
  { const th = saSwingTh(s), sw = C.T.swings[SA_SWING.i].pv, pv = sw.position, k = Math.min(1, Math.abs(th) / SA_SWING.th);
    const hip = new THREE.Vector3(0, -SA_SWING.L + 0.04, 0.03).applyAxisAngle(new THREE.Vector3(1, 0, 0), th).add(pv);
    const p = SA_POSES.swing(th > 0 ? k : 0.2); const hy = p.hipY * C.P.boy.scale * 0.66;
    put('boy', { p, pos: [hip.x, hip.y - hy, hip.z], yaw: SAPI, pitch: -th }); }
  // ---- the kicker and the keeper; the dog's owner
  { const P = SA_CP.kicker; put('kicker', saSt(saKeys(s, [[-9, SA_POSES.kick()], [3.4, SA_POSES.armsOut()], [4.4, SA_POSES.lookAround()]], 0.4), P.x, P.z, P.yaw));
    const Q = SA_CP.keeper; put('keeper', saSt(saKeys(s, [[-9, SA_POSES.keeper()], [4.2, SA_POSES.lookAround()]], 0.5), Q.x, Q.z, Q.yaw)); }
  { const P = SA_CP.owner; put('owner', saSt(saKeys(s, [[-9, SA_POSES.throw()], [3.5, SA_POSES.armsOut()], [5, SA_POSES.lookAround()]], 0.5), P.x, P.z, P.yaw)); }
  // ---- the cyclist (on the bike: posed in its frame until he's off it, 14 s after)
  { const p = s < 14 ? SA_POSES.ride(s < 0 ? (s * 20 / 3.6) / 0.34 / 2.6 + 2.2 : 2.2) : saKeys(s, [[14, SA_POSES.sitHurt()], [60, SA_POSES.phone()]], 1);
    if (L && s < 14) { const r = saEase(C.X.bikeRoll || 0, 0.4, 1.3); p.lSh = [1.2 + 0.9 * r, 0.6 * r]; p.rSh = [1.2 + 0.5 * r, 0.3]; p.neck = -0.2 + 0.5 * r; }
    put('rider', s < 14 ? { p, bike: true } : saSt(p, SA_BIKE.x + 0.4, SA_BIKE.z + 0.9, SAPI * 0.85)); }
  // ---- the driver (in the car: posed in its frame); slumped over the wheel after, then holding his chest
  { const p = s < SAP.T ? SA_POSES.drive() : saKeys(s, [[SAP.T, SA_POSES.drive()], [3.3, SA_POSES.slump()], [30, SA_POSES.slump()], [44, SA_POSES.chest()]], 0.6); put('driver', { p, car: true }); }
  // ---- people sitting, standing (nothing to stop: they barely notice, then they do)
  put('pic1', saSt(saFidget(SA_POSES.sit(), s, 31), 14.0, -26.4, SAPI, { y: 0.0 })); put('pic2', saSt(saFidget(SA_POSES.sit(), s, 32), 14.4, -27.7, 0, { y: 0.0 }));
  put('pond', saSt(saFidget(s < 5 ? SA_POSES.stand() : SA_POSES.lookAround(), s, 33), 7.6, -43.2, saYaw(-7.6, -8.8)));
  put('mum', saSt(saFidget(s < 5 ? SA_POSES.stand() : SA_POSES.phone(), s, 34), 38.6, -26.4, saYaw(-2, -3)));
  put('cafe1', saSt(saFidget(SA_POSES.sit(), s, 35), 41.5 + 0.72, -1.0 - 0.5, -SAPI / 2)); put('cafe2', saSt(saFidget(SA_POSES.sit(), s, 36), 46 - 0.7, -1.1 + 0.4, SAPI / 2));
  // ---- on the main road: drivers who got out (a minute later)
  { const a = SA_TRAFFIC[1], b = SA_TRAFFIC[8], c = SA_TRAFFIC[2];
    put('d1', s < 52 ? { hide: true } : saSt(saFidget(SA_POSES.phone(), s, 37), saLaneX(a[1]) - 1.5, a[0] + 0.6, SAPI / 2 + 0.4));
    put('d2', s < 58 ? { hide: true } : saSt(saFidget(SA_POSES.lookAround(), s, 38), saLaneX(b[1]) + 1.4, b[0] - 0.4, -SAPI / 2));
    put('d3', s < 60 ? { hide: true } : saSt(saFidget(SA_POSES.sitGround(), s, 39), 75.2, c[0] - 1.2, -SAPI / 2)); }
  return out;
}

function saBuildCast(S, T, X) {
  const scene = S.scene, C = { T, X, P: {} };
  for (const [k, [look, kid]] of Object.entries(SA_PEOPLE)) { const g = new Person({ id: 'sa' + k, look }, null); if (kid) g.root.scale.setScalar(0.66); scene.add(g.root); C.P[k] = g; }
  // props: a shopping bag (w1), the old man's stick (w5)
  { const h = C.P.w1.j.la.hand, bag = new THREE.Group(); saBox(0.3, 0.32, 0.14, saStd('#e8e2d0', 0.9), 0, -0.2, 0, bag); for (let i = 0; i < 3; i++) saMesh(new THREE.SphereGeometry(0.045, 10, 8), saStd(['#e88a22', '#c8321e', '#5a8a2a'][i], 0.5), -0.07 + 0.07 * i, -0.04, 0, bag); h.add(bag); C.bag = bag; }
  { const st = saCyl(0.012, 0.014, 0.88, saStd('#4a3420', 0.7), 0, -0.44, 0.02, C.P.w5.j.ra.hand, 6); st.rotation.x = 0.1; }
  // the dog
  C.dog = saBuildQuad(SA_DOG); scene.add(C.dog.root);
  { const hm = saStd('#c8322a', 0.6); saMesh(new THREE.TorusGeometry(SA_DOG.body[0] * 1.02, 0.018, 6, 20), hm, 0, 0, SA_DOG.len * 0.22, C.dog.front); }
  C.update = (s) => saCastUpdate(C, s);
  C.headOf = (k) => saHeadOf(C.P[k]).toArray();
  // the rider in the bike's frame, the driver in the car's: [x, y, z] of the root, its yaw (frame-local)
  C.riderAt = [-0.36, 0.0, 0.0]; C.driverAt = null;
  return C;
}
const _saCy = new THREE.Vector3(0, 1, 0), _saCx = new THREE.Vector3(1, 0, 0), _saCz = new THREE.Vector3(0, 0, 1), _saQ1 = new THREE.Quaternion(), _saQ2 = new THREE.Quaternion(), _saM1 = new THREE.Matrix4();
function saCastUpdate(C, s) {
  const X = C.X;
  for (const [k, st] of saCastStates(s, C)) {
    const P = C.P[k], R = P.root;
    if (st.hide) { R.visible = false; continue; }
    R.visible = true; P.apply(st.p);
    if (st.bike || st.car) {                                              // in a frame: the bike's or the car's
      const F = st.bike ? X.bike : X.car.g; F.updateMatrixWorld(true);
      if (st.car && !C.driverAt) { const bb = new THREE.Box3().setFromObject(X.car.o.group), inv = new THREE.Matrix4().copy(X.car.g.matrixWorld).invert(); bb.applyMatrix4(inv); C.driverAt = [bb.min.x + (bb.max.x - bb.min.x) * 0.47, 0.05, (bb.max.z - bb.min.z) * 0.2]; }
      const at = st.bike ? C.riderAt : C.driverAt;
      _saM1.compose(new THREE.Vector3(...at), _saQ1.setFromAxisAngle(_saCy, SAPI / 2), new THREE.Vector3(1, 1, 1)).premultiply(F.matrixWorld);
      _saM1.decompose(R.position, R.quaternion, new THREE.Vector3()); continue;
    }
    R.position.set(st.pos[0], st.pos[1], st.pos[2]); R.quaternion.setFromAxisAngle(_saCy, st.yaw);
    if (st.pitch) R.quaternion.multiply(_saQ2.setFromAxisAngle(_saCx, st.pitch));
    if (st.tip) {                                                         // tipping forward about his front foot
      const fwd = new THREE.Vector3(Math.sin(st.yaw), 0, Math.cos(st.yaw)), axis = new THREE.Vector3().crossVectors(_saCy, fwd).normalize(), q = _saQ2.setFromAxisAngle(axis, st.tip);
      const piv = new THREE.Vector3(st.pos[0], 0, st.pos[2]).addScaledVector(fwd, 0.3), rel = R.position.clone().sub(piv).applyQuaternion(q);
      R.position.copy(piv).add(rel); R.quaternion.premultiply(q); }
  }
  // the swings: the middle one carries the boy; the others hang still
  C.T.swings.forEach((w, i) => { w.pv.rotation.x = i === SA_SWING.i ? saSwingTh(s) : 0; });
  // the dog: leaping for the frisbee; held; drops from rest (lands 2:00:03.30), then has it
  { const P = SA_CP.dog, D = C.dog, pre = Math.min(0, s), u = saRel(s), land = SAP.T + Math.sqrt(2 * P.y / SAP.g);
    const y = s < 0 ? Math.max(0, P.y + 1.2 * pre - 4.905 * pre * pre) : s < SAP.T ? P.y : Math.max(0, P.y - 4.905 * u * u), x = P.x + Math.sin(P.yaw) * 6.5 * pre;
    const z = P.z + Math.cos(P.yaw) * 6.5 * pre;
    D.root.position.set(x, y, z); D.root.quaternion.setFromAxisAngle(_saCy, P.yaw);
    const air = s < land; D.root.quaternion.multiply(_saQ2.setFromAxisAngle(_saCx, air ? -0.18 : 0));
    saPoseQuad(D, air ? saQuadPose({ stretch: 1, head: [0.25, 0], tail: [0.1, 0.2], crouch: 0 }) : saQuadPose({ crouch: 0.6 * Math.exp(-(s - land) / 0.3), head: [0.5 * Math.exp(-(s - land) / 0.8) - 0.3, 0.3 * Math.sin(s * 1.3)], tail: [0.5, 0.6 * Math.sin(s * 11)] })); }
}
// a person's head (world), for the camera and labels
function saHeadOf(P) { const v = new THREE.Vector3(0, 1.55 * P.scale, 0.06); P.root.updateMatrixWorld(true); return P.root.localToWorld(v); }
