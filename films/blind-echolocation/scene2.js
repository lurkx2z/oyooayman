/* =====================================================================
   SCENE 2 — "A world without light" (the bedroom, reality again; then the movie myth, the sparse map, the wall tap).
     B1  kneeling at the dresser, her hand sweeps the floor underneath and finds the phone; the alarm stops
     B2  "Finding your clothes": her hands read the sweater on the chair
     B3  "Pouring water": a finger hooked over the glass's rim; the water rises until it touches it
     B4  "Reaching for a door handle": her palm slides over the door and finds the lever
     B5  "…require attention": her face, close, listening (small head turns toward sounds)
     B6  "…what movies suggest…": THE MOVIE VERSION (a perfect neon map of the room) — and on "superhuman" it fails
     B7  "…information that was always there": darkness, and only the sounds the room already makes (sparse)
     B8  she walks along the wall, fingertips trailing it; her knuckles knock it by accident (★ the tap); she stops
   ===================================================================== */

BE.grab = BE.s2 + 3.05;                         // her fingers close on the phone under the dresser
BE.silence = BE.s2 + 3.4;                       // the alarm stops (beAlarmEnd)
BE.walk = [BE.one + 0.25, BE.tap - 0.32];       // the walk along the south wall
BE.trailX = [-0.55, 0.92];

// ---- props for this scene (built once on the apartment)
function beScene2Props(set) {
  const R = set.root, A = BE_APT;
  // water in the dresser's glass (a lathe that scales in height) and the stream from the carafe
  const wM = new THREE.MeshStandardMaterial({ color: '#8fbfe8', roughness: 0.04, transparent: true, opacity: 0.62, name: 'beWaterGlass', depthWrite: false, envMapIntensity: 1.5 });
  set.water = gbAdd(set.glass, gbLathe([[0, 0], [0.03, 0], [0.0335, 0.1], [0, 0.1]], 20), wM, 0, 0.004, 0, { cast: false });
  set.water.scale.set(0.98, 0.001, 0.98);
  set.stream = gbAdd(R, new THREE.CylinderGeometry(0.0035, 0.005, 1, 8), wM, 0, 0, 0, { cast: false }); set.stream.visible = false;
  set.carafe0 = { p: set.carafe.position.clone(), r: set.carafe.rotation.clone() };
  void A;
}

