/* =====================================================================
   CAST — the people outside (the shared adult rig, js/world/people.js), the dog on its lead, the pigeons. Each shot
   (mode) has its scene, posed from story time s. The runner is the film's thread through the park:
     3:04:11  stretching by the path, music on (she hasn't heard)
     3:04:17  she starts her run; on her first stride (3:04:18) both feet leave the ground and she falls up, into the
              plane tree's low branch; she grabs it and swings up over it: she hangs from it upside down, feet to the sky
     3:10:00  it all switches back: she swings down under the branch, hangs the normal way, and drops to the path
   People hold what they hold (props on their hands) until the moment they let go (SA_REL: then things.js flies it).
     saBuildCast(S, T) → C ; C.update(s, o) ; C.relAt(key) → world [x, y, z] of a prop at its release moment
   ===================================================================== */

Object.assign(LOOKS, {
  saRun: { skin: 2, build: 'slim', shirt: '#e2553a', sleeves: 'short', pants: '#23262c', shoes: '#f2f0ea', sole: '#f2f0ea', hair: '#2a1a12', hairStyle: 'pony' },
  saKeys: { skin: 1, build: 'avg', shirt: '#3a4a5e', sleeves: 'long', pants: '#2a2d33', shoes: '#2a2018', sole: '#1a1612', hair: '#3a2a1a', coat: true, collar: true },
  saCoffee: { skin: 3, build: 'slim', shirt: '#c9a36a', sleeves: 'long', pants: '#1f2228', shoes: '#1f1a16', sole: '#1a1612', hair: '#1a120c', hairStyle: 'bun', coat: true, collar: true },
  saPhoneG: { skin: 4, build: 'slim', shirt: '#5a6a3a', sleeves: 'long', pants: '#3a3f4a', shoes: '#e8e4dc', sole: '#f2f0ea', hair: '#141010', hat: { type: 'beanie', color: '#c8463a' } },
  saMum: { skin: 4, build: 'slim', shirt: '#2f5a6a', sleeves: 'long', pants: '#2a2d33', shoes: '#d9d4c8', sole: '#f0ede6', hair: '#1a120c', hairStyle: 'long', coat: true, collar: true },
  saKid: { skin: 4, build: 'slim', shirt: '#e0b23a', sleeves: 'long', pants: '#c8463a', shoes: '#f2f0ea', sole: '#f2f0ea', hair: '#1a120c', hairStyle: 'pony' },
  saKid2: { skin: 1, build: 'slim', shirt: '#3a7ac8', sleeves: 'short', pants: '#2a2d33', shoes: '#e8e4dc', sole: '#f2f0ea', hair: '#6a4a2a', hat: { type: 'cap', color: '#c8463a' } },
  saOld: { skin: 0, build: 'avg', shirt: '#6a6052', sleeves: 'long', pants: '#4a4640', shoes: '#2a2018', sole: '#1a1612', hair: '#d8d4cc', coat: true, collar: true },
  saDad: { skin: 2, build: 'broad', shirt: '#7a3b34', sleeves: 'long', pants: '#33415a', shoes: '#e8e4dc', sole: '#d8d4ca', hair: '#2a1c14' },
  saOwner: { skin: 1, build: 'avg', shirt: '#4a6a8a', sleeves: 'long', pants: '#3a3633', shoes: '#3a2a20', sole: '#1a1612', hair: '#b8b0a4', hairStyle: 'long', coat: true, collar: true },
});
const SAPI = Math.PI;
const saEase = (s, a, b) => { const u = MathX.clamp((s - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };

// the people: [look, kid?]
const SA_PEOPLE = [
  ['saRun'], ['saKeys'], ['saCoffee'], ['saPhoneG'], ['saMum'], ['saKid', 1], ['saKid2', 1], ['saOld'], ['saDad'], ['saOwner'],
  ['casual1'], ['casual2'], ['casual3'], ['casual4'], ['casual5'], ['casual6'], ['casual7'], ['casual8'], ['saKid2', 1],
];
const SA_P = { run: 0, keys: 1, coffee: 2, phone: 3, mum: 4, kid: 5, kid2: 6, old: 7, dad: 8, owner: 9, kid3: 18 };
// the props people hold until they let go: key → [person, hand ('r' | 'l'), the mode we see it in, story s it goes]
const SA_REL = { keys: [SA_P.keys, 'r', 'street', SA_FLY.keys.s0], cup: [SA_P.coffee, 'r', 'street', SA_FLY.cup.s0], phone: [SA_P.phone, 'r', 'street', SA_FLY.phone.s0],
  scoop: [SA_P.kid, 'r', 'scoop', SA_FLY.scoop.s0], coat: [SA_P.dad, 'r', 'rope', SA_FLY.coat.s0], stick: [SA_P.owner, 'r', 'dog', SA_FLY.stick.s0] };

function saWalkPose(ph, big = 1) {
  const p = basePose(), s = Math.sin(ph), co = Math.cos(ph);
  p.lHip = [0.42 * big * s, 0.03]; p.rHip = [-0.42 * big * s, 0.03];
  p.lKnee = 0.08 + 0.65 * big * Math.max(0, co) ** 1.5; p.rKnee = 0.08 + 0.65 * big * Math.max(0, -co) ** 1.5;
  p.lFoot = -0.2 * Math.max(0, co); p.rFoot = -0.2 * Math.max(0, -co);
  p.lSh = [-0.34 * big * s, 0.07]; p.rSh = [0.34 * big * s, 0.07]; p.lEl = 0.28 + 0.18 * Math.max(0, -s) + (big > 1 ? 0.9 : 0); p.rEl = 0.28 + 0.18 * Math.max(0, s) + (big > 1 ? 0.9 : 0);
  if (big > 1) { p.spine = 0.18; p.hipY = 0.9 + 0.04 * Math.abs(s); }
  return p;
}
const SA_POSES = {
  stand: () => basePose(),
  shield: () => { const p = basePose(); p.lSh = [2.5, 0.35]; p.rSh = [2.45, 0.38]; p.lEl = 1.7; p.rEl = 1.75; p.neck = 0.25; p.spine = 0.12; p.lKnee = 0.3; p.rKnee = 0.25; p.lHip = [0.2, 0.08]; p.rHip = [0.18, 0.08]; p.hipY = 0.86; return p; },
  lookUp: () => { const p = basePose(); p.neck = -0.55; p.spine = -0.1; p.lSh = [0.5, 0.25]; p.rSh = [0.3, 0.2]; p.lEl = 0.9; p.rEl = 0.4; return p; },
  point: () => { const p = basePose(); p.neck = -0.5; p.spine = -0.1; p.rSh = [2.3, 0.2]; p.rEl = 0.15; p.lSh = [0.3, 0.2]; p.lEl = 0.6; return p; },
  armsOut: () => { const p = basePose(); p.lSh = [0.6, 0.9]; p.rSh = [0.7, 0.85]; p.lEl = 0.3; p.rEl = 0.35; p.neck = 0.1; p.lKnee = 0.35; p.rKnee = 0.3; p.lHip = [0.25, 0.12]; p.rHip = [0.2, 0.12]; p.hipY = 0.85; return p; },
  crouch: () => { const p = basePose(); p.hipY = 0.6; p.lHip = [1.1, 0.12]; p.rHip = [1.1, 0.12]; p.lKnee = 1.6; p.rKnee = 1.6; p.lFoot = 0.35; p.rFoot = 0.35; p.spine = 0.35; p.lSh = [0.9, 0.3]; p.rSh = [0.8, 0.3]; p.lEl = 0.4; p.rEl = 0.4; return p; },
  // lying along the branch on its sky side, arms and legs locked round it (the branch runs along her, under her belly)
  sloth: () => { const p = basePose(); p.lSh = [2.6, 0.22]; p.rSh = [2.6, 0.22]; p.lEl = 0.25; p.rEl = 0.25; p.neck = 0.35; p.spine = 0.1; p.lHip = [0.95, 0.22]; p.rHip = [0.95, 0.22]; p.lKnee = 1.35; p.rKnee = 1.35; p.lFoot = 0.4; p.rFoot = 0.4; return p; },
  armsUp: () => { const p = basePose(); p.lSh = [2.85, 0.12]; p.rSh = [2.85, 0.12]; p.lEl = 0.1; p.rEl = 0.1; p.neck = -0.3; p.spine = -0.05; return p; },
  reachUp: () => { const p = basePose(); p.lSh = [2.6, 0.3]; p.rSh = [2.4, 0.35]; p.lEl = 0.25; p.rEl = 0.3; p.neck = -0.55; p.spine = -0.12; return p; },
  talk: () => { const p = basePose(); p.lSh = [0.9, 0.3]; p.rSh = [1.2, 0.25]; p.lEl = 1.3; p.rEl = 1.1; p.mouth = 1; p.neck = 0.05; return p; },
  cup: () => { const p = basePose(); p.rSh = [0.75, 0.12]; p.rEl = 1.75; p.lSh = [0.1, 0.1]; p.neck = 0.05; return p; },
  phone: () => { const p = basePose(); p.rSh = [0.55, 0.05]; p.rEl = 1.55; p.lSh = [0.5, 0.05]; p.lEl = 1.5; p.neck = 0.45; return p; },
  hold: () => { const p = basePose(); p.lSh = [1.5, 0.15]; p.rSh = [1.45, 0.2]; p.lEl = 0.5; p.rEl = 0.6; p.spine = 0.12; p.lKnee = 0.2; p.rKnee = 0.3; p.lHip = [0.15, 0.05]; p.rHip = [0.25, 0.05]; return p; },
  hug: () => { const p = basePose(); p.lSh = [1.1, -0.15]; p.rSh = [1.05, -0.12]; p.lEl = 2.1; p.rEl = 2.15; p.spine = 0.22; p.neck = 0.2; return p; },
  kick: () => { const p = basePose(); p.rHip = [1.0, 0.05]; p.rKnee = 0.2; p.lKnee = 0.25; p.lSh = [-0.4, 0.5]; p.rSh = [0.5, 0.4]; p.spine = -0.15; return p; },
  backswing: () => { const p = basePose(); p.rHip = [-0.6, 0.05]; p.rKnee = 1.1; p.lKnee = 0.2; p.lSh = [0.5, 0.4]; p.rSh = [-0.3, 0.3]; p.spine = 0.12; return p; },
  sit: () => { const p = basePose(); p.hipY = 0.5; p.lHip = [1.5, 0.08]; p.rHip = [1.5, 0.08]; p.lKnee = 1.5; p.rKnee = 1.5; p.spine = -0.05; p.neck = 0.1; p.lSh = [0.45, 0.1]; p.lEl = 1.05; p.rSh = [0.5, 0.1]; p.rEl = 1.1; return p; },
  sitGround: () => { const p = basePose(); p.hipY = 0.13; p.lHip = [1.45, 0.25]; p.rHip = [1.35, 0.2]; p.lKnee = 1.9; p.rKnee = 1.2; p.spine = 0.25; p.lSh = [0.6, 0.3]; p.rSh = [0.5, 0.3]; p.lEl = 0.9; p.rEl = 0.8; p.neck = -0.2; return p; },
  stretch: () => { const p = basePose(); p.lSh = [2.9, 0.15]; p.rSh = [2.9, 0.15]; p.lEl = 0.4; p.rEl = 0.4; p.spineRoll = 0.25; p.neck = 0.05; return p; },
  lunge: () => { const p = basePose(); p.hipY = 0.78; p.lHip = [0.9, 0.05]; p.lKnee = 1.0; p.rHip = [-0.5, 0.05]; p.rKnee = 0.15; p.spine = 0.15; p.lSh = [0.2, 0.2]; p.rSh = [0.2, 0.2]; p.lEl = 0.4; p.rEl = 0.4; return p; },
  throwBack: () => { const p = basePose(); p.rSh = [2.0, 0.4]; p.rEl = 1.6; p.lSh = [1.0, 0.2]; p.lEl = 0.4; p.spine = -0.1; p.neck = -0.3; p.lKnee = 0.3; p.hipY = 0.88; return p; },
  throwUp: () => { const p = basePose(); p.rSh = [2.9, 0.1]; p.rEl = 0.05; p.lSh = [0.6, 0.2]; p.lEl = 0.4; p.spine = -0.15; p.neck = -0.55; return p; },
  lead: () => { const p = basePose(); p.lSh = [1.1, 0.15]; p.lEl = 0.6; p.rSh = [0.8, 0.1]; p.rEl = 1.0; p.spine = 0.05; return p; },
  leadUp: () => { const p = basePose(); p.lSh = [2.2, 0.1]; p.lEl = 0.2; p.rSh = [2.1, 0.15]; p.rEl = 0.25; p.spine = -0.15; p.neck = -0.6; p.lKnee = 0.35; p.rKnee = 0.3; p.hipY = 0.86; p.lHip = [0.25, 0.1]; p.rHip = [0.1, 0.1]; return p; },
};
const saSt = (p, x, z, yaw, o = {}) => Object.assign({ p, pos: [x, o.y || 0, z], yaw }, o);
function saWalkSt(s, s0, x0, z0, yaw, v, o = {}) {
  const d = Math.max(0, s - s0) * v, ph = d / (o.stride || 0.72) * SAPI;
  return saSt(saWalkPose(ph, o.big || 1), x0 + Math.sin(yaw) * d, z0 + Math.cos(yaw) * d, yaw, o);
}
function saFidget(p, s, i, a = 1) { p.headYaw += 0.3 * a * noise1(s * 0.11, i + 2); p.spineYaw = 0.06 * a * noise1(s * 0.07, i + 4); p.neck += 0.06 * a * noise1(s * 0.09, i + 6); return p; }
const saYaw = (fx, fz) => Math.atan2(fx, fz);                         // facing a direction (x, z)

// ---------------------------------------------------------------------------------------------------------------------
// THE RUNNER (pose and place: special, she ends up upside down). → { p, q (THREE.Quaternion), pos }
// ---------------------------------------------------------------------------------------------------------------------
const SA_RUN = { x0: -1.6, z: -15.0, sRun: SA.sRun, sLift: SA.sLift, acc: 3.0, grabU: 0.86, sDrop: 606.4, sLock: 288 };   // sLock: (off camera) she has got her legs round the branch
function saRunner(s, C) {
  const R = SA_RUN, yaw = -SAPI / 2, B = C.T.branchAt(R.grabU), qY = new THREE.Quaternion().setFromAxisAngle(_fuCy, yaw), out = { q: new THREE.Quaternion() };
  const vRun = R.acc * (R.sLift - R.sRun), xLift = R.x0 - 0.5 * R.acc * (R.sLift - R.sRun) ** 2;
  // the rise: centre up at g (from 0.8 m/s), along at her running speed, until her hands reach the branch
  const H = C.handOff;                                                 // hands above her feet in the armsUp pose (body frame)
  const rise = (tau) => 0.8 * tau + 4.905 * tau * tau;
  let tg = 0.3; for (let k = 0; k < 40; k++) { const f = rise(tg) + H[1] - B[1]; tg -= f / (0.8 + 9.81 * tg); }
  C.sGrab = R.sLift + tg;
  if (s < R.sRun) {                                                    // stretching (music on)
    const u = ((s - 240) / 5.5) % 2, k = Math.abs(u - 1), p = lerpPose(SA_POSES.stretch(), SA_POSES.lunge(), MathX.smooth(k, 0.2, 0.8));
    p.spineRoll = 0.25 * Math.sin((s - 240) * 0.7); p.headYaw = 0.2 * Math.sin(s * 0.9); out.p = p; out.pos = [R.x0, 0, R.z]; out.q.copy(qY); return out;
  }
  if (s < R.sLift) { const tau = s - R.sRun, x = R.x0 - 0.5 * R.acc * tau * tau; out.p = saWalkPose(x / 1.2 * SAPI * -1, 1.6); out.pos = [x, 0, R.z]; out.q.copy(qY); return out; }
  if (s < C.sGrab) {                                                   // in the air: rising, reaching up
    const tau = s - R.sLift, x = xLift - vRun * tau, k = MathX.clamp(tau / 0.3, 0, 1);
    const p = lerpPose(saWalkPose(xLift / 1.2 * -SAPI, 1.6), SA_POSES.armsUp(), k); p.lKnee += 0.6 * Math.sin(tau * 9) * k; p.rKnee += 0.6 * Math.cos(tau * 9) * k; p.neck = -0.6 * k;
    out.p = p; out.pos = [x + (B[0] - (xLift - vRun * tg)) * MathX.smooth(tau, 0, tg), rise(tau), R.z + (B[2] - H[2] - R.z) * MathX.smooth(tau, 0, tg)]; out.q.copy(qY); return out;
  }
  // from 3:04:48 (off camera) she lies along the branch on its sky side, arms and legs locked round it: nobody can dead-hang
  // for five minutes. Her body along the branch (towards the trunk), her head by her hands
  if (s >= R.sLock && s < SAP.T) {
    const p = SA_POSES.sloth(), br = Math.sin(s * 1.7); p.spine += 0.03 * br; p.neck += 0.2 * Math.sin(s * 0.31) + 0.15 * Math.max(0, Math.sin(s * 0.13)); p.headYaw = 0.3 * Math.sin(s * 0.23);
    p.lKnee += 0.06 * Math.sin(s * 0.9); p.rKnee += 0.06 * Math.sin(s * 0.9 + 1);
    const qA = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3(...C.T.branchAt(Math.min(1, R.grabU + 0.08))).sub(new THREE.Vector3(...C.T.branchAt(R.grabU - 0.08))).normalize());
    const roll = 0.05 * Math.sin(s * 0.7) + 0.03 * Math.sin(s * 1.9);   // she sways round the branch
    const q = qA.clone().multiply(new THREE.Quaternion().setFromAxisAngle(_fuCx, roll)).multiply(new THREE.Quaternion().setFromAxisAngle(_fuCz, 1.5 * SAPI)).multiply(new THREE.Quaternion().setFromAxisAngle(_fuCy, SAPI / 2));
    const off = new THREE.Vector3(...C.handOffS).applyQuaternion(q);
    out.p = p; out.q.copy(q); out.pos = [B[0] - off.x, B[1] - off.y, B[2] - off.z]; return out;
  }
  // holding the branch: her body turns about her hands (the branch's point B): 0 = hanging below, π = upside down above
  let th, sw = 0;
  if (s < SAP.T) { const u = s - C.sGrab; th = SAPI - SAPI * Math.exp(-u / 0.32) * Math.cos(5.2 * u); sw = 0.13 * Math.sin(u * 1.1) + 0.05 * Math.sin(u * 2.9); }
  else { const u = s - SAP.T; th = SAPI + SAPI * (1 - Math.exp(-u / 0.3) * Math.cos(4.6 * u)) + 0.08 * Math.exp(-u / 2) * Math.sin(u * 3); }
  const p = SA_POSES.armsUp(); p.neck = 0.1 + 0.25 * Math.sin(s * 0.37); p.lKnee = 0.45 + 0.4 * Math.sin(s * 1.3); p.rKnee = 0.5 + 0.4 * Math.sin(s * 1.1 + 1); p.lHip = [0.2 + 0.3 * Math.sin(s * 0.8), 0.08]; p.rHip = [0.15 + 0.3 * Math.sin(s * 0.8 + 2.2), 0.08];
  if (s > SAP.T && s >= R.sDrop) {                                     // she lets go: drops to the path, crouches, stands
    const u = s - R.sDrop, h0 = B[1] - H[1], tf = Math.sqrt(2 * Math.max(0.05, h0) / 9.81), y = Math.max(0, h0 - 4.905 * u * u);
    const pp = u < tf ? SA_POSES.armsUp() : lerpPose(SA_POSES.crouch(), SA_POSES.stand(), MathX.smooth(u - tf, 0.2, 1.2));
    if (u >= tf + 1.2) { pp.neck = -0.25; pp.lSh = [0.3, 0.3]; pp.rSh = [0.4, 0.2]; }
    out.p = pp; out.pos = [B[0], y, B[2] - H[2]]; out.q.copy(qY); return out;
  }
  out.p = p; th += sw;
  const qT = new THREE.Quaternion().setFromAxisAngle(_fuCz, th); out.q.copy(qT).multiply(qY);
  const off = new THREE.Vector3(...H).applyQuaternion(qY).applyQuaternion(qT);
  out.pos = [B[0] - off.x, B[1] - off.y, B[2] - off.z]; return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// THE DOG on its lead (with a harness on its back): it jumps for the stick at 3:05:29, falls up to the end of the lead
// and floats there, belly to the sky, legs paddling. At 3:10 it comes down. → { pos (harness point), q, pose, hand }
// ---------------------------------------------------------------------------------------------------------------------
const SA_DOGP = { x: 12.0, z: -24.0, yaw: 2.84, sJump: SA.sDog, len: 1.8 };
function saDogState(s, C) {
  const D = SA_DOGP, hand = C.dogHand || [D.x + 0.25, 1.05, D.z + 0.1], dir = [Math.sin(D.yaw), Math.cos(D.yaw)], out = { hand };
  const ground = [D.x - 0.45 + dir[0] * 0.4, 0, D.z + dir[1] * 0.4 + 0.3];
  if (s < D.sJump) { out.pos = ground; out.q = new THREE.Quaternion().setFromAxisAngle(_fuCy, D.yaw); out.pose = saQuadPose({ gait: null, head: [0.45, 0.15 * Math.sin(s * 2)], tail: [0.6, 0.9 * Math.sin(s * 14)], crouch: s > D.sJump - 0.4 ? 0.6 : 0 }); out.slack = 1; return out; }
  // up: jumps (3 m/s up, 2 m/s forward), falls up until the lead is taut, then bobs at its end and settles
  const tau = s - D.sJump, lift = (u) => 3 * u + 4.905 * u * u;
  let p = [ground[0] + dir[0] * 2 * tau, 0.5 + lift(tau), ground[2] + dir[1] * 2 * tau];
  const d = [p[0] - hand[0], p[1] - hand[1], p[2] - hand[2]], L = Math.hypot(...d);
  let taut = 0;
  if (L > D.len || tau > 0.6) {                                          // the lead holds it: it swings in to above the hand
    let tt = 0.2; for (let k = 0; k < 30; k++) { const q = [ground[0] + dir[0] * 2 * tt - hand[0], 0.5 + lift(tt) - hand[1], ground[2] + dir[1] * 2 * tt - hand[2]]; const f = Math.hypot(...q) - D.len; tt -= f / 6; }
    const u = Math.max(0, tau - tt), ang0 = 0.75, ang = ang0 * Math.exp(-u / 1.1) * Math.cos(2.3 * u) + 0.06 * Math.sin(s * 0.9), bob = 0.12 * Math.exp(-u / 0.5) * Math.sin(9 * u);
    const dd = [Math.sin(ang) * dir[0], Math.cos(ang), Math.sin(ang) * dir[1]];
    p = [hand[0] + dd[0] * (D.len - bob), hand[1] + dd[1] * (D.len - bob), hand[2] + dd[2] * (D.len - bob)]; taut = 1;
    if (s >= SAP.T) { const v = s - SAP.T, fall = Math.min(1, 4.905 * v * v / (D.len + 0.6)); p = [p[0] + (hand[0] - 0.3 - p[0]) * fall, p[1] + (0.45 - p[1]) * fall, p[2] + (hand[2] + 0.4 - p[2]) * fall]; taut = 1 - fall; }
    out.flip = MathX.smooth(u, 0.2, 1.4) * (s >= SAP.T ? 1 - MathX.smooth(s - SAP.T, 0, 0.45) : 1);
  } else out.flip = 0;
  out.pos = p; out.slack = 1 - taut;
  const qY = new THREE.Quaternion().setFromAxisAngle(_fuCy, D.yaw), qF = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(dir[0], 0, dir[1]), SAPI * out.flip);
  out.q = qF.multiply(qY);
  out.pose = saQuadPose({ gait: s * 11, stretch: 0.6 * (1 - out.flip) * Math.min(1, tau * 3), head: [-0.3 * out.flip, 0.4 * Math.sin(s * 1.7)], tail: [0.2, 0.8 * Math.sin(s * 9)] });
  return out;
}

// the scene for a shot: [personIndex, state] pairs (the runner is placed by saRunner)
function saCastScene(mode, s, C) {
  const out = [], put = (i, st) => { if (st) out.push([i, st]); };
  const F = (i, pose, x, z, yaw, o) => put(i, saSt(saFidget(SA_POSES[pose](), s, i), x, z, yaw, o));
  const lookAt = (i, pose, x, z, tx, tz, o) => F(i, pose, x, z, saYaw(tx - x, tz - z), o);
  const runner = () => put(SA_P.run, { runner: true });
  const after = (s0, a, b) => lerpPose(a, b, saEase(s, s0, s0 + 0.5));
  switch (mode) {
    case 'window': { put(10, saWalkSt(s, 0, -10, -15.2, SAPI / 2, 1.2)); put(11, saWalkSt(s, 10, 14, -15.8, -SAPI / 2, 1.1)); put(12, saWalkSt(s, 0, 30, -40, -2.4, 1.0)); break; }
    case 'apple': { put(10, saWalkSt(s, 80, -6, -10.6, SAPI / 2, 1.2)); put(11, saWalkSt(s, 80, 12, -10.3, -SAPI / 2, 1.1)); put(13, saWalkSt(s, 80, 1, -1.0, SAPI / 2, 1.0)); break; }
    case 'appleUp': { lookAt(14, 'point', 7.6, -10.2, 4.6, -0.3); lookAt(15, 'lookUp', 8.4, -10.9, 4.6, -0.3); put(10, saWalkSt(s, 90, -4, -10.6, SAPI / 2, 1.2)); break; }
    // in the street: the keys, the coffee, the phone
    case 'street': {
      { const s0 = SA_FLY.keys.s0, st = s < s0 - 1.6 ? saWalkSt(s, s0 - 6, 1.6, -0.9, -SAPI / 2, 1.0) : saSt(SA_POSES.stand(), 1.6 - 1.0 * 4.4, -0.9, -SAPI / 2 + 0.3);
        if (s >= s0 - 1.6) { const p = s < s0 ? SA_POSES.cup() : after(s0 + 0.15, SA_POSES.cup(), SA_POSES.reachUp()); p.rEl = s < s0 ? 1.4 + 0.2 * Math.sin(s * 9) : p.rEl; p.neck = s < s0 ? 0.35 : p.neck; st.p = p; }
        put(SA_P.keys, st); }
      { const s0 = SA_FLY.cup.s0, x = 4.6 - 0.9 * Math.min(s - (s0 - 6), 4.6), st = saWalkSt(s, s0 - 6, 4.6, -1.35, -SAPI / 2, s < s0 - 1.4 ? 0.9 : 0);
        if (s >= s0 - 1.4) { st.pos[0] = 4.6 - 0.9 * 4.6; st.p = s < s0 ? SA_POSES.cup() : after(s0 + 0.1, SA_POSES.cup(), SA_POSES.shield()); } else st.p.rSh = [0.75, 0.12], st.p.rEl = 1.75; void x;
        if (s >= s0 + 1.2) st.p = lerpPose(SA_POSES.shield(), SA_POSES.lookUp(), saEase(s, s0 + 1.2, s0 + 2.0));
        put(SA_P.coffee, st); }
      { const s0 = SA_FLY.phone.s0, p = s < s0 ? SA_POSES.phone() : after(s0 + 0.15, SA_POSES.phone(), SA_POSES.reachUp()); if (s > s0 + 1.0) p.neck = -0.7; put(SA_P.phone, saSt(saFidget(p, s, 3, 0.3), 8.6, -0.7, -SAPI / 2 - 0.5)); }
      put(13, saWalkSt(s, 120, 16, -1.2, -SAPI / 2, 1.1)); F(14, 'talk', 9.5, -0.6, -2.2); F(15, 'stand', 10.3, -0.9, 2.0);
      break;
    }
    // the park
    case 'leaves': { lookAt(10, 'lookUp', -15.0, -15.9, -9, -19); lookAt(11, 'point', -14.2, -15.3, -9, -19); { const st = saSt(saFidget(SA_POSES.reachUp(), s, 5), -12.4, -16.2, saYaw(1, -1)); put(SA_P.kid, st); } F(12, 'lookUp', -20, -17.8, 1.2); break; }
    case 'fountain': { for (const [i, a] of [[10, 0.2], [11, 0.5], [12, 5.0], [13, 2.4], [14, 3.0], [15, 4.1]]) { const x = 15 * Math.cos(a) * 1.13, z = -52 + 10 * Math.sin(a) * 1.18; lookAt(i, i % 2 ? 'lookUp' : 'point', x, z, 0, -52); } break; }
    case 'fish': { lookAt(10, 'lookUp', 8.5, -42.6, 4, -47); break; }
    case 'ball': { const s0 = SA_FLY.ball.s0, b = SA_SPOT.ball, D = SA_SPOT.ballDir;
      let p = s < s0 - 0.5 ? saWalkPose((s - s0) * 8, 1.2) : s < s0 ? lerpPose(SA_POSES.backswing(), SA_POSES.kick(), saEase(s, s0 - 0.25, s0)) : lerpPose(SA_POSES.kick(), SA_POSES.point(), saEase(s, s0 + 0.35, s0 + 1.1));
      const k = Math.min(0, s - s0 + 0.5) * 2.2; put(SA_P.kid2, saSt(p, b[0] - D[0] * (0.35 - k), b[1] - D[1] * (0.35 - k), saYaw(D[0], D[1])));
      lookAt(SA_P.kid3, s < s0 + 0.5 ? 'armsOut' : 'lookUp', b[0] + D[0] * 7, b[1] + D[1] * 7, b[0], b[1]); lookAt(10, 'lookUp', b[0] - 6, b[1] + 3, b[0], b[1] - 4); break; }
    case 'scoop': { const s0 = SA_FLY.scoop.s0, p = SA_POSES.sit(); p.hipY = 0.7; p.rSh = [0.9, 0.12]; p.rEl = 1.95; p.neck = s < s0 ? 0.05 : -0.2 - 0.5 * saEase(s, s0, s0 + 0.8); if (s > s0 + 0.3) { p.lSh = [1.6, 0.3]; p.lEl = 0.5; }
      put(SA_P.kid, saSt(p, 20.2, -17.05, 0)); lookAt(SA_P.mum, s < s0 + 0.4 ? 'talk' : 'lookUp', 21.1, -16.4, 20.2, -17.0); break; }
    case 'walk': { const s0 = 228; put(SA_P.old, saWalkSt(s, s0, -24.0, -15.3, -SAPI / 2, 0.32, { stride: 0.32 })); { const w = out[out.length - 1][1]; w.p.lSh = [0.5, 0.6]; w.p.rSh = [0.5, 0.6]; w.p.spine = 0.12; w.p.neck = 0.3; }
      put(10, saWalkSt(s, s0, -17.5, -14.9, -SAPI / 2, 0.36, { stride: 0.35 })); F(11, 'hold', -21, -12.85, 0); F(12, 'hold', -19.5, -12.85, 0.1); break; }
    case 'jogger': case 'hold': case 'rope': case 'pigeons': case 'hold2': case 'count': case 'down': {
      runner();
      const B = C.T.branchAt(SA_RUN.grabU);
      if (mode === 'jogger') { put(10, saWalkSt(s, 240, 6, -15.8, -SAPI / 2, 0.9)); F(11, 'stand', -9.5, -13.2, 2.4); }
      if (mode === 'hold' || mode === 'rope' || mode === 'count' || mode === 'down') {
        const gather = (i, x, z, s0, pose) => { const dx = x - B[0], dz = z - B[2], far = Math.max(0, 1 - (s - s0) / 4); const st = far > 0 ? saWalkSt(s, s0, x + dx * 2.2 * far, z + dz * 2.2 * far, saYaw(-dx, -dz), 0) : null;
          if (far > 0) { st.pos = [x + dx * 2.2 * far, 0, z + dz * 2.2 * far]; st.p = saWalkPose(far * 14, 1.1); put(i, st); } else lookAt(i, pose, x, z, B[0], B[2]); };
        const catchP = mode === 'count' ? 'reachUp' : mode === 'down' ? (s < SA_RUN.sDrop + 0.4 ? 'reachUp' : 'stand') : 'lookUp';
        gather(10, B[0] + 1.4, B[2] + 1.2, 259.5, catchP); gather(11, B[0] - 1.2, B[2] + 1.5, 260.5, mode === 'hold' ? 'point' : catchP); gather(12, B[0] - 0.6, B[2] + 1.9, 262, catchP);
        if (mode !== 'hold') { lookAt(13, 'talk', B[0] + 3.2, B[2] + 2.6, B[0], B[2]); lookAt(14, 'lookUp', B[0] - 3.4, B[2] + 0.4, B[0], B[2]); }
        if (mode === 'down' && s > SA_RUN.sDrop + 1.6) { for (const i of [10, 11, 12, 13, 14]) { const e = out.find((o) => o[0] === i); if (e) e[1].p = saFidget(SA_POSES.lookUp(), s, i); } }
      }
      if (mode === 'rope') { const s0 = SA_FLY.coat.s0, x = B[0] + 1.1, z = B[2] + 1.35, p = s < s0 - 0.5 ? SA_POSES.hold() : s < s0 ? lerpPose(SA_POSES.throwBack(), SA_POSES.throwUp(), saEase(s, s0 - 0.35, s0)) : lerpPose(SA_POSES.throwUp(), SA_POSES.lookUp(), saEase(s, s0 + 0.5, s0 + 1.3));
        put(SA_P.dad, saSt(p, x, z, saYaw(B[0] - x, B[2] - z))); }
      if (mode === 'down') { lookAt(SA_P.owner, 'lead', 9.0, -21.5, B[0], B[2]); }
      break;
    }
    case 'dog': { const s0 = SA_FLY.stick.s0, D = SA_DOGP; const p = s < s0 - 0.5 ? SA_POSES.lead() : s < s0 + 0.3 ? lerpPose(SA_POSES.throwBack(), SA_POSES.throwUp(), saEase(s, s0 - 0.35, s0)) : lerpPose(SA_POSES.throwUp(), SA_POSES.leadUp(), saEase(s, D.sJump + 0.3, D.sJump + 1.2));
      if (s < s0 + 0.3) { p.lSh = [1.1, 0.15]; p.lEl = 0.6; }
      put(SA_P.owner, saSt(saFidget(p, s, 9, 0.3), D.x, D.z, D.yaw)); lookAt(10, s < D.sJump + 1 ? 'talk' : 'point', D.x + 4.2, D.z - 3.5, D.x, D.z); break; }
    case 'warn': {
      for (const [i, x, pose] of [[10, 6.5, 'hold'], [11, 4.6, 'hold'], [13, 1.0, 'hold'], [15, -2.0, 'hold'], [16, 9.0, 'hold']]) F(i, pose, x, -12.82, 0.0);
      F(SA_P.mum, 'hug', 3.0, -12.95, 0.15); { const st = saSt(saFidget(SA_POSES.hug(), s, 5), 3.05, -12.62, SAPI - 0.1); put(SA_P.kid, st); }
      F(SA_P.old, 'hug', 0.0, -14.42, 0.0); F(12, 'sitGround', 8.0, -14.5, 0.4); F(14, 'hold', -5.6, -12.82, 0.1);
      runner(); break;
    }
    case 'question': {
      lookAt(10, 'lookUp', -1.5, -23.5, 2, -40); lookAt(11, 'shield', 1.0, -24.2, 2, -40); lookAt(12, 'lookUp', -4.0, -25.0, 0, -40); lookAt(SA_P.run, 'sitGround', -3.0, -22.4, 0, -40); lookAt(13, 'point', 2.8, -22.5, 0, -40); break;
    }
  }
  return out;
}

// pigeons under the plane tree's low branch, upside down (and one flying in to land there)
function saPigeonState(i, s, T) {
  const sp = [0.22, 0.34, 0.47, 0.58, 0.66];
  if (i < sp.length) { const p = T.branchAt(sp[i]), r = 0.16 * (1 - 0.55 * sp[i]); return { pos: [p[0], p[1] - r, p[2]], flip: 1, yaw: 0.6 + i * 0.9 + 0.3 * Math.sin(s * 0.7 + i), flap: 0, peck: Math.sin(s * 2 + i * 1.3) }; }
  // the one flying in: from out over the path, up under the branch, a flip, and it lands
  const s0 = 346.2, u = s - s0, land = T.branchAt(0.4), r = 0.16 * (1 - 0.55 * 0.4), to = [land[0], land[1] - r, land[2]];
  if (u < 0) return { pos: [to[0] + 9, to[1] + 0.8, to[2] - 6], flip: 0, yaw: -2.2, flap: 1, hide: true };
  const k = MathX.smooth(u, 0, 2.2), fly = [to[0] + 9 * (1 - k), to[1] - 1.2 * Math.sin(k * SAPI) + 0.0, to[2] - 6 * (1 - k)];
  return { pos: fly, flip: MathX.smooth(u, 1.6, 2.2), yaw: -2.2 + 0.4 * k, flap: u < 2.25 ? 1 : 0, peck: 0 };
}

function saBuildCast(S, T) {
  const scene = S.scene, C = { T };
  C.people = SA_PEOPLE.map(([look, kid], i) => { const g = new Person({ id: 'saP' + i, look }, null); if (kid) g.root.scale.setScalar(0.66); scene.add(g.root); g.root.visible = false; return g; });
  // the runner's headphones
  { const P = C.people[SA_P.run], h = P.j.head, m = saStd('#f2f0ea', 0.4);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.012, 6, 20, Math.PI), m); band.position.set(0, 0.02, -0.01); h.add(band);
    for (const sd of [-1, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.03, 16), m); c.rotation.z = Math.PI / 2; c.position.set(sd * 0.11, -0.01, 0); h.add(c); } }
  // the props in their hands (until they let them go)
  const prop = (who, side, obj, x, y, z, rx = 0, ry = 0, rz = 0) => { const P = C.people[who], hd = side === 'r' ? P.j.ra.hand : P.j.la.hand; obj.position.set(x, y, z); obj.rotation.set(rx, ry, rz); hd.add(obj); return obj; };
  C.props = {
    keys: prop(SA_P.keys, 'r', saBuildKeys(), 0, -0.07, 0.03, 0, 0, 0.3),
    cup: prop(SA_P.coffee, 'r', saBuildCup(), 0.0, -0.06, 0.06, -1.25, 0, 0),
    phone: prop(SA_P.phone, 'r', saBuildPhone(), 0.0, -0.06, 0.03, 0.2, 0, 0),
    scoop: prop(SA_P.kid, 'r', saBuildScoop(), 0.0, -0.06, 0.16, 0, 0, 0),
    coat: prop(SA_P.dad, 'r', (() => { const g = new THREE.Group(); saMesh(saRoundBox(0.32, 0.12, 0.22, 0.05, 0.04), saStd('#3a4a3a', 0.92), 0, -0.06, 0, g); return g; })(), 0, -0.08, 0.05),
    stick: prop(SA_P.owner, 'r', saBuildStick(), 0, -0.08, 0.03, 0, 0, 0.2),
  };
  // the cone stays in the girl's hand (the scoop sits in it)
  { const cone = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.11, 14).rotateX(Math.PI), saStd('#d8a058', 0.8)); cone.position.set(0, -0.07, 0.11); cone.rotation.x = -1.2; C.people[SA_P.kid].j.ra.hand.add(cone); C.props.scoop.position.set(0, -0.06 + 0.06, 0.11 + 0.03); C.cone = cone; }
  // the dog, its lead (a chain of short struts), its harness
  C.dog = saBuildQuad(SA_DOG); scene.add(C.dog.root); C.dog.root.visible = false;
  { const hm = saStd('#c8322a', 0.6); const hz = saMesh(new THREE.TorusGeometry(SA_DOG.body[0] * 1.02, 0.018, 6, 20), hm, 0, 0, SA_DOG.len * 0.22, C.dog.front); hz.rotation.y = 0; C.dog.harness = hz; }
  C.lead = Array.from({ length: 10 }, () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 6).translate(0, 0.5, 0), saStd('#c8322a', 0.6)); m.castShadow = true; scene.add(m); m.visible = false; return m; });
  C.pigeons = Array.from({ length: 6 }, (_, i) => { const b = saBuildPigeon(1); scene.add(b); b.visible = false; return b; });
  // the runner's hands, measured once in the armsUp pose (body frame, from her feet)
  { const P = C.people[SA_P.run]; P.root.position.set(0, 0, 0); P.root.quaternion.identity(); P.apply(SA_POSES.armsUp()); P.root.updateMatrixWorld(true);
    const a = new THREE.Vector3(), b = new THREE.Vector3(); P.j.la.hand.getWorldPosition(a); P.j.ra.hand.getWorldPosition(b); C.handOff = [0, (a.y + b.y) / 2 + 0.04, (a.z + b.z) / 2];
    // ... and in the locked pose (the branch is a little further out than her hands' middle: its radius)
    P.apply(SA_POSES.sloth()); P.root.updateMatrixWorld(true); P.j.la.hand.getWorldPosition(a); P.j.ra.hand.getWorldPosition(b); C.handOffS = [0, (a.y + b.y) / 2, (a.z + b.z) / 2 + 0.06]; }
  C.update = (s, o) => saCastUpdate(C, s, o || {});
  // where a prop is at the moment it's let go (pose its holder then, read it, and leave the scene to be re-posed)
  C.relAt = (key) => { const R = SA_REL[key]; saCastUpdate(C, R[3] - 1e-4, { mode: R[2] }); C.props[key].updateWorldMatrix(true, false); return C.props[key].getWorldPosition(new THREE.Vector3()).toArray(); };
  return C;
}
const _fuCy = new THREE.Vector3(0, 1, 0), _fuCx = new THREE.Vector3(1, 0, 0), _fuCz = new THREE.Vector3(0, 0, 1), _fuQa = new THREE.Quaternion(), _fuBm = new THREE.Matrix4(), _fuBx = new THREE.Vector3(), _fuBy = new THREE.Vector3(), _fuBz = new THREE.Vector3();
function saCastUpdate(C, s, o) {
  const mode = o.mode, scene = saCastScene(mode, s, C), on = new Set();
  for (const [i, st] of scene) {
    const P = C.people[i]; on.add(i); P.root.visible = true;
    if (st.runner) { const r = saRunner(s, C); P.root.quaternion.copy(r.q); P.root.position.set(...r.pos); P.apply(r.p); continue; }
    P.root.quaternion.setFromAxisAngle(_fuCy, st.yaw); P.root.position.set(st.pos[0], st.pos[1], st.pos[2]); P.apply(st.p);
  }
  C.people.forEach((P, i) => { if (!on.has(i)) P.root.visible = false; });
  for (const [k, R] of Object.entries(SA_REL)) C.props[k].visible = s < R[3];
  // the dog and its lead
  const dogOn = mode === 'dog' || mode === 'down';
  C.dog.root.visible = dogOn; C.lead.forEach((m) => { m.visible = dogOn; });
  if (dogOn) {
    const P = C.people[SA_P.owner]; P.root.updateMatrixWorld(true); const hw = P.j.la.hand.getWorldPosition(new THREE.Vector3()); C.dogHand = hw.toArray();
    const st = saDogState(s, C); C.dog.root.position.set(...st.pos); C.dog.root.quaternion.copy(st.q); saPoseQuad(C.dog, st.pose);
    // the harness point is on its back: the lead runs from her hand to there (sagging when slack)
    C.dog.root.updateMatrixWorld(true); const hp = C.dog.harness.getWorldPosition(new THREE.Vector3());
    const a = hw, b = hp, n = C.lead.length, sag = 0.5 * st.slack;
    let prev = a.clone();
    for (let k = 1; k <= n; k++) { const u = k / n, cur = new THREE.Vector3().lerpVectors(a, b, u); cur.y -= sag * 4 * u * (1 - u); saStrut(C.lead[k - 1], prev.toArray(), cur.toArray(), 0.007); prev = cur; }
  }
  // the pigeons under the branch
  const pg = mode === 'pigeons' || mode === 'hold' || mode === 'hold2';
  C.pigeons.forEach((b, i) => {
    if (!pg) { b.visible = false; return; }
    const st = saPigeonState(i, s, C.T); b.visible = !st.hide; if (!b.visible) return;
    b.position.set(...st.pos); b.rotation.set(0, st.yaw, 0); b.rotateZ(SAPI * st.flip);
    const f = st.flap ? Math.sin(s * 28 + i) * 0.9 : 0, fold = st.flap ? 0 : Math.PI / 2 - 0.15;   // perched: wings folded back along the body
    b.userData.wings[0].rotation.set(0, -fold, f + (fold ? -0.15 : 0)); b.userData.wings[1].rotation.set(0, fold, -f + (fold ? 0.15 : 0));
    b.children[1].position.y = 0.21 - 0.02 * Math.max(0, st.peck || 0);
  });
}
// a person's head (world), for the camera and labels
function saHeadOf(P) { const v = new THREE.Vector3(0, 1.55 * P.scale, 0.06); P.root.updateMatrixWorld(true); return P.root.localToWorld(v); }
