/* =====================================================================
   SCENE 3 — "The first echo" (the hallway; she now wears the ochre cardigan from the chair).
     C1  "Listen.": her face, close, in the hall; she makes one tongue click
     C2  "…part of it travels outward": THE SAME CLICK, slowed ≈ 1000× (a live readout shows the real time in ms):
         the front leaves her mouth, sweeps the walls of the narrow hall
     C3  "…some of their energy reflects back toward you": the reflected fronts (image sources) return over her
     C4  "A wall. A doorway. A large piece of furniture.": three clicks, three answers (strong / none / scattered)
     C5  "Each changes the sound in a different way.": SCIENCE: the three echo signatures as traces (0–20 ms)
     C6  "…echoes can become clues…": she walks down the hall clicking; each click returns a little of the space
     C7  "There's a name for this. Echolocation." the word, over the hall
     C8  (no narration) from above: two clicks; the wave runs down the hall, into the open doorways, off the bookcase
   ===================================================================== */

BE.listen = bnF(3, 'listen').start;
BE.k1 = bnF(3, 'listen').end + 0.32;                  // ★ the click
BE.every = bnF(3, 'every').start - 0.15;               // C2
BE.when = bnF(3, 'when').start;
BE.encounter = bnF(3, 'encounter').start;
BE.reflects = bnF(3, 'reflects').start;
BE.awall = bnF(3, 'wall').start - 0.1;             // "A wall."
BE.adoor = bnF(3, 'doorway').start - 0.12;
BE.afurn = bnF(3, 'large').start - 0.12;
BE.each = bnF(3, 'each').start - 0.1;
BE.andif = bnF(3, 'recognize').start - 0.5;
BE.name = bnF(3, "there's").start - 0.2;
BE.echoW = bnF(3, 'echolocation').start;
BE.s3end = BN_CLIP[3].speechEnd;
BE.over = BE.s3end + 0.35;                              // C8, the plan view
BE.s4 = BN_SC[4].start;
BE.walk3 = [BE.andif + 0.2, BE.name + 0.4];
BE.clicks3 = [BE.andif + 0.45, BE.andif + 1.75, BE.andif + 3.05, BE.andif + 4.35];
BE.clicks8 = [BE.over + 0.4, BE.over + 2.3, BE.over + 4.2];
// the slowed clock of C2–C3: film time → real time after the click (s). 0.7 m to the side walls: they are reached
// after 2.0 ms and their echo is back at her ears after ≈ 4.1 ms (at 343 m/s)
const BE_C3CLOCK = new Track([[BE.every - 0.2, 0], [BE.every + 0.2, 0.00006], [BE.encounter, 0.00195], [BE.reflects - 0.3, 0.0022], [BE.awall - 0.25, 0.0042], [BE.awall, 0.0045]]);
const BE_HALL_POS = new THREE.Vector3(-1.17, 0, 2.95);

function beScene3Props(set) {
  const A = BE_APT, Hh = A.hall;
  set.hero2 = FILM._app.cast.heroIn(set.scene, 'noorC'); set.hero2.root.visible = false;
  // the hall's planes (image sources)
  set.hallWalls = [
    { p: new THREE.Vector3(0, 0, A.D + 0.12), n: new THREE.Vector3(0, 0, 1), refl: 0.75 },
    { p: new THREE.Vector3(0, 0, Hh.z1), n: new THREE.Vector3(0, 0, -1), refl: 0.75 },
    { p: new THREE.Vector3(Hh.x0, 0, 0), n: new THREE.Vector3(1, 0, 0), refl: 0.7 },
    { p: new THREE.Vector3(Hh.x1, 0, 0), n: new THREE.Vector3(-1, 0, 0), refl: 0.7 },
  ];
}

function beMouth(H) {
  H.root.updateMatrixWorld(true);
  const hd = H.worldOf('hd'), f = new THREE.Vector3(0, 0, 1).applyQuaternion(H.J.hd.getWorldQuaternion(new THREE.Quaternion()));
  return hd.addScaledVector(f, 0.13).add(new THREE.Vector3(0, 0.055, 0));
}

