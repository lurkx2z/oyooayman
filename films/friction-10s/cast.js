/* =====================================================================
   CAST — who's in the film: you (in the third-person shots: a sweatshirt, jeans and socks), the cat, your first-person
   hands (the phone; the reach; the slap on the island; the hook over the oven handle), and outside the walker and her
   dog, the man tying his laces at the bus stop, the window cleaner on his ladder, the cyclist, the driver.
   The shared adult rig (js/world/people.js) is posed directly here from story time s: each person's pose is a function
   of s (physics.js says where they are). Pure.
     fzBuildCast(S, H, T) → C
   ===================================================================== */

Object.assign(LOOKS, {
  fzYou: { skin: 1, build: 'avg', shirt: '#55687c', sleeves: 'long', pants: '#2c3a52', shoes: '#d9d4c8', sole: '#cfc9bc', hair: '#3a2a1e' },
  fzWalker: { skin: 3, build: 'slim', shirt: '#c25a46', sleeves: 'short', pants: '#2e3a52', shoes: '#e8e4dc', sole: '#f0ede6', hair: '#1a120c', hairStyle: 'pony' },
  fzLace: { skin: 0, build: 'avg', shirt: '#3e5a46', sleeves: 'short', pants: '#4a4640', shoes: '#33405a', sole: '#e8e4dc', hair: '#6a4a2a', hat: { type: 'cap', color: '#1f2a3a' }, backpack: '#2a2c30' },
  fzCleaner: { skin: 2, build: 'broad', shirt: '#2f3a48', sleeves: 'long', pants: '#3a3f46', shoes: '#4a3a2c', sole: '#22201c', hair: '#2a1e14', vest: '#d8a02e' },
  fzRider: { skin: 4, build: 'slim', shirt: '#2a2c30', sleeves: 'short', pants: '#1d2a3a', shoes: '#111', hair: '#111', hat: { type: 'helmet', color: '#e8e4dc' }, backpack: '#c9a23a' },
});
const fzPose = () => basePose();
const fzLerpPose = lerpPose;
const fzEase = (s, a, b) => { const u = MathX.clamp((s - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };

// ---------------------------------------------------------------------------------------------------------------------
// YOU (third person): standing with the phone; the reach; feet out from under you; the slap; the hook; sitting holding on
// ---------------------------------------------------------------------------------------------------------------------
function fzYouPose(s) {
  const F = FZ_FALL, p = fzPose();
  // standing, the phone in the left hand in front of the chest, looking down at it then up at the cat
  p.lSh = [0.75, 0.12]; p.lEl = 1.55; p.rSh = [0.15, 0.12]; p.rEl = 0.35; p.neck = 0.35 - 0.3 * fzEase(s, -0.6, -0.2); p.headYaw = -0.5 * fzEase(s, -0.6, -0.1);
  if (s > 0) { p.lSh = [0.75 - 0.4 * fzEase(s, 0, 0.3), 0.12 + 0.3 * fzEase(s, 0, 0.3)]; p.lEl = 1.55 - 1.0 * fzEase(s, 0, 0.3); }
  // the reach for the mug (right arm forward-right, leaning)
  const r = fzEase(s, F.reach, F.slip);
  p.rSh = [0.15 + 1.1 * r, 0.12 + 0.35 * r]; p.rEl = 0.35 - 0.2 * r; p.spine += 0.25 * r; p.spineYaw = -0.3 * r; p.headYaw = -0.5 + 0.1 * r;
  if (s < F.slip) { p.lHip = [-0.1 * r, 0.04]; p.rHip = [0.25 * r, 0.04]; return { p, dz: 0 }; }
  // the fall (0.55 → 1.2): both feet shoot forward, you go down on your backside, arms flung out
  const f = fzEase(s, F.slip, F.down), e = f * f;
  const sit = fzPose();
  sit.hipY = 0.13; sit.pelvisPitch = -0.35; sit.lHip = [1.35, 0.14]; sit.rHip = [1.25, 0.1]; sit.lKnee = 0.25; sit.rKnee = 0.45;
  sit.lFoot = -0.4; sit.rFoot = -0.3; sit.spine = 0.12; sit.neck = 0.15;
  const mid = fzPose();
  mid.hipY = 0.55; mid.pelvisPitch = -0.9; mid.lHip = [1.6, 0.2]; mid.rHip = [1.4, 0.15]; mid.lKnee = 0.2; mid.rKnee = 0.3; mid.spine = 0.35; mid.neck = 0.35;
  let q = f < 0.5 ? fzLerpPose(p, mid, fzEase(f, 0, 0.5)) : fzLerpPose(mid, sit, fzEase(f, 0.5, 1));
  q.lSh = [0.6 + 0.8 * Math.sin(f * Math.PI), 0.4 + 0.9 * Math.sin(f * Math.PI)]; q.lEl = 0.4;
  // the right hand: slaps onto the island's edge (0.75 → 1.0) and skids off
  const sl = fzEase(s, F.grab[0] - 0.08, F.grab[0]), off = fzEase(s, F.grab[1], F.grab[1] + 0.2);
  q.rSh = [MathX.lerp(1.3, 0.55, off), MathX.lerp(1.45, 0.35, off) * Math.max(sl, 0.4)]; q.rEl = MathX.lerp(0.25, 0.6, off);
  // the left hand: up and over the oven handle (1.45 → 1.9) and holding on
  const hk = fzEase(s, F.hook[0], F.hook[0] + 0.3);
  if (hk > 0) { q.lSh = [MathX.lerp(q.lSh[0], 1.45, hk), MathX.lerp(q.lSh[1], 0.75, hk)]; q.lEl = MathX.lerp(q.lEl, 0.35, hk); q.spineRoll = 0.15 * hk; q.spineYaw = 0.25 * hk; q.headYaw = 0.35 * hk; }
  // later: looking about (at the cat; down the room), a small sway as the floor tilts you
  if (s > 2.2) { q.headYaw = 0.35 + 0.45 * Math.sin(s * 0.35); q.neck = 0.1 + 0.08 * Math.sin(s * 0.5 + 1); }
  return { p: q, dz: -FZ_YOU.slide * e };
}
// (at s = 10, you're holding on: the grip comes back and nothing happens to you. Small mercies)

// ---------------------------------------------------------------------------------------------------------------------
// THE PEOPLE OUTSIDE
// ---------------------------------------------------------------------------------------------------------------------
// the walker: walking uphill (−x); her push-off foot shoots back at 0.22 and she goes down onto her hands and knees,
// then slides back down the hill on all fours (her dog in front of her, running on the spot on its lead). At 10 s the
// grip comes back with her sliding at 21 km/h: she tumbles over backwards
function fzWalkerPose(s, x) {
  const p = fzPose(), slip = FZ_WALKER.slip;
  if (s < slip) {                                              // walking
    const ph = (x - FZ_WALKER.x0) / -1.32 * Math.PI * 2, sn = Math.sin(ph), co = Math.cos(ph);
    p.lHip = [0.42 * sn, 0.03]; p.rHip = [-0.42 * sn, 0.03]; p.lKnee = 0.08 + 0.65 * Math.max(0, co) ** 1.5; p.rKnee = 0.08 + 0.65 * Math.max(0, -co) ** 1.5;
    p.lSh = [-0.3 * sn, 0.07]; p.rSh = [0.55, 0.12]; p.rEl = 0.9; p.hipY = 0.93 - 0.03 * sn * sn; p.spine = 0.08;
    return p;
  }
  const k = fzEase(s, slip, slip + 0.5), c = fzPose();
  c.hipY = 0.55; c.lHip = [0.12, 0.16]; c.rHip = [0.1, 0.16]; c.lKnee = c.rKnee = 1.5; c.lFoot = c.rFoot = 0.5;
  c.spine = 1.05; c.neck = -0.45; c.lSh = [1.15, 0.35]; c.rSh = [1.3, 0.3]; c.lEl = 0.1; c.rEl = 0.4;
  // (a wobble as she tries to get up, again and again)
  const w = Math.sin(s * 2.3) * 0.5 + 0.5; c.spine += 0.06 * w; c.neck += 0.1 * Math.sin(s * 1.7);
  const fall = fzPose(); fall.hipY = 0.75; fall.lHip = [-0.5, 0.1]; fall.rHip = [0.2, 0.1]; fall.lKnee = 0.6; fall.rKnee = 0.9; fall.spine = 0.6; fall.lSh = [1.6, 0.6]; fall.rSh = [1.6, 0.6];
  return k < 0.5 ? fzLerpPose(p, fall, k * 2) : fzLerpPose(fall, c, (k - 0.5) * 2);
}
// a body sliding with the hill tumbles when friction returns (the way it was going): a roll angle and a hop
function fzTumble(s, v10, dur = 0.8) {
  if (s <= FZP.tBack || v10 < 0.5) return { a: 0, hop: 0 };
  const u = MathX.clamp((s - FZP.tBack) / dur, 0, 1), e = 1 - (1 - u) * (1 - u);
  return { a: e * Math.PI * Math.min(1.6, v10 / 3.5), hop: 0.35 * Math.sin(u * Math.PI) };
}

function fzBuildCast(S, H, T) {
  const scene = S.scene, C = {};
  const mk = (id, look) => new Person({ id, look }, scene);
  C.you = mk('fzYou', 'fzYou');
  // (your phone in your hand, in the third-person shots; the real one is home.js's)
  C.walker = mk('fzWalker', 'fzWalker');
  C.lace = mk('fzLace', 'fzLace');
  C.cleaner = mk('fzCleaner', 'fzCleaner');
  C.rider = mk('fzRider', 'fzRider');
  // the rider sits on the bike (child of the bike's lean group)
  T.bikeLean.add(C.rider.root);
  // the driver: a silhouette in the braking car
  { const pm = fzStd('#2a2420', 0.9); const d = new THREE.Group(); T.car.body.add(d); d.position.set(0.1, 0, -0.38);
    fzMesh(new THREE.SphereGeometry(0.11, 10, 8), pm, 0, 1.18, 0, d); fzBox(0.3, 0.45, 0.42, pm, -0.05, 0.85, 0, d); C.driver = d; }
  // the lead: a thin line from the walker's hand to the dog's collar
  C.lead = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: '#c8402a' }));
  scene.add(C.lead);
  // the cat (a brown tabby) and the dog (a white and tan terrier: the cat's rig, bigger, with a muzzle and floppy ears)
  C.catG = new THREE.Group(); scene.add(C.catG); C.cat = fzBuildCat(C.catG);
  C.dogG = new THREE.Group(); scene.add(C.dogG); C.dog = fzBuildCat(C.dogG, { seed: 17, dog: true, cols: { base: [214, 196, 168], dark: [150, 96, 52], belly: [240, 236, 228] } });
  C.dog.g.scale.setScalar(1.85);
  C.blobs = new BlobShadows(scene, 24);
  C.update = (s, o) => fzCastUpdate(C, s, o || {});
  C._v = new THREE.Vector3();
  return C;
}

