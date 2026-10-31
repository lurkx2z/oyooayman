/* =====================================================================
   CAST — your neighbours (they come out of your block's door from 3:01:50 and stand in the street as it fills), the
   mother and her daughter from the second floor, the ducks on the pond and the pigeons over the park. The shared adult
   rig (js/world/people.js) is posed from story time s: walking out, shielding their heads from the rain, wading, under
   it (arms drifting: they weigh a sixth of what they did), bounding (the Moon beat), shivering, breathing hard, and
   at 4:00 looking up as it fizzes. You are the camera. Pure.
     laBuildCast(S) → C ; C.update(s, o)
   ===================================================================== */

Object.assign(LOOKS, {
  laMum: { skin: 4, build: 'slim', shirt: '#2f5a6a', sleeves: 'long', pants: '#2a2d33', shoes: '#d9d4c8', sole: '#f0ede6', hair: '#1a120c', hairStyle: 'long', coat: true, collar: true },
  laKid: { skin: 4, build: 'slim', shirt: '#e0b23a', sleeves: 'long', pants: '#c8463a', shoes: '#f2f0ea', sole: '#f2f0ea', hair: '#1a120c', hairStyle: 'pony' },
  laOld: { skin: 0, build: 'avg', shirt: '#6a6052', sleeves: 'long', pants: '#4a4640', shoes: '#2a2018', sole: '#1a1612', hair: '#d8d4cc', coat: true, collar: true },
  laDad: { skin: 2, build: 'broad', shirt: '#7a3b34', sleeves: 'long', pants: '#33415a', shoes: '#e8e4dc', sole: '#d8d4ca', hair: '#2a1c14' },
});
const LAPI = Math.PI;
const laEase = (s, a, b) => { const u = MathX.clamp((s - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };

// the neighbours: [look, x, z (where they end up standing), yaw, when they come out of the door (s), style]
//   style: 0 shields their head from the rain, 1 looks up at it, 2 holds their arms out
const LA_DOOR = [-4.0, -0.4];
const LA_FOLK = [
  ['casual1', -9.0, -3.2, 0.6, 108, 0], ['casual2', -6.5, -5.2, 0.2, 112, 0], ['casual3', -3.0, -4.3, -0.5, 116, 1], ['casual4', 1.6, -3.9, -0.9, 121, 2],
  ['casual5', 5.5, -4.8, -2.4, 126, 0], ['casual6', 8.2, -3.0, -1.8, 131, 1], ['casual7', -11.0, -6.2, 0.9, 136, 0], ['casual8', 3.4, -6.0, 2.9, 141, 2],
  ['laOld', -1.4, -7.0, 2.6, 146, 1], ['laDad', 10.5, -6.0, -2.0, 151, 0], ['casual2', -7.6, -1.3, 0.3, 156, 2], ['casual6', 6.8, -1.2, -2.6, 161, 0],
];
const LA_MUMKID = { mum: [-0.4, -2.9, 2.4, 104], kid: [0.15, -2.55, 2.7, 104] };
LA.kidBreath = null;                                       // (story s the girl takes her first breath: set by shots.js)

function laWalkPose(ph) {
  const p = basePose(), s = Math.sin(ph), co = Math.cos(ph);
  p.lHip = [0.42 * s, 0.03]; p.rHip = [-0.42 * s, 0.03];
  p.lKnee = 0.08 + 0.65 * Math.max(0, co) ** 1.5; p.rKnee = 0.08 + 0.65 * Math.max(0, -co) ** 1.5;
  p.lFoot = -0.2 * Math.max(0, co); p.rFoot = -0.2 * Math.max(0, -co);
  p.lSh = [-0.34 * s, 0.07]; p.rSh = [0.34 * s, 0.07]; p.lEl = 0.28 + 0.18 * Math.max(0, -s); p.rEl = 0.28 + 0.18 * Math.max(0, s);
  return p;
}
const LA_POSES = {
  shield: () => { const p = basePose(); p.lSh = [2.5, 0.35]; p.rSh = [2.45, 0.38]; p.lEl = 1.7; p.rEl = 1.75; p.neck = 0.25; p.spine = 0.12; return p; },
  lookUp: () => { const p = basePose(); p.neck = -0.45; p.spine = -0.08; p.lSh = [0.5, 0.25]; p.rSh = [0.3, 0.2]; p.lEl = 0.9; p.rEl = 0.4; return p; },
  armsOut: () => { const p = basePose(); p.lSh = [0.6, 0.9]; p.rSh = [0.7, 0.85]; p.lEl = 0.3; p.rEl = 0.35; p.neck = 0.1; return p; },
  wade: () => { const p = basePose(); p.lSh = [0.5, 0.75]; p.rSh = [0.55, 0.7]; p.lEl = 0.5; p.rEl = 0.45; p.lKnee = 0.2; p.rKnee = 0.15; p.spine = 0.08; return p; },
  under: () => { const p = basePose(); p.lSh = [0.7, 0.85]; p.rSh = [0.6, 0.9]; p.lEl = 0.6; p.rEl = 0.5; p.lHip = [0.25, 0.08]; p.rHip = [0.1, 0.06]; p.lKnee = 0.45; p.rKnee = 0.3; p.spine = 0.05; return p; },
  hug: () => { const p = basePose(); p.lSh = [1.1, -0.15]; p.rSh = [1.05, -0.12]; p.lEl = 2.1; p.rEl = 2.15; p.spine = 0.22; p.neck = 0.2; p.lKnee = 0.25; p.rKnee = 0.2; p.lHip = [0.15, 0.03]; p.rHip = [0.12, 0.03]; return p; },
  crouch: () => { const p = basePose(); p.hipY = 0.68; p.lHip = [1.0, 0.1]; p.rHip = [1.0, 0.1]; p.lKnee = 1.4; p.rKnee = 1.4; p.lFoot = 0.3; p.rFoot = 0.3; p.spine = 0.3; p.lSh = [-0.4, 0.3]; p.rSh = [-0.4, 0.3]; p.lEl = 0.3; p.rEl = 0.3; return p; },
  leap: () => { const p = basePose(); p.lHip = [0.5, 0.1]; p.rHip = [-0.2, 0.1]; p.lKnee = 0.9; p.rKnee = 0.3; p.lSh = [2.0, 0.6]; p.rSh = [1.7, 0.55]; p.lEl = 0.3; p.rEl = 0.4; p.neck = -0.15; return p; },
  armsUp: () => { const p = basePose(); p.lSh = [2.6, 0.5]; p.rSh = [2.5, 0.55]; p.lEl = 0.3; p.rEl = 0.35; p.neck = -0.5; p.spine = -0.1; return p; },
  talk: () => { const p = basePose(); p.lSh = [0.9, 0.3]; p.rSh = [1.2, 0.25]; p.lEl = 1.3; p.rEl = 1.1; p.mouth = 1; p.neck = 0.05; return p; },
};

// one neighbour's state at s → { p (pose), pos, yaw }
function laFolkState(i, s, F) {
  const [look, hx, hz, yaw0, out, style] = F, n = noise1, k = i * 1.7;
  const walkT = 12, dx = hx - LA_DOOR[0], dz = hz - LA_DOOR[1], dist = Math.hypot(dx, dz), wy = Math.atan2(dx, dz);
  if (s < out) return null;
  if (s < out + walkT) {                                    // out of the door and across to their spot
    const u = laEase(s, out, out + walkT), ph = u * dist / 0.75 * LAPI;
    const p = lerpPose(laWalkPose(ph), LA_POSES.shield(), style === 0 ? 0.55 : 0.15);
    return { p, pos: [LA_DOOR[0] + dx * u, 0, LA_DOOR[1] + dz * u], yaw: wy };
  }
  const d = laDepth(s), yw = yaw0 + 0.25 * n(s * 0.02, i + 5);
  // the pose for the moment: rain (before it's at their chests), wading, under it
  let p, y = 0;
  const base = style === 0 ? LA_POSES.shield() : style === 1 ? LA_POSES.lookUp() : LA_POSES.armsOut();
  if (d < 0.9) p = lerpPose(base, LA_POSES.wade(), laSm(d, 0.5, 0.9));
  else if (d < 1.75) p = lerpPose(LA_POSES.wade(), LA_POSES.under(), laSm(d, 1.3, 1.75));
  else p = LA_POSES.under();
  // under it: arms drift, a slow bob (they weigh 12 kg); the Moon beat: bounding; the cold; the hard breathing; 4:00
  if (d >= 1.75) {
    p.lSh[1] += 0.18 * Math.sin(s * 0.9 + k); p.rSh[1] += 0.18 * Math.sin(s * 0.8 + k + 1); p.lEl += 0.15 * Math.sin(s * 0.7 + k); p.headYaw = 0.35 * n(s * 0.05, i + 9);
    y = 0.025 * (1 + Math.sin(s * 0.6 + k));
    if (s > 560 && s < 2200 && (i === 2 || i === 4 || i === 8)) {           // three of them bound along, in slow arcs
      const per = 3.2 + 0.4 * (i % 3), u = ((s + k * 3) % per) / per, hop = Math.sin(u * LAPI);
      y = 0.9 * hop; p = lerpPose(LA_POSES.crouch(), LA_POSES.leap(), Math.min(1, hop * 1.6));
    }
    const cold = laSm(s, 2200, 2380);
    if (cold > 0 && s < 3600) { p = lerpPose(p, LA_POSES.hug(), cold); p.headRoll = cold * 0.03 * Math.sin(s * 47 + k); p.spineRoll = cold * 0.02 * Math.sin(s * 53 + k); y *= 1 - cold; }
    const work = laSm(s, 2600, 2700); if (work > 0) p.spine += work * 0.06 * Math.max(0, Math.sin(s * 2.4 + k));
    const up = laSm(s, LAP.back + 1, LAP.back + 3); if (up > 0) { p = lerpPose(p, LA_POSES.armsUp(), up); y *= 1 - up; }
  }
  if (i === 0 && s > 505 && s < 522) { const k2 = laEase(s, 506, 508) * (1 - laEase(s, 519, 521)); p = lerpPose(p, LA_POSES.talk(), k2); p.mouth = k2 * (0.5 + 0.5 * Math.sin(s * 9)); }
  // fidgets (their own small motion)
  p.headYaw += 0.3 * n(s * 0.11, i + 2); p.spineYaw = 0.08 * n(s * 0.07, i + 4);
  const roam = d < 1.75 ? 0 : 0.6;
  return { p, pos: [hx + roam * n(s * 0.004, i + 11), y, hz + roam * n(s * 0.004, i + 13)], yaw: yw };
}

// the mother and her daughter: out of the door first; they stand near you; the girl holds her breath until LA.kidBreath
function laMumState(s) {
  const [hx, hz, yaw, out] = LA_MUMKID.mum, d = laDepth(s);
  if (s < out) return null;
  if (s < out + 10) { const u = laEase(s, out, out + 10), dx = hx - LA_DOOR[0], dz = hz - LA_DOOR[1]; return { p: laWalkPose(u * Math.hypot(dx, dz) / 0.7 * LAPI), pos: [LA_DOOR[0] + dx * u, 0, LA_DOOR[1] + dz * u], yaw: Math.atan2(dx, dz) }; }
  const p = d < 1.75 ? lerpPose(LA_POSES.shield(), LA_POSES.wade(), laSm(d, 0.4, 1.0)) : LA_POSES.under();
  // a hand on her daughter's shoulder
  p.rSh = [0.9, 0.35]; p.rEl = 0.5; p.neck = 0.35; p.headYaw = 0.5;
  if (s > 2200 && s < 3600) { const c = laSm(s, 2200, 2380); p.lSh = [laLerp(p.lSh[0], 1.1, c), laLerp(p.lSh[1], -0.1, c)]; p.lEl = laLerp(p.lEl, 2.0, c); p.headRoll = c * 0.03 * Math.sin(s * 47); }
  if (s > LAP.back + 1) { const up = laSm(s, LAP.back + 1, LAP.back + 3); p.neck = laLerp(p.neck, -0.45, up); }
  return { p, pos: [hx, d >= 1.75 ? 0.02 * (1 + Math.sin(s * 0.6)) : 0, hz], yaw };
}
function laKidState(s) {
  const [hx, hz, yaw, out] = LA_MUMKID.kid, d = laDepth(s), kb = LA.kidBreath || 478;
  if (s < out + 1) return null;
  if (s < out + 11) { const u = laEase(s, out + 1, out + 11), dx = hx - LA_DOOR[0], dz = hz - LA_DOOR[1]; return { p: laWalkPose(u * Math.hypot(dx, dz) / 0.5 * LAPI), pos: [LA_DOOR[0] + dx * u, 0, LA_DOOR[1] + dz * u], yaw: Math.atan2(dx, dz) }; }
  // she's ~1.15 m tall: under it from ~3:06:20 (she holds her breath, cheeks full, arms tight; then breathes)
  let p = d < 0.9 ? LA_POSES.lookUp() : LA_POSES.wade();
  if (s > 375 && s < kb + 0.5) { const q = basePose(); q.lSh = [0.3, 0.1]; q.rSh = [0.3, 0.1]; q.lEl = 1.6; q.rEl = 1.6; q.neck = 0.25; q.spine = 0.15; p = q; }
  if (s >= kb + 0.5) { p = lerpPose(LA_POSES.under(), LA_POSES.armsOut(), laSm(s, kb + 1, kb + 4) * 0.6); p.neck = -0.2 + 0.2 * laSm(s, kb + 3, kb + 6); }
  if (s > 560 && s < 2200) { const per = 2.6, u = ((s + 1.3) % per) / per, hop = Math.sin(u * LAPI) * laSm(s, 980, 1000); if (hop > 0.01) { p = lerpPose(LA_POSES.crouch(), LA_POSES.leap(), Math.min(1, hop * 1.6)); return { p, pos: [hx + 0.4 * Math.sin(s * 0.2), 1.1 * hop, hz], yaw: yaw - 0.6 }; } }
  if (s > 2200 && s < 3600) p = lerpPose(p, LA_POSES.hug(), laSm(s, 2200, 2380));
  if (s > LAP.back + 1) p = lerpPose(p, LA_POSES.armsUp(), laSm(s, LAP.back + 1, LAP.back + 3));
  p.headYaw += 0.3 * noise1(s * 0.13, 77);
  return { p, pos: [hx, d >= 1.75 ? 0.02 * (1 + Math.sin(s * 0.7)) : 0, hz], yaw: yaw - (s > 470 && s < 490 ? 0.5 : 0) };
}

// ducks: on the pond the whole time (water is heavier than the liquid); pigeons: in the park, then flying in it
function laBirdState(i, s, kind) {
  if (kind === 'duck') {
    const pd = LA_ST.pond, a0 = i * 1.3, R = 3 + 2.2 * i, w = 0.03 + 0.01 * (i % 3), ang = a0 + s * w;
    return { pos: [pd.x - 4 + R * Math.cos(ang), -0.06, pd.z + 0.55 * R * Math.sin(ang)], up: [0, 1, 0], fwd: [-Math.sin(ang), 0, 0.55 * Math.cos(ang)], flap: 0 };
  }
  // pigeons: slow circles 2–6 m up over the near edge of the park (only once it's all down: they shelter before)
  const R = 4 + 1.4 * (i % 5), w = 0.12 + 0.02 * (i % 3), ang = s * w + i * 0.63, c = [2, 3.0 + 0.8 * (i % 4), -20];
  return { pos: [c[0] + R * Math.cos(ang), c[1] + 0.6 * Math.sin(s * 0.3 + i), c[2] + R * Math.sin(ang) * 0.8], up: [0, 1, 0], fwd: [-Math.sin(ang), 0.05 * Math.cos(s * 0.3 + i), Math.cos(ang) * 0.8], flap: 1 };
}

function laBuildCast(S) {
  const scene = S.scene, C = {};
  C.folk = LA_FOLK.map((F, i) => { const g = new Person({ id: 'laF' + i, look: F[0] }, null); scene.add(g.root); return g; });
  C.mum = new Person({ id: 'laMum', look: 'laMum' }, null); scene.add(C.mum.root);
  C.kid = new Person({ id: 'laKid', look: 'laKid' }, null); scene.add(C.kid.root); C.kid.root.scale.setScalar(0.66);
  C.ducks = Array.from({ length: 5 }, (_, i) => { const b = laBuildBird(i % 2 ? '#6a5a42' : '#3f5a3a', 1.3); scene.add(b); return b; });
  C.pigeons = Array.from({ length: 10 }, (_, i) => { const b = laBuildBird(i % 3 ? '#7f858c' : '#5f656c', 1.0); scene.add(b); return b; });
  C.update = (s, o) => laCastUpdate(C, s, o || {});
  return C;
}
const _laCy = new THREE.Vector3(0, 1, 0), _laBm = new THREE.Matrix4(), _laBx = new THREE.Vector3(), _laBy = new THREE.Vector3(), _laBz = new THREE.Vector3();
function laPlacePerson(P, st) {
  if (!st) { P.root.visible = false; return; }
  P.root.visible = true; P.root.position.set(st.pos[0], st.pos[1], st.pos[2]); P.root.quaternion.setFromAxisAngle(_laCy, st.yaw); P.apply(st.p);
}
function laCastUpdate(C, s, o) {
  C.folk.forEach((P, i) => laPlacePerson(P, laFolkState(i, s, LA_FOLK[i])));
  laPlacePerson(C.mum, laMumState(s)); laPlacePerson(C.kid, laKidState(s));
  const birds = (arr, kind) => arr.forEach((b, i) => {
    const st = laBirdState(i, s, kind); b.visible = kind === 'duck' || s > 640; b.position.set(...st.pos);
    _laBy.set(...st.up).normalize(); _laBx.set(...st.fwd); _laBx.addScaledVector(_laBy, -_laBx.dot(_laBy)).normalize(); _laBz.crossVectors(_laBx, _laBy);
    _laBm.makeBasis(_laBx, _laBy, _laBz); b.quaternion.setFromRotationMatrix(_laBm);
    // (in the liquid a wingbeat is slow and strong, like a penguin's: 1.5 beats a second, then a glide)
    const f = st.flap ? Math.sin(s * 9.4 + i) * 0.8 * (Math.sin(s * 0.9 + i) > -0.3 ? 1 : 0.15) : 0; b.userData.wings[0].rotation.x = f; b.userData.wings[1].rotation.x = -f;
  });
  birds(C.ducks, 'duck'); birds(C.pigeons, 'pigeon');
}
// a person's head (world), for bubbles and labels
function laHeadOf(P) { const v = new THREE.Vector3(0, 1.55 * P.scale, 0.06); P.root.updateMatrixWorld(true); return P.root.localToWorld(v); }