// the hero in scene 3
function beHeroS3(H, t, set) {
  const B = BE, sh = beShotAt(t).id;
  H.root.visible = true;
  let P, F = Object.assign({}, GB_FACES.listen), look = { x: 0, y: -0.2 }, pos = BE_HALL_POS, yaw = Math.PI / 2;
  const breath = 1.3 * Math.sin(t * 2 * Math.PI * 0.24);
  const stand = (p, y) => { H.place(p.x, 0, p.z, y); };
  if (sh === 'C6' || sh === 'C7' || sh === 'C8') {
    const plan = beScene3Props._plan || (beScene3Props._plan = gbWalkPlan((u) => new THREE.Vector3(MathX.lerp(-1.17, 0.85, u), 0, 2.95), () => 0, B.walk3[0], B.walk3[1], 0.36, { first: 'R', lat: 0.09, ease: Ease.inOutSine }));
    const p = plan.atS(plan.sOfT(t)).p; stand(p, Math.PI / 2);
    P = Object.assign({}, GB_POSES.standListen, { hdY: 0, hdZ: 3 });
    const walking = MathX.window(t, B.walk3[0], B.walk3[1], 0.4, 0.4), ph = (t - B.walk3[0]) * Math.PI / 0.9;
    P.LShX = (P.LShX || 0) + 7 * walking * Math.sin(ph); P.RShX = (P.RShX || 0) - 7 * walking * Math.sin(ph);
    P.hdY = 10 * Math.sin((t - B.walk3[0]) * 0.8);
    P.chX -= breath;
    gbStandOn(H, P, gbFeetAt(plan, t, 0.05), { bend: 0.04 });
    H.applyPose(P);
  } else {
    if (sh === 'C4a') { pos = new THREE.Vector3(3.0, 0, 2.95); yaw = Math.PI; }
    else if (sh === 'C4b') { pos = new THREE.Vector3(4.25, 0, 2.62); yaw = 0; }
    else if (sh === 'C4c') { pos = new THREE.Vector3(1.85, 0, 2.55); yaw = 0; }
    stand(pos, yaw);
    P = Object.assign({}, GB_POSES.standListen, { hdY: sh === 'C1' ? -8 : 0, hdZ: 4 });
    P.chX -= breath; P.LShrug = breath * 0.002; P.RShrug = breath * 0.002;
    gbStandOn(H, P, { L: { p: H.root.localToWorld(new THREE.Vector3(0.1, 0, 0.02)), swing: 0 }, R: { p: H.root.localToWorld(new THREE.Vector3(-0.1, 0, -0.03)), swing: 0 } }, { bend: 0.03 });
    H.applyPose(P);
  }
  // the click: the tongue snaps down from the palate (lips a little apart)
  const clicks = [B.k1, B.awall + 0.05, B.adoor + 0.04, B.afurn + 0.04].concat(B.clicks3, B.clicks8);
  const cl = clicks.reduce((m, c) => Math.max(m, MathX.window(t, c - 0.12, c + 0.1, 0.08, 0.1)), 0);
  F.open = 0.12 * cl; F.width = 0.85;
  F.blink = [B.s3 + 0.9, B.every + 2.0, B.each + 1.2, B.walk3[0] + 2.4, B.over + 2.0].reduce((m, b) => Math.max(m, MathX.window(t, b, b + 0.16, 0.06, 0.08)), 0);
  H.applyFace(F, look);
}