// the cat's pose from fzCat(s).mode
FZ_CAT_POSES.splay = { py: 0.1, pz: -0.11, pp: -0.05, cp: -0.05, np: -0.6, ny: 0, hp: 0.35, hy: 0, hr: 0,
  fl: [0.011, 0.27], fr: [0.011, 0.25], bl: [0.011, -0.22], br: [0.011, -0.2], bm: -0.15, tb: -0.5, tc: -0.2, ts: 0.05, tw: 0.9, ear: 1, blink: 0 };
FZ_CAT_POSES.drop = { py: 0.2, pz: -0.13, pp: 0.1, cp: -0.1, np: -0.5, ny: 0, hp: 0.2, hy: 0, hr: 0,
  fl: [-0.06, 0.2], fr: [-0.05, 0.19], bl: [-0.06, -0.12], br: [-0.05, -0.11], bm: -0.4, tb: 0.4, tc: -0.3, ts: 0.05, tw: 0.9, ear: 1, blink: 0 };
function fzCatPose(c, s) {
  const P = FZ_CAT_POSES;
  switch (c.mode) {
    case 'crouch': return fzCatBlend(P.stand, P.crouch, fzEase(c.u, 0, 1));
    case 'leap': return c.u < 0.5 ? fzCatBlend(P.crouch, P.leap, fzEase(c.u, 0, 0.3)) : fzCatBlend(P.leap, P.drop, fzEase(c.u, 0.6, 1));
    case 'skid': return fzCatBlend(P.drop, P.splay, fzEase(c.u, 0, 0.25));
    case 'drop': return fzCatBlend(P.splay, P.drop, fzEase(c.u, 0, 0.5));
    case 'splay': return P.splay;
    case 'run': { const k = fzEase(c.u, 0, 0.35), G = fzCatGallop(c.u * 3.1, 1); G.ear = 1; G.py -= 0.02; G.cp += 0.08; return fzCatBlend(P.splay, G, k); }
    case 'launch': { const G = fzCatGallop((s - FZ_CAT.run) * 3.1, 1); G.pp -= 0.2; G.ear = 1; return G; }
    case 'sitUp': return fzCatBlend(P.stand, P.sit, fzEase(c.u, 0.7, 1.6));
  }
  return P.stand;
}