// the hero through scene 2 (a montage: each shot places her where its task is)
function beHeroS2(H, t, set, C) {
  const A = BE_APT, B = BE, P0 = new THREE.Vector3();
  H.root.visible = true;
  H.J.hd.visible = true; for (const s of ['L', 'R']) H.J[s + 'Hip'].visible = true;
  const sh = beShotAt(t).id;
  let P, F = Object.assign({}, GB_FACES.listen), look = { x: 0, y: -0.25 };
  const breath = 1.4 * Math.sin(t * 2 * Math.PI * 0.25);
  if (sh === 'B1') {
    // kneeling at the dresser, right hand under it
    H.place(-0.98, 0, -0.6, -Math.PI / 2);
    P = Object.assign({}, GB_POSES.kneelReach); P.chX -= breath * 0.6;
    P.hdY = -18 + 10 * Math.sin(t * 0.7); P.hdZ = 10;      // the ear toward the buzz, low
    H.applyPose(P);
    // the hand sweeps across the floor under the dresser (searching), finds the phone, lifts it out
    const rest = C.phoneAt(BE.slide[1] + 1).P;
    const sweep = new THREE.Vector3(-1.98, 0.035, -0.62 + 0.28 * Math.sin((t - B.s2) * 2.6) * (1 - MathX.smooth(t, B.grab - 0.6, B.grab)));
    const out = new THREE.Vector3(-1.45, 0.42, -0.5);
    let wt = sweep.clone().lerp(rest.clone().add(new THREE.Vector3(0.05, 0.03, 0)), MathX.smooth(t, B.grab - 0.6, B.grab));
    wt.lerp(out, MathX.smooth(t, B.grab + 0.3, B.grab + 1.1));
    H.solveArm('R', wt, new THREE.Vector3(0.2, -0.3, -1).normalize(), 1);
    H.orientHand('R', new THREE.Vector3(-1, -0.1, 0).normalize(), new THREE.Vector3(0, -1, 0), 1);
    H.solveArm('L', new THREE.Vector3(-1.62, 0.02, -0.25), new THREE.Vector3(0.3, -1, 0.5).normalize(), 0.9);   // braced on the floor
    F = gbEvalTrack([[0, 'focus', 0.01], [B.grab, 'calm', 0.5]], GB_FACES, t);
    // the phone: in her hand once found
    if (t > B.grab) { const hp = H.worldOf('RHand'); C.phone.position.copy(hp).add(new THREE.Vector3(-0.02, -0.02, 0)); C.phone.rotation.set(-0.3, 1.4, 0.2); }
  } else if (sh === 'B2') {
    // at the chair: both hands read the sweater folded over the back
    const ch = set.chairG; ch.updateMatrixWorld(true);
    const base = ch.localToWorld(new THREE.Vector3(0, 0, -0.75)), yaw = ch.rotation.y;
    H.place(base.x, 0, base.z, yaw);
    P = Object.assign({}, GB_POSES.standListen, { spX: 14, chX: 8, nkX: 8, hdX: 14, hdZ: -6 }); P.chX -= breath;
    H.applyPose(P);
    const sw = (lx, ly) => ch.localToWorld(new THREE.Vector3(lx, ly, -0.24));
    const k = (t - B.clothes);
    H.solveArm('R', sw(-0.12 + 0.05 * Math.sin(k * 3.1), 0.97 + 0.02 * Math.sin(k * 7)), new THREE.Vector3(0, -1, 0.3), 1);
    H.solveArm('L', sw(0.13 - 0.07 * MathX.smooth(t, B.clothes + 0.5, B.clothes + 1.1), 0.95 + 0.015 * Math.sin(k * 5 + 1)), new THREE.Vector3(0, -1, 0.3), 1);
    const dn = ch.localToWorld(new THREE.Vector3(0, -1, 0)).sub(ch.localToWorld(new THREE.Vector3(0, 0, 0)));
    const fw = ch.localToWorld(new THREE.Vector3(0, 0, 1)).sub(ch.localToWorld(new THREE.Vector3(0, 0, 0)));
    H.orientHand('R', fw, dn, 1); H.orientHand('L', fw, dn, 1);
    look = { x: 0.3, y: -0.1 };
  } else if (sh === 'B3') {
    // at the dresser: left index finger hooked over the glass's rim, the right hand pours from the carafe
    H.place(-1.5, 0, -0.38, -Math.PI / 2);
    P = Object.assign({}, GB_POSES.standListen, { spX: 10, chX: 6, hdX: 10, hdY: 12 }); H.applyPose(P);
    const g = set.glass.position, rim = new THREE.Vector3(g.x + 0.035, g.y + 0.1, g.z + 0.005);
    H.solveArm('L', rim.clone().add(new THREE.Vector3(0.055, 0.03, 0.03)), new THREE.Vector3(0, -1, 0.6).normalize(), 1);
    H.orientHand('L', new THREE.Vector3(-1, -0.6, 0).normalize(), new THREE.Vector3(0, -0.4, 1).normalize(), 1);
    H.handL.fingers.forEach(([f1, f2], i) => { const c = i === 0 ? 0.55 : 1.0; f1.rotation.z = -H.handL.pn * c * 1.2; f2.rotation.z = -H.handL.pn * c * 1.1; });
    const spout = new THREE.Vector3(g.x + 0.01, g.y + 0.27, g.z - 0.02);
    H.solveArm('R', spout.clone().add(new THREE.Vector3(0.12, 0.04, -0.08)), new THREE.Vector3(0.3, -1, -0.5).normalize(), 1);
    look = { x: 0, y: -0.4 };
  } else if (sh === 'B4') {
    // at the door: the palm slides over the leaf, finds the lever
    H.place(-1.18, 0, 1.62, 0);
    P = Object.assign({}, GB_POSES.standListen, { spX: 4, hdY: -16, hdZ: 6 }); P.chX -= breath; H.applyPose(P);
    const u = MathX.smooth(t, B.handle + 0.1, B.handle + 1.2);
    const wt = new THREE.Vector3(MathX.lerp(-1.2, -1.47, u), MathX.lerp(1.32, 1.06, Ease.inOutSine(u)), 2.04);
    H.solveArm('R', wt, new THREE.Vector3(-0.3, -1, -0.4).normalize(), 1);
    H.orientHand('R', new THREE.Vector3(-0.3, 0.9, 0).normalize(), new THREE.Vector3(0, 0, 1), 1);
    const grip = MathX.smooth(t, B.handle + 1.15, B.handle + 1.5);
    H.handR.fingers.forEach(([f1, f2]) => { f1.rotation.z = -H.handR.pn * (0.15 + 0.9 * grip); f2.rotation.z = -H.handR.pn * (0.1 + 0.9 * grip); });
    look = { x: -0.2, y: -0.2 };
  } else if (sh === 'B8' || sh === 'B8b') {
    // walking along the south wall (eastward), right fingertips trailing it; the tap; she stops and turns her ear to it
    const plan = beScene2Props._plan || (beScene2Props._plan = gbWalkPlan((u) => new THREE.Vector3(MathX.lerp(BE.trailX[0], BE.trailX[1], u), 0, 1.66), () => 0, BE.walk[0], BE.walk[1], 0.34, { first: 'L', lat: 0.09, ease: Ease.inOutSine }));
    const s = plan.sOfT(t), pos = plan.atS(s).p;
    H.place(pos.x, 0, pos.z, Math.PI / 2);
    const walking = MathX.window(t, BE.walk[0], BE.walk[1], 0.4, 0.4);
    P = gbEvalTrack([[0, 'trail', 0.01], [B.tap + 0.25, 'standListen', 0.8]], GB_POSES, t);
    const ph = (t - BE.walk[0]) * Math.PI / 0.85;
    P.LShX = (P.LShX || 0) + 7 * walking * Math.sin(ph); P.pelZ = (P.pelZ || 0) + 2 * walking * Math.sin(ph);
    P.chX -= breath * 0.6;
    const turn = MathX.smooth(t, B.tap + 0.15, B.tap + 0.9);
    P.hdY = (P.hdY || 0) - 6 * (1 - turn) - 32 * turn; P.hdZ = (P.hdZ || 0) + 9 * turn; P.nkY = -10 * turn;
    gbStandOn(H, P, gbFeetAt(plan, t, 0.05), { bend: 0.04 });
    H.applyPose(P);
    // the right hand: fingertips on the wall a little ahead of her shoulder; the knuckle tap; it rests flat on the wall
    const hx = H.worldOf('RSh').x + 0.22;
    let wt = new THREE.Vector3(hx, 1.18 + 0.02 * Math.sin(t * 1.7), 2.03);
    const tapK = MathX.window(t, B.tap - 0.14, B.tap + 0.05, 0.14, 0.12);
    wt.z -= 0.035 * (1 - tapK) * MathX.window(t, B.tap - 0.6, B.tap + 0.3, 0.4, 0.2);    // the hand lifts a little off…
    wt.z += 0.01 * tapK;                                                                     // …and knocks
    if (t > B.tap) wt.x = Math.min(wt.x, 1.15);
    H.solveArm('R', wt, new THREE.Vector3(0.2, -1, -0.3).normalize(), 1);
    const knock = MathX.window(t, B.tap - 0.6, B.tap + 0.4, 0.3, 0.3);
    H.orientHand('R', new THREE.Vector3(1, 0.15 + 0.5 * knock, 0).normalize(), new THREE.Vector3(0, 0, 1), 1);
    H.handR.fingers.forEach(([f1, f2]) => { f1.rotation.z = -H.handR.pn * (0.12 + 1.0 * knock); f2.rotation.z = -H.handR.pn * (0.1 + 1.1 * knock); });
    F = gbEvalTrack([[0, 'listen', 0.01], [B.tap + 0.05, 'alarmed', 0.25], [B.tap + 0.9, 'focus', 0.9]], GB_FACES, t);
    look = { x: 0.6 * turn, y: -0.2 };
  } else {
    // B5–B7: standing in the middle of the room, listening (B7 faces the clock wall)
    const yaw = sh === 'B7' ? 0 : Math.PI / 2 - 0.25;
    H.place(0.4, 0, 0.92, yaw);
    P = Object.assign({}, GB_POSES.standListen);
    // small head turns toward sounds: the clock, the window, the hall
    P.hdY = 18 * Math.sin((t - B.attn) * 0.55) * (sh === 'B5' ? 1 : 0.5) - (sh === 'B5' ? 6 : 0); P.hdZ = 6 + 4 * Math.sin(t * 0.4);
    P.chX -= breath; P.LShrug = breath * 0.002; P.RShrug = breath * 0.002;
    gbStandOn(H, P, { L: { p: H.root.localToWorld(new THREE.Vector3(0.1, 0, 0.02)), swing: 0 }, R: { p: H.root.localToWorld(new THREE.Vector3(-0.1, 0, -0.03)), swing: 0 } }, { bend: 0.03 });
    H.applyPose(P);
    F = gbEvalTrack([[0, 'listen', 0.01], [B.attn + 1.8, 'focus', 1.0], [B.movies, 'listen', 1.0]], GB_FACES, t);
    look = { x: -0.1, y: -0.3 };
  }
  F.blink = [B.s2 + 2.2, B.attn + 1.2, B.attn + 4.3, B.learn + 1.5, B.one + 2.0, B.tap + 1.7].reduce((m, b) => Math.max(m, MathX.window(t, b, b + 0.16, 0.06, 0.08)), 0);
  H.applyFace(F, look);
  void P0; void A;
}