// ---- the shots
(function () {
  const V = (x, y, z) => new THREE.Vector3(x, y, z), B = BE;
  const head = () => FILM._app.sets.apt.hero2.worldOf('hd').add(V(0, 0.06, 0));
  const hallDim = (k = 1) => ({ ac: 1, world: 0.0, hero: 0.16 * k, glow: 0.05 });
  const S = [
    { id: 'C1', t0: B.s3, t1: B.every, set: 'apt', look: () => BE_REAL,
      cam: (t) => { const h = head(), k = Ease.inOutSine(MathX.ramp(t, B.s3, B.every)); return { pos: V(h.x + 0.62 - 0.1 * k, h.y + 0.02, h.z - 0.42 + 0.06 * k), at: h, fov: 32, focus: 0.75, dof: 1.0 }; } },
    // the same click, slowed: side-on, the hall's width across the frame; her figure dim, the fronts bright
    { id: 'C2', t0: B.every, t1: B.awall, set: 'apt', tag: true, clock: BE_C3CLOCK, decay: 0.0004, gain: 1.4, heroGain: 1.0,
      look: (t) => Object.assign(hallDim(), { hero: 0.16 + 0.1 * MathX.smooth(t, B.reflects, B.reflects + 1) }),
      cam: beMove(B.every, B.awall, [V(-1.1, 1.75, 2.36), V(-1.17, 1.45, 3.4), 72], [V(-1.32, 1.95, 2.3), V(-1.12, 1.4, 3.3), 74], { dof: 0, ease: Ease.inOutSine }) },
    // three clicks, three answers
    { id: 'C4a', t0: B.awall, t1: B.adoor, set: 'apt', tag: true, look: () => hallDim(),
      cam: () => ({ pos: V(3.65, 1.5, 3.5), at: V(2.85, 1.3, 2.25), fov: 50, focus: 1, dof: 0 }) },
    { id: 'C4b', t0: B.adoor, t1: B.afurn, set: 'apt', tag: true, look: () => hallDim(),
      cam: () => ({ pos: V(5.25, 1.6, 2.35), at: V(4.15, 1.05, 3.62), fov: 60, focus: 1, dof: 0 }) },
    { id: 'C4c', t0: B.afurn, t1: B.each, set: 'apt', tag: true, look: () => hallDim(),
      cam: beMove(B.afurn, B.each, [V(2.6, 1.5, 2.3), V(1.85, 1.0, 3.5), 54], [V(2.5, 1.45, 2.35), V(1.85, 1.0, 3.5), 50], { dof: 0 }) },
    // the science cutaway (drawn by the HUD over darkness)
    { id: 'C5', t0: B.each, t1: B.andif, set: 'apt', chart: true, look: () => BE_DARK,
      cam: () => ({ pos: V(0, 30, 0), at: V(0, 40, 0.01), fov: 40, focus: 1, dof: 0 }) },
    // the walk: behind her, the hall ahead returns in pieces with each click
    { id: 'C6', t0: B.andif, t1: B.name, set: 'apt', tag: true, decay: 0.5, look: () => hallDim(),
      cam: (t) => { const x = MathX.lerp(-2.2, -0.35, Ease.inOutSine(MathX.ramp(t, B.andif, B.name))); return { pos: V(x, 1.72, 2.82), at: V(x + 3, 1.3, 3.05), fov: 54, focus: 2, dof: 0 }; } },
    { id: 'C7', t0: B.name, t1: B.over, set: 'apt', decay: 0.8, look: () => hallDim(0.8),
      cam: beMove(B.name, B.over, [V(-0.6, 1.75, 2.75), V(2.4, 1.25, 3.1), 54], [V(-1.4, 1.95, 2.6), V(2.4, 1.2, 3.1), 58], { dof: 0 }) },
    // from above: the bedroom and the hall cut open; the two clicks
    { id: 'C8', t0: B.over, t1: B.s4, set: 'apt', tag: true, plan: true, decay: 0.9, gain: 1.6, heroGain: 1.0, look: () => Object.assign(hallDim(), { hero: 0.25 }),
      cam: beMove(B.over, B.s4, [V(0.9, 15, 4.6), V(0.9, 0, 2.2), 27], [V(0.5, 13.5, 4.1), V(0.5, 0, 2.1), 27], { dof: 0, ease: Ease.outSine }) },
  ];
  const i = BE_SHOTS.findIndex((s) => s.id === 'X');
  BE_SHOTS.splice(i, 0, ...S);
  BE_SHOTS[BE_SHOTS.length - 1].t0 = B.s4;
})();

// ---- pulses (film clock, except C2's, which live on the slowed clock)
function beSchedule3(app) {
  const P = app.pulses, B = BE, set = app.sets.apt, H = set.hero2;
  // the mouth position at each click (pose the hero at that time, read it)
  const mouthAt = (t) => { beHeroS3(H, t, set); return beMouth(H); };
  // C2: one click on the slowed clock (t = 0 is the click; speed is the real 343 m/s), plus its first reflections
  const m0 = mouthAt(B.every + 1);
  P.add({ t: 0, p: m0, kind: 0, speed: 343, w: 0.07, life: 1, str: 1.4, set: 'apt', clock: 'c3' });
  for (const W of set.hallWalls.slice(0, 2)) { const d = m0.clone().sub(W.p).dot(W.n); P.add({ t: 0, p: m0.clone().addScaledVector(W.n, -2 * d), kind: 0, speed: 343, w: 0.06, life: 1, str: 0.6, set: 'apt', clock: 'c3', echo: true }); }
  set._c3mouth = m0;
  // C4: three surfaces (visual speed 2.6 m/s: slowed ≈ 130×)
  for (const [sh, t] of [['C4a', B.awall + 0.05], ['C4b', B.adoor + 0.04], ['C4c', B.afurn + 0.04]]) P.add({ t, p: mouthAt(t + 0.01), kind: 0, speed: 4.2, w: 0.08, life: 2, str: 1.5, set: 'apt', shot: sh });
  // C6/C7: clicks while she walks
  for (const t of B.clicks3) { const m = mouthAt(t + 0.01); for (const sh of ['C6', 'C7']) P.add({ t, p: m, kind: 0, speed: 3.2, w: 0.08, life: 2.6, str: 1.2, set: 'apt', shot: sh }); }
  // C8: from above (the hall, the doorways, the bookcase)
  for (const t of B.clicks8) { const m = mouthAt(t + 0.01); P.add({ t, p: m, kind: 0, speed: 2.8, w: 0.1, life: 3.2, str: 1.5, set: 'apt', shot: 'C8' }); set._c8m = m; }
}

