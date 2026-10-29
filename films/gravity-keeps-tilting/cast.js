/* =====================================================================
   CAST — you (in your living room: a jumper, jeans, socks), a mother and her daughter in the park (the girl was on the
   climbing dome when it started; they get inside it and keep to its lowest bars as the lowest bars move round), the
   ducks on the pond and the pigeons over the park (they just fly; their bellies stay towards down). The shared adult
   rig (js/world/people.js) is posed from story time s. Pure.
   A body stands in a TILTED FRAME: a group turned θ_f about z (its up is the felt up when θ_f follows down), with the
   body inside it turned by yaw about that up. Your keyframes follow the simulation: you keep by the radiator (fixed to
   the north wall, never a floor), let the furniture go first at each of the four avalanches, then follow it down.
     gkBuildCast(S, R, T) → C
   ===================================================================== */

Object.assign(LOOKS, {
  gkYou: { skin: 2, build: 'avg', shirt: '#7a3b34', sleeves: 'long', pants: '#33415a', shoes: '#e8e4dc', sole: '#d8d4ca', hair: '#2a1c14' },
  gkMum: { skin: 4, build: 'slim', shirt: '#2f5a6a', sleeves: 'long', pants: '#2a2d33', shoes: '#d9d4c8', sole: '#f0ede6', hair: '#1a120c', hairStyle: 'long', coat: true, collar: true },
  gkKid: { skin: 4, build: 'slim', shirt: '#e0b23a', sleeves: 'long', pants: '#c8463a', shoes: '#f2f0ea', sole: '#f2f0ea', hair: '#1a120c', hairStyle: 'pony' },
});
const gkPose = () => basePose();
const gkEase = (s, a, b) => { const u = MathX.clamp((s - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };

// ---- poses (the rig: lSh = [forward, out], 0 hanging, π/2 forward, π overhead; lHip = [flex, out]; hipY = pelvis height)
const GK_POSES = {
  stand: () => gkPose(),
  look: () => { const p = gkPose(); p.lSh = [0.15, 0.12]; p.rSh = [0.35, 0.1]; p.rEl = 0.6; p.neck = 0.1; return p; },
  brace: () => { const p = gkPose(); p.hipY = 0.82; p.lHip = [0.3, 0.18]; p.rHip = [0.2, 0.18]; p.lKnee = 0.45; p.rKnee = 0.35; p.lSh = [0.6, 0.5]; p.rSh = [0.6, 0.5]; p.lEl = 0.5; p.rEl = 0.5; p.spine = 0.12; return p; },
  crouchHold: () => { const p = gkPose(); p.hipY = 0.5; p.pelvisPitch = 0.25; p.lHip = [1.5, 0.16]; p.rHip = [1.3, 0.12]; p.lKnee = 1.9; p.rKnee = 1.7; p.lFoot = 0.3; p.rFoot = 0.3; p.spine = 0.45; p.neck = -0.1; p.lSh = [1.25, 0.2]; p.rSh = [1.3, 0.2]; p.lEl = 0.35; p.rEl = 0.3; return p; },
  sitHold: () => { const p = gkPose(); p.hipY = 0.14; p.pelvisPitch = -0.2; p.lHip = [1.35, 0.2]; p.rHip = [1.2, 0.16]; p.lKnee = 0.9; p.rKnee = 0.6; p.spine = 0.25; p.neck = 0.05; p.lSh = [1.45, 0.25]; p.rSh = [1.5, 0.22]; p.lEl = 0.25; p.rEl = 0.2; return p; },
  slide: () => { const p = gkPose(); p.hipY = 0.13; p.pelvisPitch = -0.6; p.lHip = [1.55, 0.22]; p.rHip = [1.45, 0.18]; p.lKnee = 0.25; p.rKnee = 0.4; p.spine = -0.25; p.neck = 0.35; p.lSh = [-0.4, 0.75]; p.rSh = [-0.3, 0.7]; p.lEl = 0.3; p.rEl = 0.3; return p; },
  sitBack: () => { const p = gkPose(); p.hipY = 0.14; p.pelvisPitch = -0.3; p.lHip = [1.5, 0.2]; p.rHip = [1.3, 0.16]; p.lKnee = 1.5; p.rKnee = 1.1; p.spine = -0.12; p.neck = 0.2; p.lSh = [0.3, 0.45]; p.rSh = [0.5, 0.35]; p.lEl = 0.9; p.rEl = 0.8; return p; },
  armsUp: () => { const p = gkPose(); p.lSh = [2.95, 0.15]; p.rSh = [2.9, 0.15]; p.lEl = 0.15; p.rEl = 0.2; p.neck = -0.2; p.spine = -0.04; return p; },
  crouchUp: () => { const p = gkPose(); p.hipY = 0.62; p.lHip = [1.2, 0.18]; p.rHip = [1.05, 0.15]; p.lKnee = 1.55; p.rKnee = 1.35; p.spine = 0.15; p.lSh = [2.7, 0.2]; p.rSh = [2.65, 0.2]; p.lEl = 0.3; p.rEl = 0.35; p.neck = -0.15; return p; },
  climb: () => { const p = gkPose(); p.hipY = 0.7; p.lHip = [0.9, 0.25]; p.rHip = [0.4, 0.2]; p.lKnee = 1.2; p.rKnee = 0.6; p.lSh = [2.2, 0.5]; p.rSh = [1.8, 0.55]; p.lEl = 0.7; p.rEl = 0.9; p.spine = 0.2; return p; },
};

// ---------------------------------------------------------------------------------------------------------------------
// YOU (room-local). Keys: [s, x, y, z (your feet), frame (deg: the body's up turned from the old up), yaw, pose]
// ---------------------------------------------------------------------------------------------------------------------
const GKPI = Math.PI;
const GK_YOU_KEYS = [
  [-2, 0.25, 0, -1.52, 0, GKPI, 'stand'],                    // at the window, looking out at the park
  [6.5, 0.25, 0, -1.52, 0, GKPI, 'look'],
  [9.5, 0.3, 0, -1.45, 2, 0.4, 'look'],                    // turn round: the lamp's swinging, the bookcase goes
  [13.5, 0.3, 0, -1.45, 4, 0.2, 'brace'],
  [17.5, 0.32, 0, -1.4, 6, GKPI, 'crouchHold'],              // down to the radiator, hands on its top
  [24, 0.32, 0, -1.38, 10, GKPI, 'sitHold'],                 // sitting, holding on, while the room slides past behind you
  [52.8, 0.32, 0, -1.38, 22, GKPI, 'sitHold'],
  [53.4, 0.4, 0, -1.45, 10, GKPI / 2, 'slide'],              // let go: follow it all down (the floor is a 53° slide)
  [54.6, 1.55, 0, -1.5, 8, GKPI / 2, 'slide'],
  [56.5, 1.6, 0, -1.5, 15, GKPI / 2, 'sitBack'],             // against the plant pot, in the corner
  [86, 1.85, 0.25, -1.5, 80, GKPI / 2, 'sitBack'],
  [92, 2.47, 0.55, -1.5, 92, GKPI, 'look'],                  // standing on the east wall
  [112, 2.47, 0.55, -1.5, 112, GKPI, 'stand'],
  [115.5, 2.47, 0.5, -1.45, 114, GKPI, 'crouchUp'],          // reach up: the radiator's east end
  [125.5, 2.47, 0.5, -1.45, 125, GKPI, 'crouchUp'],
  [127.2, 2.47, 1.75, -1.5, 126, GKPI, 'slide'],             // let go: down the wall onto the pile in the ceiling corner
  [130, 2.47, 1.8, -1.5, 128, GKPI, 'sitBack'],
  [168, 2.3, 2.25, -1.5, 166, GKPI, 'sitBack'],
  [176, 2.0, 2.58, -1.48, 178, GKPI, 'look'],                // on your ceiling, at the window
  [186, 2.0, 2.58, -1.48, 186, GKPI, 'stand'],
  [190, 2.0, 2.58, -1.48, 190, 0.3, 'look'],               // turn: the room, upside down
  [200, 1.1, 2.58, -1.48, 199, GKPI, 'stand'],               // to the radiator, overhead now
  [204, 1.0, 2.58, -1.48, 203, GKPI, 'armsUp'],
  [213, 1.0, 2.58, -1.48, 210, GKPI, 'armsUp'],              // holding on while it all slides 5 m along the ceiling
  [214.6, 0.6, 2.58, -1.5, 212, -GKPI / 2, 'slide'],         // and follow it
  [216.4, -1.15, 2.58, -1.5, 214, -GKPI / 2, 'slide'],
  [218.5, -1.2, 2.58, -1.5, 216, -GKPI / 2, 'sitBack'],
  [262, -2.2, 2.2, -1.5, 258, -GKPI / 2, 'sitBack'],
  [270, -2.47, 1.6, -1.5, 270, GKPI, 'look'],                // standing on the west wall
  [290, -2.47, 1.05, -1.48, 288, GKPI, 'stand'],
  [294, -2.47, 1.0, -1.45, 292, GKPI, 'crouchUp'],           // the radiator's west end
  [302.5, -2.47, 1.0, -1.45, 300, GKPI, 'crouchUp'],
  [304.2, -2.47, 0.5, -1.5, 302, GKPI, 'slide'],             // down onto the floor at the west end
  [307, -2.4, 0.45, -1.5, 304, GKPI, 'sitBack'],
  [352, -1.95, 0.08, -1.5, 352, GKPI / 2, 'sitBack'],
  [358.5, -1.9, 0, -1.5, 359, GKPI / 2, 'crouchHold'],
  [360.4, -1.9, 0, -1.5, 360, GKPI, 'stand'],                // down is down: up, for one second
  [366, -1.9, 0, -1.5, 362, GKPI, 'look'],
];
function gkKeyAt(K, s) {
  if (s <= K[0][0]) return { a: K[0], b: K[0], u: 0 };
  for (let i = 0; i < K.length - 1; i++) if (s < K[i + 1][0]) return { a: K[i], b: K[i + 1], u: gkEase(s, K[i][0], K[i + 1][0]) };
  return { a: K[K.length - 1], b: K[K.length - 1], u: 0 };
}
function gkYouState(s) {
  const { a, b, u } = gkKeyAt(GK_YOU_KEYS, s), L = MathX.lerp;
  const p = lerpPose(GK_POSES[a[6]](), GK_POSES[b[6]](), u);
  p.spine += 0.01 * Math.sin(s * 1.4); p.headYaw += 0.12 * Math.sin(s * 0.31) + 0.05 * gkTickPulse(s, 0.2);
  let yaw = a[5] + ((((b[5] - a[5]) % (2 * GKPI)) + 3 * GKPI) % (2 * GKPI) - GKPI) * u;
  return { p, pos: [L(a[1], b[1], u), L(a[2], b[2], u), L(a[3], b[3], u)], frame: L(a[4], b[4], u), yaw };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE MOTHER AND HER DAUGHTER (world): the girl on top of the dome, her mother beside it; they get in (8 → 16 s) and keep
// to its lowest bars: at the angle θ the lowest point inside is the dome's centre + r·down (once down points up off the
// ground); before that, the dome's floor, sliding to its east bars as the slope steepens
// ---------------------------------------------------------------------------------------------------------------------
function gkDomeSpot(s, off) {                                    // → { pos (feet), frame }
  const D = GK_ST.dome, d = gkDegC(s), r = D.r - 0.12, a = d * Math.PI / 180;
  if (d < 40) { const x = D.x + off[0] + (D.r - 0.5) * gkSm(d, 18, 40); return { pos: [x, 0, D.z + off[1]], frame: d * 0.5 }; }
  if (d < 90) { const k = gkSm(d, 40, 90), ang = (90 - 60 * (1 - k)) * Math.PI / 180; return { pos: [D.x + r * Math.sin(ang) * 0.92, r * Math.cos(ang) * 0.7, D.z + off[1]], frame: d }; }
  if (d < 352) { const dd = Math.max(90, d - 4) * Math.PI / 180; return { pos: [D.x + r * Math.sin(dd), Math.max(0, -r * Math.cos(dd)), D.z + off[1]], frame: d }; }
  return { pos: [D.x + off[0], 0, D.z + off[1]], frame: d };
}
function gkMumState(s) {
  const D = GK_ST.dome, p = gkPose();
  if (s < 9) { p.headYaw = 0.6 * Math.sin(s * 0.4); p.lSh = [0.4, 0.2]; p.rSh = [s > 4 ? 1.2 : 0.3, 0.3]; p.rEl = 0.4; return { p, pos: [D.x - 2.6, 0, D.z + 0.6], frame: 0, yaw: GKPI / 2 }; }
  if (s < 16) { const k = gkEase(s, 9, 16), q = lerpPose(gkPose(), GK_POSES.climb(), Math.sin(k * GKPI)); return { p: q, pos: [D.x - 2.6 + 2.0 * k, 0, D.z + 0.6 - 0.4 * k], frame: 2 * k, yaw: GKPI / 2 }; }
  const sp = gkDomeSpot(s, [-0.4, 0.2]), q = GK_POSES.climb(), w = Math.sin(s * 0.8) * 0.15;
  q.lSh = [2.3 + w, 0.5]; q.rSh = [1.9 - w, 0.55]; q.headYaw = 0.4 * Math.sin(s * 0.05);
  if (gkDegC(s) < 40) Object.assign(q, { hipY: 0.5, lKnee: 1.4, rKnee: 1.2 });
  return { p: q, pos: sp.pos, frame: sp.frame, yaw: GKPI / 2 + 0.4 };
}
function gkKidState(s) {
  const D = GK_ST.dome, p = gkPose();
  if (s < 8) { const q = GK_POSES.climb(); q.lSh = [2.4, 0.4]; q.rSh = [2.0, 0.5]; return { p: q, pos: [D.x - 0.5, D.r - 0.15, D.z + 0.3], frame: 0, yaw: -GKPI / 2 }; }
  if (s < 14) { const k = gkEase(s, 8, 14), q = GK_POSES.climb(); return { p: q, pos: [D.x - 0.5 - 1.2 * Math.sin(k * GKPI) * 0.4, (D.r - 0.15) * (1 - k), D.z + 0.3], frame: 0, yaw: -GKPI / 2 + GKPI * k }; }
  const sp = gkDomeSpot(s, [0.3, -0.45]), q = GK_POSES.climb(), w = Math.sin(s * 1.1 + 1) * 0.2;
  q.lSh = [2.5 + w, 0.45]; q.rSh = [2.2 - w, 0.5]; q.headYaw = 0.5 * Math.sin(s * 0.07 + 1);
  return { p: q, pos: sp.pos, frame: sp.frame, yaw: GKPI / 2 - 0.3 };
}

// ---------------------------------------------------------------------------------------------------------------------
// BIRDS: ducks on the pond (ride the spill east, take off at ~22°, circle low); pigeons circling over the park. Their
// bellies face down, wherever down is
// ---------------------------------------------------------------------------------------------------------------------
function gkBirdState(i, s, kind) {
  const d = gkDegC(s), dn = gkDown(d);
  if (kind === 'duck') {
    const pd = GK_ST.pond, a0 = i * 1.1, x0 = pd.x - 6 + 3 * i, z0 = pd.z + 4 * Math.sin(a0);
    if (d < 22) return { pos: [x0 + 0.06 * Math.max(0, s - 1) ** 2, 0.05, z0], up: [0, 1, 0], fwd: [1, 0, 0.2], flap: 0 };
    const u = s - 22, R = 18 + 4 * i, w = 0.25, c = [x0 + 0.06 * 21 * 21 + 8, 6 + 2 * i, z0 - 10];
    const ang = u * w + a0, pos = [c[0] + R * Math.cos(ang), c[1] + 3 * Math.sin(u * 0.3 + i) + Math.min(1, u / 3) * 4 - 4 * (1 - Math.min(1, u / 3)), c[2] + R * Math.sin(ang)];
    return { pos, up: [-dn[0], -dn[1], 0], fwd: [-Math.sin(ang), 0, Math.cos(ang)], flap: 1 };
  }
  const R = 6 + 1.6 * (i % 5), w = 0.55 + 0.04 * (i % 3), ang = s * w + i * 0.63, c = [0, 21 + 1.2 * (i % 4), -48];
  return { pos: [c[0] + R * Math.cos(ang), c[1] + 1.5 * Math.sin(s * 0.5 + i), c[2] + R * Math.sin(ang) * 0.7], up: [-dn[0], -dn[1], 0], fwd: [-Math.sin(ang), 0, Math.cos(ang) * 0.7], flap: 1 };
}

function gkBuildCast(S, R, T) {
  const scene = S.scene, C = {};
  const mk = (id, look) => new Person({ id, look }, null);
  C.youT = new THREE.Group(); R.room.add(C.youT); C.you = mk('gkYou', 'gkYou'); C.youT.add(C.you.root);
  C.mumT = new THREE.Group(); scene.add(C.mumT); C.mum = mk('gkMum', 'gkMum'); C.mumT.add(C.mum.root);
  C.kidT = new THREE.Group(); scene.add(C.kidT); C.kid = mk('gkKid', 'gkKid'); C.kidT.add(C.kid.root); C.kid.root.scale.setScalar(0.6);
  C.ducks = Array.from({ length: 5 }, (_, i) => { const b = gkBuildBird(i % 2 ? '#6a5a42' : '#3f5a3a', 1.3); scene.add(b); return b; });
  C.pigeons = Array.from({ length: 12 }, (_, i) => { const b = gkBuildBird(i % 3 ? '#7f858c' : '#5f656c', 1.0); scene.add(b); return b; });
  C.update = (s, o) => gkCastUpdate(C, s, o || {});
  return C;
}
const _gkCy = new THREE.Vector3(0, 1, 0), _gkBm = new THREE.Matrix4(), _gkBx = new THREE.Vector3(), _gkBy = new THREE.Vector3(), _gkBz = new THREE.Vector3();
function gkPlace(group, body, st) {
  group.position.set(st.pos[0], st.pos[1], st.pos[2]);
  group.rotation.set(0, 0, st.frame * Math.PI / 180);
  body.position.set(0, 0, 0); body.quaternion.setFromAxisAngle(_gkCy, st.yaw);
}
function gkCastUpdate(C, s, o) {
  { const st = gkYouState(s); gkPlace(C.youT, C.you.root, st); C.you.apply(st.p); C.youT.visible = !o.pov; }
  { const st = gkMumState(s); gkPlace(C.mumT, C.mum.root, st); C.mum.apply(st.p); }
  { const st = gkKidState(s); gkPlace(C.kidT, C.kid.root, st); C.kid.apply(st.p); }
  const birds = (arr, kind) => arr.forEach((b, i) => {
    const st = gkBirdState(i, s, kind); b.position.set(...st.pos);
    _gkBy.set(...st.up).normalize(); _gkBx.set(...st.fwd); _gkBx.addScaledVector(_gkBy, -_gkBx.dot(_gkBy)).normalize(); _gkBz.crossVectors(_gkBx, _gkBy);
    _gkBm.makeBasis(_gkBx, _gkBy, _gkBz); b.quaternion.setFromRotationMatrix(_gkBm);
    const f = st.flap ? Math.sin(s * (kind === 'duck' ? 14 : 18) + i) * 0.7 : 0; b.userData.wings[0].rotation.x = f; b.userData.wings[1].rotation.x = -f;
  });
  birds(C.ducks, 'duck'); birds(C.pigeons, 'pigeon');
  C.youT.updateMatrixWorld(true); C.mumT.updateMatrixWorld(true); C.kidT.updateMatrixWorld(true);
}
