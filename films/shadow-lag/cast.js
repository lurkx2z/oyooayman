/* =====================================================================
   CAST — the people (the shared adult rig, js/world/people.js): the poses (from the Air solid and Magnets films'
   cast, renamed), this film's looks (you, the night guard, and someone who is only ever a shadow), and helpers.
   Every person is posed as a pure function of story time s.
     shPerson(look, parent, kid) → Person ; shPose(person, pose, x, y, z, yaw)
     shAsShadow(person)  every part casts a shadow and nothing is drawn (the late copy of you; the back seat)
     shNoShadow(person)  drawn, casting nothing (your body: its shadow is the copy's)
     shYouPose(s) → { x, y, z, yaw, pose } your body at story time s (on foot; in the car frame once seated)
   ===================================================================== */

Object.assign(LOOKS, {
  // you: a dark green work jacket over a grey top, dark jeans, white trainers, a canvas shoulder bag
  shYou: { skin: 2, build: 'avg', shirt: '#3d4a3c', sleeves: 'long', pants: '#252c38', shoes: '#d9d6cf', sole: '#efece6', hair: '#2a1d14', jacket: true, collar: true, shoulderBag: '#6a5a42' },
  // the night guard: black jacket, hi-vis vest, dark trousers, a black cap
  shGuard: { skin: 4, build: 'broad', shirt: '#1d2126', sleeves: 'long', pants: '#22252b', shoes: '#111', sole: '#1a1a1a', hair: '#141010', jacket: true, collar: true, vest: '#c7d83a', hat: { type: 'cap', color: '#15181c' } },
  // (only ever a shadow) a hood
  shBack: { skin: 1, build: 'avg', shirt: '#1a1c20', sleeves: 'long', pants: '#1a1c20', shoes: '#111', sole: '#111', hair: '#111', jacket: true, hood: true },
});
const SHPI = Math.PI;
const shEase = (s, a, b) => { const u = MathX.clamp((s - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
const shYaw = (fx, fz) => Math.atan2(fx, fz);                         // facing a direction (x, z); the rig faces +z at 0
function shPerson(look, parent, o = {}) { const p = new Person({ id: 'sh' + look + (o.id || ''), look }, null); if (o.kid) p.root.scale.setScalar(0.66); shPersonNoZ(p); (parent || SH_KIT_SCENE).add(p.root); return p; }
// (the engine's people have a few surfaces that share a plane: the belt's top with the trousers', the shirt strip
// under an open jacket 0.3 mm off the chest, a coat's hem flush with the thighs. Nudged here, per person, so nothing
// flickers (z-fighting); js/world/people.js itself is untouched)
function shPersonNoZ(p) {
  const L = p.look, BG = PersonGeo.forBuild(L.build || 'avg', L);
  p.root.traverse((m) => {
    if (!m.isMesh) return; const g = m.geometry, q = g.parameters;
    if (g.type === 'BoxGeometry' && q.height === 0.035 && Math.abs(q.width - BG.B.waist * 1.02) < 1e-6) m.scale.set(1, 1.6, 1.08);   // the belt
    else if (g.type === 'BoxGeometry' && q.width === 0.08 && q.depth === 0.01) m.position.z += L.shoulderBag ? 0.0015 : 0.004;   // the strip
    else if (g.type === 'BoxGeometry' && q.width === 0.03 && q.depth === 0.012) m.position.z += 0.003;   // a shoulder bag's strap
    else if (L.coat && (g === BG.pelvis || g === BG.thigh)) m.scale.set(0.98, 1, 0.98);                                       // under a coat
  });
}
function shPose(P, pose, x, y, z, yaw) { P.root.position.set(x, y, z); P.root.rotation.y = yaw; P.apply(pose); P.pose = pose; }
function shFidget(p, s, i, a = 1) { p.headYaw += 0.3 * a * noise1(s * 0.11, i + 2); p.spineYaw += 0.06 * a * noise1(s * 0.07, i + 4); p.neck += 0.06 * a * noise1(s * 0.09, i + 6); return p; }
function shKeys(s, K, bl = 0.6) { let i = 0; while (i + 1 < K.length && s >= K[i + 1][0]) i++; const p = K[i][1]; if (i && s - K[i][0] < bl) return lerpPose(K[i - 1][1], p, shEase(s, K[i][0], K[i][0] + bl)); return p; }

function shWalkPose(ph, big = 1) {
  const p = basePose(), s = Math.sin(ph), co = Math.cos(ph);
  p.lHip = [0.42 * big * s, 0.03]; p.rHip = [-0.42 * big * s, 0.03];
  p.lKnee = 0.08 + 0.65 * big * Math.max(0, co) ** 1.5; p.rKnee = 0.08 + 0.65 * big * Math.max(0, -co) ** 1.5;
  p.lFoot = -0.2 * Math.max(0, co); p.rFoot = -0.2 * Math.max(0, -co);
  p.lSh = [-0.34 * big * s, 0.07]; p.rSh = [0.34 * big * s, 0.07]; p.lEl = 0.28 + 0.18 * Math.max(0, -s); p.rEl = 0.28 + 0.18 * Math.max(0, s);
  return p;
}
// running: the flight phase (both feet off the ground) at ph = 0; arms pumping
function shRunPose(ph) {
  const p = basePose(), s = Math.sin(ph), c = Math.cos(ph);
  p.lHip = [0.15 + 0.7 * s, 0.03]; p.rHip = [0.15 - 0.7 * s, 0.03]; p.lKnee = 0.5 + 0.9 * Math.max(0, -s) + 0.35 * (1 + c) * 0.5; p.rKnee = 0.5 + 0.9 * Math.max(0, s) + 0.35 * (1 + c) * 0.5;
  p.lFoot = 0.2; p.rFoot = 0.2; p.lSh = [-0.6 * s, 0.12]; p.rSh = [0.6 * s, 0.12]; p.lEl = 1.45; p.rEl = 1.45; p.spine = 0.16; p.neck = -0.08; p.hipY = 0.9;
  return p;
}
const SH_POSES = {
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
  sitHurt: () => { const p = SH_POSES.sitGround(); p.rSh = [0.7, -0.35]; p.rEl = 1.9; p.lSh = [0.2, 0.25]; p.lEl = 0.3; p.neck = 0.35; p.spine = 0.38; return p; },
  sit: () => { const p = basePose(); p.hipY = 0.47; p.lHip = [1.5, 0.08]; p.rHip = [1.5, 0.08]; p.lKnee = 1.5; p.rKnee = 1.5; p.spine = -0.05; p.neck = 0.1; p.lSh = [0.45, 0.1]; p.lEl = 1.05; p.rSh = [0.5, 0.1]; p.rEl = 1.1; return p; },
  drive: () => { const p = SH_POSES.sit(); p.lHip = [1.25, 0.1]; p.rHip = [1.3, 0.06]; p.lKnee = 1.05; p.rKnee = 1.0; p.spine = -0.12; p.lSh = [1.05, 0.2]; p.rSh = [1.05, 0.2]; p.lEl = 0.75; p.rEl = 0.75; return p; },
  slump: () => { const p = SH_POSES.drive(); p.spine = 0.45; p.neck = 0.55; p.lSh = [0.4, 0.25]; p.rSh = [1.2, -0.1]; p.rEl = 1.9; p.lEl = 0.4; return p; },
  ride: (ph = 0) => { const p = basePose(); p.hipY = 0.86; const a = Math.sin(ph), b = Math.cos(ph);
    p.lHip = [1.15 + 0.3 * a, 0.14]; p.rHip = [1.15 - 0.3 * a, 0.14]; p.lKnee = 1.45 + 0.45 * b; p.rKnee = 1.45 - 0.45 * b; p.lFoot = 0.25; p.rFoot = 0.25;
    p.spine = 0.38; p.neck = -0.2; p.lSh = [1.2, 0.18]; p.lEl = 0.4; p.rSh = [1.2, 0.18]; p.rEl = 0.4; return p; },
  jump: () => { const p = basePose(); p.lSh = [2.3, 0.55]; p.rSh = [2.1, 0.6]; p.lEl = 0.3; p.rEl = 0.4; p.lHip = [0.55, 0.12]; p.rHip = [0.35, 0.1]; p.lKnee = 0.9; p.rKnee = 1.1; p.spine = -0.08; p.neck = 0.25; p.mouth = 1; return p; },
  land: () => { const p = SH_POSES.crouch(); p.lSh = [0.9, 0.6]; p.rSh = [1.0, 0.55]; p.hipY = 0.5; return p; },
  swing: (k = 1) => { const p = basePose(); p.hipY = 0.5; p.lHip = [1.45, 0.06]; p.rHip = [1.45, 0.06]; p.lKnee = 0.25 + 1.2 * (1 - k); p.rKnee = 0.25 + 1.2 * (1 - k); p.spine = -0.35 * k; p.neck = 0.25 * k; p.lSh = [2.5, 0.22]; p.rSh = [2.5, 0.22]; p.lEl = 0.35; p.rEl = 0.35; p.mouth = k; return p; },
  kick: () => { const p = basePose(); p.rHip = [1.25, 0.05]; p.rKnee = 0.2; p.lKnee = 0.3; p.lHip = [-0.15, 0.05]; p.lSh = [-0.5, 0.65]; p.rSh = [0.7, 0.55]; p.spine = -0.2; p.neck = -0.25; return p; },
  keeper: () => { const p = basePose(); p.lSh = [1.3, 0.8]; p.rSh = [1.3, 0.8]; p.lEl = 0.4; p.rEl = 0.4; p.hipY = 0.82; p.lHip = [0.4, 0.3]; p.rHip = [0.4, 0.3]; p.lKnee = 0.6; p.rKnee = 0.6; p.spine = 0.25; return p; },
  throw: () => { const p = basePose(); p.rSh = [1.55, -0.45]; p.rEl = 0.1; p.lSh = [0.35, 0.5]; p.lEl = 0.5; p.spineYaw = -0.35; p.spine = 0.1; p.lHip = [0.35, 0.08]; p.lKnee = 0.3; p.rHip = [-0.2, 0.05]; p.rKnee = 0.15; p.hipY = 0.88; return p; },
  catch: () => { const p = basePose(); p.lSh = [2.0, 0.3]; p.rSh = [2.0, 0.3]; p.lEl = 0.2; p.rEl = 0.2; p.spine = 0.1; p.neck = -0.3; return p; },
};

// this film's extra poses
Object.assign(SH_POSES, {
  sitPhone: () => { const p = SH_POSES.sit(); p.rSh = [0.85, 0.05]; p.rEl = 1.9; p.lSh = [0.7, 0.05]; p.lEl = 1.7; p.neck = 0.45; p.spine = 0.12; return p; },
  sitLook: () => { const p = SH_POSES.sit(); p.headYaw = 0.9; p.neck = -0.05; return p; },
  sitTorch: () => { const p = SH_POSES.sit(); p.rSh = [1.45, -0.05]; p.rEl = 0.5; p.neck = -0.1; p.lSh = [0.45, 0.1]; p.lEl = 1.05; return p; },
  torch: () => { const p = basePose(); p.rSh = [1.35, -0.1]; p.rEl = 0.35; p.lSh = [0.3, 0.15]; p.lEl = 0.5; p.neck = 0.05; return p; },
  desk: () => { const p = SH_POSES.sit(); p.lSh = [0.95, 0.15]; p.rSh = [0.95, 0.12]; p.lEl = 1.25; p.rEl = 1.2; p.spine = 0.18; p.neck = 0.12; return p; },
  warm: () => { const p = SH_POSES.sitGround(); p.lSh = [1.25, 0.35]; p.rSh = [1.25, 0.35]; p.lEl = 0.35; p.rEl = 0.35; p.spine = 0.3; p.neck = 0.05; return p; },
  hugKnees: () => { const p = SH_POSES.sitGround(); p.lHip = [1.9, 0.1]; p.rHip = [1.9, 0.1]; p.lKnee = 2.2; p.rKnee = 2.2; p.lSh = [0.9, 0.05]; p.rSh = [0.9, 0.05]; p.lEl = 1.4; p.rEl = 1.4; p.spine = 0.35; return p; },
  lean: () => { const p = SH_POSES.sitGround(); p.spine = -0.45; p.lSh = [-0.5, 0.35]; p.rSh = [-0.5, 0.35]; p.lEl = 0.15; p.rEl = 0.15; p.lHip = [1.2, 0.2]; p.rHip = [1.0, 0.15]; p.lKnee = 0.6; p.rKnee = 1.3; p.neck = -0.25; return p; },
  bottle: () => { const p = basePose(); p.rSh = [0.8, -0.05]; p.rEl = 1.8; p.lSh = [0.25, 0.15]; p.lEl = 0.4; p.headYaw = -0.25; return p; },
  dance: (ph) => { const p = basePose(); const a = Math.sin(ph), b = Math.cos(ph * 0.5); p.lSh = [1.8 + 0.4 * a, 0.5]; p.rSh = [1.6 - 0.4 * a, 0.45]; p.lEl = 0.6 + 0.3 * b; p.rEl = 0.7 - 0.3 * b; p.hipY = 0.9 + 0.03 * a; p.lKnee = 0.25 + 0.15 * a; p.rKnee = 0.25 - 0.15 * a; p.spineYaw = 0.2 * b; p.neck = -0.1; return p; },
  standStill: () => { const p = basePose(); p.lSh = [0.15, 0.1]; p.rSh = [0.2, 0.1]; p.neck = 0.05; return p; },
  lookUpStand: () => { const p = basePose(); p.neck = -0.75; p.spine = -0.12; p.lSh = [0.1, 0.12]; p.rSh = [0.1, 0.12]; return p; },
  lookUpSit: () => { const p = SH_POSES.sitGround(); p.neck = -0.7; p.spine = -0.2; return p; },
  player: () => { const p = basePose(); p.lSh = [0.3, 0.25]; p.rSh = [0.25, 0.25]; p.lEl = 0.7; p.rEl = 0.7; p.hipY = 0.9; p.lKnee = 0.25; p.rKnee = 0.3; p.lHip = [0.2, 0.08]; p.rHip = [0.15, 0.08]; p.spine = 0.12; return p; },
  turnKey: () => { const p = SH_POSES.drive(); p.rSh = [0.8, -0.25]; p.rEl = 1.3; return p; },
});

// ---------------------------------------------------------------------------------------------------------------------
// SHADOW ONLY / NO SHADOW. Your body is drawn and casts nothing; a copy of you, posed 1 story second earlier, casts
// your shadow and is never drawn (colour and depth writes off: the shadow pass still renders its depth). Every part of
// the copy casts (the engine's rig lets only the big parts cast, to save time: here the hands are the point).
// ---------------------------------------------------------------------------------------------------------------------
const SH_GHOST_MAT = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
function shAsShadow(p) { p.root.traverse((m) => { if (m.isMesh) { m.material = SH_GHOST_MAT; m.castShadow = true; m.receiveShadow = false; m.renderOrder = -1; } }); return p; }
function shNoShadow(p) { p.root.traverse((m) => { if (m.isMesh) m.castShadow = false; }); return p; }
function shAllCast(p) { p.root.traverse((m) => { if (m.isMesh) m.castShadow = true; }); return p; }

// ---------------------------------------------------------------------------------------------------------------------
// YOUR POSE at story time s: walking / running by the distance covered, the jump, your hands (the raised hand, the
// phone, the wave, shielding your eyes from the torch), your head (looking back, up, down, out). In the car: seated.
// ---------------------------------------------------------------------------------------------------------------------
const shOver = (p, q, w) => (w > 0.001 ? lerpPose(p, q, MathX.clamp(w, 0, 1)) : p);
function shYouPose(s) {
  const Y = SHY, E = SHE;
  if (Y.inCar(s)) {
    let p = SH_POSES.drive();
    if (s < E.engine + 0.6) { const q = SH_POSES.turnKey(); p = shOver(p, q, shBump(s, E.lock - 0.3, E.engine + 0.3, 0.3, 0.4)); }
    return { car: true, pose: p };
  }
  const xz = Y.pos(s), v = Y.speed(s), d = Y.dist(s), yaw = Y.yaw(s);
  let p;
  if (v > 2.2) { p = shRunPose(d / 3.3 * 2 * Math.PI); const w = MathX.smooth(v, 2.2, 3.6); p = lerpPose(shWalkPose(d / 1.5 * 2 * Math.PI, 1.15), p, w); }
  else { const w = MathX.smooth(v, 0.05, 0.7); p = shOver(basePose(), shWalkPose(d / 1.5 * 2 * Math.PI, MathX.clamp(v / 1.3, 0.35, 1.1)), w); }
  // the jump
  const cr = Y.crouch(s), lift = Y.lift(s);
  if (cr > 0) p = shOver(p, SH_POSES.crouch(), cr * 0.75);
  if (lift > 0) p = shOver(p, SH_POSES.jump(), 0.55);
  // hands
  const hr = Y.hand(s); if (hr > 0) { const q = Object.assign({}, p); q.rSh = [2.55, 0.18]; q.rEl = 0.25; q.neck = -0.05; p = shOver(p, q, hr); }
  const ph = Y.phone(s); if (ph > 0) { const q = Object.assign({}, p); q.rSh = [1.25, -0.2]; q.rEl = 1.05; q.neck = 0.12; p = shOver(p, q, ph); }
  const wv = Y.wave(s); if (wv !== 0) { const q = Object.assign({}, p); q.lSh = [2.2 + 0.25 * wv, 0.55 + 0.25 * wv]; q.lEl = 0.6 - 0.3 * wv; p = shOver(p, q, 1); }
  const sh = Y.shield(s); if (sh > 0) { const q = Object.assign({}, p); q.rSh = [1.75, -0.05]; q.rEl = 1.95; q.neck = 0.18; q.spine = 0.08; p = shOver(p, q, sh); }
  // head
  const lb = Y.lookBack(s); if (lb > 0) { p.headYaw += 1.15 * lb; p.spineYaw += 0.3 * lb; }
  const lu = Y.lookUp(s); if (lu > 0) { p.neck -= 0.62 * lu; p.spine -= 0.08 * lu; }
  const ld = Y.lookDown(s); if (ld > 0) p.neck += 0.48 * Math.min(1, ld);
  const lo = Y.lookOut(s); if (lo > 0) { p.neck += 0.18 * lo; p.lSh = [0.25, 0.1]; p.rSh = [0.25, 0.1]; }
  // getting into the car: from the door into the seat (rough; you're 1 m from the seat, the door open)
  const gk = Y.seatK(s);
  return { car: false, x: xz[0], y: lift, z: xz[1], yaw, pose: gk > 0 ? lerpPose(p, SH_POSES.sit(), gk) : p, getIn: gk };
}

// the guard: walking (by distance), his torch held out in his right hand; the radio to his mouth; the recoil
function shGuardPose(s) {
  const G = SHG, v = G.speed(s), d = G.dist(s);
  let p = shOver(basePose(), shWalkPose(d / 1.4 * 2 * Math.PI, MathX.clamp(v / 1.2, 0.3, 1)), MathX.smooth(v, 0.05, 0.6));
  p.rSh = [1.05, -0.08]; p.rEl = 0.45;                                        // the torch, forward
  const rd = G.radio(s); if (rd > 0) { const q = Object.assign({}, p); q.lSh = [1.35, 0.25]; q.lEl = 2.05; q.headYaw = -0.15; p = shOver(p, q, rd); }
  const rc = G.recoil(s); if (rc > 0) { p.spine -= 0.22 * rc; p.neck -= 0.15 * rc; p.lSh = [0.6 * rc + p.lSh[0] * (1 - rc), 0.35]; p.lEl = 0.4; }
  return p;
}
// the back seat (only a shadow): crouched low behind your seat, then sitting up, slowly
function shBackPose(k) {
  const p = SH_POSES.sit(); const low = 1 - k;
  p.spine = 0.25 + 0.95 * low; p.neck = 0.25 + 0.5 * low; p.hipY = 0.47 - 0.05 * low;
  p.lSh = [0.6 + 0.4 * low, 0.15]; p.rSh = [0.6 + 0.4 * low, 0.15]; p.lEl = 1.4; p.rEl = 1.4;
  return p;
}