// per frame: wavefront shells, the click's ring at her mouth
function beFx3(app, set, t, shot) {
  const B = BE, W = set.waves, R = set.rings;
  if (shot.id === 'C2') {
    const T = shot.clock.value(t), m = set._c3mouth;
    W.click({ t: 0, p: m }, T, set.hallWalls.slice(0, 2), { speed: 343, life: 1, a: 0.32 });
    R.source(m, [B.k1], t, { r: 0.06, a: 0.6, dur: 0.5, col: '#9ff6ff' });
  }
  if (/^C4|C6|C7/.test(shot.id)) for (const q of app.pulses.list) if (q.shot === shot.id && t > q.t && t < q.t + 0.5) R.source(q.p, [q.t], t, { r: 0.07, a: 0.8, dur: 0.45, col: '#9ff6ff' });
}

// SCIENCE (C5): the three echo signatures, drawn as what a microphone at her ear would record after one click
// (amplitude vs time, 0–20 ms). Wall 1.7 m away: one clean return at 2·1.7/343 ≈ 9.9 ms. Open doorway: the sound
// passes through; only weak, late returns from the room beyond. Bookcase ≈ 1 m: many small returns spread over a few
// ms (shelves, books at different depths). Illustrative shapes; the delays follow from the distances.
function beDrawSignatures(cv, k) {
  const x = cv.getContext('2d'), W = cv.width, H = cv.height;
  x.clearRect(0, 0, W, H);
  x.fillStyle = 'rgba(4, 8, 14, 0.92)'; x.fillRect(0, 0, W, H);
  const rows = [['A WALL', '#62f3ff', (ms) => 0.95 * Math.exp(-Math.pow((ms - 9.9) / 0.18, 2)) + 0.25 * Math.exp(-Math.pow((ms - 15.6) / 0.25, 2))],
    ['A DOORWAY', '#7a5cff', (ms) => 0.12 * Math.exp(-Math.pow((ms - 17.5) / 0.6, 2)) + 0.08 * Math.exp(-Math.pow((ms - 19.2) / 0.5, 2))],
    ['A BOOKCASE', '#ffb05a', (ms) => { let v = 0; const r = new RNG(9); for (let i = 0; i < 14; i++) { const c = 5.6 + r.range(0, 3.2), a = r.range(0.15, 0.5) * Math.exp(-(c - 5.6) / 3); v += a * Math.exp(-Math.pow((ms - c) / 0.09, 2)); } return v; }]];
  const x0 = 520, x1 = 1680, msMax = 20, rowH = 230, top = 170;
  x.font = '600 26px Inter, sans-serif'; x.textBaseline = 'middle';
  x.fillStyle = 'rgba(220, 240, 255, 0.85)'; x.fillText('ONE CLICK  →  WHAT COMES BACK TO THE EAR', x0, 100);
  rows.forEach(([name, col, f], i) => {
    const y0 = top + i * rowH + rowH / 2;
    x.fillStyle = col; x.font = '600 30px Inter, sans-serif'; x.fillText(name, 170, y0);
    x.strokeStyle = 'rgba(255,255,255,0.15)'; x.lineWidth = 2; x.beginPath(); x.moveTo(x0, y0 + 70); x.lineTo(x1, y0 + 70); x.stroke();
    // the click itself at 0 ms (what she sends)
    x.strokeStyle = 'rgba(255,255,255,0.55)'; x.lineWidth = 3; x.beginPath(); x.moveTo(x0, y0 + 70); x.lineTo(x0, y0 - 80); x.stroke();
    x.strokeStyle = col; x.lineWidth = 3; x.shadowColor = col; x.shadowBlur = 14; x.beginPath();
    const n = 900, upto = Math.floor(n * MathX.clamp(k * 1.15 - i * 0.08, 0, 1));
    for (let j = 0; j <= upto; j++) { const ms = (j / n) * msMax, v = f(ms) * Math.cos(ms * 30); const X = x0 + (x1 - x0) * (j / n), Y = y0 + 70 - Math.abs(v) * 140; if (j) x.lineTo(X, Y); else x.moveTo(X, Y); }
    x.stroke(); x.shadowBlur = 0;
  });
  x.fillStyle = 'rgba(220, 240, 255, 0.7)'; x.font = '500 24px Inter, sans-serif';
  for (const ms of [0, 5, 10, 15, 20]) x.fillText(ms + ' ms', x0 + (x1 - x0) * ms / msMax - 24, top + 3 * rowH + 20);
}