// the scene's props per frame (the pour)
function beProps2(set, t) {
  const B = BE, on = t >= B.water - 0.3 && t < B.handle + 0.2;
  const lvl = MathX.smooth(t, B.water + 0.15, B.water + 1.05) * 0.84 + 0.04;
  set.water.scale.y = t < B.water ? 0.001 : lvl; set.water.visible = t >= B.water - 0.3;
  if (on) {
    const g = set.glass.position;
    set.carafe.position.set(g.x + 0.07, g.y + 0.17, g.z - 0.1); set.carafe.rotation.set(0.55, 0, 1.15);
    const top = g.y + 0.27, bot = g.y + 0.004 + 0.1 * lvl;
    set.stream.visible = t > B.water + 0.1 && t < B.water + 1.0;
    set.stream.position.set(g.x + 0.005, (top + bot) / 2, g.z - 0.012); set.stream.scale.set(1, top - bot, 1);
  } else {
    set.carafe.position.copy(set.carafe0.p); set.carafe.rotation.copy(set.carafe0.r); set.stream.visible = false;
  }
}

// ---- the shots
(function () {
  const V = (x, y, z) => new THREE.Vector3(x, y, z), B = BE;
  const head = () => FILM._app.sets.apt.hero.worldOf('hd').add(V(0, 0.08, 0));
  const S = [
    { id: 'B1', t0: B.s2, t1: B.clothes, set: 'apt', look: () => BE_REAL,
      cam: beMove(B.s2, B.clothes, [V(-1.05, 0.7, 0.95), V(-1.6, 0.3, -0.62), 48], [V(-1.15, 0.6, 0.7), V(-1.7, 0.22, -0.62), 42], { dof: 0.6 }) },
    { id: 'B2', t0: B.clothes, t1: B.water, set: 'apt', look: () => BE_REAL,
      cam: (t) => { const ch = FILM._app.sets.apt.chairG; ch.updateMatrixWorld(true); const at = ch.localToWorld(V(0, 0.92, -0.2)), k = MathX.ramp(t, B.clothes, B.water); return { pos: ch.localToWorld(V(-0.95 + 0.08 * k, 1.36, -1.0)), at, fov: 38, focus: 0.75, dof: 0.9 }; } },
    { id: 'B3', t0: B.water, t1: B.handle, set: 'apt', look: () => BE_REAL,
      cam: (t) => { const g = FILM._app.sets.apt.glass.position, k = MathX.ramp(t, B.water, B.handle); return { pos: V(g.x + 0.26, g.y + 0.14 - 0.03 * k, g.z + 0.5 - 0.05 * k), at: V(g.x, g.y + 0.08, g.z), fov: 32, focus: 0.55, dof: 1.2 }; } },
    { id: 'B4', t0: B.handle, t1: B.attn, set: 'apt', look: () => BE_REAL,
      cam: beMove(B.handle, B.attn, [V(-2.08, 1.3, 1.25), V(-1.38, 1.12, 2.05), 40], [V(-2.0, 1.22, 1.38), V(-1.45, 1.06, 2.05), 35], { dof: 0.8 }) },
    { id: 'B5', t0: B.attn, t1: B.movies - 0.05, set: 'apt', look: () => BE_REAL,
      cam: (t) => { const h = head(), k = Ease.inOutSine(MathX.ramp(t, B.attn, B.movies)); return { pos: V(h.x + 0.95 - 0.25 * k, h.y + 0.02, h.z - 0.62 + 0.15 * k), at: h, fov: 30, focus: 1.0, dof: 0.9 }; } },
    // the movie version: the camera circles her while the perfect neon map builds, then fails on "superhuman"
    { id: 'B6', t0: B.movies - 0.05, t1: B.learn, set: 'apt', movie: true, decay: 60, heroGain: 1.2,
      // …and on "superhuman" the fantasy flickers and dies
      gainAt: (t) => 1.25 * (t < B.superN ? 1 : Math.max(0, 1 - (t - B.superN) / 0.7) * (0.55 + 0.45 * Math.sign(Math.sin((t - B.superN) * 70)))),
      look: (t) => { const k = 1 - MathX.smooth(t, B.superN, B.superN + 0.4); return { ac: MathX.smooth(t, B.movies - 0.05, B.movies + 0.25), world: 0.04 * k, hero: 0.05 * k, glow: 0.05 * k }; },
      cam: (t) => { const a = 2.2 + 0.55 * Ease.inOutSine(MathX.ramp(t, B.movies, B.learn)), r = 2.0; return { pos: V(0.4 + Math.sin(a) * r, 1.65 - 0.15 * MathX.ramp(t, B.movies, B.learn), 0.92 + Math.cos(a) * r), at: V(0.2, 1.05, 0.5), fov: 56, focus: 2, dof: 0 }; } },
    // the sparse map: darkness; only the room's own sounds, from behind her
    { id: 'B7', t0: B.learn, t1: B.one, set: 'apt', decay: 0.6, gain: 1.3,
      look: (t) => ({ ac: 1, world: 0, hero: 0.06 * MathX.smooth(t, B.learn, B.learn + 1), glow: 0 }),
      cam: beMove(B.learn, B.one, [V(-0.45, 1.72, -0.15), V(0.75, 1.5, 2.1), 56], [V(-0.35, 1.7, 0.1), V(0.8, 1.52, 2.1), 52], { dof: 0 }) },
    // the walk along the wall (reality), tracking; then close on her hand and face for the tap and the reaction
    { id: 'B8', t0: B.one, t1: B.tap - 0.7, set: 'apt', look: () => BE_REAL,
      cam: (t) => { const x = MathX.lerp(-0.85, 0.55, Ease.inOutSine(MathX.ramp(t, B.one, B.tap - 0.7))); return { pos: V(x, 1.35, 0.05), at: V(x + 0.75, 1.15, 1.75), fov: 46, focus: 1.8, dof: 0.5 }; } },
    { id: 'B8b', t0: B.tap - 0.7, t1: B.s3, set: 'apt', tag: true, decay: 0.5,
      look: (t) => { const k = MathX.window(t, B.tap - 0.02, B.tap + 2.2, 0.08, 1.1); return { ac: k, world: MathX.lerp(1, 0.18, k), hero: MathX.lerp(1, 0.45, k), glow: MathX.lerp(1, 0.2, k) }; },
      cam: (t) => { const k = Ease.inOutSine(MathX.ramp(t, B.tap - 0.7, B.s3)); return { pos: V(1.72 - 0.1 * k, 1.5, 1.02 + 0.12 * k), at: V(1.0, 1.38, 1.86), fov: 44 - 4 * k, focus: 1.0, dof: 0.9 }; } },
  ];
  const i = BE_SHOTS.findIndex((s) => s.id === 'B1');
  BE_SHOTS.splice(i, 1, ...S);
  BE_SHOTS.push({ id: 'X', t0: B.s3, t1: 1e9, set: 'apt', look: () => BE_REAL, cam: beMove(B.s3, B.s3 + 10, [V(1.6, 1.55, 1.7), V(-0.6, 0.7, -1.2), 50], [V(1.3, 1.45, 1.5), V(-0.7, 0.7, -1.3), 46]) });
})();