function fzCastUpdate(C, s, o) {
  const v = C._v;
  C.blobs.begin();
  // ---- you
  { const Y = fzYouPose(s), p = C.you;
    p.root.position.set(FZ_YOU.x, 0, FZ_YOU.z + Y.dz); p.root.rotation.set(0, Math.PI, 0);
    p.apply(Y.p); p.root.visible = !o.pov; p.root.updateMatrixWorld(true); }
  // ---- the cat
  { const c = fzCat(s), P = fzCatPose(c, s);
    // (in the leap and on the island top, y is the surface she's on; the run drifts her with the floor)
    C.catG.position.set(c.x, c.y, c.z); C.catG.rotation.set(0, c.yaw, 0);
    if (c.mode === 'skid' || c.mode === 'splay') C.catG.rotation.z = 0.15 * Math.sin(s * 23);
    C.cat.pose(P, s); }
  // ---- the walker and the dog
  { const r = fzPerson(FZ_WALKER.x0, FZ_WALKER.v0, s), p = C.walker, y = fzPavY(r.x);
    p.root.position.set(r.x, y, FZ_WALKER.z); p.root.rotation.set(0, -Math.PI / 2, 0);    // (facing −x, uphill)
    p.apply(fzWalkerPose(s, r.x));
    const v10 = fzPerson(FZ_WALKER.x0, FZ_WALKER.v0, FZP.tBack).v, tb = fzTumble(s, v10, 0.9);
    if (tb.a) { p.root.position.y += tb.hop; p.root.rotateZ(-tb.a * 0.6); p.root.rotateX(-tb.a * 0.4); }
    p.root.rotateZ(-fzSlopeA * 0); p.root.updateMatrixWorld(true);
    // the dog: in front of her (uphill), on its lead; walking, then running on the spot (it slides with her); at 10 s
    // its paws grip and it bolts uphill to the end of the lead
    const D = FZ_DOG, dx = s > FZ_WALKER.slip ? D.dx + 0.35 * fzEase(s, FZ_WALKER.slip, 1.2) : D.dx;
    const bolt = s > FZP.tBack ? Math.min(0.9, 2.2 * (s - FZP.tBack)) : 0;
    const gx = r.x + dx - bolt, gz = FZ_WALKER.z + D.dz;
    C.dogG.position.set(gx, fzPavY(gx), gz); C.dogG.rotation.set(0, -Math.PI / 2, -fzSlopeA);
    const walking = s < FZ_WALKER.slip + 0.1, ph = walking ? (r.x / -0.9) : s * 3.6;
    const G = fzCatGallop(ph, walking ? 0.5 : 1); if (!walking) G.ear = 0.6;
    C.dog.pose(G, s);
    // the lead: her right hand → the dog's neck
    p.handWorld(-1, v); const a = v.clone(); C.dog.head.getWorldPosition(v); v.y -= 0.08;
    const pos = C.lead.geometry.attributes.position; pos.setXYZ(0, a.x, a.y, a.z); pos.setXYZ(1, v.x, v.y, v.z); pos.needsUpdate = true; C.lead.geometry.computeBoundingSphere(); }
  // ---- the man tying his laces at the bus stop: crouched; he slides crouched; sits down hard at 1.6; tumbles at 10
  { const r = fzPerson(FZ_LACE.x0, 0, s, 0.008), p = C.lace, y = fzPavY(r.x);
    p.root.position.set(r.x, y, FZ_LACE.z); p.root.rotation.set(0, 0.1, 0);              // (facing the road, +z)
    const k = fzPose(); k.hipY = 0.5; k.lHip = [1.6, 0.12]; k.rHip = [0.4, 0.12]; k.lKnee = 2.2; k.rKnee = 1.6; k.lFoot = 0.5; k.rFoot = 0.6;
    k.spine = 0.65; k.neck = 0.55; k.lSh = [1.25, -0.15]; k.lEl = 0.9; k.rSh = [1.2, 0.1]; k.rEl = 0.95;
    const sitP = fzPose(); sitP.hipY = 0.13; sitP.pelvisPitch = -0.3; sitP.lHip = [1.6, 0.25]; sitP.rHip = [1.3, 0.2]; sitP.lKnee = 1.2; sitP.rKnee = 0.6; sitP.spine = 0.15; sitP.neck = 0.3;
    sitP.lSh = [-0.4, 0.5]; sitP.rSh = [-0.4, 0.5]; sitP.lEl = 0.2; sitP.rEl = 0.2;
    // (his fingers work at the bow until it falls apart in them, then he looks up)
    const work = Math.sin(s * 9) * 0.06 * (s < 1.2 ? 1 : 0); k.lEl += work; k.rEl -= work;
    if (s > 0.8) { k.neck = 0.55 - 0.6 * fzEase(s, 0.8, 1.2); k.lSh = [0.9, 0.7]; k.rSh = [0.9, 0.7]; k.lEl = 0.4; k.rEl = 0.4; }
    const q = fzLerpPose(k, sitP, fzEase(s, 1.5, 1.9));
    if (s > 1.9) { q.lSh = [0.2 + 0.4 * Math.sin(s * 1.3), 0.9]; q.rSh = [0.3 + 0.4 * Math.sin(s * 1.1 + 1), 0.9]; q.headYaw = 0.5 * Math.sin(s * 0.6); }
    p.apply(q);
    const v10 = fzPerson(FZ_LACE.x0, 0, FZP.tBack, 0.008).v, tb = fzTumble(s, v10, 0.8);
    if (tb.a) { p.root.position.y += tb.hop; p.root.rotateX(tb.a * 0.5); p.root.rotateZ(-tb.a * 0.7); }
    p.root.updateMatrixWorld(true); }
  // ---- the window cleaner: on his ladder (1.55 m up), rides it down, lands on the pavement beside it, slides
  { const L = fzLadder(s), D = FZ_LADDER, p = C.cleaner, th = L.th;
    const along = D.man + 0.2, lx = L.x, ly = fzPavY(lx) + 0.02 + Math.sin(th) * along, lz = L.footZ - Math.cos(th) * along;
    const k = fzEase(s, 0.65, D.flat);
    const climb = fzPose(); climb.lSh = [2.4, 0.15]; climb.rSh = [2.0, 0.2]; climb.lEl = 0.4; climb.rEl = 0.6; climb.lHip = [0.35, 0.05]; climb.rHip = [0, 0.05]; climb.lKnee = 0.6; climb.spine = 0.05; climb.neck = -0.25;
    const fl = fzPose(); fl.lSh = [2.8, 0.9]; fl.rSh = [2.6, 0.9]; fl.lEl = 0.3; fl.rEl = 0.3; fl.lHip = [0.8, 0.2]; fl.rHip = [0.3, 0.2]; fl.lKnee = 0.9; fl.rKnee = 0.5; fl.spine = -0.2; fl.neck = 0.4;
    const lie = ACTIONS.lie(0, { seed: 0.3, seedI: 3 }); lie.rootRoll = 0; lie.pelvisPitch = -1.5; lie.hipY = 0.14; lie.spine = 0.1; lie.neck = 0.3; lie.lSh = [0.4, 1.1]; lie.rSh = [0.5, 1.0];
    let q = s < 0.2 ? climb : (k < 1 ? fzLerpPose(climb, fl, fzEase(s, 0.2, 0.6)) : fl);
    if (s > D.flat - 0.15) q = fzLerpPose(q, lie, fzEase(s, D.flat - 0.15, D.flat + 0.25));
    p.apply(q);
    // (body tilted with the ladder: facing the wall (−z), leaning back as the ladder falls; then flat on his back)
    const yy = s < D.flat ? ly - 1.0 * Math.sin(th) * 0.0 - 0.95 : fzPavY(lx) + 0.02;
    if (s < D.flat) { p.root.position.set(lx, Math.max(fzPavY(lx), ly - 0.95), lz + 0.12); p.root.rotation.set(-(Math.PI / 2 - th) * 0.9, Math.PI, 0); }
    else { p.root.position.set(lx + 0.3, fzPavY(lx + 0.3) + 0.02, L.footZ - 1.6); p.root.rotation.set(0, Math.PI, 0); }
    const v10 = fzPerson(D.x, 0, FZP.tBack - 0.1, 0.004).v, tb = fzTumble(s, v10, 0.8);
    if (tb.a) { p.root.position.y += tb.hop; p.root.rotateZ(-tb.a * 0.5); }
    p.root.updateMatrixWorld(true); }
  // ---- the cyclist (riding; leans over with the bike; at 10 s he's thrown)
  { const p = C.rider, R = ACTIONS.ride(0, { seed: 0.2, seedI: 2 }), b = fzBike(s);
    const pedal = s < 0 ? (FZ_BIKE.x0 + FZ_BIKE.v0 * s) * 1.2 : FZ_BIKE.x0 * 1.2 + s * 2.0 * Math.exp(-s * 1.5);
    R.lHip = [1.2 + 0.35 * Math.sin(pedal), 0.18]; R.rHip = [1.2 - 0.35 * Math.sin(pedal), 0.18]; R.lKnee = 1.4 + 0.3 * Math.cos(pedal); R.rKnee = 1.4 - 0.3 * Math.cos(pedal);
    const fall = fzEase(s, 0.6, 1.3); if (fall > 0) { R.lSh = [1.25 + 0.9 * fall, 0.22 + 0.6 * fall]; R.neck = -0.15 + 0.4 * fall; }
    p.apply(R); p.root.position.set(-0.12, 0.05, 0); p.root.rotation.set(0, Math.PI / 2, 0);
    const tb = fzTumble(s, b.v, 0.9); if (tb.a) { p.root.position.y += tb.hop; p.root.position.x += 0.6 * tb.a / Math.PI; p.root.rotateX(tb.a * 0.8); }
    p.root.updateMatrixWorld(true); }
  // contact shadows under the street people (cheap soft blobs)
  for (const p of [C.walker, C.lace, C.cleaner]) {
    for (const [part, r] of [['hips', 0.42], ['neck', 0.34]]) { const w = p.worldOf(part, v), gy = fzPavY(w.x), k = MathX.clamp(1 - (w.y - gy) / 1.4, 0, 1); if (k > 0.02) C.blobs.push(w.x, gy + 0.02, w.z, r * (1.4 - k * 0.5), 0.45 * k); }
  }
  C.blobs.end();
}
