/* =====================================================================
   CAST — you (in the third-person shots: a T-shirt, grey joggers, socks), the cat (asleep on your bed), the jogger
   outside (running up the street towards your house), and your first-person hands (the mug; flat on the glass; the
   phone). The shared adult rig (js/world/people.js) is posed directly from story time s. Pure.
   For one hour "down" is east, so a body at rest is posed in a TILTED FRAME: a group turned 90° about z, whose own
   up is west (local +x = world up, local +y = west, local +z = south). A body falling (or at rest before and after
   the hour) is in the OLD FRAME. gtTiltQ blends one into the other (the cat righting itself, you easing off the glass).
     gtBuildCast(S, R, T) → C
   ===================================================================== */

Object.assign(LOOKS, {
  gtYou: { skin: 1, build: 'avg', shirt: '#3f5a74', sleeves: 'short', pants: '#6a6f76', shoes: '#d9d4c8', sole: '#cfc9bc', hair: '#3a2a1e' },
  gtJog: { skin: 3, build: 'slim', shirt: '#d2553f', sleeves: 'long', pants: '#22262c', shoes: '#e8e4dc', sole: '#f0ede6', hair: '#2a1a12', hairStyle: 'pony' },
});
const gtPose = () => basePose();
const gtEase = (s, a, b) => { const u = MathX.clamp((s - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
const GT_QOLD = new THREE.Quaternion(), GT_QTILT = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
// the frame's orientation, k: 0 old … 1 tilted
function gtTiltQ(q, k) { return q.copy(GT_QOLD).slerp(GT_QTILT, MathX.clamp(k, 0, 1)); }

// ---------------------------------------------------------------------------------------------------------------------
// YOU (room-local): standing at the window with the mug; thrown 17 cm onto the glass; lying on it (to you: standing
// pressed to it); easing off it onto the wall beside it (34 → 52 s) and sitting there, your back to the old ceiling;
// at ten to go, down into the corner where the wall meets the old floor; at the return you drop onto the floor
// ---------------------------------------------------------------------------------------------------------------------
GT_YOU.seatP = [0.0, 2.08, 1.02];                // (tilted frame: on the wall, against the old ceiling, beside the window)
GT_YOU.cornerP = [0.0, 0.36, -0.02];             // (on the wall, against the old floor, under the window, between the bed and the chair)
function gtYouState(s) {
  const Y = GT_YOU, R = GT_ROOM.you, p = gtPose();
  // ---- before, and thrown onto the glass (old frame, facing east)
  if (s < Y.crawl[0]) {
    const f = gtFall(s, R.d, { e: 0.04 });
    p.rSh = [0.85, 0.18]; p.rEl = 1.75; p.lSh = [0.12, 0.1]; p.lEl = 0.3; p.neck = 0.18; p.headYaw = 0.05 * Math.sin(s * 0.4);
    if (s > 0) {                                                   // (the reflex: both hands up and out to the glass)
      const k = gtEase(s, 0.0, Y.hitGlass);
      p.rSh = [MathX.lerp(0.85, 1.55, k), MathX.lerp(0.18, 0.75, k)]; p.rEl = MathX.lerp(1.75, 1.05, k);
      p.lSh = [MathX.lerp(0.12, 1.55, k), MathX.lerp(0.1, 0.75, k)]; p.lEl = MathX.lerp(0.3, 1.05, k);
      p.spine = 0.03 + 0.11 * k; p.neck = 0.18 - 0.1 * k; p.headYaw = 0.75 * gtEase(s, 0.3, 1.4); p.headRoll = 0.1 * gtEase(s, 0.3, 1.4);
      // (breathing on the glass)
      p.spine += 0.01 * Math.sin(s * 1.4);
    }
    return { p, pos: [R.x + f.x, 0, 0.1], yaw: Math.PI / 2, tilt: 0 };
  }
  // ---- easing off the glass, onto the wall (to you: off the window, onto the floor beside it), and sitting
  const sit = gtPose();
  sit.hipY = 0.13; sit.pelvisPitch = -0.1; sit.lHip = [1.45, 0.16]; sit.rHip = [1.3, 0.1]; sit.lKnee = 1.35; sit.rKnee = 1.55; sit.lFoot = -0.2; sit.rFoot = -0.25;
  sit.spine = -0.1; sit.neck = 0.25; sit.lSh = [0.35, 0.3]; sit.lEl = 0.6; sit.rSh = [0.45, 0.25]; sit.rEl = 0.7;
  sit.headYaw = 0.35 * Math.sin(s * 0.013) + 0.15 * Math.sin(s * 0.051); sit.spine += 0.01 * Math.sin(s * 1.3);
  if (s < Y.crawl[1]) {
    const k = gtEase(s, Y.crawl[0], Y.crawl[1]), q = lerpPose(gtYouState(Y.crawl[0] - 0.01).p, sit, gtEase(k, 0.15, 0.85));
    const a = [R.x + R.d, 0, 0.1], b = GT_YOU.seatP;
    return { p: q, pos: [MathX.lerp(a[0], b[0], gtEase(k, 0.3, 1)), MathX.lerp(a[1], b[1], gtEase(k, 0.0, 0.8)), MathX.lerp(a[2], b[2], gtEase(k, 0.1, 0.9))], yaw: MathX.lerp(Math.PI / 2, -Math.PI / 2, gtEase(k, 0.2, 0.9)), tilt: gtEase(k, 0.05, 0.75) };
  }
  // ---- down into the corner (10 minutes to go), braced; at the return, the drop to the floor
  const brace = gtPose();
  brace.hipY = 0.12; brace.pelvisPitch = -0.15; brace.lHip = [1.9, 0.2]; brace.rHip = [1.85, 0.14]; brace.lKnee = 2.1; brace.rKnee = 2.2; brace.lFoot = 0.3; brace.rFoot = 0.3;
  brace.spine = 0.12; brace.neck = 0.3; brace.lSh = [1.1, 0.35]; brace.lEl = 1.6; brace.rSh = [1.1, 0.3]; brace.rEl = 1.6;
  const c = gtEase(s, Y.corner[0], Y.corner[1]), P = c > 0 ? lerpPose(sit, brace, c) : sit;
  const pos = [0, MathX.lerp(GT_YOU.seatP[1], GT_YOU.cornerP[1], c), MathX.lerp(GT_YOU.seatP[2], GT_YOU.cornerP[2], c)];
  // (on the way down you turn round: your back to the old floor, knees up, facing the old ceiling)
  if (s < GTP.tBack) return { p: P, pos, yaw: MathX.lerp(-Math.PI / 2, Math.PI / 2, gtEase(c, 0.15, 0.85)), tilt: 1 };
  // the return: the 0.36 m drop; you land on your back on the floor (old frame), knees up the wall
  const u = s - GTP.tBack, f = MathX.clamp(u / 0.32, 0, 1), y = gtDownY(s, GT_YOU.cornerP[1], 0.15);
  const lie = gtPose(); lie.hipY = 0.12; lie.pelvisPitch = -1.45; lie.lHip = [1.7, 0.2]; lie.rHip = [1.5, 0.12]; lie.lKnee = 1.2; lie.rKnee = 1.0; lie.spine = 0.05; lie.neck = 0.35;
  lie.lSh = [0.4, 0.9]; lie.rSh = [0.5, 0.8]; lie.lEl = 0.3; lie.rEl = 0.4; lie.headYaw = 0.3 * gtEase(s, GTP.tBack + 1, GTP.tBack + 3);
  return { p: lerpPose(brace, lie, gtEase(u, 0.05, 0.5)), pos: [-0.25 * f, y, GT_YOU.cornerP[2]], yaw: Math.PI / 2, tilt: 1 - f, drop: true };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE JOGGER (world): running up the street; thrown back past the lamp post, she hooks it (0.72 s) and swings round
// to hang from it (to her: a bar overhead); she climbs on top (100 → 132) and sits on it like a branch; at ten to go
// she edges down to its foot; at the return she drops the last 45 cm onto the pavement
// ---------------------------------------------------------------------------------------------------------------------
function gtJogState(s) {
  const J = GT_JOG, j = gtJog(s), ctx = { seed: 0.4, seedI: 4, walkPhase: 0 }, post = J.post;
  if (j.mode === 'run') { ctx.walkPhase = j.ph; const p = ACTIONS.jog(0, ctx); return { p, pos: [j.x, 0, J.z], yaw: -Math.PI / 2, tilt: 0 }; }
  // the hang (tilted frame): hands round the post at grabY; the body below them (east)
  const hang = gtPose(); hang.hipY = 0.95; hang.lSh = [2.95, 0.12]; hang.rSh = [2.9, 0.12]; hang.lEl = 0.12; hang.rEl = 0.15; hang.neck = -0.1;
  hang.lHip = [0.08, 0.04]; hang.rHip = [-0.04, 0.04]; hang.lKnee = 0.2; hang.rKnee = 0.12; hang.lFoot = 0.4; hang.rFoot = 0.35;
  const H = 2.12;                                              // (her hands above her feet, arms up)
  const hangPos = (dy) => [post.x + 0.07 + H, J.grabY + dy, post.z];   // (the tilted root: feet east of the post)
  if (j.mode === 'fly') {
    ctx.walkPhase = (J.x0 * 1) / -1.4 * Math.PI * 2; const p = ACTIONS.jog(0, ctx);
    const k = gtEase(j.u, 0.25, 1);
    p.lSh = [MathX.lerp(p.lSh[0], 2.2, k), 0.3 * k]; p.rSh = [MathX.lerp(p.rSh[0], 2.0, k), 0.3 * k]; p.lEl = MathX.lerp(p.lEl, 0.3, k); p.rEl = MathX.lerp(p.rEl, 0.35, k);
    return { p, pos: [j.x, 0, J.z], yaw: -Math.PI / 2, tilt: 0 };
  }
  if (j.mode === 'hang') {
    // (the swing round the post, 0 → 0.7 s after the catch; then she sways, kicks, tries to hold on)
    const k = gtEase(j.u, 0, 0.7), ru = j.u;
    const run = gtJogState(J.catch - 0.001);
    const p = lerpPose(run.p, hang, k);
    if (ru > 0.7) { p.lHip = [0.08 + 0.25 * Math.max(0, Math.sin(ru * 1.1)) * Math.exp(-ru * 0.03), 0.04]; p.rHip = [-0.04 + 0.2 * Math.max(0, Math.sin(ru * 1.1 + 2)) * Math.exp(-ru * 0.03), 0.04]; p.headYaw = 0.4 * Math.sin(ru * 0.3); }
    const a = run.pos, b = hangPos(0), sw = 0.08 * Math.sin(ru * 2.1) * Math.exp(-ru * 0.15);
    return { p, pos: [MathX.lerp(a[0], b[0], k), MathX.lerp(a[1], b[1], k), MathX.lerp(a[2], b[2], k) + sw], yaw: MathX.lerp(-Math.PI / 2, 0, k), tilt: k };
  }
  // sitting on the post (tilted frame): her hips on its top (west) side, legs hanging below it (east), facing south
  const sit = gtPose(); sit.hipY = 0.55; sit.lHip = [1.45, 0.12]; sit.rHip = [1.5, 0.1]; sit.lKnee = 1.4; sit.rKnee = 1.55; sit.spine = 0.12; sit.neck = 0.15;
  sit.lSh = [0.5, 0.35]; sit.rSh = [0.5, 0.35]; sit.lEl = 0.5; sit.rEl = 0.5;
  const sitPos = (yy) => [post.x + 0.42, yy, post.z - 0.08];      // (hips just west of the post: hipY 0.55 up the tilted frame)
  if (j.mode === 'climb') {
    const k = j.u, mid = gtPose(); mid.hipY = 0.8; mid.lSh = [2.6, 0.2]; mid.rSh = [2.5, 0.2]; mid.lEl = 1.2; mid.rEl = 1.3; mid.lHip = [1.8, 0.1]; mid.rHip = [0.3, 0.05]; mid.lKnee = 1.6; mid.rKnee = 0.4; mid.spine = 0.5; mid.neck = 0.3;
    const p = k < 0.5 ? lerpPose(hang, mid, gtEase(k, 0, 0.5)) : lerpPose(mid, sit, gtEase(k, 0.5, 1));
    const a = hangPos(0), b = sitPos(J.grabY - 0.15), e = gtEase(k, 0.1, 0.95);
    return { p, pos: [MathX.lerp(a[0], b[0], e), MathX.lerp(a[1], b[1], e), MathX.lerp(a[2], b[2], e)], yaw: 0, tilt: 1 };
  }
  if (j.mode === 'sit') {
    const p = Object.assign({}, sit); p.headYaw = 0.5 * Math.sin(s * 0.011) + 0.2 * Math.sin(s * 0.07); p.lKnee += 0.15 * Math.sin(s * 0.9) * 0.3;
    const down = gtEase(s, J.down[0], J.down[1]); if (down > 0 && down < 1) { p.lSh = [0.2, 0.6]; p.rSh = [0.2, 0.6]; }
    return { p, pos: sitPos(j.y), yaw: 0, tilt: 1 };
  }
  // the return: she drops onto the pavement and sits there (old frame)
  const u = j.u, f = MathX.clamp(u / 0.3, 0, 1), g = gtPose();
  g.hipY = 0.14; g.lHip = [1.6, 0.25]; g.rHip = [1.4, 0.2]; g.lKnee = 1.2; g.rKnee = 0.6; g.spine = 0.15; g.neck = 0.3; g.lSh = [-0.4, 0.5]; g.rSh = [-0.4, 0.5]; g.lEl = 0.2; g.rEl = 0.2;
  const a = sitPos(J.lowY);
  return { p: lerpPose(sit, g, gtEase(u, 0.05, 0.45)), pos: [a[0] + 0.5 * f, Math.max(0.12, j.y - 0.4) * (1 - f) + 0.12 * f, a[2] - 0.1 * f], yaw: MathX.lerp(0, -Math.PI / 2, f), tilt: 1 - f };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE CAT (room-local): asleep on the bed; falls with it, keeps going when it stops, turns in the air and lands feet
// first on the wall (0.63 s); crouched, ears flat, for a while; then up, a look round, a wash: adjusted. At the return
// she drops 62 cm onto the floor and lands on her feet
// ---------------------------------------------------------------------------------------------------------------------
GT_CAT_POSES.groom = Object.assign({}, GT_CAT_POSES.sit, { np: 0.35, hp: -0.6, hy: 0.25, fl: [0.07, 0.17], ear: 0.3, blink: 0.6 });
function gtCatState(s) {
  const C = GT_CAT, P = GT_CAT_POSES;
  if (s <= 0) return { P: P.loaf, pos: [C.x0, C.y, C.z], tilt: 0, yaw: 0.3 };
  const f = gtFall(s, C.d, { e: 0.02 });
  if (!f.hit || s < f.hit) { const k = gtEase(s, 0.15, C.land - 0.05); return { P: gtCatBlend(P.loaf, P.leap, gtEase(s, 0, 0.3)), pos: [C.x0 + f.x, C.y, C.z], tilt: k, yaw: 0.3 * (1 - k) }; }
  const T = GTP.tBack;
  if (s < T) {
    // (tilted frame: on the wall, at the height she landed). Crouched (to 100 s); up (to 140); looking round; washing
    const k1 = gtEase(s, 70, 100), k2 = gtEase(s, 150, 158);
    let Q = gtCatBlend(P.crouch, P.sit, k1);
    if (k2 > 0) { Q = gtCatBlend(Q, P.groom, k2); Q.hp = P.groom.hp + 0.12 * Math.sin(s * 9.0) * k2; Q.fl = [0.07 + 0.015 * Math.sin(s * 9.0), 0.17]; }
    if (s > 2980) Q = gtCatBlend(Q, P.crouch, gtEase(s, 2980, 3000));                  // (she feels the house creak: down again)
    Q.ny = 0.4 * Math.sin(s * 0.05) * k1;
    return { P: Q, pos: [-0.02, C.y, C.z], tilt: 1, yaw: 0 };
  }
  // the return: a 0.6 m drop, the twist back, feet first on the floor
  const u = s - T, y = gtDownY(s, C.y - 0.05, 0.05), k = gtEase(u, 0.02, 0.3);
  return { P: gtCatBlend(P.crouch, u < 0.35 ? P.leap : P.stand, gtEase(u, 0.0, 0.3)), pos: [-0.25 * k, Math.max(0, y), C.z], tilt: 1 - k, yaw: 0 };
}

function gtBuildCast(S, R, T) {
  const scene = S.scene, C = {};
  const mk = (id, look) => new Person({ id, look }, null);
  // you: in a tilt group inside the bedroom (it leans with the house)
  C.youT = new THREE.Group(); R.room.add(C.youT); C.you = mk('gtYou', 'gtYou'); C.youT.add(C.you.root);
  // the jogger: in a tilt group in the street
  C.jogT = new THREE.Group(); scene.add(C.jogT); C.jog = mk('gtJog', 'gtJog'); C.jogT.add(C.jog.root);
  // the cat (a grey tabby), in a tilt group in the bedroom
  C.catT = new THREE.Group(); R.room.add(C.catT); C.catG = new THREE.Group(); C.catT.add(C.catG); C.cat = gtBuildCat(C.catG, { seed: 5, cols: { base: [150, 146, 140], dark: [70, 68, 66], belly: [228, 224, 216] } });
  C.update = (s, o) => gtCastUpdate(C, s, o || {});
  return C;
}

const _gtCq = new THREE.Quaternion(), _gtCq2 = new THREE.Quaternion(), _gtCy = new THREE.Vector3(0, 1, 0);
// put a body: its tilt group at pos with the frame's turn; the body inside it turned by yaw (about the frame's up)
function gtPlace(group, body, st) {
  group.position.set(st.pos[0], st.pos[1], st.pos[2]);
  gtTiltQ(group.quaternion, st.tilt);
  body.position.set(0, 0, 0); body.quaternion.setFromAxisAngle(_gtCy, st.yaw);
}
function gtCastUpdate(C, s, o) {
  { const st = gtYouState(s); gtPlace(C.youT, C.you.root, st); C.you.apply(st.p); C.youT.visible = !o.pov; }
  { const st = gtJogState(s); gtPlace(C.jogT, C.jog.root, st); C.jog.apply(st.p); }
  { const st = gtCatState(s); gtPlace(C.catT, C.catG, st); C.cat.pose(st.P, s); }
  C.youT.updateMatrixWorld(true); C.jogT.updateMatrixWorld(true); C.catT.updateMatrixWorld(true);
}