// ---- the scene's sound-carrying pulses (picture side; the audio uses the same beats)
function beSchedule2(app) {
  const P = app.pulses, B = BE, set = app.sets.apt;
  // B6: the movie version: one impossible, total sweep from her (and a second for good measure): the full map stays
  P.add({ t: B.movies + 0.05, p: new THREE.Vector3(0.4, 1.5, 0.92), kind: 0, speed: 3.2, w: 0.12, life: B.superN - B.movies + 0.6, str: 1.5, set: 'apt', shot: 'B6' });
  P.add({ t: B.movies + 1.4, p: new THREE.Vector3(0.4, 0.2, 0.92), kind: 0, speed: 4.5, w: 0.08, life: B.superN - B.movies - 0.6, str: 0.7, set: 'apt', shot: 'B6' });
  // B7: the clock's ticks (amber, tiny), traffic beyond the window (violet), the hallway beyond the door (amber)
  set.clock.updateMatrixWorld(true);
  const ck = set.clock.getWorldPosition(new THREE.Vector3());
  for (let t = Math.ceil(B.learn); t < B.one + 0.5; t += 1) P.add({ t, p: ck.clone(), kind: 1, speed: 0.9, w: 0.03, life: 0.9, str: 0.8, set: 'apt', shot: 'B7' });
  for (let t = B.learn + 0.8; t < B.one; t += 0.4) P.add({ t, p: new THREE.Vector3(7.5, 0.6, -6 + 12 * MathX.ramp(t, B.learn, B.one)), kind: 2, speed: 9, w: 0.4, life: 1.2, str: 0.6, set: 'apt', shot: 'B7' });
  for (const t of [B.learn + 1.9, B.learn + 2.5]) P.add({ t, p: new THREE.Vector3(-1.2, 0.05, 2.9), kind: 1, speed: 2.4, w: 0.06, life: 1.0, str: 0.7, set: 'apt', shot: 'B7' });
  // ★ the tap: her knuckles on the plaster (a small, sharp click: the wall right beside her answers first)
  P.add({ t: B.tap, p: new THREE.Vector3(1.0, 1.2, 2.06), kind: 0, speed: 2.4, w: 0.05, life: 2.4, str: 1.3, set: 'apt', shot: 'B8b' });
  P.add({ t: B.tap, p: new THREE.Vector3(1.0, 1.2, 2.14), kind: 0, speed: 2.4, w: 0.04, life: 1.6, str: 0.5, set: 'apt', shot: 'B8b', echo: true });
  app._beB7 = { ck };
}

// the scene's rings (sources) per frame
function beRings2(app, set, t, shot) {
  const R = set.rings, RX = set.ringsX, B = BE;
  if (shot.id === 'B7') {
    const ck = app._beB7.ck;
    R.source(ck, beEvery(Math.ceil(B.learn), B.one + 0.5, 1).filter((x) => x <= t), t, { r: 0.12, a: 0.9, dur: 0.8, th: 0.06 });
    RX.source(new THREE.Vector3(2.6, 1.0, -0.6), beEvery(B.learn + 0.8, B.one, 0.4).filter((x) => x <= t), t, { r: 0.6, a: 0.4, col: '#9a7cff', dur: 1.2, th: 0.05 });
    RX.source(new THREE.Vector3(-1.17, 0.1, 2.15), [B.learn + 1.9, B.learn + 2.5].filter((x) => x <= t), t, { r: 0.3, a: 0.6, dur: 1.0, squash: 0.5 });
  }
  if (shot.id === 'B8b') R.source(new THREE.Vector3(1.0, 1.2, 2.04), [B.tap], t, { r: 0.08, a: 0.9, dur: 0.6, col: '#9ff6ff', th: 0.08 });
}
